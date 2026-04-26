"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, PlayCircle } from "lucide-react";
import { mergeServerHistory, type HistoryEntry } from "@/lib/history";

/**
 * Client-side history list untuk halaman /profile.
 *
 * Server-render kasih daftar awal (dari Redis). Setelah mount, kita merge
 * dengan localStorage supaya history yang ditonton sebelum login juga muncul,
 * lalu push entry lokal ke server (lewat saveHistory side-effect) supaya
 * sinkron permanen.
 */
export default function ProfileHistoryList({
  initial,
}: {
  initial: HistoryEntry[];
}) {
  const [items, setItems] = useState<HistoryEntry[]>(initial);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // mergeServerHistory: ambil dari /api/history + localStorage,
        // gabung, simpan balik ke localStorage. Tidak push ke server.
        const merged = await mergeServerHistory();
        if (cancelled) return;
        if (merged.length) setItems(merged);

        // Push entry yang cuma ada di local (atau lebih baru) ke server.
        const serverIds = new Set(initial.map((e) => `${e.series}::${e.slug}`));
        const toPush = merged.filter((e) => {
          const k = `${e.series}::${e.slug}`;
          if (!serverIds.has(k)) return true;
          const prev = initial.find(
            (s) => s.series === e.series && s.slug === e.slug
          );
          return prev && e.updatedAt > prev.updatedAt;
        });
        await Promise.all(
          toPush.map((entry) =>
            fetch("/api/history", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(entry),
            }).catch(() => {})
          )
        );
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initial]);

  if (!items.length) {
    return (
      <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-white/10 bg-ink-900/40 p-8 text-center text-ink-400">
        <Clock className="h-6 w-6 text-ink-500" />
        <p className="text-sm">
          Belum ada anime yang ditonton. Mulai pilih dari Home!
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {items.map((e) => {
        const pct = e.duration
          ? Math.min(100, Math.max(0, (e.progress / e.duration) * 100))
          : 0;
        const href = `/watch/${encodeURIComponent(e.series)}/${encodeURIComponent(
          e.slug
        )}`;
        return (
          <li key={`${e.series}::${e.slug}`}>
            <Link
              href={href}
              className="group flex gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-ink-900/70 to-ink-900/40 p-2.5 transition hover:-translate-y-0.5 hover:border-indigo-400/50 hover:shadow-[0_12px_30px_-15px_rgba(129,140,248,0.55)]"
            >
              <div className="relative aspect-video h-20 shrink-0 overflow-hidden rounded-xl bg-ink-800">
                {e.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.cover}
                    alt={e.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition group-hover:opacity-100" />
                <PlayCircle className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-brand-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-bold text-ink-100 group-hover:text-white">
                  {e.title}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-200">
                  Ep {e.episode}
                </p>
                <p className="mt-1.5 text-[11px] text-ink-500">
                  {fmt(e.progress)} / {fmt(e.duration)}
                </p>
                <p className="text-[10px] text-ink-500">{relTime(e.updatedAt)}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function fmt(s: number): string {
  if (!Number.isFinite(s) || s <= 0) return "0:00";
  const total = Math.floor(s);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "baru saja";
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} hari lalu`;
  return `${Math.floor(day / 30)} bulan lalu`;
}
