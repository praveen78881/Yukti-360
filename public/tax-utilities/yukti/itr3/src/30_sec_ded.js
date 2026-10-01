/* =====================================================================
   ITR-3 · Section "ded" — Deductions (Chapter VI-A) + 10AA
   Book: books/ITR-3/VI_A.md  ·  Regime: books/ITR-3/REGIME.md
   Schema blocks: ScheduleVIA, Schedule80C, Schedule80D, Schedule80DD,
   Schedule80U, Schedule80E/EE/EEA/EEB, Schedule80G, Schedule80GGA,
   Schedule80RA, Schedule80GGC, Schedule80_IA/IB/IC, Schedule10AA.
   Compute order 40 (after the income heads, before tax rolls up GTI/TI).
   Every figure/letter/cap/rule below is from ITR-3's own VI-A book; the
   ITR-2 reference gave shape only (constitution rule 2).
   ===================================================================== */

/* ---- state (this section's namespace) ---- */
S.ded = S.ded || {
  v:{},              /* single claimed amounts + ddb/ack/pran */
  c80c:[],           /* Schedule 80C detail rows */
  pen80ccc:[],       /* PensionContribution80CCC[] identifier table (r8) */
  d80:{selfSr:"N/A",parSr:"N/A"}, /* Schedule 80D */
  dd80:{},           /* Schedule 80DD */
  u80:{},            /* Schedule 80U */
  e80:{e:[],ee:[],eea:[],eeb:[],eeaSdv:""}, /* 80E/EE/EEA/EEB loan tables */
  g80:[],            /* Schedule 80G donees */
  gga:[],            /* Schedule 80GGA */
  ra:[],             /* Schedule RA (feeds 35(1) donations) */
  ggc:[],            /* Schedule 80GGC */
  ia:{}, ib:{}, ie:{}, /* Schedule 80-IA / 80-IB / 80-IE(→80IC) */
  aa10:[]            /* Schedule 10AA (SEZ units) */
};
/* per-contract, also register default grid rows on the shared SEED */
SEED.pen80ccc=SEED.pen80ccc||{type:"PRAN"};
SEED.c80c=SEED.c80c||{};
SEED.g80=SEED.g80||{bucket:"A"};
SEED.gga=SEED.gga||{clause:"80GGA2a",mode:"OTH"};
SEED.ggc=SEED.ggc||{mode:"OTH"};
SEED.ra=SEED.ra||{};
SEED.aa10=SEED.aa10||{};

/* ---- code tables (ITR-3 enums.json) ---- */
const DED_IDENT=[["PRAN","PRAN"],["OTHPRAN","Other than PRAN"]];        /* 80CCC E9:E11 */
const DED_DISEASE=[["a","Dementia"],["b","Dystonia Musculorum Deformans"],["c","Motor Neuron Disease"],
 ["d","Ataxia"],["e","Chorea"],["f","Hemiballismus"],["g","Aphasia"],["h","Parkinsons Disease"],
 ["i","Malignant Cancers"],["j","Full Blown Acquired Immuno-Deficiency Syndrome (AIDS)"],
 ["k","Chronic Renal failure"],["l","Hematological disorders"],["m","Hemophilia"],["n","Thalassaemia"]];
const DED_DDBTYPE=[["1","Self or dependent"],["2","Senior Citizen - Self or dependent"]];
const DED_DDNAT=[["1","Dependent person with disability"],["2","Dependent person with severe disability"]];
const DED_DTYPE=[["1","Autism, cerebral palsy, or multiple disabilities"],["2","Others"]];
const DED_DEP=[["1","Spouse"],["2","Son"],["3","Daughter"],["4","Father"],["5","Mother"],["6","Brother"],["7","Sister"],["8","Member of the HUF"]];
const DED_UNAT=[["1","Self with disability (40% or more)"],["2","Self with severe disability (80% or more)"]];
const DED_LOANFROM=[["B","Bank"],["I","Institution / other than bank"]];
const DED_GGACLAUSE=[["80GGA2a","80GGA(2)(a)"],["80GGA2aa","80GGA(2)(aa)"],["80GGA2b","80GGA(2)(b)"],
 ["80GGA2bb","80GGA(2)(bb)"],["80GGA2c","80GGA(2)(c)"],["80GGA2cc","80GGA(2)(cc)"],
 ["80GGA2d","80GGA(2)(d)"],["80GGA2e","80GGA(2)(e)"]];
const DED_STATE={"01":"Andaman & Nicobar","02":"Andhra Pradesh","03":"Arunachal Pradesh","04":"Assam","05":"Bihar",
 "06":"Chandigarh","07":"Dadra & Nagar Haveli","08":"Daman & Diu","09":"Delhi","10":"Goa","11":"Gujarat",
 "12":"Haryana","13":"Himachal Pradesh","14":"Jammu & Kashmir","15":"Karnataka","16":"Kerala","17":"Lakshadweep",
 "18":"Madhya Pradesh","19":"Maharashtra","20":"Manipur","21":"Meghalaya","22":"Mizoram","23":"Nagaland",
 "24":"Odisha","25":"Puducherry","26":"Punjab","27":"Rajasthan","28":"Sikkim","29":"Tamil Nadu","30":"Tripura",
 "31":"Uttar Pradesh","32":"West Bengal","33":"Chhattisgarh","34":"Uttarakhand","35":"Jharkhand","36":"Telangana",
 "37":"Ladakh","99":"Outside India"};
const DED_STOPTS=Object.keys(DED_STATE).map(k=>[k,DED_STATE[k]]);

/* The Chapter VI-A lettered list — [key, letter, label, hard-cap] — from VI_A.md.
   Part B a–o(i); Part C p–x; Part CA and D y, z, i, ia, ib. */
const DED_VIA=[
 ["c80c","a","80C — life insurance premia, provident fund, subscriptions etc.",150000],
 ["c80ccc","b","80CCC — payment in respect of a pension fund",150000],
 ["c80ccd1","c","80CCD(1) — contribution to the pension scheme of the Central Government",150000],
 ["c80ccd1b","d","80CCD(1B) — further contribution to the pension scheme",50000],
 ["c80ccd2","e","80CCD(2) — contribution to the pension scheme by the employer",0],
 ["c80d","f","80D — health insurance and preventive check-up (from Schedule 80D)",100000],
 ["c80dd","g","80DD — maintenance of a dependant with a disability (from Schedule 80DD)",125000],
 ["c80ddb","h","80DDB — medical treatment of a specified disease",100000],
 ["c80e","i","80E — interest on a loan taken for higher education",0],
 ["c80ee","j","80EE — interest on a loan for a residential house",50000],
 ["c80eea","k","80EEA — interest on a loan for certain house property",150000],
 ["c80eeb","l","80EEB — purchase of an electric vehicle",150000],
 ["c80g","m","80G — donations to certain funds and institutions (from Schedule 80G)",0],
 ["c80gg","n","80GG — rent paid (Form 10BA required)",60000],
 ["c80gga","o","80GGA — donations for scientific research or rural development (from Schedule 80GGA)",0],
 ["c80ggc","o(i)","80GGC — donation to a political party (from Schedule 80GGC)",0],
 ["c80ia","p","80IA — infrastructure undertakings (b of Schedule 80-IA)",0],
 ["c80iab","q","80IAB — development of a Special Economic Zone",0],
 ["c80ib","r","80IB — certain industrial undertakings (E of Schedule 80-IB)",0],
 ["c80iba","s","80-IBA — profits from housing projects",0],
 ["c80ie","t","80IE — undertakings in certain special-category States (b of Schedule 80-IE)",0],
 ["c80jja","u","80JJA — collecting and processing of bio-degradable waste",0],
 ["c80jjaa","v","80JJAA — employment of new employees",0],
 ["c80qqb","w","80QQB — royalty income of authors (Form 10CCD required)",300000],
 ["c80rrb","x","80RRB — royalty on patents (Form 10CCE required)",300000],
 ["c80tta","y","80TTA — interest on savings accounts (other than a resident senior citizen)",10000],
 ["c80ttb","z","80TTB — interest on deposits (resident senior citizen)",50000],
 ["c80u","i","80U — a person with a disability (from Schedule 80U)",125000],
 ["c80cch","ia","80CCH — contribution to the Agnipath scheme",288000],
 ["c80oth","ib","Any other deduction",0]];
/* the part each letter belongs to */
const DED_PARTB=["c80c","c80ccc","c80ccd1","c80ccd1b","c80ccd2","c80d","c80dd","c80ddb","c80e","c80ee","c80eea","c80eeb","c80g","c80gg","c80gga","c80ggc"];
const DED_PARTC=["c80ia","c80iab","c80ib","c80iba","c80ie","c80jja","c80jjaa","c80qqb","c80rrb"];
const DED_PARTCAD=["c80tta","c80ttb","c80u","c80cch","c80oth"];
/* what stays OPEN under the new regime u/s 115BAC — VI_A.md / REGIME.md:
   only 80CCD(2) and 80CCH, plus 80JJAA for a business filer. */
const DED_VIA_NEW=["c80ccd2","c80cch","c80jjaa"];
/* schema key per VI-A letter (single key used in both Usr/Ded objects) */
const DED_MAP={c80c:"Section80C",c80ccc:"Section80CCC",c80ccd1:"Section80CCDEmployeeOrSE",
 c80ccd1b:"Section80CCD1B",c80ccd2:"Section80CCDEmployer",c80d:"Section80D",c80dd:"Section80DD",
 c80ddb:"Section80DDB",c80e:"Section80E",c80ee:"Section80EE",c80eea:"Section80EEA",c80eeb:"Section80EEB",
 c80g:"Section80G",c80gg:"Section80GG",c80gga:"Section80GGA",c80ggc:"Section80GGC",
 c80ia:"Section80IA",c80iab:"Section80IAB",c80ib:"Section80IB",c80iba:"Section80IBA",
 c80ie:"Section80IC",/* 80IE row maps to schema key Section80IC (VI_A.md) */
 c80jja:"Section80JJA",c80jjaa:"Section80JJAA",c80qqb:"Section80QQB",c80rrb:"Section80RRB",
 c80tta:"Section80TTA",c80ttb:"Section80TTB",c80u:"Section80U"};
 /* c80cch + c80oth both roll into AnyOthSec80CCH (I69 = 80TTA+80TTB+80U+AnyOthSec80CCH). */

