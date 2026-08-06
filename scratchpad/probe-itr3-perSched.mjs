import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch({ channel: 'msedge' });

function reqLeaves(treeFile){
  const set=new Set();
  for(const line of fs.readFileSync(treeFile,'utf8').split(/\r?\n/)){
    const m=line.split('|'); if(m.length<3) continue;
    const path=m[m.length-1].trim();       // path is always the LAST column
    if(!path.startsWith('ITR3.')) continue;
    if(m[0].trim()==='R'){ set.add(path); }
  }
  return [...set];
}
function flatten(o,prefix,out){ if(o==null) return;
  if(Array.isArray(o)){ o.forEach(v=>flatten(v,prefix+'[]',out)); return; }
  if(typeof o==='object'){ for(const k of Object.keys(o)) flatten(o[k],prefix?prefix+'.'+k:k,out); return; }
  out.add(prefix); }
function containers(o,prefix,out){ if(o==null||typeof o!=='object') return;
  if(prefix) out.add(prefix);
  if(Array.isArray(o)){ o.forEach(v=>containers(v,prefix+'[]',out)); return; }
  for(const k of Object.keys(o)) containers(o[k],prefix?prefix+'.'+k:k,out); }

const SEED=fs.readFileSync('itr-sim/probe-itr3-sweep.mjs','utf8');
const SEED_PAGE=SEED.match(/const SEED=`([\s\S]*?)`;/)[1];
const SEED_IFRAME=SEED.match(/const SEED_IFRAME=`([\s\S]*?)`;/)[1];

async function check(tool,tree){
  const p = await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://localhost:7777/tax-utilities/${tool}.html`,{waitUntil:'load',timeout:45000});
  await p.waitForTimeout(800);
  await p.evaluate(SEED_PAGE);
  await p.evaluate(()=>{ document.querySelector('[data-tab="comp"]')?.click(); });
  await p.waitForTimeout(1000);
  await p.evaluate(SEED_IFRAME);
  await p.evaluate(()=>{
    const doc=document.getElementById('calcFrame')?.contentWindow?.document; if(!doc) return;
    const set=(id,v)=>{let e=doc.getElementById(id); if(!e){e=doc.createElement('span');e.id=id;doc.body.appendChild(e);} e.textContent=String(v);};
    set('it_sal_total',1050000);set('it_bp_income',1500000);set('it_cg_112a',400000);set('it_cg_ltcg1',2000000);set('it_cg_stcg1',500000);
    set('it_os_interest',50000);set('it_80_total',200000);set('it_totalIncome',5000000);set('it_taxOnTI',1200000);set('it_balancePayable',100000);
    set('it_80_ccccd',150000);set('it_80_d',25000);set('it_80_dd',75000);set('it_80_ddb',40000);set('it_80_e',30000);
    set('d80g_total',70000);set('d80gga_ded',30000);set('d80ggc_ded',25000);set('d80u_ded',75000);set('d80tta_ttb_ded',10000);
    const r=doc.getElementById('it_regime'); if(r) r.value='Old';
    window.__taxBreakup={surcharge:50000,cess:48000,rebate87A:0,taxBeforeSC:1200000,cgSpecialTax:250000,reliefTotal:30000};
  });
  await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{ try{ const j=window.buildItr3Json(); return {ok:true,json:j.ITR.ITR3}; }catch(e){ return {ok:false,err:e.message}; } });
  await p.close();
  if(!out.ok) return {tool,pageErrors:errs.length,build:false,err:out.err};
  const leaves=new Set(); flatten(out.json,'ITR3',leaves);
  const conts=new Set(); containers(out.json,'ITR3',conts);
  const req=reqLeaves(tree);
  const bySched={};
  for(const r of req){ const s=r.split('.')[1];
    bySched[s]=bySched[s]||{req:0,present:0,miss:[]};
    bySched[s].req++;
    if(leaves.has(r)) bySched[s].present++; else bySched[s].miss.push(r); }
  const report={};
  for(const s of Object.keys(bySched)){ const d=bySched[s];
    const nodePresent=conts.has('ITR3.'+s);
    report[s]={req:d.req,present:d.present,miss:d.req-d.present,nodePresent,sampleMiss:d.miss.slice(0,6)}; }
  return {tool,pageErrors:errs.length,build:true,totalReq:req.length,totalPresent:req.filter(r=>leaves.has(r)).length,report};
}
const r26=await check('itr3','docs/itr-schema-conformance/real/trees/tree-ITR3-2026.txt');
await b.close();
console.log(JSON.stringify(r26,null,1));
