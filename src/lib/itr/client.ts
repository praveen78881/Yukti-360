// Browser-side client for the ITR (income-tax) ERI filing bridge. Talks ONLY to
// our own Sandbox proxy (the same serverless function the GST cockpit uses); the
// API key/secret + ERI credentials live server-side and never reach the browser.
//
// Filing sequence: validate (files nothing) → submit → e-verify OTP → get ITR-V.

const ENDPOINT = '/.netlify/functions/gst-sandbox';

export interface ItrResult<T = any> {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
}

async function call<T = any>(action: string, params: Record<string, unknown> = {}): Promise<ItrResult<T>> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, ...params }),
    });
  } catch (e: any) {
    return { ok: false, status: 0, data: {} as T, error: e?.message || 'Network error — is the dev server running?' };
  }
  let data: any = {};
  try { data = await res.json(); } catch { /* non-JSON */ }
  const error = res.ok ? undefined : (data?.error || data?.message || `Request failed (${res.status})`);
  return { ok: res.ok, status: res.status, data: data as T, error };
}

export interface ItrStatus {
  ok: boolean;
  host: string;
  mode: 'test' | 'live';
  eriConfigured: boolean;
  eriLoggedIn: boolean;
  userId: string | null;
  error?: string;
}

export const itrClient = {
  /** Readiness: app keys valid + whether ERI creds are configured. `login` also proves them. */
  status: (login = false) => call<ItrStatus>('itrStatus', { login }),

  /** Pre-file compliance check against the ITD schema. Files NOTHING — safe to run freely. */
  validate: (taxPayerId: string, itr: unknown) => call('itrValidate', { taxPayerId, itr }),

  /** File the return → arnNumber / transactionNo. Human-initiated only. */
  submit: (taxPayerId: string, itr: unknown) => call('itrSubmit', { taxPayerId, itr }),

  /** Send an OTP to the taxpayer to authorise pulling ITD prefill data. */
  prefillOtp: (taxPayerId: string, assessmentYear: string, source = 'itd') =>
    call('itrPrefillOtp', { taxPayerId, assessmentYear, source }),

  /** e-Verify a filed return (aadhaar / evc / dsc). Human-initiated only. */
  everifyOtp: (p: {
    taxPayerId: string; assessmentYear: string; formCode: number | string;
    verificationMode: string; acknowledgementNumber: string | number;
  }) => call('itrEverifyOtp', p),

  /** Fetch the ITR-V acknowledgement for a filed return. */
  ack: (taxPayerId: string, acknowledgementNumber: string | number) =>
    call('itrAck', { taxPayerId, acknowledgementNumber }),

  /** OCR a Form-16 PDF → structured TDS/salary data. App-key auth only (NO ERI). */
  ocrForm16: (fileBase64: string, filename?: string, password?: string) =>
    call('ocrForm16', { fileBase64, filename, password }),

  /** OCR a Form-26AS PDF → structured tax-credit data. App-key auth only (NO ERI). */
  ocrForm26as: (fileBase64: string, filename?: string) =>
    call('ocrForm26as', { fileBase64, filename }),
};

/** Read a File as a base64 string (no data: prefix) for the OCR endpoints. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || '').split(',').pop() || '');
    r.onerror = () => reject(new Error('Could not read the file.'));
    r.readAsDataURL(file);
  });
}

/** A message row as the ITD validator / submit returns it. */
export interface ItrApiMessage {
  code?: string;
  type?: string;        // ERROR | INFO | REMARK | WARNING
  desc?: string;
  fieldName?: string | null;
}

/** Pull the message + error rows out of Sandbox's `{ code, data: { messages, errors, successFlag } }`. */
export function extractItrMessages(data: any): { successFlag?: boolean; messages: ItrApiMessage[]; arn?: string; transactionNo?: string } {
  const d = data?.data ?? data ?? {};
  const messages: ItrApiMessage[] = [
    ...(Array.isArray(d.messages) ? d.messages : []),
    ...(Array.isArray(d.errors) ? d.errors : []),
  ];
  return {
    successFlag: d.successFlag,
    messages,
    arn: d.arnNumber || d.arn || undefined,
    transactionNo: d.transactionNo || undefined,
  };
}

