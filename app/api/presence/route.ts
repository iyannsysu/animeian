import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { pingPresence, touchUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  // Pastikan record ada dulu, lalu update lastActiveAt.
  await touchUser({
    id: user.id,
    name: user.name,
    image: user.image,
    email: user.email,
  });
  await pingPresence(user.id);
  return NextResponse.json({ ok: true });
}
