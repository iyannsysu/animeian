import { Bookmark, Sparkles } from "lucide-react";
import WatchlistView from "@/components/WatchlistView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Watchlist — Anime Ian",
  description: "Daftar anime yang Anda simpan untuk ditonton nanti.",
};

export default function WatchlistPage() {
  return (
    <div className="container-page space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-500/15 via-indigo-500/10 to-ink-900/40 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-200">
            <Bookmark className="h-3 w-3" /> Daftar Tonton
          </div>
          <h1 className="mt-3 bg-gradient-to-r from-white via-fuchsia-200 to-indigo-200 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-5xl">
            Watchlist Saya
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-300">
            Anime yang Anda tandai untuk ditonton nanti. Tersimpan otomatis di
            akun (kalau login) atau di browser (kalau belum login).
          </p>
          <p className="mt-2 inline-flex items-center gap-2 text-[11px] text-ink-400">
            <Sparkles className="h-3 w-3 text-fuchsia-300" />
            Sinkron antar device saat login Google
          </p>
        </div>
      </section>

      <WatchlistView />
    </div>
  );
}
