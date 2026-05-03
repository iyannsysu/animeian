import { kv } from "@/lib/kv";

function key(series: string) {
  return `views:${series}`;
}

export type RankingWindow = "week" | "month" | "all";

function isoWeek(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function yearMonth(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function rankingKey(win: RankingWindow, now = new Date()): string {
  if (win === "week") return `ranking:week:${isoWeek(now)}`;
  if (win === "month") return `ranking:month:${yearMonth(now)}`;
  return `ranking:all`;
}

// Roughly: week bucket expires ~21 days from first write (covers one full period).
const WEEK_TTL = 60 * 60 * 24 * 21;
const MONTH_TTL = 60 * 60 * 24 * 95;

export async function incrementView(series: string): Promise<number> {
  if (!kv.available || !series) return 0;
  const count = await kv.incr(key(series));
  const now = new Date();
  const weekKey = rankingKey("week", now);
  const monthKey = rankingKey("month", now);
  const allKey = rankingKey("all", now);
  // Fire-and-forget; ranking updates are best-effort.
  await Promise.allSettled([
    kv.zincrby(weekKey, 1, series).then(() => kv.expire(weekKey, WEEK_TTL)),
    kv.zincrby(monthKey, 1, series).then(() => kv.expire(monthKey, MONTH_TTL)),
    kv.zincrby(allKey, 1, series),
  ]);
  return count;
}

export async function getViewCount(series: string): Promise<number> {
  if (!kv.available || !series) return 0;
  const v = await kv.get<string | number>(key(series));
  return Number(v ?? 0) || 0;
}

export async function getViewCounts(
  seriesList: string[]
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  if (!kv.available) return out;
  const keys = seriesList.map((s) => key(s));
  const vals = await kv.mget<string | number>(keys);
  seriesList.forEach((s, i) => {
    out[s] = Number(vals[i] ?? 0) || 0;
  });
  return out;
}

export async function getTopRanked(
  win: RankingWindow,
  limit = 10,
  now = new Date()
): Promise<Array<{ series: string; score: number }>> {
  if (!kv.available) return [];
  const k = rankingKey(win, now);
  const rows = await kv.zrevrangeWithScores(k, 0, limit - 1);
  return rows.map((r) => ({ series: r.member, score: r.score }));
}

export function formatViews(n: number): string {
  if (!n) return "0";
  if (n < 1000) return String(n);
  if (n < 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  if (n < 1_000_000) return Math.floor(n / 1000) + "k";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}
