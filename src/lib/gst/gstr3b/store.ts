/**
 * Per-(company, return period) GSTR-3B persistence.
 *
 * Stored in entity_data under module 'gst' → section `gstr3b_<MMYYYY>`, so it
 * lives under the company like every other GST module, is company-sandboxed,
 * and auto-mirrors to Supabase. Works with no network — offline preparation of
 * a month's 3B is a first-class path, not a fallback.
 */

import { getEntityData, upsertEntityData } from '@/lib/offlineDb';
import { emptyGstr3bMonth } from '@/lib/accounting/gstr3bJson';
import type { Gstr3bPeriodRecord, Gstr3bPatch } from './types';
import { applyPatch } from './types';

const MODULE = 'gst';
const section = (period: string) => `gstr3b_${period}`;

/** Existing record for the period, or null. */
export function getGstr3bPeriod(companyId: string, period: string): Gstr3bPeriodRecord | null {
  if (!companyId || !period) return null;
  const rec = getEntityData(companyId, MODULE, section(period));
  return (rec?.data as Gstr3bPeriodRecord | undefined) ?? null;
}

/** Existing record, or a blank draft for the period (never null). */
export function getOrCreateGstr3bPeriod(companyId: string, period: string, gstin: string): Gstr3bPeriodRecord {
  return (
    getGstr3bPeriod(companyId, period) ?? {
      gstin,
      period,
      data: emptyGstr3bMonth(),
      status: 'draft',
      provenance: {},
      applied: [],
      updatedAt: new Date().toISOString(),
    }
  );
}

export function saveGstr3bPeriod(companyId: string, rec: Gstr3bPeriodRecord): void {
  if (!companyId || !rec?.period) return;
  upsertEntityData(companyId, MODULE, section(rec.period), rec);
}

/** Apply a source patch to the stored period and persist. Returns the new record. */
export function applyGstr3bPatch(
  companyId: string, period: string, gstin: string, patch: Gstr3bPatch,
  opts: { force?: boolean } = {},
): Gstr3bPeriodRecord {
  const next = applyPatch(getOrCreateGstr3bPeriod(companyId, period, gstin), patch, opts);
  saveGstr3bPeriod(companyId, next);
  return next;
}

/** Mark a period filed (portal ARN). */
export function markGstr3bFiled(companyId: string, period: string, arn: string): void {
  const rec = getGstr3bPeriod(companyId, period);
  if (!rec) return;
  saveGstr3bPeriod(companyId, { ...rec, status: 'filed', arn, updatedAt: new Date().toISOString() });
}
