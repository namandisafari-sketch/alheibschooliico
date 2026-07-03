import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PrayerTimesProvider } from "@/contexts/PrayerTimesProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ScrollToTop from "@/components/common/ScrollToTop";
import { PageGuide } from "@/components/common/PageGuide";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RealtimeProvider } from "@/components/RealtimeProvider";
import React from "react";

class ChunkErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any; reloading: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, reloading: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    const msg = error?.message || "";
    if (
      msg.includes("Loading chunk") ||
      msg.includes("dynamically imported module") ||
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed")
    ) {
      this.setState({ reloading: true });
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center p-6 text-center bg-slate-50">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Something went wrong</h1>
          <pre className="text-sm text-red-600 bg-red-50 p-4 rounded max-w-lg mx-auto mb-6 overflow-auto text-left">
            {this.state.error?.message || "Unknown error"}
          </pre>
          <p className="text-slate-500 max-w-md mb-8">
            {this.state.reloading
              ? "A system update was detected. Reloading automatically..."
              : "The application encountered an unexpected error. This usually happens after a system update."}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-slate-900 hover:bg-slate-800 h-12 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-slate-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${this.state.reloading ? "animate-spin" : ""}`} />
            {this.state.reloading ? "Reloading..." : "Reload Application"}
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const OfficeComms = lazy(() => import("./pages/office/Comms"));
const TeacherParentChat = lazy(() => import("./pages/teacher/ParentChat"));
const HeadTeacherHome = lazy(() => import("./pages/headteacher/HeadTeacherHome"));
const TeacherHome = lazy(() => import("./pages/teacher/TeacherHome"));
const TheologyTeacherHome = lazy(() => import("./pages/teacher/TheologyTeacherHome"));
const AccountantHome = lazy(() => import("./pages/accountant/AccountantHome"));
const DosHome = lazy(() => import("./pages/dos/DosHome"));
const DosHostel = lazy(() => import("./pages/dos/Hostel"));
const NurseHome = lazy(() => import("./pages/nurse/NurseHome"));
const Students = lazy(() => import("./pages/Students"));
const Teachers = lazy(() => import("./pages/Teachers"));
const Classes = lazy(() => import("./pages/Classes"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Staff = lazy(() => import("./pages/Staff"));
const StaffAttendance = lazy(() => import("./pages/StaffAttendance"));
const DailyDutyForm = lazy(() => import("./pages/DailyDutyForm"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard"));
// Removed duplicate UserManagement import to eliminate duplicate pages
const MarksEntry = lazy(() => import("./pages/MarksEntry"));
const Reports = lazy(() => import("./pages/Reports"));
const Notifications = lazy(() => import("./pages/Notifications"));
const SiteSettings = lazy(() => import("./pages/SiteSettings"));
const HikvisionManagement = lazy(() => import("./pages/HikvisionManagement"));
const Salary = lazy(() => import("./pages/Salary"));
const IDCards = lazy(() => import("./pages/IDCards"));
const FeeManagement = lazy(() => import("./pages/FeeManagement"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Inventory = lazy(() => import("./pages/Inventory"));
const InventoryTracking = lazy(() => import("./pages/InventoryTracking"));
const Calendar = lazy(() => import("./pages/Calendar"));
const HealthManagement = lazy(() => import("./pages/HealthManagement"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const Madrasa = lazy(() => import("./pages/Madrasa"));
const Hostel = lazy(() => import("./pages/Hostel"));
const Orphanage = lazy(() => import("./pages/Orphanage"));
const Budget = lazy(() => import("./pages/Budget"));
const Homework = lazy(() => import("./pages/Homework"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const Discipline = lazy(() => import("./pages/Discipline"));
const Library = lazy(() => import("./pages/Library"));
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
const DosAnalysis = lazy(() => import("./pages/dos/Analysis"));
const DosSubjects = lazy(() => import("./pages/dos/Subjects"));
const DosCurriculumSetup = lazy(() => import("./pages/dos/CurriculumSetup"));
const DosSchemeOfWork = lazy(() => import("./pages/dos/SchemeOfWork"));
const DosSyllabusCoverage = lazy(() => import("./pages/dos/SyllabusCoverageDashboard"));
const DosSyllabusReports = lazy(() => import("./pages/dos/SyllabusReports"));
const DosClassTeachers = lazy(() => import("./pages/dos/ClassTeachers"));

// Nurse Pages
const NurseClinic = lazy(() => import("./pages/nurse/Clinic"));
const NurseMedication = lazy(() => import("./pages/nurse/Medication"));
const NurseIncidents = lazy(() => import("./pages/nurse/Incidents"));
const NursePrescriptions = lazy(() => import("./pages/nurse/Prescriptions"));
const NursePharmacyInventory = lazy(() => import("./pages/nurse/PharmacyInventory"));
const NursePharmacyReports = lazy(() => import("./pages/nurse/PharmacyReports"));

// Matron Pages
const MatronHome = lazy(() => import("./pages/matron/MatronHome"));
const MatronDormitories = lazy(() => import("./pages/matron/Dormitories"));
const MatronResidents = lazy(() => import("./pages/matron/Residents"));
const MatronEssentials = lazy(() => import("./pages/matron/Essentials"));
const MatronArrivals = lazy(() => import("./pages/matron/Arrivals"));
const MatronSupplies = lazy(() => import("./pages/matron/Supplies"));
const MatronWashing = lazy(() => import("./pages/matron/Washing"));

// Kitchen Pages
const KitchenHome = lazy(() => import("./pages/kitchen/KitchenHome"));
const MenuPlanner = lazy(() => import("./pages/kitchen/MenuPlanner"));
const KitchenStoreOrders = lazy(() => import("./pages/kitchen/StoreOrders"));
const KitchenInventory = lazy(() => import("./pages/kitchen/Inventory"));
const KitchenMeals = lazy(() => import("./pages/kitchen/Meals"));

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
const GateAppointmentVerification = lazy(() => import("./pages/gate/GateAppointmentVerification"));
const GateDeliveries = lazy(() => import("./pages/gate/Deliveries"));
const GateVerifyPass = lazy(() => import("./pages/gate/VerifyPass"));
const GateVerifyVisitor = lazy(() => import("./pages/gate/VerifyVisitor"));
const HostVerification = lazy(() => import("./pages/gate/HostVerification"));

// Office Pages
const OfficeHome = lazy(() => import("./pages/office/OfficeHome"));
const OfficeDocuments = lazy(() => import("./pages/office/Documents"));
const PrintOrders = lazy(() => import("./pages/office/PrintOrders"));
const OfficeAppointments = lazy(() => import("./pages/office/Appointments"));
const SecretaryDeliveries = lazy(() => import("./pages/secretary/Deliveries"));

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
const TeacherOnboarding = lazy(() => import("./pages/teacher/TeacherOnboarding"));
const TeacherClasses = lazy(() => import("./pages/teacher/MyClasses"));
const TeacherPlanner = lazy(() => import("./pages/teacher/LessonPlanner"));
const TeacherGradebook = lazy(() => import("./pages/teacher/Gradebook"));
const TeacherInbox = lazy(() => import("./pages/teacher/Inbox"));
const TeacherFinance = lazy(() => import("./pages/teacher/Finance"));
const TeacherAttendance = lazy(() => import("./pages/teacher/MyAttendance"));
const TeacherRequests = lazy(() => import("./pages/teacher/Requests"));
const TeacherLetters = lazy(() => import("./pages/teacher/Letters"));
const TeacherLessonRegister = lazy(() => import("./pages/teacher/LessonRegister"));
const TeacherMyStudents = lazy(() => import("./pages/teacher/MyStudents"));
const DosSubjectLoad = lazy(() => import("./pages/dos/SubjectLoad"));
const DosIPLE = lazy(() => import("./pages/dos/IPLE"));
const DosTheologyHomePage = lazy(() => import("./pages/dos/DosTheologyHome"));

// Security Pages
const SecurityHome = lazy(() => import("./pages/security/SecurityHome"));

// Tailor Pages
const TailorHome = lazy(() => import("./pages/tailor/TailorHome"));

const NotFound = lazy(() => import("./pages/NotFound"));

// Public Pages
const BookAppointment = lazy(() => import("./pages/public/BookAppointment"));
const TrackAppointment = lazy(() => import("./pages/public/TrackAppointment"));

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
        <PrayerTimesProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <RealtimeProvider />
              <ScrollToTop />
              <PageGuide />
              <ChunkErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/book-appointment" element={<BookAppointment />} />
            <Route path="/track-appointment" element={<TrackAppointment />} />
            
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
                <ProtectedRoute allowedRoles={["admin", "ict_admin", "teacher", "class_teacher", "subject_teacher", "staff", "security", "head_teacher", "deputy_head_teacher", "accountant", "bursar", "cashier", "dos", "islamic_coordinator", "sheikh", "discipline_master", "nurse", "matron", "librarian", "storekeeper", "store_manager", "gateman", "office_manager", "direct_manager", "center_director", "director", "board_director", "proprietor", "smc_member", "secretary", "student", "imam", "deo", "ministry_official", "uneb_official", "donor", "alumni", "dos_theology", "head_of_internal", "theology_teacher", "tailor"]}>
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
                <ProtectedRoute allowedRoles={["admin", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director", "accountant", "nurse", "office_manager", "bursar", "staff", "orphan_supervisor"]}>
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
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"]}>
                  <Classes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director", "orphan_supervisor"]}>
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
              path="/daily-duty"
              element={
                <ProtectedRoute allowedRoles={["admin", "head_teacher", "dos", "director"]}>
                  <DailyDutyForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <Navigate to="/director/users" replace />
              }
            />
            <Route
              path="/marks"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director", "dos_theology", "theology_teacher"]}>
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
              path="/hikvision"
              element={
                <ProtectedRoute allowedRoles={["admin", "head_teacher", "director"]}>
                  <HikvisionManagement />
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
              element={<Navigate to="/gate?tab=visitors" replace />}
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
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "security", "gateman", "parent", "head_teacher", "accountant", "dos", "deputy_head_teacher"]}>
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/health"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "nurse", "orphan_supervisor"]}>
                  <HealthManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account-settings"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "security", "parent", "orphan_supervisor"]}>
                  <AccountSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/madrasa"
              element={
                <ProtectedRoute allowedRoles={["admin", "ict_admin", "teacher", "class_teacher", "subject_teacher", "head_teacher", "deputy_head_teacher", "center_director", "director", "board_director", "proprietor", "islamic_coordinator", "sheikh", "imam", "staff", "orphan_supervisor", "dos_theology"]}>
                  <Madrasa />
                </ProtectedRoute>
              }
            />
            <Route
              path="/islamic"
              element={
                <ProtectedRoute allowedRoles={["admin", "ict_admin", "teacher", "class_teacher", "subject_teacher", "head_teacher", "deputy_head_teacher", "center_director", "director", "board_director", "proprietor", "islamic_coordinator", "sheikh", "imam", "staff", "orphan_supervisor", "dos_theology"]}>
                  <Madrasa />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hostel"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff", "head_teacher", "matron", "dos", "center_director", "director", "orphan_supervisor"]}>
                  <Hostel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orphanage"
              element={
                <ProtectedRoute allowedRoles={["admin", "head_teacher", "director", "orphan_supervisor"]}>
                  <Orphanage />
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

            {/* Theology DOS Home — distinct from secular DOS */}
            <Route
              path="/theology"
              element={
                <ProtectedRoute allowedRoles={["admin", "dos_theology"]}>
                  <DosTheologyHomePage />
                </ProtectedRoute>
              }
            />

            {/* Internal Affairs Home */}
            <Route
              path="/internal"
              element={
                <ProtectedRoute allowedRoles={["admin", "head_of_internal"]}>
                  <Index />
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
              path="/dos/hostel"
              element={
                <ProtectedRoute allowedRoles={["admin", "dos", "head_teacher", "deputy_head_teacher"]}>
                  <DosHostel />
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
              path="/dos/subject-load"
              element={
                <ProtectedRoute allowedRoles={["admin", "dos", "head_teacher", "deputy_head_teacher"]}>
                  <DosSubjectLoad />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dos/departments"
              element={
                <Navigate to="/dos/assignments" replace />
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
            <Route
              path="/dos/analysis"
              element={
                <ProtectedRoute allowedRoles={["admin", "dos", "head_teacher", "deputy_head_teacher"]}>
                  <DosAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dos/subjects"
              element={
                <ProtectedRoute allowedRoles={["admin", "dos", "head_teacher", "deputy_head_teacher"]}>
                  <DosSubjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dos/curriculum-setup"
              element={
                <ProtectedRoute allowedRoles={["admin", "dos", "head_teacher", "deputy_head_teacher"]}>
                  <DosCurriculumSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dos/scheme-of-work"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "dos", "head_teacher", "deputy_head_teacher"]}>
                  <DosSchemeOfWork />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dos/syllabus-coverage"
              element={
                <ProtectedRoute allowedRoles={["admin", "dos", "head_teacher", "deputy_head_teacher"]}>
                  <DosSyllabusCoverage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dos/syllabus-reports"
              element={
                <ProtectedRoute allowedRoles={["admin", "dos", "head_teacher", "deputy_head_teacher"]}>
                  <DosSyllabusReports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dos/class-teachers"
              element={
                <ProtectedRoute allowedRoles={["admin", "dos", "head_teacher", "deputy_head_teacher", "center_director", "director"]}>
                  <DosClassTeachers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dos/iple"
              element={
                <ProtectedRoute allowedRoles={["admin", "head_teacher", "deputy_head_teacher", "dos_theology", "center_director"]}>
                  <DosIPLE />
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
            <Route
              path="/nurse/prescriptions"
              element={
                <ProtectedRoute allowedRoles={["admin", "nurse", "head_teacher", "deputy_head_teacher"]}>
                  <NursePrescriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurse/pharmacy-inventory"
              element={
                <ProtectedRoute allowedRoles={["admin", "nurse", "head_teacher", "deputy_head_teacher"]}>
                  <NursePharmacyInventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurse/pharmacy-reports"
              element={
                <ProtectedRoute allowedRoles={["admin", "nurse", "head_teacher", "deputy_head_teacher"]}>
                  <NursePharmacyReports />
                </ProtectedRoute>
              }
            />

            {/* Matron Module Routes */}
            <Route
              path="/matron"
              element={
                <ProtectedRoute allowedRoles={["admin", "matron", "head_teacher", "deputy_head_teacher"]}>
                  <MatronHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matron/dormitories"
              element={
                <ProtectedRoute allowedRoles={["admin", "matron", "head_teacher", "deputy_head_teacher"]}>
                  <MatronDormitories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matron/residents"
              element={
                <ProtectedRoute allowedRoles={["admin", "matron", "head_teacher", "deputy_head_teacher"]}>
                  <MatronResidents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matron/essentials"
              element={
                <ProtectedRoute allowedRoles={["admin", "matron", "head_teacher", "deputy_head_teacher"]}>
                  <MatronEssentials />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matron/arrivals"
              element={
                <ProtectedRoute allowedRoles={["admin", "matron", "head_teacher", "deputy_head_teacher"]}>
                  <MatronArrivals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matron/supplies"
              element={
                <ProtectedRoute allowedRoles={["admin", "matron", "head_teacher", "deputy_head_teacher"]}>
                  <MatronSupplies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matron/washing"
              element={
                <ProtectedRoute allowedRoles={["admin", "matron", "head_teacher", "deputy_head_teacher"]}>
                  <MatronWashing />
                </ProtectedRoute>
              }
            />

            {/* Kitchen Module Routes */}
            <Route
              path="/kitchen"
              element={
                <ProtectedRoute allowedRoles={["admin", "cook", "storekeeper", "head_teacher", "deputy_head_teacher"]}>
                  <KitchenHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen/store-orders"
              element={
                <ProtectedRoute allowedRoles={["admin", "cook", "storekeeper", "head_teacher"]}>
                  <KitchenStoreOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen/inventory"
              element={
                <ProtectedRoute allowedRoles={["admin", "cook", "storekeeper", "head_teacher"]}>
                  <KitchenInventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen/meals"
              element={
                <ProtectedRoute allowedRoles={["admin", "cook", "head_teacher"]}>
                  <KitchenMeals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen/menu"
              element={
                <ProtectedRoute allowedRoles={["admin", "cook", "head_teacher"]}>
                  <MenuPlanner />
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
            <Route
              path="/gate/appointments"
              element={
                <ProtectedRoute allowedRoles={["admin", "gateman", "security"]}>
                  <GateAppointmentVerification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gate/deliveries"
              element={
                <ProtectedRoute allowedRoles={["admin", "gateman", "security"]}>
                  <GateDeliveries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gate/verify-pass"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff", "teacher", "head_teacher", "deputy_head_teacher", "gateman", "security"]}>
                  <GateVerifyPass />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gate/verify-visitor"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff", "teacher", "head_teacher", "deputy_head_teacher", "gateman", "security"]}>
                  <GateVerifyVisitor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/host-verify"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff", "teacher", "head_teacher", "deputy_head_teacher"]}>
                  <HostVerification />
                </ProtectedRoute>
              }
            />

            {/* Office Module Routes */}
            <Route
              path="/office"
              element={
                <ProtectedRoute allowedRoles={["admin", "secretary", "office_manager"]}>
                  <OfficeHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/office/documents"
              element={
                <ProtectedRoute allowedRoles={["admin", "secretary", "office_manager"]}>
                  <OfficeDocuments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/office/appointments"
              element={
                <ProtectedRoute allowedRoles={["admin", "secretary", "office_manager"]}>
                  <OfficeAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/office/print-orders"
              element={
                <ProtectedRoute allowedRoles={["admin", "secretary", "office_manager", "teacher", "staff", "head_teacher"]}>  
                  <PrintOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secretary/deliveries"
              element={
                <ProtectedRoute allowedRoles={["admin", "secretary", "office_manager", "staff"]}>
                  <SecretaryDeliveries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/office/comms"
              element={
                <ProtectedRoute allowedRoles={["admin", "secretary", "office_manager"]}>
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
                <ProtectedRoute allowedRoles={["admin", "center_director", "head_teacher", "deputy_head_teacher"]}>
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
              path="/teacher/onboarding"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherOnboarding />
                </ProtectedRoute>
              }
            />
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
              path="/teacher/my-students"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher"]}>
                  <TeacherMyStudents />
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
              path="/teacher/lesson-register"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "head_teacher", "deputy_head_teacher"]}>
                  <TeacherLessonRegister />
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
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "security", "gateman", "head_teacher", "deputy_head_teacher", "matron", "nurse", "cook", "storekeeper", "dos", "dos_theology", "theology_teacher", "head_of_internal", "accountant"]}>
                  <TeacherInbox />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/finance"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "security", "gateman", "head_teacher", "deputy_head_teacher", "matron", "nurse", "cook", "storekeeper", "dos", "dos_theology", "theology_teacher", "head_of_internal", "accountant"]}>
                  <TeacherFinance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/my-attendance"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "head_teacher", "deputy_head_teacher", "matron", "nurse", "cook", "security", "gateman", "storekeeper", "dos", "accountant"]}>
                  <TeacherAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/requests"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "head_teacher", "deputy_head_teacher", "matron", "nurse", "cook", "security", "gateman", "storekeeper", "dos", "accountant"]}>
                  <TeacherRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/letters"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "head_teacher", "deputy_head_teacher", "dos"]}>
                  <TeacherLetters />
                </ProtectedRoute>
              }
            />

            {/* Theology Teacher Routes */}
            <Route
              path="/teacher/theology"
              element={
                <ProtectedRoute allowedRoles={["admin", "theology_teacher", "dos_theology"]}>
                  <TheologyTeacherHome />
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

            {/* Tailor Module Routes */}
            <Route
              path="/tailor"
              element={
                <ProtectedRoute allowedRoles={["admin", "tailor", "center_director", "head_teacher"]}>
                  <TailorHome />
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
                <ProtectedRoute allowedRoles={["admin", "head_teacher", "deputy_head_teacher", "center_director", "direct_manager"]}>
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

            <Route
              path="/library"
              element={
                <ProtectedRoute allowedRoles={["admin", "teacher", "staff", "head_teacher", "deputy_head_teacher", "secretary", "office_manager", "director", "center_director", "dos", "nurse", "accountant", "storekeeper"]}>
                  <Library />
                </ProtectedRoute>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ChunkErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </PrayerTimesProvider>
    </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
