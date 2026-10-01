/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, encode batch 07 (Phase 6).
   Slice: rules.json serials 301–350 (Schedule DEP · DCG · ESR · CG).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires when cond (the "valid" assertion) is FALSE.
   Reads are guarded (RG / N / (X||{})); nothing throws. Every cond is TRUE
   when the data is absent or the schedule is not built. Sources: the ITR-5
   books DEP_DCG.md · DPM_DOA.md · ESR.md · CG.md and the section exports
   forms/ITR-5/src/70_sec_bp.js (DEP/DCG/DPM/DOA/ESR) & 70_sec_cg.js (CG).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  /* DEP/DCG "17i or 18i as applicable" = proportionate depreciation allowable
     (Sl.18/15) if > 0, else the net aggregate depreciation (Sl.17/14).
     Mirrors [H5]=IF(DPMxx.DepreciationAllowed>0,DepreciationAllowed,NetDepreciation). */
  const dpmDep=o=>{const p=N(RG(o,"ProportionateAggDepreciation"));return p>0?p:N(RG(o,"NetAggregateDepreciation"));};
  const dpmBlk=b=>RG(I,"ScheduleDPM.PlantMachinery."+b+".DepreciationDetail",{});
  const doaBlk=p=>RG(I,p+".DepreciationDetail",{});

  /* ================= Schedule DEP (summary of depreciation) ================= */
  if(I.ScheduleDEP){
    const DEP=RG(I,"ScheduleDEP.SummaryFromDeprSch",{});
    const PM=RG(DEP,"PlantMachinerySummary",{}), BD=RG(DEP,"BuildingSummary",{});
    /* 301 — 2d (total depreciation on building) = 2a + 2b + 2c */
    A(301,REQ(BD.TotBuildng,N(BD.DeprBlockTot5Percent)+N(BD.DeprBlockTot10Percent)+N(BD.DeprBlockTot40Percent)),
      "Schedule DEP: 2d (total depreciation on building) must equal 2a + 2b + 2c.");
    /* 302 — 6 (total depreciation) = 1e + 2d + 3 + 4 + 5, floored at 0.
       (rules.json text reads "1d + 2d + 3 + 4 + 5" — a typo for 1e; [J18] uses J9=1e.) */
    A(302,REQ(DEP.TotalDepreciation,Math.max(0,N(PM.TotPlntMach)+N(BD.TotBuildng)+N(DEP.FurnitureSummary)+N(DEP.IntangibleAssetSummary)+N(DEP.ShipsSummary))),
      "Schedule DEP: 6 (total depreciation) must equal 1e + 2d + 3 + 4 + 5 (nil if negative).");
    /* 303–306 — plant & machinery blocks = Sl.17i/18i .. 17iv/18iv of Schedule DPM.
       No `if(I.ScheduleDPM)` guard: a return that claims P&M depreciation in the DEP
       summary while OMITTING Schedule DPM must fail. dpmBlk defaults an absent DPM
       block to {}, so dpmDep is 0 when DPM is absent; a lawful return that carries
       Schedule DPM keeps 1a..1d == Sl.17i/18i.. and stays silent. */
    A(303,REQ(PM.DeprBlockTot15Percent,dpmDep(dpmBlk("Rate15"))),"Schedule DEP: 1a (P&M @15%) must equal Sl.17i/18i of Schedule DPM.");
    A(304,REQ(PM.DeprBlockTot30Percent,dpmDep(dpmBlk("Rate30"))),"Schedule DEP: 1b (P&M @30%) must equal Sl.17ii/18ii of Schedule DPM.");
    A(305,REQ(PM.DeprBlockTot40Percent,dpmDep(dpmBlk("Rate40"))),"Schedule DEP: 1c (P&M @40%) must equal Sl.17iii/18iii of Schedule DPM.");
    A(306,REQ(PM.DeprBlockTot45Percent,dpmDep(dpmBlk("Rate45"))),"Schedule DEP: 1d (P&M @45%) must equal Sl.17iv/18iv of Schedule DPM.");
    /* 307–312 — building/furniture/intangible/ship blocks = Sl.14ii/15ii .. 14vii/15vii
       of Schedule DOA. No `if(I.ScheduleDOA)` guard: a return that claims these
       summary blocks while OMITTING Schedule DOA must fail. doaBlk defaults an absent
       DOA block to {} so the DOA side is 0 when it is absent; a lawful return that
       carries Schedule DOA keeps the summary == Sl.14../15.. and stays silent. */
    A(307,REQ(BD.DeprBlockTot5Percent,dpmDep(doaBlk("ScheduleDOA.Building.Rate5"))),"Schedule DEP: 2a (building @5%) must equal Sl.14ii/15ii of Schedule DOA.");
    A(308,REQ(BD.DeprBlockTot10Percent,dpmDep(doaBlk("ScheduleDOA.Building.Rate10"))),"Schedule DEP: 2b (building @10%) must equal Sl.14iii/15iii of Schedule DOA.");
    A(309,REQ(BD.DeprBlockTot40Percent,dpmDep(doaBlk("ScheduleDOA.Building.Rate40"))),"Schedule DEP: 2c (building @40%) must equal Sl.14iv/15iv of Schedule DOA.");
    A(310,REQ(DEP.FurnitureSummary,dpmDep(doaBlk("ScheduleDOA.FurnitureFittings.Rate10"))),"Schedule DEP: 3 (furniture and fittings) must equal Sl.14v/15v of Schedule DOA.");
    A(311,REQ(DEP.IntangibleAssetSummary,dpmDep(doaBlk("ScheduleDOA.IntangibleAssets.Rate25"))),"Schedule DEP: 4 (intangible assets) must equal Sl.14vi/15vi of Schedule DOA.");
    A(312,REQ(DEP.ShipsSummary,dpmDep(doaBlk("ScheduleDOA.Ships.Rate20"))),"Schedule DEP: 5 (ships) must equal Sl.14vii/15vii of Schedule DOA.");
  }

  /* ================= Schedule DCG (deemed capital gains on sale of depreciable assets) ================= */
  if(I.ScheduleDCG){
    const DCG=RG(I,"ScheduleDCG.SummaryFromDeprSchCG",{});
    const PMc=RG(DCG,"PlantMachinerySummaryCG",{}), BDc=RG(DCG,"BuildingSummaryCG",{});
    /* 313 — 1e (total P&M) = 1a + 1b + 1c + 1d */
    A(313,REQ(PMc.TotPlntMach,N(PMc.DeprBlockTot15Percent)+N(PMc.DeprBlockTot30Percent)+N(PMc.DeprBlockTot40Percent)+N(PMc.DeprBlockTot45Percent)),
      "Schedule DCG: 1e (total plant & machinery) must equal 1a + 1b + 1c + 1d.");
    /* 314 — 2d (total building) = 2a + 2b + 2c */
    A(314,REQ(BDc.TotBuildng,N(BDc.DeprBlockTot5Percent)+N(BDc.DeprBlockTot10Percent)+N(BDc.DeprBlockTot40Percent)),
      "Schedule DCG: 2d (total building) must equal 2a + 2b + 2c.");
    /* 315 — 6 (total) = 1e + 2d + 3 + 4 + 5 (signed; may be negative) */
    A(315,REQ(DCG.TotalDepreciation,N(PMc.TotPlntMach)+N(BDc.TotBuildng)+N(DCG.FurnitureSummary)+N(DCG.IntangibleAssetSummary)+N(DCG.ShipsSummary)),
      "Schedule DCG: 6 (total) must equal 1e + 2d + 3 + 4 + 5.");
    /* 316–319 — P&M blocks = Sl.20i .. 20iv of Schedule DPM (Capital gains/loss u/s 50).
       No `if(I.ScheduleDPM)` guard: a return that reports deemed capital gains on a
       P&M block in the DCG summary while OMITTING Schedule DPM must fail. dpmBlk
       defaults an absent DPM block to {} so RG(..,"CapGainUs50") is 0; a lawful
       return with Schedule DPM keeps 1a..1d == Sl.20i.. and stays silent. */
    A(316,REQ(PMc.DeprBlockTot15Percent,RG(dpmBlk("Rate15"),"CapGainUs50")),"Schedule DCG: 1a (block @15%) must equal Sl.20i of Schedule DPM.");
    A(317,REQ(PMc.DeprBlockTot30Percent,RG(dpmBlk("Rate30"),"CapGainUs50")),"Schedule DCG: 1b (block @30%) must equal Sl.20ii of Schedule DPM.");
    A(318,REQ(PMc.DeprBlockTot40Percent,RG(dpmBlk("Rate40"),"CapGainUs50")),"Schedule DCG: 1c (block @40%) must equal Sl.20iii of Schedule DPM.");
    A(319,REQ(PMc.DeprBlockTot45Percent,RG(dpmBlk("Rate45"),"CapGainUs50")),"Schedule DCG: 1d (block @45%) must equal Sl.20iv of Schedule DPM.");
    /* 320–325 — building/furniture/intangible/ship blocks = Sl.17ii .. 17vii of
       Schedule DOA (Capital gains/loss u/s 50). No `if(I.ScheduleDOA)` guard: a
       return that reports deemed capital gains on these blocks while OMITTING
       Schedule DOA must fail. doaBlk defaults an absent DOA block to {}; a lawful
       return with Schedule DOA keeps the DCG summary == Sl.17.. and stays silent. */
    A(320,REQ(BDc.DeprBlockTot5Percent,RG(doaBlk("ScheduleDOA.Building.Rate5"),"CapGainUs50")),"Schedule DCG: 2a (building @5%) must equal Sl.17ii of Schedule DOA.");
    A(321,REQ(BDc.DeprBlockTot10Percent,RG(doaBlk("ScheduleDOA.Building.Rate10"),"CapGainUs50")),"Schedule DCG: 2b (building @10%) must equal Sl.17iii of Schedule DOA.");
    A(322,REQ(BDc.DeprBlockTot40Percent,RG(doaBlk("ScheduleDOA.Building.Rate40"),"CapGainUs50")),"Schedule DCG: 2c (building @40%) must equal Sl.17iv of Schedule DOA.");
    A(323,REQ(DCG.FurnitureSummary,RG(doaBlk("ScheduleDOA.FurnitureFittings.Rate10"),"CapGainUs50")),"Schedule DCG: 3 (furniture and fittings) must equal Sl.17v of Schedule DOA.");
    A(324,REQ(DCG.IntangibleAssetSummary,RG(doaBlk("ScheduleDOA.IntangibleAssets.Rate25"),"CapGainUs50")),"Schedule DCG: 4 (intangible assets) must equal Sl.17vi of Schedule DOA.");
    A(325,REQ(DCG.ShipsSummary,RG(doaBlk("ScheduleDOA.Ships.Rate20"),"CapGainUs50")),"Schedule DCG: 5 (ships) must equal Sl.17vii of Schedule DOA.");
  }

  /* 326 — Schedule CG A6e (deemed STCG on depreciable assets) = Sl.6 of Schedule DCG.
     No `if(I.ScheduleCG&&I.ScheduleDCG)` guard: a return that omits EITHER side of
     the cross-check — reporting A6e in Schedule CG without the backing Schedule DCG,
     or computing a DCG Sl.6 that is not carried into A6e — must fail. RG defaults an
     absent schedule to 0 on both sides, so a return with neither (no depreciable
     asset sale) stays silent, and a lawful return that carries both keeps A6e ==
     Sl.6 and stays silent. */
  A(326,REQ(RG(I,"ScheduleCG.ShortTermCapGain.SaleOnOtherAssets.DeemedSTCGDeprAsset"),RG(I,"ScheduleDCG.SummaryFromDeprSchCG.TotalDepreciation")),
    "Schedule CG: A6e (deemed STCG on depreciable assets) must equal Sl.6 of Schedule DCG.");

  /* ================= Schedule ESR (expenditure on scientific research) ================= */
  if(I.ScheduleESR){
    const DU=RG(I,"ScheduleESR.DeductionUs35",{});
    const ROWS=[["i","Section35_1_i","35(1)(i)"],["ii","Section35_1_ii","35(1)(ii)"],["iii","Section35_1_iia","35(1)(iia)"],
      ["iv","Section35_1_iii","35(1)(iii)"],["v","Section35_1_iv","35(1)(iv)"],["vi","Section35_2AA","35(2AA)"],
      ["vii","Section35_2AB","35(2AB)"],["viii","Section35_CCC","35CCC"],["ix","Section35_CCD","35CCD"]];
    let sumExcess=0;
    ROWS.forEach(function(r){
      const o=RG(DU,r[1]+".DeductUs35",null);
      if(!o||typeof o!=="object")return;                     /* no-op on empty row */
      const deb=N(o.AmtDebPL), allow=N(o.AmtUs35Allowable), exc=N(o.ExcessAmtOverDebPL);
      sumExcess+=Math.max(0,allow-deb);
      /* 327 — col (4) = MAX(0, col(3) − col(2)) per row */
      A(327,REQ(exc,Math.max(0,allow-deb)),"Schedule ESR "+r[2]+": col (4) must equal MAX(0, col (3) − col (2)).");
      /* 329–337 — col (3) (amount allowable) must equal col (2) (amount debited to P&L) per row */
      if(deb||allow){
        const sn=329+["i","ii","iii","iv","v","vi","vii","viii","ix"].indexOf(r[0]);
        A(sn,REQ(allow,deb),"Schedule ESR "+r[2]+": the amount of deduction allowable (col 3) must equal the amount debited to profit and loss account (col 2).");
      }
    });
    /* 328 — Total col (4) = MAX(0, Σ col (4) of rows i..ix) */
    const tot=RG(DU,"TotUs35.DeductUs35",null);
    if(tot&&typeof tot==="object")
      A(328,REQ(tot.ExcessAmtOverDebPL,Math.max(0,sumExcess)),"Schedule ESR: total (col 4) must equal the sum of rows (i + ii + iii + iv + v + vi + vii + viii + ix).");
  }

  /* ================= Schedule CG (capital gains) ================= */
  if(I.ScheduleCG){
    const ST=RG(I,"ScheduleCG.ShortTermCapGain",{}), LT=RG(I,"ScheduleCG.LongTermCapGain",{});
    /* dedn total (bv) present? — the s.48 deduction block. When a head's full value of
       consideration is zero, the s.48 total (bv) cannot be claimed (must be zero). */
    const noS48IfNoFVC=function(n,fvc,bv,label){A(n,N(fvc)!==0||N(bv)===0,label);};

    /* --- A1 (STCG land/building) : 340 · 348 · 349 · 350, per property --- */
    RG(ST,"SaleofLandBuild.SaleofLandBuildDtls",[]).forEach(function(d,i){
      const L="Schedule CG A1 property "+(i+1)+": ";
      /* 340 — if A1aiii (50C full value) is zero, s.48 expenses (A1bv) cannot be claimed */
      noS48IfNoFVC(340,d.FullConsideration50C,d.TotalDedn,L+"if the full value of consideration (A1aiii) is zero, the deduction u/s 48 (A1bv) cannot be claimed.");
      /* 348 — A1 bv (total) = bi + bii + biii + biv */
      A(348,REQ(d.TotalDedn,N(d.Reduction48iii)+N(d.AquisitCost)+N(d.ImproveCost)+N(d.ExpOnTrans)),L+"A1bv must equal bi + bii + biii + biv.");
      /* 349 — A1c (balance) = A1aiii − A1bv */
      A(349,REQ(d.Balance,N(d.FullConsideration50C)-N(d.TotalDedn)),L+"A1c (balance) must equal A1aiii − A1bv.");
      /* 350 — A1e = (1c<0 ? 1c : MAX(0, 1c − 1d)) i.e. balance less deduction u/s 54, floored */
      A(350,REQ(d.CapgainonAssets,N(d.Balance)<0?N(d.Balance):Math.max(0,N(d.Balance)-N(RG(d,"ExemptionOrDednUs54.ExemptionGrandTotal")))),L+"A1e must equal A1c − A1d (loss passes through; gain floored at zero).");
    });

    /* --- 341 · A3 (STCG equity/MF, STT paid) : per sub-head --- */
    RG(ST,"EquityMFonSTT",[]).forEach(function(e,i){
      noS48IfNoFVC(341,RG(e,"EquityMFonSTTDtls.FullConsideration"),RG(e,"EquityMFonSTTDtls.DeductSec48.TotalDedn"),
        "Schedule CG A3 sub-head "+(i+1)+": if the full value of consideration (A3a) is zero, the deduction u/s 48 (A3bv) cannot be claimed.");
    });
    /* --- 342 · A5 (STCG securities by FII u/s 115AD) --- */
    if(ST.NRISecur115AD)
      noS48IfNoFVC(342,RG(ST,"NRISecur115AD.FullConsideration"),RG(ST,"NRISecur115AD.DeductSec48.TotalDedn"),
        "Schedule CG A5: if the full value of consideration (A5aiii) is zero, the deduction u/s 48 (A5bv) cannot be claimed.");
    /* --- 343 · A6 (STCG other assets) --- */
    if(ST.SaleOnOtherAssets)
      noS48IfNoFVC(343,RG(ST,"SaleOnOtherAssets.FullConsideration"),RG(ST,"SaleOnOtherAssets.DeductSec48.TotalDedn"),
        "Schedule CG A6: if the full value of consideration (A6aiii) is zero, the deduction u/s 48 (A6bv) cannot be claimed.");

    /* --- 344 · B1 (LTCG land/building), per property --- */
    RG(LT,"SaleofLandBuild.SaleofLandBuildDtls",[]).forEach(function(d,i){
      noS48IfNoFVC(344,d.FullConsideration50C,d.TotalDedn,
        "Schedule CG B1 property "+(i+1)+": if the full value of consideration (B1aiii) is zero, the deduction u/s 48 (B1biv) cannot be claimed.");
    });
    /* --- 345 · B3 (LTCG listed securities/ZCB u/s 112(1)) --- */
    if(LT.Proviso112Applicable)
      noS48IfNoFVC(345,RG(LT,"Proviso112Applicable.Proviso112Applicabledtls.FullConsideration"),RG(LT,"Proviso112Applicable.Proviso112Applicabledtls.DeductSec48.TotalDedn"),
        "Schedule CG B3: if the full value of consideration (B3a) is zero, the deduction u/s 48 (B3bv) cannot be claimed.");
    /* --- 346 · B6 (LTCG non-resident securities u/s 112(1)(c)), per sub-head --- */
    RG(LT,"NRIOnSec112and115.NRIOnSec112and115Dtls",[]).forEach(function(d,i){
      noS48IfNoFVC(346,d.FullConsideration,RG(d,"DeductSec48.TotalDedn"),
        "Schedule CG B6 sub-head "+(i+1)+": if the full value of consideration (B6aiii) is zero, the deduction u/s 48 (B6bv) cannot be claimed.");
    });
    /* --- 347 · B8 (LTCG assets where B1–B7 not applicable) --- */
    if(RG(LT,"SaleofAssetNADtls.SaleofAssetNA",null))
      noS48IfNoFVC(347,RG(LT,"SaleofAssetNADtls.SaleofAssetNA.FullConsideration"),RG(LT,"SaleofAssetNADtls.SaleofAssetNA.DeductSec48.TotalDedn"),
        "Schedule CG B8: if the full value of consideration (B8aiii) is zero, the deduction u/s 48 (B8bv) cannot be claimed.");

    /* --- 338 · B12 total LTCG = B1g + B2e + B3c + B4 + B5 + B6c + B7 + B8e + B9 + B10 − B11a + B(A) --- */
    const b12=N(RG(LT,"SaleofLandBuild.TotalLTCGImmblPrprty"))
      +N(RG(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg.CapgainonAssets"))
      +N(RG(LT,"Proviso112Applicable.Proviso112Applicabledtls.BalanceCG"))
      +N(RG(LT,"SaleOfEquityShareUs112A.CapgainonAssets"))
      +N(RG(LT,"NRIProvisoSec48.BalanceCG"))
      +RSUM(RG(LT,"NRIOnSec112and115.NRIOnSec112and115Dtls",[]),"BalanceCG")
      +N(RG(LT,"NRISaleOfEquityShareUs112A.CapgainonAssets"))
      +N(RG(LT,"SaleofAssetNADtls.SaleofAssetNA.CapgainonAssets"))
      +N(RG(LT,"TotalAmtDeemedLtcg"))
      +N(RG(LT,"PassThrIncNatureLTCG"))
      -N(RG(LT,"TotalAmtNotTaxUsDTAALtcg"))
      +N(RG(LT,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"));
    A(338,REQ(LT.TotalLTCG,b12),"Schedule CG: B12 (total LTCG) must equal B1g + B2e + B3c + B4 + B5 + B6c + B7 + B8e + B9 + B10 − B11a + B(A).");

    /* --- 339 · C1 (sum of capital gain incomes) = Σ of 8ii..8vii (CurrYrCapGain) of table E --- */
    const E=RG(I,"ScheduleCG.CurrYrLosses",{});
    const c1=["InStcg20Per","InStcg30Per","InStcgAppRate","InStcgDTAARate","InLtcg12_5Per","InLtcgDTAARate"]
      .reduce((a,k)=>a+N(RG(E,k+".CurrYrCapGain")),0);
    A(339,REQ(RG(I,"ScheduleCG.SumOfCGIncm"),c1),"Schedule CG: C1 (sum of capital gain incomes) must equal 8ii + 8iii + 8iv + 8v + 8vi + 8vii of table E.");
  }
});
