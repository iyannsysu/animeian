import { kv } from "@/lib/kv";
import type { Comment } from "@/app/api/comments/[series]/route";
import { computeLevel, levelProgress, tierFor } from "@/lib/level";

export type StoredUser = {
  id: string;
  name: string;
  image: string | null;
  email?: string;
  joinedAt: number;
  updatedAt: number;
};

function userKey(id: string) {
  return `user:${id}`;
}
function watchKey(id: string) {
  return `user:${id}:watch_seconds`;
}
function userCommentsKey(id: string) {
  return `user:${id}:comments`;
}

export async function touchUser(input: {
  id: string;
  name: string;
  image?: string | null;
  email?: string;
}): Promise<StoredUser | null> {
  if (!kv.available) return null;
  const now = Date.now();
  const existing = (await kv.get<StoredUser>(userKey(input.id))) ?? null;
  const next: StoredUser = {
    id: input.id,
    name: input.name,
    image: input.image ?? existing?.image ?? null,
    email: input.email ?? existing?.email,
    joinedAt: existing?.joinedAt ?? now,
    updatedAt: now,
  };
  await kv.set(userKey(input.id), next);
  return next;
}

export async function getStoredUser(id: string): Promise<StoredUser | null> {
  if (!kv.available) return null;
  return (await kv.get<StoredUser>(userKey(id))) ?? null;
}

export async function getWatchSeconds(id: string): Promise<number> {
  if (!kv.available) return 0;
  const v = await kv.get<number | string>(watchKey(id));
  return Number(v ?? 0) || 0;
}

export async function incrementWatchSeconds(
  id: string,
  seconds: number
): Promise<number> {
  if (!kv.available) return 0;
  const delta = Math.max(0, Math.min(30, Math.floor(seconds)));
  if (!delta) return await getWatchSeconds(id);
  // Simpan sebagai string integer agar bisa dibaca oleh GET
  const prev = await getWatchSeconds(id);
  const next = prev + delta;
  await kv.set(watchKey(id), String(next));
  return next;
}

export type PublicProfile = {
  id: string;
  name: string;
  image: string | null;
  joinedAt: number;
  watchSeconds: number;
  level: number;
  tierName: string;
  progress: { pct: number; withinSec: number; spanSec: number };
  commentCount: number;
};

export async function getPublicProfile(
  id: string
): Promise<PublicProfile | null> {
  if (!kv.available) return null;
  const user = await getStoredUser(id);
  if (!user) return null;
  const watchSeconds = await getWatchSeconds(id);
  const prog = levelProgress(watchSeconds);
  const comments = await kv.lrange<Pick<Comment, "id" | "body" | "createdAt"> & { series: string }>(
    userCommentsKey(id),
    0,
    0
  );
  // We only need count; fetch length separately via LRANGE 0 -1 length shortcut
  const allCommentRefs = await kv.lrangeRaw(userCommentsKey(id), 0, -1);
  void comments;
  return {
    id: user.id,
    name: user.name,
    image: user.image,
    joinedAt: user.joinedAt,
    watchSeconds,
    level: prog.level,
    tierName: prog.tier.name,
    progress: { pct: prog.pct, withinSec: prog.withinSec, spanSec: prog.spanSec },
    commentCount: allCommentRefs.length,
  };
}

export type UserCommentRef = {
  id: string;
  series: string;
  body: string;
  createdAt: number;
};

export async function listUserComments(
  id: string,
  limit = 30
): Promise<UserCommentRef[]> {
  if (!kv.available) return [];
  const items = await kv.lrange<UserCommentRef>(userCommentsKey(id), 0, limit - 1);
  return items;
}

export { computeLevel, tierFor, levelProgress };
