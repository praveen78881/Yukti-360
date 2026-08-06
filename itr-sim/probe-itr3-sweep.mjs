import { chromium } from 'playwright';
import fs from 'fs';

const b = await chromium.launch({ channel: 'msedge' });

function reqLeaves(treeFile){
  const set=new Set();
  for(const line of fs.readFileSync(treeFile,'utf8').split(/\r?\n/)){
    const m=line.split('|');
    if(m.length<3) continue;
    if(m[0].trim()==='R'){ set.add(m[2].trim()); }
  }
  return [...set];
}

function flatten(o,prefix,out){
  if(o===null||o===undefined) return;
  if(Array.isArray(o)){ o.forEach(v=>flatten(v,prefix,out)); return; }
  if(typeof o==='object'){ for(const k of Object.keys(o)) flatten(o[k],prefix?prefix+'.'+k:k,out); return; }
  out.add(prefix); // leaf value present
}
// also record object container paths (so we know which parents emitted)
function containers(o,prefix,out){
  if(o===null||o===undefined||typeof o!=='object') return;
  if(prefix) out.add(prefix);
  if(Array.isArray(o)){ o.forEach(v=>containers(v,prefix,out)); return; }
  for(const k of Object.keys(o)) containers(o[k],prefix?prefix+'.'+k:k,out);
}

const SEED=`(function(){
  const d=window.data;
  // identity
  for(const[id,v]of[['cl_name','RAVI KUMAR'],['cl_pan','ABCDE1234F'],['cl_dob','01/01/1985'],['cl_status','Individual']]){const e=document.getElementById(id);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}}
  d.assessee=Object.assign(d.assessee,{flat:'12',premises:'Green Villa',road:'MG Road',area:'Indiranagar',locality:'Indiranagar',city:'Bengaluru',stateCode:'19',pin:'560038',mobile:'9812345678',email:'ravi@example.com',aadhaar:'123412341234'});
  d.verifier=Object.assign(d.verifier||{},{name:'RAVI KUMAR',pan:'ABCDE1234F',contact:'9812345678',email:'ravi@example.com',capacity:'Self',place:'Bengaluru'});
  d.bank=[{ifsc:'HDFC0000123',name:'HDFC Bank',acc:'50100123456',type:'SB'}];
  // business identity
  d.nature=[{code:'09028',trade1:'Wholesale trade',trade2:'Trading'}];
  d.director=[{company:'ACME PVT LTD',ctype:'D',listed:'UL',pan:'AAACA1111A',din:'01234567'}];
  d.unlisted=[{company:'BETA PVT LTD',pan:'AAACB2222B',ctype:'D',opQty:'100',opCost:'10000',clQty:'150',clCost:'15000'}];
  d.repassessee={name:'',email:'',contact:''};
  // salary
  d.sal={employers:[{name:'TCS LTD',nature:'PE',addr:'Tower A',city:'Bengaluru',state:'19-KARNATAKA',sal17:'1200000',perq:'50000',pil:'0'}],exempt:[{nature:'10(13A)',amount:'120000'}],ded16ia:'75000',proftax:'2400'};
  // BS/PL minimal
  d.bs={bs_capital:'500000',bs_reserves:'100000',bs_ca_cash:'50000',bs_ca_banks:'400000',bs_ca_debtors:'150000'};
  d.pl={pl_trd_sale_goods:'5000000',pl_trd_purchases:'3500000',pl_exp_salaries:'400000',pl_exp_rents:'120000',pl_less_depreciation:'50000'};
  // CG rows
  d.cg=d.cg||{}; d.cg.stLB=[{fvc:'2000000',cost:'1500000',imp:'0',exp:'20000',buyer:'AMIT SHAH',buyerpan:'AAAPS1234A',buyershare:'100',buyeramt:'2000000',buyeraddr:'Plot 5',buyerstate:'19-KARNATAKA',valuation:'2100000'}];
  d.cg.ltLB=[{fvc:'5000000',cost:'3000000',imp:'100000',exp:'50000',buyer:'SUNIL RAO',buyerpan:'AAAPR5678B',buyershare:'100',buyeramt:'5000000',buyeraddr:'Villa 9',buyerstate:'19-KARNATAKA'}];
  d.cg.lt112a=[{fvc:'800000',cost:'400000',isin:'INE001A01036',name:'ABC LTD',qty:'1000',saledate:'2025-06-01'}];
  // OS
  d.os={fields:{},others:[{nature:'Interest',amount:'50000'}],dtaa:[{}],q:{}};
  // AL
  d.al={al_immovable:'5000000',al_cash:'100000'};
  d.alFirm=[{name:'House',cost:'5000000',city:'Bengaluru',state:'19',pin:'560038'}];
  d.breakups=d.breakups||{}; d.breakups.al_bank=[{particulars:'HDFC',amount:'400000'}];
  // ESOP
  d.esop={pan:'AAACS9999S',dpiit:'DPIIT123',years:{'2022-23':{bf:'50000',cy:'10000',sale:'0'}},sold:false,soldRows:[]};
  // PTI
  d.pti=[{name:'XYZ AIF',pan:'AAATX1234A',busInc:'100000'}];
  // GST
  d.gstr=[{gstin:'29ABCDE1234F1Z5',outward:'5000000'}];
  // HP
  d.hp=[{}];
  // QD
  d.qd=[{}];
  return 'seeded';
})()`;

