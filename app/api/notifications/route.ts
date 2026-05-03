import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  clearAllNotifs,
  getUnreadCount,
  listNotifs,
  markAllNotifRead,
} from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json(
      { ok: false, reason: "unauthorized", items: [], unread: 0 },
      { status: 401 }
    );
  const [items, unread] = await Promise.all([
    listNotifs(user.id, 30),
    getUnreadCount(user.id),
  ]);
  return NextResponse.json({ ok: true, items, unread });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as {
    action?: "markRead" | "clear";
  } | null;
  if (body?.action === "markRead") {
    await markAllNotifRead(user.id);
  } else if (body?.action === "clear") {
    await clearAllNotifs(user.id);
  } else {
    return NextResponse.json(
      { ok: false, reason: "unknown_action" },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
