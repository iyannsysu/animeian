"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";

type Suggest = { id: string; judul: string; url: string; cover?: string };
type ShowcaseItem = { slug: string; title: string; cover: string };

type Props = {
  initial: ShowcaseItem[];
};

export default function ShowcaseEditor({ initial }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ShowcaseItem[]>(initial);
  const [q, setQ] = useState("");
  const [suggests, setSuggests] = useState<Suggest[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const debRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    if (debRef.current) window.clearTimeout(debRef.current);
    if (q.trim().length < 2) {
      setSuggests([]);
      return;
    }
    debRef.current = window.setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(q.trim())}`,
          { cache: "no-store" }
        );
        const d = (await r.json()) as { items?: Suggest[] };
        setSuggests(d.items ?? []);
      } catch {
        /* noop */
      }
    }, 200);
    return () => {
      if (debRef.current) window.clearTimeout(debRef.current);
    };
  }, [q, open]);

  function add(s: Suggest) {
    if (items.length >= 3) return;
    if (items.some((it) => it.slug === s.url)) return;
    setItems((prev) => [
      ...prev,
      { slug: s.url, title: s.judul, cover: s.cover ?? "" },
    ]);
    setQ("");
    setSuggests([]);
  }

  function remove(slug: string) {
    setItems((prev) => prev.filter((it) => it.slug !== slug));
  }

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const payload = items.slice(0, 3);
      const r = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          showcase: payload.length > 0 ? payload : null,
          resetShowcase: payload.length === 0,
        }),
      });
      const d = (await r.json()) as { ok: boolean; reason?: string };
      if (!r.ok || !d.ok) {
        setErr(`Gagal: ${d.reason ?? r.status}`);
      } else {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setErr("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-ink-900/40 p-4 sm:p-6">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-black tracking-tight">
          ⭐ Showcase Anime Favorit
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-200 hover:border-indigo-400/70"
        >
          {open ? (
            <>
              <X className="h-3 w-3" /> Tutup
            </>
          ) : (
            <>
              <Pencil className="h-3 w-3" /> Edit
            </>
          )}
        </button>
      </header>

      {!open ? (
        items.length === 0 ? (
          <p className="mt-3 text-xs text-ink-400">
            Belum ada anime favorit. Klik Edit untuk menambahkan hingga 3 anime
            yang akan ditampilkan di profile.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            {items.map((it) => (
              <Link
                key={it.slug}
                href={`/anime/${encodeURIComponent(it.slug)}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-ink-950/60 transition hover:border-indigo-400/60"
              >
                {it.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.cover}
                    alt={it.title}
                    className="aspect-[2/3] w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="aspect-[2/3] w-full bg-ink-800" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                  <p className="line-clamp-2 text-[11px] font-bold text-white">
                    {it.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-[11px] text-ink-400">
            Pilih hingga 3 anime favorit. Akan tampil di profile sebagai card.
          </p>
          {items.length > 0 ? (
            <ul className="space-y-1.5">
              {items.map((it) => (
                <li
                  key={it.slug}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-950/60 p-2"
                >
                  {it.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.cover}
                      alt=""
                      className="h-10 w-7 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-7 rounded bg-ink-800" />
                  )}
                  <span className="flex-1 truncate text-xs font-semibold">
                    {it.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(it.slug)}
                    className="grid h-7 w-7 place-items-center rounded-full text-rose-300 hover:bg-rose-500/10"
                    aria-label="Hapus"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {items.length < 3 ? (
            <div className="relative">
              <label className="flex items-center gap-2 rounded-xl border border-ink-800 bg-ink-950/60 px-3 py-2">
                <Search className="h-3.5 w-3.5 text-ink-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari anime untuk ditambahkan…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-ink-500"
                />
              </label>
              {suggests.length > 0 ? (
                <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-ink-950/95 p-1 shadow-2xl">
                  {suggests.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => add(s)}
                        disabled={items.length >= 3}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-ink-200 hover:bg-indigo-500/15 hover:text-white disabled:opacity-40"
                      >
                        {s.cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.cover}
                            alt=""
                            className="h-8 w-6 rounded object-cover"
                          />
                        ) : (
                          <span className="h-8 w-6 rounded bg-ink-800" />
                        )}
                        <span className="flex-1 truncate font-semibold">
                          {s.judul}
                        </span>
                        <Plus className="h-3.5 w-3.5 text-indigo-300" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="text-[11px] text-amber-300">
              Maksimal 3 anime — hapus salah satu untuk tambah baru.
            </p>
          )}
          {err ? <p className="text-[12px] text-rose-300">{err}</p> : null}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Simpan
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
