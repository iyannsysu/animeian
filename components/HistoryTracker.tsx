"use client";

import { useEffect } from "react";
import { saveHistory } from "@/lib/history";

type Props = {
  series: string;
  slug: string;
  title: string;
  episode: string;
  cover: string;
};

export default function HistoryTracker(props: Props) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const video = document.querySelector("video") as HTMLVideoElement | null;
    if (!video) return;

    let lastSaveAt = 0;
    let beatStartedAt = 0;
    let beatTimer: ReturnType<typeof setInterval> | null = null;

    const write = () => {
      const progress = video.currentTime;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      if (!duration) return;
      saveHistory({
        series: props.series,
        slug: props.slug,
        title: props.title,
        episode: props.episode,
        cover: props.cover,
        progress,
        duration,
        updatedAt: Date.now(),
      });
    };

    const onTimeUpdate = () => {
      const now = Date.now();
      if (now - lastSaveAt < 8000) return;
      lastSaveAt = now;
      write();
    };

    // Heartbeat untuk level/watch time: kirim 15 detik tiap 15 detik saat playing
    const sendBeat = (seconds: number) => {
      if (seconds <= 0) return;
      try {
        const blob = new Blob(
          [JSON.stringify({ seconds: Math.min(30, Math.floor(seconds)) })],
          { type: "application/json" }
        );
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/watch-beat", blob);
        } else {
          fetch("/api/watch-beat", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ seconds: Math.min(30, Math.floor(seconds)) }),
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        /* noop */
      }
    };

    const startBeats = () => {
      if (beatTimer) return;
      beatStartedAt = Date.now();
      beatTimer = setInterval(() => {
        const now = Date.now();
        const dt = Math.floor((now - beatStartedAt) / 1000);
        if (dt > 0 && !video.paused && !video.ended) {
          sendBeat(dt);
          beatStartedAt = now;
        }
      }, 15000);
    };

    const stopBeats = (flush = true) => {
      if (beatTimer) {
        clearInterval(beatTimer);
        beatTimer = null;
      }
      if (flush) {
        const dt = Math.floor((Date.now() - beatStartedAt) / 1000);
        if (dt > 0) sendBeat(dt);
        beatStartedAt = 0;
      }
    };

    const onPlay = () => startBeats();
    const onPause = () => {
      stopBeats(true);
      write();
    };
    const onEnded = () => {
      stopBeats(true);
      write();
    };
    const onBeforeUnload = () => {
      stopBeats(true);
      write();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        stopBeats(true);
        write();
      } else if (!video.paused) {
        startBeats();
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("playing", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibility);

    if (!video.paused) startBeats();

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("playing", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibility);
      stopBeats(true);
      write();
    };
  }, [props.cover, props.episode, props.series, props.slug, props.title]);

  return null;
}
