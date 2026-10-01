/* ─────────────────────────────────────────────────────────────────────────────
   ITR form catalogue + entity→form routing.

   Single source of truth for WHICH ITR a given legal form may file. Kept as
   plain data so adding a form or re-pointing an entity never means touching
   a component.
   ──────────────────────────────────────────────────────────────────────────── */
import type { EntityType } from '@/lib/constants/entityTypes';

/** Assessment year this build ships. One year only, by design. */
export const AY = '2026-27' as const;

export type ItrKey = 'itr1' | 'itr2' | 'itr3' | 'itr4' | 'itr5' | 'itr6' | 'itr7';

export interface ItrMeta {
  key: ItrKey;
  /** Display name. Must match the Yukti build's own FORM.name — do not rename. */
  label: string;
  note: string;
  /** Statutory due date carried by the form's own FORM.due. */
  due: string;
}

export const ITR_META: Record<ItrKey, ItrMeta> = {
  itr1: { key: 'itr1', label: 'ITR-1',         note: 'Sahaj — salary, one house property & other sources (income ≤ ₹50L)', due: '2026-07-31' },
  itr2: { key: 'itr2', label: 'ITR-2',         note: 'Individuals & HUFs without business or professional income',          due: '2026-07-31' },
  itr3: { key: 'itr3', label: 'ITR-3',         note: 'Individuals & HUFs with business or professional income',             due: '2026-07-31' },
  itr4: { key: 'itr4', label: 'ITR-4 (Sugam)', note: 'Presumptive income — 44AD / 44ADA / 44AE',                            due: '2026-08-31' },
  itr5: { key: 'itr5', label: 'ITR-5',         note: 'Firms, LLPs, AOP/BOI and co-operative societies',                     due: '2026-08-31' },
  itr6: { key: 'itr6', label: 'ITR-6',         note: 'Companies other than those claiming exemption u/s 11',                due: '2026-10-31' },
  itr7: { key: 'itr7', label: 'ITR-7',         note: 'Trusts, societies and institutions u/s 139(4A)–(4D)',                 due: '2026-10-31' },
};

/**
 * Which ITRs each entity type may file. Order matters — the first entry is the
 * default tab.
 *
 * `section8` intentionally offers BOTH: a Section 8 company registered u/s
 * 12A/12AB files ITR-7, one that is not files ITR-6. The CA picks.
 */
export const ENTITY_FORMS: Partial<Record<EntityType, ItrKey[]>> = {
  individual:          ['itr1', 'itr2'],
  huf:                 ['itr2', 'itr3', 'itr4'],
  sole_proprietorship: ['itr3', 'itr4'],
  partnership:         ['itr5'],
  llp:                 ['itr5'],
  aop_boi:             ['itr5'],
  cooperative:         ['itr5'],
  pvt_ltd:             ['itr6'],
  opc:                 ['itr6'],
  public_ltd:          ['itr6'],
  section8:            ['itr7', 'itr6'],
  trust:               ['itr7'],
  society:             ['itr7'],
};

export function formsForEntity(entityType: EntityType | undefined): ItrKey[] {
  if (!entityType) return [];
  return ENTITY_FORMS[entityType] ?? [];
}

/** URL of the split Yukti build for a form. */
export function itrSrc(key: ItrKey): string {
  return `/tax-utilities/yukti/${key}/index.html`;
}

/** entity_data storage coordinates: (companyId, module, section). */
export const ITR_MODULE = `itr_ay${AY.replace('-', '')}`;   // itr_ay202627
