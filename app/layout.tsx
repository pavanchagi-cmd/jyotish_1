import type { Metadata, Viewport } from "next";
import { Hind, Noto_Sans_Kannada, Philosopher } from "next/font/google";
import "./globals.css";

const hind = Hind({
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600"],
  variable: "--font-hind",
  display: "swap",
});

// Hind has no Kannada glyphs (owner decision: Noto Sans Kannada for ಕನ್ನಡ text).
const kannada = Noto_Sans_Kannada({
  subsets: ["kannada"],
  weight: ["400", "600"],
  variable: "--font-kannada",
  display: "swap",
});

const philosopher = Philosopher({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-philosopher",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jyotish",
  description: "Simple Vedic astrology: Kundali, matching, Panchang, dasha and forecasts.",
};

export const viewport: Viewport = {
  themeColor: "#14112B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${hind.variable} ${kannada.variable} ${philosopher.variable}`}>
      <body>{children}</body>
    </html>
  );
}
