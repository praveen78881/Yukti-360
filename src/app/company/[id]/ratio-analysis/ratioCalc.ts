/* How each ratio on the page was worked out — rebuilt from the SAME components
 * computeRatioAnalysis returns, mirroring its expressions, guards and rounding
 * (src/lib/accounting/ratioAnalysisCompute.ts). Display only: the pop-up always
 * shows the page's own value as the result, so the two can never disagree.
 *
 * This page calls computeRatioAnalysis(entries) with no previous-period entries,
 * so every "average" in that function is simply the period-end figure — the
 * working below says so rather than pretending an average was taken. */

import type {
  RatioAnalysisData,
  RatioComponentKey,
  RatioComponentLine,
} from '@/lib/accounting/ratioAnalysisCompute';

type Components = RatioAnalysisData['components'];
export type ComponentLines = Record<RatioComponentKey, RatioComponentLine[]>;

export type CalcKind = 'ratio' | 'percent' | 'days';

export interface CalcPart {
  label: string;
  value: number;
  /** '+' / '−' relative to the part above it (first part has none). */
  op?: '+' | '−';
  /** Money amount (₹) or a plain number (e.g. 365, a turnover). */
  money: boolean;
  /** When set, the pop-up can list the accounts that make up this figure. */
  source?: RatioComponentKey;
}

export interface CalcBlock {
  title: string;
  parts: CalcPart[];
  total: number;
  money: boolean;
}

export interface RatioCalc {
  kind: CalcKind;
  numerator: CalcBlock;
  denominator: CalcBlock;
  /** Unrounded result of the working (× 100 already applied for %), or null. */
  quotient: number | null;
  /** Why the page shows "—", when it does. */
  unavailable?: string;
  /** True when the textbook ratio uses an average that this page takes as the period-end figure. */
  closingForAverage?: boolean;
}

const sum = (lines: RatioComponentLine[] | undefined) =>
  (lines ?? []).reduce((s, l) => s + l.amount, 0);

function money(label: string, value: number, source?: RatioComponentKey, op?: '+' | '−'): CalcPart {
  return { label, value, money: true, source, op };
}

function block(title: string, total: number, parts: CalcPart[], isMoney = true): CalcBlock {
  return { title, parts, total, money: isMoney };
}

/** Same guard as ratio() in the compute file: a zero denominator gives no ratio. */
function divide(num: number, den: number): number | null {
  return den === 0 ? null : num / den;
}

