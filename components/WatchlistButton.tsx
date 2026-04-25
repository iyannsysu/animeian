"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import {
  localAdd,
  localHas,
  localRemove,
  type WatchlistItem,
} from "@/lib/watchlist";

type Props = {
  item: WatchlistItem;
  className?: string;
};

export default function WatchlistButton({ item, className = "" }: Props) {
  const { status } = useSession();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  // initial load
  useEffect(() => {
    let cancel = false;
    setActive(localHas(item.series));
    if (status === "authenticated") {
      fetch("/api/watchlist", { cache: "no-store" })
        .then((r) => r.json())
        .then((d: { items?: WatchlistItem[] }) => {
          if (cancel) return;
          if ((d.items ?? []).some((x) => x.series === item.series))
            setActive(true);
        })
        .catch(() => {});
    }
    return () => {
      cancel = true;
    };
  }, [item.series, status]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !active;
    setActive(next);
    if (next) localAdd(item);
    else localRemove(item.series);

    if (status === "authenticated") {
      try {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(next ? item : { ...item, remove: true }),
        });
      } catch {
        /* noop */
      }
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition disabled:opacity-60 ${
        active
          ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-200 shadow-[0_8px_22px_-12px_rgba(232,121,249,0.7)]"
          : "border-white/15 bg-ink-900/60 text-ink-200 hover:border-indigo-400/50 hover:text-white"
      } ${className}`}
    >
      {active ? (
        <BookmarkCheck className="h-3.5 w-3.5" />
      ) : (
        <Bookmark className="h-3.5 w-3.5" />
      )}
      {active ? "Tersimpan" : "Watchlist"}
    </button>
  );
}
