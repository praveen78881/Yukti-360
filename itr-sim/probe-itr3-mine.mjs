import { chromium } from 'playwright';
import fs from 'fs';

const b = await chromium.launch({ channel: 'msedge' });
const norm = s => s.replace(/\[\]/g,'');

function reqLeaves(treeFile){
  const set=new Set();
  for(const line of fs.readFileSync(treeFile,'utf8').split(/\r?\n/)){
    const m=line.split('|');
    if(m.length<3) continue;
    if(m[0].trim()==='R'){ set.add(norm(m[2].trim())); }
  }
  return [...set];
}
function flatten(o,prefix,out){
  if(o===null||o===undefined) return;
  if(Array.isArray(o)){ o.forEach(v=>flatten(v,prefix,out)); return; }
  if(typeof o==='object'){ for(const k of Object.keys(o)) flatten(o[k],prefix?prefix+'.'+k:k,out); return; }
  out.add(prefix);
}
function containers(o,prefix,out){
  if(o===null||o===undefined||typeof o!=='object') return;
  if(prefix) out.add(prefix);
  if(Array.isArray(o)){ o.forEach(v=>containers(v,prefix,out)); return; }
  for(const k of Object.keys(o)) containers(o[k],prefix?prefix+'.'+k:k,out);
}

const SEED=fs.readFileSync('itr-sim/probe-itr3-sweep.mjs','utf8').match(/const SEED=`([\s\S]*?)`;/)[1];
const SEED_IFRAME=fs.readFileSync('itr-sim/probe-itr3-sweep.mjs','utf8').match(/const SEED_IFRAME=`([\s\S]*?)`;/)[1];

