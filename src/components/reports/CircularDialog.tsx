import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2 } from "lucide-react";
import { TermlyCircular } from "./TermlyCircular";
import { Learner } from "@/hooks/useLearners";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

interface CircularDialogProps {
  learner: Learner;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CircularDialog({ learner, open, onOpenChange }: CircularDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;

    const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((n) => n.outerHTML)
      .join("\n");

    win.document.open();
    win.document.write(`
      <html>
        <head>
          <title>Circular - ${learner.full_name}</title>
          ${headStyles}
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; background: #fff; }
            .circular-card { width: 210mm; height: 297mm; margin: 0 auto; box-shadow: none !important; border: none !important; }
          </style>
        </head>
        <body>${content}</body>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.focus();
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </html>
    `);
    win.document.close();
  };

  const handleDownload = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const card = printRef.current.querySelector(".circular-card") as HTMLElement;
      if (!card) throw new Error("Circular card not found");

      const dataUrl = await toPng(card, { 
        quality: 0.95, 
        pixelRatio: 2, 
        backgroundColor: "#ffffff" 
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = dataUrl;
      });

      const w = 210;
      const h = (img.height * w) / img.width;
      pdf.addImage(dataUrl, "PNG", 0, 0, w, h);
      pdf.save(`Circular_${learner.full_name.replace(/\s+/g, "_")}.pdf`);
      toast({ title: "Success", description: "Circular downloaded as PDF." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Circular Preview — {learner.full_name}</span>
            <div className="flex gap-2 mr-6">
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
              <Button size="sm" onClick={handleDownload} disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-muted/20 p-4 rounded-lg flex justify-center">
          <div ref={printRef} className="bg-white shadow-xl transform scale-75 origin-top mb-[-150px]">
            <TermlyCircular learner={learner} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
