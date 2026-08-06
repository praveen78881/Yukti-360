import { chromium } from 'playwright';
const EDGE='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const urls=[
  ['AY2026-27','http://localhost:7777/tax-utilities/itr3.html'],
  ['AY2025-26','http://localhost:7777/tax-utilities/itr3-2025-26.html'],
];
const b=await chromium.launch({executablePath:EDGE,headless:true});
let anyErr=0;
for(const [ay,url] of urls){
  const ctx=await b.newContext();
  const pg=await ctx.newPage();
  const errs=[];
  pg.on('pageerror',e=>errs.push(String(e&&e.message||e)));
  await pg.goto(url,{waitUntil:'load',timeout:60000});
  await pg.waitForTimeout(2500);
  const meta=await pg.evaluate(()=>{
    const o={rules:(typeof ITR3_RULES!=='undefined')?ITR3_RULES.length:null};
    try{o.hasITR3=!!(window.buildItr3Json().ITR.ITR3);}catch(e){o.buildErr=String(e);}
    try{const v=validateItr3();o.errs=v.errors.length;o.warns=v.warnings.length;}catch(e){o.valErr=String(e);}
    return o;
  });
  // INVALID (empty) -> click export -> popup must block
  await pg.click('#exportJsonBtn').catch(()=>{});
  await pg.waitForTimeout(300);
  const invalid=await pg.evaluate(()=>{
    const ov=document.getElementById('itr3ValPopup');
    const shown=!!(ov&&ov.style.display!=='none');
    const items=ov?[...ov.querySelectorAll('ol li')].map(li=>li.textContent.trim()):[];
    return {shown,count:items.length,numbered:items.length>0&&items.every(t=>/^Sl\.No\s/.test(t))};
  });
  // POSITIVE-PATH sanity: does the batch-6 arithmetic ever falsely fire on a synthetic balanced JSON?
  const batch6=await pg.evaluate(()=>{
    // Build a minimal balanced JSON exercising the batch-6 schedules, run ONLY those rules.
    const I={
      Schedule112A:{Schedule112ADtls:[{IncomeFromVDA:0}],SaleValue112A:1000,AcquisitionCost112A:600,ExpExclCnctTransfer112A:0,Deductions112A:600,Balance112A:400},
      ScheduleVDA:{ScheduleVDADtls:[{HeadUndIncTaxed:'CG',IncomeFromVDA:500},{HeadUndIncTaxed:'BI',IncomeFromVDA:200}],TotIncBusiness:200,TotIncCapGain:500},
      ScheduleSI:{SplCodeRateTax:[{SplRateInc:100,SplRateIncTax:20},{SplRateInc:50,SplRateIncTax:10}],TotSplRateInc:150,TotSplRateIncTax:30},
      ScheduleIT:{TaxPayment:[{Amt:1000},{Amt:500}],TotalTaxPayments:1500},
      ScheduleTCS:{TCS:[{TCSClaimedThisYearDtls:{TCSAmtCollOwnHand:300}}],TotalSchTCS:300},
      ScheduleAMTC:{TaxSection115JC:100,TaxOthProvisions:250,AmtTaxCreditAvailable:150}
    };
    const b6=ITR3_RULES.filter(r=>['489','490','502','503','SI-T1','SI-T2','IT-T1','TCS-T1','842'].includes(r.sl));
    const fired=b6.filter(r=>{try{return !!r.fail(I,{});}catch(e){return false;}}).map(r=>r.sl);
    // now break Balance112A -> rule 490 must fire
    I.Schedule112A.Balance112A=999;
    const r490=ITR3_RULES.find(r=>r.sl==='490');
    return {n:b6.length, falseFires:fired, r490fires:!!r490.fail(I,{})};
  });
  console.log(`[${ay}] pageErrors=${errs.length} rules=${meta.rules} build=${meta.hasITR3} emptyValidate(errors=${meta.errs},warns=${meta.warns}) invalidBlocked=${invalid.shown}(items=${invalid.count},numbered=${invalid.numbered}) batch6=${batch6.n} falseFiresOnBalanced=[${batch6.falseFires}] rule490firesOnBroken=${batch6.r490fires}`);
  if(errs.length){ anyErr+=errs.length; errs.forEach(e=>console.log('  PAGEERR:',e)); }
  await ctx.close();
}
await b.close();
console.log('TOTAL_PAGEERRORS='+anyErr);
process.exit(0);
