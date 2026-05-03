import Link from "next/link";
import { Eye, Star } from "lucide-react";
import { formatViews } from "@/lib/views";

export type RowItem = {
  url: string;
  judul: string;
  cover: string;
  type?: string;
  lastch?: string;
  score?: string;
  rilis?: string;
  status?: string;
  views?: number;
};

type Props = {
  items: RowItem[];
  badgeLabel?: string; // optional overlay like "COMPLETED"
};

export default function AnimeRow({ items, badgeLabel }: Props) {
  if (!items?.length) return null;
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 [scrollbar-width:thin]">
      <ol className="flex gap-3 snap-x snap-mandatory">
        {items.map((item) => (
          <li
            key={item.url}
            className="w-[150px] shrink-0 snap-start sm:w-[170px]"
          >
            <Link
              href={`/anime/${encodeURIComponent(item.url)}`}
              className="group block"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-ink-900/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.cover}
                  alt={item.judul}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 to-transparent" />

                {item.lastch ? (
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {item.lastch}
                  </span>
                ) : null}

                {badgeLabel ? (
                  <span className="absolute right-1.5 top-1.5 rounded-md bg-emerald-500/85 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                    {badgeLabel}
                  </span>
                ) : item.type ? (
                  <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                    {item.type}
                  </span>
                ) : null}

                {item.score ? (
                  <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200 backdrop-blur">
                    <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                    {item.score}
                  </span>
                ) : null}

                {item.views && item.views > 0 ? (
                  <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                    <Eye className="h-3 w-3" />
                    {formatViews(item.views)}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 px-0.5">
                <p className="line-clamp-2 text-[13px] font-bold leading-snug text-ink-100 group-hover:text-white">
                  {item.judul}
                </p>
                {item.rilis || item.status ? (
                  <p className="mt-0.5 line-clamp-1 text-[10px] uppercase tracking-wide text-ink-500">
                    {[item.status, item.rilis].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
