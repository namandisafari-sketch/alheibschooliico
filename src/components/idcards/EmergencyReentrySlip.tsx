import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";

interface EmergencyReentrySlipProps {
  schoolName: string;
  visitorName: string;
  visitorPhone?: string | null;
  idNumber?: string | null;
  purpose?: string | null;
  host?: string | null;
  durationMinutes: number; // how long they want to stay
  width: 54 | 80; // mm
  isRTL?: boolean;
  badgeNumber?: string;
  originalVisitId?: string | null;
}

// 1mm ≈ 3.78 px at 96 DPI. Thermal printers render via image so we keep generous size.
const MM = 3.78;

export const EmergencyReentrySlip = ({
  schoolName,
  visitorName,
  visitorPhone,
  idNumber,
  purpose,
  host,
  durationMinutes,
  width,
  isRTL = false,
  badgeNumber,
  originalVisitId,
}: EmergencyReentrySlipProps) => {
  const widthPx = Math.round(width * MM);
  const issuedAt = new Date();
  const validUntil = new Date(issuedAt.getTime() + durationMinutes * 60_000);
  const serial = `ER-${Date.now().toString().slice(-8)}`;
  const badge = badgeNumber || `T-${Date.now().toString().slice(-6)}`;

  const qrPayload = JSON.stringify({
    t: "reentry",
    serial,
    badge,
    issued: issuedAt.toISOString(),
    expires: validUntil.toISOString(),
    visit: originalVisitId,
  });

  const T = isRTL
    ? {
        title: "تصريح عودة طارئ",
        sub: "صالح فقط للمدة المحددة أدناه",
        name: "الاسم",
        id: "الهوية",
        phone: "الهاتف",
        purpose: "الغرض",
        host: "المضيف",
        issued: "صدر",
        expires: "ينتهي",
        duration: "المدة",
        badge: "البطاقة",
        warn: "يجب إبراز هذا الإيصال عند الطلب. عند انتهاء المدة، الرجوع للاستقبال فوراً.",
        footer: "يبطل تلقائياً عند انتهاء الصلاحية",
        return: "عند المغادرة، سلّم هذا الإيصال للأمن.",
      }
    : {
        title: "EMERGENCY RE-ENTRY SLIP",
        sub: "Valid only for the duration shown below",
        name: "Name",
        id: "ID",
        phone: "Phone",
        purpose: "Purpose",
        host: "Host",
        issued: "Issued",
        expires: "Expires",
        duration: "Duration",
        badge: "Badge",
        warn: "This slip must be presented on request. Return to reception immediately when expired.",
        footer: "Auto-voids on expiry",
        return: "Surrender this slip to security on exit.",
      };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        width: widthPx,
        background: "white",
        color: "#000",
        fontFamily: isRTL
          ? "'Cairo', 'Tajawal', monospace"
          : "'Courier New', 'Roboto Mono', monospace",
        padding: 8,
        border: "2px dashed #000",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: 6 }}>
        <div style={{ fontSize: width === 54 ? 11 : 13, fontWeight: 800, letterSpacing: 0.5 }}>
          {schoolName.toUpperCase()}
        </div>
        <div
          style={{
            display: "inline-block",
            background: "#000",
            color: "#fff",
            padding: "3px 6px",
            marginTop: 4,
            fontSize: width === 54 ? 10 : 12,
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          {T.title}
        </div>
        <div style={{ fontSize: 8, marginTop: 3, fontStyle: "italic" }}>{T.sub}</div>
      </div>

      {/* Badge + serial */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        <span>
          {T.badge}: <span style={{ fontFamily: "monospace" }}>{badge}</span>
        </span>
        <span style={{ fontSize: 8 }}>#{serial}</span>
      </div>

      {/* Body */}
      <div
        style={{
          marginTop: 6,
          fontSize: width === 54 ? 9 : 10.5,
          lineHeight: 1.5,
          borderTop: "1px dashed #000",
          paddingTop: 6,
        }}
      >
        <Row label={T.name} value={visitorName} bold />
        {idNumber && <Row label={T.id} value={idNumber} mono />}
        {visitorPhone && <Row label={T.phone} value={visitorPhone} />}
        {host && <Row label={T.host} value={host} />}
        {purpose && <Row label={T.purpose} value={purpose} />}
      </div>

      {/* Validity block — emphasised */}
      <div
        style={{
          marginTop: 8,
          padding: 6,
          border: "2px solid #000",
          background: "#fafafa",
        }}
      >
        <Row label={T.issued} value={format(issuedAt, "dd MMM yyyy HH:mm")} mono />
        <Row label={T.duration} value={`${durationMinutes} min`} bold />
        <Row label={T.expires} value={format(validUntil, "dd MMM yyyy HH:mm")} mono bold />
      </div>

      {/* QR */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
        <QRCodeSVG value={qrPayload} size={width === 54 ? 72 : 96} level="M" fgColor="#000" />
      </div>

      {/* Warning */}
      <div
        style={{
          marginTop: 6,
          padding: 4,
          border: "1px solid #000",
          fontSize: 8,
          textAlign: "center",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 4,
          justifyContent: "center",
        }}
      >
        <AlertTriangle size={10} /> {T.warn}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 6,
          textAlign: "center",
          fontSize: 8,
          borderTop: "1px dashed #000",
          paddingTop: 4,
        }}
      >
        {T.return}
        <div style={{ marginTop: 2, fontStyle: "italic" }}>{T.footer}</div>
      </div>
    </div>
  );
};

const Row = ({
  label,
  value,
  mono,
  bold,
}: {
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
}) => (
  <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
    <span style={{ flexShrink: 0, fontWeight: 700, opacity: 0.85 }}>{label}:</span>
    <span
      style={{
        flex: 1,
        fontFamily: mono ? "monospace" : undefined,
        fontWeight: bold ? 800 : 600,
        wordBreak: "break-word",
      }}
    >
      {value}
    </span>
  </div>
);