/* ===================================================================
   Schedule 80D engine — the four self/parents (non-senior / senior)
   blocks, the ₹25,000 / ₹50,000 ceilings, ₹5,000 shared preventive
   check-up cap, medical expenditure only where no insurance is taken
   (VI_A.md: helper rows R30/R32/S34/T34; Q34/Q35/R34/R35 sub-caps).
   =================================================================== */
function engDed80D(){
  const d=S.ded.d80||{}; const g=k=>N(d[k]);
  const ins=k=>(d[k]||[]).reduce((s,r)=>s+N(r.amt),0);
  const aHI=ins("selfIns"),aPHC=g("selfPHC");
  const bHI=ins("selfSrIns"),bPHC=g("selfSrPHC"),bMed=g("selfSrMed");
  const cHI=ins("parIns"),cPHC=g("parPHC");
  const dHI=ins("parSrIns"),dPHC=g("parSrPHC"),dMed=g("parSrMed");
  const selfSr=d.selfSr==="Y",parSr=d.parSr==="Y";
  const selfClaim=d.selfSr!=="N/A",parClaim=d.parSr!=="N/A";
  let phcAll=5000; const take=v=>{const t=Math.min(v,phcAll);phcAll-=t;return t;};   /* ₹5,000 in all */
  const aPHCu=selfClaim&&!selfSr?take(aPHC):0, bPHCu=selfClaim&&selfSr?take(bPHC):0;
  const cPHCu=parClaim&&!parSr?take(cPHC):0, dPHCu=parClaim&&parSr?take(dPHC):0;
  const selfTot=selfClaim?(selfSr?Math.min(50000,bHI+bMed+bPHCu):Math.min(25000,aHI+aPHCu)):0;
  const parTot =parClaim?(parSr?Math.min(50000,dHI+dMed+dPHCu):Math.min(25000,cHI+cPHCu)):0;
  return {aHI:R(aHI),aPHC:R(aPHC),aPHCu:R(aPHCu),bHI:R(bHI),bPHC:R(bPHC),bPHCu:R(bPHCu),bMed:R(bMed),
    cHI:R(cHI),cPHC:R(cPHC),cPHCu:R(cPHCu),dHI:R(dHI),dPHC:R(dPHC),dPHCu:R(dPHCu),dMed:R(dMed),
    selfTot:R(selfTot),parTot:R(parTot),eligible:R(Math.min(100000,selfTot+parTot)),
    selfSr,parSr,selfClaim,parClaim};
}

/* Schedule 80G eligible amount — buckets A/B/C/D, cash>2,000 disallowed,
   C & D subject to the 10%-of-adjusted-GTI qualifying limit (100%/50%). */
function engDed80G(gtiLimit){
  const rows=S.ded.g80||[];
  const base=r=>N(r.other)+(N(r.cash)>2000?0:N(r.cash));  /* cash over ₹2,000 gives no deduction */
  let A=0,B=0,C=0,D=0,gross=0,cash=0,other=0;
  rows.forEach(r=>{const b=base(r);gross+=N(r.amt);cash+=N(r.cash);other+=N(r.other);
    if(r.bucket==="A")A+=b; else if(r.bucket==="B")B+=b; else if(r.bucket==="C")C+=b; else if(r.bucket==="D")D+=b;});
  const ql=Math.max(0,R(0.1*Math.max(0,gtiLimit)));           /* qualifying limit for C + D */
  const cE=Math.min(C,ql), dPool=Math.max(0,ql-cE), dE=Math.min(D,dPool);
  const eligible=R(A + 0.5*B + cE + 0.5*dE);
  return {eligible,gross:R(gross),cash:R(cash),other:R(other)};
}

/* ===================================================================
   engDed — build S.C.ded from S.ded. Deductions do NOT add to GTI, so
   S.C.ded.income = 0; the allowed VI-A total is exposed for the tax
   section to subtract when it rolls up Total Income (= GTI − VI-A).
   =================================================================== */
function engDed(){
  const V={};                                    /* the result object */
  const status=(S.pi||{}).status||"I";           /* I individual, H HUF */
  const isHUF=status==="H";
  const nri=(S.fs||{}).resStatus!=="RES";
  /* best-effort GTI (heads run at order < 40). Sheet8b GrossTotalIncome
     less income taxed at special rates → the ceiling W3 (VI_A.md). The tax
     section (order 90) re-applies the authoritative cap on Total Income. */
  const head=h=>((S.C||{})[h]||{}).income||0;
  const gtiEst=R(head("sal")+head("hp")+head("bp")+head("cg")+head("os"));
  const splRate=R(((S.C||{}).cg||{}).splRate||0)+R(((S.C||{}).os||{}).splRate||0);
  const gtiLimit=Math.max(0,gtiEst-splRate);     /* [W3] */

  const d80=engDed80D(); S.C.d80=d80;
  const g80=engDed80G(gtiLimit); S.C.g80=g80;
  const et=k=>(S.ded.e80[k]||[]).reduce((s,r)=>s+N(r.interest),0);
  /* 80GGA cash>10,000 gives no deduction; 80GGC in cash gives none */
  const gga=(S.ded.gga||[]).reduce((s,r)=>s+(r.mode==="CASH"&&N(r.amt)>2000?0:N(r.amt)),0);   /* 80GGA sheet S7: cash over ₹2,000 gives no deduction */
  const ggc=(S.ded.ggc||[]).reduce((s,r)=>s+(r.mode==="CASH"?0:N(r.amt)),0);

  /* claimed amounts per VI-A letter (fed from a sub-schedule where one exists) */
  const fed={
    c80c:(S.ded.c80c||[]).length?(S.ded.c80c||[]).reduce((s,r)=>s+N(r.amt),0):N(S.ded.v.c80c),
    c80ccc:(S.ded.pen80ccc||[]).length?(S.ded.pen80ccc||[]).reduce((s,r)=>s+N(r.amt),0):N(S.ded.v.c80ccc),
    c80d:d80.eligible, c80dd:N(S.ded.dd80.amt),
    c80e:et("e"), c80ee:et("ee"), c80eea:et("eea"), c80eeb:et("eeb"),
    c80g:g80.eligible, c80gga:gga, c80ggc:ggc,
    c80ia:N(S.ded.ia.amt), c80ib:N(S.ded.ib.amt), c80ie:N(S.ded.ie.amt),
    c80u:N(S.ded.u80.amt)};
  const claim=k=>fed[k]!==undefined?N(fed[k]):N(S.ded.v[k]);

  const out={},why={},allow=k=>!isNew()||DED_VIA_NEW.indexOf(k)>=0;
  DED_VIA.forEach(x=>{const k=x[0],cap=x[3]; let c=claim(k);
    /* per-item statutory caps that depend on the claimant */
    if(k==="c80dd"&&c){const sev=(S.ded.dd80||{}).nature==="2";const cp=sev?125000:75000;if(c>cp){why[k]="capped at "+RS(cp);c=cp;}}
    if(k==="c80u"&&c){const sev=(S.ded.u80||{}).nature==="2";const cp=sev?125000:75000;if(c>cp){why[k]="capped at "+RS(cp);c=cp;}}
    if(k==="c80ddb"&&c){const cp=(S.ded.v.ddb_type==="2")?100000:40000;if(c>cp){why[k]="capped at "+RS(cp);c=cp;}}
    if(k==="c80ccc"&&isHUF&&c){why[k]="a HUF cannot claim 80CCC";c=0;}      /* K7 */
    if(k==="c80e"&&isHUF&&c){why[k]="a HUF cannot claim 80E";c=0;}          /* K39 */
    if(k==="c80gga"&&c&&head("bp")>0){why[k]="not available where there is business income";c=0;} /* K46 */
    if(!allow(k)){out[k]=0;why[k]=c?"closed by section 115BAC":"";return;}
    if(cap&&c>cap&&!why[k]){why[k]="capped at "+RS(cap);c=cap;}
    out[k]=R(c);});

  /* 80C + 80CCC + 80CCD(1) share the ₹1,50,000 ceiling (W5/K6/K7/K13) */
  const cce=out.c80c+out.c80ccc+out.c80ccd1;
  if(cce>150000){const f=150000/cce;out.c80c=R(out.c80c*f);out.c80ccc=R(out.c80ccc*f);
    out.c80ccd1=150000-out.c80c-out.c80ccc;
    why.c80c=(why.c80c?why.c80c+", ":"")+"80C, 80CCC and 80CCD(1) together stop at ₹1,50,000";}

  /* 80CCD(2) employer limit — 14% (Govt) / 10% of basic+DA where known (K29/A783) */
  if(out.c80ccd2){const base=R(((S.C||{}).sal||{}).basicDA||((S.C||{}).sal||{}).basic||0);
    if(base>0){const govt=!!((S.C||{}).sal||{}).anyGovt;const cp=R((govt?0.14:0.10)*base);
      if(out.c80ccd2>cp){why.c80ccd2="limited to "+(govt?"14%":"10%")+" of basic + DA = "+RS(cp);out.c80ccd2=cp;}}}

  /* 80TTA / 80TTB — mutually exclusive; limited to the interest actually earned (K64/K65) */
  const os={sav:((S.C||{}).os||{}).sav||0,dep:((S.C||{}).os||{}).dep||0};
  if(senior()){if(out.c80tta){why.c80tta="a senior citizen claims 80TTB instead";out.c80tta=0;}}
  else if(out.c80ttb){why.c80ttb="80TTB is only for a resident senior citizen";out.c80ttb=0;}
  if(out.c80tta&&out.c80tta>os.sav){why.c80tta="limited to the savings-bank interest";out.c80tta=R(os.sav);}
  if(out.c80ttb&&out.c80ttb>os.sav+os.dep){why.c80ttb="limited to the interest earned";out.c80ttb=R(os.sav+os.dep);}

  /* non-resident restrictions (VI_A.md K36/K66/K37; 80TTB/80QQB/80RRB) */
  if(nri){["c80dd","c80ddb","c80u","c80ttb","c80qqb","c80rrb"].forEach(k=>{if(out[k]){why[k]="not available to a non-resident";out[k]=0;}});}
  /* 80U/80TTB cannot be claimed by a HUF (A766/A772) */
  if(isHUF){["c80u","c80ttb"].forEach(k=>{if(out[k]){why[k]="not available to a HUF";out[k]=0;}});}

  /* part totals (K48 / K62 / K69), each min'd against the GTI ceiling */
  const sumOf=arr=>arr.reduce((a,k)=>a+R(out[k]||0),0);
  const rawB=sumOf(DED_PARTB), rawC=sumOf(DED_PARTC), rawCAD=sumOf(DED_PARTCAD);
  const partB=Math.max(0,Math.min(rawB,gtiLimit));
  const partC=Math.max(0,Math.min(rawC,gtiLimit));
  const partCAandD=Math.max(0,Math.min(rawCAD,gtiLimit));
  const total=rawB+rawC+rawCAD;                         /* v · total of a to ib */
  const allowed=Math.max(0,Math.min(R(partB+partC+partCAandD),gtiLimit));  /* K70 */

  /* Schedule 10AA (SEZ) — a section-10AA deduction, NOT Chapter VI-A; closed
     under the new regime (A633). Shown on Part B-TI as DeductionsUnder10Aor10AA. */
  const aa10Raw=(S.ded.aa10||[]).reduce((s,r)=>s+N(r.amt),0);
  const ded10AA=isNew()?0:Math.max(0,Math.min(R(aa10Raw),gtiLimit));

  S.C.ded={income:0,           /* a deduction head contributes 0 to GTI */
    out,why,fed,total:R(total),partB:R(partB),partC:R(partC),partCAandD:R(partCAandD),
    allowed:R(allowed),clipped:total>gtiLimit,ded10AA:R(ded10AA),aa10Raw:R(aa10Raw),
    gtiEst,gtiLimit,conc:isNew()};
}

