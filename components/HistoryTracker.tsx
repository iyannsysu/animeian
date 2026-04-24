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

    const write = () => {
      const progress = video.currentTime;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      if (!duration) return;
      // save on first frame (mark as started) and also periodically
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
      if (now - lastSaveAt < 8000) return; // throttle ~8s
      lastSaveAt = now;
      write();
    };

    const onPause = () => write();
    const onEnded = () => write();
    const onBeforeUnload = () => write();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") write();
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibility);
      write();
    };
  }, [props.cover, props.episode, props.series, props.slug, props.title]);

  return null;
}
