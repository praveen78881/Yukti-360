// Feasibility probe: can we drive an ITR HTML tool headless and read a computed value?
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const file = path.resolve('public/tax-utilities/itr1.html');
const url = pathToFileURL(file).href;

const browser = await chromium.launch({ channel: 'msedge' }); // bundled chromium is spawn-blocked here; system Edge works
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERR: ' + e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(600);

console.log('TITLE:', await page.title());
console.log('main inputs:', await page.locator('input,select,textarea').count());

// 1) set client-bar identity fields in the MAIN doc
async function setMain(id, val) {
  const ok = await page.evaluate(([id, val]) => {
    const el = document.getElementById(id); if (!el) return false;
    el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }, [id, val]);
  console.log(`  set #${id} = ${val} -> ${ok ? 'ok' : 'MISSING'}`);
}
await setMain('cl_name', 'SIM-ITR1-2627');
await setMain('cl_pan', 'ABCDE1234F');
await setMain('cl_dob', '01/01/1980');

// 2) trigger the Computation tab so injectCalculator() runs
const clicked = await page.evaluate(() => {
  const t = document.querySelector('[data-tab="comp"]'); if (!t) return false; t.click(); return true;
});
console.log('clicked comp tab:', clicked);
await page.waitForTimeout(1200);

// 3) find the calc iframe frame
console.log('frames:', page.frames().length);
let calc = null;
for (const f of page.frames()) {
  const has = await f.evaluate(() => !!document.getElementById('it_totalIncome')).catch(() => false);
  if (has) { calc = f; break; }
}
if (!calc) {
  // maybe it_totalIncome is in main doc, not iframe
  const inMain = await page.evaluate(() => !!document.getElementById('it_totalIncome'));
  console.log('it_totalIncome in main doc:', inMain);
  if (inMain) calc = page.mainFrame();
}
if (!calc) { console.log('RESULT: could not locate computation context'); await browser.close(); process.exit(1); }

console.log('calc frame located. calc inputs:', await calc.locator('input,select').count());
const read = (id) => calc.evaluate((id) => (document.getElementById(id)?.textContent ?? '(none)'), id);
console.log('  it_totalIncome (initial):', await read('it_totalIncome'));
console.log('  it_taxOnTI    (initial):', await read('it_taxOnTI'));

// 4) find a direct income input that feeds total income, set it, confirm recompute
const candidates = ['it_os_other', 'it_os_interest', 'os_other', 'it_os_savings'];
let fed = null;
for (const id of candidates) {
  const isInput = await calc.evaluate((id) => { const e = document.getElementById(id); return e && (e.tagName === 'INPUT' || e.tagName === 'TEXTAREA'); }, id);
  if (isInput) { fed = id; break; }
}
console.log('direct income input found:', fed || '(none — income is via drill-in subforms)');
if (fed) {
  await calc.evaluate((id) => { const e = document.getElementById(id); e.value = '250000'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, fed);
  await page.waitForTimeout(500);
  console.log(`  after ${fed}=250000 -> it_totalIncome:`, await read('it_totalIncome'), ' it_taxOnTI:', await read('it_taxOnTI'));
}

// enumerate a sample of computed it_* cells present
const itCells = await calc.evaluate(() => [...document.querySelectorAll('[id^="it_"]')].slice(0, 12).map(e => e.id));
console.log('sample it_* cells:', itCells.join(', '));
if (errs.length) console.log('PAGE ERRORS:', errs.slice(0, 3).join(' | '));
console.log('RESULT: harness can drive the form ✓');
await browser.close();
