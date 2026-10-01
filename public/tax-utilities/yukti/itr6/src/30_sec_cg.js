/* =====================================================================
   ITR-6 · Section "cg" — Schedule CG (Capital Gains) + Schedule 112A +
   Schedule 115AD(1)(b)(iii) proviso + Schedule VDA.
   Built ONLY from books/ITR-6/{CG,112A,115AD_1_b_iii_proviso,VDA}.md and
   books/ITR-6/{enums.json,skeleton.json,section_map.json}.
   Structural template: forms/ITR-3/src/70_sec_cg.js — but every field,
   number, formula, schema key and enum here is taken from the ITR-6 books
   (the COMPANY return), never from ITR-3.

   Schema blocks (section_map → cg):
     ScheduleCG   (ShortTermCapGain, LongTermCapGain, SumOfCGIncm,
                   IncmFromVDATrnsf, IncChargeableHeadCapGain, DeducClaimInfo,
                   CurrYrLosses, EditAutopoulatedDetail, AccruOrRecOfCG)
     Schedule112A · Schedule115AD · ScheduleVDA

   ITR-6 vs ITR-3 — the substantive differences taken from the books:
   - Block is ScheduleCG (not ScheduleCGFor23); C3 = IncChargeableHeadCapGain.
   - A company gets NO indexation on LTCG land (schema has no AquisitCostIndex/
     CostOfImprovements/BalanceForEiB/TaxSec1121a) — B1 land is the simple
     block, same shape as A1.  (CG book §3; schema Appendix 3.)
   - Land heads A1/B1 carry section 54G/54GA (A1) and 54D/54EC/54G/54GA (B1) —
     NOT 54B/54/54F (CG book §1, enums).
   - A3 = EquityMFonSTT[] with TWO elements: (i) 111A "1A", (ii) 115AD(1)(b)(ii)
     FII "5AD1biip".  A6 deemed-depreciable key = DeemedSTCGDeprAsset.
   - B2 slump deduction = single DeductionUnderSec54 (54EC); B3 = single
     Proviso112Applicable object (code "22"), no 54F; B4 = SaleOfEquityShareUs112A
     .CapgainonAssets (=Balance112A, no deduction); B8 = SaleofAssetNADtls; B(A)
     LTCL = TotalCapitalLossBuyBackShares only (no per-row detail).
   - Live Table-E buckets (CG book §6, rows 460-472): short {20/30/app/DTAA},
     long {12.5/DTAA}; schema CurrYrLosses.In{Stcg20Per/30Per/AppRate/DTAARate,
     Ltcg12_5Per/DTAARate}.  Set-off: a STCL sets off any gain, a LTCL only LTCG.
   - Non-resident heads A4/A5/A9, B5/B6/B7/B11 (and Schedule 115AD) are surfaced
     only for a non-resident; hidden for a resident/domestic company.
   - VDA col 7 = 115BBH: income = consideration − cost, a loss floored to nil;
     positive incomes summed by col-4 head (A business / B capital gain).

   Everything is wrapped in an IIFE so no helper leaks into the shared
   namespace where parallel builders live.
   ===================================================================== */
