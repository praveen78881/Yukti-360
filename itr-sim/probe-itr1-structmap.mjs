// STRUCTURE-MAP VERIFICATION PROBE (read-only): opens itr1.html, walks every
// drill-in, flips conditional toggles, reads computed cells. No file changes.
import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:7777/tax-utilities/itr1.html';
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto(url, { waitUntil: 'load' });
await p.waitForTimeout(600);

const out = {};

// ---------- OUTER: Data Entry tab ----------
out.outer = await p.evaluate(() => {
  const r = {};
  r.tabs = [...document.querySelectorAll('.tabbar .tab')].map(t => t.textContent.trim());
  r.toolbtns = [...document.querySelectorAll('.tabbar .toolbtn')].map(t => t.textContent.trim());
  // particulars visible in info pane
  r.particulars = [...document.querySelectorAll('#pane-info .itr .lbl, #pane-info .itfull .lbl')].map(e => e.textContent.trim());
  // conditional rows hidden by default?
  r.rowUnlistedHidden = document.getElementById('row-unlisted').style.display === 'none';
  r.rowDirectorshipHidden = document.getElementById('row-directorship').style.display === 'none';
  r.faWrapHidden = document.getElementById('fa-wrap').style.display === 'none';
  return r;
});

// flip toggles
out.toggles = await p.evaluate(() => {
  const click = sel => document.querySelector(sel)?.click();
  click('.yn-tabs[data-fld="unlisted"] button[data-v="yes"]');
  click('.yn-tabs[data-fld="director"] button[data-v="yes"]');
  const fa = document.getElementById('f_hasFA'); fa.checked = true; fa.dispatchEvent(new Event('change', { bubbles: true }));
  return {
    unlistedNow: document.getElementById('row-unlisted').style.display,
    directorNow: document.getElementById('row-directorship').style.display,
    faNow: document.getElementById('fa-wrap').style.display,
  };
});

// open every outer drill-in
out.outerDrills = await p.evaluate(async () => {
  const res = {};
  const drills = [...document.querySelectorAll('#pane-info .sf-open')];
  for (const d of drills) {
    const sf = d.dataset.sf;
    d.click();
    await new Promise(r => setTimeout(r, 30));
    const el = document.getElementById(sf);
    res[sf] = el ? el.classList.contains('open') : 'MISSING';
    document.querySelectorAll('.subform.open [data-close]').forEach(b => b.click());
    await new Promise(r => setTimeout(r, 10));
  }
  return res;
});

// otherforms variant + esop sold toggle
out.variants = await p.evaluate(async () => {
  const r = {};
  document.querySelector('[data-sf="sf-otherforms"]').click();
  const sel = document.getElementById('ofr_optearlier');
  sel.value = 'No'; sel.dispatchEvent(new Event('change', { bubbles: true }));
  r.ofrNo = document.getElementById('ofr_variant').textContent.includes('Date of upload');
  sel.value = 'Yes'; sel.dispatchEvent(new Event('change', { bubbles: true }));
  r.ofrYes = document.getElementById('ofr_variant').textContent.includes('AY in which opted out');
  document.querySelectorAll('.subform.open [data-close]').forEach(b => b.click());
  document.querySelector('[data-sf="sf-esop"]').click();
  const chk = document.getElementById('esop_sold_chk'); chk.checked = true; chk.dispatchEvent(new Event('change', { bubbles: true }));
  if (typeof toggleEsopSold === 'function') toggleEsopSold();
  r.esopSoldShown = document.getElementById('esop_sold_wrap').style.display !== 'none';
  r.esopYears = [...document.querySelectorAll('#esop-rows td.l')].map(t => t.textContent.trim());
  document.querySelectorAll('.subform.open [data-close]').forEach(b => b.click());
  return r;
});

// ---------- INNER: computation frame ----------
await p.evaluate(() => document.querySelector('[data-tab="comp"]')?.click());
await p.waitForTimeout(900);

