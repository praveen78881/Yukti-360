/* ─────────────────────────────────────────────────────────────────────────────
   ITR draft snapshot — capture / restore.

   The unit of persistence is the Yukti form's own `S` working-state object,
   serialised whole. That is deliberately NOT a DOM scrape: `S` already holds
   every field AND every dynamically added grid row, so the shell never needs
   to know a single field name and nothing is lost when a section repaints.

   Storage key triple: (companyId, module = itr_ay202627, section = itrN).
   ──────────────────────────────────────────────────────────────────────────── */
import { getEntityData, upsertEntityData } from '@/lib/offlineDb';
import { ITR_MODULE, AY, type ItrKey } from './itrForms';

export interface ItrSnapshot {
  /** JSON.stringify of the form's S object. */
  state: string;
  savedAt: string;
  ay: string;
}

export function loadSnapshot(companyId: string, key: ItrKey): ItrSnapshot | null {
  const rec = getEntityData(companyId, ITR_MODULE, key);
  const data = rec?.data as ItrSnapshot | undefined;
  return data && typeof data === 'object' && typeof data.state === 'string' ? data : null;
}

export function saveSnapshot(companyId: string, key: ItrKey, state: string): void {
  upsertEntityData(companyId, ITR_MODULE, key, {
    state,
    savedAt: new Date().toISOString(),
    ay: AY,
  } satisfies ItrSnapshot);
}

/** Rough "has the user actually entered anything" signal, for status text. */
export function snapshotSize(snap: ItrSnapshot | null): number {
  return snap ? snap.state.length : 0;
}
