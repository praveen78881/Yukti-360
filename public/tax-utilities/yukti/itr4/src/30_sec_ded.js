/* =====================================================================
   ITR-4 (Sugam) · Section "ded" — Deductions (Chapter VI-A) + HRA 10(13A)
   Book: books/ITR-4/Income_Details.md (Part C, C1–C19) + the hidden helper
   sheets 80C / 80D / 80G / 80DD_80U / 80GGC / 80E_80EE_80EEA_80EEB and
   "Schedule EA 10(13A)".  Regime: SECTION_BUILDER_TASK.md "## Regime (ITR-4)".
   Schema blocks OWNED here (export/import): Schedule80C, Schedule80D,
   Schedule80G, Schedule80GGC, Schedule80DD, Schedule80U, Schedule80E,
   Schedule80EE, Schedule80EEA, Schedule80EEB, ScheduleEA10_13A.
   Compute order 40 (after the income heads, before the tax roll-up).
   This section does NOT write IncomeDeductions — that block (incl. the
   Usr/DeductUndChapVIA VI-A lines and TotalChapVIADeductions) is owned by
   inccore, which READS the ready-made S.C.ded.{usr,cap,total} built here.
   Every figure/cap/rule is from ITR-4's own book; ITR-3's ded.js gave shape
   only (constitution rule 2 — no numbers ported).
   ===================================================================== */

/* ---- state (this section's namespace) ---- */
S.ded = S.ded || {
  v:{},                              /* typed single amounts + ddb type/disease + acks */
  c80c:[],                           /* Schedule 80C item rows */
  pen80ccc:[],                       /* 80CCC PensionContribution identifier table */
  d80:{selfSr:"N/A",parSr:"N/A"},    /* Schedule 80D */
  dd80:{},                           /* Schedule 80DD */
  u80:{},                            /* Schedule 80U */
  e80:{e:[],ee:[],eea:[],eeb:[],eeaSdv:""}, /* 80E / 80EE / 80EEA / 80EEB loan tables */
  g80:[],                            /* Schedule 80G donees */
  ggc:[],                            /* Schedule 80GGC political-party contributions */
  hra:{}                             /* Schedule EA 10(13A) — HRA exemption helper */
};
/* per-contract, register default grid rows on the shared SEED (the shell's
   add-handler also carries its own generic seeds; these are belt-and-braces) */
SEED.c80c=SEED.c80c||{};
SEED.pen80ccc=SEED.pen80ccc||{type:"PRAN"};
SEED.g80=SEED.g80||{bucket:"A"};
SEED.ggc=SEED.ggc||{mode:"OTH"};

/* ---- code tables (books/ITR-4/enums.json — verbatim values) ---- */
const D4_IDENT=[["PRAN","PRAN"],["OTHPRAN","Other than PRAN"]];                       /* 80CCC I178 */
const D4_DDBTYPE=[["1","Self or dependent"],["2","Self or dependent - Senior Citizen"]]; /* Section80DDBUsrType */
const D4_DISEASE=[["a","Dementia"],["b","Dystonia Musculorum Deformans"],["c","Motor Neuron Disease"],
 ["d","Ataxia"],["e","Chorea"],["f","Hemiballismus"],["g","Aphasia"],["h","Parkinsons Disease"],
 ["i","Malignant Cancers"],["j","Full Blown Acquired Immuno-Deficiency Syndrome (AIDS)"],
 ["k","Chronic Renal failure"],["l","Hematological disorders"],["m","Hemophilia"],["n","Thalassaemia"]]; /* NameOfSpecDisease80DDB */
const D4_DDNAT=[["1","Dependent person with disability"],["2","Dependent person with severe disability"]]; /* Schedule80DD.NatureOfDisability */
const D4_UNAT=[["1","Self with disability"],["2","Self with severe disability"]];    /* Schedule80U.NatureOfDisability */
const D4_DTYPE=[["1","Autism, cerebral palsy, or multiple disabilities"],["2","Others"]]; /* TypeOfDisability */
const D4_DEP=[["1","Spouse"],["2","Son"],["3","Daughter"],["4","Father"],["5","Mother"],
 ["6","Brother"],["7","Sister"],["8","Member of the HUF"]];                          /* Schedule80DD.DependentType 1-8 */
const D4_LOANFROM=[["B","Bank"],["I","Institution / other than bank"]];              /* Schedule80E*.LoanTknFrom */
const D4_PLACE=[["1","Metro"],["2","Non-Metro"]];                                    /* ScheduleEA10_13A.Placeofwork */
const D4_STATE={"01":"Andaman and Nicobar islands","02":"Andhra Pradesh","03":"Arunachal Pradesh","04":"Assam",
 "05":"Bihar","06":"Chandigarh","07":"Dadra Nagar and Haveli","08":"Daman and Diu","09":"Delhi","10":"Goa",
 "11":"Gujarat","12":"Haryana","13":"Himachal Pradesh","14":"Jammu and Kashmir","15":"Karnataka","16":"Kerala",
 "17":"Lakshadweep","18":"Madhya Pradesh","19":"Maharashtra","20":"Manipur","21":"Meghalaya","22":"Mizoram",
 "23":"Nagaland","24":"Odisha","25":"Puducherry","26":"Punjab","27":"Rajasthan","28":"Sikkim","29":"Tamil Nadu",
 "30":"Tripura","31":"Uttar Pradesh","32":"West Bengal","33":"Chattisgarh","34":"Uttarakhand","35":"Jharkhand",
 "36":"Telangana","37":"Ladakh","99":"Foreign"};
const D4_STOPTS=Object.keys(D4_STATE).map(k=>[k,D4_STATE[k]]);

/* The Chapter VI-A lettered list for ITR-4 — [key, C-ref, label, hard-cap]
   from Income_Details.md Part C rows C1–C18b (no cap → 0). */
