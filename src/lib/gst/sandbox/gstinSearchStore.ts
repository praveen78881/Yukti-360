// Local store for GSTIN search results. Once a GSTIN is searched (one live API
// call), its full details are saved here so it never needs to be fetched again —
// clicking it later shows the stored data. Deleting removes it immediately; a
// later search then re-fetches. Persisted per company via offlineDb entity_data.

import { getEntityData, upsertEntityData } from '@/lib/offlineDb';

export interface GstinSearchRecord {
  gstin: string;
  tradeName: string;
  legalName: string;
  status: string;        // sts (Active / …)
  details: Record<string, unknown>; // full taxpayer object from the API
  searchedAt: string;    // ISO timestamp
}

const MODULE = 'gst';
const SECTION = 'gstin_search_history';

export function listSearches(companyId: string): GstinSearchRecord[] {
  const rec = getEntityData(companyId, MODULE, SECTION);
  const arr = (rec?.data as GstinSearchRecord[]) ?? [];
  if (!Array.isArray(arr)) return [];
  return [...arr].sort((a, b) => (b.searchedAt || '').localeCompare(a.searchedAt || ''));
}

export function getSearch(companyId: string, gstin: string): GstinSearchRecord | null {
  return listSearches(companyId).find((r) => r.gstin === gstin.toUpperCase()) ?? null;
}

export function saveSearch(companyId: string, rec: GstinSearchRecord): void {
  const others = listSearches(companyId).filter((r) => r.gstin !== rec.gstin);
  upsertEntityData(companyId, MODULE, SECTION, [rec, ...others]);
}

export function deleteSearch(companyId: string, gstin: string): void {
  const remaining = listSearches(companyId).filter((r) => r.gstin !== gstin.toUpperCase());
  upsertEntityData(companyId, MODULE, SECTION, remaining);
}
