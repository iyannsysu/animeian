"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LibraryBig, Search, Sparkles, CalendarDays } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/genre", label: "Genre", icon: Sparkles },
  { href: "/anime-list", label: "A-Z", icon: LibraryBig },
  { href: "/jadwal", label: "Jadwal", icon: CalendarDays },
  { href: "/search", label: "Cari", icon: Search },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-ink-950/90 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname?.startsWith(href) ?? false;
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${
                  active ? "text-indigo-300" : "text-ink-400"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
