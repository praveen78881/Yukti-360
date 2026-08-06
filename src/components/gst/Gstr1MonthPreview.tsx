'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { getSessionToken } from '@/lib/gst/sandbox/store';
import { fetchGstr1MonthDetail, type FiledSection } from '@/lib/gst/sandbox/gstr1FiledDetail';

const money = (n?: number) => (n && n !== 0 ? formatIndianCurrency(n) : '—');

export function Gstr1MonthPreview({ gstin, year, month, secNames }: { gstin: string; year: string; month: string; secNames: string[] }) {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<FiledSection[]>([]);
  const [active, setActive] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError('');
      const token = getSessionToken(gstin);
      if (!token) { setError('Session expired — reconnect and re-import.'); setLoading(false); return; }
      try {
        const res = await fetchGstr1MonthDetail(year, month, token, secNames);
        if (!alive) return;
        setSections(res);
        setActive(res[0]?.key ?? '');
      } catch (e: any) {
        if (alive) setError(e?.message || 'Could not load section detail');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [gstin, year, month, secNames.join(',')]);

  const current = useMemo(() => sections.find((s) => s.key === active), [sections, active]);

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-500"><Loader2 className="h-4 w-4 animate-spin text-blue-600" /> Loading invoices…</div>;
  }
  if (error) return <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">{error}</div>;
  if (!sections.length) return <div className="px-3 py-4 text-center text-xs text-gray-400">No invoice-level detail available for this period.</div>;

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Section tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-100 p-2">
        {sections.map((s) => (
          <button key={s.key} type="button" onClick={() => setActive(s.key)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${s.key === active ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            {s.label} <span className={s.key === active ? 'text-blue-100' : 'text-gray-400'}>· {s.rows.length}</span>
          </button>
        ))}
      </div>

      <div className="max-h-[440px] overflow-auto">
        {current?.kind === 'hsn' ? (
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wide text-gray-500">
                <th className="px-2 py-1.5 text-left font-semibold">HSN/SAC</th>
                <th className="px-2 py-1.5 text-left font-semibold">Description</th>
                <th className="px-2 py-1.5 text-left font-semibold">UQC</th>
                <th className="px-2 py-1.5 text-right font-semibold">Qty</th>
                <th className="px-2 py-1.5 text-right font-semibold">Rate</th>
                <th className="px-2 py-1.5 text-right font-semibold">Taxable</th>
                <th className="px-2 py-1.5 text-right font-semibold">IGST</th>
                <th className="px-2 py-1.5 text-right font-semibold">CGST</th>
                <th className="px-2 py-1.5 text-right font-semibold">SGST</th>
                <th className="px-2 py-1.5 text-right font-semibold">Cess</th>
              </tr>
            </thead>
            <tbody>
              {current.rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-blue-50/30">
                  <td className="px-2 py-1 font-mono text-[12px]">{r.hsn}</td>
                  <td className="px-2 py-1 max-w-[240px] truncate text-gray-600" title={r.desc}>{r.desc}</td>
                  <td className="px-2 py-1 text-gray-500">{r.uqc}</td>
                  <td className="px-2 py-1 text-right font-mono">{r.qty ?? '—'}</td>
                  <td className="px-2 py-1 text-right">{r.rate != null ? `${r.rate}%` : '—'}</td>
                  <td className="px-2 py-1 text-right font-mono">{money(r.taxable)}</td>
                  <td className="px-2 py-1 text-right font-mono">{money(r.igst)}</td>
                  <td className="px-2 py-1 text-right font-mono">{money(r.cgst)}</td>
                  <td className="px-2 py-1 text-right font-mono">{money(r.sgst)}</td>
                  <td className="px-2 py-1 text-right font-mono">{money(r.cess)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wide text-gray-500">
                <th className="px-2 py-1.5 text-left font-semibold">GSTIN / Party</th>
                <th className="px-2 py-1.5 text-left font-semibold">Doc No.</th>
                <th className="px-2 py-1.5 text-left font-semibold">Date</th>
                <th className="px-2 py-1.5 text-left font-semibold">Type</th>
                <th className="px-2 py-1.5 text-left font-semibold">POS</th>
                <th className="px-2 py-1.5 text-right font-semibold">Rate</th>
                <th className="px-2 py-1.5 text-right font-semibold">Taxable</th>
                <th className="px-2 py-1.5 text-right font-semibold">IGST</th>
                <th className="px-2 py-1.5 text-right font-semibold">CGST</th>
                <th className="px-2 py-1.5 text-right font-semibold">SGST</th>
                <th className="px-2 py-1.5 text-right font-semibold">Cess</th>
                <th className="px-2 py-1.5 text-right font-semibold">Value</th>
              </tr>
            </thead>
            <tbody>
              {current?.rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-blue-50/30">
                  <td className="px-2 py-1 font-mono text-[12px]">{r.party || '—'}</td>
                  <td className="px-2 py-1 font-medium">{r.doc || '—'}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-gray-500">{r.date || '—'}</td>
                  <td className="px-2 py-1 text-gray-500">{r.type || '—'}</td>
                  <td className="px-2 py-1 text-gray-500">{r.pos || '—'}</td>
                  <td className="px-2 py-1 text-right">{r.rate != null ? `${r.rate}%` : '—'}</td>
                  <td className="px-2 py-1 text-right font-mono">{money(r.taxable)}</td>
                  <td className="px-2 py-1 text-right font-mono">{money(r.igst)}</td>
                  <td className="px-2 py-1 text-right font-mono">{money(r.cgst)}</td>
                  <td className="px-2 py-1 text-right font-mono">{money(r.sgst)}</td>
                  <td className="px-2 py-1 text-right font-mono">{money(r.cess)}</td>
                  <td className="px-2 py-1 text-right font-mono font-semibold">{money(r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
