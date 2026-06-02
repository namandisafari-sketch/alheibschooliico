import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const portArgIdx = process.argv.indexOf("--port");
  const PORT = Number(
    (portArgIdx !== -1 && process.argv[portArgIdx + 1]) ||
      process.env.PORT ||
      3000
  );

  app.use(express.json());

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

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
