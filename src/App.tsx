import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import OfficeComms from "./pages/office/Comms";
import TeacherParentChat from "./pages/teacher/ParentChat";
import HeadTeacherHome from "./pages/headteacher/HeadTeacherHome";
import TeacherHome from "./pages/teacher/TeacherHome";
import AccountantHome from "./pages/accountant/AccountantHome";
import DosHome from "./pages/dos/DosHome";
import NurseHome from "./pages/nurse/NurseHome";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ScrollToTop from "@/components/common/ScrollToTop";
import { PageGuide } from "@/components/common/PageGuide";
import { Loader2 } from "lucide-react";

// Lazy load other pages
const Students = lazy(() => import("./pages/Students"));
const Teachers = lazy(() => import("./pages/Teachers"));
const Classes = lazy(() => import("./pages/Classes"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Staff = lazy(() => import("./pages/Staff"));
const StaffAttendance = lazy(() => import("./pages/StaffAttendance"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const MarksEntry = lazy(() => import("./pages/MarksEntry"));
const Reports = lazy(() => import("./pages/Reports"));
const Notifications = lazy(() => import("./pages/Notifications"));
const SiteSettings = lazy(() => import("./pages/SiteSettings"));
const Salary = lazy(() => import("./pages/Salary"));
const IDCards = lazy(() => import("./pages/IDCards"));
const FeeManagement = lazy(() => import("./pages/FeeManagement"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Visitors = lazy(() => import("./pages/Visitors"));
const Inventory = lazy(() => import("./pages/Inventory"));
const InventoryTracking = lazy(() => import("./pages/InventoryTracking"));
const Calendar = lazy(() => import("./pages/Calendar"));
const HealthManagement = lazy(() => import("./pages/HealthManagement"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const Madrasa = lazy(() => import("./pages/Madrasa"));
const Hostel = lazy(() => import("./pages/Hostel"));
const Budget = lazy(() => import("./pages/Budget"));
const Homework = lazy(() => import("./pages/Homework"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const Discipline = lazy(() => import("./pages/Discipline"));
const AccountantAccounts = lazy(() => import("./pages/accountant/Accounts"));
const AccountantProcurement = lazy(() => import("./pages/accountant/Procurement"));
const AccountantPettyCash = lazy(() => import("./pages/accountant/PettyCash"));
const AccountantPayroll = lazy(() => import("./pages/accountant/Payroll"));
const AccountantAuditLog = lazy(() => import("./pages/accountant/AuditLog"));
const AccountantReconciliation = lazy(() => import("./pages/accountant/Reconciliation"));
const AccountantExpenseApprovals = lazy(() => import("./pages/accountant/ExpenseApprovals"));
const AccountantTaxReports = lazy(() => import("./pages/accountant/TaxReports"));
const AccountantFeesTracking = lazy(() => import("./pages/accountant/FeesTracking"));
const AccountantFees = lazy(() => import("./pages/FeeManagement"));

// DOS Pages
const DosTimetable = lazy(() => import("./pages/dos/Timetable"));
const DosSyllabus = lazy(() => import("./pages/dos/Syllabus"));
const DosExams = lazy(() => import("./pages/dos/Exams"));
const DosAssignments = lazy(() => import("./pages/dos/Assignments"));
const DosLessonTracking = lazy(() => import("./pages/dos/LessonTracking"));
const P7Mgt = lazy(() => import("./pages/dos/P7Mgt"));

// Nurse Pages
const NurseClinic = lazy(() => import("./pages/nurse/Clinic"));
const NurseMedication = lazy(() => import("./pages/nurse/Medication"));
const NurseIncidents = lazy(() => import("./pages/nurse/Incidents"));

// Store Pages
const StoreHome = lazy(() => import("./pages/store/StoreHome"));
const StoreReceiving = lazy(() => import("./pages/store/Receiving"));
const StoreLowStock = lazy(() => import("./pages/store/LowStock"));
const StoreSuppliers = lazy(() => import("./pages/store/Suppliers"));

// Gate Pages
const GateHome = lazy(() => import("./pages/gate/GateHome"));
const GateVehicles = lazy(() => import("./pages/gate/VehicleLog"));
const GateExitPasses = lazy(() => import("./pages/gate/ExitPasses"));
const GateHandover = lazy(() => import("./pages/gate/Handover"));

// Office Pages
const OfficeHome = lazy(() => import("./pages/office/OfficeHome"));
const OfficeDocuments = lazy(() => import("./pages/office/Documents"));

// Manager & Director Pages
const ManagerHome = lazy(() => import("./pages/manager/ManagerHome"));
const ManagerApprovals = lazy(() => import("./pages/manager/Approvals"));
const ManagerPerformance = lazy(() => import("./pages/manager/Performance"));
const DirectorHome = lazy(() => import("./pages/director/DirectorHome"));
const DirectorUsers = lazy(() => import("./pages/director/UserManagement"));
const DirectorReports = lazy(() => import("./pages/director/ExecutiveReports"));
const DirectorApprovals = lazy(() => import("./pages/director/Approvals"));
const Governance = lazy(() => import("./pages/Governance"));
const Ministry = lazy(() => import("./pages/Ministry"));

// Teacher Specific Pages
const TeacherClasses = lazy(() => import("./pages/teacher/MyClasses"));
const TeacherPlanner = lazy(() => import("./pages/teacher/LessonPlanner"));
const TeacherGradebook = lazy(() => import("./pages/teacher/Gradebook"));
const TeacherInbox = lazy(() => import("./pages/teacher/Inbox"));
const TeacherFinance = lazy(() => import("./pages/teacher/Finance"));
const TeacherAttendance = lazy(() => import("./pages/teacher/MyAttendance"));
const TeacherRequests = lazy(() => import("./pages/teacher/Requests"));
const TeacherLetters = lazy(() => import("./pages/teacher/Letters"));

// Security Pages
const SecurityHome = lazy(() => import("./pages/security/SecurityHome"));

const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <PageGuide />
            <Suspense fallback={<PageLoader />}>
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
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director", "accountant", "nurse", "office_manager", "bursar", "staff"]}>
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
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"]}>
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff-attendance"
              element={
                <ProtectedRoute allowedRoles={["admin", "head_teacher", "deputy_head_teacher", "dos"]}>
                  <StaffAttendance />
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
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"]}>
                  <MarksEntry />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"]}>
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
              path="/dos/p7-management"
              element={
                <ProtectedRoute allowedRoles={["admin", "dos", "head_teacher", "deputy_head_teacher"]}>
                  <P7Mgt />
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
            <Route
              path="/dos/lesson-tracking"
              element={
                <ProtectedRoute allowedRoles={["admin", "dos", "head_teacher", "deputy_head_teacher"]}>
                  <DosLessonTracking />
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

            <Route
              path="/governance"
              element={
                <ProtectedRoute allowedRoles={["admin", "head_teacher", "deputy_head_teacher", "center_director"]}>
                  <Governance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ministry"
              element={
                <ProtectedRoute allowedRoles={["admin", "head_teacher", "deputy_head_teacher", "center_director"]}>
                  <Ministry />
                </ProtectedRoute>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
