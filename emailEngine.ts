import { createClient } from "@supabase/supabase-js";
import { sendEmail, queueEmail } from "./emailService";

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase credentials not available yet (env vars not loaded?)");
  }
  return createClient(url, key);
}

const RESEND_DOMAIN = "noreply@sised.sc.ug";
const RESEND_FROM = "Al-Heib School";

let queueInterval: ReturnType<typeof setInterval> | null = null;
let dailyReportCron: ReturnType<typeof setInterval> | null = null;

async function getAdminEmails(): Promise<string[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from("email_settings").select("notification_emails").eq("id", 1).single();
    if (data?.notification_emails && Array.isArray(data.notification_emails) && data.notification_emails.length > 0) {
      return data.notification_emails;
    }
  } catch {}
  try {
    const supabase = getSupabase();
    const { data: admins } = await supabase
      .from("profiles")
      .select("email")
      .in("role", ["admin", "director", "manager", "head_teacher"])
      .not("email", "is", null);
    if (admins) return admins.map((a: any) => a.email).filter(Boolean);
  } catch {}
  return [];
}

export async function processEmailQueue() {
  try {
    const supabase = getSupabase();
    const { data: queued, error } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "queued")
      .lte("process_after", new Date().toISOString())
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(20);

    if (error || !queued?.length) return;

    for (const item of queued) {
      await supabase.from("email_queue").update({ status: "processing" }).eq("id", item.id);

      const result = await sendEmail({
        to: item.recipient_email,
        toName: item.recipient_name || undefined,
        subject: item.subject,
        body: item.body,
      });

      const newStatus = result.success ? "sent" : "failed";
      await supabase
        .from("email_queue")
        .update({
          status: newStatus,
          error_message: result.success ? null : result.message,
          sent_at: result.success ? new Date().toISOString() : null,
        })
        .eq("id", item.id);
    }
  } catch (err) {
    console.error("Email queue processing error:", err);
  }
}

export async function sendEventNotification(
  eventType: string,
  title: string,
  summary: string,
  details?: string,
) {
  const adminEmails = await getAdminEmails();
  if (!adminEmails.length) return { success: false, message: "No admin emails configured" };

  const body = [
    summary,
    details ? `\n${details}` : "",
    ``,
    `Event: ${eventType}`,
    `Time: ${new Date().toLocaleString()}`,
  ].join("\n");

  const results: { email: string; success: boolean }[] = [];
  for (const email of adminEmails) {
    const result = await sendEmail({
      to: email,
      subject: `[${eventType}] ${title}`,
      body,
      referenceType: "notification_event",
      referenceId: eventType,
    });
    results.push({ email, success: result.success });
  }

  try {
    const supabase = getSupabase();
    await supabase.from("email_notification_events").insert({
      event_type: eventType,
      summary,
      recipients_sent: results.filter(r => r.success).length,
    });
  } catch {}

  return { success: true, results };
}

export async function notifyAttendanceRecorded(
  learnerName: string,
  className: string,
  date: string,
  status: string,
  guardianEmail?: string,
  guardianName?: string,
) {
  if (guardianEmail) {
    await sendEmail({
      to: guardianEmail,
      toName: guardianName,
      subject: `Attendance Update — ${learnerName}`,
      body: [
        `Dear ${guardianName || "Parent"},"`,
        ``,
        `This is an update regarding ${learnerName}'s attendance for ${date}.`,
        ``,
        `Status: ${status.toUpperCase()}`,
        `Class: ${className}`,
        ``,
        `If you have any concerns, please contact the school.`,
        ``,
        `Best regards,\nAl-Heib School Management`,
      ].join("\n"),
      referenceType: "attendance",
      referenceId: `${learnerName}-${date}`,
    });
  }

  await sendEventNotification(
    "attendance_recorded",
    `Attendance: ${learnerName}`,
    `${learnerName} (${className}) was marked ${status} on ${date}.`,
  );
}

export async function notifyGateCheckIn(
  visitorName: string,
  purpose: string,
  hostName: string,
  checkInTime: string,
) {
  await sendEventNotification(
    "gate_checkin",
    `Visitor Check-In: ${visitorName}`,
    `${visitorName} checked in at ${checkInTime}.`,
    `Purpose: ${purpose}\nHost: ${hostName}`,
  );
}

