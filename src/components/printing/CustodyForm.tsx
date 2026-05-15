import { format } from "date-fns";
import iicoLogo from "@/assets/iico-logo.jpg";

interface CustodyFormProps {
  advance: any;
}

export const CustodyForm = ({ advance }: CustodyFormProps) => {
  if (!advance) return null;

  const dateStr = format(new Date(advance.created_at || new Date()), "dd / MM / yyyy");
  const employeeName = advance.employee?.full_name || "............................";
  const position = advance.employee?.position || advance.position || "............................";
  const amount = advance.amount ? Number(advance.amount).toLocaleString() : "............................";
  const projectName = advance.projects?.name || "............................";
  const duration = advance.duration_days || "...";
  const purpose = advance.purpose || "للصرف اليومي لمركز اللهيب";

  return (
    <div className="print-form shadow-sm">
      {/* Header table */}
      <table className="w-full border-collapse border border-slate-900 mb-6 text-sm" dir="rtl">
        <tbody>
          <tr>
            <td rowSpan={4} className="border border-slate-900 p-2 text-center align-middle w-[20%]">
              <img src={iicoLogo} alt="IICO" className="h-20 w-auto mx-auto object-contain" />
            </td>
            <td colSpan={3} className="border border-slate-900 p-2 text-center font-bold text-emerald-800">
              الهيئة الخيرية الإسلامية العالمية
            </td>
          </tr>
          <tr>
            <td className="border border-slate-900 p-2 w-[20%] font-bold">رقم النموذج</td>
            <td className="border border-slate-900 p-2 w-[40%]">طلب عهدة مالية مؤقتة</td>
            <td className="border border-slate-900 p-2 w-[20%] text-center">☑</td>
          </tr>
          <tr>
            <td className="border border-slate-900 p-2"></td>
            <td className="border border-slate-900 p-2">طلب عهدة مالية دائمة</td>
            <td className="border border-slate-900 p-2 text-center">☐</td>
          </tr>
          <tr>
            <td className="border border-slate-900 p-2"></td>
            <td className="border border-slate-900 p-2">شراء مواد بشكل عاجل</td>
            <td className="border border-slate-900 p-2 text-center">☐</td>
          </tr>
        </tbody>
      </table>

      {/* Title */}
      <h2 className="text-center text-xl font-bold mb-6" dir="rtl">طلب صرف عهدة (مؤقتة)</h2>

      <div className="text-right space-y-1 mb-4 text-sm" dir="rtl">
        <p className="font-bold">حفظه الله</p>
        <p className="font-bold">السيد الفاضل / مدير المكتب</p>
      </div>

      {/* Body paragraph */}
      <p className="text-right leading-loose text-sm mb-4" dir="rtl">
        بعد الاطلاع على صرف وتسوية العهدة نأمل صرف عهدة باسم / <span className="font-bold underline">{employeeName}</span> الذي يشغل منصب / <span className="font-bold underline">{position}</span>، بمبلغ ( <span className="font-bold underline">{amount}</span> ) شلن أوغندي من مخصصات ( <span className="font-bold underline">{projectName}</span> ) لمدة / <span className="font-bold underline">{duration}</span> يوم / اسبوع / شهر.
      </p>

      <p className="text-right leading-loose text-sm mb-6" dir="rtl">
        علماً بأن الاحتياج المطلوب ليس متوفراً وذلك للأغراض التالية ( <span className="font-bold">{purpose}</span> ) وسوف يتم تسوية العهدة فور الانتهاء من الغرض منها أو عند طلب ذلك.
      </p>

      {/* Requester signature block */}
      <div className="grid grid-cols-2 gap-4 text-right text-sm mb-8" dir="rtl">
        <p><span className="font-bold">الاسم:</span> {advance.requested_by_name || "............................"}</p>
        <p><span className="font-bold">التاريخ:</span> {dateStr}</p>
        <p><span className="font-bold">التوقيع:</span> ............................</p>
        <p><span className="font-bold">الوظيفة:</span> {advance.requested_by_position || "............................"}</p>
      </div>

      <div className="border-t-2 border-dashed border-slate-400 my-6" />

      {/* Accounts section */}
      <p className="text-right font-bold text-sm mb-3" dir="rtl">السيد الفاضل / مدير المكتب</p>
      <p className="text-right text-sm mb-3" dir="rtl">نحيطكم بأن الطلب:</p>

      <ul className="text-right text-sm space-y-2 mb-6 pr-6 list-disc" dir="rtl">
        <li>مستوفي لجميع متطلبات الصرف وفقاً للأنظمة واللوائح الداخلية ( نعم ) ( لا ).</li>
        <li>المخصص يسمح ( نعم ) ( لا ).</li>
        <li>توجد عهدة لم يتم تسديدها ( نعم ) ( لا ) بمبلغ ........</li>
        <li>شلن أوغندي ، بتاريخ : ....../....../{format(new Date(), "yyyy")}.</li>
      </ul>

      <h3 className="text-right font-bold text-base mb-3" dir="rtl">قسم الحسابات</h3>
      <p className="text-right text-sm mb-8" dir="rtl"><span className="font-bold">التوقيع:</span> ............................</p>

      <div className="border-t-2 border-dashed border-slate-400 my-6" />

      {/* Final approval */}
      <p className="text-right font-bold text-base mb-2" dir="rtl">الموافقة: لا مانع من صرف العهدة.</p>
      <div className="grid grid-cols-2 gap-4 text-right text-sm mt-8" dir="rtl">
        <p><span className="font-bold">اعتماد مدير المكتب:</span> ............................</p>
        <p><span className="font-bold">التوقيع:</span> ............................</p>
      </div>
    </div>
  );
};
