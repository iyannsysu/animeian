"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Tv,
  Home,
  CalendarDays,
  LibraryBig,
  Sparkles,
  Dices,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AuthButton from "@/components/AuthButton";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/genre", label: "Genre", icon: Sparkles },
  { href: "/anime-list", label: "Anime List", icon: LibraryBig },
  { href: "/jadwal", label: "Jadwal", icon: CalendarDays },
];

type Suggest = { id: string; judul: string; url: string };

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggest[]>([]);
  const [open, setOpen] = useState(false);
  const [randomBusy, setRandomBusy] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Debounced fetch suggestions
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setItems([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(q.trim())}`,
          { cache: "no-store" }
        );
        const d = (await r.json()) as { items?: Suggest[] };
        setItems(d.items ?? []);
        setOpen(true);
      } catch {
        /* noop */
      }
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  // Close suggestion on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  async function pickRandom() {
    if (randomBusy) return;
    setRandomBusy(true);
    try {
      const r = await fetch("/api/random", { cache: "no-store" });
      const d = (await r.json()) as { ok: boolean; url?: string };
      if (d.ok && d.url)
        router.push(`/anime/${encodeURIComponent(d.url)}`);
    } finally {
      setRandomBusy(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl supports-[backdrop-filter]:bg-ink-950/50">
      <div className="container-page flex h-14 items-center gap-3 sm:h-16">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold tracking-tight"
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-brand-500 text-white shadow-[0_0_24px_-4px_rgba(129,140,248,0.7)]">
            <Tv className="h-4 w-4" />
          </span>
          <span className="text-lg">
            Anime{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-brand-400 bg-clip-text text-transparent">
              Ian
            </span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname?.startsWith(href) ?? false;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-ink-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div ref={wrapRef} className="relative ml-auto w-full max-w-[220px] sm:max-w-xs">
          <form
            className="flex w-full items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const val = q.trim();
              if (val) {
                router.push(`/search?q=${encodeURIComponent(val)}`);
                setOpen(false);
              }
            }}
          >
            <label className="group flex w-full items-center gap-2 rounded-full border border-white/10 bg-ink-900/60 px-3 py-1.5 text-sm focus-within:border-indigo-400/70">
              <Search className="h-4 w-4 text-ink-400 group-focus-within:text-indigo-300" />
              <input
                name="q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => items.length && setOpen(true)}
                placeholder="Cari anime…"
                className="w-full bg-transparent text-ink-100 outline-none placeholder:text-ink-500"
              />
            </label>
          </form>
          {open && items.length > 0 ? (
            <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-ink-950/95 p-1 shadow-2xl backdrop-blur">
              {items.map((it) => (
                <li key={it.id}>
                  <Link
                    href={`/anime/${encodeURIComponent(it.url)}`}
                    onClick={() => {
                      setOpen(false);
                      setQ("");
                    }}
                    className="block truncate rounded-xl px-3 py-2 text-sm text-ink-200 hover:bg-indigo-500/15 hover:text-white"
                  >
                    {it.judul}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <button
          type="button"
          onClick={pickRandom}
          disabled={randomBusy}
          aria-label="Anime acak"
          title="Anime acak"
          className="hidden h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-ink-900/60 text-ink-200 transition hover:border-fuchsia-400/60 hover:text-fuchsia-200 disabled:opacity-50 sm:grid"
        >
          {randomBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Dices className="h-4 w-4" />
          )}
        </button>

        <AuthButton />
      </div>
    </header>
  );
}