export async function notifyAppointmentCreated(
  appointment: {
    id?: string;
    visitor_name: string;
    visitor_phone?: string;
    visitor_email?: string;
    purpose: string;
    scheduled_for: string;
    location?: string;
    host_staff_name?: string;
  },
) {
  const scheduledDate = new Date(appointment.scheduled_for);
  const dateStr = scheduledDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const trackUrl = appointment.id ? `https://alheibschool.org/track-appointment?id=${appointment.id}` : "";
  const qrUrl = trackUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(trackUrl)}` : "";

  const isoDate = scheduledDate.toISOString().split("T")[0];
  const isoTime = scheduledDate.toTimeString().split(" ")[0];
  const googleCalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Appointment: ${appointment.purpose}`)}&dates=${isoDate.replace(/-/g, "")}T${isoTime.replace(/:/g, "")}00/${isoDate.replace(/-/g, "")}T${isoTime.replace(/:/g, "")}00&details=${encodeURIComponent(`Appointment with ${appointment.host_staff_name || "Al-Heib School"}\nPurpose: ${appointment.purpose}${appointment.location ? `\nLocation: ${appointment.location}` : ""}`)}&location=${encodeURIComponent(appointment.location || "Al-Heib School, Jinja, Uganda")}`;
  const mapsUrl = appointment.location ? `https://www.google.com/maps/search/${encodeURIComponent(appointment.location)}` : `https://www.google.com/maps/search/Al-Heib%20School%20Jinja%20Uganda`;

  if (appointment.visitor_email) {
    const details = [
      `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">Date</td><td style="padding:8px 0;font-weight:600;font-size:13px;border-bottom:1px solid #f3f4f6;">${dateStr}</td></tr>`,
      `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">Time</td><td style="padding:8px 0;font-weight:600;font-size:13px;border-bottom:1px solid #f3f4f6;">${timeStr}</td></tr>`,
      `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">Purpose</td><td style="padding:8px 0;font-weight:600;font-size:13px;border-bottom:1px solid #f3f4f6;">${appointment.purpose}</td></tr>`,
      appointment.location ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">Location</td><td style="padding:8px 0;font-weight:600;font-size:13px;border-bottom:1px solid #f3f4f6;">${appointment.location}</td></tr>` : "",
      appointment.host_staff_name ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">Host</td><td style="padding:8px 0;font-weight:600;font-size:13px;border-bottom:1px solid #f3f4f6;">${appointment.host_staff_name}</td></tr>` : "",
    ].filter(Boolean).join("\n");

    const qrHtml = qrUrl ? `
      <div style="text-align:center;margin:20px 0;">
        <img src="${qrUrl}" alt="Appointment QR Code" style="width:180px;height:180px;border-radius:12px;border:2px solid #e5e7eb;" />
        <p style="color:#9ca3af;font-size:11px;margin:6px 0 0 0;">Scan this code at the gate for faster check-in</p>
      </div>` : "";

    const quickActions = trackUrl ? `
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr>
          <td style="text-align:center;padding:4px;">
            <a href="${trackUrl}" style="display:inline-block;background:#1f2937;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">View Appointment</a>
          </td>
          <td style="text-align:center;padding:4px;">
            <a href="${googleCalUrl}" target="_blank" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">Add to Calendar</a>
          </td>
          <td style="text-align:center;padding:4px;">
            <a href="${mapsUrl}" target="_blank" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">Get Directions</a>
          </td>
        </tr>
      </table>` : "";

    const htmlBody = `
      <p style="color:#374151;line-height:1.8;font-size:15px;">Dear ${appointment.visitor_name},</p>
      <p style="color:#374151;line-height:1.8;font-size:15px;">Your appointment has been <strong style="color:#166534;">confirmed successfully</strong>. Please find the details below:</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f9fafb;border-radius:12px;padding:16px;">
        ${details}
      </table>
      ${qrHtml}
      ${quickActions}
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:20px 0;">
        <p style="color:#166534;font-size:14px;margin:0;"><strong>Important Reminders:</strong></p>
        <ul style="color:#166534;font-size:13px;margin:8px 0 0 0;padding-left:20px;">
          <li>Please arrive <strong>10 minutes early</strong> for gate processing</li>
          <li>Bring a valid <strong>photo ID</strong> for verification</li>
          <li>Report to the <strong>main gate</strong> and mention the host's name</li>
          ${appointment.location ? `<li>Proceed to <strong>${appointment.location}</strong> after check-in</li>` : ""}
        </ul>
      </div>
      <p style="color:#374151;line-height:1.8;font-size:15px;">If you need to reschedule or cancel, please contact the school office.</p>
      <p style="color:#374151;line-height:1.8;font-size:15px;">Best regards,<br/>Al-Heib School Management</p>
    `;

    const textBody = trackUrl
      ? `Dear ${appointment.visitor_name},\n\nYour appointment has been confirmed successfully.\n\nDate: ${dateStr}\nTime: ${timeStr}\nPurpose: ${appointment.purpose}${appointment.location ? `\nLocation: ${appointment.location}` : ""}${appointment.host_staff_name ? `\nHost: ${appointment.host_staff_name}` : ""}\n\nView your appointment: ${trackUrl}\n\nIMPORTANT REMINDERS:\n• Please arrive 10 minutes early for gate processing\n• Bring a valid photo ID for verification\n• Report to the main gate and mention the host's name\n\nIf you need to reschedule or cancel, please contact the school office.\n\nBest regards,\nAl-Heib School Management`
      : [
          `Dear ${appointment.visitor_name},`,
          ``,
          `Your appointment has been confirmed successfully.`,
          ``,
          `Date: ${dateStr}`,
          `Time: ${timeStr}`,
          `Purpose: ${appointment.purpose}`,
          appointment.location ? `Location: ${appointment.location}` : "",
          appointment.host_staff_name ? `Host: ${appointment.host_staff_name}` : "",
          ``,
          `IMPORTANT REMINDERS:`,
          `• Please arrive 10 minutes early for gate processing`,
          `• Bring a valid photo ID for verification`,
          `• Report to the main gate and mention the host's name`,
          ``,
          `If you need to reschedule or cancel, please contact the school office.`,
          ``,
          `Best regards,\nAl-Heib School Management`,
        ].filter(Boolean).join("\n");

    await sendEmail({
      to: appointment.visitor_email,
      toName: appointment.visitor_name,
      subject: `Appointment Confirmed — ${appointment.purpose} — Al-Heib School`,
      body: textBody,
      referenceType: "appointment",
      referenceId: appointment.visitor_name,
    });
  }

  await sendEventNotification(
    "appointment_created",
    `Appointment: ${appointment.visitor_name}`,
    `${appointment.visitor_name} has scheduled a visit for ${dateStr} at ${timeStr}.`,
    `Purpose: ${appointment.purpose}${appointment.host_staff_name ? `\nHost: ${appointment.host_staff_name}` : ""}`,
  );
}

