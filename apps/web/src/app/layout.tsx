import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { TermsGate } from "@/components/TermsGate";

export const metadata: Metadata = {
  metadataBase: new URL("https://kradl.xyz"),
  title: "Kradl — On-Chain App & Project Launchpad",
  description:
    "Launch fair-launch tokens for real apps on Robinhood Chain and Base. 0.5% of every trade goes directly to the builder.",
  openGraph: {
    title: "Kradl — On-Chain App & Project Launchpad",
    description:
      "Fund real apps from block one on Robinhood Chain and Base. 0.5% of every trade streams directly to the builder.",
    url: "https://kradl.xyz",
    siteName: "Kradl",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@kradlxyz",
    creator: "@kradlxyz",
    title: "Kradl — On-Chain App & Project Launchpad",
    description:
      "Fund real apps from block one on Robinhood Chain and Base. 0.5% of every trade streams directly to the builder.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <Providers>
          <TermsGate />
          <Navbar />
          <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-8 md:py-10">
            {children}
          </main>
          <footer className="border-t border-[var(--border-subtle)] mt-20">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-3 font-mono">
                <span className="text-[var(--text-primary)] font-semibold tracking-tight">KRADL</span>
                <span>Non-custodial app &amp; project launchpad</span>
              </div>
              <div className="flex flex-wrap items-center gap-5 font-mono">
                <Link href="/revenue" className="hover:text-white transition-colors">
                  Revenue
                </Link>
                <Link href="/developers" className="hover:text-white transition-colors">
                  Developers
                </Link>
                <a
                  href="https://github.com/kradlxyz/kradl"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitHub
                </a>
                <a
                  href={process.env.NEXT_PUBLIC_TWITTER_URL || "https://x.com/kradlxyz"}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  X (@kradlxyz)
                </a>
                {process.env.NEXT_PUBLIC_TELEGRAM_URL && (
                  <a
                    href={process.env.NEXT_PUBLIC_TELEGRAM_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Telegram
                  </a>
                )}
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms
                </Link>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy
                </Link>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
