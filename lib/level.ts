// Level + tier system for Anime Ian.
// Rules:
// - Setiap 15 menit (900 detik) nonton = +1 level
// - Level 1 dimulai di 0 detik, level max = 9999
// - Tiap tier punya nama + warna untuk nama user

export const SECONDS_PER_LEVEL = 15 * 60; // 900s = 15 menit
export const MAX_LEVEL = 9999;

export type Tier = {
  min: number; // minimum level inklusif
  max: number; // maximum level inklusif
  name: string;
  // Tailwind classes ready-to-use
  text: string; // warna text (solid atau gradient)
  chip: string; // background chip untuk badge
  border: string; // border badge
  glow: string; // bayangan lembut
};

// Tier ladder. Urut dari terendah ke tertinggi.
// Nama dibuat singkat (≤8 huruf) supaya badge tidak overflow di mobile,
// dan ber-vibe anime/manga supaya lebih iconic.
export const TIERS: Tier[] = [
  {
    min: 1,
    max: 4,
    name: "NOVICE",
    text: "text-ink-300",
    chip: "bg-ink-800/80",
    border: "border-ink-700",
    glow: "",
  },
  {
    min: 5,
    max: 19,
    name: "APPRENTICE",
    text: "text-emerald-300",
    chip: "bg-emerald-500/15",
    border: "border-emerald-400/50",
    glow: "shadow-[0_0_14px_-6px_rgba(52,211,153,0.6)]",
  },
  {
    min: 20,
    max: 49,
    name: "ADEPT",
    text: "text-teal-300",
    chip: "bg-teal-500/15",
    border: "border-teal-400/55",
    glow: "shadow-[0_0_14px_-6px_rgba(45,212,191,0.65)]",
  },
  {
    min: 50,
    max: 99,
    name: "EXPERT",
    text: "text-cyan-300",
    chip: "bg-cyan-500/15",
    border: "border-cyan-400/55",
    glow: "shadow-[0_0_16px_-6px_rgba(34,211,238,0.7)]",
  },
  {
    min: 100,
    max: 199,
    name: "MASTER",
    text: "text-sky-300",
    chip: "bg-sky-500/15",
    border: "border-sky-400/55",
    glow: "shadow-[0_0_18px_-6px_rgba(56,189,248,0.75)]",
  },
  {
    min: 200,
    max: 299,
    name: "GRANDMASTER",
    text: "text-blue-300",
    chip: "bg-blue-500/15",
    border: "border-blue-400/60",
    glow: "shadow-[0_0_18px_-6px_rgba(96,165,250,0.8)]",
  },
  {
    min: 300,
    max: 449,
    name: "LEGEND",
    text: "text-indigo-300",
    chip: "bg-indigo-500/15",
    border: "border-indigo-400/60",
    glow: "shadow-[0_0_20px_-6px_rgba(129,140,248,0.8)]",
  },
  {
    min: 450,
    max: 599,
    name: "MYTHIC",
    text: "bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent",
    chip: "bg-violet-500/15",
    border: "border-violet-400/60",
    glow: "shadow-[0_0_22px_-6px_rgba(167,139,250,0.85)]",
  },
  {
    min: 600,
    max: 749,
    name: "IMMORTAL",
    text: "bg-gradient-to-r from-fuchsia-300 to-pink-300 bg-clip-text text-transparent",
    chip: "bg-fuchsia-500/15",
    border: "border-fuchsia-400/60",
    glow: "shadow-[0_0_22px_-6px_rgba(232,121,249,0.85)]",
  },
  {
    min: 750,
    max: 899,
    name: "ETERNAL",
    text: "bg-gradient-to-r from-rose-300 via-amber-200 to-yellow-200 bg-clip-text text-transparent",
    chip: "bg-rose-500/15",
    border: "border-rose-300/65",
    glow: "shadow-[0_0_24px_-6px_rgba(251,113,133,0.9)]",
  },
  {
    min: 900,
    max: 1000,
    name: "TRANSCENDENT",
    text: "bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent",
    chip: "bg-gradient-to-r from-amber-400/15 via-orange-500/15 to-rose-500/15",
    border: "border-amber-300/70",
    glow: "shadow-[0_0_26px_-6px_rgba(252,211,77,0.95)]",
  },
  {
    min: 1001,
    max: 1999,
    name: "SAIYAN",
    text: "bg-gradient-to-r from-pink-300 via-rose-300 to-amber-300 bg-clip-text text-transparent",
    chip: "bg-pink-500/15",
    border: "border-pink-400/60",
    glow: "shadow-[0_0_24px_-6px_rgba(244,114,182,0.85)]",
  },
  {
    min: 2000,
    max: 3999,
    name: "ISEKAI",
    text: "bg-gradient-to-r from-rose-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent",
    chip: "bg-rose-500/15",
    border: "border-rose-400/60",
    glow: "shadow-[0_0_26px_-6px_rgba(251,113,133,0.9)]",
  },
  {
    min: 4000,
    max: 6999,
    name: "DEMI-GOD",
    text: "bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-300 bg-clip-text text-transparent",
    chip: "bg-amber-500/15",
    border: "border-amber-300/70",
    glow: "shadow-[0_0_28px_-6px_rgba(252,211,77,0.95)]",
  },
  {
    min: 7000,
    max: 9998,
    name: "DEMON LORD",
    text: "bg-gradient-to-r from-red-400 via-orange-400 to-amber-300 bg-clip-text text-transparent",
    chip: "bg-red-500/15",
    border: "border-red-400/70",
    glow: "shadow-[0_0_30px_-6px_rgba(248,113,113,1)]",
  },
  {
    min: 9999,
    max: 9999,
    name: "GOD",
    text: "bg-[linear-gradient(90deg,#fbbf24,#f472b6,#a78bfa,#60a5fa,#fbbf24)] bg-[length:200%_100%] bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(244,114,182,0.45)] animate-omniscient",
    chip: "bg-gradient-to-r from-amber-400/20 via-fuchsia-500/20 to-indigo-500/20",
    border: "border-fuchsia-300/80",
    glow: "shadow-[0_0_30px_-6px_rgba(236,72,153,0.95)]",
  },
];

export function computeLevel(totalSeconds: number): number {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return 1;
  const lvl = Math.floor(totalSeconds / SECONDS_PER_LEVEL) + 1;
  return Math.max(1, Math.min(MAX_LEVEL, lvl));
}

export function tierFor(level: number): Tier {
  const lvl = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  for (const t of TIERS) {
    if (lvl >= t.min && lvl <= t.max) return t;
  }
  return TIERS[0];
}

export function secondsForLevel(level: number): number {
  return Math.max(0, (level - 1) * SECONDS_PER_LEVEL);
}

export function levelProgress(totalSeconds: number) {
  const level = computeLevel(totalSeconds);
  const tier = tierFor(level);
  const currentFloor = secondsForLevel(level);
  const nextFloor = level >= MAX_LEVEL ? currentFloor : secondsForLevel(level + 1);
  const within = Math.max(0, totalSeconds - currentFloor);
  const span = Math.max(1, nextFloor - currentFloor);
  const pct = level >= MAX_LEVEL ? 100 : Math.min(100, Math.round((within / span) * 100));
  return { level, tier, withinSec: within, spanSec: span, pct };
}

export function formatWatchTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} jam ${m} menit`;
  return `${m} menit`;
}
