/* TDS / TCS — FOR REFERENCE ONLY.
   Local component state: never saved, never posted, never added to the bill.
   Purchase side: TDS payable (we deduct from the vendor) | TCS receivable
   (the vendor collects from us). Sales side: TDS receivable (the customer
   deducts from us) | TCS payable (we collect from the customer). */
import { useState } from 'react';
import { Landmark, ReceiptIndianRupee, Info, RotateCcw } from 'lucide-react';
import { TDS_SECTIONS, TCS_SECTIONS, panFromGstin, type WithholdingSection } from './tdsTcs';
import { Field, Switch, inr } from './ui';
import { panProblem } from '@/lib/pan';

type Side = 'purchase' | 'sales';

interface Half {
  on: boolean;
  pan: string | null;   // null = use the derived default
  tan: string | null;
  code: string;
  rate: string | null;
  base: string | null;
}

const blank = (code: string): Half => ({ on: false, pan: null, tan: null, code, rate: null, base: null });

interface Props {
  side: Side;
  /** Taxable value of the bill (excluding GST) — default TDS base. */
  taxable: number;
  /** Invoice value (taxable + GST) — default TCS base. */
  invoiceValue: number;
  /** The other party's GSTIN, used to suggest their PAN. */
  partyGstin?: string;
  companyPan?: string;
  companyTan?: string;
}

export function TdsTcsPanel({ side, taxable, invoiceValue, partyGstin, companyPan, companyTan }: Props) {
  const [tds, setTds] = useState<Half>(() => blank(side === 'purchase' ? '194C-O' : '194J-B'));
  const [tcs, setTcs] = useState<Half>(() => blank('206C1-SCR'));
  const partyPan = panFromGstin(partyGstin);

  const isPurchase = side === 'purchase';
  return (
    <div className="yk-wh" data-testid="tds-tcs-panel">
      <p className="yk-wh-note"><Info className="h-3.5 w-3.5 shrink-0" aria-hidden /> For reference only — not saved and doesn&rsquo;t change the bill.</p>
      <div className="yk-wh-grid">
        <HalfCard
          kind="TDS"
          title={isPurchase ? 'TDS payable' : 'TDS receivable'}
          sub={isPurchase ? 'We deduct TDS from the vendor' : 'The customer deducts TDS from us'}
          icon={Landmark}
          state={tds}
          set={setTds}
          sections={TDS_SECTIONS}
          defaultBase={taxable}
          baseHint="Taxable value, excluding GST"
          panLabel={isPurchase ? 'Vendor PAN' : 'Our PAN'}
          panDefault={isPurchase ? partyPan : (companyPan || '')}
          tanLabel={isPurchase ? 'Our TAN' : "Customer's TAN"}
          tanDefault={isPurchase ? (companyTan || '') : ''}
          tanOptional={isPurchase}
          noPanHint="No PAN: s. 206AA — higher of 20% or twice the rate"
        />
        <HalfCard
          kind="TCS"
          title={isPurchase ? 'TCS receivable' : 'TCS payable'}
          sub={isPurchase ? 'The vendor collects TCS from us' : 'We collect TCS from the customer'}
          icon={ReceiptIndianRupee}
          state={tcs}
          set={setTcs}
          sections={TCS_SECTIONS}
          defaultBase={invoiceValue}
          baseHint="Invoice value, including GST"
          panLabel={isPurchase ? 'Our PAN' : 'Customer PAN'}
          panDefault={isPurchase ? (companyPan || '') : partyPan}
          tanLabel={isPurchase ? "Vendor's TAN" : 'Our TAN'}
          tanDefault={isPurchase ? '' : (companyTan || '')}
          tanOptional={false}
          noPanHint="No PAN: s. 206CC — higher of 5% or twice the rate"
        />
      </div>
    </div>
  );
}

