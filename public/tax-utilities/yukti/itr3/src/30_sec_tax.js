/* =====================================================================
   ITR-3 · Section "tax" (order 90) — Part B roll-up.
   Books: books/ITR-3/Part_B_TI_TTI.md, AMTC.md, TPSA.md
          + hidden sheets AMT and "Tax Calculated" (read via dump),
          + REGIME.md (regime gating), rules.json.
   Schema blocks exported/imported: PartB-TI, PartB_TTI,
          ScheduleAMT, ScheduleAMTC, ScheduleTPSA.
   This is the Part B roll-up: it reads every income head via
   S.C.<head>.income, aggregates to Gross Total Income, subtracts
   Chapter VI-A (S.C.ded), applies the loss set-off (S.C.loss),
   computes tax on the regime slabs / surcharge / cess / 87A rebate,
   AMT (old regime only), AMTC credit, TPSA and 234A/B/C interest,
   and SETS the footer contract S.C.{gti,ti,tax,int,amt,amtc}.
   Every formula carries its cell ref from the book. Rule 2: numbers
   are ITR-3's own (Tax Calculated / AMT / Part B - TI TTI sheets),
   never ported from ITR-2. Cross-reads are guarded (S.C.x||{}).y||0.
   ===================================================================== */

/* ---- state (my namespace S.tax) ---- */
S.tax = S.tax || {};
if(S.tax.amtc==null) S.tax.amtc={};              /* {AssYr:{gross,setoff}} typed prior-year AMT credit */
if(S.tax.tpsa==null) S.tax.tpsa={rows:[]};        /* TPSA 92CE amount + challan table */
if(!Array.isArray(S.tax.tpsa.rows)) S.tax.tpsa.rows=[];
SEED["tax.tpsa.rows"]=SEED["tax.tpsa.rows"]||{};   /* challan row */

/* the thirteen prior assessment years of the AMTC utilisation table (AMTC.md, rows i–xiii) */
const TAX_AMTC_YRS=["2013-14","2014-15","2015-16","2016-17","2017-18","2018-19","2019-20",
  "2020-21","2021-22","2022-23","2023-24","2024-25","2025-26"];

/* the utility's advance-tax instalment cutoffs (Tax Calculated / IT sheet): 16 Jun · 20 Sep · 15 Dec · 16 Mar; 17–31 Mar is the fifth slot */
const TAX_Q_CUT=[new Date(2025,5,16),new Date(2025,8,20),new Date(2025,11,15),new Date(2026,2,16)];

/* exemption limit (Tax Calculated C33/C34): new regime 400000 (bacValue=1); else age-banded by residential status. NRI never gets the senior band. */
function taxExemptionLimit(){
  if(isNew())return 400000;
  if(S.pi.status==="I"&&S.fs.resStatus!=="NRI"){ if(superSr())return 500000; if(senior())return 300000; }
  return 250000;
}
/* the regime slab bands (Tax Calculated: G25 new; B27 senior, B28 super-senior, B29 normal — old) */
function taxBands(){
  const SLAB_NEW=[[400000,0],[800000,5],[1200000,10],[1600000,15],[2000000,20],[2400000,25],[Infinity,30]]; /* G25 */
  const SLAB_OLD=[[250000,0],[500000,5],[1000000,20],[Infinity,30]];                                        /* B29 */
  const SLAB_SR =[[300000,0],[500000,5],[1000000,20],[Infinity,30]];                                        /* B27 */
  const SLAB_SSR=[[500000,0],[1000000,20],[Infinity,30]];                                                   /* B28 */
  if(isNew())return SLAB_NEW;
  if(S.pi.status==="I"&&S.fs.resStatus!=="NRI")return superSr()?SLAB_SSR:(senior()?SLAB_SR:SLAB_OLD);
  return SLAB_OLD;
}
function taxSlab(inc,bands){let t=0,l=0;for(const b of bands){const u=b[0],r=b[1];if(inc>l)t+=(Math.min(inc,u)-l)*r/100;l=u;if(inc<=u)break;}return R(t);}
/* tax + surcharge at a given total income — used for the marginal-relief cutoff comparison (Part_B_TI_TTI.md L76 surcharge; 25% new / 37% old cap) */
function taxPlusSurAt(ti,splTax,cgDivTax,bbeTax,normalInc){
  const normalTax=taxSlab(normalInc,taxBands());const taxOn=normalTax+splTax;
  const scr= ti>50000000?(isNew()?25:37): ti>20000000?25: ti>10000000?15: ti>5000000?10:0;
  const capRate=Math.min(scr,15);                          /* CG/dividend surcharge held to 15% */
  const other=taxOn-cgDivTax-bbeTax;
  return {taxOn,sur:R(other*scr/100+cgDivTax*capRate/100+bbeTax*0.25),scr,capRate};
}

