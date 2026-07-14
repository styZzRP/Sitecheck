import type { Metadata } from "next";
import { ScanForm } from "@/components/ScanForm";
import { Icon } from "@/components/Icon";
import { CATEGORY_META } from "@/components/severity";

export const metadata: Metadata = {
  title: "Every check — SiteCheck",
  description: "The full catalog of security, SEO, AEO and health checks SiteCheck runs on your site. All free.",
};

const CATALOG: { category: keyof typeof CATEGORY_META; items: string[] }[] = [
  {
    category: "security",
    items: [
      "Content-Security-Policy header",
      "HTTP Strict-Transport-Security (HSTS)",
      "X-Content-Type-Options (nosniff)",
      "Clickjacking protection (X-Frame-Options / frame-ancestors)",
      "Referrer-Policy header",
      "Permissions-Policy header",
      "HTTPS / TLS delivery",
      "Cookie flags (Secure / HttpOnly / SameSite)",
      "Technology & version disclosure headers",
      "Inline source-map exposure",
      "Exposed OpenAI / Anthropic / Stripe / AWS / Google keys",
      "GitHub / Slack / SendGrid token detection",
      "Private key & signing-secret detection",
      "Supabase service_role & RLS configuration",
      "Firebase security-rules exposure",
      "Clerk auth key placement",
      "Publicly served .env / .git / backups",
      "Open CORS with credentials",
      "CSRF token presence on forms",
    ],
  },
  {
    category: "seo",
    items: [
      "Title tag presence & length",
      "Meta description presence & length",
      "Canonical URL",
      "Single H1 heading",
      "HTML lang attribute",
      "Mobile viewport meta",
      "Open Graph & Twitter cards",
      "Image alt text coverage",
      "Structured data (JSON-LD)",
      "robots.txt",
      "XML sitemap",
    ],
  },
  {
    category: "aeo",
    items: [
      "llms.txt for AI crawlers",
      "AI crawler access (GPTBot / ClaudeBot / PerplexityBot)",
      "FAQ / Q&A structured data",
      "Extractable content depth",
      "Semantic HTML structure",
    ],
  },
  {
    category: "health",
    items: [
      "Server response time (TTFB)",
      "Content compression (Brotli / gzip)",
      "Caching headers",
      "HTML document size",
      "Script count / bloat",
      "Internal linking",
    ],
  },
];

export default function ChecksPage() {
  const total = CATALOG.reduce((a, c) => a + c.items.length, 0);
  return (
    <div className="container-x py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          {total}+ checks, every one free
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          Here&apos;s exactly what SiteCheck looks at when you scan a URL. No findings are locked behind a paywall.
        </p>
      </div>

      <div className="mt-14 space-y-8">
        {CATALOG.map((group) => {
          const meta = CATEGORY_META[group.category];
          return (
            <div key={group.category} className="card p-7">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ${meta.accent}`}>
                  <Icon name={meta.icon} className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-white">{meta.label}</h2>
                  <p className="text-xs text-slate-500">{group.items.length} checks</p>
                </div>
              </div>
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-16 max-w-xl text-center">
        <h2 className="text-2xl font-bold text-white">Run every check on your site</h2>
        <div className="mt-6">
          <ScanForm />
        </div>
      </div>
    </div>
  );
}
