'use client';

import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { Package, X } from 'lucide-react';
import type { InventorySubLine } from '@/types/journal';
import { summarizeInventorySubLines, computeInventorySubLine } from '@/lib/accounting/inventoryJournal';

interface JournalEntryDisplayLine {
  accountName: string;
  isDebit: boolean;
  amount: number;
  inventorySubLines?: InventorySubLine[];
  tdsSection?: string;
  tdsRate?: number;
  tcsSection?: string;
  tcsRate?: number;
}
interface JournalEntryDisplay {
  entryCode: string;
  date: string;
  lines: JournalEntryDisplayLine[];
  narration: string;
  voucherType: string;
}

interface JournalFormatProps {
  companyName: string;
  period: string;
  entries: JournalEntryDisplay[];
  highlightEntryCode?: string;
  emptyMessage?: string;
  selectedCodes?: Set<string>;
  onSelectionChange?: (codes: Set<string>) => void;
  /** Opt-in selection mode. When provided, the checkbox column only shows while
      it is true — the page turns it on from the right-click menu. Omitted →
      legacy behaviour: checkboxes whenever onSelectionChange is given. */
  selectionMode?: boolean;
  /** Lets the right-click menu enter / leave selection mode. */
  onSelectionModeChange?: (on: boolean) => void;
  onDeleteEntry?: (entryCode: string) => void;
  onEditEntry?: (entryCode: string) => void;
}

const VTYPE_LABEL: Record<string, string> = {
  JRN: 'Journal', SLS: 'Sales', PUR: 'Purchase',
  RCT: 'Receipt', PMT: 'Payment', CNT: 'Contra',
  DN: 'Debit Note', CN: 'Credit Note', PAY: 'Payroll',
};

/** Voucher number for display: stored codes are JE + 5 digits (JE00001); show
 *  them with surplus leading zeros dropped, keeping at least 3 digits
 *  (JE00001 → JE001, JE00123 → JE123, JE01234 → JE1234). Any code that is not
 *  "JE" + digits is shown unchanged. Display only — stored codes never change. */
export function formatVoucherNo(code: string): string {
  const m = /^JE(\d+)$/i.exec(code.trim());
  if (!m) return code;
  return `JE${m[1].replace(/^0+(?=\d{3})/, '')}`;
}

