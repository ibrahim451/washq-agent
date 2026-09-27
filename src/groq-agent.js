// Groq AI Agent — Free AI using OpenAI GPT-OSS 120B (via Groq)
// Free tier: 1,000 requests/day per model
// Sign up free at: https://console.groq.com
// Note: Groq deprecated llama-3.3-70b-versatile on June 17, 2026 for
// free/developer tiers. openai/gpt-oss-120b is their recommended
// replacement — same tool-calling support, comparable quality.
//
// Production hardening in this file:
//  - Re-checks availability immediately before writing a booking (closes
//    most of the race-condition window where two callers could grab the
//    same slot at nearly the same time)
//  - Sends an SMS confirmation after every successful booking

const Groq = require("groq-sdk");
const NodeCache = require("node-cache");
const logger = require("./logger");
const {
  getAvailableSlots, SERVICES, recommendService, getPrice, DAY_NAMES, BUSINESS_HOURS,
} = require("./business-data");
const { getBookingsForDate, saveBooking, generateConfirmationId } = require("./sheets-service");
const { sendConfirmationSMS } = require("./sms-service");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const sessionCache = new NodeCache({ stdTTL: 3600 }); // 1 hour per call session

// ─────────────────────────────────────────────────────
// SYSTEM PROMPT — WashQ Agent Identity
// ─────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Alex, a friendly and professional voice receptionist for WashQ Detailing (also called Westchester Auto Spa HQ) in White Plains, NY.

## CRITICAL VOICE RULES
- Keep responses SHORT — 2 to 3 sentences for voice calls
- No bullet points, no lists, no markdown — you are SPEAKING
- Spell out prices: say "ninety-nine ninety-nine" or "about a hundred dollars" not "$99.99"
- Spell out times: say "ten AM" not "10:00 AM"
- Use natural speech: "Great!", "Absolutely!", "Sure thing!", "Of course!"
- When listing options, say them naturally: "I have eight AM, ten AM, or one PM available"

## BUSINESS INFO
Name: WashQ Detailing / Westchester Auto Spa HQ
Address: 15 Independence Street, White Plains, New York
Phone: 9-1-4, 5-7-3, 6-6-4-0
Website: wash-Q-detailing.com

## HOURS
Monday: CLOSED
Tuesday and Wednesday: 8 AM to 5:30 PM
Thursday, Friday, Saturday: 8 AM to 6 PM
Sunday: 9 AM to 4 PM

## SERVICES (memorize these — you'll be asked frequently)

MOST POPULAR PACKAGES:
- Copper Treatment: cars about $100, SUVs $110 to $125 — 2 hours — basic full detail
- Bronze Treatment: cars about $200, SUVs $210 to $230 — 2.5 hours — deep clean with leather protection
- Silver Treatment: cars about $285, SUVs $295 to $315 — 3.5 hours — thorough with shampooing
- Gold Treatment: cars about $450, SUVs about $500 — 7 hours — premium full restoration

SPECIALTY SERVICES:
- Full Interior: cars about $245, SUVs $260 to $270 — 3.5 hours — interior only
- Full Exterior: cars about $275, SUVs about $300 — 4 hours — exterior with paint sealant
- Detox Treatment: cars about $110, SUVs about $120 — 1.5 hours — steam disinfection, 90-day BioShield protection

PREMIUM SERVICES (require in-person assessment first):
- Paint Correction: from about $400 for Stage 1, $600 Stage 2, $900 Stage 3
- Ceramic Coating: body from about $900, windows about $200, rims from about $150
- Window Tinting: full car about $285, full SUV about $300, 3 back windows about $200

## SERVICE RECOMMENDATIONS
- "quick wash / regular" → Copper Treatment
- "deep clean / dirty inside" → Bronze or Silver
- "stains / pet hair / smells" → Silver Treatment (plus pet hair add-on)
- "best you have / new car prep" → Gold Treatment
- "inside only" → Full Interior Treatment
- "outside only / paint protection" → Full Exterior Treatment
- "disinfect / germs / COVID" → Detox Treatment
- "scratches / paint faded" → Paint Correction (needs assessment first)
- "long-lasting protection" → Ceramic Coating (needs assessment first)
- "tinting / privacy / heat" → Window Tinting

