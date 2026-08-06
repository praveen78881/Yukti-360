// Probe the ITR-6 AY2025-26 backup (itr6-ay2526-backup.html): is emitJSON reachable,
// and what leaf-paths does it currently emit? Writes emitted/itr6-ay2526-backup.txt.
import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = 'docs/itr-schema-conformance/real/emitted';
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:7777/tax-utilities/itr6-ay2526-backup.html', { waitUntil: 'load', timeout: 40000 });
await p.waitForTimeout(1200);
const res = await p.evaluate(() => {
  const cand = ['emitJSON', 'buildJSON', 'buildItr6Json'];
  const fn = cand.find((n) => typeof window[n] === 'function');
  const globals = cand.filter((n) => typeof window[n] === 'function');
  if (!fn) return { ok: false, err: 'no emitter global; found none of ' + cand.join('/'), globals };
  let j; try { j = window[fn](); } catch (e) { return { ok: false, err: fn + ' threw: ' + e.message, globals }; }
  if (!j || !j.ITR) return { ok: false, err: fn + ' returned no ITR (keys: ' + Object.keys(j || {}).join(',') + ')', globals };
  const form = Object.keys(j.ITR)[0];
  const root = j.ITR[form];
  const lines = [];
  const isZero = (v) => v === 0 || v === '' || v == null || (Array.isArray(v) && !v.length);
  const walk = (o, path) => {
    if (Array.isArray(o)) { if (!o.length) { lines.push('Z ' + path + '[]'); return; } o.forEach((x) => (x && typeof x === 'object') ? walk(x, path + '[]') : lines.push((isZero(x) ? 'Z ' : '  ') + path + '[]')); return; }
    if (o && typeof o === 'object') { for (const k of Object.keys(o)) walk(o[k], path ? path + '.' + k : k); return; }
    lines.push((isZero(o) ? 'Z ' : '  ') + path);
  };
  walk(root, form);
  const scheds = Object.keys(root);
  return { ok: true, fn, form, count: lines.length, schedCount: scheds.length, scheds, lines };
});
res.pageErrors = errs.slice(0, 3);
if (res.ok) {
  fs.writeFileSync(`${OUT}/itr6-ay2526-backup.txt`, `# itr6-ay2526-backup emitted by ${res.fn} -> ITR.${res.form} (${res.count} leaf-paths; Z=zero)\n` + res.lines.join('\n'));
}
console.log(JSON.stringify({ ok: res.ok, fn: res.fn, form: res.form, leafPaths: res.count, schedCount: res.schedCount, scheds: res.scheds, err: res.err, globals: res.globals, pageErrors: res.pageErrors }, null, 1));
await b.close();
