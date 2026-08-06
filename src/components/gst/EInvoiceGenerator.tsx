'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Search, FileCheck2, AlertTriangle, Settings, RefreshCw, ReceiptText } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { sandboxClient } from '@/lib/gst/sandbox/client';
import { getEinvToken, setEinvToken, saveEInvoice, type EInvRecord } from '@/lib/gst/sandbox/einv';

const SUP_TYP = [
  { v: 'B2B', l: 'B2B' }, { v: 'SEZWP', l: 'SEZ with payment' }, { v: 'SEZWOP', l: 'SEZ without payment' },
  { v: 'EXPWP', l: 'Export with payment' }, { v: 'EXPWOP', l: 'Export without payment' }, { v: 'DEXP', l: 'Deemed Export' },
];
const DOC_TYP = [{ v: 'INV', l: 'Tax Invoice' }, { v: 'CRN', l: 'Credit Note' }, { v: 'DBN', l: 'Debit Note' }];
const UQC = ['NOS', 'PCS', 'BAG', 'BOX', 'KGS', 'LTR', 'MTR', 'QTL', 'ROL', 'SET', 'TON', 'UNT', 'OTH'];

const todayDDMMYYYY = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
const num = (v: string | number) => (typeof v === 'number' ? v : parseFloat(v) || 0);
const r2 = (n: number) => Math.round(n * 100) / 100;

interface Item { desc: string; isServ: boolean; hsn: string; qty: string; unit: string; unitPrice: string; rate: string; }
const blankItem = (): Item => ({ desc: '', isServ: false, hsn: '', qty: '1', unit: 'NOS', unitPrice: '', rate: '18' });

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className="mb-0.5 block text-[11px] font-medium text-gray-500">{label}</label>{children}</div>);
}
function In({ value, onChange, placeholder, right, readOnly }: { value: string; onChange: (v: string) => void; placeholder?: string; right?: boolean; readOnly?: boolean }) {
  return (<input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly}
    className={`w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${right ? 'text-right font-mono' : ''} ${readOnly ? 'bg-gray-50 text-gray-500' : ''}`} />);
}
function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (<select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none">{options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>);
}
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (<div className="rounded-xl border border-gray-200 bg-white p-4"><p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">{icon}{title}</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div></div>);
}
function SetupCard({ title, body, to }: { title: string; body: string; to: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Settings className="h-5 w-5" /></div>
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs text-gray-500">{body}</p>
      <Link to={to} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Settings className="h-4 w-4" /> Open Settings</Link>
    </div>
  );
}

