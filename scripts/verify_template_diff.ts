// ACCEPTANCE CRITERION: prove ZERO structural deviation between the certified
// builder (generateGstr1Json) and GSTR1-SAVE-TEMPLATE.json.
//
// It builds a filing that populates EVERY section (incl. all 8 amendments),
// emits the wire JSON, strips the offline-envelope keys the Save path also
// strips (version/hash), and diffs the recursive KEY STRUCTURE against the
// frozen template. Any key present in one but not the other = FAIL.
import { generateGstr1Json } from '@/lib/gstr1/gstr1Json';
import fs from 'node:fs';
import path from 'node:path';

const templatePath = path.resolve(process.cwd(), '..', 'GSTR1-SAVE-TEMPLATE.json');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

const it6 = (rt: number, txval: number, iamt = 0, camt = 0, samt = 0, csamt = 0) => ({ num: 1, itm_det: { rt, txval, iamt, camt, samt, csamt } });

const filing: any = {
  id: 'f', company_id: 'c', period: '072026', gstin: '29ABDCA9939R1ZK', status: 'draft',
  created_at: '', updated_at: '', gt: 3782969, cur_gt: 850000,
  b2b: [
    { id: 'b1', ctin: '33AAACL1523A1ZG', inum: 'SHOW/2026/001', idt: '05-07-2026', val: 187000, pos: '33', rchrg: 'N', inv_typ: 'R', itms: [it6(18, 100000, 18000), { num: 2, itm_det: { rt: 28, txval: 50000, iamt: 14000, camt: 0, samt: 0, csamt: 5000 } }] },
    { id: 'b2', ctin: '33AAACL1523A1ZG', inum: 'SHOW/2026/003', idt: '10-07-2026', val: 42000, pos: '33', rchrg: 'Y', inv_typ: 'R', itms: [it6(5, 40000, 2000)] },
  ],
  b2cl: [
    { id: 'l1', pos: '27', inum: 'SHOWL/2026/001', idt: '09-07-2026', val: 374000, itms: [{ num: 1, itm_det: { rt: 18, txval: 200000, iamt: 36000, csamt: 0 } }] },
  ],
  b2cs: [
    { id: 's1', sply_ty: 'INTRA', typ: 'OE', pos: '29', rt: 18, txval: 60000, camt: 5400, samt: 5400, csamt: 0 },
    { id: 's2', sply_ty: 'INTER', typ: 'OE', pos: '27', rt: 12, txval: 25000, iamt: 3000, csamt: 0 },
    { id: 's3', sply_ty: 'INTER', typ: 'E', etin: '20ALYPD6528PQC5', pos: '33', rt: 18, txval: 18000, iamt: 3240, csamt: 0 },
  ],
  exp: [
    { id: 'e1', exp_typ: 'WPAY', inum: 'EXP/2026/010', idt: '07-07-2026', val: 295000, sbnum: '9988776', sbdt: '05-07-2026', sbpcode: 'INMAA1', itms: [{ txval: 250000, rt: 18, iamt: 45000, csamt: 0 }] },
    { id: 'e2', exp_typ: 'WOPAY', inum: 'EXP/2026/011', idt: '12-07-2026', val: 120000, itms: [{ txval: 120000, rt: 0, iamt: 0, csamt: 0 }] },
  ],
  cdnr: [
    { id: 'c1', ctin: '33AAACL1523A1ZG', ntty: 'C', nt: [{ ntnum: 'CN/2026/010', ntdt: '16-07-2026', val: 23600, pos: '33', rchrg: 'N', inv_typ: 'R', itms: [it6(18, 20000, 3600)] }] },
    { id: 'c2', ctin: '33AAACL1523A1ZG', ntty: 'D', nt: [{ ntnum: 'DN/2026/001', ntdt: '18-07-2026', val: 5900, pos: '33', rchrg: 'N', inv_typ: 'R', itms: [it6(18, 5000, 900)] }] },
  ],
  cdnur: [
    { id: 'u1', typ: 'B2CL', ntty: 'C', ntnum: 'CNU/2026/010', ntdt: '16-07-2026', pos: '27', val: 59000, itms: [{ num: 1, itm_det: { rt: 18, txval: 50000, iamt: 9000, csamt: 0 } }] },
    { id: 'u2', typ: 'EXPWP', ntty: 'D', ntnum: 'DNU/2026/001', ntdt: '18-07-2026', pos: '27', val: 11800, itms: [{ num: 1, itm_det: { rt: 18, txval: 10000, iamt: 1800, csamt: 0 } }] },
  ],
  nil: [
    { id: 'n1', sply_ty: 'INTRB2B', nil_amt: 15000, expt_amt: 8000, ngsup_amt: 2000 },
    { id: 'n2', sply_ty: 'INTRB2C', nil_amt: 12000, expt_amt: 5000, ngsup_amt: 1000 },
  ],
  at: [
    { id: 'a1', pos: '29', sply_ty: 'INTRA', itms: [{ rt: 18, ad_amt: 30000, iamt: 0, camt: 2700, samt: 2700, csamt: 0 }] },
    { id: 'a2', pos: '27', sply_ty: 'INTER', itms: [{ rt: 12, ad_amt: 10000, iamt: 1200, camt: 0, samt: 0, csamt: 0 }] },
  ],
  txpd: [
    { id: 't1', pos: '29', sply_ty: 'INTRA', itms: [{ rt: 18, ad_amt: 15000, iamt: 0, camt: 1350, samt: 1350, csamt: 0 }] },
  ],
  hsn: [
    { id: 'h1', num: 1, hsn_sc: '8471', desc: 'Automatic data processing machines', user_desc: 'Laptops and desktops', uqc: 'NOS', qty: 10, val: 185000, txval: 185000, rt: 18, supplyClass: 'B2B', iamt: 28800, camt: 4800, samt: 4800, csamt: 0 },
    { id: 'h2', num: 2, hsn_sc: '998314', desc: 'IT consulting services', user_desc: 'Software consulting', uqc: 'NA', qty: 0, val: 40000, txval: 40000, rt: 5, supplyClass: 'B2B', iamt: 2000, camt: 0, samt: 0, csamt: 0 },
    { id: 'h3', num: 1, hsn_sc: '1001', desc: 'Wheat and meslin', user_desc: 'Wheat', uqc: 'KGS', qty: 1000, val: 38000, txval: 38000, rt: 0, supplyClass: 'B2C', iamt: 0, camt: 0, samt: 0, csamt: 0 },
  ],
  doc_issue: [
    { id: 'd1', doc_num: 1, docs: [{ num: 1, from: 'SHOW/2026/001', to: 'SHOW/2026/010', totnum: 10, cancel: 1, net_issue: 9 }] },
  ],
  // ── all 8 amendments ──
  b2ba: [
    { id: 'ba1', ctin: '33AAACL1523A1ZG', inum: 'MB2B/2026/OLD1', idt: '15-06-2026', val: 23600, pos: '33', rchrg: 'N', inv_typ: 'R', origInvNum: 'MB2B/2026/OLD1', origInvDt: '15-06-2026', isAmended: true, itms: [it6(18, 20000, 3600)] },
  ],
  b2cla: [
    { id: 'la1', pos: '33', inum: 'MB2CL/2026/OLD1', idt: '16-06-2026', val: 295000, origInvNum: 'MB2CL/2026/OLD1', origInvDt: '16-06-2026', isAmended: true, itms: [{ num: 1, itm_det: { rt: 18, txval: 250000, iamt: 45000, csamt: 0 } }] },
  ],
  b2csa: [
    { id: 'sa1', omon: '062026', sply_ty: 'INTRA', typ: 'OE', pos: '29', rt: 18, txval: 8000, iamt: 0, camt: 720, samt: 720, csamt: 0, isAmended: true },
  ],
  expa: [
    { id: 'ea1', exp_typ: 'WPAY', inum: 'MEXP/2026/OLD1', idt: '18-06-2026', val: 118000, sbnum: '7896111', sbdt: '10-06-2026', sbpcode: 'INMAA1', origInvNum: 'MEXP/2026/OLD1', origInvDt: '18-06-2026', isAmended: true, itms: [{ txval: 100000, rt: 18, iamt: 18000, csamt: 0 }] },
  ],
  cdnra: [
    { id: 'ca1', ctin: '33AAACL1523A1ZG', ntty: 'C', isAmended: true, nt: [{ ntnum: 'MCN/2026/OLD1', ntdt: '15-06-2026', val: 5900, pos: '33', rchrg: 'N', inv_typ: 'R', ont_num: 'MCN/2026/OLD1', ont_dt: '15-06-2026', itms: [it6(18, 5000, 900)] }] },
  ],
  cdnura: [
    { id: 'ua1', typ: 'B2CL', ntty: 'C', ntnum: 'MCNU/2026/OLD1', ntdt: '15-06-2026', pos: '33', val: 11800, ont_num: 'MCNU/2026/OLD1', ont_dt: '15-06-2026', isAmended: true, itms: [{ num: 1, itm_det: { rt: 18, txval: 10000, iamt: 1800, csamt: 0 } }] },
  ],
  ata: [
    { id: 'ata1', omon: '062026', pos: '29', sply_ty: 'INTRA', itms: [{ rt: 18, ad_amt: 10000, iamt: 0, camt: 900, samt: 900, csamt: 0 }] },
  ],
  txpda: [
    { id: 'txa1', omon: '062026', pos: '29', sply_ty: 'INTRA', itms: [{ rt: 18, ad_amt: 6000, iamt: 0, camt: 540, samt: 540, csamt: 0 }] },
  ],
  supeco: {
    clttx: [{ id: 'sc1', etin: '27AAGCM1234P1Z7', suppval: 10000, igst: 1800, cgst: 0, sgst: 0, cess: 0 }],
    paytx: [{ id: 'sp1', etin: '27AAGCM1234P1Z7', suppval: 5000, igst: 900, cgst: 0, sgst: 0, cess: 0 }],
  },
  rcm_overrides: {},
};

