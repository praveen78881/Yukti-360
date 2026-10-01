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

    const accountsToRegister = [
  {
    "name": "Share Capital - Parimala Ramakrishna Bhat",
    "group": "Share Capital",
    "nature": "capital"
  },
  {
    "name": "Share Capital - U K Shetty",
    "group": "Share Capital",
    "nature": "capital"
  },
  {
    "name": "CGST Input 14%",
    "group": "Other Current Assets",
    "nature": "asset"
  },
  {
    "name": "CGST Input 9%",
    "group": "Other Current Assets",
    "nature": "asset"
  },
  {
    "name": "CGST Output 9%",
    "group": "Statutory Liabilities",
    "nature": "liability"
  },
  {
    "name": "Professional Tax",
    "group": "Statutory Liabilities",
    "nature": "liability"
  },
  {
    "name": "SGST Input 14%",
    "group": "Other Current Assets",
    "nature": "asset"
  },
  {
    "name": "SGST Input 9%",
    "group": "Other Current Assets",
    "nature": "asset"
  },
  {
    "name": "SGST Output 9%",
    "group": "Statutory Liabilities",
    "nature": "liability"
  },
  {
    "name": "TDS Consultancy",
    "group": "Statutory Liabilities",
    "nature": "liability"
  },
  {
    "name": "Tds Salary",
    "group": "Statutory Liabilities",
    "nature": "liability"
  },
  {
    "name": "Ample TechnologiesPvtLtd",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Anantcars  Auto Pvt Ltd",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Apple India Pvt Ltd Hebbal",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Avinash Sagar and Associates",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Consultancy Charges - Hemanth Shetty",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Consultancy Charges - Raghuveer B R",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Consultancy Fees - Insha Manowar",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Consultancy Fees - Myadaram Sai Kiran",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Consultancy Fees - Others",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Consultancy Fees - Parth Narayan Relekar",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Consultancy Fees - Taniya Souza",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Consultant Fees - Bharat Shetty Barkur",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Consultant Fees - Bhaskar Shetty",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Consultant Fees - Nutan Mungila",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Consultant Fees - Ratna B Shetty",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "GET ERP Business Tech Pvt Ltd",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Imagine - Nexus Koramangala Bengaluru",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Infiniti Retail Limited Trading As CROMA",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Sathya Technologies",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "S & S Co - Company Secretaries",
    "group": "Trade Payables",
    "nature": "liability"
  },
  {
    "name": "Salpayable - Bharat Shetty",
    "group": "Other Current Liabilities",
    "nature": "liability"
  },
  {
    "name": "Salpayable - Parimala R Bhat",
    "group": "Other Current Liabilities",
    "nature": "liability"
  },
  {
    "name": "Salary Payable - Bhaskar Shetty T",
    "group": "Other Current Liabilities",
    "nature": "liability"
  },
  {
    "name": "Salary Payable - Myadaram Sai Kiran",
    "group": "Other Current Liabilities",
    "nature": "liability"
  },
  {
    "name": "Salpayable - Kusha",
    "group": "Other Current Liabilities",
    "nature": "liability"
  },
  {
    "name": "Salpayable - Nutan Mungila",
    "group": "Other Current Liabilities",
    "nature": "liability"
  },
  {
    "name": "Deffered Tax Liability",
    "group": "Deferred Tax Liability",
    "nature": "liability"
  },
  {
    "name": "11' IPad Air Wi-Fi 256GB - Purple",
    "group": "Tangible Fixed Assets",
    "nature": "asset"
  },
  {
    "name": "13 inch MacBook Air Apple M4 - Laptop",
    "group": "Tangible Fixed Assets",
    "nature": "asset"
  },
  {
    "name": "Accumulated Depreciation - Computer and Accessories",
    "group": "Accumulated Depreciation",
    "nature": "asset"
  },
  {
    "name": "MacBook Pro Apple M4 Max - Space Black",
    "group": "Tangible Fixed Assets",
    "nature": "asset"
  },
  {
    "name": "Mahindra BE6 Three B79 HIP R19 NCH WS - Car",
    "group": "Tangible Fixed Assets",
    "nature": "asset"
  },
  {
    "name": "Google Pixel Mobile",
    "group": "Tangible Fixed Assets",
    "nature": "asset"
  },
  {
    "name": "Luminous EVO S 1250/12V UPS System",
    "group": "Tangible Fixed Assets",
    "nature": "asset"
  },
  {
    "name": "Printer",
    "group": "Tangible Fixed Assets",
    "nature": "asset"
  },
  {
    "name": "Accumulated Depreciation - Plant and Machinery",
    "group": "Accumulated Depreciation",
    "nature": "asset"
  },
  {
    "name": "Air Conditioner",
    "group": "Tangible Fixed Assets",
    "nature": "asset"
  },
  {
    "name": "Tally Singer User License - 784047582",
    "group": "Intangible Assets",
    "nature": "asset"
  },
  {
    "name": "Big Picture Software Ltd",
    "group": "Trade Receivables",
    "nature": "asset"
  },
  {
    "name": "Intelehealth, Inc",
    "group": "Trade Receivables",
    "nature": "asset"
  },
  {
    "name": "Satvik Foods Pvt Ltd",
    "group": "Trade Receivables",
    "nature": "asset"
  },
  {
    "name": "Telehealth Innovations Foundation",
    "group": "Trade Receivables",
    "nature": "asset"
  },
  {
    "name": "HDFC Bank - Manyata Tech Park Branch",
    "group": "Bank Balances",
    "nature": "asset"
  },
  {
    "name": "Imprest - Bharat Shetty Barkur",
    "group": "Short-term Loans & Advances",
    "nature": "asset"
  },
  {
    "name": "Imprest Nutan Mungila",
    "group": "Short-term Loans & Advances",
    "nature": "asset"
  },
  {
    "name": "Income Tax Refund AY 2025-26",
    "group": "Other Current Assets",
    "nature": "asset"
  },
  {
    "name": "Advance Tax",
    "group": "Other Current Assets",
    "nature": "asset"
  },
  {
    "name": "Imprest - Ganaraj",
    "group": "Short-term Loans & Advances",
    "nature": "asset"
  },
  {
    "name": "Incorporation Expenses - Preliminary",
    "group": "Other Non-current Assets",
    "nature": "asset"
  },
  {
    "name": "TCS 1% on Purchase of Car",
    "group": "Other Current Assets",
    "nature": "asset"
  },
  {
    "name": "Service Charges Received - Local",
    "group": "Revenue from Operations",
    "nature": "revenue"
  },
  {
    "name": "Service Charges Received - Out of Country",
    "group": "Revenue from Operations",
    "nature": "revenue"
  },
  {
    "name": "Interest on Income Tax Refund",
    "group": "Other Income",
    "nature": "revenue"
  },
  {
    "name": "Food Expenses",
    "group": "Other Expenses",
    "nature": "expense"
  },
  {
    "name": "Office Maintanance",
    "group": "Other Expenses",
    "nature": "expense"
  },
  {
    "name": "Petrol Charges for Director Car",
    "group": "Other Expenses",
    "nature": "expense"
  },
  {
    "name": "Sal - Bharat Shetty",
    "group": "Other Expenses",
    "nature": "expense"
  },
  {
    "name": "Sal - Parimala R Bhat",
    "group": "Other Expenses",
    "nature": "expense"
  },
  {
    "name": "Bonus to Directors",
    "group": "Other Expenses",
    "nature": "expense"
  },
  {
    "name": "Incentives to Employees",
    "group": "Other Expenses",
    "nature": "expense"
  },
  {
    "name": "Sal - Bhaskar Shetty T",
    "group": "Other Expenses",
    "nature": "expense"
  },
  {
    "name": "Sal - Ksuha",
    "group": "Other Expenses",
    "nature": "expense"
  },
  {
    "name": "Sal - Myadaram Sai Kiran",
    "group": "Other Expenses",
    "nature": "expense"
  },
  {
    "name": "Sal - Nutan Mungila",
    "group": "Other Expenses",
    "nature": "expense"
  },
  {
    "name": "Bank Charges & Commission - HDFC Bank",
    "group": "Finance Costs",
    "nature": "expense"
  },
  {
    "name": "AI Software Charges",
    "group": "Finance Costs",
    "nature": "expense"
  },
  {
    "name": "Audit Fees",
    "group": "Finance Costs",
    "nature": "expense"
  },
  {
    "name": "Car Accessories",
    "group": "Finance Costs",
    "nature": "expense"
  },
  {
    "name": "Car Registration",
    "group": "Finance Costs",
    "nature": "expense"
  },
  {
    "name": "Consultancy Charges",
    "group": "Finance Costs",
    "nature": "expense"
  },
  {
    "name": "Insurance of Vehicle (Car)",
    "group": "Finance Costs",
    "nature": "expense"
  },
  {
    "name": "Interest on TDS",
    "group": "Finance Costs",
    "nature": "expense"
  },
  {
    "name": "Local Conveyance",
    "group": "Finance Costs",
    "nature": "expense"
  },
  {
    "name": "Preliminary Expenses",
    "group": "Finance Costs",
    "nature": "expense"
  },
  {
    "name": "Professional Charges",
    "group": "Finance Costs",
    "nature": "expense"
  },
  {
    "name": "ROC Filing Charges",
    "group": "Finance Costs",
    "nature": "expense"
  },
  {
    "name": "Rounded Off",
    "group": "Other Income",
    "nature": "revenue"
  },
  {
    "name": "Travelling Directors",
    "group": "Finance Costs",
    "nature": "expense"
  },
  {
    "name": "Profit & Loss A/c",
    "group": "Reserves & Surplus",
    "nature": "capital"
  }
];

    // One load/save for the whole list (same per-account rules as the single form).
    registerCustomAccounts(companyId, accountsToRegister);

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

    const openingLines: JournalLine[] = [
  {
    "account_name": "Share Capital - Parimala Ramakrishna Bhat",
    "account_group": "Share Capital",
    "nature": "capital",
    "debit": 0,
    "credit": 50000
  },
  {
    "account_name": "Share Capital - U K Shetty",
    "account_group": "Share Capital",
    "nature": "capital",
    "debit": 0,
    "credit": 50000
  },
  {
    "account_name": "CGST Input 14%",
    "account_group": "Other Current Assets",
    "nature": "asset",
    "debit": 10500.1,
    "credit": 0
  },
  {
    "account_name": "CGST Input 9%",
    "account_group": "Other Current Assets",
    "nature": "asset",
    "debit": 29738.14,
    "credit": 0
  },
  {
    "account_name": "SGST Input 14%",
    "account_group": "Other Current Assets",
    "nature": "asset",
    "debit": 10500.1,
    "credit": 0
  },
  {
    "account_name": "SGST Input 9%",
    "account_group": "Other Current Assets",
    "nature": "asset",
    "debit": 29738.14,
    "credit": 0
  },
  {
    "account_name": "TDS Consultancy",
    "account_group": "Statutory Liabilities",
    "nature": "liability",
    "debit": 0,
    "credit": 292300
  },
  {
    "account_name": "Avinash Sagar and Associates",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 15000
  },
  {
    "account_name": "Consultant Fees - Bharat Shetty Barkur",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 270000
  },
  {
    "account_name": "Consultant Fees - Bhaskar Shetty",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 360000
  },
  {
    "account_name": "Consultant Fees - Nutan Mungila",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 270000
  },
  {
    "account_name": "Imagine - Nexus Koramangala Bengaluru",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 0.01
  },
  {
    "account_name": "Deffered Tax Liability",
    "account_group": "Deferred Tax Liability",
    "nature": "liability",
    "debit": 0,
    "credit": 1759
  },
  {
    "account_name": "Accumulated Depreciation - Computer and Accessories",
    "account_group": "Accumulated Depreciation",
    "nature": "asset",
    "debit": 0,
    "credit": 64610
  },
  {
    "account_name": "MacBook Pro Apple M4 Max - Space Black",
    "account_group": "Tangible Fixed Assets",
    "nature": "asset",
    "debit": 330423.73,
    "credit": 0
  },
  {
    "account_name": "Accumulated Depreciation - Plant and Machinery",
    "account_group": "Accumulated Depreciation",
    "nature": "asset",
    "debit": 0,
    "credit": 112
  },
  {
    "account_name": "Air Conditioner",
    "account_group": "Tangible Fixed Assets",
    "nature": "asset",
    "debit": 75001.8,
    "credit": 0
  },
  {
    "account_name": "Intelehealth, Inc",
    "account_group": "Trade Receivables",
    "nature": "asset",
    "debit": 0.02,
    "credit": 0
  },
  {
    "account_name": "HDFC Bank - Manyata Tech Park Branch",
    "account_group": "Bank Balances",
    "nature": "asset",
    "debit": 830001.84,
    "credit": 0
  },
  {
    "account_name": "Income Tax Refund AY 2025-26",
    "account_group": "Other Current Assets",
    "nature": "asset",
    "debit": 81156,
    "credit": 0
  },
  {
    "account_name": "Incorporation Expenses - Preliminary",
    "account_group": "Other Non-current Assets",
    "nature": "asset",
    "debit": 52850,
    "credit": 0
  },
  {
    "account_name": "Profit & Loss A/c",
    "account_group": "Reserves & Surplus",
    "nature": "capital",
    "debit": 0,
    "credit": 76128.86
  }
];

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

    const txLines: JournalLine[] = [
  {
    "account_name": "CGST Input 9%",
    "account_group": "Other Current Assets",
    "nature": "asset",
    "debit": 19669.23,
    "credit": 0
  },
  {
    "account_name": "CGST Input 9%",
    "account_group": "Other Current Assets",
    "nature": "asset",
    "debit": 0,
    "credit": 1350
  },
  {
    "account_name": "CGST Output 9%",
    "account_group": "Statutory Liabilities",
    "nature": "liability",
    "debit": 1350,
    "credit": 0
  },
  {
    "account_name": "CGST Output 9%",
    "account_group": "Statutory Liabilities",
    "nature": "liability",
    "debit": 0,
    "credit": 1350
  },
  {
    "account_name": "Professional Tax",
    "account_group": "Statutory Liabilities",
    "nature": "liability",
    "debit": 6600,
    "credit": 0
  },
  {
    "account_name": "Professional Tax",
    "account_group": "Statutory Liabilities",
    "nature": "liability",
    "debit": 0,
    "credit": 7400
  },
  {
    "account_name": "SGST Input 9%",
    "account_group": "Other Current Assets",
    "nature": "asset",
    "debit": 19669.23,
    "credit": 0
  },
  {
    "account_name": "SGST Input 9%",
    "account_group": "Other Current Assets",
    "nature": "asset",
    "debit": 0,
    "credit": 1350
  },
  {
    "account_name": "SGST Output 9%",
    "account_group": "Statutory Liabilities",
    "nature": "liability",
    "debit": 1350,
    "credit": 0
  },
  {
    "account_name": "SGST Output 9%",
    "account_group": "Statutory Liabilities",
    "nature": "liability",
    "debit": 0,
    "credit": 1350
  },
  {
    "account_name": "TDS Consultancy",
    "account_group": "Statutory Liabilities",
    "nature": "liability",
    "debit": 556050,
    "credit": 0
  },
  {
    "account_name": "TDS Consultancy",
    "account_group": "Statutory Liabilities",
    "nature": "liability",
    "debit": 0,
    "credit": 327750
  },
  {
    "account_name": "Tds Salary",
    "account_group": "Statutory Liabilities",
    "nature": "liability",
    "debit": 656456,
    "credit": 0
  },
  {
    "account_name": "Tds Salary",
    "account_group": "Statutory Liabilities",
    "nature": "liability",
    "debit": 0,
    "credit": 1690420
  },
  {
    "account_name": "Ample TechnologiesPvtLtd",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 89910,
    "credit": 0
  },
  {
    "account_name": "Ample TechnologiesPvtLtd",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 89910
  },
  {
    "account_name": "Anantcars  Auto Pvt Ltd",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 3024802,
    "credit": 0
  },
  {
    "account_name": "Anantcars  Auto Pvt Ltd",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 3024802
  },
  {
    "account_name": "Apple India Pvt Ltd Hebbal",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 98200,
    "credit": 0
  },
  {
    "account_name": "Apple India Pvt Ltd Hebbal",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 98200
  },
  {
    "account_name": "Avinash Sagar and Associates",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 69870,
    "credit": 0
  },
  {
    "account_name": "Avinash Sagar and Associates",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 69870
  },
  {
    "account_name": "Consultancy Charges - Hemanth Shetty",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 50000
  },
  {
    "account_name": "Consultancy Charges - Raghuveer B R",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 50000
  },
  {
    "account_name": "Consultancy Fees - Insha Manowar",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 337240,
    "credit": 0
  },
  {
    "account_name": "Consultancy Fees - Insha Manowar",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 337240
  },
  {
    "account_name": "Consultancy Fees - Myadaram Sai Kiran",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 35000,
    "credit": 0
  },
  {
    "account_name": "Consultancy Fees - Myadaram Sai Kiran",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 35000
  },
  {
    "account_name": "Consultancy Fees - Others",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 50000
  },
  {
    "account_name": "Consultancy Fees - Parth Narayan Relekar",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 25000,
    "credit": 0
  },
  {
    "account_name": "Consultancy Fees - Parth Narayan Relekar",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 25000
  },
  {
    "account_name": "Consultancy Fees - Taniya Souza",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 20000,
    "credit": 0
  },
  {
    "account_name": "Consultancy Fees - Taniya Souza",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 20000
  },
  {
    "account_name": "Consultant Fees - Bharat Shetty Barkur",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 1395000,
    "credit": 0
  },
  {
    "account_name": "Consultant Fees - Bharat Shetty Barkur",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 1125000
  },
  {
    "account_name": "Consultant Fees - Bhaskar Shetty",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 360000,
    "credit": 0
  },
  {
    "account_name": "Consultant Fees - Nutan Mungila",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 270000,
    "credit": 0
  },
  {
    "account_name": "Consultant Fees - Ratna B Shetty",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 954000,
    "credit": 0
  },
  {
    "account_name": "Consultant Fees - Ratna B Shetty",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 1429200
  },
  {
    "account_name": "GET ERP Business Tech Pvt Ltd",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 26550,
    "credit": 0
  },
  {
    "account_name": "GET ERP Business Tech Pvt Ltd",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 26550
  },
  {
    "account_name": "Infiniti Retail Limited Trading As CROMA",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 58098,
    "credit": 0
  },
  {
    "account_name": "Infiniti Retail Limited Trading As CROMA",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 58098
  },
  {
    "account_name": "Sathya Technologies",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 27500,
    "credit": 0
  },
  {
    "account_name": "Sathya Technologies",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 27500
  },
  {
    "account_name": "S & S Co - Company Secretaries",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 30300,
    "credit": 0
  },
  {
    "account_name": "S & S Co - Company Secretaries",
    "account_group": "Trade Payables",
    "nature": "liability",
    "debit": 0,
    "credit": 30300
  },
  {
    "account_name": "Salpayable - Bharat Shetty",
    "account_group": "Other Current Liabilities",
    "nature": "liability",
    "debit": 2843377,
    "credit": 0
  },
  {
    "account_name": "Salpayable - Bharat Shetty",
    "account_group": "Other Current Liabilities",
    "nature": "liability",
    "debit": 0,
    "credit": 3252470
  },
  {
    "account_name": "Salpayable - Parimala R Bhat",
    "account_group": "Other Current Liabilities",
    "nature": "liability",
    "debit": 0,
    "credit": 2107500
  },
  {
    "account_name": "Salary Payable - Bhaskar Shetty T",
    "account_group": "Other Current Liabilities",
    "nature": "liability",
    "debit": 472294,
    "credit": 0
  },
  {
    "account_name": "Salary Payable - Bhaskar Shetty T",
    "account_group": "Other Current Liabilities",
    "nature": "liability",
    "debit": 0,
    "credit": 572294
  },
  {
    "account_name": "Salary Payable - Myadaram Sai Kiran",
    "account_group": "Other Current Liabilities",
    "nature": "liability",
    "debit": 431900,
    "credit": 0
  },
  {
    "account_name": "Salary Payable - Myadaram Sai Kiran",
    "account_group": "Other Current Liabilities",
    "nature": "liability",
    "debit": 0,
    "credit": 431900
  },
  {
    "account_name": "Salpayable - Kusha",
    "account_group": "Other Current Liabilities",
    "nature": "liability",
    "debit": 207000,
    "credit": 0
  },
  {
    "account_name": "Salpayable - Kusha",
    "account_group": "Other Current Liabilities",
    "nature": "liability",
    "debit": 0,
    "credit": 207000
  },
  {
    "account_name": "Salpayable - Nutan Mungila",
    "account_group": "Other Current Liabilities",
    "nature": "liability",
    "debit": 872294,
    "credit": 0
  },
  {
    "account_name": "Salpayable - Nutan Mungila",
    "account_group": "Other Current Liabilities",
    "nature": "liability",
    "debit": 0,
    "credit": 2247100
  },
  {
    "account_name": "11' IPad Air Wi-Fi 256GB - Purple",
    "account_group": "Tangible Fixed Assets",
    "nature": "asset",
    "debit": 98200,
    "credit": 0
  },
  {
    "account_name": "13 inch MacBook Air Apple M4 - Laptop",
    "account_group": "Tangible Fixed Assets",
    "nature": "asset",
    "debit": 76194.93,
    "credit": 0
  },
  {
    "account_name": "Mahindra BE6 Three B79 HIP R19 NCH WS - Car",
    "account_group": "Tangible Fixed Assets",
    "nature": "asset",
    "debit": 2891453.14,
    "credit": 0
  },
  {
    "account_name": "Google Pixel Mobile",
    "account_group": "Tangible Fixed Assets",
    "nature": "asset",
    "debit": 11101,
    "credit": 0
  },
  {
    "account_name": "Luminous EVO S 1250/12V UPS System",
    "account_group": "Tangible Fixed Assets",
    "nature": "asset",
    "debit": 23304,
    "credit": 0
  },
  {
    "account_name": "Printer",
    "account_group": "Tangible Fixed Assets",
    "nature": "asset",
    "debit": 38134.58,
    "credit": 0
  },
  {
    "account_name": "Tally Singer User License - 784047582",
    "account_group": "Intangible Assets",
    "nature": "asset",
    "debit": 22500,
    "credit": 0
  },
  {
    "account_name": "Big Picture Software Ltd",
    "account_group": "Trade Receivables",
    "nature": "asset",
    "debit": 4933333,
    "credit": 0
  },
  {
    "account_name": "Big Picture Software Ltd",
    "account_group": "Trade Receivables",
    "nature": "asset",
    "debit": 0,
    "credit": 3931917
  },
  {
    "account_name": "Intelehealth, Inc",
    "account_group": "Trade Receivables",
    "nature": "asset",
    "debit": 11060363,
    "credit": 0
  },
  {
    "account_name": "Intelehealth, Inc",
    "account_group": "Trade Receivables",
    "nature": "asset",
    "debit": 0,
    "credit": 10060363
  },
  {
    "account_name": "Satvik Foods Pvt Ltd",
    "account_group": "Trade Receivables",
    "nature": "asset",
    "debit": 17700,
    "credit": 0
  },
  {
    "account_name": "Satvik Foods Pvt Ltd",
    "account_group": "Trade Receivables",
    "nature": "asset",
    "debit": 0,
    "credit": 17700
  },
  {
    "account_name": "Telehealth Innovations Foundation",
    "account_group": "Trade Receivables",
    "nature": "asset",
    "debit": 248416,
    "credit": 0
  },
  {
    "account_name": "Telehealth Innovations Foundation",
    "account_group": "Trade Receivables",
    "nature": "asset",
    "debit": 0,
    "credit": 248416
  },
  {
    "account_name": "HDFC Bank - Manyata Tech Park Branch",
    "account_group": "Bank Balances",
    "nature": "asset",
    "debit": 14344084.1,
    "credit": 0
  },
  {
    "account_name": "HDFC Bank - Manyata Tech Park Branch",
    "account_group": "Bank Balances",
    "nature": "asset",
    "debit": 0,
    "credit": 13327285.91
  },
  {
    "account_name": "Imprest - Bharat Shetty Barkur",
    "account_group": "Short-term Loans & Advances",
    "nature": "asset",
    "debit": 291825,
    "credit": 0
  },
  {
    "account_name": "Imprest - Bharat Shetty Barkur",
    "account_group": "Short-term Loans & Advances",
    "nature": "asset",
    "debit": 0,
    "credit": 473690
  },
  {
    "account_name": "Imprest Nutan Mungila",
    "account_group": "Short-term Loans & Advances",
    "nature": "asset",
    "debit": 225508,
    "credit": 0
  },
  {
    "account_name": "Imprest Nutan Mungila",
    "account_group": "Short-term Loans & Advances",
    "nature": "asset",
    "debit": 0,
    "credit": 201724
  },
  {
    "account_name": "Income Tax Refund AY 2025-26",
    "account_group": "Other Current Assets",
    "nature": "asset",
    "debit": 0,
    "credit": 81156
  },
  {
    "account_name": "Advance Tax",
    "account_group": "Other Current Assets",
    "nature": "asset",
    "debit": 150000,
    "credit": 0
  },
  {
    "account_name": "Imprest - Ganaraj",
    "account_group": "Short-term Loans & Advances",
    "nature": "asset",
    "debit": 0,
    "credit": 156661
  },
  {
    "account_name": "Incorporation Expenses - Preliminary",
    "account_group": "Other Non-current Assets",
    "nature": "asset",
    "debit": 0,
    "credit": 13213
  },
  {
    "account_name": "TCS 1% on Purchase of Car",
    "account_group": "Other Current Assets",
    "nature": "asset",
    "debit": 25900.01,
    "credit": 0
  },
  {
    "account_name": "Service Charges Received - Local",
    "account_group": "Revenue from Operations",
    "nature": "revenue",
    "debit": 0,
    "credit": 15000
  },
  {
    "account_name": "Service Charges Received - Out of Country",
    "account_group": "Revenue from Operations",
    "nature": "revenue",
    "debit": 0,
    "credit": 15993696
  },
  {
    "account_name": "Interest on Income Tax Refund",
    "account_group": "Other Income",
    "nature": "revenue",
    "debit": 0,
    "credit": 4464
  },
  {
    "account_name": "Food Expenses",
    "account_group": "Other Expenses",
    "nature": "expense",
    "debit": 4216,
    "credit": 0
  },
  {
    "account_name": "Office Maintanance",
    "account_group": "Other Expenses",
    "nature": "expense",
    "debit": 89132.66,
    "credit": 0
  },
  {
    "account_name": "Petrol Charges for Director Car",
    "account_group": "Other Expenses",
    "nature": "expense",
    "debit": 127754,
    "credit": 0
  },
  {
    "account_name": "Sal - Bharat Shetty",
    "account_group": "Other Expenses",
    "nature": "expense",
    "debit": 3561290,
    "credit": 0
  },
  {
    "account_name": "Sal - Parimala R Bhat",
    "account_group": "Other Expenses",
    "nature": "expense",
    "debit": 2400000,
    "credit": 0
  },
  {
    "account_name": "Bonus to Directors",
    "account_group": "Other Expenses",
    "nature": "expense",
    "debit": 500000,
    "credit": 0
  },
  {
    "account_name": "Incentives to Employees",
    "account_group": "Other Expenses",
    "nature": "expense",
    "debit": 2125806,
    "credit": 0
  },
  {
    "account_name": "Sal - Bhaskar Shetty T",
    "account_group": "Other Expenses",
    "nature": "expense",
    "debit": 514194,
    "credit": 0
  },
  {
    "account_name": "Sal - Ksuha",
    "account_group": "Other Expenses",
    "nature": "expense",
    "debit": 207000,
    "credit": 0
  },
  {
    "account_name": "Sal - Myadaram Sai Kiran",
    "account_group": "Other Expenses",
    "nature": "expense",
    "debit": 333600,
    "credit": 0
  },
  {
    "account_name": "Sal - Nutan Mungila",
    "account_group": "Other Expenses",
    "nature": "expense",
    "debit": 874194,
    "credit": 0
  },
  {
    "account_name": "Bank Charges & Commission - HDFC Bank",
    "account_group": "Finance Costs",
    "nature": "expense",
    "debit": 530.49,
    "credit": 0
  },
  {
    "account_name": "Bank Charges & Commission - HDFC Bank",
    "account_group": "Finance Costs",
    "nature": "expense",
    "debit": 0,
    "credit": 68.1
  },
  {
    "account_name": "AI Software Charges",
    "account_group": "Finance Costs",
    "nature": "expense",
    "debit": 23348,
    "credit": 0
  },
  {
    "account_name": "Audit Fees",
    "account_group": "Finance Costs",
    "nature": "expense",
    "debit": 15000,
    "credit": 0
  },
  {
    "account_name": "Car Accessories",
    "account_group": "Finance Costs",
    "nature": "expense",
    "debit": 80198,
    "credit": 0
  },
  {
    "account_name": "Car Registration",
    "account_group": "Finance Costs",
    "nature": "expense",
    "debit": 27251,
    "credit": 0
  },
  {
    "account_name": "Consultancy Charges",
    "account_group": "Finance Costs",
    "nature": "expense",
    "debit": 3435000,
    "credit": 0
  },
  {
    "account_name": "Insurance of Vehicle (Car)",
    "account_group": "Finance Costs",
    "nature": "expense",
    "debit": 89535,
    "credit": 0
  },
  {
    "account_name": "Interest on TDS",
    "account_group": "Finance Costs",
    "nature": "expense",
    "debit": 700,
    "credit": 0
  },
  {
    "account_name": "Local Conveyance",
    "account_group": "Finance Costs",
    "nature": "expense",
    "debit": 70000,
    "credit": 0
  },
  {
    "account_name": "Preliminary Expenses",
    "account_group": "Finance Costs",
    "nature": "expense",
    "debit": 13213,
    "credit": 0
  },
  {
    "account_name": "Professional Charges",
    "account_group": "Finance Costs",
    "nature": "expense",
    "debit": 54000,
    "credit": 0
  },
  {
    "account_name": "ROC Filing Charges",
    "account_group": "Finance Costs",
    "nature": "expense",
    "debit": 7800,
    "credit": 0
  },
  {
    "account_name": "Rounded Off",
    "account_group": "Other Income",
    "nature": "revenue",
    "debit": 0,
    "credit": 0.36
  },
  {
    "account_name": "Travelling Directors",
    "account_group": "Finance Costs",
    "nature": "expense",
    "debit": 248416,
    "credit": 0
  },
  {
    "account_name": "Travelling Directors",
    "account_group": "Finance Costs",
    "nature": "expense",
    "debit": 0,
    "credit": 248416
  }
];

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
