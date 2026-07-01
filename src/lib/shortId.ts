const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ID_LENGTH = 6;

export function generateShortId(): string {
  let result = "";
  for (let i = 0; i < ID_LENGTH; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

export async function generateUniqueShortId(
  checkExists: (id: string) => Promise<boolean>,
  maxRetries = 10
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const id = generateShortId();
    const exists = await checkExists(id);
    if (!exists) return id;
  }
  throw new Error("Failed to generate unique short ID after retries");
}

export function uuidToShortId(uuid: string): string {
  const hex = uuid.replace(/-/g, "").substring(0, 6).toUpperCase();
  return hex;
}
