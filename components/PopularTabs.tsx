"use client";

import { useState } from "react";
import AnimeRow, { type RowItem } from "@/components/AnimeRow";
import { Crown, Flame, TrendingUp } from "lucide-react";

export type PopularBucket = {
  key: "week" | "month" | "all";
  label: string;
  items: RowItem[];
};

type Props = {
  buckets: PopularBucket[];
};

const ICONS = {
  week: <Flame className="h-3.5 w-3.5" />,
  month: <TrendingUp className="h-3.5 w-3.5" />,
  all: <Crown className="h-3.5 w-3.5" />,
} as const;

export default function PopularTabs({ buckets }: Props) {
  const [active, setActive] = useState<"week" | "month" | "all">(
    buckets.find((b) => b.items.length)?.key ?? "all"
  );
  const current = buckets.find((b) => b.key === active) ?? buckets[0];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {buckets.map((b) => {
          const isActive = b.key === active;
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => setActive(b.key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                isActive
                  ? "border-indigo-400/60 bg-gradient-to-r from-indigo-500/25 via-fuchsia-500/20 to-brand-500/15 text-white shadow-[0_8px_24px_-12px_rgba(129,140,248,0.7)]"
                  : "border-white/10 bg-ink-900/60 text-ink-300 hover:border-indigo-400/40 hover:text-white"
              }`}
            >
              {ICONS[b.key]}
              {b.label}
            </button>
          );
        })}
      </div>
      {current?.items.length ? (
        <AnimeRow items={current.items} />
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-ink-950/40 p-8 text-center text-xs text-ink-400">
          Belum ada ranking. Data akan terkumpul saat pengguna menonton.
        </div>
      )}
    </div>
  );
}
