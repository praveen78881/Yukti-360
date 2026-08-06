// FY-wise GSTR-1 portal import.
//
// "Download / Import" pulls the taxpayer's ALREADY-FILED GSTR-1 for a whole
// financial year (Apr–Mar, 12 periods) in one action, storing a snapshot that
// can be viewed offline and re-downloaded later to pick up updates.
//
// Uses the taxpayer session (OTP) from store.ts. One GET per period
// (summary_type=long) → per-section summaries (sec_sum).

import { sandboxClient } from './client';
import { getEntityData, upsertEntityData } from '@/lib/offlineDb';

export interface SecSum {
  sec_nm: string;       // B2B, B2CL, B2CS, CDNR, CDNUR, EXP, NIL, AT, ATA, HSN, DOC_ISSUE, …
  ttl_rec?: number;
  ttl_val?: number;
  ttl_igst?: number;
  ttl_cgst?: number;
  ttl_sgst?: number;
  ttl_cess?: number;
  ttl_tax?: number;
}

export interface PeriodImport {
  period: string;   // MMYYYY
  year: string;     // calendar year, 4-digit
  month: string;    // 2-digit
  label: string;    // "Apr 2023"
  hasData: boolean;
  secSum: SecSum[];
  totals: { rec: number; val: number; igst: number; cgst: number; sgst: number; cess: number; tax: number };
  error?: string;
}

export interface FyImport {
  fyLabel: string;  // "2023-24"
  gstin: string;
  periods: PeriodImport[];
  importedAt: string;
}

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

/** The 12 (period, year, month, label) tuples of an Indian FY, Apr→Mar. */
export function fyPeriods(fyStartYear: number): { period: string; year: string; month: string; label: string }[] {
  return [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3].map((m, i) => {
    const y = m >= 4 ? fyStartYear : fyStartYear + 1;
    return { period: `${String(m).padStart(2, '0')}${y}`, year: String(y), month: String(m).padStart(2, '0'), label: `${MONTHS[i]} ${y}` };
  });
}

function sumTotals(secSum: SecSum[]) {
  return secSum.reduce(
    (a, s) => ({
      rec: a.rec + (s.ttl_rec || 0), val: a.val + (s.ttl_val || 0),
      igst: a.igst + (s.ttl_igst || 0), cgst: a.cgst + (s.ttl_cgst || 0),
      sgst: a.sgst + (s.ttl_sgst || 0), cess: a.cess + (s.ttl_cess || 0), tax: a.tax + (s.ttl_tax || 0),
    }),
    { rec: 0, val: 0, igst: 0, cgst: 0, sgst: 0, cess: 0, tax: 0 },
  );
}

/** Import every period of an FY. Sequential (portal is rate-sensitive); reports progress. */
export async function importGstr1FY(
  gstin: string, fyStartYear: number, sessionToken: string,
  onProgress?: (done: number, total: number, label: string) => void,
): Promise<FyImport> {
  const periods = fyPeriods(fyStartYear);
  const out: PeriodImport[] = [];
  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    onProgress?.(i, periods.length, p.label);
    const r = await sandboxClient.gstr1Summary(p.year, p.month, sessionToken, 'long');
    let secSum: SecSum[] = [];
    let error: string | undefined;
    if (r.ok) {
      const d = (r.data?.data?.data ?? r.data?.data ?? r.data) as { sec_sum?: SecSum[] };
      secSum = Array.isArray(d?.sec_sum) ? d.sec_sum : [];
    } else {
      error = r.error;
    }
    const totals = sumTotals(secSum);
    out.push({ ...p, hasData: totals.rec > 0 || totals.val > 0, secSum, totals, error });
  }
  onProgress?.(periods.length, periods.length, '');
  const fyLabel = `${fyStartYear}-${String((fyStartYear + 1) % 100).padStart(2, '0')}`;
  return { fyLabel, gstin, periods: out, importedAt: new Date().toISOString() };
}

// ── Persistence (per company + FY) ──────────────────────────────────────────
const MODULE = 'gst';
const sectionKey = (fyLabel: string) => `gstr1_filed_${fyLabel}`;

export function getFyImport(companyId: string, fyLabel: string): FyImport | null {
  const r = getEntityData(companyId, MODULE, sectionKey(fyLabel));
  return (r?.data as FyImport) ?? null;
}
export function saveFyImport(companyId: string, imp: FyImport): void {
  upsertEntityData(companyId, MODULE, sectionKey(imp.fyLabel), imp);
}
