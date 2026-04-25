import { getHomePool } from "@/lib/api";
import AnimeGrid from "@/components/AnimeGrid";
import { CheckCircle2, Sparkles } from "lucide-react";

export const revalidate = 600;

export const metadata = {
  title: "Anime Completed — Anime Ian",
  description: "Daftar anime yang sudah tamat dan bisa ditonton langsung habis.",
};

export default async function CompletedPage() {
  const pool = await getHomePool(6);
  const completed = pool.filter(
    (it) => (it.status ?? "").toLowerCase() === "completed"
  );

  const gridItems = completed.map((it) => ({
    id: it.id,
    url: it.url,
    judul: it.judul,
    cover: it.cover,
    lastch: it.lastch,
    lastup: it.rilis || it.lastup,
    type: it.type,
    score: it.score,
  }));

  return (
    <div className="container-page space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/15 via-indigo-500/10 to-ink-900/40 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Sudah Tamat
          </div>
          <h1 className="mt-4 bg-gradient-to-r from-white via-emerald-200 to-indigo-300 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-5xl">
            Anime Completed
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-300 sm:text-base">
            Anime yang sudah tamat, bisa langsung ditonton dari episode 1 sampai
            akhir tanpa nunggu.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-ink-400">
            <Sparkles className="h-3 w-3 text-emerald-300" />
            {completed.length} seri ditemukan
          </p>
        </div>
      </section>

      <AnimeGrid items={gridItems} priorityCount={6} />
    </div>
  );
}
