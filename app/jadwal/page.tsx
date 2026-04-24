import { getJadwal } from "@/lib/api";
import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";

export const revalidate = 1800;

export const metadata = {
  title: "Jadwal Rilis",
};

export default async function JadwalPage() {
  let data: Awaited<ReturnType<typeof getJadwal>>["data"];
  try {
    data = (await getJadwal()).data;
  } catch {
    data = [];
  }

  return (
    <div className="container-page space-y-6">
      <SectionHeader
        title="Jadwal Rilis"
        subtitle="Rilis anime per hari dalam seminggu"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((day) => (
          <div
            key={day.day + day.date}
            className="rounded-xl border border-ink-800/70 bg-ink-900/40"
          >
            <div className="flex items-baseline justify-between border-b border-ink-800/60 px-4 py-3">
              <h3 className="text-base font-bold">{day.day}</h3>
              <span className="text-xs text-ink-400">{day.date}</span>
            </div>
            <ul className="divide-y divide-ink-800/50">
              {day.animeList?.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/anime/${encodeURIComponent(a.link)}`}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-ink-800/50"
                  >
                    <img
                      src={a.cover}
                      alt=""
                      loading="lazy"
                      className="h-12 w-9 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink-100">
                        {a.anime_name}
                      </p>
                      <p className="text-[11px] text-ink-400">
                        {a.time || "—"}
                      </p>
                    </div>
                    {a.score ? (
                      <span className="chip shrink-0">★ {a.score}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
