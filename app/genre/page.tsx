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
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-ink-900/40 p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
          <Sparkles className="h-3 w-3" /> Jelajahi Genre
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          Pilih Genre Favoritmu
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-300">
          Temukan anime sesuai selera — mulai dari aksi menegangkan, romansa
          manis, sampai petualangan isekai yang seru.
        </p>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {GENRES.map((g) => (
            <Link
              key={g.slug}
              href={`/genre/${g.slug}`}
              className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-ink-900/60 px-4 py-3 text-sm font-semibold text-ink-100 transition hover:-translate-y-0.5 hover:border-indigo-400/60 hover:bg-gradient-to-br hover:from-indigo-500/20 hover:to-fuchsia-500/10 hover:text-white hover:shadow-[0_14px_30px_-15px_rgba(99,102,241,0.5)]"
            >
              <span className="text-lg">{g.emoji}</span>
              <span>{g.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
