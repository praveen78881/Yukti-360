import { GSTR1_CONFIG } from './config';
import { generateGstr1Json } from './gstr1Json';
import { isGstin } from '@/lib/schemas/india';
import type { GSTR1Filing } from './types';

export interface ValidationError {
  section: string;
  row?: string;
  message: string;
}

function validateGstin(gstin: string): boolean {
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) return false;
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const v = chars.indexOf(gstin[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(v / 36) + (v % 36);
  }
  const check = (36 - (sum % 36)) % 36;
  return chars[check] === gstin[14];
}

export function validateFiling(filing: GSTR1Filing): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const inv of filing.b2b) {
    if (!validateGstin(inv.ctin)) {
      errors.push({ section: 'B2B', row: inv.inum, message: `Invalid GSTIN: ${inv.ctin}` });
    }
    if (inv.inum.length > 16) {
      errors.push({ section: 'B2B', row: inv.inum, message: 'Invoice number must be ≤ 16 characters' });
    }
    if (!inv.idt.match(/^\d{2}-\d{2}-\d{4}$/)) {
      errors.push({ section: 'B2B', row: inv.inum, message: 'Invoice date must be DD-MM-YYYY' });
    }
  }

  for (const inv of filing.b2cl) {
    const total = inv.itms.reduce((s, i) => s + (i.itm_det.txval || 0), 0);
    if (total <= GSTR1_CONFIG.B2CL_THRESHOLD) {
      errors.push({ section: 'B2CL', row: inv.inum, message: `Taxable value ₹${total} ≤ ₹1,00,000 threshold — should be in B2CS` });
    }
  }

  for (const h of filing.hsn) {
    if (!/^\d{4}(\d{2}(\d{2})?)?$/.test(h.hsn_sc)) {
      errors.push({ section: 'HSN', row: h.hsn_sc, message: `Invalid HSN/SAC code: ${h.hsn_sc}` });
    }
  }

  return errors;
}

export interface SchemaIssue {
  section: string;
  row?: string;
  field?: string;
  severity: 'error' | 'warning';
  message: string;
}

const DDMMYYYY = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-(19|20)\d\d$/;

/**
 * Pre-file schema check against the GSTN GSTR-1 request rules.
 *   severity 'error'   → the portal WILL reject the return (fix before filing)
 *   severity 'warning' → completeness / advisable before filing
 * Run this before Save so we never push a return that bounces.
 */
