/* ---- rule helpers ---- */
const RG=(o,p,d)=>{try{const v=p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);return v==null?(d===undefined?0:d):v;}catch(e){return d===undefined?0:d;}};
const RSUM=(arr,f)=>(arr||[]).reduce((a,r)=>a+(typeof f==="function"?N(f(r)):N(r[f])),0);
const REQ=(a,b,tol)=>Math.abs(N(a)-N(b))<=(tol||1);
const RDR=o=>o&&o.DateRange?Object.values(o.DateRange).reduce((a,v)=>a+N(v),0):0;
/* ---- export gate ---- */
const deep=o=>JSON.parse(JSON.stringify(o));
function put(o,p,v){if(v===undefined||v===null||v==="")return;
  const a=p.split(".");let t=o;for(let i=0;i<a.length-1;i++){if(t[a[i]]==null)t[a[i]]={};t=t[a[i]];}
  t[a[a.length-1]]=v;}
const n0=x=>Math.max(0,R(x)),sg=x=>R(x),sv=v=>{v=st0(v);return v||undefined;};
function auditShape(b){const miss=[],bad=[];
  (function w(req,got,path){Object.keys(req).forEach(k=>{const p=path?path+"."+k:k;
    if(!(k in got)||got[k]===undefined){miss.push(p);return;}
    const r=req[k],g=got[k];
    if(r!==null&&typeof r==="object"&&!Array.isArray(r)){
      if(typeof g!=="object"||Array.isArray(g))bad.push(p+" should be an object");else w(r,g,p);
    } else if(typeof r==="number"){if(typeof g!=="number"||!isFinite(g)||g%1!==0)bad.push(p+" should be a whole number");
    } else if(typeof r==="string"){if(typeof g!=="string"||!g)bad.push(p+" should be text");}});
  })(SKEL,Object.values(b.ITR)[0],"");return {miss,bad};}
/* auditRules(b) is supplied by the form */
const HASH_KEY="HZX4oKH11zARYIb2",HASH_ITER=1988;   /* ITR-4 signing — same key/iterations as the offline utility (getHashKey/getHashIteration, verified) */
async function computeDigest(compactJson){
  const enc=new TextEncoder();
  const key=await crypto.subtle.importKey("raw",enc.encode(HASH_KEY),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  let bytes=new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(compactJson)));
  for(let i=0;i<HASH_ITER;i++)bytes=new Uint8Array(await crypto.subtle.sign("HMAC",key,bytes));
  let bin="";for(const b of bytes)bin+=String.fromCharCode(b);
  return btoa(bin);
}
async function exportJSON(){compute();
  const errs=S.C.checks.filter(c=>c.lvl==="err");
  if(errs.length){alert(errs.length+" thing"+(errs.length>1?"s":"")+" still to fix:\n\n"+
    errs.slice(0,8).map(e=>"· "+e.t+" — "+e.m).join("\n")+
    (errs.length>8?"\n\n…and "+(errs.length-8)+" more.":""));return;}
  const b=buildReturn(),a=auditShape(b);
  if(a.miss.length||a.bad.length){alert("The return did not come out in the shape the schema requires:\n\n"+
    a.miss.slice(0,6).map(x=>"missing "+x).concat(a.bad.slice(0,6)).join("\n"));return;}
  const r=auditRules(b);
  if(r.length){alert("The return does not agree with itself:\n\n"+r.slice(0,8).join("\n"));return;}
  /* the department's own validation rules — Category A stops the upload, D is a warning */
  let rr=[];try{rr=runRules(Object.values(b.ITR)[0],S);}catch(e){console.error("rules",e);}
  const rA=rr.filter(x=>x.cat==="A"),rD=rr.filter(x=>x.cat==="D");S.C.rules=rr;
  if(rA.length){alert("The portal would reject this return — "+rA.length+" Category A rule"+(rA.length>1?"s":"")+" fail"+(rA.length>1?"":"s")+":\n\n"+
    rA.slice(0,10).map(x=>"A"+x.n+" · "+x.msg).join("\n")+(rA.length>10?"\n\n…and "+(rA.length-10)+" more. The full list is under Bank and verification.":""));paint(true);return;}
  if(rD.length)alert("Exported. "+rD.length+" Category D notice"+(rD.length>1?"s":"")+" to act on after upload:\n\n"+rD.map(x=>"D"+x.n+" · "+x.msg).join("\n"));
  b.ITR.ITR4.CreationInfo.Digest="-";                 /* sign exactly as the utility: compact JSON with Digest "-", HMAC it, substitute, write compact */
  const digest=await computeDigest(JSON.stringify(b));
  b.ITR.ITR4.CreationInfo.Digest=digest;
  download((S.pi.pan||FORM.id)+"_"+FORM.id.replace("-","")+"_AY"+FORM.ay+".json",JSON.stringify(b));}
function rulesPanel(){let rr=[];try{const b=buildReturn();rr=runRules(Object.values(b.ITR)[0],S);}catch(e){return note("The department's rules could not be run yet — "+(e.message||e),"warn");}
  const rA=rr.filter(x=>x.cat==="A"),rD=rr.filter(x=>x.cat==="D");
  let h=sub("The department's validation rules — "+FORM.name+", AY "+FORM.ay+"");
  h+=note((rA.length?"<b>"+rA.length+" Category A rule"+(rA.length>1?"s":"")+" fail</b> — the portal would reject the upload.":"<b>Every Category A rule passes.</b> The portal would accept the upload.")+
    (rD.length?" "+rD.length+" Category D notice"+(rD.length>1?"s":"")+" — the return uploads but a form or claim needs to follow.":""),rA.length?"stop":"");
  if(rA.length||rD.length){h+='<div class="full"><table class="gt" style="min-width:800px"><thead><tr><th class="l" style="width:70px">Rule</th><th class="l" style="width:90px">Category</th><th class="l">What the portal checks</th></tr></thead><tbody>';
    rA.concat(rD).forEach(x=>h+='<tr><td class="l">'+x.cat+x.n+'</td><td class="l">'+(x.cat==="A"?"A — rejected":"D — notice")+'</td><td class="l">'+esc(x.msg)+'</td></tr>');h+='</tbody></table></div>';}
  return h;}
$("b_json").addEventListener("click",exportJSON);
paint();
