// Admin allowlist. Hanya email-email di sini yang boleh akses admin panel.
// Bisa ditimpa via env var ADMIN_EMAILS = "a@x.com,b@y.com"
const HARDCODED_ADMINS = ["satriyan27@gmail.com"];

function envAdmins(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function adminEmails(): string[] {
  const fromEnv = envAdmins();
  const all = new Set<string>([
    ...HARDCODED_ADMINS.map((s) => s.toLowerCase()),
    ...fromEnv,
  ]);
  return Array.from(all);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
