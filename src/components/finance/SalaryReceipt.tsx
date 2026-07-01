import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatUGX } from "@/hooks/useFees";
import { format } from "date-fns";

interface SalaryReceiptProps {
  receipt: {
    id: string;
    receipt_number?: string;
    amount: number;
    payment_method: string | null;
    payment_date: string;
    created_at: string;
    notes?: string | null;
    reference_number?: string | null;
    staff?: {
      full_name: string;
    };
  };
  schoolName?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolLogo?: string;
}

export const SalaryReceipt = forwardRef<HTMLDivElement, SalaryReceiptProps>(
  (
    {
      receipt,
      schoolName = "Alhebi School",
      schoolAddress = "Kasangati",
      schoolPhone = "+256 700 000000",
      schoolEmail = "info@school.com",
      schoolLogo,
    },
    ref
  ) => {
    const date = new Date(receipt.created_at || receipt.payment_date);

    return (
      <div
        ref={ref}
        className="bg-white text-black mx-auto p-6 font-sans"
        style={{ width: "380px" }}
      >
        <div className="flex flex-col items-center text-center pb-4 border-b border-dashed border-gray-400">
          {schoolLogo ? (
            <img src={schoolLogo} alt="logo" className="h-14 w-14 object-contain mb-2" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-gray-200 mb-2" />
          )}
          <h1 className="text-xl font-bold tracking-wide">{schoolName.toUpperCase()}</h1>
          <p className="text-xs text-gray-600">{schoolAddress}</p>
          <p className="text-xs text-gray-600">Tel: {schoolPhone}</p>
          <p className="text-xs text-gray-600">Email: {schoolEmail}</p>
        </div>

        <div className="my-3 bg-gray-900 text-white text-center py-2 text-xs font-semibold tracking-wider">
          OFFICIAL SALARY PAYMENT RECEIPT
        </div>

        <div className="border border-gray-300 rounded p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Receipt No:</span>
            <span className="font-mono font-semibold">{receipt.receipt_number || receipt.id.slice(0, 8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date & Time:</span>
            <span className="font-mono">{format(date, "dd/MM/yyyy HH:mm")}</span>
          </div>
        </div>

        <div className="bg-gray-100 px-2 py-1 text-xs font-bold mt-2">PAYEE</div>
        <div className="border border-t-0 border-gray-300 p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Name:</span>
            <span className="font-semibold">{receipt.staff?.full_name || "Staff Member"}</span>
          </div>
          {receipt.reference_number && (
            <div className="flex justify-between">
              <span className="text-gray-500">Ref No:</span>
              <span className="font-mono">{receipt.reference_number}</span>
            </div>
          )}
        </div>

        <div className="bg-gray-100 px-2 py-1 text-xs font-bold mt-2">PAYMENT DETAILS</div>
        <div className="border border-t-0 border-gray-300 p-3 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Method:</span>
            <span className="capitalize">{receipt.payment_method || "cash"}</span>
          </div>
          <div className="bg-green-500 text-white flex justify-between items-center px-3 py-2 rounded">
            <span className="font-bold text-xs">AMOUNT PAID</span>
            <span className="font-bold font-mono">{formatUGX(receipt.amount)}</span>
          </div>
          {receipt.notes && (
            <div>
              <span className="text-gray-500 text-xs">Notes:</span>
              <p className="text-xs mt-1 text-gray-900">{receipt.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-3 border border-amber-400 bg-amber-50 text-amber-700 text-center py-1 text-xs rounded">
          ✦ Payment authorized by the school accountant ✦
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-center">
            <QRCodeSVG value={receipt.receipt_number || receipt.id.slice(0, 8)} size={64} />
            <p className="text-[10px] text-gray-500 mt-1">Scan to verify</p>
          </div>
          <div className="h-20 w-20 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-[9px] text-gray-400 text-center px-1">
            OFFICIAL<br />STAMP
          </div>
        </div>

        <div className="mt-6 text-center text-xs">
          <div className="border-t border-gray-400 pt-1 mx-12">
            <p className="font-semibold">Authorized Signature</p>
            <p className="text-gray-500">Issued by Accountant</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-3">Thank you for your service!</p>
        <div className="border-t border-dashed border-gray-400 mt-3 pt-2 text-center text-[10px] text-gray-500 font-mono">
          ORIGINAL COPY • {format(date, "dd MMM yyyy")}
        </div>
      </div>
    );
  }
);

SalaryReceipt.displayName = "SalaryReceipt";
