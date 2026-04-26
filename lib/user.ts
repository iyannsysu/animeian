import { kv } from "@/lib/kv";
import type { Comment } from "@/app/api/comments/[series]/route";
import { computeLevel, levelProgress, tierFor } from "@/lib/level";
import { syncAdminUserId } from "@/lib/admin";

/**
 * StoredUser:
 * - name/image dari Google (provider)
 * - nameOverride/imageOverride: ditimpa user via /profile (form ganti nama+foto)
 * - lastActiveAt: untuk status "Sedang aktif"
 * - likesReceived: cache total like di komentar user
 */
export type StoredUser = {
  id: string;
  name: string;
  image: string | null;
  email?: string;
  joinedAt: number;
  updatedAt: number;
  nameOverride?: string;
  imageOverride?: string;
  lastActiveAt?: number;
  likesReceived?: number;
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
function followersKey(id: string) {
  return `user:${id}:followers`;
}
function followingKey(id: string) {
  return `user:${id}:following`;
}

/**
 * Resolve nama + foto yang ditampilkan ke publik.
 * Override (kalau ada) selalu menang dari Google default.
 */
export function resolveDisplayUser(u: StoredUser): {
  name: string;
  image: string | null;
} {
  return {
    name: (u.nameOverride && u.nameOverride.trim()) || u.name,
    image: u.imageOverride || u.image,
  };
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
    nameOverride: existing?.nameOverride,
    imageOverride: existing?.imageOverride,
    lastActiveAt: now,
    likesReceived: existing?.likesReceived ?? 0,
  };
  await kv.set(userKey(input.id), next);
  // Daftar registry user untuk admin panel
  await kv.sadd("users:all", input.id);
  // Sync admin userId set (kalau email di allowlist, tag sebagai admin)
  if (next.email) {
    await syncAdminUserId(input.id, next.email);
  }
  return next;
}

/**
 * Update presence (lastActiveAt) tanpa menulis ulang seluruh record.
 * Dipanggil oleh heartbeat / page load.
 */
export async function pingPresence(id: string): Promise<void> {
  if (!kv.available || !id) return;
  const existing = await getStoredUser(id);
  if (!existing) return;
  await kv.set(userKey(id), { ...existing, lastActiveAt: Date.now() });
}

/**
 * Update display name & image override.
 * `name` null → reset ke Google default. Kalau string → dipakai.
 * `image` sama: null reset, string dipakai.
 */
export async function updateUserOverrides(
  id: string,
  patch: { name?: string | null; image?: string | null }
): Promise<StoredUser | null> {
  if (!kv.available) return null;
  const existing = await getStoredUser(id);
  if (!existing) return null;
  const next: StoredUser = { ...existing };
  if (patch.name !== undefined) {
    if (patch.name === null || patch.name.trim() === "") {
      delete next.nameOverride;
    } else {
      next.nameOverride = patch.name.trim().slice(0, 40);
    }
  }
  if (patch.image !== undefined) {
    if (patch.image === null || patch.image.trim() === "") {
      delete next.imageOverride;
    } else {
      next.imageOverride = patch.image;
    }
  }
  next.updatedAt = Date.now();
  await kv.set(userKey(id), next);
  return next;
}

export async function incLikesReceived(
  id: string,
  delta: number
): Promise<number> {
  if (!kv.available || !id) return 0;
  const existing = await getStoredUser(id);
  if (!existing) return 0;
  const next = Math.max(0, (existing.likesReceived ?? 0) + delta);
  await kv.set(userKey(id), { ...existing, likesReceived: next });
  return next;
}

export async function setWatchSeconds(
  id: string,
  seconds: number
): Promise<number> {
  if (!kv.available) return 0;
  const v = Math.max(0, Math.floor(seconds));
  await kv.set(watchKey(id), String(v));
  return v;
}

