import { search } from "@/lib/api";
import AnimeGrid from "@/components/AnimeGrid";
import SectionHeader from "@/components/SectionHeader";
import SearchForm from "./SearchForm";
import type { AnimeCardItem } from "@/lib/types";

export const revalidate = 120;

type SP = { q?: string; page?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SP;
}) {
  const q = (searchParams.q || "").trim();
  return {
    title: q ? `Cari: ${q}` : "Cari Anime",
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const q = (searchParams.q || "").trim();
  const page = Number(searchParams.page || "1");

  let items: AnimeCardItem[] = [];
  let total = 0;
  let err: string | null = null;
  if (q) {
    try {
      const res = await search(q, page);
      items = res.data?.[0]?.result ?? [];
      total = res.data?.[0]?.jumlah ?? items.length;
    } catch (e) {
      err = e instanceof Error ? e.message : "Gagal mencari.";
    }
  }

  return (
    <div className="container-page space-y-6">
      <SectionHeader
        title="Cari Anime"
        subtitle="Ketik judul anime yang kamu cari"
      />
      <SearchForm initial={q} />

      {err ? (
        <p className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
          {err}
        </p>
      ) : null}

      {q ? (
        <section>
          <p className="mb-3 text-sm text-ink-400">
            {total} hasil untuk <span className="text-ink-100">“{q}”</span>
          </p>
          <AnimeGrid items={items} />
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-ink-800 p-10 text-center text-sm text-ink-400">
          Masukkan kata kunci untuk mulai mencari.
        </p>
      )}
    </div>
  );
}
