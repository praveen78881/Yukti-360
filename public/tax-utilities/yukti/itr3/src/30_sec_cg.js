/* =====================================================================
   ITR-3 · Section "cg" — Schedule CG (Capital Gains) + Schedule 112A +
   Schedule 115AD(1)(iii) proviso + Schedule VDA.  order 14.
   Built ONLY from books/ITR-3/{CG,Schedule_112A,Schedule_115AD_1_iii_proviso,VDA}.md
   and books/ITR-3/{REGIME,enums}.  Schema block ScheduleCGFor23 (Part A
   ShortTermCapGainFor23, Part B LongTermCapGain23, Part C SumOfCGIncm /
   IncmFromVDATrnsf / TotScheduleCGFor23, Part D DeducClaimInfo, Part E
   CurrYrLosses, Part F AccruOrRecOfCG), Schedule112A, Schedule115AD,
   ScheduleVDA.
   Regime (books/ITR-3/REGIME.md): the CAPITAL GAINS income side stays OPEN
   in both regimes — REGIME.md closes nothing under this head (the 54/54B/…
   exemptions are capital-gains exemptions, not Chapter VI-A, and remain
   available new-or-old).  So no item here is regime-gated; every field is
   live in both `optout="Yes"` (old) and `="No"` (new).  isNew() is read
   only to keep the both-ways contract explicit.
   Everything is wrapped in an IIFE so no helper leaks into the shared
   namespace where parallel builders live.
   ===================================================================== */