/* ── ITR JSON extraction from the same-origin form iframes ────────────────────
   Each tool exposes a top-level JSON builder (and usually a validator) on its
   window. Names differ by form, so we try known candidates in order. */

export type ItrKey = 'itr1' | 'itr2' | 'itr3' | 'itr4' | 'itr5' | 'itr6' | 'itr7';

const BUILDERS: Record<ItrKey, string[]> = {
  itr1: ['buildItr1Json'],
  itr2: ['buildItr2Json'],
  itr3: ['buildItr3Json'],
  itr4: ['buildItr4Json'],
  itr5: ['buildITR', 'buildItr5Json'],
  itr6: ['buildJSON', 'buildItr6Json'],
  itr7: ['buildITR7Json', 'buildItr7Json'],
};

const VALIDATORS: Record<ItrKey, string[]> = {
  itr1: ['validateItr1'],
  itr2: ['validateItr2'],
  itr3: ['validateItr3'],
  itr4: ['validateItr4'],
  itr5: ['validateItr5', 'validate'],
  itr6: ['validate', 'validateItr6'],
  itr7: ['validateITR7', 'runValidate'],
};

/** ITD form_code for an ITR form key (1..7). */
export function itrFormCode(key: ItrKey): number {
  return Number(key.replace('itr', '')) || 0;
}

/** ITD assessment_year (4-digit string) from an "AY 2026-27"-style label. */
export function assessmentYearParam(ay: string): string {
  const m = String(ay).match(/(\d{4})/);
  return m ? m[1] : '';
}

export interface ExtractedItr {
  ok: boolean;
  json?: any;                                  // { ITR: { ITRn: {...} } }
  formName?: string;
  local?: { errors: string[]; warnings: string[] }; // form's own pre-check, best-effort
  error?: string;
}

/** Call the form's own JSON builder inside its iframe window and return the payload. */
export function extractItrJson(win: Window | null | undefined, key: ItrKey): ExtractedItr {
  if (!win) return { ok: false, error: 'The form is not loaded yet — open the form tab and try again.' };
  const w = win as unknown as Record<string, any>;

  // Best-effort local validation (never blocks; the ITD validate is authoritative).
  let local: { errors: string[]; warnings: string[] } | undefined;
  for (const name of VALIDATORS[key]) {
    if (typeof w[name] === 'function') {
      try {
        const r = w[name]();
        if (r && typeof r === 'object') {
          local = {
            errors: Array.isArray(r.errors) ? r.errors.map(String) : [],
            warnings: Array.isArray(r.warnings) ? r.warnings.map(String) : [],
          };
        }
      } catch { /* ignore a throwing validator */ }
      break;
    }
  }

  for (const name of BUILDERS[key]) {
    if (typeof w[name] === 'function') {
      try {
        const json = w[name]();
        if (json && typeof json === 'object' && json.ITR) {
          const inner = json.ITR[Object.keys(json.ITR)[0]] || {};
          const formName = inner?.[`Form_ITR${itrFormCode(key)}`]?.FormName
            || Object.keys(json.ITR)[0];
          return { ok: true, json, formName, local };
        }
        return { ok: false, error: `${name}() did not return a { ITR: … } payload.`, local };
      } catch (e: any) {
        return { ok: false, error: `The form's JSON builder threw: ${e?.message || e}`, local };
      }
    }
  }
  return { ok: false, error: 'This form does not expose a JSON builder yet — use the paste/import option.', local };
}

/* ── Cross-frame validation (drives the tool's own validator) ─────────────────
   Each tool exposes a validator whose name varies by form. We normalise every
   shape into { errors:[{slno,msg,field?}], warnings:[{slno,msg}] } so the shell
   can render one consistent popup and highlight the offending fields. */

const VALIDATOR_FNS: Record<ItrKey, string[]> = {
  itr1: ['validateItr1'],
  itr2: ['validateItr2'],
  itr3: ['validateItr3'],
  itr4: ['validateItr4'],
  itr5: ['validateITR5', 'validateItr5'],
  itr6: ['runValidate', 'validate', 'validateItr6'], // itr6 AY2025-26 backup = runValidate
  itr7: ['validateITR7', 'runValidate'],
};

