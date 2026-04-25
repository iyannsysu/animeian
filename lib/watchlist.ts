// Helper sisi-klien untuk watchlist.
// Logika: kalau login, sync ke /api/watchlist (KV).
// Kalau guest, simpan di localStorage. Bisa baca tanpa login.

export type WatchlistItem = {
  series: string; // series id (slug)
  title: string;
  cover: string;
  type?: string;
  addedAt: number;
};

const KEY = "animeian:watchlist";

export function readLocal(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as WatchlistItem[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function writeLocal(items: WatchlistItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* noop */
  }
}

export function localHas(series: string) {
  return readLocal().some((it) => it.series === series);
}

export function localAdd(item: WatchlistItem) {
  const cur = readLocal();
  if (cur.some((it) => it.series === item.series)) return cur;
  const next = [{ ...item, addedAt: Date.now() }, ...cur];
  writeLocal(next);
  return next;
}

export function localRemove(series: string) {
  const next = readLocal().filter((it) => it.series !== series);
  writeLocal(next);
  return next;
}