out.calc = await p.evaluate(async () => {
  const f = document.getElementById('calcFrame'); const w = f.contentWindow; const d = w.document;
  const r = {};
  const vis = el => { let e = el; while (e && e !== d.body) { if (getComputedStyle(e).display === 'none') return false; e = e.parentElement; } return true; };
  // visible heads
  r.heads = [...d.querySelectorAll('.it-head')].filter(vis).map(h => h.textContent.trim());
  r.bpHidden = d.getElementById('g-bp')?.style.display === 'none';
  // visible drill particulars in sheet
  r.visibleDrillRows = [...d.querySelectorAll('#sheet-itcomp .itr')].filter(row => vis(row) && row.querySelector('.sf-open'))
    .map(row => ({ lbl: row.querySelector('.lbl')?.textContent.trim(), sf: row.querySelector('.sf-open')?.dataset.sf }));
  // open each unique visible sf + the salary/property inner drills
  const uniq = [...new Set(r.visibleDrillRows.map(x => x.sf))];
  r.drillOpen = {};
  for (const sf of uniq) {
    d.querySelector(`.sf-open[data-sf="${sf}"]`)?.click();
    await new Promise(rs => setTimeout(rs, 30));
    r.drillOpen[sf] = d.getElementById(sf)?.classList.contains('open') || false;
    d.querySelectorAll('.subform.open [data-close]').forEach(b => b.click());
    await new Promise(rs => setTimeout(rs, 10));
  }
  // employer block drills
  d.querySelector('.it-head[data-grp="g-sal"]')?.click(); // expand
  await new Promise(rs => setTimeout(rs, 30));
  r.empDrills = [...d.querySelectorAll('#emp-blocks .sf-open')].map(e => e.dataset.sf);
  // HP: default SOP rows, then switch to let-out
  d.querySelector('.it-head[data-grp="g-hp"]')?.click();
  await new Promise(rs => setTimeout(rs, 30));
  r.hpSopRows = [...d.querySelectorAll('#hp-blocks .itr .lbl')].map(e => e.textContent.trim());
  d.querySelector('#hp-blocks .hp-typetabs button[data-type="let-out"]')?.click();
  await new Promise(rs => setTimeout(rs, 50));
  r.hpLetOutRows = [...d.querySelectorAll('#hp-blocks .itr .lbl')].map(e => e.textContent.trim());
  return r;
});

// conditional + computed checks inside calc
out.calcCond = await p.evaluate(async () => {
  const f = document.getElementById('calcFrame'); const w = f.contentWindow; const d = w.document;
  const r = {};
  const fire = (el) => { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  // family pension std deduction (new regime => 25000)
  d.querySelector('.sf-open[data-sf="sf-os-fpension"]')?.click();
  const fp = d.getElementById('os_fp_amount'); fp.value = '120000'; fire(fp);
  await new Promise(rs => setTimeout(rs, 50));
  r.fpStdDedNew = d.getElementById('os_fp_stdDed').textContent;
  r.fpTaxable = d.getElementById('os_fp_taxable').textContent;
  d.querySelectorAll('.subform.open [data-close]').forEach(b => b.click());
  // 112A 54F conditional
  d.querySelector('.sf-open[data-sf="sf-ltcg112a"]')?.click();
  const c54 = d.getElementById('ltcg112a_claim54F'); c54.checked = true; fire(c54);
  await new Promise(rs => setTimeout(rs, 50));
  r.block54Fshown = d.getElementById('sf-ltcg112a-54F').style.display !== 'none';
  d.querySelectorAll('.subform.open [data-close]').forEach(b => b.click());
  // filing conditional sections
  d.querySelector('.sf-open[data-sf="sf-filing"]')?.click();
  const fs = d.getElementById('filing_section');
  fs.value = '139(5)'; fire(fs); await new Promise(rs => setTimeout(rs, 50));
  r.revisedShown = d.getElementById('filing_revised_section').style.display !== 'none';
  fs.value = '148'; fire(fs); await new Promise(rs => setTimeout(rs, 50));
  r.noticeShown = d.getElementById('filing_notice_section').style.display !== 'none';
  fs.value = '139(8A)'; fire(fs); await new Promise(rs => setTimeout(rs, 50));
  r.updatedShown = d.getElementById('filing_updated_section').style.display !== 'none';
  fs.value = '139(1)'; fire(fs);
  d.querySelectorAll('.subform.open [data-close]').forEach(b => b.click());
  // rel90 form67 columns
  d.querySelector('.sf-open[data-sf="sf-rel90"]')?.click();
  await new Promise(rs => setTimeout(rs, 50));
  const baseCols = d.querySelectorAll('#rel90-head th').length;
  const f67 = d.getElementById('rel90_form67'); f67.checked = true; fire(f67);
  if (w.bpData) { w.bpData.relief.rel90.form67 = true; }
  if (typeof w.renderRel90Header === 'function') w.renderRel90Header();
  await new Promise(rs => setTimeout(rs, 50));
  r.rel90Cols = { base: baseCols, form67: d.querySelectorAll('#rel90-head th').length };
  d.querySelectorAll('.subform.open [data-close]').forEach(b => b.click());
  // special-rate section rows auto-populate
  d.querySelector('.sf-open[data-sf="sf-os-special"]')?.click();
  await new Promise(rs => setTimeout(rs, 60));
  r.specialRows = [...d.querySelectorAll('#os-special-rows td.l')].map(t => t.textContent.trim());
  d.querySelectorAll('.subform.open [data-close]').forEach(b => b.click());
  // regime toggle exists
  r.regimeOptions = [...d.getElementById('it_regime').options].map(o => o.textContent);
  return r;
});

out.pageErrors = errs;
console.log(JSON.stringify(out, null, 2));
await b.close();
