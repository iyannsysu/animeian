import { getHomePool, getOngoing } from "@/lib/api";
import type { RankingWindow } from "@/lib/views";
import { getTopRanked, getViewCounts } from "@/lib/views";
import AnimeGrid from "@/components/AnimeGrid";
import Link from "next/link";
import { Crown, Flame, Sparkles, TrendingUp } from "lucide-react";
import type { AnimeCardItem, OngoingItem } from "@/lib/types";

export const revalidate = 300;

type Props = {
  searchParams?: { window?: string };
};

const WINDOWS: Array<{
  key: RankingWindow;
  label: string;
  sub: string;
  icon: "flame" | "trend" | "crown";
}> = [
  { key: "week", label: "Mingguan", sub: "7 hari terakhir", icon: "flame" },
  { key: "month", label: "Bulanan", sub: "30 hari terakhir", icon: "trend" },
  { key: "all", label: "Sepanjang Masa", sub: "All time", icon: "crown" },
];

function iconFor(kind: "flame" | "trend" | "crown") {
  if (kind === "flame") return <Flame className="h-3 w-3" />;
  if (kind === "trend") return <TrendingUp className="h-3 w-3" />;
  return <Crown className="h-3 w-3" />;
}

export async function generateMetadata({ searchParams }: Props) {
  const w = (searchParams?.window ?? "all") as RankingWindow;
  const hit = WINDOWS.find((x) => x.key === w) ?? WINDOWS[2];
  return { title: `Anime Populer ${hit.label} — Anime Ian` };
}

type Item = {
  id: string | number;
  url: string;
  judul: string;
  cover: string;
  lastch?: string;
  lastup?: string;
  type?: string;
  score?: string;
};

function cardToItem(it: AnimeCardItem): Item {
  return {
    id: it.id,
    url: it.url,
    judul: it.judul,
    cover: it.cover,
    lastch: it.lastch,
    lastup: it.rilis || it.lastup,
    type: it.type,
    score: it.score,
  };
}

function ongoingToItem(it: OngoingItem): Item {
  return {
    id: it.id,
    url: it.url,
    judul: it.judul,
    cover: it.cover,
    lastch: it.lastch,
    lastup: it.lastup,
    type: it.type,
  };
}

export default async function PopulerPage({ searchParams }: Props) {
  const win = ((searchParams?.window ?? "all") as RankingWindow) || "all";
  const active = WINDOWS.find((w) => w.key === win) ?? WINDOWS[2];

  const [ongoingRes, poolRes, topRes] = await Promise.allSettled([
    getOngoing(),
    getHomePool(4),
    getTopRanked(win, 60),
  ]);

  const ongoing: OngoingItem[] =
    ongoingRes.status === "fulfilled" ? ongoingRes.value.data ?? [] : [];
  const pool: AnimeCardItem[] =
    poolRes.status === "fulfilled" ? poolRes.value : [];
  const top = topRes.status === "fulfilled" ? topRes.value : [];

  const meta = new Map<string, Item>();
  for (const o of ongoing) meta.set(o.url, ongoingToItem(o));
  for (const p of pool) meta.set(p.url, cardToItem(p));

  const allUrls = Array.from(
    new Set([...ongoing.map((o) => o.url), ...pool.map((p) => p.url)])
  );
  const counts = await getViewCounts(allUrls);

  let items: Item[] = [];
  if (top.length) {
    for (const { series } of top) {
      const row = meta.get(series);
      if (row) items.push(row);
    }
  }
  // Fallback: urutkan semua kandidat berdasarkan total view count
  if (!items.length) {
    items = Array.from(meta.values())
      .sort((a, b) => (counts[b.url] ?? 0) - (counts[a.url] ?? 0))
      .slice(0, 60);
  }

  return (
    <div className="container-page space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-ink-900/40 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-200">
            {iconFor(active.icon)} {active.sub}
          </div>
          <h1 className="mt-4 bg-gradient-to-r from-white via-indigo-200 to-fuchsia-300 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-5xl">
            Anime Populer — {active.label}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-300 sm:text-base">
            Ranking anime berdasarkan jumlah penonton di Anime Ian.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-ink-400">
            <Sparkles className="h-3 w-3 text-indigo-300" />
            {items.length} seri
          </p>
        </div>
      </section>

      <nav className="flex flex-wrap gap-1.5">
        {WINDOWS.map((w) => {
          const isActive = w.key === win;
          return (
            <Link
              key={w.key}
              href={`/populer?window=${w.key}`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                isActive
                  ? "border-indigo-400/60 bg-gradient-to-r from-indigo-500/25 via-fuchsia-500/20 to-brand-500/15 text-white shadow-[0_8px_24px_-12px_rgba(129,140,248,0.7)]"
                  : "border-white/10 bg-ink-900/60 text-ink-300 hover:border-indigo-400/40 hover:text-white"
              }`}
            >
              {iconFor(w.icon)}
              {w.label}
            </Link>
          );
        })}
      </nav>

      <AnimeGrid items={items} priorityCount={6} />
    </div>
  );
}
