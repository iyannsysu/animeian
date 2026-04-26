"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

/**
 * Status presence kecil. Jika lastActiveAt < 5 menit yang lalu →
 * "Sedang aktif" (titik hijau). Lewat dari itu → "Aktif X menit/jam/hari yang lalu".
 *
 * Komponen ini juga ping `/api/presence` setiap 60 detik supaya status user
 * terupdate selama tab terbuka. Endpoint presence baru dibuat untuk ini.
 */
export default function ActiveStatus({
  lastActiveAt,
}: {
  lastActiveAt: number;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    // ping presence setiap 60 detik
    const ping = () => {
      fetch("/api/presence", { method: "POST", keepalive: true }).catch(() => {});
    };
    ping();
    const pingTimer = setInterval(ping, 60_000);
    const onVisible = () => {
      if (!document.hidden) ping();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(tick);
      clearInterval(pingTimer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const diff = Math.max(0, now - lastActiveAt);
  const fiveMin = 5 * 60_000;
  const online = diff < fiveMin;
  const label = online ? "Sedang aktif" : `Aktif ${formatRel(diff)}`;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
        online
          ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
          : "border-ink-700 bg-ink-900/70 text-ink-400"
      }`}
    >
      {online ? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
      ) : (
        <Activity className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}

function formatRel(diffMs: number): string {
  const min = Math.floor(diffMs / 60_000);
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} hari lalu`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month} bulan lalu`;
  return `${Math.floor(month / 12)} tahun lalu`;
}