## BOOKING FLOW — Follow This Exact Order
1. Find out what they need
2. Ask about vehicle type (regular car, mid-size SUV, SUV, or 3-row SUV)
3. Recommend service + give approximate price
4. Ask for preferred date
5. Call check_availability to get open slots
6. Offer them 2–3 time options (never guess — always check first)
7. Collect: full name → phone number → email (say it's optional)
8. Confirm everything out loud: "So that's [service] for your [vehicle] on [day] at [time] for about [price]. Is that right?"
9. Call book_appointment ONLY after they say yes
10. Give confirmation number and address. Mention a text confirmation is on its way.

## TOOLS YOU CAN USE
- check_availability: Check open slots for a date and service
- get_next_available: Find the next available slots (use when customer is flexible)
- book_appointment: Save the booking (ONLY after verbal confirmation from customer)

## IMPORTANT RULES
- NEVER confirm a time without calling check_availability first
- Always read back ALL details before booking
- If book_appointment comes back with a conflict, apologize once, briefly, and immediately offer to check other times — don't dwell on it
- For paint correction and ceramic coating: mention assessment is needed first
- Monday we are CLOSED — suggest nearest available day
- Pet hair removal is an add-on: about $25 extra on any package
- Walk-ins are welcome but appointments are recommended

## FALLBACKS
- Can't answer something: "For that, I'd recommend calling us at 9-1-4, 5-7-3, 6-6-4-0 or visiting wash-Q-detailing.com"
- Payment: "We accept all major credit cards, cash, and digital payments"
- Wait times: "Most services are same-day. Copper and Bronze take 2 to 3 hours. Gold takes most of the day."`;

// ─────────────────────────────────────────────────────
// TOOL DEFINITIONS (Groq / OpenAI format)
// ─────────────────────────────────────────────────────
const TOOLS = [
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Check available appointment time slots for a specific date and service. Always call this before offering or confirming any time.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "The date to check in YYYY-MM-DD format. Today's date should be calculated relative to when the call happens.",
          },
          service_id: {
            type: "string",
            enum: ["copper","bronze","silver","gold","full-interior","full-exterior","detox","paint-sealant-combo","paint-correction","ceramic-coating","window-tinting"],
            description: "Which service to check availability for",
          },
        },
        required: ["date", "service_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_next_available",
      description: "Find the next available appointment slots across the next 2 weeks. Use when customer says 'soonest', 'anytime', or doesn't have a specific date.",
      parameters: {
        type: "object",
        properties: {
          service_id: {
            type: "string",
            enum: ["copper","bronze","silver","gold","full-interior","full-exterior","detox","paint-sealant-combo","paint-correction","ceramic-coating","window-tinting"],
          },
        },
        required: ["service_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description: "Save a confirmed appointment. ONLY call this after you have repeated all details to the customer and they have verbally confirmed with 'yes'.",
      parameters: {
        type: "object",
        properties: {
          customer_name:   { type: "string", description: "Customer's full name" },
          customer_phone:  { type: "string", description: "Customer's phone number" },
          customer_email:  { type: "string", description: "Email address (may be empty string if not provided)" },
          service_id:      { type: "string", description: "Service identifier" },
          service_name:    { type: "string", description: "Human-readable service name" },
          vehicle_type:    { type: "string", enum: ["car","midSizeSUV","suv","suv3Row"] },
          date:            { type: "string", description: "Date in YYYY-MM-DD format" },
          time_display:    { type: "string", description: "Human-readable time like '10:00 AM'" },
          start_at:        { type: "string", description: "ISO 8601 start datetime" },
          price:           { type: "string", description: "Price quoted to customer" },
          notes:           { type: "string", description: "Any special requests" },
        },
        required: ["customer_name","customer_phone","service_id","vehicle_type","date","time_display","start_at"],
      },
    },
  },
];

// ─────────────────────────────────────────────────────
// TOOL EXECUTOR
// ─────────────────────────────────────────────────────
async function executeTool(name, args) {
  logger.info("Tool call", { name, args });

  if (name === "check_availability") {
    const { date, service_id } = args;
    const svc = SERVICES[service_id];
    if (!svc) return { error: "Unknown service" };

    const bookedTimes = await getBookingsForDate(date);
    const dateObj = new Date(date + "T00:00:00");
    const dayName = DAY_NAMES[dateObj.getDay()];
    const result = getAvailableSlots(date, bookedTimes, svc.durationMins);

    if (result.closed) {
      return {
        available: false,
        reason: "closed",
        message: `We are closed on ${dayName}. Monday is always closed. We're open Tuesday through Saturday 8 AM to 6 PM, and Sunday 9 AM to 4 PM.`,
      };
    }

    if (result.slots.length === 0) {
      return {
        available: false,
        reason: "fully_booked",
        message: `We don't have any openings on ${dayName} ${date} for the ${svc.name}. Would you like to check another date?`,
      };
    }

    return {
      available: true,
      date: dayName + " " + new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" }),
      service: svc.name,
      duration: `${svc.durationMins / 60} hours`,
      hours: result.hours,
      slots: result.slots.slice(0, 5).map((s) => ({ time: s.time, startAt: s.startAt })),
    };
  }

  if (name === "get_next_available") {
    const { service_id } = args;
    const svc = SERVICES[service_id];
    if (!svc) return { error: "Unknown service" };

    const options = [];
    const today = new Date();

    for (let i = 1; i <= 14 && options.length < 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (d.getDay() === 1) continue; // Skip Monday

      const dateStr = d.toISOString().split("T")[0];
      const bookedTimes = await getBookingsForDate(dateStr);
      const result = getAvailableSlots(dateStr, bookedTimes, svc.durationMins);

      if (!result.closed && result.slots.length > 0) {
        options.push({
          date: DAY_NAMES[d.getDay()] + " " + d.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
          dateStr,
          firstSlot: result.slots[0].time,
          startAt: result.slots[0].startAt,
          totalSlots: result.slots.length,
        });
      }
    }

    if (options.length === 0) {
      return { message: "No openings in the next 2 weeks. Please call us at (914) 573-6640 directly." };
    }

    return { service: svc.name, nextAvailableOptions: options };
  }

  if (name === "book_appointment") {
    const svc = SERVICES[args.service_id];

    // ── Double-booking guard ──────────────────────────────────────
    // Google Sheets has no row-level locking, so two callers could in
    // theory both pass check_availability for the same slot before
    // either one writes. This re-checks immediately before the write,
    // shrinking that window from "however long the call took" down to
    // a single API round trip — the practical risk for a one-location
    // business taking phone bookings is very low after this.
    const freshBooked = await getBookingsForDate(args.date);
    const stillOpen = !freshBooked.some((bookedISO) => {
      const bookedTime = new Date(bookedISO).getTime();
      const requestedTime = new Date(args.start_at).getTime();
      return Math.abs(bookedTime - requestedTime) < (svc?.durationMins || 120) * 60 * 1000;
    });

    if (!stillOpen) {
      logger.warn("Booking conflict at write time", { date: args.date, start_at: args.start_at });
      return {
        success: false,
        conflict: true,
        message: "That exact time was just booked by someone else moments ago. Let's find another time — want me to check what else is open that day?",
      };
    }

    const confirmationId = generateConfirmationId();
    const dateObj = new Date(args.date + "T12:00:00");

    const saveResult = await saveBooking({
      date: args.date,
      time: args.time_display,
      durationMins: svc?.durationMins || 120,
      customerName: args.customer_name,
      phone: args.customer_phone,
      email: args.customer_email || "",
      serviceId: args.service_id,
      serviceName: args.service_name || svc?.name || args.service_id,
      vehicleType: args.vehicle_type,
      price: args.price || getPrice(args.service_id, args.vehicle_type),
      confirmationId,
      notes: args.notes || "",
    });

    const dateDisplay = dateObj.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
    });

    // ── SMS confirmation (best-effort — never blocks or fails the booking) ──
    let smsResult = { sent: false };
    if (saveResult?.success !== false) {
      smsResult = await sendConfirmationSMS({
        toPhone: args.customer_phone,
        customerName: args.customer_name,
        serviceName: args.service_name || svc?.name,
        dateDisplay,
        timeDisplay: args.time_display,
        confirmationId,
      });
    }

    return {
      success: true,
      confirmationId,
      smsSent: smsResult.sent,
      summary: {
        customer: args.customer_name,
        service: args.service_name || svc?.name,
        date: dateDisplay,
        time: args.time_display,
        address: "15 Independence Street, White Plains, New York",
      },
      message: `Appointment confirmed! Confirmation number: ${confirmationId}.${smsResult.sent ? " A text confirmation is on its way." : ""}`,
    };
  }

  return { error: `Unknown tool: ${name}` };
}

