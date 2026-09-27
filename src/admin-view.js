// Renders a clean, readable HTML dashboard for viewing bookings —
// so the business owner isn't stuck scrolling a raw Google Sheet on
// their phone. Served at GET /admin, protected by Basic Auth in server.js.

function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function statusBadge(status) {
  const s = (status || "confirmed").toLowerCase();
  const color = s === "cancelled" ? "#E24B4A" : s === "completed" ? "#639922" : "#378ADD";
  return `<span style="background:${color}22;color:${color};padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600">${esc(status || "confirmed")}</span>`;
}

function row(b) {
  return `
    <tr>
      <td>${esc(b.Date)}</td>
      <td>${esc(b.Time)}</td>
      <td>${esc(b.Customer_Name)}</td>
      <td>${esc(b.Phone)}</td>
      <td>${esc(b.Service_Name)}</td>
      <td>${esc(b.Vehicle_Type)}</td>
      <td>${esc(b.Price)}</td>
      <td><code>${esc(b.Confirmation_ID)}</code></td>
      <td>${statusBadge(b.Status)}</td>
    </tr>`;
}

function renderAdminHTML(bookings) {
  const sorted = [...bookings].sort((a, b) =>
    `${a.Date} ${a.Time}`.localeCompare(`${b.Date} ${b.Time}`)
  );

  const today = new Date().toISOString().split("T")[0];
  const upcoming = sorted.filter((b) => b.Date >= today);
  const past = sorted.filter((b) => b.Date < today);

  const tableHead =
    "<tr><th>Date</th><th>Time</th><th>Customer</th><th>Phone</th><th>Service</th>" +
    "<th>Vehicle</th><th>Price</th><th>Confirmation</th><th>Status</th></tr>";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>WashQ Appointments — Admin</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         background: #f7f6f2; color: #2c2c2a; padding: 24px; }
  h1 { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
  .sub { color: #5f5e5a; font-size: 13px; margin-bottom: 24px; }
  .stats { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .stat { background: white; border: 1px solid #e5e3db; border-radius: 10px; padding: 12px 18px; min-width: 120px; }
  .stat-num { font-size: 22px; font-weight: 600; }
  .stat-label { font-size: 12px; color: #5f5e5a; }
  h2 { font-size: 15px; font-weight: 600; margin: 24px 0 10px; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px;
          overflow: hidden; border: 1px solid #e5e3db; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; color: #888780;
       padding: 10px 12px; border-bottom: 1px solid #e5e3db; background: #faf9f6; }
  td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f1efe8; white-space: nowrap; }
  tr:last-child td { border-bottom: none; }
  code { background: #f1efe8; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  .empty { padding: 24px; text-align: center; color: #888780; background: white;
           border-radius: 10px; border: 1px solid #e5e3db; }
  .refresh { font-size: 12px; color: #378ADD; text-decoration: none; }
  .scroll { overflow-x: auto; }
</style>
</head>
<body>
  <h1>WashQ Detailing — Appointments</h1>
  <div class="sub">Live from Google Sheets · <a class="refresh" href="/admin">Refresh</a></div>

  <div class="stats">
    <div class="stat"><div class="stat-num">${upcoming.length}</div><div class="stat-label">Upcoming</div></div>
    <div class="stat"><div class="stat-num">${sorted.length}</div><div class="stat-label">Total bookings</div></div>
    <div class="stat"><div class="stat-num">${past.length}</div><div class="stat-label">Past</div></div>
  </div>

  <h2>Upcoming appointments</h2>
  ${upcoming.length === 0 ? '<div class="empty">No upcoming appointments yet.</div>' : `
  <div class="scroll"><table>${tableHead}${upcoming.map(row).join("")}</table></div>`}

  ${past.length > 0 ? `
  <h2>Recent past appointments</h2>
  <div class="scroll"><table>${tableHead}${past.slice(-20).reverse().map(row).join("")}</table></div>` : ""}
</body>
</html>`;
}

module.exports = { renderAdminHTML };
