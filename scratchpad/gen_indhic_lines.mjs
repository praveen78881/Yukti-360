import XLSX from 'xlsx';
import fs from 'fs';

const wb = XLSX.readFile('../Trial Balance - Indhic.xlsx');
const ws = wb.Sheets['Sheet1'];
const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

const parentRows = new Set([
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

const openingLines = [];
const txLines = [];
const allAccounts = [];

for (let i = 12; i < rawData.length - 1; i++) {
  const row = rawData[i];
  if (!row || !row[0]) continue;
  const name = String(row[0]).trim();

  if (parentRows.has(name)) {
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

  // Determine group and nature
  let group = 'Other Expenses';
  let nature = 'expense';

  if (name.startsWith('Share Capital')) {
    group = 'Share Capital';
    nature = 'capital';
  } else if (name === 'Profit & Loss A/c') {
    group = 'Reserves & Surplus';
    nature = 'capital';
  } else if (name === 'Deffered Tax Liability') {
    group = 'Deferred Tax Liability';
    nature = 'liability';
  } else if (currentSub === 'Sundry Creditors') {
    group = 'Trade Payables';
    nature = 'liability';
  } else if (currentSub === 'Duties & Taxes') {
    if (name.includes('Input')) {
      group = 'Other Current Assets';
      nature = 'asset';
    } else {
      group = 'Statutory Liabilities';
      nature = 'liability';
    }
  } else if (currentSub === 'Directors Remuneration Payable' || currentSub === 'Salary Payable') {
    group = 'Other Current Liabilities';
    nature = 'liability';
  } else if (currentCat === 'Fixed Assets') {
    if (name.startsWith('Accumulated Depreciation')) {
      group = 'Accumulated Depreciation';
      nature = 'asset';
    } else if (name.includes('License')) {
      group = 'Intangible Assets';
      nature = 'asset';
    } else {
      group = 'Tangible Fixed Assets';
      nature = 'asset';
    }
  } else if (currentCat === 'Current Assets') {
    if (currentSub === 'Sundry Debtors') {
      group = 'Trade Receivables';
      nature = 'asset';
    } else if (currentSub === 'HDFC') {
      group = 'Bank Balances';
      nature = 'asset';
    } else if (name.includes('Imprest')) {
      group = 'Short-term Loans & Advances';
      nature = 'asset';
    } else if (name.includes('Advance Tax') || name.includes('TCS') || name.includes('Income Tax Refund')) {
      group = 'Other Current Assets';
      nature = 'asset';
    } else if (name.includes('Incorporation')) {
      group = 'Other Non-current Assets';
      nature = 'asset';
    } else {
      group = 'Short-term Loans & Advances';
      nature = 'asset';
    }
  } else if (currentCat === 'Sales Accounts') {
    group = 'Revenue from Operations';
    nature = 'revenue';
  } else if (currentCat === 'Indirect Incomes') {
    group = 'Other Income';
    nature = 'revenue';
  } else if (currentCat === 'Indirect Expenses') {
    if (name === 'Rounded Off') {
      group = 'Other Income';
      nature = 'revenue';
    } else if (currentSub === 'Employee Benifit Expenses') {
      group = 'Employee Benefits Expense';
      nature = 'expense';
    } else if (currentSub === 'Financial Cost' || name.includes('Bank Charges')) {
      group = 'Finance Costs';
      nature = 'expense';
    } else {
      group = 'Other Expenses';
      nature = 'expense';
    }
  }

  allAccounts.push({ name, group, nature });

  // Opening line (if non-zero)
  if (op !== 0) {
    // Determine if opening is Dr or Cr
    // In our audit:
    // Credits: Share Capital, TDS Consultancy, Avinash, Bharat Shetty Barkur, Bhaskar Shetty, Nutan Mungila, Imagine, Deffered Tax Liability, Accum Deprec, Profit & Loss A/c
    const isOpCredit = [
      'Share Capital - Parimala Ramakrishna Bhat',
      'Share Capital - U K Shetty',
      'TDS Consultancy',
      'Avinash Sagar and Associates',
      'Consultant Fees - Bharat Shetty Barkur',
      'Consultant Fees - Bhaskar Shetty',
      'Consultant Fees - Nutan Mungila',
      'Imagine - Nexus Koramangala Bengaluru',
      'Deffered Tax Liability',
      'Accumulated Depreciation - Computer and Accessories',
      'Accumulated Depreciation - Plant and Machinery',
      'Profit & Loss A/c'
    ].includes(name);

    openingLines.push({
      account_name: name,
      account_group: group,
      nature,
      debit: isOpCredit ? 0 : op,
      credit: isOpCredit ? op : 0
    });
  }

  // Transaction line (if non-zero)
  if (dr !== 0 || cr !== 0) {
    txLines.push({
      account_name: name,
      account_group: group,
      nature,
      debit: dr,
      credit: cr
    });
  }
}

console.log('Opening lines count:', openingLines.length);
console.log('Tx lines count:', txLines.length);

const opDr = openingLines.reduce((s, l) => s + l.debit, 0);
const opCr = openingLines.reduce((s, l) => s + l.credit, 0);
console.log('Opening Dr:', opDr, 'Cr:', opCr, 'Diff:', opDr - opCr);

const txDr = txLines.reduce((s, l) => s + l.debit, 0);
const txCr = txLines.reduce((s, l) => s + l.credit, 0);
console.log('Tx Dr:', txDr, 'Cr:', txCr, 'Diff:', txDr - txCr);
