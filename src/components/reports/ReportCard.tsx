import { Learner } from "@/hooks/useLearners";
import { TermResult, Subject, ReportCardRow } from "@/hooks/useTermResults";
import { Database } from "@/integrations/supabase/types";
import { useIdCardSettings } from "@/hooks/useIdCardSettings";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { format } from "date-fns";

// Convert ASCII digits → Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩)
const toAr = (s: string | number | null | undefined): string => {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
};

type TermType = Database["public"]["Enums"]["term_type"];

interface ReportCardProps {
  learner: Learner;
  results: TermResult[];
  subjects: Subject[];
  className: string;
  classLevel?: number;
  term: TermType;
  academicYear: number;
  teacherName?: string;
  meta?: ReportCardRow | null;
}

// English → Arabic name mapping for common subjects on the Alheib form
const ARABIC_SUBJECT: Record<string, string> = {
  english: "علوم اللغة",
  "english language": "علوم اللغة",
  literacy: "علوم اللغة",
  arabic: "علوم اللغة",
  mathematics: "الرياضيات",
  maths: "الرياضيات",
  math: "الرياضيات",
  science: "العلوم",
  sst: "الدراسات الاجتماعية",
  "social studies": "الدراسات الاجتماعية",
  re: "التربية الدينية",
  "religious education": "التربية الدينية",
  ire: "التربية الإسلامية",
  cre: "التربية المسيحية",
  quran: "علوم القرآن",
  "quran studies": "علوم القرآن",
  "qur'an": "علوم القرآن",
  fiqh: "الفقه",
  "islamic studies": "التربية الإسلامية",
  "arabic language": "علوم اللغة",
  hadith: "الحديث",
  aqeedah: "العقيدة",
  tajweed: "التجويد",
};

const arName = (name: string) =>
  ARABIC_SUBJECT[name.trim().toLowerCase()] ?? name;

// PLE aggregate from a 0-100 score (UNEB style D1..F9)
const aggOf = (score: number | null | undefined): number => {
  if (score === null || score === undefined || isNaN(score)) return 9;
  if (score >= 80) return 1;
  if (score >= 75) return 2;
  if (score >= 70) return 3;
  if (score >= 65) return 4;
  if (score >= 60) return 5;
  if (score >= 55) return 6;
  if (score >= 50) return 7;
  if (score >= 45) return 8;
  return 9;
};

const divisionFromAgg = (totalAgg: number, coreCount: number): string => {
  // Standard UNEB divisions for 4 core subjects
  if (coreCount < 4) return "—";
  if (totalAgg <= 12) return "DIV I";
  if (totalAgg <= 23) return "DIV II";
  if (totalAgg <= 29) return "DIV III";
  if (totalAgg <= 34) return "DIV IV";
  return "U";
};

const termLabel: Record<TermType, string> = {
  term_1: "TERM ONE",
  term_2: "TERM TWO",
  term_3: "TERM THREE",
};

const termLabelAr: Record<TermType, string> = {
  term_1: "الفصل الأول",
  term_2: "الفصل الثاني",
  term_3: "الفصل الثالث",
};

