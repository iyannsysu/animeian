"use client";

import { signOut } from "next-auth/react";
import { LogOut, Trash2 } from "lucide-react";
import { clearHistory } from "@/lib/history";
import { useState } from "react";

export default function ProfileActions() {
  const [busy, setBusy] = useState(false);

  const onClear = async () => {
    if (!confirm("Hapus semua riwayat tontonan?")) return;
    setBusy(true);
    clearHistory();
    // clear server too is done by clearHistory; reload after short delay
    setTimeout(() => location.reload(), 400);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onClear}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-950/60 px-3 py-1.5 text-xs text-ink-200 hover:border-rose-500/60 hover:text-white disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" /> Hapus history
      </button>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-950/60 px-3 py-1.5 text-xs text-ink-200 hover:border-brand-500/60 hover:text-white"
      >
        <LogOut className="h-3.5 w-3.5" /> Keluar
      </button>
    </div>
  );
}
