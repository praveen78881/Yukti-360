// Find the real income-input path in ITR-1's calc frame so we can drive a live cross-check.
import { chromium } from 'playwright';
import path from 'node:path'; import { pathToFileURL } from 'node:url';
const url = pathToFileURL(path.resolve('public/tax-utilities/itr1.html')).href;
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage();
await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(500);
await p.evaluate(() => document.querySelector('[data-tab="comp"]')?.click());
await p.waitForTimeout(1000);
const calc = p.frames().find(f => f.name === '' ) || p.frames()[1];
const cf = p.frames().find(async f => await f.evaluate(()=>!!document.getElementById('it_totalIncome')).catch(()=>false)) ;
// pick the frame that has it_totalIncome
let frame=null; for(const f of p.frames()){ if(await f.evaluate(()=>!!document.getElementById('it_totalIncome')).catch(()=>false)){frame=f;break;} }

// dump editable inputs (not computed it_*), with nearby label text
const inputs = await frame.evaluate(() => {
  const out=[];
  document.querySelectorAll('input,select,textarea').forEach(e=>{
    if(!e.id) return;
    if(e.type==='button'||e.type==='hidden') return;
    const lab = e.closest('tr,.row,.field,label,td')?.textContent?.trim().slice(0,40)||'';
    out.push({id:e.id, tag:e.tagName, type:e.type, ph:e.placeholder||'', lab});
  });
  return out;
});
console.log('total editable:', inputs.length);
// show the ones that look like salary / interest / income entry (not it_)
const cands = inputs.filter(i=>!/^it_/.test(i.id) && /sal|emp|int|os_|inc|amount|gross|deduct|80/i.test(i.id+i.ph+i.lab));
console.log('=== candidate income/deduction inputs (first 40) ===');
cands.slice(0,40).forEach(i=>console.log(`  #${i.id} [${i.type}] ph="${i.ph}" lab="${i.lab}"`));

// Try: click Add Employer, then fill the first salary gross field that appears
const addedEmp = await frame.evaluate(()=>{ const btn=document.getElementById('addEmployer'); if(btn){btn.click(); return true;} return false; });
console.log('clicked addEmployer:', addedEmp);
await p.waitForTimeout(400);
const empInputs = await frame.evaluate(()=>[...document.querySelectorAll('#emp-blocks input,#emp-blocks select')].map(e=>({id:e.id,ph:e.placeholder||'',type:e.type})).slice(0,25));
console.log('=== emp-blocks inputs ===');
empInputs.forEach(i=>console.log(`  #${i.id} [${i.type}] ph="${i.ph}"`));

const read = id => frame.evaluate(id=>document.getElementById(id)?.textContent??'(none)', id);
console.log('it_sal_income before:', await read('it_sal_income'), '| it_totalIncome:', await read('it_totalIncome'));
await b.close();
