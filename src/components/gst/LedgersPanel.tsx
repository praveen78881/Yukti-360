import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCompany } from '@/hooks/useCompany';
import { useTaxpayerSession } from '@/components/gst/useTaxpayerSession';
import { sandboxClient } from '@/lib/gst/sandbox/client';
import { getEntityData, upsertEntityData } from '@/lib/offlineDb';

// ── Electronic Ledgers — ported verbatim from the certified standalone tool
//    (LEDGER-API-CONTRACT.md). Same schema-agnostic renderers + look; the ONLY
//    changes: it reuses the command-center taxpayer session (no own auth flow),
//    and caches the last pull to entity_data so it never re-downloads on its own. ──

const CACHE_MODULE = 'gst_ledgers';

type LedgerStmt = { rows: any[]; op_bal: any; cl_bal: any; first_from: string; last_to: string; last_updated: string };
interface FyData {
  cash?: LedgerStmt;
  itc?: LedgerStmt;
  liability?: { months: Record<string, any>; last_updated: string };
  updated_at?: string;
}
interface LedgerStore {
  balance?: { payload: any; as_on: string };  // live cash+ITC balance (always as-on-now)
  ranges?: Record<string, FyData>;             // keyed by "YYYY-MM_YYYY-MM" (from_to)
}

/* ---------- helpers (verbatim from ledgers.html) ---------- */
const money = (v: any) => (v === null || v === undefined || v === '')
  ? '0.00'
  : Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const headTip = (h: any) => h ? `Tax ${money(h.tx)} | Interest ${money(h.intr)} | Fee ${money(h.fee)} | Penalty ${money(h.pen)} | Other ${money(h.oth)}` : '';
