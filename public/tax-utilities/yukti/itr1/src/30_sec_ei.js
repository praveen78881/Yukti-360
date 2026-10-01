/* =====================================================================
   ITR-1 · Section "ei" — Exempt income (Schedule EI)
   Screen order 70; compute order (corder) 28 — after income is settled but
   before the tax ladder, so the exempt figure is available for context.

   Built ONLY from books/ITR-1:
     · schema_tree.md §7.9  (ExemptIncAgriOthUs10, lines 35108-35150)
     · enums.json  ExemptIncAgriOthUs10_Category (AY26-27, 8 codes —
       AUTHORITATIVE; supersedes the prior builder's stale EICAT)
       + ExemptIncAgriOthUs10_SubCategory (the section-10 clause list, V0.5/V0.6)
     · sections.md §S9
     · skeleton.json (block is CONDITIONAL — emitted only when a row exists)

   Owns / writes on export (nobody else writes these leaves):
     · ITR1_IncomeDeductions.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls[]
         { Category, SubCategory, Description?, OthAmount }
     · ITR1_IncomeDeductions.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Total

   Description is emitted ONLY for the three "needs Description" sub-categories
   (Incmexmptcircular / Incmexmptnotification / Receiptnotincme).

   Publishes  S.C.ei.{ total, nRows, agriOver5k }.
   Consumes   S.C.ret.regime  (disclosure is regime-agnostic — used only for
              the on-screen note; exempt income never enters GTI in either regime).

   Agriculture note (ITR-1 eligibility): sub-category 10(1) is
   "Agricultural income (<= 5000)". Net agricultural income exceeding ₹5,000
   bars ITR-1 (ITR-2 is required) — flagged on screen and in chkEi.
   ===================================================================== */

/* ---- category codes — enums.json ExemptIncAgriOthUs10_Category (VERBATIM) --- */
const EICAT1=[
  ["AGRI","Agricultural & related incomes"],
  ["GOVC","Compensation/other sums received by government or approved entities"],
  ["ISI","Income from specified Investments"],
  ["SSRA","Specified sums received by armed forces personnel"],
  ["SRSC","Sums received by Senior Citizens/Minors"],
  ["SRST","Sums received by specified Category of Taxpayers"],
  ["SRPC","Sums received from policies/contributions (LIC/NPS/PF/Sukanya Samriddhi)"],
  ["OTH","Other Incomes"]];

/* ---- section-10 sub-category codes — enums.json
   ExemptIncAgriOthUs10_SubCategory (VERBATIM) --------------------------- */
const EISUB1=[
  ["10(1)","Agricultural income (<= 5000)"],
  ["10(30)","Subsidy from/through the Tea Board"],
  ["10(31)","Rubber/Coffee/Tea development accounts/funds"],
  ["10(10BB)","Bhopal Gas Leak Disaster payments"],
  ["10(10BC)","Compensation for disaster from Govt/local authority"],
  ["10(17A)","Award instituted by Government"],
  ["10(12AB)","Lump sum per notification FX-1/3/2024-PR"],
  ["10(15)","Interest on specified securities/investments"],
  ["10(23FBB)","Section 115UB income to unit holder of investment fund"],
  ["10(23FD)","Unit holder income from Business Trust (certain parts)"],
  ["10(35)","Income from specified Mutual Funds"],
  ["10(35A)","Distributed income u/s 115TA from securitisation trust"],
  ["10(12C)","Agniveer Corpus Fund income"],
  ["10(18)","Pension of gallantry award winner"],
  ["10(19)","Armed Forces family pension - death on operational duty"],
  ["10(23AA)","Sum on behalf of armed-forces Fund"],
  ["DMD","Defense Medical Disability Pension"],
  ["10(32)","Minor child income - small exemption"],
  ["10(43)","Reverse mortgage payments to senior citizens"],
  ["10(19A)","Annual value of one palace of ex-ruler"],
  ["10(26)","Income referred to in section 10(26)"],
  ["10(26AAA)","Income referred to in section 10(26AAA)"],
  ["10(10D)","Sum under a life insurance policy (except 10(10D)(a)-(d))"],
  ["10(11)","Statutory Provident Fund received"],
  ["10(11A)","Sukanya Samriddhi Yojana account"],
  ["10(12)","Recognized Provident Fund received"],
  ["10(12A)","NPS Trust payment to an assessee"],
  ["10(12AA)","NPS Trust payment"],
  ["10(12B)","NPS Trust payment to Central Govt employee"],
  ["10(12BA)","Partial withdrawal from NPS"],
  ["10(13)","Approved superannuation fund received"],
  ["10(25)","Trustees on behalf of approved super/gratuity/pension funds"],
  ["10(44)","Income for/on behalf of New Pension System Trust"],
  ["10(2)","Member's share from HUF"],
  ["10(16)","Scholarships for education"],
  ["Incmexmptcircular","Income exempt as per CBDT Circular (needs Description)"],
  ["Incmexmptnotification","Income exempt as per CBDT Notification (needs Description)"],
  ["Receiptnotincme","Receipts not in the nature of income (needs Description)"]];