export function checkFilingSchema(filing: GSTR1Filing): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const err = (section: string, message: string, row?: string, field?: string) => issues.push({ section, message, severity: 'error', row, field });
  const warn = (section: string, message: string, row?: string, field?: string) => issues.push({ section, message, severity: 'warning', row, field });

  filing.b2cs.forEach((s, i) => {
    const row = `#${i + 1}`;
    if (!s.typ) err('B2CS', 'typ (E/OE) is required', row, 'typ');
    if (s.typ === 'E' && !s.etin) err('B2CS', 'etin (e-com GSTIN) required when typ = E', row, 'etin');
    if (s.rt == null) err('B2CS', 'rt (rate) is required', row, 'rt');
    if (!s.txval) err('B2CS', 'txval is required', row, 'txval');
  });

  filing.hsn.forEach((h, i) => {
    const row = h.hsn_sc || `#${i + 1}`;
    if (h.rt == null) err('HSN', 'rt (rate) is required — schema is rate-wise', row, 'rt');
    if (h.num == null) err('HSN', 'num (serial) is required', row, 'num');
    if (!/^[0-9]+$/.test(h.hsn_sc)) err('HSN', `hsn_sc must be numeric — got "${h.hsn_sc}"`, row, 'hsn_sc');
    else if (![4, 6, 8].includes(h.hsn_sc.length)) err('HSN', `hsn_sc must be 4, 6, or 8 digits — "${h.hsn_sc}" is ${h.hsn_sc.length} digit(s)`, row, 'hsn_sc');
    if (!h.uqc) err('HSN', 'uqc (unit) is required', row, 'uqc');
  });

  filing.cdnr.forEach((n, i) => {
    if (n.ctin && !validateGstin(n.ctin)) err('CDNR', `invalid GSTIN ${n.ctin}`, n.ctin);
    n.nt.forEach((note) => {
      const row = note.ntnum || `#${i + 1}`;
      if (!note.ntnum) err('CDNR', 'note number is required', row);
      if (!DDMMYYYY.test(note.ntdt || '')) err('CDNR', 'note date must be DD-MM-YYYY', row);
      if (!note.pos) warn('CDNR', 'Place of Supply (pos) missing', row, 'pos');
      if (!note.inv_typ) warn('CDNR', 'note supply type (inv_typ) missing', row, 'inv_typ');
    });
  });

  filing.cdnur.forEach((n, i) => {
    const row = n.ntnum || `#${i + 1}`;
    if (!n.ntnum) err('CDNUR', 'note number is required', row);
    if (!DDMMYYYY.test(n.ntdt || '')) err('CDNUR', 'note date must be DD-MM-YYYY', row);
    if (!n.typ) err('CDNUR', 'typ (B2CL/EXPWP/EXPWOP) is required', row, 'typ');
  });

  filing.b2b.forEach((inv) => {
    if (inv.ctin && !validateGstin(inv.ctin)) err('B2B', `invalid GSTIN ${inv.ctin}`, inv.inum);
    if (!DDMMYYYY.test(inv.idt || '')) err('B2B', 'invoice date must be DD-MM-YYYY', inv.inum);
  });

  if (filing.gt == null) warn('Return', 'gross turnover (gt) not entered — do not file with an estimate', undefined, 'gt');
  if (filing.cur_gt == null) warn('Return', 'current turnover (cur_gt) not entered', undefined, 'cur_gt');

  return issues;
}

// Top-level keys the GSP Save API accepts (per the "Save GSTR-1" recipe + file seclist).
// Offline-utility-only keys (version, hash) are deliberately EXCLUDED — GSTN's structure
// validation rejects them with RET191106 "Error in Json structure validation".
const SAVE_TOP_LEVEL = new Set([
  'gstin', 'fp', 'gt', 'cur_gt',
  'b2b', 'b2ba', 'b2cl', 'b2cla', 'b2cs', 'b2csa',
  'cdnr', 'cdnra', 'cdnur', 'cdnura',
  'exp', 'expa', 'at', 'ata', 'txpd', 'txpda',
  'hsn', 'nil', 'doc_issue', 'ecom', 'ecoma', 'supeco', 'supecoa',
]);

// Internal app keys that must NEVER reach the wire payload, at any nesting depth.
const FORBIDDEN_KEYS = new Set(['id', 'isAmended']);

// Envelope-level keys (not data sections) — excluded from the empty-section check.
const ENVELOPE_META = new Set(['gstin', 'fp', 'gt', 'cur_gt']);

/**
 * Structural check of the ACTUAL Save body (the exact object POSTed to GSTN), not the
 * model. This closes the gap where the model-level `checkFilingSchema` passes but GSTN
 * still rejects with RET191106 — e.g. offline-tool envelope keys (version/hash) or a
 * leaked internal key (id/isAmended) sitting in the payload. Run it on the same object
 * `gstr1Save` sends, so "no schema errors" only shows when GSTN would actually accept it.
 */
