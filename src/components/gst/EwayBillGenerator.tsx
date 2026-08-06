'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Truck, Loader2, Plus, Trash2, Search, FileCheck2, AlertTriangle, Settings, RefreshCw } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { sandboxClient } from '@/lib/gst/sandbox/client';
import { getEwbToken, setEwbToken, saveEwbBill, type EwbRecord } from '@/lib/gst/sandbox/ewb';
import { describeEwbError } from '@/lib/gst/sandbox/ewbErrors';

// ── Option lists ────────────────────────────────────────────────────────────
const SUB_SUPPLY = [
  { v: '1', l: 'Supply' }, { v: '3', l: 'Export' }, { v: '4', l: 'Job Work' },
  { v: '5', l: 'For Own Use' }, { v: '7', l: 'Sales Return' }, { v: '8', l: 'Others' },
];
const DOC_TYPE = [
  { v: 'INV', l: 'Tax Invoice' }, { v: 'BIL', l: 'Bill of Supply' },
  { v: 'BOE', l: 'Bill of Entry' }, { v: 'CHL', l: 'Delivery Challan' }, { v: 'OTH', l: 'Others' },
];
const TXN_TYPE = [
  { v: '1', l: 'Regular' }, { v: '2', l: 'Bill To - Ship To' },
  { v: '3', l: 'Bill From - Dispatch From' }, { v: '4', l: 'Combination' },
];
const TRANS_MODE = [{ v: '1', l: 'Road' }, { v: '2', l: 'Rail' }, { v: '3', l: 'Air' }, { v: '4', l: 'Ship' }];
const VEHICLE_TYPE = [{ v: 'R', l: 'Regular' }, { v: 'O', l: 'Over-Dimensional Cargo' }];
const UQC = ['NOS', 'PCS', 'BAG', 'BOX', 'KGS', 'LTR', 'MTR', 'QTL', 'ROL', 'SET', 'TON', 'UNT'];

const todayDDMMYYYY = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
const num = (v: string | number) => (typeof v === 'number' ? v : parseFloat(v) || 0);

interface Item {
  productName: string; hsnCode: string; quantity: string; qtyUnit: string;
  taxableAmount: string; rate: string; cessRate: string;
}
const blankItem = (): Item => ({ productName: '', hsnCode: '', quantity: '1', qtyUnit: 'NOS', taxableAmount: '', rate: '18', cessRate: '0' });

