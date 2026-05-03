"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import type { AchievementDef } from "@/lib/achievements";

type Resp = {
  ok: boolean;
  have?: string[];
  defs?: AchievementDef[];
  stats?: {
    comments: number;
    likesReceived: number;
    watchSeconds: number;
    listCount: number;
    followers: number;
    level: number;
    verified: boolean;
  };
};

export default function AchievementsPanel({ userId }: { userId?: string }) {
  const [data, setData] = useState<Resp | null>(null);

  useEffect(() => {
    const url = userId
      ? `/api/achievements?userId=${encodeURIComponent(userId)}`
      : "/api/achievements";
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: Resp) => setData(d))
      .catch(() => {});
  }, [userId]);

  const defs = data?.defs ?? [];
  const have = new Set(data?.have ?? []);
  const earned = defs.filter((d) => have.has(d.key));
  const locked = defs.filter((d) => !have.has(d.key));

  return (
    <section className="rounded-3xl border border-white/10 bg-ink-900/50 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-lg font-black tracking-tight">
          <Trophy className="h-5 w-5 text-amber-300" /> Pencapaian
        </h2>
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
          {earned.length}/{defs.length}
        </span>
      </header>

      {earned.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {earned.map((d) => (
            <span
              key={d.key}
              title={d.desc}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${d.color}`}
            >
              <span className="text-base leading-none">{d.emoji}</span>
              {d.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-ink-400">
          Belum ada pencapaian. Mulai komen, follow, atau nonton untuk dapat badge!
        </p>
      )}

      {locked.length > 0 ? (
        <details className="mt-4 group">
          <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-wider text-ink-400 hover:text-ink-200">
            Lihat yang belum didapat ({locked.length}) →
          </summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {locked.map((d) => (
              <span
                key={d.key}
                title={d.desc}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-950/60 px-3 py-1.5 text-xs font-semibold text-ink-500 grayscale"
              >
                <span className="text-base leading-none">{d.emoji}</span>
                {d.name}
              </span>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