const D4_VIA=[
 ["c80c","C1","80C — life insurance premia, provident fund, subscriptions etc.",150000],
 ["c80ccc","C2","80CCC — payment in respect of a pension fund",150000],
 ["c80ccd1","C3","80CCD(1) — contribution to the pension scheme of the Central Government",150000],
 ["c80ccd1b","C4","80CCD(1B) — further contribution to the pension scheme",50000],
 ["c80ccd2","C5","80CCD(2) — contribution to the pension scheme by the employer",0],
 ["c80d","C6","80D — health insurance and preventive check-up (from Schedule 80D)",100000],
 ["c80dd","C7","80DD — maintenance of a dependant with a disability (from Schedule 80DD)",125000],
 ["c80ddb","C8","80DDB — medical treatment of a specified disease",100000],
 ["c80e","C9","80E — interest on a loan taken for higher education",0],
 ["c80ee","C10","80EE — interest on a loan for a residential house property",50000],
 ["c80eea","C11","80EEA — interest on a loan for certain house property",150000],
 ["c80eeb","C12","80EEB — purchase of an electric vehicle",150000],
 ["c80g","C13","80G — donations to certain funds and institutions (from Schedule 80G)",0],
 ["c80gg","C14","80GG — rent paid (Form 10BA required)",60000],
 ["c80ggc","C15","80GGC — contribution to a political party (from Schedule 80GGC)",0],
 ["c80tta","C16","80TTA — interest on a savings bank account",10000],
 ["c80ttb","C17","80TTB — interest on deposits (resident senior citizen)",50000],
 ["c80u","C18","80U — a person with a disability (from Schedule 80U)",125000],
 ["c80cch","C18a","80CCH — contribution to the Agnipath scheme",288000],
 ["c80oth","C18b","Any other deduction",0]];

/* schema key per VI-A letter, used for the Usr/DeductUndChapVIA objects
   that inccore writes into IncomeDeductions.  c80cch + c80oth both roll into
   AnyOthSec80CCH (the only schema slot; keeps rule A18 breakup-consistency). */
const D4_MAP={c80c:"Section80C",c80ccc:"Section80CCC",c80ccd1:"Section80CCDEmployeeOrSE",
 c80ccd1b:"Section80CCD1B",c80ccd2:"Section80CCDEmployer",c80d:"Section80D",c80dd:"Section80DD",
 c80ddb:"Section80DDB",c80e:"Section80E",c80ee:"Section80EE",c80eea:"Section80EEA",c80eeb:"Section80EEB",
 c80g:"Section80G",c80gg:"Section80GG",c80ggc:"Section80GGC",c80tta:"Section80TTA",c80ttb:"Section80TTB",
 c80u:"Section80U"};
/* what stays OPEN under the new regime u/s 115BAC(1A) — only 80CCD(2) and 80CCH
   (80JJAA is not an ITR-4 item). Everything else, and HRA 10(13A), closes. */
const D4_VIA_NEW=["c80ccd2","c80cch"];
/* items fed from a sub-schedule (shown read-only in the claimed column) */
const D4_FED={c80c:"from the 80C item table",c80ccc:"from the identifier table",
 c80d:"from Schedule 80D",c80dd:"from Schedule 80DD",c80u:"from Schedule 80U",
 c80e:"from the 80E loan table",c80ee:"from the 80EE loan table",c80eea:"from the 80EEA loan table",
 c80eeb:"from the 80EEB loan table",c80g:"from Schedule 80G",c80ggc:"from Schedule 80GGC"};

/* ===================================================================
   Schedule 80D engine — self/family and parents, non-senior/senior blocks;
   ₹25,000 / ₹50,000 ceilings; ₹5,000 preventive-check-up cap shared across
   all; medical expenditure only for a senior citizen where no insurance is
   taken; overall eligible capped at ₹1,00,000 (C6). (Income_Details.md C6.)
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
  let phcAll=5000; const take=v=>{const t=Math.min(v,phcAll);phcAll-=t;return t;}; /* ₹5,000 in all */
  const aPHCu=selfClaim&&!selfSr?take(aPHC):0, bPHCu=selfClaim&&selfSr?take(bPHC):0;
  const cPHCu=parClaim&&!parSr?take(cPHC):0, dPHCu=parClaim&&parSr?take(dPHC):0;
  const selfTot=selfClaim?(selfSr?Math.min(50000,bHI+bMed+bPHCu):Math.min(25000,aHI+aPHCu)):0;
  const parTot =parClaim?(parSr?Math.min(50000,dHI+dMed+dPHCu):Math.min(25000,cHI+cPHCu)):0;
  return {aHI:R(aHI),aPHC:R(aPHC),aPHCu:R(aPHCu),bHI:R(bHI),bPHC:R(bPHC),bPHCu:R(bPHCu),bMed:R(bMed),
    cHI:R(cHI),cPHC:R(cPHC),cPHCu:R(cPHCu),dHI:R(dHI),dPHC:R(dPHC),dPHCu:R(dPHCu),dMed:R(dMed),
    selfTot:R(selfTot),parTot:R(parTot),eligible:R(Math.min(100000,selfTot+parTot)),
    selfSr,parSr,selfClaim,parClaim};
}

/* Schedule 80G eligible amount — buckets A/B/C/D; a cash donation over ₹2,000
   gives no deduction (rule A108/A109); C & D subject to the 10%-of-GTI
   qualifying limit; A at 100%, B at 50%, C at 100% and D at 50%. */
function engDed80G(gtiLimit){
  const rows=S.ded.g80||[];
  const base=r=>N(r.other)+(N(r.cash)>2000?0:N(r.cash));   /* cash > ₹2,000 disallowed */
  let A=0,B=0,C=0,D=0,gross=0,cash=0,other=0;
  rows.forEach(r=>{const b=base(r);gross+=N(r.amt)||N(r.cash)+N(r.other);cash+=N(r.cash);other+=N(r.other);
    if(r.bucket==="A")A+=b; else if(r.bucket==="B")B+=b; else if(r.bucket==="C")C+=b; else if(r.bucket==="D")D+=b;});
  const ql=Math.max(0,R(0.1*Math.max(0,gtiLimit)));        /* qualifying limit for C + D */
  const cE=Math.min(C,ql), dPool=Math.max(0,ql-cE), dE=Math.min(D,dPool);
  const eligible=R(A + 0.5*B + cE + 0.5*dE);
  return {eligible,gross:R(gross),cash:R(cash),other:R(other)};
}

/* Schedule EA 10(13A) — HRA exemption. Old regime and salaried only (the
   sheet gates on bacValue=2 AND NatureofEmployment not "Not…").
   salary17 = Basic + DA [G7]; B = rent − 10% salary [G10];
   C = 50% (Metro) / 40% (Non-Metro) of salary [G11];
   eligible = min(HRA received, B, C) [G12]. */
function engDedHRA(){
  const h=S.ded.hra||{};
  const emp=st0((S.pi||{}).empcat||(S.fs||{}).empcat||"");
  const salaried=emp?!/^not/i.test(emp):true;               /* unknown → treat as salaried */
  const basic=N(h.basic),da=N(h.da);
  const sal=Math.max(0,basic+da);                            /* [G7] */
  const hraRcv=N(h.hraRecv),rent=N(h.rent);
  const B=Math.max(0,rent-R(sal*0.1));                       /* [G10] */
  const metro=st0(h.place)==="1";
  const C=R((metro?0.5:0.4)*sal);                            /* [G11] 50% metro / 40% non-metro */
  const gate=!isNew()&&salaried;                             /* closed under 115BAC */
  const eligible=gate&&(hraRcv||rent)?Math.max(0,Math.min(hraRcv,B,C)):0; /* [G12] */
  return {sal:R(sal),B:R(B),C:R(C),eligible:R(eligible),hraRcv:R(hraRcv),rent:R(rent),
    basic:R(basic),da:R(da),metro,gate,salaried};
}

