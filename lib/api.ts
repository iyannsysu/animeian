import type {
  AnimeListResponse,
  DetailResponse,
  HomeResponse,
  JadwalResponse,
  OngoingResponse,
  SearchResponse,
  StreamResponse,
} from "./types";

export const API_BASE = "https://api.sonzaix.indevs.in";

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
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  const text = await res.text();
  // The upstream occasionally returns malformed JSON (unterminated strings
  // in the `author` field). Attempt to repair those cases gracefully.
  try {
    return JSON.parse(text) as T;
  } catch {
    const repaired = text.replace(
      /"author":\s*"[^"\n]*シ,/g,
      '"author": "Sonzai X",'
    );
    return JSON.parse(repaired) as T;
  }
}

export function getHome(page = 1) {
  return apiFetch<HomeResponse>(`/anime/home?page=${page}`, { revalidate: 300 });
}

export function getOngoing() {
  return apiFetch<OngoingResponse>(`/anime/ongoing`, { revalidate: 600 });
}

export function getJadwal() {
  return apiFetch<JadwalResponse>(`/anime/jadwal`, { revalidate: 1800 });
}

export function getAnimeList() {
  return apiFetch<AnimeListResponse>(`/anime/anime-list`, { revalidate: 3600 });
}

export function getDetail(series: string) {
  return apiFetch<DetailResponse>(
    `/anime/detail?series=${encodeURIComponent(series)}`,
    { revalidate: 600 }
  );
}

export function getStream(params: {
  slug: string;
  series?: string;
  episode?: number;
}) {
  const qs = new URLSearchParams();
  qs.set("slug", params.slug);
  if (params.series) qs.set("series", params.series);
  if (params.episode != null) qs.set("episode", String(params.episode));
  return apiFetch<StreamResponse>(`/anime/stream?${qs.toString()}`, {
    revalidate: 60,
  });
}

export function search(query: string, page = 1) {
  const qs = new URLSearchParams({ query, page: String(page) });
  return apiFetch<SearchResponse>(`/anime/search?${qs.toString()}`, {
    revalidate: 120,
  });
}
