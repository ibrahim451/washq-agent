# WashQ Detailing — Voice AI Agent (100% Free Build)
## Westchester Auto Spa HQ · White Plains, NY

---

## The Free Stack

| What it does | Tool | Cost |
|---|---|---|
| Phone number + call handling | **Twilio** | Free trial ($15 credit ≈ 1,000 min) |
| Speech-to-text | **Twilio built-in** | $0 extra — included in calls |
| Text-to-speech | **Twilio Polly Neural** | $0 extra — included in calls |
| AI brain / conversation | **Groq API** (Llama 3.3 70B) | **Free forever** |
| Appointment storage | **Google Sheets** | **Free forever** |
| Server hosting | **Render.com** | **Free forever** |
| **TOTAL** | | **$0 to build · $0 to run** |

> **Honest note on Twilio:** Phone calls use real telecom lines and can't be
> completely free. The $15 free trial covers 1,000+ minutes — roughly 2–3 months
> of calls for a small business. After that, calls cost ~$0.014/min + $1/month
> for the number ≈ $3–5/month. Everything else stays free forever.

---

## Project File Structure

```
washq-free-agent/
├── src/
│   ├── server.js          ← Main app (Twilio webhooks)
│   ├── groq-agent.js      ← AI brain using Groq (free)
│   ├── sheets-service.js  ← Appointments via Google Sheets (free)
│   └── business-data.js   ← WashQ services & pricing
├── .env.example
├── package.json
├── Procfile               ← For Render.com
└── GUIDE.md               ← This file
```

---

## Phase 1 — Account Setup (30 minutes, all free)

### Step 1.1 — Twilio (Phone Number)

1. Go to **https://twilio.com** → click "Sign Up Free"
2. Verify your email and phone number
3. In the Console, go to **Phone Numbers → Manage → Buy a Number**
4. Search area code **914** (Westchester, NY)
5. Buy one number (free from your $15 trial credit)
6. Save these three values:
   ```
   Account SID    → looks like: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Auth Token     → looks like: a long random string
   Phone Number   → looks like: +19145550001
   ```
   Find SID and Token at: https://console.twilio.com → top of dashboard

### Step 1.2 — Groq (Free AI)

1. Go to **https://console.groq.com** → click "Sign Up"
2. Once logged in, go to **API Keys → Create API Key**
3. Name it "washq-agent" → click Create
4. Copy the key immediately (shown only once)
   ```
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Step 1.3 — Google Sheets (Free Appointment Storage)

**Part A — Create the Spreadsheet:**
1. Go to **https://sheets.google.com** (sign in with any Google account)
2. Click **+ Blank** to create a new spreadsheet
3. Rename it: "WashQ Appointments"
4. In Row 1, add these exact headers across columns A through M:
   ```
   A: Date
   B: Time
   C: Duration_Mins
   D: Customer_Name
   E: Phone
   F: Email
   G: Service_ID
   H: Service_Name
   I: Vehicle_Type
   J: Price
   K: Confirmation_ID
   L: Notes
   M: Status
   ```
5. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_SHEET_ID/edit
   ```

**Part B — Create a Service Account (lets your server write to the sheet):**
1. Go to **https://console.cloud.google.com**
2. Click **Select a Project → New Project** → name it "washq-agent" → Create
3. In the search bar, type "Google Sheets API" → click it → click **Enable**
4. Go to **IAM & Admin → Service Accounts → + Create Service Account**
5. Name: "washq-agent" → click Create and Continue → click Done
6. Click on the service account you just created
7. Go to **Keys → Add Key → Create new key → JSON** → click Create
8. A `.json` file downloads — **keep this safe**
9. Open the JSON file, copy two values:
   ```
   client_email  → looks like: washq-agent@your-project.iam.gserviceaccount.com
   private_key   → the long key starting with -----BEGIN PRIVATE KEY-----
   ```

**Part C — Share the sheet with the service account:**
1. Open your Google Sheet
2. Click **Share** (top right)
3. Paste the `client_email` from above
4. Set role to **Editor** → click Send

