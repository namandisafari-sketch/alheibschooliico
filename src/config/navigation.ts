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
      { icon: Shield, labelKey: "Director Dashboard", path: "/director", roles: ["admin", "center_director", "director"] },
      { icon: UserCog, labelKey: "Director Users", path: "/director/users", roles: ["admin", "center_director"] },
      { icon: BarChart3, labelKey: "Executive Reports", path: "/director/reports", roles: ["admin", "center_director"] },
      { icon: FileCheck, labelKey: "Approval Workflow", path: "/director/approvals", roles: ["admin", "center_director"] },
      { icon: LayoutDashboard, labelKey: "Headteacher Hub", path: "/headteacher", roles: ["admin", "head_teacher", "deputy_head_teacher", "center_director", "director"] },
      { icon: LayoutDashboard, labelKey: "Manager Command", path: "/manager", roles: ["admin", "direct_manager", "center_director"] },
      { icon: FileCheck, labelKey: "Manager Approvals", path: "/manager/approvals", roles: ["admin", "direct_manager", "center_director"] },
      { icon: Star, labelKey: "Staff Performance", path: "/manager/performance", roles: ["admin", "direct_manager", "center_director"] },
      { icon: Users, labelKey: "Governance Board", path: "/governance", roles: ["admin", "head_teacher", "deputy_head_teacher", "center_director", "director"] },
      { icon: FileText, labelKey: "Ministry & Compliance", path: "/ministry", roles: ["admin", "head_teacher", "deputy_head_teacher", "center_director", "director"] },
    ],
  },
  {
    titleKey: "Academic Control",
    items: [
      { icon: GraduationCap, labelKey: "DOS Command Center", path: "/dos", roles: ["admin", "dos", "deputy_head_teacher", "head_teacher", "center_director", "director"] },
      { icon: Users, labelKey: "Learner Management", path: "/students", roles: ["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director", "accountant", "nurse", "office_manager", "bursar", "staff", "secretary"] },
      { icon: GraduationCap, labelKey: "Staff & Teacher Hub", path: "/teachers", roles: ["admin", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"] },
      { icon: BookOpen, labelKey: "Academic Classes", path: "/classes", roles: ["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"] },
      { icon: Star, labelKey: "Madrasa & Islamic", path: "/madrasa", roles: ["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"] },
      { icon: BookMarked, labelKey: "Digital Homework", path: "/homework", roles: ["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"] },
      { icon: PenLine, labelKey: "Enter Marks", path: "/marks", roles: ["admin", "teacher", "dos", "head_teacher", "deputy_head_teacher"] },
      { icon: Calendar, labelKey: "School Timetables", path: "/dos/timetable", roles: ["admin", "dos", "head_teacher", "deputy_head_teacher", "teacher", "center_director", "director"] },
      { icon: BookMarked, labelKey: "Curriculum Coverage", path: "/dos/syllabus", roles: ["admin", "dos", "head_teacher", "deputy_head_teacher", "teacher", "center_director", "director"] },
      { icon: PenLine, labelKey: "Exams & Grading", path: "/dos/exams", roles: ["admin", "dos", "head_teacher", "deputy_head_teacher", "teacher", "center_director", "director"] },
      { icon: FileText, labelKey: "Marks & Reports", path: "/reports", roles: ["admin", "dos", "head_teacher", "deputy_head_teacher", "teacher", "center_director", "director"] },
      { icon: ClipboardCheck, labelKey: "Learner Attendance", path: "/attendance", roles: ["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"] },
      { icon: FileText, labelKey: "P7 Management", path: "/dos/p7-management", roles: ["admin", "dos", "head_teacher", "deputy_head_teacher"] },
      { icon: Clock, labelKey: "Lesson Tracking", path: "/dos/lesson-tracking", roles: ["admin", "dos", "head_teacher"] },
    ],
  },
  {
    titleKey: "Finance & Accounts",
    items: [
      { icon: Wallet, labelKey: "Finance Overview", path: "/accountant", roles: ["admin", "accountant", "deputy_head_teacher", "center_director", "director"] },
      { icon: Wallet, labelKey: "Financial Accounts", path: "/accountant/accounts", roles: ["admin", "accountant", "center_director", "director"] },
      { icon: Receipt, labelKey: "Fees & Collections", path: "/accountant/fees", roles: ["admin", "accountant", "deputy_head_teacher", "center_director", "director"] },
      { icon: ShoppingCart, labelKey: "Procurement & Store", path: "/accountant/procurement", roles: ["admin", "accountant", "center_director", "director"] },
      { icon: CreditCard, labelKey: "Payroll & Salaries", path: "/salary", roles: ["admin", "accountant", "head_teacher", "deputy_head_teacher", "center_director", "director"] },
      { icon: UserCheck, labelKey: "HR & Payroll", path: "/accountant/payroll", roles: ["admin", "accountant", "center_director", "director"] },
      { icon: BarChart3, labelKey: "Budget Planning", path: "/budget", roles: ["admin", "accountant", "head_teacher", "deputy_head_teacher", "center_director", "director"] },
      { icon: Receipt, labelKey: "Petty Cash Management", path: "/accountant/petty-cash", roles: ["admin", "accountant", "center_director", "director"] },
      { icon: Receipt, labelKey: "Fees Tracking", path: "/accountant/fees-tracking", roles: ["admin", "accountant"] },
      { icon: Scale, labelKey: "Reconciliation", path: "/accountant/reconciliation", roles: ["admin", "accountant"] },
      { icon: FileCheck, labelKey: "Expense Approvals", path: "/accountant/expense-approvals", roles: ["admin", "accountant", "center_director"] },
      { icon: FileText, labelKey: "Tax Reports", path: "/accountant/tax-reports", roles: ["admin", "accountant"] },
      { icon: ClipboardCheck, labelKey: "Finance Audit Log", path: "/accountant/audit-log", roles: ["admin", "accountant", "center_director", "director"] },
    ],
  },
  {
    titleKey: "Campus Operations",
    items: [
      { icon: Box, labelKey: "Store & Inventory Hub", path: "/store", roles: ["admin", "storekeeper", "deputy_head_teacher", "center_director", "director"] },
      { icon: Box, labelKey: "Resource Inventory", path: "/inventory", roles: ["admin", "storekeeper", "deputy_head_teacher", "office_manager", "center_director", "director", "secretary"] },
      { icon: Box, labelKey: "Receiving & Internal", path: "/store/receiving", roles: ["admin", "storekeeper"] },
      { icon: BarChart3, labelKey: "Stock Alerts", path: "/store/low-stock", roles: ["admin", "storekeeper", "accountant"] },
      { icon: Users, labelKey: "Supplier Database", path: "/store/suppliers", roles: ["admin", "storekeeper", "accountant"] },
      { icon: Shield, labelKey: "Gate Control Hub", path: "/gate", roles: ["admin", "security", "gateman", "center_director", "director"] },
      { icon: Clock, labelKey: "Vehicle Log", path: "/gate/vehicles", roles: ["admin", "security", "gateman"] },
      { icon: FileText, labelKey: "Exit Passes", path: "/gate/exit-passes", roles: ["admin", "security", "gateman"] },
      { icon: Users, labelKey: "Gate Handover", path: "/gate/handover", roles: ["admin", "security", "gateman"] },
      { icon: Shield, labelKey: "Security & Gates", path: "/visitors", roles: ["admin", "security", "gateman", "office_manager", "head_teacher", "center_director", "director", "secretary"] },
      { icon: FileText, labelKey: "Office Management", path: "/office", roles: ["admin", "office_manager", "head_teacher", "center_director", "director", "secretary"] },
      { icon: BookOpen, labelKey: "Official Documents", path: "/office/documents", roles: ["admin", "office_manager", "head_teacher", "secretary"] },
      { icon: Bell, labelKey: "Comms & Circulars", path: "/office/comms", roles: ["admin", "office_manager", "head_teacher", "secretary"] },
      { icon: Stethoscope, labelKey: "Medical Infirmary Hub", path: "/nurse", roles: ["admin", "nurse", "deputy_head_teacher", "head_teacher", "center_director", "director"] },
      { icon: Stethoscope, labelKey: "Health Records", path: "/health", roles: ["admin", "nurse", "deputy_head_teacher", "head_teacher", "center_director", "director"] },
      { icon: Bed, labelKey: "Residential Hostels", path: "/hostel", roles: ["admin", "staff", "head_teacher", "deputy_head_teacher", "center_director", "director"] },
      { icon: Scale, labelKey: "Discipline & Conduct", path: "/discipline", roles: ["admin", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"] },
      { icon: BookOpen, labelKey: "Library", path: "/library", roles: ["admin", "teacher", "staff", "head_teacher", "deputy_head_teacher", "secretary", "office_manager", "director", "center_director", "dos", "nurse", "accountant", "storekeeper"] },
    ],
  },
  {
    titleKey: "Systems & HR",
    items: [
        { icon: HardHat, labelKey: "HR Management", path: "/staff", roles: ["admin", "head_teacher", "deputy_head_teacher", "office_manager", "center_director", "director"] },
        { icon: ClipboardCheck, labelKey: "Staff Daily Attendance", path: "/staff-attendance", roles: ["admin", "head_teacher", "office_manager"] },
        { icon: Layers, labelKey: "Staff Assignments", path: "/staff-assignments", roles: ["admin"], adminOnly: true },
        { icon: Box, labelKey: "Asset & Item Tracking", path: "/inventory/tracking", roles: ["admin", "storekeeper", "office_manager"] },
       { icon: CreditCard, labelKey: "ID Card System", path: "/id-cards", roles: ["admin", "head_teacher", "center_director", "director", "secretary"] },
       { icon: UserCog, labelKey: "Access Control", path: "/users", roles: ["admin", "head_teacher", "deputy_head_teacher", "center_director", "director"] },
       { icon: Shield, labelKey: "Compliance Portal", path: "/ministry", roles: ["admin", "head_teacher", "center_director", "director"] },
    ],
  },
  {
    titleKey: "Personal Workspace",
    items: [
      { icon: LayoutDashboard, labelKey: "My Dashboard", path: "/", roles: ["admin", "staff", "teacher", "dos", "nurse", "accountant", "security", "center_director", "director", "secretary"] },
      { icon: Bell, labelKey: "Staff Messaging", path: "/teacher/inbox" },
      { icon: GraduationCap, labelKey: "My Managed Classes", path: "/teacher/my-classes", roles: ["admin", "teacher"] },
      { icon: PenLine, labelKey: "Lesson Planner", path: "/teacher/lesson-planner", roles: ["admin", "teacher"] },
      { icon: BookOpen, labelKey: "Learner Gradebook", path: "/teacher/gradebook", roles: ["admin", "teacher"] },
      { icon: Users, labelKey: "Parent Communication", path: "/teacher/parent-chat", roles: ["admin", "teacher"] },
      { icon: FileText, labelKey: "Staff Letters", path: "/teacher/letters", roles: ["admin", "teacher", "staff"] },
      { icon: ClipboardCheck, labelKey: "My Attendance", path: "/teacher/my-attendance", roles: ["admin", "teacher", "staff"] },
      { icon: FileCheck, labelKey: "My Leave Requests", path: "/teacher/requests", roles: ["admin", "teacher", "staff"] },
      { icon: Clock, labelKey: "Class Schedule", path: "/schedule", roles: ["admin", "teacher", "dos", "head_teacher"] },
      { icon: Calendar, labelKey: "Events Calendar", path: "/calendar" },
      { icon: Wallet, labelKey: "Personal Finance", path: "/teacher/finance" },
    ],
  },
];

export const bottomNavItems: NavItem[] = [
  { icon: UserCog, labelKey: "Account Settings", path: "/account-settings" },
  { icon: Bell, labelKey: "Notifications", path: "/notifications", roles: ["admin"] },
  { icon: Settings2, labelKey: "System Settings", path: "/settings", roles: ["admin", "dos"] },
];
