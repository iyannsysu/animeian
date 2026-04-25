import Image from "next/image";
import Link from "next/link";
import { Eye, Play, Star } from "lucide-react";
import { formatViews } from "@/lib/views";

type Props = {
  href: string;
  title: string;
  cover: string;
  badge?: string | null;
  subtitle?: string | null;
  score?: string | null;
  priority?: boolean;
  views?: number;
};

export default function AnimeCard({
  href,
  title,
  cover,
  badge,
  subtitle,
  score,
  priority = false,
  views,
}: Props) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-ink-900/40 shadow-[0_6px_20px_-10px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 hover:border-brand-500/50 hover:shadow-[0_20px_40px_-15px_rgba(239,68,68,0.4)]"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-ink-900">
        <Image
          src={cover}
          alt={title}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 180px"
          className="object-cover transition duration-500 group-hover:scale-[1.06]"
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          unoptimized
        />
        {badge ? (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-brand-600/95 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
            {badge}
          </span>
        ) : null}
        {score ? (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-300 backdrop-blur">
            <Star className="h-3 w-3 fill-yellow-300" />
            {score}
          </span>
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/80 to-transparent" />
        {typeof views === "number" && views > 0 ? (
          <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            <Eye className="h-3 w-3" />
            {formatViews(views)}
          </span>
        ) : null}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-500/90 text-white shadow-lg backdrop-blur">
            <Play className="h-5 w-5 fill-current" />
          </span>
        </div>
      </div>
      <div className="p-2.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold text-ink-100 group-hover:text-white">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[11px] text-ink-400">{subtitle}</p>
        ) : null}
      </div>
    </Link>
  );
}
