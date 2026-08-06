// Track Returns — confirm which returns are FILED on the portal for a period, so
// the "As filed on portal" view only ever shows genuinely-filed data for the
// EXACT period selected (never a mismatched or unfiled period).
// Endpoint: GET /gst/compliance/tax-payer/gstrs/{year}/{month}/track
//   → data.data.EFiledlist[] = { arn, ret_prd, mof, dof, rtntype, status, valid }
import { sandboxClient } from './client';

export interface FiledReturn {
  arn: string; ret_prd: string; mof: string; dof: string; rtntype: string; status: string; valid: string;
}

/** The filed-returns list (EFiledlist) for a period; [] on any error/empty. */
export async function fetchFiledReturns(year: string, month: string, token: string): Promise<FiledReturn[]> {
  const r = await sandboxClient.trackReturns(year, month, token);
  if (!r.ok) return [];
  const d = (r.data as any)?.data?.data ?? (r.data as any)?.data ?? r.data;
  const list = d?.EFiledlist ?? d?.efiledlist ?? [];
  return Array.isArray(list) ? list : [];
}

const digits = (s?: string) => (s || '').replace(/\D/g, '');
const isR1 = (t?: string) => /^GSTR-?1A?$/i.test((t || '').trim()); // GSTR1 / GSTR-1 / GSTR1A

/**
 * The filed GSTR-1 (or 1A) record for this EXACT period, if present and Filed.
 * The ret_prd match is the key safety belt: if the portal returns a record for a
 * different period (e.g. sandbox test canned data), it will NOT be treated as
 * filed-for-this-period — so wrong-period data can never bind to the wrong month.
 */
export function findGstr1Filing(list: FiledReturn[], period: string): FiledReturn | null {
  const want = digits(period); // MMYYYY
  return list.find((f) =>
    isR1(f.rtntype) &&
    /filed/i.test(f.status || '') &&
    // EXACT return-period match. A record with a blank/absent ret_prd must NOT
    // bind to the selected month — otherwise canned/sandbox data (or a portal
    // record missing its period) shows up under the wrong month.
    !!f.ret_prd && digits(f.ret_prd) === want,
  ) ?? null;
}
