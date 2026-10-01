'use client';

import { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel, type ExportColumn } from './exportUtils';

interface ExportButtonsProps {
  title: string;
  companyName: string;
  entityType: string;
  dateRange: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  pdfOrientation?: 'portrait' | 'landscape';
  includeSignatureBlock?: boolean;
  /** Kept for callers that still pass it — nothing is locked any more. */
  locked?: boolean;
  /** A page whose layout the table export can't capture renders its own PDF. */
  onPdf?: () => Promise<void> | void;
}

type Kind = 'excel' | 'pdf';

/** The two downloads, top-right of every statement and register: Excel and
 *  PDF. (Downloads were switched off app-wide on 2026-09-27; brought back on
 *  2026-10-01 — "there must be an option like download in Excel, download as
 *  PDF, in the right upper corner".) */
export function ExportButtons({
  title, companyName, entityType, dateRange,
  columns, data, pdfOrientation, includeSignatureBlock, onPdf,
}: ExportButtonsProps) {
  const [busy, setBusy] = useState<Kind | null>(null);
  const empty = data.length === 0;
  const file = title.replace(/\s+/g, '_');

  const run = async (kind: Kind, job: () => Promise<void> | void) => {
    setBusy(kind);
    try {
      await job();
      toast.success(`Downloaded ${file}.${kind === 'excel' ? 'xlsx' : 'pdf'}`);
    } catch (err) {
      console.error('[export]', err);
      toast.error(`Could not create the ${kind === 'excel' ? 'Excel file' : 'PDF'}`);
    } finally {
      setBusy(null);
    }
  };

  const cls = 'inline-flex h-8 items-center gap-1.5 rounded-full border-[1.5px] border-[var(--sand)] bg-white/80 px-3 font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--navy)] transition-colors duration-[160ms] hover:border-[var(--sand-2)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="inline-flex items-center gap-1.5" role="group" aria-label="Download">
      <button
        type="button"
        className={cls}
        disabled={busy !== null || empty}
        title={empty ? 'Nothing to download yet' : 'Download as Excel'}
        onClick={() => run('excel', () => exportToExcel(title, columns, data, undefined, { companyName, title, dateRange, entityType }))}
      >
        {busy === 'excel' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
        Excel
      </button>
      <button
        type="button"
        className={cls}
        disabled={busy !== null || (empty && !onPdf)}
        title={empty && !onPdf ? 'Nothing to download yet' : 'Download as PDF'}
        onClick={() => run('pdf', () => onPdf ? onPdf() : exportToPDF(title, companyName, entityType, dateRange, columns, data, { orientation: pdfOrientation, includeSignatureBlock }))}
      >
        {busy === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
        PDF
      </button>
    </div>
  );
}
