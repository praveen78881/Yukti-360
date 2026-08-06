// GSTR-1 filing gate helpers — the dirty-hash that re-locks Download-JSON / e-File
// on ANY data change, and the section-anchor mapping for "go to section" links.
//
// The hash is computed over the EXACT wire body (generateGstr1Json), so it moves
// whenever anything that would be filed changes — a field edit, an add, a delete,
// an import. Validation stores the hash it validated; if the live hash differs,
// the gate re-locks and the UI shows "Re-validation required".

import type { GSTR1Filing } from './types';
import { generateGstr1Json } from './gstr1Json';

/** Stable content hash of the return's wire body (djb2). Any change moves it. */
export function hashFiling(filing: GSTR1Filing): string {
  let json: string;
  try {
    json = generateGstr1Json(filing);
  } catch {
    // If the body can't even be built, hash the raw model so edits still re-lock.
    json = JSON.stringify(filing);
  }
  let h = 5381;
  for (let i = 0; i < json.length; i++) {
    h = ((h << 5) + h + json.charCodeAt(i)) | 0; // h*33 + c
  }
  return (h >>> 0).toString(36) + ':' + json.length.toString(36);
}

/** Map a validation finding's section label to the page's drill-in section key,
 *  or null when it isn't a jumpable section (envelope/body-level findings). */
export function sectionAnchor(section: string): string | null {
  const s = section.trim().toLowerCase();
  const MAP: Record<string, string> = {
    b2b: 'b2b', b2ba: 'b2b', b2cl: 'b2cl', b2cla: 'b2cl', b2cs: 'b2cs',
    cdnr: 'cdnr', cdnur: 'cdnur', exp: 'exp', hsn: 'hsn', nil: 'nil',
    at: 'at', txpd: 'txpd', doc: 'doc', doc_issue: 'doc', supeco: 'supeco',
  };
  return MAP[s] ?? null;
}
