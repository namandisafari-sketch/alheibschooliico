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
  PenLine, 
  BookMarked, 
  Star,
  Settings 
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
      { icon: LayoutDashboard, labelKey: "Headteacher Hub", path: "/headteacher", roles: ["admin", "head_teacher", "deputy_head_teacher", "center_director", "director"] },
      { icon: Users, labelKey: "Governance Board", path: "/governance", roles: ["admin", "head_teacher", "deputy_head_teacher", "center_director", "director"] },
      { icon: FileText, labelKey: "Ministry & Compliance", path: "/ministry", roles: ["admin", "head_teacher", "deputy_head_teacher", "center_director", "director"] },
    ],
  },
  {
    titleKey: "Academic Control",
    items: [
      { icon: GraduationCap, labelKey: "DOS Command Center", path: "/dos", roles: ["admin", "dos", "deputy_head_teacher", "head_teacher", "center_director", "director"] },
      { icon: Users, labelKey: "Student Management", path: "/students", roles: ["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"] },
      { icon: GraduationCap, labelKey: "Staff & Teacher Hub", path: "/teachers", roles: ["admin", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"] },
      { icon: BookOpen, labelKey: "Academic Classes", path: "/classes", roles: ["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"] },
      { icon: Star, labelKey: "Madrasa & Islamic", path: "/madrasa", roles: ["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"] },
      { icon: BookMarked, labelKey: "Digital Homework", path: "/homework", roles: ["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"] },
      { icon: PenLine, labelKey: "Enter Marks", path: "/marks", roles: ["admin", "teacher", "dos", "head_teacher", "deputy_head_teacher"] },
      { icon: Calendar, labelKey: "School Timetables", path: "/dos/timetable", roles: ["admin", "dos", "head_teacher", "deputy_head_teacher", "teacher", "center_director", "director"] },
      { icon: BookMarked, labelKey: "Curriculum Coverage", path: "/dos/syllabus", roles: ["admin", "dos", "head_teacher", "deputy_head_teacher", "teacher", "center_director", "director"] },
      { icon: PenLine, labelKey: "Exams & Grading", path: "/dos/exams", roles: ["admin", "dos", "head_teacher", "deputy_head_teacher", "teacher", "center_director", "director"] },
      { icon: FileText, labelKey: "Marks & Reports", path: "/reports", roles: ["admin", "dos", "head_teacher", "deputy_head_teacher", "teacher", "center_director", "director"] },
      { icon: ClipboardCheck, labelKey: "Student Attendance", path: "/attendance", roles: ["admin", "teacher", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"] },
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
      { icon: ClipboardCheck, labelKey: "Finance Audit Log", path: "/accountant/audit-log", roles: ["admin", "accountant", "center_director", "director"] },
    ],
  },
  {
    titleKey: "Campus Operations",
    items: [
      { icon: Box, labelKey: "Store & Inventory Hub", path: "/store", roles: ["admin", "storekeeper", "deputy_head_teacher", "center_director", "director"] },
      { icon: Box, labelKey: "Resource Inventory", path: "/inventory", roles: ["admin", "storekeeper", "deputy_head_teacher", "office_manager", "center_director", "director"] },
      { icon: Shield, labelKey: "Gate Control Hub", path: "/gate", roles: ["admin", "security", "gateman", "center_director", "director"] },
      { icon: Shield, labelKey: "Security & Gates", path: "/visitors", roles: ["admin", "security", "gateman", "office_manager", "head_teacher", "center_director", "director"] },
      { icon: FileText, labelKey: "Office Management", path: "/office", roles: ["admin", "office_manager", "head_teacher", "center_director", "director"] },
      { icon: Stethoscope, labelKey: "Medical Infirmary Hub", path: "/nurse", roles: ["admin", "nurse", "deputy_head_teacher", "head_teacher", "center_director", "director"] },
      { icon: Stethoscope, labelKey: "Health Records", path: "/health", roles: ["admin", "nurse", "deputy_head_teacher", "head_teacher", "center_director", "director"] },
      { icon: Bed, labelKey: "Residential Hostels", path: "/hostel", roles: ["admin", "staff", "head_teacher", "deputy_head_teacher", "center_director", "director"] },
      { icon: Scale, labelKey: "Discipline & Conduct", path: "/discipline", roles: ["admin", "head_teacher", "deputy_head_teacher", "dos", "center_director", "director"] },
    ],
  },
  {
    titleKey: "Systems & HR",
    items: [
       { icon: HardHat, labelKey: "HR Management", path: "/staff", roles: ["admin", "head_teacher", "deputy_head_teacher", "office_manager", "center_director", "director"] },
       { icon: Layers, labelKey: "Staff Assignments", path: "/staff-assignments", roles: ["admin"], adminOnly: true },
       { icon: CreditCard, labelKey: "ID Card System", path: "/id-cards", roles: ["admin", "head_teacher", "center_director", "director"] },
       { icon: UserCog, labelKey: "Access Control", path: "/users", roles: ["admin", "head_teacher", "deputy_head_teacher", "center_director", "director"] },
       { icon: Shield, labelKey: "Compliance Portal", path: "/ministry", roles: ["admin", "head_teacher", "center_director", "director"] },
    ],
  },
  {
    titleKey: "Personal Workspace",
    items: [
      { icon: LayoutDashboard, labelKey: "My Dashboard", path: "/", roles: ["admin", "staff", "teacher", "dos", "nurse", "accountant", "security", "center_director", "director"] },
      { icon: Bell, labelKey: "Messaging", path: "/teacher/inbox" },
      { icon: Clock, labelKey: "Class Schedule", path: "/schedule", roles: ["admin", "teacher", "dos", "head_teacher"] },
      { icon: Calendar, labelKey: "Events Calendar", path: "/calendar" },
      { icon: Wallet, labelKey: "Personal Finance", path: "/teacher/finance" },
    ],
  },
];

export const bottomNavItems: NavItem[] = [
  { icon: UserCog, labelKey: "Account Settings", path: "/account-settings" },
  { icon: Bell, labelKey: "Notifications", path: "/notifications", roles: ["admin"] },
  { icon: Settings, labelKey: "System Settings", path: "/settings", roles: ["admin"] },
];
