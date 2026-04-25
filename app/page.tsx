import { getDetail, getHome, getOngoing } from "@/lib/api";
import AnimeGrid from "@/components/AnimeGrid";
import SectionHeader from "@/components/SectionHeader";
import ContinueWatching from "@/components/ContinueWatching";
import HeroCarousel, { type HeroSlide } from "@/components/HeroCarousel";
import PopularSidebar from "@/components/PopularSidebar";
import { Eye, Flame, Send } from "lucide-react";
import { formatViews, getViewCounts } from "@/lib/views";
import type { AnimeCardItem } from "@/lib/types";

export const revalidate = 300;

async function buildHeroSlides(
  ongoingTop: {
    url: string;
    judul: string;
    cover: string;
    lastch?: string;
    type?: string;
  }[]
): Promise<HeroSlide[]> {
  const details = await Promise.allSettled(
    ongoingTop.map((it) => getDetail(it.url))
  );
  const urls = ongoingTop.map((o) => o.url);
  const counts = await getViewCounts(urls);
  const slides: HeroSlide[] = [];
  details.forEach((res, i) => {
    const base = ongoingTop[i];
    if (res.status === "fulfilled") {
      const d = res.value.data?.[0];
      if (d) {
        slides.push({
          series: base.url,
          title: d.judul,
          cover: d.cover || base.cover,
          synopsis: d.sinopsis,
          genres: d.genre,
          status: d.status,
          score: d.rating,
          type: d.type || base.type,
          lastch: base.lastch,
          views: counts[base.url] ?? 0,
        });
        return;
      }
    }
    slides.push({
      series: base.url,
      title: base.judul,
      cover: base.cover,
      type: base.type,
      lastch: base.lastch,
      views: counts[base.url] ?? 0,
    });
  });
  return slides;
}

export default async function HomePage() {
  const [latestRes, ongoingRes] = await Promise.allSettled([
    getHome(1),
    getOngoing(),
  ]);

  const latest: AnimeCardItem[] =
    latestRes.status === "fulfilled" ? latestRes.value.data : [];
  const ongoing =
    ongoingRes.status === "fulfilled" ? ongoingRes.value.data : [];

  const topOngoing = ongoing.slice(0, 5);
  const heroSlides = topOngoing.length
    ? await buildHeroSlides(topOngoing)
    : [];

  const hotStrip = ongoing.slice(0, 12);
  const hotCounts = await getViewCounts(hotStrip.map((o) => o.url));

  return (
    <div className="container-page">
      {/* Notification banner (sokuja-style) */}
      <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-indigo-400/30 bg-gradient-to-r from-indigo-500/10 via-fuchsia-500/10 to-ink-900/40 px-4 py-2.5 text-xs font-medium text-indigo-100 sm:text-sm">
        <Send className="h-3.5 w-3.5 text-indigo-300" />
        Selamat datang di <span className="font-bold">Anime Ian</span> — login
        Google untuk simpan history & komentar di setiap anime.
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-10 min-w-0">
          {heroSlides.length ? <HeroCarousel slides={heroSlides} /> : null}

          <ContinueWatching />

          {hotStrip.length ? (
            <section>
              <SectionHeader
                title="Trending Ongoing"
                subtitle="Geser untuk lihat lebih banyak"
              />
              <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 [scrollbar-width:thin]">
                <div className="flex gap-3 snap-x snap-mandatory">
                  {hotStrip.map((item) => {
                    const v = hotCounts[item.url] ?? 0;
                    return (
                      <a
                        key={item.url}
                        href={`/anime/${encodeURIComponent(item.url)}`}
                        className="group relative w-[140px] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-ink-900/60 sm:w-[160px]"
                      >
                        <div className="relative aspect-[2/3] w-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
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
                            <span className="absolute left-1.5 top-1.5 rounded-md bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              {item.lastch}
                            </span>
                          ) : null}
                          {v > 0 ? (
                            <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                              <Eye className="h-3 w-3" />
                              {formatViews(v)}
                            </span>
                          ) : null}
                          <div className="absolute inset-x-2 bottom-2">
                            <p className="line-clamp-2 text-[12px] font-semibold text-white drop-shadow">
                              {item.judul}
                            </p>
                          </div>
                        </div>
                      </a>
                    );
                  })}
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
              <Flame className="h-3.5 w-3.5 text-indigo-300" /> Update berkala
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

        <div className="hidden lg:block">
          <div className="sticky top-24">
            <PopularSidebar candidates={ongoing} />
          </div>
        </div>
      </div>
    </div>
  );
}
