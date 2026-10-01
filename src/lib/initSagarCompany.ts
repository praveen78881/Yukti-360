import {
  createCompany,
  updateCompany,
  listCompanies,
  createInitialBookPeriod,
  createJournalEntry,
  listJournalEntries,
  deleteJournalEntry,
  registerCustomAccounts,
} from '@/lib/offlineDb';
import type { JournalLine } from '@/types/journal';
import { generateUniqueShortEntryCode } from '@/lib/utils/entryCodeGenerator';

const SAGAR_FLAG_KEY = 'ca_sagar_initialized_v4';
const SAGAR_COMPANY_NAME = 'Sagar Private Limited';

export function initSagarCompanyOnce(): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;

  const existingCompanies = listCompanies();
  const existing = existingCompanies.find(
    (c) =>
      c.name.trim().toLowerCase() === SAGAR_COMPANY_NAME.toLowerCase() ||
      c.name.trim().toLowerCase() === 'sagar'
  );

  let companyId = existing?.id;

  const pvtLtdEntityDetails = {
    cin: 'U74999KA2024PTC188888',
    pan: 'AAACS1234F',
    tradeName: 'Sagar Private Limited',
    address: '#42, Commercial Street, Tasker Town',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    phone: '+91 98450 12345',
    email: 'accounts@sagarpvtltd.in',
    disclosureLevel: 'I' as const,
    shareCapital: {
      authorizedCapital: 10000000,
      issuedCapital: 9421888,
      subscribedCapital: 9421888,
      paidUpCapital: 9421888,
      faceValuePerShare: 10,
      totalShares: 1000000,
    },
  };

  const gstDetails = {
    gstin: '29AAACS1234F1Z5',
    gstScheme: 'regular' as const,
    stateCode: '29',
    registrationDate: '2024-04-01',
  };

  if (!existing) {
    const company = createCompany({
      name: SAGAR_COMPANY_NAME,
      entity_type: 'pvt_ltd',
      entity_details: pvtLtdEntityDetails,
      business_nature: ['Trading', 'Services', 'Investments'],
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
    // Ensure company name and type are Private Limited
    void updateCompany(existing.id, {
      name: SAGAR_COMPANY_NAME,
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

  // Register all accounts so they appear in Chart of Accounts & registers
  const accountsToRegister: Array<{ name: string; group: string; nature: string }> = [
    { name: 'Drawings', group: 'Share Capital', nature: 'capital' },
    { name: 'Lalitha Capital A/c', group: 'Share Capital', nature: 'capital' },
    { name: 'Rental Advance', group: 'Other Current Liabilities', nature: 'liability' },
    { name: 'Duties & Taxes', group: 'Other Current Assets', nature: 'asset' },
    { name: 'Sundry Creditors', group: 'Trade Payables', nature: 'liability' },
    { name: 'Loans & Advances (Asset)', group: 'Short-term Loans & Advances', nature: 'asset' },
    { name: 'Sundry Debtors', group: 'Trade Receivables', nature: 'asset' },
    { name: 'Cash-in-Hand', group: 'Cash & Cash Equivalents', nature: 'asset' },
    { name: 'Bank Accounts', group: 'Bank Balances', nature: 'asset' },
    { name: 'TDS RECEIVABLE FY 2025-26', group: 'Other Current Assets', nature: 'asset' },
    { name: 'Interest Income', group: 'Revenue from Operations', nature: 'revenue' },
    { name: 'Rental Income', group: 'Revenue from Operations', nature: 'revenue' },
    { name: 'Rental Income — Additional', group: 'Revenue from Operations', nature: 'revenue' },
    { name: 'Satish Store Int', group: 'Revenue from Operations', nature: 'revenue' },
    { name: 'Subha Luxury Int', group: 'Revenue from Operations', nature: 'revenue' },
    { name: 'Interest on FD', group: 'Other Income', nature: 'revenue' },
    { name: 'Interest on SB A/Cs', group: 'Other Income', nature: 'revenue' },
    { name: 'IT REFUND', group: 'Other Income', nature: 'revenue' },
    { name: 'Bank Charges', group: 'Finance Costs', nature: 'expense' },
    { name: 'Insurance Expenses', group: 'Other Expenses', nature: 'expense' },
    { name: 'Profit & Loss A/c', group: 'Reserves & Surplus', nature: 'capital' },
  ];

  // One load/save for the whole list (same per-account rules as the single form).
  registerCustomAccounts(companyId, accountsToRegister);

  // If already initialized with v4, skip recreating
  if (window.localStorage.getItem(SAGAR_FLAG_KEY) === '1') {
    return;
  }

  // Clear any existing entries for fresh perfectly balanced state
  const oldEntries = listJournalEntries(companyId);
  for (const old of oldEntries) {
    deleteJournalEntry(old.id);
  }

  const existingCodes = new Set<string>();
  const entryCode = generateUniqueShortEntryCode(existingCodes);

  const lines: JournalLine[] = [
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

  createJournalEntry({
    company_id: companyId,
    entry_code: entryCode,
    entry_date: '2025-04-01',
    voucher_type: 'JRN',
    voucher_number: 'JV/2025-26/001',
    narration: 'Trial Balance & Ledger Balances FY 2025-26',
    book_period: 'FY 2025-26',
    is_opening: true,
    lines,
  });

  window.localStorage.setItem(SAGAR_FLAG_KEY, '1');
}
