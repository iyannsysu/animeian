import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  deleteUserlistEntry,
  isValidStatus,
  listUserlist,
  setUserlistEntry,
  type UserlistEntry,
  type UserlistStatus,
} from "@/lib/userlist";
import { touchUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const series = searchParams.get("series");
  const items = await listUserlist(user.id);
  if (series) {
    const found = items.find((it) => it.series === series) ?? null;
    return NextResponse.json({ ok: true, entry: found });
  }
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Partial<UserlistEntry> | null;
  if (!body?.series || typeof body.series !== "string")
    return NextResponse.json(
      { ok: false, reason: "missing_series" },
      { status: 400 }
    );
  if (body.status && !isValidStatus(body.status))
    return NextResponse.json(
      { ok: false, reason: "invalid_status" },
      { status: 400 }
    );
  let rating: number | undefined = undefined;
  if (body.rating !== undefined && body.rating !== null) {
    const n = Number(body.rating);
    if (!Number.isFinite(n) || n < 0 || n > 10)
      return NextResponse.json(
        { ok: false, reason: "invalid_rating" },
        { status: 400 }
      );
    rating = n > 0 ? Math.round(n) : 0;
  }

  await touchUser({
    id: user.id,
    name: user.name,
    image: user.image,
    email: user.email,
  });

  const entry: UserlistEntry = {
    series: body.series,
    status: (body.status as UserlistStatus) ?? "watching",
    rating: rating === 0 ? undefined : rating,
    title: body.title ?? undefined,
    cover: body.cover ?? undefined,
    type: body.type ?? undefined,
    updatedAt: Date.now(),
  };
  await setUserlistEntry(user.id, entry);
  return NextResponse.json({ ok: true, entry });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const series = searchParams.get("series");
  if (!series)
    return NextResponse.json(
      { ok: false, reason: "missing_series" },
      { status: 400 }
    );
  await deleteUserlistEntry(user.id, series);
  return NextResponse.json({ ok: true });
}
