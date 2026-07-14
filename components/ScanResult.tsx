"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScanReport, Category, CheckResult } from "@/lib/types";
import { CATEGORY_META, SEVERITY_META, STATUS_META, gradeColor, scoreColor } from "./severity";
import { Icon } from "./Icon";
import { CopyPrompt } from "./CopyPrompt";
import { ScanForm } from "./ScanForm";

type Phase = "loading" | "done" | "error";

const LOADING_STEPS = [
  "Fetching the page…",
  "Reading response headers…",
  "Downloading JavaScript bundles…",
  "Scanning for exposed secrets…",
  "Checking security headers & TLS…",
  "Grading SEO & metadata…",
  "Measuring AI answer-engine visibility…",
  "Auditing performance & health…",
  "Compiling your report…",
];

export function ScanResult({ url }: { url: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState(0);

  useEffect(() => {
    let alive = true;
    setPhase("loading");
    setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 700);

    fetch(`/api/scan?url=${encodeURIComponent(url)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!alive) return;
        if (!r.ok) {
          setError(data.error || "Scan failed.");
          setPhase("error");
        } else {
          setReport(data);
          setPhase("done");
        }
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.message || "Network error.");
        setPhase("error");
      })
      .finally(() => clearInterval(timer));

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [url]);

  if (phase === "loading") return <LoadingView url={url} step={step} />;
  if (phase === "error") return <ErrorView url={url} error={error} />;
  if (report) return <ReportView report={report} />;
  return null;
}

function LoadingView({ url, step }: { url: string; step: number }) {
  return (
    <div className="container-x py-20">
      <div className="mx-auto max-w-xl text-center">
        <div className="relative mx-auto mb-8 h-24 w-24">
          <span className="absolute inset-0 rounded-full bg-brand-500/30 animate-pulse-ring" />
          <span className="absolute inset-0 rounded-full bg-brand-500/20 animate-pulse-ring [animation-delay:0.6s]" />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-brand-500 text-white">
            <Icon name="shield" className="h-10 w-10" />
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Scanning {prettyHost(url)}</h1>
        <p className="mt-2 font-mono text-sm text-brand-300">{LOADING_STEPS[step]}</p>
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-emerald-300 transition-all duration-700"
            style={{ width: `${((step + 1) / LOADING_STEPS.length) * 100}%` }}
          />
        </div>
        <p className="mt-4 text-xs text-slate-500">Running 40+ live checks. This usually takes 10–20 seconds.</p>
      </div>
    </div>
  );
}

function ErrorView({ url, error }: { url: string; error: string }) {
  return (
    <div className="container-x py-20">
      <div className="mx-auto max-w-xl card p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
          <Icon name="shield" className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-white">Couldn&apos;t scan that site</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
        <p className="mt-1 text-xs text-slate-500 break-all">{url}</p>
        <div className="mx-auto mt-6 max-w-md">
          <ScanForm />
        </div>
      </div>
    </div>
  );
}

function ReportView({ report }: { report: ScanReport }) {
  const [active, setActive] = useState<Category | "all">("all");
  const [onlyIssues, setOnlyIssues] = useState(true);

  const filtered = useMemo(() => {
    return report.checks.filter((c) => {
      if (active !== "all" && c.category !== active) return false;
      if (onlyIssues && (c.status === "pass" || c.status === "info")) return false;
      return true;
    });
  }, [report, active, onlyIssues]);

  const totalIssues = report.checks.filter((c) => c.status === "fail" || c.status === "warn").length;

  return (
    <div className="container-x py-10">
      {/* header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">Scan report</p>
          <h1 className="mt-1 text-2xl font-bold text-white break-all">{prettyHost(report.finalUrl)}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" className="h-3.5 w-3.5" />
              {(report.durationMs / 1000).toFixed(1)}s
            </span>
            <span>HTTP {report.meta.statusCode}</span>
            <span>{report.meta.https ? "HTTPS" : "HTTP (insecure)"}</span>
            <span>{report.meta.scriptsAnalyzed} JS bundles analyzed</span>
            {report.meta.server && <span>server: {report.meta.server}</span>}
          </p>
        </div>
        <a href="/#scan" className="btn-ghost !py-2 text-sm">Scan another site</a>
      </div>

      {/* overall + category scores */}
      <div className="mt-8 grid gap-4 lg:grid-cols-[280px,1fr]">
        <OverallCard report={report} totalIssues={totalIssues} />
        <div className="grid gap-4 sm:grid-cols-2">
          {report.categories.map((c) => (
            <button
              key={c.category}
              onClick={() => setActive(c.category)}
              className={`card p-5 text-left transition hover:border-white/25 ${
                active === c.category ? "ring-2 ring-brand-400/50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Icon name={CATEGORY_META[c.category].icon} className={`h-4 w-4 ${CATEGORY_META[c.category].accent}`} />
                  {c.label}
                </span>
                <span className={`text-2xl font-black ${gradeColor(c.grade)}`}>{c.grade}</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${barColor(c.score)}`}
                  style={{ width: `${c.score}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span className={scoreColor(c.score)}>{c.score}/100</span>
                <span>
                  {c.failed > 0 && <span className="text-rose-300">{c.failed} fail</span>}
                  {c.failed > 0 && c.warned > 0 && " · "}
                  {c.warned > 0 && <span className="text-amber-300">{c.warned} warn</span>}
                  {c.failed === 0 && c.warned === 0 && <span className="text-brand-300">all clear</span>}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* severity summary bar */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(["critical", "high", "medium", "low"] as const).map((s) => (
          <span
            key={s}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${SEVERITY_META[s].ring} ${SEVERITY_META[s].bg} ${SEVERITY_META[s].text}`}
          >
            <span className={`h-2 w-2 rounded-full ${SEVERITY_META[s].dot}`} />
            {report.counts[s]} {SEVERITY_META[s].label}
          </span>
        ))}
      </div>

      {/* filters */}
      <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        <FilterChip label="All" active={active === "all"} onClick={() => setActive("all")} />
        {(["security", "seo", "aeo", "health"] as Category[]).map((cat) => (
          <FilterChip key={cat} label={CATEGORY_META[cat].label} active={active === cat} onClick={() => setActive(cat)} />
        ))}
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={onlyIssues}
            onChange={(e) => setOnlyIssues(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-transparent accent-brand-500"
          />
          Only show issues
        </label>
      </div>

      {/* checks */}
      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-10 text-center text-slate-400">
            <Icon name="shield" className="mx-auto h-10 w-10 text-brand-400" />
            <p className="mt-3 font-semibold text-white">Nothing to fix here</p>
            <p className="mt-1 text-sm">No issues in this view. Toggle &ldquo;Only show issues&rdquo; to see everything that passed.</p>
          </div>
        ) : (
          filtered.map((c) => <CheckCard key={c.id} check={c} />)
        )}
      </div>

      {/* free banner */}
      <div className="mt-10 card border-brand-400/30 bg-brand-500/[0.06] p-6 text-center">
        <p className="text-sm font-semibold text-brand-200">
          The entire report — every check, every AI fix prompt, every category — is free.
        </p>
        <p className="mt-1 text-xs text-slate-400">No paywall, no locked findings, no signup. Re-scan any time after you ship a fix.</p>
      </div>
    </div>
  );
}

function OverallCard({ report, totalIssues }: { report: ScanReport; totalIssues: number }) {
  const score = report.overallScore;
  const circ = 2 * Math.PI * 52;
  const dash = (score / 100) * circ;
  return (
    <div className="card flex flex-col items-center justify-center p-6">
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="url(#g)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
          />
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38ba81" />
              <stop offset="100%" stopColor="#6ee7b7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-black ${scoreColor(score)}`}>{score}</span>
          <span className={`text-lg font-bold ${gradeColor(report.overallGrade)}`}>{report.overallGrade}</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-white">Overall score</p>
      <p className="mt-1 text-center text-xs text-slate-400">
        {totalIssues === 0
          ? "Clean scan — no issues found."
          : `${totalIssues} issue${totalIssues === 1 ? "" : "s"} found across ${report.categories.length} categories.`}
      </p>
    </div>
  );
}

function CheckCard({ check }: { check: CheckResult }) {
  const [open, setOpen] = useState(false);
  const sev = SEVERITY_META[check.severity];
  const st = STATUS_META[check.status];
  const isIssue = check.status === "fail" || check.status === "warn";
  return (
    <div className={`card overflow-hidden ${isIssue ? sev.ring : "border-white/10"}`}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 p-4 text-left">
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            check.status === "pass" || check.status === "info"
              ? "bg-brand-500/15 text-brand-300"
              : `${sev.bg} ${sev.text}`
          }`}
        >
          {st.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">{check.title}</span>
            {isIssue && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${sev.bg} ${sev.text}`}>
                {sev.label}
              </span>
            )}
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
              {CATEGORY_META[check.category].label}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">{check.detail}</p>
        </div>
        <span className={`mt-1 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-4 sm:pl-12">
          {check.evidence && (
            <div className="mb-3 rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Evidence</p>
              <p className="mt-1 break-all font-mono text-xs text-slate-400">{check.evidence}</p>
            </div>
          )}
          {check.remediation && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">How to fix</p>
              <p className="mt-1 text-sm text-slate-300">{check.remediation}</p>
            </div>
          )}
          {check.aiPrompt && <CopyPrompt text={check.aiPrompt} />}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active ? "bg-brand-500 text-white" : "border border-white/15 text-slate-300 hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}

function barColor(score: number): string {
  if (score >= 90) return "bg-brand-400";
  if (score >= 75) return "bg-sky-400";
  if (score >= 60) return "bg-amber-400";
  return "bg-rose-400";
}

function prettyHost(url: string): string {
  try {
    const u = new URL(url);
    return u.host + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
}
