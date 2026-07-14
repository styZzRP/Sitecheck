"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export function CopyPrompt({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  }
  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-ink-950/60">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-300">
          <Icon name="sparkles" className="h-3.5 w-3.5" />
          AI fix prompt
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-white/5"
        >
          <Icon name="copy" className="h-3.5 w-3.5" />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="px-3 py-2.5 font-mono text-xs leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}
