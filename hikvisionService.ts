import { createClient } from "@supabase/supabase-js";

const DEVICE_IP = process.env.HIKVISION_IP || "192.168.88.100";
const DEVICE_USER = process.env.HIKVISION_USER || "admin";
const DEVICE_PASS = process.env.HIKVISION_PASS || "";
const POLL_INTERVAL_MS = parseInt(process.env.HIKVISION_POLL_INTERVAL || "30000");

let lastSyncTime: Date = new Date(Date.now() - 24 * 60 * 60 * 1000);
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase credentials not available");
  return createClient(url, key);
}

function basicAuth(): string {
  return "Basic " + Buffer.from(`${DEVICE_USER}:${DEVICE_PASS}`).toString("base64");
}

type HikvisionRecord = {
  employeeNo: string;
  time: Date;
  door: string;
  status: string;
  cardNo?: string;
};

async function fetchAttendanceRecords(from: Date, to: Date): Promise<HikvisionRecord[]> {
  const url = `http://${DEVICE_IP}/ISAPI/Attendance/Record/Search`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<AttendanceRecordSearch>
  <searchResultPosition>0</searchResultPosition>
  <maxResults>500</maxResults>
  <AttendanceRecordSearchFilter>
    <startTime>${from.toISOString()}</startTime>
    <endTime>${to.toISOString()}</endTime>
  </AttendanceRecordSearchFilter>
</AttendanceRecordSearch>`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml",
      "Authorization": basicAuth(),
    },
    body: xml,
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Hikvision API error: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  return parseAttendanceXML(text);
}

function parseAttendanceXML(xml: string): HikvisionRecord[] {
  const records: HikvisionRecord[] = [];
  const recordRegex = /<AttendanceRecord>[\s\S]*?<\/AttendanceRecord>/g;
  let match;

  while ((match = recordRegex.exec(xml)) !== null) {
    const block = match[0];
    const getTag = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>(.*?)<\\/${tag}>`));
      return m ? m[1].trim() : "";
    };

    const timeStr = getTag("time");
    if (!timeStr) continue;

    records.push({
      employeeNo: getTag("employeeNo"),
      time: new Date(timeStr),
      door: getTag("door"),
      status: getTag("status"),
      cardNo: getTag("cardNo"),
    });
  }

  return records;
}

