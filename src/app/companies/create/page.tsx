/* ─────────────────────────────────────────────────────────────────────────────
   Create company — an ordered, entity-aware flow.

   Every legal form walks its own short path, and a question only appears when
   it applies: an Individual is asked what an ITR needs (never CIN, TAN, GST or
   inventory); GST details open only after "GST applicable? → Yes"; entering a
   TAN is what switches TDS on. The data saved is the same Company shape as
   before — createCompany → createInitialBookPeriod → initEntityData — so every
   module downstream reads it unchanged. Presentational pieces live in ./ui.
   ──────────────────────────────────────────────────────────────────────────── */
import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { createCompany as createCompanyLocal, createInitialBookPeriod } from '@/lib/offlineDb';
import { isGstin } from '@/lib/schemas/india';
import { isSandboxTestGstin, SANDBOX_TEST_GSTIN } from '@/lib/gst/sandbox/testGstins';
import { initEntityData } from '@/entities/initEntity';
import { ENTITY_TYPES, type EntityType } from '@/lib/constants/entityTypes';
import { INDIAN_STATES } from '@/lib/constants/indianStates';
import { lookupCompanyByCIN } from '@/lib/mca';
import { fetchPanRegistry, fetchGstinsByPan, pickBestGstin, gstStateCodeFromName } from '@/lib/company360';
import { sandboxClient } from '@/lib/gst/sandbox/client';
import { checkMcaQuota, recordMcaFetch, type QuotaCheck } from '@/lib/mcaQuota';
import { getIcon } from '@/lib/constants/entityIcons';
import { formsForEntity, ITR_META, type ItrKey } from '@/app/company/[id]/income-tax/lib/itrForms';
import {
  ArrowLeft, ArrowRight, Check, Plus, Trash2, Building2, Search, Loader2, Clock, Sparkles,
  CheckCircle2, UserRound, CalendarDays, Fingerprint, Phone, Mail, MapPin, Landmark, Percent,
  Receipt, Store, Users, ClipboardCheck, Wallet, TrendingUp, BookOpen, HeartHandshake,
  ShoppingBag, Factory, Wrench, Briefcase, Shapes, Layers, KeyRound, Hash, ScrollText,
  Pencil, Unlock, Scale, CreditCard, type LucideIcon,
} from 'lucide-react';
import {
  Field, TextInput, inp, inpErr, mono, toUpper, digitsOnly, QuestionRow, YesNo, Segmented,
  SwitchRow, ChoiceCard, Chip, Group,
} from './ui';

// Entity types temporarily DEACTIVATED in the picker. They are NOT deleted — their
// definitions & configs stay in the backend (ENTITY_TYPES / entityConfig), so they can
// be re-activated at any time by simply removing the key from this set.
const HIDDEN_ENTITY_TYPES = new Set<string>();
// Every entity type still shown in the picker is selectable (nothing is locked).
const LOCKED_ENTITY_TYPES = new Set<string>();

/* ── Entity kinds: which path through the questions a legal form takes ── */
type Kind = 'individual' | 'proprietor' | 'firm' | 'company' | 'huf' | 'trust' | 'other';
const COMPANY_TYPES = ['opc', 'pvt_ltd', 'public_ltd', 'section8'];
function kindOf(t: string): Kind {
  if (t === 'individual') return 'individual';
  if (t === 'sole_proprietorship') return 'proprietor';
  if (t === 'partnership' || t === 'llp') return 'firm';
  if (COMPANY_TYPES.includes(t)) return 'company';
  if (t === 'huf') return 'huf';
  if (t === 'trust' || t === 'society') return 'trust';
  return 'other';
}

const ENTITY_GROUPS: { title: string; keys: string[] }[] = [
  { title: 'People', keys: ['individual', 'sole_proprietorship', 'huf'] },
  { title: 'Firms', keys: ['partnership', 'llp', 'aop_boi'] },
  { title: 'Companies', keys: ['pvt_ltd', 'opc', 'public_ltd', 'section8'] },
  { title: 'Trusts & societies', keys: ['trust', 'society', 'cooperative'] },
];

type StepKey = 'entity' | 'identity' | 'business' | 'partners' | 'contact' | 'tax' | 'review';
function stepsFor(kind: Kind | null): StepKey[] {
  if (kind === 'proprietor') return ['entity', 'identity', 'business', 'contact', 'tax', 'review'];
  if (kind === 'firm') return ['entity', 'identity', 'partners', 'contact', 'tax', 'review'];
  return ['entity', 'identity', 'contact', 'tax', 'review'];
}
const STEP_LABEL: Record<StepKey, string> = {
  entity: 'Type', identity: 'Identity', business: 'Business', partners: 'Partners',
  contact: 'Contact', tax: 'Tax', review: 'Review',
};

/* PAN 4th letter by holder status. */
const PAN_4TH: Partial<Record<Kind, [string, string]>> = {
  individual: ['P', 'A personal'], proprietor: ['P', "The proprietor's"], company: ['C', 'A company'],
  firm: ['F', 'A firm / LLP'], trust: ['T', 'A trust'], huf: ['H', 'An HUF'],
};

/* ITR choice cards — one short line each, tuned to who is choosing. */
const ITR_ICON: Record<ItrKey, LucideIcon> = {
  itr1: Wallet, itr2: TrendingUp, itr3: BookOpen, itr4: Percent, itr5: Users, itr6: Building2, itr7: HeartHandshake,
};
function itrCaption(key: ItrKey, kind: Kind): string {
  if (kind === 'company') return key === 'itr7' ? 'Registered u/s 12A / 12AB' : 'Not registered u/s 12A / 12AB';
  if (kind === 'huf') return ({ itr2: 'No business or profession income', itr3: 'Business with regular books', itr4: 'Presumptive — 44AD / 44ADA' } as Record<string, string>)[key] ?? ITR_META[key].note;
  if (kind === 'proprietor') return key === 'itr3' ? 'Regular books — profit from the P&L' : 'Presumptive income — 44AD / 44ADA / 44AE';
  if (key === 'itr1') return 'Salary, one house, other sources · income up to ₹50 lakh';
  if (key === 'itr2') return 'Capital gains, more than one house or foreign assets · no business';
  return ITR_META[key].note;
}
const ITR_TAG: Partial<Record<ItrKey, string>> = { itr1: 'Sahaj', itr4: 'Sugam' };

const BUSINESS_NATURE: { value: string; icon: LucideIcon }[] = [
  { value: 'Trading', icon: ShoppingBag },
  { value: 'Manufacturing', icon: Factory },
  { value: 'Services', icon: Wrench },
  { value: 'Professional', icon: Briefcase },
  { value: 'Other', icon: Shapes },
];

type WizardData = {
  entity_type: string;
  name: string; pan: string;
  address: string; address2: string; city: string; state: string; pincode: string;
  phone: string; email: string;
  partners: { name: string; capitalAmount: number; profitSharingRatio: number; salary: number }[];
  capitalMethod: 'fixed' | 'fluctuating';
  cin: string; authorizedCapital: number; paidUpCapital: number; faceValuePerShare: number;
  kartaName: string; registrationNumber: string;
  tan: string; aadhaar: string; dob: string; tradeName: string; llpin: string; dateOfIncorporation: string;
  businessNature: string[];
  itrForm: ItrKey | '';
  /** "Is GST applicable?" — null until answered. */
  gstChoice: boolean | null;
  gstScheme: 'regular' | 'composition';
  gstin: string; portalUsername: string;
  /** "Do you deduct TDS?" — a TAN means yes. null until answered. */
  hasTan: boolean | null;
  tds_applicable: boolean; tcs_applicable: boolean;
};

