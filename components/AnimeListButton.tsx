"use client";

import { useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Bookmark, Check, Loader2, Star, Trash2, X } from "lucide-react";
import {
  USERLIST_LABEL,
  USERLIST_STATUSES,
  USERLIST_THEME,
  type UserlistEntry,
  type UserlistStatus,
} from "@/lib/userlist";

type Props = {
  series: string;
  title?: string;
  cover?: string;
  type?: string;
};

const STATUS_ICONS: Record<UserlistStatus, string> = {
  watching: "▶︎",
  completed: "✓",
  planned: "+",
  dropped: "×",
  hold: "⏸",
};

export default function AnimeListButton({ series, title, cover, type }: Props) {
  const { status: session } = useSession();
  const [entry, setEntry] = useState<UserlistEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (session !== "authenticated") {
      setLoading(false);
      return;
    }
    let cancel = false;
    fetch(`/api/userlist?series=${encodeURIComponent(series)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d: { ok: boolean; entry?: UserlistEntry | null }) => {
        if (cancel) return;
        if (d.ok) setEntry(d.entry ?? null);
      })
      .catch(() => {})
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [series, session]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  async function setStatus(s: UserlistStatus) {
    if (session !== "authenticated") {
      signIn("google");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/userlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          series,
          status: s,
          rating: entry?.rating,
          title,
          cover,
          type,
        }),
      });
      const d = (await r.json()) as { ok: boolean; entry?: UserlistEntry };
      if (d.ok && d.entry) setEntry(d.entry);
    } finally {
      setBusy(false);
    }
  }

  async function setRating(n: number) {
    if (session !== "authenticated") {
      signIn("google");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/userlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          series,
          status: entry?.status ?? "watching",
          rating: n,
          title,
          cover,
          type,
        }),
      });
      const d = (await r.json()) as { ok: boolean; entry?: UserlistEntry };
      if (d.ok && d.entry) setEntry(d.entry);
    } finally {
      setBusy(false);
    }
  }

  async function clearEntry() {
    setBusy(true);
    try {
      await fetch(`/api/userlist?series=${encodeURIComponent(series)}`, {
        method: "DELETE",
      });
      setEntry(null);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (session !== "authenticated") {
    return (
      <button
        type="button"
        onClick={() => signIn("google")}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-900/60 px-3 py-1.5 text-[11px] font-semibold text-ink-200 transition hover:border-indigo-400/60 hover:text-indigo-200 sm:text-xs"
      >
        <Bookmark className="h-3.5 w-3.5" /> Tambah ke Daftar
      </button>
    );
  }

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-900/60 px-3 py-1.5 text-[11px] text-ink-400 sm:text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat…
      </span>
    );
  }

  const theme = entry?.status ? USERLIST_THEME[entry.status] : null;

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition sm:text-xs ${
          theme
            ? `${theme.chip} ${theme.text} ${theme.border}`
            : "border-white/10 bg-ink-900/60 text-ink-200 hover:border-indigo-400/60 hover:text-indigo-200"
        }`}
      >
        {entry?.status ? (
          <>
            <span className="text-base leading-none">
              {STATUS_ICONS[entry.status]}
            </span>
            {USERLIST_LABEL[entry.status]}
            {entry.rating ? (
              <span className="ml-1 inline-flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                <span className="tabular-nums">{entry.rating}</span>
              </span>
            ) : null}
          </>
        ) : (
          <>
            <Bookmark className="h-3.5 w-3.5" /> Tambah ke Daftar
          </>
        )}
      </button>
      {open ? (
        <div className="absolute left-0 z-50 mt-2 w-[260px] overflow-hidden rounded-2xl border border-white/10 bg-ink-950/95 shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-300">
            Status
          </div>
          <ul className="p-1">
            {USERLIST_STATUSES.map((s) => {
              const t = USERLIST_THEME[s];
              const active = entry?.status === s;
              return (
                <li key={s}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStatus(s)}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition ${
                      active
                        ? `${t.chip} ${t.text}`
                        : "text-ink-200 hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                      {USERLIST_LABEL[s]}
                    </span>
                    {active ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-white/10 px-3 py-2">
            <div className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-ink-300">
              <span>Rating</span>
              {entry?.rating ? (
                <span className="text-ink-400 normal-case">
                  {entry.rating}/10
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 10 }).map((_, i) => {
                const n = i + 1;
                const active = (entry?.rating ?? 0) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={busy}
                    onClick={() => setRating(n)}
                    className={`grid h-7 w-7 place-items-center rounded-md transition ${
                      active
                        ? "bg-amber-400/20 text-amber-300"
                        : "bg-white/5 text-ink-400 hover:text-ink-200"
                    }`}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${
                        active ? "fill-amber-300" : ""
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            {entry?.rating ? (
              <button
                type="button"
                onClick={() => setRating(0)}
                className="mt-2 inline-flex items-center gap-1 text-[10px] text-ink-500 hover:text-ink-300"
              >
                <X className="h-3 w-3" /> Hapus rating
              </button>
            ) : null}
          </div>
          {entry ? (
            <div className="border-t border-white/10 p-1">
              <button
                type="button"
                disabled={busy}
                onClick={clearEntry}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs text-rose-300 transition hover:bg-rose-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Hapus dari daftar
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
