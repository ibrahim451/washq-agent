# WashQ Voice Agent — Complete Step-by-Step Build Guide
## Every single step, every click, every command

---

# PART 1 — BEFORE YOU START

## What you need on your computer

- A computer (Mac, Windows, or Linux)
- An internet connection
- A phone to make test calls
- About 3–4 hours total

You do NOT need to know how to code. Every command is written out exactly.

---

# PART 2 — INSTALL TOOLS ON YOUR COMPUTER

## Step A — Install Node.js

Node.js is the engine that runs the voice agent code.

**On Mac:**
1. Open your browser and go to: **https://nodejs.org**
2. Click the big green button that says **"20.x.x LTS"** (LTS = stable version)
3. A file called `node-v20.x.x.pkg` downloads
4. Double-click that file → click Continue → Continue → Agree → Install
5. Enter your Mac password when asked → click Install Software

**On Windows:**
1. Go to: **https://nodejs.org**
2. Click **"20.x.x LTS"** — downloads a `.msi` file
3. Double-click it → Next → Accept terms → Next → Next → Install
4. Check the box "Automatically install necessary tools" if it appears → Next

**Verify it worked** (both Mac and Windows):
1. Open **Terminal** (Mac: press Cmd+Space, type "terminal", press Enter)
   or **Command Prompt** (Windows: press Windows key, type "cmd", press Enter)
2. Type this and press Enter:
   ```
   node --version
   ```
3. You should see something like: `v20.11.0`
4. Also type:
   ```
   npm --version
   ```
5. You should see something like: `10.2.4`

If you see version numbers, Node.js is installed correctly. ✅

---

## Step B — Install ngrok (for testing with real phone calls)

ngrok creates a temporary public URL that lets Twilio reach your computer.

**On Mac:**
1. Go to: **https://ngrok.com**
2. Click **"Sign up for free"** → create account with email
3. After signing in, click **"Download"** in the top menu
4. Under Mac, click **"Download for Mac"**
5. A `.zip` file downloads — double-click to unzip it
6. You'll see a file called `ngrok` — drag it to your Desktop for now
7. Open Terminal and run:
   ```
   sudo mv ~/Desktop/ngrok /usr/local/bin/
   ```
   Enter your Mac password when asked.

**On Windows:**
1. Go to: **https://ngrok.com** → Sign up free
2. Click **"Download"** → Download for Windows (64-bit)
3. Unzip the downloaded file — you get `ngrok.exe`
4. Move `ngrok.exe` to `C:\Windows\System32\` so it works from anywhere

**Connect your ngrok account (both Mac and Windows):**
1. After signing up at ngrok.com, go to: **https://dashboard.ngrok.com/get-started/your-authtoken**
2. Copy your authtoken (a long string)
3. In Terminal/Command Prompt, paste this (replace YOUR_TOKEN with yours):
   ```
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

**Verify ngrok:**
```
ngrok --version
```
Should show something like: `ngrok version 3.x.x` ✅

---

## Step C — Get the project code onto your computer

1. Create a folder on your Desktop called `washq-agent`
2. Copy all 8 files you downloaded into that folder:
   ```
   washq-agent/
   ├── GUIDE.md
   ├── COMPLETE_STEPS.md  (this file)
   ├── package.json
   ├── Procfile
   ├── .env.example
   ├── src/
   │   ├── server.js
   │   ├── groq-agent.js
   │   ├── sheets-service.js
   │   └── business-data.js
   └── tests/
       └── test-agent.js
   ```

3. Open Terminal/Command Prompt and navigate to that folder:
   ```
   cd Desktop/washq-agent
   ```
   (On Windows it might be: `cd C:\Users\YourName\Desktop\washq-agent`)

4. Install the code dependencies:
   ```
   npm install
   ```
   This downloads all the libraries the agent needs. Takes 1–2 minutes.
   You'll see a lot of text scroll by — that's normal.

5. Create your `.env` file:
   ```
   cp .env.example .env
   ```
   On Windows:
   ```
   copy .env.example .env
   ```

You now have a `.env` file in your folder. You'll fill it in during the next steps.

---

# PART 3 — CREATE YOUR FREE ACCOUNTS

## ACCOUNT 1 — Twilio (Phone Number)
**Time: ~15 minutes | Cost: FREE ($15 trial credit)**

### 3.1 Create the account

