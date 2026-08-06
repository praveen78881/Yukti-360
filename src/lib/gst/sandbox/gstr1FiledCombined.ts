// Combined GSTR-1 + GSTR-1A import for one period.
//   1. GSTR-1 summary  → which GSTR-1 sections have data
//   2. GSTR-1A summary → which GSTR-1A (amendment return) sections have data
//   3. fetch ONLY the populated sections of each
//   4. merge into one section-wise snapshot; "no data" is a clean empty state.
// Token-based (the caller supplies a live taxpayer session — see session.ts).

import { sandboxClient } from './client';
import { fetchGstr1MonthDetail, type FiledSection } from './gstr1FiledDetail';
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
  const pop1 = s1.ok ? populatedFromSummary(s1.data) : [];

  onProgress?.('GSTR-1A summary');
  const s1a = await sandboxClient.gstr1aSummary(year, month, sessionToken, 'long'); calls++;
  const pop1a = s1a.ok ? populatedFromSummary(s1a.data) : [];

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
