// @ts-nocheck
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Printer, X, QrCode } from "lucide-react";
import { format } from "date-fns";

interface ThermalGatePassProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitorName: string;
  hostName?: string | null;
  purpose: string;
  gatePin: string;
  checkedInAt: string;
  appointmentId?: string;
}

export default function ThermalGatePass({
  open,
  onOpenChange,
  visitorName,
  hostName,
  purpose,
  gatePin,
  checkedInAt,
  appointmentId,
}: ThermalGatePassProps) {
  const handlePrint = () => {
    window.print();
  };

  const now = new Date();
  const dateStr = format(now, "dd/MM/yyyy");
  const timeStr = format(now, "h:mm:ss a");

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #thermal-gate-pass, #thermal-gate-pass * { visibility: visible; }
          #thermal-gate-pass { position: fixed; left: 0; top: 0; width: 80mm; padding: 4mm; margin: 0; background: white; }
          body { margin: 0; padding: 0; }
          @page { margin: 0; size: 80mm auto; }
          .no-print { display: none !important; }
        }
      `}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[360px] p-0 gap-0 overflow-hidden">
          <div id="thermal-gate-pass" className="bg-white">
            {/* Receipt Header */}
            <div className="text-center px-4 pt-4 pb-2 border-b-2 border-dashed border-slate-300">
              <h1 className="text-sm font-black uppercase tracking-widest text-slate-900">Alheb Islamic</h1>
              <h2 className="text-base font-black uppercase tracking-widest text-slate-900">Primary School</h2>
              <p className="text-[9px] text-slate-500 mt-0.5">Gate Pass &mdash; Visitor Entry</p>
            </div>

            {/* Divider */}
            <div className="text-center text-[9px] text-slate-400 font-bold tracking-widest py-1">
              &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot;
            </div>

            {/* Body */}
            <div className="px-4 py-1 space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400 font-bold uppercase">Date</span>
                <span className="font-bold text-slate-800">{dateStr}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400 font-bold uppercase">Time</span>
                <span className="font-bold text-slate-800">{timeStr}</span>
              </div>

              <div className="border-t border-dashed border-slate-200 my-1.5" />

              <div className="text-[10px]">
                <span className="text-slate-400 font-bold uppercase block">Visitor</span>
                <span className="font-bold text-base text-slate-900">{visitorName}</span>
              </div>

              <div className="text-[10px]">
                <span className="text-slate-400 font-bold uppercase block">Visiting</span>
                <span className="font-bold text-sm text-slate-800">{hostName || "—"}</span>
              </div>

              <div className="text-[10px]">
                <span className="text-slate-400 font-bold uppercase block">Purpose</span>
                <span className="text-sm text-slate-700">{purpose}</span>
              </div>

              <div className="border-t border-dashed border-slate-200 my-1.5" />

              {/* PIN Code */}
              <div className="text-center py-1">
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Gate PIN Code</p>
                <p className="text-2xl font-black tracking-[0.5em] text-slate-900">{gatePin}</p>
              </div>

              {/* Barcode Placeholder */}
              <div className="flex justify-center py-1">
                <div className="bg-slate-100 rounded p-2 flex items-center gap-2">
                  <QrCode className="h-6 w-6 text-slate-400" />
                  <span className="text-[7px] text-slate-400 font-mono uppercase tracking-wider">{appointmentId || "————"}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t-2 border-dashed border-slate-300 px-4 pt-2 pb-4 mt-1">
              <p className="text-[7px] text-slate-400 font-mono">
                {appointmentId ? `ID: ${appointmentId}` : ""}
              </p>
              <p className="text-[7px] text-slate-400 font-mono">
                Present this pass at the gate upon exit
              </p>
              <p className="text-[8px] text-slate-300 font-mono mt-1">
                Powered by Alheb School System
              </p>
            </div>
          </div>

          {/* Action Buttons - hidden when printing */}
          <div className="no-print p-4 pt-2 flex gap-2 bg-slate-50 border-t">
            <Button onClick={handlePrint} className="flex-1 gap-2 h-11 rounded-xl bg-slate-900 hover:bg-slate-800">
              <Printer className="h-4 w-4" /> Print Pass
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2 h-11 rounded-xl">
              <X className="h-4 w-4" /> Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