const defaultData: WizardData = {
  entity_type: '', name: '', pan: '',
  address: '', address2: '', city: '', state: '', pincode: '', phone: '', email: '',
  partners: [{ name: '', capitalAmount: 0, profitSharingRatio: 50, salary: 0 }, { name: '', capitalAmount: 0, profitSharingRatio: 50, salary: 0 }],
  capitalMethod: 'fluctuating', cin: '', authorizedCapital: 0, paidUpCapital: 0, faceValuePerShare: 10,
  kartaName: '', registrationNumber: '',
  tan: '', aadhaar: '', dob: '', tradeName: '', llpin: '', dateOfIncorporation: '',
  businessNature: [], itrForm: '',
  gstChoice: null, gstScheme: 'regular', gstin: '', portalUsername: '',
  hasTan: null, tds_applicable: false, tcs_applicable: false,
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const toDateStr = (dt: Date) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
const fmtDate = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split('-').reverse().join('-') : iso || '—');
const inr = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function CreateCompanyPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<WizardData>(defaultData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [lockedClicked, setLockedClicked] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [mcaFetching, setMcaFetching] = useState(false);
  const [mcaFilled, setMcaFilled] = useState(false);
  const [panFetching, setPanFetching] = useState(false);
  const lastCin = useRef('');
  const lastPan = useRef('');

  // ─── MCA data-import: CIN / name search mode + usage guard ──────────────────
  const [mcaMode, setMcaMode] = useState<'cin' | 'name'>('cin');
  const [nameQuery, setNameQuery] = useState('');
  const [nameSearching, setNameSearching] = useState(false);
  const [nameResults, setNameResults] = useState<{ cin: string; company_name: string }[] | null>(null);
  const [quotaBlock, setQuotaBlock] = useState<Exclude<QuotaCheck, { ok: true }> | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  // Tick the cooldown countdown; clear the block when it reaches zero.
  useEffect(() => {
    if (!quotaBlock || quotaBlock.reason !== 'cooldown') return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((quotaBlock.retryAt - Date.now()) / 1000));
      setCooldownLeft(left);
      if (left <= 0) setQuotaBlock(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [quotaBlock]);

  /** Gate + meter one MCA fetch (CIN and name searches share the same allowance). */
  const tryConsumeQuota = (): boolean => {
    const q = checkMcaQuota();
    if (!q.ok) { setQuotaBlock(q); return false; }
    recordMcaFetch();
    setQuotaBlock(null);
    return true;
  };

  const upd = (f: Partial<WizardData>) => {
    setData((p) => ({ ...p, ...f }));
    const keys = Object.keys(f);
    if (keys.length > 0) {
      setErrors((p) => {
        const copy = { ...p };
        keys.forEach((k) => delete copy[k]);
        return copy;
      });
    }
  };

  const kind: Kind | null = data.entity_type ? kindOf(data.entity_type) : null;
  const steps = useMemo(() => stepsFor(kind), [kind]);
  const currentKey = steps[stepIdx] ?? 'entity';
  const itrForms = useMemo(() => formsForEntity(data.entity_type as EntityType), [data.entity_type]);
  const personal = kind === 'individual' || kind === 'proprietor';

  // Dates must be strictly in the PAST (never today, never future). `maxPastDate`
  // (= yesterday) is the date input's max so today/future can't be picked.
  const todayStr = toDateStr(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const maxPastDate = toDateStr(yesterday);

  const formedLabel =
    data.entity_type === 'partnership' ? 'Deed date'
    : kind === 'proprietor' ? 'Business started on'
    : kind === 'company' || data.entity_type === 'llp' ? 'Incorporated on'
    : kind === 'trust' ? 'Registered on'
    : 'Formed on';

  const focusFirstError = (errs: Record<string, string>) => {
    setTimeout(() => {
      const firstErrorKey = Object.keys(errs)[0];
      const element = document.getElementsByName(firstErrorKey)[0] || document.getElementById(firstErrorKey);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (element as HTMLElement).focus();
      }
    }, 100);
  };

  // ─── Per-step validation ────────────────────────────────────────────────────
  const collectErrors = (key: StepKey, d: WizardData): Record<string, string> => {
    const e: Record<string, string> = {};
    const k = d.entity_type ? kindOf(d.entity_type) : null;
    const isPersonal = k === 'individual' || k === 'proprietor';

    if (key === 'entity' && !d.entity_type) e.entity_type = 'Pick one to continue';

    if (key === 'identity') {
      if (!d.name.trim()) e.name = 'Required';
      if (!d.pan) e.pan = 'PAN is required';
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(d.pan)) e.pan = 'Format is ABCDE1234F';
      else if (k && PAN_4TH[k] && d.pan[3] !== PAN_4TH[k]![0]) e.pan = `${PAN_4TH[k]![1]} PAN has '${PAN_4TH[k]![0]}' as its 4th letter`;
      if (isPersonal) {
        if (!d.dob) e.dob = 'Required';
        else if (d.dob >= todayStr) e.dob = 'Must be in the past';
        if (d.aadhaar && !/^\d{12}$/.test(d.aadhaar)) e.aadhaar = '12 digits';
      } else if (!d.dateOfIncorporation) e.dateOfIncorporation = 'Required';
      else if (d.dateOfIncorporation >= todayStr) e.dateOfIncorporation = 'Must be in the past';
      if (k === 'company' && d.cin && d.cin.length !== 21) e.cin = 'A CIN is 21 characters';
    }

    if (key === 'business') {
      if (!d.tradeName.trim()) e.tradeName = 'Required';
      if (!d.dateOfIncorporation) e.dateOfIncorporation = 'Required';
      else if (d.dateOfIncorporation >= todayStr) e.dateOfIncorporation = 'Must be in the past';
    }

    if (key === 'contact') {
      if (isPersonal && !d.phone) e.phone = 'Required for the return';
      else if (d.phone && !/^[6-9]\d{9}$/.test(d.phone)) e.phone = '10-digit mobile number';
      if (isPersonal && !d.email) e.email = 'Required for the return';
      else if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) e.email = 'Check the email address';
      if (isPersonal) {
        if (!d.address.trim()) e.address = 'Required';
        if (!d.city.trim()) e.city = 'Required';
        if (!d.state) e.state = 'Required';
        if (!d.pincode) e.pincode = 'Required';
      }
      if (d.pincode && !/^[1-9]\d{5}$/.test(d.pincode)) e.pincode = '6-digit PIN';
    }

    if (key === 'tax') {
      const forms = formsForEntity(d.entity_type as EntityType);
      if (forms.length > 1 && !d.itrForm) e.itrForm = 'Choose the return';
      if (k !== 'individual') {
        if (d.gstChoice === null) e.gstChoice = 'Answer Yes or No';
        else if (d.gstChoice) {
          // Known Sandbox mock GSTINs (test-first setup) skip real format/checksum +
          // PAN-match; every real GSTIN still gets the full validation.
          const isTest = isSandboxTestGstin(d.gstin);
          if (!d.gstin) e.gstin = 'GSTIN required';
          else if (!isTest && !isGstin(d.gstin)) e.gstin = 'Invalid GSTIN (format or checksum)';
          else if (!isTest && d.pan && d.gstin.substring(2, 12) !== d.pan) e.gstin = 'GSTIN does not match the PAN';
        }
        if (d.hasTan === null) e.hasTan = 'Answer Yes or No';
        else if (d.hasTan) {
          if (!d.tan) e.tan = 'TAN required';
          else if (!/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(d.tan)) e.tan = 'Format is ABCD12345E';
        }
      }
    }
    return e;
  };

  const validateStep = (key: StepKey, d: WizardData = data): boolean => {
    const errs = collectErrors(key, d);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      focusFirstError(errs);
      return false;
    }
    return true;
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const goNext = () => {
    if (!validateStep(currentKey)) return;
    setStepIdx((s) => Math.min(s + 1, steps.length - 1));
    scrollTop();
  };
  const goBack = () => { setErrors({}); setStepIdx((s) => Math.max(s - 1, 0)); scrollTop(); };
  const goToStep = (i: number) => { if (i < stepIdx) { setErrors({}); setStepIdx(i); scrollTop(); } };

  // Picking the entity is a single choice, so it advances by itself.
  const pickEntity = (key: string) => {
    if (LOCKED_ENTITY_TYPES.has(key)) { setLockedClicked(lockedClicked === key ? null : key); return; }
    setLockedClicked(null);
    const forms = formsForEntity(key as EntityType);
    upd({
      entity_type: key,
      // single-form entities never need a choice; a multi-form choice survives re-picking the same type
      itrForm: forms.length > 1 && data.entity_type === key ? data.itrForm : '',
    });
    setErrors({});
    setStepIdx(1);
    scrollTop();
  };

  // ─── Silent MCA auto-fill from CIN (no button / no result card) ─────────────
  const autoFillFromCIN = async (cinRaw: string) => {
    const cin = cinRaw.trim().toUpperCase();
    if (cin.length !== 21 || cin === lastCin.current) return;
    // Metered import — if blocked, leave lastCin empty so the same CIN can retry later.
    if (!tryConsumeQuota()) return;
    lastCin.current = cin;
    setMcaFetching(true);
    try {
      const info = await lookupCompanyByCIN(cin);
      if (!info) return;
      const patch: Partial<WizardData> = {};
      if (info.name) patch.name = info.name;
      if (info.email) patch.email = info.email;
      if (info.dateOfIncorporation) patch.dateOfIncorporation = info.dateOfIncorporation;
      if (info.address) { patch.address = info.address; patch.address2 = ''; }
      if (info.city) patch.city = info.city;
      if (info.pincode) patch.pincode = info.pincode;
      if (info.state) {
        const matched = INDIAN_STATES.find((s) => s.name.toLowerCase() === info.state!.toLowerCase());
        if (matched) patch.state = matched.name;
      }
      // Live MCA master data also issues the share-capital figures — take them.
      if (typeof info.authorizedCapital === 'number' && info.authorizedCapital > 0) patch.authorizedCapital = info.authorizedCapital;
      if (typeof info.paidUpCapital === 'number' && info.paidUpCapital > 0) patch.paidUpCapital = info.paidUpCapital;
      if (Object.keys(patch).length) { upd(patch); setMcaFilled(true); }
    } catch {
      /* silent — the user can still type details manually */
    } finally {
      setMcaFetching(false);
    }
  };

  // ─── MCA search by company name → pick a result → same CIN auto-fill ────────
  const searchMcaByName = async () => {
    const q = nameQuery.trim();
    if (q.length < 3) { toast.error('Type at least 3 characters of the company name.'); return; }
    if (!tryConsumeQuota()) return;
    setNameSearching(true);
    setNameResults(null);
    try {
      const r = await sandboxClient.mcaSearch({ companyName: q, env: 'live' });
      const d: any = r.data;
      const recs = d?.data?.records ?? (Array.isArray(d?.data) ? d.data : null);
      if (r.ok && Array.isArray(recs)) {
        // Companies only (21-char CINs) — LLPIN results don't fit this wizard step.
        setNameResults(recs.filter((x: any) => typeof x?.cin === 'string' && x.cin.length === 21));
      } else {
        toast.error(d?.message || d?.error || r.error || 'Search failed — try again.');
      }
    } catch {
      toast.error('Search failed — try again.');
    } finally {
      setNameSearching(false);
    }
  };

  const pickNameResult = (rec: { cin: string; company_name: string }) => {
    setNameResults(null);
    setMcaMode('cin');
    upd({ cin: rec.cin, name: rec.company_name });
    autoFillFromCIN(rec.cin);
  };

  // ─── Silent PAN cascade: ITD registry (email/phone/address) + GST by PAN ────
  const autoFillFromPAN = async (panRaw: string) => {
    const p = panRaw.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(p) || p === lastPan.current) return;
    lastPan.current = p;
    setPanFetching(true);
    try {
      const stateCode = gstStateCodeFromName(data.state);
      const [reg, gstins] = await Promise.all([
        fetchPanRegistry(p).catch(() => null),
        stateCode && kind !== 'individual' ? fetchGstinsByPan(p, stateCode).catch(() => []) : Promise.resolve([]),
      ]);
      const patch: Partial<WizardData> = {};
      if (reg?.email) patch.email = reg.email;
      if (reg?.mobile && /\d{6,}/.test(reg.mobile)) patch.phone = reg.mobile;
      if (reg?.address && !data.address) patch.address = reg.address;
      if (reg?.city && !data.city) patch.city = reg.city;
      if (reg?.pincode && !data.pincode) patch.pincode = reg.pincode;
      const best = pickBestGstin(gstins);
      if (kind !== 'individual' && best?.status === 'Active' && !data.gstin) {
        patch.gstin = best.gstin;
        patch.gstChoice = true;
        patch.gstScheme = /composition/i.test(best.type || '') ? 'composition' : 'regular';
      }
      if (Object.keys(patch).length) {
        upd(patch);
        toast.success('Filled from the PAN registry & GST records.');
      }
    } catch {
      /* silent — manual entry still works */
    } finally {
      setPanFetching(false);
    }
  };

  const handleSave = async () => {
    // Validate every step before creating; land on the first that needs attention.
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(steps[i])) { setStepIdx(i); return; }
    }
    setSaving(true);
    try {
      const k = kindOf(data.entity_type);
      const isFirm = k === 'firm';
      const fullAddress = [data.address.trim(), data.address2.trim()].filter(Boolean).join(', ');
      const gstOn = k !== 'individual' && data.gstChoice === true;
      const tanOn = k !== 'individual' && data.hasTan === true;

      const entityDetails: Record<string, unknown> = {
        pan: data.pan, address: fullAddress, city: data.city,
        state: data.state, pincode: data.pincode, phone: data.phone, email: data.email,
        tan: tanOn ? data.tan : undefined,
        tradeName: k === 'proprietor' ? data.tradeName || undefined : undefined,
        dateOfIncorporation: k === 'individual' ? undefined : data.dateOfIncorporation || undefined,
      };
      if (k === 'individual' || k === 'proprietor') {
        entityDetails.aadhaar = data.aadhaar;
        entityDetails.dob = data.dob;
      }
      // The chosen return — only when there was a real choice (single-form entities stay unset).
      if (itrForms.length > 1 && data.itrForm) entityDetails.itrForm = data.itrForm;
      if (isFirm) { entityDetails.partners = data.partners.filter((p) => p.name); entityDetails.capitalMethod = data.capitalMethod; entityDetails.llpin = data.llpin; }
      if (k === 'company') { entityDetails.cin = data.cin; entityDetails.shareCapital = { authorizedCapital: data.authorizedCapital, paidUpCapital: data.paidUpCapital, faceValuePerShare: data.faceValuePerShare, totalShares: data.paidUpCapital / (data.faceValuePerShare || 10), issuedCapital: data.paidUpCapital, subscribedCapital: data.paidUpCapital }; }
      if (k === 'huf') entityDetails.kartaName = data.kartaName;
      if (k === 'trust') entityDetails.registrationNumber = data.registrationNumber;

      const gstDetails: Record<string, unknown> = {};
      if (gstOn) {
        gstDetails.gstin = data.gstin;
        gstDetails.gstScheme = data.gstScheme;
        // The GST module reads the portal login from here (Settings → GST & e-Way Bill).
        if (data.portalUsername.trim()) gstDetails.portalUsername = data.portalUsername.trim();
      }

      const company = createCompanyLocal({
        name: data.name.trim(), entity_type: data.entity_type as EntityType,
        entity_details: entityDetails as any,
        business_nature: k === 'proprietor' ? data.businessNature : [],
        // Inventory is no longer asked at creation — it can be switched on later.
        inventory_enabled: false,
        inventory_config: { valuationMethod: 'weighted_average', pettyCashThreshold: 5000 },
        gst_status: gstOn ? data.gstScheme : 'unregistered', gst_details: gstDetails as any,
        // A TAN means the entity deducts TDS; individuals answer directly.
        tds_applicable: k === 'individual' ? data.tds_applicable : tanOn,
        tcs_applicable: data.tcs_applicable,
        accounting_method: k === 'individual' ? 'cash' : 'mercantile',
        financial_year_start: 'april',
      });
      createInitialBookPeriod(company.id);
      initEntityData(company);
      toast.success(`${company.name} is ready.`);
      navigate(`/company/${company.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create company');
      setSaving(false);
    }
  };

  /* ─────────────────────────────── render ─────────────────────────────── */
  const err = (k: string) => (errors[k] ? inpErr : '');
  const nameLabel =
    kind === 'individual' ? 'Full name (as on PAN)'
    : kind === 'proprietor' ? "Proprietor's full name"
    : kind === 'firm' ? (data.entity_type === 'llp' ? 'LLP name' : 'Firm name')
    : kind === 'company' ? 'Company name'
    : kind === 'huf' ? 'HUF name'
    : 'Name';

  const head: Record<StepKey, { icon: LucideIcon; title: string; sub: string }> = {
    entity: { icon: Layers, title: 'Who is this for?', sub: 'Pick the legal form — every question after this adapts to it.' },
    identity: kind === 'company'
      ? { icon: Building2, title: 'The company', sub: 'Enter the CIN and the rest fills in from MCA.' }
      : kind === 'proprietor'
        ? { icon: UserRound, title: 'The proprietor', sub: 'The return is filed in the owner’s name.' }
        : kind === 'individual'
          ? { icon: UserRound, title: 'About you', sub: 'Exactly as on the PAN card.' }
          : { icon: ScrollText, title: 'Registration', sub: 'Name, PAN and when it was formed.' },
    business: { icon: Store, title: 'The business', sub: 'What it does and when it started.' },
    partners: { icon: Users, title: 'Partners', sub: 'Capital and profit share of each partner.' },
    contact: { icon: MapPin, title: personal ? 'Contact & address' : kind === 'company' ? 'Registered office' : 'Contact & address', sub: personal ? 'Where the department reaches you — used on the return.' : 'Office address and a point of contact.' },
    tax: { icon: Landmark, title: 'Tax', sub: kind === 'individual' ? 'Your return, and whether TDS or TCS applies.' : 'Income tax, GST and withholding — only what applies.' },
    review: { icon: ClipboardCheck, title: 'Review', sub: 'One look before it’s created.' },
  };
  const H = head[currentKey];

  const partnerPsr = data.partners.reduce((s, p) => s + (Number(p.profitSharingRatio) || 0), 0);

  return (
    <div className="min-h-screen app-surface">
      <main className="mx-auto w-full max-w-[780px] px-5 pb-20 pt-6 sm:pt-8">

        {/* ── The one navigation control, plus where you are ── */}
        <div className="mb-4 flex items-center justify-between gap-3">
          {stepIdx === 0 ? (
            <Link to="/companies" className="inline-flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-[var(--sand)] bg-white/80 pl-3 pr-4 font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-2)] transition-colors duration-[160ms] hover:border-[var(--sand-2)] hover:text-[var(--navy)]">
              <ArrowLeft className="h-3.5 w-3.5" /> Companies
            </Link>
          ) : (
            <button type="button" onClick={goBack} className="inline-flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-[var(--sand)] bg-white/80 pl-3 pr-4 font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-2)] transition-colors duration-[160ms] hover:border-[var(--sand-2)] hover:text-[var(--navy)]">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          )}
          <span className="font-mono text-[11.5px] text-[var(--ink-3)]">{stepIdx + 1} / {steps.length}</span>
        </div>

        {/* ── Progress ── */}
        <ol className="mb-4 flex items-center" aria-label="Progress">
          {steps.map((s, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <Fragment key={s}>
                <li>
                  <button type="button" onClick={() => goToStep(i)} disabled={!done}
                    className={`group flex items-center gap-2 ${done ? 'cursor-pointer' : 'cursor-default'}`}
                    aria-current={active ? 'step' : undefined}>
                    {/* Done fills solid navy; the current step is a navy ring with a
                        soft halo; steps ahead are open circles. */}
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full font-display text-[12px] font-semibold transition-[background-color,border-color,color,box-shadow] duration-[200ms] ${
                      done ? 'bg-[var(--navy)] text-white shadow-[var(--shadow-navy)] group-hover:bg-[var(--navy-2)]'
                      : active ? 'border-2 border-[var(--navy)] bg-white text-[var(--navy)] shadow-[0_0_0_4px_rgba(23,69,127,0.14)]'
                      : 'border-[1.5px] border-[var(--sand-2)] bg-white text-[var(--ink-3)]'
                    }`}>
                      {i + 1}
                    </span>
                    <span className={`hidden font-display text-[10.5px] font-semibold uppercase tracking-[0.14em] sm:inline ${
                      active ? 'text-[var(--ink)]' : done ? 'text-[var(--navy)]' : 'text-[var(--ink-3)]'
                    }`}>{STEP_LABEL[s]}</span>
                  </button>
                </li>
                {i < steps.length - 1 && (
                  <li aria-hidden className={`mx-2 h-[3px] min-w-[14px] flex-1 rounded-full transition-colors duration-[270ms] ${i < stepIdx ? 'bg-[var(--navy)]' : 'bg-[var(--sand-2)]'}`} />
                )}
              </Fragment>
            );
          })}
        </ol>

        {/* ── The step ── */}
        <form
          key={currentKey}
          noValidate
          onSubmit={(e) => { e.preventDefault(); if (currentKey === 'review') handleSave(); else goNext(); }}
          className="panel screen-enter"
        >
          <div className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6">
            <span className="icon-badge"><H.icon className="h-[18px] w-[18px]" /></span>
            <div className="min-w-0">
              <h1 className="!text-[18px] !tracking-[0.045em]">{H.title}</h1>
              <p className="mt-0.5 text-[12.5px] text-[var(--ink-3)]">{H.sub}</p>
            </div>
          </div>

          <div className="space-y-6 px-5 pb-6 sm:px-6">

            {/* ═════════ ENTITY ═════════ */}
            {currentKey === 'entity' && (
              <>
                {ENTITY_GROUPS.map((g) => {
                  const keys = g.keys.filter((k) => k in ENTITY_TYPES && !HIDDEN_ENTITY_TYPES.has(k));
                  if (keys.length === 0) return null;
                  return (
                    <Group key={g.title} title={g.title}>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {keys.map((key) => {
                          const config = ENTITY_TYPES[key as EntityType];
                          const Icon = getIcon(config.icon);
                          const active = data.entity_type === key;
                          return (
                            <button key={key} type="button" onClick={() => pickEntity(key)}
                              className={`group flex items-center gap-3 rounded-[12px] border p-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-[160ms] ${
                                active
                                  ? 'border-[var(--navy)] bg-[var(--navy-soft)]/60 shadow-[0_0_0_3px_rgba(23,69,127,0.10)]'
                                  : 'border-[var(--sand)] bg-white hover:-translate-y-px hover:border-[var(--sand-2)] hover:shadow-[var(--shadow-rest)]'
                              }`}>
                              <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-colors duration-[160ms] ${
                                active ? 'bg-[linear-gradient(158deg,var(--navy),var(--navy-2))] text-white' : 'bg-[var(--navy-soft)] text-[var(--navy)]'
                              }`}>
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[14px] font-bold text-[var(--ink)] leading-tight">{config.shortLabel}</span>
                                <span className="mt-0.5 block truncate text-[11.5px] text-[var(--ink-3)]">{config.label}</span>
                              </span>
                              <span className="code-pill !px-2 !py-0 !text-[10px]">{config.itrForm}</span>
                            </button>
                          );
                        })}
                      </div>
                    </Group>
                  );
                })}
                {lockedClicked && (
                  <div className="status-warn !normal-case !tracking-normal !text-[12px] !font-sans !py-2 !px-4">
                    <Unlock className="h-3.5 w-3.5" />
                    <strong>{ENTITY_TYPES[lockedClicked as EntityType]?.label}</strong> — will unlock with the trial version.
                  </div>
                )}
              </>
            )}

            {/* ═════════ IDENTITY ═════════ */}
            {currentKey === 'identity' && (
              <>
                {kind === 'company' && (
                  <Group title="Find on MCA">
                    <div className="rounded-[12px] border border-[var(--sand)] bg-[var(--cream-2)]/70 p-3.5">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <Segmented
                          label="Search by"
                          value={mcaMode}
                          onChange={(m) => setMcaMode(m)}
                          options={[{ value: 'cin', label: 'By CIN' }, { value: 'name', label: 'By name' }]}
                        />
                        {mcaFilled && !mcaFetching && (
                          <span className="status-ok"><CheckCircle2 className="h-3 w-3" /> Filled from MCA</span>
                        )}
                      </div>

                      {mcaMode === 'cin' ? (
                        <div className="relative">
                          <Hash className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-3)]" />
                          <TextInput
                            name="cin"
                            autoFocus
                            className={`${inp} ${mono} bg-white pl-8 pr-10 ${err('cin')}`}
                            value={data.cin}
                            onValueChange={(v) => { upd({ cin: v }); if (v.length === 21) autoFillFromCIN(v); else lastCin.current = ''; }}
                            transform={toUpper}
                            placeholder="U12345KA2024PTC123456"
                            maxLength={21}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2">
                            {mcaFetching
                              ? <Loader2 className="h-4 w-4 animate-spin text-[var(--navy)]" />
                              : data.cin.length === 21 && !errors.cin ? <CheckCircle2 className="h-4 w-4 text-[var(--ok)]" /> : null}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <input
                              className={`${inp} bg-white`}
                              value={nameQuery}
                              autoFocus
                              onChange={(e) => setNameQuery(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchMcaByName(); } }}
                              placeholder="Company name"
                            />
                            <button type="button" onClick={searchMcaByName} disabled={nameSearching} aria-label="Search MCA"
                              className="inline-flex h-10 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[var(--navy)] text-white transition-colors duration-[160ms] hover:bg-[var(--navy-2)] disabled:bg-[var(--sand)] disabled:text-[var(--ink-3)]">
                              {nameSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </button>
                          </div>
                          {nameResults && (
                            <div className="mt-2 max-h-64 divide-y divide-[var(--cream)] overflow-y-auto rounded-[10px] border border-[var(--sand)] bg-white">
                              {nameResults.length === 0 && <p className="px-3.5 py-3 text-[12px] text-[var(--ink-3)]">No matching companies found.</p>}
                              {nameResults.map((rec) => (
                                <button key={rec.cin} type="button" onClick={() => pickNameResult(rec)}
                                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors duration-[160ms] hover:bg-[var(--cream-2)]">
                                  <Building2 className="h-4 w-4 shrink-0 text-[var(--slate-blue)]" />
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[13.5px] font-bold text-[var(--ink)]">{rec.company_name}</span>
                                    <span className="block font-mono text-[11px] text-[var(--ink-3)]">{rec.cin}</span>
                                  </span>
                                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--sand-2)]" />
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {/* Usage guard feedback — countdown / next-day note only, no numbers */}
                      {quotaBlock?.reason === 'cooldown' && cooldownLeft > 0 ? (
                        <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[var(--warn)]">
                          <Clock className="h-3 w-3" /> Please wait {Math.floor(cooldownLeft / 60)}:{String(cooldownLeft % 60).padStart(2, '0')} before the next fetch.
                        </p>
                      ) : quotaBlock?.reason === 'daily' ? (
                        <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[var(--warn)]">
                          <Clock className="h-3 w-3" /> Today’s data-import allowance is used up — it refreshes at 12:00 AM.
                        </p>
                      ) : errors.cin ? (
                        <p className="mt-2 text-[11px] font-semibold text-[var(--bad)]">{errors.cin}</p>
                      ) : (
                        <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--ink-3)]">
                          <Sparkles className="h-3 w-3 text-[var(--slate-blue)]" /> Name, incorporation date, address and capital fill in by themselves.
                        </p>
                      )}
                    </div>
                  </Group>
                )}

                <Group title={kind === 'company' ? 'Company' : 'As on PAN'}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={nameLabel} error={errors.name} span2 icon={kind === 'company' || kind === 'firm' ? Building2 : UserRound}>
                      <input name="name" autoFocus={kind !== 'company'} className={`${inp} ${err('name')}`} value={data.name}
                        onChange={(e) => upd({ name: e.target.value })}
                        placeholder={kind === 'individual' || kind === 'proprietor' ? 'e.g. Priya Sharma' : kind === 'company' ? 'e.g. Sharma Industries Private Limited' : kind === 'firm' ? 'e.g. Sharma & Associates' : 'Name'} />
                    </Field>

                    <Field label="PAN" error={errors.pan} icon={CreditCard}>
                      <div className="relative">
                        <TextInput name="pan" className={`${inp} ${mono} pr-10 ${err('pan')}`} value={data.pan}
                          onValueChange={(v) => { upd({ pan: v }); if (v.length === 10) autoFillFromPAN(v); else lastPan.current = ''; }}
                          transform={toUpper} placeholder="ABCDE1234F" maxLength={10} />
                        {panFetching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--navy)]" />}
                      </div>
                    </Field>

                    {personal ? (
                      <Field label="Date of birth" error={errors.dob} icon={CalendarDays}>
                        <input name="dob" type="date" max={maxPastDate} className={`${inp} ${err('dob')}`}
                          value={data.dob} onChange={(e) => upd({ dob: e.target.value })} />
                      </Field>
                    ) : (
                      <Field label={formedLabel} error={errors.dateOfIncorporation} icon={CalendarDays}>
                        <input name="dateOfIncorporation" type="date" max={maxPastDate} className={`${inp} ${err('dateOfIncorporation')}`}
                          value={data.dateOfIncorporation} onChange={(e) => upd({ dateOfIncorporation: e.target.value })} />
                      </Field>
                    )}

                    {personal && (
                      <Field label="Aadhaar" optional error={errors.aadhaar} icon={Fingerprint}>
                        <TextInput name="aadhaar" inputMode="numeric" className={`${inp} font-mono tracking-[0.08em] ${err('aadhaar')}`}
                          value={data.aadhaar} onValueChange={(v) => upd({ aadhaar: v })} transform={digitsOnly}
                          placeholder="12 digits" maxLength={12} />
                      </Field>
                    )}

                    {data.entity_type === 'llp' && (
                      <Field label="LLPIN" optional icon={Hash}>
                        <TextInput name="llpin" className={`${inp} ${mono}`} value={data.llpin}
                          onValueChange={(v) => upd({ llpin: v })} transform={toUpper} placeholder="AAA-1234" />
                      </Field>
                    )}
                    {kind === 'huf' && (
                      <Field label="Karta" optional icon={UserRound}>
                        <input className={inp} value={data.kartaName} onChange={(e) => upd({ kartaName: e.target.value })} placeholder="Karta’s full name" />
                      </Field>
                    )}
                    {kind === 'trust' && (
                      <Field label="Registration no." optional icon={Hash}>
                        <input className={inp} value={data.registrationNumber} onChange={(e) => upd({ registrationNumber: e.target.value })} placeholder="Registration number" />
                      </Field>
                    )}
                  </div>

                  {kind === 'company' && (data.authorizedCapital > 0 || data.paidUpCapital > 0) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {data.authorizedCapital > 0 && <span className="code-pill">Authorised {inr(data.authorizedCapital)}</span>}
                      {data.paidUpCapital > 0 && <span className="code-pill">Paid-up {inr(data.paidUpCapital)}</span>}
                    </div>
                  )}
                </Group>
              </>
            )}

            {/* ═════════ BUSINESS (proprietor) ═════════ */}
            {currentKey === 'business' && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Business / trade name" error={errors.tradeName} span2 icon={Store}>
                    <input name="tradeName" autoFocus className={`${inp} ${err('tradeName')}`} value={data.tradeName}
                      onChange={(e) => upd({ tradeName: e.target.value })} placeholder="e.g. Sharma Traders" />
                  </Field>
                  <Field label="Business started on" error={errors.dateOfIncorporation} icon={CalendarDays}>
                    <input name="dateOfIncorporation" type="date" max={maxPastDate} className={`${inp} ${err('dateOfIncorporation')}`}
                      value={data.dateOfIncorporation} onChange={(e) => upd({ dateOfIncorporation: e.target.value })} />
                  </Field>
                </div>
                <Group title="What does it do?">
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Nature of business">
                    {BUSINESS_NATURE.map(({ value, icon }) => {
                      const on = data.businessNature.includes(value);
                      return (
                        <Chip key={value} icon={icon} label={value} on={on}
                          onClick={() => upd({ businessNature: on ? data.businessNature.filter((v) => v !== value) : [...data.businessNature, value] })} />
                      );
                    })}
                  </div>
                </Group>
              </>
            )}

            {/* ═════════ PARTNERS (firm / LLP) ═════════ */}
            {currentKey === 'partners' && (
              <>
                <div className="space-y-2.5">
                  <div className="hidden grid-cols-[1fr_120px_84px_110px_36px] gap-2 px-1 sm:grid">
                    {['Partner', 'Capital ₹', 'Share %', 'Salary p.a.', ''].map((h) => (
                      <span key={h} className="font-display text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-3)]">{h}</span>
                    ))}
                  </div>
                  {data.partners.map((p, i) => {
                    const setP = (patch: Partial<typeof p>) => { const ps = [...data.partners]; ps[i] = { ...ps[i], ...patch }; upd({ partners: ps }); };
                    return (
                      <div key={i} className="grid grid-cols-2 gap-2 rounded-[12px] border border-[var(--cream)] bg-[var(--cream-2)]/50 p-2 sm:grid-cols-[1fr_120px_84px_110px_36px] sm:border-0 sm:bg-transparent sm:p-0">
                        <input className={`${inp} col-span-2 sm:col-span-1`} value={p.name} onChange={(e) => setP({ name: e.target.value })} placeholder={`Partner ${i + 1}`} />
                        <input className={`${inp} font-mono text-right`} type="number" value={p.capitalAmount || ''} onChange={(e) => setP({ capitalAmount: +e.target.value })} placeholder="0" aria-label="Capital" />
                        <input className={`${inp} font-mono text-right`} type="number" value={p.profitSharingRatio || ''} onChange={(e) => setP({ profitSharingRatio: +e.target.value })} placeholder="0" aria-label="Profit share %" />
                        <input className={`${inp} font-mono text-right`} type="number" value={p.salary || ''} onChange={(e) => setP({ salary: +e.target.value })} placeholder="0" aria-label="Salary per year" />
                        <button type="button" disabled={data.partners.length <= 2} aria-label="Remove partner"
                          onClick={() => upd({ partners: data.partners.filter((_, j) => j !== i) })}
                          className="inline-flex h-10 w-9 items-center justify-center rounded-[10px] text-[var(--ink-3)] transition-colors duration-[160ms] hover:bg-[var(--bad-soft)] hover:text-[var(--bad)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--ink-3)]">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button type="button" onClick={() => upd({ partners: [...data.partners, { name: '', capitalAmount: 0, profitSharingRatio: 0, salary: 0 }] })}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-[var(--sand-2)] px-4 text-[13px] font-semibold text-[var(--navy)] transition-colors duration-[160ms] hover:bg-[var(--navy-soft)]">
                    <Plus className="h-3.5 w-3.5" /> Add partner
                  </button>
                  <span className={partnerPsr === 100 ? 'status-ok' : 'status-warn'}>
                    <Scale className="h-3 w-3" /> Shares total <span className="font-mono">{partnerPsr}%</span>
                  </span>
                </div>
                <QuestionRow icon={Wallet} title="Capital accounts" hint="Fixed keeps current accounts separate.">
                  <Segmented label="Capital method" value={data.capitalMethod} onChange={(m) => upd({ capitalMethod: m })}
                    options={[{ value: 'fixed', label: 'Fixed' }, { value: 'fluctuating', label: 'Fluctuating' }]} />
                </QuestionRow>
              </>
            )}

            {/* ═════════ CONTACT & ADDRESS ═════════ */}
            {currentKey === 'contact' && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Mobile" error={errors.phone} optional={!personal} icon={Phone}>
                    <TextInput name="phone" autoFocus inputMode="numeric" className={`${inp} font-mono ${err('phone')}`} value={data.phone}
                      onValueChange={(v) => upd({ phone: v })} transform={digitsOnly} placeholder="98765 43210" maxLength={10} />
                  </Field>
                  <Field label="Email" error={errors.email} optional={!personal} icon={Mail}>
                    <input name="email" type="email" className={`${inp} ${err('email')}`} value={data.email}
                      onChange={(e) => upd({ email: e.target.value })} placeholder="name@example.com" />
                  </Field>
                </div>
                <Group title={kind === 'company' ? 'Registered office' : kind === 'proprietor' ? 'Address' : 'Address'}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <Field label="Flat / house / building" error={errors.address} optional={!personal}>
                        <input name="address" className={`${inp} ${err('address')}`} value={data.address}
                          onChange={(e) => upd({ address: e.target.value })} placeholder="e.g. 12, Lotus Apartments" />
                      </Field>
                    </div>
                    <div className="sm:col-span-6">
                      <Field label="Road / area / locality" optional>
                        <input className={inp} value={data.address2} onChange={(e) => upd({ address2: e.target.value })} placeholder="e.g. MG Road, Indiranagar" />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="City" error={errors.city} optional={!personal}>
                        <input name="city" className={`${inp} ${err('city')}`} value={data.city} onChange={(e) => upd({ city: e.target.value })} placeholder="City" />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="State" error={errors.state} optional={!personal}>
                        <select name="state" className={`${inp} ${err('state')}`} value={data.state} onChange={(e) => upd({ state: e.target.value })}>
                          <option value="">Select</option>
                          {INDIAN_STATES.map((s: any) => <option key={s.code ?? s} value={s.name ?? s}>{s.name ?? s}</option>)}
                        </select>
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="PIN" error={errors.pincode} optional={!personal}>
                        <TextInput name="pincode" inputMode="numeric" className={`${inp} font-mono ${err('pincode')}`} value={data.pincode}
                          onValueChange={(v) => upd({ pincode: v })} transform={digitsOnly} placeholder="560001" maxLength={6} />
                      </Field>
                    </div>
                  </div>
                </Group>
              </>
            )}

            {/* ═════════ TAX ═════════ */}
            {currentKey === 'tax' && (
              <>
                <Group title="Income tax">
                  {itrForms.length > 1 ? (
                    <>
                      <div id="itrForm" role="radiogroup" aria-label="Income-tax return" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {itrForms.map((f) => (
                          <ChoiceCard key={f} icon={ITR_ICON[f]} title={ITR_META[f].label.replace(/\s*\(.*\)$/, '')} tag={ITR_TAG[f]}
                            caption={itrCaption(f, kind ?? 'individual')} selected={data.itrForm === f} onClick={() => upd({ itrForm: f })} />
                        ))}
                      </div>
                      {errors.itrForm
                        ? <p className="text-[11px] font-semibold text-[var(--bad)]">{errors.itrForm}</p>
                        : <p className="text-[11px] text-[var(--ink-3)]">You can change this later in Settings.</p>}
                    </>
                  ) : itrForms.length === 1 ? (
                    <QuestionRow icon={ITR_ICON[itrForms[0]]} title={`Files ${ITR_META[itrForms[0]].label}`} hint={ITR_META[itrForms[0]].note}>
                      <span className="status-idle"><Check className="h-3 w-3" /> Set</span>
                    </QuestionRow>
                  ) : null}
                </Group>

                {kind === 'individual' ? (
                  <Group title="Withholding">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <SwitchRow icon={Receipt} title="TDS" caption="Tax deducted at source applies" on={data.tds_applicable}
                        onChange={(v) => upd({ tds_applicable: v })} />
                      <SwitchRow icon={Percent} title="TCS" caption="Tax collected at source applies" on={data.tcs_applicable}
                        onChange={(v) => upd({ tcs_applicable: v })} />
                    </div>
                  </Group>
                ) : (
                  <>
                    <Group title="GST">
                      <QuestionRow icon={Landmark} title="Is GST applicable?" hint="Registered under GST" error={errors.gstChoice}>
                        <YesNo name="gstChoice" value={data.gstChoice} onChange={(v) => upd({ gstChoice: v })} />
                      </QuestionRow>
                      {data.gstChoice && (
                        <div className="reveal space-y-4 rounded-[12px] border border-[var(--sand)] bg-[var(--cream-2)]/70 p-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="label-caps">Scheme</span>
                            <Segmented label="GST scheme" value={data.gstScheme} onChange={(v) => upd({ gstScheme: v })}
                              options={[{ value: 'regular', label: 'Regular' }, { value: 'composition', label: 'Composition' }]} />
                          </div>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="GSTIN" error={errors.gstin} icon={Hash}>
                              <TextInput name="gstin" autoFocus className={`${inp} ${mono} bg-white ${err('gstin')}`} value={data.gstin}
                                onValueChange={(v) => upd({ gstin: v })} transform={toUpper} placeholder="29ABCDE1234F1Z5" maxLength={15} />
                            </Field>
                            <Field label="GST portal username" optional icon={KeyRound} hint="Used once to connect to the GST portal.">
                              <input name="portalUsername" className={`${inp} bg-white`} value={data.portalUsername}
                                onChange={(e) => upd({ portalUsername: e.target.value })} placeholder="Portal login" autoComplete="off" />
                            </Field>
                          </div>
                          {/* Sandbox test-first: fill the mock taxpayer's GSTIN (and its login),
                              which the real checksum validator rejects but the Sandbox TEST API accepts. */}
                          <button type="button"
                            onClick={() => upd({ gstin: SANDBOX_TEST_GSTIN, portalUsername: data.portalUsername || 'acme.com' })}
                            className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--navy)] hover:underline">
                            <Sparkles className="h-3 w-3" /> Use the Sandbox test taxpayer
                          </button>
                          {isSandboxTestGstin(data.gstin) && (
                            <p className="flex items-center gap-1 text-[11px] text-[var(--ok)]">
                              <CheckCircle2 className="h-3 w-3" /> Test taxpayer — OTP <span className="font-mono">575757</span>
                            </p>
                          )}
                        </div>
                      )}
                    </Group>

                    <Group title="TDS & TCS">
                      <QuestionRow icon={Receipt} title="Do you deduct TDS?" hint="If yes, you’ll have a TAN." error={errors.hasTan}>
                        <YesNo name="hasTan" value={data.hasTan} onChange={(v) => upd({ hasTan: v, ...(v ? {} : { tan: '' }) })} />
                      </QuestionRow>
                      {data.hasTan && (
                        <div className="reveal grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
                          <Field label="TAN" error={errors.tan} icon={Hash}>
                            <TextInput name="tan" autoFocus className={`${inp} ${mono} ${err('tan')}`} value={data.tan}
                              onValueChange={(v) => upd({ tan: v })} transform={toUpper} placeholder="ABCD12345E" maxLength={10} />
                          </Field>
                          <p className="pb-2.5"><span className="status-ok"><Check className="h-3 w-3" /> TDS switched on</span></p>
                        </div>
                      )}
                      <SwitchRow icon={Percent} title="TCS" caption="Tax collected at source on sales" on={data.tcs_applicable}
                        onChange={(v) => upd({ tcs_applicable: v })} />
                    </Group>
                  </>
                )}
              </>
            )}

            {/* ═════════ REVIEW ═════════ */}
            {currentKey === 'review' && (() => {
              const k = kind ?? 'individual';
              const cfg = ENTITY_TYPES[data.entity_type as EntityType];
              const addr = [data.address, data.address2, data.city, data.state && `${data.state} ${data.pincode}`.trim()].filter(Boolean).join(', ');
              const sections: { step: StepKey; title: string; rows: [string, string, boolean?][] }[] = [
                {
                  step: 'identity', title: STEP_LABEL.identity, rows: [
                    ['Type', cfg?.label ?? '—'],
                    [nameLabel.replace(/ \(as on PAN\)$/, ''), data.name || '—'],
                    ['PAN', data.pan || '—', true],
                    ...(personal ? [['Date of birth', fmtDate(data.dob), true] as [string, string, boolean]] : [[formedLabel, fmtDate(data.dateOfIncorporation), true] as [string, string, boolean]]),
                    ...(personal && data.aadhaar ? [['Aadhaar', 'XXXX XXXX ' + data.aadhaar.slice(-4), true] as [string, string, boolean]] : []),
                    ...(k === 'company' && data.cin ? [['CIN', data.cin, true] as [string, string, boolean]] : []),
                    ...(data.entity_type === 'llp' && data.llpin ? [['LLPIN', data.llpin, true] as [string, string, boolean]] : []),
                    ...(k === 'huf' && data.kartaName ? [['Karta', data.kartaName] as [string, string]] : []),
                    ...(k === 'trust' && data.registrationNumber ? [['Registration no.', data.registrationNumber, true] as [string, string, boolean]] : []),
                  ],
                },
                ...(k === 'proprietor' ? [{
                  step: 'business' as StepKey, title: STEP_LABEL.business, rows: [
                    ['Trade name', data.tradeName || '—'],
                    ['Nature', data.businessNature.join(', ') || '—'],
                    ['Started on', fmtDate(data.dateOfIncorporation), true],
                  ] as [string, string, boolean?][],
                }] : []),
                ...(k === 'firm' ? [{
                  step: 'partners' as StepKey, title: STEP_LABEL.partners, rows: [
                    ['Partners', data.partners.filter((p) => p.name).map((p) => `${p.name} (${p.profitSharingRatio}%)`).join(', ') || '—'],
                    ['Capital', data.capitalMethod === 'fixed' ? 'Fixed' : 'Fluctuating'],
                  ] as [string, string, boolean?][],
                }] : []),
                {
                  step: 'contact', title: STEP_LABEL.contact, rows: [
                    ['Mobile', data.phone || '—', true],
                    ['Email', data.email || '—'],
                    ['Address', addr || '—'],
                  ],
                },
                {
                  step: 'tax', title: STEP_LABEL.tax, rows: [
                    ['Return', data.itrForm ? ITR_META[data.itrForm].label : itrForms.length === 1 ? ITR_META[itrForms[0]].label : '—'],
                    ...(k === 'individual'
                      ? [
                          ['TDS', data.tds_applicable ? 'Applies' : 'No'] as [string, string],
                          ['TCS', data.tcs_applicable ? 'Applies' : 'No'] as [string, string],
                        ]
                      : [
                          ['GST', data.gstChoice ? `${data.gstScheme === 'composition' ? 'Composition' : 'Regular'} · ${data.gstin}` : 'Not applicable', !!data.gstChoice] as [string, string, boolean],
                          ...(data.gstChoice && data.portalUsername ? [['Portal user', data.portalUsername] as [string, string]] : []),
                          ['TDS', data.hasTan ? `On · TAN ${data.tan}` : 'No'] as [string, string],
                          ['TCS', data.tcs_applicable ? 'Applies' : 'No'] as [string, string],
                        ]),
                  ],
                },
              ];
              return (
                <div className="space-y-3">
                  {sections.map((sec) => (
                    <div key={sec.title} className="overflow-hidden rounded-[12px] border border-[var(--sand)]">
                      <div className="flex items-center justify-between bg-[var(--cream-2)] px-3.5 py-2">
                        <span className="eyebrow">{sec.title}</span>
                        <button type="button" onClick={() => goToStep(steps.indexOf(sec.step))}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold text-[var(--navy)] transition-colors duration-[160ms] hover:bg-[var(--navy-soft)]">
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                      </div>
                      <dl className="divide-y divide-[var(--cream)]">
                        {sec.rows.map(([label, value, isMono]) => (
                          <div key={label} className="flex items-baseline justify-between gap-4 px-3.5 py-2">
                            <dt className="shrink-0 text-[12.5px] text-[var(--ink-3)]">{label}</dt>
                            <dd className={`min-w-0 text-right text-[13px] font-semibold text-[var(--ink)] ${isMono ? 'font-mono' : ''}`}>{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                  <p className="text-[11.5px] text-[var(--ink-3)]">
                    Books run April–March on {k === 'individual' ? 'the cash basis' : 'the accrual (mercantile) basis'}. Inventory can be switched on later if needed.
                  </p>
                </div>
              );
            })()}
          </div>

          {/* ── Footer action (the entity step advances on pick) ── */}
          {currentKey !== 'entity' && (
            <div className="flex items-center justify-between gap-3 border-t border-[var(--cream)] bg-[var(--cream-2)]/70 px-5 py-3.5 sm:px-6">
              <p className="hidden text-[11.5px] text-[var(--ink-3)] sm:block">
                Press <kbd className="rounded border border-[var(--sand)] bg-white px-1 py-px font-mono text-[10.5px]">Enter</kbd> to continue
              </p>
              {currentKey === 'review' ? (
                <button type="submit" disabled={saving}
                  className="btn-pill-primary ml-auto disabled:cursor-wait disabled:!bg-[var(--sand)] disabled:!text-[var(--ink-3)] disabled:[filter:none]">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {saving ? 'Creating…' : 'Create'}
                </button>
              ) : (
                <button type="submit" className="btn-pill-primary ml-auto">
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
