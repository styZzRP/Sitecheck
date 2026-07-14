import { NextRequest, NextResponse } from "next/server";
import { scan, normalizeUrl } from "@/lib/scanner";
import type { ScanScope } from "@/lib/types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function isPublicHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return false;
  if (h === "127.0.0.1" || h === "0.0.0.0" || h === "::1") return false;
  // Block obvious private ranges / metadata endpoints (SSRF hardening).
  if (/^10\./.test(h)) return false;
  if (/^192\.168\./.test(h)) return false;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return false;
  if (/^169\.254\./.test(h)) return false; // link-local / cloud metadata
  if (h === "metadata.google.internal") return false;
  if (h.endsWith(".internal") || h.endsWith(".local")) return false;
  return true;
}

async function handle(rawUrl: string, scope: ScanScope) {
  let normalized: string;
  try {
    normalized = normalizeUrl(rawUrl);
  } catch {
    return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
  }
  const parsed = new URL(normalized);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only http and https URLs can be scanned." }, { status: 400 });
  }
  if (!isPublicHost(parsed.hostname)) {
    return NextResponse.json(
      { error: "Only public websites can be scanned (private/localhost addresses are blocked)." },
      { status: 400 }
    );
  }
  try {
    const report = await scan(normalized, { scope });
    return NextResponse.json(report, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Scan failed." }, { status: 502 });
  }
}

function parseScope(v: string | null | undefined): ScanScope {
  return v === "site" ? "site" : "page";
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing ?url= parameter." }, { status: 400 });
  return handle(url, parseScope(req.nextUrl.searchParams.get("scope")));
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body?.url) return NextResponse.json({ error: "Missing 'url' in body." }, { status: 400 });
  return handle(String(body.url), parseScope(body.scope));
}
