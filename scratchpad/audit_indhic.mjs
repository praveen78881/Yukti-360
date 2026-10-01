import XLSX from 'xlsx';

const wb = XLSX.readFile('../Trial Balance - Indhic.xlsx');
const ws = wb.Sheets['Sheet1'];
const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

const parentGroups = new Set([
  'Capital Account',
  'Current Liabilities',
  'Duties & Taxes',
  'Sundry Creditors',
  'Directors Remuneration Payable',
  'Salary Payable',
  'Fixed Assets',
  'Computer and Accessories',
  'Motor Vehicles',
  'Office Equipment',
  'Plant and Machinery',
  'Current Assets',
  'Sundry Debtors',
  'HDFC',
  'Imprest A/c',
  'Income Tax Refund Due',
  'Sales Accounts',
  'Indirect Incomes',
  'Indirect Expenses',
  'Administrative Expenses',
  'Employee Benifit Expenses',
  'Directors Remuneration',
  'Financial Cost',
  'Grand Total'
]);

let currentCat = '';
let currentSub = '';

const accounts = [];

for (let i = 12; i < rawData.length; i++) {
  const row = rawData[i];
  if (!row || !row[0]) continue;
  const name = String(row[0]).trim();

  if (parentGroups.has(name)) {
    if ([
      'Capital Account',
      'Current Liabilities',
      'Fixed Assets',
      'Current Assets',
      'Sales Accounts',
      'Indirect Incomes',
      'Indirect Expenses'
    ].includes(name)) {
      currentCat = name;
      currentSub = '';
    } else {
      currentSub = name;
    }
    continue;
  }

  const op = Number(row[1]) || 0;
  const dr = Number(row[2]) || 0;
  const cr = Number(row[3]) || 0;
  const cl = Number(row[4]) || 0;

  accounts.push({
    name,
    cat: currentCat,
    sub: currentSub,
    op,
    dr,
    cr,
    cl
  });
}

for (const a of accounts) {
  let side = 'Dr';
  let group = '';
  let nature = 'asset';

  if (a.name.startsWith('Share Capital')) {
    side = 'Cr';
    group = 'Share Capital';
    nature = 'capital';
  } else if (a.cat === 'Current Liabilities' || a.name === 'Deffered Tax Liability') {
    if (a.name.includes('Input')) {
      side = 'Dr';
      group = 'Other Current Assets';
      nature = 'asset';
    } else if (a.name === 'Deffered Tax Liability') {
      side = 'Cr';
      group = 'Deferred Tax Liability';
      nature = 'liability';
    } else if (a.sub === 'Sundry Creditors') {
      side = 'Cr';
      group = 'Trade Payables';
      nature = 'liability';
    } else if (a.sub === 'Duties & Taxes') {
      side = 'Cr';
      group = 'Statutory Liabilities';
      nature = 'liability';
    } else {
      side = 'Cr';
      group = 'Other Current Liabilities';
      nature = 'liability';
    }
  } else if (a.cat === 'Fixed Assets') {
    if (a.name.startsWith('Accumulated Depreciation')) {
      side = 'Cr';
      group = 'Accumulated Depreciation';
      nature = 'asset';
    } else if (a.name.includes('License')) {
      side = 'Dr';
      group = 'Intangible Assets';
      nature = 'asset';
    } else {
      side = 'Dr';
      group = 'Tangible Fixed Assets';
      nature = 'asset';
    }
  } else if (a.cat === 'Current Assets') {
    if (a.sub === 'Sundry Debtors') {
      side = 'Dr';
      group = 'Trade Receivables';
      nature = 'asset';
    } else if (a.sub === 'HDFC') {
      side = 'Dr';
      group = 'Bank Balances';
      nature = 'asset';
    } else if (a.name === 'Imprest - Ganaraj' || a.name === 'Imprest - Bharat Shetty Barkur') {
      side = 'Cr';
      group = 'Other Current Liabilities';
      nature = 'liability';
    } else if (a.name.includes('Advance Tax') || a.name.includes('TCS')) {
      side = 'Dr';
      group = 'Other Current Assets';
      nature = 'asset';
    } else if (a.name.includes('Incorporation')) {
      side = 'Dr';
      group = 'Other Non-current Assets';
      nature = 'asset';
    } else {
      side = 'Dr';
      group = 'Short-term Loans & Advances';
      nature = 'asset';
    }
  } else if (a.cat === 'Sales Accounts') {
    side = 'Cr';
    group = 'Revenue from Operations';
    nature = 'revenue';
  } else if (a.cat === 'Indirect Incomes') {
    side = 'Cr';
    group = 'Other Income';
    nature = 'revenue';
  } else if (a.cat === 'Indirect Expenses') {
    if (a.name === 'Rounded Off') {
      side = 'Cr';
      group = 'Other Income';
      nature = 'revenue';
    } else if (a.sub === 'Employee Benifit Expenses') {
      side = 'Dr';
      group = 'Employee Benefits Expense';
      nature = 'expense';
    } else if (a.sub === 'Financial Cost' || a.name.includes('Bank Charges')) {
      side = 'Dr';
      group = 'Finance Costs';
      nature = 'expense';
    } else {
      side = 'Dr';
      group = 'Other Expenses';
      nature = 'expense';
    }
  } else if (a.name === 'Profit & Loss A/c') {
    side = 'Cr';
    group = 'Reserves & Surplus';
    nature = 'capital';
  }

  a.inferredSide = side;
  a.inferredGroup = group;
  a.inferredNature = nature;
}

