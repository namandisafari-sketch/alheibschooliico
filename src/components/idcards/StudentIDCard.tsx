import { User } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useRef } from "react";
import bwipjs from 'bwip-js';
import { Learner } from "@/hooks/useLearners";
import { IdCardSettings } from "@/hooks/useIdCardSettings";
import { QRCodeSVG } from "qrcode.react";

interface StudentIDCardProps {
  student: Learner;
  schoolName: string;
  isRTL?: boolean;
  side: "front" | "back";
  settings: IdCardSettings;
}

/**
 * Constructs a raw string for PDF417 mimicking Uganda National ID structure
 * [SURNAME_BASE64];[GIVEN_NAME_BASE64];;[DOB_DDMMYYYY];[ISSUE_DATE];[EXPIRY_DATE];[STUDENT_ID/NIN];[CARD_NO];[SECURITY_SEGMENT]
 */
const generateIDBarcodeData = (user: any) => {
  try {
    const names = (user.full_name || "").split(" ");
    const surname = names[0] || "";
    const givenNames = names.slice(1).join(" ") || "";
    
    // Base64 encoding (Safe for browser)
    const toBase64 = (str: string) => btoa(unescape(encodeURIComponent(str.toUpperCase())));
    
    const surnameBase64 = toBase64(surname);
    const givenNamesBase64 = toBase64(givenNames);
    
    const dob = user.date_of_birth ? format(new Date(user.date_of_birth), "ddMMyyyy") : "01012000";
    const issueDate = format(new Date(), "ddMMyyyy");
    const expiryDate = format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "ddMMyyyy");
    
    const studentId = user.id.toUpperCase();
    const cardNo = user.admission_number || user.id.slice(0, 10).toUpperCase();
    
    // Security Segment: Simulating a hash of the ID
    const securitySegment = studentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0).toString(16).toUpperCase().padStart(8, '0');
    
    return `${surnameBase64};${givenNamesBase64};;${dob};${issueDate};${expiryDate};${studentId};${cardNo};${securitySegment}`;
  } catch (error) {
    console.error('Barcode Data Gen Error:', error);
    return "ERROR_GENERATING_PAYLOAD";
  }
};

const PDF417Barcode = ({ value, height = 12 }: { value: string; height?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      try {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'pdf417',
          text: value,
          scale: 3,
          height: height,
          eclevel: 4,
          columns: 12,
          includetext: false,
          paddingwidth: 0,
          paddingheight: 0
        } as any);
      } catch (e) {
        console.error('PDF417 Rendering Error:', e);
      }
    }
  }, [value, height]);

  return <canvas ref={canvasRef} className="max-w-full h-auto block mx-auto" />;
};

