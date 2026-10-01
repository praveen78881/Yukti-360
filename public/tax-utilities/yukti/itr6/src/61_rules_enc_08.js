/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_08 (Phase 6).
   Serial range A357–A406 (Schedule CG — Capital Gains). All 50 serials
   are ENF (rule_census.md), all in schema block ScheduleCG.*.
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this
   return is lawful" assertion — is FALSE. Every read is guarded (RG /
   (X||{}) / N()); nothing throws. Schema keys are the built-return ITR6
   paths (I = the ITR6 root), taken from the built section
   forms/ITR-6/src/70_sec_cg.js (exp block) and books/ITR-6/CG.md, and
   verified against sources/ITR-6/ITR-6_2026_Main_V1_0_schema.json.
   Encoded from each rule's own text (constitution rule 6).

   Schema map used below (CG=ScheduleCG):
     ST = CG.ShortTermCapGain,  LT = CG.LongTermCapGain
     A1/B1 land  = {ST|LT}.SaleofLandBuild.SaleofLandBuildDtls[]  (ai FullConsideration,
                   aii PropertyValuation, aiii FullConsideration50C, bi AquisitCost,
                   bii ImproveCost, biii ExpOnTrans, biv TotalDedn, c Balance,
                   1d ExemptionOrDednUs54.ExemptionGrandTotal, 1e CapgainonAssets)
     A5 = ST.NRISecur115AD, A6 = ST.SaleOnOtherAssets, B8 = LT.SaleofAssetNADtls.SaleofAssetNA
                   (ia FullValueConsdRecvUnqshr, ib FairMrktValueUnqshr, ic FullValueConsdSec50CA,
                    aii FullValueConsdOthUnqshr, aiii FullConsideration, b DeductSec48.{AquisitCost/
                    ImproveCost/ExpOnTrans/TotalDedn}, c BalanceCG, d LossSec94of7Or94of8,
                    6e DeemedSTCGDeprAsset, f ExemptionOrDednUs54.ExemptionGrandTotal, e/g CapgainonAssets)
     A7/B9 deemed = {ST.TotalAmtDeemedStcg|LT.TotalAmtDeemedLtcg} = Σ UnutilizedCg.
                    UnutilizedCgPrvYrDtls[].AmtUnutilized + {AmtDeemedStcg|AmtDeemedLtcg}
     A8/B10 PTI  = ST.PassThrIncNatureSTCG(=20Per+30Per+AppRate);
                    LT.PassThrIncNatureLTCG(=…Us112A12_5Per + …12_5Per)
     B2 slump    = LT.SlumpSaleInLtcgDtls.SlumpSaleInLtcg (2aiii FullConsideration,
                    2b NetWorthOfDivision, 2c SlumpBalance, 2d DeductionUnderSec54, 2e CapgainonAssets)
     B4 = LT.SaleOfEquityShareUs112A.CapgainonAssets = Schedule112A.Balance112A (Col 14)
     B7 = LT.NRISaleOfEquityShareUs112A.CapgainonAssets = Schedule115AD.Balance115AD (Col 14)
     B6 = LT.NRIOnSec112and115.NRIOnSec112and115Dtls[]  (same section-48 shape)
     A9/B11 DTAA = {ST|LT}.NRICgDTAA.NRIDTAADtls[] (RateAsPerTreaty, RateAsPerITAct, ApplicableRate)
     Part D      = CG.DeducClaimInfo.{DeducClaimDtlsUs54D/54EC/54G/54GA[].AmtDeducted, TotDeductClaim}
     Part E      = CG.CurrYrLosses (InLossSetOff / InStcg20Per…InLtcgDTAARate {CurrYearIncome,
                    the StclSetoff/LtclSetOff columns, CurrYrCapGain} / TotLossSetOff / LossRemainSetOff)
     Part F      = CG.AccruOrRecOfCG.<bucket>.DateRange.{5 quarters}; compared to ScheduleBFLA
                    .<STCG30Per/STCGAppRate/STCGDTAARate/LTCGDTAARate>.IncBFLA.IncOfCurYrAfterSetOffBFLosses

   Note (A386): the rule text carries a stale absolute "31-March-2025"; for
   AY 2026-27 the CGAS deposit cannot be after the financial-year end, so the
   current-year constant 2026-03-31 is used (keeps lawful current-year returns
   silent). Gain "e/g" rows (A6g/B1e/B8e/B2e) mirror the utility's deduction
   cap (a deduction cannot exceed, nor turn positive-into-negative, the balance)
   so they stay silent on a lawfully-built return and fire on a mis-footed one.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" */

  if(I.ScheduleCG){
    const CG =RG(I,"ScheduleCG",{})||{};
    const ST =RG(CG,"ShortTermCapGain",{})||{};
    const LT =RG(CG,"LongTermCapGain",{})||{};
    const CE =RG(CG,"CurrYrLosses",{})||{};
    const AF =RG(CG,"AccruOrRecOfCG",{})||{};
    const DCI=RG(CG,"DeducClaimInfo",{})||{};
    const cap=(base,ded)=>base-Math.min(N(ded),Math.max(0,base));   /* deduction cannot exceed the positive balance */

    /* ---- A5 (STCG · FII 115AD securities · NRISecur115AD) ---------- */
    const A5=RG(ST,"NRISecur115AD",{})||{}, A5d=RG(A5,"DeductSec48",{})||{};
    /* A357 — A5c Balance = A5(aiii − biv). */
    A(357, REQ(A5.BalanceCG, N(A5.FullConsideration)-N(A5d.TotalDedn)),
      "Schedule CG: Sl. No. A5c (Balance) must equal A5(aiii − biv).");
    /* A358 — A5e = A5(5c + 5d). */
    A(358, REQ(A5.CapgainonAssets, N(A5.BalanceCG)+N(A5.LossSec94of7Or94of8)),
      "Schedule CG: Sl. No. A5e (STCG) must equal the sum of A5c + A5d.");

    /* ---- A6 (STCG · other assets · SaleOnOtherAssets) -------------- */
    const A6=RG(ST,"SaleOnOtherAssets",{})||{}, A6d=RG(A6,"DeductSec48",{})||{};
    const A6f=N(RG(A6,"ExemptionOrDednUs54.ExemptionGrandTotal"));
    /* A359 — A6(a)(ic) = higher of A6(a)(ia) or A6(a)(ib). */
    A(359, REQ(A6.FullValueConsdSec50CA, Math.max(N(A6.FullValueConsdRecvUnqshr),N(A6.FairMrktValueUnqshr))),
      "Schedule CG: Sl. No. A6(a)(ic) must be the higher of A6(a)(ia) or A6(a)(ib).");
    /* A360 — A6(aiii) = A6[(a)(ic) + (aii)]. */
    A(360, REQ(A6.FullConsideration, N(A6.FullValueConsdSec50CA)+N(A6.FullValueConsdOthUnqshr)),
      "Schedule CG: Sl. No. A6(aiii) must equal the sum of A6[(a)(ic) + (aii)].");
    /* A361 — A6biv = A6(bi + bii + biii). */
    A(361, REQ(A6d.TotalDedn, N(A6d.AquisitCost)+N(A6d.ImproveCost)+N(A6d.ExpOnTrans)),
      "Schedule CG: Sl. No. A6biv (total) must equal the sum of A6(bi + bii + biii).");
    /* A362 — A6c Balance = A6(aiii − biv). */
    A(362, REQ(A6.BalanceCG, N(A6.FullConsideration)-N(A6d.TotalDedn)),
      "Schedule CG: Sl. No. A6c (Balance) must equal A6(aiii − biv).");
    /* A363 — A6g = A6(6c + 6d + 6e − 6f). */
    {const base=N(A6.BalanceCG)+N(A6.LossSec94of7Or94of8)+N(A6.DeemedSTCGDeprAsset);
     A(363, REQ(A6.CapgainonAssets, cap(base,A6f)),
      "Schedule CG: Sl. No. A6g (STCG) must equal the sum of A(6c + 6d + 6e − 6f).");}

    /* ---- A7 (deemed STCG) / A8 (pass-through STCG) ----------------- */
    /* A364 — A7 = A(aXi + aXii + aXiii + b). */
    A(364, REQ(ST.TotalAmtDeemedStcg, RSUM(RG(ST,"UnutilizedCg.UnutilizedCgPrvYrDtls",[]),"AmtUnutilized")+N(ST.AmtDeemedStcg)),
      "Schedule CG: Sl. No. A7 (STCG) must equal the sum of the previous-year unutilised amounts (aXi + aXii + aXiii) plus 'b'.");
    /* A365 — A8 = A8a + A8b + A8c. */
    A(365, REQ(ST.PassThrIncNatureSTCG, N(ST.PassThrIncNatureSTCG20Per)+N(ST.PassThrIncNatureSTCG30Per)+N(ST.PassThrIncNatureSTCGAppRate)),
      "Schedule CG: Sl. No. A8 (STCG) must equal the sum of (A8a + A8b + A8c).");

    /* ---- A1 land (STCG immovable property) — one block per property - */
    (RG(ST,"SaleofLandBuild.SaleofLandBuildDtls",[])||[]).forEach(function(r,i){
      if(!r) return;
      /* A405 — A1(aiii): stamp value adopted only if A1(aii) > 1.10 × A1(ai). */
      A(405, REQ(r.FullConsideration50C, (N(r.PropertyValuation)>1.10*N(r.FullConsideration))?N(r.PropertyValuation):N(r.FullConsideration)),
        "Schedule CG: property "+(i+1)+" — A1(aiii) must equal A1(ai) unless A1(aii) exceeds 1.10 × A1(ai), in which case it equals A1(aii).");
    });

    /* ---- B1 land (LTCG immovable property) — one block per property - */
    (RG(LT,"SaleofLandBuild.SaleofLandBuildDtls",[])||[]).forEach(function(r,i){
      if(!r) return;
      const d=N(RG(r,"ExemptionOrDednUs54.ExemptionGrandTotal"));
      /* A366 — B1biv = B1(bi + bii + biii). */
      A(366, REQ(r.TotalDedn, N(r.AquisitCost)+N(r.ImproveCost)+N(r.ExpOnTrans)),
        "Schedule CG: property "+(i+1)+" — B1biv (total) must equal the sum of B1(bi + bii + biii).");
      /* A367 — B1c Balance = B1(aiii − biv). */
      A(367, REQ(r.Balance, N(r.FullConsideration50C)-N(r.TotalDedn)),
        "Schedule CG: property "+(i+1)+" — B1c (Balance) must equal B1(aiii − biv).");
      /* A368 — B1e = B(1c − 1d) only if 1c > 1d, else 0. */
      A(368, REQ(r.CapgainonAssets, cap(N(r.Balance),d)),
        "Schedule CG: property "+(i+1)+" — B1e (LTCG) must equal B(1c − 1d) when 1c exceeds 1d, and 0 when B(1c − 1d) is negative.");
      /* A406 — B1(aiii): stamp value adopted only if B1(aii) > 1.10 × B1(ai). */
      A(406, REQ(r.FullConsideration50C, (N(r.PropertyValuation)>1.10*N(r.FullConsideration))?N(r.PropertyValuation):N(r.FullConsideration)),
        "Schedule CG: property "+(i+1)+" — B1(aiii) must equal B1(ai) unless B1(aii) exceeds 1.10 × B1(ai), in which case it equals B1(aii).");
    });

    /* ---- B2 (slump sale LTCG) ------------------------------------- */
    const B2=RG(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg",{})||{};
    /* A370 — B2c = B(2aiii − 2b). */
    A(370, REQ(B2.SlumpBalance, N(B2.FullConsideration)-N(B2.NetWorthOfDivision)),
      "Schedule CG: Sl. No. B2c (LTCG) must equal B(2aiii − 2b).");
    /* A369 — B2e = B(2c − 2d). */
    A(369, REQ(B2.CapgainonAssets, cap(N(B2.SlumpBalance),B2.DeductionUnderSec54)),
      "Schedule CG: Sl. No. B2e (LTCG) must equal B(2c − 2d).");

    /* ---- B4 / B7 (112A / 115AD equity — fed from feeder schedules) - */
    /* A371 — B4 = total of Col. 14 of Schedule 112A. */
    A(371, REQ(RG(LT,"SaleOfEquityShareUs112A.CapgainonAssets",0), RG(I,"Schedule112A.Balance112A",0)),
      "Schedule CG: Sl. No. B4 (LTCG u/s 112A) must equal the total of Col. 14 of Schedule 112A.");
    /* A376 — B7 = total of Col. 14 of Schedule 115AD(1)(iii). */
    A(376, REQ(RG(LT,"NRISaleOfEquityShareUs112A.CapgainonAssets",0), RG(I,"Schedule115AD.Balance115AD",0)),
      "Schedule CG: Sl. No. B7 (LTCG u/s 112A) must equal the total of Col. 14 of Schedule 115AD(1)(iii).");

    /* ---- B6 (NR · 112(1)(c)/115AB/115AC/115AD) rows --------------- */
    (RG(LT,"NRIOnSec112and115.NRIOnSec112and115Dtls",[])||[]).forEach(function(r,i){
      if(!r) return; const d=RG(r,"DeductSec48",{})||{};
      /* A372 — B6(a)(ic) = higher of B6(a)(ia) or B6(a)(ib). */
      A(372, REQ(r.FullValueConsdSec50CA, Math.max(N(r.FullValueConsdRecvUnqshr),N(r.FairMrktValueUnqshr))),
        "Schedule CG: B6 row "+(i+1)+" — B6(a)(ic) must be the higher of B6(a)(ia) or B6(a)(ib).");
      /* A373 — B6aiii = B6[(a)(ic) + ii]. */
      A(373, REQ(r.FullConsideration, N(r.FullValueConsdSec50CA)+N(r.FullValueConsdOthUnqshr)),
        "Schedule CG: B6 row "+(i+1)+" — B6aiii (total) must equal the sum of B6[(a)(ic) + ii].");
      /* A374 — B6biv = B6(bi + bii + biii). */
      A(374, REQ(d.TotalDedn, N(d.AquisitCost)+N(d.ImproveCost)+N(d.ExpOnTrans)),
        "Schedule CG: B6 row "+(i+1)+" — B6biv (total) must equal the sum of B6(bi + bii + biii).");
      /* A375 — B6c Balance = B(6aiii − 6biv). */
      A(375, REQ(r.BalanceCG, N(r.FullConsideration)-N(d.TotalDedn)),
        "Schedule CG: B6 row "+(i+1)+" — B6c (Balance) must equal B(6aiii − 6biv).");
    });

    /* ---- B8 (LTCG · other assets · SaleofAssetNA) ----------------- */
    const B8=RG(LT,"SaleofAssetNADtls.SaleofAssetNA",{})||{}, B8d=RG(B8,"DeductSec48",{})||{};
    const B8f=N(RG(B8,"ExemptionOrDednUs54.ExemptionGrandTotal"));
    /* A394 — B8 expenses u/s 48 (B8b(iv)) cannot be claimed if the full value
       of consideration (B8aiii) is not offered to tax. */
    A(394, N(B8.FullConsideration)>0 || N(B8d.TotalDedn)===0,
      "Schedule CG: expenses u/s 48 (Sl. No. B8b(iv)) cannot be claimed when the full value of consideration (B8aiii) is not offered to tax.");
    /* A395 — B8(a)(ic) = higher of B8(a)(ia) or B8(a)(ib). */
    A(395, REQ(B8.FullValueConsdSec50CA, Math.max(N(B8.FullValueConsdRecvUnqshr),N(B8.FairMrktValueUnqshr))),
      "Schedule CG: Sl. No. B8(a)(ic) must be the higher of B8(a)(ia) or B8(a)(ib).");
    /* A396 — B8aiii = B8[(a)(ic) + ii]. */
    A(396, REQ(B8.FullConsideration, N(B8.FullValueConsdSec50CA)+N(B8.FullValueConsdOthUnqshr)),
      "Schedule CG: Sl. No. B8aiii (total) must equal the sum of B8[(a)(ic) + ii].");
    /* A397 — B8biv = B8(bi + bii + biii). */
    A(397, REQ(B8d.TotalDedn, N(B8d.AquisitCost)+N(B8d.ImproveCost)+N(B8d.ExpOnTrans)),
      "Schedule CG: Sl. No. B8biv (total) must equal the sum of B8(bi + bii + biii).");
    /* A398 — B8c Balance = B(8aiii − biv). */
    A(398, REQ(B8.BalanceCG, N(B8.FullConsideration)-N(B8d.TotalDedn)),
      "Schedule CG: Sl. No. B8c (Balance) must equal B(8aiii − biv).");
    /* A399 — B8e = B(8c − 8d) only if 8c > 8d. */
    A(399, REQ(B8.CapgainonAssets, cap(N(B8.BalanceCG),B8f)),
      "Schedule CG: Sl. No. B8e (LTCG) must equal B(8c − 8d) when 8c exceeds 8d.");

    /* ---- B9 (deemed LTCG) / B10 (pass-through LTCG) --------------- */
    /* A400 — B9 = B9(aXi + aXii + aXiii + b). */
    A(400, REQ(LT.TotalAmtDeemedLtcg, RSUM(RG(LT,"UnutilizedCg.UnutilizedCgPrvYrDtls",[]),"AmtUnutilized")+N(LT.AmtDeemedLtcg)),
      "Schedule CG: Sl. No. B9 must equal the sum of the previous-year unutilised amounts (aXi + aXii + aXiii) plus 'b'.");
    /* A401 — B10 = B10a1 + B10a2. */
    A(401, REQ(LT.PassThrIncNatureLTCG, N(LT.PassThrIncNatureLTCGUs112A12_5Per)+N(LT.PassThrIncNatureLTCG12_5Per)),
      "Schedule CG: Sl. No. B10 must equal B10a1 + B10a2.");

    /* ---- Part D · deduction particulars (Table D) ----------------- */
    /* A402 — D1e = D(1a + 1b + 1c + 1d). */
    {const dsum=["DeducClaimDtlsUs54D","DeducClaimDtlsUs54EC","DeducClaimDtlsUs54G","DeducClaimDtlsUs54GA"]
        .reduce((a,k)=>a+RSUM(RG(DCI,k,[]),"AmtDeducted"),0);
     A(402, REQ(DCI.TotDeductClaim, dsum),
      "Schedule CG: Sl. No. D1e must equal the sum of D(1a + 1b + 1c + 1d).");}
    /* A385 — deductions claimed in the STCG/LTCG heads must match Table D. */
    {let head=0;
     head+=RSUM(RG(ST,"SaleofLandBuild.SaleofLandBuildDtls",[]), r=>RG(r,"ExemptionOrDednUs54.ExemptionGrandTotal"));
     head+=A6f;
     head+=RSUM(RG(LT,"SaleofLandBuild.SaleofLandBuildDtls",[]), r=>RG(r,"ExemptionOrDednUs54.ExemptionGrandTotal"));
     head+=N(B2.DeductionUnderSec54);
     head+=B8f;
     A(385, REQ(head, N(DCI.TotDeductClaim)),
      "Schedule CG: the deductions claimed under the respective sections in STCG and LTCG must match the total in Table D.");}
    /* A386 — 54D/54G/54GA CGAS deposit: date/account/IFSC not blank; the
       deposit date cannot be after the financial-year end (31/03/2026); the
       IFSC must be 11 characters (4 letters, a zero, then 6 letters/digits). */
    {const IFSC=/^[A-Za-z]{4}0[0-9A-Za-z]{6}$/;
     ["DeducClaimDtlsUs54D","DeducClaimDtlsUs54G","DeducClaimDtlsUs54GA"].forEach(function(k){
       (RG(DCI,k,[])||[]).forEach(function(r,i){
         if(!r||!(N(r.AmtDeposited)>0)) return;
         A(386, S0(r.DepositDate)&&S0(r.AccountNo)&&S0(r.IFSC)&&IFSC.test(String(r.IFSC))&&String(r.DepositDate)<="2026-03-31",
           "Schedule CG Part D ("+k+") row "+(i+1)+": when an amount is deposited in the Capital Gains Accounts Scheme, the date of deposit, account number and IFS code cannot be blank, the deposit date cannot be after 31/03/2026, and the IFSC must be exactly 11 characters (first 4 alphabets, 5th character zero, remaining 6 alphanumeric).");
       });
     });}

    /* ---- Part E · set-off matrix (CurrYrLosses) ------------------- */
    /* current-year gain composition of the special-rate short-term slots
       (CG.md §6): the 30% / applicable-rate / DTAA-rate buckets. The buy-back
       STCL amounts (A(A)) are stored negative, so they are added directly. */
    const AAdt=RG(ST,"CapitalLossBuyBackShares.CapitalLossBuyBackSharesDtls",[])||[];
    const bbA=code=>AAdt.reduce((a,r)=>a+((r&&r.Rate===code)?N(r.Amount):0),0);
    const NRIt=RG(ST,"NRITransacSec48Dtl",{})||{};
    const a1sum=RSUM(RG(ST,"SaleofLandBuild.SaleofLandBuildDtls",[]),"CapgainonAssets");
    const comp30 =N(A5.CapgainonAssets)+N(ST.PassThrIncNatureSTCG30Per)+bbA("STL30");
    const compApp=a1sum+N(RG(ST,"SlumpSaleInStcg.CapgainonAssets"))+N(NRIt.NRItaxSTTNotPaid)
                 +N(A6.CapgainonAssets)+N(ST.TotalAmtDeemedStcg)+N(ST.PassThrIncNatureSTCGAppRate)+bbA("STLAR");
    const compDTs=N(ST.TotalAmtTaxUsDTAAStcg);                         /* A9b */
    const In30=RG(CE,"InStcg30Per",{})||{}, InApp=RG(CE,"InStcgAppRate",{})||{},
          InDTs=RG(CE,"InStcgDTAARate",{})||{}, InLtD=RG(CE,"InLtcgDTAARate",{})||{};
    /* A379 / A382 — 30% bucket "gain of current year" = (A5e + A8b + A(A)) net of DTAA. */
    A(379, REQ(In30.CurrYearIncome, Math.max(0,comp30)),
      "Schedule CG: Sl. No. E (30% short-term row) gain of the current year must equal (A5e + A8b + A(A)), reduced by the STCG at the special DTAA rates (A9a & A9b) included therein.");
    A(382, REQ(In30.CurrYearIncome, Math.max(0,comp30)),
      "Schedule CG: Sl. No. Eiii must equal (A5e + A8b + A(A)), reduced by the STCG at the special DTAA rates (A9a & A9b) included therein.");
    /* A380 / A383 — applicable-rate bucket "gain of current year". */
    A(380, REQ(InApp.CurrYearIncome, Math.max(0,compApp)),
      "Schedule CG: Sl. No. E (applicable-rate short-term row) gain of the current year must equal (A1e + A2c + A4b + A6g + A7 + A8c + A(A)), reduced by the STCG at the special DTAA rates (A9a & A9b) included therein.");
    A(383, REQ(InApp.CurrYearIncome, Math.max(0,compApp)),
      "Schedule CG: Sl. No. Eiv must equal (A1e + A2c + A4b + A6g + A7 + A8c + A(A)), reduced by the STCG at the special DTAA rates (A9a & A9b) included therein.");
    /* A381 / A384 — DTAA-rate short-term bucket "gain of current year" = A9b. */
    A(381, REQ(InDTs.CurrYearIncome, Math.max(0,compDTs)),
      "Schedule CG: Sl. No. Ei5 must equal Sl. No. A9b.");
    A(384, REQ(InDTs.CurrYearIncome, Math.max(0,compDTs)),
      "Schedule CG: Sl. No. Ev must equal Sl. No. A9b.");
    /* A403 / A404 — DTAA-rate long-term bucket "gain of current year" = B11b. */
    A(403, REQ(InLtD.CurrYearIncome, N(LT.TotalAmtTaxUsDTAALtcg)),
      "Schedule CG: Sl. No. Ei7 must equal Sl. No. B11b.");
    A(404, REQ(InLtD.CurrYearIncome, N(LT.TotalAmtTaxUsDTAALtcg)),
      "Schedule CG: Sl. No. Evii must equal Sl. No. B11b.");

    /* Part E — per-column totals (rows viii / ix) and per-row balance (col 8). */
    const rowNodeKeys=["InStcg20Per","InStcg30Per","InStcgAppRate","InStcgDTAARate","InLtcg12_5Per","InLtcgDTAARate"];
    const setoffCols =["StclSetoff20Per","StclSetoff30Per","StclSetoffAppRate","StclSetoffDTAARate","LtclSetOff12_5Per","LtclSetOffDTAARate"];
    const TLS=RG(CE,"TotLossSetOff",{})||{}, LRS=RG(CE,"LossRemainSetOff",{})||{}, ILS=RG(CE,"InLossSetOff",{})||{};
    setoffCols.forEach(function(col){
      const sum=rowNodeKeys.reduce((a,nk)=>a+N(RG(RG(CE,nk,{})||{},col)),0);
      /* A377 — Eviii = sum of that loss column over rows (ii + iii + iv + v + vi + vii). */
      A(377, REQ(N(TLS[col]), sum),
        "Schedule CG: Sl. No. Eviii ("+col+") must equal the sum of that loss set-off over rows (ii + iii + iv + v + vi + vii).");
      /* A378 — Eix = (i − viii) when i > viii, else 0 (every column). */
      A(378, REQ(N(LRS[col]), Math.max(0, N(ILS[col])-N(TLS[col]))),
        "Schedule CG: Sl. No. Eix ("+col+") must equal (i − viii) when i exceeds viii, and 0 otherwise.");
    });
    rowNodeKeys.forEach(function(nk){
      const nd=RG(CE,nk,{})||{};
      const so=setoffCols.reduce((a,col)=>a+N(nd[col]),0);
      /* A387 — E col 8 = col (1 − 2 − 3 − 4 − 5 − 6 − 7). */
      A(387, REQ(N(nd.CurrYrCapGain), N(nd.CurrYearIncome)-so),
        "Schedule CG: Sl. No. E ("+nk+") column 8 must equal column (1 − 2 − 3 − 4 − 5 − 6 − 7).");
    });

    /* ---- Part F · quarter break-up = post-BFLA figure ------------- */
    if(I.ScheduleBFLA){
      const BFv=k=>N(RG(I,"ScheduleBFLA."+k+".IncBFLA.IncOfCurYrAfterSetOffBFLosses"));
      /* A388 — Table F Sl. No. 2 (ST @30%) = item 5vii of Schedule BFLA. */
      A(388, REQ(RDR(RG(AF,"ShortTermUnder30Per",{})), BFv("STCG30Per")),
        "Schedule CG: Table F Sl. No. 2 — the break-up of all the quarters must equal item 5vii of Schedule BFLA.");
      /* A389 — Table F Sl. No. 3 (ST applicable rate) = item 5viii of Schedule BFLA. */
      A(389, REQ(RDR(RG(AF,"ShortTermUnderAppRate",{})), BFv("STCGAppRate")),
        "Schedule CG: Table F Sl. No. 3 — the break-up of all the quarters must equal item 5viii of Schedule BFLA.");
      /* A390 — Table F Sl. No. 4 (ST DTAA rate) = item 5ix of Schedule BFLA. */
      A(390, REQ(RDR(RG(AF,"ShortTermUnderDTAARate",{})), BFv("STCGDTAARate")),
        "Schedule CG: Table F Sl. No. 4 — the break-up of all the quarters must equal item 5ix of Schedule BFLA.");
      /* A391 — Table F Sl. No. 6 (LT DTAA rate) = item 5xi of Schedule BFLA. */
      A(391, REQ(RDR(RG(AF,"LongTermUnderDTAARate",{})), BFv("LTCGDTAARate")),
        "Schedule CG: Table F Sl. No. 6 — the break-up of all the quarters must equal item 5xi of Schedule BFLA.");
    }

    /* ---- A9 / B11 · DTAA applicable rate = lower of treaty / IT-Act - */
    const applOK=function(r){const tr=N(r.RateAsPerTreaty), it=N(r.RateAsPerITAct);
      const want=(tr>0&&it>0)?Math.min(tr,it):(tr>0?tr:it);
      return REQ(N(r.ApplicableRate), want);};
    /* A393 — A9 Col.10 applicable rate = lower of Col.6 (treaty) or Col.9 (IT Act). */
    (RG(ST,"NRICgDTAA.NRIDTAADtls",[])||[]).forEach(function(r,i){ if(!r) return;
      A(393, applOK(r),
        "Schedule CG: Sl. No. A9 row "+(i+1)+" — the applicable rate (Col.10) must be the lower of the rate as per treaty (Col.6) or the rate as per the IT Act (Col.9).");
    });
    /* A392 — B11 Col.10 applicable rate = lower of Col.6 (treaty) or Col.9 (IT Act). */
    (RG(LT,"NRICgDTAA.NRIDTAADtls",[])||[]).forEach(function(r,i){ if(!r) return;
      A(392, applOK(r),
        "Schedule CG: Sl. No. B11 row "+(i+1)+" — the applicable rate (Col.10) must be the lower of the rate as per treaty (Col.6) or the rate as per the IT Act (Col.9).");
    });
  }
});
