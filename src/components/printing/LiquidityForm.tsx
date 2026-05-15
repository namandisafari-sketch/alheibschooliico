import { format } from "date-fns";
import iicoLogo from "@/assets/iico-logo.jpg";

interface LiquidityFormProps {
  request: any;
}

export const LiquidityForm = ({ request }: LiquidityFormProps) => {
  if (!request) return null;

  const dateStr = format(new Date(request.created_at || new Date()), "dd / MM / yyyy");

  const balances = [
    { label: "سيولة العهدة في الصندوق", amount: request.custody_balance },
    { label: "سيولة ترسيات", amount: request.awards_balance },
    { label: "سيولة أخرى", amount: request.other_balance },
    { label: "أخرى", amount: request.misc_balance },
    { label: "مبالغ مستحقة للمركز (من الغير)", amount: request.receivables_balance },
    { label: "مصروفات مستحقة للغير", amount: request.payables_due },
    { label: "رصيد فواتير بقيمة", amount: request.bills_value },
  ];
  const total = balances.reduce((s, b) => s + (Number(b.amount) || 0), 0);

  const items = Array.from({ length: 6 }, (_, i) => {
    const it = (request.items || [])[i];
    return {
      n: i + 1,
      desc: it?.description || (i === 0 ? request.purpose || "" : ""),
      amount: it?.amount || (i === 0 ? request.requested_amount : ""),
      notes: it?.notes || "",
    };
  });

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
            <td className="border border-slate-900 p-2 w-[20%] text-center">☐</td>
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
      <h2 className="text-center text-xl font-bold mb-4" dir="rtl">طلب سيولة نقدية للصندوق (داخلي)</h2>

      <div className="text-right space-y-1 mb-4 text-sm" dir="rtl">
        <p className="font-bold">حفظه الله</p>
        <p className="font-bold">السيد الفاضل / مدير المركز</p>
      </div>

      <div className="flex justify-end mb-2 text-sm">
        <span><span className="font-bold">التاريخ:</span> {dateStr}</span>
      </div>

      <p className="text-right text-sm mb-3" dir="rtl">نحيطكم علماً أن أرصدة السيولة في الصندوق على النحو التالي:-</p>

      {/* Balances table */}
      <table className="w-full border-collapse border border-slate-900 mb-6 text-sm" dir="rtl">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-900 p-1 w-[10%]">م</th>
            <th className="border border-slate-900 p-1 w-[40%]">نوع السيولة</th>
            <th className="border border-slate-900 p-1 w-[25%]">المبلغ</th>
            <th className="border border-slate-900 p-1">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {balances.map((b, i) => (
            <tr key={i} style={{ height: "26px" }}>
              <td className="border border-slate-900 text-center">{i + 1}</td>
              <td className="border border-slate-900 px-2 font-bold">{b.label}</td>
              <td className="border border-slate-900 px-2 text-center font-mono">{b.amount ? Number(b.amount).toLocaleString() : ""}</td>
              <td className="border border-slate-900 px-2"></td>
            </tr>
          ))}
          <tr className="bg-slate-50">
            <td colSpan={2} className="border border-slate-900 px-2 font-bold text-center">الاجمالي</td>
            <td className="border border-slate-900 px-2 text-center font-mono font-bold">{total.toLocaleString()}</td>
            <td className="border border-slate-900 px-2"></td>
          </tr>
        </tbody>
      </table>

      <p className="text-right text-sm mb-3" dir="rtl">وعليه يرجى التكرم بالتوجيه لطلب عهدة جديدة من المكتب / سيولة نقدية من المركز وذلك لتغطية المصروفات ما يلي:-</p>

      {/* Items table */}
      <table className="w-full border-collapse border border-slate-900 mb-6 text-sm" dir="rtl">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-900 p-1 w-[10%]">مسلسل</th>
            <th className="border border-slate-900 p-1 w-[45%]">البيان</th>
            <th className="border border-slate-900 p-1 w-[20%]">قيمة العهدة</th>
            <th className="border border-slate-900 p-1">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.n} style={{ height: "26px" }}>
              <td className="border border-slate-900 text-center font-bold">{it.n}</td>
              <td className="border border-slate-900 px-2">{it.desc}</td>
              <td className="border border-slate-900 px-2 text-center font-mono">{it.amount ? Number(it.amount).toLocaleString() : ""}</td>
              <td className="border border-slate-900 px-2">{it.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signatures */}
      <table className="w-full border-collapse border border-slate-900 text-sm" dir="rtl">
        <tbody>
          <tr>
            <td className="border border-slate-900 p-2 w-1/2 font-bold">
              مقدم الطلب: {request.requested_by_name || "............................"}
            </td>
            <td className="border border-slate-900 p-2 font-bold">التوقيع: ............................</td>
          </tr>
          <tr>
            <td className="border border-slate-900 p-2 font-bold">رأي مدير المركز</td>
            <td className="border border-slate-900 p-2"></td>
          </tr>
          <tr>
            <td colSpan={2} className="border border-slate-900 p-2">
              <p>الاجراء :- إعداد نموذج طلب عهدة جديدة / استلام سيولة نقدية ( ............................ ) بتاريخ ( {dateStr} )</p>
              <p className="mt-2"><span className="font-bold">الاسم :-</span> {request.approved_by_name || "............................"} &nbsp;&nbsp;&nbsp; <span className="font-bold">التوقيع :-</span> ............................</p>
            </td>
          </tr>
          <tr>
            <td className="border border-slate-900 p-2 font-bold">اعتماد مدير المكتب</td>
            <td className="border border-slate-900 p-2 font-bold">التوقيع: ............................</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
