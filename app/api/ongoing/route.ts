import { NextResponse } from "next/server";
import { getOngoing } from "@/lib/api";
import { getViewCounts } from "@/lib/views";

export const runtime = "nodejs";
export const revalidate = 600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  try {
    const r = await getOngoing(page);
    const items = r.data ?? [];
    const counts = await getViewCounts(items.map((i) => i.url));
    return NextResponse.json({
      page,
      hasMore: items.length > 0,
      items: items.map((it) => ({
        id: it.id,
        url: it.url,
        judul: it.judul,
        cover: it.cover,
        lastch: it.lastch,
        lastup: it.lastup,
        type: it.type,
        views: counts[it.url] ?? 0,
      })),
    });
  } catch {
    return NextResponse.json({ page, hasMore: false, items: [] });
  }
}