export interface ItrValFinding { slno: string; msg: string; field?: string; }
export interface ItrValResult { ran: boolean; errors: ItrValFinding[]; warnings: ItrValFinding[]; error?: string; }

function normFinding(x: any): ItrValFinding {
  if (typeof x === 'string') return { slno: '', msg: x };
  return {
    slno: String(x?.slno ?? x?.sl ?? x?.code ?? x?.slNo ?? ''),
    msg: String(x?.msg ?? x?.desc ?? x?.rule ?? x?.message ?? x ?? ''),
    field: x?.field ?? x?.fieldId ?? x?.binds ?? x?.id ?? undefined,
  };
}

/** Run the form's own validator inside its iframe and return a normalised result. */
export function validateItrInFrame(win: Window | null | undefined, key: ItrKey): ItrValResult {
  if (!win) return { ran: false, errors: [], warnings: [], error: 'The form is not loaded yet.' };
  const w = win as unknown as Record<string, any>;
  // Build the JSON first (the validators take it, or ignore the arg and read the DOM).
  let json: any;
  const ex = extractItrJson(win, key);
  if (ex.ok) json = ex.json;

  for (const name of VALIDATOR_FNS[key]) {
    if (typeof w[name] !== 'function') continue;
    try {
      const r = w[name](json);
      // Shape 1: { errors, warnings }
      if (r && typeof r === 'object' && (Array.isArray(r.errors) || Array.isArray(r.warnings))) {
        return {
          ran: true,
          errors: (r.errors || []).map(normFinding),
          warnings: (r.warnings || []).map(normFinding),
        };
      }
      // Shape 2: flat array [{cat,...}] (itr6/itr7 runValidate) — cat A/E = blocking
      if (Array.isArray(r)) {
        const errors: ItrValFinding[] = [], warnings: ItrValFinding[] = [];
        for (const it of r) {
          const cat = String(it?.cat ?? it?.category ?? it?.sev ?? '').toUpperCase();
          (cat === 'A' || cat === 'E' ? errors : warnings).push(normFinding(it));
        }
        return { ran: true, errors, warnings };
      }
      // Validator ran but returned nothing recognisable → treat as clean.
      return { ran: true, errors: [], warnings: [] };
    } catch (e: any) {
      return { ran: false, errors: [], warnings: [], error: `Validator threw: ${e?.message || e}` };
    }
  }
  return { ran: false, errors: [], warnings: [], error: 'This form has no validator yet.' };
}

