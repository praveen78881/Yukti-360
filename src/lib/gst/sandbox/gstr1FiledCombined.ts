// Combined GSTR-1 + GSTR-1A import for one period.
//   1. GSTR-1 summary  → which GSTR-1 sections have data
//   2. GSTR-1A summary → which GSTR-1A (amendment return) sections have data
//   3. fetch the populated sections of each — and if the summary names NONE
//      (which the portal does for an already-FILED return, whose pre-file
//      sec_sum is cleared), probe every section directly instead of reporting
//      the month as nil
//   4. merge into one section-wise snapshot; "no data" is a clean empty state.
// Token-based (the caller supplies a live taxpayer session — see session.ts).

import { sandboxClient } from './client';
import { fetchGstr1MonthDetail, ALL_GSTR1_SECTIONS, type FiledSection } from './gstr1FiledDetail';
import { getEntityData, upsertEntityData } from '@/lib/offlineDb';

/** Section names (sec_nm) that reported records in a summary response. */
function populatedFromSummary(respData: any): string[] {
  const d = respData?.data?.data ?? respData?.data ?? respData;
  const ss = Array.isArray(d?.sec_sum) ? d.sec_sum : [];
  return ss.filter((s: any) => (s.ttl_rec || 0) > 0 || (s.ttl_val || 0) > 0).map((s: any) => String(s.sec_nm));
}

export interface CombinedFiled {
  gstin: string;
  period: string;   // MMYYYY
  year: string;
  month: string;
  gstr1: FiledSection[];
  gstr1a: FiledSection[];
  importedAt: string;
  calls: number;    // API calls spent (for the credit meter)
}

export async function importCombinedFiled(
  gstin: string, year: string, month: string, sessionToken: string,
  onProgress?: (label: string) => void,
): Promise<CombinedFiled> {
  let calls = 0;

  onProgress?.('GSTR-1 summary');
  const s1 = await sandboxClient.gstr1Summary(year, month, sessionToken, 'long'); calls++;
  let pop1 = s1.ok ? populatedFromSummary(s1.data) : [];

  onProgress?.('GSTR-1A summary');
  const s1a = await sandboxClient.gstr1aSummary(year, month, sessionToken, 'long'); calls++;
  const pop1a = s1a.ok ? populatedFromSummary(s1a.data) : [];

  // `sec_sum` is the PRE-FILING summary of saved data. Once a return is filed the
  // portal can return it empty, which previously made a fully-filed month look
  // nil. When the summary names no section, probe every section directly — the
  // filed documents are still readable through the per-section endpoints.
  if (pop1.length === 0) {
    pop1 = ALL_GSTR1_SECTIONS;
    onProgress?.('Summary reported nothing — probing every GSTR-1 section directly');
  }

  onProgress?.(`GSTR-1 sections (${pop1.length})`);
  const gstr1 = await fetchGstr1MonthDetail(year, month, sessionToken, pop1, 'gstr1'); calls += pop1.length;

  onProgress?.(`GSTR-1A sections (${pop1a.length})`);
  const gstr1a = await fetchGstr1MonthDetail(year, month, sessionToken, pop1a, 'gstr1a'); calls += pop1a.length;

  return {
    gstin, period: `${month}${year}`, year, month,
    gstr1, gstr1a, importedAt: new Date().toISOString(), calls,
  };
}

// ── Persistence (per company + period) ──────────────────────────────────────
const MODULE = 'gst';
const key = (period: string) => `gstr1_combined_${period}`;

export function getCombinedFiled(companyId: string, period: string): CombinedFiled | null {
  const r = getEntityData(companyId, MODULE, key(period));
  return (r?.data as CombinedFiled) ?? null;
}
export function saveCombinedFiled(companyId: string, data: CombinedFiled): void {
  upsertEntityData(companyId, MODULE, key(data.period), data);
}
export function deleteCombinedFiled(companyId: string, period: string): void {
  upsertEntityData(companyId, MODULE, key(period), null);
}
