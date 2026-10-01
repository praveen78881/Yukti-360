/* =====================================================================
   ITR-6 · Section "bp" — Business & profession (company return)
   Books: BP.md, DPM_DOA.md, DEP_DCG.md, ESR.md, ICDS.md (books/ITR-6/)
   Schema blocks: CorpScheduleBP, ScheduleDPM, ScheduleDOA, ScheduleDEP,
                  ScheduleDCG, ScheduleESR, ScheduleICDS.
   Structural model: forms/ITR-3/src/70_sec_bp.js — but every field,
   number and formula is taken from the ITR-6 books (company return), not
   from ITR-3. ITR-6 differences honoured here:
     - CorpScheduleBP (not ITR3ScheduleBP); NO salary head (company);
       NO 44AD/44ADA; item 4 splits into 4a(44-sections)/4b(115B life)/
       4c(rule 7/8)/4d(10TIA raw diamond); item 21 has 12 sub-lines but
       ONE schema key (total only); item 28 = 32AC deduction (new);
       ESR excess -> BP 29 and ESR shortfall -> BP 24(c); ICDS -> OI ->
       BP 25/33.
     - Unabsorbed depreciation (Schedule UD) is NOT owned here — it lives
       in the `loss` section for ITR-6 (books/ITR-6/section_map.json).
     - Concessional regime is 115BA/115BAA/115BAB (company), NOT the
       individual 115BAC (isNew()): additional depreciation & the 45%
       block are closed under 115BA/115BAA/115BAB (A274/A275); ESR weighted
       deductions [35(1)(ii)/(iia)/(iii)/35(2AA)/35CCC] and the 35AD(1)
       deduction are closed under 115BAA/115BAB (A255).
   CRITICAL cross-section feeds (the ITR-5 bug was ICDS not reaching OI):
     - DPM/DOA -> DEP total -> BP 12i (A196)
     - DPM/DOA s.50 gains -> DCG -> Schedule CG  (published S.C.bp.dcg)
     - ESR col(4) total -> BP 29 (A212); ESR shortfall (hidden col K,
       MAX((2)-(3),0)) -> BP 24(c) Others (A235)
     - ICDS XI(3)/XI(4) -> published S.C.icds.total / S.C.icds.deTotal
       (both, so the accounts section's OI engine fills OI 3a/3b) -> then
       BP 25 = OI 3a + 4d (A197) / BP 33 = OI 3b + 4e.
   Compute order 30 (after `accounts`); the 2-pass fixpoint in 90_wiring
   lets the OI feed reach BP whichever order the sibling engines run in.
   Sets S.C.bp.income = D (item D, signed head total to GTI).
   ===================================================================== */

/* ---- state ---- */
S.bp = S.bp || {
  /* Part A */
  pbt:0,                 /* 1 Profit before tax as per P&L */
  nplSpec:0,             /* 2a net P/L speculative incl. in 1 (signed) */
  nplSpecified:0,        /* 2b net P/L specified 35AD incl. in 1 (signed) */
  a3a:0,a3b:0,           /* 3a HP, 3b CG */
  a3ci:0,a3cii:0,        /* 3c(i) dividend, 3c(ii) other than dividend (3c=ci+cii) */
  a3d:0,a3e:0,a3f:0,     /* 3d 115BBF, 3e 115BBG, 3f 115BBH */
  /* 4a — 44-section profits (signed) */
  p44AE:0,p44B:0,p44BB:0,p44BBA:0,p44BBB:0,p44BBC:0,p44BBD:0,p44D:0,p44DA:0,pXIIG:0,pFirstSch:0,
  p115B:0,               /* 4b life insurance 115B */
  r7:0,r7A:0,r7B1:0,r7B1A:0,r8:0,   /* 4c rule 7/7A/7B(1)/7B(1A)/8 */
  pElig10TIA:0,          /* 4d raw-diamond eligible business (rule 10TIA) */
  /* 5 exempt */
  a5a:0,a5b:0,           /* 5a firm share, 5b AOP/BOI share */
  divExempt:0,           /* 5c dividend (nature fixed = Dividend) */
  othExempt:[],          /* 5c other exempt rows [{name,amt}] */
  a5A:0,                 /* 5A not chargeable to tax */
  /* 7 expenses under other heads (no salary; 7f 115BBH has no schema key) */
  e7a:0,e7b:0,e7c:0,e7d:0,e7e:0,
  e8a:0,e8b:0,           /* 8a exempt-related exp, 8b 14A (16 of OI) */
  /* 11-12 depreciation */
  depDebPL:0,            /* 11 depreciation debited to P&L */
  dep32_1_i:0,           /* 12ii dep u/s 32(1)(i) — power sector */
  /* 14-19 disallowances */
  d14:0,d15:0,d16:0,d17:0,d18:0,d19:0,
  deem41:0,              /* 20 deemed income u/s 41 */
  /* 21 deemed income (12 sub-lines; ONE schema key = the total) */
  d21_32AC:0,d21_32AD:0,d21_33AB:0,d21_33ABA:0,d21_35ABA:0,d21_35ABB:0,
  d21_35AC:0,d21_40A3A:0,d21_33AC:0,d21_72A:0,d21_80HHD:0,d21_80IA:0,
  d22:0,d23:0,           /* 22 43CA, 23 other addition 28-44DB */
  i24a:0,i24b:0,i24c:0,  /* 24a Commission, 24b Interest, 24c Others (+ESR shortfall) */
  /* 25 fed from OI (3a+4d) — computed */
  d27:0,                 /* 27 deduction u/s 32(1)(iii) */
  d28_32AC:0,            /* 28 amount allowable u/s 32AC */
  /* 29 fed from ESR col(4) — computed */
  d30:0,d31:0,d32:0,     /* 30 40 now-allow, 31 43B now-allow, 32 any other */
  /* 33 fed from OI (3b+4e) — computed */
  /* 36 presumptive */
  dp44AE:0,dp44B:0,dp44BB:0,dp44BBA:0,dp44BBB:0,dp44BBC:0,dp44BBD:0,dp44D:0,dp44DA:0,dpXIIG:0,dpFirstSch:0,
  /* 38 rule chargeable income */
  r38a:0,r38b:0,r38c:0,r38d:0,r38e:0,
  /* Part B — speculative */
  s41:0,s42:0,           /* 41 additions, 42 deductions (40 = 2a) */
  /* Part C — specified 35AD */
  sp45:0,sp46:0,sp48:0,  /* 45 add, 46 ded, 48 deduction u/s 35AD(1) */
  clause:["",""]         /* 35AD(5) clause dropdown (two rows) */
};
S.dpm = S.dpm || { r15:{}, r30:{}, r40:{}, r45:{} };
S.doa = S.doa || { land:{}, b5:{}, b10:{}, b40:{}, furn:{}, intang:{}, ships:{} };
S.esr = S.esr || {};    /* {i:{deb,allow}, ... ix} */
S.icds = S.icds || {};  /* {acc:{inc,dec}, inv:{...}, ... prov} */

SEED["bp.othExempt"] = SEED["bp.othExempt"] || {};

/* ---- the 35AD(5) clause value list (BP.md §6; not in enums.json) ---- */
const BP_35AD5 = [
 ["a","(a) laying and operating a cross-country natural gas pipeline network for distribution, including storage facilities being an integral part of such network"],
 ["aa","(aa) building and operating a new hotel of two-star or above category as classified by the Central Government"],
 ["ab","(ab) building and operating a new hospital with at least one hundred beds for patients"],
 ["ac","(ac) developing and building a housing project under a scheme for slum redevelopment or rehabilitation"],
 ["ad","(ad) developing and building a housing project under a scheme for affordable housing"],
 ["ae","(ae) new plant or in a newly installed capacity in an existing plant for production of fertilizer"],
 ["af","(af) setting up and operating an inland container depot or a container freight station"],
 ["ag","(ag) bee-keeping and production of honey and beeswax"],
 ["ah","(ah) setting up and operating a warehousing facility for storage of sugar"],
 ["ai","(ai) laying and operating a slurry pipeline for the transportation of iron ore"],
 ["ak","(ak) developing or operating and maintaining any infrastructure facility"],
 ["b","(b) all other cases not falling under any of the above clauses"]
];
/* [key, roman, label, schemaKey] */
const ICDS_ROWS = [
 ["acc","I","Accounting Policies","AccPolicyAmtDetl"],
 ["inv","II","Valuation of Inventories (other than 145A stock deviation, reported at OI 4d/4e)","InventoriesValueDetl"],
 ["cons","III","Construction Contracts","ConstContractsAmtDetl"],
 ["rev","IV","Revenue Recognition","RevenueRcgAmtDetl"],
 ["tfa","V","Tangible Fixed Assets","TangibleFixedAssetDetl"],
 ["fx","VI","Changes in Foreign Exchange Rates","ForeignExgRatesDetl"],
 ["grant","VII","Government Grants","GovtGrantsDetl"],
 ["sec","VIII","Securities (other than 145A stock deviation, reported at OI 4d/4e)","SecuritiesDetl"],
 ["borr","IX","Borrowing Costs","BorrowingCostsDetl"],
 ["prov","X","Provisions, Contingent Liabilities and Contingent Assets","ProvAssetsDetl"]
];
/* [key, label, schemaKey, weightedGatedUnder115BAA_BAB]  (ESR.md §3/§4, A255) */
const ESR_ROWS = [
 ["i","35(1)(i)","Section35_1_i",false],
 ["ii","35(1)(ii)","Section35_1_ii",true],
 ["iii","35(1)(iia)","Section35_1_iia",true],
 ["iv","35(1)(iii)","Section35_1_iii",true],
 ["v","35(1)(iv)","Section35_1_iv",false],
 ["vi","35(2AA)","Section35_2AA",true],
 ["vii","35(2AB)","Section35_2AB",false],
 ["viii","35CCC","Section35_CCC",true],
 ["ix","35CCD","Section35_CCD",false]
];

/* =====================================================================
   Concessional-regime helpers (company: 115BA / 115BAA / 115BAB)
   The opted section lives in Part A-General (FilingStatus.Section115BA),
   owned by the `who` section. `who` is a sibling builder, so this reads
   resiliently from the likely state homes and degrades to "" (no
   concession -> no gating) when the seam is not yet wired. Flagged in the
   build report as a cross-section seam for the integrator.
   ===================================================================== */
function bpConc(){
  /* returns "115BA" | "115BAA" | "115BAB" | "" */
  var raw="";
  try{
    var cands=[
      S.C&&S.C.regime115, S.C&&S.C.conc115,
      S.fs&&(S.fs.sec115||S.fs.section115BA||S.fs.conc115||S.fs.regime115),
      S.who&&(S.who.sec115||S.who.section115BA||S.who.conc115),
      RG(S,"who.fs.Section115BA",""), RG(S,"who.filing.Section115BA",""),
      RG(S,"fs.Section115BA",""), RG(S,"who.Section115BA","")
    ];
    for(var i=0;i<cands.length;i++){ var c=st0(cands[i]); if(c){raw=c;break;} }
  }catch(e){}
  var m=/115BA[AB]?/.exec(String(raw).replace(/\s+/g,""));
  return m?m[0]:"";
}
function bpDepBarred(){ var s=bpConc(); return s==="115BA"||s==="115BAA"||s==="115BAB"; } /* A274/A275 */
function bpWeightedBarred(){ var s=bpConc(); return s==="115BAA"||s==="115BAB"; }        /* A255 */

/* =====================================================================
   The OI feed for BP 25/33  (ICDS XI(3)/XI(4) -> OI 3a/3b -> BP 25/33,
   plus the 145A stock-deviation on OI 4d/4e).
   Reads the accounts section's published OI figures if present; else
   falls back to this section's own ICDS totals (OI 3a = ICDS increase,
   OI 3b = ICDS decrease) plus any 145A figure read from the raw OI node.
   This guarantees the ICDS effect reaches BP even before the OI seam is
   fully wired (the ITR-5 fix), and picks up the 145A part when accounts
   publishes it.
   ===================================================================== */
