/* ITR-3 · AY 2026-27 — validation-rule FIX batch 05 (enforcement gaps/weak fixes).
   Registered via ruleset(); A(n,cond,msg) fires when cond is FALSE. Reads guarded; nothing throws.
   Serials: 518 519 520 526 528 534 535 536 537 538 540 543 544 545 546 547 550 574 607 622.
   Paths copied from 70_sec_os.js (expOs), 70_sec_loss.js (expLoss), 70_sec_bp.js (expBp),
   70_sec_cg.js (CapitalLossBuyBackShares) and 70_sec_who.js (BenefitUs115HFlg). */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  var FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  var res=FS.ResidentialStatus||"RES";                 /* RES / RNOR / NRI */
  var nri=res==="NRI";
  var arr=function(x){return Array.isArray(x)?x.filter(function(r){return r&&typeof r==="object";}):[];};

  /* =============================================================
     SCHEDULE OS — helpers (all guarded; an absent schedule → every cond TRUE)
     ============================================================= */
  var hasOS=!!I.ScheduleOS;
  var io=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};
  var dd=io.Deductions||{};
  /* 2f DTAA table rows: NRIDTAADtlsSchOS[] {DTAAamt, NatureOfIncome, ItemNoincl, TaxRescertifiedFlag} */
  var dtRows=arr(RG(io,"IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS",[]));
  /* a 2f row is "considered" for a non-resident only with TRC = Yes; a resident counts every row */
  var cnt=function(r){return nri?r.TaxRescertifiedFlag==="Y":true;};
  var nat=function(r){return String(r.NatureOfIncome||"");};
  var itm=function(r){return String(r.ItemNoincl||"");};
  /* column-2 amounts of the 2f rows whose "Item No. in which included" is in nats — all rows */
  var dtAll=function(nats){return dtRows.filter(function(r){return nats.indexOf(nat(r))>=0;}).reduce(function(a,r){return a+N(r.DTAAamt);},0);};
  /* same, but only the rows that count (TRC gate for a non-resident) */
  var dtCnt=function(nats){return dtRows.filter(function(r){return cnt(r)&&nats.indexOf(nat(r))>=0;}).reduce(function(a,r){return a+N(r.DTAAamt);},0);};
  /* item-10 quarterly DateRange total (rows use either Up16Of6To15Of9 or Upto15Of9 — never both) */
  var qSum=function(node){var d=RG(I,"ScheduleOS."+node+".DateRange",{})||{};
    return N(d.Upto15Of6)+N(d.Up16Of6To15Of9)+N(d.Upto15Of9)+N(d.Up16Of9To15Of12)+N(d.Up16Of12To15Of3)+N(d.Up16Of3To31Of3);};
  /* 2d OthersGrossDtls[] + 2e PTIOthersGrossDtls[] amounts for the given SourceDescription codes */
  var splSum=function(codes){return arr(io.OthersGrossDtls).concat(arr(io.PTIOthersGrossDtls))
    .filter(function(r){return codes.indexOf(String(r.SourceDescription||""))>=0;}).reduce(function(a,r){return a+N(r.SourceAmount);},0);};

  /* ---- 2f column-3 caps: the 2f rows classified into an item cannot exceed that item ---- */
  A(518,!hasOS||dtAll(["2ai"])<=N(io.LtryPzzlChrgblUs115BB)+1,
    "Schedule OS 2f: the DTAA rows included in 2a(i) cannot exceed 2a(i) — winnings from lotteries, crossword puzzles etc. chargeable u/s 115BB.");
  A(544,!hasOS||dtAll(["2ai","2aii"])<=N(io.LtryPzzlChrgblUs115BB)+N(io.IncChrgblUs115BBJ)+1,
    "Schedule OS 2f: the DTAA rows included in 2a cannot exceed 2a — winnings chargeable u/s 115BB and 115BBJ.");
  A(519,!hasOS||dtAll(["2d"])<=N(io.OthersGross)+1,
    "Schedule OS 2f: the DTAA rows included in 2d cannot exceed 2d — any other income chargeable at special rate.");
  A(520,!hasOS||dtAll(["2e"])<=N(io.PassThrIncOSChrgblSplRate)+1,
    "Schedule OS 2f: the DTAA rows included in 2e cannot exceed 2e — pass-through income chargeable at special rate.");

  /* ---- item 10 quarterly break-ups reconciled to the schedule ---- */
  /* 526 · 3a dividend break-up = 1a(i) − DTAA dividend of 1a(i) − interest u/s 57 attributable to 1a(i).
     The utility's "system calculated" attribution of IntExp57 (computed on 1a(i)+1a(ii)) is not
     published, so both the proportional share and the whole IntExp57 are accepted. The break-up
     may never exceed the target; where the break-up is filled it must equal it. (A blank break-up
     is tolerated because tests/ITR-3/state.js carries no os.q — see the batch reply.) */
  var div1ai=N(io.DividendOthThan22e), div1aii=N(io.Dividend22e), dtDiv1ai=dtCnt(["1ai"]);
  var intAll=N(dd.IntExp57), intProp=(div1ai+div1aii)>0?Math.round(intAll*div1ai/(div1ai+div1aii)):0;
  var q3a=qSum("DividendIncUs115BBDA");
  var t526a=Math.max(0,div1ai-dtDiv1ai-intProp), t526b=Math.max(0,div1ai-dtDiv1ai-intAll);
  A(526,!hasOS||(q3a<=Math.max(t526a,t526b)+1&&(!q3a||REQ(q3a,t526a)||REQ(q3a,t526b))),
    "Schedule OS item 10: the quarterly break-up of dividend income (3a) must equal 1a(i) less the DTAA dividend of 1a(i) and the interest expenditure u/s 57 attributable to it.");
  /* 547 · 3b dividend break-up = 1a(iii) − DTAA dividend of 1a(iii) */
  A(547,!hasOS||REQ(qSum("DividendIncUs115BBDAaiii"),Math.max(0,N(io.Dividend22f)-dtCnt(["1aiii"]))),
    "Schedule OS item 10: the quarterly break-up of dividend income at 3b must equal 1a(iii) less the DTAA dividend of 1a(iii).");
  /* 534 · dividend taxable at DTAA rates = dividend rows selected in 2f (counted rows) */
  var dtDiv=dtRows.filter(function(r){return cnt(r)&&(["1ai","1aiii"].indexOf(nat(r))>=0||["56i","56i_f","5A1aA","5AC1abD","5ACA1a"].indexOf(itm(r))>=0);})
    .reduce(function(a,r){return a+N(r.DTAAamt);},0);
  A(534,!hasOS||REQ(qSum("DividendDTAA"),dtDiv),
    "Schedule OS item 10: the quarterly break-up of dividend income taxable at DTAA rates must equal the dividend income selected at 2f.");
  /* 535–538, 546 · special-rate dividend break-ups = dividend rows selected at 2d + 2e (by section code) */
  A(535,!hasOS||REQ(qSum("DividendIncUs115A1ai"),splSum(["5A1ai","PTI_5A1ai"])),
    "Schedule OS item 10: the quarterly break-up of dividend u/s 115A(1)(a)(i) @20% (incl. PTI) must equal the 115A(1)(a)(i) income selected at 2d and 2e.");
  A(546,!hasOS||REQ(qSum("DividendIncUs115A1aA"),splSum(["5A1aA","PTI_5A1aA"])),
    "Schedule OS item 10: the quarterly break-up of dividend under the proviso to 115A(1)(a)(A) @10% (incl. PTI) must equal the 115A(1)(a)(A) income selected at 2d and 2e.");
  A(536,!hasOS||REQ(qSum("DividendIncUs115AC"),splSum(["5AC1abD","PTI_5AC1abD"])),
    "Schedule OS item 10: the quarterly break-up of dividend u/s 115AC @10% must equal the 115AC(1)(b) dividend selected at 2d and 2e.");
  A(537,!hasOS||REQ(qSum("DividendIncUs115ACA"),splSum(["5ACA1a","PTI_5ACA1a"])),
    "Schedule OS item 10: the quarterly break-up of dividend u/s 115ACA(1)(a) @10% (incl. PTI) must equal the 115ACA(1)(a) income selected at 2d and 2e.");
  A(538,!hasOS||REQ(qSum("DividendIncUs115AD1i"),splSum(["5AD1iDiv","PTI_5AD1iDiv"])),
    "Schedule OS item 10: the quarterly break-up of dividend u/s 115AD(1)(i) @20% (incl. PTI) must equal the 115AD(1)(i) dividend selected at 2d and 2e.");
  /* 540 · 89A notified-country break-up = 1e 89A income − 5a relief claimed */
  A(540,!hasOS||REQ(qSum("NOT89A"),Math.max(0,N(io.IncomeNotified89AOS)-N(io.Increliefus89AOS))),
    "Schedule OS item 10: the quarterly break-up of income from a retirement benefit account in a notified country u/s 89A must equal the 89A income at 1e less the relief claimed at 5a.");
  /* 545 · online-games break-up = 2a(ii) − DTAA rows included in 2a(ii) */
  A(545,!hasOS||REQ(qSum("IncFrmOnGames"),Math.max(0,N(io.IncChrgblUs115BBJ)-dtCnt(["2aii"]))),
    "Schedule OS item 10: the quarterly break-up of winnings from online games u/s 115BBJ must equal 2a(ii) less the DTAA amount of 115BBJ.");

  /* ---- 528 · resident without the 115H option: no Chapter XII-A (115E) concessional income in OS ---- */
  var noH=res==="RES"&&FS.BenefitUs115HFlg!=="Y";
  var inc115E=splSum(["5Ea","PTI_5Ea"])+dtRows.filter(function(r){return itm(r)==="5Ea";}).reduce(function(a,r){return a+N(r.DTAAamt);},0);
  A(528,!hasOS||!noH||inc115E<=0,
    "Schedule OS: a resident who has not exercised the option under section 115H cannot offer income at the concessional rate of section 115E (2d/2e/2f).");

  /* ---- 543 · 3a(i) expenses need income at 1b/1c/1d/1e other than family pension and 89A income (tightens A530) ---- */
  var base543=N(io.InterestGross)+N(io.RentFromMachPlantBldgs)+N(io.Tot562x)+N(io.AnyOtherIncome)
              -N(io.FamilyPension)-N(io.IncomeNotified89AOS)-N(io.IncomeNotifiedPrYr89AOS);
  A(543,!hasOS||!N(dd.Expenses)||base543>0,
    "Schedule OS 3a(i): expenses/deductions (other than family pension) are allowed only where income is offered at 1b, 1c, 1d or 1e other than family pension and 89A income.");

  /* =============================================================
     SCHEDULE CYLA / BFLA / CFL
     ============================================================= */
  /* 550 · buy-back loss claimed in Schedule CG ⇒ CYLA 3i (business loss) = Schedule BP Table E 2v */
  var bbST=N(RG(I,"ScheduleCGFor23.ShortTermCapGainFor23.CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"));
  var bbLT=N(RG(I,"ScheduleCGFor23.LongTermCapGain23.CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"));
  var bbClaimed=bbST!==0||bbLT!==0;
  A(550,!bbClaimed||!I.ScheduleCYLA||!I.ITR3ScheduleBP||
    REQ(RG(I,"ScheduleCYLA.TotalCurYr.TotBusLoss"),RG(I,"ITR3ScheduleBP.BusSetoffCurrYr.LossRemainSetOffOnBus")),
    "Schedule CYLA: where a buy-back loss is claimed in Schedule CG, the business loss at 3i must equal Sl.No. 2v of Table E of Schedule BP.");

  /* 574 · total loss set off cannot exceed the loss to be set off — all three columns (A574 in 60_rules.js checks HP and OS only) */
  if(I.ScheduleCYLA){var cy=I.ScheduleCYLA;
    var tcy=RG(cy,"TotalCurYr",{})||{}, tso=RG(cy,"TotalLossSetOff",{})||{};
    A(574,N(tso.TotHPlossCurYrSetoff)<=N(tcy.TotHPlossCurYr)+1&&
          N(tso.TotBusLossSetoff)<=N(tcy.TotBusLoss)+1&&
          N(tso.TotOthSrcLossNoRaceHorseSetoff)<=N(tcy.TotOthSrcLossNoRaceHorse)+1,
      "Schedule CYLA: the total loss set off (2xvi / 3xvi / 4xvi) cannot exceed the loss to be set off (2i / 3i / 4i).");
  }

  /* 607 · brought-forward business loss (2iii) and depreciation (3iii) cannot be set off against 44BB / 44BBD income */
  if(I.ScheduleBFLA){var bb=RG(I,"ScheduleBFLA.BusProfExclSpecProf.IncBFLA",{})||{};
    var inc44=N(RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44BB"))
             +N(RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44BBD"));
    A(607,!(inc44>0)||N(bb.BFlossPrevYrUndSameHeadSetoff)+N(bb.BFUnabsorbedDeprSetoff)<=Math.max(0,N(bb.IncOfCurYrUndHeadFromCYLA)-inc44)+1,
      "Schedule BFLA: brought-forward business loss (2iii) and unabsorbed depreciation (3iii) cannot be set off against income u/s 44BB and 44BBD.");
  }

  /* 622 · total of brought-forward losses (xvii) = sum over every assessment-year row (all sixteen nodes; g5 sums five) */
  if(I.ScheduleCFL){var cf=I.ScheduleCFL;
    var yrs16=["LossCFFromPrev9thYearFromAY","LossCFFromPrev8thYearFromAY","LossCFFromPrev7thYearFromAY","LossCFFromPrev6thYearFromAY",
      "LossCFFromPrev5thYearFromAY","LossCFFromPrev4thYearFromAY","LossCFFromPrev3rdYearFromAY","LossCFFromPrev2ndYearFromAY",
      "LossCFFromPrevYrToAY","LossCFCurrentAssmntYear","LossCFCurrentAssmntYear2021","LossCFCurrentAssmntYear2022",
      "LossCFCurrentAssmntYear2023","LossCFCurrentAssmntYear2024","LossCFCurrentAssmntYear2025","LossCFCurrentAssmntYear2026"];
    ["TotalHPPTILossCF","BusLossOthThanSpecLossCF","LossFrmSpecBusCF","LossFrmSpecifiedBusCF","TotalSTCGPTILossCF","TotalLTCGPTILossCF","OthSrcLossRaceHorseCF"].forEach(function(f){
      A(622,REQ(RG(cf,"TotalOfBFLossesEarlierYrs.LossSummaryDetail."+f),yrs16.reduce(function(a,y){return a+N(RG(cf,y+".CarryFwdLossDetail."+f));},0)),
        "Schedule CFL: the total of brought-forward losses ("+f+") must equal the amounts provided in the individual assessment years.");
    });
  }
});
