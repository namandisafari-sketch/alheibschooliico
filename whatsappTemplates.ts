import sharp from "sharp";

export type NotificationMood = "success" | "warning" | "error" | "info";
export type TemplateType = "attendance" | "reminder" | "generic" | "appointment";

interface MoodTheme {
  accent: string;
  bg: string;
  border: string;
  icon: string;
  labelAr: string;
  labelEn: string;
}

const moods: Record<NotificationMood, MoodTheme> = {
  success: { accent: "#059669", bg: "#ecfdf5", border: "#a7f3d0", icon: "✅", labelAr: "تم بنجاح", labelEn: "Success" },
  warning: { accent: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: "⚠️", labelAr: "تنبيه", labelEn: "Warning" },
  error:   { accent: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: "❌", labelAr: "خطأ", labelEn: "Error" },
  info:    { accent: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: "ℹ️", labelAr: "معلومات", labelEn: "Info" },
};

interface NotificationData {
  mood?: NotificationMood;
  lang?: "ar" | "en";
  studentName?: string;
  className?: string;
  date?: string;
  time?: string;
  status?: string;
  statusEn?: string;
  message?: string;
  messageEn?: string;
  guardianName?: string;
  visitorName?: string;
  purpose?: string;
  hostName?: string;
  location?: string;
  requestType?: string;
  requestId?: string;
  appointmentId?: string;
  details?: { label: string; value: string }[];
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function headerSvg(lang: "ar" | "en", m: MoodTheme): string {
  const isAr = lang === "ar";
  return `
    <svg width="600" height="520" xmlns="http://www.w3.org/2000/svg" dir="${isAr ? "rtl" : "ltr"}">
    <defs><linearGradient id="hdr" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1e3a5f"/><stop offset="100%" style="stop-color:#1a73e8"/>
    </linearGradient></defs>
    <rect width="600" height="520" rx="16" fill="white"/>
    <rect x="0" y="0" width="600" height="100" fill="url(#hdr)"/>
    <text x="300" y="38" text-anchor="middle" fill="white" font-size="20" font-weight="bold" font-family="Arial">${isAr ? "مدرسة الهيب الإسلامية الابتدائية" : "AL-HEIB ISLAMIC PRIMARY SCHOOL"}</text>
    <text x="300" y="62" text-anchor="middle" fill="#bfdbfe" font-size="12" font-family="Arial">${isAr ? "AL-HEIB ISLAMIC PRIMARY SCHOOL" : "Al-Heib Islamic Primary School"}</text>
    <text x="300" y="82" text-anchor="middle" fill="#93c5fd" font-size="9" font-family="Arial">${isAr ? "التميز في التربية والتعليم • Excellence in Education" : "Excellence in Education • التميز في التربية والتعليم"}</text>
    <rect x="210" y="110" width="180" height="32" rx="16" fill="${m.bg}" stroke="${m.border}" stroke-width="1"/>
    <text x="300" y="131" text-anchor="middle" fill="${m.accent}" font-size="13" font-weight="bold" font-family="Arial">${m.icon} ${isAr ? m.labelAr : m.labelEn}</text>`;
}

function footerSvg(): string {
  return `
    <line x1="30" y1="470" x2="570" y2="470" stroke="#e5e7eb" stroke-width="1"/>
    <text x="300" y="490" text-anchor="middle" fill="#9ca3af" font-size="10" font-family="Arial">Al-Heib Islamic Primary School • Management System</text>
    <text x="300" y="506" text-anchor="middle" fill="#d1d5db" font-size="8" font-family="Arial">هذه رسالة آلية، يرجى عدم الرد عليها • This is an automated message</text>
  </svg>`;
}

function buildAttendanceSvg(d: NotificationData): string {
  const m = moods[d.mood || "info"];
  const isAr = d.lang !== "en";
  const sn = esc(d.studentName || "");
  const cn = esc(d.className || "");
  const dt = esc(d.date || "");
  const st = esc(d.status || "");
  const ste = esc(d.statusEn || "");
  const gn = esc(d.guardianName || "");

  const greeting = isAr ? (gn ? `Dear Guardian, ${gn}` : "Dear Guardian,") : gn ? `Dear Guardian, ${gn}` : "Dear Guardian,";
  const lblStudent = isAr ? "Student:" : "Student:";
  const lblClass = isAr ? "Class:" : "Class:";
  const lblDate = isAr ? "Date:" : "Date:";
  const lblStatus = isAr ? `Attendance: ${st}` : `Attendance: ${ste || st}`;

  return `${headerSvg("ar", m)}
    <rect x="30" y="155" width="540" height="300" rx="12" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
    <text x="300" y="185" text-anchor="middle" fill="#374151" font-size="14" font-family="Arial">${greeting}</text>
    <rect x="80" y="200" width="440" height="90" rx="8" fill="white" stroke="#e5e7eb" stroke-width="1"/>
    <text x="100" y="225" fill="#6b7280" font-size="12" font-family="Arial">${lblStudent}</text>
    <text x="200" y="225" fill="#1f2937" font-size="13" font-weight="bold" font-family="Arial">${sn}</text>
    <text x="100" y="250" fill="#6b7280" font-size="12" font-family="Arial">${lblClass}</text>
    <text x="200" y="250" fill="#1f2937" font-size="13" font-weight="bold" font-family="Arial">${cn}</text>
    <text x="100" y="275" fill="#6b7280" font-size="12" font-family="Arial">${lblDate}</text>
    <text x="200" y="275" fill="#1f2937" font-size="13" font-weight="bold" font-family="Arial">${dt}</text>
    <rect x="80" y="305" width="440" height="50" rx="8" fill="${m.bg}" stroke="${m.border}" stroke-width="1"/>
    <text x="300" y="327" text-anchor="middle" fill="${m.accent}" font-size="16" font-weight="bold" font-family="Arial">${lblStatus}</text>
    ${footerSvg()}`;
}

function buildEnglishAttendanceSvg(d: NotificationData): string {
  const m = moods[d.mood || "info"];
  const sn = esc(d.studentName || "");
  const cn = esc(d.className || "");
  const dt = esc(d.date || "");
  const st = esc(d.status || "");
  const ste = esc(d.statusEn || "");
  const gn = esc(d.guardianName || "");

  const greeting = gn ? `Dear Guardian, ${gn}` : "Dear Guardian,";
  const statusLine = ste ? `Attendance: ${ste}` : `Attendance: ${st}`;

  return `${headerSvg("en", m)}
    <rect x="30" y="155" width="540" height="300" rx="12" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
    <text x="300" y="185" text-anchor="middle" fill="#374151" font-size="14" font-family="Arial">${greeting}</text>
    <rect x="80" y="200" width="440" height="90" rx="8" fill="white" stroke="#e5e7eb" stroke-width="1"/>
    <text x="100" y="225" fill="#6b7280" font-size="12" font-family="Arial">Student:</text>
    <text x="200" y="225" fill="#1f2937" font-size="13" font-weight="bold" font-family="Arial">${sn}</text>
    <text x="100" y="250" fill="#6b7280" font-size="12" font-family="Arial">Class:</text>
    <text x="200" y="250" fill="#1f2937" font-size="13" font-weight="bold" font-family="Arial">${cn}</text>
    <text x="100" y="275" fill="#6b7280" font-size="12" font-family="Arial">Date:</text>
    <text x="200" y="275" fill="#1f2937" font-size="13" font-weight="bold" font-family="Arial">${dt}</text>
    <rect x="80" y="305" width="440" height="50" rx="8" fill="${m.bg}" stroke="${m.border}" stroke-width="1"/>
    <text x="300" y="327" text-anchor="middle" fill="${m.accent}" font-size="16" font-weight="bold" font-family="Arial">${statusLine}</text>
    ${footerSvg()}`;
}

function buildGenericSvg(d: NotificationData): string {
  const isAr = d.lang !== "en";
  const m = moods[d.mood || "info"];
  const msg = esc(d.message || "");
  const msge = esc(d.messageEn || "");

  let rows = "";
  if (d.details) {
    d.details.forEach((det, i) => {
      const y = 240 + i * 28;
      rows += `<text x="100" y="${y}" fill="#6b7280" font-size="12" font-family="Arial">${esc(det.label)}:</text>
        <text x="250" y="${y}" fill="#1f2937" font-size="13" font-weight="bold" font-family="Arial">${esc(det.value)}</text>`;
    });
  }

  return `${headerSvg(isAr ? "ar" : "en", m)}
    <rect x="30" y="155" width="540" height="300" rx="12" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
    <text x="300" y="185" text-anchor="middle" fill="#374151" font-size="14" font-family="Arial">${msg}</text>
    <text x="300" y="205" text-anchor="middle" fill="#9ca3af" font-size="11" font-family="Arial">${msge}</text>
    <rect x="80" y="215" width="440" height="${d.details ? Math.max(d.details.length * 28 + 30, 50) : 50}" rx="8" fill="white" stroke="#e5e7eb" stroke-width="1"/>
    ${rows}
    ${footerSvg()}`;
}

function buildAppointmentSvg(d: NotificationData, qrDataUrl?: string): string {
  const vn = esc(d.visitorName || "");
  const p = esc(d.purpose || "");
  const dt = esc(d.date || "");
  const tm = esc(d.time || "");
  const rawId = d.appointmentId || d.requestId || "";
  const aid = rawId.length > 6 ? rawId.slice(-6).toUpperCase() : rawId.toUpperCase();
  const msg = esc(d.message || "");

  const qrImg = qrDataUrl
    ? `<image href="${qrDataUrl}" x="185" y="205" width="130" height="130"/>`
    : `<rect x="185" y="205" width="130" height="130" rx="4" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
       <text x="250" y="280" text-anchor="middle" fill="#9ca3af" font-size="10" font-family="Arial">QR Code</text>`;

  return `<svg width="500" height="620" xmlns="http://www.w3.org/2000/svg">
    <rect width="500" height="620" rx="16" fill="white"/>
    <rect x="0" y="0" width="500" height="90" fill="#1e3a5f" rx="16"/>
    <text x="250" y="38" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial">AL-HEIB ISLAMIC PRIMARY SCHOOL</text>
    <text x="250" y="60" text-anchor="middle" fill="#93c5fd" font-size="10" font-family="Arial">Appointment Confirmation</text>

    <text x="250" y="125" text-anchor="middle" fill="#059669" font-size="20" font-weight="bold" font-family="Arial">Appointment Confirmed!</text>
    <text x="250" y="148" text-anchor="middle" fill="#6b7280" font-size="11" font-family="Arial">Save your QR code or ID for gate entry</text>
    <text x="250" y="165" text-anchor="middle" fill="#9ca3af" font-size="10" font-family="Arial">Scan at the gate for faster check-in</text>

    <rect x="175" y="185" width="150" height="150" rx="8" fill="white" stroke="#e5e7eb" stroke-width="1"/>
    ${qrImg}

    <text x="250" y="358" text-anchor="middle" fill="#9ca3af" font-size="9" font-family="Arial">Appointment ID</text>
    <text x="250" y="382" text-anchor="middle" fill="#1f2937" font-size="22" font-weight="bold" font-family="monospace">${aid || "------"}</text>

    <rect x="130" y="400" width="100" height="34" rx="17" fill="#1a73e8"/>
    <text x="180" y="422" text-anchor="middle" fill="white" font-size="12" font-weight="bold" font-family="Arial">Save QR</text>
    <rect x="270" y="400" width="100" height="34" rx="17" fill="#f3f4f6" stroke="#d1d5db" stroke-width="1"/>
    <text x="320" y="422" text-anchor="middle" fill="#374151" font-size="12" font-weight="bold" font-family="Arial">Share</text>

    <line x1="30" y1="455" x2="470" y2="455" stroke="#e5e7eb" stroke-width="1"/>

    <text x="60" y="478" fill="#6b7280" font-size="11" font-family="Arial">Visitor</text>
    <text x="250" y="478" fill="#1f2937" font-size="13" font-weight="bold" font-family="Arial">${vn}</text>
    <text x="60" y="503" fill="#6b7280" font-size="11" font-family="Arial">Date</text>
    <text x="250" y="503" fill="#1f2937" font-size="13" font-weight="bold" font-family="Arial">${dt}</text>
    <text x="60" y="528" fill="#6b7280" font-size="11" font-family="Arial">Time</text>
    <text x="250" y="528" fill="#1f2937" font-size="13" font-weight="bold" font-family="Arial">${tm}</text>
    <text x="60" y="553" fill="#6b7280" font-size="11" font-family="Arial">Purpose</text>
    <text x="250" y="553" fill="#1f2937" font-size="13" font-weight="bold" font-family="Arial">${p}</text>

    <line x1="30" y1="575" x2="470" y2="575" stroke="#e5e7eb" stroke-width="1"/>
    <text x="250" y="595" text-anchor="middle" fill="#9ca3af" font-size="8" font-family="Arial">Present your QR code or ID number at the gate for verification.</text>
    <text x="250" y="610" text-anchor="middle" fill="#d1d5db" font-size="7" font-family="Arial">Al-Heib Islamic Primary School • Management System</text>
  </svg>`;
}

export function generateSvg(type: TemplateType, d: NotificationData, qrDataUrl?: string): string {
  switch (type) {
    case "attendance":
      return d.lang === "en" ? buildEnglishAttendanceSvg(d) : buildAttendanceSvg(d);
    case "appointment":
      return buildAppointmentSvg(d, qrDataUrl);
    default:
      return buildGenericSvg(d);
  }
}

export async function svgToPngBuffer(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

async function generateQrDataUrl(text: string): Promise<string> {
  try {
    const bwipjs = require("bwip-js");
    const buf = await bwipjs.toBuffer({
      bcid: "qrcode",
      text,
      scale: 3,
      width: 10,
      height: 10,
    });
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

export async function generateNotificationImage(
  type: TemplateType,
  data: NotificationData,
): Promise<string> {
  let qrDataUrl: string | undefined;
  if (type === "appointment") {
    const qrText = data.appointmentId || data.requestId || data.visitorName || "alheib";
    qrDataUrl = await generateQrDataUrl(qrText);
  }
  const svg = generateSvg(type, data, qrDataUrl);
  const png = await svgToPngBuffer(svg);
  return png.toString("base64");
}
