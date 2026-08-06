// SPARSE-FILING REGRESSION GUARD (RET191106). The template-diff only exercises the
// FULLY-POPULATED fixture; sparse data takes different emit paths (empty buckets, ghost
// doc rows, dropped zero-fields, duplicate b2cs). This reproduces exactly that failing
// class of filing and asserts the emitted wire body is GSTN-clean, PLUS a generic
// invariant scan (no [] anywhere, no ""/"0" doc serials), PLUS that the validator GATE
// independently blocks a dirty body.
import { generateGstr1Json } from '@/lib/gstr1/gstr1Json';
import { checkSaveBodyStructure } from '@/lib/gstr1/gstr1Validate';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean, x = '') => { if (c) { pass++; console.log(`  ✅ ${n}`); } else { fail++; console.log(`  ❌ ${n} ${x}`); } };

// The failing filing: 1–2 b2cs (DUPLICATE combo) + hsn B2C-only + one real doc class + one ghost.
const filing: any = {
  id: 'f', company_id: 'c', period: '072026', gstin: '29ABDCA9939R1ZK', status: 'draft',
  created_at: '', updated_at: '', gt: 500000, cur_gt: 120000,
  b2b: [], b2cl: [],
  b2cs: [
    { id: 's1', sply_ty: 'INTRA', typ: 'OE', pos: '29', rt: 18, txval: 1000, camt: 90, samt: 90 }, // csamt UNSET
    { id: 's2', sply_ty: 'INTRA', typ: 'OE', pos: '29', rt: 18, txval: 2000, camt: 180, samt: 180 }, // SAME combo → must merge
  ],
  exp: [], cdnr: [], cdnur: [], nil: [], at: [], txpd: [],
  hsn: [
    { id: 'h1', num: 1, hsn_sc: '8471', desc: 'Goods', uqc: 'NOS', qty: 15, val: 3540, txval: 3000, rt: 18, supplyClass: 'B2C', iamt: 0, camt: 270, samt: 270, csamt: 0 },
  ],
  doc_issue: [
    { id: 'd1', doc_num: 1, docs: [{ num: 1, from: 'INV/2026/1', to: 'INV/2026/10', totnum: 10, cancel: 0, net_issue: 10 }] },
    { id: 'd2', doc_num: 2, docs: [{ num: 1, from: '', to: '', totnum: 0, cancel: 0, net_issue: 0 }] }, // GHOST scaffold row
  ],
  b2ba: [], b2cla: [], b2csa: [], expa: [], cdnra: [], cdnura: [], ata: [], txpda: [], rcm_overrides: {},
};

const body = JSON.parse(generateGstr1Json(filing));
delete body.version; delete body.hash;
console.log('=== emitted sparse wire body ===');
console.log(JSON.stringify(body, null, 2));

console.log('=== assertions ===');
// b2cs: aggregated to ONE row, csamt present (=0), txval summed
ok('b2cs aggregated to a single row', Array.isArray(body.b2cs) && body.b2cs.length === 1, JSON.stringify(body.b2cs));
ok('b2cs row carries csamt (template-mandated 0)', body.b2cs?.[0] && 'csamt' in body.b2cs[0] && body.b2cs[0].csamt === 0);
ok('b2cs txval summed (1000+2000=3000)', body.b2cs?.[0]?.txval === 3000);
ok('b2cs INTRA carries camt+samt, no iamt', body.b2cs?.[0] && 'camt' in body.b2cs[0] && 'samt' in body.b2cs[0] && !('iamt' in body.b2cs[0]));
// hsn: b2c-only → NO hsn_b2b key
ok('hsn present with hsn_b2c only, NO hsn_b2b key', body.hsn && 'hsn_b2c' in body.hsn && !('hsn_b2b' in body.hsn), JSON.stringify(body.hsn));
// doc_issue: only the real class survives
ok('doc_issue has exactly one class (doc_num 1)', body.doc_issue?.doc_det?.length === 1 && body.doc_issue.doc_det[0].doc_num === 1);

// GENERIC INVARIANT SCAN — recursively: no empty arrays, no ""/"0" doc serials anywhere.
const emptyArrays: string[] = [];
const badSerials: string[] = [];
const scan = (v: any, path: string) => {
  if (Array.isArray(v)) {
    if (v.length === 0) emptyArrays.push(path);
    v.forEach((x, i) => scan(x, `${path}[${i}]`));
    return;
  }
  if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v)) {
      if ((k === 'from' || k === 'to') && (String(val).trim() === '' || String(val).trim() === '0')) badSerials.push(`${path}.${k}="${val}"`);
      scan(val, `${path}.${k}`);
    }
  }
};
scan(body, '$');
ok('invariant: NO empty arrays anywhere', emptyArrays.length === 0, emptyArrays.join(', '));
ok('invariant: NO empty/"0" doc serials', badSerials.length === 0, badSerials.join(', '));

// GATE PROOF — a DIRTY body (as the builder must never emit) must be BLOCKED by the validator.
console.log('=== validator gate on a DIRTY body ===');
const dirty = {
  gstin: '29ABDCA9939R1ZK', fp: '072026', gt: 1, cur_gt: 1,
  hsn: { hsn_b2b: [], hsn_b2c: [{ num: 1, hsn_sc: '8471', uqc: 'NOS', qty: 1, txval: 1000, rt: 18, iamt: 0, camt: 90, samt: 90, csamt: 0 }] }, // empty hsn_b2b:[]
  b2cs: [
    { sply_ty: 'INTRA', typ: 'OE', pos: '29', rt: 18, txval: 1000, camt: 90, samt: 90 }, // missing csamt
    { sply_ty: 'INTRA', typ: 'OE', pos: '29', rt: 18, txval: 2000, camt: 180, samt: 180 }, // duplicate combo
  ],
  doc_issue: { doc_det: [{ doc_num: 2, docs: [{ num: 1, from: '', to: '', totnum: 0, cancel: 0, net_issue: 0 }] }] }, // ghost row
};
const errs = checkSaveBodyStructure(dirty).filter((i) => i.severity === 'error').map((i) => i.message);
console.log(errs.map((m) => `   • ${m}`).join('\n'));
ok('gate blocks empty hsn_b2b:[]', errs.some((m) => /empty array/i.test(m) && /hsn_b2b/.test(m)));
ok('gate blocks missing csamt', errs.some((m) => /missing csamt/i.test(m)));
ok('gate blocks duplicate b2cs combo', errs.some((m) => /duplicate b2cs combo/i.test(m)));
ok('gate blocks ghost doc row', errs.some((m) => /placeholder serial row/i.test(m)));

console.log(`\nRESULT: ${pass} passed, ${fail} failed\n`);
if (fail) process.exit(1);
