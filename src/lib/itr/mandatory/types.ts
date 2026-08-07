/**
 * Mandatory-field validation contract — one module per (ITR form, assessment year),
 * generated from the OFFICIAL ITD JSON schema + the ITD validation-rules document
 * for that exact form-year. A module checks the JSON the tool exports (shape
 * `{ ITR: { ITRn: {...} } }`) and reports every required field that is missing
 * or empty, plus any category-A rule violations checkable on the JSON alone.
 *
 * Modules live at src/lib/itr/mandatory/<form>-<year>.ts (e.g. itr1-2025.ts for
 * AY 2025-26) and are lazy-loaded via index.ts. Each module is SELF-CONTAINED:
 * it embeds its own distilled required-tree — it must NOT import the raw schema.
 */

export interface MissingField {
  /** JSON path inside the ITR payload, e.g. "ITR.ITR1.PersonalInfo.PAN" */
  path: string;
  /** Human label the CA recognises, e.g. "PAN of the assessee" */
  label: string;
  /** Optional pointer to where in the UI this is filled */
  hint?: string;
}

export interface MandatoryIssue {
  path: string;
  msg: string;
  /** Rule id from the ITD validation-rules doc when applicable */
  rule?: string;
}

export interface MandatoryReport {
  form: string;          // 'itr1'..'itr7'
  ay: string;            // '2025-26' | '2026-27'
  schemaVersion: string; // from the official schema file used
  /** Required by the schema / rules but absent or empty in the JSON */
  missing: MissingField[];
  /** Category-A rule violations (return would be rejected on upload) */
  errors: MandatoryIssue[];
  warnings: MandatoryIssue[];
  ok: boolean;           // missing.length === 0 && errors.length === 0
}

export type MandatoryChecker = (json: unknown) => MandatoryReport;

/* ── Shared helpers every module may use ────────────────────────────────────── */

/** Resolve a dot path on the payload; returns undefined when any hop is absent. */
export function at(json: unknown, path: string): unknown {
  let cur: unknown = json;
  for (const seg of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/** True when a value counts as "not filled": undefined/null/''/empty array. */
export function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}
