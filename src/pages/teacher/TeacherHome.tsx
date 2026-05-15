import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
const TeacherHome = () => (
  <DashboardLayout title="Teacher Workspace" subtitle="Manage your classes & learners">
    <TeacherDashboard />
  </DashboardLayout>
);
export default TeacherHome;