1. Go to: **https://twilio.com**
2. Click **"Sign up and start building"**
3. Fill in: First name, Last name, Email, Password
4. Click **"Start your free trial"**
5. Check your email for a verification link — click it
6. Back on Twilio, it asks "Which Twilio product are you here to use?"
   → Select **"Voice"**
7. "What do you plan to build?"
   → Select **"Other"**
8. "How do you plan to use Twilio?"
   → Select **"With code"**
9. "What is your preferred coding language?"
   → Select **"Node.js"**
10. Click **"Get Started with Twilio"**

### 3.2 Verify your phone number

Twilio requires you to verify your real phone number:
1. Click **"Get a Twilio phone number"** or go to **Console → Phone Numbers**
2. Before you can buy a number, Twilio asks you to verify your personal number
3. Click **"Verify a phone number"**
4. Enter your personal mobile number
5. Choose SMS or call → enter the code they send

### 3.3 Buy a phone number

1. In the Twilio Console, go to: **Phone Numbers → Manage → Buy a Number**
   (Left sidebar → Phone Numbers → Manage → Buy a Number)
2. In the search box, type **914** (Westchester area code)
3. Make sure **"Voice"** checkbox is checked
4. Click **"Search"**
5. You'll see a list of available numbers — pick any one
6. Click **"Buy"** → **"Buy This Number"**
7. The number costs $1.15 from your $15 free credit — you still have $13.85 left

### 3.4 Save your credentials

1. Go to: **https://console.twilio.com** (the main dashboard)
2. Look at the top of the page — you'll see two boxes:
   - **Account SID** — looks like: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token** — click the eye icon to reveal it
3. Open your `.env` file in any text editor (Notepad, TextEdit, VS Code)
4. Fill in these three lines:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=paste_your_auth_token_here
   TWILIO_PHONE_NUMBER=+19145550001
   ```
   Replace the last line with your actual purchased number (include the +1)

---

## ACCOUNT 2 — Groq (Free AI Brain)
**Time: ~5 minutes | Cost: FREE forever**

Groq runs Llama 3.3 70B — a very capable AI — completely free.
Free limits: 14,400 requests/day and 500,000 tokens/day.
A car wash business would use maybe 1,000–5,000 tokens per day. You're fine.

### 3.5 Create Groq account

1. Go to: **https://console.groq.com**
2. Click **"Sign Up"**
3. Sign up with Google (easiest) or with email
4. If using email: enter email → check inbox → click verification link

### 3.6 Get your Groq API Key

1. Once logged in, look at the left sidebar
2. Click **"API Keys"**
3. Click the **"+ Create API Key"** button
4. In the Name box, type: `washq-agent`
5. Click **"Submit"**
6. A key appears — it starts with `gsk_`
7. **Copy it immediately** — it will NOT be shown again
   (If you lose it, just delete it and create a new one)

### 3.7 Save to .env

Open your `.env` file and fill in:
```
GROQ_API_KEY=gsk_paste_your_key_here
```

---

## ACCOUNT 3 — Google Sheets (Free Appointment Storage)
**Time: ~25 minutes | Cost: FREE forever**

This is the most steps, but take it slowly — it's not hard.
When done, every booking the agent makes will appear as a row in a Google Sheet.

### 3.8 Create the Google Sheet

1. Go to: **https://sheets.google.com**
   (Sign in with any Google/Gmail account)
2. Click the big **"+"** button (Blank spreadsheet)
3. At the top left, click where it says "Untitled spreadsheet"
4. Type: `WashQ Appointments` → press Enter

5. Now add the column headers. Click cell **A1** and type: `Date`
6. Press **Tab** to move to B1, type: `Time`
7. Keep pressing Tab and typing each header:
   ```
   A1: Date
   B1: Time
   C1: Duration_Mins
   D1: Customer_Name
   E1: Phone
   F1: Email
   G1: Service_ID
   H1: Service_Name
   I1: Vehicle_Type
   J1: Price
   K1: Confirmation_ID
   L1: Notes
   M1: Status
   ```
8. To make the headers bold: click cell A1, hold Shift, click M1
   Then press **Ctrl+B** (or Cmd+B on Mac) to bold them
9. To freeze the header row: click **View → Freeze → 1 row**

### 3.9 Get your Sheet ID

Look at your browser's address bar. The URL looks like:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
```
The part between `/d/` and `/edit` is your Sheet ID.
In the example above: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`

Copy your Sheet ID and add it to `.env`:
```
GOOGLE_SHEET_ID=paste_your_sheet_id_here
```

### 3.10 Create Google Cloud Project

This lets your server write to the sheet automatically.

1. Go to: **https://console.cloud.google.com**
2. Sign in with the same Google account you used for Sheets
3. At the top, click **"Select a project"** → **"New Project"**
4. Project name: `washq-agent`
5. Leave Location as "No organization"
6. Click **"Create"**
7. Wait a few seconds, then click **"Select Project"** when the notification appears

### 3.11 Enable Google Sheets API

1. In the search bar at the top of Google Cloud Console, type:
   `Google Sheets API`
2. Click on **"Google Sheets API"** in the results
3. Click the blue **"Enable"** button
4. Wait a moment — the page refreshes when it's enabled ✅

### 3.12 Create a Service Account

A service account is like a robot user that your server uses to log into Google Sheets.

1. In the left sidebar, click **"IAM & Admin"** → **"Service Accounts"**
2. Click **"+ Create Service Account"** at the top
3. **Service account name:** `washq-agent`
4. **Service account ID:** will auto-fill as `washq-agent` (leave it)
5. **Description:** `WashQ voice agent appointment writer`
6. Click **"Create and Continue"**
7. For "Grant this service account access to project":
   - Click the **"Role"** dropdown
   - Type "Editor" in the search box
   - Select **"Editor"**
8. Click **"Continue"**
9. Skip the "Grant users access" section
10. Click **"Done"**

### 3.13 Download the service account key

1. You should see your service account listed: `washq-agent@washq-agent-xxxxx.iam.gserviceaccount.com`
2. Click on it
3. Click the **"Keys"** tab
4. Click **"Add Key"** → **"Create new key"**
5. Select **"JSON"** → click **"Create"**
6. A JSON file downloads to your computer — it has a name like `washq-agent-xxxxxxxxxx.json`
7. **Keep this file safe** — it gives access to your Google account's sheets

### 3.14 Get credentials from the JSON file

1. Open the downloaded JSON file in a text editor (Notepad / TextEdit)
2. Find these two values:
   ```json
   "client_email": "washq-agent@washq-agent-xxxxx.iam.gserviceaccount.com",
   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...(very long)...\n-----END PRIVATE KEY-----\n",
   ```
3. Copy `client_email` value and add to `.env`:
   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL=washq-agent@washq-agent-xxxxx.iam.gserviceaccount.com
   ```
