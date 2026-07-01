export function generateSku(prefix = "SKU"): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export function generateTrackingNumber(type: string): string {
  const prefix =
    type === "issuance" ? "ISS" :
    type === "restock" ? "REC" :
    type === "return" ? "RET" :
    type === "adjustment" ? "ADJ" :
    type === "damage" ? "DMG" : "TRX";
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}