let sumDr = 0;
let sumCr = 0;

for (const a of accounts) {
  if (a.cl === 0) continue;
  if (a.inferredSide === 'Dr') {
    sumDr += a.cl;
  } else {
    sumCr += a.cl;
  }
}

console.log('=== TRIAL BALANCE ===');
console.log('Sum Dr:', sumDr.toFixed(2));
console.log('Sum Cr:', sumCr.toFixed(2));
console.log('Diff:', (sumDr - sumCr).toFixed(2));
console.log('BALANCED:', Math.abs(sumDr - sumCr) < 0.01);

// Now let's calculate P&L and Balance Sheet
const revOps = accounts.filter(a => a.inferredGroup === 'Revenue from Operations').reduce((s, a) => s + a.cl, 0);
const othInc = accounts.filter(a => a.inferredGroup === 'Other Income').reduce((s, a) => s + a.cl, 0);
const empExp = accounts.filter(a => a.inferredGroup === 'Employee Benefits Expense').reduce((s, a) => s + a.cl, 0);
const finExp = accounts.filter(a => a.inferredGroup === 'Finance Costs').reduce((s, a) => s + a.cl, 0);
const othExp = accounts.filter(a => a.inferredGroup === 'Other Expenses').reduce((s, a) => s + a.cl, 0);

const totalInc = revOps + othInc;
const totalExp = empExp + finExp + othExp;
const netProfit = totalInc - totalExp;

console.log('\n=== PROFIT & LOSS ===');
console.log('Revenue from Operations:', revOps.toFixed(2));
console.log('Other Income:', othInc.toFixed(2));
console.log('Total Revenue:', totalInc.toFixed(2));
console.log('Employee Benefits:', empExp.toFixed(2));
console.log('Finance Costs:', finExp.toFixed(2));
console.log('Other Expenses:', othExp.toFixed(2));
console.log('Total Expenses:', totalExp.toFixed(2));
console.log('Net Profit for Year:', netProfit.toFixed(2));

// Balance Sheet
const shareCap = accounts.filter(a => a.inferredGroup === 'Share Capital').reduce((s, a) => s + a.cl, 0);
const opPnL = accounts.find(a => a.name === 'Profit & Loss A/c').cl;
const totalReserves = opPnL + netProfit;
const defTaxLiab = accounts.filter(a => a.inferredGroup === 'Deferred Tax Liability').reduce((s, a) => s + a.cl, 0);
const tradePayables = accounts.filter(a => a.inferredGroup === 'Trade Payables').reduce((s, a) => s + a.cl, 0);
const otherCL = accounts.filter(a => a.inferredGroup === 'Other Current Liabilities' || a.inferredGroup === 'Statutory Liabilities').reduce((s, a) => s + a.cl, 0);

const totalEquityLiab = shareCap + totalReserves + defTaxLiab + tradePayables + otherCL;

const tangFA = accounts.filter(a => a.inferredGroup === 'Tangible Fixed Assets').reduce((s, a) => s + a.cl, 0);
const accumDep = accounts.filter(a => a.inferredGroup === 'Accumulated Depreciation').reduce((s, a) => s + a.cl, 0);
const intangFA = accounts.filter(a => a.inferredGroup === 'Intangible Assets').reduce((s, a) => s + a.cl, 0);
const othNCA = accounts.filter(a => a.inferredGroup === 'Other Non-current Assets').reduce((s, a) => s + a.cl, 0);

const tradeReceiv = accounts.filter(a => a.inferredGroup === 'Trade Receivables').reduce((s, a) => s + a.cl, 0);
const bankBal = accounts.filter(a => a.inferredGroup === 'Bank Balances').reduce((s, a) => s + a.cl, 0);
const stLoans = accounts.filter(a => a.inferredGroup === 'Short-term Loans & Advances').reduce((s, a) => s + a.cl, 0);
const othCA = accounts.filter(a => a.inferredGroup === 'Other Current Assets').reduce((s, a) => s + a.cl, 0);

const totalAssets = (tangFA - accumDep + intangFA + othNCA) + (tradeReceiv + bankBal + stLoans + othCA);

console.log('\n=== SCHEDULE III BALANCE SHEET ===');
console.log('Share Capital:', shareCap.toFixed(2));
console.log('Reserves & Surplus (Opening P&L + Net Profit):', totalReserves.toFixed(2));
console.log('Deferred Tax Liability:', defTaxLiab.toFixed(2));
console.log('Trade Payables:', tradePayables.toFixed(2));
console.log('Other Current Liabilities & Statutory:', otherCL.toFixed(2));
console.log('TOTAL EQUITY & LIABILITIES:', totalEquityLiab.toFixed(2));

console.log('\nNet Fixed Assets & Intangibles & NCA:', (tangFA - accumDep + intangFA + othNCA).toFixed(2));
console.log('Trade Receivables:', tradeReceiv.toFixed(2));
console.log('Bank Balances:', bankBal.toFixed(2));
console.log('Short-term Loans & Advances:', stLoans.toFixed(2));
console.log('Other Current Assets:', othCA.toFixed(2));
console.log('TOTAL ASSETS:', totalAssets.toFixed(2));

console.log('\nBS Difference:', (totalEquityLiab - totalAssets).toFixed(2));
console.log('BS BALANCED:', Math.abs(totalEquityLiab - totalAssets) < 0.01);
