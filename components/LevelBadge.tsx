import { ShieldCheck, Star } from "lucide-react";
import { tierFor } from "@/lib/level";

type Size = "xs" | "sm" | "md" | "lg";

const SIZE: Record<
  Size,
  {
    wrap: string;
    lvlBox: string;
    lvlNum: string;
    lvlLabel: string;
    name: string;
    icon: string;
  }
> = {
  xs: {
    wrap: "h-[18px] pr-1.5",
    lvlBox: "h-[18px] min-w-[34px] px-1",
    lvlNum: "text-[9px] leading-none",
    lvlLabel: "text-[7px] leading-[1] tracking-[0.18em]",
    name: "text-[10px] leading-none",
    icon: "h-2 w-2",
  },
  sm: {
    wrap: "h-5 pr-2",
    lvlBox: "h-5 min-w-[40px] px-1.5",
    lvlNum: "text-[10px] leading-none",
    lvlLabel: "text-[8px] leading-[1] tracking-[0.18em]",
    name: "text-[11px] leading-none",
    icon: "h-2.5 w-2.5",
  },
  md: {
    wrap: "h-6 pr-2.5",
    lvlBox: "h-6 min-w-[48px] px-2",
    lvlNum: "text-[12px] leading-none",
    lvlLabel: "text-[9px] leading-[1] tracking-[0.2em]",
    name: "text-[12px] leading-none",
    icon: "h-3 w-3",
  },
  lg: {
    wrap: "h-7 pr-3",
    lvlBox: "h-7 min-w-[58px] px-2.5",
    lvlNum: "text-[14px] leading-none",
    lvlLabel: "text-[10px] leading-[1] tracking-[0.2em]",
    name: "text-[13px] leading-none",
    icon: "h-3.5 w-3.5",
  },
};

/**
 * Badge level: pill bersusun "Lv (kecil) / 123 (besar)" di kiri,
 * lalu nama tier di kanan dengan ikon bintang. Lebih premium daripada
 * sekedar text "Lv 1 NPC".
 */
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
  const lvlText = level.toLocaleString("id-ID");

  return (
    <span
      className={`inline-flex items-stretch overflow-hidden rounded-full border ${tier.border} ${tier.chip} ${tier.glow} ${s.wrap} font-black uppercase tracking-wide align-middle`}
    >
      <span
        className={`inline-flex flex-col items-center justify-center gap-0 rounded-l-full bg-black/55 ring-1 ring-inset ring-white/10 ${s.lvlBox}`}
      >
        <span className={`${s.lvlLabel} font-black text-white/55`}>LV</span>
        <span className={`${s.lvlNum} font-black text-white`}>{lvlText}</span>
      </span>
      {showName ? (
        <span
          className={`inline-flex items-center gap-1 pl-1.5 ${tier.text} ${s.name} font-black`}
        >
          <Star className={`${s.icon} fill-current opacity-80`} />
          <span className="whitespace-nowrap">{tier.name}</span>
        </span>
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
