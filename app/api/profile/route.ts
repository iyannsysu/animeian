import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  getStoredUser,
  resolveDisplayUser,
  touchUser,
  updateUserOverrides,
} from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NAME_MAX = 40;
const NAME_MIN = 2;
// Image data URL maksimum: ~250 KB encoded base64. Layar profil tidak butuh
// gambar besar — dipotong di client jadi 360x360.
const IMAGE_MAX_BYTES = 260_000;

function validName(s: string) {
  if (s.length < NAME_MIN || s.length > NAME_MAX) return false;
  // Hanya char yang masuk akal: huruf, angka, spasi, "._-", emoji jarang.
  if (/^\s+$/.test(s)) return false;
  return true;
}

function validImage(s: string): boolean {
  if (!s.startsWith("data:image/")) return false;
  if (s.length > IMAGE_MAX_BYTES) return false;
  // Hanya jpeg/png/webp
  const head = s.slice(0, 30);
  return (
    head.startsWith("data:image/jpeg") ||
    head.startsWith("data:image/png") ||
    head.startsWith("data:image/webp")
  );
}

export async function GET() {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  await touchUser({
    id: user.id,
    name: user.name,
    image: user.image,
    email: user.email,
  });
  const stored = await getStoredUser(user.id);
  if (!stored)
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  const display = resolveDisplayUser(stored);
  return NextResponse.json({
    ok: true,
    user: {
      id: stored.id,
      googleName: stored.name,
      googleImage: stored.image,
      nameOverride: stored.nameOverride ?? null,
      imageOverride: stored.imageOverride ?? null,
      displayName: display.name,
      displayImage: display.image,
      bio: stored.bio ?? null,
      bannerImage: stored.bannerImage ?? null,
      showcase: stored.showcase ?? [],
    },
  });
}

const BIO_MAX = 160;
const BANNER_MAX_BYTES = 700_000; // banner agak besar tapi tetap dipampatkan klien

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    name?: string | null;
    image?: string | null;
    bio?: string | null;
    bannerImage?: string | null;
    showcase?: string[] | null;
    resetName?: boolean;
    resetImage?: boolean;
    resetBio?: boolean;
    resetBanner?: boolean;
    resetShowcase?: boolean;
  } | null;

  // Pastikan record ada dulu (Google name/image fallback)
  await touchUser({
    id: user.id,
    name: user.name,
    image: user.image,
    email: user.email,
  });

  const patch: {
    name?: string | null;
    image?: string | null;
    bio?: string | null;
    bannerImage?: string | null;
    showcase?: string[] | null;
  } = {};
  if (body?.resetName) patch.name = null;
  else if (typeof body?.name === "string") {
    const trimmed = body.name.trim();
    if (!validName(trimmed))
      return NextResponse.json(
        { ok: false, reason: "invalid_name" },
        { status: 400 }
      );
    patch.name = trimmed;
  }

  if (body?.resetImage) patch.image = null;
  else if (typeof body?.image === "string" && body.image.length > 0) {
    if (!validImage(body.image))
      return NextResponse.json(
        { ok: false, reason: "invalid_image" },
        { status: 400 }
      );
    patch.image = body.image;
  }

  if (body?.resetBio) patch.bio = null;
  else if (typeof body?.bio === "string") {
    const trimmed = body.bio.trim();
    if (trimmed.length > BIO_MAX)
      return NextResponse.json(
        { ok: false, reason: "bio_too_long" },
        { status: 400 }
      );
    patch.bio = trimmed;
  }

  if (body?.resetBanner) patch.bannerImage = null;
  else if (
    typeof body?.bannerImage === "string" &&
    body.bannerImage.length > 0
  ) {
    if (
      !body.bannerImage.startsWith("data:image/") ||
      body.bannerImage.length > BANNER_MAX_BYTES
    ) {
      return NextResponse.json(
        { ok: false, reason: "invalid_banner" },
        { status: 400 }
      );
    }
    patch.bannerImage = body.bannerImage;
  }

  if (body?.resetShowcase) patch.showcase = null;
  else if (Array.isArray(body?.showcase)) {
    patch.showcase = body.showcase.slice(0, 3).map((s) => String(s));
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json(
      { ok: false, reason: "nothing_to_update" },
      { status: 400 }
    );
  }

  const updated = await updateUserOverrides(user.id, patch);
  if (!updated)
    return NextResponse.json(
      { ok: false, reason: "update_failed" },
      { status: 500 }
    );
  const display = resolveDisplayUser(updated);
  return NextResponse.json({
    ok: true,
    displayName: display.name,
    displayImage: display.image,
    bio: updated.bio ?? null,
    bannerImage: updated.bannerImage ?? null,
    showcase: updated.showcase ?? [],
  });
}
