import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  isValidReaction,
  toggleReaction,
} from "@/lib/reactions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { series: string } }
) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json(
      { ok: false, reason: "unauthorized" },
      { status: 401 }
    );
  const body = (await req.json().catch(() => null)) as {
    id?: string;
    emoji?: string;
  } | null;
  const id = body?.id;
  const emoji = body?.emoji;
  if (!id || !emoji || !isValidReaction(emoji))
    return NextResponse.json(
      { ok: false, reason: "bad_request" },
      { status: 400 }
    );
  const series = decodeURIComponent(params.series);
  const state = await toggleReaction(series, id, user.id, emoji);
  return NextResponse.json({ ok: true, state });
}
