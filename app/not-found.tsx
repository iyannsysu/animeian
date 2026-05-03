import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-16 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="mt-2 text-sm text-ink-400">Halaman tidak ditemukan.</p>
      <Link href="/" className="btn-primary mt-4 inline-flex">
        Kembali ke Home
      </Link>
    </div>
  );
}