export function checkSaveBodyStructure(body: unknown): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    issues.push({ section: 'Body', severity: 'error', message: 'Save body is empty or not a JSON object' });
    return issues;
  }

  // 1) Unknown top-level keys — GSTN's envelope validation is strict (this is where
  //    version/hash land, and the direct cause of the RET191106 we hit on test).
  for (const k of Object.keys(body as Record<string, unknown>)) {
    if (!SAVE_TOP_LEVEL.has(k)) {
      const why = (k === 'version' || k === 'hash')
        ? ' — offline-utility-only key; the GSP Save API rejects it (RET191106). Strip it before Save.'
        : ' — not an accepted GSTR-1 Save envelope key (RET191106).';
      issues.push({ section: 'Body', field: k, severity: 'error', message: `unexpected top-level key "${k}"${why}` });
    }
  }

  // 2) Forbidden internal keys anywhere in the tree (blocker #4 regression guard).
  const seen = new Set<string>();
  const walk = (v: unknown, path: string) => {
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${path}[${i}]`)); return; }
    if (v && typeof v === 'object') {
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (FORBIDDEN_KEYS.has(k) && !seen.has(k)) {
          seen.add(k);
          issues.push({ section: 'Body', field: k, severity: 'error', message: `internal key "${k}" leaked into the payload (at ${path}.${k}) — must be stripped before Save` });
        }
        walk(val, `${path}.${k}`);
      }
    }
  };
  walk(body, '$');

  // 3) NO empty arrays ANYWHERE in the payload. GSTN structure validation rejects any
  //    empty array — an empty section block (`nil:{inv:[]}`), an empty HSN class
  //    (`hsn_b2b:[]`), an empty docs list, etc. A correct payload OMITS the key. This is
  //    the gate that must catch the sparse-filing regression the fully-populated fixture
  //    could not (RET191106). Recursive so nested empties (hsn_b2b, doc_det[].docs) are caught.
  const seenEmpty = new Set<string>();
  const walkEmpty = (v: unknown, path: string) => {
    if (Array.isArray(v)) {
      if (v.length === 0) {
        if (!seenEmpty.has(path)) { seenEmpty.add(path); issues.push({ section: 'Body', field: path, severity: 'error', message: `empty array at ${path} — omit the key entirely (GSTN rejects empty arrays). RET191106.` }); }
        return;
      }
      v.forEach((x, i) => walkEmpty(x, `${path}[${i}]`));
      return;
    }
    if (v && typeof v === 'object') {
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) walkEmpty(val, `${path}.${k}`);
    }
  };
  walkEmpty(body, '$');

  // 4) HSN must use the Phase-3 SPLIT wrapper `{ hsn_b2b:[…], hsn_b2c:[…] }` (FP ≥ 052025,
  //    server-bisect.js hsn_split). The legacy flat `data:[]` is REJECTED. Each row's hsn_sc
  //    must be 4/6/8 digits; SAC (99xxxx / service) rows must carry uqc "NA" and qty 0.
  const hsn = (body as Record<string, unknown>).hsn as Record<string, unknown> | undefined;
  if (hsn && typeof hsn === 'object' && !Array.isArray(hsn)) {
    if ('data' in hsn) {
      issues.push({ section: 'Body', field: 'hsn', severity: 'error', message: 'HSN uses the legacy flat `data:[]` shape — the Phase-3 Save expects hsn:{ hsn_b2b:[…], hsn_b2c:[…] }. RET191106.' });
    } else if (!('hsn_b2b' in hsn) && !('hsn_b2c' in hsn)) {
      issues.push({ section: 'Body', field: 'hsn', severity: 'error', message: 'HSN block has neither `hsn_b2b` nor `hsn_b2c` — Save expects hsn:{ hsn_b2b:[…], hsn_b2c:[…] }.' });
    }
    const rows = [
      ...(Array.isArray(hsn.hsn_b2b) ? (hsn.hsn_b2b as Array<Record<string, unknown>>) : []),
      ...(Array.isArray(hsn.hsn_b2c) ? (hsn.hsn_b2c as Array<Record<string, unknown>>) : []),
    ];
    for (const r of rows) {
      const code = String(r?.hsn_sc ?? '');
      if (!/^[0-9]+$/.test(code) || ![4, 6, 8].includes(code.length)) {
        issues.push({ section: 'Body', field: 'hsn_sc', severity: 'error', message: `HSN code "${code}" must be 4, 6, or 8 digits (it is ${code.length}). RET191106.` });
      }
      if (/^99/.test(code) && (r?.uqc !== 'NA' || Number(r?.qty) !== 0)) {
        issues.push({ section: 'Body', field: 'hsn', severity: 'error', message: `SAC "${code}" (service) must have uqc "NA" and qty 0 (got uqc "${String(r?.uqc)}", qty ${String(r?.qty)}).` });
      }
    }
  }

  // 5) Every date field must be DD-MM-YYYY (GSTN spec). Catches YYYY-MM-DD anywhere — most
  //    importantly amendment oidt/ont_dt/idt/nt_dt entered or seeded in ISO. (omon = MMYYYY.)
  const DATE_KEYS = new Set(['idt', 'nt_dt', 'oidt', 'ont_dt', 'sbdt']);
  const seenDate = new Set<string>();
  const walkDates = (v: unknown, path: string) => {
    if (Array.isArray(v)) { v.forEach((x, i) => walkDates(x, `${path}[${i}]`)); return; }
    if (v && typeof v === 'object') {
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (DATE_KEYS.has(k) && typeof val === 'string' && val && !DDMMYYYY.test(val)) {
          const sig = `${k}=${val}`;
          if (!seenDate.has(sig)) { seenDate.add(sig); issues.push({ section: 'Body', field: k, severity: 'error', message: `date "${k}" = "${val}" must be DD-MM-YYYY (at ${path}.${k}). RET191106.` }); }
        }
        walkDates(val, `${path}.${k}`);
      }
    }
  };
  walkDates(body, '$');

  // 6) DOC_ISSUE — no ghost/placeholder rows. Every docs row must carry real serials:
  //    from/to non-empty and not "0", totnum > 0. (The 6-class UI scaffold seeds blanks.)
  const di = (body as Record<string, unknown>).doc_issue as { doc_det?: Array<{ doc_num?: number; docs?: Array<Record<string, unknown>> }> } | undefined;
  if (di && typeof di === 'object' && Array.isArray(di.doc_det)) {
    for (const cls of di.doc_det) {
      for (const d of cls.docs ?? []) {
        const from = String(d.from ?? '').trim();
        const to = String(d.to ?? '').trim();
        const totnum = Number(d.totnum ?? 0);
        if (!from || !to || from === '0' || to === '0' || totnum <= 0) {
          issues.push({ section: 'Body', field: 'doc_issue', severity: 'error', message: `doc_issue class ${cls.doc_num}: placeholder serial row (from "${from}", to "${to}", totnum ${totnum}) — remove it before Save. RET191106.` });
        }
      }
    }
  }

  // 7) B2CS — no duplicate (sply_ty, typ, pos, rt, etin) combos, and csamt (template-mandated
  //    zero field) must be present on every row.
  const b2csRows = (body as Record<string, unknown>).b2cs;
  if (Array.isArray(b2csRows)) {
    const combo = new Map<string, number>();
    b2csRows.forEach((r: any, i: number) => {
      const key = `${r?.sply_ty}|${r?.typ ?? 'OE'}|${r?.pos}|${r?.rt}|${r?.etin ?? ''}`;
      combo.set(key, (combo.get(key) ?? 0) + 1);
      if (!(r && typeof r === 'object' && 'csamt' in r)) {
        issues.push({ section: 'Body', field: 'csamt', severity: 'error', message: `b2cs row #${i + 1} is missing csamt (template-mandated — send 0). RET191106.` });
      }
    });
    for (const [key, n] of combo) {
      if (n > 1) issues.push({ section: 'Body', field: 'b2cs', severity: 'error', message: `duplicate b2cs combo (${key}) appears ${n}× — aggregate into a single row. RET191106.` });
    }
  }

  return issues;
}

