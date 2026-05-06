import { Download, ExternalLink, Server } from "lucide-react";
import type { StreamItem, StreamQuality } from "@/lib/types";

const QUALITIES: StreamQuality[] = ["360p", "480p", "720p", "1080p"];

const QUALITY_STYLE: Record<StreamQuality, string> = {
  "360p": "from-zinc-500/20 to-zinc-600/10 border-zinc-500/30 text-zinc-200",
  "480p": "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-200",
  "720p": "from-sky-500/20 to-indigo-500/10 border-sky-500/30 text-sky-200",
  "1080p": "from-fuchsia-500/20 to-violet-500/10 border-fuchsia-500/30 text-fuchsia-200",
};

function hostFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function isDirectVideo(url: string) {
  // Blogger video CDN returns a direct video stream that browsers can save.
  // Plus generic .mp4/.mkv/.webm endings.
  if (/\.(mp4|mkv|webm|m3u8)(\?|$)/i.test(url)) return true;
  if (/blogger\.com\/video\.g\?/i.test(url)) return true;
  return false;
}

export default function DownloadSection({ stream }: { stream: StreamItem }) {
  // Prefer the dedicated `downloads` buckets (samehadaku file-host mirrors).
  // Fall back to `streams` for older payloads / animasu where embed links
  // doubled as both player and downloadable target.
  const buckets = stream.downloads ?? stream.streams;
  const qualities = QUALITIES.filter((q) => (buckets[q]?.length ?? 0) > 0);
  if (!qualities.length) return null;

  return (
    <section className="rounded-2xl border border-ink-800/70 bg-gradient-to-br from-ink-900/60 to-ink-950/60 p-5">
      <header className="mb-4 flex items-center gap-2">
        <Download className="h-5 w-5 text-emerald-300" />
        <h2 className="text-lg font-bold text-white">Download Episode</h2>
        <span className="ml-auto rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-200">
          {qualities.length} kualitas
        </span>
      </header>

      <p className="mb-4 text-xs text-ink-400">
        Pilih kualitas dan server. Klik untuk membuka di tab baru — di sana
        Anda bisa simpan video. Server <em>blogger.com</em> bisa langsung
        di-save dari browser (klik kanan → Simpan video sebagai).
      </p>

      <div className="space-y-3">
        {qualities.map(
          (q) => {
            const links = buckets[q] ?? [];
            return (
              <div
                key={q}
                className={`rounded-xl border bg-gradient-to-br p-3 ${QUALITY_STYLE[q]}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md bg-black/40 px-2 py-0.5 text-xs font-bold tracking-wider">
                    {q}
                  </span>
                  <span className="text-xs opacity-80">
                    {links.length} server tersedia
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {links.map((l, i) => {
                    const host = hostFromUrl(l.link);
                    const direct = isDirectVideo(l.link);
                    return (
                      <a
                        key={`${q}-${i}-${l.link}`}
                        href={l.link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="group flex items-center gap-2 rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm transition hover:border-emerald-400/40 hover:bg-emerald-500/10"
                      >
                        <Server className="h-4 w-4 text-ink-400 group-hover:text-emerald-300" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-white">
                            Server {i + 1}
                          </div>
                          <div className="truncate text-[10px] text-ink-400">
                            {host}
                            {direct ? " · direct" : " · embed"}
                          </div>
                        </div>
                        {direct ? (
                          <Download className="h-4 w-4 text-emerald-300" />
                        ) : (
                          <ExternalLink className="h-4 w-4 text-ink-400 group-hover:text-emerald-300" />
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          }
        )}
      </div>
    </section>
  );
}
