'use client';

import { useCompany } from '@/hooks/useCompany';
import { FileSpreadsheet } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   TDS & TCS Register — a single combined register.

   TDS and TCS are no longer two separate screens. This hosts the self-contained
   TDS / TCS register tool (served from /public/tax-utilities/tds-tcs-register.html)
   in a same-origin iframe. The tool computes rate/threshold/interest/due-dates,
   builds the quarterly + reconciliation summaries and the RPU export, and carries
   its own "Save file / Open file" persistence — nothing leaves the page.
   ──────────────────────────────────────────────────────────────────────────── */

export default function TdsTcsRegisterPage() {
  const { company, loading } = useCompany();

  if (loading || !company) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-60px)] flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 shrink-0 text-blue-600" />
          <span className="text-sm font-semibold text-gray-800">TDS &amp; TCS Register</span>
          <span className="truncate text-xs text-gray-400">· {company.name}</span>
        </div>
        <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
          FY 2026-27
        </span>
      </div>

      <div className="relative flex-1 overflow-hidden bg-gray-50">
        <iframe
          src="/tax-utilities/tds-tcs-register.html"
          className="absolute inset-0 h-full w-full border-none"
          title="TDS / TCS Register"
        />
      </div>
    </div>
  );
}
