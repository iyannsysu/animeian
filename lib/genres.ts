export type Genre = {
  slug: string;
  label: string;
  emoji?: string;
};

export const GENRES: Genre[] = [
  { slug: "action", label: "Action", emoji: "⚔️" },
  { slug: "adventure", label: "Adventure", emoji: "🗺️" },
  { slug: "comedy", label: "Comedy", emoji: "😂" },
  { slug: "drama", label: "Drama", emoji: "🎭" },
  { slug: "fantasy", label: "Fantasy", emoji: "🧙" },
  { slug: "isekai", label: "Isekai", emoji: "🌀" },
  { slug: "romance", label: "Romance", emoji: "💖" },
  { slug: "sci-fi", label: "Sci-Fi", emoji: "🚀" },
  { slug: "slice-of-life", label: "Slice of Life", emoji: "🍵" },
  { slug: "sports", label: "Sports", emoji: "⚽" },
  { slug: "supernatural", label: "Supernatural", emoji: "👻" },
  { slug: "mystery", label: "Mystery", emoji: "🔍" },
  { slug: "thriller", label: "Thriller", emoji: "🕶️" },
  { slug: "horror", label: "Horror", emoji: "💀" },
  { slug: "mecha", label: "Mecha", emoji: "🤖" },
  { slug: "music", label: "Music", emoji: "🎵" },
  { slug: "psychological", label: "Psychological", emoji: "🧠" },
  { slug: "school", label: "School", emoji: "🏫" },
  { slug: "shounen", label: "Shounen", emoji: "🔥" },
  { slug: "shoujo", label: "Shoujo", emoji: "🌸" },
  { slug: "seinen", label: "Seinen", emoji: "🗡️" },
  { slug: "josei", label: "Josei", emoji: "🌷" },
  { slug: "harem", label: "Harem", emoji: "💘" },
  { slug: "ecchi", label: "Ecchi", emoji: "🌶️" },
  { slug: "martial-arts", label: "Martial Arts", emoji: "🥋" },
  { slug: "military", label: "Military", emoji: "🎖️" },
  { slug: "magic", label: "Magic", emoji: "✨" },
  { slug: "game", label: "Game", emoji: "🎮" },
  { slug: "vampire", label: "Vampire", emoji: "🧛" },
  { slug: "historical", label: "Historical", emoji: "📜" },
  { slug: "demons", label: "Demons", emoji: "😈" },
  { slug: "super-power", label: "Super Power", emoji: "💥" },
];

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function matchesGenre(genreList: string[] | undefined, slug: string): boolean {
  if (!genreList?.length) return false;
  return genreList.some((g) => slugify(g) === slug);
}

export function findGenre(slug: string): Genre | undefined {
  return GENRES.find((g) => g.slug === slug);
}
