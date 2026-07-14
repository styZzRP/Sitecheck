import Link from "next/link";
import { ScanForm } from "@/components/ScanForm";
import { Icon } from "@/components/Icon";

const FEATURES = [
  {
    icon: "shield",
    title: "Security scanner",
    accent: "text-rose-300",
    blurb:
      "40+ live checks for the risks that actually bite AI-built apps: exposed API keys in your JS bundles, missing security headers, weak TLS, open CORS, unprotected forms, publicly served .env / .git, and Supabase / Firebase misconfigurations.",
    points: ["Exposed secrets (OpenAI, Anthropic, Stripe, AWS…)", "Security headers, HSTS, CSP", "Supabase RLS & Firebase rules", "OWASP-style common holes"],
  },
  {
    icon: "search",
    title: "SEO checker",
    accent: "text-sky-300",
    blurb:
      "See exactly how Google reads your page: titles, meta descriptions, canonicals, headings, structured data, sitemaps, robots, social cards and mobile-readiness — each graded with a concrete fix.",
    points: ["Title, description & canonical", "Structured data (JSON-LD)", "robots.txt & XML sitemap", "Open Graph & Twitter cards"],
  },
  {
    icon: "sparkles",
    title: "AEO / AI visibility",
    accent: "text-violet-300",
    blurb:
      "Answer Engine Optimization grades how likely ChatGPT, Claude and Perplexity are to cite you: llms.txt, AI crawler access, extractable content depth, semantic markup and Q&A schema.",
    points: ["llms.txt & AI crawler rules", "Extractable content depth", "FAQ / Q&A schema", "Semantic HTML structure"],
  },
  {
    icon: "activity",
    title: "Health & performance",
    accent: "text-brand-300",
    blurb:
      "Post-launch hygiene: server response time, compression, caching, document weight and script bloat — the signals behind Core Web Vitals and a fast first paint.",
    points: ["Server response time", "Compression & caching", "Document weight", "Script count"],
  },
];

const STEPS = [
  { n: "1", title: "Paste your URL", text: "No signup, no install. Just the address of the site you want to check." },
  { n: "2", title: "We scan it live", text: "We fetch your page and its JS bundles and run 40+ real checks in seconds." },
  { n: "3", title: "Fix with AI", text: "Every issue comes with plain guidance and a copy-paste prompt for Claude, Cursor or any agent." },
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section id="scan" className="relative overflow-hidden">
        <div className="container-x py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
              </span>
              Every feature free — no paywall, no signup
            </span>
            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl">
              Is your <span className="gradient-text">vibe-coded app</span> safe, seen, and cited?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
              One URL in — security, SEO, AEO and site-health out. Get a full report in seconds,
              with a copy-paste AI fix for every issue. Free, forever.
            </p>
            <div className="mx-auto mt-9 max-w-xl">
              <ScanForm big />
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Icon name="shield" className="h-4 w-4 text-brand-400" /> 40+ live checks</span>
              <span className="flex items-center gap-1.5"><Icon name="key" className="h-4 w-4 text-brand-400" /> Secret detection</span>
              <span className="flex items-center gap-1.5"><Icon name="bolt" className="h-4 w-4 text-brand-400" /> Report in seconds</span>
              <span className="flex items-center gap-1.5"><Icon name="sparkles" className="h-4 w-4 text-brand-400" /> AI fix prompts</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container-x py-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Four scanners, one URL</h2>
          <p className="mt-3 text-slate-400">
            SiteCheck runs the same classes of check a security engineer, an SEO consultant and an AI-visibility specialist
            would — automatically, in one pass.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-7 transition hover:border-white/20">
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 ${f.accent}`}>
                  <Icon name={f.icon} className="h-6 w-6" />
                </span>
                <h3 className="text-xl font-bold text-white">{f.title}</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">{f.blurb}</p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {f.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-slate-300">
                    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-x py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">From URL to fix in three steps</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="relative card p-7">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-lg font-black text-white">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI FIX HIGHLIGHT */}
      <section className="container-x py-8">
        <div className="card overflow-hidden">
          <div className="grid items-center gap-8 p-8 md:grid-cols-2 md:p-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-300">Built for the way you build</span>
              <h2 className="mt-3 text-3xl font-bold text-white">Every issue ships with an AI fix prompt</h2>
              <p className="mt-4 text-slate-400">
                You didn&apos;t hand-write your app, so you shouldn&apos;t have to hand-fix it. Each finding includes a
                ready-to-paste prompt you drop into Claude, Cursor, or any coding agent — it explains the problem and asks for the fix in your stack.
              </p>
              <Link href="#scan" className="btn-primary mt-6">Run a free scan</Link>
            </div>
            <div className="rounded-xl border border-white/10 bg-ink-950/70 p-5 font-mono text-sm">
              <div className="mb-3 flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-400/70" />
                <span className="h-3 w-3 rounded-full bg-amber-400/70" />
                <span className="h-3 w-3 rounded-full bg-brand-400/70" />
              </div>
              <p className="text-brand-300"># AI fix prompt</p>
              <p className="mt-2 text-slate-400">
                I found secret keys shipped in my client JavaScript. Help me rotate them, move all
                secret-side calls behind a server API route, and replace client usage with only
                publishable/anon keys. Walk me through it for my stack.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container-x py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">Questions</h2>
          <div className="mt-10 space-y-4">
            <Faq q="Is it really free?" a="Yes. Every check, every category, every AI fix prompt and the full report are free — no signup, no credit card, no locked findings. Scan as often as you like." />
            <Faq q="What do you actually scan?" a="We fetch your page and up to eight of its JavaScript bundles, then run live checks: security headers, TLS, exposed secrets, CORS/CSRF, BaaS misconfig, SEO metadata and structured data, AI-crawler visibility (AEO), and performance/health signals." />
            <Faq q="Do you store my data?" a="The scan runs on demand and the report is generated for you in the moment. We don't require an account, so there's nothing tying a scan to you." />
            <Faq q="Can I scan any website?" a="Only scan sites you own or are authorized to test. SiteCheck performs lightweight, read-only requests — it doesn't attack or exploit anything — but you're responsible for having permission." />
            <Faq q="How is this different from a full pentest?" a="SiteCheck is fast, automated coverage of the common, high-impact mistakes AI-built apps ship with. It's a great first line of defense, not a replacement for a manual security audit of a high-risk application." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x pb-8">
        <div className="card bg-gradient-to-br from-brand-500/10 to-emerald-500/5 p-10 text-center md:p-14">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Scan your site now — it&apos;s free</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Find the security holes, SEO gaps and AI-visibility misses in your app before your users (or attackers) do.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <ScanForm big />
          </div>
        </div>
      </section>
    </>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="card group p-5 [&_summary]:cursor-pointer">
      <summary className="flex items-center justify-between font-semibold text-white marker:content-['']">
        {q}
        <span className="text-slate-500 transition group-open:rotate-180">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">{a}</p>
    </details>
  );
}
