"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { LogIn, LogOut, User, UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function AuthButton({ compact = false }: { compact?: boolean }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  if (status === "loading") {
    return (
      <div
        className={`skeleton rounded-full ${compact ? "h-8 w-8" : "h-9 w-24"}`}
      />
    );
  }

  if (!session) {
    return (
      <button
        type="button"
        onClick={() => signIn("google")}
        className={
          compact
            ? "btn-ghost h-8 w-8 rounded-full p-0"
            : "btn inline-flex gap-2 rounded-full border border-ink-700/70 bg-ink-900/70 px-3 py-1.5 text-sm text-ink-100 hover:border-brand-500/60 hover:text-white"
        }
        aria-label="Masuk dengan Google"
      >
        <LogIn className="h-4 w-4" />
        {compact ? null : <span>Masuk</span>}
      </button>
    );
  }

  const user = session.user;
  const initial = (user?.name || user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-ink-700/70 bg-ink-900/70 text-sm font-semibold ring-1 ring-transparent transition hover:ring-brand-500/40"
        aria-label="Akun"
      >
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name ?? "user"}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initial}</span>
        )}
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-50 min-w-[220px] overflow-hidden rounded-xl border border-ink-700/70 bg-ink-950/95 p-1 text-sm shadow-xl backdrop-blur">
          <div className="flex items-center gap-2 px-3 py-2">
            <User className="h-4 w-4 text-ink-400" />
            <div className="min-w-0">
              <p className="truncate text-ink-100">{user?.name ?? "Pengguna"}</p>
              {user?.email ? (
                <p className="truncate text-[11px] text-ink-400">
                  {user.email}
                </p>
              ) : null}
            </div>
          </div>
          <div className="my-1 h-px bg-ink-800/80" />
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-ink-200 hover:bg-ink-800/80 hover:text-white"
          >
            <UserCircle className="h-4 w-4" /> Profil saya
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-ink-200 hover:bg-ink-800/80 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      ) : null}
    </div>
  );
}
