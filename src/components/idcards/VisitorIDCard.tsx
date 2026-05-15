import { User, ShieldCheck, AlertTriangle, Phone, MapPin } from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import type { VisitorVisit, Visitor } from "@/hooks/useVisitors";
import type { Learner } from "@/hooks/useLearners";

interface VisitorIDCardProps {
  visit?: VisitorVisit;
  visitor?: Visitor;
  learner?: Learner;
  schoolName: string;
  schoolLogoUrl?: string;
  isRTL?: boolean;
  variant: "day-pass" | "reusable" | "guardian-pickup";
  side?: "front" | "back";
}

export const VISITOR_CARD_WIDTH = 580;
export const VISITOR_CARD_HEIGHT = 365;

const VARIANTS = {
  "day-pass": {
    accent: "hsl(15 88% 48%)",
    accentDark: "hsl(15 88% 32%)",
    accentLight: "hsl(15 88% 96%)",
    stripe: "hsl(15 88% 48%)",
    titleEn: "VISITOR DAY PASS",
    titleAr: "تصريح زيارة يوم واحد",
    classification: "TEMPORARY • SINGLE DAY",
    classificationAr: "مؤقت • يوم واحد",
  },
  reusable: {
    accent: "hsl(217 85% 42%)",
    accentDark: "hsl(217 85% 28%)",
    accentLight: "hsl(217 85% 96%)",
    stripe: "hsl(217 85% 42%)",
    titleEn: "AUTHORISED VISITOR",
    titleAr: "زائر معتمد",
    classification: "RECURRING • RESTRICTED ACCESS",
    classificationAr: "زائر متكرر • وصول محدود",
  },
  "guardian-pickup": {
    accent: "hsl(142 70% 32%)",
    accentDark: "hsl(142 70% 22%)",
    accentLight: "hsl(142 70% 96%)",
    stripe: "hsl(142 70% 32%)",
    titleEn: "AUTHORISED PICK-UP",
    titleAr: "تصريح استلام الطفل",
    classification: "PARENT / GUARDIAN • LEARNER COLLECTION",
    classificationAr: "ولي الأمر • استلام الطالب",
  },
} as const;

