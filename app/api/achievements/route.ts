import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  ACHIEVEMENTS,
  grantAchievements,
  listAchievements,
  thresholdKeys,
} from "@/lib/achievements";
import {
  getFollowStats,
  getStoredUser,
  getWatchSeconds,
} from "@/lib/user";
import { computeLevel } from "@/lib/level";
import { kv } from "@/lib/kv";
import { pushNotif } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/achievements?userId=...
 *  - Jika userId kosong → pakai sesi user, dan akan refresh (auto-grant)
 *  - Jika userId terisi (lihat profile orang lain) → cuma list yang sudah ada,
 *    tidak grant.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("userId");

  if (targetId) {
    const have = await listAchievements(targetId);
    return NextResponse.json({
      ok: true,
      have,
      defs: ACHIEVEMENTS,
    });
  }

  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });

  const [stored, watchSeconds, follow, listCount, commentCountRaw] = await Promise.all([
    getStoredUser(user.id),
    getWatchSeconds(user.id),
    getFollowStats(user.id),
    listCountFor(user.id),
    kv.llen(`user:${user.id}:comments`),
  ]);
  const level = computeLevel(watchSeconds);
  const stats = {
    comments: commentCountRaw,
    likesReceived: stored?.likesReceived ?? 0,
    watchSeconds,
    listCount,
    followers: follow.followers,
    level,
    verified: !!stored?.verified,
  };
  const targets = thresholdKeys(stats);
  const fresh = await grantAchievements(user.id, targets);

  // Push notif kalau ada achievement baru
  for (const k of fresh) {
    const def = ACHIEVEMENTS.find((a) => a.key === k);
    if (!def) continue;
    await pushNotif(user.id, {
      type: "achievement",
      body: `${def.emoji} ${def.name} — ${def.desc}`,
      href: `/u/${user.id}`,
    });
  }

  const have = await listAchievements(user.id);
  return NextResponse.json({
    ok: true,
    have,
    fresh,
    defs: ACHIEVEMENTS,
    stats,
  });
}

async function listCountFor(userId: string) {
  return kv.hlen(`userlist:${userId}`);
}
