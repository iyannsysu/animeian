// Admin allowlist. Sumber email admin:
//   1. Hardcoded (owner) — tidak bisa dihapus dari panel
//   2. Env var ADMIN_EMAILS = "a@x.com,b@y.com"
//   3. Dynamic via Redis SET "admins:emails" (bisa ditambah/hapus dari panel)
//
// Selain itu kita juga maintain set "admins:userIds" untuk cek cepat
// status admin per userId tanpa harus tahu emailnya — dipakai di komentar /
// leaderboard / profil publik untuk warna nama merah.
import { kv } from "@/lib/kv";
import { hashEmailId } from "@/lib/auth";

const HARDCODED_ADMINS = ["satriyan27@gmail.com"];
const ADMIN_EMAIL_SET = "admins:emails";
const ADMIN_USERID_SET = "admins:userIds";

function envAdmins(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function staticAdminEmails(): string[] {
  const all = new Set<string>([
    ...HARDCODED_ADMINS.map((s) => s.toLowerCase()),
    ...envAdmins(),
  ]);
  return Array.from(all);
}

/** Daftar admin dari sumber statis (hardcoded + env). Sync. */
export function adminEmails(): string[] {
  return staticAdminEmails();
}

/** Cek admin dari sumber statis saja (sync). Aman dipanggil di runtime
 *  Edge tanpa hit Redis. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return staticAdminEmails().includes(email.toLowerCase());
}

/** Daftar admin lengkap: static + dynamic (Redis). Async. */
export async function getAllAdminEmails(): Promise<string[]> {
  const stat = staticAdminEmails();
  if (!kv.available) return stat;
  const dyn = await kv.smembers(ADMIN_EMAIL_SET);
  const all = new Set<string>([...stat, ...dyn.map((s) => s.toLowerCase())]);
  return Array.from(all);
}

/** Cek admin termasuk dynamic. Async. */
export async function isAdminEmailAsync(
  email: string | null | undefined
): Promise<boolean> {
  if (!email) return false;
  const e = email.toLowerCase();
  if (staticAdminEmails().includes(e)) return true;
  if (!kv.available) return false;
  return kv.sismember(ADMIN_EMAIL_SET, e);
}

/** Apakah email termasuk hardcoded/env (tidak bisa dihapus via panel)? */
export function isImmutableAdminEmail(email: string): boolean {
  return staticAdminEmails().includes(email.toLowerCase());
}

/** Tambah email admin ke set dinamis. Auto-sync userId admin set. */
export async function addAdminEmailKV(email: string): Promise<void> {
  if (!kv.available) return;
  const e = email.trim().toLowerCase();
  if (!e || !e.includes("@")) return;
  await kv.sadd(ADMIN_EMAIL_SET, e);
  // Tag userId-nya juga supaya warna nama merah langsung kepasang
  await kv.sadd(ADMIN_USERID_SET, hashEmailId(e));
}

/** Hapus email admin dari set dinamis. Tidak bisa hapus hardcoded/env. */
export async function removeAdminEmailKV(email: string): Promise<boolean> {
  if (!kv.available) return false;
  const e = email.trim().toLowerCase();
  if (!e) return false;
  if (isImmutableAdminEmail(e)) return false;
  await kv.srem(ADMIN_EMAIL_SET, e);
  await kv.srem(ADMIN_USERID_SET, hashEmailId(e));
  return true;
}

/** Sync userId admin saat user login / komentar. Idempotent. */
export async function syncAdminUserId(
  userId: string,
  email: string | null | undefined
): Promise<void> {
  if (!kv.available || !userId) return;
  const isAdmin = await isAdminEmailAsync(email);
  if (isAdmin) await kv.sadd(ADMIN_USERID_SET, userId);
  else await kv.srem(ADMIN_USERID_SET, userId);
}

/** Ambil set userId admin (untuk render warna nama merah). */
export async function getAdminUserIds(): Promise<Set<string>> {
  if (!kv.available) return new Set();
  // Hardcoded juga di-include via hash kalau kebetulan email diketahui
  const ids = await kv.smembers(ADMIN_USERID_SET);
  const set = new Set(ids);
  for (const e of staticAdminEmails()) set.add(hashEmailId(e));
  return set;
}

export const ADMIN_EMAIL_KEYS = {
  ADMIN_EMAIL_SET,
  ADMIN_USERID_SET,
};
