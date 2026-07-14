import type { Metadata } from "next";
import Link from "next/link";
import { ScanForm } from "@/components/ScanForm";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "Pricing — SiteCheck (Everything Free)",
  description: "SiteCheck is 100% free. Every scanner, every check, every AI fix prompt — no paywall, no signup.",
};

const EVERYTHING = [
  "Unlimited scans",
  "Security scanner (40+ checks)",
  "Exposed secret detection",
  "SEO checker",
  "AEO / AI visibility scanner",
  "Health & performance audit",
  "AI fix prompts on every issue",
  "Full report — no locked findings",
  "Supabase / Firebase / Clerk checks",
  "No signup, no credit card",
  "Re-scan as often as you like",
  "Share your report link",
];

export default function PricingPage() {
  return (
    <div className="container-x py-20">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-300">
          <Icon name="bolt" className="h-4 w-4" />
          Simple pricing
        </span>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">
          Everything is <span className="gradient-text">free</span>
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          No tiers, no trials, no &ldquo;unlock the full report.&rdquo; Every feature SiteCheck has is available to
          everyone at no cost.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-lg">
        <div className="card relative overflow-hidden border-brand-400/40 p-8">
          <div className="absolute right-0 top-0 rounded-bl-xl bg-brand-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
            Free forever
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-300">Full access</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-6xl font-black text-white">€0</span>
            <span className="mb-2 text-slate-400">/ forever</span>
          </div>
          <p className="mt-2 text-sm text-slate-400">Every scanner and every report, for every user.</p>

          <ul className="mt-7 grid gap-3">
            {EVERYTHING.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-slate-200">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20 text-brand-300">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>

          <Link href="/#scan" className="btn-primary mt-8 w-full">
            Start scanning — free
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-xl text-center">
        <h2 className="text-xl font-bold text-white">Ready to check your site?</h2>
        <div className="mt-6">
          <ScanForm />
        </div>
      </div>
    </div>
  );
}
