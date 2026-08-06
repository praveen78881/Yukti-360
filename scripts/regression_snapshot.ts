// ZERO-REGRESSION SNAPSHOT. Emits a stable fingerprint of the invoice→GSTR-1
// data path for a fixed set of "existing" documents that use ONLY today's
// controls (no inv_typ selection, uqc=NOS, supply_nature=TAXABLE, no BoS).
// Re-run after each additive item; the printed JSON must be BYTE-IDENTICAL.
import { autoFillFromInvoices } from '@/lib/gstr1/autoFillFromInvoices';
import { generateGstr1Json } from '@/lib/gstr1/gstr1Json';
import { autoCategorize, determineGSTR1Table, createEmptyInvoiceV2Draft } from '@/lib/accounting/gstInvoices';
import type { InvoiceV2 } from '@/lib/accounting/gstInvoices';

const SELLER = '29'; // Karnataka

const line = (over: any) => ({
  sl_no: 1, description: 'Widget', hsn: '8471', is_service: false, uqc: 'NOS',
  qty: 10, rate: 10000, discount: 0, taxable_value: 100000, supply_nature: 'TAXABLE',
  gst_rate: 18, cess_rate: 0, cess_specific_rate: 0,
  cgst: 0, sgst: 0, igst: 0, cess: 0, line_total: 118000, ...over,
});

// Fixed InvoiceV2 objects (no Date/random — deterministic).
const base = (over: any): InvoiceV2 => ({
  ...createEmptyInvoiceV2Draft('TAX_INVOICE'),
  id: over.id, company_id: 'c', created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z',
  ...over,
});

const invoices: InvoiceV2[] = [
  // 1. B2B registered, inter-state (IGST)
  base({
    id: 'inv-b2b', gstr1_table: 'B2B', buyer_type: 'REGISTERED', invoice_no: 'INV/2026/001',
    invoice_date: '2026-07-05', buyer_gstin: '33AAACL1523A1ZG', buyer_state_code: '33',
    place_of_supply: '33', supply_type: 'inter', is_intra_state: false, reverse_charge: false,
    total_amount: 118000,
    items: [line({ igst: 18000, line_total: 118000 })],
  }),
  // 2. B2CS consumer, intra-state (CGST+SGST) with a SAC service line (uqc NA/qty0 rule)
  base({
    id: 'inv-b2cs', gstr1_table: 'B2CS', buyer_type: 'CONSUMER', invoice_no: 'INV/2026/002',
    invoice_date: '2026-07-06', place_of_supply: '29', buyer_state_code: '29',
    supply_type: 'intra', is_intra_state: true, total_amount: 59000,
    items: [
      line({ hsn: '998314', is_service: true, uqc: 'NOS', qty: 5, rate: 10000, taxable_value: 50000, gst_rate: 18, cgst: 4500, sgst: 4500, line_total: 59000 }),
    ],
  }),
  // 3. Export WOPAY
  base({
    id: 'inv-exp', gstr1_table: 'EXP', buyer_type: 'OVERSEAS', invoice_no: 'EXP/2026/010',
    invoice_date: '2026-07-07', export_type: 'WOPAY', place_of_supply: '96',
    supply_type: 'inter', is_intra_state: false, total_amount: 100000,
    shipping_bill_no: '9988776', shipping_bill_date: '2026-07-05', port_code: 'INMAA1',
    items: [line({ hsn: '8471', qty: 10, rate: 10000, taxable_value: 100000, gst_rate: 0, igst: 0, line_total: 100000 })],
  }),
  // 4. Credit note, registered → CDNR
  base({
    id: 'inv-cdnr', doc_type: 'CREDIT_NOTE', gstr1_table: 'CDNR', buyer_type: 'REGISTERED',
    invoice_no: 'CN/2026/001', invoice_date: '2026-07-08', buyer_gstin: '33AAACL1523A1ZG',
    buyer_state_code: '33', place_of_supply: '33', supply_type: 'inter', is_intra_state: false,
    total_amount: 11800, items: [line({ qty: 1, rate: 10000, taxable_value: 10000, igst: 1800, line_total: 11800 })],
  }),
  // 5. ECO-facilitated B2C (supeco clttx)
  base({
    id: 'inv-eco', gstr1_table: 'B2CS', buyer_type: 'CONSUMER', invoice_no: 'INV/2026/003',
    invoice_date: '2026-07-09', place_of_supply: '29', buyer_state_code: '29', supply_type: 'intra',
    is_intra_state: true, total_amount: 23600, ecom_supply: true, ecom_gstin: '27AAGCM1234P1Z7',
    items: [line({ qty: 2, rate: 10000, taxable_value: 20000, gst_rate: 18, cgst: 1800, sgst: 1800, line_total: 23600 })],
  }),
];

const filing: any = {
  id: 'f', company_id: 'c', period: '072026', gstin: '29ABDCA9939R1ZK', status: 'draft',
  created_at: '', updated_at: '', gt: 3782969, cur_gt: 850000,
  b2b: [], b2cl: [], b2cs: [], exp: [], cdnr: [], cdnur: [], nil: [], at: [], txpd: [], hsn: [], doc_issue: [],
  b2ba: [], b2cla: [], b2csa: [], expa: [], cdnra: [], cdnura: [], ata: [], txpda: [], rcm_overrides: {},
};

const filled = autoFillFromInvoices(invoices, filing, SELLER);
const emitted = generateGstr1Json(filled);

// Also fingerprint the wizard's pure routing on the same existing drafts.
const drafts = [
  { ...createEmptyInvoiceV2Draft('TAX_INVOICE'), buyer_gstin: '33AAACL1523A1ZG', total_amount: 118000, place_of_supply: '33' },
  { ...createEmptyInvoiceV2Draft('TAX_INVOICE'), buyer_gstin: '', total_amount: 59000, place_of_supply: '29' },
  { ...createEmptyInvoiceV2Draft('TAX_INVOICE'), buyer_type: 'OVERSEAS', export_type: 'WOPAY', total_amount: 100000 },
  { ...createEmptyInvoiceV2Draft('CREDIT_NOTE'), buyer_gstin: '33AAACL1523A1ZG', total_amount: 11800 },
];
const routing = drafts.map((d: any) => ({ cat: autoCategorize(d, SELLER), tbl: determineGSTR1Table(d) }));

console.log('=== AUTOFILL → EMIT (existing data) ===');
console.log(emitted);
console.log('=== WIZARD ROUTING (existing drafts) ===');
console.log(JSON.stringify(routing, null, 2));
