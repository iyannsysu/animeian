"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchForm({ initial }: { initial: string }) {
  const [q, setQ] = useState(initial);
  const router = useRouter();
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const val = q.trim();
        if (!val) return;
        router.push(`/search?q=${encodeURIComponent(val)}`);
      }}
    >
      <label className="flex w-full items-center gap-2 rounded-lg border border-ink-800 bg-ink-900/60 px-3 py-2 text-sm focus-within:border-brand-500/80">
        <Search className="h-4 w-4 text-ink-400" />
        <input
          autoFocus
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="contoh: naruto, solo leveling, jujutsu"
          className="w-full bg-transparent text-ink-100 outline-none placeholder:text-ink-500"
        />
      </label>
      <button type="submit" className="btn-primary">
        Cari
      </button>
    </form>
  );
}
