import Link from "next/link";
import { Crown, Sparkles, Trophy } from "lucide-react";
import {
  getWatchSeconds,
  listAllUsers,
} from "@/lib/user";
import { computeLevel, formatWatchTime, tierFor } from "@/lib/level";
import { getAdminUserIds } from "@/lib/admin";
import LevelBadge, { LevelName, AdminBadge } from "@/components/LevelBadge";

export const revalidate = 300;

export const metadata = {
  title: "Leaderboard — Anime Ian",
  description: "Ranking user dengan level tertinggi di Anime Ian.",
};

export default async function LeaderboardPage() {
  const [users, adminIds] = await Promise.all([
    listAllUsers(),
    getAdminUserIds(),
  ]);
  const ranked = await Promise.all(
    users.map(async (u) => {
      const sec = await getWatchSeconds(u.id);
      return {
        ...u,
        watchSeconds: sec,
        level: computeLevel(sec),
        isAdmin: adminIds.has(u.id),
      };
    })
  );
  ranked.sort(
    (a, b) => b.level - a.level || b.watchSeconds - a.watchSeconds
  );

  return (
    <div className="container-page space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/15 via-fuchsia-500/10 to-ink-900/50 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-amber-200">
            <Trophy className="h-3 w-3" /> Hall of Fame
          </div>
          <h1 className="mt-3 bg-gradient-to-r from-white via-amber-200 to-fuchsia-200 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-5xl">
            Leaderboard
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-300">
            Ranking user dengan level tertinggi. Tonton lebih lama untuk naik
            posisi.
          </p>
          <p className="mt-2 inline-flex items-center gap-2 text-[11px] text-ink-400">
            <Sparkles className="h-3 w-3 text-amber-300" />
            {ranked.length} user terdaftar
          </p>
        </div>
      </section>

      {!ranked.length ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-ink-900/40 p-8 text-center text-sm text-ink-400">
          Belum ada user yang terdaftar. Login untuk muncul di leaderboard.
        </div>
      ) : (
        <ol className="space-y-2">
          {ranked.map((u, idx) => {
            const tier = tierFor(u.level);
            const rank = idx + 1;
            const medal =
              rank === 1
                ? "from-amber-300 to-yellow-500 text-amber-950"
                : rank === 2
                ? "from-zinc-200 to-zinc-400 text-zinc-900"
                : rank === 3
                ? "from-amber-700 to-orange-800 text-amber-100"
                : "from-ink-800 to-ink-900 text-ink-300";
            return (
              <li
                key={u.id}
                className={`flex items-center gap-3 rounded-2xl border ${tier.border} bg-ink-900/60 p-3 ${
                  rank <= 3 ? tier.glow : ""
                }`}
              >
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${medal} text-sm font-black shadow-md`}
                >
                  {rank <= 3 ? <Crown className="h-4 w-4" /> : rank}
                </div>
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 bg-ink-800">
                  {u.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.image}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-base font-black text-ink-300">
                      {u.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/u/${encodeURIComponent(u.id)}`}
                      className="truncate text-sm font-bold hover:underline sm:text-base"
                    >
                      <LevelName
                        name={u.name}
                        level={u.level}
                        isAdmin={u.isAdmin}
                      />
                    </Link>
                    {u.isAdmin ? <AdminBadge size="xs" /> : null}
                  </div>
                  <p className="text-[11px] text-ink-400">
                    {u.isAdmin ? "Admin · " : ""}{tier.name} ·{" "}
                    {formatWatchTime(u.watchSeconds)} ditonton
                  </p>
                </div>
                <LevelBadge level={u.level} size="sm" showName={false} />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