/* ===================================================================
   engDed — build S.C.ded from S.ded.  Deductions do not add to GTI, so
   S.C.ded.income = 0.  S.C.ded.total is the ALLOWED Chapter VI-A total
   (regime-gated, clamped to GTI) that inccore subtracts for Total Income;
   S.C.ded.usr / S.C.ded.cap are the two schema objects (claimed / allowed)
   inccore writes into IncomeDeductions.  S.C.ded.hra feeds the salary
   10(13A) exempt allowance owned by inccore.
   =================================================================== */
function engDed(){
  const status=(S.pi||{}).status||"I";              /* I individual, H HUF, F firm(other than LLP) */
  const isHUF=status==="H", isFirm=status==="F", nonInd=status!=="I";
  const nri=(S.pi||{}).res!=="RES";

  /* best-effort GTI: sum of every income head inccore has posted (each as
     S.C.<head>.income) except this section. inccore (order 80) re-applies
     the authoritative cap on Total Income; this is only for the clamps. */
  let gtiEst=0; Object.keys(S.C||{}).forEach(k=>{if(k!=="ded"){const v=(S.C[k]||{}).income;if(typeof v==="number")gtiEst+=v;}});
  gtiEst=R(gtiEst); const gtiLimit=Math.max(0,gtiEst);   /* GTI (incl. LTCG 112A) ceiling [#95] */

  const d80=engDed80D(); S.C.d80=d80;
  const g80=engDed80G(gtiLimit); S.C.g80=g80;
  const hra=engDedHRA(); S.C.hra=hra;
  const et=k=>(S.ded.e80[k]||[]).reduce((s,r)=>s+N(r.interest),0);
  const ggc=(S.ded.ggc||[]).reduce((s,r)=>s+(r.mode==="CASH"?0:N(r.amt)),0); /* cash 80GGC gives none */

  /* claimed amount per VI-A letter (fed from a sub-schedule where one exists) */
  const fed={
    c80c:(S.ded.c80c||[]).length?(S.ded.c80c||[]).reduce((s,r)=>s+N(r.amt),0):N(S.ded.v.c80c),
    c80ccc:(S.ded.pen80ccc||[]).length?(S.ded.pen80ccc||[]).reduce((s,r)=>s+N(r.amt),0):N(S.ded.v.c80ccc),
    c80d:d80.eligible, c80dd:N(S.ded.dd80.amt), c80u:N(S.ded.u80.amt),
    c80e:et("e"), c80ee:et("ee"), c80eea:et("eea"), c80eeb:et("eeb"),
    c80g:g80.eligible, c80ggc:ggc};
  const claim=k=>fed[k]!==undefined?N(fed[k]):N(S.ded.v[k]);

  const out={},why={},allow=k=>!isNew()||D4_VIA_NEW.indexOf(k)>=0;
  D4_VIA.forEach(x=>{const k=x[0],cap=x[3]; let c=claim(k);
    /* claimant-dependent statutory caps (fixed-sum for 80DD/80U) */
    if(k==="c80dd"&&c){const cp=(S.ded.dd80||{}).nature==="2"?125000:75000;if(c>cp){why[k]="fixed at "+RS(cp);}c=Math.min(c,cp);}
    if(k==="c80u"&&c){const cp=(S.ded.u80||{}).nature==="2"?125000:75000;if(c>cp){why[k]="fixed at "+RS(cp);}c=Math.min(c,cp);}
    if(k==="c80ddb"&&c){const cp=(S.ded.v.ddb_type==="2")?100000:40000;if(c>cp){why[k]="capped at "+RS(cp);}c=Math.min(c,cp);} /* ₹40,000 / ₹1,00,000 senior */
    /* entity restrictions (Income_Details.md / rules A20/A23/A24/A26/A27/A28/A31/A32/A43) */
    if(k==="c80ccc"&&isFirm&&c){why[k]="a firm cannot claim 80CCC";c=0;}
    if(k==="c80ccd1"&&nonInd&&c){why[k]="only an individual can claim 80CCD(1)";c=0;}
    if(k==="c80ccd1b"&&nonInd&&c){why[k]="only an individual can claim 80CCD(1B)";c=0;}
    if(k==="c80c"&&isFirm&&c){why[k]="a firm cannot claim 80C";c=0;}
    if(k==="c80d"&&isFirm&&c){why[k]="a firm cannot claim 80D";c=0;}
    if(k==="c80dd"&&isFirm&&c){why[k]="a firm cannot claim 80DD";c=0;}
    if(k==="c80ddb"&&isFirm&&c){why[k]="a firm cannot claim 80DDB";c=0;}
    if((k==="c80ee")&&(isHUF||isFirm)&&c){why[k]="80EE cannot be claimed by a HUF or firm";c=0;}
    if(k==="c80u"&&(isHUF||isFirm)&&c){why[k]="80U cannot be claimed by a HUF or firm";c=0;}
    if(k==="c80ccd2"&&(isHUF||isFirm)&&c){why[k]="80CCD(2) cannot be claimed by a HUF or firm";c=0;}
    if(!allow(k)){out[k]=0;why[k]=c?"closed by section 115BAC":(why[k]||"");return;}
    if(cap&&c>cap&&!why[k]){why[k]="capped at "+RS(cap);c=cap;}
    else if(cap&&c>cap)c=cap;
    out[k]=R(c);});

  /* 80C + 80CCC + 80CCD(1) share the ₹1,50,000 ceiling (rule A21) */
  const cce=out.c80c+out.c80ccc+out.c80ccd1;
  if(cce>150000){const f=150000/cce;out.c80c=R(out.c80c*f);out.c80ccc=R(out.c80ccc*f);
    out.c80ccd1=Math.max(0,150000-out.c80c-out.c80ccc);
    why.c80c=(why.c80c?why.c80c+", ":"")+"80C, 80CCC and 80CCD(1) together stop at ₹1,50,000";}

  /* 80CCD(1) not more than 20% of GTI (rule A22/A23) */
  if(out.c80ccd1){const cp=R(0.2*gtiLimit);if(gtiLimit>0&&out.c80ccd1>cp){why.c80ccd1=(why.c80ccd1?why.c80ccd1+", ":"")+"limited to 20% of gross total income = "+RS(cp);out.c80ccd1=cp;}}

  /* 80CCD(2) employer limit — 14% of salary (CG/SG) else 10% (rules A25/A47) */
  if(out.c80ccd2){const base=R(((S.C||{}).sal||{}).basicDA||((S.C||{}).inc||{}).basicDA||0);
    if(base>0){const emp=st0((S.pi||{}).empcat||"");const govt=/^CG|^SG|^CGOV|^SGOV|Central|State/i.test(emp);
      const cp=R((govt?0.14:0.10)*base);
      if(out.c80ccd2>cp){why.c80ccd2="limited to "+(govt?"14%":"10%")+" of salary = "+RS(cp);out.c80ccd2=cp;}}}

  /* 80TTA / 80TTB — mutually exclusive, and restricted to interest earned
     (rules A38/A39/A40/A41). 80TTB only for a resident senior citizen. */
  const os={sav:R(((S.C||{}).os||{}).sav||((S.C||{}).inc||{}).savInt||0),
            dep:R(((S.C||{}).os||{}).dep||((S.C||{}).inc||{}).depInt||0)};
  if(senior()){if(out.c80tta){why.c80tta="a senior citizen claims 80TTB instead";out.c80tta=0;}}
  else if(out.c80ttb){why.c80ttb="80TTB is only for a resident senior citizen";out.c80ttb=0;}
  if(isHUF||isFirm){if(out.c80ttb){why.c80ttb="80TTB cannot be claimed by a HUF or firm";out.c80ttb=0;}}
  if(out.c80tta&&os.sav>0&&out.c80tta>os.sav){why.c80tta="limited to the savings-bank interest";out.c80tta=os.sav;}
  if(out.c80ttb&&(os.sav+os.dep)>0&&out.c80ttb>os.sav+os.dep){why.c80ttb="limited to the interest earned";out.c80ttb=R(os.sav+os.dep);}

  /* a non-resident cannot claim 80DD / 80DDB / 80U / 80TTB */
  if(nri){["c80dd","c80ddb","c80u","c80ttb"].forEach(k=>{if(out[k]){why[k]="not available to a non-resident";out[k]=0;}});}

  /* totals — the raw claimed sum, and the allowed sum clamped to GTI (rule A19) */
  const keys=D4_VIA.map(x=>x[0]);
  const rawTotal=keys.reduce((a,k)=>a+R(out[k]||0),0);
  const allowed=Math.max(0,Math.min(rawTotal,gtiLimit));
  const clipped=rawTotal>gtiLimit;

  /* build the two schema objects inccore drops into IncomeDeductions.
     Under the new regime the claimed side carries only the surviving items. */
  const usr={},cap={},regOpen=k=>!isNew()||D4_VIA_NEW.indexOf(k)>=0;
  Object.keys(D4_MAP).forEach(k=>{const f=D4_MAP[k];const c=claim(k);
    if(c&&regOpen(k))usr[f]=n0(c);
    if(out[k])cap[f]=n0(out[k]);});
  /* 80CCH + any-other → AnyOthSec80CCH (cap ₹2,88,000) */
  const cchClaim=(regOpen("c80cch")?N(S.ded.v.c80cch):0)+(regOpen("c80oth")?N(S.ded.v.c80oth):0);
  const cchOut=n0(out.c80cch)+n0(out.c80oth);
  if(cchClaim)usr.AnyOthSec80CCH=n0(Math.min(cchClaim,288000));
  if(cchOut)cap.AnyOthSec80CCH=n0(Math.min(cchOut,288000));
  /* qualifier fields the UsrDeductUndChapVIA schema carries beside the amounts;
     only when the matching claim survives (all close under 115BAC). impDed reads
     each back, so writing them here is what makes the return round-trip. */
  if(usr.Section80CCD1B&&/^\d{12}$/.test(st0(S.ded.v.pran)))usr.PRANDtls=[{PRANNum:st0(S.ded.v.pran)}];
  if(usr.Section80DDB){if(st0(S.ded.v.ddb_type))usr.Section80DDBUsrType=st0(S.ded.v.ddb_type)==="2"?"2":"1";
    if(st0(S.ded.v.ddb_disease))usr.NameOfSpecDisease80DDB=st0(S.ded.v.ddb_disease);}
  if(usr.Section80GG&&/^\d{15}$/.test(st0(S.ded.v.ack10ba)))usr.Form10BAAckNum=st0(S.ded.v.ack10ba);
  if(usr.Section80CCC){const pc=(S.ded.pen80ccc||[]).filter(r=>N(r.amt)).map(r=>({
      TypeofIdentifier:r.type==="OTHPRAN"?"OTHPRAN":"PRAN",NameofIdentifier:(sv(r.id)||"NA").slice(0,125),Amount:n0(r.amt)}));
    if(pc.length)usr.PensionContribution80CCC=pc;}
  const usrTotal=keys.reduce((a,k)=>a+(regOpen(k)?R(claim(k)):0),0);
  usr.TotalChapVIADeductions=n0(usrTotal);
  cap.TotalChapVIADeductions=n0(allowed);

  S.C.ded={income:0,                 /* a deduction head contributes 0 to GTI */
    out,why,fed,usr,cap,
    total:R(allowed),                /* the number the contract names — allowed VI-A total */
    allowed:R(allowed),usrTotal:R(usrTotal),rawTotal:R(rawTotal),clipped,
    gtiEst,gtiLimit,conc:isNew(),
    hra:hra.eligible,hraD:hra};
}

