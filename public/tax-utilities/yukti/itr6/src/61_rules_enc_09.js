/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_09 (Phase 6).
   Serial range A407–A456 — Schedule CG (A407–A439), Schedule 112A
   (A440–A448) and Schedule 115AD(1)(b)(iii)-proviso (A449–A456).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this
   return is lawful" assertion — is FALSE. Every read is guarded (RG /
   (X||{}) / N() / AR()); nothing throws. Keys are the built-return ITR6
   schema paths, taken from sources/ITR-6 schema and the CG / 112A books
   (books/ITR-6/CG.md, 112A.md). Column/item numbering, sign convention
   and cross-schedule feeds verified against forms/ITR-6/src/70_sec_cg.js.
   Encoded from each rule's own text (constitution rule 6).

   Table-E (CurrYrLosses) sign convention (from 70_sec_cg.js, n0=max(0,·)):
   every stored figure — losses available (InLossSetOff), amounts set off
   (per-row set-off columns / TotLossSetOff), gains (CurrYearIncome),
   remaining gain (CurrYrCapGain) and remaining loss (LossRemainSetOff) —
   is a NON-NEGATIVE magnitude. A zero-skeleton foots 0/0, so an empty
   return never fires.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";            /* "present / non-blank" */
  const AR=x=>Array.isArray(x)?x:[];                      /* guarded array         */
  const YREND="2026-03-31";                               /* last day of the FY    */

  /* =====================================================================
     Schedule CG — A407–A439
     ===================================================================== */
  if(I.ScheduleCG){
    const CG=RG(I,"ScheduleCG",{})||{};
    const STCG=RG(CG,"ShortTermCapGain",{})||{};
    const LTCG=RG(CG,"LongTermCapGain",{})||{};

    /* A407 — STCG slump sale: 2aiii (full value of consideration) = higher of 2ai and 2aii. */
    const ss=RG(STCG,"SlumpSaleInStcg",{})||{};
    A(407, REQ(ss.FullConsideration, Math.max(N(ss.FMV11UAEii), N(ss.FMV11UAEiii))),
      "Schedule CG: for STCG slump sale, 2aiii (full value of consideration) must equal the higher of 2ai and 2aii.");

    /* A408 — LTCG slump sale: 2aiii (full value of consideration) = higher of 2ai and 2aii. */
    const ls=RG(LTCG,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg",{})||{};
    A(408, REQ(ls.FullConsideration, Math.max(N(ls.FMV11UAEii), N(ls.FMV11UAEiii))),
      "Schedule CG: for LTCG slump sale, 2aiii (full value of consideration) must equal the higher of 2ai and 2aii.");

    /* A409 — LTCG land/building: if aiii (full value 50C) or bii (cost of improvement) > 0,
       the date of sale and date of purchase are mandatory (per property row). */
    const lb=AR(RG(LTCG,"SaleofLandBuild.SaleofLandBuildDtls",[]));
    A(409, lb.every(function(r){r=r||{};
        return !(N(r.FullConsideration50C)>0 || N(r.ImproveCost)>0)
          || (S0(r.DateofSale) && S0(r.DateofPurchase));}),
      "Schedule CG: for LTCG sale of land/building, the date of sale and date of purchase are mandatory when B(1)(aiii) or B(1)(bii) is more than zero.");

    /* A410 — STCG land/building: same date-mandatory check per property row. */
    const sb=AR(RG(STCG,"SaleofLandBuild.SaleofLandBuildDtls",[]));
    A(410, sb.every(function(r){r=r||{};
        return !(N(r.FullConsideration50C)>0 || N(r.ImproveCost)>0)
          || (S0(r.DateofSale) && S0(r.DateofPurchase));}),
      "Schedule CG: for STCG sale of land/building, the date of sale and date of purchase are mandatory when A(1)(aiii) or A(1)(bii) is more than zero.");

    /* A411 — C3 Income chargeable under head CAPITAL GAINS = C1 (sum of CG incomes) + C2 (income from VDA). */
    A(411, REQ(CG.IncChargeableHeadCapGain, N(CG.SumOfCGIncm)+N(CG.IncmFromVDATrnsf)),
      "Schedule CG: C3 (income chargeable under the head Capital Gains) must equal C1 (sum of capital gain incomes) plus C2 (income from transfer of Virtual Digital Assets).");

    /* A412 — C2 (income from transfer of VDA) = Sl. No. B of Schedule VDA (TotIncCapGain). */
    A(412, REQ(CG.IncmFromVDATrnsf, N(RG(I,"ScheduleVDA.TotIncCapGain",0))),
      "Schedule CG: C2 (income from transfer of Virtual Digital Assets) must equal item B (capital-gain total) of Schedule VDA.");

    /* Table F, Sl. No. 7 — quarter-wise VDA gains @30% (used by A413 and A414). */
    const f7=RG(CG,"AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange",{})||{};
    const f7sum=N(f7.Upto15Of6)+N(f7.Up16Of6To15Of9)+N(f7.Up16Of9To15Of12)+N(f7.Up16Of12To15Of3)+N(f7.Up16Of3To31Of3);

    /* A413 — Table F Sl. No. 7 (all quarters) = 115BBH VDA income (Capital Gains head) of Schedule SI. */
    const si5bbh=AR(RG(I,"ScheduleSI.SplCodeRateTax",[]))
      .filter(function(r){return r && r.SecCode==="5BBH";})
      .reduce(function(t,r){return t+N(r.SplRateInc);},0);
    A(413, REQ(f7sum, si5bbh),
      "Schedule CG: Table F Sl. No. 7 — the sum of the quarter break-up must equal the '115BBH — income under the head Capital Gains' value of Schedule SI.");

    /* A414 — Table F Sl. No. 7 (all quarters) = value at C2. */
    A(414, REQ(f7sum, N(CG.IncmFromVDATrnsf)),
      "Schedule CG: Table F Sl. No. 7 — the sum of the quarter break-up must equal the value at C2 (income from transfer of Virtual Digital Assets).");

    /* A415 — Part D (deductions): where the CGAS amount deposited (1aiv/1civ/1div, i.e. u/s 54D/54G/54GA)
       is more than zero, the deposit-date, account number and IFSC (iva/ivb/ivc) cannot be blank. */
    const DCI=RG(CG,"DeducClaimInfo",{})||{};
    const cgasRows=[].concat(
      AR(RG(DCI,"DeducClaimDtlsUs54D",[])),
      AR(RG(DCI,"DeducClaimDtlsUs54G",[])),
      AR(RG(DCI,"DeducClaimDtlsUs54GA",[])));
    A(415, cgasRows.every(function(r){r=r||{};
        return !(N(r.AmtDeposited)>0) || (S0(r.DepositDate)&&S0(r.AccountNo)&&S0(r.IFSC));}),
      "Schedule CG: Table D — where the amount deposited in the Capital Gains Accounts Scheme (1aiv/1civ/1div) is more than zero, its deposit date, account number and IFSC (iva/ivb/ivc) cannot be blank.");

    /* A416 — STCG @20% u/s 111A and 115AD(1)(b)(ii) can be entered only once (no duplicate section code). */
    const emfCodes=AR(RG(STCG,"EquityMFonSTT",[])).map(function(r){return r&&r.MFSectionCode;}).filter(S0);
    A(416, new Set(emfCodes).size===emfCodes.length,
      "Schedule CG: STCG @20% u/s 111A / 115AD(1)(b)(ii) can only be entered once — the section code cannot be repeated.");

    /* A417 — B7c (total) = B7ci + B7cii (112(1)(c)/115AB/115AC) + 7ciii (115AD),
       i.e. the sum of the per-section balance capital gains. */
    const b7=RG(LTCG,"NRIOnSec112and115",{})||{};
    A(417, REQ(b7.TotalNRIOnSec112and115,
        AR(b7.NRIOnSec112and115Dtls).reduce(function(t,r){return t+N(r&&r.BalanceCG);},0)),
      "Schedule CG: B7c must equal B7ci + B7cii (sections 112(1)(c)/115AB/115AC) + 7ciii (section 115AD).");

    /* ---- Table E (Set-off of current-year capital losses) — A418–A431 ---- */
    const CYL=RG(CG,"CurrYrLosses",{})||{};
    /* sum of the loss-set-off columns present in a gain row (absent buckets read 0) */
    const soSum=function(o){o=o||{};
      return N(o.StclSetoff20Per)+N(o.StclSetoff30Per)+N(o.StclSetoffAppRate)
        +N(o.StclSetoffDTAARate)+N(o.LtclSetOff12_5Per)+N(o.LtclSetOffDTAARate);};
    const g20=RG(CYL,"InStcg20Per",{})||{}, g30=RG(CYL,"InStcg30Per",{})||{},
          gap=RG(CYL,"InStcgAppRate",{})||{}, gdt=RG(CYL,"InStcgDTAARate",{})||{},
          l125=RG(CYL,"InLtcg12_5Per",{})||{}, ldt=RG(CYL,"InLtcgDTAARate",{})||{};

    /* A418–A423 — for each gain row, the loss set off against it cannot exceed the income available. */
    A(418, soSum(g20) <= N(g20.CurrYearIncome)+1,
      "Schedule CG: Table E — the loss set off against STCG @20% cannot exceed the income available for set off.");
    A(419, soSum(g30) <= N(g30.CurrYearIncome)+1,
      "Schedule CG: Table E — the loss set off against STCG @30% cannot exceed the income available for set off.");
    A(420, soSum(gap) <= N(gap.CurrYearIncome)+1,
      "Schedule CG: Table E — the loss set off against STCG @ applicable rate cannot exceed the income available for set off.");
    A(421, soSum(gdt) <= N(gdt.CurrYearIncome)+1,
      "Schedule CG: Table E — the loss set off against STCG @ DTAA rate cannot exceed the income available for set off.");
    A(422, soSum(l125) <= N(l125.CurrYearIncome)+1,
      "Schedule CG: Table E — the loss set off against LTCG @12.5% cannot exceed the income available for set off.");
    A(423, soSum(ldt) <= N(ldt.CurrYearIncome)+1,
      "Schedule CG: Table E — the loss set off against LTCG @ DTAA rate cannot exceed the income available for set off.");

    /* A424–A429 — for each loss bucket, the total set off cannot exceed the loss available. */
    const avail=RG(CYL,"InLossSetOff",{})||{};
    const tot=RG(CYL,"TotLossSetOff",{})||{};
    A(424, N(tot.StclSetoff20Per) <= N(avail.StclSetoff20Per)+1,
      "Schedule CG: Table E — the total STCL @20% set off cannot exceed the loss available for set off.");
    A(425, N(tot.StclSetoff30Per) <= N(avail.StclSetoff30Per)+1,
      "Schedule CG: Table E — the total STCL @30% set off cannot exceed the loss available for set off.");
    A(426, N(tot.StclSetoffAppRate) <= N(avail.StclSetoffAppRate)+1,
      "Schedule CG: Table E — the total STCL @ applicable rate set off cannot exceed the loss available for set off.");
    A(427, N(tot.StclSetoffDTAARate) <= N(avail.StclSetoffDTAARate)+1,
      "Schedule CG: Table E — the total STCL @ DTAA rate set off cannot exceed the loss available for set off.");
    A(428, N(tot.LtclSetOff12_5Per) <= N(avail.LtclSetOff12_5Per)+1,
      "Schedule CG: Table E — the total LTCL @12.5% set off cannot exceed the loss available for set off.");
    A(429, N(tot.LtclSetOffDTAARate) <= N(avail.LtclSetOffDTAARate)+1,
      "Schedule CG: Table E — the total LTCL @ DTAA rate set off cannot exceed the loss available for set off.");

    /* A430 — Column 8 (remaining gain) of each row = 1 − (2+3+4+5+6+7). */
    A(430, [g20,g30,gap,gdt,l125,ldt].every(function(o){o=o||{};
        return REQ(o.CurrYrCapGain, N(o.CurrYearIncome)-soSum(o));}),
      "Schedule CG: Table E — column 8 (capital gains remaining after set off) of each row must equal column 1 minus (2+3+4+5+6+7).");

    /* A431 — the entire loss must be set off with the gains available for set off:
       a short-term loss can be set against any gain, so if any STCL remains no gain may
       remain anywhere; a long-term loss only against a long-term gain, so if any LTCL
       remains no long-term gain may remain. */
    const rem=RG(CYL,"LossRemainSetOff",{})||{};
    const stclRem=N(rem.StclSetoff20Per)+N(rem.StclSetoff30Per)+N(rem.StclSetoffAppRate)+N(rem.StclSetoffDTAARate);
    const ltclRem=N(rem.LtclSetOff12_5Per)+N(rem.LtclSetOffDTAARate);
    const gainRem=N(g20.CurrYrCapGain)+N(g30.CurrYrCapGain)+N(gap.CurrYrCapGain)+N(gdt.CurrYrCapGain)
      +N(l125.CurrYrCapGain)+N(ldt.CurrYrCapGain);
    const ltGainRem=N(l125.CurrYrCapGain)+N(ldt.CurrYrCapGain);
    A(431, !(stclRem>1 && gainRem>1) && !(ltclRem>1 && ltGainRem>1),
      "Schedule CG: Table E — the entire loss must be set off against the gains available for set off; a loss cannot be left unabsorbed while a gain it can be set against remains.");

    /* A432 — if any B6 row (NRI u/s 112(1)(c)/115AB/115AC/115AD) is filled, its section code is mandatory. */
    A(432, AR(b7.NRIOnSec112and115Dtls).every(function(r){r=r||{};
        var filled=N(r.FullConsideration)>0 || N(r.BalanceCG)>0 || N(RG(r,"DeductSec48.TotalDedn"))>0;
        return !filled || S0(r.SectionCode);}),
      "Schedule CG: where Sl. No. B6 (LTCG) is filled, the section code (115AD / 112(1)(c) / 115AC) must be selected.");

    /* A433 — if a buy-back capital loss is claimed in Schedule CG, the dividend u/s 2(22)(f)
       at Sl. No. 1a(iii) of Schedule OS must be filled. */
    const bbLoss=N(RG(STCG,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"))
      +N(RG(LTCG,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"));
    A(433, !(bbLoss>0) || N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.Dividend22f"))>0,
      "Schedule CG: fill the dividend u/s 2(22)(f) at Sl. No. 1a(iii) of Schedule OS when a buy-back capital loss is claimed in Schedule CG.");

    /* A434 — B3 b(iv) (total deductions u/s 48) = B3 (bi + bii + biii). */
    const p112=RG(LTCG,"Proviso112Applicable.Proviso112Applicabledtls",{})||{};
    const p112d=RG(p112,"DeductSec48",{})||{};
    A(434, REQ(p112d.TotalDedn, N(p112d.AquisitCost)+N(p112d.ImproveCost)+N(p112d.ExpOnTrans)),
      "Schedule CG: B3 b(iv) must equal the sum of B3 (bi + bii + biii).");

    /* A435 — B3(c) Balance = B(3a − 3biv). */
    A(435, REQ(p112.BalanceCG, N(p112.FullConsideration)-N(p112d.TotalDedn)),
      "Schedule CG: B3(c) balance must equal B3a minus B3b(iv).");

    /* A436 — if B3a <= 0, no section-48 deduction can be claimed (B3b cannot be greater than zero). */
    A(436, N(p112.FullConsideration)>0 || N(p112d.TotalDedn)<=0,
      "Schedule CG: when B3a is not more than zero, deduction u/s 48 cannot be claimed — B3b cannot be greater than zero.");

    /* A437 — Table D deduction u/s 54EC: amount invested cannot exceed ₹50,00,000 (per row). */
    A(437, AR(RG(DCI,"DeducClaimDtlsUs54EC",[])).every(function(r){return N(r&&r.AmtInvested)<=5000000;}),
      "Schedule CG: Table D — for deduction u/s 54EC the amount invested cannot be more than ₹50,00,000.");

    /* A438 — date of sale/transfer of land/building (A1 or B1) cannot be after 31 March of the FY. */
    A(438, sb.concat(lb).every(function(r){r=r||{};
        return !S0(r.DateofSale) || r.DateofSale<=YREND;}),
      "Schedule CG: the date of sale/transfer of land or building or both (A1 or B1) cannot be after 31 March of the financial year.");

    /* A439 — B1g (total LTCG on immovable property) = sum of B1e of all properties. */
    A(439, REQ(RG(LTCG,"SaleofLandBuild.TotalLTCGImmblPrprty"),
        lb.reduce(function(t,r){return t+N(r&&r.CapgainonAssets);},0)),
      "Schedule CG: B1g (total LTCG on immovable property) must equal the sum of B1e over all properties.");
  }

  /* =====================================================================
     Schedule 112A — A440–A448
     Column map (books/ITR-6/112A.md): 4 NumSharesUnits · 5 SalePricePerShareUnit ·
     6 TotSaleValue · 7 CostAcqWithoutIndx · 8 AcquisitionCost ·
     9 LTCGBeforelower6and11 · 10 FairMktValuePerShareunit · 11 TotFairMktValueCapAst ·
     12 ExpExclCnctTransfer · 13 TotalDeductions · 14 Balance.
     ShareOnOrBefore: "BE" = on or before 31.01.2018, "AE" = after 31.01.2018.
     ===================================================================== */
  if(I.Schedule112A){
    const S12=RG(I,"Schedule112A",{})||{};
    const rows=AR(RG(S12,"Schedule112ADtls",[]));

    /* A440 — Col 6 Total Sale Value = Col 4 × Col 5 (for shares acquired on or before 31.01.2018). */
    A(440, rows.every(function(r){r=r||{};
        return r.ShareOnOrBefore!=="BE" || REQ(r.TotSaleValue, N(r.NumSharesUnits)*N(r.SalePricePerShareUnit));}),
      "Schedule 112A: Col 6 (total sale value) must equal Col 4 × Col 5.");

    /* A441 — Col 7 Cost of acquisition without indexation = higher of Col 8 and Col 9. */
    A(441, rows.every(function(r){r=r||{};
        return REQ(r.CostAcqWithoutIndx, Math.max(N(r.AcquisitionCost), N(r.LTCGBeforelower6and11)));}),
      "Schedule 112A: Col 7 (cost of acquisition without indexation) must be the higher of Col 8 and Col 9.");

    /* A442 — Col 9 = lower of Col 6 and Col 11 (for assets acquired before 01.02.2018). */
    A(442, rows.every(function(r){r=r||{};
        return r.ShareOnOrBefore!=="BE" || REQ(r.LTCGBeforelower6and11, Math.min(N(r.TotSaleValue), N(r.TotFairMktValueCapAst)));}),
      "Schedule 112A: Col 9 (asset acquired before 01.02.2018) must be the lower of Col 6 and Col 11.");

    /* A443 — Col 11 Total Fair Market Value = Col 4 × Col 10 (for shares acquired on or before 31.01.2018). */
    A(443, rows.every(function(r){r=r||{};
        return r.ShareOnOrBefore!=="BE" || REQ(r.TotFairMktValueCapAst, N(r.NumSharesUnits)*N(r.FairMktValuePerShareunit));}),
      "Schedule 112A: Col 11 (total fair market value per section 55(2)(ac)) must equal Col 4 × Col 10.");

    /* A444 — Col 13 Total deductions = Col 7 + Col 12. */
    A(444, rows.every(function(r){r=r||{};
        return REQ(r.TotalDeductions, N(r.CostAcqWithoutIndx)+N(r.ExpExclCnctTransfer));}),
      "Schedule 112A: Col 13 (total deductions) must equal Col 7 + Col 12.");

    /* A445 — Col 14 Balance = Col 6 − Col 13. */
    A(445, rows.every(function(r){r=r||{};
        return REQ(r.Balance, N(r.TotSaleValue)-N(r.TotalDeductions));}),
      "Schedule 112A: Col 14 (balance) must equal Col 6 − Col 13.");

    /* A446 — the column totals (Col 6,7,8,9,11,12,13,14) = the sum over rows (1+2+3+…). */
    var S=function(k){return rows.reduce(function(t,r){return t+N(r&&r[k]);},0);};
    A(446, REQ(S12.SaleValue112A, S("TotSaleValue"))
        && REQ(S12.CostAcqWithoutIndx112A, S("CostAcqWithoutIndx"))
        && REQ(S12.AcquisitionCost112A, S("AcquisitionCost"))
        && REQ(S12.LTCGBeforelowerB1B2112A, S("LTCGBeforelower6and11"))
        && REQ(S12.FairMktValueCapAst112A, S("TotFairMktValueCapAst"))
        && REQ(S12.ExpExclCnctTransfer112A, S("ExpExclCnctTransfer"))
        && REQ(S12.Deductions112A, S("TotalDeductions"))
        && REQ(S12.Balance112A, S("Balance")),
      "Schedule 112A: the totals of Col 6, 7, 8, 9, 11, 12, 13 and 14 must equal the sum of the individual rows.");

    /* A447 — where "After 31st January 2018" is selected, Col 4, 5, 10 and 11 cannot be greater than zero. */
    A(447, rows.every(function(r){r=r||{};
        return r.ShareOnOrBefore!=="AE"
          || (N(r.NumSharesUnits)<=0 && N(r.SalePricePerShareUnit)<=0
              && N(r.FairMktValuePerShareunit)<=0 && N(r.TotFairMktValueCapAst)<=0);}),
      "Schedule 112A: when 'After 31st January 2018' is selected, Col 4, 5, 10 and 11 cannot be greater than zero.");

    /* A448 — details are to be provided in either Schedule 112A or 115AD(1)(b)(iii) proviso, not both. */
    A(448, !(rows.length>0 && AR(RG(I,"Schedule115AD.Schedule115ADDtls",[])).length>0),
      "Schedule 112A: provide the details in either Schedule 112A or Schedule 115AD(1)(b)(iii) proviso, as applicable — not in both.");
  }

  /* =====================================================================
     Schedule 115AD(1)(b)(iii) proviso — A449–A456
     Same column layout and ShareOnOrBefore codes as Schedule 112A.
     ===================================================================== */
  if(I.Schedule115AD){
    const S15=RG(I,"Schedule115AD",{})||{};
    const rows=AR(RG(S15,"Schedule115ADDtls",[]));

    /* A449 — Col 6 Total Sale Value = Col 4 × Col 5 (for shares purchased on or before 31.01.2018). */
    A(449, rows.every(function(r){r=r||{};
        return r.ShareOnOrBefore!=="BE" || REQ(r.TotSaleValue, N(r.NumSharesUnits)*N(r.SalePricePerShareUnit));}),
      "Schedule 115AD(1)(b)(iii) proviso: Col 6 (total sale value) must equal Col 4 × Col 5.");

    /* A450 — Col 7 Cost of acquisition without indexation = higher of Col 8 and Col 9. */
    A(450, rows.every(function(r){r=r||{};
        return REQ(r.CostAcqWithoutIndx, Math.max(N(r.AcquisitionCost), N(r.LTCGBeforelower6and11)));}),
      "Schedule 115AD(1)(b)(iii) proviso: Col 7 (cost of acquisition without indexation) must be the higher of Col 8 and Col 9.");

    /* A451 — Col 9 = lower of Col 6 and Col 11 (for assets acquired before 01.02.2018). */
    A(451, rows.every(function(r){r=r||{};
        return r.ShareOnOrBefore!=="BE" || REQ(r.LTCGBeforelower6and11, Math.min(N(r.TotSaleValue), N(r.TotFairMktValueCapAst)));}),
      "Schedule 115AD(1)(b)(iii) proviso: Col 9 (asset acquired before 01.02.2018) must be the lower of Col 6 and Col 11.");

    /* A452 — Col 11 Total Fair Market Value = Col 4 × Col 10 (for shares purchased on or before 31.01.2018). */
    A(452, rows.every(function(r){r=r||{};
        return r.ShareOnOrBefore!=="BE" || REQ(r.TotFairMktValueCapAst, N(r.NumSharesUnits)*N(r.FairMktValuePerShareunit));}),
      "Schedule 115AD(1)(b)(iii) proviso: Col 11 (total fair market value per section 55(2)(ac)) must equal Col 4 × Col 10.");

    /* A453 — Col 13 Total deductions = Col 7 + Col 12. */
    A(453, rows.every(function(r){r=r||{};
        return REQ(r.TotalDeductions, N(r.CostAcqWithoutIndx)+N(r.ExpExclCnctTransfer));}),
      "Schedule 115AD(1)(b)(iii) proviso: Col 13 (total deductions) must equal Col 7 + Col 12.");

    /* A454 — details are to be provided in either Schedule 112A or 115AD(1)(b)(iii) proviso, not both. */
    A(454, !(rows.length>0 && AR(RG(I,"Schedule112A.Schedule112ADtls",[])).length>0),
      "Schedule 115AD(1)(b)(iii) proviso: provide the details in either Schedule 112A or Schedule 115AD(1)(b)(iii) proviso, as applicable — not in both.");

    /* A455 — where "After 31st January 2018" is selected, Col 4, 5, 10 and 11 cannot be greater than zero. */
    A(455, rows.every(function(r){r=r||{};
        return r.ShareOnOrBefore!=="AE"
          || (N(r.NumSharesUnits)<=0 && N(r.SalePricePerShareUnit)<=0
              && N(r.FairMktValuePerShareunit)<=0 && N(r.TotFairMktValueCapAst)<=0);}),
      "Schedule 115AD(1)(b)(iii) proviso: when 'After 31st January 2018' is selected, Col 4, 5, 10 and 11 cannot be greater than zero.");

    /* A456 — Col 14 Balance = Col 6 − Col 13. */
    A(456, rows.every(function(r){r=r||{};
        return REQ(r.Balance, N(r.TotSaleValue)-N(r.TotalDeductions));}),
      "Schedule 115AD(1)(b)(iii) proviso: Col 14 (balance) must equal Col 6 − Col 13.");
  }
});
