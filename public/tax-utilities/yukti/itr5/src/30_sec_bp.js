/* =====================================================================
   ITR-5 · A.Y. 2026-27 — Section "bp"
   Business / profession income (Schedule BP) + depreciation
   (Schedule DPM / DOA), the depreciation & deemed-capital-gains
   summaries (Schedule DEP / DCG), scientific-research expenditure
   (Schedule ESR) and Income Computation & Disclosure Standards
   (Schedule ICDS).

   Books (ITR-5, built from this form's own sheets/schema, never ported):
     books/ITR-5/BP.md          — the PBT → A37 adjustment ladder, the
                                    rule 7/7A/7B/8 agriculture split, Part B
                                    (speculative), Part C (specified 35AD),
                                    Part D, Part E intra-head set off.
     books/ITR-5/DPM_DOA.md     — four P&M rate blocks (15/30/40/45) and the
                                    seven DOA columns; the Rate45 reduced,
                                    full-rate-only schema; CapGainUs50 signed.
     books/ITR-5/DEP_DCG.md     — DEP & DCG roll-up summaries.
     books/ITR-5/ESR.md         — the nine s.35 sub-sections + CheckRA.
     books/ITR-5/Schedule_ICDS.md — the ten ICDS rows → OI 3a/3b.

   Schema blocks (section_map.json / blocks.json):
     CorpScheduleBP (required), ScheduleDPM, ScheduleDOA, ScheduleDEP,
     ScheduleDCG, ScheduleESR, ScheduleICDS (all optional at root).

   NOTE — Schedule UD (unabsorbed depreciation) is NOT in this section
   for ITR-5 (section_map keeps it with the loss section); it is not built
   here. BP reads brought-forward figures from the loss chain, not here.

   BP is a mostly-computed adjustment ladder. Almost every line is fed
   from upstream schedules (P&L, Trading/Mfg, Part A-OI, DEP, ESR, ICDS,
   VDA, EI and the utility's internal sheet5/6/7/10/11/12 working sheets).
   Those upstream sheets belong to other section builders, so their leaf
   figures are captured here as guarded typed inputs in S.bp (the same
   pattern the reference form uses). The genuine BP user inputs are the
   5c "any other exempt income" table, the 5c dividend line and the two
   35AD(5) clause drop-downs. DPM/DOA/DEP/DCG/ESR/ICDS are owned in full
   here and feed the ladder internally (A12i←DEP 6, A25/A32←ICDS totals,
   A28←ESR X(4), A24e←ESR shortfall).

   Regime closures encoded from the ITR-5 books (isNew() = new regime):
     - DPM additional depreciation (sl.12/13/14) -> 0            (DPM_DOA.md)
     - DPM Rate45 block cannot claim depreciation (115BAD)       (DPM_DOA.md)
     - the 3b AdjustmentSec115BAC row applies only in new regime (DPM_DOA.md)
     - 35AD(1) deduction (C47) cannot be claimed (rule 255)      (BP.md)
   The ITR-5 ESR book does NOT close the weighted s.35 deductions in the
   new regime, so ESR col (3) is not gated here (built from ITR-5 only).

   Publishes downstream (read by the loss/BFLA and AMT sections):
     S.C.bp.income        = D, the head's signed contribution to GTI
     S.C.bp.a.A37         = A37 (→ CYLA 1iii only if positive)
     S.C.bp.b.B42         = speculative income/loss (→ CFL 6xvi if loss)
     S.C.bp.c.C48         = specified-business income/loss (→ CFL 7xix if loss)
     S.C.bp.e.*           = Part E set-off table (→ CYLA speculative/specified)
     S.C.bp.curDep        = current-year depreciation allowable (Sch DEP 6)
     S.C.bp.dcg           = deemed capital gains u/s 50 (Sch DCG 6, → Sch CG)
     S.C.bp.ded35AD       = 35AD(1) deduction claimed (→ AMT add-back)
   Compute order 25 (income-head band; before the loss / AMT / tax roll-ups).
   ===================================================================== */

/* ---- state ---- */
S.bp = S.bp || {
  /* Part A — one figure per line */
  pbt:0,                 /* A1  Profit before tax as per P&L (K5) */
  nplSpec:0,             /* A2a net P/L speculative incl. in 1 (signed, I6) */
  nplSpecified:0,        /* A2b net P/L specified 35AD incl. in 1 (signed) */
  a3a:0,a3b:0,           /* A3a HP, A3b CG */
  a3ci:0,a3cii:0,        /* A3ci Dividend, A3cii Other-than-dividend (A3c = ci+cii) */
  a3d:0,a3e:0,a3f:0,     /* A3d 115BBF, A3e 115BBG, A3f 115BBH */
  p44AD:0,p44ADA:0,p44AE:0,p44B:0,p44BB:0,p44BBA:0,p44BBC:0,p44BBD:0,p44DA:0,pFirstSch:0, /* A4a */
  pl44b:0,               /* A4b life-insurance 115B (PLUs44sChapXIIGOthrUs115B) */
  r7:0,r7A:0,r7B1:0,r7B1A:0,r8:0,                              /* A4c rule 7/7A/7B(1)/7B(1A)/8 */
  a5a:0,a5b:0,           /* A5a firm share, A5b AOP/BOI share */
  divExempt:0,           /* A5c dividend amount */
  othExempt:[],          /* A5c rows [{name,amt}] */
  a5A:0,                 /* A5A income/receipts not chargeable */
  e7a:0,e7b:0,e7c:0,e7d:0,e7e:0,e7f:0,   /* A7a..A7f expenses under other heads */
  e8a:0,e8b:0,           /* A8a exempt-related exp, A8b 14A (16 of OI) */
  depDebPL:0,            /* A11 depreciation debited to P&L */
  dep32_1_i:0,           /* A12ii depreciation u/s 32(1)(i) — own computation */
  d14:0,d15:0,d16:0,d17:0,d18:0,d19:0,   /* A14..A19 disallowances */
  deem41:0,              /* A20 deemed income u/s 41 */
  d21_32AC:0,d21_32AD:0,d21_33AB:0,d21_33ABA:0,d21_35ABA:0,d21_35ABB:0,
  d21_35AC:0,d21_40A3A:0,d21_33AC:0,d21_72A:0,d21_80HHD:0,d21_80IA:0,  /* A21a..A21l */
  d22:0,d23:0,           /* A22 43CA, A23 other addition 28-44DB */
  i24a:0,i24b:0,i24c:0,i24d:0,i24e:0,    /* A24a..A24e */
  i25:0,                 /* A25 OI stock-deviation increase part (ICDS added on top) */
  d27:0,                 /* A27 deduction u/s 32(1)(iii) */
  d29:0,d30:0,d31:0,     /* A29 40 now-allow, A30 43B now-allow, A31 other */
  i32:0,                 /* A32 OI stock-deviation decrease part (ICDS added on top) */
  d35_44AD:0,d35_44ADA:0,d35_44AE:0,d35_44B:0,d35_44BB:0,d35_44BBA:0,
  d35_44BBC:0,d35_44BBD:0,d35_44DA:0,d35_FirstSch:0,          /* A35i..A35viii deemed */
  r37a:0,r37b:0,r37c:0,r37d:0,r37e:0,    /* A37a..A37e rule chargeable income */
  /* Part B — speculative */
  s40:0,s41:0,           /* B40 additions, B41 deductions (B39 = A2a) */
  /* Part C — specified 35AD */
  sp44:0,sp45:0,sp47:0,  /* C44 add, C45 ded, C47 deduction u/s 35AD(1) */
  clause:["",""]         /* C49 35AD(5) clause drop-downs (two rows) */
};
S.dpm  = S.dpm  || { r15:{}, r30:{}, r40:{}, r45:{} };
S.doa  = S.doa  || { land:{}, b5:{}, b10:{}, b40:{}, furn:{}, intang:{}, ships:{} };
S.esr  = S.esr  || {};   /* {i:{deb,allow}, ii:{...}, ... ix} */
S.icds = S.icds || {};   /* {acc:{inc,dec}, inv:{...}, ...} */

SEED["bp.othExempt"] = SEED["bp.othExempt"] || {name:"",amt:0};

/* ---- the 35AD(5) clause value list (BP.md G153 BP_35AD_Dropdown) ---- */
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
 ["aj","(aj) setting up and operating a semi-conductor wafer fabrication manufacturing unit"],
 ["ak","(ak) developing or operating and maintaining any infrastructure facility"],
 ["b","(b) all other cases not falling under any of the above clauses"]
];
/* ICDS rows: [stateKey, roman, label, schemaObjectKey] (Schedule_ICDS.md) */
const ICDS_ROWS = [
 ["acc","I","Accounting Policies","AccPolicyAmtDetl"],
 ["inv","II","Valuation of Inventories","InventoriesValueDetl"],
 ["cons","III","Construction Contracts","ConstContractsAmtDetl"],
 ["rev","IV","Revenue Recognition","RevenueRcgAmtDetl"],
 ["tfa","V","Tangible Fixed Assets","TangibleFixedAssetDetl"],
 ["fx","VI","Changes in Foreign Exchange Rates","ForeignExgRatesDetl"],
 ["grant","VII","Government Grants","GovtGrantsDetl"],
 ["sec","VIII","Securities","SecuritiesDetl"],
 ["borr","IX","Borrowing Costs","BorrowingCostsDetl"],
 ["prov","X","Provisions, Contingent Liabilities and Contingent Assets","ProvAssetsDetl"]
];
/* ESR rows: [stateKey, section label, schemaObjectKey, checkRA] (ESR.md) */
const ESR_ROWS = [
 ["i","35(1)(i)","Section35_1_i",false],
 ["ii","35(1)(ii)","Section35_1_ii",true],
 ["iii","35(1)(iia)","Section35_1_iia",true],
 ["iv","35(1)(iii)","Section35_1_iii",true],
 ["v","35(1)(iv)","Section35_1_iv",false],
 ["vi","35(2AA)","Section35_2AA",true],
 ["vii","35(2AB)","Section35_2AB",false],
 ["viii","35CCC","Section35_CCC",false],
 ["ix","35CCD","Section35_CCD",false]
];

/* =====================================================================
   Depreciation block engine (DPM & DOA), from DPM_DOA.md cell formulas.
   opts.half  false -> no half-rate row (Rate45, Land)
   opts.addl  false -> no additional-depreciation rows (all DOA, Rate45)
   opts.fullOnly true -> Rate45 reduced path: no additions, no half rate
   opts.blocked true -> Rate45 in new regime: depreciation forced to 0 (115BAD)
   ===================================================================== */
/* DPM/DOA 3b (AdjustmentSec115BAC, 2nd proviso to 115BAC(3) · Rule 5): rule 282 —
   "should not be allowed to firm, LLP and Co-operative society or if New Tax Regime
   has been opted for." So the adjustment is admissible ONLY in the old regime AND
   only for a non-firm/LLP/co-op assessee (i.e. AOP/BOI/AJP). Status "1" = Firm/LLP;
   a co-operative society files under status "14" with a co-op sub-status. */
/* Concessional-regime bar for the depreciation/35AD closures. Under 115BAC(1A),
   115BAD and 115BAE alike the utility bars additional depreciation (32(1)(iia)),
   the 45% P&M block's depreciation and the 35AD(1) deduction. Drive these off the
   resolved regime (S.C.regime.anyConc from 65_regime.js) — the shell isNew() only
   sees the 115BAC master switch (optout) and misses a co-op electing 115BAD/115BAE. */
