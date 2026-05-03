"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Flame, Play, Star } from "lucide-react";
import { formatViews } from "@/lib/views";
import { slugify } from "@/lib/genres";

export type HeroSlide = {
  series: string;
  title: string;
  cover: string;
  synopsis?: string;
  genres?: string[];
  status?: string;
  score?: string;
  type?: string;
  lastch?: string;
  views?: number;
};

type Props = {
  slides: HeroSlide[];
  intervalMs?: number;
};

export default function HeroCarousel({ slides, intervalMs = 5000 }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (total <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [total, paused, intervalMs]);

  const go = (i: number) => setIndex(((i % total) + total) % total);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    setPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    setTimeout(() => setPaused(false), 1500);
    if (start == null) return;
    const end = e.changedTouches[0]?.clientX ?? start;
    const dx = end - start;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) go(index + 1);
    else go(index - 1);
  };

  const slide = slides[index];
  const heroBg = useMemo(() => slide?.cover, [slide]);

  if (!slide) return null;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-900/40 shadow-[0_25px_60px_-20px_rgba(0,0,0,0.6)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        aria-hidden
        key={slide.series}
        className="absolute inset-0 bg-cover bg-center opacity-40 fade-in-up"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-ink-950/90 via-ink-950/70 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent"
      />

      <div
        ref={trackRef}
        className="relative grid gap-5 p-5 sm:grid-cols-[220px_1fr] sm:gap-7 sm:p-8"
        key={slide.series + "-content"}
      >
        <div className="relative mx-auto aspect-[2/3] w-40 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 sm:mx-0 sm:w-full fade-in-up">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.cover}
            alt={slide.title}
            loading="eager"
            className="h-full w-full object-cover"
          />
          {slide.lastch ? (
            <span className="absolute left-2 top-2 rounded-md bg-brand-600/95 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
              {slide.lastch}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col fade-in-up">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
            <Flame className="h-3 w-3" /> Trending Ongoing
          </span>
          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
            {slide.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-300">
            {slide.type ? <span>{slide.type}</span> : null}
            {slide.status ? <span>· {slide.status}</span> : null}
            {slide.score ? (
              <span className="inline-flex items-center gap-1 text-yellow-300">
                <Star className="h-3.5 w-3.5 fill-yellow-300" /> {slide.score}
              </span>
            ) : null}
            {typeof slide.views === "number" && slide.views > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {formatViews(slide.views)}
              </span>
            ) : null}
          </div>
          {slide.genres?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {slide.genres.slice(0, 4).map((g) => (
                <Link
                  key={g}
                  href={`/genre/${slugify(g)}`}
                  className="inline-flex items-center rounded-full border border-white/10 bg-ink-900/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-200 transition hover:border-indigo-400/60 hover:bg-indigo-500/15 hover:text-white"
                >
                  {g}
                </Link>
              ))}
            </div>
          ) : null}
          {slide.synopsis ? (
            <p className="mt-4 line-clamp-3 text-sm text-ink-300 sm:line-clamp-4">
              {slide.synopsis}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/anime/${encodeURIComponent(slide.series)}`}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(129,140,248,0.7)] transition hover:brightness-110"
            >
              <Play className="h-4 w-4 fill-current" /> Tonton Sekarang
            </Link>
            <Link
              href={`/anime/${encodeURIComponent(slide.series)}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              Detail
            </Link>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {total > 1 ? (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
          <div
            key={`bar-${index}-${paused ? "p" : "r"}`}
            className="h-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-brand-500"
            style={{
              animation: paused
                ? "none"
                : `heroBar ${intervalMs}ms linear forwards`,
            }}
          />
        </div>
      ) : null}

      {/* Dots */}
      {total > 1 ? (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index
                  ? "w-6 bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-brand-400"
                  : "w-1.5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      ) : null}

      <style jsx>{`
        @keyframes heroBar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
