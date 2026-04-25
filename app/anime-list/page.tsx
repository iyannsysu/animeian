import { getAnimeList } from "@/lib/api";
import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";
import { ArrowDownAZ, ArrowUpAZ, Search } from "lucide-react";

export const revalidate = 3600;

export const metadata = {
  title: "Daftar Anime A-Z",
};

type Item = { id: string; judul: string; url: string };
type SearchParams = { q?: string; letter?: string; sort?: string };

export default async function AnimeListPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  let raw: Record<string, unknown>;
  try {
    raw = (await getAnimeList()) as Record<string, unknown>;
  } catch {
    raw = {};
  }
  const groups: Record<string, Item[]> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (Array.isArray(v)) {
      groups[k] = v as Item[];
    }
  }
  let letters = Object.keys(groups).sort((a, b) => {
    if (a === "#") return -1;
    if (b === "#") return 1;
    return a.localeCompare(b);
  });

  const q = (searchParams?.q ?? "").trim().toLowerCase();
  const letter = (searchParams?.letter ?? "").trim().toUpperCase();
  const sort = searchParams?.sort === "desc" ? "desc" : "asc";

  if (sort === "desc") letters = [...letters].reverse();
  if (letter) letters = letters.filter((l) => l.toUpperCase() === letter);

  const filtered: Record<string, Item[]> = {};
  let total = 0;
  for (const l of letters) {
    let arr = groups[l];
    if (q) {
      arr = arr.filter((it) => it.judul.toLowerCase().includes(q));
    }
    if (sort === "desc") {
      arr = [...arr].sort((a, b) => b.judul.localeCompare(a.judul));
    } else {
      arr = [...arr].sort((a, b) => a.judul.localeCompare(b.judul));
    }
    if (arr.length) {
      filtered[l] = arr;
      total += arr.length;
    }
  }

  return (
    <div className="container-page space-y-6">
      <SectionHeader
        title="Daftar Anime A-Z"
        subtitle={`${total.toLocaleString("id-ID")} anime · telusuri, filter, dan urutkan`}
      />

      <form
        method="GET"
        action="/anime-list"
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-ink-900/60 p-3"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Cari judul…"
            className="w-full rounded-full border border-ink-800 bg-ink-950/60 pl-9 pr-3 py-2 text-sm text-ink-100 outline-none focus:border-fuchsia-500/70"
          />
        </div>
        <select
          name="letter"
          defaultValue={letter}
          className="rounded-full border border-ink-800 bg-ink-950/60 px-3 py-2 text-sm text-ink-100"
        >
          <option value="">Semua huruf</option>
          {Object.keys(groups)
            .sort((a, b) => (a === "#" ? -1 : a.localeCompare(b)))
            .map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="rounded-full border border-ink-800 bg-ink-950/60 px-3 py-2 text-sm text-ink-100"
        >
          <option value="asc">A → Z</option>
          <option value="desc">Z → A</option>
        </select>
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-2 text-sm font-bold text-white"
        >
          {sort === "desc" ? (
            <ArrowUpAZ className="h-4 w-4" />
          ) : (
            <ArrowDownAZ className="h-4 w-4" />
          )}
          Terapkan
        </button>
        {q || letter || sort !== "asc" ? (
          <Link
            href="/anime-list"
            className="rounded-full border border-white/10 bg-ink-950/60 px-3 py-2 text-xs text-ink-300 hover:text-white"
          >
            Reset
          </Link>
        ) : null}
      </form>

      {!letter ? (
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(groups)
            .sort((a, b) => (a === "#" ? -1 : a.localeCompare(b)))
            .map((l) => (
              <a key={l} href={`#letter-${l}`} className="chip hover:bg-ink-700/80">
                {l}
              </a>
            ))}
        </div>
      ) : null}

      {!total ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-ink-900/40 p-8 text-center text-sm text-ink-400">
          Tidak ada anime cocok dengan filter ini.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(filtered).map((letterKey) => (
            <section key={letterKey} id={`letter-${letterKey}`}>
              <h2 className="mb-3 text-xl font-bold">{letterKey}</h2>
              <ul className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filtered[letterKey].map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/anime/${encodeURIComponent(item.url)}`}
                      className="block truncate rounded px-2 py-1 text-sm text-ink-300 hover:bg-ink-800/60 hover:text-white"
                    >
                      {item.judul}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