/* ---- the engine: rolls up Part B and sets the whole S.C tax contract ---- */
function engTax(){
  /* ===== read the income heads via the S.C.<head>.income convention (guarded) ===== */
  const SAL=(S.C.sal||{}), HP=(S.C.hp||{}), BP=(S.C.bp||{}), CG=(S.C.cg||{}), OS=(S.C.os||{});
  const salaries=R(SAL.income||0);                                       /* Part B-TI 1 */
  const hpInc=R(HP.income||0);                                           /* signed; item 2 = MAX(0,·) (L5) */

  /* PGBP (item 3): 3i non-spec (A37), 3ii speculative, 3iii specified, 3iv special-rate 115BBF/G/H; each MAX(0,·) (J7–J10) */
  const b3i=Math.max(0, BP.noSpec!=null?R(BP.noSpec):R(BP.income||0));
  const b3ii=Math.max(0,R(BP.spec||0));
  const b3iii=Math.max(0,R(BP.specified||0));
  const b3iv=Math.max(0,R(BP.spl||0));
  const b3v=Math.max(0,b3i+b3ii+b3iii+b3iv);                             /* L11: nil if the sum is a loss */

  /* Capital gains (item 4): after set-off components, floored (J15–J25); 4d = VDA @30% 115BBH (L27) */
  const cga=CG.after||{}, hasCG=CG.after!=null||CG.shortTerm!=null||CG.longTerm!=null;
  const st20=Math.max(0,R(cga.st20||0)), st30=Math.max(0,R(cga.st30||0)), stApp=Math.max(0,R(cga.stApp||0)), stDTAA=Math.max(0,R(cga.stDTAA||0));
  const lt125=Math.max(0,R(cga.lt125||0)), ltDTAA=Math.max(0,R(cga.ltDTAA||0));
  let totST=CG.shortTerm!=null?Math.max(0,R(CG.shortTerm)):st20+st30+stApp+stDTAA;
  let totLT=CG.longTerm!=null?Math.max(0,R(CG.longTerm)):lt125+ltDTAA;
  let cgC2=CG.C2!=null?R(CG.C2):R((CG.vda||{}).cg||0);                    /* 4d 115BBH */
  let cg4c=Math.max(0,totST+totLT);                                      /* L26 */
  if(!hasCG && CG.income!=null){ cg4c=Math.max(0,R(CG.income)); totST=cg4c; totLT=0; }
  const cg4e=Math.max(0,cg4c+cgC2);                                      /* L28 */

  /* Other sources (item 5): 5a normal (J30), 5b special (J31), 5c race horses (J32); 5d = MAX(0,Σ) (L33) */
  const os5a=Math.max(0,R(OS.six!=null?OS.six:(OS.normal!=null?OS.normal:(OS.income||0))));
  const os5b=R(OS.special||0);
  const os5c=Math.max(0,R(OS.horse?(OS.horse.bal!=null?OS.horse.bal:OS.horse):(OS.raceHorse||0)));
  const os5d=Math.max(0,os5a+os5b+os5c);

  /* item 6 — total of head-wise income (1 + 2 + 3v + 4e + 5d) (L34) */
  const item2=Math.max(0,hpInc);
  const totalTI=R(salaries+item2+b3v+cg4e+os5d);

  /* ===== loss set-off (S.C.loss, guarded): CYLA current-year (item 7), BFLA brought-forward (item 9) ===== */
  const L=(S.C.loss||{});
  const cyl=R(L.cyla!=null?L.cyla:(L.cySetoff!=null?L.cySetoff:((L.totHPset||0)+(L.totBusset||0)+(L.totOSset||0))));  /* L35 */
  const balAfterCYLA=Math.max(0,totalTI-cyl);                            /* item 8 (L36) */
  const bfl=R(L.bfla!=null?L.bfla:(L.bfSetoff!=null?L.bfSetoff:((L.totBFset||0)+(L.totUnabsDep||0)+(L.tot35_4||0))));  /* L37 */
  const gti=Math.max(0,balAfterCYLA-bfl);                                /* item 10 Gross Total Income (L38) */

  /* item 11 — special-rate income under 111A/112/112A etc. included in GTI (S.C.si.totInc) (L39) */
  const SI=(S.C.si||{});
  const splInc=R(SI.totInc||0);

  /* ===== Chapter VI-A (S.C.ded, guarded) — Part B/CA/D and Part C, capped at (GTI − 11) (J41/L43) ===== */
  const DED=(S.C.ded||{});
  /* item 12a = Part-B + Part CA and D of Schedule VI-A (Part_B_TI J41); 12b = Part-C */
  const viaPartB=Math.max(0,R((DED.partB!=null?DED.partB:(DED.PartBchapterVIA||0))+(DED.partCAandD||0)));
  const viaPartC=Math.max(0,R(DED.partC!=null?DED.partC:(DED.PartCchapterVIA||0)));
  const viaCap=Math.max(0,gti-splInc);
  const viaTot=Math.max(0,Math.min(viaPartB+viaPartC,viaCap));           /* item 12c (L43) */

  /* item 13 — deduction u/s 10AA (S.C.ded.us10AA), capped at (GTI − special − VI-A) (L44) */
  const us10AA=Math.max(0,Math.min(R(DED.us10AA!=null?DED.us10AA:(DED.ded10AA||0)),Math.max(0,gti-splInc-viaTot)));

  /* item 14 — total income = round-to-ten of MAX(0, GTI − 12c − 13) (L45) */
  const ti=Math.max(0,Math.round((gti-viaTot-us10AA)/10)*10);

  /* item 16 — net agricultural income for rate, only if > 5000 (S.C.ei / eiAgri) (L47) */
  const agriRaw=R((S.C.ei2||{}).netAgri!=null?(S.C.ei2||{}).netAgri:(S.C.eiAgri||0));
  const agri=agriRaw>5000?agriRaw:0;

  /* ===== tax on total income (Part B-TTI 2), from the regime slabs ===== */
  const bands=taxBands();
  const splIncInTI=Math.min(splInc,ti);                                  /* item 15 */
  const normalInc=Math.max(0,ti-splIncInTI);
  const exempt=taxExemptionLimit();
  const aggFlag=normalInc>exempt&&agri>5000;                             /* aggregate income applies (L48) */
  const normalTax=taxSlab(aggFlag?normalInc+agri:normalInc,bands);       /* 2a */
  const agriRebate=aggFlag?taxSlab(exempt+agri,bands):0;                 /* 2c */
  const splTax=R(SI.totTax||0);                                          /* 2b */
  const taxOn=Math.max(0,normalTax+splTax-agriRebate);                   /* 2d (L61) */

  /* 2e — rebate under section 87A (Tax Calculated: new 60000 @ TI≤12L with marginal relief; old 12500 @ TI≤5L, not against 112A/115AD) */
  let rebate=0,marginal=0;
  if(S.pi.status==="I"&&S.fs.resStatus!=="NRI"){
    if(isNew()){
      if(ti<=1200000)rebate=Math.min(taxOn,60000);
      else{const excess=ti-1200000;if(normalTax>excess){marginal=normalTax-excess;rebate=Math.min(taxOn,marginal);}}
    } else if(ti<=500000){rebate=Math.min(taxOn-R(SI.tax112A||0)-R(SI.tax115AD||0),12500);}
  }
  rebate=Math.max(0,R(rebate));
  const after=Math.max(0,taxOn-rebate);                                  /* 2f (L66) */

  /* 2g — surcharge: 25% on 115BBE (never relieved) + tiered on the rest, 15% cap on CG/dividend, marginal relief at four thresholds (L76) */
  const bbeTax=R(SI.bbeTax||0), cgDivTax=R(SI.cgDivTax||0);
  const here=taxPlusSurAt(ti,splTax,cgDivTax,bbeTax,normalInc);
  let surII=R((after-bbeTax-cgDivTax)*here.scr/100+cgDivTax*here.capRate/100), surI=R(bbeTax*0.25), mr=0;
  [5000000,10000000,20000000,50000000].forEach(th=>{ if(ti>th){
    const cut=taxPlusSurAt(th,Math.min(splTax,th),Math.min(cgDivTax,th),bbeTax,Math.max(0,th-splInc));
    const relief=Math.max(0,(after+surII)-(cut.taxOn+cut.sur)-(ti-th));
    if(relief>mr)mr=relief;
  }});
  surII=Math.max(0,surII-mr);
  const sur=surI+surII;                                                  /* 2gBiv */
  const cess=R((after+sur)*0.04);                                        /* 2h */
  const grossTaxLiability=R(after+sur+cess);                             /* 2i (L78) */

  /* ===== AMT (Schedule AMT) — old regime only; 18.5% of adjusted TI if > 20 lakh (REGIME.md A830/A835) ===== */
  /* add-backs (AMT sheet 2a Part C VI-A, 2b 10AA, 2c 35AD); adjusted TI = 14 of Part B-TI + 2d */
  const amtPartC=viaPartC, amt10AA=us10AA, amt35AD=Math.max(0,R(BP.ded35AD!=null?BP.ded35AD:(DED.ded35AD||0)));
  const amtAdj=Math.max(0,ti+amtPartC+amt10AA+amt35AD);                  /* item 3 (J10) */
  const amtIFSC=Math.max(0,Math.min(R(S.tax.amtIFSC||0),amtAdj));        /* 3a IFSC units @9% */
  const amtOther=Math.max(0,amtAdj-amtIFSC);                            /* 3b other units @18.5% */
  const amtApplies=!isNew() && (amtPartC+amt10AA+amt35AD)>0 && amtAdj>2000000; /* bacValue=1 → 0 in new regime */
  const amt115JC=amtApplies?R(amtIFSC*0.09+amtOther*0.185):0;            /* item 4 (J13) */
  const amtScr= amtAdj>50000000?37: amtAdj>20000000?25: amtAdj>10000000?15: amtAdj>5000000?10:0;
  const amtSur=amtApplies?R(amt115JC*amtScr/100):0;                      /* TTI 1b */
  const amtCess=amtApplies?R((amt115JC+amtSur)*0.04):0;                  /* TTI 1c */
  const amtTotal=amtApplies?R(amt115JC+amtSur+amtCess):0;               /* TTI 1d TotalTax_DI */

  /* ===== Part B-TTI item 3 — gross tax payable = higher of 1d and 2i (L79) ===== */
  const grossTaxPayable=Math.max(grossTaxLiability,amtTotal);

  /* ===== AMTC (Schedule AMTC) — credit under 115JD, utilisation oldest-year first ===== */
  const amtcTax115JC=amtTotal;                                          /* AMTC 1 = 1d of B-TTI (L4) */
  const amtcTaxOther=grossTaxLiability;                                 /* AMTC 2 = 2i of B-TTI (L5) */
  const amtcAvail=Math.max(0,amtcTaxOther-amtcTax115JC);               /* AMTC 3 (L6) */
  const amtcRows=TAX_AMTC_YRS.map(y=>{const r=(S.tax.amtc||{})[y]||{};const g=R(N(r.gross)),so=R(N(r.setoff));
    return {y,gross:g,setoff:so,bf:Math.max(0,g-so),used:0,cf:0};});    /* B3 = MAX(B1−B2,0) */
  if(!isNew()){ let rem=amtcAvail; amtcRows.forEach(r=>{const u=Math.min(rem,r.bf);r.used=u;rem-=u;r.cf=r.bf-u;}); }
  else amtcRows.forEach(r=>{r.used=0;r.cf=r.bf;});                       /* REGIME.md A: col C/D must be 0 in the new regime */
  const amtcCurr=(!isNew())?Math.max(0,amtcTax115JC-amtcTaxOther):0;    /* xiv current-AY new credit (G22) */
  const amtcUsed=R(amtcRows.reduce((a,r)=>a+r.used,0));                 /* item 5 col C (K24) */
  const amtcCF=R(amtcRows.reduce((a,r)=>a+r.cf,0)+amtcCurr);           /* item 6 col D (K25) */

  /* ===== Part B-TTI 4–7: credit, relief, net tax liability ===== */
  const credit=(grossTaxLiability>amtTotal)?amtcUsed:0;                 /* item 4 (L83) */
  const esopDef=R(N((S.C.esop||{}).deferNow||(S.esop||{}).deferNow||0));/* 3b tax deferred this year */
  const esopDue=R((S.C.esopDue!=null?S.C.esopDue:(S.C.esop||{}).due)||0);/* 3c ESOP deferred earlier, now payable */
  const taxInc17=Math.max(0,grossTaxPayable-esopDef);                   /* 3a (L80) */
  const afterCredit=Math.max(0,taxInc17+esopDue-credit);               /* item 5 (L84) */
  const rel89=Math.max(0,R(N(S.tax.s89)));                              /* 6a */
  const rel90=R((S.C.fa||{}).dtaa||0);   /* 6b Section 90/90A (2 of TR) — from the FA engine (ScheduleTR feed) */
  const rel91=R((S.C.fa||{}).notDtaa||0);/* 6c Section 91 (3 of TR) — from the FA engine (ScheduleTR feed) */
  const relief=R(rel89+rel90+rel91);                                    /* 6e (L90) */
  const net=Math.max(0,R(afterCredit-relief));                          /* item 7 net tax liability (L91) */

  /* ===== taxes paid (S.C.paid, guarded) ===== */
  const P=(S.C.paid||{});
  const adv=R(P.adv||0), tds=R(P.tds||0), tcs=R(P.tcs||0), sat=R(P.sat||0);
  const paidTot=R(P.paid!=null?P.paid:(adv+tds+tcs+sat));

  /* ===== interest & fee (Tax Calculated sheet) ===== */
  const dueDate=D(dmy(S.fs.duedate))||D(S.fs.dueExt)||DUE;   /* the user's per-case 139(1) due date (audit=31-Oct etc.); dueExt kept as an optional override */
  const filed=D(S.fs.filed);
  const endA=([17,18].indexOf(+S.fs.sec)>=0&&D(S.fs.origdate))?D(S.fs.origdate):filed;   /* B12: revised/defective → original date */
  const late=!!(endA&&endA>dueDate);
  /* challans live canonically in S.paid.it (restored on import); S.it is only a legacy mirror */
  const IT=Array.isArray((S.paid||{}).it)?S.paid.it:(Array.isArray(S.it)?S.it:[]);
  const isSAT=c=>{const d=D(c.dt);return d?d>YREND:false;};
  const satIn=(a,b)=>IT.filter(c=>isSAT(c)&&D(c.dt)&&D(c.dt)>=a&&D(c.dt)<=b).reduce((s,c)=>s+N(c.amt),0);

  /* 234A: net less advance/TDS/TCS/SAT-by-due, 1%/month, principal floored to 100 (B3/B4/B15) */
  const matchedSAT=satIn(new Date(2026,3,1),dueDate);
  let p234a=Math.max(0,net-adv-tds-tcs-matchedSAT); if(p234a>100)p234a=Math.floor(p234a/100)*100;
  const m234a=late?MPART(dueDate,endA):0;
  const i234a=R(p234a*0.01*m234a);

  /* 234F late fee (≤ 5000; 1000 if TI ≤ 5L) and 234-I revised-return fee */
  const f234f=late?(ti<=500000?1000:5000):0;
  const f234i=(+S.fs.sec===17)?Math.min(99999,R(N(S.tax.f234i))):0;

  /* 234C: quarterly shortfall (QDEF 15/45/75/100, safe-harbour 12/36 for Q1/Q2). Special income is treated as accruing from Q1 unless a quarter-wise breakdown is published. */
  const seniorRes=S.fs.resStatus!=="NRI"&&S.pi.status==="I"&&senior();
  const amtCase=amtApplies&&amtTotal>grossTaxLiability;
  const gate234c=net>=10000&&!seniorRes;
  const upto=d=>IT.filter(c=>!isSAT(c)&&D(c.dt)&&D(c.dt)<=d).reduce((a,c)=>a+N(c.amt),0);
  const paidIn5=IT.filter(c=>!isSAT(c)&&D(c.dt)&&D(c.dt)>TAX_Q_CUT[3]&&D(c.dt)<=YREND).reduce((a,c)=>a+N(c.amt),0);
  /* tax cumulative to each instalment — the whole year's liability accrues from Q1 in the safe default */
  const taxCum=k=>amtCase?amtTotal:net;
  const QDEF=[[0.15,0.12,3],[0.45,0.36,3],[0.75,null,3],[1,null,1]];
  const qs=QDEF.map((q,k)=>{const pc=q[0],safe=q[1],mo=q[2];
    const base=Math.max(0,taxCum(k)-tds-tcs-relief);const need=R(base*pc),got=upto(TAX_Q_CUT[k]);
    let sh=(safe!==null&&got>=Math.floor(base*safe/100)*100)?0:Math.floor(Math.max(0,need-got)/100)*100;
    if(!gate234c)sh=0;
    return {base:R(base),need,got:R(got),short:sh,mo,int:R(sh*0.01*mo)};});
  const q5base=amtCase?0:Math.max(0,taxCum(4)-taxCum(3));                /* the fifth slot: income arising 16–31 Mar */
  const q5short=gate234c?Math.floor(Math.max(0,q5base-paidIn5)/100)*100:0;
  qs.push({base:R(q5base),need:R(q5base),got:R(paidIn5),short:q5short,mo:1,int:R(q5short*0.01)});
  const i234c=R(qs.reduce((a,q)=>a+q.int,0));

  /* 234B: monthly cycle Apr→filing; a self-assessment challan pays accrued interest first then principal (B82/B83) */
  const assessed=net-tds-tcs; let i234b=0; const cycles=[];
  if(assessed>=10000&&net>=10000&&adv<0.9*assessed){
    let principal=Math.floor(Math.max(0,net-adv-tds-tcs)/100)*100;
    let balInt=f234f+i234a+i234c;
    const end=filed||new Date();const months=Math.min(24,MPART(new Date(2026,3,1),end)||1);
    for(let m=0;m<months;m++){const mStart=new Date(2026,3+m,1),mEnd=new Date(2026,4+m,0);
      const intr=R(principal*0.01);i234b+=intr;balInt+=intr;
      const s=satIn(mStart,mEnd);const toInt=Math.min(s,balInt);const toPrin=Math.max(0,Math.min(s-toInt,principal));
      cycles.push({m:m+1,principal:R(principal),intr,sat:R(s),toInt:R(toInt),toPrin:R(toPrin)});
      balInt-=toInt;principal=Math.max(0,principal-toPrin);}
  }
  const intTotal=R(i234a+i234b+i234c+f234f+f234i);                      /* 8e (L98) */
  const aggregate=R(net+intTotal);                                     /* item 9 (L99) */
  const bal=aggregate-paidTot;
  const balance=R(Math.round(Math.max(0,bal)/10)*10);                  /* item 11 (L106) */
  const refund=R(Math.round(Math.max(0,-bal)/10)*10);                  /* item 12 (L107) */

  /* ===== TPSA (Schedule TPSA) — tax on secondary adjustments u/s 92CE(2A); gated on the Part A-OI 92CE flag ===== */
  const tpsaOn=st0(S.tax.tpsaOn)==="Yes";
  const tpsaAmt=tpsaOn?Math.max(0,R(N(S.tax.tpsa.amt))):0;              /* item 1 (typed) */
  const tpsa18=R(tpsaAmt*0.18);                                        /* 2a (P8) */
  const tpsa12=R(tpsa18*0.12);                                         /* 2b (P9) */
  const tpsaCess=R((tpsa18+tpsa12)*0.04);                              /* 2c (P10) */
  const tpsaTotal=R(tpsa18+tpsa12+tpsaCess);                           /* 2d (P11) */
  const tpsaDeposited=R((S.tax.tpsa.rows||[]).reduce((a,r)=>a+N(r.amt),0)); /* H19 */
  const tpsaPaid=tpsaDeposited;                                        /* item 3 = table total (P12) */
  const tpsaNet=Math.max(0,R(tpsaTotal-tpsaPaid));                     /* item 4 (P13) */

  /* ===== publish the S.C contract ===== */
  S.C.gti=R(gti);
  S.C.ti=R(ti);
  S.C.tax={regime:isNew()?"New":"Old",
    salaries,item2,b3i,b3ii,b3iii,b3iv,b3v,st20,st30,stApp,stDTAA,totST,lt125,ltDTAA,totLT,cgC2,cg4c,cg4e,
    os5a,os5b,os5c,os5d,totalTI:R(totalTI),cyl,balAfterCYLA:R(balAfterCYLA),bfl,splInc,
    viaPartB,viaPartC,viaTot,us10AA,splIncInTI:R(splIncInTI),agri:R(agri),
    bands,normalInc:R(normalInc),normalTax,aggFlag,agriRebate:R(agriRebate),splTax,taxOn:R(taxOn),
    rebate,marginal:R(marginal),after:R(after),scr:here.scr,scrCap:here.capRate,surI,surII:R(surII),mr:R(mr),
    sur:R(sur),cess,gross:R(grossTaxLiability),grossPayable:R(grossTaxPayable),age:age()};
  S.C.amt={applies:amtApplies,partC:amtPartC,d10AA:amt10AA,d35AD:amt35AD,adjusted:R(amtAdj),
    ifsc:R(amtIFSC),other:R(amtOther),amt:R(amt115JC),sur:R(amtSur),cess:R(amtCess),total:R(amtTotal)};
  S.C.amtc={tax115JC:amtcTax115JC,taxOther:amtcTaxOther,avail:R(amtcAvail),rows:amtcRows,curr:R(amtcCurr),
    used:amtcUsed,cfTotal:amtcCF,gross:R(amtcRows.reduce((a,r)=>a+r.gross,0)),setoff:R(amtcRows.reduce((a,r)=>a+r.setoff,0)),
    bf:R(amtcRows.reduce((a,r)=>a+r.bf,0)),credit:R(credit)};
  S.C.tpsa={on:tpsaOn,amt:tpsaAmt,t18:tpsa18,t12:tpsa12,cess:tpsaCess,total:tpsaTotal,paid:tpsaPaid,net:tpsaNet,deposited:tpsaDeposited};
  S.C.int={late,filed,endA,dueDate,grossPayable:R(grossTaxPayable),esopDef,esopDue,credit:R(credit),
    taxInc17:R(taxInc17),afterCredit:R(afterCredit),rel89,rel90,rel91,relief,net,
    matchedSAT:R(matchedSAT),p234a:R(p234a),m234a,i234a,assessed:R(assessed),i234b:R(i234b),cycles,
    qs,i234c,f234f,f234i:R(f234i),amtCase,total:intTotal,aggregate,
    adv,tds,tcs,sat,paid:paidTot,balance,refund};
}

