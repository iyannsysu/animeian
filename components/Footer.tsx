import Link from "next/link";
import { Heart, Tv, Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-white/10 bg-gradient-to-b from-transparent to-ink-950 pb-20 pt-10 sm:pb-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px mx-auto h-px w-2/3 bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-[120%] -translate-x-1/2 rounded-[50%] bg-gradient-to-r from-indigo-500/10 via-fuchsia-500/10 to-brand-500/10 blur-3xl"
      />

      <div className="container-page relative">
        <div className="flex flex-col items-center gap-5 text-center">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold tracking-tight"
          >
            <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-brand-500 text-white shadow-[0_0_30px_-6px_rgba(129,140,248,0.8)]">
              <Tv className="h-4 w-4" />
            </span>
            <span className="text-xl">
              Anime{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-brand-400 bg-clip-text text-transparent">
                Ian
              </span>
            </span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
            <Zap className="h-3 w-3 text-fuchsia-300" />
            Streaming Online Gratis
          </div>

          <p className="max-w-lg bg-gradient-to-r from-white via-indigo-100 to-fuchsia-200 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">
            by{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-brand-300 bg-clip-text text-transparent">
                Iyan
              </span>
              <span
                aria-hidden
                className="absolute -inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-brand-400"
              />
            </span>
          </p>

          <p className="flex items-center gap-1.5 text-[11px] text-ink-500">
            dibuat dengan <Heart className="h-3 w-3 fill-fuchsia-400 text-fuchsia-400" /> buat pecinta anime
          </p>

          <p className="text-[11px] text-ink-600">
            © {new Date().getFullYear()} Anime Ian · Konten disediakan pihak
            ketiga · Situs ini hanya sebagai indeks.
          </p>
        </div>
      </div>
    </footer>
  );
}
