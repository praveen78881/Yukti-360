import XLSX from 'xlsx';

const wb = XLSX.readFile('../Trial Balance - Indhic.xlsx');
const ws = wb.Sheets['Sheet1'];
const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Let's inspect column 1 (Opening), column 2 (Debit), column 3 (Credit), column 4 (Closing)
// In Tally:
// Opening Balance can be Dr or Cr.
// Let's sum all leaf account Opening, Debits, Credits, and Closings.

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

let sumLeafDr = 0;
let sumLeafCr = 0;
let count = 0;

for (let i = 12; i < rawData.length - 1; i++) {
  const row = rawData[i];
  if (!row || !row[0]) continue;
  const name = String(row[0]).trim();
  if (parentRows.has(name)) continue;

  const dr = Number(row[2]) || 0;
  const cr = Number(row[3]) || 0;

  sumLeafDr += dr;
  sumLeafCr += cr;
  count++;
}

console.log(`Leaf Count: ${count}`);
console.log(`Sum Leaf Debits : ${sumLeafDr.toFixed(2)} (Expected: 62169674.37)`);
console.log(`Sum Leaf Credits: ${sumLeafCr.toFixed(2)} (Expected: 62169674.37)`);
console.log(`Difference      : ${(sumLeafDr - sumLeafCr).toFixed(2)}`);
