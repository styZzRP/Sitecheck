import type { Severity, CheckStatus, Category } from "@/lib/types";

export const SEVERITY_META: Record<
  Severity,
  { label: string; text: string; bg: string; ring: string; dot: string }
> = {
  critical: { label: "Critical", text: "text-rose-300", bg: "bg-rose-500/10", ring: "border-rose-500/30", dot: "bg-rose-500" },
  high: { label: "High", text: "text-orange-300", bg: "bg-orange-500/10", ring: "border-orange-500/30", dot: "bg-orange-500" },
  medium: { label: "Medium", text: "text-amber-300", bg: "bg-amber-500/10", ring: "border-amber-500/30", dot: "bg-amber-500" },
  low: { label: "Low", text: "text-sky-300", bg: "bg-sky-500/10", ring: "border-sky-500/30", dot: "bg-sky-500" },
  info: { label: "Info", text: "text-slate-300", bg: "bg-white/5", ring: "border-white/15", dot: "bg-slate-500" },
};

export const STATUS_META: Record<CheckStatus, { label: string; text: string; icon: string }> = {
  pass: { label: "Pass", text: "text-brand-300", icon: "✓" },
  fail: { label: "Fail", text: "text-rose-300", icon: "✕" },
  warn: { label: "Warn", text: "text-amber-300", icon: "!" },
  info: { label: "Info", text: "text-slate-300", icon: "i" },
};

export const CATEGORY_META: Record<Category, { label: string; icon: string; accent: string }> = {
  security: { label: "Security", icon: "shield", accent: "text-rose-300" },
  seo: { label: "SEO", icon: "search", accent: "text-sky-300" },
  aeo: { label: "AEO", icon: "sparkles", accent: "text-violet-300" },
  health: { label: "Health", icon: "activity", accent: "text-brand-300" },
};

export function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "text-brand-300";
  if (grade.startsWith("B")) return "text-sky-300";
  if (grade.startsWith("C")) return "text-amber-300";
  if (grade.startsWith("D")) return "text-orange-300";
  return "text-rose-300";
}

export function scoreColor(score: number): string {
  if (score >= 90) return "text-brand-300";
  if (score >= 75) return "text-sky-300";
  if (score >= 60) return "text-amber-300";
  return "text-rose-300";
}
