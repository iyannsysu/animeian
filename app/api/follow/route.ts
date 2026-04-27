import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  followUser,
  unfollowUser,
  getFollowStats,
  getStoredUser,
  resolveDisplayUser,
  touchUser,
} from "@/lib/user";
import { pushNotif } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") ?? "").trim();
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const me = await getSessionUser();
  const stats = await getFollowStats(id, me?.id);
  return NextResponse.json({ ok: true, ...stats });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as {
    targetId?: string;
    action?: "follow" | "unfollow";
  } | null;
  const target = (body?.targetId ?? "").trim();
  const action = body?.action ?? "follow";
  if (!target || target === user.id)
    return NextResponse.json({ ok: false, reason: "invalid_target" }, { status: 400 });

  // Pastikan kedua user record ada
  await touchUser({
    id: user.id,
    name: user.name,
    image: user.image,
    email: user.email,
  });

  const res =
    action === "unfollow"
      ? await unfollowUser(user.id, target)
      : await followUser(user.id, target);

  // Push notif ke target jika baru follow
  if (action !== "unfollow" && res.following) {
    const me = await getStoredUser(user.id);
    const display = me
      ? resolveDisplayUser(me)
      : { name: user.name, image: user.image };
    await pushNotif(target, {
      type: "follow",
      fromId: user.id,
      fromName: display.name,
      fromImage: display.image,
      href: `/u/${user.id}`,
    });
  }

  return NextResponse.json({ ok: true, ...res });
}
