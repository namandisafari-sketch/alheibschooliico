import { FeaturePageShell } from "@/components/role/FeaturePageShell";
import { BarChart3 } from "lucide-react";
const Performance = () => (
  <FeaturePageShell title="Staff Performance" subtitle="Scorecards across teaching & operations" icon={BarChart3} badge="Manager"
    features={["Attendance reliability per staff", "Syllabus coverage rate per teacher", "Parent feedback score", "Disciplinary cases handled", "Quarterly review export"]} />
);
export default Performance;
