"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Tv } from "lucide-react";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";

  useEffect(() => {
    if (status === "authenticated") router.replace(callbackUrl);
  }, [status, router, callbackUrl]);

  return (
    <div className="container-page">
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-6 text-center">
        <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 shadow-[0_0_40px_-5px_rgba(239,68,68,0.6)]">
          <Tv className="h-7 w-7 text-white" />
          <span className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 opacity-30 blur-lg" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Masuk ke Anime Ian
          </h1>
          <p className="text-sm text-ink-400">
            Simpan progress tontonan, kualitas, dan daftar favoritmu di semua
            perangkat.
          </p>
        </div>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="inline-flex items-center gap-3 rounded-full border border-ink-700/70 bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-sm transition hover:bg-ink-100"
        >
          <GoogleLogo className="h-5 w-5" />
          Lanjutkan dengan Google
        </button>
        <p className="text-[11px] text-ink-500">
          Kami hanya mengambil nama, email, dan foto profil dari akun Google Anda.
        </p>
      </div>
    </div>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 5.9 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.1l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 5.9 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.1z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.5-5.3l-6.2-5.2c-2 1.5-4.6 2.5-7.3 2.5-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.4 39.6 16.1 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.5l6.2 5.2c-.4.4 6.6-4.8 6.6-14.7 0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