function concBar(){ return !!(S.C&&S.C.regime&&S.C.regime.anyConc); }
function bar115BAC(){
  if(isNew()) return true;                                    /* new regime: barred */
  const st=String((S.pi&&S.pi.status)||"");
  if(st==="1") return true;                                   /* Firm or LLP */
  const sub=String((S.pi&&S.pi.substatus)||"");
  if(/co-?operative|credit society/i.test(sub)) return true;  /* co-operative society */
  return false;
}
function bpBlock(b,rate,opts){
  b=b||{};opts=opts||{};
  const half     = opts.half!==false;
  const addlOK   = opts.addl!==false && !concBar(); /* additional depr: barred under any concessional regime (115BAC/BAD/BAE) */
  const fullOnly = !!opts.fullOnly;                 /* Rate45 */
  const blocked  = opts.blocked && concBar();       /* Rate45 no depreciation under any concessional regime (115BAC/BAD/BAE) */
  const wdv = N(b.WDVFirstDay);                                 /* 3a */
  const adj = (opts.adj===false||bar115BAC())?0:N(b.AdjustmentSec115BAC);  /* 3b — DPM-only (opts.adj:false for DOA, DPM_DOA.md:118); old regime, non-firm/LLP/co-op only (rule 282) */
  const tot3 = wdv + adj;                                       /* [F9] Total (3a+3b) = WDVFirstDay+Adjustment */
  const add180 = fullOnly?0:N(b.AdditionsGrThan180Days);       /* 4 (Rate45 has no additions leaf) */
  const realTot = N(b.RealizationTotalPeriod);                 /* 5 */
  const fullBase = tot3 + add180 - realTot;
  const fullAmt = Math.max(0, fullBase);                        /* [F12] 6 = MAX(0,3+4-5) */
  const addLess = half?N(b.AdditionsLessThan180Days):0;        /* 7 */
  const realLess = half?N(b.RealizationPeriodDuringYear):0;    /* 8 (ITR-5 key: RealizationPeriodDuringYear) */
  const halfAmt = half?Math.max(0, addLess - realLess + Math.min(0,fullBase)):0; /* [F15] 9 = MAX(0,7-8+MIN(0,3+4-5)) */
  let depFull = Math.round(fullAmt*rate/100);                   /* [F16] 10 = ROUND(6*rate/100) */
  let depHalf = half?Math.round(halfAmt*rate/200):0;           /* [F17] 11 = ROUND(9*rate/200) (half = rate/200) */
  const addl1 = addlOK?N(b.AddlnDeprOnGT180DayAdditions):0;        /* 12 additional depr on 4 */
  const addl2 = addlOK?N(b.AddlnDeprDuringYearAdditions):0;        /* 13 additional depr on 7 */
  const addl3 = addlOK?N(b.AddlnDeprOnLessThan180DayAdditions):0;  /* 14 additional depr prec. yr <180 */
  if(blocked){depFull=0;depHalf=0;}
  const totDep = depFull+depHalf+addl1+addl2+addl3;             /* [F21] 15 = 10+11+12+13+14 */
  const disallow = N(b.DepDisAllowUs38_2);                      /* 16 */
  const netAgg = Math.max(0, totDep-disallow);                 /* [F23] 17 = MAX(15-16,0) */
  const pro = N(b.ProportionateAggDepreciation);              /* 18 */
  const expTr = N(b.ExpdrOnTrforSaleAsset);                   /* 19 */
  const cg50 = sg(b.CapGainUs50);                             /* 20 (signed; only negative if block ceases) */
  const wdvLast = Math.max(0, tot3 + add180 - realTot + addLess - realLess - totDep); /* [F27] 21 = MAX(3+4-5+7-8-15,0) */
  return {rate,wdv,adj,tot3,add180,realTot,fullAmt,addLess,realLess,halfAmt,
    depFull,depHalf,addl1,addl2,addl3,totDep,disallow,netAgg,pro,expTr,wdvLast,cg50,
    dep:(pro>0?pro:netAgg)};   /* DEP source: proportionate if >0, else net aggregate */
}

/* =====================================================================
   ENGINE
   ===================================================================== */
function engBp(){
  const B=S.bp||{};
  const nb=k=>N(B[k]), sgb=k=>sg(B[k]);

  /* ---------- ICDS (feeds BP 25/32 and OI 3a/3b) ---------- */
  const icds={rows:{}};
  let icdsInc=0, icdsDec=0;
  ICDS_ROWS.forEach(r=>{
    const o=(S.icds||{})[r[0]]||{};
    const inc=N(o.inc), dec=N(o.dec);
    icds.rows[r[0]]={inc:R(inc),dec:R(dec),net:R(inc-dec)};   /* [H6] Net = Increase - Decrease */
    icdsInc+=inc; icdsDec+=dec;
  });
  icds.totInc=Math.max(0,R(icdsInc));   /* [F16] XI Increase = MAX(0,SUM) -> OI 3a */
  icds.totDec=Math.max(0,R(icdsDec));   /* [G16] XI Decrease = MAX(0,SUM) -> OI 3b */
  icds.totNet=R(icdsInc-icdsDec);       /* [H16] XI Net = SUM(H6:H15) */
  /* names sec_oi reads to fill Part A-OI 3a/3b (ProfDeviatDueAcctMeth / DecProOrIncLossUs145_2);
     without these the ICDS increase reaches BP A25 but never OI 3a → rule A225/A229 false-fire. */
  icds.total=icds.totInc;   /* -> OI 3a */
  icds.deTotal=icds.totDec; /* -> OI 3b */
  icds.filled=ICDS_ROWS.some(r=>{const o=(S.icds||{})[r[0]]||{};return N(o.inc)||N(o.dec);}); /* [K4] FilledFlag */
  S.C.icds=icds;

  /* ---------- ESR (feeds BP 28 and 24e) ---------- */
  const esr={rows:{}}; let eDeb=0,eAllow=0,eExcess=0,eShort=0;
  ESR_ROWS.forEach(r=>{
    const o=(S.esr||{})[r[0]]||{};
    const deb=N(o.deb), allow=N(o.allow);
    const excess=Math.max(0, allow-deb);          /* [G5] (4)=MAX(0,(3)-(2)) */
    if(allow-deb<0)eShort+=Math.abs(allow-deb);   /* negative (3)-(2) -> BP 24(e), rule 256 */
    esr.rows[r[0]]={deb:R(deb),allow:R(allow),excess:R(excess)};
    eDeb+=deb; eAllow+=allow; eExcess+=excess;
  });
  esr.totDeb=R(eDeb);                    /* [E14] SUM col(2) */
  esr.totAllow=R(eAllow);                /* [F14] SUM col(3) */
  esr.totExcess=Math.max(0,R(eExcess)); /* [G14] MAX(0,SUM col(4)) -> BP A28 */
  esr.shortfall=R(eShort);
  esr.checkRA=ESR_ROWS.some(r=>r[3] && ((N((S.esr||{})[r[0]]||{}).deb)||(N((S.esr||{})[r[0]]||{}).allow))); /* [K3] CheckRA */
  esr.has2AB=N(((S.esr||{}).vii||{}).deb)||N(((S.esr||{}).vii||{}).allow);   /* 35(2AB) -> Form 3CLA */
  S.C.esr=esr;

  /* ---------- DPM (four plant & machinery rate blocks) ---------- */
  const dpm={
    r15:bpBlock(S.dpm&&S.dpm.r15,15,{}),
    r30:bpBlock(S.dpm&&S.dpm.r30,30,{}),
    r40:bpBlock(S.dpm&&S.dpm.r40,40,{}),
    r45:bpBlock(S.dpm&&S.dpm.r45,45,{half:false,addl:false,fullOnly:true,blocked:true}) /* full-rate-only; no dep in new regime */
  };
  S.C.dpm=dpm;
  /* ---------- DOA (Land + Building 5/10/40 + Furniture + Intangible + Ships) ---------- */
  const landB=(S.doa&&S.doa.land)||{};
  const land={wdv:N(landB.WDVFirstDay),wdvLast:Math.max(0,N(landB.WDVFirstDay)),dep:0,cg50:0}; /* [F51] Nil rate */
  const doa={   /* DOA: adj:false — the 3b 115BAC adjustment is DPM-only (DPM_DOA.md:118; :92 has no 3b term) */
    land:land,
    b5:bpBlock(S.doa&&S.doa.b5,5,{addl:false,adj:false}),
    b10:bpBlock(S.doa&&S.doa.b10,10,{addl:false,adj:false}),
    b40:bpBlock(S.doa&&S.doa.b40,40,{addl:false,adj:false}),
    furn:bpBlock(S.doa&&S.doa.furn,10,{addl:false,adj:false}),
    intang:bpBlock(S.doa&&S.doa.intang,25,{addl:false,adj:false}),
    ships:bpBlock(S.doa&&S.doa.ships,20,{addl:false,adj:false})
  };
  S.C.doa=doa;

  /* ---------- DEP (Schedule DEP summary of depreciation) ---------- */
  const dep={};
  dep.pm15=dpm.r15.dep; dep.pm30=dpm.r30.dep; dep.pm40=dpm.r40.dep; dep.pm45=dpm.r45.dep;
  dep.totPM=R(dep.pm15+dep.pm30+dep.pm40+dep.pm45);                     /* [J9] 1e = SUM(H5:H8) */
  dep.b5=doa.b5.dep; dep.b10=doa.b10.dep; dep.b40=doa.b40.dep;
  dep.totBld=R(dep.b5+dep.b10+dep.b40);                                 /* [J14] 2d = SUM(H11:H13) */
  dep.furn=doa.furn.dep; dep.intang=doa.intang.dep; dep.ships=doa.ships.dep;
  dep.total=Math.max(0,R(dep.totPM+dep.totBld+dep.furn+dep.intang+dep.ships)); /* [J18] 6 = MAX(0,1e+2d+3+4+5) */
  S.C.dep=dep;

  /* ---------- DCG (Schedule DCG deemed capital gains u/s 50, signed) ---------- */
  const dcg={};
  dcg.pm15=dpm.r15.cg50; dcg.pm30=dpm.r30.cg50; dcg.pm40=dpm.r40.cg50; dcg.pm45=dpm.r45.cg50;
  dcg.totPM=R(dcg.pm15+dcg.pm30+dcg.pm40+dcg.pm45);                     /* [J26] 1e = SUM(H22:H25) */
  dcg.b5=doa.b5.cg50; dcg.b10=doa.b10.cg50; dcg.b40=doa.b40.cg50;
  dcg.totBld=R(dcg.b5+dcg.b10+dcg.b40);                                 /* [J31] 2d = SUM(H28:H30) */
  dcg.furn=doa.furn.cg50; dcg.intang=doa.intang.cg50; dcg.ships=doa.ships.cg50;
  dcg.total=R(dcg.totPM+dcg.totBld+dcg.furn+dcg.intang+dcg.ships);      /* [J35] 6 = 2d+3+4+5+1e (signed) */
  S.C.dcg=dcg;

  /* ================= BP LADDER — Part A ================= */
  const K5   = R(nb("pbt"));                                   /* A1 */
  const _2a  = sgb("nplSpec");                                 /* A2a (I6) */
  const _2b  = sgb("nplSpecified");                            /* A2b */
  const a3c  = R(nb("a3ci")+nb("a3cii"));                      /* A3c (I11) = 3ci + 3cii */
  const _4a  = Math.max(0, R(sgb("p44AD")+sgb("p44ADA")+sgb("p44AE")+sgb("p44B")+sgb("p44BB")+
                             sgb("p44BBA")+sgb("p44BBC")+sgb("p44BBD")+sgb("p44DA")+sgb("pFirstSch"))); /* [I17] MAX(0,SUM) */
  const _4c  = Math.max(0, R(nb("r7")+nb("r7A")+nb("r7B1")+nb("r7B1A")+nb("r8")));  /* A4c [I33] MAX(0,SUM(H35:H39)) */
  const othExemptTot = R((B.othExempt||[]).reduce((a,r)=>a+N(r.amt),0));
  const _5c  = R(nb("divExempt")+othExemptTot);               /* A5c total (I49) OthExempInc */
  const _5d  = R(nb("a5a")+nb("a5b")+_5c);                    /* A5d (I51) = 5a+5b+5c */
  const _5A  = R(nb("a5A"));                                   /* A5A */
  /* A3f (I16) = MAX(0, Schedule-VDA business-head total) — auto-populated (BP.md:195),
     NOT a free input; read from Schedule VDA (CG section) via S.C.cg.vda.bi.
     Forward dependency (bp corder 25 reads cg corder 26): the wiring fixpoint loop resolves it. */
  const _a3f = Math.max(0, R(N(((S.C.cg||{}).vda||{}).bi)));
  /* A6 (K53) = 1 - 2a - 2b - 3a - 3b - 3c - 3d - 3e - 3f - 4a - 4b - 4c - 5d - 5A */
  const _6   = R(K5 - _2a - _2b - nb("a3a") - nb("a3b") - a3c - nb("a3d") - nb("a3e") - _a3f
                   - _4a - nb("pl44b") - _4c - _5d - _5A);
  const _9   = R(nb("e7a")+nb("e7b")+nb("e7c")+nb("e7d")+nb("e7e")+nb("e7f")+nb("e8a")+nb("e8b")); /* A9 (I63) */
  const _10  = R(_6+_9);                                       /* A10 (K64) = 6+9 */
  /* A11 (K65) = MAX(0, P&L sl.53 DepreciationAmort + Mfg 1E(vi) DeprctnOfFactoryMachinery) — computed
     (BP.md:79 / rule 239-240), NOT a free input; read from PL section S.C.pl.depreciationPL/factoryDepreciation */
  const _11  = Math.max(0, R(N((S.C.pl||{}).depreciationPL)+N((S.C.pl||{}).factoryDepreciation)));
  const _12i = R(dep.total>0?dep.total:0);                    /* A12i (I67) = IF(DEP J18>0, J18, 0) */
  const _12ii= R(nb("dep32_1_i"));                            /* A12ii */
  const _12iii=R(_12i+_12ii);                                 /* A12iii (K69) = 12i+12ii */
  const _13  = R(_10+_11-_12iii);                             /* A13 (K70) = 10+11-12iii */
  const _20  = R(nb("deem41"));                                /* A20 */
  const _21  = R(nb("d21_32AC")+nb("d21_32AD")+nb("d21_33AB")+nb("d21_33ABA")+nb("d21_35ABA")+
                 nb("d21_35ABB")+nb("d21_35AC")+nb("d21_40A3A")+nb("d21_33AC")+nb("d21_72A")+
                 nb("d21_80HHD")+nb("d21_80IA"));             /* A21 (I78) = SUM(21a..21l) */
  const e24e = R(nb("i24e") || esr.shortfall);               /* A24e (rule 256: >= |neg (3)-(2)| of ESR) */
  const _24  = R(nb("i24a")+nb("i24b")+nb("i24c")+nb("i24d")+e24e);  /* A24 (I93) = SUM(24a..24e) */
  const _25  = Math.max(0, R(nb("i25")+icds.totInc));        /* A25 (I99) = MAX(0, OI stock-dev + ICDS increase) */
  /* A26 (K100) = 14+15+16+17+18+19+20+21+22+23+24+25 */
  const _26  = R(nb("d14")+nb("d15")+nb("d16")+nb("d17")+nb("d18")+nb("d19")+_20+_21+nb("d22")+nb("d23")+_24+_25);
  const _27  = R(nb("d27"));                                   /* A27 */
  const _28  = R(esr.totExcess);                              /* A28 (I103) = ESR G14 */
  const _32  = Math.max(0, R(nb("i32")+icds.totDec));        /* A32 (I111) = MAX(0, OI stock-dev + ICDS decrease) */
  const _33  = R(_27+_28+nb("d29")+nb("d30")+nb("d31")+_32); /* A33 (K112) = 27+28+29+30+31+32 */
  const _34  = R(_13+_26-_33);                                /* A34 (K113) = 13+26-33 */
  const _35  = R(nb("d35_44AD")+nb("d35_44ADA")+nb("d35_44AE")+nb("d35_44B")+nb("d35_44BB")+
                 nb("d35_44BBA")+nb("d35_44BBC")+nb("d35_44BBD")+nb("d35_44DA")+nb("d35_FirstSch")); /* A35ix (K128) */
  const _36  = R(_34+_35);                                     /* A36 (K129) = 34+35ix */
  const _37f = _36;                                            /* A37f (I136) = item 36 */
  const A37  = R(nb("r37a")+nb("r37b")+nb("r37c")+nb("r37d")+nb("r37e")+_37f); /* A37 (K130) = 37a..37f */
  const _38  = Math.max(0, R(_4c - (nb("r37a")+nb("r37b")+nb("r37c")+nb("r37d")+nb("r37e"))));  /* A38 (K137) */

  /* ================= Part B — speculative ================= */
  const _39  = _2a;                                            /* B39 (K139) = A2a */
  const B42  = R(_39+nb("s40")-nb("s41"));                    /* B42 (K142) = 39+40-41 */

  /* ================= Part C — specified 35AD ================= */
  const _43  = _2b;                                            /* C43 (K144) = A2b */
  const _46  = R(_43+nb("sp44")-nb("sp45"));                  /* C46 (K147) = 43+44-45 */
  const _47  = concBar()?0:R(nb("sp47"));                     /* C47 (rule 255: 35AD(1) barred under any concessional regime 115BAC/BAD/BAE) */
  const C48  = R(_46-_47);                                     /* C48 (K151) = 46-47 */

  /* ================= Part D ================= */
  const D    = R(Math.max(0,C48)+Math.max(0,B42)+A37);       /* D (K155) = MAX(0,C48)+MAX(0,B42)+A37 */

  /* ================= Part E — intra-head set off (current year) ================= */
  const lossSetOff = Math.abs(Math.min(0, A37));             /* E(i) (I163) = ABS(MIN(0,A37)) */
  const specInc = Math.max(0, B42);                          /* E(ii) H164 = MAX(0,B42) */
  const specSet = Math.min(lossSetOff, specInc);            /* E(ii) I164 = MIN(I163,H164) */
  const specRemain = R(specInc-specSet);                     /* E(ii) K164 = H164-I164 */
  const specifiedInc = Math.max(0, C48);                     /* E(iii) H165 = MAX(0,C48) */
  const specifiedSet = Math.min(lossSetOff-specSet, specifiedInc); /* E(iii) I165 = MIN(I163-I164,H165) */
  const specifiedRemain = R(specifiedInc-specifiedSet);     /* E(iii) K165 = H165-I165 */
  const totSet = R(specSet+specifiedSet);                    /* E(v) (I167) = SUM(I164:J166) */
  const lossRemain = R(Math.max(0, lossSetOff-totSet));      /* E(vi) (I168) = I163-I167 */

  S.C.bp = {
    on:true,
    a:{K5,_2a,_2b,a3c,a3f:_a3f,_4a,_4c,_5c,_5d,_5A,_6,_9,_10,_11,_12i,_12ii,_12iii,_13,
       _20,_21,e24e,_24,_25,_26,_27,_28,_32,_33,_34,_35,_36,_37f,A37,_38},
    b:{_39,B42},
    c:{_43,_46,_47,C48},
    d:D,
    e:{lossSetOff,specInc,specSet,specRemain,specifiedInc,specifiedSet,specifiedRemain,totSet,lossRemain},
    /* downstream contract */
    income:D,               /* head's contribution to Gross Total Income (loss/BFLA, tax) */
    curDep:dep.total,       /* current-year depreciation allowable (Sch DEP 6) */
    dcg:dcg.total,          /* deemed capital gains u/s 50 (Sch DCG 6 -> Sch CG) */
    ded35AD:_47,            /* 35AD(1) deduction claimed (-> AMT add-back) */
    a3d:R(nb("a3d")), a3e:R(nb("a3e")), a3f:_a3f  /* A3d/e (115BBF/BBG free inputs); a3f (115BBH) = MAX(0,VDA business-head total) — read by tax.js Part B-TI 2(iv) */
  };
}

