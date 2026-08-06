'use client';

// Shared, ultra-compact UI kit for the reconstructed GSTR-1 sections.
// - EntryDrawer: right slide-over for add/edit (replaces the cramped inline panel)
// - Icon actions: recognisable symbols instead of chunky buttons
// - Compact table + form primitives, minimal section header
// Built once, used by every section. No coupling to the GSTR-1 data model.

import { useEffect, type ReactNode } from 'react';
import {
  Plus, Pencil, Trash2, Download, Upload, Check, X, Search, Loader2, Send,
} from 'lucide-react';

// ── Icon action button (compact, tooltip via title) ─────────────────────────
type Tone = 'default' | 'primary' | 'danger' | 'success';
const toneCls: Record<Tone, string> = {
  default: 'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
  primary: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
  danger: 'text-red-400 hover:text-red-600 hover:bg-red-50',
  success: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
};

export function IconBtn({
  icon, title, onClick, tone = 'default', disabled, busy,
}: { icon: ReactNode; title: string; onClick?: () => void; tone?: Tone; disabled?: boolean; busy?: boolean }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} disabled={disabled || busy}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:opacity-40 ${toneCls[tone]}`}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
    </button>
  );
}

// Named icon shortcuts (16px)
export const Icons = {
  add: <Plus className="h-4 w-4" />,
  edit: <Pencil className="h-3.5 w-3.5" />,
  del: <Trash2 className="h-3.5 w-3.5" />,
  import: <Download className="h-4 w-4" />,
  file: <Send className="h-4 w-4" />,
  upload: <Upload className="h-4 w-4" />,
  search: <Search className="h-4 w-4" />,
};

// ── Minimal section header: name · count, right-aligned icon actions ─────────
export function SectionBar({ title, sub, count, actions }: { title: string; sub?: string; count?: number; actions?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <div className="flex items-baseline gap-2 min-w-0">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {typeof count === 'number' && <span className="rounded-full bg-gray-100 px-1.5 text-[10px] font-semibold text-gray-500">{count}</span>}
        {sub && <span className="truncate text-[11px] text-gray-400">{sub}</span>}
      </div>
      <div className="flex items-center gap-0.5">{actions}</div>
    </div>
  );
}

// ── Compact table cells ──────────────────────────────────────────────────────
export function Th({ ch, right, w }: { ch?: string; right?: boolean; w?: string }) {
  return <th style={w ? { width: w } : undefined}
    className={`whitespace-nowrap bg-gray-50 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 ${right ? 'text-right' : 'text-left'}`}>{ch}</th>;
}
export function Td({ children, mono, right, dim }: { children: ReactNode; mono?: boolean; right?: boolean; dim?: boolean }) {
  return <td className={`border-b border-gray-100 px-2 py-1 text-[13px] ${mono ? 'font-mono tabular-nums' : ''} ${right ? 'text-right' : ''} ${dim ? 'text-gray-400' : 'text-gray-700'}`}>{children}</td>;
}

// ── Slide-over entry drawer ──────────────────────────────────────────────────
export function EntryDrawer({
  open, title, onClose, onSave, saveLabel = 'Save', canSave = true, children, busy,
}: {
  open: boolean; title: string; onClose: () => void; onSave: () => void;
  saveLabel?: string; canSave?: boolean; children: ReactNode; busy?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {/* backdrop */}
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-slate-900/20 transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      {/* panel */}
      <div className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-200 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <IconBtn icon={<X className="h-4 w-4" />} title="Close" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-4 py-3">
          <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
          <button type="button" onClick={onSave} disabled={!canSave || busy} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} {saveLabel}
          </button>
        </div>
      </div>
    </>
  );
}

// Grouped block inside the drawer (● PARTY, ● INVOICE, ● TAX …)
export function DrawerGroup({ label, children, cols = 2 }: { label: string; children: ReactNode; cols?: 1 | 2 }) {
  return (
    <div className="mb-4">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />{label}
      </p>
      <div className={`grid gap-3 ${cols === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>{children}</div>
    </div>
  );
}

// ── Drawer form controls (roomier than table cells) ──────────────────────────
export function Field({ label, children, hint, full }: { label: string; children: ReactNode; hint?: ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="mb-0.5 block text-[11px] font-medium text-gray-500">{label}</label>
      {children}
      {hint && <p className="mt-0.5 text-[10px] text-gray-400">{hint}</p>}
    </div>
  );
}
const inputCls = 'w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
export function TextField({ value, onChange, placeholder, mono, right, upper }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean; right?: boolean; upper?: boolean }) {
  return <input value={value} onChange={(e) => onChange(upper ? e.target.value.toUpperCase() : e.target.value)} placeholder={placeholder}
    className={`${inputCls} ${mono ? 'font-mono' : ''} ${right ? 'text-right' : ''}`} />;
}
export function NumField({ value, onChange, placeholder }: { value: string | number; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value === 0 ? '' : value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" placeholder={placeholder ?? '0'} className={`${inputCls} text-right font-mono`} />;
}
export function SelectField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}

// Native date field that speaks DD-MM-YYYY to the model.
export function DateField({ value, onChange }: { value: string; onChange: (ddmmyyyy: string) => void }) {
  const iso = /^\d{2}-\d{2}-\d{4}$/.test(value) ? value.split('-').reverse().join('-') : '';
  return (
    <input type="date" value={iso} onChange={(e) => {
      const v = e.target.value; // YYYY-MM-DD
      onChange(v ? v.split('-').reverse().join('-') : '');
    }} className={inputCls} />
  );
}
