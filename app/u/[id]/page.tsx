import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublicProfile,
  listUserComments,
} from "@/lib/user";
import { tierFor, formatWatchTime } from "@/lib/level";
import { getAdminUserIds } from "@/lib/admin";
import { getSessionUser } from "@/lib/session";
import LevelBadge, { LevelName, AdminBadge } from "@/components/LevelBadge";
import ActiveStatus from "@/components/ActiveStatus";
import FollowButton from "@/components/FollowButton";
import {
  CalendarDays,
  Clock,
  Heart,
  MessageSquare,
  PlayCircle,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props) {
  const id = decodeURIComponent(params.id);
  const profile = await getPublicProfile(id);
  if (!profile) return { title: "Profil Pengguna" };
  return {
    title: `${profile.name} (Lv ${profile.level} ${profile.tierName}) — Anime Ian`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const id = decodeURIComponent(params.id);
  const me = await getSessionUser();
  const profile = await getPublicProfile(id, me?.id);
  if (!profile) notFound();
  const tier = tierFor(profile.level);
  const [comments, adminIds] = await Promise.all([
    listUserComments(id, 30),
    getAdminUserIds(),
  ]);
  const isAdmin = adminIds.has(id);
  const isMe = me?.id === id;

  return (
    <div className="container-page space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-ink-900/50 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />

        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div
            className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 ${tier.border} ${tier.glow} bg-ink-800 sm:h-32 sm:w-32`}
          >
            {profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.image}
                alt={profile.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-black text-ink-300">
                {profile.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                <LevelName
                  name={profile.name}
                  level={profile.level}
                  isAdmin={isAdmin}
                />
              </h1>
              {isAdmin ? <AdminBadge size="sm" /> : null}
              <LevelBadge level={profile.level} size="md" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-300">
              {isAdmin ? (
                <span className="font-bold text-red-300">Admin · </span>
              ) : null}
              <span>
                {tier.name} · Lv {profile.level.toLocaleString("id-ID")} ·{" "}
                {formatWatchTime(profile.watchSeconds)} ditonton
              </span>
              {profile.lastActiveAt ? (
                <ActiveStatus lastActiveAt={profile.lastActiveAt} />
              ) : null}
            </div>
            {!isMe ? (
              <div className="mt-3">
                <FollowButton
                  targetId={profile.id}
                  initialFollowing={profile.isFollowing}
                  initialFollowers={profile.followers}
                />
              </div>
            ) : null}

            <div className="mt-4 max-w-md">
              <div className="flex items-baseline justify-between text-[11px] text-ink-400">
                <span>Progress ke Lv {profile.level + 1}</span>
                <span>
                  {Math.floor(profile.progress.withinSec / 60)}/
                  {Math.floor(profile.progress.spanSec / 60)} menit
                </span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-ink-900/80 ring-1 ring-white/10">
                <div
                  className="h-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-pink-400"
                  style={{ width: `${profile.progress.pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Followers"
          value={`${profile.followers}`}
          accent="from-indigo-500/20 via-indigo-500/5 border-indigo-400/30"
        />
        <StatCard
          icon={<UserPlus className="h-4 w-4" />}
          label="Following"
          value={`${profile.following}`}
          accent="from-fuchsia-500/20 via-fuchsia-500/5 border-fuchsia-400/30"
        />
        <StatCard
          icon={<Heart className="h-4 w-4" />}
          label="Total Like"
          value={`${profile.likesReceived}`}
          accent="from-rose-500/20 via-rose-500/5 border-rose-400/30"
        />
        <StatCard
          icon={<PlayCircle className="h-4 w-4" />}
          label="Episode"
          value={`${profile.totalEpisodes}`}
          accent="from-emerald-500/20 via-emerald-500/5 border-emerald-400/30"
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Total Nonton"
          value={formatWatchTime(profile.watchSeconds)}
          accent="from-amber-500/20 via-amber-500/5 border-amber-400/30"
        />
        <StatCard
          icon={<MessageSquare className="h-4 w-4" />}
          label="Komentar"
          value={`${profile.commentCount}`}
          accent="from-brand-500/20 via-brand-500/5 border-brand-400/30"
        />
      </section>

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight sm:text-lg">
            Komentar Terbaru
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] text-ink-400">
            <Sparkles className="h-3 w-3 text-indigo-300" />
            {comments.length} terbaru
          </span>
        </header>
        {!comments.length ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-ink-900/40 p-6 text-center text-sm text-ink-400">
            User ini belum menulis komentar.
          </div>
        ) : (
          <ul className="space-y-2">
            {comments.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-white/10 bg-ink-900/50 p-3"
              >
                <Link
                  href={`/anime/${encodeURIComponent(c.series)}`}
                  className="text-[11px] font-bold uppercase tracking-wide text-indigo-300 hover:text-indigo-200"
                >
                  → {c.series}
                </Link>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-200">
                  {c.body}
                </p>
                <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-ink-500">
                  <CalendarDays className="h-3 w-3" />
                  {new Date(c.createdAt).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="pt-2 text-center text-[11px] text-ink-500">
        Bergabung sejak{" "}
        {new Date(profile.joinedAt).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

function StatCard({
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
    <div
      className={`rounded-2xl border bg-gradient-to-br ${accent} to-ink-900/60 p-4`}
    >
      <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-300">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
        {value}
      </p>
    </div>
  );
}
