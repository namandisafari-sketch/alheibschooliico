import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createServer as createViteServer } from "vite";
import si from "systeminformation";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import {
  sendEmail, sendEmailFromTemplate, sendApprovalEmail, sendReminderEmail, queueEmail,
} from "./emailService";
import {
  initEmailEngine, processEmailQueue, sendDailyAdminReport,
  notifyAttendanceRecorded, notifyGateCheckIn, notifyAppointmentCreated, notifyRequestApproval,
  notifyLessonPlanSubmitted, notifyLessonPlanReviewed, notifySchemeSubmitted,
} from "./emailEngine";
import {
  sendWhatsApp, sendBulkWhatsApp, getWhatsAppStatus, sendWhatsAppToGroup,
} from "./whatsappService";
import {
  testConnection as hikvisionTest,
  manualSync as hikvisionSync,
  startPolling as hikvisionStartPolling,
  stopPolling as hikvisionStopPolling,
} from "./hikvisionService";
import {
  notifyLessonPlanSubmitted as unifiedNotifyLessonPlanSubmitted,
  notifyLessonPlanReviewed as unifiedNotifyLessonPlanReviewed,
  notifySchemeSubmitted as unifiedNotifySchemeSubmitted,
  notifyAttendanceRecorded as unifiedNotifyAttendance,
  notifyGateCheckIn as unifiedNotifyGateCheckIn,
  notifyAppointmentCreated as unifiedNotifyAppointment,
  notifyAppointmentStatusChanged as unifiedNotifyAppointmentStatusChanged,
  notifyRequestApproval as unifiedNotifyRequestApproval,
  sendSms,
} from "./notificationEngine";

// Increase EventEmitter max listeners to avoid MaxListenersExceededWarning from timeout-based fetch
import { EventEmitter } from "events";
EventEmitter.defaultMaxListeners = 100;

import { authenticateRequest, requireRole } from "./authMiddleware";
import { logAuthEvent } from "./authAudit";

