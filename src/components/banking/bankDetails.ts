/* Optional particulars of a bank ledger — bank, branch, account number, IFSC.
 * The ledger itself is an ordinary registered (custom) account under Bank
 * Balances. These sit beside it in the company's entity_data store, keyed by
 * that account's id so a rename (Settings or Ledger) keeps them attached.
 * Nothing here ever reaches a journal line. */

import { getEntityData, upsertEntityData } from '@/lib/offlineDb';

export interface BankAccountDetails {
  /** id of the registered account this bank ledger is (CustomAccount.id). */
  account_id: string;
  bank_name?: string;
  branch?: string;
  account_number?: string;
  ifsc?: string;
}

const MODULE = 'banking';
const SECTION = 'bank_accounts';

/** IFSC: four bank letters, a zero, then six branch letters or digits. */
export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
/** Indian bank account numbers run from 9 to 18 digits. */
export const ACCOUNT_NUMBER_PATTERN = /^\d{9,18}$/;

/** Every saved set of details for the company, by account id. */
export function getBankDetails(companyId: string): Map<string, BankAccountDetails> {
  const data = getEntityData(companyId, MODULE, SECTION)?.data;
  const list = Array.isArray(data) ? (data as BankAccountDetails[]) : [];
  return new Map(list.map((d) => [d.account_id, d]));
}

/** Add or replace one account's details. */
export function saveBankDetails(companyId: string, details: BankAccountDetails): void {
  const all = getBankDetails(companyId);
  all.set(details.account_id, details);
  upsertEntityData(companyId, MODULE, SECTION, [...all.values()]);
}

/** Only the last four digits are ever shown: "•••• 7890". */
export function maskAccountNumber(accountNumber: string): string {
  return `•••• ${accountNumber.slice(-4)}`;
}
