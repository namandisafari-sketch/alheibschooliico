import type { AppRole } from "@/hooks/useAuth";

export const HOME_PATH: Record<AppRole, string> = {
  admin: "/",
  head_teacher: "/headteacher",
  staff: "/",
  teacher: "/teacher",
  accountant: "/accountant",
  security: "/security",
  parent: "/parent",
  storekeeper: "/store",
  gateman: "/gate",
  office_manager: "/office",
  direct_manager: "/manager",
  center_director: "/director",
  nurse: "/nurse",
  dos: "/dos",
  deputy_head_teacher: "/headteacher",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrator",
  head_teacher: "Head Teacher",
  deputy_head_teacher: "Deputy Head Teacher",
  staff: "Staff",
  teacher: "Teacher",
  accountant: "Accountant",
  security: "Security",
  parent: "Parent",
  storekeeper: "Storekeeper",
  gateman: "Gate Officer",
  office_manager: "Office Manager",
  direct_manager: "Direct Manager",
  center_director: "Center Director",
  nurse: "School Nurse",
  dos: "Director of Studies",
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
  teacher: ["view_finance", "request_leave", "request_advance", "write_letters", "manage_assigned_classes", "view_own_attendance", "message_director", "edit_marks"],
  dos: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director", "approve_lessons", "issue_warnings"],
  nurse: ["view_finance", "request_leave", "request_advance", "write_letters", "view_own_attendance", "message_director"],
  accountant: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director", "manage_fees"],
  storekeeper: ["view_finance", "request_leave", "request_advance", "write_letters", "view_own_attendance"],
  gateman: ["view_finance", "request_leave", "write_letters", "view_own_attendance"],
  office_manager: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director", "issue_warnings"],
  direct_manager: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director", "issue_warnings"],
  head_teacher: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director", "approve_lessons", "issue_warnings"],
  deputy_head_teacher: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director", "approve_lessons"],
  staff: ["view_finance", "request_leave", "write_letters", "view_own_attendance"],
  security: ["view_finance", "request_leave", "view_own_attendance"],
};
