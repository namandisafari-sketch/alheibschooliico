// @ts-nocheck
import type { AppRole } from "@/hooks/useAuth";

export const HOME_PATH: Record<AppRole, string> = {
  admin: "/",
  teacher: "/teacher",
  parent: "/parent",
  staff: "/",
  security: "/security",
  accountant: "/accountant",
  head_teacher: "/headteacher",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrator",
  teacher: "Teacher",
  parent: "Parent / Guardian",
  staff: "School Support Staff",
  security: "Security Officer",
  accountant: "Bursar / Accountant",
  head_teacher: "Head Teacher",
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
  parent: ["view_own_attendance"],
  staff: ["view_finance", "request_leave", "request_advance", "write_letters", "view_own_attendance", "message_director"],
  security: ["view_finance", "request_leave", "view_own_attendance"],
  accountant: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director", "manage_fees"],
  head_teacher: ["view_finance", "request_leave", "write_letters", "view_own_attendance", "message_director", "approve_lessons", "issue_warnings", "edit_marks"],
};
