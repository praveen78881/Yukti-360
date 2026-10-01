/**
 * HSN / SAC codes — the format check, and a lookup against the GST portal's
 * public "Search HSN/SAC" service (the one behind services.gst.gov.in →
 * Services → Search HSN). The portal answers with permissive CORS, so the
 * browser asks it directly: no key, no proxy, nothing to configure.
 *
 *   by code         → needs ≥ 3 digits; returns every code under that prefix
 *   by description  → needs a category ('G' goods / 'S' services) and ≥ 3 chars
 *
 * Answers are cached (memory, then localStorage) because the portal throttles
 * bursts, and every failure degrades to "no suggestions" — the format check
 * never depends on the network.
 */

export interface HsnHit {
  code: string;
  description: string;
}

/** HSN (goods) is 4, 6 or 8 digits; SAC (services) is 6 digits starting 99. */
const HSN_SAC_RE = /^(\d{4}|\d{6}|\d{8})$/;

export function isValidHsnSac(code: string): boolean {
  return HSN_SAC_RE.test(code.trim());
}

/** Why a code fails, in words — null when it is fine or still empty. */
export function hsnSacProblem(code: string): string | null {
  const c = code.trim();
  if (!c) return null;
  if (/\D/.test(c)) return 'Digits only';
  if (!HSN_SAC_RE.test(c)) return 'Must be 4, 6 or 8 digits';
  return null;
}

const ENDPOINT = 'https://services.gst.gov.in/commonservices/hsn/search/qsearch';
const CACHE_KEY = 'ca_hsn_cache_v1';
const CACHE_MAX = 300;
const MIN_CODE_DIGITS = 3;
const MIN_DESC_CHARS = 3;
const TIMEOUT_MS = 8000;

const memory = new Map<string, HsnHit[]>();

function loadCache(): Record<string, HsnHit[]> {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') ?? {}; } catch { return {}; }
}

function saveCache(all: Record<string, HsnHit[]>) {
  try {
    const keys = Object.keys(all);
    for (const k of keys.slice(0, Math.max(0, keys.length - CACHE_MAX))) delete all[k];
    localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch { /* storage full or blocked — the in-memory cache still works */ }
}

async function query(params: string, signal?: AbortSignal): Promise<HsnHit[]> {
  const hot = memory.get(params);
  if (hot) return hot;
  const disk = loadCache();
  if (disk[params]) {
    memory.set(params, disk[params]);
    return disk[params];
  }
  if (signal?.aborted) return [];

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  signal?.addEventListener('abort', () => ctl.abort(), { once: true });
  try {
    const res = await fetch(`${ENDPOINT}?${params}`, { signal: ctl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    // {"data":[{"c":"8471","n":"AUTOMATIC DATA PROCESSING MACHINES…"}]} — or an
    // {"errorCode":"500"} body for an input the portal does not like.
    const body = (await res.json()) as { data?: Array<{ c?: string; n?: string }> };
    const hits = (body.data ?? [])
      .filter((x) => x.c && x.n)
      .map((x) => ({ code: String(x.c), description: String(x.n).trim() }));
    memory.set(params, hits);
    disk[params] = hits;
    saveCache(disk);
    return hits;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Codes under a prefix (3–8 digits). Empty when too short or unreachable. */
export function searchHsnByCode(code: string, signal?: AbortSignal): Promise<HsnHit[]> {
  const digits = code.replace(/\D/g, '');
  if (digits.length < MIN_CODE_DIGITS) return Promise.resolve([]);
  return query(`inputText=${digits}&selectedType=byCode&category=null`, signal);
}

/** Codes whose description matches — goods first, services when goods has none. */
export async function searchHsnByDescription(text: string, signal?: AbortSignal): Promise<HsnHit[]> {
  const t = text.trim();
  if (t.length < MIN_DESC_CHARS) return [];
  const goods = await query(`inputText=${encodeURIComponent(t)}&selectedType=byDesc&category=G`, signal);
  if (goods.length || signal?.aborted) return goods;
  return query(`inputText=${encodeURIComponent(t)}&selectedType=byDesc&category=S`, signal);
}

/** The portal's own wording for an exact code, or null when unknown / offline. */
export async function describeHsn(code: string, signal?: AbortSignal): Promise<string | null> {
  const c = code.trim();
  if (!isValidHsnSac(c)) return null;
  const hits = await searchHsnByCode(c, signal);
  return hits.find((h) => h.code === c)?.description ?? null;
}