(function(){
"use strict";

/* ---- dropdown tables (from books/ITR-6/enums.json, verbatim) ------ */
const OB=[["BE","On or Before 31st January 2018"],["AE","After 31st January 2018"]];
const HEADVDA=[["BI","Business Income"],["CG","Capital Gain"]];
const EXST_LAND=[["54G","Sec 54G"],["54GA","Sec 54GA"]];                  /* A1 land Dbelow (di/dii) */
const EXLT_LAND=[["54D","Sec 54D"],["54EC","Sec 54EC"],["54G","Sec 54G"],["54GA","Sec 54GA"]]; /* B1 land di-div */
const EXB8=[["54D","Sec 54D"],["54G","Sec 54G"],["54GA","Sec 54GA"]];     /* B8 general (SaleofAssetNA) */
const BBST=[["STL20","Loss from buy back of 'shares taxable at 20%'"],
  ["STL30","Loss from buy back of 'shares taxable at 30%'"],
  ["STLAR","Loss from buy back of 'shares taxable at applicable rate'"]]; /* A(A) rate */
const DEEM_PY=[["2022-23","2022-23"],["2023-24","2023-24"],["2024-25","2024-25"]];
const DEEM_ST_SEC=[["54G","Sec 54G"],["54GA","Sec 54GA"]];                /* A7 SectionClmd */
const DEEM_LT_SEC=[["54D","Sec 54D"],["54G","Sec 54G"],["54GA","Sec 54GA"]]; /* B9 SectionClmd */
const DEEM_YRACQ=[["2022","2022-23"],["2023","2023-24"],["2024","2024-25"],["2025","2025-26"]];
const TRCYN=[["Y","Yes"],["N","No"]];
/* State-code list for the 194-IA buyer detail (StateCode, ITR-6 enum — 38 vals) */
const CG_STATE=[["01","Andaman and Nicobar islands"],["02","Andhra Pradesh"],["03","Arunachal Pradesh"],
  ["04","Assam"],["05","Bihar"],["06","Chandigarh"],["07","The Dadra And Nagar Haveli And Daman And Diu"],
  ["09","Delhi"],["10","Goa"],["11","Gujarat"],["12","Haryana"],["13","Himachal Pradesh"],
  ["14","Jammu and Kashmir"],["15","Karnataka"],["16","Kerala"],["17","Lakshadweep"],["18","Madhya Pradesh"],
  ["19","Maharashtra"],["20","Manipur"],["21","Meghalaya"],["22","Mizoram"],["23","Nagaland"],["24","Odisha"],
  ["25","Puducherry"],["26","Punjab"],["27","Rajasthan"],["28","Sikkim"],["29","Tamil Nadu"],["30","Tripura"],
  ["31","Uttar Pradesh"],["32","West Bengal"],["33","Chattisgarh"],["34","Uttarakhand"],["35","Jharkhand"],
  ["36","Telangana"],["37","Ladakh"],["99","Foreign"]];
const CG_STATE_SET={};CG_STATE.forEach(x=>CG_STATE_SET[x[0]]=1);

/* Part D · DeducClaimInfo entry tables (schema DeducClaimInfo).
   ITR-6 live sections: 54D (acq/land-building), 54EC (bonds), 54G, 54GA.
   `invest` = the 4-column 54EC shape; `acq` = uses DateofAcquisition (54D). */
const DCLAIM=[
  {ns:"us54D", sec:"54D", key:"DeducClaimDtlsUs54D", lbl:"Sec 54D — new land/building for an industrial undertaking",
    cost:"CostofNewLandBuilding", costH:"Cost of purchase/construction of new land or building", acq:true},
  {ns:"us54EC",sec:"54EC",key:"DeducClaimDtlsUs54EC",lbl:"Sec 54EC — investment in specified/notified bonds (≤ ₹50 lakh)", invest:true},
  {ns:"us54G", sec:"54G", key:"DeducClaimDtlsUs54G", lbl:"Sec 54G — new asset (shifting out of an urban area)",
    cost:"CostofNewAsset", costH:"Cost and expenses for the new asset"},
  {ns:"us54GA",sec:"54GA",key:"DeducClaimDtlsUs54GA",lbl:"Sec 54GA — new asset (shifting to a SEZ)",
    cost:"CostofNewAsset", costH:"Cost and expenses for the new asset"}];

/* the five 234C date-ranges (CG book Part F, rows 476-488) */
function cgQtr(iso){const d=D(iso);if(!d)return 4;
  const y=YREND.getFullYear();                 /* FY end year = 2026 */
  const j15=new Date(y-1,5,15),s15=new Date(y-1,8,15),d15=new Date(y-1,11,15),m15=new Date(y,2,15);
  if(d<=j15)return 0; if(d<=s15)return 1; if(d<=d15)return 2; if(d<=m15)return 3; return 4;}

/* company (resident/domestic) unless the return's residential status says otherwise */
function isNr(){return st0((S.fs||{}).resStatus||"RES")!=="RES";}

/* ---- state (S.cg) ------------------------------------------------- */
/* field paths match the shell's baked-in cg handlers (commit/data-addland). */
S.cg = S.cg || {
  on:false,
  land:[],   /* {buy,sale,lt:"Short"|"Long",cons,sdv,cost,improve,exp,
                ded:{s54D,s54EC,s54G,s54GA},buyers:[{name,pan,aadhaar,share,amt}],paddr,pstate,ppin,pcountry} */
  a2:{},     /* A2 slump-sale STCG {fmv2,fmv3,networth} */
  a3i:{},    /* A3(i) 111A equity/EOMF STT {cons,cost,improve,exp,loss94} */
  a3ii:{},   /* A3(ii) 115AD(1)(b)(ii) FII equity STT {cons,cost,improve,exp,loss94} */
  a4:{},     /* A4 111A/other STCG for NR {sttPaid,sttNot} (NR only) */
  a5:{},     /* A5 FII 115AD STCG securities (NR only) */
  a6:{},     /* A6 other STCG assets {unqCons,unqFmv,othCons,cost,improve,exp,loss94,dcg,ded} */
  a7:{deem:[],other:0,unutFlag:""},   /* A7 deemed STCG */
  a8:{},     /* A8 pass-through STCG {r20,r30,rApp} */
  a9:[],     /* A9 DTAA STCG (NR only) */
  aA:[],     /* A(A) buy-back STCL {rate,amt} */
  b2:{},     /* B2 slump-sale LTCG {fmv2,fmv3,networth,ded:{s54EC}} */
  b3:{},     /* B3 listed securities / ZCB 112(1) {cons,cost,improve,exp} */
  b4:{},     /* B4 112A — fed from Schedule 112A (no direct input) */
  b5:{},     /* B5 unlisted shares/listed deb NR {gain} (NR only) */
  b6:[],     /* B6 112(1)(c)/115AB/115AC/115AD NR rows (NR only) */
  b7:{},     /* B7 FII 112A route — fed from Schedule 115AD (NR only) */
  b8:{},     /* B8 other LTCG assets {unqCons,unqFmv,othCons,cost,improve,exp,ded} */
  b9:{deem:[],other:0,unutFlag:""},  /* B9 deemed LTCG */
  b10:{},    /* B10 pass-through LTCG {r125a,r125o} */
  b11:[],    /* B11 DTAA LTCG (NR only) */
  bA:{},     /* B(A) buy-back LTCL @12.5% {amt} */
  s112a:[],  /* Schedule 112A scrips */
  s115ad:[], /* Schedule 115AD scrips (NR FII only) */
  vda:[],    /* Schedule VDA transfers */
  dclaim:{us54D:[],us54EC:[],us54G:[],us54GA:[]},   /* Part D · DeducClaimInfo entry tables */
  editE:false, Eover:null,
  editF:false, Fover:null
};

/* seed grid rows the shell's add-handler reaches by key */
SEED["cg.buyers"]=SEED["cg.buyers"]||{share:100};
SEED["cg.a9"]=SEED["cg.a9"]||{trc:"Y"};
SEED["cg.b11"]=SEED["cg.b11"]||{trc:"Y"};
SEED["cg.aA"]=SEED["cg.aA"]||{rate:"STL20"};
SEED["cg.s112a"]=SEED["cg.s112a"]||{pre18:"AE"};
SEED["cg.s115ad"]=SEED["cg.s115ad"]||{pre18:"AE"};
SEED["cg.vda"]=SEED["cg.vda"]||{};
SEED["cg.a7.deem"]=SEED["cg.a7.deem"]||{py:"2024-25",sec:"54G"};
SEED["cg.b9.deem"]=SEED["cg.b9.deem"]||{py:"2024-25",sec:"54D"};

/* =====================================================================
   ENGINE — every formula carries its CG-sheet item/row ref
   ===================================================================== */
/* §2 A1aiii / B1aiii — full value u/s 50C: adopt stamp value only when it
   exceeds actual consideration by more than 10% (IF(sdv>1.1*cons,sdv,cons)) */
function v50C(cons,sdv){cons=N(cons);sdv=N(sdv);
  return {value:(sdv>cons*1.10?sdv:cons),safe:!(sdv>cons*1.10)};}

/* one land/building property — A1 (STCG) or B1 (LTCG); a company gets NO
   indexation (schema has no indexed-cost fields), so the two are one shape. */
function engLand(p){
  const isLT = p.lt==="Long";
  const c50=v50C(p.cons,p.sdv);                            /* aiii */
  const biv=N(p.cost)+N(p.improve)+N(p.exp);               /* biv (bi+bii+biii) */
  const c=R(c50.value-biv);                                /* c = aiii − biv */
  const d=p.ded||{};
  const dedTot = isLT ? (N(d.s54D)+N(d.s54EC)+N(d.s54G)+N(d.s54GA))   /* B1: 54D/54EC/54G/54GA */
                      : (N(d.s54G)+N(d.s54GA));                        /* A1: 54G/54GA only */
  const e = R(c - Math.min(dedTot,Math.max(0,c)));         /* A1e / B1e (floor deduction at a positive balance) */
  return {isLT,value:c50.value,safe:c50.safe,biv:R(biv),c,dedTot:R(dedTot),e,gain:e};
}

/* an aggregate head carrying the section-48 block (A3i, A3ii, A6, B3, B8, NR B6) */
function engAgg(o,opts){o=o||{};opts=opts||{};
  let cons=0,c50ca=0;
  if(opts.unq){c50ca=Math.max(N(o.unqCons),N(o.unqFmv)); cons=c50ca+N(o.othCons);} /* 50CA MAX (ic) */
  else cons=N(o.cons);
  const biv=N(o.cost)+N(o.improve)+N(o.exp);               /* biv */
  const c=R(cons-biv);                                     /* c = balance */
  const l94=opts.loss94?N(o.loss94):0;                     /* 94(7)/94(8) disallowed loss (3id/6d) */
  const dcg=opts.dcg?N(o.dcg):0;                           /* A6e deemed depreciable (Sch DCG item 6) */
  const ded=(opts.deds||[]).reduce((a,k)=>a+N((o.ded||{})[k]),0);
  const e=R(c+l94+dcg-Math.min(ded,Math.max(0,c+l94+dcg)));
  return {cons:R(cons),c50ca:R(c50ca),biv:R(biv),c,l94:R(l94),dcg:R(dcg),ded:R(ded),e,gain:e};}

/* slump sale — A2 (FVC = higher of Rule 11UAE(2)/(3); no deduction) and
   B2 (deduction u/s 54EC only) */
function engSlump(o,lt){o=o||{};const v=Math.max(N(o.fmv2),N(o.fmv3));
  const c=R(v-N(o.networth));                              /* 2c = 2aiii − 2b */
  const ded=lt?N((o.ded||{}).s54EC):0;                     /* B2: 54EC only (DeductionUnderSec54); A2: none */
  const gain=R(c-Math.min(ded,Math.max(0,c)));
  return {value:R(v),c,ded:R(ded),gain};}

/* Schedule 112A / 115AD scrip table (both share the identical column math) */
function engScrip(rows){
  const t={sale:0,cwo:0,cost:0,before:0,fmv:0,exp:0,ded:0,bal:0, before23:0, after23:0};
  (rows||[]).forEach(r=>{
    const pre=r.pre18==="BE";                               /* Col 1a "on or before 31 Jan 2018" */
    const qty=pre?N(r.qty):0, price=pre?N(r.price):0;        /* lock rule: per-unit cells 0 when AE */
    const sale=pre?R(Math.max(0,qty*price)):R(Math.max(0,N(r.sale6))); /* Col 6 = 4×5 for BE, else actual */
    const fmvTot=pre?R(Math.max(0,qty*N(r.fmv18))):0;       /* Col 11 = 4×10 */
    const col9=pre?R(Math.max(0,Math.min(fmvTot,sale))):0;  /* Col 9 = lower of Col 6 & Col 11 */
    const cwo=R(Math.max(0,N(r.cost),col9));                /* Col 7 = higher of Col 8 & Col 9 */
    const totded=R(Math.max(0,cwo+N(r.exp)));              /* Col 13 = Col 7 + Col 12 */
    const bal=R(sale-totded);                               /* Col 14 = Col 6 − Col 13 */
    r._={sale,fmvTot,col9,cwo,cost:N(r.cost),exp:N(r.exp),totded,bal};
    t.sale+=sale; t.cwo+=cwo; t.cost+=N(r.cost); t.before+=col9; t.fmv+=fmvTot; t.exp+=N(r.exp);
    t.ded+=totded; t.bal+=bal;
    if(r.after23==="AF")t.after23+=bal; else t.before23+=bal;
  });
  Object.keys(t).forEach(k=>t[k]=R(t[k]));return t;
}

/* Schedule VDA — per-row income = MAX(0,Consideration−Cost) (Col 7, 115BBH);
   only positive incomes are summed, by the head chosen in Col 4 */
function engVDA(rows){let bi=0,cg=0;
  (rows||[]).forEach(r=>{const inc=Math.max(0,R(N(r.cons)-N(r.cost))); r._={inc,q:cgQtr(r.sale)};
    if(r.head==="BI")bi+=inc; else if(r.head==="CG")cg+=inc;});
  return {bi:R(bi),cg:R(cg)};}

/* A9 / B11 DTAA relief (CG book): per row the applicable rate is the lower of
   the treaty rate and the I.T.-Act rate; a row the treaty makes fully exempt
   (applicable rate 0) is "not chargeable to tax", the rest is taxable at the
   special DTAA rate. */
function engDTAA(rows){let notTax=0,special=0,rate="";
  (rows||[]).forEach(r=>{const amt=N(r.amt);
    const tr=(r.treaty===""||r.treaty==null)?null:N(r.treaty);
    const it=(r.itact===""||r.itact==null)?null:N(r.itact);
    let appl; if(tr!=null&&it!=null)appl=Math.min(tr,it); else appl=(tr!=null?tr:(it!=null?it:0));
    r._appl=appl;
    if(appl<=0)notTax+=amt; else {special+=amt; if(rate==="")rate=appl;}});
  return {notTax:R(notTax),special:R(special),rate};}

/* the toggle is stored as a string "true"/"false" by the <select>, or a
   boolean by import — normalise both */
function cgOn(){const v=(S.cg||{}).on;return v===true||v==="true"||v==="Yes";}

const KEYS=["st20","st30","stApp","stDTAA","lt125","ltDTAA"];
const Z=()=>({st20:0,st30:0,stApp:0,stDTAA:0,lt125:0,ltDTAA:0});

function engCg(){
  const C=S.cg;
  const nri=isNr();
  if(!cgOn()){
    S.C.cg={on:false,nri:nri,A:{total:0},B:{total:0},C1:0,C2:0,C3:0,
      gain:Z(),loss:Z(),used:Z(),absorbed:Z(),after:Z(),totSet:Z(),remain:Z(),matrix:{},F:{},
      s112a:engScrip([]),s115ad:engScrip([]),vda:{bi:0,cg:0},
      buckets:{},dedD:{},dedTotal:0,cflSTCL:0,cflLTCL:0,
      shortTerm:0,longTerm:0,total:0,income:0};
    return;
  }
  const s112a=engScrip(C.s112a);
  const s115ad=engScrip(C.s115ad);
  const vda=engVDA(C.vda);

  /* ---- Part A · short-term ---------------------------------------- */
  const land={st:[],lt:[]};
  (C.land||[]).forEach((p,i)=>{const r=engLand(p);p._=r;p._i=i;(r.isLT?land.lt:land.st).push(p);});
  const A={};
  A.a1  = R(land.st.reduce((a,p)=>a+p._.gain,0));           /* A1e ΣA1e */
  A.a2  = engSlump(C.a2,false);                            /* A2c */
  A.a3i = engAgg(C.a3i,{loss94:1});                        /* A3ie (111A) */
  A.a3ii= engAgg(C.a3ii,{loss94:1});                       /* A3iie (115AD(1)(b)(ii) FII) */
  A.a4  = {a:R(N((C.a4||{}).sttPaid)), b:R(N((C.a4||{}).sttNot))};   /* A4a/A4b (NR) */
  A.a4.gain = R(A.a4.a + A.a4.b);
  A.a5  = engAgg(C.a5,{unq:1,loss94:1});                    /* A5e (FII 115AD securities, NR) */
  A.a6  = engAgg(C.a6,{unq:1,loss94:1,dcg:1,deds:["s54G","s54GA"]}); /* A6g */
  const a7t=((C.a7&&C.a7.deem)||[]).reduce((a,x)=>a+N(x.unused),0)+N((C.a7||{}).other);
  A.a7  = {gain:R(a7t)};                                    /* A7 */
  const a8=C.a8||{};
  A.a8  = {gain:R(N(a8.r20)+N(a8.r30)+N(a8.rApp))};         /* A8 */
  A.a9  = engDTAA(C.a9);                                    /* A9a/A9b (NR DTAA) */
  A.aA  = {loss:R((C.aA||[]).reduce((a,x)=>a+N(x.amt),0))}; /* A(A) buy-back STCL */
  /* A10 = A1e+A2c+A3ie+A3iie+A4a+A4b+A5e+A6g+A7+A8−A9a+A(A) (A4/A5 are 0 for a resident) */
  A.total=R(A.a1+A.a2.gain+A.a3i.gain+A.a3ii.gain+A.a4.gain+A.a5.gain+A.a6.gain+A.a7.gain+A.a8.gain-A.a9.notTax-A.aA.loss);

  /* ---- Part B · long-term ----------------------------------------- */
  const B={};
  B.b1 = R(land.lt.reduce((a,p)=>a+p._.gain,0));            /* B1g ΣB1e */
  B.b2 = engSlump(C.b2,true);                              /* B2e */
  B.b3 = engAgg(C.b3,{});                                  /* B3c (112(1) listed sec/ZCB) */
  B.b4 = {a:s112a.bal, gain:R(s112a.bal)};                 /* B4 = Balance112A (Col 14), no deduction */
  {const b5g=N((C.b5||{}).gain);
    B.b5={without:R(b5g), gain:R(b5g)};}                   /* B5 (NR) LTCG without indexation */
  B.b6 = {rows:(C.b6||[]).map(r=>engAgg(r,{unq:1,deds:["s54F"]}))};   /* B6 (NR) */
  B.b6.gain=R(B.b6.rows.reduce((a,x)=>a+x.gain,0));
  B.b7 = nri?{a:s115ad.bal, gain:R(s115ad.bal)}:{a:0,gain:0};/* B7 = Balance115AD (NR), no deduction */
  B.b8 = engAgg(C.b8,{unq:1,deds:["s54D","s54G","s54GA"]}); /* B8e */
  const b9t=((C.b9&&C.b9.deem)||[]).reduce((a,x)=>a+N(x.unused),0)+N((C.b9||{}).other);
  B.b9 = {gain:R(b9t)};                                     /* B9 deemed LTCG */
  const b10=C.b10||{};
  B.b10= {gain:R(N(b10.r125a)+N(b10.r125o))};               /* B10 pass-through LTCG */
  B.b11= engDTAA(C.b11);                                    /* B11a/B11b (NR DTAA) */
  B.bA = {loss:R(N((C.bA||{}).amt))};                       /* B(A) buy-back LTCL @12.5% */
  /* B12 = B1g+B2e+B3c+B4+B5+B6c+B7+B8e+B9+B10−B11a+B(A) (B5/B6/B7 are 0 for a resident) */
  B.total=R(B.b1+B.b2.gain+B.b3.gain+B.b4.gain+B.b5.gain+B.b6.gain+B.b7.gain+B.b8.gain+B.b9.gain+B.b10.gain-B.b11.notTax-B.bA.loss);

  /* ---- Part E · set-off matrix on the six rate-slots -------------- */
  /* Composition (CG book §6, Table E rows 460-472):
     20%   = A3ie + A3iie + A4a + A8@20                        − STL20
     30%   = A5e + A8@30                                       − STL30
     app.  = A1e + A2c + A4b + A6g + A7 + A8@app               − STLAR
     DTAA  = A9b
     12.5% = B1g+B2e+B3c+B4+B5+B6c+B7+B8e+B9+B10               − B(A)
     LTDTAA= B11b   (A4/A5/B5/B6/B7 are 0 for a resident)                */
  const bbAt=code=>R((C.aA||[]).filter(x=>(x.rate||"STL20")===code).reduce((a,x)=>a+N(x.amt),0));
  const E={
    st20:R(A.a3i.gain+A.a3ii.gain+A.a4.a+N(a8.r20)-bbAt("STL20")),
    st30:R(A.a5.gain+N(a8.r30)-bbAt("STL30")),
    stApp:R(A.a1+A.a2.gain+A.a4.b+A.a6.gain+A.a7.gain+N(a8.rApp)-bbAt("STLAR")),
    stDTAA:R(A.a9.special),
    lt125:R(B.b1+B.b2.gain+B.b3.gain+B.b4.gain+B.b5.gain+B.b6.gain+B.b7.gain+B.b8.gain+B.b9.gain+B.b10.gain-B.bA.loss),
    ltDTAA:R(B.b11.special)};
  const gain={},loss={},used={},absorbed={},matrix={};
  KEYS.forEach(k=>{gain[k]=Math.max(0,E[k]);loss[k]=Math.max(0,-E[k]);used[k]=0;absorbed[k]=0;matrix[k]={};});
  const isLong=k=>k.charAt(0)==="l";
  if(C.editE && C.Eover){                                   /* row 473 "Do you want to edit" override */
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
  const after={},totSet={},remain={};let C1=0;
  KEYS.forEach(k=>{after[k]=R(gain[k]-absorbed[k]);C1+=after[k];   /* C1 = Σ CurrYrCapGain (ii..vii) */
    totSet[k]=R(used[k]);remain[k]=R(Math.max(0,loss[k]-used[k]));});
  const cflSTCL=R(["st20","st30","stApp","stDTAA"].reduce((a,k)=>a+remain[k],0)); /* unabsorbed CY STCL → CFL */
  const cflLTCL=R(["lt125","ltDTAA"].reduce((a,k)=>a+remain[k],0));               /* unabsorbed CY LTCL → CFL */

  /* ---- Part F · quarters (auto from land sale dates; editable) ---- */
  const Fauto={};KEYS.forEach(k=>Fauto[k]=[0,0,0,0,0]);
  (C.land||[]).forEach(p=>{const r=p._;if(!r)return;const q=cgQtr(p.sale);
    const k=r.isLT?"lt125":"stApp"; if(r.gain>0)Fauto[k][q]+=r.gain;});
  const F={};KEYS.forEach(k=>{const ov=(C.Fover||{})[k];
    F[k]=(C.editF&&ov)?ov.map(N):Fauto[k].slice();});

  /* ---- Part C · summary ------------------------------------------- */
  const C2=vda.cg;                                          /* C2 = Sch VDA item B */
  const C3=R(C1+C2);                                         /* C3 = C1 + C2 */

  /* ---- Part D · deduction particulars (disclosure) ---------------- */
  const dedD={};
  const addD=(sec,amt,src)=>{if(!N(amt))return;(dedD[sec]=dedD[sec]||[]).push({amt:N(amt),src});};
  (C.land||[]).forEach((p,i)=>Object.keys(p.ded||{}).forEach(k=>addD(k.replace("s",""),(p.ded||{})[k],"land"+i)));
  if(N((C.b2||{}).ded&&(C.b2.ded||{}).s54EC))addD("54EC",(C.b2.ded||{}).s54EC,"b2");
  [["a6",C.a6],["b8",C.b8]].forEach(([h,o])=>
    Object.keys((o||{}).ded||{}).forEach(k=>addD(k.replace("s",""),(o.ded||{})[k],h)));
  const dedTotal=Object.values(dedD).reduce((a,rows)=>a+rows.reduce((b,r)=>b+r.amt,0),0);

  /* ---- special-rate buckets for the tax section (Schedule SI) ----- */
  const base112a=Math.max(0,B.b4.gain), base115ad=Math.max(0,B.b7.gain);
  const si112a=Math.max(0,Math.min(after.lt125,base112a));           /* 112A @12.5% (own ₹1.25L exempt at SI) */
  const si112a115ad=Math.max(0,Math.min(Math.max(0,after.lt125-si112a),base115ad)); /* 115AD proviso @12.5% (separate ₹1.25L) */
  const si112=Math.max(0,after.lt125-si112a-si112a115ad);            /* other LTCG @12.5% */
  const buckets={
    si111a20:after.st20,          /* STCG 111A / 115AD(1)(b)(ii) @20% */
    si30:after.st30,              /* STCG @30% */
    stApp:after.stApp,            /* STCG at applicable rate */
    stDTAA:after.stDTAA,
    si112a:si112a, si112a115ad:si112a115ad, si112:si112,
    ltDTAA:after.ltDTAA,
    si115bbh:vda.cg};             /* VDA @30% u/s 115BBH */

  /* ================= Schedule-SI feed (special-rate CG heads) =================
     70_sec_si.js consumes S.C.cg.siFeed keyed by the exact schema SecCode
     (SI.md §2/§3/§6). Value = a plain number (income; si.js supplies the rate
     from its own SI_RATE_DEF and computes the tax) OR, for a DTAA head, an
     {inc,tax} object carrying the treaty-rate tax (SI.md §4, rule A618).
     Every figure is REUSED from the ladder above (Part A/B gains, Table-E
     after-set-off slots and the ₹1.25L LTCG split) — nothing is recomputed.

     A special-rate head shares its Table-E rate-slot with siblings, so the
     post-set-off slot total (after.*) is apportioned back to its member heads
     by their gross gain (splitSI); with no current-year capital loss each head
     simply keeps its full gain. Applicable-/normal-rate slots (stApp: A1/A2/A4b/
     A6/A7/A8-app) carry NO special rate and are deliberately excluded — that is
     the income that must stay at the corporate rate.
        1A     111A / 115AD(1)(b)(ii)-STT own+NR @20%   <- A3(i)e + A4a  (E.st20)
        5AD1biip 115AD(1)(b)(ii) STCG by FII @20%       <- A3(ii)e       (E.st20)
        PTI_STCG20P pass-through STCG @20%              <- A8a           (E.st20)
        5ADii  115AD(1)(b)(ii) STCG (other than 111A) @30% <- A5e        (E.st30)
        PTI_STCG30P pass-through STCG @30%              <- A8b           (E.st30)
        2A     112A LTCG @12.5%                         <- B4 (Sch 112A) (si112a)
        5ADiiiP 115AD(1)(b)(iii) proviso LTCG @12.5%    <- B7 (Sch 115AD)(si112a115ad)
        21     112 LTCG (land/slump/B5/B8/B9) @12.5%    <- B1g/B2e/B5/B8e/B9 (si112)
        22     112(1) listed sec/ZCB @12.5%             <- B3c           (si112)
        21ciii/5AB1b/5AC1c/5ADiii  NR 112(1)(c)/115AB/115AC/115AD @12.5% <- B6 rows
        PTI_LTCG12_5P112A / PTI_LTCG12_5P pass-through LTCG @12.5% <- B10a1/B10a2 (si112)
        DTAASTCG / DTAALTCG  STCG/LTCG chargeable at the DTAA treaty rate <- A9b/B11b
        5BBH   115BBH VDA capital-gain income @30%      <- Schedule VDA item B (C2) */
  const splitSI=(dst,afterAmt,members)=>{               /* apportion a slot total across its heads */
    const codes=Object.keys(members).filter(c=>members[c]>0);
    const tot=codes.reduce((a,c)=>a+members[c],0);
    if(tot<=0||afterAmt<=0)return;
    if(afterAmt>=tot){codes.forEach(c=>{dst[c]=R((dst[c]||0)+members[c]);});return;}
    let acc=0;                                          /* set-off shrank the slot — pro-rate, last head absorbs rounding */
    codes.forEach((c,i)=>{const v=(i<codes.length-1)?R(afterAmt*members[c]/tot):R(afterAmt-acc);
      acc+=v; if(v>0)dst[c]=R((dst[c]||0)+v);});
  };
  const siFeed={};
  /* STCG @20% slot (E.st20) — 111A own+NR, FII 115AD(1)(b)(ii), pass-through */
  splitSI(siFeed,after.st20,{
    "1A":R(Math.max(0,A.a3i.gain)+Math.max(0,A.a4.a)),
    "5AD1biip":Math.max(0,A.a3ii.gain),
    "PTI_STCG20P":Math.max(0,N(a8.r20))});
  /* STCG @30% slot (E.st30) — FII 115AD(1)(b)(ii) other than 111A, pass-through */
  splitSI(siFeed,after.st30,{
    "5ADii":Math.max(0,A.a5.gain),
    "PTI_STCG30P":Math.max(0,N(a8.r30))});
  /* LTCG @12.5% — 112A (2A) and 115AD-proviso (5ADiiiP) are carved out first
     by the engine (si112a / si112a115ad); the residue si112 is the "other" pool */
  if(si112a>0)       siFeed["2A"]=R(si112a);
  if(si112a115ad>0)  siFeed["5ADiiiP"]=R(si112a115ad);
  const b6by={};                                        /* NR B6 rows classified to their SI code by the entered section */
  (C.b6||[]).forEach((rw,i)=>{const g=Math.max(0,N(((B.b6.rows||[])[i]||{}).gain));if(g<=0)return;
    const s=st0(rw.sec).toUpperCase().replace(/\s+/g,"");
    const code=/115AB/.test(s)?"5AB1b":/115AC/.test(s)?"5AC1c":/115AD/.test(s)?"5ADiii":"21ciii";
    b6by[code]=R((b6by[code]||0)+g);});
  splitSI(siFeed,si112,Object.assign({
    "21":R(Math.max(0,B.b1)+Math.max(0,B.b2.gain)+Math.max(0,B.b5.gain)+Math.max(0,B.b8.gain)+Math.max(0,B.b9.gain)),
    "22":Math.max(0,B.b3.gain),
    "PTI_LTCG12_5P112A":Math.max(0,N(b10.r125a)),
    "PTI_LTCG12_5P":Math.max(0,N(b10.r125o))},b6by));
  /* DTAA heads — treaty-rate tax (SI.md §4): {inc, tax}. inc = post-set-off
     amount; tax = inc × the applicable (lower of treaty/IT-Act) rate. */
  const dSt=R(after.stDTAA), dLt=R(after.ltDTAA);
  if(dSt>0)siFeed["DTAASTCG"]={inc:dSt,tax:R(dSt*N(A.a9.rate)/100)};
  if(dLt>0)siFeed["DTAALTCG"]={inc:dLt,tax:R(dLt*N(B.b11.rate)/100)};
  /* 115BBH VDA capital-gain income @30% (Schedule VDA item B = C2) — not part of
     Table E, taken directly */
  if(R(vda.cg)>0)siFeed["5BBH"]=R(vda.cg);

  S.C.cg={on:true,nri:nri,land,A,B,E,gain,loss,used,absorbed,matrix,after,totSet,remain,F,Fauto,
    s112a,s115ad,vda,buckets,siFeed,dedD,dedTotal:R(dedTotal),cflSTCL,cflLTCL,
    dtaaStcgRate:A.a9.rate,dtaaLtcgRate:B.b11.rate,
    C1:R(C1),C2:R(C2),C3:R(C3),
    shortTerm:A.total,longTerm:B.total,total:R(C3),
    income:R(C3)};   /* head's contribution to Gross Total Income — C3 (≥0; net loss carries via loss section) */
}

/* =====================================================================
   RENDERER
   ===================================================================== */
function calcRow(label,ref,n,ind){return row(label,cell(n),{ref:ref,ind:ind});}

function landBlock(p,i,lt){const r=p._||engLand(p);let h="";
  h+=row("Date of purchase / acquisition",dte("cg.land."+i+".buy"),{ref:lt?"B1":"A1"});
  h+=row("Date of sale / transfer",dte("cg.land."+i+".sale"),{});
  h+=row("a i · Full value of consideration received/receivable",inp("cg.land."+i+".cons",{n:1}),{ref:"ai"});
  h+=row("ii · Value of property as per stamp valuation authority",inp("cg.land."+i+".sdv",{n:1}),{ref:"aii"});
  h+=calcRow("iii · Full value of consideration u/s 50C","aiii",r.value);
  if(!r.safe)h+=note("Stamp value exceeds consideration by more than 10% — u/s 50C the stamp value is adopted.","warn");
  h+=row("b i · Cost of acquisition without indexation",inp("cg.land."+i+".cost",{n:1}),{ref:"bi"});
  h+=row("ii · Cost of improvement without indexation",inp("cg.land."+i+".improve",{n:1}),{ref:"bii"});
  h+=row("iii · Expenditure wholly & exclusively on transfer",inp("cg.land."+i+".exp",{n:1}),{ref:"biii"});
  h+=calcRow("iv · Total deductions u/s 48 (bi + bii + biii)","biv",r.biv);
  h+=calcRow("c · Balance (aiii − biv)","1c",r.c);
  const ex=lt?EXLT_LAND:EXST_LAND;
  ex.forEach(([code,lbl])=>{h+=row("d · Deduction u/s "+code+" (details in item D)",inp("cg.land."+i+".ded.s"+code,{n:1}),{ref:lbl,ind:1});});
  h+=calcRow(lt?"e · LTCG on Immovable property (1c − 1d)":"e · STCG on Immovable property (1c − 1d)",lt?"B1e":"A1e",r.e);
  /* buyer table (194-IA) + property location → TrnsfImmblPrprty */
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
    ],(p.buyers||[]),{empty:"No buyer detail (PAN mandatory if tax deducted u/s 194-IA).",add:"Add a buyer",min:"860px"});
  return blk("cgland"+(lt?"L":"S")+i,(lt?"Long-term property ":"Short-term property ")+(i+1),
    RS(r.gain),h,"cg.land."+i);
}

/* the section-48 aggregate body (shared by A3i/A3ii/A6/B3/B8 and NR B6 rows) */
function aggBody(path,r,opts){opts=opts||{};let h="";
  if(opts.unq){
    h+=row("a · Full value — unquoted shares (received/receivable)",inp(path+".unqCons",{n:1}),{ref:"ia"});
    h+=row("b · Fair market value of unquoted shares (Rule 11UA)",inp(path+".unqFmv",{n:1}),{ref:"ib"});
    h+=calcRow("c · Full value u/s 50CA (higher of a or b)","ic",r.c50ca);
    h+=row("ii · Full value — assets other than unquoted shares",inp(path+".othCons",{n:1}),{ref:"ii"});
    h+=calcRow("iii · Total consideration (ic + ii)","aiii",r.cons);
  } else {
    h+=row("a · Full value of consideration",inp(path+".cons",{n:1}),{ref:"a"});
  }
  h+=row("bi · Cost of acquisition without indexation",inp(path+".cost",{n:1}),{ref:"bi",ind:1});
  h+=row("bii · Cost of improvement without indexation",inp(path+".improve",{n:1}),{ref:"bii",ind:1});
  h+=row("biii · Expenditure w&e on transfer",inp(path+".exp",{n:1}),{ref:"biii",ind:1});
  h+=calcRow("biv · Total deductions u/s 48","biv",r.biv);
  h+=calcRow("c · Balance","c",r.c);
  if(opts.loss94)h+=row("d · Loss to be ignored u/s 94(7)/94(8)",inp(path+".loss94",{n:1}),{ref:"d"});
  if(opts.dcg)h+=row("e · Deemed STCG on depreciable assets (Sch DCG item 6)",inp(path+".dcg",{n:1}),{ref:"6e"});
  (opts.deds||[]).forEach(code=>{const c=code.replace("s","");
    h+=row("d · Deduction u/s "+c,inp(path+".ded."+code,{n:1}),{ref:c,ind:1});});
  return h;}
function aggBlock(id,title,ref,path,o,r,opts){opts=opts||{};
  const h=aggBody(path,r,opts)+calcRow(title+" gain",ref,r.gain);
  return fold(id,ref,title,RS(r.gain),h,{});}

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
  DCLAIM.forEach(Dd=>{const rows=dc[Dd.ns]||[];let cols;
    if(Dd.invest)cols=[
      {h:"Date of transfer of original asset",k:"transfer",t:"date"},
      {h:"Amount invested",k:"invested",t:"num"},
      {h:"Date of investment",k:"invdate",t:"date"},
      {h:"Amount of deduction claimed",k:"amt",t:"num"}];
    else cols=[
      {h:(Dd.acq?"Date of acquisition of original asset":"Date of transfer of original asset"),k:"transfer",t:"date"},
      {h:Dd.costH,k:"cost",t:"num"},
      {h:"Date of purchase / construction",k:"purchase",t:"date"},
      {h:"Amount deposited in CGAS before due date",k:"deposited",t:"num"},
      {h:"Date of deposit",k:"depdate",t:"date"},
      {h:"Account no.",k:"acno",t:"txt",max:20},
      {h:"IFS code",k:"ifsc",t:"txt",max:11},
      {h:"Amount of deduction claimed",k:"amt",t:"num"}];
    h+='<p style="margin:12px 0 2px;font-weight:600;color:var(--ink-2)">'+esc(Dd.lbl)+'</p>';
    h+=grid("cg.dclaim."+Dd.ns,cols,rows,{empty:"No claim detail entered.",add:"Add a claim",min:Dd.invest?"760px":"1280px"});
  });
  return h;
}

