const http = require("http");
const { createClient } = require("@supabase/supabase-js");

const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  try { process.loadEnvFile(envPath); } catch {}
}

const SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:8000";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzkzNTk5NzgsImV4cCI6MTkzNzAzOTk3OH0.ceJxy0upSobq7LP9CVnAH6QDYV7bvHv8dtLbV6rLokM";

const PORT = 9100;

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function uuidToShortId(uuid) {
  return uuid ? uuid.replace(/-/g, "").substring(0, 6).toUpperCase() : "";
}

async function lookupAppointment(id) {
  return sb.from("appointments").select("*").eq("id", id).maybeSingle().then(r => r.data);
}

async function lookupAppointmentByShortId(shortId) {
  const upper = shortId.toUpperCase();
  const { data } = await sb
    .from("appointments")
    .select("*")
    .gte("scheduled_for", new Date(Date.now() - 30 * 86400000).toISOString())
    .limit(200);
  return (data || []).find(a => uuidToShortId(a.id) === upper) || null;
}

async function lookupStudent(id) {
  const { data } = await sb
    .from("learners")
    .select("id, full_name, admission_number, status, class:class_id(name)")
    .eq("id", id)
    .maybeSingle();
  return data;
}

async function lookupStudentByAdmission(admission) {
  const { data } = await sb
    .from("learners")
    .select("id, full_name, admission_number, status, class:class_id(name)")
    .eq("admission_number", admission)
    .maybeSingle();
  return data;
}

async function lookupInventoryTransaction(qrCode) {
  const { data } = await sb
    .from("inventory_transactions")
    .select("*, item:item_id(name)")
    .eq("qr_verification_code", qrCode)
    .maybeSingle();
  return data;
}

async function handleRequest(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.writeHead(204).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname === "/health") return json(res, 200, { status: "ok" });

  // --- Main scan endpoint ---
  if (pathname === "/scan") {
    let code = "";
    if (req.method === "GET") {
      code = (url.searchParams.get("code") || "").trim();
    } else {
      const body = await new Promise(r => { let d = ""; req.on("data", c => d += c); req.on("end", () => r(d)); });
      try { code = (JSON.parse(body).code || "").trim(); } catch { code = body.trim(); }
    }

    if (!code || code.length < 2) {
      return json(res, 400, { success: false, message: "Missing or invalid barcode data" });
    }

    try {
      let result = null;

      // 1. Full UUID → appointment or student
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)) {
        const appt = await lookupAppointment(code);
        if (appt) result = { type: "appointment", data: appt };
        else {
          const stu = await lookupStudent(code);
          if (stu) result = { type: "student", data: stu };
        }
      }
      // 2. Short ID (6 char hex) → appointment
      else if (/^[A-F0-9]{6}$/i.test(code)) {
        const appt = await lookupAppointmentByShortId(code);
        if (appt) result = { type: "appointment", data: appt };
      }
      // 3. Admission number → student
      else if (/^[A-Z]{2}\d{4,}$/i.test(code) || /^\d{4,}$/.test(code)) {
        const stu = await lookupStudentByAdmission(code);
        if (stu) result = { type: "student", data: stu };
      }
      // 4. ALHEIB QR code format
      else if (/^ALHEIB:/i.test(code)) {
        const idMatch = code.match(/^ALHEIB(?:[_:]STU)?[_:]([a-f0-9-]+)$/i);
        if (idMatch) {
          const appt = await lookupAppointment(idMatch[1]);
          if (appt) result = { type: "appointment", data: appt };
          else {
            const stu = await lookupStudent(idMatch[1]);
            if (stu) result = { type: "student", data: stu };
          }
        }
        // Inventory QR
        if (!result) {
          const tx = await lookupInventoryTransaction(code);
          if (tx) result = { type: "inventory", data: tx };
        }
      }
      // 5. Anything else → try admission, then short ID, then inventory
      else {
        const stu = await lookupStudentByAdmission(code);
        if (stu) result = { type: "student", data: stu };
        else {
          const appt = await lookupAppointmentByShortId(code);
          if (appt) result = { type: "appointment", data: appt };
          else {
            const tx = await lookupInventoryTransaction(code);
            if (tx) result = { type: "inventory", data: tx };
          }
        }
      }

      if (!result) {
        return json(res, 404, { success: false, message: "No record found for this barcode" });
      }

      return json(res, 200, { success: true, ...result });
    } catch (err) {
      console.error("Scanner lookup error:", err);
      return json(res, 500, { success: false, message: err.message });
    }
  }

  // --- Gate PIN lookup ---
  const pinMatch = pathname.match(/^\/appointment\/([a-f0-9-]+)\/gate-pin$/i);
  if (pinMatch) {
    const appt = await lookupAppointment(pinMatch[1]);
    if (!appt) return json(res, 404, { success: false, message: "Appointment not found" });
    return json(res, 200, {
      success: true,
      type: "appointment",
      data: {
        id: appt.id,
        visitor_name: appt.visitor_name,
        host_name: appt.host_name,
        status: appt.status,
        gate_pin: appt.status === "checked_in" ? appt.gate_pin : null,
      },
    });
  }

  json(res, 404, { success: false, message: "Not found" });
}

const server = http.createServer(handleRequest);
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Scanner API listening on http://0.0.0.0:${PORT}`);
  console.log(`Send scan data: GET http://<ip>:${PORT}/scan?code=SCANNED_DATA`);
});
