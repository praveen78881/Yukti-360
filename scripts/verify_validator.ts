// Broken-variants suite: take a VALID filing, break one thing at a time, and
// assert validateGstr1 flags it as a BLOCKER. Guards against schema regressions.
import { validateGstr1 } from '@/lib/gstr1/gstr1Validate';

let pass = 0, fail = 0;

const base = (): any => ({
  id: 'f', company_id: 'c', period: '072026', gstin: '29ABDCA9939R1ZK', status: 'draft', created_at: '', updated_at: '',
  gt: 3782969, cur_gt: 850000,
  b2b: [{ ctin: '33AAACL1523A1ZG', inum: 'I1', idt: '05-07-2026', val: 118, pos: '33', rchrg: 'N', inv_typ: 'R', itms: [{ num: 1, itm_det: { rt: 18, txval: 100, iamt: 18, camt: 0, samt: 0, csamt: 0 } }] }],
  b2cl: [], b2cs: [], exp: [], cdnr: [], cdnur: [], nil: [], at: [], txpd: [],
  hsn: [{ id: 'h', num: 1, hsn_sc: '8471', desc: 'x', uqc: 'NOS', qty: 1, val: 118, txval: 100, rt: 18, supplyClass: 'B2B', iamt: 18, camt: 0, samt: 0, csamt: 0 }],
  doc_issue: [], b2ba: [], b2cla: [], b2csa: [], expa: [], cdnra: [], cdnura: [], rcm_overrides: {},
});

// The clean base must PASS the gate (no blockers).
{
  const r = validateGstr1(base());
  if (r.status !== 'BLOCKERS') { pass++; console.log(`  PASS  base is clean (status=${r.status})`); }
  else { fail++; console.log(`  FAIL  base should be clean but has blockers:\n        ${r.findings.filter((f:any)=>f.severity==='error').map((f:any)=>`[${f.section}] ${f.message}`).join('\n        ')}`); }
}

function expectBlocker(name: string, mutate: (f: any) => void, wantSection: string) {
  const f = base(); mutate(f);
  const r = validateGstr1(f);
  const hit = r.findings.find((x: any) => x.severity === 'error' && x.section === wantSection);
  if (r.status === 'BLOCKERS' && hit) { pass++; console.log(`  PASS  ${name} → BLOCKER [${wantSection}]`); }
  else { fail++; console.log(`  FAIL  ${name} → expected BLOCKER [${wantSection}]; got status=${r.status}, sections=[${r.findings.filter((x:any)=>x.severity==='error').map((x:any)=>x.section).join(',')}]`); }
}

