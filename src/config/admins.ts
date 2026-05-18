
export const ADMIN_EMAILS = [
  "muslim.ummahlink@gmail.com",
  "admin@ummahlink.app",
  "admin@alhebi.com",
  "info.kabejjasystems@gmail.com",
  "papa@alheib.teacher",
  "admin@alheib.com",
  "alhebiadmin@gmail.com",
  "muslim.ummahlink@ummahlink.app"
];

export const isWhitelistedAdmin = (email?: string | null) => {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  return ADMIN_EMAILS.includes(cleanEmail);
};
