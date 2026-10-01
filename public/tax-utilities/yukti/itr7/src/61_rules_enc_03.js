/* =====================================================================
   ITR-7 · A.Y. 2026-27 — Category-A validation rules, batch enc_03 (Phase 6).
   Serial range A109–A158 (all 50 ENFORCED per books/ITR-7/rule_census.md;
   no NA/OFFLINE in the band). Registered via ruleset(fn); runRules() invokes
   it with (I,S_,A,Dd). A(n,cond,msg) fires (pushes a Category-A block) when
   cond — the "this return is lawful" assertion — is FALSE. Every read is
   guarded (RG / (X||{}) / N()); nothing throws. Keys are the built-return
   ITR7 schema paths (I = Object.values(buildReturn().ITR)[0]); the paths and
   the enum codes were taken from sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json
   and the owning section writers 70_sec_funds.js (PARTA_BS / ITRScheduleJ /
   ITRScheduleR), 70_sec_bodies.js (SchedulePP / ScheduleET), 70_sec_vc.js
   (ScheduleVC / ScheduleAI), 70_sec_app.js (ScheduleA) and 70_sec_tax.js
   (PartB_TI2). Encoded from each rule's own RE-JOINED text (the rules.json
   line-wrap offsets each serial by ~one physical line; constitution rule 6).

   Schema blocks covered: PARTA_BS (A109–A110), ITRScheduleR (A111–A119),
   SchedulePP (A120–A127, A138–A139), ScheduleET (A128–A137), ScheduleAI
   (A140–A142), ScheduleA (A143–A154), ScheduleVC (A155–A158).

   Cross-schedule serials read a second block guarded (A135 → PartB_TI2,
   A138 → ScheduleVC, A130 → ScheduleVC, A149 → ScheduleAI); each schedule-
   scoped band enters only under if(I.ScheduleXxx){...} so it is silent when
   the block is absent. The three "value allowed only if the exemption is X"
   presence gates that must hold even when the block is absent (A120/A127 for
   Schedule PP, A137 for Schedule ET) sit OUTSIDE their block guards and read
   only the exemption section.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" */
  const inList=(v,a)=>a.indexOf(v)>=0;
  const tot=o=>N((o||{}).Total);                         /* Revenue/Capital/Total triple → Total */
  const rr=n=>Math.round(N(n));
  /* Section 11 or 10(23C)(iv)/(v)/(vi)/(via) — the "exemption claimed" set that
     gates Schedule R / AI / A entry (books/ITR-7 filing-status enum codes). */
  const EX_11_23C=["11","23CIV","23CV","23CVI","23CVIA"];

  /* ---- exemption section claimed (Part A-General) ---- */
  const G1  = RG(I,"PartA_GEN1",{})||{};
  const OI  = RG(G1,"OrgFirmInfo",{})||{};
  const exsec = String(OI.SecExemptionClaimed==null?"":OI.SecExemptionClaimed);

  /* =================================================================
     PART A-BS — balance-sheet fund-accounting identity (A109–A110).
     Always filed; silent on the zero skeleton. ================================ */
  const BS   = RG(I,"PARTA_BS",{})||{};
  const SRC  = RG(BS,"SourcesOfFund",{})||{};
  const OWN  = RG(SRC,"OwnFund",{})||{};
  const APPF = RG(BS,"ApplicationOfFunds",{})||{};
  const FXA  = RG(APPF,"FixedAsset",{})||{};
  const CLA  = RG(APPF,"CurrentAssetsLoanAdv",{})||{};

  /* A109 — Part A-BS B5 (total application of funds) = B(1+2+3e+4). */
  A(109, N(APPF.TotalApplicationOfFunds)===
      N(FXA.NetBlock)+N(APPF.Investements)+N(CLA.NetCurrAssets)+N(APPF.AccBalAnyOthRes),
    "Part A-BS: total application of funds (B5) must equal net fixed assets (1) + investments (2) + net current assets (3e) + accumulated balance (4).");
  /* A110 — Part A-BS B5 (total application of funds) = A (sources of funds). */
  A(110, N(APPF.TotalApplicationOfFunds)===N(SRC.TotSourceFund),
    "Part A-BS: total application of funds (B5) must equal the total sources of funds (A).");

  /* =================================================================
     SCHEDULE R — reconciliation of the corpus (A111–A119). ==================== */
  if(I.ITRScheduleR){
    const R7   = I.ITRScheduleR||{};
    const rA   = RG(R7,"ClosngBalSchJ",{})||{};
    const rC   = RG(R7,"ClosngBalBalSheet",{})||{};
    const rB   = RG(R7,"ReasonsOfDiff.TotalReasonsOfDiff",{})||{};
    const rBi  = RG(R7,"ReasonsOfDiff.PurchFixedAsset",{})||{};
    const rBii = RG(R7,"ReasonsOfDiff.Depreciation",{})||{};
    const rBiii= RG(R7,"ReasonsOfDiff.AnyOthReason",{})||{};
    const COLS = ["CorpOutOf80G2b","OthCorpReceived","CorpOthThan"];
    /* Schedule J A1 closing corpus (col 7) aggregated by corpus type (i/ii/iii). */
    const jA1  = RG(I,"ITRScheduleJ.ScheduleJ_A1.ScheduleJ_A1Dtls",[])||[];
    const jClose = code =>
      jA1.reduce((s,r)=>s+((r&&String(r.CorpusDonation)===code)?N(r.ClosingBlc):0),0);

    /* A111/112/113 — Schedule R line 1A/2A/3A = aggregate of Sch J A1 Sl. 7(i/ii/iii). */
    A(111, N(rA.CorpOutOf80G2b)===jClose("80G2B"),
      "Schedule R: Sl. No. 1A must equal the aggregate of Sl. No. 7(i) of A1 of Schedule J (80G(2)(b) corpus closing balance).");
    A(112, N(rA.OthCorpReceived)===jClose("OTIA"),
      "Schedule R: Sl. No. 2A must equal the aggregate of Sl. No. 7(ii) of A1 of Schedule J (other corpus received closing balance).");
    A(113, N(rA.CorpOthThan)===jClose("OTHER"),
      "Schedule R: Sl. No. 3A must equal the aggregate of Sl. No. 7(iii) of A1 of Schedule J (other-than-corpus closing balance).");
    /* A114/115/116 — Schedule R line 1C/2C/3C = Part A-BS Sl. A(1)(a/b/c). */
    A(114, N(rC.CorpOutOf80G2b)===N(OWN.Corpus80G),
      "Schedule R: Sl. No. 1C (closing balance per balance sheet) must equal Sl. No. A(1)(a) of Part A-BS.");
    A(115, N(rC.OthCorpReceived)===N(OWN.OtherCorpus),
      "Schedule R: Sl. No. 2C (closing balance per balance sheet) must equal Sl. No. A(1)(b) of Part A-BS.");
    A(116, N(rC.CorpOthThan)===N(OWN.AccumulatedInc),
      "Schedule R: Sl. No. 3C (closing balance per balance sheet) must equal Sl. No. A(1)(c) of Part A-BS.");
    /* A117 — Schedule R Sl. C (closing per balance sheet) = A + B, each corpus column. */
    A(117, COLS.every(c=>N(rC[c])===N(rA[c])+N(rB[c])),
      "Schedule R: the closing balance per balance sheet (C) must equal the sum of Sl. No. A and Sl. No. B for each corpus column.");
    /* A118 — Schedule R Sl. B (reasons of difference) = Bi + Bii + Biii, each column. */
    A(118, COLS.every(c=>N(rB[c])===N(rBi[c])+N(rBii[c])+N(rBiii[c])),
      "Schedule R: the reasons of difference (B) must equal the sum of Bi + Bii + Biii for each corpus column.");
    /* A119 — Schedule R entry allowed only if exemption is 11 or 10(23C)(iv)/(v)/(vi)/(via). */
    A(119, inList(exsec,EX_11_23C),
      "Schedule R can be filled only when Section 11 or Section 10(23C)(iv)/(v)/(vi)/(via) is the exemption claimed under filing status.");
  }

  /* =================================================================
     SCHEDULE PP — political party u/s 13A (A120–A127, A138–A139). ============== */
  /* A120 / A127 — exemption 13A ⇒ Schedule PP must be filled (presence gate; must
     hold even when the block is absent, so kept OUTSIDE the block guard). */
  A(120, exsec!=="13A" || !!I.SchedulePP,
    "Part A-General: Section 13A is selected as the exemption claimed but Schedule PP is not filled.");
  A(127, exsec!=="13A" || !!I.SchedulePP,
    "Part A-General: when Section 13A is the exemption claimed, Schedule PP must be filled.");
  if(I.SchedulePP){
    const PP = I.SchedulePP||{};
    const au = RG(PP,"AuditDetailsSchPP",{})||{};
    /* A121 / A126 — Schedule PP may be filled only by a political party u/s 13A. */
    A(121, exsec==="13A",
      "Schedule PP can be filled only by a political party claiming exemption u/s 13A.");
    A(126, exsec==="13A",
      "Schedule PP entry is allowed only when Section 13A is the exemption claimed under filing status.");
    /* A122 — PP audit-report furnishing date (3a) and audit-report date (3g) not
       before the end of the previous year (31-03-2026). */
    A(122, (!S0(au.DateOfAudit)||au.DateOfAudit>="2026-03-31") &&
           (!S0(au.AuditDate)||au.AuditDate>="2026-03-31"),
      "Schedule PP: the date of furnishing the audit report (3a) and the date of the audit report (3g) cannot be before the end of the previous year.");
    /* A123 — accounts audited ⇒ auditor & audit-report particulars furnished. */
    A(123, PP.AccountsAudited!=="Y" || (S0(au.AuditorName) && S0(au.AuditDate)),
      "Schedule PP: the accounts are flagged as audited, so the auditor name and the audit-report particulars must be furnished.");
    /* A124 — PP Sl. 7a total voluntary contributions (b+d) = 7b + 7d. */
    A(124, N(PP.TotVCReceived)===N(PP.AggregateVCUpto20000)+N(PP.AggregateVCMoreThan20000),
      "Schedule PP: Sl. No. 7a (total voluntary contributions received, b + d) must equal Sl. No. 7b + 7d.");
    /* A125 — recognized by the Election Commission (1B = Yes) ⇒ date of recognition. */
    A(125, PP.RecognizedByECI!=="Y" || S0(PP.DateOfRecognition),
      "Schedule PP: Sl. No. 1(B) recognition by the Election Commission is Yes but the date of recognition is not provided.");
    /* A138 — PP Sl. 7a = Sl. C of Schedule VC (total contributions Aiii + Biii). */
    A(138, !I.ScheduleVC || N(PP.TotVCReceived)===N(RG(I,"ScheduleVC.TotalContribution",0)),
      "Schedule PP: Sl. No. 7a (total voluntary contributions) must equal Sl. No. C of Schedule VC (total contributions Aiii + Biii).");
    /* A139 — report u/s 29C(3) furnished (Sl. 4 = Yes) ⇒ Sl. 4a & 4b mandatory. */
    A(139, PP.ReportUs29!=="Y" || (S0(PP.SubmissionDate) && S0(PP.Electioncommissionlist)),
      "Schedule PP: the report u/s 29C(3) is furnished, so the date of submission (4a) and the Election Commission to whom it was submitted (4b) are mandatory.");
  }

  /* =================================================================
     SCHEDULE ET — electoral trust u/s 13B (A128–A137). ======================== */
  /* A137 — exemption 13B ⇒ Schedule ET must be filled (presence gate, outside guard). */
  A(137, exsec!=="13B" || !!I.ScheduleET,
    "Part A-General: when Section 13B is the exemption claimed, Schedule ET must be filled.");
  if(I.ScheduleET){
    const ET  = I.ScheduleET||{};
    const vcd = RG(ET,"VoluntaryContributionDtls",{})||{};
    /* A128 / A136 — Schedule ET may be filled only by an electoral trust u/s 13B. */
    A(128, exsec==="13B",
      "Schedule ET can be filled only by an electoral trust claiming exemption u/s 13B.");
    A(136, exsec==="13B",
      "Schedule ET entry is allowed only when Section 13B is the exemption claimed under filing status.");
    /* A129 — ET date of audit (Sl. 4b) not prior to 01-04-2026. */
    A(129, !S0(ET.AuditReportDate) || ET.AuditReportDate>="2026-04-01",
      "Schedule ET: the date of the audit report cannot be prior to 01-04-2026.");
    /* A130 — exemption 13B ⇒ ET Sl. 6ii (VC during the year) = Sl. C of Schedule VC. */
    A(130, exsec!=="13B" ||
        N(vcd.VoluntaryContributionDuringYr)===N(RG(I,"ScheduleVC.TotalContribution",0)),
      "Schedule ET: with Section 13B claimed, the voluntary contributions at Sl. No. 6ii must equal Sl. No. C of Schedule VC.");
    /* A131 — ET Sl. 6iii = 6i + 6ii. */
    A(131, N(vcd.TotalAfterVoluntaryContribution)===N(vcd.OpeningBalance)+N(vcd.VoluntaryContributionDuringYr),
      "Schedule ET: Sl. No. 6iii (total) must equal the sum of Sl. No. 6i + 6ii.");
    /* A132 — ET Sl. 6vi = 6iv + 6v. */
    A(132, N(vcd.Total)===N(vcd.AmtDistToPoliticalParties)+N(vcd.AmtSpentOnManagingAffairs),
      "Schedule ET: Sl. No. 6vi (total) must equal the sum of Sl. No. 6iv + 6v.");
    /* A133 — ET total eligible for exemption u/s 13B (6vii) must not exceed 6ii. */
    A(133, N(vcd.TotAmtExeUndSec13B)<=N(vcd.VoluntaryContributionDuringYr),
      "Schedule ET: the total amount eligible for exemption u/s 13B must not exceed Sl. No. 6ii.");
    /* A134 — ET Sl. 6viii = 6iii − 6vi. */
    A(134, N(vcd.ClosingBalance)===N(vcd.TotalAfterVoluntaryContribution)-N(vcd.Total),
      "Schedule ET: Sl. No. 6viii (closing balance) must equal the difference of Sl. No. 6iii − 6vi.");
    /* A135 — Part B-TI (Part B2) Sl. 5 income exempt u/s 13B = ET Sl. 6vii. */
    A(135, N(RG(I,"PartB_TI2.ExemptionUs13_B",0))===N(vcd.TotAmtExeUndSec13B),
      "Part B-TI (Part B2): the income claimed exempt u/s 13B (Sl. No. 5) must equal Sl. No. 6vii of Schedule ET.");
  }

  /* =================================================================
     SCHEDULE AI — aggregate of income excl. voluntary contributions (A140–A142). */
  if(I.ScheduleAI){
    const AI  = I.ScheduleAI||{};
    const oth = RG(AI,"OthersInc.OthersIncDtls",[])||[];
    const othSum = oth.reduce((s,r)=>s+N(r&&r.OthAmount),0);
    /* A140 — AI point 9 total = Σ(9 rows) + pass-through income. */
    A(140, N(AI.TotalofOtherIncomes)===othSum+N(AI.PassThroughIncome),
      "Schedule AI: the Total of point 9 (any other income) must equal the sum of the 9-sub-rows together with the pass-through income.");
    /* A141 — AI point 10 total = 1+2+3+4+5+6+8 + total of point 9 (line 7 excluded). */
    A(141, N(AI.TotalofAggregateIncomes)===
        N(AI.RecptMainObj)+N(AI.RecptsIncidentalObj)+N(AI.Rent)+N(AI.Commission)+
        N(AI.DividendIncome)+N(AI.InterestIncome)+N(AI.NetConsdrnTrnsfrCapAsst)+N(AI.TotalofOtherIncomes),
      "Schedule AI: the Total of point 10 must equal the sum of (1+2+3+4+5+6+8) plus the Total of point 9.");
    /* A142 — Schedule AI entry allowed only if exemption is 11 or 10(23C)(iv)/(v)/(vi)/(via). */
    A(142, inList(exsec,EX_11_23C),
      "Schedule AI can be filled only when Section 11 or Section 10(23C)(iv)/(v)/(vi)/(via) is the exemption claimed under filing status.");
  }

  /* =================================================================
     SCHEDULE A — amount applied to the stated objects (A143–A154). ============ */
  if(I.ScheduleA){
    const SA = I.ScheduleA||{};
    const AT = RG(SA,"AppTowExpTrstInst",{})||{};
    const EX = RG(SA,"ExpNotAllowedApplication",{})||{};
    const SR = RG(SA,"SrcRevCapApplctn",{})||{};
    /* C2..C7 (named sources, excludes the "Any other" C8) — subtracted in D. */
    const c27 = tot(SR.IncDerFrmPrprty)+tot(SR.IncAccumulatedEarlierYr)+tot(SR.IncDeemdPrcdngYr)+
                tot(SR.EarlierYrIncUpto15Per)+tot(SR.Corpus)+tot(SR.BorrowedFund);
    const othC = tot(RG(SR,"OthersInc.TotOthersInc",{})||{});

    /* A143 — Schedule A A12 (Total A1a to A11) = Σ(A1a + A2 … A11). */
    A(143, tot(AT.TotalA1toA11)===
        tot(AT.OtherThanCorpus85)+tot(AT.Religious)+tot(AT.ReliefOfPoor)+tot(AT.Educational)+
        tot(AT.Yoga)+tot(AT.MedicalRelief)+tot(AT.PreservationOfEnvrmnt)+tot(AT.PreservationOfMonumentsEtc)+
        tot(AT.GeneralPublicUtility)+tot(AT.AppCantBeSpecIdentAbov)+tot(AT.CostNewAssetUs11_1A),
      "Schedule A: the Total at point 12 (A1a to A11) must equal the sum of A1a + A2 + A3 + A4 + A5 + A6 + A7 + A8 + A9 + A10 + A11.");
    /* A144 — Schedule A B (Total B1 to B8) = Σ(B1 … B8). */
    A(144, tot(EX.TotExpNotAllowedApplication)===
        tot(EX.DonFormingPartCorpusFund)+tot(EX.DonationTowardsOtherThanCorpus)+tot(EX.DonationNotSameObject)+
        tot(EX.DonationOtherThanTrust)+tot(EX.ApplctnOutIndiaApprvlObtnd)+tot(EX.ApplctnOutIndiaApprvlNotObtnd)+
        tot(EX.AppliedBeyondObject)+tot(EX.AnyOthrDisallowableExpenditure),
      "Schedule A: the Total at point B (B1 to B8) must equal the sum of B1 + B2 + B3 + B4 + B5 + B6 + B7 + B8.");
    /* A145 — Schedule A C (source of fund) = Σ(C2 … C7 + Any other). */
    A(145, tot(SR.TotSrcRevCapApplctn)===c27+othC,
      "Schedule A: the Total source of fund at point C must equal the sum of C2 to C7 together with the Any-other source.");
    /* A146 — Schedule A D = A12 − B − (C2..C7). */
    A(146, tot(SA.TotAmtAppDrngPrevYr)===tot(AT.TotalA1toA11)-tot(EX.TotExpNotAllowedApplication)-c27,
      "Schedule A: the Total amount applied at point D must equal [A12 − B − C2 − C3 − C4 − C5 − C6 − C7].");
    /* A147 — Schedule A G (amount allowed as application) = D − E + F. */
    A(147, tot(SA.TotAmountAllowedApplication)===
        tot(SA.TotAmtAppDrngPrevYr)-tot(SA.AmountNotPaidPY)+tot(SA.AmountPaidPY),
      "Schedule A: the Total amount to be allowed as application must equal G = D − E + F.");
    /* A148 — Schedule A B must not be greater than A. */
    A(148, tot(EX.TotExpNotAllowedApplication)<=tot(AT.TotalA1toA11),
      "Schedule A: the expenditure not allowed as application (B) cannot be greater than the application towards the stated objects (A).");
    /* A149 — Schedule A A11 restricted to the net consideration at Sl. 8 of Schedule AI. */
    A(149, tot(AT.CostNewAssetUs11_1A)<=N(RG(I,"ScheduleAI.NetConsdrnTrnsfrCapAsst",0)),
      "Schedule A: the cost of a new asset for exemption u/s 11(1A) (A11) is restricted to the net consideration entered at Sl. No. 8 of Schedule AI.");
    /* A150 — Schedule A Total column = Revenue + Capital (row G). */
    A(150, N((SA.TotAmountAllowedApplication||{}).Total)===
        N((SA.TotAmountAllowedApplication||{}).Revenue)+N((SA.TotAmountAllowedApplication||{}).Capital),
      "Schedule A: the Total column must equal the sum of the Revenue and Capital columns.");
    /* A151 — Schedule A E must not be greater than D. */
    A(151, tot(SA.AmountNotPaidPY)<=tot(SA.TotAmtAppDrngPrevYr),
      "Schedule A: the amount not actually paid during the previous year (E) cannot be greater than Sl. No. D.");
    /* A152 — Schedule A entry allowed only if exemption is 11 or 10(23C)(iv)/(v)/(vi)/(via). */
    A(152, inList(exsec,EX_11_23C),
      "Schedule A can be filled only when Section 11 or Section 10(23C)(iv)/(v)/(vi)/(via) is the exemption claimed under filing status.");
    /* A153 — Schedule A A1a = 85% of Sl. No. 1 (the 100% donation), each column. */
    A(153, N((AT.OtherThanCorpus85||{}).Revenue)===rr(0.85*N((AT.OtherThanCorpus||{}).Revenue)) &&
           N((AT.OtherThanCorpus85||{}).Capital)===rr(0.85*N((AT.OtherThanCorpus||{}).Capital)),
      "Schedule A: the value at A1a must equal 85% of Sl. No. 1 (the other-than-corpus donation entered at 100%).");
    /* A154 — Schedule A A11 (cost of new asset u/s 11(1A)) must be 0 in the Revenue field. */
    A(154, N((AT.CostNewAssetUs11_1A||{}).Revenue)<=0,
      "Schedule A: Sl. No. A(11) (cost of new asset for exemption u/s 11(1A)) cannot be more than 0 in the Revenue field.");
  }

  /* =================================================================
     SCHEDULE VC — voluntary contributions (A155–A158). ======================== */
  if(I.ScheduleVC){
    const VC = I.ScheduleVC||{};
    const L  = RG(VC,"Local",{})||{};
    const Fo = RG(VC,"Foreign",{})||{};
    /* A155 — VC Aiie (total other than corpus) = Σ(Aiia … Aiid). */
    A(155, N(L.TotalOtherThanCorpusFund)===
        N(L.GrantsReceivedFormGovt)+N(L.GrantsReceivedFromCompanie)+N(L.OtherSpecificGrants)+N(L.OtherDonation),
      "Schedule VC: the Total at A(iie) must equal the sum of A(iia) to A(iid).");
    /* A156 — VC Aiii (domestic VC) = Ai + Aiie. */
    A(156, N(L.VoluntaryContribution)===N(L.CorpusFundDonation)+N(L.TotalOtherThanCorpusFund),
      "Schedule VC: the domestic voluntary contribution A(iii) must equal the sum of Ai + A(iie).");
    /* A157 — VC Biii (foreign contribution) = Bi + Bii. */
    A(157, N(Fo.ForeignContribution)===N(Fo.CorpusFundDonation)+N(Fo.OtherThanCorpusFund),
      "Schedule VC: the foreign contribution B(iii) must equal the sum of Bi + Bii.");
    /* A158 — VC C (total contributions) = Aiii + Biii. */
    A(158, N(VC.TotalContribution)===N(L.VoluntaryContribution)+N(Fo.ForeignContribution),
      "Schedule VC: the Total Contributions (C) must equal the sum of A(iii) + B(iii).");
  }
});
