// @ts-nocheck
import type { AppRole } from "@/hooks/useAuth";

export const HOME_PATH: Record<AppRole, string> = {
  admin: "/",
  teacher: "/teacher",
  dos: "/dos",
  parent: "/parent",
  staff: "/",
  security: "/security",
  accountant: "/accountant",
  head_teacher: "/headteacher",
  gateman: "/gate",
  nurse: "/nurse",
  matron: "/matron",
  cook: "/kitchen",
  secretary: "/office",
  office_manager: "/office",
  orphan_supervisor: "/hostel",
  center_director: "/director",
  direct_manager: "/manager",
  storekeeper: "/store",
  deputy_head_teacher: "/headteacher",
  store_manager: "/store",
  head_of_internal: "/internal",
  dos_theology: "/theology",
  theology_teacher: "/teacher/theology",
  tailor: "/tailor",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrator",
  teacher: "Teacher",
  dos: "Director of Studies",
  parent: "Parent / Guardian",
  staff: "School Support Staff",
  security: "Security Officer",
  accountant: "Bursar / Accountant",
  head_teacher: "Head Teacher",
  gateman: "Gate Security",
  nurse: "Nurse / Medical Staff",
  matron: "Matron / Dormitory Supervisor",
  cook: "Cook / Kitchen Staff",
  secretary: "Secretary",
  office_manager: "Office Manager",
  orphan_supervisor: "Orphanage Supervisor",
  center_director: "Center Director",
  direct_manager: "Direct Manager",
  storekeeper: "Storekeeper",
  deputy_head_teacher: "Deputy Head Teacher",
  store_manager: "Store Manager",
  head_of_internal: "Head of Internal",
  dos_theology: "Director of Studies (Theology)",
  theology_teacher: "Theology Teacher",
  tailor: "Tailor",
};

export const homeFor = (role: AppRole | null | undefined): string =>
  role ? HOME_PATH[role] ?? "/" : "/auth";

/** Permission keys the director can toggle per-user. */
export const PERMISSION_KEYS = [
  { key: "view_finance", label: "View own finance / payslips" },
  { key: "request_leave", label: "Submit leave requests" },
  { key: "request_advance", label: "Request salary advance" },
  { key: "write_letters", label: "Send official letters" },
  { key: "manage_assigned_classes", label: "Manage assigned classes" },
  { key: "view_own_attendance", label: "View own attendance log" },
  { key: "message_director", label: "Direct-message leadership" },
  { key: "approve_lessons", label: "Approve lesson plans" },
  { key: "issue_warnings", label: "Issue warnings to staff" },
  { key: "edit_marks", label: "Edit/finalize marks" },
  { key: "manage_fees", label: "Manage & track student fees" },
] as const;

export type PermissionKey = typeof PERMISSION_KEYS[number]["key"];

/** Default permission matrix per role, applied at user creation. */
export const DEFAULT_PERMISSIONS: Partial<Record<AppRole, PermissionKey[]>> = {
  admin: ["view_finance", "request_leave", "request_advance", "write_letters", "manage_assigned_classes", "view_own_attendance", "message_director", "approve_lessons", "issue_warnings", "edit_marks", "manage_fees"],
  teacher: ["view_finance", "request_leave", "request_advance", "write_letters", "manage_assigned_classes", "view_own_attendance", "message_director", "edit_marks"],
  dos: ["view_finance", "request_leave", "request_advance", "write_letters", "manage_assigned_classes", "view_own_attendance", "message_director", "approve_lessons", "issue_warnings", "edit_marks", "manage_fees"],
  parent: ["view_own_attendance"],
  staff: ["view_finance", "request_leave", "request_advance", "write_letters", "view_own_attendance", "message_director"],
  matron: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director"],
  cook: ["view_finance", "request_leave", "view_own_attendance"],
  orphan_supervisor: ["request_leave", "write_letters", "view_own_attendance", "message_director"],
  security: ["view_finance", "request_leave", "view_own_attendance"],
  gateman: ["view_finance", "request_leave", "view_own_attendance"],
  secretary: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director"],
  office_manager: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director"],
  accountant: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director", "manage_fees"],
  head_teacher: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director", "approve_lessons", "issue_warnings", "edit_marks"],
  center_director: ["view_finance", "request_leave", "request_advance", "write_letters", "manage_assigned_classes", "view_own_attendance", "message_director", "approve_lessons", "issue_warnings", "edit_marks", "manage_fees"],
  direct_manager: ["view_finance", "request_leave", "request_advance", "write_letters", "view_own_attendance", "message_director", "manage_fees"],
  storekeeper: ["view_finance", "request_leave", "view_own_attendance"],
  deputy_head_teacher: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director", "approve_lessons", "issue_warnings", "edit_marks"],
  store_manager: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director"],
  head_of_internal: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director", "approve_lessons", "issue_warnings", "edit_marks"],
  dos_theology: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director", "approve_lessons", "issue_warnings", "edit_marks"],
  theology_teacher: ["view_finance", "request_leave", "write_letters", "manage_assigned_classes", "view_own_attendance", "message_director", "edit_marks"],
  tailor: ["view_finance", "request_leave", "view_own_attendance"],
};
