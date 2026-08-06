// e-File ITR modal — drives the ERI filing sequence for the return currently open
// in the income-tax workspace:
//   1. Validate  → ITD compliance check (files NOTHING; safe to run freely)
//   2. Submit    → files the return, returns the acknowledgement (ARN)   [human-gated]
//   3. e-Verify  → aadhaar / EVC / DSC OTP on the filed return           [human-gated]
//   4. ITR-V     → fetch the acknowledgement receipt
//
// The JSON is pulled live from the form's own builder (extractItrJson) with a
// paste/import fallback for forms that don't yet expose one. The app never files
// on its own — Submit and e-Verify are explicit, authorised human actions.

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  X, ShieldCheck, CheckCircle2, AlertTriangle, Info, Loader2, FileDown,
  Upload, Send, BadgeCheck, FileText, RefreshCw,
} from 'lucide-react';
import type { Company } from '@/types/company';
import { getEntityData, upsertEntityData } from '@/lib/offlineDb';
import { useGstEnv } from '@/lib/gst/useGstEnv';
import {
  itrClient, extractItrMessages, assessmentYearParam, itrFormCode,
  type ItrKey, type ItrApiMessage, type ItrStatus, type ExtractedItr,
} from '@/lib/itr/client';

type Extractor = () => ExtractedItr;

interface Props {
  open: boolean;
  onClose: () => void;
  company: Company;
  itrKey: ItrKey;
  ay: string;               // "2026-27"
  extract: Extractor;       // pulls fresh JSON from the live iframe
}

const MODULE = 'itr_efile';

/** Colour + icon for an ITD message row by its type. */
function msgStyle(type?: string) {
  const t = (type || '').toUpperCase();
  if (t === 'ERROR') return { cls: 'border-red-200 bg-red-50 text-red-800', Icon: AlertTriangle };
  if (t === 'WARNING') return { cls: 'border-amber-200 bg-amber-50 text-amber-800', Icon: AlertTriangle };
  if (t === 'INFO') return { cls: 'border-blue-200 bg-blue-50 text-blue-800', Icon: Info };
  return { cls: 'border-gray-200 bg-gray-50 text-gray-700', Icon: Info }; // REMARK / other
}

