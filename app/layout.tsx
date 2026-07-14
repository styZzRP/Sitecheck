import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "SiteCheck — Free Security, SEO & AEO Scanner",
  description:
    "Scan any URL for security holes, SEO gaps, AI answer-engine visibility and site health. Full report in seconds. Every feature free.",
  keywords: [
    "website security scanner",
    "SEO checker",
    "AEO scanner",
    "vibe coding security",
    "core web vitals",
    "exposed api keys",
  ],
  openGraph: {
    title: "SiteCheck — Free Security, SEO & AEO Scanner",
    description:
      "One URL in — security, SEO, AEO and health out. Full report in seconds, every feature free.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main className="min-h-[70vh]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
