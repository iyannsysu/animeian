import AnimeCard from "./AnimeCard";
import { getViewCounts } from "@/lib/views";

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

export default async function AnimeGrid({
  items,
  showBadge = true,
  priorityCount = 6,
}: {
  items: Item[];
  showBadge?: boolean;
  priorityCount?: number;
}) {
  if (!items?.length) {
    return (
      <div className="rounded-xl border border-dashed border-ink-800 p-8 text-center text-sm text-ink-400">
        Tidak ada hasil.
      </div>
    );
  }

  const counts = await getViewCounts(items.map((i) => i.url));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((it, idx) => (
        <AnimeCard
          key={`${it.id}-${it.url}`}
          href={`/anime/${encodeURIComponent(it.url)}`}
          title={it.judul}
          cover={it.cover}
          badge={showBadge ? it.lastch || it.type || null : null}
          subtitle={it.lastup || null}
          score={it.score || null}
          priority={idx < priorityCount}
          views={counts[it.url] ?? 0}
        />
      ))}
    </div>
  );
}
