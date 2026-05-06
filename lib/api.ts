import type {
  AnimeCardItem,
  AnimeListResponse,
  DetailItem,
  DetailResponse,
  EpisodeItem,
  HomeResponse,
  JadwalEntry,
  JadwalResponse,
  OngoingItem,
  OngoingResponse,
  SearchResponse,
  StreamItem,
  StreamLink,
  StreamQuality,
  StreamResponse,
} from "./types";

// Sankavollerei is the new upstream after the previous host (api.sonzaix.indevs.in)
// went offline. Each scraping source lives under its own subpath, e.g.
// `/anime/animasu`, `/anime/otakudesu`, `/anime/samehadaku`. The default is
// configurable via `ANIME_API_BASE` so we can swap providers without redeploy.
export const API_BASE =
  process.env.ANIME_API_BASE ?? "https://www.sankavollerei.com/anime/animasu";

type FetchOpts = {
  revalidate?: number;
  cache?: RequestCache;
};

async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const revalidate = opts.revalidate ?? 300;
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    next: { revalidate },
    cache: opts.cache,
    headers: {
      accept: "application/json",
      "user-agent":
        "Mozilla/5.0 (compatible; AnimeIanBot/1.0; +https://animeian.vercel.app)",
    },
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // Some upstreams occasionally return malformed JSON; bubble it up so callers
    // can fall back to defaults.
    throw new Error(`API ${path} returned non-JSON payload`);
  }
}

// ---------- Helpers ----------

type SankaUnknown = Record<string, unknown>;

function asString(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return fallback;
}

function asArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function pick<T = unknown>(obj: SankaUnknown, ...keys: string[]): T | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v as T;
  }
  return undefined;
}

function lastSegment(s: string): string {
  if (!s) return s;
  const noProto = s.replace(/^https?:\/\/[^/]+/, "");
  const parts = noProto.split("/").filter(Boolean);
  return parts[parts.length - 1] || s;
}

function adaptGenres(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((g) => {
      if (typeof g === "string") return g;
      if (g && typeof g === "object") {
        const o = g as SankaUnknown;
        return asString(pick(o, "name", "title", "label", "genre"));
      }
      return "";
    })
    .filter(Boolean);
}

function adaptCard(s: SankaUnknown): AnimeCardItem {
  const rawSlug = asString(pick(s, "slug", "url", "endpoint", "link"));
  const slug = lastSegment(rawSlug) || rawSlug;
  return {
    id: slug || asString(pick(s, "id"), Math.random().toString(36).slice(2)),
    url: slug,
    judul: asString(pick(s, "title", "judul", "name")),
    cover: asString(pick(s, "poster", "image", "cover", "thumbnail")),
    lastch: asString(pick(s, "episode", "current_episode", "lastch")),
    lastup: asString(pick(s, "release_day", "releaseDate", "updated_on", "lastup")),
    type: asString(pick(s, "type")),
    score: asString(pick(s, "score", "rating")),
    status: asString(pick(s, "status")),
    sinopsis: asString(pick(s, "synopsis", "sinopsis")),
    studio: asString(pick(s, "studio", "studios")),
    rilis: asString(pick(s, "aired", "released", "rilis")),
    genre: adaptGenres(pick(s, "genres", "genre")),
  };
}

function adaptOngoing(s: SankaUnknown, idx: number): OngoingItem {
  const c = adaptCard(s);
  return {
    id: idx,
    url: c.url,
    judul: c.judul,
    cover: c.cover,
    lastch: c.lastch ?? "",
    lastup: c.lastup ?? "",
    type: c.type ?? "",
  };
}

function adaptEpisode(e: SankaUnknown, idx: number): EpisodeItem {
  const rawSlug = asString(pick(e, "slug", "url", "endpoint", "link"));
  const slug = lastSegment(rawSlug) || rawSlug;
  const name = asString(pick(e, "name", "title", "ep", "episode"));
  // Try to extract just the episode number for `ch`. The upstream usually sends
  // strings like "Episode 12" or "Ep. 12 Subtitle Indonesia".
  const m = name.match(/(?:ep(?:isode)?\.?\s*)?(\d+(?:\.\d+)?)/i);
  const ch = m ? m[1] : asString(pick(e, "episode_number", "number", "ch")) || name;
  return {
    id: idx,
    url: slug,
    ch: ch || String(idx + 1),
    date: asString(pick(e, "release_date", "date", "updated_on")),
  };
}