(function(){
"use strict";

/* ---- constants from the CG book ---------------------------------- */
/* 23rd July 2024 — the acquisition/transfer cut-off the sheet splits on
   (CG book §2 rows r173/r186/r187: "before / on or after 23rd July 2024") */
const CGCUT=new Date(2024,6,23);
/* Cost Inflation Index — for the resident second-proviso-to-112(1)(a)
   indexed working (CG book §3 W143/W144 VLOOKUP CostInflationtbl, Q150) */
const CGCII={"2001-02":100,"2002-03":105,"2003-04":109,"2004-05":113,"2005-06":117,
 "2006-07":122,"2007-08":129,"2008-09":137,"2009-10":148,"2010-11":167,"2011-12":184,
 "2012-13":200,"2013-14":220,"2014-15":240,"2015-16":254,"2016-17":264,"2017-18":272,
 "2018-19":280,"2019-20":289,"2020-21":301,"2021-22":317,"2022-23":331,"2023-24":348,
 "2024-25":363,"2025-26":376};

/* the five 234C date-ranges (CG book Part F, r537) */
function cgQtr(iso){const d=D(iso);if(!d)return 4;
 const y=YREND.getFullYear();                 /* FY end year = 2026 */
 const j15=new Date(y-1,5,15),s15=new Date(y-1,8,15),d15=new Date(y-1,11,15),m15=new Date(y,2,15);
 if(d<=j15)return 0; if(d<=s15)return 1; if(d<=d15)return 2; if(d<=m15)return 3; return 4;}

/* ---- dropdown tables (from books/ITR-3/enums.json, verbatim) ------ */
const OB=[["BE","On or before 31st January 2018"],["AE","After 31st January 2018"]];
const HEADVDA=[["BI","Business Income"],["CG","Capital Gain"]];
const EXST_LAND=[["54B","Sec 54B"],["54G","Sec 54G"],["54GA","Sec 54GA"]];             /* STCG land Dbelow */
const EXLT_LAND=[["54","Sec 54"],["54B","Sec 54B"],["54D","Sec 54D"],["54EC","Sec 54EC"],
  ["54F","Sec 54F"],["54G","Sec 54G"],["54GA","Sec 54GA"]];                             /* LTCG land Dbelow */
const BBST=[["STL20","Loss from buy back of 'shares taxable at 20%'"],
  ["STL30","Loss from buy back of 'shares taxable at 30%'"],
  ["STLAR","Loss from buy back of 'shares taxable at applicable rate'"]];               /* A(A) r136 */
const BBLT=[["LTL125","Loss from buy back of 'shares taxable at 12.5%'"]];               /* B(A) r421 */
const DEEM_ST_PY=[["2022-23","2022-23"],["2023-24","2023-24"],["2024-25","2024-25"]];
const DEEM_ST_SEC=[["54B","54B"],["54G","54G"],["54GA","54GA"]];
const DEEM_LT_SEC=[["54","54"],["54B","54B"],["54D","54D"],["54F","54F"],["54G","54G"],["54GA","54GA"],["54GB","54GB"]];
/* State-code list for the 194-IA property/buyer detail (TrnsfImmblPrprtyDtls.StateCode,
   enum List-1 — the same 37 states + Foreign the other sections carry). */
const CG_STATE=[["01","Andaman and Nicobar Islands"],["02","Andhra Pradesh"],["03","Arunachal Pradesh"],
  ["04","Assam"],["05","Bihar"],["06","Chandigarh"],["07","Dadra Nagar and Haveli"],["08","Daman and Diu"],
  ["09","Delhi"],["10","Goa"],["11","Gujarat"],["12","Haryana"],["13","Himachal Pradesh"],
  ["14","Jammu and Kashmir"],["15","Karnataka"],["16","Kerala"],["17","Lakshadweep"],["18","Madhya Pradesh"],
  ["19","Maharashtra"],["20","Manipur"],["21","Meghalaya"],["22","Mizoram"],["23","Nagaland"],["24","Odisha"],
  ["25","Puducherry"],["26","Punjab"],["27","Rajasthan"],["28","Sikkim"],["29","Tamil Nadu"],["30","Tripura"],
  ["31","Uttar Pradesh"],["32","West Bengal"],["33","Chhattisgarh"],["34","Uttarakhand"],["35","Jharkhand"],
  ["36","Telangana"],["37","Ladakh"],["99","Foreign"]];
const CG_STATE_SET={};CG_STATE.forEach(x=>CG_STATE_SET[x[0]]=1);
/* B6 (NRIOnSec112and115) section-code list (enums.json SectionCode) */
const B6SEC=[["21ciii","112(1)(c) — unlisted securities"],
  ["5AC1c","115AC — bonds or GDR"],["5ADiii","115AD — securities by FII"]];
/* Yes/No for the DTAA "Tax Residency Certificate obtained?" column */
const TRCYN=[["Y","Yes"],["N","No"]];
/* Part D — DeducClaimInfo detail tables (schema ScheduleCGFor23.DeducClaimInfo).
   Each entry drives the entry grid, the export sub-array and the import read.
   `invest` = 4-column bond/investment shape (54EC/115F); otherwise the 8-column
   CGAS/new-asset shape; `acq` uses DateofAcquisition instead of DateofTransfer (54D). */
const DCLAIM=[
  {ns:"us54",  sec:"54",  key:"DeducClaimDtlsUs54",  lbl:"Sec 54 — new residential house",       cost:"CostofNewResHouse",    costH:"Cost of new residential house"},
  {ns:"us54B", sec:"54B", key:"DeducClaimDtlsUs54B", lbl:"Sec 54B — new agricultural land",       cost:"CostofNewAgriLand",    costH:"Cost of new agricultural land"},
  {ns:"us54D", sec:"54D", key:"DeducClaimDtlsUs54D", lbl:"Sec 54D — new land / building",         cost:"CostofNewLandBuilding",costH:"Cost of new land/building",acq:true},
  {ns:"us54EC",sec:"54EC",key:"DeducClaimDtlsUs54EC",lbl:"Sec 54EC — investment in specified bonds",invest:true},
  {ns:"us54F", sec:"54F", key:"DeducClaimDtlsUs54F", lbl:"Sec 54F — new residential house",       cost:"CostofNewResHouse",    costH:"Cost of new residential house"},
  {ns:"us54G", sec:"54G", key:"DeducClaimDtlsUs54G", lbl:"Sec 54G — new asset (urban → non-urban)",cost:"CostofNewAsset",      costH:"Cost of new asset"},
  {ns:"us54GA",sec:"54GA",key:"DeducClaimDtlsUs54GA",lbl:"Sec 54GA — new asset (SEZ)",            cost:"CostofNewAsset",       costH:"Cost of new asset"},
  {ns:"us115F",sec:"115F",key:"DeducClaimDtlsUs115F",lbl:"Sec 115F — new NRI specified asset",    invest:true}];

/* ---- state (S.cg) ------------------------------------------------- */
/* field paths match the shell's baked-in cg handlers (commit/add/data-addland). */
S.cg = S.cg || {
  on:false,
  land:[],   /* {buy,sale,lt:"Short"|"Long",cons,sdv,cost,exp,improve:[{amt,yr}],
                ded:{s54,s54B,s54D,s54EC,s54F,s54G,s54GA},
                buyers:[{name,pan,aadhaar,share,amt}],paddr,pstate,ppin,pcountry} */
  a2:{},     /* A2 slump-sale STCG  {fmv2,fmv3,networth} */
  a3i:{},    /* A3(i) 111A equity/EOMF STT  {cons,cost,improve,exp,loss94} */
  a6:{},     /* A6 other STCG assets */
  a4:{},     /* A4 111A/other STCG for NR {sttPaid,sttNot} → NRITransacSec48Dtl (NRI only) */
  a5:{},     /* A5 FII 115AD STCG {unqCons,unqFmv,othCons,cost,improve,exp,loss94} → NRISecur115AD (NRI only) */
  a7:{deem:[],other:0},   /* A7 deemed STCG */
  a8:{},     /* A8 pass-through STCG {r20,r30,rApp} */
  a9:[],     /* A9 DTAA STCG {amt,itemno,country,ccode,article,treaty,trc,secit,itact} (NRI only) */
  aA:[],     /* A(A) buy-back STCL {rate,amt} */
  b2:{},     /* B2 slump-sale LTCG {fmv2,fmv3,networth,ded:{s54EC,s54F}} */
  b3i:{},    /* B3(i) listed securities/ZCB 112(1)  {cons,cost,improve,exp,ded:{s54F}} */
  b3ii:{},   /* B3(ii) GDR 115ACA */
  b5:{},     /* B5 unlisted shares/listed deb NR {gain,ded:{s54F}} → NRIProvisoSec48 (NRI only) */
  b6:[],     /* B6 112(1)(c)/115AC/115AD NR {sec,unqCons,unqFmv,othCons,cost,improve,exp,ded:{s54F}} → NRIOnSec112and115 (NRI only) */
  b8:{},     /* B8 115F foreign-exchange asset NRI {sale,ded115} → NRISaleofForeignAsset (NRI only) */
  b9:{},     /* B9 other LTCG assets */
  b10:{deem:[],other:0},  /* B10 deemed LTCG */
  b11:{},    /* B11 pass-through LTCG {r125a,r125o} */
  b12:[],    /* B12 DTAA LTCG (NRI only) */
  bA:[],     /* B(A) buy-back LTCL */
  s112a:[],  /* Schedule 112A scrips */
  s115ad:[], /* Schedule 115AD scrips (NRI FII only) */
  b4:{},     /* B4 112A deduction {s54F} */
  b7:{},     /* B7 115AD-route deduction {s54F} */
  vda:[],    /* Schedule VDA transfers */
  /* Part D · DeducClaimInfo entry tables — the taxpayer enters the claim detail here
     (CGAS / new-asset particulars); this feeds ONLY DeducClaimInfo, never the gain. */
  dclaim:{us54:[],us54B:[],us54D:[],us54EC:[],us54F:[],us54G:[],us54GA:[],us115F:[]},
  editE:false, Eover:null,
  editF:false, Fover:null
};

/* seed grid rows the shell's add-handler reaches by key suffix */
SEED["cg.improve"]=SEED["cg.improve"]||{};
SEED["cg.buyers"]=SEED["cg.buyers"]||{share:100};
SEED["cg.a9"]=SEED["cg.a9"]||{trc:"Y"};
SEED["cg.b12"]=SEED["cg.b12"]||{trc:"Y"};
SEED["cg.aA"]=SEED["cg.aA"]||{rate:"STL20"};
SEED["cg.bA"]=SEED["cg.bA"]||{rate:"LTL125"};
SEED["cg.s112a"]=SEED["cg.s112a"]||{pre18:"AE"};
SEED["cg.s115ad"]=SEED["cg.s115ad"]||{pre18:"AE"};
SEED["cg.vda"]=SEED["cg.vda"]||{};
SEED["cg.a7.deem"]=SEED["cg.a7.deem"]||{py:"2024-25",sec:"54B"};
SEED["cg.b10.deem"]=SEED["cg.b10.deem"]||{py:"2024-25",sec:"54"};

/* =====================================================================
   ENGINE — every formula carries its CG-sheet cell ref
   ===================================================================== */
/* §3 Q10 / Q147 — full value u/s 50C: substitute stamp value only when it
   exceeds actual consideration by more than 10% (IF(sdv>1.1*cons,sdv,cons)) */
function v50C(cons,sdv){cons=N(cons);sdv=N(sdv);
  return {value:(sdv>cons*1.10?sdv:cons),safe:!(sdv>cons*1.10)};}

/* one land/building property (STCG head A1 r21 S21, or LTCG head B1 r171 S171) */
function engLand(p){
  const buy=D(p.buy),sale=D(p.sale);
  const isLT = p.lt==="Long"?true : p.lt==="Short"?false : (HOLD(p.buy,p.sale)!=null && HOLD(p.buy,p.sale)>24);
  const after = sale? sale>=CGCUT : true;                 /* r173 before/after 23-Jul-2024 */
  const c50=v50C(p.cons,p.sdv);                            /* aiii */
  const imps=(p.improve||[]).filter(x=>N(x.amt));
  const impNo=imps.reduce((a,x)=>a+N(x.amt),0);            /* biib(a) total un-indexed */
  /* indexation only for a resident on a pre-23-Jul-2024 acquisition (Q150 biia) */
  const canIndex = isLT && S.fs.resStatus==="RES" && buy && buy<CGCUT;
  const fyB=FYof(p.buy), fyS=FYof(p.sale)||"2025-26";
  const idx=(amt,fy)=>{const b=CGCII[fy]||CGCII[fyB], s=CGCII[fyS]; return (b&&s)?R(N(amt)*s/b):N(amt);};
  const costIdx=canIndex?idx(p.cost,fyB):N(p.cost);        /* biia */
  const impRows=imps.map(x=>({amt:N(x.amt),yr:x.yr,idx:canIndex?idx(x.amt,(x.yr&&CGCII[x.yr])?x.yr:fyB):N(x.amt)}));
  const impIdx=impRows.reduce((a,x)=>a+x.idx,0);           /* biibcii */
  const biv=N(p.cost)+impNo+N(p.exp);                      /* biv (un-indexed) r15/r159 */
  const biva=costIdx+impIdx+N(p.exp);                      /* biva (indexed) r160 */
  const c=R(c50.value-biv);                                /* c  = aiii − biv  (r16/r161) */
  const ca=R(c50.value-biva);                              /* ca = aiii − biva (r162, 1ca) */
  const d=p.ded||{};
  const dedTot = isLT ? (N(d.s54)+N(d.s54B)+N(d.s54D)+N(d.s54EC)+N(d.s54F)+N(d.s54G)+N(d.s54GA))
                      : (N(d.s54B)+N(d.s54G)+N(d.s54GA));  /* STCG land: 54B/54G/54GA only (r17-20) */
  /* S21/S171 — floor at 0 when deduction exceeds a positive balance; a loss passes through */
  const e  = R(c  - Math.min(dedTot,Math.max(0,c)));       /* A1e / B1e */
  const ea = R(ca - Math.min(dedTot,Math.max(0,ca)));      /* B1e(a) */
  /* second proviso to 112(1)(a): resident, pre-July — lower of 12.5% un-indexed and 20% indexed;
     excess ignored (r174 B1ei(A)=1e*12.5%, r175 B1ei(B)=1ea*20%, r176 S176 B1eii) */
  let taxA=0,taxB=0,excess=0;
  if(isLT && canIndex){taxA=R(Math.max(0,e)*0.125); taxB=R(Math.max(0,ea)*0.20); excess=Math.max(0,taxA-taxB);}
  return {isLT,after,value:c50.value,safe:c50.safe,impNo:R(impNo),impIdx:R(impIdx),impRows,
    costIdx:R(costIdx),biv:R(biv),biva:R(biva),c,ca,dedTot:R(dedTot),e,ea,taxA,taxB,excess,canIndex,gain:e};
}

/* an aggregate head carrying the section-48 block (A3, A6, B3, B9) */
function engAgg(o,opts){o=o||{};opts=opts||{};
  let cons=0;
  if(opts.unq){const c50ca=Math.max(N(o.unqCons),N(o.unqFmv)); o._c50ca=c50ca; cons=c50ca+N(o.othCons);} /* 50CA MAX (Q80) */
  else cons=N(o.cons);
  const biv=N(o.cost)+N(o.improve)+N(o.exp);               /* biv */
  const c=R(cons-biv);                                     /* c = balance */
  const l94=opts.loss94?N(o.loss94):0;                     /* 94(7)/94(8) disallowed loss (3id) */
  const dcg=opts.dcg?N(o.dcg):0;                           /* A6e deemed depreciable (Q91 = DCG item6) */
  const ded=(opts.deds||[]).reduce((a,k)=>a+N((o.ded||{})[k]),0);
  const e=R(c+l94+dcg-Math.min(ded,Math.max(0,c+l94+dcg)));
  return {cons:R(cons),biv:R(biv),c,l94:R(l94),dcg:R(dcg),ded:R(ded),e,gain:e};
}

/* slump sale (A2 r30-35 / B2 r189-200): FVC = MAX(FMV11UAE(2),FMV11UAE(3)) (Q33) */
function engSlump(o,lt){o=o||{};const v=Math.max(N(o.fmv2),N(o.fmv3));
  const c=R(v-N(o.networth));                              /* 2c = 2aiii − 2b */
  const ded=lt?(N((o.ded||{}).s54EC)+N((o.ded||{}).s54F)):0; /* B2: 54EC/54F only (r196-199); A2: none */
  const gain=R(c-Math.min(ded,Math.max(0,c)));
  return {value:R(v),c,ded:R(ded),gain};}

/* Schedule 112A / 115AD scrip table (both share the identical column math) */
function engScrip(rows){
  const t={sale:0,cwo:0,cost:0,before:0,fmv:0,exp:0,ded:0,bal:0, before23:0, after23:0};
  (rows||[]).forEach(r=>{
    const pre=r.pre18==="BE";                               /* Col 1a "on or before 31 Jan 2018" */
    const qty=pre?N(r.qty):0, price=pre?N(r.price):0;        /* lock rule: cols 4,5,10,11 = 0 when AE */
    /* Col 6 = Col4×Col5 (K6) for BE; for AE the per-unit cells are locked to zero,
       so the consolidated sale value is entered directly */
    const sale=pre?R(Math.max(0,qty*price)):R(Math.max(0,N(r.sale6)));
    const fmvTot=pre?R(Math.max(0,qty*N(r.fmv18))):0;       /* Col 11 = Col4×Col10 (P6) */
    const col9=pre?R(Math.max(0,Math.min(fmvTot,sale))):0;  /* Col 9 = lower of Col6 & Col11 (N6) */
    const cwo=R(Math.max(0,N(r.cost),col9));                /* Col 7 = higher of Col8 & Col9 (L6) */
    const totded=R(Math.max(0,cwo+N(r.exp)));              /* Col 13 = Col7 + Col12 (T6) */
    const bal=R(sale-totded);                               /* Col 14 = Col6 − Col13 (U6) */
    r._={sale,fmvTot,col9,cwo,cost:N(r.cost),exp:N(r.exp),totded,bal};
    t.sale+=sale; t.cwo+=cwo; t.cost+=N(r.cost); t.before+=col9; t.fmv+=fmvTot; t.exp+=N(r.exp);
    t.ded+=totded; t.bal+=bal;
    if(r.after23==="AF")t.after23+=bal; else t.before23+=bal;   /* Col 1b hidden split (rows 12-13) */
  });
  Object.keys(t).forEach(k=>t[k]=R(t[k]));return t;
}

/* Schedule VDA — per-row income = MAX(0,Consideration−Cost) (I5); totals SUMIF by head */
function engVDA(rows){let bi=0,cg=0;
  (rows||[]).forEach(r=>{const inc=Math.max(0,R(N(r.cons)-N(r.cost))); r._={inc,q:cgQtr(r.sale)};
    if(r.head==="BI")bi+=inc; else if(r.head==="CG")cg+=inc;});
  return {bi:R(bi),cg:R(cg)};}

/* A9 / B12 DTAA relief (CG book §6): per row the applicable rate is the lower of the
   treaty rate and the I.T.-Act rate; a row the treaty makes fully exempt (applicable
   rate 0) is "not chargeable to tax", the rest is taxable at the special DTAA rate. */
function engDTAA(rows){let notTax=0,special=0;
  (rows||[]).forEach(r=>{const amt=N(r.amt);
    const tr=(r.treaty===""||r.treaty==null)?null:N(r.treaty);
    const it=(r.itact===""||r.itact==null)?null:N(r.itact);
    let appl; if(tr!=null&&it!=null)appl=Math.min(tr,it); else appl=(tr!=null?tr:(it!=null?it:0));
    r._appl=appl;
    if(appl<=0)notTax+=amt; else special+=amt;});
  return {notTax:R(notTax),special:R(special)};}

/* the toggle is stored as a string "true"/"false" by the <select>, or a
   boolean by import — normalise both */
function cgOn(){const v=(S.cg||{}).on;return v===true||v==="true"||v==="Yes";}

function engCg(){
  const C=S.cg;
  const KEYS=["st20","st30","stApp","stDTAA","lt125","ltDTAA"];
  const Z=()=>({st20:0,st30:0,stApp:0,stDTAA:0,lt125:0,ltDTAA:0});
  const isNr=S.fs.resStatus!=="RES";
  if(!cgOn()){
    S.C.cg={on:false,nri:isNr,A:{total:0},B:{total:0},C1:0,C2:0,C3:0,
      gain:Z(),loss:Z(),used:Z(),absorbed:Z(),after:Z(),matrix:{},F:{},
      s112a:engScrip([]),s115ad:engScrip([]),vda:{bi:0,cg:0},
      buckets:{},dedD:{},dedTotal:0,shortTerm:0,longTerm:0,total:0,income:0};
    return;
  }
  const s112a=engScrip(C.s112a);
  const s115ad=engScrip(C.s115ad);
  const vda=engVDA(C.vda);

  /* ---- Part A · short-term ---------------------------------------- */
  const land={st:[],lt:[]};
  (C.land||[]).forEach((p,i)=>{const r=engLand(p);p._=r;p._i=i;(r.isLT?land.lt:land.st).push(p);});
  const A={};
  A.a1 = R(land.st.reduce((a,p)=>a+p._.gain,0));            /* A1e r21 */
  A.a2 = engSlump(C.a2,false);                             /* A2c r35 */
  A.a3i= engAgg(C.a3i,{loss94:1});                         /* A3ie r45 (111A equity STT) */
  /* A4 (r57/r60) STCG for NR: A4a=111A (STT), A4b=other shares/debentures — direct amounts */
  A.a4 = {a:R(N((C.a4||{}).sttPaid)), b:R(N((C.a4||{}).sttNot))};
  A.a4.gain = R(A.a4.a + A.a4.b);
  A.a5 = engAgg(C.a5,{unq:1,loss94:1});                     /* A5e r75 (FII 115AD STCG securities) */
  A.a6 = engAgg(C.a6,{unq:1,loss94:1,dcg:1,deds:["s54G","s54GA"]}); /* A6g r96 */
  const a7t=(C.a7&&C.a7.deem||[]).reduce((a,x)=>a+N(x.unused),0)+N((C.a7||{}).other);
  A.a7 = {gain:R(a7t)};                                     /* A7 r104 */
  A.a8 = {gain:R(["r20","r30","rApp"].reduce((a,k)=>a+N((C.a8||{})[k]),0))}; /* A8 r106 */
  A.a9 = engDTAA(C.a9);                                     /* A9a/A9b r120/121 (NR DTAA) */
  A.aA = {loss:R((C.aA||[]).reduce((a,x)=>a+N(x.amt),0))};  /* A(A) r135 buy-back STCL */
  /* A10 r140 = A1e+A2c+A3ie+A4a+A4b+A5e+A6g+A7+A8−A9a + A(A) (A4/A5 are 0 for a resident) */
  A.total=R(A.a1+A.a2.gain+A.a3i.gain+A.a4.gain+A.a5.gain+A.a6.gain+A.a7.gain+A.a8.gain-A.a9.notTax-A.aA.loss);

  /* ---- Part B · long-term ----------------------------------------- */
  const B={};
  B.b1=R(land.lt.reduce((a,p)=>a+p._.gain,0));              /* B1g r185 */
  B.b1excess=R(land.lt.reduce((a,p)=>a+p._.excess,0));     /* B1h ΣB1eii r188 */
  B.b2=engSlump(C.b2,true);                                /* B2e r200 */
  B.b3i=engAgg(C.b3i,{deds:["s54F"]});                     /* B3ie r233 (112(1) listed sec/ZCB) */
  B.b3ii=engAgg(C.b3ii,{deds:["s54F"]});                   /* B3iie r252 (115ACA GDR) */
  const b4ded=N((C.b4||{}).s54F);
  B.b4={a:s112a.bal, ded:R(b4ded), gain:R(s112a.bal-Math.min(b4ded,Math.max(0,s112a.bal)))}; /* B4c r262 (=Col14 112A) */
  /* B5 (r274) unlisted shares/listed debentures NR: LTCG-without-benefit − 54F */
  {const b5g=N((C.b5||{}).gain), b5d=N(((C.b5||{}).ded||{}).s54F);
    B.b5={without:R(b5g), ded:R(b5d), gain:R(b5g-Math.min(b5d,Math.max(0,b5g)))};} /* B5c */
  /* B6 (r292/309/326) 112(1)(c)/115AC/115AD NR: per-row section-48 aggregate − 54F */
  B.b6={rows:(C.b6||[]).map(r=>engAgg(r,{unq:1,deds:["s54F"]}))};
  B.b6.gain=R(B.b6.rows.reduce((a,x)=>a+x.gain,0));         /* B6c */
  B.b7=isNr?{a:s115ad.bal, gain:R(s115ad.bal-Math.min(N((C.b7||{}).s54F),Math.max(0,s115ad.bal)))}:{a:0,gain:0}; /* B7c r336 (=Col14 115AD) */
  /* B8 (r346) sale of foreign-exchange asset by NRI: sale − 115F deduction */
  {const b8s=N((C.b8||{}).sale), b8d=N((C.b8||{}).ded115);
    B.b8={sale:R(b8s), ded:R(b8d), gain:R(b8s-Math.min(b8d,Math.max(0,b8s)))};} /* B8c */
  B.b9=engAgg(C.b9,{unq:1,deds:["s54D","s54F","s54G","s54GA"]}); /* B9e r374 */
  const b10t=(C.b10&&C.b10.deem||[]).reduce((a,x)=>a+N(x.unused),0)+N((C.b10||{}).other);
  B.b10={gain:R(b10t)};                                     /* B10 r397 */
  B.b11={gain:R(["r125a","r125o"].reduce((a,k)=>a+N((C.b11||{})[k]),0))}; /* B11 r400 */
  B.b12=engDTAA(C.b12);                                     /* B12a/B12b r413/414 (NR DTAA) */
  B.bA={loss:R((C.bA||[]).reduce((a,x)=>a+N(x.amt),0))};    /* B(A) r420 */
  /* B13 r425 = B1g+B2e+B3ie+B3iie+B4c+B5c+B6c+B7c+B8c+B9e+B10+B11−B12a + B(A)
     (B5/B6/B8 are 0 for a resident) */
  B.total=R(B.b1+B.b2.gain+B.b3i.gain+B.b3ii.gain+B.b4.gain+B.b5.gain+B.b6.gain+B.b7.gain+B.b8.gain+B.b9.gain
    +B.b10.gain+B.b11.gain-B.b12.notTax-B.bA.loss);

  /* ---- Part E · set-off matrix on the six rate-slots -------------- */
  /* Composition (CG book Table E rows r539-r547, and the A10/B13 heads):
     20%   = A3ie (111A equity STT) + A4a (111A NR) + A8 r20 (PTI 20%)            − STL20
     30%   = A5e (FII 115AD STCG) + A8 r30 (PTI 30%)                              − STL30
     app.  = A1e + A2c + A4b (other NR STCG) + A6g + A7 + A8 rApp (PTI app.)      − STLAR
     DTAA  = A9b
     12.5% = B1g+B2e+B3ie+B3iie+B4c+B5c+B6c+B7c+B8c+B9e+B10+B11                   − B(A)
     LTDTAA= B12b   (A4/A5/B5/B6/B8 are 0 for a resident)                              */
  const bbAt=code=>R((C.aA||[]).filter(x=>(x.rate||"STL20")===code).reduce((a,x)=>a+N(x.amt),0));
  const E={
    st20:R(A.a3i.gain+A.a4.a+N((C.a8||{}).r20)-bbAt("STL20")),
    st30:R(A.a5.gain+N((C.a8||{}).r30)-bbAt("STL30")),
    stApp:R(A.a1+A.a2.gain+A.a4.b+A.a6.gain+A.a7.gain+N((C.a8||{}).rApp)-bbAt("STLAR")),
    stDTAA:R(A.a9.special),
    lt125:R(B.b1+B.b2.gain+B.b3i.gain+B.b3ii.gain+B.b4.gain+B.b5.gain+B.b6.gain+B.b7.gain+B.b8.gain+B.b9.gain+B.b10.gain+B.b11.gain-B.bA.loss),
    ltDTAA:R(B.b12.special)};
  const gain={},loss={},used={},absorbed={},matrix={};
  KEYS.forEach(k=>{gain[k]=Math.max(0,E[k]);loss[k]=Math.max(0,-E[k]);used[k]=0;absorbed[k]=0;matrix[k]={};});
  const isLong=k=>k.charAt(0)==="l";
  if(C.editE && C.Eover){                                   /* r535 "Do you want to edit" override */
    KEYS.forEach(gk=>KEYS.forEach(lk=>{const v=N(((C.Eover[gk]||{})[lk]));
      if(v>0){matrix[gk][lk]=v;absorbed[gk]+=v;used[lk]+=v;}}));
  } else {
    /* auto set-off: a STCL sets off any CG; a LTCL sets off only LTCG (Part E rule) */
    KEYS.forEach(lk=>{if(!loss[lk])return;let avail=loss[lk];
      KEYS.forEach(gk=>{if(avail<=0||gk===lk||!gain[gk])return;
        if(isLong(lk)&&!isLong(gk))return;
        const u=Math.min(avail,gain[gk]-absorbed[gk]);if(u<=0)return;
        matrix[gk][lk]=(matrix[gk][lk]||0)+u;absorbed[gk]+=u;used[lk]+=u;avail-=u;});});
  }
  const after={};let C1=0;
  KEYS.forEach(k=>{after[k]=R(gain[k]-absorbed[k]);C1+=after[k];}); /* C1 r426 = Σ 8ii..8vii of Table E */

  /* ---- Part F · quarters (auto from sale dates; editable) --------- */
  const Fauto={};KEYS.forEach(k=>Fauto[k]=[0,0,0,0,0]);
  (C.land||[]).forEach(p=>{const r=p._;if(!r)return;const q=cgQtr(p.sale);
    const k=r.isLT?"lt125":"stApp"; if(r.gain>0)Fauto[k][q]+=r.gain;});
  const F={};KEYS.forEach(k=>{const ov=(C.Fover||{})[k];
    F[k]=(C.editF&&ov)?ov.map(N):Fauto[k].slice();});

  /* ---- Part C · summary ------------------------------------------- */
  const C2=vda.cg;                                          /* C2 r427 = Sch VDA item B (capital-gain) */
  const C3=R(C1+C2);                                         /* C3 r428 = C1 + C2 */

  /* ---- Part D · deduction particulars ----------------------------- */
  const dedD={};
  const addD=(sec,amt,src)=>{if(!N(amt))return;(dedD[sec]=dedD[sec]||[]).push({amt:N(amt),src});};
  (C.land||[]).forEach((p,i)=>Object.keys(p.ded||{}).forEach(k=>addD(k.replace("s",""),(p.ded||{})[k],"land"+i)));
  [["a6",C.a6],["b3i",C.b3i],["b3ii",C.b3ii],["b9",C.b9],["b2",C.b2]].forEach(([h,o])=>
    Object.keys((o||{}).ded||{}).forEach(k=>addD(k.replace("s",""),(o.ded||{})[k],h)));
  if(N((C.b4||{}).s54F))addD("54F",C.b4.s54F,"b4");
  const dedTotal=Object.values(dedD).reduce((a,rows)=>a+rows.reduce((b,r)=>b+r.amt,0),0);

  /* ---- special-rate buckets for the tax section (Schedule SI) ----- */
  const buckets={
    si111a20:after.st20,          /* STCG 111A @20% */
    si30:after.st30,              /* STCG @30% */
    stApp:after.stApp,            /* STCG at applicable rates */
    stDTAA:after.stDTAA,
    si112a:Math.max(0,Math.min(after.lt125,Math.max(0,B.b4.gain+B.b7.gain))), /* 112A @12.5% (₹1.25L exempt applied at tax) */
    si112:Math.max(0,after.lt125-Math.max(0,B.b4.gain+B.b7.gain)),            /* other LTCG @12.5% */
    ltDTAA:after.ltDTAA,
    si115bbh:vda.cg};             /* VDA @30% u/s 115BBH */

  S.C.cg={on:true,nri:isNr,land,A,B,E,gain,loss,used,absorbed,matrix,after,F,Fauto,
    s112a,s115ad,vda,buckets,dedD,dedTotal:R(dedTotal),
    C1:R(C1),C2:R(C2),C3:R(C3),
    shortTerm:A.total,longTerm:B.total,total:R(C3),
    income:R(C3)};   /* head's contribution to Gross Total Income (signed) — C3 (≥0; net loss carries via loss section) */
}

/* =====================================================================
   RENDERER
   ===================================================================== */
function moneyRow(label,ref,path,ind){return row(label,inp(path,{n:1}),{ref:ref,ind:ind});}
function calcRow(label,ref,n,ind){return row(label,cell(n),{ref:ref,ind:ind});}

function landBlock(p,i,lt){const r=p._||engLand(p);let h="";
  h+=row("Date of purchase / acquisition",dte("cg.land."+i+".buy"),{ref:lt?"B1":"A1"});
  h+=row("Date of sale / transfer",dte("cg.land."+i+".sale"),{});
  h+=row("a i · Full value of consideration",inp("cg.land."+i+".cons",{n:1}),{ref:"ai"});
  h+=row("ii · Value per stamp valuation authority",inp("cg.land."+i+".sdv",{n:1}),{ref:"aii"});
  h+=calcRow("iii · Full value of consideration u/s 50C","aiii",r.value);
  if(!r.safe)h+=note("Stamp value exceeds consideration by more than 10% — u/s 50C the stamp value is adopted.","warn");
  h+=row("b i · Cost of acquisition (without indexation)",inp("cg.land."+i+".cost",{n:1}),{ref:"bi"});
  if(lt&&r.canIndex)h+=calcRow("Cost of acquisition (with indexation)","biia",r.costIdx,1);
  h+=grid("cg.land."+i+".improve",[
      {h:"Cost of improvement",k:"amt",t:"num"},
      {h:"Year",k:"yr",t:"txt",ph:"YYYY-YY"}
    ],(p.improve||[]),{empty:"No improvement.",add:"Add improvement"});
  h+=row("iii · Expenditure wholly & exclusively on transfer",inp("cg.land."+i+".exp",{n:1}),{ref:"biii"});
  h+=calcRow("iv · Total deductions u/s 48 (bi + Σbiib + biii)","biv",r.biv);
  h+=calcRow("c · Balance (aiii − biv)",lt?"1c":"c",r.c);
  /* deductions Dbelow */
  const ex=lt?EXLT_LAND:EXST_LAND;
  ex.forEach(([code,lbl])=>{h+=row("d · Deduction u/s "+code,inp("cg.land."+i+".ded.s"+code,{n:1}),{ref:lbl,ind:1});});
  h+=calcRow(lt?"e · LTCG on Immovable property (1c − 1d)":"e · STCG on Immovable property (1c − 1d)",lt?"B1e":"A1e",r.e);
  if(lt&&r.canIndex){
    h+=calcRow("ei(A) · Tax as per 112(1)(a)(ii)(B) [1e × 12.5%]","B1ei(A)",r.taxA,1);
    h+=calcRow("ei(B) · Tax for 2nd proviso to 112(1)(a) [1ea × 20%]","B1ei(B)",r.taxB,1);
    h+=calcRow("eii · Excess tax to be ignored (2nd proviso)","B1eii",r.excess,1);
  }
  /* buyer table (194-IA) + property location (feeds TrnsfImmblPrprtyDtls) */
  h+=row("Address of property",inp("cg.land."+i+".paddr"),{ref:"AddressOfProperty"});
  h+=row("State",sel("cg.land."+i+".pstate",CG_STATE),{ref:"StateCode"});
  h+=row("Pin code",inp("cg.land."+i+".ppin",{max:6}),{ref:"PinCode"});
  h+=row("Country code",inp("cg.land."+i+".pcountry",{max:4,ph:"91"}),{ref:"CountryCode"});
  h+=grid("cg.land."+i+".buyers",[
      {h:"Name of buyer",k:"name",t:"txt"},
      {h:"PAN",k:"pan",t:"txt",max:10},
      {h:"Aadhaar",k:"aadhaar",t:"txt",max:12},
      {h:"% share",k:"share",t:"num"},
      {h:"Amount",k:"amt",t:"num"}
    ],(p.buyers||[]),{empty:"No buyer detail.",add:"Add a buyer",min:"860px"});
  return blk("cgland"+(lt?"L":"S")+i,(lt?"Long-term property ":"Short-term property ")+(i+1),
    RS(r.gain),h,"cg.land."+i);
}

/* the section-48 aggregate body (shared by A3/A6/B3/B9 and the NR B6 rows) */
function aggBody(path,r,opts,balRef){opts=opts||{};let h="";
  if(opts.unq){
    h+=row("a · Full value — unquoted shares (received/receivable)",inp(path+".unqCons",{n:1}),{ref:"6aia"});
    h+=row("b · Fair market value of unquoted shares (Rule 11UA)",inp(path+".unqFmv",{n:1}),{ref:"aib"});
    h+=row("ii · Full value — assets other than unquoted shares",inp(path+".othCons",{n:1}),{ref:"aii"});
    h+=calcRow("iii · Total consideration (higher of a/b + ii)","aiii",r.cons);
  } else {
    h+=row("a · Full value of consideration",inp(path+".cons",{n:1}),{ref:"ia"});
  }
  h+=row("bi · Cost of acquisition (without indexation)",inp(path+".cost",{n:1}),{ref:"bi",ind:1});
  h+=row("bii · Cost of improvement (without indexation)",inp(path+".improve",{n:1}),{ref:"bii",ind:1});
  h+=row("biii · Expenditure w&e on transfer",inp(path+".exp",{n:1}),{ref:"biii",ind:1});
  h+=calcRow("biv · Total deductions u/s 48","biv",r.biv);
  h+=calcRow("c · Balance",balRef||"c",r.c);
  if(opts.loss94)h+=row("d · Loss disallowed u/s 94(7)/94(8)",inp(path+".loss94",{n:1}),{ref:"id"});
  if(opts.dcg)h+=row("e · Deemed STCG on depreciable assets (Sch DCG item 6)",inp(path+".dcg",{n:1}),{ref:"A6e"});
  (opts.deds||[]).forEach(code=>h+=row("d · Deduction u/s "+code,inp(path+".ded.s"+code,{n:1}),{ref:code,ind:1}));
  return h;
}
function aggBlock(id,title,ref,path,o,r,opts){opts=opts||{};
  const h=aggBody(path,r,opts,id.charAt(0)==="a"?"c":"3c")+calcRow(title+" gain",ref,r.gain);
  return fold(id,ref,title,RS(r.gain),h,{});
}

function scripGrid(key,rows){
  return grid(key,[
    {h:"Acquired",k:"pre18",t:"sel",opts:OB},
    {h:"Transferred",k:"after23",t:"sel",opts:[["BF","Before 23/07/2024"],["AF","On/after 23/07/2024"]]},
    {h:"ISIN",k:"isin",t:"txt",max:12},
    {h:"Name",k:"name",t:"txt",max:30},
    {h:"Qty (if ≤31-Jan-18)",k:"qty",t:"num"},
    {h:"Sale price/unit",k:"price",t:"num"},
    {h:"Sale value (if >31-Jan-18)",k:"sale6",t:"num"},
    {h:"Sale value",k:"sale",t:"calc",f:r=>(r._||{}).sale||0},
    {h:"Cost (Col 8)",k:"cost",t:"num"},
    {h:"FMV/unit 31-Jan-18",k:"fmv18",t:"num"},
    {h:"Cost w/o index (Col 7)",k:"cwo",t:"calc",f:r=>(r._||{}).cwo||0},
    {h:"Expenditure",k:"exp",t:"num"},
    {h:"Total deductions",k:"td",t:"calc",f:r=>(r._||{}).totded||0},
    {h:"Balance (Col 14)",k:"bal",t:"calc",f:r=>(r._||{}).bal||0}
  ],rows,{empty:"No scrip entered.",add:"Add a scrip",min:"1360px"});
}

function setoffTable(G){
  const KEYS=["st20","st30","stApp","stDTAA","lt125","ltDTAA"];
  const LBL={st20:"STCG @20%",st30:"STCG @30%",stApp:"STCG applicable",stDTAA:"STCG DTAA",
    lt125:"LTCG @12.5%",ltDTAA:"LTCG DTAA"};
  let h='<div class="full"><table class="gt" style="min-width:720px"><thead><tr>'+
    '<th class="l">Type of capital gain</th><th>Gain of CY</th><th>Loss set off</th><th>Remaining</th></tr></thead><tbody>';
  KEYS.forEach(k=>{h+='<tr><td class="l">'+esc(LBL[k])+'</td><td class="num">'+cell(G.gain[k])+
    '</td><td class="num">'+cell(G.absorbed[k])+'</td><td class="num">'+cell(G.after[k])+'</td></tr>';});
  h+='</tbody></table></div>';
  return h;
}

function quartersTable(G){
  const KEYS=["st20","st30","stApp","stDTAA","lt125","ltDTAA"];
  const LBL={st20:"STCG @20%",st30:"STCG @30%",stApp:"STCG applicable",stDTAA:"STCG DTAA",
    lt125:"LTCG @12.5%",ltDTAA:"LTCG DTAA"};
  const ed=!!S.cg.editF;
  let h='<div class="full"><table class="gt" style="min-width:820px"><thead><tr><th class="l">Gain</th>'+
    '<th>Upto 15/6</th><th>16/6–15/9</th><th>16/9–15/12</th><th>16/12–15/3</th><th>16/3–31/3</th></tr></thead><tbody>';
  KEYS.forEach(k=>{h+='<tr><td class="l">'+esc(LBL[k])+'</td>';
    for(let q=0;q<5;q++){const v=(G.F[k]||[])[q]||0;
      h+='<td>'+(ed?inp("cg.Fover."+k+"."+q,{n:1}):cell(v))+'</td>';}
    h+='</tr>';});
  h+='</tbody></table></div>';
  return h;
}

/* Part D — DeducClaimInfo entry tables (one grid per section; DISCLOSURE only). */
function dclaimBlock(C){
  const dc=C.dclaim||{};let h="";
  DCLAIM.forEach(D=>{const rows=dc[D.ns]||[];let cols;
    if(D.invest)cols=[
      {h:"Date of transfer of original asset",k:"transfer",t:"date"},
      {h:"Amount invested",k:"invested",t:"num"},
      {h:"Date of investment",k:"invdate",t:"date"},
      {h:"Amount of deduction claimed",k:"amt",t:"num"}];
    else cols=[
      {h:(D.acq?"Date of acquisition of original asset":"Date of transfer of original asset"),k:"transfer",t:"date"},
      {h:D.costH,k:"cost",t:"num"},
      {h:"Date of purchase / construction",k:"purchase",t:"date"},
      {h:"Amount deposited in CGAS before due date",k:"deposited",t:"num"},
      {h:"Date of deposit",k:"depdate",t:"date"},
      {h:"Account no.",k:"acno",t:"txt",max:20},
      {h:"IFS code",k:"ifsc",t:"txt",max:11},
      {h:"Amount of deduction claimed",k:"amt",t:"num"}];
    h+='<p style="margin:12px 0 2px;font-weight:600;color:var(--ink-2)">'+esc(D.lbl)+'</p>';
    h+=grid("cg.dclaim."+D.ns,cols,rows,{empty:"No claim detail entered.",add:"Add a claim",min:D.invest?"760px":"1280px"});
  });
  return h;
}

/* A9 / B12 DTAA detail grid (NRICgDTAA.NRIDTAADtls) */
function dtaaGrid(key,rows){
  return grid(key,[
    {h:"Amount of income",k:"amt",t:"num"},
    {h:"Item (A1–A8 / B1–B9) included",k:"itemno",t:"txt",max:10},
    {h:"Country name",k:"country",t:"txt"},
    {h:"Country code",k:"ccode",t:"txt",max:5},
    {h:"Article of DTAA",k:"article",t:"txt",max:20},
    {h:"Rate as per Treaty (%)",k:"treaty",t:"num"},
    {h:"TRC obtained?",k:"trc",t:"sel",opts:TRCYN},
    {h:"Section of I.T. Act",k:"secit",t:"txt",max:20},
    {h:"Rate as per I.T. Act (%)",k:"itact",t:"num"},
    {h:"Applicable rate (lower)",k:"appl",t:"calc",f:r=>(r._appl!=null?r._appl:0)}
  ],rows,{empty:"No DTAA relief entered.",add:"Add a DTAA row",min:"1360px"});
}

function secCg(){
  const G=S.C.cg||{on:false};
  if(!G.on){
    return note("Turn this on to open Schedule CG — land/building, slump sale, listed equity (112A), other assets, deemed gains, pass-through, DTAA, buy-back losses, and Virtual Digital Assets.")+
      row("Report capital gains?",sel("cg.on",[["true","Yes"]],{blank:true}),{ref:"Schedule CG · C3"});
  }
  const C=S.cg;let h="";
  /* master toggle */
  h+=row("Report capital gains?",sel("cg.on",[["false","No"],["true","Yes"]],{blank:false}),{ref:"Schedule CG"});
  /* ---- A · short-term ---- */
  let a="";
  (G.land.st||[]).forEach(p=>a+=landBlock(p,p._i,false));
  a+='<button class="add" data-addland="Short">Add a short-term property (A1)</button>';
  a+=fold("cga2","A2c","A2 · Slump sale (STCG)",RS(G.A.a2.gain),
    row("ai · FMV as per Rule 11UAE(2)",inp("cg.a2.fmv2",{n:1}),{ref:"2ai"})+
    row("aii · FMV as per Rule 11UAE(3)",inp("cg.a2.fmv3",{n:1}),{ref:"2aii"})+
    calcRow("aiii · Full value (higher of ai/aii)","2aiii",G.A.a2.value)+
    row("b · Net worth of the undertaking",inp("cg.a2.networth",{n:1}),{ref:"2b"})+
    calcRow("c · STCG from slump sale (2aiii − 2b)","A2c",G.A.a2.gain),{});
  a+=aggBlock("cga3i","A3(i) · 111A equity share / EOMF (STT paid)","A3ie","cg.a3i",C.a3i,G.A.a3i,{loss94:1});
  a+=aggBlock("cga6","A6 · STCG on other assets","A6g","cg.a6",C.a6,G.A.a6,{unq:1,loss94:1,dcg:1,deds:["54G","54GA"]});
  /* A7 deemed */
  /* A7 unutilised-CG (deemed) — the deem grid is gated by the UnutilizedStcgFlag Yes/No
     selector; a previously-imported grid stays visible even when the flag is blank */
  const a7unut=st0((C.a7||{}).unutFlag)==="Y"||(((C.a7||{}).deem||[]).length>0);
  a+=fold("cga7","A7","A7 · Amount deemed to be STCG",RS(G.A.a7.gain),
    row("Whether any unutilized capital gain from an earlier year is chargeable now?",
      sel("cg.a7.unutFlag",[["N","No"],["Y","Yes"]],{blank:true}),{ref:"UnutilizedStcgFlag"})+
    (a7unut?grid("cg.a7.deem",[
      {h:"PY of transfer",k:"py",t:"sel",opts:DEEM_ST_PY},
      {h:"Section",k:"sec",t:"sel",opts:DEEM_ST_SEC},
      {h:"PY new asset acquired/constructed",k:"yracq",t:"txt",ph:"YYYY-YY"},
      {h:"Amount utilised out of CGAS",k:"util",t:"num"},
      {h:"Amount unutilised",k:"unused",t:"num"}
    ],(C.a7||{}).deem||[],{empty:"No unutilised CGAS.",add:"Add a row",min:"940px"}):"")+
    row("b · Other amount deemed STCG u/s 54B/54G/54GA",inp("cg.a7.other",{n:1}),{ref:"7b"})+
    calcRow("Total deemed STCG","A7",G.A.a7.gain),{});
  /* A8 PTI */
  a+=fold("cga8","A8","A8 · Pass-through STCG (Sch PTI)",RS(G.A.a8.gain),
    row("a · chargeable @ 20%",inp("cg.a8.r20",{n:1}),{ref:"8a"})+
    row("b · chargeable @ 30%",inp("cg.a8.r30",{n:1}),{ref:"8b"})+
    row("c · at applicable rates",inp("cg.a8.rApp",{n:1}),{ref:"8c"})+
    calcRow("Total pass-through STCG","A8",G.A.a8.gain),{});
  /* A(A) buy-back STCL */
  a+=fold("cgaA","A(A)","A(A) · Capital loss on buy-back of shares (STCL)",RS(-G.A.aA.loss),
    grid("cg.aA",[{h:"Rate",k:"rate",t:"sel",opts:BBST},{h:"Loss amount",k:"amt",t:"num"}],
      C.aA||[],{empty:"No buy-back loss.",add:"Add a row",min:"560px"}),{});
  /* NON-RESIDENT STCG heads A4/A5 + DTAA A9 — surfaced only for a non-resident */
  if(G.nri){
    a+=fold("cga4","A4","A4 · STCG for a non-resident (111A / other shares & debentures)",RS(G.A.a4.gain),
      row("a · STCG on transactions covered u/s 111A (STT paid)",inp("cg.a4.sttPaid",{n:1}),{ref:"A4a"})+
      row("b · STCG from shares/debentures not covered at 4a (STT not paid)",inp("cg.a4.sttNot",{n:1}),{ref:"A4b"})+
      calcRow("Total STCG for non-resident (A4a + A4b)","A4",G.A.a4.gain),{});
    a+=aggBlock("cga5","A5 · STCG on securities by an FII u/s 115AD","A5e","cg.a5",C.a5,G.A.a5,{unq:1,loss94:1});
    a+=fold("cga9","A9","A9 · STCG not chargeable / chargeable at special rate per DTAA",RS(G.A.a9.special),
      dtaaGrid("cg.a9",C.a9||[])+
      calcRow("a · STCG not chargeable to tax as per DTAA","A9a",G.A.a9.notTax)+
      calcRow("b · STCG chargeable at special rate as per DTAA","A9b",G.A.a9.special),{});
  }
  a+=calcRow("A10 · Total short-term capital gain","A10",G.A.total);
  h+=fold("cgA","A · STCG","Short-term capital gains",RS(G.A.total),a,{def:true});

  /* ---- B · long-term ---- */
  let b="";
  (G.land.lt||[]).forEach(p=>b+=landBlock(p,p._i,true));
  b+='<button class="add" data-addland="Long">Add a long-term property (B1)</button>';
  b+=fold("cgb2","B2e","B2 · Slump sale (LTCG)",RS(G.B.b2.gain),
    row("ai · FMV as per Rule 11UAE(2)",inp("cg.b2.fmv2",{n:1}),{ref:"2ai"})+
    row("aii · FMV as per Rule 11UAE(3)",inp("cg.b2.fmv3",{n:1}),{ref:"2aii"})+
    calcRow("aiii · Full value (higher of ai/aii)","2aiii",G.B.b2.value)+
    row("b · Net worth of the undertaking",inp("cg.b2.networth",{n:1}),{ref:"2b"})+
    calcRow("c · Balance (2aiii − 2b)","2c",G.B.b2.c)+
    row("di · Deduction u/s 54EC",inp("cg.b2.ded.s54EC",{n:1}),{ref:"di",ind:1})+
    row("dii · Deduction u/s 54F",inp("cg.b2.ded.s54F",{n:1}),{ref:"dii",ind:1})+
    calcRow("e · LTCG from slump sale (2c − 2d)","B2e",G.B.b2.gain),{});
  b+=aggBlock("cgb3i","B3(i) · Listed securities / ZCB u/s 112(1)","B3ie","cg.b3i",C.b3i,G.B.b3i,{deds:["54F"]});
  b+=aggBlock("cgb3ii","B3(ii) · GDR of Indian company u/s 115ACA","B3iie","cg.b3ii",C.b3ii,G.B.b3ii,{deds:["54F"]});
  /* B4 112A */
  b+=fold("cgb4","B4c","B4 · Equity / EOMF / business trust u/s 112A (STT paid)",RS(G.B.b4.gain),
    note("Enter the scrips in Schedule 112A below; Col 14 total feeds B4a.")+
    calcRow("a · LTCG u/s 112A (Col 14 of Schedule 112A)","4a",G.B.b4.a)+
    row("b · Deduction u/s 54F",inp("cg.b4.s54F",{n:1}),{ref:"4b"})+
    calcRow("c · LTCG on assets at B4 (4a − 4b)","B4c",G.B.b4.gain)+
    scripGrid("cg.s112a",C.s112a||[])+
    calcRow("Total balance (Schedule 112A, Col 14)","Balance112A",(G.s112a||{}).bal||0),{def:true});
  b+=aggBlock("cgb9","B9 · LTCG on other assets","B9e","cg.b9",C.b9,G.B.b9,{unq:1,deds:["54D","54F","54G","54GA"]});
  /* B10 deemed */
  /* B10 unutilised-CG (deemed) — gated by the UnutilizedLtcgFlag Yes/No selector */
  const b10unut=st0((C.b10||{}).unutFlag)==="Y"||(((C.b10||{}).deem||[]).length>0);
  b+=fold("cgb10","B10","B10 · Amount deemed to be LTCG",RS(G.B.b10.gain),
    row("Whether any unutilized capital gain from an earlier year is chargeable now?",
      sel("cg.b10.unutFlag",[["N","No"],["Y","Yes"]],{blank:true}),{ref:"UnutilizedLtcgFlag"})+
    (b10unut?grid("cg.b10.deem",[
      {h:"PY of transfer",k:"py",t:"sel",opts:DEEM_ST_PY},
      {h:"Section",k:"sec",t:"sel",opts:DEEM_LT_SEC},
      {h:"PY new asset acquired/constructed",k:"yracq",t:"txt",ph:"YYYY-YY"},
      {h:"Amount utilised out of CGAS",k:"util",t:"num"},
      {h:"Amount unutilised",k:"unused",t:"num"}
    ],(C.b10||{}).deem||[],{empty:"No unutilised CGAS.",add:"Add a row",min:"940px"}):"")+
    row("b · Other amount deemed LTCG",inp("cg.b10.other",{n:1}),{ref:"10b"})+
    calcRow("Total deemed LTCG","B10",G.B.b10.gain),{});
  /* B11 PTI */
  b+=fold("cgb11","B11","B11 · Pass-through LTCG (Sch PTI)",RS(G.B.b11.gain),
    row("a1 · chargeable @ 12.5% u/s 112A",inp("cg.b11.r125a",{n:1}),{ref:"11a1"})+
    row("a2 · chargeable @ 12.5% other than 112A",inp("cg.b11.r125o",{n:1}),{ref:"11a2"})+
    calcRow("Total pass-through LTCG","B11",G.B.b11.gain),{});
  /* B(A) buy-back LTCL */
  b+=fold("cgbA","B(A)","B(A) · Capital loss on buy-back of shares (LTCL @12.5%)",RS(-G.B.bA.loss),
    grid("cg.bA",[{h:"Rate",k:"rate",t:"sel",opts:BBLT},{h:"Loss amount",k:"amt",t:"num"}],
      C.bA||[],{empty:"No buy-back loss.",add:"Add a row",min:"560px"}),{});
  /* NON-RESIDENT LTCG heads B5/B6/B8 + DTAA B12 — surfaced only for a non-resident */
  if(G.nri){
    b+=fold("cgb5","B5c","B5 · LTCG on unlisted shares / listed debentures (non-resident)",RS(G.B.b5.gain),
      row("a · LTCG computed without indexation / forex benefit (1st proviso to s.48)",inp("cg.b5.gain",{n:1}),{ref:"5a"})+
      row("b · Deduction u/s 54F",inp("cg.b5.ded.s54F",{n:1}),{ref:"5b",ind:1})+
      calcRow("c · LTCG on assets at B5 (5a − 5b)","B5c",G.B.b5.gain),{});
    let b6="";
    (C.b6||[]).forEach((r,i)=>{const rr=(G.B.b6.rows||[])[i]||engAgg(r,{unq:1,deds:["s54F"]});
      b6+=blk("cgb6_"+i,"B6 asset "+(i+1),RS(rr.gain),
        row("Section",sel("cg.b6."+i+".sec",B6SEC),{ref:"6"})+
        aggBody("cg.b6."+i,rr,{unq:1,deds:["54F"]},"6c")+
        calcRow("e · LTCG on assets at B6 (6c − 6d)","B6e",rr.gain),
        "cg.b6."+i);});
    b6+='<button class="add" data-add="cg.b6">Add a B6 asset</button>';
    b+=fold("cgb6","B6c","B6 · LTCG for non-resident u/s 112(1)(c) / 115AC / 115AD",RS(G.B.b6.gain),b6,{});
    b+=fold("cgb8","B8c","B8 · LTCG on sale of foreign-exchange asset by an NRI (u/s 115F)",RS(G.B.b8.gain),
      row("a · Sale value of the specified asset",inp("cg.b8.sale",{n:1}),{ref:"8a"})+
      row("b · Deduction u/s 115F",inp("cg.b8.ded115",{n:1}),{ref:"8b",ind:1})+
      calcRow("c · Balance LTCG on specified asset (8a − 8b)","B8c",G.B.b8.gain),{});
    b+=fold("cgb12","B12","B12 · LTCG not chargeable / chargeable at special rate per DTAA",RS(G.B.b12.special),
      dtaaGrid("cg.b12",C.b12||[])+
      calcRow("a · LTCG not chargeable to tax as per DTAA","B12a",G.B.b12.notTax)+
      calcRow("b · LTCG chargeable at special rate as per DTAA","B12b",G.B.b12.special),{});
  }
  b+=calcRow("B13 · Total long-term capital gain","B13",G.B.total);
  h+=fold("cgB","B · LTCG","Long-term capital gains",RS(G.B.total),b,{def:true});

  /* NRI FII head B7 / Schedule 115AD — only for a non-resident */
  if(G.nri){
    h+=fold("cgb7","B7c","B7 · FII/FPI 112A route u/s 115AD(1)(iii) proviso",RS(G.B.b7.gain),
      calcRow("a · LTCG (Col 14 of Schedule 115AD)","7a",G.B.b7.a)+
      row("b · Deduction u/s 54F",inp("cg.b7.s54F",{n:1}),{ref:"7b"})+
      calcRow("c · LTCG on assets at B7 (7a − 7b)","B7c",G.B.b7.gain)+
      scripGrid("cg.s115ad",C.s115ad||[]),{});
  }

  /* ---- C · summary ---- */
  h+=fold("cgC","C","Summary of capital gains",RS(G.C3),
    calcRow("C1 · Sum of capital gain income (Table E after set-off)","C1",G.C1)+
    calcRow("C2 · Income from transfer of Virtual Digital Assets (Sch VDA item B)","C2",G.C2)+
    calcRow("C3 · Income chargeable under CAPITAL GAINS (C1 + C2)","C3",G.C3),{def:true});

  /* ---- Schedule VDA ---- */
  let v="";
  v+=grid("cg.vda",[
      {h:"Date of acquisition",k:"buy",t:"date"},
      {h:"Date of transfer",k:"sale",t:"date"},
      {h:"Head",k:"head",t:"sel",opts:HEADVDA},
      {h:"Cost of acquisition",k:"cost",t:"num"},
      {h:"Consideration received",k:"cons",t:"num"},
      {h:"Income (Col 6 − Col 5)",k:"inc",t:"calc",f:r=>(r._||{}).inc||0}
    ],C.vda||[],{empty:"No VDA transfer.",add:"Add a transfer",min:"820px"});
  v+=calcRow("A · Total positive Business Income (Sch BP 3g u/s 115BBH)","A",G.vda.bi);
  v+=calcRow("B · Total positive Capital Gain (feeds C2)","B",G.vda.cg);
  h+=fold("cgVDA","Schedule VDA","Virtual Digital Assets",RS(G.vda.bi+G.vda.cg),v,{});

  /* ---- D · deductions claimed ---- */
  let d="";
  if(G.dedTotal){Object.keys(G.dedD).forEach(sec=>{const rows=G.dedD[sec];
    d+=calcRow("Deduction u/s "+sec,sec,rows.reduce((a,r)=>a+r.amt,0));});}
  d+=calcRow("1i · Total deduction claimed","1i",G.dedTotal);
  h+=fold("cgD","D","Deductions claimed against capital gains",RS(G.dedTotal),
    (G.dedTotal?"":note("Deductions entered against each head above are totalled here."))+d,{});
  /* Part D detail — the per-claim CGAS / new-asset particulars (DeducClaimInfo).
     Disclosure only: these amounts do NOT change the computed capital-gain figures. */
  let dclaimTot=0;DCLAIM.forEach(D=>((C.dclaim||{})[D.ns]||[]).forEach(r=>dclaimTot+=N(r.amt)));
  h+=fold("cgDdet","D","Details of deduction claimed (CGAS / new asset)",RS(dclaimTot),
    note("Enter the proof of each exemption claimed above — date of transfer, cost of the new asset, "+
      "CGAS deposit and account. This is disclosure detail; it does not alter the computed gain.")+
    dclaimBlock(C),{});

  /* ---- E · set-off ---- */
  h+=fold("cgE","E","Set-off of current-year capital losses",RS(G.C1),
    setoffTable(G)+
    row("Edit the auto-populated set-off?",sel("cg.editE",[["false","No"],["true","Yes"]],{blank:false}),{ref:"r535"}),{});

  /* ---- F · quarterly split (234C) ---- */
  h+=fold("cgF","F","Accrual / receipt of capital gain (quarterly, for 234C)","—",
    quartersTable(G)+
    row("Edit the auto-filled quarters?",sel("cg.editF",[["false","No"],["true","Yes"]],{blank:false}),{ref:"r536"}),{});

  return h;
}

/* =====================================================================
   EXPORT — ScheduleCGFor23 / Schedule112A / Schedule115AD / ScheduleVDA
   ===================================================================== */
function scripBlock(rows,suf){
  const good=(rows||[]).filter(r=>r.pre18&&(N((r._||{}).sale)||N((r._||{}).bal)||N(r.cost)||N(r.sale6)||N(r.qty)));
  if(!good.length)return null;
  const t=engScrip(good);
  const dtls=good.map(r=>{const x=r._||{};
    const pre=r.pre18==="BE";
    return {ShareOnOrBefore:r.pre18==="BE"?"BE":"AE",
      ISINCode: pre?(/^IN[0-9A-Z]{10}$/.test(st0(r.isin).toUpperCase())?st0(r.isin).toUpperCase():"INNOTAVAILAB"):"INNOTREQUIRD",
      ShareUnitName: pre?((sv(r.name)||"NA").slice(0,125)):"CONSOLIDATED",
      NumSharesUnits: pre?(N(r.qty)||undefined):undefined,
      SalePricePerShareUnit: pre?(N(r.price)||undefined):undefined,
      TotSaleValue:n0(x.sale),CostAcqWithoutIndx:n0(x.cwo),AcquisitionCost:n0(r.cost),
      LTCGBeforelower6and11:n0(x.col9),FairMktValuePerShareunit:pre?(N(r.fmv18)||0):0,
      TotFairMktValueCapAst:n0(x.fmvTot),ExpExclCnctTransfer:n0(r.exp),
      TotalDeductions:n0(x.totded),Balance:sg(x.bal)};});
  const b={};b["Schedule"+suf+"Dtls"]=dtls;
  b["SaleValue"+suf]=n0(t.sale); b["CostAcqWithoutIndx"+suf]=n0(t.cwo);
  b["AcquisitionCost"+suf]=n0(t.cost); b["LTCGBeforelowerB1B2"+suf]=n0(t.before);
  b["FairMktValueCapAst"+suf]=n0(t.fmv); b["ExpExclCnctTransfer"+suf]=n0(t.exp);
  b["Deductions"+suf]=n0(t.ded); b["Balance"+suf]=sg(t.bal);
  return b;
}

function expCg(j){
  const G=S.C.cg;if(!G||!G.on)return;
  const C=S.cg,A=G.A,B=G.B;
  const buyers=p=>{const bs=(p.buyers||[]).filter(x=>st0(x.name));if(!bs.length)return undefined;
    return {TrnsfImmblPrprtyDtls:bs.map(x=>({NameOfBuyer:st0(x.name).slice(0,125),
      PANofBuyer:PAN_RE.test(st0(x.pan).toUpperCase())?st0(x.pan).toUpperCase():undefined,
      AaadhaarOfBuyer:AADH.test(st0(x.aadhaar))?st0(x.aadhaar):undefined,
      PercentageShare:N(x.share)||100,Amount:n0(x.amt),
      AddressOfProperty:(sv(p.paddr)||"NA").slice(0,50),
      StateCode:CG_STATE_SET[st0(p.pstate)]?st0(p.pstate):"19",
      CountryCode:(st0(p.pcountry)||"91").slice(0,4),
      PinCode:/^[1-9]\d{5}$/.test(st0(p.ppin))?parseInt(p.ppin,10):undefined}))};};
  /* A9/B12 DTAA detail → NRICgDTAA.NRIDTAADtls[] (emitted only when there are rows) */
  const dtaaOut=rows=>{const good=(rows||[]).filter(r=>N(r.amt));if(!good.length)return undefined;
    return {NRIDTAADtls:good.map(r=>{const o={DTAAamt:n0(r.amt),ItemNoincl:st0(r.itemno),
      CountryName:st0(r.country),CountryCodeExcludingIndia:st0(r.ccode),DTAAarticle:st0(r.article),
      RateAsPerTreaty:N(r.treaty),SecITAct:st0(r.secit),RateAsPerITAct:N(r.itact)};
      if(r.trc)o.TaxRescertifiedFlag=r.trc;
      if(r._appl!=null)o.ApplicableRate=r._appl;
      return o;})};};

  /* ---- Part A ---- */
  const ST={};
  const stLand=(G.land.st||[]).map(p=>{const r=p._;const ex=[];
    [["s54B","54B"],["s54G","54G"],["s54GA","54GA"]]     /* STCG land: 54B/54G/54GA only */
      .forEach(([k,c])=>{if(N((p.ded||{})[k]))ex.push({ExemptionSecCode:c,ExemptionAmount:n0(p.ded[k])});});
    return {DateofPurchase:ISO(p.buy),DateofSale:ISO(p.sale),
    FullConsideration:n0(p.cons),PropertyValuation:n0(p.sdv),FullConsideration50C:n0(r.value),
    AquisitCost:n0(p.cost),ImproveCost:n0(r.impNo),ExpOnTrans:n0(p.exp),TotalDedn:n0(r.biv),
    Balance:sg(r.c),ExemptionOrDednUs54:Object.assign({ExemptionGrandTotal:n0(r.dedTot)},ex.length?{ExemptionOrDednUs54Dtls:ex}:{}),
    CapgainonAssets:sg(r.e),TrnsfImmblPrprty:buyers(p)};});
  if(stLand.length)ST.SaleofLandBuild={SaleofLandBuildDtls:stLand};
  if(N(C.a2&&(C.a2.fmv2||C.a2.fmv3||C.a2.networth)))
    ST.SlumpSaleInStcg={FMV11UAEii:n0(C.a2.fmv2),FMV11UAEiii:n0(C.a2.fmv3),
      FullConsideration:n0(A.a2.value),NetWorthOfDivision:n0(C.a2.networth),CapgainonAssets:sg(A.a2.gain)};
  if(N((C.a3i||{}).cons))ST.EquityMFonSTT=[{MFSectionCode:"1A",EquityMFonSTTDtls:{
    FullConsideration:n0(A.a3i.cons),DeductSec48:{AquisitCost:n0(C.a3i.cost),ImproveCost:n0(C.a3i.improve),
      ExpOnTrans:n0(C.a3i.exp),TotalDedn:n0(A.a3i.biv)},BalanceCG:sg(A.a3i.c),
    LossSec94of7Or94of8:n0(C.a3i.loss94),CapgainonAssets:sg(A.a3i.gain)}}];
  if(N((C.a6||{}).unqCons)||N((C.a6||{}).othCons)||N((C.a6||{}).cost)||N(A.a6.dcg))
    ST.SaleOnOtherAssets={FullValueConsdRecvUnqshr:n0(C.a6.unqCons),FairMrktValueUnqshr:n0(C.a6.unqFmv),
      FullValueConsdSec50CA:n0(C.a6._c50ca||Math.max(N(C.a6.unqCons),N(C.a6.unqFmv))),
      FullValueConsdOthUnqshr:n0(C.a6.othCons),
      DeductSec48:{AquisitCost:n0(C.a6.cost),ImproveCost:n0(C.a6.improve),ExpOnTrans:n0(C.a6.exp),TotalDedn:n0(A.a6.biv)},
      BalanceCG:sg(A.a6.c),LossSec94of7Or94of8:n0(C.a6.loss94),DeemedStcgOnAssets:n0(A.a6.dcg),
      ExemptionOrDednUs54:{ExemptionGrandTotal:n0(A.a6.ded)},CapgainonAssets:sg(A.a6.gain)};
  ST.TotalAmtDeemedStcg=n0(A.a7.gain);
  /* UnutilizedStcgFlag — free-optional Y/N; emit only when the taxpayer set it
     (a resident who never touches it stays byte-identical) */
  if(st0((C.a7||{}).unutFlag))ST.UnutilizedStcgFlag=st0(C.a7.unutFlag);
  const dm=(C.a7&&C.a7.deem||[]).filter(x=>N(x.unused)||N(x.util));
  if(dm.length)ST.UnutilizedCg={UnutilizedCgPrvYrDtls:dm.map(x=>{const o={
    PrvYrInWhichAsstTrnsfrd:x.py||"2024-25",SectionClmd:x.sec||"54B",AmtUnutilized:n0(x.unused)};
    if(st0(x.yracq))o.YrInWhichAssetAcq=st0(x.yracq);
    if(N(x.util))o.AmtUtilized=n0(x.util);return o;})};
  if(N((C.a7||{}).other))ST.AmtDeemedStcg=n0(C.a7.other);
  ST.PassThrIncNatureSTCG=n0(A.a8.gain);
  /* pass-through STCG by tax rate (Sch PTI, nature = capital gain) — free-optional;
     the amounts already roll into E.st20/st30/stApp above. Emit only when non-zero. */
  if(N((C.a8||{}).r20))ST.PassThrIncNatureSTCG20Per=n0(C.a8.r20);
  if(N((C.a8||{}).r30))ST.PassThrIncNatureSTCG30Per=n0(C.a8.r30);
  if(N((C.a8||{}).rApp))ST.PassThrIncNatureSTCGAppRate=n0(C.a8.rApp);
  ST.TotalAmtNotTaxUsDTAAStcg=n0(A.a9.notTax);ST.TotalAmtTaxUsDTAAStcg=n0(A.a9.special);
  const bb=(C.aA||[]).filter(x=>N(x.amt));
  if(bb.length)ST.CapitalLossBuyBackShares={TotalCapitalLossBuyBackShares:-n0(A.aA.loss),
    CapitalLossBuyBackSharesDtls:bb.map(x=>({Rate:x.rate||"STL20",Amount:-n0(x.amt)}))};
  /* NON-RESIDENT STCG heads A4/A5 + DTAA A9 (assigned before the zero-stub dfl below) */
  if(G.nri){
    if(N((C.a4||{}).sttPaid)||N((C.a4||{}).sttNot))
      ST.NRITransacSec48Dtl={NRItaxSTTPaid:n0((C.a4||{}).sttPaid),NRItaxSTTNotPaid:n0((C.a4||{}).sttNot)};
    if(N((C.a5||{}).unqCons)||N((C.a5||{}).othCons)||N((C.a5||{}).cost))
      ST.NRISecur115AD={FullValueConsdRecvUnqshr:n0(C.a5.unqCons),FairMrktValueUnqshr:n0(C.a5.unqFmv),
        FullValueConsdSec50CA:n0(C.a5._c50ca||Math.max(N(C.a5.unqCons),N(C.a5.unqFmv))),
        FullValueConsdOthUnqshr:n0(C.a5.othCons),FullConsideration:n0(A.a5.cons),
        DeductSec48:{AquisitCost:n0(C.a5.cost),ImproveCost:n0(C.a5.improve),ExpOnTrans:n0(C.a5.exp),TotalDedn:n0(A.a5.biv)},
        BalanceCG:sg(A.a5.c),LossSec94of7Or94of8:n0(C.a5.loss94),CapgainonAssets:sg(A.a5.gain)};
    const a9d=dtaaOut(C.a9); if(a9d)ST.NRICgDTAA=a9d;
  }
  ST.TotalSTCG=sg(A.total);

  /* ---- Part B ---- */
  const LT={};
  const ltLand=(G.land.lt||[]).map(p=>{const r=p._;const ex=[];
    [["s54","54"],["s54B","54B"],["s54D","54D"],["s54EC","54EC"],["s54F","54F"],["s54G","54G"],["s54GA","54GA"]]
      .forEach(([k,c])=>{if(N((p.ded||{})[k]))ex.push({ExemptionSecCode:c,ExemptionAmount:n0(p.ded[k])});});
    return {DateofPurchase:ISO(p.buy),DateofSale:ISO(p.sale),FullConsideration:n0(p.cons),
      PropertyValuation:n0(p.sdv),FullConsideration50C:n0(r.value),AquisitCost:n0(p.cost),
      AquisitCostIndex:n0(r.costIdx),
      CostOfImprovements:{CostOfImprovementsDtls:(r.impRows||[]).map((x,k)=>({slno:k+1,
        ImproveDate:st0(x.yr)||"2020-21",ImproveCost:n0(x.amt),CostOfImpIndex:n0(x.idx)})),
        TotalImprovecost:n0(r.impNo),TotalindexImprovecost:n0(r.impIdx)},
      ExpOnTrans:n0(p.exp),TotalDedn:n0(r.biv),TotalDednForEiB:n0(r.biva),
      Balance:sg(r.c),BalanceForEiB:sg(r.ca),
      ExemptionOrDednUs54:Object.assign({ExemptionGrandTotal:n0(r.dedTot)},ex.length?{ExemptionOrDednUs54Dtls:ex}:{}),
      CapgainonAssets:sg(r.e),CapgainonAssets_1ea:sg(r.ea),
      TaxSec1121aiiB:n0(r.taxA),TaxSec1121a:n0(r.taxB),ExcessAmtSec1121a:n0(r.excess),TrnsfImmblPrprty:buyers(p)};});
  if(ltLand.length)LT.SaleofLandBuild={SaleofLandBuildDtls:ltLand,TotalLTCGImmblPrprty:sg(B.b1),TotalExcessTax:n0(B.b1excess)};
  if(N(C.b2&&(C.b2.fmv2||C.b2.fmv3||C.b2.networth)))
    LT.SlumpSaleInLtcgDtls={SlumpSaleInLtcg:{FMV11UAEii:n0(C.b2.fmv2),FMV11UAEiii:n0(C.b2.fmv3),
      FullConsideration:n0(B.b2.value),NetWorthOfDivision:n0(C.b2.networth),SlumpBalance:sg(B.b2.c),
      ExemptionOrDednUs54:{ExemptionGrandTotal:n0(B.b2.ded)},CapgainonAssets:sg(B.b2.gain)}};
  const p112=[];
  const pv=(o,r)=>({FullConsideration:n0(r.cons),DeductSec48:{AquisitCost:n0(o.cost),ImproveCost:n0(o.improve),
    ExpOnTrans:n0(o.exp),TotalDedn:n0(r.biv)},BalanceCG:sg(r.c),
    Proviso112Applicabledtls:{DeductionUs54F:n0((o.ded||{}).s54F)},CapgainonAssets:sg(r.gain)});
  if(N((C.b3i||{}).cons))p112.push(Object.assign({Proviso112SectionCode:"22"},pv(C.b3i,B.b3i)));
  if(N((C.b3ii||{}).cons))p112.push(Object.assign({Proviso112SectionCode:"5ACA1b"},pv(C.b3ii,B.b3ii)));
  if(p112.length)LT.Proviso112Applicable=p112;
  LT.SaleOfEquityShareUs112A={BalanceCG:sg(B.b4.a),DeductionUs54F:n0((C.b4||{}).s54F),CapgainonAssets:sg(B.b4.gain)};
  /* B7 — FII/FPI 112A route: the schema key is NRISaleOfEquityShareUs112A (assigned before dfl) */
  if(G.nri)LT.NRISaleOfEquityShareUs112A={BalanceCG:sg(B.b7.a),DeductionUs54F:n0((C.b7||{}).s54F),CapgainonAssets:sg(B.b7.gain)};
  if(N((C.b9||{}).unqCons)||N((C.b9||{}).othCons)||N((C.b9||{}).cost))
    LT.SaleofAssetNADtls={SaleofAssetNA:{FullValueConsdRecvUnqshr:n0(C.b9.unqCons),FairMrktValueUnqshr:n0(C.b9.unqFmv),
      FullValueConsdSec50CA:n0(C.b9._c50ca||Math.max(N(C.b9.unqCons),N(C.b9.unqFmv))),
      FullValueConsdOthUnqshr:n0(C.b9.othCons),
      DeductSec48:{AquisitCost:n0(C.b9.cost),ImproveCost:n0(C.b9.improve),ExpOnTrans:n0(C.b9.exp),TotalDedn:n0(B.b9.biv)},
      BalanceCG:sg(B.b9.c),ExemptionOrDednUs54:{ExemptionGrandTotal:n0(B.b9.ded)},CapgainonAssets:sg(B.b9.gain)}};
  LT.TotalAmtDeemedLtcg=n0(B.b10.gain);
  /* UnutilizedLtcgFlag — free-optional Y/N; emit only when set (byte-identical resident) */
  if(st0((C.b10||{}).unutFlag))LT.UnutilizedLtcgFlag=st0(C.b10.unutFlag);
  const dml=(C.b10&&C.b10.deem||[]).filter(x=>N(x.unused)||N(x.util));
  if(dml.length)LT.UnutilizedCg={UnutilizedCgPrvYrDtls:dml.map(x=>{const o={
    PrvYrInWhichAsstTrnsfrd:x.py||"2024-25",SectionClmd:x.sec||"54",AmtUnutilized:n0(x.unused)};
    if(st0(x.yracq))o.YrInWhichAssetAcq=st0(x.yracq);
    if(N(x.util))o.AmtUtilized=n0(x.util);return o;})};
  if(N((C.b10||{}).other))LT.AmtDeemedLtcg=n0(C.b10.other);
  LT.PassThrIncNatureLTCG=n0(B.b11.gain);
  /* pass-through LTCG by tax rate (Sch PTI, nature = capital gain) — free-optional;
     both amounts already roll into E.lt125 (the 12.5% bucket) above. Emit only when non-zero. */
  if(N((C.b11||{}).r125a))LT.PassThrIncNatureLTCGUs112A12_5Per=n0(C.b11.r125a);
  if(N((C.b11||{}).r125o))LT.PassThrIncNatureLTCG12_5Per=n0(C.b11.r125o);
  LT.TotalAmtNotTaxUsDTAALtcg=n0(B.b12.notTax);LT.TotalAmtTaxUsDTAALtcg=n0(B.b12.special);
  const bbl=(C.bA||[]).filter(x=>N(x.amt));
  if(bbl.length)LT.CapitalLossBuyBackShares={TotalCapitalLossBuyBackShares:-n0(B.bA.loss),
    CapitalLossBuyBackSharesDtls:bbl.map(x=>({Rate:x.rate||"LTL125",Amount:-n0(x.amt)}))};
  /* NON-RESIDENT LTCG heads B5/B6/B8 + DTAA B12 (assigned before the zero-stub dfl below) */
  if(G.nri){
    if(N((C.b5||{}).gain)||N(((C.b5||{}).ded||{}).s54F))
      LT.NRIProvisoSec48={LTCGWithoutBenefit:n0((C.b5||{}).gain),DeductionUs54F:n0(((C.b5||{}).ded||{}).s54F),BalanceCG:sg(B.b5.gain)};
    const b6=(C.b6||[]).filter(r=>r.sec&&(N(r.unqCons)||N(r.othCons)||N(r.cost)));
    if(b6.length)LT.NRIOnSec112and115={NRIOnSec112and115Dtls:b6.map(r=>{const rr=engAgg(r,{unq:1,deds:["s54F"]});
      return {SectionCode:r.sec,FullValueConsdRecvUnqshr:n0(r.unqCons),FairMrktValueUnqshr:n0(r.unqFmv),
        FullValueConsdSec50CA:n0(r._c50ca||Math.max(N(r.unqCons),N(r.unqFmv))),FullValueConsdOthUnqshr:n0(r.othCons),
        FullConsideration:n0(rr.cons),DeductSec48:{AquisitCost:n0(r.cost),ImproveCost:n0(r.improve),ExpOnTrans:n0(r.exp),TotalDedn:n0(rr.biv)},
        BalanceCG:sg(rr.c),DeductionUs54F:n0((r.ded||{}).s54F),CapgainonAssets:sg(rr.gain)};})};
    if(N((C.b8||{}).sale)||N((C.b8||{}).ded115))
      LT.NRISaleofForeignAsset={SaleonSpecAsset:n0((C.b8||{}).sale),DednSpecAssetus115:n0((C.b8||{}).ded115),BalonSpeciAsset:sg(B.b8.gain)};
    const b12d=dtaaOut(C.b12); if(b12d)LT.NRICgDTAA=b12d;
  }
  LT.TotalLTCG=sg(B.total);

  /* schema-required sub-objects that must be present even when the filer has no such
     transaction (empty stubs; the utility emits them at zero). */
  const dfl=(o,k,v)=>{if(o[k]===undefined)o[k]=v;};
  const zDed48=()=>({AquisitCost:0,ImproveCost:0,ExpOnTrans:0,TotalDedn:0});
  dfl(ST,"SlumpSaleInStcg",{FMV11UAEii:0,FMV11UAEiii:0,FullConsideration:0,NetWorthOfDivision:0,CapgainonAssets:0});
  dfl(ST,"NRITransacSec48Dtl",{NRItaxSTTPaid:0,NRItaxSTTNotPaid:0});
  dfl(ST,"NRISecur115AD",{FullValueConsdRecvUnqshr:0,FairMrktValueUnqshr:0,FullValueConsdSec50CA:0,
    FullValueConsdOthUnqshr:0,FullConsideration:0,DeductSec48:zDed48(),BalanceCG:0,LossSec94of7Or94of8:0,CapgainonAssets:0});
  dfl(ST,"SaleOnOtherAssets",{FullValueConsdRecvUnqshr:0,FairMrktValueUnqshr:0,FullValueConsdSec50CA:0,
    FullValueConsdOthUnqshr:0,FullConsideration:0,DeductSec48:zDed48(),BalanceCG:0,LossSec94of7Or94of8:0,
    DeemedStcgOnAssets:0,ExemptionOrDednUs54:{ExemptionGrandTotal:0},CapgainonAssets:0});
  dfl(LT,"SlumpSaleInLtcgDtls",{});
  dfl(LT,"NRISaleOfEquityShareUs112A",{BalanceCG:0,DeductionUs54F:0,CapgainonAssets:0});
  dfl(LT,"NRISaleofForeignAsset",{SaleonSpecAsset:0,DednSpecAssetus115:0,BalonSpeciAsset:0});
  dfl(LT,"SaleofAssetNADtls",{});

  j.ScheduleCGFor23={ShortTermCapGainFor23:ST,LongTermCapGain23:LT,
    SumOfCGIncm:sg(G.C1),IncmFromVDATrnsf:n0(G.C2),TotScheduleCGFor23:sg(G.C3)};

  /* ---- Part D ---- DeducClaimInfo, straight from the taxpayer's S.cg.dclaim entry
     tables (no fabrication).  DeducClaimInfo itself is schema-required, so the block is
     always emitted with TotDeductClaim; each per-section sub-array is emitted only when it
     has rows, so a filer with no deduction (empty dclaim) exports {TotDeductClaim:0}. */
  const DED={};let dedTot=0;
  DCLAIM.forEach(D=>{const rows=((C.dclaim||{})[D.ns]||[])
      .filter(r=>N(r.amt)||N(r.cost)||N(r.invested)||ISO(r.transfer));
    if(!rows.length)return;
    DED[D.key]=rows.map(r=>{let o;
      if(D.invest){o={DateofTransfer:ISO(r.transfer),AmtInvested:n0(r.invested),AmtDeducted:n0(r.amt)};
        if(ISO(r.invdate))o.DateofInvestment=ISO(r.invdate);}
      else {o={};
        if(D.acq)o.DateofAcquisition=ISO(r.transfer); else o.DateofTransfer=ISO(r.transfer);
        o[D.cost]=n0(r.cost);
        if(ISO(r.purchase))o.DateofPurchase=ISO(r.purchase);
        o.AmtDeposited=n0(r.deposited);
        if(ISO(r.depdate))o.DepositDate=ISO(r.depdate);
        if(st0(r.acno))o.AccountNo=st0(r.acno);
        if(st0(r.ifsc))o.IFSC=st0(r.ifsc).toUpperCase();
        o.AmtDeducted=n0(r.amt);}
      dedTot+=N(r.amt);return o;});});
  DED.TotDeductClaim=n0(dedTot);
  j.ScheduleCGFor23.DeducClaimInfo=DED;   /* required object even when no deduction is claimed */

  /* ---- Part E ---- */
  const SL=[["st20","InStcg20Per","StclSetoff20Per"],["st30","InStcg30Per","StclSetoff30Per"],
    ["stApp","InStcgAppRate","StclSetoffAppRate"],["stDTAA","InStcgDTAARate","StclSetoffDTAARate"],
    ["lt125","InLtcg12_5Per","LtclSetOff12_5Per"],["ltDTAA","InLtcgDTAARate","LtclSetOffDTAARate"]];
  const E={InLossSetOff:{}};
  SL.forEach(x=>{E.InLossSetOff[x[2]]=n0(G.used[x[0]]);});
  SL.forEach(x=>{const node={CurrYearIncome:n0(G.gain[x[0]])};
    SL.forEach(l=>{if(l[0]===x[0])return;
      if(x[0].charAt(0)==="l"||l[0].charAt(0)!=="l")node[l[2]]=n0((G.matrix[x[0]]||{})[l[0]]||0);});
    node.CurrYrCapGain=n0(G.after[x[0]]);E[x[1]]=node;});
  /* TotLossSetOff / LossRemainSetOff are required: per-rate total set off and loss remaining */
  E.TotLossSetOff={};E.LossRemainSetOff={};
  SL.forEach(x=>{E.TotLossSetOff[x[2]]=n0(G.totSet&&G.totSet[x[0]]);
    E.LossRemainSetOff[x[2]]=n0(G.remain&&G.remain[x[0]]);});
  j.ScheduleCGFor23.CurrYrLosses=E;

  /* ---- Part F ---- */
  const QK=["Upto15Of6","Upto15Of9","Up16Of9To15Of12","Up16Of12To15Of3","Up16Of3To31Of3"];
  const FN={st20:"ShortTermUnder20Per",st30:"ShortTermUnder30Per",stApp:"ShortTermUnderAppRate",
    stDTAA:"ShortTermUnderDTAARate",lt125:"LongTermUnder12_5Per",ltDTAA:"LongTermUnderDTAARate"};
  /* quarters scaled to post-BFLA (Schedule BFLA col 5 = S.C.loss.afterB) so the break-up totals
     the after-brought-forward-set-off gain — rules A425/426/427/428/451/452. Proportional across
     quarters; rounding remainder into the last quarter so the sum is exact. Falls back to the raw
     Fauto when the loss engine has not run (no regression). */
  const _Lb=(S.C.loss||{}).afterB||{};
  const AF={};SL.forEach(x=>{const k=x[0];const src=(G.F[k]||[]);
    const pre=src.reduce((a,v)=>a+N(v),0);const tgt=N(_Lb[k]!=null?_Lb[k]:pre);const dr={};
    if(pre>0){const f=tgt/pre;let acc=0;QK.forEach((q,i)=>{if(i<4){dr[q]=n0(N(src[i])*f);acc+=dr[q];}});dr[QK[4]]=n0(tgt-acc);}
    else {QK.forEach(q=>dr[q]=0);if(tgt>0)dr[QK[4]]=n0(tgt);}
    AF[FN[k]]={DateRange:dr};});
  {const vq=[0,0,0,0,0];if(G.C2)(C.vda||[]).forEach(r=>{if(r._&&r._.inc&&r.head==="CG")vq[r._.q]+=r._.inc;});
    const dr={};QK.forEach((q,i)=>dr[q]=n0(vq[i]));AF.VDATrnsfGainsUnder30Per={DateRange:dr};}  /* required key */
  j.ScheduleCGFor23.AccruOrRecOfCG=AF;

  /* ---- Schedule 112A / 115AD / VDA ---- */
  const b112=scripBlock(C.s112a,"112A");if(b112)j.Schedule112A=b112;
  if(G.nri){const b115=scripBlock(C.s115ad,"115AD");if(b115)j.Schedule115AD=b115;}
  const vr=(C.vda||[]).filter(r=>ISO(r.buy)&&ISO(r.sale)&&r.head);
  if(vr.length)j.ScheduleVDA={ScheduleVDADtls:vr.map(r=>({DateofAcquisition:ISO(r.buy),DateofTransfer:ISO(r.sale),
    HeadUndIncTaxed:r.head,AcquisitionCost:n0(r.cost),ConsidReceived:n0(r.cons),
    IncomeFromVDA:n0(Math.max(0,N(r.cons)-N(r.cost)))})),
    TotIncBusiness:n0(G.vda.bi),TotIncCapGain:n0(G.vda.cg)};
}

/* =====================================================================
   IMPORT
   ===================================================================== */
function impCg(I3){
  const read=[];
  const g=(o,p)=>{try{return p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);}catch(e){return undefined;}};
  const CGb=I3&&I3.ScheduleCGFor23;
  if(CGb){
    S.cg=S.cg||{};S.cg.on=true;
    const ST=CGb.ShortTermCapGainFor23||{}, LT=CGb.LongTermCapGain23||{};
    /* restore the buyer table + property address so TrnsfImmblPrprty round-trips */
    const bback=x=>{const bs=(g(x,"TrnsfImmblPrprty.TrnsfImmblPrprtyDtls")||[]);
      const out={buyers:bs.map(y=>({name:y.NameOfBuyer||"",pan:y.PANofBuyer||"",aadhaar:y.AaadhaarOfBuyer||"",
        share:nz(y.PercentageShare),amt:nz(y.Amount)}))};
      if(bs.length){out.paddr=bs[0].AddressOfProperty||"";out.pstate=bs[0].StateCode||"";out.ppin=bs[0].PinCode!=null?String(bs[0].PinCode):"";out.pcountry=bs[0].CountryCode||"";}
      return out;};
    const land=[];
    (g(ST,"SaleofLandBuild.SaleofLandBuildDtls")||[]).forEach(x=>{const d={};
      (g(x,"ExemptionOrDednUs54.ExemptionOrDednUs54Dtls")||[]).forEach(e=>d["s"+e.ExemptionSecCode]=nz(e.ExemptionAmount));
      land.push(Object.assign({buy:dmy(x.DateofPurchase),sale:dmy(x.DateofSale),
        lt:"Short",cons:nz(x.FullConsideration),sdv:nz(x.PropertyValuation),cost:nz(x.AquisitCost),exp:nz(x.ExpOnTrans),
        improve:[],ded:d},bback(x)));});
    (g(LT,"SaleofLandBuild.SaleofLandBuildDtls")||[]).forEach(x=>{const d={};
      (g(x,"ExemptionOrDednUs54.ExemptionOrDednUs54Dtls")||[]).forEach(e=>d["s"+e.ExemptionSecCode]=nz(e.ExemptionAmount));
      land.push(Object.assign({buy:dmy(x.DateofPurchase),sale:dmy(x.DateofSale),lt:"Long",cons:nz(x.FullConsideration),
        sdv:nz(x.PropertyValuation),cost:nz(x.AquisitCost),exp:nz(x.ExpOnTrans),
        improve:(g(x,"CostOfImprovements.CostOfImprovementsDtls")||[]).map(y=>({amt:nz(y.ImproveCost),yr:y.ImproveDate})),
        ded:d},bback(x)));});
    if(land.length){S.cg.land=land;read.push("capital gains (land/building)");}
    if(ST.SlumpSaleInStcg)S.cg.a2={fmv2:nz(ST.SlumpSaleInStcg.FMV11UAEii),fmv3:nz(ST.SlumpSaleInStcg.FMV11UAEiii),networth:nz(ST.SlumpSaleInStcg.NetWorthOfDivision)};
    if(g(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg")){const s=g(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg");
      S.cg.b2={fmv2:nz(s.FMV11UAEii),fmv3:nz(s.FMV11UAEiii),networth:nz(s.NetWorthOfDivision),ded:{}};}
    const e3=(g(ST,"EquityMFonSTT")||[])[0];
    if(e3)S.cg.a3i={cons:nz(g(e3,"EquityMFonSTTDtls.FullConsideration")),cost:nz(g(e3,"EquityMFonSTTDtls.DeductSec48.AquisitCost")),
      improve:nz(g(e3,"EquityMFonSTTDtls.DeductSec48.ImproveCost")),exp:nz(g(e3,"EquityMFonSTTDtls.DeductSec48.ExpOnTrans")),
      loss94:nz(g(e3,"EquityMFonSTTDtls.LossSec94of7Or94of8"))};
    S.cg.a7=S.cg.a7||{deem:[],other:0};
    S.cg.a7.deem=(g(ST,"UnutilizedCg.UnutilizedCgPrvYrDtls")||[]).map(x=>({py:x.PrvYrInWhichAsstTrnsfrd,sec:x.SectionClmd,
      yracq:x.YrInWhichAssetAcq||"",util:nz(x.AmtUtilized),unused:nz(x.AmtUnutilized)}));
    S.cg.a7.other=nz(ST.AmtDeemedStcg);
    S.cg.a7.unutFlag=ST.UnutilizedStcgFlag||"";
    S.cg.b10=S.cg.b10||{deem:[],other:0};
    S.cg.b10.deem=(g(LT,"UnutilizedCg.UnutilizedCgPrvYrDtls")||[]).map(x=>({py:x.PrvYrInWhichAsstTrnsfrd,sec:x.SectionClmd,
      yracq:x.YrInWhichAssetAcq||"",util:nz(x.AmtUtilized),unused:nz(x.AmtUnutilized)}));
    S.cg.b10.other=nz(LT.AmtDeemedLtcg);
    S.cg.b10.unutFlag=LT.UnutilizedLtcgFlag||"";
    /* pass-through CG by tax rate (A8 / B11 direct inputs) — restored for round-trip */
    S.cg.a8={r20:nz(ST.PassThrIncNatureSTCG20Per),r30:nz(ST.PassThrIncNatureSTCG30Per),rApp:nz(ST.PassThrIncNatureSTCGAppRate)};
    S.cg.b11={r125a:nz(LT.PassThrIncNatureLTCGUs112A12_5Per),r125o:nz(LT.PassThrIncNatureLTCG12_5Per)};
    /* Part D — DeducClaimInfo detail tables back into S.cg.dclaim */
    const DI=CGb.DeducClaimInfo;
    if(DI){S.cg.dclaim={us54:[],us54B:[],us54D:[],us54EC:[],us54F:[],us54G:[],us54GA:[],us115F:[]};
      DCLAIM.forEach(D=>{S.cg.dclaim[D.ns]=(DI[D.key]||[]).map(r=>{
        if(D.invest)return {transfer:dmy(r.DateofTransfer),invested:nz(r.AmtInvested),
          invdate:dmy(r.DateofInvestment),amt:nz(r.AmtDeducted)};
        return {transfer:dmy(D.acq?r.DateofAcquisition:r.DateofTransfer),cost:nz(r[D.cost]),
          purchase:dmy(r.DateofPurchase),deposited:nz(r.AmtDeposited),depdate:dmy(r.DepositDate),
          acno:r.AccountNo||"",ifsc:r.IFSC||"",amt:nz(r.AmtDeducted)};});});
      if(Object.keys(S.cg.dclaim).some(k=>S.cg.dclaim[k].length))read.push("CG deduction detail");}
    /* ---- non-resident CG heads (imported only when the return carries real data) ---- */
    const dtaaIn=r=>({amt:nz(r.DTAAamt),itemno:r.ItemNoincl||"",country:r.CountryName||"",
      ccode:r.CountryCodeExcludingIndia||"",article:r.DTAAarticle||"",
      treaty:r.RateAsPerTreaty!=null?r.RateAsPerTreaty:"",trc:r.TaxRescertifiedFlag||"",
      secit:r.SecITAct||"",itact:r.RateAsPerITAct!=null?r.RateAsPerITAct:""});
    if(ST.NRITransacSec48Dtl&&(N(ST.NRITransacSec48Dtl.NRItaxSTTPaid)||N(ST.NRITransacSec48Dtl.NRItaxSTTNotPaid)))
      S.cg.a4={sttPaid:nz(ST.NRITransacSec48Dtl.NRItaxSTTPaid),sttNot:nz(ST.NRITransacSec48Dtl.NRItaxSTTNotPaid)};
    const a5b=ST.NRISecur115AD;
    if(a5b&&(N(a5b.FullConsideration)||N(a5b.FullValueConsdRecvUnqshr)||N(a5b.FullValueConsdOthUnqshr)||N(g(a5b,"DeductSec48.AquisitCost"))))
      S.cg.a5={unqCons:nz(a5b.FullValueConsdRecvUnqshr),unqFmv:nz(a5b.FairMrktValueUnqshr),othCons:nz(a5b.FullValueConsdOthUnqshr),
        cost:nz(g(a5b,"DeductSec48.AquisitCost")),improve:nz(g(a5b,"DeductSec48.ImproveCost")),
        exp:nz(g(a5b,"DeductSec48.ExpOnTrans")),loss94:nz(a5b.LossSec94of7Or94of8)};
    S.cg.a9=(g(ST,"NRICgDTAA.NRIDTAADtls")||[]).map(dtaaIn);
    const b5b=LT.NRIProvisoSec48;
    if(b5b&&(N(b5b.LTCGWithoutBenefit)||N(b5b.DeductionUs54F)))
      S.cg.b5={gain:nz(b5b.LTCGWithoutBenefit),ded:{s54F:nz(b5b.DeductionUs54F)}};
    S.cg.b6=(g(LT,"NRIOnSec112and115.NRIOnSec112and115Dtls")||[]).map(r=>({sec:r.SectionCode,
      unqCons:nz(r.FullValueConsdRecvUnqshr),unqFmv:nz(r.FairMrktValueUnqshr),othCons:nz(r.FullValueConsdOthUnqshr),
      cost:nz(g(r,"DeductSec48.AquisitCost")),improve:nz(g(r,"DeductSec48.ImproveCost")),
      exp:nz(g(r,"DeductSec48.ExpOnTrans")),ded:{s54F:nz(r.DeductionUs54F)}}));
    const b8b=LT.NRISaleofForeignAsset;
    if(b8b&&(N(b8b.SaleonSpecAsset)||N(b8b.DednSpecAssetus115)))
      S.cg.b8={sale:nz(b8b.SaleonSpecAsset),ded115:nz(b8b.DednSpecAssetus115)};
    const b7b=LT.NRISaleOfEquityShareUs112A;
    if(b7b&&N(b7b.DeductionUs54F))S.cg.b7={s54F:nz(b7b.DeductionUs54F)};
    S.cg.b12=(g(LT,"NRICgDTAA.NRIDTAADtls")||[]).map(dtaaIn);
    read.push("capital gains");
  }
  const b112=I3&&I3.Schedule112A;
  if(b112){S.cg=S.cg||{};S.cg.on=true;
    S.cg.s112a=(b112.Schedule112ADtls||[]).map(x=>({pre18:x.ShareOnOrBefore,isin:x.ISINCode,name:x.ShareUnitName,
      qty:nz(x.NumSharesUnits),price:nz(x.SalePricePerShareUnit),sale6:x.ShareOnOrBefore==="AE"?nz(x.TotSaleValue):"",
      cost:nz(x.AcquisitionCost),fmv18:nz(x.FairMktValuePerShareunit),exp:nz(x.ExpExclCnctTransfer)}));
    read.push("Schedule 112A");}
  const b115=I3&&I3.Schedule115AD;
  if(b115){S.cg=S.cg||{};S.cg.on=true;
    S.cg.s115ad=(b115.Schedule115ADDtls||[]).map(x=>({pre18:x.ShareOnOrBefore,isin:x.ISINCode,name:x.ShareUnitName,
      qty:nz(x.NumSharesUnits),price:nz(x.SalePricePerShareUnit),sale6:x.ShareOnOrBefore==="AE"?nz(x.TotSaleValue):"",
      cost:nz(x.AcquisitionCost),fmv18:nz(x.FairMktValuePerShareunit),exp:nz(x.ExpExclCnctTransfer)}));
    read.push("Schedule 115AD");}
  const vda=I3&&I3.ScheduleVDA;
  if(vda){S.cg=S.cg||{};S.cg.on=true;
    S.cg.vda=(vda.ScheduleVDADtls||[]).map(x=>({buy:dmy(x.DateofAcquisition),sale:dmy(x.DateofTransfer),
      head:x.HeadUndIncTaxed,cost:nz(x.AcquisitionCost),cons:nz(x.ConsidReceived)}));
    read.push("Schedule VDA");}
  return read;
}

/* =====================================================================
   CHECKS
   ===================================================================== */
function chkCg(){
  const out=[];const G=S.C.cg;if(!G||!G.on)return out;
  const C=S.cg;
  /* 50C — stamp value more than 10% above consideration (CG book Q10/Q147) */
  (C.land||[]).forEach((p,i)=>{const r=p._;if(r&&!r.safe)
    out.push({lvl:"warn",t:"Property "+(i+1)+" · section 50C",
      m:"Stamp value exceeds consideration by more than 10% — the stamp value is adopted as full value.",sec:"cg"});});
  /* mutual exclusion 112A vs 115AD (both books §8) */
  const has112=(C.s112a||[]).some(r=>N((r._||{}).sale)||N(r.cost));
  const has115=(C.s115ad||[]).some(r=>N((r._||{}).sale)||N(r.cost));
  if(has112&&has115)out.push({lvl:"err",t:"Schedule 112A vs 115AD",
    m:"A row filled in Schedule 112A bars Schedule 115AD(1)(iii) proviso, and vice versa.",sec:"cg"});
  /* 115AD is FII/FPI (non-resident) only */
  if(has115&&!G.nri)out.push({lvl:"err",t:"Schedule 115AD",
    m:"Schedule 115AD(1)(iii) proviso applies only to a non-resident FII/FPI.",sec:"cg"});
  /* VDA: dates not after 31 March of the FY; loss floored to nil */
  (C.vda||[]).forEach((r,i)=>{const dS=D(r.sale),dA=D(r.buy);
    if((dS&&dS>YREND)||(dA&&dA>YREND))out.push({lvl:"err",t:"Schedule VDA row "+(i+1),
      m:"Date of acquisition/transfer cannot be after 31 March of the financial year.",sec:"cg"});});
  /* consideration nil but expenses claimed (CG book §3 cross-rule) */
  (C.land||[]).forEach((p,i)=>{if(!N(p.cons)&&(N(p.cost)||N(p.exp)))
    out.push({lvl:"warn",t:"Property "+(i+1)+" · section 48",
      m:"Where full value of consideration is zero, deductions u/s 48 cannot be claimed.",sec:"cg"});});
  /* everything reconciled */
  if(G.C3!==0||G.A.total||G.B.total)
    out.push({lvl:"ok",t:"Capital gains",m:"C3 income chargeable under CAPITAL GAINS = "+RS(G.C3)+".",sec:"cg"});
  return out;
}

reg({id:"cg", t:"Capital gains", ref:"Schedule CG · 112A · 115AD · VDA",
  f:secCg, s:()=>!cgOn()?"None":((S.C.cg&&S.C.cg.C3)?RS(S.C.cg.C3):"Reporting"),
  eng:engCg, exp:expCg, imp:impCg, chk:chkCg, order:14});

})();
