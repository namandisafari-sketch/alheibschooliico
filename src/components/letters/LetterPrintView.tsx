import { useRef } from "react";
import { useIdCardSettings } from "@/hooks/useIdCardSettings";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { format } from "date-fns";
import alheibLogo from "@/assets/iico-logo.jpg";
import alheibStamp from "@/assets/alheib-stamp.png";
import alheibHeadteacherSig from "@/assets/alheib-headteacher-signature.png";

const RECIPIENT_LABELS: Record<string, string> = {
  center_director: "Center Director",
  direct_manager: "Direct Manager",
  dos: "Director of Studies (DOS)",
  head_teacher: "Head Teacher",
  office_manager: "Office Manager",
  accountant: "Accountant",
};

function formatBody(body: string): string {
  return body
    .replace(/<!--signature:.*?-->/g, "")
    .trim();
}

function extractSignature(body: string): string | null {
  return body?.match(/<!--signature:(.*?)-->/)?.[1] || null;
}

interface LetterPrintViewProps {
  letter: {
    id: string;
    subject: string;
    body: string;
    to_role: string;
    created_at: string;
    from_user?: string;
  };
  senderName?: string;
}

export const LetterPrintView = ({ letter, senderName }: LetterPrintViewProps) => {
  const { data: idSettings } = useIdCardSettings();
  const { data: site } = useSiteSettings();
  const ref = useRef<HTMLDivElement>(null);

  const schoolName = site?.landing_hero?.school_name || "ALHEIB PRIMARY SCHOOL";
  const address = site?.landing_contact?.address || "KITIKIFUMBA - KIRA";
  const phone = site?.landing_contact?.phone || "0788 402156 / 0745397122";
  const email = site?.landing_contact?.email || "aps@iico.org";
  const logo = idSettings?.school_logo_url || alheibLogo;
  const stamp = idSettings?.school_stamp_url || alheibStamp;
  const stampSize = idSettings?.stamp_size_report ?? 80;
  const sigUrl = extractSignature(letter.body);
  const recipientLabel = RECIPIENT_LABELS[letter.to_role] || letter.to_role;

  const print = () => {
    const content = ref.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const styles = Array.from(document.querySelectorAll("style, link[rel=stylesheet]"))
      .map((el) => el.outerHTML)
      .join("\n");
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${letter.subject}</title>
          ${styles}
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .letter-print-view { width: 210mm; min-height: 297mm; padding: 20mm 25mm; box-sizing: border-box; font-family: system-ui, sans-serif; }
            .letter-print-view * { color-adjust: exact; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    win.document.close();
    Array.from(win.document.images)
      .filter((img) => !img.complete)
      .forEach((img) => (img.onload = () => { img.onload = null; }));
    setTimeout(() => win.print(), 800);
  };

  const downloadPdf = async () => {
    const content = ref.current;
    if (!content) return;
    try {
      const canvas = await toPng(content, { quality: 1, pixelRatio: 2, cacheBust: true });
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = 210;
      const pdfH = 297;
      const marginX = 25;
      const marginY = 20;
      const usableW = pdfW - marginX * 2;
      const usableH = pdfH - marginY * 2;
      const imgAspect = canvas.width / canvas.height;
      let imgW = usableW;
      let imgH = imgW / imgAspect;
      if (imgH > usableH) {
        imgH = usableH;
        imgW = imgH * imgAspect;
      }
      const xOff = (pdfW - imgW) / 2;
      const yOff = marginY;
      pdf.addImage(canvas, "PNG", xOff, yOff, imgW, imgH);
      pdf.save(`${letter.subject.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    } catch (e) {
      console.error("PDF generation failed", e);
    }
  };

  return (
    <>
      {/* Hidden A4-styled print content — rendered off-screen for capture */}
      <div className="absolute -left-[9999px] top-0">
        <div ref={ref} className="letter-print-view bg-white p-0" style={{ width: "700px", padding: "40px 50px" }}>
          {/* Header */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
            <tbody>
              <tr>
                <td style={{ width: "80px", verticalAlign: "middle", textAlign: "center" }}>
                  <img src={logo} alt="Logo" style={{ width: "72px", height: "72px", objectFit: "contain" }} />
                </td>
                <td style={{ verticalAlign: "middle", textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", letterSpacing: "1px" }}>{schoolName}</div>
                  <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>{address}</div>
                  <div style={{ fontSize: "11px", color: "#555" }}>Tel: {phone} | Email: {email}</div>
                </td>
                <td style={{ width: "80px", verticalAlign: "middle", textAlign: "center" }}>
                  <img src={logo} alt="Logo" style={{ width: "72px", height: "72px", objectFit: "contain" }} />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Separator */}
          <div style={{ width: "100%", height: "2px", backgroundColor: "#000", marginBottom: "24px" }} />

          {/* Subject */}
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontWeight: "bold", fontSize: "10px", color: "#666", textTransform: "uppercase" }}>SUBJECT:</span>
            <div style={{ fontSize: "15px", fontWeight: "bold", marginTop: "2px" }}>{letter.subject}</div>
          </div>

          {/* Meta */}
          <div style={{ fontSize: "11px", color: "#777", marginBottom: "20px" }}>
            To: <strong>{recipientLabel}</strong> &nbsp;|&nbsp; Date: {format(new Date(letter.created_at), "MMMM d, yyyy")}
            {senderName && <> &nbsp;|&nbsp; From: <strong>{senderName}</strong></>}
          </div>

          {/* Body */}
          <div style={{ fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap", marginBottom: "32px", minHeight: "120px" }}>
            {formatBody(letter.body)}
          </div>

          {/* Signature */}
          <div style={{ marginTop: "24px" }}>
            <div style={{ fontSize: "11px", color: "#555" }}>
              Sincerely,
            </div>
            {sigUrl ? (
              <div style={{ marginTop: "4px" }}>
                <img src={sigUrl} alt="Signature" style={{ height: "36px", objectFit: "contain" }} />
              </div>
            ) : (
              <div style={{ height: "36px" }} />
            )}
            <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
              {senderName || "Staff Member"}
            </div>
          </div>

          {/* Footer with stamp */}
          <div style={{ marginTop: "40px", display: "flex", justifyContent: "center" }}>
            <img src={stamp} alt="Stamp" style={{ width: `${stampSize}px`, height: `${stampSize}px`, objectFit: "contain", opacity: 0.7 }} />
          </div>

          {/* Bottom branding bar */}
          <div style={{ width: "100%", height: "2px", backgroundColor: "#000", marginTop: "24px", marginBottom: "8px" }} />
          <div style={{ fontSize: "9px", color: "#999", textAlign: "center" }}>
            {schoolName} &mdash; Official Correspondence
          </div>
        </div>
      </div>

      {/* Action buttons — rendered inline in the UI */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={print}
          className="text-xs text-primary hover:underline"
          title="Print letter"
        >
          Print
        </button>
        <span className="text-muted-foreground">·</span>
        <button
          type="button"
          onClick={downloadPdf}
          className="text-xs text-primary hover:underline"
          title="Download as PDF"
        >
          PDF
        </button>
      </div>
    </>
  );
};
