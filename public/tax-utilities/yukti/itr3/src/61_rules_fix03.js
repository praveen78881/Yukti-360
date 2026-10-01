/* ITR-3 · AY 2026-27 — validation-rule FIX batch 03 (enforcement gaps/weak fixes).
   Registered via ruleset(); A(n,cond,msg) fires when cond is FALSE. Reads guarded; nothing throws.
   Serials: 271 281 284 285 286 289 290 292 294 295 297 301 303 351 355 356 360 361 363 364.
   WEAK companions (297, 301, 355, 356) carry the corrected/stricter assertion; the older
   versions in 60_rules.js / 61_rules_g0.js stay untouched. */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const O=function(x){return (x&&typeof x==="object"&&!Array.isArray(x))?x:{};};
  const L=function(x){return Array.isArray(x)?x:[];};
  const hasBP=!!I.ITR3ScheduleBP;
  const P=O(RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec",{}));
  const pl=O(I.PARTA_PL);
  const nob=L(RG(I,"PartA_GEN2.NatOfBus.NatureOfBusiness",[]));

  /* =============================================================
     SCHEDULE BP — cross-links to Manufacturing / Trading / P&L / ESR / EI / IF
     ============================================================= */
  if(hasBP){
    const ir=O(P.IncRecCredPLOthHeadDtls);
    const pf=O(P.ProfitFrmActCvrd);
    const sum3=N(ir.Salary)+N(ir.HouseProperty)+N(ir.CapitalGains)+N(ir.OtherSources)+N(ir.Us115BBF)+N(ir.Us115BBG)+N(ir["115BBH"]);
    const _5d=N(RG(P,"IncCredPL.TotExempIncPL"));
    const div3di=N(ir.Dividend);
    const div5c=N(RG(P,"IncCredPL.OtherExmptIncDtl.OperatingDividendAmt"));
    const s44AD=N(RG(P,"DeemedProfitBusUs.Section44AD"));

    /* 271 — item 11 = Manufacturing 1Evi (depreciation of factory machinery) + P&L item 52 */
    /* FIXED: test client's P&L DepreciationAmort reconciled to BP item 11 (both 80,000). */
    A(271,REQ(P.DepreciationDebPLCosAct,
      N(RG(I,"ManufacturingAccount.OpeningInventory.DeprctnOfFactoryMachinery"))+N(RG(pl,"DebitsToPL.DepreciationAmort"))),
      "Schedule BP: item 11 (depreciation and amortization debited to P&L) must equal 1Evi of the Manufacturing Account plus item 52 of Part A-P&L.");

    /* 281 — income reduced at 3 and 5 cannot exceed what was credited to the P&L */
    const credPL=N(RG(pl,"CreditsToPL.TotCreditsToPL"))+N(RG(pl,"NoBooksOfAccPL.GrossReceipt"))+N(RG(pl,"NoBooksOfAccPL.GrossReceiptPrf"))
      +N(RG(pl,"GrossProfit"))+N(RG(pl,"NonResidentPL.GrossReceipt"));
    A(281,!(sum3+_5d>0)||sum3+_5d<=credPL+1,
      "Schedule BP: the income/receipts reduced at items 3 and 5 cannot exceed the income/receipts credited to the P&L account.");

    /* 284 — 35(i) cannot exceed Trading 4D + P&L gross receipts 61(i)+62(i)+64(i)+64(ii) */
    const grossRc=N(RG(I,"TradingAccount.TotRevenueFrmOperations"))+N(RG(pl,"PersumptiveInc44AD.GrsTrnOverOrReceipt"))
      +N(RG(pl,"PersumptiveInc44ADA.GrsReceipt"))+N(RG(pl,"NoBooksOfAccPL.GrossReceipt"))+N(RG(pl,"NoBooksOfAccPL.GrossReceiptPrf"));
    A(284,!(s44AD>0)||s44AD<=grossRc+1,
      "Schedule BP: 35(i) (section 44AD) cannot exceed 4D of the Trading Account plus the gross receipts at 61(i), 62(i), 64(i) and 64(ii) of Part A-P&L.");

    /* 285 — 44AD barred for general commission agents (09005) and 44AA(1) professions
       (the department's own 44ADA code list, BPA_CODEADA, is the 44AA(1) profession list) */
    const adaCodes=(typeof BPA_CODEADA!=="undefined"&&Array.isArray(BPA_CODEADA))?BPA_CODEADA.map(function(x){return String(L(x)[0]||"");}):[];
    const bar44AD=["09005"].concat(adaCodes);
    const allCodes=nob.map(function(b){return O(b).Code;})
      .concat(L(pl.NatOfBus44AD).map(function(b){return O(b).CodeAD;}),L(pl.NatOfBus44ADA).map(function(b){return O(b).CodeADA;}));
    const barred=allCodes.filter(function(c){return c!=null&&c!==""&&bar44AD.indexOf(String(c))>=0;});
    A(285,!(s44AD>0||N(RG(pl,"PersumptiveInc44AD.TotPersumptiveInc44AD"))>0)||barred.length===0,
      "Schedule BP: section 44AD (35(i)) is not available to a general commission agent (code 09005) or a person carrying on a profession referred to in section 44AA(1)"+(barred.length?" (code "+barred.join(", ")+")":"")+".");

    /* 286 — 24(e) >= |total of negative (col 3 − col 2)| across Schedule ESR (typed i24e must not undercut it) */
    let esrShort=0;const esrD=O(RG(I,"ScheduleESR.DeductionUs35",{}));
    Object.keys(esrD).forEach(function(k){if(k==="TotUs35")return;const r=O(O(esrD[k]).DeductUs35);const d=N(r.AmtUs35Allowable)-N(r.AmtDebPL);if(d<0)esrShort+=-d;});
    A(286,!I.ScheduleESR||N(P.AnyOthIncNotInclInOthers)>=esrShort-1,
      "Schedule BP: 24(e) must be at least the absolute total of the negative (col 3 − col 2) amounts of Schedule ESR.");

    /* 289 — 3d(i) + 5c dividend (offered in Schedule OS) cannot exceed P&L 14(iii) */
    A(289,!(div3di+div5c>0)||div3di+div5c<=N(RG(pl,"CreditsToPL.OthIncome.Dividends"))+1,
      "Schedule BP: dividend reduced at 3d(i) plus 5c (and offered in Schedule OS) cannot exceed the dividend income at 14(iii) of Part A-P&L.");

    /* 290 — 35(iv)..35(vii) (44B/44BB/44BBA/44BBC/44BBD/44DA) = 4a(iv)..4a(vii) */
    const NRS=["44B","44BB","44BBA","44BBC","44BBD","44DA"];
    const s35nr=NRS.reduce(function(a,k){return a+N(RG(P,"DeemedProfitBusUs.Section"+k));},0);
    const s4anr=NRS.reduce(function(a,k){return a+N(RG(P,"ProfitLossInclRefrdSec.ProfitLossUs"+k));},0);
    A(290,REQ(s35nr,s4anr),
      "Schedule BP: the sum of 35(iv) to 35(vii) (sections 44B/44BB/44BBA/44BBC/44BBD/44DA) must equal the sum of 4a(iv) to 4a(vii).");

    /* 292 — exempt income reduced at 5d must tally with Schedule EI and the share column of Schedule IF */
    A(292,!(_5d>0)||_5d<=N(RG(I,"ScheduleEI.TotalExemptInc"))+N(RG(I,"ScheduleIF.TotalProfitShareAmt"))+1,
      "Schedule BP: the exempt income reduced at 5d must tally with the income offered in Schedule EI and the share of profit in Schedule IF.");

    /* 294 / 295 / 297 — Rule 7 / 7A / 7B(1A) floors against 4b(i) / 4b(ii) / 4b(iv) */
    A(294,REQ(P.ChrgblIncUndrRule7,pf.ProfitFrmActCvrdUndrRule7),
      "Schedule BP: 37a (income chargeable under Rule 7) must equal 4b(i) (profit from activities covered under Rule 7).");
    A(295,N(P.DeemedChrgblIncUndrRule7A)>=Math.round(0.35*N(pf.ProfitFrmActCvrdUndrRule7A))-1,
      "Schedule BP: 37b (deemed income chargeable under Rule 7A) must be at least 35% of 4b(ii).");
    A(297,N(P.DeemedChrgblIncUndrRule7B1A)>=Math.round(0.40*N(pf.ProfitFrmActCvrdUndrRule7B1A))-1,
      "Schedule BP: 37d (deemed income chargeable under Rule 7B(1A)) must be at least 40% of 4b(iv) (profit from activities covered under Rule 7B(1A)).");

    /* 301 — 5c dividend income cannot be more than zero (dividend is no longer exempt) */
    A(301,!(div5c>0),"Schedule BP: 5c (dividend income) cannot be more than zero.");
  }

  /* =============================================================
     303 — ITR-3 needs business/profession income, with five exceptions
     ============================================================= */
  const bizInc=(hasBP&&(N(RG(I,"ITR3ScheduleBP.IncChrgUnHdProftGain"))!==0||N(P.NetPLBusOthThanSpec7A7B7C)!==0
      ||N(RG(I,"ITR3ScheduleBP.SpecBusinessInc.AdjustedPLFrmSpecuBus"))!==0||N(RG(I,"ITR3ScheduleBP.SpecifiedBusinessInc.PLFrmSpecifiedBus"))!==0
      ||N(P.ProfBfrTaxPL)!==0))
    ||N(RG(I,"PartB-TI.ProfBusGain.TotProfBusGain"))!==0
    ||N(RG(pl,"CreditsToPL.TotCreditsToPL"))>0||N(RG(pl,"PersumptiveInc44AD.GrsTrnOverOrReceipt"))>0||N(RG(pl,"PersumptiveInc44ADA.GrsReceipt"))>0
    ||N(RG(pl,"TotalPrsumptvIncUs44E"))>0||N(RG(pl,"NoBooksOfAccPL.GrossReceipt"))>0||N(RG(pl,"NoBooksOfAccPL.GrossReceiptPrf"))>0
    ||N(RG(pl,"GrossProfit"))>0||N(RG(pl,"NonResidentPL.GrossReceipt"))>0||N(RG(I,"TradingAccount.TotRevenueFrmOperations"))>0;
  const ex1=nob.some(function(b){return String(O(b).Code)==="00001";})&&!!I.ScheduleIF&&L(RG(I,"ScheduleIF.PartnerFirmDetails",[])).length>0;
  const ex2=RG(I,"PartA_GEN2.AuditInfo.LiableSec92Eflg","")==="Y";
  const ex3=RG(I,"Schedule5A2014.BooksSpouse92EFlg","")==="Y";
  const cflBF=O(RG(I,"ScheduleCFL.TotalOfBFLossesEarlierYrs.LossSummaryDetail",{}));
  const ex4=N(cflBF.BusLossOthThanSpecLossCF)>0||N(cflBF.LossFrmSpecBusCF)>0||N(cflBF.LossFrmSpecifiedBusCF)>0;
  const ex5=L(RG(I,"ITR3ScheduleUD.ScheduleUD",[])).some(function(r){return N(O(r).AmtBFUD)>0||N(O(r).AmtBFUAllow)>0;});
  A(303,!I.PartA_GEN1||bizInc||ex1||ex2||ex3||ex4||ex5,   /* asserted only on a built return (Part A-General present) */
    "ITR-3 can be filed only with income under the head business or profession (Schedule BP) — unless the only business code is 00001 with Schedule IF filled, audit u/s 92E applies (Part A-General, or the spouse in Schedule 5A), a brought-forward business loss exists in Schedule CFL (5c/6/7 xvii) or brought-forward depreciation/allowance exists in Schedule UD (column 3/6).");

  /* =============================================================
     SCHEDULE CG — DCG link, complete STCG/LTCG breakups, nil-FVC-vs-expenses
     ============================================================= */
  if(I.ScheduleCGFor23){const cg=O(I.ScheduleCGFor23),ST=O(cg.ShortTermCapGainFor23),LT=O(cg.LongTermCapGain23);
    const stLand=L(RG(ST,"SaleofLandBuild.SaleofLandBuildDtls",[])),ltLand=L(RG(LT,"SaleofLandBuild.SaleofLandBuildDtls",[]));
    const a5=O(ST.NRISecur115AD),a6=O(ST.SaleOnOtherAssets);
    const p112=L(LT.Proviso112Applicable),b6=L(RG(LT,"NRIOnSec112and115.NRIOnSec112and115Dtls",[]));
    /* full value of consideration of a section-48 aggregate head (aiii or a): FullConsideration, else 50CA + other */
    const fvc=function(o){o=O(o);const f=N(o.FullConsideration);return f||(N(o.FullValueConsdSec50CA)+N(o.FullValueConsdOthUnqshr));};

    /* 351 — A6e (deemed STCG on depreciable assets) = item 6 of Schedule DCG */
    A(351,!I.ScheduleDCG||REQ(a6.DeemedStcgOnAssets,RG(I,"ScheduleDCG.SummaryFromDeprSchCG.TotalDepreciation")),
      "Schedule CG: A6e (STCG on depreciable assets) must equal item 6 of Schedule DCG.");

    /* 355 — A10 total STCG = complete breakup (A1 + A2 slump + A3 + A4 NR + A5 FII + A6 + A7 + A8 − A9 + A(A)) */
    const stSum=RSUM(stLand,"CapgainonAssets")
      +N(RG(ST,"SlumpSaleInStcg.CapgainonAssets"))
      +RSUM(L(ST.EquityMFonSTT),function(x){return RG(x,"EquityMFonSTTDtls.CapgainonAssets");})
      +N(RG(ST,"NRITransacSec48Dtl.NRItaxSTTPaid"))+N(RG(ST,"NRITransacSec48Dtl.NRItaxSTTNotPaid"))
      +N(a5.CapgainonAssets)
      +N(a6.CapgainonAssets)
      +N(ST.TotalAmtDeemedStcg)+N(ST.PassThrIncNatureSTCG)-N(ST.TotalAmtNotTaxUsDTAAStcg)
      +N(RG(ST,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"));
    A(355,REQ(ST.TotalSTCG,stSum),
      "Schedule CG: A10 (total STCG) must equal the individual short-term heads A1 + A2 + A3 + A4 + A5 + A6 + A7 + A8 − A9 + A(A).");

    /* 356 — B13 total LTCG = complete breakup (B1 + B2 slump + B3 proviso-112 + B4 + B5..B8 NR + B9 + B10 + B11 − B12 + B(A)) */
    const ltSum=RSUM(ltLand,"CapgainonAssets")
      +N(RG(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg.CapgainonAssets"))
      +RSUM(p112,"CapgainonAssets")
      +N(RG(LT,"SaleOfEquityShareUs112A.CapgainonAssets"))
      +N(RG(LT,"NRIProvisoSec48.BalanceCG"))
      +RSUM(b6,"CapgainonAssets")
      +N(RG(LT,"NRISaleOfEquityShareUs112A.CapgainonAssets"))
      +N(RG(LT,"NRISaleofForeignAsset.BalonSpeciAsset"))
      +N(RG(LT,"SaleofAssetNADtls.SaleofAssetNA.CapgainonAssets"))
      +N(LT.TotalAmtDeemedLtcg)+N(LT.PassThrIncNatureLTCG)-N(LT.TotalAmtNotTaxUsDTAALtcg)
      +N(RG(LT,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"));
    A(356,REQ(LT.TotalLTCG,ltSum),
      "Schedule CG: B13 (total LTCG) must equal the individual long-term heads B1 + B2 + B3 + B4 + B5 + B6 + B7 + B8 + B9 + B10 + B11 − B12 + B(A).");

    /* 360 / 361 / 363 / 364 — with a nil full value of consideration no deduction/expense (b(iv)) can be claimed */
    A(360,fvc(a5)>0||!N(RG(a5,"DeductSec48.TotalDedn")),
      "Schedule CG A5: when the full value of consideration (A5aiii) is nil, no expenses/deductions (A5b(iv)) can be claimed.");
    A(361,fvc(a6)>0||!N(RG(a6,"DeductSec48.TotalDedn")),
      "Schedule CG A6: when the full value of consideration (A6aiii) is nil, no expenses/deductions (A6b(iv)) can be claimed.");
    p112.forEach(function(r,i){r=O(r);
      A(363,fvc(r)>0||!N(RG(r,"DeductSec48.TotalDedn")),
        "Schedule CG B3 row "+(i+1)+": when the full value of consideration (B3ia) is nil, no expenses/deductions (B3ib(iv)) can be claimed.");});
    b6.forEach(function(r,i){r=O(r);
      A(364,fvc(r)>0||!N(RG(r,"DeductSec48.TotalDedn")),
        "Schedule CG B6 row "+(i+1)+": when the full value of consideration (B6a) is nil, no expenses/deductions (B6b(iv)) can be claimed.");});
  }
});
