import { createClient } from "@supabase/supabase-js";
import { sendWhatsApp, sendWhatsAppImage, sendWhatsAppButtons, type WhatsAppButton } from "./whatsappService";
import { sendEmail } from "./emailService";
import { generateNotificationImage, type TemplateType, type NotificationMood } from "./whatsappTemplates";
import {
  notifyAttendanceRecorded as emailNotifyAttendance,
  notifyGateCheckIn as emailNotifyGateCheckIn,
  notifyAppointmentCreated as emailNotifyAppointment,
  notifyRequestApproval as emailNotifyRequestApproval,
  notifyLessonPlanSubmitted as emailNotifyLessonPlanSubmitted,
  notifyLessonPlanReviewed as emailNotifyLessonPlanReviewed,
  notifySchemeSubmitted as emailNotifySchemeSubmitted,
} from "./emailEngine";

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase credentials not available");
  return createClient(url, key);
}

async function logNotification(params: {
  channel: "whatsapp" | "sms";
  recipient: string;
  eventType: string;
  summary: string;
  status: "sent" | "failed";
  errorMessage?: string;
}) {
  try {
    const supabase = getSupabase();
    await supabase.from("notification_logs").insert({
      recipient_phone: params.recipient,
      channel: params.channel,
      message_content: params.summary,
      status: params.status,
      error_message: params.errorMessage || null,
      created_at: new Date().toISOString(),
    });
  } catch {}
}