/* =====================================================================
   RENDERER
   ===================================================================== */
function rBP(label,right,ref,o){o=o||{};o.ref=ref;return row(label,right,o);}
function inpN(p){return inp(p,{n:1});}

function secBp(){
  const A=(S.C.bp&&S.C.bp.a)||{}, Bp=(S.C.bp&&S.C.bp.b)||{}, Cp=(S.C.bp&&S.C.bp.c)||{}, E=(S.C.bp&&S.C.bp.e)||{};
  const nw=concBar();
  let h="";
  h+=formNote("Schedule BP is a computed adjustment ladder. Most lines carry forward from Schedule P&L, "+
    "the Trading and Manufacturing accounts, Part A-OI and Schedules DEP/ESR/ICDS/VDA/EI — enter each figure "+
    "as it appears there. The only free entries are the 5c exempt-income table, the 5c dividend line and the "+
    "35AD(5) clauses. Depreciation (DPM/DOA), its summaries (DEP/DCG), ESR and ICDS are the sub-schedules "+
    "below and feed this ladder automatically.");

  /* ---- Part A ---- */
  h+=sub("A — Business other than speculative & specified business");
  h+=rBP("A1  Profit before tax as per profit and loss account",inpN("bp.pbt"),"A1");
  h+=rBP("A2a  Net profit/loss from speculative business included in 1",inpN("bp.nplSpec"),"A2a",{hint:"enter −ve for a loss"});
  h+=rBP("A2b  Net profit/loss from specified business u/s 35AD included in 1",inpN("bp.nplSpecified"),"A2b",{hint:"enter −ve for a loss"});
  h+=sub("A3 — Income credited to P&L considered under other heads / 115BBF-G-H");
  h+=rBP("A3a  House Property",inpN("bp.a3a"),"A3a",{ind:1});
  h+=rBP("A3b  Capital Gains",inpN("bp.a3b"),"A3b",{ind:1});
  h+=rBP("A3ci  Dividend Income",inpN("bp.a3ci"),"A3ci",{ind:1});
  h+=rBP("A3cii  Other than Dividend Income",inpN("bp.a3cii"),"A3cii",{ind:1});
  h+=rBP("A3c  Other Sources (3ci + 3cii)",cell(A.a3c),"A3c",{ind:1});
  h+=rBP("A3d  u/s 115BBF",inpN("bp.a3d"),"A3d",{ind:1});
  h+=rBP("A3e  u/s 115BBG",inpN("bp.a3e"),"A3e",{ind:1});
  h+=rBP("A3f  u/s 115BBH (net of cost of acquisition) — item A of Schedule VDA",cell(A.a3f),"A3f",{ind:1});
  h+=sub("A4a — Profit incl. in 1 referred to 44AD/ADA/AE/B/BB/BBA/BBC/BBD/DA / First Schedule");
  [["p44AD","44AD (Resident firm)"],["p44ADA","44ADA (Resident firm)"],["p44AE","44AE"],
   ["p44B","44B (NRI)"],["p44BB","44BB (NRI)"],["p44BBA","44BBA (NRI)"],["p44BBC","44BBC (NRI)"],
   ["p44BBD","44BBD (NRI)"],["p44DA","44DA (NRI)"],["pFirstSch","First Schedule of IT Act (other than 115B)"]].forEach(x=>
     h+=rBP("A4a · "+x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("A4a  Total (should equal 35i to 35vii)",cell(A._4a),"A4a");
  h+=rBP("A4b  Profit and gains from life insurance business referred to in section 115B",inpN("bp.pl44b"),"A4b");
  h+=sub("A4c — Profit from activities covered under rule 7 / 7A / 7B(1) / 7B(1A) / 8");
  [["r7","Rule 7"],["r7A","Rule 7A"],["r7B1","Rule 7B(1)"],["r7B1A","Rule 7B(1A)"],["r8","Rule 8"]].forEach(x=>
     h+=rBP("A4c · "+x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("A4c  Total",cell(A._4c),"A4c");
  h+=sub("A5 — Income credited to P&L (included in 1) which is exempt");
  h+=rBP("A5a  Share of income from firm(s)",inpN("bp.a5a"),"A5a");
  h+=rBP("A5b  Share of income from AOP/BOI",inpN("bp.a5b"),"A5b");
  h+=rBP("A5c  Nature: Dividend income — Amount (cannot exceed 3ci)",inpN("bp.divExempt"),"A5c");
  h+=grid("bp.othExempt",[{k:"name",h:"Nature of other exempt income",t:"txt",w:"60%"},{k:"amt",h:"Amount",t:"num",w:"30%"}],
    (S.bp&&S.bp.othExempt)||[],{empty:"No other exempt income.",add:"Add exempt income"});
  h+=rBP("A5c  Total (dividend + other)",cell(A._5c),"A5c");
  h+=rBP("A5d  Total exempt income (5a + 5b + 5c)",cell(A._5d),"A5d");
  h+=rBP("A5A  Income/receipts credited to P&L but not chargeable to tax",inpN("bp.a5A"),"A5A");
  h+=rBP("A6  Balance (1 − 2a − 2b − 3a…3f − 4a − 4b − 4c − 5d − 5A)",cell(A._6),"A6");
  h+=sub("A7/A8 — Expenses debited to P&L under other heads / exempt / 14A");
  [["e7a","A7a House Property"],["e7b","A7b Capital Gains"],["e7c","A7c Other Sources"],
   ["e7d","A7d u/s 115BBF"],["e7e","A7e u/s 115BBG"],["e7f","A7f u/s 115BBH"],
   ["e8a","A8a relate to exempt income"],["e8b","A8b disallowed u/s 14A (16 of Part A-OI)"]].forEach(x=>
     h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("A9  Total (7a…7f + 8a + 8b)",cell(A._9),"A9");
  h+=rBP("A10  Adjusted profit or loss (6 + 9)",cell(A._10),"A10");
  h+=rBP("A11  Depreciation & amortization debited to P&L (item 53 of P&L + 1E(vi) of Manufacturing A/c)",cell(A._11),"A11");
  h+=rBP("A12i  Depreciation allowable u/s 32(1)(ii) & (iia) — item 6 of Schedule DEP",cell(A._12i),"A12i");
  h+=rBP("A12ii  Depreciation allowable u/s 32(1)(i) (Appendix-IA)",inpN("bp.dep32_1_i"),"A12ii");
  h+=rBP("A12iii  Total (12i + 12ii)",cell(A._12iii),"A12iii");
  h+=rBP("A13  Profit/loss after adjustment for depreciation (10 + 11 − 12iii)",cell(A._13),"A13");
  h+=sub("A14–A25 — Amounts to be added back");
  [["d14","A14 disallowable u/s 36 (6t of OI)"],["d15","A15 disallowable u/s 37 (7j of OI)"],
   ["d16","A16 disallowable u/s 40 (8Aj of OI)"],["d17","A17 disallowable u/s 40A (9g of OI)"],
   ["d18","A18 disallowable u/s 43B (11i of OI)"],["d19","A19 interest disallowed u/s 23 MSMED Act (17 of OI)"],
   ["deem41","A20 deemed income u/s 41"]].forEach(x=>h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  [["d21_32AC","A21a 32AC"],["d21_32AD","A21b 32AD"],["d21_33AB","A21c 33AB"],["d21_33ABA","A21d 33ABA"],
   ["d21_35ABA","A21e 35ABA"],["d21_35ABB","A21f 35ABB"],["d21_35AC","A21g 35AC"],["d21_40A3A","A21h 40A(3A)"],
   ["d21_33AC","A21i 33AC"],["d21_72A","A21j 72A"],["d21_80HHD","A21k 80HHD"],["d21_80IA","A21l 80-IA"]].forEach(x=>
     h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("A21  Deemed income u/s 32AC/32AD/…/80-IA (total 21a–21l)",cell(A._21),"A21");
  h+=rBP("A22  Deemed income u/s 43CA",inpN("bp.d22"),"A22",{ind:1});
  h+=rBP("A23  Any other item of addition u/s 28 to 44DB",inpN("bp.d23"),"A23",{ind:1});
  [["i24a","A24a Salary"],["i24b","A24b Bonus"],["i24c","A24c Commission"],["i24d","A24d Interest"]].forEach(x=>
     h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("A24e  Others",inp("bp.i24e",{n:1}),"A24e",{ind:1,v2:cell(A.e24e),hint:"≥ absolute of negative (3−2) in Schedule ESR"});
  h+=rBP("A24  Any other income not in P&L / expense not allowable (total 24a–24e)",cell(A._24),"A24");
  h+=rBP("A25  Increase in profit — ICDS/stock valuation (3a + 4d of OI + Sch ICDS)",
    inp("bp.i25",{n:1}),"A25",{v2:cell(A._25),hint:"OI stock-deviation part typed; Sch ICDS increase added automatically"});
  h+=rBP("A26  Total (14 … 25)",cell(A._26),"A26");
  h+=sub("A27–A32 — Amounts to be deducted");
  h+=rBP("A27  Deduction allowable u/s 32(1)(iii)",inpN("bp.d27"),"A27",{ind:1});
  h+=rBP("A28  Deduction u/s 35/35CCC/35CCD in excess of amount debited — X(4) of Schedule ESR",cell(A._28),"A28",{ind:1});
  h+=rBP("A29  Amount disallowed u/s 40 in earlier year, now allowable (8B of OI)",inpN("bp.d29"),"A29",{ind:1});
  h+=rBP("A30  Amount disallowed u/s 43B in earlier year, now allowable (10i of OI)",inpN("bp.d30"),"A30",{ind:1});
  h+=rBP("A31  Any other amount allowable as deduction",inpN("bp.d31"),"A31",{ind:1});
  h+=rBP("A32  Decrease in profit — ICDS/stock valuation (3b + 4e of OI + Sch ICDS)",
    inp("bp.i32",{n:1}),"A32",{v2:cell(A._32),hint:"OI stock-deviation part typed; Sch ICDS decrease added automatically"});
  h+=rBP("A33  Total (27 … 32)",cell(A._33),"A33");
  h+=rBP("A34  Income (13 + 26 − 33)",cell(A._34),"A34");
  h+=sub("A35 — Profits/gains deemed to be under presumptive sections");
  [["d35_44AD","A35i 44AD (62ii of P&L)"],["d35_44ADA","A35ii 44ADA (63ii of P&L)"],
   ["d35_44AE","A35iii 44AE (64iv of P&L)"],["d35_44B","A35iv 44B"],["d35_44BB","A35v 44BB"],
   ["d35_44BBA","A35via 44BBA"],["d35_44BBC","A35vib 44BBC"],["d35_44BBD","A35vic 44BBD"],
   ["d35_44DA","A35vii 44DA"],["d35_FirstSch","A35viii First Schedule of IT Act (other than 115B)"]].forEach(x=>
     h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("A35ix  Total (35i to 35viii)",cell(A._35),"A35ix");
  h+=rBP("A36  Net profit/loss (34 + 35ix)",cell(A._36),"A36");
  h+=sub("A37 — after rule 7A / 7B / 8");
  [["r37a","A37a Chargeable income under Rule 7"],["r37b","A37b Deemed chargeable income under Rule 7A"],
   ["r37c","A37c Deemed chargeable income under Rule 7B(1)"],["r37d","A37d Deemed chargeable income under Rule 7B(1A)"],
   ["r37e","A37e Deemed chargeable income under Rule 8"]].forEach(x=>h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("A37f  Income other than Rule 7A, 7B & 8 (item 36)",cell(A._37f),"A37f",{ind:1});
  h+=rBP("A37  Net P/L after rule 7A/7B/8 (37a…37f)",cell(A.A37),"A37",{hint:"if loss → item E(i)"});
  h+=rBP("A38  Balance income deemed to be from agriculture",cell(A._38),"A38");

  /* ---- Part B ---- */
  h+=sub("B — Speculative business");
  h+=rBP("B39  Net P/L from speculative business (item 2a)",cell(Bp._39),"B39");
  h+=rBP("B40  Additions in accordance with section 28 to 44DB",inpN("bp.s40"),"B40");
  h+=rBP("B41  Deductions in accordance with section 28 to 44DB",inpN("bp.s41"),"B41");
  h+=rBP("B42  Income from speculative business (39 + 40 − 41)",cell(Bp.B42),"B42",{hint:"if loss → 6xvi of Schedule CFL"});

  /* ---- Part C ---- */
  h+=sub("C — Specified business under section 35AD");
  h+=rBP("C43  Net P/L from specified business (item 2b)",cell(Cp._43),"C43");
  h+=rBP("C44  Additions in accordance with section 28 to 44DB",inpN("bp.sp44"),"C44");
  h+=rBP("C45  Deductions u/s 28 to 44DB (other than 35AD / 32 or 35 on which 35AD claimed)",inpN("bp.sp45"),"C45");
  h+=rBP("C46  Profit/loss from specified business (43 + 44 − 45)",cell(Cp._46),"C46");
  if(nw) h+=rBP("C47  Deduction in accordance with section 35AD(1)",cell(0),"C47",
    {hint:"closed by the new tax regime — 35AD(1) deduction cannot be claimed (rule 255)"});
  else   h+=rBP("C47  Deduction in accordance with section 35AD(1)",inpN("bp.sp47"),"C47");
  h+=rBP("C48  Income from specified business (46 − 47)",cell(Cp.C48),"C48",{hint:"if loss → 7xix of Schedule CFL"});
  h+=rBP("C49  Relevant clause of sub-section (5) of section 35AD (row 1)",sel("bp.clause.0",BP_35AD5),"C49");
  h+=rBP("C49  Relevant clause of sub-section (5) of section 35AD (row 2)",sel("bp.clause.1",BP_35AD5),"C49");

  /* ---- Part D & E ---- */
  h+=sub("D & E — Chargeable income and intra-head set off");
  h+=rBP("D  Income chargeable under 'Profits and gains from Business or profession' (A37 + B42 + C48)",cell(S.C.bp?S.C.bp.d:0),"D");
  h+=rBP("E(i)  Business loss of current year to be set off",cell(E.lossSetOff),"E i");
  h+=rBP("E(ii)  Income from speculative business",cell(E.specInc),"E ii",{v2:cell(E.specSet)});
  h+=rBP("E(iii)  Income from specified business",cell(E.specifiedInc),"E iii",{v2:cell(E.specifiedSet)});
  h+=rBP("E(v)  Total loss set off (ii + iii)",cell(E.totSet),"E v");
  h+=rBP("E(vi)  Loss remaining after set off (i − v)",cell(E.lossRemain),"E vi");
  h+=note("Include the income of the specified persons referred to in Schedule SPI while computing income under this head.");

  /* ---- Sub-schedules ---- */
  h+=depFold();
  h+=esrFold();
  h+=icdsFold();
  return h;
}

/* ---- DPM/DOA/DEP/DCG fold ---- */
function blockCol(base,blk,opts){
  opts=opts||{};
  const c=n=>'<td class="num">'+cell(n)+'</td>';
  const iN=k=>'<td>'+inp(base+"."+k,{n:1})+'</td>';
  const full=!opts.fullOnly;
  let h='';
  h+='<tr><td class="l">3a WDV on first day</td>'+iN("WDVFirstDay")+'</tr>';
  if(opts.adj!==false&&!bar115BAC())h+='<tr><td class="l">3b Adjustment 2nd proviso s.115BAC (Rule 5)</td>'+iN("AdjustmentSec115BAC")+'</tr>';  /* DPM-only (opts.adj:false hides it for DOA); rule 282: not for firm/LLP/co-op or new regime */
  if(opts.total!==false)h+='<tr><td class="l">3 Total (3a+3b)</td>'+c(blk.tot3)+'</tr>';
  if(full)h+='<tr><td class="l">4 Additions ≥180 days</td>'+iN("AdditionsGrThan180Days")+'</tr>';
  h+='<tr><td class="l">5 Realization out of 3 or 4</td>'+iN("RealizationTotalPeriod")+'</tr>';
  h+='<tr><td class="l">6 Amount at full rate '+(full?'(3+4−5)':'(3−5)')+'</td>'+c(blk.fullAmt)+'</tr>';
  if(opts.half!==false){
    h+='<tr><td class="l">7 Additions <180 days</td>'+iN("AdditionsLessThan180Days")+'</tr>';
    h+='<tr><td class="l">8 Realization out of 7</td>'+iN("RealizationPeriodDuringYear")+'</tr>';
    h+='<tr><td class="l">9 Amount at half rate (7−8)</td>'+c(blk.halfAmt)+'</tr>';
  }
  h+='<tr><td class="l">10 Depreciation at full rate</td>'+c(blk.depFull)+'</tr>';
  if(opts.half!==false)h+='<tr><td class="l">11 Depreciation at half rate</td>'+c(blk.depHalf)+'</tr>';
  if(opts.addl!==false){
    if(concBar()){
      h+='<tr><td class="l">12–14 Additional depreciation</td><td class="num">'+cell(0)+' <span class="hint">closed by the concessional regime</span></td></tr>';
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
  h+='<tr><td class="l">Capital gains/loss u/s 50 (−ve only if block ceases)</td>'+iN("CapGainUs50")+'</tr>';
  h+='<tr><td class="l">WDV on last day</td>'+c(blk.wdvLast)+'</tr>';
  return h;
}
function oneBlockTable(title,base,blk,opts){
  return '<div class="full"><table class="gt" style="min-width:520px"><thead><tr>'+
    '<th class="l">'+esc(title)+'</th><th style="width:200px">Amount</th></tr></thead><tbody>'+
    blockCol(base,blk,opts)+'</tbody></table></div>';
}
function depFold(){
  const D=S.C.dpm||{}, O=S.C.doa||{}, dep=S.C.dep||{}, dcg=S.C.dcg||{};
  let inner="";
  inner+=note("New tax regime: additional depreciation is nil and the 45% plant & machinery block cannot claim depreciation (Rule 5 / s.115BAD). Only the CapGains-u/s-50 cells may be negative, and only when the block ceases to exist.","");
  inner+=sub("Schedule DPM — Plant & machinery");
  inner+=oneBlockTable("Rate 15%","dpm.r15",D.r15||{},{});
  inner+=oneBlockTable("Rate 30%","dpm.r30",D.r30||{},{});
  inner+=oneBlockTable("Rate 40%","dpm.r40",D.r40||{},{});
  inner+=oneBlockTable("Rate 45% (full-rate only; no additions/half/additional; new regime: nil)","dpm.r45",D.r45||{},{half:false,addl:false,fullOnly:true});
  inner+=sub("Schedule DOA — Other assets");
  inner+='<div class="full"><table class="gt" style="min-width:420px"><thead><tr><th class="l">Land (Nil rate)</th><th style="width:200px">Amount</th></tr></thead><tbody>'+
    '<tr><td class="l">3 WDV on first day</td><td>'+inp("doa.land.WDVFirstDay",{n:1})+'</td></tr>'+
    '<tr><td class="l">WDV on last day</td><td class="num">'+cell((O.land||{}).wdvLast)+'</td></tr></tbody></table></div>';
  inner+=oneBlockTable("Building @ 5%","doa.b5",O.b5||{},{addl:false,total:false,adj:false});
  inner+=oneBlockTable("Building @ 10%","doa.b10",O.b10||{},{addl:false,total:false,adj:false});
  inner+=oneBlockTable("Building @ 40%","doa.b40",O.b40||{},{addl:false,total:false,adj:false});
  inner+=oneBlockTable("Furniture & Fittings @ 10%","doa.furn",O.furn||{},{addl:false,total:false,adj:false});
  inner+=oneBlockTable("Intangible assets @ 25%","doa.intang",O.intang||{},{addl:false,total:false,adj:false});
  inner+=oneBlockTable("Ships @ 20%","doa.ships",O.ships||{},{addl:false,total:false,adj:false});
  /* DEP summary */
  inner+=sub("Schedule DEP — Summary of depreciation (computed)");
  inner+=summaryTable([["1a P&M @15%",dep.pm15],["1b P&M @30%",dep.pm30],["1c P&M @40%",dep.pm40],
    ["1d P&M @45%",dep.pm45],["1e Total P&M",dep.totPM],["2a Building @5%",dep.b5],["2b Building @10%",dep.b10],
    ["2c Building @40%",dep.b40],["2d Total building",dep.totBld],["3 Furniture & fittings",dep.furn],
    ["4 Intangible assets",dep.intang],["5 Ships",dep.ships],["6 Total depreciation → BP A12i",dep.total]]);
  /* DCG summary */
  inner+=sub("Schedule DCG — Deemed capital gains u/s 50 (computed, signed)");
  inner+=summaryTable([["1a P&M @15%",dcg.pm15],["1b P&M @30%",dcg.pm30],["1c P&M @40%",dcg.pm40],
    ["1d P&M @45%",dcg.pm45],["1e Total P&M",dcg.totPM],["2a Building @5%",dcg.b5],["2b Building @10%",dcg.b10],
    ["2c Building @40%",dcg.b40],["2d Total building",dcg.totBld],["3 Furniture & fittings",dcg.furn],
    ["4 Intangible assets",dcg.intang],["5 Ships",dcg.ships],["6 Total deemed capital gains → Schedule CG",dcg.total]]);
  return fold("bp_dep","DPM · DOA · DEP · DCG","Depreciation & deemed capital gains",
    (dep.total?"Depreciation "+RS(dep.total):"Not entered"),inner);
}
function summaryTable(rows){
  return '<div class="full"><table class="gt" style="min-width:420px"><thead><tr><th class="l">Item</th>'+
    '<th style="width:200px">Amount</th></tr></thead><tbody>'+
    rows.map(r=>'<tr><td class="l">'+esc(r[0])+'</td><td class="num">'+cell(r[1])+'</td></tr>').join("")+
    '</tbody></table></div>';
}

/* ---- ESR fold ---- */
function esrFold(){
  const esr=S.C.esr||{rows:{}};
  let rows='';
  ESR_ROWS.forEach(r=>{
    const o=esr.rows[r[0]]||{};
    rows+='<tr><td class="l">'+esc(r[0])+'</td><td class="l">'+esc(r[1])+'</td>'+
      '<td>'+inp("esr."+r[0]+".deb",{n:1})+'</td>'+
      '<td>'+inp("esr."+r[0]+".allow",{n:1})+'</td>'+
      '<td class="num">'+cell(o.excess)+'</td></tr>';
  });
  rows+='<tr><td class="l"></td><td class="l"><b>x Total</b></td><td class="num">'+cell(esr.totDeb)+
    '</td><td class="num">'+cell(esr.totAllow)+'</td><td class="num">'+cell(esr.totExcess)+'</td></tr>';
  const inner=note("Two inputs per section: col (2) amount debited to P&L and col (3) amount allowable; col (4) = "+
    "MAX(0, (3) − (2)) is computed. Total col (4) feeds Schedule BP item A28. Schedule RA is mandatory if any "+
    "deduction is claimed under 35(1)(ii)/(iia)/(iii)/(2AA); a deduction under 35(2AB) requires Form 3CLA.")+
    '<div class="full"><table class="gt" style="min-width:640px"><thead><tr><th class="l" style="width:60px">Sl</th>'+
    '<th class="l">Section</th><th style="width:150px">(2) Debited to P&L</th>'+
    '<th style="width:150px">(3) Allowable</th><th style="width:150px">(4)=(3)−(2)</th></tr></thead><tbody>'+
    rows+'</tbody></table></div>';
  return fold("bp_esr","ESR","Expenditure on scientific research (s.35/35CCC/35CCD)",
    (esr.totExcess?"Excess "+RS(esr.totExcess):"Not claimed"),inner);
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
  rows+='<tr><td class="l"></td><td class="l"><b>XI Total</b></td><td class="num">'+cell(icds.totInc)+
    '</td><td class="num">'+cell(icds.totDec)+'</td><td class="num">'+cell(icds.totNet)+'</td></tr>';
  const inner=note("Effect of the ten ICDS on profit. Net Effect = Increase − Decrease. The total increase feeds "+
    "Part A-OI item 3a (and BP A25); the total decrease feeds Part A-OI item 3b (and BP A32).")+
    '<div class="full"><table class="gt" style="min-width:620px"><thead><tr><th class="l" style="width:60px">Sl</th>'+
    '<th class="l">ICDS</th><th style="width:140px">Increase (+)</th><th style="width:140px">Decrease (−)</th>'+
    '<th style="width:140px">Net Effect</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  return fold("bp_icds","ICDS","Income Computation & Disclosure Standards",
    (icds.totNet?"Net "+RS(icds.totNet):"No effect"),inner);
}

/* =====================================================================
   EXPORT
   ===================================================================== */
function expBp(j){
  const A=(S.C.bp&&S.C.bp.a)||{}, Bp=(S.C.bp&&S.C.bp.b)||{}, Cp=(S.C.bp&&S.C.bp.c)||{}, E=(S.C.bp&&S.C.bp.e)||{};
  const B=S.bp||{};

  /* ---- CorpScheduleBP · Part A (BusinessIncOthThanSpec) ---- */
  const P="CorpScheduleBP.BusinessIncOthThanSpec.";
  put(j,P+"ProfBfrTaxPL",sg(A.K5));
  put(j,P+"NetPLFromSpecBus",sg(A._2a));
  put(j,P+"NetProfLossSpecifiedBus",sg(A._2b));
  put(j,P+"IncRecCredPLOthHeadDtls.HouseProperty",n0(B.a3a));
  put(j,P+"IncRecCredPLOthHeadDtls.CapitalGains",n0(B.a3b));
  put(j,P+"IncRecCredPLOthHeadDtls.OtherSources",n0(A.a3c));
  put(j,P+"IncRecCredPLOthHeadDtls.Dividend",n0(B.a3ci));
  put(j,P+"IncRecCredPLOthHeadDtls.OtherThanDividend",n0(B.a3cii));
  put(j,P+"IncRecCredPLOthHeadDtls.UnderSec115BBF",n0(B.a3d));
  put(j,P+"IncRecCredPLOthHeadDtls.UnderSec115BBG",n0(B.a3e));
  if(n0(A.a3f))put(j,P+"IncRecCredPLOthHeadDtls.UnderSec115BBH",n0(A.a3f));  /* optional; A3f computed = MAX(0,VDA business-head total) */
  const IR="ProfitLossInclRefrdSec.";
  put(j,P+IR+"ProfitLossUs44AD",sg(B.p44AD)); put(j,P+IR+"ProfitLossUs44ADA",sg(B.p44ADA));
  put(j,P+IR+"ProfitLossUs44AE",sg(B.p44AE)); put(j,P+IR+"ProfitLossUs44B",sg(B.p44B));
  put(j,P+IR+"ProfitLossUs44BB",sg(B.p44BB)); put(j,P+IR+"ProfitLossUs44BBA",sg(B.p44BBA));
  put(j,P+IR+"ProfitLossUs44BBC",sg(B.p44BBC)); put(j,P+IR+"ProfitLossUs44BBD",sg(B.p44BBD));
  put(j,P+IR+"ProfitLossUs44DA",sg(B.p44DA)); put(j,P+IR+"FirstSchITActOthr115B",sg(B.pFirstSch));
  put(j,P+"PLUs44sChapXIIGOthrUs115B",n0(B.pl44b));
  put(j,P+"TotalProfitFrmActCvrd",n0(A._4c));
  put(j,P+"ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule7",n0(B.r7));
  put(j,P+"ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule7A",n0(B.r7A));
  put(j,P+"ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule7B1",n0(B.r7B1));
  put(j,P+"ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule7B1A",n0(B.r7B1A));
  put(j,P+"ProfitFrmActCvrd.ProfitFrmActCvrdUndrRule8",n0(B.r8));
  put(j,P+"IncCredPL.FirmShareInc",n0(B.a5a));
  put(j,P+"IncCredPL.AOPBOISharInc",n0(B.a5b));
  put(j,P+"IncCredPL.OtherExmptIncDtl.OperatingDividendName","Dividend");
  put(j,P+"IncCredPL.OtherExmptIncDtl.OperatingDividendAmt",n0(B.divExempt));
  const oth=(B.othExempt||[]).filter(r=>N(r.amt)||st0(r.name)).map(r=>({OperatingRevenueName:sv(r.name),OperatingRevenueAmt:n0(r.amt)}));
  if(oth.length)put(j,P+"IncCredPL.OtherExmptIncDtl.OtherExmptIncDtls",oth);
  put(j,P+"IncCredPL.OthExempInc",n0(A._5c));
  put(j,P+"IncCredPL.TotExempInc",n0(A._5d));
  if(n0(B.a5A))put(j,P+"IncCredPLNotChargable",n0(B.a5A));  /* optional */
  put(j,P+"BalancePLOthThanSpecBus",sg(A._6));
  put(j,P+"ExpDebToPLOthHeadDtls.HouseProperty",n0(B.e7a));
  put(j,P+"ExpDebToPLOthHeadDtls.CapitalGains",n0(B.e7b));
  put(j,P+"ExpDebToPLOthHeadDtls.OtherSources",n0(B.e7c));
  put(j,P+"ExpDebToPLOthHeadDtls.UnderSec115BBF",n0(B.e7d));
  put(j,P+"ExpDebToPLOthHeadDtls.UnderSec115BBG",n0(B.e7e));
  if(n0(B.e7f))put(j,P+"ExpDebToPLOthHeadDtls.UnderSec115BBH",n0(B.e7f));  /* optional */
  put(j,P+"ExpDebToPLExemptInc",n0(B.e8a));
  put(j,P+"ExpDebToPLExemptIncDisAllwUs14A",n0(B.e8b));
  put(j,P+"TotExpDebPL",n0(A._9));
  put(j,P+"AdjustedPLOthThanSpecBus",sg(A._10));
  put(j,P+"DepreciationDebPLCosAct",n0(A._11));   /* A11 computed = MAX(0, P&L 53 + Mfg 1E(vi)) */
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
  put(j,P+"DeemIncUs3380HHD80IA",n0(A._21));
  if(n0(B.d21_32AC))put(j,P+"DeemIncUs32AC",n0(B.d21_32AC));
  if(n0(B.d21_32AD))put(j,P+"DeemIncUs32AD",n0(B.d21_32AD));
  if(n0(B.d21_33AB))put(j,P+"DeemIncUs33AB",n0(B.d21_33AB));
  if(n0(B.d21_33ABA))put(j,P+"DeemIncUs33ABA",n0(B.d21_33ABA));
  if(n0(B.d21_35ABA))put(j,P+"DeemIncUs35ABA",n0(B.d21_35ABA));
  if(n0(B.d21_35ABB))put(j,P+"DeemIncUs35ABB",n0(B.d21_35ABB));
  if(n0(B.d21_35AC))put(j,P+"DeemIncUs35AC",n0(B.d21_35AC));
  if(n0(B.d21_40A3A))put(j,P+"DeemIncUs40A3A",n0(B.d21_40A3A));
  if(n0(B.d21_33AC))put(j,P+"DeemIncUs33AC",n0(B.d21_33AC));
  if(n0(B.d21_72A))put(j,P+"DeemIncUs72A",n0(B.d21_72A));
  if(n0(B.d21_80HHD))put(j,P+"DeemIncUs80HHD",n0(B.d21_80HHD));
  if(n0(B.d21_80IA))put(j,P+"DeemIncUs80IA",n0(B.d21_80IA));
  put(j,P+"DeemIncUs43CA",n0(B.d22));
  put(j,P+"OthItemDisallowUs28To44DB",n0(B.d23));
  put(j,P+"AnyOthIncNotInclInExpDisallowPL",n0(A._24));
  put(j,P+"SalaryExpDisallowPL",n0(B.i24a));
  put(j,P+"BonusExpDisallowPL",n0(B.i24b));
  put(j,P+"CommissionExpDisallowPL",n0(B.i24c));
  put(j,P+"InterestExpDisallowPL",n0(B.i24d));
  put(j,P+"OthersExpDisallowPL",n0(A.e24e));
  put(j,P+"IncProfDecLossAccICDSAdj",n0(A._25));
  put(j,P+"TotAfterAddToPLDeprOthSpecInc",sg(A._26));
  put(j,P+"DeductUs32_1_iii",n0(B.d27));
  put(j,P+"DebPLUs35ExcessAmt",n0(A._28));
  put(j,P+"AmtDisallUs40NowAllow",n0(B.d29));
  put(j,P+"AmtDisallUs43BNowAllow",n0(B.d30));
  put(j,P+"AnyOthAmtAllDeduct",n0(B.d31));
  put(j,P+"DecProfIncLossAccICDSAdj",n0(A._32));
  put(j,P+"TotDeductionAmts",n0(A._33));
  put(j,P+"PLAftAdjDedBusOthThanSpec",sg(A._34));
  const DP="DeemedProfitBusUs.";
  put(j,P+DP+"Section44AD",n0(B.d35_44AD)); put(j,P+DP+"Section44ADA",n0(B.d35_44ADA));
  put(j,P+DP+"Section44AE",n0(B.d35_44AE)); put(j,P+DP+"Section44B",n0(B.d35_44B));
  put(j,P+DP+"Section44BB",n0(B.d35_44BB)); put(j,P+DP+"Section44BBA",n0(B.d35_44BBA));
  put(j,P+DP+"Section44BBC",n0(B.d35_44BBC)); put(j,P+DP+"Section44BBD",n0(B.d35_44BBD));
  put(j,P+DP+"Section44DA",n0(B.d35_44DA)); put(j,P+DP+"FirstSchTActOther",n0(B.d35_FirstSch));
  put(j,P+DP+"TotDeemedProfitBusUs",n0(A._35));
  put(j,P+"NetPLAftAdjBusOthThanSpec",sg(A._36));
  put(j,P+"NetPLBusOthThanSpec7A7B7C",sg(A.A37));
  put(j,P+"ChrgblIncUndrRule7",n0(B.r37a));
  put(j,P+"DeemedChrgblIncUndrRule7A",n0(B.r37b));
  put(j,P+"DeemedChrgblIncUndrRule7B1",n0(B.r37c));
  put(j,P+"DeemedChrgblIncUndrRule7B1A",n0(B.r37d));
  put(j,P+"DeemedChrgblIncUndrRule8",n0(B.r37e));
  put(j,P+"IncomeOtherThanRule",sg(A._37f));
  put(j,P+"BalIncDeemedFrmAgri",n0(A._38));

  /* ---- Part B (SpecBusinessInc) ---- */
  const SB="CorpScheduleBP.SpecBusinessInc.";
  put(j,SB+"NetPLFrmSpecBus",sg(Bp._39));
  put(j,SB+"AdditionUs28to44DB",n0(B.s40));
  put(j,SB+"DeductUs28to44DB",n0(B.s41));
  put(j,SB+"AdjustedPLFrmSpecuBus",sg(Bp.B42));

  /* ---- Part C (IncSpecifiedBusiness) ---- */
  const SC="CorpScheduleBP.IncSpecifiedBusiness.";
  put(j,SC+"NetPLFrmSpecifiedBus",sg(Cp._43));
  put(j,SC+"AddSec28to44DB",n0(B.sp44));
  put(j,SC+"DedSec28to44DBOTDedSec35AD",n0(B.sp45));
  put(j,SC+"ProfitLossSpecifiedBusiness",sg(Cp._46));
  if(n0(Cp._47))put(j,SC+"DedSec35AD",n0(Cp._47));   /* optional */
  put(j,SC+"ProfitLossSpecifiedBusFinal",sg(Cp.C48));
  const clauses=(B.clause||[]).filter(c=>st0(c)).map(c=>({DedUs35ADSubSec5:c}));
  if(clauses.length)put(j,SC+"DedUs35ADSubSec5Dtls",clauses);   /* optional array */

  /* ---- Part D ---- */
  put(j,"CorpScheduleBP.IncChrgUnHdProftGain",sg(S.C.bp?S.C.bp.d:0));

  /* ---- Part E (BusSetoffCurrYr) ---- */
  const BE="CorpScheduleBP.BusSetoffCurrYr.";
  put(j,BE+"LossSetOffOnBusLoss",n0(E.lossSetOff));
  if(E.specInc){
    put(j,BE+"SpeculativeInc.IncOfCurYrUnderThatHead",n0(E.specInc));
    put(j,BE+"SpeculativeInc.BusLossSetoff",n0(E.specSet));
    put(j,BE+"SpeculativeInc.IncOfCurYrAfterSetOff",n0(E.specRemain));
  }
  if(E.specifiedInc){
    put(j,BE+"SpecifiedInc.IncOfCurYrUnderThatHead",n0(E.specifiedInc));
    put(j,BE+"SpecifiedInc.BusLossSetoff",n0(E.specifiedSet));
    put(j,BE+"SpecifiedInc.IncOfCurYrAfterSetOff",n0(E.specifiedRemain));
  }
  put(j,BE+"TotLossSetOffOnBus",n0(E.totSet));
  put(j,BE+"LossRemainSetOffOnBus",n0(E.lossRemain));

  /* ---- ScheduleDPM (all four rate blocks always emitted; PlantMachinery required) ---- */
  const dpm=S.C.dpm||{};
  function putDPM(root,src,blk,opts){
    opts=opts||{};
    const raw=src||{};
    const D2=root+".DepreciationDetail.";
    put(j,D2+"WDVFirstDay",n0(blk.wdv));
    if(!bar115BAC()&&N(raw.AdjustmentSec115BAC))put(j,D2+"AdjustmentSec115BAC",n0(raw.AdjustmentSec115BAC));  /* rule 282: only old-regime non-firm/LLP/co-op */
    if(N(raw.AdjustmentSec115BAC)||blk.tot3)put(j,D2+"Total",n0(blk.tot3));   /* optional computed */
    if(!opts.fullOnly)put(j,D2+"AdditionsGrThan180Days",n0(blk.add180));
    put(j,D2+"RealizationTotalPeriod",n0(blk.realTot));
    put(j,D2+"FullRateDeprAmt",n0(blk.fullAmt));
    if(!opts.fullOnly){
      put(j,D2+"AdditionsLessThan180Days",n0(blk.addLess));
      put(j,D2+"RealizationPeriodDuringYear",n0(blk.realLess));
      put(j,D2+"HalfRateDeprAmt",n0(blk.halfAmt));
    }
    put(j,D2+"DepreciationAtFullRate",n0(blk.depFull));
    if(!opts.fullOnly)put(j,D2+"DepreciationAtHalfRate",n0(blk.depHalf));
    if(!opts.fullOnly&&!concBar()){
      if(N(raw.AddlnDeprOnGT180DayAdditions))put(j,D2+"AddlnDeprOnGT180DayAdditions",n0(blk.addl1));
      if(N(raw.AddlnDeprDuringYearAdditions))put(j,D2+"AddlnDeprDuringYearAdditions",n0(blk.addl2));
      if(N(raw.AddlnDeprOnLessThan180DayAdditions))put(j,D2+"AddlnDeprOnLessThan180DayAdditions",n0(blk.addl3));
    }
    put(j,D2+"TotalDepreciation",n0(blk.totDep));
    put(j,D2+"DepDisAllowUs38_2",n0(blk.disallow));
    put(j,D2+"NetAggregateDepreciation",n0(blk.netAgg));
    put(j,D2+"ProportionateAggDepreciation",n0(blk.pro));
    put(j,D2+"ExpdrOnTrforSaleAsset",n0(blk.expTr));
    put(j,D2+"CapGainUs50",sg(blk.cg50));
    put(j,D2+"WDVLastDay",n0(blk.wdvLast));
  }
  /* emit ScheduleDPM only when a rate block has content (optional at root; PlantMachinery required
     inside it, so all four rates emit together) — matches the DOA/DEP/ESR/ICDS sibling gating */
  const dpmHas=["r15","r30","r40","r45"].some(k=>{
    const blk=dpm[k]||{};
    return anyDOA((S.dpm||{})[k])||N(blk.totDep)||N(blk.wdvLast)||sg(blk.cg50);
  });
  if(dpmHas){
    putDPM("ScheduleDPM.PlantMachinery.Rate15",(S.dpm||{}).r15,dpm.r15||{},{});
    putDPM("ScheduleDPM.PlantMachinery.Rate30",(S.dpm||{}).r30,dpm.r30||{},{});
    putDPM("ScheduleDPM.PlantMachinery.Rate40",(S.dpm||{}).r40,dpm.r40||{},{});
    putDPM("ScheduleDPM.PlantMachinery.Rate45",(S.dpm||{}).r45,dpm.r45||{},{fullOnly:true});  /* reduced leaf set */
  }

  /* ---- ScheduleDOA (per-asset; optional at root, emit only assets with data) ---- */
  const doa=S.C.doa||{};
  function anyDOA(src){
    const raw=src||{};
    return ["WDVFirstDay","AdditionsGrThan180Days","RealizationTotalPeriod","AdditionsLessThan180Days",
      "RealizationPeriodDuringYear","DepDisAllowUs38_2","ProportionateAggDepreciation",
      "ExpdrOnTrforSaleAsset","CapGainUs50"].some(k=>N(raw[k]));
  }
  function putDOA(root,src,blk){
    if(!anyDOA(src)&&!blk.totDep&&!blk.wdvLast&&!blk.cg50)return false;
    const D2=root+".DepreciationDetail.";
    const raw=src||{};
    put(j,D2+"WDVFirstDay",n0(blk.wdv));
    put(j,D2+"AdditionsGrThan180Days",n0(blk.add180));
    put(j,D2+"RealizationTotalPeriod",n0(blk.realTot));
    put(j,D2+"FullRateDeprAmt",n0(blk.fullAmt));
    put(j,D2+"AdditionsLessThan180Days",n0(blk.addLess));
    put(j,D2+"RealizationPeriodDuringYear",n0(blk.realLess));
    put(j,D2+"HalfRateDeprAmt",n0(blk.halfAmt));
    put(j,D2+"DepreciationAtFullRate",n0(blk.depFull));
    put(j,D2+"DepreciationAtHalfRate",n0(blk.depHalf));
    put(j,D2+"TotalDepreciation",n0(blk.totDep));
    put(j,D2+"DepDisAllowUs38_2",n0(blk.disallow));
    put(j,D2+"NetAggregateDepreciation",n0(blk.netAgg));
    put(j,D2+"ProportionateAggDepreciation",n0(blk.pro));
    put(j,D2+"ExpdrOnTrforSaleAsset",n0(blk.expTr));
    put(j,D2+"CapGainUs50",sg(blk.cg50));
    put(j,D2+"WDVLastDay",n0(blk.wdvLast));
    return true;
  }
  const landRaw=(S.doa||{}).land||{};
  if(N(landRaw.WDVFirstDay)){
    put(j,"ScheduleDOA.Land.DepreciationDetail.WDVFirstDay",n0(landRaw.WDVFirstDay));
    put(j,"ScheduleDOA.Land.DepreciationDetail.WDVLastDay",n0((doa.land||{}).wdvLast));
  }
  putDOA("ScheduleDOA.Building.Rate5",(S.doa||{}).b5,doa.b5||{});
  putDOA("ScheduleDOA.Building.Rate10",(S.doa||{}).b10,doa.b10||{});
  putDOA("ScheduleDOA.Building.Rate40",(S.doa||{}).b40,doa.b40||{});
  putDOA("ScheduleDOA.FurnitureFittings.Rate10",(S.doa||{}).furn,doa.furn||{});
  putDOA("ScheduleDOA.IntangibleAssets.Rate25",(S.doa||{}).intang,doa.intang||{});
  putDOA("ScheduleDOA.Ships.Rate20",(S.doa||{}).ships,doa.ships||{});

  /* ---- ScheduleDEP (emit with full required leaves when any depreciation) ---- */
  const dep=S.C.dep||{};
  const dcg=S.C.dcg||{};
  const hasDep=!!(dep.total||dcg.total||dep.totPM||dep.totBld);
  if(hasDep){
    const PM="ScheduleDEP.SummaryFromDeprSch.PlantMachinerySummary.";
    put(j,PM+"DeprBlockTot15Percent",n0(dep.pm15));
    put(j,PM+"DeprBlockTot30Percent",n0(dep.pm30));
    put(j,PM+"DeprBlockTot40Percent",n0(dep.pm40));
    put(j,PM+"DeprBlockTot45Percent",n0(dep.pm45));
    put(j,PM+"TotPlntMach",n0(dep.totPM));
    const BD="ScheduleDEP.SummaryFromDeprSch.BuildingSummary.";
    put(j,BD+"DeprBlockTot5Percent",n0(dep.b5));
    put(j,BD+"DeprBlockTot10Percent",n0(dep.b10));
    put(j,BD+"DeprBlockTot40Percent",n0(dep.b40));
    put(j,BD+"TotBuildng",n0(dep.totBld));
    if(n0(dep.furn))put(j,"ScheduleDEP.SummaryFromDeprSch.FurnitureSummary",n0(dep.furn));
    if(n0(dep.intang))put(j,"ScheduleDEP.SummaryFromDeprSch.IntangibleAssetSummary",n0(dep.intang));
    if(n0(dep.ships))put(j,"ScheduleDEP.SummaryFromDeprSch.ShipsSummary",n0(dep.ships));
    put(j,"ScheduleDEP.SummaryFromDeprSch.TotalDepreciation",n0(dep.total));
    /* ---- ScheduleDCG (signed; may be negative) ---- */
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
  }

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

  /* ---- ScheduleICDS (emit only when FilledFlag TRUE) ---- */
  const icds=S.C.icds||{rows:{}};
  if(icds.filled){
    ICDS_ROWS.forEach(r=>{
      const o=icds.rows[r[0]]||{};
      if(!(o.inc||o.dec))return;
      const b="ScheduleICDS."+r[3]+".";
      put(j,b+"IncreaseInProfit",n0(o.inc));
      put(j,b+"DecreaseInProfit",n0(o.dec));
      put(j,b+"NetEffect",sg(o.net));
    });
    put(j,"ScheduleICDS.TotalNetAmtDetl.IncreaseInProfit",n0(icds.totInc));
    put(j,"ScheduleICDS.TotalNetAmtDetl.DecreaseInProfit",n0(icds.totDec));
  }
}

/* =====================================================================
   IMPORT (inverse of export)
   ===================================================================== */
function impBp(I5){
  const got=[];
  const bp=I5&&I5.CorpScheduleBP;
  if(bp){
    const A=bp.BusinessIncOthThanSpec||{};
    S.bp.pbt=N(A.ProfBfrTaxPL); S.bp.nplSpec=N(A.NetPLFromSpecBus); S.bp.nplSpecified=N(A.NetProfLossSpecifiedBus);
    const ir=A.IncRecCredPLOthHeadDtls||{};
    S.bp.a3a=N(ir.HouseProperty);S.bp.a3b=N(ir.CapitalGains);
    S.bp.a3ci=N(ir.Dividend);S.bp.a3cii=N(ir.OtherThanDividend);
    S.bp.a3d=N(ir.UnderSec115BBF);S.bp.a3e=N(ir.UnderSec115BBG);S.bp.a3f=N(ir.UnderSec115BBH);
    const pr=A.ProfitLossInclRefrdSec||{};
    S.bp.p44AD=N(pr.ProfitLossUs44AD);S.bp.p44ADA=N(pr.ProfitLossUs44ADA);S.bp.p44AE=N(pr.ProfitLossUs44AE);
    S.bp.p44B=N(pr.ProfitLossUs44B);S.bp.p44BB=N(pr.ProfitLossUs44BB);S.bp.p44BBA=N(pr.ProfitLossUs44BBA);
    S.bp.p44BBC=N(pr.ProfitLossUs44BBC);S.bp.p44BBD=N(pr.ProfitLossUs44BBD);S.bp.p44DA=N(pr.ProfitLossUs44DA);
    S.bp.pFirstSch=N(pr.FirstSchITActOthr115B);
    S.bp.pl44b=N(A.PLUs44sChapXIIGOthrUs115B);
    const pf=A.ProfitFrmActCvrd||{};
    S.bp.r7=N(pf.ProfitFrmActCvrdUndrRule7);S.bp.r7A=N(pf.ProfitFrmActCvrdUndrRule7A);
    S.bp.r7B1=N(pf.ProfitFrmActCvrdUndrRule7B1);S.bp.r7B1A=N(pf.ProfitFrmActCvrdUndrRule7B1A);S.bp.r8=N(pf.ProfitFrmActCvrdUndrRule8);
    const ic=A.IncCredPL||{}, od=ic.OtherExmptIncDtl||{};
    S.bp.a5a=N(ic.FirmShareInc);S.bp.a5b=N(ic.AOPBOISharInc);S.bp.divExempt=N(od.OperatingDividendAmt);
    S.bp.othExempt=(od.OtherExmptIncDtls||[]).map(r=>({name:r.OperatingRevenueName||"",amt:N(r.OperatingRevenueAmt)}));
    S.bp.a5A=N(A.IncCredPLNotChargable);
    const ed=A.ExpDebToPLOthHeadDtls||{};
    S.bp.e7a=N(ed.HouseProperty);S.bp.e7b=N(ed.CapitalGains);S.bp.e7c=N(ed.OtherSources);
    S.bp.e7d=N(ed.UnderSec115BBF);S.bp.e7e=N(ed.UnderSec115BBG);S.bp.e7f=N(ed.UnderSec115BBH);
    S.bp.e8a=N(A.ExpDebToPLExemptInc);S.bp.e8b=N(A.ExpDebToPLExemptIncDisAllwUs14A);
    S.bp.depDebPL=N(A.DepreciationDebPLCosAct);
    S.bp.dep32_1_i=N((A.DepreciationAllowITAct32||{}).DepreciationAllowUs32_1_i);
    S.bp.d14=N(A.AmtDebPLDisallowUs36);S.bp.d15=N(A.AmtDebPLDisallowUs37);S.bp.d16=N(A.AmtDebPLDisallowUs40);
    S.bp.d17=N(A.AmtDebPLDisallowUs40A);S.bp.d18=N(A.AmtDebPLDisallowUs43B);S.bp.d19=N(A.InterestDisAllowUs23SMEAct);
    S.bp.deem41=N(A.DeemIncUs41);
    S.bp.d21_32AC=N(A.DeemIncUs32AC);S.bp.d21_32AD=N(A.DeemIncUs32AD);S.bp.d21_33AB=N(A.DeemIncUs33AB);
    S.bp.d21_33ABA=N(A.DeemIncUs33ABA);S.bp.d21_35ABA=N(A.DeemIncUs35ABA);S.bp.d21_35ABB=N(A.DeemIncUs35ABB);
    S.bp.d21_35AC=N(A.DeemIncUs35AC);S.bp.d21_40A3A=N(A.DeemIncUs40A3A);S.bp.d21_33AC=N(A.DeemIncUs33AC);
    S.bp.d21_72A=N(A.DeemIncUs72A);S.bp.d21_80HHD=N(A.DeemIncUs80HHD);S.bp.d21_80IA=N(A.DeemIncUs80IA);
    S.bp.d22=N(A.DeemIncUs43CA);S.bp.d23=N(A.OthItemDisallowUs28To44DB);
    S.bp.i24a=N(A.SalaryExpDisallowPL);S.bp.i24b=N(A.BonusExpDisallowPL);S.bp.i24c=N(A.CommissionExpDisallowPL);
    S.bp.i24d=N(A.InterestExpDisallowPL);S.bp.i24e=N(A.OthersExpDisallowPL);
    /* items 25/32 carry the OI-typed part PLUS the ICDS totals on export; strip the ICDS
       schedule contribution so it is not double-counted when recomputed. */
    {const IC=(I5&&I5.ScheduleICDS)||{},TN=IC.TotalNetAmtDetl||{};
     S.bp.i25=Math.max(0,N(A.IncProfDecLossAccICDSAdj)-N(TN.IncreaseInProfit));
     S.bp.i32=Math.max(0,N(A.DecProfIncLossAccICDSAdj)-N(TN.DecreaseInProfit));}
    S.bp.d27=N(A.DeductUs32_1_iii);S.bp.d29=N(A.AmtDisallUs40NowAllow);S.bp.d30=N(A.AmtDisallUs43BNowAllow);S.bp.d31=N(A.AnyOthAmtAllDeduct);
    const dp=A.DeemedProfitBusUs||{};
    S.bp.d35_44AD=N(dp.Section44AD);S.bp.d35_44ADA=N(dp.Section44ADA);S.bp.d35_44AE=N(dp.Section44AE);
    S.bp.d35_44B=N(dp.Section44B);S.bp.d35_44BB=N(dp.Section44BB);S.bp.d35_44BBA=N(dp.Section44BBA);
    S.bp.d35_44BBC=N(dp.Section44BBC);S.bp.d35_44BBD=N(dp.Section44BBD);S.bp.d35_44DA=N(dp.Section44DA);
    S.bp.d35_FirstSch=N(dp.FirstSchTActOther);
    S.bp.r37a=N(A.ChrgblIncUndrRule7);S.bp.r37b=N(A.DeemedChrgblIncUndrRule7A);S.bp.r37c=N(A.DeemedChrgblIncUndrRule7B1);
    S.bp.r37d=N(A.DeemedChrgblIncUndrRule7B1A);S.bp.r37e=N(A.DeemedChrgblIncUndrRule8);
    const sb=bp.SpecBusinessInc||{};
    S.bp.s40=N(sb.AdditionUs28to44DB);S.bp.s41=N(sb.DeductUs28to44DB);
    const scb=bp.IncSpecifiedBusiness||{};
    S.bp.sp44=N(scb.AddSec28to44DB);S.bp.sp45=N(scb.DedSec28to44DBOTDedSec35AD);S.bp.sp47=N(scb.DedSec35AD);
    S.bp.clause=(scb.DedUs35ADSubSec5Dtls||[]).map(c=>c.DedUs35ADSubSec5||"");
    if(S.bp.clause.length<2)S.bp.clause=S.bp.clause.concat(["",""]).slice(0,2);
    got.push("Schedule BP");
  }
  const dpm=I5&&I5.ScheduleDPM;
  if(dpm&&dpm.PlantMachinery){
    const rd=o=>(o&&o.DepreciationDetail)||{};
    [["Rate15","r15"],["Rate30","r30"],["Rate40","r40"],["Rate45","r45"]].forEach(x=>{S.dpm[x[1]]=Object.assign({},rd(dpm.PlantMachinery[x[0]]));});
    got.push("Schedule DPM");
  }
  const doa=I5&&I5.ScheduleDOA;
  if(doa){
    const rd=o=>(o&&o.DepreciationDetail)||{};
    if(doa.Land)S.doa.land=Object.assign({},rd(doa.Land));
    if(doa.Building){S.doa.b5=Object.assign({},rd(doa.Building.Rate5));S.doa.b10=Object.assign({},rd(doa.Building.Rate10));S.doa.b40=Object.assign({},rd(doa.Building.Rate40));}
    if(doa.FurnitureFittings)S.doa.furn=Object.assign({},rd(doa.FurnitureFittings.Rate10));
    if(doa.IntangibleAssets)S.doa.intang=Object.assign({},rd(doa.IntangibleAssets.Rate25));
    if(doa.Ships)S.doa.ships=Object.assign({},rd(doa.Ships.Rate20));
    got.push("Schedule DOA");
  }
  const esr=I5&&I5.ScheduleESR&&I5.ScheduleESR.DeductionUs35;
  if(esr){
    ESR_ROWS.forEach(r=>{const o=(esr[r[2]]||{}).DeductUs35||{};S.esr[r[0]]={deb:N(o.AmtDebPL),allow:N(o.AmtUs35Allowable)};});
    got.push("Schedule ESR");
  }
  const icds=I5&&I5.ScheduleICDS;
  if(icds){
    ICDS_ROWS.forEach(r=>{const o=icds[r[3]]||{};if(o.IncreaseInProfit!=null||o.DecreaseInProfit!=null)S.icds[r[0]]={inc:N(o.IncreaseInProfit),dec:N(o.DecreaseInProfit)};});
    got.push("Schedule ICDS");
  }
  return got;
}

/* =====================================================================
   CHECKS
   ===================================================================== */
function chkBp(){
  const out=[]; const nw=concBar();
  const A=(S.C.bp&&S.C.bp.a)||{}, Cp=(S.C.bp&&S.C.bp.c)||{}, esr=S.C.esr||{rows:{}};
  const B=S.bp||{};
  const isNRI=st0(S.pi.res).toUpperCase().slice(0,3)==="NRI";

  /* regime closures */
  if(nw){
    const dpmAddl=["r15","r30","r40"].some(k=>{const b=(S.dpm||{})[k]||{};
      return N(b.AddlnDeprOnGT180DayAdditions)||N(b.AddlnDeprDuringYearAdditions)||N(b.AddlnDeprOnLessThan180DayAdditions);});
    if(dpmAddl)out.push({lvl:"warn",t:"Additional depreciation closed",m:"In the new tax regime additional depreciation is not allowed; the entered figures are zeroed.",sec:"bp"});
    const r45=(S.dpm||{}).r45||{};
    if(N(r45.WDVFirstDay)||N(r45.RealizationTotalPeriod))out.push({lvl:"warn",t:"45% block cannot claim depreciation",m:"In the new tax regime the 45% plant & machinery block cannot claim depreciation (s.115BAD); its depreciation is zeroed.",sec:"bp"});
    if(N(B.sp47))out.push({lvl:"warn",t:"35AD(1) deduction closed",m:"In the new tax regime the deduction under section 35AD(1) cannot be claimed (rule 255); item C47 is zeroed.",sec:"bp"});
  }
  /* residency gates on 4a (rules 250/151) — informational, figures not silently dropped */
  if(!isNRI && (N(B.p44B)||N(B.p44BB)||N(B.p44BBA)||N(B.p44BBC)||N(B.p44BBD)||N(B.p44DA)))
    out.push({lvl:"warn",t:"NRI-only presumptive at 4a",m:"Profit u/s 44B/44BB/44BBA/44BBC/44BBD/44DA (4a) applies only to a non-resident.",sec:"bp"});
  if(isNRI && (N(B.p44AD)||N(B.p44ADA)))
    out.push({lvl:"warn",t:"Resident-only presumptive at 4a",m:"Profit u/s 44AD/44ADA (4a) applies only to a resident partnership firm.",sec:"bp"});
  /* A4a should equal A35(i..vii) (rule 238) */
  {const t4a=R(N(B.p44AD)+N(B.p44ADA)+N(B.p44AE)+N(B.p44B)+N(B.p44BB)+N(B.p44BBA)+N(B.p44BBC)+N(B.p44BBD)+N(B.p44DA));
   const t35=R(N(B.d35_44AD)+N(B.d35_44ADA)+N(B.d35_44AE)+N(B.d35_44B)+N(B.d35_44BB)+N(B.d35_44BBA)+N(B.d35_44BBC)+N(B.d35_44BBD)+N(B.d35_44DA));
   if(t4a&&t35&&t4a!==t35)out.push({lvl:"warn",t:"A4a should equal A35",m:"The section-wise presumptive profits at 4a should match the deemed profits at 35i–35vii (rule 238).",sec:"bp"});}
  /* 5c dividend cannot exceed 3ci */
  if(N(B.divExempt)>N(B.a3ci))
    out.push({lvl:"err",t:"Exempt dividend too high",m:"The dividend amount at 5c cannot exceed the dividend income shown at 3ci.",sec:"bp"});
  /* 5c nature special characters */
  if((B.othExempt||[]).some(r=>/[<>&]/.test(st0(r.name))))
    out.push({lvl:"err",t:"Invalid character in 5c nature",m:"The nature of exempt income at 5c cannot contain < > or &.",sec:"bp"});
  /* 35AD(5) clause required when specified-business income/loss entered (rule 246) */
  const cl=(B.clause||[]).filter(c=>st0(c));
  if((N(B.nplSpecified)||N(Cp.C48)||N(B.sp44)||N(B.sp45))&&!cl.length)
    out.push({lvl:"warn",t:"35AD(5) clause needed",m:"Select the relevant clause of section 35AD(5) at C49 when specified-business income/loss is entered.",sec:"bp"});
  if(cl.length===2 && cl[0]===cl[1])
    out.push({lvl:"err",t:"Duplicate 35AD(5) clause",m:"The same clause of sub-section (5) of section 35AD cannot be selected more than once.",sec:"bp"});
  /* ESR -> Schedule RA / Form 3CLA */
  if(esr.checkRA)
    out.push({lvl:"warn",t:"Schedule RA required",m:"A deduction is claimed under 35(1)(ii)/(iia)/(iii) or 35(2AA) — at least one row in Schedule RA is mandatory.",sec:"bp"});
  if(esr.has2AB)
    out.push({lvl:"warn",t:"Form 3CLA for 35(2AB)",m:"A deduction under section 35(2AB) requires Form 3CLA (accountant's report) to be filed.",sec:"bp"});
  /* depreciation: block ceased (CapGainUs50 <> 0 should zero the block's depreciation) */
  const anyCease=["r15","r30","r40","r45"].some(k=>{const b=(S.C.dpm||{})[k]||{};return sg(b.cg50)&&(b.netAgg||b.wdvLast);})
    ||["b5","b10","b40","furn","intang","ships"].some(k=>{const b=(S.C.doa||{})[k]||{};return sg(b.cg50)&&(b.netAgg||b.wdvLast);});
  if(anyCease)out.push({lvl:"warn",t:"Check block that ceased",m:"When capital gains u/s 50 is entered for a block (block ceased), that block's depreciation and WDV on last day should be nil.",sec:"bp"});
  /* income summary */
  if(S.C.bp){
    const d=S.C.bp.income;
    if(d<0)out.push({lvl:"ok",t:"Business loss",m:RS(-d)+" carried to Schedule CYLA / CFL for set off.",sec:"bp"});
    else if(d>0)out.push({lvl:"ok",t:"Business income",m:RS(d)+" chargeable under Profits and gains from Business or profession.",sec:"bp"});
  }
  return out;
}

/* ---- register ---- */
reg({id:"bp", t:"Business or profession and depreciation", ref:"BP · DPM/DOA · DEP/DCG · ESR · ICDS",
  f:secBp, s:()=>{const d=S.C.bp?S.C.bp.income:0;return d<0?"Loss "+CR(-d):(d?"Income "+CR(d):"");},
  eng:engBp, exp:expBp, imp:impBp, chk:chkBp, order:25, corder:25});
