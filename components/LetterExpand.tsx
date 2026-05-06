"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";

type Item = {
  id: string;
  judul: string;
  url: string;
};

export default function LetterExpand({ letter }: { letter: string }) {
  const [extra, setExtra] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  // SSR already pre-loaded pages 1+2; we start client paging at page 3.
  const [nextPage, setNextPage] = useState(3);

  const loadMore = async () => {
    if (loading || done) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/anime-list?letter=${letter}&page=${nextPage}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        setDone(true);
        return;
      }
      const j = (await res.json()) as { items: Item[]; hasNext: boolean };
      const seen = new Set([
        ...extra.map((it) => it.url),
      ]);
      const fresh = (j.items ?? []).filter((it) => !seen.has(it.url));
      if (fresh.length === 0 || j.hasNext === false) setDone(true);
      if (fresh.length > 0) setExtra((prev) => [...prev, ...fresh]);
      setNextPage((p) => p + 1);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {extra.length > 0 ? (
        <ul className="mt-1 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {extra.map((item) => (
            <li key={item.id}>
              <Link
                href={`/anime/${encodeURIComponent(item.url)}`}
                className="block truncate rounded px-2 py-1 text-sm text-ink-300 hover:bg-ink-800/60 hover:text-white"
              >
                {item.judul}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {!done ? (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink-900/60 px-4 py-1.5 text-xs font-semibold text-ink-200 transition hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10 hover:text-white disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {loading ? "Memuat…" : `Muat lebih banyak ${letter}`}
        </button>
      ) : extra.length > 0 ? (
        <p className="mt-2 text-[11px] text-ink-500">
          Sudah sampai akhir untuk huruf {letter}.
        </p>
      ) : null}
    </>
  );
}
