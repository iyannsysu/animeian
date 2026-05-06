import { NextResponse } from "next/server";
import { API_BASE, PROVIDER, getDetail, getStream } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const series = searchParams.get("series") ?? "aishiteru-game-wo-owarasetai";
  const slug =
    searchParams.get("slug") ?? "aishiteru-game-wo-owarasetai-episode-1";

  const out: Record<string, unknown> = {
    API_BASE,
    PROVIDER,
    env_ANIME_API_BASE: process.env.ANIME_API_BASE ?? null,
  };

  try {
    const d = await getDetail(series);
    out.detail_count = d.data?.length ?? 0;
    out.detail_first = d.data?.[0]
      ? {
          judul: d.data[0].judul,
          chapters: d.data[0].chapter?.length ?? 0,
          firstChSlug: d.data[0].chapter?.[0]?.url ?? null,
        }
      : null;
  } catch (e) {
    out.detail_error = String(e);
  }

  try {
    const s = await getStream({ slug, series });
    out.stream_count = s.data?.length ?? 0;
    out.stream_first = s.data?.[0]
      ? {
          buckets: Object.fromEntries(
            Object.entries(s.data[0]).map(([k, v]) => [
              k,
              Array.isArray(v) ? v.length : typeof v,
            ])
          ),
        }
      : null;
  } catch (e) {
    out.stream_error = String(e);
  }

  return NextResponse.json(out);
}