4. For the private key — this needs special handling:
   - Copy everything between the outer quotes (including `-----BEGIN...END-----`)
   - In your `.env` file, wrap it in double quotes:
   ```
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBAD...(yours)...\n-----END PRIVATE KEY-----\n"
   ```
   > ⚠️ Important: The key must stay on ONE line in .env with literal `\n` characters.
   > Do NOT press Enter to make it multi-line. It should look like one long line.

### 3.15 Share the Google Sheet with the service account

1. Go back to your Google Sheet (`WashQ Appointments`)
2. Click the green **"Share"** button (top right)
3. In the "Add people and groups" box, paste your service account email:
   `washq-agent@washq-agent-xxxxx.iam.gserviceaccount.com`
4. Make sure the role says **"Editor"** (not Viewer)
5. **Uncheck** "Notify people" (it'll fail because it's a robot, not a real person)
6. Click **"Share"**

The sheet is now connected. ✅

---

## ACCOUNT 4 — Render.com (Free Hosting)
**Time: ~3 minutes now, ~10 minutes at deploy time | Cost: FREE**

1. Go to: **https://render.com**
2. Click **"Get Started for Free"**
3. Click **"Continue with GitHub"** (easiest option) or sign up with email
4. That's it for now — you'll use Render in Part 6 when you deploy

---

# PART 4 — TEST WITHOUT A PHONE CALL FIRST

Before connecting any phone, test the AI brain directly. This is much faster.

## 4.1 Start the server

In your Terminal (inside the `washq-agent` folder):
```
npm run dev
```

You should see:
```
🚀 WashQ Free Voice Agent is running!
   Local:   http://localhost:3000
   Health:  http://localhost:3000/health
📋 Google Sheets: Connected to WashQ Appointments
```

If you see an error, check the troubleshooting section at the end.

