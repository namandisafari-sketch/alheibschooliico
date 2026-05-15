import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";
import { StockRequestForm } from "@/components/printing/StockRequestForm";
import { StockRequestFormSmall } from "@/components/printing/StockRequestFormSmall";

interface StockRequestPrintDialogProps {
  transaction: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Variant = "full" | "small" | "kitchen";

export function StockRequestPrintDialog({ transaction, open, onOpenChange }: StockRequestPrintDialogProps) {
  const [variant, setVariant] = useState<Variant>("full");
  if (!transaction) return null;

  const handlePrint = () => window.print();

  const variants: { id: Variant; label: string }[] = [
    { id: "full", label: "Full (20 rows)" },
    { id: "small", label: "Small (10 rows)" },
    { id: "kitchen", label: "Small – Kitchen" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl bg-slate-50">
        <DialogHeader className="p-6 bg-white border-b sticky top-0 z-10 print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Official Stock Request Form
          </DialogTitle>
          <div className="flex gap-2 pt-2">
            {variants.map((v) => (
              <Button
                key={v.id}
                size="sm"
                variant={variant === v.id ? "default" : "outline"}
                onClick={() => setVariant(v.id)}
              >
                {v.label}
              </Button>
            ))}
          </div>
        </DialogHeader>

        <div className="p-8 print:p-0">
          {variant === "full" && <StockRequestForm transaction={transaction} />}
          {variant === "small" && <StockRequestFormSmall transaction={transaction} variant="default" />}
          {variant === "kitchen" && <StockRequestFormSmall transaction={transaction} variant="kitchen" />}
        </div>

        <div className="flex gap-2 p-6 bg-white border-t sticky bottom-0 z-10 print:hidden">
          <Button className="flex-1 bg-slate-900 shadow-lg shadow-slate-200" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print Institutional Form
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Dismiss</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
