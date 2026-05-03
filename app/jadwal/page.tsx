import { getJadwal } from "@/lib/api";
import Link from "next/link";
import { CalendarDays, Clock, Sparkles, Star } from "lucide-react";

export const revalidate = 1800;

export const metadata = {
  title: "Jadwal Rilis — Anime Ian",
  description: "Jadwal rilis anime per hari dalam seminggu.",
};

const DAY_GRADIENTS: Record<string, string> = {
  Senin: "from-indigo-500/25 via-indigo-500/10",
  Selasa: "from-fuchsia-500/25 via-fuchsia-500/10",
  Rabu: "from-emerald-500/25 via-emerald-500/10",
  Kamis: "from-amber-500/25 via-amber-500/10",
  Jumat: "from-rose-500/25 via-rose-500/10",
  Sabtu: "from-sky-500/25 via-sky-500/10",
  Minggu: "from-violet-500/25 via-violet-500/10",
};

export default async function JadwalPage() {
  let data: Awaited<ReturnType<typeof getJadwal>>["data"];
  try {
    data = (await getJadwal()).data;
  } catch {
    data = [];
  }

  const totalEntries = data.reduce(
    (s, d) => s + (d.animeList?.length ?? 0),
    0
  );

  return (
    <div className="container-page space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-ink-900/40 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-200">
            <CalendarDays className="h-3 w-3" /> Minggu Ini
          </div>
          <h1 className="mt-4 bg-gradient-to-r from-white via-indigo-200 to-fuchsia-300 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-5xl">
            Jadwal Rilis
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-300 sm:text-base">
            Jadwal rilis anime per hari — biar nggak ketinggalan episode
            favoritmu.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-ink-400">
            <Sparkles className="h-3 w-3 text-indigo-300" />
            {totalEntries} rilis minggu ini
          </p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {data.map((day) => {
          const gradient =
            DAY_GRADIENTS[day.day] ?? "from-indigo-500/20 via-fuchsia-500/10";
          return (
            <div
              key={day.day + day.date}
              className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${gradient} to-ink-900/60`}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl"
              />

              <div className="relative flex items-end justify-between px-5 py-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur">
                    <CalendarDays className="h-3 w-3" />
                    {day.date}
                  </div>
                  <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                    {day.day}
                  </h2>
                </div>
                <span className="rounded-full border border-white/10 bg-ink-950/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-200 backdrop-blur">
                  {day.animeList?.length ?? 0} anime
                </span>
              </div>

              <div className="relative space-y-2 px-3 pb-4 sm:px-4">
                {!day.animeList?.length ? (
                  <p className="rounded-2xl border border-dashed border-white/10 bg-ink-950/30 p-6 text-center text-xs text-ink-400">
                    Tidak ada rilis di hari ini.
                  </p>
                ) : (
                  day.animeList.map((a) => (
                    <Link
                      key={a.id}
                      href={`/anime/${encodeURIComponent(a.link)}`}
                      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-950/70 p-2 transition hover:-translate-y-0.5 hover:border-indigo-400/50 hover:bg-ink-900/80 hover:shadow-[0_12px_28px_-14px_rgba(129,140,248,0.55)]"
                    >
                      <div className="relative aspect-[2/3] h-20 shrink-0 overflow-hidden rounded-xl bg-ink-800 sm:h-24">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={a.cover}
                          alt={a.anime_name}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        {a.score ? (
                          <span className="absolute bottom-1 left-1 right-1 inline-flex items-center justify-center gap-1 rounded-md bg-black/75 px-1 py-0.5 text-[10px] font-bold text-amber-200 backdrop-blur">
                            <Star className="h-2.5 w-2.5 fill-amber-300 text-amber-300" />
                            {a.score}
                          </span>
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-bold leading-snug text-ink-100 group-hover:text-white">
                          {a.anime_name}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-ink-400">
                          {a.time ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 font-semibold uppercase tracking-wide text-indigo-200">
                              <Clock className="h-2.5 w-2.5" />
                              {a.time}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