## 4.2 Run the conversation test

Open a **second Terminal window** (keep the first one running).
In the second Terminal, navigate to your folder:
```
cd Desktop/washq-agent
node tests/test-agent.js
```

You'll see 3 full conversations play out, like:
```
TEST 1: Book a Silver Treatment for an SUV
══════════════════════════════════════════

👤 Customer: "Hi, I'd like to book a detail for my SUV"
🤖 Alex: "Welcome! I'd be happy to help. What kind of cleaning are you looking for — something basic, a deep clean, or do you have specific concerns like pet hair or stains?"

👤 Customer: "Inside is pretty bad — dog hair everywhere and it smells"
🤖 Alex: "Got it! For pet hair and odor on an SUV, I'd recommend our Silver Treatment at about $300. It includes seat shampooing, stain treatment, odor treatment, and a full detail. Would that work for you?"
...
```

After the test runs, check your Google Sheet — you'll see test bookings appear as rows.

---

# PART 5 — CONNECT YOUR PHONE NUMBER

Now let's make real phone calls work.

## 5.1 Start ngrok tunnel

Make sure your server is still running (npm run dev in first terminal).
In a **third Terminal window**, run:
```
ngrok http 3000
```

You'll see output like:
```
Session Status    online
Account           your@email.com
Forwarding        https://abc123def456.ngrok-free.app -> http://localhost:3000
```

Copy the `https://abc123def456.ngrok-free.app` URL — you'll use it in Twilio.
**Keep this terminal open. If you close it, the URL stops working.**

## 5.2 Set up Twilio webhooks

1. Go to: **https://console.twilio.com**
2. In the left sidebar: **Phone Numbers → Manage → Active Numbers**
3. Click on your phone number (e.g., +1 914-555-0001)
4. Scroll down to the **"Voice Configuration"** section
5. Under **"A Call Comes In"**:
   - First dropdown: change to **"Webhook"**
   - URL box: paste your ngrok URL + `/call/incoming`
     Example: `https://abc123def456.ngrok-free.app/call/incoming`
   - Method dropdown: **HTTP POST**

6. Under **"Primary Handler Fails"** (or "Call Status Changes"):
   - URL box: paste ngrok URL + `/call/status`
     Example: `https://abc123def456.ngrok-free.app/call/status`
   - Method: **HTTP POST**

7. Scroll to the bottom → click **"Save Configuration"**

## 5.3 Make your first test call

1. Call your Twilio number from any phone
2. You should hear: *"Thank you for calling WashQ Detailing in White Plains! I'm Alex..."*
3. Say: **"I want to book a car wash for my SUV"**
4. Alex should respond and ask about what kind of cleaning you need
5. Go through a full booking — at the end, check your Google Sheet for the new row

## 5.4 Test these specific scenarios

Call your number and try each one:

| What to say | Expected response |
|---|---|
| "What are your hours?" | Tells you Tue–Sat hours, mentions closed Monday |
| "How much for window tinting?" | Quotes $284.99 for car, $299.99 for SUV |
| "I have a dog and my car smells terrible" | Recommends Silver Treatment + mentions pet hair add-on |
| "What's your best package?" | Recommends Gold Treatment, explains what's included |
| "Can I come in Monday?" | Says closed Monday, offers Tuesday or next available |
| "Book me in for Saturday" | Checks availability, offers time slots |
| "Do you do ceramic coating?" | Explains ceramic coating pricing, says assessment needed first |

---

# PART 6 — DEPLOY TO RENDER.COM (Go Live)

After testing works locally, deploy to Render so the agent runs 24/7
without your computer being on.

## 6.1 Put your code on GitHub

GitHub is a free service to store and share code. Render deploys from GitHub.

**If you don't have a GitHub account:**
1. Go to: **https://github.com** → **"Sign up"**
2. Enter username, email, password → Create account
3. Verify your email

**Install git (code version control tool):**
- Mac: Open Terminal, type `git --version` — if not installed, Mac prompts you to install it
- Windows: Download from **https://git-scm.com/download/win** → install with defaults

**Upload your project to GitHub:**

