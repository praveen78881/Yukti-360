/* =====================================================================
   ITR-3 · Section "bp" — Business — BP & depreciation
   Books: BP.md, DEP_DCG.md, DPM_DOA.md, ESR.md, ICDS.md,
          Unabsorbed_Depreciation.md   (books/ITR-3/)
   Schema blocks: ITR3ScheduleBP, ITR3ScheduleUD, ScheduleDCG,
                  ScheduleDEP, ScheduleDOA, ScheduleDPM, ScheduleESR,
                  ScheduleICDS.
   Compute order 22. Sets S.C.bp.income = PGBP contribution to GTI
   (item D of Schedule BP, K157, signed).
   Regime gating per books/ITR-3/REGIME.md (isNew()):
     - DPM additional depreciation -> 0 (A309); 45% block dep -> 0 (A310)
     - 35AD deduction cannot be claimed (A287)
     - ESR col-3 allowable for 35(1)(ii)/(iia)/(iii)/(2AA)/35CCC -> 0 (A354)
     - UD 3a 115BAC adjustment only in new regime (rule 624)
   BP is a computed adjustment ladder: almost every line is fed from
   upstream schedules (P&L, Trading, Part A-OI, DEP, ESR, ICDS, EI,
   sheet10/11/12). Those upstream sheets belong to other builders, so
   their leaf figures are captured here as guarded inputs in S.bp; the
   two genuine BP user inputs (5c "any other exempt income" and the
   35AD(5) clause) are surfaced as such. DEP/DPM/DOA/ESR/UD/ICDS are
   owned in full here and feed BP internally (12i<-DEP 6, 28<-ESR X4,
   25/32<-ICDS totals).
   ===================================================================== */

/* ---- state ---- */
S.bp = S.bp || {
  /* Part A — one figure per line (fed from P&L / OI / other schedules) */
  pbt:0,                 /* 1  Profit before tax as per P&L (K5) */
  nplSpec:0,             /* 2a net P/L speculative incl. in 1 (signed) */
  nplSpecified:0,        /* 2b net P/L specified 35AD incl. in 1 (signed) */
  a3a:0,a3b:0,a3c:0,     /* 3a salary 3b HP 3c CG */
  a3di:0,a3dii:0,        /* 3d(i) dividend, 3d(ii) other than dividend */
  a3e:0,a3f:0,a3g:0,     /* 3e 115BBF 3f 115BBG 3g 115BBH */
  pl44:0,                /* profit incl. in 1 referred to sec.44-group / Chapter XII-G */
  p44AD:0,p44ADA:0,p44AE:0,p44B:0,p44BB:0,p44BBA:0,p44BBC:0,p44BBD:0,p44DA:0, /* 4a */
  r7:0,r7A:0,r7B1:0,r7B1A:0,r8:0,                               /* 4b */
  a5a:0,a5b:0,           /* 5a firm share, 5b AOP/BOI share */
  divExempt:0,           /* 5c(i)/(ii) dividend nature+amount */
  othExempt:[],          /* 5c rows [{name,amt}] */
  a5A:0,                 /* 5A income not chargeable */
  e7a:0,e7b:0,e7c:0,e7d:0,e7e:0,e7f:0,e7g:0,                    /* 7a..7g */
  e8a:0,e8b:0,           /* 8a exempt-related exp, 8b 14A (16 of OI) */
  depDebPL:0,            /* 11 depreciation debited to P&L */
  dep32_1_i:0,           /* 12ii dep u/s 32(1)(i) */
  d14:0,d15:0,d16:0,d17:0,d18:0,d19:0,           /* 14..19 disallowances */
  deem41:0,              /* 20 deemed income u/s 41 */
  d21_32AD:0,d21_33AB:0,d21_33ABA:0,d21_35ABA:0,d21_35ABB:0,
  d21_40A3A:0,d21_72A:0,d21_80HHD:0,d21_80IA:0,  /* 21a..21i */
  d22:0,d23:0,           /* 22 43CA, 23 other additions */
  i24a:0,i24b:0,i24c:0,i24d:0,i24e:0,            /* 24a..24e */
  i25:0,                 /* 25 ICDS/stock-valuation increase (OI part) */
  d27:0,                 /* 27 deduction u/s 32(1)(iii) */
  d29:0,d30:0,d31:0,     /* 29 40 now-allow, 30 43B now-allow, 31 other */
  i32:0,                 /* 32 ICDS/stock-valuation decrease (OI part) */
  d35_44AD:0,d35_44ADA:0,d35_44AE:0,d35_44B:0,d35_44BB:0,
  d35_44BBA:0,d35_44BBC:0,d35_44BBD:0,d35_44DA:0,   /* 35i..35vii deemed */
  r37a:0,r37b:0,r37c:0,r37d:0,r37e:0,               /* 37a..37e rule income */
  /* Part B — speculative */
  s40:0,s41:0,           /* 40 additions, 41 deductions (39 = 2a) */
  /* Part C — specified 35AD */
  sp44:0,sp45:0,sp47:0,  /* 44 add, 45 ded, 47 deduction u/s 35AD(1) */
  clause:["",""]         /* 35AD(5) clause dropdown (two rows) */
};
S.dpm = S.dpm || { r15:{}, r30:{}, r40:{}, r45:{} };
S.doa = S.doa || { land:{}, b5:{}, b10:{}, b40:{}, furn:{}, intang:{}, ships:{} };
S.esr = S.esr || {};    /* {i:{deb,allow}, ii:{...}, ... ix} */
S.ud  = S.ud  || { curDep:0, curAllow:0, rows:[] };  /* rows: prior-year array */
S.icds = S.icds || {};  /* {acc:{inc,dec}, inv:{...}, ...} */

SEED["bp.othExempt"] = SEED["bp.othExempt"] || {};
SEED["ud.rows"] = SEED["ud.rows"] || { AssYr:"2024-25" };

/* ---- the 35AD(5) clause value list (from BP.md; not in enums.json) ---- */
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
];   /* [key, label, schemaKey, gatedInNewRegime] */

/* ---- depreciation block engine (DPM & DOA) ---- */
function bpBlock(b,rate,opts){
  b=b||{};opts=opts||{};
  const addlOK   = opts.addl!==false && !isNew();   /* additional depr: old regime only (A309) */
  const blocked  = opts.blocked && isNew();          /* 45% block: no dep in new regime (A310) */
  const halfOK   = opts.half!==false;                /* Rate45 & Land carry no half-rate row */
  const wdv = N(b.WDVFirstDay);
  const adj = isNew()?N(b.AdjustmentSec115BAC):0;    /* 2nd proviso 115BAC WDV adj (new regime) */
  const tot3 = Math.max(0, wdv+adj);                          /* [F12] Total(3a+3b) */
  const add180 = N(b.AdditionsGrThan180Days), realTot = N(b.RealizationTotalPeriod);
  const fullBase = tot3 + add180 - realTot;
  const fullAmt = Math.max(0, fullBase);                      /* [F15] Sl.6 */
  const addLess = halfOK?N(b.AdditionsLessThan180Days):0, realLess = halfOK?N(b.RealizationPeriodLessThan180days):0;
  const halfAmt = halfOK?Math.max(0, addLess - realLess + Math.min(0,fullBase)):0;   /* [F18] Sl.9 */
  let depFull = Math.round(fullAmt*rate/100);                 /* [F19] Sl.10 */
  let depHalf = halfOK?Math.round(halfAmt*rate/200):0;        /* [F20] Sl.11 half = rate/200 */
  const addl1 = addlOK?N(b.AddlnDeprOnGT180DayAdditions):0;
  const addl2 = addlOK?N(b.AddlnDeprOnLessThan180DayAdditions):0;
  const addl3 = addlOK?N(b.AddlnDeprOnAssetLessThan180Days):0;
  if(blocked){depFull=0;depHalf=0;}
  const totDep = depFull+depHalf+addl1+addl2+addl3;           /* [F24] Sl.15 */
  const disallow = N(b.DepDisAllowUs38_2);                    /* Sl.16 */
  const netAgg = Math.max(0, totDep-disallow);               /* [F26] Sl.17 */
  const pro = N(b.ProportionateAggDepreciation);             /* Sl.18 */
  const wdvLast = Math.max(0, fullAmt+halfAmt-totDep);       /* [F30] (6+9-15) */
  const cg50 = sg(b.CapGainUs50);                            /* Sl.20 (may be negative) */
  return {rate,wdv,adj,tot3,add180,realTot,fullAmt,addLess,realLess,halfAmt,
    depFull,depHalf,addl1,addl2,addl3,totDep,disallow,netAgg,pro,wdvLast,cg50,
    dep:(pro>0?pro:netAgg)};   /* DEP summary: proportionate if >0 else net aggregate */
}

/* =====================================================================
   ENGINE
   ===================================================================== */
