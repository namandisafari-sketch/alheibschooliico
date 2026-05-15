import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, Sparkles } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  features: string[];
  children?: ReactNode;
}

export const FeaturePageShell = ({ title, subtitle, icon: Icon, badge, features, children }: Props) => (
  <DashboardLayout title={title} subtitle={subtitle}>
    <div className="space-y-6">
      <Card className="border-2 border-slate-100 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="h-7 w-7" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">{title}</h2>
                {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
              </div>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">What you can do here</p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f} className="flex gap-2 items-start text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      {children}
    </div>
  </DashboardLayout>
);
