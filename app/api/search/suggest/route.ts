import { NextResponse } from "next/server";
import { getAnimeList } from "@/lib/api";

export const runtime = "nodejs";
export const revalidate = 1800;

type Item = { id: string; judul: string; url: string };

let cache: { items: Item[]; ts: number } | null = null;

async function loadAll(): Promise<Item[]> {
  if (cache && Date.now() - cache.ts < 30 * 60 * 1000) return cache.items;
  try {
    const raw = (await getAnimeList()) as Record<string, unknown>;
    const all: Item[] = [];
    for (const v of Object.values(raw)) {
      if (Array.isArray(v)) all.push(...(v as Item[]));
    }
    cache = { items: all, ts: Date.now() };
    return all;
  } catch {
    return cache?.items ?? [];
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q || q.length < 2)
    return NextResponse.json({ items: [] });
  const all = await loadAll();
  const matches: Item[] = [];
  for (const it of all) {
    if (it.judul.toLowerCase().includes(q)) {
      matches.push(it);
      if (matches.length >= 8) break;
    }
  }
  return NextResponse.json({ items: matches });
}