/* A9 / B11 DTAA detail grid (NRICgDTAA.NRIDTAADtls) */
function dtaaGrid(key,rows){
  return grid(key,[
    {h:"Amount of income",k:"amt",t:"num"},
    {h:"Item (A1–A8 / B1–B10) included",k:"itemno",t:"txt",max:10},
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

function deemGrid(key,rows,secOpts){
  return grid(key,[
    {h:"PY of transfer",k:"py",t:"sel",opts:DEEM_PY},
    {h:"Section",k:"sec",t:"sel",opts:secOpts},
    {h:"PY new asset acquired/constructed",k:"yracq",t:"sel",opts:DEEM_YRACQ},
    {h:"Amount utilised out of CGAS",k:"util",t:"num"},
    {h:"Amount unutilised (X)",k:"unused",t:"num"}
  ],rows||[],{empty:"No unutilised CGAS.",add:"Add a row",min:"940px"});
}

function secCg(){
  const G=S.C.cg||{on:false};
  if(!G.on){
    return note("Turn this on to open Schedule CG — land/building, slump sale, listed equity (112A), other assets, deemed gains, pass-through, DTAA, buy-back losses, and Virtual Digital Assets.")+
      row("Report capital gains?",sel("cg.on",[["true","Yes"]],{blank:true}),{ref:"Schedule CG · C3"});
  }
  const C=S.cg;let h="";
  h+=row("Report capital gains?",sel("cg.on",[["false","No"],["true","Yes"]],{blank:false}),{ref:"Schedule CG"});

  /* ---- A · short-term ---- */
  let a="";
  (G.land.st||[]).forEach(p=>a+=landBlock(p,p._i,false));
  a+='<button class="add" data-addland="Short">Add a short-term property (A1)</button>';
  a+=fold("cga2","A2c","A2 · Slump sale (STCG)",RS(G.A.a2.gain),
    row("ai · FMV as per Rule 11UAE(2)",inp("cg.a2.fmv2",{n:1}),{ref:"2ai"})+
    row("aii · FMV as per Rule 11UAE(3)",inp("cg.a2.fmv3",{n:1}),{ref:"2aii"})+
    calcRow("aiii · Full value (higher of ai/aii)","2aiii",G.A.a2.value)+
    row("b · Net worth of the undertaking (6(e) of Form 3CEA)",inp("cg.a2.networth",{n:1}),{ref:"2b"})+
    calcRow("c · STCG from slump sale (2aiii − 2b)","A2c",G.A.a2.gain),{});
  a+=aggBlock("cga3i","A3(i) · 111A equity share / EOMF / business trust (STT paid) [for others]","A3ie","cg.a3i",C.a3i,G.A.a3i,{loss94:1});
  a+=aggBlock("cga3ii","A3(ii) · 115AD(1)(b)(ii) equity (STT paid) [for FII]","A3iie","cg.a3ii",C.a3ii,G.A.a3ii,{loss94:1});
  a+=aggBlock("cga6","A6 · STCG on assets other than A1–A5","A6g","cg.a6",C.a6,G.A.a6,{unq:1,loss94:1,dcg:1,deds:["s54G","s54GA"]});
  /* A7 deemed STCG */
  const a7unut=st0((C.a7||{}).unutFlag)==="Y"||(((C.a7||{}).deem||[]).length>0);
  a+=fold("cga7","A7","A7 · Amount deemed to be STCG",RS(G.A.a7.gain),
    row("Any unutilized capital gain of an earlier year now chargeable?",
      sel("cg.a7.unutFlag",[["N","No"],["Y","Yes"]],{blank:true}),{ref:"UnutilizedStcgFlag"})+
    (a7unut?deemGrid("cg.a7.deem",(C.a7||{}).deem,DEEM_ST_SEC):"")+
    row("b · Amount deemed STCG u/s 54D/54G/54GA (other than at 'a')",inp("cg.a7.other",{n:1}),{ref:"7b"})+
    calcRow("Total amount deemed to be STCG (aXi+aXii+aXiii + b)","A7",G.A.a7.gain),{});
  /* A8 PTI */
  a+=fold("cga8","A8","A8 · Pass-through income/loss (STCG) — Schedule PTI",RS(G.A.a8.gain),
    row("a · chargeable @ 20%",inp("cg.a8.r20",{n:1}),{ref:"8a"})+
    row("b · chargeable @ 30%",inp("cg.a8.r30",{n:1}),{ref:"8b"})+
    row("c · at applicable rates",inp("cg.a8.rApp",{n:1}),{ref:"8c"})+
    calcRow("Total pass-through STCG","A8",G.A.a8.gain),{});
  /* A(A) buy-back STCL */
  a+=fold("cgaA","A(A)","A(A) · Capital loss on buy-back of shares (STCL 20%/30%/applicable)",RS(-G.A.aA.loss),
    note("Can be claimed only if the corresponding dividend u/s 2(22)(f) is offered in Schedule OS.")+
    grid("cg.aA",[{h:"Rate",k:"rate",t:"sel",opts:BBST},{h:"Loss amount",k:"amt",t:"num"}],
      C.aA||[],{empty:"No buy-back loss.",add:"Add a row",min:"560px"}),{});
  /* NON-RESIDENT STCG heads A4/A5 + DTAA A9 */
  if(G.nri){
    a+=fold("cga4","A4","A4 · STCG for a non-resident (111A / other shares & debentures)",RS(G.A.a4.gain),
      row("a · STCG on transactions covered u/s 111A (STT paid)",inp("cg.a4.sttPaid",{n:1}),{ref:"A4a"})+
      row("b · STCG from shares/debentures not covered at 4a",inp("cg.a4.sttNot",{n:1}),{ref:"A4b"})+
      calcRow("Total STCG for non-resident (A4a + A4b)","A4",G.A.a4.gain),{});
    a+=aggBlock("cga5","A5 · STCG on securities by an FII u/s 115AD","A5e","cg.a5",C.a5,G.A.a5,{unq:1,loss94:1});
    a+=fold("cga9","A9","A9 · STCG not chargeable / chargeable at special rate per DTAA",RS(G.A.a9.special),
      dtaaGrid("cg.a9",C.a9||[])+
      calcRow("9a · STCG not chargeable to tax in India as per DTAA","A9a",G.A.a9.notTax)+
      calcRow("9b · STCG chargeable at special rate in India as per DTAA","A9b",G.A.a9.special),{});
  }
  a+=calcRow("A10 · Total Short-term Capital Gain (A1e+A2c+A3e+A4a+A4b+A5e+A6g+A7+A8−A9a+A(A))","A10",G.A.total);
  h+=fold("cgA","A · STCG","Short-term capital gains (items 4 & 5 not applicable for residents)",RS(G.A.total),a,{def:true});

  /* ---- B · long-term ---- */
  let b="";
  (G.land.lt||[]).forEach(p=>b+=landBlock(p,p._i,true));
  b+='<button class="add" data-addland="Long">Add a long-term property (B1)</button>';
  b+=calcRow("B1g · Total LTCG on Immovable property (ΣB1e)","B1g",G.B.b1);
  b+=fold("cgb2","B2e","B2 · Slump sale (LTCG)",RS(G.B.b2.gain),
    row("ai · FMV as per Rule 11UAE(2)",inp("cg.b2.fmv2",{n:1}),{ref:"2ai"})+
    row("aii · FMV as per Rule 11UAE(3)",inp("cg.b2.fmv3",{n:1}),{ref:"2aii"})+
    calcRow("aiii · Full value (higher of ai/aii)","2aiii",G.B.b2.value)+
    row("b · Net worth of the undertaking (6(e) of Form 3CEA)",inp("cg.b2.networth",{n:1}),{ref:"2b"})+
    calcRow("c · Balance (2aiii − 2b)","2c",G.B.b2.c)+
    row("d · Deduction u/s 54EC",inp("cg.b2.ded.s54EC",{n:1}),{ref:"2di",ind:1})+
    calcRow("e · LTCG from slump sale (2c − 2d)","B2e",G.B.b2.gain),{});
  b+=aggBlock("cgb3","B3 · Listed securities (other than a unit) / ZCB u/s 112(1)","B3c","cg.b3",C.b3,G.B.b3,{});
  /* B4 112A */
  b+=fold("cgb4","B4","B4 · Equity / EOMF / business-trust units u/s 112A (STT paid)",RS(G.B.b4.gain),
    note("Enter the scrips in Schedule 112A below; the Col 14 total feeds B4.")+
    calcRow("LTCG on assets at B4 (column 14 of Schedule 112A)","B4",G.B.b4.a)+
    scripGrid("cg.s112a",C.s112a||[])+
    calcRow("Total balance (Schedule 112A, Col 14)","Balance112A",(G.s112a||{}).bal||0),{def:true});
  b+=aggBlock("cgb8","B8 · LTCG on assets where B1–B7 are not applicable","B8e","cg.b8",C.b8,G.B.b8,{unq:1,deds:["s54D","s54G","s54GA"]});
  /* B9 deemed LTCG */
  const b9unut=st0((C.b9||{}).unutFlag)==="Y"||(((C.b9||{}).deem||[]).length>0);
  b+=fold("cgb9","B9","B9 · Amount deemed to be LTCG",RS(G.B.b9.gain),
    row("Any unutilized capital gain of an earlier year now chargeable?",
      sel("cg.b9.unutFlag",[["N","No"],["Y","Yes"]],{blank:true}),{ref:"UnutilizedLtcgFlag"})+
    (b9unut?deemGrid("cg.b9.deem",(C.b9||{}).deem,DEEM_LT_SEC):"")+
    row("b · Amount deemed LTCG (other than at 'a')",inp("cg.b9.other",{n:1}),{ref:"9b"})+
    calcRow("Total amount deemed to be LTCG (aXi+aXii+aXiii + b)","B9",G.B.b9.gain),{});
  /* B10 PTI */
  b+=fold("cgb10","B10","B10 · Pass-through income/loss (LTCG) — Schedule PTI",RS(G.B.b10.gain),
    row("a1 · chargeable @ 12.5% u/s 112A",inp("cg.b10.r125a",{n:1}),{ref:"10a1"})+
    row("a2 · chargeable @ 12.5% under other sections",inp("cg.b10.r125o",{n:1}),{ref:"10a2"})+
    calcRow("Total pass-through LTCG","B10",G.B.b10.gain),{});
  /* B(A) buy-back LTCL */
  b+=fold("cgbA","B(A)","B(A) · Capital loss on buy-back of shares (LTCL @12.5%)",RS(-G.B.bA.loss),
    note("Can be claimed only if the corresponding dividend income is offered in Schedule OS.")+
    row("Loss on buy-back of shares [Long Term 12.5%]",inp("cg.bA.amt",{n:1}),{ref:"B(A)"}),{});
  /* NON-RESIDENT LTCG heads B5/B6/B7 + DTAA B11 */
  if(G.nri){
    b+=fold("cgb5","B5","B5 · LTCG on unlisted shares / listed debentures (non-resident)",RS(G.B.b5.gain),
      row("LTCG computed without indexation / forex benefit (1st proviso to s.48)",inp("cg.b5.gain",{n:1}),{ref:"B5"}),{});
    let b6="";
    (C.b6||[]).forEach((rw,i)=>{const rr=(G.B.b6.rows||[])[i]||engAgg(rw,{unq:1,deds:["s54F"]});
      b6+=blk("cgb6_"+i,"B6 asset "+(i+1),RS(rr.gain),
        row("Section",inp("cg.b6."+i+".sec",{max:10,ph:"112(1)(c)/115AB/115AC/115AD"}),{ref:"SectionCode"})+
        aggBody("cg.b6."+i,rr,{unq:1})+
        calcRow("LTCG on assets at B6","B6c",rr.gain),
        "cg.b6."+i);});
    b6+='<button class="add" data-add="cg.b6">Add a B6 asset</button>';
    b+=fold("cgb6","B6c","B6 · LTCG for non-resident u/s 112(1)(c) / 115AB / 115AC / 115AD",RS(G.B.b6.gain),b6,{});
    b+=fold("cgb7","B7","B7 · FII/FPI 112A route u/s 115AD(1)(b)(iii) proviso",RS(G.B.b7.gain),
      calcRow("LTCG on assets at B7 (column 14 of Schedule 115AD)","B7",G.B.b7.a)+
      scripGrid("cg.s115ad",C.s115ad||[]),{});
    b+=fold("cgb11","B11","B11 · LTCG not chargeable / chargeable at special rate per DTAA",RS(G.B.b11.special),
      dtaaGrid("cg.b11",C.b11||[])+
      calcRow("a · LTCG not chargeable to tax in India as per DTAA","B11a",G.B.b11.notTax)+
      calcRow("b · LTCG chargeable at special rate in India as per DTAA","B11b",G.B.b11.special),{});
  }
  b+=calcRow("B12 · Total Long-term Capital Gain (B1g+B2e+B3c+B4+B5+B6c+B7+B8e+B9+B10−B11a+B(A))","B12",G.B.total);
  h+=fold("cgB","B · LTCG","Long-term capital gains (sub-items 5, 6 & 7 not applicable for residents)",RS(G.B.total),b,{def:true});

  /* ---- C · summary ---- */
  h+=fold("cgC","C","Income under the head Capital Gains",RS(G.C3),
    calcRow("C1 · Sum of capital gain incomes (Table E, remaining after set-off)","C1",G.C1)+
    calcRow("C2 · Income from transfer of Virtual Digital Assets (Item B of Schedule VDA)","C2",G.C2)+
    calcRow("C3 · Income chargeable under CAPITAL GAINS (C1 + C2)","C3",G.C3),{def:true});

  /* ---- Schedule VDA ---- */
  let v="";
  v+=note("Detail of every transaction is to be filled — VDA income is reported deal by deal, not netted. Income = consideration − cost of acquisition (only); a loss is entered as nil (s.115BBH @30%).");
  v+=grid("cg.vda",[
      {h:"Date of acquisition",k:"buy",t:"date"},
      {h:"Date of transfer",k:"sale",t:"date"},
      {h:"Head",k:"head",t:"sel",opts:HEADVDA},
      {h:"Cost of acquisition",k:"cost",t:"num"},
      {h:"Consideration received",k:"cons",t:"num"},
      {h:"Income (Col 6 − Col 5)",k:"inc",t:"calc",f:r=>(r._||{}).inc||0}
    ],C.vda||[],{empty:"No VDA transfer.",add:"Add a transfer",min:"820px"});
  v+=calcRow("A · Total positive Business Income (→ Schedule BP)","A",G.vda.bi);
  v+=calcRow("B · Total positive Capital Gain (→ C2)","B",G.vda.cg);
  h+=fold("cgVDA","Schedule VDA","Virtual Digital Assets (s.115BBH @30%)",RS(G.vda.bi+G.vda.cg),v,{});

  /* ---- D · deductions claimed ---- */
  let d="";
  if(G.dedTotal){Object.keys(G.dedD).forEach(sec=>{const rows=G.dedD[sec];
    d+=calcRow("Deduction u/s "+sec,sec,rows.reduce((a,r)=>a+r.amt,0));});}
  d+=calcRow("1e · Total deduction claimed (1a + 1b + 1c + 1d)","1e",G.dedTotal);
  h+=fold("cgD","D","Deductions claimed against capital gains",RS(G.dedTotal),
    (G.dedTotal?"":note("Deductions entered against each head above are totalled here."))+d,{});
  let dclaimTot=0;DCLAIM.forEach(Dd=>((C.dclaim||{})[Dd.ns]||[]).forEach(r=>dclaimTot+=N(r.amt)));
  h+=fold("cgDdet","D","Details of deduction claimed u/s 54D/54EC/54G/54GA (CGAS / new asset)",RS(dclaimTot),
    note("Enter the proof of each exemption claimed — date of transfer, cost of the new asset, CGAS deposit and account. Disclosure detail; it does not alter the computed gain.")+
    dclaimBlock(C),{});

  /* ---- E · set-off ---- */
  h+=fold("cgE","E","Set-off of current-year capital losses",RS(G.C1),
    setoffTable(G)+
    row("Edit the auto-populated set-off?",sel("cg.editE",[["false","No"],["true","Yes"]],{blank:false}),{ref:"row473"}),{});

  /* ---- F · quarterly split (234C) ---- */
  h+=fold("cgF","F","Accrual / receipt of capital gain (quarterly, for 234C)","—",
    quartersTable(G)+
    row("Edit the auto-filled quarters?",sel("cg.editF",[["false","No"],["true","Yes"]],{blank:false}),{ref:"row476"}),{});

  return h;
}

/* =====================================================================
   EXPORT — ScheduleCG / Schedule112A / Schedule115AD / ScheduleVDA
   ===================================================================== */
function scripBlock(rows,suf){
  const good=(rows||[]).filter(r=>r.pre18&&(N((r._||{}).sale)||N((r._||{}).bal)||N(r.cost)||N(r.sale6)||N(r.qty)));
  if(!good.length)return null;
  const t=engScrip(good);
  const dtls=good.map(r=>{const x=r._||{};const pre=r.pre18==="BE";
    return {ShareOnOrBefore:pre?"BE":"AE",
      ISINCode: pre?(/^IN[0-9A-Z]{10}$/.test(st0(r.isin).toUpperCase())?st0(r.isin).toUpperCase():"INNOTAVAILAB"):"INNOTREQUIRD",
      ShareUnitName: pre?((sv(r.name)||"NA").slice(0,125)):"CONSOLIDATED",
      NumSharesUnits: pre?(N(r.qty)||undefined):undefined,
      SalePricePerShareUnit: pre?(N(r.price)||undefined):undefined,
      TotSaleValue:n0(x.sale),CostAcqWithoutIndx:n0(x.cwo),AcquisitionCost:n0(r.cost),
      LTCGBeforelower6and11:n0(x.col9),FairMktValuePerShareunit:pre?(N(r.fmv18)||0):0,
      TotFairMktValueCapAst:n0(x.fmvTot),ExpExclCnctTransfer:n0(r.exp),
      TotalDeductions:n0(x.totded),Balance:sg(x.bal)};});
  const bl={};bl["Schedule"+suf+"Dtls"]=dtls;
  bl["SaleValue"+suf]=n0(t.sale); bl["CostAcqWithoutIndx"+suf]=n0(t.cwo);
  bl["AcquisitionCost"+suf]=n0(t.cost); bl["LTCGBeforelowerB1B2"+suf]=n0(t.before);
  bl["FairMktValueCapAst"+suf]=n0(t.fmv); bl["ExpExclCnctTransfer"+suf]=n0(t.exp);
  bl["Deductions"+suf]=n0(t.ded); bl["Balance"+suf]=sg(t.bal);
  return bl;
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
  const dtaaOut=rows=>{const good=(rows||[]).filter(r=>N(r.amt));if(!good.length)return undefined;
    return {NRIDTAADtls:good.map(r=>{const o={DTAAamt:n0(r.amt),ItemNoincl:st0(r.itemno),
      CountryName:st0(r.country),CountryCodeExcludingIndia:st0(r.ccode),DTAAarticle:st0(r.article),
      RateAsPerTreaty:N(r.treaty),SecITAct:st0(r.secit),RateAsPerITAct:N(r.itact)};
      if(r.trc)o.TaxRescertifiedFlag=r.trc;
      if(r._appl!=null)o.ApplicableRate=r._appl;
      return o;})};};
  const zDed48=()=>({AquisitCost:0,ImproveCost:0,ExpOnTrans:0,TotalDedn:0});

  /* ---- Part A (ShortTermCapGain) ---- */
  const ST={};
  const stLand=(G.land.st||[]).map(p=>{const r=p._;const ex=[];
    [["s54G","54G"],["s54GA","54GA"]].forEach(([k,c])=>{if(N((p.ded||{})[k]))ex.push({ExemptionSecCode:c,ExemptionAmount:n0(p.ded[k])});});
    return {DateofPurchase:ISO(p.buy),DateofSale:ISO(p.sale),
      FullConsideration:n0(p.cons),PropertyValuation:n0(p.sdv),FullConsideration50C:n0(r.value),
      AquisitCost:n0(p.cost),ImproveCost:n0(p.improve),ExpOnTrans:n0(p.exp),TotalDedn:n0(r.biv),
      Balance:sg(r.c),ExemptionOrDednUs54:Object.assign({ExemptionGrandTotal:n0(r.dedTot)},ex.length?{ExemptionOrDednUs54Dtls:ex}:{}),
      CapgainonAssets:sg(r.e),TrnsfImmblPrprty:buyers(p)};});
  if(stLand.length)ST.SaleofLandBuild={SaleofLandBuildDtls:stLand};
  if(N(C.a2&&(C.a2.fmv2||C.a2.fmv3||C.a2.networth)))
    ST.SlumpSaleInStcg={FMV11UAEii:n0(C.a2.fmv2),FMV11UAEiii:n0(C.a2.fmv3),
      FullConsideration:n0(A.a2.value),NetWorthOfDivision:n0(C.a2.networth),CapgainonAssets:sg(A.a2.gain)};
  /* A3 EquityMFonSTT[] — (i) 1A 111A, (ii) 5AD1biip 115AD(1)(b)(ii) FII */
  const mf=[];
  const mfEl=(o,r,code)=>({MFSectionCode:code,EquityMFonSTTDtls:{
    FullConsideration:n0(r.cons),DeductSec48:{AquisitCost:n0(o.cost),ImproveCost:n0(o.improve),
      ExpOnTrans:n0(o.exp),TotalDedn:n0(r.biv)},BalanceCG:sg(r.c),
    LossSec94of7Or94of8:n0(o.loss94),CapgainonAssets:sg(r.gain)}});
  if(N((C.a3i||{}).cons)||N((C.a3i||{}).cost))mf.push(mfEl(C.a3i,A.a3i,"1A"));
  if(N((C.a3ii||{}).cons)||N((C.a3ii||{}).cost))mf.push(mfEl(C.a3ii,A.a3ii,"5AD1biip"));
  if(mf.length)ST.EquityMFonSTT=mf;
  if(N((C.a6||{}).unqCons)||N((C.a6||{}).othCons)||N((C.a6||{}).cost)||N(A.a6.dcg))
    ST.SaleOnOtherAssets={FullValueConsdRecvUnqshr:n0(C.a6.unqCons),FairMrktValueUnqshr:n0(C.a6.unqFmv),
      FullValueConsdSec50CA:n0(A.a6.c50ca),FullValueConsdOthUnqshr:n0(C.a6.othCons),
      FullConsideration:n0(A.a6.cons),
      DeductSec48:{AquisitCost:n0(C.a6.cost),ImproveCost:n0(C.a6.improve),ExpOnTrans:n0(C.a6.exp),TotalDedn:n0(A.a6.biv)},
      BalanceCG:sg(A.a6.c),LossSec94of7Or94of8:n0(A.a6.l94),DeemedSTCGDeprAsset:n0(A.a6.dcg),
      ExemptionOrDednUs54:{ExemptionGrandTotal:n0(A.a6.ded)},CapgainonAssets:sg(A.a6.gain)};
  ST.TotalAmtDeemedStcg=n0(A.a7.gain);
  if(st0((C.a7||{}).unutFlag))ST.UnutilizedStcgFlag=st0(C.a7.unutFlag);
  const dm=((C.a7&&C.a7.deem)||[]).filter(x=>N(x.unused)||N(x.util));
  if(dm.length)ST.UnutilizedCg={UnutilizedCgPrvYrDtls:dm.map(x=>{const o={
    PrvYrInWhichAsstTrnsfrd:x.py||"2024-25",SectionClmd:x.sec||"54G",AmtUnutilized:n0(x.unused)};
    if(st0(x.yracq))o.YrInWhichAssetAcq=st0(x.yracq);
    if(N(x.util))o.AmtUtilized=n0(x.util);return o;})};
  if(N((C.a7||{}).other))ST.AmtDeemedStcg=n0(C.a7.other);
  ST.PassThrIncNatureSTCG=n0(A.a8.gain);
  if(N((C.a8||{}).r20))ST.PassThrIncNatureSTCG20Per=n0(C.a8.r20);
  if(N((C.a8||{}).r30))ST.PassThrIncNatureSTCG30Per=n0(C.a8.r30);
  if(N((C.a8||{}).rApp))ST.PassThrIncNatureSTCGAppRate=n0(C.a8.rApp);
  ST.TotalAmtNotTaxUsDTAAStcg=n0(A.a9.notTax);ST.TotalAmtTaxUsDTAAStcg=n0(A.a9.special);
  const bb=(C.aA||[]).filter(x=>N(x.amt));
  if(bb.length)ST.CapitalLossBuyBackShares={TotalCapitalLossBuyBackShares:-n0(A.aA.loss),
    CapitalLossBuyBackSharesDtls:bb.map(x=>({Rate:x.rate||"STL20",Amount:-n0(x.amt)}))};
  if(G.nri){
    if(N((C.a4||{}).sttPaid)||N((C.a4||{}).sttNot))
      ST.NRITransacSec48Dtl={NRItaxSTTPaid:n0((C.a4||{}).sttPaid),NRItaxSTTNotPaid:n0((C.a4||{}).sttNot)};
    if(N((C.a5||{}).unqCons)||N((C.a5||{}).othCons)||N((C.a5||{}).cost))
      ST.NRISecur115AD={FullValueConsdRecvUnqshr:n0(C.a5.unqCons),FairMrktValueUnqshr:n0(C.a5.unqFmv),
        FullValueConsdSec50CA:n0(A.a5.c50ca),FullValueConsdOthUnqshr:n0(C.a5.othCons),FullConsideration:n0(A.a5.cons),
        DeductSec48:{AquisitCost:n0(C.a5.cost),ImproveCost:n0(C.a5.improve),ExpOnTrans:n0(C.a5.exp),TotalDedn:n0(A.a5.biv)},
        BalanceCG:sg(A.a5.c),LossSec94of7Or94of8:n0(A.a5.l94),CapgainonAssets:sg(A.a5.gain)};
    const a9d=dtaaOut(C.a9); if(a9d)ST.NRICgDTAA=a9d;
  }
  ST.TotalSTCG=sg(A.total);

  /* schema-required zero stubs (the utility emits these even when nil) */
  const dfl=(o,k,v)=>{if(o[k]===undefined)o[k]=v;};
  dfl(ST,"SlumpSaleInStcg",{FMV11UAEii:0,FMV11UAEiii:0,FullConsideration:0,NetWorthOfDivision:0,CapgainonAssets:0});
  dfl(ST,"SaleOnOtherAssets",{FullValueConsdRecvUnqshr:0,FairMrktValueUnqshr:0,FullValueConsdSec50CA:0,
    FullValueConsdOthUnqshr:0,FullConsideration:0,DeductSec48:zDed48(),BalanceCG:0,LossSec94of7Or94of8:0,
    DeemedSTCGDeprAsset:0,ExemptionOrDednUs54:{ExemptionGrandTotal:0},CapgainonAssets:0});
  /* NRITransacSec48Dtl + NRISecur115AD are schema-REQUIRED on every ShortTermCapGain -> emit unconditionally; dfl() preserves any NR data written above */
  dfl(ST,"NRITransacSec48Dtl",{NRItaxSTTPaid:0,NRItaxSTTNotPaid:0});
  dfl(ST,"NRISecur115AD",{FullValueConsdRecvUnqshr:0,FairMrktValueUnqshr:0,FullValueConsdSec50CA:0,
    FullValueConsdOthUnqshr:0,FullConsideration:0,DeductSec48:zDed48(),BalanceCG:0,LossSec94of7Or94of8:0,CapgainonAssets:0});

  /* ---- Part B (LongTermCapGain) ---- */
  const LT={};
  const ltLand=(G.land.lt||[]).map(p=>{const r=p._;const ex=[];
    [["s54D","54D"],["s54EC","54EC"],["s54G","54G"],["s54GA","54GA"]]
      .forEach(([k,c])=>{if(N((p.ded||{})[k]))ex.push({ExemptionSecCode:c,ExemptionAmount:n0(p.ded[k])});});
    return {DateofPurchase:ISO(p.buy),DateofSale:ISO(p.sale),FullConsideration:n0(p.cons),
      PropertyValuation:n0(p.sdv),FullConsideration50C:n0(r.value),AquisitCost:n0(p.cost),
      ImproveCost:n0(p.improve),ExpOnTrans:n0(p.exp),TotalDedn:n0(r.biv),Balance:sg(r.c),
      ExemptionOrDednUs54:Object.assign({ExemptionGrandTotal:n0(r.dedTot)},ex.length?{ExemptionOrDednUs54Dtls:ex}:{}),
      CapgainonAssets:sg(r.e),TrnsfImmblPrprty:buyers(p)};});
  if(ltLand.length)LT.SaleofLandBuild={SaleofLandBuildDtls:ltLand,TotalLTCGImmblPrprty:sg(B.b1)};
  if(N(C.b2&&(C.b2.fmv2||C.b2.fmv3||C.b2.networth)))
    LT.SlumpSaleInLtcgDtls={SlumpSaleInLtcg:{FMV11UAEii:n0(C.b2.fmv2),FMV11UAEiii:n0(C.b2.fmv3),
      FullConsideration:n0(B.b2.value),NetWorthOfDivision:n0(C.b2.networth),SlumpBalance:sg(B.b2.c),
      DeductionUnderSec54:n0(B.b2.ded),CapgainonAssets:sg(B.b2.gain)}};
  if(N((C.b3||{}).cons)||N((C.b3||{}).cost))
    LT.Proviso112Applicable={Proviso112SectionCode:"22",Proviso112Applicabledtls:{
      FullConsideration:n0(B.b3.cons),DeductSec48:{AquisitCost:n0(C.b3.cost),ImproveCost:n0(C.b3.improve),
        ExpOnTrans:n0(C.b3.exp),TotalDedn:n0(B.b3.biv)},BalanceCG:sg(B.b3.c)}};
  LT.SaleOfEquityShareUs112A={CapgainonAssets:sg(B.b4.gain)};   /* B4 = Balance112A */
  if(N((C.b8||{}).unqCons)||N((C.b8||{}).othCons)||N((C.b8||{}).cost)){const ex=[];
    [["s54D","54D"],["s54G","54G"],["s54GA","54GA"]].forEach(([k,c])=>{if(N(((C.b8||{}).ded||{})[k]))ex.push({ExemptionSecCode:c,ExemptionAmount:n0(C.b8.ded[k])});});
    LT.SaleofAssetNADtls={SaleofAssetNA:{FullValueConsdRecvUnqshr:n0(C.b8.unqCons),FairMrktValueUnqshr:n0(C.b8.unqFmv),
      FullValueConsdSec50CA:n0(B.b8.c50ca),FullValueConsdOthUnqshr:n0(C.b8.othCons),FullConsideration:n0(B.b8.cons),
      DeductSec48:{AquisitCost:n0(C.b8.cost),ImproveCost:n0(C.b8.improve),ExpOnTrans:n0(C.b8.exp),TotalDedn:n0(B.b8.biv)},
      BalanceCG:sg(B.b8.c),ExemptionOrDednUs54:Object.assign({ExemptionGrandTotal:n0(B.b8.ded)},ex.length?{ExemptionOrDednUs54Dtls:ex}:{}),
      CapgainonAssets:sg(B.b8.gain)}};}
  LT.TotalAmtDeemedLtcg=n0(B.b9.gain);
  if(st0((C.b9||{}).unutFlag))LT.UnutilizedLtcgFlag=st0(C.b9.unutFlag);
  const dml=((C.b9&&C.b9.deem)||[]).filter(x=>N(x.unused)||N(x.util));
  if(dml.length)LT.UnutilizedCg={UnutilizedCgPrvYrDtls:dml.map(x=>{const o={
    PrvYrInWhichAsstTrnsfrd:x.py||"2024-25",SectionClmd:x.sec||"54D",AmtUnutilized:n0(x.unused)};
    if(st0(x.yracq))o.YrInWhichAssetAcq=st0(x.yracq);
    if(N(x.util))o.AmtUtilized=n0(x.util);return o;})};
  if(N((C.b9||{}).other))LT.AmtDeemedLtcg=n0(C.b9.other);
  LT.PassThrIncNatureLTCG=n0(B.b10.gain);
  if(N((C.b10||{}).r125a))LT.PassThrIncNatureLTCGUs112A12_5Per=n0(C.b10.r125a);
  if(N((C.b10||{}).r125o))LT.PassThrIncNatureLTCG12_5Per=n0(C.b10.r125o);
  LT.TotalAmtNotTaxUsDTAALtcg=n0(B.b11.notTax);LT.TotalAmtTaxUsDTAALtcg=n0(B.b11.special);
  if(N((C.bA||{}).amt))LT.CapitalLossBuyBackShares={TotalCapitalLossBuyBackShares:-n0(B.bA.loss)};
  if(G.nri){
    if(N((C.b5||{}).gain))LT.NRIProvisoSec48={BalanceCG:sg(B.b5.gain)};
    const b6=(C.b6||[]).filter(r=>st0(r.sec)&&(N(r.unqCons)||N(r.othCons)||N(r.cost)));
    if(b6.length)LT.NRIOnSec112and115={NRIOnSec112and115Dtls:b6.map(r=>{const rr=engAgg(r,{unq:1});
      return {SectionCode:st0(r.sec),FullValueConsdRecvUnqshr:n0(r.unqCons),FairMrktValueUnqshr:n0(r.unqFmv),
        FullValueConsdSec50CA:n0(rr.c50ca),FullValueConsdOthUnqshr:n0(r.othCons),FullConsideration:n0(rr.cons),
        DeductSec48:{AquisitCost:n0(r.cost),ImproveCost:n0(r.improve),ExpOnTrans:n0(r.exp),TotalDedn:n0(rr.biv)},
        BalanceCG:sg(rr.gain)};}),TotalNRIOnSec112and115:sg(B.b6.gain)};
    if(N((C.b7||{}).a)||N(B.b7.a))LT.NRISaleOfEquityShareUs112A={CapgainonAssets:sg(B.b7.gain)};
    const b11d=dtaaOut(C.b11); if(b11d)LT.NRICgDTAA=b11d;
  }
  LT.TotalLTCG=sg(B.total);

  dfl(LT,"SlumpSaleInLtcgDtls",{SlumpSaleInLtcg:{FMV11UAEii:0,FMV11UAEiii:0,FullConsideration:0,
    NetWorthOfDivision:0,SlumpBalance:0,DeductionUnderSec54:0,CapgainonAssets:0}});
  dfl(LT,"SaleofAssetNADtls",{SaleofAssetNA:{FullValueConsdRecvUnqshr:0,FairMrktValueUnqshr:0,FullValueConsdSec50CA:0,
    FullValueConsdOthUnqshr:0,FullConsideration:0,DeductSec48:zDed48(),BalanceCG:0,
    ExemptionOrDednUs54:{ExemptionGrandTotal:0},CapgainonAssets:0}});
  /* NRISaleOfEquityShareUs112A is schema-REQUIRED on every LongTermCapGain -> emit unconditionally; NRIProvisoSec48 is NOT required -> stays NR-only */
  if(G.nri)dfl(LT,"NRIProvisoSec48",{BalanceCG:0});
  dfl(LT,"NRISaleOfEquityShareUs112A",{CapgainonAssets:0});

  j.ScheduleCG={ShortTermCapGain:ST,LongTermCapGain:LT,
    SumOfCGIncm:sg(G.C1),IncmFromVDATrnsf:n0(G.C2),IncChargeableHeadCapGain:sg(G.C3)};

  /* ---- Part D · DeducClaimInfo ---- */
  const DED={};let dedTot=0;
  DCLAIM.forEach(Dd=>{const rows=((C.dclaim||{})[Dd.ns]||[])
      .filter(r=>N(r.amt)||N(r.cost)||N(r.invested)||ISO(r.transfer));
    if(!rows.length)return;
    DED[Dd.key]=rows.map(r=>{let o;
      if(Dd.invest){o={DateofTransfer:ISO(r.transfer),AmtInvested:n0(r.invested),AmtDeducted:n0(r.amt)};
        if(ISO(r.invdate))o.DateofInvestment=ISO(r.invdate);}
      else {o={};
        if(Dd.acq)o.DateofAcquisition=ISO(r.transfer); else o.DateofTransfer=ISO(r.transfer);
        o[Dd.cost]=n0(r.cost);
        if(ISO(r.purchase))o.DateofPurchase=ISO(r.purchase);
        o.AmtDeposited=n0(r.deposited);
        if(ISO(r.depdate))o.DepositDate=ISO(r.depdate);
        if(st0(r.acno))o.AccountNo=st0(r.acno);
        if(st0(r.ifsc))o.IFSC=st0(r.ifsc).toUpperCase();
        o.AmtDeducted=n0(r.amt);}
      dedTot+=N(r.amt);return o;});});
  DED.TotDeductClaim=n0(dedTot);
  j.ScheduleCG.DeducClaimInfo=DED;

  /* ---- Part E · CurrYrLosses ---- */
  const SL=[["st20","InStcg20Per","StclSetoff20Per"],["st30","InStcg30Per","StclSetoff30Per"],
    ["stApp","InStcgAppRate","StclSetoffAppRate"],["stDTAA","InStcgDTAARate","StclSetoffDTAARate"],
    ["lt125","InLtcg12_5Per","LtclSetOff12_5Per"],["ltDTAA","InLtcgDTAARate","LtclSetOffDTAARate"]];
  const CE={InLossSetOff:{}};
  SL.forEach(x=>{CE.InLossSetOff[x[2]]=n0(G.loss[x[0]]);});   /* row i — loss to be set off */
  SL.forEach(x=>{const node={CurrYearIncome:n0(G.gain[x[0]])};
    SL.forEach(l=>{if(l[0]===x[0])return;
      if(x[0].charAt(0)==="l"||l[0].charAt(0)!=="l")node[l[2]]=n0((G.matrix[x[0]]||{})[l[0]]||0);});
    node.CurrYrCapGain=n0(G.after[x[0]]);CE[x[1]]=node;});
  CE.TotLossSetOff={};CE.LossRemainSetOff={};                 /* rows viii / ix */
  SL.forEach(x=>{CE.TotLossSetOff[x[2]]=n0(G.totSet[x[0]]);CE.LossRemainSetOff[x[2]]=n0(G.remain[x[0]]);});
  j.ScheduleCG.CurrYrLosses=CE;
  if(C.editE)j.ScheduleCG.EditAutopoulatedDetail="Y";

  /* ---- Part F · AccruOrRecOfCG ---- */
  const QK=["Upto15Of6","Up16Of6To15Of9","Up16Of9To15Of12","Up16Of12To15Of3","Up16Of3To31Of3"];
  const FN={st20:"ShortTermUnder20Per",st30:"ShortTermUnder30Per",stApp:"ShortTermUnderAppRate",
    stDTAA:"ShortTermUnderDTAARate",lt125:"LongTermUnder12_5Per",ltDTAA:"LongTermUnderDTAARate"};
  /* quarters scaled to the post-BFLA figure (Schedule BFLA, published as
     S.C.loss.afterB per bucket) — rules keep the break-up totalling the
     after-brought-forward-set-off gain; falls back to the raw Fauto. */
  const _Lb=(S.C.loss||{}).afterB||{};
  const AF={};SL.forEach(x=>{const k=x[0];const src=(G.F[k]||[]);
    const pre=src.reduce((a,v)=>a+N(v),0);const tgt=N(_Lb[k]!=null?_Lb[k]:pre);const dr={};
    if(pre>0){const f=tgt/pre;let acc=0;QK.forEach((q,i)=>{if(i<4){dr[q]=n0(N(src[i])*f);acc+=dr[q];}});dr[QK[4]]=n0(tgt-acc);}
    else {QK.forEach(q=>dr[q]=0);if(tgt>0)dr[QK[4]]=n0(tgt);}
    AF[FN[k]]={DateRange:dr};});
  {const vq=[0,0,0,0,0];if(G.C2)(C.vda||[]).forEach(r=>{if(r._&&r._.inc&&r.head==="CG")vq[r._.q]+=r._.inc;});
    const dr={};QK.forEach((q,i)=>dr[q]=n0(vq[i]));AF.VDATrnsfGainsUnder30Per={DateRange:dr};}
  j.ScheduleCG.AccruOrRecOfCG=AF;

  /* ---- Schedule 112A / 115AD / VDA ---- */
  const b112=scripBlock(C.s112a,"112A");if(b112)j.Schedule112A=b112;
  if(G.nri){const b115=scripBlock(C.s115ad,"115AD");if(b115)j.Schedule115AD=b115;}
  const vr=(C.vda||[]).filter(r=>ISO(r.buy)&&ISO(r.sale)&&r.head);
  if(vr.length)j.ScheduleVDA={ScheduleVDADtls:vr.map(r=>({DateofAcquisition:ISO(r.buy),DateofTransfer:ISO(r.sale),
    HeadUndIncTaxed:r.head,AcquisitionCost:n0(r.cost),ConsidReceived:n0(r.cons),
    /* Sl.7 = Col.6 − Col.5, but "enter nil in case of loss" (VDA.md) and the
       schema floors it at 0 — a VDA loss is neither set off nor carried. */
    IncomeFromVDA:n0(Math.max(0,N(r.cons)-N(r.cost)))})),
    TotIncBusiness:n0(G.vda.bi),TotIncCapGain:n0(G.vda.cg)};
}

/* =====================================================================
   IMPORT — inverse of export (schema → S.cg)
   ===================================================================== */
function impCg(I6){
  const read=[];
  const g=(o,p)=>{try{return p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);}catch(e){return undefined;}};
  const CGb=I6&&I6.ScheduleCG;
  if(CGb){
    S.cg=S.cg||{};S.cg.on=true;
    const ST=CGb.ShortTermCapGain||{}, LT=CGb.LongTermCapGain||{};
    const bback=x=>{const bs=(g(x,"TrnsfImmblPrprty.TrnsfImmblPrprtyDtls")||[]);
      const out={buyers:bs.map(y=>({name:y.NameOfBuyer||"",pan:y.PANofBuyer||"",aadhaar:y.AaadhaarOfBuyer||"",
        share:nz(y.PercentageShare),amt:nz(y.Amount)}))};
      if(bs.length){out.paddr=bs[0].AddressOfProperty||"";out.pstate=bs[0].StateCode||"";
        out.ppin=bs[0].PinCode!=null?String(bs[0].PinCode):"";out.pcountry=bs[0].CountryCode||"";}
      return out;};
    const land=[];
    (g(ST,"SaleofLandBuild.SaleofLandBuildDtls")||[]).forEach(x=>{const d={};
      (g(x,"ExemptionOrDednUs54.ExemptionOrDednUs54Dtls")||[]).forEach(e=>d["s"+e.ExemptionSecCode]=nz(e.ExemptionAmount));
      land.push(Object.assign({buy:dmy(x.DateofPurchase),sale:dmy(x.DateofSale),lt:"Short",
        cons:nz(x.FullConsideration),sdv:nz(x.PropertyValuation),cost:nz(x.AquisitCost),
        improve:nz(x.ImproveCost),exp:nz(x.ExpOnTrans),ded:d},bback(x)));});
    (g(LT,"SaleofLandBuild.SaleofLandBuildDtls")||[]).forEach(x=>{const d={};
      (g(x,"ExemptionOrDednUs54.ExemptionOrDednUs54Dtls")||[]).forEach(e=>d["s"+e.ExemptionSecCode]=nz(e.ExemptionAmount));
      land.push(Object.assign({buy:dmy(x.DateofPurchase),sale:dmy(x.DateofSale),lt:"Long",
        cons:nz(x.FullConsideration),sdv:nz(x.PropertyValuation),cost:nz(x.AquisitCost),
        improve:nz(x.ImproveCost),exp:nz(x.ExpOnTrans),ded:d},bback(x)));});
    if(land.length){S.cg.land=land;read.push("capital gains (land/building)");}
    if(ST.SlumpSaleInStcg&&(N(ST.SlumpSaleInStcg.FMV11UAEii)||N(ST.SlumpSaleInStcg.FMV11UAEiii)||N(ST.SlumpSaleInStcg.NetWorthOfDivision)))
      S.cg.a2={fmv2:nz(ST.SlumpSaleInStcg.FMV11UAEii),fmv3:nz(ST.SlumpSaleInStcg.FMV11UAEiii),networth:nz(ST.SlumpSaleInStcg.NetWorthOfDivision)};
    (ST.EquityMFonSTT||[]).forEach(el=>{const dt=el.EquityMFonSTTDtls||{};const o={
      cons:nz(dt.FullConsideration),cost:nz(g(dt,"DeductSec48.AquisitCost")),
      improve:nz(g(dt,"DeductSec48.ImproveCost")),exp:nz(g(dt,"DeductSec48.ExpOnTrans")),
      loss94:nz(dt.LossSec94of7Or94of8)};
      if(el.MFSectionCode==="5AD1biip")S.cg.a3ii=o; else S.cg.a3i=o;});
    const a6=ST.SaleOnOtherAssets;
    if(a6&&(N(a6.FullConsideration)||N(a6.FullValueConsdRecvUnqshr)||N(a6.FullValueConsdOthUnqshr)||N(g(a6,"DeductSec48.AquisitCost"))||N(a6.DeemedSTCGDeprAsset)))
      S.cg.a6={unqCons:nz(a6.FullValueConsdRecvUnqshr),unqFmv:nz(a6.FairMrktValueUnqshr),othCons:nz(a6.FullValueConsdOthUnqshr),
        cost:nz(g(a6,"DeductSec48.AquisitCost")),improve:nz(g(a6,"DeductSec48.ImproveCost")),exp:nz(g(a6,"DeductSec48.ExpOnTrans")),
        loss94:nz(a6.LossSec94of7Or94of8),dcg:nz(a6.DeemedSTCGDeprAsset),
        ded:{}};   /* the ExemptionGrandTotal is derived; per-section detail not carried on A6 */
    S.cg.a7=S.cg.a7||{deem:[],other:0,unutFlag:""};
    S.cg.a7.deem=(g(ST,"UnutilizedCg.UnutilizedCgPrvYrDtls")||[]).map(x=>({py:x.PrvYrInWhichAsstTrnsfrd,sec:x.SectionClmd,
      yracq:x.YrInWhichAssetAcq||"",util:nz(x.AmtUtilized),unused:nz(x.AmtUnutilized)}));
    S.cg.a7.other=nz(ST.AmtDeemedStcg);S.cg.a7.unutFlag=ST.UnutilizedStcgFlag||"";
    S.cg.a8={r20:nz(ST.PassThrIncNatureSTCG20Per),r30:nz(ST.PassThrIncNatureSTCG30Per),rApp:nz(ST.PassThrIncNatureSTCGAppRate)};
    const bbs=g(ST,"CapitalLossBuyBackShares.CapitalLossBuyBackSharesDtls")||[];
    if(bbs.length)S.cg.aA=bbs.map(x=>({rate:x.Rate||"STL20",amt:Math.abs(N(x.Amount))}));
    /* B */
    const s2=g(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg");
    if(s2&&(N(s2.FMV11UAEii)||N(s2.FMV11UAEiii)||N(s2.NetWorthOfDivision)))
      S.cg.b2={fmv2:nz(s2.FMV11UAEii),fmv3:nz(s2.FMV11UAEiii),networth:nz(s2.NetWorthOfDivision),ded:{s54EC:nz(s2.DeductionUnderSec54)}};
    const p3=g(LT,"Proviso112Applicable.Proviso112Applicabledtls");
    if(p3&&(N(p3.FullConsideration)||N(g(p3,"DeductSec48.AquisitCost"))))
      S.cg.b3={cons:nz(p3.FullConsideration),cost:nz(g(p3,"DeductSec48.AquisitCost")),
        improve:nz(g(p3,"DeductSec48.ImproveCost")),exp:nz(g(p3,"DeductSec48.ExpOnTrans"))};
    const b8=g(LT,"SaleofAssetNADtls.SaleofAssetNA");
    if(b8&&(N(b8.FullConsideration)||N(b8.FullValueConsdRecvUnqshr)||N(b8.FullValueConsdOthUnqshr)||N(g(b8,"DeductSec48.AquisitCost")))){const d={};
      (g(b8,"ExemptionOrDednUs54.ExemptionOrDednUs54Dtls")||[]).forEach(e=>d["s"+e.ExemptionSecCode]=nz(e.ExemptionAmount));
      S.cg.b8={unqCons:nz(b8.FullValueConsdRecvUnqshr),unqFmv:nz(b8.FairMrktValueUnqshr),othCons:nz(b8.FullValueConsdOthUnqshr),
        cost:nz(g(b8,"DeductSec48.AquisitCost")),improve:nz(g(b8,"DeductSec48.ImproveCost")),exp:nz(g(b8,"DeductSec48.ExpOnTrans")),ded:d};}
    S.cg.b9=S.cg.b9||{deem:[],other:0,unutFlag:""};
    S.cg.b9.deem=(g(LT,"UnutilizedCg.UnutilizedCgPrvYrDtls")||[]).map(x=>({py:x.PrvYrInWhichAsstTrnsfrd,sec:x.SectionClmd,
      yracq:x.YrInWhichAssetAcq||"",util:nz(x.AmtUtilized),unused:nz(x.AmtUnutilized)}));
    S.cg.b9.other=nz(LT.AmtDeemedLtcg);S.cg.b9.unutFlag=LT.UnutilizedLtcgFlag||"";
    S.cg.b10={r125a:nz(LT.PassThrIncNatureLTCGUs112A12_5Per),r125o:nz(LT.PassThrIncNatureLTCG12_5Per)};
    if(N(g(LT,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares")))
      S.cg.bA={amt:Math.abs(N(g(LT,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares")))};
    /* NR heads */
    const dtaaIn=r=>({amt:nz(r.DTAAamt),itemno:r.ItemNoincl||"",country:r.CountryName||"",
      ccode:r.CountryCodeExcludingIndia||"",article:r.DTAAarticle||"",
      treaty:r.RateAsPerTreaty!=null?r.RateAsPerTreaty:"",trc:r.TaxRescertifiedFlag||"",
      secit:r.SecITAct||"",itact:r.RateAsPerITAct!=null?r.RateAsPerITAct:""});
    if(ST.NRITransacSec48Dtl&&(N(ST.NRITransacSec48Dtl.NRItaxSTTPaid)||N(ST.NRITransacSec48Dtl.NRItaxSTTNotPaid)))
      S.cg.a4={sttPaid:nz(ST.NRITransacSec48Dtl.NRItaxSTTPaid),sttNot:nz(ST.NRITransacSec48Dtl.NRItaxSTTNotPaid)};
    const a5=ST.NRISecur115AD;
    if(a5&&(N(a5.FullConsideration)||N(a5.FullValueConsdRecvUnqshr)||N(a5.FullValueConsdOthUnqshr)||N(g(a5,"DeductSec48.AquisitCost"))))
      S.cg.a5={unqCons:nz(a5.FullValueConsdRecvUnqshr),unqFmv:nz(a5.FairMrktValueUnqshr),othCons:nz(a5.FullValueConsdOthUnqshr),
        cost:nz(g(a5,"DeductSec48.AquisitCost")),improve:nz(g(a5,"DeductSec48.ImproveCost")),
        exp:nz(g(a5,"DeductSec48.ExpOnTrans")),loss94:nz(a5.LossSec94of7Or94of8)};
    S.cg.a9=(g(ST,"NRICgDTAA.NRIDTAADtls")||[]).map(dtaaIn);
    if(LT.NRIProvisoSec48&&N(LT.NRIProvisoSec48.BalanceCG))S.cg.b5={gain:nz(LT.NRIProvisoSec48.BalanceCG)};
    S.cg.b6=(g(LT,"NRIOnSec112and115.NRIOnSec112and115Dtls")||[]).map(r=>({sec:r.SectionCode||"",
      unqCons:nz(r.FullValueConsdRecvUnqshr),unqFmv:nz(r.FairMrktValueUnqshr),othCons:nz(r.FullValueConsdOthUnqshr),
      cost:nz(g(r,"DeductSec48.AquisitCost")),improve:nz(g(r,"DeductSec48.ImproveCost")),exp:nz(g(r,"DeductSec48.ExpOnTrans"))}));
    S.cg.b11=(g(LT,"NRICgDTAA.NRIDTAADtls")||[]).map(dtaaIn);
    /* Part D — DeducClaimInfo detail back into S.cg.dclaim */
    const DI=CGb.DeducClaimInfo;
    if(DI){S.cg.dclaim={us54D:[],us54EC:[],us54G:[],us54GA:[]};
      DCLAIM.forEach(Dd=>{S.cg.dclaim[Dd.ns]=(DI[Dd.key]||[]).map(r=>{
        if(Dd.invest)return {transfer:dmy(r.DateofTransfer),invested:nz(r.AmtInvested),
          invdate:dmy(r.DateofInvestment),amt:nz(r.AmtDeducted)};
        return {transfer:dmy(Dd.acq?r.DateofAcquisition:r.DateofTransfer),cost:nz(r[Dd.cost]),
          purchase:dmy(r.DateofPurchase),deposited:nz(r.AmtDeposited),depdate:dmy(r.DepositDate),
          acno:r.AccountNo||"",ifsc:r.IFSC||"",amt:nz(r.AmtDeducted)};});});
      if(Object.keys(S.cg.dclaim).some(k=>S.cg.dclaim[k].length))read.push("CG deduction detail");}
    read.push("capital gains");
  }
  const b112=I6&&I6.Schedule112A;
  if(b112){S.cg=S.cg||{};S.cg.on=true;
    S.cg.s112a=(b112.Schedule112ADtls||[]).map(x=>({pre18:x.ShareOnOrBefore,isin:x.ISINCode,name:x.ShareUnitName,
      qty:nz(x.NumSharesUnits),price:nz(x.SalePricePerShareUnit),sale6:x.ShareOnOrBefore==="AE"?nz(x.TotSaleValue):"",
      cost:nz(x.AcquisitionCost),fmv18:nz(x.FairMktValuePerShareunit),exp:nz(x.ExpExclCnctTransfer)}));
    read.push("Schedule 112A");}
  const b115=I6&&I6.Schedule115AD;
  if(b115){S.cg=S.cg||{};S.cg.on=true;
    S.cg.s115ad=(b115.Schedule115ADDtls||[]).map(x=>({pre18:x.ShareOnOrBefore,isin:x.ISINCode,name:x.ShareUnitName,
      qty:nz(x.NumSharesUnits),price:nz(x.SalePricePerShareUnit),sale6:x.ShareOnOrBefore==="AE"?nz(x.TotSaleValue):"",
      cost:nz(x.AcquisitionCost),fmv18:nz(x.FairMktValuePerShareunit),exp:nz(x.ExpExclCnctTransfer)}));
    read.push("Schedule 115AD");}
  const vda=I6&&I6.ScheduleVDA;
  if(vda){S.cg=S.cg||{};S.cg.on=true;
    S.cg.vda=(vda.ScheduleVDADtls||[]).map(x=>({buy:dmy(x.DateofAcquisition),sale:dmy(x.DateofTransfer),
      head:x.HeadUndIncTaxed,cost:nz(x.AcquisitionCost),cons:nz(x.ConsidReceived)}));
    read.push("Schedule VDA");}
  return read;
}

/* =====================================================================
   CHECKS — the section's own screen validations (not the department rules)
   ===================================================================== */
function chkCg(){
  const out=[];const G=S.C.cg;if(!G||!G.on)return out;
  const C=S.cg;
  /* 50C — stamp value more than 10% above consideration */
  (C.land||[]).forEach((p,i)=>{const r=p._;if(r&&!r.safe)
    out.push({lvl:"warn",t:"Property "+(i+1)+" · section 50C",
      m:"Stamp value exceeds consideration by more than 10% — the stamp value is adopted as full value.",sec:"cg"});});
  /* mutual exclusion 112A vs 115AD proviso */
  const has112=(C.s112a||[]).some(r=>N((r._||{}).sale)||N(r.cost));
  const has115=(C.s115ad||[]).some(r=>N((r._||{}).sale)||N(r.cost));
  if(has112&&has115)out.push({lvl:"err",t:"Schedule 112A vs 115AD",
    m:"A row in Schedule 112A bars Schedule 115AD(1)(b)(iii) proviso, and vice versa.",sec:"cg"});
  /* 115AD proviso is FII/FPI (non-resident) only */
  if(has115&&!G.nri)out.push({lvl:"err",t:"Schedule 115AD",
    m:"Schedule 115AD(1)(b)(iii) proviso applies only to a non-resident FII/FPI.",sec:"cg"});
  /* VDA: dates not after 31 March of the FY */
  (C.vda||[]).forEach((r,i)=>{const dS=D(r.sale),dA=D(r.buy);
    if((dS&&dS>YREND)||(dA&&dA>YREND))out.push({lvl:"err",t:"Schedule VDA row "+(i+1),
      m:"Date of acquisition/transfer cannot be after 31 March of the financial year.",sec:"cg"});});
  /* consideration nil but section-48 deductions claimed */
  (C.land||[]).forEach((p,i)=>{if(!N(p.cons)&&(N(p.cost)||N(p.exp)||N(p.improve)))
    out.push({lvl:"warn",t:"Property "+(i+1)+" · section 48",
      m:"Where full value of consideration is zero, deductions u/s 48 cannot be claimed.",sec:"cg"});});
  /* buy-back loss needs the dividend offered in Schedule OS (reminder) */
  if(N((G.A.aA||{}).loss)||N((G.B.bA||{}).loss))
    out.push({lvl:"warn",t:"Buy-back capital loss",
      m:"A buy-back capital loss can be claimed only if the corresponding dividend is offered in Schedule OS.",sec:"cg"});
  if(G.C3!==0||G.A.total||G.B.total)
    out.push({lvl:"ok",t:"Capital gains",m:"C3 income chargeable under CAPITAL GAINS = "+RS(G.C3)+".",sec:"cg"});
  return out;
}

reg({id:"cg", t:"Capital gains", ref:"Schedule CG · 112A · 115AD · VDA",
  f:secCg, s:()=>!cgOn()?"None":((S.C.cg&&S.C.cg.C3)?RS(S.C.cg.C3):"Reporting"),
  eng:engCg, exp:expCg, imp:impCg, chk:chkCg, order:14, corder:14});

})();