/* ---- renderer ---- */
function secTax(){
  const T=S.C.tax||{},I=S.C.int||{},AM=S.C.amt||{},AC=S.C.amtc||{},TP=S.C.tpsa||{};
  const r=(n,l,v,o)=>row(l,cell(v),Object.assign({ref:n},o||{}));
  let h="";

  /* ===== Part B-TI ===== */
  h+=note("Part B is the roll-up. Every white figure here is picked up from another schedule — only the reliefs, dates and the AMT-credit / secondary-adjustment tables below are keyed.");
  h+=sub("Part B-TI — Computation of total income");
  h+=r("1","Salaries — 6 of Schedule S",T.salaries||0);
  h+=r("2","Income from house property — 3 of Schedule HP (nil if loss)",T.item2||0);
  h+=sub("3 · Profits and gains from business or profession");
  h+=r("3i","Business other than speculative and specified — A37 of Schedule BP",T.b3i||0,{ind:1});
  h+=r("3ii","Speculative business — 3(ii) of Table E of BP (nil if loss)",T.b3ii||0,{ind:1});
  h+=r("3iii","Specified business — 3(iii) of Table E of BP (nil if loss)",T.b3iii||0,{ind:1});
  h+=r("3iv","Income at special rates — 3e,3f,3g of Schedule BP",T.b3iv||0,{ind:1});
  h+=r("3v","Total (3i + 3ii + 3iii + 3iv) — nil if loss",T.b3v||0,{cls:"tot"});
  h+=sub("4 · Capital gains");
  h+=r("4a(i)","Short term at 20% — 8ii of item E of CG",T.st20||0,{ind:1});
  h+=r("4a(ii)","Short term at 30% — 8iii",T.st30||0,{ind:1});
  h+=r("4a(iii)","Short term at applicable rate — 8iv",T.stApp||0,{ind:1});
  h+=r("4a(iv)","STCG at DTAA rates — 8v",T.stDTAA||0,{ind:1});
  h+=r("4a(v)","Total short term",T.totST||0,{cls:"tot"});
  h+=r("4b(i)","Long term at 12.5% — 8vi",T.lt125||0,{ind:1});
  h+=r("4b(ii)","LTCG at DTAA rates — 8vii",T.ltDTAA||0,{ind:1});
  h+=r("4b(iii)","Total long term (nil if loss)",T.totLT||0,{cls:"tot"});
  h+=r("4c","Sum of short-term and long-term (4av + 4biii, nil if loss)",T.cg4c||0);
  h+=r("4d","Capital gains at 30% u/s 115BBH — C2 of Schedule CG",T.cgC2||0);
  h+=r("4e","Total capital gains (4c + 4d)",T.cg4e||0,{cls:"tot"});
  h+=sub("5 · Income from other sources");
  h+=r("5a","Net income at normal rates — 6 of Schedule OS (nil if loss)",T.os5a||0,{ind:1});
  h+=r("5b","Income at special rate — 2 of Schedule OS",T.os5b||0,{ind:1});
  h+=r("5c","Owning & maintaining race horses — 8e of OS (nil if loss)",T.os5c||0,{ind:1});
  h+=r("5d","Total (5a + 5b + 5c)",T.os5d||0,{cls:"tot"});
  h+=r("6","Total of head-wise income (1 + 2 + 3v + 4e + 5d)",T.totalTI||0,{cls:"tot"});
  h+=r("7","Losses of the current year set off against 6 — Schedule CYLA",T.cyl||0);
  h+=r("8","Balance after set-off of current-year losses (6 − 7)",T.balAfterCYLA||0);
  h+=r("9","Brought-forward losses set off against 8 — Schedule BFLA",T.bfl||0);
  h+=r("10","Gross total income (8 − 9)",S.C.gti||0,{cls:"grand"});
  h+=r("11","Income at special rate under 111A/112/112A etc. included in 10",T.splInc||0);
  h+=r("12a","Part-B, CA and D of Chapter VI-A",T.viaPartB||0,{ind:1});
  h+=r("12b","Part-C of Chapter VI-A",T.viaPartC||0,{ind:1});
  h+=r("12c","Total Chapter VI-A — limited to (10 − 11)",T.viaTot||0,{cls:"tot"});
  h+=r("13","Deduction u/s 10AA — c of Schedule 10AA",T.us10AA||0);
  h+=r("14","Total income (10 − 12c − 13)",S.C.ti||0,{cls:"grand",hint:"rounded to the nearest ten"});
  h+=r("15","Income in 14 at special rates — total of (i) of Schedule SI",T.splIncInTI||0);
  h+=r("16","Net agricultural income for rate purposes — 2v of Schedule EI",T.agri||0,{hint:"counted only if above ₹5,000"});
  h+=r("17","Aggregate income (14 − 15 + 16)",T.aggFlag?((S.C.ti||0)-(T.splIncInTI||0)+(T.agri||0)):0);
  h+=r("18","Losses of the current year carried forward — row xix of Schedule CFL",R(((S.C.loss||{}).cf||{}).total||(S.C.loss||{}).cfTotal||0));
  h+=r("19","Deemed income under section 115JC — 3 of Schedule AMT",AM.applies?AM.adjusted:0);

  /* ===== Part B-TTI ===== */
  h+=sub("Part B-TTI — Computation of tax liability on total income");
  h+=sub("1 · Tax payable on deemed total income (Schedule AMT)");
  if(isNew())h+=note("Section 115JC / AMT does not arise under the new tax regime (Schedule AMT is blank — section 115BAC).");
  else if(AM.applies){
    h+=r("1a","Tax under 115JC — 4 of Schedule AMT (18.5%, 9% for IFSC units)",AM.amt,{ind:1});
    h+=r("1b","Surcharge on 1a (if applicable)",AM.sur,{ind:1});
    h+=r("1c","Health & education cess at 4% on (1a + 1b)",AM.cess,{ind:1});
    h+=r("1d","Total tax on deemed total income (1a + 1b + 1c)",AM.total,{cls:"tot"});
  } else h+=note("Section 115JC does not arise — "+(AM.adjusted<=2000000?"adjusted total income is within ₹20 lakh":"no Part-C VI-A / 10AA / 35AD add-back is claimed")+".");
  h+=sub("2 · Tax payable on total income");
  h+=r("2a","Tax at normal rates on 17 of Part B-TI",T.normalTax||0,{ind:1});
  /* the slab walk */
  h+='<div class="full"><table class="gt" style="min-width:600px"><thead><tr><th class="l">Slab</th><th style="width:70px">Rate</th><th style="width:150px">Income in it</th><th style="width:150px">Tax</th></tr></thead><tbody>';
  {let last=0;const base=T.aggFlag?(T.normalInc||0)+(T.agri||0):(T.normalInc||0);
   (T.bands||taxBands()).forEach(b=>{const u=b[0],rt=b[1];const inS=Math.max(0,Math.min(base,u)-last);
     if(inS||rt===0)h+='<tr><td class="l">'+esc(u===Infinity?"Above "+RS(last):(last===0?"Up to "+RS(u):RS(last+1)+" to "+RS(u)))+'</td><td class="num" style="color:var(--ink-3)">'+rt+'%</td><td class="num">'+cell(inS)+'</td><td class="num">'+cell(inS*rt/100)+'</td></tr>';
     last=u;});}
  h+='</tbody></table></div>';
  h+=r("2b","Tax at special rates — total of (ii) of Schedule SI",T.splTax||0,{ind:1});
  if(T.aggFlag)h+=r("2c","Rebate on agricultural income",-(T.agriRebate||0),{ind:1});
  h+=r("2d","Tax payable on total income (2a + 2b − 2c)",T.taxOn||0,{cls:"tot"});
  h+=r("2e","Rebate under section 87A",-(T.rebate||0),{hint:T.marginal?"marginal relief — tax held to the income above ₹12,00,000":(isNew()?"up to ₹60,000 where total income is within ₹12,00,000":"₹12,500 where total income is within ₹5,00,000")});
  h+=r("2f","Tax payable after rebate (2d − 2e)",T.after||0,{cls:"tot"});
  h+=sub("2g · Surcharge");
  h+=r("2gA(i)","Before marginal relief — 25% of tax under 115BBE (16(ii) of SI)",T.surI||0,{ind:1});
  h+=r("2gA(ii)","Before marginal relief — at "+(T.scr||0)+"% on the rest, "+(T.scrCap||0)+"% on CG/dividend",R((T.surII||0)+(T.mr||0)),{ind:1});
  h+=r("2gB(i)","After marginal relief — 25% of 17(ii) of SI",T.surI||0,{ind:1});
  h+=r("2gB(ii)","After marginal relief — 10%/15% as applicable",T.surII||0,{ind:1});
  if(T.mr)h+=r("—","Marginal relief",-(T.mr||0),{ind:1});
  h+=r("2gBiv","Total surcharge",T.sur||0,{cls:"tot"});
  h+=r("2h","Health & education cess at 4% on (2f + 2giv)",T.cess||0);
  h+=r("2i","Gross tax liability (2f + 2giv + 2h)",T.gross||0,{cls:"tot"});
  h+=r("3","Gross tax payable — higher of 1d and 2i",I.grossPayable||0,{cls:"tot"});
  h+=r("3a","Tax on income without the 17(2)(vi) ESOP perquisite",I.taxInc17||0,{ind:1});
  h+=r("3b","Tax deferred relatable to the 17(2)(vi) perquisite",I.esopDef||0,{ind:1});
  h+=r("3c","Tax deferred from earlier years, payable now — col 7 of Schedule ESOP",I.esopDue||0,{ind:1});
  h+=r("4","Credit under 115JD of tax paid in earlier years (only if 2i > 1d)",-(I.credit||0));
  h+=r("5","Tax payable after credit (3a + 3c − 4)",I.afterCredit||0,{cls:"tot"});
  h+=sub("6 · Tax relief");
  h+=row("6a · Section 89 (submit Form 10E)",inp("tax.s89",{n:1}),{ref:"6a",ind:1});
  if(N(S.tax.s89))h+=row("Acknowledgement number of Form 10E",inp("tax.e10ack",{max:15}),{req:1,ind:1});
  h+=r("6b","Section 90 / 90A — 2 of Schedule TR",I.rel90||0,{ind:1});
  h+=r("6c","Section 91 — 3 of Schedule TR",I.rel91||0,{ind:1});
  h+=r("6e","Total (6a + 6b + 6c)",I.relief||0,{cls:"tot"});
  h+=r("7","Net tax liability (5 − 6e) — nil if negative",I.net||0,{cls:"grand"});
  h+=sub("8 · Interest and fee payable");
  h+=row("Date of filing the return",dte("fs.filed"),{req:1,hint:"due "+DISP(I.dueDate||DUE)});
  h+=r("8a","Interest for default in furnishing the return — 234A",I.i234a||0,{ind:1,hint:I.m234a?I.m234a+" month"+(I.m234a>1?"s":"")+" on "+RS(I.p234a||0):""});
  h+=r("8b","Interest for default in payment of advance tax — 234B",I.i234b||0,{ind:1,hint:(I.cycles||[]).length?(I.cycles.length+" monthly cycles"):""});
  h+=r("8c","Interest for deferment of advance tax — 234C",I.i234c||0,{ind:1,hint:I.amtCase?"on the alternate minimum tax":""});
  h+=r("8d","Fee for default in furnishing the return — 234F",I.f234f||0,{ind:1});
  h+=row("8da · Fee for furnishing a revised return — 234-I",(+S.fs.sec===17)?inp("tax.f234i",{n:1}):cell(0),{ref:"8da",ind:1});
  h+=r("8e","Total interest and fee (8a+8b+8c+8d+8da)",I.total||0,{cls:"tot"});
  h+=r("9","Aggregate liability (7 + 8e)",I.aggregate||0,{cls:"grand"});
  h+=sub("10 · Taxes paid");
  h+=r("10a","Advance tax",I.adv||0,{ind:1});
  h+=r("10b","TDS",I.tds||0,{ind:1});
  h+=r("10c","TCS",I.tcs||0,{ind:1});
  h+=r("10d","Self-assessment tax",I.sat||0,{ind:1});
  h+=r("10e","Total taxes paid (10a+10b+10c+10d)",I.paid||0,{cls:"tot"});
  h+=r("11","Amount payable — if 9 exceeds 10e, rounded to ten",I.balance||0,{cls:I.balance?"grand":"tot"});
  h+=r("12","Refund — if 10e exceeds 9, rounded to ten",I.refund||0,{cls:I.refund?"grand":"tot"});
  h+=note("Bank-account details for the refund and the verification block are entered under <b>Bank and verification</b>.");

  /* ===== Schedule AMTC card ===== */
  h+=card("amtc","Schedule AMTC — Computation of tax credit under section 115JD",(AC.used||AC.curr?RS((AC.used||0)+(AC.curr||0)):""),
    r("1","Tax under 115JC in A.Y. 2026-27 — 1d of Part B-TTI",AC.tax115JC||0)+
    r("2","Tax under other provisions in A.Y. 2026-27 — 2i of Part B-TTI",AC.taxOther||0)+
    r("3","Amount of tax against which credit is available (2 − 1 if 2 > 1)",AC.avail||0,{cls:"tot"})+
    '<div class="full"><table class="gt" style="min-width:900px"><thead><tr><th class="l" style="width:90px">Assessment year</th><th style="width:120px">Gross (B1)</th><th style="width:150px">Set off in earlier years (B2)</th><th style="width:130px">Balance b/f (B3)</th><th style="width:130px">Utilised (C)</th><th style="width:130px">Carried fwd (D)</th></tr></thead><tbody>'+
    (AC.rows||[]).map(x=>'<tr><td class="l">'+x.y+'</td><td>'+inp("tax.amtc."+x.y+".gross",{n:1})+'</td><td>'+inp("tax.amtc."+x.y+".setoff",{n:1})+'</td><td class="num">'+cell(x.bf)+'</td><td class="num">'+cell(x.used)+'</td><td class="num">'+cell(x.cf)+'</td></tr>').join("")+
    '<tr><td class="l">2026-27 (current)</td><td class="num">'+cell(AC.curr||0)+'</td><td></td><td></td><td></td><td class="num">'+cell(AC.curr||0)+'</td></tr>'+
    '</tbody><tfoot><tr><td class="l">Total</td><td>'+F(AC.gross||0)+'</td><td>'+F(AC.setoff||0)+'</td><td>'+F(AC.bf||0)+'</td><td>'+F(AC.used||0)+'</td><td>'+F(AC.cfTotal||0)+'</td></tr></tfoot></table></div>'+
    r("5","Credit under 115JD utilised during the year — total of 4(C) → item 4 of Part B-TTI",AC.used||0,{cls:"tot"})+
    r("6","AMT liability available for credit in subsequent years — total of 4(D)",AC.cfTotal||0,{cls:"tot"})+
    (isNew()?note("Under the new regime, the credit utilised (C) and carried forward (D) are held to zero."):""));

  /* ===== Schedule TPSA card ===== */
  h+=card("tpsa","Schedule TPSA — Tax on secondary adjustments u/s 92CE(2A)","",
    row("Option u/s 92CE(2A) exercised (Part A-OI flag)",sel("tax.tpsaOn",[["Yes","Yes"],["No","No"]],{blank:false}),{ref:"trigger"})+
    (TP.on?(
      row("1 · Amount of primary adjustment on which the option is exercised and not repatriated",inp("tax.tpsa.amt",{n:1}),{ref:"1",req:1})+
      r("2a","Additional income tax payable @ 18%",TP.t18||0,{ind:1})+
      r("2b","Surcharge @ 12% on (a)",TP.t12||0,{ind:1})+
      r("2c","Health & education cess on (a + b)",TP.cess||0,{ind:1})+
      r("2d","Total additional tax payable (a + b + c)",TP.total||0,{cls:"tot"})+
      grid("tax.tpsa.rows",[{k:"bsr",h:"BSR code",t:"txt",w:"120px",max:7,req:1},
        {k:"bank",h:"Name of bank & branch",t:"txt",w:"auto",max:125,req:1},
        {k:"dt",h:"Date of deposit",t:"date",w:"150px",req:1},
        {k:"chln",h:"Challan serial",t:"num",w:"130px",req:1},
        {k:"amt",h:"Amount",t:"num",w:"140px",req:1}],
        S.tax.tpsa.rows,{min:"820px",empty:"No challan entered.",add:"Add a challan"})+
      r("—","Amount deposited (total of the table)",TP.deposited||0,{cls:"tot"})+
      r("3","Taxes paid",TP.paid||0)+
      r("4","Net tax payable (2d − 3)",TP.net||0,{cls:"grand"})
    ):note("Filled only when the option under section 92CE(2A) is exercised on Part A-OI.")));
  return h;
}

