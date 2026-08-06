// ADDENDUM POINT-2 PROOF: one manual b2csa amendment must appear IDENTICALLY in
//   (1) Download-JSON            — generateGstr1Json (the certified builder)
//   (2) e-File wire-body preview — buildGstr1SaveBody (Save path, same builder)
//   (3) pre-check section count  — countSaveSections
//   (4) sec_sum                  — GSTN's per-section echo after Save/Proceed
//
// (1)-(3) are code-deterministic and asserted here. (4) sec_sum is RETURNED by
// GSTN (summary_type=long) — it cannot be produced offline without a live Save,
// so we print the exact sec_sum row our body implies GSTN must echo back, i.e.
// the reconciliation target the app checks during a real acceptance Save.
import { generateGstr1Json } from '@/lib/gstr1/gstr1Json';
import { buildGstr1SaveBody, countSaveSections } from '@/lib/gst/sandbox/saveBodies';

let pass = 0, fail = 0;
const ok = (n: string, cond: boolean, extra = '') => { if (cond) { pass++; console.log(`  ✅ ${n}`); } else { fail++; console.log(`  ❌ ${n} ${extra}`); } };

// A filing whose ONLY populated section is a single manual B2CSA amendment.
const filing: any = {
  id: 'f', company_id: 'c', period: '072026', gstin: '29ABDCA9939R1ZK', status: 'draft',
  created_at: '', updated_at: '', gt: 3782969, cur_gt: 850000,
  b2b: [], b2cl: [], b2cs: [], exp: [], cdnr: [], cdnur: [], nil: [], at: [], txpd: [], hsn: [], doc_issue: [],
  b2ba: [], b2cla: [], expa: [], cdnra: [], cdnura: [], ata: [], txpda: [],
  b2csa: [
    { id: 'sa1', omon: '062026', sply_ty: 'INTRA', typ: 'OE', pos: '29', rt: 18, txval: 8000, iamt: 0, camt: 720, samt: 720, csamt: 0, isAmended: true },
  ],
  rcm_overrides: {},
};

// ── (1) Download-JSON ──
const download = JSON.parse(generateGstr1Json(filing));
// ── (2) e-File wire body ──
const wire = buildGstr1SaveBody(filing, { gt: 3782969, cur_gt: 850000 });
// ── (3) pre-check section count ──
const counts = countSaveSections(wire);

console.log('\n=== (1) Download-JSON  →  b2csa ===');
console.log(JSON.stringify(download.b2csa, null, 2));
console.log('\n=== (2) e-File wire-body preview  →  b2csa ===');
console.log(JSON.stringify(wire.b2csa, null, 2));
console.log('\n=== (3) pre-check section count ===');
console.log(JSON.stringify(counts, null, 2));

console.log('\n=== assertions ===');
ok('Download-JSON contains b2csa', Array.isArray(download.b2csa) && download.b2csa.length === 1);
ok('wire body contains b2csa', Array.isArray(wire.b2csa) && wire.b2csa.length === 1);
ok('Download.b2csa === wire.b2csa (byte-identical)',
  JSON.stringify(download.b2csa) === JSON.stringify(wire.b2csa),
  `\n       download: ${JSON.stringify(download.b2csa)}\n       wire    : ${JSON.stringify(wire.b2csa)}`);
const b2csaCount = counts.find((c) => c.section === 'B2CSA');
ok('pre-check lists B2CSA with count 1', !!b2csaCount && b2csaCount.count === 1, JSON.stringify(b2csaCount));
// wire body must NOT still carry the offline-envelope keys
ok('wire body dropped version/hash', !('version' in wire) && !('hash' in wire));

// ── (4) sec_sum reconciliation target (what GSTN must echo) ──
const it = filing.b2csa[0];
const secSumRow = {
  sec_nm: 'b2csa',
  ttl_rec: filing.b2csa.length,
  ttl_val: it.txval,
  ttl_igst: it.iamt ?? 0,
  ttl_cgst: it.camt ?? 0,
  ttl_sgst: it.samt ?? 0,
  ttl_cess: it.csamt ?? 0,
  ttl_tax: (it.iamt ?? 0) + (it.camt ?? 0) + (it.samt ?? 0),
};
console.log('\n=== (4) sec_sum row GSTN must echo (reconciliation target for live Save) ===');
console.log(JSON.stringify(secSumRow, null, 2));
ok('sec_sum target keyed b2csa with ttl_rec matching pre-check', secSumRow.sec_nm === 'b2csa' && secSumRow.ttl_rec === (b2csaCount?.count ?? -1));

console.log(`\nRESULT: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
