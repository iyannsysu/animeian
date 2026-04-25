"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Save, Sparkles } from "lucide-react";
import { TIERS } from "@/lib/level";

type Mode = "level" | "minutes";

export default function AdminLevelForm() {
  const [target, setTarget] = useState("");
  const [mode, setMode] = useState<Mode>("level");
  const [level, setLevel] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // Sync from #admin-form?target=...
    const apply = () => {
      const hash = window.location.hash;
      if (!hash.startsWith("#admin-form")) return;
      const q = new URLSearchParams(hash.split("?")[1] ?? "");
      const t = q.get("target");
      if (t) setTarget(t);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (!target.trim()) {
      setErr("Isi email atau userId target.");
      return;
    }
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { target: target.trim() };
      if (mode === "level") payload.level = Math.max(1, Math.min(9999, Math.floor(level)));
      else payload.minutes = Math.max(0, Math.floor(minutes));
      const res = await fetch("/api/admin/level", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ok: boolean;
        level?: number;
        watchSeconds?: number;
        reason?: string;
      };
      if (!res.ok || !data.ok) {
        setErr(`Gagal: ${data.reason ?? res.status}`);
      } else {
        setMsg(
          `Berhasil. Target sekarang Lv ${data.level} (${Math.floor(
            (data.watchSeconds ?? 0) / 60
          )} menit).`
        );
      }
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      id="admin-form"
      onSubmit={submit}
      className="space-y-3 rounded-2xl border border-white/10 bg-ink-900/60 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="sm:col-span-3">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink-300">
            Target (email atau userId)
          </span>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="contoh@gmail.com atau a1b2c3..."
            className="w-full rounded-xl border border-ink-800 bg-ink-950/60 px-3 py-2 text-sm text-ink-100 outline-none focus:border-fuchsia-500/70"
          />
        </label>

        <label>
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink-300">
            Mode
          </span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className="w-full rounded-xl border border-ink-800 bg-ink-950/60 px-3 py-2 text-sm text-ink-100 outline-none focus:border-fuchsia-500/70"
          >
            <option value="level">Set Level</option>
            <option value="minutes">Set Total Menit</option>
          </select>
        </label>

        {mode === "level" ? (
          <label className="sm:col-span-2">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink-300">
              Level (1 – 9999)
            </span>
            <input
              type="number"
              min={1}
              max={9999}
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="w-full rounded-xl border border-ink-800 bg-ink-950/60 px-3 py-2 text-sm text-ink-100 outline-none focus:border-fuchsia-500/70"
            />
          </label>
        ) : (
          <label className="sm:col-span-2">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink-300">
              Total Menit Nonton
            </span>
            <input
              type="number"
              min={0}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="w-full rounded-xl border border-ink-800 bg-ink-950/60 px-3 py-2 text-sm text-ink-100 outline-none focus:border-fuchsia-500/70"
            />
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-2 text-sm font-bold text-white shadow-md disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
        {msg ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
            <Sparkles className="h-3 w-3" /> {msg}
          </span>
        ) : null}
        {err ? <span className="text-xs text-rose-300">{err}</span> : null}
      </div>

      <details className="text-[11px] text-ink-400">
        <summary className="cursor-pointer text-ink-300">
          Cheat sheet tier
        </summary>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {TIERS.map((t) => (
            <li key={t.name}>
              <span className={`font-bold ${t.text}`}>{t.name}</span> · Lv{" "}
              {t.min}
              {t.max !== t.min ? `–${t.max}` : ""}
            </li>
          ))}
        </ul>
      </details>
    </form>
  );
}
