import { kv } from "@/lib/kv";

/**
 * Reaksi emoji per komentar (di luar ❤️ yang sudah ada via like).
 * Storage:
 *   react:{series}:{commentId}        HASH { emoji: count }
 *   react_user:{series}:{commentId}:{userId}  STRING "🔥,😂"
 *
 * Setiap user boleh react banyak emoji berbeda di satu komen,
 * tapi tidak boleh react emoji yang sama 2x (toggle).
 */

export const REACTION_EMOJIS = ["👍", "🔥", "😂", "😢", "🎉"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export function isValidReaction(s: unknown): s is ReactionEmoji {
  return (
    typeof s === "string" && (REACTION_EMOJIS as readonly string[]).includes(s)
  );
}

export type ReactionsState = {
  /** count per emoji */
  counts: Record<string, number>;
  /** emoji yang sudah di-react oleh viewer (bisa multi) */
  mine: string[];
};

function countsKey(series: string, commentId: string) {
  return `react:${series}:${commentId}`;
}
function userKey(series: string, commentId: string, userId: string) {
  return `react_user:${series}:${commentId}:${userId}`;
}

/**
 * Toggle reaksi user terhadap satu komen.
 * Return state baru (counts + mine list).
 */
export async function toggleReaction(
  series: string,
  commentId: string,
  userId: string,
  emoji: ReactionEmoji
): Promise<ReactionsState> {
  if (!kv.available)
    return { counts: {}, mine: [] };

  const uKey = userKey(series, commentId, userId);
  const cur = (await kv.get<string>(uKey)) ?? "";
  const myArr = cur ? cur.split(",").filter(Boolean) : [];
  const has = myArr.includes(emoji);

  let nextMine: string[];
  if (has) {
    nextMine = myArr.filter((e) => e !== emoji);
    await kv.hincrby(countsKey(series, commentId), emoji, -1);
  } else {
    nextMine = [...myArr, emoji];
    await kv.hincrby(countsKey(series, commentId), emoji, 1);
  }

  if (nextMine.length) {
    await kv.set(uKey, nextMine.join(","));
  } else {
    await kv.del(uKey);
  }

  return await getReactions(series, commentId, userId);
}

export async function getReactions(
  series: string,
  commentId: string,
  viewerId?: string | null
): Promise<ReactionsState> {
  if (!kv.available) return { counts: {}, mine: [] };
  const counts = await kv.hgetall<Record<string, number | string>>(
    countsKey(series, commentId)
  );
  const cleaned: Record<string, number> = {};
  for (const [k, v] of Object.entries(counts)) {
    const n = Number(v) || 0;
    if (n > 0) cleaned[k] = n;
  }
  let mine: string[] = [];
  if (viewerId) {
    const cur = await kv.get<string>(userKey(series, commentId, viewerId));
    if (cur) mine = cur.split(",").filter(Boolean);
  }
  return { counts: cleaned, mine };
}

/** Hapus semua reaksi untuk satu komen (dipakai ketika komen dihapus). */
export async function clearReactions(
  series: string,
  commentId: string
): Promise<void> {
  if (!kv.available) return;
  await kv.del(countsKey(series, commentId));
}
