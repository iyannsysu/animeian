import { NextResponse } from "next/server";
import { getCompletedPage } from "@/lib/api";
import { getViewCounts } from "@/lib/views";

export const runtime = "nodejs";
export const revalidate = 1800;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  try {
    const r = await getCompletedPage(page);
    const counts = await getViewCounts(r.items.map((i) => i.url));
    return NextResponse.json({
      page,
      hasMore: r.hasMore,
      items: r.items.map((it) => ({
        id: it.id,
        url: it.url,
        judul: it.judul,
        cover: it.cover,
        lastch: it.lastch,
        lastup: it.rilis || it.lastup,
        type: it.type,
        score: it.score,
        views: counts[it.url] ?? 0,
      })),
    });
  } catch {
    return NextResponse.json({ page, hasMore: false, items: [] });
  }
}