/* sub-categories that carry a free-text Description leaf (schema §7.9) */
const EIDESC1=["Incmexmptcircular","Incmexmptnotification","Receiptnotincme"];
/* the agricultural sub-category whose > ₹5,000 bars ITR-1 */
const EIAGRI1="10(1)";

/* helper: is this a genuinely-filled row? (guarded, never throws) */
function _eiValid1(r){r=r||{};return !!(st0(r.cat)&&st0(r.sub)&&N(r.amt)>0);}

/* ---- state (seed only when absent — never clobber shell/import) -------- */
S.ei = S.ei || [];   /* rows -> ExemptIncAgriOthUs10Dtls[] {cat,sub,desc,amt} */

/* ---- engine — publish the cross-section scalars ----------------------- */
function engEi(){
  const rows=(S.ei||[]).filter(_eiValid1);
  const E={income:0};                       /* exempt income never enters GTI */
  E.total=rows.reduce((s,r)=>s+Math.max(0,Math.round(N(r.amt))),0);
  E.nRows=rows.length;
  E.agriOver5k=(S.ei||[]).some(r=>(r||{}).sub===EIAGRI1 && N(r.amt)>5000);
  S.C.ei=E;
}

/* ---- renderer --------------------------------------------------------- */
function secEi(){
  let h="";
  const reg=((S.C.ret||{}).regime)||"";     /* consume S.C.ret.regime */

  h+=sub("Exempt income (report only — not taxed)");
  h+=note("Income that is exempt is only <b>reported</b> here for disclosure; it is not "+
    "added to the total income and is taxed in neither the new nor the old regime"+
    (reg?" (you are on the <b>"+esc(reg)+"</b> regime)":"")+". "+
    "Pick the broad category, then the exact section-10 clause, and enter the amount.");

  h+=grid("ei",[
    {k:"cat",h:"Category",t:"sel",w:"280px",req:1,opts:EICAT1},
    {k:"sub",h:"Section-10 sub-category",t:"sel",w:"340px",req:1,opts:EISUB1},
    {k:"desc",h:"Description (circular / notification / receipt only)",t:"txt",w:"auto",max:250},
    {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],
    S.ei,{min:"1120px",empty:"No exempt income reported.",add:"Add an exempt-income row"});

  h+=note("A <b>Description</b> is required only when the sub-category is a CBDT circular, a CBDT "+
    "notification, or a receipt not in the nature of income; leave it blank for every other clause.");

  /* --- agriculture > ₹5,000 bars ITR-1 --- */
  h+=note("<b>Agricultural income:</b> use sub-category <b>10(1)</b>. Net agricultural income of "+
    "<b>more than ₹5,000</b> cannot be reported in ITR-1 — you must file ITR-2 instead. "+
    "Keep agricultural income here at ₹5,000 or below.",
    ((S.C.ei||{}).agriOver5k)?"warn":undefined);

  h+=row("Total exempt income reported",cell((S.C.ei||{}).total),
    {ref:"ExemptIncAgriOthUs10Total",hint:"disclosure only; not part of total income"});

  return h;
}

/* ---- export — writes ONLY the ExemptIncAgriOthUs10 block --------------- */
function expEi(j){
  const rows=(S.ei||[]).filter(_eiValid1);
  if(!rows.length) return;                   /* block is conditional — omit when empty */

  /* create the nested path (skeleton omits it), then fill total + rows */
  const total=rows.reduce((s,r)=>s+Math.max(0,Math.round(N(r.amt))),0);
  put(j,"ITR1_IncomeDeductions.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Total",total);
  j.ITR1_IncomeDeductions.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls=rows.map(r=>{
    const cat=EICAT1.some(c=>c[0]===r.cat)?r.cat:"OTH";
    const sub=EISUB1.some(c=>c[0]===r.sub)?r.sub:st0(r.sub);
    const o={Category:cat,SubCategory:sub,OthAmount:Math.max(0,Math.round(N(r.amt)))};
    if(EIDESC1.indexOf(sub)>=0) o.Description=(sv(r.desc)||"NA").slice(0,250);
    return o;
  });
}

/* ---- import (inverse) — seeds S.ei from a return ---------------------- */
function impEi(I){
  const read=[]; const g=(o,p)=>p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);
  const dt=g(I,"ITR1_IncomeDeductions.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls");
  if(Array.isArray(dt)&&dt.length){
    S.ei=dt.map(r=>({
      cat:EICAT1.some(c=>c[0]===r.Category)?r.Category:"OTH",
      sub:r.SubCategory||"",
      desc:r.Description||"",
      amt:N(r.OthAmount)}));
    read.push("exempt income ("+S.ei.length+" row"+(S.ei.length>1?"s":"")+")");
  }
  return read;
}

