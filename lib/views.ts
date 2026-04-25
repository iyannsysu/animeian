import { kv } from "@/lib/kv";

function key(series: string) {
  return `views:${series}`;
}

export async function incrementView(series: string): Promise<number> {
  if (!kv.available || !series) return 0;
  return kv.incr(key(series));
}

export async function getViewCount(series: string): Promise<number> {
  if (!kv.available || !series) return 0;
  const v = await kv.get<string | number>(key(series));
  return Number(v ?? 0) || 0;
}

export async function getViewCounts(
  seriesList: string[]
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  if (!kv.available) return out;
  const keys = seriesList.map((s) => key(s));
  const vals = await kv.mget<string | number>(keys);
  seriesList.forEach((s, i) => {
    out[s] = Number(vals[i] ?? 0) || 0;
  });
  return out;
}

export function formatViews(n: number): string {
  if (!n) return "0";
  if (n < 1000) return String(n);
  if (n < 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  if (n < 1_000_000) return Math.floor(n / 1000) + "k";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}
