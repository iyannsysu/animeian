import { randomUUID } from "crypto";
import { kv } from "@/lib/kv";

/**
 * Notifikasi in-app — disimpan per-user (LIST + counter unread).
 * Dipakai oleh: reply komentar, like, follow baru, mention, achievement,
 * dan event admin (verified, level set).
 */
export type NotifType =
  | "reply"
  | "like"
  | "follow"
  | "mention"
  | "achievement"
  | "system";

export type Notification = {
  id: string;
  type: NotifType;
  fromId?: string;
  fromName?: string;
  fromImage?: string | null;
  series?: string;
  /** Preview text (judul/komen yang menjadi konteks notif) */
  body?: string;
  /** Tujuan klik notif (URL relatif) */
  href: string;
  createdAt: number;
  read: boolean;
};

const MAX_NOTIF = 100;

function listKey(userId: string) {
  return `notif:${userId}`;
}
function unreadKey(userId: string) {
  return `notif:${userId}:unread`;
}

/**
 * Push notifikasi ke user. Tidak melempar error jika KV unavailable.
 */
export async function pushNotif(
  userId: string,
  n: Omit<Notification, "id" | "createdAt" | "read">
): Promise<Notification | null> {
  if (!kv.available || !userId) return null;
  const entry: Notification = {
    ...n,
    id: randomUUID(),
    createdAt: Date.now(),
    read: false,
  };
  try {
    await kv.lpush(listKey(userId), entry);
    await kv.ltrim(listKey(userId), 0, MAX_NOTIF - 1);
    await kv.incr(unreadKey(userId));
  } catch {
    /* noop */
  }
  return entry;
}

export async function listNotifs(
  userId: string,
  limit = 30
): Promise<Notification[]> {
  if (!kv.available || !userId) return [];
  return await kv.lrange<Notification>(listKey(userId), 0, limit - 1);
}

export async function markAllNotifRead(userId: string): Promise<void> {
  if (!kv.available || !userId) return;
  // Reset counter
  await kv.del(unreadKey(userId));
  // Mark each entry as read by rewriting the list
  const items = await kv.lrange<Notification>(listKey(userId), 0, MAX_NOTIF);
  if (!items.length) return;
  const updated = items.map((n) => ({ ...n, read: true }));
  // Rewrite: del + lpush in reverse so order preserved
  await kv.del(listKey(userId));
  for (let i = updated.length - 1; i >= 0; i--) {
    await kv.lpush(listKey(userId), updated[i]);
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  if (!kv.available || !userId) return 0;
  const v = await kv.get<number | string>(unreadKey(userId));
  return Number(v ?? 0) || 0;
}

export async function clearAllNotifs(userId: string): Promise<void> {
  if (!kv.available || !userId) return;
  await kv.del(listKey(userId));
  await kv.del(unreadKey(userId));
}
