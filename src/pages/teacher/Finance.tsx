// @ts-nocheck
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageShell } from "@/components/role/FeaturePageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet } from "lucide-react";

const TeacherFinance = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("salaries").select("*").eq("user_id", user.id).order("month", { ascending: false }).then(({ data }) => setRows(data || []));
  }, [user?.id]);
  const total = rows.reduce((s, r) => s + Number(r.net_pay || 0), 0);
  return (
    <FeaturePageShell title="My Finance" subtitle="Payslips, deductions, year-to-date" icon={Wallet}
      features={["View monthly payslips", "See deductions and bonuses", "Year-to-date earnings"]}>
      <Card>
        <CardContent className="p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Year-to-date net</p>
          <p className="text-3xl font-black mt-1">UGX {total.toLocaleString()}</p>
        </CardContent>
      </Card>
      <Card><CardContent className="p-6">
        <h3 className="font-bold mb-3">Payslips</h3>
        <div className="space-y-2">
          {rows.map((r: any) => (
            <div key={r.id} className="flex justify-between border rounded-lg p-3 text-sm">
              <span>{r.month}</span>
              <span className="font-bold">UGX {Number(r.net_pay || 0).toLocaleString()}</span>
            </div>
          ))}
          {!rows.length && <p className="text-sm text-muted-foreground">No payslips yet.</p>}
        </div>
      </CardContent></Card>
    </FeaturePageShell>
  );
};
export default TeacherFinance;
