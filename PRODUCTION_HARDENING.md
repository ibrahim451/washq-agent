# WashQ Voice Agent — Production Hardening
## Security, reliability, SMS, and an admin view — step by step

Do this AFTER you've completed `COMPLETE_STEPS.md` and have a working agent
that answers calls and books appointments. This layer is what makes it safe
and reliable enough to hand to the business for real customer calls.

---

## What's being added and why

| Feature | The problem it solves |
|---|---|
| **Twilio signature validation** | Right now, anyone who discovers your webhook URL (it's not secret — it's in every request) could POST fake call data to it. They couldn't make your phone ring, but they could make your server think a call is happening, run up your Groq usage, and even trigger fake bookings and SMS sends. This checks a cryptographic signature that only Twilio can produce. |
| **Rate limiting** | A backstop in case the above is ever misconfigured, or someone just hammers the endpoint. Caps requests per minute per IP. |
| **Double-booking guard** | Google Sheets has no row locking. If two people called at almost the exact same moment and both wanted 10 AM Saturday, both could theoretically get told "yes, available" before either booking is saved. This re-checks the instant before writing. |
| **SMS confirmation** | Right now the customer only has what they remember from the call. A text with the confirmation number and time is standard practice and cuts down on "wait, when was my appointment?" callbacks. |
| **Admin dashboard** | A raw Google Sheet works, but it's not great on a phone and has zero access control beyond "who has the link." This adds a proper, password-protected, mobile-friendly view. |
| **Structured logging** | When something goes wrong at 6 PM on a Saturday, you need to find out why fast. Structured logs make Render's log search actually useful instead of a wall of text. |

Every one of these runs on tools you already have — **no new cost.**

---

## Step 1 — Install the one new dependency

`express-rate-limit` is the only new package. In your project folder:

```bash
npm install
```

(It's already listed in the updated `package.json` you downloaded — this
just pulls it in.)

---

## Step 2 — Add the new environment variables

Open your `.env` file and add these three new lines (they're already in
the updated `.env.example` for reference):

```env
PUBLIC_BASE_URL=https://your-app.onrender.com
SKIP_TWILIO_VALIDATION=false
ADMIN_PASSWORD=choose_a_strong_password_here
```

### What goes in `PUBLIC_BASE_URL`

This has to match **exactly** what Twilio uses to reach you, because
signature validation checks the signature against this exact URL.

- **While testing locally with ngrok:** use your current ngrok URL, e.g.
  `https://abc123.ngrok-free.app`
  > ⚠️ Free ngrok URLs change every time you restart ngrok. If you restart
  > it, update this value and restart your server too.
- **Once deployed on Render:** use your permanent Render URL, e.g.
  `https://washq-voice-agent.onrender.com`
  This one never changes, so you only set it once.

### What to do about `SKIP_TWILIO_VALIDATION`

- **Local testing (recommended for convenience):** set it to `true`.
  Restarting ngrok constantly and keeping `PUBLIC_BASE_URL` in sync is
  annoying during development — this lets you skip that while testing
  locally.
- **Render / production:** set it to `false` (or just leave the line out
  entirely — `false` is the default). **Never leave this as `true` in
  production** — it disables the entire protection.

### Choosing `ADMIN_PASSWORD`

Pick something you wouldn't mind a staff member typing on their phone —
a short passphrase like `WashQ-White-Plains-26` works better than a
random string, and is still hard to guess. The username is always `admin`
(not configurable, to keep this simple).

---

## Step 3 — Restart and check the startup log

```bash
npm run dev
```

Look for these two lines in the output:

```
🔒 Twilio signature validation: ENABLED
🔑 Admin dashboard: configured
```

If signature validation says "DISABLED (dev mode)" and you're testing
locally, that's expected if you set `SKIP_TWILIO_VALIDATION=true`. If it
says that in production, go fix your Render environment variables.

If the admin dashboard says "NOT configured," you forgot to set
`ADMIN_PASSWORD`.

---

## Step 4 — Run the automated security check

This hits your own server with a few deliberately-bad requests and
confirms it rejects them correctly, instead of you having to guess.

```bash
node tests/test-security.js
```

Expected output against a correctly configured **local dev** server
(with `SKIP_TWILIO_VALIDATION=true`):

```
✓ PASS Health endpoint responds correctly
ℹ  Unsigned webhook request returned status 200 (expected 403)
✓ PASS Admin dashboard correctly requires authentication (401)
✓ PASS Admin dashboard correctly rejects a wrong password (401)
```

That one `ℹ` line instead of a pass is correct and expected in dev mode —
it's telling you validation is intentionally off. Once deployed to Render
(with validation on), run it again against your live URL:

```bash
node tests/test-security.js https://washq-voice-agent.onrender.com
```

This time you should see all four lines as `✓ PASS`. If the signature
one still shows 200 instead of 403, double check `SKIP_TWILIO_VALIDATION`
is `false` in your Render environment variables.

---

## Step 5 — Test the double-booking guard

You don't need special tools for this — just try to create a genuine
conflict:

