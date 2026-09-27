// WashQ Detailing — Voice AI Agent (Production Hardened)
// Free stack: Twilio + Groq (free AI) + Google Sheets (free appointments)
// Hardened with: Twilio signature validation, rate limiting, double-booking
// guard, SMS confirmations, admin dashboard, structured logging.
// Run locally: npm run dev  |  Deploy free: render.com

require("dotenv").config();
require("express-async-errors");

const express = require("express");
const twilio = require("twilio");
const rateLimit = require("express-rate-limit");
const logger = require("./logger");
const { getAIResponse, clearSession } = require("./groq-agent");
const { initSheets, getAllBookings } = require("./sheets-service");
const { renderAdminHTML } = require("./admin-view");

const app = express();

// Render (and most hosts) sit behind a reverse proxy. Without this, Express
// thinks every request is plain "http" and the client IP is the proxy's IP —
// which breaks both signature URL-matching and rate limiting.
app.set("trust proxy", 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const VOICE_SETTINGS = { voice: "Polly.Joanna-Neural", language: "en-US" };

const GATHER_OPTS = {
  input: "speech",
  action: "/call/respond",
  speechTimeout: "auto",
  speechModel: "phone_call",
  enhanced: "true",
  timeout: 8,
  language: "en-US",
};

// ─────────────────────────────────────────────────
// SECURITY: verify requests genuinely come from Twilio.
// Without this, anyone who finds your webhook URL could POST fake call
// data and burn through your Groq/SMS usage, or feed the agent garbage.
// See PRODUCTION_HARDENING.md for the full explanation and setup.
// ─────────────────────────────────────────────────
function getFullUrl(req) {
  if (process.env.PUBLIC_BASE_URL) {
    return `${process.env.PUBLIC_BASE_URL}${req.originalUrl}`;
  }
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  return `${proto}://${req.get("host")}${req.originalUrl}`;
}

function validateTwilioRequest(req, res, next) {
  if (process.env.SKIP_TWILIO_VALIDATION === "true") {
    return next();
  }

  const signature = req.headers["x-twilio-signature"];
  const url = getFullUrl(req);
  const isValid =
    signature && twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN, signature, url, req.body);

  if (!isValid) {
    logger.warn("Rejected request with invalid Twilio signature", {
      path: req.path, url, hasSignature: !!signature,
    });
    return res.status(403).send("Forbidden — invalid signature");
  }
  next();
}

// ─────────────────────────────────────────────────
// SECURITY: rate limit the call webhooks — generous for real call
// traffic, tight enough to stop someone hammering the endpoint.
// ─────────────────────────────────────────────────
const callLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests — please try again shortly.",
});

app.use("/call", callLimiter, validateTwilioRequest);

// ─────────────────────────────────────────────────
// HELPER: Build TwiML response with speech + listen
// ─────────────────────────────────────────────────
function buildResponse(speechText, gatherAction = "/call/respond") {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say(VOICE_SETTINGS, speechText);
  twiml.gather({ ...GATHER_OPTS, action: gatherAction });
  twiml.say(VOICE_SETTINGS, "I'm still here. How can I help you?");
  twiml.redirect("/call/no-input");
  return twiml.toString();
}

// ─────────────────────────────────────────────────
// ROUTE: Incoming call — greet the caller
// ─────────────────────────────────────────────────
app.post("/call/incoming", (req, res) => {
  const callSid = req.body.CallSid;
  logger.info("Incoming call", { callSid, from: req.body.From || "unknown" });

  const greeting =
    "Thank you for calling WashQ Detailing in White Plains! " +
    "I'm Alex, your virtual assistant. " +
    "I can help you book an appointment, check availability, " +
    "or answer questions about our detailing services. " +
    "How can I help you today?";

  res.type("text/xml");
  res.send(buildResponse(greeting));
});

