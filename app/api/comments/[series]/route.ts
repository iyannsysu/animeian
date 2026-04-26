import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { kv } from "@/lib/kv";
import { getSessionUser } from "@/lib/session";
import { getWatchSeconds, touchUser } from "@/lib/user";
import { computeLevel } from "@/lib/level";
import { isAdminEmailAsync, getAdminUserIds } from "@/lib/admin";

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
};

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

  // Hitung level terkini per user
  const uniq = Array.from(new Set(items.map((c) => c.userId).filter(Boolean)));
  const levels: Record<string, number> = {};
  await Promise.all(
    uniq.map(async (uid) => {
      const sec = await getWatchSeconds(uid);
      levels[uid] = computeLevel(sec);
    })
  );

  // Pinned set + admin set (untuk warna nama merah)
  const [pinnedArr, adminIds] = await Promise.all([
    kv.smembers(pinKey(series)),
    getAdminUserIds(),
  ]);
  const pinned = new Set(pinnedArr);

  // Like count + likedByMe
  const me = await getSessionUser();
  const likeCounts = await Promise.all(
    items.map((c) => kv.scard(likeKey(series, c.id)))
  );
  const likedFlags = me
    ? await Promise.all(
        items.map((c) => kv.sismember(likeKey(series, c.id), me.id))
      )
    : items.map(() => false);

  const enriched: Comment[] = items.map((c, i) => ({
    ...c,
    userLevel: levels[c.userId] ?? c.userLevel ?? 1,
    likeCount: likeCounts[i] ?? 0,
    likedByMe: likedFlags[i] ?? false,
    pinned: pinned.has(c.id),
    parentId: c.parentId ?? null,
    isAuthorAdmin: adminIds.has(c.userId),
  }));

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
  } | null;
  const text = (body?.body ?? "").trim();
  if (!text) return NextResponse.json({ ok: false, reason: "empty" }, { status: 400 });
  if (text.length > MAX_LEN)
    return NextResponse.json({ ok: false, reason: "too_long" }, { status: 400 });

  await touchUser({
    id: user.id,
    name: user.name,
    image: user.image,
    email: user.email,
  });
  const sec = await getWatchSeconds(user.id);
  const level = computeLevel(sec);

  const entry: Comment = {
    id: randomUUID(),
    series,
    userId: user.id,
    userName: user.name,
    userImage: user.image,
    body: text,
    createdAt: Date.now(),
    userLevel: level,
    parentId: body?.parentId ? String(body.parentId) : null,
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
      return NextResponse.json({ ok: true });
    } catch {
      /* noop */
    }
  }
  return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
}
