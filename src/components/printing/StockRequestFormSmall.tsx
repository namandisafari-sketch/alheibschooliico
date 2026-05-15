import { format } from "date-fns";
import iicoLogo from "@/assets/iico-logo.jpg";

interface Props {
  transaction: any;
  variant?: "default" | "kitchen";
  hideSignatures?: boolean;
}

const HalfForm = ({ transaction, variant }: { transaction: any; variant: "default" | "kitchen" }) => {
  const dateStr = format(new Date(transaction.transaction_date || new Date()), "dd / MM / yyyy");
  const lastColAr = variant === "kitchen" ? "عدد الأيام" : "ملاحظات";
  const lastColEn = variant === "kitchen" ? "Number of days" : "Notes";

  const rows = Array.from({ length: 10 }, (_, i) => {
    if (i === 0) {
      return {
        n: 1,
        desc: transaction.item?.name || "",
        unit: transaction.item?.unit || "",
        qty: transaction.quantity ?? "",
        available: transaction.available_quantity ?? "",
        approved: transaction.approved_quantity ?? transaction.quantity ?? "",
        last: variant === "kitchen" ? (transaction.days ?? "") : (transaction.notes || ""),
      };
    }
    return { n: i + 1, desc: "", unit: "", qty: "", available: "", approved: "", last: "" };
  });

  return (
    <div className="mb-4">
      <div className="flex items-start justify-between mb-2">
        <img src={iicoLogo} alt="IICO" className="h-14 w-auto object-contain" />
        <h2 className="text-base font-bold text-emerald-800 self-center" dir="rtl">مركز اللهيب للرعاية الاجتماعية</h2>
        <div className="border border-slate-900 px-2 py-1 text-[11px] font-bold">
          <span dir="rtl">نموزج أمر صرف مخزني </span>
          <span>Stock Request Form</span>
        </div>
      </div>
      <div className="flex justify-end mb-1">
        <p className="text-xs font-bold"><span dir="rtl">{dateStr}</span> <span>: Date</span></p>
      </div>
      <p className="text-xs font-bold mb-2 text-right" dir="rtl">
        الاخ مدير المركز : يرجى التكرم بالتوجيه بصرف الاصناف التالية :-
      </p>
      <table className="w-full border-collapse border border-slate-900 text-[10px]" dir="rtl">
        <thead>
          <tr>
            <th className="border border-slate-900 p-1 w-[7%]"><div>رقم</div><div className="text-[9px]">Number</div></th>
            <th className="border border-slate-900 p-1 w-[27%]"><div>بينات وتفاصيل الأصناف المنصرفة</div><div className="text-[9px]">Items description &amp; Details</div></th>
            <th className="border border-slate-900 p-1 w-[10%]"><div>الوحدة</div><div className="text-[9px]">Unit</div></th>
            <th className="border border-slate-900 p-1 w-[10%]"><div>الكمية</div><div className="text-[9px]">Quantity</div></th>
            <th className="border border-slate-900 p-1 w-[12%]"><div>الكمية المتوفرة</div><div className="text-[9px]">Available quantity</div></th>
            <th className="border border-slate-900 p-1 w-[12%]"><div>الكمية المعتمدة</div><div className="text-[9px]">Approved quantity</div></th>
            <th className="border border-slate-900 p-1 w-[22%]"><div>{lastColAr}</div><div className="text-[9px]">{lastColEn}</div></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.n} style={{ height: "20px" }}>
              <td className="border border-slate-900 text-center">{r.n}</td>
              <td className="border border-slate-900 px-1">{r.desc}</td>
              <td className="border border-slate-900 px-1 text-center">{r.unit}</td>
              <td className="border border-slate-900 px-1 text-center">{r.qty}</td>
              <td className="border border-slate-900 px-1 text-center">{r.available}</td>
              <td className="border border-slate-900 px-1 text-center font-bold">{r.approved}</td>
              <td className="border border-slate-900 px-1">{r.last}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]" dir="rtl">
        <div>مقدم الطلب <span dir="ltr">applicant</span> ............................................</div>
        <div>المسؤول المباشر <span dir="ltr">Direct Manager</span> ............................................</div>
        <div>مدير المركز <span dir="ltr">Center Director</span> ............................................</div>
        <div>المحاسب <span dir="ltr">accountant</span> ............................................</div>
      </div>
    </div>
  );
};

export const StockRequestFormSmall = ({ transaction, variant = "default" }: Props) => {
  if (!transaction) return null;
  return (
    <div className="print-form shadow-sm">
      <HalfForm transaction={transaction} variant={variant} />
      <div className="border-t border-dashed border-slate-400 my-3" />
      <HalfForm transaction={transaction} variant={variant} />
    </div>
  );
};
