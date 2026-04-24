import { getAnimeList } from "@/lib/api";
import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";

export const revalidate = 3600;

export const metadata = {
  title: "Daftar Anime A-Z",
};

export default async function AnimeListPage() {
  let raw: Record<string, unknown>;
  try {
    raw = (await getAnimeList()) as Record<string, unknown>;
  } catch {
    raw = {};
  }
  const groups: Record<
    string,
    Array<{ id: string; judul: string; url: string }>
  > = {};
  for (const [k, v] of Object.entries(raw)) {
    if (Array.isArray(v)) {
      groups[k] = v as typeof groups[string];
    }
  }
  const letters = Object.keys(groups).sort((a, b) => {
    if (a === "#") return -1;
    if (b === "#") return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="container-page space-y-6">
      <SectionHeader
        title="Daftar Anime A-Z"
        subtitle="Telusuri berdasarkan huruf awal judul"
      />

      <div className="flex flex-wrap gap-1.5">
        {letters.map((l) => (
          <a
            key={l}
            href={`#letter-${l}`}
            className="chip hover:bg-ink-700/80"
          >
            {l}
          </a>
        ))}
      </div>

      <div className="space-y-8">
        {letters.map((letter) => (
          <section key={letter} id={`letter-${letter}`}>
            <h2 className="mb-3 text-xl font-bold">{letter}</h2>
            <ul className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {groups[letter].map((item) => (
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
    </div>
  );
}
