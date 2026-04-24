import { getHome, getOngoing } from "@/lib/api";
import AnimeGrid from "@/components/AnimeGrid";
import SectionHeader from "@/components/SectionHeader";
import ContinueWatching from "@/components/ContinueWatching";
import { Flame, Play, Sparkles, Star } from "lucide-react";
import type { AnimeCardItem } from "@/lib/types";

export const revalidate = 300;

export default async function HomePage() {
  const [latestRes, ongoingRes] = await Promise.allSettled([
    getHome(1),
    getOngoing(),
  ]);

  const latest: AnimeCardItem[] =
    latestRes.status === "fulfilled" ? latestRes.value.data : [];
  const ongoing =
    ongoingRes.status === "fulfilled" ? ongoingRes.value.data : [];

  const hero = latest[0];
  const hotStrip = ongoing.slice(0, 8);

  return (
    <div className="container-page space-y-12">
      {hero ? (
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-900/40 shadow-[0_25px_60px_-20px_rgba(0,0,0,0.6)]">
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${hero.cover})` }}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-ink-950/90 via-ink-950/70 to-transparent"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent"
          />
          <div className="relative grid gap-5 p-5 sm:grid-cols-[220px_1fr] sm:gap-7 sm:p-8">
            <div className="relative mx-auto aspect-[2/3] w-40 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 sm:mx-0 sm:w-full">
              <img
                src={hero.cover}
                alt={hero.judul}
                loading="eager"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-brand-500/40 bg-brand-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-200">
                <Sparkles className="h-3 w-3" /> Sedang Tayang
              </span>
              <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                {hero.judul}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-300">
                {hero.status ? <span>{hero.status}</span> : null}
                {hero.score ? (
                  <span className="inline-flex items-center gap-1 text-yellow-300">
                    <Star className="h-3.5 w-3.5 fill-yellow-300" /> {hero.score}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(hero.genre ?? []).slice(0, 4).map((g) => (
                  <span key={g} className="chip">
                    {g}
                  </span>
                ))}
              </div>
              <p className="mt-4 line-clamp-3 text-sm text-ink-300 sm:line-clamp-4">
                {hero.sinopsis}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={`/anime/${encodeURIComponent(hero.url)}`}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(239,68,68,0.8)] transition hover:brightness-110"
                >
                  <Play className="h-4 w-4 fill-current" /> Tonton Sekarang
                </a>
                <a
                  href={`/anime/${encodeURIComponent(hero.url)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
                >
                  Detail
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <ContinueWatching />

      {hotStrip.length ? (
        <section>
          <SectionHeader
            title="Trending Ongoing"
            subtitle="Geser untuk lihat lebih banyak"
          />
          <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 [scrollbar-width:thin]">
            <div className="flex gap-3 snap-x snap-mandatory">
              {hotStrip.map((item) => (
                <a
                  key={item.url}
                  href={`/anime/${encodeURIComponent(item.url)}`}
                  className="group relative w-[140px] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-ink-900/60 sm:w-[160px]"
                >
                  <div className="relative aspect-[2/3] w-full">
                    <img
                      src={item.cover}
                      alt={item.judul}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/85 to-transparent" />
                    {item.type ? (
                      <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                        {item.type}
                      </span>
                    ) : null}
                    {item.lastch ? (
                      <span className="absolute left-1.5 top-1.5 rounded-md bg-brand-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {item.lastch}
                      </span>
                    ) : null}
                    <div className="absolute inset-x-2 bottom-2">
                      <p className="line-clamp-2 text-[12px] font-semibold text-white drop-shadow">
                        {item.judul}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <SectionHeader
          title="Ongoing"
          subtitle="Anime yang sedang tayang"
          href="/anime-list"
        />
        <div className="mb-3 flex items-center gap-2 text-xs text-ink-400">
          <Flame className="h-3.5 w-3.5 text-brand-400" /> Update berkala
        </div>
        <AnimeGrid items={ongoing} priorityCount={4} />
      </section>

      <section>
        <SectionHeader
          title="Update Terbaru"
          subtitle="Rilis paling baru dari katalog"
        />
        <AnimeGrid items={latest} />
      </section>
    </div>
  );
}
