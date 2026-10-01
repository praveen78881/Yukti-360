'use client';

import { useEffect, useRef, useState } from 'react';
import { getCurrentFY } from '@/lib/utils/dateUtils';
import { listJournalEntries } from '@/lib/offlineDb';
import { JOURNAL_DATA_CHANGED_EVENT } from '@/lib/journalSync';

/** The April–March year holding an ISO date, read straight off the string so no
 *  timezone can shift it across a year boundary. */
function fyOf(iso: string) {
  const y = Number(iso.slice(0, 4));
  const start = Number(iso.slice(5, 7)) >= 4 ? y : y - 1;
  return { start: `${start}-04-01`, end: `${start + 1}-03-31` };
}

/**
 * The from/to dates a statement page reports on.
 *
 * Opens on the financial year of the company's latest entry, not on today's FY:
 * books kept for another year (last year's accounts, typically) must not open on
 * a blank statement, nor on a "year ended" date the books never reached.
 * - Period statements (P&L, Cash Flow, I&E, R&P …) cover that one year.
 * - `cumulative` statements (Trial Balance, Balance Sheet) are balances as at the
 *   year end, so they also take in every earlier entry.
 * The range is settled once per company, when its entries are first seen; after
 * that the user's own choice in the date filter stands. `allRange` (first to last
 * entry) feeds the date filter's "All" preset.
 */
export function useReportDateRange(companyId: string | null | undefined, { cumulative = false } = {}) {
  const [fy] = useState(getCurrentFY);
  const [fromDate, setFromDate] = useState(fy.start);
  const [toDate, setToDate] = useState(fy.end);
  const [allRange, setAllRange] = useState<{ from: string; to: string } | null>(null);
  const settledFor = useRef<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    const sync = () => {
      const all = listJournalEntries(companyId);
      if (!all.length) { setAllRange(null); return; }
      let first = all[0].entry_date;
      let last = first;
      for (const e of all) {
        if (e.entry_date < first) first = e.entry_date;
        if (e.entry_date > last) last = e.entry_date;
      }
      setAllRange((r) => (r && r.from === first && r.to === last ? r : { from: first, to: last }));
      if (settledFor.current === companyId) return;
      settledFor.current = companyId;
      const year = fyOf(last);
      setFromDate(cumulative && first < year.start ? first : year.start);
      setToDate(year.end);
    };
    sync();
    const onChanged = (e: Event) => {
      if ((e as CustomEvent<{ companyId?: string }>).detail?.companyId === companyId) sync();
    };
    window.addEventListener(JOURNAL_DATA_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(JOURNAL_DATA_CHANGED_EVENT, onChanged);
  }, [companyId, cumulative]);

  return { fromDate, toDate, setFromDate, setToDate, allRange };
}
