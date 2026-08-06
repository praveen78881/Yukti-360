// ─────────────────────────────────────────────────────────────────────────────
// Company 360 — one-CIN onboarding enrichment.
//
// Chain (all live, server-side keys via the gst-sandbox proxy):
//   1. CIN  → MCA Company Master Data      (name, address, state, capital, DOI)
//   2. PAN  → ITD registry (kyc/pan/search) (registered name, EMAIL, MOBILE, address)
//   3. PAN  → GST "GSTINs by PAN" in the company's state → list of registrations
//   4. best GSTIN → public GSTIN search     (trade name, scheme, reg date, address)
//   5. Cross-checks: MCA vs PAN vs GST names / dates / pincodes.
//
// Hard limits of the provider (surfaced honestly in the UI):
//   - MCA does NOT publish the company PAN — it is typed once, everything else cascades.
//   - The MCA Director Master Data API is DISCONTINUED — directors can't be fetched.
//   - There is no TAN-lookup API (only TAN validation) — TAN stays manual.
// ─────────────────────────────────────────────────────────────────────────────

import { sandboxClient } from '@/lib/gst/sandbox/client';
import { INDIAN_STATES } from '@/lib/constants/indianStates';
import { fetchMcaMasterData, extractPincode, parseCIN, type McaMasterDataRecord } from '@/lib/mca';

export interface PanRegistryInfo {
  pan: string;
  status?: string;              // valid | invalid
  fullName?: string;
  category?: string;            // Company / Individual / Firm …
  email?: string;
  mobile?: string;
  dateOfBirth?: string;         // DOI for companies, yyyy-mm-dd
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  raw?: unknown;
}

export interface GstRegistrationLite {
  gstin: string;
  legalName?: string;
  tradeName?: string;
  status?: string;              // Active / Cancelled
  type?: string;                // Regular / Composition
}

export interface GstRegistrationFull extends GstRegistrationLite {
  registrationDate?: string;    // yyyy-mm-dd
  constitution?: string;        // ctb
  natureOfBusiness?: string[];
  stateJurisdiction?: string;
  centreJurisdiction?: string;
  einvoiceStatus?: string;
  address?: string;
  city?: string;
  pincode?: string;
  raw?: unknown;
}

export interface CrossCheck {
  label: string;
  values: { source: string; value?: string }[];
  ok: boolean | null;           // null = not comparable (a side missing)
}

export interface Company360 {
  cin: string;
  mca: McaMasterDataRecord | null;
  pan: PanRegistryInfo | null;
  gstins: GstRegistrationLite[];
  gst: GstRegistrationFull | null;
  checks: CrossCheck[];
  notes: string[];
}

const dmyToIso = (s?: string): string | undefined => {
  if (!s) return undefined;
  const m = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : undefined;
};

/** Loose company-name equality: case/punctuation-insensitive, common suffixes normalised. */
export function namesMatch(a?: string, b?: string): boolean | null {
  if (!a || !b) return null;
  const norm = (s: string) => s.toUpperCase()
    .replace(/\bPVT\b\.?/g, 'PRIVATE')
    .replace(/\bLTD\b\.?/g, 'LIMITED')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim().replace(/\s+/g, ' ');
  return norm(a) === norm(b);
}

/** Full state name (any case) → 2-digit GST state code. */
export function gstStateCodeFromName(stateName?: string): string | undefined {
  if (!stateName) return undefined;
  const s = stateName.trim().toLowerCase();
  return INDIAN_STATES.find(x => x.name.toLowerCase() === s)?.gstCode;
}

/** Step 2 — ITD PAN registry: name + category + email + mobile + address. */
export async function fetchPanRegistry(pan: string): Promise<PanRegistryInfo | null> {
  const r = await sandboxClient.panSearch(pan.trim().toUpperCase(), 'live');
  if (!r.ok) return null;
  const d: any = (r.data as any)?.data;
  if (!d || typeof d !== 'object' || !d.pan) return null;
  const addr = d.address || {};
  return {
    pan: d.pan,
    status: d.status,
    fullName: d.full_name || undefined,
    category: d.category || undefined,
    email: d.email || undefined,
    mobile: d.mobile_number ? String(d.mobile_number) : undefined,
    dateOfBirth: dmyToIso(d.date_of_birth),
    address: addr.full_address || undefined,
    city: addr.city || undefined,
    state: addr.state || undefined,
    pincode: addr.pincode ? String(addr.pincode) : undefined,
    raw: r.data,
  };
}

