'use client';

import { useRef, useState } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { FileSpreadsheet, BookOpenCheck, CheckCircle } from 'lucide-react';
import { listJournalEntries } from '@/lib/offlineDb';
import { computeTDSRegister } from '@/lib/accounting/tdsCompute';
import { computeTCSRegister } from '@/lib/accounting/tcsCompute';
import { buildRegisterToolPayload } from '@/lib/accounting/tdsTcsBridge';
import { getCurrentFY } from '@/lib/utils/dateUtils';
import type { JournalEntry } from '@/lib/accounting/computeEngine';

/* ─────────────────────────────────────────────────────────────────────────────
   TDS & TCS Register — a single combined register, wired to the books.

   Hosts the self-contained TDS/TCS register tool (served from
   /public/tax-utilities/tds-tcs-register.html) in a same-origin iframe. The
   tool computes rate/threshold/interest/due-dates, quarterly + reconciliation
   summaries and the RPU export, with its own Save/Open persistence.

   "Sync from Books" derives TDS rows (TDS payable lines) and TCS rows (TCS
   payable lines) from the journal and pushes them into the tool via
   postMessage — the deep wire from the books into the register.
   ──────────────────────────────────────────────────────────────────────────── */

export default function TdsTcsRegisterPage() {
  const { company, companyId, loading } = useCompany();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [syncedInfo, setSyncedInfo] = useState<string | null>(null);
  const fy = getCurrentFY();
  const fyLabel = String(fy.label || '').replace(/^FY\s*/i, '') || fy.label;

  const syncFromBooks = () => {
    if (!company || !companyId || !iframeRef.current?.contentWindow) return;

    const entries = listJournalEntries(companyId, { fromDate: fy.start, toDate: fy.end }) as unknown as JournalEntry[];
    const tdsRows = computeTDSRegister(entries);
    const tcsRows = computeTCSRegister(entries);

    if (tdsRows.length === 0 && tcsRows.length === 0) {
      setSyncedInfo('No TDS / TCS entries found in the books for this FY.');
      return;
    }

    const ok = window.confirm(
      `Load ${tdsRows.length} TDS and ${tcsRows.length} TCS row(s) derived from the books into the register?\n\n` +
      'This replaces the rows currently in the register tool (its own Save file is untouched until you save).'
    );
    if (!ok) return;

    const payload = buildRegisterToolPayload({ company, fyLabel, tdsRows, tcsRows });
    iframeRef.current.contentWindow.postMessage({ type: 'LOAD_REGISTER_DATA', payload }, window.location.origin);
    setSyncedInfo(`Synced ${tdsRows.length} TDS + ${tcsRows.length} TCS rows from books`);
  };

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
        <div className="flex items-center gap-2">
          {syncedInfo && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-green-600">
              <CheckCircle className="h-3 w-3" /> {syncedInfo}
            </span>
          )}
          <button
            type="button"
            onClick={syncFromBooks}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 transition-colors"
            title="Derive TDS/TCS rows from journal entries and load them into the register"
          >
            <BookOpenCheck className="h-3.5 w-3.5" /> Sync from Books
          </button>
          <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
            FY {fyLabel}
          </span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-gray-50">
        <iframe
          ref={iframeRef}
          src="/tax-utilities/tds-tcs-register.html"
          className="absolute inset-0 h-full w-full border-none"
          title="TDS / TCS Register"
        />
      </div>
    </div>
  );
}
