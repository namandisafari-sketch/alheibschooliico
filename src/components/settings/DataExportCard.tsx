// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Download, Loader2, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

// Tables to export — one sheet per table
const EXPORT_TABLES = [
  "profiles", "user_roles", "schools", "learners", "guardians", "classes",
  "subjects", "teachers", "teacher_assignments", "staff", "employees",
  "attendance", "term_results", "homework", "lesson_plans", "timetable",
  "fee_payments", "fee_structures", "salary_records", "salary_payments",
  "expense_requests", "budget_requests", "purchase_orders", "inventory_items",
  "inventory_stock", "inventory_transactions", "visitors", "appointments",
  "calendar_events", "discipline_cases", "discipline_flags", "leave_requests",
  "health_records", "hostel_assignments", "notifications", "audit_log",
];

const sanitizeSheetName = (name: string) =>
  name.replace(/[\\/*?:[\]]/g, "_").slice(0, 31);

export const DataExportCard = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const handleExport = async () => {
    setLoading(true);
    const wb = XLSX.utils.book_new();
    const summary: Array<{ Table: string; Rows: number; Status: string }> = [];

    for (const table of EXPORT_TABLES) {
      setProgress(`Exporting ${table}…`);
      try {
        // Fetch in pages of 1000 to bypass the default limit
        let all: any[] = [];
        let from = 0;
        const pageSize = 1000;
        while (true) {
          const { data, error } = await supabase
            .from(table as any)
            .select("*")
            .range(from, from + pageSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          all = all.concat(data);
          if (data.length < pageSize) break;
          from += pageSize;
        }
        const ws = XLSX.utils.json_to_sheet(all.length ? all : [{ note: "No data" }]);
        XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(table));
        summary.push({ Table: table, Rows: all.length, Status: "OK" });
      } catch (e: any) {
        summary.push({ Table: table, Rows: 0, Status: `Skipped: ${e.message?.slice(0, 60) || "error"}` });
      }
    }

    // Prepend summary sheet
    const summaryWs = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, summaryWs, "_Summary");
    // Move summary to first
    wb.SheetNames = ["_Summary", ...wb.SheetNames.filter((n) => n !== "_Summary")];

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    XLSX.writeFile(wb, `alheib-data-export-${stamp}.xlsx`);

    setLoading(false);
    setProgress("");
    toast({
      title: "Export complete",
      description: `Exported ${summary.filter((s) => s.Status === "OK").length} tables to Excel.`,
    });
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="bg-primary/5 border-b">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <CardTitle>Data Export</CardTitle>
          <Badge variant="secondary" className="ml-auto">Admin</Badge>
        </div>
        <CardDescription>
          Download a full snapshot of every module — learners, staff, finance,
          attendance, results, inventory and more — as a single multi-sheet Excel workbook.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border">
          <FileSpreadsheet className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            One sheet per table. Includes a <strong>_Summary</strong> sheet listing
            row counts. Generation runs in your browser — large datasets may take a minute.
          </div>
        </div>
        <Button onClick={handleExport} disabled={loading} size="lg" className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress || "Preparing…"}
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export All Data as Excel
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
