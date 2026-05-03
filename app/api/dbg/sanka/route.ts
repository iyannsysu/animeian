import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE =
  process.env.ANIME_API_BASE ?? "https://www.sankavollerei.com/anime/animasu";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") ?? "/ongoing";
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "application/json",
        "user-agent": "Mozilla/5.0 (compatible; AnimeIanDebug/1.0)",
      },
    });
    const text = await res.text();
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      url,
      sample: text.slice(0, 2000),
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      url,
      error: String(e),
    });
  }
}
