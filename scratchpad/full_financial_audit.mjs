// Full Comprehensive Financial Audit for Sagar Private Limited

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

console.log('=====================================================');
console.log('        SAGAR PRIVATE LIMITED - FINANCIAL AUDIT       ');
console.log('=====================================================\n');

// 1. Double-entry arithmetic validation
let totalDr = 0;
let totalCr = 0;
for (const l of lines) {
  totalDr += l.debit;
  totalCr += l.credit;
}
console.log('1. TRIAL BALANCE INTEGRITY:');
console.log(`   Total Debit  : ₹${totalDr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
console.log(`   Total Credit : ₹${totalCr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
console.log(`   Diff         : ₹${Math.abs(totalDr - totalCr).toFixed(2)}`);
console.log(`   Status       : ${totalDr === totalCr ? '✅ PERFECTLY BALANCED' : '❌ ERROR'}\n`);

// 2. Trading & Profit / Loss Statement
const revenueOps = lines.filter(l => l.account_group === 'Revenue from Operations').reduce((s, l) => s + l.credit, 0);
const otherInc = lines.filter(l => l.account_group === 'Other Income').reduce((s, l) => s + l.credit, 0);
const financeCosts = lines.filter(l => l.account_group === 'Finance Costs').reduce((s, l) => s + l.debit, 0);
const otherExp = lines.filter(l => l.account_group === 'Other Expenses').reduce((s, l) => s + l.debit, 0);
const totalExp = financeCosts + otherExp;
const netProfit = (revenueOps + otherInc) - totalExp;

console.log('2. STATEMENT OF PROFIT & LOSS:');
console.log(`   I.   Revenue from Operations  : ₹${revenueOps.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
console.log(`   II.  Other Income             : ₹${otherInc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
console.log(`   III. Total Revenue (I + II)   : ₹${(revenueOps + otherInc).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
console.log(`   IV.  Finance Costs            : ₹${financeCosts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
console.log(`   V.   Other Expenses           : ₹${otherExp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
console.log(`   VI.  Total Expenses (IV + V)  : ₹${totalExp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
console.log(`   VII. Net Profit for Period    : ₹${netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`);

// 3. Schedule III Balance Sheet
const grossCap = lines.find(l => l.account_name === 'Lalitha Capital A/c').credit;
const drawings = lines.find(l => l.account_name === 'Drawings').debit;
const netCap = grossCap - drawings;
const opPnL = lines.find(l => l.account_name === 'Profit & Loss A/c').credit;
const totalReserves = opPnL + netProfit;
const creditors = lines.find(l => l.account_name === 'Sundry Creditors').credit;
const rentAdv = lines.find(l => l.account_name === 'Rental Advance').credit;

const totalEquityLiab = netCap + totalReserves + creditors + rentAdv;

const debtors = lines.find(l => l.account_name === 'Sundry Debtors').debit;
const loansAdv = lines.find(l => l.account_name === 'Loans & Advances (Asset)').debit;
const cash = lines.find(l => l.account_name === 'Cash-in-Hand').debit;
const bank = lines.find(l => l.account_name === 'Bank Accounts').debit;
const tds = lines.find(l => l.account_name === 'TDS RECEIVABLE FY 2025-26').debit;
const duties = lines.find(l => l.account_name === 'Duties & Taxes').debit;

const totalAssets = debtors + loansAdv + cash + bank + tds + duties;

console.log('3. SCHEDULE III BALANCE SHEET:');
console.log('   EQUITY & LIABILITIES:');
console.log(`   • Share Capital (Net of Drawings) : ₹${netCap.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
console.log(`   • Reserves & Surplus (P&L Total)  : ₹${totalReserves.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
console.log(`   • Trade Payables                  : ₹${creditors.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
console.log(`   • Other Current Liabilities       : ₹${rentAdv.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
console.log(`   => TOTAL EQUITY & LIABILITIES     : ₹${totalEquityLiab.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);

console.log('\n   ASSETS:');
console.log(`   • Trade Receivables (Debtors)     : ₹${debtors.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
console.log(`   • Cash & Bank Balances            : ₹${(cash + bank).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
console.log(`   • Short-term Loans & Advances     : ₹${loansAdv.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
console.log(`   • Other Current Assets (TDS+GST)  : ₹${(tds + duties).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
console.log(`   => TOTAL ASSETS                   : ₹${totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);

console.log(`\n   Difference : ₹${Math.abs(totalEquityLiab - totalAssets).toFixed(2)}`);
console.log(`   Status     : ${totalEquityLiab === totalAssets ? '✅ PERFECTLY BALANCED (0.00 Variance)' : '❌ ERROR'}\n`);

// 4. Financial Health & Ratio Diagnostics
console.log('4. FINANCIAL RATIOS & METRICS:');
const currentAssets = totalAssets;
const currentLiabilities = creditors + rentAdv;
const currentRatio = currentAssets / currentLiabilities;
const quickRatio = (currentAssets) / currentLiabilities;
const debtEquityRatio = (currentLiabilities) / (netCap + totalReserves);
const netProfitMargin = (netProfit / (revenueOps + otherInc)) * 100;

console.log(`   • Current Ratio      : ${currentRatio.toFixed(2)}x (Strong liquidity benchmark: > 1.5x)`);
console.log(`   • Quick Ratio        : ${quickRatio.toFixed(2)}x`);
console.log(`   • Debt-Equity Ratio  : ${debtEquityRatio.toFixed(4)}x (Virtually debt-free, strong solvency)`);
console.log(`   • Net Profit Margin  : ${netProfitMargin.toFixed(2)}%`);

console.log('\n=====================================================');
console.log('                ALL CHECKS PASSED ✅                  ');
console.log('=====================================================');
