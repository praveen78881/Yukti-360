/* ─────────────────────────────────────────────────────────────────────────────
   Seed a Yukti form's identity block from the company master.

   Identity lives under different roots per form — `pi` in ITR-2/3/4/5/6,
   `who` in ITR-1/7 (several carry both) — and the leaf names differ too
   (`name` vs `first`/`last`; `dob` vs `doi` vs `formed`). So rather than
   hard-coding one shape, this probes which root and which leaves actually
   exist on `S` and writes only into those.

   Nothing is ever overwritten: `setPath` refuses a leaf that already holds a
   value, so anything the CA typed always wins.
   ──────────────────────────────────────────────────────────────────────────── */
import type { Company } from '@/types/company';
import { boundPaths, setPath, repaint } from './itrBridge';

/** dd/mm/yyyy — the format every Yukti date input expects. */
export function toDDMMYYYY(value: string | undefined | null): string {
  if (!value) return '';
  const s = String(value).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Split a personal name for forms that store first/mid/last separately. */
function splitName(full: string): { first: string; mid: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', mid: '', last: '' };
  if (parts.length === 1) return { first: parts[0], mid: '', last: '' };
  return { first: parts[0], mid: parts.slice(1, -1).join(' '), last: parts[parts.length - 1] };
}

/** concept -> candidate leaf names, tried in order against whichever root exists. */
const LEAVES: Array<{ leaves: string[]; pick: (c: Company) => string | undefined }> = [
  { leaves: ['pan'],                       pick: (c) => c.entity_details?.pan },
  { leaves: ['dob', 'doi', 'formed'],      pick: (c) => toDDMMYYYY(c.entity_details?.dob ?? c.entity_details?.dateOfIncorporation ?? c.entity_details?.registrationDate) },
  { leaves: ['email'],                     pick: (c) => c.entity_details?.email },
  { leaves: ['mobile', 'phone'],           pick: (c) => c.entity_details?.phone },
  { leaves: ['addr1', 'addr', 'premises'], pick: (c) => c.entity_details?.address },
  { leaves: ['city'],                      pick: (c) => c.entity_details?.city },
  { leaves: ['pin', 'zip'],                pick: (c) => c.entity_details?.pincode },
];

/**
 * Fills only-empty identity leaves. Returns how many landed.
 * Safe to call repeatedly — a second call fills nothing.
 */
export function prefillFromCompany(frame: HTMLIFrameElement | null, company: Company): number {
  const bound = boundPaths(frame);
  if (bound.size === 0) return 0;
  const has = (root: string, leaf: string) => bound.has(`${root}.${leaf}`);

  let n = 0;
  for (const root of ['who', 'pi']) {
    // is this root used by the rendered form at all?
    let used = false;
    for (const p of bound) if (p.startsWith(`${root}.`)) { used = true; break; }
    if (!used) continue;

    // name: whole, or split across first/mid/last where the form wants that
    if (has(root, 'name')) {
      if (setPath(frame, `${root}.name`, company.name)) n++;
    } else if (has(root, 'first') || has(root, 'last')) {
      const { first, mid, last } = splitName(company.name);
      if (has(root, 'first') && first && setPath(frame, `${root}.first`, first)) n++;
      if (has(root, 'mid')   && mid   && setPath(frame, `${root}.mid`,   mid))   n++;
      if (has(root, 'last')  && last  && setPath(frame, `${root}.last`,  last))  n++;
    }

    for (const { leaves, pick } of LEAVES) {
      const value = pick(company);
      if (!value) continue;
      for (const leaf of leaves) {
        if (!has(root, leaf)) continue;
        if (setPath(frame, `${root}.${leaf}`, value)) n++;
        break;
      }
    }
  }

  if (n > 0) repaint(frame);
  return n;
}
