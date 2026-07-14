import { CheckResult, ScanReport, Severity, CategoryScore, Category, CheckStatus } from "./types";
import {
  getTitle,
  getMeta,
  getHtmlLang,
  getJsonLd,
  getScriptSrcs,
  getInlineScripts,
  getLinkHrefs,
  getAllTags,
  getAttr,
  countTag,
  stripTags,
} from "./html";
import { SECRET_SIGNATURES, mask } from "./secrets";

const UA =
  "Mozilla/5.0 (compatible; SiteCheckBot/1.0; +https://sitecheck.local/bot)";
const TIMEOUT_MS = 15000;
const MAX_HTML = 3_000_000;
const MAX_SCRIPT = 1_200_000;
const MAX_SCRIPTS = 8;

interface Fetched {
  res: Response;
  body: string;
  ms: number;
}

async function timedFetch(url: string, init?: RequestInit): Promise<Fetched> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": UA, accept: "*/*", ...(init?.headers || {}) },
      cache: "no-store",
    });
    const buf = await res.arrayBuffer();
    const body = new TextDecoder("utf-8", { fatal: false }).decode(
      buf.slice(0, MAX_HTML)
    );
    return { res, body, ms: Date.now() - start };
  } finally {
    clearTimeout(t);
  }
}

export function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  const parsed = new URL(u);
  return parsed.toString();
}

export async function scan(rawUrl: string): Promise<ScanReport> {
  const started = Date.now();
  const url = normalizeUrl(rawUrl);
  const origin = new URL(url).origin;

  let main: Fetched;
  try {
    main = await timedFetch(url);
  } catch (e: any) {
    throw new Error(
      `Could not reach ${url}: ${e?.message || "network error"}. Check the URL is public and reachable.`
    );
  }

  const html = main.body;
  const headers = main.res.headers;
  const finalUrl = main.res.url || url;
  const isHttps = finalUrl.startsWith("https://");
  const checks: CheckResult[] = [];

  // ---- gather linked scripts for secret scanning ----
  const scriptSrcs = getScriptSrcs(html)
    .map((s) => absolutize(s, finalUrl))
    .filter((s): s is string => !!s && (s.startsWith("http://") || s.startsWith("https://")))
    .slice(0, MAX_SCRIPTS);

  const scriptBodies: { src: string; body: string }[] = [];
  await Promise.all(
    scriptSrcs.map(async (src) => {
      try {
        const f = await timedFetch(src);
        scriptBodies.push({ src, body: f.body.slice(0, MAX_SCRIPT) });
      } catch {
        /* ignore individual script fetch failures */
      }
    })
  );

  // ================= SECURITY =================
  runSecurityHeaders(headers, isHttps, checks);
  runTransport(finalUrl, headers, isHttps, checks);
  runCookies(headers, isHttps, checks);
  runInfoDisclosure(headers, html, checks);
  runSecretScan(html, scriptBodies, checks);
  runBaasChecks(html, scriptBodies, checks);
  await runExposedPaths(origin, checks);
  runCorsCsrf(headers, html, checks);

  // ================= SEO =================
  runSeo(html, finalUrl, checks);
  await runSeoFiles(origin, checks);

  // ================= AEO =================
  await runAeo(html, origin, checks);

  // ================= HEALTH / PERF =================
  runHealth(headers, html, main, checks);

  // ---- scoring ----
  const categories = scoreCategories(checks);
  const counts = countSeverities(checks);
  const overallScore = Math.round(
    categories.reduce((a, c) => a + c.score, 0) / categories.length
  );

  return {
    url,
    finalUrl,
    scannedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    overallScore,
    overallGrade: grade(overallScore),
    counts,
    categories,
    checks,
    meta: {
      statusCode: main.res.status,
      server: headers.get("server") || undefined,
      title: getTitle(html),
      htmlBytes: byteLength(html),
      responseMs: main.ms,
      scriptsAnalyzed: scriptBodies.length,
      https: isHttps,
    },
  };
}

// ---------------- helpers ----------------
function push(
  checks: CheckResult[],
  c: Omit<CheckResult, "status" | "severity"> & {
    ok: boolean;
    severity: Severity;
    warn?: boolean;
  }
) {
  const status: CheckStatus = c.ok ? "pass" : c.warn ? "warn" : "fail";
  const { ok, warn, ...rest } = c;
  checks.push({ ...rest, status, severity: ok ? "info" : c.severity });
}

function absolutize(src: string, base: string): string | undefined {
  try {
    return new URL(src, base).toString();
  } catch {
    return undefined;
  }
}