function adaptDetail(slug: string, payload: SankaUnknown): DetailItem | null {
  // Sankavollerei returns either { detail: {...} } or the detail directly. Be
  // defensive about both layouts.
  const detail =
    (payload.detail as SankaUnknown | undefined) ??
    (payload.data as SankaUnknown | undefined) ??
    payload;
  if (!detail || typeof detail !== "object") return null;

  const episodesRaw = asArray<SankaUnknown>(
    pick(detail, "episodes", "episode_list", "chapters", "chapter")
  );
  // Existing UI expects newest-first ordering. Some upstreams send oldest-first.
  let chapter = episodesRaw.map((e, i) => adaptEpisode(e, i));
  if (chapter.length >= 2) {
    const firstNum = Number(chapter[0].ch);
    const lastNum = Number(chapter[chapter.length - 1].ch);
    if (
      Number.isFinite(firstNum) &&
      Number.isFinite(lastNum) &&
      firstNum < lastNum
    ) {
      chapter = chapter.slice().reverse();
    }
  }

  return {
    id: 0,
    series_id: slug,
    cover: asString(pick(detail, "poster", "image", "cover")),
    judul: asString(pick(detail, "title", "judul", "name")),
    type: asString(pick(detail, "type")),
    status: asString(pick(detail, "status")),
    rating: asString(pick(detail, "score", "rating")),
    published: asString(pick(detail, "aired", "released", "publishedDate")),
    author: asString(pick(detail, "author", "studio", "studios")),
    genre: adaptGenres(pick(detail, "genres", "genre")),
    sinopsis: asString(pick(detail, "synopsis", "sinopsis", "description")),
    chapter,
  };
}

function adaptStream(payload: SankaUnknown): StreamItem | null {
  // Sankavollerei (animasu/samehadaku/otakudesu) returns embeddable iframe URLs
  // grouped under `streams` (sometimes `mirror`, `server`). We squeeze them into
  // the existing `StreamItem` shape by storing them under fake quality buckets
  // — the player detects iframes by URL and switches rendering mode.
  const rawStreams = asArray<SankaUnknown>(
    pick(payload, "streams", "stream", "mirror", "mirrors", "servers", "server")
  );
  if (!rawStreams.length) return null;

  // Bucket entries by inferred quality (default 720p when missing).
  const buckets: Record<StreamQuality, StreamLink[]> = {
    "360p": [],
    "480p": [],
    "720p": [],
    "1080p": [],
  };

  const inferQuality = (entry: SankaUnknown, name: string): StreamQuality => {
    const candidate = asString(
      pick(entry, "quality", "reso", "resolution", "size")
    ).toLowerCase();
    const tag = `${candidate} ${name}`.toLowerCase();
    if (tag.includes("1080")) return "1080p";
    if (tag.includes("720") || tag.includes("hd")) return "720p";
    if (tag.includes("480")) return "480p";
    if (tag.includes("360") || tag.includes("sd")) return "360p";
    return "720p";
  };

  rawStreams.forEach((entry, idx) => {
    const link = asString(pick(entry, "url", "link", "src", "embed"));
    if (!link) return;
    const name = asString(
      pick(entry, "name", "label", "server", "provider", "title")
    );
    const q = inferQuality(entry, name);
    buckets[q].push({
      link,
      provide: idx,
      id: idx,
      reso: q,
      size_kb: null,
    });
  });

  const reso = (Object.keys(buckets) as StreamQuality[]).filter(
    (q) => buckets[q].length > 0
  );
  if (!reso.length) return null;

  const resoSize: Record<StreamQuality, string | null> = {
    "360p": null,
    "480p": null,
    "720p": null,
    "1080p": null,
  };

  return {
    episode_id: 0,
    reso,
    streams: buckets,
    resoSize,
  };
}

// ---------- Public API ----------

export async function getHome(page = 1): Promise<HomeResponse> {
  // Sanka /home returns the same kind of mixed dashboard payload the old API
  // exposed at `/anime/home`. Fall back to /ongoing if /home shape is empty.
  try {
    const r = await apiFetch<SankaUnknown>(
      `/home${page > 1 ? `?page=${page}` : ""}`,
      { revalidate: 300 }
    );
    const list = asArray<SankaUnknown>(
      pick(r, "animes", "data", "results", "list")
    );
    if (list.length) return { data: list.map(adaptCard) };
    // Some providers nest under `ongoing` / `latest` arrays inside /home.
    const ongoing = asArray<SankaUnknown>(pick(r, "ongoing", "latest"));
    if (ongoing.length) return { data: ongoing.map(adaptCard) };
  } catch {
    /* fall through */
  }
  // Fallback: build a "home" page from /ongoing.
  const r = await apiFetch<SankaUnknown>(`/ongoing?page=${page}`, {
    revalidate: 300,
  });
  const list = asArray<SankaUnknown>(pick(r, "animes", "data"));
  return { data: list.map(adaptCard) };
}

