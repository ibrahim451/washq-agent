# WashQ Detailing — Voice AI Appointment Agent

An AI phone agent for WashQ Detailing (Westchester Auto Spa HQ) that answers
calls, recommends services, checks real-time availability, books
appointments, texts a confirmation, and gives the business a clean
dashboard to see it all — built entirely on free-tier tools.

**Live cost: $0 to build and test. ~$0–9/month to run** (Twilio calls are
the only line item that isn't free forever — see `GUIDE.md` for the exact
breakdown).

---

## Read these in order

| Order | Document | What it covers |
|---|---|---|
| 1 | **START_HERE.md** | The ELI5 walkthrough — literally every click, from "just downloaded these files" to a live agent taking calls |
| 2 | GUIDE.md | Architecture overview, the free tool stack, cost breakdown |
| 3 | COMPLETE_STEPS.md | The same setup with more explanation per step, for when START_HERE.md needs backup |
| 4 | PRODUCTION_HARDENING.md | Deeper detail on the security layer, referenced from inside START_HERE.md |

---

## Quick start

```bash
npm install
cp .env.example .env        # fill in your keys — see COMPLETE_STEPS.md
npm run dev                  # start the server locally
node tests/test-agent.js     # test full conversations, no phone needed
node tests/test-security.js  # verify hardening (after PRODUCTION_HARDENING.md)
```

---

## Project structure

```
washq-agent/
├── README.md                 ← you are here
├── GUIDE.md                  ← architecture overview
├── COMPLETE_STEPS.md         ← full setup walkthrough
├── PRODUCTION_HARDENING.md   ← security & reliability upgrade
├── package.json
├── .env.example
├── Procfile
├── src/
│   ├── server.js             ← Express app, Twilio webhooks, admin route
│   ├── groq-agent.js         ← AI conversation engine (Groq / Llama 3.3)
│   ├── sheets-service.js     ← Google Sheets appointment storage
│   ├── sms-service.js        ← SMS booking confirmations
│   ├── admin-view.js         ← HTML renderer for the /admin dashboard
│   ├── logger.js             ← structured logging
│   └── business-data.js      ← WashQ services, pricing, hours
└── tests/
    ├── test-agent.js         ← conversation simulator (no phone needed)
    └── test-security.js      ← verifies signature validation, rate limiting, admin auth
```

---

## What the agent can do

- Answer calls and greet callers by voice (Twilio + built-in neural TTS — no extra cost)
- Understand natural requests ("my car smells like a wet dog") and recommend the right WashQ service
- Quote accurate pricing by vehicle type across all 11 services
- Check real availability against actual business hours and existing bookings
- Offer the next available slots when the caller is flexible on timing
- Collect customer details and read them back for confirmation before booking
- Save the booking to a live Google Sheet the business can view anytime
- Text the customer a confirmation with date, time, and confirmation number
- Correctly say WashQ is closed on Mondays and route around it
- Flag paint correction and ceramic coating as needing an in-person assessment first

## What's new in the production-hardened version

| Feature | Why it matters |
|---|---|
| Twilio signature validation | Only real Twilio requests can trigger the agent — stops spoofed calls from burning your usage |
| Rate limiting | A backstop cap on requests per minute, independent of the above |
| Double-booking guard | Re-checks the slot immediately before saving, closing almost all of the race window |
| SMS confirmations | Customer gets a text with the details, not just what they remember from the call |
| Admin dashboard (`/admin`) | Password-protected, mobile-friendly view of every booking — no more digging through a raw spreadsheet |
| Structured logging | Every call, tool call, and error logged in a format that's actually searchable on Render |

All of it runs on the same free tiers as the base build — nothing here adds cost.

---

*WashQ Detailing / Westchester Auto Spa HQ — 15 Independence St, White Plains, NY — (914) 573-6640*