// ---------------- SECURITY: headers ----------------
function runSecurityHeaders(h: Headers, https: boolean, checks: CheckResult[]) {
  const csp = h.get("content-security-policy");
  push(checks, {
    id: "sec-csp",
    category: "security",
    title: "Content-Security-Policy",
    ok: !!csp,
    severity: "high",
    detail: csp
      ? "A Content-Security-Policy header is set, limiting where scripts and resources can load from."
      : "No Content-Security-Policy header. This is your strongest defense against XSS and injected scripts.",
    remediation: "Add a CSP header, starting strict (default-src 'self') and loosening only what you need.",
    aiPrompt:
      "Add a Content-Security-Policy header to my app. Start with `default-src 'self'` and allow only the exact script, style, image and connect sources my app uses. Explain each directive you add.",
    evidence: csp ? truncate(csp, 180) : undefined,
  });

  const hsts = h.get("strict-transport-security");
  push(checks, {
    id: "sec-hsts",
    category: "security",
    title: "HTTP Strict-Transport-Security",
    ok: !!hsts,
    warn: !https,
    severity: "medium",
    detail: hsts
      ? "HSTS is enabled — browsers will refuse to connect over plain HTTP."
      : "No HSTS header. Browsers may still connect over insecure HTTP.",
    remediation: "Send `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.",
    aiPrompt:
      "Add an HSTS header `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` to all responses and make sure every HTTP request 301-redirects to HTTPS.",
    evidence: hsts || undefined,
  });

  const xcto = h.get("x-content-type-options");
  push(checks, {
    id: "sec-xcto",
    category: "security",
    title: "X-Content-Type-Options",
    ok: xcto?.toLowerCase() === "nosniff",
    severity: "low",
    detail:
      xcto?.toLowerCase() === "nosniff"
        ? "MIME-sniffing is disabled (nosniff)."
        : "Missing `X-Content-Type-Options: nosniff`, so browsers may guess content types.",
    remediation: "Add `X-Content-Type-Options: nosniff` to all responses.",
    aiPrompt: "Add the response header `X-Content-Type-Options: nosniff` globally in my app.",
  });

  const xfo = h.get("x-frame-options");
  const frameAncestors = /frame-ancestors/i.test(h.get("content-security-policy") || "");
  push(checks, {
    id: "sec-xfo",
    category: "security",
    title: "Clickjacking protection",
    ok: !!xfo || frameAncestors,
    severity: "medium",
    detail:
      xfo || frameAncestors
        ? "Framing is restricted (X-Frame-Options or CSP frame-ancestors)."
        : "No clickjacking protection — your pages can be embedded in a malicious iframe.",
    remediation: "Add `X-Frame-Options: DENY` or a CSP `frame-ancestors 'self'` directive.",
    aiPrompt: "Protect my app from clickjacking by adding `X-Frame-Options: DENY` and a CSP `frame-ancestors 'self'` directive.",
  });

  const ref = h.get("referrer-policy");
  push(checks, {
    id: "sec-referrer",
    category: "security",
    title: "Referrer-Policy",
    ok: !!ref,
    warn: true,
    severity: "low",
    detail: ref
      ? `Referrer-Policy is set to "${ref}".`
      : "No Referrer-Policy header — full URLs may leak to third parties.",
    remediation: "Add `Referrer-Policy: strict-origin-when-cross-origin`.",
    aiPrompt: "Add `Referrer-Policy: strict-origin-when-cross-origin` to all responses.",
  });

  const pp = h.get("permissions-policy");
  push(checks, {
    id: "sec-permissions",
    category: "security",
    title: "Permissions-Policy",
    ok: !!pp,
    warn: true,
    severity: "low",
    detail: pp
      ? "A Permissions-Policy limits access to powerful browser features."
      : "No Permissions-Policy — camera, mic, geolocation etc. are not restricted.",
    remediation: "Add a Permissions-Policy disabling features you don't use, e.g. `camera=(), microphone=(), geolocation=()`.",
    aiPrompt: "Add a `Permissions-Policy` header that disables camera, microphone, geolocation and payment unless my app actually uses them.",
  });
}

// ---------------- SECURITY: transport ----------------
function runTransport(finalUrl: string, h: Headers, https: boolean, checks: CheckResult[]) {
  push(checks, {
    id: "sec-https",
    category: "security",
    title: "HTTPS / TLS",
    ok: https,
    severity: "critical",
    detail: https
      ? "The site is served over HTTPS with a valid certificate (the TLS handshake succeeded)."
      : "The site is served over plain HTTP. All traffic can be read and modified in transit.",
    remediation: "Serve the whole site over HTTPS and redirect HTTP to HTTPS. Most hosts (Vercel, Netlify, Cloudflare) do this automatically.",
    aiPrompt: "Force my whole site onto HTTPS: provision a TLS certificate and 301-redirect every HTTP request to the HTTPS equivalent.",
  });

  const server = h.get("server") || "";
  push(checks, {
    id: "sec-hsts-preload-note",
    category: "security",
    title: "Secure transport delivery",
    ok: https && !/http:\/\//i.test(finalUrl),
    warn: true,
    severity: "low",
    detail: https
      ? "Content is delivered from a secure origin."
      : "Non-secure origin detected.",
    evidence: server ? `server: ${truncate(server, 60)}` : undefined,
  });
}