// ─────────────────────────────────────────────────
// ROUTE: Process what the caller said
// ─────────────────────────────────────────────────
app.post("/call/respond", async (req, res) => {
  const callSid = req.body.CallSid;
  const speech = (req.body.SpeechResult || "").trim();
  const confidence = parseFloat(req.body.Confidence || "0");

  logger.info("Speech received", { callSid, speech, confidence: confidence.toFixed(2) });

  if (!speech || confidence < 0.3) {
    res.type("text/xml");
    return res.send(buildResponse(
      "I'm sorry, I didn't quite catch that. Could you say that again please?"
    ));
  }

  const agentResponse = await getAIResponse(callSid, speech);
  logger.info("Agent response", { callSid, response: agentResponse });

  const isGoodbye = /thank you for calling|have a great|goodbye|see you (soon|then|saturday|sunday)/i.test(agentResponse);

  if (isGoodbye) {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(VOICE_SETTINGS, agentResponse);
    twiml.pause({ length: 1 });
    twiml.hangup();
    res.type("text/xml");
    return res.send(twiml.toString());
  }

  res.type("text/xml");
  res.send(buildResponse(agentResponse));
});

// ─────────────────────────────────────────────────
// ROUTE: No input detected (caller went quiet)
// ─────────────────────────────────────────────────
app.post("/call/no-input", async (req, res) => {
  res.type("text/xml");
  res.send(buildResponse(
    "Are you still there? Take your time — how can I help you today?"
  ));
});

// ─────────────────────────────────────────────────
// ROUTE: Call status changes (for cleanup)
// ─────────────────────────────────────────────────
app.post("/call/status", (req, res) => {
  const { CallSid, CallStatus, CallDuration, From } = req.body;
  logger.info("Call status update", {
    callSid: CallSid, status: CallStatus, duration: CallDuration, from: From,
  });

  const endStates = ["completed", "failed", "busy", "no-answer", "canceled"];
  if (endStates.includes(CallStatus)) {
    clearSession(CallSid);
  }
  res.sendStatus(200);
});

// ─────────────────────────────────────────────────
// ADMIN DASHBOARD — protected view of all bookings.
// Username is always "admin"; password comes from ADMIN_PASSWORD.
// Stays disabled (503) rather than open if that variable isn't set.
// ─────────────────────────────────────────────────
function requireAdminAuth(req, res, next) {
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).send(
      "Admin dashboard is not configured. Set ADMIN_PASSWORD in your environment variables."
    );
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.set("WWW-Authenticate", 'Basic realm="WashQ Admin"');
    return res.status(401).send("Authentication required");
  }

  const decoded = Buffer.from(authHeader.split(" ")[1], "base64").toString();
  const [user, pass] = decoded.split(":");

  if (user !== "admin" || pass !== process.env.ADMIN_PASSWORD) {
    res.set("WWW-Authenticate", 'Basic realm="WashQ Admin"');
    logger.warn("Failed admin login attempt", { ip: req.ip });
    return res.status(401).send("Invalid credentials");
  }
  next();
}

app.get("/admin", requireAdminAuth, async (req, res) => {
  const bookings = await getAllBookings();
  res.send(renderAdminHTML(bookings));
});

// ─────────────────────────────────────────────────
// Health check (also used by UptimeRobot to keep the free
// Render server awake — ping every 5 min)
// ─────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "WashQ Voice Agent",
    ai: "Groq (llama-3.3-70b-versatile) — free",
    storage: "Google Sheets — free",
    security: {
      twilioSignatureValidation: process.env.SKIP_TWILIO_VALIDATION === "true" ? "disabled" : "enabled",
      adminDashboard: process.env.ADMIN_PASSWORD ? "configured" : "not configured",
    },
    uptime: Math.round(process.uptime()) + "s",
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

async function start() {
  await initSheets();

  app.listen(PORT, () => {
    logger.info(`WashQ Voice Agent running on port ${PORT}`);
    console.log("");
    console.log("🚀 WashQ Voice Agent (Production Hardened) is running!");
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Health:  http://localhost:${PORT}/health`);
    console.log(`   Admin:   http://localhost:${PORT}/admin`);
    console.log("");
    console.log("   Twilio webhooks:");
    console.log(`   Incoming:  POST /call/incoming`);
    console.log(`   Status:    POST /call/status`);
    console.log("");
    console.log(`   🔒 Twilio signature validation: ${process.env.SKIP_TWILIO_VALIDATION === "true" ? "DISABLED (dev mode)" : "ENABLED"}`);
    console.log(`   🔑 Admin dashboard: ${process.env.ADMIN_PASSWORD ? "configured" : "NOT configured — set ADMIN_PASSWORD"}`);
    console.log("   💰 Running cost: $0 (AI + Storage + Hosting are free)");
  });
}

start().catch((err) => {
  logger.error("Failed to start server", { error: err.message });
  process.exit(1);
});
