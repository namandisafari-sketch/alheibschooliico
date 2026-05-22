// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { FeaturePageShell } from "@/components/role/FeaturePageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  FileBarChart,
  Users,
  Wallet,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const TERMS = ["term_1", "term_2", "term_3"] as const;
const TERM_LABEL: Record<string, string> = {
  term_1: "Term 1",
  term_2: "Term 2",
  term_3: "Term 3",
};

const fmtUGX = (n: number) =>
  new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(n || 0);

const KPI = ({
  icon: Icon,
  label,
  value,
  trend,
  hint,
  tone = "primary",
}: any) => (
  <Card className="border-2">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
            {label}
          </p>
          <p className="text-2xl font-black mt-1">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
        <div
          className={`h-10 w-10 rounded-xl bg-${tone}/10 text-${tone} flex items-center justify-center`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {typeof trend === "number" && (
        <div
          className={`mt-2 flex items-center gap-1 text-xs font-semibold ${
            trend >= 0 ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {trend >= 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {trend >= 0 ? "+" : ""}
          {trend.toFixed(1)}% vs previous
        </div>
      )}
    </CardContent>
  </Card>
);

const ExecutiveReports = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    enrollment: [],
    enrollmentTotal: 0,
    enrollmentPrev: 0,
    apiCurrent: 0,
    apiPrev: 0,
    revenue: 0,
    expenses: 0,
    budgetVsActual: [],
    staffCount: 0,
    staffPrev: 0,
    payrollTotal: 0,
    costPerLearner: 0,
    compliance: { profiles: 0, withNin: 0, withLin: 0, withGuardian: 0 },
  });

  const load = async () => {
    setLoading(true);
    try {
      // Enrollment trend per term
      const trend: any[] = [];
      for (const t of TERMS) {
        const { count } = await supabase
          .from("learners")
          .select("id", { count: "exact", head: true });
        trend.push({ term: TERM_LABEL[t], learners: count || 0 });
      }

      const [
        { count: enrollmentTotal },
        { count: enrollmentPrev },
        { data: marksCurrent },
        { data: marksPrev },
        { data: payments },
        { data: expenses },
        { data: budgets },
        { count: staffCount },
        { data: salaries },
        { data: allLearners },
        { data: guardians },
      ] = await Promise.all([
        supabase
          .from("learners")
          .select("id", { count: "exact", head: true })
          .eq("academic_year" as any, year)
          .or(`academic_year.is.null,academic_year.eq.${year}`),
        supabase
          .from("learners")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("term_results")
          .select("score")
          .eq("academic_year", year),
        supabase
          .from("term_results")
          .select("score")
          .eq("academic_year", year - 1),
        supabase
          .from("fee_payments")
          .select("amount, paid_at, created_at")
          .gte("created_at", `${year}-01-01`)
          .lte("created_at", `${year}-12-31`),
        supabase
          .from("expense_requests")
          .select("amount, status, created_at")
          .gte("created_at", `${year}-01-01`)
          .lte("created_at", `${year}-12-31`),
        supabase.from("budget_requests").select("amount, category, status"),
        supabase
          .from("employees" as any)
          .select("id", { count: "exact", head: true }),
        supabase.from("salaries" as any).select("amount, month").limit(1000),
        supabase.from("learners").select("id, nin, lin"),
        supabase.from("guardians").select("learner_id").limit(5000),
      ]);

      const avg = (rows: any[] | null) => {
        const ns = (rows || [])
          .map((r) => Number(r.score))
          .filter((n) => !isNaN(n) && n > 0);
        if (!ns.length) return 0;
        return ns.reduce((a, b) => a + b, 0) / ns.length;
      };

      const revenue = (payments || []).reduce(
        (s, p: any) => s + Number(p.amount || 0),
        0
      );
      const approvedExpenses = (expenses || [])
        .filter((e: any) => e.status === "approved" || e.status === "paid")
        .reduce((s, e: any) => s + Number(e.amount || 0), 0);

      // Budget vs Actual by category
      const budgetByCat: Record<string, number> = {};
      (budgets || []).forEach((b: any) => {
        budgetByCat[b.category || "Other"] =
          (budgetByCat[b.category || "Other"] || 0) + Number(b.amount || 0);
      });
      const actualByCat: Record<string, number> = {};
      (expenses || []).forEach((e: any) => {
        const cat = (e as any).category || "Operational";
        actualByCat[cat] = (actualByCat[cat] || 0) + Number(e.amount || 0);
      });
      const cats = Array.from(
        new Set([...Object.keys(budgetByCat), ...Object.keys(actualByCat)])
      ).slice(0, 6);
      const budgetVsActual = cats.map((c) => ({
        category: c,
        budget: budgetByCat[c] || 0,
        actual: actualByCat[c] || 0,
      }));

      const payrollTotal = (salaries || []).reduce(
        (s: number, x: any) => s + Number(x.amount || 0),
        0
      );

      const learnerIds = new Set(
        (guardians || []).map((g: any) => g.learner_id)
      );
      const compliance = {
        profiles: (allLearners || []).length,
        withNin: (allLearners || []).filter((l: any) => l.nin).length,
        withLin: (allLearners || []).filter((l: any) => l.lin).length,
        withGuardian: (allLearners || []).filter((l: any) =>
          learnerIds.has(l.id)
        ).length,
      };

      setData({
        enrollment: trend,
        enrollmentTotal: enrollmentTotal || 0,
        enrollmentPrev: enrollmentPrev || 0,
        apiCurrent: Math.round(avg(marksCurrent)),
        apiPrev: Math.round(avg(marksPrev)),
        revenue,
        expenses: approvedExpenses,
        budgetVsActual,
        staffCount: staffCount || 0,
        staffPrev: staffCount || 0,
        payrollTotal,
        costPerLearner: enrollmentTotal
          ? Math.round(approvedExpenses / (enrollmentTotal || 1))
          : 0,
        compliance,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const enrolTrend = useMemo(() => {
    if (!data.enrollmentPrev) return 0;
    return (
      ((data.enrollmentTotal - data.enrollmentPrev) / data.enrollmentPrev) * 100
    );
  }, [data]);

  const apiTrend = useMemo(() => {
    if (!data.apiPrev) return 0;
    return ((data.apiCurrent - data.apiPrev) / data.apiPrev) * 100;
  }, [data]);

  const compliancePct = data.compliance.profiles
    ? Math.round(
        ((data.compliance.withNin +
          data.compliance.withLin +
          data.compliance.withGuardian) /
          (data.compliance.profiles * 3)) *
          100
      )
    : 0;

  const exportCsv = () => {
    const rows = [
      ["Metric", "Value"],
      ["Year", year],
      ["Total Enrollment", data.enrollmentTotal],
      ["Academic Performance Index", data.apiCurrent],
      ["Revenue (UGX)", data.revenue],
      ["Approved Expenses (UGX)", data.expenses],
      ["Payroll Total (UGX)", data.payrollTotal],
      ["Staff Count", data.staffCount],
      ["Cost per Learner (UGX)", data.costPerLearner],
      ["EMIS Compliance %", compliancePct],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `executive-report-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <FeaturePageShell
      title="Executive Reports"
      subtitle="Strategic dashboards for the center director"
      icon={FileBarChart}
      badge="Director"
      features={[
        "Term-over-term enrollment trends",
        "Revenue vs. budget",
        "Academic performance index",
        "Staff turnover & cost per learner",
        "EMIS / regulatory compliance status",
      ]}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">
            Academic year
          </span>
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={exportCsv} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPI
              icon={Users}
              label="Total Enrollment"
              value={data.enrollmentTotal.toLocaleString()}
              trend={enrolTrend}
              hint={`Last year: ${data.enrollmentPrev}`}
            />
            <KPI
              icon={GraduationCap}
              label="Academic Performance"
              value={`${data.apiCurrent}%`}
              trend={apiTrend}
              hint="Mean term score"
            />
            <KPI
              icon={Wallet}
              label="Revenue"
              value={fmtUGX(data.revenue)}
              hint={`Expenses: ${fmtUGX(data.expenses)}`}
            />
            <KPI
              icon={Briefcase}
              label="Cost / Learner"
              value={fmtUGX(data.costPerLearner)}
              hint={`Staff: ${data.staffCount}`}
            />
          </div>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Enrollment trend by term</h3>
                <Badge variant="secondary">{year}</Badge>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.enrollment}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis dataKey="term" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="learners"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="font-bold mb-3">Revenue vs. Budget by category</h3>
              {data.budgetVsActual.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.budgetVsActual}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="category"
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        formatter={(v: any) => fmtUGX(Number(v))}
                      />
                      <Legend />
                      <Bar
                        dataKey="budget"
                        fill="hsl(var(--primary))"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="actual"
                        fill="hsl(var(--accent))"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No budget or expense records for {year}.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">Staff & Payroll</h3>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active staff</span>
                    <span className="font-bold">{data.staffCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total payroll (yr)
                    </span>
                    <span className="font-bold">
                      {fmtUGX(data.payrollTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Avg cost / learner
                    </span>
                    <span className="font-bold">
                      {fmtUGX(data.costPerLearner)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">EMIS / Compliance</h3>
                  <ShieldCheck
                    className={`h-4 w-4 ${
                      compliancePct >= 80
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  />
                </div>
                <p className="text-3xl font-black mb-2">{compliancePct}%</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Learners w/ NIN</span>
                    <span className="font-semibold">
                      {data.compliance.withNin} / {data.compliance.profiles}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Learners w/ LIN</span>
                    <span className="font-semibold">
                      {data.compliance.withLin} / {data.compliance.profiles}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Linked guardians
                    </span>
                    <span className="font-semibold">
                      {data.compliance.withGuardian} /{" "}
                      {data.compliance.profiles}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </FeaturePageShell>
  );
};

export default ExecutiveReports;