async function check(tool,tree){
  const p = await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://localhost:7777/tax-utilities/${tool}.html`,{waitUntil:'load',timeout:45000});
  await p.waitForTimeout(800);
  await p.evaluate(SEED);
  await p.evaluate(()=>{ window.data.cg=window.data.cg||{}; window.data.cg.vda=[{dop:'01/05/2024',dos:'01/02/2025',cost:'100000',cons:'150000'}]; });
  await p.evaluate(()=>{ document.querySelector('[data-tab="comp"]')?.click(); });
  await p.waitForTimeout(1000);
  await p.evaluate(SEED_IFRAME);
  await p.evaluate(()=>{ const w=document.getElementById('calcFrame')?.contentWindow; if(!w||!w.bpData) return;
    w.bpData.advTax={rows:[{bankName:'HDFC',bsr:'0510308',dateDeposit:'15/06/2025',challanSlNo:'01234',amount:'50000'}]};
    w.bpData.sat={rows:[{bankName:'SBI',bsr:'0004329',dateDeposit:'20/07/2026',challanSlNo:'00567',amountPaid:'30000',incomeTax:'28000',interestFee:'2000'}]};
    w.bpData.tdsTcs=w.bpData.tdsTcs||{}; w.bpData.tdsTcs.tcs=[{collectorName:'Auto Dealer',tan:'BLRA01234C',tcsCollected:'12000',tcsClaimedCY:'12000',balanceCF:'0'}];
    w.bpData.tdsTcs.salaryTds=[{employerName:'TCS LTD',tan:'BLRT11111T',tdsDeducted:'80000',tdsClaimed:'80000',grossSalary:'1200000'}];
    w.bpData.tdsTcs.form16A=[{deductorName:'HDFC Bank',tan:'MUMH22222H',tdsDeducted:'5000',tdsClaimedCY:'5000',balanceCF:'0',grossReceipts:'50000',grossReceiptOffered:'50000',headOfIncome:'Other Sources',section:'194A'}];
    w.bpData.tdsTcs.form16BCDE=[{deductorName:'Buyer',pan:'AAAPB1234B',tdsDeducted:'20000',tdsClaimedCY:'20000',balanceCF:'0',grossReceipts:'2000000',grossReceiptOffered:'2000000',headOfIncome:'Capital Gains',section:'194IA'}];
  });
  await p.evaluate(()=>{
    const doc=document.getElementById('calcFrame')?.contentWindow?.document; if(!doc) return;
    const set=(id,v)=>{let e=doc.getElementById(id); if(!e){e=doc.createElement('span');e.id=id;doc.body.appendChild(e);} e.textContent=String(v);};
    set('it_sal_total',1050000);set('it_hp_income',0);set('it_bp_income',1500000);
    set('it_cg_112a',400000);set('it_cg_ltcg1',2000000);set('it_cg_stcg1',500000);
    set('it_os_interest',50000);set('it_80_total',200000);set('it_totalIncome',5000000);
    set('it_taxOnTI',1200000);set('it_balancePayable',100000);
    set('it_80_ccccd',150000);set('it_80_d',25000);set('it_80_dd',75000);set('it_80_ddb',40000);set('it_80_e',30000);
    set('d80g_total',70000);set('d80gga_ded',30000);set('d80ggc_ded',25000);set('d80gg_ded',0);
    set('d80u_ded',75000);set('d80tta_ttb_ded',10000);
    set('d80ee_ded',0);set('d80eea_ded',0);set('d80eeb_ded',0);set('d80ia_total',0);set('d80ib_total',0);set('d80ie_total',0);
    window.__taxBreakup={surcharge:50000,cess:48000,rebate87A:0,taxBeforeSC:1200000,cgSpecialTax:250000,reliefTotal:30000};
  });
  await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{
    try{ const j=window.buildItr3Json(); return {ok:!!(j&&j.ITR&&j.ITR.ITR3), json:j.ITR.ITR3}; }
    catch(e){ return {ok:false,err:e.message}; }
  });
  await p.close();
  const res={tool,pageErrors:errs.length,pageErrSample:errs.slice(0,3),build:out.ok};
  if(!out.ok){ res.buildErr=out.err; return res; }
  const leaves=new Set(); flatten(out.json,'ITR3',leaves);
  const conts=new Set(); containers(out.json,'ITR3',conts);
  const req=reqLeaves(tree);
  const present=[], trueMiss=[], blockAbsent=[];
  for(const r of req){
    if(leaves.has(r)){ present.push(r); continue; }
    const parent=r.split('.').slice(0,-1).join('.');
    if(conts.has(parent)) trueMiss.push(r); else blockAbsent.push(r);
  }
  res.reqTotal=req.length; res.present=present.length;
  res.trueMiss=trueMiss;
  // group blockAbsent by 2nd-level schedule root
  const byRoot={};
  for(const x of blockAbsent){ const root=x.split('.')[1]; (byRoot[root]=byRoot[root]||[]).push(x); }
  res.blockAbsent=byRoot;
  return res;
}

const which=process.argv[2]||'both';
const outObj={};
if(which==='2026'||which==='both') outObj.r26=await check('itr3','docs/itr-schema-conformance/real/trees/tree-ITR3-2026.txt');
if(which==='2025'||which==='both') outObj.r25=await check('itr3-2025-26','docs/itr-schema-conformance/real/trees/tree-ITR3-2025.txt');
await b.close();
// summary
for(const k of Object.keys(outObj)){
  const r=outObj[k];
  if(!r.build){ console.log(k,'BUILD FAIL',r.buildErr,'pageErrors',r.pageErrors,r.pageErrSample); continue; }
  const baRoots=Object.fromEntries(Object.entries(r.blockAbsent).map(([root,arr])=>[root,arr.length]));
  console.log(`\n=== ${k} ${r.tool} === pageErrors=${r.pageErrors} present=${r.present}/${r.reqTotal} trueMiss=${r.trueMiss.length} blockAbsentLeaves=${Object.values(r.blockAbsent).reduce((s,a)=>s+a.length,0)}`);
  if(r.pageErrors) console.log('  ERRSAMPLE',r.pageErrSample);
  console.log('  trueMiss:',JSON.stringify(r.trueMiss));
  console.log('  blockAbsentByRoot:',JSON.stringify(baRoots));
}
if(process.env.DUMP) fs.writeFileSync('itr-sim/_probe-out.json',JSON.stringify(outObj,null,1));
