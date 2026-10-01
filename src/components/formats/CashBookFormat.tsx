'use client';

import type { ReactNode } from 'react';
import { formatIndianCurrency, formatIndianNumber } from '@/lib/utils/currencyFormat';
import type { CashBookDetailLine, CashBookRow } from '@/lib/accounting/cashBookCompute';

interface CashBookFormatProps {
  type: 'single' | 'double' | 'triple';
  companyName: string;
  period: string;
  fromDate: string;
  toDate: string;
  receipts: CashBookRow[];
  payments: CashBookRow[];
  openingCash: number;
  openingBank: number;
  closingCash: number;
  closingBank: number;
  totalDiscountAllowed?: number;
  totalDiscountReceived?: number;
}

// One logical cell (a Date/Particulars/LF/Disc/Cash/Bank group) on one side of the
// unified cash-book table. Both sides share the same <tr>, which is what guarantees
// the monthly Total row lands on the same horizontal line no matter how many entries
// each side has.
type CellModel = {
  empty?: boolean;
  balance?: boolean;
  total?: boolean;
  bold?: boolean;
  date?: string;
  entryCode?: string;
  particulars?: string;
  lf?: string;
  disc?: number;
  cash?: number;
  bank?: number;
  tint?: string;
  /** Multi-account entry: one line per account (see detailRows). */
  details?: CashBookDetailLine[];
  detailsReconcile?: boolean;
};

/** Physical lines a model occupies: 1, or one per account + the posted line. */
const lineCount = (m: CellModel) => (m.details && m.details.length > 1 ? m.details.length + 1 : 1);