function bpOIfeed(){
  var oi=(S.C&&S.C.oi)||{};
  var icdsInc=R(N((S.C.icds||{}).total));
  var icdsDec=R(N((S.C.icds||{}).deTotal));
  /* OI 3a/3b (ICDS): prefer accounts' published value, else our ICDS totals */
  var a3=(oi.i3a!=null)?N(oi.i3a):((oi.oi3a!=null)?N(oi.oi3a):icdsInc);
  var b3=(oi.i3b!=null)?N(oi.i3b):((oi.oi3b!=null)?N(oi.oi3b):icdsDec);
  /* OI 4d/4e (145A stock deviation): accounts input */
  var d4=(oi.i4d!=null)?N(oi.i4d):N(RG(S,"accounts.oi.MethodOfValClgStk.EffectOnPL",0));
  var e4=(oi.i4e!=null)?N(oi.i4e):N(RG(S,"accounts.oi.MethodOfValClgStk.DecProOrIncLossUs145_A",0));
  /* a fully-computed feed wins if accounts publishes it */
  var inc25=(oi.bp25!=null)?N(oi.bp25):(a3+d4);
  var dec33=(oi.bp33!=null)?N(oi.bp33):(b3+e4);
  return {inc25:R(inc25),dec33:R(dec33),a3:R(a3),b3:R(b3),d4:R(d4),e4:R(e4)};
}

/* =====================================================================
   Depreciation block engine (DPM & DOA) — one block per rate column.
   opts.half:false -> no <180-day split (45% block); opts.addl:false ->
   no additional depreciation (DOA, and the 45% block); the concessional
   regime closes additional depreciation (A274) and caps plant at 40%
   (the 45% block gets nil depreciation, A275).
   ===================================================================== */
function bpBlock(b,rate,opts){
  b=b||{};opts=opts||{};
  const halfOK  = opts.half!==false;
  const addlOK  = opts.addl!==false && !bpDepBarred();     /* A274 */
  const cap40   = opts.blocked && bpDepBarred();            /* A275: 45% block -> nil dep */
  const wdv = N(b.WDVFirstDay);
  const add180 = N(b.AdditionsGrThan180Days), realTot = N(b.RealizationTotalPeriod);
  const fullBase = wdv + add180 - realTot;
  const fullAmt = Math.max(0, fullBase);                    /* item 6 = MAX(0, 3+4-5) */
  const addLess = halfOK?N(b.AdditionsLessThan180Days):0;
  const realLess = halfOK?N(b.RealizationPeriodDuringYear):0;
  const halfAmt = halfOK?Math.max(0, addLess - realLess + Math.min(0,fullBase)):0; /* item 9 */
  let depFull = Math.round(fullAmt*rate/100);              /* item 10 = ROUND(6*rate/100) */
  let depHalf = halfOK?Math.round(halfAmt*rate/200):0;     /* item 11 = ROUND(9*rate/200) */
  const addl12 = addlOK?N(b.AddlnDeprOnGT180DayAdditions):0;
  const addl13 = addlOK?N(b.AddlnDeprDuringYearAdditions):0;
  const addl14 = addlOK?N(b.AddlnDeprOnLessThan180DayAdditions):0;
  if(cap40){depFull=0;depHalf=0;}
  const totDep = depFull+depHalf+addl12+addl13+addl14;     /* item 15 (DPM) / 12 (DOA) */
  const disallow = N(b.DepDisAllowUs38_2);                 /* item 16 / 13 */
  const netAgg = Math.max(0, totDep-disallow);             /* item 17 / 14 = MAX(0,15-16) */
  const pro = N(b.ProportionateAggDepreciation);           /* item 18 / 15 */
  const expTr = N(b.ExpdrOnTrforSaleAsset);                /* item 19 / 16 */
  /* item 20 (DPM) / 17 (DOA) capital gain u/s 50 = 5+8-3-4-7-exp.
     "Enter negative only if block ceases" is a hidden Y/N switch (not
     built) — so floor at 0: a positive s.50 STCG is carried, the
     block-ceases loss path is out of scope. */
  const cg50 = Math.max(0, realTot + realLess - wdv - add180 - addLess - expTr);
  const wdvLast = Math.max(0, fullAmt + halfAmt - totDep); /* item 21 / 18 = MAX(0,6+9-15) */
  return {rate,wdv,add180,realTot,fullAmt,addLess,realLess,halfAmt,
    depFull,depHalf,addl12,addl13,addl14,totDep,disallow,netAgg,pro,expTr,cg50,wdvLast,
    dep:(pro>0?pro:netAgg)};                               /* DEP: proportionate if >0 else net */
}

/* =====================================================================
   ENGINE
   ===================================================================== */
