/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, batch enc_05 (Phase 6).
   Slice: rules.json Category-A serials 201–250 (Schedule HP · Schedule BP).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires when cond (the "valid" assertion) is FALSE.
   Reads are guarded (RG / (X||{})) and every schedule-scoped block is
   entered only when its schedule is present, so the batch is a no-op on an
   empty return and never throws. Paths from forms/ITR-5/src/70_sec_*.js
   (HP: ScheduleHP; BP: CorpScheduleBP; feeds: PARTA_OI, ScheduleESR,
   ScheduleEI, ScheduleOS, SchedulePTI, PARTA_PL, ManufacturingAccount,
   PARTA_BS, ScheduleSI, PartA_GEN1).  Encoded from each rule's text.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const AR=v=>Array.isArray(v)?v:[];   /* coerce a wrong-typed imported field to an array (cf. enc_08) so a read never throws and aborts the rest of the batch */

  /* =============================================================
     SCHEDULE HP (201–208, and the 203 pass-through / 204 PAN cross-checks)
     ============================================================= */
  if(I.ScheduleHP){
    const props=AR(RG(I,"ScheduleHP.PropertyDetails",[]));
    const asseseePAN=String(RG(I,"PartA_GEN1.OrgFirmInfo.PAN","")||"").toUpperCase();
    props.forEach(function(p,idx){
      p=p||{}; const rd=p.Rentdetails||{}; const L="Schedule HP property "+(idx+1)+": ";
      /* A201 — 1(i) = 1(g) + 1(h) */
      A(201,REQ(rd.TotalDeduct,N(rd.ThirtyPercentOfBalance)+N(rd.IntOnBorwCap)),
        L+"total deduction 1(i) must equal 1(g) + 1(h).");
      /* A202 — 1(k) = 1(f) − 1(i) + 1(j) */
      A(202,REQ(rd.IncomeOfHP,N(rd.AnnualOfPropOwned)-N(rd.TotalDeduct)+N(rd.ArrearsUnrealizedRentRcvd)),
        L+"income from house property 1(k) must equal 1(f) − 1(i) + 1(j).");
      /* A205 — total interest u/s 24(b) = Σ per-loan interest, and equals 1(h) */
      const s24=RG(rd,"Section24B",null);
      if(s24&&typeof s24==="object")
        A(205,REQ(s24.TotalInterestUs24B,RSUM(AR(RG(s24,"Section24BDtls",[])).filter(function(r){return r!=null;}),"InterestUs24B"))
              &&REQ(N(rd.IntOnBorwCap),N(s24.TotalInterestUs24B)),
          L+"the interest on borrowed capital u/s 24(b) must equal the sum of the per-loan interest rows (and 1h).");
      /* A206 — interest claimed at 1(h) needs the 24(b) detail rows */
      A(206,!(N(rd.IntOnBorwCap)>0)||!!(s24&&RG(s24,"Section24BDtls",[]).length>0),
        L+"details of interest on borrowed capital u/s 24(b) are mandatory to claim the deduction at 1(h).");
      /* A207 — co-owned: other co-owner(s) share < 100% */
      if(p.PropCoOwnedFlg==="YES")
        A(207,RSUM(AR(RG(p,"CoOwners",[])).filter(function(r){return r!=null;}),"PercentShareProperty")<100,
          L+"when the property is co-owned, the percentage share of the other co-owner(s) must be less than 100%.");
      /* A208 — rent that cannot be realised (1b) cannot exceed gross/annual lettable value (1a) */
      A(208,N(rd.RentNotRealized)<=N(rd.AnnualLetableValue)+1,
        L+"the rent which cannot be realised (1b) cannot be more than the annual lettable value / gross rent (1a).");
      /* A204 — a co-owner PAN cannot equal the assessee PAN in Part A-General */
      if(asseseePAN)
        A(204,!AR(RG(p,"CoOwners",[])).some(function(c){return String((c||{}).PAN_CoOwner||"").toUpperCase()===asseseePAN;}),
          L+"the PAN of a co-owner cannot be the same as the PAN of the assessee in Part A-General.");
    });
    /* A203 — pass-through HP income (item 2) = Σ HP net income/loss in Schedule PTI */
    A(203,!I.SchedulePTI||REQ(RG(I,"ScheduleHP.PassThroghIncome",0),
        RSUM(AR(RG(I,"SchedulePTI.SchedulePTIDtls",[])),function(d){return RG(d,"IncFromHP.NetIncomeLoss",0);})),
      "Schedule HP: pass-through income (2) must equal the net house-property income/loss shown in Schedule PTI.");
  }

  /* =============================================================
     SCHEDULE BP — CorpScheduleBP (209–250)
     ============================================================= */
  if(I.CorpScheduleBP){
    const P=RG(I,"CorpScheduleBP.BusinessIncOthThanSpec",{})||{};
    const ir=RG(P,"IncRecCredPLOthHeadDtls",{})||{};
    const e7=RG(P,"ExpDebToPLOthHeadDtls",{})||{};

    /* ---- head cross-checks (209–211) ---- */
    /* A209 — A3a cannot exceed the income offered in Schedule HP */
    if(I.ScheduleHP)
      A(209,!(N(ir.HouseProperty)>0)||N(ir.HouseProperty)<=N(RG(I,"ScheduleHP.TotalIncomeChargeableUnHP"))+1,
        "Schedule BP: A3a (income relatable to house property credited to P&L) cannot exceed the income offered in Schedule HP.");
    /* A210 — A3c cannot exceed the income offered in Schedule OS */
    if(I.ScheduleOS)
      A(210,!(N(ir.OtherSources)>0)||N(ir.OtherSources)<=N(RG(I,"ScheduleOS.IncChargeableFrmOthSrc"))+1,
        "Schedule BP: A3c (income relatable to other sources credited to P&L) cannot exceed the income offered in Schedule OS.");
    /* A211 — A5 (exempt income credited to P&L) cannot exceed the exempt income in Schedule EI */
    if(I.ScheduleEI)
      A(211,N(RG(P,"IncCredPL.TotExempInc"))<=N(RG(I,"ScheduleEI.TotalExemptInc"))+1,
        "Schedule BP: A5d (exempt income credited to P&L) cannot exceed the exempt income declared in Schedule EI.");

    /* ---- Part A ladder arithmetic (212–217, 223, 224, 230–233, 240, 241) ---- */
    /* A212 — A6 = 1 − 2a − 2b − 3a − 3b − 3c − 3d − 3e − 3f − 4a − 4b − 4c − 5d − 5A */
    const PLREF=["ProfitLossUs44AD","ProfitLossUs44ADA","ProfitLossUs44AE","ProfitLossUs44B","ProfitLossUs44BB",
      "ProfitLossUs44BBA","ProfitLossUs44BBC","ProfitLossUs44BBD","ProfitLossUs44DA","FirstSchITActOthr115B"];
    const s4a=Math.max(0,PLREF.reduce(function(a,k){return a+N(RG(P,"ProfitLossInclRefrdSec."+k));},0));
    A(212,REQ(P.BalancePLOthThanSpecBus,
        N(P.ProfBfrTaxPL)-N(P.NetPLFromSpecBus)-N(P.NetProfLossSpecifiedBus)
        -N(ir.HouseProperty)-N(ir.CapitalGains)-N(ir.OtherSources)-N(ir.UnderSec115BBF)-N(ir.UnderSec115BBG)-N(ir.UnderSec115BBH)
        -s4a-N(P.PLUs44sChapXIIGOthrUs115B)-N(P.TotalProfitFrmActCvrd)-N(RG(P,"IncCredPL.TotExempInc"))-N(P.IncCredPLNotChargable)),
      "Schedule BP: A6 must equal A1 − 2a − 2b − 3a − 3b − 3c − 3d − 3e − 3f − 4a − 4b − 4c − 5d − 5A.");
    /* A213 — A9 = 7a + 7b + 7c + 7d + 7e + 7f + 8a + 8b */
    A(213,REQ(P.TotExpDebPL,
        N(e7.HouseProperty)+N(e7.CapitalGains)+N(e7.OtherSources)+N(e7.UnderSec115BBF)+N(e7.UnderSec115BBG)+N(e7.UnderSec115BBH)
        +N(P.ExpDebToPLExemptInc)+N(P.ExpDebToPLExemptIncDisAllwUs14A)),
      "Schedule BP: A9 total must equal 7a + 7b + 7c + 7d + 7e + 7f + 8a + 8b.");
    /* A214 — A10 = A6 + A9 */
    A(214,REQ(P.AdjustedPLOthThanSpecBus,N(P.BalancePLOthThanSpecBus)+N(P.TotExpDebPL)),
      "Schedule BP: A10 must equal A6 + A9.");
    /* A215 — A13 = 10 + 11 − 12iii */
    A(215,REQ(P.AdjustPLAfterDeprOthSpecInc,
        N(P.AdjustedPLOthThanSpecBus)+N(P.DepreciationDebPLCosAct)-N(RG(P,"DepreciationAllowITAct32.TotDeprAllowITAct"))),
      "Schedule BP: A13 must equal 10 + 11 − 12iii.");
    /* A216 — A26 = 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + 23 + 24 + 25 */
    A(216,REQ(P.TotAfterAddToPLDeprOthSpecInc,
        N(P.AmtDebPLDisallowUs36)+N(P.AmtDebPLDisallowUs37)+N(P.AmtDebPLDisallowUs40)+N(P.AmtDebPLDisallowUs40A)
        +N(P.AmtDebPLDisallowUs43B)+N(P.InterestDisAllowUs23SMEAct)+N(P.DeemIncUs41)+N(P.DeemIncUs3380HHD80IA)
        +N(P.DeemIncUs43CA)+N(P.OthItemDisallowUs28To44DB)+N(P.AnyOthIncNotInclInExpDisallowPL)+N(P.IncProfDecLossAccICDSAdj)),
      "Schedule BP: A26 must equal 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + 23 + 24 + 25.");
    /* A217 — A33 = 27 + 28 + 29 + 30 + 31 + 32 */
    A(217,REQ(P.TotDeductionAmts,
        N(P.DeductUs32_1_iii)+N(P.DebPLUs35ExcessAmt)+N(P.AmtDisallUs40NowAllow)+N(P.AmtDisallUs43BNowAllow)
        +N(P.AnyOthAmtAllDeduct)+N(P.DecProfIncLossAccICDSAdj)),
      "Schedule BP: A33 must equal 27 + 28 + 29 + 30 + 31 + 32.");
    /* A223 — A21 total = Σ 21(i) to 21(xii) */
    const D21=["DeemIncUs32AC","DeemIncUs32AD","DeemIncUs33AB","DeemIncUs33ABA","DeemIncUs35ABA","DeemIncUs35ABB",
      "DeemIncUs35AC","DeemIncUs40A3A","DeemIncUs33AC","DeemIncUs72A","DeemIncUs80HHD","DeemIncUs80IA"];
    A(223,REQ(P.DeemIncUs3380HHD80IA,D21.reduce(function(a,k){return a+N(RG(P,k));},0)),
      "Schedule BP: A21 total must equal the sum of 21(i) to 21(xii).");
    /* A224 — A24 = 24a + 24b + 24c + 24d + 24e */
    A(224,REQ(P.AnyOthIncNotInclInExpDisallowPL,
        N(P.SalaryExpDisallowPL)+N(P.BonusExpDisallowPL)+N(P.CommissionExpDisallowPL)+N(P.InterestExpDisallowPL)+N(P.OthersExpDisallowPL)),
      "Schedule BP: A24 must equal 24(a) + 24(b) + 24(c) + 24(d) + 24(e).");
    /* A230 — A34 = 13 + 26 − 33 */
    A(230,REQ(P.PLAftAdjDedBusOthThanSpec,N(P.AdjustPLAfterDeprOthSpecInc)+N(P.TotAfterAddToPLDeprOthSpecInc)-N(P.TotDeductionAmts)),
      "Schedule BP: A34 must equal 13 + 26 − 33.");
    /* A231 — A35(ix) = Σ 35(i) to 35(viii) */
    const D35=["Section44AD","Section44ADA","Section44AE","Section44B","Section44BB","Section44BBA",
      "Section44BBC","Section44BBD","Section44DA","FirstSchTActOther"];
    A(231,REQ(RG(P,"DeemedProfitBusUs.TotDeemedProfitBusUs"),
        D35.reduce(function(a,k){return a+N(RG(P,"DeemedProfitBusUs."+k));},0)),
      "Schedule BP: A35(ix) must equal the sum of 35(i) to 35(viii).");
    /* A232 — A36 = A34 + A35(ix) */
    A(232,REQ(P.NetPLAftAdjBusOthThanSpec,N(P.PLAftAdjDedBusOthThanSpec)+N(RG(P,"DeemedProfitBusUs.TotDeemedProfitBusUs"))),
      "Schedule BP: A36 must equal A34 + A35(ix).");
    /* A233 — A37 = 37a + 37b + 37c + 37d + 37e + 37f */
    A(233,REQ(P.NetPLBusOthThanSpec7A7B7C,
        N(P.ChrgblIncUndrRule7)+N(P.DeemedChrgblIncUndrRule7A)+N(P.DeemedChrgblIncUndrRule7B1)
        +N(P.DeemedChrgblIncUndrRule7B1A)+N(P.DeemedChrgblIncUndrRule8)+N(P.IncomeOtherThanRule)),
      "Schedule BP: A37 must equal 37a + 37b + 37c + 37d + 37e + 37f.");
    /* A240 — balance income after rule 7A/7B/8 = 4c − (37a + 37b + 37c + 37d + 37e), nil if negative */
    A(240,REQ(P.BalIncDeemedFrmAgri,Math.max(0,N(P.TotalProfitFrmActCvrd)
        -(N(P.ChrgblIncUndrRule7)+N(P.DeemedChrgblIncUndrRule7A)+N(P.DeemedChrgblIncUndrRule7B1)
          +N(P.DeemedChrgblIncUndrRule7B1A)+N(P.DeemedChrgblIncUndrRule8)))),
      "Schedule BP: the balance income after rule 7A/7B/8 must equal 4c − (37a + 37b + 37c + 37d + 37e).");
    /* A241 — A5d total exempt income = 5a (firm) + 5b (AOP/BOI) + 5c */
    A(241,REQ(RG(P,"IncCredPL.TotExempInc"),
        N(RG(P,"IncCredPL.FirmShareInc"))+N(RG(P,"IncCredPL.AOPBOISharInc"))+N(RG(P,"IncCredPL.OthExempInc"))),
      "Schedule BP: A5d total exempt income must equal 5a (share of income from firm) + 5b (AOP/BOI) + 5c.");
    /* A238 — the presumptive sections declared at A4a must match those declared at A35.
       /* not mappable as amount equality: A4a (book profit removed) and A35 (deemed income added)
          are generally unequal by tax logic, so the department "should match" is encoded as
          per-section presence consistency (a section is declared at A4a iff it is declared at A35). */
    const A238PAIRS=[["ProfitLossUs44AD","Section44AD"],["ProfitLossUs44ADA","Section44ADA"],
      ["ProfitLossUs44AE","Section44AE"],["ProfitLossUs44B","Section44B"],["ProfitLossUs44BB","Section44BB"],
      ["ProfitLossUs44BBA","Section44BBA"],["ProfitLossUs44BBC","Section44BBC"],["ProfitLossUs44BBD","Section44BBD"],
      ["ProfitLossUs44DA","Section44DA"],["FirstSchITActOthr115B","FirstSchTActOther"]];
    A(238,A238PAIRS.every(function(pr){
        return (N(RG(P,"ProfitLossInclRefrdSec."+pr[0]))!==0)===(N(RG(P,"DeemedProfitBusUs."+pr[1]))!==0);}),
      "Schedule BP: the presumptive sections declared at A4a must match the sections declared at A35 (44AD/44ADA/44AE/44B/44BB/44BBA/44BBC/44BBD/44DA/First Schedule).");
    /* A239 — depreciation debited to P&L (11) = item 53 of P&L + item 1E(vi) of the Manufacturing A/c.
       Book BP.md:79 gives A11 (K65) = MAX(0, PL.dep 53 + Mfg.dep 1E(vi)); bp.js now emits A11 as that
       computed cell (70_sec_bp.js:311/706, DepreciationDebPLCosAct = n0(A._11)), so enforce the book
       identity with the strict-but-tolerant equality (±1 via REQ) rather than the old permissive range. */
    {const pl53=N(RG(I,"PARTA_PL.DebitsToPL.DebitPlAcnt.DepreciationAmort"));
     const mfg=N(RG(I,"ManufacturingAccount.OpeningInventory.DeprctnOfFactoryMachinery"));
     const a11=N(P.DepreciationDebPLCosAct);
     A(239,REQ(a11,pl53+mfg),
       "Schedule BP: depreciation debited to P&L (11) must equal item 53 of the P&L plus item 1E(vi) of the Manufacturing Account.");}

    /* ---- Part A cross-links to Part A-OI (218–222, 225, 227–229, 245) ---- */
    if(I.PARTA_OI){const oi=I.PARTA_OI;
      A(218,REQ(P.AmtDebPLDisallowUs36,RG(oi,"AmtDisallUs36.TotAmtDisallUs36")),
        "Schedule BP: A14 must equal 6t (total of item 6) of Part A-OI.");
      A(219,REQ(P.AmtDebPLDisallowUs37,RG(oi,"AmtDisallUs37.TotAmtDisallUs37")),
        "Schedule BP: A15 must equal 7j of Part A-OI.");
      A(220,REQ(P.AmtDebPLDisallowUs40,RG(oi,"AmtDisallUs40.TotAmtDisallUs40")),
        "Schedule BP: A16 must equal 8Aj of Part A-OI.");
      A(221,REQ(P.AmtDebPLDisallowUs40A,RG(oi,"AmtDisallUs40A.TotAmtDisallUs40A")),
        "Schedule BP: A17 must equal 9g of Part A-OI.");
      A(222,REQ(P.AmtDebPLDisallowUs43B,RG(oi,"AmtDisall43B.AmtUs43B.TotAmtUs43b")),
        "Schedule BP: A18 must equal item 11 of Part A-OI.");
      A(225,REQ(P.IncProfDecLossAccICDSAdj,N(RG(oi,"ProfDeviatDueAcctMeth"))+N(RG(oi,"MethodOfValClgStk.EffectOnPL"))),
        "Schedule BP: A25 must equal 3a + 4d of Part A-OI.");
      A(227,REQ(P.AmtDisallUs40NowAllow,RG(oi,"AmtDisallUs40.AnyAmtOfSec40AllowPrevYr")),
        "Schedule BP: A29 must equal 8B of Part A-OI.");
      A(228,REQ(P.AmtDisallUs43BNowAllow,RG(oi,"AmtDisallUs43BPyNowAll.AmtUs43B.TotAmtUs43b")),
        "Schedule BP: A30 must equal item 10 of Part A-OI.");
      A(229,REQ(P.DecProfIncLossAccICDSAdj,N(RG(oi,"DecProOrIncLossUs145_2"))+N(RG(oi,"MethodOfValClgStk.DecProOrIncLossUs145_A"))),
        "Schedule BP: A32 must equal 3b + 4e of Part A-OI.");
      A(245,REQ(P.ExpDebToPLExemptIncDisAllwUs14A,RG(oi,"AmountOfExpDisAllwUs14A")),
        "Schedule BP: A8b must equal item 16 of Part A-OI.");
    }
    /* A226 — A28 = total of column (4) of Schedule ESR */
    if(I.ScheduleESR)
      A(226,REQ(P.DebPLUs35ExcessAmt,RG(I,"ScheduleESR.DeductionUs35.TotUs35.DeductUs35.ExcessAmtOverDebPL")),
        "Schedule BP: A28 must equal the total of column (4) of Schedule ESR.");

    /* ---- Part B (speculative) 234, 247 ---- */
    const SB=RG(I,"CorpScheduleBP.SpecBusinessInc",{})||{};
    A(234,REQ(SB.AdjustedPLFrmSpecuBus,N(SB.NetPLFrmSpecBus)+N(SB.AdditionUs28to44DB)-N(SB.DeductUs28to44DB)),
      "Schedule BP: B42 must equal B39 + B40 − B41.");
    A(247,REQ(SB.NetPLFrmSpecBus,P.NetPLFromSpecBus),
      "Schedule BP: B39 must equal item 2a (net profit/loss from speculative business).");

    /* ---- Part C (specified business u/s 35AD) 235, 236, 246 ---- */
    const SC=RG(I,"CorpScheduleBP.IncSpecifiedBusiness",{})||{};
    A(235,REQ(SC.ProfitLossSpecifiedBusiness,N(SC.NetPLFrmSpecifiedBus)+N(SC.AddSec28to44DB)-N(SC.DedSec28to44DBOTDedSec35AD)),
      "Schedule BP: C46 must equal C43 + C44 − C45.");
    A(236,REQ(SC.ProfitLossSpecifiedBusFinal,N(SC.ProfitLossSpecifiedBusiness)-N(SC.DedSec35AD)),
      "Schedule BP: C48 must equal C46 − C47.");
    A(246,!(N(SC.ProfitLossSpecifiedBusFinal)!==0)||RG(SC,"DedUs35ADSubSec5Dtls",[]).length>0,
      "Schedule BP: the nature of the specified business (C49) must be selected when income/loss from specified business (C48) is entered.");

    /* ---- Part D (237) ---- */
    A(237,REQ(RG(I,"CorpScheduleBP.IncChrgUnHdProftGain"),
        Math.max(0,N(SC.ProfitLossSpecifiedBusFinal))+Math.max(0,N(SB.AdjustedPLFrmSpecuBus))+N(P.NetPLBusOthThanSpec7A7B7C)),
      "Schedule BP: D (income chargeable under the head) must equal A37 + B42 + C48.");

    /* ---- Part E (intra-head set off) 242, 243, 244 ---- */
    const BE=RG(I,"CorpScheduleBP.BusSetoffCurrYr",{})||{};
    A(242,REQ(RG(BE,"SpeculativeInc.IncOfCurYrAfterSetOff"),
          N(RG(BE,"SpeculativeInc.IncOfCurYrUnderThatHead"))-N(RG(BE,"SpeculativeInc.BusLossSetoff")))
         &&REQ(RG(BE,"SpecifiedInc.IncOfCurYrAfterSetOff"),
          N(RG(BE,"SpecifiedInc.IncOfCurYrUnderThatHead"))-N(RG(BE,"SpecifiedInc.BusLossSetoff"))),
      "Schedule BP: in Table E, business income remaining after set off must equal (income of current year) − (business loss set off).");
    A(243,REQ(BE.TotLossSetOffOnBus,N(RG(BE,"SpeculativeInc.BusLossSetoff"))+N(RG(BE,"SpecifiedInc.BusLossSetoff"))),
      "Schedule BP: E(v) total loss set off must equal E(ii) + E(iii) + E(iv).");
    A(244,REQ(BE.LossRemainSetOffOnBus,Math.max(0,N(BE.LossSetOffOnBusLoss)-N(BE.TotLossSetOffOnBus))),
      "Schedule BP: E(vi) loss remaining after set off must equal E(i) − E(v).");

    /* ---- status / regime conditions (248, 250) ---- */
    const has44AE=N(RG(P,"DeemedProfitBusUs.Section44AD"))>0||N(RG(P,"DeemedProfitBusUs.Section44ADA"))>0
                ||N(RG(P,"DeemedProfitBusUs.Section44AE"))>0;
    const bsReg=N(RG(I,"PARTA_BS.FundSrc.TotFundSrc"))>0;
    const bsNoAcc=N(RG(I,"PARTA_BS.NoBooksOfAccBS.TotSundryDbtAmt"))+N(RG(I,"PARTA_BS.NoBooksOfAccBS.TotSundryCrdAmt"))
                 +N(RG(I,"PARTA_BS.NoBooksOfAccBS.TotStkInTradAmt"))+N(RG(I,"PARTA_BS.NoBooksOfAccBS.CashBalAmt"))>0;
    /* A248 — presumptive 44AD/44ADA/44AE > 0 needs balance-sheet particulars (regular books or "No accounts", Part A-BS C) */
    A(248,!has44AE||bsReg||bsNoAcc,
      "Schedule BP: when presumptive income u/s 44AD/44ADA/44AE (35(i)/(ii)/(iii)) is greater than zero, the balance-sheet particulars under 'Regular books of accounts' or 'No accounts' (Part A-BS item C) are mandatory.");
    /* A250 — presumptive income u/s 44AD/44ADA only for a resident partnership firm (status 1, sub-status 10-Partnership Firm, resident) */
    const has44ADorADA=N(RG(P,"DeemedProfitBusUs.Section44AD"))>0||N(RG(P,"DeemedProfitBusUs.Section44ADA"))>0;
    A(250,!has44ADorADA||(RG(I,"PartA_GEN1.OrgFirmInfo.StatusOrCompanyType")==="1"
          &&RG(I,"PartA_GEN1.OrgFirmInfo.SubStatus")==="10"
          &&RG(I,"PartA_GEN1.FilingStatus.ResidentialStatus")!=="NRI"),
      "Schedule BP: presumptive income u/s 44AD/44ADA can be declared only by a resident partnership firm.");
  }

  /* A249 — income u/s 115BBF (patent), in Schedule BP or Schedule OS/SI, only for a resident */
  const has5BBF=N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.UnderSec115BBF"))>0
    ||AR(RG(I,"ScheduleSI.SplCodeRateTax",[])).some(function(r){return /5BBF/.test(String((r||{}).SecCode||""))&&N((r||{}).SplRateInc)>0;});
  A(249,!has5BBF||RG(I,"PartA_GEN1.FilingStatus.ResidentialStatus")!=="NRI",
    "Schedule BP / OS: income under section 115BBF (income from patent) can be claimed only by a resident.");
});
