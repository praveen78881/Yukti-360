// Positive proof that the NEW controls actually flow (item 1 SEZ→b2b inv_typ, item 4 nil).
import { autoFillFromInvoices } from '@/lib/gstr1/autoFillFromInvoices';
import { createEmptyInvoiceV2Draft } from '@/lib/accounting/gstInvoices';
import type { InvoiceV2 } from '@/lib/accounting/gstInvoices';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean, x = '') => { if (c) { pass++; console.log(`  ✅ ${n}`); } else { fail++; console.log(`  ❌ ${n} ${x}`); } };
const base = (o: any): InvoiceV2 => ({ ...createEmptyInvoiceV2Draft('TAX_INVOICE'), id: o.id, company_id: 'c', created_at: '', updated_at: '', ...o });
const line = (o: any) => ({ sl_no: 1, description: 'X', hsn: '8471', is_service: false, uqc: 'NOS', qty: 1, rate: 100000, discount: 0, taxable_value: 100000, supply_nature: 'TAXABLE', gst_rate: 18, cess_rate: 0, cess_specific_rate: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, line_total: 118000, ...o });

const filing: any = { id: 'f', company_id: 'c', period: '072026', gstin: '29ABDCA9939R1ZK', status: 'draft', created_at: '', updated_at: '', gt: 1, cur_gt: 1, b2b: [], b2cl: [], b2cs: [], exp: [], cdnr: [], cdnur: [], nil: [], at: [], txpd: [], hsn: [], doc_issue: [], b2ba: [], b2cla: [], b2csa: [], expa: [], cdnra: [], cdnura: [], ata: [], txpda: [], rcm_overrides: {} };

const invs: InvoiceV2[] = [
  // Item 1: SEZ with payment → gstr1_table SEWP → must land in b2b with inv_typ SEWP
  base({ id: 'sez', gstr1_table: 'SEWP', buyer_type: 'SEZ', invoice_type: 'SEWP', export_type: 'WPAY', invoice_no: 'INV/1', invoice_date: '2026-07-05', buyer_gstin: '33AAACL1523A1ZG', place_of_supply: '33', supply_type: 'inter', total_amount: 118000, items: [line({ igst: 18000 })] }),
  // Item 1: Deemed Export → DE
  base({ id: 'de', gstr1_table: 'DE', buyer_type: 'DEEMED_EXPORT', invoice_type: 'DE', invoice_no: 'INV/2', invoice_date: '2026-07-06', buyer_gstin: '33AAACL1523A1ZG', place_of_supply: '33', supply_type: 'inter', total_amount: 118000, items: [line({ igst: 18000 })] }),
  // Item 4: nil-rated + exempt lines (intra B2C) → nil INTRAB2C bucket
  base({ id: 'nil', gstr1_table: 'B2CS', buyer_type: 'CONSUMER', invoice_no: 'INV/3', invoice_date: '2026-07-07', place_of_supply: '29', buyer_state_code: '29', supply_type: 'intra', total_amount: 5000, items: [line({ supply_nature: 'NIL_RATED', taxable_value: 3000, gst_rate: 0, line_total: 3000 }), line({ supply_nature: 'EXEMPT', taxable_value: 2000, gst_rate: 0, line_total: 2000 })] }),
];

const r = autoFillFromInvoices(invs, filing, '29');

console.log('=== item 1: SEZ / DE → b2b inv_typ ===');
console.log(JSON.stringify(r.b2b.map((b: any) => ({ inum: b.inum, inv_typ: b.inv_typ })), null, 2));
ok('SEZ invoice lands in b2b with inv_typ SEWP', r.b2b.some((b: any) => b.inum === 'INV/1' && b.inv_typ === 'SEWP'));
ok('DE invoice lands in b2b with inv_typ DE', r.b2b.some((b: any) => b.inum === 'INV/2' && b.inv_typ === 'DE'));

console.log('=== item 4: nil buckets ===');
console.log(JSON.stringify(r.nil, null, 2));
const nb = r.nil.find((n: any) => n.sply_ty === 'INTRAB2C');
ok('nil INTRAB2C bucket created', !!nb);
ok('nil_amt = 3000 (nil-rated)', nb?.nil_amt === 3000, JSON.stringify(nb));
ok('expt_amt = 2000 (exempt)', nb?.expt_amt === 2000, JSON.stringify(nb));

console.log(`\nRESULT: ${pass} passed, ${fail} failed\n`);
if (fail) process.exit(1);