export function EInvoiceGenerator({ onGenerated }: { onGenerated?: () => void }) {
  const { company, companyId } = useCompany();
  const gstin = (company?.gst_details?.gstin || '').trim();
  // e-Invoice (IRP) shares the GSP API credentials captured in Settings.
  const apiUser = (company?.gst_details?.ewbUsername || '').trim();
  const apiPass = (company?.gst_details?.ewbPassword || '').trim();
  const settingsPath = companyId ? `/company/${companyId}/settings` : '#';

  const [connected, setConnected] = useState<boolean>(() => !!(gstin && getEinvToken(gstin)));
  const [connecting, setConnecting] = useState(false);
  const [connError, setConnError] = useState('');

  const doConnect = useCallback(async () => {
    if (!gstin || !apiUser || !apiPass) return;
    setConnecting(true); setConnError('');
    const r = await sandboxClient.einvAuth(gstin, apiUser, apiPass);
    setConnecting(false);
    const token = r.data?.einvToken;
    if (!r.ok || !token) { setConnError('Could not connect to the e-Invoice portal. Check the API credentials in Settings.'); setConnected(false); return; }
    setEinvToken(gstin, token, r.data?.expiry); setConnected(true);
  }, [gstin, apiUser, apiPass]);

  useEffect(() => {
    if (!gstin) return;
    if (getEinvToken(gstin)) { setConnected(true); return; }
    if (apiUser && apiPass) doConnect();
  }, [gstin, apiUser, apiPass, doConnect]);

  // Form
  const [supTyp, setSupTyp] = useState('B2B');
  const [docTyp, setDocTyp] = useState('INV');
  const [docNo, setDocNo] = useState('');
  const [docDate, setDocDate] = useState(todayDDMMYYYY());
  const [regRev, setRegRev] = useState('N');

  const [sellerName, setSellerName] = useState(company?.name || '');
  const [sellerAddr, setSellerAddr] = useState(company?.entity_details?.address || '');
  const [sellerLoc, setSellerLoc] = useState('');
  const [sellerPin, setSellerPin] = useState('');

  const [buyerGstin, setBuyerGstin] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPos, setBuyerPos] = useState('');
  const [buyerAddr, setBuyerAddr] = useState('');
  const [buyerLoc, setBuyerLoc] = useState('');
  const [buyerPin, setBuyerPin] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  const [items, setItems] = useState<Item[]>([blankItem()]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; irn?: string; ackNo?: string; ackDt?: string; message?: string } | null>(null);

  const sellerState = gstin ? gstin.slice(0, 2) : '';
  const buyerState = /^[0-9]{2}/.test(buyerGstin) ? buyerGstin.slice(0, 2) : (buyerPos || '');
  const interState = !!sellerState && !!buyerState && sellerState !== buyerState;

  const totals = useMemo(() => {
    let ass = 0, igst = 0, cgst = 0, sgst = 0;
    for (const it of items) {
      const a = r2(num(it.qty) * num(it.unitPrice)); const rt = num(it.rate);
      ass += a;
      if (interState) igst += r2(a * rt / 100);
      else { cgst += r2(a * rt / 200); sgst += r2(a * rt / 200); }
    }
    return { ass: r2(ass), igst: r2(igst), cgst: r2(cgst), sgst: r2(sgst), tot: r2(ass + igst + cgst + sgst) };
  }, [items, interState]);

  const lookupBuyer = async () => {
    const g = buyerGstin.trim().toUpperCase();
    if (!/^[0-9]{2}[A-Z0-9]{13}$/.test(g)) { toast.error('Enter a valid 15-character buyer GSTIN'); return; }
    setLookingUp(true);
    const r = await sandboxClient.gstinSearch(g);
    setLookingUp(false);
    const d = r.data?.data?.data || r.data?.data;
    if (!r.ok || !d) { toast.error(r.error || 'Buyer not found'); return; }
    setBuyerName(d.tradeNam || d.lgnm || '');
    setBuyerPos(g.slice(0, 2));
    const addr = d.pradr?.addr;
    if (addr) { setBuyerAddr([addr.bno, addr.st].filter(Boolean).join(', ')); setBuyerLoc(addr.loc || addr.dst || ''); setBuyerPin(addr.pncd || ''); }
    toast.success(`Buyer: ${d.tradeNam || d.lgnm}`);
  };

  const setItem = (i: number, patch: Partial<Item>) => setItems((xs) => xs.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const generate = async () => {
    const token = getEinvToken(gstin);
    if (!token) { toast.error('e-Invoice portal is not connected'); setConnected(false); return; }
    if (!docNo.trim()) { toast.error('Document number is required'); return; }
    if (!buyerGstin.trim() && supTyp === 'B2B') { toast.error('Buyer GSTIN is required for B2B'); return; }
    if (!buyerPos.trim()) { toast.error('Place of supply (buyer state code) is required'); return; }
    if (!sellerPin.trim() || !buyerPin.trim()) { toast.error('Seller and buyer pincodes are required'); return; }
    if (!items.some((it) => it.desc.trim() && num(it.unitPrice) > 0)) { toast.error('Add at least one item with a price'); return; }

    const itemList = items.filter((it) => it.desc.trim()).map((it, idx) => {
      const ass = r2(num(it.qty) * num(it.unitPrice)); const rt = num(it.rate);
      const igst = interState ? r2(ass * rt / 100) : 0;
      const cgst = interState ? 0 : r2(ass * rt / 200);
      const sgst = interState ? 0 : r2(ass * rt / 200);
      return {
        SlNo: String(idx + 1), PrdDesc: it.desc, IsServc: it.isServ ? 'Y' : 'N', HsnCd: it.hsn,
        Qty: num(it.qty), Unit: it.unit, UnitPrice: num(it.unitPrice), TotAmt: ass, AssAmt: ass,
        GstRt: rt, IgstAmt: igst, CgstAmt: cgst, SgstAmt: sgst, TotItemVal: r2(ass + igst + cgst + sgst),
      };
    });

    const invoice: Record<string, unknown> = {
      Version: '1.1',
      TranDtls: { TaxSch: 'GST', SupTyp: supTyp, RegRev: regRev, IgstOnIntra: 'N' },
      DocDtls: { Typ: docTyp, No: docNo.trim(), Dt: docDate },
      SellerDtls: { Gstin: gstin, LglNm: sellerName, Addr1: sellerAddr || 'NA', Loc: sellerLoc || 'NA', Pin: num(sellerPin), Stcd: sellerState },
      BuyerDtls: { Gstin: buyerGstin.trim() || 'URP', LglNm: buyerName || 'NA', Pos: buyerPos.trim(), Addr1: buyerAddr || 'NA', Loc: buyerLoc || 'NA', Pin: num(buyerPin), Stcd: buyerState },
      ItemList: itemList,
      ValDtls: { AssVal: totals.ass, CgstVal: totals.cgst, SgstVal: totals.sgst, IgstVal: totals.igst, TotInvVal: totals.tot },
    };

    setGenerating(true); setResult(null);
    const r = await sandboxClient.einvGenerate(token, invoice);
    setGenerating(false);

    const env: any = r.data?.data ?? r.data;
    const ok = env?.Status === 1 || env?.Status === '1';
    const data = env?.Data;
    if (r.ok && ok && data?.Irn) {
      const rec: EInvRecord = {
        irn: data.Irn, ackNo: String(data.AckNo || ''), ackDt: data.AckDt || '',
        docNo: docNo.trim(), docDate, buyerGstin: buyerGstin.trim() || 'URP', buyerName,
        totInvVal: totals.tot, signedQr: data.SignedQRCode, status: 'active', raw: r.data, generatedAt: new Date().toISOString(),
      };
      if (companyId) saveEInvoice(companyId, rec);
      setResult({ ok: true, irn: data.Irn, ackNo: String(data.AckNo || ''), ackDt: data.AckDt });
      toast.success('e-Invoice (IRN) generated');
      onGenerated?.();
    } else {
      const errs = env?.ErrorDetails;
      const msg = Array.isArray(errs) && errs.length ? errs.map((e: any) => `${e.ErrorCode}: ${e.ErrorMessage}`).join('; ') : (r.error || 'Generation failed');
      setResult({ ok: false, message: msg });
      toast.error(msg.slice(0, 120));
    }
  };

  if (!gstin) return <SetupCard title="Add your GSTIN to continue" body="e-Invoices are generated against your company GSTIN. Add it in Settings to get started." to={settingsPath} />;
  if (!apiUser || !apiPass) return <SetupCard title="Set up e-Invoice access" body="Enter your GSP API credentials once in Settings (shared with e-Way Bill). After that, e-Invoices generate directly here." to={settingsPath} />;
  if (connecting && !connected) return <div className="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-12 text-sm text-gray-500"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /> Preparing the e-Invoice portal…</div>;
  if (!connected) return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-red-800"><AlertTriangle className="h-4 w-4" /> e-Invoice portal unavailable</div>
      <p className="mt-1 text-xs text-red-700">{connError || 'Could not connect. Check your API credentials in Settings.'}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={doConnect} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"><RefreshCw className="h-3.5 w-3.5" /> Retry</button>
        <Link to={settingsPath} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Settings className="h-3.5 w-3.5" /> Open Settings</Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Section title="Document details" icon={<ReceiptText className="h-4 w-4" />}>
        <Field label="Supply type"><Sel value={supTyp} onChange={setSupTyp} options={SUP_TYP} /></Field>
        <Field label="Document type"><Sel value={docTyp} onChange={setDocTyp} options={DOC_TYP} /></Field>
        <Field label="Document number"><In value={docNo} onChange={setDocNo} placeholder="INV-001" /></Field>
        <Field label="Document date (DD/MM/YYYY)"><In value={docDate} onChange={setDocDate} /></Field>
        <Field label="Reverse charge"><Sel value={regRev} onChange={setRegRev} options={[{ v: 'N', l: 'No' }, { v: 'Y', l: 'Yes' }]} /></Field>
      </Section>

      <Section title="Seller (you)" icon={<ReceiptText className="h-4 w-4" />}>
        <Field label="GSTIN"><In value={gstin} onChange={() => {}} readOnly /></Field>
        <Field label="Legal name"><In value={sellerName} onChange={setSellerName} /></Field>
        <Field label="Address"><In value={sellerAddr} onChange={setSellerAddr} placeholder="Address line" /></Field>
        <Field label="Location"><In value={sellerLoc} onChange={setSellerLoc} placeholder="City" /></Field>
        <Field label="Pincode"><In value={sellerPin} onChange={setSellerPin} placeholder="560001" right /></Field>
        <Field label="State code"><In value={sellerState} onChange={() => {}} readOnly right /></Field>
      </Section>

      <Section title="Buyer" icon={<ReceiptText className="h-4 w-4" />}>
        <Field label="GSTIN">
          <div className="flex gap-1.5">
            <In value={buyerGstin} onChange={(v) => setBuyerGstin(v.toUpperCase())} placeholder="29AWGPV7107B1Z1" />
            <button type="button" onClick={lookupBuyer} disabled={lookingUp} title="Look up buyer" className="shrink-0 rounded-lg border border-gray-200 px-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50">{lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</button>
          </div>
        </Field>
        <Field label="Legal name"><In value={buyerName} onChange={setBuyerName} /></Field>
        <Field label="Place of supply (state code)"><In value={buyerPos} onChange={setBuyerPos} placeholder="29" right /></Field>
        <Field label="Address"><In value={buyerAddr} onChange={setBuyerAddr} placeholder="Address line" /></Field>
        <Field label="Location"><In value={buyerLoc} onChange={setBuyerLoc} placeholder="City" /></Field>
        <Field label="Pincode"><In value={buyerPin} onChange={setBuyerPin} placeholder="560002" right /></Field>
      </Section>

      {/* Items */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Items {interState ? '· Inter-state (IGST)' : '· Intra-state (CGST+SGST)'}</p>
          <button type="button" onClick={() => setItems((xs) => [...xs, blankItem()])} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"><Plus className="h-3.5 w-3.5" /> Add item</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="text-[10px] uppercase tracking-wider text-gray-400">
              <th className="px-1 py-1 text-left font-semibold">Description</th><th className="px-1 py-1 text-left font-semibold">HSN/SAC</th>
              <th className="px-1 py-1 text-center font-semibold">Svc</th><th className="px-1 py-1 text-right font-semibold">Qty</th>
              <th className="px-1 py-1 text-left font-semibold">Unit</th><th className="px-1 py-1 text-right font-semibold">Unit ₹</th>
              <th className="px-1 py-1 text-right font-semibold">Rate %</th><th className="px-1 py-1 text-right font-semibold">Taxable</th><th className="px-1 py-1" />
            </tr></thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td className="px-1 py-1"><In value={it.desc} onChange={(v) => setItem(i, { desc: v })} placeholder="Goods/Service" /></td>
                  <td className="px-1 py-1 w-24"><In value={it.hsn} onChange={(v) => setItem(i, { hsn: v })} placeholder="1001" /></td>
                  <td className="px-1 py-1 w-10 text-center"><input type="checkbox" checked={it.isServ} onChange={(e) => setItem(i, { isServ: e.target.checked })} /></td>
                  <td className="px-1 py-1 w-16"><In value={it.qty} onChange={(v) => setItem(i, { qty: v })} right /></td>
                  <td className="px-1 py-1 w-20"><Sel value={it.unit} onChange={(v) => setItem(i, { unit: v })} options={UQC.map((u) => ({ v: u, l: u }))} /></td>
                  <td className="px-1 py-1 w-24"><In value={it.unitPrice} onChange={(v) => setItem(i, { unitPrice: v })} right /></td>
                  <td className="px-1 py-1 w-16"><In value={it.rate} onChange={(v) => setItem(i, { rate: v })} right /></td>
                  <td className="px-1 py-1 w-24 text-right font-mono text-xs text-gray-600">{formatIndianCurrency(r2(num(it.qty) * num(it.unitPrice)))}</td>
                  <td className="px-1 py-1 w-8 text-center"><button type="button" onClick={() => setItems((xs) => (xs.length > 1 ? xs.filter((_, j) => j !== i) : xs))} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {[{ l: 'Assessable', v: totals.ass }, { l: 'IGST', v: totals.igst }, { l: 'CGST', v: totals.cgst }, { l: 'SGST', v: totals.sgst }, { l: 'Invoice total', v: totals.tot }].map((c) => (
            <div key={c.l} className="rounded-lg bg-gray-50 px-2.5 py-1.5"><p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">{c.l}</p><p className="font-mono text-xs font-bold text-gray-800">{formatIndianCurrency(c.v)}</p></div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={generate} disabled={generating} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />} Generate e-Invoice (IRN)</button>
        <span className="text-xs text-gray-400">Invoice total {formatIndianCurrency(totals.tot)}</span>
      </div>

      {result && (result.ok ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-800"><FileCheck2 className="h-5 w-5" /> e-Invoice generated</div>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">IRN</p><p className="break-all font-mono text-xs font-bold text-gray-900">{result.irn}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Ack No.</p><p className="font-mono text-sm text-gray-800">{result.ackNo || '—'}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Ack Date</p><p className="text-sm text-gray-800">{result.ackDt || '—'}</p></div>
          </div>
          <p className="mt-2 text-xs text-emerald-700">Saved to the Register tab.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-red-800"><AlertTriangle className="h-5 w-5" /> Could not generate</div>
          <p className="mt-1 text-xs text-red-700">{result.message}</p>
        </div>
      ))}
    </div>
  );
}
