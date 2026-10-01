/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_05 (Phase 6).
   Serial range A207–A256 (Schedule BP — CorpScheduleBP). Registered via
   ruleset(fn); runRules() invokes it with (I,S_,A,Dd). A(n,cond,msg) fires
   (pushes a Category-A block) when cond — the "this return is lawful"
   assertion — is FALSE.

   Every read is guarded (RG default 0 / (X||{}) / N()); nothing throws.
   Keys are the built-return ITR6 schema paths (I = the ITR6 root), taken
   from sources/ITR-6 schema, the built section forms/ITR-6/src/70_sec_bp.js
   (exp() paths) and forms/ITR-6/src/70_sec_accounts.js (Part A-OI / P&L keys),
   and books/ITR-6/BP.md. Encoded from each rule's own text (constitution
   rule 6), the whole block scoped under `if(I.CorpScheduleBP){...}` so it is
   silent when Schedule BP is absent.

   Encoded (45): A207 A208 A209 A210 A211 A212 A214 A215 A217 A218 A219 A220
     A221 A222 A223 A224 A225 A226 A227 A229 A230 A231 A234 A235 A236 A237
     A238 A239 A240 A241 A242 A243 A244 A245 A246 A247 A248 A249 A250 A251
     A252 A253 A254 A255 A256.

   Re-filed OFFLINE-IMPOSSIBLE (5) — the rule's own target field does NOT
   exist in the ITR-6 schema, so the check cannot be built without faking it
   (constitution: never fake a vacuous check). These move A(ENF)→OFFLINE in
   the census (MISSING stays 0):
     A213 — "A30 = Sl.8B of Part A-OI": PARTA_OI has NO 8B field (no
            "amount disallowed u/s 40 in a preceding year, now allowable").
            Its only u/s-40 keys are AmtDisallUs40 (8Aj) and AmtDisallUs40A
            (9f). BP item 30 (AmtDisallUs40NowAllow) has no OI counterpart.
     A216 — "BP 11 = 1Evi of Manufacturing account + 52 of P&L": ITR-6's
            ManufacturingAccount carries only {OpeningInventory, ClosingStock,
            CostOfGoodsPrdcd} — there is NO 1Evi depreciation line (nor in the
            Ind-AS variant). The RHS component is absent.
     A228 — "Depreciation u/s 32(1)(i) only if nature of business = power
            sector": PartA_GEN2For6.NatOfBus carries the business Code but the
            schema ships no power-sector classification, so "power sector"
            cannot be tested offline without an external code master.
     A232 — "exempt income reduced from PGBP does not tally with Schedule EI &
            share of profits from Schedule IF": the allocation of BP item-5
            exempt components across Schedule EI vs Schedule IF is not stated
            by the rule; a sound offline equality cannot be built without
            guessing the mapping (would false-fire on lawful returns).
     A233 — "A21 = sum of A(21a…21l)": CorpScheduleBP stores item 21 as ONE
            total leaf (DeemIncUs3380HHD80IA); the twelve 21a–21l sub-lines
            have NO schema keys, so the footing has nothing to sum.

   Note on A226: the rule text says "36(vi) = 62(b) Net Profit u/s 44AD", but
   44AD is inapplicable to a company and is absent from both the BP and the
   P&L schemas. The ITR-6 line at 36(vi) is u/s 44D (see 70_sec_bp.js and the
   sibling enc_06 A259); it is encoded against 44D, matching the ITR-6 form.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";          /* present / non-blank */
  const norm=v=>String(v==null?"":v).replace(/\s/g,"");

  /* ---- Part A General reads (concessional regime, residence, bus. codes) ---- */
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const conc=norm(FS.Section115BA);                      /* "115BA"|"115BAA"|"115BAB"|"NA"|"" */
  const opted115=conc!==""&&conc!=="NA";                 /* opted 115BA/115BAA/115BAB */
  const barred115=conc==="115BAA"||conc==="115BAB";      /* the two that close 35AD/ESR-weighted */
  const nonResident=FS.ResidentialStatus==="NRI";        /* foreign company */
  const NOB=RG(I,"PartA_GEN2For6.NatOfBus.NatureOfBusiness",[])||[];
  const hasBusCode=function(c){return (Array.isArray(NOB)?NOB:[]).some(function(r){return r&&norm(r.Code)===c;});};

  if(I.CorpScheduleBP){
    const BP =RG(I,"CorpScheduleBP",{})||{};
    const BA =RG(BP,"BusinessIncOthThanSpec",{})||{};
    const IRC=RG(BA,"IncRecCredPLOthHeadDtls",{})||{};    /* item 3a…3e */
    const IR =RG(BA,"ProfitLossInclRefrdSec",{})||{};     /* item 4a per section */
    const PF =RG(BA,"ProfitFrmActCvrd",{})||{};           /* item 4c rule 7/7A/7B/8 */
    const IC =RG(BA,"IncCredPL",{})||{};                  /* item 5 exempt */
    const EX =RG(BA,"ExpDebToPLOthHeadDtls",{})||{};      /* item 7 */
    const DP =RG(BA,"DeemedProfitBusUs",{})||{};          /* item 36 per section */
    const SB =RG(BP,"SpecBusinessInc",{})||{};            /* Part B */
    const SC =RG(BP,"IncSpecifiedBusiness",{})||{};       /* Part C */
    const BE =RG(BP,"BusSetoffCurrYr",{})||{};            /* Part E */
    const OI =RG(I,"PARTA_OI",{})||{};

    /* ---- Part A-OI cross-references (items 14–19 / 30–33 / ICDS 25/33) ---- */
    /* A207 — BP item 14 (u/s 36) = Part A-OI 6s. */
    A(207, REQ(N(BA.AmtDebPLDisallowUs36), N(RG(OI,"AmtDisallUs36.TotAmtDisallUs36"))),
      "Schedule BP: item A14 (disallowable u/s 36) must equal Sl. No. 6s of Part A-OI.");
    /* A208 — BP item 15 (u/s 37) = Part A-OI 7k. */
    A(208, REQ(N(BA.AmtDebPLDisallowUs37), N(RG(OI,"AmtDisallUs37.TotAmtDisallUs37"))),
      "Schedule BP: item A15 (disallowable u/s 37) must equal Sl. No. 7k of Part A-OI.");
    /* A209 — BP item 16 (u/s 40) = Part A-OI 8Aj. */
    A(209, REQ(N(BA.AmtDebPLDisallowUs40), N(RG(OI,"AmtDisallUs40.TotAmtDisallUs40"))),
      "Schedule BP: item A16 (disallowable u/s 40) must equal Sl. No. 8Aj of Part A-OI.");
    /* A210 — BP item 17 (u/s 40A) = Part A-OI 9F. */
    A(210, REQ(N(BA.AmtDebPLDisallowUs40A), N(RG(OI,"AmtDisallUs40A.TotAmtDisallUs40A"))),
      "Schedule BP: item A17 (disallowable u/s 40A) must equal Sl. No. 9F of Part A-OI.");
    /* A211 — BP item 18 (u/s 43B) = Part A-OI 11i. */
    A(211, REQ(N(BA.AmtDebPLDisallowUs43B), N(RG(OI,"AmtDisall43B.AmtUs43B.TotAmtUs43b"))),
      "Schedule BP: item A18 (disallowable u/s 43B) must equal Sl. No. 11i of Part A-OI.");

    /* A212 — BP item 29 = total of column (4) of Schedule ESR (excess over debit). */
    A(212, REQ(N(BA.DebPLUs35ExcessAmt), N(RG(I,"ScheduleESR.DeductionUs35.TotUs35.DeductUs35.ExcessAmtOverDebPL"))),
      "Schedule BP: item A29 must equal the total of column (4) of Schedule ESR.");

    /* A213 — re-filed OFFLINE-IMPOSSIBLE (PARTA_OI has no 8B field); see header. */

    /* A214 — BP item 31 = Part A-OI 10i (43B disallowed earlier, now allowable). */
    A(214, REQ(N(BA.AmtDisallUs43BNowAllow), N(RG(OI,"AmtDisallUs43BPyNowAll.AmtUs43B.TotAmtUs43b"))),
      "Schedule BP: item A31 must equal Sl. No. 10i of Part A-OI.");

    /* A215 — BP item 33 = Part A-OI 3b + 4e (decrease in profit per ICDS / 145A). */
    A(215, REQ(N(BA.DecProfIncLossAccICDSAdj),
        N(OI.DecProOrIncLossUs145_2)+N(RG(OI,"MethodOfValClgStk.DecProOrIncLossUs145_A"))),
      "Schedule BP: item A33 must equal Sl. No. 3b + 4e of Part A-OI.");

    /* A216 — re-filed OFFLINE-IMPOSSIBLE (no 1Evi depreciation in ManufacturingAccount); see header. */

    /* A217 — BP item 5d (total exempt) = 5a + 5b + 5c-total. */
    A(217, REQ(N(IC.TotExempInc), N(IC.FirmShareInc)+N(IC.AOPBOISharInc)+N(IC.OthExempInc)),
      "Schedule BP: item A5d must equal A(5a + 5b + 5c).");

    /* A218 — Part E: business income remaining after set off = income − loss set off. */
    ["SpeculativeInc","SpecifiedInc","ProfGainUs115B","IncmForeignCompRule10TIA"].forEach(function(blk){
      A(218, REQ(N(RG(BE,blk+".IncOfCurYrAfterSetOff")),
          N(RG(BE,blk+".IncOfCurYrUnderThatHead"))-N(RG(BE,blk+".BusLossSetoff"))),
        "Schedule BP: Table E — income of current year after set off must equal (income of current year − business loss set off).");
    });

    /* A219 — BP 36(i) (44AE deemed) = P&L 61(ii) (total presumptive u/s 44AE). */
    A(219, REQ(N(DP.Section44AE), N(RG(I,"PARTA_PL.TotalPrsumptvIncUs44E"))),
      "Schedule BP: item 36(i) must equal Sl. No. 61(ii) of Schedule P&L.");

    /* A220–A226 — BP 36(ii…vi) = P&L 62(b) 'Net Profit u/s ...' (no-account row). */
    const NB=RG(I,"PARTA_PL.NoBooksOfAccPLDetails",[])||[];
    const pl62b=function(sec){var t=0;(Array.isArray(NB)?NB:[]).forEach(function(r){if(r&&norm(r.Section)===sec)t+=N(r.NetProfit);});return t;};
    A(220, REQ(N(DP.Section44B),   pl62b("44B")),
      "Schedule BP: item 36(ii) must equal Sl. No. 62(b) 'Net Profit u/s 44B' of Schedule P&L.");
    A(221, REQ(N(DP.Section44BB),  pl62b("44BB")),
      "Schedule BP: item 36(iii) must equal Sl. No. 62(b) 'Net Profit u/s 44BB' of Schedule P&L.");
    A(222, REQ(N(DP.Section44BBA), pl62b("44BBA")),
      "Schedule BP: item 36(iv) must equal Sl. No. 62(b) 'Net Profit u/s 44BBA' of Schedule P&L.");
    A(223, REQ(N(DP.Section44BBB), pl62b("44BBB")),
      "Schedule BP: item 36(v) must equal Sl. No. 62(b) 'Net Profit u/s 44BBB' of Schedule P&L.");
    A(224, REQ(N(DP.Section44BBC), pl62b("44BBC")),
      "Schedule BP: item 36(va) must equal Sl. No. 62(b) 'Net Profit u/s 44BBC' of Schedule P&L.");
    A(225, REQ(N(DP.Section44BBD), pl62b("44BBD")),
      "Schedule BP: item 36(vb) must equal Sl. No. 62(b) 'Net Profit u/s 44BBD' of Schedule P&L.");
    A(226, REQ(N(DP.Section44D),   pl62b("44D")),
      "Schedule BP: item 36(vi) must equal Sl. No. 62(b) 'Net Profit u/s 44D' of Schedule P&L.");

    /* A227 — BP item 8b (14A disallowed) = Part A-OI 16. */
    A(227, REQ(N(BA.ExpDebToPLExemptIncDisAllwUs14A), N(OI.AmountOfExpDisAllwUs14A)),
      "Schedule BP: item 8b (expenses disallowed u/s 14A) must equal Sl. No. 16 of Part A-OI.");

    /* A228 — re-filed OFFLINE-IMPOSSIBLE (no power-sector classifier offline); see header. */

    /* A229 — specified-business income entered ⇒ nature (35AD(5) clause) not blank. */
    const specifiedPresent=N(BA.NetProfLossSpecifiedBus)!==0||N(SC.NetPLFrmSpecifiedBus)!==0||N(SC.ProfitLossSpecifiedBusFinal)!==0;
    const clausePresent=(RG(SC,"DedUs35ADSubSec5Dtls",[])||[]).some(function(r){return r&&S0(r.DedUs35ADSubSec5);});
    A(229, !specifiedPresent || clausePresent,
      "Schedule BP: when income/loss from specified business is entered, the nature of the specified business (relevant clause of section 35AD(5)) cannot be blank.");

    /* A230 — income/receipts reduced at Sl.3 and/or Sl.5 cannot exceed income
       credited to the statement of P&L (regular or Ind-AS). */
    const reduced3=N(IRC.HouseProperty)+N(IRC.CapitalGains)+N(IRC.OtherSources)
      +N(IRC.UnderSec115BBF)+N(IRC.UnderSec115BBG)+N(BA.PLUs44sChapXIIGOthrUs115B);
    const reduced5=N(IC.TotExempInc);
    const credited=N(RG(I,"PARTA_PL.CreditsToPL.TotCreditsToPL"))+N(RG(I,"PARTA_PLIndAS.CreditsToPL.TotCreditsToPL"));
    A(230, (reduced3+reduced5)<=credited+1,
      "Schedule BP: the income/receipts reduced at Sl. No. 3 and/or Sl. No. 5 cannot be higher than the income/receipts credited to the statement of profit and loss.");

    /* A231 — a non-resident (foreign company) cannot offer income u/s 115BBF. */
    A(231, !nonResident || N(IRC.UnderSec115BBF)<=0,
      "Schedule BP: a non-resident taxpayer cannot offer income u/s 115BBF (item 3d).");

    /* A232 — re-filed OFFLINE-IMPOSSIBLE (EI/IF allocation of BP exempt income indeterminate); see header. */

    /* A233 — re-filed OFFLINE-IMPOSSIBLE (item 21 has one total key, no 21a–21l leaves); see header. */

    /* A234 — BP item 24 = 24a + 24b + 24c. */
    A(234, REQ(N(BA.AnyOthIncNotInclInExpDisallowPL),
        N(BA.CommissionExpDisallowPL)+N(BA.InterestExpDisallowPL)+N(BA.OthersExpDisallowPL)),
      "Schedule BP: item A24 must equal Sl. No. 24(a + b + c).");

    /* A235 — BP item 24(c) must be at least the Schedule-ESR shortfall
       (sum over ESR rows of MAX(0, amount debited − amount allowable)). */
    const ESRd=RG(I,"ScheduleESR.DeductionUs35",{})||{};
    let esrShort=0;
    Object.keys(ESRd).forEach(function(k){
      if(k==="TotUs35"||!ESRd[k])return;
      const du=RG(ESRd[k],"DeductUs35",{})||{};
      esrShort+=Math.max(0, N(du.AmtDebPL)-N(du.AmtUs35Allowable));
    });
    A(235, N(BA.OthersExpDisallowPL)>=esrShort-1,
      "Schedule BP: item 24(c) must be at least the absolute total of the negative (col 3 − col 2) values of Schedule ESR.");

    /* A236 — BP item 20 (deemed income u/s 41) = Part A-OI 14. */
    A(236, REQ(N(BA.DeemIncUs41), N(OI.ProfTaxAmtUs41)),
      "Schedule BP: item A20 must equal Sl. No. 14 of Part A-OI.");

    /* A237 — Schedule SI 115B (insurance business) claimed ⇒ BP item 4b filled. */
    const SI=RG(I,"ScheduleSI.SplCodeRateTax",[])||[];
    const si115B=(Array.isArray(SI)?SI:[]).some(function(r){return r&&norm(r.SecCode)==="5B"&&N(r.SplRateInc)>0;});
    A(237, !si115B || N(BA.PLUs44sChapXIIGUs115B)>0,
      "Schedule BP: when the benefit of income from insurance business u/s 115B is claimed in Schedule SI, item 4b of Schedule BP is mandatory.");

    /* A238 — BP item 9 = 7a + 7b + 7c + 7d + 7e + 8a + 8b. */
    A(238, REQ(N(BA.TotExpDebPL),
        N(EX.HouseProperty)+N(EX.CapitalGains)+N(EX.OtherSources)+N(EX.UnderSec115BBF)+N(EX.UnderSec115BBG)
        +N(BA.ExpDebToPLExemptInc)+N(BA.ExpDebToPLExemptIncDisAllwUs14A)),
      "Schedule BP: item A9 must equal the sum of Sl. No. 7a + 7b + 7c + 7d + 7e + 8a + 8b.");

    /* A239 — BP item 34 = 27 + 28 + 29 + 30 + 31 + 32 + 33. */
    A(239, REQ(N(BA.TotDeductionAmts),
        N(BA.DeductUs32_1_iii)+N(BA.Amt32AC)+N(BA.DebPLUs35ExcessAmt)+N(BA.AmtDisallUs40NowAllow)
        +N(BA.AmtDisallUs43BNowAllow)+N(BA.AnyOthAmtAllDeduct)+N(BA.DecProfIncLossAccICDSAdj)),
      "Schedule BP: item A34 must equal the sum of Sl. No. A(27 + 28 + 29 + 30 + 31 + 32 + 33).");

    /* A240 — BP item 35 = 13 + 26 − 34. */
    A(240, REQ(N(BA.PLAftAdjDedBusOthThanSpec),
        N(BA.AdjustPLAfterDeprOthSpecInc)+N(BA.TotAfterAddToPLDeprOthSpecInc)-N(BA.TotDeductionAmts)),
      "Schedule BP: item A35 must equal Sl. No. A(13 + 26 − 34).");

    /* A241 — BP item 36x = sum of 36i to 36ix. */
    const sum36=N(DP.Section44AE)+N(DP.Section44B)+N(DP.Section44BB)+N(DP.Section44BBA)+N(DP.Section44BBB)
      +N(DP.Section44BBC)+N(DP.Section44BBD)+N(DP.Section44D)+N(DP.Section44DA)+N(DP.ChapterXIIG)+N(DP.FirstSchTActOther);
    A(241, REQ(N(DP.TotDeemedProfitBusUs), sum36),
      "Schedule BP: item A36x must equal the sum of Sl. No. A(36i to 36ix).");

    /* A242 — BP item 37 = 35 + 36x. */
    A(242, REQ(N(BA.NetPLAftAdjBusOthThanSpec), N(BA.PLAftAdjDedBusOthThanSpec)+N(DP.TotDeemedProfitBusUs)),
      "Schedule BP: item A37 must equal Sl. No. A(35) + A(36x).");

    /* A243 — BP item 38 = 38a + 38b + 38c + 38d + 38e + 38f. */
    A(243, REQ(N(BA.NetPLBusOthThanSpec7A7B7C),
        N(BA.ChrgblIncUndrRule7)+N(BA.DeemedChrgblIncUndrRule7A)+N(BA.DeemedChrgblIncUndrRule7B1)
        +N(BA.DeemedChrgblIncUndrRule7B1A)+N(BA.DeemedChrgblIncUndrRule8)+N(BA.IncomeOtherThanRule)),
      "Schedule BP: item 38 must equal the sum of Sl. No. (38a + 38b + 38c + 38d + 38e + 38f).");

    /* A244 — BP item B43 = B40 + B41 − B42. */
    A(244, REQ(N(SB.AdjustedPLFrmSpecuBus), N(SB.NetPLFrmSpecBus)+N(SB.AdditionUs28to44DA)-N(SB.DeductUs28to44DA)),
      "Schedule BP: item B43 must equal Sl. No. B40 + B41 − B42.");

    /* A245 — BP item C47 = C44 + C45 − C46. */
    A(245, REQ(N(SC.ProfitLossSpecifiedBusiness), N(SC.NetPLFrmSpecifiedBus)+N(SC.AddSec28to44DA)-N(SC.DedSec28to44DAOTDedSec35AD)),
      "Schedule BP: item C47 must equal Sl. No. C(44 + 45 − 46).");

    /* A246 — BP item C49 = C47 − C48. */
    A(246, REQ(N(SC.ProfitLossSpecifiedBusFinal), N(SC.ProfitLossSpecifiedBusiness)-N(SC.DedSec35AD1)),
      "Schedule BP: item C49 must equal Sl. No. C(47 − 48).");

    /* A247 — BP item D = A38 + B43 + C49 (B43 and C49 only if more than 0). */
    A(247, REQ(N(BP.IncChrgUnHdProftGain),
        N(BA.NetPLBusOthThanSpec7A7B7C)+Math.max(0,N(SB.AdjustedPLFrmSpecuBus))+Math.max(0,N(SC.ProfitLossSpecifiedBusFinal))),
      "Schedule BP: item D (income chargeable under 'Profits and gains from Business or Profession') must equal A38 + B43 + C49 (B43 and C49 only when more than 0).");

    /* A248 — sum of item 4a (per-section profits) = item 36x total. */
    const sum4a=N(IR.ProfitLossUs44AE)+N(IR.ProfitLossUs44B)+N(IR.ProfitLossUs44BB)+N(IR.ProfitLossUs44BBA)
      +N(IR.ProfitLossUs44BBB)+N(IR.ProfitLossUs44BBC)+N(IR.ProfitLossUs44BBD)+N(IR.ProfitLossUs44D)
      +N(IR.ProfitLossUs44DA)+N(IR.ProfitChapterXIIG)+N(IR.FirstSchITActOthr115B);
    A(248, REQ(sum4a, N(DP.TotDeemedProfitBusUs)),
      "Schedule BP: the sum of the values at Sl. No. A(4a) must equal the value at Sl. No. A(36x).");

    /* A249 — BP item A39 = 4c − (38a + 38b + 38c + 38d + 38e). */
    A(249, REQ(N(BA.BalIncDeemedFrmAgri),
        N(BA.TotalProfitFrmActCvrd)-(N(BA.ChrgblIncUndrRule7)+N(BA.DeemedChrgblIncUndrRule7A)
        +N(BA.DeemedChrgblIncUndrRule7B1)+N(BA.DeemedChrgblIncUndrRule7B1A)+N(BA.DeemedChrgblIncUndrRule8))),
      "Schedule BP: item A39 must equal Sl. No. 4c − (38a + 38b + 38c + 38d + 38e).");

    /* A250 — Part E item (v) total loss set off = sum of the per-head set-off amounts. */
    const setoffTot=N(RG(BE,"SpeculativeInc.BusLossSetoff"))+N(RG(BE,"SpecifiedInc.BusLossSetoff"))
      +N(RG(BE,"ProfGainUs115B.BusLossSetoff"))+N(RG(BE,"IncmForeignCompRule10TIA.BusLossSetoff"));
    A(250, REQ(N(BE.TotLossSetOffOnBus), setoffTot),
      "Schedule BP: item E(v) must equal the sum of Sl. No. E(ii) + E(iii) + E(iv).");

    /* A251 — Part E item (vi) loss remaining = (i) − (v). */
    A(251, REQ(N(BE.LossRemainSetOffOnBus), N(BE.LossSetOffOnBusLoss)-N(BE.TotLossSetOffOnBus)),
      "Schedule BP: item E(vi) must equal Sl. No. E(i) − E(v).");

    /* A252 — BP item B40 = item 2a (net profit/loss from speculative business). */
    A(252, REQ(N(SB.NetPLFrmSpecBus), N(BA.NetPLFromSpecBus)),
      "Schedule BP: item B40 must equal item 2a 'Net profit or loss from speculative business'.");

    /* A253 — rule 7A/7B/8 profit only with the corresponding business code
       (rule 7A ⇒ 1003, rule 7B(1)/7B(1A) ⇒ 1002, rule 8 ⇒ 1001). */
    A(253, !(N(PF.ProfitFrmActCvrdUndrRule7A)>0) || hasBusCode("1003"),
      "Schedule BP: profit from activities covered under rule 7A can be entered only if business code 1003 is selected.");
    A(253, !((N(PF.ProfitFrmActCvrdUndrRule7B1)>0)||(N(PF.ProfitFrmActCvrdUndrRule7B1A)>0)) || hasBusCode("1002"),
      "Schedule BP: profit from activities covered under rule 7B(1)/7B(1A) can be entered only if business code 1002 is selected.");
    A(253, !(N(PF.ProfitFrmActCvrdUndrRule8)>0) || hasBusCode("1001"),
      "Schedule BP: profit from activities covered under rule 8 can be entered only if business code 1001 is selected.");

    /* A254 — opted 115BA/115BAA/115BAB ⇒ the 35AD(1) deduction (item 48) cannot be claimed. */
    A(254, !opted115 || N(SC.DedSec35AD1)===0,
      "Schedule BP: having opted for the lower rate of taxation u/s 115BAB/115BA/115BAA, the deduction u/s 35AD (Sl. No. 48) cannot be claimed.");

    /* A255 — opted 115BAA/115BAB ⇒ neither the 35AD(1) deduction nor the ESR
       weighted deductions [35(1)(ii)/(iia)/(iii)/35(2AA)/35CCC] can be claimed. */
    const esrWeighted=N(RG(I,"ScheduleESR.DeductionUs35.Section35_1_ii.DeductUs35.AmtUs35Allowable"))
      +N(RG(I,"ScheduleESR.DeductionUs35.Section35_1_iia.DeductUs35.AmtUs35Allowable"))
      +N(RG(I,"ScheduleESR.DeductionUs35.Section35_1_iii.DeductUs35.AmtUs35Allowable"))
      +N(RG(I,"ScheduleESR.DeductionUs35.Section35_2AA.DeductUs35.AmtUs35Allowable"))
      +N(RG(I,"ScheduleESR.DeductionUs35.Section35_CCC.DeductUs35.AmtUs35Allowable"));
    A(255, !barred115 || (N(SC.DedSec35AD1)===0 && esrWeighted===0),
      "Schedule BP: the deduction u/s 35AD(1), and the Schedule-ESR deductions u/s 35(1)(ii)/35(1)(iia)/35(1)(iii)/35(2AA)/35CCC, cannot be claimed when 115BAA or 115BAB is opted.");

    /* A256 — BP item 3c = 3c(i) + 3c(ii). */
    A(256, REQ(N(IRC.OtherSources), N(IRC.Dividend)+N(IRC.OtherThanDividend)),
      "Schedule BP: item A3c must equal Sl. No. A3(c)(i) + A3(c)(ii).");
  }
});
