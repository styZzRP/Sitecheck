import type { Metadata } from "next";
import Link from "next/link";
import { ScanForm } from "@/components/ScanForm";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Products — SiteCheck Security, SEO, AEO & Health scanners",
  description: "Four scanners in one: security, SEO, AEO/AI visibility and site health. All free.",
};

const PRODUCTS = [
  {
    icon: "shield",
    accent: "text-rose-300",
    ring: "border-rose-500/25",
    title: "Security scanner",
    tagline: "Find the holes before attackers do.",
    body: "Detects exposed API keys in your JavaScript bundles, missing security headers, weak TLS delivery, open CORS, unprotected forms, publicly served .env / .git files, and Supabase / Firebase misconfigurations — the same classes of risk tracked by the OWASP Top 10.",
  },
  {
    icon: "search",
    accent: "text-sky-300",
    ring: "border-sky-500/25",
    title: "SEO checker",
    tagline: "Get found on Google.",
    body: "Grades indexability, on-page metadata, canonical URLs, headings, structured data, robots and sitemaps, social cards and mobile-readiness — each with a concrete, prioritized fix.",
  },
  {
    icon: "sparkles",
    accent: "text-violet-300",
    ring: "border-violet-500/25",
    title: "AEO scanner",
    tagline: "Get cited by AI answer engines.",
    body: "Answer Engine Optimization measures how likely ChatGPT, Claude and Perplexity are to quote you: llms.txt, AI crawler access in robots.txt, extractable content depth, semantic HTML and Q&A structured data.",
  },
  {
    icon: "activity",
    accent: "text-brand-300",
    ring: "border-brand-500/25",
    title: "Health & performance",
    tagline: "Stay fast after launch.",
    body: "Audits server response time, compression, caching, document weight and script bloat — the signals that drive Core Web Vitals and a fast first paint.",
  },
];

export default function ProductsPage() {
  return (
    <div className="container-x py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">One URL. Four scanners.</h1>
        <p className="mt-4 text-lg text-slate-300">
          Security, SEO, AEO and health — everything you need to check after you ship, all in a single free scan.
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {PRODUCTS.map((p) => (
          <div key={p.title} className={`card p-8 ${p.ring}`}>
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ${p.accent}`}>
              <Icon name={p.icon} className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-2xl font-bold text-white">{p.title}</h2>
            <p className={`mt-1 text-sm font-semibold ${p.accent}`}>{p.tagline}</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-xl text-center">
        <h2 className="text-2xl font-bold text-white">Run all four now</h2>
        <p className="mt-2 text-sm text-slate-400">One scan covers every product above. Free.</p>
        <div className="mt-6">
          <ScanForm />
        </div>
        <Link href="/checks" className="mt-6 inline-block text-sm text-brand-300 hover:underline">
          See every individual check →
        </Link>
      </div>
    </div>
  );
}
