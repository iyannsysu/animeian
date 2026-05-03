import { NextResponse } from "next/server";
import { listAllUsers, resolveDisplayUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q || q.length < 1)
    return NextResponse.json({ ok: true, items: [] });

  const all = await listAllUsers();
  const items = all
    .map((u) => {
      const display = resolveDisplayUser(u);
      return {
        id: u.id,
        name: display.name,
        image: display.image,
        lastActiveAt: u.lastActiveAt ?? 0,
      };
    })
    .filter((u) => u.name.toLowerCase().includes(q))
    .sort((a, b) => b.lastActiveAt - a.lastActiveAt)
    .slice(0, 8);

  return NextResponse.json({ ok: true, items });
}