export function buildRatioCalc(
  label: string,
  c: Components,
  ratios: RatioAnalysisData['ratios'],
  lines: ComponentLines | null,
): RatioCalc | null {
  const ca = money('Current assets', c.currentAssets, 'currentAssets');
  const cl = money('Current liabilities', c.currentLiabilities, 'currentLiabilities');
  const inventory = money('Inventory', c.inventory, 'inventory');
  const cash = money('Cash & bank', c.cashAndBank, 'cashAndBank');
  const equity = money("Shareholders' equity", c.shareholdersEquity, 'shareholdersEquity');
  const ltd = money('Long-term borrowings', c.longTermDebt, 'longTermDebt');
  const revenue = money('Revenue', c.revenue, 'revenue');
  const cogs = money('Cost of goods sold', c.cogs, 'cogs');
  const opex = money('Operating expenses', c.operatingExpenses, 'operatingExpenses');
  const interest = money('Interest (finance costs)', c.interestExpense, 'interestExpense');

  const totalAssetsBlock = (title = 'Total assets') =>
    block(title, c.totalAssets, [
      money('Current assets', c.currentAssets, 'currentAssets'),
      money('Non-current assets', sum(lines?.nonCurrentAssets), 'nonCurrentAssets', '+'),
      money('Accumulated depreciation', sum(lines?.accumulatedDepreciation), 'accumulatedDepreciation', '−'),
    ]);
  const grossProfitBlock = (title = 'Gross profit') =>
    block(title, c.grossProfit, [revenue, { ...cogs, op: '−' }]);
  const operatingProfitBlock = (title = 'Operating profit') =>
    block(title, c.operatingProfit, [revenue, { ...cogs, op: '−' }, { ...opex, op: '−' }]);
  const capitalEmployed = c.shareholdersEquity + c.longTermDebt;
  const capitalEmployedBlock = block('Capital employed', capitalEmployed, [equity, { ...ltd, op: '+' }]);
  const workingCapitalBlock = block('Working capital', c.currentAssets - c.currentLiabilities, [ca, { ...cl, op: '−' }]);

  const valueOf = (l: string) => ratios.find(r => r.label === l)?.value ?? null;
  const zeroReason = (b: CalcBlock) => `${b.title} is nil for this period, so the ratio can't be worked out.`;
  const noRevenue = 'There is no revenue in this period, so the margin can\'t be worked out.';

  /** A plain ratio: numerator ÷ denominator (ratio() guard). */
  const plain = (num: CalcBlock, den: CalcBlock, closingForAverage = false): RatioCalc => {
    const q = divide(num.total, den.total);
    return {
      kind: 'ratio', numerator: num, denominator: den, quotient: q, closingForAverage,
      unavailable: q === null ? zeroReason(den) : undefined,
    };
  };
  /** A percentage: numerator ÷ denominator × 100, only when the guard holds. */
  const percent = (num: CalcBlock, den: CalcBlock, guard: boolean, why: string, closingForAverage = false): RatioCalc => ({
    kind: 'percent', numerator: num, denominator: den, closingForAverage,
    quotient: guard ? (num.total / den.total) * 100 : null,
    unavailable: guard ? undefined : why,
  });
  /** A period in days: 365 ÷ the (already rounded) turnover the page shows. */
  const days = (turnoverLabel: string, turnover: number | null): RatioCalc => {
    const t = turnover ?? 0;
    const ok = turnover != null && turnover > 0;
    return {
      kind: 'days',
      numerator: block('Days in the year', 365, [{ label: 'Days', value: 365, money: false }], false),
      denominator: block(turnoverLabel, t, [{ label: turnoverLabel, value: t, money: false }], false),
      quotient: ok ? 365 / t : null,
      closingForAverage: true,
      unavailable: ok ? undefined : `${turnoverLabel} isn't available for this period, so this can't be worked out.`,
    };
  };

  switch (label) {
    case 'Current Ratio':
      return plain(block('Current assets', c.currentAssets, [ca]), block('Current liabilities', c.currentLiabilities, [cl]));
    case 'Quick Ratio':
      return plain(
        block('Quick assets', c.currentAssets - c.inventory, [ca, { ...inventory, op: '−' }]),
        block('Current liabilities', c.currentLiabilities, [cl]),
      );
    case 'Cash Ratio':
      return plain(block('Cash & bank', c.cashAndBank, [cash]), block('Current liabilities', c.currentLiabilities, [cl]));

    case 'Debt-Equity Ratio':
      return plain(block('Long-term borrowings', c.longTermDebt, [ltd]), block("Shareholders' equity", c.shareholdersEquity, [equity]));
    case 'Proprietary Ratio':
      return plain(block("Shareholders' equity", c.shareholdersEquity, [equity]), totalAssetsBlock());
    case 'Interest Coverage Ratio':
      return plain(
        block('Profit before interest', c.operatingProfit + c.interestExpense, [
          money('Operating profit', c.operatingProfit), { ...interest, op: '+' },
        ]),
        block('Interest (finance costs)', c.interestExpense, [interest]),
      );

    case 'Gross Profit Ratio (%)':
      return percent(grossProfitBlock(), block('Revenue', c.revenue, [revenue]), c.revenue > 0, noRevenue);
    case 'Net Profit Ratio (%)':
      return percent(operatingProfitBlock('Net profit'), block('Revenue', c.revenue, [revenue]), c.revenue > 0, noRevenue);
    case 'Operating Profit Ratio (%)':
      return percent(operatingProfitBlock(), block('Revenue', c.revenue, [revenue]), c.revenue > 0, noRevenue);
    case 'Return on Equity (%)':
      return percent(
        operatingProfitBlock('Net profit'), block("Shareholders' equity", c.shareholdersEquity, [equity]),
        c.shareholdersEquity > 0, "Shareholders' equity isn't positive, so the return can't be worked out.", true,
      );
    case 'Return on Assets (%)':
      return percent(
        operatingProfitBlock('Net profit'), totalAssetsBlock(),
        c.totalAssets > 0, "Total assets aren't positive, so the return can't be worked out.", true,
      );
    case 'Return on Capital Employed (%)':
      return percent(
        operatingProfitBlock(), capitalEmployedBlock,
        capitalEmployed > 0, "Capital employed isn't positive, so the return can't be worked out.", true,
      );

    case 'Inventory Turnover':
      return plain(block('Cost of goods sold', c.cogs, [cogs]), block('Inventory', c.inventory, [inventory]), true);
    case 'Debtors Turnover':
      return plain(block('Revenue', c.revenue, [revenue]), block('Trade receivables', c.tradeReceivables, [money('Trade receivables', c.tradeReceivables, 'tradeReceivables')]), true);
    case 'Creditors Turnover':
      return plain(block('Cost of goods sold', c.cogs, [cogs]), block('Trade payables', c.tradePayables, [money('Trade payables', c.tradePayables, 'tradePayables')]), true);
    case 'Asset Turnover':
      return plain(block('Revenue', c.revenue, [revenue]), totalAssetsBlock(), true);
    case 'Working Capital Turnover':
      return plain(block('Revenue', c.revenue, [revenue]), workingCapitalBlock);

    case 'Debtors Collection Period (days)':
      return days('Debtors turnover', valueOf('Debtors Turnover'));
    case 'Creditors Payment Period (days)':
      return days('Creditors turnover', valueOf('Creditors Turnover'));
    case 'Inventory Holding Period (days)':
      return days('Inventory turnover', valueOf('Inventory Turnover'));

    default:
      return null;
  }
}
