/**
 * Tiny dependency-free HTML helpers. We deliberately avoid a full DOM parser
 * to keep the scanner fast and edge-friendly; regex extraction is enough for
 * the metadata-level checks we run.
 */

export function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decode(m[1].trim()) : undefined;
}

export function getMeta(html: string, name: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${escapeRe(name)}["'][^>]*>`,
    "i"
  );
  const tag = html.match(re)?.[0];
  if (!tag) return undefined;
  const content = tag.match(/content=["']([\s\S]*?)["']/i);
  return content ? decode(content[1].trim()) : undefined;
}

export function getAllTags(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>`, "gi");
  return html.match(re) ?? [];
}

export function countTag(html: string, tag: string): number {
  const re = new RegExp(`<${tag}[\\s>]`, "gi");
  return (html.match(re) ?? []).length;
}

export function getAttr(tag: string, attr: string): string | undefined {
  const m = tag.match(new RegExp(`${escapeRe(attr)}=["']([\\s\\S]*?)["']`, "i"));
  return m ? m[1] : undefined;
}

export function getLinkHrefs(html: string): string[] {
  const out: string[] = [];
  const re = /<a[^>]+href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

export function getScriptSrcs(html: string): string[] {
  const out: string[] = [];
  const re = /<script[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

export function getInlineScripts(html: string): string[] {
  const out: string[] = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

export function getJsonLd(html: string): string[] {
  const out: string[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(m[1].trim());
  return out;
}

export function getHtmlLang(html: string): string | undefined {
  const m = html.match(/<html[^>]*\blang=["']([^"']+)["']/i);
  return m ? m[1] : undefined;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
