"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ScanScope } from "@/lib/types";

export function ScanForm({ big = false }: { big?: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [scope, setScope] = useState<ScanScope>("page");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = url.trim();
    if (!v) {
      setError("Enter a website URL to scan.");
      return;
    }
    setError(null);
    router.push(`/scan?url=${encodeURIComponent(v)}&scope=${scope}`);
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div
        className={`flex flex-col gap-3 sm:flex-row ${
          big ? "sm:gap-3" : "sm:gap-2"
        }`}
      >
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" strokeLinecap="round" />
            </svg>
          </span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="yourwebsite.com"
            autoComplete="off"
            spellCheck={false}
            className={`w-full rounded-xl border border-white/15 bg-ink-900/70 pl-11 pr-4 text-white placeholder:text-slate-500 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40 ${
              big ? "py-4 text-lg" : "py-3.5"
            }`}
          />
        </div>
        <button
          type="submit"
          className={`btn-primary shrink-0 ${big ? "!py-4 !px-7 text-base" : ""}`}
        >
          Scan free
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Scope selector */}
      <div className="mt-3 inline-flex rounded-xl border border-white/10 bg-ink-900/50 p-1 text-sm">
        <ScopeOption
          active={scope === "page"}
          onClick={() => setScope("page")}
          label="This page only"
          hint="Fast — scans the URL you enter"
        />
        <ScopeOption
          active={scope === "site"}
          onClick={() => setScope("site")}
          label="Whole site"
          hint="Crawls up to 12 pages"
        />
      </div>

      {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
      <p className="mt-2 text-xs text-slate-500">
        No signup, no credit card. 100+ checks across security, SEO, AEO & health — free forever.
      </p>
    </form>
  );
}

function ScopeOption({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className={`rounded-lg px-3 py-1.5 font-medium transition ${
        active ? "bg-brand-500 text-white" : "text-slate-300 hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}
