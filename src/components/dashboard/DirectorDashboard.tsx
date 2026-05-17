import { useEffect, useState } from "react";
import { Kpi, Section } from "@/components/role/RolePage";
import {
  Crown, TrendingUp, Wallet, Users, FileBarChart,
  GraduationCap, Stethoscope, Box, DoorOpen, Briefcase, ClipboardCheck,
  AlertCircle, Bell, Activity, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useLearners } from "@/hooks/useLearners";
import { supabase } from "@/integrations/supabase/client";

const safeCount = async (table: string, filter?: (q: any) => any) => {
  try {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count, error } = await q;
    if (error) return null;
    return count ?? 0;
  } catch { return null; }
};

export const DirectorDashboard = () => {
  const { data: learners } = useLearners();
  const [stats, setStats] = useState<Record<string, number | null>>({});
  const [feeTotal30d, setFeeTotal30d] = useState<number | null>(null);
  const [expenseTotal, setExpenseTotal] = useState<number | null>(null);
  const [attendancePct, setAttendancePct] = useState<number | null>(null);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
      const since7  = new Date(Date.now() - 7  * 86400000).toISOString();
      const today   = new Date().toISOString().slice(0, 10);

      const [
        teachers, staff, classes, visitors, inventory, suppliers,
        clinic, medication, incidents, leave, advance, letters,
        warnings, appeals, feePayments, expenses, lowStock, discipline, lessonPlansPending,
      ] = await Promise.all([
        safeCount("profiles", q => q.eq("role", "teacher")),
        safeCount("profiles"),
        safeCount("classes"),
        safeCount("visitors", q => q.gte("created_at", since7)),
        safeCount("inventory_items"),
        safeCount("suppliers"),
        safeCount("health_visits", q => q.gte("created_at", since7)),
        safeCount("medication_logs"),
        safeCount("incident_reports", q => q.eq("status", "open")),
        safeCount("leave_requests", q => q.eq("status", "pending")),
        safeCount("advance_requests", q => q.eq("status", "pending")),
        safeCount("staff_letters", q => q.eq("status", "pending")),
        safeCount("user_warnings", q => q.eq("acknowledged", false)),
        safeCount("account_appeals", q => q.eq("status", "pending")),
        safeCount("fee_payments", q => q.gte("created_at", since30)),
        safeCount("expense_requests", q => q.eq("status", "pending")),
        safeCount("inventory_items", q => q.lte("quantity", 5)),
        safeCount("discipline_cases", q => q.eq("status", "pending")),
        safeCount("lesson_plans", q => q.eq("status", "pending")),
      ]);
      setStats({
        teachers, staff, classes, visitors, inventory, suppliers,
        clinic, medication, incidents, leave, advance, letters,
        warnings, appeals, feePayments, expenses, lowStock, discipline, lessonPlansPending,
      });

      try {
        const { data: payRows } = await supabase
          .from("fee_payments").select("amount").gte("created_at", since30);
        if (payRows) setFeeTotal30d(payRows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0));
      } catch (err) {
        console.error("DirectorDashboard fetch fee error:", err);
      }

      try {
        const { data: expRows } = await supabase
          .from("expense_requests").select("amount").eq("status", "pending");
        if (expRows) setExpenseTotal(expRows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0));
      } catch (err) {
        console.error("DirectorDashboard fetch expense error:", err);
      }

      try {
        const { data: att } = await supabase
          .from("attendance").select("status").eq("date", today);
        if (att && att.length) {
          const present = att.filter((a: any) => a.status === "present").length;
          setAttendancePct(Math.round((present / att.length) * 100));
        }
      } catch (err) {
        console.error("DirectorDashboard fetch attendance error:", err);
      }

      try {
        const feeds: any[] = [];
        const pull = async (table: string, label: string, fmt: (r: any) => string) => {
          try {
            const { data } = await supabase.from(table).select("*").order("created_at", { ascending: false }).limit(4);
            (data || []).forEach((r: any) => feeds.push({ label, when: r.created_at, text: fmt(r) }));
          } catch (err) {
            console.error(`DirectorDashboard pull ${table} error:`, err);
          }
        };
        await Promise.all([
          pull("leave_requests", "Leave", (r) => `${r.full_name || "Staff"} requested ${r.leave_type || "leave"}`),
          pull("advance_requests", "Advance", (r) => `${r.full_name || "Staff"} requested an advance`),
          pull("fee_payments", "Payment", () => `Fee payment received`),
          pull("incident_reports", "Incident", (r) => r.title || "Incident reported"),
          pull("visitors", "Visitor", (r) => `${r.name || "Visitor"} signed in`),
          pull("user_warnings", "Warning", (r) => r.message || "Warning issued"),
        ]);
        feeds.sort((a, b) => (b.when || "").localeCompare(a.when || ""));
        setActivity(feeds.slice(0, 12));
      } catch (err) {
        console.error("DirectorDashboard activity calculation error:", err);
      }
    })();
  }, []);

  const v = (k: string) => (stats[k] === null || stats[k] === undefined ? "—" : stats[k]);
  const pendingTotal =
    (stats.leave ?? 0) + (stats.advance ?? 0) + (stats.letters ?? 0) +
    (stats.appeals ?? 0) + (stats.expenses ?? 0) + (stats.discipline ?? 0) + (stats.lessonPlansPending ?? 0);
  const fmtUGX = (n: number | null) => n === null ? "—" : `UGX ${n.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Crown className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Center Director · Executive Console</p>
              <h2 className="text-2xl font-black text-amber-950 tracking-tight">Strategic command across all roles</h2>
              <p className="text-sm text-amber-800/80 mt-0.5">Live signals from every department in your school.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white shadow">
              <Link to="/director/users"><Users className="mr-2 h-4 w-4" />User Control</Link>
            </Button>
            <Button asChild variant="outline" className="border-amber-300">
              <Link to="/director/approvals">Approvals {pendingTotal > 0 && <Badge className="ml-2 bg-rose-500">{pendingTotal}</Badge>}</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Headline KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Kpi label="Active Learners" value={learners?.length ?? "—"} hint="Enrollment" icon={Users} tone="primary" />
        <Kpi label="Staff" value={v("staff")} hint={`${v("teachers")} teachers`} icon={Briefcase} tone="info" />
        <Kpi label="Pending Approvals" value={pendingTotal} hint="Across all queues" icon={ClipboardCheck} tone="warning" />
        <Kpi label="Open Incidents" value={v("incidents")} hint="Health & discipline" icon={AlertCircle} tone="warning" />
      </div>

      {/* Money + attendance row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Kpi label="Fee Inflow (30d)"  value={fmtUGX(feeTotal30d)}  hint={`${v("feePayments")} payments`} icon={Wallet} tone="success" />
        <Kpi label="Pending Expenses"  value={fmtUGX(expenseTotal)} hint={`${v("expenses")} requests`}    icon={TrendingUp} tone="warning" />
        <Kpi label="Attendance Today"  value={attendancePct === null ? "—" : `${attendancePct}%`} hint="Learners present" icon={Activity} tone="primary" />
        <Kpi label="Low-stock Items"   value={v("lowStock")} hint="Reorder soon" icon={Box} tone="warning" />
      </div>

      {/* Cross-role summary cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        <RoleCard
          icon={GraduationCap} title="Academic (DOS + Teachers)" tone="from-sky-500 to-indigo-600"
          stats={[
            { l: "Classes", v: v("classes") },
            { l: "Teachers", v: v("teachers") },
            { l: "Lesson Approvals", v: v("lessonPlansPending") },
          ]}
          links={[
            { label: "DOS workspace", to: "/dos" },
            { label: "Teacher hub", to: "/teacher" },
            { label: "P7 PLE Mgt", to: "/dos/p7-management" },
            { label: "Lesson tracking", to: "/dos/lesson-tracking" }
          ]}
        />
        <RoleCard
          icon={Wallet} title="Finance (Accountant)" tone="from-emerald-500 to-teal-600"
          stats={[
            { l: "Fee payments (30d)", v: v("feePayments") },
            { l: "Pending expenses", v: v("expenses") },
            { l: "Salary advance reqs", v: v("advance") },
          ]}
          links={[{ label: "Fees tracking", to: "/accountant/fees-tracking" }, { label: "Reconciliation", to: "/accountant/reconciliation" }]}
        />
        <RoleCard
          icon={AlertCircle} title="Welfare & Discipline" tone="from-rose-500 to-orange-600"
          stats={[
            { l: "Open Cases", v: v("discipline") },
            { l: "Clinic Visits (7d)", v: v("clinic") },
            { l: "Health Incidents", v: v("incidents") },
          ]}
          links={[
            { label: "Discipline log", to: "/discipline" },
            { label: "Health center", to: "/nurse" },
            { label: "Attendance tracking", to: "/attendance" }
          ]}
        />
        <RoleCard
          icon={Stethoscope} title="Health (Nurse)" tone="from-rose-500 to-pink-600"
          stats={[
            { l: "Clinic visits (7d)", v: v("clinic") },
            { l: "Medications tracked", v: v("medication") },
            { l: "Open incidents", v: v("incidents") },
          ]}
          links={[{ label: "Clinic", to: "/nurse/clinic" }, { label: "Incidents", to: "/nurse/incidents" }]}
        />
        <RoleCard
          icon={Box} title="Store & Inventory" tone="from-amber-500 to-orange-600"
          stats={[
            { l: "Inventory items", v: v("inventory") },
            { l: "Suppliers", v: v("suppliers") },
            { l: "Low-stock alerts", v: "—" },
          ]}
          links={[{ label: "Store home", to: "/store" }, { label: "Suppliers", to: "/store/suppliers" }]}
        />
        <RoleCard
          icon={DoorOpen} title="Gate & Security" tone="from-slate-600 to-slate-800"
          stats={[
            { l: "Visitors (7d)", v: v("visitors") },
            { l: "Vehicle log", v: "—" },
            { l: "Exit passes", v: "—" },
          ]}
          links={[{ label: "Gate home", to: "/gate" }, { label: "Visitors", to: "/visitors" }]}
        />
        <RoleCard
          icon={Briefcase} title="Office & Workforce" tone="from-violet-500 to-purple-600"
          stats={[
            { l: "Pending leave", v: v("leave") },
            { l: "Letters in queue", v: v("letters") },
            { l: "Active warnings", v: v("warnings") },
          ]}
          links={[{ label: "Office", to: "/office" }, { label: "User Control", to: "/director/users" }]}
        />
      </div>

      {/* Bottom strip */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Director-Only Actions" description="Quick command panel">
          <div className="grid gap-2 sm:grid-cols-2">
            <ActionLink to="/director/users" icon={Users} label="Manage users & permissions" />
            <ActionLink to="/director/approvals" icon={ClipboardCheck} label={`Approval queue${pendingTotal ? ` (${pendingTotal})` : ""}`} />
            <ActionLink to="/director/reports" icon={FileBarChart} label="Executive reports" />
            <ActionLink to="/notifications" icon={Bell} label="Broadcast announcement" />
          </div>
        </Section>
        <Section title="Compliance & Health" description="System indicators">
          <div className="space-y-3">
            <Indicator label="Account appeals pending" value={v("appeals")} tone={(stats.appeals ?? 0) > 0 ? "warning" : "success"} />
            <Indicator label="Unacknowledged warnings" value={v("warnings")} tone={(stats.warnings ?? 0) > 0 ? "warning" : "success"} />
            <Indicator label="Open health incidents" value={v("incidents")} tone={(stats.incidents ?? 0) > 0 ? "warning" : "success"} />
          </div>
        </Section>
      </div>

      {/* Live activity feed */}
      <Section title="Live Activity Feed" description="Most recent events across all departments">
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity yet.</p>
        ) : (
          <div className="divide-y rounded-xl border bg-card">
            {activity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider min-w-[72px] justify-center">{a.label}</Badge>
                <p className="text-sm flex-1 truncate">{a.text}</p>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {a.when ? new Date(a.when).toLocaleString() : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

const RoleCard = ({ icon: Icon, title, tone, stats, links }: any) => (
  <div className="rounded-2xl border-2 border-slate-100 bg-white overflow-hidden hover:shadow-md transition-shadow">
    <div className={`bg-gradient-to-r ${tone} px-5 py-3 flex items-center gap-3 text-white`}>
      <Icon className="h-5 w-5" />
      <h3 className="text-sm font-black tracking-tight">{title}</h3>
    </div>
    <div className="p-5 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s: any) => (
          <div key={s.l} className="text-center">
            <p className="text-xl font-black tabular-nums">{s.v ?? "—"}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2 border-t border-slate-100">
        {links.map((lk: any) => (
          <Button key={lk.to} asChild variant="ghost" size="sm" className="flex-1 justify-between text-xs">
            <Link to={lk.to}>{lk.label} <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        ))}
      </div>
    </div>
  </div>
);

const ActionLink = ({ to, icon: Icon, label }: any) => (
  <Button asChild variant="outline" className="justify-start h-12 rounded-xl">
    <Link to={to}><Icon className="mr-2 h-4 w-4" />{label}</Link>
  </Button>
);

const Indicator = ({ label, value, tone }: any) => (
  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
    <span className="text-sm">{label}</span>
    <Badge className={tone === "warning" ? "bg-amber-500" : "bg-emerald-500"}>{value}</Badge>
  </div>
);
