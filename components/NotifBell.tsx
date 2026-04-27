"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, Check, Heart, MessageSquare, UserPlus, AtSign, Trophy, Sparkles } from "lucide-react";
import type { Notification, NotifType } from "@/lib/notifications";

const ICONS: Record<NotifType, typeof Bell> = {
  reply: MessageSquare,
  like: Heart,
  follow: UserPlus,
  mention: AtSign,
  achievement: Trophy,
  system: Sparkles,
};

const COLORS: Record<NotifType, string> = {
  reply: "text-indigo-300",
  like: "text-rose-300",
  follow: "text-emerald-300",
  mention: "text-amber-300",
  achievement: "text-fuchsia-300",
  system: "text-sky-300",
};

const POLL_MS = 60_000;

export default function NotifBell() {
  const { status } = useSession();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  async function refresh() {
    if (status !== "authenticated") return;
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      const d = (await r.json()) as {
        ok: boolean;
        items?: Notification[];
        unread?: number;
      };
      if (d.ok) {
        setItems(d.items ?? []);
        setUnread(d.unread ?? 0);
      }
    } catch {
      /* noop */
    }
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    refresh();
    const t = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  async function markAll() {
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "markRead" }),
    }).catch(() => {});
  }

  if (status !== "authenticated") return null;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open && unread > 0) markAll();
        }}
        aria-label="Notifikasi"
        className="relative grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-ink-900/60 text-ink-200 transition hover:border-indigo-400/60 hover:text-indigo-200"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[300px] overflow-hidden rounded-2xl border border-white/10 bg-ink-950/95 shadow-2xl backdrop-blur sm:w-[360px]">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-300">
              Notifikasi
            </span>
            <button
              type="button"
              onClick={markAll}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-ink-400 hover:bg-white/5 hover:text-white"
            >
              <Check className="h-3 w-3" /> Tandai sudah dibaca
            </button>
          </div>
          {items.length === 0 ? (
            <div className="grid place-items-center py-10 text-center text-xs text-ink-500">
              Belum ada notifikasi
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.map((n) => {
                const Icon = ICONS[n.type] ?? Bell;
                const color = COLORS[n.type] ?? "text-ink-300";
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-start gap-2 border-b border-white/5 px-3 py-2.5 transition hover:bg-white/5 ${
                        n.read ? "" : "bg-indigo-500/5"
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/5 ${color}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] leading-tight text-ink-100">
                          <span className="font-bold">{n.fromName ?? "Sistem"}</span>{" "}
                          {labelFor(n)}
                        </p>
                        {n.body ? (
                          <p className="mt-0.5 truncate text-[11px] text-ink-400">
                            {n.body}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[10px] text-ink-500">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function labelFor(n: Notification): string {
  switch (n.type) {
    case "reply":
      return "membalas komentar Anda";
    case "like":
      return "menyukai komentar Anda";
    case "follow":
      return "mulai mengikuti Anda";
    case "mention":
      return "menyebut Anda";
    case "achievement":
      return "Anda mendapatkan pencapaian baru!";
    case "system":
    default:
      return "";
  }
}

function timeAgo(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}d`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}h`;
  return new Date(ts).toLocaleDateString("id-ID");
}
