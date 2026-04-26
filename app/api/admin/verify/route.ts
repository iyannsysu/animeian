import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { isAdminEmailAsync } from "@/lib/admin";
import {
  setVerified,
  getStoredUser,
  listAllUsers,
  resolveDisplayUser,
} from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user)
    return { ok: false as const, status: 401, reason: "unauthorized" };
  if (!(await isAdminEmailAsync(user.email)))
    return { ok: false as const, status: 403, reason: "forbidden" };
  return { ok: true as const, user };
}

/** GET → daftar semua user yang verified */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, reason: guard.reason },
      { status: guard.status }
    );
  }
  const users = await listAllUsers();
  const verified = users
    .filter((u) => u.verified)
    .map((u) => {
      const d = resolveDisplayUser(u);
      return {
        id: u.id,
        name: d.name,
        image: d.image,
        email: u.email ?? null,
      };
    });
  return NextResponse.json({ ok: true, items: verified });
}

/** POST { userId | email } → tandai verified */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, reason: guard.reason },
      { status: guard.status }
    );
  }
  const body = (await req.json().catch(() => null)) as {
    userId?: string;
    email?: string;
  } | null;
  const userId = await resolveTarget(body);
  if (!userId) {
    return NextResponse.json(
      { ok: false, reason: "user_not_found" },
      { status: 404 }
    );
  }
  const u = await setVerified(userId, true);
  if (!u)
    return NextResponse.json(
      { ok: false, reason: "user_not_found" },
      { status: 404 }
    );
  return NextResponse.json({ ok: true, userId, verified: true });
}

/** DELETE ?userId=… → cabut verified */
export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, reason: guard.reason },
      { status: guard.status }
    );
  }
  const { searchParams } = new URL(req.url);
  const userId = (searchParams.get("userId") ?? "").trim();
  const email = (searchParams.get("email") ?? "").trim();
  const id = await resolveTarget({ userId, email });
  if (!id) {
    return NextResponse.json(
      { ok: false, reason: "user_not_found" },
      { status: 404 }
    );
  }
  await setVerified(id, false);
  return NextResponse.json({ ok: true, userId: id, verified: false });
}

async function resolveTarget(input: {
  userId?: string;
  email?: string;
} | null): Promise<string | null> {
  if (!input) return null;
  const userId = (input.userId ?? "").trim();
  if (userId) {
    const u = await getStoredUser(userId);
    return u ? userId : null;
  }
  const email = (input.email ?? "").trim().toLowerCase();
  if (!email) return null;
  const all = await listAllUsers();
  const found = all.find((u) => (u.email ?? "").toLowerCase() === email);
  return found?.id ?? null;
}
