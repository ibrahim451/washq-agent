// SMS Confirmation Service — texts the customer right after a booking.
// Uses the same Twilio account you already have (no new account needed).
// Cost: ~$0.0079 per SMS — about 80 cents per 100 bookings.

const twilio = require("twilio");
const logger = require("./logger");

let client = null;
function getClient() {
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

// Converts whatever format the caller said their number in ("914 555
// 0142", "(914) 555-0142", etc.) into the E.164 format Twilio requires.
// Returns null rather than guessing if the format is ambiguous — sending
// a confirmation to a wrong/mistyped number is worse than not sending one.
function toE164(phone) {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

async function sendConfirmationSMS({
  toPhone, customerName, serviceName, dateDisplay, timeDisplay, confirmationId,
}) {
  const formatted = toE164(toPhone);
  if (!formatted) {
    logger.warn("SMS skipped — could not format phone number", { toPhone });
    return { sent: false, reason: "bad_phone_format" };
  }

  const firstName = (customerName || "there").split(" ")[0];
  const body =
    `WashQ Detailing: Hi ${firstName}! Your ${serviceName} is confirmed for ` +
    `${dateDisplay} at ${timeDisplay}. Confirmation: ${confirmationId}. ` +
    `15 Independence St, White Plains NY. Questions? Call (914) 573-6640.`;

  try {
    const msg = await getClient().messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formatted,
    });
    logger.info("SMS confirmation sent", { to: formatted, sid: msg.sid });
    return { sent: true, sid: msg.sid };
  } catch (err) {
    // Never let an SMS failure block or fail the booking itself —
    // the appointment is already saved by the time this runs.
    logger.error("SMS send failed", { error: err.message, to: formatted });
    return { sent: false, error: err.message };
  }
}

module.exports = { sendConfirmationSMS };
