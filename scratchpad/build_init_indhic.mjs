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

  if (op !== 0) {
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
      debit: isOpCredit ? 0 : Math.round(op * 100) / 100,
      credit: isOpCredit ? Math.round(op * 100) / 100 : 0
    });
  }

  if (dr > 0) {
    txLines.push({
      account_name: name,
      account_group: group,
      nature,
      debit: Math.round(dr * 100) / 100,
      credit: 0
    });
  }

  if (cr > 0) {
    txLines.push({
      account_name: name,
      account_group: group,
      nature,
      debit: 0,
      credit: Math.round(cr * 100) / 100
    });
  }
}

const fileContent = `import {
  createCompany,
  updateCompany,
  listCompanies,
  createInitialBookPeriod,
  createJournalEntry,
  listJournalEntries,
  deleteJournalEntry,
  registerCustomAccount,
} from '@/lib/offlineDb';
import type { JournalLine } from '@/types/journal';
import { generateUniqueShortEntryCode } from '@/lib/utils/entryCodeGenerator';

const INDHIC_FLAG_KEY = 'ca_indhic_initialized_v2';
const INDHIC_COMPANY_NAME = 'Indhic Software Private Limited';

export function initIndhicCompanyOnce(): void {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;

    const existingCompanies = listCompanies();
    const existing = existingCompanies.find(
      (c) =>
        c.name.trim().toLowerCase() === INDHIC_COMPANY_NAME.toLowerCase() ||
        c.name.trim().toLowerCase() === 'indhic'
    );

    let companyId = existing?.id;

    const pvtLtdEntityDetails = {
      cin: 'U62099KA2024PTC191931',
      pan: 'AABCI1234F',
      tradeName: 'Indhic Software Private Limited',
      address: 'No.346, Himagiri Meadows, Gottigere, Bannerghatta Main Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560083',
      phone: '+91 98450 99887',
      email: 'indhicltd@gmail.com',
      disclosureLevel: 'I' as const,
      shareCapital: {
        authorizedCapital: 1000000,
        issuedCapital: 100000,
        subscribedCapital: 100000,
        paidUpCapital: 100000,
        faceValuePerShare: 10,
        totalShares: 100000,
      },
    };

    const gstDetails = {
      gstin: '29AABCI1234F1Z5',
      gstScheme: 'regular' as const,
      stateCode: '29',
      registrationDate: '2024-04-01',
    };

    if (!existing) {
      const company = createCompany({
        name: INDHIC_COMPANY_NAME,
        entity_type: 'pvt_ltd',
        entity_details: pvtLtdEntityDetails,
        business_nature: ['Software Development', 'IT Services', 'Consulting'],
        inventory_enabled: false,
        inventory_config: {
          valuationMethod: 'fifo',
          pettyCashThreshold: 5000,
        },
        gst_status: 'regular',
        gst_details: gstDetails,
        tds_applicable: true,
        tcs_applicable: false,
        accounting_method: 'mercantile',
        financial_year_start: 'april',
      });

      companyId = company.id;
      createInitialBookPeriod(company.id);
    } else {
      void updateCompany(existing.id, {
        name: INDHIC_COMPANY_NAME,
        entity_type: 'pvt_ltd',
        entity_details: {
          ...(existing.entity_details || {}),
          ...pvtLtdEntityDetails,
        },
        gst_details: {
          ...(existing.gst_details || {}),
          ...gstDetails,
        },
      });
    }

    if (!companyId) return;

    const accountsToRegister = ${JSON.stringify(allAccounts, null, 2)};

    for (const acct of accountsToRegister) {
      registerCustomAccount(companyId, acct.name, acct.group, acct.nature);
    }

    if (window.localStorage.getItem(INDHIC_FLAG_KEY) === '1') {
      return;
    }

    const oldEntries = listJournalEntries(companyId);
    for (const old of oldEntries) {
      deleteJournalEntry(old.id);
    }

    const existingCodes = new Set<string>();

    // 1. Opening Balances Entry
    const openingCode = generateUniqueShortEntryCode(existingCodes);
    existingCodes.add(openingCode);

    const openingLines: JournalLine[] = ${JSON.stringify(openingLines, null, 2)};

    createJournalEntry({
      company_id: companyId,
      entry_code: openingCode,
      entry_date: '2025-04-01',
      voucher_type: 'JRN',
      voucher_number: 'OP/2025-26/001',
      narration: 'Opening Balances as at 01-Apr-2025',
      book_period: 'FY 2025-26',
      is_opening: true,
      lines: openingLines,
    });

    // 2. Transactions Entry FY 2025-26
    const txCode = generateUniqueShortEntryCode(existingCodes);
    existingCodes.add(txCode);

    const txLines: JournalLine[] = ${JSON.stringify(txLines, null, 2)};

    createJournalEntry({
      company_id: companyId,
      entry_code: txCode,
      entry_date: '2026-03-31',
      voucher_type: 'JRN',
      voucher_number: 'JV/2025-26/001',
      narration: 'Annual Transactions & Revenue/Expenses for FY 2025-26',
      book_period: 'FY 2025-26',
      is_opening: false,
      lines: txLines,
    });

    window.localStorage.setItem(INDHIC_FLAG_KEY, '1');
  } catch (err) {
    console.error('initIndhicCompanyOnce failed:', err);
  }
}
`;

fs.writeFileSync('src/lib/initIndhicCompany.ts', fileContent);
console.log('src/lib/initIndhicCompany.ts rebuilt with valid single-sided debit/credit lines!');
