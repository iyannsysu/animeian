export default function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-800/60 py-8 text-center text-xs text-ink-500 sm:pb-8">
      <div className="container-page">
        <p>
          &copy; {new Date().getFullYear()} Anime Ian — streaming cepat dan
          lancar di HP.
        </p>
        <p className="mt-1 text-ink-600">
          Konten disediakan oleh pihak ketiga. Situs ini hanya berfungsi sebagai
          indeks.
        </p>
      </div>
    </footer>
  );
}
