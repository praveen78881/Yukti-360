// Verify generateGstr1Json emits the EXACT template shape for the changed sections.
import { generateGstr1Json } from '@/lib/gstr1/gstr1Json';

let pass = 0, fail = 0;
const keys = (o: any) => Object.keys(o).sort().join(',');
function check(name: string, got: string, want: string) {
  if (got === want) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       got : ${got}\n       want: ${want}`); }
}

const item6 = { num: 1, itm_det: { rt: 18, txval: 100, iamt: 18, camt: 0, samt: 0, csamt: 0 } };
const itemInter = { num: 1, itm_det: { rt: 18, txval: 100, iamt: 18, csamt: 0 } };

const filing: any = {
  id: 'f', company_id: 'c', period: '072026', gstin: '29ABDCA9939R1ZK', status: 'draft',
  created_at: '', updated_at: '', gt: 100, cur_gt: 50,
  b2b: [{ ctin: '33AAACL1523A1ZG', inum: 'I1', idt: '05-07-2026', val: 118, pos: '33', rchrg: 'N', inv_typ: 'R', itms: [item6] }],
  b2cl: [{ pos: '27', inum: 'L1', idt: '09-07-2026', val: 118, itms: [item6] }],
  b2cs: [], exp: [],
  // same CTIN with BOTH a credit and a debit note → must merge into ONE ctin group
  cdnr: [
    { id: 'c1', ctin: '33AAACL1523A1ZG', ntty: 'C', nt: [{ ntnum: 'CN1', ntdt: '16-07-2026', val: 118, pos: '33', inv_typ: 'R', itms: [item6] }] },
    { id: 'c2', ctin: '33AAACL1523A1ZG', ntty: 'D', nt: [{ ntnum: 'DN1', ntdt: '18-07-2026', val: 118, pos: '33', inv_typ: 'R', itms: [item6] }] },
  ],
  cdnur: [
    { id: 'u1', typ: 'B2CL', ntty: 'C', ntnum: 'CNU1', ntdt: '16-07-2026', pos: '27', val: 118, itms: [item6] },
    { id: 'u2', typ: 'EXPWP', ntty: 'D', ntnum: 'DNU1', ntdt: '18-07-2026', pos: '27', val: 118, itms: [item6] }, // EXP → pos must be omitted
  ],
  nil: [], at: [], txpd: [],
  hsn: [
    { id: 'h1', num: 1, hsn_sc: '8471', desc: 'Machines', user_desc: 'Laptops', uqc: 'NOS', qty: 10, val: 118, txval: 100, rt: 18, supplyClass: 'B2B', iamt: 18, camt: 0, samt: 0, csamt: 0 },
    { id: 'h2', num: 2, hsn_sc: '998314', desc: 'IT svc', uqc: 'NOS', qty: 5, val: 105, txval: 100, rt: 5, supplyClass: 'B2B', iamt: 5, camt: 0, samt: 0, csamt: 0 }, // SAC → uqc NA / qty 0
    { id: 'h3', num: 3, hsn_sc: '1001', desc: 'Wheat', uqc: 'KGS', qty: 1000, val: 38, txval: 38, rt: 0, supplyClass: 'B2C', iamt: 0, camt: 0, samt: 0, csamt: 0 }, // 0-tax → fields still present
  ],
  doc_issue: [],
  // two amend notes for the SAME ctin → must merge into ONE cdnra ctin group, each note keeping ont_num/ont_dt
  cdnra: [
    { id: 'ca1', ctin: '33AAACL1523A1ZG', ntty: 'C', nt: [{ ntnum: 'CN9', ntdt: '16-07-2026', val: 118, pos: '33', inv_typ: 'R', rchrg: 'N', ont_num: 'OCN9', ont_dt: '16-06-2026', itms: [item6] }] },
    { id: 'ca2', ctin: '33AAACL1523A1ZG', ntty: 'D', nt: [{ ntnum: 'DN9', ntdt: '18-07-2026', val: 118, pos: '33', inv_typ: 'R', rchrg: 'N', ont_num: 'ODN9', ont_dt: '18-06-2026', itms: [item6] }] },
  ],
  b2ba: [], b2cla: [], b2csa: [], expa: [], cdnura: [],
  rcm_overrides: {},
  supeco: { clttx: [{ id: 's1', etin: '27AAGCM1234P1Z7', suppval: 10000, igst: 1800, cgst: 0, sgst: 0, cess: 0 }], paytx: [] },
};

const j = JSON.parse(generateGstr1Json(filing));

console.log('=== itm_det field counts ===');
check('b2b itm_det = 6 fields', keys(j.b2b[0].inv[0].itms[0].itm_det), keys(item6.itm_det));
check('b2cl itm_det = 4 fields (no camt/samt)', keys(j.b2cl[0].inv[0].itms[0].itm_det), keys(itemInter.itm_det));
check('cdnur itm_det = 4 fields (no camt/samt)', keys(j.cdnur[0].itms[0].itm_det), keys(itemInter.itm_det));
check('cdnur B2CL keeps pos', String('pos' in j.cdnur[0]), 'true');
check('cdnur EXPWP omits pos', String('pos' in j.cdnur[1]), 'false');

console.log('=== cdnr: one CTIN group, per-note ntty, schema-complete ===');
check('cdnr merged to ONE ctin group', String(j.cdnr.length), '1');
check('cdnr group has BOTH notes', String(j.cdnr[0].nt.length), '2');
check('cdnr note ntty preserved (C then D)', `${j.cdnr[0].nt[0].ntty},${j.cdnr[0].nt[1].ntty}`, 'C,D');
check('cdnr note keys complete', keys(j.cdnr[0].nt[0]), keys({ nt_num: 0, nt_dt: 0, ntty: 0, pos: 0, rchrg: 0, inv_typ: 0, val: 0, itms: 0 }));
check('cdnr note rchrg defaulted', j.cdnr[0].nt[0].rchrg, 'N');

console.log('=== hsn: tax fields always present + user_desc + SAC ===');
check('hsn 0-tax row keeps iamt/camt/samt/csamt', keys(j.hsn.hsn_b2c[0]), keys({ num: 0, hsn_sc: 0, desc: 0, uqc: 0, qty: 0, txval: 0, rt: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 }));
check('hsn user_desc emitted when set', j.hsn.hsn_b2b[0].user_desc, 'Laptops');
check('hsn SAC → uqc NA', j.hsn.hsn_b2b[1].uqc, 'NA');
check('hsn SAC → qty 0', String(j.hsn.hsn_b2b[1].qty), '0');
check('hsn 0-tax iamt is literally 0', String(j.hsn.hsn_b2c[0].iamt), '0');

console.log('=== cdnra: merged ctin group + ont_num/ont_dt per note ===');
check('cdnra merged to ONE ctin group', String(j.cdnra.length), '1');
check('cdnra group has BOTH notes', String(j.cdnra[0].nt.length), '2');
check('cdnra note ntty preserved (C then D)', `${j.cdnra[0].nt[0].ntty},${j.cdnra[0].nt[1].ntty}`, 'C,D');
check('cdnra note carries ont_num', j.cdnra[0].nt[0].ont_num, 'OCN9');
check('cdnra note carries ont_dt', j.cdnra[0].nt[0].ont_dt, '16-06-2026');
check('cdnra note keys complete', keys(j.cdnra[0].nt[0]), keys({ ont_num: 0, ont_dt: 0, nt_num: 0, nt_dt: 0, ntty: 0, pos: 0, rchrg: 0, inv_typ: 0, val: 0, itms: 0 }));

console.log('=== supeco (Table 14) ===');
check('supeco.clttx row keys', keys(j.supeco.clttx[0]), keys({ etin: 0, suppval: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 }));
check('supeco has no empty paytx', String('paytx' in j.supeco), 'false');

console.log(`\nRESULT: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
