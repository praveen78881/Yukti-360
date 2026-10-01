'use client';

/* "Age by: Bill date | Due date" — shared by Debtors, Creditors and the two
   Bills pages. Bill date (today's behaviour) is the default; the choice is
   remembered per browser. */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { dueDatesByVoucher, type AgeingBasis } from '@/lib/accounting/ageingCompute';
import { listInvoicesV2, listPurchaseInvoices, listSalesInvoices } from '@/lib/accounting/gstInvoices';
import { INVOICE_DATA_CHANGED_EVENT, JOURNAL_DATA_CHANGED_EVENT } from '@/lib/journalSync';

const STORAGE_KEY = 'yukti_ageing_basis';

export const AGEING_BASIS_OPTIONS: ReadonlyArray<{ key: AgeingBasis; label: string }> = [
  { key: 'bill', label: 'Bill date' },
  { key: 'due', label: 'Due date' },
];

export const AGEING_BASIS_CAPTION: Record<AgeingBasis, string> = {
  bill: 'Aged from the bill date.',
  due: 'Aged from the due date; bills without one use the bill date.',
};

function readBasis(): AgeingBasis {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'due' ? 'due' : 'bill';
  } catch {
    return 'bill';
  }
}

/** The remembered "Age by" choice and its setter. */
export function useAgeingBasis(): [AgeingBasis, (basis: AgeingBasis) => void] {
  const [basis, setBasis] = useState<AgeingBasis>(readBasis);
  const choose = useCallback((next: AgeingBasis) => {
    setBasis(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked — the choice still holds for this visit */
    }
  }, []);
  return [basis, choose];
}

/** Due dates of the company's invoices keyed by invoice number (= the voucher
    number of the journal entry each one posted): sales invoices for
    receivables, purchase invoices for payables. Re-read when invoices or the
    journal change — saving an invoice posts its journal entry. */
export function useInvoiceDueDates(companyId: string | null | undefined, side: 'receivable' | 'payable'): ReadonlyMap<string, string> {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((x) => x + 1);
    window.addEventListener(INVOICE_DATA_CHANGED_EVENT, bump);
    window.addEventListener(JOURNAL_DATA_CHANGED_EVENT, bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener(INVOICE_DATA_CHANGED_EVENT, bump);
      window.removeEventListener(JOURNAL_DATA_CHANGED_EVENT, bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  return useMemo(() => {
    if (!companyId) return new Map<string, string>();
    return side === 'receivable'
      ? dueDatesByVoucher([...listInvoicesV2(companyId), ...listSalesInvoices(companyId)])
      : dueDatesByVoucher(listPurchaseInvoices(companyId));
  }, [companyId, side, tick]);
}
