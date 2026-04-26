"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";

/**
 * Tombol shortcut khusus admin di hero /profile untuk meng-verified-kan
 * akun sendiri 1 klik (atau cabut). Memanggil /api/admin/verify.
 */
export default function AdminSelfVerifyButton({
  userId,
  initialVerified,
}: {
  userId: string;
  initialVerified: boolean;
}) {
  const [verified, setVerified] = useState(initialVerified);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setError(null);
    try {
      let res: Response;
      if (verified) {
        res = await fetch(
          `/api/admin/verify?userId=${encodeURIComponent(userId)}`,
          { method: "DELETE" }
        );
      } else {
        res = await fetch(`/api/admin/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.reason ?? "gagal");
      }
      setVerified(!verified);
      // Refresh agar badge terupdate di seluruh halaman
      setTimeout(() => window.location.reload(), 350);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Gagal update status verified"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wide transition disabled:opacity-50 ${
          verified
            ? "border-sky-400/60 bg-sky-500/20 text-sky-100 hover:bg-sky-500/30"
            : "border-sky-400/40 bg-sky-500/10 text-sky-200 hover:border-sky-400/70 hover:bg-sky-500/20"
        }`}
      >
        <BadgeCheck className="h-3.5 w-3.5" />
        {loading
          ? "..."
          : verified
            ? "Cabut Verified"
            : "Tandai Verified"}
      </button>
      {error ? (
        <span className="text-[10px] text-red-400">{error}</span>
      ) : null}
    </div>
  );
}
