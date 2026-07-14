import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/70 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shadow-lg shadow-brand-500/30">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2 4 5v6c0 4.5 3.2 8.4 8 10 4.8-1.6 8-5.5 8-10V5l-8-3Z" strokeLinejoin="round" />
              <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            Site<span className="text-brand-400">Check</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-300 md:flex">
          <Link href="/#features" className="hover:text-white">Features</Link>
          <Link href="/products" className="hover:text-white">Products</Link>
          <Link href="/checks" className="hover:text-white">Checks</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
          <Link href="/#faq" className="hover:text-white">FAQ</Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300 sm:inline-block">
            100% free
          </span>
          <Link href="/#scan" className="btn-primary !px-4 !py-2 text-sm">
            Scan a site
          </Link>
        </div>
      </div>
    </header>
  );
}
