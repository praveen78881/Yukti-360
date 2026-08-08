'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useCompany } from '@/hooks/useCompany';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatIndianCurrency } from '@/lib/utils/currencyFormat';
import { getOrCreateFiling, saveFiling } from '@/lib/gstr1/gstr1Db';
import { autoFillFromInvoices } from '@/lib/gstr1/autoFillFromInvoices';
import { listInvoicesV2, deleteInvoiceV2, updateInvoiceV2 } from '@/lib/accounting/gstInvoices';
import type { InvoiceV2, DocType } from '@/lib/accounting/gstInvoices';
import { validateFiling, checkFilingSchema, checkSaveBodyStructure, validateGstr1 } from '@/lib/gstr1/gstr1Validate';
import type { Gstr1ValidateResult } from '@/lib/gstr1/gstr1Validate';
import { hashFiling, sectionAnchor } from '@/lib/gstr1/gstr1Gate';
import { pollReturnStatusGated, pollOnce, type PollOutcome } from '@/lib/gst/gstr1Poller';
import { generateGstr1Json } from '@/lib/gstr1/gstr1Json';
import { STATE_CODES, UQC_OPTIONS } from '@/lib/gstr1/config';
import { formatRemaining } from '@/lib/gst/sandbox/session';
import { getSessionInfo } from '@/lib/gst/sandbox/store';
import { importCombinedFiled, saveCombinedFiled, getCombinedFiled, type CombinedFiled } from '@/lib/gst/sandbox/gstr1FiledCombined';
import type { FiledSection } from '@/lib/gst/sandbox/gstr1FiledDetail';
import { exportGstr1YearDetailExcel } from '@/lib/gst/sandbox/gstr1AnnualExcel';
import { parsePeriod, fyOf } from '@/lib/gst/sandbox/period';
import { useTaxpayerSession } from '@/components/gst/useTaxpayerSession';
import { fetchFiledReturns, findGstr1Filing } from '@/lib/gst/sandbox/trackReturns';
import { sandboxClient } from '@/lib/gst/sandbox/client';
import { recordAudit } from '@/lib/gst/sandbox/fileAudit';
import { useSearchParams } from 'react-router-dom';
import type {
  GSTR1Filing, B2BInvoice, B2CLInvoice, B2CSSummary, EXPInvoice,
  CDNRNote, CDNURNote, NilSummary, ATAdvance, HSNSummary, SupecoTx,
  ATAAmendment,
} from '@/lib/gstr1/types';
import type { ValidationError } from '@/lib/gstr1/gstr1Validate';

// ── Period helpers ────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function currentPeriod() {
  const d = new Date();
  return `${String(d.getMonth()+1).padStart(2,'0')}${d.getFullYear()}`;
}
function periodLabel(p: string) {
  return `${MONTH_NAMES[parseInt(p.slice(0,2),10)-1]} ${p.slice(2)}`;
}
// Chronological order of an MMYYYY period (NOT string-comparable directly).
function periodOrd(p: string) { return parseInt(p.slice(2),10)*100 + parseInt(p.slice(0,2),10); }
function isPastPeriod(p: string) { return periodOrd(p) < periodOrd(currentPeriod()); } // excludes current + future
function prevPeriod(p: string) {
  const d = new Date(parseInt(p.slice(2),10), parseInt(p.slice(0,2),10)-2, 1);
  return `${String(d.getMonth()+1).padStart(2,'0')}${d.getFullYear()}`;
}
function nextPeriod(p: string) {
  const d = new Date(parseInt(p.slice(2),10), parseInt(p.slice(0,2),10), 1);
  return `${String(d.getMonth()+1).padStart(2,'0')}${d.getFullYear()}`;
}
function periodToRange(p: string) {
  const mm = parseInt(p.slice(0,2),10), yyyy = parseInt(p.slice(2),10);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { fromDate: fmt(new Date(yyyy,mm-1,1)), toDate: fmt(new Date(yyyy,mm,0)) };
}

// ── Common constants ──────────────────────────────────────────────────────────

const STATE_OPTS = Object.entries(STATE_CODES).map(([v,l]) => ({ value: v, label: `${v} – ${l}` }));
const RATE_OPTS = ['0','0.1','0.25','1','1.5','3','5','6','7.5','12','18','28','40'].map(r => ({ value: r, label: `${r}%` }));
const INV_TYPE_OPTS = [
  { value:'R', label:'R – Regular' },
  { value:'SEWP', label:'SEWP – SEZ with payment' },
  { value:'SEWOP', label:'SEWOP – SEZ without payment' },
  { value:'DE', label:'DE – Deemed Export' },
];

// ── Tiny UI primitives ────────────────────────────────────────────────────────

function Th({ ch, right }: { ch?: string; right?: boolean }) {
  return (
    <th className={`px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50 ${right?'text-right':'text-left'}`}>
      {ch}
    </th>
  );
}
function Td({ children, mono, right, dim }: { children: React.ReactNode; mono?: boolean; right?: boolean; dim?: boolean }) {
  return (
    <td className={`px-3 py-1.5 text-sm border-b border-gray-100 ${mono?'font-mono text-[12px] tabular-nums':''} ${right?'text-right':''} ${dim?'text-gray-400':''}`}>
      {children}
    </td>
  );
}
function F({ label, children, className='' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[11px] text-gray-500 mb-0.5">{label}</label>
      {children}
    </div>
  );
}
function Inp({ value, onChange, placeholder, className='', disabled=false }: { value: string|number; onChange:(v:string)=>void; placeholder?:string; className?:string; disabled?:boolean }) {
  return <input disabled={disabled} className={`border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-400 ${disabled?'bg-gray-100 text-gray-400 cursor-not-allowed':''} ${className}`} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} />;
}
function Sel({ value, onChange, options }: { value:string; onChange:(v:string)=>void; options:{value:string;label:string}[] }) {
  return <select className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-400" value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
// Small RCM switch used in table rows (compact — no text; state is the colour).
function RCMPill({ val, onClick, disabled }: { val:'Y'|'N'; onClick?:()=>void; disabled?:boolean }) {
  return (
    <button type="button" role="switch" aria-checked={val==='Y'} onClick={onClick} disabled={disabled}
      title={val==='Y'?'RCM: ON — click to turn off':'RCM: OFF — click to turn on'}
      className={`relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors align-middle ${val==='Y'?'bg-orange-500':'bg-gray-300'} ${disabled?'opacity-60 cursor-default':'cursor-pointer hover:opacity-90'}`}>
      <span className={`inline-block w-3 h-3 rounded-full bg-white shadow transform transition-transform mt-0.5 ${val==='Y'?'translate-x-3.5':'translate-x-0.5'}`} />
    </button>
  );
}
// Small RCM switch used in the add/edit forms — just a toggle + tiny "RCM" tag.
function RCMToggle({ val, onChange, label }: { val:'Y'|'N'; onChange:(v:'Y'|'N')=>void; label?:string }) {
  return (
    <button type="button" role="switch" aria-checked={val==='Y'} onClick={()=>onChange(val==='Y'?'N':'Y')}
      title={val==='Y'?'Reverse Charge (RCM): ON — click to turn off':'Reverse Charge (RCM): OFF — click to turn on'}
      className="inline-flex items-center gap-1.5 focus:outline-none">
      <span className={`relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors ${val==='Y'?'bg-orange-500':'bg-gray-300'}`}>
        <span className={`inline-block w-3 h-3 rounded-full bg-white shadow transform transition-transform mt-0.5 ${val==='Y'?'translate-x-3.5':'translate-x-0.5'}`} />
      </span>
      <span className={`text-[11px] font-semibold ${val==='Y'?'text-orange-700':'text-gray-400'}`}>{label??'RCM'}</span>
    </button>
  );
}
// Divider between main section and amendments
function AmendDivider({ section, tableNum }: { section:string; tableNum:string }) {
  return (
    <div className="mt-6 mb-3 flex items-center gap-3">
      <div className="flex-1 h-px bg-gray-200" />
      <div className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1">
        <AmendBadge />
        <span className="text-xs font-semibold text-indigo-700">Amendments — {section} · Table {tableNum}</span>
      </div>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}
function DelBtn({ onClick }: { onClick:()=>void }) {
  return <button type="button" onClick={onClick} className="text-red-400 hover:text-red-600 font-bold px-1 text-base leading-none">×</button>;
}
function BooksBadge() {
  return null;
}
function AmendBadge() {
  return <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 uppercase tracking-wide">amended</span>;
}

// ── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({ taxable, igst, cgst, sgst }: { taxable:number; igst:number; cgst:number; sgst:number }) {
  if (taxable === 0 && igst === 0 && cgst === 0 && sgst === 0) return null;
  const cards = [
    { label:'Taxable Value', val:taxable, color:'blue' },
    { label:'IGST', val:igst, color:'purple' },
    { label:'CGST', val:cgst, color:'green' },
    { label:'SGST/UTGST', val:sgst, color:'teal' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
      {cards.map(c => (
        <div key={c.label} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{c.label}</p>
          <p className="text-sm font-bold font-mono text-gray-800 mt-0.5">{formatIndianCurrency(c.val)}</p>
        </div>
      ))}
    </div>
  );
}

// ── Add-row form container ────────────────────────────────────────────────────

function AddPanel({ onClose, children, isAmend }: { onClose:()=>void; children:React.ReactNode; isAmend?:boolean }) {
  return (
    <div className={`mt-3 border border-dashed rounded-xl p-4 ${isAmend?'border-indigo-200 bg-indigo-50/40':'border-blue-200 bg-blue-50/40'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold ${isAmend?'text-indigo-700':'text-blue-700'}`}>{isAmend?'Amendment Entry':'New Entry'}</span>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 leading-none font-bold text-base">×</button>
      </div>
      {children}
    </div>
  );
}
function EditPanel({ onClose, children }: { onClose:()=>void; children:React.ReactNode }) {
  return (
    <div className="border border-dashed border-green-300 rounded-xl bg-green-50/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-green-700">Edit Entry</span>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 leading-none font-bold text-base">×</button>
      </div>
      {children}
    </div>
  );
}
function AddBtns({ onSave, onClear, saveLabel='Add' }: { onSave:()=>void; onClear:()=>void; saveLabel?:string }) {
  return (
    <div className="flex gap-2 mt-3">
      <button type="button" onClick={onSave} className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">{saveLabel}</button>
      <button type="button" onClick={onClear} className="px-4 py-1.5 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50">Clear</button>
    </div>
  );
}
function SaveCancelBtns({ onSave, onCancel }: { onSave:()=>void; onCancel:()=>void }) {
  return (
    <div className="flex gap-2 mt-3">
      <button type="button" onClick={onSave} className="px-4 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700">Save</button>
      <button type="button" onClick={onCancel} className="px-4 py-1.5 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
    </div>
  );
}

// ── Section table heading: title left, "+ Add" pinned top-right ─────────────────
function SectionHeader({ title, addLabel, onAdd, hideAdd, tone='blue' }: { title?:string; addLabel:string; onAdd:()=>void; hideAdd?:boolean; tone?:'blue'|'indigo' }) {
  const btn = tone==='indigo' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700';
  return (
    <div className="flex items-center justify-between gap-3 mb-2">
      {title ? <h4 className="text-sm font-semibold text-gray-700">{title}</h4> : <span />}
      {!hideAdd && (
        <button type="button" onClick={onAdd}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm ${btn}`}>
          <span className="text-sm leading-none">+</span> {addLabel}
        </button>
      )}
    </div>
  );
}

// ── Right-click actions for a DRAFT transaction row (edit / delete) ─────────────
// Draft-preparation rows only — NOT wired into the imported/filed data preview.
type RowMenuState = { x:number; y:number; onEdit?:()=>void; onDelete?:()=>void } | null;
function useRowMenu() {
  const [menu, setMenu] = useState<RowMenuState>(null);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e:KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('click', close); window.removeEventListener('scroll', close, true); window.removeEventListener('keydown', onKey); };
  }, [menu]);
  return {
    menu,
    open: (e:React.MouseEvent, actions:{ onEdit?:()=>void; onDelete?:()=>void }) => { e.preventDefault(); setMenu({ x:e.clientX, y:e.clientY, ...actions }); },
    close: () => setMenu(null),
  };
}
function RowContextMenu({ menu, onClose }: { menu:RowMenuState; onClose:()=>void }) {
  if (!menu) return null;
  const vw = typeof window!=='undefined' ? window.innerWidth : 9999;
  const vh = typeof window!=='undefined' ? window.innerHeight : 9999;
  return (
    <div className="fixed z-[60] min-w-[172px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-xl"
      style={{ top: Math.min(menu.y, vh - 96), left: Math.min(menu.x, vw - 184) }}
      onClick={(e)=>e.stopPropagation()} onContextMenu={(e)=>e.preventDefault()}>
      {menu.onEdit && (
        <button type="button" onClick={()=>{ menu.onEdit!(); onClose(); }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-blue-50">
          <span className="text-[13px] w-4 text-center">✎</span> Edit transaction
        </button>
      )}
      {menu.onDelete && (
        <button type="button" onClick={()=>{ menu.onDelete!(); onClose(); }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50">
          <span className="text-[15px] leading-none w-4 text-center">×</span> Delete transaction
        </button>
      )}
    </div>
  );
}

// ── DatePicker ─────────────────────────────────────────────────────────────────

function DatePicker({ value, onChange, period }: { value:string; onChange:(v:string)=>void; period?:string }) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const parsed = value && value.length===10 ? (() => { const [dd,mm,yy]=value.split('-').map(Number); return {day:dd,month:mm-1,year:yy}; })() : null;
  const [calYear, setCalYear] = useState<number>(() => parsed?.year ?? (period?parseInt(period.slice(2)):today.getFullYear()));
  const [calMonth, setCalMonth] = useState<number>(() => parsed?.month ?? (period?parseInt(period.slice(0,2))-1:today.getMonth()));
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const pMM = period?.slice(0,2); const pYYYY = period?.slice(2);
  const isInPeriod = !period || !parsed ? true : String(parsed.month+1).padStart(2,'0')===pMM && String(parsed.year)===pYYYY;
  const selectDay = (day:number) => { onChange(`${String(day).padStart(2,'0')}-${String(calMonth+1).padStart(2,'0')}-${calYear}`); setOpen(false); };
  const prevCal = () => { if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1); };
  const nextCal = () => { if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1); };
  return (
    <div className="relative">
      <div className={`flex items-center border rounded px-2 py-1 focus-within:border-blue-400 ${!isInPeriod?'border-amber-400 bg-amber-50/40':'border-gray-300'}`}>
        <input className="flex-1 outline-none bg-transparent text-sm min-w-0" value={value} onChange={e=>onChange(e.target.value)}
          placeholder="DD-MM-YYYY" onKeyDown={e=>{if(e.key==='Enter'){setOpen(false);(e.target as HTMLInputElement).blur();}}} />
        <button type="button" onMouseDown={e=>{e.preventDefault();setOpen(o=>!o);}} className="text-gray-400 hover:text-blue-500 px-0.5 shrink-0 text-sm">📅</button>
      </div>
      {!isInPeriod && <p className="text-[10px] text-amber-600 mt-0.5">⚠ Outside filing period</p>}
      {open && (
        <div className="absolute top-full left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-60 mt-1" onMouseDown={e=>e.preventDefault()}>
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevCal} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded font-bold">‹</button>
            <span className="text-xs font-bold text-gray-800">{MONTH_NAMES[calMonth]} {calYear}</span>
            <button type="button" onClick={nextCal} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded font-bold">›</button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=><div key={d} className="text-center text-[9px] font-semibold text-gray-400">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({length:firstDow}).map((_,i)=><div key={`e${i}`}/>)}
            {Array.from({length:daysInMonth}).map((_,i)=>{
              const day=i+1;
              const ddmmyyyy=`${String(day).padStart(2,'0')}-${String(calMonth+1).padStart(2,'0')}-${calYear}`;
              const isSel=value===ddmmyyyy;
              const inPeriodMo=!period||(String(calMonth+1).padStart(2,'0')===pMM&&String(calYear)===pYYYY);
              return <button key={day} type="button" onClick={()=>selectDay(day)}
                className={`text-center text-xs py-1 rounded font-medium transition-colors ${isSel?'bg-blue-600 text-white':inPeriodMo?'hover:bg-blue-50 text-gray-700':'hover:bg-amber-50 text-amber-500'}`}>{day}</button>;
            })}
          </div>
          <div className="mt-2 pt-1.5 border-t border-gray-100 flex justify-between">
            <button type="button" onClick={()=>{setCalMonth(today.getMonth());setCalYear(today.getFullYear());}} className="text-[10px] text-blue-500 hover:text-blue-700">Today</button>
            <button type="button" onClick={()=>setOpen(false)} className="text-[10px] text-gray-400 hover:text-gray-600">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Period Picker Modal ────────────────────────────────────────────────────────

function PeriodPickerModal({ period, onSelect, onClose }: { period:string; onSelect:(p:string)=>void; onClose:()=>void }) {
  const today = new Date();
  const pMM = parseInt(period.slice(0,2)); const pYYYY = parseInt(period.slice(2));
  const [fy, setFY] = useState<number>(pMM>=4?pYYYY:pYYYY-1);
  const fyMonths = [
    {m:4,l:'Apr'},{m:5,l:'May'},{m:6,l:'Jun'},{m:7,l:'Jul'},{m:8,l:'Aug'},{m:9,l:'Sep'},
    {m:10,l:'Oct'},{m:11,l:'Nov'},{m:12,l:'Dec'},{m:1,l:'Jan'},{m:2,l:'Feb'},{m:3,l:'Mar'},
  ].map(({m,l})=>{ const y=m>=4?fy:fy+1; return {m,l,p:`${String(m).padStart(2,'0')}${y}`,y}; });
  const isFuture=(p:string)=>{ const y=parseInt(p.slice(2)),mm=parseInt(p.slice(0,2)); return y>today.getFullYear()||(y===today.getFullYear()&&mm>today.getMonth()+1); };
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-72" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={()=>setFY(f=>f-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 font-bold text-lg">‹</button>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-800">FY {fy}–{String(fy+1).slice(2)}</p>
            <p className="text-[10px] text-gray-400">Apr {fy} – Mar {fy+1}</p>
          </div>
          <button type="button" onClick={()=>setFY(f=>f+1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 font-bold text-lg">›</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {fyMonths.map(({l,p,y})=>{
            const isActive=p===period; const fut=isFuture(p);
            return <button key={p} type="button" disabled={fut} onClick={()=>{if(!fut){onSelect(p);onClose();}}}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive?'bg-blue-600 text-white shadow-sm':fut?'text-gray-300 cursor-not-allowed':'hover:bg-blue-50 text-gray-700 border border-gray-200 hover:border-blue-300'}`}>
              <div>{l}</div><div className="text-[9px] opacity-60">{y}</div>
            </button>;
          })}
        </div>
        <button type="button" onClick={onClose} className="mt-4 w-full text-xs text-gray-400 hover:text-gray-600 py-1">Close</button>
      </div>
    </div>
  );
}

// ── Tax auto-calculation helper ────────────────────────────────────────────────
function calcTax(txval:number, rt:number, isInter:boolean, isDiff:boolean, diffPct:number) {
  const eff = isDiff ? rt * diffPct / 100 : rt;
  if (isInter) return { iamt: Math.round(txval * eff / 100 * 100)/100, camt:undefined, samt:undefined };
  return { iamt:undefined, camt: Math.round(txval * eff / 200 * 100)/100, samt: Math.round(txval * eff / 200 * 100)/100 };
}

// ── B2B Section ───────────────────────────────────────────────────────────────

type B2BDraft = B2BInvoice;