// ── Small field primitives ──────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-0.5 block text-[11px] font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}
function In({ value, onChange, placeholder, right, readOnly }: { value: string; onChange: (v: string) => void; placeholder?: string; right?: boolean; readOnly?: boolean }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly}
      className={`w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${right ? 'text-right font-mono' : ''} ${readOnly ? 'bg-gray-50 text-gray-500' : ''}`} />
  );
}
function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none">
      {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

export function EwayBillGenerator({ onGenerated }: { onGenerated?: () => void }) {
  const { company, companyId } = useCompany();
  const gstin = (company?.gst_details?.gstin || '').trim();
  const ewbUser = (company?.gst_details?.ewbUsername || '').trim();
  const ewbPass = (company?.gst_details?.ewbPassword || '').trim();
  const settingsPath = companyId ? `/company/${companyId}/settings` : '#';

  // ── Silent EWB session (credentials come from Settings) ──
  const [connected, setConnected] = useState<boolean>(() => !!(gstin && getEwbToken(gstin)));
  const [connecting, setConnecting] = useState(false);
  const [connError, setConnError] = useState('');

  const doConnect = useCallback(async () => {
    if (!gstin || !ewbUser || !ewbPass) return;
    setConnecting(true);
    setConnError('');
    const r = await sandboxClient.ewbAuth(gstin, ewbUser, ewbPass);
    setConnecting(false);
    const token = r.data?.ewbToken;
    if (!r.ok || !token) {
      setConnError('Could not connect to the e-Way Bill portal. Please check the credentials in Settings.');
      setConnected(false);
      return;
    }
    setEwbToken(gstin, token, r.data?.expiry);
    setConnected(true);
  }, [gstin, ewbUser, ewbPass]);

  useEffect(() => {
    if (!gstin) return;
    if (getEwbToken(gstin)) { setConnected(true); return; }
    if (ewbUser && ewbPass) doConnect();
  }, [gstin, ewbUser, ewbPass, doConnect]);

  // ── Form ──
  const [subSupplyType, setSubSupplyType] = useState('1');
  const [subSupplyDesc, setSubSupplyDesc] = useState('');
  const [docType, setDocType] = useState('INV');
  const [docNo, setDocNo] = useState('');
  const [docDate, setDocDate] = useState(todayDDMMYYYY());
  const [transactionType, setTransactionType] = useState('1');

  const [fromTrdName, setFromTrdName] = useState(company?.name || '');
  const [fromAddr1, setFromAddr1] = useState(company?.entity_details?.address || '');
  const [fromPlace, setFromPlace] = useState('');
  const [fromPincode, setFromPincode] = useState('');

  const [toGstin, setToGstin] = useState('');
  const [toTrdName, setToTrdName] = useState('');
  const [toAddr1, setToAddr1] = useState('');
  const [toPlace, setToPlace] = useState('');
  const [toPincode, setToPincode] = useState('');
  const [toStateManual, setToStateManual] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  const [items, setItems] = useState<Item[]>([blankItem()]);

  const [transporterId, setTransporterId] = useState('');
  const [transMode, setTransMode] = useState('1');
  const [transDistance, setTransDistance] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicleType, setVehicleType] = useState('R');

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; ewbNo?: string; validUpto?: string; ewbDate?: string; message?: string } | null>(null);

  const fromStateCode = gstin ? parseInt(gstin.slice(0, 2), 10) : 0;
  const toStateCode = /^[0-9]{2}/.test(toGstin) ? parseInt(toGstin.slice(0, 2), 10) : parseInt(toStateManual, 10) || 0;
  const interState = fromStateCode > 0 && toStateCode > 0 && fromStateCode !== toStateCode;

  const totals = useMemo(() => {
    let taxable = 0, igst = 0, cgst = 0, sgst = 0, cess = 0;
    for (const it of items) {
      const t = num(it.taxableAmount); const r = num(it.rate); const cr = num(it.cessRate);
      taxable += t;
      cess += Math.round((t * cr) / 100 * 100) / 100;
      if (interState) igst += Math.round((t * r) / 100 * 100) / 100;
      else { cgst += Math.round((t * r) / 200 * 100) / 100; sgst += Math.round((t * r) / 200 * 100) / 100; }
    }
    const totInv = Math.round((taxable + igst + cgst + sgst + cess) * 100) / 100;
    return { taxable, igst, cgst, sgst, cess, totInv };
  }, [items, interState]);

  const lookupRecipient = async () => {
    const g = toGstin.trim().toUpperCase();
    if (!/^[0-9]{2}[A-Z0-9]{13}$/.test(g)) { toast.error('Enter a valid 15-character recipient GSTIN'); return; }
    setLookingUp(true);
    const r = await sandboxClient.gstinSearch(g);
    setLookingUp(false);
    const d = r.data?.data?.data || r.data?.data;
    if (!r.ok || !d) { toast.error(r.error || 'Recipient not found'); return; }
    setToTrdName(d.tradeNam || d.lgnm || '');
    const addr = d.pradr?.addr;
    if (addr) { setToAddr1([addr.bno, addr.st].filter(Boolean).join(', ')); setToPlace(addr.loc || addr.dst || ''); setToPincode(addr.pncd || ''); }
    toast.success(`Recipient: ${d.tradeNam || d.lgnm}`);
  };

  const setItem = (i: number, patch: Partial<Item>) => setItems((xs) => xs.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const addItem = () => setItems((xs) => [...xs, blankItem()]);
  const removeItem = (i: number) => setItems((xs) => (xs.length > 1 ? xs.filter((_, j) => j !== i) : xs));

  const generate = async () => {
    const token = getEwbToken(gstin);
    if (!token) { toast.error('e-Way Bill portal is not connected'); setConnected(false); return; }
    if (!docNo.trim()) { toast.error('Document number is required'); return; }
    if (!toStateCode) { toast.error('Recipient GSTIN or state code is required'); return; }
    if (!items.some((it) => it.productName.trim() && num(it.taxableAmount) > 0)) { toast.error('Add at least one item with a taxable amount'); return; }
    if (!transDistance.trim()) { toast.error('Transport distance (km) is required'); return; }
    if (transMode === '1' && !vehicleNo.trim()) { toast.error('Vehicle number is required for road transport'); return; }

    const bill: Record<string, unknown> = {
      supplyType: 'O', subSupplyType, subSupplyDesc: subSupplyType === '8' ? subSupplyDesc : '',
      docType, docNo: docNo.trim(), docDate,
      fromGstin: gstin, fromTrdName, fromAddr1, fromAddr2: '', fromPlace,
      fromPincode: num(fromPincode), actFromStateCode: fromStateCode, fromStateCode,
      toGstin: toGstin.trim() || 'URP', toTrdName, toAddr1, toAddr2: '', toPlace,
      toPincode: num(toPincode), actToStateCode: toStateCode, toStateCode,
      transactionType: num(transactionType), otherValue: 0,
      totalValue: totals.taxable, cgstValue: totals.cgst, sgstValue: totals.sgst, igstValue: totals.igst,
      cessValue: totals.cess, cessNonAdvolValue: 0, totInvValue: totals.totInv,
      transporterId: transporterId.trim(), transporterName: '', transDocNo: '', transDocDate: '',
      transMode, transDistance, vehicleNo: vehicleNo.trim().toUpperCase(), vehicleType,
      itemList: items.filter((it) => it.productName.trim()).map((it) => ({
        productName: it.productName, productDesc: it.productName,
        hsnCode: num(it.hsnCode), quantity: num(it.quantity), qtyUnit: it.qtyUnit,
        cgstRate: interState ? 0 : num(it.rate) / 2, sgstRate: interState ? 0 : num(it.rate) / 2,
        igstRate: interState ? num(it.rate) : 0, cessRate: num(it.cessRate), cessNonadvol: 0,
        taxableAmount: num(it.taxableAmount),
      })),
    };

    setGenerating(true);
    setResult(null);
    const r = await sandboxClient.ewbGenerate(token, bill);
    setGenerating(false);

    const d: any = r.data?.data ?? r.data;
    const ewbNo = d?.ewayBillNo || d?.ewbNo || d?.EwbNo;
    if (r.ok && ewbNo) {
      const rec: EwbRecord = {
        ewbNo: String(ewbNo), ewbDate: d.ewayBillDate || '', validUpto: d.validUpto || '',
        docNo: docNo.trim(), docDate, fromGstin: gstin, toGstin: toGstin.trim() || 'URP',
        toTrdName, totInvValue: totals.totInv, transDistance, vehicleNo: vehicleNo.trim().toUpperCase(),
        status: 'active', raw: r.data, generatedAt: new Date().toISOString(),
      };
      if (companyId) saveEwbBill(companyId, rec);
      setResult({ ok: true, ewbNo: String(ewbNo), validUpto: d.validUpto, ewbDate: d.ewayBillDate });
      toast.success(`e-Way Bill ${ewbNo} generated`);
      onGenerated?.();
    } else {
      const codes = d?.error?.errorCodes;
      const msg = codes ? describeEwbError(codes) : (r.error || 'Generation failed');
      setResult({ ok: false, message: msg });
      toast.error(msg);
    }
  };

  // ── Gate states (professional, no API chrome) ──
  if (!gstin) {
    return (
      <SetupCard
        title="Add your GSTIN to continue"
        body="e-Way Bills are generated against your company GSTIN. Add it in Settings to get started."
        to={settingsPath}
      />
    );
  }
  if (!ewbUser || !ewbPass) {
    return (
      <SetupCard
        title="Set up e-Way Bill access"
        body="Enter your e-Way Bill portal credentials once in Settings. After that, e-Way Bills generate directly here — no logging in each time."
        to={settingsPath}
      />
    );
  }
  if (connecting && !connected) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-12 text-sm text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> Preparing the e-Way Bill portal…
      </div>
    );
  }
  if (!connected) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-red-800"><AlertTriangle className="h-4 w-4" /> e-Way Bill portal unavailable</div>
        <p className="mt-1 text-xs text-red-700">{connError || 'Could not connect. Check your e-Way Bill credentials in Settings.'}</p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={doConnect} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
          <Link to={settingsPath} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
            <Settings className="h-3.5 w-3.5" /> Open Settings
          </Link>
        </div>
      </div>
    );
  }

  // ── Connected → the form ──
  return (
    <div className="space-y-4">
      <Section title="Document details" icon={<FileCheck2 className="h-4 w-4" />}>
        <Field label="Sub-supply type"><Sel value={subSupplyType} onChange={setSubSupplyType} options={SUB_SUPPLY} /></Field>
        <Field label="Document type"><Sel value={docType} onChange={setDocType} options={DOC_TYPE} /></Field>
        <Field label="Document number"><In value={docNo} onChange={setDocNo} placeholder="INV-001" /></Field>
        <Field label="Document date (DD/MM/YYYY)"><In value={docDate} onChange={setDocDate} placeholder="25/07/2026" /></Field>
        <Field label="Transaction type"><Sel value={transactionType} onChange={setTransactionType} options={TXN_TYPE} /></Field>
        {subSupplyType === '8' && <Field label="Sub-supply description"><In value={subSupplyDesc} onChange={setSubSupplyDesc} placeholder="Describe" /></Field>}
      </Section>

      <Section title="From (dispatch)" icon={<Truck className="h-4 w-4" />}>
        <Field label="GSTIN"><In value={gstin} onChange={() => {}} readOnly /></Field>
        <Field label="Trade name"><In value={fromTrdName} onChange={setFromTrdName} /></Field>
        <Field label="Address"><In value={fromAddr1} onChange={setFromAddr1} placeholder="Address line" /></Field>
        <Field label="Place"><In value={fromPlace} onChange={setFromPlace} placeholder="City" /></Field>
        <Field label="Pincode"><In value={fromPincode} onChange={setFromPincode} placeholder="560001" right /></Field>
        <Field label="State code"><In value={String(fromStateCode || '')} onChange={() => {}} right readOnly /></Field>
      </Section>

      <Section title="To (recipient)" icon={<Truck className="h-4 w-4 rotate-180" />}>
        <Field label="GSTIN (blank = unregistered)">
          <div className="flex gap-1.5">
            <In value={toGstin} onChange={(v) => setToGstin(v.toUpperCase())} placeholder="33ABKCS2033B1ZW" />
            <button type="button" onClick={lookupRecipient} disabled={lookingUp} title="Look up recipient"
              className="shrink-0 rounded-lg border border-gray-200 px-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50">
              {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="Trade name"><In value={toTrdName} onChange={setToTrdName} /></Field>
        <Field label="Address"><In value={toAddr1} onChange={setToAddr1} placeholder="Address line" /></Field>
        <Field label="Place"><In value={toPlace} onChange={setToPlace} placeholder="City" /></Field>
        <Field label="Pincode"><In value={toPincode} onChange={setToPincode} placeholder="600001" right /></Field>
        <Field label="State code">
          <In value={/^[0-9]{2}/.test(toGstin) ? String(toStateCode) : toStateManual} onChange={setToStateManual} placeholder="33" right readOnly={/^[0-9]{2}/.test(toGstin)} />
        </Field>
      </Section>

      {/* Items */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Items {interState ? '· Inter-state (IGST)' : '· Intra-state (CGST+SGST)'}</p>
          <button type="button" onClick={addItem} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"><Plus className="h-3.5 w-3.5" /> Add item</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-gray-400">
                <th className="px-1 py-1 text-left font-semibold">Product</th>
                <th className="px-1 py-1 text-left font-semibold">HSN</th>
                <th className="px-1 py-1 text-right font-semibold">Qty</th>
                <th className="px-1 py-1 text-left font-semibold">Unit</th>
                <th className="px-1 py-1 text-right font-semibold">Taxable ₹</th>
                <th className="px-1 py-1 text-right font-semibold">Rate %</th>
                <th className="px-1 py-1" />
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td className="px-1 py-1"><In value={it.productName} onChange={(v) => setItem(i, { productName: v })} placeholder="Goods" /></td>
                  <td className="px-1 py-1 w-24"><In value={it.hsnCode} onChange={(v) => setItem(i, { hsnCode: v })} placeholder="1001" /></td>
                  <td className="px-1 py-1 w-16"><In value={it.quantity} onChange={(v) => setItem(i, { quantity: v })} right /></td>
                  <td className="px-1 py-1 w-20"><Sel value={it.qtyUnit} onChange={(v) => setItem(i, { qtyUnit: v })} options={UQC.map((u) => ({ v: u, l: u }))} /></td>
                  <td className="px-1 py-1 w-28"><In value={it.taxableAmount} onChange={(v) => setItem(i, { taxableAmount: v })} right /></td>
                  <td className="px-1 py-1 w-16"><In value={it.rate} onChange={(v) => setItem(i, { rate: v })} right /></td>
                  <td className="px-1 py-1 w-8 text-center">
                    <button type="button" onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { l: 'Taxable', v: totals.taxable }, { l: 'IGST', v: totals.igst }, { l: 'CGST', v: totals.cgst },
            { l: 'SGST', v: totals.sgst }, { l: 'Cess', v: totals.cess }, { l: 'Invoice total', v: totals.totInv },
          ].map((c) => (
            <div key={c.l} className="rounded-lg bg-gray-50 px-2.5 py-1.5">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">{c.l}</p>
              <p className="font-mono text-xs font-bold text-gray-800">{formatIndianCurrency(c.v)}</p>
            </div>
          ))}
        </div>
      </div>

      <Section title="Transport" icon={<Truck className="h-4 w-4" />}>
        <Field label="Transporter ID (optional)"><In value={transporterId} onChange={setTransporterId} placeholder="GSTIN of transporter" /></Field>
        <Field label="Mode"><Sel value={transMode} onChange={setTransMode} options={TRANS_MODE} /></Field>
        <Field label="Distance (km)"><In value={transDistance} onChange={setTransDistance} placeholder="100" right /></Field>
        <Field label="Vehicle number"><In value={vehicleNo} onChange={(v) => setVehicleNo(v.toUpperCase())} placeholder="KA01AB1234" /></Field>
        <Field label="Vehicle type"><Sel value={vehicleType} onChange={setVehicleType} options={VEHICLE_TYPE} /></Field>
      </Section>

      <div className="flex items-center gap-3">
        <button type="button" onClick={generate} disabled={generating}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />} Generate e-Way Bill
        </button>
        <span className="text-xs text-gray-400">Invoice total {formatIndianCurrency(totals.totInv)}</span>
      </div>

      {result && (
        result.ok ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800"><FileCheck2 className="h-5 w-5" /> e-Way Bill generated</div>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div><p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">EWB Number</p><p className="font-mono text-lg font-bold text-gray-900">{result.ewbNo}</p></div>
              <div><p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Generated</p><p className="text-sm text-gray-800">{result.ewbDate || '—'}</p></div>
              <div><p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Valid upto</p><p className="text-sm text-gray-800">{result.validUpto || '—'}</p></div>
            </div>
            <p className="mt-2 text-xs text-emerald-700">Saved to the Register tab.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-red-800"><AlertTriangle className="h-5 w-5" /> Could not generate</div>
            <p className="mt-1 text-xs text-red-700">{result.message}</p>
          </div>
        )
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">{icon}{title}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </div>
  );
}

function SetupCard({ title, body, to }: { title: string; body: string; to: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Settings className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs text-gray-500">{body}</p>
      <Link to={to} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
        <Settings className="h-4 w-4" /> Open Settings
      </Link>
    </div>
  );
}
