import { NextResponse } from "next/server";
import { getAnimeListLetter } from "@/lib/api";

export const runtime = "nodejs";
export const revalidate = 1800;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const letter = (searchParams.get("letter") ?? "").trim().toUpperCase();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  if (!letter || !/^[A-Z]$/.test(letter)) {
    return NextResponse.json({ items: [], hasNext: false });
  }
  try {
    const r = await getAnimeListLetter(letter, page);
    return NextResponse.json({
      letter,
      page,
      hasNext: r.hasNext,
      items: r.items.map((it) => ({
        id: String(it.id ?? it.url),
        url: it.url,
        judul: it.judul,
        cover: it.cover,
      })),
    });
  } catch {
    return NextResponse.json({ letter, page, hasNext: false, items: [] });
  }
}