const hv = (h: any) => h ? h.tot : 0;
const dparse = (s: any) => { if (!s) return 0; const m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? +(m[3] + m[2] + m[1]) : 0; };
const tstamp = (iso: any) => { if (!iso) return ''; const d = new Date(iso); return d.toLocaleDateString('en-IN') + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const bandHeader = (firstCols: string[]) => `<thead>
    <tr>${firstCols.map(c => `<th rowspan="2">${c}</th>`).join('')}
      <th colspan="5">Amount (₹)</th><th colspan="5">Closing Balance (₹)</th></tr>
    <tr>${'<th>CGST</th><th>SGST</th><th>IGST</th><th>CESS</th><th>Total</th>'.repeat(2)}</tr>
  </thead>`;
const badge = (t: any) => `<span class="badge ${String(t).toLowerCase() === 'dr' ? 'dr' : 'cr'}">${t || ''}</span>`;

function cashHtml(c?: LedgerStmt) {
  if (!c || (!c.rows.length && !c.op_bal)) return '<div class="empty">No data — click Update to pull from the portal.</div>';
  const rows = [...c.rows].sort((a, b) => dparse(a.dpt_dt) - dparse(b.dpt_dt) || String(a.dpt_time || '').localeCompare(String(b.dpt_time || '')));
  let h = '<table class="ledger">' + bandHeader(['Date of Deposit / Debit', 'Reference No.', 'Tax Period', 'Description', 'Type']) + '<tbody>';
  if (c.op_bal) h += `<tr class="balrowline"><td colspan="5">Opening Balance</td><td class="num" colspan="5"></td>
      <td class="num" title="${headTip(c.op_bal.cgstbal)}">${money(hv(c.op_bal.cgstbal))}</td>
      <td class="num" title="${headTip(c.op_bal.sgstbal)}">${money(hv(c.op_bal.sgstbal))}</td>
      <td class="num" title="${headTip(c.op_bal.igstbal)}">${money(hv(c.op_bal.igstbal))}</td>
      <td class="num" title="${headTip(c.op_bal.cessbal)}">${money(hv(c.op_bal.cessbal))}</td>
      <td class="num">${money(c.op_bal.tot_rng_bal)}</td></tr>`;
  for (const r of rows) {
    h += `<tr>
      <td class="ctr">${r.dpt_dt || r.rpt_dt || ''}${r.dpt_time ? `<span class="time">${r.dpt_time}</span>` : ''}</td>
      <td class="ctr">${r.refNo || ''}</td><td class="ctr">${r.ret_period || '-'}</td>
      <td class="desc">${r.desc || ''}</td><td class="ctr">${badge(r.tr_typ)}</td>
      <td class="num" title="${headTip(r.cgst)}">${money(hv(r.cgst))}</td>
      <td class="num" title="${headTip(r.sgst)}">${money(hv(r.sgst))}</td>
      <td class="num" title="${headTip(r.igst)}">${money(hv(r.igst))}</td>
      <td class="num" title="${headTip(r.cess)}">${money(hv(r.cess))}</td>
      <td class="num">${money(r.tot_tr_amt)}</td>
      <td class="num" title="${headTip(r.cgstbal)}">${money(hv(r.cgstbal))}</td>
      <td class="num" title="${headTip(r.sgstbal)}">${money(hv(r.sgstbal))}</td>
      <td class="num" title="${headTip(r.igstbal)}">${money(hv(r.igstbal))}</td>
      <td class="num" title="${headTip(r.cessbal)}">${money(hv(r.cessbal))}</td>
      <td class="num">${money(r.tot_rng_bal)}</td></tr>`;
  }
  if (c.cl_bal) h += `<tr class="balrowline"><td colspan="5">Closing Balance</td><td class="num" colspan="5"></td>
      <td class="num" title="${headTip(c.cl_bal.cgstbal)}">${money(hv(c.cl_bal.cgstbal))}</td>
      <td class="num" title="${headTip(c.cl_bal.sgstbal)}">${money(hv(c.cl_bal.sgstbal))}</td>
      <td class="num" title="${headTip(c.cl_bal.igstbal)}">${money(hv(c.cl_bal.igstbal))}</td>
      <td class="num" title="${headTip(c.cl_bal.cessbal)}">${money(hv(c.cl_bal.cessbal))}</td>
      <td class="num">${money(c.cl_bal.tot_rng_bal)}</td></tr>`;
  return h + '</tbody></table>';
}

function itcHtml(c?: LedgerStmt) {
  if (!c || (!c.rows.length && !c.op_bal)) return '<div class="empty">No data — click Update to pull from the portal.</div>';
  const rows = [...c.rows].sort((a, b) => dparse(a.dt) - dparse(b.dt));
  let h = '<table class="ledger">' + bandHeader(['Date', 'Reference No.', 'Tax Period', 'Description', 'Type']) + '<tbody>';
  if (c.op_bal) h += `<tr class="balrowline"><td colspan="5">Opening Balance</td><td class="num" colspan="5"></td>
      <td class="num">${money(c.op_bal.cgstTaxBal)}</td><td class="num">${money(c.op_bal.sgstTaxBal)}</td>
      <td class="num">${money(c.op_bal.igstTaxBal)}</td><td class="num">${money(c.op_bal.cessTaxBal)}</td>
      <td class="num">${money(c.op_bal.tot_rng_bal)}</td></tr>`;
  for (const r of rows) {
    h += `<tr>
      <td class="ctr">${r.dt || ''}</td><td class="ctr">${r.ref_no || ''}</td><td class="ctr">${r.ret_period || '-'}</td>
      <td class="desc">${r.desc || ''}</td><td class="ctr">${badge(r.tr_typ)}</td>
      <td class="num">${money(r.cgstTaxAmt)}</td><td class="num">${money(r.sgstTaxAmt)}</td>
      <td class="num">${money(r.igstTaxAmt)}</td><td class="num">${money(r.cessTaxAmt)}</td>
      <td class="num">${money(r.tot_tr_amt)}</td>
      <td class="num">${money(r.cgstTaxBal)}</td><td class="num">${money(r.sgstTaxBal)}</td>
      <td class="num">${money(r.igstTaxBal)}</td><td class="num">${money(r.cessTaxBal)}</td>
      <td class="num">${money(r.tot_rng_bal)}</td></tr>`;
  }
  if (c.cl_bal) h += `<tr class="balrowline"><td colspan="5">Closing Balance</td><td class="num" colspan="5"></td>
      <td class="num">${money(c.cl_bal.cgstTaxBal)}</td><td class="num">${money(c.cl_bal.sgstTaxBal)}</td>
      <td class="num">${money(c.cl_bal.igstTaxBal)}</td><td class="num">${money(c.cl_bal.cessTaxBal)}</td>
      <td class="num">${money(c.cl_bal.tot_rng_bal)}</td></tr>`;
  return h + '</tbody></table>';
}

function liabilityHtml(l?: FyData['liability']) {
  const months = Object.keys(l?.months || {}).sort();
  if (!months.length) return '<div class="empty">No data — click Update to pull from the portal.</div>';
  let h = '<table class="ledger">' + bandHeader(['Date', 'Reference No.', 'Description', 'Type', 'Discharge']) + '<tbody>';
  for (const ym of months) {
    const [y, m] = ym.split('-');
    const payload = l!.months[ym];
    const data = payload && payload.data && payload.data.data;
    const err = data && data.error;
    h += `<tr class="mhead"><td colspan="15">Return Period ${m}${y} — ${MONTHS[+m - 1]} ${y}</td></tr>`;
    if (err || !data || !data.tr || !data.tr.length) { h += `<tr><td colspan="15" class="ctr" style="color:var(--l-muted)">No records</td></tr>`; continue; }
    for (const r of data.tr) {
      h += `<tr>
        <td class="ctr">${r.dt || ''}</td><td class="ctr">${r.ref_no || ''}</td>
        <td class="desc">${r.desc || ''}</td><td class="ctr">${badge(r.tr_typ)}</td><td class="ctr">${r.dschrg_typ || '-'}</td>
        <td class="num" title="${headTip(r.cgst)}">${money(hv(r.cgst))}</td>
        <td class="num" title="${headTip(r.sgst)}">${money(hv(r.sgst))}</td>
        <td class="num" title="${headTip(r.igst)}">${money(hv(r.igst))}</td>
        <td class="num" title="${headTip(r.cess)}">${money(hv(r.cess))}</td>
        <td class="num">${money(r.tot_tr_amt)}</td>
        <td class="num" title="${headTip(r.cgstbal)}">${money(hv(r.cgstbal))}</td>
        <td class="num" title="${headTip(r.sgstbal)}">${money(hv(r.sgstbal))}</td>
        <td class="num" title="${headTip(r.igstbal)}">${money(hv(r.igstbal))}</td>
        <td class="num" title="${headTip(r.cessbal)}">${money(hv(r.cessbal))}</td>
        <td class="num">${money(r.tot_rng_bal)}</td></tr>`;
    }
    if (data.cl_bal) h += `<tr class="balrowline"><td colspan="5">Closing Balance — ${MONTHS[+m - 1]} ${y}</td><td class="num" colspan="5"></td>
        <td class="num" title="${headTip(data.cl_bal.cgstbal)}">${money(hv(data.cl_bal.cgstbal))}</td>
        <td class="num" title="${headTip(data.cl_bal.sgstbal)}">${money(hv(data.cl_bal.sgstbal))}</td>
        <td class="num" title="${headTip(data.cl_bal.igstbal)}">${money(hv(data.cl_bal.igstbal))}</td>
        <td class="num" title="${headTip(data.cl_bal.cessbal)}">${money(hv(data.cl_bal.cessbal))}</td>
        <td class="num">${money(data.cl_bal.tot_rng_bal)}</td></tr>`;
  }
  return h + '</tbody></table>';
}

function balancesHtml(b: LedgerStore['balance']) {
  const d = b?.payload?.data && b.payload.data.data;
  if (!d) return '';
  const cb = d.cash_bal || {}, ib = d.itc_bal || {}, blk = d.itc_blck_bal || {};
  const cashTot = (cb.cgst_tot_bal || 0) + (cb.sgst_tot_bal || 0) + (cb.igst_tot_bal || 0) + (cb.cess_tot_bal || 0);
  const itcTot = (ib.cgst_bal || 0) + (ib.sgst_bal || 0) + (ib.igst_bal || 0) + (ib.cess_bal || 0);
  return `
  <div class="balcard">
    <div class="bhead"><span>Cash Ledger Balance</span><span class="ason">as on ${tstamp(b!.as_on)}</span></div>
    <table><tr><th></th><th>CGST</th><th>SGST</th><th>IGST</th><th>CESS</th><th>Total</th></tr>
    <tr><td class="lbl">Balance</td><td>${money(cb.cgst_tot_bal)}</td><td>${money(cb.sgst_tot_bal)}</td>
    <td>${money(cb.igst_tot_bal)}</td><td>${money(cb.cess_tot_bal)}</td><td class="tot">${money(cashTot)}</td></tr></table>
  </div>
  <div class="balcard">
    <div class="bhead"><span>Input Tax Credit Balance</span><span class="ason">as on ${tstamp(b!.as_on)}</span></div>
    <table><tr><th></th><th>CGST</th><th>SGST</th><th>IGST</th><th>CESS</th><th>Total</th></tr>
    <tr><td class="lbl">Available</td><td>${money(ib.cgst_bal)}</td><td>${money(ib.sgst_bal)}</td>
    <td>${money(ib.igst_bal)}</td><td>${money(ib.cess_bal)}</td><td class="tot">${money(itcTot)}</td></tr>
    <tr><td class="lbl">Blocked</td><td>${money(blk.cgst_blck_bal)}</td><td>${money(blk.sgst_blck_bal)}</td>
    <td>${money(blk.igst_blck_bal)}</td><td>${money(blk.cess_blck_bal)}</td>
    <td class="tot">${money((blk.cgst_blck_bal || 0) + (blk.sgst_blck_bal || 0) + (blk.igst_blck_bal || 0) + (blk.cess_blck_bal || 0))}</td></tr></table>
  </div>`;
}

/* ---------- date-range helpers ---------- */
const dd = (n: number) => String(n).padStart(2, '0');
const fmtD = (d: Date) => `${dd(d.getDate())}/${dd(d.getMonth() + 1)}/${d.getFullYear()}`;
const ym = (d: Date) => `${d.getFullYear()}-${dd(d.getMonth() + 1)}`;            // "YYYY-MM" for <input type=month>
const ymLabel = (s: string) => { const [y, m] = s.split('-'); return `${MONTHS[+m - 1].slice(0, 3)} ${y}`; };
const firstDay = (ymStr: string) => { const [y, m] = ymStr.split('-').map(Number); return new Date(y, m - 1, 1); };
const lastDay = (ymStr: string) => { const [y, m] = ymStr.split('-').map(Number); return new Date(y, m, 0); };
// Current financial-year start month, "YYYY-MM" (default `from`).
const fyStartYm = (now: Date) => { const y = now.getFullYear(), m = now.getMonth() + 1; return `${m >= 4 ? y : y - 1}-04`; };
// Split [from,to] into ≤6-month windows (the cash/ITC statement API caps a range at ~6
// months) so any range downloads completely. `to` is clamped to today.
function rangeWindows(from: Date, to: Date): { from: string; to: string }[] {
  const out: { from: string; to: string }[] = [];
  let s = new Date(from);
  while (s <= to) {
    const e = new Date(s.getFullYear(), s.getMonth() + 6, 0); // last day of the 6th month
    const we = e > to ? to : e;
    out.push({ from: fmtD(s), to: fmtD(we) });
    s = new Date(we.getFullYear(), we.getMonth(), we.getDate() + 1);
  }
  return out;
}
// Completed return-period months (month fully finished before today) within [from,to].
function monthsInRange(from: Date, to: Date, now: Date): { y: number; m: string }[] {
  const out: { y: number; m: string }[] = [];
  let y = from.getFullYear(), m = from.getMonth() + 1;
  const ey = to.getFullYear(), em = to.getMonth() + 1;
  while (y < ey || (y === ey && m <= em)) {
    if (new Date(y, m, 0) < now) out.push({ y, m: dd(m) });
    m++; if (m > 12) { m = 1; y++; }
  }
  return out;
}

export function LedgersPanel() {
  const { company, companyId } = useCompany();
  const gstin = (company?.gst_details?.gstin || '').trim();
  const username = (company?.gst_details?.portalUsername || '').trim();
  const taxSession = useTaxpayerSession(gstin, username);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const now = useMemo(() => new Date(), []);
  const nowYm = ym(now);
  const [fromYm, setFromYm] = useState<string>(() => fyStartYm(now)); // default: current FY start
  const [toYm, setToYm] = useState<string>(() => nowYm);

  const store = useMemo<LedgerStore>(() => {
    if (!companyId || !gstin) return {};
    return (getEntityData(companyId, CACHE_MODULE, gstin)?.data as LedgerStore) ?? {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, gstin, version]);

  const rangeKey = `${fromYm}_${toYm}`;
  const view: FyData = store.ranges?.[rangeKey] ?? {};
  const rangeLabel = `${ymLabel(fromYm)} – ${ymLabel(toYm)}`;
  const rangeValid = firstDay(fromYm) <= lastDay(toYm);
  const sess = taxSession.sessionStatus();
  const meta = (s?: LedgerStmt) =>
    s?.last_updated ? `${s.first_from || ''} – ${s.last_to || ''} · updated ${tstamp(s.last_updated)}` : '';

  // Download the SELECTED month-year → month-year range, in ≤6-month windows so it lands
  // complete. Balance is always the live as-on-now snapshot. Cached per exact range.
  const doUpdate = async () => {
    if (busy) return;
    if (!gstin) { toast.error('Set the company GSTIN in Company Settings first'); return; }
    if (!username) { toast.error('Set the GST portal username in Company Settings (GST & e-Way Bill tab) first'); return; }
    if (!rangeValid) { toast.error('“From” month must be on or before “To” month'); return; }
    setBusy(true);
    await taxSession.run(async (token: string) => {
      try {
        const nowIso = now.toISOString();
        const errs: string[] = [];
        const apiErr = (r: any) => { const d = r?.data?.data ?? r?.data; return (d?.status_cd === '0' || d?.error) ? (d?.error?.message || d?.error?.error_cd || 'error') : (r?.ok ? null : (r?.error || 'error')); };
        const fromD = firstDay(fromYm);
        const toD = (lastDay(toYm) > now ? now : lastDay(toYm)); // never request beyond today
        const windows = rangeWindows(fromD, toD);
        if (!windows.length) { toast.message('That range is in the future.'); return; }

        // ── Cash + ITC: fetch each ≤6-month window, merge transactions (windows disjoint) ──
        const cashRows: any[] = [], itcRows: any[] = [];
        let cashOp: any, cashCl: any, itcOp: any, itcCl: any;
        for (let i = 0; i < windows.length; i++) {
          const w = windows[i];
          const [cashR, itcR] = await Promise.all([
            sandboxClient.ledgerCash(w.from, w.to, token),
            sandboxClient.ledgerItc(w.from, w.to, token),
          ]);
          const cd = cashR?.data?.data?.data;
          if (apiErr(cashR)) errs.push(`Cash ${w.from}: ${apiErr(cashR)}`);
          else if (cd) { if (i === 0) cashOp = cd.op_bal; cashCl = cd.cl_bal; cashRows.push(...(cd.tr || [])); }
          const id = itcR?.data?.data?.data?.itcLdgDtls ?? itcR?.data?.data?.itcLdgDtls;
          if (apiErr(itcR)) errs.push(`ITC ${w.from}: ${apiErr(itcR)}`);
          else if (id) { if (i === 0) itcOp = id.op_bal; itcCl = id.cl_bal; itcRows.push(...(id.tr || [])); }
        }
        const fFrom = windows[0].from, lTo = windows[windows.length - 1].to;
        const rd: FyData = { updated_at: nowIso };
        if (cashRows.length || cashOp) rd.cash = { rows: cashRows, op_bal: cashOp, cl_bal: cashCl, first_from: fFrom, last_to: lTo, last_updated: nowIso };
        if (itcRows.length || itcOp) rd.itc = { rows: itcRows, op_bal: itcOp, cl_bal: itcCl, first_from: fFrom, last_to: lTo, last_updated: nowIso };

        // ── Liability: one completed return-period per call, across the range's months ──
        const months: Record<string, any> = {};
        for (const { y, m } of monthsInRange(fromD, toD, now)) {
          const r = await sandboxClient.ledgerTax(String(y), m, token);
          if (r.ok) months[`${y}-${m}`] = r.data; // keep LG9087 "No Liabilities" months → "No records"
        }
        rd.liability = { months, last_updated: nowIso };

        // ── Balance: live as-on-now (single endpoint serves cash + ITC balance) ──
        const balR = await sandboxClient.ledgerBalance(String(now.getFullYear()), dd(now.getMonth() + 1), token);
        const next: LedgerStore = { ...store, ranges: { ...(store.ranges || {}), [rangeKey]: rd } };
        if (!apiErr(balR)) next.balance = { payload: balR.data, as_on: nowIso }; else errs.push(`Balance: ${apiErr(balR)}`);

        upsertEntityData(companyId!, CACHE_MODULE, gstin, next);
        setVersion((v) => v + 1);
        if (errs.length) toast.warning(`${rangeLabel} updated with notes: ${errs.join(' · ')}`, { duration: 8000 });
        else toast.success(`${rangeLabel} ledgers downloaded`);
      } catch (e: any) {
        toast.error(e?.message || 'Download failed');
      }
    });
    setBusy(false);
  };

  const cached = !!view.updated_at;

  return (
    <div className="ledgers-root">
      <style>{LEDGER_CSS}</style>

      <div className="l-topbar">
        <div>
          <h1>Electronic Ledgers</h1>
          <div className="l-gstin">{gstin ? `GSTIN ${gstin}` : 'No GSTIN set'}</div>
        </div>
        <div className="l-tright">
          <label className="l-range">From<input type="month" value={fromYm} max={nowYm} onChange={(e) => setFromYm(e.target.value)} disabled={busy} /></label>
          <label className="l-range">To<input type="month" value={toYm} max={nowYm} onChange={(e) => setToYm(e.target.value)} disabled={busy} /></label>
          <span className="l-conn"><span className={`l-dot${sess.state === 'active' ? ' on' : ''}`} />{sess.label}</span>
          <button className="l-update" onClick={doUpdate} disabled={busy || !rangeValid}>{busy ? 'Downloading…' : cached ? 'Re-download' : 'Download'}</button>
        </div>
      </div>

      {taxSession.phase === 'otp' && (
        <div className="l-otp">
          <span>Enter the OTP sent to the taxpayer’s registered mobile / email:</span>
          <input value={taxSession.otp} onChange={(e) => taxSession.setOtp(e.target.value)} placeholder="OTP" inputMode="numeric" maxLength={6}
            onKeyDown={(e) => { if (e.key === 'Enter') taxSession.verify(); }} />
          <button onClick={() => taxSession.verify()}>Verify</button>
          <button className="ghost" onClick={() => taxSession.cancel()}>Cancel</button>
        </div>
      )}

      {!rangeValid ? (
        <div className="l-hint">“From” month must be on or before “To” month.</div>
      ) : !cached && !busy && (
        <div className="l-hint">No data cached for {rangeLabel} yet — click <b>Download</b> to pull it from the portal (cached after, no repeat download).</div>
      )}

      <div className="l-balrow" dangerouslySetInnerHTML={{ __html: balancesHtml(store.balance) }} />

      <div className="l-screen"><div className="l-panel">
        <div className="l-phead"><h2>Electronic Cash Ledger · {rangeLabel}</h2><div className="l-metatxt">{meta(view.cash)}</div></div>
        <div className="l-tablewrap" dangerouslySetInnerHTML={{ __html: cashHtml(view.cash) }} />
      </div></div>

      <div className="l-screen"><div className="l-panel">
        <div className="l-phead"><h2>Electronic Credit Ledger (ITC) · {rangeLabel}</h2><div className="l-metatxt">{meta(view.itc)}</div></div>
        <div className="l-tablewrap" dangerouslySetInnerHTML={{ __html: itcHtml(view.itc) }} />
      </div></div>

      <div className="l-screen"><div className="l-panel">
        <div className="l-phead"><h2>Electronic Liability Register · {rangeLabel}</h2><div className="l-metatxt">{view.liability?.last_updated ? `updated ${tstamp(view.liability.last_updated)}` : ''}</div></div>
        <div className="l-tablewrap" dangerouslySetInnerHTML={{ __html: liabilityHtml(view.liability) }} />
      </div></div>
    </div>
  );
}

/* ---------- scoped CSS (ported from ledgers.html; prefixed to avoid global collisions) ---------- */
const LEDGER_CSS = `
.ledgers-root{--l-blue:#0b5394;--l-blue-deep:#083b6f;--l-blue-mid:#1a73c9;--l-blue-pale:#eaf2fb;--l-blue-line:#c9dcf1;--l-ink:#15243a;--l-muted:#5a6b82;--l-green:#178a3a;--l-red:#c0392b;color:var(--l-ink);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}
.ledgers-root *{box-sizing:border-box}
.ledgers-root .l-topbar{background:linear-gradient(180deg,var(--l-blue-deep),var(--l-blue));color:#fff;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 20px;border-radius:12px;box-shadow:0 2px 10px rgba(8,59,111,.2)}
.ledgers-root .l-topbar h1{font-size:16px;margin:0;font-weight:650;letter-spacing:.3px}
.ledgers-root .l-gstin{font-size:12px;opacity:.85;margin-top:1px;letter-spacing:.5px}
.ledgers-root .l-tright{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.ledgers-root .l-range{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:#fff;opacity:.95}
.ledgers-root .l-range input{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.14);color:#fff;border-radius:7px;padding:5px 8px;font-size:12.5px}
.ledgers-root .l-range input::-webkit-calendar-picker-indicator{filter:invert(1)}
.ledgers-root .l-hint{margin-top:10px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:10px;padding:10px 14px;font-size:12.5px}
.ledgers-root .l-conn{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:6px 14px;font-size:12.5px}
.ledgers-root .l-dot{width:9px;height:9px;border-radius:50%;background:#e8710a;box-shadow:0 0 0 3px rgba(232,113,10,.25)}
.ledgers-root .l-dot.on{background:#2ecc71;box-shadow:0 0 0 3px rgba(46,204,113,.3)}
.ledgers-root .l-update{background:#fff;color:var(--l-blue);border:none;border-radius:8px;padding:8px 20px;font-size:13.5px;font-weight:650;cursor:pointer;letter-spacing:.3px}
.ledgers-root .l-update:hover{background:var(--l-blue-pale)}
.ledgers-root .l-update:disabled{opacity:.5;cursor:not-allowed}
.ledgers-root .l-otp{margin-top:10px;background:var(--l-blue-pale);border:1px solid var(--l-blue-line);border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px}
.ledgers-root .l-otp input{border:1px solid var(--l-blue-line);border-radius:7px;padding:7px 10px;width:120px;letter-spacing:2px;text-align:center}
.ledgers-root .l-otp button{background:var(--l-blue);color:#fff;border:none;border-radius:7px;padding:7px 14px;font-weight:600;cursor:pointer}
.ledgers-root .l-otp button.ghost{background:#fff;color:var(--l-muted);border:1px solid var(--l-blue-line)}
.ledgers-root .l-balrow{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:18px 0 4px}
@media(max-width:900px){.ledgers-root .l-balrow{grid-template-columns:1fr}}
.ledgers-root .balcard{border:1px solid var(--l-blue-line);border-radius:12px;overflow:hidden;background:#fff}
.ledgers-root .balcard .bhead{background:var(--l-blue);color:#fff;padding:10px 16px;font-size:13.5px;font-weight:650;display:flex;justify-content:space-between;align-items:center}
.ledgers-root .balcard .bhead .ason{font-size:11px;font-weight:400;opacity:.85}
.ledgers-root .balcard table{width:100%;border-collapse:collapse;font-size:13px}
.ledgers-root .balcard th{background:var(--l-blue-pale);color:var(--l-blue-deep);font-weight:650;padding:7px 10px;border:1px solid var(--l-blue-line);font-size:12px}
.ledgers-root .balcard td{padding:8px 10px;border:1px solid var(--l-blue-line);text-align:right;font-variant-numeric:tabular-nums}
.ledgers-root .balcard td.lbl{text-align:left;color:var(--l-muted);font-weight:600}
.ledgers-root .balcard td.tot{font-weight:700;color:var(--l-blue-deep)}
.ledgers-root .l-screen{margin:14px 0}
.ledgers-root .l-panel{border:1px solid var(--l-blue-line);border-radius:12px;overflow:hidden;background:#fff}
.ledgers-root .l-phead{background:linear-gradient(180deg,var(--l-blue),var(--l-blue-mid));color:#fff;padding:12px 18px;display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.ledgers-root .l-phead h2{margin:0;font-size:15px;font-weight:650;letter-spacing:.3px}
.ledgers-root .l-metatxt{font-size:11.5px;opacity:.9}
.ledgers-root .l-tablewrap{overflow-x:auto;background:#fff}
.ledgers-root table.ledger{border-collapse:collapse;width:100%;font-size:12.6px;min-width:1150px}
.ledgers-root table.ledger th{background:var(--l-blue-pale);color:var(--l-blue-deep);border:1px solid var(--l-blue-line);padding:7px 8px;font-weight:650;text-align:center;font-size:11.8px}
.ledgers-root table.ledger td{border:1px solid var(--l-blue-line);padding:6px 8px;vertical-align:middle;background:#fff}
.ledgers-root table.ledger tr:nth-child(even) td{background:#f7fafd}
.ledgers-root td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.ledgers-root td.ctr{text-align:center;white-space:nowrap}
.ledgers-root td.desc{min-width:180px}
.ledgers-root .badge{display:inline-block;border-radius:5px;padding:1px 9px;font-size:11px;font-weight:700}
.ledgers-root .badge.dr{background:#fdecea;color:var(--l-red)}
.ledgers-root .badge.cr{background:#e8f6ec;color:var(--l-green)}
.ledgers-root tr.balrowline td{background:var(--l-blue-pale)!important;font-weight:700;color:var(--l-blue-deep)}
.ledgers-root tr.mhead td{background:var(--l-blue)!important;color:#fff;font-weight:650;font-size:12.5px;letter-spacing:.4px}
.ledgers-root .time{color:var(--l-muted);font-size:10.5px;display:block}
.ledgers-root .empty{padding:36px;text-align:center;color:var(--l-muted);font-size:13px}
`;
