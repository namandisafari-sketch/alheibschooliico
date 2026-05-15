import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface RolePageProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
}

export const RolePage = ({ title, subtitle, badge, children }: RolePageProps) => (
  <DashboardLayout title={title} subtitle={subtitle}>
    {badge && (
      <div className="mb-4">
        <Badge variant="secondary" className="text-[10px] uppercase tracking-widest">
          {badge}
        </Badge>
      </div>
    )}
    {children}
  </DashboardLayout>
);

interface KpiProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "info";
}

const tones: Record<NonNullable<KpiProps["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-amber-500/10 text-amber-600",
  info: "bg-sky-500/10 text-sky-600",
};

export const Kpi = ({ label, value, hint, icon: Icon, tone = "primary" }: KpiProps) => (
  <Card className="border-2 border-slate-100 rounded-2xl">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={`h-10 w-10 shrink-0 rounded-xl ${tones[tone]} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export const Section = ({ title, description, children }: SectionProps) => (
  <Card className="border-2 border-slate-100 rounded-2xl">
    <CardHeader className="pb-3">
      <CardTitle className="text-base font-black">{title}</CardTitle>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);