export const StudentIDCard = ({
  student,
  schoolName,
  isRTL = false,
  side,
  settings,
}: StudentIDCardProps) => {
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  const admNo = student.admission_number || student.id.slice(0, 8).toUpperCase();
  const names = (student.full_name || "").split(" ");
  const surname = names[0] || "";
  const givenNames = names.slice(1).join(" ") || "";

  const cardWidth = 540;
  const cardHeight = 340;

  if (side === "front") {
    return (
      <div 
        id={`id-front-${student.id}`}
        className="relative overflow-hidden shadow-2xl print:shadow-none print:border-0 border border-slate-100 select-none bg-white"
        style={{ width: cardWidth, height: cardHeight, borderRadius: "18px" }}
      >
        <div className="absolute inset-0 z-0" style={{ 
          background: "radial-gradient(circle at center, #ffffff 0%, #f8fafc 40%, #e0e7ff 100%)",
          opacity: 0.8 
        }} />
        
        {/* Logo Watermark - Larger and more subtle */}
        {settings.school_logo_url && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.12] grayscale mix-blend-multiply pointer-events-none z-0">
            <img src={settings.school_logo_url} className="w-full h-full object-contain" crossOrigin="anonymous" />
          </div>
        )}
        
        <GuillochePattern />

        {/* Header Section */}
        <div className="p-4 pt-5 relative z-10 flex flex-col items-center">
          {/* Absolute Logo - Pushed up slightly */}
          <div 
            className="absolute left-6 top-3 flex items-center justify-center overflow-visible pointer-events-none"
            style={{ width: settings.logo_size_id || 44, height: settings.logo_size_id || 44 }}
          >
            {settings.school_logo_url ? (
              <img src={settings.school_logo_url} className="w-full h-full object-contain" crossOrigin="anonymous" />
            ) : (
              <div className="w-full h-full bg-blue-50/20 flex items-center justify-center font-bold text-blue-800 text-xs">{schoolName.charAt(0)}</div>
            )}
          </div>
          
          <div className="text-center px-12">
            <h1 className="text-[#1e3a8a] font-[900] text-lg tracking-tight leading-[1.1] uppercase">{schoolName}</h1>
            <p className="text-[#3b82f6] text-[9px] font-[800] tracking-[0.25em] mt-1.5 uppercase opacity-80">STUDENT IDENTITY CARD</p>
          </div>

          {/* Payment QR Code - Top Right */}
          <div className="absolute right-6 top-3 p-1 bg-white rounded-md border border-slate-100 shadow-sm pointer-events-none">
            <QRCodeSVG 
              value={`ALHEIB:FEE:${student.id.toUpperCase()}`}
              size={settings.logo_size_id || 44}
              level="H"
              includeMargin={false}
            />
            <p className="text-[4pt] font-[900] text-center text-slate-400 mt-0.5 leading-none uppercase">PAY FEES</p>
          </div>
        </div>

        <div className="flex px-7 gap-8 relative z-10 items-start">
          <div className="w-[125px] h-[155px] bg-slate-50 rounded-xl border-[1.5px] border-blue-100 overflow-hidden shadow-md flex-shrink-0">
            {student.photo_url ? (
              <img src={student.photo_url} className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                <User size={55} className="text-slate-300" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1.5 pt-1">
            <div className="flex flex-col">
              <Field label="SURNAME" value={surname.toUpperCase()} bold />
              <Field label="GIVEN NAMES" value={givenNames.toUpperCase()} bold />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <Field label="NATIONALITY" value="UGANDAN" />
              <Field label="SEX" value={student.gender === "male" ? "M" : "F"} />
              <Field label="DATE OF BIRTH" value={student.date_of_birth ? format(new Date(student.date_of_birth), "dd.MM.yyyy") : "---"} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="CLASS" value={student.class_name || "---"} />
              <Field label="EMIS / ID NO." value={admNo} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="CARD NO." value={student.id.slice(0, 10).toUpperCase()} />
              {(student.class_name?.includes("P.7") || student.class_name?.toLowerCase().includes("primary seven")) && (
                <Field label="INDEX NO." value={student.uneb_index_number || "PENDING"} color="text-blue-700" bold />
              )}
            </div>

            <div className="flex justify-between items-end pr-2">
              <Field label="DATE OF EXPIRY" value={format(validUntil, "dd.MM.yyyy")} color="text-red-600" />
              <div className="text-right">
                <p className="text-[6pt] font-[900] text-slate-400 uppercase tracking-tighter mb-0.5">SIGNATURE</p>
                <span className="font-['Dancing_Script',_cursive] text-lg text-slate-700 opacity-60 leading-none">{student.full_name}</span>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="absolute bottom-[75px] right-8 overflow-hidden rounded-full border border-slate-200/30 z-20"
          style={{ 
            width: 52, 
            height: 52,
            mixBlendMode: 'multiply',
            filter: 'grayscale(100%) contrast(120%) opacity(0.25)'
          }}
        >
          {student.photo_url ? (
            <img src={student.photo_url} className="w-full h-full object-cover" crossOrigin="anonymous" />
          ) : (
            <div className="w-full h-full bg-slate-300" />
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[55px] bg-white/90 border-t border-slate-100 px-7 py-2 z-30">
           <div className="font-mono text-[13.5px] leading-[1.1] font-bold text-slate-600 tracking-[0.28em]">
              <div>{"IDUGA" + student.id.slice(0,10).toUpperCase() + "<<<<<<<<<<<<<<<<<<"}</div>
              <div>{"0603021M3501302UGA250130<<<<<<6"}</div>
              <div>{surname.toUpperCase() + "<<" + givenNames.replace(/ /g, "<").toUpperCase() + "<<<<<<<<<<<<<<<<<"}</div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      id={`id-back-${student.id}`}
      className="relative overflow-hidden shadow-2xl print:shadow-none print:border-0 border border-slate-100 bg-white"
      style={{ width: cardWidth, height: cardHeight, borderRadius: "18px" }}
    >
      <div className="absolute inset-0 z-0 h-[220px]" style={{ background: "radial-gradient(circle at center, #ffffff 0%, #f1f5f9 100%)", opacity: 0.6 }} />
      <GuillochePattern />
      
      <div className="relative h-full w-full z-10 flex flex-col pt-4">
        <div className="px-7 flex justify-between items-start">
          <div className="flex-shrink-0 text-center">
            <p className="text-[7pt] font-[900] text-[#1e3a8a] uppercase mb-1 tracking-wider">RIGHT THUMB</p>
            <div className="w-24 h-24 bg-white/60 rounded-xl border border-slate-200 shadow-inner flex items-center justify-center overflow-hidden">
               <img src="https://cdn-icons-png.flaticon.com/512/111/111833.png" className="w-14 opacity-[0.2] grayscale contrast-125" />
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center pt-2">
            <p className="text-[5pt] font-[900] text-slate-300 uppercase mb-1 tracking-[0.2em] leading-none">SECURITY DATA STREAM</p>
            <div className="bg-white/40 p-1 rounded-md border border-slate-100 min-w-[200px]">
               {/* 2D PDF417 with authentic Uganda NID Payload */}
               <PDF417Barcode 
                 value={generateIDBarcodeData(student)} 
                 height={settings.barcode_height || 12}
               />
            </div>
          </div>
        </div>

        <div className="px-10 space-y-1.5 mt-2">
           <AddressField label="VILLAGE" value={(student as any).village} />
           <AddressField label="PARISH" value={(student as any).parish} />
           <AddressField label="S.COUNTY" value={(student as any).sub_county} />
           <AddressField label="DISTRICT" value={(student as any).district || "WAKISO"} />
        </div>

        <div className="px-10 flex justify-between gap-12 mt-auto mb-2">
           <Signature 
             label="DIRECTOR" 
             name={settings.director_name} 
             url={settings.director_signature_url} 
             height={settings.signature_height_id}
           />
           <Signature 
             label="HEAD TEACHER" 
             name={settings.head_teacher_name} 
             url={settings.head_teacher_signature_url} 
             height={settings.signature_height_id}
           />
        </div>

        <div className="h-[82px] bg-white border-t border-slate-100 px-10 py-3">
           <div className="font-mono text-[15.5px] leading-[1.2] font-bold text-slate-800 tracking-[0.3em]">
              <div>{"IDUGA" + student.id.slice(0,18).toUpperCase() + "<<<<<<<<<<<<<"}</div>
              <div>{"0603021M3501302UGA250130<<<<<<6"}</div>
              <div>{surname.toUpperCase() + "<<" + givenNames.replace(/ /g, "<").toUpperCase() + "<<<<<<<<<<<<<<<<<"}</div>
           </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, color = "text-[#1e293b]", bold = false }: { label: string; value: string; color?: string; bold?: boolean }) => (
  <div className="mb-0.5">
    <p className="text-[7.5pt] font-[800] text-slate-400 uppercase leading-none tracking-tight mb-0.5">{label}</p>
    <p className={`${bold ? 'text-[11.5pt] font-[900]' : 'text-[10.5pt] font-[900]'} ${color} leading-none truncate uppercase tracking-tighter`}>{value}</p>
  </div>
);

const AddressField = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex items-baseline gap-4 border-b border-slate-50 pb-0.5">
    <span className="text-[7.5pt] font-[800] text-slate-500 uppercase tracking-tighter min-w-[70px]">{label}:</span>
    <span className="text-[9.5pt] font-[900] text-slate-800 uppercase truncate">
      {value ? value : "----"}
    </span>
  </div>
);

const Signature = ({ label, name, url, height = 22 }: { label: string; name?: string; url?: string; height?: number }) => (
  <div className="flex-1 text-center border-t border-slate-100 pt-1.5">
    <div 
      className="flex items-center justify-center mb-0.5"
      style={{ height: height }}
    >
      {url ? (
        <img src={url} className="max-h-full max-w-full object-contain grayscale brightness-50" crossOrigin="anonymous" />
      ) : (
        <div className="w-10 border-b border-dashed border-slate-200" />
      )}
    </div>
    <p className="text-[6pt] font-[900] text-blue-900 leading-none uppercase truncate">{name}</p>
    <p className="text-[5pt] font-[800] text-slate-300 uppercase tracking-[0.2em]">{label}</p>
  </div>
);

const GuillochePattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
    <pattern id="waves-nid-v7" x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse">
      <path d="M0,7.5 Q3.75,0 7.5,7.5 T15,7.5" fill="none" stroke="#1e3a8a" strokeWidth="0.2" />
    </pattern>
    <rect width="100%" height="100%" fill="url(#waves-nid-v7)" />
  </svg>
);
