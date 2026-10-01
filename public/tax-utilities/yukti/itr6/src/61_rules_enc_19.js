/* =====================================================================
   ITR-6 · AY 2026-27 — Category-B validation rules, batch enc_19 (Phase 6).
   ADVISORY (non-blocking) rules — rules.json objects with cat=="B".
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   Dd(n,cond,msg) raises a NON-blocking advisory ("may be defective
   u/s 139(9)") when cond — the "this return is lawful" assertion — is
   FALSE. Every message is prefixed "[B] ". Every read is guarded (RG /
   (X||{}) / N()); nothing throws. Keys are the built-return ITR6 schema
   paths (the ruleset receives I = that root), taken from the built
   sections (70_sec_gen/who/os/bp/cg/loss/ded/mat/fa/other/tax) and the
   ITR-6 schema. Encoded from each rule's own text (constitution rule 6).

   Census (books/ITR-6/rule_census.md, Category-B appendix) —
   ENFORCED-target advisory serials handled here:
     B7 B10 B11 B12 B13 B14 B15 B16 B23 B24 B25 B27  (12 encoded).
   SKIPPED as NA (external forms/data, per census):
     B1 B2 B6 B21 B22 B26.
   SKIPPED as OFFLINE (external DB match, per census):
     B3 B4 B5 B8 B9.
   RE-FILED OFFLINE-IMPOSSIBLE (no offline-checkable schema field):
     B17 B18 B19 B20 — the TDS schedule (ScheduleTDS2/3) preserves only a
     broad HeadOfIncome (OS/CG/…), NOT the income sub-nature (VDA /
     115BB lottery / race-horse / 115BBJ online games) that the rule must
     match the TDS row against; so the "TDS under this nature but income
     not offered" test has no field to read. Reported, not faked.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";            /* present / non-blank */
  const SUMV=o=>{let t=0;const x=o||{};for(const k in x){if(typeof x[k]==="number")t+=x[k];}return t;};

  /* ---- Part A General (not schedule-scoped) ---- */
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const G2=RG(I,"PartA_GEN2For6",{})||{};

  /* B7 — a2i "More than ₹1cr up to ₹10cr" AND (a2ii or a2iii) "More than 5%"
     ⇒ liable to audit u/s 44AB (advisory reminder). */
  Dd(7, !(G2.TotalSalesExcOneCr==="Upto10CR" &&
          (G2.AgrOFAllAmtsRcvd==="MoreThan5Per" || G2.AgrOFAllPayMade==="MoreThan5Per"))
        || G2.LiableSec44ABflg==="Y",
    "[B] Part A General: a2i is 'More than ₹1 crore up to ₹10 crores' and a2ii/a2iii is 'More than 5%' — you are liable to audit u/s 44AB.");

  /* =====================================================================
     Schedule IF (partner-in-firm) — B10
     ===================================================================== */
  if(I.ScheduleIF){
    const rows=RG(I,"ScheduleIF.PartnerFirmDetails",[])||[];
    const totInt=rows.reduce((a,r)=>a+N(r&&r.IntrstAmtDueOrRecv),0);
    /* 14xi(b) of the statement of profit & loss (regular or Ind-AS) */
    const plInt=N(RG(I,"PARTA_PL.CreditsToPL.OthIncome.AmtofInterest"))
               +N(RG(I,"PARTA_PLIndAS.CreditsToPL.OthIncome.AmtofInterest"));
    /* B10 — total of "Amount of interest due or received" = 14xi(b) of P&L. */
    Dd(10, REQ(totInt, plInt),
      "[B] Schedule IF: the total of 'Amount of interest due or received from partnership firm' should equal 14xi(b) (interest due or received from firm) of the statement of profit and loss.");
  }

  /* =====================================================================
     Schedule BP (CorpScheduleBP) — B11 (with Schedule OS)
     ===================================================================== */
  if(I.CorpScheduleBP && I.ScheduleOS){
    const osDiv=N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.DividendGross"));
    const bpDivReduced=N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.Dividend"));
    /* B11 — dividend income in Schedule OS should not exceed the dividend
       reduced (credited to P&L, taxed under OS) in Schedule BP. */
    Dd(11, osDiv <= bpDivReduced + 1,
      "[B] Schedule BP: dividend income declared in Schedule OS is more than the dividend income reduced from Schedule BP (item 3c) — reconcile the two.");
  }

  /* =====================================================================
     Schedule CG — B12, B13
     ===================================================================== */
  if(I.ScheduleCG){
    /* B12 — resident taxpayer claiming DTAA special rate on capital gains:
       DTAA benefit is not available in the CG rate (claim it via TR/FSI). */
    const resident=FS.ResidentialStatus!=="NRI";
    const cgDTAA=N(RG(I,"ScheduleCG.ShortTermCapGain.TotalAmtTaxUsDTAAStcg"))
                +N(RG(I,"ScheduleCG.LongTermCapGain.TotalAmtTaxUsDTAALtcg"));
    Dd(12, !resident || cgDTAA<=0,
      "[B] Schedule CG: for a resident taxpayer DTAA benefit is not available in the rate of taxation of capital gains; residents may claim DTAA relief under Schedule TR / FSI. Please re-check the claim.");

    /* B13 — Table E: the entire current-year loss should be set off against
       the gains available for set-off. */
    const CE=RG(I,"ScheduleCG.CurrYrLosses",{})||{};
    const totLoss=SUMV(CE.InLossSetOff);
    const remain=SUMV(CE.LossRemainSetOff);
    const NODES=["InStcg20Per","InStcg30Per","InStcgAppRate","InStcgDTAARate","InLtcg12_5Per","InLtcgDTAARate"];
    const gainAvail=NODES.reduce((a,k)=>a+N(RG(CE,k+".CurrYearIncome")),0);
    const setOff=totLoss-remain;
    /* lawful unless a loss remains while gains that were not consumed are still available */
    Dd(13, remain<=1 || (gainAvail-setOff)<=1,
      "[B] Schedule CG, Table E: the entire loss should be set off against the gains available for set-off — a loss remains unset-off while set-offable gains are still available.");
  }

  /* =====================================================================
     Schedule CFL — B14
     ===================================================================== */
  if(I.ScheduleCFL){
    const sec=String(RG(FS,"ReturnFileSec.IncomeTaxSec",""));
    const belated=sec==="12";                              /* 139(4) — after due date */
    const cur=RG(I,"ScheduleCFL.CurrentYearLossCF.LossSummaryDetail",{})||{};
    /* HP loss may be carried forward even in a belated return; other current-year
       losses cannot — so exclude TotalHPPTILossCF from the test. */
    const nonHP=N(cur.BroughtFrwdBusLossSetOffDrYr)+N(cur.LossFrmSpecBusCF)+N(cur.LossFrmSpecifiedBusCF)
      +N(cur.LossFrmLifeInsBusUs115B)+N(cur.TotalSTCGPTILossCF)+N(cur.TotalLTCGPTILossCF)+N(cur.OthSrcLossRaceHorseCF);
    /* B14 — current-year losses carried forward must be zero when filed u/s 139(4). */
    Dd(14, !belated || nonHP<=0,
      "[B] Schedule CFL: current-year losses (other than house-property loss) cannot be carried forward when the return is filed u/s 139(4) — they should be zero.");
  }

  /* =====================================================================
     Schedule CYLA — B15, B16
     ===================================================================== */
  if(I.ScheduleCYLA){
    const CY=RG(I,"ScheduleCYLA",{})||{};
    /* income still available for set-off = sum of positive per-head income
       remaining after the current-year set-off */
    let incomeAvail=0;
    for(const k in CY){const o=CY[k]; if(o&&o.IncCYLA){incomeAvail+=Math.max(0,N(o.IncCYLA.IncOfCurYrAfterSetOff));}}
    const busRemain=N(RG(CY,"LossRemAftSetOff.BalBusLossAftSetoff"));
    const osRemain=N(RG(CY,"LossRemAftSetOff.BalOthSrcLossNoRaceHorseAftSetoff"));
    /* B15 — business loss not fully set off while income is available. */
    Dd(15, busRemain<=1 || incomeAvail<=1,
      "[B] Schedule CYLA: income is available for set-off of losses but the current-year business loss has not been fully set off.");
    /* B16 — other-sources loss not fully set off while income is available. */
    Dd(16, osRemain<=1 || incomeAvail<=1,
      "[B] Schedule CYLA: income is available for set-off of losses but the current-year 'income from other sources' loss has not been fully set off.");
  }

  /* =====================================================================
     Schedule OS — B25
     ===================================================================== */
  if(I.ScheduleOS){
    const io=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};
    const div1ai=N(io.DividendOthThan22e), div1aii=N(io.Dividend22e);
    const intExp57=N(RG(io,"Deductions.UsrIntExp57"));
    /* B25 — interest expenditure u/s 57(1) must not exceed 20% of the dividend
       income at 1ai + 1aii. */
    Dd(25, intExp57 <= 0.20*(div1ai+div1aii) + 1,
      "[B] Schedule OS: interest expenditure claimed u/s 57(1) should not be more than 20% of the dividend income at Sl.No. 1ai + 1aii.");
  }

  /* =====================================================================
     Schedule VIA — B23, B24
     ===================================================================== */
  if(I.ScheduleVIA){
    const via80PA=N(RG(I,"ScheduleVIA.DeductUndChapVIA.Section80PA"));
    /* turnover = total revenue from operations (regular or Ind-AS P&L) */
    const turnover=N(RG(I,"PARTA_PL.TotRevenueFrmOperations"))+N(RG(I,"PARTA_PLIndAS.TotRevenueFrmOperations"));
    /* B23 — 80PA cannot be claimed if turnover is more than ₹100 crore. */
    Dd(23, via80PA<=0 || turnover<=1000000000,
      "[B] Schedule VIA: deduction u/s 80PA (Sl.No. 2p) cannot be claimed when the turnover is more than ₹100 crore.");
    /* B24 — 80PA should be limited to Sl.No. 2i (business income other than
       speculative/specified) of Part B-TI. */
    const bti2i=N(RG(I,"PartB-TI.ProfBusGain.ProfGainNoSpecBus"));
    Dd(24, via80PA <= bti2i + 1,
      "[B] Schedule VIA: deduction u/s 80PA should be limited to Sl.No. 2i (profits and gains from business other than speculative/specified business) of Part B-TI.");
  }

  /* =====================================================================
     Part B-TTI — B27
     ===================================================================== */
  if(I.PartB_TTI){
    const refund=N(RG(I,"PartB_TTI.Refund.RefundDue"));
    const lei=RG(I,"PartA_GEN1.FilingStatus.LEIDtls.LEINumber","");
    /* B27 — LEI details (Part A General Sl.No. r) are mandatory when the
       refund (Part B-TTI Sl.No. 12) is ₹50 crore or more. */
    Dd(27, refund < 500000000 || S0(lei),
      "[B] Part A General: the Legal Entity Identifier (LEI) details (Sl.No. r) are mandatory when the refund at Part B-TTI Sl.No. 12 is ₹50 crore or more.");
  }
});