/* ===================================================================
   secDed — renderer
   =================================================================== */
function dedPenTbl(key){
  return grid(key,[{k:"type",h:"Type of identifier",t:"sel",w:"200px",req:1,opts:DED_IDENT},
    {k:"id",h:"Identifier number / name",t:"txt",w:"auto",req:1},
    {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],get(key)||[],{min:"620px",empty:"None listed.",add:"Add a row"});
}
function dedInsTbl(key){
  return grid(key,[{k:"insurer",h:"Name of the insurer",t:"txt",w:"auto",req:1},
    {k:"policy",h:"Policy number",t:"txt",w:"180px",req:1},{k:"amt",h:"Health insurance amount",t:"num",w:"160px",req:1}],
    get(key)||[],{min:"720px",empty:"No policy listed.",add:"Add a policy"});
}
function dedLoanTbl(key){
  const extra=key==="ded.e80.eeb"?[{k:"reg",h:"Vehicle registration number",t:"txt",w:"150px",max:11,req:1}]:[];
  return grid(key,[{k:"from",h:"Loan taken from",t:"sel",w:"140px",req:1,opts:DED_LOANFROM},...extra,
    {k:"name",h:"Name of the bank, institution or person",t:"txt",w:"auto",req:1},
    {k:"acno",h:"Loan account number",t:"txt",w:"150px",req:1,max:20},{k:"dt",h:"Date of sanction",t:"date",w:"130px",req:1},
    {k:"amt",h:"Total loan",t:"num",w:"120px",req:1},{k:"os",h:"Outstanding on 31-03-2026",t:"num",w:"150px",req:1},
    {k:"interest",h:"Interest in the year",t:"num",w:"140px",req:1}],get(key)||[],{min:"1200px",empty:"No loan.",add:"Add a loan"});
}
function secDed(){
  const V=S.C.ded||{out:{},fed:{},total:0,allowed:0}, D8=S.C.d80||{}, G8=S.C.g80||{};
  let h="";
  if(S.fs.resStatus!=="RES")h+=note("A non-resident cannot claim 80DD, 80DDB, 80U, 80TTB, 80QQB or 80RRB — Yukti allows only what a non-resident may.","warn");
  if(isNew())h+=note("<b>Under section 115BAC only 80CCD(2), 80CCH and (for a business filer) 80JJAA survive.</b> The rest are closed; type them if you want the New-vs-Old comparison in Return &amp; regime to use them.","stop");

  const fedNote={c80d:"from Schedule 80D",c80g:"from Schedule 80G",c80gga:"from Schedule 80GGA",c80ggc:"from Schedule 80GGC",
    c80e:"from the 80E loan table",c80ee:"from the 80EE loan table",c80eea:"from the 80EEA loan table",c80eeb:"from the 80EEB loan table",
    c80dd:"from Schedule 80DD",c80u:"from Schedule 80U",c80c:"from the 80C item table",c80ccc:"from the identifier table",
    c80ia:"from Schedule 80-IA",c80ib:"from Schedule 80-IB",c80ie:"from Schedule 80-IE"};

  const hdr='<div class="r sub"><div class="l">Section</div><div class="ref"></div><div class="v2 hd2">You claim</div><div class="v hd2">System calculated</div></div>';
  h+='<div class="cgband">1 · Part B — Deduction in respect of certain payments (a to o(i))</div>'+hdr;
  DED_VIA.forEach(x=>{const [k,ref,label,cap]=x;
    if(k==="c80ia")h+='<div class="cgband">2 · Part C — Deduction in respect of certain incomes (p to x)</div>'+hdr;
    if(k==="c80tta")h+='<div class="cgband">3 · Part CA and D — Other incomes / other deduction (y, z, i, ia, ib)</div>'+hdr;
    const open=!isNew()||DED_VIA_NEW.indexOf(k)>=0;
    const isFed=fedNote[k]!==undefined;
    h+='<div class="r'+(open?"":" closed")+'"><div class="l">'+esc(label)+
       (cap?'<span class="hint">ceiling '+RS(cap)+'</span>':'')+(isFed?'<span class="hint">'+esc(fedNote[k])+'</span>':'')+
       (!open&&N(S.ded.v[k])?'<span class="hint">closed by section 115BAC</span>':'')+'</div>'+
       '<div class="ref">'+esc(ref)+'</div>'+
       '<div class="v2">'+((isFed||!open)?cell(open?(V.fed[k]!==undefined?V.fed[k]:N(S.ded.v[k])):0):inp("ded.v."+k,{n:1}))+'</div>'+
       '<div class="v">'+cell(V.out[k]||0)+'</div></div>';
    /* attached detail rows / folds */
    if(k==="c80ccc")h+=fold("dpccc","b","Identifier details for 80CCC",(S.ded.pen80ccc||[]).length?(S.ded.pen80ccc||[]).length+" rows":"optional",dedPenTbl("ded.pen80ccc"));
    if(k==="c80ccd1b")h+=fold("dpran","d","PRAN of the taxpayer","",row("PRAN",inp("ded.v.pran",{max:12}),{ind:1,hint:"permanent retirement account number"}));
    if(k==="c80ddb"&&N(S.ded.v.c80ddb)){
      h+=row("Claimed for",sel("ded.v.ddb_type",DED_DDBTYPE,{blank:false}),{req:1,ind:1,hint:"₹40,000, or ₹1,00,000 for a senior citizen"});
      h+=row("Name of the specified disease",sel("ded.v.ddb_disease",DED_DISEASE),{req:1,ind:1});}
    if(k==="c80gg"&&N(S.ded.v.c80gg))h+=row("Acknowledgement number of Form 10BA",inp("ded.v.ack10ba",{max:15}),{req:1,ind:1,hint:"fifteen digits"});
    if(k==="c80ia")h+=fold("dia","p","Schedule 80-IA — undertaking",N(S.ded.ia.amt)?RS(N(S.ded.ia.amt)):"optional",
      row("Section / sub-clause code",inp("ded.ia.code",{max:20,ph:"e.g. 80-IA(4)(iv)"}),{ind:1})+row("Amount of deduction",inp("ded.ia.amt",{n:1}),{ind:1}));
    if(k==="c80ib")h+=fold("dib","r","Schedule 80-IB — undertaking",N(S.ded.ib.amt)?RS(N(S.ded.ib.amt)):"optional",
      row("Section / sub-clause code",inp("ded.ib.code",{max:20,ph:"e.g. 80-IB(11A)"}),{ind:1})+row("Amount of deduction",inp("ded.ib.amt",{n:1}),{ind:1}));
    if(k==="c80ie")h+=fold("die","t","Schedule 80-IE — special-category State",N(S.ded.ie.amt)?RS(N(S.ded.ie.amt)):"optional",
      row("State / undertaking",inp("ded.ie.code",{max:20,ph:"e.g. Assam"}),{ind:1})+row("Amount of deduction",inp("ded.ie.amt",{n:1}),{ind:1}));
    if(k==="c80qqb"&&N(S.ded.v.c80qqb))h+=row("Acknowledgement number of Form 10CCD",inp("ded.v.ack10ccd",{max:15}),{req:1,ind:1});
    if(k==="c80rrb"&&N(S.ded.v.c80rrb))h+=row("Acknowledgement number of Form 10CCE",inp("ded.v.ack10cce",{max:15}),{req:1,ind:1});
  });
  /* part totals */
  h+=row("Total deduction under Part B",cell(V.partB),{ref:"48",cls:"tot"});
  h+=row("Total deduction under Part C",cell(V.partC),{ref:"62",cls:"tot"});
  h+=row("Total deduction under Part CA and D",cell(V.partCAandD),{ref:"69",cls:"tot"});
  if(V.clipped)h+=note("The Chapter VI-A total is limited to the gross total income (less income taxed at special rates).","warn");
  h+=row("Total deductions under Chapter VI-A (1 + 2 + 3)",cell(V.allowed),{ref:"70",cls:"grand"});

  /* ---------------- the schedules behind the figures ---------------- */
  h+='<div class="cgband">The schedules behind the figures</div>';
  /* 80C */
  const c80sum=(S.ded.c80c||[]).reduce((s,r)=>s+N(r.amt),0);
  h+=card("d80c","Section 80C — the items",c80sum?RS(c80sum):"",
    grid("ded.c80c",[{k:"amt",h:"Amount eligible under 80C",t:"num",w:"220px",req:1},
      {k:"id",h:"Policy / document identification number",t:"txt",w:"auto",req:1,max:50}],S.ded.c80c||[],
      {min:"620px",empty:"No item listed.",add:"Add an item",foot:[{l:1,v:"Total under 80C",span:1},{v:c80sum}]}));
  /* 80D */
  const d=S.ded.d80||{};
  h+=card("d80d","Schedule 80D — health insurance",D8.eligible?RS(D8.eligible):"",
    row("Are you or any family member (excluding parents) a senior citizen?",
      sel("ded.d80.selfSr",[["N","No"],["Y","Yes"],["N/A","Not claiming for self or family"]],{blank:false}),{req:1})+
    (d.selfSr==="N"?(sub("a · Self and family")+sub("(i) Health insurance")+dedInsTbl("ded.d80.selfIns")+row("(ii) Preventive health check-up",inp("ded.d80.selfPHC",{n:1}),{ind:1})):"")+
    (d.selfSr==="Y"?(sub("b · Self and family — senior citizen")+sub("(i) Health insurance")+dedInsTbl("ded.d80.selfSrIns")+row("(ii) Preventive health check-up",inp("ded.d80.selfSrPHC",{n:1}),{ind:1})+row("(iii) Medical expenditure — only where no insurance is taken",inp("ded.d80.selfSrMed",{n:1}),{ind:1})):"")+
    row("Is any one of your parents a senior citizen?",sel("ded.d80.parSr",[["N","No"],["Y","Yes"],["N/A","Not claiming for parents"]],{blank:false}),{req:1})+
    (d.parSr==="N"?(sub("a · Parents")+sub("(i) Health insurance")+dedInsTbl("ded.d80.parIns")+row("(ii) Preventive health check-up",inp("ded.d80.parPHC",{n:1}),{ind:1})):"")+
    (d.parSr==="Y"?(sub("b · Parents — senior citizen")+sub("(i) Health insurance")+dedInsTbl("ded.d80.parSrIns")+row("(ii) Preventive health check-up",inp("ded.d80.parSrPHC",{n:1}),{ind:1})+row("(iii) Medical expenditure — only where no insurance is taken",inp("ded.d80.parSrMed",{n:1}),{ind:1})):"")+
    row("Self and family — eligible",cell(D8.selfTot),{cls:"tot",hint:D8.selfSr?"up to ₹50,000":"up to ₹25,000"})+
    row("Parents — eligible",cell(D8.parTot),{cls:"tot",hint:D8.parSr?"up to ₹50,000":"up to ₹25,000"})+
    row("Eligible amount of deduction",cell(D8.eligible),{cls:"grand",hint:"check-up sits inside the ceilings, ₹5,000 in all"}));
  /* 80DD */
  h+=card("d80dd","Schedule 80DD — a dependant with a disability",N((S.ded.dd80||{}).amt)?RS(N(S.ded.dd80.amt)):"",
    row("Nature of disability",sel("ded.dd80.nature",DED_DDNAT),{req:1})+row("Type of disability",sel("ded.dd80.type",DED_DTYPE),{req:1})+
    row("Amount of deduction",inp("ded.dd80.amt",{n:1}),{req:1,hint:"₹75,000, or ₹1,25,000 for a severe disability"})+
    row("Dependant",sel("ded.dd80.dep",DED_DEP),{req:1})+row("PAN of the dependant",inp("ded.dd80.pan",{max:10}))+
    row("Aadhaar of the dependant",inp("ded.dd80.aadhaar",{max:12}))+row("Date of filing of Form 10-IA",dte("ded.dd80.f10dt"))+
    row("Acknowledgement number of Form 10-IA",inp("ded.dd80.f10ack",{max:15}))+
    row("Acknowledgement number of Form 10-IA (11A)",inp("ded.dd80.f10ia",{max:15}))+row("UDID number",inp("ded.dd80.udid",{max:18}))+
    formNote("<b>Form 10-IA</b> has to be filed before the return."));
  /* 80U */
  h+=card("d80u","Schedule 80U — the person has a disability",N((S.ded.u80||{}).amt)?RS(V.out.c80u||0):"",
    row("Nature of the disability",sel("ded.u80.nature",DED_UNAT),{req:1})+row("Type of disability",sel("ded.u80.type",DED_DTYPE),{req:1})+
    row("Amount of deduction",inp("ded.u80.amt",{n:1}),{req:1,hint:"₹75,000, or ₹1,25,000 for a severe disability"})+
    row("Date of filing of Form 10-IA",dte("ded.u80.dt"))+row("Acknowledgement number of Form 10-IA",inp("ded.u80.ack",{max:15}))+
    row("Acknowledgement number of Form 10-IA (11A)",inp("ded.u80.f10ia",{max:15}))+
    row("UDID number",inp("ded.u80.udid",{max:18}))+formNote("<b>Form 10-IA</b> has to be filed before the return."));
  /* 80E group */
  const e=S.ded.e80||{}; const et=k=>(e[k]||[]).reduce((s,r)=>s+N(r.interest),0);
  const etAll=et("e")+et("ee")+et("eea")+et("eeb");
  h+=card("d80e","80E, 80EE, 80EEA, 80EEB — loans, lender by lender",etAll?RS(etAll):"",
    sub("80E — interest on a loan taken for higher education")+dedLoanTbl("ded.e80.e")+
    sub("80EE — interest on a loan taken for a residential house")+dedLoanTbl("ded.e80.ee")+
    sub("80EEA — interest on a loan taken for certain house property")+row("Stamp-duty value of the property",inp("ded.e80.eeaSdv",{n:1}),{req:1,hint:"not over ₹45 lakh for the deduction"})+dedLoanTbl("ded.e80.eea")+
    sub("80EEB — interest on a loan taken to buy an electric vehicle")+dedLoanTbl("ded.e80.eeb"));
  /* 80G */
  const g80sum=(S.ded.g80||[]).reduce((s,r)=>s+N(r.amt),0);
  h+=card("d80g","Schedule 80G — donations, donee by donee",g80sum?RS(g80sum):"",
    note("<b>Where any row is filled, every field in that row becomes mandatory.</b>")+
    grid("ded.g80",[{k:"bucket",h:"Bucket",t:"sel",w:"220px",req:1,opts:[["A","100% without a qualifying limit"],["B","50% without a qualifying limit"],["C","100% subject to the limit"],["D","50% subject to the limit"]]},
      {k:"name",h:"Name of the donee",t:"txt",w:"auto",req:1},{k:"addr",h:"Address",t:"txt",w:"auto",req:1},{k:"city",h:"City",t:"txt",w:"120px",req:1},
      {k:"state",h:"State",t:"sel",w:"150px",req:1,opts:DED_STOPTS},{k:"pin",h:"PIN",t:"txt",w:"90px",max:6,req:1},
      {k:"pan",h:"PAN of the donee",t:"txt",w:"120px",max:10,req:1},{k:"arn",h:"ARN — donation reference",t:"txt",w:"150px",max:25},
      {k:"cash",h:"In cash",t:"num",w:"100px"},{k:"other",h:"Other mode",t:"num",w:"100px"},
      {k:"ref",h:"Transaction reference",t:"txt",w:"160px",max:50},{k:"ifsc",h:"IFSC",t:"txt",w:"110px",max:11},
      {k:"amt",h:"Total",t:"num",w:"120px",req:1}],S.ded.g80||[],{min:"2000px",empty:"No donation listed.",add:"Add a donee",
      foot:[{l:1,v:"Total donated",span:12},{v:g80sum}]})+
    note("A donation in cash above ₹2,000 gives no deduction. For any other mode the transaction reference and IFSC are mandatory.","warn"));
  /* 80GGA + RA */
  const ggasum=(S.ded.gga||[]).reduce((s,r)=>s+N(r.amt),0);
  h+=card("d80gga","Schedule 80GGA — scientific research or rural development",ggasum?RS(ggasum):"",
    grid("ded.gga",[{k:"clause",h:"Relevant clause",t:"sel",w:"160px",req:1,opts:DED_GGACLAUSE},{k:"name",h:"Name of the donee",t:"txt",w:"auto",req:1},
      {k:"addr",h:"Address",t:"txt",w:"auto",req:1},{k:"city",h:"City",t:"txt",w:"110px",req:1},
      {k:"state",h:"State",t:"sel",w:"140px",req:1,opts:DED_STOPTS},{k:"pin",h:"PIN",t:"txt",w:"80px",max:6,req:1},
      {k:"pan",h:"PAN of the donee",t:"txt",w:"120px",max:10,req:1},{k:"mode",h:"Mode",t:"sel",w:"110px",req:1,opts:[["CASH","Cash"],["OTH","Other"]]},
      {k:"amt",h:"Amount",t:"num",w:"120px",req:1}],S.ded.gga||[],{min:"1600px",empty:"No donation listed.",add:"Add a donee"})+
    note("A donation in cash above ₹2,000 gives no deduction. 80GGA is not available where there is business income.","warn")+
    sub("Schedule RA — research associations etc. under 35(1)(ii)/(iia)/(iii)/35(2AA)")+
    grid("ded.ra",[{k:"name",h:"Name of the donee",t:"txt",w:"auto",req:1},{k:"addr",h:"Address",t:"txt",w:"auto",req:1},
      {k:"city",h:"City or town or district",t:"txt",w:"140px",req:1},{k:"state",h:"State code",t:"sel",w:"140px",req:1,opts:DED_STOPTS},
      {k:"pin",h:"PIN code",t:"txt",w:"90px",max:6,req:1},{k:"pan",h:"PAN of the donee",t:"txt",w:"120px",max:10,req:1},
      {k:"cash",h:"Donation in cash",t:"num",w:"120px"},{k:"other",h:"Donation in other mode",t:"num",w:"140px"}],
      S.ded.ra||[],{min:"1300px",empty:"None listed.",add:"Add a donee"}));
  /* 80GGC */
  const ggcsum=(S.ded.ggc||[]).reduce((s,r)=>s+N(r.amt),0);
  h+=card("d80ggc","Schedule 80GGC — contribution to a political party / electoral trust",ggcsum?RS(ggcsum):"",
    grid("ded.ggc",[{k:"dt",h:"Date of contribution",t:"date",w:"130px",req:1},{k:"name",h:"Name of the party or trust",t:"txt",w:"auto",req:1},
      {k:"pan",h:"PAN",t:"txt",w:"120px",max:10,req:1},{k:"mode",h:"Mode",t:"sel",w:"120px",req:1,opts:[["CASH","Cash"],["OTH","Other than cash"]]},
      {k:"ref",h:"Transaction reference",t:"txt",w:"160px",max:50},{k:"ifsc",h:"IFSC",t:"txt",w:"120px",max:11},{k:"amt",h:"Amount",t:"num",w:"120px",req:1}],
      S.ded.ggc||[],{min:"1100px",empty:"No contribution listed.",add:"Add a contribution"})+
    note("A contribution in cash gives no deduction at all.","warn"));
  /* 10AA (SEZ) — a section-10AA deduction, kept with the deductions screen */
  const aasum=(S.ded.aa10||[]).reduce((s,r)=>s+N(r.amt),0);
  h+=card("d10aa","Schedule 10AA — units in a Special Economic Zone",(V.ded10AA||0)?RS(V.ded10AA):(aasum?RS(aasum):""),
    (isNew()?note("Closed under the new regime (section 115BAC).","stop"):"")+
    grid("ded.aa10",[{k:"ay",h:"Assessment year the unit began to manufacture / provide services",t:"txt",w:"auto",req:1,ph:"e.g. 2019-20"},
      {k:"amt",h:"Amount of deduction",t:"num",w:"200px",req:1}],S.ded.aa10||[],{min:"640px",empty:"No unit listed.",add:"Add a unit",
      foot:[{l:1,v:"Total deduction under section 10AA",span:1},{v:aasum}]})+
    note("Under section 10AA(1) the deduction is available up to assessment year 2022-23.","warn"));

  /* how the total income comes out */
  h+='<div class="cgband">How the total income comes out</div>';
  h+=row("Gross total income",cell(S.C.gti||V.gtiEst||0),{cls:"tot",hint:"set by Part B — total income and tax"});
  h+=row("Less: deductions under Chapter VI-A",cell(-(V.allowed||0)));
  if(V.ded10AA)h+=row("Less: deduction under section 10AA",cell(-(V.ded10AA||0)));
  h+=row("Total income (indicative)",cell(Math.max(0,(S.C.gti||V.gtiEst||0)-(V.allowed||0)-(V.ded10AA||0))),{cls:"grand",hint:"the tax section rounds and finalises this"});
  return h;
}

/* ===================================================================
   expDed — write the schema blocks onto j
   =================================================================== */
function expDed(j){
  const V=S.C.ded||{out:{},fed:{}}; const out=V.out||{}, fed=V.fed||{};
  const claim=k=>fed[k]!==undefined?N(fed[k]):N(S.ded.v[k]);

  /* ---- ScheduleVIA (always present; required totals even at zero) ---- */
  const usr={},ded={};
  const regOpen=k=>!isNew()||DED_VIA_NEW.indexOf(k)>=0;   /* claimed side blank for items closed by 115BAC */
  Object.keys(DED_MAP).forEach(k=>{const f=DED_MAP[k];const c=claim(k);
    if(c&&regOpen(k))put(usr,f,n0(c));
    if(out[k])put(ded,f,n0(out[k]));});
  /* 80CCH + any-other roll into AnyOthSec80CCH */
  const cchClaim=claim("c80cch")+(regOpen("c80oth")?claim("c80oth"):0);
  const cchOut=n0(out.c80cch)+n0(out.c80oth);
  if(cchClaim)usr.AnyOthSec80CCH=n0(Math.min(cchClaim,288000));
  if(cchOut)ded.AnyOthSec80CCH=n0(Math.min(cchOut,288000));

  /* the four totals on the user (claimed) side */
  usr.TotPartBchapterVIA=n0(V.partB);
  usr.TotPartCchapterVIA=n0(V.partC);
  usr.TotPartCAandDchapterVIA=n0(V.partCAandD);
  usr.TotalChapVIADeductions=n0(V.total);
  /* the four totals on the calculated (allowed) side — trim to the allowed cap */
  ded.TotPartBchapterVIA=n0(V.partB);
  ded.TotPartCchapterVIA=n0(V.partC);
  ded.TotPartCAandDchapterVIA=n0(V.partCAandD);
  ded.TotalChapVIADeductions=n0(V.allowed);

  /* identifier / PRAN / ddb / ack — on the claimed object (VI_A.md) */
  const pc=(S.ded.pen80ccc||[]).filter(r=>N(r.amt));
  if(pc.length)usr.PensionContribution80CCC=pc.map(r=>({TypeofIdentifier:r.type==="OTHPRAN"?"OTHPRAN":"PRAN",
    NameofIdentifier:(sv(r.id)||"NA").slice(0,125),Amount:n0(r.amt)}));
  if(/^\d{12}$/.test(st0(S.ded.v.pran)))usr.PRANDtls=[{PRANNum:st0(S.ded.v.pran)}];
  if(claim("c80ddb")){usr.Section80DDBUsrType=S.ded.v.ddb_type==="2"?"2":"1";
    if(st0(S.ded.v.ddb_disease))usr.NameOfSpecDisease80DDB=st0(S.ded.v.ddb_disease);}
  if(claim("c80gg")&&/^\d{15}$/.test(st0(S.ded.v.ack10ba)))usr.Form10BAAckNum=st0(S.ded.v.ack10ba);
  if(claim("c80qqb")&&/^\d{15}$/.test(st0(S.ded.v.ack10ccd)))usr.Form10CCDAckNum=st0(S.ded.v.ack10ccd);
  if(claim("c80rrb")&&/^\d{15}$/.test(st0(S.ded.v.ack10cce)))usr.Form10CCEAckNum=st0(S.ded.v.ack10cce);
  j.ScheduleVIA={UsrDeductUndChapVIA:usr,DeductUndChapVIA:ded};

  /* Every detail sub-schedule below belongs to a deduction that section
     115BAC closes; under the new regime they must be blank (A696/A710/
     A646/A652/A661/A687/A688/A633), so emit them only in the old regime. */
  if(isNew())return;

  /* ---- Schedule80C ---- */
  const c80=(S.ded.c80c||[]).filter(r=>N(r.amt));
  if(c80.length)j.Schedule80C={Schedule80CDtls:c80.map(r=>({Amount:n0(r.amt),IdentificationNo:(sv(r.id)||"NA").slice(0,50)})),
    TotalAmt:n0(c80.reduce((a,r)=>a+N(r.amt),0))};

  /* ---- Schedule80D ---- */
  const D8=S.C.d80||{}, d=S.ded.d80||{};
  if(D8.eligible||(d.selfIns||[]).length||(d.parIns||[]).length||(d.selfSrIns||[]).length||(d.parSrIns||[]).length){
    const insArr=k=>(d[k]||[]).filter(r=>N(r.amt)).map(r=>({InsurerName:(sv(r.insurer)||"NA").slice(0,125),PolicyNo:(sv(r.policy)||"NA").slice(0,75),HealthInsAmt:n0(r.amt)}));
    const blk={SelfAndFamily:n0(D8.selfSr?0:D8.selfTot),SelfAndFamilySeniorCitizen:n0(D8.selfSr?D8.selfTot:0),
      Parents:n0(D8.parSr?0:D8.parTot),ParentsSeniorCitizen:n0(D8.parSr?D8.parTot:0),EligibleAmountOfDedn:n0(D8.eligible)};
    blk.SeniorCitizenFlag=d.selfSr==="N/A"?"S":(D8.selfSr?"Y":"N");
    blk.ParentsSeniorCitizenFlag=d.parSr==="N/A"?"P":(D8.parSr?"Y":"N");
    if(D8.aHI){blk.HealthInsPremSlfFam=n0(D8.aHI);const a=insArr("selfIns");if(a.length)blk.Sec80DSelfFamHIDtls={Sch80DInsDtls:a,TotalPayments:n0(D8.aHI)};}
    if(D8.aPHCu)blk.PrevHlthChckUpSlfFam=n0(D8.aPHCu);
    if(D8.bHI){blk.HlthInsPremSlfFamSrCtzn=n0(D8.bHI);const a=insArr("selfSrIns");if(a.length)blk.Sec80DSelfFamSrCtznHIDtls={Sch80DInsDtls:a,TotalPayments:n0(D8.bHI)};}
    if(D8.bPHCu)blk.PrevHlthChckUpSlfFamSrCtzn=n0(D8.bPHCu); if(D8.bMed)blk.MedicalExpSlfFamSrCtzn=n0(D8.bMed);
    if(D8.cHI){blk.HlthInsPremParents=n0(D8.cHI);const a=insArr("parIns");if(a.length)blk.Sec80DParentsHIDtls={Sch80DInsDtls:a,TotalPayments:n0(D8.cHI)};}
    if(D8.cPHCu)blk.PrevHlthChckUpParents=n0(D8.cPHCu);
    if(D8.dHI){blk.HlthInsPremParentsSrCtzn=n0(D8.dHI);const a=insArr("parSrIns");if(a.length)blk.Sec80DParentsSrCtznHIDtls={Sch80DInsDtls:a,TotalPayments:n0(D8.dHI)};}
    if(D8.dPHCu)blk.PrevHlthChckUpParentsSrCtzn=n0(D8.dPHCu); if(D8.dMed)blk.MedicalExpParentsSrCtzn=n0(D8.dMed);
    j.Schedule80D={Sec80DSelfFamSrCtznHealth:blk};
  }
  /* ---- Schedule80DD ---- */
  if(N((S.ded.dd80||{}).amt)){const x=S.ded.dd80;j.Schedule80DD={NatureOfDisability:x.nature==="2"?"2":"1",
    TypeOfDisability:x.type==="2"?"2":"1",DeductionAmount:n0(out.c80dd),DependentType:st0(x.dep)||"1"};
    if(PAN_RE.test(st0(x.pan).toUpperCase()))j.Schedule80DD.DependentPan=st0(x.pan).toUpperCase();
    if(AADH.test(st0(x.aadhaar)))j.Schedule80DD.DependentAadhaar=st0(x.aadhaar);
    if(ISO(x.f10dt))j.Schedule80DD.Form10IAFilingDate=ISO(x.f10dt);
    if(/^\d{15}$/.test(st0(x.f10ack)))j.Schedule80DD.Form10IAAckNum=st0(x.f10ack);
    if(sv(x.f10ia))j.Schedule80DD.FormAckNum11A=sv(x.f10ia).slice(0,15);
    if(sv(x.udid))j.Schedule80DD.UDIDNum=sv(x.udid).slice(0,18);}
  /* ---- Schedule80U ---- */
  if(N((S.ded.u80||{}).amt)){const x=S.ded.u80||{};j.Schedule80U={NatureOfDisability:x.nature==="2"?"2":"1",
    TypeOfDisability:x.type==="2"?"2":"1",DeductionAmount:n0(out.c80u)};
    if(ISO(x.dt))j.Schedule80U.Form10IAFilingDate=ISO(x.dt);
    if(/^\d{15}$/.test(st0(x.ack)))j.Schedule80U.Form10IAAckNum=st0(x.ack);
    if(sv(x.f10ia))j.Schedule80U.FormAckNum11A=sv(x.f10ia).slice(0,15);
    if(sv(x.udid))j.Schedule80U.UDIDNum=sv(x.udid).slice(0,18);}
  /* ---- Schedule80E / 80EE / 80EEA / 80EEB ---- */
  const e=S.ded.e80||{};
  const loans=(arr,intKey)=>(arr||[]).filter(r=>N(r.interest)).map(r=>{const o={LoanTknFrom:r.from==="I"?"I":"B",
    BankOrInstnName:(sv(r.name)||"NA").slice(0,125),LoanAccNoOfBankOrInstnRefNo:(sv(r.acno)||"NA").slice(0,20),
    DateofLoan:ISO(r.dt)||"2025-04-01",TotalLoanAmt:n0(r.amt),LoanOutstndngAmt:n0(r.os)};
    if(intKey==="Interest80EEB")o.VehicleRegNo=(sv(r.reg)||"NA").slice(0,11);o[intKey]=n0(r.interest);return o;});
  [["e","Schedule80E","Schedule80EDtls","Interest80E","TotalInterest80E"],
   ["ee","Schedule80EE","Schedule80EEDtls","Interest80EE","TotalInterest80EE"],
   ["eea","Schedule80EEA","Schedule80EEADtls","Interest80EEA","TotalInterest80EEA"],
   ["eeb","Schedule80EEB","Schedule80EEBDtls","Interest80EEB","TotalInterest80EEB"]].forEach(([kk,blk,dk,ik,tot])=>{
    const arr=loans(e[kk],ik);
    if(arr.length){const o={};o[dk]=arr;o[tot]=n0(arr.reduce((a,r)=>a+N(r[ik]),0));
      if(kk==="eea")o.PropStmpDtyVal=n0(e.eeaSdv);j[blk]=o;}});
  /* ---- Schedule80G ---- */
  {const rows=(S.ded.g80||[]).filter(r=>N(r.amt)||N(r.cash)||N(r.other));
   if(rows.length){const mk=r=>{const o={DoneeWithPanName:(sv(r.name)||"NA").slice(0,125),DoneePAN:(st0(r.pan)||"NA").toUpperCase(),
      AddressDetail:{AddrDetail:(sv(r.addr)||"NA").slice(0,200),CityOrTownOrDistrict:(sv(r.city)||"NA").slice(0,50),
        StateCode:st0(r.state)||"99",PinCode:/^\d{6}$/.test(st0(r.pin))?+r.pin:100000},
      DonationAmtCash:n0(r.cash),DonationAmtOtherMode:n0(r.other),
      DonationAmt:n0(N(r.amt)||N(r.cash)+N(r.other)),EligibleDonationAmt:n0(N(r.cash)>2000?N(r.other):N(r.amt)||N(r.cash)+N(r.other))};
      if(sv(r.arn))o.ArnNbr=sv(r.arn).slice(0,25);
      if(sv(r.ref))o.TransactionRefNum=sv(r.ref).slice(0,50);
      if(sv(r.ifsc))o.IFSCCode=st0(r.ifsc).toUpperCase().slice(0,11);return o;};
    const bkt={A:{arr:"Don100Percent",tc:"TotDon100PercentCash",to:"TotDon100PercentOtherMode",tt:"TotDon100Percent",te:"TotEligibleDon100Percent"},
      B:{arr:"Don50PercentNoApprReqd",tc:"TotDon50PercentNoApprReqdCash",to:"TotDon50PercentNoApprReqdOtherMode",tt:"TotDon50PercentNoApprReqd",te:"TotEligibleDon50Percent"},
      C:{arr:"Don100PercentApprReqd",tc:"TotDon100PercentApprReqdCash",to:"TotDon100PercentApprReqdOtherMode",tt:"TotDon100PercentApprReqd",te:"TotEligibleDon100PercentApprReqd"},
      D:{arr:"Don50PercentApprReqd",tc:"TotDon50PercentApprReqdCash",to:"TotDon50PercentApprReqdOtherMode",tt:"TotDon50PercentApprReqd",te:"TotEligibleDon50PercentApprReqd"}};
    const G={};let gc=0,go=0,gt=0;
    Object.keys(bkt).forEach(b=>{const rs=rows.filter(r=>(r.bucket||"A")===b);if(!rs.length)return;
      const cash=rs.reduce((a,r)=>a+N(r.cash),0),oth=rs.reduce((a,r)=>a+N(r.other),0),tot=rs.reduce((a,r)=>a+N(N(r.amt)||N(r.cash)+N(r.other)),0);
      const B=bkt[b];G[B.arr]={DoneeWithPan:rs.map(mk)};G[B.arr][B.tc]=n0(cash);G[B.arr][B.to]=n0(oth);G[B.arr][B.tt]=n0(tot);
      G[B.arr][B.te]=n0(rs.reduce((a,r)=>a+n0(N(r.cash)>2000?N(r.other):N(r.amt)||N(r.cash)+N(r.other)),0));
      gc+=cash;go+=oth;gt+=tot;});
    G.TotalDonationsUs80GCash=n0(gc);G.TotalDonationsUs80GOtherMode=n0(go);G.TotalDonationsUs80G=n0(gt);
    G.TotalEligibleDonationsUs80G=n0(out.c80g);j.Schedule80G=G;}}
  /* ---- Schedule80GGA ---- */
  {const rows=(S.ded.gga||[]).filter(r=>N(r.amt));
   if(rows.length){const cash=rows.reduce((a,r)=>a+(r.mode==="CASH"?N(r.amt):0),0),oth=rows.reduce((a,r)=>a+(r.mode!=="CASH"?N(r.amt):0),0);
    j.Schedule80GGA={DonationDtlsSciRsrchRuralDev:rows.map(r=>({RelevantClauseUndrDedClaimed:st0(r.clause)||"80GGA2a",
      NameOfDonee:(sv(r.name)||"NA").slice(0,125),AddressDetail:{AddrDetail:(sv(r.addr)||"NA").slice(0,200),
        CityOrTownOrDistrict:(sv(r.city)||"NA").slice(0,50),StateCode:st0(r.state)||"99",PinCode:/^\d{6}$/.test(st0(r.pin))?+r.pin:100000},
      DoneePAN:(st0(r.pan)||"NA").toUpperCase(),DonationAmtCash:n0(r.mode==="CASH"?r.amt:0),DonationAmtOtherMode:n0(r.mode!=="CASH"?r.amt:0),
      DonationAmt:n0(r.amt),EligibleDonationAmt:n0(r.mode==="CASH"&&N(r.amt)>2000?0:N(r.amt))})),
      TotalDonationAmtCash80GGA:n0(cash),TotalDonationAmtOtherMode80GGA:n0(oth),TotalDonationsUs80GGA:n0(cash+oth),
      TotalEligibleDonationAmt80GGA:n0(out.c80gga)};}}
  /* ---- Schedule80RA (35(1) research associations) ---- */
  {const rows=(S.ded.ra||[]).filter(r=>N(r.cash)||N(r.other));
   if(rows.length){const cash=rows.reduce((a,r)=>a+N(r.cash),0),oth=rows.reduce((a,r)=>a+N(r.other),0);
    j.Schedule80RA={DonationDtlsRsrchAssctn:rows.map(r=>({NameOfDonee:(sv(r.name)||"NA").slice(0,125),
      AddressDetail:{AddrDetail:(sv(r.addr)||"NA").slice(0,200),CityOrTownOrDistrict:(sv(r.city)||"NA").slice(0,50),
        StateCode:st0(r.state)||"99",PinCode:/^\d{6}$/.test(st0(r.pin))?+r.pin:100000},DoneePAN:(st0(r.pan)||"NA").toUpperCase(),
      DonationAmtCash:n0(r.cash),DonationAmtOtherMode:n0(r.other),DonationAmt:n0(N(r.cash)+N(r.other)),EligibleDonationAmt:n0(N(r.cash)+N(r.other))})),
      TotalDonationAmtCash80RA:n0(cash),TotalDonationAmtOtherMode80RA:n0(oth),TotalDonationsUs80RA:n0(cash+oth),TotalEligibleDonationAmt80RA:n0(cash+oth)};}}
  /* ---- Schedule80GGC ---- */
  {const rows=(S.ded.ggc||[]).filter(r=>N(r.amt));
   if(rows.length){const cash=rows.reduce((a,r)=>a+(r.mode==="CASH"?N(r.amt):0),0),oth=rows.reduce((a,r)=>a+(r.mode!=="CASH"?N(r.amt):0),0);
    j.Schedule80GGC={Schedule80GGCDetails:rows.map(r=>{const o={DonationDate:ISO(r.dt)||"2025-04-01",
      DonationAmtCash:n0(r.mode==="CASH"?r.amt:0),DonationAmtOtherMode:n0(r.mode!=="CASH"?r.amt:0),
      DonationAmt:n0(r.amt),EligibleDonationAmt:n0(r.mode==="CASH"?0:N(r.amt)),
      PoliticalPartyName:(sv(r.name)||"NA").slice(0,125),PoliticalPartyPAN:(st0(r.pan)||"NA").toUpperCase()};
      if(sv(r.ref))o.TransactionRefNum=sv(r.ref).slice(0,50);if(sv(r.ifsc))o.IFSCCode=st0(r.ifsc).toUpperCase().slice(0,11);return o;}),
      TotalDonationAmtCash80GGC:n0(cash),TotalDonationAmtOtherMode80GGC:n0(oth),TotalDonationsUs80GGC:n0(cash+oth),
      TotalEligibleDonationAmt80GGC:n0(out.c80ggc)};}}
  /* ---- Schedule80_IA / 80_IB / 80_IC (80-IE) — the undertaking detail ---- */
  if(N(S.ded.ia.amt)){const amt=n0(S.ded.ia.amt);
    /* Sch80SectionCode / Sch80LocOrDescCode are fixed schema codes (80-IA / POWER),
       not the sub-clause label the filer types. */
    j.Schedule80_IA={Sch80SectionCode:"80-IA",
      DeductUs80_IA_4_iv:{Sch80LocOrDescCode:"POWER",Sch80DeductAmtDtls:[{DeductAmountSec80:amt}]},
      TotSchedule80_IA:n0(out.c80ia)};}
  if(N(S.ded.ib.amt)){const amt=n0(S.ded.ib.amt);
    /* the three sub-undertaking objects are required; each needs its fixed LocOrDescCode,
       but Sch80DeductAmtDtls is optional and only carried where an amount exists. */
    j.Schedule80_IB={Sch80SectionCode:"80-IB",
      DeductMinOilUs80_IB_9_Und:{Sch80LocOrDescCode:"COMM_PROD",Sch80DeductAmtDtls:[{DeductAmountSec80:amt}]},
      DeductHousUs80_IB_10_Und:{Sch80LocOrDescCode:"HOUSING_PROJECT"},
      DeductFoodGrainUs80_IB_11A_Und:{Sch80LocOrDescCode:"STOR_TRANS"},TotSchedule80_IB:n0(out.c80ib)};}
  if(N(S.ded.ie.amt)){const amt=n0(S.ded.ie.amt);const mkU=v=>({Sch80LocOrDescCode:v||"NA",Sch80DeductAmtDtls:v?[{DeductAmountSec80:amt}]:[]});
    j.Schedule80_IC={Sch80SectionCode:st0(S.ded.ie.code)||"80IE",
      DeductInNorthEast:{Assam_Und:mkU(st0(S.ded.ie.code)),ArunachalPradesh_Und:mkU(""),Manipur_Und:mkU(""),Mizoram_Und:mkU(""),
        Meghalaya_Und:mkU(""),Nagaland_Und:mkU(""),Tripura_Und:mkU(""),Sikkim_Und:mkU(""),TotDeductInNorthEast:n0(out.c80ie)},TotSchedule80_IC:n0(out.c80ie)};}
  /* ---- Schedule10AA (SEZ) ---- */
  {const rows=(S.ded.aa10||[]).filter(r=>N(r.amt));
   if(rows.length&&!isNew()){j.Schedule10AA={DeductSEZ:{DedUs10Detail:{
      Undertaking:{DedFromUndertakingWithAy:rows.map(r=>({AssmtYrUnit:st0(r.ay)||"2022-23",DedUs10Sub:n0(r.amt)}))},
      TotalDedUs10Sub:n0(V.ded10AA)}}};}}
}

/* ===================================================================
   impDed — read the schema blocks back into S.ded
   =================================================================== */
function impDed(I3){
  const got=[]; S.ded=S.ded||{}; if(!S.ded.v)S.ded.v={};
  const g_=(o,p)=>{try{return p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);}catch(e){return undefined;}};
  if(I3.ScheduleVIA){const U=I3.ScheduleVIA.UsrDeductUndChapVIA||{};
    const RMAP={Section80C:"c80c",Section80CCC:"c80ccc",Section80CCDEmployeeOrSE:"c80ccd1",Section80CCD1B:"c80ccd1b",
      Section80CCDEmployer:"c80ccd2",Section80DD:"c80dd",Section80DDB:"c80ddb",Section80GG:"c80gg",
      Section80IAB:"c80iab",Section80IBA:"c80iba",Section80JJA:"c80jja",Section80JJAA:"c80jjaa",
      Section80QQB:"c80qqb",Section80RRB:"c80rrb",Section80TTA:"c80tta",Section80TTB:"c80ttb",AnyOthSec80CCH:"c80cch"};
    Object.keys(RMAP).forEach(k=>{if(U[k])S.ded.v[RMAP[k]]=U[k];});
    S.ded.v.pran=g_(U,"PRANDtls.0.PRANNum")||"";
    S.ded.v.ddb_type=U.Section80DDBUsrType||"1"; S.ded.v.ddb_disease=U.NameOfSpecDisease80DDB||"";
    S.ded.v.ack10ba=U.Form10BAAckNum||""; S.ded.v.ack10ccd=U.Form10CCDAckNum||""; S.ded.v.ack10cce=U.Form10CCEAckNum||"";
    S.ded.pen80ccc=(U.PensionContribution80CCC||[]).map(r=>({type:r.TypeofIdentifier==="OTHPRAN"?"OTHPRAN":"PRAN",id:r.NameofIdentifier,amt:r.Amount}));
    if(U.Section80IA)S.ded.ia={code:"",amt:U.Section80IA}; if(U.Section80IB)S.ded.ib={code:"",amt:U.Section80IB};
    if(U.Section80IC)S.ded.ie={code:"",amt:U.Section80IC};
    got.push("Chapter VI-A deductions");}
  if(I3.Schedule80C)S.ded.c80c=(I3.Schedule80C.Schedule80CDtls||[]).map(r=>({amt:r.Amount,id:r.IdentificationNo}));
  if(I3.Schedule80D){const b=I3.Schedule80D.Sec80DSelfFamSrCtznHealth||{};const ins=k=>(g_(b,k+".Sch80DInsDtls")||[]).map(r=>({insurer:r.InsurerName,policy:r.PolicyNo,amt:r.HealthInsAmt}));
    S.ded.d80={selfSr:b.SeniorCitizenFlag==="S"?"N/A":(b.SeniorCitizenFlag||"N/A"),parSr:b.ParentsSeniorCitizenFlag==="P"?"N/A":(b.ParentsSeniorCitizenFlag||"N/A"),
      selfIns:ins("Sec80DSelfFamHIDtls"),selfPHC:nz(b.PrevHlthChckUpSlfFam),selfSrIns:ins("Sec80DSelfFamSrCtznHIDtls"),selfSrPHC:nz(b.PrevHlthChckUpSlfFamSrCtzn),selfSrMed:nz(b.MedicalExpSlfFamSrCtzn),
      parIns:ins("Sec80DParentsHIDtls"),parPHC:nz(b.PrevHlthChckUpParents),parSrIns:ins("Sec80DParentsSrCtznHIDtls"),parSrPHC:nz(b.PrevHlthChckUpParentsSrCtzn),parSrMed:nz(b.MedicalExpParentsSrCtzn)};
    got.push("Schedule 80D");}
  if(I3.Schedule80DD){const x=I3.Schedule80DD;S.ded.dd80={nature:x.NatureOfDisability,type:x.TypeOfDisability,amt:x.DeductionAmount,
    dep:x.DependentType,pan:x.DependentPan||"",aadhaar:x.DependentAadhaar||"",f10dt:dmy(x.Form10IAFilingDate),f10ack:x.Form10IAAckNum||"",f10ia:x.FormAckNum11A||"",udid:x.UDIDNum||""};}
  if(I3.Schedule80U){const x=I3.Schedule80U;S.ded.u80={nature:x.NatureOfDisability,type:x.TypeOfDisability,amt:x.DeductionAmount,
    dt:dmy(x.Form10IAFilingDate),ack:x.Form10IAAckNum||"",f10ia:x.FormAckNum11A||"",udid:x.UDIDNum||""};}
  {const ln=(blk,dk,ik)=>(g_(I3,blk+"."+dk)||[]).map(r=>({from:r.LoanTknFrom,name:r.BankOrInstnName,acno:r.LoanAccNoOfBankOrInstnRefNo,
      dt:dmy(r.DateofLoan),amt:r.TotalLoanAmt,os:r.LoanOutstndngAmt,reg:r.VehicleRegNo||"",interest:r[ik]}));
    S.ded.e80={e:ln("Schedule80E","Schedule80EDtls","Interest80E"),ee:ln("Schedule80EE","Schedule80EEDtls","Interest80EE"),
      eea:ln("Schedule80EEA","Schedule80EEADtls","Interest80EEA"),eeb:ln("Schedule80EEB","Schedule80EEBDtls","Interest80EEB"),
      eeaSdv:nz(g_(I3,"Schedule80EEA.PropStmpDtyVal"))};}
  if(I3.Schedule80G){const G=I3.Schedule80G;S.ded.g80=[];
    [["A","Don100Percent"],["B","Don50PercentNoApprReqd"],["C","Don100PercentApprReqd"],["D","Don50PercentApprReqd"]].forEach(([b,k])=>{
      (g_(G,k+".DoneeWithPan")||[]).forEach(r=>{const a=r.AddressDetail||{};S.ded.g80.push({bucket:b,name:r.DoneeWithPanName,addr:a.AddrDetail,
        city:a.CityOrTownOrDistrict,state:a.StateCode,pin:nz(a.PinCode)+"",pan:r.DoneePAN,arn:r.ArnNbr||"",cash:nz(r.DonationAmtCash),
        other:nz(r.DonationAmtOtherMode),ref:r.TransactionRefNum||"",ifsc:r.IFSCCode||"",amt:r.DonationAmt});});});
    got.push("Schedule 80G");}
  if(I3.Schedule80GGA)S.ded.gga=(I3.Schedule80GGA.DonationDtlsSciRsrchRuralDev||[]).map(r=>{const a=r.AddressDetail||{};
    return {clause:r.RelevantClauseUndrDedClaimed,name:r.NameOfDonee,addr:a.AddrDetail,city:a.CityOrTownOrDistrict,state:a.StateCode,
      pin:nz(a.PinCode)+"",pan:r.DoneePAN,mode:N(r.DonationAmtCash)?"CASH":"OTH",amt:r.DonationAmt};});
  if(I3.Schedule80RA)S.ded.ra=(I3.Schedule80RA.DonationDtlsRsrchAssctn||[]).map(r=>{const a=r.AddressDetail||{};
    return {name:r.NameOfDonee,addr:a.AddrDetail,city:a.CityOrTownOrDistrict,state:a.StateCode,pin:nz(a.PinCode)+"",pan:r.DoneePAN,
      cash:nz(r.DonationAmtCash),other:nz(r.DonationAmtOtherMode)};});
  if(I3.Schedule80GGC)S.ded.ggc=(I3.Schedule80GGC.Schedule80GGCDetails||[]).map(r=>({dt:dmy(r.DonationDate),name:r.PoliticalPartyName||"",
    pan:r.PoliticalPartyPAN||"",mode:N(r.DonationAmtCash)?"CASH":"OTH",ref:r.TransactionRefNum||"",ifsc:r.IFSCCode||"",amt:r.DonationAmt}));
  if(I3.Schedule80_IA)S.ded.ia={code:I3.Schedule80_IA.Sch80SectionCode||"",amt:g_(I3,"Schedule80_IA.TotSchedule80_IA")};
  if(I3.Schedule80_IB)S.ded.ib={code:I3.Schedule80_IB.Sch80SectionCode||"",amt:g_(I3,"Schedule80_IB.TotSchedule80_IB")};
  if(I3.Schedule80_IC)S.ded.ie={code:I3.Schedule80_IC.Sch80SectionCode||"",amt:g_(I3,"Schedule80_IC.TotSchedule80_IC")};
  if(I3.Schedule10AA){S.ded.aa10=(g_(I3,"Schedule10AA.DeductSEZ.DedUs10Detail.Undertaking.DedFromUndertakingWithAy")||[]).map(r=>({ay:r.AssmtYrUnit,amt:r.DedUs10Sub}));got.push("Schedule 10AA");}
  return got;
}

