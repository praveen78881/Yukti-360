'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { computeGSTR3BFromInvoices } from '@/lib/accounting/gstComputeFromInvoices';
import { listInvoicesV2, listPurchaseInvoices } from '@/lib/accounting/gstInvoices';
import {
  emptyGstr3bMonth, buildGstr3bSaveJson, calendarMonthRangeIso, toRetPeriodMmYyyy, round2,
  type Gstr3bMonthData, type Split4,
} from '@/lib/accounting/gstr3bJson';
import { getEntityData, upsertEntityData } from '@/lib/offlineDb';
import { recentFinancialYears } from '@/lib/gst/sandbox/period';
import { BookOpen, FileDown, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────────────────────────────────
   GSTR-3B — Summary Report (April → March matrix)
   Follows the standard GSTR-3B Summary Report sheet structure: one column per
   return period plus Total, with section bands for Sales Summary (3.1 a/b/c/e),
   Table-5 inward, 3.1(d) RCM, Opening ITC, Tax Liability (non-RCM / RCM /
   combined), Interest, Late Fee, ITC (non-RCM / RCM / combined), Cash Offset and
   Closing ITC. Every month is editable in place, persists per-FY, and exports a
   portal-valid save JSON for any selected month.
   ──────────────────────────────────────────────────────────────────────────── */

const MODULE_KEY = 'gstr3b_summary';
const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

type Head = keyof Split4;
const HEADS: { h: Head; label: string }[] = [
  { h: 'igst', label: 'IGST' },
  { h: 'cgst', label: 'CGST' },
  { h: 'sgst', label: 'SGST' },
  { h: 'cess', label: 'Cess' },
];

/** Calendar (year, month 1-12) for FY month index 0..11 (0 = April). */
function fyMonth(startYear: number, mi: number): { year: number; month: number } {
  return mi < 9 ? { year: startYear, month: mi + 4 } : { year: startYear + 1, month: mi - 8 };
}

const sum4 = (x: Split4) => x.igst + x.cgst + x.sgst + x.cess;

const fmt = (n: number) => (n === 0 ? '—' : formatIndianCurrency(n));

/* Cell renderers live at module scope so their component identity is stable —
   defined inline they would remount (and drop focus) on every keystroke. */
function EditCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <td className="border-l border-gray-100 p-0">
      <input
        type="number"
        value={value === 0 ? '' : value}
        placeholder="0"
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="h-full w-full min-w-[150px] bg-transparent px-2 py-1.5 text-right font-mono text-[11px] tabular-nums text-gray-800 placeholder:text-gray-300 focus:bg-blue-50/60 focus:outline-none"
      />
    </td>
  );
}

