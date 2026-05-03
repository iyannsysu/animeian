import Link from "next/link";
import { GENRES } from "@/lib/genres";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Genre — Anime Ian",
  description: "Telusuri anime berdasarkan genre favoritmu.",
};

export default function GenrePage() {
  return (
    <div className="container-page space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-ink-900/40 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-200">
            <Sparkles className="h-3 w-3" /> Jelajahi Genre
          </div>
          <h1 className="mt-4 bg-gradient-to-r from-white via-indigo-200 to-fuchsia-300 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-5xl">
            Pilih Genre Favoritmu
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-ink-300 sm:text-base">
            Temukan anime sesuai selera — dari aksi menegangkan, romansa manis,
            sampai petualangan isekai yang seru.
          </p>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {GENRES.map((g, i) => (
            <Link
              key={g.slug}
              href={`/genre/${g.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-ink-900/80 to-ink-900/40 p-[1px] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-15px_rgba(129,140,248,0.6)]"
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 via-fuchsia-500/0 to-indigo-500/0 opacity-0 transition group-hover:from-indigo-500/25 group-hover:via-fuchsia-500/20 group-hover:to-brand-500/15 group-hover:opacity-100"
              />
              <div className="relative flex items-center justify-between rounded-2xl bg-ink-950/70 px-4 py-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-500 group-hover:text-indigo-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="bg-gradient-to-r from-white to-ink-200 bg-clip-text text-base font-black uppercase tracking-wide text-transparent transition group-hover:from-indigo-200 group-hover:to-fuchsia-200 sm:text-lg">
                  {g.label}
                </span>
                <span className="text-xs text-ink-500 transition group-hover:text-indigo-300">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
