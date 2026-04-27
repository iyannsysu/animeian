import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Heart,
  MessageSquare,
  Sparkles,
  Eye,
  PlayCircle,
  Mail,
  UserPlus,
  Users,
  Activity,
} from "lucide-react";
import { kv } from "@/lib/kv";
import { getSessionUser } from "@/lib/session";
import type { HistoryEntry } from "@/lib/history";
import ProfileActions from "@/components/ProfileActions";
import LevelBadge, {
  LevelName,
  AdminBadge,
  VerifiedBadge,
} from "@/components/LevelBadge";
import ProfileEditor from "@/components/ProfileEditor";
import ActiveStatus from "@/components/ActiveStatus";
import ProfileHistoryList from "@/components/ProfileHistoryList";
import AdminSelfVerifyButton from "@/components/AdminSelfVerifyButton";
import {
  getFollowStats,
  getHistoryStats,
  getStoredUser,
  getWatchSeconds,
  resolveDisplayUser,
  touchUser,
} from "@/lib/user";
import { formatWatchTime, levelProgress, tierFor } from "@/lib/level";
import { ShieldCheck, Trophy } from "lucide-react";
import { isAdminEmailAsync } from "@/lib/admin";

export const dynamic = "force-dynamic";

type UserCommentRef = {
  series: string;
  id: string;
  body: string;
  createdAt: number;
};

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/profile");

  let history: HistoryEntry[] = [];
  let comments: UserCommentRef[] = [];
  if (kv.available) {
    const [hmap, crefs] = await Promise.all([
      kv.hgetall<Record<string, HistoryEntry>>(`history:${user.id}`),
      kv.lrange<UserCommentRef>(`user:${user.id}:comments`, 0, 50),
    ]);
    history = Object.values(hmap)
      .filter((e): e is HistoryEntry => !!e?.updatedAt)
      .sort((a, b) => b.updatedAt - a.updatedAt);

    // Self-heal: drop refs ke komentar yang sudah dihapus dari series-nya.
    // (Bug lama: DELETE comment tidak bersihkan per-user list.)
    const refs = crefs ?? [];
    const bySeries = new Map<string, UserCommentRef[]>();
    for (const r of refs) {
      const arr = bySeries.get(r.series) ?? [];
      arr.push(r);
      bySeries.set(r.series, arr);
    }
    const seriesAlive = new Map<string, Set<string>>();
    await Promise.all(
      Array.from(bySeries.keys()).map(async (s) => {
        const raws = await kv.lrangeRaw(`comments:${s}`, 0, 1000);
        const ids = new Set<string>();
        for (const raw of raws) {
          try {
            const c = JSON.parse(raw) as { id?: string };
            if (c?.id) ids.add(c.id);
          } catch {
            /* noop */
          }
        }
        seriesAlive.set(s, ids);
      })
    );
    const stale: UserCommentRef[] = [];
    comments = refs.filter((r) => {
      const alive = seriesAlive.get(r.series);
      if (alive && alive.has(r.id)) return true;
      stale.push(r);
      return false;
    });
    // Best-effort: bersihkan stale dari list user. Tidak ditunggu.
    if (stale.length) {
      void (async () => {
        const userKey = `user:${user.id}:comments`;
        const userRaws = await kv.lrangeRaw(userKey, 0, 1000);
        const staleIds = new Set(stale.map((s) => s.id));
        for (const ur of userRaws) {
          try {
            const ref = JSON.parse(ur) as { id?: string };
            if (ref?.id && staleIds.has(ref.id)) {
              await kv.lrem(userKey, 1, ur);
            }
          } catch {
            /* noop */
          }
        }
      })().catch(() => {});
    }
  }

  const totalWatch = history.reduce((s, e) => s + (e.progress || 0), 0);
  const uniqueSeries = new Set(history.map((e) => e.series)).size;

  // Pastikan user record ada (biar bisa dikunjungi orang lain via /u/[id])
  await touchUser({
    id: user.id,
    name: user.name,
    image: user.image,
    email: user.email,
  });
  const [watchSeconds, stored, follow, histStats] = await Promise.all([
    getWatchSeconds(user.id),
    getStoredUser(user.id),
    getFollowStats(user.id, user.id),
    getHistoryStats(user.id),
  ]);
  const display = stored
    ? resolveDisplayUser(stored)
    : { name: user.name, image: user.image };
  const prog = levelProgress(watchSeconds);
  const tier = tierFor(prog.level);
  const isAdmin = await isAdminEmailAsync(user.email);
  const likesReceived = stored?.likesReceived ?? 0;

  return (
    <div className="container-page space-y-8">
      {/* ===== Hero header ===== */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-ink-900/70">
        {/* Banner cover atas */}
        <div className="relative h-32 w-full overflow-hidden sm:h-44">
          {stored?.bannerImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stored.bannerImage}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-b from-transparent to-ink-950/60"
              />
            </>
          ) : display.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={display.image}
                alt=""
                aria-hidden
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
              />
            </>
          ) : null}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-indigo-500/35 via-fuchsia-500/25 to-transparent"
          />
          <div
            aria-hidden
            className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-fuchsia-500/25 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent"
          />
        </div>

        {/* Konten utama */}
        <div className="relative -mt-16 px-5 pb-6 sm:-mt-20 sm:px-8 sm:pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            {/* Avatar besar */}
            <div className="relative mx-auto sm:mx-0">
              <div
                aria-hidden
                className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-brand-500 opacity-80 blur-md"
              />
              <div className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-full border-[3px] border-ink-950 bg-ink-800 text-3xl font-black text-white shadow-xl sm:h-36 sm:w-36">
                {display.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={display.image}
                    alt={display.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{display.name.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              {/* Centang biru besar di pojok avatar (ala IG/Twitter) */}
              {stored?.verified ? (
                <span
                  className="absolute -bottom-1 -right-1 grid place-items-center rounded-full bg-ink-950 p-1 ring-[3px] ring-ink-950"
                  aria-label="Akun terverifikasi"
                  title="Akun terverifikasi"
                >
                  <VerifiedBadge size="lg" />
                </span>
              ) : null}
            </div>

            {/* Info utama */}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-2xl font-black tracking-tight sm:justify-start sm:text-4xl">
                <span className="truncate">
                  <LevelName
                    name={display.name}
                    level={prog.level}
                    isAdmin={isAdmin}
                  />
                </span>
                {stored?.verified ? <VerifiedBadge size="md" /> : null}
                {isAdmin ? <AdminBadge size="sm" /> : null}
              </h1>

              {/* Pill "VERIFIED" yang jelas di bawah nama */}
              {stored?.verified ? (
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/50 bg-sky-500/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-sky-200 shadow-[0_0_18px_-6px_rgba(56,189,248,0.85)]">
                    <VerifiedBadge size="sm" />
                    Verified
                  </span>
                </div>
              ) : null}

              {/* Baris meta — email + status aktif */}
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] text-ink-300 sm:justify-start sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-ink-400" />
                  <span className="truncate">{user.email}</span>
                </span>
                <ActiveStatus lastActiveAt={stored?.lastActiveAt ?? Date.now()} />
              </div>

              {/* Badge level + tier */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <LevelBadge level={prog.level} size="md" />
                <span className="rounded-full border border-white/10 bg-ink-900/60 px-2.5 py-1 text-[11px] font-semibold text-ink-300">
                  <Clock className="-mt-0.5 mr-1 inline h-3 w-3 text-indigo-300" />
                  {formatWatchTime(watchSeconds)}
                </span>
              </div>

              {/* Bio (kalau diset) */}
              {stored?.bio ? (
                <p className="mx-auto mt-3 max-w-md whitespace-pre-wrap text-[13px] leading-relaxed text-ink-200 sm:mx-0 sm:max-w-none">
                  {stored.bio}
                </p>
              ) : null}
            </div>

            {/* Tombol aksi */}
            <div className="flex shrink-0 justify-center sm:justify-end">
              <ProfileActions />
            </div>
          </div>

          {/* Progress bar level */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-ink-950/60 p-3 sm:p-4">
            <div className="flex items-baseline justify-between text-[11px] text-ink-300">
              <span className="font-bold uppercase tracking-wider">
                {tier.name}
              </span>
              <span className="tabular-nums text-ink-400">
                {Math.floor(prog.withinSec / 60)}/
                {Math.floor(prog.spanSec / 60)} menit → Lv {prog.level + 1}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-900 ring-1 ring-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-pink-400"
                style={{ width: `${prog.pct}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Link
                href={`/u/${encodeURIComponent(user.id)}`}
                className="inline-flex items-center gap-1 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-200 hover:border-indigo-400/70 hover:bg-indigo-500/20"
              >
                <Trophy className="h-3 w-3" /> Profil Publik
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-200 hover:border-amber-400/70 hover:bg-amber-500/20"
              >
                <Trophy className="h-3 w-3" /> Leaderboard
              </Link>
              {isAdmin ? (
                <>
                  <Link
                    href="/admin/level"
                    className="inline-flex items-center gap-1 rounded-full border border-red-400/50 bg-red-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-200 hover:border-red-400/80 hover:bg-red-500/25"
                  >
                    <ShieldCheck className="h-3 w-3" /> Admin Panel
                  </Link>
                  <AdminSelfVerifyButton
                    userId={user.id}
                    initialVerified={!!stored?.verified}
                  />
                </>
              ) : null}
            </div>
          </div>

          {/* Stat cards */}
          <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Followers"
              value={follow.followers}
              accent="indigo"
            />
            <StatCard
              icon={<UserPlus className="h-4 w-4" />}
              label="Following"
              value={follow.following}
              accent="fuchsia"
            />
            <StatCard
              icon={<Heart className="h-4 w-4" />}
              label="Total Like"
              value={likesReceived}
              accent="rose"
            />
            <StatCard
              icon={<PlayCircle className="h-4 w-4" />}
              label="Episode"
              value={histStats.totalEpisodes}
              accent="emerald"
            />
            <StatCard
              icon={<Eye className="h-4 w-4" />}
              label="Seri"
              value={histStats.totalSeries}
              accent="amber"
            />
            <StatCard
              icon={<MessageSquare className="h-4 w-4" />}
              label="Komentar"
              value={comments.length}
              accent="brand"
            />
          </div>

          {totalWatch > 0 ? (
            <p className="mt-4 text-center text-[11px] text-ink-400 sm:text-left">
              <Activity className="-mt-0.5 mr-1 inline h-3 w-3 text-indigo-300" />
              Total tontonan dari progress:{" "}
              <span className="font-bold text-indigo-300">
                {fmtDuration(totalWatch)}
              </span>
            </p>
          ) : null}
        </div>
      </header>

      {/* Edit nama + foto profil */}
      <ProfileEditor
        initialName={display.name}
        initialImage={display.image}
        googleName={user.name}
        googleImage={user.image}
        hasNameOverride={!!stored?.nameOverride}
        hasImageOverride={!!stored?.imageOverride}
        initialBio={stored?.bio ?? null}
        initialBanner={stored?.bannerImage ?? null}
      />

      {/* History */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-2xl">
              Riwayat Tontonan
            </h2>
            <p className="mt-0.5 text-xs text-ink-400">
              Tersinkron di semua perangkat yang login dengan akun ini
            </p>
          </div>
          <Sparkles className="h-4 w-4 text-indigo-400" />
        </div>
        <ProfileHistoryList initial={history} />
      </section>

      {/* Comments */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="bg-gradient-to-r from-white to-fuchsia-200 bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-2xl">
              Komentar Saya
            </h2>
            <p className="mt-0.5 text-xs text-ink-400">
              Diskusi yang kamu ikuti di tiap anime
            </p>
          </div>
          <MessageSquare className="h-4 w-4 text-fuchsia-400" />
        </div>
        {!comments.length ? (
          <EmptyState
            icon={<MessageSquare className="h-6 w-6" />}
            text="Belum ada komentar. Yuk mulai bahas anime favoritmu!"
          />
        ) : (
          <ul className="space-y-2.5">
            {comments.map((c) => (
              <li
                key={c.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-ink-900/70 to-ink-900/40 p-4 transition hover:border-fuchsia-400/50"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -left-0.5 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-indigo-400 via-fuchsia-400 to-brand-400"
                />
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <Link
                    href={`/anime/${encodeURIComponent(c.series)}`}
                    className="inline-flex items-center gap-1 truncate font-bold text-indigo-300 hover:text-indigo-200"
                  >
                    <Eye className="h-3 w-3" />
                    {decodeURIComponent(c.series)}
                  </Link>
                  <span className="shrink-0 text-ink-500">
                    {relTime(c.createdAt)}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-200">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
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
  value: number;
  accent: "indigo" | "fuchsia" | "brand" | "rose" | "emerald" | "amber";
}) {
  const palette: Record<string, { border: string; glow: string; text: string }> = {
    indigo: {
      border: "border-indigo-400/30",
      glow: "from-indigo-500/20",
      text: "text-indigo-300",
    },
    fuchsia: {
      border: "border-fuchsia-400/30",
      glow: "from-fuchsia-500/20",
      text: "text-fuchsia-300",
    },
    brand: {
      border: "border-brand-400/30",
      glow: "from-brand-500/20",
      text: "text-brand-300",
    },
    rose: {
      border: "border-rose-400/30",
      glow: "from-rose-500/20",
      text: "text-rose-300",
    },
    emerald: {
      border: "border-emerald-400/30",
      glow: "from-emerald-500/20",
      text: "text-emerald-300",
    },
    amber: {
      border: "border-amber-400/30",
      glow: "from-amber-500/20",
      text: "text-amber-300",
    },
  };
  const p = palette[accent];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${p.border} bg-ink-950/70 p-3 sm:p-4`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${p.glow} to-transparent opacity-60`}
      />
      <div className="relative">
        <div className={`inline-flex items-center gap-1.5 ${p.text}`}>
          {icon}
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
            {label}
          </span>
        </div>
        <div className="mt-1 text-2xl font-black text-white sm:text-3xl">
          {value}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-white/10 bg-ink-950/40 p-10 text-center text-sm text-ink-400">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-ink-900/60 text-ink-500">
        {icon}
      </div>
      {text}
    </div>
  );
}

function fmt(s: number) {
  if (!s || !Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${ss}`;
}

function fmtDuration(s: number) {
  if (!s || !Number.isFinite(s)) return "0 menit";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} jam ${m} menit`;
  return `${m} menit`;
}

function relTime(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}d lalu`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} hari lalu`;
  return new Date(ts).toLocaleDateString("id-ID");
}