function RoCell({ value, bold = false }: { value: number; bold?: boolean }) {
  return (
    <td className={`min-w-[150px] border-l border-gray-100 px-2 py-1.5 text-right font-mono text-[11px] tabular-nums whitespace-nowrap ${bold ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
      {fmt(value)}
    </td>
  );
}

export default function GSTR3BPage() {
  const { company, companyId, loading: companyLoading } = useCompany();
  const fys = recentFinancialYears(6);
  const [fyLabel, setFyLabel] = useState(fys[0].label);
  const startYear = fys.find((f) => f.label === fyLabel)?.startYear ?? fys[0].startYear;
  const [months, setMonths] = useState<Gstr3bMonthData[]>(() => MONTHS.map(() => emptyGstr3bMonth()));
  const [jsonMonth, setJsonMonth] = useState(0);
  // One switch, three views: one month at a time, one quarter (3 months + total),
  // or the full year (all 12 months + total). The month dropdown drives both the
  // Monthly view and the JSON download; the quarter dropdown appears only in Quarterly.
  const [view, setView] = useState<'month' | 'quarter' | 'year'>('year');
  const [qSel, setQSel] = useState(0);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const loadedRef = useRef(false);
  const saveTimer = useRef<number | undefined>(undefined);

  // Restore the saved matrix for this company + FY.
  useEffect(() => {
    if (!companyId) return;
    loadedRef.current = false;
    const rec = getEntityData(companyId, MODULE_KEY, fyLabel)?.data as { months?: Gstr3bMonthData[] } | undefined;
    setMonths(
      rec?.months?.length === 12
        ? rec.months.map((m) => ({ ...emptyGstr3bMonth(), ...m }))
        : MONTHS.map(() => emptyGstr3bMonth())
    );
    // Let the restore settle before autosave arms itself.
    const t = window.setTimeout(() => { loadedRef.current = true; }, 0);
    return () => window.clearTimeout(t);
  }, [companyId, fyLabel]);

  // Debounced autosave of every edit.
  useEffect(() => {
    if (!companyId || !loadedRef.current) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      upsertEntityData(companyId, MODULE_KEY, fyLabel, { months, savedAt: new Date().toISOString() });
      setSavedAt(new Date());
    }, 800);
    return () => window.clearTimeout(saveTimer.current);
  }, [months, companyId, fyLabel]);

  /* ── Derived balance chain ── */
  const derived = useMemo(() => {
    const z4 = (): Split4 => ({ igst: 0, cgst: 0, sgst: 0, cess: 0 });
    const opening: Split4[] = [];
    const closing: Split4[] = [];
    for (let mi = 0; mi < 12; mi++) {
      const m = months[mi];
      const open = mi === 0 ? { ...m.openItc } : { ...closing[mi - 1] };
      const cl = z4();
      for (const { h } of HEADS) {
        const itc = m.itcNonRcm[h] + m.itcRcm[h];
        const tax = m.taxNonRcm[h] + m.taxRcm[h];
        cl[h] = round2(open[h] + itc - (tax - m.cashOffset[h]));
      }
      opening.push(open);
      closing.push(cl);
    }
    return { opening, closing };
  }, [months]);

  if (companyLoading || !company) {
    return <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const gstin = company.gst_details?.gstin?.trim() ?? '';

  const patch = (mi: number, updater: (m: Gstr3bMonthData) => Gstr3bMonthData) => {
    setMonths((prev) => prev.map((m, i) => (i === mi ? updater(m) : m)));
  };

  /** Fill sales / tax / ITC for all 12 months from the invoice registers.
   *  Manual-only figures (RCM, interest, late fee, opening ITC, cash offset)
   *  are left untouched. */
  const loadFromBooks = () => {
    const sales = companyId ? listInvoicesV2(companyId) : [];
    const purchases = companyId ? listPurchaseInvoices(companyId) : [];
    setMonths((prev) => prev.map((m, mi) => {
      const { year, month } = fyMonth(startYear, mi);
      const { from, to } = calendarMonthRangeIso(year, month);
      const s = computeGSTR3BFromInvoices(
        sales.filter((x) => x.invoice_date >= from && x.invoice_date <= to),
        purchases.filter((x) => x.invoice_date >= from && x.invoice_date <= to),
      );
      return {
        ...m,
        txval31a: round2(s.outwardSupplies.taxableValue),
        taxNonRcm: { igst: round2(s.outwardSupplies.igst), cgst: round2(s.outwardSupplies.cgst), sgst: round2(s.outwardSupplies.sgst), cess: 0 },
        itcNonRcm: {
          igst: round2(s.itcAvailed.igst - s.itcReversed.igst),
          cgst: round2(s.itcAvailed.cgst - s.itcReversed.cgst),
          sgst: round2(s.itcAvailed.sgst - s.itcReversed.sgst),
          cess: 0,
        },
      };
    }));
    toast.success(`Sales, tax and ITC loaded from books for FY ${fyLabel}`);
  };

  const downloadJson = () => {
    if (!gstin) { toast.error('Add your GSTIN in Settings first.'); return; }
    const { year, month } = fyMonth(startYear, jsonMonth);
    const period = toRetPeriodMmYyyy(year, month);
    const data = buildGstr3bSaveJson(gstin, period, months[jsonMonth]);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `GSTR3B_${period}_${gstin}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`GSTR-3B JSON for ${MONTHS[jsonMonth]} ${year} downloaded.`);
  };

  type Row = {
    label: string;
    get: (mi: number) => number;
    set?: (mi: number, v: number) => void;
    total?: number;           // kept for API compatibility; totals use aggValue
    isTotal?: boolean;
    /** How the Total column aggregates this row: sum (default), or the
     *  first/last visible month's value — used by the balance rows. */
    agg?: 'first' | 'last';
  };

  // Visible month columns for the active view — always individual months.
  const visibleMonths: number[] =
    view === 'month' ? [jsonMonth]
    : view === 'quarter' ? [qSel * 3, qSel * 3 + 1, qSel * 3 + 2]
    : MONTHS.map((_, i) => i);

  /** Total-column value across the visible months (opening = first, closing = last). */
  const aggValue = (row: Row, monthIdxs: number[]): number =>
    row.agg === 'first' ? row.get(monthIdxs[0])
    : row.agg === 'last' ? row.get(monthIdxs[monthIdxs.length - 1])
    : monthIdxs.reduce((s, mi) => s + row.get(mi), 0);

  const split4Rows = (
    get: (m: Gstr3bMonthData) => Split4,
    set?: (m: Gstr3bMonthData, h: Head, v: number) => Gstr3bMonthData,
  ): Row[] => [
    ...HEADS.map(({ h, label }): Row => ({
      label,
      get: (mi) => get(months[mi])[h],
      set: set ? (mi, v) => patch(mi, (m) => set(m, h, v)) : undefined,
    })),
    { label: 'Total', get: (mi) => sum4(get(months[mi])), isTotal: true },
  ];

  const sections: { title: string; rows: Row[] }[] = [
    {
      title: 'Sales Summary',
      rows: [
        { label: '3.1(a) - Outward taxable supplies (Other than zero rated, nil rated and exempted)', get: (mi) => months[mi].txval31a, set: (mi, v) => patch(mi, (m) => ({ ...m, txval31a: v })) },
        { label: '3.1(b) - Outward taxable supplies (zero rated)', get: (mi) => months[mi].txval31b, set: (mi, v) => patch(mi, (m) => ({ ...m, txval31b: v })) },
        { label: '3.1(c) - Other outward supplies (nil rated, exempted)', get: (mi) => months[mi].txval31c, set: (mi, v) => patch(mi, (m) => ({ ...m, txval31c: v })) },
        { label: '3.1(e) - Non GST outward supplies', get: (mi) => months[mi].txval31e, set: (mi, v) => patch(mi, (m) => ({ ...m, txval31e: v })) },
        { label: 'Total', get: (mi) => months[mi].txval31a + months[mi].txval31b + months[mi].txval31c + months[mi].txval31e, isTotal: true },
      ],
    },
    {
      title: 'Exempt Nil And Non-GST Inward Supplies',
      rows: [
        { label: '5 - From a supplier under composition scheme, exempt and nil rated supply', get: (mi) => months[mi].inward5Exmp, set: (mi, v) => patch(mi, (m) => ({ ...m, inward5Exmp: v })) },
        { label: '5 - Non GST supply', get: (mi) => months[mi].inward5NonGst, set: (mi, v) => patch(mi, (m) => ({ ...m, inward5NonGst: v })) },
        { label: 'Total', get: (mi) => months[mi].inward5Exmp + months[mi].inward5NonGst, isTotal: true },
      ],
    },
    {
      title: 'Purchase Summary',
      rows: [
        { label: '3.1(d) - Inward supplies (liable to reverse charge)', get: (mi) => months[mi].txval31d, set: (mi, v) => patch(mi, (m) => ({ ...m, txval31d: v })) },
        { label: 'Total', get: (mi) => months[mi].txval31d, isTotal: true },
      ],
    },
    {
      title: 'Opening ITC Balance',
      rows: [
        ...HEADS.map(({ h, label }): Row => ({
          label,
          get: (mi) => derived.opening[mi][h],
          // Only April's opening is a real input; later months carry the chain.
          set: (mi, v) => { if (mi === 0) patch(0, (m) => ({ ...m, openItc: { ...m.openItc, [h]: v } })); },
          total: derived.opening[0][h],
          agg: 'first',
        })),
        { label: 'Total', get: (mi) => sum4(derived.opening[mi]), total: sum4(derived.opening[0]), isTotal: true, agg: 'first' },
      ],
    },
    {
      title: 'Tax Liability (Non Reverse Charge)',
      rows: split4Rows((m) => m.taxNonRcm, (m, h, v) => ({ ...m, taxNonRcm: { ...m.taxNonRcm, [h]: v } })),
    },
    {
      title: 'Tax Liability (Reverse Charge)',
      rows: split4Rows((m) => m.taxRcm, (m, h, v) => ({ ...m, taxRcm: { ...m.taxRcm, [h]: v } })),
    },
    {
      title: 'Tax Liability',
      rows: [{ label: 'Total (Including Reverse Charge)', get: (mi) => sum4(months[mi].taxNonRcm) + sum4(months[mi].taxRcm), isTotal: true }],
    },
    {
      title: 'System computed Interest',
      rows: split4Rows((m) => m.interest, (m, h, v) => ({ ...m, interest: { ...m.interest, [h]: v } })),
    },
    {
      title: 'Late Fee',
      rows: [
        { label: 'IGST', get: () => 0 },
        { label: 'CGST', get: (mi) => months[mi].lateFee.cgst, set: (mi, v) => patch(mi, (m) => ({ ...m, lateFee: { ...m.lateFee, cgst: v } })) },
        { label: 'SGST', get: (mi) => months[mi].lateFee.sgst, set: (mi, v) => patch(mi, (m) => ({ ...m, lateFee: { ...m.lateFee, sgst: v } })) },
        { label: 'Cess', get: () => 0 },
        { label: 'Total', get: (mi) => months[mi].lateFee.cgst + months[mi].lateFee.sgst, isTotal: true },
      ],
    },
    {
      title: 'Input Tax Credit (Non Reverse Charge)',
      rows: split4Rows((m) => m.itcNonRcm, (m, h, v) => ({ ...m, itcNonRcm: { ...m.itcNonRcm, [h]: v } })),
    },
    {
      title: 'Input Tax Credit (Reverse Charge)',
      rows: split4Rows((m) => m.itcRcm, (m, h, v) => ({ ...m, itcRcm: { ...m.itcRcm, [h]: v } })),
    },
    {
      title: 'Input Tax Credit',
      rows: [{ label: 'Total (Including Reverse Charge)', get: (mi) => sum4(months[mi].itcNonRcm) + sum4(months[mi].itcRcm), isTotal: true }],
    },
    {
      title: 'Cash Offset',
      rows: split4Rows((m) => m.cashOffset, (m, h, v) => ({ ...m, cashOffset: { ...m.cashOffset, [h]: v } })),
    },
    {
      title: 'Closing ITC Balance',
      rows: [
        ...HEADS.map(({ h, label }): Row => ({
          label,
          get: (mi) => derived.closing[mi][h],
          total: derived.closing[11][h],
          agg: 'last',
        })),
        { label: 'Total', get: (mi) => sum4(derived.closing[mi]), total: sum4(derived.closing[11]), isTotal: true, agg: 'last' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="GSTR-3B" description="Summary report — month-wise return matrix with portal JSON export">
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-gray-200">
              {([['month', 'Monthly'], ['quarter', 'Quarterly'], ['year', 'Yearly']] as const).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-sm font-semibold transition-colors ${view === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {view === 'month' && (
              <select value={jsonMonth} onChange={(e) => setJsonMonth(Number(e.target.value))} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none">
                {MONTHS.map((label, mi) => (
                  <option key={label} value={mi}>{label} {fyMonth(startYear, mi).year}</option>
                ))}
              </select>
            )}
            {view === 'quarter' && (
              <select value={qSel} onChange={(e) => setQSel(Number(e.target.value))} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none">
                <option value={0}>Q1 (Apr–Jun)</option>
                <option value={1}>Q2 (Jul–Sep)</option>
                <option value={2}>Q3 (Oct–Dec)</option>
                <option value={3}>Q4 (Jan–Mar)</option>
              </select>
            )}
            <select value={fyLabel} onChange={(e) => setFyLabel(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none">
              {fys.map((f) => <option key={f.label} value={f.label}>FY {f.label}</option>)}
            </select>
            <button type="button" onClick={loadFromBooks} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <BookOpen className="h-4 w-4" /> Load from books
            </button>
          </div>
          <div className="flex items-center gap-2">
            {view !== 'month' && (
              <select value={jsonMonth} onChange={(e) => setJsonMonth(Number(e.target.value))} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none">
                {MONTHS.map((label, mi) => {
                  const { year } = fyMonth(startYear, mi);
                  return <option key={label} value={mi}>{label} {year}</option>;
                })}
              </select>
            )}
            <button type="button" onClick={downloadJson} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
              <FileDown className="h-4 w-4" /> Download JSON{view === 'month' ? ` — ${MONTHS[jsonMonth]}` : ''}
            </button>
          </div>
        </div>
      </PageHeader>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50/60 px-4 py-2.5">
          <p className="text-xs font-semibold text-gray-700">
            Name: <span className="text-gray-900">{company.name}</span>
            <span className="mx-2 text-gray-300">|</span>
            GSTIN: <span className="font-mono text-gray-900">{gstin || '—'}</span>
          </p>
          <div className="flex items-center gap-3">
            {savedAt && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-green-600">
                <CheckCircle className="h-3 w-3" /> Saved {savedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              GSTR-3B Summary Report ({startYear}-{startYear + 1}) · {view === 'month' ? `${MONTHS[jsonMonth]} ${fyMonth(startYear, jsonMonth).year}` : view === 'quarter' ? `Q${qSel + 1}` : 'Full Year'}
            </p>
          </div>
        </div>

        {view !== 'month' && (
          <div className="border-b border-blue-100 bg-blue-50/60 px-4 py-1.5 text-[11px] text-blue-700">
            Total column sums the {view === 'quarter' ? 'quarter' : 'year'} — except Opening ITC (period&apos;s opening balance) and Closing ITC (period&apos;s closing balance).
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-gray-100/80 text-gray-600">
                <th className="sticky left-0 z-10 min-w-[130px] border-b border-gray-200 bg-gray-100 px-3 py-2 text-left font-bold uppercase tracking-wider">Section</th>
                <th className="sticky left-[130px] z-10 min-w-[260px] border-b border-gray-200 bg-gray-100 px-3 py-2 text-left font-bold uppercase tracking-wider">Particulars</th>
                {visibleMonths.map((mi) => (
                  <th key={mi} className="min-w-[150px] border-b border-l border-gray-200 px-2 py-2 text-right font-bold whitespace-nowrap">
                    {MONTHS[mi]} {fyMonth(startYear, mi).year}
                  </th>
                ))}
                {view !== 'month' && (
                  <th className="min-w-[150px] border-b border-l-2 border-gray-300 px-2 py-2 text-right font-bold whitespace-nowrap">
                    {view === 'quarter' ? 'Quarter Total' : 'FY Total'}
                  </th>
                )}
              </tr>
            </thead>
            {sections.map((sec) => (
              <tbody key={sec.title} className="border-t-2 border-gray-200">
                {sec.rows.map((row, ri) => (
                  <tr key={row.label + ri} className={row.isTotal ? 'bg-gray-50 font-semibold' : 'hover:bg-blue-50/20'}>
                    {ri === 0 && (
                      <td rowSpan={sec.rows.length} className="sticky left-0 z-10 w-[130px] border-b border-gray-100 bg-white px-3 py-1.5 align-top text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        {sec.title}
                      </td>
                    )}
                    <td className="sticky left-[130px] z-10 border-b border-gray-100 bg-white px-3 py-1.5 text-gray-700">{row.label}</td>
                    {visibleMonths.map((mi) =>
                      row.set && !row.isTotal && !(sec.title === 'Opening ITC Balance' && mi > 0)
                        ? <EditCell key={mi} value={row.get(mi)} onChange={(v) => row.set!(mi, v)} />
                        : <RoCell key={mi} value={row.get(mi)} bold={!!row.isTotal} />
                    )}
                    {view !== 'month' && (
                      <td className={`min-w-[150px] border-b border-gray-100 border-l-2 border-l-gray-300 px-2 py-1.5 text-right font-mono tabular-nums whitespace-nowrap ${row.isTotal ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                        {fmt(aggValue(row, visibleMonths))}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-800">
        <p className="font-semibold">Portal JSON mapping</p>
        <p className="mt-1">
          Download JSON produces the official GSTR-3B save payload for the selected month — <span className="font-mono">sup_details</span> (3.1 a–e),
          <span className="font-mono"> itc_elg</span> (non-RCM → OTH, RCM → ISRC), <span className="font-mono">inward_sup</span> (Table 5) and
          <span className="font-mono"> intr_ltfee</span> (interest + late fee). Opening ITC, Cash Offset and Closing ITC are report-only balance rows;
          the payment section (<span className="font-mono">tx_pmt</span>) is computed by the portal at offset time and is not part of a prepared upload.
        </p>
      </div>
    </div>
  );
}
