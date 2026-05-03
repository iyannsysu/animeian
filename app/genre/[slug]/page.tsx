import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Sparkles } from "lucide-react";
import { search } from "@/lib/api";
import AnimeGrid from "@/components/AnimeGrid";
import { findGenre, matchesGenre, GENRES } from "@/lib/genres";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const g = findGenre(params.slug);
  return {
    title: g ? `Genre ${g.label} — Anime Ian` : "Genre — Anime Ian",
  };
}

export default async function GenreDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const genre = findGenre(params.slug);
  if (!genre) return notFound();

  let items: Awaited<ReturnType<typeof search>>["data"][number]["result"] = [];
  try {
    const res = await search(genre.label, 1);
    const pool = res.data?.[0]?.result ?? [];
    items = pool.filter((it) => matchesGenre(it.genre, genre.slug));
  } catch {
    items = [];
  }

  const gridItems = items.map((it, idx) => ({
    id: it.id ?? `${it.url}-${idx}`,
    url: it.url,
    judul: it.judul,
    cover: it.cover,
    type: it.status || undefined,
    score: it.score,
    lastup: it.rilis,
  }));

  return (
    <div className="container-page space-y-6">
      <Link
        href="/genre"
        className="inline-flex items-center gap-1 text-sm text-ink-300 hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" /> Semua Genre
      </Link>

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-ink-900/40 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-200">
            <Sparkles className="h-3 w-3" /> Genre
          </div>
          <h1 className="mt-4 bg-gradient-to-r from-white via-indigo-200 to-fuchsia-300 bg-clip-text text-4xl font-black uppercase tracking-tight text-transparent sm:text-6xl">
            {genre.label}
          </h1>
          <p className="mt-3 text-sm text-ink-300">
            {items.length
              ? `${items.length} anime ditemukan`
              : "Belum ada hasil. Coba genre lain."}
          </p>
        </div>
      </section>

      {gridItems.length ? (
        <AnimeGrid items={gridItems} showBadge={false} priorityCount={6} />
      ) : (
        <div className="rounded-xl border border-dashed border-ink-800 p-8 text-center text-sm text-ink-400">
          Hasil kosong. Coba genre lain.
        </div>
      )}

      <section className="pt-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink-400">
          Genre Lain
        </h2>
        <div className="flex flex-wrap gap-2">
          {GENRES.filter((g) => g.slug !== genre.slug)
            .slice(0, 24)
            .map((g) => (
              <Link
                key={g.slug}
                href={`/genre/${g.slug}`}
                className="inline-flex items-center rounded-full border border-white/10 bg-ink-900/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-200 transition hover:border-indigo-400/60 hover:bg-indigo-500/15 hover:text-white"
              >
                {g.label}
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
