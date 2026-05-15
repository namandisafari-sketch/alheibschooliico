import { Learner } from "@/hooks/useLearners";
import { format } from "date-fns";
import { useIdCardSettings } from "@/hooks/useIdCardSettings";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

interface TermlyCircularProps {
  learner: Learner;
  term?: string;
  year?: number;
}

export const TermlyCircular = ({ learner, term = "Term Three", year = 2025 }: TermlyCircularProps) => {
  const { data: idSettings } = useIdCardSettings();
  const { data: site } = useSiteSettings();

  const schoolName = site?.landing_hero?.school_name || "ALHEIB PRIMARY SCHOOL";
  const address = site?.landing_contact?.address || "P.O BOX 2891, KAMPALA";
  const phone = site?.landing_contact?.phone || "0706747272 / 0745397122";
  const email = site?.landing_contact?.email || "aps@iico.org";
  const logo = idSettings?.school_logo_url;
  const headteacherSignature = idSettings?.head_teacher_signature_url;
  const stamp = idSettings?.school_stamp_url;
  const headteacherName = idSettings?.head_teacher_name || "NAKAYIZA AIDAH";

  return (
    <div
      className="circular-card bg-white text-slate-900 mx-auto relative flex flex-col overflow-hidden shadow-2xl"
      style={{
        width: "210mm",
        height: "297mm",
        padding: "12mm 18mm",
        fontSize: "10pt",
        lineHeight: 1.4,
        boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Decorative Border */}
      <div className="absolute inset-0 border-[1mm] border-double border-emerald-900/10 pointer-events-none m-4"></div>

      {/* Watermark Logo */}
      {logo && (
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <img src={logo} alt="" className="w-96 h-96 object-contain" />
        </div>
      )}

      {/* Header Section */}
      <div className="relative z-10 flex flex-col items-center text-center mb-6">
        <div className="flex items-center gap-6 mb-4 w-full">
          <div className="w-24 h-24 shrink-0">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-emerald-50 border-2 border-emerald-900 rounded-lg flex items-center justify-center text-[10px] font-bold text-emerald-900">LOGO</div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-emerald-900 tracking-tight font-display mb-1">
              {schoolName.toUpperCase()}
            </h1>
            <p className="text-sm font-medium text-emerald-700 italic mb-2 tracking-wide">
              "Balanced Education is our Concern"
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9pt] font-medium text-slate-600">
              <p>{address}</p>
              <p>Email: {email}</p>
              <p>Tel: {phone}</p>
              <p>Date: {format(new Date(), "MMMM dd, yyyy")}</p>
            </div>
          </div>
        </div>
        <div className="w-full h-1 bg-gradient-to-r from-emerald-900/5 via-emerald-900 to-emerald-900/5"></div>
      </div>

      {/* Subject Line & Student Context */}
      <div className="relative z-10 mb-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <p className="text-[9pt] text-slate-500 uppercase tracking-widest font-semibold">Student Name</p>
            <p className="text-xl font-bold text-emerald-900 font-display">
              {learner.full_name.toUpperCase()}
            </p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[9pt] text-slate-500 uppercase tracking-widest font-semibold">Reference</p>
            <p className="text-sm font-bold text-slate-700">APS/CIRC/{year}/{term.replace(/\s+/g, "").toUpperCase()}</p>
          </div>
        </div>
        <div className="text-center pt-2 border-t border-slate-200">
          <h2 className="text-lg font-bold text-emerald-900 underline decoration-2 decoration-emerald-500 underline-offset-4">
            RE: END OF {term.toUpperCase()} {year} SCHOOL CIRCULAR
          </h2>
          <p className="mt-2 font-bold text-emerald-800 tracking-wide text-xs">
            ASALAM ALEIKUM WARAHMATU-ALLAH WABARAKATUHU
          </p>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="relative z-10 space-y-5 text-justify leading-relaxed">
        <section>
          <h3 className="font-bold text-emerald-900 text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
            <span className="w-1 h-3 bg-emerald-500 rounded-full"></span> 1. Salutation
          </h3>
          <p className="text-slate-700 text-[9.5pt]">
            On behalf of the school administration, we extend warm greetings to you in the name of the Almighty Allah. 
            We congratulate you on the successful completion of this academic term, and we express our profound gratitude 
            to Allah for the achievements and milestones reached by our learners.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-emerald-900 text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
            <span className="w-1 h-3 bg-emerald-500 rounded-full"></span> 2. Academic Performance
          </h3>
          <p className="text-slate-700 text-[9.5pt]">
            Excellence requires resilience and focus. We urge parents to activate the triangular relationship (Teacher-Parent-Learner) 
            by closely following up on your child's academic progress. Your active involvement is crucial in ensuring our academic targets are met.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-5">
          <section className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
            <h3 className="font-bold text-emerald-900 text-[9pt] uppercase mb-2 border-b border-emerald-200 pb-1">
              Important School Norms
            </h3>
            <div className="space-y-3 text-[8.5pt]">
              <div>
                <span className="font-bold text-emerald-800">DRESS CODE:</span> As a Muslim-founded institution, we strictly observe Islamic norms. All visitors must adhere to the Islamic dress code for entry.
              </div>
              <div>
                <span className="font-bold text-emerald-800">MEALS:</span> A balanced diet has been maintained for all learners throughout the term to ensure optimal health and cognitive function.
              </div>
            </div>
          </section>

          <section className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-bold text-slate-900 text-[9pt] uppercase mb-2 border-b border-slate-300 pb-1">
              Required Items
            </h3>
            <ul className="text-[8.5pt] space-y-1 list-disc list-inside text-slate-700">
              <li>Original birth certificate (NIRA)</li>
              <li>4 bars of washing soap & 2 bathing</li>
              <li>Mattress protectors (Black leather)</li>
              <li>Shoes (Two pairs) & Shoe polish</li>
              <li>Toothbrush, Toothpaste & Vaseline</li>
            </ul>
          </section>
        </div>

        {/* Schedule Highlight */}
        <section className="bg-emerald-900 text-emerald-50 p-5 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <h3 className="font-bold text-center text-sm uppercase tracking-[3px] mb-4 border-b border-white/20 pb-2">
            Upcoming Term Schedule
          </h3>
          <div className="grid grid-cols-2 gap-8 text-center text-[9pt]">
            <div className="space-y-2">
              <p className="opacity-70 uppercase text-[8pt] tracking-widest">Boarders Report</p>
              <p className="font-bold text-lg">Sunday, Feb 01, 2026</p>
            </div>
            <div className="space-y-2">
              <p className="opacity-70 uppercase text-[8pt] tracking-widest">Term Begins</p>
              <p className="font-bold text-lg">Monday, Feb 02, 2026</p>
            </div>
          </div>
          <p className="text-center mt-4 text-[8pt] italic opacity-80 border-t border-white/10 pt-2">
            * P.7 Candidates are required to report earlier on Jan 20, 2026
          </p>
        </section>
      </div>

      {/* Footer / Sign-off */}
      <div className="mt-auto pt-6 flex justify-between items-end border-t-2 border-slate-100">
        <div className="space-y-1">
          <p className="text-emerald-800 font-medium italic">"Balanced education is our concern"</p>
          <p className="text-[8pt] text-slate-500">Wish you blessed holidays.</p>
        </div>
        <div className="text-right flex flex-col items-center">
          <div className="relative flex flex-col items-center">
             {headteacherSignature ? (
              <img src={headteacherSignature} alt="Signature" className="h-10 mb-1 z-20" />
            ) : (
              <div className="h-10"></div>
            )}
            <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 min-w-[140px]">
              {headteacherName.toUpperCase()}
            </p>
            <p className="text-[8pt] font-bold text-slate-500 uppercase tracking-widest">Head Teacher</p>
            {stamp && (
              <img 
                src={stamp} 
                alt="Stamp" 
                className="absolute -top-14 -right-10 h-24 w-24 opacity-60 mix-blend-multiply rotate-12 z-10" 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