1. Go to **https://github.com** → click **"New"** (green button, top left)
2. Repository name: `washq-voice-agent`
3. Make it **Private** (so your API keys aren't public)
4. Click **"Create repository"**
5. GitHub shows you setup commands. In your Terminal (in the washq-agent folder):

   ```
   git init
   git add .
   git commit -m "WashQ voice agent"
   git branch -M main
   git remote add origin https://github.com/YOURUSERNAME/washq-voice-agent.git
   git push -u origin main
   ```

   Replace `YOURUSERNAME` with your GitHub username.
   GitHub will ask for your username and password.
   
   > Note: GitHub now uses "Personal Access Tokens" instead of passwords.
   > To create one: GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic) → Generate new token → check "repo" → Generate → copy the token → use it as your password.

6. Refresh GitHub — your files should appear there ✅

## 6.2 Deploy on Render.com

1. Go to: **https://render.com** → Log in
2. Click **"New +"** (top right) → **"Web Service"**
3. Click **"Connect account"** under GitHub → authorize Render to see your repos
4. Find `washq-voice-agent` → click **"Connect"**
5. Fill in the deployment settings:
   ```
   Name:           washq-voice-agent
   Region:         US East (Ohio)    ← pick this for best latency
   Branch:         main
   Root Directory: (leave blank)
   Runtime:        Node
   Build Command:  npm install
   Start Command:  node src/server.js
   Instance Type:  Free              ← important! select Free
   ```
6. Scroll down to **"Environment Variables"**
7. Click **"Add Environment Variable"** for each line in your `.env`:

   | Key | Value |
   |---|---|
   | `TWILIO_ACCOUNT_SID` | Your ACxxxxxxx |
   | `TWILIO_AUTH_TOKEN` | Your auth token |
   | `TWILIO_PHONE_NUMBER` | +1914xxxxxxx |
   | `GROQ_API_KEY` | gsk_xxxxxxx |
   | `GOOGLE_SHEET_ID` | Your sheet ID |
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | washq-agent@... |
   | `GOOGLE_PRIVATE_KEY` | -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n |

   > For the private key: paste the full key WITH the `\n` characters.
   > Render handles the newlines correctly.

8. Click **"Create Web Service"**
9. Render starts building — you'll see logs scrolling
10. Wait 3–5 minutes until you see: **"Your service is live"** 🎉
11. Copy your Render URL: `https://washq-voice-agent.onrender.com`

## 6.3 Update Twilio with your Render URL

Now replace the ngrok URLs with your permanent Render URL:

1. Go to Twilio Console → **Phone Numbers → Active Numbers → your number**
2. Under "A Call Comes In", change the URL to:
   ```
   https://washq-voice-agent.onrender.com/call/incoming
   ```
3. Under "Call Status Changes", change to:
   ```
   https://washq-voice-agent.onrender.com/call/status
   ```
4. Click **"Save Configuration"**

## 6.4 Keep the server awake (free UptimeRobot)

Render's free tier sleeps after 15 minutes with no traffic. Fix this in 2 minutes:

1. Go to: **https://uptimerobot.com** → **"Register for FREE"**
2. Enter email, password → Create account
3. Verify your email → Log in
4. Click **"Add New Monitor"**
5. Settings:
   ```
   Monitor Type:  HTTP(s)
   Friendly Name: WashQ Voice Agent
   URL:           https://washq-voice-agent.onrender.com/health
   Monitoring Interval: Every 5 minutes
   ```
6. Click **"Create Monitor"**

UptimeRobot now pings your server every 5 minutes, keeping it awake.
It also emails you if the server ever goes down. All free. ✅

---

# PART 7 — FINAL TESTING CHECKLIST

Do all of these before giving the number to WashQ:

**Basic call flow:**
- [ ] Call the number — Alex answers within 3 seconds
- [ ] Ask "what are your hours" — correct hours given (Mon closed, Sun 9–4)
- [ ] Ask "how much for a basic car wash" — Copper Treatment ~$100 quoted
- [ ] Ask about services for an SUV — prices adjust to SUV pricing

**Booking flow:**
- [ ] Say "book an appointment for Saturday" → gets availability → offers time slots
- [ ] Complete a full booking (name, phone, confirm) → check Google Sheet for the row
- [ ] The confirmation ID (WQ-XXXXXX) is given on the call
- [ ] The booking row appears in Google Sheet within 10 seconds

**Edge cases:**
- [ ] Call on a Monday — should say closed and offer nearest open day
- [ ] Ask about paint correction — should say it needs an in-person assessment
- [ ] Ask about ceramic coating — same, needs assessment
- [ ] Go quiet for 10 seconds — Alex should ask "are you still there?"
- [ ] Say "goodbye" — Alex should wish you well and the call ends