// The Save path (saveBodies.ts) strips these offline-envelope keys — mirror it so
// we compare like-for-like against the template (which is the SAVE body shape).
const emit = JSON.parse(generateGstr1Json(filing));
delete emit.version;
delete emit.hash;

// Recursive structural signature: dotted key-paths with array indices collapsed
// to `[]`, unioned across every element (so per-row optional-field variation is
// captured, not just row 0).
function paths(node: any, prefix: string, into: Set<string>) {
  if (Array.isArray(node)) {
    for (const el of node) paths(el, `${prefix}[]`, into);
  } else if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) {
      const p = prefix ? `${prefix}.${k}` : k;
      into.add(p);
      paths(node[k], p, into);
    }
  }
}

const emitPaths = new Set<string>();
const tmplPaths = new Set<string>();
paths(emit, '', emitPaths);
paths(template, '', tmplPaths);

const missingInEmit = [...tmplPaths].filter((p) => !emitPaths.has(p)).sort();   // template has it, we don't emit it
const extraInEmit = [...emitPaths].filter((p) => !tmplPaths.has(p)).sort();     // we emit it, template lacks it

console.log(`Template paths: ${tmplPaths.size}  |  Emit paths: ${emitPaths.size}`);
console.log(`Top-level template keys: ${Object.keys(template).join(', ')}`);
console.log(`Top-level emit keys     : ${Object.keys(emit).join(', ')}`);

if (missingInEmit.length === 0 && extraInEmit.length === 0) {
  console.log('\n✅ ZERO structural deviation — emitted Save body matches GSTR1-SAVE-TEMPLATE.json exactly.\n');
  process.exit(0);
} else {
  if (missingInEmit.length) console.log(`\n❌ In TEMPLATE but NOT emitted (${missingInEmit.length}):\n   ${missingInEmit.join('\n   ')}`);
  if (extraInEmit.length) console.log(`\n❌ Emitted but NOT in TEMPLATE (${extraInEmit.length}):\n   ${extraInEmit.join('\n   ')}`);
  console.log('');
  process.exit(1);
}
