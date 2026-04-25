import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Sparkles } from "lucide-react";
import { search } from "@/lib/api";
import AnimeGrid from "@/components/AnimeGrid";
import { findGenre, matchesGenre, GENRES } from "@/lib/genres";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: { slug: string } }) {
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

      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-ink-900/40 p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
          <Sparkles className="h-3 w-3" /> Genre
        </div>
        <h1 className="mt-3 flex items-center gap-3 text-3xl font-black tracking-tight sm:text-4xl">
          <span className="text-3xl sm:text-4xl">{genre.emoji}</span>
          {genre.label}
        </h1>
        <p className="mt-2 text-sm text-ink-300">
          {items.length
            ? `${items.length} anime ditemukan`
            : "Belum ada hasil. Coba genre lain."}
        </p>
      </section>

      {gridItems.length ? (
        <AnimeGrid items={gridItems} showBadge={false} priorityCount={6} />
      ) : (
        <div className="rounded-xl border border-dashed border-ink-800 p-8 text-center text-sm text-ink-400">
          Hasil kosong. Coba genre lain.
        </div>
      )}

      <section className="pt-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-400">
          Genre lain
        </h2>
        <div className="flex flex-wrap gap-2">
          {GENRES.filter((g) => g.slug !== genre.slug)
            .slice(0, 24)
            .map((g) => (
              <Link
                key={g.slug}
                href={`/genre/${g.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-900/60 px-3 py-1.5 text-xs font-medium text-ink-200 transition hover:border-indigo-400/60 hover:bg-indigo-500/15 hover:text-white"
              >
                <span>{g.emoji}</span>
                {g.label}
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