/* ---- export ---- */
function expTax(j){
  const T=S.C.tax||{},I=S.C.int||{},AM=S.C.amt||{},AC=S.C.amtc||{},TP=S.C.tpsa||{},L=S.C.loss||{};

  /* ---- Part B-TI ---- */
  put(j,"PartB-TI.Salaries",n0(T.salaries));
  put(j,"PartB-TI.IncomeFromHP",n0(T.item2));
  put(j,"PartB-TI.ProfBusGain.ProfGainNoSpecBus",n0(T.b3i));
  put(j,"PartB-TI.ProfBusGain.ProfGainSpecBus",n0(T.b3ii));
  put(j,"PartB-TI.ProfBusGain.ProfGainSpecifiedBus",n0(T.b3iii));
  put(j,"PartB-TI.ProfBusGain.ProfIncome115BBF",n0(T.b3iv));
  put(j,"PartB-TI.ProfBusGain.TotProfBusGain",n0(T.b3v));
  put(j,"PartB-TI.CapGain.ShortTerm.ShortTerm20Per",n0(T.st20));
  put(j,"PartB-TI.CapGain.ShortTerm.ShortTerm30Per",n0(T.st30));
  put(j,"PartB-TI.CapGain.ShortTerm.ShortTermAppRate",n0(T.stApp));
  put(j,"PartB-TI.CapGain.ShortTerm.ShortTermSplRateDTAA",n0(T.stDTAA));
  put(j,"PartB-TI.CapGain.ShortTerm.TotalShortTerm",n0(T.totST));
  put(j,"PartB-TI.CapGain.LongTerm.LongTerm12_5Per",n0(T.lt125));
  put(j,"PartB-TI.CapGain.LongTerm.LongTermSplRateDTAA",n0(T.ltDTAA));
  put(j,"PartB-TI.CapGain.LongTerm.TotalLongTerm",n0(T.totLT));
  put(j,"PartB-TI.CapGain.ShortTermLongTermTotal",n0(T.cg4c));
  put(j,"PartB-TI.CapGain.CapGains30Per115BBH",n0(T.cgC2));
  put(j,"PartB-TI.CapGain.TotalCapGains",n0(T.cg4e));
  put(j,"PartB-TI.IncFromOS.OtherSrcThanOwnRaceHorse",n0(T.os5a));
  put(j,"PartB-TI.IncFromOS.IncChargblSplRate",n0(T.os5b));
  put(j,"PartB-TI.IncFromOS.FromOwnRaceHorse",n0(T.os5c));
  put(j,"PartB-TI.IncFromOS.TotIncFromOS",n0(T.os5d));
  put(j,"PartB-TI.TotalTI",n0(T.totalTI));
  put(j,"PartB-TI.CurrentYearLoss",n0(T.cyl));
  put(j,"PartB-TI.BalanceAfterSetoffLosses",n0(T.balAfterCYLA));
  put(j,"PartB-TI.BroughtFwdLossesSetoff",n0(T.bfl));
  put(j,"PartB-TI.GrossTotalIncome",n0(S.C.gti));
  put(j,"PartB-TI.IncChargeTaxSplRate111A112",n0(T.splInc));
  put(j,"PartB-TI.DeductionsUndSchVIADtl.PartBchapterVIA",n0(T.viaPartB));
  put(j,"PartB-TI.DeductionsUndSchVIADtl.PartCchapterVIA",n0(T.viaPartC));
  put(j,"PartB-TI.DeductionsUndSchVIADtl.TotDeductUndSchVIA",n0(T.viaTot));
  put(j,"PartB-TI.DeductionsUnder10Aor10AA",n0(T.us10AA));
  put(j,"PartB-TI.TotalIncome",n0(S.C.ti));
  put(j,"PartB-TI.IncChargeableTaxSplRates",n0(T.splIncInTI));
  put(j,"PartB-TI.NetAgricultureIncomeOrOtherIncomeForRate",n0(T.agri));
  put(j,"PartB-TI.AggregateIncome",n0(T.aggFlag?((S.C.ti||0)-(T.splIncInTI||0)+(T.agri||0)):0));
  put(j,"PartB-TI.LossesOfCurrentYearCarriedFwd",n0((L.cf&&L.cf.total)||L.cfTotal||0));
  put(j,"PartB-TI.DeemedIncomeUs115JC",n0(AM.applies?AM.adjusted:0));

  /* ---- Schedule AMT (old regime only, when it applies) ---- */
  if(AM.applies){
    j.ScheduleAMT={
      TotalIncItem11:n0(S.C.ti),
      AdjustmentSec115JC:{DeductClaimSec6A:n0(AM.partC),DeductClaimSec10AA:n0(AM.d10AA),DeductClaimSec35AD:n0(AM.d35AD),Total:n0(AM.partC+AM.d10AA+AM.d35AD)},
      AdjustedUnderSec115JC:n0(AM.adjusted),
      AdjustedUnderSec115JCIFSC:n0(AM.ifsc),
      AdjustedUnderSec115JCOther:n0(AM.other),
      TaxPayableUnderSec115JC:n0(AM.amt)};
  }

  /* ---- Part B-TTI ---- */
  const CTL=j.PartB_TTI.ComputationOfTaxLiability;
  put(CTL,"TaxPayableOnDeemedTI.TaxDeemedTISec115JC",n0(AM.applies?AM.amt:0));
  put(CTL,"TaxPayableOnDeemedTI.SurchargeOnAboveCrore",n0(AM.applies?AM.sur:0));
  put(CTL,"TaxPayableOnDeemedTI.EducationCess",n0(AM.applies?AM.cess:0));
  put(CTL,"TaxPayableOnDeemedTI.TotalTax",n0(AM.applies?AM.total:0));
  put(CTL,"TaxPayableOnTI.TaxAtNormalRatesOnAggrInc",n0(T.normalTax));
  put(CTL,"TaxPayableOnTI.TaxAtSpecialRates",n0(T.splTax));
  put(CTL,"TaxPayableOnTI.RebateOnAgriInc",n0(T.agriRebate));
  put(CTL,"TaxPayableOnTI.TaxPayableOnTotInc",n0(T.taxOn));
  put(CTL,"TaxPayableOnTI.Rebate87A",n0(T.rebate));
  put(CTL,"TaxPayableOnTI.TaxPayableOnRebate",n0(T.after));
  put(CTL,"TaxPayableOnTI.Surcharge25ofSI",n0(T.surI));
  put(CTL,"TaxPayableOnTI.Surcharge25ofSIBeforeMarginal",n0(T.surI));
  put(CTL,"TaxPayableOnTI.SurchargeOnAboveCrore",n0(T.surII));
  put(CTL,"TaxPayableOnTI.SurchargeOnAboveCroreBeforeMarginal",n0(T.surII+T.mr));
  put(CTL,"TaxPayableOnTI.TotalSurcharge",n0(T.sur));
  put(CTL,"TaxPayableOnTI.EducationCess",n0(T.cess));
  put(CTL,"TaxPayableOnTI.GrossTaxLiability",n0(T.gross));
  put(CTL,"GrossTaxPayable",n0(I.grossPayable));
  put(CTL,"GrossTaxPay.TaxInc17",n0(I.taxInc17));
  put(CTL,"GrossTaxPay.TaxDeferred17",n0(I.esopDef));
  put(CTL,"GrossTaxPay.TaxDeferredPayableCY",n0(I.esopDue));
  put(CTL,"CreditUS115JD",n0(I.credit));
  put(CTL,"TaxPayAfterCreditUs115JD",n0(I.afterCredit));
  if(I.relief){put(CTL,"TaxRelief.Section89",n0(I.rel89));put(CTL,"TaxRelief.Section90",n0(I.rel90));put(CTL,"TaxRelief.Section91",n0(I.rel91));}
  put(CTL,"TaxRelief.TotTaxRelief",n0(I.relief));
  put(CTL,"NetTaxLiability",n0(I.net));
  put(CTL,"IntrstPay.IntrstPayUs234A",n0(I.i234a));
  put(CTL,"IntrstPay.IntrstPayUs234B",n0(I.i234b));
  put(CTL,"IntrstPay.IntrstPayUs234C",n0(I.i234c));
  put(CTL,"IntrstPay.LateFilingFee234F",Math.min(5000,n0(I.f234f)));
  if(I.f234i)put(CTL,"IntrstPay.FeeFurnish234I",Math.min(99999,n0(I.f234i)));
  put(CTL,"IntrstPay.TotalIntrstPay",n0(I.total));
  put(CTL,"AggregateTaxInterestLiability",n0(I.aggregate));
  if(I.adv)put(j,"PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax",n0(I.adv));
  if(I.tds)put(j,"PartB_TTI.TaxPaid.TaxesPaid.TDS",n0(I.tds));
  if(I.tcs)put(j,"PartB_TTI.TaxPaid.TaxesPaid.TCS",n0(I.tcs));
  if(I.sat)put(j,"PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax",n0(I.sat));
  put(j,"PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid",n0(I.paid));
  put(j,"PartB_TTI.TaxPaid.BalTaxPayable",n0(I.balance));
  put(j,"PartB_TTI.Refund.RefundDue",n0(I.refund));
  put(j,"PartB_TTI.AssetOutIndiaFlag",((S.C.fa||{}).hasFA)?"YES":"NO");   /* data-driven; was hardcoded YES in the skeleton (rule A901) */

  /* ---- Schedule AMTC — export whenever a credit exists (prior balance) or arises this year ---- */
  if((AC.rows||[]).some(x=>x.gross||x.setoff)||AC.curr||AC.avail){
    j.ScheduleAMTC={
      TaxSection115JC:n0(AC.tax115JC),
      TaxOthProvisions:n0(AC.taxOther),
      AmtTaxCreditAvailable:n0(AC.avail),
      CurrAssYr:"2026-27",
      CurrYrAmtCreditFwd:n0(AC.curr),
      CurrYrCreditCarryFwd:n0(AC.curr),
      TotAMTGross:n0(AC.gross+AC.curr),
      TotSetOffEys:n0(AC.setoff),
      TotBalBF:n0(AC.bf),
      TotAmtCreditUtilisedCY:n0(AC.used),
      TotBalAMTCreditCF:n0(AC.cfTotal),
      TaxSection115JD:n0(AC.used),
      AmtLiabilityAvailable:n0(AC.cfTotal)};
    const dtls=(AC.rows||[]).filter(x=>x.gross||x.setoff||x.used||x.cf).map(x=>({
      AssYr:x.y,AmtCreditFwd:n0(x.gross),AmtCreditSetOfEy:n0(x.setoff),
      AmtCreditBalBroughtFwd:n0(x.bf),AmtCreditUtilized:n0(x.used),BalAmtCreditCarryFwd:n0(x.cf)}));
    if(dtls.length)j.ScheduleAMTC.ScheduleAMTCDtls=dtls;
  }

  /* ---- Schedule TPSA — only when the 92CE(2A) option is exercised ---- */
  if(TP.on){
    j.ScheduleTPSA={
      AmtPrimaryAdjUs92CE_2A:n0(TP.amt),
      AdditionalIncTax18PercAbove:n0(TP.t18),
      Surcharge12Perc:n0(TP.t12),
      HealthEducationCess:n0(TP.cess),
      TotalAdditionalTax:n0(TP.total),
      TaxesPaid:n0(TP.paid),
      NetTaxPayable:n0(TP.net),
      TotalAmountDeposited:n0(TP.deposited)};
    const rows=(S.tax.tpsa.rows||[]).filter(x=>st0(x.bsr)||N(x.amt)).map(x=>({
      BSRCode:st0(x.bsr).toUpperCase(),BankBranchName:st0(x.bank).slice(0,125),
      DateDep:ISO(x.dt)||undefined,SrlNoOfChaln:Math.min(99999,n0(x.chln)),Amount:n0(x.amt)}));
    if(rows.length)j.ScheduleTPSA.DtlsTaxesPaid=rows;
  }
}

