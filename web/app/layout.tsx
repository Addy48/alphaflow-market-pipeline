import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "../components/CookieConsent";
import { MarketDataProvider } from "../context/MarketDataContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://alphaflow-terminal.vercel.app"),
  title: {
    default: "AlphaFlow Terminal | Dual-Exchange Quantitative Factor Mart",
    template: "%s | AlphaFlow Terminal",
  },
  description:
    "Enterprise quantitative market data platform. Multi-exchange Snappy Parquet ingestion across S&P 500 and NIFTY 50, Pandera data contracts, and lakehouse observability.",
  keywords: [
    "quantitative finance",
    "factor mart",
    "S&P 500",
    "NIFTY 50",
    "Pandera data contracts",
    "medallion lakehouse",
    "Bloomberg terminal",
    "RSI",
    "Bollinger Bands",
    "financial engineering",
  ],
  authors: [{ name: "AlphaFlow Engineering" }],
  creator: "AlphaFlow",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AlphaFlow Terminal | Dual-Exchange Quantitative Factor Mart",
    description:
      "Enterprise quantitative market data platform. Multi-exchange Snappy Parquet ingestion across S&P 500 and NIFTY 50, Pandera data contracts, and lakehouse observability.",
    url: "https://alphaflow-terminal.vercel.app",
    siteName: "AlphaFlow Quantitative Terminal",
    images: [
      {
        url: "/brand/alphaflow_logo_dark.png",
        width: 1200,
        height: 630,
        alt: "AlphaFlow Quantitative Terminal",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AlphaFlow Terminal | Dual-Exchange Quantitative Factor Mart",
    description:
      "Enterprise quantitative market data platform. Multi-exchange ingestion across S&P 500 and NIFTY 50, Pandera contracts, and lakehouse observability.",
    images: ["/brand/alphaflow_logo_dark.png"],
  },
  icons: {
    icon: [
      { url: "/brand/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/alphaflow_icon_dark.png", media: "(prefers-color-scheme: dark)" },
      { url: "/brand/alphaflow_icon_light.png", media: "(prefers-color-scheme: light)" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] antialiased font-mono overflow-x-hidden`}
      >
        <MarketDataProvider>
          {children}
          <CookieConsent />
        </MarketDataProvider>
      </body>
    </html>
  );
}
