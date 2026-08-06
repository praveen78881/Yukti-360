// ITR data-import modal.
//   'portal'  → extract structured data straight from the client's Form 16 & Form 26AS
//               PDFs via Sandbox OCR (app-key auth — NO ERI / portal login needed).
//               AIS / TIS are attached (no OCR endpoint) for reference.
//   'offline' → attach the files the CA downloaded from the portal.

import { useState } from 'react';
import { toast } from 'sonner';
import { X, Cloud, FolderInput, Loader2, CheckCircle2, FileUp, FileText } from 'lucide-react';
import type { Company } from '@/types/company';
import { itrClient, fileToBase64 } from '@/lib/itr/client';

export type ImportMode = 'portal' | 'offline';

interface Props {
  open: boolean;
  mode: ImportMode;
  onClose: () => void;
  company: Company;
  ay: string;
  getWin: () => Window | null | undefined;
}

interface Extract { name?: string; pan?: string; fy?: string; totalTds?: number; rows?: number; label: string; }

/** Pull a compact summary out of the OCR payload (shapes differ per document). */
function summarise(doc: 'form16' | 'form26as', data: any): Extract {
  const d = data?.data ?? data ?? {};
  if (doc === 'form26as') {
    const parts = Array.isArray(d['Part I']) ? d['Part I'] : [];
    let rows = 0, tds = 0;
    for (const p of parts) for (const r of (p?.deduction_wise || [])) {
      if (Array.isArray(r) && typeof r[r.length - 1] === 'number') { rows++; tds += Number(r[r.length - 1]) || 0; }
    }
    return { label: 'Form 26AS', name: d.name, pan: d.pan, fy: d.financial_year, rows, totalTds: tds };
  }
  const partA = d['Part A'] || {};
  const tdsRows = Array.isArray(partA.tds) ? partA.tds.filter((r: any) => Array.isArray(r) && typeof r[r.length - 1] === 'number') : [];
  const tds = tdsRows.reduce((a: number, r: any) => a + (Number(r[r.length - 1]) || 0), 0);
  return { label: 'Form 16', name: d.name || d.employee_name, pan: d.pan || d.employee_pan, rows: tdsRows.length, totalTds: tds };
}

const inr = (n?: number) => (n == null ? '—' : `₹${n.toLocaleString('en-IN')}`);