/* ===================================================================
   secDed — renderer
   =================================================================== */
function dedPenTbl(key){
  return grid(key,[{k:"type",h:"Type of identifier",t:"sel",w:"200px",req:1,opts:D4_IDENT},
    {k:"id",h:"Identifier number / name",t:"txt",w:"auto",req:1},
    {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],get(key)||[],{min:"620px",empty:"None listed.",add:"Add a row"});
}
function dedInsTbl(key){
  return grid(key,[{k:"insurer",h:"Name of the insurer",t:"txt",w:"auto",req:1},
    {k:"policy",h:"Policy number",t:"txt",w:"180px",req:1},{k:"amt",h:"Health insurance amount",t:"num",w:"170px",req:1}],
    get(key)||[],{min:"720px",empty:"No policy listed.",add:"Add a policy"});
}
function dedLoanTbl(key){
  const extra=key==="ded.e80.eeb"?[{k:"reg",h:"Vehicle registration number",t:"txt",w:"150px",max:11,req:1}]:[];
  return grid(key,[{k:"from",h:"Loan taken from",t:"sel",w:"150px",req:1,opts:D4_LOANFROM},...extra,
    {k:"name",h:"Name of the bank / institution",t:"txt",w:"auto",req:1},
    {k:"acno",h:"Loan account / reference number",t:"txt",w:"170px",req:1,max:20},{k:"dt",h:"Date of loan",t:"date",w:"130px",req:1},
    {k:"amt",h:"Total loan",t:"num",w:"120px",req:1},{k:"os",h:"Outstanding on 31-03-2026",t:"num",w:"160px",req:1},
    {k:"interest",h:"Interest in the year",t:"num",w:"150px",req:1}],get(key)||[],{min:"1200px",empty:"No loan.",add:"Add a loan"});
}
function secDed(){
  const V=S.C.ded||{out:{},fed:{},why:{},total:0}, D8=S.C.d80||{}, H=S.C.hra||{};
  const o=V.out||{}, why=V.why||{};
  let h="";
  if((S.pi||{}).res!=="RES")h+=note("A non-resident cannot claim 80DD, 80DDB, 80U or 80TTB — Yukti allows only what a non-resident may.","warn");
  if(isNew())h+=note("<b>Under section 115BAC only 80CCD(2) and 80CCH survive.</b> Every other Chapter VI-A deduction, and the HRA 10(13A) exemption, is closed. You may still type them so Return &amp; regime can show the New-vs-Old comparison.","stop");

  const hdr='<div class="r sub"><div class="l">Section</div><div class="ref"></div><div class="v2 hd2">You claim</div><div class="v hd2">Allowed</div></div>';
  h+='<div class="cgband">Part C — Chapter VI-A deductions (C1 to C18b)</div>'+hdr;
  D4_VIA.forEach(x=>{const [k,ref,label,cap]=x;
    const open=!isNew()||D4_VIA_NEW.indexOf(k)>=0;
    const isFed=D4_FED[k]!==undefined;
    const claimed=isFed?(V.fed[k]!==undefined?V.fed[k]:0):N(S.ded.v[k]);
    h+='<div class="r'+(open?"":" closed")+'"><div class="l">'+esc(label)+
       (cap?'<span class="hint">ceiling '+RS(cap)+'</span>':'')+(isFed?'<span class="hint">'+esc(D4_FED[k])+'</span>':'')+
       (!open&&(claimed||N(S.ded.v[k]))?'<span class="hint">closed by section 115BAC</span>':'')+
       (why[k]?'<span class="hint">'+esc(why[k])+'</span>':'')+'</div>'+
       '<div class="ref">'+esc(ref)+'</div>'+
       '<div class="v2">'+((isFed||!open)?cell(open?claimed:0):inp("ded.v."+k,{n:1}))+'</div>'+
       '<div class="v">'+cell(o[k]||0)+'</div></div>';
    /* attached detail rows / folds */
    if(k==="c80ccc")h+=fold("dpccc","C2","Identifier details for 80CCC",(S.ded.pen80ccc||[]).length?(S.ded.pen80ccc||[]).length+" rows":"optional",dedPenTbl("ded.pen80ccc"));
    if(k==="c80ccd1b")h+=fold("dpran","C4","PRAN of the taxpayer","",row("PRAN",inp("ded.v.pran",{max:12}),{ind:1,hint:"12-digit permanent retirement account number"}));
    if(k==="c80ddb"&&N(S.ded.v.c80ddb)){
      h+=row("Claimed for",sel("ded.v.ddb_type",D4_DDBTYPE,{blank:false}),{req:1,ind:1,hint:"₹40,000, or ₹1,00,000 for a senior citizen"});
      h+=row("Name of the specified disease",sel("ded.v.ddb_disease",D4_DISEASE),{req:1,ind:1});}
    if(k==="c80gg"&&N(S.ded.v.c80gg))h+=row("Acknowledgement number of Form 10BA",inp("ded.v.ack10ba",{max:15}),{req:1,ind:1,hint:"fifteen digits"});
  });
  h+=row("C19 · Total deductions under Chapter VI-A",cell(V.allowed||0),{ref:"C19",cls:"grand",hint:"clamped to gross total income (incl. LTCG 112A)"});
  if(V.clipped)h+=note("The Chapter VI-A total is limited to the gross total income.","warn");

  /* ---------------- the schedules behind the figures ---------------- */
  h+='<div class="cgband">The schedules behind the figures</div>';
  /* 80C */
  const c80sum=(S.ded.c80c||[]).reduce((s,r)=>s+N(r.amt),0);
  h+=card("d80c","Schedule 80C — the items",c80sum?RS(c80sum):"",
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
    row("Eligible amount of deduction",cell(D8.eligible),{cls:"grand",hint:"check-up sits inside the ceilings, ₹5,000 in all; overall ₹1,00,000"}));
  /* 80DD */
  h+=card("d80dd","Schedule 80DD — a dependant with a disability",N((S.ded.dd80||{}).amt)?RS(o.c80dd||0):"",
    row("Nature of disability",sel("ded.dd80.nature",D4_DDNAT),{req:1})+row("Type of disability",sel("ded.dd80.type",D4_DTYPE),{req:1})+
    row("Amount of deduction",inp("ded.dd80.amt",{n:1}),{req:1,hint:"fixed ₹75,000, or ₹1,25,000 for a severe disability"})+
    row("Dependant",sel("ded.dd80.dep",D4_DEP),{req:1})+row("PAN of the dependant",inp("ded.dd80.pan",{max:10}))+
    row("Aadhaar of the dependant",inp("ded.dd80.aadhaar",{max:12}))+
    row("Acknowledgement number of Form 10-IA",inp("ded.dd80.f10ack",{max:15}))+row("UDID number",inp("ded.dd80.udid",{max:18}))+
    formNote("<b>Form 10-IA</b> has to be filed before the return."));
  /* 80U */
  h+=card("d80u","Schedule 80U — the person has a disability",N((S.ded.u80||{}).amt)?RS(o.c80u||0):"",
    row("Nature of the disability",sel("ded.u80.nature",D4_UNAT),{req:1})+row("Type of disability",sel("ded.u80.type",D4_DTYPE),{req:1})+
    row("Amount of deduction",inp("ded.u80.amt",{n:1}),{req:1,hint:"fixed ₹75,000, or ₹1,25,000 for a severe disability"})+
    row("Acknowledgement number of Form 10-IA",inp("ded.u80.ack",{max:15}))+row("UDID number",inp("ded.u80.udid",{max:18}))+
    formNote("<b>Form 10-IA</b> has to be filed before the return."));
  /* 80E group */
  const e=S.ded.e80||{}; const et=k=>(e[k]||[]).reduce((s,r)=>s+N(r.interest),0);
  const etAll=et("e")+et("ee")+et("eea")+et("eeb");
  h+=card("d80e","80E, 80EE, 80EEA, 80EEB — loans, lender by lender",etAll?RS(etAll):"",
    sub("80E — interest on a loan taken for higher education")+dedLoanTbl("ded.e80.e")+
    sub("80EE — interest on a loan taken for a residential house property")+dedLoanTbl("ded.e80.ee")+
    sub("80EEA — interest on a loan taken for certain house property")+row("Stamp-duty value of the property",inp("ded.e80.eeaSdv",{n:1}),{req:1,hint:"not over ₹45 lakh for the deduction"})+dedLoanTbl("ded.e80.eea")+
    sub("80EEB — interest on a loan taken to buy an electric vehicle")+dedLoanTbl("ded.e80.eeb"));
  /* 80G */
  const g80sum=(S.ded.g80||[]).reduce((s,r)=>s+(N(r.amt)||N(r.cash)+N(r.other)),0);
  h+=card("d80g","Schedule 80G — donations, donee by donee",g80sum?RS(g80sum):"",
    note("<b>Where any row is filled, every field in that row becomes mandatory.</b>")+
    grid("ded.g80",[{k:"bucket",h:"Bucket",t:"sel",w:"230px",req:1,opts:[["A","100% without a qualifying limit"],["B","50% without a qualifying limit"],["C","100% subject to the limit"],["D","50% subject to the limit"]]},
      {k:"name",h:"Name of the donee",t:"txt",w:"auto",req:1},{k:"addr",h:"Address",t:"txt",w:"auto",req:1},{k:"city",h:"City",t:"txt",w:"120px",req:1},
      {k:"state",h:"State",t:"sel",w:"150px",req:1,opts:D4_STOPTS},{k:"pin",h:"PIN",t:"txt",w:"90px",max:6,req:1},
      {k:"pan",h:"PAN of the donee",t:"txt",w:"120px",max:10,req:1},{k:"arn",h:"ARN — donation reference",t:"txt",w:"150px",max:25},
      {k:"cash",h:"In cash",t:"num",w:"100px"},{k:"other",h:"Other mode",t:"num",w:"100px"},
      {k:"ref",h:"Transaction reference",t:"txt",w:"160px",max:50},{k:"ifsc",h:"IFSC",t:"txt",w:"110px",max:11},
      {k:"amt",h:"Total",t:"num",w:"120px",req:1}],S.ded.g80||[],{min:"2000px",empty:"No donation listed.",add:"Add a donee",
      foot:[{l:1,v:"Total donated",span:12},{v:g80sum}]})+
    note("A donation in cash above ₹2,000 gives no deduction. For any other mode the transaction reference and IFSC are mandatory.","warn"));
  /* 80GGC */
  const ggcsum=(S.ded.ggc||[]).reduce((s,r)=>s+N(r.amt),0);
  h+=card("d80ggc","Schedule 80GGC — contribution to a political party / electoral trust",ggcsum?RS(ggcsum):"",
    grid("ded.ggc",[{k:"dt",h:"Date of contribution",t:"date",w:"130px",req:1},{k:"name",h:"Name of the party or trust",t:"txt",w:"auto",req:1},
      {k:"pan",h:"PAN",t:"txt",w:"120px",max:10,req:1},{k:"mode",h:"Mode",t:"sel",w:"140px",req:1,opts:[["CASH","Cash"],["OTH","Other than cash"]]},
      {k:"ref",h:"Transaction reference",t:"txt",w:"160px",max:50},{k:"ifsc",h:"IFSC",t:"txt",w:"120px",max:11},{k:"amt",h:"Amount",t:"num",w:"120px",req:1}],
      S.ded.ggc||[],{min:"1100px",empty:"No contribution listed.",add:"Add a contribution"})+
    note("A contribution in cash gives no deduction at all.","warn"));
  /* Schedule EA 10(13A) — HRA exemption helper */
  h+=card("dhra","Schedule 10(13A) — house rent allowance (HRA)",(H.eligible||0)?RS(H.eligible):"",
    (isNew()?note("Closed under the new regime (section 115BAC).","stop"):"")+
    row("Place of residence",sel("ded.hra.place",D4_PLACE),{req:1,hint:"Metro → 50% of salary, else 40%"})+
    row("Actual HRA received (A)",inp("ded.hra.hraRecv",{n:1}),{req:1})+
    row("Actual rent paid",inp("ded.hra.rent",{n:1}),{req:1})+
    sub("Details of salary as per section 17(1)")+
    row("4(a) Basic salary",inp("ded.hra.basic",{n:1}),{ind:1,req:1})+
    row("4(b) Dearness allowance",inp("ded.hra.da",{n:1}),{ind:1})+
    row("Salary as per section 17(1) (Basic + DA)",cell(H.sal),{cls:"tot"})+
    row("Actual rent paid − 10% of salary (B)",cell(H.B),{cls:"tot"})+
    row((H.metro?"50%":"40%")+" of salary (C)",cell(H.C),{cls:"tot"})+
    row("Eligible exempt allowance u/s 10(13A)",cell(H.eligible),{cls:"grand",hint:"least of A, B and C"})+
    note("The exemption is the least of the three, and only in the old regime for a salaried taxpayer.","warn"));

  /* how the total income comes out */
  h+='<div class="cgband">How the total income comes out</div>';
  h+=row("Gross total income",cell(S.C.gti||V.gtiEst||0),{cls:"tot",hint:"set by Part D — tax computation"});
  h+=row("Less: deductions under Chapter VI-A",cell(-(V.allowed||0)));
  h+=row("Total income (indicative)",cell(Math.max(0,(S.C.gti||V.gtiEst||0)-(V.allowed||0))),{cls:"grand",hint:"the tax section rounds and finalises this"});
  return h;
}

/* ===================================================================
   expDed — write the OWNED schema blocks onto j (IncomeDeductions is NOT
   touched — inccore owns it and reads S.C.ded.usr / .cap / .total).
   Every sub-schedule below belongs to a deduction that 115BAC closes, so
   under the new regime they must be blank — emit only in the old regime.
   =================================================================== */
function expDed(j){
  const V=S.C.ded||{out:{},fed:{}}; const out=V.out||{}, fed=V.fed||{};
  const claim=k=>fed[k]!==undefined?N(fed[k]):N(S.ded.v[k]);
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
    if(/^\d{15}$/.test(st0(x.f10ack)))j.Schedule80DD.Form10IAAckNum=st0(x.f10ack);
    if(sv(x.udid))j.Schedule80DD.UDIDNum=sv(x.udid).slice(0,18);}
  /* ---- Schedule80U ---- */
  if(N((S.ded.u80||{}).amt)){const x=S.ded.u80||{};j.Schedule80U={NatureOfDisability:x.nature==="2"?"2":"1",
    TypeOfDisability:x.type==="2"?"2":"1",DeductionAmount:n0(out.c80u)};
    if(/^\d{15}$/.test(st0(x.ack)))j.Schedule80U.Form10IAAckNum=st0(x.ack);
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
  /* ---- ScheduleEA10_13A (HRA) — old regime only, and only when there is HRA data ---- */
  {const H=S.C.hra||{};
   if((H.hraRcv||H.rent||H.sal)&&H.gate){const b={ActlHRARecv:n0(H.hraRcv),ActlRentPaid:n0(H.rent),
      DtlsSalUsSec171:n0(H.sal),BasicSalary:n0(H.basic),ActlRentPaid10Per:n0(H.B),Sal40Or50Per:n0(H.C),
      EligbleExmpAllwncUs13A:n0(H.eligible)};
    if(st0((S.ded.hra||{}).place))b.Placeofwork=st0(S.ded.hra.place);
    if(H.da)b.DearnessAllwnc=n0(H.da);j.ScheduleEA10_13A=b;}}
}

/* ===================================================================
   impDed — read the owned schema blocks back into S.ded
   =================================================================== */
function impDed(I4){
  const got=[]; S.ded=S.ded||{}; if(!S.ded.v)S.ded.v={};
  const g_=(o,p)=>{try{return p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);}catch(e){return undefined;}};
  /* the claimed VI-A amounts live in IncomeDeductions (owned by inccore); we
     recover the ones fed only from sub-schedules and the direct-typed ones
     from the sub-schedules themselves below, plus the typed lines here. */
  const U=g_(I4,"IncomeDeductions.UsrDeductUndChapVIA");
  if(U){const RMAP={Section80CCDEmployeeOrSE:"c80ccd1",Section80CCD1B:"c80ccd1b",Section80CCDEmployer:"c80ccd2",
      Section80DDB:"c80ddb",Section80GG:"c80gg",Section80TTA:"c80tta",Section80TTB:"c80ttb"};
    Object.keys(RMAP).forEach(k=>{if(U[k])S.ded.v[RMAP[k]]=U[k];});
    if(U.AnyOthSec80CCH)S.ded.v.c80cch=U.AnyOthSec80CCH;
    S.ded.v.pran=g_(U,"PRANDtls.0.PRANNum")||S.ded.v.pran||"";
    if(U.Section80DDBUsrType)S.ded.v.ddb_type=U.Section80DDBUsrType;
    if(U.NameOfSpecDisease80DDB)S.ded.v.ddb_disease=U.NameOfSpecDisease80DDB;
    if(U.Form10BAAckNum)S.ded.v.ack10ba=U.Form10BAAckNum;
    S.ded.pen80ccc=(U.PensionContribution80CCC||[]).map(r=>({type:r.TypeofIdentifier==="OTHPRAN"?"OTHPRAN":"PRAN",id:r.NameofIdentifier,amt:r.Amount}));
    got.push("Chapter VI-A claimed amounts");}
  if(I4.Schedule80C){S.ded.c80c=(I4.Schedule80C.Schedule80CDtls||[]).map(r=>({amt:r.Amount,id:r.IdentificationNo}));got.push("Schedule 80C");}
  if(I4.Schedule80D){const b=I4.Schedule80D.Sec80DSelfFamSrCtznHealth||{};const ins=k=>(g_(b,k+".Sch80DInsDtls")||[]).map(r=>({insurer:r.InsurerName,policy:r.PolicyNo,amt:r.HealthInsAmt}));
    S.ded.d80={selfSr:b.SeniorCitizenFlag==="S"?"N/A":(b.SeniorCitizenFlag||"N/A"),parSr:b.ParentsSeniorCitizenFlag==="P"?"N/A":(b.ParentsSeniorCitizenFlag||"N/A"),
      selfIns:ins("Sec80DSelfFamHIDtls"),selfPHC:nz(b.PrevHlthChckUpSlfFam),selfSrIns:ins("Sec80DSelfFamSrCtznHIDtls"),selfSrPHC:nz(b.PrevHlthChckUpSlfFamSrCtzn),selfSrMed:nz(b.MedicalExpSlfFamSrCtzn),
      parIns:ins("Sec80DParentsHIDtls"),parPHC:nz(b.PrevHlthChckUpParents),parSrIns:ins("Sec80DParentsSrCtznHIDtls"),parSrPHC:nz(b.PrevHlthChckUpParentsSrCtzn),parSrMed:nz(b.MedicalExpParentsSrCtzn)};
    got.push("Schedule 80D");}
  if(I4.Schedule80DD){const x=I4.Schedule80DD;S.ded.dd80={nature:x.NatureOfDisability,type:x.TypeOfDisability,amt:x.DeductionAmount,
    dep:x.DependentType,pan:x.DependentPan||"",aadhaar:x.DependentAadhaar||"",f10ack:x.Form10IAAckNum||"",udid:x.UDIDNum||""};got.push("Schedule 80DD");}
  if(I4.Schedule80U){const x=I4.Schedule80U;S.ded.u80={nature:x.NatureOfDisability,type:x.TypeOfDisability,amt:x.DeductionAmount,
    ack:x.Form10IAAckNum||"",udid:x.UDIDNum||""};got.push("Schedule 80U");}
  {const ln=(blk,dk,ik)=>(g_(I4,blk+"."+dk)||[]).map(r=>({from:r.LoanTknFrom,name:r.BankOrInstnName,acno:r.LoanAccNoOfBankOrInstnRefNo,
      dt:dmy(r.DateofLoan),amt:r.TotalLoanAmt,os:r.LoanOutstndngAmt,reg:r.VehicleRegNo||"",interest:r[ik]}));
    const ee=ln("Schedule80E","Schedule80EDtls","Interest80E"),eee=ln("Schedule80EE","Schedule80EEDtls","Interest80EE"),
      eea=ln("Schedule80EEA","Schedule80EEADtls","Interest80EEA"),eeb=ln("Schedule80EEB","Schedule80EEBDtls","Interest80EEB");
    if(ee.length||eee.length||eea.length||eeb.length){
      S.ded.e80={e:ee,ee:eee,eea:eea,eeb:eeb,eeaSdv:nz(g_(I4,"Schedule80EEA.PropStmpDtyVal"))};got.push("80E/80EE/80EEA/80EEB loans");}}
  if(I4.Schedule80G){const G=I4.Schedule80G;S.ded.g80=[];
    [["A","Don100Percent"],["B","Don50PercentNoApprReqd"],["C","Don100PercentApprReqd"],["D","Don50PercentApprReqd"]].forEach(([b,k])=>{
      (g_(G,k+".DoneeWithPan")||[]).forEach(r=>{const a=r.AddressDetail||{};S.ded.g80.push({bucket:b,name:r.DoneeWithPanName,addr:a.AddrDetail,
        city:a.CityOrTownOrDistrict,state:a.StateCode,pin:nz(a.PinCode)+"",pan:r.DoneePAN,arn:r.ArnNbr||"",cash:nz(r.DonationAmtCash),
        other:nz(r.DonationAmtOtherMode),ref:r.TransactionRefNum||"",ifsc:r.IFSCCode||"",amt:r.DonationAmt});});});
    got.push("Schedule 80G");}
  if(I4.Schedule80GGC){S.ded.ggc=(I4.Schedule80GGC.Schedule80GGCDetails||[]).map(r=>({dt:dmy(r.DonationDate),name:r.PoliticalPartyName||"",
    pan:r.PoliticalPartyPAN||"",mode:N(r.DonationAmtCash)?"CASH":"OTH",ref:r.TransactionRefNum||"",ifsc:r.IFSCCode||"",amt:r.DonationAmt}));got.push("Schedule 80GGC");}
  if(I4.ScheduleEA10_13A){const x=I4.ScheduleEA10_13A;S.ded.hra={place:x.Placeofwork||"",hraRecv:nz(x.ActlHRARecv),rent:nz(x.ActlRentPaid),
    basic:nz(x.BasicSalary),da:nz(x.DearnessAllwnc)};got.push("Schedule 10(13A) HRA");}
  return got;
}

