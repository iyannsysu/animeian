import { NextResponse } from "next/server";
import { incrementView, getViewCount } from "@/lib/views";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { series: string } }
) {
  const series = decodeURIComponent(params.series);
  const count = await getViewCount(series);
  return NextResponse.json({ series, count });
}

export async function POST(
  _req: Request,
  { params }: { params: { series: string } }
) {
  const series = decodeURIComponent(params.series);
  const count = await incrementView(series);
  return NextResponse.json({ series, count });
}
