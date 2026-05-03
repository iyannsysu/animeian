import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  isAdminEmailAsync,
  getAllAdminEmails,
  addAdminEmailKV,
  removeAdminEmailKV,
  isImmutableAdminEmail,
  adminEmails as staticEmails,
} from "@/lib/admin";

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

function shape(email: string) {
  return {
    email,
    immutable: isImmutableAdminEmail(email),
  };
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, reason: guard.reason },
      { status: guard.status }
    );
  }
  const all = await getAllAdminEmails();
  // Owner / env admins di paling atas
  all.sort((a, b) => {
    const ai = isImmutableAdminEmail(a) ? 0 : 1;
    const bi = isImmutableAdminEmail(b) ? 0 : 1;
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b);
  });
  return NextResponse.json({
    ok: true,
    items: all.map(shape),
    immutable: staticEmails(),
  });
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
    email?: string;
  } | null;
  const email = (body?.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@") || email.length > 200) {
    return NextResponse.json(
      { ok: false, reason: "invalid_email" },
      { status: 400 }
    );
  }
  await addAdminEmailKV(email);
  return NextResponse.json({ ok: true, email });
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, reason: guard.reason },
      { status: guard.status }
    );
  }
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json(
      { ok: false, reason: "missing_email" },
      { status: 400 }
    );
  }
  if (isImmutableAdminEmail(email)) {
    return NextResponse.json(
      { ok: false, reason: "immutable_admin" },
      { status: 400 }
    );
  }
  // Owner tidak boleh hapus diri sendiri kecuali dynamic
  if (email === guard.user.email?.toLowerCase()) {
    return NextResponse.json(
      { ok: false, reason: "cannot_remove_self" },
      { status: 400 }
    );
  }
  const ok = await removeAdminEmailKV(email);
  return NextResponse.json({ ok });
}
