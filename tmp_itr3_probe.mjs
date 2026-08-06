import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:7777/tax-utilities/itr3.html';
const b = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
const p = await b.newPage();
const errs = [];       // true JS exceptions (the assertion target)
const con = [];        // console errors incl 404s (informational)
p.on('pageerror', e => errs.push(String(e && e.message || e)));
p.on('console', m => { if (m.type() === 'error') con.push(m.text()); });
await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(1500);
const out = await p.evaluate(() => {
  const r = { hasBuild: typeof window.buildItr3Json, hasValidate: typeof (window.validateItr3||validateItr3) };
  try { const j = window.buildItr3Json(); r.ok = !!(j&&j.ITR&&j.ITR.ITR3); r.topKeys = Object.keys(j.ITR.ITR3); }
  catch(e){ r.buildErr = String(e&&e.message||e); }
  try { const v = (window.validateItr3||validateItr3)(); r.errCount=v.errors.length; r.warnCount=v.warnings.length; r.sampleErr=v.errors.slice(0,8); }
  catch(e){ r.valErr = String(e&&e.message||e); }
  return r;
});
console.log('PAGEERRORS=' + errs.length + ' CONSOLE404=' + con.length);
if (errs.length) console.log('JS_EXCEPTIONS=' + JSON.stringify(errs.slice(0,20), null, 1));
console.log(JSON.stringify(out, null, 1));
await b.close();
