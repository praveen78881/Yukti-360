import XLSX from 'xlsx';

const wb = XLSX.readFile('../Trial Balance - Indhic.xlsx');
const ws = wb.Sheets['Sheet1'];
const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

console.log('Total Raw Rows:', rawData.length);

// Let us inspect the hierarchy and leaf accounts
// Rows 0-11 are headers
// Rows 12 onwards are data
// Columns: 0: Name, 1: Opening, 2: Debit, 3: Credit, 4: Closing

const rows = rawData.slice(12);

// Groups in Tally TB:
// Capital Account
//   Share Capital - Parimala Ramakrishna Bhat
//   Share Capital - U K Shetty
// Current Liabilities
//   Duties & Taxes
//     CGST Input 14%
//     CGST Input 9%
//     CGST Output 9%
//     Professional Tax
//     SGST Input 14%
//     SGST Input 9%
//     SGST Output 9%
//     TDS Consultancy
//     Tds Salary
//   Sundry Creditors
//     ...
//   Directors Remuneration Payable
//     ...
//   Salary Payable
//     ...
// Deffered Tax Liability
// Fixed Assets
//   Computer and Accessories
//     11' IPad Air Wi-Fi 256GB - Purple
//     13 inch MacBook Air Apple M4 - Laptop
//     Accumulated Depreciation - Computer and Accessories
//     MacBook Pro Apple M4 Max - Space Black
//   Motor Vehicles
//     Mahindra BE6 Three B79 HIP R19 NCH WS - Car
//   Office Equipment
//     Google Pixel Mobile
//     Luminous EVO S 1250/12V UPS System
//     Printer
//   Plant and Machinery
//     Accumulated Depreciation - Plant and Machinery
//     Air Conditioner
//   Tally Singer User License - 784047582
// Current Assets
//   Sundry Debtors
//     Big Picture Software Ltd
//     Intelehealth, Inc
//     Satvik Foods Pvt Ltd
//     Telehealth Innovations Foundation
//   HDFC
//     HDFC Bank - Manyata Tech Park Branch
//   Imprest A/c
//     Imprest - Bharat Shetty Barkur
//     Imprest Nutan Mungila
//   Income Tax Refund Due
//     Income Tax Refund AY 2025-26
//   Advance Tax
//   Imprest - Ganaraj
//   Incorporation Expenses - Preliminary
//   TCS 1% on Purchase of Car
// Sales Accounts
//   Service Charges Received - Local
//   Service Charges Received - Out of Country
// Indirect Incomes
//   Interest on Income Tax Refund
// Indirect Expenses
//   Administrative Expenses
//     Food Expenses
//     Office Maintanance
//     Petrol Charges for Director Car
//   Employee Benifit Expenses
//     Directors Remuneration
//       Sal - Bharat Shetty
//       Sal - Parimala R Bhat
//     Bonus to Directors
//     Incentives to Employees
//     Sal - Bhaskar Shetty T
//     Sal - Ksuha
//     Sal - Myadaram Sai Kiran
//     Sal - Nutan Mungila
//   Financial Cost
//     Bank Charges & Commission - HDFC Bank
//   AI Software Charges
//   Audit Fees
//   Car Accessories
//   Car Registration
//   Consultancy Charges
//   Insurance of Vehicle (Car)
//   Interest on TDS
//   Local Conveyance
//   Preliminary Expenses
//   Professional Charges
//   ROC Filing Charges
//   Rounded Off
//   Travelling Directors
// Profit & Loss A/c

// Let us write an explicit list of all leaf ledger accounts and their exact closing Dr/Cr