export const ReportCard = ({
  learner,
  results,
  subjects,
  className,
  classLevel,
  term,
  academicYear,
  teacherName,
  meta,
}: ReportCardProps) => {
  const { data: idSettings } = useIdCardSettings();
  const { data: site } = useSiteSettings();

  const schoolName =
    site?.landing_hero?.school_name || "ALHEIB PRIMARY SCHOOL";
  const schoolNameAr = "مدرسة اللهيب الابتدائية";
  const address = site?.landing_contact?.address || "KITIKIFUMBA - KIRA";
  const poBox = "P.O. BOX 2891 KAMPALA - UGANDA";
  const phone = site?.landing_contact?.phone || "0788 402156 / 0745397122";
  const email = site?.landing_contact?.email || "aps@iico.org";
  const logo = idSettings?.school_logo_url;
  const headteacherSignature = idSettings?.head_teacher_signature_url;
  const stamp = idSettings?.school_stamp_url;
  const headteacherName = idSettings?.head_teacher_name || "HEADTEACHER";
  const logoSize = idSettings?.logo_size_report ?? 96;
  const sigHeight = idSettings?.signature_height_report ?? 32;
  const stampSize = idSettings?.stamp_size_report ?? 80;

  // Split English (LTR) academics vs Islamic/Arabic (RTL) subjects
  const academics = subjects.filter((s) => s.category !== "islamic");
  const islamic = subjects.filter((s) => s.category === "islamic");

  // Pad rows so both side-by-side tables have the same number of rows
  const rowCount = Math.max(academics.length, islamic.length, 5);
  const academicRows = Array.from({ length: rowCount }, (_, i) => academics[i] ?? null);
  const islamicRows = Array.from({ length: rowCount }, (_, i) => islamic[i] ?? null);

  const resultFor = (subjectId?: string) =>
    subjectId ? results.find((r) => r.subject_id === subjectId) : undefined;

  // Totals
  const academicTotalMax = academicRows.filter(Boolean).length * 100;
  const academicTotalScore = academicRows.reduce((sum, s) => {
    if (!s) return sum;
    const r = resultFor(s.id);
    return sum + (r?.score ?? 0);
  }, 0);
  const academicTotalAgg = academicRows.reduce((sum, s) => {
    if (!s) return sum;
    const r = resultFor(s.id);
    return sum + (r?.score != null ? aggOf(r.score) : 0);
  }, 0);

  const islamicTotalMax = islamicRows.filter(Boolean).length * 100;
  const islamicTotalScore = islamicRows.reduce((sum, s) => {
    if (!s) return sum;
    const r = resultFor(s.id);
    return sum + (r?.score ?? 0);
  }, 0);

  const coreAcademic = academicRows.filter((s) => s && s.is_core);
  const coreAggSum = coreAcademic.reduce((sum, s) => {
    const r = resultFor(s!.id);
    return sum + (r?.score != null ? aggOf(r.score) : 9);
  }, 0);
  const division = meta?.academic_position
    ? `DIV ${["I", "II", "III", "IV"][Math.min(3, Math.floor((meta.academic_position - 1) / 10))]}`
    : divisionFromAgg(coreAggSum, coreAcademic.length);

  // Bottom monthly summary — uses 4 core subjects (ENG, MTC, SCIE, SST)
  const bottomSubjects = ["english", "mathematics", "science", "sst"]
    .map((key) =>
      academics.find((s) =>
        s.name.trim().toLowerCase().includes(key === "sst" ? "social" : key) ||
        s.code?.toLowerCase() === key
      )
    );

  return (
    <div
      className="report-card-root bg-white text-black mx-auto font-serif flex flex-col"
      style={{
        width: "210mm",
        height: "297mm",
        padding: "6mm 7mm",
        fontSize: "9pt",
        lineHeight: 1.25,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Header — English left, crest center, Arabic right */}
      <div className="flex items-start justify-between border-b-2 border-black pb-2">
        <div className="text-[9pt] leading-tight" style={{ width: "38%" }}>
          <div className="font-bold text-[11pt]">{schoolName.toUpperCase()}</div>
          <div>{address.toUpperCase()}</div>
          <div>{poBox}</div>
          <div>TEL: {phone}</div>
          <div>Email: {email}</div>
        </div>
        <div className="flex flex-col items-center" style={{ width: "20%" }}>
          {logo ? (
            <img
              src={logo}
              alt="School crest"
              style={{ width: logoSize, height: logoSize, objectFit: "contain" }}
            />
          ) : (
            <div
              className="rounded-full border-2 border-black flex items-center justify-center text-[8pt] text-center"
              style={{ width: logoSize, height: logoSize }}
            >
              SCHOOL<br />CREST
            </div>
          )}
        </div>
        <div
          className="text-[9pt] leading-tight text-right"
          style={{ width: "38%", direction: "rtl" }}
        >
          <div className="font-bold text-[12pt]">{schoolNameAr}</div>
          <div>كيتيكيفومبا - كيرا</div>
          <div>ص.ب: ٢٨٩١ كمبالا - أوغندا</div>
          <div>هاتف: ٠٧٨٨٤٠٢١٥٦ / ٠٧٤٥٣٩٧١٢٢</div>
          <div>البريد الإلكتروني: {email}</div>
        </div>
      </div>

      {/* Title row */}
      <div className="flex justify-between items-center mt-2 mb-1">
        <div className="font-bold underline text-[11pt]">SCHOOL PROGRESS REPORT</div>
        <div className="font-bold text-[12pt]" style={{ direction: "rtl" }}>
          تقرير التقدم الدراسي
        </div>
      </div>

      {/* Bio fields — paired English (left) / Arabic (right) */}
      <div className="space-y-[3px] text-[10pt]">
        <BioRow
          enLabel="NAME"
          enValue={learner.full_name}
          arLabel="الاسم"
          arValue={learner.full_name}
        />
        <div className="grid grid-cols-2 gap-3">
          <BioRow
            enLabel="AD NO"
            enValue={learner.admission_number ?? "—"}
            arLabel="رقم القيد"
            arValue={toAr(learner.admission_number ?? "—")}
            inline
          />
          <BioRow
            enLabel="PRINT DATE"
            enValue={format(new Date(), "dd/MM/yyyy")}
            arLabel="تاريخ الطباعة"
            arValue={toAr(format(new Date(), "dd/MM/yyyy"))}
            inline
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <BioRow enLabel="CLASS" enValue={className} arLabel="الصف" arValue={toAr(className)} inline />
          <BioRow
            enLabel="SEX"
            enValue={learner.gender === "male" ? "M" : "F"}
            arLabel="الجنس"
            arValue={learner.gender === "male" ? "ذكر" : "أنثى"}
            inline
          />
          <BioRow
            enLabel="YEAR"
            enValue={String(academicYear)}
            arLabel="السنة الدراسية"
            arValue={toAr(academicYear)}
            inline
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <BioRow
            enLabel="POSITION"
            enValue={meta?.academic_position ? String(meta.academic_position) : "—"}
            arLabel="الترتيب"
            arValue={meta?.academic_position ? toAr(meta.academic_position) : "—"}
            inline
          />
          <BioRow
            enLabel="OUT OF"
            enValue={meta?.class_size ? String(meta.class_size) : "—"}
            arLabel="من أصل"
            arValue={meta?.class_size ? toAr(meta.class_size) : "—"}
            inline
          />
          <BioRow
            enLabel="TERM"
            enValue={termLabel[term]}
            arLabel="الفصل"
            arValue={termLabelAr[term]}
            inline
          />
        </div>
      </div>

      {/* Side-by-side subject tables */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {/* English / Academic table — LTR */}
        <table className="w-full border-collapse border border-black text-[9pt]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-1 py-1 text-left">SUBJECT</th>
              <th className="border border-black px-1 py-1">FULL MARKS</th>
              <th className="border border-black px-1 py-1">MARKS GAINED</th>
              <th className="border border-black px-1 py-1">AGG</th>
              <th className="border border-black px-1 py-1">TEACHERS INTIALS</th>
            </tr>
          </thead>
          <tbody>
            {academicRows.map((s, i) => {
              const r = s ? resultFor(s.id) : undefined;
              return (
                <tr key={`ac-${i}`} style={{ height: "20px" }}>
                  <td className="border border-black px-1 py-1 font-semibold uppercase">
                    {s?.name ?? ""}
                  </td>
                  <td className="border border-black px-1 py-1 text-center">
                    {s ? "100" : ""}
                  </td>
                  <td className="border border-black px-1 py-1 text-center font-mono">
                    {r?.score ?? ""}
                  </td>
                  <td className="border border-black px-1 py-1 text-center font-mono">
                    {r?.score != null ? aggOf(r.score) : ""}
                  </td>
                  <td className="border border-black px-1 py-1 text-center text-[8pt]">
                    {r?.teacher_remarks ? r.teacher_remarks.slice(0, 3).toUpperCase() : ""}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gray-100 font-bold">
              <td className="border border-black px-1 py-1">TOTAL</td>
              <td className="border border-black px-1 py-1 text-center">{academicTotalMax}</td>
              <td className="border border-black px-1 py-1 text-center font-mono">
                {academicTotalScore}
              </td>
              <td className="border border-black px-1 py-1 text-center font-mono">
                {academicTotalAgg}
              </td>
              <td className="border border-black"></td>
            </tr>
          </tbody>
        </table>

        {/* Islamic / Arabic table — RTL */}
        <table
          className="w-full border-collapse border border-black text-[9pt]"
          style={{ direction: "rtl" }}
        >
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-1 py-1">المواد الدراسية</th>
              <th className="border border-black px-1 py-1">الدرجة الكبرى</th>
              <th className="border border-black px-1 py-1">الدرجة المتحصلة</th>
              <th className="border border-black px-1 py-1">التوقيع</th>
            </tr>
          </thead>
          <tbody>
            {islamicRows.map((s, i) => {
              const r = s ? resultFor(s.id) : undefined;
              return (
                <tr key={`is-${i}`} style={{ height: "20px" }}>
                  <td className="border border-black px-1 py-1 font-semibold">
                    {s ? arName(s.name) : ""}
                  </td>
                  <td className="border border-black px-1 py-1 text-center">
                    {s ? "١٠٠" : ""}
                  </td>
                  <td className="border border-black px-1 py-1 text-center font-mono">
                    {r?.score != null ? toAr(r.score) : ""}
                  </td>
                  <td className="border border-black px-1 py-1 text-center text-[8pt]">
                    {r?.letter_grade ?? ""}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gray-100 font-bold">
              <td className="border border-black px-1 py-1">المجموع</td>
              <td className="border border-black px-1 py-1 text-center">{toAr(islamicTotalMax)}</td>
              <td className="border border-black px-1 py-1 text-center font-mono">
                {toAr(islamicTotalScore)}
              </td>
              <td className="border border-black"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* (Islamic Monthly Assessment block removed to keep report on one page) */}

      {/* Bottom monthly performance — ENG / MTC / SCIE / SST / AGG / DIV / REMARKS */}
      <table className="w-full border-collapse border border-black text-[9pt] mt-2">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-1 py-1">MONTH</th>
            <th className="border border-black px-1 py-1">ENG</th>
            <th className="border border-black px-1 py-1">MTC</th>
            <th className="border border-black px-1 py-1">SCIE</th>
            <th className="border border-black px-1 py-1">SST</th>
            <th className="border border-black px-1 py-1">AGG</th>
            <th className="border border-black px-1 py-1">DIV</th>
            <th className="border border-black px-1 py-1" style={{ width: "30%" }}>
              REMARKS
            </th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ height: "20px" }}>
            <td className="border border-black px-1 py-1 text-center font-semibold">
              {termLabel[term]}
            </td>
            {bottomSubjects.map((s, idx) => {
              const r = s ? resultFor(s.id) : undefined;
              return (
                <td key={idx} className="border border-black px-1 py-1 text-center font-mono">
                  {r?.score ?? ""}
                </td>
              );
            })}
            <td className="border border-black px-1 py-1 text-center font-mono font-bold">
              {bottomSubjects.reduce(
                (sum, s) => sum + (s ? aggOf(resultFor(s.id)?.score) : 0),
                0
              ) || ""}
            </td>
            <td className="border border-black px-1 py-1 text-center font-bold">{division}</td>
            <td className="border border-black px-1 py-1 text-[8pt]">
              {meta?.class_teacher_remarks ?? ""}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Class Teacher's Remarks */}
      <div className="flex justify-between items-start mt-3 gap-3">
        <div className="flex-1">
          <div className="text-[9pt]">
            <span className="font-bold">CLASS TEACHER'S REMARKS:</span>{" "}
            <span className="border-b border-black inline-block min-w-[300px]">
              {meta?.class_teacher_remarks ?? ""}
            </span>
          </div>
          <div className="text-[9pt] mt-2">
            <span className="font-bold">SIGN:</span>{" "}
            <span className="border-b border-black inline-block min-w-[150px]">
              {teacherName ?? ""}
            </span>
          </div>
        </div>
        <div className="text-[10pt] text-right" style={{ direction: "rtl", width: "40%" }}>
          <div>
            <span className="font-bold">ملاحظات المعلم / المعلمة:</span>
            <span className="border-b border-black inline-block min-w-[180px] mr-2"></span>
          </div>
          <div className="mt-2">
            <span className="font-bold">التوقيع:</span>
            <span className="border-b border-black inline-block min-w-[150px] mr-2"></span>
          </div>
        </div>
      </div>

      {/* Headteacher's Remarks */}
      <div className="flex justify-between items-start mt-3 gap-3">
        <div className="flex-1">
          <div className="text-[9pt]">
            <span className="font-bold">HEADTEACHER'S REMARKS:</span>{" "}
            <span className="border-b border-black inline-block min-w-[300px]">
              {meta?.head_teacher_remarks ?? ""}
            </span>
          </div>
          <div className="text-[9pt] mt-2 grid grid-cols-2 gap-3">
            <div>
              <span className="font-bold">NAME:</span>{" "}
              <span className="border-b border-black inline-block min-w-[120px]">
                {headteacherName}
              </span>
            </div>
            <div>
              <span className="font-bold">SIGNATURE:</span>{" "}
              {headteacherSignature ? (
                <img
                  src={headteacherSignature}
                  alt="Headteacher signature"
                  className="inline-block object-contain align-middle"
                  style={{ height: sigHeight, maxWidth: 180 }}
                />
              ) : (
                <span className="border-b border-black inline-block min-w-[120px]"></span>
              )}
            </div>
          </div>
        </div>
        <div
          className="text-[10pt] text-right"
          style={{ direction: "rtl", width: "40%" }}
        >
          <div>
            <span className="font-bold">ملاحظات مديرة المدرسة:</span>
            <span className="border-b border-black inline-block min-w-[180px] mr-2"></span>
          </div>
          <div className="mt-2">
            <span className="font-bold">التوقيع:</span>
            <span className="border-b border-black inline-block min-w-[150px] mr-2"></span>
          </div>
        </div>
      </div>

      {/* Footer — Next term + official school stamp (pinned to bottom) */}
      <div className="flex justify-between items-end mt-auto pt-2 border-t border-black">
        <div className="text-[9pt]">
          <span className="font-bold">NEXT TERM BEGINS ON:</span>{" "}
          <span className="border-b border-black inline-block min-w-[180px]"></span>
        </div>
        <div className="text-center">
          {stamp ? (
            <img
              src={stamp}
              alt="Official school stamp"
              className="object-contain mx-auto"
              style={{ height: stampSize, maxWidth: stampSize * 2.5 }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ── Inline bio field helper ──────────────────────────────────────────────────
interface BioRowProps {
  enLabel: string;
  enValue: string;
  arLabel: string;
  arValue: string;
  inline?: boolean;
}
const BioRow = ({ enLabel, enValue, arLabel, arValue, inline }: BioRowProps) => (
  <div className={`flex items-baseline justify-between gap-2 text-[10pt] ${inline ? "" : ""}`}>
    <div className="flex items-baseline gap-1 flex-1 min-w-0">
      <span className="font-bold whitespace-nowrap">{enLabel}:</span>
      <span className="border-b border-black flex-1 min-w-0 px-1 font-semibold truncate">
        {enValue}
      </span>
    </div>
    <div
      className="flex items-baseline gap-1 flex-1 min-w-0"
      style={{ direction: "rtl" }}
    >
      <span className="font-bold whitespace-nowrap">{arLabel}:</span>
      <span className="border-b border-black flex-1 min-w-0 px-1 font-semibold truncate">
        {arValue}
      </span>
    </div>
  </div>
);
