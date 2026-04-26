import { ShieldCheck } from "lucide-react";
import { tierFor } from "@/lib/level";

type Size = "xs" | "sm" | "md" | "lg";

const SIZE: Record<
  Size,
  { wrap: string; text: string; lvl: string; name: string }
> = {
  xs: {
    wrap: "gap-1 px-1.5 py-0.5 text-[10px]",
    text: "text-[10px]",
    lvl: "text-[9px]",
    name: "text-[10px]",
  },
  sm: {
    wrap: "gap-1.5 px-2 py-0.5 text-[11px]",
    text: "text-[11px]",
    lvl: "text-[10px]",
    name: "text-[11px]",
  },
  md: {
    wrap: "gap-2 px-2.5 py-1 text-xs",
    text: "text-xs",
    lvl: "text-[11px]",
    name: "text-xs",
  },
  lg: {
    wrap: "gap-2.5 px-3 py-1.5 text-sm",
    text: "text-sm",
    lvl: "text-xs",
    name: "text-sm",
  },
};

export default function LevelBadge({
  level,
  size = "sm",
  showName = true,
}: {
  level: number;
  size?: Size;
  showName?: boolean;
}) {
  const tier = tierFor(level);
  const s = SIZE[size];
  return (
    <span
      className={`inline-flex items-center rounded-full border ${tier.border} ${tier.chip} ${tier.glow} ${s.wrap} font-bold uppercase tracking-wide`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-full bg-black/40 px-1.5 ${s.lvl} font-black text-white shadow-inner`}
      >
        Lv {level.toLocaleString("id-ID")}
      </span>
      {showName ? (
        <span className={`${tier.text} ${s.name} font-bold`}>{tier.name}</span>
      ) : null}
    </span>
  );
}

/**
 * Render nama user dengan warna sesuai tier level.
 * Kalau `isAdmin=true`, override jadi merah (admin always merah, tier glow tetap).
 */
export function LevelName({
  name,
  level,
  isAdmin = false,
  className = "",
}: {
  name: string;
  level: number;
  isAdmin?: boolean;
  className?: string;
}) {
  const tier = tierFor(level);
  if (isAdmin) {
    return (
      <span
        className={`bg-gradient-to-r from-red-300 via-red-400 to-rose-500 bg-clip-text font-extrabold text-transparent animate-admin-glow ${className}`}
      >
        {name}
      </span>
    );
  }
  return <span className={`${tier.text} ${className}`}>{name}</span>;
}

/**
 * Badge "ADMIN" merah kecil — render di samping nama.
 */
export function AdminBadge({ size = "xs" }: { size?: "xs" | "sm" }) {
  const cls =
    size === "xs"
      ? "gap-0.5 px-1.5 py-0.5 text-[9px]"
      : "gap-1 px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center rounded-full border border-red-400/60 bg-gradient-to-r from-red-500/25 to-rose-500/25 font-black uppercase tracking-[0.2em] text-red-200 shadow-[0_0_12px_-4px_rgba(248,113,113,0.7)] ${cls}`}
    >
      <ShieldCheck className="h-2.5 w-2.5" />
      ADMIN
    </span>
  );
}
