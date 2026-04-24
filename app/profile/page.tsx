import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, MessageSquare, LogOut as LogOutIcon } from "lucide-react";
import { kv } from "@/lib/kv";
import { getSessionUser } from "@/lib/session";
import type { HistoryEntry } from "@/lib/history";
import type { Comment } from "@/app/api/comments/[series]/route";
import ProfileActions from "@/components/ProfileActions";

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

  return (
    <div className="container-page space-y-10">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-900/50 p-5 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border border-white/15 bg-ink-800 text-2xl font-bold text-white">
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
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold sm:text-2xl">
              {user.name}
            </h1>
            <p className="truncate text-xs text-ink-400 sm:text-sm">
              {user.email}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-ink-300">
              <span className="chip">
                <Clock className="mr-1 h-3 w-3" />
                {history.length} history
              </span>
              <span className="chip">
                <MessageSquare className="mr-1 h-3 w-3" />
                {comments.length} komentar
              </span>
            </div>
          </div>
          <ProfileActions />
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold sm:text-xl">Riwayat Tontonan</h2>
            <p className="text-xs text-ink-400">
              Tersinkron di semua perangkat yang login dengan akun ini
            </p>
          </div>
        </div>
        {!history.length ? (
          <EmptyState
            icon={<Clock className="h-5 w-5" />}
            text="Belum ada anime yang ditonton."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                    className="flex gap-3 rounded-2xl border border-white/10 bg-ink-900/50 p-2.5 transition hover:border-brand-500/40"
                  >
                    <div className="relative aspect-video h-20 shrink-0 overflow-hidden rounded-lg bg-ink-800">
                      {e.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={e.cover}
                          alt={e.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-fuchsia-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-ink-100">
                        {e.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-400">
                        Episode {e.episode}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-500">
                        {fmt(e.progress)} / {fmt(e.duration)} · {relTime(e.updatedAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold sm:text-xl">Komentar Saya</h2>
        {!comments.length ? (
          <EmptyState
            icon={<MessageSquare className="h-5 w-5" />}
            text="Anda belum menulis komentar."
          />
        ) : (
          <ul className="space-y-2">
            {comments.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-white/10 bg-ink-900/50 p-3"
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-ink-400">
                  <Link
                    href={`/anime/${encodeURIComponent(c.series)}`}
                    className="truncate text-brand-400 hover:text-brand-300"
                  >
                    {decodeURIComponent(c.series)}
                  </Link>
                  <span>{relTime(c.createdAt)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-200">
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

function EmptyState({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-ink-800 p-8 text-center text-sm text-ink-400">
      <div className="mb-2 text-ink-500">{icon}</div>
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
