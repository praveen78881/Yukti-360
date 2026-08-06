import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const AY = process.argv[2] || '2026';
const file = path.resolve(AY==='2025' ? 'public/tax-utilities/itr3-2025-26.html' : 'public/tax-utilities/itr3.html');
const treeFile = path.resolve(AY==='2025' ? 'docs/itr-schema-conformance/real/trees/tree-ITR3-2025.txt' : 'docs/itr-schema-conformance/real/trees/tree-ITR3-2026.txt');
const url = pathToFileURL(file).href;

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERR: ' + e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(800);

// wait for calc iframe + seed depit + UD data so real values flow
await page.waitForFunction(() => { const f=document.getElementById('calcFrame'); return f && f.contentWindow && f.contentWindow.bpData && f.contentWindow.bpData.depit; }, {timeout:8000}).catch(()=>{});
await page.evaluate(() => {
  const w=document.getElementById('calcFrame').contentWindow;
  if(w&&w.bpData&&w.bpData.depit){ const b=w.bpData.depit.blocks;
    ['pm15','b10','furn10','intang25','ships20'].forEach(k=>{ if(b[k]){ b[k].opening='1000000'; b[k].addH1='200000'; b[k].addH2='100000'; b[k].deletions='50000'; } });
    if(w.bpData.depit.addlDep.pm15){ w.bpData.depit.addlDep.pm15.addH1='200000'; }
    w.bpData.depit.land.opening='500000';
  }
  if(w&&w.bpData){ w.bpData.lossCFL=w.bpData.lossCFL||{}; w.bpData.lossCFL.ud=[{ay:'2022-23',bfDep:'300000',soDep:'100000',bfAllow:'50000',soAllow:'20000'},{ay:'2023-24',bfDep:'150000',soDep:'0',bfAllow:'0',soAllow:'0'}]; }
});
const json = await page.evaluate(() => { try { return window.buildItr3Json(); } catch(e){ return {__err:String(e)}; } });
console.log('pageErrors=', errs.length);
if (errs.length) console.log(errs.slice(0,5).join('\n'));
if (json && json.__err) console.log('BUILD ERR:', json.__err);

// flatten present paths
const present = new Set();
function walk(o, pre){
  if (o===null||o===undefined) return;
  if (Array.isArray(o)){ o.forEach(v=>walk(v, pre+'[]')); return; }
  if (typeof o==='object'){ for(const k of Object.keys(o)) walk(o[k], pre?pre+'.'+k:k); return; }
  present.add(pre);
}
walk(json, '');

// required paths from tree
const lines = fs.readFileSync(treeFile,'utf8').split(/\r?\n/);
const req = [];
for (const ln of lines){
  const m = ln.match(/^R\s*\|[^|]*\|\s*(ITR3\..+)$/);
  if (m) req.push(m[1].trim());
}
// normalize present with ITR3. prefix (json root is ITR.ITR3...)
function norm(p){ return p.replace(/^ITR\./,'').replace(/\[\]\.?/g,'[].').replace(/\.$/,''); }
const presentNorm = new Set([...present].map(p=>p.replace(/^ITR\./,'')));
// build a set with []-collapsed
const collapsed = new Set();
for (const p of presentNorm){ collapsed.add(p.replace(/\[\d+\]/g,'[]')); }

let hit=0, miss=[];
for (const r of req){
  const rc = r.replace(/\[\d+\]/g,'[]');
  if (collapsed.has(rc)) hit++; else miss.push(r);
}
console.log(`AY${AY} required-present: ${hit}/${req.length}  MISS=${miss.length}`);
const area = process.argv[3];
if (area){
  const am = miss.filter(m=>m.includes(area));
  console.log(`MISS in ${area} (${am.length}):`);
  am.forEach(m=>console.log('  '+m));
}
await browser.close();
