import { kv } from "./kv";

/**
 * Achievement system — milestone-based badges yang diberikan otomatis
 * berdasarkan aktivitas user.
 *
 * Storage:
 * - Redis SET `ach:${userId}` = set of achievement keys yang sudah didapat
 * - Total bisa di-listing & ditampilkan di profile.
 */

export type AchievementKey =
  | "first_comment"
  | "comment_10"
  | "comment_100"
  | "like_received_10"
  | "like_received_100"
  | "watch_1h"
  | "watch_10h"
  | "watch_100h"
  | "watch_500h"
  | "list_5"
  | "list_25"
  | "list_100"
  | "follower_5"
  | "follower_25"
  | "follower_100"
  | "verified"
  | "level_50"
  | "level_500"
  | "level_1000";

export type AchievementDef = {
  key: AchievementKey;
  name: string;
  desc: string;
  emoji: string;
  /** Tailwind classes untuk warna chip */
  color: string;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first_comment", name: "Sapaan Pertama", desc: "Tulis komentar pertama", emoji: "💬", color: "border-indigo-400/40 bg-indigo-500/15 text-indigo-200" },
  { key: "comment_10", name: "Aktif Diskusi", desc: "Tulis 10 komentar", emoji: "🗨️", color: "border-indigo-400/40 bg-indigo-500/15 text-indigo-200" },
  { key: "comment_100", name: "Tukang Komen", desc: "Tulis 100 komentar", emoji: "📣", color: "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-200" },
  { key: "like_received_10", name: "Disukai", desc: "Dapat 10 like", emoji: "❤️", color: "border-rose-400/40 bg-rose-500/15 text-rose-200" },
  { key: "like_received_100", name: "Selebgram Anime", desc: "Dapat 100 like", emoji: "💖", color: "border-rose-400/40 bg-rose-500/15 text-rose-200" },
  { key: "watch_1h", name: "Pemanasan", desc: "1 jam nonton", emoji: "▶️", color: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" },
  { key: "watch_10h", name: "10 Jam Anime", desc: "10 jam nonton", emoji: "⏱️", color: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" },
  { key: "watch_100h", name: "100 Jam Otaku", desc: "100 jam nonton", emoji: "🔥", color: "border-amber-400/40 bg-amber-500/15 text-amber-200" },
  { key: "watch_500h", name: "Tahta Nonton", desc: "500 jam nonton", emoji: "👑", color: "border-amber-400/40 bg-amber-500/15 text-amber-200" },
  { key: "list_5", name: "Mulai Koleksi", desc: "5 anime di daftar", emoji: "📚", color: "border-cyan-400/40 bg-cyan-500/15 text-cyan-200" },
  { key: "list_25", name: "Kolektor", desc: "25 anime di daftar", emoji: "🗂️", color: "border-cyan-400/40 bg-cyan-500/15 text-cyan-200" },
  { key: "list_100", name: "Database Berjalan", desc: "100 anime di daftar", emoji: "📖", color: "border-sky-400/40 bg-sky-500/15 text-sky-200" },
  { key: "follower_5", name: "Mulai Terkenal", desc: "5 followers", emoji: "🌟", color: "border-violet-400/40 bg-violet-500/15 text-violet-200" },
  { key: "follower_25", name: "Influencer Pemula", desc: "25 followers", emoji: "⭐", color: "border-violet-400/40 bg-violet-500/15 text-violet-200" },
  { key: "follower_100", name: "Selebriti", desc: "100 followers", emoji: "✨", color: "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-200" },
  { key: "verified", name: "Terverifikasi", desc: "Dapat centang biru", emoji: "✔️", color: "border-sky-400/40 bg-sky-500/15 text-sky-200" },
  { key: "level_50", name: "Level 50", desc: "Capai level 50", emoji: "🆙", color: "border-teal-400/40 bg-teal-500/15 text-teal-200" },
  { key: "level_500", name: "Level 500", desc: "Capai level 500", emoji: "🚀", color: "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-200" },
  { key: "level_1000", name: "Level 1000", desc: "Capai level 1000", emoji: "🏆", color: "border-amber-400/40 bg-amber-500/15 text-amber-200" },
];

const ACH_BY_KEY = new Map<string, AchievementDef>(
  ACHIEVEMENTS.map((a) => [a.key, a])
);

export function getAchievementDef(k: string): AchievementDef | undefined {
  return ACH_BY_KEY.get(k);
}

function key(userId: string) {
  return `ach:${userId}`;
}

export async function listAchievements(userId: string): Promise<AchievementKey[]> {
  if (!kv.available) return [];
  const arr = await kv.smembers(key(userId));
  return arr as AchievementKey[];
}

/**
 * Grant achievement(s) ke user. Idempotent — tidak akan duplikat.
 * Mengembalikan list achievement BARU yang baru saja didapat (untuk dipakai
 * push notif).
 */
export async function grantAchievements(
  userId: string,
  keys: AchievementKey[]
): Promise<AchievementKey[]> {
  if (!kv.available || keys.length === 0) return [];
  const existing = new Set(await listAchievements(userId));
  const fresh = keys.filter((k) => !existing.has(k));
  if (fresh.length === 0) return [];
  await Promise.all(fresh.map((k) => kv.sadd(key(userId), k)));
  return fresh;
}

/**
 * Threshold helpers — komputasi keys mana yang HARUS dimiliki berdasarkan stats.
 * Caller bisa kirim sebagian stats; key yang tidak applicable akan di-skip.
 */
export function thresholdKeys(stats: {
  comments?: number;
  likesReceived?: number;
  watchSeconds?: number;
  listCount?: number;
  followers?: number;
  level?: number;
  verified?: boolean;
}): AchievementKey[] {
  const out: AchievementKey[] = [];
  const c = stats.comments ?? 0;
  if (c >= 1) out.push("first_comment");
  if (c >= 10) out.push("comment_10");
  if (c >= 100) out.push("comment_100");
  const l = stats.likesReceived ?? 0;
  if (l >= 10) out.push("like_received_10");
  if (l >= 100) out.push("like_received_100");
  const w = stats.watchSeconds ?? 0;
  if (w >= 3600) out.push("watch_1h");
  if (w >= 36000) out.push("watch_10h");
  if (w >= 360000) out.push("watch_100h");
  if (w >= 1800000) out.push("watch_500h");
  const ls = stats.listCount ?? 0;
  if (ls >= 5) out.push("list_5");
  if (ls >= 25) out.push("list_25");
  if (ls >= 100) out.push("list_100");
  const f = stats.followers ?? 0;
  if (f >= 5) out.push("follower_5");
  if (f >= 25) out.push("follower_25");
  if (f >= 100) out.push("follower_100");
  if (stats.verified) out.push("verified");
  const lv = stats.level ?? 0;
  if (lv >= 50) out.push("level_50");
  if (lv >= 500) out.push("level_500");
  if (lv >= 1000) out.push("level_1000");
  return out;
}