console.log('\n=== Broken variants (each must be a BLOCKER) ===');
expectBlocker('missing gross turnover (gt)',      (f) => { delete f.gt; },                         'Return');
expectBlocker('missing current turnover (cur_gt)',(f) => { delete f.cur_gt; },                     'Return');
expectBlocker('missing envelope GSTIN',           (f) => { f.gstin = ''; },                        'Return');
expectBlocker('invalid B2B recipient GSTIN',      (f) => { f.b2b[0].ctin = '33ABC'; },             'B2B');
expectBlocker('invalid CDNR recipient GSTIN',     (f) => { f.cdnr = [{ id:'c', ctin:'BADGSTIN', ntty:'C', nt:[{ ntnum:'CN1', ntdt:'16-07-2026', val:118, pos:'33', inv_typ:'R', itms:[{num:1,itm_det:{rt:18,txval:100,iamt:18}}] }] }]; }, 'CDNR');
expectBlocker('B2CS typ E without valid etin',    (f) => { f.b2cs = [{ id:'s', sply_ty:'INTER', typ:'E', etin:'nope', pos:'27', rt:18, txval:1000, iamt:180 }]; }, 'B2CS');
expectBlocker('SUPECO clttx invalid etin (RET191152)', (f) => { f.supeco = { clttx:[{ id:'s', etin:'BAD', suppval:10000, igst:1800, cgst:0, sgst:0, cess:0 }], paytx:[] }; }, 'SUPECO');
expectBlocker('SUPECO paytx invalid etin (RET191152)', (f) => { f.supeco = { clttx:[], paytx:[{ id:'s', etin:'', suppval:5000, igst:900, cgst:0, sgst:0, cess:0 }] }; }, 'SUPECO');
expectBlocker('B2CL below inter-state threshold', (f) => { f.b2cl = [{ pos:'27', inum:'L1', idt:'09-07-2026', val:1180, itms:[{num:1,itm_det:{rt:18,txval:1000,iamt:180}}] }]; }, 'B2CL');
expectBlocker('HSN code wrong length (5 digits)', (f) => { f.hsn[0].hsn_sc = '84715'; },            'Body');
expectBlocker('B2CSA missing original month (omon)', (f) => { f.b2csa = [{ id:'a', sply_ty:'INTRA', typ:'OE', pos:'29', rt:18, txval:1000, camt:90, samt:90, isAmended:true }]; }, 'B2CSA');
expectBlocker('B2CSA omon not prior (= current fp)',  (f) => { f.b2csa = [{ id:'a', omon:'072026', sply_ty:'INTRA', typ:'OE', pos:'29', rt:18, txval:1000, camt:90, samt:90, isAmended:true }]; }, 'B2CSA');
expectBlocker('ATA missing original month (omon)',    (f) => { f.ata = [{ id:'a', pos:'29', sply_ty:'INTRA', itms:[{ rt:18, ad_amt:1000, camt:90, samt:90 }] }]; }, 'ATA');
expectBlocker('TXPDA omon not prior',                 (f) => { f.txpda = [{ id:'a', omon:'082026', pos:'29', sply_ty:'INTRA', itms:[{ rt:18, ad_amt:1000, camt:90, samt:90 }] }]; }, 'TXPDA');
expectBlocker('EXPA original date not prior',         (f) => { f.expa = [{ id:'e', exp_typ:'WOPAY', origInvNum:'X', origInvDt:'18-07-2026', inum:'X', idt:'18-07-2026', val:1000, itms:[{ txval:1000, rt:0 }], isAmended:true }]; }, 'EXPA');
expectBlocker('EXP WOPAY with IGST > 0',              (f) => { f.exp = [{ id:'e', exp_typ:'WOPAY', inum:'EX1', idt:'07-07-2026', val:1000, itms:[{ txval:1000, rt:18, iamt:180 }] }]; }, 'EXP');
expectBlocker('CDNURA B2CL missing pos',              (f) => { f.cdnura = [{ id:'c', typ:'B2CL', ntty:'C', ont_num:'O1', ont_dt:'16-06-2026', ntnum:'N1', ntdt:'16-07-2026', pos:'', val:118, itms:[{num:1,itm_det:{rt:18,txval:100,iamt:18}}], isAmended:true }]; }, 'CDNURA');
expectBlocker('CDNRA original note date not prior',   (f) => { f.cdnra = [{ id:'c', ctin:'33AAACL1523A1ZG', ntty:'C', nt:[{ ntnum:'N1', ntdt:'16-07-2026', val:118, pos:'33', inv_typ:'R', ont_num:'O1', ont_dt:'16-07-2026', itms:[{num:1,itm_det:{rt:18,txval:100,iamt:18}}] }], isAmended:true }]; }, 'CDNRA');
expectBlocker('CDNRA SEZ note carries CGST/SGST',     (f) => { f.cdnra = [{ id:'c', ctin:'33AAACL1523A1ZG', ntty:'C', nt:[{ ntnum:'N1', ntdt:'16-07-2026', val:118, pos:'33', inv_typ:'SEWP', ont_num:'O1', ont_dt:'16-06-2026', itms:[{num:1,itm_det:{rt:18,txval:100,camt:9,samt:9}}] }], isAmended:true }]; }, 'CDNRA');

// A VALID supeco (correct etin) must NOT block.
{
  const f = base(); f.supeco = { clttx: [{ id:'s', etin:'27AAGCM1234P1Z7', suppval:10000, igst:1800, cgst:0, sgst:0, cess:0 }], paytx: [] };
  const r = validateGstr1(f);
  if (r.status !== 'BLOCKERS') { pass++; console.log('  PASS  valid SUPECO etin → no blocker'); }
  else { fail++; console.log(`  FAIL  valid SUPECO etin should pass; blockers: ${r.findings.filter((x:any)=>x.severity==='error').map((x:any)=>x.section).join(',')}`); }
}

// A VALID prior-month omon amendment must NOT block (warning only).
{
  const f = base(); f.b2csa = [{ id:'a', omon:'062026', sply_ty:'INTRA', typ:'OE', pos:'29', rt:18, txval:1000, camt:90, samt:90, isAmended:true }];
  const r = validateGstr1(f);
  if (r.status !== 'BLOCKERS') { pass++; console.log('  PASS  valid prior-month B2CSA omon → no blocker (warning only)'); }
  else { fail++; console.log(`  FAIL  valid prior omon should pass; blockers: ${r.findings.filter((x:any)=>x.severity==='error').map((x:any)=>`[${x.section}] ${x.message}`).join(' | ')}`); }
}

console.log(`\nRESULT: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
