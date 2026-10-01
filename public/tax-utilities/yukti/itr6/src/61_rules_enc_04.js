/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_04 (Phase 6).
   Serial range A157–A206. Schedules covered:
     • Part A — P&L Ind-AS  (PARTA_PLIndAS)      A157–A162
     • Part A — Other Information (PARTA_OI)      A163–A173
     • Part A — Receipt & Payment (PARTA_OL)      A174
     • Schedule HP (ScheduleHP)                   A175–A194
     • Schedule BP (CorpScheduleBP)               A195–A206
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this
   return is lawful" assertion — is FALSE. Every read is guarded (RG /
   (X||{}) / N()); nothing throws. Keys are the built-return ITR6 schema
   paths (I = Object.values(buildReturn().ITR)[0]); the paths were taken
   from sources/ITR-6 schema (verified block-by-block against
   PARTA_PLIndAS / PARTA_OI / PARTA_OL / ScheduleHP / CorpScheduleBP) and
   the built sections (70_sec_accounts / 70_sec_hp / 70_sec_bp).
   Encoded from each rule's own text (constitution rule 6).

   Cross-schedule reads (all guarded, default 0):
     A163/A164 → ScheduleICDS.TotalNetAmtDetl (XI(3)/XI(4))
     A186      → SchedulePTI.SchedulePTIDtls[].IncFromHP (item 2)
     A195/A201 → PARTA_PL / PARTA_PLIndAS (P&L items 53 / 61(ii) / 62(b) / 14iii)
     A196      → ScheduleDEP.SummaryFromDeprSch.TotalDepreciation (item 6)
     A197      → PARTA_OI 3a + 4d
     A198–A200 → ScheduleHP / ScheduleCG / ScheduleOS head income floors
   REQ(a,b) is |a−b| ≤ 1; a zero-skeleton foots 0==0 so an empty return
   never fires.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" */
  const SUMK=(arr,k)=>(arr||[]).reduce((s,r)=>s+N(r&&r[k]),0);

  /* concessional-regime detector — 115BAB opted (earlier year or this year) */
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const bab=FS.Section115BA==="115BAB" || (FS.Section115CurrAY==="Y" && FS.SectionCurrAY==="115BAB");
  const myPAN=String(RG(I,"PartA_GEN1.OrgFirmInfo.PAN","")||"").toUpperCase();

  /* =====================================================================
     Part A — STATEMENT OF PROFIT & LOSS (Ind-AS)  (PARTA_PLIndAS)  A157–A162
     ===================================================================== */
  if(I.PARTA_PLIndAS){
    const PL=I.PARTA_PLIndAS;
    const TPA=RG(PL,"DebitsToPL.TaxProvAppr",{})||{};
    const APP=RG(TPA,"Appropriations",{})||{};
    const DPA=RG(PL,"DebitsToPL.DebitPlAcnt",{})||{};

    /* A157 — 59vi Total appropriations = 59i + 59ii + 59iii + 59iv + 59v. */
    A(157, REQ(APP.TotAppropriations, N(APP.TrfToReserves)+N(APP.ProposedDividend)
        +N(APP.TaxOnDividend)+N(APP.AppropriationsCSR)+N(APP.AnyOtherAppr)),
      "Part A P&L (Ind-AS): item 59vi (total of appropriations) must equal the sum of its break-up 59i to 59v.");

    /* A158 — 60 Balance carried to balance sheet = 58 − 59vi. */
    A(158, REQ(TPA.PartnerAccBalTrf, N(TPA.AmtAvlAppr)-N(APP.TotAppropriations)),
      "Part A P&L (Ind-AS): item 60 (balance carried to balance sheet) must equal item 58 − item 59vi.");

    /* A162 — Bad debts 47(i) & 47(ii) must equal the totals of their detail tables. */
    const BD=RG(DPA,"BadDebtDtls",{})||{};
    A(162, REQ(BD.BadDebtAmtDtlsTotal, SUMK(RG(BD,"BadDebtAmtDtls",[]),"Amount")) &&
           REQ(BD.OthersPANNotAvlblDtlTotal, SUMK(RG(BD,"OthersPANNotAvlblDtl",[]),"Amount")),
      "Part A P&L (Ind-AS): bad debts 47(i) and 47(ii) totals must match the sum of their respective detail tables.");

    /* Other Comprehensive Income (optional block): items 61A / 61B / 62. */
    const OCI=RG(PL,"OtherComprnsvInc",null);
    if(OCI){
      const NA=RG(OCI,"ItemsNotReclsfdPnL",{})||{};
      const RE=RG(OCI,"ItemsReclsfdPnL",{})||{};

      /* A159 — 61A total = 61Ai + 61Aii + 61Aiii + 61Aiv + 61Av + 61Avi + 61Avii. */
      A(159, REQ(NA.TotalNotPnL, N(NA.ChangesInSurplus)+N(NA.ReMesDefinedBenftPlans)+N(NA.EquityOCI)
          +N(NA.FairValFVTPl)+N(NA.ShareOfOtherComprInc)+N(NA.OthersTotal)+N(NA.IncomeTaxNotPnL)),
        "Part A P&L (Ind-AS): OCI item 61A (items not reclassified to P&L) must equal the sum of 61Ai to 61Avii.");

      /* A160 — 61B total = 61Bi + 61Bii + 61Biii + 61Biv + 61Bv + 61Bvi. */
      A(160, REQ(RE.TotalPnL, N(RE.ExchangeDiff)+N(RE.DebtsOCI)+N(RE.EffecPortionGainnLoss)
          +N(RE.ShareOCI)+N(RE.OthersTotal)+N(RE.IncomeTaxReclsPnL)),
        "Part A P&L (Ind-AS): OCI item 61B (items that will be reclassified to P&L) must equal the sum of 61Bi to 61Bvi.");

      /* A161 — 62 Total comprehensive income = 56 + 61A + 61B. */
      A(161, REQ(OCI.TotalComprIncome, N(TPA.ProfitAfterTax)+N(NA.TotalNotPnL)+N(RE.TotalPnL)),
        "Part A P&L (Ind-AS): item 62 (total comprehensive income) must equal item 56 + 61A + 61B.");
    }
  }

  /* =====================================================================
     Part A — OTHER INFORMATION  (PARTA_OI)  A163–A173
     ===================================================================== */
  if(I.PARTA_OI){
    const OI=I.PARTA_OI;
    const NC=RG(OI,"NoCredToPLAmt",{})||{};
    const D36=RG(OI,"AmtDisallUs36",{})||{};
    const D37=RG(OI,"AmtDisallUs37",{})||{};
    const D40=RG(OI,"AmtDisallUs40",{})||{};
    const D40A=RG(OI,"AmtDisallUs40A",{})||{};
    const B43P=RG(OI,"AmtDisallUs43BPyNowAll.AmtUs43B",{})||{};
    const B43=RG(OI,"AmtDisall43B.AmtUs43B",{})||{};
    const EXC=RG(OI,"AmtExciseCustomsVATOutstanding.ExciseCustomsVAT",{})||{};

    /* A163 — OI 3a (ICDS increase) must equal column XI(3) of Schedule ICDS. */
    A(163, REQ(OI.ProfDeviatDueAcctMeth, N(RG(I,"ScheduleICDS.TotalNetAmtDetl.IncreaseInProfit",0))),
      "Part A-OI: item 3a (increase in profit due to ICDS) must equal column XI(3) of Schedule ICDS.");

    /* A164 — OI 3b (ICDS decrease) must equal column XI(4) of Schedule ICDS. */
    A(164, REQ(OI.DecProOrIncLossUs145_2, N(RG(I,"ScheduleICDS.TotalNetAmtDetl.DecreaseInProfit",0))),
      "Part A-OI: item 3b (decrease in profit due to ICDS) must equal column XI(4) of Schedule ICDS.");

    /* A165 — 5f Total amounts not credited to P&L = 5a + 5b + 5c + 5d + 5e. */
    A(165, REQ(NC.TotNoCredToPLAmt, N(NC.Section28Items)+N(NC.ProformaCreditsDue)
        +N(NC.PrevYrEscalClaim)+N(NC.OthItemInc)+N(NC.CapReceipt)),
      "Part A-OI: item 5f (total amounts not credited to the P&L) must equal the sum of 5a to 5e.");

    /* A166 — 6s Total disallowable u/s 36 = sum of the individual 6 items. */
    A(166, REQ(D36.TotAmtDisallUs36, N(D36.StkInsurPrem)+N(D36.EmpHealthInsurPrem)+N(D36.EmpBonusCommSum)
        +N(D36.IntOnBorrCap)+N(D36.ZeroCoupBondDisc)+N(D36.RecogPFContribAmt)+N(D36.AppSuperAnnFundAmt)
        +N(D36.PensionSchemeSec80CCD)+N(D36.AppGratFundAmt)+N(D36.OthFundAmt)+N(D36.EmpContributionCredits)
        +N(D36.BadDebtDoubtAmt)+N(D36.BadDebtDoubtProvn)+N(D36.SpecResrvTranfr)+N(D36.FamPlanPromoExp)
        +N(D36.SecuritiesPaidAmt)+N(D36.MrktLossOthExpLossICDS)+N(D36.AnyOthDisallowance)),
      "Part A-OI: item 6s (total amount disallowable under section 36) must equal the sum of the individual 6 items.");

    /* A167 — 7k Total disallowable u/s 37 = sum of the individual 7 items. */
    A(167, REQ(D37.TotAmtDisallUs37, N(D37.CapitalNatureExp)+N(D37.PersonalExp)+N(D37.BusOrProfessnExp)
        +N(D37.PoliticPartyExp)+N(D37.LawVoilatPenalExp)+N(D37.OthPenalFineExp)+N(D37.OffenceExp)
        +N(D37.SocialRespCSR)+N(D37.ContigentLiability)+N(D37.OthAmtNotAllowUs37)),
      "Part A-OI: item 7k (total amount disallowable under section 37) must equal the sum of the individual 7 items.");

    /* A168 — 8Aj Total disallowable u/s 40 = 8Aa to 8Ai. */
    A(168, REQ(D40.TotAmtDisallUs40, N(D40.NonCompChapXVIIBAmt)+N(D40.NonComp40aiaChapXVIIBAmt)
        +N(D40.NonComp40aibChapXVIIBAmt)+N(D40.NonComp40aiiiChapXVIIBAmt)+N(D40.TaxAmtOnProfits)
        +N(D40.WTAmt)+N(D40.RolyatyOrServiceFee)+N(D40.IntSalBonPartner)+N(D40.AnyOthDisallowance)),
      "Part A-OI: item 8A.j (total amount disallowable under section 40) must equal the sum of 8A.a to 8A.i.");

    /* A169 — 9f Total disallowable u/s 40A = sum of the individual 9 items. */
    A(169, REQ(D40A.TotAmtDisallUs40A, N(D40A.AmtPaidUs40A2b)+N(D40A.AmtGT20kCash)+N(D40A.ProvPmtGrat)
        +N(D40A.ContToSetupTrust)+N(D40A.AnyOthDisallowance)),
      "Part A-OI: item 9f (total amount disallowable under section 40A) must equal the sum of the individual 9 items.");

    /* A170 — 10 Total allowable u/s 43B (disallowed earlier, now allowable) = 10a to 10h. */
    A(170, REQ(B43P.TotAmtUs43b, N(B43P.TaxDutyCesAmt)+N(B43P.ContToEmpPFSFGF)+N(B43P.EmpBonusComm)
        +N(B43P.IntPayaleToFI)+N(B43P.SumPayaleLoanBrToFinComp)+N(B43P.IntPayaleToFISchBank)
        +N(B43P.LeaveEncashPayable)+N(B43P.RailwayAsstsPyble)+N(B43P.MSEPayable)),
      "Part A-OI: item 10 (total amount allowable under section 43B) must equal the sum of amounts at 10a to 10h.");

    /* A171 — 11 Total disallowable u/s 43B (debited this year) = 11a to 11h. */
    A(171, REQ(B43.TotAmtUs43b, N(B43.TaxDutyCesAmt)+N(B43.ContToEmpPFSFGF)+N(B43.EmpBonusComm)
        +N(B43.IntPayaleToFI)+N(B43.SumPayaleLoanBrToFinComp)+N(B43.IntPayaleToFISchBank)
        +N(B43.LeaveEncashPayable)+N(B43.RailwayAsstsPyble)+N(B43.MSEPayable)),
      "Part A-OI: item 11 (total amount disallowable under section 43B) must equal the sum of amounts at 11a to 11h.");

    /* A172 — 12i Total outstanding tax/duty/cess = 12a to 12h. */
    A(172, REQ(EXC.TotExciseCustomsVAT, N(EXC.UnionExciseDuty)+N(EXC.ServiceTax)+N(EXC.VATorSaleTax)
        +N(EXC.CentralGoodServiceTax)+N(EXC.StateGoodServiceTax)+N(EXC.IntegratedGoodServiceTax)
        +N(EXC.UnionTerrGoodServiceTax)+N(EXC.OthDutyTaxCess)),
      "Part A-OI: item 12i (total outstanding tax/duty/cess/fee) must equal the sum of 12a to 12h.");

    /* A173 — 13 Amounts deemed to be profits u/s 33AB/33ABA/33AC = a + b + c (floored at 0). */
    A(173, REQ(OI.DeemedProfUs33ABs, Math.max(0, N(OI.DeemedProfUs33AB)+N(OI.DeemedProfUs33ABA)+N(OI.DeemedProfUs33AC))),
      "Part A-OI: item 13 (amounts deemed to be profits u/s 33AB or 33ABA or 33AC) must equal the sum of (a + b + c).");
  }

  /* =====================================================================
     Part A — RECEIPT & PAYMENT (company under liquidation)  A174
     ===================================================================== */
  /* A174 — if the assessee is a company under liquidation, Schedule OL is mandatory. */
  A(174, FS.UnderLiquidation!=="Y" || !!I.PARTA_OL,
    "Part A-OL: a company under liquidation must furnish the Receipt & Payment account (Part A-OL).");

  /* =====================================================================
     Schedule HP — House Property  (ScheduleHP)  A175–A194
     ===================================================================== */
  if(I.ScheduleHP){
    const HP=I.ScheduleHP;
    const props=RG(HP,"PropertyDetails",[])||[];

    props.forEach(function(p,idx){
      if(!p) return;
      const R_=RG(p,"Rentdetails",{})||{};
      const co=p.PropCoOwnedFlg==="YES";
      const coOwners=RG(p,"CoOwners",[])||[];
      const coShare=SUMK(coOwners,"PercentShareProperty");
      const share=N(p.AssessePercentShareProp);
      const L=" (property "+(idx+1)+")";

      /* A175 — standard deduction (1g) = 30% of annual value (1f); 0 is lawful (nil AV / 115BAB). */
      A(175, REQ(R_.ThirtyPercentOfBalance, Math.max(0, Math.round(0.30*N(R_.AnnualOfPropOwned)))) || N(R_.ThirtyPercentOfBalance)===0,
        "Schedule HP: the standard deduction u/s 24(a) (1g) must be 30% of the annual value (1f)"+L+".");

      /* A176 — co-owned: assessee share + co-owners' shares = 100% and each co-owner has PAN/Aadhaar. */
      A(176, !co || (REQ(share+coShare, 100) &&
              coOwners.every(function(c){ return S0(c&&c.PAN_CoOwner) || S0(c&&c.Aadhaar_CoOwner); })),
        "Schedule HP: for a co-owned property the assessee's share plus the co-owners' shares must total 100% and each co-owner's PAN/Aadhaar must be given"+L+".");

      /* A177 — co-owned: 1f (annual value of the property owned) = own% share × 1e. */
      A(177, !co || REQ(R_.AnnualOfPropOwned, Math.round((share/100)*N(R_.BalanceALV))),
        "Schedule HP: for a co-owned property the annual value of the property owned (1f) must be the assessee's share × annual value (1e)"+L+".");

      /* A178 — co-owned with nil assessee share ⇒ interest on borrowed capital (1h) cannot exceed nil. */
      A(178, !(co && share===0) || N(R_.IntOnBorwCap)<=0,
        "Schedule HP: interest on borrowed capital cannot be claimed on a co-owned property in which the assessee's share is nil"+L+".");

      /* A179 — annual/lettable value (1a) nil ⇒ municipal (local) tax (1c) cannot be claimed. */
      A(179, N(R_.AnnualLetableValue)>0 || N(R_.LocalTaxes)<=0,
        "Schedule HP: municipal tax (1c) cannot be claimed when the annual lettable value (1a) is nil"+L+".");

      /* A181 — let-out / deemed let-out ⇒ gross rent (1a) cannot be 0. */
      A(181, (p.ifLetOut!=="Y" && p.ifLetOut!=="D") || N(R_.AnnualLetableValue)>0,
        "Schedule HP: a let-out or deemed let-out property cannot have a nil gross rent / lettable value (1a)"+L+".");

      /* A182 — 1e Annual value = 1a − 1d (floored at 0). */
      A(182, REQ(R_.BalanceALV, Math.max(0, N(R_.AnnualLetableValue)-N(R_.TotalUnrealizedAndTax))),
        "Schedule HP: item 1e (annual value) must equal 1a − 1d"+L+".");

      /* A183 — 1d Total = 1b + 1c. */
      A(183, REQ(R_.TotalUnrealizedAndTax, N(R_.RentNotRealized)+N(R_.LocalTaxes)),
        "Schedule HP: item 1d must equal 1b + 1c"+L+".");

      /* A184 — 1i Total = 1g + 1h. */
      A(184, REQ(R_.TotalDeduct, N(R_.ThirtyPercentOfBalance)+N(R_.IntOnBorwCap)),
        "Schedule HP: item 1i must equal 1g + 1h"+L+".");

      /* A185 — 1k Income from house property = 1f − 1i + 1j. */
      A(185, REQ(R_.IncomeOfHP, N(R_.AnnualOfPropOwned)-N(R_.TotalDeduct)+N(R_.ArrearsUnrealizedRentRcvd)),
        "Schedule HP: item 1k (income from house property) must equal 1f − 1i + 1j"+L+".");

      /* A187 — 115BAB ⇒ the 30% standard deduction u/s 24(a) (1g) is not allowed. */
      A(187, !bab || N(R_.ThirtyPercentOfBalance)<=0,
        "Schedule HP: the 30% standard deduction u/s 24(a) is not allowed when the assessee has opted for taxation u/s 115BAB"+L+".");

      /* A188 — 115BAB ⇒ interest on borrowed capital u/s 24(b) (1h) is not allowed. */
      A(188, !bab || N(R_.IntOnBorwCap)<=0,
        "Schedule HP: interest on borrowed capital u/s 24(b) is not allowed when the assessee has opted for taxation u/s 115BAB"+L+".");

      /* A189 — co-owned: a co-owner's PAN cannot be the same as the assessee's PAN. */
      A(189, !co || !myPAN || coOwners.every(function(c){ return String((c&&c.PAN_CoOwner)||"").toUpperCase()!==myPAN; }),
        "Schedule HP: a co-owner's PAN cannot be the same as the assessee's PAN"+L+".");

      /* A191 — Section 24(b): sum of the per-row interest = the schedule's Total of Payments. */
      const s24=RG(R_,"Section24B",null);
      if(s24){
        A(191, REQ(s24.TotalInterestUs24B, SUMK(RG(s24,"Section24BDtls",[]),"InterestUs24B")),
          "Schedule HP: the total interest u/s 24(b) must equal the sum of the individual 'interest paid during the year' rows"+L+".");
      }

      /* A192 — co-owned ⇒ each other co-owner's share must be less than 100%. */
      A(192, !co || coOwners.every(function(c){ return N(c&&c.PercentShareProperty)<100; }),
        "Schedule HP: when the property is co-owned each other co-owner's percentage share must be less than 100%"+L+".");

      /* A193 — property not co-owned ⇒ the assessee's share must be 100%. */
      A(193, co || REQ(p.AssessePercentShareProp, 100),
        "Schedule HP: when the property is not co-owned the assessee's share must be 100%"+L+".");

      /* A194 — unrealised rent (1b) cannot exceed the gross rent (1a). */
      A(194, N(R_.RentNotRealized)<=N(R_.AnnualLetableValue),
        "Schedule HP: the amount of rent which cannot be realized (1b) cannot be more than the gross rent (1a)"+L+".");
    });

    /* A180 — total of house property = sum of the individual property incomes + pass-through income. */
    const sum1k=props.reduce(function(s,p){ return s+N(RG(p,"Rentdetails.IncomeOfHP",0)); },0);
    A(180, REQ(HP.TotalIncomeChargeableUnHP, sum1k + N(HP.PassThroghIncome)),
      "Schedule HP: the total income from house property must match the total of the individual property values (Σ1k + item 2).");

    /* A186 — item 2 (pass-through income) = net income/loss of HP shown in Schedule PTI.
       PTI IncFromHP is an OBJECT {AmountOfInc,CurrYrLossShareByInvstFund,NetIncomeLoss,
       TDSAmount}; the "net income/loss" the rule compares is its NetIncomeLoss leaf,
       not the object itself (summing the object read 0 and false-fired). */
    A(186, REQ(HP.PassThroghIncome, (RG(I,"SchedulePTI.SchedulePTIDtls",[])||[])
        .reduce(function(s,r){return s+N(RG(r,"IncFromHP.NetIncomeLoss",0));},0)),
      "Schedule HP: item 2 (pass-through income) must equal the net house-property income/loss shown in Schedule PTI.");

    /* A190 — item 3 = Σ1k + item 2. */
    A(190, REQ(HP.TotalIncomeChargeableUnHP, sum1k + N(HP.PassThroghIncome)),
      "Schedule HP: item 3 (income under the head house property) must equal Σ1k + item 2.");
  }

  /* =====================================================================
     Schedule BP — Business & Profession  (CorpScheduleBP)  A195–A206
     ===================================================================== */
  if(I.CorpScheduleBP){
    const BPA=RG(I,"CorpScheduleBP.BusinessIncOthThanSpec",{})||{};
    const IR=RG(BPA,"IncRecCredPLOthHeadDtls",{})||{};
    const PR=RG(BPA,"ProfitLossInclRefrdSec",{})||{};
    const IC=RG(BPA,"IncCredPL",{})||{};
    const D32=RG(BPA,"DepreciationAllowITAct32",{})||{};

    /* A195 — A1 "Profit before Tax as per P&L" = (PL 53 + 61(ii) + 62(b)) [regular]
       or PLIndAS 53 [Ind-AS]. Matches either branch so the Ind-AS / regular
       choice never causes a false block. */
    const plRegular=N(RG(I,"PARTA_PL.DebitsToPL.DebitPlAcnt.PBT",0))
                   +N(RG(I,"PARTA_PL.TotalPrsumptvIncUs44E",0))
                   +N(RG(I,"PARTA_PL.NoBooksOfAccPL.NetProfit",0));
    const plIndAS=N(RG(I,"PARTA_PLIndAS.DebitsToPL.DebitPlAcnt.PBT",0));
    A(195, REQ(BPA.ProfBfrTaxPL, plRegular) || REQ(BPA.ProfBfrTaxPL, plIndAS),
      "Schedule BP: item A1 (profit before tax as per P&L) must equal item 53 + 61(ii) + 62(b) of Part A-P&L (or item 53 of Part A P&L Ind-AS).");

    /* A196 — 12(i) Depreciation allowable u/s 32(1)(ii)/(iia) = item 6 of Schedule DEP. */
    A(196, REQ(D32.DepreciationAllowUs32_1_ii, N(RG(I,"ScheduleDEP.SummaryFromDeprSch.TotalDepreciation",0))),
      "Schedule BP: item 12(i) (depreciation allowable u/s 32(1)(ii) and 32(1)(iia)) must equal item 6 of Schedule DEP.");

    /* A197 — A25 = column 3a + 4d of Part A-OI. */
    A(197, REQ(BPA.IncProfDecLossAccICDSAdj, N(RG(I,"PARTA_OI.ProfDeviatDueAcctMeth",0))
        +N(RG(I,"PARTA_OI.MethodOfValClgStk.EffectOnPL",0))),
      "Schedule BP: item A25 must equal the sum of column 3a + 4d of Part A-OI.");

    /* A198 — income reduced at A3 (HP) must be offered under HP: the RECEIPTS
       shown in Schedule HP (gross annual value, per the rule text) must not be
       less than the amount reduced from BP A3a — which is the GROSS rent/receipts
       credited to the P&L. Comparing the NET HP head income (after the 30 %
       standard deduction and s.24(b) interest) false-fired, since net is
       always < the gross rent removed. */
    A(198, N(IR.HouseProperty)<=0 || (RG(I,"ScheduleHP.PropertyDetails",[])||[])
        .reduce(function(s,p){return s+N(RG(p,"Rentdetails.AnnualLetableValue",0));},0)>=N(IR.HouseProperty),
      "Schedule BP: the house-property income offered in Schedule HP must not be less than the amount reduced from Schedule BP item A3.");

    /* A199 — income reduced at A3b (CG) must be offered under CG. */
    A(199, N(IR.CapitalGains)<=0 || N(RG(I,"ScheduleCG.IncChargeableHeadCapGain",0))>=N(IR.CapitalGains),
      "Schedule BP: the capital-gains income offered in Schedule CG must not be less than the amount reduced from Schedule BP item A3b.");

    /* A200 — income reduced at A3c (OS) must be offered under OS: the RECEIPTS
       shown in Schedule OS (gross income chargeable at applicable rate, per the
       rule text) must not be less than the amount reduced from BP A3c — the GROSS
       dividend/interest/other income credited to the P&L. Comparing the NET OS
       head income (after the s.57 deductions) false-fired. */
    A(200, N(IR.OtherSources)<=0 || N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.GrossIncChrgblTaxAtAppRate",0))>=N(IR.OtherSources),
      "Schedule BP: the other-sources income offered in Schedule OS must not be less than the amount reduced from Schedule BP item A3c.");

    /* A201 — dividend income reduced (A3c-i) cannot exceed the dividend income
       offered at 14(iii) of Part A-P&L / P&L Ind-AS. */
    const plDiv=Math.max(N(RG(I,"PARTA_PL.CreditsToPL.OthIncome.Dividends",0)),
                         N(RG(I,"PARTA_PLIndAS.CreditsToPL.OthIncome.Dividends",0)));
    A(201, N(IR.Dividend)<=plDiv+1,
      "Schedule BP: the dividend income reduced cannot be more than the dividend income offered at item 14(iii) of Part A-P&L / P&L Ind-AS.");

    /* A202 — A6 Balance = 1 − 2a − 2b − 3a − 3b − 3c − 3d − 3e − 3f − 4a − 4b − 4c − 4d − 5d − 5A. */
    const p4a=N(PR.ProfitLossUs44AE)+N(PR.ProfitLossUs44B)+N(PR.ProfitLossUs44BB)+N(PR.ProfitLossUs44BBA)
      +N(PR.ProfitLossUs44BBB)+N(PR.ProfitLossUs44BBC)+N(PR.ProfitLossUs44BBD)+N(PR.ProfitLossUs44D)
      +N(PR.ProfitLossUs44DA)+N(PR.ProfitChapterXIIG)+N(PR.FirstSchITActOthr115B);
    A(202, REQ(BPA.BalancePLOthThanSpecBus, N(BPA.ProfBfrTaxPL)-N(BPA.NetPLFromSpecBus)-N(BPA.NetProfLossSpecifiedBus)
        -N(IR.HouseProperty)-N(IR.CapitalGains)-N(IR.OtherSources)-N(IR.UnderSec115BBF)-N(IR.UnderSec115BBG)
        -N(BPA.PLUs44sChapXIIGOthrUs115B)-p4a-N(BPA.PLUs44sChapXIIGUs115B)-N(BPA.TotalProfitFrmActCvrd)
        -N(BPA.ProfitFrmEligBus10TIA)-N(IC.TotExempInc)-N(BPA.IncCredPLNotChargable)),
      "Schedule BP: item A6 must equal 1 − 2a − 2b − 3a − 3b − 3c − 3d − 3e − 3f − 4a − 4b − 4c − 4d − 5d − 5A.");

    /* A203 — A10 Adjusted profit or loss = item 6 + item 9. */
    A(203, REQ(BPA.AdjustedPLOthThanSpecBus, N(BPA.BalancePLOthThanSpecBus)+N(BPA.TotExpDebPL)),
      "Schedule BP: item A10 (adjusted profit or loss) must equal item 6 + item 9.");

    /* A204 — A12iii = 12i + 12ii. */
    A(204, REQ(D32.TotDeprAllowITAct, N(D32.DepreciationAllowUs32_1_ii)+N(D32.DepreciationAllowUs32_1_i)),
      "Schedule BP: item A12iii must equal 12i + 12ii.");

    /* A205 — A13 Profit/loss after depreciation = 10 + 11 − 12iii. */
    A(205, REQ(BPA.AdjustPLAfterDeprOthSpecInc, N(BPA.AdjustedPLOthThanSpecBus)
        +N(BPA.DepreciationDebPLCosAct)-N(D32.TotDeprAllowITAct)),
      "Schedule BP: item A13 (profit or loss after adjustment for depreciation) must equal 10 + 11 − 12iii.");

    /* A206 — A26 = 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + 23 + 24 + 25. */
    A(206, REQ(BPA.TotAfterAddToPLDeprOthSpecInc, N(BPA.AmtDebPLDisallowUs36)+N(BPA.AmtDebPLDisallowUs37)
        +N(BPA.AmtDebPLDisallowUs40)+N(BPA.AmtDebPLDisallowUs40A)+N(BPA.AmtDebPLDisallowUs43B)
        +N(BPA.InterestDisAllowUs23SMEAct)+N(BPA.DeemIncUs41)+N(BPA.DeemIncUs3380HHD80IA)+N(BPA.DeemIncUs43CA)
        +N(BPA.OthItemDisallowUs28To44DA)+N(BPA.AnyOthIncNotInclInExpDisallowPL)+N(BPA.IncProfDecLossAccICDSAdj)),
      "Schedule BP: item A26 must equal the sum of items 14 to 25.");
  }
});
