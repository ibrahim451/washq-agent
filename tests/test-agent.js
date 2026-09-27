/**
 * Test the WashQ agent without making a phone call.
 * Runs 3 realistic conversation scenarios against Groq AI directly.
 *
 * Usage: node tests/test-agent.js
 */

require("dotenv").config();
const { getAIResponse } = require("../src/groq-agent");
const { initSheets } = require("../src/sheets-service");

const SCENARIOS = [
  {
    name: "Book a Silver Treatment for an SUV",
    turns: [
      "Hi, I'd like to book a detail for my SUV",
      "It's a Honda CR-V, so a regular SUV",
      "Inside is pretty bad — dog hair everywhere and it smells",
      "What would you recommend for that?",
      "That sounds good, how about this Saturday?",
      "Let's do 10 AM",
      "My name is Maria Gonzalez",
      "My number is 914-555-0199",
      "No email. Yes, please go ahead and book it!",
    ],
  },
  {
    name: "Service inquiry — window tinting",
    turns: [
      "How much do you charge for window tinting?",
      "It's a regular sedan, Toyota Camry",
      "I want all windows done",
      "How long does it take?",
      "Do I need an appointment or can I walk in?",
    ],
  },
  {
    name: "Next available for a quick wash",
    turns: [
      "When's the soonest I can get my car washed?",
      "Just a basic wash and clean, nothing fancy",
      "Anytime works this week",
      "Tuesday morning sounds great. What time?",
    ],
  },
];

const colors = {
  cyan: "\x1b[36m", yellow: "\x1b[33m",
  green: "\x1b[32m", reset: "\x1b[0m", dim: "\x1b[2m",
};

async function runScenario(scenario, index) {
  const callSid = `TEST-CALL-${index}-${Date.now()}`;
  console.log(`\n${"═".repeat(60)}`);
  console.log(`${colors.green}TEST ${index + 1}: ${scenario.name}${colors.reset}`);
  console.log("═".repeat(60));

  for (const turn of scenario.turns) {
    console.log(`\n${colors.cyan}👤 Customer:${colors.reset} "${turn}"`);

    const response = await getAIResponse(callSid, turn);
    console.log(`${colors.yellow}🤖 Alex:${colors.reset} "${response}"`);

    // Small delay to avoid hitting rate limits
    await new Promise(r => setTimeout(r, 800));
  }
}

async function main() {
  console.log(`${colors.green}`);
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  WashQ Voice Agent — Conversation Tester     ║");
  console.log("║  AI: Groq (GPT-OSS 120B) — Free              ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`${colors.reset}`);

  if (!process.env.GROQ_API_KEY) {
    console.error("❌ GROQ_API_KEY not found in .env file.");
    console.error("   Sign up free at https://console.groq.com");
    process.exit(1);
  }

  // This test used to skip connecting to Google Sheets entirely — it
  // called the AI logic directly without ever running the same startup
  // step server.js does, so bookings silently never saved no matter what
  // was in .env. This line fixes that.
  const sheetsOk = await initSheets();
  if (!sheetsOk) {
    console.log(`${colors.yellow}⚠  Google Sheets did not connect — bookings below will be logged, not saved. Check your .env.${colors.reset}\n`);
  }

  for (let i = 0; i < SCENARIOS.length; i++) {
    await runScenario(SCENARIOS[i], i);
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`${colors.green}✅ All test scenarios completed!${colors.reset}`);
  console.log(`${colors.dim}Note: only TEST 1 (the Silver Treatment booking) actually books an`);
  console.log(`appointment — TEST 2 and TEST 3 are just Q&A and availability checks`);
  console.log(`by design, so it's normal for them not to add a row.${colors.reset}\n`);
}

main().catch(err => {
  console.error("Test failed:", err.message);
  if (err.message.includes("API key")) {
    console.error("Double-check your GROQ_API_KEY in .env");
  }
  process.exit(1);
});