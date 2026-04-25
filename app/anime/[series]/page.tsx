import { getDetail } from "@/lib/api";
import EpisodeList from "@/components/EpisodeList";
import Comments from "@/components/Comments";
import { notFound } from "next/navigation";
import { CalendarDays, Eye, Star, Tv, User } from "lucide-react";
import Link from "next/link";
import { incrementView, formatViews } from "@/lib/views";
import { slugify } from "@/lib/genres";
import WatchlistButton from "@/components/WatchlistButton";
import ShareButton from "@/components/ShareButton";

export const dynamic = "force-dynamic";

type Props = { params: { series: string } };

export async function generateMetadata({ params }: Props) {
  const series = decodeURIComponent(params.series);
  try {
    const res = await getDetail(series);
    const d = res.data?.[0];
    if (!d) return { title: series };
    return {
      title: d.judul,
      description: d.sinopsis?.slice(0, 160),
    };
  } catch {
    return { title: series };
  }
}

export default async function DetailPage({ params }: Props) {
  const series = decodeURIComponent(params.series);
  let d;
  try {
    const res = await getDetail(series);
    d = res.data?.[0];
  } catch {
    d = null;
  }
  if (!d) return notFound();

  // Increment view counter (fire-and-forget; tolerates KV unavailable)
  const viewCount = await incrementView(series).catch(() => 0);

  const firstEp = d.chapter?.[d.chapter.length - 1];

  return (
    <article className="container-page space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-ink-800/60 bg-ink-900/40">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-20 blur-xl"
          style={{ backgroundImage: `url(${d.cover})` }}
        />
        <div className="relative grid gap-4 p-4 sm:grid-cols-[220px_1fr] sm:gap-6 sm:p-6">
          <img
            src={d.cover}
            alt={d.judul}
            className="mx-auto aspect-[2/3] w-48 rounded-lg object-cover shadow-xl sm:mx-0 sm:w-full"
          />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold sm:text-3xl">{d.judul}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {d.genre?.map((g) => (
                <Link
                  key={g}
                  href={`/genre/${slugify(g)}`}
                  className="inline-flex items-center rounded-full border border-white/10 bg-ink-900/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-200 transition hover:border-indigo-400/60 hover:bg-indigo-500/15 hover:text-white"
                >
                  {g}
                </Link>
              ))}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-sm text-ink-300 sm:grid-cols-3">
              <div className="flex items-center gap-1.5">
                <Tv className="h-4 w-4 text-ink-400" /> {d.type}
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-yellow-400" /> {d.rating || "—"}
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-ink-400" />{" "}
                {d.published || "—"}
              </div>
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-ink-400" /> {d.author || "—"}
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-ink-400" />{" "}
                {formatViews(viewCount)} penonton
              </div>
              <div className="chip w-fit">{d.status}</div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-ink-300">
              {d.sinopsis}
            </p>
            {firstEp ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/watch/${encodeURIComponent(
                    d.series_id
                  )}/${encodeURIComponent(firstEp.url)}`}
                  className="btn-primary"
                >
                  Tonton Episode 1
                </Link>
                {d.chapter.length > 1 ? (
                  <Link
                    href={`/watch/${encodeURIComponent(
                      d.series_id
                    )}/${encodeURIComponent(d.chapter[0].url)}`}
                    className="btn-ghost"
                  >
                    Episode terbaru ({d.chapter[0].ch})
                  </Link>
                ) : null}
                <WatchlistButton
                  item={{
                    series: d.series_id,
                    title: d.judul,
                    cover: d.cover,
                    type: d.type,
                    addedAt: Date.now(),
                  }}
                />
                <ShareButton title={d.judul} text={d.sinopsis?.slice(0, 120)} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Daftar Episode</h2>
        <EpisodeList series={d.series_id} episodes={d.chapter} />
      </section>

      <Comments series={params.series} />
    </article>
  );
}
