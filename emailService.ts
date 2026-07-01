import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

export type EmailMood = "success" | "warning" | "error" | "info";

interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  html?: boolean;
  replyTo?: string;
  templateId?: string;
  referenceType?: string;
  referenceId?: string;
  mood?: EmailMood;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
}

const MOOD_THEMES: Record<EmailMood, { accent: string; bg: string; icon: string; label: string }> = {
  success: { accent: "#166534", bg: "#f0fdf4", icon: "&#9989;", label: "Success" },
  warning: { accent: "#92400e", bg: "#fffbeb", icon: "&#9888;", label: "Warning" },
  error:   { accent: "#991b1b", bg: "#fef2f2", icon: "&#10060;", label: "Alert" },
  info:    { accent: "#1e40af", bg: "#eff6ff", icon: "&#8505;", label: "Information" },
};

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
}

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SERVICE_ROLE_KEY || "";
}

function createSupabaseClient() {
  return createClient(getSupabaseUrl(), getServiceRoleKey());
}

async function getSmtpConfig(): Promise<SmtpConfig | null> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("email_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (error || !data) return null;
    return {
      host: data.smtp_host,
      port: data.smtp_port,
      secure: data.smtp_secure,
      user: data.smtp_user,
      pass: data.smtp_pass,
      fromName: data.from_name,
      fromEmail: data.from_email,
      replyTo: data.reply_to || "",
    };
  } catch {
    return null;
  }
}

function getSmtpConfigFromEnv(): SmtpConfig {
  return {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    fromName: process.env.SMTP_FROM_NAME || "Al-Heib School",
    fromEmail: process.env.SMTP_FROM_EMAIL || "noreply@sised.sc.ug",
    replyTo: process.env.SMTP_REPLY_TO || "",
  };
}

function resolveTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => variables[key] || `{${key}}`);
}

const SCHOOL_HEADER_HTML = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr>
    <td style="text-align:center;padding:20px 0 12px 0;border-bottom:2px solid #166534;">
      <h1 style="font-size:22px;color:#166534;margin:0 0 6px 0;font-weight:800;letter-spacing:0.5px;">ALHEB ISLAMIC PRIMARY SCHOOL</h1>
      <p style="font-size:12px;color:#4b5563;margin:2px 0;line-height:1.6;">
        123 EDUCATION ROAD, KAMPALA, UGANDA<br/>
        P.O. BOX 2891 KAMPALA - UGANDA<br/>
        TEL: +256 700 123 456 | Email: info@alheb.edu
      </p>
    </td>
  </tr>
  <tr>
    <td style="text-align:center;padding:8px 0 12px 0;border-bottom:1px solid #e5e7eb;direction:rtl;">
      <p style="font-size:15px;color:#166534;margin:2px 0;font-weight:700;font-family:'Traditional Arabic','Times New Roman',serif;">
        مدرسة اللهيب الابتدائية
      </p>
      <p style="font-size:11px;color:#4b5563;margin:2px 0;line-height:1.5;font-family:'Traditional Arabic','Times New Roman',serif;">
        كيتيكيفومبا - كيرا<br/>
        ص.ب: 2891 كمبالا - أوغندا<br/>
        هاتف: 0788402156 / 0745397122<br/>
        البريد الإلكتروني: info@alheb.edu
      </p>
    </td>
  </tr>