export async function sendSms(to: string, text: string): Promise<{ success: boolean; message: string }> {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME;
  if (!apiKey || !username) {
    return { success: false, message: "SMS not configured" };
  }
  try {
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("to", to.replace(/[^0-9]/g, ""));
    params.append("message", text);
    const from = process.env.AFRICASTALKING_SENDER_ID;
    if (from) params.append("from", from);
    const res = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json", apiKey },
      body: params.toString(),
    });
    const data = await res.json();
    const ok = res.ok && data.SMSMessageData?.Recipients?.some((r: any) => r.status === "Success" || r.status === "Pending");
    return { success: !!ok, message: ok ? "SMS sent" : "SMS failed" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

async function sendWa(phone: string, text: string) {
  const result = await sendWhatsApp(phone, text);
  await logNotification({
    channel: "whatsapp", recipient: phone,
    eventType: "auto", summary: text.substring(0, 100),
    status: result.success ? "sent" : "failed",
    errorMessage: result.success ? undefined : result.message,
  });
  return result;
}

async function sendWaImage(
  phone: string,
  templateType: TemplateType,
  data: { [key: string]: any },
  caption?: string,
) {
  try {
    const b64 = await generateNotificationImage(templateType, data);
    const result = await sendWhatsAppImage(phone, b64, caption);
    await logNotification({
      channel: "whatsapp", recipient: phone,
      eventType: "image", summary: caption || templateType,
      status: result.success ? "sent" : "failed",
      errorMessage: result.success ? undefined : result.message,
    });
    return result;
  } catch (err: any) {
    const result = { success: false, message: err.message };
    await logNotification({
      channel: "whatsapp", recipient: phone,
      eventType: "image", summary: templateType,
      status: "failed",
      errorMessage: err.message,
    });
    return result;
  }
}

function generateShortCode(id: string): string {
  const clean = id.replace(/[^a-f0-9]/gi, "");
  if (clean.length >= 6) return clean.slice(-6).toUpperCase();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = clean.toUpperCase();
  while (code.length < 6) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function sendSm(phone: string, text: string) {
  const result = await sendSms(phone, text);
  await logNotification({
    channel: "sms", recipient: phone,
    eventType: "auto", summary: text.substring(0, 100),
    status: result.success ? "sent" : "failed",
    errorMessage: result.success ? undefined : result.message,
  });
  return result;
}

// =========================================================================
// Event-specific notification functions (multi-channel)
// =========================================================================

export async function notifyLessonPlanSubmitted(
  teacherName: string,
  planTitle: string,
  classSubject: string,
  planId: string,
  teacherPhone?: string,
  dosPhones?: string[],
) {
  await emailNotifyLessonPlanSubmitted(teacherName, planTitle, classSubject, planId);

  if (teacherPhone) {
    await sendWaImage(teacherPhone, "generic", {
      mood: "success",
      message: `تم تقديم خطة الدرس: ${planTitle}`,
      messageEn: `Lesson Plan Submitted: ${planTitle}`,
      guardianName: teacherName,
      details: [
        { label: "المادة/Subject", value: classSubject },
      ],
    }, `✅ Lesson Plan Submitted: ${planTitle}`);
    await sendSm(teacherPhone, `Your lesson plan "${planTitle}" was submitted successfully. Al-Heib School`);
  }

  if (dosPhones?.length) {
    for (const phone of dosPhones) {
      if (phone) {
        await sendWaImage(phone, "generic", {
          mood: "info",
          message: `تقديم خطة درس جديد`,
          messageEn: `New Lesson Plan Submitted`,
          details: [
            { label: "المعلم/Teacher", value: teacherName },
            { label: "الخطة/Plan", value: planTitle },
            { label: "المادة/Subject", value: classSubject },
          ],
        }, `📋 New Lesson Plan: ${teacherName}`);
        await sendSm(phone, `New lesson plan from ${teacherName}: ${planTitle} (${classSubject}). Review now.`);
      }
    }
  }
}

export async function notifyLessonPlanReviewed(
  teacherEmail: string | undefined,
  teacherName: string | undefined,
  planTitle: string,
  status: "approved" | "rejected",
  dosComments?: string,
  teacherPhone?: string,
  lang?: "ar" | "en",
) {
  await emailNotifyLessonPlanReviewed(teacherEmail, teacherName, planTitle, status, dosComments);

  if (teacherPhone) {
    const mood: NotificationMood = status === "approved" ? "success" : "error";
    const actionAr = status === "approved" ? "تمت الموافقة" : "بحاجة لمراجعة";
    const actionEn = status === "approved" ? "Approved" : "Needs Revision";

    await sendWaImage(teacherPhone, "generic", {
      mood,
      lang,
      message: `خطة الدرس: ${planTitle}`,
      messageEn: `Lesson Plan: ${planTitle}`,
      guardianName: teacherName,
      details: [
        { label: lang === "en" ? "Status" : "الحالة", value: lang === "en" ? actionEn : actionAr },
        ...(dosComments ? [{ label: lang === "en" ? "Comments" : "ملاحظات", value: dosComments }] : []),
      ],
    }, `📋 ${actionEn}: ${planTitle}`);
    await sendSm(teacherPhone, `Lesson plan "${planTitle}" was ${status}.${dosComments ? " " + dosComments.substring(0, 60) : ""}`);
  }
}

export async function notifySchemeSubmitted(
  teacherName: string,
  topic: string,
  classSubject: string,
  teacherPhone?: string,
  dosPhones?: string[],
) {
  await emailNotifySchemeSubmitted(teacherName, topic, classSubject);

  if (teacherPhone) {
    await sendWaImage(teacherPhone, "generic", {
      mood: "success",
      message: `تم تقديم خطة العمل: ${topic}`,
      messageEn: `Scheme of Work Submitted: ${topic}`,
      guardianName: teacherName,
      details: [
        { label: "المادة/Subject", value: classSubject },
      ],
    }, `✅ Scheme Submitted: ${topic}`);
    await sendSm(teacherPhone, `Scheme of Work "${topic}" submitted for ${classSubject}. Al-Heib School`);
  }

  if (dosPhones?.length) {
    for (const phone of dosPhones) {
      if (phone) {
        await sendWaImage(phone, "generic", {
          mood: "info",
          message: `تقديم خطة عمل جديد`,
          messageEn: `New Scheme of Work Submitted`,
          details: [
            { label: "المعلم/Teacher", value: teacherName },
            { label: "الموضوع/Topic", value: topic },
            { label: "المادة/Subject", value: classSubject },
          ],
        }, `📋 New Scheme: ${teacherName}`);
      }
    }
  }
}

export async function notifyAttendanceRecorded(
  learnerName: string,
  className: string,
  date: string,
  status: string,
  guardianEmail?: string,
  guardianName?: string,
  guardianPhone?: string,
  lang?: "ar" | "en",
) {
  await emailNotifyAttendance(learnerName, className, date, status, guardianEmail, guardianName);

  if (guardianPhone) {
    const mood: NotificationMood = status === "present" ? "success" : status === "absent" ? "error" : "warning";
    const statusAr = status === "present" ? "حاضر" : status === "absent" ? "غائب" : status === "late" ? "متأخر" : status;
    const statusEn = status.charAt(0).toUpperCase() + status.slice(1);

    await sendWaImage(guardianPhone, "attendance", {
      mood,
      lang,
      studentName: learnerName,
      className,
      date,
      guardianName,
      status: statusAr,
      statusEn: `Attendance: ${statusEn}`,
    }, lang === "en" ? `📋 Attendance - ${learnerName}` : `📋 تقرير حضور - ${learnerName}`);

    const attButtons: WhatsAppButton[] = [
      { id: "report_" + learnerName.replace(/\s/g, "_").substring(0, 10), displayText: "📊 View Report" },
      { id: "contact_teacher", displayText: "👨‍🏫 Contact Teacher" },
    ];
    if (status === "absent") {
      attButtons.push({ id: "excuse", displayText: "📝 Submit Excuse" });
    }
    await sendWhatsAppButtons(
      guardianPhone,
      status === "present" ? "✅ Present" : status === "absent" ? "❌ Absent" : "⚠️ " + statusEn,
      `${learnerName} • ${className} • ${date}`,
      attButtons,
    );

    await sendSm(guardianPhone, `Attendance: ${learnerName} was ${status} on ${date} (${className}). Al-Heib School`);
  }
}

export async function notifyGateCheckIn(
  visitorName: string,
  purpose: string,
  hostName: string,
  checkInTime: string,
  securityPhone?: string,
  hostPhone?: string,
) {
  await emailNotifyGateCheckIn(visitorName, purpose, hostName, checkInTime);
  const d = new Date(checkInTime);
  const dateStr = d.toLocaleDateString();
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (securityPhone) {
    await sendWaImage(securityPhone, "appointment", {
      mood: "info",
      visitorName,
      purpose,
      hostName,
      date: dateStr,
      time: timeStr,
      message: "🚪 Gate Check-In / تسجيل دخول",
    }, `🚪 Gate Check-In: ${visitorName}`);
  }
  if (hostPhone) {
    await sendWaImage(hostPhone, "appointment", {
      mood: "success",
      visitorName,
      purpose,
      hostName,
      date: dateStr,
      time: timeStr,
      message: "Your guest has arrived / وصل ضيفك",
    }, `🚪 Guest Arrived: ${visitorName}`);
    await sendSm(hostPhone, `Your visitor ${visitorName} checked in at ${timeStr}. Al-Heib School`);
  }
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
  adminPhones?: string[],
) {
  await emailNotifyAppointment(appointment);
  const d = new Date(appointment.scheduled_for);
  const dateStr = d.toLocaleDateString();
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const trackUrl = appointment.id ? `https://alheibschool.org/track-appointment?id=${appointment.id}` : "";
  const appId = appointment.id || appointment.visitor_name;
  const shortCode = generateShortCode(appId);

  if (appointment.visitor_phone) {
    await sendWaImage(appointment.visitor_phone, "appointment", {
      mood: "success",
      visitorName: appointment.visitor_name,
      purpose: appointment.purpose,
      hostName: appointment.host_staff_name,
      location: appointment.location,
      date: dateStr,
      time: timeStr,
      appointmentId: shortCode,
      message: "✅ Appointment Confirmed / تم تأكيد الموعد",
    }, `📅 Appointment: ${appointment.visitor_name}`);

    // Try interactive buttons (may not deliver outside 24h window)
    await sendWhatsAppButtons(
      appointment.visitor_phone,
      "Appointment Confirmed",
      `Hi ${appointment.visitor_name}, your appointment has been confirmed. What would you like to do?`,
      [
        { id: "view_" + shortCode, displayText: "📋 View Details" },
        { id: "call_school", displayText: "📞 Call School" },
        { id: "rate_" + shortCode, displayText: "⭐ Rate Service" },
      ],
    );

    // Text fallback (always delivered)
    await sendWa(appointment.visitor_phone,
      `📅 Appointment Confirmed 🆔 ${shortCode}\n\n` +
      `📋 View: ${trackUrl || `https://alheibschool.org/track?code=${shortCode}`}\n` +
      `📞 School: +256706176631\n` +
      `⭐ Rate: https://alheibschool.org/rate/${shortCode}\n\n` +
      `Present your ID at the gate.`
    );
  }

  if (adminPhones?.length) {
    for (const phone of adminPhones) {
      if (phone) {
        await sendWaImage(phone, "appointment", {
          mood: "info",
          visitorName: appointment.visitor_name,
          purpose: appointment.purpose,
          hostName: appointment.host_staff_name,
          date: dateStr,
          time: timeStr,
          appointmentId: appId,
          message: "📅 New Appointment / موعد جديد",
        }, `📅 New Appointment: ${appointment.visitor_name}`);

        const adminButtons: WhatsAppButton[] = [
          { id: "approve_" + appId.substring(0, 6), displayText: "✅ Approve" },
          { id: "reschedule_" + appId.substring(0, 6), displayText: "🔄 Reschedule" },
          { id: "cancel_" + appId.substring(0, 6), displayText: "❌ Cancel" },
        ];
        await sendWhatsAppButtons(
          phone,
          "New Appointment",
          `${appointment.visitor_name} - ${appointment.purpose}\n${dateStr} ${timeStr}`,
          adminButtons,
        );
      }
    }
  }
}

export async function notifyAppointmentStatusChanged(
  appointment: {
    id?: string;
    visitor_name: string;
    visitor_phone?: string;
    visitor_email?: string;
    purpose: string;
    scheduled_for: string;
    host_name?: string;
    location?: string;
  },
  newStatus: string,
  changedBy?: string,
) {
  const d = new Date(appointment.scheduled_for);
  const dateStr = d.toLocaleDateString();
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const statusMood: Record<string, NotificationMood> = {
    approved: "success",
    cancelled: "error",
    checked_in: "info",
    completed: "success",
    no_show: "warning",
  };
  const mood = statusMood[newStatus] || "info";

  const statusMessages: Record<string, string> = {
    approved: "✅ Approved / تمت الموافقة",
    cancelled: "❌ Cancelled / تم الإلغاء",
    checked_in: "🚪 Checked In / تم الدخول",
    completed: "✓ Completed / مكتمل",
    no_show: "⚠️ No Show / لم يحضر",
  };
  const msg = statusMessages[newStatus] || newStatus;

  await sendEmail({
    to: appointment.visitor_email || "",
    toName: appointment.visitor_name,
    subject: `${msg} — ${appointment.purpose}`,
    body: [
      `Dear ${appointment.visitor_name},`,
      `Your appointment has been updated.`,
      `Appointment: ${appointment.purpose}`,
      `Date: ${dateStr} ${timeStr}`,
      `Status: ${newStatus.toUpperCase()}`,
      changedBy ? `Processed by: ${changedBy}` : "",
      `Al-Heib School`,
    ].filter(Boolean).join("\n"),
    referenceType: "appointment_status",
    referenceId: appointment.id || appointment.visitor_name,
  }).catch(() => {});

  if (appointment.visitor_phone) {
    const appId = appointment.id || appointment.visitor_name;
    const shortCode = generateShortCode(appId);
    await sendWaImage(appointment.visitor_phone, "appointment", {
      mood,
      visitorName: appointment.visitor_name,
      purpose: appointment.purpose,
      hostName: appointment.host_name,
      location: appointment.location,
      date: dateStr,
      time: timeStr,
      appointmentId: shortCode,
      message: msg,
    }, `${msg}: ${appointment.purpose}`);

    const statusBtns: WhatsAppButton[] = [
      { id: "view_" + shortCode, displayText: "📋 View Details" },
      { id: "call_school", displayText: "📞 Call School" },
    ];
    if (newStatus === "completed" || newStatus === "checked_in") {
      statusBtns.push({ id: "rate_" + shortCode, displayText: "⭐ Rate Your Visit" });
    }
    await sendWhatsAppButtons(
      appointment.visitor_phone,
      msg,
      `Appointment: ${appointment.purpose}\n${dateStr} ${timeStr}`,
      statusBtns,
    );

    await sendWa(appointment.visitor_phone,
      `${msg}\n\n${appointment.visitor_name}\n${appointment.purpose}\n${dateStr} ${timeStr}\n🆔 ${shortCode}\n📋 Track: https://alheibschool.org/track?id=${shortCode}`
    );
  }
}

export async function notifyRequestApproval(
  requestType: string,
  requestId: string,
  status: "approved" | "rejected",
  requesterEmail?: string,
  requesterName?: string,
  comments?: string,
  requesterPhone?: string,
  lang?: "ar" | "en",
) {
  await emailNotifyRequestApproval(requestType, requestId, status, requesterEmail, requesterName, comments);

  if (requesterPhone) {
    const mood: NotificationMood = status === "approved" ? "success" : "error";
    const actionAr = status === "approved" ? "تمت الموافقة" : "تم الرفض";
    const actionEn = status === "approved" ? "Approved" : "Rejected";

    await sendWaImage(requesterPhone, "generic", {
      mood,
      lang,
      message: `طلب ${requestType}`,
      messageEn: `${requestType} Request ${actionEn}`,
      guardianName: requesterName,
      details: [
        { label: lang === "en" ? "Status" : "الحالة", value: lang === "en" ? actionEn : actionAr },
        { label: lang === "en" ? "Request ID" : "رقم الطلب", value: requestId.substring(0, 8) },
        ...(comments ? [{ label: lang === "en" ? "Comments" : "ملاحظات", value: comments }] : []),
      ],
    }, `📋 ${actionEn}: ${requestType}`);
    await sendSm(requesterPhone, `Your ${requestType} request was ${status}.${comments ? " " + comments.substring(0, 60) : ""}`);
  }
}
