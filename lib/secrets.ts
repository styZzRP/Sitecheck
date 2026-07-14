/**
 * Signatures for secrets that commonly leak into client-side JS bundles of
 * AI-built apps. Each pattern is intentionally specific to avoid false
 * positives. We only ever surface a masked fragment as evidence.
 */

export interface SecretSignature {
  id: string;
  label: string;
  severity: "critical" | "high" | "medium";
  re: RegExp;
  /** Guidance shown when matched. */
  note: string;
}

export const SECRET_SIGNATURES: SecretSignature[] = [
  {
    id: "openai",
    label: "OpenAI API key",
    severity: "critical",
    re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
    note: "An OpenAI secret key was found in client code. Anyone can drain your quota.",
  },
  {
    id: "anthropic",
    label: "Anthropic API key",
    severity: "critical",
    re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/,
    note: "An Anthropic API key is exposed in the browser bundle.",
  },
  {
    id: "stripe_secret",
    label: "Stripe secret key",
    severity: "critical",
    re: /\bsk_live_[A-Za-z0-9]{20,}\b/,
    note: "A live Stripe secret key is exposed — this can move real money.",
  },
  {
    id: "stripe_restricted",
    label: "Stripe restricted key",
    severity: "high",
    re: /\brk_live_[A-Za-z0-9]{20,}\b/,
    note: "A live Stripe restricted key is present in client code.",
  },
  {
    id: "aws",
    label: "AWS access key ID",
    severity: "critical",
    re: /\bAKIA[0-9A-Z]{16}\b/,
    note: "An AWS access key ID is exposed. Rotate it immediately in IAM.",
  },
  {
    id: "google",
    label: "Google API key",
    severity: "high",
    re: /\bAIza[0-9A-Za-z_-]{35}\b/,
    note: "A Google API key is exposed. Restrict it by referrer/IP or rotate it.",
  },
  {
    id: "github_pat",
    label: "GitHub token",
    severity: "critical",
    re: /\bghp_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{22,}\b/,
    note: "A GitHub personal access token is exposed in the bundle.",
  },
  {
    id: "slack",
    label: "Slack token",
    severity: "high",
    re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
    note: "A Slack token is exposed and can post/read on your workspace.",
  },
  {
    id: "sendgrid",
    label: "SendGrid API key",
    severity: "high",
    re: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/,
    note: "A SendGrid key is exposed — attackers can send mail as you.",
  },
  {
    id: "supabase_service",
    label: "Supabase service_role JWT",
    severity: "critical",
    re: /"role"\s*:\s*"service_role"/,
    note: "A Supabase service_role key (bypasses Row Level Security) may be in client code.",
  },
  {
    id: "private_key",
    label: "Private key block",
    severity: "critical",
    re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/,
    note: "A private key block is embedded in a client-served asset.",
  },
  {
    id: "jwt_secret",
    label: "Hardcoded JWT/secret assignment",
    severity: "medium",
    re: /(?:jwt[_-]?secret|secret[_-]?key|api[_-]?secret)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i,
    note: "A variable that looks like a signing secret is hardcoded in client JS.",
  },
];

/** Mask a matched secret so we never echo it back in full. */
export function mask(value: string): string {
  const v = value.trim();
  if (v.length <= 10) return v[0] + "•••";
  return `${v.slice(0, 6)}…${v.slice(-4)} (${v.length} chars)`;
}