export function ImportItrModal({ open, mode, onClose, company, ay }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [f16pwd, setF16pwd] = useState('');
  const [results, setResults] = useState<Record<string, Extract>>({});
  const [attached, setAttached] = useState<Record<string, string>>({});

  if (!open) return null;

  const runOcr = async (doc: 'form16' | 'form26as', file: File) => {
    setBusy(doc);
    try {
      const b64 = await fileToBase64(file);
      const r = doc === 'form16'
        ? await itrClient.ocrForm16(b64, file.name, f16pwd || undefined)
        : await itrClient.ocrForm26as(b64, file.name);
      if (!r.ok) { toast.error(r.error || `${doc === 'form16' ? 'Form 16' : 'Form 26AS'} could not be read.`); return; }
      const ex = summarise(doc, r.data);
      setResults((p) => ({ ...p, [doc]: ex }));
      toast.success(`${ex.label} imported — ${ex.rows ?? 0} TDS entr${ex.rows === 1 ? 'y' : 'ies'}, ${inr(ex.totalTds)} deducted.`);
    } catch (e: any) { toast.error(e?.message || 'Extraction failed.'); }
    finally { setBusy(null); }
  };

  const OcrCard = ({ doc, title, hint }: { doc: 'form16' | 'form26as'; title: string; hint: string }) => {
    const ex = results[doc];
    return (
      <div className="rounded-xl border border-gray-200 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-blue-600" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800">{title}</p>
              <p className="truncate text-[10px] text-gray-400">{hint}</p>
            </div>
          </div>
          <label className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${ex ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
            {busy === doc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : ex ? <CheckCircle2 className="h-3.5 w-3.5" /> : <FileUp className="h-3.5 w-3.5" />}
            {busy === doc ? 'Reading…' : ex ? 'Replace' : 'Upload PDF'}
            <input type="file" accept=".pdf" className="hidden" disabled={busy === doc}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) runOcr(doc, f); }} />
          </label>
        </div>
        {doc === 'form16' && !ex && (
          <input value={f16pwd} onChange={(e) => setF16pwd(e.target.value)} placeholder="PDF password (if any)"
            className="mt-2 block w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none" />
        )}
        {ex && (
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-gray-50 px-3 py-2 text-[11px]">
            {ex.name && <div><span className="text-gray-400">Name</span> <b className="text-gray-800">{ex.name}</b></div>}
            {ex.pan && <div><span className="text-gray-400">PAN</span> <b className="font-mono text-gray-800">{ex.pan}</b></div>}
            {ex.fy && <div><span className="text-gray-400">FY</span> <b className="text-gray-800">{ex.fy}</b></div>}
            <div><span className="text-gray-400">TDS entries</span> <b className="text-gray-800">{ex.rows ?? 0}</b></div>
            <div className="col-span-2"><span className="text-gray-400">Total tax deducted</span> <b className="text-gray-900">{inr(ex.totalTds)}</b></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-blue-700 to-indigo-600 px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            {mode === 'portal' ? <Cloud className="h-5 w-5 text-blue-200" /> : <FolderInput className="h-5 w-5 text-blue-200" />}
            <div>
              <h3 className="text-sm font-bold leading-tight">{mode === 'portal' ? 'Import from Portal' : 'Import (Offline)'}</h3>
              <p className="text-[11px] text-blue-200">{company.name} · A.Y. {ay}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-blue-100 hover:bg-white/10" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-2.5 px-5 py-4">
          {mode === 'portal' ? (
            <>
              <OcrCard doc="form16" title="Form 16 / 16A" hint="Salary TDS certificate → auto-read TDS & salary" />
              <OcrCard doc="form26as" title="Form 26AS" hint="Annual tax statement → auto-read tax credits" />
              <div className="grid grid-cols-2 gap-2.5">
                {[{ k: 'ais', l: 'AIS' }, { k: 'tis', l: 'TIS' }].map((s) => (
                  <label key={s.k} className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800">{s.l}</p>
                      <p className="truncate text-[10px] text-gray-400">{attached[s.k] ? attached[s.k] : 'Attach'}</p>
                    </div>
                    {attached[s.k] ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <FileUp className="h-4 w-4 shrink-0 text-blue-600" />}
                    <input type="file" accept=".json,.csv,.pdf" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAttached((p) => ({ ...p, [s.k]: f.name })); toast.success(`${s.l} attached.`); } }} />
                  </label>
                ))}
              </div>
            </>
          ) : (
            <>
              {[
                { key: 'ais', label: 'AIS (Annual Information Statement)' },
                { key: 'tis', label: 'TIS (Taxpayer Information Summary)' },
                { key: 'f26as', label: 'Form 26AS' },
                { key: 'f16', label: 'Form 16 / 16A' },
                { key: 'json', label: 'ITR JSON (saved draft)' },
              ].map((s) => (
                <label key={s.key} className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-gray-800">{s.label}</p>
                    <p className="truncate text-[10px] text-gray-400">{attached[s.key] ? `Loaded: ${attached[s.key]}` : 'Upload'}</p>
                  </div>
                  {attached[s.key] ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <FileUp className="h-4 w-4 shrink-0 text-blue-600" />}
                  <input type="file" accept=".json,.csv,.pdf,.txt" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAttached((p) => ({ ...p, [s.key]: f.name })); toast.success(`${f.name} attached.`); } }} />
                </label>
              ))}
            </>
          )}
        </div>

        <div className="flex items-center justify-end rounded-b-2xl border-t border-gray-100 bg-gray-50 px-5 py-3">
          <button onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">Done</button>
        </div>
      </div>
    </div>
  );
}