// ---------------- SECURITY: cookies ----------------
function runCookies(h: Headers, https: boolean, checks: CheckResult[]) {
  const setCookie = h.get("set-cookie");
  if (!setCookie) {
    push(checks, {
      id: "sec-cookies",
      category: "security",
      title: "Cookie flags",
      ok: true,
      severity: "low",
      detail: "No cookies were set on the landing response.",
    });
    return;
  }
  const secure = /;\s*secure/i.test(setCookie);
  const httpOnly = /;\s*httponly/i.test(setCookie);
  const sameSite = /;\s*samesite/i.test(setCookie);
  const good = (secure || !https) && httpOnly && sameSite;
  push(checks, {
    id: "sec-cookies",
    category: "security",
    title: "Cookie flags (Secure / HttpOnly / SameSite)",
    ok: good,
    severity: "medium",
    detail: good
      ? "Cookies carry Secure, HttpOnly and SameSite flags."
      : `Cookie is missing hardening flags${!secure ? " Secure" : ""}${!httpOnly ? " HttpOnly" : ""}${!sameSite ? " SameSite" : ""}.`,
    remediation: "Set Secure, HttpOnly and SameSite=Lax (or Strict) on session cookies.",
    aiPrompt: "Make every authentication/session cookie in my app use the Secure, HttpOnly and SameSite=Lax flags.",
  });
}