### Step 1.4 — Render.com (Free Hosting)

1. Go to **https://render.com** → Sign Up (free)
2. No setup needed yet — you'll deploy in Phase 4

---

## Phase 2 — Local Setup (20 minutes)

### Step 2.1 — Install Tools

```bash
# Install Node.js if you don't have it: https://nodejs.org (download v20 LTS)
# Verify install:
node --version    # should show v20.x.x
npm --version     # should show 10.x.x

# Install ngrok for local testing:
# Go to https://ngrok.com → Sign up → Download → install

# Verify ngrok:
ngrok --version
```

### Step 2.2 — Set Up the Project

```bash
# Clone or create the project folder
mkdir washq-free-agent
cd washq-free-agent

# Install all dependencies (from package.json)
npm install
```

### Step 2.3 — Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Open .env in any text editor and fill in your values
# (Instructions for each variable are inside .env.example)
```

Your completed `.env` should look like:
```
PORT=3000
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+19145550001
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=washq-agent@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxxxx\n-----END PRIVATE KEY-----\n"
```

> **Important:** When pasting the private key into .env, keep it on one line
> with `\n` between each line. Wrap the entire key in double quotes.

### Step 2.4 — Start the Server

```bash
# Start the app
npm run dev

# You should see:
# 🚀 WashQ Voice Agent running on port 3000
# 📋 Google Sheets: Connected to WashQ Appointments
```

### Step 2.5 — Test Without a Phone Call

```bash
# In a new terminal window, test the AI directly:
node tests/test-agent.js
```

This runs 3 sample conversations and shows you exactly what the agent
says — no phone call needed.

---

## Phase 3 — Connect Your Phone Number (15 minutes)

### Step 3.1 — Expose Your Local Server

```bash
# In a new terminal (keep npm run dev running)
ngrok http 3000

# You'll see output like:
# Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
# Copy the https URL
```

### Step 3.2 — Configure Twilio Webhooks

1. Go to https://console.twilio.com
2. Click **Phone Numbers → Manage → Active Numbers**
3. Click your phone number
4. Under **Voice & Fax → "A Call Comes In":**
   - Change dropdown to **Webhook**
   - Enter: `https://abc123.ngrok-free.app/call/incoming`
   - Method: **HTTP POST**
5. Under **"Call Status Changes":**
   - Enter: `https://abc123.ngrok-free.app/call/status`
6. Click **Save Configuration**

### Step 3.3 — Make a Test Call

Call your Twilio phone number from any phone.
You should hear: *"Thank you for calling WashQ Detailing..."*

**Test these scenarios:**
- Say "I want to book a car wash"
- Say "What's your most popular service?"
- Say "How much for window tinting on my SUV?"
- Say "When can I come in this week?"
- Say "My dog made a mess of my car"

---

## Phase 4 — Deploy to Render.com (Free Forever)

### Step 4.1 — Put Your Code on GitHub

```bash
# If you don't have git set up:
git init
git add .
git commit -m "WashQ voice agent initial commit"

# Create a repo on github.com (free), then:
git remote add origin https://github.com/yourusername/washq-voice-agent.git
git push -u origin main
```

### Step 4.2 — Deploy on Render.com

1. Go to https://render.com → Log in
2. Click **New → Web Service**
3. Connect your GitHub account → select your repo
4. Configure:
   ```
   Name:         washq-voice-agent
   Region:       US East (Ohio)
   Branch:       main
   Runtime:      Node
   Build Command: npm install
   Start Command: node src/server.js
   Instance Type: Free
   ```
5. Click **Advanced → Add Environment Variable** for each value in your `.env`
   (add them one by one)
6. Click **Create Web Service**
7. Wait ~3 minutes for first deploy
8. Copy your Render URL: `https://washq-voice-agent.onrender.com`

> **Note on Render free tier:** Free services "sleep" after 15 minutes of
> inactivity. The first call after sleep has a ~30-second delay while it
> wakes up. To avoid this, set up a free uptime monitor at
> https://uptimerobot.com — it pings your server every 5 minutes and
> keeps it awake.

