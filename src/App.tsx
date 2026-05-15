import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ScrollToTop from "@/components/common/ScrollToTop";
import Index from "./pages/Index";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Classes from "./pages/Classes";
import Attendance from "./pages/Attendance";
import Staff from "./pages/Staff";
import Auth from "./pages/Auth";
import ParentDashboard from "./pages/ParentDashboard";
import UserManagement from "./pages/UserManagement";
import MarksEntry from "./pages/MarksEntry";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import SiteSettings from "./pages/SiteSettings";
import Salary from "./pages/Salary";
import IDCards from "./pages/IDCards";
import FeeManagement from "./pages/FeeManagement";
import HeadTeacherHome from "./pages/headteacher/HeadTeacherHome";
import Schedule from "./pages/Schedule";
import Visitors from "./pages/Visitors";
import Inventory from "./pages/Inventory";
import InventoryTracking from "./pages/InventoryTracking";
import Calendar from "./pages/Calendar";
import HealthManagement from "./pages/HealthManagement";
import AccountSettings from "./pages/AccountSettings";
import Madrasa from "./pages/Madrasa";
import Hostel from "./pages/Hostel";
import Budget from "./pages/Budget";
import Homework from "./pages/Homework";
import StaffManagement from "./pages/StaffManagement";
import Discipline from "./pages/Discipline";
import AccountantAccounts from "./pages/accountant/Accounts";
import AccountantProcurement from "./pages/accountant/Procurement";
import AccountantPettyCash from "./pages/accountant/PettyCash";
import AccountantPayroll from "./pages/accountant/Payroll";
import AccountantAuditLog from "./pages/accountant/AuditLog";
import AccountantHome from "./pages/accountant/AccountantHome";
import AccountantReconciliation from "./pages/accountant/Reconciliation";
import AccountantExpenseApprovals from "./pages/accountant/ExpenseApprovals";
import AccountantTaxReports from "./pages/accountant/TaxReports";
import AccountantFeesTracking from "./pages/accountant/FeesTracking";
import AccountantFees from "./pages/FeeManagement";

// DOS Pages
import DosHome from "./pages/dos/DosHome";
import DosTimetable from "./pages/dos/Timetable";
import DosSyllabus from "./pages/dos/Syllabus";
import DosExams from "./pages/dos/Exams";
import DosAssignments from "./pages/dos/Assignments";

// Nurse Pages
import NurseHome from "./pages/nurse/NurseHome";
import NurseClinic from "./pages/nurse/Clinic";
import NurseMedication from "./pages/nurse/Medication";
import NurseIncidents from "./pages/nurse/Incidents";

// Store Pages
import StoreHome from "./pages/store/StoreHome";
import StoreReceiving from "./pages/store/Receiving";
import StoreLowStock from "./pages/store/LowStock";
import StoreSuppliers from "./pages/store/Suppliers";

// Gate Pages
import GateHome from "./pages/gate/GateHome";
import GateVehicles from "./pages/gate/VehicleLog";
import GateExitPasses from "./pages/gate/ExitPasses";
import GateHandover from "./pages/gate/Handover";

// Office Pages
import OfficeHome from "./pages/office/OfficeHome";
import OfficeDocuments from "./pages/office/Documents";
import OfficeComms from "./pages/office/Comms";

// Manager & Director Pages
import ManagerHome from "./pages/manager/ManagerHome";
import ManagerApprovals from "./pages/manager/Approvals";
import ManagerPerformance from "./pages/manager/Performance";
import DirectorHome from "./pages/director/DirectorHome";
import DirectorUsers from "./pages/director/UserManagement";
import DirectorReports from "./pages/director/ExecutiveReports";
import DirectorApprovals from "./pages/director/Approvals";

// Teacher Specific Pages
import TeacherHome from "./pages/teacher/TeacherHome";
import TeacherClasses from "./pages/teacher/MyClasses";
import TeacherPlanner from "./pages/teacher/LessonPlanner";
import TeacherGradebook from "./pages/teacher/Gradebook";
import TeacherParentChat from "./pages/teacher/ParentChat";
import TeacherInbox from "./pages/teacher/Inbox";
import TeacherFinance from "./pages/teacher/Finance";
import TeacherAttendance from "./pages/teacher/MyAttendance";
import TeacherRequests from "./pages/teacher/Requests";
import TeacherLetters from "./pages/teacher/Letters";

