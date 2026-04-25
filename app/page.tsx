import { getDetail, getHome, getHomePool, getOngoing } from "@/lib/api";
import AnimeGrid from "@/components/AnimeGrid";
import SectionHeader from "@/components/SectionHeader";
import ContinueWatching from "@/components/ContinueWatching";
import HeroCarousel, { type HeroSlide } from "@/components/HeroCarousel";
import PopularSidebar from "@/components/PopularSidebar";
import AnimeRow, { type RowItem } from "@/components/AnimeRow";
import PopularTabs, { type PopularBucket } from "@/components/PopularTabs";
import { Send } from "lucide-react";
import { getTopRanked, getViewCounts } from "@/lib/views";
import type { AnimeCardItem, OngoingItem } from "@/lib/types";

export const revalidate = 300;

async function buildHeroSlides(
  ongoingTop: OngoingItem[]
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

type MetaLookup = Map<string, RowItem>;

function ongoingToRow(it: OngoingItem, views?: number): RowItem {
  return {
    url: it.url,
    judul: it.judul,
    cover: it.cover,
    type: it.type,
    lastch: it.lastch,
    views,
  };
}

function cardToRow(it: AnimeCardItem, views?: number): RowItem {
  return {
    url: it.url,
    judul: it.judul,
    cover: it.cover,
    type: it.type,
    lastch: it.lastch || undefined,
    score: it.score || undefined,
    rilis: it.rilis || undefined,
    status: it.status || undefined,
    views,
  };
}

function buildMetaLookup(
  ongoing: OngoingItem[],
  pool: AnimeCardItem[]
): MetaLookup {
  const m = new Map<string, RowItem>();
  for (const o of ongoing) m.set(o.url, ongoingToRow(o));
  // pool entries are richer (have score/rilis/status) — prefer them if present
  for (const p of pool) m.set(p.url, cardToRow(p));
  return m;
}

async function bucketFromTop(
  win: "week" | "month" | "all",
  label: string,
  meta: MetaLookup,
  counts: Record<string, number>
): Promise<PopularBucket> {
  const top = await getTopRanked(win, 12);
  const items: RowItem[] = [];
  for (const { series, score } of top) {
    const row = meta.get(series);
    if (!row) continue;
    items.push({ ...row, views: counts[series] ?? score });
  }
  return { key: win, label, items };
}

function fallbackPopular(
  ongoing: OngoingItem[],
  pool: AnimeCardItem[],
  counts: Record<string, number>,
  limit = 12
): RowItem[] {
  const all: RowItem[] = [];
  const seen = new Set<string>();
  for (const it of ongoing) {
    if (seen.has(it.url)) continue;
    seen.add(it.url);
    all.push(ongoingToRow(it, counts[it.url] ?? 0));
  }
  for (const it of pool) {
    if (seen.has(it.url)) continue;
    seen.add(it.url);
    all.push(cardToRow(it, counts[it.url] ?? 0));
  }
  return all
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, limit);
}

export default async function HomePage() {
  const [latestRes, ongoingRes, poolRes] = await Promise.allSettled([
    getHome(1),
    getOngoing(),
    getHomePool(3),
  ]);

  const latest: AnimeCardItem[] =
    latestRes.status === "fulfilled" ? latestRes.value.data : [];
  const ongoing =
    ongoingRes.status === "fulfilled" ? ongoingRes.value.data : [];
  const pool: AnimeCardItem[] =
    poolRes.status === "fulfilled" ? poolRes.value : [];

  const topOngoing = ongoing.slice(0, 5);
  const heroSlides = topOngoing.length
    ? await buildHeroSlides(topOngoing)
    : [];

  const completedPool = pool
    .filter((it) => (it.status ?? "").toLowerCase() === "completed")
    .slice(0, 16);

  // Collect view counts for all referenced series
  const allUrls = Array.from(
    new Set([
      ...ongoing.map((o) => o.url),
      ...pool.map((p) => p.url),
      ...latest.map((l) => l.url),
    ])
  );
  const countsMap = await getViewCounts(allUrls);

  const meta = buildMetaLookup(ongoing, pool);

  const [weekBucket, monthBucket, allBucket] = await Promise.all([
    bucketFromTop("week", "Mingguan", meta, countsMap),
    bucketFromTop("month", "Bulanan", meta, countsMap),
    bucketFromTop("all", "Sepanjang Masa", meta, countsMap),
  ]);

  // Fallback: if KV ranking not yet populated, use ongoing + pool ordered by views
  const fallback = fallbackPopular(ongoing, pool, countsMap);
  if (!weekBucket.items.length) weekBucket.items = fallback.slice(0, 10);
  if (!monthBucket.items.length) monthBucket.items = fallback.slice(0, 12);
  if (!allBucket.items.length) allBucket.items = fallback.slice(0, 12);

  const ongoingRow: RowItem[] = ongoing
    .slice(0, 16)
    .map((o) => ongoingToRow(o, countsMap[o.url] ?? 0));
  const completedRow: RowItem[] = completedPool.map((p) =>
    cardToRow(p, countsMap[p.url] ?? 0)
  );

  return (
    <div className="container-page">
      {/* Notification banner */}
      <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-indigo-400/30 bg-gradient-to-r from-indigo-500/10 via-fuchsia-500/10 to-ink-900/40 px-4 py-2.5 text-xs font-medium text-indigo-100 sm:text-sm">
        <Send className="h-3.5 w-3.5 text-indigo-300" />
        Selamat datang di <span className="font-bold">Anime Ian</span> — login
        Google untuk simpan history & komentar di setiap anime.
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-10">
          {heroSlides.length ? <HeroCarousel slides={heroSlides} /> : null}

          <ContinueWatching />

          {ongoingRow.length ? (
            <section>
              <SectionHeader
                title="Ongoing Series"
                subtitle="Anime yang sedang tayang, update tiap minggu"
                href="/anime-list"
              />
              <AnimeRow items={ongoingRow} />
            </section>
          ) : null}

          {completedRow.length ? (
            <section>
              <SectionHeader
                title="Anime Completed"
                subtitle="Sudah tamat — bisa ditonton langsung habis"
              />
              <AnimeRow items={completedRow} badgeLabel="Completed" />
            </section>
          ) : null}

          <section>
            <SectionHeader
              title="Anime Populer"
              subtitle="Ranking berdasarkan jumlah penonton"
            />
            <PopularTabs
              buckets={[
                { ...weekBucket, label: "Mingguan" },
                { ...monthBucket, label: "Bulanan" },
                { ...allBucket, label: "Sepanjang Masa" },
              ]}
            />
          </section>

          {latest.length ? (
            <section>
              <SectionHeader
                title="Update Terbaru"
                subtitle="Rilis paling baru dari katalog"
              />
              <AnimeGrid items={latest} />
            </section>
          ) : null}
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
