import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function SectionHeader({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
        {subtitle ? (
          <p className="text-xs text-ink-400 sm:text-sm">{subtitle}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="inline-flex items-center gap-0.5 text-xs text-brand-400 hover:text-brand-300 sm:text-sm"
        >
          Lihat semua <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
