import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://animeian.vercel.app"),
  title: {
    default: "Anime Ian — Streaming Anime Sub Indo",
    template: "%s · Anime Ian",
  },
  description:
    "Nonton anime sub Indo streaming cepat dan lancar di HP — update terbaru, ongoing, dan jadwal rilis setiap hari.",
  applicationName: "Anime Ian",
  keywords: [
    "anime",
    "streaming anime",
    "anime sub indo",
    "nonton anime",
    "anime ian",
  ],
  openGraph: {
    title: "Anime Ian — Streaming Anime Sub Indo",
    description:
      "Nonton anime sub Indo streaming cepat dan lancar di HP — update terbaru, ongoing, dan jadwal rilis setiap hari.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0b0b12",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="antialiased">
        <Providers>
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />
            <div className="absolute top-[30%] -right-20 h-[320px] w-[320px] rounded-full bg-fuchsia-500/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-[280px] w-[280px] rounded-full bg-cyan-500/10 blur-3xl" />
          </div>
          <Header />
          <main className="pb-28 pt-4 sm:pt-6">{children}</main>
          <Footer />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
