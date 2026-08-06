// End-to-end verification of the audit fixes against realistic test data.
// Bundled with esbuild (see verify_fixes.mjs) and run under Node.

import type { JournalEntry } from '@/lib/accounting/computeEngine';
import { computeTradingAccount } from '@/lib/accounting/tradingAccountCompute';
import { computeProfitLoss } from '@/lib/accounting/profitLossCompute';
import { computeDepreciation } from '@/lib/accounting/depreciationCompute';
import { generateGstr1Json } from '@/lib/gstr1/gstr1Json';
import type { GSTR1Filing } from '@/lib/gstr1/types';
import { expandManualJournalLines } from '@/lib/accounting/inventoryJournal';
import { autoFillFromInvoices } from '@/lib/gstr1/autoFillFromInvoices';
import { generateComplianceCalendar } from '@/entities/private-limited/compliance/calendar';

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail: string) {
  if (cond) { passed++; console.log(`  PASS  ${name} — ${detail}`); }
  else { failed++; console.log(`  FAIL  ${name} — ${detail}`); }
}

function je(id: string, lines: JournalEntry['lines']): JournalEntry {
  return {
    id, entry_code: id, entry_date: '2025-06-15', voucher_type: 'JRN',
    voucher_number: null, lines, narration: 't', book_period: 'FY 2025-26',
    is_opening: false, is_closing: false, created_at: '2025-06-15T00:00:00Z',
  };
}
const L = (account_name: string, account_group: string, nature: any, debit: number, credit: number) =>
  ({ account_name, account_group, nature, debit, credit });

console.log('\n=== TEST 1 — Taxable income includes the trading result (bug: gross profit was dropped) ===');
{
  // Trading co: Sales 50,00,000; Purchases 30,00,000; Rent (indirect) 5,00,000.
  const entries: JournalEntry[] = [
    je('S1', [L('Sales', 'Revenue from Operations', 'revenue', 0, 5000000), L('Debtors', 'Trade Receivables', 'asset', 5000000, 0)]),
    je('P1', [L('Purchases', 'Purchases of Stock-in-Trade', 'expense', 3000000, 0), L('Creditors', 'Trade Payables', 'liability', 0, 3000000)]),
    je('R1', [L('Rent', 'Other Expenses — Administration', 'expense', 500000, 0), L('Bank', 'Bank Balances', 'asset', 0, 500000)]),
  ];
  const gross = computeTradingAccount(entries).grossProfit;
  const fixedPBT = computeProfitLoss(entries, gross).netProfit;      // the fix
  const buggyPBT = computeProfitLoss(entries, 0).netProfit;          // the old behaviour
  check('Gross profit', gross === 2000000, `grossProfit = ${gross} (expected 20,00,000)`);
  check('Profit before tax', fixedPBT === 1500000, `fixed PBT = ${fixedPBT} (expected 15,00,000); old buggy PBT = ${buggyPBT}`);
  check('Bug reproduced by old path', buggyPBT === -500000, `old path returned ${buggyPBT} (a fake loss)`);
}

console.log('\n=== TEST 2 — WDV depreciation charges on written-down value, not gross cost ===');
{
  // Plant 10,00,000 cost; Accumulated Depreciation 1,50,000; WDV rate 15%.
  const entries: JournalEntry[] = [
    je('A1', [L('Plant & Machinery', 'Tangible Fixed Assets', 'asset', 1000000, 0), L('Bank', 'Bank Balances', 'asset', 0, 1000000)]),
    je('D1', [L('Depreciation', 'Depreciation & Amortisation', 'expense', 150000, 0), L('Accumulated Depreciation — Plant & Machinery', 'Accumulated Depreciation', 'liability', 0, 150000)]),
  ];
  const rows = computeDepreciation(entries, 'WDV');
  const plant = rows.find(r => r.assetName === 'Plant & Machinery');
  const dep = plant?.depreciationAmount ?? -1;
  check('WDV charge on (cost − accum dep)', dep === 127500, `depreciation = ${dep} (expected 15% × 8,50,000 = 1,27,500, NOT 1,50,000)`);
}

console.log('\n=== TEST 3 — GSTR-1 export invoices grouped by their own exp_typ (WPAY vs WOPAY) ===');
{
  const empty = { b2b: [], b2cl: [], b2cs: [], cdnr: [], cdnur: [], nil: [], at: [], txpd: [], hsn: [], doc_issue: [] };
  const filing = {
    ...empty, gstin: '29ABCDE1234F1Z5', period: '062025',
    exp: [
      { id: 'e1', exp_typ: 'WPAY', inum: 'EXP-01', idt: '15-06-2025', val: 100000, itms: [{ txval: 100000, rt: 0, iamt: 18000 }] },
      { id: 'e2', exp_typ: 'WOPAY', inum: 'EXP-02', idt: '16-06-2025', val: 200000, itms: [{ txval: 200000, rt: 0 }] },
    ],
  } as unknown as GSTR1Filing;
  const json = JSON.parse(generateGstr1Json(filing));
  const expGroups: any[] = json.exp ?? [];
  const types = expGroups.map((g) => g.exp_typ).sort();
  check('Two export groups', expGroups.length === 2, `exp groups = ${expGroups.length} (expected 2, not 1)`);
  check('Both types preserved', types.join(',') === 'WOPAY,WPAY', `exp_typ values = [${types.join(', ')}]`);
}