const SEED_IFRAME=`(function(){
  try{
  const f=document.getElementById('calcFrame'); if(!f||!f.contentWindow) return 'noframe';
  const w=f.contentWindow; w.bpData=w.bpData||{};
  const bp=w.bpData;
  bp.deductions=bp.deductions||{}; bp.deductions.s80other={
    g100:[{name:'PM National Relief Fund',pan:'AAATP1234P',address:'Delhi',city:'Delhi',state:'07',pin:'110001',amount:'50000',cash:false,ceiling:false}],
    g50:[{name:'Temple Trust',pan:'AAATT5678T',address:'Mysuru',city:'Mysuru',state:'19',pin:'570001',amount:'20000',cash:false,ceiling:true}],
    gga:[{clause:'2a',name:'Research Inst',pan:'AAATR1111R',address:'Pune',city:'Pune',state:'19',pin:'411001',amount:'30000',cash:false}],
    ggc:[{partyName:'National Party',partyPan:'AAATN2222N',date:'2025-08-01',amount:'25000',cash:false}]
  };
  bp.exempt={ppfInt:'40000',sukanya:'20000',_computed:{grandTotal:120000,agriAuto:60000}};
  bp.lossCFL={ud:{},_computed:{perHead:{hp:{bf:100000,setoff:0,cy:50000,cf:150000},biz:{bf:0,setoff:0,cy:0,cf:0},spec:{bf:0,setoff:0,cy:0,cf:0},specbz:{bf:0,setoff:0,cy:0,cf:0}}}};
  bp.amt={_computed:{amt:200000,ati:1600000,addbackC:150000,addback_10aa:0,addback_35ad:0,amtBase:200000,normalTax:180000,credit_generated:20000,credit_bf:5000,credit_cf:25000,credit_used:0,taxForLiability:180000}};
  bp.relief={rel90:{rows:[{country:'US',tin:'US123',headOfIncome:'Salary',income:'200000',taxOutside:'30000',taxIndia:'40000',reliefClaimed:'30000',sectionRelief:'90'}],refundAmount:'0'}};
  return 'iframe-seeded';
  }catch(e){return 'err:'+e.message;}
})()`;

async function check(tool,tree){
  const p = await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://localhost:7777/tax-utilities/${tool}.html`,{waitUntil:'load',timeout:45000});
  await p.waitForTimeout(800);
  const seedRes=await p.evaluate(SEED);
  // open comp tab to build iframe
  await p.evaluate(()=>{ document.querySelector('[data-tab="comp"]')?.click(); });
  await p.waitForTimeout(1000);
  const ifRes=await p.evaluate(SEED_IFRAME);
  // force calc cells so income/ded blocks activate
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
  const res={tool,seedRes,ifRes,pageErrors:errs.length,pageErrSample:errs.slice(0,3),build:out.ok};
  if(!out.ok){ res.buildErr=out.err; return res; }
  const leaves=new Set(); flatten(out.json,'ITR3',leaves);
  const conts=new Set(); containers(out.json,'ITR3',conts);
  const req=reqLeaves(tree);
  const present=[], trueMiss=[], blockAbsent=[];
  for(const r of req){
    if(leaves.has(r)){ present.push(r); continue; }
    // parent path
    const parent=r.split('.').slice(0,-1).join('.');
    if(conts.has(parent)) trueMiss.push(r); else blockAbsent.push(r);
  }
  res.reqTotal=req.length; res.present=present.length; res.trueMiss=trueMiss;
  res.blockAbsentTop=[...new Set(blockAbsent.map(x=>x.split('.')[1]))];
  return res;
}

const r26=await check('itr3','docs/itr-schema-conformance/real/trees/tree-ITR3-2026.txt');
const r25=await check('itr3-2025-26','docs/itr-schema-conformance/real/trees/tree-ITR3-2025.txt');
await b.close();
console.log(JSON.stringify({r26:{tool:r26.tool,seedRes:r26.seedRes,ifRes:r26.ifRes,pageErrors:r26.pageErrors,pageErrSample:r26.pageErrSample,build:r26.build,buildErr:r26.buildErr,reqTotal:r26.reqTotal,present:r26.present,trueMissCount:(r26.trueMiss||[]).length,trueMiss:r26.trueMiss,blockAbsentTop:r26.blockAbsentTop},
 r25:{tool:r25.tool,seedRes:r25.seedRes,ifRes:r25.ifRes,pageErrors:r25.pageErrors,pageErrSample:r25.pageErrSample,build:r25.build,buildErr:r25.buildErr,reqTotal:r25.reqTotal,present:r25.present,trueMissCount:(r25.trueMiss||[]).length,trueMiss:r25.trueMiss,blockAbsentTop:r25.blockAbsentTop}},null,1));