/* ---- checks — the section's own screen validations -------------------- */
function chkEi(){
  const out=[]; engEi();
  (S.ei||[]).forEach((r,i)=>{
    r=r||{};
    const started=st0(r.cat)||st0(r.sub)||st0(r.desc)||N(r.amt)>0;
    if(!started) return;                     /* skip an untouched blank row */
    const n=i+1;
    if(!EICAT1.some(c=>c[0]===r.cat))
      out.push({lvl:"err",t:"Exempt row "+n,m:"Select the category of exempt income.",sec:"ei"});
    if(!EISUB1.some(c=>c[0]===r.sub))
      out.push({lvl:"err",t:"Exempt row "+n,m:"Select the section-10 sub-category.",sec:"ei"});
    if(!(N(r.amt)>0))
      out.push({lvl:"err",t:"Exempt row "+n,m:"Enter the exempt amount (greater than zero).",sec:"ei"});
    if(EIDESC1.indexOf(r.sub)>=0 && !st0(r.desc))
      out.push({lvl:"err",t:"Exempt row "+n,m:"This sub-category (circular / notification / receipt) needs a description.",sec:"ei"});
    if(r.sub===EIAGRI1 && N(r.amt)>5000)
      out.push({lvl:"err",t:"Exempt row "+n,m:"Agricultural income above ₹5,000 cannot be filed in ITR-1 — use ITR-2.",sec:"ei"});
  });
  if(!out.length){
    const t=(S.C.ei||{}).total||0;
    out.push({lvl:"ok",t:"Exempt income",m:t?("₹"+t.toLocaleString("en-IN")+" of exempt income reported; every check passes."):"No exempt income to report.",sec:"ei"});
  }
  return out;
}

/* ---- register (overrides the boot stub) ------------------------------- */
reg({id:"ei", t:"Exempt income", ref:"Schedule EI", f:secEi,
  s:()=>{const t=((S.C.ei||{}).total)||0;
    return t?("₹"+t.toLocaleString("en-IN")+" exempt"):"";},
  eng:engEi, exp:expEi, imp:impEi, chk:chkEi, order:70, corder:28});
