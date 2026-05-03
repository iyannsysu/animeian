import { NextResponse } from "next/server";
import { getOngoing } from "@/lib/api";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  try {
    const res = await getOngoing();
    const items = res.data ?? [];
    if (!items.length)
      return NextResponse.json({ ok: false }, { status: 404 });
    const pick = items[Math.floor(Math.random() * items.length)];
    return NextResponse.json({ ok: true, url: pick.url, title: pick.judul });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
