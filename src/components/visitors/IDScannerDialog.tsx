import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Scan, ShieldCheck, User, CheckCircle2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarcodeScannerInput, type BarcodeScanData } from "./BarcodeScannerInput";

interface IDScannerDialogProps {
  onScanComplete: (result: {
    identity: { name: string; nin: string };
  }) => void;
}

export const IDScannerDialog = ({ onScanComplete }: IDScannerDialogProps) => {
  const [scanned, setScanned] = useState<BarcodeScanData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleScan = (data: BarcodeScanData) => {
    setScanned(data);
  };

  const handleConfirm = () => {
    if (!scanned) return;
    onScanComplete({
      identity: {
        name: scanned.name || scanned.nin || "Unknown",
        nin: scanned.nin || scanned.raw,
      },
    });
    setScanned(null);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 bg-emerald-50/30">
          <Scan className="h-4 w-4 text-emerald-600" />
          Scan Uganda National ID
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <DialogTitle>Gate Security — Barcode Scanner</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {!scanned && (
            <div className="space-y-3">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl bg-slate-50 border-slate-200">
                <div className="h-14 w-14 bg-white rounded-2xl shadow-md flex items-center justify-center mb-4">
                  <Scan className="h-7 w-7 text-primary animate-pulse" />
                </div>
                <p className="text-lg font-bold">Point scanner at ID barcode</p>
                <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
                  Use the handheld barcode scanner on the PDF417 barcode on the back of the Uganda National ID
                </p>
              </div>
              <BarcodeScannerInput
                onScan={handleScan}
                placeholder="Scanner output appears here..."
                autoFocus
              />
            </div>
          )}

          {scanned && (
            <div className="space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="p-5 rounded-2xl border-2 bg-emerald-50 border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scanned Identity</span>
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight leading-none mb-1">
                  {scanned.name || "—"}
                </h4>
                <p className="text-sm font-mono font-bold text-slate-600">
                  {scanned.nin || scanned.raw}
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    {scanned.type === "national_id" ? "National ID Verified" : "Barcode Scanned"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setScanned(null)}>
                  Rescan
                </Button>
                <Button className="flex-1 rounded-xl bg-slate-900" onClick={handleConfirm}>
                  Confirm Identity
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
