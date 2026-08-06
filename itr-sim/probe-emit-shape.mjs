// Dump the ACTUAL emitted top-level schedule shape of ITR-2 & ITR-3 (buildItr2Json/
// buildItr3Json) so we can diff against the official schema schedules. Minimal data →
// reveals the baseline (always-emitted) structure.
import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'msedge' });

async function shape(form, buildFn) {
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:7777/tax-utilities/${form}.html`, { waitUntil: 'load' });
  await p.waitForTimeout(500);
  await p.evaluate(() => {
    for (const [id, v] of [['cl_name', 'PROBE'], ['cl_pan', 'ABCDE1234F'], ['cl_dob', '01/01/1985']]) {
      const e = document.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    document.querySelector('[data-tab="comp"]')?.click();
  });
  await p.waitForTimeout(600);
  const out = await p.evaluate((fn) => {
    try {
      const j = window[fn] && window[fn]();
      if (!j || !j.ITR) return { ok: false, err: fn + ' returned no ITR' };
      const form = Object.keys(j.ITR)[0];
      const node = j.ITR[form];
      const countLeaves = (o) => { let n = 0; for (const k in o) { const v = o[k]; if (v && typeof v === 'object') n += Array.isArray(v) ? (v.length ? v.reduce((a, x) => a + (x && typeof x === 'object' ? countLeaves(x) : 1), 0) : 0) : countLeaves(v); else n += 1; } return n; };
      const sched = {};
      for (const k of Object.keys(node)) { const v = node[k]; sched[k] = (v && typeof v === 'object') ? countLeaves(v) : 1; }
      return { ok: true, form, schedules: Object.keys(node).length, sched };
    } catch (e) { return { ok: false, err: e.message }; }
  }, buildFn);
  out.pageErrors = errs.slice(0, 3);
  await p.close();
  return out;
}

const r2 = await shape('itr2', 'buildItr2Json');
const r3 = await shape('itr3', 'buildItr3Json');
console.log('ITR2', JSON.stringify(r2, null, 1));
console.log('ITR3', JSON.stringify(r3, null, 1));
await b.close();
