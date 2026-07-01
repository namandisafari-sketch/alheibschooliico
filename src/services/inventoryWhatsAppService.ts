interface WhatsAppResult {
  success: boolean;
  message: string;
  messageId?: string;
}

const STORE_PHONE = import.meta.env.VITE_WHATSAPP_STORE_PHONE || "+256700000000";

async function sendViaBackend(to: string, text: string): Promise<WhatsAppResult> {
  try {
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, text }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || `API error (${res.status})` };
    }
    return data;
  } catch (err: any) {
    return { success: false, message: `WhatsApp send failed: ${err.message}` };
  }
}

export async function checkWhatsAppConnection(): Promise<{ connected: boolean; instance: string }> {
  try {
    const res = await fetch("/api/whatsapp/status");
    if (!res.ok) return { connected: false, instance: "unknown" };
    return await res.json();
  } catch {
    return { connected: false, instance: "unknown" };
  }
}

export async function sendLowStockAlert(itemName: string, qty: number, minStock: number, unit: string) {
  const message = `⚠️ *INVENTORY ALERT — Low Stock*\n\nItem: ${itemName}\nCurrent: ${qty} ${unit}\nThreshold: ${minStock} ${unit}\n\nAction required: Please restock immediately.`;
  return sendViaBackend(STORE_PHONE, message);
}

export async function sendIssuanceApprovalNotification(
  itemName: string,
  qty: number,
  recipient: string,
  trackingRef: string,
  phone?: string
) {
  const message = `✅ *ISSUANCE APPROVED*\n\nItem: ${itemName}\nQty: ${qty}\nFor: ${recipient}\nRef: ${trackingRef}\n\nThis item has been cleared for dispatch.`;
  const target = phone || STORE_PHONE;
  return sendViaBackend(target, message);
}

export async function sendStockReceiptNotification(
  itemName: string,
  qty: number,
  supplier: string,
  grnRef: string
) {
  const message = `📦 *GOODS RECEIVED*\n\nItem: ${itemName}\nQty: ${qty}\nSupplier: ${supplier}\nGRN: ${grnRef}\n\nStock has been updated.`;
  return sendViaBackend(STORE_PHONE, message);
}

export async function sendGatePassAlert(
  itemName: string,
  qty: number,
  trackingRef: string,
  recipient: string
) {
  const message = `🚪 *GATE PASS ISSUED*\n\nItem: ${itemName}\nQty: ${qty}\nRecipient: ${recipient}\nRef: ${trackingRef}\n\nVerify QR at security checkpoint before exit.`;
  return sendViaBackend(STORE_PHONE, message);
}
