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

// Determine the parent category for each leaf row
let currentCategory = '';
let currentSubCategory = '';

const leafList = [];

for (let i = 12; i < rawData.length; i++) {
  const row = rawData[i];
  if (!row || !row[0]) continue;
  const name = String(row[0]).trim();

  if (parentGroups.has(name)) {
    if (['Capital Account', 'Current Liabilities', 'Fixed Assets', 'Current Assets', 'Sales Accounts', 'Indirect Incomes', 'Indirect Expenses'].includes(name)) {
      currentCategory = name;
      currentSubCategory = '';
    } else {
      currentSubCategory = name;
    }
    continue;
  }

  const opening = row[1] != null ? Number(row[1]) : 0;
  const debit = row[2] != null ? Number(row[2]) : 0;
  const credit = row[3] != null ? Number(row[3]) : 0;
  const closing = row[4] != null ? Number(row[4]) : 0;

  // Let's determine if closing balance is Dr or Cr based on standard accounting
  // In Tally:
  // Capital Account -> Cr
  // Current Liabilities -> Cr (unless negative)
  // Deffered Tax Liability -> Cr
  // Fixed Assets -> Dr (except Accumulated Depreciation -> Cr)
  // Current Assets -> Dr (except Imprest with Cr -> Cr)
  // Sales Accounts -> Cr
  // Indirect Incomes -> Cr
  // Indirect Expenses -> Dr (except Rounded off Cr -> Cr)
  // Profit & Loss A/c -> Cr (or Dr if debit balance)

  leafList.push({
    name,
    category: currentCategory,
    subCategory: currentSubCategory,
    opening,
    debit,
    credit,
    closing
  });
}

console.log('Leaf count:', leafList.length);
