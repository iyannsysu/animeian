import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { getSessionUser } from "@/lib/session";
import { isAdminEmailAsync } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pinKey(series: string) {
  return `comments:pinned:${series}`;
}

export async function POST(
  req: Request,
  { params }: { params: { series: string } }
) {
  const user = await getSessionUser();
  if (!user || !(await isAdminEmailAsync(user.email)))
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  if (!kv.available)
    return NextResponse.json({ ok: false, reason: "kv_unavailable" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id;
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  const series = decodeURIComponent(params.series);
  const k = pinKey(series);
  const isPinned = await kv.sismember(k, id);
  if (isPinned) await kv.srem(k, id);
  else await kv.sadd(k, id);
  return NextResponse.json({ ok: true, pinned: !isPinned });
}
