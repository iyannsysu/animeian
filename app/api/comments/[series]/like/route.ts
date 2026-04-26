import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { getSessionUser } from "@/lib/session";
import { incLikesReceived } from "@/lib/user";
import type { Comment } from "@/app/api/comments/[series]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function likeKey(series: string, id: string) {
  return `comment_likes:${series}:${id}`;
}
function commentsKey(series: string) {
  return `comments:${series}`;
}

/**
 * Cari userId author dari komentar id `commentId` di series tertentu.
 * Dipakai untuk increment counter likesReceived pada user yang dikomentari.
 */
async function findCommentAuthor(
  series: string,
  commentId: string
): Promise<string | null> {
  const raws = await kv.lrangeRaw(commentsKey(series), 0, 1000);
  for (const raw of raws) {
    try {
      const c = JSON.parse(raw) as Comment;
      if (c.id === commentId) return c.userId ?? null;
    } catch {
      /* noop */
    }
  }
  return null;
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

  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id;
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  const series = decodeURIComponent(params.series);
  const k = likeKey(series, id);
  const isLiked = await kv.sismember(k, user.id);
  if (isLiked) {
    await kv.srem(k, user.id);
  } else {
    await kv.sadd(k, user.id);
  }
  const count = await kv.scard(k);

  // Update likesReceived counter di author
  const authorId = await findCommentAuthor(series, id);
  if (authorId && authorId !== user.id) {
    await incLikesReceived(authorId, isLiked ? -1 : 1);
  }

  return NextResponse.json({ ok: true, liked: !isLiked, count });
}
