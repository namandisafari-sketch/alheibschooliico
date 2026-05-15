import { format } from "date-fns";
import iicoLogo from "@/assets/iico-logo.jpg";

interface StockRequestFormProps {
  transaction: any;
  hideSignatures?: boolean;
}

export const StockRequestForm = ({ transaction, hideSignatures }: StockRequestFormProps) => {
  if (!transaction) return null;

  // Build 20 rows (template style), filling first row with the actual transaction
  const rows = Array.from({ length: 20 }, (_, i) => {
    if (i === 0) {
      return {
        n: 1,
        desc: transaction.item?.name || "",
        unit: transaction.item?.unit || "",
        qty: transaction.quantity ?? "",
        available: transaction.available_quantity ?? "",
        approved: transaction.approved_quantity ?? transaction.quantity ?? "",
        notes: transaction.notes || "",
      };
    }
    return { n: i + 1, desc: "", unit: "", qty: "", available: "", approved: "", notes: "" };
  });

  const dateStr = format(new Date(transaction.transaction_date || new Date()), "dd / MM / yyyy");

  return (
    <div className="print-form shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <img src={iicoLogo} alt="IICO" className="h-20 w-auto object-contain" />
        <h1 className="text-xl font-bold text-emerald-800 self-center" dir="rtl">مركز اللهيب للرعاية الاجتماعية</h1>
        <div className="w-20" />
      </div>

      {/* Title bar */}
      <div className="flex items-center justify-end mb-2">
        <div className="border border-slate-900 px-3 py-1">
          <span className="text-sm font-bold" dir="rtl">نموزج أمر صرف مخزني </span>
          <span className="text-sm font-bold">Stock Request Form</span>
        </div>
      </div>

      {/* Date */}
      <div className="flex justify-end mb-3">
        <p className="text-sm font-bold">
          <span dir="rtl">{dateStr}</span> <span>: Date</span>
        </p>
      </div>

      {/* Salutation */}
      <p className="text-base font-bold mb-3 text-right" dir="rtl">
        الاخ مدير المركز : يرجى التكرم بالتوجيه بصرف الاصناف التالية :-
      </p>

      {/* Table */}
      <table className="w-full border-collapse border border-slate-900 text-[11px]" dir="rtl">
        <thead>
          <tr>
            <th className="border border-slate-900 p-1 w-[8%]">
              <div>رقم</div><div className="text-[10px]">Number</div>
            </th>
            <th className="border border-slate-900 p-1 w-[28%]">
              <div>بينات وتفاصيل الأصناف المنصرفة</div><div className="text-[10px]">Items description &amp; Details</div>
            </th>
            <th className="border border-slate-900 p-1 w-[10%]">
              <div>الوحدة</div><div className="text-[10px]">Unit</div>
            </th>
            <th className="border border-slate-900 p-1 w-[10%]">
              <div>الكمية</div><div className="text-[10px]">Quantity</div>
            </th>
            <th className="border border-slate-900 p-1 w-[12%]">
              <div>الكمية المتوفرة</div><div className="text-[10px]">Available quantity</div>
            </th>
            <th className="border border-slate-900 p-1 w-[12%]">
              <div>الكمية المعتمدة</div><div className="text-[10px]">Approved quantity</div>
            </th>
            <th className="border border-slate-900 p-1 w-[20%]">
              <div>ملاحظات</div><div className="text-[10px]">Notes</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.n} style={{ height: "22px" }}>
              <td className="border border-slate-900 text-center">{r.n}</td>
              <td className="border border-slate-900 px-1">{r.desc}</td>
              <td className="border border-slate-900 px-1 text-center">{r.unit}</td>
              <td className="border border-slate-900 px-1 text-center">{r.qty}</td>
              <td className="border border-slate-900 px-1 text-center">{r.available}</td>
              <td className="border border-slate-900 px-1 text-center font-bold">{r.approved}</td>
              <td className="border border-slate-900 px-1">{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signatures */}
      {!hideSignatures && (
        <div className="mt-8 space-y-3 text-sm" dir="rtl">
          <div className="flex justify-between">
            <span>التوقيع .....................................................</span>
            <span>مقدم الطلب <span dir="ltr">applicant</span> : {transaction.staff?.full_name || "............................"}</span>
          </div>
          <div className="flex justify-between">
            <span>التوقيع .....................................................</span>
            <span>المسؤول المباشر <span dir="ltr">Direct Manager</span> ............................................................</span>
          </div>
          <div className="flex justify-between">
            <span>التوقيع .....................................................</span>
            <span>مدير المركز <span dir="ltr">Center Director</span> ............................................................</span>
          </div>
          <div className="flex justify-between">
            <span>التوقيع .....................................................</span>
            <span>المحاسب <span dir="ltr">accountant</span> ............................................................</span>
          </div>
          <div className="pt-2">
            <p>الاعتماد النهائي <span dir="ltr">Final approval</span> :</p>
            <div className="border-b border-dotted border-slate-700 h-5" />
            <div className="border-b border-dotted border-slate-700 h-5 mt-1" />
            <div className="border-b border-dotted border-slate-700 h-5 mt-1" />
          </div>
        </div>
      )}
    </div>
  );
};
