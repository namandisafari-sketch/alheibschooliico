// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSponsorAnalytics } from "@/hooks/useOrphanage";
import { BarChart3, DollarSign, FileText, Users, TrendingUp, Activity } from "lucide-react";

export function AnalyticsTab() {
  const { data: analytics, isLoading } = useSponsorAnalytics();

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>;

  const stats = [
    { label: "Total Payments Received", value: analytics?.totalPaid ? `UGX ${analytics.totalPaid.toLocaleString()}` : "—", icon: DollarSign, color: "text-green-600" },
    { label: "Monthly Sponsorship Total", value: analytics?.monthlyTotal ? `UGX ${analytics.monthlyTotal.toLocaleString()}` : "—", icon: TrendingUp, color: "text-blue-600" },
    { label: "Active Sponsorships", value: analytics?.activeSponsorships || 0, icon: Users, color: "text-purple-600" },
    { label: "Reports Sent", value: analytics?.reportsSent || 0, icon: FileText, color: "text-amber-600" },
    { label: "Reports in Draft", value: analytics?.reportsDraft || 0, icon: FileText, color: "text-orange-600" },
    { label: "Total Payments Count", value: analytics?.totalPayments || 0, icon: Activity, color: "text-teal-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                <s.icon className={`h-4 w-4 ${s.color}`} /> {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold truncate" title={String(s.value)}>{String(s.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {analytics?.paymentsByMonth && Object.keys(analytics.paymentsByMonth).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Payment History by Month</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.paymentsByMonth).sort().map(([month, amount]) => (
                <div key={month} className="flex items-center gap-4">
                  <span className="text-sm w-20 font-medium">{month}</span>
                  <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/60 rounded"
                      style={{ width: `${Math.min(100, (Number(amount) / Math.max(...Object.values(analytics.paymentsByMonth).map(Number))) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-32 text-right">UGX {Number(amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Sponsorship Type Distribution</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Detailed breakdown available once more sponsorship data is recorded.</p>
        </CardContent>
      </Card>
    </div>
  );
}
