// Google Sheets Appointment Service
// Completely free — stores all bookings in a Google Sheet
// Setup: see COMPLETE_STEPS.md → Phase D

const { google } = require("googleapis");
const logger = require("./logger");

let sheetsClient = null;
let spreadsheetId = null;

// Column mapping (0-indexed to match the array returned by the Sheets API)
const COLS = {
  Date: 0, Time: 1, Duration_Mins: 2, Customer_Name: 3, Phone: 4, Email: 5,
  Service_ID: 6, Service_Name: 7, Vehicle_Type: 8, Price: 9,
  Confirmation_ID: 10, Notes: 11, Status: 12,
};

/**
 * Initialize Google Sheets connection. Call once on server startup.
 */
async function initSheets() {
  try {
    // Two ways to provide credentials:
    //  1. GOOGLE_SERVICE_ACCOUNT_KEY_FILE — point at the actual .json file
    //     Google gave you. Preferred: sidesteps the private-key newline
    //     escaping that trips people up in .env files.
    //  2. GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY in .env —
    //     kept for backward compatibility.
    let credentials;
    const fs = require("fs");
    const path = require("path");

    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
      const keyPath = path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE);
      logger.info("Using GOOGLE_SERVICE_ACCOUNT_KEY_FILE", { keyPath });

      if (!fs.existsSync(keyPath)) {
        logger.error("That file does not exist at this path", { keyPath });
        logger.warn("Falling back to GOOGLE_PRIVATE_KEY / GOOGLE_SERVICE_ACCOUNT_EMAIL from .env instead");
        credentials = {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
        };
      } else {
        credentials = JSON.parse(fs.readFileSync(keyPath, "utf8"));
        logger.info("Credentials file loaded", {
          hasClientEmail: !!credentials.client_email,
          privateKeyLength: credentials.private_key?.length || 0,
          privateKeyLooksValid: !!credentials.private_key?.includes("BEGIN PRIVATE KEY"),
        });
      }
    } else {
      logger.info("GOOGLE_SERVICE_ACCOUNT_KEY_FILE not set — using GOOGLE_PRIVATE_KEY from .env");
      credentials = {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      };
      logger.info("Credential shape check", {
        hasClientEmail: !!credentials.client_email,
        privateKeyLength: credentials.private_key?.length || 0,
        privateKeyLooksValid: !!credentials.private_key?.includes("BEGIN PRIVATE KEY"),
      });
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    sheetsClient = google.sheets({ version: "v4", auth });
    spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Test connection
    await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A1:A1",
    });

    logger.info("Google Sheets connected", { sheet: "WashQ Appointments" });
    return true;
  } catch (error) {
    logger.error("Google Sheets connection failed", { error: error.message });
    logger.warn("Bookings will be stored in memory only until this is fixed");
    return false;
  }
}

/**
 * Get booked start times (ISO strings) for a specific date.
 * Used both for offering availability and for the double-booking guard.
 */
async function getBookingsForDate(dateStr) {
  if (!sheetsClient) return [];

  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A2:M1000",
    });

    const rows = response.data.values || [];
    return rows
      .filter((row) => row[COLS.Date] === dateStr && row[COLS.Status] !== "cancelled")
      .map((row) => (row[COLS.Time] ? parseTimeToISO(dateStr, row[COLS.Time]) : null))
      .filter(Boolean);
  } catch (error) {
    logger.error("Sheets read error (getBookingsForDate)", { error: error.message });
    return [];
  }
}

/**
 * Get every booking as clean objects — powers the /admin dashboard.
 */
async function getAllBookings() {
  if (!sheetsClient) return [];

  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A2:M1000",
    });

    const rows = response.data.values || [];
    return rows
      .filter((r) => r.length > 0)
      .map((r) => ({
        Date: r[COLS.Date] || "",
        Time: r[COLS.Time] || "",
        Duration_Mins: r[COLS.Duration_Mins] || "",
        Customer_Name: r[COLS.Customer_Name] || "",
        Phone: r[COLS.Phone] || "",
        Email: r[COLS.Email] || "",
        Service_ID: r[COLS.Service_ID] || "",
        Service_Name: r[COLS.Service_Name] || "",
        Vehicle_Type: r[COLS.Vehicle_Type] || "",
        Price: r[COLS.Price] || "",
        Confirmation_ID: r[COLS.Confirmation_ID] || "",
        Notes: r[COLS.Notes] || "",
        Status: r[COLS.Status] || "confirmed",
      }));
  } catch (error) {
    logger.error("Sheets read error (getAllBookings)", { error: error.message });
    return [];
  }
}

/**
 * Save a new booking to Google Sheets.
 */
async function saveBooking(booking) {
  const {
    date, time, durationMins, customerName, phone,
    email, serviceId, serviceName, vehicleType, price,
    confirmationId, notes,
  } = booking;

  const row = [
    date, time, durationMins, customerName, phone, email || "",
    serviceId, serviceName, vehicleType, price, confirmationId,
    notes || "", "confirmed",
  ];

  if (!sheetsClient) {
    logger.warn("Sheets not connected — booking not persisted", { confirmationId });
    return { success: true, logged: "console-only" };
  }

  try {
    await sheetsClient.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:M",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    logger.info("Booking saved to Sheet", { confirmationId });
    return { success: true };
  } catch (error) {
    logger.error("Sheets write error", { error: error.message, confirmationId });
    return { success: false, error: error.message };
  }
}

function generateConfirmationId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1 — avoids confusion when read aloud
  let id = "WQ-";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function parseTimeToISO(dateStr, timeStr) {
  try {
    const [timePart, ampm] = timeStr.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    const dt = new Date(dateStr + "T00:00:00");
    dt.setHours(hours, minutes, 0, 0);
    return dt.toISOString();
  } catch {
    return null;
  }
}

module.exports = {
  initSheets,
  getBookingsForDate,
  getAllBookings,
  saveBooking,
  generateConfirmationId,
};