export async function notifyRequestApproval(
  requestType: string,
  requestId: string,
  status: "approved" | "rejected",
  requesterEmail?: string,
  requesterName?: string,
  comments?: string,
) {
  if (requesterEmail) {
    await sendEmail({
      to: requesterEmail,
      toName: requesterName,
      subject: `[${status === "approved" ? "Approved" : "Rejected"}] ${requestType} Request`,
      body: [
        `Dear ${requesterName || "Staff Member"},`,
        ``,
        `Your ${requestType} request (${requestId.substring(0, 8)}) has been ${status}.`,
        comments ? `\nComments: ${comments}` : "",
        ``,
        `Please log in to the system for details.`,
        ``,
        `Best regards,\nAl-Heib School Management`,
      ].join("\n"),
      referenceType: requestType,
      referenceId: requestId,
    });
  }

  await sendEventNotification(
    "request_approval",
    `${status === "approved" ? "Approved" : "Rejected"}: ${requestType}`,
    `A ${requestType} request (${requestId.substring(0, 8)}) was ${status}.`,
  );
}

export async function notifyLessonPlanSubmitted(
  teacherName: string,
  planTitle: string,
  classSubject: string,
  planId: string,
) {
  await sendEventNotification(
    "lesson_plan_submitted",
    `Lesson Plan Submitted: ${planTitle}`,
    `${teacherName} submitted a lesson plan "${planTitle}" for ${classSubject}.`,
    `Plan ID: ${planId}\nPlease review in the Lesson Plan Tracking dashboard.`,
  );
}

export async function notifyLessonPlanReviewed(
  teacherEmail: string | undefined,
  teacherName: string | undefined,
  planTitle: string,
  status: "approved" | "rejected",
  dosComments?: string,
) {
  if (teacherEmail) {
    await sendEmail({
      to: teacherEmail,
      toName: teacherName,
      subject: `Lesson Plan ${status === "approved" ? "Approved" : "Needs Revision"} — ${planTitle}`,
      body: [
        `Dear ${teacherName || "Teacher"},`,
        ``,
        `Your lesson plan "${planTitle}" has been ${status}.`,
        status === "approved"
          ? `Great work! You can proceed to teach this lesson as planned.`
          : `Please review the feedback below and revise the plan.`,
        dosComments ? `\nDOS Comments:\n${dosComments}` : "",
        ``,
        `Please log in to the system for details.`,
        ``,
        `Best regards,\nAl-Heib School Management`,
      ].join("\n"),
      referenceType: "lesson_plan",
      referenceId: planTitle,
    });
  }

  await sendEventNotification(
    "lesson_plan_reviewed",
    `Lesson Plan ${status === "approved" ? "Approved" : "Rejected"}: ${planTitle}`,
    `${teacherName || "A teacher"}'s lesson plan "${planTitle}" was ${status}.`,
    dosComments ? `DOS Comments: ${dosComments}` : undefined,
  );
}