// Load environment variables from .env file
// Use __dirname (CJS) or import.meta.url (ESM) depending on environment
const currentDir: string = (() => {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return __dirname;
  }
})();
const envPath = path.join(currentDir, "..", ".env");
if (fs.existsSync(envPath)) {
  try {
    // @ts-ignore - loadEnvFile is available in Node 20.6.0+
    process.loadEnvFile(envPath);
  } catch (e) {
    console.warn("Failed to load .env file via process.loadEnvFile, falling back to process.env");
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = 
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ADMIN_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function startServer() {
  const app = express();
  const portArgIdx = process.argv.indexOf("--port");
  const PORT = Number(
    (portArgIdx !== -1 && process.argv[portArgIdx + 1]) ||
      process.env.PORT ||
      3000
  );

  // Proxy /supabase/* to local Supabase instance (port 8000)
  // IMPORTANT: Must be BEFORE express.json() to avoid consuming the request body stream
  const supabaseProxy = createProxyMiddleware({
    target: "http://localhost:8000",
    changeOrigin: true,
    ws: true,
    proxyTimeout: 30000,
    timeout: 30000,
    pathRewrite: { "^/supabase": "" },
    onProxyReq: (proxyReq) => {
      // Forward the original host for Supabase routing
      proxyReq.setHeader("Host", "localhost:8000");
    },
  });
  app.use("/supabase", supabaseProxy);

  app.use(compression());
  app.use(express.json());

  // System health endpoint
  app.get("/api/system/health", async (req, res) => {
    try {
      const [cpu, mem, fs] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
      ]);
      
      const mainFs = fs.find(f => f.mount === "/") || fs[0];
      
      // Check Supabase connectivity
      let dbStatus = "Disconnected";
      try {
        const dbRes = await fetch("http://localhost:8000/rest/v1/", {
          headers: {
            "Accept": "application/json",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc5MzU5OTc4LCJleHAiOjE5MzcwMzk5Nzh9.RioMqcrWHldWHqchM3IB5Z8-2XJ4TukRp1ODlv96LYY",
          },
          signal: AbortSignal.timeout(3000),
        });
        dbStatus = dbRes.status < 500 ? "Optimized" : "Degraded";
      } catch {
        dbStatus = "Disconnected";
      }

      // Check LAN gateway (MikroTik router)
      let lanAccess = "Inactive";
      try {
        execSync("ping -c 1 -W 1 192.168.88.1", { timeout: 2000, stdio: "ignore" });
        lanAccess = "Active";
      } catch {
        lanAccess = "Inactive";
      }
      
      res.json({
        cpuLoad: cpu.currentLoad.toFixed(1),
        ramUsage: (mem.active / (1024 * 1024 * 1024)).toFixed(1),
        storageFree: (mainFs.available / (1024 * 1024 * 1024)).toFixed(0),
        dbStatus,
        lanAccess,
      });
    } catch (error) {
      console.error("System health error:", error);
      res.status(500).json({ error: "Failed to fetch system metrics" });
    }
  });

  // Africa's Talking API Proxy
  app.post("/api/sms/send", async (req, res) => {
    const { numbers, message_body, sender_id } = req.body;
    const apiKey = process.env.AFRICASTALKING_API_KEY;
    const username = process.env.AFRICASTALKING_USERNAME;

    if (!apiKey || !username) {
      return res.status(500).json({ success: false, message: "Africa's Talking credentials not configured on server" });
    }

    try {
      const url = "https://api.africastalking.com/version1/messaging";
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("to", numbers);
      params.append("message", message_body);
      const from = sender_id || process.env.AFRICASTALKING_SENDER_ID;
      if (from) params.append("from", from);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "apiKey": apiKey,
        },
        body: params.toString(),
      });

      const data = await response.json();
      // Africa's Talking response structure varies, but we want to return success: true
      const success = response.ok && data.SMSMessageData?.Recipients?.some((r: any) => r.status === "Success" || r.status === "Pending");
      res.status(response.status).json({ success, data });
    } catch (error) {
      console.error("SMS send error:", error);
      res.status(500).json({ success: false, message: "Internal server error while sending SMS via Africa's Talking" });
    }
  });

  app.post("/api/users/create", async (req, res) => {
    try {
      const { email, password, fullName, phone, role } = req.body;

      if (!email || !password || !fullName || !role) {
        return res.status(400).json({ error: "email, password, fullName, and role are required" });
      }

      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({
          error: "Supabase service credentials are not configured on the server",
        });
      }

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // 1. Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (authError) {
        return res.status(400).json({ error: authError.message });
      }

      const user_id = authData.user?.id;
      if (!user_id) {
        return res.status(500).json({ error: "Failed to retrieve user ID after creation", details: authData });
      }

      // 2. Create profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: user_id,
          full_name: fullName,
          email,
          phone,
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // We don't return error here because the user is already created in auth
      }

      // 3. Assign role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id,
          role,
        });

      if (roleError) {
        console.error("Role assignment error:", roleError);
      }

      return res.json({ success: true, user_id, message: "User created successfully" });
    } catch (error) {
      console.error("User creation route error:", error);
      return res.status(500).json({
        error: "Internal server error while creating user",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post("/api/users/update-password", async (req, res) => {
    try {
      const { user_id, password } = req.body;

      if (!user_id || !password) {
        return res.status(400).json({ error: "user_id and password are required" });
      }

      if (!SUPABASE_URL) {
        return res.status(500).json({
          error: "Supabase URL is not configured. Set SUPABASE_URL or VITE_SUPABASE_URL environment variable.",
          details: "See SUPABASE_SETUP.md for configuration instructions"
        });
      }

      if (!SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({
          error: "Supabase service credentials are not configured on the server",
          details: "Set SUPABASE_SERVICE_ROLE_KEY environment variable. See SUPABASE_SETUP.md for instructions",
          hint: "Get it from https://app.supabase.com → Settings → API → Service Role Key"
        });
      }

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        password,
      });

      if (error) {
        console.error("Supabase Auth Error:", error);
        return res.status(400).json({ error: error.message, details: error.details ?? null });
      }

      if (!data || !data.user || !data.user.id) {
        return res.status(500).json({ error: "User password update failed", details: data });
      }

      return res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Password update route error:", error);
      return res.status(500).json({
        error: "Internal server error while updating password",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post("/api/sms/send/bulk", async (req, res) => {
    const { messages, sender_id } = req.body;
    const apiKey = process.env.AFRICASTALKING_API_KEY;
    const username = process.env.AFRICASTALKING_USERNAME;

    if (!apiKey || !username) {
      return res.status(500).json({ success: false, message: "Africa's Talking credentials not configured on server" });
    }

    try {
      const results = [];
      // Africa's Talking requires individual sends for different content (Mail Merge)
      for (const msg of messages) {
        const params = new URLSearchParams();
        params.append("username", username);
        params.append("to", msg.number);
        params.append("message", msg.message_body || msg.message);
        const from = sender_id || process.env.AFRICASTALKING_SENDER_ID;
        if (from) params.append("from", from);

        const response = await fetch("https://api.africastalking.com/version1/messaging", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "apiKey": apiKey,
          },
          body: params.toString(),
        });
        results.push(await response.json());
      }
      
      res.json({ success: true, results });
    } catch (error) {
      console.error("Bulk SMS send error:", error);
      res.status(500).json({ success: false, message: "Internal server error while sending bulk SMS" });
    }
  });

  app.get("/api/sms/balance", async (req, res) => {
    const apiKey = process.env.AFRICASTALKING_API_KEY;
    const username = process.env.AFRICASTALKING_USERNAME;

    if (!apiKey || !username) {
      return res.status(500).json({ success: false, message: "Africa's Talking credentials not configured on server" });
    }

    try {
      const response = await fetch(`https://api.africastalking.com/version1/user?username=${username}`, {
        headers: {
          "Accept": "application/json",
          "apiKey": apiKey,
        },
      });

      const data = await response.json();
      // Africa's Talking returns user data including balance
      res.status(response.status).json({ 
        success: response.ok, 
        balance: data.UserData?.balance,
        currency: data.UserData?.currencyCode,
        data 
      });
    } catch (error) {
      console.error("SMS balance error:", error);
      res.status(500).json({ success: false, message: "Internal server error while checking SMS balance" });
    }
  });

  // ===== WHATSAPP API ENDPOINTS =====

  // Send WhatsApp message
  app.post("/api/whatsapp/send", async (req, res) => {
    const { to, text } = req.body;
    if (!to || !text) {
      return res.status(400).json({ success: false, message: "to and text required" });
    }
    try {
      const result = await sendWhatsApp(to, text);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Send bulk WhatsApp messages
  app.post("/api/whatsapp/send/bulk", async (req, res) => {
    const { recipients } = req.body;
    if (!Array.isArray(recipients) || !recipients.length) {
      return res.status(400).json({ success: false, message: "recipients array required" });
    }
    try {
      const result = await sendBulkWhatsApp(recipients);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Send WhatsApp group message
  app.post("/api/whatsapp/send/group", async (req, res) => {
    const { groupJid, text } = req.body;
    if (!groupJid || !text) {
      return res.status(400).json({ success: false, message: "groupJid and text required" });
    }
    try {
      const result = await sendWhatsAppToGroup(groupJid, text);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Get WhatsApp connection status
  app.get("/api/whatsapp/status", async (req, res) => {
    try {
      const status = await getWhatsAppStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // DeepSeek AI Report Generation via Baseten
  app.post("/api/ai/report", async (req, res) => {
    const { department, period, data } = req.body;
    const apiKey = process.env.BASETEN_API_KEY;
    const modelId = process.env.BASETEN_DEEPSEEK_MODEL || "deepseek-r1";

    if (!apiKey) {
      return res.json({
        summary: `AI insights unavailable. BASETEN_API_KEY not configured. Data is still being collected locally.`,
        insights: [
          `${department ? department.charAt(0).toUpperCase() + department.slice(1) : "Department"} data logged.`,
          `${Object.keys(data || {}).length} data points captured.`,
          "Set BASETEN_API_KEY to enable AI-powered reasoning."
        ],
        recommendations: ["Configure BASETEN_API_KEY in environment variables."],
        trends: ["Local data collection is active."]
      });
    }

    try {
      const systemPrompt = `You are an intelligent school management analyst for Alheib Mixed Day & Boarding School. Analyze the provided department data and generate a clean, reasoned report. Respond with JSON only:
{
  "summary": "2-3 sentence executive summary",
  "insights": ["3-5 key insights based on the data"],
  "recommendations": ["2-3 actionable recommendations"],
  "trends": ["2-3 observed trends"]
}`;

      const response = await fetch(`https://model-${modelId}.api.baseten.co/environments/production/sync/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "DeepSeek-R1-Distill",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Department: ${department || "All"}\nPeriod: ${period || "current"}\nData: ${JSON.stringify(data, null, 2)}\n\nGenerate a concise report.` }
          ],
          max_tokens: 1024,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Baseten API error:", response.status, errText);
        return res.json({ summary: "AI analysis encountered an issue.", insights: ["Check your Baseten model deployment."], recommendations: ["Verify model is deployed and running."], trends: ["System continues logging locally."] });
      }

      const result = await response.json();
      let parsed;
      try {
        const content = result.choices?.[0]?.message?.content || "{}";
        parsed = JSON.parse(content.replace(/```json|```/g, "").trim());
      } catch {
        parsed = { summary: "AI response format unexpected.", insights: ["Raw response received."], recommendations: ["Check AI model response format."], trends: ["Analysis active."] };
      }
      res.json(parsed);
    } catch (err: any) {
      console.error("AI report error:", err);
      res.json({ summary: "AI analysis temporarily unavailable.", insights: ["Operating in offline mode."], recommendations: ["Check network connectivity to Baseten."], trends: ["Local logging continues."] });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ===== SELF-REGISTRATION ENDPOINTS =====

  // Check if a full_name exists in employees table (eligibility check)
  app.post("/api/auth/check-eligibility", async (req, res) => {
    try {
      const { fullName } = req.body;
      if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
        return res.status(400).json({ eligible: false, message: "Full name is required" });
      }

      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ eligible: false, message: "Server not configured" });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

      // Search for matching employee (case-insensitive)
      const { data: matches, error } = await supabase
        .from("employees")
        .select("id, full_name, role, profile_id")
        .ilike("full_name", `%${fullName.trim()}%`)
        .limit(10);

      if (error) {
        return res.status(500).json({ eligible: false, message: "Database error" });
      }

      // Filter to exact-ish matches and those without an account yet
      const eligible = (matches || []).filter(
        (e: any) => e.full_name.toLowerCase().includes(fullName.trim().toLowerCase()) && !e.profile_id
      );

      if (eligible.length === 0) {
        return res.json({ eligible: false, message: "No matching records found. Please contact the school administration to be added to the system." });
      }

      // Return the matches - user will pick their record
      const suggestions = eligible.map((e: any) => ({
        employeeId: e.id,
        fullName: e.full_name,
        roleSuggestion: e.role || "",
      }));

      res.json({ eligible: true, suggestions });

    } catch (error: any) {
      console.error("Eligibility check error:", error);
      res.status(500).json({ eligible: false, message: error.message || "Internal error" });
    }
  });

  // Register a new user (self-registration)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { employeeId, email, password, fullName, phone, role } = req.body;

      if (!employeeId || !email || !password || !fullName || !role) {
        return res.status(400).json({ error: "employeeId, email, password, fullName, and role are required" });
      }

      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: "Server not configured" });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // Check if a profile with this full_name already exists (e.g. from seed data)
      const { data: existingProfiles } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("full_name", fullName);

      let userId: string;

      if (existingProfiles && existingProfiles.length > 0) {
        // Update existing auth user instead of creating a new one
        const existing = existingProfiles[0];
        userId = existing.id;

        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          email,
          password,
          email_confirm: true,
        });

        if (updateError) {
          return res.status(400).json({ error: updateError.message });
        }

        // Update the profile with new contact info
        await supabase.from("profiles").update({ email, phone: phone || null }).eq("id", userId);
      } else {
        // Create new auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

        if (authError) {
          return res.status(400).json({ error: authError.message });
        }

        userId = authData.user?.id;
        if (!userId) {
          return res.status(500).json({ error: "Failed to retrieve user ID after creation" });
        }

        // Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          id: userId,
          full_name: fullName,
          email,
          phone: phone || null,
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
      }

      // 3. Assign role (remove any existing role first, then assign)
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role,
      });

      if (roleError) {
        console.error("Role assignment error:", roleError);
      }

      // 4. Link employee record to this profile
      const { error: employeeUpdateError } = await supabase
        .from("employees")
        .update({ profile_id: userId })
        .eq("id", employeeId);

      if (employeeUpdateError) {
        console.error("Employee link error:", employeeUpdateError);
      }

      // 5. Send welcome notifications
      const appUrl = process.env.APP_URL || "https://sised.sc.ug";
      const loginUrl = `${appUrl}/auth`;

      // Email notification
      sendEmail({
        to: email,
        toName: fullName,
        subject: "Welcome to Al-Heib School Management System",
        body: `
Dear ${fullName},

Your account has been created successfully for the Al-Heib School Management System.

Login here: ${loginUrl}
Your role: ${role}
Your email: ${email}

You can now sign in using your email and password.

Thank you,
Al-Heib School Administration
        `.trim(),
      }).catch((e: any) => console.error("Welcome email error:", e.message));

      // WhatsApp notification
      if (phone) {
        sendWhatsApp(phone, `Welcome ${fullName}! Your Al-Heib School account has been created. Login at ${loginUrl} Role: ${role} Email: ${email}`)
          .catch((e: any) => console.error("WhatsApp notification error:", e.message));
      }

      // SMS notification
      if (phone) {
        const smsApiKey = process.env.AFRICASTALKING_API_KEY;
        const smsUsername = process.env.AFRICASTALKING_USERNAME;
        if (smsApiKey && smsUsername) {
          const params = new URLSearchParams();
          params.append("username", smsUsername);
          params.append("to", phone);
          params.append("message", `Welcome ${fullName}! Your Al-Heib School account is ready. Login: ${loginUrl}`);
          const from = process.env.AFRICASTALKING_SENDER_ID;
          if (from) params.append("from", from);
          fetch("https://api.africastalking.com/version1/messaging", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json", "apiKey": smsApiKey },
            body: params.toString(),
          }).catch((e: any) => console.error("SMS notification error:", e.message));
        }
      }

      res.json({ success: true, userId, message: "Account created. Check your email, WhatsApp, and SMS for confirmation." });

    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: error.message || "Internal error during registration" });
    }
  });

  // ===== PASSWORD RESET =====

  // Request password reset (sends reset email via Supabase)
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: "Server not configured" });
      }

      const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        auth: { persistSession: false },
      });

      const redirectUrl = `${req.protocol}://${req.get("host")}/auth?reset=true`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      await logAuthEvent("password_reset_requested", null, {
        email,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ success: true, message: "Password reset email sent if the account exists." });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: error.message || "Internal error" });
    }
  });

  // Update password (authenticated)
  app.post("/api/auth/update-password", authenticateRequest, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "currentPassword and newPassword are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: req.userEmail!,
        password: currentPassword,
      });

      if (signInError) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

      await logAuthEvent("password_changed", req.userId!, {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error: any) {
      console.error("Update password error:", error);
      res.status(500).json({ error: error.message || "Internal error" });
    }
  });

  // ===== SESSION MANAGEMENT =====

  // List active sessions for the current user
  app.get("/api/auth/sessions", authenticateRequest, async (req, res) => {
    try {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false },
      });

      const { data, error } = await supabase
        .from("auth_sessions")
        .select("*")
        .eq("user_id", req.userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      res.json({ success: true, sessions: data || [] });
    } catch (error: any) {
      console.error("Session list error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch sessions" });
    }
  });

  // Revoke a specific session
  app.delete("/api/auth/sessions/:id", authenticateRequest, async (req, res) => {
    try {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false },
      });

      const { error } = await supabase
        .from("auth_sessions")
        .delete()
        .eq("id", req.params.id)
        .eq("user_id", req.userId);

      if (error) throw error;

      await logAuthEvent("logout", req.userId!, {
        sessionId: req.params.id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ success: true, message: "Session revoked" });
    } catch (error: any) {
      console.error("Session revoke error:", error);
      res.status(500).json({ error: error.message || "Failed to revoke session" });
    }
  });

  // Revoke all sessions except current
  app.delete("/api/auth/sessions", authenticateRequest, async (req, res) => {
    try {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false },
      });

      const { error } = await supabase
        .from("auth_sessions")
        .delete()
        .eq("user_id", req.userId);

      if (error) throw error;

      await logAuthEvent("logout", req.userId!, {
        allSessions: true,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ success: true, message: "All sessions revoked" });
    } catch (error: any) {
      console.error("Session revoke all error:", error);
      res.status(500).json({ error: error.message || "Failed to revoke sessions" });
    }
  });

  // ===== ACCOUNT STATUS MANAGEMENT =====

  // Disconnect a user account
  app.post("/api/auth/disconnect", authenticateRequest, requireRole("admin", "center_director", "head_teacher", "deputy_head_teacher"), async (req, res) => {
    try {
      const { userId, reason } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false },
      });

      const { error } = await supabase
        .from("profiles")
        .update({
          account_status: "disconnected",
          suspension_reason: reason || "Account disconnected by administrator",
          disconnected_at: new Date().toISOString(),
          disconnected_by: req.userId,
        })
        .eq("id", userId);

      if (error) throw error;

      await logAuthEvent("account_disconnected", userId, {
        reason: reason || "No reason provided",
        disconnectedBy: req.userId,
        ip: req.ip,
      });

      res.json({ success: true, message: "Account disconnected" });
    } catch (error: any) {
      console.error("Disconnect account error:", error);
      res.status(500).json({ error: error.message || "Failed to disconnect account" });
    }
  });

  // Reconnect a user account
  app.post("/api/auth/reconnect", authenticateRequest, requireRole("admin", "center_director", "head_teacher", "deputy_head_teacher"), async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false },
      });

      const { error } = await supabase
        .from("profiles")
        .update({
          account_status: null,
          suspension_reason: null,
          suspended_until: null,
          disconnected_at: null,
          disconnected_by: null,
        })
        .eq("id", userId);

      if (error) throw error;

      await logAuthEvent("account_reconnected", userId, {
        reconnectedBy: req.userId,
        ip: req.ip,
      });

      res.json({ success: true, message: "Account reconnected" });
    } catch (error: any) {
      console.error("Reconnect account error:", error);
      res.status(500).json({ error: error.message || "Failed to reconnect account" });
    }
  });

  // ===== AUDIT LOG =====

  // Get auth audit logs (admin only)
  app.get("/api/auth/audit-log", authenticateRequest, requireRole("admin", "center_director", "head_teacher"), async (req, res) => {
    try {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false },
      });

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      const userId = req.query.userId as string;

      let query = supabase
        .from("auth_audit_log")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      res.json({ success: true, data, total: count, page, limit });
    } catch (error: any) {
      console.error("Audit log error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch audit log" });
    }
  });

  // ===== ROLES & PERMISSIONS =====

  // Update user role
  app.post("/api/auth/update-role", authenticateRequest, requireRole("admin", "center_director"), async (req, res) => {
    try {
      const { userId, newRole } = req.body;
      if (!userId || !newRole) {
        return res.status(400).json({ error: "userId and newRole are required" });
      }

      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false },
      });

      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: newRole }, { onConflict: "user_id" });

      if (error) throw error;

      await logAuthEvent("role_changed", userId, {
        newRole,
        changedBy: req.userId,
        ip: req.ip,
      });

      res.json({ success: true, message: "Role updated" });
    } catch (error: any) {
      console.error("Role update error:", error);
      res.status(500).json({ error: error.message || "Failed to update role" });
    }
  });

  // Update user permissions
  app.post("/api/auth/update-permissions", authenticateRequest, requireRole("admin", "center_director"), async (req, res) => {
    try {
      const { userId, permissions } = req.body;
      if (!userId || !Array.isArray(permissions)) {
        return res.status(400).json({ error: "userId and permissions array are required" });
      }

      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false },
      });

      const { error } = await supabase
        .from("user_permissions")
        .upsert(
          { user_id: userId, permissions },
          { onConflict: "user_id" },
        );

      if (error) throw error;

      await logAuthEvent("permission_changed", userId, {
        permissions,
        changedBy: req.userId,
        ip: req.ip,
      });

      res.json({ success: true, message: "Permissions updated" });
    } catch (error: any) {
      console.error("Permission update error:", error);
      res.status(500).json({ error: error.message || "Failed to update permissions" });
    }
  });

  // Setup storage bucket for budget files
  app.post("/api/storage/setup-budget-bucket", async (req, res) => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        error: "Supabase credentials not configured on server",
        message: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
      });
    }

    try {
      // Create admin client with service role key
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false }
      });

      // Check if bucket exists
      const { data: bucket, error: checkError } = await supabaseAdmin.storage.getBucket('budget-files');

      if (bucket) {
        return res.json({
          success: true,
          message: "Budget files bucket already exists",
          bucket: bucket.name
        });
      }

      // Bucket doesn't exist, create it
      if (checkError && checkError.message?.includes('not found')) {
        const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket('budget-files', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png'
          ]
        });

        if (createError) {
          console.error("Bucket creation error:", createError);
          return res.status(500).json({
            error: "Failed to create storage bucket",
            details: createError.message
          });
        }

        return res.json({
          success: true,
          message: "Budget files bucket created successfully",
          bucket: newBucket?.name || 'budget-files'
        });
      }

      return res.status(500).json({
        error: "Failed to check bucket status",
        details: checkError?.message
      });
    } catch (error) {
      console.error("Storage setup error:", error);
      return res.status(500).json({
        error: "Internal server error while setting up storage",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ===== BULK LEARNER IMPORT =====
  app.post("/api/learners/bulk-import", async (req, res) => {
    try {
      const { learners, accessToken } = req.body;
      if (!Array.isArray(learners) || learners.length === 0) {
        return res.status(400).json({ error: "learners array is required" });
      }

      const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
      const restUrl = SUPABASE_URL.replace(/\/$/, "") + "/rest/v1";

      const chunkSize = 500;
      let inserted = 0;
      let failed = 0;
      let lastError: string | null = null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "apikey": anonKey,
        "Prefer": "resolution=merge-duplicates",
      };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      for (let i = 0; i < learners.length; i += chunkSize) {
        const chunk = learners.slice(i, i + chunkSize);
        const rawRecords = chunk.map((l: any) => {
          const rec: Record<string, any> = {
            full_name: l.full_name,
            gender: l.gender || "male",
            admission_number: l.admission_number || null,
            class_id: l.class_id || null,
            pupil_status: l.pupil_status || null,
            house: l.house || null,
            home_district: l.home_district || null,
            home_village: l.home_village || null,
            date_of_birth: l.date_of_birth || null,
            nin: l.nin || null,
            status: "active",
          };
          if (rec.nin && !/^[A-Z0-9]{14}$/.test(rec.nin)) rec.nin = null;
          if (!rec.full_name || !rec.gender) return null;
          return rec;
        }).filter(Boolean);

        // PostgREST requires all objects in a bulk POST to have identical keys
        if (rawRecords.length === 0) continue;
        const allKeys = [...new Set(rawRecords.flatMap((r: any) => Object.keys(r)))];
        // Only include keys that have at least one non-null value (don't overwrite existing data with null)
        const usedKeys = allKeys.filter((k) => rawRecords.some((r: any) => r[k] != null));
        const records = rawRecords.map((r: any) => {
          const obj: Record<string, any> = {};
          for (const k of usedKeys) obj[k] = r[k] ?? null;
          return obj;
        });

        if (records.length === 0) continue;

        const resRaw = await fetch(restUrl + "/learners?on_conflict=admission_number", {
          method: "POST",
          headers,
          body: JSON.stringify(records),
        });

        if (!resRaw.ok) {
          const errBody = await resRaw.text();
          let errMsg: string;
          try {
            errMsg = JSON.parse(errBody).message || errBody;
          } catch {
            errMsg = errBody;
          }
          failed += chunk.length;
          lastError = errMsg;
          console.error("Bulk upsert error:", errMsg);
        } else {
          inserted += chunk.length;
        }
      }

      res.json({ success: true, inserted, updated: 0, failed, error: lastError });
    } catch (error: any) {
      console.error("Bulk import error:", error);
      res.status(500).json({ error: error.message || "Bulk import failed" });
    }
  });

  // ===== EMAIL API ENDPOINTS =====

  // Send a single email
  app.post("/api/email/send", async (req, res) => {
    const { to, toName, subject, body, templateId, referenceType, referenceId } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ success: false, message: "Missing required fields: to, subject, body" });
    }
    try {
      const result = await sendEmail({ to, toName, subject, body, templateId, referenceType, referenceId });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Email send failed" });
    }
  });

  // Send email from a notification template
  app.post("/api/email/send-template", async (req, res) => {
    const { templateId, recipientEmail, recipientName, variables, referenceType, referenceId } = req.body;
    if (!templateId || !recipientEmail) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    try {
      const result = await sendEmailFromTemplate(templateId, recipientEmail, recipientName, variables || {}, referenceType, referenceId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Template email send failed" });
    }
  });

  // Send approval notification email
  app.post("/api/email/approval", async (req, res) => {
    const { recipientEmail, recipientName, requestType, requestId, status, comments, requesterName } = req.body;
    if (!recipientEmail || !requestType || !requestId || !status) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    try {
      const result = await sendApprovalEmail(recipientEmail, recipientName, requestType, requestId, status, comments, requesterName);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Approval email send failed" });
    }
  });

  // Send reminder email
  app.post("/api/email/reminder", async (req, res) => {
    const { recipientEmail, recipientName, reminderType, details, dueDate } = req.body;
    if (!recipientEmail || !reminderType) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    try {
      const result = await sendReminderEmail(recipientEmail, recipientName, reminderType, details, dueDate);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Reminder email send failed" });
    }
  });

  // Test SMTP connection
  app.post("/api/email/test", async (req, res) => {
    const { testEmail } = req.body;
    if (!testEmail) {
      return res.status(400).json({ success: false, message: "testEmail required" });
    }
    try {
      const result = await sendEmail({
        to: testEmail,
        subject: "SMTP Test - Al-Heib School",
        body: "This is a test email to verify SMTP configuration.\n\nIf you received this, your SMTP settings are working correctly.",
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Test email failed" });
    }
  });

  // Get email settings
  app.get("/api/email/settings", async (req, res) => {
    try {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const { data, error } = await supabaseAdmin.from("email_settings").select("*").eq("id", 1).single();
      if (error && error.code === "PGRST116") {
        return res.json({ success: true, data: null, message: "No email settings configured" });
      }
      if (error) throw error;
      // Mask password
      if (data) data.smtp_pass = data.smtp_pass ? "••••••••" : "";
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Save email settings
  app.post("/api/email/settings", async (req, res) => {
    try {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, from_name, from_email, reply_to } = req.body;
      if (!smtp_host || !smtp_user) {
        return res.status(400).json({ success: false, message: "SMTP host and user required" });
      }
      const payload: any = {
        smtp_host, smtp_port: smtp_port || 587, smtp_secure: smtp_secure || false,
        smtp_user, from_name: from_name || "Al-Heib School", from_email: from_email || "noreply@sised.sc.ug",
        reply_to: reply_to || "",
        updated_at: new Date().toISOString(),
      };
      // Only update password if a new one is provided (not masked)
      if (smtp_pass && smtp_pass !== "••••••••") {
        payload.smtp_pass = smtp_pass;
      }
      const { data: existing } = await supabaseAdmin.from("email_settings").select("id").eq("id", 1).single();
      let result;
      if (existing) {
        result = await supabaseAdmin.from("email_settings").update(payload).eq("id", 1);
      } else {
        payload.id = 1;
        result = await supabaseAdmin.from("email_settings").insert(payload);
      }
      if (result.error) throw result.error;
      res.json({ success: true, message: "Email settings saved" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Get email logs
  app.get("/api/email/logs", async (req, res) => {
    try {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      const { data, error, count } = await supabaseAdmin
        .from("email_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      res.json({ success: true, data, total: count, page, limit });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ===== UNIFIED NOTIFICATION ENDPOINTS (Email + WhatsApp + SMS) =====

  // Notify lesson plan submitted (all channels)
  app.post("/api/notify/lesson-plan-submitted", async (req, res) => {
    const { teacherName, planTitle, classSubject, planId, teacherPhone, dosPhones } = req.body;
    if (!teacherName || !planTitle) {
      return res.status(400).json({ success: false, message: "teacherName, planTitle required" });
    }
    try {
      const result = await unifiedNotifyLessonPlanSubmitted(
        teacherName, planTitle, classSubject || "", planId || "",
        teacherPhone, dosPhones,
      );
      res.json({ success: true, message: "Multi-channel notification sent", details: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Notify lesson plan reviewed (all channels)
  app.post("/api/notify/lesson-plan-reviewed", async (req, res) => {
    const { teacherEmail, teacherName, planTitle, status, dosComments, teacherPhone } = req.body;
    if (!planTitle || !status) {
      return res.status(400).json({ success: false, message: "planTitle, status required" });
    }
    try {
      const result = await unifiedNotifyLessonPlanReviewed(
        teacherEmail, teacherName, planTitle, status, dosComments, teacherPhone,
      );
      res.json({ success: true, message: "Multi-channel notification sent", details: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Notify scheme of work submitted (all channels)
  app.post("/api/notify/scheme-submitted", async (req, res) => {
    const { teacherName, topic, classSubject, teacherPhone, dosPhones } = req.body;
    if (!teacherName || !topic) {
      return res.status(400).json({ success: false, message: "teacherName, topic required" });
    }
    try {
      await unifiedNotifySchemeSubmitted(teacherName, topic, classSubject || "", teacherPhone, dosPhones);
      res.json({ success: true, message: "Multi-channel notification sent" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Notify attendance recorded (all channels)
  app.post("/api/notify/attendance", async (req, res) => {
    const { learnerName, className, date, status, guardianEmail, guardianName, guardianPhone } = req.body;
    if (!learnerName || !date || !status) {
      return res.status(400).json({ success: false, message: "learnerName, date, status required" });
    }
    try {
      const result = await unifiedNotifyAttendance(
        learnerName, className || "", date, status,
        guardianEmail, guardianName, guardianPhone,
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Bulk notify attendance recorded — looks up all stakeholders and sends via all channels
  app.post("/api/notify/attendance-bulk", async (req, res) => {
    const { classId, date, records } = req.body;
    if (!classId || !date || !records?.length) {
      return res.status(400).json({ success: false, message: "classId, date, and records[] required" });
    }
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

      // 1. Look up class name + teacher
      const { data: cls } = await sb.from("classes").select("name, teacher_id").eq("id", classId).single();
      const className = cls?.name || "Unknown";

      // 2. Look up class teacher profile
      let teacherPhone: string | undefined;
      let teacherEmail: string | undefined;
      if (cls?.teacher_id) {
        const { data: teacher } = await sb.from("profiles").select("phone, email, full_name").eq("id", cls.teacher_id).single();
        teacherPhone = teacher?.phone || undefined;
        teacherEmail = teacher?.email || undefined;
      }

      // 3. Look up head teacher + director/admin contacts
      const { data: adminProfiles } = await sb
        .from("profiles")
        .select("id, phone, email, full_name, role")
        .in("role", ["head_teacher", "admin", "director", "manager"]);
      const adminPhones = Array.from(new Set((adminProfiles || []).map((p: any) => p.phone).filter(Boolean)));
      const adminEmails = Array.from(new Set((adminProfiles || []).map((p: any) => p.email).filter(Boolean)));

      // 4. For each attendance record, look up learner + guardian + parents
      const learnerIds = records.map((r: any) => r.learnerId);
      const { data: learners } = await sb
        .from("learners")
        .select("id, full_name, guardian_id")
        .in("id", learnerIds);

      // 5. Look up all parent_learner_links for these learners
      const { data: parentLinks } = await sb
        .from("parent_learner_links")
        .select("learner_id, parent_user_id")
        .in("learner_id", learnerIds);

      // Build a map: learner_id -> parent_user_ids[]
      const parentMap: Record<string, string[]> = {};
      (parentLinks || []).forEach((pl: any) => {
        if (!parentMap[pl.learner_id]) parentMap[pl.learner_id] = [];
        parentMap[pl.learner_id].push(pl.parent_user_id);
      });

      // 6. Look up parent profiles for phone/email
      const allParentIds = Array.from(new Set((parentLinks || []).map((pl: any) => pl.parent_user_id)));
      const { data: parentProfiles } = allParentIds.length
        ? await sb.from("profiles").select("id, phone, email, full_name").in("id", allParentIds)
        : { data: [] };
      const parentProfileMap: Record<string, any> = {};
      (parentProfiles || []).forEach((pp: any) => { parentProfileMap[pp.id] = pp; });

      // 7. Look up guardian details
      const guardianIds = Array.from(new Set((learners || []).map((l: any) => l.guardian_id).filter(Boolean)));
      const { data: guardians } = guardianIds.length
        ? await sb.from("guardians").select("id, full_name, phone, email").in("id", guardianIds)
        : { data: [] };
      const guardianMap: Record<string, any> = {};
      (guardians || []).forEach((g: any) => { guardianMap[g.id] = g; });

      const results: any[] = [];

      for (const record of records) {
        const learner = (learners || []).find((l: any) => l.id === record.learnerId);
        if (!learner) continue;

        const learnerName = learner.full_name;
        const guardian = guardianMap[learner.guardian_id];
        const parentUserIds = parentMap[learner.id] || [];

        // Send to guardian via unifiedNotifyAttendance (email + WhatsApp + SMS)
        await unifiedNotifyAttendance(
          learnerName,
          className,
          date,
          record.status,
          guardian?.email || undefined,
          guardian?.full_name || undefined,
          guardian?.phone || undefined,
        );

        results.push({ learnerId: record.learnerId, guardianNotified: !!guardian });

        // Send to each parent auth user
        for (const parentUserId of parentUserIds) {
          const parent = parentProfileMap[parentUserId];
          if (!parent) continue;
          await unifiedNotifyAttendance(
            learnerName, className, date, record.status,
            parent.email || undefined,
            parent.full_name || undefined,
            parent.phone || undefined,
          );
        }
      }

      // 8. Send summary to class teacher and head teacher/director
      const summaryDate = new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const presentCount = records.filter((r: any) => r.status === "present").length;
      const absentCount = records.filter((r: any) => r.status === "absent").length;
      const lateCount = records.filter((r: any) => r.status === "late").length;
      const totalCount = records.length;
      const summaryLine = `Attendance marked for ${className} on ${summaryDate}: ${presentCount} present, ${absentCount} absent, ${lateCount} late (${totalCount} total)`;

      // Class teacher WhatsApp + SMS
      if (teacherPhone) {
        await sendWhatsApp(teacherPhone, summaryLine);
        const smsResult = await sendSms(teacherPhone, summaryLine);
        if (smsResult.success) results.push({ teacherNotified: true });
      }

      // Admin/head teacher/director WhatsApp + SMS
      for (const phone of adminPhones) {
        await sendWhatsApp(phone, summaryLine);
      }

      // Emails to admin/head teacher/director
      for (const email of adminEmails) {
        await sendEmail({
          to: email,
          subject: `Attendance Summary — ${className} — ${date}`,
          body: summaryLine,
          referenceType: "attendance_summary",
          referenceId: `${classId}-${date}`,
        });
      }

      // 9. In-app notifications
      // For each learner's attendance, notify class teacher + parents
      for (const record of records) {
        const learner = (learners || []).find((l: any) => l.id === record.learnerId);
        if (!learner) continue;
        const learnerName = learner.full_name;
        const msg = `${learnerName} was marked ${record.status} on ${date}`;

        // Notify class teacher
        if (cls?.teacher_id) {
          try {
            await sb.from("in_app_notifications").insert({
              user_id: cls.teacher_id,
              title: "Attendance Update",
              message: msg,
              type: "attendance",
              link: `/attendance?date=${date}`,
              created_by: null,
            });
          } catch {}
        }

        // Notify parents
        const parentIds = parentMap[learner.id] || [];
        for (const parentUserId of parentIds) {
          try {
            await sb.from("in_app_notifications").insert({
              user_id: parentUserId,
              title: "Attendance Update",
              message: msg,
              type: "attendance",
              link: `/attendance?date=${date}`,
              created_by: null,
            });
          } catch {}
        }
      }

      // Notify head teacher + directors of summary
      for (const admin of (adminProfiles || [])) {
        try {
          await sb.from("in_app_notifications").insert({
            user_id: admin.id,
            title: `Attendance Summary — ${className}`,
            message: summaryLine,
            type: "attendance",
            link: `/attendance?classId=${classId}&date=${date}`,
            created_by: null,
          });
        } catch {}
      }

      res.json({ success: true, results, summary: summaryLine });
    } catch (error: any) {
      console.error("Attendance bulk notify error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Notify gate check-in (all channels)
  app.post("/api/notify/gate-checkin", async (req, res) => {
    const { visitorName, purpose, hostName, checkInTime, securityPhone, hostPhone } = req.body;
    if (!visitorName) {
      return res.status(400).json({ success: false, message: "visitorName required" });
    }
    try {
      await unifiedNotifyGateCheckIn(
        visitorName, purpose || "", hostName || "",
        checkInTime || new Date().toISOString(),
        securityPhone, hostPhone,
      );
      res.json({ success: true, message: "Multi-channel notification sent" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Public appointment lookup (bypasses RLS via service role)
  app.get("/api/appointments/lookup", async (req, res) => {
    const { id, q } = req.query;
    if (!id && !q) {
      return res.status(400).json({ success: false, message: "id or q query param required" });
    }
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      let data: any = null;

      if (id) {
        const r = await supabase.from("appointments").select("*").eq("id", id).maybeSingle();
        if (r.error) throw r.error;
        data = r.data;
      } else {
        const query = String(q).trim().toUpperCase();
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);
        if (isUUID) {
          const r = await supabase.from("appointments").select("*").eq("id", query).maybeSingle();
          if (r.error) throw r.error;
          data = r.data;
        } else {
          const r = await supabase
            .from("appointments")
            .select("*")
            .gte("scheduled_for", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order("scheduled_for", { ascending: false })
            .limit(100);
          if (r.error) throw r.error;
          const { uuidToShortId } = require("./src/lib/shortId");
          data = (r.data || []).find((a: any) => uuidToShortId(a.id) === query) || null;
        }
      }

      if (!data) {
        return res.json({ success: false, message: "No appointment found" });
      }
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Create appointment (bypasses RLS via service role)
  app.post("/api/appointments/create", async (req, res) => {
    const { visitor_name, visitor_phone, purpose, host_name, scheduled_for, duration_minutes, status, notes } = req.body;
    if (!visitor_name || !scheduled_for || !purpose) {
      return res.status(400).json({ success: false, message: "visitor_name, purpose, and scheduled_for required" });
    }
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          visitor_name,
          visitor_phone: visitor_phone || null,
          purpose,
          host_name: host_name || null,
          scheduled_for,
          duration_minutes: duration_minutes || 30,
          status: status || "scheduled",
          notes: notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Notify appointment created (all channels)
  app.post("/api/notify/appointment", async (req, res) => {
    const { visitor_name, visitor_phone, visitor_email, purpose, scheduled_for, location, host_staff_name, adminPhones } = req.body;
    if (!visitor_name || !scheduled_for) {
      return res.status(400).json({ success: false, message: "visitor_name and scheduled_for required" });
    }
    try {
      await unifiedNotifyAppointment(
        { visitor_name, visitor_phone, visitor_email, purpose, scheduled_for, location, host_staff_name },
        adminPhones,
      );
      res.json({ success: true, message: "Multi-channel notification sent" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Notify appointment status changed (all channels)
  app.post("/api/notify/appointment-status", async (req, res) => {
    const { visitor_name, visitor_phone, visitor_email, purpose, scheduled_for, host_name, location, newStatus, changedBy } = req.body;
    if (!visitor_name || !purpose || !scheduled_for || !newStatus) {
      return res.status(400).json({ success: false, message: "visitor_name, purpose, scheduled_for, newStatus required" });
    }
    try {
      await unifiedNotifyAppointmentStatusChanged(
        { visitor_name, visitor_phone, visitor_email, purpose, scheduled_for, host_name, location },
        newStatus, changedBy,
      );
      res.json({ success: true, message: "Status notification sent" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Notify request approval (all channels)
  app.post("/api/notify/approval", async (req, res) => {
    const { requestType, requestId, status, requesterEmail, requesterName, comments, requesterPhone } = req.body;
    if (!requestType || !requestId || !status) {
      return res.status(400).json({ success: false, message: "requestType, requestId, status required" });
    }
    try {
      await unifiedNotifyRequestApproval(
        requestType, requestId, status,
        requesterEmail, requesterName, comments, requesterPhone,
      );
      res.json({ success: true, message: "Multi-channel notification sent" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ===== EMAIL NOTIFICATION ENGINE ENDPOINTS =====

  // Notify attendance recorded
  app.post("/api/email/notify/attendance", async (req, res) => {
    const { learnerName, className, date, status, guardianEmail, guardianName } = req.body;
    if (!learnerName || !date || !status) {
      return res.status(400).json({ success: false, message: "learnerName, date, status required" });
    }
    try {
      const result = await notifyAttendanceRecorded(learnerName, className || "", date, status, guardianEmail, guardianName);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Notify gate check-in
  app.post("/api/email/notify/gate-checkin", async (req, res) => {
    const { visitorName, purpose, hostName, checkInTime } = req.body;
    if (!visitorName) {
      return res.status(400).json({ success: false, message: "visitorName required" });
    }
    try {
      const result = await notifyGateCheckIn(visitorName, purpose || "", hostName || "", checkInTime || new Date().toISOString());
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Notify appointment created
  app.post("/api/email/notify/appointment", async (req, res) => {
    const { visitor_name, visitor_phone, visitor_email, purpose, scheduled_for, location, host_staff_name } = req.body;
    if (!visitor_name || !scheduled_for) {
      return res.status(400).json({ success: false, message: "visitor_name and scheduled_for required" });
    }
    try {
      const result = await notifyAppointmentCreated({ visitor_name, visitor_phone, visitor_email, purpose, scheduled_for, location, host_staff_name });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Notify lesson plan submitted
  app.post("/api/email/notify/lesson-plan-submitted", async (req, res) => {
    const { teacherName, planTitle, classSubject, planId } = req.body;
    if (!teacherName || !planTitle) {
      return res.status(400).json({ success: false, message: "teacherName, planTitle required" });
    }
    try {
      await notifyLessonPlanSubmitted(teacherName, planTitle, classSubject || "", planId || "");
      res.json({ success: true, message: "Notification sent" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Notify lesson plan reviewed (approved/rejected)
  app.post("/api/email/notify/lesson-plan-reviewed", async (req, res) => {
    const { teacherEmail, teacherName, planTitle, status, dosComments } = req.body;
    if (!planTitle || !status) {
      return res.status(400).json({ success: false, message: "planTitle, status required" });
    }
    try {
      await notifyLessonPlanReviewed(teacherEmail, teacherName, planTitle, status, dosComments);
      res.json({ success: true, message: "Notification sent" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Notify scheme of work submitted
  app.post("/api/email/notify/scheme-submitted", async (req, res) => {
    const { teacherName, topic, classSubject } = req.body;
    if (!teacherName || !topic) {
      return res.status(400).json({ success: false, message: "teacherName, topic required" });
    }
    try {
      await notifySchemeSubmitted(teacherName, topic, classSubject || "");
      res.json({ success: true, message: "Notification sent" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Notify request approval
  app.post("/api/email/notify/approval", async (req, res) => {
    const { requestType, requestId, status, requesterEmail, requesterName, comments } = req.body;
    if (!requestType || !requestId || !status) {
      return res.status(400).json({ success: false, message: "requestType, requestId, status required" });
    }
    try {
      const result = await notifyRequestApproval(requestType, requestId, status, requesterEmail, requesterName, comments);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Manually trigger daily admin report
  app.post("/api/email/report/send-daily", async (req, res) => {
    try {
      const result = await sendDailyAdminReport();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Manually process email queue
  app.post("/api/email/queue/process", async (req, res) => {
    try {
      await processEmailQueue();
      res.json({ success: true, message: "Queue processed" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Queue an email
  app.post("/api/email/queue", async (req, res) => {
    const { to, toName, subject, body, priority, processAfter } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ success: false, message: "to, subject, body required" });
    }
    try {
      const result = await queueEmail({ to, toName, subject, body }, priority, processAfter ? new Date(processAfter) : undefined);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Get email notification events
  app.get("/api/email/events", async (req, res) => {
    try {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      const { data, error, count } = await supabaseAdmin
        .from("email_notification_events")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      res.json({ success: true, data, total: count, page, limit });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // WhatsApp webhook for handling button clicks and interactive responses
  app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
      const { event, data } = req.body;
      if (event === "message" && data?.key?.fromMe === false) {
        const msgText = data.message?.conversation || "";
        const btnId = data.message?.buttonsResponseMessage?.selectedButtonId
          || data.message?.listResponseMessage?.singleSelectReply?.id
          || data.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.id
          || "";
        const from = data.key?.remoteJid?.replace(/@s\.whatsapp\.net$/, "");
        if (btnId) {
          if (btnId.startsWith("rate_")) {
            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
            await supabase.from("ratings").insert({
              reference_id: btnId.replace("rate_", ""),
              channel: "whatsapp",
              rating: 0,
              source: "button_click",
              metadata: { button: btnId, phone: from },
            });
          } else if (btnId === "call_school") {
            await sendWhatsApp(from, "📞 School Contact: +256706176631\n\nOffice hours: 8:00 AM - 4:00 PM, Mon-Thu");
          } else if (btnId === "contact_teacher") {
            await sendWhatsApp(from, "👨‍🏫 Please contact the school office at +256706176631 to arrange a meeting with the teacher.");
          } else if (btnId === "excuse") {
            await sendWhatsApp(from, "📝 Please submit your excuse to the school office or email it to info@alheibschool.org");
          } else if (btnId.startsWith("view_")) {
            const refId = btnId.replace("view_", "");
            await sendWhatsApp(from, `🔍 Track your appointment: https://alheibschool.org/track-appointment?id=${refId}`);
          }
        }
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Webhook error:", err);
      res.json({ success: true });
    }
  });

  // Configure WhatsApp webhook on Evolution API
  app.post("/api/whatsapp/configure-webhook", async (req, res) => {
    try {
      const webhookUrl = req.body.url || `https://alheibschool.org/api/whatsapp/webhook`;
      const apiRes = await fetch(
        `http://localhost:8081/webhook/set/alheib-whatsapp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: "evo_api_key_change_me_1234567890",
          },
          body: JSON.stringify({
            webhook: {
              url: webhookUrl,
              enabled: true,
              events: ["MESSAGES_UPSERT"],
            },
          }),
        },
      );
      const data = await apiRes.json();
      res.json({ success: apiRes.ok, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Rating submission endpoint
  app.post("/api/rating/submit", async (req, res) => {
    try {
      const { referenceId, rating, comment, channel } = req.body;
      if (!referenceId || !rating) {
        return res.status(400).json({ success: false, message: "referenceId and rating required" });
      }
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const { error } = await supabase.from("ratings").insert({
        reference_id: referenceId,
        rating: Math.min(5, Math.max(1, rating)),
        comment: comment || null,
        channel: channel || "api",
        source: "user_submit",
      });
      if (error) throw error;
      res.json({ success: true, message: "Rating submitted" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Get ratings for a reference
  app.get("/api/rating/:referenceId", async (req, res) => {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const { data } = await supabase
        .from("ratings")
        .select("*")
        .eq("reference_id", req.params.referenceId)
        .order("created_at", { ascending: false });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ===== VISIT REASONS & CATEGORIES =====
  app.get("/api/visit-reasons", async (req, res) => {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from("visit_reasons")
        .select("*")
        .order("category")
        .order("sort_order");
      if (error) throw error;
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/visitor-categories", async (req, res) => {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from("visitor_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/subjects-list", async (req, res) => {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, code, is_core, category, grading_type, min_class_level, max_class_level, display_order")
        .order("display_order");
      if (error) throw error;
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Use process.cwd()/dist or a configured path for production
    // When bundled with esbuild, __dirname may not work correctly
    const distPath = process.env.DIST_PATH || 
                     (fs.existsSync(path.join(__dirname, "dist")) 
                      ? path.join(__dirname, "dist") 
                      : __dirname);
    app.use(express.static(distPath, {
      maxAge: "1y",
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, must-revalidate");
        } else if (filePath.endsWith(".js") || filePath.endsWith(".css")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (filePath.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
          res.setHeader("Cache-Control", "public, max-age=86400");
        }
      },
    }));
    // Return 404 for missing static files instead of index.html (which would have wrong MIME type)
    app.use((req, res, next) => {
      if (/\.(js|css|wasm|mjs|json|ico|png|jpg|jpeg|gif|svg|webp|avif|woff2?|ttf|eot|map)$/i.test(req.path)) {
        return res.status(404).type("text").send("Not found");
      }
      next();
    });

    // Barcode scanner proxy - forwards scan requests to scanner-server
    app.get("/scan", async (req, res) => {
      try {
        const code = req.query.code || "";
        if (!code) return res.status(400).json({ success: false, message: "Missing code param" });
        const scanRes = await fetch(`http://localhost:9100/scan?code=${encodeURIComponent(code as string)}`);
        const data = await scanRes.json();
        res.status(scanRes.status).json(data);
      } catch {
        res.status(502).json({ success: false, message: "Scanner server unavailable" });
      }
    });

    // Catch-all route for SPA - must be after other routes
    // This regex ensures we don't match /api/ or /supabase/ routes
    app.get(/^\/(?!(?:api|supabase)\/).*$/, (req, res) => {
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`Error sending ${indexPath}:`, err);
          res.status(404).send("Not found");
        }
      });
    });
  }

  // ===== HIKVISION ATTENDANCE DEVICE =====

  // Test connection to the Hikvision device
  app.get("/api/hikvision/status", async (req, res) => {
    try {
      const result = await hikvisionTest();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // Manually sync attendance records from device
  app.post("/api/hikvision/sync", async (req, res) => {
    try {
      const { from, to } = req.body;
      const result = await hikvisionSync(from ? new Date(from) : undefined, to ? new Date(to) : undefined);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ synced: 0, failed: 0, errors: [e.message] });
    }
  });

  // List all employee mappings
  app.get("/api/hikvision/mappings", async (req, res) => {
    try {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from("device_employee_mapping")
        .select("*, profiles:user_id(full_name, email, phone), learners:learner_id(full_name)")
        .order("employee_no");
      if (error) throw error;
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Create or update an employee mapping
  app.post("/api/hikvision/mappings", async (req, res) => {
    try {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
      const { employee_no, user_id, learner_id, employee_name } = req.body;
      if (!employee_no) {
        return res.status(400).json({ success: false, error: "employee_no is required" });
      }
      const { data, error } = await supabase
        .from("device_employee_mapping")
        .upsert({
          employee_no,
          user_id: user_id || null,
          learner_id: learner_id || null,
          employee_name: employee_name || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "employee_no" })
        .select()
        .single();
      if (error) throw error;
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Delete a mapping
  app.delete("/api/hikvision/mappings/:id", async (req, res) => {
    try {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
      const { error } = await supabase.from("device_employee_mapping").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Start polling
  app.post("/api/hikvision/poll/start", async (req, res) => {
    try {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
      await hikvisionStartPolling(supabase);
      res.json({ success: true, message: "Polling started" });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Stop polling
  app.post("/api/hikvision/poll/stop", async (req, res) => {
    try {
      hikvisionStopPolling();
      res.json({ success: true, message: "Polling stopped" });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // ===== TEACHER CLASS-TIME NOTIFICATIONS =====
  async function sendTeacherClassReminders() {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon... 6=Sat
      if (dayOfWeek < 1 || dayOfWeek > 5) return; // Only Mon-Fri
      const currentTime = now.toTimeString().slice(0, 5);

      // Fetch teachers with classes starting in the next 10 minutes
      const { data: upcoming } = await supabase
        .from("class_timetables")
        .select(`
          id, start_time, end_time, day_of_week,
          subjects!inner(name),
          classes!inner(name),
          profiles!class_timetables_teacher_id_fkey!inner(full_name, phone)
        `)
        .eq("day_of_week", dayOfWeek)
        .gte("start_time", currentTime)
        .lte("start_time", (() => {
          const d = new Date(now.getTime() + 10 * 60 * 1000);
          return d.toTimeString().slice(0, 5);
        })())
        .not("teacher_id", "is", null);

      if (!upcoming?.length) return;

      for (const slot of upcoming) {
        const teacher = slot.profiles as any;
        if (!teacher?.phone) continue;
        const message = `Reminder: Your class "${slot.subjects?.name}" for "${slot.classes?.name}" starts at ${slot.start_time}. — Al-Heib School`;

        // Send WhatsApp
        await fetch(`http://localhost:${PORT}/api/whatsapp/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: teacher.phone, message }),
        }).catch(() => {});

        // Send SMS
        await fetch(`http://localhost:${PORT}/api/sms/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: teacher.phone, message }),
        }).catch(() => {});

        // Log in-app notification
        await supabase.from("in_app_notifications").insert({
          user_id: slot.teacher_id,
          title: "Class Starting Soon",
          message,
          type: "class_reminder",
        }).catch(() => {});
      }
    } catch {}
  }

  // Run teacher reminders every 5 minutes
  setInterval(sendTeacherClassReminders, 5 * 60 * 1000);

  // ===== APPOINTMENT REMINDERS =====
  async function sendAppointmentReminders() {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      const nowISO = now.toISOString();

      const { data: upcoming } = await supabase
        .from("appointments")
        .select("*")
        .in("status", ["scheduled", "approved"])
        .gte("scheduled_for", nowISO)
        .lte("scheduled_for", inOneHour);

      if (!upcoming?.length) return;

      for (const apt of upcoming) {
        if (apt.visitor_phone) {
          const d = new Date(apt.scheduled_for);
          const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          await fetch(`http://localhost:${PORT}/api/notify/appointment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              visitor_name: apt.visitor_name,
              visitor_phone: apt.visitor_phone,
              purpose: apt.purpose,
              scheduled_for: apt.scheduled_for,
              host_staff_name: apt.host_name,
              location: apt.location,
            }),
          }).catch(() => {});
        }
      }
    } catch {}
  }

  // Run appointment reminders every 30 minutes
  setInterval(sendAppointmentReminders, 30 * 60 * 1000);

  // ===== GLOBAL ERROR HANDLING MIDDLEWARE =====
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled error:", err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({
      error: err.message || "Internal server error",
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Configuration status
    console.log("\n========== Configuration Status ==========");
    console.log(`${SUPABASE_URL ? "✓ Supabase URL: Configured" : "✗ Supabase URL: MISSING"}`);
    console.log(`${SUPABASE_SERVICE_ROLE_KEY ? "✓ Service Role Key: Configured" : "✗ Service Role Key: MISSING - Password updates will fail!"}`);
    console.log("==========================================\n");

    initEmailEngine();
    try {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
      hikvisionStartPolling(supabase).catch(e => console.error("Hikvision init error:", e.message));
    } catch (e: any) {
      console.error("Hikvision init error:", e.message);
    }
  });

  // Forward WebSocket upgrade events to the Supabase proxy
  server.on("upgrade", (req, socket, head) => {
    if (req.url?.startsWith("/supabase")) {
      supabaseProxy.upgrade(req, socket, head);
    }
  });
}

startServer();
