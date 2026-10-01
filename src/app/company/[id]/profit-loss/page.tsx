'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { PageHeader } from '@/components/layout/PageHeader';
import { TAccountFormat } from '@/components/formats/TAccountFormat';
import { VerticalStatementFormat } from '@/components/formats/VerticalStatementFormat';
import { DateRangeFilter } from '@/components/export/DateRangeFilter';
import { ExportButtons } from '@/components/export/ExportButtons';
import { exportElementAsImagePDF } from '@/components/export/exportUtils';
import { BsNotesDrawer } from '@/components/financials/BsNotesDrawer';
import { useReportDateRange } from '@/hooks/useReportDateRange';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { ENTITY_TYPES } from '@/lib/constants/entityTypes';
import { getEntityConfig } from '@/lib/entityConfig';
import { computeTradingAccount } from '@/lib/accounting/tradingAccountCompute';
import { computeProfitLoss, computeScheduleIIIPL } from '@/lib/accounting/profitLossCompute';
import type { EntityType } from '@/types/company';
import { loadPyValues, savePyValues, pyNum, type PyValues } from '@/lib/accounting/pyOverrides';

/** Maps note number → scheduleIII group strings for the P&L drill-down drawer */
const PL_NOTE_GROUPS: Record<string, string[]> = {
  '1': ['Revenue from Operations'],
  '2': ['Other Income'],
  '3': ['Cost of Materials Consumed'],
  '4': ['Changes in Inventories'],
  '5': ['Employee Benefits Expense'],
  '6': ['Finance Costs'],
  '7': ['Depreciation & Amortisation'],
  '8': ['Direct Expenses', 'Other Expenses — Administration', 'Other Expenses — Selling', 'Other Expenses — Write-offs', 'Other Expenses', 'GST — ITC'],
};

