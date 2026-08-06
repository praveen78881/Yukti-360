import type { Company } from '@/types/company';
import type { TDSRegisterRow } from '@/lib/accounting/tdsCompute';
import type { TCSRegisterRow } from '@/lib/accounting/tcsCompute';

/* ─────────────────────────────────────────────────────────────────────────────
   Books → TDS/TCS Register-tool bridge.

   The register utility (/tax-utilities/tds-tcs-register.html) keeps its state in
   an object `D = { master, tds[], tcs[], rec }` and round-trips it via its own
   Save/Open JSON. This module builds that exact payload from the books-derived
   TDS/TCS registers so the app can push it into the tool's iframe with
   postMessage({ type: 'LOAD_REGISTER_DATA', payload }).

   Only the tool's *input* keys are populated — every derived field (rate,
   thresholds, interest, quarters, due dates) is recomputed by the tool itself.
   ──────────────────────────────────────────────────────────────────────────── */

interface RegisterToolRow {
  [key: string]: string | number;
}

export interface RegisterToolPayload {
  master: Record<string, string>;
  tds: RegisterToolRow[];
  tcs: RegisterToolRow[];
  rec: Record<string, string>;
}

/** '194C' from 'Sec 194C' / '194C (Contractors)' / 'TDS 194C'. */
function cleanSection(section: string): string {
  const m = section.match(/(\d{3}[A-Z]{0,2}|206C\(?[0-9A-Z]+\)?|192A?|194[A-Z]{0,2})/i);
  return m ? m[1].toUpperCase() : section.trim();
}

export function buildRegisterToolPayload(opts: {
  company: Company;
  fyLabel: string;   // e.g. '2025-26'
  tdsRows: TDSRegisterRow[];
  tcsRows: TCSRegisterRow[];
}): RegisterToolPayload {
  const { company, fyLabel, tdsRows, tcsRows } = opts;
  const ed = (company.entity_details || {}) as { pan?: string; tan?: string; address?: string };
  const startYear = parseInt(fyLabel.slice(0, 4), 10);
  const ayLabel = Number.isFinite(startYear) ? `${startYear + 1}-${String(startYear + 2).slice(2)}` : '';

  return {
    master: {
      name: company.name || '',
      pan: (ed.pan || '').toUpperCase(),
      tan: (ed.tan || '').toUpperCase(),
      addr: ed.address || '',
      fy: fyLabel,
      ay: ayLabel,
    },
    tds: tdsRows.map((r, i) => ({
      vno: String(i + 1),
      dpay: r.date,
      pname: r.deducteeName || '',
      ppan: r.pan || '',
      sec: cleanSection(r.section || ''),
      gross: r.amount,
      act: r.tdsAmount,
    })),
    tcs: tcsRows.map((r, i) => ({
      vno: String(i + 1),
      dpay: r.date,
      pname: r.buyerName || '',
      ppan: r.pan || '',
      sec: cleanSection(r.section || '206C(1H)'),
      gross: r.saleAmount,
      act: r.tcsAmount,
    })),
    rec: {},
  };
}
