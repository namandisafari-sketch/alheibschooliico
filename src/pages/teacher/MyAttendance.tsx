// @ts-nocheck
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FeaturePageShell } from "@/components/role/FeaturePageShell";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

const TeacherAttendance = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("staff_attendance").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(60).then(({ data }) => setRows(data || []));
  }, [user?.id]);
  const present = rows.filter((r) => r.status === "present").length;
  const rate = rows.length ? Math.round((present / rows.length) * 100) : 0;
  return (
    <FeaturePageShell title="My Attendance" subtitle="Clock-in / out logs and rate" icon={ClipboardCheck}
      features={["Daily attendance log", "Late count and absent days", "Monthly attendance rate %"]}>
      <Card>
        <CardContent className="p-6 grid grid-cols-3 gap-4">
          <div><p className="text-xs uppercase">Rate</p><p className="text-3xl font-black">{rate}%</p></div>
          <div><p className="text-xs uppercase">Present</p><p className="text-3xl font-black">{present}</p></div>
          <div><p className="text-xs uppercase">Records</p><p className="text-3xl font-black">{rows.length}</p></div>
        </CardContent>
      </Card>
      <Card><CardContent className="p-6">
        <h3 className="font-bold mb-3">Recent log</h3>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {rows.map((r: any) => (
            <div key={r.id} className="flex justify-between border rounded-lg p-2 text-sm">
              <span>{r.date}</span>
              <span className={r.status === "present" ? "text-emerald-600" : r.status === "late" ? "text-amber-600" : "text-destructive"}>{r.status}</span>
            </div>
          ))}
          {!rows.length && <p className="text-sm text-muted-foreground">No attendance records.</p>}
        </div>
      </CardContent></Card>
    </FeaturePageShell>
  );
};
export default TeacherAttendance;
