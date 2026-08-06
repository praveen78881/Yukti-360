// Dump each ITR tool's ACTUAL emitted leaf-paths (flattened, dot notation under
// the form root) with a Z flag for zero/empty values. Writes one file per tool to
// docs/itr-schema-conformance/real/emitted/<tool>.txt. Feeds the conformance diff.
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = 'docs/itr-schema-conformance/real/emitted';
fs.mkdirSync(OUT, { recursive: true });

const TOOLS = [
  { tool: 'itr1', build: ['buildItr1Json'] },
  { tool: 'itr1-2025-26', build: ['buildItr1Json'] },
  { tool: 'itr2', build: ['buildItr2Json'] },
  { tool: 'itr2-2025-26', build: ['buildItr2Json'] },
  { tool: 'itr3', build: ['buildItr3Json'] },
  { tool: 'itr3-2025-26', build: ['buildItr3Json'] },
  { tool: 'itr4', build: ['buildItr4Json'] },
  { tool: 'itr4-2025-26', build: ['buildItr4Json'] },
  { tool: 'itr5', build: ['buildITR', 'buildItr5Json'] },
  { tool: 'itr6', build: ['buildJSON', 'buildItr6Json'] },
  { tool: 'itr6-ay2526-backup', build: ['emitJSON', 'buildJSON'] },
  { tool: 'itr7', build: ['buildITR7Json', 'buildItr7Json', 'exportJson'] },
];

const b = await chromium.launch({ channel: 'msedge' });
const summary = [];
for (const t of TOOLS) {
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  let res;
  try {
    await p.goto(`http://localhost:7777/tax-utilities/${t.tool}.html`, { waitUntil: 'load', timeout: 30000 });
    await p.waitForTimeout(500);
    await p.evaluate(() => {
      for (const [id, v] of [['cl_name', 'PROBE'], ['cl_pan', 'ABCDE1234F'], ['cl_dob', '01/01/1985']]) {
        const e = document.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }
      }
      document.querySelector('[data-tab="comp"]')?.click();
      document.querySelector('[data-pane]')?.click?.();
    });
    await p.waitForTimeout(700);
    res = await p.evaluate((builds) => {
      let fn = builds.find((n) => typeof window[n] === 'function');
      if (!fn) return { ok: false, err: 'no builder among ' + builds.join('/') };
      let j; try { j = window[fn](); } catch (e) { return { ok: false, err: fn + ' threw: ' + e.message }; }
      if (!j || !j.ITR) return { ok: false, err: fn + ' returned no ITR' };
      const form = Object.keys(j.ITR)[0];
      const root = j.ITR[form];
      const lines = [];
      const isZero = (v) => v === 0 || v === '' || v === null || v === undefined || (Array.isArray(v) && v.length === 0);
      const walk = (o, path) => {
        if (Array.isArray(o)) { if (!o.length) { lines.push('Z ' + path + '[]'); return; } o.forEach((x) => (x && typeof x === 'object') ? walk(x, path + '[]') : lines.push((isZero(x) ? 'Z ' : '  ') + path + '[]')); return; }
        if (o && typeof o === 'object') { for (const k of Object.keys(o)) walk(o[k], path ? path + '.' + k : k); return; }
        lines.push((isZero(o) ? 'Z ' : '  ') + path);
      };
      walk(root, form);
      return { ok: true, fn, form, count: lines.length, lines };
    }, t.build);
  } catch (e) { res = { ok: false, err: e.message }; }
  res = res || { ok: false, err: 'unknown' };
  res.pageErrors = errs.slice(0, 2);
  const body = res.ok
    ? `# ${t.tool} — emitted by ${res.fn} → ITR.${res.form}  (${res.count} leaf-paths; Z=zero/empty)\n` + res.lines.join('\n')
    : `# ${t.tool} — EMIT FAILED: ${res.err}\npageErrors: ${res.pageErrors.join(' | ')}`;
  fs.writeFileSync(`${OUT}/${t.tool}.txt`, body);
  summary.push(`${t.tool.padEnd(20)} ${res.ok ? res.fn + ' → ' + res.count + ' paths' + (res.pageErrors.length ? '  [pageErr]' : '') : 'FAIL: ' + res.err}`);
  await p.close();
}
await b.close();
console.log(summary.join('\n'));
