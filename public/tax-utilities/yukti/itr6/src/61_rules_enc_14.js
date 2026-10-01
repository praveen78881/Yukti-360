/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_14 (Phase 6).
   Serial range A659–A709 — Schedule EI (A659–A660), Schedule PTI
   (A661–A665), Schedule MAT (A666–A676), Schedule MATC (A677–A686),
   Schedule TPSA (A687–A693), Schedule 115TD (A695–A700), Schedule FSI
   (A701–A707) and Schedule TR (A708–A709).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this
   return is lawful" assertion — is FALSE. Every read is guarded (RG /
   (X||{}) / N() / AR()); nothing throws. Keys are the built-return ITR6
   schema paths, taken from sources/ITR-6 schema and verified against the
   built sections (70_sec_ei / 70_sec_other[PTI] / 70_sec_mat[MAT+MATC] /
   70_sec_fa[FSI+TR]) and books/ITR-6. Arithmetic checks use REQ (|a−b|≤1);
   a zero-skeleton foots 0==0, so an empty return never fires. Encoded from
   each rule's own text (constitution rule 6).

   Skipped in this range (accounted for in books/ITR-6/rule_census.md):
     A694 — NA: "date at which tax is deposited cannot be after System
            Date" — a server-clock comparison performed by the portal.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";            /* "present / non-blank" */
  const AR=x=>Array.isArray(x)?x:[];                      /* guarded array         */

  /* Part A General / status reads reused by applicability rules. */
  const OF=RG(I,"PartA_GEN1.OrgFirmInfo",{})||{};
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const OI=RG(I,"PARTA_OI",{})||{};
  const optBAABAB=(FS.Section115BA==="115BAA"||FS.Section115BA==="115BAB");

  /* =====================================================================
     Schedule EI — A659–A660 (exempt income · Others sub-table).
     Rows: ScheduleEI.OthersInc.OthersIncDtls[] {Category,SubCategory,
     Description,OthAmount}. The three sub-categories that DO carry a
     description are CBDT-Circular / CBDT-Notification / Receipt-not-income.
     ===================================================================== */
  if(I.ScheduleEI){
    const EI_DESC=["Incmexmptcircular","Incmexmptnotification","Receiptnotincme"];
    AR(RG(I,"ScheduleEI.OthersInc.OthersIncDtls",[])).forEach(function(r){
      r=r||{};
      /* A659 — amount reported (>0) ⇒ Category and sub-category are mandatory. */
      A(659, N(r.OthAmount)<=0 || (S0(r.Category)&&S0(r.SubCategory)),
        "Schedule EI: selection of category and sub-category is mandatory when the amount reported under 'Others' is more than zero.");
      /* A660 — amount >0 under any sub-category other than the three above ⇒
         description is not required (must stay blank / is greyed off). */
      A(660, !(N(r.OthAmount)>0 && S0(r.SubCategory) && EI_DESC.indexOf(String(r.SubCategory))<0) || !S0(r.Description),
        "Schedule EI: where the amount is more than 0 under a sub-category other than 'Income exempt as per CBDT Circular', 'Income exempt as per CBDT Notification' or 'Receipts not in the nature of Income', a description is not required.");
    });
  }

  /* =====================================================================
     Schedule PTI — A661–A665. Per fund row (SchedulePTIDtls[]). Columns
     7/8/9 = AmountOfInc / CurrYrLossShareByInvstFund / NetIncomeLoss
     (col 9 = col 7 − col 8). Aggregate rows foot their component rows.
     ===================================================================== */
  if(I.SchedulePTI){
    const PTIcol9=function(n,L){
      L=L||{};
      A(n, REQ(L.NetIncomeLoss, N(L.AmountOfInc)-N(L.CurrYrLossShareByInvstFund)),
        "Schedule PTI: Col. 9 (net income/loss) must equal Col. 7 − Col. 8 (amount of income less current-year loss share).");
    };
    AR(RG(I,"SchedulePTI.SchedulePTIDtls",[])).forEach(function(r){
      r=r||{};
      const cg=RG(r,"CapitalGainsPTI",{})||{};
      const ic=RG(r,"IncClmdPTI",{})||{};
      /* A661 — Col.9 = Col.7 − Col.8 on HP and every capital-gains leaf. */
      PTIcol9(661, r.IncFromHP);
      PTIcol9(661, cg.ShortTermCG);   PTIcol9(661, cg.STCG_Sec111A); PTIcol9(661, cg.STCG_Others);
      PTIcol9(661, cg.LongTermCG);    PTIcol9(661, cg.LTCG_Sec112A); PTIcol9(661, cg.LTCG_Others);
      /* A662 — iia Short term = ai (111A) + aii (others). */
      A(662, REQ(RG(cg,"ShortTermCG.AmountOfInc"), N(RG(cg,"STCG_Sec111A.AmountOfInc"))+N(RG(cg,"STCG_Others.AmountOfInc"))),
        "Schedule PTI: Sl. No. iia (Short term) must equal ai + aii.");
      /* A663 — iib Long term = bi (112A) + bii (others). */
      A(663, REQ(RG(cg,"LongTermCG.AmountOfInc"), N(RG(cg,"LTCG_Sec112A.AmountOfInc"))+N(RG(cg,"LTCG_Others.AmountOfInc"))),
        "Schedule PTI: Sl. No. iib (Long term) must equal bi + bii.");
      /* A664 — iii Other sources = a (dividend) + b (others). */
      A(664, REQ(RG(r,"IncOthSrc.AmountOfInc"), N(RG(r,"OS_Dividend.AmountOfInc"))+N(RG(r,"OS_Others.AmountOfInc"))),
        "Schedule PTI: Sl. No. iii (Other sources) must equal a + b.");
      /* A665 — iv Income claimed to be exempt = a + b + c. */
      A(665, REQ(RG(ic,"TotalSec23FBB.AmountOfInc"), N(RG(ic,"Sec23FBB.AmountOfInc"))
          +N(RG(ic,"SecBIncExmptDtl.SecBCIncExmptDtl.AmountOfInc"))+N(RG(ic,"SecCIncExmptDtl.SecBCIncExmptDtl.AmountOfInc"))),
        "Schedule PTI: Sl. No. iv (Income claimed to be exempt) must equal a + b + c.");
    });
  }

  /* =====================================================================
     Schedule MAT — A666–A676 (book profit u/s 115JB).
     ===================================================================== */
  if(I.ScheduleMAT){
    const M=RG(I,"ScheduleMAT",{})||{};
    const ADD=RG(M,"Additions",{})||{};
    const DED=RG(M,"Deducts",{})||{};
    const A8=RG(M,"AdditionsProfUs115JB",{})||{};   /* 8A (Ind-AS additions)   */
    const B8=RG(M,"DeductionsProfUs115JB",{})||{};  /* 8B (Ind-AS deductions)  */
    const patReg=RG(I,"PARTA_PL.DebitsToPL.TaxProvAppr.ProfitAfterTax");
    const patInd=RG(I,"PARTA_PLIndAS.DebitsToPL.TaxProvAppr.ProfitAfterTax");
    const prov54=RG(I,"PARTA_PL.DebitsToPL.TaxProvAppr.ProvForCurrTax");
    const prov55=RG(I,"PARTA_PL.DebitsToPL.TaxProvAppr.ProvDefTax");

    /* A666 — financial statements NOT per Ind-AS (flag "N") ⇒ 8A & 8B greyed. */
    A(666, M.FinancialStamentFlag!=="N" || (N(A8.TotalAdditions)===0 && N(B8.TotalAdditions)===0),
      "Schedule MAT: when the financial statements are not drawn per Ind-AS (flag 'No'), Sl. No. 8a and 8b cannot be filled.");

    /* A667 — 7 Book profit u/s 115JB = 4 + 5n − 6l. */
    A(667, REQ(M.BookProfUs115JB, N(M.ProfAfterTaxPLAcnt)+N(ADD.TotAdditions)-N(DED.TotDeducts)),
      "Schedule MAT: the value at field (7) must equal Sl. No. (4 + 5n − 6l).");

    /* A668 — 9 Deemed total income u/s 115JB = 7 + 8e − 8j. */
    A(668, REQ(M.DeemedTotalIncUs115JB, N(M.BookProfUs115JB)+N(A8.TotalAdditions)-N(B8.TotalAdditions)),
      "Schedule MAT: Sl. No. 9 (deemed total income u/s 115JB) must equal (7 + 8e − 8j).");

    /* A669 — 5n Total additions = 5a to 5m. */
    A(669, REQ(ADD.TotAdditions, N(ADD.ITPaidInclDefTax)+N(ADD.ResvrNo33AC)+N(ADD.ProvUncertainLiab)
        +N(ADD.ProvLossOfSubsComp)+N(ADD.DividendPaidOrProposed)+N(ADD.ExpendExempIncUs10s)+N(ADD.ExpAopBoi)
        +N(ADD.ExpClauseFb)+N(ADD.NotLossClauseFc)+N(ADD.NotLossUs115bbf)+N(ADD.DepreciatAttribToRevalAsset)
        +N(ADD.GainClauseK)+N(ADD.Others)),
      "Schedule MAT: Sl. No. 5n must equal the sum of Sl. No. 5a to 5m.");

    /* A670 — 6l Total deductions = 6a to 6k. */
    A(670, REQ(DED.TotDeducts, N(DED.AmtWithdrawFromResvrIfCredPL)+N(DED.IncExempIncUs10s)
        +N(DED.AmtWithdrawFromResvrIfCredPLNoAttrib)+N(DED.ShareIncAopBoi)+N(DED.IncClauseiid)
        +N(DED.NotGainClauseiie)+N(DED.LossTrnsClauseiif)+N(DED.LossTrnsClauseiig)+N(DED.UnAbsorbedDepreciat)
        +N(DED.ProSickIndustryOrExcedAccumLos)+N(DED.Others)),
      "Schedule MAT: Sl. No. 6l must equal the sum of Sl. No. 6a to 6k.");

    /* A671 — 5a (income-tax paid/payable incl. deferred tax and provision) equals
       the provision for current tax + deferred tax in the P&L (Sl. 54 + 55). */
    A(671, REQ(ADD.ITPaidInclDefTax, N(prov54)+N(prov55)),
      "Schedule MAT: Sl. No. 5a must equal the provision for current tax (P&L Sl. 54) plus deferred tax (P&L Sl. 55).");

    /* A672 — 8Ae Total additions = 8Aa to 8Ad. */
    A(672, REQ(A8.TotalAdditions, N(A8.AmountsCredited)+N(A8.AmountsDebited)+N(A8.OneFifthTransitionAmt)+N(A8.OthersInclResidualAdjust)),
      "Schedule MAT: Sl. No. 8A.e must equal the sum of Sl. No. 8Aa to 8Ad.");

    /* A673 — 8Bj Total deductions = 8f to 8i. */
    A(673, REQ(B8.TotalAdditions, N(B8.AmountsCredited)+N(B8.AmountsDebited)+N(B8.OneFifthTransitionAmt)+N(B8.OthersInclResidualAdjust)),
      "Schedule MAT: Sl. No. 8B.j must equal the sum of Sl. No. 8f to 8i.");

    /* A674 — opting section 115BAA/115BAB ⇒ not liable to compute MAT. */
    A(674, !optBAABAB || (N(M.DeemedTotalIncUs115JB)===0 && N(M.TaxPayableUs115JB)===0),
      "Schedule MAT: an assessee opting for the tax regime under section 115BAA or 115BAB is not liable to compute MAT.");

    /* A675 — 9b = 9 − 9a. */
    A(675, REQ(M.DeemedTotalIncUs115JBOther, N(M.DeemedTotalIncUs115JB)-N(M.DeemedTotalIncUs115JBIFSC)),
      "Schedule MAT: Sl. No. 9b must equal Sl. No. (9 − 9a).");

    /* A676 — 4 Profit after tax = Sl. 56 of Part A-P&L (regular or Ind-AS). */
    A(676, REQ(M.ProfAfterTaxPLAcnt, patReg) || REQ(M.ProfAfterTaxPLAcnt, patInd),
      "Schedule MAT: Sl. No. 4 (profit after tax) must equal Sl. No. 56 of Part A-P&L / Part A-P&L-Ind AS.");
  }

  /* =====================================================================
     Schedule MATC — A677–A686 (tax credit u/s 115JAA / applicability).
     ===================================================================== */
  if(I.ScheduleMATC){
    const MC=RG(I,"ScheduleMATC",{})||{};
    const rows=AR(RG(MC,"UtilMATCredAvl",[]));
    const tti1d=RG(I,"PartB_TTI.ComputationOfTaxLiability.TaxPayableOnDeemedTI.TotalTax");
    const tti2f=RG(I,"PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.GrossTaxLiability");
    const sumB=k=>rows.reduce((a,r)=>a+N((r||{})[k]),0);

    /* A677 — 1 Tax u/s 115JB (A.Y. 2026-27) = 1d of Part B-TTI. */
    A(677, REQ(MC.TaxUs115JBCurrAssYr, tti1d),
      "Schedule MATC: Sl. No. 1 (tax u/s 115JB) must equal Sl. No. 1d of Part B-TTI.");
    /* A678 — 2 Tax under other provisions = 2f of Part B-TTI. */
    A(678, REQ(MC.TaxOthProvCurrAssYr, tti2f),
      "Schedule MATC: Sl. No. 2 must equal Sl. No. 2f of Part B-TTI.");
    /* A679 — 3 = 2 − 1 (only when 2 > 1). */
    A(679, !(N(MC.TaxOthProvCurrAssYr)>N(MC.TaxUs115JBCurrAssYr)) ||
        REQ(MC.AmtOfTaxWithCred, N(MC.TaxOthProvCurrAssYr)-N(MC.TaxUs115JBCurrAssYr)),
      "Schedule MATC: Sl. No. 3 must equal Sl. No. (2 − 1) when 2 is greater than 1.");
    /* A680 — 3 = 0 when 2 ≤ 1. */
    A(680, !(N(MC.TaxOthProvCurrAssYr)<=N(MC.TaxUs115JBCurrAssYr)) || N(MC.AmtOfTaxWithCred)===0,
      "Schedule MATC: Sl. No. 3 must be zero when Sl. No. 2 is less than or equal to Sl. No. 1.");
    /* A681 — 5 Tax credit u/s 115JAA utilised = total of 4c (TotMatCredUtilCurrYr). */
    A(681, REQ(MC.AmtTaxCredUs115JAA, MC.TotMatCredUtilCurrYr),
      "Schedule MATC: Sl. No. 5 (tax credit u/s 115JAA utilised during the year) must equal the total of item 4c(xvii).");
    /* A682 — 6 MAT liability available for credit in subsequent years = total 4D (TotBalMATCredCF). */
    A(682, REQ(MC.AmtMATLiabAllAssYrAvailSubseqYr, MC.TotBalMATCredCF),
      "Schedule MATC: Sl. No. 6 (MAT liability available for credit in subsequent years) must equal the total of item 4D(xviii).");
    /* A683 — opting 115BAA/115BAB ⇒ MATC not to be filled. */
    A(683, !optBAABAB || (N(MC.TotMatCredGross)===0 && N(MC.AmtOfTaxWithCred)===0 && N(MC.TotMatCredUtilCurrYr)===0),
      "Schedule MATC: when opting for the tax regime under section 115BAA or 115BAB, Schedule MATC cannot be filled.");
    /* A684 — column totals must equal the sum of the individual rows
       (current-AY gross/carry-forward add to their column totals). */
    A(684, REQ(MC.TotMatCredGross, sumB("MATCredGross")+N(MC.MATCredGrossCurAY)),
      "Schedule MATC: the total MAT credit gross must equal the sum of the individual rows.");
    A(684, REQ(MC.TotMatCredSetOff, sumB("MATCredSetOff")),
      "Schedule MATC: the total MAT credit set off must equal the sum of the individual rows.");
    A(684, REQ(MC.TotMatCredBF, sumB("MATCredBF")),
      "Schedule MATC: the total MAT credit brought forward must equal the sum of the individual rows.");
    A(684, REQ(MC.TotMatCredUtilCurrYr, sumB("MATCredUtilCurrYr")),
      "Schedule MATC: the total MAT credit utilised in the current year must equal the sum of the individual rows.");
    A(684, REQ(MC.TotBalMATCredCF, sumB("BalMATCredCF")+N(MC.BalMATCredCFCurAY)),
      "Schedule MATC: the total balance MAT credit carried forward must equal the sum of the individual rows.");
  }

  /* A685 — a domestic company (not opting 115BAA/115BAB) with book profit
     must fill Schedule MAT/MATC. */
  A(685, OF.DomesticCompFlg!=="Y" || optBAABAB ||
      !(N(RG(I,"PARTA_PL.DebitsToPL.TaxProvAppr.ProfitAfterTax"))>0 || N(RG(I,"PARTA_PLIndAS.DebitsToPL.TaxProvAppr.ProfitAfterTax"))>0) ||
      !!I.ScheduleMAT,
    "Part A General / Schedule MAT: a domestic company is required to fill Schedule MAT/MATC.");

  /* A686 — a foreign company may fill Schedule MAT/MATC only where it has a
     PE in India or is required to seek registration relating to companies. */
  if(I.ScheduleMAT){
    A(686, OF.DomesticCompFlg!=="N" || FS.NRI_PE==="Y" || FS.RegistratedLaw==="Y",
      "Schedule MAT/MATC is applicable to a foreign company only when there is a Permanent Establishment (PE) in India, or the assessee is required to seek registration under any law relating to companies.");
  }

  /* =====================================================================
     Schedule TPSA — A687–A693 (secondary adjustment u/s 92CE / additional tax).
     ===================================================================== */
  if(I.ScheduleTPSA){
    const P=RG(I,"ScheduleTPSA",{})||{};
    const dep=AR(RG(P,"DtlsTaxesPaid",[])).reduce((a,r)=>a+N((r||{}).Amount),0);
    /* A687 — additional income-tax = 18% of the primary adjustment. */
    A(687, REQ(P.AdditionalIncTax18PercAbove, 0.18*N(P.AmtPrimaryAdjUs92CE_2A)),
      "Schedule TPSA: the income-tax payable must be 18% of the amount of primary adjustment.");
    /* A688 — surcharge = 12% of the additional income-tax. */
    A(688, REQ(P.Surcharge12Perc, 0.12*N(P.AdditionalIncTax18PercAbove)),
      "Schedule TPSA: the surcharge must be 12% of the additional income-tax payable.");
    /* A689 — health & education cess = 4% of (additional income-tax + surcharge). */
    A(689, REQ(P.HealthEducationCess, 0.04*(N(P.AdditionalIncTax18PercAbove)+N(P.Surcharge12Perc))),
      "Schedule TPSA: the health & education cess must be 4% of the additional income-tax payable plus surcharge.");
    /* A690 — total additional tax = additional income-tax + surcharge + cess. */
    A(690, REQ(P.TotalAdditionalTax, N(P.AdditionalIncTax18PercAbove)+N(P.Surcharge12Perc)+N(P.HealthEducationCess)),
      "Schedule TPSA: the total additional tax payable must be the sum of additional income-tax, surcharge and health & education cess.");
    /* A691 — taxes paid = sum of amounts deposited. */
    A(691, REQ(P.TaxesPaid, dep),
      "Schedule TPSA: the amount of taxes paid must equal the sum of the amounts deposited.");
    /* A692 — net tax payable = total additional tax − taxes paid. */
    A(692, REQ(P.NetTaxPayable, N(P.TotalAdditionalTax)-N(P.TaxesPaid)),
      "Schedule TPSA: the net tax payable must equal the total additional tax payable less the taxes paid.");
  }

  /* A693 — impermissible avoidance arrangement (Part A-OI, s.96) = Yes ⇒
     Schedule TPSA cannot be blank. */
  A(693, RG(OI,"ScheduleTPSAFlg")!=="Y" || (!!I.ScheduleTPSA && N(RG(I,"ScheduleTPSA.AmtPrimaryAdjUs92CE_2A"))>0),
    "Schedule TPSA: when the assessee has entered into an impermissible avoidance arrangement referred to in section 96 (Part A-OI), Schedule TPSA cannot be blank.");

  /* =====================================================================
     Schedule 115TD — A695–A700 (accreted income on cessation).
     ===================================================================== */
  if(I.Schedule115TD){
    const T=RG(I,"Schedule115TD",{})||{};
    /* A695 — 3 Net value of assets = 1 − 2u. */
    A(695, REQ(T.NetValAsst, N(T.FMVTotTrustInst)-N(T.LessTotLiaTrustInst)),
      "Schedule 115TD: the value at field 3 (net value of assets) must equal Sl. No. 1 − Sl. No. 2u.");
    /* A696 — 4(iv) Total = 4i + 4ii + 4iii. */
    A(696, REQ(T.FMVTotal, N(T.FMVAsstAcqrdRfrdSec101)+N(T.FMVAsstAcqPeriodFromDateCrtn)+N(T.FMVAsstTrnfsrdSec115TD2)),
      "Schedule 115TD: the value at field 4(iv) (Total) must equal the sum of Sl. No. 4i + 4ii + 4iii.");
    /* A697 — 6 Accreted income = 3 − (4 − 5). */
    A(697, REQ(T.AccretedIncomeSection115TD, N(T.NetValAsst)-(N(T.FMVTotal)-N(T.LiabilityRespectofAsset4Above))),
      "Schedule 115TD: the value at field 6 (accreted income as per section 115TD) must equal [3 − (4 − 5)].");
    /* A698 — 12 Net payable/refundable = 10 − 11. */
    A(698, REQ(T.NetPaybleRefble, N(T.AddIncIntstPayb)-N(T.TaxIntstPaid)),
      "Schedule 115TD: the value at field 12 (net payable/refundable) must equal [10 − 11].");
    /* A699 — accreted income entered ⇒ specified date u/s 115TD (Sl.9) mandatory. */
    A(699, N(T.AccretedIncomeSection115TD)<=0 || S0(T.SpecifiedDateUs115TD),
      "Schedule 115TD: when accreted income u/s 115TD is entered, the specified date u/s 115TD (Sl. No. 9) cannot be blank.");
    /* A700 — accreted income entered ⇒ additional income-tax must be computed. */
    A(700, N(T.AccretedIncomeSection115TD)<=0 || N(T.AddIncPay115TDMarginalRate)>0,
      "Schedule 115TD: income (accreted income) is entered in the return but the additional income-tax on it has not been computed.");
  }

  /* =====================================================================
     Schedule FSI — A701–A707 (income from outside India and tax relief).
     Per country row: heads IncFromHP / IncFromBusiness / IncCapGain /
     IncOthSrc, each a ScheduleFSIIncType (b=IncFrmOutsideInd, c=Tax paid
     outside, d=Tax payable in India, e=Tax relief).
     ===================================================================== */
  if(I.ScheduleFSI){
    const rows=AR(RG(I,"ScheduleFSI.ScheduleFSIDtls",[]));
    /* A702 — Schedule FSI is not applicable to non-residents. */
    A(702, FS.ResidentialStatus!=="NRI",
      "Schedule FSI: Schedule FSI is not applicable for non-residents.");

    let fsiHP=0,relHP=0, fsiBus=0,relBus=0, fsiCG=0,relCG=0, fsiOS=0,relOS=0;
    rows.forEach(function(r){
      r=r||{};
      const heads=[["IncFromHP",RG(r,"IncFromHP",{})],["IncFromBusiness",RG(r,"IncFromBusiness",{})],
                   ["IncCapGain",RG(r,"IncCapGain",{})],["IncOthSrc",RG(r,"IncOthSrc",{})]];
      /* A701 — Col.e (tax relief) = lower of Col.c (tax paid outside) and Col.d (tax payable in India). */
      heads.forEach(function(h){
        const x=h[1]||{};
        A(701, REQ(x.TaxReliefinInd, Math.min(N(x.TaxPaidOutsideInd),N(x.TaxPayableinInd))),
          "Schedule FSI: the tax relief available (Column e) must be the lower of tax paid outside India (Column c) and tax payable on such income in India (Column d).");
      });
      /* A703 — country total = sum of the four heads (i + ii + iii + iv), each column. */
      const tot=RG(r,"TotalCountryWise",{})||{};
      const s=k=>heads.reduce((a,h)=>a+N((h[1]||{})[k]),0);
      A(703, REQ(tot.IncFrmOutsideInd,s("IncFrmOutsideInd")) && REQ(tot.TaxPaidOutsideInd,s("TaxPaidOutsideInd"))
          && REQ(tot.TaxPayableinInd,s("TaxPayableinInd")) && REQ(tot.TaxReliefinInd,s("TaxReliefinInd")),
        "Schedule FSI: the country Total must equal the sum of Sl. No. (i + ii + iii + iv).");
      fsiHP +=N(RG(r,"IncFromHP.IncFrmOutsideInd"));       relHP +=N(RG(r,"IncFromHP.TaxReliefinInd"));
      fsiBus+=N(RG(r,"IncFromBusiness.IncFrmOutsideInd"));  relBus+=N(RG(r,"IncFromBusiness.TaxReliefinInd"));
      fsiCG +=N(RG(r,"IncCapGain.IncFrmOutsideInd"));       relCG +=N(RG(r,"IncCapGain.TaxReliefinInd"));
      fsiOS +=N(RG(r,"IncOthSrc.IncFrmOutsideInd"));        relOS +=N(RG(r,"IncOthSrc.TaxReliefinInd"));
    });

    /* A704 — relief claimed against House Property ⇒ HP income in the return
       (Schedule HP total, Sl. 1k+2) not less than FSI House-property income. */
    A(704, relHP<=0 || N(RG(I,"ScheduleHP.TotalIncomeChargeableUnHP"))>=fsiHP-1,
      "Schedule FSI: where tax relief is claimed against House Property, the House-property income in the return (Sl. 1k + 2) must not be less than the House-property income shown in Schedule FSI.");
    /* A705 — relief claimed against Business/Profession ⇒ business income in the
       return (Trading Sl. D + positive P&L Sl. 14) not less than FSI business income. */
    A(705, relBus<=0 ||
        (N(RG(I,"TradingAccount.GrossProfitFrmBusProf"))+Math.max(0,N(RG(I,"PARTA_PL.CreditsToPL.OthIncome.TotOthIncome"))))>=fsiBus-1,
      "Schedule FSI: where tax relief is claimed against Business or Profession, the business income in the return (Trading Account Sl. D + positive P&L Sl. 14) must not be less than the business income shown in Schedule FSI.");
    /* A706 — relief claimed against Capital Gains ⇒ capital-gains income in the
       return not less than FSI capital-gains income. */
    A(706, relCG<=0 || N(RG(I,"ScheduleCG.IncChargeableHeadCapGain"))>=fsiCG-1,
      "Schedule FSI: where tax relief is claimed against Capital Gains, the capital-gains income in the return must not be less than the capital-gains income shown in Schedule FSI.");
    /* A707 — relief claimed against Other Sources ⇒ other-sources income in the
       return not less than FSI other-sources income. */
    A(707, relOS<=0 || N(RG(I,"ScheduleOS.IncChargeableFrmOthSrc"))>=fsiOS-1,
      "Schedule FSI: where tax relief is claimed against Other Sources, the other-sources income in the return must not be less than the other-sources income shown in Schedule FSI.");
  }

  /* =====================================================================
     Schedule TR — A708–A709 (summary of tax relief claimed outside India).
     ScheduleTR1.ScheduleTR[] rows: ReliefClaimedUsSection (90/90A/91),
     TaxReliefOutsideIndia (column d).
     ===================================================================== */
  if(I.ScheduleTR1){
    const TR=RG(I,"ScheduleTR1",{})||{};
    const trRows=AR(RG(TR,"ScheduleTR",[]));
    let dtaa=0, notDtaa=0;
    trRows.forEach(function(r){
      r=r||{}; const sec=String(r.ReliefClaimedUsSection||"");
      if(sec==="90"||sec==="90A") dtaa+=N(r.TaxReliefOutsideIndia);
      else if(sec==="91")         notDtaa+=N(r.TaxReliefOutsideIndia);
    });
    /* A708 — Sl.2 Total relief where DTAA applies (s.90/90A) = Σ column d for 90/90A rows. */
    A(708, REQ(TR.TaxReliefOutsideIndiaDTAA, dtaa),
      "Schedule TR: Sl. No. 2 (total tax relief where DTAA under section 90/90A is applicable) must equal the total of column d for rows where section 90/90A is selected.");
    /* A709 — Sl.3 Total relief where DTAA does not apply (s.91) = Σ column d for 91 rows. */
    A(709, REQ(TR.TaxReliefOutsideIndiaNotDTAA, notDtaa),
      "Schedule TR: Sl. No. 3 (total tax relief where DTAA is not applicable) must equal the total of column d for rows where section 91 is selected.");
  }
});