function engBp(){
  const B=S.bp||{};
  const nb=k=>N(B[k]), sgb=k=>sg(B[k]);

  /* ---------- ICDS (feeds BP 25 / 32) ---------- */
  const icds={rows:{}};
  let icdsInc=0, icdsDec=0;
  ICDS_ROWS.forEach(r=>{
    const o=(S.icds||{})[r[0]]||{};
    const inc=N(o.inc), dec=N(o.dec);
    icds.rows[r[0]]={inc:R(inc),dec:R(dec),net:R(inc-dec)};    /* [H6] Net = In - De */
    icdsInc+=inc; icdsDec+=dec;
  });
  icds.totInc=Math.max(0,R(icdsInc));   /* [F16] */
  icds.totDec=Math.max(0,R(icdsDec));   /* [G16] */
  icds.totNet=R(icdsInc-icdsDec);       /* [H16] */
  S.C.icds=icds;

  /* ---------- ESR (feeds BP 28 and 24e) ---------- */
  const esr={rows:{}}; let eDeb=0,eAllow=0,eExcess=0,eShort=0;
  ESR_ROWS.forEach(r=>{
    const o=(S.esr||{})[r[0]]||{};
    const deb=N(o.deb);
    let allow=N(o.allow);
    if(isNew()&&r[3])allow=0;                     /* A354: col-3 = 0 for gated rows, new regime */
    const excess=Math.max(0, allow-deb);          /* [G5] (4)=(3)-(2), floored 0 */
    if(allow-deb<0)eShort+=Math.abs(allow-deb);   /* neg (col3-col2) -> BP 24(e) */
    esr.rows[r[0]]={deb:R(deb),allow:R(allow),excess:R(excess),gatedZeroed:isNew()&&r[3]&&N(o.allow)>0};
    eDeb+=deb; eAllow+=allow; eExcess+=excess;
  });
  esr.totDeb=R(eDeb); esr.totAllow=R(eAllow); esr.totExcess=R(eExcess); esr.shortfall=R(eShort);
  S.C.esr=esr;

  /* ---------- DPM ---------- */
  const dpm={
    r15:bpBlock(S.dpm&&S.dpm.r15,15,{}),
    r30:bpBlock(S.dpm&&S.dpm.r30,30,{}),
    r40:bpBlock(S.dpm&&S.dpm.r40,40,{}),
    r45:bpBlock(S.dpm&&S.dpm.r45,45,{half:false,addl:false,blocked:true})   /* no half/addl; blocked new regime */
  };
  S.C.dpm=dpm;
  /* ---------- DOA ---------- */
  const landB=(S.doa&&S.doa.land)||{};
  const land={wdv:N(landB.WDVFirstDay),wdvLast:Math.max(0,N(landB.WDVFirstDay)),dep:0,cg50:0};  /* Nil rate [F55] */
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

  /* ---------- DEP (summary of depreciation, from DPM/DOA) ---------- */
  const dep={};
  dep.pm15=dpm.r15.dep; dep.pm30=dpm.r30.dep; dep.pm40=dpm.r40.dep; dep.pm45=dpm.r45.dep;
  dep.totPM=R(dep.pm15+dep.pm30+dep.pm40+dep.pm45);                 /* [J13] 1e */
  dep.b5=doa.b5.dep; dep.b10=doa.b10.dep; dep.b40=doa.b40.dep;
  dep.totBld=R(dep.b5+dep.b10+dep.b40);                            /* [J18] 2d */
  dep.furn=doa.furn.dep; dep.intang=doa.intang.dep; dep.ships=doa.ships.dep;
  dep.total=Math.max(0,R(dep.totPM+dep.totBld+dep.furn+dep.intang+dep.ships));   /* [J22] item 6 */
  S.C.dep=dep;

  /* ---------- DCG (deemed capital gains u/s 50, from DPM/DOA) ---------- */
  const dcg={};
  dcg.pm15=dpm.r15.cg50; dcg.pm30=dpm.r30.cg50; dcg.pm40=dpm.r40.cg50; dcg.pm45=dpm.r45.cg50;
  dcg.totPM=R(dcg.pm15+dcg.pm30+dcg.pm40+dcg.pm45);                /* [J34] */
  dcg.b5=doa.b5.cg50; dcg.b10=doa.b10.cg50; dcg.b40=doa.b40.cg50;
  dcg.totBld=R(dcg.b5+dcg.b10+dcg.b40);                            /* [J39] */
  dcg.furn=doa.furn.cg50; dcg.intang=doa.intang.cg50; dcg.ships=doa.ships.cg50;
  dcg.total=R(dcg.totPM+dcg.totBld+dcg.furn+dcg.intang+dcg.ships); /* [J43] (signed) */
  S.C.dcg=dcg;

  /* ---------- UD (unabsorbed depreciation / 35(4) allowance) ---------- */
  const ud={rows:[]};
  let tBF=0,tAdj=0,tSO=0,tBal=0,tBFa=0,tSOa=0,tBala=0;
  (S.ud&&S.ud.rows||[]).forEach(r=>{
    const bf=N(r.AmtBFUD), adj=isNew()?N(r.AdjustAccTax115BACAmt):0;   /* 3a only new regime (rule 624) */
    const so=N(r.AmtDeprSOCY), bal=Math.max(0, bf-adj-so);            /* [H8] (5)=(3)-(3a)-(4) */
    const bfa=N(r.AmtBFUAllow), soa=N(r.AmtAllowSOCY), bala=Math.max(0, bfa-soa);  /* [K8] (8)=(6)-(7) */
    ud.rows.push({ay:st0(r.AssYr),bf:R(bf),adj:R(adj),so:R(so),bal:R(bal),bfa:R(bfa),soa:R(soa),bala:R(bala)});
    tBF+=bf;tAdj+=adj;tSO+=so;tBal+=bal;tBFa+=bfa;tSOa+=soa;tBala+=bala;
  });
  ud.curDep=R(N(S.ud&&S.ud.curDep));    /* current AY balance CF (5) */
  ud.curAllow=R(N(S.ud&&S.ud.curAllow));/* current AY balance CF (8) */
  ud.totBF=R(tBF); ud.totAdj=R(tAdj); ud.totSO=R(tSO);
  ud.totBal=R(tBal+ud.curDep);          /* [H19] incl. current-year balance */
  ud.totBFa=R(tBFa); ud.totSOa=R(tSOa);
  ud.totBala=R(tBala+ud.curAllow);      /* [K19] incl. current-year balance */
  S.C.ud=ud;

  /* ================= BP LADDER — Part A ================= */
  const K5 = R(nb("pbt"));                                    /* 1 */
  const _2a = sgb("nplSpec"), _2b = sgb("nplSpecified");      /* 2a, 2b */
  const _3d = R(nb("a3di")+nb("a3dii"));                       /* 3d = div + other */
  const sum3 = R(nb("a3a")+nb("a3b")+nb("a3c")+_3d+nb("a3e")+nb("a3f")+nb("a3g"));
  const _4a = R(sgb("p44AD")+sgb("p44ADA")+sgb("p44AE")+sgb("p44B")+sgb("p44BB")+sgb("p44BBA")+sgb("p44BBC")+sgb("p44BBD")+sgb("p44DA")); /* [I18] */
  const _4b = R(nb("r7")+nb("r7A")+nb("r7B1")+nb("r7B1A")+nb("r8"));    /* [I29] */
  const othExemptTot = R((B.othExempt||[]).reduce((a,r)=>a+N(r.amt),0));
  const _5ciii = R(nb("divExempt")+othExemptTot);             /* [I46] */
  const _5d = R(nb("a5a")+nb("a5b")+_5ciii);                  /* [I47] 5d */
  const _5A = R(nb("a5A"));
  const _6 = R(K5 - _2a - _2b - sum3 - _4a - _4b - _5d - _5A);/* [K49] 6 */
  const _9 = R(nb("e7a")+nb("e7b")+nb("e7c")+nb("e7d")+nb("e7e")+nb("e7f")+nb("e7g")+nb("e8a")+nb("e8b")); /* [I60] 9 */
  const _10 = R(_6+_9);                                       /* [K61] 10 */
  const _11 = R(nb("depDebPL"));                              /* 11 */
  const _12i = R(dep.total>0?dep.total:0);                    /* [I64] 12i = DEP col6 */
  const _12ii = R(nb("dep32_1_i"));                           /* 12ii */
  const _12iii = R(_12i+_12ii);                              /* [K66] */
  const _13 = R(_10+_11-_12iii);                             /* [K67] 13 */
  const _20 = R(nb("deem41"));                                /* 20 */
  const _21 = Math.max(0, R(nb("d21_32AD")+nb("d21_33AB")+nb("d21_33ABA")+nb("d21_35ABA")+nb("d21_35ABB")+nb("d21_40A3A")+nb("d21_72A")+nb("d21_80HHD")+nb("d21_80IA"))); /* [I75] 21 */
  const e24e = R(nb("i24e") || esr.shortfall);               /* 24e (ESR neg (3-2) if not entered) */
  const _24 = R(nb("i24a")+nb("i24b")+nb("i24c")+nb("i24d")+e24e); /* [I88] 24 */
  const _25 = R(nb("i25")+icds.totInc);                      /* [K94] 25 (OI stock-dev + ICDS increase) */
  const _26 = R(nb("d14")+nb("d15")+nb("d16")+nb("d17")+nb("d18")+nb("d19")+_20+_21+nb("d22")+nb("d23")+_24+_25); /* [K95] 26 = 14..25 */
  const _28 = R(esr.totExcess);                              /* [I98] 28 = ESR X(4) */
  const _32 = R(nb("i32")+icds.totDec);                      /* [K106] 32 (OI stock-dev + ICDS decrease) */
  const _33 = R(nb("d27")+_28+nb("d29")+nb("d30")+nb("d31")+_32);  /* [K107] 33 = 27..32 */
  const _34 = R(_13+_26-_33);                                /* [K108] 34 = 13+26-33 */
  const _35 = Math.max(0, R(nb("d35_44AD")+nb("d35_44ADA")+nb("d35_44AE")+nb("d35_44B")+nb("d35_44BB")+nb("d35_44BBA")+nb("d35_44BBC")+nb("d35_44BBD")+nb("d35_44DA"))); /* [K122] 35viii */
  const _36 = R(_34+_35);                                    /* [K130] 36 = 34+35viii */
  const _37f = _36;                                          /* [I137] 37f = item 36 */
  const A37 = R(nb("r37a")+nb("r37b")+nb("r37c")+nb("r37d")+nb("r37e")+_37f);  /* [K131] A37 */
  const _38 = Math.max(0, R(_4b - (nb("r37a")+nb("r37b")+nb("r37c")+nb("r37d")+nb("r37e"))));   /* [K138] 38 */

  /* ================= Part B — speculative ================= */
  const _39 = _2a;                                           /* [K140] 39 = 2a */
  const _40 = R(nb("s40")), _41 = R(nb("s41"));
  const B42 = R(_39+_40-_41);                                /* [K143] B42 = 39+40-41 */

  /* ================= Part C — specified 35AD ================= */
  const _43 = _2b;                                           /* [K145] 43 = 2b */
  const _44 = R(nb("sp44")), _45 = R(nb("sp45"));
  const _46 = R(_43+_44-_45);                                /* [K148] 46 = 43+44-45 */
  const _47 = isNew()?0:R(nb("sp47"));                       /* A287: 35AD deduction barred new regime */
  const C48 = R(_46-_47);                                    /* [K152] C48 = 46-47 */

  /* ================= Part D ================= */
  const D = R(Math.max(0,C48)+Math.max(0,B42)+A37);          /* [K157] D = A37 + B42 + C48 */

  /* ================= Part E — intra-head set off ================= */
  const lossSetOff = Math.abs(Math.min(0, A37));             /* [I166] loss to set off */
  const specInc = Math.max(0, B42);                          /* [G167] */
  const specifiedInc = Math.max(0, C48);                     /* [G168] */
  const specSet = Math.min(lossSetOff, specInc);            /* [I167] */
  const specifiedSet = Math.min(lossSetOff-specSet, specifiedInc); /* [I168] */
  const totSet = R(specSet+specifiedSet);                    /* [I169] */
  const lossRemain = R(Math.max(0, lossSetOff-totSet));      /* [I170] */

  S.C.bp = {
    on:true,
    a:{K5,_2a,_2b,sum3,_3d,_4a,_4b,_5ciii,_5d,_5A,_6,_9,_10,_11,_12i,_12ii,_12iii,_13,
       _20,_21,e24e,_24,_25,_26,_28,_32,_33,_34,_35,_36,_37f,A37,_38},
    b:{_39,_40,_41,B42},
    c:{_43,_44,_45,_46,_47,C48},
    d:D,
    e:{lossSetOff,specInc,specifiedInc,specSet,specifiedSet,totSet,lossRemain},
    /* the head's signed contribution to Gross Total Income (rolled up by tax section) */
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
  const nw=isNew();
  let h="";
  h+=formNote("Schedule BP is a computed adjustment ladder. Most lines carry forward from Schedule "+
    "P&L, the Trading and Manufacturing accounts, Part A-OI and Schedules DEP/ESR/ICDS/EI — enter each "+
    "figure as it appears there. The only free entries are the 5c exempt-income table and the 35AD(5) "+
    "clause. Depreciation (DPM/DOA), its summary (DEP/DCG), ESR, unabsorbed depreciation (UD) and ICDS "+
    "are the sub-schedules below and feed this ladder automatically.");

  /* ---- Part A ---- */
  h+=sub("A — Business other than speculative & specified business");
  h+=rBP("1  Profit before tax as per profit and loss account",inpN("bp.pbt"),"A1");
  h+=rBP("2a  Net profit/loss from speculative business included in 1",inpN("bp.nplSpec"),"A2a",{hint:"enter −ve for a loss"});
  h+=rBP("2b  Net profit/loss from specified business u/s 35AD included in 1",inpN("bp.nplSpecified"),"A2b",{hint:"enter −ve for a loss"});
  h+=sub("3 — Income credited to P&L considered under other heads / 115BBF-G-H");
  h+=rBP("3a  Salaries",inpN("bp.a3a"),"A3a",{ind:1});
  h+=rBP("3b  House Property",inpN("bp.a3b"),"A3b",{ind:1});
  h+=rBP("3c  Capital Gains",inpN("bp.a3c"),"A3c",{ind:1});
  h+=rBP("3d(i)  Dividend Income",inpN("bp.a3di"),"A3di",{ind:1});
  h+=rBP("3d(ii)  Other than Dividend Income",inpN("bp.a3dii"),"A3dii",{ind:1});
  h+=rBP("3d  Other Sources (3d(i)+3d(ii))",cell(A._3d),"A3d",{ind:1});
  h+=rBP("3e  u/s 115BBF",inpN("bp.a3e"),"A3e",{ind:1});
  h+=rBP("3f  u/s 115BBG",inpN("bp.a3f"),"A3f",{ind:1});
  h+=rBP("3g  u/s 115BBH (net of cost of acquisition)",inpN("bp.a3g"),"A3g",{ind:1});
  h+=sub("4a — Profit incl. in 1 referred to 44AD/ADA/AE/B/BB/BBA/BBC/BBD/DA");
  [["p44AD","44AD"],["p44ADA","44ADA"],["p44AE","44AE"],["p44B","44B"],["p44BB","44BB"],
   ["p44BBA","44BBA"],["p44BBC","44BBC"],["p44BBD","44BBD"],["p44DA","44DA"]].forEach(x=>
     h+=rBP("4a · "+x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("4a  Total (should equal 35i to 35vii)",cell(A._4a),"A4a");
  h+=sub("4b — Profit from activities covered under rule 7/7A/7B(1)/7B(1A)/8");
  [["r7","Rule 7"],["r7A","Rule 7A"],["r7B1","Rule 7B(1)"],["r7B1A","Rule 7B(1A)"],["r8","Rule 8"]].forEach(x=>
     h+=rBP("4b · "+x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("4b  Total",cell(A._4b),"A4b");
  h+=sub("5 — Income credited to P&L which is exempt");
  h+=rBP("5a  Share of income from firm(s)",inpN("bp.a5a"),"A5a");
  h+=rBP("5b  Share of income from AOP/BOI",inpN("bp.a5b"),"A5b");
  h+=rBP("5c(i)/(ii)  Nature: Dividend — Amount (cannot exceed 3d(i))",inpN("bp.divExempt"),"A5c");
  h+=grid("bp.othExempt",[{k:"name",h:"Nature of exempt income",t:"txt",w:"60%"},{k:"amt",h:"Amount",t:"num",w:"30%"}],
    (S.bp&&S.bp.othExempt)||[],{empty:"No other exempt income.",add:"Add exempt income"});
  h+=rBP("5c(iii)  Total (dividend + other)",cell(A._5ciii),"A5ciii");
  h+=rBP("5d  Total exempt income (5a+5b+5c(iii))",cell(A._5d),"A5d");
  h+=rBP("5A  Income/receipts credited to P&L but not chargeable to tax",inpN("bp.a5A"),"A5A");
  h+=rBP("6  Balance (1 − 2a − 2b − 3a…3g − 4a − 4b − 5d − 5A)",cell(A._6),"A6");
  h+=sub("7/8 — Expenses debited to P&L under other heads / exempt / 14A");
  [["e7a","7a Salaries"],["e7b","7b House Property"],["e7c","7c Capital Gains"],["e7d","7d Other Sources"],
   ["e7e","7e u/s 115BBF"],["e7f","7f u/s 115BBG"],["e7g","7g u/s 115BBH"],
   ["e8a","8a relate to exempt income"],["e8b","8b disallowed u/s 14A (16 of Part A-OI)"]].forEach(x=>
     h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("9  Total (7a…7g + 8a + 8b)",cell(A._9),"A9");
  h+=rBP("10  Adjusted profit or loss (6 + 9)",cell(A._10),"A10");
  h+=rBP("11  Depreciation & amortization debited to P&L",inpN("bp.depDebPL"),"A11");
  h+=rBP("12i  Depreciation allowable u/s 32(1)(ii) & (iia) — col 6 of Schedule DEP",cell(A._12i),"A12i");
  h+=rBP("12ii  Depreciation allowable u/s 32(1)(i) (Appendix-IA)",inpN("bp.dep32_1_i"),"A12ii");
  h+=rBP("12iii  Total (12i + 12ii)",cell(A._12iii),"A12iii");
  h+=rBP("13  Profit/loss after adjustment for depreciation (10 + 11 − 12iii)",cell(A._13),"A13");
  h+=sub("14–25 — Amounts to be added back");
  [["d14","14 disallowable u/s 36 (6s of OI)"],["d15","15 disallowable u/s 37 (7J of OI)"],
   ["d16","16 disallowable u/s 40 (8Aj of OI)"],["d17","17 disallowable u/s 40A (9F of OI)"],
   ["d18","18 disallowable u/s 43B (11i of OI)"],["d19","19 interest disallowed u/s 23 MSMED Act (17 of OI)"],
   ["deem41","20 deemed income u/s 41"]].forEach(x=>h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  [["d21_32AD","21a 32AD"],["d21_33AB","21b 33AB"],["d21_33ABA","21c 33ABA"],["d21_35ABA","21d 35ABA"],
   ["d21_35ABB","21e 35ABB"],["d21_40A3A","21f 40A(3A)"],["d21_72A","21g 72A"],["d21_80HHD","21h 80HHD"],
   ["d21_80IA","21i 80-IA"]].forEach(x=>h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("21  Deemed income u/s 32AD/33AB/…/80-IA (total)",cell(A._21),"A21");
  h+=rBP("22  Deemed income u/s 43CA",inpN("bp.d22"),"A22",{ind:1});
  h+=rBP("23  Any other item of addition u/s 28 to 44DA",inpN("bp.d23"),"A23",{ind:1});
  [["i24a","24a Salary"],["i24b","24b Bonus"],["i24c","24c Commission"],["i24d","24d Interest"],
   ["i24e","24e Others"]].forEach(x=>h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("24  Any other income not in P&L / expense not allowable (total)",cell(A._24),"A24");
  h+=rBP("25  Increase in profit on account of ICDS/stock valuation (3a+4d of OI + Sch ICDS)",
    inp("bp.i25",{n:1}),"A25",{v2:cell(A._25),hint:"OI part typed; Schedule ICDS increase added automatically"});
  h+=rBP("26  Total (14 … 25)",cell(A._26),"A26");
  h+=sub("27–32 — Amounts to be deducted");
  h+=rBP("27  Deduction allowable u/s 32(1)(iii)",inpN("bp.d27"),"A27",{ind:1});
  h+=rBP("28  Deduction u/s 35/35CCC/35CCD in excess of amount debited — X(4) of Schedule ESR",cell(A._28),"A28",{ind:1});
  h+=rBP("29  Amount disallowed u/s 40 in earlier year, now allowable (8B of OI)",inpN("bp.d29"),"A29",{ind:1});
  h+=rBP("30  Amount disallowed u/s 43B in earlier year, now allowable (10i of OI)",inpN("bp.d30"),"A30",{ind:1});
  h+=rBP("31  Any other amount allowable as deduction",inpN("bp.d31"),"A31",{ind:1});
  h+=rBP("32  Decrease in profit on account of ICDS/stock valuation (3b+4e of OI + Sch ICDS)",
    inp("bp.i32",{n:1}),"A32",{v2:cell(A._32),hint:"OI part typed; Schedule ICDS decrease added automatically"});
  h+=rBP("33  Total (27 … 32)",cell(A._33),"A33");
  h+=rBP("34  Income (13 + 26 − 33)",cell(A._34),"A34");
  h+=sub("35 — Profits/gains deemed to be under presumptive sections");
  [["d35_44AD","35i 44AD (61(ii) of P&L)"],["d35_44ADA","35ii 44ADA (62(ii) of P&L)"],
   ["d35_44AE","35iii 44AE (63(ii) of P&L)"],["d35_44B","35iv 44B"],["d35_44BB","35v 44BB"],
   ["d35_44BBA","35via 44BBA"],["d35_44BBC","35vib 44BBC"],["d35_44BBD","35vic 44BBD"],
   ["d35_44DA","35vii 44DA"]].forEach(x=>h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("35viii  Total (35i to 35vii)",cell(A._35),"A35viii");
  h+=rBP("36  Net profit/loss (34 + 35viii)",cell(A._36),"A36");
  h+=sub("A37 — after rule 7A/7B/8");
  [["r37a","37a Chargeable income under Rule 7"],["r37b","37b Deemed chargeable income under Rule 7A"],
   ["r37c","37c Deemed chargeable income under Rule 7B(1)"],["r37d","37d Deemed chargeable income under Rule 7B(1A)"],
   ["r37e","37e Deemed chargeable income under Rule 8"]].forEach(x=>h+=rBP(x[1],inpN("bp."+x[0]),"",{ind:1}));
  h+=rBP("37f  Income other than Rule 7,7A,7B & 8 (item 36)",cell(A._37f),"A37f",{ind:1});
  h+=rBP("A37  Net P/L after rule 7A/7B/8 (37a…37f)",cell(A.A37),"A37");
  h+=rBP("38  Balance income deemed to be from agriculture (Rule 7/7A/7B/8)",cell(A._38),"A38");

  /* ---- Part B ---- */
  h+=sub("B — Speculative business");
  h+=rBP("39  Net P/L from speculative business (item 2a)",cell(Bp._39),"B39");
  h+=rBP("40  Additions in accordance with section 28 to 44DA",inpN("bp.s40"),"B40");
  h+=rBP("41  Deductions in accordance with section 28 to 44DA",inpN("bp.s41"),"B41");
  h+=rBP("B42  Income from speculative business (39 + 40 − 41)",cell(Bp.B42),"B42",{hint:"if loss → 6ix of Schedule CFL"});

  /* ---- Part C ---- */
  h+=sub("C — Specified business under section 35AD");
  h+=rBP("43  Net P/L from specified business (item 2b)",cell(Cp._43),"C43");
  h+=rBP("44  Additions in accordance with section 28 to 44DA",inpN("bp.sp44"),"C44");
  h+=rBP("45  Deductions u/s 28 to 44DA (other than 35AD / 32 or 35 on which 35AD claimed)",inpN("bp.sp45"),"C45");
  h+=rBP("46  Profit/loss from specified business (43 + 44 − 45)",cell(Cp._46),"C46");
  if(nw) h+=rBP("47  Deduction in accordance with section 35AD(1)",cell(0),"C47",
    {hint:"closed by section 115BAC — 35AD deduction cannot be claimed in the new regime"});
  else   h+=rBP("47  Deduction in accordance with section 35AD(1)",inpN("bp.sp47"),"C47");
  h+=rBP("C48  Income from specified business (46 − 47)",cell(Cp.C48),"C48",{hint:"if loss → 7ix of Schedule CFL"});
  h+=rBP("Relevant clause of sub-section (5) of section 35AD (row 1)",sel("bp.clause.0",BP_35AD5),"35AD(5)");
  h+=rBP("Relevant clause of sub-section (5) of section 35AD (row 2)",sel("bp.clause.1",BP_35AD5),"35AD(5)");

  /* ---- Part D & E ---- */
  h+=sub("D & E — Chargeable income and intra-head set off");
  h+=rBP("D  Income chargeable under 'Profits and gains from Business or profession' (A37 + B42 + C48)",cell(S.C.bp?S.C.bp.d:0),"D");
  h+=rBP("E(i)  Business loss of current year to be set off",cell(E.lossSetOff),"E i");
  h+=rBP("E(ii)  Income from speculative business",cell(E.specInc),"E ii",{v2:cell(E.specSet)});
  h+=rBP("E(iii)  Income from specified business",cell(E.specifiedInc),"E iii",{v2:cell(E.specifiedSet)});
  h+=rBP("E(iv)  Total loss set off (ii + iii)",cell(E.totSet),"E iv");
  h+=rBP("E(v)  Loss remaining after set off (i − iv)",cell(E.lossRemain),"E v");
  h+=note("Note: include the income of the specified persons referred to in Schedule SPI while computing income under this head.");

  /* ---- Sub-schedules ---- */
  h+=depFold();
  h+=esrFold();
  h+=udFold();
  h+=icdsFold();
  return h;
}

/* ---- DPM/DOA/DEP/DCG fold ---- */
function blockCol(base,blk,opts){
  opts=opts||{};
  const c=n=>'<td class="num">'+cell(n)+'</td>';
  const iN=k=>'<td>'+inp(base+"."+k,{n:1})+'</td>';
  let h='';
  h+='<tr><td class="l">3 WDV on first day</td>'+iN("WDVFirstDay")+'</tr>';
  if(isNew())h+='<tr><td class="l">3a Adjustment 2nd proviso s.115BAC (Rule 5)</td>'+iN("AdjustmentSec115BAC")+'</tr>';
  h+='<tr><td class="l">3 Total (3a+3b)</td>'+c(blk.tot3)+'</tr>';
  h+='<tr><td class="l">4 Additions ≥180 days</td>'+iN("AdditionsGrThan180Days")+'</tr>';
  h+='<tr><td class="l">5 Realization out of 3 or 4</td>'+iN("RealizationTotalPeriod")+'</tr>';
  h+='<tr><td class="l">6 Amount at full rate (3+4−5)</td>'+c(blk.fullAmt)+'</tr>';
  if(opts.half!==false){
    h+='<tr><td class="l">7 Additions <180 days</td>'+iN("AdditionsLessThan180Days")+'</tr>';
    h+='<tr><td class="l">8 Realization out of 7</td>'+iN("RealizationPeriodLessThan180days")+'</tr>';
    h+='<tr><td class="l">9 Amount at half rate (7−8)</td>'+c(blk.halfAmt)+'</tr>';
  }
  h+='<tr><td class="l">10 Depreciation at full rate</td>'+c(blk.depFull)+'</tr>';
  if(opts.half!==false)h+='<tr><td class="l">11 Depreciation at half rate</td>'+c(blk.depHalf)+'</tr>';
  if(opts.addl!==false){
    if(isNew()){
      h+='<tr><td class="l">12–14 Additional depreciation</td><td class="num">'+cell(0)+' <span class="hint">closed by section 115BAC</span></td></tr>';
    }else{
      h+='<tr><td class="l">12 Additional depr. on 4</td>'+iN("AddlnDeprOnGT180DayAdditions")+'</tr>';
      h+='<tr><td class="l">13 Additional depr. on 7</td>'+iN("AddlnDeprOnLessThan180DayAdditions")+'</tr>';
      h+='<tr><td class="l">14 Additional depr. (prec. yr, <180 days)</td>'+iN("AddlnDeprOnAssetLessThan180Days")+'</tr>';
    }
  }
  h+='<tr><td class="l">Total depreciation</td>'+c(blk.totDep)+'</tr>';
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
  inner+=note("New tax regime: additional depreciation is nil and the 45% plant & machinery block cannot claim depreciation (Rule 5, sections A309/A310).","");
  inner+=sub("Schedule DPM — Plant & machinery");
  inner+=oneBlockTable("Rate 15%","dpm.r15",D.r15||{},{});
  inner+=oneBlockTable("Rate 30%","dpm.r30",D.r30||{},{});
  inner+=oneBlockTable("Rate 40%","dpm.r40",D.r40||{},{});
  inner+=oneBlockTable("Rate 45% (no half-rate / additional; new regime: nil)","dpm.r45",D.r45||{},{half:false,addl:false});
  inner+=sub("Schedule DOA — Other assets");
  inner+='<div class="full"><table class="gt" style="min-width:420px"><thead><tr><th class="l">Land (Nil rate)</th><th style="width:200px">Amount</th></tr></thead><tbody>'+
    '<tr><td class="l">3 WDV on first day</td><td>'+inp("doa.land.WDVFirstDay",{n:1})+'</td></tr>'+
    '<tr><td class="l">WDV on last day</td><td class="num">'+cell((O.land||{}).wdvLast)+'</td></tr></tbody></table></div>';
  inner+=oneBlockTable("Building @ 5%","doa.b5",O.b5||{},{addl:false});
  inner+=oneBlockTable("Building @ 10%","doa.b10",O.b10||{},{addl:false});
  inner+=oneBlockTable("Building @ 40%","doa.b40",O.b40||{},{addl:false});
  inner+=oneBlockTable("Furniture & Fittings @ 10%","doa.furn",O.furn||{},{addl:false});
  inner+=oneBlockTable("Intangible assets @ 25%","doa.intang",O.intang||{},{addl:false});
  inner+=oneBlockTable("Ships @ 20%","doa.ships",O.ships||{},{addl:false});
  /* DEP summary */
  inner+=sub("Schedule DEP — Summary of depreciation (computed)");
  inner+=summaryTable([["1a P&M @15%",dep.pm15],["1b P&M @30%",dep.pm30],["1c P&M @40%",dep.pm40],
    ["1d P&M @45%",dep.pm45],["1e Total P&M",dep.totPM],["2a Building @5%",dep.b5],["2b Building @10%",dep.b10],
    ["2c Building @40%",dep.b40],["2d Total building",dep.totBld],["3 Furniture & fittings",dep.furn],
    ["4 Intangible assets",dep.intang],["5 Ships",dep.ships],["6 Total depreciation → BP 12i",dep.total]]);
  /* DCG summary */
  inner+=sub("Schedule DCG — Deemed capital gains u/s 50 (computed, signed)");
  inner+=summaryTable([["1a P&M @15%",dcg.pm15],["1b P&M @30%",dcg.pm30],["1c P&M @40%",dcg.pm40],
    ["1d P&M @45%",dcg.pm45],["1e Total P&M",dcg.totPM],["2a Building @5%",dcg.b5],["2b Building @10%",dcg.b10],
    ["2c Building @40%",dcg.b40],["2d Total building",dcg.totBld],["3 Furniture & fittings",dcg.furn],
    ["4 Intangible assets",dcg.intang],["5 Ships",dcg.ships],["Total deemed capital gains",dcg.total]]);
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
  const nw=isNew();
  let rows='';
  ESR_ROWS.forEach(r=>{
    const o=esr.rows[r[0]]||{};
    const allowCell=(nw&&r[3])
      ?(cell(0)+' <span class="hint">closed by s.115BAC</span>')
      :inp("esr."+r[0]+".allow",{n:1});
    rows+='<tr><td class="l">'+esc(r[0])+'</td><td class="l">'+esc(r[1])+'</td>'+
      '<td>'+inp("esr."+r[0]+".deb",{n:1})+'</td>'+
      '<td>'+allowCell+'</td>'+
      '<td class="num">'+cell(o.excess)+'</td></tr>';
  });
  rows+='<tr><td class="l"></td><td class="l"><b>x Total</b></td><td class="num">'+cell(esr.totDeb)+
    '</td><td class="num">'+cell(esr.totAllow)+'</td><td class="num">'+cell(esr.totExcess)+'</td></tr>';
  const inner=note("Weighted deductions u/s 35(1)(ii)/(iia)/(iii)/35(2AA) and 35CCC (col 3) are closed in the "+
    "new regime (A354). Schedule RA is mandatory if any deduction is claimed under 35(1)(ii)/(iia)/(iii)/(2AA). "+
    "Total col (4) feeds Schedule BP item 28.")+
    '<div class="full"><table class="gt" style="min-width:640px"><thead><tr><th class="l" style="width:60px">Sl</th>'+
    '<th class="l">Section</th><th style="width:150px">(2) Debited to P&L</th>'+
    '<th style="width:150px">(3) Allowable</th><th style="width:150px">(4)=(3)−(2)</th></tr></thead><tbody>'+
    rows+'</tbody></table></div>';
  return fold("bp_esr","ESR","Expenditure on scientific research (s.35/35CCC/35CCD)",
    (esr.totExcess?"Excess "+RS(esr.totExcess):"Not claimed"),inner);
}

/* ---- UD fold ---- */
function udFold(){
  const ud=S.C.ud||{rows:[]};
  const nw=isNew();
  let rows='';
  (S.ud&&S.ud.rows||[]).forEach((r,i)=>{
    const c=ud.rows[i]||{};
    rows+='<tr><td>'+inp("ud.rows."+i+".AssYr",{max:7,ph:"2024-25"})+'</td>'+
      '<td>'+inp("ud.rows."+i+".AmtBFUD",{n:1})+'</td>'+
      '<td>'+(nw?inp("ud.rows."+i+".AdjustAccTax115BACAmt",{n:1}):cell(0))+'</td>'+
      '<td>'+inp("ud.rows."+i+".AmtDeprSOCY",{n:1})+'</td>'+
      '<td class="num">'+cell(c.bal)+'</td>'+
      '<td>'+inp("ud.rows."+i+".AmtBFUAllow",{n:1})+'</td>'+
      '<td>'+inp("ud.rows."+i+".AmtAllowSOCY",{n:1})+'</td>'+
      '<td class="num">'+cell(c.bala)+'</td>'+
      '<td class="x"><button data-del="ud.rows.'+i+'" title="Remove">'+TRASH+'</button></td></tr>';
  });
  if(!(S.ud&&S.ud.rows||[]).length)rows='<tr><td class="emp" colspan="9">No prior-year unabsorbed depreciation.</td></tr>';
  const inner=note("Prior assessment years (up to AY 2025-26; no year twice). Balance CF columns (5) and (8) are "+
    "computed: (5)=(3)−(3a)−(4), (8)=(6)−(7). The 115BAC adjustment (3a) applies only in the new regime.")+
    '<div class="full"><table class="gt" style="min-width:820px"><thead><tr>'+
    '<th class="l">AY (2)</th><th>(3) BF depr.</th><th>(3a) 115BAC</th><th>(4) Set-off</th><th>(5) Bal CF</th>'+
    '<th>(6) BF allow.</th><th>(7) Set-off</th><th>(8) Bal CF</th><th class="x"></th></tr></thead><tbody>'+
    rows+'</tbody></table></div><button class="add" data-add="ud.rows">Add a prior year</button>'+
    '<div class="full"><table class="gt" style="min-width:820px"><thead><tr><th class="l">Current AY 2026-27</th>'+
    '<th>(5) Depr. balance CF</th><th>(8) Allowance balance CF</th></tr></thead><tbody><tr>'+
    '<td class="l">2026-27</td><td>'+inp("ud.curDep",{n:1})+'</td><td>'+inp("ud.curAllow",{n:1})+'</td></tr>'+
    '<tr><td class="l"><b>Total</b></td><td class="num">'+cell(ud.totBal)+'</td><td class="num">'+cell(ud.totBala)+'</td></tr>'+
    '</tbody></table></div>';
  const st=(ud.totBal||ud.totBala)?"CF "+RS(ud.totBal+ud.totBala):"None";
  return fold("bp_ud","UD","Unabsorbed depreciation & s.35(4) allowance",st,inner);
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
    "Schedule BP item 25 and the total decrease feeds item 32.")+
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
  const P="ITR3ScheduleBP.BusinessIncOthThanSpec.";
  /* Part A */
  put(j,P+"ProfBfrTaxPL",sg(A.K5));
  put(j,P+"NetPLFromSpecBus",sg(A._2a));
  put(j,P+"NetPLFromSpecifiedBus",sg(A._2b));
  put(j,P+"IncRecCredPLOthHeadDtls.Salary",n0(B.a3a));
  put(j,P+"IncRecCredPLOthHeadDtls.HouseProperty",n0(B.a3b));
  put(j,P+"IncRecCredPLOthHeadDtls.CapitalGains",n0(B.a3c));
  put(j,P+"IncRecCredPLOthHeadDtls.OtherSources",n0(A._3d));
  put(j,P+"IncRecCredPLOthHeadDtls.Dividend",n0(B.a3di));
  put(j,P+"IncRecCredPLOthHeadDtls.OtherThanDividend",n0(B.a3dii));
  put(j,P+"IncRecCredPLOthHeadDtls.Us115BBF",n0(B.a3e));
  put(j,P+"IncRecCredPLOthHeadDtls.Us115BBG",n0(B.a3f));
  put(j,P+"IncRecCredPLOthHeadDtls.115BBH",n0(B.a3g));
  put(j,P+"PLUs44sChapXIIG",n0(B.pl44));
  const IR="ProfitLossInclRefrdSec.";
  put(j,P+IR+"ProfitLossUs44AD",sg(B.p44AD)); put(j,P+IR+"ProfitLossUs44ADA",sg(B.p44ADA));
  put(j,P+IR+"ProfitLossUs44AE",sg(B.p44AE)); put(j,P+IR+"ProfitLossUs44B",sg(B.p44B));
  put(j,P+IR+"ProfitLossUs44BB",sg(B.p44BB)); put(j,P+IR+"ProfitLossUs44BBA",sg(B.p44BBA));
  put(j,P+IR+"ProfitLossUs44BBC",sg(B.p44BBC)); put(j,P+IR+"ProfitLossUs44BBD",sg(B.p44BBD));
  put(j,P+IR+"ProfitLossUs44DA",sg(B.p44DA));
  put(j,P+"TotalProfitFrmActCvrd",n0(A._4b));
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
  put(j,P+"IncCredPL.OthExempInc",n0(A._5ciii));
  put(j,P+"IncCredPL.TotExempIncPL",n0(A._5d));
  if(n0(B.a5A))put(j,P+"IncCredPLNotChargable",n0(B.a5A));
  put(j,P+"BalancePLOthThanSpecBus",sg(A._6));
  put(j,P+"ExpDebToPLOthHeadDtls.Salary",n0(B.e7a));
  put(j,P+"ExpDebToPLOthHeadDtls.HouseProperty",n0(B.e7b));
  put(j,P+"ExpDebToPLOthHeadDtls.CapitalGains",n0(B.e7c));
  put(j,P+"ExpDebToPLOthHeadDtls.OtherSources",n0(B.e7d));
  put(j,P+"ExpDebToPLOthHeadDtls.Us115BBF",n0(B.e7e));
  put(j,P+"ExpDebToPLOthHeadDtls.Us115BBG",n0(B.e7f));
  put(j,P+"ExpDebToPLOthHeadDtls.115BBH",n0(B.e7g));
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
  put(j,P+"DeemIncUs3380HHD80IA",n0(A._21));
  if(n0(B.d21_32AD))put(j,P+"DeemIncUs32AD",n0(B.d21_32AD));
  if(n0(B.d21_33AB))put(j,P+"DeemIncUs33AB",n0(B.d21_33AB));
  if(n0(B.d21_33ABA))put(j,P+"DeemIncUs33ABA",n0(B.d21_33ABA));
  if(n0(B.d21_35ABA))put(j,P+"DeemIncUs35ABA",n0(B.d21_35ABA));
  if(n0(B.d21_35ABB))put(j,P+"DeemIncUs35ABB",n0(B.d21_35ABB));
  if(n0(B.d21_40A3A))put(j,P+"DeemIncUs40A3A",n0(B.d21_40A3A));
  if(n0(B.d21_72A))put(j,P+"DeemIncUs72A",n0(B.d21_72A));
  if(n0(B.d21_80HHD))put(j,P+"DeemIncUs80HHD",n0(B.d21_80HHD));
  if(n0(B.d21_80IA))put(j,P+"DeemIncUs80IA",n0(B.d21_80IA));
  put(j,P+"DeemIncUs43CA",n0(B.d22));
  put(j,P+"OthItemDisallowUs28To44DA",n0(B.d23));
  put(j,P+"AnyOthIncNotInclInExpDisallowPL",n0(A._24));
  put(j,P+"AnyOthIncNotInclInSalary",n0(B.i24a));
  put(j,P+"AnyOthIncNotInclInBonus",n0(B.i24b));
  put(j,P+"AnyOthIncNotInclInCommission",n0(B.i24c));
  put(j,P+"AnyOthIncNotInclInInterest",n0(B.i24d));
  put(j,P+"AnyOthIncNotInclInOthers",n0(A.e24e));
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
  put(j,P+DP+"Section44DA",n0(B.d35_44DA)); put(j,P+DP+"TotDeemedProfitBusUs",n0(A._35));
  put(j,P+"NetPLAftAdjBusOthThanSpec",sg(A._36));
  put(j,P+"NetPLBusOthThanSpec7A7B7C",sg(A.A37));
  put(j,P+"ChrgblIncUndrRule7",n0(B.r37a));
  put(j,P+"DeemedChrgblIncUndrRule7A",n0(B.r37b));
  put(j,P+"DeemedChrgblIncUndrRule7B1",n0(B.r37c));
  put(j,P+"DeemedChrgblIncUndrRule7B1A",n0(B.r37d));
  put(j,P+"DeemedChrgblIncUndrRule8",n0(B.r37e));
  put(j,P+"IncomeOtherThanRule",sg(A._37f));
  put(j,P+"BalIncDeemedFrmAgri",n0(A._38));
  /* Part B */
  const SB="ITR3ScheduleBP.SpecBusinessInc.";
  put(j,SB+"NetPLFrmSpecBus",sg(Bp._39));
  put(j,SB+"AdditionUs28to44DA",n0(B.s40));
  put(j,SB+"DeductUs28to44DA",n0(B.s41));
  put(j,SB+"AdjustedPLFrmSpecuBus",sg(Bp.B42));
  /* Part C */
  const SC="ITR3ScheduleBP.SpecifiedBusinessInc.";
  put(j,SC+"NetPLFrmSpecifiedBus",sg(Cp._43));
  put(j,SC+"AddSec28to44DA",n0(B.sp44));
  put(j,SC+"DedSec28to44DAOTDedSec35AD",n0(B.sp45));
  put(j,SC+"ProfitLossSpecifiedBusiness",sg(Cp._46));
  if(n0(Cp._47))put(j,SC+"DeductionUs35AD",n0(Cp._47));
  put(j,SC+"PLFrmSpecifiedBus",sg(Cp.C48));
  const clauses=(B.clause||[]).filter(c=>st0(c)).map(c=>({DedUs35ADSubSec5:c}));
  if(clauses.length)put(j,SC+"DedUs35ADSubSec5Dtls",clauses);
  /* Part D */
  put(j,"ITR3ScheduleBP.IncChrgUnHdProftGain",sg(S.C.bp?S.C.bp.d:0));
  /* Part E */
  const BE="ITR3ScheduleBP.BusSetoffCurrYr.";
  put(j,BE+"LossSetOffOnBusLoss",n0(E.lossSetOff));
  put(j,BE+"SpeculativeInc.IncOfCurYrUnderThatHead",n0(E.specInc));
  put(j,BE+"SpeculativeInc.BusLossSetoff",n0(E.specSet));
  put(j,BE+"SpeculativeInc.IncOfCurYrAfterSetOff",n0(E.specInc-E.specSet));
  put(j,BE+"SpecifiedInc.IncOfCurYrUnderThatHead",n0(E.specifiedInc));
  put(j,BE+"SpecifiedInc.BusLossSetoff",n0(E.specifiedSet));
  put(j,BE+"SpecifiedInc.IncOfCurYrAfterSetOff",n0(E.specifiedInc-E.specifiedSet));
  put(j,BE+"TotLossSetOffOnBus",n0(E.totSet));
  put(j,BE+"LossRemainSetOffOnBus",n0(E.lossRemain));

  /* ---- ScheduleDPM / ScheduleDOA ---- */
  const dpm=S.C.dpm||{}, doa=S.C.doa||{};
  const wrote={dpm:false,doa:false};
  function putBlock(root,base,src,blk,opts){
    opts=opts||{};
    const raw=src||{};
    const any=["WDVFirstDay","AdditionsGrThan180Days","RealizationTotalPeriod","AdditionsLessThan180Days",
      "RealizationPeriodLessThan180days","DepDisAllowUs38_2","ProportionateAggDepreciation",
      "ExpdrOnTrforSaleAsset","CapGainUs50","AdjustmentSec115BAC","AddlnDeprOnGT180DayAdditions",
      "AddlnDeprOnLessThan180DayAdditions","AddlnDeprOnAssetLessThan180Days"].some(k=>N(raw[k]));
    if(!any && !blk.totDep && !blk.wdvLast && !blk.cg50)return false;
    const D=root+".DepreciationDetail.";
    put(j,D+"WDVFirstDay",n0(blk.wdv));
    if(isNew()&&N(raw.AdjustmentSec115BAC))put(j,D+"AdjustmentSec115BAC",n0(raw.AdjustmentSec115BAC));
    /* 'Total' exists only on the DPM DepreciationDetail, not the DOA one (opts.total===false) */
    if(opts.total!==false&&(N(raw.AdjustmentSec115BAC)||blk.tot3))put(j,D+"Total",n0(blk.tot3));
    put(j,D+"AdditionsGrThan180Days",n0(blk.add180));
    put(j,D+"RealizationTotalPeriod",n0(blk.realTot));
    put(j,D+"FullRateDeprAmt",n0(blk.fullAmt));
    if(opts.half!==false){
      put(j,D+"AdditionsLessThan180Days",n0(blk.addLess));
      put(j,D+"RealizationPeriodLessThan180days",n0(blk.realLess));
      put(j,D+"HalfRateDeprAmt",n0(blk.halfAmt));
    }
    put(j,D+"DepreciationAtFullRate",n0(blk.depFull));
    if(opts.half!==false)put(j,D+"DepreciationAtHalfRate",n0(blk.depHalf));
    if(opts.addl!==false&&!isNew()){
      if(N(raw.AddlnDeprOnGT180DayAdditions))put(j,D+"AddlnDeprOnGT180DayAdditions",n0(blk.addl1));
      if(N(raw.AddlnDeprOnLessThan180DayAdditions))put(j,D+"AddlnDeprOnLessThan180DayAdditions",n0(blk.addl2));
      if(N(raw.AddlnDeprOnAssetLessThan180Days))put(j,D+"AddlnDeprOnAssetLessThan180Days",n0(blk.addl3));
    }
    put(j,D+"TotalDepreciation",n0(blk.totDep));
    put(j,D+"DepDisAllowUs38_2",n0(blk.disallow));
    put(j,D+"NetAggregateDepreciation",n0(blk.netAgg));
    put(j,D+"ProportionateAggDepreciation",n0(blk.pro));
    put(j,D+"ExpdrOnTrforSaleAsset",n0(raw.ExpdrOnTrforSaleAsset));
    put(j,D+"CapGainUs50",sg(blk.cg50));
    put(j,D+"WDVLastDay",n0(blk.wdvLast));
    return true;
  }
  [["Rate15","r15",{}],["Rate30","r30",{}],["Rate40","r40",{}],["Rate45","r45",{half:false,addl:false}]].forEach(x=>{
    if(putBlock("ScheduleDPM.PlantMachinery."+x[0],"dpm."+x[1],(S.dpm||{})[x[1]],dpm[x[1]]||{},x[2]))wrote.dpm=true;
  });
  /* DOA */
  const landRaw=(S.doa||{}).land||{};
  if(N(landRaw.WDVFirstDay)){
    put(j,"ScheduleDOA.Land.DepreciationDetail.WDVFirstDay",n0(landRaw.WDVFirstDay));
    put(j,"ScheduleDOA.Land.DepreciationDetail.WDVLastDay",n0((doa.land||{}).wdvLast));
    wrote.doa=true;
  }
  [["Building.Rate5","b5"],["Building.Rate10","b10"],["Building.Rate40","b40"],
   ["FurnitureFittings.Rate10","furn"],["IntangibleAssets.Rate25","intang"],["Ships.Rate20","ships"]].forEach(x=>{
    if(putBlock("ScheduleDOA."+x[0],"doa."+x[1],(S.doa||{})[x[1]],doa[x[1]]||{},{addl:false,total:false}))wrote.doa=true;
  });

  /* ---- ScheduleDEP (always emit — required object) ---- */
  const dep=S.C.dep||{};
  put(j,"ScheduleDEP.SummaryFromDeprSch.PlantMachinerySummary.DeprBlockTot15Percent",n0(dep.pm15));
  put(j,"ScheduleDEP.SummaryFromDeprSch.PlantMachinerySummary.DeprBlockTot30Percent",n0(dep.pm30));
  put(j,"ScheduleDEP.SummaryFromDeprSch.PlantMachinerySummary.DeprBlockTot40Percent",n0(dep.pm40));
  put(j,"ScheduleDEP.SummaryFromDeprSch.PlantMachinerySummary.DeprBlockTot45Percent",n0(dep.pm45));
  put(j,"ScheduleDEP.SummaryFromDeprSch.PlantMachinerySummary.TotPlntMach",n0(dep.totPM));
  put(j,"ScheduleDEP.SummaryFromDeprSch.BuildingSummary.DeprBlockTot5Percent",n0(dep.b5));
  put(j,"ScheduleDEP.SummaryFromDeprSch.BuildingSummary.DeprBlockTot10Percent",n0(dep.b10));
  put(j,"ScheduleDEP.SummaryFromDeprSch.BuildingSummary.DeprBlockTot40Percent",n0(dep.b40));
  put(j,"ScheduleDEP.SummaryFromDeprSch.BuildingSummary.TotBuildng",n0(dep.totBld));
  if(n0(dep.furn))put(j,"ScheduleDEP.SummaryFromDeprSch.FurnitureSummary",n0(dep.furn));
  if(n0(dep.intang))put(j,"ScheduleDEP.SummaryFromDeprSch.IntangibleAssetSummary",n0(dep.intang));
  if(n0(dep.ships))put(j,"ScheduleDEP.SummaryFromDeprSch.ShipsSummary",n0(dep.ships));
  put(j,"ScheduleDEP.SummaryFromDeprSch.TotalDepreciation",n0(dep.total));
  /* ---- ScheduleDCG (always emit — required object; signed) ---- */
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

  /* ---- ITR3ScheduleUD (emit if any data) ---- */
  const ud=S.C.ud||{rows:[]};
  const udRows=(S.ud&&S.ud.rows||[]);
  if(udRows.length||ud.curDep||ud.curAllow){
    put(j,"ITR3ScheduleUD.CurrAssYr","2026-27");
    put(j,"ITR3ScheduleUD.CurBalCFNY",n0(ud.curDep));
    put(j,"ITR3ScheduleUD.CurAllowBalCFNY",n0(ud.curAllow));
    const arr=ud.rows.filter((r,i)=>st0(r.ay)||r.bf||r.bfa).map(r=>{
      const o={AssYr:r.ay,AmtBFUD:n0(r.bf),AmtDeprSOCY:n0(r.so),BalCFNY:n0(r.bal),
        AmtBFUAllow:n0(r.bfa),AmtAllowSOCY:n0(r.soa),AllowBalCFNY:n0(r.bala)};
      if(n0(r.adj))o.AdjustAccTax115BACAmt=n0(r.adj);
      return o;
    });
    if(arr.length)put(j,"ITR3ScheduleUD.ScheduleUD",arr);
    put(j,"ITR3ScheduleUD.TotBFUDepritAmt",n0(ud.totBF));
    if(n0(ud.totAdj))put(j,"ITR3ScheduleUD.TotAdjustAccTax115BACAmt",n0(ud.totAdj));
    put(j,"ITR3ScheduleUD.TotCurYrdepritSetoffInc",n0(ud.totSO));
    put(j,"ITR3ScheduleUD.TotDepritBalCFNY",n0(ud.totBal));
    put(j,"ITR3ScheduleUD.TotBFUAllowAmt",n0(ud.totBFa));
    put(j,"ITR3ScheduleUD.TotCurYrAllowSetoffInc",n0(ud.totSOa));
    put(j,"ITR3ScheduleUD.TotalBalCFNY",n0(ud.totBala));
  }

  /* ---- ScheduleICDS (emit if any figure) ---- */
  const icds=S.C.icds||{rows:{}};
  if(icds.totInc||icds.totDec){
    ICDS_ROWS.forEach(r=>{
      const o=icds.rows[r[0]]||{};
      if(!(o.inc||o.dec))return;
      const _icb="ScheduleICDS."+r[3]; put(j,_icb+".IncreaseInProfit",n0(o.inc));
      put(j,_icb+".DecreaseInProfit",n0(o.dec));
      put(j,_icb+".NetEffect",sg(o.net));
    });
    put(j,"ScheduleICDS.TotalNetAmtDetl.IncreaseInProfit",n0(icds.totInc));
    put(j,"ScheduleICDS.TotalNetAmtDetl.DecreaseInProfit",n0(icds.totDec));
  }
}

/* =====================================================================
   IMPORT
   ===================================================================== */
function impBp(I3){
  const got=[];
  const bp=I3&&I3.ITR3ScheduleBP;
  if(bp){
    const A=bp.BusinessIncOthThanSpec||{};
    S.bp.pbt=N(A.ProfBfrTaxPL); S.bp.nplSpec=N(A.NetPLFromSpecBus); S.bp.nplSpecified=N(A.NetPLFromSpecifiedBus);
    const ir=A.IncRecCredPLOthHeadDtls||{};
    S.bp.a3a=N(ir.Salary);S.bp.a3b=N(ir.HouseProperty);S.bp.a3c=N(ir.CapitalGains);
    S.bp.a3di=N(ir.Dividend);S.bp.a3dii=N(ir.OtherThanDividend);S.bp.a3e=N(ir.Us115BBF);S.bp.a3f=N(ir.Us115BBG);S.bp.a3g=N(ir["115BBH"]);
    const pr=A.ProfitLossInclRefrdSec||{};
    S.bp.p44AD=N(pr.ProfitLossUs44AD);S.bp.p44ADA=N(pr.ProfitLossUs44ADA);S.bp.p44AE=N(pr.ProfitLossUs44AE);
    S.bp.p44B=N(pr.ProfitLossUs44B);S.bp.p44BB=N(pr.ProfitLossUs44BB);S.bp.p44BBA=N(pr.ProfitLossUs44BBA);
    S.bp.p44BBC=N(pr.ProfitLossUs44BBC);S.bp.p44BBD=N(pr.ProfitLossUs44BBD);S.bp.p44DA=N(pr.ProfitLossUs44DA);
    const pf=A.ProfitFrmActCvrd||{};
    S.bp.r7=N(pf.ProfitFrmActCvrdUndrRule7);S.bp.r7A=N(pf.ProfitFrmActCvrdUndrRule7A);
    S.bp.r7B1=N(pf.ProfitFrmActCvrdUndrRule7B1);S.bp.r7B1A=N(pf.ProfitFrmActCvrdUndrRule7B1A);S.bp.r8=N(pf.ProfitFrmActCvrdUndrRule8);
    const ic=A.IncCredPL||{}, od=ic.OtherExmptIncDtl||{};
    S.bp.a5a=N(ic.FirmShareInc);S.bp.a5b=N(ic.AOPBOISharInc);S.bp.divExempt=N(od.OperatingDividendAmt);
    S.bp.othExempt=(od.OtherExmptIncDtls||[]).map(r=>({name:r.OperatingRevenueName||"",amt:N(r.OperatingRevenueAmt)}));
    S.bp.a5A=N(A.IncCredPLNotChargable);
    const ed=A.ExpDebToPLOthHeadDtls||{};
    S.bp.e7a=N(ed.Salary);S.bp.e7b=N(ed.HouseProperty);S.bp.e7c=N(ed.CapitalGains);S.bp.e7d=N(ed.OtherSources);
    S.bp.e7e=N(ed.Us115BBF);S.bp.e7f=N(ed.Us115BBG);S.bp.e7g=N(ed["115BBH"]);
    S.bp.e8a=N(A.ExpDebToPLExemptInc);S.bp.e8b=N(A.ExpDebToPLExemptIncDisAllwUs14A);
    S.bp.depDebPL=N(A.DepreciationDebPLCosAct);
    S.bp.dep32_1_i=N((A.DepreciationAllowITAct32||{}).DepreciationAllowUs32_1_i);
    S.bp.d14=N(A.AmtDebPLDisallowUs36);S.bp.d15=N(A.AmtDebPLDisallowUs37);S.bp.d16=N(A.AmtDebPLDisallowUs40);
    S.bp.d17=N(A.AmtDebPLDisallowUs40A);S.bp.d18=N(A.AmtDebPLDisallowUs43B);S.bp.d19=N(A.InterestDisAllowUs23SMEAct);
    S.bp.deem41=N(A.DeemIncUs41);
    S.bp.d21_32AD=N(A.DeemIncUs32AD);S.bp.d21_33AB=N(A.DeemIncUs33AB);S.bp.d21_33ABA=N(A.DeemIncUs33ABA);
    S.bp.d21_35ABA=N(A.DeemIncUs35ABA);S.bp.d21_35ABB=N(A.DeemIncUs35ABB);S.bp.d21_40A3A=N(A.DeemIncUs40A3A);
    S.bp.d21_72A=N(A.DeemIncUs72A);S.bp.d21_80HHD=N(A.DeemIncUs80HHD);S.bp.d21_80IA=N(A.DeemIncUs80IA);
    S.bp.d22=N(A.DeemIncUs43CA);S.bp.d23=N(A.OthItemDisallowUs28To44DA);
    S.bp.i24a=N(A.AnyOthIncNotInclInSalary);S.bp.i24b=N(A.AnyOthIncNotInclInBonus);S.bp.i24c=N(A.AnyOthIncNotInclInCommission);
    S.bp.i24d=N(A.AnyOthIncNotInclInInterest);S.bp.i24e=N(A.AnyOthIncNotInclInOthers);
    /* items 25/32 carry the OI-typed part PLUS the Schedule ICDS totals on export; on import
       strip the ICDS schedule contribution so it is not double-counted when recomputed. */
    {const IC=(I3&&I3.ScheduleICDS)||{},TN=IC.TotalNetAmtDetl||{};
     S.bp.i25=Math.max(0,N(A.IncProfDecLossAccICDSAdj)-N(TN.IncreaseInProfit));
     S.bp.i32=Math.max(0,N(A.DecProfIncLossAccICDSAdj)-N(TN.DecreaseInProfit));}
    S.bp.d27=N(A.DeductUs32_1_iii);S.bp.d29=N(A.AmtDisallUs40NowAllow);S.bp.d30=N(A.AmtDisallUs43BNowAllow);S.bp.d31=N(A.AnyOthAmtAllDeduct);
    const dp=A.DeemedProfitBusUs||{};
    S.bp.d35_44AD=N(dp.Section44AD);S.bp.d35_44ADA=N(dp.Section44ADA);S.bp.d35_44AE=N(dp.Section44AE);
    S.bp.d35_44B=N(dp.Section44B);S.bp.d35_44BB=N(dp.Section44BB);S.bp.d35_44BBA=N(dp.Section44BBA);
    S.bp.d35_44BBC=N(dp.Section44BBC);S.bp.d35_44BBD=N(dp.Section44BBD);S.bp.d35_44DA=N(dp.Section44DA);
    S.bp.r37a=N(A.ChrgblIncUndrRule7);S.bp.r37b=N(A.DeemedChrgblIncUndrRule7A);S.bp.r37c=N(A.DeemedChrgblIncUndrRule7B1);
    S.bp.r37d=N(A.DeemedChrgblIncUndrRule7B1A);S.bp.r37e=N(A.DeemedChrgblIncUndrRule8);
    const sb=bp.SpecBusinessInc||{};
    S.bp.s40=N(sb.AdditionUs28to44DA);S.bp.s41=N(sb.DeductUs28to44DA);
    const sc=bp.SpecifiedBusinessInc||{};
    S.bp.sp44=N(sc.AddSec28to44DA);S.bp.sp45=N(sc.DedSec28to44DAOTDedSec35AD);S.bp.sp47=N(sc.DeductionUs35AD);
    S.bp.clause=(sc.DedUs35ADSubSec5Dtls||[]).map(c=>c.DedUs35ADSubSec5||"");
    if(S.bp.clause.length<2)S.bp.clause=S.bp.clause.concat(["",""]).slice(0,2);
    got.push("Schedule BP");
  }
  const dpm=I3&&I3.ScheduleDPM;
  if(dpm&&dpm.PlantMachinery){
    const rd=(o)=>o&&o.DepreciationDetail||{};
    [["Rate15","r15"],["Rate30","r30"],["Rate40","r40"],["Rate45","r45"]].forEach(x=>{S.dpm[x[1]]=Object.assign({},rd(dpm.PlantMachinery[x[0]]));});
    got.push("Schedule DPM");
  }
  const doa=I3&&I3.ScheduleDOA;
  if(doa){
    const rd=(o)=>o&&o.DepreciationDetail||{};
    if(doa.Land)S.doa.land=Object.assign({},rd(doa.Land));
    if(doa.Building){S.doa.b5=Object.assign({},rd(doa.Building.Rate5));S.doa.b10=Object.assign({},rd(doa.Building.Rate10));S.doa.b40=Object.assign({},rd(doa.Building.Rate40));}
    if(doa.FurnitureFittings)S.doa.furn=Object.assign({},rd(doa.FurnitureFittings.Rate10));
    if(doa.IntangibleAssets)S.doa.intang=Object.assign({},rd(doa.IntangibleAssets.Rate25));
    if(doa.Ships)S.doa.ships=Object.assign({},rd(doa.Ships.Rate20));
    got.push("Schedule DOA");
  }
  const esr=I3&&I3.ScheduleESR&&I3.ScheduleESR.DeductionUs35;
  if(esr){
    ESR_ROWS.forEach(r=>{const o=(esr[r[2]]||{}).DeductUs35||{};S.esr[r[0]]={deb:N(o.AmtDebPL),allow:N(o.AmtUs35Allowable)};});
    got.push("Schedule ESR");
  }
  const ud=I3&&I3.ITR3ScheduleUD;
  if(ud){
    S.ud.curDep=N(ud.CurBalCFNY);S.ud.curAllow=N(ud.CurAllowBalCFNY);
    S.ud.rows=(ud.ScheduleUD||[]).map(r=>({AssYr:r.AssYr||"",AmtBFUD:N(r.AmtBFUD),AdjustAccTax115BACAmt:N(r.AdjustAccTax115BACAmt),
      AmtDeprSOCY:N(r.AmtDeprSOCY),AmtBFUAllow:N(r.AmtBFUAllow),AmtAllowSOCY:N(r.AmtAllowSOCY)}));
    got.push("Schedule UD");
  }
  const icds=I3&&I3.ScheduleICDS;
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
  const out=[]; const nw=isNew();
  const A=(S.C.bp&&S.C.bp.a)||{}, Cp=(S.C.bp&&S.C.bp.c)||{}, esr=S.C.esr||{rows:{}}, ud=S.C.ud||{rows:[]};
  const B=S.bp||{};
  /* regime closures */
  if(nw){
    const dpmAddl=["r15","r30","r40","r45"].some(k=>{const b=(S.dpm||{})[k]||{};return N(b.AddlnDeprOnGT180DayAdditions)||N(b.AddlnDeprOnLessThan180DayAdditions)||N(b.AddlnDeprOnAssetLessThan180Days);});
    if(dpmAddl)out.push({lvl:"warn",t:"Additional depreciation closed",m:"In the new regime additional depreciation is not allowed (A309); the entered figures are zeroed.",sec:"bp"});
    const r45=(S.dpm||{}).r45||{};
    if(N(r45.WDVFirstDay)||N(r45.AdditionsGrThan180Days))out.push({lvl:"warn",t:"45% block cannot claim depreciation",m:"In the new regime the 45% plant & machinery block cannot claim depreciation (A310); its depreciation is zeroed.",sec:"bp"});
    if(ESR_ROWS.some(r=>r[3]&&(esr.rows[r[0]]||{}).gatedZeroed))out.push({lvl:"warn",t:"ESR weighted deduction closed",m:"In the new regime the amount allowable (col 3) for 35(1)(ii)/(iia)/(iii)/35(2AA)/35CCC must be nil (A354); it has been zeroed.",sec:"bp"});
    if(N(B.sp47))out.push({lvl:"warn",t:"35AD deduction closed",m:"In the new regime the deduction under section 35AD cannot be claimed (A287); item 47 is zeroed.",sec:"bp"});
  }else{
    if((S.ud&&S.ud.rows||[]).some(r=>N(r.AdjustAccTax115BACAmt)))out.push({lvl:"warn",t:"115BAC adjustment in old regime",m:"Schedule UD col (3a) 115BAC adjustment should be nil when the new regime is not opted (rule 624).",sec:"bp"});
  }
  /* ESR -> Schedule RA */
  if(ESR_ROWS.some(r=>["ii","iii","iv","vi"].indexOf(r[0])>=0 && N(((S.esr||{})[r[0]]||{}).allow)))
    out.push({lvl:"warn",t:"Schedule RA required",m:"A deduction is claimed under 35(1)(ii)/(iia)/(iii) or 35(2AA) — Schedule RA details are mandatory.",sec:"bp"});
  /* 5c dividend cannot exceed 3d(i) */
  if(N(B.divExempt)>N(B.a3di))
    out.push({lvl:"err",t:"Exempt dividend too high",m:"The dividend amount at 5c cannot exceed the dividend income shown at 3d(i).",sec:"bp"});
  /* 5c nature special characters */
  if((B.othExempt||[]).some(r=>/[<>&]/.test(st0(r.name))))
    out.push({lvl:"err",t:"Invalid character in 5c nature",m:"The nature of exempt income at 5c cannot contain < > or &.",sec:"bp"});
  /* 35AD(5) clause not selected twice */
  const cl=(B.clause||[]).filter(c=>st0(c));
  if(cl.length===2 && cl[0]===cl[1])
    out.push({lvl:"err",t:"Duplicate 35AD(5) clause",m:"The same clause of sub-section (5) of section 35AD cannot be selected more than once.",sec:"bp"});
  /* UD: duplicate / out-of-range AY */
  const ays=(S.ud&&S.ud.rows||[]).map(r=>st0(r.AssYr)).filter(Boolean);
  if(new Set(ays).size<ays.length)out.push({lvl:"err",t:"Duplicate assessment year",m:"In Schedule UD the same assessment year cannot appear more than once.",sec:"bp"});
  if(ays.some(a=>!/^\d{4}-\d{2}$/.test(a)))out.push({lvl:"warn",t:"Check assessment year format",m:"Schedule UD assessment years must read like 2024-25.",sec:"bp"});
  if(ays.some(a=>/^\d{4}-\d{2}$/.test(a) && +a.slice(0,4)>2025))out.push({lvl:"err",t:"Assessment year too recent",m:"Schedule UD prior-year rows cannot exceed AY 2025-26.",sec:"bp"});
  /* UD current-year (5) vs BP 12iii */
  if(N(ud.curDep)>N(A._12iii)+0 && N(A._12iii)>0 && N(ud.curDep)>N(A._12iii))
    out.push({lvl:"warn",t:"UD current-year balance high",m:"Schedule UD current-year depreciation balance CF should not exceed BP item 12iii.",sec:"bp"});
  /* income summary */
  if(S.C.bp){
    const d=S.C.bp.income;
    if(d<0)out.push({lvl:"ok",t:"Business loss",m:RS(-d)+" goes to Schedule CYLA / CFL for set off.",sec:"bp"});
    else if(d>0)out.push({lvl:"ok",t:"Business income",m:RS(d)+" chargeable under Profits and gains from Business or profession.",sec:"bp"});
  }
  return out;
}

/* ---- register ---- */
reg({id:"bp", t:"Business — BP & depreciation", ref:"BP · DPM/DOA · DEP/DCG · ESR · UD · ICDS",
  f:secBp, s:()=>{const d=S.C.bp?S.C.bp.income:0;return d<0?"Loss "+CR(-d):(d?"Income "+CR(d):"");},
  eng:engBp, exp:expBp, imp:impBp, chk:chkBp, order:22});