// ── The single mandatory validation engine ───────────────────────────────────
export type ValidateStatus = 'PASS' | 'WARNINGS' | 'BLOCKERS';

export interface Gstr1Finding {
  severity: 'error' | 'warning';
  section: string;   // section key/anchor for the "go to section" link (e.g. 'HSN', 'B2CL', 'Return')
  row?: string;
  field?: string;
  message: string;
}

export interface Gstr1ValidateResult {
  status: ValidateStatus;
  findings: Gstr1Finding[];
  blockers: number;   // count of severity 'error'
  warnings: number;   // count of severity 'warning'
}

// Standard GST rates (%) for the rate-wise summary tables.
const VALID_GST_RATES = new Set([0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28]);

/**
 * THE GSTR-1 validation gate. Pure client-side — ZERO API calls, ZERO credits — so it can
 * be run as often as the user likes. Composes the model schema check, the EXACT wire-body
 * structural check (HSN split, DD-MM-YYYY, no leaked/legacy keys), and the gate-only rules
 * (turnover + GSTIN required as BLOCKERS, B2CL threshold, rate list).
 *
 * status: BLOCKERS (any error → both Download-JSON & Start-e-Filing stay locked),
 *         WARNINGS (advisable; buttons unlock only on explicit acknowledge),
 *         PASS (clean → buttons unlock).
 */
