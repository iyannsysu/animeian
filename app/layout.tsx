import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";

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
        <Header />
        <main className="pb-24 pt-4 sm:pt-6">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
