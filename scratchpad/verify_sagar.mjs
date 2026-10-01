// Standalone verification script for Sagar Private Limited financial statements

const lines = [
  { account_name: 'Drawings', account_group: 'Share Capital', nature: 'capital', debit: 200000.0, credit: 0 },
  { account_name: 'Lalitha Capital A/c', account_group: 'Share Capital', nature: 'capital', debit: 0, credit: 9421888.0 },
  { account_name: 'Rental Advance', account_group: 'Other Current Liabilities', nature: 'liability', debit: 0, credit: 45000.0 },
  { account_name: 'Duties & Taxes', account_group: 'Other Current Assets', nature: 'asset', debit: 143691.0, credit: 0 },
  { account_name: 'Sundry Creditors', account_group: 'Trade Payables', nature: 'liability', debit: 0, credit: 450000.0 },
  { account_name: 'Loans & Advances (Asset)', account_group: 'Short-term Loans & Advances', nature: 'asset', debit: 1500000.0, credit: 0 },
  { account_name: 'Sundry Debtors', account_group: 'Trade Receivables', nature: 'asset', debit: 10040000.0, credit: 0 },
  { account_name: 'Cash-in-Hand', account_group: 'Cash & Cash Equivalents', nature: 'asset', debit: 42183.0, credit: 0 },
  { account_name: 'Bank Accounts', account_group: 'Bank Balances', nature: 'asset', debit: 1587071.5, credit: 0 },
  { account_name: 'TDS RECEIVABLE FY 2025-26', account_group: 'Other Current Assets', nature: 'asset', debit: 177701.0, credit: 0 },
  { account_name: 'Interest Income', account_group: 'Revenue from Operations', nature: 'revenue', debit: 0, credit: 630000.0 },
  { account_name: 'Rental Income', account_group: 'Revenue from Operations', nature: 'revenue', debit: 0, credit: 787506.0 },
  { account_name: 'Rental Income — Additional', account_group: 'Revenue from Operations', nature: 'revenue', debit: 0, credit: 120000.0 },
  { account_name: 'Satish Store Int', account_group: 'Revenue from Operations', nature: 'revenue', debit: 0, credit: 100000.0 },
  { account_name: 'Subha Luxury Int', account_group: 'Revenue from Operations', nature: 'revenue', debit: 0, credit: 269444.0 },
  { account_name: 'Interest on FD', account_group: 'Other Income', nature: 'revenue', debit: 0, credit: 67917.0 },
  { account_name: 'Interest on SB A/Cs', account_group: 'Other Income', nature: 'revenue', debit: 0, credit: 39744.0 },
  { account_name: 'IT REFUND', account_group: 'Other Income', nature: 'revenue', debit: 0, credit: 31760.0 },
  { account_name: 'Bank Charges', account_group: 'Finance Costs', nature: 'expense', debit: 58.0, credit: 0 },
  { account_name: 'Insurance Expenses', account_group: 'Other Expenses', nature: 'expense', debit: 60000.0, credit: 0 },
  { account_name: 'Profit & Loss A/c', account_group: 'Reserves & Surplus', nature: 'capital', debit: 0, credit: 1787445.5 },
];

function computeAllBalances(lines) {
  const map = new Map();
  for (const l of lines) {
    const existing = map.get(l.account_name) || {
      account_name: l.account_name,
      account_group: l.account_group,
      nature: l.nature,
      total_debit: 0,
      total_credit: 0
    };
    existing.total_debit += l.debit;
    existing.total_credit += l.credit;
    map.set(l.account_name, existing);
  }
  const res = [];
  for (const [name, d] of map) {
    const diff = d.total_debit - d.total_credit;
    res.push({
      account_name: name,
      account_group: d.account_group,
      nature: d.nature,
      total_debit: d.total_debit,
      total_credit: d.total_credit,
      balance: Math.abs(diff),
      balance_type: diff >= 0 ? 'Dr' : 'Cr'
    });
  }
  return res;
}

const balances = computeAllBalances(lines);

// Trading / Revenue
const revenueFromOps = balances.filter(b => b.account_group === 'Revenue from Operations').reduce((s, b) => s + b.balance, 0);
const otherIncome = balances.filter(b => b.account_group === 'Other Income').reduce((s, b) => s + b.balance, 0);
const expenses = balances.filter(b => ['Finance Costs', 'Other Expenses'].includes(b.account_group)).reduce((s, b) => s + b.balance, 0);
const netProfit = (revenueFromOps + otherIncome) - expenses;

console.log('--- PROFIT & LOSS ---');
console.log('Revenue from Operations:', revenueFromOps);
console.log('Other Income:', otherIncome);
console.log('Expenses:', expenses);
console.log('Net Profit for Year:', netProfit);

// Balance Sheet (Schedule III)
function sumGroupAsset(bal, groups) {
  const list = Array.isArray(groups) ? groups : [groups];
  return bal.filter(b => list.includes(b.account_group)).reduce((s, b) => {
    const sign = b.nature === 'asset' ? (b.balance_type === 'Dr' ? 1 : -1) : (b.balance_type === 'Cr' ? 1 : -1);
    return s + sign * b.balance;
  }, 0);
}

const shareCapital = sumGroupAsset(balances, 'Share Capital');
const reserves = sumGroupAsset(balances, 'Reserves & Surplus') + netProfit;
const tradePayables = sumGroupAsset(balances, 'Trade Payables');
const otherCL = sumGroupAsset(balances, ['Other Current Liabilities', 'Statutory Liabilities']);
const totalEquityLiab = shareCapital + reserves + tradePayables + otherCL;

const tradeReceivables = sumGroupAsset(balances, 'Trade Receivables');
const cashEquiv = sumGroupAsset(balances, ['Cash & Cash Equivalents', 'Bank Balances']);
const stLoans = sumGroupAsset(balances, 'Short-term Loans & Advances');
const otherCA = sumGroupAsset(balances, ['Other Current Assets', 'GST — Input Tax Credit']);
const totalAssets = tradeReceivables + cashEquiv + stLoans + otherCA;

console.log('\n--- SCHEDULE III BALANCE SHEET ---');
console.log('Share Capital:', shareCapital);
console.log('Reserves & Surplus:', reserves);
console.log('Trade Payables:', tradePayables);
console.log('Other Current Liabilities:', otherCL);
console.log('TOTAL EQUITY & LIABILITIES:', totalEquityLiab);

console.log('\nTrade Receivables:', tradeReceivables);
console.log('Cash and Bank:', cashEquiv);
console.log('Short-term Loans & Advances:', stLoans);
console.log('Other Current Assets:', otherCA);
console.log('TOTAL ASSETS:', totalAssets);

console.log('\nDifference:', totalEquityLiab - totalAssets);
console.log('BALANCED:', Math.abs(totalEquityLiab - totalAssets) < 0.01);
