import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { incrementWatchSeconds, touchUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    seconds?: number;
  } | null;
  const sec = Math.max(0, Math.min(30, Math.floor(Number(body?.seconds) || 0)));

  // Pastikan user record ada
  await touchUser({
    id: user.id,
    name: user.name,
    image: user.image,
    email: user.email,
  });

  const total = await incrementWatchSeconds(user.id, sec);
  return NextResponse.json({ ok: true, total });
}