function HalfCard({
  kind, title, sub, icon: Icon, state, set, sections, defaultBase, baseHint,
  panLabel, panDefault, tanLabel, tanDefault, tanOptional, noPanHint,
}: {
  kind: 'TDS' | 'TCS';
  title: string;
  sub: string;
  icon: typeof Landmark;
  state: Half;
  set: (fn: (h: Half) => Half) => void;
  sections: WithholdingSection[];
  defaultBase: number;
  baseHint: string;
  panLabel: string;
  panDefault: string;
  tanLabel: string;
  tanDefault: string;
  tanOptional: boolean;
  noPanHint: string;
}) {
  const sec = sections.find((s) => s.code === state.code) ?? sections[0];
  const pan = state.pan ?? panDefault;
  const tan = state.tan ?? tanDefault;
  const rate = state.rate ?? String(sec.rate);
  const base = state.base ?? (defaultBase ? String(Math.round(defaultBase * 100) / 100) : '');
  const amount = Math.round((Number(base) || 0) * (Number(rate) || 0) / 100);
  const id = `wh-${kind.toLowerCase()}`;

  return (
    <div className={`yk-wh-half ${state.on ? 'on' : ''}`} data-testid={`${id}-half`}>
      <div className="yk-wh-head">
        <span className="yk-tile sm"><Icon className="h-3.5 w-3.5" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="yk-wh-title">{title}</p>
          <p className="yk-wh-sub">{sub}</p>
        </div>
        <Switch checked={state.on} onChange={(v) => set((h) => ({ ...h, on: v }))} label={`${title} — show`} testId={`${id}-toggle`} />
      </div>

      {state.on && (
        <div className="yk-wh-body">
          <div className="grid grid-cols-2 gap-3">
            <Field label={panLabel} htmlFor={`${id}-pan`} hint={!pan ? noPanHint : undefined} error={pan.length === 10 ? panProblem(pan) : null}>
              <input
                id={`${id}-pan`}
                className={`yk-in mono uppercase ${pan.length === 10 && panProblem(pan) ? 'bad' : ''}`}
                aria-invalid={(pan.length === 10 && !!panProblem(pan)) || undefined}
                value={pan}
                maxLength={10}
                onChange={(e) => { const v = e.target.value.toUpperCase(); set((h) => ({ ...h, pan: v })); }}
              />
            </Field>
            <Field label={`${tanLabel}${tanOptional ? ' (optional)' : ''}`} htmlFor={`${id}-tan`}>
              <input
                id={`${id}-tan`}
                className="yk-in mono uppercase"
                value={tan}
                maxLength={10}
                onChange={(e) => { const v = e.target.value.toUpperCase(); set((h) => ({ ...h, tan: v })); }}
              />
            </Field>
          </div>

          <Field label="Section" htmlFor={`${id}-sec`}>
            <select
              id={`${id}-sec`}
              className="yk-in"
              value={sec.code}
              onChange={(e) => set((h) => ({ ...h, code: e.target.value, rate: null }))}
            >
              {sections.map((s) => (
                <option key={s.code} value={s.code} disabled={s.omitted}>
                  {s.section} — {s.label}{s.omitted ? '' : ` (${s.rate}%)`}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
            <Field label="Rate %" htmlFor={`${id}-rate`}>
              <input
                id={`${id}-rate`}
                type="number"
                inputMode="decimal"
                className="yk-in num"
                value={rate}
                min={0}
                step="0.01"
                onChange={(e) => { const v = e.target.value; set((h) => ({ ...h, rate: v })); }}
              />
            </Field>
            <Field
              label="Base amount"
              htmlFor={`${id}-base`}
              hint={state.base === null ? baseHint : (
                <button type="button" className="yk-link" onClick={() => set((h) => ({ ...h, base: null }))}>
                  <RotateCcw className="h-3 w-3" aria-hidden /> Use {baseHint.toLowerCase()}
                </button>
              )}
            >
              <input
                id={`${id}-base`}
                type="number"
                inputMode="decimal"
                className="yk-in num"
                value={base}
                min={0}
                onChange={(e) => { const v = e.target.value; set((h) => ({ ...h, base: v })); }}
              />
            </Field>
          </div>

          <div className="yk-wh-amt" data-testid={`${id}-amount`}>
            <span>{kind} at {Number(rate) || 0}%</span>
            <strong className="num">₹ {inr(amount)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