export default function ProfitLossPage() {
  const { company, companyId, loading: companyLoading } = useCompany();
  const { fromDate, toDate, setFromDate, setToDate } = useReportDateRange(companyId);
  const [openPLNote, setOpenPLNote] = useState<{ label: string; groups: string[] } | null>(null);
  const [manualCurrentTax, setManualCurrentTax] = useState('');
  const [manualDeferredTax, setManualDeferredTax] = useState('');
  const statementRef = useRef<HTMLDivElement | null>(null);

  // Previous-year column: directly typed per line (blank = NIL), persisted per FY.
  // Derived rows (totals, profit lines) auto-compute from the typed leaf figures.
  const fyStartYear = fromDate.slice(0, 4);
  const [pyVals, setPyVals] = useState<PyValues>({});
  useEffect(() => {
    if (companyId) setPyVals(loadPyValues(companyId, 'pl', fyStartYear));
  }, [companyId, fyStartYear]);
  const setPy = (label: string, v: string) => {
    setPyVals(prev => {
      const next = { ...prev, [label]: v };
      if (companyId) savePyValues(companyId, 'pl', fyStartYear, next);
      return next;
    });
  };
  const pyN = (label: string) => pyNum(pyVals, label);
  const pyEdit = (label: string) => ({
    previousYear: pyN(label),
    prevEditValue: pyVals[label] ?? '',
    onPrevEdit: (v: string) => setPy(label, v),
  });

  const { entries, loading } = useJournalEntries({
    companyId: companyId || '',
    fromDate,
    toDate,
    enabled: !!companyId,
  });

  const tradingAccount = useMemo(() => computeTradingAccount(entries), [entries]);
  const profitLoss = useMemo(
    () => computeProfitLoss(entries, tradingAccount.grossProfit),
    [entries, tradingAccount.grossProfit]
  );
  const scheduleIII = useMemo(() => computeScheduleIIIPL(entries), [entries]);

  if (companyLoading || !company) {
    return <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const entityLabel = ENTITY_TYPES[company.entity_type as EntityType]?.label || company.entity_type;
  const entityConfig = getEntityConfig(company.entity_type);
  const isScheduleIII = entityConfig.nav.profitLossFormat === 'schedule_iii';

  const exportColumns = [
    { header: 'Side', key: 'side' },
    { header: 'Particulars', key: 'name' },
    { header: 'Amount (₹)', key: 'amount', align: 'right' as const, isMono: true },
  ];

  const exportData = [
    ...profitLoss.debitItems.map(i => ({ side: 'Dr', name: i.name, amount: i.amount })),
    ...profitLoss.creditItems.map(i => ({ side: 'Cr', name: i.name, amount: i.amount })),
  ];

  const balancedTotal = Math.max(
    profitLoss.debitItems.reduce((s, i) => s + i.amount, 0),
    profitLoss.creditItems.reduce((s, i) => s + i.amount, 0)
  );

  const pl = scheduleIII;

  // Manual tax overrides — empty string means "use computed"
  const effCurrentTax = manualCurrentTax !== '' ? (parseFloat(manualCurrentTax) || 0) : pl.currentTaxExpense;
  const effDeferredTax = manualDeferredTax !== '' ? (parseFloat(manualDeferredTax) || 0) : pl.deferredTaxExpense;
  const effTotalTax = effCurrentTax + effDeferredTax + pl.otherTaxExpense;
  const effProfitAfterTax = pl.profitBeforeTax - effTotalTax;
  const effTotalCI = effProfitAfterTax + pl.oci;
  const hasManualTax = manualCurrentTax !== '' || manualDeferredTax !== '';

  // Previous-year derived rows — computed from whatever leaves the CA typed (NIL default).
  const PY_EXPENSE_LABELS = [
    'Cost of materials consumed', 'Purchases of stock-in-trade',
    'Changes in inventories of finished goods, WIP & stock-in-trade',
    'Employee benefits expense', 'Finance costs',
    'Depreciation and amortisation expense', 'Other expenses',
  ];
  const pyTotalRevenue = pyN('Revenue from operations (Net)') + pyN('Other income');
  const pyTotalExpenses = PY_EXPENSE_LABELS.reduce((s, l) => s + pyN(l), 0);
  const pyPBET = pyTotalRevenue - pyTotalExpenses;
  const pyPBT = pyPBET - pyN('Exceptional items');
  const pyTax = pyN('(a) Current Tax') + pyN('(b) Deferred Tax') + pyN('(c) Other Tax');
  const pyPAT = pyPBT - pyTax;
  const pyOci = pl.ociBreakdown.length > 0
    ? pl.ociBreakdown.reduce((s, o) => s + pyN(o.name), 0)
    : pyN('Other Comprehensive Income');
  const pyTCI = pyPAT + pyOci;

  // Full Schedule III export (Excel/CSV): EVERY statement line plus its
  // account-level sub-particulars (note breakdowns), section headings, totals
  // and spacer rows — mirroring the vertical statement. ' ' cells keep spacing
  // (truly empty cells print as '-').
  const s3ExportColumns = [
    { header: 'Particulars', key: 'particulars' },
    { header: 'Note', key: 'note' },
    { header: 'Current Year (₹)', key: 'cy', align: 'right' as const, isMono: true },
    { header: 'Previous Year (₹)', key: 'py', align: 'right' as const, isMono: true },
  ];
  type XRow = { particulars: string; note: string; cy: number | string; py: number | string };
  const s3ExportData: XRow[] = (() => {
    const rows: XRow[] = [];
    const heading = (t: string) => rows.push({ particulars: t, note: ' ', cy: ' ', py: ' ' });
    const spacer = () => rows.push({ particulars: ' ', note: ' ', cy: ' ', py: ' ' });
    const line = (label: string, note: string, cy: number, py: number) =>
      rows.push({ particulars: `    ${label}`, note: note || ' ', cy, py });
    const total = (label: string, cy: number, py: number) =>
      rows.push({ particulars: label, note: ' ', cy, py });
    const sub = (arr: { name: string; amount: number }[]) =>
      arr.forEach(b => rows.push({ particulars: `        · ${b.name}`, note: ' ', cy: b.amount, py: ' ' }));

    heading('I. REVENUE FROM OPERATIONS');
    line('Revenue from operations (Net)', '1', pl.revenueFromOperations, pyN('Revenue from operations (Net)'));
    sub(pl.revenueFromOperationsBreakdown);
    spacer();
    heading('II. OTHER INCOME');
    line('Other income', '2', pl.otherIncome, pyN('Other income'));
    sub(pl.otherIncomeBreakdown);
    spacer();
    total('III. TOTAL REVENUE (I + II)', pl.totalRevenue, pyTotalRevenue);
    spacer();
    heading('IV. EXPENSES');
    line('Cost of materials consumed', '3', pl.costOfMaterials, pyN('Cost of materials consumed'));
    sub(pl.costOfMaterialsBreakdown);
    line('Purchases of stock-in-trade', '', pl.purchasesOfStockInTrade, pyN('Purchases of stock-in-trade'));
    sub(pl.purchasesOfStockInTradeBreakdown);
    line('Changes in inventories of finished goods, WIP & stock-in-trade', '4', pl.changesInInventories, pyN('Changes in inventories of finished goods, WIP & stock-in-trade'));
    sub(pl.changesInInventoriesBreakdown);
    line('Employee benefits expense', '5', pl.employeeBenefits, pyN('Employee benefits expense'));
    sub(pl.employeeBenefitsBreakdown);
    line('Finance costs', '6', pl.financeCosts, pyN('Finance costs'));
    sub(pl.financeCostsBreakdown);
    line('Depreciation and amortisation expense', '7', pl.depreciationAmortisation, pyN('Depreciation and amortisation expense'));
    sub(pl.depreciationAmortisationBreakdown);
    line('Other expenses', '8', pl.otherExpenses, pyN('Other expenses'));
    sub(pl.otherExpensesBreakdown);
    total('TOTAL EXPENSES (IV)', pl.totalExpenses, pyTotalExpenses);
    spacer();
    total('V. PROFIT BEFORE EXCEPTIONAL ITEMS AND TAX (III - IV)', pl.profitBeforeExceptionalAndTax, pyPBET);
    spacer();
    heading('VI. EXCEPTIONAL ITEMS');
    line('Exceptional items', '', pl.exceptionalItems, pyN('Exceptional items'));
    sub(pl.exceptionalItemsBreakdown);
    spacer();
    total('VII. PROFIT BEFORE TAX (V - VI)', pl.profitBeforeTax, pyPBT);
    spacer();
    heading('VIII. TAX EXPENSE');
    line('(a) Current Tax', '', effCurrentTax, pyN('(a) Current Tax'));
    line('(b) Deferred Tax', '', effDeferredTax, pyN('(b) Deferred Tax'));
    if (pl.otherTaxExpense !== 0) line('(c) Other Tax', '', pl.otherTaxExpense, pyN('(c) Other Tax'));
    sub(pl.taxExpenseBreakdown);
    spacer();
    total('IX. PROFIT / (LOSS) FOR THE YEAR (VII - VIII)', effProfitAfterTax, pyPAT);
    spacer();
    heading('X. OTHER COMPREHENSIVE INCOME');
    if (pl.ociBreakdown.length > 0) {
      pl.ociBreakdown.forEach(o => line(o.name, '', o.amount, pyN(o.name)));
      total('Total OCI', pl.oci, pyOci);
    } else {
      line('Other Comprehensive Income', '', pl.oci, pyN('Other Comprehensive Income'));
    }
    spacer();
    total('XI. TOTAL COMPREHENSIVE INCOME (IX + X)', effTotalCI, pyTCI);
    return rows;
  })();

  return (
    <div>
      <PageHeader
        title="Profit & Loss Account"
        description={isScheduleIII ? 'Statement of Profit and Loss (Schedule III)' : 'Traditional Profit & Loss Account'}
      >
        <div className="flex flex-col gap-2 items-end">
          <DateRangeFilter fromDate={fromDate} toDate={toDate} onDateChange={(f, t) => { setFromDate(f); setToDate(t); }} />
          <ExportButtons
            title="Profit & Loss"
            companyName={company.name}
            entityType={entityLabel}
            dateRange={`${fromDate} to ${toDate}`}
            columns={isScheduleIII ? s3ExportColumns : exportColumns}
            data={isScheduleIII ? s3ExportData : exportData}
            onPdf={() =>
              exportElementAsImagePDF({
                element: statementRef.current,
                title: 'Profit & Loss',
                orientation: 'portrait',
              })
            }
          />
        </div>
      </PageHeader>

      {!loading && entries.length > 0 && (
        <div className={
          (isScheduleIII ? effProfitAfterTax : profitLoss.netProfit) >= 0
             ? "tally-ok" : "tally-err"}>
          {(isScheduleIII ? effProfitAfterTax : profitLoss.netProfit) >= 0
            ? `Net Profit: ${formatIndianCurrency(isScheduleIII ? effProfitAfterTax : profitLoss.netProfit)}`
            : `Net Loss: ${formatIndianCurrency(Math.abs(isScheduleIII ? effProfitAfterTax : profitLoss.netProfit))}`}
        </div>
      )}


      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : isScheduleIII ? (
        <div ref={statementRef}>
            <VerticalStatementFormat
              title="Statement of Profit and Loss"
              companyName={company.name}
              period={`For the year ended ${toDate}`}
              showPreviousYear={true}
              onItemClick={(label, noteNo) => {
                if (!noteNo) return;
                const groups = PL_NOTE_GROUPS[noteNo];
                if (groups) setOpenPLNote({ label, groups });
              }}
              sections={[
                {
                  heading: 'I. REVENUE FROM OPERATIONS',
                  indent: 0,
                  items: [{
                    label: 'Revenue from operations (Net)',
                    noteNo: '1',
                    currentYear: pl.revenueFromOperations,
                    isBold: true,
                    ...pyEdit('Revenue from operations (Net)'),
                  }],
                },
                {
                  heading: 'II. OTHER INCOME',
                  indent: 0,
                  items: [{
                    label: 'Other income',
                    noteNo: '2',
                    currentYear: pl.otherIncome,
                    ...pyEdit('Other income'),
                  }],
                },
                {
                  heading: 'III. TOTAL REVENUE (I + II)',
                  indent: 0,
                  items: [{
                    label: 'Total Revenue',
                    currentYear: pl.totalRevenue,
                    previousYear: pyTotalRevenue,
                    isBold: true,
                    isTotal: true,
                  }],
                },
                {
                  heading: 'IV. EXPENSES',
                  indent: 0,
                  items: [
                    { label: 'Cost of materials consumed', noteNo: '3', currentYear: pl.costOfMaterials, ...pyEdit('Cost of materials consumed') },
                    { label: 'Purchases of stock-in-trade', currentYear: pl.purchasesOfStockInTrade, ...pyEdit('Purchases of stock-in-trade') },
                    { label: 'Changes in inventories of finished goods, WIP & stock-in-trade', noteNo: '4', currentYear: pl.changesInInventories, ...pyEdit('Changes in inventories of finished goods, WIP & stock-in-trade') },
                    { label: 'Employee benefits expense', noteNo: '5', currentYear: pl.employeeBenefits, ...pyEdit('Employee benefits expense') },
                    { label: 'Finance costs', noteNo: '6', currentYear: pl.financeCosts, ...pyEdit('Finance costs') },
                    { label: 'Depreciation and amortisation expense', noteNo: '7', currentYear: pl.depreciationAmortisation, ...pyEdit('Depreciation and amortisation expense') },
                    { label: 'Other expenses', noteNo: '8', currentYear: pl.otherExpenses, ...pyEdit('Other expenses') },
                    { label: 'TOTAL EXPENSES (IV)', currentYear: pl.totalExpenses, previousYear: pyTotalExpenses, isBold: true, isTotal: true },
                  ],
                },
                {
                  heading: 'V. PROFIT BEFORE EXCEPTIONAL ITEMS AND TAX (III - IV)',
                  indent: 0,
                  items: [{
                    label: 'Profit before exceptional items and tax',
                    currentYear: pl.profitBeforeExceptionalAndTax,
                    previousYear: pyPBET,
                    isBold: true,
                    isTotal: true,
                  }],
                },
                {
                  heading: 'VI. Exceptional Items',
                  indent: 0,
                  items: [{ label: 'Exceptional items', currentYear: pl.exceptionalItems, ...pyEdit('Exceptional items') }],
                },
                {
                  heading: 'VII. PROFIT BEFORE TAX (V - VI)',
                  indent: 0,
                  items: [{
                    label: 'Profit before tax',
                    currentYear: pl.profitBeforeTax,
                    previousYear: pyPBT,
                    isBold: true,
                    isTotal: true,
                  }],
                },
                {
                  heading: 'VIII. Tax Expense',
                  indent: 0,
                  items: [
                    { label: '(a) Current Tax', currentYear: effCurrentTax, editValue: manualCurrentTax, onEdit: (v: string) => setManualCurrentTax(v), ...pyEdit('(a) Current Tax') },
                    { label: '(b) Deferred Tax', currentYear: effDeferredTax, editValue: manualDeferredTax, onEdit: (v: string) => setManualDeferredTax(v), ...pyEdit('(b) Deferred Tax') },
                    ...(pl.otherTaxExpense !== 0 ? [{ label: '(c) Other Tax', currentYear: pl.otherTaxExpense, ...pyEdit('(c) Other Tax') }] : []),
                  ],
                },
                {
                  heading: 'IX. PROFIT / (LOSS) FOR THE YEAR (VII - VIII)',
                  indent: 0,
                  items: [{
                    label: effProfitAfterTax >= 0 ? 'Profit for the year' : 'Loss for the year',
                    currentYear: effProfitAfterTax,
                    previousYear: pyPAT,
                    isBold: true,
                    isTotal: true,
                  }],
                },
                {
                  heading: 'X. Other Comprehensive Income',
                  indent: 0,
                  items: pl.ociBreakdown.length > 0
                    ? [
                        ...pl.ociBreakdown.map(o => ({ label: o.name, currentYear: o.amount, ...pyEdit(o.name) })),
                        { label: 'Total OCI', currentYear: pl.oci, previousYear: pyOci, isBold: true, isTotal: true },
                      ]
                    : [{ label: 'Other Comprehensive Income', currentYear: pl.oci, ...pyEdit('Other Comprehensive Income') }],
                },
                {
                  heading: 'XI. TOTAL COMPREHENSIVE INCOME (IX + X)',
                  indent: 0,
                  items: [{
                    label: 'Total Comprehensive Income',
                    currentYear: effTotalCI,
                    previousYear: pyTCI,
                    isBold: true,
                    isTotal: true,
                  }],
                },
                {
                  heading: 'XII. Earnings Per Share',
                  indent: 0,
                  items: [
                    { label: 'Basic EPS (₹)', currentYear: 0, ...pyEdit('Basic EPS (₹)') },
                    { label: 'Diluted EPS (₹)', currentYear: 0, ...pyEdit('Diluted EPS (₹)') },
                  ],
                },
              ]}
            />
        </div>
      ) : (
        <div ref={statementRef}>
          <TAccountFormat
            title="Profit & Loss Account"
            subtitle={`For the period ${fromDate} to ${toDate}`}
            companyName={company.name}
            leftLabel="Dr."
            rightLabel="Cr."
            leftColumns={[
              { header: 'Particulars', key: 'name' },
              { header: 'Amount (₹)', key: 'amount', align: 'right' },
            ]}
            rightColumns={[
              { header: 'Particulars', key: 'name' },
              { header: 'Amount (₹)', key: 'amount', align: 'right' },
            ]}
            leftData={profitLoss.debitItems}
            rightData={profitLoss.creditItems}
            leftTotal={balancedTotal}
            rightTotal={balancedTotal}
          />
        </div>
      )}

      {/* Notes strip below the statement removed — notes open by clicking a
          particular in the statement itself (BsNotesDrawer). */}

      {/* P&L drill-down drawer */}
      {openPLNote && (
        <BsNotesDrawer
          companyId={companyId || ''}
          label={openPLNote.label}
          groups={openPLNote.groups}
          entries={entries}
          sectionLabel="Profit & Loss"
          onClose={() => setOpenPLNote(null)}
        />
      )}
    </div>
  );
}
