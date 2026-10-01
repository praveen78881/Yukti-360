'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { findExistingAccountName, normalizeAccountName } from '@/lib/chartOfAccounts';
import { getCustomAccounts, registerCustomAccount } from '@/lib/offlineDb';
import { getGroupById } from '@/lib/coa';
import { ACCOUNT_NUMBER_PATTERN, IFSC_PATTERN, saveBankDetails } from './bankDetails';

/* "Add Bank Account" — creates the bank ledger as a registered account under
 * Bank Accounts (Bank Balances · asset), so the journal and bank-import
 * account pickers offer it straight away, and keeps the optional bank
 * particulars beside it. Hand-rolled overlay (the app's convention):
 * globals.css turns the `fixed inset-0 bg-black/…` wrapper into the navy veil
 * and `ca-modal-panel` into the panel with the navy top strip. */

const BANK_GROUP = getGroupById('bank_accounts')!;

const FIELD = 'h-10 w-full px-3 text-[14px] focus:outline-none';
// The base input rule's border outranks its own [aria-invalid] one, so the
// error border is forced — as the company wizard's `inpErr` does.
const FIELD_ERROR = '!border-[var(--bad)] !shadow-[0_0_0_3px_rgba(178,59,51,0.14)] field-error';

type Errors = Partial<Record<'name' | 'accountNumber' | 'ifsc', string>>;

interface AddBankAccountDialogProps {
  companyId: string;
  /** Called with the new ledger's name once it is saved. */
  onCreated: (name: string) => void;
  onClose: () => void;
}

export function AddBankAccountDialog({ companyId, onCreated, onClose }: AddBankAccountDialogProps) {
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [branch, setBranch] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  // Esc closes from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const clearError = (key: keyof Errors) => { if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined })); };

  // Upper-case as typed, keeping the caret where it was — a plain transform
  // makes React rewrite the value and throw the caret to the end.
  const onIfscChange = (e: ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const { selectionStart, selectionEnd } = el;
    el.value = el.value.toUpperCase();
    el.setSelectionRange(selectionStart, selectionEnd);
    setIfsc(el.value);
    clearError('ifsc');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const ledger = normalizeAccountName(name);
    const number = accountNumber.replace(/\s+/g, '');
    const code = ifsc.replace(/\s+/g, '');

    const next: Errors = {};
    if (!ledger) {
      next.name = 'Account name is required';
    } else {
      // One name per company, matched like the account picker's "+ Create":
      // case and spacing never make a second ledger.
      const existing = findExistingAccountName(companyId, ledger);
      if (existing) next.name = `“${existing}” already exists — use a different name`;
    }
    if (number && !ACCOUNT_NUMBER_PATTERN.test(number)) next.accountNumber = 'Use 9 to 18 digits, nothing else';
    if (code && !IFSC_PATTERN.test(code)) next.ifsc = '4 letters, a 0, then 6 letters or digits';
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    try {
      registerCustomAccount(companyId, ledger, BANK_GROUP.scheduleIII, BANK_GROUP.nature);
      const details = { bank_name: bankName.trim(), branch: branch.trim(), account_number: number, ifsc: code };
      const account = getCustomAccounts(companyId).find((a) => normalizeAccountName(a.name).toLowerCase() === ledger.toLowerCase());
      if (account && Object.values(details).some(Boolean)) saveBankDetails(companyId, { account_id: account.id, ...details });
    } catch {
      toast.error('Could not save the bank account — browser storage may be full');
      return;
    }
    toast.success(`Bank account “${ledger}” added`);
    onCreated(ledger);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-bank-title"
        className="ca-modal-panel bg-white w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3.5 border-b border-[var(--cream)] shrink-0">
          <div className="min-w-0">
            <p className="eyebrow">Banking</p>
            <h2 id="add-bank-title" className="mt-1.5 text-[16px] tracking-[0.045em] text-[var(--ink)]">Add Bank Account</h2>
            <p className="mt-1 text-[11.5px] text-[var(--ink-3)]">
              A new ledger under Bank Accounts, ready for receipts, payments and reconciliation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[var(--ink-3)] transition-colors duration-[160ms] hover:bg-[var(--cream-2)] hover:text-[var(--ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <Field id="bank-ledger-name" label="Account name" error={errors.name}
              hint="The ledger name you will pick in journal entries and bank import.">
              <input
                id="bank-ledger-name"
                autoFocus
                value={name}
                onChange={(e) => { setName(e.target.value); clearError('name'); }}
                placeholder="e.g. HDFC Bank – Current A/c"
                aria-invalid={!!errors.name}
                aria-describedby="bank-ledger-name-note"
                className={`${FIELD} ${errors.name ? FIELD_ERROR : ''}`}
              />
            </Field>

            <div className="flex items-center gap-3 pt-1">
              <span className="eyebrow">Bank details</span>
              <span className="h-px flex-1 bg-[var(--cream)]" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="bank-name" label="Bank name" optional>
                <input
                  id="bank-name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank"
                  className={FIELD}
                />
              </Field>
              <Field id="bank-branch" label="Branch" optional>
                <input
                  id="bank-branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Koramangala, Bengaluru"
                  className={FIELD}
                />
              </Field>
              <Field id="bank-account-number" label="Account number" optional error={errors.accountNumber}>
                <input
                  id="bank-account-number"
                  inputMode="numeric"
                  autoComplete="off"
                  value={accountNumber}
                  onChange={(e) => { setAccountNumber(e.target.value); clearError('accountNumber'); }}
                  placeholder="9 to 18 digits"
                  aria-invalid={!!errors.accountNumber}
                  aria-describedby={errors.accountNumber ? 'bank-account-number-note' : undefined}
                  className={`${FIELD} font-mono tracking-[0.04em] ${errors.accountNumber ? FIELD_ERROR : ''}`}
                />
              </Field>
              <Field id="bank-ifsc" label="IFSC" optional error={errors.ifsc}>
                <input
                  id="bank-ifsc"
                  autoComplete="off"
                  maxLength={11}
                  value={ifsc}
                  onChange={onIfscChange}
                  placeholder="e.g. HDFC0001234"
                  aria-invalid={!!errors.ifsc}
                  aria-describedby={errors.ifsc ? 'bank-ifsc-note' : undefined}
                  className={`${FIELD} font-mono tracking-[0.04em] ${errors.ifsc ? FIELD_ERROR : ''}`}
                />
              </Field>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[var(--cream)] bg-[var(--cream-2)] shrink-0">
            <button type="button" onClick={onClose} className="btn-pill-outline">Cancel</button>
            <button type="submit" className="btn-pill-primary">Add Bank Account</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Caps label, the control, then its error (or a hint) — the company wizard's field layout. */
function Field({ id, label, optional, error, hint, children }: {
  id: string; label: string; optional?: boolean; error?: string; hint?: string; children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="label-caps mb-1.5 flex items-center gap-1.5">
        {label}
        {optional && <span className="font-sans text-[10px] font-medium normal-case tracking-normal text-[var(--ink-3)]">optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-note`} className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-[var(--bad)]">
          <AlertCircle className="h-3 w-3 shrink-0" />{error}
        </p>
      ) : hint ? (
        <p id={`${id}-note`} className="mt-1.5 text-[11px] text-[var(--ink-3)]">{hint}</p>
      ) : null}
    </div>
  );
}
