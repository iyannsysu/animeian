export type AnimeCardItem = {
  id: string | number;
  url: string;
  judul: string;
  cover: string;
  lastch?: string;
  lastup?: string;
  genre?: string[];
  sinopsis?: string;
  studio?: string;
  score?: string;
  status?: string;
  rilis?: string;
  total_episode?: number;
  type?: string;
};

export type HomeResponse = {
  author?: string;
  data: AnimeCardItem[];
};

export type OngoingItem = {
  id: number;
  url: string;
  judul: string;
  cover: string;
  lastch: string;
  lastup: string;
  type: string;
};

export type OngoingResponse = {
  author?: string;
  data: OngoingItem[];
};

export type JadwalEntry = {
  day: string;
  date: string;
  date_ts: number;
  animeList: Array<{
    anime_name: string;
    id: number;
    link: string;
    cover: string;
    time?: string;
    score?: string;
  }>;
};

export type JadwalResponse = {
  generatedAt: number;
  data: JadwalEntry[];
};

export type AnimeListGroup = Array<{
  id: string;
  judul: string;
  url: string;
  cover: string;
}>;

export type AnimeListResponse = Record<string, AnimeListGroup>;

export type EpisodeItem = {
  id: number;
  ch: string;
  url: string;
  date: string;
  views?: number;
  history?: string;
  lastDurasi?: number | null;
  fullDurasi?: number | null;
};

export type DetailItem = {
  id: number;
  series_id: string;
  cover: string;
  judul: string;
  type: string;
  status: string;
  rating: string;
  published: string;
  author: string;
  genre: string[];
  sinopsis: string;
  chapter: EpisodeItem[];
};

export type DetailResponse = {
  data: DetailItem[];
};

export type StreamQuality = "360p" | "480p" | "720p" | "1080p";

export type StreamLink = {
  link: string;
  provide: number;
  id: number;
  reso: StreamQuality;
  size_kb: number | null;
};

export type StreamItem = {
  episode_id: number;
  reso: StreamQuality[];
  // Playable streams (iframe embeds or direct video). Used by VideoPlayer.
  streams: Record<StreamQuality, StreamLink[]>;
  // Optional download mirrors (host pages like Gofile/Pixeldrain/...).
  // Used by DownloadSection. Falls back to `streams` when not provided.
  downloads?: Record<StreamQuality, StreamLink[]>;
  resoSize: Record<StreamQuality, string | null>;
};

export type StreamResponse = {
  data: StreamItem[];
};

export type SearchResponse = {
  data: Array<{
    jumlah: number;
    result: AnimeCardItem[];
  }>;
};
