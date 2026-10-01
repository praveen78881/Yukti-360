'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Download, FileDown, FileText, FileSpreadsheet, Loader2, SlidersHorizontal } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { PageHeader } from '@/components/layout/PageHeader';
import { JournalFormat } from '@/components/formats/JournalFormat';
import { DateRangeFilter } from '@/components/export/DateRangeFilter';
import { exportToPDF, exportToExcel, exportToCSV } from '@/components/export/exportUtils';
import { ManualEntryDialog } from '@/components/entries/ManualEntryDialog';
import { getCurrentFY } from '@/lib/utils/dateUtils';
import { ENTITY_TYPES } from '@/lib/constants/entityTypes';
import { AlertBanner } from '@/components/layout/AlertBanner';
import { getJournalDateRange, deleteJournalEntry } from '@/lib/offlineDb';
import type { EntityType } from '@/types/company';
import type { JournalEntry as ComputeJournalEntry } from '@/lib/accounting/computeEngine';

/** The code filter matches stored codes by substring (JE00001…). The table now
 *  shows voucher numbers as JE001, so a 3–4 digit "JE…" query is read as that
 *  voucher number exactly (JE001 → JE00001); otherwise the query is used as typed.
 *  Without this, "JE001" would substring-match JE00100–JE00199 instead of entry 1. */
function normalizeEntryCodeQuery(raw: string): string | undefined {
  const q = raw.trim();
  if (!q) return undefined;
  const m = /^JE(\d{3,4})$/i.exec(q);
  return m ? `JE${String(Number(m[1])).padStart(5, '0')}` : q;
}