export const VisitorIDCard = ({
  visit,
  visitor,
  learner,
  schoolName,
  schoolLogoUrl,
  isRTL = false,
  variant,
  side = "front",
}: VisitorIDCardProps) => {
  const v = VARIANTS[variant];

  const name = visit?.visitor_name || visitor?.full_name || "—";
  const phone = visit?.visitor_phone || visitor?.phone || "—";
  const photo = visit?.visitor_photo_url || visitor?.photo_url || "";
  const idNumber = visitor?.id_number || "";
  const company = visitor?.company || "";
  const badge =
    visit?.badge_number ||
    (visitor ? `V-${visitor.id.slice(0, 6).toUpperCase()}` : `V-${Date.now().toString().slice(-6)}`);
  const purpose = visit?.purpose || (variant === "guardian-pickup" ? "Learner pickup" : "");
  const host = visit?.host_name || "";

  // Serial number — short, deterministic-ish
  const serial = (visit?.id || visitor?.id || `${Date.now()}`).replace(/-/g, "").slice(0, 12).toUpperCase();
  const issuedAt = visit?.check_in_at ? new Date(visit.check_in_at) : new Date();
  // Validity policy:
  //  - day-pass:        valid only while checked-in (auto-expires on check-out, same calendar day)
  //  - reusable:        1 year (recurring contractor / staff-equivalent visitor)
  //  - guardian-pickup: PERMANENT — property of the guardian, carried on every visit
  const validUntil =
    variant === "day-pass"
      ? new Date(new Date().setHours(23, 59, 0, 0))
      : variant === "reusable"
      ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      : new Date(new Date().setFullYear(new Date().getFullYear() + 10)); // guardian-pickup ≈ permanent

  const isPermanentPickup = variant === "guardian-pickup";

  const labels = isRTL
    ? {
        title: v.titleAr,
        classification: v.classificationAr,
        name: "الاسم",
        idNo: "رقم الهوية",
        company: "الجهة",
        badge: "رقم البطاقة",
        purpose: "الغرض",
        host: "المضيف",
        phone: "الهاتف",
        issued: "صدرت",
        validUntil: isPermanentPickup ? "صالحة (دائمة)" : "صالحة حتى",
        serial: "رقم تسلسلي",
        learner: "الطالب",
        admission: "رقم القبول",
        class: "الصف",
        signature: "توقيع المسؤول",
        warning: isPermanentPickup
          ? "ملك ولي الأمر – يحملها في كل زيارة. لا تُسلَّم لأي شخص آخر. أبلغ الإدارة فوراً عند الفقد."
          : variant === "day-pass"
          ? "تصريح يوم واحد – يُلغى تلقائياً عند تسجيل الخروج. يجب الإعادة عند المغادرة."
          : "ممتلكات المدرسة. يجب إرجاعها عند انتهاء الصلاحية. أي إساءة استخدام تعرض حاملها للمساءلة.",
        verify: "تحقق برمز QR",
      }
    : {
        title: v.titleEn,
        classification: v.classification,
        name: "Name",
        idNo: "ID No.",
        company: "Organisation",
        badge: "Badge",
        purpose: "Purpose",
        host: "Host",
        phone: "Phone",
        issued: "Issued",
        validUntil: isPermanentPickup ? "Validity (Permanent)" : "Valid Until",
        serial: "Serial",
        learner: "Learner",
        admission: "Adm. No.",
        class: "Class",
        signature: "Authorised Signature",
        warning: isPermanentPickup
          ? "Property of the guardian — carry on EVERY visit. Do NOT surrender at the gate. Report loss immediately."
          : variant === "day-pass"
          ? "Single-day pass — auto-revoked at check-out. Must be returned on exit."
          : "Property of the school. Must be returned on expiry. Misuse will be prosecuted.",
        verify: "Scan QR to verify",
      };

  const qrPayload = JSON.stringify({
    t: "visitor",
    badge,
    serial,
    visit_id: visit?.id,
    visitor_id: visitor?.id,
    learner_id: learner?.id,
    issued: issuedAt.toISOString(),
  });

  // Subtle diagonal "VISITOR" watermark pattern
  const watermarkText = variant === "guardian-pickup" ? "PICK-UP" : "VISITOR";

  // ============================== BACK SIDE ==============================
  if (side === "back") {
    const rules = isRTL
      ? isPermanentPickup
        ? [
            "هذه البطاقة ملك ولي الأمر ويجب إحضارها في كل زيارة لاستلام الطفل.",
            "يجب إبرازها عند البوابة قبل تسليم الطفل.",
            "يُسلَّم الطفل فقط لحامل هذه البطاقة بعد التحقق من الهوية الوطنية.",
            "لا يجوز إعارتها أو تسليمها لأي شخص آخر.",
            "في حال الفقد، أبلغ مكتب الاستقبال فوراً لإلغائها وإصدار بديل.",
            "يجب الالتزام بسياسة حماية الطفل في جميع الأوقات.",
          ]
        : variant === "day-pass"
        ? [
            "تصريح يوم واحد فقط – يُلغى تلقائياً عند تسجيل الخروج من البوابة.",
            "في حال العودة بعد الخروج يجب إصدار تصريح طوارئ حراري جديد.",
            "يجب ارتداؤها بشكل ظاهر طوال فترة الزيارة.",
            "ممنوع التجول دون مرافقة المضيف المحدد.",
            "ممنوع التصوير أو تسجيل الفيديو دون إذن خطي.",
            "ملك للمدرسة – يجب إرجاعها عند المغادرة.",
          ]
        : [
            "بطاقة زائر متكرر – صالحة لمدة سنة من تاريخ الإصدار.",
            "يجب التسجيل عند البوابة في كل زيارة.",
            "يجب ارتداؤها بشكل ظاهر داخل الحرم.",
            "ممنوع التصوير أو تسجيل الفيديو دون إذن خطي.",
            "يجب الالتزام بسياسة حماية الطفل.",
            "ملك للمدرسة – تُرجَع عند انتهاء التعاقد أو الصلاحية.",
          ]
      : isPermanentPickup
      ? [
          "This card is the PROPERTY OF THE GUARDIAN — bring it on every collection visit.",
          "Present it at the gate before the learner is released.",
          "Learner will ONLY be released to the holder of this pass after national-ID verification.",
          "Do NOT lend or surrender this card to any other person.",
          "If lost, notify reception immediately to revoke and re-issue.",
          "All holders must comply with the school's child-protection policy.",
        ]
      : variant === "day-pass"
      ? [
          "Single-day pass — automatically REVOKED the moment you check out at the gate.",
          "If you return after check-out, a new thermal Emergency Re-entry Slip must be issued.",
          "Must be worn visibly at all times while on premises.",
          "No unescorted movement — remain with your assigned host.",
          "Photography or video recording is strictly prohibited without written consent.",
          "Property of the school — must be returned on exit.",
        ]
      : [
          "Reusable pass — valid for one (1) year from date of issue.",
          "Must be signed in at the gate on every visit.",
          "Must be worn visibly at all times while on premises.",
          "Photography or video recording is strictly prohibited without written consent.",
          "All holders must comply with the school's child-protection policy.",
          "Property of the school — returned on contract end or expiry.",
        ];

    const backLabels = isRTL
      ? {
          rulesTitle: "شروط وأحكام الزيارة",
          emergency: "في حالة الطوارئ",
          reception: "الاستقبال",
          security: "الأمن",
          ifFound: "في حال العثور على هذه البطاقة، يرجى إعادتها إلى:",
          schoolAddress: "إدارة المدرسة",
          serial: "رقم تسلسلي",
          authority: "صادرة بموجب صلاحية إدارة المدرسة",
        }
      : {
          rulesTitle: "Visit Terms & Conditions",
          emergency: "In Case of Emergency",
          reception: "Reception",
          security: "Security",
          ifFound: "If found, please return this card to:",
          schoolAddress: "School Administration Office",
          serial: "Serial",
          authority: "Issued under the authority of school administration",
        };

    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        style={{
          width: VISITOR_CARD_WIDTH,
          height: VISITOR_CARD_HEIGHT,
          borderRadius: 16,
          border: `2px solid ${v.accent}`,
          background: "white",
          color: "#0f172a",
          fontFamily: isRTL
            ? "'Cairo', 'Tajawal', 'Noto Naskh Arabic', sans-serif"
            : "'Inter', 'Cairo', sans-serif",
          overflow: "hidden",
          boxShadow: `0 12px 30px rgba(0,0,0,0.10), inset 0 0 0 1px ${v.accentLight}`,
          position: "relative",
        }}
      >
        {/* Watermark */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `repeating-linear-gradient(-30deg, ${v.accent}0D 0 2px, transparent 2px 60px)`,
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 110,
            fontWeight: 900,
            color: v.accent,
            opacity: 0.035,
            letterSpacing: 14,
            transform: "rotate(-18deg)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {watermarkText}
        </div>

        {/* Magnetic stripe */}
        <div
          style={{
            height: 36,
            background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
            marginTop: 14,
            position: "relative",
            zIndex: 1,
          }}
        />

        {/* Header band */}
        <div
          style={{
            background: `linear-gradient(135deg, ${v.accentDark} 0%, ${v.accent} 100%)`,
            color: "white",
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={13} />
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2 }}>
              {backLabels.rulesTitle.toUpperCase()}
            </div>
          </div>
          <div style={{ fontSize: 9, opacity: 0.95, fontWeight: 700, letterSpacing: 0.6 }}>
            {schoolName}
          </div>
        </div>

        {/* Rules list */}
        <div
          style={{
            padding: "10px 16px 8px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <ol
            style={{
              margin: 0,
              padding: isRTL ? "0 16px 0 0" : "0 0 0 16px",
              fontSize: 9.5,
              lineHeight: 1.45,
              color: "#1e293b",
            }}
          >
            {rules.map((rule, i) => (
              <li key={i} style={{ marginBottom: 3 }}>
                {rule}
              </li>
            ))}
          </ol>
        </div>

        {/* Emergency contact strip */}
        <div
          style={{
            margin: "0 14px",
            padding: "6px 10px",
            background: v.accentLight,
            border: `1px solid ${v.accent}`,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 9,
            position: "relative",
            zIndex: 1,
          }}
        >
          <AlertTriangle size={13} color={v.accentDark} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, lineHeight: 1.3 }}>
            <div style={{ fontWeight: 800, color: v.accentDark, fontSize: 9, letterSpacing: 0.6 }}>
              {backLabels.emergency.toUpperCase()}
            </div>
            <div style={{ display: "flex", gap: 12, color: "#334155", marginTop: 1 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Phone size={9} /> {backLabels.reception}: 999
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Phone size={9} /> {backLabels.security}: 911
              </span>
            </div>
          </div>
        </div>

        {/* Return-to address */}
        <div
          style={{
            padding: "8px 16px 0",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 8.5,
            color: "#475569",
            position: "relative",
            zIndex: 1,
          }}
        >
          <MapPin size={10} color={v.accentDark} style={{ flexShrink: 0 }} />
          <div style={{ lineHeight: 1.3 }}>
            <strong style={{ color: "#0f172a" }}>{backLabels.ifFound}</strong>{" "}
            {backLabels.schoolAddress} — {schoolName}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 28,
            background: v.accentDark,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 12px",
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          <span style={{ opacity: 0.95 }}>{backLabels.authority}</span>
          <span style={{ fontFamily: "monospace", opacity: 0.95 }}>
            {backLabels.serial}: {serial}
          </span>
        </div>
      </div>
    );
  }

  // ============================== FRONT SIDE ==============================
  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        width: VISITOR_CARD_WIDTH,
        height: VISITOR_CARD_HEIGHT,
        borderRadius: 16,
        border: `2px solid ${v.accent}`,
        background: "white",
        color: "#0f172a",
        fontFamily: isRTL
          ? "'Cairo', 'Tajawal', 'Noto Naskh Arabic', sans-serif"
          : "'Inter', 'Cairo', sans-serif",
        overflow: "hidden",
        boxShadow: `0 12px 30px rgba(0,0,0,0.10), inset 0 0 0 1px ${v.accentLight}`,
        position: "relative",
      }}
    >
      {/* Diagonal watermark */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(-30deg, ${v.accent}0D 0 2px, transparent 2px 60px)`,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 96,
          fontWeight: 900,
          color: v.accent,
          opacity: 0.04,
          letterSpacing: 12,
          transform: "rotate(-18deg)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {watermarkText}
      </div>

      {/* Security stripe (left edge) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          [isRTL ? "right" : "left"]: 0,
          width: 8,
          background: `linear-gradient(180deg, ${v.accent} 0%, ${v.accentDark} 100%)`,
        }}
      />

      {/* HEADER */}
      <div
        style={{
          height: 64,
          background: `linear-gradient(135deg, ${v.accentDark} 0%, ${v.accent} 100%)`,
          color: "white",
          display: "flex",
          alignItems: "center",
          padding: isRTL ? "0 18px 0 14px" : "0 14px 0 18px",
          gap: 12,
          position: "relative",
          zIndex: 1,
        }}
      >
        {schoolLogoUrl ? (
          <img
            src={schoolLogoUrl}
            alt="logo"
            crossOrigin="anonymous"
            style={{
              width: 46,
              height: 46,
              borderRadius: 8,
              background: "white",
              objectFit: "contain",
              padding: 3,
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 8,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {schoolName.charAt(0)}
          </div>
        )}
        <div style={{ flex: 1, lineHeight: 1.15, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: 0.3,
            }}
          >
            {schoolName}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <ShieldCheck size={11} />
            <div style={{ fontSize: 9.5, opacity: 0.95, letterSpacing: 1.4, fontWeight: 700 }}>
              {labels.title}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: isRTL ? "flex-start" : "flex-end",
            gap: 2,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              background: "white",
              color: v.accentDark,
              padding: "4px 10px",
              borderRadius: 4,
              fontFamily: "monospace",
              letterSpacing: 1,
            }}
          >
            {badge}
          </div>
          <div style={{ fontSize: 7.5, opacity: 0.9, letterSpacing: 0.8, fontWeight: 600 }}>
            {labels.classification}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div
        style={{
          display: "flex",
          padding: "12px 14px 10px",
          gap: 14,
          height: VISITOR_CARD_HEIGHT - 64 - 28, // header + footer
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* LEFT — photo + QR */}
        <div
          style={{
            width: 124,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          {photo ? (
            <img
              src={photo}
              alt={name}
              crossOrigin="anonymous"
              style={{
                width: 116,
                height: 138,
                objectFit: "cover",
                borderRadius: 8,
                border: `3px solid ${v.accent}`,
                boxShadow: `0 0 0 1px white, 0 4px 8px rgba(0,0,0,0.1)`,
              }}
            />
          ) : (
            <div
              style={{
                width: 116,
                height: 138,
                background: v.accentLight,
                borderRadius: 8,
                border: `3px solid ${v.accent}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={56} color={v.accent} />
            </div>
          )}
          <div
            style={{
              background: "white",
              padding: 4,
              borderRadius: 6,
              border: `1px solid ${v.accent}`,
            }}
          >
            <QRCodeSVG value={qrPayload} size={64} level="M" fgColor={v.accentDark} />
          </div>
          <div style={{ fontSize: 7, color: "#64748b", letterSpacing: 0.4, fontWeight: 600 }}>
            {labels.verify}
          </div>
        </div>

        {/* RIGHT — details */}
        <div style={{ flex: 1, fontSize: 11.5, lineHeight: 1.45, minWidth: 0 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: v.accentDark,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: 0.2,
            }}
          >
            {name}
          </div>
          {company && (
            <div
              style={{
                fontSize: 10,
                color: "#475569",
                fontWeight: 600,
                marginBottom: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {company}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2px 12px",
              marginTop: 6,
            }}
          >
            <Field label={labels.phone} value={phone} isRTL={isRTL} />
            {idNumber && <Field label={labels.idNo} value={idNumber} isRTL={isRTL} mono />}
            {host && <Field label={labels.host} value={host} isRTL={isRTL} />}
            {purpose && <Field label={labels.purpose} value={purpose} isRTL={isRTL} />}
          </div>

          {/* LEARNER block — only for guardian-pickup */}
          {variant === "guardian-pickup" && learner && (
            <div
              style={{
                marginTop: 6,
                padding: "6px 8px",
                background: v.accentLight,
                border: `1px dashed ${v.accent}`,
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color: v.accentDark,
                  letterSpacing: 1,
                  marginBottom: 2,
                }}
              >
                {labels.learner.toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#0f172a",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {learner.full_name}
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 9.5, color: "#334155", marginTop: 1 }}>
                <span>
                  <strong>{labels.admission}:</strong>{" "}
                  <span style={{ fontFamily: "monospace" }}>{learner.admission_number || "—"}</span>
                </span>
                <span>
                  <strong>{labels.class}:</strong> {learner.class_name || "—"}
                </span>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 6,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 12px",
              fontSize: 9,
              color: "#475569",
            }}
          >
            <div>
              <strong style={{ color: "#0f172a" }}>{labels.issued}:</strong>{" "}
              {format(issuedAt, "dd MMM yyyy HH:mm")}
            </div>
            <div>
              <strong style={{ color: isPermanentPickup ? v.accentDark : "#dc2626" }}>{labels.validUntil}:</strong>{" "}
              <span style={{ fontWeight: 700, color: isPermanentPickup ? v.accentDark : "#dc2626" }}>
                {isPermanentPickup
                  ? "PERMANENT"
                  : format(validUntil, variant === "day-pass" ? "dd MMM yyyy HH:mm" : "dd MMM yyyy")}
              </span>
            </div>
            <div style={{ gridColumn: "1 / -1", fontFamily: "monospace", fontSize: 8.5, color: "#64748b" }}>
              {labels.serial}: {serial}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER — warning + signature line */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 28,
          background: v.accentDark,
          color: "white",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 8,
          fontSize: 8.5,
          fontWeight: 600,
          letterSpacing: 0.2,
        }}
      >
        <AlertTriangle size={11} style={{ flexShrink: 0 }} />
        <div
          style={{
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            opacity: 0.95,
          }}
        >
          {labels.warning}
        </div>
        <div
          style={{
            fontSize: 8,
            opacity: 0.85,
            borderLeft: "1px solid rgba(255,255,255,0.3)",
            paddingLeft: 8,
            fontStyle: "italic",
          }}
        >
          {labels.signature}: ____________
        </div>
      </div>
    </div>
  );
};

const Field = ({
  label,
  value,
  mono,
  isRTL,
}: {
  label: string;
  value: string;
  mono?: boolean;
  isRTL?: boolean;
}) => (
  <div style={{ display: "flex", gap: 4, minWidth: 0 }}>
    <span
      style={{
        color: "#64748b",
        fontWeight: 600,
        flexShrink: 0,
        fontSize: 10,
        textAlign: isRTL ? "right" : "left",
      }}
    >
      {label}:
    </span>
    <span
      style={{
        flex: 1,
        fontFamily: mono ? "monospace" : undefined,
        color: "#0f172a",
        fontWeight: 700,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: 10.5,
      }}
    >
      {value}
    </span>
  </div>
);