/* ---- import (inverse) ---- */
function impTax(I3){
  const read=[];
  const g=(o,p)=>{let x=o;for(const k of p.split(".")){if(x==null)return undefined;x=x[k];}return x;};
  const CTL=g(I3,"PartB_TTI.ComputationOfTaxLiability")||{};
  const s89=g(CTL,"TaxRelief.Section89"), f234i=g(CTL,"IntrstPay.FeeFurnish234I");
  if(s89!=null||f234i!=null){S.tax.s89=nz(s89);S.tax.f234i=nz(f234i);read.push("reliefs & fees (Part B-TTI)");}
  if(I3&&I3["PartB-TI"])read.push("Part B-TI (computed on import)");
  const AC=I3&&I3.ScheduleAMTC;
  if(AC){S.tax.amtc={};(AC.ScheduleAMTCDtls||[]).forEach(r=>{S.tax.amtc[r.AssYr]={gross:r.AmtCreditFwd,setoff:r.AmtCreditSetOfEy};});read.push("Schedule AMTC");}
  const TP=I3&&I3.ScheduleTPSA;
  if(TP){S.tax.tpsaOn="Yes";S.tax.tpsa={amt:TP.AmtPrimaryAdjUs92CE_2A,
    rows:(TP.DtlsTaxesPaid||[]).map(r=>({bsr:r.BSRCode,bank:r.BankBranchName,dt:dmy(r.DateDep),chln:r.SrlNoOfChaln,amt:r.Amount}))};
    read.push("Schedule TPSA");}
  return read;
}

