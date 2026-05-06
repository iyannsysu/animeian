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

// Sankavollerei is the upstream after the previous host (api.sonzaix.indevs.in)
// went offline. Each scraping source lives under its own subpath, e.g.
// `/anime/animasu`, `/anime/samehadaku`, `/anime/otakudesu`. The default is
// configurable via `ANIME_API_BASE` so we can swap providers without redeploy.
export const API_BASE =
  process.env.ANIME_API_BASE ?? "https://www.sankavollerei.com/anime/samehadaku";

// Sub-provider name extracted from API_BASE ("samehadaku", "animasu", ...).
// Drives endpoint-path differences: e.g. samehadaku uses `/anime/{slug}` for
// detail, animasu uses `/detail/{slug}`; samehadaku has `/completed` directly,
// animasu only has per-letter `/animelist?letter=…&page=…`.
export const PROVIDER: string = (() => {
  const m = API_BASE.match(/\/anime\/([^/?#]+)/);
  return (m?.[1] ?? "animasu").toLowerCase();
})();

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

function humanizeSlug(s: string): string {
  if (!s) return s;
  return s
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Samehadaku/otakudesu wrap responses as { status, creator, message, data, pagination }.
// Unwrap to whatever the actual payload object is so downstream pickers don't
// need to know the envelope.
function unwrap(r: SankaUnknown): SankaUnknown {
  if (r && typeof r === "object" && "data" in r) {
    const d = (r as { data?: unknown }).data;
    if (d && typeof d === "object" && !Array.isArray(d)) {
      return d as SankaUnknown;
    }
  }
  return r;
}

// Pull a list of cards from a response, regardless of which provider/key wraps it.
function extractList(
  r: SankaUnknown,
  ...preferredKeys: string[]
): SankaUnknown[] {
  const data = unwrap(r);
  // Samehadaku /home has nested sections each with their own animeList.
  for (const k of [...preferredKeys, "animeList", "animes", "results", "list", "batchList"]) {
    const v = (data as SankaUnknown)[k];
    if (Array.isArray(v)) return v as SankaUnknown[];
    if (v && typeof v === "object" && Array.isArray((v as SankaUnknown).animeList)) {
      return (v as SankaUnknown).animeList as SankaUnknown[];
    }
  }
  // Animasu sometimes returns sections at the top level (not wrapped in `data`).
  for (const k of ["ongoing", "complete", "completed", "popular", "recent", "movies", "batch", "latest"]) {
    const v = (r as SankaUnknown)[k];
    if (Array.isArray(v)) return v as SankaUnknown[];
    if (v && typeof v === "object" && Array.isArray((v as SankaUnknown).animeList)) {
      return (v as SankaUnknown).animeList as SankaUnknown[];
    }
  }
  return [];
}

function hasNextPage(payload: SankaUnknown): boolean {
  const pag = (payload as SankaUnknown)?.pagination as SankaUnknown | undefined;
  if (pag && typeof pag === "object") {
    if (typeof pag.hasNext === "boolean") return pag.hasNext;
    const cur = Number(pick(pag, "currentPage", "page", "current"));
    const total = Number(pick(pag, "totalPages", "lastPage", "total"));
    if (Number.isFinite(cur) && Number.isFinite(total) && total > 0) {
      return cur < total;
    }
  }
  return false;
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
  // Samehadaku exposes `animeId` as the canonical slug; it also returns `href`
  // like `/samehadaku/anime/<slug>`. Animasu uses `slug`. Pick whichever exists.
  const animeId = asString(pick(s, "animeId", "anime_id"));
  const rawSlug =
    animeId ||
    asString(pick(s, "slug", "url", "endpoint", "link", "href"));
  const slug = lastSegment(rawSlug) || rawSlug;
  // Score can be a flat string (animasu) or `{value, users}` (samehadaku).
  let score = asString(pick(s, "score", "rating"));
  if (!score) {
    const sc = (s as SankaUnknown).score as SankaUnknown | undefined;
    if (sc && typeof sc === "object") {
      score = asString(pick(sc, "value", "score"));
    }
  }
  return {
    id: slug || asString(pick(s, "id"), Math.random().toString(36).slice(2)),
    url: slug,
    judul: asString(pick(s, "title", "judul", "name")),
    cover: asString(pick(s, "poster", "image", "cover", "thumbnail")),
    lastch: asString(
      pick(s, "episodes", "episode", "current_episode", "lastch")
    ),
    lastup: asString(
      pick(
        s,
        "releasedOn",
        "release_day",
        "releaseDate",
        "updated_on",
        "lastup",
        "status_or_day"
      )
    ),
    type: asString(pick(s, "type")),
    score,
    status: asString(pick(s, "status")),
    sinopsis: asString(pick(s, "synopsis", "sinopsis")),
    studio: asString(pick(s, "studio", "studios")),
    rilis: asString(pick(s, "aired", "released", "rilis")),
    genre: adaptGenres(pick(s, "genreList", "genres", "genre")),
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
  // Samehadaku uses `episodeId` (`hidarikiki-no-eren-episode-5`) and `href`
  // (`/samehadaku/episode/<episodeId>`); animasu uses `slug`/`url`.
  const episodeId = asString(pick(e, "episodeId", "episode_id"));
  const rawSlug =
    episodeId ||
    asString(pick(e, "slug", "url", "endpoint", "link", "href"));
  const slug = lastSegment(rawSlug) || rawSlug;
  // Title may be a number (samehadaku sends `"title": 5`) or a string.
  const titleRaw = pick(e, "title", "name", "ep", "episode");
  const titleStr =
    typeof titleRaw === "number" ? String(titleRaw) : asString(titleRaw);
  // Try to extract just the episode number for `ch`. Animasu sends
  // strings like "Episode 12" or "Ep. 12 Subtitle Indonesia".
  const m = titleStr.match(/(?:ep(?:isode)?\.?\s*)?(\d+(?:\.\d+)?)/i);
  const ch =
    (m ? m[1] : asString(pick(e, "episode_number", "number", "ch"))) ||
    titleStr;
  return {
    id: idx,
    url: slug,
    ch: ch || String(idx + 1),
    date: asString(pick(e, "releasedOn", "release_date", "date", "updated_on")),
  };
}

function adaptDetail(slug: string, payload: SankaUnknown): DetailItem | null {
  // Sankavollerei returns either { detail: {...} } (legacy), or { data: {...} }
  // (samehadaku/otakudesu), or the detail directly (animasu).
  const detail =
    (payload.detail as SankaUnknown | undefined) ??
    (payload.data as SankaUnknown | undefined) ??
    payload;
  if (!detail || typeof detail !== "object") return null;

  const episodesRaw = asArray<SankaUnknown>(
    pick(detail, "episodeList", "episodes", "episode_list", "chapters", "chapter")
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

  // Samehadaku returns `score: { value, users }` and animasu returns flat string.
  let rating = asString(pick(detail, "score", "rating"));
  if (!rating) {
    const sc = (detail as SankaUnknown).score as SankaUnknown | undefined;
    if (sc && typeof sc === "object") {
      rating = asString(pick(sc, "value", "score"));
    }
  }

  // Samehadaku nests synopsis under { paragraphs: [...], connections: [...] }.
  let sinopsis = asString(pick(detail, "synopsis", "sinopsis", "description"));
  if (!sinopsis) {
    const syn = (detail as SankaUnknown).synopsis as SankaUnknown | undefined;
    if (syn && typeof syn === "object") {
      const paras = asArray<unknown>(pick(syn, "paragraphs"));
      sinopsis = paras
        .map((p) => (typeof p === "string" ? p : asString(p as unknown)))
        .filter(Boolean)
        .join("\n\n");
    }
  }

  // Samehadaku detail often has `title: ""` — fall back to english/japanese/slug.
  let judul = asString(pick(detail, "title", "judul", "name"));
  if (!judul) judul = asString(pick(detail, "english", "japanese", "synonyms"));
  if (!judul) judul = humanizeSlug(slug);

  return {
    id: 0,
    series_id: slug,
    cover: asString(pick(detail, "poster", "image", "cover")),
    judul,
    type: asString(pick(detail, "type")),
    status: asString(pick(detail, "status")),
    rating,
    published: asString(pick(detail, "aired", "released", "publishedDate")),
    author: asString(pick(detail, "studios", "studio", "author")),
    genre: adaptGenres(pick(detail, "genreList", "genres", "genre")),
    sinopsis,
    chapter,
  };
}

function inferQuality(entry: SankaUnknown, name: string): StreamQuality {
  const candidate = asString(
    pick(entry, "quality", "reso", "resolution", "size", "title")
  ).toLowerCase();
  const tag = `${candidate} ${name}`.toLowerCase();
  if (tag.includes("1080") || tag.includes("fullhd")) return "1080p";
  if (tag.includes("720") || tag.includes("hd")) return "720p";
  if (tag.includes("480")) return "480p";
  if (tag.includes("360") || tag.includes("sd")) return "360p";
  return "720p";
}

function adaptStream(payload: SankaUnknown): StreamItem | null {
  // Two upstream shapes:
  //   - Animasu: top-level `streams` / `mirror` / `servers` array of
  //     `{url, quality, name}`. Each entry IS a playable iframe URL.
  //   - Samehadaku: { defaultStreamingUrl, server.qualities[].serverList[],
  //     downloadUrl.formats[].qualities[].urls[] }. Only `defaultStreamingUrl`
  //     is directly playable without an extra `/server/{id}` resolve call;
  //     entries under `downloadUrl` are file-host pages (Gofile/Pixeldrain/...)
  //     for downloading, NOT for streaming.
  //
  // We keep streaming and download URLs in *separate* buckets so that
  // VideoPlayer never accidentally picks a Gofile/Pixeldrain link as the
  // active iframe (which is what was breaking samehadaku playback).
  const data = unwrap(payload);

  const streamBuckets: Record<StreamQuality, StreamLink[]> = {
    "360p": [],
    "480p": [],
    "720p": [],
    "1080p": [],
  };
  const downloadBuckets: Record<StreamQuality, StreamLink[]> = {
    "360p": [],
    "480p": [],
    "720p": [],
    "1080p": [],
  };

  let provideId = 0;
  const pushTo = (
    target: Record<StreamQuality, StreamLink[]>,
    q: StreamQuality,
    link: string
  ) => {
    if (!link) return;
    target[q].push({
      link,
      provide: provideId,
      id: provideId,
      reso: q,
      size_kb: null,
    });
    provideId++;
  };

  // Path A: animasu-style flat streams array (each entry is a playable embed).
  const rawStreams = asArray<SankaUnknown>(
    pick(data, "streams", "stream", "mirror", "mirrors", "servers")
  );
  rawStreams.forEach((entry) => {
    const link = asString(pick(entry, "url", "link", "src", "embed"));
    if (!link) return;
    const name = asString(
      pick(entry, "name", "label", "server", "provider", "title")
    );
    pushTo(streamBuckets, inferQuality(entry, name), link);
  });

  // Path B: samehadaku-style defaultStreamingUrl (the only playable iframe we
  // can use without an extra `/server/{id}` resolve round-trip).
  const defaultUrl = asString(
    pick(data, "defaultStreamingUrl", "default_streaming_url")
  );
  if (defaultUrl) {
    pushTo(streamBuckets, "720p", defaultUrl);
  }

  // Path B (cont.): downloadUrl.formats[].qualities[].urls[] — these are
  // file-host pages, NOT players. Bucket them into `downloadBuckets` so
  // DownloadSection can render them, but keep them out of the player.
  const dl = (data.downloadUrl ?? data.download_url ?? data.download) as
    | SankaUnknown
    | undefined;
  if (dl && typeof dl === "object") {
    const formats = asArray<SankaUnknown>(pick(dl, "formats", "data"));
    formats.forEach((fmt) => {
      const qualities = asArray<SankaUnknown>(pick(fmt, "qualities", "list"));
      qualities.forEach((qe) => {
        const qLabel = asString(pick(qe, "title", "name", "quality"));
        const q = inferQuality(qe, qLabel);
        const urls = asArray<SankaUnknown>(pick(qe, "urls", "links"));
        urls.forEach((u) => {
          const link = asString(pick(u, "url", "link", "href"));
          pushTo(downloadBuckets, q, link);
        });
      });
    });
  }

  const reso = (Object.keys(streamBuckets) as StreamQuality[]).filter(
    (q) => streamBuckets[q].length > 0
  );
  // If we have download mirrors but no streams, surface the downloads anyway —
  // user can at least open the file-host page manually.
  const downloadReso = (Object.keys(downloadBuckets) as StreamQuality[]).filter(
    (q) => downloadBuckets[q].length > 0
  );
  if (!reso.length && !downloadReso.length) return null;

  const resoSize: Record<StreamQuality, string | null> = {
    "360p": null,
    "480p": null,
    "720p": null,
    "1080p": null,
  };

  return {
    episode_id: 0,
    reso: reso.length ? reso : downloadReso,
    streams: streamBuckets,
    downloads: downloadBuckets,
    resoSize,
  };
}

// ---------- Public API ----------

export async function getHome(page = 1): Promise<HomeResponse> {
  // Samehadaku /home returns nested sections (recent, popular, batch, movie).
  // We use `recent.animeList` for the homepage feed. Animasu /home returns a
  // flat `animes`/`data` array. extractList() handles both.
  try {
    const r = await apiFetch<SankaUnknown>(
      `/home${page > 1 ? `?page=${page}` : ""}`,
      { revalidate: 300 }
    );
    const list = extractList(r, "recent", "ongoing", "latest");
    if (list.length) return { data: list.map(adaptCard) };
  } catch {
    /* fall through */
  }
  // Fallback: build a "home" page from /ongoing or /recent.
  try {
    const r = await apiFetch<SankaUnknown>(`/ongoing?page=${page}`, {
      revalidate: 300,
    });
    const list = extractList(r);
    return { data: list.map(adaptCard) };
  } catch {
    return { data: [] };
  }
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
  try {
    const r = await apiFetch<SankaUnknown>(path, { revalidate: 600 });
    const list = extractList(r);
    return { data: list.map((s, i) => adaptOngoing(s, i)) };
  } catch {
    return { data: [] };
  }
}

export async function getJadwal(): Promise<JadwalResponse> {
  // Sankavollerei exposes `/schedule` with shape:
  //   samehadaku: { data: { days: [{ day, animeList: [...] }] } }
  //   animasu:    { schedule: [...] } / top-level `days`.
  try {
    const r = await apiFetch<SankaUnknown>(`/schedule`, { revalidate: 1800 });
    const root = unwrap(r);
    const days = asArray<SankaUnknown>(pick(root, "days", "schedule", "animes"));
    const data: JadwalEntry[] = days.map((d) => {
      const animes = asArray<SankaUnknown>(
        pick(d, "animeList", "animes", "list", "items")
      );
      return {
        day: asString(pick(d, "day", "name")),
        date: asString(pick(d, "date")),
        date_ts: 0,
        animeList: animes.map((a, i) => {
          const animeId = asString(pick(a, "animeId", "anime_id"));
          const rawSlug =
            animeId ||
            asString(pick(a, "slug", "url", "endpoint", "href"));
          const slug = lastSegment(rawSlug) || rawSlug;
          let score = asString(pick(a, "score", "rating"));
          if (!score) {
            const sc = (a as SankaUnknown).score as SankaUnknown | undefined;
            if (sc && typeof sc === "object") {
              score = asString(pick(sc, "value", "score"));
            }
          }
          return {
            anime_name: asString(pick(a, "title", "name", "anime_name")),
            id: i,
            link: slug,
            cover: asString(pick(a, "poster", "cover", "image")),
            time: asString(pick(a, "time", "releasedOn")),
            score,
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

async function collectLetter(letter: string, maxPages: number) {
  const items: SankaUnknown[] = [];
  for (let page = 1; page <= maxPages; page++) {
    try {
      const payload = await fetchLetterPage(letter, page);
      const list = extractList(payload);
      if (!list.length) break;
      items.push(...list);
      if (!hasNextPage(payload)) break;
    } catch {
      break;
    }
  }
  return items;
}

// Number of /completed pages to walk when building the samehadaku A-Z fallback.
// Each page ≈ 30 anime; 8 pages ≈ 240 anime grouped by first letter for SSR.
const SAMEHADAKU_AZ_PAGES = 8;

async function buildAzFromCompleted(
  pages: number
): Promise<AnimeListResponse> {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const out: AnimeListResponse = {};
  letters.forEach((l) => (out[l] = []));
  const responses = await Promise.allSettled(
    Array.from({ length: pages }, (_, i) =>
      apiFetch<SankaUnknown>(`/completed?page=${i + 1}`, { revalidate: 3600 })
    )
  );
  const seen = new Set<string>();
  for (const r of responses) {
    if (r.status !== "fulfilled") continue;
    for (const raw of extractList(r.value)) {
      const c = adaptCard(raw);
      if (!c.url || seen.has(c.url)) continue;
      seen.add(c.url);
      const first = (c.judul || c.url).charAt(0).toUpperCase();
      const bucket = /^[A-Z]$/.test(first) ? first : "#";
      if (!out[bucket]) out[bucket] = [];
      out[bucket].push({
        id: c.id != null ? String(c.id) : c.url,
        judul: c.judul,
        url: c.url,
        cover: c.cover,
      });
    }
  }
  return out;
}

export async function getAnimeList(): Promise<AnimeListResponse> {
  if (PROVIDER === "samehadaku") {
    // Samehadaku has no `/animelist?letter=X&page=N` endpoint. Build an A-Z
    // catalog by walking `/completed` pages and bucketing by first letter.
    return buildAzFromCompleted(SAMEHADAKU_AZ_PAGES);
  }
  // Animasu: `/animelist?letter=A&page=1` returns `{animes: [...],
  // pagination: { hasNext, ... }}`. Walk pages per letter until hasNext is
  // false (or hit the safety cap) and dedupe by slug.
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
  if (PROVIDER === "samehadaku") {
    // Walk /completed pages and filter to entries whose title starts with
    // `letter`. Each click of "Lihat lebih banyak {letter}" fetches the next
    // upstream completed page and surfaces only matches.
    try {
      const r = await apiFetch<SankaUnknown>(`/completed?page=${page}`, {
        revalidate: 3600,
      });
      const list = extractList(r);
      const items = list
        .map(adaptCard)
        .filter(
          (c) =>
            (c.judul || c.url).charAt(0).toUpperCase() === letter.toUpperCase()
        );
      return { items, hasNext: hasNextPage(r) || list.length > 0 };
    } catch {
      return { items: [], hasNext: false };
    }
  }
  // Single-letter / single-page fetch (animasu). Returns adapted cards plus the
  // upstream `hasNext` flag so the UI knows when to stop paging.
  try {
    const payload = await fetchLetterPage(letter, page);
    const list = extractList(payload);
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
  if (PROVIDER === "samehadaku") {
    // Samehadaku exposes `/completed?page=N` directly with ~30 anime per page.
    try {
      const r = await apiFetch<SankaUnknown>(`/completed?page=${page}`, {
        revalidate: 1800,
      });
      const list = extractList(r);
      const items = list.map(adaptCard).filter((c) => Boolean(c.url));
      // hasMore: trust pagination flag if present; otherwise, presence of items
      // implies there may be more (page < known total).
      return {
        items,
        hasMore: hasNextPage(r) || (items.length > 0 && items.length >= 24),
      };
    } catch {
      return { items: [], hasMore: false };
    }
  }
  // Animasu fallback: walk the full alphabetical catalog and filter to
  // status == "Selesai". Each infinite-scroll page maps to a slice of letters.
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
  // samehadaku uses `/anime/{slug}`; animasu uses `/detail/{slug}`. Try the
  // provider-preferred route first, then fall back to the other.
  const enc = encodeURIComponent(series);
  const candidates =
    PROVIDER === "samehadaku"
      ? [`/anime/${enc}`, `/detail/${enc}`]
      : [`/detail/${enc}`, `/anime/${enc}`];
  for (const path of candidates) {
    try {
      const r = await apiFetch<SankaUnknown>(path, { revalidate: 600 });
      const detail = adaptDetail(series, r);
      if (detail) return { data: [detail] };
    } catch {
      /* try next */
    }
  }
  return { data: [] };
}

export async function getStream(params: {
  slug: string;
  series?: string;
  episode?: number;
}): Promise<StreamResponse> {
  try {
    const r = await apiFetch<SankaUnknown>(
      `/episode/${encodeURIComponent(params.slug)}`,
      { revalidate: 60 }
    );
    const stream = adaptStream(r);
    return { data: stream ? [stream] : [] };
  } catch {
    return { data: [] };
  }
}

export async function search(query: string, page = 1): Promise<SearchResponse> {
  // samehadaku/otakudesu use `/search?q=${query}&page=${page}`. Animasu uses
  // `/search/${query}` (no pagination). Try query-string first, fall back.
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
    try {
      payload = await apiFetch<SankaUnknown>(
        `/search/${encodeURIComponent(query)}`,
        { revalidate: 120 }
      );
    } catch {
      return { data: [{ jumlah: 0, result: [] }] };
    }
  }
  const list = extractList(payload);
  const result = list.map(adaptCard);
  return { data: [{ jumlah: result.length, result }] };
}
// trigger redeploy after sankavollerei whitelist 1777815959
