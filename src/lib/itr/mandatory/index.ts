/**
 * Registry of per-(form, AY) mandatory-field validators. Modules are lazy-loaded
 * so a 5-figure-line validator only ever loads for the form being validated.
 *
 * 13 released combinations: AY 2025-26 → ITR-1..7; AY 2026-27 → ITR-1..5, 7.
 * ITR-6 for AY 2026-27 is NOT yet released by the government — no schema, no
 * validator, and the shell must refuse the JSON download for that combination.
 */

import type { MandatoryChecker, MandatoryReport } from './types';

export type { MandatoryChecker, MandatoryReport, MissingField, MandatoryIssue } from './types';

type Loader = () => Promise<{ checkMandatory: MandatoryChecker }>;

const LOADERS: Record<string, Loader> = {
  'itr1_2025-26': () => import('./itr1-2025'),
  'itr2_2025-26': () => import('./itr2-2025'),
  'itr3_2025-26': () => import('./itr3-2025'),
  'itr4_2025-26': () => import('./itr4-2025'),
  'itr5_2025-26': () => import('./itr5-2025'),
  'itr6_2025-26': () => import('./itr6-2025'),
  'itr7_2025-26': () => import('./itr7-2025'),
  'itr1_2026-27': () => import('./itr1-2026'),
  'itr2_2026-27': () => import('./itr2-2026'),
  'itr3_2026-27': () => import('./itr3-2026'),
  'itr4_2026-27': () => import('./itr4-2026'),
  'itr5_2026-27': () => import('./itr5-2026'),
  'itr7_2026-27': () => import('./itr7-2026'),
};

/** True when the government has released this form for this AY. */
export function isFormReleased(form: string, ay: string): boolean {
  return `${form}_${ay}` in LOADERS;
}

/** Load the mandatory checker for a (form, AY); null when unreleased/unknown. */
export async function getMandatoryChecker(form: string, ay: string): Promise<MandatoryChecker | null> {
  const loader = LOADERS[`${form}_${ay}`];
  if (!loader) return null;
  try {
    const mod = await loader();
    return mod.checkMandatory;
  } catch {
    return null; // module not built yet — shell falls back to in-tool validation only
  }
}