### Step 4.3 — Update Twilio Webhooks

Go back to Twilio → your phone number and update the webhooks to use
your Render URL instead of ngrok:
```
https://washq-voice-agent.onrender.com/call/incoming
https://washq-voice-agent.onrender.com/call/status
```

### Step 4.4 — Final Test

Call your Twilio number. The agent should answer instantly.
Check your Google Sheet — bookings should appear there automatically.

---

## Google Sheet — Viewing Your Bookings

Every time someone books through the phone agent, a row is added to
your Google Sheet automatically. You can:
- Sort by Date column to see upcoming appointments
- Filter by Status column (confirmed / cancelled)
- Share the sheet with the WashQ team for easy access
- Set up Google Sheets notifications to email you on new rows

To get email alerts for new bookings:
1. In your Sheet, click **Tools → Notification rules**
2. Select "Any changes are made" → "Email - right away"
3. Save

---

## What the Agent Knows (Full WashQ Knowledge)

### Services & Pricing

**Packages:**
- Copper Treatment: Cars $99.99 | Mid SUV $109.99 | SUV $119.99 | 3-Row $124.99 (2 hrs)
- Bronze Treatment: Cars $199.99 | Mid SUV $209.99 | SUV $219.99 | 3-Row $229.99 (2.5 hrs)
- Silver Treatment: Cars $284.99 | Mid SUV $294.99 | SUV $299.99 | 3-Row $314.99 (3.5 hrs)
- Gold Treatment: Cars $449.99 | SUV $499.99 | 3-Row $519.99 (7 hrs)

**Interior/Exterior:**
- Full Interior: Cars $244.99 | SUV $259.99 | 3-Row $269.99 (3.5 hrs)
- Full Exterior: Cars $274.99 | SUV $299.99 (4 hrs)
- Detox Treatment: Cars $109.99 | SUV $119.99 | 3-Row $124.99 (1.5 hrs)
- Paint Sealant Combo: Cars $149.99 | SUV $174.99 (3 hrs)

**Premium (requires assessment):**
- Paint Correction: Stage 1 from $399.99 | Stage 2 from $599.99 | Stage 3 from $899.99
- Ceramic Coating: Body from $899.99 | Windows $199.99 | Rims $149.99+
- Window Tinting: Full car $284.99 | Full SUV $299.99 | 3 back windows $199.99

### Business Hours
- Monday: CLOSED
- Tuesday–Wednesday: 8 AM – 5:30 PM
- Thursday–Saturday: 8 AM – 6 PM
- Sunday: 9 AM – 4 PM

### Location & Contact
- 15 Independence St, White Plains, NY 10606
- (914) 573-6640
- washqdetailing.com

---

## Full Cost Breakdown

| Item | Monthly Cost |
|---|---|
| Groq AI (Llama 3.3 70B) | $0 — free forever |
| Google Sheets (appointments) | $0 — free forever |
| Render.com (hosting) | $0 — free forever |
| Twilio phone number | $1.15/month |
| Twilio call minutes (est. 200 calls × 3 min) | ~$8.40/month |
| **Total after trial** | **~$9.55/month** |

The Twilio $15 free trial covers your first ~1,000 minutes — roughly
2–3 months of real calls before any cost at all.

---

## Checklist Before Going Live

- [ ] Test call from 3 different phones
- [ ] Test booking flow end-to-end (check row appears in Google Sheet)
- [ ] Test Monday call (should say closed)
- [ ] Test "what's the soonest available?" query
- [ ] Test paint correction / ceramic inquiry (should require consultation)
- [ ] Set up UptimeRobot to keep Render server awake
- [ ] Share Google Sheet with WashQ business owner
- [ ] Set up email notifications on new Sheet rows
- [ ] Update Google Sheet with any blocked-off dates / holiday closures
- [ ] Give Twilio number to WashQ to forward their main line
