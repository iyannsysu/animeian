import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { kv } from "@/lib/kv";
import { getSessionUser } from "@/lib/session";
import {
  getStoredUser,
  getWatchSeconds,
  listVerifiedUserIds,
  resolveDisplayUser,
  touchUser,
} from "@/lib/user";
import { computeLevel } from "@/lib/level";
import { isAdminEmailAsync, getAdminUserIds } from "@/lib/admin";
import { pushNotif } from "@/lib/notifications";
import { clearReactions, getReactions } from "@/lib/reactions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type Comment = {
  id: string;
  series: string;
  userId: string;
  userName: string;
  userImage: string | null;
  body: string;
  createdAt: number;
  userLevel?: number;
  parentId?: string | null;
  likeCount?: number;
  likedByMe?: boolean;
  pinned?: boolean;
  isAuthorAdmin?: boolean;
  /** Centang biru — true kalau author di-verifikasi admin. */
  isAuthorVerified?: boolean;
  /** Optional gambar yang dilampirkan komentar (data URL JPEG/PNG/WEBP). */
  imageData?: string;
  /** Reaksi emoji per komen (selain ❤️ like): { emoji: count }. */
  reactionCounts?: Record<string, number>;
  /** Emoji yang sudah di-react oleh viewer. */
  myReactions?: string[];
};

const IMAGE_MAX_BYTES = 260_000;

function validImage(s: string): boolean {
  if (!s.startsWith("data:image/")) return false;
  if (s.length > IMAGE_MAX_BYTES) return false;
  const head = s.slice(0, 30);
  return (
    head.startsWith("data:image/jpeg") ||
    head.startsWith("data:image/png") ||
    head.startsWith("data:image/webp")
  );
}

const MAX_LEN = 1000;
const MAX_PER_ANIME = 1000;

function key(series: string) {
  return `comments:${series}`;
}
function userKey(userId: string) {
  return `user:${userId}:comments`;
}
function likeKey(series: string, id: string) {
  return `comment_likes:${series}:${id}`;
}
function pinKey(series: string) {
  return `comments:pinned:${series}`;
}

export async function GET(
  _req: Request,
  { params }: { params: { series: string } }
) {
  const series = decodeURIComponent(params.series);
  if (!kv.available) return NextResponse.json({ items: [] });
  const items = await kv.lrange<Comment>(key(series), 0, 500);

  // Fetch level + display name/image terkini per user (override > Google default)
  const uniq = Array.from(new Set(items.map((c) => c.userId).filter(Boolean)));
  const levels: Record<string, number> = {};
  const displayMap: Record<
    string,
    { name: string; image: string | null }
  > = {};
  await Promise.all(
    uniq.map(async (uid) => {
      const [sec, stored] = await Promise.all([
        getWatchSeconds(uid),
        getStoredUser(uid),
      ]);
      levels[uid] = computeLevel(sec);
      if (stored) displayMap[uid] = resolveDisplayUser(stored);
    })
  );

  // Pinned set + admin set (untuk warna nama merah) + verified set (centang biru)
  const [pinnedArr, adminIds, verifiedIds] = await Promise.all([
    kv.smembers(pinKey(series)),
    getAdminUserIds(),
    listVerifiedUserIds(),
  ]);
  const pinned = new Set(pinnedArr);

  // Like count + likedByMe + reactions (emoji selain ❤️)
  const me = await getSessionUser();
  const likeCounts = await Promise.all(
    items.map((c) => kv.scard(likeKey(series, c.id)))
  );
  const likedFlags = me
    ? await Promise.all(
        items.map((c) => kv.sismember(likeKey(series, c.id), me.id))
      )
    : items.map(() => false);
  const reactionStates = await Promise.all(
    items.map((c) => getReactions(series, c.id, me?.id ?? null))
  );

  const enriched: Comment[] = items.map((c, i) => {
    const display = displayMap[c.userId];
    return {
      ...c,
      userName: display?.name ?? c.userName,
      userImage: display?.image ?? c.userImage,
      userLevel: levels[c.userId] ?? c.userLevel ?? 1,
      likeCount: likeCounts[i] ?? 0,
      likedByMe: likedFlags[i] ?? false,
      pinned: pinned.has(c.id),
      parentId: c.parentId ?? null,
      isAuthorAdmin: adminIds.has(c.userId),
      isAuthorVerified: verifiedIds.has(c.userId),
      reactionCounts: reactionStates[i]?.counts ?? {},
      myReactions: reactionStates[i]?.mine ?? [],
    };
  });

  const isAdmin = await isAdminEmailAsync(me?.email);
  return NextResponse.json({ items: enriched, isAdmin });
}

