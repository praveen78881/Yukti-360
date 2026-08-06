// Verify the ITR-1 Part B-TTI emitter fix: load the live tool, enter a salary that
// crosses the rebate ceiling (so cess + tax are non-zero), compute, and read back
// buildItr1Json().ITR.ITR1.ITR1_TaxComputation + TaxPaid.
import { chromium } from 'playwright';
const url = 'http://localhost:7777/tax-utilities/itr1.html';
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage();
p.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));
await p.goto(url, { waitUntil: 'load' });
await p.waitForTimeout(400);

// Identity + open computation, then drive a salary via the calc frame's own input.
await p.evaluate(() => {
  for (const [id, v] of [['cl_name', 'PROBE ONE'], ['cl_pan', 'ABCDE1234F'], ['cl_dob', '01/01/1985']]) {
    const e = document.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }
  }
  document.querySelector('[data-tab="comp"]')?.click();
});
await p.waitForTimeout(800);

// Set gross salary inside the calc frame and recompute.
const set = await p.evaluate(() => {
  const f = document.getElementById('calcFrame'); const w = f && f.contentWindow; const d = w && w.document;
  if (!d) return 'no calc frame';
  const cand = ['it_sal_income', 'os_fp_amount'];
  let hit = 'none';
  for (const id of cand) { const el = d.getElementById(id); if (el && 'value' in el) { el.value = '1500000'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); hit = id; break; } }
  try { w.computeAll && w.computeAll(); } catch (e) { return 'computeAll threw: ' + e.message; }
  return 'set via ' + hit;
});
console.log('set:', set);
await p.waitForTimeout(500);

const out = await p.evaluate(() => {
  try {
    const j = window.buildItr1Json();
    const c = j.ITR.ITR1.ITR1_TaxComputation;
    const t = j.ITR.ITR1.TaxPaid;
    const bk = (function () { const f = document.getElementById('calcFrame'); return f && f.contentWindow && f.contentWindow.__taxBreakup; })();
    return { ok: true, taxComp: c, taxPaid: t, breakup: bk };
  } catch (e) { return { ok: false, error: e.message }; }
});
console.log(JSON.stringify(out, null, 2));
await b.close();
