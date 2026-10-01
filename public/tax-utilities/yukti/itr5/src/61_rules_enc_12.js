/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, encoding batch 12.
   Serials 533–577 (books/ITR-5/rules.json), covering:
     533–556  Schedule BFLA  (brought-forward loss adjustment)
     557–571  Schedule CFL   (carry-forward of losses)
     572–577  Schedule UD    (unabsorbed depreciation & 35(4) allowance)
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) FIRES when cond (the "lawful" assertion) is FALSE.
   Every read is guarded (RG / arr()); nothing throws; every block guards
   to a no-op when the schedule is absent. Schema keys come from
   forms/ITR-5/src/70_sec_loss.js exp() (ScheduleCYLA / ScheduleBFLA /
   ScheduleCFL / ITRScheduleUD), cross-checked with 70_sec_bp.js
   (CorpScheduleBP), 70_sec_cg.js (ScheduleCG Table-E) and 70_sec_os.js.
   The rules.json text in this range is stored as offset fragments; each
   rule was reconstructed by joining the tail of the next serial's text.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const arr=v=>Array.isArray(v)?v:[];

  /* new-regime gate: rules 567 (5b) / 572 (3a) name 115BAD / 115BAC(1A).
     The OptOldRegimeCurrAY flag only sees the 115BAC opt-out path and misses
     a co-op that opted 115BAD (via S.fs.newTaxRegime), which would false-fire
     on a lawful 115BAD co-op carrying a legitimate 5b/3a adjustment. Read the
     resolved regime object: is115BAD || is115BAC (S.C.regime). */
  const _rgm=((S_||{}).C||{}).regime||{};
  const isNewReg=!!(_rgm.is115BAD||_rgm.is115BAC);

  /* the thirteen BFLA / CYLA head blocks, in item order (the "Life
     insurance business u/s 115B" display row carries no schema leaf and is
     excluded). Each entry is [BFLA block key, CYLA block key] — the two
     differ only for the OS-normal head (OthSrcExclRaceHorse vs
     OthSrcExclRaceHorseLottery). */
  const HEADS=[
    ["HP","HP"],
    ["BusProfExclSpecProf","BusProfExclSpecProf"],
    ["SpeculationIncome","SpeculationIncome"],
    ["SpecifiedBusIncome","SpecifiedBusIncome"],
    ["STCG20Per","STCG20Per"],
    ["STCG30Per","STCG30Per"],
    ["STCGAppRate","STCGAppRate"],
    ["STCGDTAARate","STCGDTAARate"],
    ["LTCG12_5Per","LTCG12_5Per"],
    ["LTCGDTAARate","LTCGDTAARate"],
    ["OthSrcExclRaceHorse","OthSrcExclRaceHorseLottery"],
    ["ProfitFrmRaceHorse","ProfitFrmRaceHorse"],
    ["IncOSDTAA","IncOSDTAA"]];
  /* the six capital-gain head blocks (BFLA rows vi..xi). */
  const CGH=["STCG20Per","STCG30Per","STCGAppRate","STCGDTAARate","LTCG12_5Per","LTCGDTAARate"];
  /* the seven CFL LossSummaryDetail columns (4,5c,6,7,9,10,11). */
  const CFLCOLS=["TotalHPPTILossCF","BusLossOthThanSpecLossCF","LossFrmSpecBusCF",
    "LossFrmSpecifiedBusCF","TotalSTCGPTILossCF","TotalLTCGPTILossCF","OthSrcLossRaceHorseCF"];

  /* ===================================================================
     SCHEDULE BFLA  (533–558)
     Per head: col-1 IncOfCurYrUndHeadFromCYLA · col-2 BFlossPrevYrUndSame-
     HeadSetoff · col-3 BFUnabsorbedDeprSetoff · col-4 BFAllUs35Cl4Setoff ·
     col-5 IncOfCurYrAfterSetOffBFLosses. Totals block TotalBFLossSetOff
     (TotBFLossSetoff / TotUnabsorbedDeprSetoff / TotAllUs35cl4Setoff) and
     IncomeOfCurrYrAftCYLABFLA (item xvi).
     =================================================================== */
  if(I.ScheduleBFLA){
    const B=I.ScheduleBFLA;
    const bfF=(k,leaf)=>N(RG(B,k+".IncBFLA."+leaf,0));
    const totF=leaf=>N(RG(B,"TotalBFLossSetOff."+leaf,0));
    const sumBf=leaf=>HEADS.reduce((a,h)=>a+bfF(h[0],leaf),0);

    /* 533/534: the BFLA depreciation / 35(4) set-off totals equal the
       Schedule UD column totals (col 4 → depreciation, col 7 → allowance). */
    if(I.ITRScheduleUD){const U=I.ITRScheduleUD;
      A(533,REQ(totF("TotAllUs35cl4Setoff"),N(RG(U,"TotCurYrAllowSetoffInc",0))),"Schedule BFLA: item 4xv (brought-forward allowance u/s 35(4) set off) must equal the total of Col.7 of Schedule UD.");
      A(534,REQ(totF("TotUnabsorbedDeprSetoff"),N(RG(U,"TotCurYrdepritSetoffInc",0))),"Schedule BFLA: item 3xv (brought-forward depreciation set off) must equal the total of Col.4 of Schedule UD.");
    }

    /* 535/536/537/553/556: BFLA col-2 (brought-forward loss set off) must
       equal the corresponding "Adjustment of above losses in Schedule BFLA"
       figures (item xviii) of Schedule CFL. (The rules.json fragment for
       536 prints "xvii"; item xviii is meant — item xvii is the gross
       brought-forward loss, which exceeds the set off and would false-fire.
       BFLA col-2 and CFL xviii come from the same set-off computation.) */
    if(I.ScheduleCFL){
      const adj=leaf=>N(RG(I,"ScheduleCFL.AdjTotBFLossInBFLA.LossSummaryDetail."+leaf,0));
      A(535,REQ(bfF("HP","BFlossPrevYrUndSameHeadSetoff"),adj("TotalHPPTILossCF")),"Schedule BFLA: item 2(i) (house-property brought-forward loss set off) must equal item 4(xviii) 'Adjustment of above losses in Schedule BFLA' of Schedule CFL.");
      A(536,REQ(bfF("BusProfExclSpecProf","BFlossPrevYrUndSameHeadSetoff")+bfF("SpeculationIncome","BFlossPrevYrUndSameHeadSetoff")+bfF("SpecifiedBusIncome","BFlossPrevYrUndSameHeadSetoff"),adj("BusLossOthThanSpecLossCF")+adj("LossFrmSpecBusCF")+adj("LossFrmSpecifiedBusCF")),"Schedule BFLA: item 2(ii+iv+v) (business + speculative + specified brought-forward loss set off) must equal the adjustment (item xviii) of columns 5+6+7 of Schedule CFL.");
      A(537,REQ(bfF("ProfitFrmRaceHorse","BFlossPrevYrUndSameHeadSetoff"),adj("OthSrcLossRaceHorseCF")),"Schedule BFLA: item 2(xiii) (race-horse brought-forward loss set off) must equal item 11(xviii) of Schedule CFL.");
      A(553,REQ(CGH.reduce((a,k)=>a+bfF(k,"BFlossPrevYrUndSameHeadSetoff"),0),adj("TotalSTCGPTILossCF")+adj("TotalLTCGPTILossCF")),"Schedule BFLA: item 2(vi..xi) (brought-forward capital loss set off) must equal item 9(xviii)+10(xviii) of Schedule CFL.");
      const adjSum=CFLCOLS.reduce((a,c)=>a+adj(c),0);
      A(556,totF("TotBFLossSetoff")<=adjSum+1,"Schedule BFLA: item 2(xv) (total brought-forward loss set off) cannot exceed the sum of the 'Adjustment of above losses in Schedule BFLA' figures (item xviii) of Schedule CFL.");
    }

    /* 538/540/541: the BFLA col-2 / col-3 / col-4 totals (item xv) equal the
       sum of the per-head figures in that column. 539: the col-5 total
       (item xvi, current year's income remaining after set off) equals the
       sum of the per-head col-5 figures. (Summed over every head carrying
       the column; the rules.json enumeration of roman items is partial.) */
    A(538,REQ(totF("TotBFLossSetoff"),sumBf("BFlossPrevYrUndSameHeadSetoff")),"Schedule BFLA: item xv (total brought-forward loss set off, Col.2) must equal the sum of Col.2 over the heads.");
    A(539,REQ(N(RG(B,"IncomeOfCurrYrAftCYLABFLA",0)),sumBf("IncOfCurYrAfterSetOffBFLosses")),"Schedule BFLA: item xvi (Col.5, current year's income remaining after set off) must equal the sum of Col.5 over the heads.");
    A(540,REQ(totF("TotUnabsorbedDeprSetoff"),sumBf("BFUnabsorbedDeprSetoff")),"Schedule BFLA: item xv (total brought-forward depreciation set off, Col.3) must equal the sum of Col.3 over the heads.");
    A(541,REQ(totF("TotAllUs35cl4Setoff"),sumBf("BFAllUs35Cl4Setoff")),"Schedule BFLA: item xv (total brought-forward 35(4) allowance set off, Col.4) must equal the sum of Col.4 over the heads.");

    /* 542–552: BFLA col-1 (income of the current year under the head, from
       CYLA) must match CYLA col-5 (income after current-year set off) for
       the head. Only the heads named in rules.json are checked. */
    if(I.ScheduleCYLA){
      const MATCH=[
        [542,"HP","HP","house property (BFLA 1(i) = CYLA 5(ii))"],
        [543,"BusProfExclSpecProf","BusProfExclSpecProf","business excl. speculation & specified (BFLA 1(ii) = CYLA 5(iii))"],
        [544,"SpeculationIncome","SpeculationIncome","speculative income (BFLA 1(iv) = CYLA 5(v))"],
        [545,"SpecifiedBusIncome","SpecifiedBusIncome","specified business income (BFLA 1(v) = CYLA 5(vi))"],
        [546,"STCG30Per","STCG30Per","short-term capital gain @ 30% (BFLA 1(vii) = CYLA 5(viii))"],
        [547,"STCGAppRate","STCGAppRate","short-term capital gain at applicable rates (BFLA 1(viii) = CYLA 5(ix))"],
        [548,"STCGDTAARate","STCGDTAARate","short-term capital gain at special DTAA rate (BFLA 1(ix) = CYLA 5(x))"],
        [549,"LTCGDTAARate","LTCGDTAARate","long-term capital gain at special DTAA rate (BFLA 1(xi) = CYLA 5(xii))"],
        [550,"OthSrcExclRaceHorse","OthSrcExclRaceHorseLottery","net other-sources income at normal rates (BFLA 1(xii) = CYLA 5(xiii))"],
        [551,"ProfitFrmRaceHorse","ProfitFrmRaceHorse","race-horse profit (BFLA 1(xiii) = CYLA 5(xiv))"],
        [552,"IncOSDTAA","IncOSDTAA","other-sources income at special DTAA rate (BFLA 1(xiv) = CYLA 5(xv))"]];
      MATCH.forEach(function(m){
        A(m[0],REQ(bfF(m[1],"IncOfCurYrUndHeadFromCYLA"),N(RG(I,"ScheduleCYLA."+m[2]+".IncCYLA.IncOfCurYrAfterSetOff",0))),"Schedule BFLA: the income after CYLA set off for "+m[3]+" must match Schedule CYLA.");
      });
    }

    /* 555/557/558: per head, Col.2+Col.3+Col.4 cannot exceed Col.1; Col.5
       equals Col.1−Col.2−Col.3−Col.4; and Col.5 cannot exceed Col.1. */
    HEADS.forEach(function(h){const k=h[0];const L=" ["+k+"]: ";
      const c1=bfF(k,"IncOfCurYrUndHeadFromCYLA"),c2=bfF(k,"BFlossPrevYrUndSameHeadSetoff"),
            c3=bfF(k,"BFUnabsorbedDeprSetoff"),c4=bfF(k,"BFAllUs35Cl4Setoff"),c5=bfF(k,"IncOfCurYrAfterSetOffBFLosses");
      A(555,c2+c3+c4<=c1+1,"Schedule BFLA"+L+"the sum of Col.2 + Col.3 + Col.4 cannot exceed Col.1 (income of the current year under the head).");
      A(557,REQ(c5,c1-c2-c3-c4),"Schedule BFLA"+L+"Col.5 (current year's income remaining after set off) must equal Col.1 − Col.2 − Col.3 − Col.4.");
      A(558,c5<=c1+1,"Schedule BFLA"+L+"the amount at Col.5 cannot exceed the amount at Col.1.");
    });
  }

  /* ===================================================================
     SCHEDULE CFL  (560–571)   [items 557/558 belong to BFLA, handled above]
     Year rows carry CarryFwdLossDetail; the summary rows carry
     LossSummaryDetail (xvii TotalOfBFLossesEarlierYrs, xviii
     AdjTotBFLossInBFLA, xix CurrentAYloss, xx CurrentYearDistrUnitHolder,
     xxi CurrentYearLossCF, xxii TotalLossCFSummary).
     =================================================================== */
  if(I.ScheduleCFL){
    const C=I.ScheduleCFL;
    const row=r=>RG(C,r+".LossSummaryDetail",{})||{};
    const xvii=row("TotalOfBFLossesEarlierYrs"),xviii=row("AdjTotBFLossInBFLA"),
          xix=row("CurrentAYloss"),xx=row("CurrentYearDistrUnitHolder"),
          xxi=row("CurrentYearLossCF"),xxii=row("TotalLossCFSummary");
    const years=Object.keys(C).map(k=>RG(C,k+".CarryFwdLossDetail",null)).filter(d=>d&&typeof d==="object");

    /* 560/561: CFL current-year (xix) STCL / LTCL equal the total of the
       "capital losses remaining after set off" in Table E of Schedule CG. */
    if(I.ScheduleCG){const lrs=k=>N(RG(I,"ScheduleCG.CurrYrLosses.LossRemainSetOff."+k,0));
      A(560,REQ(N(xix.TotalSTCGPTILossCF),lrs("StclSetoff20Per")+lrs("StclSetoff30Per")+lrs("StclSetoffAppRate")+lrs("StclSetoffDTAARate")),"Schedule CFL: the current-year short-term capital loss (item xix) must equal the sum of the short-term capital losses remaining after set off in Table E of Schedule CG.");
      A(561,REQ(N(xix.TotalLTCGPTILossCF),lrs("LtclSetOff12_5Per")+lrs("LtclSetOffDTAARate")),"Schedule CFL: the current-year long-term capital loss (item xix) must equal the sum of the long-term capital losses remaining after set off in Table E of Schedule CG.");
    }
    /* 562/563: CFL current-year (xix) HP / business loss equal CYLA item
       xvii (loss remaining after current-year set off) in the same column. */
    if(I.ScheduleCYLA){
      A(562,REQ(N(xix.TotalHPPTILossCF),N(RG(I,"ScheduleCYLA.LossRemAftSetOff.BalHPlossCurYrAftSetoff",0))),"Schedule CFL: item 4(xix) (current-year house-property loss) must equal item 2(xvii) of Schedule CYLA.");
      A(563,REQ(N(xix.BusLossOthThanSpecLossCF),N(RG(I,"ScheduleCYLA.LossRemAftSetOff.BalBusLossAftSetoff",0))),"Schedule CFL: item 5(xix) (current-year business loss) must equal item 3(xvii) of Schedule CYLA.");
    }
    /* 564/565: CFL current-year (xix) speculative / specified business loss
       equal the loss (if any) at Schedule BP B42 / C48. */
    if(I.CorpScheduleBP){
      A(564,REQ(N(xix.LossFrmSpecBusCF),Math.max(0,-N(RG(I,"CorpScheduleBP.SpecBusinessInc.AdjustedPLFrmSpecuBus",0)))),"Schedule CFL: item 6(xix) (current-year speculative business loss) must equal the loss at 'Income/Loss from speculative business' (B42) of Schedule BP.");
      A(565,REQ(N(xix.LossFrmSpecifiedBusCF),Math.max(0,-N(RG(I,"CorpScheduleBP.IncSpecifiedBusiness.ProfitLossSpecifiedBusFinal",0)))),"Schedule CFL: item 7(xix) (current-year specified business loss) must equal the loss at 'Income/Loss from specified business' (C48) of Schedule BP.");
    }
    /* 566: CFL current-year (xix) race-horse loss equals the loss (if any)
       at item 8e of Schedule OS. */
    if(I.ScheduleOS){
      A(566,REQ(N(xix.OthSrcLossRaceHorseCF),Math.max(0,-N(RG(I,"ScheduleOS.IncFromOwnHorse.BalanceOwnRaceHorse",0)))),"Schedule CFL: item 11(xix) (current-year loss from owning & maintaining race horses) must equal the loss at item 8e of Schedule OS.");
    }
    /* 567: item 5b (amount adjusted on account of 115BAD / 115BAC(1A)) must
       be nil unless the new regime was opted. (The schema field
       AdjustAccTax115BADAmt is the amount adjusted ON ACCOUNT OF opting, so
       it is legitimately non-zero under the new regime; the rules.json
       wording drops the "not", per the section engine and chkLoss.) */
    A(567,isNewReg||years.every(d=>REQ(N(d.AdjustAccTax115BADAmt),0)),"Schedule CFL: item 5b (amount adjusted on account of section 115BAD / 115BAC(1A)) must be nil unless the assessee has opted for that regime.");
    /* 568: per year, item 5c must equal 5a − 5b. */
    years.forEach(function(d,i){
      A(568,REQ(N(d.BusLossOthThanSpecLossCF),N(d.BrtFwdBusLoss)-N(d.AdjustAccTax115BADAmt)),"Schedule CFL (year row "+(i+1)+"): item 5c must equal 5a − 5b.");
    });
    /* 569: item xxi (current-year loss carried forward) must equal
       xix − xx, restricted to nil when negative — checked per column. */
    CFLCOLS.forEach(function(c){
      A(569,REQ(N(xxi[c]),Math.max(0,N(xix[c])-N(xx[c]))),"Schedule CFL: item xxi ("+c+") must equal xix − xx, restricted to nil if negative.");
    });
    /* 570: item xvii (total brought-forward losses) must equal the sum of
       the individual assessment-year figures — checked per column. */
    CFLCOLS.forEach(function(c){
      A(570,REQ(N(xvii[c]),years.reduce((a,d)=>a+N(d[c]),0)),"Schedule CFL: item xvii ("+c+", total brought-forward loss) must equal the sum of the individual assessment-year figures.");
    });
    /* 571: item xxii (total loss carried forward) must equal xvii − xviii +
       xxi. The section applies the carry-window lapse, so xxii can only be
       lower than that sum, never higher — encoded as "cannot exceed" so it
       stays silent on a lawful lapse, catching over-statement only. */
    CFLCOLS.forEach(function(c){
      A(571,N(xxii[c])<=N(xvii[c])-N(xviii[c])+N(xxi[c])+1,"Schedule CFL: item xxii ("+c+", total loss carried forward) cannot exceed xvii − xviii + xxi.");
    });
  }

  /* ===================================================================
     SCHEDULE UD  (572–577)
     Top-level totals TotBFUDepritAmt(3) · TotAdjustAccTax115BADAmt(3a) ·
     TotCurYrdepritSetoffInc(4) · TotDepritBalCFNY(5) · TotBFUAllowAmt(6) ·
     TotCurYrAllowSetoffInc(7) · TotalBalCFNY(8); the current-AY balances
     CurBalCFNY(5) / CurAllowBalCFNY(8); array ScheduleUD[] of earlier-year
     rows (AmtBFUD · AdjustAccTax115BADAmt · AmtDeprSOCY · BalCFNY ·
     AmtBFUAllow · AmtAllowSOCY · AllowBalCFNY).
     =================================================================== */
  if(I.ITRScheduleUD){
    const U=I.ITRScheduleUD;
    const rows=arr(RG(U,"ScheduleUD",[]));

    /* 572: item 3a (amount adjusted on account of 115BAD / 115BAC(1A)) must
       be nil unless the new regime was opted (same inversion note as 567). */
    A(572,isNewReg||rows.every(r=>REQ(N((r||{}).AdjustAccTax115BADAmt),0)),"Schedule UD: item 3a (amount adjusted on account of section 115BAD / 115BAC(1A)) must be nil unless the assessee has opted for the new regime.");

    rows.forEach(function(r,i){r=r||{};const ay=String(r.AssYr||("row "+(i+1)));
      const c3=N(r.AmtBFUD),c3a=N(r.AdjustAccTax115BADAmt),c4=N(r.AmtDeprSOCY),
            c5=N(r.BalCFNY),c6=N(r.AmtBFUAllow),c7=N(r.AmtAllowSOCY),c8=N(r.AllowBalCFNY);
      /* 573: col-4 (depreciation set off) cannot exceed col-3 − col-3a. */
      A(573,c4<=Math.max(0,c3-c3a)+1,"Schedule UD ["+ay+"]: the depreciation set off (Col.4) cannot exceed Col.3 − Col.3a.");
      /* 574: col-5 (balance carried forward) equals col-3 − col-3a − col-4. */
      A(574,REQ(c5,Math.max(0,c3-c3a-c4)),"Schedule UD ["+ay+"]: the balance carried forward (Col.5) must equal Col.3 − Col.3a − Col.4.");
      /* 575: col-8 (allowance balance carried forward) equals col-6 − col-7. */
      A(575,REQ(c8,Math.max(0,c6-c7)),"Schedule UD ["+ay+"]: the allowance balance carried forward (Col.8) must equal Col.6 − Col.7.");
    });

    /* 576: the column totals (3 to 8) equal the sum over the rows. The
       col-5 and col-8 totals additionally include the current-AY balance
       (CurBalCFNY / CurAllowBalCFNY), which is not held in the row array. */
    const s=leaf=>rows.reduce((a,r)=>a+N((r||{})[leaf]),0);
    A(576,
      REQ(N(RG(U,"TotBFUDepritAmt",0)),s("AmtBFUD"))&&
      REQ(N(RG(U,"TotAdjustAccTax115BADAmt",0)),s("AdjustAccTax115BADAmt"))&&
      REQ(N(RG(U,"TotCurYrdepritSetoffInc",0)),s("AmtDeprSOCY"))&&
      REQ(N(RG(U,"TotDepritBalCFNY",0)),s("BalCFNY")+N(RG(U,"CurBalCFNY",0)))&&
      REQ(N(RG(U,"TotBFUAllowAmt",0)),s("AmtBFUAllow"))&&
      REQ(N(RG(U,"TotCurYrAllowSetoffInc",0)),s("AmtAllowSOCY"))&&
      REQ(N(RG(U,"TotalBalCFNY",0)),s("AllowBalCFNY")+N(RG(U,"CurAllowBalCFNY",0))),
      "Schedule UD: for columns 3 to 8, the total field must equal the sum of the individual rows (the Col.5 and Col.8 totals also include the current-year balance carried forward).");

    /* 577: the current-AY depreciation balance carried forward (Col.5)
       cannot exceed item 12iii of Schedule BP (total depreciation allowable
       u/s 32). (The rules.json fragment is truncated at "...12iii of".) */
    if(I.CorpScheduleBP){
      A(577,N(RG(U,"CurBalCFNY",0))<=N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.DepreciationAllowITAct32.TotDeprAllowITAct",0))+1,"Schedule UD: the current-assessment-year depreciation balance carried forward (Col.5) cannot exceed item 12iii (total depreciation allowable u/s 32) of Schedule BP.");
    }
  }

  /* ---- NOT MAPPABLE (reported, not encoded) ------------------------
     554 — "In Schedule BFLA, brought-forward business loss (Sl.No. 2(ii))
           and brought-forward depreciation (Sl.No. 3(ii)) cannot be set off
           against 44BB or 44BBD income." The ITR-5 schema carries no flag
           marking a head's income as 44BB / 44BBD income (the BusProfExcl-
           SpecProf block holds a single net figure), so whether the set-off
           lands on 44BB/44BBD income is not offline-checkable. Needs the
           presumptive-scheme break-up, not present in the return object.
     559 — "Part B-TI Sl.No. 17 'Losses of current year to be carried
           forward' should flow from Total of xix of Schedule CFL (or, for an
           Investment Fund, from 5c+6+7 of xxi)." Cross-schedule to Part
           B-TI, which is not this batch's schedule, and the section export
           populates PartB-TI.LossesOfCurrentYearCarriedFwd from the TOTAL
           carried forward (item xxii), not from item xix; a literal check
           would false-fire whenever brought-forward losses exist. The
           Investment-Fund branch further needs the sub-status enum. Left to
           the Part B-TI owning section's own audit.
     ------------------------------------------------------------------ */
});
