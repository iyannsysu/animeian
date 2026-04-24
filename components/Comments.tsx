"use client";

import { useEffect, useState, type FormEvent } from "react";
import { signIn, useSession } from "next-auth/react";
import { LogIn, Send, Trash2 } from "lucide-react";
import type { Comment } from "@/app/api/comments/[series]/route";

type Props = { series: string };

export default function Comments({ series }: Props) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = `/api/comments/${encodeURIComponent(series)}`;

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { items?: Comment[] }) => {
        if (!cancel) setItems(d.items ?? []);
      })
      .catch(() => {})
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [url]);

  const userId = session?.user?.id ?? null;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        comment?: Comment;
        reason?: string;
      };
      if (!res.ok || !data.ok) {
        if (data.reason === "kv_unavailable") {
          setError("Database komentar belum aktif. Hubungi admin.");
        } else if (data.reason === "unauthorized" || res.status === 401) {
          setError("Silakan login dulu.");
        } else if (data.reason === "too_long") {
          setError("Komentar terlalu panjang (maks 1000 karakter).");
        } else {
          setError("Gagal mengirim komentar.");
        }
        return;
      }
      if (data.comment) setItems((prev) => [data.comment!, ...prev]);
      setValue("");
    } catch {
      setError("Gagal mengirim komentar.");
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    const ok = confirm("Hapus komentar ini?");
    if (!ok) return;
    const res = await fetch(`${url}?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) setItems((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">
            Komentar
          </h2>
          <p className="text-xs text-ink-400 sm:text-sm">
            {items.length} komentar
          </p>
        </div>
      </div>

      {status === "authenticated" ? (
        <form
          onSubmit={submit}
          className="rounded-2xl border border-white/10 bg-ink-900/60 p-3"
        >
          <div className="flex gap-2.5">
            <Avatar
              name={session?.user?.name}
              image={session?.user?.image ?? null}
            />
            <div className="flex-1">
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder={`Tulis komentar sebagai ${
                  session?.user?.name ?? "pengguna"
                }…`}
                className="w-full resize-none rounded-xl border border-ink-800 bg-ink-950/60 p-2.5 text-sm text-ink-100 outline-none focus:border-brand-500/70"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[11px] text-ink-500">
                  {value.length}/1000
                </span>
                <button
                  type="submit"
                  disabled={sending || !value.trim()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  Kirim
                </button>
              </div>
              {error ? (
                <p className="mt-2 text-xs text-rose-400">{error}</p>
              ) : null}
            </div>
          </div>
        </form>
      ) : status === "loading" ? (
        <div className="skeleton h-24 rounded-2xl" />
      ) : (
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-ink-900/60 p-3">
          <p className="text-sm text-ink-300">
            Masuk untuk menulis komentar.
          </p>
          <button
            type="button"
            onClick={() => signIn("google")}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-950/60 px-3 py-1.5 text-sm text-ink-100 hover:border-brand-500/60"
          >
            <LogIn className="h-4 w-4" />
            Masuk
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-16 rounded-2xl" />
          <div className="skeleton h-16 rounded-2xl" />
        </div>
      ) : !items.length ? (
        <div className="rounded-2xl border border-dashed border-ink-800 p-6 text-center text-sm text-ink-400">
          Belum ada komentar. Jadilah yang pertama menulis.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li
              key={c.id}
              className="group rounded-2xl border border-white/10 bg-ink-900/50 p-3"
            >
              <div className="flex items-start gap-2.5">
                <Avatar name={c.userName} image={c.userImage} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-[13px] font-semibold text-ink-100">
                      {c.userName}
                    </span>
                    <span className="text-[11px] text-ink-500">
                      {timeAgo(c.createdAt)}
                    </span>
                    {userId && c.userId === userId ? (
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        className="ml-auto text-ink-500 hover:text-rose-400"
                        aria-label="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-200">
                    {c.body}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Avatar({
  name,
  image,
}: {
  name?: string | null;
  image?: string | null;
}) {
  const initial = (name ?? "?").slice(0, 1).toUpperCase();
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-ink-800 text-sm font-semibold text-ink-200">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name ?? "user"}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

function timeAgo(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}d`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}h`;
  return new Date(ts).toLocaleDateString("id-ID");
}


