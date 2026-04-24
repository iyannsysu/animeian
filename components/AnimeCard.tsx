import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

type Props = {
  href: string;
  title: string;
  cover: string;
  badge?: string | null;
  subtitle?: string | null;
  score?: string | null;
  priority?: boolean;
};

export default function AnimeCard({
  href,
  title,
  cover,
  badge,
  subtitle,
  score,
  priority = false,
}: Props) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl border border-ink-800/60 bg-ink-900/40 transition hover:border-brand-500/50"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-ink-900">
        <Image
          src={cover}
          alt={title}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 180px"
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/80 to-transparent" />
      </div>
      <div className="p-2.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold text-ink-100">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[11px] text-ink-400">{subtitle}</p>
        ) : null}
      </div>
    </Link>
  );
}
