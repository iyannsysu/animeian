import { notFound } from "next/navigation";
import Link from "next/link";
import { Crown, Search, ShieldCheck } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { listAllUsers, getWatchSeconds, touchUser } from "@/lib/user";
import { computeLevel, formatWatchTime, tierFor } from "@/lib/level";
import LevelBadge from "@/components/LevelBadge";
import AdminLevelForm from "@/components/AdminLevelForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · Atur Level — Anime Ian",
};

export default async function AdminLevelPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !isAdminEmail(sessionUser.email)) {
    notFound();
  }

  // Pastikan admin sendiri tercatat di registry
  await touchUser({
    id: sessionUser.id,
    name: sessionUser.name,
    image: sessionUser.image,
    email: sessionUser.email,
  });

  const users = await listAllUsers();
  const enriched = await Promise.all(
    users.map(async (u) => {
      const sec = await getWatchSeconds(u.id);
      return { ...u, watchSeconds: sec, level: computeLevel(sec) };
    })
  );
  enriched.sort((a, b) => b.level - a.level || b.updatedAt - a.updatedAt);

  return (
    <div className="container-page space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-500/15 via-indigo-500/10 to-ink-900/50 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-fuchsia-200">
            <ShieldCheck className="h-3 w-3" /> Admin Panel
          </div>
          <h1 className="mt-3 bg-gradient-to-r from-white via-fuchsia-200 to-indigo-200 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-5xl">
            Atur Level User
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-300">
            Set level user manapun. Cari berdasarkan email atau pilih dari
            daftar di bawah. Hanya akun{" "}
            <span className="font-bold text-fuchsia-200">
              {sessionUser.email}
            </span>{" "}
            yang bisa akses halaman ini.
          </p>
          <p className="mt-2 text-[11px] text-ink-500">
            {enriched.length} user tercatat di sistem
          </p>
        </div>
      </header>

      <AdminLevelForm />

      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg">
            <Search className="h-4 w-4 text-indigo-300" />
            Daftar User
          </h2>
        </header>

        {!enriched.length ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-ink-900/40 p-8 text-center text-sm text-ink-400">
            Belum ada user yang tercatat. User akan otomatis muncul di sini
            setelah mereka login Google atau menulis komentar.
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {enriched.map((u) => {
              const tier = tierFor(u.level);
              return (
                <li
                  key={u.id}
                  className={`flex items-center gap-3 rounded-2xl border ${tier.border} bg-ink-900/60 p-3`}
                >
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
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/u/${encodeURIComponent(u.id)}`}
                        className={`truncate text-sm font-bold hover:underline ${tier.text}`}
                      >
                        {u.name}
                      </Link>
                      <LevelBadge level={u.level} size="xs" />
                    </div>
                    <p className="truncate text-[11px] text-ink-400">
                      {u.email ?? "—"}
                    </p>
                    <p className="text-[10px] text-ink-500">
                      <Crown className="mr-1 inline h-3 w-3 text-amber-300" />
                      {formatWatchTime(u.watchSeconds)} · ID:{" "}
                      <code className="text-ink-400">{u.id.slice(0, 12)}</code>
                    </p>
                  </div>
                  <CopyTargetButton id={u.id} email={u.email ?? null} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function CopyTargetButton({
  id,
  email,
}: {
  id: string;
  email: string | null;
}) {
  return (
    <a
      href={`#admin-form?target=${encodeURIComponent(email ?? id)}`}
      className="shrink-0 rounded-full border border-indigo-400/40 bg-indigo-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-200 hover:border-indigo-400/70 hover:bg-indigo-500/25"
    >
      Set
    </a>
  );
}
