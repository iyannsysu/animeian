import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { getSessionUser } from "@/lib/session";
import type { WatchlistItem } from "@/lib/watchlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 200;

function key(userId: string) {
  return `watchlist:${userId}`;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ items: [] });
  if (!kv.available) return NextResponse.json({ items: [] });
  const map = await kv.hgetall<Record<string, WatchlistItem>>(key(user.id));
  const items = Object.values(map).sort(
    (a, b) => (b.addedAt || 0) - (a.addedAt || 0)
  );
  return NextResponse.json({ items: items.slice(0, MAX) });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!kv.available)
    return NextResponse.json({ ok: false, reason: "kv_unavailable" });

  const body = (await req.json().catch(() => null)) as
    | (WatchlistItem & { remove?: boolean })
    | null;
  if (!body || !body.series)
    return NextResponse.json({ ok: false }, { status: 400 });

  if (body.remove) {
    await kv.hdel(key(user.id), body.series);
    return NextResponse.json({ ok: true, removed: true });
  }

  const entry: WatchlistItem = {
    series: String(body.series),
    title: String(body.title ?? body.series),
    cover: String(body.cover ?? ""),
    type: body.type ? String(body.type) : undefined,
    addedAt: Number(body.addedAt) || Date.now(),
  };
  await kv.hset(key(user.id), entry.series, entry);
  return NextResponse.json({ ok: true, item: entry });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!kv.available) return NextResponse.json({ ok: true });
  const { searchParams } = new URL(req.url);
  const series = searchParams.get("series");
  if (series) {
    await kv.hdel(key(user.id), series);
  } else {
    await kv.del(key(user.id));
  }
  return NextResponse.json({ ok: true });
}
