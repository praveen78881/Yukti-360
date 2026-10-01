import XLSX from 'xlsx';

const wb = XLSX.readFile('../Trial Balance - Indhic.xlsx');
const ws = wb.Sheets['Sheet1'];
const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Group headers that are parent categories (NOT leaf accounts)
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

// Let's inspect each row and classify it
const leafAccounts = [];

for (let i = 12; i < rawData.length; i++) {
  const row = rawData[i];
  if (!row || !row[0]) continue;
  const name = String(row[0]).trim();
  if (parentGroups.has(name)) continue;

  const opening = row[1] != null ? Number(row[1]) : 0;
  const debit = row[2] != null ? Number(row[2]) : 0;
  const credit = row[3] != null ? Number(row[3]) : 0;
  const closing = row[4] != null ? Number(row[4]) : 0;

  leafAccounts.push({
    rowIdx: i,
    name,
    opening,
    debit,
    credit,
    closing,
    rawRow: row
  });
}

console.log('Found', leafAccounts.length, 'leaf accounts:');
leafAccounts.forEach(a => console.log(`${a.name} | Closing: ${a.closing} | Dr: ${a.debit} | Cr: ${a.credit} | Op: ${a.opening}`));