/* ===================================================================
   chkDed — the sheet's own rules, regime-aware
   =================================================================== */
function chkDed(){
  const out=[]; const V=S.C.ded||{out:{},why:{}}; const o=V.out||{};
  const add=(lvl,t,m)=>out.push({lvl,t,m,sec:"ded"});
  const isHUF=(S.pi||{}).status==="H";
  /* new regime — warn where a closed item still carries a claimed value (A696/A710/A766/A646/A652/A661/A687/A688/A633) */
  if(isNew()){
    const barred=DED_VIA.filter(x=>DED_VIA_NEW.indexOf(x[0])<0)
      .filter(x=>{const k=x[0];const c=V.fed&&V.fed[k]!==undefined?N(V.fed[k]):N(S.ded.v[k]);return c>0;}).map(x=>x[2].split(" — ")[0]);
    if(barred.length)add("warn","Closed under the new regime","These are not allowed under section 115BAC and have been set to zero: "+barred.join(", ")+". Only 80CCD(2), 80CCH and 80JJAA survive (rules A696/A710/A646/A652/A661/A687/A688).");
    if((S.ded.aa10||[]).some(r=>N(r.amt)))add("warn","Schedule 10AA closed","Schedule 10AA must be blank under the new regime (rule A633); it has been set to zero.");
  }
  /* PRAN required for 80CCD(1B) (VI_A.md K18) */
  if((N(S.ded.v.c80ccd1b)||o.c80ccd1b)&&!/^\d{12}$/.test(st0(S.ded.v.pran)))
    add("err","PRAN required","A 12-digit PRAN is required to claim 80CCD(1B).");
  /* Form 10BA for 80GG */
  if(N(S.ded.v.c80gg)&&!/^\d{15}$/.test(st0(S.ded.v.ack10ba)))
    add("err","Form 10BA acknowledgement","A 15-digit Form 10BA acknowledgement number is required to claim 80GG.");
  /* Form 10CCD / 10CCE for 80QQB / 80RRB */
  if(N(S.ded.v.c80qqb)&&!/^\d{15}$/.test(st0(S.ded.v.ack10ccd)))add("err","Form 10CCD acknowledgement","80QQB is allowed only if Form 10CCD is filed — enter its 15-digit acknowledgement number.");
  if(N(S.ded.v.c80rrb)&&!/^\d{15}$/.test(st0(S.ded.v.ack10cce)))add("err","Form 10CCE acknowledgement","80RRB is allowed only if Form 10CCE is filed — enter its 15-digit acknowledgement number.");
  /* 80CCD(2) 14% / 10% ceiling (A783/A797) */
  if(V.why&&V.why.c80ccd2)add("warn","80CCD(2) limited",V.why.c80ccd2+" (rules A783/A797).");
  /* HUF cannot claim 80U / 80TTB (A766/A772) / 80CCC / 80E */
  if(isHUF&&(N(S.ded.u80&&S.ded.u80.amt)||N(S.ded.v.c80ttb)))add("warn","Not available to a HUF","80U and 80TTB cannot be claimed by a HUF (rules A766/A772); they have been set to zero.");
  /* 80GGA not with business income (K46) */
  if(V.why&&V.why.c80gga==="not available where there is business income")add("warn","80GGA and business income","80GGA cannot be claimed where there is business or professional income (VI-A rule K46); it has been set to zero.");
  /* Chapter VI-A capped at GTI */
  if(V.clipped)add("warn","Deductions capped","The Chapter VI-A total is limited to the gross total income less income taxed at special rates.");
  /* a settled figure */
  if((V.allowed||0)>0)add("ok","Deductions allowed","Chapter VI-A deduction allowed: "+RS(V.allowed)+(V.ded10AA?"; section 10AA: "+RS(V.ded10AA):"")+".");
  return out;
}

reg({id:"ded", t:"Deductions", ref:"Chapter VI-A", f:secDed,
  s:()=>{const V=S.C.ded||{};return (V.allowed?"Allowed "+CR(V.allowed):(isNew()?"Almost none under the new regime":"Chapter VI-A"))+(V.ded10AA?" · 10AA "+CR(V.ded10AA):"");},
  eng:engDed, exp:expDed, imp:impDed, chk:chkDed, order:40});
