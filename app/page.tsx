import { getHome, getOngoing } from "@/lib/api";
import AnimeGrid from "@/components/AnimeGrid";
import SectionHeader from "@/components/SectionHeader";
import { Flame, Sparkles } from "lucide-react";
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

  return (
    <div className="container-page space-y-10">
      {hero ? (
        <section className="relative overflow-hidden rounded-2xl border border-ink-800/60 bg-ink-900/40">
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl"
            style={{ backgroundImage: `url(${hero.cover})` }}
          />
          <div className="relative grid gap-4 p-5 sm:grid-cols-[200px_1fr] sm:gap-6 sm:p-6">
            <img
              src={hero.cover}
              alt={hero.judul}
              loading="eager"
              className="mx-auto aspect-[2/3] w-40 rounded-lg object-cover shadow-xl sm:mx-0 sm:w-full"
            />
            <div className="flex flex-col">
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-600/20 px-2 py-0.5 text-[11px] font-semibold text-brand-300">
                <Sparkles className="h-3 w-3" /> Baru di-upload
              </span>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                {hero.judul}
              </h1>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(hero.genre ?? []).slice(0, 4).map((g) => (
                  <span key={g} className="chip">
                    {g}
                  </span>
                ))}
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-ink-300">
                {hero.sinopsis}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`/anime/${encodeURIComponent(hero.url)}`}
                  className="btn-primary"
                >
                  Lihat detail
                </a>
                <span className="chip">{hero.status}</span>
                {hero.score ? (
                  <span className="chip">★ {hero.score}</span>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <SectionHeader
          title="Update Terbaru"
          subtitle="Rilis paling baru dari katalog"
        />
        <AnimeGrid items={latest} />
      </section>

      <section>
        <SectionHeader
          title="Ongoing"
          subtitle="Anime yang sedang tayang"
          href="/anime-list"
        />
        <div className="flex items-center gap-2 text-xs text-ink-400">
          <Flame className="h-3.5 w-3.5 text-brand-400" /> Update berkala
        </div>
        <div className="mt-3">
          <AnimeGrid items={ongoing} priorityCount={0} />
        </div>
      </section>
    </div>
  );
}