export async function listAllUsers(): Promise<StoredUser[]> {
  if (!kv.available) return [];
  const ids = await kv.smembers("users:all");
  if (!ids.length) return [];
  const users = await Promise.all(ids.map((id) => getStoredUser(id)));
  return users.filter((u): u is StoredUser => !!u);
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

// ===== Follow =====

export async function followUser(
  followerId: string,
  targetId: string
): Promise<{ following: boolean; followers: number }> {
  if (!kv.available || !followerId || !targetId || followerId === targetId) {
    return { following: false, followers: 0 };
  }
  await Promise.all([
    kv.sadd(followersKey(targetId), followerId),
    kv.sadd(followingKey(followerId), targetId),
  ]);
  const followers = await kv.scard(followersKey(targetId));
  return { following: true, followers };
}

export async function unfollowUser(
  followerId: string,
  targetId: string
): Promise<{ following: boolean; followers: number }> {
  if (!kv.available || !followerId || !targetId) {
    return { following: false, followers: 0 };
  }
  await Promise.all([
    kv.srem(followersKey(targetId), followerId),
    kv.srem(followingKey(followerId), targetId),
  ]);
  const followers = await kv.scard(followersKey(targetId));
  return { following: false, followers };
}

export async function getFollowStats(
  id: string,
  viewerId?: string | null
): Promise<{
  followers: number;
  following: number;
  isFollowing: boolean;
}> {
  if (!kv.available) return { followers: 0, following: 0, isFollowing: false };
  const [followers, following, isFollowing] = await Promise.all([
    kv.scard(followersKey(id)),
    kv.scard(followingKey(id)),
    viewerId && viewerId !== id
      ? kv.sismember(followersKey(id), viewerId)
      : Promise.resolve(false),
  ]);
  return { followers, following, isFollowing };
}

// ===== History stats =====

export async function getHistoryStats(id: string): Promise<{
  totalEpisodes: number;
  totalSeries: number;
}> {
  if (!kv.available) return { totalEpisodes: 0, totalSeries: 0 };
  const map = await kv.hgetall<Record<string, { series?: string }>>(
    `history:${id}`
  );
  const entries = Object.values(map).filter(
    (e): e is { series?: string } => !!e
  );
  const series = new Set(
    entries.map((e) => e.series).filter((s): s is string => !!s)
  );
  return { totalEpisodes: entries.length, totalSeries: series.size };
}

// ===== Public profile =====

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
  lastActiveAt: number | null;
  likesReceived: number;
  followers: number;
  following: number;
  isFollowing: boolean;
  totalEpisodes: number;
  totalSeries: number;
};

export async function getPublicProfile(
  id: string,
  viewerId?: string | null
): Promise<PublicProfile | null> {
  if (!kv.available) return null;
  const user = await getStoredUser(id);
  if (!user) return null;
  const display = resolveDisplayUser(user);

  const [
    watchSeconds,
    allCommentRefs,
    follow,
    historyStats,
  ] = await Promise.all([
    getWatchSeconds(id),
    kv.lrangeRaw(userCommentsKey(id), 0, -1),
    getFollowStats(id, viewerId),
    getHistoryStats(id),
  ]);
  const prog = levelProgress(watchSeconds);

  return {
    id: user.id,
    name: display.name,
    image: display.image,
    joinedAt: user.joinedAt,
    watchSeconds,
    level: prog.level,
    tierName: prog.tier.name,
    progress: { pct: prog.pct, withinSec: prog.withinSec, spanSec: prog.spanSec },
    commentCount: allCommentRefs.length,
    lastActiveAt: user.lastActiveAt ?? user.updatedAt ?? null,
    likesReceived: user.likesReceived ?? 0,
    followers: follow.followers,
    following: follow.following,
    isFollowing: follow.isFollowing,
    totalEpisodes: historyStats.totalEpisodes,
    totalSeries: historyStats.totalSeries,
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
  // Ambil sedikit lebih banyak supaya bisa drop yang sudah terhapus.
  const raw = await kv.lrange<UserCommentRef>(
    userCommentsKey(id),
    0,
    Math.max(limit * 2, 60) - 1
  );
  if (!raw.length) return [];

  // Filter komentar yang sudah dihapus dari thread anime-nya.
  const seriesSet = Array.from(new Set(raw.map((r) => r.series)));
  const aliveBySeries = new Map<string, Set<string>>();
  await Promise.all(
    seriesSet.map(async (s) => {
      const raws = await kv.lrangeRaw(`comments:${s}`, 0, 1000);
      const ids = new Set<string>();
      for (const r of raws) {
        try {
          const c = JSON.parse(r) as { id?: string };
          if (c?.id) ids.add(c.id);
        } catch {
          /* noop */
        }
      }
      aliveBySeries.set(s, ids);
    })
  );
  const filtered = raw.filter((r) =>
    aliveBySeries.get(r.series)?.has(r.id) ?? false
  );
  return filtered.slice(0, limit);
}

export { computeLevel, tierFor, levelProgress };
