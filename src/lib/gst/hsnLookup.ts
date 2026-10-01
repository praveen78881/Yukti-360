/**
 * HSN / SAC codes — the format check, and a lookup against the GST portal's
 * public "Search HSN/SAC" service (the one behind services.gst.gov.in →
 * Services → Search HSN). The portal answers with permissive CORS, so the
 * browser asks it directly: no key, no proxy, nothing to configure.
 *
 *   by code         → needs ≥ 3 digits; returns every code under that prefix
 *   by description  → needs a category ('G' goods / 'S' services) and ≥ 3 chars
 *   verify          → is this exact code on the portal? (a well-formed code
 *                     the portal does not know is not a valid HSN)
 *
 * Answers are cached (memory, then localStorage) because the portal throttles
 * bursts. When the portal cannot be reached, the searches give nothing and a
 * verification gives "unknown" — the format check alone has to do then.
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

/** Why a code fails the format check, in words — null when fine or still empty. */
export function hsnSacProblem(code: string): string | null {
  const c = code.trim();
  if (!c) return null;
  if (/\D/.test(c)) return 'Digits only';
  if (!HSN_SAC_RE.test(c)) return 'Must be 4, 6 or 8 digits';
  return null;
}

/** The message for a code the portal does not know. */
export const HSN_NOT_GENUINE = 'Please enter a valid HSN number';

const ENDPOINT = 'https://services.gst.gov.in/commonservices/hsn/search/qsearch';
const CACHE_KEY = 'ca_hsn_cache_v1';
const CACHE_MAX = 300;
const MIN_CODE_DIGITS = 3;
const MIN_DESC_CHARS = 3;
const TIMEOUT_MS = 8000;

const memory = new Map<string, HsnHit[]>();
/** Portal verdicts for exact codes, for the synchronous checks at save time. */
const verdicts = new Map<string, boolean>();

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

/** One portal query; null when the portal could not be asked. */
async function query(params: string, signal?: AbortSignal): Promise<HsnHit[] | null> {
  const hot = memory.get(params);
  if (hot) return hot;
  const disk = loadCache();
  if (disk[params]) {
    memory.set(params, disk[params]);
    return disk[params];
  }
  if (signal?.aborted) return null;

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  signal?.addEventListener('abort', () => ctl.abort(), { once: true });
  try {
    const res = await fetch(`${ENDPOINT}?${params}`, { signal: ctl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    // {"data":[{"c":"8471","n":"AUTOMATIC DATA PROCESSING MACHINES…"}]} — or an
    // {"errorCode":"500"} body for an input the portal does not like.
    const body = (await res.json()) as { data?: Array<{ c?: string; n?: string }>; errorCode?: string };
    if (!Array.isArray(body.data)) return body.errorCode ? [] : null;
    const hits = body.data
      .filter((x) => x.c && x.n)
      .map((x) => ({ code: String(x.c), description: String(x.n).trim() }));
    memory.set(params, hits);
    disk[params] = hits;
    saveCache(disk);
    return hits;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const byCode = (digits: string) => `inputText=${digits}&selectedType=byCode&category=null`;

/** Codes under a prefix (3–8 digits). Empty when too short or unreachable. */
export async function searchHsnByCode(code: string, signal?: AbortSignal): Promise<HsnHit[]> {
  const digits = code.replace(/\D/g, '');
  if (digits.length < MIN_CODE_DIGITS) return [];
  const hits = (await query(byCode(digits), signal)) ?? [];
  // An exact hit settles the code's verdict for free.
  if (hits.length && isValidHsnSac(digits)) verdicts.set(digits, hits.some((h) => h.code === digits));
  return hits;
}

/** Codes whose description matches — goods first, services when goods has none. */
export async function searchHsnByDescription(text: string, signal?: AbortSignal): Promise<HsnHit[]> {
  const t = text.trim();
  if (t.length < MIN_DESC_CHARS) return [];
  const goods = (await query(`inputText=${encodeURIComponent(t)}&selectedType=byDesc&category=G`, signal)) ?? [];
  if (goods.length || signal?.aborted) return goods;
  return (await query(`inputText=${encodeURIComponent(t)}&selectedType=byDesc&category=S`, signal)) ?? [];
}

/** The portal's own wording for an exact code, or null when unknown / offline. */
export async function describeHsn(code: string, signal?: AbortSignal): Promise<string | null> {
  const c = code.trim();
  if (!isValidHsnSac(c)) return null;
  const hits = await searchHsnByCode(c, signal);
  return hits.find((h) => h.code === c)?.description ?? null;
}

/** Is this exact code on the portal? true / false, or null when the portal
 *  could not be asked — the format check alone has to do then. */
export async function verifyHsn(code: string, signal?: AbortSignal): Promise<boolean | null> {
  const c = code.trim();
  if (!isValidHsnSac(c)) return false;
  const known = verdicts.get(c);
  if (known !== undefined) return known;
  const hits = await query(byCode(c), signal);
  if (hits === null) return null;
  const ok = hits.some((h) => h.code === c);
  verdicts.set(c, ok);
  return ok;
}

/** The portal's verdict on a code so far, without asking it: true, false, or
 *  undefined when it has not been (or could not be) checked. */
export function hsnVerdict(code: string): boolean | undefined {
  return verdicts.get(code.trim());
}

/** Checks every well-formed code with the portal, waiting at most `timeoutMs`
 *  in all; returns the first code the portal rejects, or null when all pass or
 *  the portal could not be asked in time. */
export async function firstRejectedHsn(codes: string[], timeoutMs = 3500): Promise<string | null> {
  const unique = [...new Set(codes.map((c) => c.trim()).filter(isValidHsnSac))];
  if (!unique.length) return null;
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
  await Promise.race([Promise.all(unique.map((c) => verifyHsn(c))), timeout]);
  return unique.find((c) => verdicts.get(c) === false) ?? null;
}
