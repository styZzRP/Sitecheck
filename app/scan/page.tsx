import { Suspense } from "react";
import { ScanResult } from "@/components/ScanResult";
import { ScanForm } from "@/components/ScanForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ScanPage({
  searchParams,
}: {
  searchParams: { url?: string };
}) {
  const url = searchParams.url;

  if (!url) {
    return (
      <div className="container-x py-20">
        <div className="mx-auto max-w-xl card p-8 text-center">
          <h1 className="text-xl font-bold text-white">No URL provided</h1>
          <p className="mt-2 text-sm text-slate-400">Enter a website to scan.</p>
          <div className="mx-auto mt-6 max-w-md">
            <ScanForm />
          </div>
          <Link href="/" className="mt-4 inline-block text-sm text-brand-300 hover:underline">
            ← Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="container-x py-20 text-center text-slate-400">Loading…</div>}>
      <ScanResult url={url} />
    </Suspense>
  );
}
