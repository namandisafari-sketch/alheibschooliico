// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ClassOverview } from "@/components/dashboard/ClassOverview";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { FeeCollectionSummary, RecentFeePayments, OutstandingBalancesWidget } from "@/components/dashboard/FeeWidgets";
import { Users, GraduationCap, BookOpen, ClipboardCheck } from "lucide-react";
import { useLearners } from "@/hooks/useLearners";
import { useTeachers } from "@/hooks/useTeachers";
import { useClasses } from "@/hooks/useClasses";
import { useAcademicSettings } from "@/hooks/useAcademicSettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { SecurityDashboard } from "@/components/dashboard/SecurityDashboard";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { QuickNavBar } from "@/components/dashboard/QuickNavBar";
import { AccountantDashboard } from "@/components/dashboard/AccountantDashboard";
import { HeadTeacherDashboard } from "@/components/dashboard/HeadTeacherDashboard";
import { OfficeDashboard as StaffDashboard } from "@/components/dashboard/OfficeDashboard";
import { GatemanDashboard } from "@/components/dashboard/GatemanDashboard";
import { Navigate } from "react-router-dom";
import { InventorySummaryWidget } from "@/components/dashboard/InventoryWidgets";
import { SystemHealthWidget } from "@/components/dashboard/SystemHealthWidget";
import { HealthStatusWidget } from "@/components/dashboard/HealthStatusWidget";
import { DisciplineTrackerWidget } from "@/components/dashboard/DisciplineTrackerWidget";
import { BoardingIslamicWidget } from "@/components/dashboard/BoardingIslamicWidget";
import { DormitoryStatusWidget } from "@/components/dashboard/DormitoryStatusWidget";
import { DynamicAcademicProgress } from "@/components/dashboard/DynamicAcademicProgress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageGuide } from "@/components/common/PageGuide";
import { RegistrationTrackerWidget } from "@/components/dashboard/RegistrationTrackerWidget";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { IslamicDashboard } from "@/components/dashboard/IslamicDashboard";
import { ExecutiveDashboard } from "@/components/dashboard/ExecutiveDashboard";
import { SecretaryDashboard } from "@/components/dashboard/SecretaryDashboard";
import { DirectorDashboard } from "@/components/dashboard/DirectorDashboard";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";
import { HeadOfInternalDashboard } from "@/components/dashboard/HeadOfInternalDashboard";
import { AssetUnderMyCustody } from "@/components/dashboard/AssetUnderMyCustody";

const useAttendanceStats = () => {
  return useQuery({
    queryKey: ["attendance-stats"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

      const [todayRes, weekRes] = await Promise.all([
        supabase.from("attendance").select("status").eq("date", today),
        supabase.from("attendance").select("status").gte("date", weekAgo).lt("date", today),
      ]);

      const calc = (rows: { status: string }[] | null) => {
        if (!rows?.length) return null;
        const present = rows.filter((r) => r.status === "present" || r.status === "late").length;
        return Math.round((present / rows.length) * 100);
      };

      const todayRate = calc(todayRes.data);
      const lastWeekRate = calc(weekRes.data);
      return { todayRate, lastWeekRate };
    },
    refetchInterval: 60000,
  });
};

