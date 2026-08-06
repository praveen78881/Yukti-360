/**
 * Previous-year figures typed directly on the Balance Sheet / P&L.
 *
 * Schedule III statements need a prior-year column even when last year's books
 * were never entered here. Any line's previous-year cell can be typed directly;
 * untyped lines default to NIL. Values persist per company + statement + FY
 * (entity_data, cloud-synced) keyed by the line label.
 */

import { getEntityData, upsertEntityData } from '@/lib/offlineDb';

const MODULE = 'py_overrides';

export type PyValues = Record<string, string>; // line label → raw typed string

export function loadPyValues(companyId: string, statement: 'bs' | 'pl', fyStartYear: string): PyValues {
  const rec = getEntityData(companyId, MODULE, `${statement}_${fyStartYear}`);
  return ((rec?.data as { values?: PyValues } | undefined)?.values) ?? {};
}

export function savePyValues(companyId: string, statement: 'bs' | 'pl', fyStartYear: string, values: PyValues): void {
  upsertEntityData(companyId, MODULE, `${statement}_${fyStartYear}`, { values, savedAt: new Date().toISOString() });
}

/** Numeric value of a typed cell — blank/absent = NIL (0). */
export function pyNum(values: PyValues, label: string): number {
  const raw = values[label];
  if (raw === undefined || raw.trim() === '') return 0;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}
