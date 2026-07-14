# SiteCheck

A free security, SEO, AEO and site-health scanner for vibe-coded apps. Paste a
URL and get a full report in seconds, with a copy-paste AI fix prompt for every
issue. **Every feature is free — no paywall, no signup.**

## What it checks

The scanner fetches the target page (and up to 8 of its JavaScript bundles) and
runs 40+ live checks across four categories:

- **Security** — exposed API keys/secrets in client code (OpenAI, Anthropic,
  Stripe, AWS, Google, GitHub, Slack, SendGrid, private keys), security headers
  (CSP, HSTS, X-Frame-Options, etc.), TLS delivery, cookie flags, CORS/CSRF,
  Supabase/Firebase/Clerk misconfiguration, and publicly served `.env` / `.git`
  / backup files.
- **SEO** — title, meta description, canonical, headings, `lang`, viewport,
  Open Graph/Twitter cards, image alt text, JSON-LD structured data, robots.txt
  and sitemap.xml.
- **AEO (AI visibility)** — `llms.txt`, AI-crawler access, FAQ/Q&A schema,
  extractable content depth and semantic HTML.
- **Health & performance** — server response time, compression, caching, HTML
  document weight, script bloat.

Each finding gets a severity, plain-language remediation and a ready-to-paste
prompt for Claude, Cursor or any coding agent.

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router) + React 18 + TypeScript
- Tailwind CSS
- The scan engine (`lib/scanner.ts`) runs server-side in a Node.js route
  handler (`app/api/scan/route.ts`) with SSRF hardening (private/localhost
  targets are blocked).

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Build for production:

```bash
npm run build
npm start
```

## How it works

1. `components/ScanForm.tsx` sends you to `/scan?url=…`.
2. `components/ScanResult.tsx` calls `GET /api/scan?url=…`.
3. `app/api/scan/route.ts` validates the URL (blocking private hosts) and calls
   `scan()` in `lib/scanner.ts`.
4. `scan()` fetches the page + scripts, runs every check, scores each category
   and returns a JSON `ScanReport`, which the UI renders.

## Responsible use

SiteCheck makes lightweight, read-only requests — it does not attack or exploit
anything. Only scan sites you own or are authorized to test.
