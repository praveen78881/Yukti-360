import type { JournalEntry } from '@/lib/accounting/computeEngine';

/* ─────────────────────────────────────────────────────────────────────────────
   Books → AIS bridge.

   The ITR-1..4 sheets (/tax-utilities/itr*.html) import an Annual Information
   Statement as a sectioned CSV (see /public/tax-utilities/sample_ais.csv). Their
   parser keys on the section headings ("Part-B TDS/TCS Information", "Part-B
   Payment of Taxes", …) and the "Information Code" column (TDS-192, TDS-194A,
   PMT-ADV, …). This module generates that exact CSV from the journal, so the
   books flow straight into the ITR computation via each sheet's "Import AIS".

   What is derived from the books:
   • TDS Receivable debit lines  → Part-B TDS rows (section-wise, with the
     entry's revenue credit as "Amount Paid/Credited")
   • Advance-tax / self-assessment-tax debit lines → Part-B Payment of Taxes
   • Interest / dividend income credits without TDS → Part-B SFT rows
   ──────────────────────────────────────────────────────────────────────────── */

interface AisTdsRow { code: string; description: string; source: string; amountPaid: number; tds: number }
interface AisAmountRow { code: string; description: string; source: string; amount: number }

const SECTION_DESCRIPTIONS: Record<string, string> = {
  '192': 'Salary received (Section 192)',
  '194': 'Dividend (Section 194)',
  '194A': 'Interest from deposit (Section 194A)',
  '194C': 'Receipts from contract (Section 194C)',
  '194H': 'Commission received (Section 194H)',
  '194I': 'Rent received (Section 194I)',
  '194J': 'Professional / technical fees (Section 194J)',
  '194Q': 'Purchase of goods (Section 194Q)',
};

function tdsSectionFromName(name: string): string {
  const m = name.match(/19[24][A-Z]{0,2}/i);
  return m ? m[0].toUpperCase() : '';
}

function esc(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildAisCsvFromBooks(opts: {
  companyName: string;
  pan: string;
  fyLabel: string;   // e.g. '2025-26'
  entries: JournalEntry[];
}): string {
  const { companyName, pan, fyLabel, entries } = opts;

  const tdsRows: AisTdsRow[] = [];
  const paymentRows: AisAmountRow[] = [];
  const sftRows: AisAmountRow[] = [];

  let advanceTax = 0;
  let selfAssessmentTax = 0;
  let interestIncomeTotal = 0;
  let dividendIncomeTotal = 0;
  let interestCoveredByTds = 0;
  let dividendCoveredByTds = 0;

  for (const entry of entries) {
    // Income credits in this entry (context for TDS rows)
    let revenueCredit = 0;
    for (const line of entry.lines) {
      if (line.credit > 0 && line.nature === 'revenue') revenueCredit += line.credit;
    }

    for (const line of entry.lines) {
      const name = line.account_name;
      const lower = name.toLowerCase();

      // TDS deducted on our income → TDS Receivable debit lines
      if (line.debit > 0 && lower.includes('tds receivable')) {
        const sec = line.tds_section || tdsSectionFromName(name) || '194A';
        const row: AisTdsRow = {
          code: `TDS-${sec}`,
          description: SECTION_DESCRIPTIONS[sec] || `TDS (Section ${sec})`,
          source: entry.narration || 'As per books',
          amountPaid: Math.round(revenueCredit),
          tds: Math.round(line.debit),
        };
        tdsRows.push(row);
        if (sec === '194A') interestCoveredByTds += revenueCredit;
        if (sec === '194') dividendCoveredByTds += revenueCredit;
      }

      // Taxes paid by self
      if (line.debit > 0 && /advance tax/.test(lower)) advanceTax += line.debit;
      if (line.debit > 0 && /self[- ]assessment tax/.test(lower)) selfAssessmentTax += line.debit;

      // Interest / dividend income (for SFT rows)
      if (line.credit > 0 && line.nature === 'revenue') {
        if (/interest/.test(lower)) interestIncomeTotal += line.credit;
        if (/dividend/.test(lower)) dividendIncomeTotal += line.credit;
      }
    }
  }

  // SFT rows only for income not already represented via a TDS row, so the
  // sheet's importer never double-counts the same interest/dividend.
  const sftInterest = Math.round(Math.max(0, interestIncomeTotal - interestCoveredByTds));
  const sftDividend = Math.round(Math.max(0, dividendIncomeTotal - dividendCoveredByTds));
  if (sftInterest > 0) sftRows.push({ code: 'SFT-016', description: 'Interest income (as per books)', source: 'Books of account', amount: sftInterest });
  if (sftDividend > 0) sftRows.push({ code: 'SFT-018', description: 'Dividend received (as per books)', source: 'Books of account', amount: sftDividend });

  paymentRows.push({ code: 'PMT-ADV', description: 'Advance Tax paid', source: 'SELF (Challan)', amount: Math.round(advanceTax) });
  paymentRows.push({ code: 'PMT-SAT', description: 'Self-Assessment Tax', source: 'SELF (Challan)', amount: Math.round(selfAssessmentTax) });

  // ── Assemble the sectioned CSV (format mirrors sample_ais.csv exactly) ──────
  const lines: string[] = [];
  let sr = 0;
  lines.push('Annual Information Statement,,,,,');
  lines.push(`PAN:,${esc(pan.toUpperCase())},,Name:,${esc(companyName)},`);
  lines.push(`Financial Year:,${esc(fyLabel)},,,,`);
  lines.push(',,,,,');

  lines.push('Part-B TDS/TCS Information,,,,,');
  lines.push('Sr No.,Information Code,Information Description,Information Source,Amount Paid/Credited (Rs.),Tax Deducted (Rs.)');
  for (const r of tdsRows) {
    sr += 1;
    lines.push(`${sr},${esc(r.code)},${esc(r.description)},${esc(r.source)},${r.amountPaid},${r.tds}`);
  }
  lines.push(',,,,,');

  lines.push('Part-B SFT Information,,,,,');
  lines.push('Sr No.,Information Code,Information Description,Information Source,Amount (Rs.),');
  for (const r of sftRows) {
    sr += 1;
    lines.push(`${sr},${esc(r.code)},${esc(r.description)},${esc(r.source)},${r.amount},`);
  }
  lines.push(',,,,,');

  lines.push('Part-B Payment of Taxes,,,,,');
  lines.push('Sr No.,Information Code,Information Description,Information Source,Amount (Rs.),');
  for (const r of paymentRows) {
    sr += 1;
    lines.push(`${sr},${esc(r.code)},${esc(r.description)},${esc(r.source)},${r.amount},`);
  }

  return lines.join('\n') + '\n';
}

/** Trigger a browser download of the generated AIS CSV. */
export function downloadAisCsv(csv: string, companyName: string, fyLabel: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AIS_${companyName.replace(/[^\w-]+/g, '_')}_FY${fyLabel}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