/** Menu row for the right-click menu. */
function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full text-left px-3.5 py-1.5 text-[13px] transition-colors duration-[160ms] ${
        danger ? 'text-[var(--bad)] hover:bg-[var(--bad-soft)]' : 'text-[var(--ink-2)] hover:bg-[var(--cream-2)] hover:text-[var(--ink)]'
      }`}
    >
      {children}
    </button>
  );
}

// ── Inventory detail popup ────────────────────────────────────────────────────
function InventoryPopup({ subLines, onClose }: { subLines: InventorySubLine[]; onClose: () => void }) {
  const summary = summarizeInventorySubLines(subLines);
  return (
    <div className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="ca-modal-panel bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
          <div className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-blue-600" />
            <h3 className="text-xs md:text-sm font-bold text-gray-900">Inventory Items</h3>
            <span className="text-[10px] md:text-xs text-gray-400">{subLines.length} item{subLines.length !== 1 ? 's' : ''}</span>
          </div>
          <button onClick={onClose} className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[10px] md:text-xs">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <tr>
                {['Item / Description', 'HSN / SAC', 'Unit', 'Qty', 'Rate (₹)', 'Disc %', 'CGST %', 'SGST %', 'IGST %', 'Amount (₹)', 'Tax (₹)', 'Total (₹)'].map(h => (
                  <th key={h} className={`px-1.5 py-1 text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap ${h.endsWith('(₹)') || h === 'Qty' || h.endsWith('%') ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subLines.map((sub, i) => {
                const c = computeInventorySubLine(sub);
                const taxTotal = c.cgst_amount + c.sgst_amount + c.igst_amount;
                return (
                  <tr key={i} className={`border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/40' : ''}`}>
                    <td className="px-1.5 py-1 font-medium text-gray-900">{sub.inventory_name || '—'}</td>
                    <td className="px-1.5 py-1 font-mono text-gray-600 uppercase">{sub.hsn_sac || '—'}</td>
                    <td className="px-1.5 py-1 text-gray-600">{sub.unit || '—'}</td>
                    <td className="px-1.5 py-1 text-right font-mono tabular-nums">{sub.qty}</td>
                    <td className="px-1.5 py-1 text-right font-mono tabular-nums">{formatIndianCurrency(sub.rate)}</td>
                    <td className="px-1.5 py-1 text-right font-mono tabular-nums text-gray-500">{sub.discount_percent ? `${sub.discount_percent}%` : '—'}</td>
                    <td className="px-1.5 py-1 text-right font-mono tabular-nums text-gray-500">{sub.cgst_percent ? `${sub.cgst_percent}%` : '—'}</td>
                    <td className="px-1.5 py-1 text-right font-mono tabular-nums text-gray-500">{sub.sgst_percent ? `${sub.sgst_percent}%` : '—'}</td>
                    <td className="px-1.5 py-1 text-right font-mono tabular-nums text-gray-500">{sub.igst_percent ? `${sub.igst_percent}%` : '—'}</td>
                    <td className="px-1.5 py-1 text-right font-mono tabular-nums">{formatIndianCurrency(c.amount)}</td>
                    <td className="px-1.5 py-1 text-right font-mono tabular-nums text-amber-600">{taxTotal > 0 ? formatIndianCurrency(taxTotal) : '—'}</td>
                    <td className="px-1.5 py-1 text-right font-mono tabular-nums font-semibold text-gray-900">{formatIndianCurrency(c.final_amount)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td colSpan={9} className="px-1.5 py-1 text-[10px] md:text-xs font-semibold text-gray-600">Totals</td>
                <td className="px-1.5 py-1 text-right font-mono font-semibold tabular-nums">{formatIndianCurrency(summary.taxableTotal)}</td>
                <td className="px-1.5 py-1 text-right font-mono font-semibold tabular-nums text-amber-600">
                  {formatIndianCurrency(summary.cgstTotal + summary.sgstTotal + summary.igstTotal)}
                </td>
                <td className="px-1.5 py-1 text-right font-mono font-bold tabular-nums text-gray-900">{formatIndianCurrency(summary.finalTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export function JournalFormat({
  companyName, period, entries,
  highlightEntryCode, emptyMessage = 'No journal entries found for this period.',
  selectedCodes, onSelectionChange,
  selectionMode, onSelectionModeChange,
  onDeleteEntry, onEditEntry,
}: JournalFormatProps) {
  const [inventoryPopup, setInventoryPopup] = useState<InventorySubLine[] | null>(null);
  /* Right-click menu. entryCode is null when the click landed on the panel
     rather than on an entry (then only the selection items apply). */
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; entryCode: string | null } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close the menu on outside click, scroll, resize, blur or Esc. Esc is taken
  // in the capture phase and stopped there, so it only closes the menu — it
  // doesn't also leave selection mode.
  React.useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); setCtxMenu(null); }
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('blur', close);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('blur', close);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [ctxMenu]);
  const scrollToRef = useRef<HTMLTableRowElement | null>(null);
  const lastClickedIndexRef = useRef<number>(-1);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const code = (highlightEntryCode ?? '').trim();
  const highlightIndex = code
    ? entries.findIndex(e => e.entryCode.includes(code))
    : -1;

  const isSelectable = !!onSelectionChange;
  /* Checkboxes show only in selection mode when the page opts in; otherwise
     (selectionMode omitted) they show whenever selection is wired, as before. */
  const showSelection = isSelectable && (selectionMode === undefined || selectionMode);
  const canEnterSelection = isSelectable && !!onSelectionModeChange;
  const allSelected = isSelectable && entries.length > 0 && entries.every(e => selectedCodes?.has(e.entryCode));
  const someSelected = isSelectable && entries.some(e => selectedCodes?.has(e.entryCode));

  const openMenu = (e: React.MouseEvent, entryCode: string | null) => {
    const entryActions = !!entryCode && (!!onEditEntry || !!onDeleteEntry);
    if (!canEnterSelection && !entryActions) return;
    e.preventDefault();
    e.stopPropagation();
    // Keyboard-invoked (menu key / Shift+F10) can report 0,0 — anchor to the element.
    let { clientX: x, clientY: y } = e;
    if (x === 0 && y === 0) {
      const r = (e.target as HTMLElement).getBoundingClientRect();
      x = r.left + 12;
      y = r.top + r.height / 2;
    }
    setCtxMenu({ x, y, entryCode });
  };

  const enterSelection = (entryCode: string | null) => {
    onSelectionModeChange?.(true);
    if (entryCode) {
      onSelectionChange?.(new Set([...(selectedCodes ?? []), entryCode]));
      lastClickedIndexRef.current = entries.findIndex(e => e.entryCode === entryCode);
    }
  };
  const toggleEntry = (entryCode: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedCodes ?? []);
    if (next.has(entryCode)) next.delete(entryCode); else next.add(entryCode);
    lastClickedIndexRef.current = entries.findIndex(e => e.entryCode === entryCode);
    onSelectionChange(next);
  };
  const selectAllFromMenu = () => {
    onSelectionModeChange?.(true);
    onSelectionChange?.(allSelected && showSelection ? new Set() : new Set(entries.map(e => e.entryCode)));
  };
  const exitSelection = () => {
    onSelectionChange?.(new Set());
    onSelectionModeChange?.(false);
  };

  useEffect(() => {
    if (highlightIndex >= 0 && scrollToRef.current) {
      scrollToRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightIndex, code]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(entries.map(e => e.entryCode)));
    }
  };

  const handleEntryClick = (index: number, entryCode: string, isShift: boolean) => {
    if (!onSelectionChange || !selectedCodes) return;
    const newSet = new Set(selectedCodes);
    if (isShift && lastClickedIndexRef.current >= 0) {
      const start = Math.min(lastClickedIndexRef.current, index);
      const end = Math.max(lastClickedIndexRef.current, index);
      const selecting = !selectedCodes.has(entryCode);
      for (let i = start; i <= end; i++) {
        if (selecting) newSet.add(entries[i].entryCode);
        else newSet.delete(entries[i].entryCode);
      }
    } else {
      if (newSet.has(entryCode)) newSet.delete(entryCode);
      else newSet.add(entryCode);
      lastClickedIndexRef.current = index;
    }
    onSelectionChange(newSet);
  };

  // Build LF map
  const allAccounts = new Set<string>();
  for (const e of entries) for (const l of e.lines) allAccounts.add(l.accountName);
  const folioMap = new Map<string, number>();
  [...allAccounts].sort().forEach((acc, i) => folioMap.set(acc, i + 1));

  if (entries.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
        <p className="text-xs md:text-sm text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  let totalDebit = 0, totalCredit = 0;
  for (const e of entries) for (const l of e.lines) {
    if (l.isDebit) totalDebit += l.amount; else totalCredit += l.amount;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" onContextMenu={(e) => openMenu(e, null)}>
      {/* Header */}
      <div className="text-center py-2 border-b border-gray-200 bg-gray-50/50">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{companyName}</p>
        <h3 className="text-sm font-bold text-gray-900 mt-px">JOURNAL</h3>
        <p className="text-[10px] text-gray-400 mt-px">{period}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs md:text-[13px] min-w-[800px]">
          <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {showSelection && (
              <th className="px-2 py-1.5 w-8 border-r border-gray-100 text-center">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="h-4 w-4 accent-blue-600 cursor-pointer"
                  title="Select all"
                />
              </th>
            )}
            <th className="px-2 py-1.5 text-left text-[9px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-20 border-r border-gray-100">Date</th>
            <th className="px-2 py-1.5 text-left text-[9px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-100">Particulars</th>
            <th className="px-2 py-1.5 text-center text-[9px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-8 border-r border-gray-100">LF</th>
            <th className="px-2 py-1.5 text-right text-[9px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28 border-r border-gray-100">Debit (₹)</th>
            <th className="px-2 py-1.5 text-right text-[9px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">Credit (₹)</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, ei) => {
            const isHighlighted = ei === highlightIndex;
            const hlClass = isHighlighted ? 'bg-yellow-50' : '';

            return (
              <React.Fragment key={ei}>
                {entry.lines.map((line, li) => (
                  <tr
                    key={`${ei}-${li}`}
                    ref={isHighlighted && li === 0 ? scrollToRef : undefined}
                    className={`border-b border-gray-100 ${hlClass} hover:bg-blue-50/20 transition-colors`}
                    onContextMenu={(e) => openMenu(e, entry.entryCode)}
                  >
                    {li === 0 && showSelection && (
                      <td
                        className="px-2 py-1 align-top border-r border-gray-100 text-center"
                        rowSpan={entry.lines.length + 1}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCodes?.has(entry.entryCode) ?? false}
                          onChange={() => {}}
                          onClick={(e) => handleEntryClick(ei, entry.entryCode, e.shiftKey)}
                          className="h-4 w-4 accent-blue-600 cursor-pointer mt-0.5"
                        />
                      </td>
                    )}
                    {li === 0 && (
                      /* Focusable so the keyboard menu key / Shift+F10 opens the entry menu. */
                      <td
                        tabIndex={0}
                        className="px-2 py-1 align-top border-r border-gray-100"
                        rowSpan={entry.lines.length + 1}
                        title={`${VTYPE_LABEL[entry.voucherType] ?? entry.voucherType} · ${entry.entryCode}`}
                      >
                        <div className="font-mono tabular-nums text-[10.5px] md:text-[11.5px] text-gray-500 whitespace-nowrap">{entry.date}</div>
                        <div className="mt-1">
                          <span className="code-pill !px-2 !py-px !text-[10.5px]">{formatVoucherNo(entry.entryCode)}</span>
                        </div>
                      </td>
                    )}
                    <td className={`px-2 py-1 border-r border-gray-100 ${!line.isDebit ? 'pl-6' : ''}`}>
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* Inventory items button */}
                        {line.inventorySubLines && line.inventorySubLines.length > 0 && (
                          <button
                            onClick={() => setInventoryPopup(line.inventorySubLines!)}
                            className="inline-flex items-center gap-0.5 h-4 px-1.5 text-[8px] md:text-[9px] font-semibold rounded-full border border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors shrink-0"
                            title="View inventory items"
                          >
                            <Package className="h-2.5 w-2.5" />
                            {line.inventorySubLines.length}
                          </button>
                        )}
                        {/* TDS badge */}
                        {line.tdsSection && (
                          <span className="inline-flex items-center h-4 px-1.5 text-[8px] md:text-[9px] font-semibold rounded-full border border-orange-300 text-orange-700 bg-orange-50 shrink-0" title={`TDS u/s ${line.tdsSection} @ ${line.tdsRate ?? '?'}%`}>
                            TDS {line.tdsSection}
                          </span>
                        )}
                        {/* TCS badge */}
                        {line.tcsSection && (
                          <span className="inline-flex items-center h-4 px-1.5 text-[8px] md:text-[9px] font-semibold rounded-full border border-purple-300 text-purple-700 bg-purple-50 shrink-0" title={`TCS u/s ${line.tcsSection} @ ${line.tcsRate ?? '?'}%`}>
                            TCS {line.tcsSection}
                          </span>
                        )}
                        {line.isDebit ? (
                          <span className="font-medium text-gray-900">
                            {/a\/c\.?$/i.test(line.accountName.trim()) ? line.accountName : `${line.accountName} A/c`}
                            <span className="ml-1 text-[9px] md:text-[10px] font-normal text-gray-400">Dr.</span>
                          </span>
                        ) : (
                          <span className="text-gray-600">
                            To {/a\/c\.?$/i.test(line.accountName.trim()) ? line.accountName : `${line.accountName} A/c`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1 text-center text-[9px] md:text-[10px] text-gray-400 border-r border-gray-100">
                      {folioMap.get(line.accountName) ?? ''}
                    </td>
                    <td className="px-2 py-1 text-right font-mono text-xs md:text-[13px] tabular-nums border-r border-gray-100 text-dr">
                      {line.isDebit ? formatIndianCurrency(line.amount) : ''}
                    </td>
                    <td className="px-2 py-1 text-right font-mono text-xs md:text-[13px] tabular-nums text-cr">
                      {!line.isDebit ? formatIndianCurrency(line.amount) : ''}
                    </td>
                  </tr>
                ))}
                {/* Narration row */}
                <tr className={`border-b-2 border-gray-200 ${hlClass}`} onContextMenu={(e) => openMenu(e, entry.entryCode)}>
                  <td className="px-2 py-1.5 pl-6 text-[10px] md:text-xs text-gray-400 italic border-r border-gray-100" colSpan={4}>
                    ({entry.narration || 'No narration'})
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 border-t-2 border-gray-300">
            {showSelection && <td className="px-2 py-1.5 border-r border-gray-100" />}
            <td className="px-2 py-1.5 border-r border-gray-100" />
            <td className="px-2 py-1.5 font-bold text-gray-900 text-xs md:text-[13px] border-r border-gray-100">Total</td>
            <td className="px-2 py-1.5 border-r border-gray-100" />
            <td className="px-2 py-1.5 text-right font-mono font-bold text-xs md:text-[13px] text-dr border-r border-gray-100">
              {formatIndianCurrency(totalDebit)}
            </td>
            <td className="px-2 py-1.5 text-right font-mono font-bold text-xs md:text-[13px] text-cr">
              {formatIndianCurrency(totalCredit)}
            </td>
          </tr>
        </tfoot>
      </table>
      </div>

      {inventoryPopup && (
        <InventoryPopup subLines={inventoryPopup} onClose={() => setInventoryPopup(null)} />
      )}

      {/* Right-click menu — portalled to <body> so no ancestor's overflow or
          containing block can clip it; clamped to stay inside the viewport. */}
      {ctxMenu && createPortal(
        (() => {
          const entryCode = ctxMenu.entryCode;
          const entrySelected = !!entryCode && !!selectedCodes?.has(entryCode);
          const hasEntryActions = !!entryCode && (!!onEditEntry || !!onDeleteEntry);
          const rows = (canEnterSelection ? (showSelection ? (entryCode ? 3 : 2) : 2) : 0) + (hasEntryActions ? 2 : 0);
          const left = Math.max(8, Math.min(ctxMenu.x, window.innerWidth - 196));
          const top = Math.max(8, Math.min(ctxMenu.y, window.innerHeight - (rows * 32 + 24)));
          return (
            <div
              ref={menuRef}
              role="menu"
              className="fixed z-[80] min-w-[180px] rounded-[12px] border border-[var(--sand)] bg-white py-1.5 shadow-[var(--shadow-lift)]"
              style={{ left, top }}
              onMouseDown={e => e.stopPropagation()}
              onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
            >
              {canEnterSelection && (
                showSelection ? (
                  <>
                    {entryCode && (
                      <MenuItem onClick={() => { toggleEntry(entryCode); setCtxMenu(null); }}>
                        {entrySelected ? 'Deselect' : 'Select'}
                      </MenuItem>
                    )}
                    <MenuItem onClick={() => { selectAllFromMenu(); setCtxMenu(null); }}>
                      {allSelected ? 'Clear selection' : 'Select all'}
                    </MenuItem>
                    <MenuItem onClick={() => { exitSelection(); setCtxMenu(null); }}>Done selecting</MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem onClick={() => { enterSelection(entryCode); setCtxMenu(null); }}>Select</MenuItem>
                    <MenuItem onClick={() => { selectAllFromMenu(); setCtxMenu(null); }}>Select all</MenuItem>
                  </>
                )
              )}
              {canEnterSelection && hasEntryActions && <div className="my-1 border-t border-[var(--cream)]" />}
              {entryCode && onEditEntry && (
                <MenuItem onClick={() => { onEditEntry(entryCode); setCtxMenu(null); }}>Edit entry</MenuItem>
              )}
              {entryCode && onDeleteEntry && (
                <MenuItem danger onClick={() => { onDeleteEntry(entryCode); setCtxMenu(null); }}>Delete entry</MenuItem>
              )}
            </div>
          );
        })(),
        document.body,
      )}
    </div>
  );
}