function engBp(){
  const B=S.bp||{};
  const nb=k=>N(B[k]), sgb=k=>sg(B[k]);
  const barredW=bpWeightedBarred();

  /* ---------- ICDS (publishes S.C.icds for the OI feed) ---------- */
  const icds={rows:{}}; let icdsInc=0, icdsDec=0;
  ICDS_ROWS.forEach(r=>{
    const o=(S.icds||{})[r[0]]||{};
    const inc=N(o.inc), dec=N(o.dec);
    icds.rows[r[0]]={inc:R(inc),dec:R(dec),net:R(inc-dec)};   /* Net = In - De */
    icdsInc+=inc; icdsDec+=dec;
  });
  icds.total   = Math.max(0,R(icdsInc));   /* XI(3) total increase  [F16] */
  icds.deTotal = Math.max(0,R(icdsDec));   /* XI(4) total decrease  [G16] */
  icds.totNet  = Math.max(0,R(icdsInc-icdsDec));  /* XI(5) floored at 0 [H16] */
  /* publish BOTH name-styles so the accounts OI engine finds the feed
     whichever convention it reads (the ITR-5 fix). */
  icds.totInc=icds.total; icds.totDec=icds.deTotal;
  S.C.icds=icds;

  /* ---------- ESR (feeds BP 29 and 24(c)) ---------- */
  const esr={rows:{}}; let eDeb=0,eAllow=0,eExcess=0,eShort=0;
  ESR_ROWS.forEach(r=>{
    const o=(S.esr||{})[r[0]]||{};
    const deb=N(o.deb);
    let allow=N(o.allow);
    if(barredW&&r[3])allow=0;                        /* A255: weighted deduction col(3)=0 */
    const excess=Math.max(0, allow-deb);             /* col(4) = MAX(0,(3)-(2)) */
    const shortRow=Math.max(0, deb-allow);           /* hidden col K = MAX((2)-(3),0) */
    eShort+=shortRow;
    esr.rows[r[0]]={deb:R(deb),allow:R(allow),excess:R(excess),
      gatedZeroed:barredW&&r[3]&&N(o.allow)>0};
    eDeb+=deb; eAllow+=allow; eExcess+=excess;
  });
  esr.totDeb=R(eDeb); esr.totAllow=R(eAllow);
  esr.totExcess=Math.max(0,R(eExcess));   /* item x(4) -> BP 29 */
  esr.shortfall=R(eShort);                /* col-K total -> BP 24(c) */
  S.C.esr=esr;

  /* ---------- DPM ---------- */
  const dpm={
    r15:bpBlock(S.dpm&&S.dpm.r15,15,{}),
    r30:bpBlock(S.dpm&&S.dpm.r30,30,{}),
    r40:bpBlock(S.dpm&&S.dpm.r40,40,{}),
    r45:bpBlock(S.dpm&&S.dpm.r45,45,{half:false,addl:false,blocked:true})
  };
  S.C.dpm=dpm;
  /* ---------- DOA ---------- */
  const landB=(S.doa&&S.doa.land)||{};
  const land={wdv:N(landB.WDVFirstDay),wdvLast:Math.max(0,N(landB.WDVFirstDay)),dep:0,cg50:0};
  const doa={
    land:land,
    b5:bpBlock(S.doa&&S.doa.b5,5,{addl:false}),
    b10:bpBlock(S.doa&&S.doa.b10,10,{addl:false}),
    b40:bpBlock(S.doa&&S.doa.b40,40,{addl:false}),
    furn:bpBlock(S.doa&&S.doa.furn,10,{addl:false}),
    intang:bpBlock(S.doa&&S.doa.intang,25,{addl:false}),
    ships:bpBlock(S.doa&&S.doa.ships,20,{addl:false})
  };
  S.C.doa=doa;

  /* ---------- DEP (summary of depreciation) ---------- */
  const dep={};
  dep.pm15=dpm.r15.dep; dep.pm30=dpm.r30.dep; dep.pm40=dpm.r40.dep; dep.pm45=dpm.r45.dep;
  dep.totPM=R(dep.pm15+dep.pm30+dep.pm40+dep.pm45);                 /* 1e */
  dep.b5=doa.b5.dep; dep.b10=doa.b10.dep; dep.b40=doa.b40.dep;
  dep.totBld=R(dep.b5+dep.b10+dep.b40);                             /* 2d */
  dep.furn=doa.furn.dep; dep.intang=doa.intang.dep; dep.ships=doa.ships.dep;
  dep.total=Math.max(0,R(dep.totPM+dep.totBld+dep.furn+dep.intang+dep.ships)); /* total -> BP 12i */
  S.C.dep=dep;

  /* ---------- DCG (deemed capital gains u/s 50) -> Schedule CG ---------- */
  const dcg={};
  dcg.pm15=dpm.r15.cg50; dcg.pm30=dpm.r30.cg50; dcg.pm40=dpm.r40.cg50; dcg.pm45=dpm.r45.cg50;
  dcg.totPM=R(dcg.pm15+dcg.pm30+dcg.pm40+dcg.pm45);                 /* 1e */
  dcg.b5=doa.b5.cg50; dcg.b10=doa.b10.cg50; dcg.b40=doa.b40.cg50;
  dcg.totBld=R(dcg.b5+dcg.b10+dcg.b40);                             /* 2d */
  dcg.furn=doa.furn.cg50; dcg.intang=doa.intang.cg50; dcg.ships=doa.ships.cg50;
  dcg.total=R(dcg.totPM+dcg.totBld+dcg.furn+dcg.intang+dcg.ships);  /* total -> Schedule CG */
  S.C.dcg=dcg;

  /* ---------- OI feed ---------- */
  const feed=bpOIfeed();

  /* ================= BP LADDER — Part A ================= */
  const K1 = sg(nb("pbt"));                                   /* 1 */
  const _2a = sgb("nplSpec"), _2b = sgb("nplSpecified");      /* 2a, 2b */
  const _3c = R(nb("a3ci")+nb("a3cii"));                      /* 3c = 3ci + 3cii */
  const sum3 = R(nb("a3a")+nb("a3b")+_3c+nb("a3d")+nb("a3e")+nb("a3f")); /* 3a+3b+3c+3d+3e+3f */
  const _4a = R(sgb("p44AE")+sgb("p44B")+sgb("p44BB")+sgb("p44BBA")+sgb("p44BBB")+sgb("p44BBC")+
               sgb("p44BBD")+sgb("p44D")+sgb("p44DA")+sgb("pXIIG")+sgb("pFirstSch"));
  const _4b = sgb("p115B");
  const _4c = R(nb("r7")+nb("r7A")+nb("r7B1")+nb("r7B1A")+nb("r8"));   /* TotalProfitFrmActCvrd */
  const _4d = R(nb("pElig10TIA"));
  const othExemptTot = R((B.othExempt||[]).reduce((a,r)=>a+N(r.amt),0));
  const _5ciii = R(nb("divExempt")+othExemptTot);            /* 5c total (OthExempInc) */
  const _5d = R(nb("a5a")+nb("a5b")+_5ciii);                 /* 5d TotExempInc */
  const _5A = R(nb("a5A"));
  const _6 = R(K1 - _2a - _2b - sum3 - _4a - _4b - _4c - _4d - _5d - _5A); /* 6 balance */
  const _9 = R(nb("e7a")+nb("e7b")+nb("e7c")+nb("e7d")+nb("e7e")+nb("e8a")+nb("e8b")); /* 9 (no 7f) */
  const _10 = R(_6+_9);                                       /* 10 = 6 + 9 */
  const _11 = R(nb("depDebPL"));                             /* 11 */
  const _12i = R(dep.total>0?dep.total:0);                   /* 12i = DEP total (A196) */
  const _12ii = R(nb("dep32_1_i"));                          /* 12ii */
  const _12iii = R(_12i+_12ii);                             /* 12iii */
  const _13 = R(_10+_11-_12iii);                            /* 13 = 10 + 11 - 12iii */
  const _20 = R(nb("deem41"));                               /* 20 */
  const _21 = Math.max(0, R(nb("d21_32AC")+nb("d21_32AD")+nb("d21_33AB")+nb("d21_33ABA")+
    nb("d21_35ABA")+nb("d21_35ABB")+nb("d21_35AC")+nb("d21_40A3A")+nb("d21_33AC")+
    nb("d21_72A")+nb("d21_80HHD")+nb("d21_80IA")));          /* 21 total */
  const _24c = R(nb("i24c")+esr.shortfall);                  /* 24c Others (+ESR shortfall A235) */
  const _24 = R(nb("i24a")+nb("i24b")+_24c);                 /* 24 total */
  const _25 = R(feed.inc25);                                 /* 25 = OI 3a + 4d (A197) */
  const _26 = R(nb("d14")+nb("d15")+nb("d16")+nb("d17")+nb("d18")+nb("d19")+_20+_21+nb("d22")+nb("d23")+_24+_25); /* 26 = 14..25 */
  const _27 = R(nb("d27"));                                  /* 27 */
  const _28 = R(nb("d28_32AC"));                             /* 28 = 32AC deduction */
  const _29 = R(esr.totExcess);                             /* 29 = ESR x(4) (A212) */
  const _30 = R(nb("d30")), _31 = R(nb("d31")), _32 = R(nb("d32"));
  const _33 = R(feed.dec33);                                 /* 33 = OI 3b + 4e */
  const _34 = R(_27+_28+_29+_30+_31+_32+_33);                /* 34 = 27..33 */
  const _35 = R(_13+_26-_34);                                /* 35 = 13 + 26 - 34 */
  const _36 = Math.max(0, R(nb("dp44AE")+nb("dp44B")+nb("dp44BB")+nb("dp44BBA")+nb("dp44BBB")+
    nb("dp44BBC")+nb("dp44BBD")+nb("dp44D")+nb("dp44DA")+nb("dpXIIG")+nb("dpFirstSch"))); /* 36x total */
  const _37 = R(_35+_36);                                    /* 37 = 35 + 36x */
  const _38f = _37;                                          /* 38f = item 37 */
  const A38 = R(nb("r38a")+nb("r38b")+nb("r38c")+nb("r38d")+nb("r38e")+_38f); /* A38 */
  const _agri = R(_4c - (nb("r38a")+nb("r38b")+nb("r38c")+nb("r38d")+nb("r38e"))); /* BalIncDeemedFrmAgri */

  /* ================= Part B — speculative ================= */
  const _40 = _2a;                                           /* 40 = 2a */
  const _41 = R(nb("s41")), _42 = R(nb("s42"));
  const B43 = R(_40+_41-_42);                                /* B43 = 40 + 41 - 42 */

  /* ================= Part C — specified 35AD ================= */
  const _44 = _2b;                                           /* 44 = 2b */
  const _45 = R(nb("sp45")), _46 = R(nb("sp46"));
  const _47 = R(_44+_45-_46);                                /* 47 = 44 + 45 - 46 */
  const _48 = bpWeightedBarred()?0:R(nb("sp48"));            /* 48 = 35AD(1) deduction (A255) */
  const C49 = R(_47-_48);                                    /* C49 = 47 - 48 */

  /* ================= Part D ================= */
  const D = R(A38 + Math.max(0,B43) + Math.max(0,C49));      /* D = A38 + B43 + C49 (losses -> CFL) */

  /* ================= Part E — intra-head set off ================= */
  const lossSetOff = Math.abs(Math.min(0, A38));            /* (i) loss to set off */
  const specInc = Math.max(0, B43);                          /* (ii) */
  const specifiedInc = Math.max(0, C49);                     /* (iii) */
  const lifeInc = 0;                                         /* (iv) 115B life insurance (not built) */
  const diamondInc = Math.max(0, _4d);                       /* (iva) 10TIA raw diamond */
  let rem=lossSetOff;
  const specSet = Math.min(rem, specInc); rem-=specSet;
  const specifiedSet = Math.min(rem, specifiedInc); rem-=specifiedSet;
  const lifeSet = Math.min(rem, lifeInc); rem-=lifeSet;
  const diamondSet = Math.min(rem, diamondInc); rem-=diamondSet;
  const totSet = R(specSet+specifiedSet+lifeSet+diamondSet); /* (v) */
  const lossRemain = R(Math.max(0, lossSetOff-totSet));      /* (vi) = (i) - (v) */

  /* ================= Schedule-SI feed (special-rate BP heads) =================
     70_sec_si.js consumes S.C.bp.siFeed keyed by the schema SecCode (book
     SI.md §2/§3/§6). Each value is the already-computed BP income (a plain
     number); si.js supplies the statutory rate from its own SI_RATE_DEF
     (5B=12.5, 5BBF_BP=10, 5BBG_BP=10, 5BBH_BP=30) and computes the tax.
        5B      115B — profits & gains of life insurance business <- item 4b (A237)
        5BBF_BP 115BBF — patent royalty, business income          <- item 3d (A615)
        5BBG_BP 115BBG — carbon credits, business income          <- item 3e (A614)
        5BBH_BP 115BBH — VDA, business income                     <- item 3f (A623)
     Amounts are REUSED from the BP ladder above (not recomputed). A head is
     emitted only when its income is positive — a nil / loss head carries no
     special-rate income and so contributes no SI row. */
  const siFeed={};
  const si5B   = R(_4b);            /* item 4b — 115B life insurance profit */
  const si5BBF = R(nb("a3d"));      /* item 3d — 115BBF patent (business)   */
  const si5BBG = R(nb("a3e"));      /* item 3e — 115BBG carbon (business)   */
  const si5BBH = R(nb("a3f"));      /* item 3f — 115BBH VDA (business)      */
  if(si5B>0)   siFeed["5B"]=si5B;
  if(si5BBF>0) siFeed["5BBF_BP"]=si5BBF;
  if(si5BBG>0) siFeed["5BBG_BP"]=si5BBG;
  if(si5BBH>0) siFeed["5BBH_BP"]=si5BBH;

  S.C.bp = {
    on:true,
    a:{K1,_2a,_2b,_3c,sum3,_4a,_4b,_4c,_4d,_5ciii,_5d,_5A,_6,_9,_10,_11,_12i,_12ii,_12iii,_13,
       _20,_21,_24c,_24,_25,_26,_27,_28,_29,_33,_34,_35,_36,_37,_38f,A38,_agri},
    b:{_40,_41,_42,B43},
    c:{_44,_45,_46,_47,_48,C49},
    d:D,
    e:{lossSetOff,specInc,specifiedInc,lifeInc,diamondInc,specSet,specifiedSet,lifeSet,diamondSet,totSet,lossRemain},
    feed:feed,
    dcg:dcg,     /* published for the CG section (S.C.bp.dcg) */
    siFeed:siFeed, /* special-rate BP heads for Schedule SI (S.C.bp.siFeed) */
    /* Head-wise split consumed by the loss section (CYLA/BFLA: busExcl/spec/specified/b115)
       and the tax section (Part B-TI item 2: noSpec/spec/specified). Without these the
       consumers fell back to `income` (= D, the LUMP A38+B43+C49) for "business excl"
       and 0 for speculative/specified — so the speculative (B43) and specified (C49)
       income never reached their own CYLA/BFLA rows or Part B-TI 2ii/2iii, blocking the
       brought-forward speculative/specified loss set-off (rules A510/A511/A520/A568/
       A722/A742/A743). Values are Table-E item 3 (income of the head after the current-
       year intra-head business-loss set-off), which the rules tie to. */
    busExcl:A38, noSpec:A38,
    spec:R(specInc-specSet), specified:R(specifiedInc-specifiedSet), b115:R(lifeInc-lifeSet),
    income:D
  };
}

/* =====================================================================
   RENDERER
   ===================================================================== */
function rBP(label,right,ref,o){o=o||{};o.ref=ref;return row(label,right,o);}
function inpN(p){return inp(p,{n:1});}