function MessageList({ messages }: { messages: ItrApiMessage[] }) {
  if (!messages.length) return null;
  return (
    <ul className="space-y-1.5">
      {messages.map((m, i) => {
        const { cls, Icon } = msgStyle(m.type);
        return (
          <li key={i} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${cls}`}>
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium leading-snug">{m.desc || m.code || 'Message'}</p>
              <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] opacity-70">
                {m.code && <span>Code: {m.code}</span>}
                {m.type && <span>{m.type}</span>}
                {m.fieldName && <span className="font-mono">{m.fieldName}</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Section({ n, title, done, children }: { n: number; title: string; done?: boolean; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
          {done ? '✓' : n}
        </span>
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      </div>
      <div className="space-y-3 px-4 py-3">{children}</div>
    </div>
  );
}

export function EFileItrModal({ open, onClose, company, itrKey, ay, extract }: Props) {
  const env = useGstEnv();
  const [status, setStatus] = useState<ItrStatus | null>(null);
  const [pan, setPan] = useState((company.entity_details?.pan || '').toUpperCase());
  const [source, setSource] = useState<'form' | 'paste'>('form');
  const [extracted, setExtracted] = useState<ExtractedItr | null>(null);
  const [pasteText, setPasteText] = useState('');

  const [validating, setValidating] = useState(false);
  const [validateMsgs, setValidateMsgs] = useState<ItrApiMessage[] | null>(null);
  const [validateOk, setValidateOk] = useState<boolean | null>(null);

  const [authorise, setAuthorise] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitRes, setSubmitRes] = useState<{ arn?: string; transactionNo?: string; messages: ItrApiMessage[]; ok?: boolean } | null>(null);

  const [ackNumber, setAckNumber] = useState('');
  const [vMode, setVMode] = useState('aadhaar');
  const [everifying, setEverifying] = useState(false);
  const [everifyMsgs, setEverifyMsgs] = useState<ItrApiMessage[] | null>(null);

  const [fetchingAck, setFetchingAck] = useState(false);
  const [ackData, setAckData] = useState<any>(null);

  const ay4 = assessmentYearParam(ay);
  const formCode = itrFormCode(itrKey);
  const eriReady = !!status?.eriConfigured;

  // On open: pull fresh JSON, probe readiness, restore any saved filing result.
  useEffect(() => {
    if (!open) return;
    const ex = extract();
    setExtracted(ex);
    setSource(ex.ok ? 'form' : 'paste');
    setValidateMsgs(null); setValidateOk(null); setAuthorise(false);
    setSubmitRes(null); setEverifyMsgs(null); setAckData(null);
    itrClient.status().then((r) => setStatus(r.data)).catch(() => setStatus(null));
    try {
      const saved = getEntityData(company.id, MODULE, itrKey)?.data as any;
      if (saved) {
        if (saved.pan) setPan(String(saved.pan).toUpperCase());
        if (saved.ackNumber) setAckNumber(String(saved.ackNumber));
        if (saved.arn) setSubmitRes({ arn: saved.arn, transactionNo: saved.transactionNo, messages: [], ok: true });
      }
    } catch { /* ignore */ }
  }, [open, itrKey, company.id, extract]);

  // The JSON to file, from whichever source is selected.
  const current = useMemo((): { json?: any; error?: string } => {
    if (source === 'form') {
      if (extracted?.ok && extracted.json) return { json: extracted.json };
      return { error: extracted?.error || 'No JSON available from the form.' };
    }
    const t = pasteText.trim();
    if (!t) return { error: 'Paste or import an ITR JSON.' };
    try {
      const parsed = JSON.parse(t);
      if (!parsed?.ITR) return { error: 'JSON has no top-level "ITR" object.' };
      return { json: parsed };
    } catch (e: any) {
      return { error: `Invalid JSON: ${e?.message || e}` };
    }
  }, [source, extracted, pasteText]);

  const panValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);

  if (!open) return null;

  const persist = (patch: Record<string, unknown>) => {
    try {
      const prev = (getEntityData(company.id, MODULE, itrKey)?.data as Record<string, unknown>) || {};
      upsertEntityData(company.id, MODULE, itrKey, { ...prev, ay, pan, ...patch, savedAt: new Date().toISOString() });
    } catch { /* ignore */ }
  };

  const downloadJson = () => {
    if (!current.json) { toast.error(current.error || 'Nothing to download.'); return; }
    const blob = new Blob([JSON.stringify(current.json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${itrKey.toUpperCase()}_${pan || 'RETURN'}_AY${ay4}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (file: File) => {
    try { setPasteText(await file.text()); setSource('paste'); }
    catch { toast.error('Could not read that file.'); }
  };

  const doValidate = async () => {
    if (!panValid) { toast.error('Enter a valid 10-character PAN.'); return; }
    if (!current.json) { toast.error(current.error || 'No JSON to validate.'); return; }
    setValidating(true); setValidateMsgs(null); setValidateOk(null);
    try {
      const r = await itrClient.validate(pan, current.json);
      const { successFlag, messages } = extractItrMessages(r.data);
      setValidateMsgs(messages);
      const hasError = messages.some((m) => (m.type || '').toUpperCase() === 'ERROR');
      const ok = (successFlag !== false) && !hasError && r.ok;
      setValidateOk(ok);
      if (!r.ok && !messages.length) toast.error(r.error || 'Validate failed.');
      else toast[ok ? 'success' : 'error'](ok ? 'Validation passed — no blocking errors.' : 'Validation returned issues.');
    } catch (e: any) {
      toast.error(e?.message || 'Validate failed.');
    } finally {
      setValidating(false);
    }
  };

  const doSubmit = async () => {
    if (!validateOk) { toast.error('Validate the return without errors first.'); return; }
    if (!authorise) { toast.error('Tick the authorisation box to file.'); return; }
    if (!current.json) return;
    setSubmitting(true);
    try {
      const r = await itrClient.submit(pan, current.json);
      const { successFlag, messages, arn, transactionNo } = extractItrMessages(r.data);
      const ok = successFlag !== false && r.ok;
      setSubmitRes({ arn, transactionNo, messages, ok });
      if (arn) { setAckNumber(arn); persist({ arn, ackNumber: arn, transactionNo, filedAt: new Date().toISOString() }); }
      if (arn) toast.success(`Filed — acknowledgement ${arn}`);
      else toast.error(r.error || 'Submit did not return an acknowledgement.');
    } catch (e: any) {
      toast.error(e?.message || 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const doEverify = async () => {
    if (!ackNumber) { toast.error('An acknowledgement number is required.'); return; }
    setEverifying(true); setEverifyMsgs(null);
    try {
      const r = await itrClient.everifyOtp({
        taxPayerId: pan, assessmentYear: ay4, formCode, verificationMode: vMode, acknowledgementNumber: ackNumber,
      });
      const { messages } = extractItrMessages(r.data);
      setEverifyMsgs(messages.length ? messages : [{ type: r.ok ? 'INFO' : 'ERROR', desc: r.ok ? 'Request accepted.' : (r.error || 'e-Verify failed.') }]);
      if (r.ok) { persist({ everifiedMode: vMode, everifiedAt: new Date().toISOString() }); toast.success('e-Verification request sent.'); }
    } catch (e: any) {
      toast.error(e?.message || 'e-Verify failed.');
    } finally {
      setEverifying(false);
    }
  };

  const doFetchAck = async () => {
    if (!ackNumber) { toast.error('An acknowledgement number is required.'); return; }
    setFetchingAck(true); setAckData(null);
    try {
      const r = await itrClient.ack(pan, ackNumber);
      setAckData(r.data?.data ?? r.data);
      if (!r.ok) toast.error(r.error || 'Could not fetch the acknowledgement.');
    } catch (e: any) {
      toast.error(e?.message || 'Fetch failed.');
    } finally {
      setFetchingAck(false);
    }
  };

  const live = env?.mode === 'live';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-6 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl border-b border-gray-100 bg-gradient-to-r from-blue-700 to-indigo-600 px-5 py-3">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="h-5 w-5 text-blue-200" />
            <div>
              <h3 className="text-sm font-bold leading-tight">e-File {itrKey.toUpperCase()} · A.Y. {ay}</h3>
              <p className="text-[11px] text-blue-200">Income Tax Department · ERI bridge</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-blue-100 hover:bg-white/10" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[74vh] space-y-3 overflow-y-auto px-5 py-4">
          {/* Environment + readiness */}
          <div className="flex flex-wrap items-center gap-2">
            {live ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-700 bg-red-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                <AlertTriangle className="h-3 w-3" /> Production — real ITD filing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> Test environment
              </span>
            )}
            {status && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${eriReady ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                {eriReady ? <BadgeCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                {eriReady ? `ERI ${status.userId || 'ready'}` : 'ERI login not configured'}
              </span>
            )}
          </div>

          {/* Taxpayer + JSON source */}
          <Section n={1} title="Return & taxpayer" done={!!current.json && panValid}>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-[11px] font-semibold text-gray-500">
                Taxpayer PAN
                <input
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  className={`mt-1 block w-40 rounded-lg border px-2.5 py-1.5 font-mono text-sm uppercase focus:outline-none ${panValid ? 'border-gray-200' : 'border-amber-300 bg-amber-50'}`}
                />
              </label>
              <div className="text-[11px] text-gray-500">
                <span className="font-semibold text-gray-700">{company.name}</span><br />
                Form {itrKey.toUpperCase()} · AY {ay4}{extracted?.formName ? ` · ${extracted.formName}` : ''}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-semibold text-gray-500">JSON source:</span>
              <button
                onClick={() => { setExtracted(extract()); setSource('form'); }}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold ${source === 'form' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                <RefreshCw className="h-3 w-3" /> From this form
              </button>
              <button
                onClick={() => setSource('paste')}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold ${source === 'paste' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                <Upload className="h-3 w-3" /> Paste / import
              </button>
            </div>

            {source === 'form' ? (
              <div className={`rounded-lg border px-3 py-2 text-xs ${current.json ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                {current.json
                  ? <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> JSON built from the live form.</span>
                  : <span className="inline-flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> {current.error}</span>}
                {extracted?.local && (extracted.local.errors.length > 0 || extracted.local.warnings.length > 0) && (
                  <p className="mt-1 text-[10px] opacity-80">
                    Form pre-check: {extracted.local.errors.length} error(s), {extracted.local.warnings.length} warning(s)
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={4}
                  placeholder='Paste a complete ITR JSON: { "ITR": { "ITR3": { … } } }'
                  className="block w-full rounded-lg border border-gray-200 px-2.5 py-2 font-mono text-[11px] focus:outline-none"
                />
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-blue-600">
                  <Upload className="h-3.5 w-3.5" /> Import a .json file
                  <input type="file" accept="application/json,.json" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); }} />
                </label>
              </div>
            )}

            <button
              onClick={downloadJson}
              disabled={!current.json}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <FileDown className="h-3.5 w-3.5" /> Download JSON
            </button>
          </Section>

          {/* Validate */}
          <Section n={2} title="Validate (files nothing)" done={validateOk === true}>
            <p className="text-[11px] text-gray-500">Runs the return through the ITD schema &amp; business-rule checks. Safe — nothing is filed.</p>
            <button
              onClick={doValidate}
              disabled={validating || !current.json || !panValid}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {validating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              Validate return
            </button>
            {validateOk !== null && (
              <div className={`rounded-lg border px-3 py-2 text-xs font-semibold ${validateOk ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
                {validateOk ? 'No blocking errors — ready to file.' : 'Issues found — review the messages below.'}
              </div>
            )}
            {validateMsgs && <MessageList messages={validateMsgs} />}
          </Section>

          {/* Submit */}
          <Section n={3} title="Submit (files the return)" done={!!submitRes?.arn}>
            <label className="flex items-start gap-2 text-[11px] text-gray-600">
              <input type="checkbox" checked={authorise} onChange={(e) => setAuthorise(e.target.checked)} className="mt-0.5" />
              <span>I have reviewed this return and authorise filing it with the Income Tax Department{live ? ' (PRODUCTION — this is a real, legally-binding filing).' : '.'}</span>
            </label>
            <button
              onClick={doSubmit}
              disabled={submitting || !validateOk || !authorise}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              File {itrKey.toUpperCase()} now
            </button>
            {submitRes?.arn && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                <p className="font-semibold">Filed successfully.</p>
                <p className="mt-0.5 font-mono">ARN / Ack: {submitRes.arn}</p>
                {submitRes.transactionNo && <p className="font-mono text-[10px] opacity-80">Txn: {submitRes.transactionNo}</p>}
              </div>
            )}
            {submitRes?.messages && submitRes.messages.length > 0 && <MessageList messages={submitRes.messages} />}
          </Section>

          {/* e-Verify + ITR-V */}
          <Section n={4} title="e-Verify & acknowledgement" done={!!ackData}>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-[11px] font-semibold text-gray-500">
                Acknowledgement no.
                <input
                  value={ackNumber}
                  onChange={(e) => setAckNumber(e.target.value.replace(/\D/g, ''))}
                  maxLength={16}
                  placeholder="15–16 digits"
                  className="mt-1 block w-44 rounded-lg border border-gray-200 px-2.5 py-1.5 font-mono text-sm focus:outline-none"
                />
              </label>
              <label className="text-[11px] font-semibold text-gray-500">
                Verify by
                <select value={vMode} onChange={(e) => setVMode(e.target.value)} className="mt-1 block rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none">
                  <option value="aadhaar">Aadhaar OTP</option>
                  <option value="evc">EVC</option>
                  <option value="dsc">DSC</option>
                </select>
              </label>
            </div>
            {!eriReady && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                e-Verify and ITR-V need the ERI user session — set <span className="font-mono">SANDBOX_ERI_USER_ID</span> / <span className="font-mono">SANDBOX_ERI_PASSWORD</span> on the server.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={doEverify}
                disabled={everifying || !ackNumber || !eriReady}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {everifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                e-Verify
              </button>
              <button
                onClick={doFetchAck}
                disabled={fetchingAck || !ackNumber || !eriReady}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {fetchingAck ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                Get ITR-V
              </button>
            </div>
            {everifyMsgs && <MessageList messages={everifyMsgs} />}
            {ackData && (
              <pre className="max-h-40 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-2 text-[10px] leading-snug text-gray-700">
                {JSON.stringify(ackData, null, 2)}
              </pre>
            )}
          </Section>
        </div>

        <div className="flex items-center justify-between rounded-b-2xl border-t border-gray-100 bg-gray-50 px-5 py-3">
          <p className="text-[10px] text-gray-400">Validate is safe. Submit &amp; e-Verify are real, human-authorised actions.</p>
          <button onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