**After the call:**
- [ ] Google Sheet shows date, time, service, name, phone, confirmation ID
- [ ] Sheet row has Status = "confirmed"

---

# PART 8 — HOW WASHQ USES IT DAY TO DAY

## What the business owner does

**View bookings:**
1. Open Google Sheets → "WashQ Appointments"
2. Sort by column A (Date) to see upcoming appointments
3. Can filter by column G (Service_ID) to see all Silver treatments, etc.

**Get emailed on every new booking:**
1. In the Google Sheet, click **Tools → Notification rules**
2. Select: **"Any changes are made"**
3. Select: **"Email — right away"**
4. Click **"Save"**

Now every time someone books through the phone agent, the business owner gets an email immediately.

**Add holidays or blocked dates:**
The agent generates available slots from business hours. To block a day:
- Option 1: Add a fake booking row for that day with Status = "blocked"
- Option 2: Update the `BUSINESS_HOURS` in `src/business-data.js` temporarily

**Forward the existing business line to the Twilio number:**
WashQ's current number is (914) 573-6640. To route those calls to the AI:
1. Call your current phone provider (whoever handles that business line)
2. Ask them to "forward calls to +1 (914) XXX-XXXX" (your Twilio number)
3. They'll set it up in minutes
4. Now all calls to the WashQ number are answered by Alex

OR: Simply publish the Twilio number as the new booking line.

---

# PART 9 — COMMON ERRORS AND FIXES

## Error: "GROQ_API_KEY not found"
**Fix:** Open `.env` file and make sure the line reads:
`GROQ_API_KEY=gsk_your_key_here`
No spaces around the `=` sign. No quotes needed.

## Error: "Google Sheets connection failed"
Common causes:
1. **Wrong private key format** — the key must be on one line with `\n`:
   ```
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
   ```
2. **Sheet not shared** — go to your sheet → Share → add the service account email as Editor
3. **API not enabled** — go to Google Cloud Console and verify "Google Sheets API" shows "Enabled"

## Error: Twilio says "Application Error"
1. Check that ngrok is still running (the URL expires if you close it)
2. Check that your server is still running (`npm run dev`)
3. Look at the Terminal where `npm run dev` is running — it shows all errors

## Error: "No speech detected" on every call
1. Speak more clearly and a bit slower
2. Check that Twilio's speech recognition is enabled (it is by default)
3. Try calling from a quieter environment

## Error: Server on Render keeps crashing
1. In Render dashboard, click your service → **"Logs"** tab
2. Look for the error message and compare to this list
3. Most common cause: missing environment variable → add it in Render dashboard → deploy again

## Server is slow to answer the first call of the day
This is Render's free tier "waking up" (takes ~30 seconds).
Fix: make sure UptimeRobot is set up (Part 6.4) — it keeps the server awake.

## "Error 11200" in Twilio
This means Twilio couldn't reach your server. Check:
- For local testing: is ngrok still running?
- For Render: is your service deployed and healthy?
- Go to `https://your-render-url.onrender.com/health` in a browser — you should see `{"status":"ok"}`

---

# PART 10 — EXAMPLE CONVERSATIONS

See exactly what callers will experience:

## Conversation 1: Standard Booking