</table>`;

const SCHOOL_HEADER_TEXT = [
  "================================================",
  "          ALHEB ISLAMIC PRIMARY SCHOOL",
  "================================================",
  "123 EDUCATION ROAD, KAMPALA, UGANDA",
  "P.O. BOX 2891 KAMPALA - UGANDA",
  "TEL: +256 700 123 456 | Email: info@alheb.edu",
  "",
  "مدرسة اللهيب الابتدائية",
  "كيتيكيفومبا - كيرا",
  "ص.ب: 2891 كمبالا - أوغندا",
  "هاتف: 0788402156 / 0745397122",
  "البريد الإلكتروني: info@alheb.edu",
  "================================================",
  "",
].join("\n");

function buildSchoolHtml({
  title,
  body,
  mood = "success",
}: {
  title: string;
  body: string;
  mood?: EmailMood;
}): string {
  const theme = MOOD_THEMES[mood];
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:${theme.bg};font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:${theme.accent};padding:16px 40px;border-radius:16px 16px 0 0;">
              <table role="presentation" width="100%">
                <tr>
                  <td style="font-size:18px;color:#fff;font-weight:700;letter-spacing:0.5px;">
                    ${theme.icon} Al-Heib School
                    <span style="float:right;font-size:11px;background:rgba(255,255,255,0.2);padding:2px 12px;border-radius:12px;">${theme.label}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#fff;padding:0 40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              ${SCHOOL_HEADER_HTML}
            </td>
          </tr>
          <tr>
            <td style="background:#fff;padding:0 40px 40px 40px;border-radius:0 0 16px 16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
              <div style="background:${theme.bg};border-left:4px solid ${theme.accent};padding:10px 16px;margin:0 0 20px 0;border-radius:0 6px 6px 0;">
                <span style="color:${theme.accent};font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">${theme.label} Notice</span>
              </div>
              <h2 style="color:#1f2937;font-size:20px;margin:0 0 16px 0;font-weight:400;">${title}</h2>
              <div style="color:#374151;line-height:1.8;font-size:14px;">${body}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="color:#9ca3af;font-size:11px;margin:0;">
                This is an automated message from Al-Heib School Management System.<br/>
                &copy; ${new Date().getFullYear()} Al-Heib School. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function logEmail(supabase: ReturnType<typeof createClient>, options: EmailOptions, status: string, errorMessage?: string) {
  try {
    await supabase.from("email_logs").insert({
      recipient_email: options.to,
      recipient_name: options.toName || null,
      subject: options.subject,
      body: options.body,
      template_id: options.templateId || null,
      reference_type: options.referenceType || null,
      reference_id: options.referenceId || null,
      status,
      error_message: errorMessage || null,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    });
  } catch (e) {
    console.error("Failed to log email:", e);
  }
}

function createTransporter(config: SmtpConfig): nodemailer.Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

async function getResendApiKey(): Promise<string | null> {
  try {
    const supabase = createSupabaseClient();
    const { data } = await supabase
      .from("email_settings")
      .select("resend_api_key")
      .eq("id", 1)
      .single();
    if (data?.resend_api_key) return data.resend_api_key;
  } catch {}
  return process.env.RESEND_API_KEY || null;
}

async function sendViaResend(
  options: EmailOptions,
  apiKey: string,
  fromEmail?: string,
  fromName?: string,
): Promise<{ success: boolean; message: string }> {
  const html = buildSchoolHtml({
    title: options.subject,
    body: options.body.replace(/\n/g, "<br/>"),
    mood: options.mood,
  });
  const textBody = SCHOOL_HEADER_TEXT + options.body;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName || "Al-Heib School"} <${fromEmail || "noreply@sised.sc.ug"}>`,
      to: options.toName
        ? [{ email: options.to, name: options.toName }]
        : [options.to],
      reply_to: options.replyTo || undefined,
      subject: options.subject,
      html,
      text: textBody,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return { success: false, message: data.message || `Resend API error (${res.status})` };
  }
  return { success: true, message: `Sent via Resend (id: ${data.id})` };
}

export async function sendEmail(options: EmailOptions, variables?: Record<string, string>): Promise<{ success: boolean; message: string }> {
  let subject = options.subject;
  let body = options.body;
  if (variables) {
    subject = resolveTemplate(subject, variables);
    body = resolveTemplate(body, variables);
  }

  const bodyWithHeader = SCHOOL_HEADER_TEXT + body;
  const sendOptions = { ...options, subject, body };

  if (!getSupabaseUrl() || !getServiceRoleKey()) {
    return { success: false, message: "Supabase credentials not configured on server" };
  }
  const supabase = createSupabaseClient();

  const resendKey = await getResendApiKey();
  if (resendKey) {
    let settings: { from_email?: string; from_name?: string } = {};
    try {
      const { data } = await supabase.from("email_settings").select("from_email, from_name").eq("id", 1).single();
      if (data) settings = data;
    } catch {}
    const result = await sendViaResend(sendOptions, resendKey, settings.from_email, settings.from_name);
    await logEmail(supabase, sendOptions, result.success ? "sent" : "failed", result.success ? undefined : result.message);
    return result;
  }

  let config = await getSmtpConfig();
  if (!config || !config.host) {
    config = getSmtpConfigFromEnv();
  }
  if (!config.host || !config.user || !config.pass) {
    return { success: false, message: "Email not configured. Set Resend API key or SMTP settings." };
  }

  try {
    const transporter = createTransporter(config);
    const htmlBody = buildSchoolHtml({ title: subject, body: body.replace(/\n/g, "<br/>"), mood: options.mood });
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
      replyTo: config.replyTo || undefined,
      subject,
      text: bodyWithHeader,
      html: htmlBody,
    });

    await logEmail(supabase, sendOptions, "sent");
    return { success: true, message: `Email sent to ${options.to} (messageId: ${info.messageId})` };
  } catch (error: any) {
    const errMsg = error?.message || "Unknown error";
    console.error("Email send error:", errMsg);
    await logEmail(supabase, sendOptions, "failed", errMsg);
    return { success: false, message: `Failed to send email: ${errMsg}` };
  }
}

