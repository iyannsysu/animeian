import { ShieldCheck, Star, BadgeCheck } from "lucide-react";
import { tierFor } from "@/lib/level";

type Size = "xs" | "sm" | "md" | "lg";

const SIZE: Record<
  Size,
  {
    wrap: string;
    lvlBox: string;
    lvlText: string;
    name: string;
    icon: string;
    gap: string;
    rightPad: string;
  }
> = {
  xs: {
    wrap: "text-[10px]",
    lvlBox: "px-1 py-[1px] text-[9px]",
    lvlText: "text-[9px]",
    name: "text-[10px]",
    icon: "h-2.5 w-2.5",
    gap: "gap-1",
    rightPad: "pr-1.5",
  },
  sm: {
    wrap: "text-[11px]",
    lvlBox: "px-1.5 py-[1px] text-[10px]",
    lvlText: "text-[10px]",
    name: "text-[11px]",
    icon: "h-3 w-3",
    gap: "gap-1",
    rightPad: "pr-2",
  },
  md: {
    wrap: "text-xs",
    lvlBox: "px-2 py-0.5 text-[11px]",
    lvlText: "text-[11px]",
    name: "text-xs",
    icon: "h-3 w-3",
    gap: "gap-1.5",
    rightPad: "pr-2.5",
  },
  lg: {
    wrap: "text-sm",
    lvlBox: "px-2.5 py-1 text-[12px]",
    lvlText: "text-[12px]",
    name: "text-sm",
    icon: "h-3.5 w-3.5",
    gap: "gap-1.5",
    rightPad: "pr-3",
  },
};

/**
 * Pill level: kotak hitam "LV 12" di kiri, lalu ⭐ + nama tier di kanan.
 * Single-row, tidak ada stacked text supaya selalu render mulus di
 * flex-wrap baris komentar.
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
      className={`inline-flex items-center rounded-full border ${tier.border} ${tier.chip} ${tier.glow} ${s.wrap} ${s.gap} ${
        showName ? s.rightPad : "px-1"
      } font-black uppercase tracking-wide leading-none align-middle`}
    >
      <span
        className={`inline-flex items-center rounded-full bg-black/60 font-black text-white ring-1 ring-inset ring-white/10 ${s.lvlBox}`}
      >
        <span className="opacity-60">LV&nbsp;</span>
        {lvlText}
      </span>
      {showName ? (
        <span
          className={`inline-flex items-center gap-0.5 ${tier.text} ${s.name} font-black whitespace-nowrap`}
        >
          <Star className={`${s.icon} fill-current opacity-90`} />
          <span>{tier.name}</span>
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

/**
 * Centang biru "verified" — diberikan oleh admin lewat panel.
 */
export function VerifiedBadge({
  size = "xs",
  withLabel = false,
}: {
  size?: "xs" | "sm" | "md";
  withLabel?: boolean;
}) {
  const cfg = {
    xs: { box: "h-3.5 w-3.5", icon: "h-3 w-3", text: "text-[9px]" },
    sm: { box: "h-4 w-4", icon: "h-3.5 w-3.5", text: "text-[10px]" },
    md: { box: "h-5 w-5", icon: "h-4 w-4", text: "text-[11px]" },
  }[size];
  const icon = (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-[0_0_8px_-2px_rgba(56,189,248,0.7)] ${cfg.box}`}
      aria-label="Akun terverifikasi"
      title="Akun terverifikasi"
    >
      <BadgeCheck className={`${cfg.icon} fill-blue-500`} strokeWidth={2.5} />
    </span>
  );
  if (!withLabel) return icon;
  return (
    <span className="inline-flex items-center gap-1">
      {icon}
      <span className={`font-black uppercase tracking-wide text-sky-300 ${cfg.text}`}>
        Verified
      </span>
    </span>
  );
}
