import Link from "next/link";
import type { EpisodeItem } from "@/lib/types";

export default function EpisodeList({
  series,
  episodes,
  currentSlug,
}: {
  series: string;
  episodes: EpisodeItem[];
  currentSlug?: string;
}) {
  if (!episodes?.length) {
    return (
      <p className="rounded-xl border border-dashed border-ink-800 p-6 text-center text-sm text-ink-400">
        Belum ada episode.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
      {episodes.map((ep) => {
        const active = currentSlug === ep.url;
        return (
          <Link
            key={ep.id}
            href={`/watch/${encodeURIComponent(series)}/${encodeURIComponent(
              ep.url
            )}`}
            className={`rounded-lg border px-2 py-2 text-center text-xs transition ${
              active
                ? "border-brand-500 bg-brand-600/20 text-brand-200"
                : "border-ink-800 bg-ink-900/40 text-ink-200 hover:border-ink-700 hover:bg-ink-800/60"
            }`}
          >
            <div className="font-semibold">Ep {ep.ch}</div>
            <div className="mt-0.5 truncate text-[10px] text-ink-400">
              {ep.date}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
