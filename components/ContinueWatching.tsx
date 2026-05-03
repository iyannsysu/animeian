"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";
import {
  getHistory,
  mergeServerHistory,
  removeHistory,
  type HistoryEntry,
} from "@/lib/history";
import { useSession } from "next-auth/react";

export default function ContinueWatching() {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [ready, setReady] = useState(false);
  const { status } = useSession();

  useEffect(() => {
    setItems(getHistory());
    setReady(true);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    mergeServerHistory()
      .then((merged) => setItems(merged))
      .catch(() => {});
  }, [status]);

  const remove = (e: HistoryEntry) => {
    removeHistory(e.series, e.slug);
    setItems((prev) =>
      prev.filter((i) => !(i.series === e.series && i.slug === e.slug))
    );
  };

  if (!ready || !items.length) return null;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">
            Lanjut Tonton
          </h2>
          <p className="text-xs text-ink-400 sm:text-sm">
            Episode terakhir yang Anda tonton
          </p>
        </div>
        <Link
          href="/profile"
          className="text-xs text-brand-400 hover:text-brand-300 sm:text-sm"
        >
          Lihat semua
        </Link>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        <div className="flex snap-x snap-mandatory gap-3">
          {items.slice(0, 12).map((e) => {
            const pct = e.duration
              ? Math.min(100, Math.max(0, (e.progress / e.duration) * 100))
              : 0;
            const href = `/watch/${encodeURIComponent(
              e.series
            )}/${encodeURIComponent(e.slug)}`;
            return (
              <div
                key={`${e.series}::${e.slug}`}
                className="group relative w-[220px] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-ink-900/60"
              >
                <Link href={href} className="block">
                  <div className="relative aspect-video w-full overflow-hidden bg-ink-900">
                    {e.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={e.cover}
                        alt={e.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                      />
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-500/90 text-white shadow-lg">
                        <Play className="h-5 w-5 fill-current" />
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-fuchsia-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="line-clamp-1 text-[13px] font-semibold text-ink-100">
                      {e.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-400">
                      Episode {e.episode} · {formatTime(e.progress)} /{" "}
                      {formatTime(e.duration)}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => remove(e)}
                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/80"
                  aria-label="Hapus dari riwayat"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function formatTime(s: number) {
  if (!s || !Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = (m % 60).toString().padStart(2, "0");
    return `${h}:${mm}:${ss}`;
  }
  return `${m}:${ss}`;
}
