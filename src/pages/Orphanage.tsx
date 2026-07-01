// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrphanageStats, useOrphanLearners, useSponsors, useOrphanAlerts } from "@/hooks/useOrphanage";
import { DashboardTab } from "@/components/orphanage/DashboardTab";
import { SponsorsTab } from "@/components/orphanage/SponsorsTab";
import { EducationTab } from "@/components/orphanage/EducationTab";
import { LivingHealthcareTab } from "@/components/orphanage/LivingHealthcareTab";
import { ReligiousTab } from "@/components/orphanage/ReligiousTab";
import { SocialSportsTab } from "@/components/orphanage/SocialSportsTab";
import { SponsorReportsTab } from "@/components/orphanage/SponsorReportsTab";
import { AlertsTab } from "@/components/orphanage/AlertsTab";
import { AnalyticsTab } from "@/components/orphanage/AnalyticsTab";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LayoutDashboard, Heart, BookOpen, Users, Activity, FileText, Bell, BarChart3, GraduationCap } from "lucide-react";

const Orphanage = () => {
  const [tab, setTab] = useState("dashboard");
  const { data: stats } = useOrphanageStats();
  const tabs = [
    { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { value: "sponsors", label: "Sponsors", icon: Heart },
    { value: "education", label: "Education", icon: GraduationCap },
    { value: "healthcare", label: "Living & Healthcare", icon: Activity },
    { value: "religious", label: "Religious Development", icon: BookOpen },
    { value: "social", label: "Social & Sports", icon: Users },
    { value: "reports", label: "Sponsor Reports", icon: FileText },
    { value: "alerts", label: "Alerts", icon: Bell },
    { value: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <DashboardLayout
      title="Orphanage Services"
      subtitle="Comprehensive orphan care and sponsorship management"
    >
      <div className="space-y-6">
        <ErrorBoundary>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Orphans</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.totalOrphans}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Sponsors</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.totalSponsors}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Sponsorships</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.activeSponsorships}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unresolved Alerts</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-amber-600">{stats.unresolvedAlerts}</p></CardContent></Card>
            </div>
          )}
        </ErrorBoundary>

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
            {tabs.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <t.icon className="h-4 w-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard"><ErrorBoundary><DashboardTab /></ErrorBoundary></TabsContent>
          <TabsContent value="sponsors"><ErrorBoundary><SponsorsTab /></ErrorBoundary></TabsContent>
          <TabsContent value="education"><ErrorBoundary><EducationTab /></ErrorBoundary></TabsContent>
          <TabsContent value="healthcare"><ErrorBoundary><LivingHealthcareTab /></ErrorBoundary></TabsContent>
          <TabsContent value="religious"><ErrorBoundary><ReligiousTab /></ErrorBoundary></TabsContent>
          <TabsContent value="social"><ErrorBoundary><SocialSportsTab /></ErrorBoundary></TabsContent>
          <TabsContent value="reports"><ErrorBoundary><SponsorReportsTab /></ErrorBoundary></TabsContent>
          <TabsContent value="alerts"><ErrorBoundary><AlertsTab /></ErrorBoundary></TabsContent>
          <TabsContent value="analytics"><ErrorBoundary><AnalyticsTab /></ErrorBoundary></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};
export default Orphanage;