/** Parse one raw GST registration record (from gstin search OR a by-PAN row). */
function parseGstRecord(d: any, raw?: unknown): GstRegistrationFull | null {
  if (!d || typeof d !== 'object' || !d.gstin) return null;
  const a = d.pradr?.addr;
  const addressParts = a
    ? [a.flno, a.bno, a.bnm, a.st, a.locality, a.loc, a.dst, a.stcd].map((x: unknown) => String(x ?? '').trim()).filter(Boolean)
    : [];
  return {
    gstin: d.gstin,
    legalName: d.lgnm || undefined,
    tradeName: d.tradeNam || undefined,
    status: d.sts || undefined,
    type: d.dty || undefined,
    registrationDate: dmyToIso(d.rgdt),
    constitution: d.ctb || undefined,
    natureOfBusiness: Array.isArray(d.nba) ? d.nba : undefined,
    stateJurisdiction: d.stj || undefined,
    centreJurisdiction: d.ctj || undefined,
    einvoiceStatus: d.einvoiceStatus || undefined,
    address: addressParts.length ? addressParts.join(', ') : undefined,
    city: a?.loc || undefined,
    pincode: a?.pncd ? String(a.pncd) : undefined,
    raw,
  };
}

type LiteWithRaw = GstRegistrationLite & { _rawData?: any };

/**
 * Step 3 — all GSTINs registered against the PAN in one state. The live response
 * embeds each registration's FULL record in `data`, so we keep it (`_rawData`)
 * and skip the extra per-GSTIN search call when it's complete.
 */
export async function fetchGstinsByPan(pan: string, gstStateCode: string): Promise<LiteWithRaw[]> {
  const r = await sandboxClient.gstinsByPan(pan.trim().toUpperCase(), gstStateCode, 'live');
  if (!r.ok) return [];
  const list: any[] = Array.isArray((r.data as any)?.data) ? (r.data as any).data : [];
  return list.map((row: any) => {
    const d = row?.data ?? row;
    return {
      gstin: row?.gstin || d?.gstin,
      legalName: d?.lgnm || undefined,
      tradeName: d?.tradeNam || undefined,
      status: d?.sts || undefined,
      type: d?.dty || undefined,
      _rawData: d,
    };
  }).filter(g => !!g.gstin);
}

/** Step 4 — full public registration record for one GSTIN. */
export async function fetchGstinDetails(gstin: string): Promise<GstRegistrationFull | null> {
  const r = await sandboxClient.gstinSearch(gstin, 'live');
  if (!r.ok) return null;
  const d: any = (r.data as any)?.data?.data ?? (r.data as any)?.data;
  return parseGstRecord(d, r.data);
}

/** Prefer an Active Regular registration; fall back to any Active, then the first. */
export function pickBestGstin(gstins: GstRegistrationLite[]): GstRegistrationLite | undefined {
  return gstins.find(g => g.status === 'Active' && g.type === 'Regular')
    ?? gstins.find(g => g.status === 'Active')
    ?? gstins[0];
}

function buildChecks(mca: McaMasterDataRecord | null, pan: PanRegistryInfo | null, gst: GstRegistrationFull | null): CrossCheck[] {
  const checks: CrossCheck[] = [];
  const push = (label: string, values: { source: string; value?: string }[], ok: boolean | null) =>
    checks.push({ label, values, ok });

  const mcaName = mca?.company_name, panName = pan?.fullName, gstName = gst?.legalName;
  if (mcaName || panName || gstName) {
    const pairs = [namesMatch(mcaName, panName), namesMatch(mcaName, gstName), namesMatch(panName, gstName)]
      .filter((x): x is boolean => x !== null);
    push('Registered name', [
      { source: 'MCA', value: mcaName }, { source: 'PAN (ITD)', value: panName }, { source: 'GST', value: gstName },
    ], pairs.length ? pairs.every(Boolean) : null);
  }

  const mcaDoi = mca?.company_registration_date, panDoi = pan?.dateOfBirth;
  if (mcaDoi || panDoi) {
    push('Date of incorporation', [
      { source: 'MCA', value: mcaDoi }, { source: 'PAN (ITD)', value: panDoi },
    ], mcaDoi && panDoi ? mcaDoi === panDoi : null);
  }

  const mcaPin = extractPincode(mca?.registered_office_address), panPin = pan?.pincode, gstPin = gst?.pincode;
  if (mcaPin || panPin || gstPin) {
    const present = [mcaPin, panPin, gstPin].filter(Boolean);
    push('Address pincode', [
      { source: 'MCA', value: mcaPin }, { source: 'PAN (ITD)', value: panPin }, { source: 'GST', value: gstPin },
    ], present.length > 1 ? present.every(p => p === present[0]) : null);
  }

  if (mca && gst) {
    const gstinPan = gst.gstin.substring(2, 12);
    push('GSTIN embeds the PAN', [
      { source: 'PAN', value: pan?.pan }, { source: 'GSTIN chars 3–12', value: gstinPan },
    ], pan ? pan.pan === gstinPan : null);
  }
  return checks;
}

/**
 * Run the whole enrichment. `pan` is optional — without it only the MCA leg runs
 * (MCA does not publish the PAN, so it cannot be discovered from the CIN alone).
 * Pass `opts.mca` to reuse an already-fetched MCA record (skips that call).
 */
