import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { scanUgandaIDBack, ScanResult } from "@/lib/idScanner";
import { Scan, ShieldCheck, MapPin, User, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface IDScannerDialogProps {
  onScanComplete: (result: ScanResult) => void;
}

export const IDScannerDialog = ({ onScanComplete }: IDScannerDialogProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeProgress, setBarcodeProgress] = useState(0);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setBarcodeProgress(0);
    setOcrProgress(0);
    setResult(null);

    const imageUrl = URL.createObjectURL(file);

    try {
      const scanResult = await scanUgandaIDBack(imageUrl, (stream, progress) => {
        if (stream === 'barcode') setBarcodeProgress(progress);
        if (stream === 'ocr') setOcrProgress(progress);
      });

      setResult(scanResult);
      if (scanResult.verification === 'SUCCESS') {
        toast({ title: "Scan Complete", description: "Identity and Address verified." });
      } else {
        toast({ title: "Partial Scan", description: "Barcode was unreadable, but address extracted.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Scan Failed", description: "Could not process ID image.", variant: "destructive" });
    } finally {
      setIsScanning(false);
      URL.revokeObjectURL(imageUrl);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 bg-emerald-50/30">
          <Scan className="h-4 w-4 text-emerald-600" />
          Scan Uganda National ID
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <DialogTitle>Gate Security ID Scanner</DialogTitle>
          </div>
        </DialogHeader>

        {!result && !isScanning && (
          <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-slate-50 border-slate-200 transition-colors hover:bg-slate-100">
            <input type="file" accept="image/*" className="hidden" id="id-upload" onChange={handleFileUpload} />
            <label htmlFor="id-upload" className="cursor-pointer flex flex-col items-center">
              <div className="h-16 w-16 bg-white rounded-2xl shadow-md flex items-center justify-center mb-4">
                <Scan className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <p className="text-lg font-bold">Upload ID Back Side</p>
              <p className="text-sm text-muted-foreground mt-1 text-center max-w-[200px]">Ensure the barcode and address text are clearly visible</p>
            </label>
          </div>
        )}

        {isScanning && (
          <div className="space-y-8 py-8 px-4">
            <div className="flex flex-col items-center justify-center mb-6">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-black uppercase tracking-tighter">Multi-Stream Extraction...</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                  <span>Stream A: Barcode (PDF417)</span>
                  <span>{barcodeProgress}%</span>
                </div>
                <Progress value={barcodeProgress} className="h-2 bg-slate-100" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                  <span>Stream B: Address OCR Engine</span>
                  <span>{Math.round(ocrProgress)}%</span>
                </div>
                <Progress value={ocrProgress} className="h-2 bg-slate-100" />
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className={cn(
                "p-4 rounded-2xl border-2 transition-all",
                result.verification === 'SUCCESS' ? "bg-emerald-50 border-emerald-200" : "bg-orange-50 border-orange-200"
              )}>
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity Details</span>
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight leading-none mb-1">{result.identity.name}</h4>
                <p className="text-sm font-mono font-bold text-slate-600">{result.identity.nin}</p>
                <div className="mt-3 flex items-center gap-1">
                  {result.verification === 'SUCCESS' ? (
                    <><CheckCircle2 className="h-3 w-3 text-emerald-600" /><span className="text-[10px] font-bold text-emerald-700 uppercase">Barcode Verified</span></>
                  ) : (
                    <><AlertCircle className="h-3 w-3 text-orange-600" /><span className="text-[10px] font-bold text-orange-700 uppercase">Barcode Unreadable</span></>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl border-2 border-slate-200 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Address Extraction</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-tighter">Village: <span className="text-slate-900 font-bold">{result.address.village || "---"}</span></p>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-tighter">Parish: <span className="text-slate-900 font-bold">{result.address.parish || "---"}</span></p>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-tighter">Sub-County: <span className="text-slate-900 font-bold">{result.address.sub_county || "---"}</span></p>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-tighter">District: <span className="text-slate-900 font-bold">{result.address.district || "---"}</span></p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setResult(null)}>Rescan ID</Button>
              <Button className="flex-1 rounded-xl bg-slate-900" onClick={() => {
                onScanComplete(result);
                setIsOpen(false);
              }}>Confirm Identity</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