/** Build the JSON and trigger a browser download. Returns ok/error for the caller. */
export function downloadItrJson(win: Window | null | undefined, key: ItrKey, pan: string, ay: string): { ok: boolean; error?: string } {
  const ex = extractItrJson(win, key);
  if (!ex.ok || !ex.json) return { ok: false, error: ex.error || 'Could not build the JSON.' };
  try {
    const ay4 = assessmentYearParam(ay) || ay;
    const blob = new Blob([JSON.stringify(ex.json, null, 1)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(pan || 'RETURN').toUpperCase()}_${ay4}_${key.toUpperCase()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Download failed.' };
  }
}

/** Collapse each drill-in's action buttons (Save / Done / Add row) into a compact ⋮
 *  menu, matching the shell toolbar. Runs same-origin against the tool iframe; a
 *  MutationObserver re-processes drill-ins/rows added after load. Idempotent. */
export function kebabifyDrillins(win: Window | null | undefined): void {
  if (!win) return;
  try {
    const d = win.document;
    if (!d.getElementById('__itr_kebab_style')) {
      const st = d.createElement('style');
      st.id = '__itr_kebab_style';
      st.textContent =
        '.sf-actions.__kb{position:relative;display:flex;align-items:center;gap:4px;}' +
        '.__kb-toggle{background:#fff;border:1px solid #e5e7eb;border-radius:8px;width:30px;height:28px;cursor:pointer;font-size:17px;line-height:1;color:#374151;padding:0;}' +
        '.__kb-toggle:hover{background:#f9fafb;}' +
        '.__kb-menu{position:absolute;right:0;top:32px;z-index:60;background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.14);padding:4px;display:none;min-width:160px;}' +
        '.__kb-menu.open{display:block;}' +
        '.__kb-menu .sf-btn{display:flex!important;width:100%;justify-content:flex-start;margin:2px 0;text-align:left;}';
      d.head.appendChild(st);
    }
    const process = () => {
      d.querySelectorAll('.sf-actions:not(.__kb)').forEach((act) => {
        const btns = Array.from(act.querySelectorAll('button, .sf-btn')) as HTMLElement[];
        if (!btns.length) return;
        act.classList.add('__kb');
        const menu = d.createElement('div');
        menu.className = '__kb-menu';
        // MOVE the existing buttons in — moving preserves their onclick/data-close listeners.
        btns.forEach((b) => menu.appendChild(b));
        menu.addEventListener('click', () => menu.classList.remove('open'));
        const tog = d.createElement('button');
        tog.type = 'button';
        tog.className = '__kb-toggle';
        tog.textContent = '⋮';
        tog.title = 'Actions';
        tog.addEventListener('click', (e) => {
          e.stopPropagation();
          d.querySelectorAll('.__kb-menu.open').forEach((m) => { if (m !== menu) m.classList.remove('open'); });
          menu.classList.toggle('open');
        });
        act.appendChild(tog);
        act.appendChild(menu);
      });
    };
    process();
    // Close any open menu on an outside click.
    if (!(win as any).__itrKebabClick) {
      (win as any).__itrKebabClick = true;
      d.addEventListener('click', () => d.querySelectorAll('.__kb-menu.open').forEach((m) => m.classList.remove('open')), true);
    }
    // Debounced re-process for drill-ins / repeater rows added after load.
    if (!(win as any).__itrKebabObs) {
      let t = 0;
      const obs = new (win as any).MutationObserver(() => {
        win.clearTimeout(t);
        t = win.setTimeout(process, 150);
      });
      obs.observe(d.body, { childList: true, subtree: true });
      (win as any).__itrKebabObs = obs;
    }
  } catch { /* cross-origin / timing — ignore */ }
}

/** Close the top-most open drill-in (.subform.open) inside an ITR tool iframe.
 *  Every tool closes its top layer on Escape, so we dispatch that first and fall
 *  back to clicking the panel's own Done/close control. Returns true only when a
 *  drill-in actually closed — the shell Back button then swallows the press
 *  instead of navigating away from the page. */
export function closeTopDrillin(win: Window | null | undefined): boolean {
  if (!win) return false;
  try {
    const doc = win.document;
    const open = doc.querySelectorAll('.subform.open');
    if (!open.length) return false;
    const KE = (win as unknown as { KeyboardEvent: typeof KeyboardEvent }).KeyboardEvent;
    doc.dispatchEvent(new KE('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    if (doc.querySelectorAll('.subform.open').length >= open.length) {
      const top = open[open.length - 1];
      const btn = top.querySelector<HTMLElement>('[data-close],[data-close-co],[data-close-al],[data-close-fa],.sf-done,.sf-close');
      btn?.click();
    }
    return doc.querySelectorAll('.subform.open').length < open.length;
  } catch { return false; }
}

/** Best-effort: outline the iframe fields referenced by validation findings. */
export function highlightItrFields(win: Window | null | undefined, findings: ItrValFinding[], on: boolean): void {
  if (!win) return;
  try {
    const doc = win.document;
    const STYLE_ID = '__itr_hl_style';
    if (!doc.getElementById(STYLE_ID)) {
      const s = doc.createElement('style'); s.id = STYLE_ID;
      s.textContent = '.__itr_hl{outline:2px solid #dc2626!important;outline-offset:1px;background:#fef2f2!important;}';
      doc.head.appendChild(s);
    }
    doc.querySelectorAll('.__itr_hl').forEach((el) => el.classList.remove('__itr_hl'));
    if (!on) return;
    for (const f of findings) {
      if (!f.field) continue;
      const el = doc.getElementById(f.field);
      if (el) el.classList.add('__itr_hl');
    }
  } catch { /* cross-frame or missing — ignore */ }
}