export async function runCompany360(cin: string, pan?: string, opts?: { mca?: McaMasterDataRecord | null }): Promise<Company360> {
  const notes: string[] = [];
  const mca = opts?.mca !== undefined ? opts.mca : await fetchMcaMasterData(cin).catch(() => null);
  if (!mca) notes.push('No MCA master-data record found for this CIN.');

  let panInfo: PanRegistryInfo | null = null;
  let gstins: GstRegistrationLite[] = [];
  let gst: GstRegistrationFull | null = null;

  if (pan && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim().toUpperCase())) {
    const cleanPan = pan.trim().toUpperCase();
    // 2 + 3 in parallel — independent sources
    const stateCode = gstStateCodeFromName(mca?.company_state_code) ?? gstStateCodeFromName(parseCIN(cin)?.state);
    const [p, g] = await Promise.all([
      fetchPanRegistry(cleanPan).catch(() => null),
      stateCode ? fetchGstinsByPan(cleanPan, stateCode).catch(() => [] as GstRegistrationLite[]) : Promise.resolve([]),
    ]);
    panInfo = p;
    gstins = g;
    if (!p) notes.push('PAN registry lookup returned nothing — check the PAN or the plan’s KYC subscription.');
    if (!stateCode) notes.push('Could not derive the GST state code from the MCA state, so the GSTIN search was skipped.');
    else if (!g.length) notes.push(`No GST registration found for this PAN in state code ${stateCode}.`);

    const best = pickBestGstin(gstins) as LiteWithRaw | undefined;
    if (best) {
      // The by-PAN row usually carries the full record already — only fall back
      // to a separate GSTIN search when the embedded record is incomplete.
      gst = best._rawData?.pradr ? parseGstRecord(best._rawData, best._rawData) : null;
      if (!gst) gst = await fetchGstinDetails(best.gstin).catch(() => null);
    }
  }

  return { cin: cin.trim().toUpperCase(), mca, pan: panInfo, gstins, gst, checks: buildChecks(mca, panInfo, gst), notes };
}

// ─── Create-wizard prefill ────────────────────────────────────────────────────

/** CIN ownership code (positions 13-15) → the wizard's entity_type key. */
const ENTITY_TYPE_BY_CIN_CODE: Record<string, string> = {
  PTC: 'pvt_ltd', FTC: 'pvt_ltd', ULT: 'pvt_ltd', GAT: 'pvt_ltd',
  PLC: 'public_ltd', FLC: 'public_ltd', ULL: 'public_ltd', GAP: 'public_ltd',
  GOI: 'public_ltd', SGC: 'public_ltd',
  OPC: 'opc',
  NPL: 'section8',
};

export interface WizardPrefill {
  entity_type?: string;
  name?: string;
  pan?: string;
  cin?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;               // proper-case name matching the states dropdown
  pincode?: string;
  dateOfIncorporation?: string; // yyyy-mm-dd
  authorizedCapital?: number;
  paidUpCapital?: number;
  gstin?: string;
  gst_status?: 'regular' | 'composition';
}

/** Consolidate a Company360 profile into the create-wizard's field shape. */
export function buildWizardPrefill(p: Company360): WizardPrefill {
  const out: WizardPrefill = { cin: p.cin };

  const ownership = /^[LU]\d{5}[A-Z]{2}\d{4}([A-Z]{3})\d{6}$/.exec(p.cin)?.[1];
  if (ownership && ENTITY_TYPE_BY_CIN_CODE[ownership]) out.entity_type = ENTITY_TYPE_BY_CIN_CODE[ownership];

  out.name = p.mca?.company_name || p.pan?.fullName || p.gst?.legalName || undefined;
  if (p.pan?.pan) out.pan = p.pan.pan;
  if (p.pan?.email) out.email = p.pan.email;
  if (p.pan?.mobile && /\d{6,}/.test(p.pan.mobile)) out.phone = p.pan.mobile;

  out.dateOfIncorporation = (p.mca?.company_registration_date && /^\d{4}-\d{2}-\d{2}$/.test(p.mca.company_registration_date)
    ? p.mca.company_registration_date : undefined) ?? p.pan?.dateOfBirth;

  out.address = p.mca?.registered_office_address || p.gst?.address || p.pan?.address || undefined;
  out.pincode = extractPincode(p.mca?.registered_office_address) || p.gst?.pincode || p.pan?.pincode || undefined;

  const stateName = p.mca?.company_state_code || p.pan?.state;
  if (stateName) {
    const matched = INDIAN_STATES.find(s => s.name.toLowerCase() === stateName.trim().toLowerCase());
    if (matched) out.state = matched.name;
  }
  // City: GST principal place is the most structured source.
  out.city = p.gst?.city || p.pan?.city || undefined;

  if (typeof p.mca?.authorized_capital === 'number' && p.mca.authorized_capital > 0) out.authorizedCapital = p.mca.authorized_capital;
  if (typeof p.mca?.paidup_capital === 'number' && p.mca.paidup_capital > 0) out.paidUpCapital = p.mca.paidup_capital;

  const best = p.gst ?? pickBestGstin(p.gstins);
  if (best?.gstin && best.status === 'Active') {
    out.gstin = best.gstin;
    out.gst_status = /composition/i.test(best.type || '') ? 'composition' : 'regular';
  }
  return out;
}
