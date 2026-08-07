import { chromium } from 'playwright';

const URL = 'http://localhost:7777/tax-utilities/itr6.html';
const issues = [];
const push = (s) => { if (issues.length < 12 && !issues.includes(s)) issues.push(s); };

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push('pageerror: ' + (e.message || String(e)).slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') pageErrors.push('console: ' + m.text().slice(0, 200)); });

await page.goto(URL, { waitUntil: 'load', timeout: 60000 });

// ---- 2. native buttons visible at load (checked immediately) ----
const nativeBtns = await page.evaluate(() => {
  const ids = ['exportJsonBtn', 'importAisBtn', 'exportBtn'];
  const alt = ['btnExport', 'btnValidate', 'btnNext'];
  const chk = (id) => {
    const n = document.getElementById(id);
    if (!n) return { id, exists: false };
    const r = n.getBoundingClientRect();
    return { id, exists: true, visible: n.offsetParent !== null && r.width > 0 && r.height > 0 };
  };
  return { spec: ids.map(chk), alt: alt.map(chk) };
});

// AY declared by the tool itself
const declaredAy = await page.evaluate(() => {
  const n = document.querySelector('.ay');
  return { badge: n ? n.textContent.trim() : null, title: document.title };
});
if (declaredAy.badge && !/2025-?26/.test(declaredAy.badge)) {
  push('AY mismatch: tool is built for "' + declaredAy.badge + '" (title: "' + declaredAy.title + '"); there is no itr6 AY 2025-26 variant in public/tax-utilities');
}

// ---- 1. loaded? ----
const loaded = await page.evaluate(() => document.querySelectorAll('input,select').length > 5);
const ctlCount = await page.evaluate(() => document.querySelectorAll('input,select').length);

// ---- 3. fill identity fields ----
const fillReport = await page.evaluate(() => {
  const out = { filled: 0, tried: [], fails: [] };
  const fire = (n) => {
    n.dispatchEvent(new Event('input', { bubbles: true }));
    n.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const setVal = (n, v, label) => {
    if (!n) return false;
    try {
      if (n.tagName === 'SELECT') {
        const opts = [...n.options].filter(o => o.value !== '' && o.value != null);
        if (!opts.length) { out.fails.push(label + ': select has no options'); return false; }
        n.value = opts[Math.min(1, opts.length - 1)].value;
        fire(n);
        if (!n.value) { out.fails.push(label + ': select value did not stick'); return false; }
        out.filled++; return true;
      }
      n.value = v; fire(n);
      const back = n.value;
      const ok = back === v || back.replace(/[, ]/g, '') === String(v).replace(/[, ]/g, '');
      if (!ok) { out.fails.push(label + ': typed "' + v + '" read back "' + back + '"'); return false; }
      out.filled++; return true;
    } catch (e) { out.fails.push(label + ': ' + e.message); return false; }
  };

  // spec'd ids (task list) + this tool's actual clientbar ids
  const byId = [
    ['cl_name', 'ACME MANUFACTURING PRIVATE LIMITED'],
    ['cl_pan', 'AABCA1234D'],
    ['cl_dob', '01/04/2010'],
    ['cl_doi', '01/04/2010'],
    ['cl_status', null],
    ['cl_resid', null],
    ['asr_name', 'ACME MANUFACTURING PRIVATE LIMITED'],
    ['asr_pan', 'AABCA1234D'],
    ['asr_dob', '01/04/2010'],
    ['asr_flat', 'Plot 12'],
    ['asr_city', 'Hyderabad'],
    ['asr_state', null],
    ['asr_pin', '500081'],
    ['asr_mobile', '9876543210'],
    ['asr_email', 'acme@example.com'],
    ['vfr_name', 'RAMESH KUMAR'],
    ['vfr_pan', 'ABCPK1234F'],
  ];
  for (const [id, v] of byId) {
    const n = document.getElementById(id);
    out.tried.push({ id, present: !!n });
    if (n) setVal(n, v, '#' + id);
  }

  // this tool's real identity fields live on data-p keys
  const byP = [
    ['assessee.flat', 'Plot 12, Cyber Towers'],
    ['assessee.land', 'Hitec City'],
    ['assessee.district', 'Hyderabad'],
    ['assessee.state', null],
    ['assessee.ccode', '500081'],
    ['assessee.std', '040'],
    ['assessee.email', 'acme@example.com'],
    ['assessee.secmob', '9876543210'],
    ['assessee.status', null],
    ['verifier.name', 'RAMESH KUMAR'],
    ['verifier.pan', 'ABCPK1234F'],
    ['verifier.father', 'SURESH KUMAR'],
    ['verifier.place', 'Hyderabad'],
    ['verifier.capacity', null],
  ];
  for (const [p, v] of byP) {
    const n = document.querySelector('[data-p="' + p + '"]');
    out.tried.push({ id: 'data-p=' + p, present: !!n });
    if (n) setVal(n, v, '[' + p + ']');
  }

  // a few sheet fields (data-v) to exercise numeric/date/text controls
  const sheetInputs = [...document.querySelectorAll('input[data-v]')].slice(0, 6);
  sheetInputs.forEach((n, i) => {
    const v = n.classList.contains('n') ? String(100000 + i * 1111) : 'TESTVAL' + i;
    setVal(n, v, 'sheet ' + (n.id || n.dataset.v));
  });

  return out;
});

let fieldsFilled = fillReport.filled;
fillReport.fails.slice(0, 4).forEach(f => push('field rejected input — ' + f));

const missingSpecIds = fillReport.tried.filter(t => !t.present && !t.id.startsWith('data-p=')).map(t => t.id);
if (missingSpecIds.length) {
  push('identity ids absent in this tool (uses cl_doi/cl_resid + data-p keys instead): ' + missingSpecIds.join(','));
}

// ---- drill-ins ----
const drillTargets = await page.evaluate(() =>
  [...document.querySelectorAll('.drillcol.sf-open[data-sf], [data-sf]')]
    .map(n => n.dataset.sf).filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 3));

let drillOpened = 0;
for (const sf of drillTargets) {
  try {
    const handle = await page.$('.drillcol.sf-open[data-sf="' + sf + '"]');
    if (!handle) { push('drill-in "' + sf + '": no clickable .drillcol.sf-open handle'); continue; }
    await handle.scrollIntoViewIfNeeded();
    await handle.click({ force: true });
    await page.waitForTimeout(200);
    const opened = await page.evaluate((id) => {
      const n = document.getElementById('sf-' + id);
      return !!n && n.classList.contains('open');
    }, sf);
    if (!opened) { push('drill-in "' + sf + '" did not open (panel #sf-' + sf + ' missing/closed)'); continue; }
    drillOpened++;
    const got = await page.evaluate((id) => {
      const panel = document.getElementById('sf-' + id);
      const fire = (n) => { n.dispatchEvent(new Event('input', { bubbles: true })); n.dispatchEvent(new Event('change', { bubbles: true })); };
      let n2 = 0; const bad = [];
      const addBtn = panel.querySelector('[data-add]');
      if (addBtn && !panel.querySelector('input:not([type=checkbox])')) { addBtn.click(); }
      const ins = [...panel.querySelectorAll('input')]
        .filter(x => x.type !== 'checkbox' && x.offsetParent !== null && String(x.value).trim() === '')
        .slice(0, 4);
      ins.forEach((x, i) => {
        const v = x.classList.contains('n') ? String(5000 + i * 101) : 'DRILL' + i;
        x.value = v; fire(x);
        const back = x.value.replace(/[, ]/g, '');
        if (back === v.replace(/[, ]/g, '')) n2++; else bad.push((x.id || x.dataset.r || 'input') + ' -> "' + x.value + '"');
      });
      const totalInputs = panel.querySelectorAll('input,select').length;
      return { n2, bad, count: ins.length, totalInputs };
    }, sf);
    fieldsFilled += got.n2;
    if (got.count === 0) push('drill-in "' + sf + '" opened but exposed no fillable inputs');
    got.bad.slice(0, 1).forEach(b => push('drill-in "' + sf + '" field rejected input: ' + b));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    const closed = await page.evaluate((id) => {
      const n = document.getElementById('sf-' + id); return !n || !n.classList.contains('open');
    }, sf);
    if (!closed) push('drill-in "' + sf + '" did not close on Escape');
  } catch (e) {
    push('drill-in "' + sf + '" threw: ' + String(e.message).slice(0, 100));
  }
}
if (drillTargets.length === 0) push('no drill-in triggers ([data-sf]) found on page');

// ---- 4. validator ----
const valRes = await page.evaluate(() => {
  const names = ['validateItr6', 'validate', 'validateITR6', 'runValidate'];
  for (const n of names) {
    if (typeof window[n] === 'function') {
      try {
        const r = window[n]();
        return { name: n, ok: r !== null && typeof r === 'object', isArray: Array.isArray(r), json: JSON.stringify(r).slice(0, 4000) };
      } catch (e) { return { name: n, threw: String(e.message).slice(0, 200) }; }
    }
  }
  return { none: true };
});
let validatorRan = false;
if (valRes.none) push('no validator function found (tried validateItr6/validate/validateITR6/runValidate)');
else if (valRes.threw) push('validator ' + valRes.name + '() threw: ' + valRes.threw);
else if (!valRes.ok) push('validator ' + valRes.name + '() did not return an object');
else {
  validatorRan = true;
  try {
    const arr = JSON.parse(valRes.json);
    const errs = (Array.isArray(arr) ? arr : []).filter(x => x && (x.lvl === 'err' || x.lvl === 'warn'));
    errs.slice(0, 5).forEach(e => push('validator[' + e.lvl + '] ' + e.p + ' ' + e.m));
  } catch { /* ignore */ }
}

// ---- 5. builder ----
const bldRes = await page.evaluate(() => {
  const names = ['buildItr6Json', 'buildJSON', 'buildITR', 'buildITR6Json'];
  for (const n of names) {
    if (typeof window[n] === 'function') {
      try {
        const r = window[n]();
        let s = '';
        try { s = JSON.stringify(r); } catch { s = ''; }
        const hasITR = !!(r && typeof r === 'object' && r.ITR && typeof r.ITR === 'object');
        const firstChild = hasITR ? Object.values(r.ITR)[0] : undefined;
        return {
          name: n, ok: true,
          rootOk: hasITR && firstChild !== null && typeof firstChild === 'object',
          keys: r && typeof r === 'object' ? Object.keys(r).slice(0, 5) : [],
          childKey: hasITR ? Object.keys(r.ITR)[0] : null,
          len: s.length,
          hasPan: s.includes('AABCA1234D'),
          hasName: s.includes('ACME MANUFACTURING PRIVATE LIMITED'),
          hasVerifier: s.includes('RAMESH KUMAR'),
        };
      } catch (e) { return { name: n, threw: String(e.message).slice(0, 200) }; }
    }
  }
  return { none: true };
});
let builderRan = false, jsonRootOk = false;
if (bldRes.none) push('no JSON builder found (tried buildItr6Json/buildJSON/buildITR/buildITR6Json)');
else if (bldRes.threw) push('builder ' + bldRes.name + '() threw: ' + bldRes.threw);
else {
  builderRan = true;
  jsonRootOk = !!bldRes.rootOk;
  if (!jsonRootOk) push('built JSON root not {ITR:{<Form>:{...}}} — top keys: ' + JSON.stringify(bldRes.keys));
  if (!(bldRes.hasPan || bldRes.hasName)) push('typed identity not reflected in built JSON');
}

// native button verdict
const specPresent = nativeBtns.spec.filter(b => b.exists);
const nativeButtonsVisibleAtLoad = specPresent.length ? specPresent.every(b => b.visible) : false;
if (!specPresent.length) {
  push('none of #exportJsonBtn/#importAisBtn/#exportBtn exist; tool ships #btnValidate/#btnExport/#btnNext instead (visible at load: '
    + nativeBtns.alt.filter(b => b.exists && b.visible).map(b => '#' + b.id).join(',') + ') — shell CSS hiding those ids would not hide these');
}

// page errors
pageErrors.slice(0, 3).forEach(e => push(e));

const result = {
  form: 'ITR-6',
  ay: '2025-26',
  tool: 'public/tax-utilities/itr6.html',
  loaded, ctlCount, fieldsFilled, validatorRan, builderRan, jsonRootOk,
  nativeButtonsVisibleAtLoad,
  detail: { nativeBtns, drillTargets, drillOpened, valRes: { name: valRes.name, threw: valRes.threw, none: valRes.none }, bldRes },
  issues,
};
console.log('###RESULT###');
console.log(JSON.stringify(result, null, 2));

await browser.close();
