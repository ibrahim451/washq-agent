/**
 * Security smoke tests for the WashQ Voice Agent.
 * Run this AFTER the server is running (locally or on Render) to confirm
 * the production-hardening features actually work — don't just trust
 * that the code looks right.
 *
 * Usage:
 *   node tests/test-security.js                                  (defaults to localhost:3000)
 *   node tests/test-security.js http://localhost:3000
 *   node tests/test-security.js https://washq-voice-agent.onrender.com
 *
 * Uses Node's built-in fetch (Node 18+) — no extra dependencies needed.
 */

const BASE_URL = process.argv[2] || "http://localhost:3000";

const colors = { green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", reset: "\x1b[0m" };
function pass(msg) { console.log(`${colors.green}✓ PASS${colors.reset} ${msg}`); }
function fail(msg) { console.log(`${colors.red}✗ FAIL${colors.reset} ${msg}`); }
function info(msg) { console.log(`${colors.yellow}ℹ${colors.reset}  ${msg}`); }

async function testHealthEndpoint() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (res.status === 200 && data.status === "ok") {
      pass("Health endpoint responds correctly");
      info(`   Signature validation: ${data.security?.twilioSignatureValidation}`);
      info(`   Admin dashboard: ${data.security?.adminDashboard}`);
      return data;
    } else {
      fail("Health endpoint returned unexpected data");
      return null;
    }
  } catch (err) {
    fail(`Health endpoint unreachable: ${err.message}`);
    return null;
  }
}

async function testTwilioSignatureRejection(healthData) {
  try {
    const res = await fetch(`${BASE_URL}/call/incoming`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "CallSid=TEST123",
      // deliberately no X-Twilio-Signature header
    });

    const validationIntentionallyOff = healthData?.security?.twilioSignatureValidation === "disabled";

    if (res.status === 403) {
      pass("Unsigned webhook request correctly rejected (403)");
    } else if (res.status === 200 && validationIntentionallyOff) {
      info("Signature validation is OFF (SKIP_TWILIO_VALIDATION=true) — fine for local dev, just confirm it's 'false' before going live");
    } else if (res.status === 200) {
      fail("Unsigned webhook request was ACCEPTED — check SKIP_TWILIO_VALIDATION isn't 'true' in production");
    } else {
      info(`Unsigned webhook request returned status ${res.status} (expected 403)`);
    }
  } catch (err) {
    fail(`Could not test signature validation: ${err.message}`);
  }
}

async function testAdminRequiresAuth() {
  try {
    const res = await fetch(`${BASE_URL}/admin`);
    if (res.status === 401) {
      pass("Admin dashboard correctly requires authentication (401)");
    } else if (res.status === 503) {
      info("Admin dashboard not configured yet (set ADMIN_PASSWORD to enable)");
    } else {
      fail(`Admin dashboard returned ${res.status} without credentials — expected 401`);
    }
  } catch (err) {
    fail(`Could not test admin auth: ${err.message}`);
  }
}

async function testAdminWrongPassword() {
  try {
    const creds = Buffer.from("admin:definitely-wrong-password").toString("base64");
    const res = await fetch(`${BASE_URL}/admin`, {
      headers: { Authorization: `Basic ${creds}` },
    });
    if (res.status === 401) {
      pass("Admin dashboard correctly rejects a wrong password (401)");
    } else if (res.status === 503) {
      info("Admin dashboard not configured yet — skipping password check");
    } else {
      fail(`Wrong password was accepted! Status: ${res.status}`);
    }
  } catch (err) {
    fail(`Could not test wrong password: ${err.message}`);
  }
}

async function main() {
  console.log(`\nTesting security hardening on: ${BASE_URL}\n${"─".repeat(50)}`);
  await testHealthEndpoint();
  await testTwilioSignatureRejection();
  await testAdminRequiresAuth();
  await testAdminWrongPassword();
  console.log(`${"─".repeat(50)}\nDone. Review any FAIL lines above before going live.\n`);
}

main().catch((err) => {
  console.error("Test run failed:", err.message);
  process.exit(1);
});
