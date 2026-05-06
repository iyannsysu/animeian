"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AnimeCard from "./AnimeCard";

type Item = {
  id: string | number;
  url: string;
  judul: string;
  cover: string;
  lastch?: string;
  lastup?: string;
  type?: string;
  score?: string;
  views?: number;
};

export default function CompletedInfinite({
  initialItems,
  initialPage = 1,
  initialHasMore = true,
}: {
  initialItems: Item[];
  initialPage?: number;
  initialHasMore?: boolean;
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!initialHasMore);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const seen = useRef<Set<string>>(new Set(initialItems.map((i) => i.url)));

  const loadMore = useCallback(async () => {
    if (loading || done) return;
    setLoading(true);
    const next = page + 1;
    try {
      const res = await fetch(`/api/completed?page=${next}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setDone(true);
        return;
      }
      const j = (await res.json()) as { items: Item[]; hasMore: boolean };
      const fresh = (j.items ?? []).filter((it) => !seen.current.has(it.url));
      fresh.forEach((it) => seen.current.add(it.url));
      if (j.hasMore === false) setDone(true);
      if (fresh.length > 0) {
        setItems((prev) => [...prev, ...fresh]);
      }
      setPage(next);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  }, [loading, done, page]);

  useEffect(() => {
    if (done) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "600px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore, done]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((it, idx) => (
          <AnimeCard
            key={`${it.id}-${it.url}`}
            href={`/anime/${encodeURIComponent(it.url)}`}
            title={it.judul}
            cover={it.cover}
            badge={it.lastch || it.type || "Completed"}
            subtitle={it.lastup || null}
            score={it.score || null}
            priority={idx < 6}
            views={it.views ?? 0}
          />
        ))}
      </div>

      <div
        ref={sentinelRef}
        className="flex h-20 items-center justify-center text-sm text-ink-400"
      >
        {loading && (
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Memuat lagi…
          </span>
        )}
        {done && !loading && items.length > 0 && (
          <span className="text-ink-500">Sudah sampai akhir.</span>
        )}
        {done && !loading && items.length === 0 && (
          <span className="text-ink-500">Belum ada anime completed.</span>
        )}
      </div>
    </>
  );
}
