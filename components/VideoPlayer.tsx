"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  Settings2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  PictureInPicture2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StreamItem, StreamQuality } from "@/lib/types";

type Props = {
  stream: StreamItem;
  title: string;
  poster?: string;
  prevHref?: string | null;
  nextHref?: string | null;
};

const QUALITY_ORDER: StreamQuality[] = ["360p", "480p", "720p", "1080p"];

function pickDefaultQuality(
  available: StreamQuality[],
  isMobile: boolean
): StreamQuality | null {
  if (!available.length) return null;
  const saved =
    typeof window !== "undefined"
      ? (window.localStorage.getItem("animeian:quality") as StreamQuality | null)
      : null;
  if (saved && available.includes(saved)) return saved;
  const target: StreamQuality = isMobile ? "480p" : "720p";
  if (available.includes(target)) return target;
  // fallback: lowest available
  for (const q of QUALITY_ORDER) {
    if (available.includes(q)) return q;
  }
  return null;
}

export default function VideoPlayer({
  stream,
  title,
  poster,
  prevHref,
  nextHref,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [quality, setQuality] = useState<StreamQuality | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoNext, setAutoNext] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  const available = useMemo<StreamQuality[]>(() => {
    return QUALITY_ORDER.filter((q) => (stream.streams[q]?.length ?? 0) > 0);
  }, [stream]);

  // pick best provider for current quality (lowest `provide` score typically = direct storage)
  const sources = useMemo(() => {
    if (!quality) return [] as string[];
    const entries = stream.streams[quality] ?? [];
    // Prefer animekita / direct storage links (provide=871), then others
    const sorted = [...entries].sort((a, b) => {
      const score = (p: number) => (p === 871 ? 0 : 1);
      return score(a.provide) - score(b.provide);
    });
    return sorted
      .map((e) => e.link)
      .filter((u) => /\.mp4(\?|$)/i.test(u) || u.includes("storage."));
  }, [stream, quality]);

  // Detect mobile
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Initialize quality once
  useEffect(() => {
    if (quality) return;
    const q = pickDefaultQuality(available, isMobile);
    if (q) setQuality(q);
  }, [available, isMobile, quality]);

  // Persist saved time when switching quality
  const lastTimeRef = useRef(0);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      lastTimeRef.current = v.currentTime;
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [quality]);

  // When quality changes, re-attach source and seek to previous time
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !sources.length) return;
    const savedTime = lastTimeRef.current;
    const wasPlaying = !v.paused;
    setLoading(true);
    setError(null);
    v.load();
    const onLoaded = () => {
      if (savedTime > 0 && savedTime < v.duration) {
        try {
          v.currentTime = savedTime;
        } catch {
          /* noop */
        }
      }
      setLoading(false);
      if (wasPlaying) v.play().catch(() => {});
    };
    v.addEventListener("loadedmetadata", onLoaded, { once: true });
    return () => v.removeEventListener("loadedmetadata", onLoaded);
  }, [sources]);

  const onQualityChange = (q: StreamQuality) => {
    setQuality(q);
    setMenuOpen(false);
    try {
      window.localStorage.setItem("animeian:quality", q);
    } catch {
      /* noop */
    }
  };

  // Auto-play next episode dengan countdown 5 detik saat video selesai
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnded = () => {
      if (!autoNext || !nextHref) return;
      setCountdown(5);
    };
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, [autoNext, nextHref]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (nextHref) router.push(nextHref);
      setCountdown(null);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, nextHref, router]);

  // Media Session API: judul + cover di lock screen, tombol prev/next/play/pause
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist: "Anime Ian",
        album: title,
        artwork: poster
          ? [
              { src: poster, sizes: "512x512", type: "image/jpeg" },
              { src: poster, sizes: "256x256", type: "image/jpeg" },
            ]
          : [],
      });
      navigator.mediaSession.setActionHandler("play", () =>
        videoRef.current?.play().catch(() => {})
      );
      navigator.mediaSession.setActionHandler("pause", () =>
        videoRef.current?.pause()
      );
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        if (prevHref) router.push(prevHref);
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        if (nextHref) router.push(nextHref);
      });
    } catch {
      /* noop */
    }
  }, [title, poster, prevHref, nextHref, router]);

  async function togglePip() {
    const v = videoRef.current;
    if (!v) return;
    try {
      const doc = document as Document & {
        pictureInPictureElement?: Element | null;
        exitPictureInPicture?: () => Promise<void>;
      };
      if (doc.pictureInPictureElement) {
        await doc.exitPictureInPicture?.();
      } else if (
        "requestPictureInPicture" in v &&
        typeof (v as HTMLVideoElement).requestPictureInPicture === "function"
      ) {
        await v.requestPictureInPicture();
      }
    } catch {
      /* noop */
    }
  }

  if (!available.length) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-xl border border-ink-800 bg-ink-900 text-center">
        <div className="px-6 text-sm text-ink-300">
          <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-yellow-400" />
          Stream untuk episode ini belum tersedia.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-ink-800 bg-black">
        <video
          ref={videoRef}
          key={quality /* force remount if quality changes */}
          className="aspect-video w-full bg-black"
          controls
          playsInline
          preload="metadata"
          poster={poster}
          controlsList="nodownload"
          onWaiting={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onCanPlay={() => setLoading(false)}
          onError={() =>
            setError(
              "Gagal memuat video dari sumber ini. Coba pilih kualitas lain."
            )
          }
        >
          {sources.map((src) => (
            <source key={src} src={src} type="video/mp4" />
          ))}
        </video>

        {loading ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/80" />
          </div>
        ) : null}

        {error ? (
          <div className="absolute inset-x-0 bottom-0 bg-black/80 px-3 py-2 text-center text-xs text-yellow-300">
            {error}
          </div>
        ) : null}

        {countdown !== null && nextHref ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 px-6 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-ink-400">
              Lanjut otomatis dalam
            </p>
            <div className="text-6xl font-black tabular-nums text-white">
              {countdown}
            </div>
            <div className="flex gap-2">
              <Link
                href={nextHref}
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white"
              >
                Lanjut sekarang <ChevronRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setCountdown(null)}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-sm font-bold text-ink-100"
              >
                <X className="h-4 w-4" /> Batal
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="btn-ghost text-xs"
          >
            <Settings2 className="h-4 w-4" />
            Kualitas: <span className="font-semibold">{quality}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {menuOpen ? (
            <div className="absolute left-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-ink-800 bg-ink-900 shadow-xl">
              {available.map((q) => {
                const size = stream.resoSize?.[q];
                const active = q === quality;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onQualityChange(q)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs ${
                      active
                        ? "bg-brand-600/20 text-brand-300"
                        : "hover:bg-ink-800"
                    }`}
                  >
                    <span className="font-medium">{q}</span>
                    <span className="flex items-center gap-1 text-[10px] text-ink-400">
                      {size || ""}
                      {active ? <Check className="h-3 w-3" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={togglePip}
          className="btn-ghost text-xs"
          aria-label="Picture in Picture"
        >
          <PictureInPicture2 className="h-4 w-4" />
          PiP
        </button>

        {nextHref ? (
          <label className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-900/60 px-3 py-1.5 text-xs text-ink-200">
            <input
              type="checkbox"
              checked={autoNext}
              onChange={(e) => setAutoNext(e.target.checked)}
              className="h-3 w-3 accent-fuchsia-500"
            />
            Auto-next
          </label>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          {prevHref ? (
            <Link href={prevHref} className="btn-ghost text-xs">
              <ChevronLeft className="h-4 w-4" /> Sebelumnya
            </Link>
          ) : null}
          {nextHref ? (
            <Link href={nextHref} className="btn-primary text-xs">
              Episode berikutnya <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-ink-500">
        Tips: kualitas tersimpan otomatis. Pada jaringan lambat, pilih 360p atau
        480p untuk streaming tanpa patah.
      </p>

      <h1 className="sr-only">{title}</h1>
    </div>
  );
}
