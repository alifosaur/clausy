import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import { DocumentProvider } from "@/components/DocumentContext";
import { DevBanner } from "@/components/DevBanner";
import { SITE_URL } from "@/lib/config";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#FAF8F5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Clausy — AI Rental Agreement Reader for Tenants",
    template: "%s | Clausy",
  },
  description:
    "Upload photos of your rental agreement; Gemma reads them; code verifies every quote; answers are cited or refused. Built for tenants.",
  keywords: [
    "rental agreement",
    "tenant rights",
    "Gemma 4",
    "lease analyzer",
    "Bengaluru rental",
    "quote verification",
    "contract reader",
  ],
  authors: [{ name: "judgesnightmareee" }],
  creator: "Team judgesnightmareee",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    title: "Clausy — AI Rental Agreement Reader for Tenants",
    description:
      "Gemma reads your lease pages. Code verifies every quote. Clausy itself stores nothing.",
    siteName: "Clausy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clausy — AI Rental Agreement Reader for Tenants",
    description: "Gemma reads your lease pages. Code verifies every quote. Every answer is cited.",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${fraunces.variable} ${inter.variable}`}>
      <body suppressHydrationWarning className="min-h-screen bg-paper text-ink font-sans antialiased flex flex-col selection:bg-highlighter-solid selection:text-ink">
        {/* Skip to content link for accessibility */}
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>

        {/* Document state (memory-only) and Toast notifications */}
        <DocumentProvider>
          <ToastProvider>
            {/* Dev-only diagnostics banner */}
            <DevBanner />

            {/* Global Responsive Navbar */}
            <Navbar />

            {/* Semantic main content container */}
            <main id="main-content" className="flex-1 flex flex-col">
              {children}
            </main>

            {/* Global Footer */}
            <Footer />
          </ToastProvider>
        </DocumentProvider>
      </body>
    </html>
  );
}
