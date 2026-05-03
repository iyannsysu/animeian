import { NextResponse } from "next/server";
import { getPublicProfile } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = decodeURIComponent(params.id);
  const profile = await getPublicProfile(id);
  if (!profile) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, profile });
}