1. Call your number and start booking a Copper Treatment for, say,
   Thursday at 10 AM. Get all the way to "should I go ahead and book
   that?" but **don't say yes yet** — leave that call open.
2. From a second phone, call in and book that exact same Thursday 10 AM
   slot for Copper Treatment, all the way through to confirmation.
3. Now go back to the first call and say "yes."

**Expected result:** the first call should get a friendly message that
the slot was just taken, and Alex should offer to check other times
instead of creating a duplicate booking.

This is manual because simulating true simultaneous requests needs tools
outside the scope of a phone test — but this sequential test exercises
the exact same code path and confirms the guard works.

---

## Step 6 — Test SMS confirmation

1. Call your number using **your own real cell phone**
2. Complete a full booking, giving your real phone number when asked
3. After Alex gives you the confirmation number, check your texts

You should receive something like:

```
WashQ Detailing: Hi John! Your Copper Treatment is confirmed for
Thursday, August 27 at 10:00 AM. Confirmation: WQ-K7MN4P.
15 Independence St, White Plains NY. Questions? Call (914) 573-6640.
```

If you don't get a text within ~30 seconds, check your server logs for
a line starting with `SMS send failed` — it'll include the specific
Twilio error message.

**Common cause:** your Twilio trial account can usually only text
numbers you've verified in the Twilio console. Go to **Console → Phone
Numbers → Verified Caller IDs** and verify your own cell number if
you're still on the free trial. Once WashQ upgrades out of trial mode,
this restriction goes away.

---

## Step 7 — View the admin dashboard

1. In your browser, go to:
   - Local: `http://localhost:3000/admin`
   - Live: `https://washq-voice-agent.onrender.com/admin`
2. Your browser will show a login prompt
3. Username: `admin`
4. Password: whatever you set as `ADMIN_PASSWORD`
5. You should see a clean table of upcoming appointments, with a small
   stats bar at the top (upcoming / total / past)

This page reads live from the same Google Sheet, so anything booked over
the phone shows up here immediately on refresh — no separate database
to keep in sync.

**Give this URL and password to whoever at WashQ will be checking the
schedule day to day** — it's much easier on a phone than opening the
raw spreadsheet app.

---

## Step 8 — If you're already deployed, update Render

If you deployed to Render before doing this hardening pass:

1. Push the updated code:
   ```bash
   git add .
   git commit -m "Add production hardening: security, SMS, admin dashboard"
   git push origin main
   ```
   Render redeploys automatically (~2 minutes).
2. While that's deploying, go to your Render dashboard → your service →
   **Environment** tab
3. Add the three new variables from Step 2 (`PUBLIC_BASE_URL`,
   `SKIP_TWILIO_VALIDATION`, `ADMIN_PASSWORD`) with their production
   values
4. Render will redeploy again automatically when you save environment
   variables
5. Re-run the security test against your live URL (Step 4) to confirm

---

## Troubleshooting

### Every real phone call now gets rejected with "Forbidden"
`PUBLIC_BASE_URL` doesn't exactly match what Twilio is calling. Check:
- No trailing slash (`https://x.onrender.com` not `https://x.onrender.com/`)
- `https://` not `http://`
- If testing locally, that it matches your **current** ngrok URL — these
  change every restart on the free ngrok tier

### `node tests/test-security.js` shows the signature test failing (200 instead of 403) even on Render
`SKIP_TWILIO_VALIDATION` is still set to `true` in your Render environment
variables. Go to Render → Environment → change it to `false` → save.

### Admin dashboard shows "not configured" (503) even after setting the password
Environment variables on Render only take effect after a redeploy. If you
just added `ADMIN_PASSWORD`, wait for the automatic redeploy to finish
(watch the "Events" tab), then refresh.

### Two customers still ended up with the same slot
The guard closes the window down to roughly one network round-trip
(typically under a second), but doesn't make it mathematically
impossible — Google Sheets simply isn't a transactional database. For a
single-location car wash taking phone bookings, this residual risk is
very small. If WashQ ever wants it fully eliminated, that requires
moving appointment storage to a real database with row locking (Square's
own booking system, Postgres, etc.) — a bigger change than this free
stack is built for.

### SMS never arrives, and it's not the trial-verification issue above
Check the server logs for the exact Twilio error. The two next most
common causes: the phone number the customer gave doesn't parse as a
valid 10-digit US number, or your Twilio account has run out of trial
SMS credit (separate from voice minutes — check Twilio Console → Billing).

---

## Quick verification checklist

- [ ] `npm install` run after updating package.json
- [ ] `.env` has `PUBLIC_BASE_URL`, `SKIP_TWILIO_VALIDATION`, `ADMIN_PASSWORD`
- [ ] Startup log shows signature validation and admin dashboard status
- [ ] `node tests/test-security.js` — all checks pass (or expected `ℹ` in local dev mode)
- [ ] Manual double-booking test performed once
- [ ] Real SMS received on a test booking
- [ ] `/admin` loads and shows the test bookings
- [ ] If already on Render: environment variables updated there too, and
      the security test re-run against the live URL
