import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE =
  process.env.ANIME_API_BASE ?? "https://www.sankavollerei.com/anime/animasu";

const ALLOWED_BASES = new Set([
  BASE,
  "https://www.sankavollerei.com/anime/animasu",
  "https://www.sankavollerei.com/anime/samehadaku",
  "https://www.sankavollerei.com/anime/otakudesu",
  "https://www.sankavollerei.com/anime/nimegami",
  "https://www.sankavollerei.com/anime",
]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") ?? "/ongoing";
  const baseOverride = searchParams.get("base");
  if (baseOverride && !ALLOWED_BASES.has(baseOverride)) {
    return NextResponse.json(
      { ok: false, error: "Base URL not allowed" },
      { status: 400 }
    );
  }
  const base = baseOverride ?? BASE;
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "application/json",
        "user-agent": "Mozilla/5.0 (compatible; AnimeIanDebug/1.0)",
      },
    });
    const text = await res.text();
    const full = searchParams.get("full") === "1";
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      url,
      sample: full ? text : text.slice(0, 2000),
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      url,
      error: String(e),
    });
  }
}