// ---------------- SECURITY: info disclosure ----------------
function runInfoDisclosure(h: Headers, html: string, checks: CheckResult[]) {
  const leaky = ["server", "x-powered-by", "x-aspnet-version", "x-generator"]
    .map((k) => (h.get(k) ? `${k}: ${h.get(k)}` : null))
    .filter(Boolean) as string[];
  push(checks, {
    id: "sec-tech-disclosure",
    category: "security",
    title: "Technology disclosure headers",
    ok: leaky.length === 0,
    warn: true,
    severity: "low",
    detail:
      leaky.length === 0
        ? "No framework/version headers are leaking your stack."
        : "Response headers reveal your server stack and versions, helping attackers target known CVEs.",
    remediation: "Remove or blank out Server, X-Powered-By and similar version-revealing headers.",
    aiPrompt: "Remove the `X-Powered-By` header and any version-revealing headers (Server, X-AspNet-Version) from my app's responses.",
    evidence: leaky.length ? truncate(leaky.join(" · "), 160) : undefined,
  });

  const sourceMap = /\/\/[#@]\s*sourceMappingURL=/.test(html);
  push(checks, {
    id: "sec-sourcemap",
    category: "security",
    title: "Source maps exposed inline",
    ok: !sourceMap,
    warn: true,
    severity: "low",
    detail: sourceMap
      ? "An inline sourceMappingURL was found — production source maps can expose your original code."
      : "No inline source maps referenced on the page.",
    remediation: "Disable source-map generation (or don't publish .map files) in production builds.",
    aiPrompt: "Turn off publishing of JavaScript source maps in my production build so my original source isn't downloadable.",
  });
}

// ---------------- SECURITY: secrets ----------------
function runSecretScan(
  html: string,
  scripts: { src: string; body: string }[],
  checks: CheckResult[]
) {
  const haystacks = [{ src: "inline HTML/JS", body: html }, ...scripts];
  const hits: { sig: (typeof SECRET_SIGNATURES)[number]; where: string; sample: string }[] = [];
  for (const sig of SECRET_SIGNATURES) {
    for (const hay of haystacks) {
      const m = hay.body.match(sig.re);
      if (m) {
        hits.push({ sig, where: hay.src, sample: mask(m[0]) });
        break; // one hit per signature is enough
      }
    }
  }
  if (hits.length === 0) {
    push(checks, {
      id: "sec-secrets",
      category: "security",
      title: "Exposed API keys & secrets",
      ok: true,
      severity: "critical",
      detail: `Scanned inline scripts and ${scripts.length} JavaScript bundle(s); no obvious API keys or secrets were found in client code.`,
    });
    return;
  }
  const worst = hits.some((h) => h.sig.severity === "critical") ? "critical" : "high";
  push(checks, {
    id: "sec-secrets",
    category: "security",
    title: "Exposed API keys & secrets",
    ok: false,
    severity: worst as Severity,
    detail: `Found ${hits.length} likely secret(s) in client-side code: ${hits
      .map((h) => h.sig.label)
      .join(", ")}. Secrets in the browser are readable by anyone.`,
    remediation:
      "Rotate every exposed key now. Move secret keys to server-side/API routes or environment variables and only ship publishable keys to the browser.",
    aiPrompt:
      "I found secret keys shipped in my client JavaScript. Help me (1) rotate them, (2) move all secret-side calls behind a server API route, and (3) replace any client usage with only publishable/anon keys. Walk me through it for my stack.",
    evidence: truncate(hits.map((h) => `${h.sig.label} in ${h.where} → ${h.sample}`).join(" · "), 220),
  });
}

// ---------------- SECURITY: BaaS ----------------
function runBaasChecks(
  html: string,
  scripts: { src: string; body: string }[],
  checks: CheckResult[]
) {
  const all = html + " " + scripts.map((s) => s.body).join(" ");
  const usesSupabase = /supabase\.co|createClient\(/.test(all) && /supabase/i.test(all);
  const usesFirebase = /firebaseio\.com|firebaseapp\.com|apiKey["']?\s*:/.test(all) && /firebase/i.test(all);
  const usesClerk = /clerk\.(?:accounts\.dev|com)|__clerk/i.test(all);

  if (usesSupabase) {
    const serviceRole = /"role"\s*:\s*"service_role"/.test(all);
    push(checks, {
      id: "sec-supabase",
      category: "security",
      title: "Supabase configuration",
      ok: !serviceRole,
      severity: "critical",
      detail: serviceRole
        ? "A Supabase service_role token appears in client code — it bypasses Row Level Security entirely."
        : "Supabase detected. The anon key is fine to ship, but every table must have Row Level Security enabled.",
      remediation:
        "Never expose the service_role key. Enable RLS on all tables and write explicit policies; the anon key alone should never grant broad access.",
      aiPrompt:
        "My app uses Supabase. Audit it: make sure the service_role key is never in client code, enable Row Level Security on every table, and write least-privilege RLS policies for each. Show me the SQL.",
    });
  }
  if (usesFirebase) {
    push(checks, {
      id: "sec-firebase",
      category: "security",
      title: "Firebase configuration",
      ok: true,
      warn: true,
      severity: "high",
      detail:
        "Firebase detected. The web apiKey is public by design, but your Firestore/RTDB Security Rules are what actually protect data — verify they aren't left open.",
      remediation: "Lock down Firestore/Realtime Database Security Rules so unauthenticated reads/writes are denied by default.",
      aiPrompt:
        "My app uses Firebase. Review my Firestore and Realtime Database security rules and rewrite them so that by default nobody can read or write unless authenticated and authorized. Show me the rules.",
    });
  }
  if (usesClerk) {
    push(checks, {
      id: "sec-clerk",
      category: "security",
      title: "Clerk auth detected",
      ok: true,
      severity: "info",
      detail: "Clerk authentication detected. Publishable keys are safe client-side; confirm secret keys stay server-only.",
    });
  }
}

// ---------------- SECURITY: exposed paths ----------------
async function runExposedPaths(origin: string, checks: CheckResult[]) {
  const risky = [
    { path: "/.env", label: ".env file", sev: "critical" as Severity },
    { path: "/.git/config", label: ".git repository", sev: "critical" as Severity },
    { path: "/config.json", label: "config.json", sev: "high" as Severity },
    { path: "/.aws/credentials", label: "AWS credentials", sev: "critical" as Severity },
    { path: "/backup.sql", label: "database backup", sev: "critical" as Severity },
  ];
  const found: string[] = [];
  await Promise.all(
    risky.map(async (r) => {
      try {
        const f = await timedFetch(origin + r.path);
        const looksReal =
          f.res.status === 200 &&
          f.body.length > 0 &&
          !/<html/i.test(f.body.slice(0, 400)); // not an SPA fallback page
        if (looksReal) found.push(`${r.label} (${r.path})`);
      } catch {
        /* unreachable = good */
      }
    })
  );
  push(checks, {
    id: "sec-exposed-files",
    category: "security",
    title: "Publicly exposed sensitive files",
    ok: found.length === 0,
    severity: "critical",
    detail:
      found.length === 0
        ? "Common sensitive paths (.env, .git, backups) are not publicly served."
        : `Sensitive files are publicly downloadable: ${found.join(", ")}.`,
    remediation: "Block access to dotfiles and backups at the server/CDN, and never deploy .env or .git into your web root.",
    aiPrompt: "Sensitive files are reachable on my site. Configure my server/host to return 404 for .env, .git, .aws and any *.sql backups, and remove them from the deployed web root.",
    evidence: found.length ? truncate(found.join(" · "), 180) : undefined,
  });
}

// ---------------- SECURITY: CORS / CSRF ----------------
function runCorsCsrf(h: Headers, html: string, checks: CheckResult[]) {
  const acao = h.get("access-control-allow-origin");
  const acac = h.get("access-control-allow-credentials");
  const wildcardWithCreds = acao === "*" && acac === "true";
  push(checks, {
    id: "sec-cors",
    category: "security",
    title: "CORS policy",
    ok: !wildcardWithCreds,
    warn: acao === "*" && !wildcardWithCreds,
    severity: wildcardWithCreds ? "high" : "low",
    detail: wildcardWithCreds
      ? "CORS allows any origin (*) AND credentials — this lets any site make authenticated requests to your API."
      : acao === "*"
      ? "CORS is open to any origin (*). Fine for public read-only APIs, risky for anything authenticated."
      : acao
      ? `CORS is restricted to "${acao}".`
      : "No permissive CORS headers on the landing response.",
    remediation: "Never combine `Access-Control-Allow-Origin: *` with credentials. Echo back only explicitly allowed origins.",
    aiPrompt: "Fix my CORS config so it never uses `*` together with credentials; instead allow only my known front-end origins.",
    evidence: acao ? `ACAO: ${acao}${acac ? `, ACAC: ${acac}` : ""}` : undefined,
  });

  const hasForm = /<form[\s>]/i.test(html);
  const hasCsrfToken = /csrf|xsrf|_token|authenticity_token/i.test(html);
  if (hasForm) {
    push(checks, {
      id: "sec-csrf",
      category: "security",
      title: "CSRF protection on forms",
      ok: hasCsrfToken,
      warn: true,
      severity: "medium",
      detail: hasCsrfToken
        ? "A CSRF/anti-forgery token field appears in the page's forms."
        : "A form was found without an obvious CSRF token. State-changing POSTs should carry an anti-forgery token.",
      remediation: "Add per-session CSRF tokens to state-changing forms, or use SameSite cookies plus a double-submit token.",
      aiPrompt: "Add CSRF protection to my forms: generate a per-session anti-forgery token, include it as a hidden field, and validate it on every POST.",
    });
  }
}

// ---------------- SEO ----------------
function runSeo(html: string, finalUrl: string, checks: CheckResult[]) {
  const title = getTitle(html);
  push(checks, {
    id: "seo-title",
    category: "seo",
    title: "Title tag",
    ok: !!title && title.length >= 10 && title.length <= 65,
    warn: !!title,
    severity: "high",
    detail: title
      ? `Title is "${truncate(title, 70)}" (${title.length} chars). Aim for 10–60.`
      : "No <title> tag. This is the single most important on-page SEO element.",
    remediation: "Write a unique, descriptive <title> of 50–60 characters with your primary keyword near the front.",
    aiPrompt: "Write a unique, keyword-focused <title> tag (50–60 chars) for each page of my site and add it to the <head>.",
  });

  const desc = getMeta(html, "description");
  push(checks, {
    id: "seo-desc",
    category: "seo",
    title: "Meta description",
    ok: !!desc && desc.length >= 50 && desc.length <= 160,
    warn: !!desc,
    severity: "medium",
    detail: desc
      ? `Meta description is ${desc.length} chars. Aim for 120–160.`
      : "No meta description. Search engines will invent a snippet for you.",
    remediation: "Add a compelling 150–160 character meta description that earns the click.",
    aiPrompt: "Write a 150–160 character meta description for each page that summarizes the page and invites the click, then add it to the <head>.",
  });

  const canonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  push(checks, {
    id: "seo-canonical",
    category: "seo",
    title: "Canonical URL",
    ok: canonical,
    warn: true,
    severity: "medium",
    detail: canonical
      ? "A rel=canonical link is present, preventing duplicate-content dilution."
      : "No canonical link. Duplicate URLs (trailing slashes, params) may split your ranking signals.",
    remediation: "Add `<link rel=\"canonical\" href=\"…\">` pointing at the preferred URL of each page.",
    aiPrompt: "Add a self-referencing `<link rel=\"canonical\">` to every page pointing at its clean, preferred URL.",
  });

  const h1 = countTag(html, "h1");
  push(checks, {
    id: "seo-h1",
    category: "seo",
    title: "H1 heading",
    ok: h1 === 1,
    warn: h1 > 1,
    severity: "medium",
    detail:
      h1 === 1
        ? "Exactly one H1 — perfect page structure."
        : h1 === 0
        ? "No H1 heading found. Every page should have one clear H1."
        : `${h1} H1 headings found. Use exactly one primary H1 per page.`,
    remediation: "Use a single H1 that states the page's main topic, then H2/H3 for subsections.",
    aiPrompt: "Ensure each page has exactly one <h1> describing its main topic, with logical <h2>/<h3> subheadings underneath.",
  });

  const lang = getHtmlLang(html);
  push(checks, {
    id: "seo-lang",
    category: "seo",
    title: "HTML lang attribute",
    ok: !!lang,
    severity: "low",
    detail: lang ? `Document language declared as "${lang}".` : "No lang attribute on <html>. Hurts accessibility and international SEO.",
    remediation: "Add a lang attribute, e.g. `<html lang=\"en\">`.",
    aiPrompt: "Add the correct `lang` attribute to the <html> element on every page.",
  });

  const viewport = getMeta(html, "viewport");
  push(checks, {
    id: "seo-viewport",
    category: "seo",
    title: "Mobile viewport",
    ok: !!viewport,
    severity: "medium",
    detail: viewport ? "A responsive viewport meta tag is present." : "No viewport meta tag — the page won't render well on mobile, and Google indexes mobile-first.",
    remediation: "Add `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">`.",
    aiPrompt: "Add a responsive viewport meta tag to the <head> of every page.",
  });

  const og = /property=["']og:title["']/i.test(html);
  const twitter = /name=["']twitter:card["']/i.test(html);
  push(checks, {
    id: "seo-social",
    category: "seo",
    title: "Open Graph & social cards",
    ok: og && twitter,
    warn: og || twitter,
    severity: "low",
    detail:
      og && twitter
        ? "Open Graph and Twitter card tags are present — links will preview nicely when shared."
        : "Missing some social share tags. Links shared to social/chat won't get a rich preview.",
    remediation: "Add og:title, og:description, og:image and twitter:card meta tags.",
    aiPrompt: "Add Open Graph (og:title, og:description, og:image, og:url) and Twitter card meta tags so shared links get rich previews.",
  });

  const imgs = getAllTags(html, "img");
  const missingAlt = imgs.filter((t) => getAttr(t, "alt") === undefined).length;
  push(checks, {
    id: "seo-alt",
    category: "seo",
    title: "Image alt text",
    ok: imgs.length === 0 || missingAlt === 0,
    warn: missingAlt > 0 && missingAlt < imgs.length,
    severity: "low",
    detail:
      imgs.length === 0
        ? "No <img> tags on the page."
        : missingAlt === 0
        ? `All ${imgs.length} images have alt attributes.`
        : `${missingAlt} of ${imgs.length} images are missing alt text.`,
    remediation: "Give every meaningful image descriptive alt text; use alt=\"\" for purely decorative images.",
    aiPrompt: "Add descriptive alt text to every meaningful <img> on my site, and empty alt=\"\" to decorative ones.",
  });

  const jsonLd = getJsonLd(html);
  push(checks, {
    id: "seo-structured",
    category: "seo",
    title: "Structured data (JSON-LD)",
    ok: jsonLd.length > 0,
    warn: true,
    severity: "medium",
    detail:
      jsonLd.length > 0
        ? `${jsonLd.length} JSON-LD block(s) found — eligible for rich results.`
        : "No structured data. You miss out on rich results and give AI engines less to work with.",
    remediation: "Add JSON-LD schema (Organization, WebSite, Article, Product, FAQ) matching your content.",
    aiPrompt: "Add appropriate schema.org JSON-LD structured data (Organization + WebSite at minimum, plus Article/Product/FAQ where relevant) to my pages.",
  });
}

async function runSeoFiles(origin: string, checks: CheckResult[]) {
  const robots = await headOk(origin + "/robots.txt");
  push(checks, {
    id: "seo-robots",
    category: "seo",
    title: "robots.txt",
    ok: robots.ok,
    warn: true,
    severity: "low",
    detail: robots.ok ? "robots.txt is present and reachable." : "No robots.txt found. Add one to guide crawlers and point to your sitemap.",
    remediation: "Add a robots.txt that allows crawling of public pages and includes a `Sitemap:` line.",
    aiPrompt: "Create a robots.txt that allows crawling of my public pages, disallows admin/api paths, and references my sitemap.xml.",
  });
  const sitemap = await headOk(origin + "/sitemap.xml");
  push(checks, {
    id: "seo-sitemap",
    category: "seo",
    title: "XML sitemap",
    ok: sitemap.ok,
    warn: true,
    severity: "low",
    detail: sitemap.ok ? "sitemap.xml is present and reachable." : "No sitemap.xml found. Sitemaps help search engines discover all your pages.",
    remediation: "Generate and serve a sitemap.xml, and reference it from robots.txt.",
    aiPrompt: "Generate an XML sitemap of all my public URLs at /sitemap.xml and reference it from robots.txt.",
  });
}

// ---------------- AEO ----------------
async function runAeo(html: string, origin: string, checks: CheckResult[]) {
  const llms = await headOk(origin + "/llms.txt");
  push(checks, {
    id: "aeo-llms",
    category: "aeo",
    title: "llms.txt for AI crawlers",
    ok: llms.ok,
    warn: true,
    severity: "medium",
    detail: llms.ok
      ? "An llms.txt file is present — it gives AI answer engines a curated map of your key content."
      : "No llms.txt. This emerging standard tells AI engines (ChatGPT, Claude, Perplexity) what your site is about and which pages matter.",
    remediation: "Add an /llms.txt summarizing your site and linking to your most important pages in Markdown.",
    aiPrompt: "Create an /llms.txt file (Markdown) that summarizes what my product does and links to my most important pages, so AI answer engines can cite me accurately.",
  });

  const robotsTxt = await fetchText(origin + "/robots.txt");
  const blocksAi = /User-agent:\s*(GPTBot|ClaudeBot|PerplexityBot|Google-Extended|CCBot)[\s\S]*?Disallow:\s*\//i.test(robotsTxt || "");
  push(checks, {
    id: "aeo-crawler-access",
    category: "aeo",
    title: "AI crawler access",
    ok: !blocksAi,
    warn: true,
    severity: "medium",
    detail: blocksAi
      ? "Your robots.txt blocks one or more AI crawlers (GPTBot, ClaudeBot, PerplexityBot…). You won't be cited by those engines."
      : "AI crawlers are not blocked in robots.txt — answer engines can read and cite your content.",
    remediation: "Decide deliberately: allow GPTBot/ClaudeBot/PerplexityBot if you want AI citations; block only if that's your intent.",
    aiPrompt: "Review my robots.txt for AI crawler rules (GPTBot, ClaudeBot, PerplexityBot, Google-Extended). I want to be cited by AI answer engines, so make sure they're allowed.",
  });

  const faqSchema = /"@type"\s*:\s*"FAQPage"/i.test(html) || /"@type"\s*:\s*"QAPage"/i.test(html);
  push(checks, {
    id: "aeo-faq",
    category: "aeo",
    title: "FAQ / Q&A structured data",
    ok: faqSchema,
    warn: true,
    severity: "low",
    detail: faqSchema
      ? "FAQ/QA structured data found — great for direct answer extraction."
      : "No FAQ/QA schema. Q&A-formatted content with schema is highly quotable by AI answer engines.",
    remediation: "Where you answer common questions, mark them up with FAQPage JSON-LD.",
    aiPrompt: "Add FAQPage JSON-LD schema to my pages that answer common questions, with clear question/answer pairs.",
  });

  const text = stripTags(html);
  const words = text.split(/\s+/).filter(Boolean).length;
  push(checks, {
    id: "aeo-content-depth",
    category: "aeo",
    title: "Extractable content depth",
    ok: words >= 300,
    warn: words >= 120 && words < 300,
    severity: "low",
    detail:
      words >= 300
        ? `About ${words} words of readable text — enough substance for AI engines to summarize and cite.`
        : `Only about ${words} words of readable text. Thin content is rarely cited by answer engines.`,
    remediation: "Add clear, self-contained prose that answers real questions; AI engines quote text, not just visuals.",
    aiPrompt: "My landing page is thin on text. Help me add clear, self-contained copy that directly answers what my product is, who it's for, and how it works — the kind of prose AI answer engines can quote.",
  });

  const semantic = /<(article|section|main|nav|header|footer)[\s>]/i.test(html);
  push(checks, {
    id: "aeo-semantic",
    category: "aeo",
    title: "Semantic HTML structure",
    ok: semantic,
    severity: "low",
    detail: semantic
      ? "Semantic landmarks (main/article/section) help machines parse your content."
      : "No semantic HTML landmarks found — everything in <div>s is harder for engines to parse.",
    remediation: "Wrap content in <main>, <article>, <section>, <nav>, <header>, <footer> instead of generic <div>s.",
    aiPrompt: "Refactor my page markup to use semantic HTML5 landmarks (main, article, section, nav, header, footer) instead of generic divs.",
  });
}

// ---------------- HEALTH / PERFORMANCE ----------------
function runHealth(h: Headers, html: string, main: Fetched, checks: CheckResult[]) {
  const ms = main.ms;
  push(checks, {
    id: "health-ttfb",
    category: "health",
    title: "Server response time",
    ok: ms < 800,
    warn: ms >= 800 && ms < 2000,
    severity: "medium",
    detail: `The document responded in ${ms} ms. Google flags server response over ~800 ms as a Core Web Vitals risk.`,
    remediation: "Cache HTML at the edge/CDN, reduce server work on the critical path, and enable compression.",
    aiPrompt: "My homepage responds slowly. Help me reduce time-to-first-byte: add edge/CDN caching for HTML, cut synchronous work on the request path, and enable gzip/brotli.",
  });

  const enc = h.get("content-encoding") || "";
  const compressed = /gzip|br|deflate|zstd/i.test(enc);
  push(checks, {
    id: "health-compression",
    category: "health",
    title: "Compression",
    ok: compressed,
    severity: "low",
    detail: compressed ? `Responses are compressed (${enc}).` : "No content compression detected — pages download larger and slower than they should.",
    remediation: "Enable Brotli or gzip compression at your server/CDN.",
    aiPrompt: "Enable Brotli (or gzip) compression for HTML, CSS and JS responses on my host/CDN.",
  });

  const cache = h.get("cache-control") || "";
  push(checks, {
    id: "health-cache",
    category: "health",
    title: "Caching headers",
    ok: !!cache,
    warn: true,
    severity: "low",
    detail: cache ? `Cache-Control is set ("${truncate(cache, 60)}").` : "No Cache-Control header. Static assets should be cached aggressively.",
    remediation: "Send long-lived, immutable Cache-Control on hashed static assets and a sensible policy on HTML.",
    aiPrompt: "Add Cache-Control headers: `public, max-age=31536000, immutable` for hashed static assets, and a short cache for HTML.",
  });

  const bytes = byteLength(html);
  push(checks, {
    id: "health-pagesize",
    category: "health",
    title: "HTML document size",
    ok: bytes < 150_000,
    warn: bytes >= 150_000 && bytes < 400_000,
    severity: "low",
    detail: `The HTML document is ${(bytes / 1024).toFixed(0)} KB. Very large HTML delays first paint.`,
    remediation: "Trim inline data, defer non-critical markup, and avoid shipping huge JSON blobs in the initial HTML.",
    aiPrompt: "My initial HTML document is large. Help me reduce it: remove big inline JSON/state, defer non-critical markup, and split heavy components.",
  });

  const scripts = getScriptSrcs(html).length;
  const inline = getInlineScripts(html).length;
  push(checks, {
    id: "health-scripts",
    category: "health",
    title: "Script count",
    ok: scripts + inline <= 15,
    warn: scripts + inline > 15 && scripts + inline <= 30,
    severity: "low",
    detail: `The page references ${scripts} external and ${inline} inline scripts. Too many blocks interactivity.`,
    remediation: "Bundle and code-split JavaScript, defer non-critical scripts, and remove unused libraries.",
    aiPrompt: "My page loads too many scripts. Help me bundle/code-split them, add defer/async, and drop unused dependencies to improve Time to Interactive.",
  });

  const links = getLinkHrefs(html);
  push(checks, {
    id: "health-links",
    category: "health",
    title: "Internal linking",
    ok: links.length > 0,
    warn: true,
    severity: "info",
    detail: `${links.length} link(s) found on the page.`,
  });
}

// ---------------- scoring ----------------
const WEIGHT: Record<Severity, number> = {
  critical: 40,
  high: 20,
  medium: 8,
  low: 3,
  info: 0,
};

function scoreCategories(checks: CheckResult[]): CategoryScore[] {
  const cats: { category: Category; label: string }[] = [
    { category: "security", label: "Security" },
    { category: "seo", label: "SEO" },
    { category: "aeo", label: "AEO / AI visibility" },
    { category: "health", label: "Health & performance" },
  ];
  return cats.map(({ category, label }) => {
    const items = checks.filter((c) => c.category === category);
    let penalty = 0;
    let maxPenalty = 0;
    let passed = 0,
      failed = 0,
      warned = 0;
    for (const c of items) {
      const w = WEIGHT[c.severity === "info" ? "low" : c.severity] || WEIGHT.low;
      maxPenalty += w;
      if (c.status === "pass" || c.status === "info") passed++;
      else if (c.status === "warn") {
        warned++;
        penalty += w * 0.4;
      } else {
        failed++;
        penalty += w;
      }
    }
    const score = maxPenalty === 0 ? 100 : Math.max(0, Math.round(100 - (penalty / maxPenalty) * 100));
    return {
      category,
      label,
      score,
      grade: grade(score),
      passed,
      failed,
      warned,
      total: items.length,
    };
  });
}

function countSeverities(checks: CheckResult[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const c of checks) {
    if (c.status === "fail") counts[c.severity]++;
    else if (c.status === "warn") counts[c.severity === "info" ? "low" : c.severity]++;
  }
  return counts;
}

export function grade(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 60) return "D";
  return "F";
}

// ---------------- small io helpers ----------------
async function headOk(url: string): Promise<{ ok: boolean }> {
  try {
    const f = await timedFetch(url);
    return { ok: f.res.status >= 200 && f.res.status < 400 && f.body.length > 0 };
  } catch {
    return { ok: false };
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const f = await timedFetch(url);
    if (f.res.status >= 200 && f.res.status < 400) return f.body;
    return null;
  } catch {
    return null;
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}
