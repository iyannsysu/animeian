export type Genre = {
  slug: string;
  label: string;
};

export const GENRES: Genre[] = [
  { slug: "action", label: "Action" },
  { slug: "adventure", label: "Adventure" },
  { slug: "comedy", label: "Comedy" },
  { slug: "drama", label: "Drama" },
  { slug: "fantasy", label: "Fantasy" },
  { slug: "isekai", label: "Isekai" },
  { slug: "romance", label: "Romance" },
  { slug: "sci-fi", label: "Sci-Fi" },
  { slug: "slice-of-life", label: "Slice of Life" },
  { slug: "sports", label: "Sports" },
  { slug: "supernatural", label: "Supernatural" },
  { slug: "mystery", label: "Mystery" },
  { slug: "thriller", label: "Thriller" },
  { slug: "horror", label: "Horror" },
  { slug: "mecha", label: "Mecha" },
  { slug: "music", label: "Music" },
  { slug: "psychological", label: "Psychological" },
  { slug: "school", label: "School" },
  { slug: "shounen", label: "Shounen" },
  { slug: "shoujo", label: "Shoujo" },
  { slug: "seinen", label: "Seinen" },
  { slug: "josei", label: "Josei" },
  { slug: "harem", label: "Harem" },
  { slug: "ecchi", label: "Ecchi" },
  { slug: "martial-arts", label: "Martial Arts" },
  { slug: "military", label: "Military" },
  { slug: "magic", label: "Magic" },
  { slug: "game", label: "Game" },
  { slug: "vampire", label: "Vampire" },
  { slug: "historical", label: "Historical" },
  { slug: "demons", label: "Demons" },
  { slug: "super-power", label: "Super Power" },
];

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function matchesGenre(
  genreList: string[] | undefined,
  slug: string
): boolean {
  if (!genreList?.length) return false;
  return genreList.some((g) => slugify(g) === slug);
}

export function findGenre(slug: string): Genre | undefined {
  return GENRES.find((g) => g.slug === slug);
}