function B2BSection({ autoRows, filing, onChange, period, companyStateCode, onDeleteAuto, onUpdateAuto, allInvoices, view = 'regular' }: {
  autoRows: B2BInvoice[];
  filing: GSTR1Filing;
  onChange: (f: GSTR1Filing) => void;
  period: string;
  companyStateCode: string;
  onDeleteAuto: (id: string) => void;
  onUpdateAuto: (id: string, draft: Partial<InvoiceV2>) => void;
  allInvoices: InvoiceV2[];
  view?: 'regular' | 'amend';
}) {
  const blank = (): B2BDraft => ({ id:uid(), ctin:'', inv_typ:'R', inum:'', idt:'', val:0, pos:'27', rchrg:'N', itms:[{num:1,itm_det:{rt:18,txval:0}}] });
  const blankAmend = (): B2BInvoice => ({ ...blank(), isAmended:true, origInvNum:'', origInvDt:'' });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<B2BDraft>(blank());
  const [isDiff, setIsDiff] = useState(false);
  const [diffPct, setDiffPct] = useState(65);
  const [addingAmend, setAddingAmend] = useState(false);
  const [draftAmend, setDraftAmend] = useState<B2BInvoice>(blankAmend());
  const [editAmendId, setEditAmendId] = useState<string|null>(null);
  const [editAmendDraft, setEditAmendDraft] = useState<B2BInvoice>(blankAmend());
  const [editId, setEditId] = useState<string|null>(null);
  const [editDraft, setEditDraft] = useState<B2BInvoice>(blank());
  const [editAutoId, setEditAutoId] = useState<string|null>(null);
  const [editAutoDraft, setEditAutoDraft] = useState<B2BInvoice>(blank());
  const rowMenu = useRowMenu();

  // Detect inter-state from GSTIN vs company
  const isInterFromGstin = (ctin:string) => ctin.length >= 2 && ctin.slice(0,2) !== companyStateCode;

  const allRows = [...autoRows, ...filing.b2b];
  const amendRows = filing.b2ba ?? [];
  const totalTxval = allRows.reduce((s,r)=>s+(r.itms[0]?.itm_det.txval??0),0);
  const totalIgst  = allRows.reduce((s,r)=>s+(r.itms[0]?.itm_det.iamt??0),0);
  const totalCgst  = allRows.reduce((s,r)=>s+(r.itms[0]?.itm_det.camt??0),0);
  const totalSgst  = allRows.reduce((s,r)=>s+(r.itms[0]?.itm_det.samt??0),0);

  const toggleRCMauto = (id:string) => { const cur=filing.rcm_overrides?.[id]??'N'; onChange({...filing,rcm_overrides:{...filing.rcm_overrides,[id]:cur==='N'?'Y':'N'}}); };
  const toggleRCMmanual = (id:string) => onChange({...filing,b2b:filing.b2b.map(r=>r.id===id?{...r,rchrg:r.rchrg==='N'?'Y':'N'}:r)});
  const del = (id:string) => onChange({...filing,b2b:filing.b2b.filter(r=>r.id!==id)});
  const delAmend = (id:string) => onChange({...filing,b2ba:(filing.b2ba??[]).filter(r=>r.id!==id)});
  const startEditAmend = (row:B2BInvoice) => { setAddingAmend(false); setEditAmendId(row.id); setEditAmendDraft({...row}); };
  const saveAmendEdit = () => { onChange({...filing,b2ba:amendRows.map(r=>r.id===editAmendId?{...editAmendDraft,isAmended:true}:r)}); setEditAmendId(null); };
  const itm = (base:B2BInvoice, v:Partial<typeof base.itms[0]['itm_det']>) => [{num:1,itm_det:{...base.itms[0].itm_det,...v}}];

  // Auto-compute taxes for draft
  const applyAutoTax = (d:B2BDraft, txval:number, rt:number) => {
    const inter = isInterFromGstin(d.ctin);
    const t = calcTax(txval, rt, inter, isDiff, diffPct);
    return {...d,itms:[{num:1,itm_det:{...d.itms[0].itm_det,txval,...t}}]};
  };

  const startEdit = (row:B2BInvoice) => { setEditId(row.id); setEditDraft({...row}); };
  const saveEdit = () => { onChange({...filing,b2b:filing.b2b.map(r=>r.id===editId?editDraft:r)}); setEditId(null); };
  const saveAdd = () => { onChange({...filing,b2b:[...filing.b2b,draft]}); setDraft(blank()); setAdding(false); setIsDiff(false); };
  const startEditAuto = (row: B2BInvoice) => {
    const inv = allInvoices.find((x) => x.id === row.id);
    if (!inv) return;
    setEditAutoId(row.id);
    setEditAutoDraft({ ...row });
  };
  const saveEditAuto = () => {
    if (!editAutoId) return;
    // Convert DD-MM-YYYY back to YYYY-MM-DD for invoice storage
    const ddmmyyyy = editAutoDraft.idt;
    let invoice_date = '';
    if (ddmmyyyy && ddmmyyyy.length === 10) {
      const [dd,mm,yy] = ddmmyyyy.split('-');
      invoice_date = `${yy}-${mm}-${dd}`;
    }
    onUpdateAuto(editAutoId, {
      buyer_gstin: editAutoDraft.ctin || undefined,
      invoice_no: editAutoDraft.inum,
      invoice_date: invoice_date || undefined,
      place_of_supply: editAutoDraft.pos,
      reverse_charge: editAutoDraft.rchrg === 'Y',
    } as Partial<InvoiceV2>);
    setEditAutoId(null);
  };
  const saveAmend = () => { onChange({...filing,b2ba:[...amendRows,{...draftAmend,isAmended:true}]}); setDraftAmend(blankAmend()); setAddingAmend(false); };

  // Render helper (called as a function, NOT mounted as <B2BForm/>): defining a component
  // inside the parent gives it a new identity every render, which remounts the form and
  // drops input focus on each keystroke.
  const renderB2BForm = ({ d, setD, isPeriodLocked, onSave, onClear, saveLabel }:{ d:B2BInvoice; setD:(v:B2BInvoice)=>void; isPeriodLocked:boolean; onSave:()=>void; onClear:()=>void; saveLabel:string }) => {
    const inter = isInterFromGstin(d.ctin);
    const rt = d.itms[0]?.itm_det.rt ?? 18;
    const txval = d.itms[0]?.itm_det.txval ?? 0;
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <F label="GSTIN of Recipient">
            <Inp value={d.ctin} onChange={v=>{ const ctin=v.toUpperCase(); const inter2=ctin.length>=2&&ctin.slice(0,2)!==companyStateCode; const pos=ctin.length>=2?ctin.slice(0,2):d.pos; const t=calcTax(txval,rt,inter2,isDiff,diffPct); setD({...d,ctin,pos,itms:[{num:1,itm_det:{...d.itms[0].itm_det,...t}}]}); }} placeholder="29AAAAA0000A1Z5" />
            {d.ctin.length>=2&&<p className={`text-[10px] mt-0.5 font-semibold ${inter?'text-purple-600':'text-green-600'}`}>{inter?'Inter-state → IGST':'Intra-state → CGST + SGST'}</p>}
          </F>
          <F label="Invoice No."><Inp value={d.inum} onChange={v=>setD({...d,inum:v})} placeholder="INV-001" /></F>
          <F label="Invoice Date"><DatePicker value={d.idt} onChange={v=>setD({...d,idt:v})} period={isPeriodLocked?period:undefined} /></F>
          <F label="Invoice Value (₹)"><Inp value={d.val||''} onChange={v=>setD({...d,val:parseFloat(v)||0})} className="text-right" /></F>
          <F label="Place of Supply">
            <Sel value={d.pos} onChange={v=>setD({...d,pos:v})} options={STATE_OPTS} />
            <p className="text-[9px] text-gray-400 mt-0.5">Auto-set from GSTIN; edit if needed</p>
          </F>
          <F label="Invoice Type"><Sel value={d.inv_typ} onChange={v=>setD({...d,inv_typ:v as B2BInvoice['inv_typ']})} options={INV_TYPE_OPTS} /></F>
          <F label="Tax Rate (%)">
            <Sel value={String(rt)} onChange={v=>{ const r=parseFloat(v); const t=calcTax(txval,r,inter,isDiff,diffPct); setD({...d,itms:[{num:1,itm_det:{...d.itms[0].itm_det,rt:r,...t}}]}); }} options={RATE_OPTS} />
          </F>
          <F label="Taxable Value (₹)">
            <Inp value={txval||''} onChange={v=>{ const tv=parseFloat(v)||0; const t=calcTax(tv,rt,inter,isDiff,diffPct); setD({...d,itms:[{num:1,itm_det:{...d.itms[0].itm_det,txval:tv,...t}}]}); }} className="text-right" />
          </F>
          {inter
            ? <F label="IGST (₹) — auto-calculated"><Inp value={d.itms[0]?.itm_det.iamt??''} onChange={v=>setD({...d,itms:itm(d,{iamt:parseFloat(v)||undefined})})} className="text-right bg-blue-50" /></F>
            : <>
                <F label="CGST (₹) — auto-calculated"><Inp value={d.itms[0]?.itm_det.camt??''} onChange={v=>setD({...d,itms:itm(d,{camt:parseFloat(v)||undefined})})} className="text-right bg-blue-50" /></F>
                <F label="SGST/UTGST (₹) — auto-calculated"><Inp value={d.itms[0]?.itm_det.samt??''} onChange={v=>setD({...d,itms:itm(d,{samt:parseFloat(v)||undefined})})} className="text-right bg-blue-50" /></F>
              </>
          }
          <F label="Cess (₹)"><Inp value={d.itms[0]?.itm_det.csamt||''} onChange={v=>setD({...d,itms:itm(d,{csamt:parseFloat(v)||undefined})})} placeholder="0" className="text-right" /></F>
        </div>
        {/* Differential rate */}
        <div className="mt-3 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <button type="button" onClick={()=>{ setIsDiff(v=>!v); const t=calcTax(txval,rt,inter,!isDiff,diffPct); setD({...d,itms:[{num:1,itm_det:{...d.itms[0].itm_det,...t}}]}); }}
              className={`relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors ${isDiff?'bg-indigo-500':'bg-gray-300'}`}>
              <span className={`inline-block w-3 h-3 rounded-full bg-white shadow transform transition-transform mt-0.5 ${isDiff?'translate-x-3':'translate-x-0.5'}`} />
            </button>
            <span className="text-[11px] text-gray-600 font-medium">Supply eligible for differential % of existing tax rate? (Govt. notified)</span>
          </div>
          {isDiff&&(
            <div className="mt-2 flex items-center gap-3">
              <F label="Applicable % of Tax Rate" className="w-40">
                <Inp value={diffPct} onChange={v=>{ const dp=parseFloat(v)||65; setDiffPct(dp); const t=calcTax(txval,rt,inter,true,dp); setD({...d,itms:[{num:1,itm_det:{...d.itms[0].itm_det,...t}}]}); }} className="text-right" placeholder="65" />
              </F>
              <p className="text-[10px] text-indigo-600 mt-4">Effective rate = {rt}% × {diffPct}% = {Math.round(rt*diffPct)/100}%</p>
            </div>
          )}
        </div>
        {/* RCM */}
        <div className="mt-3 p-3 bg-orange-50/50 border border-orange-100 rounded-lg">
          <RCMToggle val={d.rchrg} onChange={v=>setD({...d,rchrg:v})} />
        </div>
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={onSave} className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">{saveLabel}</button>
          <button type="button" onClick={onClear} className="px-4 py-1.5 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50">Clear</button>
        </div>
      </>
    );
  };

  // Shared amend form body — used by both the "+ add amendment" panel and in-place row edit.
  const renderB2BAmendForm = ({ d, setD, onSave, onClear, saveLabel }:{ d:B2BInvoice; setD:(v:B2BInvoice)=>void; onSave:()=>void; onClear:()=>void; saveLabel:string }) => (
    <>
      <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mb-3">Fill original invoice details (from a previous filed period) + the corrected/amended details below.</p>
      <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/70 rounded-lg border border-indigo-200 mb-3">
        <F label="Original Invoice No. (being amended)"><Inp value={d.origInvNum||''} onChange={v=>setD({...d,origInvNum:v})} placeholder="Old INV-001" /></F>
        <F label="Original Invoice Date (previous period)"><DatePicker value={d.origInvDt||''} onChange={v=>setD({...d,origInvDt:v})} /></F>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <F label="GSTIN of Recipient"><Inp value={d.ctin} onChange={v=>setD({...d,ctin:v.toUpperCase()})} placeholder="29AAAAA0000A1Z5" /></F>
        <F label="Amended Invoice No."><Inp value={d.inum} onChange={v=>setD({...d,inum:v})} placeholder="INV-001A" /></F>
        <F label="Amended Invoice Date"><DatePicker value={d.idt} onChange={v=>setD({...d,idt:v})} period={period} /></F>
        <F label="Invoice Value (₹)"><Inp value={d.val||''} onChange={v=>setD({...d,val:parseFloat(v)||0})} className="text-right" /></F>
        <F label="Place of Supply"><Sel value={d.pos} onChange={v=>setD({...d,pos:v})} options={STATE_OPTS} /></F>
        <F label="Invoice Type"><Sel value={d.inv_typ} onChange={v=>setD({...d,inv_typ:v as B2BInvoice['inv_typ']})} options={INV_TYPE_OPTS} /></F>
        <F label="Rate (%)"><Sel value={String(d.itms[0]?.itm_det.rt??18)} onChange={v=>setD({...d,itms:[{num:1,itm_det:{...d.itms[0].itm_det,rt:parseFloat(v)}}]})} options={RATE_OPTS} /></F>
        <F label="Taxable Value (₹)"><Inp value={d.itms[0]?.itm_det.txval||''} onChange={v=>setD({...d,itms:[{num:1,itm_det:{...d.itms[0].itm_det,txval:parseFloat(v)||0}}]})} className="text-right" /></F>
        <F label="IGST (₹)"><Inp value={d.itms[0]?.itm_det.iamt||''} onChange={v=>setD({...d,itms:[{num:1,itm_det:{...d.itms[0].itm_det,iamt:parseFloat(v)||undefined}}]})} className="text-right" placeholder="0" /></F>
        <F label="CGST (₹)"><Inp value={d.itms[0]?.itm_det.camt||''} onChange={v=>setD({...d,itms:[{num:1,itm_det:{...d.itms[0].itm_det,camt:parseFloat(v)||undefined}}]})} className="text-right" placeholder="0" /></F>
        <F label="SGST (₹)"><Inp value={d.itms[0]?.itm_det.samt||''} onChange={v=>setD({...d,itms:[{num:1,itm_det:{...d.itms[0].itm_det,samt:parseFloat(v)||undefined}}]})} className="text-right" placeholder="0" /></F>
      </div>
      <AddBtns onSave={onSave} onClear={onClear} saveLabel={saveLabel} />
    </>
  );

  const B2BRow = ({ row, idx, isAuto }: { row:B2BInvoice; idx:number; isAuto:boolean }) => {
    const rcm = isAuto ? (filing.rcm_overrides?.[row.id]??'N') : row.rchrg;
    const inter = row.itms[0]?.itm_det.iamt != null && (row.itms[0]?.itm_det.iamt??0) > 0;
    return (
      <tr title="Right-click for edit / delete"
        onContextMenu={(e)=>rowMenu.open(e, isAuto
          ? { onEdit:()=>startEditAuto(row), onDelete:()=>{ if(window.confirm('Delete this auto-imported invoice from the GST register? Journal entries are not affected.')) onDeleteAuto(row.id); } }
          : { onEdit:()=>startEdit(row), onDelete:()=>del(row.id) })}
        className={`border-b border-gray-100 ${isAuto?'bg-blue-50/30 hover:bg-blue-50/60':`hover:bg-gray-50 ${idx%2===1?'bg-gray-50/40':''}`}`}>
        <Td dim><span className="text-[10px] tabular-nums">{idx+1}</span></Td>
        <Td mono>
          <div className="flex items-center gap-1">{isAuto&&<BooksBadge />}<span className="text-[11px]">{row.ctin||'—'}</span></div>
          <div className={`text-[9px] font-semibold mt-0.5 ${inter?'text-purple-500':'text-green-500'}`}>{inter?'Inter-state':'Intra-state'}</div>
        </Td>
        <Td><span className="font-medium">{row.inum}</span></Td>
        <Td dim>{row.idt}</Td>
        <Td right mono>{formatIndianCurrency(row.val)}</Td>
        <Td dim><span className="text-[10px]">{STATE_CODES[row.pos]?.split(' ')[0]||row.pos}</span></Td>
        <Td dim><span className="text-[11px] bg-gray-100 px-1 rounded">{row.inv_typ}</span></Td>
        <Td dim>{row.itms[0]?.itm_det.rt}%</Td>
        <Td right mono>{formatIndianCurrency(row.itms[0]?.itm_det.txval??0)}</Td>
        <Td right mono>{row.itms[0]?.itm_det.iamt?formatIndianCurrency(row.itms[0].itm_det.iamt):'—'}</Td>
        <Td right mono>{row.itms[0]?.itm_det.camt?formatIndianCurrency(row.itms[0].itm_det.camt):'—'}</Td>
        <Td right mono>{row.itms[0]?.itm_det.samt?formatIndianCurrency(row.itms[0].itm_det.samt):'—'}</Td>
        <Td right mono dim>{row.itms[0]?.itm_det.csamt?formatIndianCurrency(row.itms[0].itm_det.csamt):'—'}</Td>
        <Td>
          <RCMPill val={rcm} onClick={()=>isAuto?toggleRCMauto(row.id):toggleRCMmanual(row.id)} />
        </Td>
      </tr>
    );
  };

  return (
    <div>
      {view !== 'amend' && (<>
      <SummaryStrip taxable={totalTxval} igst={totalIgst} cgst={totalCgst} sgst={totalSgst} />
      <SectionHeader addLabel="Add B2B entry" onAdd={()=>setAdding(true)} hideAdd={adding} />
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead><tr>
            <Th ch="#" /><Th ch="GSTIN / State" /><Th ch="Invoice No." /><Th ch="Invoice Date" /><Th ch="Value" right /><Th ch="POS" /><Th ch="Type" /><Th ch="Rate" /><Th ch="Taxable" right /><Th ch="IGST" right /><Th ch="CGST" right /><Th ch="SGST" right /><Th ch="Cess" right /><Th ch="RCM" />
          </tr></thead>
          <tbody>
            {autoRows.map((row,i) => (
              <React.Fragment key={row.id}>
                <B2BRow row={row} idx={i} isAuto={true} />
                {editAutoId===row.id && (
                  <tr className="bg-green-50 border-b border-green-200">
                    <td colSpan={14} className="p-3">
                      <EditPanel onClose={()=>setEditAutoId(null)}>
                        <p className="text-[10px] text-gray-400 mb-2">Editing GST-level fields only. Journal entries are not affected.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          <F label="GSTIN of Recipient"><Inp value={editAutoDraft.ctin} onChange={v=>setEditAutoDraft({...editAutoDraft,ctin:v.toUpperCase()})} placeholder="29AAAAA0000A1Z5" /></F>
                          <F label="Invoice No."><Inp value={editAutoDraft.inum} onChange={v=>setEditAutoDraft({...editAutoDraft,inum:v})} /></F>
                          <F label="Invoice Date"><DatePicker value={editAutoDraft.idt} onChange={v=>setEditAutoDraft({...editAutoDraft,idt:v})} period={period} /></F>
                          <F label="Place of Supply"><Sel value={editAutoDraft.pos} onChange={v=>setEditAutoDraft({...editAutoDraft,pos:v})} options={STATE_OPTS} /></F>
                        </div>
                        <div className="mt-3 p-3 bg-orange-50/50 border border-orange-100 rounded-lg">
                          <RCMToggle val={editAutoDraft.rchrg} onChange={v=>setEditAutoDraft({...editAutoDraft,rchrg:v})} />
                        </div>
                        <SaveCancelBtns onSave={saveEditAuto} onCancel={()=>setEditAutoId(null)} />
                      </EditPanel>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filing.b2b.map((row,i) => editId===row.id ? (
              <tr key={row.id} className="bg-green-50 border-b border-green-200">
                <td colSpan={14} className="p-3">
                  <EditPanel onClose={()=>setEditId(null)}>
                    {renderB2BForm({ d: editDraft, setD: setEditDraft, isPeriodLocked: true, onSave: saveEdit, onClear: ()=>setEditDraft(blank()), saveLabel: 'Save Changes' })}
                  </EditPanel>
                </td>
              </tr>
            ) : <B2BRow key={row.id} row={row} idx={autoRows.length+i} isAuto={false} />)}
            {allRows.length===0&&<tr><td colSpan={14} className="px-4 py-8 text-center text-sm text-gray-400">No B2B entries for this period</td></tr>}
          </tbody>
        </table>
      </div>
      <RowContextMenu menu={rowMenu.menu} onClose={rowMenu.close} />

      {adding && (
        <AddPanel onClose={()=>{setDraft(blank());setAdding(false);setIsDiff(false);}}>
          {renderB2BForm({ d: draft, setD: setDraft, isPeriodLocked: true, onSave: saveAdd, onClear: ()=>setDraft(blank()), saveLabel: 'Add Entry' })}
        </AddPanel>
      )}
      </>)}

      {view === 'amend' && (<>
      {/* ── Amendments (B2BA) — Table 4A ── */}
      <AmendDivider section="B2BA" tableNum="4A" />
      <RowContextMenu menu={rowMenu.menu} onClose={rowMenu.close} />

      {amendRows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-indigo-200 shadow-sm mb-3">
          <table className="w-full text-sm">
            <thead><tr className="bg-indigo-50">
              <Th ch="#" /><Th ch="Original Inv No." /><Th ch="Orig. Date (prev. period)" /><Th ch="Amended Inv No." /><Th ch="Amended Date" /><Th ch="GSTIN" /><Th ch="POS" /><Th ch="Rate" /><Th ch="Taxable" right /><Th ch="IGST" right /><Th ch="CGST" right /><Th ch="SGST" right /><Th ch="RCM" />
            </tr></thead>
            <tbody>
              {amendRows.map((row,i) => editAmendId===row.id ? (
                <tr key={row.id} className="bg-indigo-50/40 border-b border-indigo-200">
                  <td colSpan={13} className="p-3">
                    <EditPanel onClose={()=>setEditAmendId(null)}>
                      {renderB2BAmendForm({ d: editAmendDraft, setD: setEditAmendDraft, onSave: saveAmendEdit, onClear: ()=>setEditAmendDraft(blankAmend()), saveLabel: 'Save Changes' })}
                    </EditPanel>
                  </td>
                </tr>
              ) : (
                <tr key={row.id} title="Right-click to edit / delete amendment" onContextMenu={(e)=>rowMenu.open(e,{ onEdit:()=>startEditAmend(row), onDelete:()=>delAmend(row.id) })} className={`border-b border-indigo-100 ${i%2===0?'bg-white':'bg-indigo-50/30'} hover:bg-indigo-50/60`}>
                  <Td dim>{i+1}</Td>
                  <Td><span className="font-mono text-[11px] font-semibold">{row.origInvNum}</span></Td>
                  <Td dim><span className="text-indigo-700">{row.origInvDt}</span></Td>
                  <Td><span className="font-medium">{row.inum}</span></Td>
                  <Td dim>{row.idt}</Td>
                  <Td mono><span className="text-[11px]">{row.ctin||'—'}</span></Td>
                  <Td dim><span className="text-[10px]">{STATE_CODES[row.pos]?.split(' ')[0]||row.pos}</span></Td>
                  <Td dim>{row.itms[0]?.itm_det.rt}%</Td>
                  <Td right mono>{formatIndianCurrency(row.itms[0]?.itm_det.txval??0)}</Td>
                  <Td right mono>{row.itms[0]?.itm_det.iamt?formatIndianCurrency(row.itms[0].itm_det.iamt):'—'}</Td>
                  <Td right mono>{row.itms[0]?.itm_det.camt?formatIndianCurrency(row.itms[0].itm_det.camt):'—'}</Td>
                  <Td right mono>{row.itms[0]?.itm_det.samt?formatIndianCurrency(row.itms[0].itm_det.samt):'—'}</Td>
                  <Td><RCMPill val={row.rchrg} onClick={()=>onChange({...filing,b2ba:amendRows.map(r=>r.id===row.id?{...r,rchrg:r.rchrg==='N'?'Y':'N'}:r)})} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {amendRows.length === 0 && !addingAmend && (
        <p className="text-sm text-gray-400 italic mb-2">No amendments for this period.</p>
      )}

      {!addingAmend
        ? <button type="button" onClick={()=>{setEditAmendId(null);setAddingAmend(true);}} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Click here to add an amendment</button>
        : <AddPanel isAmend={true} onClose={()=>{setDraftAmend(blankAmend());setAddingAmend(false);}}>
            {renderB2BAmendForm({ d: draftAmend, setD: setDraftAmend, onSave: saveAmend, onClear: ()=>setDraftAmend(blankAmend()), saveLabel: 'Add Entry' })}
          </AddPanel>
      }
      </>)}
    </div>
  );
}

// ── B2CL Section ──────────────────────────────────────────────────────────────

function B2CLSection({ autoRows, filing, onChange, period, companyStateCode, onDeleteAuto, view = 'regular' }: {
  autoRows:B2CLInvoice[]; filing:GSTR1Filing; onChange:(f:GSTR1Filing)=>void; period:string; companyStateCode:string; onDeleteAuto:(id:string)=>void; view?:'regular'|'amend';
}) {
  const defaultPOS = companyStateCode === '29' ? '27' : '29'; // default to a different state
  const blk = (): B2CLInvoice => ({ id:uid(), inum:'', idt:'', val:0, pos:defaultPOS, itms:[{num:1,itm_det:{rt:18,txval:0,iamt:0}}] });
  const blkAmend = (): B2CLInvoice => ({ ...blk(), isAmended:true, origInvNum:'', origInvDt:'' });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<B2CLInvoice>(blk());
  const [addingAmend, setAddingAmend] = useState(false);
  const [draftAmend, setDraftAmend] = useState<B2CLInvoice>(blkAmend());
  const [editAmendId, setEditAmendId] = useState<string|null>(null);
  const [editAmendDraft, setEditAmendDraft] = useState<B2CLInvoice>(blkAmend());
  const [editId, setEditId] = useState<string|null>(null);
  const [editDraft, setEditDraft] = useState<B2CLInvoice>(blk());

  const all = [...autoRows, ...filing.b2cl];
  const amendRows = filing.b2cla ?? [];
  const totalTxval = all.reduce((s,r)=>s+(r.itms[0]?.itm_det.txval??0),0);
  const totalIgst  = all.reduce((s,r)=>s+(r.itms[0]?.itm_det.iamt??0),0);

  // B2CL is always inter-state → always IGST
  const autoIgst = (txval:number, rt:number) => Math.round(txval*rt/100*100)/100;
  const itmD = (base:B2CLInvoice, v:Partial<typeof base.itms[0]['itm_det']>) => [{num:1,itm_det:{...base.itms[0].itm_det,...v}}];
  const aboveThreshold = (txval:number) => txval > 100000;

  const saveAdd  = () => { onChange({...filing,b2cl:[...filing.b2cl,draft]}); setDraft(blk()); setAdding(false); };
  const saveAmend= () => { onChange({...filing,b2cla:[...amendRows,{...draftAmend,isAmended:true}]}); setDraftAmend(blkAmend()); setAddingAmend(false); };
  const del      = (id:string) => onChange({...filing,b2cl:filing.b2cl.filter(r=>r.id!==id)});
  const delAmend = (id:string) => onChange({...filing,b2cla:(filing.b2cla??[]).filter(r=>r.id!==id)});
  const startEdit= (row:B2CLInvoice) => { setEditId(row.id); setEditDraft({...row}); };
  const startEditAmend = (row:B2CLInvoice) => { setAddingAmend(false); setEditAmendId(row.id); setEditAmendDraft({...row}); };
  const saveAmendEdit = () => { onChange({...filing,b2cla:amendRows.map(r=>r.id===editAmendId?{...editAmendDraft,isAmended:true}:r)}); setEditAmendId(null); };
  const rowMenu = useRowMenu();
  const saveEdit = () => { onChange({...filing,b2cl:filing.b2cl.map(r=>r.id===editId?editDraft:r)}); setEditId(null); };

  // Shared B2CLA amend form body — used by both the "+ add amendment" panel and in-place row edit.
  const renderB2CLAmendForm = ({ d, setD, onSave, onClear, saveLabel }:{ d:B2CLInvoice; setD:(v:B2CLInvoice)=>void; onSave:()=>void; onClear:()=>void; saveLabel:string }) => (
    <>
      <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mb-3">Fill original invoice details (from a previously filed period) + the corrected/amended values below.</p>
      <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/70 rounded-lg border border-indigo-200 mb-3">
        <F label="Original Invoice No. (being amended)"><Inp value={d.origInvNum||''} onChange={v=>setD({...d,origInvNum:v})} placeholder="Old INV-001" /></F>
        <F label="Original Invoice Date (previous period)"><DatePicker value={d.origInvDt||''} onChange={v=>setD({...d,origInvDt:v})} /></F>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <F label="Amended Invoice No."><Inp value={d.inum} onChange={v=>setD({...d,inum:v})} placeholder="INV-001A" /></F>
        <F label="Amended Invoice Date"><DatePicker value={d.idt} onChange={v=>setD({...d,idt:v})} period={period} /></F>
        <F label="Invoice Value (₹)"><Inp value={d.val||''} onChange={v=>setD({...d,val:parseFloat(v)||0})} className="text-right" /></F>
        <F label="Place of Supply">
          <Sel value={d.pos} onChange={v=>setD({...d,pos:v})} options={STATE_OPTS.filter(s=>s.value!==companyStateCode)} />
        </F>
        <F label="Rate (%)">
          <Sel value={String(d.itms[0]?.itm_det.rt??18)} onChange={v=>{ const rt=parseFloat(v); const iamt=autoIgst(d.itms[0]?.itm_det.txval??0,rt); setD({...d,itms:[{num:1,itm_det:{...d.itms[0].itm_det,rt,iamt}}]}); }} options={RATE_OPTS} />
        </F>
        <F label="Taxable Value (₹)">
          <Inp value={d.itms[0]?.itm_det.txval||''} onChange={v=>{ const tv=parseFloat(v)||0; const iamt=autoIgst(tv,d.itms[0]?.itm_det.rt??18); setD({...d,itms:[{num:1,itm_det:{...d.itms[0].itm_det,txval:tv,iamt}}]}); }} className="text-right" />
        </F>
        <F label="IGST (₹) — auto-calculated">
          <Inp value={d.itms[0]?.itm_det.iamt||''} onChange={v=>setD({...d,itms:[{num:1,itm_det:{...d.itms[0].itm_det,iamt:parseFloat(v)||0}}]})} className="text-right bg-purple-50" />
        </F>
      </div>
      <AddBtns onSave={onSave} onClear={onClear} saveLabel={saveLabel} />
    </>
  );

  return (
    <div>
      {view !== 'amend' && (<>
      {/* B2CL rule note */}
      <div className="mb-3 p-2.5 bg-purple-50 border border-purple-200 rounded-lg flex gap-2 text-[11px] text-purple-800">
        <span className="shrink-0">ℹ</span>
        <span><strong>B2CL Rule (Table 5):</strong> Inter-state supplies to <em>unregistered</em> persons where taxable value exceeds <strong>₹1,00,000</strong>. Always IGST (no CGST/SGST). Invoices below ₹1L threshold go to B2CS instead.</span>
      </div>

      <SummaryStrip taxable={totalTxval} igst={totalIgst} cgst={0} sgst={0} />
      <SectionHeader addLabel="Add B2CL entry" onAdd={()=>setAdding(true)} hideAdd={adding} />

      {/* Main table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead><tr>
            <Th ch="#" /><Th ch="Invoice No." /><Th ch="Invoice Date" /><Th ch="Invoice Value" right /><Th ch="Place of Supply" /><Th ch="Rate%" /><Th ch="Taxable Value" right /><Th ch="IGST (Inter-state)" right /><Th ch="Cess" right /><Th />
          </tr></thead>
          <tbody>
            {autoRows.map((row,i)=>(
              <tr key={row.id} title="Right-click for delete" onContextMenu={(e)=>rowMenu.open(e,{ onDelete:()=>{ if(window.confirm('Delete this auto-imported invoice? Journal entries are not affected.')) onDeleteAuto(row.id); } })} className="bg-blue-50/30 hover:bg-blue-50/60 border-b border-gray-100">
                <Td dim><span className="text-[10px]">{i+1}</span></Td>
                <Td><div className="flex items-center gap-1.5"><BooksBadge /><span className="font-medium">{row.inum}</span></div></Td>
                <Td dim>{row.idt}</Td>
                <Td right mono>{formatIndianCurrency(row.val)}</Td>
                <Td dim><span className="text-[11px] text-purple-600">{STATE_CODES[row.pos]?.split(' ')[0]||row.pos}</span></Td>
                <Td dim>{row.itms[0]?.itm_det.rt}%</Td>
                <Td right mono>{formatIndianCurrency(row.itms[0]?.itm_det.txval??0)}</Td>
                <Td right mono>{formatIndianCurrency(row.itms[0]?.itm_det.iamt??0)}</Td>
                <Td right mono dim>—</Td>
                <td className="px-2 border-b border-gray-100" />
              </tr>
            ))}
            {filing.b2cl.map((row,i) => editId===row.id ? (
              <tr key={row.id} className="bg-green-50 border-b border-green-200">
                <td colSpan={10} className="p-3">
                  <EditPanel onClose={()=>setEditId(null)}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <F label="Invoice No."><Inp value={editDraft.inum} onChange={v=>setEditDraft({...editDraft,inum:v})} /></F>
                      <F label="Invoice Date"><DatePicker value={editDraft.idt} onChange={v=>setEditDraft({...editDraft,idt:v})} period={period} /></F>
                      <F label="Value (₹)"><Inp value={editDraft.val||''} onChange={v=>setEditDraft({...editDraft,val:parseFloat(v)||0})} className="text-right" /></F>
                      <F label="Place of Supply (inter-state)">
                        <Sel value={editDraft.pos} onChange={v=>setEditDraft({...editDraft,pos:v})} options={STATE_OPTS.filter(s=>s.value!==companyStateCode)} />
                      </F>
                      <F label="Rate (%)">
                        <Sel value={String(editDraft.itms[0]?.itm_det.rt??18)} onChange={v=>{ const rt=parseFloat(v); const iamt=autoIgst(editDraft.itms[0]?.itm_det.txval??0,rt); setEditDraft({...editDraft,itms:itmD(editDraft,{rt,iamt})}); }} options={RATE_OPTS} />
                      </F>
                      <F label="Taxable (₹)">
                        <Inp value={editDraft.itms[0]?.itm_det.txval||''} onChange={v=>{ const tv=parseFloat(v)||0; const iamt=autoIgst(tv,editDraft.itms[0]?.itm_det.rt??18); setEditDraft({...editDraft,itms:itmD(editDraft,{txval:tv,iamt})}); }} className="text-right" />
                        {(editDraft.itms[0]?.itm_det.txval??0)>0&&!aboveThreshold(editDraft.itms[0]?.itm_det.txval??0)&&<p className="text-[10px] text-amber-600 mt-0.5">⚠ Below ₹1L — should be in B2CS</p>}
                      </F>
                      <F label="IGST (₹) — auto-calc">
                        <Inp value={editDraft.itms[0]?.itm_det.iamt||''} onChange={v=>setEditDraft({...editDraft,itms:itmD(editDraft,{iamt:parseFloat(v)||0})})} className="text-right bg-purple-50" />
                      </F>
                    </div>
                    <SaveCancelBtns onSave={saveEdit} onCancel={()=>setEditId(null)} />
                  </EditPanel>
                </td>
              </tr>
            ) : (
              <tr key={row.id} title="Right-click for edit / delete" onContextMenu={(e)=>rowMenu.open(e,{ onEdit:()=>startEdit(row), onDelete:()=>del(row.id) })} className={`hover:bg-gray-50 border-b border-gray-100 ${i%2===1?'bg-gray-50/40':''}`}>
                <Td dim><span className="text-[10px]">{autoRows.length+i+1}</span></Td>
                <Td><span className="font-medium">{row.inum}</span></Td>
                <Td dim>{row.idt}</Td>
                <Td right mono>{formatIndianCurrency(row.val)}</Td>
                <Td dim><span className="text-[11px] text-purple-600">{STATE_CODES[row.pos]?.split(' ')[0]||row.pos}</span></Td>
                <Td dim>{row.itms[0]?.itm_det.rt}%</Td>
                <Td right mono>
                  <div>{formatIndianCurrency(row.itms[0]?.itm_det.txval??0)}</div>
                  {!aboveThreshold(row.itms[0]?.itm_det.txval??0)&&<div className="text-[9px] text-amber-500">⚠ below ₹1L</div>}
                </Td>
                <Td right mono>{formatIndianCurrency(row.itms[0]?.itm_det.iamt??0)}</Td>
                <Td right mono dim>{row.itms[0]?.itm_det.csamt?formatIndianCurrency(row.itms[0].itm_det.csamt):'—'}</Td>
                <td className="px-2 border-b border-gray-100" />
              </tr>
            ))}
            {all.length===0&&<tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">No B2CL invoices for this period</td></tr>}
          </tbody>
        </table>
      </div>

      <RowContextMenu menu={rowMenu.menu} onClose={rowMenu.close} />

      {adding && <AddPanel onClose={()=>{setDraft(blk());setAdding(false);}}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <F label="Invoice No."><Inp value={draft.inum} onChange={v=>setDraft({...draft,inum:v})} placeholder="INV-001" /></F>
              <F label="Invoice Date"><DatePicker value={draft.idt} onChange={v=>setDraft({...draft,idt:v})} period={period} /></F>
              <F label="Invoice Value (₹)"><Inp value={draft.val||''} onChange={v=>setDraft({...draft,val:parseFloat(v)||0})} className="text-right" /></F>
              <F label="Place of Supply (inter-state only)">
                <Sel value={draft.pos} onChange={v=>setDraft({...draft,pos:v})} options={STATE_OPTS.filter(s=>s.value!==companyStateCode)} />
                <p className="text-[9px] text-purple-600 mt-0.5">Different state from yours → IGST applies</p>
              </F>
              <F label="Tax Rate (%)">
                <Sel value={String(draft.itms[0]?.itm_det.rt??18)} onChange={v=>{ const rt=parseFloat(v); const iamt=autoIgst(draft.itms[0]?.itm_det.txval??0,rt); setDraft({...draft,itms:itmD(draft,{rt,iamt})}); }} options={RATE_OPTS} />
              </F>
              <F label="Taxable Value (₹)">
                <Inp value={draft.itms[0]?.itm_det.txval||''} onChange={v=>{ const tv=parseFloat(v)||0; const iamt=autoIgst(tv,draft.itms[0]?.itm_det.rt??18); setDraft({...draft,itms:itmD(draft,{txval:tv,iamt})}); }} className="text-right" />
                {(draft.itms[0]?.itm_det.txval??0)>0&&!aboveThreshold(draft.itms[0]?.itm_det.txval??0)&&<p className="text-[10px] text-amber-600 mt-0.5">⚠ Below ₹1,00,000 — use B2CS instead</p>}
              </F>
              <F label="IGST (₹) — auto-calculated">
                <Inp value={draft.itms[0]?.itm_det.iamt||''} onChange={v=>setDraft({...draft,itms:itmD(draft,{iamt:parseFloat(v)||0})})} className="text-right bg-purple-50" />
              </F>
              <F label="Cess (₹)"><Inp value={draft.itms[0]?.itm_det.csamt||''} onChange={v=>setDraft({...draft,itms:itmD(draft,{csamt:parseFloat(v)||undefined})})} placeholder="0" className="text-right" /></F>
            </div>
            <AddBtns onSave={saveAdd} onClear={()=>setDraft(blk())} />
          </AddPanel>
      }
      </>)}

      {view === 'amend' && (<>
      {/* ── Amendments (B2CLA) — Table 5A ── */}
      <AmendDivider section="B2CLA" tableNum="5A" />
      <RowContextMenu menu={rowMenu.menu} onClose={rowMenu.close} />

      {amendRows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-indigo-200 shadow-sm mb-3">
          <table className="w-full text-sm">
            <thead><tr className="bg-indigo-50">
              <Th ch="#" /><Th ch="Original Inv No." /><Th ch="Orig. Date (prev. period)" /><Th ch="Amended Inv No." /><Th ch="Amended Date" /><Th ch="POS" /><Th ch="Rate" /><Th ch="Taxable" right /><Th ch="IGST" right /><Th />
            </tr></thead>
            <tbody>
              {amendRows.map((row,i)=> editAmendId===row.id ? (
                <tr key={row.id} className="bg-indigo-50/40 border-b border-indigo-200">
                  <td colSpan={10} className="p-3">
                    <EditPanel onClose={()=>setEditAmendId(null)}>
                      {renderB2CLAmendForm({ d: editAmendDraft, setD: setEditAmendDraft, onSave: saveAmendEdit, onClear: ()=>setEditAmendDraft(blkAmend()), saveLabel: 'Save Changes' })}
                    </EditPanel>
                  </td>
                </tr>
              ) : (
                <tr key={row.id} title="Right-click to edit / delete amendment" onContextMenu={(e)=>rowMenu.open(e,{ onEdit:()=>startEditAmend(row), onDelete:()=>delAmend(row.id) })} className={`border-b border-indigo-100 ${i%2===0?'bg-white':'bg-indigo-50/30'} hover:bg-indigo-50/60`}>
                  <Td dim>{i+1}</Td>
                  <Td><span className="font-mono text-[11px] font-semibold">{row.origInvNum}</span></Td>
                  <Td dim><span className="text-indigo-700">{row.origInvDt}</span></Td>
                  <Td><span className="font-medium">{row.inum}</span></Td>
                  <Td dim>{row.idt}</Td>
                  <Td dim><span className="text-[11px] text-purple-600">{STATE_CODES[row.pos]?.split(' ')[0]||row.pos}</span></Td>
                  <Td dim>{row.itms[0]?.itm_det.rt}%</Td>
                  <Td right mono>{formatIndianCurrency(row.itms[0]?.itm_det.txval??0)}</Td>
                  <Td right mono>{formatIndianCurrency(row.itms[0]?.itm_det.iamt??0)}</Td>
                  <td className="px-2 border-b border-indigo-100" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {amendRows.length===0&&!addingAmend&&<p className="text-sm text-gray-400 italic mb-2">No amendments for this period.</p>}

      {!addingAmend
        ? <button type="button" onClick={()=>{setEditAmendId(null);setAddingAmend(true);}} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Click here to add an amendment</button>
        : <AddPanel isAmend={true} onClose={()=>{setDraftAmend(blkAmend());setAddingAmend(false);}}>
            {renderB2CLAmendForm({ d: draftAmend, setD: setDraftAmend, onSave: saveAmend, onClear: ()=>setDraftAmend(blkAmend()), saveLabel: 'Add Entry' })}
          </AddPanel>
      }
      </>)}
    </div>
  );
}

// ── B2CS Section ──────────────────────────────────────────────────────────────

function B2CSSection({ autoRows, filing, onChange, view='regular', period='' }: { autoRows:B2CSSummary[]; filing:GSTR1Filing; onChange:(f:GSTR1Filing)=>void; view?:'regular'|'amend'; period?:string }) {
  const isAmend = view === 'amend';
  const listKey = isAmend ? 'b2csa' as const : 'b2cs' as const;
  const [adding, setAdding] = useState(false);
  const blk = (): B2CSSummary => ({ id:uid(), sply_ty:'INTRA', typ:'OE', pos:'27', rt:18, txval:0, ...(isAmend?{omon:'',isAmended:true}:{}) });
  const [d, setD] = useState<B2CSSummary>(blk());
  const autoList = isAmend ? [] : autoRows;
  const manualList: B2CSSummary[] = isAmend ? (filing.b2csa ?? []) : filing.b2cs;
  const all = [...autoList, ...manualList];
  const totalTxval = all.reduce((s,r)=>s+r.txval,0);
  const totalIgst = all.reduce((s,r)=>s+(r.iamt??0),0);
  const totalCgst = all.reduce((s,r)=>s+(r.camt??0),0);
  const totalSgst = all.reduce((s,r)=>s+(r.samt??0),0);
  const maxOmon = (() => { if(!period||period.length<6) return undefined; let mm=parseInt(period.slice(0,2),10); let yy=parseInt(period.slice(2),10); mm--; if(mm<1){mm=12;yy--;} return String(mm).padStart(2,'0')+String(yy); })();
  const add = () => { onChange({...filing,[listKey]:[...manualList,d]}); setD(blk()); setAdding(false); };
  const del = (id:string) => onChange({...filing,[listKey]:manualList.filter(r=>r.id!==id)});
  const rowMenu = useRowMenu();

  return (
    <div>
      <SummaryStrip taxable={totalTxval} igst={totalIgst} cgst={totalCgst} sgst={totalSgst} />
      <SectionHeader addLabel={isAmend?'Add B2CSA entry':'Add B2CS entry'} onAdd={()=>setAdding(true)} hideAdd={adding} />
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead><tr>
            {isAmend && <Th ch="Orig. Month" />}<Th ch="Type" /><Th ch="Place of Supply" /><Th ch="Rate%" /><Th ch="Taxable Value" right /><Th ch="IGST" right /><Th ch="CGST" right /><Th ch="SGST/UTGST" right /><Th ch="Cess" right /><Th />
          </tr></thead>
          <tbody>
            {autoList.map(r=>(
              <tr key={r.id} className="bg-blue-50/30 hover:bg-blue-50/60">
                <Td><div className="flex items-center gap-1.5"><BooksBadge />{r.sply_ty}</div></Td>
                <Td dim>{STATE_CODES[r.pos]||r.pos}</Td><Td dim>{r.rt}%</Td>
                <Td right mono>{formatIndianCurrency(r.txval)}</Td>
                <Td right mono>{r.iamt?formatIndianCurrency(r.iamt):'—'}</Td>
                <Td right mono>{r.camt?formatIndianCurrency(r.camt):'—'}</Td>
                <Td right mono>{r.samt?formatIndianCurrency(r.samt):'—'}</Td>
                <Td right mono dim>—</Td>
                <td className="px-2 border-b border-gray-100" />
              </tr>
            ))}
            {manualList.map(r=>(
              <tr key={r.id} title="Right-click for delete" onContextMenu={(e)=>rowMenu.open(e,{ onDelete:()=>del(r.id) })} className={isAmend?'border-b border-indigo-100 hover:bg-indigo-50/60':'hover:bg-gray-50'}>
                {isAmend && <Td dim>{r.omon||'—'}</Td>}
                <Td>{r.sply_ty}{r.typ==='E'&&<span className="ml-1 text-[9px] font-semibold text-purple-600">E</span>}</Td>
                <Td dim>{STATE_CODES[r.pos]||r.pos}</Td><Td dim>{r.rt}%</Td>
                <Td right mono>{formatIndianCurrency(r.txval)}</Td>
                <Td right mono>{r.iamt?formatIndianCurrency(r.iamt):'—'}</Td>
                <Td right mono>{r.camt?formatIndianCurrency(r.camt):'—'}</Td>
                <Td right mono>{r.samt?formatIndianCurrency(r.samt):'—'}</Td>
                <Td right mono dim>{r.csamt?formatIndianCurrency(r.csamt):'—'}</Td>
                <td className="px-2 border-b border-gray-100" />
              </tr>
            ))}
            {all.length===0&&<tr><td colSpan={isAmend?10:9} className="px-4 py-8 text-center text-sm text-gray-400">No {isAmend?'B2CS amendments':'B2CS supplies'} for this period</td></tr>}
          </tbody>
        </table>
      </div>
      <RowContextMenu menu={rowMenu.menu} onClose={rowMenu.close} />
      {adding&&(
        <AddPanel onClose={()=>setAdding(false)} isAmend={isAmend}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {isAmend && <F label="Original Month (being amended)"><MonthPickerMMYYYY value={d.omon??''} onChange={v=>setD({...d,omon:v})} max={maxOmon} /></F>}
            <F label="Supply Type — sets IGST or CGST+SGST">
              <div className="flex gap-2 mt-0.5">
                {(['INTRA','INTER'] as const).map(t=>(
                  <button key={t} type="button" onClick={()=>{ const isInter=t==='INTER'; const rt=d.rt; const tv=d.txval; const iamt=isInter?Math.round(tv*rt/100*100)/100:undefined; const camt=!isInter?Math.round(tv*rt/200*100)/100:undefined; const samt=camt; setD({...d,sply_ty:t,iamt,camt,samt}); }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors ${d.sply_ty===t?(t==='INTER'?'bg-purple-600 text-white border-purple-600':'bg-green-600 text-white border-green-600'):'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                    {t}<span className="opacity-70 text-[9px] block">{t==='INTER'?'→ IGST':'→ CGST+SGST'}</span>
                  </button>
                ))}
              </div>
            </F>
            <F label="Place of Supply"><Sel value={d.pos} onChange={v=>setD({...d,pos:v})} options={STATE_OPTS} /></F>
            <F label="Rate (%)">
              <Sel value={String(d.rt)} onChange={v=>{ const rt=parseFloat(v); const isInter=d.sply_ty==='INTER'; const iamt=isInter?Math.round(d.txval*rt/100*100)/100:undefined; const camt=!isInter?Math.round(d.txval*rt/200*100)/100:undefined; setD({...d,rt,iamt,camt,samt:camt}); }} options={RATE_OPTS} />
            </F>
            <F label="Taxable Value (₹)">
              <Inp value={d.txval||''} onChange={v=>{ const tv=parseFloat(v)||0; const isInter=d.sply_ty==='INTER'; const iamt=isInter?Math.round(tv*d.rt/100*100)/100:undefined; const camt=!isInter?Math.round(tv*d.rt/200*100)/100:undefined; setD({...d,txval:tv,iamt,camt,samt:camt}); }} className="text-right" />
            </F>
            {d.sply_ty==='INTER'
              ? <F label="IGST (₹) — auto-calculated"><Inp value={d.iamt??''} onChange={v=>setD({...d,iamt:parseFloat(v)||undefined})} placeholder="0" className="text-right bg-purple-50" /></F>
              : <>
                  <F label="CGST (₹) — auto-calculated"><Inp value={d.camt??''} onChange={v=>setD({...d,camt:parseFloat(v)||undefined})} placeholder="0" className="text-right bg-green-50" /></F>
                  <F label="SGST/UTGST (₹) — auto-calculated"><Inp value={d.samt??''} onChange={v=>setD({...d,samt:parseFloat(v)||undefined})} placeholder="0" className="text-right bg-green-50" /></F>
                </>
            }
            <F label="Cess (₹)"><Inp value={d.csamt||''} onChange={v=>setD({...d,csamt:parseFloat(v)||undefined})} placeholder="0" className="text-right" /></F>
            <F label="Supply via e-commerce? (typ)"><Sel value={d.typ??'OE'} onChange={v=>setD({...d,typ:v as 'OE'|'E'})} options={[{value:'OE',label:'OE – Ordinary'},{value:'E',label:'E – via e-com operator'}]} /></F>
            {d.typ==='E' && <F label="E-com Operator GSTIN (etin)"><Inp value={d.etin||''} onChange={v=>setD({...d,etin:v.toUpperCase()})} placeholder="29AAAAA0000A1Z5" /></F>}
          </div>
          <AddBtns onSave={add} onClear={()=>setD(blk())} />
        </AddPanel>
      )}
    </div>
  );
}

// ── EXP Section ───────────────────────────────────────────────────────────────

function EXPSection({ autoRows, filing, onChange, onDeleteAuto, view='regular' }: { autoRows: EXPInvoice[]; filing:GSTR1Filing; onChange:(f:GSTR1Filing)=>void; onDeleteAuto:(id:string)=>void; view?:'regular'|'amend' }) {
  const isAmend = view === 'amend';
  const listKey = isAmend ? 'expa' as const : 'exp' as const;
  const [adding, setAdding] = useState(false);
  const blk = (): EXPInvoice => ({ id:uid(), exp_typ:'WOPAY', inum:'', idt:'', val:0, itms:[{txval:0,rt:0}], ...(isAmend?{origInvNum:'',origInvDt:'',isAmended:true}:{}) });
  const [d, setD] = useState<EXPInvoice>(blk());
  const autoList = isAmend ? [] : autoRows;
  const manualList: EXPInvoice[] = isAmend ? (filing.expa ?? []) : filing.exp;
  const add = () => { onChange({...filing,[listKey]:[...manualList,d]}); setD(blk()); setAdding(false); };
  const del = (id:string) => onChange({...filing,[listKey]:manualList.filter(r=>r.id!==id)});
  const rowMenu = useRowMenu();
  const allRows = [...autoList, ...manualList];
  const setExpTyp = (et:'WPAY'|'WOPAY') => setD({...d, exp_typ:et, itms:[{...d.itms[0], iamt: et==='WOPAY' ? undefined : d.itms[0].iamt}]}); // WOPAY → no IGST
  return (
    <div>
      <SectionHeader addLabel={isAmend?'Add EXPA entry':'Add export entry'} onAdd={()=>setAdding(true)} hideAdd={adding} />
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead><tr>
            {isAmend && <><Th ch="Orig. Inv No." /><Th ch="Orig. Date" /></>}<Th ch="Export Type" /><Th ch="Invoice No." /><Th ch="Invoice Date" /><Th ch="Invoice Value" right /><Th ch="Shipping Bill No." /><Th ch="Shipping Bill Date" /><Th ch="Port Code" /><Th ch="Rate%" /><Th ch="Taxable Value" right /><Th ch="IGST" right /><Th />
          </tr></thead>
          <tbody>
            {autoList.map(r=>(
              <tr key={r.id} title="Right-click for delete" onContextMenu={(e)=>rowMenu.open(e,{ onDelete:()=>{ if(window.confirm('Delete this auto-imported export invoice? Journal entries are not affected.')) onDeleteAuto(r.id); } })} className="bg-blue-50/30 hover:bg-blue-50/60">
                <Td>{r.exp_typ}</Td><Td><div className="flex items-center gap-1"><BooksBadge />{r.inum}</div></Td><Td dim>{r.idt}</Td>
                <Td right mono>{formatIndianCurrency(r.val)}</Td>
                <Td dim>{r.sbnum||'—'}</Td><Td dim>{r.sbdt||'—'}</Td><Td dim>{r.sbpcode||'—'}</Td>
                <Td dim>{r.itms[0]?.rt}%</Td>
                <Td right mono>{formatIndianCurrency(r.itms[0]?.txval??0)}</Td>
                <Td right mono>{r.itms[0]?.iamt?formatIndianCurrency(r.itms[0].iamt):'—'}</Td>
                <td className="px-2 border-b border-gray-100" />
              </tr>
            ))}
            {manualList.map(r=>(
              <tr key={r.id} title="Right-click for delete" onContextMenu={(e)=>rowMenu.open(e,{ onDelete:()=>del(r.id) })} className={isAmend?'border-b border-indigo-100 hover:bg-indigo-50/60':'hover:bg-gray-50'}>
                {isAmend && <><Td dim>{r.origInvNum||'—'}</Td><Td dim>{r.origInvDt||'—'}</Td></>}
                <Td>{r.exp_typ}</Td><Td>{r.inum}</Td><Td dim>{r.idt}</Td>
                <Td right mono>{formatIndianCurrency(r.val)}</Td>
                <Td dim>{r.sbnum||'—'}</Td><Td dim>{r.sbdt||'—'}</Td><Td dim>{r.sbpcode||'—'}</Td>
                <Td dim>{r.itms[0]?.rt}%</Td>
                <Td right mono>{formatIndianCurrency(r.itms[0]?.txval??0)}</Td>
                <Td right mono>{r.itms[0]?.iamt?formatIndianCurrency(r.itms[0].iamt):'—'}</Td>
                <td className="px-2 border-b border-gray-100" />
              </tr>
            ))}
            {allRows.length===0&&<tr><td colSpan={isAmend?13:11} className="px-4 py-8 text-center text-sm text-gray-400">No {isAmend?'export amendments':'exports'} for this period</td></tr>}
          </tbody>
        </table>
      </div>
      <RowContextMenu menu={rowMenu.menu} onClose={rowMenu.close} />
      {adding&&(
        <AddPanel onClose={()=>setAdding(false)} isAmend={isAmend}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {isAmend && <><F label="Original Invoice No. (being amended)"><Inp value={d.origInvNum||''} onChange={v=>setD({...d,origInvNum:v})} placeholder="Old EXP-001" /></F><F label="Original Invoice Date (prior period)"><DatePicker value={d.origInvDt||''} onChange={v=>setD({...d,origInvDt:v})} /></F></>}
            <F label="Export Type"><Sel value={d.exp_typ} onChange={v=>setExpTyp(v as 'WPAY'|'WOPAY')} options={[{value:'WOPAY',label:'WOPAY – Without Payment'},{value:'WPAY',label:'WPAY – With Payment'}]} /></F>
            <F label="Invoice No."><Inp value={d.inum} onChange={v=>setD({...d,inum:v})} placeholder="INV-001" /></F>
            <F label="Invoice Date"><DatePicker value={d.idt} onChange={v=>setD({...d,idt:v})} /></F>
            <F label="Invoice Value (₹)"><Inp value={d.val||''} onChange={v=>setD({...d,val:parseFloat(v)||0})} className="text-right" /></F>
            <F label="Shipping Bill No. (optional)"><Inp value={d.sbnum||''} onChange={v=>setD({...d,sbnum:v})} /></F>
            <F label="Shipping Bill Date (optional)"><DatePicker value={d.sbdt||''} onChange={v=>setD({...d,sbdt:v})} /></F>
            <F label="Port Code (optional)"><Inp value={d.sbpcode||''} onChange={v=>setD({...d,sbpcode:v})} placeholder="INBOM4" /></F>
            <F label="Rate (%)"><Sel value={String(d.itms[0]?.rt??0)} onChange={v=>setD({...d,itms:[{...d.itms[0],rt:parseFloat(v)}]})} options={RATE_OPTS} /></F>
            <F label="Taxable Value (₹)"><Inp value={d.itms[0]?.txval||''} onChange={v=>setD({...d,itms:[{...d.itms[0],txval:parseFloat(v)||0}]})} className="text-right" /></F>
            <F label={d.exp_typ==='WOPAY'?'IGST — must be 0 (WOPAY)':'IGST (₹)'}><Inp value={d.exp_typ==='WOPAY'?'':(d.itms[0]?.iamt||'')} onChange={v=>{ if(d.exp_typ==='WOPAY') return; setD({...d,itms:[{...d.itms[0],iamt:parseFloat(v)||undefined}]}); }} className="text-right" placeholder="0" /></F>
          </div>
          <AddBtns onSave={add} onClear={()=>setD(blk())} />
        </AddPanel>
      )}
    </div>
  );
}

// ── CDNR Section ──────────────────────────────────────────────────────────────

function CDNRSection({ autoRows, filing, onChange, onDeleteAuto, view='regular' }: { autoRows: CDNRNote[]; filing:GSTR1Filing; onChange:(f:GSTR1Filing)=>void; onDeleteAuto:(id:string)=>void; view?:'regular'|'amend' }) {
  const isAmend = view === 'amend';
  const listKey: 'cdnra'|'cdnr' = isAmend ? 'cdnra' : 'cdnr';
  const list = filing[listKey];
  const [adding, setAdding] = useState(false);
  const blk = (): CDNRNote => ({ id:uid(), ctin:'', ntty:'C', nt:[{ntnum:'',ntdt:'',val:0,pos:'27',inv_typ:'R',rchrg:'N',p_gst:'N',...(isAmend?{ont_num:'',ont_dt:''}:{}),itms:[{num:1,itm_det:{rt:18,txval:0}}]}], ...(isAmend?{isAmended:true}:{}) });
  const [d, setD] = useState<CDNRNote>(blk());
  const nt0 = d.nt[0];
  const isSez = nt0.inv_typ === 'SEWP' || nt0.inv_typ === 'SEWOP'; // SEZ = inter-state → IGST only
  const add = () => { onChange({...filing,[listKey]:[...list,d]}); setD(blk()); setAdding(false); };
  const del = (id:string) => onChange({...filing,[listKey]:list.filter(r=>r.id!==id)});
  const rowMenu = useRowMenu();
  const setNt = (v: Partial<typeof nt0>) => setD({...d,nt:[{...nt0,...v}]});
  const setItm = (v: Partial<typeof nt0.itms[0]['itm_det']>) => setD({...d,nt:[{...nt0,itms:[{num:1,itm_det:{...nt0.itms[0].itm_det,...v}}]}]});
  // SEZ two-tier gate: switching TO a SEZ supply type wipes intra-state CGST/SGST (SEZ is inter-state only)
  const setInvTyp = (v: CDNRNote['nt'][0]['inv_typ']) => {
    const sez = v === 'SEWP' || v === 'SEWOP';
    setD({...d,nt:[{...nt0,inv_typ:v,itms:[{num:1,itm_det:{...nt0.itms[0].itm_det,...(sez?{camt:undefined,samt:undefined}:{})}}]}]});
  };
  const allRows = [...autoRows, ...list];
  const emptyMsg = isAmend ? 'No amendments to earlier registered notes' : 'No credit/debit notes to registered persons';
  const renderRow = (r: CDNRNote, auto: boolean) => (
    <tr key={r.id} title="Right-click for delete" onContextMenu={(e)=>rowMenu.open(e, auto?{ onDelete:()=>{ if(window.confirm('Delete this auto-imported credit/debit note? Journal entries are not affected.')) onDeleteAuto(r.id); } }:{ onDelete:()=>del(r.id) })} className={auto?'bg-blue-50/30 hover:bg-blue-50/60':'hover:bg-gray-50'}>
      <Td mono>{auto?<div className="flex items-center gap-1"><BooksBadge /><span className="text-[11px]">{r.ctin}</span></div>:r.ctin}</Td>
      {isAmend&&<Td dim mono>{r.nt[0]?.ont_num||'—'}</Td>}
      <Td>{r.nt[0]?.ntnum}</Td><Td dim>{r.nt[0]?.ntdt}</Td>
      <Td><span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${r.ntty==='C'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{r.ntty==='C'?'Credit':'Debit'}</span></Td>
      <Td right mono>{formatIndianCurrency(r.nt[0]?.val??0)}</Td>
      <Td dim>{r.nt[0]?.itms[0]?.itm_det.rt}%</Td>
      <Td right mono>{formatIndianCurrency(r.nt[0]?.itms[0]?.itm_det.txval??0)}</Td>
      <Td right mono>{r.nt[0]?.itms[0]?.itm_det.iamt?formatIndianCurrency(r.nt[0].itms[0].itm_det.iamt):'—'}</Td>
      <Td right mono>{r.nt[0]?.itms[0]?.itm_det.camt?formatIndianCurrency(r.nt[0].itms[0].itm_det.camt):'—'}</Td>
      <Td right mono>{r.nt[0]?.itms[0]?.itm_det.samt?formatIndianCurrency(r.nt[0].itms[0].itm_det.samt):'—'}</Td>
      <td className="px-2 border-b border-gray-100" />
    </tr>
  );
  return (
    <div>
      <SectionHeader addLabel={isAmend?'Add entry':'Add note'} onAdd={()=>setAdding(true)} hideAdd={adding} />
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead><tr>
            <Th ch="GSTIN of Recipient" />{isAmend&&<Th ch="Original Note No." />}<Th ch="Note No." /><Th ch="Note Date" /><Th ch="Note Type" /><Th ch="Note Value" right /><Th ch="Rate%" /><Th ch="Taxable" right /><Th ch="IGST" right /><Th ch="CGST" right /><Th ch="SGST" right /><Th />
          </tr></thead>
          <tbody>
            {autoRows.map(r=>renderRow(r,true))}
            {list.map(r=>renderRow(r,false))}
            {allRows.length===0&&<tr><td colSpan={isAmend?12:11} className="px-4 py-8 text-center text-sm text-gray-400">{emptyMsg}</td></tr>}
          </tbody>
        </table>
      </div>
      <RowContextMenu menu={rowMenu.menu} onClose={rowMenu.close} />
      {adding&&(
        <AddPanel onClose={()=>setAdding(false)}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <F label="GSTIN of Recipient"><Inp value={d.ctin} onChange={v=>setD({...d,ctin:v.toUpperCase()})} placeholder="29AAAAA0000A1Z5" /></F>
            {isAmend&&<F label="Original Note No."><Inp value={nt0.ont_num||''} onChange={v=>setNt({ont_num:v.slice(0,16)})} placeholder="CN-000" /></F>}
            {isAmend&&<F label="Original Note Date (prior period)"><DatePicker value={nt0.ont_dt||''} onChange={v=>setNt({ont_dt:v})} /></F>}
            <F label="Revised Note No."><Inp value={nt0.ntnum} onChange={v=>setNt({ntnum:v})} placeholder="CN-001" /></F>
            <F label="Revised Note Date"><DatePicker value={nt0.ntdt} onChange={v=>setNt({ntdt:v})} /></F>
            <F label="Note Type"><Sel value={d.ntty} onChange={v=>setD({...d,ntty:v as 'C'|'D'})} options={[{value:'C',label:'C – Credit Note'},{value:'D',label:'D – Debit Note'}]} /></F>
            <F label="Note Value (₹)"><Inp value={nt0.val||''} onChange={v=>setNt({val:parseFloat(v)||0})} className="text-right" /></F>
            <F label="Place of Supply"><Sel value={nt0.pos||'27'} onChange={v=>setNt({pos:v})} options={STATE_OPTS} /></F>
            <F label="Note Supply Type"><Sel value={nt0.inv_typ||'R'} onChange={v=>setInvTyp(v as 'R'|'DE'|'SEWP'|'SEWOP'|'CBW')} options={[{value:'R',label:'R – Regular'},{value:'DE',label:'DE – Deemed Export'},{value:'SEWP',label:'SEZ w/ payment'},{value:'SEWOP',label:'SEZ w/o payment'},{value:'CBW',label:'CBW'}]} /></F>
            <F label="Reverse Charge (RCM)"><Sel value={nt0.rchrg||'N'} onChange={v=>setNt({rchrg:v as 'Y'|'N'})} options={[{value:'N',label:'No'},{value:'Y',label:'Yes'}]} /></F>
            <F label="Pre-GST note?"><Sel value={nt0.p_gst||'N'} onChange={v=>setNt({p_gst:v as 'Y'|'N'})} options={[{value:'N',label:'No'},{value:'Y',label:'Yes'}]} /></F>
            <F label="Rate (%)"><Sel value={String(nt0.itms[0]?.itm_det.rt??18)} onChange={v=>setItm({rt:parseFloat(v)})} options={RATE_OPTS} /></F>
            <F label="Taxable Value (₹)"><Inp value={nt0.itms[0]?.itm_det.txval||''} onChange={v=>setItm({txval:parseFloat(v)||0})} className="text-right" /></F>
            <F label="IGST (₹)"><Inp value={nt0.itms[0]?.itm_det.iamt||''} onChange={v=>setItm({iamt:parseFloat(v)||undefined})} placeholder="0" className="text-right" /></F>
            <F label={isSez?'CGST (₹) — n/a for SEZ':'CGST (₹)'}><Inp value={nt0.itms[0]?.itm_det.camt||''} onChange={v=>setItm({camt:parseFloat(v)||undefined})} placeholder="0" className="text-right" disabled={isSez} /></F>
            <F label={isSez?'SGST (₹) — n/a for SEZ':'SGST (₹)'}><Inp value={nt0.itms[0]?.itm_det.samt||''} onChange={v=>setItm({samt:parseFloat(v)||undefined})} placeholder="0" className="text-right" disabled={isSez} /></F>
          </div>
          <AddBtns onSave={add} onClear={()=>setD(blk())} />
        </AddPanel>
      )}
    </div>
  );
}

// ── NIL Section ───────────────────────────────────────────────────────────────

const NIL_TYPES: NilSummary['sply_ty'][] = ['INTRB2B','INTRB2C','INTRAB2B','INTRAB2C'];
const NIL_LABELS: Record<string,string> = { INTRB2B:'Inter-state B2B', INTRB2C:'Inter-state B2C', INTRAB2B:'Intra-state B2B', INTRAB2C:'Intra-state B2C' };

function NILSection({ filing, onChange }: { filing:GSTR1Filing; onChange:(f:GSTR1Filing)=>void }) {
  const rows = NIL_TYPES.map(t => filing.nil.find(n=>n.sply_ty===t) ?? { id:`nil_${t}`, sply_ty:t, nil_amt:0, expt_amt:0, ngsup_amt:0 });
  const upd = (t:string, f:'nil_amt'|'expt_amt'|'ngsup_amt', v:number) =>
    onChange({...filing,nil:rows.map(r=>r.sply_ty===t?{...r,[f]:v}:r)});
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead><tr><Th ch="Supply Type" /><Th ch="Nil Rated (₹)" right /><Th ch="Exempt (₹)" right /><Th ch="Non-GST (₹)" right /></tr></thead>
        <tbody>{rows.map(row=>(
          <tr key={row.sply_ty} className="border-b border-gray-100">
            <Td>{NIL_LABELS[row.sply_ty]}</Td>
            <td className="px-2 py-1"><Inp value={row.nil_amt||''} onChange={v=>upd(row.sply_ty,'nil_amt',parseFloat(v)||0)} className="text-right" placeholder="0" /></td>
            <td className="px-2 py-1"><Inp value={row.expt_amt||''} onChange={v=>upd(row.sply_ty,'expt_amt',parseFloat(v)||0)} className="text-right" placeholder="0" /></td>
            <td className="px-2 py-1"><Inp value={row.ngsup_amt||''} onChange={v=>upd(row.sply_ty,'ngsup_amt',parseFloat(v)||0)} className="text-right" placeholder="0" /></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// ── AT / TXPD Section ─────────────────────────────────────────────────────────

function ATTXPDSection({ section, filing, onChange }: { section:'at'|'txpd'; filing:GSTR1Filing; onChange:(f:GSTR1Filing)=>void }) {
  const rows = filing[section] as ATAdvance[];
  const [adding, setAdding] = useState(false);
  const blk = () => ({ id:uid(), pos:'27', sply_ty:'INTRA' as 'INTRA'|'INTER', itms:[{rt:18,ad_amt:0,iamt:undefined as number|undefined,camt:undefined as number|undefined,samt:undefined as number|undefined}] });
  const [d, setD] = useState(blk());
  const isAT = section === 'at';

  const autoCalcAT = (adAmt:number, rt:number, splyTy:'INTRA'|'INTER') => {
    if (splyTy==='INTER') return { iamt:Math.round(adAmt*rt/100*100)/100, camt:undefined as number|undefined, samt:undefined as number|undefined };
    const half = Math.round(adAmt*rt/200*100)/100;
    return { iamt:undefined as number|undefined, camt:half, samt:half };
  };
  const applyCalc = (prev:ReturnType<typeof blk>, adAmt:number, rt:number, splyTy:'INTRA'|'INTER') => {
    const t = autoCalcAT(adAmt, rt, splyTy);
    return {...prev, sply_ty:splyTy, itms:[{...prev.itms[0], ad_amt:adAmt, rt, ...t}]};
  };

  const add = () => { onChange({...filing,[section]:[...rows,d]}); setD(blk()); setAdding(false); };
  const del = (id:string) => onChange({...filing,[section]:rows.filter(r=>r.id!==id)});
  const rowMenu = useRowMenu();

  return (
    <div>
      {/* Info banner */}
      <div className="mb-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex gap-2 text-[11px] text-blue-700">
        <span className="shrink-0">ℹ</span>
        <span>
          {isAT
            ? <><strong>Table 11A — Tax Liability on Advances Received:</strong> Under CGST Act (Section 12/13), GST is applicable on advance receipts for services and notified goods at the time of receipt. Report gross advance + GST paid. Once supply is completed &amp; invoice raised, adjust this amount in Table 11B below.</>
            : <><strong>Table 11B — Advance Adjusted Against Supply:</strong> Report advances from prior periods now adjusted against actual supply invoices. This reverses the tax paid on advances and avoids double taxation.</>
          }
        </span>
      </div>
      <SectionHeader addLabel={isAT?'Add advance':'Add adjustment'} onAdd={()=>setAdding(true)} hideAdd={adding} />

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead><tr>
            <Th ch="Place of Supply" /><Th ch="Supply Type" /><Th ch="Rate%" />
            <Th ch={isAT?'Gross Advance Received (₹)':'Advance Adjusted (₹)'} right />
            <Th ch="IGST" right /><Th ch="CGST" right /><Th ch="SGST/UTGST" right /><Th />
          </tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} title="Right-click for delete" onContextMenu={(e)=>rowMenu.open(e,{ onDelete:()=>del(r.id) })} className="hover:bg-gray-50 border-b border-gray-100">
                <Td dim>{STATE_CODES[r.pos]?.split(' ').slice(0,2).join(' ')||r.pos}</Td>
                <Td>
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${r.sply_ty==='INTER'?'bg-purple-100 text-purple-700':'bg-green-100 text-green-700'}`}>
                    {r.sply_ty}
                  </span>
                </Td>
                <Td dim>{r.itms[0]?.rt}%</Td>
                <Td right mono>{formatIndianCurrency(r.itms[0]?.ad_amt??0)}</Td>
                <Td right mono>{r.itms[0]?.iamt?formatIndianCurrency(r.itms[0].iamt):'—'}</Td>
                <Td right mono>{r.itms[0]?.camt?formatIndianCurrency(r.itms[0].camt):'—'}</Td>
                <Td right mono>{r.itms[0]?.samt?formatIndianCurrency(r.itms[0].samt):'—'}</Td>
                <td className="px-2 border-b border-gray-100" />
              </tr>
            ))}
            {rows.length===0&&<tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">No {isAT?'advance receipts':'advance adjustments'} for this period</td></tr>}
          </tbody>
        </table>
      </div>

      <RowContextMenu menu={rowMenu.menu} onClose={rowMenu.close} />
      {adding&&(
        <AddPanel onClose={()=>setAdding(false)}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <F label="Place of Supply">
              <Sel value={d.pos} onChange={v=>setD({...d,pos:v})} options={STATE_OPTS} />
            </F>
            <F label="Supply Type — determines IGST or CGST+SGST">
              <div className="flex gap-2 mt-0.5">
                {(['INTRA','INTER'] as const).map(t=>(
                  <button key={t} type="button"
                    onClick={()=>setD(prev=>applyCalc(prev,prev.itms[0]?.ad_amt??0,prev.itms[0]?.rt??18,t))}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors ${d.sply_ty===t?(t==='INTER'?'bg-purple-600 text-white border-purple-600':'bg-green-600 text-white border-green-600'):'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                    {t}<span className="opacity-70 text-[9px] block">{t==='INTER'?'→ IGST':'→ CGST+SGST'}</span>
                  </button>
                ))}
              </div>
            </F>
            <F label="Tax Rate (%)">
              <Sel value={String(d.itms[0]?.rt??18)} onChange={v=>setD(prev=>applyCalc(prev,prev.itms[0]?.ad_amt??0,parseFloat(v),prev.sply_ty))} options={RATE_OPTS} />
            </F>
            <F label={isAT?'Gross Advance Received (₹)':'Advance Being Adjusted (₹)'}>
              <Inp value={d.itms[0]?.ad_amt||''} onChange={v=>setD(prev=>applyCalc(prev,parseFloat(v)||0,prev.itms[0]?.rt??18,prev.sply_ty))} className="text-right" placeholder="0" />
            </F>
            {d.sply_ty==='INTER'
              ? <F label="IGST (₹) — auto-calculated">
                  <Inp value={d.itms[0]?.iamt??''} onChange={v=>setD({...d,itms:[{...d.itms[0],iamt:parseFloat(v)||undefined}]})} className="text-right bg-purple-50" />
                </F>
              : <>
                  <F label="CGST (₹) — auto-calculated">
                    <Inp value={d.itms[0]?.camt??''} onChange={v=>setD({...d,itms:[{...d.itms[0],camt:parseFloat(v)||undefined}]})} className="text-right bg-green-50" />
                  </F>
                  <F label="SGST/UTGST (₹) — auto-calculated">
                    <Inp value={d.itms[0]?.samt??''} onChange={v=>setD({...d,itms:[{...d.itms[0],samt:parseFloat(v)||undefined}]})} className="text-right bg-green-50" />
                  </F>
                </>
            }
          </div>
          <AddBtns onSave={add} onClear={()=>setD(blk())} />
        </AddPanel>
      )}
    </div>
  );
}

// Month picker → MMYYYY (amendment original-month). Native <input type=month> uses YYYY-MM.
function MonthPickerMMYYYY({ value, onChange, max }: { value:string; onChange:(v:string)=>void; max?:string }) {
  const toInput = (v:string) => (v && v.length===6) ? `${v.slice(2)}-${v.slice(0,2)}` : '';
  const fromInput = (s:string) => { const [y,m] = s.split('-'); return (m && y) ? `${m}${y}` : ''; };
  return <input type="month" value={toInput(value)} max={max ? `${max.slice(2)}-${max.slice(0,2)}` : undefined}
    onChange={e=>onChange(fromInput(e.target.value))}
    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none" />;
}

// ── ATA / TXPDA Amendment Section (Table 11(II)) — clone of ATTXPDSection + omon ──
function ATTXPDAmendSection({ section, filing, onChange, period }: { section:'ata'|'txpda'; filing:GSTR1Filing; onChange:(f:GSTR1Filing)=>void; period:string }) {
  const rows = (filing[section] ?? []) as ATAAmendment[];
  const [adding, setAdding] = useState(false);
  const blk = (): ATAAmendment => ({ id:uid(), omon:'', pos:'27', sply_ty:'INTRA', itms:[{rt:18,ad_amt:0,iamt:undefined,camt:undefined,samt:undefined}] });
  const [d, setD] = useState<ATAAmendment>(blk());
  const isAT = section === 'ata';
  const maxOmon = (() => { let mm=parseInt(period.slice(0,2),10); let yy=parseInt(period.slice(2),10); mm--; if(mm<1){mm=12;yy--;} return String(mm).padStart(2,'0')+String(yy); })();

  const autoCalc = (adAmt:number, rt:number, splyTy:'INTRA'|'INTER') => {
    if (splyTy==='INTER') return { iamt:Math.round(adAmt*rt/100*100)/100, camt:undefined as number|undefined, samt:undefined as number|undefined };
    const half = Math.round(adAmt*rt/200*100)/100;
    return { iamt:undefined as number|undefined, camt:half, samt:half };
  };
  const applyCalc = (prev:ATAAmendment, adAmt:number, rt:number, splyTy:'INTRA'|'INTER'): ATAAmendment => {
    const t = autoCalc(adAmt, rt, splyTy);
    return {...prev, sply_ty:splyTy, itms:[{...prev.itms[0], ad_amt:adAmt, rt, ...t}]};
  };
  const add = () => { onChange({...filing,[section]:[...rows,d]}); setD(blk()); setAdding(false); };
  const del = (id:string) => onChange({...filing,[section]:rows.filter(r=>r.id!==id)});
  const rowMenu = useRowMenu();

  return (
    <div>
      <div className="mb-3 p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg flex gap-2 text-[11px] text-indigo-700">
        <span className="shrink-0">ℹ</span>
        <span><strong>Table 11(II) — Amended {isAT?'Advances Received':'Advances Adjusted'}:</strong> corrects an advance {isAT?'received':'adjusted'} reported in a PRIOR month (omon). Enter the original month + the corrected figures.</span>
      </div>
      <SectionHeader addLabel={isAT?'Add ATA entry':'Add TXPDA entry'} onAdd={()=>setAdding(true)} hideAdd={adding} />
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead><tr>
            <Th ch="Orig. Month" /><Th ch="Place of Supply" /><Th ch="Supply Type" /><Th ch="Rate%" />
            <Th ch={isAT?'Gross Advance (₹)':'Advance Adjusted (₹)'} right />
            <Th ch="IGST" right /><Th ch="CGST" right /><Th ch="SGST/UTGST" right /><Th />
          </tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} title="Right-click to delete amendment" onContextMenu={(e)=>rowMenu.open(e,{ onDelete:()=>del(r.id) })} className="border-b border-indigo-100 hover:bg-indigo-50/60">
                <Td dim>{r.omon || '—'}</Td>
                <Td dim>{STATE_CODES[r.pos]?.split(' ').slice(0,2).join(' ')||r.pos}</Td>
                <Td><span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${r.sply_ty==='INTER'?'bg-purple-100 text-purple-700':'bg-green-100 text-green-700'}`}>{r.sply_ty}</span></Td>
                <Td dim>{r.itms[0]?.rt}%</Td>
                <Td right mono>{formatIndianCurrency(r.itms[0]?.ad_amt??0)}</Td>
                <Td right mono>{r.itms[0]?.iamt?formatIndianCurrency(r.itms[0].iamt):'—'}</Td>
                <Td right mono>{r.itms[0]?.camt?formatIndianCurrency(r.itms[0].camt):'—'}</Td>
                <Td right mono>{r.itms[0]?.samt?formatIndianCurrency(r.itms[0].samt):'—'}</Td>
                <td className="px-2 border-b border-gray-100" />
              </tr>
            ))}
            {rows.length===0&&<tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">No amendments for this period</td></tr>}
          </tbody>
        </table>
      </div>
      <RowContextMenu menu={rowMenu.menu} onClose={rowMenu.close} />
      {adding&&(
        <AddPanel onClose={()=>setAdding(false)} isAmend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <F label="Original Month (being amended)"><MonthPickerMMYYYY value={d.omon} onChange={v=>setD({...d,omon:v})} max={maxOmon} /></F>
            <F label="Place of Supply"><Sel value={d.pos} onChange={v=>setD({...d,pos:v})} options={STATE_OPTS} /></F>
            <F label="Supply Type — determines IGST or CGST+SGST">
              <div className="flex gap-2 mt-0.5">
                {(['INTRA','INTER'] as const).map(t=>(
                  <button key={t} type="button" onClick={()=>setD(prev=>applyCalc(prev,prev.itms[0]?.ad_amt??0,prev.itms[0]?.rt??18,t))}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors ${d.sply_ty===t?(t==='INTER'?'bg-purple-600 text-white border-purple-600':'bg-green-600 text-white border-green-600'):'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                    {t}<span className="opacity-70 text-[9px] block">{t==='INTER'?'→ IGST':'→ CGST+SGST'}</span>
                  </button>
                ))}
              </div>
            </F>
            <F label="Tax Rate (%)"><Sel value={String(d.itms[0]?.rt??18)} onChange={v=>setD(prev=>applyCalc(prev,prev.itms[0]?.ad_amt??0,parseFloat(v),prev.sply_ty))} options={RATE_OPTS} /></F>
            <F label={isAT?'Gross Advance (₹)':'Advance Being Adjusted (₹)'}><Inp value={d.itms[0]?.ad_amt||''} onChange={v=>setD(prev=>applyCalc(prev,parseFloat(v)||0,prev.itms[0]?.rt??18,prev.sply_ty))} className="text-right" placeholder="0" /></F>
            {d.sply_ty==='INTER'
              ? <F label="IGST (₹) — auto-calculated"><Inp value={d.itms[0]?.iamt??''} onChange={v=>setD({...d,itms:[{...d.itms[0],iamt:parseFloat(v)||undefined}]})} className="text-right bg-purple-50" /></F>
              : <>
                  <F label="CGST (₹) — auto-calculated"><Inp value={d.itms[0]?.camt??''} onChange={v=>setD({...d,itms:[{...d.itms[0],camt:parseFloat(v)||undefined}]})} className="text-right bg-green-50" /></F>
                  <F label="SGST/UTGST (₹) — auto-calculated"><Inp value={d.itms[0]?.samt??''} onChange={v=>setD({...d,itms:[{...d.itms[0],samt:parseFloat(v)||undefined}]})} className="text-right bg-green-50" /></F>
                </>
            }
          </div>
          <AddBtns onSave={add} onClear={()=>setD(blk())} />
        </AddPanel>
      )}
    </div>
  );
}

// ── HSN Section ───────────────────────────────────────────────────────────────

function HSNSection({ autoRows, filing, onChange }: { autoRows: HSNSummary[]; filing:GSTR1Filing; onChange:(f:GSTR1Filing)=>void }) {
  const [adding, setAdding] = useState(false);
  const allHsn = [...autoRows, ...filing.hsn];
  const blk = (): HSNSummary => ({ id:uid(), num:allHsn.length+1, hsn_sc:'', desc:'', user_desc:'', uqc:'NOS', qty:0, val:0, txval:0, rt:18, supplyClass:'B2C', iamt:0, camt:0, samt:0, csamt:0 });
  const [d, setD] = useState<HSNSummary>(blk());
  const add = () => { onChange({...filing,hsn:[...filing.hsn,d]}); setD(blk()); setAdding(false); };
  const del = (id:string) => onChange({...filing,hsn:filing.hsn.filter(r=>r.id!==id)});
  const rowMenu = useRowMenu();
  return (
    <div>
      <SectionHeader addLabel="Add HSN entry" onAdd={()=>setAdding(true)} hideAdd={adding} />
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead><tr><Th ch="HSN/SAC Code" /><Th ch="Description" /><Th ch="UQC" /><Th ch="Rate%" /><Th ch="Qty" right /><Th ch="Total Value" right /><Th ch="Taxable Value" right /><Th ch="IGST" right /><Th ch="CGST" right /><Th ch="SGST/UTGST" right /><Th ch="Cess" right /><Th /></tr></thead>
          <tbody>
            {autoRows.map(r=>(
              <tr key={r.id} className="bg-blue-50/30 hover:bg-blue-50/60">
                <Td mono><div className="flex items-center gap-1"><BooksBadge />{r.hsn_sc}</div></Td><Td>{r.desc}</Td><Td dim>{r.uqc}</Td><Td dim>{r.rt!=null?`${r.rt}%`:'—'}</Td>
                <Td right mono>{r.qty}</Td>
                <Td right mono>{formatIndianCurrency(r.val)}</Td>
                <Td right mono>{formatIndianCurrency(r.txval)}</Td>
                <Td right mono>{formatIndianCurrency(r.iamt)}</Td>
                <Td right mono>{formatIndianCurrency(r.camt)}</Td>
                <Td right mono>{formatIndianCurrency(r.samt)}</Td>
                <Td right mono dim>{formatIndianCurrency(r.csamt)}</Td>
                <td className="px-2 border-b border-gray-100" />
              </tr>
            ))}
            {filing.hsn.map(r=>(
              <tr key={r.id} title="Right-click for delete" onContextMenu={(e)=>rowMenu.open(e,{ onDelete:()=>del(r.id) })} className="hover:bg-gray-50">
                <Td mono>{r.hsn_sc}</Td><Td>{r.desc}</Td><Td dim>{r.uqc}</Td><Td dim>{r.rt!=null?`${r.rt}%`:'—'}</Td>
                <Td right mono>{r.qty}</Td>
                <Td right mono>{formatIndianCurrency(r.val)}</Td>
                <Td right mono>{formatIndianCurrency(r.txval)}</Td>
                <Td right mono>{formatIndianCurrency(r.iamt)}</Td>
                <Td right mono>{formatIndianCurrency(r.camt)}</Td>
                <Td right mono>{formatIndianCurrency(r.samt)}</Td>
                <Td right mono dim>{formatIndianCurrency(r.csamt)}</Td>
                <td className="px-2 border-b border-gray-100" />
              </tr>
            ))}
            {allHsn.length===0&&<tr><td colSpan={12} className="px-4 py-8 text-center text-sm text-gray-400">No HSN/SAC entries</td></tr>}
          </tbody>
        </table>
      </div>
      <RowContextMenu menu={rowMenu.menu} onClose={rowMenu.close} />
      {adding&&(
        <AddPanel onClose={()=>setAdding(false)}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <F label="HSN/SAC Code"><Inp value={d.hsn_sc} onChange={v=>setD({...d,hsn_sc:v})} placeholder="8471" /></F>
            <F label="Description"><Inp value={d.desc} onChange={v=>setD({...d,desc:v})} placeholder="Laptops & computers" /></F>
            <F label="Your description (user_desc)"><Inp value={d.user_desc||''} onChange={v=>setD({...d,user_desc:v})} placeholder="e.g. Laptops retail" /></F>
            <F label="Unit (UQC)"><Sel value={d.uqc} onChange={v=>setD({...d,uqc:v})} options={UQC_OPTIONS.map(u=>({value:u,label:u}))} /></F>
            <F label="Quantity"><Inp value={d.qty||''} onChange={v=>setD({...d,qty:parseFloat(v)||0})} className="text-right" /></F>
            <F label="Total Value (₹)"><Inp value={d.val||''} onChange={v=>setD({...d,val:parseFloat(v)||0})} className="text-right" /></F>
            <F label="Taxable Value (₹)"><Inp value={d.txval||''} onChange={v=>setD({...d,txval:parseFloat(v)||0})} className="text-right" /></F>
            <F label="IGST (₹)"><Inp value={d.iamt||''} onChange={v=>setD({...d,iamt:parseFloat(v)||0})} className="text-right" /></F>
            <F label="CGST (₹)"><Inp value={d.camt||''} onChange={v=>setD({...d,camt:parseFloat(v)||0})} className="text-right" /></F>
            <F label="SGST (₹)"><Inp value={d.samt||''} onChange={v=>setD({...d,samt:parseFloat(v)||0})} className="text-right" /></F>
            <F label="Cess (₹)"><Inp value={d.csamt||''} onChange={v=>setD({...d,csamt:parseFloat(v)||0})} className="text-right" /></F>
            <F label="Tax Rate (%)"><Sel value={String(d.rt??18)} onChange={v=>setD({...d,rt:parseFloat(v)})} options={RATE_OPTS} /></F>
            <F label="B2B or B2C supply?"><Sel value={d.supplyClass??'B2C'} onChange={v=>setD({...d,supplyClass:v as 'B2B'|'B2C'})} options={[{value:'B2C',label:'B2C (unregistered)'},{value:'B2B',label:'B2B (registered)'}]} /></F>
          </div>
          <AddBtns onSave={add} onClear={()=>setD(blk())} />
        </AddPanel>
      )}
    </div>
  );
}

// ── DOC Section ───────────────────────────────────────────────────────────────

const DOC_TYPES = ['Tax Invoice','Credit Note','Debit Note','Receipt Voucher','Delivery Challan','Payment Voucher'];

function DocSection({ filing, onChange, allInvoices }: { filing:GSTR1Filing; onChange:(f:GSTR1Filing)=>void; allInvoices: InvoiceV2[] }) {
  // Auto-compute serial number ranges from invoices for this period
  const [mm, yyyy] = [filing.period.slice(0,2), filing.period.slice(2)];
  const monthStr = `${yyyy}-${mm}`;
  const periodInvs = allInvoices.filter(inv => inv.invoice_date.startsWith(monthStr));

  const autoSerial = (docTypes: DocType[]): { from: string; to: string; totnum: number; cancel: number } => {
    const matching = periodInvs.filter(inv => docTypes.includes(inv.doc_type));
    if (matching.length === 0) return { from: '', to: '', totnum: 0, cancel: 0 };
    const sorted = matching.sort((a, b) => a.invoice_no.localeCompare(b.invoice_no));
    const cancelled = matching.filter(inv => inv.status === 'CANCELLED').length;
    return { from: sorted[0].invoice_no, to: sorted[sorted.length - 1].invoice_no, totnum: matching.length, cancel: cancelled };
  };

  // doc_num: 1=Tax Invoice, 2=Credit Note, 3=Debit Note, 4=Receipt Voucher, 5=Delivery Challan, 6=Payment Voucher
  const docTypeMap: Record<number, DocType[]> = {
    1: ['TAX_INVOICE', 'BILL_OF_SUPPLY'],
    2: ['CREDIT_NOTE'],
    3: ['DEBIT_NOTE'],
    4: ['RECEIPT_VOUCHER'],
    5: ['DELIVERY_CHALLAN'],
    6: ['PAYMENT_VOUCHER'],
  };

  const docs = DOC_TYPES.map((_,i) => {
    const saved = filing.doc_issue.find(d=>d.doc_num===i+1);
    if (saved) return saved;
    const auto = autoSerial(docTypeMap[i + 1] ?? []);
    return { id:`doc_${i+1}`, doc_num:i+1, docs:[{num:1, from:auto.from, to:auto.to, totnum:auto.totnum, cancel:auto.cancel, net_issue:auto.totnum - auto.cancel}] };
  });
  const upd = (doc_num:number, field:string, val:string|number) => {
    const updated = docs.map(d => {
      if (d.doc_num!==doc_num) return d;
      const nd = { ...d.docs[0], [field]:val };
      nd.net_issue = (field==='totnum'?Number(val):nd.totnum) - (field==='cancel'?Number(val):nd.cancel);
      return { ...d, docs:[nd] };
    });
    // The 6-class editor stays for UX, but blank scaffold rows must NEVER persist to the
    // model (they become ghost doc rows the builder/validator would reject — RET191106).
    const realRows = updated.filter(d => {
      const x = d.docs[0];
      return !!(String(x.from ?? '').trim() || String(x.to ?? '').trim() || (x.totnum || 0) > 0 || (x.cancel || 0) > 0);
    });
    onChange({...filing,doc_issue:realRows});
  };
  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead><tr><Th ch="Document Type" /><Th ch="Sr. No. From" /><Th ch="Sr. No. To" /><Th ch="Total Issued" right /><Th ch="Cancelled" right /><Th ch="Net Issued" right /></tr></thead>
          <tbody>{docs.map(doc=>(
            <tr key={doc.doc_num} className="border-b border-gray-100">
              <Td>{DOC_TYPES[doc.doc_num-1]}</Td>
              <td className="px-2 py-1 border-b border-gray-100"><Inp value={doc.docs[0]?.from??''} onChange={v=>upd(doc.doc_num,'from',v)} placeholder="001" /></td>
              <td className="px-2 py-1 border-b border-gray-100"><Inp value={doc.docs[0]?.to??''} onChange={v=>upd(doc.doc_num,'to',v)} placeholder="100" /></td>
              <td className="px-2 py-1 border-b border-gray-100"><Inp value={doc.docs[0]?.totnum??0} onChange={v=>upd(doc.doc_num,'totnum',parseInt(v)||0)} className="text-right" /></td>
              <td className="px-2 py-1 border-b border-gray-100"><Inp value={doc.docs[0]?.cancel??0} onChange={v=>upd(doc.doc_num,'cancel',parseInt(v)||0)} className="text-right" /></td>
              <td className="px-3 py-2 text-right font-mono text-sm border-b border-gray-100 font-semibold">{doc.docs[0]?.net_issue??0}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {periodInvs.length > 0 && (
        <p className="mt-2 text-[11px] text-blue-600"><span className="inline-block w-2 h-2 bg-blue-200 rounded-full mr-1" />Serial numbers auto-populated from {periodInvs.length} invoice(s) in this period</p>
      )}
    </div>
  );
}

// ── Validation modal ──────────────────────────────────────────────────────────

function ValidationModal({ errors, onClose }: { errors:ValidationError[]; onClose:()=>void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold">{errors.length===0?'✓ Validation Passed':`${errors.length} Validation Error${errors.length>1?'s':''}`}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        {errors.length===0
          ? <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">All checks passed. Ready to download JSON.</p>
          : <div className="space-y-2 max-h-72 overflow-y-auto">{errors.map((e,i)=>(
              <div key={i} className="flex gap-2 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <span className="font-semibold text-red-700 shrink-0">[{e.section}]</span>
                {e.row&&<span className="text-gray-500 shrink-0">{e.row}:</span>}
                <span className="text-red-800">{e.message}</span>
              </div>
            ))}</div>
        }
        <button type="button" onClick={onClose} className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg">Close</button>
      </div>
    </div>
  );
}

// ── Tab definitions ───────────────────────────────────────────────────────────

// ── Overview / Summary Section ────────────────────────────────────────────────

function OverviewSection({ fullFiling, period, onNavigate }: {
  fullFiling: GSTR1Filing;
  period: string;
  onNavigate: (tab: string) => void;
}) {
  // Compute totals per section
  const b2bTotals = (() => {
    let txval=0, igst=0, cgst=0, sgst=0, cess=0;
    for (const inv of fullFiling.b2b) for (const i of inv.itms) {
      txval+=i.itm_det.txval; igst+=i.itm_det.iamt??0; cgst+=i.itm_det.camt??0; sgst+=i.itm_det.samt??0; cess+=i.itm_det.csamt??0;
    }
    return { count: fullFiling.b2b.length, txval, igst, cgst, sgst, cess };
  })();
  const b2clTotals = (() => {
    let txval=0, igst=0, cgst=0, sgst=0, cess=0;
    for (const inv of fullFiling.b2cl) for (const i of inv.itms) {
      txval+=i.itm_det.txval; igst+=i.itm_det.iamt??0; cgst+=i.itm_det.camt??0; sgst+=i.itm_det.samt??0; cess+=i.itm_det.csamt??0;
    }
    return { count: fullFiling.b2cl.length, txval, igst, cgst, sgst, cess };
  })();
  const b2csTotals = (() => {
    let txval=0, igst=0, cgst=0, sgst=0, cess=0;
    for (const s of fullFiling.b2cs) {
      txval+=s.txval; igst+=s.iamt??0; cgst+=s.camt??0; sgst+=s.samt??0; cess+=s.csamt??0;
    }
    return { count: fullFiling.b2cs.length, txval, igst, cgst, sgst, cess };
  })();
  const expTotals = (() => {
    let txval=0, igst=0;
    for (const e of fullFiling.exp) for (const i of e.itms) { txval+=i.txval; igst+=i.iamt??0; }
    return { count: fullFiling.exp.length, txval, igst, cgst:0, sgst:0, cess:0 };
  })();
  // Credit notes REDUCE liability, debit notes increase it → net by ntty (C = −1).
  const cdnrTotals = (() => {
    let txval=0, igst=0, cgst=0, sgst=0, cess=0, count=0;
    for (const n of fullFiling.cdnr) { const sg = n.ntty==='C' ? -1 : 1; count+=n.nt.length; for (const nt of n.nt) for (const i of nt.itms) {
      txval+=sg*i.itm_det.txval; igst+=sg*(i.itm_det.iamt??0); cgst+=sg*(i.itm_det.camt??0); sgst+=sg*(i.itm_det.samt??0); cess+=sg*(i.itm_det.csamt??0);
    }}
    return { count, txval, igst, cgst, sgst, cess };
  })();
  const cdnurTotals = (() => {
    let txval=0, igst=0, cgst=0, sgst=0, cess=0;
    for (const n of fullFiling.cdnur) { const sg = n.ntty==='C' ? -1 : 1; for (const i of n.itms) {
      txval+=sg*i.itm_det.txval; igst+=sg*(i.itm_det.iamt??0); cgst+=sg*(i.itm_det.camt??0); sgst+=sg*(i.itm_det.samt??0); cess+=sg*(i.itm_det.csamt??0);
    }}
    return { count: fullFiling.cdnur.length, txval, igst, cgst, sgst, cess };
  })();
  const nilTotals = (() => {
    let nil_amt=0, expt_amt=0, ngsup_amt=0;
    for (const n of fullFiling.nil) { nil_amt+=n.nil_amt; expt_amt+=n.expt_amt; ngsup_amt+=n.ngsup_amt; }
    return { count: fullFiling.nil.length, txval: nil_amt+expt_amt+ngsup_amt, igst:0, cgst:0, sgst:0, cess:0, isNil:true };
  })();
  const atTotals = (() => {
    let txval=0, igst=0, cgst=0, sgst=0, cess=0;
    for (const a of fullFiling.at) for (const i of a.itms) {
      txval+=i.ad_amt; igst+=i.iamt??0; cgst+=i.camt??0; sgst+=i.samt??0; cess+=i.csamt??0;
    }
    return { count: fullFiling.at.length, txval, igst, cgst, sgst, cess };
  })();
  const txpdTotals = (() => {
    let txval=0, igst=0, cgst=0, sgst=0, cess=0;
    for (const a of fullFiling.txpd) for (const i of a.itms) {
      txval+=i.ad_amt; igst+=i.iamt??0; cgst+=i.camt??0; sgst+=i.samt??0; cess+=i.csamt??0;
    }
    return { count: fullFiling.txpd.length, txval, igst, cgst, sgst, cess };
  })();
  const hsnTotals = (() => {
    let txval=0, igst=0, cgst=0, sgst=0, cess=0;
    for (const h of fullFiling.hsn) { txval+=h.txval; igst+=h.iamt; cgst+=h.camt; sgst+=h.samt; cess+=h.csamt; }
    return { count: fullFiling.hsn.length, txval, igst, cgst, sgst, cess };
  })();
  // ── Amendment totals (revised values; differential vs original is not in the model) ──
  const b2baTotals = (() => { let txval=0,igst=0,cgst=0,sgst=0,cess=0; for (const inv of fullFiling.b2ba) for (const i of inv.itms){ txval+=i.itm_det.txval; igst+=i.itm_det.iamt??0; cgst+=i.itm_det.camt??0; sgst+=i.itm_det.samt??0; cess+=i.itm_det.csamt??0; } return { count: fullFiling.b2ba.length, txval, igst, cgst, sgst, cess }; })();
  const b2claTotals = (() => { let txval=0,igst=0,cgst=0,sgst=0,cess=0; for (const inv of fullFiling.b2cla) for (const i of inv.itms){ txval+=i.itm_det.txval; igst+=i.itm_det.iamt??0; cgst+=i.itm_det.camt??0; sgst+=i.itm_det.samt??0; cess+=i.itm_det.csamt??0; } return { count: fullFiling.b2cla.length, txval, igst, cgst, sgst, cess }; })();
  const b2csaTotals = (() => { let txval=0,igst=0,cgst=0,sgst=0,cess=0; for (const s of fullFiling.b2csa){ txval+=s.txval; igst+=s.iamt??0; cgst+=s.camt??0; sgst+=s.samt??0; cess+=s.csamt??0; } return { count: fullFiling.b2csa.length, txval, igst, cgst, sgst, cess }; })();
  const expaTotals = (() => { let txval=0,igst=0; for (const e of fullFiling.expa) for (const i of e.itms){ txval+=i.txval; igst+=i.iamt??0; } return { count: fullFiling.expa.length, txval, igst, cgst:0, sgst:0, cess:0 }; })();
  const cdnraTotals = (() => { let txval=0,igst=0,cgst=0,sgst=0,cess=0,count=0; for (const n of fullFiling.cdnra){ const sg=n.ntty==='C'?-1:1; count+=n.nt.length; for (const nt of n.nt) for (const i of nt.itms){ txval+=sg*i.itm_det.txval; igst+=sg*(i.itm_det.iamt??0); cgst+=sg*(i.itm_det.camt??0); sgst+=sg*(i.itm_det.samt??0); cess+=sg*(i.itm_det.csamt??0); } } return { count, txval, igst, cgst, sgst, cess }; })();
  const cdnuraTotals = (() => { let txval=0,igst=0,cgst=0,sgst=0,cess=0; for (const n of fullFiling.cdnura){ const sg=n.ntty==='C'?-1:1; for (const i of n.itms){ txval+=sg*i.itm_det.txval; igst+=sg*(i.itm_det.iamt??0); cgst+=sg*(i.itm_det.camt??0); sgst+=sg*(i.itm_det.samt??0); cess+=sg*(i.itm_det.csamt??0); } } return { count: fullFiling.cdnura.length, txval, igst, cgst, sgst, cess }; })();
  const ataTotals = (() => { let txval=0,igst=0,cgst=0,sgst=0,cess=0; for (const a of (fullFiling.ata ?? [])) for (const i of a.itms){ txval+=i.ad_amt; igst+=i.iamt??0; cgst+=i.camt??0; sgst+=i.samt??0; cess+=i.csamt??0; } return { count: (fullFiling.ata ?? []).length, txval, igst, cgst, sgst, cess }; })();
  const txpdaTotals = (() => { let txval=0,igst=0,cgst=0,sgst=0,cess=0; for (const a of (fullFiling.txpda ?? [])) for (const i of a.itms){ txval+=i.ad_amt; igst+=i.iamt??0; cgst+=i.camt??0; sgst+=i.samt??0; cess+=i.csamt??0; } return { count: (fullFiling.txpda ?? []).length, txval, igst, cgst, sgst, cess }; })();

  // Liability classification — GST logic, NOT a blind sum:
  //   add      → outward supply, increases output tax (B2B/B2CL/B2CS/EXP/CDN*/AT)
  //   subtract → reverses tax already paid (TXPD, advance adjusted)
  //   memo     → reconciliation only: HSN would DOUBLE-COUNT the same supplies, NIL carries no tax
  //   none     → no tax at all (DOC — document counts)
  //   amend    → revises a PRIOR period; this period's impact is the differential
  //              (amended − original), which the draft model does not carry — so amendments
  //              are listed as their own particulars but NOT folded into this period's output tax.
  //   (*CDN credit notes are already netted negative in their totals above.)
  type Liab = 'add' | 'subtract' | 'memo' | 'none' | 'amend';
  type SectionRow = { id:string; key:string; label:string; tableNum:string; count:number; txval:number; igst:number; cgst:number; sgst:number; cess:number; isNil?:boolean; liab:Liab };
  const rows: SectionRow[] = [
    { id:'b2b',    key:'b2b',   label:'B2B — Registered',             tableNum:'4',   ...b2bTotals,    liab:'add' },
    { id:'b2cl',   key:'b2cl',  label:'B2CL — Inter-state >₹1L',      tableNum:'5',   ...b2clTotals,   liab:'add' },
    { id:'b2cs',   key:'b2cs',  label:'B2CS — Other Unregistered',    tableNum:'7',   ...b2csTotals,   liab:'add' },
    { id:'exp',    key:'exp',   label:'EXP — Exports',                tableNum:'6A',  ...expTotals,    liab:'add' },
    { id:'cdnr',   key:'cdnr',  label:'CDNR — Notes (Registered)',    tableNum:'9B',  ...cdnrTotals,   liab:'add' },
    { id:'cdnur',  key:'cdnur', label:'CDNUR — Notes (Unregistered)', tableNum:'9B',  ...cdnurTotals,  liab:'add' },
    { id:'b2ba',   key:'b2ba',   label:'B2BA — Amended B2B',           tableNum:'9A',  ...b2baTotals,   liab:'amend' },
    { id:'b2cla',  key:'b2cla',  label:'B2CLA — Amended B2CL',         tableNum:'9A',  ...b2claTotals,  liab:'amend' },
    { id:'b2csa',  key:'b2csa',  label:'B2CSA — Amended B2CS',         tableNum:'10',  ...b2csaTotals,  liab:'amend' },
    { id:'expa',   key:'expa',   label:'EXPA — Amended Exports',       tableNum:'9A',  ...expaTotals,   liab:'amend' },
    { id:'cdnra',  key:'cdnra',  label:'CDNRA — Amended CDN (Reg)',    tableNum:'9C',  ...cdnraTotals,  liab:'amend' },
    { id:'cdnura', key:'cdnura', label:'CDNURA — Amended CDN (Unreg)', tableNum:'9C',  ...cdnuraTotals, liab:'amend' },
    { id:'at',     key:'at',    label:'AT — Advance Tax',             tableNum:'11A', ...atTotals,     liab:'add' },
    { id:'txpd',   key:'txpd',  label:'TXPD — Advance Adjusted',      tableNum:'11B', ...txpdTotals,   liab:'subtract' },
    { id:'ata',    key:'ata',   label:'ATA — Amended Advance Tax',    tableNum:'11(II)', ...ataTotals,  liab:'amend' },
    { id:'txpda',  key:'txpda', label:'TXPDA — Amended Adv. Adjusted',tableNum:'11(II)', ...txpdaTotals,liab:'amend' },
    { id:'nil',    key:'nil',   label:'NIL — Nil / Exempt',           tableNum:'8',   ...nilTotals,    liab:'memo' },
    { id:'hsn',    key:'hsn',   label:'HSN — HSN Summary',            tableNum:'12',  ...hsnTotals,    liab:'memo' },
    { id:'doc',    key:'doc',   label:'DOC — Document Issue',         tableNum:'13',  count: fullFiling.doc_issue.length, txval:0, igst:0, cgst:0, sgst:0, cess:0, liab:'none' },
    { id:'supeco', key:'supeco',label:'SUPECO — E-com Operator',      tableNum:'14/15', count: (fullFiling.supeco?.clttx.length ?? 0) + (fullFiling.supeco?.paytx.length ?? 0), txval:0, igst:0, cgst:0, sgst:0, cess:0, liab:'memo' },
  ];

  // Net OUTPUT TAX = Σ(add) − Σ(subtract). Memo (HSN/NIL), none (DOC) and amendments excluded.
  const grand = rows.reduce((acc,r) => {
    const s = r.liab==='add' ? 1 : r.liab==='subtract' ? -1 : 0;
    return { txval:acc.txval+s*r.txval, igst:acc.igst+s*r.igst, cgst:acc.cgst+s*r.cgst, sgst:acc.sgst+s*r.sgst, cess:acc.cess+s*r.cess };
  }, { txval:0, igst:0, cgst:0, sgst:0, cess:0 });
  const grandTax = grand.igst + grand.cgst + grand.sgst + grand.cess;

  const r2 = (n:number) => Math.round(n*100)/100;

  // NOTE: use full literal class strings — Tailwind v4 only emits utilities it can
  // find as complete tokens in source, so a template like `text-${color}` is never
  // generated (previously left the SGST card with no color).
  const topCards = [
    { label:'Total Taxable Value', val:grand.txval, cls:'text-blue-600' },
    { label:'Total IGST',          val:grand.igst,  cls:'text-purple-600' },
    { label:'Total CGST',          val:grand.cgst,  cls:'text-green-600' },
    { label:'Total SGST/UTGST',    val:grand.sgst,  cls:'text-teal-600' },
    { label:'Total Cess',          val:grand.cess,  cls:'text-orange-500' },
    { label:'Total Output Tax',    val:grandTax,    cls:'text-red-600' },
  ];

  return (
    <div>
      {/* Period label */}
      <p className="text-xs text-gray-500 mb-3">
        Summary for <span className="font-semibold text-gray-700">{MONTH_NAMES[parseInt(period.slice(0,2),10)-1]} {period.slice(2)}</span>
        {fullFiling.gstin && <> — GSTIN: <span className="font-mono font-semibold text-gray-700">{fullFiling.gstin}</span></>}
      </p>

      {/* Top summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-5">
        {topCards.map(c => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider leading-tight">{c.label}</p>
            <p className={`text-base font-bold font-mono mt-1 ${c.cls}`}>{formatIndianCurrency(r2(c.val))}</p>
          </div>
        ))}
      </div>

      {/* Section-wise table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <Th ch="Section" />
              <Th ch="Table" />
              <Th ch="Records" right />
              <Th ch="Taxable Value" right />
              <Th ch="IGST" right />
              <Th ch="CGST" right />
              <Th ch="SGST/UTGST" right />
              <Th ch="Cess" right />
              <Th ch="Total Tax" right />
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const totalTax = row.igst + row.cgst + row.sgst + row.cess;
              const hasData = row.count > 0;
              return (
                <tr key={row.id}
                  onClick={() => onNavigate(row.key)}
                  title={row.liab==='amend'?'Amendment — revises a prior period; not added to this period’s output tax':row.liab==='memo'?'Reconciliation only — not part of output tax':undefined}
                  className={`border-b border-gray-100 cursor-pointer transition-colors ${row.liab==='amend'?'bg-indigo-50/30':row.liab==='memo'?'bg-gray-50/40':''} ${hasData?'hover:bg-blue-50':'hover:bg-gray-50 opacity-50'}`}>
                  <Td>
                    <span className={`font-semibold text-xs ${hasData?'text-blue-700':'text-gray-400'}`}>
                      {row.label}
                    </span>
                  </Td>
                  <Td dim><span className="text-[11px]">{row.tableNum}</span></Td>
                  <Td right>
                    {hasData
                      ? <span className="inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold bg-blue-100 text-blue-700 rounded-full">{row.count}</span>
                      : <span className="text-gray-300 text-[11px]">–</span>}
                  </Td>
                  {row.isNil
                    ? <><Td right mono><span className="text-gray-500">{hasData?formatIndianCurrency(r2(row.txval)):'–'}</span></Td><Td right dim><span className="text-[11px]">N/A</span></Td><Td right dim><span className="text-[11px]">N/A</span></Td><Td right dim><span className="text-[11px]">N/A</span></Td><Td right dim><span className="text-[11px]">N/A</span></Td><Td right dim><span className="text-[11px]">N/A</span></Td></>
                    : <>
                        <Td right mono>{hasData||row.txval>0?formatIndianCurrency(r2(row.txval)):<span className="text-gray-300">–</span>}</Td>
                        <Td right mono>{row.igst>0?formatIndianCurrency(r2(row.igst)):<span className="text-gray-300">–</span>}</Td>
                        <Td right mono>{row.cgst>0?formatIndianCurrency(r2(row.cgst)):<span className="text-gray-300">–</span>}</Td>
                        <Td right mono>{row.sgst>0?formatIndianCurrency(r2(row.sgst)):<span className="text-gray-300">–</span>}</Td>
                        <Td right mono>{row.cess>0?formatIndianCurrency(r2(row.cess)):<span className="text-gray-300">–</span>}</Td>
                        <Td right mono>{totalTax>0?<span className="font-semibold">{formatIndianCurrency(r2(totalTax))}</span>:<span className="text-gray-300">–</span>}</Td>
                      </>
                  }
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-300 font-semibold">
              <td className="px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide" colSpan={3}>Net Output Tax <span className="font-normal normal-case text-[10px] text-gray-400">(excl. HSN, Nil, Docs &amp; amendments)</span></td>
              <td className="px-3 py-2 text-right font-mono text-sm font-bold text-gray-900">{formatIndianCurrency(r2(grand.txval))}</td>
              <td className="px-3 py-2 text-right font-mono text-sm font-bold text-purple-700">{formatIndianCurrency(r2(grand.igst))}</td>
              <td className="px-3 py-2 text-right font-mono text-sm font-bold text-green-700">{formatIndianCurrency(r2(grand.cgst))}</td>
              <td className="px-3 py-2 text-right font-mono text-sm font-bold text-teal-700">{formatIndianCurrency(r2(grand.sgst))}</td>
              <td className="px-3 py-2 text-right font-mono text-sm font-bold text-orange-600">{formatIndianCurrency(r2(grand.cess))}</td>
              <td className="px-3 py-2 text-right font-mono text-sm font-bold text-red-700">{formatIndianCurrency(r2(grandTax))}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-[11px] text-gray-400 mt-2">Click any row to jump to that section. HSN totals may overlap with B2B/B2CL/B2CS — do not double-count.</p>
    </div>
  );
}

// URL-driven drill-in: which section is open (?section=…), as an anchor id. null = dashboard.
const OpenSectionCtx = React.createContext<string | null>(null);

// Titled block wrapper for a GSTR-1 section — renders only when it's the drilled-in section.
function SectionBlock({ id, title, tableNum, subtitle, children }: { id: string; title: string; tableNum: string; subtitle: string; children: React.ReactNode }) {
  const open = React.useContext(OpenSectionCtx);
  if (open !== id) return null;
  return (
    <section id={id} className="scroll-mt-4">
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">Table {tableNum}</span>
        <span className="text-[11px] text-gray-400">{subtitle}</span>
      </div>
      {children}
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

// Inline OTP prompt for the taxpayer session (shown when Import has no live session).
function OtpModal({ gstin, otp, setOtp, onVerify, onCancel }: { gstin: string; otp: string; setOtp: (v: string) => void; onVerify: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-gray-900">GST portal OTP</h3>
        <p className="mt-1 text-xs text-gray-500">An OTP was sent to the mobile/email registered against <span className="font-mono text-gray-700">{gstin}</span>. Enter it to open a ~6h session — reused for every fetch, no repeat OTP.</p>
        <input autoFocus value={otp} onChange={(e) => setOtp(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onVerify(); }} placeholder="Enter OTP" inputMode="numeric"
          className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-[0.3em] focus:border-blue-500 focus:outline-none" />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button type="button" onClick={onVerify} className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">Verify</button>
        </div>
      </div>
    </div>
  );
}

// ── "As filed on the portal" read-only view (from an Import) ─────────────────
const fmtNum = (v?: number) => (v == null || v === 0 ? '—' : v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

function relTime(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  const m = Math.floor(diff / 60_000); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function FiledTable({ section, amend }: { section: FiledSection; amend?: boolean }) {
  const th = 'px-2 py-1 text-left font-medium whitespace-nowrap';
  const thr = 'px-2 py-1 text-right font-medium whitespace-nowrap';
  const td = 'px-2 py-1 whitespace-nowrap';
  const tdr = 'px-2 py-1 text-right tabular-nums whitespace-nowrap';
  const rows = section.rows;
  let head: React.ReactNode;
  let body: React.ReactNode;
  if (section.kind === 'hsn') {
    head = <tr><th className={th}>HSN</th><th className={th}>Description</th><th className={th}>UQC</th><th className={thr}>Qty</th><th className={thr}>Rate</th><th className={thr}>Taxable</th><th className={thr}>IGST</th><th className={thr}>CGST</th><th className={thr}>SGST</th><th className={thr}>Cess</th></tr>;
    body = rows.map((r, i) => <tr key={i} className="border-t border-gray-100"><td className={td}>{r.hsn || '—'}</td><td className={`${td} max-w-[160px] truncate`}>{r.desc || '—'}</td><td className={td}>{r.uqc || '—'}</td><td className={tdr}>{r.qty ?? '—'}</td><td className={tdr}>{r.rate ?? '—'}</td><td className={tdr}>{fmtNum(r.taxable)}</td><td className={tdr}>{fmtNum(r.igst)}</td><td className={tdr}>{fmtNum(r.cgst)}</td><td className={tdr}>{fmtNum(r.sgst)}</td><td className={tdr}>{fmtNum(r.cess)}</td></tr>);
  } else if (section.kind === 'nil') {
    head = <tr><th className={th}>Supply Type</th><th className={thr}>Nil-rated</th><th className={thr}>Exempt</th><th className={thr}>Non-GST</th></tr>;
    body = rows.map((r, i) => <tr key={i} className="border-t border-gray-100"><td className={td}>{r.type || '—'}</td><td className={tdr}>{fmtNum(r.nilAmt)}</td><td className={tdr}>{fmtNum(r.exptAmt)}</td><td className={tdr}>{fmtNum(r.ngsupAmt)}</td></tr>);
  } else if (section.kind === 'doc') {
    head = <tr><th className={th}>Doc Category</th><th className={th}>From</th><th className={th}>To</th><th className={thr}>Total</th><th className={thr}>Cancelled</th><th className={thr}>Net Issued</th></tr>;
    body = rows.map((r, i) => <tr key={i} className="border-t border-gray-100"><td className={td}>{r.type || '—'}</td><td className={td}>{r.from || '—'}</td><td className={td}>{r.to || '—'}</td><td className={tdr}>{r.totnum ?? '—'}</td><td className={tdr}>{r.cancel ?? '—'}</td><td className={tdr}>{r.net ?? '—'}</td></tr>);
  } else if (section.kind === 'adv') {
    head = <tr>{amend && <th className={th}>Orig. Month</th>}<th className={th}>POS</th><th className={th}>Supply</th><th className={thr}>Rate</th><th className={thr}>Advance</th><th className={thr}>IGST</th><th className={thr}>CGST</th><th className={thr}>SGST</th><th className={thr}>Cess</th></tr>;
    body = rows.map((r, i) => <tr key={i} className="border-t border-gray-100">{amend && <td className={`${td} text-amber-700`}>{r.odate || '—'}</td>}<td className={td}>{r.pos || '—'}</td><td className={td}>{r.type || '—'}</td><td className={tdr}>{r.rate ?? '—'}</td><td className={tdr}>{fmtNum(r.taxable)}</td><td className={tdr}>{fmtNum(r.igst)}</td><td className={tdr}>{fmtNum(r.cgst)}</td><td className={tdr}>{fmtNum(r.sgst)}</td><td className={tdr}>{fmtNum(r.cess)}</td></tr>);
  } else {
    head = <tr>{amend && <th className={th}>Orig. Doc</th>}{amend && <th className={th}>Orig. Date</th>}<th className={th}>Party</th><th className={th}>Doc</th><th className={th}>Date</th><th className={th}>POS</th><th className={thr}>Rate</th><th className={thr}>Taxable</th><th className={thr}>IGST</th><th className={thr}>CGST</th><th className={thr}>SGST</th><th className={thr}>Cess</th><th className={thr}>Value</th></tr>;
    body = rows.map((r, i) => <tr key={i} className="border-t border-gray-100">{amend && <td className={`${td} font-medium text-amber-700`}>{r.odoc || '—'}</td>}{amend && <td className={`${td} text-amber-700/80`}>{r.odate || '—'}</td>}<td className={`${td} font-mono text-[10px]`}>{r.party || '—'}</td><td className={td}>{r.doc || '—'}</td><td className={td}>{r.date || '—'}</td><td className={td}>{r.pos || '—'}</td><td className={tdr}>{r.rate ?? '—'}</td><td className={tdr}>{fmtNum(r.taxable)}</td><td className={tdr}>{fmtNum(r.igst)}</td><td className={tdr}>{fmtNum(r.cgst)}</td><td className={tdr}>{fmtNum(r.sgst)}</td><td className={tdr}>{fmtNum(r.cess)}</td><td className={tdr}>{fmtNum(r.value)}</td></tr>);
  }
  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
      <table className="w-full text-[11px]"><thead className="bg-gray-50 text-gray-500">{head}</thead><tbody className="text-gray-700">{body}</tbody></table>
    </div>
  );
}

/** Renders imported "as filed on portal" rows for the given keys. Regular sections
 *  pass only their GSTR-1 key; amendment sections pass the *A GSTR-1 key + the
 *  GSTR-1A keys with amend=true. Renders nothing when the portal filed nothing. */
function FiledDataView({ combined, gstr1Keys, gstr1aKeys = [], amend = false }: {
  combined: CombinedFiled | null; gstr1Keys: string[]; gstr1aKeys?: string[]; amend?: boolean;
}) {
  if (!combined) return null;
  const secs = [
    ...gstr1Keys.map((k) => combined.gstr1.find((s) => s.key === k)),
    ...gstr1aKeys.map((k) => combined.gstr1a.find((s) => s.key === k)),
  ].filter(Boolean) as FiledSection[];
  const rows = secs.flatMap((s) => s.rows);
  if (rows.length === 0) return null;
  const kind = secs[0].kind;
  return (
    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        As filed on portal
        <span className="font-normal normal-case text-emerald-600/70">· imported {relTime(combined.importedAt)}</span>
      </div>
      <FiledTable section={{ key: gstr1Keys[0] ?? 'filed', label: '', kind, rows }} amend={amend && (kind === 'inv' || kind === 'adv')} />
    </div>
  );
}

// Plain-English meanings for the GSTN return-status error codes we may surface.
const GSTN_ERROR_MEANINGS: Record<string, string> = {
  RET191106: 'Error in JSON structure validation — the request body shape is invalid',
  RET191107: 'Checksum / summary mismatch',
  RET191113: 'Return already submitted for this period',
  RET191114: 'Invalid GSTIN in the payload',
  RET191133: 'Duplicate invoice / document number',
  RET191175: 'Data validation failed',
  RET00003: 'Invalid GSTIN',
  RET00009: 'Return form already filed',
  RT_FIL_02: 'GSTR-1 is already filed for this period',
  RT_FIL_10: 'Please submit invoices before filing',
};

// GSTN nests per-section validation errors under these keys inside error_report.
const GSTN_ERROR_SECTIONS = ['at', 'ata', 'b2b', 'b2ba', 'b2cl', 'b2cla', 'b2cs', 'b2csa', 'cdnr', 'cdnra', 'cdnur', 'cdnura', 'exp', 'expa', 'hsn', 'nil', 'txpd', 'txpda', 'doc_issue'];

type GstnErrSection = { section: string; code?: string; message?: string; count: number };
/** Decode a GSTN error_report into its top-level code/message (+ plain-English meaning)
 *  and any per-section breakdown, so an ER response can be shown in full — never guessed. */
function summarizeGstnError(report: unknown): { code?: string; message?: string; meaning?: string; sections: GstnErrSection[] } {
  const r = (report && typeof report === 'object' ? report : {}) as Record<string, any>;
  const code = r.error_cd ?? r.errorCode ?? r.code;
  const message = r.error_msg ?? r.errorMsg ?? r.message;
  const meaning = typeof code === 'string' ? GSTN_ERROR_MEANINGS[code] : undefined;
  const sections: GstnErrSection[] = [];
  for (const s of GSTN_ERROR_SECTIONS) {
    const v = r[s];
    if (Array.isArray(v) && v.length) {
      const withErr = v.find((x: any) => x?.error_cd || x?.error_msg) ?? v[0];
      sections.push({ section: s.toUpperCase(), code: withErr?.error_cd, message: withErr?.error_msg, count: v.length });
    } else if (v && typeof v === 'object' && (v.error_cd || v.error_msg)) {
      sections.push({ section: s.toUpperCase(), code: v.error_cd, message: v.error_msg, count: 1 });
    }
  }
  return { code, message, meaning, sections };
}

/** Parse a turnover input into a number (digits + one decimal), or undefined when blank. */
function parseTurnover(raw: string): number | undefined {
  const cleaned = raw.replace(/[^\d.]/g, '');
  if (cleaned === '') return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

// ── e-File GSTR-1 stepper: Validate → Upload → Processing → Save/Reset → OTP → Verify & File ──
function EFileModal({ fullFiling, gstin, period, companyId, taxSession, onClose, onSaveTurnover, onFiled }: {
  fullFiling: GSTR1Filing; gstin: string; period: string; companyId: string;
  taxSession: ReturnType<typeof useTaxpayerSession>;
  onClose: () => void;
  onSaveTurnover: (gt?: number, curGt?: number) => void;
  onFiled: (arn: string, fileBody: unknown) => void;
}) {
  // Turnover is a SINGLE source of truth in the filing model (fullFiling.gt / cur_gt),
  // edited from the page's "Return-level details" card OR the inputs below — both write
  // the same fields via onSaveTurnover. No divergent local copy.
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [evcOtp, setEvcOtp] = useState('');
  const [ready, setReady] = useState<{ pan: string; token: string; secSum: unknown; chksum: unknown; newSumFlag: unknown } | null>(null);
  const [errReport, setErrReport] = useState<unknown>(null);
  const [sentBody, setSentBody] = useState<unknown>(null);   // exact body sent, snapshotted for the error view
  const [arn, setArn] = useState<string | null>(null);
  const [apiCalls, setApiCalls] = useState(0);   // credit counter — 1 per outbound GSTN call
  const [evcRequested, setEvcRequested] = useState(false); // EVC OTP requested ONLY at the OTP step
  const [manualPoll, setManualPoll] = useState<{ refId: string; label: string } | null>(null); // set when a poll BLOCKS → manual re-poll
  // Stepper phase: Validate(done before open) → Upload → Processing → Save/Reset → OTP → Verify & File → filed.
  const [phase, setPhase] = useState<'upload' | 'processing' | 'saved' | 'otp' | 'verify' | 'filed'>('upload');
  const resumeRef = useRef<(() => void | Promise<void>) | null>(null); // continuation after a BLOCKED poll is manually confirmed
  const filedRef = useRef(false);            // idempotency: File never fires twice
  const push = (m: string) => setLog((l) => [...l, m]);
  const countCall = () => setApiCalls((n) => n + 1);
  const month = period.slice(0, 2), year = period.slice(2);
  const pan = gstin.slice(2, 12); // entity PAN embedded in the GSTIN — NOT valid for EVC (a company PAN is never an authorized signatory)
  // EVC OTP / File require the AUTHORIZED SIGNATORY's individual PAN (registered on the
  // GST portal for this GSTIN). Captured from the user + remembered per GSTIN. GSTN
  // returns OTP0010 ("does not have authorized signatory for Given Pan") otherwise.
  const sigPanKey = `gstr1_sig_pan_${gstin}`;
  const [sigPan, setSigPan] = useState<string>(() => { try { return localStorage.getItem(sigPanKey) || ''; } catch { return ''; } });
  const sigPanClean = sigPan.trim().toUpperCase();
  const sigPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(sigPanClean);
  const saveSigPan = (v: string) => { const u = v.toUpperCase(); setSigPan(u); try { localStorage.setItem(sigPanKey, u.trim()); } catch { /* ignore */ } };

  const issues = useMemo(() => checkFilingSchema(fullFiling), [fullFiling]);
  // Save body = generator output MINUS the offline-utility envelope keys (version/hash).
  // The GSP Save API rejects those two with RET191106 "Error in Json structure validation" —
  // they belong only to the downloadable offline-tool JSON, never the API payload.
  const body = useMemo(() => {
    const b = JSON.parse(generateGstr1Json(fullFiling));
    delete b.version; delete b.hash;
    return b;
  }, [fullFiling]);
  // Structural check of the ACTUAL wire body (not the model) — closes the gap where the
  // local pre-check is greener than GSTN. Catches leaked internal/offline keys before Save.
  const bodyIssues = useMemo(() => checkSaveBodyStructure(body), [body]);
  const errors = [...issues, ...bodyIssues].filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  // Response envelope nests the payload at result.data.data.data — check all levels.
  const pick = (o: any, ...keys: string[]) => { for (const k of keys) { const v = o?.data?.data?.data?.[k] ?? o?.data?.data?.[k] ?? o?.data?.[k]; if (v != null) return v; } return undefined; };
  // API-level failure (HTTP 200 but status_cd:"0" / an error object) — status_cd/error sit at result.data.data.
  const apiErr = (o: any): any => { const d = o?.data?.data ?? o?.data; if (d?.status_cd === '0' || d?.error) return d?.error ?? d; return null; };
  // Session/auth failure (AUTH403 max-sessions, AUTH4033 invalid session, 401/403). A call on a
  // stale/dead session returns these — its result must NOT be trusted as real validation.
  const isSessionError = (o: any): boolean =>
    o?.status === 401 || o?.status === 403 ||
    /AUTH403|AUTH4033|Invalid Session|Maximum session/i.test(`${o?.error ?? ''} ${JSON.stringify(o?.data ?? '')}`);
  const isNil = Object.keys(body).every((k) => ['gstin', 'fp', 'gt', 'cur_gt', 'nil'].includes(k));
  const errInfo = useMemo(() => (errReport != null ? summarizeGstnError(errReport) : null), [errReport]);

  // 6-step filing stepper. Step 0 (Validate) is already passed — the modal only
  // opens once the Part-3 gate is green — so we start at Upload.
  const STEPS = ['Validate', 'Upload', 'Processing', 'Save/Reset', 'OTP', 'Verify & File'];
  const currentStep =
    phase === 'filed' ? 6 :
    phase === 'verify' ? 5 :
    phase === 'otp' ? 4 :
    phase === 'saved' ? 3 :
    phase === 'processing' ? 2 :
    1;

  // Default handler for ANY GSTN rejection: log the decoded code + meaning, the per-section
  // breakdown, the FULL error_report, and the FULL request body (pretty, untruncated).
  const reportError = (step: string, report: unknown) => {
    const info = summarizeGstnError(report);
    const lines: string[] = [`✗ ${step} REJECTED by GSTN`];
    if (info.code) lines.push(`   ▸ ${info.code}${info.meaning ? ` — ${info.meaning}` : ''}`);
    if (info.message) lines.push(`   ▸ ${info.message}`);
    if (info.sections.length) {
      lines.push(`   ▸ sections GSTN flagged: ${info.sections.map((s) => s.section).join(', ')}`);
      info.sections.forEach((s) => lines.push(`      • ${s.section}${s.code ? ` [${s.code}]` : ''}${s.message ? `: ${s.message}` : ''}${s.count > 1 ? ` (×${s.count})` : ''}`));
    } else {
      lines.push('   ▸ no per-section detail → top-level JSON-structure error (inspect the request body below)');
    }
    lines.push('── full error_report ──');
    lines.push(JSON.stringify(report ?? null, null, 2));
    lines.push('── exact request body sent (full) ──');
    lines.push(JSON.stringify(sentBody ?? body, null, 2));
    push(lines.join('\n'));
    setErrReport(report ?? { note: 'no error_report in response' });
  };

  // Gated poll → run `onOk` on REC/P; on ER surface the error; on 503/timeout set a
  // manual-poll fallback and stash `onOk` to resume when the CA confirms. Never
  // auto-continues past a timeout. `failPhase` is where to return on a hard failure.
  const pollThen = async (refId: string, label: string, token: string, failPhase: 'upload' | 'saved', onOk: () => void | Promise<void>) => {
    push('  polling (1.5 → 12 → 20 → 30 → 30s, cap 5)…');
    const out = await pollReturnStatusGated(year, month, refId, token, { onCall: countCall, onTick: (a, m) => push(`  check ${a}/${m}…`) });
    if (out.kind === 'SUCCESS') { push(`  status_cd ${out.status_cd} ✓`); setManualPoll(null); await onOk(); return; }
    if (out.kind === 'FAILED') { push(`  status_cd ${out.status_cd} ✗`); reportError(label, out.errorReport ?? out.raw); setBusy(false); setPhase(failPhase); return; }
    if (out.kind === 'UNAVAILABLE') { push('  ⚠ GSTN unavailable (maintenance) — paused. Retry later; nothing was lost.'); setManualPoll({ refId, label }); resumeRef.current = onOk; setBusy(false); return; }
    push(`  ⏳ ${label}: unconfirmed after 5 checks — NOT auto-continuing. Poll manually to confirm.`);
    setManualPoll({ refId, label }); resumeRef.current = onOk; setBusy(false);
  };

  // Manual re-poll (deliberate click) — one call; on success resume the stashed step.
  const doManualPoll = () => {
    if (!manualPoll || busy) return;
    setBusy(true); push('→ manual poll…');
    taxSession.run(async (token: string) => {
      const out = await pollOnce(year, month, manualPoll.refId, token, { onCall: countCall });
      if (out.kind === 'SUCCESS') { push('✓ Confirmed.'); setManualPoll(null); const r = resumeRef.current; resumeRef.current = null; await r?.(); setBusy(false); return; }
      if (out.kind === 'FAILED') { reportError(manualPoll.label, out.errorReport ?? out.raw); setManualPoll(null); resumeRef.current = null; setBusy(false); setPhase(manualPoll.label === 'Save' ? 'upload' : 'saved'); return; }
      if (out.kind === 'UNAVAILABLE') { push('  ⚠ still unavailable — retry later.'); setBusy(false); return; }
      push('  ⏳ still processing — poll again shortly.'); setBusy(false);
    });
  };

  // ── STEP: Upload (the Save POST) → Processing (gated poll) → Save/Reset ──
  const doUpload = () => {
    if (errors.length || busy || arn || phase !== 'upload') return;
    setBusy(true); setErrReport(null); setSentBody(body); setManualPoll(null);
    push('── Upload: sending the Save request to GSTN ──');
    taxSession.run(async (token: string) => {
      const sessLost = async (step: string) => { push(`✗ ${step}: stale/invalid session — cleared it. Reconnect (fresh OTP) and retry.`); await taxSession.logout(); setBusy(false); setPhase('upload'); };
      try {
        if (isNil) {
          push('→ NIL return — no draft to upload; continue to the decision step.');
          setBusy(false); setPhase('saved'); return;
        }
        setPhase('processing');
        push(`→ Save (gstr1Save) · session …${token.slice(-6)}`);
        countCall(); const save = await sandboxClient.gstr1Save(year, month, body, token);
        recordAudit(companyId, { gstin, period, step: 'save', payload: JSON.stringify(body), status: save.status, ok: save.ok, response: save.data });
        if (isSessionError(save)) { await sessLost('Save'); return; }
        if (!save.ok) { reportError('Save (HTTP)', save.data); setBusy(false); setPhase('upload'); return; }
        const se = apiErr(save); if (se) { reportError('Save', se); setBusy(false); setPhase('upload'); return; }
        const refId = pick(save, 'reference_id', 'referenceId');
        push(`▸ reference_id: ${refId ?? '(none)'}`);
        push('✓ Save accepted — processing…');
        if (refId) {
          await pollThen(String(refId), 'Save', token, 'upload', () => { push('✓ Draft saved at GSTN (REC/P).'); setBusy(false); setPhase('saved'); });
        } else { setBusy(false); setPhase('saved'); }
      } catch (e: any) { push(`✗ ${e?.message || 'error'}`); setBusy(false); setPhase('upload'); }
    });
  };

  // ── STEP: OTP — Proceed + Summary fire silently, then Request EVC ──
  const enterOtp = () => {
    if (busy || arn || phase !== 'saved') return;
    setBusy(true); setManualPoll(null); setPhase('otp');
    taxSession.run(async (token: string) => {
      const doSummary = async () => {
        push('→ Summary (summary_type=long)…');
        countCall(); const sum = await sandboxClient.gstr1Summary(year, month, token, 'long');
        recordAudit(companyId, { gstin, period, step: 'summary', payload: JSON.stringify({ year, month, summary_type: 'long' }), status: sum.status, ok: sum.ok, response: sum.data });
        if (isSessionError(sum)) { push('✗ Summary: stale session — reconnect and retry.'); await taxSession.logout(); setBusy(false); setPhase('saved'); return; }
        const secSum = pick(sum, 'sec_sum'); const chksum = pick(sum, 'chksum'); const newSumFlag = pick(sum, 'newSumFlag') ?? 'N';
        push('✓ Summary ready. Request the EVC OTP to file.');
        setReady({ pan, token, secSum, chksum, newSumFlag }); setEvcRequested(false); setBusy(false);
      };
      try {
        push('→ Proceed (new-proceed)…');
        countCall(); const proc = await sandboxClient.gstr1Proceed({ year, month, gstin, isNil: isNil ? 'Y' : 'N', sessionToken: token });
        recordAudit(companyId, { gstin, period, step: 'proceed', payload: JSON.stringify({ year, month, isNil }), status: proc.status, ok: proc.ok, response: proc.data });
        if (isSessionError(proc)) { push('✗ Proceed: stale session — reconnect and retry.'); await taxSession.logout(); setBusy(false); setPhase('saved'); return; }
        if (!proc.ok) { reportError('Proceed (HTTP)', proc.data); setBusy(false); setPhase('saved'); return; }
        const pe = apiErr(proc); if (pe) { reportError('Proceed', pe); setBusy(false); setPhase('saved'); return; }
        const pRef = pick(proc, 'reference_id');
        if (pRef) { await pollThen(String(pRef), 'Proceed', token, 'saved', doSummary); }
        else { await doSummary(); }
      } catch (e: any) { push(`✗ ${e?.message || 'error'}`); setBusy(false); setPhase('saved'); }
    });
  };

  // The EXACT wire body that File will send — shown in full for review before EVC.
  const previewFileBody = useMemo(() => {
    if (!ready) return null;
    const nsf = ready.newSumFlag === true || ready.newSumFlag === 'Y' || ready.newSumFlag === 'true';
    return isNil
      ? { gstin, ret_period: period, isnil: 'Y' }
      : { gstin, ret_period: period, chksum: ready.chksum, sec_sum: ready.secSum, newSumFlag: nsf, smryTyp: 'L' };
  }, [ready, isNil, gstin, period]);

  // EVC OTP is requested ONLY here — the deliberate Verify step, after body review.
  const doRequestEvc = async () => {
    if (!ready || busy || evcRequested || arn) return;
    if (!sigPanValid) { push('✗ Enter the authorized signatory’s PAN (individual PAN registered for this GSTIN) before requesting the EVC OTP.'); return; }
    setBusy(true); push('→ EVC OTP (gstEvcOtp) — requesting…');
    countCall(); const evc = await sandboxClient.gstEvcOtp(sigPanClean, 'gstr-1', ready.token);
    recordAudit(companyId, { gstin, period, step: 'evc-request', payload: JSON.stringify({ pan: sigPanClean, form: 'gstr-1' }), status: evc.status, ok: evc.ok, response: evc.data });
    if (isSessionError(evc)) { push('✗ EVC OTP: stale/invalid session — cleared it. Start e-Filing again for a fresh OTP.'); await taxSession.logout(); setBusy(false); return; }
    if (!evc.ok) { push(`✗ EVC OTP failed: ${evc.error || ''}`); setBusy(false); return; }
    push('✓ EVC OTP sent to the authorized signatory. Enter it below to file.'); setEvcRequested(true); setBusy(false);
  };

  const doFile = async () => {
    if (!ready || !evcRequested || !evcOtp.trim() || busy || arn || filedRef.current) return;   // idempotent — never re-file
    filedRef.current = true; setBusy(true);
    try {
      push('→ File (gstr1File)…');
      const nsf = ready.newSumFlag === true || ready.newSumFlag === 'Y' || ready.newSumFlag === 'true';
      const fileBody = isNil
        ? { gstin, ret_period: period, isnil: 'Y' }
        : { gstin, ret_period: period, chksum: ready.chksum, sec_sum: ready.secSum, newSumFlag: nsf, smryTyp: 'L' };
      setSentBody(fileBody);
      countCall(); const r = await sandboxClient.gstr1File({ year, month, pan: sigPanClean, otp: evcOtp.trim(), body: fileBody, sessionToken: ready.token });
      recordAudit(companyId, { gstin, period, step: 'file', payload: JSON.stringify(fileBody), status: r.status, ok: r.ok, response: r.data });
      const fe = apiErr(r);
      const a = pick(r, 'ack_num', 'arn', 'ARN');
      if (r.ok && a && !fe) { setArn(String(a)); setPhase('filed'); push(`✓ FILED. Acknowledgement: ${a}`); onFiled(String(a), fileBody); }
      else { reportError('File', fe ?? r.data); filedRef.current = false; }
    } catch (e: any) { push(`✗ ${e?.message}`); filedRef.current = false; }
    setBusy(false);
  };

  const doReset = () => {
    if (busy) return;
    if (arn) { push('✗ Cannot reset — the return is already FILED for this period.'); return; } // pre-File only
    if (!window.confirm('Reset the saved GSTR-1 draft at GSTN for this period? This clears the uploaded draft so you can re-save. It does NOT unfile an already-filed return.')) return;
    setBusy(true); push('→ Reset draft at GSTN (gstr1Reset)…');
    taxSession.run(async (token: string) => {
      countCall(); const r = await sandboxClient.gstr1Reset(year, month, token);
      recordAudit(companyId, { gstin, period, step: 'reset', payload: JSON.stringify({ year, month }), status: r.status, ok: r.ok, response: r.data });
      push(r.ok ? '✓ Draft reset at GSTN — back to Validate/Upload.' : `✗ Reset failed: ${r.error || ''}`);
      setReady(null); setErrReport(null); filedRef.current = false; setManualPoll(null); setEvcRequested(false); setEvcOtp(''); resumeRef.current = null; setBusy(false);
      if (r.ok) setPhase('upload');
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">e-File GSTR-1 · {periodLabel(period)}{isNil ? ' · NIL' : ''}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
        </div>
        <p className="mt-0.5 text-[11px] font-medium text-gray-500">Nothing is filed until you enter the EVC OTP and confirm.</p>

        {/* 6-step filing stepper */}
        <div className="mt-3 flex items-center">
          {STEPS.map((label, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`mt-1 text-[9px] font-semibold ${active ? 'text-blue-700' : done ? 'text-emerald-600' : 'text-gray-400'}`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${i < currentStep ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>

        {/* Session status + manual logout — reuses/refreshes one session and frees GSP slots (fixes AUTH403). */}
        {(() => {
          const st = taxSession.sessionStatus();
          const cls = st.state === 'active' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : st.state === 'expired' ? 'text-amber-700 bg-amber-50 border-amber-200'
            : 'text-gray-500 bg-gray-50 border-gray-200';
          return (
            <div className={`mt-2 flex items-center justify-between rounded-lg border px-3 py-1.5 text-[11px] ${cls}`} data-tick={taxSession.tick}>
              <span className="font-semibold">🔑 Session: {st.label}</span>
              <button type="button" onClick={() => taxSession.logout()} disabled={taxSession.phase === 'busy'}
                className="rounded border border-gray-300 bg-white px-2 py-0.5 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50">
                Logout / Clear session
              </button>
            </div>
          );
        })()}

        {/* Schema pre-check — only surfaces when there is something to fix (Upload phase). */}
        {phase === 'upload' && errors.length > 0 && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-700">Schema pre-check</div>
            <div className="mt-1 space-y-0.5">{errors.map((e, i) => <p key={i} className="text-sm text-red-600">✗ [{e.section}{e.row ? ` ${e.row}` : ''}] {e.message}</p>)}</div>
          </div>
        )}

        {errReport != null && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-red-700">GSTN rejected — full detail</div>
              <button type="button"
                onClick={() => navigator.clipboard?.writeText(JSON.stringify({ error_report: errReport, request_body: sentBody ?? body }, null, 2))}
                className="rounded border border-red-300 px-2 py-0.5 text-[10px] text-red-600 hover:bg-red-100">Copy all</button>
            </div>
            {errInfo?.code && <p className="mt-1 text-sm font-bold text-red-800">{errInfo.code}{errInfo.meaning && <span className="font-normal"> — {errInfo.meaning}</span>}</p>}
            {errInfo?.message && <p className="text-[12px] text-red-700">{errInfo.message}</p>}
            {errInfo && (errInfo.sections.length > 0
              ? <div className="mt-1.5">
                  <div className="text-[11px] font-semibold text-red-700">Sections GSTN flagged:</div>
                  {errInfo.sections.map((s, i) => <p key={i} className="text-[11px] text-red-700">• {s.section}{s.code ? ` [${s.code}]` : ''}{s.message ? `: ${s.message}` : ''}{s.count > 1 ? ` (×${s.count})` : ''}</p>)}
                </div>
              : <p className="mt-1 text-[11px] text-red-600">No per-section detail — a top-level JSON-structure error. Inspect the exact request body below.</p>
            )}
            <div className="mt-2 text-[11px] font-semibold text-red-700">Full error_report</div>
            <pre className="mt-0.5 max-h-52 overflow-auto whitespace-pre-wrap rounded bg-white p-2 text-[10px] text-red-800">{JSON.stringify(errReport, null, 2)}</pre>
            <div className="mt-2 text-[11px] font-semibold text-red-700">Exact request body sent to GSTN (full)</div>
            <pre className="mt-0.5 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-white p-2 text-[10px] text-gray-800">{JSON.stringify(sentBody ?? body, null, 2)}</pre>
          </div>
        )}

        {/* ── STEP: Upload (turnover + Save) ── */}
        {phase === 'upload' && (
          <>
            {/* Turnover — single source of truth (same model fields as the page card) */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-xs text-gray-600">Gross turnover — prev FY (₹)
                <input value={fullFiling.gt != null ? String(fullFiling.gt) : ''} onChange={(e) => onSaveTurnover(parseTurnover(e.target.value), fullFiling.cur_gt)} inputMode="numeric" className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm" placeholder="enter actual" />
              </label>
              <label className="text-xs text-gray-600">Turnover Apr–now (₹)
                <input value={fullFiling.cur_gt != null ? String(fullFiling.cur_gt) : ''} onChange={(e) => onSaveTurnover(fullFiling.gt, parseTurnover(e.target.value))} inputMode="numeric" className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm" placeholder="enter actual" />
              </label>
            </div>
            <button type="button" onClick={doUpload} disabled={errors.length > 0 || busy}
              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {busy ? 'Uploading…' : errors.length ? `Fix ${errors.length} schema error(s) first` : 'Upload to GSTN (Save draft)'}
            </button>
          </>
        )}

        {/* ── STEP: Processing ── */}
        {phase === 'processing' && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
            {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />}
            <span>{busy ? 'Processing at GSTN…' : 'Waiting for confirmation.'}</span>
          </div>
        )}

        {/* ── STEP: Save/Reset decision (reversible boundary) ── */}
        {phase === 'saved' && (
          <div className="mt-4 rounded-lg border border-gray-200 p-3">
            <p className="text-sm font-semibold text-gray-800">Draft saved at GSTN{isNil ? ' (NIL — nothing to upload)' : ' (accepted)'}.</p>
            <p className="mt-0.5 text-[12px] text-gray-500">Still reversible here. “Keep &amp; continue” moves toward filing — the point of no return. “Reset” clears the draft at GSTN and returns to the start.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={enterOtp} disabled={busy} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">Keep draft &amp; continue →</button>
              <button type="button" onClick={doReset} disabled={busy} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">Reset draft</button>
            </div>
          </div>
        )}

        {/* ── STEP: OTP (Proceed + Summary silent, then EVC) ── */}
        {phase === 'otp' && (
          <div className="mt-4 rounded-lg border border-gray-200 p-3">
            {!ready ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />}
                <span>Proceeding &amp; fetching summary…</span>
              </div>
            ) : !evcRequested ? (
              <div>
                <label className="block text-[12px] font-semibold text-gray-700">Authorized signatory PAN</label>
                <p className="mb-1 text-[11px] text-gray-500">The <b>individual</b> PAN registered as authorized signatory for this GSTIN on the GST portal — not the company PAN.</p>
                <input value={sigPan} onChange={(e) => saveSigPan(e.target.value)} placeholder="ABCDE1234F" maxLength={10} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-mono tracking-widest uppercase focus:border-blue-500 focus:outline-none" />
                {sigPan.trim() && !sigPanValid && <p className="mt-1 text-[11px] text-red-600">Invalid PAN format (AAAAA9999A).</p>}
                {sigPanValid && sigPanClean[3] !== 'P' && <p className="mt-1 text-[11px] text-amber-600">⚠ Authorized signatories are usually individuals (PAN 4th letter “P”). “{sigPanClean[3]}” suggests a non-individual — the portal will reject it if this PAN isn’t a registered signatory.</p>}
                <button type="button" onClick={doRequestEvc} disabled={busy || !sigPanValid} className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? 'Requesting EVC…' : 'Request EVC OTP'}</button>
              </div>
            ) : (
              <div>
                <p className="mb-1.5 text-[12px] text-gray-600">OTP sent to the authorized signatory’s registered mobile / email.</p>
                <input autoFocus value={evcOtp} onChange={(e) => setEvcOtp(e.target.value)} placeholder="Enter EVC OTP" inputMode="numeric" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center tracking-widest focus:border-blue-500 focus:outline-none" />
                <div className="mt-2 flex items-center justify-between">
                  <button type="button" onClick={doRequestEvc} disabled={busy} className="text-[11px] text-blue-500 hover:text-blue-700 disabled:opacity-50">Resend OTP</button>
                  <button type="button" onClick={() => setPhase('verify')} disabled={!evcOtp.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">Review &amp; File →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: Verify & File ── */}
        {phase === 'verify' && ready && (
          <div className="mt-4 rounded-lg border border-gray-200 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Verify &amp; File</div>
            <details open className="mt-2">
              <summary className="cursor-pointer text-[11px] font-semibold text-gray-600">Section summary (sec_sum)</summary>
              <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-[10px] text-gray-700">{JSON.stringify(ready.secSum ?? '(none returned)', null, 2)}</pre>
            </details>
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] font-semibold text-gray-600">Exact wire body (full, untruncated)</summary>
              <pre className="mt-1 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-[10px] text-gray-800">{JSON.stringify(previewFileBody, null, 2)}</pre>
            </details>
            <p className="mt-3 text-[12px] font-semibold text-red-600">Filing GSTR-1 for <span className="font-mono">{gstin}</span> · {periodLabel(period)} — this is legally binding and cannot be undone.</p>
            <button type="button" onClick={doFile} disabled={busy || !evcOtp.trim()} className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{busy ? 'Filing…' : 'Confirm & File'}</button>
            <button type="button" onClick={() => setPhase('otp')} disabled={busy} className="mt-1.5 text-[11px] text-gray-400 hover:text-gray-600">← Back to OTP</button>
          </div>
        )}

        {/* ── Filed ── */}
        {phase === 'filed' && arn && (
          <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-center">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">✓</div>
            <p className="text-sm font-bold text-emerald-800">GSTR-1 filed successfully</p>
            <p className="mt-0.5 text-[11px] text-emerald-700">{periodLabel(period)} · <span className="font-mono">{gstin}</span></p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">ARN</span>
              <span className="font-mono text-sm font-bold text-gray-800">{arn}</span>
              <button type="button" onClick={() => navigator.clipboard?.writeText(String(arn))} className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500 hover:bg-gray-50">Copy</button>
            </div>
            <div className="mt-2"><button type="button" onClick={() => window.print()} className="text-[11px] text-emerald-700 underline hover:text-emerald-900">Print / download acknowledgement</button></div>
          </div>
        )}

        {/* Blocked poll — manual re-poll */}
        {manualPoll && !arn && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            <span className="font-semibold">Unconfirmed at GSTN.</span>
            <span>Auto-poll stopped — nothing was assumed.</span>
            <button type="button" onClick={doManualPoll} disabled={busy} className="ml-auto rounded-md bg-amber-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50">{busy ? 'Polling…' : 'Poll GSTN now'}</button>
          </div>
        )}

        {/* Credit counter + collapsed technical log */}
        <div className="mt-3 flex items-center justify-end">
          <span className="text-[11px] font-medium text-gray-400">API calls this session: <span className="font-mono font-semibold text-gray-600">{apiCalls}</span></span>
        </div>
        {log.length > 0 && (
          <details className="mt-1">
            <summary className="cursor-pointer text-[11px] text-gray-400 hover:text-gray-600">Technical log ({log.length})</summary>
            <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-gray-900 p-2 text-[11px] text-gray-100">{log.join('\n')}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

// ── SUPECO Section (Table 14/15 — e-commerce operator supplies) ───────────────
// Auto rows are derived from ECO-flagged invoices (BooksBadge, read-only); manual
// rows below are editable. Any change flows through onChange → dirty-hash re-lock.
function SupecoSection({ autoRows, filing, onChange }: { autoRows:{ clttx:SupecoTx[]; paytx:SupecoTx[] }; filing:GSTR1Filing; onChange:(f:GSTR1Filing)=>void }) {
  const supeco = filing.supeco ?? { clttx: [], paytx: [] };
  const [adding, setAdding] = useState<null | 'clttx' | 'paytx'>(null);
  const blk = (): SupecoTx => ({ id:uid(), etin:'', suppval:0, igst:0, cgst:0, sgst:0, cess:0 });
  const [d, setD] = useState<SupecoTx>(blk());
  const rowMenu = useRowMenu();
  const setSupeco = (next:{ clttx:SupecoTx[]; paytx:SupecoTx[] }) => onChange({ ...filing, supeco: next });
  const add = (kind:'clttx'|'paytx') => { setSupeco({ ...supeco, [kind]: [...supeco[kind], d] }); setD(blk()); setAdding(null); };
  const del = (kind:'clttx'|'paytx', id:string) => setSupeco({ ...supeco, [kind]: supeco[kind].filter(r=>r.id!==id) });

  const valCell = (r:SupecoTx) => (<>
    <Td right mono>{formatIndianCurrency(r.suppval)}</Td>
    <Td right mono>{r.igst?formatIndianCurrency(r.igst):'—'}</Td>
    <Td right mono>{r.cgst?formatIndianCurrency(r.cgst):'—'}</Td>
    <Td right mono>{r.sgst?formatIndianCurrency(r.sgst):'—'}</Td>
    <Td right mono>{r.cess?formatIndianCurrency(r.cess):'—'}</Td>
  </>);

  // Rendered as a FUNCTION (not a nested component) so the add-form inputs keep focus.
  const renderTable = (kind:'clttx'|'paytx', title:string, note:string) => {
    const auto = autoRows[kind]; const manual = supeco[kind];
    return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <div><h4 className="text-sm font-bold text-gray-800">{title}</h4><p className="text-[11px] text-gray-500">{note}</p></div>
        {adding!==kind && <button type="button" onClick={()=>{ setD(blk()); setAdding(kind); }} className="text-sm font-medium text-blue-600 hover:text-blue-800">+ Add operator</button>}
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead><tr><Th ch="E-com Operator GSTIN" /><Th ch="Net Supply Value" right /><Th ch="IGST" right /><Th ch="CGST" right /><Th ch="SGST/UTGST" right /><Th ch="Cess" right /><Th /></tr></thead>
          <tbody>
            {auto.map(r=>(
              <tr key={r.id} className="bg-blue-50/30 border-b border-gray-100">
                <Td mono><div className="flex items-center gap-1"><BooksBadge />{r.etin||'—'}</div></Td>
                {valCell(r)}
                <td className="px-2 border-b border-gray-100" />
              </tr>
            ))}
            {manual.map(r=>(
              <tr key={r.id} title="Right-click for delete" onContextMenu={(e)=>rowMenu.open(e,{ onDelete:()=>del(kind,r.id) })} className="hover:bg-gray-50 border-b border-gray-100">
                <Td mono>{r.etin||'—'}</Td>
                {valCell(r)}
                <td className="px-2 border-b border-gray-100"><DelBtn onClick={()=>del(kind,r.id)} /></td>
              </tr>
            ))}
            {auto.length===0 && manual.length===0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-400">No operators for this period</td></tr>}
          </tbody>
        </table>
      </div>
      {adding===kind&&(
        <AddPanel onClose={()=>setAdding(null)}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <F label="E-com Operator GSTIN (etin)"><Inp value={d.etin} onChange={v=>setD({...d,etin:v.toUpperCase()})} placeholder="27AAGCM1234P1Z7" /></F>
            <F label="Net Supply Value (₹)"><Inp value={d.suppval||''} onChange={v=>setD({...d,suppval:parseFloat(v)||0})} className="text-right" /></F>
            <F label="IGST (₹)"><Inp value={d.igst||''} onChange={v=>setD({...d,igst:parseFloat(v)||0})} className="text-right" /></F>
            <F label="CGST (₹)"><Inp value={d.cgst||''} onChange={v=>setD({...d,cgst:parseFloat(v)||0})} className="text-right" /></F>
            <F label="SGST/UTGST (₹)"><Inp value={d.sgst||''} onChange={v=>setD({...d,sgst:parseFloat(v)||0})} className="text-right" /></F>
            <F label="Cess (₹)"><Inp value={d.cess||''} onChange={v=>setD({...d,cess:parseFloat(v)||0})} className="text-right" /></F>
          </div>
          <AddBtns onSave={()=>add(kind)} onClear={()=>setD(blk())} />
        </AddPanel>
      )}
    </div>
    );
  };

  return (
    <div>
      <div className="mb-3 flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-[11px] text-blue-700">
        <span className="shrink-0">ℹ</span>
        <span><strong>Table 14/15 — Supplies through E-commerce Operators:</strong> report net supplies made through an ECO, grouped by the operator's GSTIN. Collected u/s 52 = the operator collects TCS; Paid u/s 9(5) = the operator is liable to pay the tax.</span>
      </div>
      {renderTable('clttx', 'Table 14 — ECO collects tax (u/s 52)', 'Supplies on which the operator collects TCS')}
      {renderTable('paytx', 'Table 15 — ECO pays tax (u/s 9(5))', 'Supplies on which the operator pays the tax')}
      <RowContextMenu menu={rowMenu.menu} onClose={rowMenu.close} />
    </div>
  );
}

export default function GSTR1Page() {
  const { company, companyId, loading: companyLoading } = useCompany();
  const [period, setPeriod] = useState<string>(currentPeriod());
  const [filing, setFiling] = useState<GSTR1Filing | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [efileOpen, setEfileOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[] | null>(null);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  // Full-FY document-level Excel export (⋮ → Download FY … as Excel).
  const [yearXlsx, setYearXlsx] = useState(false);
  const [yearXlsxMsg, setYearXlsxMsg] = useState('');
  // ── Part 3: the validation gate. `gate` holds the last validation result and the
  // content-hash it was run against; if the live hash drifts, the gate re-locks. ──
  const [gate, setGate] = useState<{ result: Gstr1ValidateResult; hash: string } | null>(null);
  const [ackWarnings, setAckWarnings] = useState(false);
  const [showFindings, setShowFindings] = useState(false);

  const gstin = company?.gst_details?.gstin ?? '';
  const portalUsername = company?.gst_details?.portalUsername ?? '';
  const taxSession = useTaxpayerSession(gstin, portalUsername);
  const [combined, setCombined] = useState<CombinedFiled | null>(null);
  // Filed data only ever shows for a PAST period — guards against a stale cache
  // entry (e.g. saved under a current/future key before the period-gate existed).
  useEffect(() => { setCombined(companyId && isPastPeriod(period) ? getCombinedFiled(companyId, period) : null); }, [companyId, period]);
  const [searchParams, setSearchParams] = useSearchParams();
  const openSection = searchParams.get('section'); // null = dashboard; e.g. 'b2b' = drilled into B2B
  const companyStateCode = gstin.slice(0,2) || '27';
  const [invTick, setInvTick] = useState(0);

  // Load all invoices for this company (memoised on companyId + period + invTick)
  const allInvoices = useMemo(
    () => (companyId ? listInvoicesV2(companyId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companyId, period, invTick],
  );

  // Post-filing lock — once a period is filed (ARN received) it is fully read-only.
  const isFiledLocked = !!filing?.filed;
  const lockedRef = useRef(false);
  lockedRef.current = isFiledLocked;
  const notifyLocked = () => toast.error('This period is filed and locked.');

  const deleteAutoInv = (id: string) => { if (lockedRef.current) { notifyLocked(); return; } deleteInvoiceV2(id); setInvTick((t) => t + 1); };
  const updateAutoInv = (id: string, draft: Parameters<typeof updateInvoiceV2>[1]) => { if (lockedRef.current) { notifyLocked(); return; } updateInvoiceV2(id, draft); setInvTick((t) => t + 1); };

  useEffect(() => {
    if (!companyId) return;
    const f = getOrCreateFiling(companyId, period, gstin);
    // Backfill new fields for old filings
    if (!f.b2ba) f.b2ba = [];
    if (!f.b2cla) f.b2cla = [];
    if (!f.b2csa) f.b2csa = [];
    if (!f.expa) f.expa = [];
    if (!f.cdnra) f.cdnra = [];
    if (!f.cdnura) f.cdnura = [];
    if (!f.rcm_overrides) f.rcm_overrides = {};
    setFiling(f);
  }, [companyId, period, gstin]);

  // Live auto data from invoice registers
  const liveData = useMemo(() => {
    if (!filing) return null;
    return autoFillFromInvoices(allInvoices, filing, companyStateCode);
  }, [allInvoices, filing, companyStateCode]);

  const autoB2B = liveData?.b2b ?? [];
  const autoB2CL = liveData?.b2cl ?? [];
  const autoB2CS = liveData?.b2cs ?? [];
  const autoCDNR = liveData?.cdnr ?? [];
  const autoCDNUR = liveData?.cdnur ?? [];
  const autoEXP = liveData?.exp ?? [];
  const autoHSN = liveData?.hsn ?? [];
  const autoSupeco = liveData?.supeco ?? { clttx: [], paytx: [] };
  const autoNIL = liveData?.nil ?? null; // merged auto+manual nil (BoS / nil-rated lines); null → keep manual

  const handleChange = useCallback((updated: GSTR1Filing) => {
    if (lockedRef.current) { notifyLocked(); return; } // filed period is read-only
    setFiling(updated);
    saveFiling(updated);
  }, []);

  // Persist the filed record (bypasses the lock — this is what SETS the lock).
  const markFiled = (arn: string, _fileBody: unknown) => {
    if (!filing) return;
    const next: GSTR1Filing = { ...filing, status: 'filed', filed: { arn, filedAt: new Date().toISOString(), bodyHash: hashFiling(filing) } };
    setFiling(next);
    saveFiling(next);
  };

  // Combined filing for JSON (auto rows get RCM overrides applied)
  const fullFiling = useMemo((): GSTR1Filing | null => {
    if (!filing) return null;
    const autoB2BWithRCM = autoB2B.map(r => ({
      ...r,
      rchrg: filing.rcm_overrides?.[r.id] ?? r.rchrg,
    }));
    return {
      ...filing,
      b2b: [...autoB2BWithRCM, ...filing.b2b],
      b2cl: [...autoB2CL, ...filing.b2cl],
      b2cs: [...autoB2CS, ...filing.b2cs],
      cdnr: [...autoCDNR, ...filing.cdnr],
      cdnur: [...autoCDNUR, ...filing.cdnur],
      exp: [...autoEXP, ...filing.exp],
      hsn: [...autoHSN, ...filing.hsn],
      nil: autoNIL ?? filing.nil, // autoFill already merged manual nil in; fall back to manual when no live data
      supeco: {
        clttx: [...autoSupeco.clttx, ...(filing.supeco?.clttx ?? [])],
        paytx: [...autoSupeco.paytx, ...(filing.supeco?.paytx ?? [])],
      },
    };
  }, [filing, autoB2B, autoB2CL, autoB2CS, autoCDNR, autoCDNUR, autoEXP, autoHSN, autoSupeco, autoNIL]);

  const handleValidate = () => {
    if (!fullFiling) return;
    setValidationErrors(validateFiling(fullFiling));
  };

  // ── Part 3 gate: pure client-side validation (zero API calls). Running it stamps
  // the current content-hash; any later edit changes the hash and re-locks. ──
  const currentHash = useMemo(() => (fullFiling ? hashFiling(fullFiling) : ''), [fullFiling]);
  const gateFresh = gate != null && gate.hash === currentHash;
  const needsRevalidation = gate != null && !gateFresh;
  const gateOpen =
    gateFresh &&
    gate!.result.status !== 'BLOCKERS' &&
    (gate!.result.status === 'PASS' || ackWarnings);

  const runGate = () => {
    if (!fullFiling) return;
    setGate({ result: validateGstr1(fullFiling), hash: currentHash });
    setAckWarnings(false);
    setShowFindings(true);
  };
  const goToSection = (section: string) => {
    const key = sectionAnchor(section);
    if (key) { setSearchParams({ section: key }); setShowFindings(false); }
  };
  // Turnover lives in the filing model (single source of truth); the card and the
  // e-File modal both write it. Editing it changes the hash → the gate re-locks.
  const gtRef = useRef<HTMLInputElement>(null);
  const curGtRef = useRef<HTMLInputElement>(null);
  const setTurnover = (field: 'gt' | 'cur_gt', raw: string) => {
    if (!filing) return;
    handleChange({ ...filing, [field]: parseTurnover(raw) });
  };
  const goToReturnDetails = (field?: string) => {
    document.getElementById('return-details')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const ref = field === 'cur_gt' ? curGtRef : gtRef;
    window.setTimeout(() => ref.current?.focus(), 300);
    setShowFindings(false);
  };

  const handleDownloadJson = () => {
    if (!fullFiling || (!gateOpen && !isFiledLocked)) return; // gated — unless it's a filed (final) return
    setShowMenu(false);
    const json = generateGstr1Json(fullFiling);
    const blob = new Blob([json], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1_${fullFiling.gstin||companyId}_${fullFiling.period}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import the FILED GSTR-1 + GSTR-1A for the current period from the GST portal.
  // The taxpayer session (~6h) is reused across all fetches; a fresh OTP is only
  // driven (inline modal) when there's no live session — one OTP unlocks the window.
  const runImport = async (token: string) => {
    if (!companyId) return;
    const month = period.slice(0, 2), year = period.slice(2);
    setImporting(true);
    setImportMsg(`Checking filing status for ${periodLabel(period)}…`);
    try {
      // Gate: only pull "As filed" data when GSTR-1 is actually FILED for THIS exact period.
      const filedList = await fetchFiledReturns(year, month, token);
      const r1 = findGstr1Filing(filedList, period);
      if (!r1) {
        const others = filedList.map((f) => f.rtntype).filter(Boolean).join(', ');
        setImportMsg(`GSTR-1 is not filed on the portal for ${periodLabel(period)} — nothing to import.${others ? ` (Filed for this period: ${others}.)` : ''}`);
        return;
      }
      setImportMsg(`Fetching filed GSTR-1 + GSTR-1A for ${periodLabel(period)}…`);
      const res = await importCombinedFiled(gstin, year, month, token, (label) => setImportMsg(`Fetching ${label}…`));
      saveCombinedFiled(companyId, res);
      setCombined(res);
      const n1 = res.gstr1.length, n1a = res.gstr1a.length;
      const exp = getSessionInfo(gstin)?.exp;
      const validity = exp ? ` · session valid ${formatRemaining(exp)}` : '';
      const filedOn = r1.dof ? ` · filed ${r1.dof}` : '';
      const arn = r1.arn ? ` (ARN ${r1.arn})` : '';
      setImportMsg(
        n1 + n1a === 0
          ? `GSTR-1 filed for ${periodLabel(period)}${filedOn}${arn}, but it returned no line items (nil/empty return).${validity}`
          : `Imported ${periodLabel(period)} — ${n1} GSTR-1 + ${n1a} GSTR-1A section(s)${filedOn}${arn} · ${res.calls} API call(s)${validity}.`,
      );
    } catch (e: any) {
      setImportMsg(e?.message || 'Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  /** FY label ("2025-26") of the financial year the given period falls in. */
  const fyLabelOfPeriod = (fp: string) => {
    const { year, month } = parsePeriod(fp);
    const s = fyOf(year, month).startYear;
    return `${s}-${String((s + 1) % 100).padStart(2, '0')}`;
  };

  /** ⋮ → Download the whole financial year as Excel, one sheet per month, with
   *  every filed document (party, GSTIN, doc no/date, POS, rate, tax split). */
  const handleYearExcel = () => {
    if (!gstin) { setImportMsg('Set the company GSTIN in Company Settings before exporting.'); return; }
    const { year, month } = parsePeriod(period);
    const fyStartYear = fyOf(year, month).startYear;
    setYearXlsx(true); setYearXlsxMsg('');
    taxSession.run(async (token: string) => {
      try {
        const r = await exportGstr1YearDetailExcel({
          gstin,
          companyName: company?.name,
          fyStartYear,
          sessionToken: token,
          registrationDate: company?.gst_details?.registrationDate,
          onProgress: (p) => setYearXlsxMsg(p.label ? `${p.done}/${p.total} ${p.label}` : ''),
        });
        setImportMsg(`FY ${fyLabelOfPeriod(period)} exported — ${r.rows} document(s) across ${r.months} month(s) with data.`);
      } catch (e) {
        setImportMsg(e instanceof Error ? e.message : 'Could not build the annual Excel.');
      } finally {
        setYearXlsx(false); setYearXlsxMsg('');
      }
    }).catch(() => { setYearXlsx(false); setYearXlsxMsg(''); });
  };

  const handleImport = () => {
    if (!companyId) return;
    if (!gstin) { setImportMsg('Set the company GSTIN in Company Settings (GST & e-Way Bill tab) before importing.'); return; }
    if (!portalUsername) { setImportMsg('Set the GST portal username in Company Settings (GST & e-Way Bill tab) before importing.'); return; }
    if (!isPastPeriod(period)) { setImportMsg(`No filed GSTR-1 can exist for ${periodLabel(period)} yet — it's the current or a future period. Pick a completed past period to import filed data.`); return; }
    const cached = getCombinedFiled(companyId, period);
    if (cached) { setCombined(cached); setImportMsg(`${periodLabel(period)} already imported (${relTime(cached.importedAt)}) — served from cache; filed returns don't change, so it isn't re-fetched.`); return; }
    setImportMsg(null);
    taxSession.run(runImport);   // reuses the ~6h session, or drives OTP (inline modal) when none
  };

  if (companyLoading || !company) {
    return <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!filing) {
    return <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col min-h-0">
      <PageHeader title="GSTR-1" description="Outward supply return">
        <div className="flex items-center gap-2">
          {/* Filed chip — quiet, only when the period is locked */}
          {isFiledLocked && filing.filed && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <span aria-hidden>✓</span> Filed · ARN {filing.filed.arn} · {new Date(filing.filed.filedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          )}
          {/* Period — single calendar icon */}
          <button type="button" onClick={()=>setShowPeriodPicker(true)} title={`Period: ${periodLabel(period)}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </button>
          {showPeriodPicker && <PeriodPickerModal period={period} onSelect={p=>{setPeriod(p);setShowPeriodPicker(false);}} onClose={()=>setShowPeriodPicker(false)} />}

          {/* Three-dot actions menu */}
          <div className="relative">
            <button type="button" onClick={()=>setShowMenu(v=>!v)} title="Actions"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM10 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM10 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
              </svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={()=>setShowMenu(false)} />
                <div className="absolute right-0 z-50 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <button type="button" disabled={importing} onClick={()=>{ setShowMenu(false); handleImport(); }} className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">{importing ? 'Importing…' : 'Import (GSTR-1 + 1A)'}</button>
                  <button type="button" disabled={yearXlsx} onClick={()=>{ setShowMenu(false); handleYearExcel(); }}
                    title={`Download every filed document of FY ${fyLabelOfPeriod(period)} as Excel — one sheet per month`}
                    className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    {yearXlsx ? `Building Excel… ${yearXlsxMsg}` : `Download FY ${fyLabelOfPeriod(period)} as Excel`}
                  </button>
                  <div className="my-1 h-px bg-gray-100" />
                  {isFiledLocked ? (
                    <>
                      <button type="button" onClick={()=>{ handleDownloadJson(); }} className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50">Download filed JSON</button>
                      <div className="px-3 py-1.5 text-[11px] font-medium text-emerald-600">✓ Filed — this period is locked.</div>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={()=>{ runGate(); setShowMenu(false); }} className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50">Validate for filing</button>
                      <button type="button" disabled={!gateOpen} onClick={()=>{ handleDownloadJson(); }} title={gateOpen ? 'Download the GSTN JSON' : 'Validate first (must PASS) to unlock'} className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">Download JSON{!gateOpen && ' 🔒'}</button>
                      <div className="my-1 h-px bg-gray-100" />
                      <button type="button" disabled={!gateOpen} onClick={()=>{ setShowMenu(false); setEfileOpen(true); }} title={gateOpen ? 'Start e-Filing' : 'Validate first (must PASS) to unlock'} className="block w-full px-3 py-1.5 text-left text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">e-File GSTR-1{!gateOpen && ' 🔒'}</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </PageHeader>

      {importMsg && (
        <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          <span className="flex items-center gap-2">
            {importing && <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />}
            <span>{importMsg}</span>
          </span>
          {!importing && <button type="button" onClick={()=>setImportMsg(null)} className="shrink-0 text-blue-400 hover:text-blue-600" aria-label="Dismiss">✕</button>}
        </div>
      )}

      {!gstin && (
        <div className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          GSTIN not set — go to Company Settings to add it before filing.
        </div>
      )}

      {/* ── Filed-and-locked banner (quiet, standard card) ── */}
      {isFiledLocked && (
        <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
          This period is filed and locked — read-only. Corrections are made through amendment sections in a future period’s return.
        </div>
      )}

      {/* ── Return-level details — turnover (required to file; single source of truth) ── */}
      {!isFiledLocked && (
      <div id="return-details" className="mb-3 scroll-mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Return-level details</div>
          <span className="text-[11px] text-gray-400">Required to file · flows into Download JSON &amp; e-File</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-gray-600">Gross turnover — previous FY (₹)
            <input ref={gtRef} value={filing.gt != null ? String(filing.gt) : ''} onChange={(e) => setTurnover('gt', e.target.value)} inputMode="numeric" placeholder="enter actual (no estimate)"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            {filing.gt != null && <p className="mt-0.5 font-mono text-[11px] text-gray-400">{formatIndianCurrency(filing.gt)}</p>}
          </label>
          <label className="text-xs font-medium text-gray-600">Turnover — April to date (₹)
            <input ref={curGtRef} value={filing.cur_gt != null ? String(filing.cur_gt) : ''} onChange={(e) => setTurnover('cur_gt', e.target.value)} inputMode="numeric" placeholder="enter actual (Apr–now)"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            {filing.cur_gt != null && <p className="mt-0.5 font-mono text-[11px] text-gray-400">{formatIndianCurrency(filing.cur_gt)}</p>}
          </label>
        </div>
        <p className="mt-2 text-[11px] text-gray-400">Editing turnover re-locks the return until you re-validate — the safety gate doing its job.</p>
      </div>
      )}

      {/* ── Part 3: validation-gate findings panel (client-side, zero credits) ── */}
      {needsRevalidation && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
          <span aria-hidden>⟳</span> Re-validation required — the return changed since it was last validated. Download &amp; e-File are locked.
          <button type="button" onClick={runGate} className="ml-auto rounded-md bg-amber-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-700">Re-validate</button>
        </div>
      )}
      {showFindings && gate && gateFresh && (
        <div className="mb-3 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <div className="flex items-center gap-2">
              {gate.result.status === 'PASS' && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">✓ PASS — ready to file</span>}
              {gate.result.status === 'WARNINGS' && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">⚠ {gate.result.warnings} warning{gate.result.warnings !== 1 ? 's' : ''}</span>}
              {gate.result.status === 'BLOCKERS' && <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">✕ {gate.result.blockers} blocker{gate.result.blockers !== 1 ? 's' : ''}</span>}
              <span className="text-[11px] text-gray-400">Client-side check · no GSTN call · no credits</span>
            </div>
            <button type="button" onClick={()=>setShowFindings(false)} className="text-gray-400 hover:text-gray-600" aria-label="Dismiss">✕</button>
          </div>

          {gate.result.status === 'PASS' && (
            <div className="px-4 py-3 text-sm text-emerald-800">All schema and envelope checks passed. Download JSON and e-File are unlocked.</div>
          )}

          {gate.result.findings.length > 0 && (
            <div className="max-h-72 divide-y divide-gray-50 overflow-y-auto">
              {gate.result.findings.map((f, i) => {
                const isTurnover = f.field === 'gt' || f.field === 'cur_gt';
                const sectionKey = sectionAnchor(f.section);
                const isErr = f.severity === 'error';
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-2">
                    <span className={`mt-0.5 shrink-0 text-xs font-bold ${isErr ? 'text-red-600' : 'text-amber-600'}`}>{isErr ? '✕' : '⚠'}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${isErr ? 'text-red-800' : 'text-amber-800'}`}>
                        <span className="font-semibold">[{f.section}{f.row ? ` · ${f.row}` : ''}]</span> {f.message}
                      </p>
                    </div>
                    {isTurnover ? (
                      <button type="button" onClick={()=>goToReturnDetails(f.field)} className="shrink-0 rounded-md border border-gray-200 px-2 py-0.5 text-[11px] font-semibold text-blue-600 hover:bg-blue-50">Enter turnover →</button>
                    ) : sectionKey ? (
                      <button type="button" onClick={()=>goToSection(f.section)} className="shrink-0 rounded-md border border-gray-200 px-2 py-0.5 text-[11px] font-semibold text-blue-600 hover:bg-blue-50">Go to section →</button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {gate.result.status === 'WARNINGS' && (
            <div className="flex items-center gap-2 border-t border-gray-100 bg-amber-50/40 px-4 py-2.5">
              <label className="flex items-center gap-2 text-sm text-amber-900">
                <input type="checkbox" checked={ackWarnings} onChange={(e)=>setAckWarnings(e.target.checked)} className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500" />
                I have reviewed the warnings and want to proceed.
              </label>
              <span className="ml-auto text-[11px] font-medium text-amber-700">{ackWarnings ? 'Unlocked' : 'Download & e-File stay locked until acknowledged'}</span>
            </div>
          )}
          {gate.result.status === 'BLOCKERS' && (
            <div className="border-t border-gray-100 bg-red-50/40 px-4 py-2.5 text-[12px] font-semibold text-red-700">Fix every blocker above, then re-validate. Download &amp; e-File cannot be unlocked while blockers remain.</div>
          )}
        </div>
      )}

      {/* Dashboard (no ?section) = tax summary + portal-style section tiles → click to drill in.
          Drilled in (?section=…) = a back link, and only that section's detail renders below. */}
      {openSection == null ? (
        fullFiling && <OverviewSection fullFiling={fullFiling} period={period} onNavigate={(key)=>setSearchParams({ section: key })} />
      ) : (
        <button type="button" onClick={()=>setSearchParams({})}
          className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
          <span aria-hidden>←</span> Back to all sections
        </button>
      )}

      {/* Only the drilled-in section renders (dashboard mode renders none) */}
      <OpenSectionCtx.Provider value={openSection ? `sec-${openSection}` : null}>
      <div className="mt-4 space-y-8">
        <SectionBlock id="sec-b2b" title="B2B" tableNum="4" subtitle="Supplies to Registered Persons">
          <B2BSection view="regular" autoRows={autoB2B} filing={filing} onChange={handleChange} period={period} companyStateCode={companyStateCode} onDeleteAuto={deleteAutoInv} onUpdateAuto={updateAutoInv} allInvoices={allInvoices} />
          <FiledDataView combined={combined} gstr1Keys={['b2b']} />
        </SectionBlock>
        <SectionBlock id="sec-b2ba" title="B2BA — Amended B2B" tableNum="9A" subtitle="Amendments to earlier B2B invoices">
          <B2BSection view="amend" autoRows={autoB2B} filing={filing} onChange={handleChange} period={period} companyStateCode={companyStateCode} onDeleteAuto={deleteAutoInv} onUpdateAuto={updateAutoInv} allInvoices={allInvoices} />
          <FiledDataView combined={combined} gstr1Keys={['b2ba']} gstr1aKeys={['b2b','b2ba']} amend />
        </SectionBlock>
        <SectionBlock id="sec-b2cl" title="B2CL" tableNum="5" subtitle="Inter-state Supplies to Unregistered (>₹1L)">
          <B2CLSection view="regular" autoRows={autoB2CL} filing={filing} onChange={handleChange} period={period} companyStateCode={companyStateCode} onDeleteAuto={deleteAutoInv} />
          <FiledDataView combined={combined} gstr1Keys={['b2cl']} />
        </SectionBlock>
        <SectionBlock id="sec-b2cla" title="B2CLA — Amended B2CL" tableNum="9A" subtitle="Amendments to earlier B2CL invoices">
          <B2CLSection view="amend" autoRows={autoB2CL} filing={filing} onChange={handleChange} period={period} companyStateCode={companyStateCode} onDeleteAuto={deleteAutoInv} />
          <FiledDataView combined={combined} gstr1Keys={['b2cla']} gstr1aKeys={['b2cl','b2cla']} amend />
        </SectionBlock>
        <SectionBlock id="sec-b2cs" title="B2CS" tableNum="7" subtitle="Other Supplies to Unregistered">
          <B2CSSection autoRows={autoB2CS} filing={filing} onChange={handleChange} />
          <FiledDataView combined={combined} gstr1Keys={['b2cs']} />
        </SectionBlock>
        <SectionBlock id="sec-b2csa" title="B2CSA — Amended B2CS" tableNum="10" subtitle="Amendments to earlier B2CS supplies">
          <B2CSSection view="amend" period={period} autoRows={autoB2CS} filing={filing} onChange={handleChange} />
          <FiledDataView combined={combined} gstr1Keys={['b2csa']} gstr1aKeys={['b2cs','b2csa']} amend />
        </SectionBlock>
        <SectionBlock id="sec-exp" title="EXP" tableNum="6A" subtitle="Export Supplies">
          <EXPSection autoRows={autoEXP} filing={filing} onChange={handleChange} onDeleteAuto={deleteAutoInv} />
          <FiledDataView combined={combined} gstr1Keys={['exp']} />
        </SectionBlock>
        <SectionBlock id="sec-expa" title="EXPA — Amended Exports" tableNum="9A" subtitle="Amendments to earlier export invoices">
          <EXPSection view="amend" autoRows={autoEXP} filing={filing} onChange={handleChange} onDeleteAuto={deleteAutoInv} />
          <FiledDataView combined={combined} gstr1Keys={['expa']} gstr1aKeys={['exp','expa']} amend />
        </SectionBlock>
        <SectionBlock id="sec-cdnr" title="CDNR" tableNum="9B" subtitle="Credit / Debit Notes (Registered)">
          <CDNRSection autoRows={autoCDNR} filing={filing} onChange={handleChange} onDeleteAuto={deleteAutoInv} />
          <FiledDataView combined={combined} gstr1Keys={['cdnr']} />
        </SectionBlock>
        <SectionBlock id="sec-cdnra" title="CDNRA — Amended CDN (Reg)" tableNum="9C" subtitle="Amendments to earlier registered credit/debit notes">
          <CDNRSection view="amend" autoRows={[]} filing={filing} onChange={handleChange} onDeleteAuto={deleteAutoInv} />
          <FiledDataView combined={combined} gstr1Keys={['cdnra']} gstr1aKeys={['cdnr','cdnra']} amend />
        </SectionBlock>
        <SectionBlock id="sec-cdnur" title="CDNUR" tableNum="9B" subtitle="Credit / Debit Notes (Unregistered)">
          <CDNURPanel autoRows={autoCDNUR} filing={filing} onChange={handleChange} onDeleteAuto={deleteAutoInv} />
          <FiledDataView combined={combined} gstr1Keys={['cdnur']} />
        </SectionBlock>
        <SectionBlock id="sec-cdnura" title="CDNURA — Amended CDN (Unreg)" tableNum="9C" subtitle="Amendments to earlier unregistered credit/debit notes">
          <CDNURPanel view="amend" autoRows={autoCDNUR} filing={filing} onChange={handleChange} onDeleteAuto={deleteAutoInv} />
          <FiledDataView combined={combined} gstr1Keys={['cdnura']} gstr1aKeys={['cdnur','cdnura']} amend />
        </SectionBlock>
        <SectionBlock id="sec-nil" title="NIL" tableNum="8" subtitle="Nil / Exempt / Non-GST Supplies">
          <NILSection filing={filing} onChange={handleChange} />
          <FiledDataView combined={combined} gstr1Keys={['nil']} />
        </SectionBlock>
        <SectionBlock id="sec-at" title="Advance Tax" tableNum="11A" subtitle="Tax Liability on Advances Received">
          <ATTXPDSection section="at" filing={filing} onChange={handleChange} />
          <FiledDataView combined={combined} gstr1Keys={['at']} />
        </SectionBlock>
        <SectionBlock id="sec-txpd" title="Adv. Adjusted" tableNum="11B" subtitle="Advance Amount Adjusted Against Tax Paid Earlier">
          <ATTXPDSection section="txpd" filing={filing} onChange={handleChange} />
          <FiledDataView combined={combined} gstr1Keys={['txpd']} />
        </SectionBlock>
        <SectionBlock id="sec-ata" title="ATA — Amended Advance Tax" tableNum="11(II)" subtitle="Amendments to advances received in a prior month">
          <ATTXPDAmendSection section="ata" filing={filing} onChange={handleChange} period={period} />
          <FiledDataView combined={combined} gstr1Keys={['ata']} amend />
        </SectionBlock>
        <SectionBlock id="sec-txpda" title="TXPDA — Amended Adv. Adjusted" tableNum="11(II)" subtitle="Amendments to advances adjusted in a prior month">
          <ATTXPDAmendSection section="txpda" filing={filing} onChange={handleChange} period={period} />
          <FiledDataView combined={combined} gstr1Keys={['txpda']} amend />
        </SectionBlock>
        <SectionBlock id="sec-hsn" title="HSN" tableNum="12" subtitle="HSN-wise Summary">
          <HSNSection autoRows={autoHSN} filing={filing} onChange={handleChange} />
          <FiledDataView combined={combined} gstr1Keys={['hsn']} />
        </SectionBlock>
        <SectionBlock id="sec-doc" title="DOC" tableNum="13" subtitle="Document Issue Summary">
          <DocSection filing={filing} onChange={handleChange} allInvoices={allInvoices} />
          <FiledDataView combined={combined} gstr1Keys={['doc']} />
        </SectionBlock>

        <SectionBlock id="sec-supeco" title="SUPECO" tableNum="14/15" subtitle="Supplies through E-commerce Operators">
          <SupecoSection autoRows={autoSupeco} filing={filing} onChange={handleChange} />
        </SectionBlock>
      </div>
      </OpenSectionCtx.Provider>

      {validationErrors !== null && <ValidationModal errors={validationErrors} onClose={()=>setValidationErrors(null)} />}
      {taxSession.phase === 'otp' && <OtpModal gstin={gstin} otp={taxSession.otp} setOtp={taxSession.setOtp} onVerify={taxSession.verify} onCancel={taxSession.cancel} />}
      {efileOpen && fullFiling && <EFileModal fullFiling={fullFiling} gstin={gstin} period={period} companyId={companyId ?? ''} taxSession={taxSession} onClose={()=>setEfileOpen(false)} onSaveTurnover={(g,c)=>{ if(filing) handleChange({ ...filing, gt: g, cur_gt: c }); }} onFiled={markFiled} />}
    </div>
  );
}

// ── CDNUR panel (inline, to avoid re-declaring type) ─────────────────────────

function CDNURPanel({ autoRows, filing, onChange, onDeleteAuto, view='regular' }: { autoRows: CDNURNote[]; filing:GSTR1Filing; onChange:(f:GSTR1Filing)=>void; onDeleteAuto:(id:string)=>void; view?:'regular'|'amend' }) {
  type N = CDNURNote;
  const isAmend = view === 'amend';
  const listKey = isAmend ? 'cdnura' as const : 'cdnur' as const;
  const [adding, setAdding] = useState(false);
  const blk = (): N => ({ id:uid(), ntty:'C', typ:'B2CL', ntnum:'', ntdt:'', val:0, pos:'27', inv_typ:'R', p_gst:'N', itms:[{num:1,itm_det:{rt:18,txval:0}}], ...(isAmend?{ont_num:'',ont_dt:'',isAmended:true}:{}) });
  const [d, setD] = useState<N>(blk());
  const autoList = isAmend ? [] : autoRows;
  const manualList: N[] = isAmend ? (filing.cdnura ?? []) : filing.cdnur;
  const add = () => { onChange({...filing,[listKey]:[...manualList,d]}); setD(blk()); setAdding(false); };
  const del = (id:string) => onChange({...filing,[listKey]:manualList.filter(r=>r.id!==id)});
  const rowMenu = useRowMenu();
  const allRows = [...autoList, ...manualList];
  const posShown = d.typ === 'B2CL'; // EXPWP/EXPWOP are exports → no place of supply
  return (
    <div>
      <SectionHeader addLabel={isAmend?'Add CDNURA note':'Add note'} onAdd={()=>setAdding(true)} hideAdd={adding} />
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead><tr>{isAmend && <><Th ch="Orig. Note No." /><Th ch="Orig. Date" /></>}<Th ch="UR Type" /><Th ch="Note No." /><Th ch="Note Date" /><Th ch="Note Type" /><Th ch="Place of Supply" /><Th ch="Note Value" right /><Th ch="Rate%" /><Th ch="Taxable" right /><Th ch="IGST" right /><Th /></tr></thead>
          <tbody>
            {autoList.map(r=>(
              <tr key={r.id} title="Right-click for delete" onContextMenu={(e)=>rowMenu.open(e,{ onDelete:()=>{ if(window.confirm('Delete this auto-imported credit/debit note? Journal entries are not affected.')) onDeleteAuto(r.id); } })} className="bg-blue-50/30 hover:bg-blue-50/60">
                <Td dim>{r.typ}</Td><Td><div className="flex items-center gap-1"><BooksBadge />{r.ntnum}</div></Td><Td dim>{r.ntdt}</Td>
                <Td><span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${r.ntty==='C'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{r.ntty==='C'?'Credit':'Debit'}</span></Td>
                <Td dim>{r.typ==='B2CL'?(STATE_CODES[r.pos]||r.pos):'—'}</Td>
                <Td right mono>{formatIndianCurrency(r.val)}</Td>
                <Td dim>{r.itms[0]?.itm_det.rt}%</Td>
                <Td right mono>{formatIndianCurrency(r.itms[0]?.itm_det.txval??0)}</Td>
                <Td right mono>{r.itms[0]?.itm_det.iamt?formatIndianCurrency(r.itms[0].itm_det.iamt):'—'}</Td>
                <td className="px-2 border-b border-gray-100" />
              </tr>
            ))}
            {manualList.map(r=>(
              <tr key={r.id} title="Right-click for delete" onContextMenu={(e)=>rowMenu.open(e,{ onDelete:()=>del(r.id) })} className={isAmend?'border-b border-indigo-100 hover:bg-indigo-50/60':'hover:bg-gray-50'}>
                {isAmend && <><Td dim>{r.ont_num||'—'}</Td><Td dim>{r.ont_dt||'—'}</Td></>}
                <Td dim>{r.typ}</Td><Td>{r.ntnum}</Td><Td dim>{r.ntdt}</Td>
                <Td><span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${r.ntty==='C'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{r.ntty==='C'?'Credit':'Debit'}</span></Td>
                <Td dim>{r.typ==='B2CL'?(STATE_CODES[r.pos]||r.pos):'—'}</Td>
                <Td right mono>{formatIndianCurrency(r.val)}</Td>
                <Td dim>{r.itms[0]?.itm_det.rt}%</Td>
                <Td right mono>{formatIndianCurrency(r.itms[0]?.itm_det.txval??0)}</Td>
                <Td right mono>{r.itms[0]?.itm_det.iamt?formatIndianCurrency(r.itms[0].itm_det.iamt):'—'}</Td>
                <td className="px-2 border-b border-gray-100" />
              </tr>
            ))}
            {allRows.length===0&&<tr><td colSpan={isAmend?12:10} className="px-4 py-8 text-center text-sm text-gray-400">No {isAmend?'note amendments':'credit/debit notes to unregistered persons'}</td></tr>}
          </tbody>
        </table>
      </div>
      <RowContextMenu menu={rowMenu.menu} onClose={rowMenu.close} />
      {adding&&(
        <AddPanel onClose={()=>setAdding(false)} isAmend={isAmend}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {isAmend && <><F label="Original Note No. (≤16, being amended)"><Inp value={d.ont_num||''} onChange={v=>setD({...d,ont_num:v.slice(0,16)})} placeholder="Old CNU-001" /></F><F label="Original Note Date (prior period)"><DatePicker value={d.ont_dt||''} onChange={v=>setD({...d,ont_dt:v})} /></F></>}
            <F label="UR Type"><Sel value={d.typ} onChange={v=>setD({...d,typ:v as N['typ']})} options={[{value:'B2CL',label:'B2CL'},{value:'EXPWP',label:'EXPWP'},{value:'EXPWOP',label:'EXPWOP'}]} /></F>
            <F label="Note Supply Type"><Sel value={d.inv_typ||'R'} onChange={v=>setD({...d,inv_typ:v as 'R'|'DE'|'SEWP'|'SEWOP'|'CBW'})} options={[{value:'R',label:'R'},{value:'DE',label:'DE'},{value:'SEWP',label:'SEWP'},{value:'SEWOP',label:'SEWOP'},{value:'CBW',label:'CBW'}]} /></F>
            <F label="Pre-GST note?"><Sel value={d.p_gst||'N'} onChange={v=>setD({...d,p_gst:v as 'Y'|'N'})} options={[{value:'N',label:'No'},{value:'Y',label:'Yes'}]} /></F>
            <F label="Note Type"><Sel value={d.ntty} onChange={v=>setD({...d,ntty:v as 'C'|'D'})} options={[{value:'C',label:'C – Credit'},{value:'D',label:'D – Debit'}]} /></F>
            <F label="Note No."><Inp value={d.ntnum} onChange={v=>setD({...d,ntnum:v})} placeholder="CN-001" /></F>
            <F label="Note Date"><DatePicker value={d.ntdt} onChange={v=>setD({...d,ntdt:v})} /></F>
            {posShown && <F label="Place of Supply"><Sel value={d.pos} onChange={v=>setD({...d,pos:v})} options={STATE_OPTS} /></F>}
            <F label="Note Value (₹)"><Inp value={d.val||''} onChange={v=>setD({...d,val:parseFloat(v)||0})} className="text-right" /></F>
            <F label="Rate (%)"><Sel value={String(d.itms[0]?.itm_det.rt??18)} onChange={v=>setD({...d,itms:[{num:1,itm_det:{...d.itms[0].itm_det,rt:parseFloat(v)}}]})} options={RATE_OPTS} /></F>
            <F label="Taxable Value (₹)"><Inp value={d.itms[0]?.itm_det.txval||''} onChange={v=>setD({...d,itms:[{num:1,itm_det:{...d.itms[0].itm_det,txval:parseFloat(v)||0}}]})} className="text-right" /></F>
            <F label="IGST (₹)"><Inp value={d.itms[0]?.itm_det.iamt||''} onChange={v=>setD({...d,itms:[{num:1,itm_det:{...d.itms[0].itm_det,iamt:parseFloat(v)||undefined}}]})} className="text-right" /></F>
          </div>
          <AddBtns onSave={add} onClear={()=>setD(blk())} />
        </AddPanel>
      )}
    </div>
  );
}