export async function POST(
  req: Request,
  { params }: { params: { series: string } }
) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  if (!kv.available)
    return NextResponse.json({ ok: false, reason: "kv_unavailable" }, { status: 503 });

  const series = decodeURIComponent(params.series);
  const body = (await req.json().catch(() => null)) as {
    body?: string;
    parentId?: string | null;
    imageData?: string;
  } | null;
  const text = (body?.body ?? "").trim();
  const imageRaw = (body?.imageData ?? "").trim();
  // Boleh kirim teks kosong selama ada gambar
  if (!text && !imageRaw)
    return NextResponse.json({ ok: false, reason: "empty" }, { status: 400 });
  if (text.length > MAX_LEN)
    return NextResponse.json({ ok: false, reason: "too_long" }, { status: 400 });
  let imageData: string | undefined;
  if (imageRaw) {
    if (!validImage(imageRaw))
      return NextResponse.json(
        { ok: false, reason: "invalid_image" },
        { status: 400 }
      );
    imageData = imageRaw;
  }

  await touchUser({
    id: user.id,
    name: user.name,
    image: user.image,
    email: user.email,
  });
  const [sec, stored] = await Promise.all([
    getWatchSeconds(user.id),
    getStoredUser(user.id),
  ]);
  const level = computeLevel(sec);
  const display = stored
    ? resolveDisplayUser(stored)
    : { name: user.name, image: user.image };

  const entry: Comment = {
    id: randomUUID(),
    series,
    userId: user.id,
    userName: display.name,
    userImage: display.image,
    body: text,
    createdAt: Date.now(),
    userLevel: level,
    parentId: body?.parentId ? String(body.parentId) : null,
    imageData,
  };
  await kv.lpush(key(series), entry);
  await kv.ltrim(key(series), 0, MAX_PER_ANIME - 1);
  await kv.lpush(userKey(user.id), {
    series,
    id: entry.id,
    body: text,
    createdAt: entry.createdAt,
  });
  await kv.ltrim(userKey(user.id), 0, 200);

  // Reply notif → push ke author komentar parent
  if (entry.parentId) {
    const raws = await kv.lrangeRaw(key(series), 0, 1000);
    for (const raw of raws) {
      try {
        const parent = JSON.parse(raw) as Comment;
        if (parent.id !== entry.parentId) continue;
        if (parent.userId && parent.userId !== user.id) {
          await pushNotif(parent.userId, {
            type: "reply",
            fromId: user.id,
            fromName: entry.userName,
            fromImage: entry.userImage,
            series,
            body: text.slice(0, 100),
            href: `/anime/${encodeURIComponent(series)}#comments`,
          });
        }
        break;
      } catch {
        /* noop */
      }
    }
  }

  return NextResponse.json({ ok: true, comment: entry });
}

export async function DELETE(
  req: Request,
  { params }: { params: { series: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!kv.available) return NextResponse.json({ ok: true });

  const series = decodeURIComponent(params.series);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const isAdmin = await isAdminEmailAsync(user.email);

  const raws = await kv.lrangeRaw(key(series), 0, 1000);
  for (const raw of raws) {
    try {
      const c = JSON.parse(raw) as Comment;
      if (c.id !== id) continue;
      if (!isAdmin && c.userId !== user.id) {
        return NextResponse.json(
          { ok: false, reason: "forbidden" },
          { status: 403 }
        );
      }
      await kv.lrem(key(series), 1, raw);
      // bersihkan side data
      await kv.del(likeKey(series, id));
      await kv.srem(pinKey(series), id);
      await clearReactions(series, id);
      // Hapus juga entry di per-user comments list (biar tidak nyangkut di /profile)
      try {
        const ownerId = c.userId;
        if (ownerId) {
          const userRaws = await kv.lrangeRaw(userKey(ownerId), 0, 1000);
          for (const ur of userRaws) {
            try {
              const ref = JSON.parse(ur) as { id?: string };
              if (ref?.id === id) {
                await kv.lrem(userKey(ownerId), 1, ur);
              }
            } catch {
              /* noop */
            }
          }
        }
      } catch {
        /* noop */
      }
      return NextResponse.json({ ok: true });
    } catch {
      /* noop */
    }
  }
  return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
}
