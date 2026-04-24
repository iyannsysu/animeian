import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { getSessionUser } from "@/lib/session";
import type { HistoryEntry } from "@/lib/history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 80;

function keyFor(userId: string) {
  return `history:${userId}`;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ items: [] });
  if (!kv.available) return NextResponse.json({ items: [] });
  const entries = await kv.hgetall<Record<string, HistoryEntry>>(keyFor(user.id));
  const items = Object.values(entries).sort((a, b) => b.updatedAt - a.updatedAt);
  return NextResponse.json({ items: items.slice(0, MAX) });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!kv.available) return NextResponse.json({ ok: false, reason: "kv_unavailable" });
  const body = (await req.json().catch(() => null)) as HistoryEntry | null;
  if (!body || !body.series || !body.slug) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const field = `${body.series}::${body.slug}`;
  const entry: HistoryEntry = {
    series: String(body.series),
    slug: String(body.slug),
    title: String(body.title ?? ""),
    episode: String(body.episode ?? ""),
    cover: String(body.cover ?? ""),
    progress: Number(body.progress) || 0,
    duration: Number(body.duration) || 0,
    updatedAt: Number(body.updatedAt) || Date.now(),
  };
  await kv.hset(keyFor(user.id), field, entry);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!kv.available) return NextResponse.json({ ok: true });
  const { searchParams } = new URL(req.url);
  const series = searchParams.get("series");
  const slug = searchParams.get("slug");
  if (series && slug) {
    await kv.hdel(keyFor(user.id), `${series}::${slug}`);
  } else {
    await kv.del(keyFor(user.id));
  }
  return NextResponse.json({ ok: true });
}