export async function getHomePool(pages = 3): Promise<HomeResponse["data"]> {
  const results = await Promise.allSettled(
    Array.from({ length: pages }, (_, i) => getHome(i + 1))
  );
  const seen = new Set<string>();
  const out: HomeResponse["data"] = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const item of r.value.data ?? []) {
      if (!item?.url || seen.has(item.url)) continue;
      seen.add(item.url);
      out.push(item);
    }
  }
  return out;
}

export async function getOngoing(page = 1): Promise<OngoingResponse> {
  const path = page > 1 ? `/ongoing?page=${page}` : `/ongoing`;
  const r = await apiFetch<SankaUnknown>(path, { revalidate: 600 });
  const list = asArray<SankaUnknown>(pick(r, "animes", "data"));
  return { data: list.map((s, i) => adaptOngoing(s, i)) };
}

export async function getJadwal(): Promise<JadwalResponse> {
  // Sankavollerei exposes `/schedule` returning a list of days, each with an
  // `animes` array. Defensive over field names.
  try {
    const r = await apiFetch<SankaUnknown>(`/schedule`, { revalidate: 1800 });
    const days = asArray<SankaUnknown>(pick(r, "days", "schedule", "data", "animes"));
    const data: JadwalEntry[] = days.map((d) => {
      const animes = asArray<SankaUnknown>(pick(d, "animes", "list", "items"));
      return {
        day: asString(pick(d, "day", "name")),
        date: asString(pick(d, "date")),
        date_ts: 0,
        animeList: animes.map((a, i) => {
          const slug = lastSegment(asString(pick(a, "slug", "url", "endpoint")));
          return {
            anime_name: asString(pick(a, "title", "name", "anime_name")),
            id: i,
            link: slug,
            cover: asString(pick(a, "poster", "cover", "image")),
            time: asString(pick(a, "time")),
            score: asString(pick(a, "score", "rating")),
          };
        }),
      };
    });
    return { generatedAt: Date.now(), data };
  } catch {
    return { generatedAt: Date.now(), data: [] };
  }
}

// Tunable: how many pages to walk per letter when building the static A-Z
// catalog. Each upstream page is ~30 anime, so 2 pages ≈ 60 per letter (capped
// by the upstream `pagination.hasNext` flag). Kept small to keep the initial
// SSR HTML reasonable; the client-side "Lihat lebih banyak" button can pull
// further pages on demand via `getAnimeListLetter`.
const ANIME_LIST_MAX_PAGES_PER_LETTER = 2;
const ANIME_LIST_COMPLETED_MAX_PAGES_PER_LETTER = 4;

async function fetchLetterPage(letter: string, page: number) {
  return apiFetch<SankaUnknown>(
    `/animelist?letter=${letter}&page=${page}`,
    { revalidate: 3600 }
  );
}

function hasNextPage(payload: SankaUnknown): boolean {
  const pag = payload?.pagination as SankaUnknown | undefined;
  if (!pag || typeof pag !== "object") return false;
  return Boolean(pag.hasNext);
}

async function collectLetter(letter: string, maxPages: number) {
  const items: SankaUnknown[] = [];
  for (let page = 1; page <= maxPages; page++) {
    try {
      const payload = await fetchLetterPage(letter, page);
      const list = asArray<SankaUnknown>(pick(payload, "animes", "data"));
      if (!list.length) break;
      items.push(...list);
      if (!hasNextPage(payload)) break;
    } catch {
      break;
    }
  }
  return items;
}