// ─────────────────────────────────────────────────────
// MAIN CONVERSATION FUNCTION
// ─────────────────────────────────────────────────────
async function getAIResponse(callSid, userMessage) {
  let session = sessionCache.get(callSid) || { messages: [] };

  const today = new Date();
  const todayStr = today.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const contextualMessage = session.messages.length === 0
    ? `[Today is ${todayStr}. Current time zone: US Eastern.]\n\nCustomer: ${userMessage}`
    : userMessage;

  session.messages.push({ role: "user", content: contextualMessage });

  let finalText = "";
  let loopCount = 0;

  while (loopCount < 5) {
    loopCount++;

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...session.messages,
      ],
      tools: TOOLS,
      tool_choice: "auto",
      max_tokens: 400,
      temperature: 0.6,
    });

    const choice = response.choices[0];

    if (choice.finish_reason === "tool_calls") {
      session.messages.push(choice.message);

      for (const tc of choice.message.tool_calls) {
        let args;
        try { args = JSON.parse(tc.function.arguments); }
        catch { args = {}; }

        const result = await executeTool(tc.function.name, args);

        session.messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
    } else {
      finalText = choice.message.content || "";
      session.messages.push({ role: "assistant", content: finalText });
      break;
    }
  }

  if (session.messages.length > 30) {
    session.messages = [session.messages[0], ...session.messages.slice(-28)];
  }

  sessionCache.set(callSid, session);
  return finalText || "I'm sorry, I had trouble responding. Could you say that again?";
}

function clearSession(callSid) {
  sessionCache.del(callSid);
}

module.exports = { getAIResponse, clearSession };