export async function queueEmail(
  options: EmailOptions,
  priority: number = 0,
  processAfter?: Date,
): Promise<{ success: boolean; message: string }> {
  if (!getSupabaseUrl() || !getServiceRoleKey()) {
    return { success: false, message: "Supabase credentials not configured" };
  }
  const supabase = createSupabaseClient();
  try {
    const { error } = await supabase.from("email_queue").insert({
      recipient_email: options.to,
      recipient_name: options.toName || null,
      subject: options.subject,
      body: options.body,
      priority,
      status: "queued",
      process_after: (processAfter || new Date()).toISOString(),
    });
    if (error) throw error;
    return { success: true, message: "Email queued" };
  } catch (err: any) {
    return { success: false, message: `Failed to queue email: ${err.message}` };
  }
}

export async function sendEmailFromTemplate(
  templateId: string,
  recipientEmail: string,
  recipientName: string | undefined,
  variables: Record<string, string>,
  referenceType?: string,
  referenceId?: string,
): Promise<{ success: boolean; message: string }> {
  const supabase = createSupabaseClient();
  const { data: template, error } = await supabase
    .from("notification_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error || !template) {
    return { success: false, message: "Template not found" };
  }

  const subject = resolveTemplate(template.subject || "", variables);
  const body = resolveTemplate(template.message_body || "", variables);

  return sendEmail({
    to: recipientEmail,
    toName: recipientName,
    subject,
    body,
    templateId,
    referenceType,
    referenceId,
  }, variables);
}

export async function sendApprovalEmail(
  recipientEmail: string,
  recipientName: string,
  requestType: string,
  requestId: string,
  status: "approved" | "rejected",
  comments?: string,
  requesterName?: string,
): Promise<{ success: boolean; message: string }> {
  const actionText = status === "approved" ? "Approved" : "Rejected";
  const mood: EmailMood = status === "approved" ? "success" : "error";
  const subject = `[${actionText}] ${requestType} Request #${requestId.substring(0, 8)}`;
  const body = [
    `Dear ${recipientName},`,
    ``,
    `Your ${requestType} request (${requestId.substring(0, 8)}) has been ${status}${comments ? ` with the following comments:` : "."}`,
    comments ? `\nComments: ${comments}` : "",
    ``,
    `Please log in to the system to view the details.`,
    ``,
    `Best regards,\nAl-Heib School Management`,
  ].join("\n");

  return sendEmail({
    to: recipientEmail,
    toName: recipientName,
    subject,
    body,
    referenceType: requestType,
    referenceId: requestId,
    mood,
  });
}

export async function sendReminderEmail(
  recipientEmail: string,
  recipientName: string,
  reminderType: string,
  details: string,
  dueDate?: string,
): Promise<{ success: boolean; message: string }> {
  const subject = `[Reminder] ${reminderType}`;
  const body = [
    `Dear ${recipientName},`,
    ``,
    `This is a reminder regarding: ${reminderType}`,
    details ? `\n${details}` : "",
    dueDate ? `\nDue Date: ${dueDate}` : "",
    ``,
    `Please take the necessary action.`,
    ``,
    `Best regards,\nAl-Heib School Management`,
  ].join("\n");

  return sendEmail({
    to: recipientEmail,
    toName: recipientName,
    subject,
    body,
    referenceType: "reminder",
    referenceId: reminderType,
    mood: "warning",
  });
}

export async function sendAttendanceNotification(
  recipientEmail: string,
  recipientName: string,
  learnerName: string,
  status: string,
  date: string,
): Promise<{ success: boolean; message: string }> {
  const mood: EmailMood = status === "present" ? "success" : status === "absent" ? "error" : "warning";
  const subject = `[Attendance] ${learnerName} - ${status}`;
  const body = [
    `Dear ${recipientName},`,
    ``,
    `Your child ${learnerName} has been marked as "${status}" on ${date}.`,
    ``,
    `Please log in to the system to view the full attendance record.`,
    ``,
    `Best regards,\nAl-Heib School Management`,
  ].join("\n");

  return sendEmail({
    to: recipientEmail,
    toName: recipientName,
    subject,
    body,
    referenceType: "attendance",
    mood,
  });
}
