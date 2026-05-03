// Client-side history module.
// Stores recent watch activity in localStorage; syncs to server (if signed in).

export type HistoryEntry = {
  series: string; // series_id (as stored in URL)
  slug: string; // episode url slug
  title: string;
  episode: string;
  cover: string;
  progress: number; // seconds
  duration: number; // seconds
  updatedAt: number; // Date.now()
};

const KEY = "animeian:history:v1";
const MAX = 60;

function readLocal(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeLocal(list: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* noop */
  }
}

export function getHistory(): HistoryEntry[] {
  return readLocal().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getHistoryFor(
  series: string,
  slug: string
): HistoryEntry | null {
  return readLocal().find((e) => e.series === series && e.slug === slug) ?? null;
}

export function removeHistory(series: string, slug: string) {
  writeLocal(
    readLocal().filter((e) => !(e.series === series && e.slug === slug))
  );
  void fetch(
    `/api/history?series=${encodeURIComponent(series)}&slug=${encodeURIComponent(
      slug
    )}`,
    { method: "DELETE" }
  ).catch(() => {});
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  void fetch("/api/history", { method: "DELETE" }).catch(() => {});
}

export function saveHistory(entry: HistoryEntry) {
  const list = readLocal();
  const i = list.findIndex(
    (e) => e.series === entry.series && e.slug === entry.slug
  );
  if (i >= 0) list[i] = entry;
  else list.unshift(entry);
  list.sort((a, b) => b.updatedAt - a.updatedAt);
  writeLocal(list);

  // best-effort server sync; swallow errors (guest / no KV)
  void fetch("/api/history", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(entry),
  }).catch(() => {});
}

export async function fetchServerHistory(): Promise<HistoryEntry[]> {
  try {
    const res = await fetch("/api/history", { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: HistoryEntry[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

export async function mergeServerHistory(): Promise<HistoryEntry[]> {
  const server = await fetchServerHistory();
  const local = readLocal();
  const map = new Map<string, HistoryEntry>();
  for (const e of [...server, ...local]) {
    const key = `${e.series}::${e.slug}`;
    const prev = map.get(key);
    if (!prev || e.updatedAt > prev.updatedAt) map.set(key, e);
  }
  const merged = Array.from(map.values()).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
  writeLocal(merged);
  return merged;
}
