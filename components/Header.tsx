"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Tv, Home, CalendarDays, LibraryBig, Sparkles } from "lucide-react";
import { useState } from "react";
import AuthButton from "@/components/AuthButton";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/genre", label: "Genre", icon: Sparkles },
  { href: "/anime-list", label: "Anime List", icon: LibraryBig },
  { href: "/jadwal", label: "Jadwal", icon: CalendarDays },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");

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

        <form
          className="ml-auto flex w-full max-w-[220px] items-center gap-2 sm:max-w-xs"
          onSubmit={(e) => {
            e.preventDefault();
            const val = q.trim();
            if (val) router.push(`/search?q=${encodeURIComponent(val)}`);
          }}
        >
          <label className="group flex w-full items-center gap-2 rounded-full border border-white/10 bg-ink-900/60 px-3 py-1.5 text-sm focus-within:border-indigo-400/70">
            <Search className="h-4 w-4 text-ink-400 group-focus-within:text-indigo-300" />
            <input
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari anime…"
              className="w-full bg-transparent text-ink-100 outline-none placeholder:text-ink-500"
            />
          </label>
        </form>

        <AuthButton />
      </div>
    </header>
  );
}
