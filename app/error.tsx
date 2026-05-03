"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // noop — could wire up analytics later
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="container-page py-16 text-center">
      <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
      <p className="mt-2 text-sm text-ink-400">
        Tidak dapat memuat halaman. Silakan coba lagi.
      </p>
      <button onClick={() => reset()} className="btn-primary mt-4">
        Muat ulang
      </button>
    </div>
  );
}
