
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, ShieldCheck } from "lucide-react";
import { CustodyForm } from "@/components/printing/CustodyForm";

interface CustodyPrintDialogProps {
  advance: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustodyPrintDialog({ advance, open, onOpenChange }: CustodyPrintDialogProps) {
  if (!advance) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl bg-slate-50">
        <DialogHeader className="p-6 bg-white border-b sticky top-0 z-10 print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            Official Temporary Custody Request Form
          </DialogTitle>
        </DialogHeader>

        <div className="p-8 print:p-0">
          <CustodyForm advance={advance} />
        </div>

        <div className="flex gap-2 p-6 bg-white border-t sticky bottom-0 z-10 print:hidden">
          <Button className="flex-1 bg-slate-900 shadow-lg shadow-slate-200" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print Official Form
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Dismiss</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
