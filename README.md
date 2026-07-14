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

## Deploy to Cloudflare (free, fully automated)

The whole app — including the server-side scan engine — runs on **Cloudflare
Pages** (free tier). The server routes use the Edge runtime, and a GitHub
Actions workflow (`.github/workflows/deploy.yml`) builds and deploys on every
push. After a one-time setup, you never touch it again.

### One-time setup (about 3 minutes)

1. **Create a free Cloudflare account** at <https://dash.cloudflare.com/sign-up>.
2. **Create an API token**: Cloudflare dashboard → *My Profile* → *API Tokens*
   → *Create Token* → use the **"Cloudflare Pages — Edit"** template → *Create*.
   Copy the token.
3. **Find your Account ID**: it's on the right-hand side of any Cloudflare
   dashboard page (*Account ID*), or in *Workers & Pages*.
4. **Add both as GitHub secrets**: in this repo → *Settings* → *Secrets and
   variables* → *Actions* → *New repository secret*, add:
   - `CLOUDFLARE_API_TOKEN` — the token from step 2
   - `CLOUDFLARE_ACCOUNT_ID` — the ID from step 3

That's it. The next push (or a manual *Run workflow* from the Actions tab)
builds and deploys the site. Your live URL will be
`https://sitecheck.pages.dev` (and Cloudflare prints the exact URL at the end
of the deploy job).

### Deploy manually from your machine (optional)

```bash
npm install
npx wrangler login          # one-time browser login
npm run deploy              # builds with next-on-pages and deploys
```

### Local preview of the Cloudflare build

```bash
npm run preview             # builds and serves the edge bundle locally
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
