"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Loader2, Trash2, UserPlus } from "lucide-react";

type VerifiedUser = {
  id: string;
  name: string;
  image: string | null;
  email: string | null;
};

export default function AdminVerifyForm() {
  const [items, setItems] = useState<VerifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; items?: VerifiedUser[] };
      if (data.ok) setItems(data.items ?? []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = target.trim();
    if (!v) return;
    setBusy(true);
    setMsg(null);
    try {
      const isEmail = v.includes("@");
      const body = isEmail ? { email: v } : { userId: v };
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok: boolean; reason?: string };
      if (data.ok) {
        setMsg("Berhasil ditandai verified.");
        setTarget("");
        void refresh();
      } else {
        setMsg(`Gagal: ${data.reason ?? "unknown"}`);
      }
    } catch {
      setMsg("Gagal terhubung.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(userId: string) {
    if (!confirm("Cabut centang biru dari user ini?")) return;
    try {
      const res = await fetch(
        `/api/admin/verify?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
      const data = (await res.json()) as { ok: boolean };
      if (data.ok) void refresh();
    } catch {
      /* noop */
    }
  }

  return (
    <section className="space-y-3 rounded-3xl border border-sky-400/25 bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-ink-900/50 p-5 sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg">
          <BadgeCheck className="h-4 w-4 fill-sky-400 text-white" />
          Kelola Centang Biru (Verified)
        </h2>
        <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-200">
          {items.length} verified
        </span>
      </header>
      <p className="text-xs text-ink-300">
        Beri centang biru ke user lain. Centang akan muncul di samping nama
        mereka di komentar dan profil.
      </p>

      <form
        onSubmit={add}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Email user atau User ID"
          className="flex-1 rounded-full border border-white/10 bg-ink-950/60 px-4 py-2 text-sm text-ink-100 outline-none focus:border-sky-400/70"
        />
        <button
          type="submit"
          disabled={busy || !target.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          Tandai Verified
        </button>
      </form>
      {msg ? <p className="text-[11px] text-sky-200">{msg}</p> : null}

      <div className="rounded-2xl border border-white/10 bg-ink-950/40 p-3">
        {loading ? (
          <p className="text-xs text-ink-400">Memuat…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-ink-400">
            Belum ada user yang ditandai verified.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {items.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-900/60 p-2"
              >
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-ink-800">
                  {u.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.image}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs font-black text-ink-300">
                      {u.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-sm font-bold">
                    {u.name}
                    <BadgeCheck className="h-3.5 w-3.5 fill-sky-400 text-white" />
                  </p>
                  <p className="truncate text-[10px] text-ink-400">
                    {u.email ?? u.id.slice(0, 14)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revoke(u.id)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-400/40 bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-200 hover:bg-red-500/20"
                >
                  <Trash2 className="h-3 w-3" />
                  Cabut
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
