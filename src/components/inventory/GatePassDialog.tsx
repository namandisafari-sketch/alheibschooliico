
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, ShieldCheck, Download, PackageCheck, User, Building, Landmark, QrCode } from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

interface GatePassDialogProps {
  transaction: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GatePassDialog({ transaction, open, onOpenChange }: GatePassDialogProps) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const qrValue = JSON.stringify({
    id: transaction.id,
    ref: transaction.tracking_number,
    item: transaction.item?.name,
    qty: transaction.quantity,
    status: transaction.status,
    director_approval: transaction.director_approval_date ? "Verified" : "Pending"
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md print:shadow-none print:border-none p-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 pb-0 print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Official Gate Pass
          </DialogTitle>
          <DialogDescription>
            Multi-stage clearance pass for school inventory movement.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6 relative">
          {/* Header Section */}
          <div className="text-center space-y-2 border-b pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">ALHEIB SCHOOL INVENTORY SYSTEM</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">INVENTORY GATE PASS</h2>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">REF: {transaction.tracking_number}</p>
          </div>

          {/* QR Code Section */}
          <div className="flex justify-center py-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="p-3 bg-white rounded-xl shadow-sm border">
               <QRCodeSVG value={qrValue} size={120} level="H" />
            </div>
          </div>

          {/* Item Details */}
          <div className="grid grid-cols-2 gap-6 bg-white p-4 rounded-xl border">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Item Details</p>
              <p className="font-black text-slate-800 text-base">{transaction.item?.name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-medium">{transaction.quantity} {transaction.item?.unit || 'Units'}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recipient</p>
              <p className="font-bold text-slate-800 text-sm truncate">{transaction.learner?.full_name || transaction.staff?.full_name || 'General'}</p>
              <p className="text-[10px] text-slate-500 uppercase font-medium">Clearance ID: {transaction.id.slice(0, 8)}</p>
            </div>
          </div>

          {/* Corporate Protocol Flow (Approval Chain) */}
          <div className="space-y-3">
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Digital Clearance Chain</p>
             
             <div className="space-y-2">
                {/* Stage 1: Request */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                   <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-tight text-slate-600">Requester</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-slate-500 italic">{transaction.staff?.full_name || 'System'}</span>
                      <Check className="h-3 w-3 text-emerald-500" />
                   </div>
                </div>

                {/* Stage 2: Manager */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                   <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-tight text-slate-600">Person In-Charge</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-slate-500 italic">{transaction.manager_approval_date ? 'Verified' : 'Bypassed/Pending'}</span>
                      {transaction.manager_approval_date ? <Check className="h-3 w-3 text-emerald-500" /> : <Clock className="h-3 w-3 text-amber-500" />}
                   </div>
                </div>

                {/* Stage 3: Director */}
                <div className={cn(
                  "flex items-center justify-between p-2 rounded-lg border",
                  transaction.director_approval_date ? "bg-slate-50 border-slate-100" : "bg-slate-50 border-slate-100"
                )}>
                   <div className="flex items-center gap-2">
                      <Landmark className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-tight text-slate-600">Director Approval</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-slate-500 italic">
                        {transaction.director_approval_date ? 'Verified' : 'Pending'}
                      </span>
                      {transaction.director_approval_date ? <Check className="h-3 w-3 text-emerald-500" /> : <div className="h-1 w-1 bg-slate-200 rounded-full animate-pulse" />}
                   </div>
                </div>

                {/* Stage 4: Accountant */}
                <div className={cn(
                  "flex items-center justify-between p-2 rounded-lg border",
                  transaction.approval_date ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"
                )}>
                   <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-tight text-slate-600">Accountant Seal</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-tight text-emerald-700">
                        {transaction.approval_date ? 'CLEARED' : 'PENDING'}
                      </span>
                      {transaction.approval_date ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <div className="h-1 w-1 bg-slate-200 rounded-full animate-pulse" />}
                   </div>
                </div>

                {/* Stage 5: Gate */}
                <div className={cn(
                  "flex items-center justify-between p-2 rounded-lg border border-dashed",
                  transaction.gate_verified_at ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200"
                )}>
                   <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-tight text-slate-600">Gate Verification</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-slate-400 italic">
                        {transaction.gate_verified_at ? format(new Date(transaction.gate_verified_at), "HH:mm, dd MMM") : 'Scan Required at Exit'}
                      </span>
                   </div>
                </div>
             </div>
          </div>

          <div className="pt-4 text-center border-t border-dashed">
            <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest leading-tight">
              SCAN THIS CODE AT THE SECURITY POINT FOR VERIFICATION. 
              UNAUTHORIZED REMOVAL OF PROPERTY IS STRICTLY PROHIBITED.
            </p>
          </div>
        </div>

        <div className="flex gap-2 p-6 bg-slate-50 border-t print:hidden">
          <Button className="flex-1 shadow-lg shadow-primary/20" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print & Dispatch
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Dismiss</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Minimal Check/Clock/etc components if not imported
function Check({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;
}

function Clock({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