export async function getAnimeList(): Promise<AnimeListResponse> {
  // Sankavollerei `/animelist?letter=A&page=1` returns `{animes: [...],
  // pagination: { hasNext, ... }}`. We walk pages per letter until hasNext is
  // false (or hit the safety cap) and dedupe by slug to build a much fuller
  // A-Z catalog than the previous "page 1 only" implementation.
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const responses = await Promise.allSettled(
    letters.map((l) => collectLetter(l, ANIME_LIST_MAX_PAGES_PER_LETTER))
  );
  const out: AnimeListResponse = {};
  responses.forEach((r, i) => {
    const letter = letters[i];
    if (r.status !== "fulfilled") {
      out[letter] = [];
      return;
    }
    const seen = new Set<string>();
    const merged: AnimeListResponse[string] = [];
    for (const s of r.value) {
      const c = adaptCard(s);
      if (!c.url || seen.has(c.url)) continue;
      seen.add(c.url);
      merged.push({
        id: c.id != null ? String(c.id) : c.url,
        judul: c.judul,
        url: c.url,
        cover: c.cover,
      });
    }
    out[letter] = merged;
  });
  return out;
}

export async function getAnimeListLetter(
  letter: string,
  page: number
): Promise<{ items: AnimeCardItem[]; hasNext: boolean }> {
  // Single-letter / single-page fetch used by the client-side "Lihat lebih
  // banyak" button on the anime list page. Returns adapted cards plus the
  // upstream `hasNext` flag so the UI knows when to stop paging.
  try {
    const payload = await fetchLetterPage(letter, page);
    const list = asArray<SankaUnknown>(pick(payload, "animes", "data"));
    return {
      items: list.map(adaptCard),
      hasNext: hasNextPage(payload),
    };
  } catch {
    return { items: [], hasNext: false };
  }
}

export async function getCompletedPage(page: number): Promise<{
  items: AnimeCardItem[];
  hasMore: boolean;
}> {
  // Completed/finished anime: we walk the full alphabetical catalog and
  // filter to status == "Selesai". Each "page" of our infinite scroll maps to
  // one upstream letter page, but we batch a small number of letters per
  // call to keep payloads chunky enough that scrolling feels productive.
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const LETTERS_PER_PAGE = 2;
  const startIdx = (page - 1) * LETTERS_PER_PAGE;
  const slice = letters.slice(startIdx, startIdx + LETTERS_PER_PAGE);
  if (!slice.length) return { items: [], hasMore: false };
  const responses = await Promise.allSettled(
    slice.map((l) => collectLetter(l, ANIME_LIST_COMPLETED_MAX_PAGES_PER_LETTER))
  );
  const seen = new Set<string>();
  const items: AnimeCardItem[] = [];
  for (const r of responses) {
    if (r.status !== "fulfilled") continue;
    for (const raw of r.value) {
      const c = adaptCard(raw);
      const status = (c.status ?? "").toLowerCase();
      if (!status.includes("selesai") && !status.includes("complet")) continue;
      if (!c.url || seen.has(c.url)) continue;
      seen.add(c.url);
      items.push(c);
    }
  }
  return {
    items,
    hasMore: startIdx + LETTERS_PER_PAGE < letters.length,
  };
}

export async function getDetail(series: string): Promise<DetailResponse> {
  const r = await apiFetch<SankaUnknown>(
    `/detail/${encodeURIComponent(series)}`,
    { revalidate: 600 }
  );
  const detail = adaptDetail(series, r);
  return { data: detail ? [detail] : [] };
}

export async function getStream(params: {
  slug: string;
  series?: string;
  episode?: number;
}): Promise<StreamResponse> {
  const r = await apiFetch<SankaUnknown>(
    `/episode/${encodeURIComponent(params.slug)}`,
    { revalidate: 60 }
  );
  const stream = adaptStream(r);
  return { data: stream ? [stream] : [] };
}

export async function search(query: string, page = 1): Promise<SearchResponse> {
  // Sankavollerei animasu uses `/search/${query}` (no pagination param), other
  // providers use `/search?q=${query}&page=${page}`. We try query-string first
  // then fall back to path style.
  let payload: SankaUnknown | null = null;
  try {
    payload = await apiFetch<SankaUnknown>(
      `/search?q=${encodeURIComponent(query)}&page=${page}`,
      { revalidate: 120 }
    );
  } catch {
    /* try path style */
  }
  if (!payload) {
    payload = await apiFetch<SankaUnknown>(
      `/search/${encodeURIComponent(query)}`,
      { revalidate: 120 }
    );
  }
  const list = asArray<SankaUnknown>(pick(payload, "animes", "data", "results"));
  const result = list.map(adaptCard);
  return { data: [{ jumlah: result.length, result }] };
}
// trigger redeploy after sankavollerei whitelist 1777815959