async function getDeviceInfo(): Promise<Record<string, string>> {
  const url = `http://${DEVICE_IP}/ISAPI/System/deviceInfo`;
  const res = await fetch(url, {
    headers: { Authorization: basicAuth() },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) throw new Error(`Device info failed: ${res.status}`);

  const xml = await res.text();
  const result: Record<string, string> = {};
  const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
  let m;
  while ((m = tagRegex.exec(xml)) !== null) {
    if (!m[1].startsWith("?")) result[m[1]] = m[2];
  }
  return result;
}

async function getDeviceTime(): Promise<string> {
  const url = `http://${DEVICE_IP}/ISAPI/System/time`;
  const res = await fetch(url, {
    headers: { Authorization: basicAuth() },
    signal: AbortSignal.timeout(5000),
  });
  const xml = await res.text();
  const m = xml.match(/<localTime>(.*?)<\/localTime>/);
  return m ? m[1] : "unknown";
}

type SyncResult = {
  synced: number;
  failed: number;
  errors: string[];
};

async function syncToDatabase(records: HikvisionRecord[]): Promise<SyncResult> {
  const supabase = getSupabase();
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  const { data: mappings } = await supabase
    .from("device_employee_mapping")
    .select("employee_no, user_id, learner_id");

  const empToUser = new Map<string, string>();
  const empToLearner = new Map<string, string>();
  for (const m of mappings || []) {
    if (m.user_id) empToUser.set(m.employee_no, m.user_id);
    if (m.learner_id) empToLearner.set(m.employee_no, m.learner_id);
  }

  for (const record of records) {
    const dateStr = record.time.toISOString().slice(0, 10);
    const timeStr = record.time.toTimeString().slice(0, 8);

    try {
      const userId = empToUser.get(record.employeeNo);
      if (userId) {
        const { error: staffErr } = await supabase.from("staff_attendance").upsert({
          user_id: userId,
          date: dateStr,
          check_in: record.time.toISOString(),
          status: "present",
          source: "hikvision",
        }, { onConflict: "user_id, date" });

        if (staffErr) {
          errors.push(`staff_attendance ${record.employeeNo}: ${staffErr.message}`);
          failed++;
          continue;
        }

        const { error: personnelErr } = await supabase.from("personnel_attendance").upsert({
          employee_id: userId,
          date: dateStr,
          status: "present",
          check_in_time: timeStr,
        }, { onConflict: "employee_id, date" });

        if (personnelErr) {
          errors.push(`personnel_attendance ${record.employeeNo}: ${personnelErr.message}`);
        }
        synced++;
      }

      const learnerId = empToLearner.get(record.employeeNo);
      if (learnerId) {
        const { error: learnerErr } = await supabase.from("attendance").upsert({
          learner_id: learnerId,
          date: dateStr,
          status: "present",
          check_in_time: timeStr,
        }, { onConflict: "learner_id, date" });

        if (learnerErr) {
          errors.push(`attendance ${record.employeeNo}: ${learnerErr.message}`);
          failed++;
        } else {
          synced++;
        }

        const { error: gateErr } = await supabase.from("student_gate_logs").upsert({
          learner_id: learnerId,
          check_in_at: record.time.toISOString(),
          status: "checked_in",
          verification_method: "biometric",
          purpose: "Daily attendance (biometric)",
        }, { onConflict: "learner_id, check_in_at" });

        if (gateErr) {
          errors.push(`student_gate_logs ${record.employeeNo}: ${gateErr.message}`);
        }
      }

      if (!userId && !learnerId) {
        failed++;
        errors.push(`No mapping for employee ${record.employeeNo}`);
      }
    } catch (e: any) {
      errors.push(`${record.employeeNo}: ${e.message}`);
      failed++;
    }
  }

  return { synced, failed, errors };
}

async function poll() {
  if (isRunning) return;
  isRunning = true;

  try {
    const now = new Date();
    const records = await fetchAttendanceRecords(lastSyncTime, now);
    if (records.length > 0) {
      const result = await syncToDatabase(records);
      console.log(`[Hikvision] Synced ${result.synced} records (${result.failed} failed)`);
      if (result.errors.length > 0) {
        for (const err of result.errors.slice(0, 5)) {
          console.error(`[Hikvision] ${err}`);
        }
      }
    }
    lastSyncTime = now;
  } catch (e: any) {
    console.error(`[Hikvision] Poll error: ${e.message}`);
  } finally {
    isRunning = false;
  }
}

export async function testConnection(): Promise<{ ok: boolean; info?: Record<string, string>; error?: string }> {
  try {
    const info = await getDeviceInfo();
    const time = await getDeviceTime();
    return { ok: true, info: { ...info, deviceTime: time } };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function manualSync(from?: Date, to?: Date): Promise<SyncResult> {
  const start = from || new Date(Date.now() - 3600000);
  const end = to || new Date();
  const records = await fetchAttendanceRecords(start, end);
  return syncToDatabase(records);
}

export async function startPolling(supabaseClient?: ReturnType<typeof createClient>) {
  const supabase = supabaseClient || getSupabase();

  try {
    const { data: settings } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "hikvision_enabled")
      .single();

    if (settings?.value === "false") {
      console.log("[Hikvision] Polling disabled via site_settings");
      return;
    }
  } catch {}

  if (pollingTimer) clearInterval(pollingTimer);

  await poll();
  pollingTimer = setInterval(poll, POLL_INTERVAL_MS);
  console.log(`[Hikvision] Polling started (every ${POLL_INTERVAL_MS / 1000}s)`);
}

export function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
  console.log("[Hikvision] Polling stopped");
}

export function setLastSyncTime(date: Date) {
  lastSyncTime = date;
}
