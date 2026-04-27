import { kv } from "@/lib/kv";

/**
 * Anime tracking statuses ala MyAnimeList / AniList.
 * - watching: sedang ditonton aktif
 * - completed: sudah tamat ditonton
 * - planned: rencana mau ditonton (mau tonton)
 * - dropped: dropped / berhenti
 * - hold: ditahan dulu
 */
export type UserlistStatus =
  | "watching"
  | "completed"
  | "planned"
  | "dropped"
  | "hold";

export const USERLIST_STATUSES: UserlistStatus[] = [
  "watching",
  "completed",
  "planned",
  "dropped",
  "hold",
];

export const USERLIST_LABEL: Record<UserlistStatus, string> = {
  watching: "Sedang Tonton",
  completed: "Selesai",
  planned: "Mau Tonton",
  dropped: "Drop",
  hold: "Ditunda",
};

/**
 * Tailwind theme per status — dipakai di tombol/badge/list.
 * Konsisten dengan vibe app (indigo/fuchsia/emerald).
 */
export const USERLIST_THEME: Record<
  UserlistStatus,
  { chip: string; text: string; border: string; dot: string }
> = {
  watching: {
    chip: "bg-emerald-500/15",
    text: "text-emerald-300",
    border: "border-emerald-400/50",
    dot: "bg-emerald-400",
  },
  completed: {
    chip: "bg-sky-500/15",
    text: "text-sky-300",
    border: "border-sky-400/50",
    dot: "bg-sky-400",
  },
  planned: {
    chip: "bg-indigo-500/15",
    text: "text-indigo-300",
    border: "border-indigo-400/50",
    dot: "bg-indigo-400",
  },
  dropped: {
    chip: "bg-red-500/15",
    text: "text-red-300",
    border: "border-red-400/50",
    dot: "bg-red-400",
  },
  hold: {
    chip: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-400/50",
    dot: "bg-amber-400",
  },
};

export type UserlistEntry = {
  series: string;
  status: UserlistStatus;
  /** Rating personal 1-10 (boleh kosong) */
  rating?: number;
  title?: string;
  cover?: string;
  type?: string;
  updatedAt: number;
};

function key(userId: string) {
  return `userlist:${userId}`;
}

export function isValidStatus(s: unknown): s is UserlistStatus {
  return typeof s === "string" && (USERLIST_STATUSES as string[]).includes(s);
}

export async function setUserlistEntry(
  userId: string,
  entry: UserlistEntry
): Promise<void> {
  if (!kv.available || !userId) return;
  await kv.hset(key(userId), entry.series, entry);
}

export async function deleteUserlistEntry(
  userId: string,
  series: string
): Promise<void> {
  if (!kv.available || !userId) return;
  await kv.hdel(key(userId), series);
}

export async function getUserlistEntry(
  userId: string,
  series: string
): Promise<UserlistEntry | null> {
  if (!kv.available || !userId) return null;
  return await kv.hget<UserlistEntry>(key(userId), series);
}

export async function listUserlist(userId: string): Promise<UserlistEntry[]> {
  if (!kv.available || !userId) return [];
  const map = await kv.hgetall<Record<string, UserlistEntry>>(key(userId));
  return Object.values(map)
    .filter((e): e is UserlistEntry => !!e?.series)
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

/** Statistik per-status untuk dashboard di profile. */
export type UserlistCounts = Record<UserlistStatus, number> & {
  total: number;
  rated: number;
  averageRating: number;
};

export async function getUserlistCounts(
  userId: string
): Promise<UserlistCounts> {
  const out: UserlistCounts = {
    watching: 0,
    completed: 0,
    planned: 0,
    dropped: 0,
    hold: 0,
    total: 0,
    rated: 0,
    averageRating: 0,
  };
  const items = await listUserlist(userId);
  if (!items.length) return out;
  let sumRating = 0;
  for (const it of items) {
    out.total += 1;
    if (isValidStatus(it.status)) out[it.status] += 1;
    if (typeof it.rating === "number" && it.rating > 0) {
      out.rated += 1;
      sumRating += it.rating;
    }
  }
  out.averageRating = out.rated ? +(sumRating / out.rated).toFixed(2) : 0;
  return out;
}
