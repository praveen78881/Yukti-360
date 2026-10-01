/* =====================================================================
   ITR-5 · AY 2026-27 — census cleanup wave (three MISSING rules).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) FIRES (blocks) when cond (the "lawful" assertion) is FALSE
   — Category A.  Dd(n,cond,msg) is the Category-B/D advisory (same sense).
   Every block guards to a no-op when its owning schedule is absent, wraps
   array reads in arr(), reads nested paths with RG and never throws.

   Schema keys were confirmed by grepping the owning section exp() functions:
     A449 — 70_sec_cg.js  (Part-A ShortTermCapGain block, ST.* leaves; the
            engine computes the A10 sum at 70_sec_cg.js:283; the exported
            container is ScheduleCG.ShortTermCapGain, NOT "…For23").
     A261 — 70_sec_bp.js  (CorpScheduleBP.BusinessIncOthThanSpec.ProfBfrTaxPL)
            and 70_sec_pl.js (PARTA_PL.* profit leaves).
     B52  — 70_sec_loss.js (ScheduleCFL.CurrentYearLossCF.LossSummaryDetail.*)
            and 70_sec_gen.js (FilingStatus.ReturnFileSec.IncomeTaxSec == 12).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const arr=v=>Array.isArray(v)?v:[];

  /* ===================================================================
     A449  (Category A)  — Schedule CG, Sl.No. A10 (total STCG).
     "A10 STCG should be equal to the sum of
        A1e + A2c + A3e + A4a + A4b + A5e + A6g + A7 + A8 − A9a + A(A)."
     LHS = ScheduleCG.ShortTermCapGain.TotalSTCG (signed leaf sg(A.total),
     engine 70_sec_cg.js:283).  Operands are the exported ST.* leaves:
       A1e = Σ SaleofLandBuild.SaleofLandBuildDtls[].CapgainonAssets
       A2c = SlumpSaleInStcg.CapgainonAssets
       A3e = Σ EquityMFonSTT[].EquityMFonSTTDtls.CapgainonAssets
       A4a = NRITransacSec48Dtl.NRItaxSTTPaid
       A4b = NRITransacSec48Dtl.NRItaxSTTNotPaid
       A5e = NRISecur115AD.CapgainonAssets
       A6g = SaleOnOtherAssets.CapgainonAssets
       A7  = TotalAmtDeemedStcg
       A8  = PassThrIncNatureSTCG
       A9a = TotalAmtNotTaxUsDTAAStcg
       A(A)= CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares (signed −)
     A(A) is exported as a NEGATIVE amount (−n0(loss)), so "+A(A)" here means
     adding that negative — matching the engine's "− A.aA.loss".
     =================================================================== */
  if(I.ScheduleCG){
    const ST=RG(I,"ScheduleCG.ShortTermCapGain",null);
    if(ST&&typeof ST==="object"){
      const landRows=arr(RG(ST,"SaleofLandBuild.SaleofLandBuildDtls",[]));
      const mfRows  =arr(RG(ST,"EquityMFonSTT",[]));
      const a1e=RSUM(landRows,"CapgainonAssets");
      const a2c=N(RG(ST,"SlumpSaleInStcg.CapgainonAssets"));
      const a3e=RSUM(mfRows,r=>RG(r,"EquityMFonSTTDtls.CapgainonAssets"));
      const a4a=N(RG(ST,"NRITransacSec48Dtl.NRItaxSTTPaid"));
      const a4b=N(RG(ST,"NRITransacSec48Dtl.NRItaxSTTNotPaid"));
      const a5e=N(RG(ST,"NRISecur115AD.CapgainonAssets"));
      const a6g=N(RG(ST,"SaleOnOtherAssets.CapgainonAssets"));
      const a7 =N(RG(ST,"TotalAmtDeemedStcg"));
      const a8 =N(RG(ST,"PassThrIncNatureSTCG"));
      const a9a=N(RG(ST,"TotalAmtNotTaxUsDTAAStcg"));
      const aA =N(RG(ST,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"));
      const rhs=a1e+a2c+a3e+a4a+a4b+a5e+a6g+a7+a8-a9a+aA;
      /* per-row totals are each independently rounded, so allow a small
         tolerance that scales with the number of contributing rows */
      const tol=1+landRows.length+mfRows.length;
      A(449,REQ(RG(ST,"TotalSTCG"),rhs,tol),
        "Schedule CG: Sl.No.A10 (total short-term capital gain) must equal A1e + A2c + A3e + A4a + A4b + A5e + A6g + A7 + A8 − A9a + A(A).");
    }
  }

  /* ===================================================================
     A261  (Category A)  — Schedule BP, Sl.No. A1
       "'Profit before Tax as per Profit & Loss A/c' is not matching with
        sum of Sl.No.(54, 62ii, 63ii, 64v, 65iii, 66(iv) and 67(ii)) of
        Part A-P&L."
     LHS = CorpScheduleBP.BusinessIncOthThanSpec.ProfBfrTaxPL  (sg(A.K5)).
     Operands (PARTA_PL exported leaves):
       54    = DebitsToPL.DebitPlAcnt.PBT
       62ii  = PersumptiveInc44AD.TotPersumptiveInc44AD
       63ii  = PersumptiveInc44ADA.TotPersumptiveInc44ADA
       64v   = TotalPrsumptvIncUs44E   (this year's schema labels it 64iv —
               the single 44AE net-presumptive total; content matches)
       65iii = NoBooksOfAccPL.TotBusinessProfession (the item-65 total)
       66iv  = NetIncomeFrmSpecActivity
       67ii  = NonResidentPL.NetProfit (item 67b total)
     Modelled on siblings 253/259/269/272 (all read RG(I,"PARTA_PL…")).
     =================================================================== */
  if(I.CorpScheduleBP){
    const BP=RG(I,"CorpScheduleBP.BusinessIncOthThanSpec",null);
    if(BP&&typeof BP==="object"){
      const a1  =N(BP.ProfBfrTaxPL);
      const pl54  =N(RG(I,"PARTA_PL.DebitsToPL.DebitPlAcnt.PBT"));
      const pl62ii=N(RG(I,"PARTA_PL.PersumptiveInc44AD.TotPersumptiveInc44AD"));
      const pl63ii=N(RG(I,"PARTA_PL.PersumptiveInc44ADA.TotPersumptiveInc44ADA"));
      const pl64  =N(RG(I,"PARTA_PL.TotalPrsumptvIncUs44E"));
      const pl65  =N(RG(I,"PARTA_PL.NoBooksOfAccPL.TotBusinessProfession"));
      const pl66iv=N(RG(I,"PARTA_PL.NetIncomeFrmSpecActivity"));
      const pl67ii=N(RG(I,"PARTA_PL.NonResidentPL.NetProfit"));
      A(261,REQ(a1,pl54+pl62ii+pl63ii+pl64+pl65+pl66iv+pl67ii),
        "Schedule BP: Sl.No.A1 (Profit before tax as per Profit & Loss A/c) must equal the sum of Sl.No. 54, 62ii, 63ii, 64v, 65iii, 66(iv) and 67(ii) of Part A-P&L.");
    }
  }

  /* ===================================================================
     B52  (Category B — advisory, use Dd)  — Schedule CFL.
       "Current year losses to be carried forward should not be more than
        ZERO if return is filed under 139(4)."
     When filed belated u/s 139(4) (FilingStatus.ReturnFileSec.IncomeTaxSec
     == 12), the current-year CF heads barred by s.80 (return not filed
     within the s.139(1) due date) must all be nil:
       ScheduleCFL.CurrentYearLossCF.LossSummaryDetail.{
         BusLossOthThanSpecLossCF, LossFrmSpecBusCF, LossFrmSpecifiedBusCF,
         TotalSTCGPTILossCF, TotalLTCGPTILossCF, OthSrcLossRaceHorseCF }.
     TotalHPPTILossCF is EXCLUDED — house-property loss (s.71B) and
     unabsorbed depreciation (s.32(2)) are lawfully carried forward even in
     a belated return.  IncomeTaxSec is exported as a NUMBER (R(sec||11)),
     so compare numerically.  Advisory fires only when belated AND a barred
     head is > 0 — silent on a timely return or a belated one with no such CF.
     =================================================================== */
  if(I.ScheduleCFL){
    const belated=N(RG(I,"PartA_GEN1.FilingStatus.ReturnFileSec.IncomeTaxSec"))===12;
    const LS=RG(I,"ScheduleCFL.CurrentYearLossCF.LossSummaryDetail",null);
    if(belated&&LS&&typeof LS==="object"){
      const barred=N(LS.BusLossOthThanSpecLossCF)+N(LS.LossFrmSpecBusCF)+N(LS.LossFrmSpecifiedBusCF)
                  +N(LS.TotalSTCGPTILossCF)+N(LS.TotalLTCGPTILossCF)+N(LS.OthSrcLossRaceHorseCF);
      Dd(52,barred<=0,
        "Schedule CFL: when the return is filed u/s 139(4) (belated), the current-year business, speculative, specified-business, short-term capital, long-term capital and other-source (race-horse) losses to be carried forward must be nil; only house-property loss and unabsorbed depreciation may be carried forward.");
    }
  }
});
