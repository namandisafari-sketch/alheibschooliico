const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8081";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "evo_api_key_change_me_1234567890";
const WHATSAPP_INSTANCE = process.env.WHATSAPP_INSTANCE || "alheib-whatsapp";

export interface WhatsAppResult {
  success: boolean;
  message: string;
  messageId?: string;
}

async function sendWhatsAppText(to: string, text: string): Promise<WhatsAppResult> {
  const number = to.replace(/[^0-9]/g, "");
  if (!number) return { success: false, message: "Invalid phone number" };

  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${WHATSAPP_INSTANCE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({ number, text }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || `WhatsApp API error (${res.status})` };
    }
    return {
      success: true,
      message: `WhatsApp message sent to ${number}`,
      messageId: data.key?.id,
    };
  } catch (err: any) {
    return { success: false, message: `WhatsApp send failed: ${err.message}` };
  }
}

export async function sendWhatsApp(
  to: string,
  text: string,
): Promise<WhatsAppResult> {
  return sendWhatsAppText(to, text);
}

export async function sendBulkWhatsApp(
  recipients: { number: string; text: string }[],
): Promise<{ success: boolean; results: WhatsAppResult[] }> {
  const results: WhatsAppResult[] = [];
  for (const r of recipients) {
    const result = await sendWhatsAppText(r.number, r.text);
    results.push(result);
  }
  return { success: results.some((r) => r.success), results };
}

export async function sendWhatsAppToGroup(
  groupJid: string,
  text: string,
): Promise<WhatsAppResult> {
  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${WHATSAPP_INSTANCE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({ number: groupJid, text }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || `WhatsApp group error (${res.status})` };
    }
    return { success: true, message: `WhatsApp group message sent`, messageId: data.key?.id };
  } catch (err: any) {
    return { success: false, message: `WhatsApp group send failed: ${err.message}` };
  }
}

export interface WhatsAppButton {
  id: string;
  displayText: string;
}

export async function sendWhatsAppButtons(
  to: string,
  title: string,
  description: string,
  buttons: WhatsAppButton[],
  footer?: string,
): Promise<WhatsAppResult> {
  const number = to.replace(/[^0-9]/g, "");
  if (!number) return { success: false, message: "Invalid phone number" };

  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/message/sendButtons/${WHATSAPP_INSTANCE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number,
          title,
          description,
          footer: footer || "Al-Heib Islamic Primary School",
          buttons: buttons.map((b) => ({
            type: "reply",
            id: b.id,
            displayText: b.displayText,
          })),
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || `WhatsApp buttons error (${res.status})` };
    }
    return {
      success: true,
      message: `WhatsApp buttons sent to ${number}`,
      messageId: data.key?.id,
    };
  } catch (err: any) {
    return { success: false, message: `WhatsApp buttons send failed: ${err.message}` };
  }
}

export async function sendWhatsAppImage(
  to: string,
  imageBase64: string,
  caption?: string,
): Promise<WhatsAppResult> {
  const number = to.replace(/[^0-9]/g, "");
  if (!number) return { success: false, message: "Invalid phone number" };

  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/message/sendMedia/${WHATSAPP_INSTANCE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number,
          mediatype: "image",
          media: imageBase64,
          caption: caption || "",
          fileName: "alheib_notification.png",
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || `WhatsApp image error (${res.status})` };
    }
    return {
      success: true,
      message: `WhatsApp image sent to ${number}`,
      messageId: data.key?.id,
    };
  } catch (err: any) {
    return { success: false, message: `WhatsApp image send failed: ${err.message}` };
  }
}

export async function getWhatsAppStatus(): Promise<{ connected: boolean; instance: string }> {
  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/instance/connectionState/${WHATSAPP_INSTANCE}`,
      { headers: { apikey: EVOLUTION_API_KEY } },
    );
    const data = await res.json();
    return {
      connected: data.instance?.state === "open",
      instance: WHATSAPP_INSTANCE,
    };
  } catch {
    return { connected: false, instance: WHATSAPP_INSTANCE };
  }
}
