import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'msedge' });
async function check(tool){
  const p = await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://localhost:7777/tax-utilities/${tool}.html`,{waitUntil:'load',timeout:40000});
  await p.waitForTimeout(600);
  await p.evaluate(()=>{ for(const[id,v]of[['cl_name','PROBE'],['cl_pan','ABCDE1234F'],['cl_dob','01/01/1985']]){const e=document.getElementById(id);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}} document.querySelector('[data-tab="comp"]')?.click(); });
  await p.waitForTimeout(600);
  const r = await p.evaluate(()=>{
    const out={};
    try{ const j=window.buildItr3Json?.(); out.build=!!(j&&j.ITR&&j.ITR.ITR3); out.scheds=j?Object.keys(j.ITR.ITR3).length:0; }catch(e){ out.buildErr=e.message; }
    out.hasValidate = typeof window.validateItr3==='function';
    out.rules = (window.ITR3_RULES||[]).length;
    try{ const vr=window.validateItr3?.(); out.valShape = vr?(Array.isArray(vr)?'array':Object.keys(vr).join(',')):'none'; out.errs = vr&&vr.errors?vr.errors.length:(Array.isArray(vr)?vr.filter(x=>x.cat==='A').length:0); }catch(e){ out.valErr=e.message; }
    return out;
  });
  r.pageErrors=errs.slice(0,2); r.tool=tool;
  await p.close(); return r;
}
console.log(JSON.stringify(await check('itr3'),null,1));
console.log(JSON.stringify(await check('itr3-2025-26'),null,1));
await b.close();
