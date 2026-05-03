import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  BookOpen,
  Clock,
  Flame,
  Heart,
  MessageSquare,
  PlayCircle,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { getSessionUser } from "@/lib/session";
import {
  getFollowStats,
  getHistoryStats,
  getStoredUser,
  getWatchSeconds,
} from "@/lib/user";
import { computeLevel, formatWatchTime, levelProgress, tierFor } from "@/lib/level";
import { getUserlistCounts, listUserlist, USERLIST_LABEL, USERLIST_THEME } from "@/lib/userlist";
import { kv } from "@/lib/kv";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/stats");

  const [stored, watchSeconds, follow, listCounts, list, hStats, commentCount] = await Promise.all([
    getStoredUser(user.id),
    getWatchSeconds(user.id),
    getFollowStats(user.id),
    getUserlistCounts(user.id),
    listUserlist(user.id),
    getHistoryStats(user.id),
    kv.llen(`user:${user.id}:comments`),
  ]);
  const level = computeLevel(watchSeconds);
  const prog = levelProgress(watchSeconds);
  const tier = tierFor(level);

  // Hitung jam per status
  const ratings = list.filter((e) => typeof e.rating === "number" && (e.rating ?? 0) > 0);
  const avgRating = ratings.length ? ratings.reduce((s, e) => s + (e.rating ?? 0), 0) / ratings.length : 0;

  return (
    <div className="container-page space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent">
              Statistik
            </span>
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            Ringkasan aktivitas {stored?.name ?? user.name} di Anime Ian.
          </p>
        </div>
        <Link
          href="/profile"
          className="rounded-full border border-white/10 bg-ink-900/60 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ink-200 hover:border-indigo-400/60 hover:text-indigo-200"
        >
          ← Profile
        </Link>
      </header>

      {/* Level + tier */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/5 to-ink-900/60 p-5">
        <div className="flex items-center justify-between gap-3 text-[11px] text-ink-300">
          <span className="font-bold uppercase tracking-wider">Level {level}</span>
          <span>
            {Math.floor(prog.withinSec / 60)}/{Math.floor(prog.spanSec / 60)} menit ke Lv {level + 1}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-900/80 ring-1 ring-white/10">
          <div
            className={`h-full ${tier.chip}`}
            style={{ width: `${prog.pct}%` }}
          />
        </div>
        <p className="mt-2 text-[12px] text-ink-400">
          Tier:{" "}
          <span className={`font-bold ${tier.chipText ?? tier.text}`}>{tier.name}</span>{" "}
          · Total nonton{" "}
          <span className="font-bold text-ink-200">{formatWatchTime(watchSeconds)}</span>
        </p>
      </section>

      {/* Stat grid utama */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Clock className="h-4 w-4" />} label="Total nonton" value={formatWatchTime(watchSeconds)} accent="from-emerald-500/20 border-emerald-400/30" />
        <Stat icon={<PlayCircle className="h-4 w-4" />} label="Episode ditonton" value={`${hStats.totalEpisodes}`} accent="from-cyan-500/20 border-cyan-400/30" />
        <Stat icon={<BookOpen className="h-4 w-4" />} label="Seri ditonton" value={`${hStats.totalSeries}`} accent="from-sky-500/20 border-sky-400/30" />
        <Stat icon={<MessageSquare className="h-4 w-4" />} label="Komentar" value={`${commentCount}`} accent="from-indigo-500/20 border-indigo-400/30" />
        <Stat icon={<Heart className="h-4 w-4" />} label="Total like" value={`${stored?.likesReceived ?? 0}`} accent="from-rose-500/20 border-rose-400/30" />
        <Stat icon={<Users className="h-4 w-4" />} label="Followers" value={`${follow.followers}`} accent="from-fuchsia-500/20 border-fuchsia-400/30" />
        <Stat icon={<Trophy className="h-4 w-4" />} label="Level" value={`${level}`} accent="from-amber-500/20 border-amber-400/30" />
        <Stat icon={<Star className="h-4 w-4" />} label="Rata-rata rating" value={avgRating ? avgRating.toFixed(1) : "—"} accent="from-violet-500/20 border-violet-400/30" />
      </section>

      {/* Daftar koleksi anime per status */}
      <section className="rounded-3xl border border-white/10 bg-ink-900/40 p-5">
        <header className="flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-lg font-black tracking-tight">
            <Flame className="h-5 w-5 text-amber-300" /> Koleksi Anime
          </h2>
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
            {listCounts.total} total
          </span>
        </header>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(Object.keys(USERLIST_LABEL) as Array<keyof typeof USERLIST_LABEL>).map((s) => {
            const t = USERLIST_THEME[s];
            return (
              <div
                key={s}
                className={`rounded-2xl border p-3 ${t.chip} ${t.border}`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${t.text}`}>
                  {USERLIST_LABEL[s]}
                </p>
                <p className="mt-1 text-2xl font-black text-white">
                  {listCounts[s] ?? 0}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Riwayat aktif */}
      <section className="rounded-3xl border border-white/10 bg-ink-900/40 p-5">
        <h2 className="inline-flex items-center gap-2 text-lg font-black tracking-tight">
          <Activity className="h-5 w-5 text-indigo-300" /> Aktivitas
        </h2>
        <p className="mt-2 text-xs text-ink-400">
          Total {hStats.totalEpisodes} episode di {hStats.totalSeries} seri.
          {avgRating ? ` Rata-rata rating ${avgRating.toFixed(1)}/10 dari ${ratings.length} anime.` : ""}
        </p>
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${accent} to-ink-900/40 p-4`}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-200">
        {icon} {label}
      </div>
      <p className="mt-1 text-2xl font-black tracking-tight text-white">{value}</p>
    </div>
  );
}
