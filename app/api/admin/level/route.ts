import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { isAdminEmailAsync } from "@/lib/admin";
import {
  getStoredUser,
  getWatchSeconds,
  listAllUsers,
  setWatchSeconds,
  touchUser,
} from "@/lib/user";
import { computeLevel, secondsForLevel, MAX_LEVEL } from "@/lib/level";
import { hashEmailId } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, status: 401, reason: "unauthorized" };
  if (!(await isAdminEmailAsync(user.email)))
    return { ok: false as const, status: 403, reason: "forbidden" };
  return { ok: true as const, user };
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, reason: guard.reason },
      { status: guard.status }
    );
  }
  const users = await listAllUsers();
  const enriched = await Promise.all(
    users.map(async (u) => {
      const sec = await getWatchSeconds(u.id);
      return {
        id: u.id,
        name: u.name,
        image: u.image,
        email: u.email ?? null,
        joinedAt: u.joinedAt,
        updatedAt: u.updatedAt,
        watchSeconds: sec,
        level: computeLevel(sec),
      };
    })
  );
  enriched.sort((a, b) => b.level - a.level || b.updatedAt - a.updatedAt);
  return NextResponse.json({ ok: true, items: enriched });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, reason: guard.reason },
      { status: guard.status }
    );
  }

  const body = (await req.json().catch(() => null)) as {
    target?: string;
    level?: number;
    minutes?: number;
  } | null;

  const targetRaw = (body?.target ?? "").trim();
  if (!targetRaw)
    return NextResponse.json(
      { ok: false, reason: "missing_target" },
      { status: 400 }
    );

  // Boleh kasih email atau userId. Email -> hash -> id.
  let targetId = targetRaw;
  if (targetRaw.includes("@")) {
    targetId = hashEmailId(targetRaw);
  }

  // Pastikan target sudah pernah login (ada record). Kalau belum, buat
  // record minimal supaya level bisa diset duluan.
  const existing = await getStoredUser(targetId);
  if (!existing) {
    await touchUser({
      id: targetId,
      name: targetRaw.includes("@") ? targetRaw.split("@")[0] : targetId.slice(0, 6),
      image: null,
      email: targetRaw.includes("@") ? targetRaw.toLowerCase() : undefined,
    });
  }

  let nextSeconds: number;
  if (typeof body?.level === "number" && Number.isFinite(body.level)) {
    const lvl = Math.max(1, Math.min(MAX_LEVEL, Math.floor(body.level)));
    nextSeconds = secondsForLevel(lvl);
  } else if (typeof body?.minutes === "number" && Number.isFinite(body.minutes)) {
    nextSeconds = Math.max(0, Math.floor(body.minutes * 60));
  } else {
    return NextResponse.json(
      { ok: false, reason: "missing_value" },
      { status: 400 }
    );
  }

  const finalSec = await setWatchSeconds(targetId, nextSeconds);
  return NextResponse.json({
    ok: true,
    targetId,
    watchSeconds: finalSec,
    level: computeLevel(finalSec),
  });
}
