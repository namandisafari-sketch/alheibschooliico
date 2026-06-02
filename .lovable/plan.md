# Plan: Roles, Permissions & Director Control Center

Big request — breaking into 5 work streams. All work is gated behind the Director's User Management page.

## 1. New Roles
Add to `AppRole` union + `roleConfig.ts` + sidebar + routes:
- **`nurse`** — home `/nurse`. Pages: clinic visits log, medication register, incident reports, learner health alerts. (Reuses existing `useHealth` hook.)
- **`dos`** (Director of Studies) — home `/dos`. Pages: timetable oversight, syllabus tracker, exam scheduling, teacher class assignments, lesson-plan approvals, academic performance board.

DB: extend `app_role` enum migration (`alter type app_role add value 'nurse'; add value 'dos';`).

## 2. Granular Permissions System
New table `user_permissions` (user_id, permission_key, allowed bool, granted_by, granted_at).
Permission keys: `view_finance`, `request_leave`, `request_advance`, `write_letters`, `manage_assigned_classes`, `view_own_attendance`, `message_director`, `approve_lessons`, etc.

Helper:
- `public.has_permission(_user_id uuid, _key text) returns boolean` (security definer).
- React hook `usePermission(key)` + `<RequirePerm>` guard component.
- Default permission matrix per role (seeded on user creation).

## 3. Director's User Management Console (`/director/users`)
Single page where Director (and Admin) can:
- **Create any user** — pick role, set email + temp password, toggle each permission on/off, assign scope (school/district), assign classes (for teachers). Calls `create-admin` edge function (extended to accept permissions array + class assignments).
- **Edit live** — flip permission toggles per user; changes take effect on next request.
- **Disconnect / Kill-switch** — new `account_status` column on `profiles` (`active | suspended | disconnected`) + `suspension_reason` text + `suspended_until` timestamp. When suspended:
  - `AuthProvider` checks status on session load + via realtime subscription.
  - If `disconnected`, immediately `signOut()` and redirect to `/auth?blocked=1` showing reason.
  - Realtime channel `profile-status:{user_id}` so an active session is kicked the moment Director flips the switch.
- **Appeal flow** — suspended users see Appeal form on blocked screen → inserts into `account_appeals` table → Director sees badge + can reinstate.
- **Warnings** — `user_warnings` table (issued_by, severity, message, acknowledged). Shows as red banner at top of the warned user's app until acknowledged.

## 4. Teacher Self-Service Hub
Restrict teacher data scope:
- `/teacher/classes` — only classes where `class_teachers.teacher_id = auth.uid()` (RLS policy).
- `/teacher/finance` — own salary slips, deductions, YTD earnings (read-only on `salaries` filtered by user_id).
- `/teacher/requests` — new tables `leave_requests`, `advance_requests` (status: pending/approved/rejected, approver chain). Form to submit, list with status timeline.
- `/teacher/letters` — compose letter, pick recipient (Director / DOS / Manager / Office), rich textarea, stored in `staff_letters` table, recipient gets in-app notification.
- `/teacher/attendance` — own clock-in/out logs from `staff_attendance`, monthly rate %, late count.
- `/teacher/inbox` — realtime messages from Director (uses Supabase realtime on `direct_messages` table), warnings, appeal status.

## 5. Realtime Director→Staff Messaging
- Table `direct_messages` (from_user, to_user, body, urgent bool, read_at).
- Director composer in `/director/users` → "Message" button per user.
- Toast + bell badge for recipient via realtime subscription.

## Files to create/edit (high level)
**Migrations (1 file):**
- new enum values, `user_permissions`, `account_status` cols, `suspension_reason`, `account_appeals`, `user_warnings`, `leave_requests`, `advance_requests`, `staff_letters`, `direct_messages`, RLS policies, `has_permission` fn, default-permissions trigger.

**Edge functions:**
- extend `create-admin` to accept `permissions[]`, `class_ids[]`, `account_status`.

**Frontend:**
- `src/hooks/useAuth.ts` — add `accountStatus`, `permissions`, realtime status subscription, auto-signout on disconnect.
- `src/hooks/usePermission.ts` (new), `src/components/auth/RequirePerm.tsx` (new), `src/components/auth/BlockedScreen.tsx` (new).
- `src/lib/roleConfig.ts` — add `nurse`, `dos`.
- `src/pages/Auth.tsx` — show block reason + appeal form when `?blocked=1`.
- `src/pages/director/UserManagement.tsx` (new — replaces existing UserManagement for director scope) — full CRUD + permission toggles + kill switch + messenger.
- `src/pages/nurse/*` — `NurseHome`, `Clinic`, `Medication`, `Incidents` (4 files).
- `src/pages/dos/*` — `DosHome`, `Timetable`, `Syllabus`, `Exams`, `Assignments` (5 files).
- `src/pages/teacher/*` — `MyClasses`, `MyFinance`, `Requests`, `Letters`, `MyAttendance`, `Inbox` (6 files) + update `TeacherHome`.
- `src/components/layout/Sidebar.tsx` — add nurse + dos sections, expand teacher section.
- `src/App.tsx` — wire ~16 new routes.

## Scope check before I build

This is ~30 new files + 1 large migration + edge function changes. Two questions:

**A. Build all 5 streams in one pass, or phase it?**
Phasing would be: Phase 1 = new roles + kill-switch + permissions skeleton; Phase 2 = teacher self-service; Phase 3 = realtime messaging + appeals.

**B. Is Lovable Cloud already enabled and OK to add ~10 new tables + RLS in this single migration?**
