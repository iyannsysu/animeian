import Link from "next/link";
import { Crown, Eye } from "lucide-react";
import type { OngoingItem } from "@/lib/types";
import { formatViews, getViewCounts } from "@/lib/views";
import { GENRES } from "@/lib/genres";

type Props = {
  candidates: OngoingItem[];
};

export default async function PopularSidebar({ candidates }: Props) {
  if (!candidates?.length) return null;
  const counts = await getViewCounts(candidates.map((c) => c.url));
  const ranked = [...candidates]
    .map((c) => ({ ...c, _v: counts[c.url] ?? 0 }))
    .sort((a, b) => {
      if (b._v !== a._v) return b._v - a._v;
      return candidates.indexOf(a) - candidates.indexOf(b);
    })
    .slice(0, 10);

  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/5 to-ink-900/60 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-100">
          <Crown className="h-4 w-4 text-amber-300" /> Anime Populer
        </div>
        <ol className="space-y-2.5">
          {ranked.map((item, i) => (
            <li key={item.url}>
              <Link
                href={`/anime/${encodeURIComponent(item.url)}`}
                className="group flex items-center gap-3 rounded-xl px-1.5 py-1 transition hover:bg-white/5"
              >
                <span
                  className={`inline-grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-black ${
                    i === 0
                      ? "bg-gradient-to-br from-amber-300 to-orange-400 text-black"
                      : i === 1
                      ? "bg-gradient-to-br from-slate-200 to-slate-400 text-black"
                      : i === 2
                      ? "bg-gradient-to-br from-orange-400 to-amber-600 text-white"
                      : "bg-white/5 text-ink-300"
                  }`}
                >
                  {i + 1}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.cover}
                  alt={item.judul}
                  loading="lazy"
                  className="h-12 w-9 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[13px] font-semibold text-ink-100 group-hover:text-white">
                    {item.judul}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-ink-400">
                    <span>{item.type || "TV"}</span>
                    {item._v > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatViews(item._v)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-4">
        <div className="mb-3 text-sm font-semibold text-ink-100">
          Genre Populer
        </div>
        <div className="flex flex-wrap gap-1.5">
          {GENRES.slice(0, 14).map((g) => (
            <Link
              key={g.slug}
              href={`/genre/${g.slug}`}
              className="inline-flex items-center rounded-full border border-white/10 bg-ink-900/60 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-200 transition hover:border-indigo-400/60 hover:bg-indigo-500/15 hover:text-white"
            >
              {g.label}
            </Link>
          ))}
          <Link
            href="/genre"
            className="inline-flex items-center rounded-full border border-indigo-400/60 bg-indigo-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-100 hover:bg-indigo-500/25"
          >
            Semua →
          </Link>
        </div>
      </div>
    </aside>
  );
}
