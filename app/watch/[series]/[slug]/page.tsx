import { getDetail, getStream } from "@/lib/api";
import VideoPlayer from "@/components/VideoPlayer";
import EpisodeList from "@/components/EpisodeList";
import HistoryTracker from "@/components/HistoryTracker";
import Comments from "@/components/Comments";
import DownloadSection from "@/components/DownloadSection";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const revalidate = 60;

type Props = { params: { series: string; slug: string } };

export async function generateMetadata({ params }: Props) {
  const series = decodeURIComponent(params.series);
  const slug = decodeURIComponent(params.slug);
  try {
    const res = await getDetail(series);
    const d = res.data?.[0];
    const ep = d?.chapter.find((c) => c.url === slug);
    return {
      title: d ? `${d.judul} — Ep ${ep?.ch ?? ""}` : slug,
    };
  } catch {
    return { title: slug };
  }
}

function getEpisodeIndex(
  chapter: { url: string }[] | undefined,
  slug: string
) {
  if (!chapter) return -1;
  return chapter.findIndex((c) => c.url === slug);
}

export default async function WatchPage({ params }: Props) {
  const series = decodeURIComponent(params.series);
  const slug = decodeURIComponent(params.slug);

  const [detailRes, streamRes] = await Promise.allSettled([
    getDetail(series),
    getStream({ slug, series }),
  ]);

  const detail =
    detailRes.status === "fulfilled" ? detailRes.value.data?.[0] : null;
  const stream =
    streamRes.status === "fulfilled" ? streamRes.value.data?.[0] : null;
  if (!detail && !stream) return notFound();

  const episodes = detail?.chapter ?? [];
  const idx = getEpisodeIndex(episodes, slug);
  // Chapter list is ordered newest -> oldest.
  const nextEp = idx > 0 ? episodes[idx - 1] : null;
  const prevEp = idx >= 0 && idx < episodes.length - 1 ? episodes[idx + 1] : null;
  const current = idx >= 0 ? episodes[idx] : null;

  return (
    <div className="container-page space-y-6">
      <div className="flex items-center gap-2 text-sm text-ink-400">
        <Link
          href={`/anime/${encodeURIComponent(series)}`}
          className="inline-flex items-center gap-1 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          {detail?.judul ?? series}
        </Link>
        {current ? <span>· Episode {current.ch}</span> : null}
      </div>

      {stream ? (
        <>
          <VideoPlayer
            stream={stream}
            title={`${detail?.judul ?? series} episode ${current?.ch ?? ""}`}
            poster={detail?.cover}
            prevHref={
              prevEp
                ? `/watch/${encodeURIComponent(series)}/${encodeURIComponent(
                    prevEp.url
                  )}`
                : null
            }
            nextHref={
              nextEp
                ? `/watch/${encodeURIComponent(series)}/${encodeURIComponent(
                    nextEp.url
                  )}`
                : null
            }
          />
          <HistoryTracker
            series={series}
            slug={slug}
            title={detail?.judul ?? series}
            episode={current?.ch ?? ""}
            cover={detail?.cover ?? ""}
          />
          <DownloadSection stream={stream} />
        </>
      ) : (
        <div className="grid aspect-video w-full place-items-center rounded-xl border border-ink-800 bg-ink-900 text-sm text-ink-300">
          Stream tidak tersedia untuk episode ini.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">Semua Episode</h2>
        <EpisodeList
          series={series}
          episodes={episodes}
          currentSlug={slug}
        />
      </section>

      {detail ? (
        <section className="rounded-xl border border-ink-800/60 bg-ink-900/40 p-4">
          <h3 className="mb-1 text-sm font-semibold text-ink-200">Sinopsis</h3>
          <p className="text-sm text-ink-300">{detail.sinopsis}</p>
        </section>
      ) : null}

      <Comments series={series} />
    </div>
  );
}
