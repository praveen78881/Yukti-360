import { useEffect, useState } from 'react';
import {
  emptyStockItem, saveStockItem, UQC_UNITS, GST_RATES, TAXABILITY_TYPES,
  type StockItem, type GstApplicability, type TaxabilityType, type TypeOfSupply,
} from '@/lib/inventory/itemMaster';

/* Stock Item Creation — the item-master form: name, units, and the statutory
   details (GST applicability, HSN/SAC + description, taxability + GST rate,
   type of supply, rate of duty), rendered in the app's own UI. */

interface Props {
  companyId: string;
  item: StockItem | null;      // null = create; otherwise edit
  onClose: () => void;
  onSaved: () => void;
}

const inputCls =
  'h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400';

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-gray-500">{label}</span>
      {children}
      {hint && <span className="mt-0.5 block text-[10px] text-gray-400">{hint}</span>}
    </label>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return <p className="col-span-full mt-1 text-[11px] font-bold uppercase tracking-widest text-gray-500">{children}</p>;
}

export function StockItemModal({ companyId, item, onClose, onSaved }: Props) {
  const [form, setForm] = useState<StockItem>(() => item ?? emptyStockItem());
  useEffect(() => { setForm(item ?? emptyStockItem()); }, [item]);

  const set = <K extends keyof StockItem>(k: K, v: StockItem[K]) => setForm((f) => ({ ...f, [k]: v }));

  const gstOn = form.gstApplicability === 'Applicable';

  const canSave = form.name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    saveStockItem(companyId, { ...form, name: form.name.trim() });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <div
        className="ca-modal-panel flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <span className="text-sm font-semibold text-gray-800">{item ? 'Alter Stock Item' : 'Stock Item Creation'}</span>
          <button onClick={onClose} className="rounded-md p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Identity */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Name *">
              <input autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="Stock item name" />
            </Field>
            <Field label="Units">
              <select value={form.units} onChange={(e) => set('units', e.target.value)} className={inputCls}>
                {UQC_UNITS.map((u) => (
                  <option key={u.name} value={u.name}>{u.code ? `${u.name} — ${u.code}` : u.name}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Statutory Details */}
          <div className="mt-5 rounded-xl border border-gray-200 p-4">
            <p className="mb-3 text-sm font-bold text-gray-800">Statutory Details</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="GST applicability">
                <select value={form.gstApplicability} onChange={(e) => set('gstApplicability', e.target.value as GstApplicability)} className={inputCls}>
                  <option>Applicable</option>
                  <option>Not Applicable</option>
                </select>
              </Field>
              <div className="hidden sm:block" />

              <SubHead>HSN/SAC &amp; Related Details</SubHead>
              <Field label="HSN/SAC">
                <input disabled={!gstOn} value={form.hsnCode} onChange={(e) => set('hsnCode', e.target.value)} className={inputCls} placeholder="e.g. 9983" />
              </Field>
              <Field label="Description">
                <input disabled={!gstOn} value={form.hsnDescription} onChange={(e) => set('hsnDescription', e.target.value)} className={inputCls} />
              </Field>

              <SubHead>GST Rate &amp; Related Details</SubHead>
              <Field label="Taxability Type">
                <select disabled={!gstOn} value={form.taxabilityType} onChange={(e) => set('taxabilityType', e.target.value as TaxabilityType)} className={inputCls}>
                  <option value="">(Select)</option>
                  {TAXABILITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="GST Rate (%)">
                <select disabled={!gstOn} value={String(form.gstRate)} onChange={(e) => set('gstRate', Number(e.target.value))} className={inputCls}>
                  {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                </select>
              </Field>

              <Field label="Type of Supply">
                <select value={form.typeOfSupply} onChange={(e) => set('typeOfSupply', e.target.value as TypeOfSupply)} className={inputCls}>
                  <option>Goods</option>
                  <option>Services</option>
                </select>
              </Field>
              <Field label="Rate of Duty (eg 5)">
                <input value={form.rateOfDuty} onChange={(e) => set('rateOfDuty', e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button onClick={onClose} className="h-9 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="h-9 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {item ? 'Save' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}