// Security Pages
import SecurityHome from "./pages/security/SecurityHome";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Parent Portal */}
            <Route
              path="/parent"
              element={
                <ProtectedRoute allowedRoles={["parent"]}>
                  <ParentDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Admin/Teacher/Staff Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "security", "head_teacher", "deputy_head_teacher", "accountant", "dos", "nurse", "storekeeper", "gateman", "office_manager", "direct_manager", "center_director"]}>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/headteacher"
              element={
                <ProtectedRoute allowedRoles={["admin", "head_teacher", "deputy_head_teacher"]}>
                  <HeadTeacherHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher"]}>
                  <Students />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers"
              element={
                <ProtectedRoute allowedRoles={["admin", "head_teacher", "deputy_head_teacher"]}>
                  <Teachers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={["admin", "head_teacher", "deputy_head_teacher"]}>
                  <Staff />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher"]}>
                  <Classes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher"]}>
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={["admin", "head_teacher", "deputy_head_teacher"]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marks"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher"]}>
                  <MarksEntry />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher"]}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={["admin", "head_teacher", "deputy_head_teacher"]}>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={["admin", "head_teacher", "deputy_head_teacher"]}>
                  <SiteSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/salary"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant", "head_teacher", "deputy_head_teacher"]}>
                  <Salary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/id-cards"
              element={
                <ProtectedRoute allowedRoles={["admin", "head_teacher", "deputy_head_teacher"]}>
                  <IDCards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff", "accountant", "head_teacher", "deputy_head_teacher"]}>
                  <FeeManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedule"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "security", "head_teacher"]}>
                  <Schedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/visitors"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff", "security", "head_teacher"]}>
                  <Visitors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/tracking"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff"]}>
                  <InventoryTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff", "security"]}>
                  <Inventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "security", "parent", "head_teacher", "accountant"]}>
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/health"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff"]}>
                  <HealthManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account-settings"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "security", "parent"]}>
                  <AccountSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/madrasa"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "head_teacher"]}>
                  <Madrasa />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hostel"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff", "head_teacher"]}>
                  <Hostel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/budget"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff", "accountant", "head_teacher"]}>
                  <Budget />
                </ProtectedRoute>
              }
            />
            <Route
              path="/homework"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher"]}>
                  <Homework />
                </ProtectedRoute>
              }
            />
            <Route
              path="/discipline"
              element={
                <ProtectedRoute allowedRoles={["admin", "head_teacher"]}>
                  <Discipline />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff-assignments"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <StaffManagement />
                </ProtectedRoute>
              }
            />

            {/* DOS Module Routes */}
            <Route
              path="/dos"
              element={
                <ProtectedRoute allowedRoles={["admin", "dos"]}>
                  <DosHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dos/timetable"
              element={
                <ProtectedRoute allowedRoles={["admin", "dos", "head_teacher", "deputy_head_teacher"]}>
                  <DosTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dos/syllabus"
              element={
                <ProtectedRoute allowedRoles={["admin", "dos", "head_teacher", "deputy_head_teacher"]}>
                  <DosSyllabus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dos/exams"
              element={
                <ProtectedRoute allowedRoles={["admin", "dos", "head_teacher", "deputy_head_teacher"]}>
                  <DosExams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dos/assignments"
              element={
                <ProtectedRoute allowedRoles={["admin", "dos", "head_teacher", "deputy_head_teacher"]}>
                  <DosAssignments />
                </ProtectedRoute>
              }
            />

            {/* Nurse Module Routes */}
            <Route
              path="/nurse"
              element={
                <ProtectedRoute allowedRoles={["admin", "nurse", "deputy_head_teacher"]}>
                  <NurseHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurse/clinic"
              element={
                <ProtectedRoute allowedRoles={["admin", "nurse", "deputy_head_teacher"]}>
                  <NurseClinic />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurse/medication"
              element={
                <ProtectedRoute allowedRoles={["admin", "nurse", "deputy_head_teacher"]}>
                  <NurseMedication />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurse/incidents"
              element={
                <ProtectedRoute allowedRoles={["admin", "nurse", "head_teacher", "deputy_head_teacher", "center_director"]}>
                  <NurseIncidents />
                </ProtectedRoute>
              }
            />

            {/* Store Module Routes */}
            <Route
              path="/store"
              element={
                <ProtectedRoute allowedRoles={["admin", "storekeeper"]}>
                  <StoreHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/store/receiving"
              element={
                <ProtectedRoute allowedRoles={["admin", "storekeeper"]}>
                  <StoreReceiving />
                </ProtectedRoute>
              }
            />
            <Route
              path="/store/low-stock"
              element={
                <ProtectedRoute allowedRoles={["admin", "storekeeper"]}>
                  <StoreLowStock />
                </ProtectedRoute>
              }
            />
            <Route
              path="/store/suppliers"
              element={
                <ProtectedRoute allowedRoles={["admin", "storekeeper", "accountant"]}>
                  <StoreSuppliers />
                </ProtectedRoute>
              }
            />

            {/* Gate Module Routes */}
            <Route
              path="/gate"
              element={
                <ProtectedRoute allowedRoles={["admin", "gateman", "security"]}>
                  <GateHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gate/vehicles"
              element={
                <ProtectedRoute allowedRoles={["admin", "gateman", "security"]}>
                  <GateVehicles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gate/exit-passes"
              element={
                <ProtectedRoute allowedRoles={["admin", "gateman", "security"]}>
                  <GateExitPasses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gate/handover"
              element={
                <ProtectedRoute allowedRoles={["admin", "gateman", "security"]}>
                  <GateHandover />
                </ProtectedRoute>
              }
            />

            {/* Office Module Routes */}
            <Route
              path="/office"
              element={
                <ProtectedRoute allowedRoles={["admin", "office_manager"]}>
                  <OfficeHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/office/documents"
              element={
                <ProtectedRoute allowedRoles={["admin", "office_manager"]}>
                  <OfficeDocuments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/office/comms"
              element={
                <ProtectedRoute allowedRoles={["admin", "office_manager"]}>
                  <OfficeComms />
                </ProtectedRoute>
              }
            />

            {/* Manager Module Routes */}
            <Route
              path="/manager"
              element={
                <ProtectedRoute allowedRoles={["admin", "direct_manager", "center_director"]}>
                  <ManagerHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/approvals"
              element={
                <ProtectedRoute allowedRoles={["admin", "direct_manager", "center_director"]}>
                  <ManagerApprovals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/performance"
              element={
                <ProtectedRoute allowedRoles={["admin", "direct_manager", "center_director"]}>
                  <ManagerPerformance />
                </ProtectedRoute>
              }
            />

            {/* Director Module Routes */}
            <Route
              path="/director"
              element={
                <ProtectedRoute allowedRoles={["admin", "center_director"]}>
                  <DirectorHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/director/users"
              element={
                <ProtectedRoute allowedRoles={["admin", "center_director"]}>
                  <DirectorUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/director/reports"
              element={
                <ProtectedRoute allowedRoles={["admin", "center_director"]}>
                  <DirectorReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/director/approvals"
              element={
                <ProtectedRoute allowedRoles={["admin", "center_director"]}>
                  <DirectorApprovals />
                </ProtectedRoute>
              }
            />

            {/* Teacher Specific Routes */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher"]}>
                  <TeacherHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/my-classes"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher"]}>
                  <TeacherClasses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/lesson-planner"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher"]}>
                  <TeacherPlanner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/gradebook"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher"]}>
                  <TeacherGradebook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/parent-chat"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher"]}>
                  <TeacherParentChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/inbox"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "head_teacher", "deputy_head_teacher"]}>
                  <TeacherInbox />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/finance"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "head_teacher", "deputy_head_teacher"]}>
                  <TeacherFinance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/my-attendance"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "head_teacher", "deputy_head_teacher"]}>
                  <TeacherAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/requests"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "head_teacher", "deputy_head_teacher"]}>
                  <TeacherRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/letters"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "head_teacher", "deputy_head_teacher"]}>
                  <TeacherLetters />
                </ProtectedRoute>
              }
            />

            {/* Security Module Routes */}
            <Route
              path="/security"
              element={
                <ProtectedRoute allowedRoles={["admin", "security", "gateman"]}>
                  <SecurityHome />
                </ProtectedRoute>
              }
            />

            {/* Accountant Module Routes */}
            <Route
              path="/accountant"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <AccountantHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accountant/accounts"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <AccountantAccounts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accountant/fees"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <AccountantFees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accountant/fees-tracking"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <AccountantFeesTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accountant/reconciliation"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <AccountantReconciliation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accountant/procurement"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant", "storekeeper"]}>
                  <AccountantProcurement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accountant/expense-approvals"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <AccountantExpenseApprovals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accountant/petty-cash"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <AccountantPettyCash />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accountant/payroll"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <AccountantPayroll />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accountant/tax-reports"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <AccountantTaxReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accountant/audit-log"
              element={
                <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                  <AccountantAuditLog />
                </ProtectedRoute>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