```
📞 Caller dials the Twilio number

Alex: "Thank you for calling WashQ Detailing in White Plains!
       I'm Alex, your virtual assistant. I can help you book
       an appointment, check availability, or answer questions
       about our detailing services. How can I help you today?"

Caller: "I want to book my car in for a cleaning this week"

Alex: "I'd be happy to help with that! What kind of cleaning are
       you looking for — a quick wash and shine, a thorough deep
       clean, or something specific like interior shampooing?"

Caller: "A good thorough clean, it's pretty dirty inside"

Alex: "For a thorough interior and exterior clean, I'd recommend
       our Silver Treatment. For a regular car it's about $285
       and takes around 3 and a half hours. It includes seat
       shampooing, stain treatment, leather conditioning, and
       a full hand wash outside. Does that sound good?"

Caller: "Yes that sounds perfect"

Alex: "Great! Do you have a preferred day this week?"

Caller: "Thursday works"

Alex: [checks availability for Thursday]
      "I have openings on Thursday. I have 8 AM, 10 AM,
       and 1 PM available. Which time works best for you?"

Caller: "10 AM"

Alex: "Perfect! Can I get your full name?"

Caller: "John Rodriguez"

Alex: "And a good phone number for you, John?"

Caller: "914-555-0188"

Alex: "And an email address? That's completely optional."

Caller: "No email needed"

Alex: "No problem! Let me confirm everything before I book it.
       That's a Silver Treatment for your car this Thursday
       at 10 AM for about $285. We're at 15 Independence
       Street in White Plains. Is everything correct?"

Caller: "Yes that's right"

Alex: [books the appointment]
      "You're all booked, John! Your confirmation number is
       WQ-K7MN4P. We'll see you this Thursday at 10 AM at
       15 Independence Street. Is there anything else
       I can help you with?"

Caller: "No that's everything, thanks"

Alex: "Wonderful! We look forward to seeing you Thursday.
       Have a great day!"

📞 Call ends
```

## Conversation 2: Service Inquiry

```
Caller: "Hi, how much is ceramic coating?"

Alex: "Ceramic coating starts at about $900 for the full body,
       and we also offer it for just the windows at $200,
       rims starting at $150, and leather seats at $250.
       It gives you long-lasting protection — usually
       several years with proper care. I should mention
       that ceramic coating does require an in-person
       assessment first so we can evaluate your paint.
       Would you like to book an assessment?"

Caller: "Yeah, what does that involve?"

Alex: "It's a quick look at your vehicle — usually takes
       about 15 minutes — so our team can recommend the
       right prep work and give you an exact quote.
       It's completely free. Would you like to set
       one up?"

Caller: "Sure, how about next week?"

Alex: "Of course! Which day works best for you next week?"
```

## Conversation 3: Monday Call

```
Caller: "Can I come in tomorrow? It's Sunday today"

Alex: "I'm sorry, tomorrow is Monday and we're actually
       closed on Mondays. Our next available day would
       be Tuesday. We're open Tuesday and Wednesday
       from 8 AM to 5:30 PM. Would Tuesday work for you?"

Caller: "Tuesday afternoon then"

Alex: [checks availability]
      "I have openings Tuesday afternoon. I have 1 PM,
       1:30 PM, and 2 PM available. Which would you prefer?"
```

---

# PART 11 — UPGRADING IN THE FUTURE

When the business grows, here are simple upgrades:

## Send SMS confirmation after booking
Add to `sheets-service.js` after saving the booking:
```javascript
const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
await twilioClient.messages.create({
  body: `WashQ confirmed! ${serviceName} on ${date} at ${time}. Confirmation: ${confirmationId}. 15 Independence St, White Plains NY.`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: phone,
});
```
Cost: ~$0.0079 per SMS (Twilio SMS pricing) — about $0.80/month for 100 bookings.

## Add appointment reminders (24 hours before)
Use a free cron job service like **cron-job.org** to trigger a daily check
and send SMS reminders to next-day customers.

## Better voice with ElevenLabs
Once the business is generating revenue, upgrade the voice to ElevenLabs
for a more natural-sounding AI. Just replace the `<Say>` TwiML with
an audio streaming approach. Cost: ~$22/month.

## Add a second language (Spanish)
Many Westchester customers speak Spanish. Add a language detection step
and a Spanish system prompt — Groq handles Spanish natively.

---

# QUICK REFERENCE CARD

**Twilio Console:** https://console.twilio.com
**Groq Console:** https://console.groq.com
**Google Cloud:** https://console.cloud.google.com
**Your Google Sheet:** https://sheets.google.com
**Render Dashboard:** https://dashboard.render.com
**UptimeRobot:** https://uptimerobot.com

**Your endpoints:**
- Incoming calls: `https://your-render-url.onrender.com/call/incoming`
- Status updates: `https://your-render-url.onrender.com/call/status`
- Health check: `https://your-render-url.onrender.com/health`

**To redeploy after any code change:**
```
git add .
git commit -m "update"
git push origin main
```
Render auto-deploys on every push. Takes about 2 minutes.

**To restart just the server (no code change):**
Render Dashboard → your service → **"Manual Deploy" → "Deploy latest commit"**

---

*WashQ Detailing / Westchester Auto Spa HQ — 15 Independence St, White Plains NY — (914) 573-6640*
