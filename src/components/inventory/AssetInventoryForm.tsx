import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";

interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  quantity: number;
  classification?: string;
  supplier_name?: string;
  brand?: string;
  model?: string;
  storage_location?: string;
  expiry_date?: string;
  min_threshold: number;
}

interface AssetFormProps {
  items: InventoryItem[];
  assets: any[];
  department: string;
  custodianName: string;
  jobTitle: string;
  inventoryDate: string;
}

export function AssetInventoryForm({
  items,
  assets,
  department,
  custodianName,
  jobTitle,
  inventoryDate,
}: AssetFormProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page { size: A4 landscape; margin: 12mm; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `,
  });

  const formItems = [
    ...items.map((i) => ({
      no: 0,
      description: i.name,
      serial: i.id?.slice(0, 8) || "-",
      qty: i.quantity || 0,
      classification: i.classification || "mobile",
      condition: i.quantity && i.quantity <= i.min_threshold ? "Used" : "Good",
      unit: i.unit,
      remarks: i.storage_location || "",
    })),
    ...assets.map((a) => ({
      no: 0,
      description: a.name,
      serial: a.serial_number || a.asset_tag_id || "-",
      qty: 1,
      classification: a.classification || "fixed",
      condition: a.condition || "Good",
      unit: "unit",
      remarks: a.location || "",
    })),
  ];

  formItems.forEach((item, idx) => { item.no = idx + 1; });

  const today = inventoryDate || format(new Date(), "yyyy / MM / dd");

  return (
    <div>
      <div className="flex justify-end mb-4 print:hidden">
        <Button onClick={() => handlePrint()} className="gap-2">
          <Printer className="h-4 w-4" /> Print Inventory Form
        </Button>
      </div>

      <div ref={printRef} className="bg-white p-6 rounded-xl border shadow-sm" style={{ fontFamily: "Arial, sans-serif" }}>
        {/* Header — Arabic right, English left exactly as XLSX */}
        <div className="flex justify-between items-start mb-3 border-b pb-3">
          <div className="text-right text-xs leading-relaxed" dir="rtl" style={{ fontFamily: "'Traditional Arabic','Times New Roman',serif" }}>
            الهيئة الخيرية الإسلامية العالمية<br/>
            مركز اللهيب للرعاية الاجتماعية<br/>
            مكتب أوغندا (كيرا - كيتيكيفومبا)
          </div>
          <div className="text-left text-xs leading-relaxed">
            International Islamic Charitable Organization<br/>
            Alheib Social Welfare Centre<br/>
            Uganda Office (Kira - Kitikifumba)
          </div>
        </div>

        {/* Form title */}
        <div className="text-center mb-5">
          <h3 className="text-base font-bold uppercase tracking-wide">
            الاستمارة العامة لجرد الأصول الموحدة  |  GENERAL ASSET INVENTORY FORM
          </h3>
        </div>

        {/* Info Fields — 2x2 grid matching XLSX layout */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-5 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold whitespace-nowrap text-xs">القسم / المرفق (Department/Facility):</span>
            <span className="border-b border-gray-400 flex-1 px-1 text-xs">{department || "........................................................"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold whitespace-nowrap text-xs">تاريخ الجرد (Inventory Date):</span>
            <span className="border-b border-gray-400 flex-1 px-1 text-xs">{today}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold whitespace-nowrap text-xs">المسؤول الحالي (Custodian Name):</span>
            <span className="border-b border-gray-400 flex-1 px-1 text-xs">{custodianName || "........................................................"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold whitespace-nowrap text-xs">المسمى الوظيفي (Job Title):</span>
            <span className="border-b border-gray-400 flex-1 px-1 text-xs">{jobTitle || "........................................"}</span>
          </div>
        </div>

        {/* Acknowledgment — full Arabic + English exactly as XLSX */}
        <div className="text-[10px] mb-4 p-2 bg-gray-50 rounded border leading-relaxed text-justify">
          <div dir="rtl" className="mb-1 font-bold">إقرار واستلام عهدة الأصول (Acknowledgment of Asset Custody):</div>
          <div dir="rtl" className="mb-2" style={{ fontFamily: "'Traditional Arabic','Times New Roman',serif" }}>
            أقر أنا الموقع أدناه بصفتي المسؤول عن المرفق/القسم المذكور، بأنني قد قمت بحصر ومراجعة كافة الأصول والمواد المسجلة في هذه الاستمارة يدوياً من الواقع الفعلي، وتعتبر كلها عهدة شخصية في ذمتي وتحت مسؤوليتي المباشرة.
          </div>
          <div>
            I, the undersigned, being responsible for the above department, acknowledge that I have verified all the assets listed in this form from actual reality. They are now under my personal custody and direct responsibility.
          </div>
        </div>

        {/* Table — matching XLSX column layout exactly */}
        <table className="w-full border-collapse border border-gray-400 text-[10px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-1 text-center font-bold w-7">م<br/>No.</th>
              <th className="border border-gray-400 p-1 text-left font-bold">
                اسم الصنف / وصف المادة (من الواقع الفعلي)<br/>
                <span className="font-normal">Asset Item Description</span>
              </th>
              <th className="border border-gray-400 p-1 text-left font-bold w-[15%]">
                الرقم التسلسلي / الكود (إن وجد)<br/>
                <span className="font-normal">Serial No. / Code</span>
              </th>
              <th className="border border-gray-400 p-1 text-center font-bold w-10">
                الكمية<br/>Qty
              </th>
              <th className="border border-gray-400 p-1 text-center font-bold w-[14%]">
                تصنيف الأصل<br/>
                <span className="font-normal">Classification</span>
              </th>
              <th className="border border-gray-400 p-1 text-center font-bold w-[14%]">
                حالة الأصل الفعلية<br/>
                <span className="font-normal">Actual Condition</span>
              </th>
              <th className="border border-gray-400 p-1 text-left font-bold w-[14%]">
                ملاحظات<br/>
                <span className="font-normal">Remarks</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {formItems.map((item) => (
              <tr key={item.no} className="even:bg-gray-50" style={{ height: "20px" }}>
                <td className="border border-gray-400 p-0.5 text-center font-mono">{item.no}</td>
                <td className="border border-gray-400 p-0.5">{item.description}</td>
                <td className="border border-gray-400 p-0.5 font-mono">{item.serial}</td>
                <td className="border border-gray-400 p-0.5 text-center font-bold">{item.qty}</td>
                <td className="border border-gray-400 p-0.5 text-center text-[9px] whitespace-nowrap">
                  [{item.classification === "fixed" ? "\u2713" : " " }] ثابت  [{item.classification === "mobile" ? "\u2713" : " " }] متحرك
                </td>
                <td className="border border-gray-400 p-0.5 text-center">{item.condition}</td>
                <td className="border border-gray-400 p-0.5 text-[9px]">{item.remarks}</td>
              </tr>
            ))}
            {formItems.length === 0 && (
              <tr>
                <td colSpan={7} className="border border-gray-400 p-3 text-center text-gray-400">
                  No items recorded. Add inventory items and assets to generate the form.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer — exact XLSX signature layout */}
        <div className="grid grid-cols-2 gap-8 mt-6 text-xs">
          <div className="border-t border-gray-400 pt-2">
            <p className="font-bold text-sm">الموظف المسؤول عن العهدة والمرفق (المستلم) / Custodian</p>
            <p className="mt-5">الاسم الكامل / Full Name: {custodianName || "........................................................"}</p>
            <p className="mt-3">التوقيع والبصمة / Signature: ........................................................</p>
          </div>
          <div className="border-t border-gray-400 pt-2">
            <p className="font-bold text-sm">لجنة التدقيق والجرد الإداري / Inventory Committee</p>
            <p className="mt-5">اسم المفتش / Auditor Name: ........................................................</p>
            <p className="mt-3">توقيع رئيس اللجنة / Head Sign: ........................................................</p>
          </div>
        </div>

        <div className="mt-5 text-[7px] text-center text-gray-400 uppercase tracking-wider border-t pt-2">
          Alheib Social Welfare Centre | IICO Comprehensive Inventory System — Generated on {format(new Date(), "dd MMM yyyy HH:mm")}
        </div>
      </div>
    </div>
  );
}