export async function notifySchemeSubmitted(
  teacherName: string,
  topic: string,
  classSubject: string,
) {
  await sendEventNotification(
    "scheme_of_work_submitted",
    `Scheme of Work Submitted: ${topic}`,
    `${teacherName} submitted a scheme of work entry "${topic}" for ${classSubject}.`,
  );
}

export async function sendDailyAdminReport() {
  let supabase;
  try {
    supabase = getSupabase();
  } catch {
    return { success: false, message: "Supabase not available" };
  }
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  try {
    const [{ count: attendanceToday }, { count: visitorsToday }, { count: appointmentsToday }, { count: pendingApprovals }] = await Promise.all([
      supabase.from("attendance").select("*", { count: "exact", head: true }).eq("date", today),
      supabase.from("visitor_visits").select("*", { count: "exact", head: true }).gte("check_in_at", today),
      supabase.from("appointments").select("*", { count: "exact", head: true }).eq("scheduled_for", today),
      supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    const adminEmails = await getAdminEmails();
    if (!adminEmails.length) return { success: false, message: "No admin emails" };

    const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const sections: string[] = [
      `<table style="width:100%;border-collapse:collapse;margin:16px 0;">`,
      `<tr style="background:#166534;color:#fff;">`,
      `<th style="padding:10px;text-align:left;font-size:14px;">Metric</th>`,
      `<th style="padding:10px;text-align:center;font-size:14px;">Count</th>`,
      `</tr>`,
      ...[
        ["Learners Marked (Today)", String(attendanceToday || 0)],
        ["Visitor Check-Ins (Today)", String(visitorsToday || 0)],
        ["Appointments (Today)", String(appointmentsToday || 0)],
        ["Pending Approvals", String(pendingApprovals || 0)],
      ].map(
        ([label, count]) =>
          `<tr style="border-bottom:1px solid #e5e7eb;">` +
          `<td style="padding:10px;font-size:13px;color:#374151;">${label}</td>` +
          `<td style="padding:10px;text-align:center;font-size:13px;font-weight:600;color:#166534;">${count}</td>` +
          `</tr>`,
      ),
      `</table>`,
    ];

    const body = [
      `Good day,`,
      ``,
      `Here is your daily activity summary for ${dateStr}.`,
      ``,
      sections.join("\n"),
      ``,
      `Please log in to the system for detailed reports.`,
      ``,
      `Best regards,\nAl-Heib School Management`,
    ].join("\n");

    for (const email of adminEmails) {
      await queueEmail({
        to: email,
        subject: `Daily Report — ${dateStr}`,
        body,
        referenceType: "daily_report",
        referenceId: today,
      });
    }

    try {
      await supabase.from("email_notification_events").insert({
        event_type: "daily_report",
        summary: `Daily report sent for ${today}`,
        recipients_sent: adminEmails.length,
      });
    } catch {}

    return { success: true, sentTo: adminEmails.length };
  } catch (err: any) {
    console.error("Daily report error:", err);
    return { success: false, message: err.message };
  }
}

export function initEmailEngine() {
  if (queueInterval) clearInterval(queueInterval);
  if (dailyReportCron) clearInterval(dailyReportCron);

  queueInterval = setInterval(processEmailQueue, 30_000);

  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
  let msUntilTarget = target.getTime() - now.getTime();
  if (msUntilTarget < 0) msUntilTarget += 86400000;

  setTimeout(() => {
    sendDailyAdminReport();
    dailyReportCron = setInterval(sendDailyAdminReport, 86400000);
  }, msUntilTarget);

  console.log(`Email engine initialized (queue poll: 30s, daily report: 18:00)`);
}

export function stopEmailEngine() {
  if (queueInterval) { clearInterval(queueInterval); queueInterval = null; }
  if (dailyReportCron) { clearInterval(dailyReportCron); dailyReportCron = null; }
  console.log("Email engine stopped");
}
