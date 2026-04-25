import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  MessageSquare,
  Sparkles,
  Eye,
  PlayCircle,
  Mail,
} from "lucide-react";
import { kv } from "@/lib/kv";
import { getSessionUser } from "@/lib/session";
import type { HistoryEntry } from "@/lib/history";
import ProfileActions from "@/components/ProfileActions";
import LevelBadge from "@/components/LevelBadge";
import { getWatchSeconds, touchUser } from "@/lib/user";
import { formatWatchTime, levelProgress, tierFor } from "@/lib/level";
import { Trophy } from "lucide-react";

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
    comments = crefs ?? [];
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
  const watchSeconds = await getWatchSeconds(user.id);
  const prog = levelProgress(watchSeconds);
  const tier = tierFor(prog.level);

  return (
    <div className="container-page space-y-10">
      {/* Hero header */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/15 to-ink-900/60 p-6 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(129,140,248,0.18),transparent_60%)]"
        />

        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-brand-500 opacity-70 blur-md" />
            <div className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border-2 border-white/20 bg-ink-800 text-3xl font-black text-white sm:h-28 sm:w-28">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{user.name.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-200">
                <Sparkles className="h-3 w-3" /> Profil Ian
              </span>
              <LevelBadge level={prog.level} size="sm" />
            </div>
            <h1
              className={`mt-2 truncate text-2xl font-black tracking-tight sm:text-4xl ${tier.text}`}
            >
              {user.name}
            </h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-ink-300 sm:text-sm">
              <Mail className="h-3.5 w-3.5 text-ink-400" /> {user.email}
            </p>
            <div className="mt-3 max-w-md">
              <div className="flex items-baseline justify-between text-[10px] text-ink-400">
                <span>
                  {tier.name} · {formatWatchTime(watchSeconds)} ditonton
                </span>
                <span>
                  {Math.floor(prog.withinSec / 60)}/
                  {Math.floor(prog.spanSec / 60)} menit → Lv {prog.level + 1}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-900/80 ring-1 ring-white/10">
                <div
                  className="h-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-pink-400"
                  style={{ width: `${prog.pct}%` }}
                />
              </div>
              <Link
                href={`/u/${encodeURIComponent(user.id)}`}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-indigo-300 hover:text-indigo-200"
              >
                <Trophy className="h-3 w-3" /> Lihat profil publik saya
              </Link>
            </div>
          </div>

          <div className="shrink-0">
            <ProfileActions />
          </div>
        </div>

        {/* Stat cards */}
        <div className="relative mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="History"
            value={history.length}
            accent="indigo"
          />
          <StatCard
            icon={<PlayCircle className="h-4 w-4" />}
            label="Seri"
            value={uniqueSeries}
            accent="fuchsia"
          />
          <StatCard
            icon={<MessageSquare className="h-4 w-4" />}
            label="Komentar"
            value={comments.length}
            accent="brand"
          />
        </div>

        {totalWatch > 0 ? (
          <p className="relative mt-4 text-center text-[11px] text-ink-400 sm:text-left">
            Total tontonan:{" "}
            <span className="font-bold text-indigo-300">
              {fmtDuration(totalWatch)}
            </span>
          </p>
        ) : null}
      </header>

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
        {!history.length ? (
          <EmptyState
            icon={<Clock className="h-6 w-6" />}
            text="Belum ada anime yang ditonton. Mulai pilih dari Home!"
          />
        ) : (
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {history.map((e) => {
              const pct = e.duration
                ? Math.min(100, Math.max(0, (e.progress / e.duration) * 100))
                : 0;
              const href = `/watch/${encodeURIComponent(
                e.series
              )}/${encodeURIComponent(e.slug)}`;
              return (
                <li key={`${e.series}::${e.slug}`}>
                  <Link
                    href={href}
                    className="group flex gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-ink-900/70 to-ink-900/40 p-2.5 transition hover:-translate-y-0.5 hover:border-indigo-400/50 hover:shadow-[0_12px_30px_-15px_rgba(129,140,248,0.55)]"
                  >
                    <div className="relative aspect-video h-20 shrink-0 overflow-hidden rounded-xl bg-ink-800">
                      {e.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={e.cover}
                          alt={e.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition group-hover:opacity-100" />
                      <PlayCircle className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition group-hover:opacity-100" />
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-brand-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-bold text-ink-100 group-hover:text-white">
                        {e.title}
                      </p>
                      <p className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-200">
                        Ep {e.episode}
                      </p>
                      <p className="mt-1.5 text-[11px] text-ink-500">
                        {fmt(e.progress)} / {fmt(e.duration)}
                      </p>
                      <p className="text-[10px] text-ink-500">
                        {relTime(e.updatedAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
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
  accent: "indigo" | "fuchsia" | "brand";
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