/* ---- checks (regime-aware, from the book's rules) ---- */
function chkTax(){
  const o=[],add=(l,t,m)=>o.push({lvl:l,t,m,sec:"tax"});
  const T=S.C.tax||{},I=S.C.int||{},AM=S.C.amt||{},AC=S.C.amtc||{},TP=S.C.tpsa||{};

  /* AMT must be blank in the new regime (REGIME.md A836) */
  if(isNew()&&(AM.partC||AM.d10AA||AM.d35AD))
    add("warn","Schedule AMT closed by the new regime","Adjusted-income add-backs of "+RS((AM.partC||0)+(AM.d10AA||0)+(AM.d35AD||0))+" are ignored — AMT (section 115JC) does not apply under section 115BAC.");
  else if(AM.applies)
    add("ok","Alternate minimum tax applies","Adjusted total income "+RS(AM.adjusted)+" exceeds ₹20 lakh — tax under 115JC is "+RS(AM.total)+" (higher-of comparison with the normal tax).");

  /* AMTC utilisation must be zero in the new regime (AMTC.md rules line 4240) */
  if(isNew()&&(AC.used||AC.cfTotal))
    add("warn","AMT credit under the new regime","Under the new regime the credit utilised and carried forward are held to zero.");
  else if((AC.used||0)>0)
    add("ok","AMT credit utilised",RS(AC.used)+" of section-115JD credit is set off this year; "+RS(AC.cfTotal)+" carries forward.");

  /* AMTC 2025-26 set-off-in-earlier-years cap (AMTC.md rules line 4230) */
  const r2526=(S.tax.amtc||{})["2025-26"]||{};
  if(N(r2526.setoff)>0)add("err","Schedule AMTC — 2025-26","Set off in earlier years cannot be claimed for A.Y. 2025-26; column B2 must be zero.");

  /* the 87A rebate */
  if(T.marginal>0)add("ok","Marginal relief under section 87A","Tax is held to the income above ₹12,00,000; "+RS(T.rebate)+" falls away.");
  else if(T.rebate>0)add("ok","Rebate under section 87A",RS(T.rebate)+" of tax falls away.");

  /* surcharge cap on capital gains / dividend */
  if((T.scr||0)>15&&(T.scrCap||0)===15&&((T.cgC2||0)||(S.C.si||{}).cgDivTax))
    add("ok","Surcharge on capital gains capped","The surcharge on the capital-gains and dividend portion is held to 15 per cent.");

  /* TPSA (section 92CE(2A)) */
  if(TP.on){
    if(!(TP.amt>0))add("err","Schedule TPSA","The option under section 92CE(2A) is exercised but no primary-adjustment amount is entered.");
    const sysISO=new Date().toISOString().slice(0,10);
    (S.tax.tpsa.rows||[]).forEach((x,i)=>{
      const iso=ISO(x.dt);
      if(st0(x.dt)&&!iso)add("err","TPSA challan "+(i+1),"The date of deposit is not a valid date.");
      else if(iso&&iso<"2025-04-01")add("err","TPSA challan "+(i+1),"The date of deposit cannot be before 01-04-2025.");
      else if(iso&&iso>sysISO)add("err","TPSA challan "+(i+1),"The date of deposit cannot be after today.");
      if(st0(x.bsr)&&!/^[0-9]{3}[0-9A-Z]{4}$/.test(st0(x.bsr).toUpperCase()))add("err","TPSA challan "+(i+1),"The BSR code must be a valid seven-character code.");
    });
    if((TP.paid||0)>(TP.total||0))add("warn","Schedule TPSA","Taxes paid exceed the total additional tax; the net payable is held to zero.");
  }

  /* balance / refund summary */
  if((I.balance||0)>0)add("ok","Balance payable",RS(I.balance)+" is payable, including "+RS(I.total)+" of interest and fee.");
  else if((I.refund||0)>0)add("ok","Refund due",RS(I.refund)+" will be credited to the bank account nominated under Bank and verification.");
  if((I.i234a||0)+(I.i234b||0)+(I.i234c||0)+(I.f234f||0)>0&&I.late)
    add("warn","Filed after the due date","Interest and fee of "+RS(I.total)+" arise because the return is filed after "+DISP(I.dueDate||DUE)+".");

  return o;
}

/* ---- register ---- */
reg({id:"tax", t:"Part B — total income and tax", ref:"Part B-TI · TTI · AMT · AMTC · TPSA",
  f:secTax, s:()=>(S.C.tax&&S.C.tax.gross)?("Tax "+CR((S.C.int&&S.C.int.net)||0)):"Lines 1 to 19, both parts",
  eng:engTax, exp:expTax, imp:impTax, chk:chkTax, order:90});
