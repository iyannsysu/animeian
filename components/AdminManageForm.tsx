"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserPlus,
  Loader2,
} from "lucide-react";

type AdminItem = { email: string; immutable: boolean };

export default function AdminManageForm({
  currentEmail,
}: {
  currentEmail: string;
}) {
  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; items?: AdminItem[] };
      if (data.ok) setItems(data.items ?? []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function flash(msg: string) {
    setOkMsg(msg);
    setTimeout(() => setOkMsg(null), 2500);
  }

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = newEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      setError("Email tidak valid.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok: boolean; reason?: string };
      if (!res.ok || !data.ok) {
        setError(`Gagal: ${data.reason ?? res.status}`);
      } else {
        setNewEmail("");
        flash(`${email} ditambahkan sebagai admin.`);
        await load();
      }
    } catch {
      setError("Network error.");
    } finally {
      setAdding(false);
    }
  }

  async function remove(email: string) {
    if (!confirm(`Hapus ${email} dari admin?`)) return;
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/admins?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const data = (await res.json()) as { ok: boolean; reason?: string };
      if (!res.ok || !data.ok) {
        setError(`Gagal hapus: ${data.reason ?? res.status}`);
      } else {
        flash(`${email} dihapus dari admin.`);
        await load();
      }
    } catch {
      setError("Network error.");
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-red-400/25 bg-gradient-to-br from-red-500/10 via-rose-500/5 to-ink-900/60 p-4">
      <header className="flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg">
          <ShieldCheck className="h-4 w-4 text-red-300" />
          Kelola Admin
        </h2>
        <span className="rounded-full border border-red-400/40 bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-red-200">
          {items.length} admin
        </span>
      </header>

      <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="email@gmail.com — tambah admin baru"
          className="flex-1 rounded-xl border border-ink-800 bg-ink-950/60 px-3 py-2 text-sm text-ink-100 outline-none focus:border-red-400/70"
        />
        <button
          type="submit"
          disabled={adding}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 px-4 py-2 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(244,63,94,0.7)] transition active:scale-95 disabled:opacity-60"
        >
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Tambah Admin
        </button>
      </form>

      {error ? (
        <p className="text-[12px] text-red-300">{error}</p>
      ) : null}
      {okMsg ? (
        <p className="text-[12px] text-emerald-300">{okMsg}</p>
      ) : null}

      {loading ? (
        <p className="text-[12px] text-ink-400">Memuat daftar admin…</p>
      ) : !items.length ? (
        <p className="text-[12px] text-ink-400">Belum ada admin.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((it) => {
            const isMe = it.email === currentEmail.toLowerCase();
            return (
              <li
                key={it.email}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                  it.immutable
                    ? "border-amber-400/30 bg-amber-500/5"
                    : "border-red-400/25 bg-red-500/5"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-red-200">
                    {it.email}
                    {isMe ? (
                      <span className="ml-1 text-[10px] font-bold uppercase tracking-wide text-ink-400">
                        (saya)
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-ink-400">
                    {it.immutable ? "owner / env (tidak bisa dihapus)" : "admin dinamis"}
                  </p>
                </div>
                {it.immutable || isMe ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-ink-700 bg-ink-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-500"
                    title={
                      it.immutable
                        ? "Admin owner/env tidak bisa dihapus dari panel"
                        : "Tidak bisa hapus diri sendiri"
                    }
                  >
                    <ShieldOff className="h-3 w-3" />
                    Locked
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => remove(it.email)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-400/40 bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-200 hover:border-red-400/70 hover:bg-red-500/25"
                  >
                    <Trash2 className="h-3 w-3" />
                    Hapus
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[11px] text-ink-500">
        Tip: admin yang baru ditambah akan langsung berwarna merah di komentar
        setelah login (atau setelah ada aktivitas user-nya). Hardcoded owner +
        ENV `ADMIN_EMAILS` selalu jadi admin dan tidak bisa dihapus dari sini.
      </p>
    </section>
  );
}