export default function JournalPage() {
  const [searchParams] = useSearchParams();
  const { company, companyId, loading: companyLoading } = useCompany();
  const fy = getCurrentFY();
  const voucherFromUrl = searchParams.get('voucherType') ?? '';
  const entryCodeFromUrl = searchParams.get('entryCode') ?? '';
  const [fromDate, setFromDate] = useState(fy.start);
  const [toDate, setToDate] = useState(fy.end);
  const [voucherFilter, setVoucherFilter] = useState<string>(voucherFromUrl);
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [entryCodeFilter, setEntryCodeFilter] = useState<string>(entryCodeFromUrl);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showTransferMenu, setShowTransferMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
  const transferMenuRef = useRef<HTMLDivElement | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);
  const dateRangeInitialized = useRef(false);

  // On first load, expand date range to include ALL stored entries (not just current FY).
  // This ensures previously-imported entries with old dates are always visible.
  useEffect(() => {
    if (!companyId || dateRangeInitialized.current) return;
    dateRangeInitialized.current = true;
    const range = getJournalDateRange(companyId);
    if (!range) return;
    setFromDate((d) => (range.from < d ? range.from : d));
    setToDate((d) => (range.to > d ? range.to : d));
  }, [companyId]);

  useEffect(() => {
    setVoucherFilter(voucherFromUrl);
  }, [voucherFromUrl]);

  useEffect(() => {
    setEntryCodeFilter(entryCodeFromUrl);
  }, [entryCodeFromUrl]);

  useEffect(() => {
    if (!showTransferMenu) return undefined;

    const onPointerDown = (event: MouseEvent) => {
      if (!transferMenuRef.current) return;
      if (!transferMenuRef.current.contains(event.target as Node)) {
        setShowTransferMenu(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowTransferMenu(false);
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onEscape);
    };
  }, [showTransferMenu]);

  useEffect(() => {
    if (!showFilters) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!filterRef.current) return;
      if (!filterRef.current.contains(event.target as Node)) setShowFilters(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowFilters(false);
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onEscape);
    };
  }, [showFilters]);

  const JOURNAL_PAGE_LIMIT = 5000;
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 500;

  const entryCodeQuery = normalizeEntryCodeQuery(entryCodeFilter);
  const { entries, loading, createEntry, deleteEntry, refresh } = useJournalEntries({
    companyId: companyId || '',
    fromDate,
    toDate,
    voucherType: voucherFilter || undefined,
    accountName: accountFilter || undefined,
    entryCode: entryCodeQuery,
    limit: JOURNAL_PAGE_LIMIT,
    enabled: !!companyId,
  });

  const allRange = useMemo(() => getJournalDateRange(companyId || ''), [companyId]);

  // These hooks must run on every render, so they sit ABOVE the loading return
  // below (they were after it, which broke the Rules of Hooks: a render while the
  // company was still loading had fewer hooks than the next one → React #310).
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [editingEntry, setEditingEntry] = useState<ComputeJournalEntry | null>(null);
  // Selection is on request only: right-click the journal → Select / Select all.
  // Until then no checkbox column is shown.
  const [selectMode, setSelectMode] = useState(false);

  // Clear selection and pagination when filters or company change
  useEffect(() => {
    setSelectedCodes(new Set());
    setCurrentPage(1);
  }, [voucherFilter, accountFilter, entryCodeFilter, fromDate, toDate, companyId]);

  // Esc leaves selection mode (and clears it) — unless something on top of the
  // table (a dialog, the download menu, the filters) is what Esc is closing.
  useEffect(() => {
    if (!selectMode) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (showNewEntry || editingEntry || showTransferMenu || showFilters) return;
      setSelectedCodes(new Set());
      setSelectMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectMode, showNewEntry, editingEntry, showTransferMenu, showFilters]);
  if (companyLoading || !company) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const entityLabel = ENTITY_TYPES[company.entity_type as EntityType]?.label || company.entity_type;

  const journalEntries = entries.map(e => ({
    entryCode: e.entry_code,
    date: e.entry_date,
    lines: e.lines.map(l => ({
      accountName: l.account_name,
      isDebit: (l.debit || 0) > 0,
      amount: (l.debit || 0) > 0 ? l.debit : l.credit,
      inventorySubLines: l.inventory_sub_lines,
      tdsSection: l.tds_section,
      tdsRate: l.tds_rate,
      tcsSection: l.tcs_section,
      tcsRate: l.tcs_rate,
    })),
    narration: e.narration,
    voucherType: e.voucher_type,
  }));

  const totalPages = Math.ceil(journalEntries.length / PAGE_SIZE);
  const paginatedEntries = journalEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Export data (without JE codes)
  const exportData = entries.flatMap(e =>
    e.lines.map(l => ({
      date: e.entry_date,
      particulars: l.account_name,
      voucher_type: e.voucher_type,
      debit: l.debit || 0,
      credit: l.credit || 0,
      narration: e.narration,
    }))
  );

  const exportColumns = [
    { header: 'Date', key: 'date' },
    { header: 'Particulars', key: 'particulars' },
    { header: 'Voucher Type', key: 'voucher_type' },
    { header: 'Debit (₹)', key: 'debit', align: 'right' as const },
    { header: 'Credit (₹)', key: 'credit', align: 'right' as const },
    { header: 'Narration', key: 'narration' },
  ];

  // Journal JSON export/import now lives on the companies page (right-click a
  // company → Export company; New Company → Import) — see journalTransfer.ts.
  const handleDownload = async (type: 'pdf' | 'excel' | 'csv') => {
    setDownloadLoading(type);
    setShowTransferMenu(false);
    try {
      if (type === 'pdf') await exportToPDF('Journal', company.name, entityLabel, `${fromDate} to ${toDate}`, exportColumns, exportData);
      else if (type === 'excel') await exportToExcel('Journal', exportColumns, exportData);
      else exportToCSV(exportColumns, exportData, 'Journal');
    } finally {
      setDownloadLoading(null);
    }
  };

  const handleSave = async (entry: Parameters<typeof createEntry>[0]) => {
    const created = await createEntry(entry);
    // Ensure the new entry is visible by expanding the date range if needed
    if (entry.entry_date < fromDate) setFromDate(entry.entry_date);
    if (entry.entry_date > toDate) setToDate(entry.entry_date);
    return created;
  };

  const handleEditEntry = (entryCode: string) => {
    const entry = entries.find(e => e.entry_code === entryCode);
    if (entry) setEditingEntry(entry);
  };

  const handleDeleteEntry = async (entryCode: string) => {
    if (!companyId) return;
    const entry = entries.find(e => e.entry_code === entryCode);
    if (!entry) return;
    const confirmed = window.confirm(`Delete journal entry ${entryCode}?\n\nThis cannot be undone. The account names will still exist in the ledger.`);
    if (!confirmed) return;
    deleteJournalEntry(entry.id);
    await refresh();
  };

  const handleDeleteSelected = async () => {
    if (!companyId || selectedCodes.size === 0) return;
    const n = selectedCodes.size;
    const confirmed = window.confirm(
      `Permanently delete ${n} selected journal entr${n === 1 ? 'y' : 'ies'}?\n\nThis cannot be undone.`,
    );
    if (!confirmed) return;
    for (const code of selectedCodes) {
      const entry = entries.find(e => e.entry_code === code);
      if (entry) deleteJournalEntry(entry.id);
    }
    setSelectedCodes(new Set());
    setSelectMode(false);
    await refresh();
  };

  const exitSelectMode = () => {
    setSelectedCodes(new Set());
    setSelectMode(false);
  };


  const hasActiveFilter =
    voucherFilter !== '' ||
    accountFilter !== '' ||
    entryCodeFilter !== '' ||
    fromDate !== fy.start ||
    toDate !== fy.end;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="shrink-0 mb-3">
        <PageHeader title="Journal" description={`${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} in view`}>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowNewEntry(true)}
              className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3 w-3" /> New Entry
            </button>
            {/* Selection mode (entered from the right-click menu): a calm pill with
                the count, the bulk delete, and the way out. Esc also exits. */}
            {selectMode && (
              <div
                role="toolbar"
                aria-label="Selection"
                className="inline-flex items-center h-7 gap-0.5 rounded-full border border-[var(--sand)] bg-white/85 pl-3 pr-0.5 shadow-[var(--shadow-rest)]"
              >
                <span className="pr-1.5 text-[11.5px] text-[var(--ink-2)] whitespace-nowrap">
                  <span className="font-mono tabular-nums font-semibold text-[var(--ink)]">{selectedCodes.size}</span> selected
                </span>
                {selectedCodes.size > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    disabled={loading}
                    className="h-6 px-2.5 rounded-full text-[11.5px] font-semibold text-[var(--bad)] hover:bg-[var(--bad-soft)] disabled:text-[var(--ink-3)] transition-colors duration-[160ms]"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={exitSelectMode}
                  className="h-6 px-2.5 rounded-full text-[11.5px] font-semibold text-[var(--navy)] hover:bg-[var(--navy-soft)] transition-colors duration-[160ms]"
                >
                  Done
                </button>
              </div>
            )}

            {/* Date Filters */}
            <DateRangeFilter
              fromDate={fromDate}
              toDate={toDate}
              onDateChange={(from, to) => { setFromDate(from); setToDate(to); }}
              allRange={allRange}
            />

            {/* Download dropdown */}
            <div className="relative" ref={transferMenuRef}>
              <button
                type="button"
                onClick={() => setShowTransferMenu(v => !v)}
                className="inline-flex items-center justify-center h-7 w-7 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                title="Download"
              >
                {downloadLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              </button>
              {showTransferMenu && (
                <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-1">
                  <button type="button" onClick={() => handleDownload('pdf')} disabled={!!downloadLoading}
                    className="w-full h-8 px-2 text-left text-xs text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2 disabled:opacity-40">
                    <FileText className="h-3.5 w-3.5" /> PDF
                  </button>
                  <button type="button" onClick={() => handleDownload('excel')} disabled={!!downloadLoading}
                    className="w-full h-8 px-2 text-left text-xs text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2 disabled:opacity-40">
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                  </button>
                  <button type="button" onClick={() => handleDownload('csv')} disabled={!!downloadLoading}
                    className="w-full h-8 px-2 text-left text-xs text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2 disabled:opacity-40">
                    <FileDown className="h-3.5 w-3.5" /> CSV
                  </button>
                </div>
              )}
            </div>

            {/* Filter toggle */}
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setShowFilters(v => !v)}
                className={`inline-flex items-center justify-center h-7 w-7 border rounded-lg transition-colors ${
                  showFilters
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title="Filters"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>

              {showFilters && (
                <div className="absolute right-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-30 p-4 space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">Filters</span>
                    {hasActiveFilter && (
                      <button
                        type="button"
                        onClick={() => {
                          setFromDate(fy.start);
                          setToDate(fy.end);
                          setVoucherFilter('');
                          setAccountFilter('');
                          setEntryCodeFilter('');
                        }}
                        className="text-[11px] text-blue-600 hover:underline"
                      >
                        Reset all
                      </button>
                    )}
                  </div>

                  {/* Search */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Search</p>
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                        <input
                          value={entryCodeFilter}
                          onChange={e => setEntryCodeFilter(e.target.value)}
                          placeholder="Voucher no. e.g. JE001"
                          maxLength={8}
                          className="w-full h-7 pl-7 pr-2 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                        <input
                          value={accountFilter}
                          onChange={e => setAccountFilter(e.target.value)}
                          placeholder="Account name…"
                          className="w-full h-7 pl-7 pr-2 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </PageHeader>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-auto flex flex-col">
        {entries.length === JOURNAL_PAGE_LIMIT && (
          <div className="shrink-0">
            <AlertBanner type="info" title="Showing latest entries only" message={`Display is capped at ${JOURNAL_PAGE_LIMIT} entries. Narrow the date range or use filters to see a specific set.`} />
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 min-h-0 relative">
            <JournalFormat
              companyName={company.name}
              period={`${fromDate} to ${toDate}`}
              entries={paginatedEntries}
              highlightEntryCode={entryCodeQuery}
              emptyMessage="No journal entries yet. Use New Entry to create your first journal."
              selectedCodes={selectedCodes}
              onSelectionChange={setSelectedCodes}
              selectionMode={selectMode}
              onSelectionModeChange={(on) => { if (on) setSelectMode(true); else exitSelectMode(); }}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
            />
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="shrink-0 flex items-center justify-between px-3 py-1 bg-white border-t border-gray-200">
            <div className="text-[10px] text-gray-400 font-medium">
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, journalEntries.length)} of {journalEntries.length}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-5 px-2 text-[10px] font-semibold border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                ‹ Prev
              </button>
              <span className="px-1.5 text-[10px] font-bold text-gray-600">{currentPage}/{totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-5 px-2 text-[10px] font-semibold border border-gray-200 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>

      <ManualEntryDialog
        open={showNewEntry}
        onOpenChange={setShowNewEntry}
        companyId={companyId || ''}
        onSave={handleSave}
      />

      {/* Edit dialog */}
      {editingEntry && (
        <ManualEntryDialog
          open={!!editingEntry}
          onOpenChange={(open) => { if (!open) setEditingEntry(null); }}
          companyId={companyId || ''}
          onSave={handleSave}
          initialEntry={editingEntry}
        />
      )}
    </div>
  );
}