const Index = () => {
  const { role } = useAuth();
  const { data: learners } = useLearners();
  const { data: teachers } = useTeachers();
  const { data: classes } = useClasses();
  const { data: attStats } = useAttendanceStats();
  const { data: academicSettings } = useAcademicSettings();

  const currentYear = academicSettings?.current_year ?? new Date().getFullYear();
  const currentTermId = academicSettings?.current_term_id ?? "term_1";
  const terms = academicSettings?.terms ?? [];
  const activeTerm = terms.find(t => t.id === currentTermId)?.name ?? "Term I";
  const currentWeek = academicSettings?.current_week ?? 1;
  const totalWeeks = academicSettings?.total_weeks ?? 14;

  const totalLearners = learners?.length ?? 0;
  const totalTeachers = teachers?.length ?? 0;
  const totalClasses = classes?.length ?? 0;
  const attendanceRate = attStats?.todayRate;
  const attDelta =
    attStats?.todayRate != null && attStats?.lastWeekRate != null
      ? attStats.todayRate - attStats.lastWeekRate
      : null;

  if (role === "gateman") {
    return (
      <DashboardLayout
        title="Gate Control Hub"
        subtitle="Campus security and visitor management"
      >
        <GatemanDashboard />
        <AssetUnderMyCustody />
      </DashboardLayout>
    );
  }

  if (role === "secretary" || role === "office_manager") {
    return (
      <DashboardLayout
        title="Secretary Hub"
        subtitle="Office operations, communications & document management"
      >
        <SecretaryDashboard />
        <AssetUnderMyCustody />
      </DashboardLayout>
    );
  }

  if (role === "security") {
    return (
      <DashboardLayout 
        title="Gate Operations" 
        subtitle="Security & Visitor Management - Alheib Mixed Day & Boarding School"
      >
        <SecurityDashboard />
        <AssetUnderMyCustody />
      </DashboardLayout>
    );
  }

  if (role === "parent") {
    return <Navigate to="/parent" replace />;
  }

  if (role === "teacher") {
    return (
      <DashboardLayout 
        title="Teacher Workspace" 
        subtitle="Manage your classes and learner progress"
      >
        <TeacherDashboard />
        <AssetUnderMyCustody />
      </DashboardLayout>
    );
  }

  if (role === "accountant") {
    return (
      <DashboardLayout title="Finance Hub" subtitle="Alheib Financial Ecosystem & Procurement Control">
        <AccountantDashboard />
        <AssetUnderMyCustody />
      </DashboardLayout>
    );
  }

  if (role === "head_teacher") {
    return (
      <DashboardLayout title="Head Teacher Dashboard" subtitle="Academic oversight & school operations">
        <HeadTeacherDashboard />
        <AssetUnderMyCustody />
      </DashboardLayout>
    );
  }

  if (role === "head_of_internal") {
    return (
      <DashboardLayout
        title="Internal Affairs Dashboard"
        subtitle="Staff oversight, discipline & internal operations"
      >
        <HeadOfInternalDashboard />
      </DashboardLayout>
    );
  }

  if (role === "staff") {
    return (
      <DashboardLayout title="Staff Workspace" subtitle="Daily operations & support tasks">
        <StaffDashboard />
        <AssetUnderMyCustody />
      </DashboardLayout>
    );
  }

  if (role === "direct_manager") {
    return (
      <DashboardLayout
        title="Direct Manager"
        subtitle="Cross-department oversight & approvals"
      >
        <ManagerDashboard />
        <AssetUnderMyCustody />
      </DashboardLayout>
    );
  }

  if (role === "center_director") {
    return (
      <DashboardLayout
        title="Center Director"
        subtitle="Strategic oversight & executive command"
      >
        <DirectorDashboard />
        <AssetUnderMyCustody />
      </DashboardLayout>
    );
  }

  if (role === "orphan_supervisor") {
    return <Navigate to="/hostel" replace />;
  }

  const { data: siteSettings } = useSiteSettings();
  const { t } = useLanguage();
  const schoolName = siteSettings?.landing_hero?.school_name ?? t("Alheib Mixed Day & Boarding School");

  return (
    <DashboardLayout 
      title={t("Dashboard")} 
      subtitle={`${t("Welcome Back!")} ${activeTerm}, ${currentYear} - ${schoolName}`}
    >
      {/* Term Banner */}
      <div className="mb-4 lg:mb-6 rounded-xl border border-primary/20 bg-primary/5 p-3 lg:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="font-display text-sm lg:text-base font-semibold text-primary">{t("Uganda New Curriculum")}</p>
            <p className="text-xs lg:text-sm text-muted-foreground">{siteSettings?.landing_hero?.tagline ?? t("P1-P7 Competency-Based Education System")}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs lg:text-sm font-medium text-foreground">{activeTerm}, {currentYear}</p>
            <p className="text-xs text-muted-foreground">Week {currentWeek} of {totalWeeks}</p>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <QuickNavBar />

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Learners"
          value={totalLearners}
          change={`${totalLearners} active`}
          changeType="neutral"
          icon={Users}
          iconColor="primary"
          delay={0}
        />
        <StatCard
          title="Teachers"
          value={totalTeachers}
          change={totalTeachers > 0 ? "Active staff" : "No teachers yet"}
          changeType="neutral"
          icon={GraduationCap}
          iconColor="secondary"
          delay={100}
        />
        <StatCard
          title="Classes (P1-P7)"
          value={totalClasses}
          change={totalClasses > 0 ? "All active" : "No classes yet"}
          changeType="neutral"
          icon={BookOpen}
          iconColor="success"
          delay={200}
        />
        <StatCard
          title="Attendance Rate"
          value={attendanceRate != null ? `${attendanceRate}%` : "—"}
          change={
            attDelta != null
              ? `${attDelta >= 0 ? "+" : ""}${attDelta}% from last week`
              : "No data today"
          }
          changeType={attDelta != null ? (attDelta >= 0 ? "positive" : "negative") : "neutral"}
          icon={ClipboardCheck}
          iconColor="info"
          delay={300}
        />
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-4">
        {/* Left Stats Column (Operational Health) */}
        <div id="system-health-widget" className="space-y-6">
          <SystemHealthWidget />
          <DynamicAcademicProgress />
          <HealthStatusWidget />
          <DormitoryStatusWidget />
          <BoardingIslamicWidget />
        </div>

        {/* Center Main Column (Financial & Academic Oversight) */}
        <div id="financial-control-hub" className="lg:col-span-2 space-y-6">
          <RegistrationTrackerWidget />
          <FeeCollectionSummary />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ClassOverview />
            <RecentFeePayments />
          </div>
          <RecentActivity />
          <InventorySummaryWidget />
        </div>

        {/* Right Sidebar Column (Action & Monitoring) */}
        <div id="quick-actions-bar" className="space-y-6">
          <QuickActions />
          <DisciplineTrackerWidget />
          <OutstandingBalancesWidget />
          <UpcomingEvents />
          <AssetUnderMyCustody />
        </div>
      </div>
      

    </DashboardLayout>
  );
};

export default Index;
