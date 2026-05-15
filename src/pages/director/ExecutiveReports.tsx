import { FeaturePageShell } from "@/components/role/FeaturePageShell";
import { FileBarChart } from "lucide-react";
const ExecutiveReports = () => (
  <FeaturePageShell title="Executive Reports" subtitle="Strategic dashboards for the center director" icon={FileBarChart} badge="Director"
    features={["Term-over-term enrollment trends", "Revenue vs. budget", "Academic performance index", "Staff turnover & cost per learner", "EMIS / regulatory compliance status"]} />
);
export default ExecutiveReports;
