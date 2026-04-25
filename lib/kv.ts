// Minimal wrapper around Upstash Redis REST API (used by Vercel KV / Upstash).
// Reads from KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV convention)
// or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (stand-alone Upstash).

const url =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "";
const token =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

export const kvAvailable = Boolean(url && token);

type Cmd = (string | number)[];

async function run<T = unknown>(cmd: Cmd): Promise<T | null> {
  if (!kvAvailable) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(cmd),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: T; error?: string };
    if (data.error) return null;
    return (data.result ?? null) as T | null;
  } catch {
    return null;
  }
}

export const kv = {
  available: kvAvailable,
  async get<T = unknown>(key: string): Promise<T | null> {
    const r = await run<string>(["GET", key]);
    if (r == null) return null;
    try {
      return JSON.parse(r) as T;
    } catch {
      return r as unknown as T;
    }
  },
  async set(key: string, value: unknown): Promise<boolean> {
    const v = typeof value === "string" ? value : JSON.stringify(value);
    const r = await run<string>(["SET", key, v]);
    return r === "OK";
  },
  async del(...keys: string[]): Promise<number> {
    if (!keys.length) return 0;
    const r = await run<number>(["DEL", ...keys]);
    return r ?? 0;
  },
  async incr(key: string): Promise<number> {
    const r = await run<number>(["INCR", key]);
    return r ?? 0;
  },
  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    if (!keys.length) return [];
    const r = await run<(string | null)[]>(["MGET", ...keys]);
    if (!r) return keys.map(() => null);
    return r.map((v) => {
      if (v == null) return null;
      try {
        return JSON.parse(v) as T;
      } catch {
        return v as unknown as T;
      }
    });
  },
  async hset(key: string, field: string, value: unknown): Promise<boolean> {
    const v = typeof value === "string" ? value : JSON.stringify(value);
    const r = await run<number>(["HSET", key, field, v]);
    return (r ?? 0) >= 0;
  },
  async hget<T = unknown>(key: string, field: string): Promise<T | null> {
    const r = await run<string>(["HGET", key, field]);
    if (r == null) return null;
    try {
      return JSON.parse(r) as T;
    } catch {
      return r as unknown as T;
    }
  },
  async hgetall<T = Record<string, unknown>>(key: string): Promise<T> {
    const r = await run<string[] | Record<string, string>>(["HGETALL", key]);
    if (!r) return {} as T;
    const out: Record<string, unknown> = {};
    if (Array.isArray(r)) {
      for (let i = 0; i < r.length; i += 2) {
        const k = r[i];
        const v = r[i + 1];
        try {
          out[k] = JSON.parse(v);
        } catch {
          out[k] = v;
        }
      }
    } else {
      for (const [k, v] of Object.entries(r)) {
        try {
          out[k] = JSON.parse(v);
        } catch {
          out[k] = v;
        }
      }
    }
    return out as T;
  },
  async hdel(key: string, ...fields: string[]): Promise<number> {
    if (!fields.length) return 0;
    const r = await run<number>(["HDEL", key, ...fields]);
    return r ?? 0;
  },
  async lpush(key: string, ...values: unknown[]): Promise<number> {
    const vs = values.map((v) => (typeof v === "string" ? v : JSON.stringify(v)));
    const r = await run<number>(["LPUSH", key, ...vs]);
    return r ?? 0;
  },
  async lrange<T = unknown>(
    key: string,
    start = 0,
    stop = -1
  ): Promise<T[]> {
    const r = await run<string[]>(["LRANGE", key, start, stop]);
    if (!r) return [];
    return r.map((s) => {
      try {
        return JSON.parse(s) as T;
      } catch {
        return s as unknown as T;
      }
    });
  },
  async lrem(key: string, count: number, value: string): Promise<number> {
    const r = await run<number>(["LREM", key, count, value]);
    return r ?? 0;
  },
  async lrangeRaw(key: string, start = 0, stop = -1): Promise<string[]> {
    return (await run<string[]>(["LRANGE", key, start, stop])) ?? [];
  },
  async ltrim(key: string, start: number, stop: number): Promise<boolean> {
    const r = await run<string>(["LTRIM", key, start, stop]);
    return r === "OK";
  },
  async zincrby(key: string, increment: number, member: string): Promise<number> {
    const r = await run<string | number>(["ZINCRBY", key, increment, member]);
    return Number(r ?? 0) || 0;
  },
  async zrevrangeWithScores(
    key: string,
    start = 0,
    stop = 9
  ): Promise<Array<{ member: string; score: number }>> {
    const r = await run<string[]>([
      "ZRANGE",
      key,
      start,
      stop,
      "REV",
      "WITHSCORES",
    ]);
    if (!r || !Array.isArray(r)) return [];
    const out: Array<{ member: string; score: number }> = [];
    for (let i = 0; i < r.length; i += 2) {
      out.push({ member: r[i], score: Number(r[i + 1]) || 0 });
    }
    return out;
  },
  async expire(key: string, seconds: number): Promise<boolean> {
    const r = await run<number>(["EXPIRE", key, seconds]);
    return (r ?? 0) === 1;
  },
  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!members.length) return 0;
    const r = await run<number>(["SADD", key, ...members]);
    return r ?? 0;
  },
  async smembers(key: string): Promise<string[]> {
    const r = await run<string[]>(["SMEMBERS", key]);
    return r ?? [];
  },
  async srem(key: string, ...members: string[]): Promise<number> {
    if (!members.length) return 0;
    const r = await run<number>(["SREM", key, ...members]);
    return r ?? 0;
  },
  async sismember(key: string, member: string): Promise<boolean> {
    const r = await run<number>(["SISMEMBER", key, member]);
    return (r ?? 0) === 1;
  },
  async scard(key: string): Promise<number> {
    const r = await run<number>(["SCARD", key]);
    return r ?? 0;
  },
};