export function validateGstr1(filing: GSTR1Filing): Gstr1ValidateResult {
  const findings: Gstr1Finding[] = [];
  const add = (severity: 'error' | 'warning', section: string, message: string, row?: string, field?: string) =>
    findings.push({ severity, section, message, row, field });

  // 1) Model-level schema rules — reuse checkFilingSchema, but its gt/cur_gt WARNINGS are
  //    re-raised as BLOCKERS below (the gate requires actuals, not just advises them).
  for (const i of checkFilingSchema(filing)) {
    if (i.field === 'gt' || i.field === 'cur_gt') continue;
    add(i.severity, i.section, i.message, i.row, i.field);
  }

  // 2) Envelope required fields — BLOCKERS.
  if (!filing.gstin || !filing.gstin.trim()) add('error', 'Return', 'GSTIN is required on the return envelope.', undefined, 'gstin');
  if (filing.gt == null || !(Number(filing.gt) >= 0)) add('error', 'Return', 'Gross turnover (gt) is required — enter the actual previous-FY turnover (no estimate).', undefined, 'gt');
  if (filing.cur_gt == null || !(Number(filing.cur_gt) >= 0)) add('error', 'Return', 'Current-period turnover (cur_gt) is required — enter the actual Apr-to-date turnover.', undefined, 'cur_gt');

  // 3) B2CL threshold — inter-state B2C invoices must exceed the limit (else they belong in B2CS).
  filing.b2cl.forEach((inv) => {
    const total = inv.itms.reduce((s, i) => s + (i.itm_det?.txval || 0), 0);
    if (total <= GSTR1_CONFIG.B2CL_THRESHOLD) add('error', 'B2CL', `Invoice ${inv.inum}: taxable ₹${total} ≤ ₹${GSTR1_CONFIG.B2CL_THRESHOLD} threshold — move it to B2CS.`, inv.inum);
  });

  // 4) Rate-list — the rate-wise summaries (B2CS, HSN) should carry a standard GST rate.
  filing.b2cs.forEach((s, i) => { if (s.rt != null && !VALID_GST_RATES.has(s.rt)) add('warning', 'B2CS', `Rate ${s.rt}% is not a standard GST rate.`, `#${i + 1}`, 'rt'); });
  filing.hsn.forEach((h) => { if (h.rt != null && !VALID_GST_RATES.has(h.rt)) add('warning', 'HSN', `HSN ${h.hsn_sc}: rate ${h.rt}% is not a standard GST rate.`, h.hsn_sc, 'rt'); });

  // 4a) GSTIN-format rulebook — every counterparty/operator GSTIN must be a valid
  //     15-char GSTIN. Malformed IDs are the #1 GSTN structural rejection.
  filing.b2b.forEach((inv) => { if (!isGstin(inv.ctin || '')) add('error', 'B2B', `Invalid recipient GSTIN "${inv.ctin}".`, inv.inum, 'ctin'); });
  filing.cdnr.forEach((n) => { if (!isGstin(n.ctin || '')) add('error', 'CDNR', `Invalid recipient GSTIN "${n.ctin}".`, undefined, 'ctin'); });
  (filing.b2ba ?? []).forEach((inv) => { if (!isGstin(inv.ctin || '')) add('error', 'B2BA', `Invalid recipient GSTIN "${inv.ctin}".`, inv.inum, 'ctin'); });
  (filing.cdnra ?? []).forEach((n) => { if (!isGstin(n.ctin || '')) add('error', 'CDNRA', `Invalid recipient GSTIN "${n.ctin}".`, undefined, 'ctin'); });
  filing.b2cs.forEach((s, i) => { if (s.typ === 'E' && !isGstin(s.etin || '')) add('error', 'B2CS', `E-commerce row needs a valid operator GSTIN (etin) — "${s.etin ?? ''}" is invalid.`, `#${i + 1}`, 'etin'); });

  // 4b) SUPECO (Table 14/15) etin — RET191152: every clttx/paytx row MUST carry a
  //     valid e-commerce operator GSTIN. Strict check on the derived + manual result.
  (filing.supeco?.clttx ?? []).forEach((t, i) => { if (!isGstin(t.etin || '')) add('error', 'SUPECO', `Table 14 row needs a valid ECO GSTIN (etin) — "${t.etin ?? ''}" is invalid. (RET191152)`, `clttx#${i + 1}`, 'etin'); });
  (filing.supeco?.paytx ?? []).forEach((t, i) => { if (!isGstin(t.etin || '')) add('error', 'SUPECO', `Table 15 row needs a valid ECO GSTIN (etin) — "${t.etin ?? ''}" is invalid. (RET191152)`, `paytx#${i + 1}`, 'etin'); });

  // 4c) omon-type amendments (b2csa/ata/txpda) — original month MUST be a PRIOR period
  //     (before the return's fp); once prior, warn to confirm it exists in filed history.
  const monthOrd = (p?: string) => (p && /^\d{6}$/.test(p)) ? parseInt(p.slice(2), 10) * 12 + parseInt(p.slice(0, 2), 10) : -1;
  const curOrd = monthOrd(filing.period);
  const checkOmon = (section: string, omon: string | undefined, row: string) => {
    if (!omon) { add('error', section, `${section}: original month (omon) is required.`, row, 'omon'); return; }
    if (monthOrd(omon) < 0) { add('error', section, `${section}: original month "${omon}" is not a valid MMYYYY.`, row, 'omon'); return; }
    if (monthOrd(omon) >= curOrd) add('error', section, `${section}: original month ${omon} must be a PRIOR period (before ${filing.period}).`, row, 'omon');
    else add('warning', section, `${section}: confirm original month ${omon} exists in your filed history. (RET191124)`, row, 'omon');
  };
  (filing.b2csa ?? []).forEach((s, i) => checkOmon('B2CSA', s.omon, `#${i + 1}`));
  (filing.ata ?? []).forEach((a, i) => checkOmon('ATA', a.omon, `#${i + 1}`));
  (filing.txpda ?? []).forEach((a, i) => checkOmon('TXPDA', a.omon, `#${i + 1}`));

  // 4d) date-based amendment original-period must be PRIOR (DD-MM-YYYY → MMYYYY).
  const dateMonthOrd = (dt?: string) => (dt && /^\d{2}-\d{2}-\d{4}$/.test(dt)) ? monthOrd(`${dt.slice(3, 5)}${dt.slice(6, 10)}`) : -1;
  const checkOrigDate = (section: string, origDt: string | undefined, row: string) => {
    if (!origDt) { add('error', section, `${section}: original invoice/note date is required.`, row, 'oidt'); return; }
    const o = dateMonthOrd(origDt);
    if (o < 0) { add('error', section, `${section}: original date "${origDt}" must be DD-MM-YYYY.`, row, 'oidt'); return; }
    if (o >= curOrd) add('error', section, `${section}: original date ${origDt} must be from a PRIOR period (before ${filing.period}).`, row, 'oidt');
    else add('warning', section, `${section}: confirm original ${origDt} exists in your filed history. (RET191124)`, row, 'oidt');
  };
  (filing.b2ba ?? []).forEach((inv, i) => checkOrigDate('B2BA', inv.origInvDt, inv.inum || `#${i + 1}`));
  (filing.b2cla ?? []).forEach((inv, i) => checkOrigDate('B2CLA', inv.origInvDt, inv.inum || `#${i + 1}`));
  (filing.expa ?? []).forEach((e, i) => checkOrigDate('EXPA', e.origInvDt, e.inum || `#${i + 1}`));
  (filing.cdnura ?? []).forEach((n, i) => checkOrigDate('CDNURA', n.ont_dt, n.ntnum || `#${i + 1}`));
  (filing.cdnra ?? []).forEach((n) => n.nt.forEach((note, j) => checkOrigDate('CDNRA', note.ont_dt, note.ntnum || `#${j + 1}`)));

  // 4e) WOPAY exports carry NO tax — IGST must be 0 (export without payment of tax).
  const checkWopay = (section: string, rows: { exp_typ: string; inum: string; itms: { iamt?: number }[] }[]) => {
    rows.forEach((inv) => { if (inv.exp_typ === 'WOPAY') inv.itms.forEach((it) => { if ((it.iamt ?? 0) > 0) add('error', section, `${section} ${inv.inum}: WOPAY (without payment) must have IGST 0 — found ₹${it.iamt}.`, inv.inum, 'iamt'); }); });
  };
  checkWopay('EXP', filing.exp);
  checkWopay('EXPA', filing.expa ?? []);

  // 4f) CDNURA typ↔pos — a B2CL note requires Place of Supply; EXP notes omit it.
  (filing.cdnura ?? []).forEach((n, i) => { if (n.typ === 'B2CL' && !n.pos) add('error', 'CDNURA', `CDNURA ${n.ntnum}: B2CL note requires a Place of Supply.`, n.ntnum || `#${i + 1}`, 'pos'); });

  // 4g) CDNRA SEZ two-tier gate — SEZ supplies (SEWP/SEWOP) are inter-state → IGST only, never CGST/SGST.
  (filing.cdnra ?? []).forEach((n) => n.nt.forEach((note, j) => {
    if (note.inv_typ === 'SEWP' || note.inv_typ === 'SEWOP') {
      note.itms.forEach((it) => {
        if ((it.itm_det.camt ?? 0) > 0 || (it.itm_det.samt ?? 0) > 0) add('error', 'CDNRA', `CDNRA ${note.ntnum}: SEZ note (${note.inv_typ}) is inter-state — carry IGST only, not CGST/SGST.`, note.ntnum || `#${j + 1}`, 'inv_typ');
      });
    }
  }));

  // 5) Exact wire-body structural check — the payload GSTN will actually receive.
  try {
    const body = JSON.parse(generateGstr1Json(filing)) as Record<string, unknown>;
    delete body.version; delete body.hash; // the Save path strips these; validate the real wire body
    for (const i of checkSaveBodyStructure(body)) add(i.severity, i.section, i.message, i.row, i.field);
  } catch (e: any) {
    add('error', 'Body', `Could not build the Save payload: ${e?.message ?? String(e)}`);
  }

  const blockers = findings.filter((f) => f.severity === 'error').length;
  const warnings = findings.filter((f) => f.severity === 'warning').length;
  const status: ValidateStatus = blockers > 0 ? 'BLOCKERS' : warnings > 0 ? 'WARNINGS' : 'PASS';
  return { status, findings, blockers, warnings };
}