/* ===================================================================
   chkDed — the sheet's own rules, regime-aware (from rules.json)
   =================================================================== */
function chkDed(){
  const out=[]; const V=S.C.ded||{out:{},why:{}}; const o=V.out||{}, why=V.why||{};
  const add=(lvl,t,m)=>out.push({lvl,t,m,sec:"ded"});
  const status=(S.pi||{}).status||"I"; const isHUF=status==="H", isFirm=status==="F";
  /* new regime — warn where a closed item still carries a claimed value */
  if(isNew()){
    const barred=D4_VIA.filter(x=>D4_VIA_NEW.indexOf(x[0])<0)
      .filter(x=>{const k=x[0];const c=V.fed&&V.fed[k]!==undefined?N(V.fed[k]):N(S.ded.v[k]);return c>0;}).map(x=>x[2].split(" — ")[0]);
    if(barred.length)add("warn","Closed under the new regime","These are not allowed under section 115BAC and have been set to zero: "+barred.join(", ")+". Only 80CCD(2) and 80CCH survive.");
    if((S.C.hra||{}).hraRcv||(S.C.hra||{}).rent)add("warn","HRA closed","The 10(13A) HRA exemption is not available under the new regime (rule A79); it has been set to zero.");
  }
  /* PRAN required for 80CCD(1B) (Income_Details.md) */
  if((N(S.ded.v.c80ccd1b)||o.c80ccd1b)&&!/^\d{12}$/.test(st0(S.ded.v.pran)))
    add("err","PRAN required","A 12-digit PRAN is required to claim 80CCD(1B).");
  /* Form 10BA for 80GG (rule A37) */
  if(N(S.ded.v.c80gg)&&!/^\d{15}$/.test(st0(S.ded.v.ack10ba)))
    add("err","Form 10BA acknowledgement","A 15-digit Form 10BA acknowledgement number is required to claim 80GG.");
  /* 80DD / 80DDB / 80U — eligible category description (rules A29/A30/A44) */
  if(!isNew()&&N((S.ded.dd80||{}).amt)&&!st0((S.ded.dd80||{}).nature))add("err","80DD category","Select the disability category for the 80DD claim.");
  if(!isNew()&&N(S.ded.v.c80ddb)&&!st0(S.ded.v.ddb_disease))add("err","80DDB disease","Select the specified disease for the 80DDB claim.");
  if(!isNew()&&N((S.ded.u80||{}).amt)&&!st0((S.ded.u80||{}).nature))add("err","80U category","Select the disability category for the 80U claim.");
  /* entity restrictions surfaced from engDed why[] */
  ["c80c","c80ccc","c80ccd1","c80ccd1b","c80ccd2","c80d","c80dd","c80ddb","c80ee","c80u","c80ttb"].forEach(k=>{
    if(why[k]&&/cannot|only an individual|not available/.test(why[k]))add("warn","Deduction not allowed",why[k]+"; it has been set to zero.");});
  /* 80CCD(2) 14% / 10% ceiling (rules A25/A47) */
  if(why.c80ccd2&&/limited/.test(why.c80ccd2))add("warn","80CCD(2) limited",why.c80ccd2+" (rules A25/A47).");
  /* 80CCD(1) 20% GTI (rule A22) */
  if(why.c80ccd1&&/20%/.test(why.c80ccd1))add("warn","80CCD(1) limited","80CCD(1) is limited to 20% of gross total income (rule A22).");
  /* 80TTA/80TTB restrictions (rules A38-A41) */
  if(why.c80tta)add("warn","80TTA restricted",why.c80tta+" (rules A38/A39).");
  if(why.c80ttb)add("warn","80TTB restricted",why.c80ttb+" (rules A40/A41).");
  /* Chapter VI-A capped at GTI (rule A19) */
  if(V.clipped)add("warn","Deductions capped","The Chapter VI-A total is limited to the gross total income (rule A19).");
  /* HRA exemption cannot exceed the least-of-three (rule A79) */
  const H=S.C.hra||{}; if(!isNew()&&H.hraRcv&&H.eligible<Math.min(H.hraRcv||0,H.B||0,H.C||0)-1) add("warn","HRA capped","The HRA exemption is the least of A, B and C (rule A79).");
  /* a settled figure */
  if((V.allowed||0)>0||(H.eligible||0)>0)add("ok","Deductions allowed","Chapter VI-A deduction allowed: "+RS(V.allowed||0)+(H.eligible?"; HRA exempt: "+RS(H.eligible):"")+".");
  return out;
}

reg({id:"ded", t:"Deductions", ref:"Chapter VI-A", f:secDed,
  s:()=>{const V=S.C.ded||{},H=S.C.hra||{};return (V.allowed?"Allowed "+CR(V.allowed):(isNew()?"Almost none under the new regime":"Chapter VI-A"))+(H.eligible?" · HRA "+CR(H.eligible):"");},
  eng:engDed, exp:expDed, imp:impDed, chk:chkDed, order:40});
