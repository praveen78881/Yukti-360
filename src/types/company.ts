export type EntityType =
  | 'sole_proprietorship'
  | 'individual'
  | 'partnership'
  | 'llp'
  | 'opc'
  | 'pvt_ltd'
  | 'public_ltd'
  | 'huf'
  | 'trust'
  | 'society'
  | 'section8'
  | 'aop_boi'
  | 'cooperative';

export type GSTStatus = 'unregistered' | 'regular' | 'composition';
export type AccountingMethod = 'mercantile' | 'cash';
export type AccountingStandard = 'indian_gaap' | 'ind_as';

export interface PartnerDetail {
  name: string;
  capitalAmount: number;
  profitSharingRatio: number;
  interestOnCapitalRate: number;
  interestOnDrawingsRate: number;
  salary: number;
  commission: number;
  isActive: boolean;
}

export interface ShareCapitalDetail {
  authorizedCapital: number;
  issuedCapital: number;
  subscribedCapital: number;
  paidUpCapital: number;
  faceValuePerShare: number;
  totalShares: number;
}

export interface EntityDetails {
  // Common
  pan?: string;
  tan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  tradeName?: string;

  // Individual
  aadhaar?: string;
  dob?: string;

  // Partnership / LLP
  partners?: PartnerDetail[];
  capitalMethod?: 'fixed' | 'fluctuating';
  goodwillMethod?: 'average_profit' | 'super_profit' | 'capitalisation';
  llpin?: string;
  dateOfIncorporation?: string; // used for LLP formation date or partnership deed date

  // Company (OPC, Pvt Ltd, Public Ltd, Section 8)
  cin?: string;
  din?: string;
  shareCapital?: ShareCapitalDetail;
  depreciationMethod?: 'slm' | 'wdv';

  // HUF
  kartaName?: string;

  // Trust / Society / Section 8
  registrationNumber?: string;
  registrationDate?: string;
  objectClause?: string;

  // Cooperative
  cooperativeRegistrationNo?: string;

  // AOP/BOI
  members?: { name: string; share: number }[];

  /** Non-corporate: ICAI disclosure level (I–IV) by turnover/borrowings; drives related party, AS checklist, etc. */
  disclosureLevel?: 'I' | 'II' | 'III' | 'IV';

  /** The income-tax return this entity files, when its legal form allows more
   *  than one (e.g. an individual: ITR-1 or ITR-2). Chosen at creation, editable
   *  in Settings; the Income Tax page opens straight on it. Unset = first form. */
  itrForm?: 'itr1' | 'itr2' | 'itr3' | 'itr4' | 'itr5' | 'itr6' | 'itr7';
}

export interface GSTDetails {
  gstin?: string;
  registrationDate?: string;
  stateCode?: string;
  gstScheme?: 'regular' | 'composition';
  compositionRate?: number;
  /** GST portal username — captured once for the Sandbox GSP OTP flow (GSTR-2A/2B
   *  download, GSTR-1/3B/9 filing). Not a secret; the OTP goes to the taxpayer. */
  portalUsername?: string;
  /** e-Way Bill portal API credentials — captured once, used to silently
   *  authenticate the EWB session when generating e-Way Bills. */
  ewbUsername?: string;
  ewbPassword?: string;
}

export interface InventoryConfig {
  valuationMethod: 'fifo' | 'weighted_average' | 'specific_identification';
  pettyCashThreshold: number;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  entity_type: EntityType;
  entity_details: EntityDetails;
  business_nature: string[];
  inventory_enabled: boolean;
  inventory_config: InventoryConfig;
  gst_status: GSTStatus;
  gst_details: GSTDetails;
  tds_applicable: boolean;
  tcs_applicable: boolean;
  tax_audit_applicable: boolean;
  financial_year_start: string;
  accounting_standard: AccountingStandard;
  accounting_method: AccountingMethod;
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface BookPeriod {
  id: string;
  company_id: string;
  period_start: string;
  period_end: string;
  period_label: string;
  reason?: string;
  status: 'open' | 'closed' | 'locked';
  created_at: string;
  closed_at?: string;
}