export function CashBookFormat({
  type,
  companyName,
  period,
  fromDate,
  toDate,
  receipts,
  payments,
  openingCash,
  openingBank,
  closingCash: _closingCash,
  closingBank: _closingBank,
  totalDiscountAllowed: _totalDiscountAllowed,
  totalDiscountReceived: _totalDiscountReceived,
}: CashBookFormatProps) {
  // colType retains the full union type so the column-width ternaries can compare
  // against 'single' even inside JSX blocks that only render for 'double' | 'triple'
  // (where TypeScript would otherwise narrow `type` and reject the comparison).
  const colType: 'single' | 'double' | 'triple' = type;
  const typeLabel = colType === 'single' ? 'Single Column' : type === 'double' ? 'Double Column' : 'Triple Column';

  // ---- Column geometry (shared by header + body so both sides line up exactly) ----
  // Amount columns must support at least 9 digits + 2 paise cleanly.
  const dateWidth = type === 'triple' ? 'w-[72px]' : 'w-[78px]';
  const lfWidth = type === 'triple' ? 'w-[34px]' : 'w-[36px]';
  // Triple column: discount is relatively smaller; free space goes to Cash/Bank.
  const discountWidth = type === 'triple' ? 'w-[64px]' : '';
  const particularsWidth = 'min-w-[220px]';
  const amountWidth = type === 'double' ? 'w-[106px]' : type === 'triple' ? 'w-[96px]' : 'w-[132px]';

  const cellPad = type === 'triple' ? 'px-1 py-1' : 'px-2 py-1.5';
  const smallText = type === 'triple' ? 'text-[10px]' : 'text-xs';
  const amountText = type === 'triple' ? 'text-[10px]' : colType === 'single' ? '' : 'text-[11px]';
  const amountThPad =
    colType === 'single' ? 'px-2 py-1.5 text-xs' : type === 'triple' ? 'px-1 py-1 text-[10px]' : 'px-1 py-1 text-[11px]';
  const thPad = colType === 'single' ? 'px-2 py-1.5 text-xs' : 'px-1 py-1 text-[10px]';

  // Number of physical columns rendered per side (used for the Dr/Cr title colSpan).
  const perSideCols = type === 'triple' ? 6 : type === 'double' ? 5 : 4;

  const tableClass = `w-full table-fixed ${
    colType === 'single' ? 'text-[13px]' : 'text-[11px]'
  } [&_th]:border-r [&_th]:border-gray-200 [&_th:last-child]:border-r-0 [&_td]:border-r [&_td]:border-gray-200 [&_td:last-child]:border-r-0`;

  const titleThClass =
    'bg-gray-50 px-3 py-2 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider text-center';

  const toMonthKey = (isoDate: string) => isoDate.slice(0, 7); // YYYY-MM

  const listMonthsInRange = (startIso: string, endIso: string): string[] => {
    const start = new Date(`${startIso}T00:00:00`);
    const end = new Date(`${endIso}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      // fallback to observed months in data
      const set = new Set<string>();
      receipts.forEach((r) => set.add(toMonthKey(r.date)));
      payments.forEach((p) => set.add(toMonthKey(p.date)));
      return [...set].sort();
    }
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    const out: string[] = [];
    while (cur <= endMonth) {
      const ym = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
      out.push(ym);
      cur.setMonth(cur.getMonth() + 1);
    }
    return out;
  };

  const months = listMonthsInRange(fromDate, toDate);

  // ---- Cell renderers ------------------------------------------------------------
  // `isPayment` decides whether this group sits on the credit (right) side, which
  // gets a heavier divider so the T-account split reads clearly.
  // `span` > 1 only when the OTHER side of this row is a multi-account entry: this
  // side's single line then spans all of that block's sub-rows and sits at the top.
  const sideCells = (m: CellModel, isPayment: boolean, span = 1) => {
    const divider = isPayment ? 'border-l-2 border-gray-300' : '';
    const tint = m.tint || '';
    const rs = span > 1 ? span : undefined;
    const top = span > 1 ? 'align-top' : '';

    if (m.empty) {
      return (
        <>
          <td rowSpan={rs} className={`${dateWidth} ${cellPad} ${tint} ${divider}`}>&nbsp;</td>
          <td rowSpan={rs} className={`${particularsWidth} ${cellPad} ${tint}`}>&nbsp;</td>
          <td rowSpan={rs} className={`${lfWidth} ${cellPad} ${tint}`}>&nbsp;</td>
          {type === 'triple' && <td rowSpan={rs} className={`${discountWidth} ${cellPad} ${tint}`}>&nbsp;</td>}
          <td rowSpan={rs} className={`${amountWidth} ${cellPad} ${tint}`}>&nbsp;</td>
          {(type === 'double' || type === 'triple') && <td rowSpan={rs} className={`${amountWidth} ${cellPad} ${tint}`}>&nbsp;</td>}
        </>
      );
    }

    // Balances and totals show a signed magnitude (abs); entry lines show the raw
    // positive amount only when non-zero so the opposite column stays blank.
    const fmtAmount = (value: number | undefined) => {
      const v = value || 0;
      if (m.balance || m.total) return v !== 0 ? formatIndianCurrency(Math.abs(v)) : '';
      return v > 0 ? formatIndianCurrency(v) : '';
    };
    const cashStr = fmtAmount(m.cash);
    const bankStr = fmtAmount(m.bank);
    const discStr = m.total
      ? m.disc != null
        ? formatIndianCurrency(m.disc)
        : ''
      : m.disc
      ? formatIndianCurrency(m.disc)
      : '';

    return (
      <>
        {dateCell(m, divider, rs)}
        <td
          rowSpan={rs}
          className={`${particularsWidth} ${cellPad} align-top break-words ${m.bold ? 'font-medium' : ''} ${tint}`}
          title={m.particulars}
        >
          {m.particulars ?? ''}
        </td>
        <td rowSpan={rs} className={`${lfWidth} ${cellPad} ${smallText} text-center text-gray-400 ${top} ${tint}`}>{m.lf || ''}</td>
        {type === 'triple' && (
          <td
            rowSpan={rs}
            className={`${discountWidth} ${cellPad} ${smallText} text-right font-mono tabular-nums whitespace-nowrap ${top} ${tint}`}
          >
            {discStr}
          </td>
        )}
        <td
          rowSpan={rs}
          className={`${amountWidth} ${cellPad} ${amountText} text-right font-mono tabular-nums whitespace-nowrap ${top} ${tint}`}
        >
          {cashStr}
        </td>
        {(type === 'double' || type === 'triple') && (
          <td
            rowSpan={rs}
            className={`${amountWidth} ${cellPad} ${amountText} text-right font-mono tabular-nums whitespace-nowrap ${top} ${tint}`}
          >
            {bankStr}
          </td>
        )}
      </>
    );
  };

  // Date + JE code: shared by single-line rows and multi-account blocks.
  function dateCell(m: CellModel, divider: string, rowSpan?: number) {
    return (
      <td
        rowSpan={rowSpan}
        className={`${dateWidth} ${cellPad} ${smallText} text-gray-500 whitespace-nowrap align-top ${m.tint || ''} ${divider}`}
      >
        {m.date ? <div>{m.date}</div> : null}
        {m.entryCode ? (
          <div className="mt-1 text-[10px] font-mono font-semibold text-blue-600">{m.entryCode}</div>
        ) : null}
      </td>
    );
  }

  // A multi-account entry: one sub-row per account — the account, its L.F. and
  // its amount on the SAME line — then the posted cash/bank figure on a closing
  // line. Sub-rows are real <tr>s (built by the caller), so line N of every
  // column shares a baseline even when a long account name wraps.
  //   · Lines that ADD UP to the posted figure are a breakdown: amounts signed
  //     against this side (parentheses = the unusual side), closed by a sum line.
  //   · Lines that DON'T (an entry posting to both sides of the book) describe
  //     the whole entry: each shows its own amount with its Dr/Cr side, subdued,
  //     and the closing line is labelled Received / Paid so it never reads as
  //     their sum.
  // Returns the cells for each of the block's L sub-rows (null = covered by a
  // row-span from above).
  const detailRows = (m: CellModel, isPayment: boolean, L: number): ReactNode[] => {
    const lines = m.details ?? [];
    const n = lines.length + 1; // + the posted line
    const divider = isPayment ? 'border-l-2 border-gray-300' : '';
    const reconcile = !!m.detailsReconcile;
    // Detail amounts go in the column the entry actually posted to.
    const col: 'cash' | 'bank' = (m.bank || 0) > 0 && !((m.cash || 0) > 0) ? 'bank' : 'cash';
    const hasBank = type === 'double' || type === 'triple';

    const padX = type === 'triple' ? 'px-1' : 'px-2';
    const pad = (i: number) =>
      `${padX} ${i === 0 ? (type === 'triple' ? 'pt-1' : 'pt-1.5') : 'pt-[2px]'} ${
        i === n - 1 ? (type === 'triple' ? 'pb-1' : 'pb-1.5') : 'pb-[2px]'
      }`;
    const amountCls = `${amountWidth} ${amountText} text-right font-mono tabular-nums whitespace-nowrap align-top`;

    const out: ReactNode[] = Array.from({ length: L }, () => null);

    lines.forEach((d, i) => {
      const amount = reconcile
        ? d.signed < 0 ? `(${formatIndianNumber(d.amount)})` : formatIndianNumber(d.amount)
        : formatIndianNumber(d.amount);
      const tone = reconcile ? 'text-gray-600' : 'text-gray-400';
      out[i] = (
        <>
          {i === 0 && dateCell(m, divider, L)}
          <td className={`${particularsWidth} ${pad(i)} align-top break-words text-gray-700`}>
            {reconcile ? (
              d.account
            ) : (
              <span className="flex items-baseline justify-between gap-2">
                <span className="min-w-0">{d.account}</span>
                <span className="shrink-0 text-[10px] font-semibold text-gray-400">{d.side}</span>
              </span>
            )}
          </td>
          <td className={`${lfWidth} ${pad(i)} ${smallText} text-center text-gray-400 align-top`}>{d.lf}</td>
          {type === 'triple' && <td className={`${discountWidth} ${pad(i)}`} />}
          <td className={`${amountCls} ${pad(i)} ${tone}`}>{col === 'cash' ? amount : ''}</td>
          {hasBank && <td className={`${amountCls} ${pad(i)} ${tone}`}>{col === 'bank' ? amount : ''}</td>}
        </>
      );
    });

    // Closing line: the posted figure — the one that feeds balances and totals.
    const last = n - 1;
    const posted = (v: number | undefined) => ((v || 0) > 0 ? formatIndianCurrency(v || 0) : '');
    const rule = 'border-t border-gray-300';
    out[last] = (
      <>
        <td className={`${particularsWidth} ${pad(last)} align-top`}>
          {!reconcile && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              {isPayment ? 'Paid' : 'Received'}
            </span>
          )}
        </td>
        <td className={`${lfWidth} ${pad(last)}`} />
        {type === 'triple' && (
          <td className={`${discountWidth} ${pad(last)} ${smallText} text-right font-mono tabular-nums whitespace-nowrap align-top`}>
            {m.disc ? formatIndianCurrency(m.disc) : ''}
          </td>
        )}
        <td className={`${amountCls} ${pad(last)} ${(m.cash || 0) > 0 ? rule : ''}`}>{posted(m.cash)}</td>
        {hasBank && <td className={`${amountCls} ${pad(last)} ${(m.bank || 0) > 0 ? rule : ''}`}>{posted(m.bank)}</td>}
      </>
    );

    // The other side has more lines: one blank block fills the rest.
    if (n < L) {
      const rs = L - n;
      out[n] = (
        <>
          <td rowSpan={rs} className={`${particularsWidth}`} />
          <td rowSpan={rs} className={`${lfWidth}`} />
          {type === 'triple' && <td rowSpan={rs} className={`${discountWidth}`} />}
          <td rowSpan={rs} className={`${amountWidth}`} />
          {hasBank && <td rowSpan={rs} className={`${amountWidth}`} />}
        </>
      );
    }
    return out;
  };

  const headerCells = (isPayment: boolean) => {
    const divider = isPayment ? 'border-l-2 border-gray-300' : '';
    return (
      <>
        <th
          className={`text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${dateWidth} ${thPad} ${divider}`}
        >
          Date
        </th>
        <th
          className={`text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${particularsWidth} ${thPad}`}
        >
          Particulars
        </th>
        <th
          className={`text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${lfWidth} ${thPad}`}
        >
          LF
        </th>
        {type === 'triple' && (
          <th
            className={`text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${discountWidth} px-1 py-1 text-[10px]`}
          >
            Disc.
          </th>
        )}
        <th
          className={`text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${amountWidth} ${amountThPad}`}
        >
          Cash
        </th>
        {(type === 'double' || type === 'triple') && (
          <th
            className={`text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${amountWidth} ${amountThPad}`}
          >
            Bank
          </th>
        )}
      </>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="text-center py-3 border-b border-gray-200">
        <p className="text-xs text-gray-500">{companyName}</p>
        <h3 className="text-lg font-bold text-gray-900">Cash Book ({typeLabel})</h3>
        <p className="text-sm text-gray-500">{period}</p>
      </div>

      {/* Monthly divisions are mandatory (Month/Quarter/Year all show monthly splits) */}
      <div className="overflow-x-auto">
        <div className="divide-y divide-[#D4E2F0] min-w-[1000px]">
          {(() => {
            let monthOpeningCash = openingCash;
            let monthOpeningBank = openingBank;

            const isSingleMonthRange = months.length === 1;

            return months.map((ym, monthIndex) => {
              const [yy, mm] = ym.split('-').map((x) => parseInt(x, 10));
              const openingDate = `${ym}-01`;
              const lastDay = yy && mm ? new Date(yy, mm, 0).getDate() : 28;
              const closingDate = `${ym}-${String(lastDay).padStart(2, '0')}`;

              const monthReceipts = receipts.filter((r) => toMonthKey(r.date) === ym);
              const monthPayments = payments.filter((p) => toMonthKey(p.date) === ym);

              const receiptsCash = monthReceipts.reduce((s, r) => s + (r.cashAmount || 0), 0);
              const receiptsBank = monthReceipts.reduce((s, r) => s + (r.bankAmount || 0), 0);
              const paymentsCash = monthPayments.reduce((s, r) => s + (r.cashAmount || 0), 0);
              const paymentsBank = monthPayments.reduce((s, r) => s + (r.bankAmount || 0), 0);

              const monthClosingCash = monthOpeningCash + receiptsCash - paymentsCash;
              const monthClosingBank = monthOpeningBank + receiptsBank - paymentsBank;

              // Skip visually empty months (no receipts/payments and unchanged opening/closing)
              // when viewing a multi-month range. For a single-month filter, still show the
              // month with b/d and c/d.
              const hasActivity =
                receiptsCash !== 0 || receiptsBank !== 0 || paymentsCash !== 0 || paymentsBank !== 0;
              if (
                !isSingleMonthRange &&
                !hasActivity &&
                monthOpeningCash === monthClosingCash &&
                monthOpeningBank === monthClosingBank
              ) {
                // Carry forward balances but do not render this month.
                monthOpeningCash = monthClosingCash;
                monthOpeningBank = monthClosingBank;
                return null;
              }

              const monthDiscountReceived =
                type === 'triple' ? monthReceipts.reduce((s, r) => s + (r.discountAmount || 0), 0) : undefined;
              const monthDiscountAllowed =
                type === 'triple' ? monthPayments.reduce((s, r) => s + (r.discountAmount || 0), 0) : undefined;

              // Receipts side total includes the opening balance; payments side total
              // includes the closing balance. In a balanced book these two match.
              const receiptsCashTotal = monthOpeningCash + receiptsCash;
              const receiptsBankTotal = monthOpeningBank + receiptsBank;
              const paymentsCashTotal = paymentsCash + monthClosingCash;
              const paymentsBankTotal = paymentsBank + monthClosingBank;

              // Build per-side row models. Receipts lead with the opening b/d line.
              const receiptModels: CellModel[] = [
                {
                  balance: true,
                  bold: true,
                  date: openingDate,
                  particulars: 'To Balance b/d',
                  cash: monthOpeningCash,
                  bank: monthOpeningBank,
                  tint: 'bg-blue-50/30',
                },
                ...monthReceipts.map<CellModel>((r) => ({
                  date: r.date,
                  entryCode: r.entry_code,
                  particulars: r.particulars,
                  lf: r.lf,
                  disc: r.discountAmount,
                  cash: r.cashAmount,
                  bank: r.bankAmount,
                  details: r.details,
                  detailsReconcile: r.detailsReconcile,
                })),
              ];
              const paymentModels: CellModel[] = monthPayments.map<CellModel>((p) => ({
                date: p.date,
                entryCode: p.entry_code,
                particulars: p.particulars,
                lf: p.lf,
                disc: p.discountAmount,
                cash: p.cashAmount,
                bank: p.bankAmount,
                details: p.details,
                detailsReconcile: p.detailsReconcile,
              }));

              // Both sides share the same rows; pad the shorter side with blanks so the
              // closing (c/d) and Total rows always sit on the same horizontal line,
              // regardless of how many entries each side has.
              const bodyLen = Math.max(receiptModels.length, paymentModels.length);

              const bodyRows = Array.from({ length: bodyLen }, (_, r) => {
                const rm = receiptModels[r] ?? { empty: true };
                const pm = paymentModels[r] ?? { empty: true };
                // A multi-account entry on either side turns this row into a block of
                // L sub-rows; the other side's single line spans the whole block.
                const L = Math.max(lineCount(rm), lineCount(pm));
                if (L === 1) {
                  return (
                    <tr key={`b-${r}`} className="border-b border-gray-100">
                      {sideCells(rm, false)}
                      {sideCells(pm, true)}
                    </tr>
                  );
                }
                const side = (m: CellModel, isPayment: boolean): ReactNode[] =>
                  lineCount(m) > 1
                    ? detailRows(m, isPayment, L)
                    : [sideCells(m, isPayment, L), ...Array.from({ length: L - 1 }, () => null)];
                const left = side(rm, false);
                const right = side(pm, true);
                return Array.from({ length: L }, (_, i) => (
                  <tr key={`b-${r}-${i}`} className={i === L - 1 ? 'border-b border-gray-100' : ''}>
                    {left[i]}
                    {right[i]}
                  </tr>
                ));
              });

              const block = (
                <div key={ym}>
                  <table className={tableClass}>
                    <thead>
                      {monthIndex === 0 && (
                        <tr>
                          <th colSpan={perSideCols} className={titleThClass}>
                            Receipts (Dr)
                          </th>
                          <th colSpan={perSideCols} className={`${titleThClass} border-l-2 border-gray-300`}>
                            Payments (Cr)
                          </th>
                        </tr>
                      )}
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {headerCells(false)}
                        {headerCells(true)}
                      </tr>
                    </thead>
                    <tbody>
                      {bodyRows}
                      {/* Closing balance: only the payments (Cr) side carries By Balance c/d;
                          the receipts side is blank but tinted to mirror it. */}
                      <tr className="border-b border-gray-100">
                        {sideCells({ empty: true, tint: 'bg-blue-50/30' }, false)}
                        {sideCells(
                          {
                            balance: true,
                            bold: true,
                            date: closingDate,
                            particulars: 'By Balance c/d',
                            cash: monthClosingCash,
                            bank: monthClosingBank,
                            tint: 'bg-blue-50/30',
                          },
                          true
                        )}
                      </tr>
                      {/* Total row — one <tr> spanning both sides, so Dr/Cr totals align. */}
                      <tr className="bg-gray-100 font-semibold border-t border-gray-300">
                        {sideCells(
                          {
                            total: true,
                            particulars: 'Total',
                            disc: monthDiscountReceived,
                            cash: receiptsCashTotal,
                            bank: receiptsBankTotal,
                          },
                          false
                        )}
                        {sideCells(
                          {
                            total: true,
                            particulars: 'Total',
                            disc: monthDiscountAllowed,
                            cash: paymentsCashTotal,
                            bank: paymentsBankTotal,
                          },
                          true
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
              );

              // carry forward
              monthOpeningCash = monthClosingCash;
              monthOpeningBank = monthClosingBank;

              return block;
            });
          })()}
        </div>
      </div>
    </div>
  );
}