console.log('\n=== TEST 4 — GSTR-1 CDNR keeps credit and debit notes in separate groups ===');
{
  const inv = (over: any) => ({
    id: over.id, doc_type: over.doc_type, gstr1_table: 'CDNR',
    buyer_gstin: '27ABCDE1234F1Z5', invoice_no: over.invoice_no, invoice_date: '2025-06-15',
    total_amount: 11800, place_of_supply: '27', buyer_state_code: '27',
    items: [{ taxable_value: 10000, gst_rate: 18, igst: 1800, cgst: 0, sgst: 0, cess: 0, description: 'x', hsn: '' }],
  });
  const invoices: any[] = [
    inv({ id: 'c1', doc_type: 'CREDIT_NOTE', invoice_no: 'CN-01' }),
    inv({ id: 'd1', doc_type: 'DEBIT_NOTE', invoice_no: 'DN-01' }),
  ];
  const emptyFiling = {
    gstin: '29ABCDE1234F1Z5', period: '062025',
    b2b: [], b2cl: [], b2cs: [], exp: [], cdnr: [], cdnur: [], nil: [], at: [], txpd: [], hsn: [], doc_issue: [],
    b2ba: [], b2cla: [], b2csa: [], expa: [], cdnra: [], cdnura: [],
  };
  const filing = autoFillFromInvoices(invoices as any, emptyFiling as any, '29');
  const cdnr = filing.cdnr;
  const cn = cdnr.find((g: any) => g.ntty === 'C');
  const dn = cdnr.find((g: any) => g.ntty === 'D');
  check('Two CDNR groups', cdnr.length === 2, `cdnr groups = ${cdnr.length} (expected 2)`);
  check('Credit note tagged C', !!cn && cn.nt[0].ntnum === 'CN-01', `C group note = ${cn?.nt?.[0]?.ntnum}`);
  check('Debit note tagged D', !!dn && dn.nt[0].ntnum === 'DN-01', `D group note = ${dn?.nt?.[0]?.ntnum}`);
}

console.log('\n=== TEST 5 — Sales return posts on the DEBIT side (operator-precedence bug) ===');
{
  const subLine = { inventory_name: 'Widget', hsn_sac: '1234', unit: 'PCS', qty: 10, rate: 1000, discount_percent: 0, cgst_percent: 9, sgst_percent: 9, igst_percent: 0 };
  const expanded = expandManualJournalLines([
    { account_name: 'Sales Returns', account_group: 'Revenue from Operations', inventory_sub_lines: [subLine] } as any,
  ]);
  const parent = expanded.find((l) => l.account_name === 'Sales Returns');
  check('Sales Returns is a DEBIT', !!parent && parent.debit === 10000 && parent.credit === 0,
    `Sales Returns: debit=${parent?.debit}, credit=${parent?.credit} (expected debit 10,000)`);
  const cgst = expanded.find((l) => l.account_name.includes('CGST'));
  check('Output CGST follows to DEBIT', !!cgst && cgst.debit === 900 && cgst.credit === 0,
    `Output CGST: debit=${cgst?.debit}, credit=${cgst?.credit} (expected debit 900)`);
}

console.log('\n=== TEST 6 — Compliance calendar dates: MSME-1 (Apr–Sep) & no IST day-shift ===');
{
  const classification: any = {
    auditFlags: { xbrlFiling: false, taxAudit: false, secretarialAudit: false, csrApplicable: false, costAudit: false },
    filingObligations: { annualReturnForm: 'MGT-7' },
  };
  const items = generateComplianceCalendar('2026-03-31', '2026-09-30', classification);
  const msme2 = items.find((i) => i.code === 'MSME-1-H2');
  const aoc4 = items.find((i) => i.code === 'AOC-4');
  const gstr1 = items.find((i) => i.code?.startsWith('GSTR1-'));
  check('MSME-1 (Apr–Sep) due 31 Oct of prior calendar year', msme2?.dueDate === '2025-10-31', `MSME-1-H2 dueDate = ${msme2?.dueDate} (expected 2025-10-31)`);
  check('AOC-4 = AGM + 30 days, no day-shift', aoc4?.dueDate === '2026-10-30', `AOC-4 dueDate = ${aoc4?.dueDate} (expected 2026-10-30)`);
  check('Monthly GSTR-1 lands on the 11th (not the 10th)', gstr1?.dueDate?.endsWith('-11') ?? false, `first GSTR-1 dueDate = ${gstr1?.dueDate} (expected day 11)`);
}

console.log(`\n──────────────────────────────────────────────`);
console.log(`RESULT: ${passed} passed, ${failed} failed`);
console.log(`──────────────────────────────────────────────\n`);
if (failed > 0) process.exit(1);