function secBp(){
  const A=(S.C.bp&&S.C.bp.a)||{}, Bp=(S.C.bp&&S.C.bp.b)||{}, Cp=(S.C.bp&&S.C.bp.c)||{}, E=(S.C.bp&&S.C.bp.e)||{};
  const conc=bpConc(), barredW=bpWeightedBarred(), depBar=bpDepBarred();
  let h="";
  h+=formNote("Schedule BP is the spine of the company return — a computed adjustment ladder that turns "+
    "book profit into taxable business income. Most lines carry forward from Schedule P&L, the Trading / "+
    "Manufacturing accounts, Part A-OI and Schedules DEP/ESR/ICDS — enter each figure as it appears there. "+
    "The free entries are the 5c exempt-income table and the 35AD(5) clause. Depreciation (DPM/DOA), its "+
    "summary (DEP/DCG), ESR and ICDS are the sub-schedules below and feed this ladder automatically.");
  if(conc)h+=note("Concessional regime <b>"+esc(conc)+"</b> opted: "+
    (depBar?"additional depreciation is nil and the 45% plant &amp; machinery block claims no depreciation (A274/A275)":"")+
    (barredW?(depBar?"; ":"")+"the ESR weighted deductions [35(1)(ii)/(iia)/(iii)/35(2AA)/35CCC] and the 35AD(1) deduction are closed (A255)":"")+".","warn");

  /* ---- Part A ---- */
  h+=sub("A — Business other than speculative & specified business");
  h+=rBP("1  Profit before tax as per statement of P&L (53, 61(ii), 62(b) of Part A-P&L)",inpN("bp.pbt"),"A1");
  h+=rBP("2a  Net profit/loss from speculative business included in 1",inpN("bp.nplSpec"),"A2a",{hint:"enter −ve for a loss (Sl. 12b of Trading Account)"});
  h+=rBP("2b  Net profit/loss from specified business u/s 35AD included in 1",inpN("bp.nplSpecified"),"A2b",{hint:"enter −ve for a loss"});
  h+=sub("3 — Income credited to P&L considered under other heads / 115BBF-G-H");
  h+=rBP("3a  House Property",inpN("bp.a3a"),"A3a",{ind:1});
  h+=rBP("3b  Capital Gains",inpN("bp.a3b"),"A3b",{ind:1});
  h+=rBP("3c(i)  Dividend income",inpN("bp.a3ci"),"A3ci",{ind:1});
  h+=rBP("3c(ii)  Other than dividend income",inpN("bp.a3cii"),"A3cii",{ind:1});
  h+=rBP("3c  Other sources (3c(i)+3c(ii))",cell(A._3c),"A3c",{ind:1});
  h+=rBP("3d  u/s 115BBF",inpN("bp.a3d"),"A3d",{ind:1});
  h+=rBP("3e  u/s 115BBG",inpN("bp.a3e"),"A3e",{ind:1});
  h+=rBP("3f  u/s 115BBH (net of cost of acquisition)",inpN("bp.a3f"),"A3f",{ind:1});
  h+=sub("4a — Profit incl. in 1 referred to 44AE/44B/44BB/44BBA/44BBB/44BBC/44BBD/44D/44DA/Ch-XII-G/First Schedule (other than 115B)");
  [["p44AE","44AE"],["p44B","44B"],["p44BB","44BB"],["p44BBA","44BBA"],["p44BBB","44BBB"],
   ["p44BBC","44BBC"],["p44BBD","44BBD"],["p44D","44D"],["p44DA","44DA"],
   ["pXIIG","Chapter-XII-G"],["pFirstSch","First Schedule (other than 115B)"]].forEach(x=>
     h+=rBP("4a · "+x[1],inpN("bp."+x[0]),"",{ind:1,hint:"enter −ve for a loss"}));
  h+=rBP("4a  Total",cell(A._4a),"A4a");
  h+=rBP("4b  Profit and gains from life insurance business u/s 115B",inpN("bp.p115B"),"A4b");
  h+=sub("4c — Profit from activities covered under rule 7, 7A, 7B(1), 7B(1A) and 8");
  [["r7","Rule 7"],["r7A","Rule 7A"],["r7B1","Rule 7B(1)"],["r7B1A","Rule 7B(1A)"],["r8","Rule 8"]].forEach(x=>
     h+=rBP("4c · "+x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("4c  Total (TotalProfitFrmActCvrd)",cell(A._4c),"A4c");
  h+=rBP("4d  Profit from eligible business of selling raw diamonds (rule 10TIA)",inpN("bp.pElig10TIA"),"A4d");
  h+=sub("5 — Income credited to P&L (included in 1) which is exempt");
  h+=rBP("5a  Share of income from firm(s)",inpN("bp.a5a"),"A5a");
  h+=rBP("5b  Share of income from AOP/BOI",inpN("bp.a5b"),"A5b");
  h+=rBP("5c  Dividend income (exempt)",inpN("bp.divExempt"),"A5c");
  h+=grid("bp.othExempt",[{k:"name",h:"Nature of other exempt income",t:"txt",w:"60%"},{k:"amt",h:"Amount",t:"num",w:"30%"}],
    (S.bp&&S.bp.othExempt)||[],{empty:"No other exempt income.",add:"Add exempt income"});
  h+=rBP("5c iv  Total (dividend + other)",cell(A._5ciii),"A5civ");
  h+=rBP("5d  Total exempt income (5a+5b+5c)",cell(A._5d),"A5d");
  h+=rBP("5A  Income/receipts credited to P&L but not chargeable to tax",inpN("bp.a5A"),"A5A");
  h+=rBP("6  Balance (1 − 2a − 2b − 3a…3f − 4a − 4b − 4c − 4d − 5d − 5A)",cell(A._6),"A6");
  h+=sub("7/8 — Expenses debited to P&L under other heads / exempt / 14A");
  [["e7a","7a House Property"],["e7b","7b Capital Gains"],["e7c","7c Other Sources"],
   ["e7d","7d u/s 115BBF"],["e7e","7e u/s 115BBG"]].forEach(x=>
     h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("7f  u/s 115BBH (other than cost of acquisition)",cell(0),"A7f",{ind:1,hint:"sheet row with no schema key — not separately filed"});
  h+=rBP("8a  Expenses relating to exempt income",inpN("bp.e8a"),"A8a",{ind:1});
  h+=rBP("8b  Expenses relating to exempt income disallowed u/s 14A (16 of Part A-OI)",inpN("bp.e8b"),"A8b",{ind:1});
  h+=rBP("9  Total (7a…7e + 8a + 8b)",cell(A._9),"A9");
  h+=rBP("10  Adjusted profit or loss (6 + 9)",cell(A._10),"A10");
  h+=rBP("11  Depreciation & amortization debited to P&L",inpN("bp.depDebPL"),"A11");
  h+=rBP("12i  Depreciation allowable u/s 32(1)(ii) & (iia) — column 6 of Schedule DEP",cell(A._12i),"A12i");
  h+=rBP("12ii  Depreciation allowable u/s 32(1)(i) (Appendix-IA; power sector)",inpN("bp.dep32_1_i"),"A12ii");
  h+=rBP("12iii  Total (12i + 12ii)",cell(A._12iii),"A12iii");
  h+=rBP("13  Profit/loss after adjustment for depreciation (10 + 11 − 12iii)",cell(A._13),"A13");
  h+=sub("14–25 — Amounts to be added back");
  [["d14","14 disallowable u/s 36 (6s of OI)"],["d15","15 disallowable u/s 37 (7k of OI)"],
   ["d16","16 disallowable u/s 40 (8Aj of OI)"],["d17","17 disallowable u/s 40A (9f of OI)"],
   ["d18","18 disallowable u/s 43B (11i of OI)"],["d19","19 interest disallowed u/s 23 MSMED Act (17 of OI)"],
   ["deem41","20 deemed income u/s 41"]].forEach(x=>h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=sub("21 — Deemed income u/s 32AC/32AD/33AB/33ABA/35ABA/35ABB/35AC/40A(3A)/33AC/72A/80HHD/80-IA");
  [["d21_32AC","21a 32AC"],["d21_32AD","21b 32AD"],["d21_33AB","21c 33AB"],["d21_33ABA","21d 33ABA"],
   ["d21_35ABA","21e 35ABA"],["d21_35ABB","21f 35ABB"],["d21_35AC","21g 35AC"],["d21_40A3A","21h 40A(3A)"],
   ["d21_33AC","21i 33AC"],["d21_72A","21j 72A"],["d21_80HHD","21k 80HHD"],["d21_80IA","21l 80-IA"]].forEach(x=>
     h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("21  Total deemed income (only the total is filed)",cell(A._21),"A21");
  h+=rBP("22  Deemed income u/s 43CA",inpN("bp.d22"),"A22",{ind:1});
  h+=rBP("23  Any other item of addition u/s 28 to 44DB",inpN("bp.d23"),"A23",{ind:1});
  h+=sub("24 — Any other income not in P&L / expense not allowable");
  h+=rBP("24a  Commission",inpN("bp.i24a"),"A24a",{ind:1});
  h+=rBP("24b  Interest",inpN("bp.i24b"),"A24b",{ind:1});
  h+=rBP("24c  Others (ESR 35-deduction shortfall added automatically)",inp("bp.i24c",{n:1}),"A24c",
    {ind:1,v2:cell(A._24c),hint:"typed part + Schedule ESR shortfall (A235)"});
  h+=rBP("24  Total (24a + 24b + 24c)",cell(A._24),"A24");
  h+=rBP("25  Increase in profit on account of ICDS / stock valuation (3a + 4d of Part A-OI)",cell(A._25),"A25",
    {hint:"fed from Part A-OI 3a (Schedule ICDS increase) + 4d (145A stock deviation)"});
  h+=rBP("26  Total (14 … 25)",cell(A._26),"A26");
  h+=sub("27–33 — Amounts to be deducted");
  h+=rBP("27  Deduction allowable u/s 32(1)(iii)",inpN("bp.d27"),"A27",{ind:1});
  h+=rBP("28  Amount allowable as deduction u/s 32AC",inpN("bp.d28_32AC"),"A28",{ind:1});
  h+=rBP("29  Deduction u/s 35/35CCC/35CCD in excess of amount debited — x(4) of Schedule ESR",cell(A._29),"A29",{ind:1});
  h+=rBP("30  Amount disallowed u/s 40 in earlier year, now allowable (8B of OI)",inpN("bp.d30"),"A30",{ind:1});
  h+=rBP("31  Amount disallowed u/s 43B in earlier year, now allowable (10i of OI)",inpN("bp.d31"),"A31",{ind:1});
  h+=rBP("32  Any other amount allowable as deduction",inpN("bp.d32"),"A32",{ind:1});
  h+=rBP("33  Decrease in profit on account of ICDS / stock valuation (3b + 4e of Part A-OI)",cell(A._33),"A33",
    {hint:"fed from Part A-OI 3b (Schedule ICDS decrease) + 4e (145A stock deviation)"});
  h+=rBP("34  Total (27 … 33)",cell(A._34),"A34");
  h+=rBP("35  Income (13 + 26 − 34)",cell(A._35),"A35");
  h+=sub("36 — Profits/gains deemed to be under presumptive sections");
  [["dp44AE","36i 44AE (61(ii) of P&L)"],["dp44B","36ii 44B"],["dp44BB","36iii 44BB"],
   ["dp44BBA","36iv 44BBA"],["dp44BBB","36v 44BBB"],["dp44BBC","36va 44BBC"],["dp44BBD","36vb 44BBD"],
   ["dp44D","36vi 44D"],["dp44DA","36vii 44DA"],["dpXIIG","36viii Chapter-XII-G"],
   ["dpFirstSch","36ix First Schedule (other than 115B)"]].forEach(x=>h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("36x  Total (36i to 36ix)",cell(A._36),"A36x");
  h+=rBP("37  Net profit/loss other than speculative & specified (35 + 36x)",cell(A._37),"A37");
  h+=sub("38 — after rule 7A/7B/8");
  [["r38a","38a Income chargeable under Rule 7"],["r38b","38b Deemed chargeable income under Rule 7A"],
   ["r38c","38c Deemed chargeable income under Rule 7B(1)"],["r38d","38d Deemed chargeable income under Rule 7B(1A)"],
   ["r38e","38e Deemed chargeable income under Rule 8"]].forEach(x=>h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("38f  Income other than Rule 7A, 7B & 8 (item 37)",cell(A._38f),"A38f",{ind:1});
  h+=rBP("A38  Net P/L after rule 7A/7B/8 (38a…38f)",cell(A.A38),"A38",{hint:"if loss → 2i of Schedule CYLA / CFL"});
  h+=rBP("Balance income deemed to be from agriculture (4c − 38a…38e)",cell(A._agri),"A38agri");

  /* ---- Part B ---- */
  h+=sub("B — Speculative business");
  h+=rBP("40  Net P/L from speculative business as per P&L (item 2a)",cell(Bp._40),"B40");
  h+=rBP("41  Additions in accordance with section 28 to 44DB",inpN("bp.s41"),"B41");
  h+=rBP("42  Deductions in accordance with section 28 to 44DB",inpN("bp.s42"),"B42");
  h+=rBP("B43  Income from speculative business (40 + 41 − 42)",cell(Bp.B43),"B43",{hint:"if loss → 6xix of Schedule CFL"});

  /* ---- Part C ---- */
  h+=sub("C — Specified business under section 35AD");
  h+=rBP("44  Net P/L from specified business as per P&L (item 2b)",cell(Cp._44),"C44");
  h+=rBP("45  Additions in accordance with section 28 to 44DB",inpN("bp.sp45"),"C45");
  h+=rBP("46  Deductions u/s 28 to 44DB (other than 35AD / 32 or 35 on which 35AD claimed)",inpN("bp.sp46"),"C46");
  h+=rBP("47  Profit/loss from specified business (44 + 45 − 46)",cell(Cp._47),"C47");
  if(barredW) h+=rBP("48  Deductions in accordance with section 35AD(1)",cell(0),"C48",
    {hint:"closed by "+esc(bpConc())+" — the 35AD deduction cannot be claimed (A255)"});
  else        h+=rBP("48  Deductions in accordance with section 35AD(1)",inpN("bp.sp48"),"C48");
  h+=rBP("C49  Income from specified business (47 − 48)",cell(Cp.C49),"C49",{hint:"if loss → 7xix of Schedule CFL"});
  h+=rBP("Relevant clause of s.35AD(5) (row 1)",sel("bp.clause.0",BP_35AD5),"35AD(5)");
  h+=rBP("Relevant clause of s.35AD(5) (row 2)",sel("bp.clause.1",BP_35AD5),"35AD(5)");

  /* ---- Part D & E ---- */
  h+=sub("D & E — Chargeable income and intra-head set off");
  h+=rBP("D  Income chargeable under 'Profits and gains from Business or profession' (A38 + B43 + C49)",cell(S.C.bp?S.C.bp.d:0),"D");
  h+=rBP("E(i)  Business loss of current year to be set off",cell(E.lossSetOff),"E i");
  h+=rBP("E(ii)  Income from speculative business",cell(E.specInc),"E ii",{v2:cell(E.specSet)});
  h+=rBP("E(iii)  Income from specified business",cell(E.specifiedInc),"E iii",{v2:cell(E.specifiedSet)});
  h+=rBP("E(iv)  Profit and gains from life insurance business u/s 115B",cell(E.lifeInc),"E iv",{v2:cell(E.lifeSet)});
  h+=rBP("E(iva)  Income of foreign company from raw-diamond business (rule 10TIA)",cell(E.diamondInc),"E iva",{v2:cell(E.diamondSet)});
  h+=rBP("E(v)  Total loss set off (ii + iii + iv + iva)",cell(E.totSet),"E v");
  h+=rBP("E(vi)  Loss remaining after set off (i − v)",cell(E.lossRemain),"E vi");
  h+=note("Note: include the income of the specified persons referred to in Schedule SPI while computing income under this head.");

  /* ---- Sub-schedules ---- */
  h+=depFold();
  h+=esrFold();
  h+=icdsFold();
  return h;
}

/* ---- DPM/DOA/DEP/DCG fold ---- */
function bpBlockCol(base,blk,opts){
  opts=opts||{};
  const c=n=>'<td class="num">'+cell(n)+'</td>';
  const iN=k=>'<td>'+inp(base+"."+k,{n:1})+'</td>';
  let h='';
  h+='<tr><td class="l">3 WDV on first day</td>'+iN("WDVFirstDay")+'</tr>';
  h+='<tr><td class="l">4 Additions ≥180 days</td>'+iN("AdditionsGrThan180Days")+'</tr>';
  h+='<tr><td class="l">5 Realization out of 3 or 4</td>'+iN("RealizationTotalPeriod")+'</tr>';
  h+='<tr><td class="l">6 Amount at full rate (3+4−5)</td>'+c(blk.fullAmt)+'</tr>';
  if(opts.half!==false){
    h+='<tr><td class="l">7 Additions <180 days</td>'+iN("AdditionsLessThan180Days")+'</tr>';
    h+='<tr><td class="l">8 Realization out of 7</td>'+iN("RealizationPeriodDuringYear")+'</tr>';
    h+='<tr><td class="l">9 Amount at half rate (7−8)</td>'+c(blk.halfAmt)+'</tr>';
  }
  h+='<tr><td class="l">10 Depreciation at full rate</td>'+c(blk.depFull)+'</tr>';
  if(opts.half!==false)h+='<tr><td class="l">11 Depreciation at half rate</td>'+c(blk.depHalf)+'</tr>';
  if(opts.addl!==false){
    if(bpDepBarred()){
      h+='<tr><td class="l">12–14 Additional depreciation</td><td class="num">'+cell(0)+' <span class="hint">closed by '+esc(bpConc())+'</span></td></tr>';
    }else{
      h+='<tr><td class="l">12 Additional depr. on 4</td>'+iN("AddlnDeprOnGT180DayAdditions")+'</tr>';
      h+='<tr><td class="l">13 Additional depr. on 7</td>'+iN("AddlnDeprDuringYearAdditions")+'</tr>';
      h+='<tr><td class="l">14 Additional depr. (prec. yr, <180 days)</td>'+iN("AddlnDeprOnLessThan180DayAdditions")+'</tr>';
    }
  }
  h+='<tr><td class="l">'+(opts.half!==false?"15":"12")+' Total depreciation</td>'+c(blk.totDep)+'</tr>';
  h+='<tr><td class="l">Depreciation disallowed u/s 38(2)</td>'+iN("DepDisAllowUs38_2")+'</tr>';
  h+='<tr><td class="l">Net aggregate depreciation</td>'+c(blk.netAgg)+'</tr>';
  h+='<tr><td class="l">Proportionate depreciation (succession etc.)</td>'+iN("ProportionateAggDepreciation")+'</tr>';
  h+='<tr><td class="l">Expenditure on transfer of asset</td>'+iN("ExpdrOnTrforSaleAsset")+'</tr>';
  h+='<tr><td class="l">Capital gains u/s 50 (5+8−3−4−7−exp)</td>'+c(blk.cg50)+'</tr>';
  h+='<tr><td class="l">WDV on last day</td>'+c(blk.wdvLast)+'</tr>';
  return h;
}
function bpBlockTable(title,base,blk,opts){
  return '<div class="full"><table class="gt" style="min-width:520px"><thead><tr>'+
    '<th class="l">'+esc(title)+'</th><th style="width:200px">Amount</th></tr></thead><tbody>'+
    bpBlockCol(base,blk,opts)+'</tbody></table></div>';
}
function depFold(){
  const D=S.C.dpm||{}, O=S.C.doa||{}, dep=S.C.dep||{}, dcg=S.C.dcg||{};
  let inner="";
  inner+=note("The company enters, per block, the opening WDV, additions, realizations, additional depreciation, "+
    "the s.38(2) disallowance and transfer expenditure; every green cell is computed. Under 115BA/115BAA/115BAB "+
    "additional depreciation is nil and the 45% plant block claims no depreciation (A274/A275).","");
  inner+=sub("Schedule DPM — Plant & machinery");
  inner+=bpBlockTable("Rate 15%","dpm.r15",D.r15||{},{});
  inner+=bpBlockTable("Rate 30%","dpm.r30",D.r30||{},{});
  inner+=bpBlockTable("Rate 40%","dpm.r40",D.r40||{},{});
  inner+=bpBlockTable("Rate 45% (no half-rate / additional)","dpm.r45",D.r45||{},{half:false,addl:false});
  inner+=sub("Schedule DOA — Other assets");
  inner+='<div class="full"><table class="gt" style="min-width:420px"><thead><tr><th class="l">Land (Nil rate)</th><th style="width:200px">Amount</th></tr></thead><tbody>'+
    '<tr><td class="l">3 WDV on first day</td><td>'+inp("doa.land.WDVFirstDay",{n:1})+'</td></tr>'+
    '<tr><td class="l">WDV on last day</td><td class="num">'+cell((O.land||{}).wdvLast)+'</td></tr></tbody></table></div>';
  inner+=bpBlockTable("Building @ 5%","doa.b5",O.b5||{},{addl:false});
  inner+=bpBlockTable("Building @ 10%","doa.b10",O.b10||{},{addl:false});
  inner+=bpBlockTable("Building @ 40%","doa.b40",O.b40||{},{addl:false});
  inner+=bpBlockTable("Furniture & Fittings @ 10%","doa.furn",O.furn||{},{addl:false});
  inner+=bpBlockTable("Intangible assets @ 25%","doa.intang",O.intang||{},{addl:false});
  inner+=bpBlockTable("Ships @ 20%","doa.ships",O.ships||{},{addl:false});
  inner+=sub("Schedule DEP — Summary of depreciation (computed)");
  inner+=bpSummaryTable([["1a P&M @15%",dep.pm15],["1b P&M @30%",dep.pm30],["1c P&M @40%",dep.pm40],
    ["1d P&M @45%",dep.pm45],["1e Total P&M",dep.totPM],["2a Building @5%",dep.b5],["2b Building @10%",dep.b10],
    ["2c Building @40%",dep.b40],["2d Total building",dep.totBld],["3 Furniture & fittings",dep.furn],
    ["4 Intangible assets",dep.intang],["5 Ships",dep.ships],["Total depreciation → BP 12i",dep.total]]);
  inner+=sub("Schedule DCG — Deemed capital gains u/s 50 (computed) → Schedule CG");
  inner+=bpSummaryTable([["1a P&M @15%",dcg.pm15],["1b P&M @30%",dcg.pm30],["1c P&M @40%",dcg.pm40],
    ["1d P&M @45%",dcg.pm45],["1e Total P&M",dcg.totPM],["2a Building @5%",dcg.b5],["2b Building @10%",dcg.b10],
    ["2c Building @40%",dcg.b40],["2d Total building",dcg.totBld],["3 Furniture & fittings",dcg.furn],
    ["4 Intangible assets",dcg.intang],["5 Ships",dcg.ships],["Total deemed capital gains → Schedule CG",dcg.total]]);
  return fold("bp_dep","DPM · DOA · DEP · DCG","Depreciation & deemed capital gains",
    (dep.total?"Depreciation "+RS(dep.total):"Not entered"),inner);
}
function bpSummaryTable(rows){
  return '<div class="full"><table class="gt" style="min-width:420px"><thead><tr><th class="l">Item</th>'+
    '<th style="width:200px">Amount</th></tr></thead><tbody>'+
    rows.map(r=>'<tr><td class="l">'+esc(r[0])+'</td><td class="num">'+cell(r[1])+'</td></tr>').join("")+
    '</tbody></table></div>';
}

/* ---- ESR fold ---- */
function esrFold(){
  const esr=S.C.esr||{rows:{}};
  const barredW=bpWeightedBarred();
  let rows='';
  ESR_ROWS.forEach(r=>{
    const o=esr.rows[r[0]]||{};
    const allowCell=(barredW&&r[3])
      ?(cell(0)+' <span class="hint">closed by '+esc(bpConc())+'</span>')
      :inp("esr."+r[0]+".allow",{n:1});
    rows+='<tr><td class="l">'+esc(r[0])+'</td><td class="l">'+esc(r[1])+'</td>'+
      '<td>'+inp("esr."+r[0]+".deb",{n:1})+'</td>'+
      '<td>'+allowCell+'</td>'+
      '<td class="num">'+cell(o.excess)+'</td></tr>';
  });
  rows+='<tr><td class="l"></td><td class="l"><b>x Total</b></td><td class="num">'+cell(esr.totDeb)+
    '</td><td class="num">'+cell(esr.totAllow)+'</td><td class="num">'+cell(esr.totExcess)+'</td></tr>';
  const inner=note("Column (4) = MAX(0, (3) − (2)) per row; its total (x4) feeds Schedule BP item 29. The shortfall "+
    "MAX((2) − (3), 0), summed across rows ("+RS(esr.shortfall)+"), feeds BP item 24(c). Weighted deductions "+
    "u/s 35(1)(ii)/(iia)/(iii)/35(2AA)/35CCC (col 3) are closed under 115BAA/115BAB (A255). Schedule RA is "+
    "mandatory if any deduction is claimed under 35(1)(ii)/(iia)/(iii)/(2AA).")+
    '<div class="full"><table class="gt" style="min-width:640px"><thead><tr><th class="l" style="width:60px">Sl</th>'+
    '<th class="l">Section</th><th style="width:150px">(2) Debited to P&L</th>'+
    '<th style="width:150px">(3) Allowable</th><th style="width:150px">(4)=(3)−(2)</th></tr></thead><tbody>'+
    rows+'</tbody></table></div>';
  return fold("bp_esr","ESR","Expenditure on scientific research (s.35/35CCC/35CCD)",
    (esr.totExcess||esr.shortfall?"Excess "+RS(esr.totExcess):"Not claimed"),inner);
}

/* ---- ICDS fold ---- */
function icdsFold(){
  const icds=S.C.icds||{rows:{}};
  let rows='';
  ICDS_ROWS.forEach(r=>{
    const o=icds.rows[r[0]]||{};
    rows+='<tr><td class="l">'+esc(r[1])+'</td><td class="l">'+esc(r[2])+'</td>'+
      '<td>'+inp("icds."+r[0]+".inc",{n:1})+'</td>'+
      '<td>'+inp("icds."+r[0]+".dec",{n:1})+'</td>'+
      '<td class="num">'+cell(o.net)+'</td></tr>';
  });
  rows+='<tr><td class="l">XI</td><td class="l"><b>Total effect (I…X)</b></td><td class="num">'+cell(icds.total)+
    '</td><td class="num">'+cell(icds.deTotal)+'</td><td class="num">'+cell(icds.totNet)+'</td></tr>';
  const inner=note("Effect of the ten ICDS on profit. Net Effect (5) = Increase (3) − Decrease (4). The total "+
    "increase XI(3) feeds Part A-OI 3a and the total decrease XI(4) feeds OI 3b; OI 3a/3b then feed Schedule BP "+
    "items 25 and 33. Keep the 145A change-in-stock-valuation deviation on Part A-OI 4d/4e, not here.")+
    '<div class="full"><table class="gt" style="min-width:620px"><thead><tr><th class="l" style="width:60px">Sl</th>'+
    '<th class="l">ICDS</th><th style="width:140px">Increase (+)</th><th style="width:140px">Decrease (−)</th>'+
    '<th style="width:140px">Net Effect</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  return fold("bp_icds","ICDS","Income Computation & Disclosure Standards",
    (icds.total||icds.deTotal?"Net "+RS(icds.totNet):"No effect"),inner);
}

/* =====================================================================
   EXPORT
   ===================================================================== */
function expBp(j){
  const A=(S.C.bp&&S.C.bp.a)||{}, Bp=(S.C.bp&&S.C.bp.b)||{}, Cp=(S.C.bp&&S.C.bp.c)||{}, E=(S.C.bp&&S.C.bp.e)||{};
  const B=S.bp||{};
  const P="CorpScheduleBP.BusinessIncOthThanSpec.";
  /* Part A */
  put(j,P+"ProfBfrTaxPL",sg(A.K1));
  put(j,P+"NetPLFromSpecBus",sg(A._2a));
  put(j,P+"NetProfLossSpecifiedBus",sg(A._2b));
  put(j,P+"IncRecCredPLOthHeadDtls.HouseProperty",n0(B.a3a));
  put(j,P+"IncRecCredPLOthHeadDtls.CapitalGains",n0(B.a3b));
  put(j,P+"IncRecCredPLOthHeadDtls.OtherSources",n0(A._3c));
  put(j,P+"IncRecCredPLOthHeadDtls.Dividend",n0(B.a3ci));
  put(j,P+"IncRecCredPLOthHeadDtls.OtherThanDividend",n0(B.a3cii));
  put(j,P+"IncRecCredPLOthHeadDtls.UnderSec115BBF",n0(B.a3d));
  put(j,P+"IncRecCredPLOthHeadDtls.UnderSec115BBG",n0(B.a3e));
  put(j,P+"PLUs44sChapXIIGOthrUs115B",n0(B.a3f));         /* 3f 115BBH */
  const IR="ProfitLossInclRefrdSec.";
  put(j,P+IR+"ProfitLossUs44AE",sg(B.p44AE)); put(j,P+IR+"ProfitLossUs44B",sg(B.p44B));
  put(j,P+IR+"ProfitLossUs44BB",sg(B.p44BB)); put(j,P+IR+"ProfitLossUs44BBA",sg(B.p44BBA));
  put(j,P+IR+"ProfitLossUs44BBB",sg(B.p44BBB)); put(j,P+IR+"ProfitLossUs44BBC",sg(B.p44BBC));
  put(j,P+IR+"ProfitLossUs44BBD",sg(B.p44BBD)); put(j,P+IR+"ProfitLossUs44D",sg(B.p44D));
  put(j,P+IR+"ProfitLossUs44DA",sg(B.p44DA)); put(j,P+IR+"ProfitChapterXIIG",sg(B.pXIIG));
  put(j,P+IR+"FirstSchITActOthr115B",sg(B.pFirstSch));
  put(j,P+"PLUs44sChapXIIGUs115B",sg(B.p115B));            /* 4b */
  put(j,P+"TotalProfitFrmActCvrd",n0(A._4c));              /* 4c total */
  put(j,P+"ProfitFrmEligBus10TIA",n0(B.pElig10TIA));       /* 4d */
  const PF="ProfitFrmActCvrd.";
  put(j,P+PF+"ProfitFrmActCvrdUndrRule7",n0(B.r7));
  put(j,P+PF+"ProfitFrmActCvrdUndrRule7A",n0(B.r7A));
  put(j,P+PF+"ProfitFrmActCvrdUndrRule7B1",n0(B.r7B1));
  put(j,P+PF+"ProfitFrmActCvrdUndrRule7B1A",n0(B.r7B1A));
  put(j,P+PF+"ProfitFrmActCvrdUndrRule8",n0(B.r8));
  put(j,P+"IncCredPL.FirmShareInc",n0(B.a5a));
  put(j,P+"IncCredPL.AOPBOISharInc",n0(B.a5b));
  put(j,P+"IncCredPL.OthExempInc",n0(A._5ciii));
  put(j,P+"IncCredPL.TotExempInc",n0(A._5d));
  /* 5c exempt-income detail (Dividend name/amount + other rows) */
  const oth=(B.othExempt||[]).filter(r=>N(r.amt)||st0(r.name)).map(r=>({OperatingRevenueName:sv(r.name),OperatingRevenueAmt:n0(r.amt)}));
  /* OtherExmptIncDtl requires OperatingDividendName(enum "Dividend")+OperatingDividendAmt(min 0); build whole so put cannot drop amt 0 */
  if(n0(B.divExempt)||oth.length){
    var oed={OperatingDividendName:"Dividend",OperatingDividendAmt:n0(B.divExempt)};
    if(oth.length)oed.OtherExmptIncDtls=oth;
    put(j,P+"IncCredPL.OtherExmptIncDtl",oed);
  }
  put(j,P+"BalancePLOthThanSpecBus",sg(A._6));
  put(j,P+"ExpDebToPLOthHeadDtls.HouseProperty",n0(B.e7a));
  put(j,P+"ExpDebToPLOthHeadDtls.CapitalGains",n0(B.e7b));
  put(j,P+"ExpDebToPLOthHeadDtls.OtherSources",n0(B.e7c));
  put(j,P+"ExpDebToPLOthHeadDtls.UnderSec115BBF",n0(B.e7d));
  put(j,P+"ExpDebToPLOthHeadDtls.UnderSec115BBG",n0(B.e7e));
  /* 7f (115BBH expense) has no schema key — not exported (dropped+logged) */
  put(j,P+"ExpDebToPLExemptInc",n0(B.e8a));
  put(j,P+"ExpDebToPLExemptIncDisAllwUs14A",n0(B.e8b));
  put(j,P+"TotExpDebPL",n0(A._9));
  put(j,P+"AdjustedPLOthThanSpecBus",sg(A._10));
  put(j,P+"DepreciationDebPLCosAct",n0(B.depDebPL));
  put(j,P+"DepreciationAllowITAct32.DepreciationAllowUs32_1_ii",n0(A._12i));
  put(j,P+"DepreciationAllowITAct32.DepreciationAllowUs32_1_i",n0(B.dep32_1_i));
  put(j,P+"DepreciationAllowITAct32.TotDeprAllowITAct",n0(A._12iii));
  put(j,P+"AdjustPLAfterDeprOthSpecInc",sg(A._13));
  put(j,P+"AmtDebPLDisallowUs36",n0(B.d14));
  put(j,P+"AmtDebPLDisallowUs37",n0(B.d15));
  put(j,P+"AmtDebPLDisallowUs40",n0(B.d16));
  put(j,P+"AmtDebPLDisallowUs40A",n0(B.d17));
  put(j,P+"AmtDebPLDisallowUs43B",n0(B.d18));
  put(j,P+"InterestDisAllowUs23SMEAct",n0(B.d19));
  put(j,P+"DeemIncUs41",n0(B.deem41));
  put(j,P+"DeemIncUs3380HHD80IA",n0(A._21));                /* item 21 — total only */
  put(j,P+"DeemIncUs43CA",n0(B.d22));
  put(j,P+"OthItemDisallowUs28To44DA",n0(B.d23));
  put(j,P+"AnyOthIncNotInclInExpDisallowPL",n0(A._24));
  put(j,P+"CommissionExpDisallowPL",n0(B.i24a));
  put(j,P+"InterestExpDisallowPL",n0(B.i24b));
  put(j,P+"OthersExpDisallowPL",n0(A._24c));                /* 24c incl. ESR shortfall */
  put(j,P+"IncProfDecLossAccICDSAdj",n0(A._25));            /* 25 = OI 3a+4d */
  put(j,P+"TotAfterAddToPLDeprOthSpecInc",sg(A._26));
  put(j,P+"DeductUs32_1_iii",n0(B.d27));
  put(j,P+"Amt32AC",n0(B.d28_32AC));                        /* 28 */
  put(j,P+"DebPLUs35ExcessAmt",n0(A._29));                  /* 29 = ESR x(4) */
  put(j,P+"AmtDisallUs40NowAllow",n0(B.d30));
  put(j,P+"AmtDisallUs43BNowAllow",n0(B.d31));
  put(j,P+"AnyOthAmtAllDeduct",n0(B.d32));
  put(j,P+"DecProfIncLossAccICDSAdj",n0(A._33));            /* 33 = OI 3b+4e */
  put(j,P+"TotDeductionAmts",n0(A._34));
  put(j,P+"PLAftAdjDedBusOthThanSpec",sg(A._35));
  const DP="DeemedProfitBusUs.";
  put(j,P+DP+"Section44AE",n0(B.dp44AE)); put(j,P+DP+"Section44B",n0(B.dp44B));
  put(j,P+DP+"Section44BB",n0(B.dp44BB)); put(j,P+DP+"Section44BBA",n0(B.dp44BBA));
  put(j,P+DP+"Section44BBB",n0(B.dp44BBB)); put(j,P+DP+"Section44BBC",n0(B.dp44BBC));
  put(j,P+DP+"Section44BBD",n0(B.dp44BBD)); put(j,P+DP+"Section44D",n0(B.dp44D));
  put(j,P+DP+"Section44DA",n0(B.dp44DA)); put(j,P+DP+"ChapterXIIG",n0(B.dpXIIG));
  put(j,P+DP+"FirstSchTActOther",n0(B.dpFirstSch)); put(j,P+DP+"TotDeemedProfitBusUs",n0(A._36));
  put(j,P+"NetPLAftAdjBusOthThanSpec",sg(A._37));
  put(j,P+"NetPLBusOthThanSpec7A7B7C",sg(A.A38));
  put(j,P+"ChrgblIncUndrRule7",n0(B.r38a));
  put(j,P+"DeemedChrgblIncUndrRule7A",n0(B.r38b));
  put(j,P+"DeemedChrgblIncUndrRule7B1",n0(B.r38c));
  put(j,P+"DeemedChrgblIncUndrRule7B1A",n0(B.r38d));
  put(j,P+"DeemedChrgblIncUndrRule8",n0(B.r38e));
  put(j,P+"IncomeOtherThanRule",sg(A._38f));
  put(j,P+"BalIncDeemedFrmAgri",n0(A._agri));
  /* Part B */
  const SB="CorpScheduleBP.SpecBusinessInc.";
  put(j,SB+"NetPLFrmSpecBus",sg(Bp._40));
  put(j,SB+"AdditionUs28to44DA",n0(B.s41));
  put(j,SB+"DeductUs28to44DA",n0(B.s42));
  put(j,SB+"AdjustedPLFrmSpecuBus",sg(Bp.B43));
  /* Part C */
  const SC="CorpScheduleBP.IncSpecifiedBusiness.";
  put(j,SC+"NetPLFrmSpecifiedBus",sg(Cp._44));
  put(j,SC+"AddSec28to44DA",n0(B.sp45));
  put(j,SC+"DedSec28to44DAOTDedSec35AD",n0(B.sp46));
  put(j,SC+"ProfitLossSpecifiedBusiness",sg(Cp._47));
  put(j,SC+"DedSec35AD1",n0(Cp._48));
  put(j,SC+"ProfitLossSpecifiedBusFinal",sg(Cp.C49));
  const clauses=(B.clause||[]).filter(c=>st0(c)).map(c=>({DedUs35ADSubSec5:c}));
  if(clauses.length)put(j,SC+"DedUs35ADSubSec5Dtls",clauses);
  /* Part D */
  put(j,"CorpScheduleBP.IncChrgUnHdProftGain",sg(S.C.bp?S.C.bp.d:0));
  /* Part E */
  const BE="CorpScheduleBP.BusSetoffCurrYr.";
  put(j,BE+"LossSetOffOnBusLoss",n0(E.lossSetOff));
  if(E.specInc){
    put(j,BE+"SpeculativeInc.IncOfCurYrUnderThatHead",n0(E.specInc));
    put(j,BE+"SpeculativeInc.BusLossSetoff",n0(E.specSet));
    put(j,BE+"SpeculativeInc.IncOfCurYrAfterSetOff",n0(E.specInc-E.specSet));
  }
  if(E.specifiedInc){
    put(j,BE+"SpecifiedInc.IncOfCurYrUnderThatHead",n0(E.specifiedInc));
    put(j,BE+"SpecifiedInc.BusLossSetoff",n0(E.specifiedSet));
    put(j,BE+"SpecifiedInc.IncOfCurYrAfterSetOff",n0(E.specifiedInc-E.specifiedSet));
  }
  if(E.lifeInc){
    put(j,BE+"ProfGainUs115B.IncOfCurYrUnderThatHead",n0(E.lifeInc));
    put(j,BE+"ProfGainUs115B.BusLossSetoff",n0(E.lifeSet));
    put(j,BE+"ProfGainUs115B.IncOfCurYrAfterSetOff",n0(E.lifeInc-E.lifeSet));
  }
  if(E.diamondInc){
    put(j,BE+"IncmForeignCompRule10TIA.IncOfCurYrUnderThatHead",n0(E.diamondInc));
    put(j,BE+"IncmForeignCompRule10TIA.BusLossSetoff",n0(E.diamondSet));
    put(j,BE+"IncmForeignCompRule10TIA.IncOfCurYrAfterSetOff",n0(E.diamondInc-E.diamondSet));
  }
  put(j,BE+"TotLossSetOffOnBus",n0(E.totSet));
  put(j,BE+"LossRemainSetOffOnBus",n0(E.lossRemain));

  /* ---- ScheduleDPM / ScheduleDOA ---- */
  const dpm=S.C.dpm||{}, doa=S.C.doa||{};
  const wrote={dpm:false,doa:false};
  function putBlock(root,src,blk,opts){
    opts=opts||{};
    const raw=src||{};
    const any=["WDVFirstDay","AdditionsGrThan180Days","RealizationTotalPeriod","AdditionsLessThan180Days",
      "RealizationPeriodDuringYear","DepDisAllowUs38_2","ProportionateAggDepreciation",
      "ExpdrOnTrforSaleAsset","AddlnDeprOnGT180DayAdditions","AddlnDeprDuringYearAdditions",
      "AddlnDeprOnLessThan180DayAdditions"].some(k=>N(raw[k]));
    if(!any && !blk.totDep && !blk.wdvLast && !blk.cg50)return false;
    const D=root+".DepreciationDetail.";
    put(j,D+"WDVFirstDay",n0(blk.wdv));
    if(opts.add180!==false)put(j,D+"AdditionsGrThan180Days",n0(blk.add180));
    put(j,D+"RealizationTotalPeriod",n0(blk.realTot));
    put(j,D+"FullRateDeprAmt",n0(blk.fullAmt));
    if(opts.half!==false){
      put(j,D+"AdditionsLessThan180Days",n0(blk.addLess));
      put(j,D+"RealizationPeriodDuringYear",n0(blk.realLess));
      put(j,D+"HalfRateDeprAmt",n0(blk.halfAmt));
    }
    put(j,D+"DepreciationAtFullRate",n0(blk.depFull));
    if(opts.half!==false)put(j,D+"DepreciationAtHalfRate",n0(blk.depHalf));
    if(opts.addl!==false&&!bpDepBarred()){
      if(N(raw.AddlnDeprOnGT180DayAdditions))put(j,D+"AddlnDeprOnGT180DayAdditions",n0(blk.addl12));
      if(N(raw.AddlnDeprDuringYearAdditions))put(j,D+"AddlnDeprDuringYearAdditions",n0(blk.addl13));
      if(N(raw.AddlnDeprOnLessThan180DayAdditions))put(j,D+"AddlnDeprOnLessThan180DayAdditions",n0(blk.addl14));
    }
    put(j,D+"TotalDepreciation",n0(blk.totDep));
    put(j,D+"DepDisAllowUs38_2",n0(blk.disallow));
    put(j,D+"NetAggregateDepreciation",n0(blk.netAgg));
    put(j,D+"ProportionateAggDepreciation",n0(blk.pro));
    put(j,D+"ExpdrOnTrforSaleAsset",n0(blk.expTr));
    put(j,D+"CapGainUs50",sg(blk.cg50));
    put(j,D+"WDVLastDay",n0(blk.wdvLast));
    return true;
  }
  [["Rate15","r15",{}],["Rate30","r30",{}],["Rate40","r40",{}],["Rate45","r45",{half:false,addl:false,add180:false}]].forEach(x=>{
    if(putBlock("ScheduleDPM.PlantMachinery."+x[0],(S.dpm||{})[x[1]],dpm[x[1]]||{},x[2]))wrote.dpm=true;
  });
  const landRaw=(S.doa||{}).land||{};
  if(N(landRaw.WDVFirstDay)){
    put(j,"ScheduleDOA.Land.DepreciationDetail.WDVFirstDay",n0(landRaw.WDVFirstDay));
    put(j,"ScheduleDOA.Land.DepreciationDetail.WDVLastDay",n0((doa.land||{}).wdvLast));
    wrote.doa=true;
  }
  [["Building.Rate5","b5"],["Building.Rate10","b10"],["Building.Rate40","b40"],
   ["FurnitureFittings.Rate10","furn"],["IntangibleAssets.Rate25","intang"],["Ships.Rate20","ships"]].forEach(x=>{
    if(putBlock("ScheduleDOA."+x[0],(S.doa||{})[x[1]],doa[x[1]]||{},{addl:false}))wrote.doa=true;
  });

  /* ---- ScheduleDEP (summary) ---- */
  const dep=S.C.dep||{};
  const DE="ScheduleDEP.SummaryFromDeprSch.";
  put(j,DE+"PlantMachinerySummary.DeprBlockTot15Percent",n0(dep.pm15));
  put(j,DE+"PlantMachinerySummary.DeprBlockTot30Percent",n0(dep.pm30));
  put(j,DE+"PlantMachinerySummary.DeprBlockTot40Percent",n0(dep.pm40));
  put(j,DE+"PlantMachinerySummary.DeprBlockTot45Percent",n0(dep.pm45));
  put(j,DE+"PlantMachinerySummary.TotPlntMach",n0(dep.totPM));
  put(j,DE+"BuildingSummary.DeprBlockTot5Percent",n0(dep.b5));
  put(j,DE+"BuildingSummary.DeprBlockTot10Percent",n0(dep.b10));
  put(j,DE+"BuildingSummary.DeprBlockTot40Percent",n0(dep.b40));
  put(j,DE+"BuildingSummary.TotBuildng",n0(dep.totBld));
  if(n0(dep.furn))put(j,DE+"FurnitureSummary",n0(dep.furn));
  if(n0(dep.intang))put(j,DE+"IntangibleAssetSummary",n0(dep.intang));
  if(n0(dep.ships))put(j,DE+"ShipsSummary",n0(dep.ships));
  put(j,DE+"TotalDepreciation",n0(dep.total));
  /* ---- ScheduleDCG (summary; signed) ---- */
  const dcg=S.C.dcg||{};
  const CG="ScheduleDCG.SummaryFromDeprSchCG.";
  put(j,CG+"PlantMachinerySummaryCG.DeprBlockTot15Percent",sg(dcg.pm15));
  put(j,CG+"PlantMachinerySummaryCG.DeprBlockTot30Percent",sg(dcg.pm30));
  put(j,CG+"PlantMachinerySummaryCG.DeprBlockTot40Percent",sg(dcg.pm40));
  put(j,CG+"PlantMachinerySummaryCG.DeprBlockTot45Percent",sg(dcg.pm45));
  put(j,CG+"PlantMachinerySummaryCG.TotPlntMach",sg(dcg.totPM));
  put(j,CG+"BuildingSummaryCG.DeprBlockTot5Percent",sg(dcg.b5));
  put(j,CG+"BuildingSummaryCG.DeprBlockTot10Percent",sg(dcg.b10));
  put(j,CG+"BuildingSummaryCG.DeprBlockTot40Percent",sg(dcg.b40));
  put(j,CG+"BuildingSummaryCG.TotBuildng",sg(dcg.totBld));
  if(sg(dcg.furn))put(j,CG+"FurnitureSummary",sg(dcg.furn));
  if(sg(dcg.intang))put(j,CG+"IntangibleAssetSummary",sg(dcg.intang));
  if(sg(dcg.ships))put(j,CG+"ShipsSummary",sg(dcg.ships));
  put(j,CG+"TotalDepreciation",sg(dcg.total));

  /* ---- ScheduleESR (emit if any figure) ---- */
  const esr=S.C.esr||{rows:{}};
  if(esr.totDeb||esr.totAllow){
    ESR_ROWS.forEach(r=>{
      const o=esr.rows[r[0]]||{};
      const R2="ScheduleESR.DeductionUs35."+r[2]+".DeductUs35.";
      put(j,R2+"AmtDebPL",n0(o.deb));
      put(j,R2+"AmtUs35Allowable",n0(o.allow));
      put(j,R2+"ExcessAmtOverDebPL",n0(o.excess));
    });
    put(j,"ScheduleESR.DeductionUs35.TotUs35.DeductUs35.AmtDebPL",n0(esr.totDeb));
    put(j,"ScheduleESR.DeductionUs35.TotUs35.DeductUs35.AmtUs35Allowable",n0(esr.totAllow));
    put(j,"ScheduleESR.DeductionUs35.TotUs35.DeductUs35.ExcessAmtOverDebPL",n0(esr.totExcess));
  }

  /* ---- ScheduleICDS (emit if any figure) ---- */
  const icds=S.C.icds||{rows:{}};
  if(icds.total||icds.deTotal){
    ICDS_ROWS.forEach(r=>{
      const o=icds.rows[r[0]]||{};
      if(!(o.inc||o.dec))return;
      const _icb="ScheduleICDS."+r[3];
      put(j,_icb+".IncreaseInProfit",n0(o.inc));
      put(j,_icb+".DecreaseInProfit",n0(o.dec));
      put(j,_icb+".NetEffect",sg(o.net));
    });
    /* TotalNetAmtDetl carries ONLY IncreaseInProfit + DecreaseInProfit (no NetEffect) */
    put(j,"ScheduleICDS.TotalNetAmtDetl.IncreaseInProfit",n0(icds.total));
    put(j,"ScheduleICDS.TotalNetAmtDetl.DecreaseInProfit",n0(icds.deTotal));
  }
}

/* =====================================================================
   IMPORT — inverse of export (schema -> S.bp/.dpm/.doa/.esr/.icds)
   ===================================================================== */
function impBp(I6){
  const got=[];
  const bp=I6&&I6.CorpScheduleBP;
  if(bp){
    const A=bp.BusinessIncOthThanSpec||{};
    S.bp.pbt=N(A.ProfBfrTaxPL); S.bp.nplSpec=N(A.NetPLFromSpecBus); S.bp.nplSpecified=N(A.NetProfLossSpecifiedBus);
    const ir=A.IncRecCredPLOthHeadDtls||{};
    S.bp.a3a=N(ir.HouseProperty);S.bp.a3b=N(ir.CapitalGains);
    S.bp.a3ci=N(ir.Dividend);S.bp.a3cii=N(ir.OtherThanDividend);
    S.bp.a3d=N(ir.UnderSec115BBF);S.bp.a3e=N(ir.UnderSec115BBG);
    S.bp.a3f=N(A.PLUs44sChapXIIGOthrUs115B);
    const pr=A.ProfitLossInclRefrdSec||{};
    S.bp.p44AE=N(pr.ProfitLossUs44AE);S.bp.p44B=N(pr.ProfitLossUs44B);S.bp.p44BB=N(pr.ProfitLossUs44BB);
    S.bp.p44BBA=N(pr.ProfitLossUs44BBA);S.bp.p44BBB=N(pr.ProfitLossUs44BBB);S.bp.p44BBC=N(pr.ProfitLossUs44BBC);
    S.bp.p44BBD=N(pr.ProfitLossUs44BBD);S.bp.p44D=N(pr.ProfitLossUs44D);S.bp.p44DA=N(pr.ProfitLossUs44DA);
    S.bp.pXIIG=N(pr.ProfitChapterXIIG);S.bp.pFirstSch=N(pr.FirstSchITActOthr115B);
    S.bp.p115B=N(A.PLUs44sChapXIIGUs115B);
    S.bp.pElig10TIA=N(A.ProfitFrmEligBus10TIA);
    const pf=A.ProfitFrmActCvrd||{};
    S.bp.r7=N(pf.ProfitFrmActCvrdUndrRule7);S.bp.r7A=N(pf.ProfitFrmActCvrdUndrRule7A);
    S.bp.r7B1=N(pf.ProfitFrmActCvrdUndrRule7B1);S.bp.r7B1A=N(pf.ProfitFrmActCvrdUndrRule7B1A);S.bp.r8=N(pf.ProfitFrmActCvrdUndrRule8);
    const ic=A.IncCredPL||{}, od=ic.OtherExmptIncDtl||{};
    S.bp.a5a=N(ic.FirmShareInc);S.bp.a5b=N(ic.AOPBOISharInc);S.bp.divExempt=N(od.OperatingDividendAmt);
    S.bp.othExempt=(od.OtherExmptIncDtls||[]).map(r=>({name:r.OperatingRevenueName||"",amt:N(r.OperatingRevenueAmt)}));
    const ed=A.ExpDebToPLOthHeadDtls||{};
    S.bp.e7a=N(ed.HouseProperty);S.bp.e7b=N(ed.CapitalGains);S.bp.e7c=N(ed.OtherSources);
    S.bp.e7d=N(ed.UnderSec115BBF);S.bp.e7e=N(ed.UnderSec115BBG);
    S.bp.e8a=N(A.ExpDebToPLExemptInc);S.bp.e8b=N(A.ExpDebToPLExemptIncDisAllwUs14A);
    S.bp.depDebPL=N(A.DepreciationDebPLCosAct);
    S.bp.dep32_1_i=N((A.DepreciationAllowITAct32||{}).DepreciationAllowUs32_1_i);
    S.bp.d14=N(A.AmtDebPLDisallowUs36);S.bp.d15=N(A.AmtDebPLDisallowUs37);S.bp.d16=N(A.AmtDebPLDisallowUs40);
    S.bp.d17=N(A.AmtDebPLDisallowUs40A);S.bp.d18=N(A.AmtDebPLDisallowUs43B);S.bp.d19=N(A.InterestDisAllowUs23SMEAct);
    S.bp.deem41=N(A.DeemIncUs41);
    /* item 21 — only the total is stored in the schema; put it into the first
       sub-line so recompute reproduces the same total (round-trip identity). */
    S.bp.d21_32AC=N(A.DeemIncUs3380HHD80IA);
    S.bp.d21_32AD=0;S.bp.d21_33AB=0;S.bp.d21_33ABA=0;S.bp.d21_35ABA=0;S.bp.d21_35ABB=0;
    S.bp.d21_35AC=0;S.bp.d21_40A3A=0;S.bp.d21_33AC=0;S.bp.d21_72A=0;S.bp.d21_80HHD=0;S.bp.d21_80IA=0;
    S.bp.d22=N(A.DeemIncUs43CA);S.bp.d23=N(A.OthItemDisallowUs28To44DA);
    S.bp.i24a=N(A.CommissionExpDisallowPL);S.bp.i24b=N(A.InterestExpDisallowPL);
    /* 24c stored = typed part + ESR shortfall; strip the ESR shortfall on import
       so it is not double-counted when recomputed. */
    {const esrShort=(function(){let s=0;ESR_ROWS.forEach(r=>{const o=(I6&&I6.ScheduleESR&&I6.ScheduleESR.DeductionUs35&&I6.ScheduleESR.DeductionUs35[r[2]]||{}).DeductUs35||{};s+=Math.max(0,N(o.AmtDebPL)-N(o.AmtUs35Allowable));});return R(s);})();
     S.bp.i24c=Math.max(0,N(A.OthersExpDisallowPL)-esrShort);}
    S.bp.d27=N(A.DeductUs32_1_iii);S.bp.d28_32AC=N(A.Amt32AC);
    S.bp.d30=N(A.AmtDisallUs40NowAllow);S.bp.d31=N(A.AmtDisallUs43BNowAllow);S.bp.d32=N(A.AnyOthAmtAllDeduct);
    const dp=A.DeemedProfitBusUs||{};
    S.bp.dp44AE=N(dp.Section44AE);S.bp.dp44B=N(dp.Section44B);S.bp.dp44BB=N(dp.Section44BB);
    S.bp.dp44BBA=N(dp.Section44BBA);S.bp.dp44BBB=N(dp.Section44BBB);S.bp.dp44BBC=N(dp.Section44BBC);
    S.bp.dp44BBD=N(dp.Section44BBD);S.bp.dp44D=N(dp.Section44D);S.bp.dp44DA=N(dp.Section44DA);
    S.bp.dpXIIG=N(dp.ChapterXIIG);S.bp.dpFirstSch=N(dp.FirstSchTActOther);
    S.bp.r38a=N(A.ChrgblIncUndrRule7);S.bp.r38b=N(A.DeemedChrgblIncUndrRule7A);S.bp.r38c=N(A.DeemedChrgblIncUndrRule7B1);
    S.bp.r38d=N(A.DeemedChrgblIncUndrRule7B1A);S.bp.r38e=N(A.DeemedChrgblIncUndrRule8);
    const sb=bp.SpecBusinessInc||{};
    S.bp.s41=N(sb.AdditionUs28to44DA);S.bp.s42=N(sb.DeductUs28to44DA);
    const sc=bp.IncSpecifiedBusiness||{};
    S.bp.sp45=N(sc.AddSec28to44DA);S.bp.sp46=N(sc.DedSec28to44DAOTDedSec35AD);S.bp.sp48=N(sc.DedSec35AD1);
    S.bp.clause=(sc.DedUs35ADSubSec5Dtls||[]).map(c=>c.DedUs35ADSubSec5||"");
    if(S.bp.clause.length<2)S.bp.clause=S.bp.clause.concat(["",""]).slice(0,2);
    got.push("Schedule BP");
  }
  const dpm=I6&&I6.ScheduleDPM;
  if(dpm&&dpm.PlantMachinery){
    const rd=(o)=>o&&o.DepreciationDetail||{};
    [["Rate15","r15"],["Rate30","r30"],["Rate40","r40"],["Rate45","r45"]].forEach(x=>{S.dpm[x[1]]=Object.assign({},rd(dpm.PlantMachinery[x[0]]));});
    got.push("Schedule DPM");
  }
  const doa=I6&&I6.ScheduleDOA;
  if(doa){
    const rd=(o)=>o&&o.DepreciationDetail||{};
    if(doa.Land)S.doa.land=Object.assign({},rd(doa.Land));
    if(doa.Building){S.doa.b5=Object.assign({},rd(doa.Building.Rate5));S.doa.b10=Object.assign({},rd(doa.Building.Rate10));S.doa.b40=Object.assign({},rd(doa.Building.Rate40));}
    if(doa.FurnitureFittings)S.doa.furn=Object.assign({},rd(doa.FurnitureFittings.Rate10));
    if(doa.IntangibleAssets)S.doa.intang=Object.assign({},rd(doa.IntangibleAssets.Rate25));
    if(doa.Ships)S.doa.ships=Object.assign({},rd(doa.Ships.Rate20));
    got.push("Schedule DOA");
  }
  const esr=I6&&I6.ScheduleESR&&I6.ScheduleESR.DeductionUs35;
  if(esr){
    ESR_ROWS.forEach(r=>{const o=(esr[r[2]]||{}).DeductUs35||{};S.esr[r[0]]={deb:N(o.AmtDebPL),allow:N(o.AmtUs35Allowable)};});
    got.push("Schedule ESR");
  }
  const icds=I6&&I6.ScheduleICDS;
  if(icds){
    ICDS_ROWS.forEach(r=>{const o=icds[r[3]]||{};if(o.IncreaseInProfit!=null||o.DecreaseInProfit!=null)S.icds[r[0]]={inc:N(o.IncreaseInProfit),dec:N(o.DecreaseInProfit)};});
    got.push("Schedule ICDS");
  }
  return got;
}

/* =====================================================================
   CHECKS — this section's own screen validations (not the dept rules)
   ===================================================================== */
function chkBp(){
  const out=[];
  const A=(S.C.bp&&S.C.bp.a)||{}, esr=S.C.esr||{rows:{}};
  const B=S.bp||{};
  const conc=bpConc(), barredW=bpWeightedBarred(), depBar=bpDepBarred();
  /* concessional-regime closures */
  if(depBar){
    const dpmAddl=["r15","r30","r40","r45"].some(k=>{const b=(S.dpm||{})[k]||{};return N(b.AddlnDeprOnGT180DayAdditions)||N(b.AddlnDeprDuringYearAdditions)||N(b.AddlnDeprOnLessThan180DayAdditions);});
    if(dpmAddl)out.push({lvl:"warn",t:"Additional depreciation closed",m:"Under "+conc+" additional depreciation is not allowed (A274); the entered figures are zeroed.",sec:"bp"});
    const r45=(S.dpm||{}).r45||{};
    if(N(r45.WDVFirstDay)||N(r45.AdditionsGrThan180Days))out.push({lvl:"warn",t:"45% block cannot claim depreciation",m:"Under "+conc+" plant depreciation is capped at 40%; the 45% block claims no depreciation (A275).",sec:"bp"});
  }
  if(barredW){
    if(ESR_ROWS.some(r=>r[3]&&(esr.rows[r[0]]||{}).gatedZeroed))out.push({lvl:"warn",t:"ESR weighted deduction closed",m:"Under "+conc+" the amount allowable (col 3) for 35(1)(ii)/(iia)/(iii)/35(2AA)/35CCC must be nil (A255); it has been zeroed.",sec:"bp"});
    if(N(B.sp48))out.push({lvl:"warn",t:"35AD deduction closed",m:"Under "+conc+" the deduction under section 35AD cannot be claimed (A255); item 48 is zeroed.",sec:"bp"});
  }
  /* ESR -> Schedule RA */
  if(ESR_ROWS.some(r=>["ii","iii","iv","vi"].indexOf(r[0])>=0 && N(((S.esr||{})[r[0]]||{}).allow)))
    out.push({lvl:"warn",t:"Schedule RA required",m:"A deduction is claimed under 35(1)(ii)/(iia)/(iii) or 35(2AA) — Schedule RA details are mandatory.",sec:"bp"});
  /* 12ii power-sector depreciation */
  if(N(B.dep32_1_i))
    out.push({lvl:"warn",t:"Verify 32(1)(i) depreciation",m:"Depreciation u/s 32(1)(i) (12ii) is allowable only for a power-sector business (A228).",sec:"bp"});
  /* 5c other-exempt nature special characters */
  if((B.othExempt||[]).some(r=>/[<>&]/.test(st0(r.name))))
    out.push({lvl:"err",t:"Invalid character in 5c nature",m:"The nature of exempt income at 5c cannot contain < > or &.",sec:"bp"});
  /* 35AD(5) clause not selected twice */
  const cl=(B.clause||[]).filter(c=>st0(c));
  if(cl.length===2 && cl[0]===cl[1])
    out.push({lvl:"err",t:"Duplicate 35AD(5) clause",m:"The same clause of sub-section (5) of section 35AD cannot be selected more than once.",sec:"bp"});
  /* income summary */
  if(S.C.bp){
    const d=S.C.bp.income;
    if(d<0)out.push({lvl:"ok",t:"Business loss",m:RS(-d)+" goes to Schedule CYLA / CFL for set off.",sec:"bp"});
    else if(d>0)out.push({lvl:"ok",t:"Business income",m:RS(d)+" chargeable under Profits and gains from Business or profession.",sec:"bp"});
  }
  return out;
}

/* ---- register (overrides the boot stub) ---- */
reg({id:"bp", t:"Business and profession", ref:"BP · DPM/DOA · DEP/DCG · ESR · ICDS",
  f:secBp, s:()=>{const d=S.C.bp?S.C.bp.income:0;return d<0?"Loss "+CR(-d):(d?"Income "+CR(d):"");},
  eng:engBp, exp:expBp, imp:impBp, chk:chkBp, order:30, corder:30});
