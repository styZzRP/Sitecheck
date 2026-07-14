export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type CheckStatus = "pass" | "fail" | "warn" | "info";
export type Category = "security" | "seo" | "aeo" | "health";

export interface CheckResult {
  id: string;
  category: Category;
  title: string;
  status: CheckStatus;
  severity: Severity;
  /** Short human explanation of what was found. */
  detail: string;
  /** How to fix it (plain guidance). */
  remediation?: string;
  /** A ready-to-paste prompt for an AI coding agent. */
  aiPrompt?: string;
  /** Optional evidence (matched string, header value, etc.) — trimmed for safety. */
  evidence?: string;
}

export interface CategoryScore {
  category: Category;
  label: string;
  score: number; // 0-100
  grade: string; // A+ .. F
  passed: number;
  failed: number;
  warned: number;
  total: number;
}

export interface ScanReport {
  url: string;
  finalUrl: string;
  scannedAt: string;
  durationMs: number;
  overallScore: number;
  overallGrade: string;
  counts: Record<Severity, number>;
  categories: CategoryScore[];
  checks: CheckResult[];
  meta: {
    statusCode: number;
    server?: string;
    ip?: string;
    title?: string;
    htmlBytes: number;
    responseMs: number;
    scriptsAnalyzed: number;
    https: boolean;
  };
}
