import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  ClipboardCheck, 
  Bell, 
  Shield, 
  Box, 
  Stethoscope, 
  Bed, 
  Scale, 
  Wallet, 
  ShoppingCart, 
  Receipt, 
  UserCheck, 
  BarChart3, 
  HardHat, 
  Layers, 
  UserCog, 
  CreditCard, 
  Clock, 
  FileText, 
  FileCheck,
  PenLine, 
  BookMarked, 
  Star,
  Settings2 
} from "lucide-react";
import { AppRole } from "@/hooks/useAuth";

export interface NavItem {
  icon: any;
  labelKey: string;
  path: string;
  roles?: AppRole[];
  adminOnly?: boolean;
}

export interface NavSection {
  titleKey: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    titleKey: "Executive & Governance",
    items: [
      { icon: Shield, labelKey: "Director Dashboard", path: "/director", roles: ["admin"] },
      { icon: UserCog, labelKey: "Director Users", path: "/director/users", roles: ["admin"] },
      { icon: BarChart3, labelKey: "Executive Reports", path: "/director/reports", roles: ["admin"] },
      { icon: FileCheck, labelKey: "Approval Workflow", path: "/director/approvals", roles: ["admin"] },
      { icon: LayoutDashboard, labelKey: "Headteacher Hub", path: "/headteacher", roles: ["admin", "head_teacher"] },
      { icon: LayoutDashboard, labelKey: "Manager Command", path: "/manager", roles: ["admin"] },
      { icon: FileCheck, labelKey: "Manager Approvals", path: "/manager/approvals", roles: ["admin"] },
      { icon: Star, labelKey: "Staff Performance", path: "/manager/performance", roles: ["admin"] },
      { icon: Users, labelKey: "Governance Board", path: "/governance", roles: ["admin", "head_teacher"] },
      { icon: FileText, labelKey: "Ministry & Compliance", path: "/ministry", roles: ["admin", "head_teacher"] },
    ],
  },
  {
    titleKey: "Academic Control",
    items: [
      { icon: GraduationCap, labelKey: "DOS Command Center", path: "/dos", roles: ["admin", "head_teacher"] },
      { icon: Users, labelKey: "Learner Management", path: "/students", roles: ["admin", "teacher", "head_teacher", "accountant", "staff"] },
      { icon: GraduationCap, labelKey: "Staff & Teacher Hub", path: "/teachers", roles: ["admin", "head_teacher"] },
      { icon: BookOpen, labelKey: "Academic Classes", path: "/classes", roles: ["admin", "teacher", "head_teacher"] },
      { icon: Star, labelKey: "Madrasa & Islamic", path: "/madrasa", roles: ["admin", "teacher", "head_teacher"] },
      { icon: BookMarked, labelKey: "Digital Homework", path: "/homework", roles: ["admin", "teacher", "head_teacher"] },
      { icon: PenLine, labelKey: "Enter Marks", path: "/marks", roles: ["admin", "teacher", "head_teacher"] },
      { icon: Calendar, labelKey: "School Timetables", path: "/dos/timetable", roles: ["admin", "head_teacher", "teacher"] },
      { icon: BookMarked, labelKey: "Curriculum Coverage", path: "/dos/syllabus", roles: ["admin", "head_teacher", "teacher"] },
      { icon: PenLine, labelKey: "Exams & Grading", path: "/dos/exams", roles: ["admin", "head_teacher", "teacher"] },
      { icon: FileText, labelKey: "Marks & Reports", path: "/reports", roles: ["admin", "head_teacher", "teacher"] },
      { icon: ClipboardCheck, labelKey: "Learner Attendance", path: "/attendance", roles: ["admin", "teacher", "head_teacher"] },
      { icon: FileText, labelKey: "P7 Management", path: "/dos/p7-management", roles: ["admin", "head_teacher"] },
      { icon: Clock, labelKey: "Lesson Tracking", path: "/dos/lesson-tracking", roles: ["admin", "head_teacher"] },
    ],
  },
  {
    titleKey: "Finance & Accounts",
    items: [
      { icon: Wallet, labelKey: "Finance Overview", path: "/accountant", roles: ["admin", "accountant", "head_teacher"] },
      { icon: Wallet, labelKey: "Financial Accounts", path: "/accountant/accounts", roles: ["admin", "accountant"] },
      { icon: Receipt, labelKey: "Fees & Collections", path: "/accountant/fees", roles: ["admin", "accountant", "head_teacher"] },
      { icon: ShoppingCart, labelKey: "Procurement & Store", path: "/accountant/procurement", roles: ["admin", "accountant"] },
      { icon: CreditCard, labelKey: "Payroll & Salaries", path: "/salary", roles: ["admin", "accountant", "head_teacher"] },
      { icon: UserCheck, labelKey: "HR & Payroll", path: "/accountant/payroll", roles: ["admin", "accountant"] },
      { icon: BarChart3, labelKey: "Budget Planning", path: "/budget", roles: ["admin", "accountant", "head_teacher"] },
      { icon: Receipt, labelKey: "Petty Cash Management", path: "/accountant/petty-cash", roles: ["admin", "accountant"] },
      { icon: Receipt, labelKey: "Fees Tracking", path: "/accountant/fees-tracking", roles: ["admin", "accountant"] },
      { icon: Scale, labelKey: "Reconciliation", path: "/accountant/reconciliation", roles: ["admin", "accountant"] },
      { icon: FileCheck, labelKey: "Expense Approvals", path: "/accountant/expense-approvals", roles: ["admin", "accountant"] },
      { icon: FileText, labelKey: "Tax Reports", path: "/accountant/tax-reports", roles: ["admin", "accountant"] },
      { icon: ClipboardCheck, labelKey: "Finance Audit Log", path: "/accountant/audit-log", roles: ["admin", "accountant"] },
    ],
  },
  {
    titleKey: "Campus Operations",
    items: [
      { icon: Box, labelKey: "Store & Inventory Hub", path: "/store", roles: ["admin", "staff", "head_teacher"] },
      { icon: Box, labelKey: "Resource Inventory", path: "/inventory", roles: ["admin", "staff", "head_teacher"] },
      { icon: Box, labelKey: "Receiving & Internal", path: "/store/receiving", roles: ["admin", "staff"] },
      { icon: BarChart3, labelKey: "Stock Alerts", path: "/store/low-stock", roles: ["admin", "staff", "accountant"] },
      { icon: Users, labelKey: "Supplier Database", path: "/store/suppliers", roles: ["admin", "staff", "accountant"] },
      { icon: Shield, labelKey: "Gate Control Hub", path: "/gate", roles: ["admin", "security"] },
      { icon: Clock, labelKey: "Vehicle Log", path: "/gate/vehicles", roles: ["admin", "security"] },
      { icon: FileText, labelKey: "Exit Passes", path: "/gate/exit-passes", roles: ["admin", "security"] },
      { icon: Users, labelKey: "Gate Handover", path: "/gate/handover", roles: ["admin", "security"] },
      { icon: Shield, labelKey: "Security & Gates", path: "/visitors", roles: ["admin", "security", "staff"] },
      { icon: FileText, labelKey: "Office Management", path: "/office", roles: ["admin", "head_teacher", "staff"] },
      { icon: BookOpen, labelKey: "Official Documents", path: "/office/documents", roles: ["admin", "head_teacher", "staff"] },
      { icon: Bell, labelKey: "Comms & Circulars", path: "/office/comms", roles: ["admin", "head_teacher", "staff"] },
      { icon: Stethoscope, labelKey: "Medical Infirmary Hub", path: "/nurse", roles: ["admin", "head_teacher", "staff"] },
      { icon: Stethoscope, labelKey: "Health Records", path: "/health", roles: ["admin", "head_teacher", "staff"] },
      { icon: Bed, labelKey: "Residential Hostels", path: "/hostel", roles: ["admin", "staff", "head_teacher", "matron", "dos", "center_director", "director"] },
      { icon: Scale, labelKey: "Discipline & Conduct", path: "/discipline", roles: ["admin", "head_teacher"] },
      { icon: BookOpen, labelKey: "Library", path: "/library", roles: ["admin", "teacher", "staff", "head_teacher", "accountant"] },
    ],
  },
  {
    titleKey: "Systems & HR",
    items: [
        { icon: HardHat, labelKey: "HR Management", path: "/staff", roles: ["admin", "head_teacher", "staff"] },
        { icon: ClipboardCheck, labelKey: "Staff Daily Attendance", path: "/staff-attendance", roles: ["admin", "head_teacher"] },
        { icon: Layers, labelKey: "Staff Assignments", path: "/staff-assignments", roles: ["admin"], adminOnly: true },
        { icon: Box, labelKey: "Asset & Item Tracking", path: "/inventory/tracking", roles: ["admin", "staff"] },
        { icon: CreditCard, labelKey: "ID Card System", path: "/id-cards", roles: ["admin", "head_teacher", "staff"] },
        { icon: UserCog, labelKey: "Access Control", path: "/director/users", roles: ["admin", "head_teacher"] },
        { icon: Shield, labelKey: "Compliance Portal", path: "/ministry", roles: ["admin", "head_teacher"] },
    ],
  },
  {
    titleKey: "Personal Workspace",
    items: [
      { icon: LayoutDashboard, labelKey: "My Dashboard", path: "/", roles: ["admin", "staff", "teacher", "security", "parent", "accountant", "head_teacher"] },
      { icon: Bell, labelKey: "Staff Messaging", path: "/teacher/inbox" },
      { icon: GraduationCap, labelKey: "My Managed Classes", path: "/teacher/my-classes", roles: ["admin", "teacher"] },
      { icon: PenLine, labelKey: "Lesson Planner", path: "/teacher/lesson-planner", roles: ["admin", "teacher"] },
      { icon: BookOpen, labelKey: "Learner Gradebook", path: "/teacher/gradebook", roles: ["admin", "teacher"] },
      { icon: Users, labelKey: "Parent Communication", path: "/teacher/parent-chat", roles: ["admin", "teacher"] },
      { icon: FileText, labelKey: "Staff Letters", path: "/teacher/letters", roles: ["admin", "teacher", "staff"] },
      { icon: ClipboardCheck, labelKey: "My Attendance", path: "/teacher/my-attendance", roles: ["admin", "teacher", "staff"] },
      { icon: FileCheck, labelKey: "My Leave Requests", path: "/teacher/requests", roles: ["admin", "teacher", "staff"] },
      { icon: Clock, labelKey: "Class Schedule", path: "/schedule", roles: ["admin", "teacher", "head_teacher"] },
      { icon: Calendar, labelKey: "Events Calendar", path: "/calendar" },
      { icon: Wallet, labelKey: "Personal Finance", path: "/teacher/finance" },
    ],
  },
];

export const bottomNavItems: NavItem[] = [
  { icon: UserCog, labelKey: "Account Settings", path: "/account-settings" },
  { icon: Bell, labelKey: "Notifications", path: "/notifications", roles: ["admin"] },
  { icon: Settings2, labelKey: "System Settings", path: "/settings", roles: ["admin", "head_teacher"] },
];
