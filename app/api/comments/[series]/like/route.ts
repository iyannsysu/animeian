import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function likeKey(series: string, id: string) {
  return `comment_likes:${series}:${id}`;
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
  return NextResponse.json({ ok: true, liked: !isLiked, count });
}
