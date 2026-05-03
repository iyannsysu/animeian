import { getOngoing } from "@/lib/api";
import AnimeGrid from "@/components/AnimeGrid";
import { Flame, Sparkles } from "lucide-react";

export const revalidate = 300;

export const metadata = {
  title: "Ongoing Series — Anime Ian",
  description: "Daftar semua anime yang sedang tayang (ongoing).",
};

export default async function OngoingPage() {
  let items: Awaited<ReturnType<typeof getOngoing>>["data"] = [];
  try {
    items = (await getOngoing()).data ?? [];
  } catch {
    items = [];
  }

  const gridItems = items.map((it) => ({
    id: it.id,
    url: it.url,
    judul: it.judul,
    cover: it.cover,
    lastch: it.lastch,
    lastup: it.lastup,
    type: it.type,
  }));

  return (
    <div className="container-page space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-ink-900/40 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-200">
            <Flame className="h-3 w-3" /> Sedang Tayang
          </div>
          <h1 className="mt-4 bg-gradient-to-r from-white via-indigo-200 to-fuchsia-300 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-5xl">
            Ongoing Series
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-300 sm:text-base">
            Semua anime yang sedang tayang — update tiap minggu, langsung dari
            sumber terbaru.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-ink-400">
            <Sparkles className="h-3 w-3 text-indigo-300" />
            {items.length} seri ditemukan
          </p>
        </div>
      </section>

      <AnimeGrid items={gridItems} priorityCount={6} />
    </div>
  );
}
