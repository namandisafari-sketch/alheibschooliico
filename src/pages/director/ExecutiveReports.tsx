// @ts-nocheck
import { useEffect, useMemo, useState, useCallback } from "react";
import { FeaturePageShell } from "@/components/role/FeaturePageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { aiReportService } from "@/services/aiReportService";
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
  Scissors,
  Brain,
  Sparkles,
  Stethoscope,
  Box,
  Clock,
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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState("overview");
  const [departmentData, setDepartmentData] = useState<any>(null);
  const [data, setData] = useState<any>({
    enrollmentTrend: [],
    totalEnrollment: 0,
    prevEnrollment: 0,
    activeLearners: 0,
    inactiveLearners: 0,
    categoryCounts: {},
    apiCurrent: 0,
    apiPrev: 0,
    revenue: 0,
    revenuePrev: 0,
    expenses: 0,
    expensesPrev: 0,
    balanceOwed: 0,
    collectionRate: 0,
    budgetVsActual: [],
    staffCount: 0,
    payrollTotal: 0,
    costPerLearner: 0,
    attendance: {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      percentage: 0,
    },
    compliance: { profiles: 0, withNin: 0, withLin: 0, withGuardian: 0 },
    incidentOpen: 0,
    tailorTasks: 0,
    tailorPending: 0,
  });

  const fmtNumber = (n: number) =>
    new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n || 0);

  const fmtNumberAr = (n: number) =>
    new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(n || 0);

  const fmtUGXAr = (n: number) =>
    new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0,
    }).format(n || 0);

  const quarterLabel = (dateValue?: string) => {
    if (!dateValue) return "Q1";
    const month = new Date(dateValue).getMonth();
    if (!Number.isFinite(month) || month < 0) return "Q1";
    const quarter = Math.min(Math.max(Math.floor(month / 3) + 1, 1), 4);
    return `Q${quarter}`;
  };

  const load = async () => {
    setLoading(true);
    try {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;
      const prevYear = year - 1;
      const prevStart = `${prevYear}-01-01`;
      const prevEnd = `${prevYear}-12-31`;

      const [
        learnersAll,
        learnersThisYear,
        learnersPrevYear,
        marksCurrent,
        marksPrev,
        paymentsCurrent,
        paymentsPrev,
        expensesCurrent,
        expensesPrev,
        budgets,
        employees,
        termResultsCurrent,
        termResultsPrev,
        balances,
        attendanceRecords,
        incidentOpen,
        tailorTasks,
        tailorPending,
      ] = await Promise.all([
        supabase
          .from("learners")
          .select(
            "id, pupil_status, status, enrollment_date, guardian_id, nin, lin"
          )
          .limit(10000),
        supabase
          .from("learners")
          .select("enrollment_date")
          .gte("enrollment_date", yearStart)
          .lte("enrollment_date", yearEnd)
          .limit(10000),
        supabase
          .from("learners")
          .select("id", { count: "exact", head: true })
          .gte("enrollment_date", prevStart)
          .lte("enrollment_date", prevEnd),
        supabase
          .from("term_results")
          .select("score")
          .eq("academic_year", year),
        supabase
          .from("term_results")
          .select("score")
          .eq("academic_year", prevYear),
        supabase
          .from("fee_payments")
          .select("amount, created_at")
          .gte("created_at", yearStart)
          .lte("created_at", yearEnd)
          .limit(3000),
        supabase
          .from("fee_payments")
          .select("amount, created_at")
          .gte("created_at", prevStart)
          .lte("created_at", prevEnd)
          .limit(3000),
        supabase
          .from("expense_requests")
          .select("estimated_cost, status, created_at")
          .gte("created_at", yearStart)
          .lte("created_at", yearEnd)
          .limit(3000),
        supabase
          .from("expense_requests")
          .select("estimated_cost, status, created_at")
          .gte("created_at", prevStart)
          .lte("created_at", prevEnd)
          .limit(3000),
        supabase
          .from("budget_requests")
          .select("estimated_cost, status, department")
          .gte("created_at", yearStart)
          .lte("created_at", yearEnd)
          .limit(1000),
        supabase.from("employees").select("base_salary").limit(1000),
        supabase
          .from("term_results")
          .select("score, term")
          .eq("academic_year", year)
          .limit(3000),
        supabase
          .from("term_results")
          .select("score, term")
          .eq("academic_year", prevYear)
          .limit(3000),
        supabase
          .from("student_fee_balances")
          .select("balance")
          .limit(10000),
        supabase
          .from("attendance")
          .select("status, date")
          .gte("date", yearStart)
          .lte("date", yearEnd)
          .limit(20000),
        supabase
          .from("incident_reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
        supabase.from("tailor_tasks").select("id", { count: "exact", head: true }),
        supabase.from("tailor_tasks").select("id", { count: "exact", head: true }).in("status", ["pending", "in_progress"]),
      ]);

      const averageScore = (rows: any[] | null) => {
        const scores = (rows || [])
          .map((row) => Number(row.score))
          .filter((score) => !Number.isNaN(score) && score > 0);
        if (!scores.length) return 0;
        return scores.reduce((sum, value) => sum + value, 0) / scores.length;
      };

      const totalEnrollment = (learnersAll?.data || []).length;
      const activeLearners = (learnersAll?.data || []).filter(
        (l: any) => l.status === "active"
      ).length;
      const inactiveLearners = totalEnrollment - activeLearners;
      const categoryCounts = (learnersAll?.data || []).reduce(
        (acc: Record<string, number>, learner: any) => {
          const status = learner.pupil_status || "Unknown";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {}
      );

      const quarterCounts: Record<string, number> = {
        Q1: 0,
        Q2: 0,
        Q3: 0,
        Q4: 0,
      };
      (learnersThisYear?.data || []).forEach((learner: any) => {
        quarterCounts[quarterLabel(learner.enrollment_date)] += 1;
      });
      const enrollmentTrend = ["Q1", "Q2", "Q3", "Q4"].map((q) => ({
        quarter: q,
        learners: quarterCounts[q],
      }));

      const revenue = (paymentsCurrent?.data || []).reduce(
        (sum: number, payment: any) => sum + Number(payment.amount || 0),
        0
      );
      const revenuePrev = (paymentsPrev?.data || []).reduce(
        (sum: number, payment: any) => sum + Number(payment.amount || 0),
        0
      );
      const approvedExpenses = (expensesCurrent?.data || [])
        .filter((expense: any) =>
          ["approved", "paid", "completed"].includes(expense.status)
        )
        .reduce((sum: number, expense: any) => sum + Number(expense.estimated_cost || 0), 0);
      const approvedExpensesPrev = (expensesPrev?.data || [])
        .filter((expense: any) =>
          ["approved", "paid", "completed"].includes(expense.status)
        )
        .reduce((sum: number, expense: any) => sum + Number(expense.estimated_cost || 0), 0);

      const balanceOwed = (balances?.data || []).reduce(
        (sum: number, row: any) => sum + Number(row.balance || 0),
        0
      );
      const expectedRevenue = revenue + balanceOwed;
      const collectionRate = expectedRevenue
        ? Math.round((revenue / expectedRevenue) * 100)
        : 100;

      const budgetByCategory: Record<string, number> = {};
      (budgets?.data || []).forEach((budget: any) => {
        const category = budget.department || "General";
        budgetByCategory[category] =
          (budgetByCategory[category] || 0) + Number(budget.estimated_cost || 0);
      });

      const actualByCategory: Record<string, number> = {};
      (expensesCurrent?.data || []).forEach((expense: any) => {
        const category = expense.status || "Operational";
        actualByCategory[category] =
          (actualByCategory[category] || 0) + Number(expense.estimated_cost || 0);
      });

      const categories = Array.from(
        new Set([
          ...Object.keys(budgetByCategory),
          ...Object.keys(actualByCategory),
        ])
      ).slice(0, 6);
      const budgetVsActual = categories.map((category) => ({
        category,
        budget: budgetByCategory[category] || 0,
        actual: actualByCategory[category] || 0,
      }));

      const payrollTotal = (employees?.data || []).reduce(
        (sum: number, employee: any) => sum + Number(employee.base_salary || 0),
        0
      );
      const staffCount = (employees?.data || []).length;

      const attendanceRows = attendanceRecords?.data || [];
      const present = attendanceRows.filter(
        (row: any) => row.status === "present"
      ).length;
      const absent = attendanceRows.filter(
        (row: any) => row.status === "absent"
      ).length;
      const late = attendanceRows.filter(
        (row: any) => row.status === "late"
      ).length;
      const attendanceTotal = attendanceRows.length;
      const attendancePercent = attendanceTotal
        ? Math.round((present / attendanceTotal) * 100)
        : 0;

      const compliance = {
        profiles: totalEnrollment,
        withNin: (learnersAll?.data || []).filter((l: any) => l.nin).length,
        withLin: (learnersAll?.data || []).filter((l: any) => l.lin).length,
        withGuardian: (learnersAll?.data || []).filter(
          (l: any) => !!l.guardian_id
        ).length,
      };

      setDepartmentData({
        academic: { totalEnrollment, activeLearners, teachers: 0, classes: 0 },
        finance: { revenue, expenses: approvedExpenses, balance: balanceOwed, collectionRate },
        health: { healthVisits: 0 },
        inventory: { inventoryItems: 0, lowStock: 0 },
        gate: { gateEntries: 0 },
        tailor: { tailorTasks: tailorTasks?.count || 0, pendingTailor: tailorPending?.count || 0 },
        staff: { staffCount, presentToday: 0 },
      });

      setData({
        enrollmentTrend,
        totalEnrollment,
        prevEnrollment: learnersPrevYear?.count || 0,
        activeLearners,
        inactiveLearners,
        categoryCounts,
        apiCurrent: Math.round(averageScore(termResultsCurrent?.data)),
        apiPrev: Math.round(averageScore(termResultsPrev?.data)),
        revenue,
        revenuePrev,
        expenses: approvedExpenses,
        expensesPrev: approvedExpensesPrev,
        balanceOwed,
        collectionRate,
        budgetVsActual,
        staffCount,
        payrollTotal,
        costPerLearner: totalEnrollment
          ? Math.round(payrollTotal / totalEnrollment)
          : 0,
        attendance: {
          total: attendanceTotal,
          present,
          absent,
          late,
          percentage: attendancePercent,
        },
        compliance,
        incidentOpen: incidentOpen?.count || 0,
        tailorTasks: tailorTasks?.count || 0,
        tailorPending: tailorPending?.count || 0,
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
    if (!data.prevEnrollment) return 0;
    return (
      ((data.totalEnrollment - data.prevEnrollment) / data.prevEnrollment) * 100
    );
  }, [data]);

  const apiTrend = useMemo(() => {
    if (!data.apiPrev) return 0;
    return ((data.apiCurrent - data.apiPrev) / data.apiPrev) * 100;
  }, [data]);

  const revenueTrend = useMemo(() => {
    if (!data.revenuePrev) return 0;
    return ((data.revenue - data.revenuePrev) / data.revenuePrev) * 100;
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

  const reportSummary = useMemo(() => {
    const enrollmentDelta = data.prevEnrollment
      ? ((data.totalEnrollment - data.prevEnrollment) / data.prevEnrollment) * 100
      : 0;
    const financialGap = data.revenue - data.expenses;
    const financialTone = financialGap >= 0 ? "surplus" : "deficit";
    const financialToneAr = financialTone === "surplus" ? "فائض" : "عجز";
    const attendanceLabel = data.attendance.percentage >= 90 ? "strong" : "requires attention";
    const attendanceLabelAr = data.attendance.percentage >= 90 ? "قوي" : "يحتاج اهتمامًا";
    const collectionLabel = data.collectionRate >= 85 ? "healthy" : "at risk";
    const collectionLabelAr = data.collectionRate >= 85 ? "جيدة" : "معرضة للخطر";

    const english = `For ${year}, the school supported ${fmtNumber(
      data.totalEnrollment
    )} learners, with ${fmtNumber(data.activeLearners)} active enrollments and ${fmtNumber(
      data.inactiveLearners
    )} inactive learners. Enrollment ${
      enrollmentDelta >= 0 ? "grew" : "fell"
    } ${Math.abs(enrollmentDelta).toFixed(1)}% year over year. Academic performance averaged ${fmtNumber(
      data.apiCurrent
    )}% and moved ${data.apiPrev ? `${apiTrend.toFixed(1)}%` : "to a new baseline"} from the previous year. Fee collection is ${collectionLabel} at ${data.collectionRate}% and revenue reached ${fmtUGX(
      data.revenue
    )}. Approved expenses were ${fmtUGX(data.expenses)}, creating a ${financialTone} of ${fmtUGX(
      Math.abs(financialGap)
    )}. Attendance coverage is ${data.attendance.percentage}% for the year, which ${attendanceLabel}.`; 

    const arabic = `خلال عام ${year}، دعمت المدرسة ${fmtNumberAr(
      data.totalEnrollment
    )} متعلماً، منهم ${fmtNumberAr(data.activeLearners)} نشطون و ${fmtNumberAr(
      data.inactiveLearners
    )} غير نشطين. ${enrollmentDelta >= 0 ? "نما" : "انخفض"} عدد المتعلمين بنسبة ${fmtNumberAr(
      Number(Math.abs(enrollmentDelta).toFixed(1))
    )}% مقارنة بالعام السابق. كان متوسط الأداء الأكاديمي ${fmtNumberAr(
      data.apiCurrent
    )}%. نسبة تحصيل الرسوم ${collectionLabel} عند ${fmtNumberAr(
      data.collectionRate
    )}٪. بلغت الإيرادات ${fmtUGXAr(data.revenue)}، بينما كانت النفقات المعتمدة ${fmtUGXAr(
      data.expenses
    )}. هناك ${financialToneAr} قدره ${fmtUGXAr(
      Math.abs(financialGap)
    )}. نسبة تحصيل الرسوم ${collectionLabelAr} عند ${fmtNumberAr(
      data.collectionRate
    )}٪. نسبة الحضور ${fmtNumberAr(data.attendance.percentage)}٪، وهو وضع ${attendanceLabelAr}.`;
    const actionsEn = [
      `Prioritize collection for outstanding balances of ${fmtUGX(data.balanceOwed)} to strengthen the ${collectionLabel} revenue position.`,
      financialGap < 0
        ? `Review spending categories and limit non-essential budget requests to close the ${fmtUGX(
            Math.abs(financialGap)
          )} deficit.`
        : `Use the current ${fmtUGX(Math.abs(financialGap))} surplus to invest in targeted academic support and attendance interventions.`,
      data.attendance.percentage < 90
        ? `Deploy a learner attendance campaign and support teachers with follow-up for absent students.`
        : `Maintain strong attendance practices and reward consistency.`,
    ];

    const actionsAr = [
      `احتفظ بتركيزك على تحصيل الرصيد المتبقي البالغ ${fmtUGXAr(data.balanceOwed)} لتعزيز الوضع المالي.`,
      financialGap < 0
        ? `راجع بنود الإنفاق وقلل الطلبات غير الضرورية لإغلاق العجز البالغ ${fmtUGXAr(
            Math.abs(financialGap)
          )}.`
        : `استثمر الفائض الحالي في دعم أكاديمي مستهدف وتحسين حضور المتعلمين.`,
      data.attendance.percentage < 90
        ? `أطلق حملة حضور ودعم المتعلمين المتغيبين بالتنسيق مع المعلمين.`
        : `استمر في تعزيز ممارسات الحضور الجيدة ومكافأة الاستمرارية.`,
    ];

    return { english, arabic, actionsEn, actionsAr };
  }, [data, year, apiTrend]);

  const generateAIReport = useCallback(async () => {
    if (!departmentData) return;
    setAiLoading(true);
    try {
      const result = await aiReportService.generateExecutiveSummary(departmentData, String(year));
      setAiReport(result);
    } catch (err) {
      console.error("AI report error:", err);
    } finally {
      setAiLoading(false);
    }
  }, [departmentData, year]);

  const exportCsv = () => {
    const rows = [
      ["Metric", "Value"],
      ["Year", year],
      ["Total Enrollment", data.totalEnrollment],
      ["Active Learners", data.activeLearners],
      ["Inactive Learners", data.inactiveLearners],
      ["Academic Performance Index", data.apiCurrent],
      ["Fee Collection %", data.collectionRate],
      ["Outstanding Balance (UGX)", data.balanceOwed],
      ["Revenue (UGX)", data.revenue],
      ["Approved Expenses (UGX)", data.expenses],
      ["Payroll Total (UGX)", data.payrollTotal],
      ["Staff Count", data.staffCount],
      ["Cost per Learner (UGX)", data.costPerLearner],
      ["Attendance %", data.attendance.percentage],
      ["Open Incidents", data.incidentOpen],
      ["EMIS Compliance %", compliancePct],
      ["Tailor Tasks", data.tailorTasks],
      ["Tailor Pending", data.tailorPending],
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <KPI icon={Users} label="Total Enrollment" value={data.totalEnrollment.toLocaleString()} trend={enrolTrend} hint={`Last year: ${data.prevEnrollment.toLocaleString()}`} />
            <KPI icon={GraduationCap} label="Academic Performance" value={`${data.apiCurrent}%`} trend={apiTrend} hint="Mean term score" />
            <KPI icon={Wallet} label="Fee collection rate" value={`${data.collectionRate}%`} trend={revenueTrend} hint={`Outstanding: ${fmtUGX(data.balanceOwed)}`} />
            <KPI icon={Briefcase} label="Cost / Learner" value={fmtUGX(data.costPerLearner)} hint={`Staff: ${data.staffCount}`} />
            <KPI icon={Scissors} label="Tailor Tasks" value={String(data.tailorTasks)} hint={`${data.tailorPending} pending`} />
          </div>

          {/* AI-Powered Insights */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">AI-Powered Intelligence</CardTitle>
                <Badge variant="secondary" className="text-[8px]">DeepSeek via Baseten</Badge>
              </div>
              <Button size="sm" onClick={generateAIReport} disabled={aiLoading || !departmentData} className="gap-2">
                <Sparkles className="h-4 w-4" />
                {aiLoading ? "Analyzing..." : "Generate Report"}
              </Button>
            </CardHeader>
            <CardContent>
              {aiReport ? (
                <div className="space-y-4">
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                    <p className="text-xs font-bold uppercase mb-1">Executive Summary</p>
                    <p className="text-sm leading-relaxed">{aiReport.summary}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                      <p className="text-xs font-bold text-blue-700 uppercase mb-2">Key Insights</p>
                      <ul className="space-y-1.5">{aiReport.insights?.map((i: string, idx: number) => <li key={idx} className="text-xs flex gap-1.5"><span className="text-blue-500">•</span><span>{i}</span></li>)}</ul>
                    </div>
                    <div className="bg-green-50/50 rounded-xl p-4 border border-green-100">
                      <p className="text-xs font-bold text-green-700 uppercase mb-2">Recommendations</p>
                      <ul className="space-y-1.5">{aiReport.recommendations?.map((r: string, idx: number) => <li key={idx} className="text-xs flex gap-1.5"><span className="text-green-500">→</span><span>{r}</span></li>)}</ul>
                    </div>
                    <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                      <p className="text-xs font-bold text-amber-700 uppercase mb-2">Trends</p>
                      <ul className="space-y-1.5">{aiReport.trends?.map((t: string, idx: number) => <li key={idx} className="text-xs flex gap-1.5"><span className="text-amber-500">~</span><span>{t}</span></li>)}</ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">AI learns from every action in the system</p>
                  <p className="text-xs mt-1">Generate AI-powered insights using DeepSeek via Baseten</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department Tabs */}
          <Tabs value={selectedDept} onValueChange={setSelectedDept}>
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="tailor" className="text-xs gap-1"><Scissors className="h-3 w-3" /> Tailor</TabsTrigger>
              <TabsTrigger value="health" className="text-xs gap-1"><Stethoscope className="h-3 w-3" /> Health</TabsTrigger>
              <TabsTrigger value="inventory" className="text-xs gap-1"><Box className="h-3 w-3" /> Store</TabsTrigger>
              <TabsTrigger value="staff" className="text-xs gap-1"><Users className="h-3 w-3" /> HR</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card><CardContent className="p-4"><p className="text-[10px] text-muted-foreground uppercase">Tailor Workshop</p><p className="text-2xl font-bold">{data.tailorTasks}</p><p className="text-xs text-muted-foreground">{data.tailorPending} pending jobs</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-[10px] text-muted-foreground uppercase">Active Staff</p><p className="text-2xl font-bold">{data.staffCount}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-[10px] text-muted-foreground uppercase">Attendance Rate</p><p className="text-2xl font-bold">{data.attendance.percentage}%</p></CardContent></Card>
              </div>
            </TabsContent>

            <TabsContent value="tailor" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Scissors className="h-4 w-4" /> Tailor Workshop Report</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total Tasks", value: data.tailorTasks },
                      { label: "Pending / Active", value: data.tailorPending },
                      { label: "Completed", value: data.tailorTasks - data.tailorPending },
                      { label: "Workload", value: data.tailorTasks ? `${Math.round((data.tailorPending / data.tailorTasks) * 100)}%` : "N/A" },
                    ].map(s => (
                      <div key={s.label} className="bg-muted/50 rounded-xl p-4 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                        <p className="text-2xl font-bold">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health" className="mt-4">
              <Card><CardContent className="p-8 text-center text-muted-foreground"><p>Health data will appear here once the module is active.</p></CardContent></Card>
            </TabsContent>

            <TabsContent value="inventory" className="mt-4">
              <Card><CardContent className="p-8 text-center text-muted-foreground"><p>Store data will appear here once the module is linked.</p></CardContent></Card>
            </TabsContent>

            <TabsContent value="staff" className="mt-4">
              <Card><CardContent className="p-8 text-center text-muted-foreground"><p>HR analytics will appear here once integrated.</p></CardContent></Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Enrollment trend by quarter</h3>
                <Badge variant="secondary">{year}</Badge>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.enrollmentTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="quarter"
                      stroke="hsl(var(--muted-foreground))"
                    />
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
                      <Tooltip formatter={(v: any) => fmtUGX(Number(v))} />
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
                <h3 className="font-bold mb-3">Executive summary</h3>
                <p className="text-sm leading-7 text-slate-700">
                  {reportSummary.english}
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  {reportSummary.actionsEn.map((action, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <p>{action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5" dir="rtl">
                <h3 className="font-bold mb-3">الملخص التنفيذي</h3>
                <p className="text-sm leading-7 text-slate-700">
                  {reportSummary.arabic}
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  {reportSummary.actionsAr.map((action, index) => (
                    <div key={index} className="flex items-start gap-2 justify-end">
                      <p>{action}</p>
                      <span className="text-primary mt-1">•</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

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
