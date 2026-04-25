"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Trash2 } from "lucide-react";
import { readLocal, writeLocal, type WatchlistItem } from "@/lib/watchlist";

export default function WatchlistView() {
  const { status } = useSession();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    const local = readLocal();
    setItems(local);
    if (status === "authenticated") {
      setLoading(true);
      fetch("/api/watchlist", { cache: "no-store" })
        .then((r) => r.json())
        .then((d: { items?: WatchlistItem[] }) => {
          if (cancel) return;
          // Merge dengan local, dedupe
          const merged = [...(d.items ?? [])];
          const seen = new Set(merged.map((i) => i.series));
          for (const li of local) {
            if (!seen.has(li.series)) merged.push(li);
          }
          merged.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
          setItems(merged);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancel) setLoading(false);
        });
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
    return () => {
      cancel = true;
    };
  }, [status]);

  async function remove(series: string) {
    setItems((prev) => prev.filter((it) => it.series !== series));
    writeLocal(readLocal().filter((it) => it.series !== series));
    if (status === "authenticated") {
      try {
        await fetch(`/api/watchlist?series=${encodeURIComponent(series)}`, {
          method: "DELETE",
        });
      } catch {
        /* noop */
      }
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[2/3] rounded-xl" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-ink-900/40 p-8 text-center text-sm text-ink-400">
        Watchlist masih kosong. Klik tombol{" "}
        <span className="font-bold text-fuchsia-300">Watchlist</span> di
        halaman detail anime untuk menambah.
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((it) => (
        <li
          key={it.series}
          className="group relative overflow-hidden rounded-xl border border-white/10 bg-ink-900/60"
        >
          <Link href={`/anime/${encodeURIComponent(it.series)}`}>
            <div className="relative aspect-[2/3] overflow-hidden bg-ink-800">
              {it.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.cover}
                  alt={it.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : null}
              {it.type ? (
                <span className="absolute left-1.5 top-1.5 rounded-full border border-white/15 bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white/90 backdrop-blur">
                  {it.type}
                </span>
              ) : null}
            </div>
            <div className="p-2">
              <p className="line-clamp-2 text-xs font-bold text-ink-100">
                {it.title}
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => remove(it.series)}
            aria-label="Hapus dari watchlist"
            className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full border border-rose-400/40 bg-black/70 text-rose-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}
