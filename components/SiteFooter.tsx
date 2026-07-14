import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-ink-950/60">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2 4 5v6c0 4.5 3.2 8.4 8 10 4.8-1.6 8-5.5 8-10V5l-8-3Z" strokeLinejoin="round" />
                <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-lg font-bold text-white">
              Site<span className="text-brand-400">Check</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-slate-400">
            One URL in — security, SEO, AEO and health out. Every check, every report, free.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Product</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
            <li><Link href="/products" className="hover:text-white">All products</Link></li>
            <li><Link href="/checks" className="hover:text-white">Every check</Link></li>
            <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
            <li><Link href="/#scan" className="hover:text-white">Run a scan</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Scanners</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
            <li><Link href="/#features" className="hover:text-white">Security</Link></li>
            <li><Link href="/#features" className="hover:text-white">SEO</Link></li>
            <li><Link href="/#features" className="hover:text-white">AEO / AI visibility</Link></li>
            <li><Link href="/#features" className="hover:text-white">Health & performance</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Legal</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
            <li><Link href="/pricing" className="hover:text-white">Free forever</Link></li>
            <li><span className="text-slate-500">Only scan sites you own</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6">
        <div className="container-x flex flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row">
          <span>© {new Date().getFullYear()} SiteCheck. Built for people who ship fast.</span>
          <span>Made for authorized testing — scan only what you own or have permission to test.</span>
        </div>
      </div>
    </footer>
  );
}
