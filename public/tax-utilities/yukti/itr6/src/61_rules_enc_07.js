/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_07 (Phase 6).
   Serial range A307–A356. Schedules covered:
     · Schedule DEP  (A307–A316) — depreciation summary vs Schedule DPM/DOA
     · Schedule DCG  (A317–A329) — deemed capital-gains summary vs DPM/DOA
     · Schedule ESR  (A330–A331) — s.35 weighted-deduction table
     · Schedule 80RA (A332–A335) — donation to research association totals
     · Schedule CG   (A336–A356) — Short/Long-term capital-gains ladder
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this
   return is lawful" assertion — is FALSE. Every read is guarded (RG / N /
   (X||{})); nothing throws. Keys are the built-return ITR6 schema paths
   (I = the ITR6 root), verified against sources/ITR-6 schema and the built
   sections (70_sec_bp: DPM/DOA/DEP/DCG/ESR, 70_sec_ded: Schedule80RA,
   70_sec_cg: ScheduleCG). REQ(a,b) is |a−b| ≤ 1; a zero-skeleton foots
   0==0 so an empty/lawful return never fires. Encoded from each rule's own
   text (constitution rule 6).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const arr=(o,p)=>{const v=RG(o,p,[]);return Array.isArray(v)?v:(v?[v]:[]);};

  /* =====================================================================
     Schedule DEP (A307–A316). The depreciation carried into each block of
     the DEP summary equals SL.No.17 (net aggregate) or SL.No.18
     (proportionate, "as applicable") of the matching DPM/DOA block —
     proportionate when it is entered (>0), else the net aggregate.
     ===================================================================== */
  if(I.ScheduleDEP){
    const DEP=RG(I,"ScheduleDEP.SummaryFromDeprSch",{})||{};
    const depAppl=base=>{const pro=N(RG(I,base+".ProportionateAggDepreciation",0));
      return pro>0?pro:N(RG(I,base+".NetAggregateDepreciation",0));};

    /* A307 — DEP P&M @15% = SL.No.17i/18i of Schedule DPM. */
    A(307, REQ(RG(DEP,"PlantMachinerySummary.DeprBlockTot15Percent",0),
        depAppl("ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail")),
      "Schedule DEP: block of plant & machinery @15% must equal SL.No.17i/18i of Schedule DPM (as applicable).");
    /* A308 — DEP P&M @30% = SL.No.17ii/18ii of Schedule DPM. */
    A(308, REQ(RG(DEP,"PlantMachinerySummary.DeprBlockTot30Percent",0),
        depAppl("ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail")),
      "Schedule DEP: block of plant & machinery @30% must equal SL.No.17ii/18ii of Schedule DPM (as applicable).");
    /* A309 — DEP P&M @40% = SL.No.17iii/18iii of Schedule DPM. */
    A(309, REQ(RG(DEP,"PlantMachinerySummary.DeprBlockTot40Percent",0),
        depAppl("ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail")),
      "Schedule DEP: block of plant & machinery @40% must equal SL.No.17iii/18iii of Schedule DPM (as applicable).");
    /* A310 — DEP P&M @45% = SL.No.17iv/18iv of Schedule DPM. */
    A(310, REQ(RG(DEP,"PlantMachinerySummary.DeprBlockTot45Percent",0),
        depAppl("ScheduleDPM.PlantMachinery.Rate45.DepreciationDetail")),
      "Schedule DEP: block of plant & machinery @45% must equal SL.No.17iv/18iv of Schedule DPM (as applicable).");
    /* A311 — DEP Building @5% = SL.No.14ii/15ii of Schedule DOA. */
    A(311, REQ(RG(DEP,"BuildingSummary.DeprBlockTot5Percent",0),
        depAppl("ScheduleDOA.Building.Rate5.DepreciationDetail")),
      "Schedule DEP: block of building @5% must equal SL.No.14ii/15ii of Schedule DOA (as applicable).");
    /* A312 — DEP Building @10% = SL.No.14iii/15iii of Schedule DOA. */
    A(312, REQ(RG(DEP,"BuildingSummary.DeprBlockTot10Percent",0),
        depAppl("ScheduleDOA.Building.Rate10.DepreciationDetail")),
      "Schedule DEP: block of building @10% must equal SL.No.14iii/15iii of Schedule DOA (as applicable).");
    /* A313 — DEP Building @40% = SL.No.14iv/15iv of Schedule DOA. */
    A(313, REQ(RG(DEP,"BuildingSummary.DeprBlockTot40Percent",0),
        depAppl("ScheduleDOA.Building.Rate40.DepreciationDetail")),
      "Schedule DEP: block of building @40% must equal SL.No.14iv/15iv of Schedule DOA (as applicable).");
    /* A314 — DEP furniture & fittings = SL.No.14v/15v of Schedule DOA. */
    A(314, REQ(RG(DEP,"FurnitureSummary",0),
        depAppl("ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail")),
      "Schedule DEP: block of furniture & fittings must equal SL.No.14v/15v of Schedule DOA (as applicable).");
    /* A315 — DEP intangible assets = SL.No.14vi/15vi of Schedule DOA. */
    A(315, REQ(RG(DEP,"IntangibleAssetSummary",0),
        depAppl("ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail")),
      "Schedule DEP: block of intangible assets must equal SL.No.14vi/15vi of Schedule DOA (as applicable).");
    /* A316 — DEP ships = SL.No.14vii/15vii of Schedule DOA. */
    A(316, REQ(RG(DEP,"ShipsSummary",0),
        depAppl("ScheduleDOA.Ships.Rate20.DepreciationDetail")),
      "Schedule DEP: block of ships must equal SL.No.14vii/15vii of Schedule DOA (as applicable).");
  }

  /* =====================================================================
     Schedule DCG (A317–A329). Deemed capital gains u/s 50. Each block =
     SL.No.20 (DPM) / SL.No.17 (DOA) capital-gain-u/s-50 of the matching
     block; the P&M / building / grand totals foot their rows.
     ===================================================================== */
  if(I.ScheduleDCG){
    const DCG=RG(I,"ScheduleDCG.SummaryFromDeprSchCG",{})||{};
    const cg50=base=>N(RG(I,base+".CapGainUs50",0));

    /* A317 — total deemed CG on P&M = 1a+1b+1c+1d. */
    A(317, REQ(RG(DCG,"PlantMachinerySummaryCG.TotPlntMach",0),
        N(RG(DCG,"PlantMachinerySummaryCG.DeprBlockTot15Percent",0))
        +N(RG(DCG,"PlantMachinerySummaryCG.DeprBlockTot30Percent",0))
        +N(RG(DCG,"PlantMachinerySummaryCG.DeprBlockTot40Percent",0))
        +N(RG(DCG,"PlantMachinerySummaryCG.DeprBlockTot45Percent",0))),
      "Schedule DCG: total deemed capital gains on plant & machinery must equal 1a + 1b + 1c + 1d.");
    /* A318 — total deemed CG on building = 2a+2b+2c. */
    A(318, REQ(RG(DCG,"BuildingSummaryCG.TotBuildng",0),
        N(RG(DCG,"BuildingSummaryCG.DeprBlockTot5Percent",0))
        +N(RG(DCG,"BuildingSummaryCG.DeprBlockTot10Percent",0))
        +N(RG(DCG,"BuildingSummaryCG.DeprBlockTot40Percent",0))),
      "Schedule DCG: total deemed capital gains on building must equal 2a + 2b + 2c.");
    /* A319 — total deemed CG on depreciable assets = 1e+2d+3+4+5. */
    A(319, REQ(RG(DCG,"TotalDepreciation",0),
        N(RG(DCG,"PlantMachinerySummaryCG.TotPlntMach",0))
        +N(RG(DCG,"BuildingSummaryCG.TotBuildng",0))
        +N(RG(DCG,"FurnitureSummary",0))+N(RG(DCG,"IntangibleAssetSummary",0))
        +N(RG(DCG,"ShipsSummary",0))),
      "Schedule DCG: total deemed capital gains on depreciable assets must equal 1e + 2d + 3 + 4 + 5.");
    /* A320 — DCG P&M @15% = SL.No.20i of Schedule DPM. */
    A(320, REQ(RG(DCG,"PlantMachinerySummaryCG.DeprBlockTot15Percent",0),
        cg50("ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail")),
      "Schedule DCG: plant & machinery @15% must equal SL.No.20i of Schedule DPM.");
    /* A321 — DCG P&M @30% = SL.No.20ii of Schedule DPM. */
    A(321, REQ(RG(DCG,"PlantMachinerySummaryCG.DeprBlockTot30Percent",0),
        cg50("ScheduleDPM.PlantMachinery.Rate30.DepreciationDetail")),
      "Schedule DCG: plant & machinery @30% must equal SL.No.20ii of Schedule DPM.");
    /* A322 — DCG P&M @40% = SL.No.20iii of Schedule DPM. */
    A(322, REQ(RG(DCG,"PlantMachinerySummaryCG.DeprBlockTot40Percent",0),
        cg50("ScheduleDPM.PlantMachinery.Rate40.DepreciationDetail")),
      "Schedule DCG: plant & machinery @40% must equal SL.No.20iii of Schedule DPM.");
    /* A323 — DCG P&M @45% = SL.No.20iv of Schedule DPM. */
    A(323, REQ(RG(DCG,"PlantMachinerySummaryCG.DeprBlockTot45Percent",0),
        cg50("ScheduleDPM.PlantMachinery.Rate45.DepreciationDetail")),
      "Schedule DCG: plant & machinery @45% must equal SL.No.20iv of Schedule DPM.");
    /* A324 — DCG Building @5% = SL.No.17ii of Schedule DOA. */
    A(324, REQ(RG(DCG,"BuildingSummaryCG.DeprBlockTot5Percent",0),
        cg50("ScheduleDOA.Building.Rate5.DepreciationDetail")),
      "Schedule DCG: building @5% must equal SL.No.17ii of Schedule DOA.");
    /* A325 — DCG Building @10% = SL.No.17iii of Schedule DOA. */
    A(325, REQ(RG(DCG,"BuildingSummaryCG.DeprBlockTot10Percent",0),
        cg50("ScheduleDOA.Building.Rate10.DepreciationDetail")),
      "Schedule DCG: building @10% must equal SL.No.17iii of Schedule DOA.");
    /* A326 — DCG Building @40% = SL.No.17iv of Schedule DOA. */
    A(326, REQ(RG(DCG,"BuildingSummaryCG.DeprBlockTot40Percent",0),
        cg50("ScheduleDOA.Building.Rate40.DepreciationDetail")),
      "Schedule DCG: building @40% must equal SL.No.17iv of Schedule DOA.");
    /* A327 — DCG furniture & fittings = SL.No.17v of Schedule DOA. */
    A(327, REQ(RG(DCG,"FurnitureSummary",0),
        cg50("ScheduleDOA.FurnitureFittings.Rate10.DepreciationDetail")),
      "Schedule DCG: furniture & fittings must equal SL.No.17v of Schedule DOA.");
    /* A328 — DCG intangible assets = SL.No.17vi of Schedule DOA. */
    A(328, REQ(RG(DCG,"IntangibleAssetSummary",0),
        cg50("ScheduleDOA.IntangibleAssets.Rate25.DepreciationDetail")),
      "Schedule DCG: intangible assets must equal SL.No.17vi of Schedule DOA.");
    /* A329 — DCG ships = SL.No.17vii of Schedule DOA. */
    A(329, REQ(RG(DCG,"ShipsSummary",0),
        cg50("ScheduleDOA.Ships.Rate20.DepreciationDetail")),
      "Schedule DCG: ships must equal SL.No.17vii of Schedule DOA.");
  }

  /* =====================================================================
     Schedule ESR (A330–A331). s.35 weighted-deduction table: col(2)=amount
     debited, col(3)=amount allowable, col(4)=excess over debited.
     ===================================================================== */
  if(I.ScheduleESR){
    const ESRROWS=["Section35_1_i","Section35_1_ii","Section35_1_iia","Section35_1_iii",
      "Section35_1_iv","Section35_2AA","Section35_2AB","Section35_CCC","Section35_CCD"];
    const DU="ScheduleESR.DeductionUs35.";

    /* A330 — each row: col(4) excess = MAX(0, col(3) − col(2)); (4)=(3)−(2). */
    ESRROWS.forEach(function(k){
      const b=DU+k+".DeductUs35.";
      A(330, REQ(N(RG(I,b+"ExcessAmtOverDebPL",0)),
          Math.max(0, N(RG(I,b+"AmtUs35Allowable",0))-N(RG(I,b+"AmtDebPL",0)))),
        "Schedule ESR: amount of deduction in excess of the amount debited to P&L (col 4) must equal (col 3) − (col 2).");
    });
    /* A331 — SL.No.x (total) = sum of the individual rows (each column). */
    const totb=DU+"TotUs35.DeductUs35.";
    let tDeb=0,tAllow=0,tExc=0;
    ESRROWS.forEach(function(k){const b=DU+k+".DeductUs35.";
      tDeb+=N(RG(I,b+"AmtDebPL",0));tAllow+=N(RG(I,b+"AmtUs35Allowable",0));tExc+=N(RG(I,b+"ExcessAmtOverDebPL",0));});
    A(331, REQ(N(RG(I,totb+"AmtDebPL",0)),tDeb)
        && REQ(N(RG(I,totb+"AmtUs35Allowable",0)),tAllow)
        && REQ(N(RG(I,totb+"ExcessAmtOverDebPL",0)),tExc),
      "Schedule ESR: SL.No.x (total) must equal the sum of the individual rows (c) + ii + iii + iv + v + vi + vii + viii + ix.");
  }

  /* =====================================================================
     Schedule 80RA (A332–A335). Donation to research associations u/s 35.
     ===================================================================== */
  if(I.Schedule80RA){
    const RA=RG(I,"Schedule80RA",{})||{};
    const rows=arr(RA,"DonationDtlsRsrchAssctn");
    const sCash=rows.reduce((a,r)=>a+N((r||{}).DonationAmtCash),0);
    const sOth =rows.reduce((a,r)=>a+N((r||{}).DonationAmtOtherMode),0);
    const sTot =rows.reduce((a,r)=>a+N((r||{}).DonationAmt),0);

    /* A332 — total donation = donation in cash + donation in other mode. */
    A(332, REQ(N(RA.TotalDonationsUs80RA),
        N(RA.TotalDonationAmtCash80RA)+N(RA.TotalDonationAmtOtherMode80RA)),
      "Schedule RA: total donation must equal donation in cash + donation in other mode.");
    /* A333 — total donation in cash = the bifurcation (row sum) of cash donations. */
    A(333, REQ(N(RA.TotalDonationAmtCash80RA), sCash),
      "Schedule RA: total donation in cash must equal the sum of the cash-donation rows.");
    /* A334 — total donation in other mode = the bifurcation (row sum) of other-mode donations. */
    A(334, REQ(N(RA.TotalDonationAmtOtherMode80RA), sOth),
      "Schedule RA: total donation in other mode must equal the sum of the other-than-cash-donation rows.");
    /* A335 — total donation = the bifurcation (row sum) of total donations. */
    A(335, REQ(N(RA.TotalDonationsUs80RA), sTot),
      "Schedule RA: total donation must equal the sum of the per-donee total-donation rows.");
  }

  /* =====================================================================
     Schedule CG (A336–A356). Short-term (Part A) / Long-term (Part B) /
     summary (Part C) capital-gains ladder. Per-row blocks are checked with
     forEach so the rule holds for whichever block is present; the required
     zero-stub blocks (Slump/OtherAssets/NR) foot 0==0 on a resident return.
     ===================================================================== */
  if(I.ScheduleCG){
    const ST=RG(I,"ScheduleCG.ShortTermCapGain",{})||{};
    const LT=RG(I,"ScheduleCG.LongTermCapGain",{})||{};

    /* A336 — A6e (deemed STCG on depreciable assets) = pt.6 of Schedule DCG. */
    A(336, REQ(N(RG(ST,"SaleOnOtherAssets.DeemedSTCGDeprAsset",0)),
        N(RG(I,"ScheduleDCG.SummaryFromDeprSchCG.TotalDepreciation",0))),
      "Schedule CG: A6e must equal the value of pt.6 (total deemed capital gains) of Schedule DCG.");

    /* A337 — A10 (Total STCG) = ΣA1e + A2c + A3e + A4a + A4b + A5e + A6g + A7 + A8 − A9a + A(A). */
    const stLand=arr(ST,"SaleofLandBuild.SaleofLandBuildDtls");
    const stA1e=stLand.reduce((a,r)=>a+N((r||{}).CapgainonAssets),0);
    const stEq=arr(ST,"EquityMFonSTT");
    const stA3e=stEq.reduce((a,r)=>a+N(RG(r||{},"EquityMFonSTTDtls.CapgainonAssets",0)),0);
    A(337, REQ(N(RG(ST,"TotalSTCG",0)),
        stA1e
        +N(RG(ST,"SlumpSaleInStcg.CapgainonAssets",0))
        +stA3e
        +N(RG(ST,"NRITransacSec48Dtl.NRItaxSTTPaid",0))
        +N(RG(ST,"NRITransacSec48Dtl.NRItaxSTTNotPaid",0))
        +N(RG(ST,"NRISecur115AD.CapgainonAssets",0))
        +N(RG(ST,"SaleOnOtherAssets.CapgainonAssets",0))
        +N(RG(ST,"TotalAmtDeemedStcg",0))
        +N(RG(ST,"PassThrIncNatureSTCG",0))
        -N(RG(ST,"TotalAmtNotTaxUsDTAAStcg",0))
        +N(RG(ST,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares",0))),
      "Schedule CG: A10 (Total STCG) must equal ΣA1e + A2c + A3e + A4a + A4b + A5e + A6g + A7 + A8 − A9a + A(A).");

    /* A338 — B12 (Total LTCG) = B1g + B2e + B3c + B4 + B5 + B6c + B7 + B8e + B9 + B10 − B11a + B(A). */
    A(338, REQ(N(RG(LT,"TotalLTCG",0)),
        N(RG(LT,"SaleofLandBuild.TotalLTCGImmblPrprty",0))
        +N(RG(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg.CapgainonAssets",0))
        +N(RG(LT,"Proviso112Applicable.Proviso112Applicabledtls.BalanceCG",0))
        +N(RG(LT,"SaleOfEquityShareUs112A.CapgainonAssets",0))
        +N(RG(LT,"NRIProvisoSec48.BalanceCG",0))
        +N(RG(LT,"NRIOnSec112and115.TotalNRIOnSec112and115",0))
        +N(RG(LT,"NRISaleOfEquityShareUs112A.CapgainonAssets",0))
        +N(RG(LT,"SaleofAssetNADtls.SaleofAssetNA.CapgainonAssets",0))
        +N(RG(LT,"TotalAmtDeemedLtcg",0))
        +N(RG(LT,"PassThrIncNatureLTCG",0))
        -N(RG(LT,"TotalAmtNotTaxUsDTAALtcg",0))
        +N(RG(LT,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares",0))),
      "Schedule CG: B12 (Total LTCG) must equal B1g + B2e + B3c + B4 + B5 + B6c + B7 + B8e + B9 + B10 − B11a + B(A).");

    /* A339 — C1 (SumOfCGIncm) = sum of 8ii..8vii (CurrYrCapGain) of Table E. */
    const CYL=RG(I,"ScheduleCG.CurrYrLosses",{})||{};
    const c1=["InStcg20Per","InStcg30Per","InStcgAppRate","InStcgDTAARate","InLtcg12_5Per","InLtcgDTAARate"]
      .reduce((a,k)=>a+N(RG(CYL,k+".CurrYrCapGain",0)),0);
    A(339, REQ(N(RG(I,"ScheduleCG.SumOfCGIncm",0)), c1),
      "Schedule CG: C1 must equal the sum of 8ii + 8iii + 8iv + 8v + 8vi + 8vii of Table E.");

    /* A340 — A1b(iv) expenses u/s 48 cannot be claimed if A1aiii (FVC) not offered to tax. */
    stLand.forEach(function(r){r=r||{};
      A(340, N(r.FullConsideration50C)!==0 || N(r.TotalDedn)===0,
        "Schedule CG: expenses u/s 48 (A1b(iv)) cannot be claimed when the full value of consideration (A1aiii) is not offered to tax.");
    });
    /* A341 — A3b(iv) expenses cannot be claimed if A3a (FVC) not offered to tax. */
    stEq.forEach(function(r){const d=RG(r||{},"EquityMFonSTTDtls",{})||{};
      A(341, N(d.FullConsideration)!==0 || N(RG(d,"DeductSec48.TotalDedn",0))===0,
        "Schedule CG: expenses u/s 48 (A3b(iv)) cannot be claimed when the full value of consideration (A3a) is not offered to tax.");
    });
    /* A342 — A5b(iv) expenses cannot be claimed if A5aiii (FVC) not offered to tax. */
    {const d=RG(ST,"NRISecur115AD",{})||{};
      A(342, N(d.FullConsideration)!==0 || N(RG(d,"DeductSec48.TotalDedn",0))===0,
        "Schedule CG: expenses u/s 48 (A5b(iv)) cannot be claimed when the full value of consideration (A5aiii) is not offered to tax.");}
    /* A343 — A6b(iv) expenses cannot be claimed if A6aiii (FVC) not offered to tax. */
    {const d=RG(ST,"SaleOnOtherAssets",{})||{};
      A(343, N(d.FullConsideration)!==0 || N(RG(d,"DeductSec48.TotalDedn",0))===0,
        "Schedule CG: expenses u/s 48 (A6b(iv)) cannot be claimed when the full value of consideration (A6aiii) is not offered to tax.");}
    /* A344 — B1b(iv) expenses cannot be claimed if B1aiii (FVC) not offered to tax. */
    arr(LT,"SaleofLandBuild.SaleofLandBuildDtls").forEach(function(r){r=r||{};
      A(344, N(r.FullConsideration50C)!==0 || N(r.TotalDedn)===0,
        "Schedule CG: expenses u/s 48 (B1b(iv)) cannot be claimed when the full value of consideration (B1aiii) is not offered to tax.");
    });
    /* A345 — B3b(iv) expenses cannot be claimed if B3a (FVC) not offered to tax. */
    {const d=RG(LT,"Proviso112Applicable.Proviso112Applicabledtls",{})||{};
      A(345, N(d.FullConsideration)!==0 || N(RG(d,"DeductSec48.TotalDedn",0))===0,
        "Schedule CG: expenses u/s 48 (B3b(iv)) cannot be claimed when the full value of consideration (B3a) is not offered to tax.");}
    /* A346 — B6b(iv) expenses cannot be claimed if B6aiii (FVC) not offered to tax. */
    arr(LT,"NRIOnSec112and115.NRIOnSec112and115Dtls").forEach(function(r){r=r||{};
      A(346, N(r.FullConsideration)!==0 || N(RG(r,"DeductSec48.TotalDedn",0))===0,
        "Schedule CG: expenses u/s 48 (B6b(iv)) cannot be claimed when the full value of consideration (B6aiii) is not offered to tax.");
    });

    /* A347 — A1b(iv) Total = A1(bi + bii + biii). */
    stLand.forEach(function(r){r=r||{};
      A(347, REQ(N(r.TotalDedn), N(r.AquisitCost)+N(r.ImproveCost)+N(r.ExpOnTrans)),
        "Schedule CG: A1b(iv) total must equal A1(bi + bii + biii).");
    });
    /* A348 — A1c Balance = A1(aiii − biv). */
    stLand.forEach(function(r){r=r||{};
      A(348, REQ(N(r.Balance), N(r.FullConsideration50C)-N(r.TotalDedn)),
        "Schedule CG: A1c balance must equal A1(aiii − biv).");
    });
    /* A349 — A1e = A(1c − 1d) if 1c>1d, else 0. */
    stLand.forEach(function(r){r=r||{};
      const c=N(r.Balance), d=N(RG(r,"ExemptionOrDednUs54.ExemptionGrandTotal",0));
      A(349, REQ(N(r.CapgainonAssets), c>d?(c-d):0),
        "Schedule CG: A1e must equal A(1c − 1d) when 1c > 1d, else 0.");
    });
    /* A350 — A2c = A(2aiii − 2b). */
    {const s=RG(ST,"SlumpSaleInStcg",{})||{};
      A(350, REQ(N(s.CapgainonAssets), N(s.FullConsideration)-N(s.NetWorthOfDivision)),
        "Schedule CG: A2c must equal A(2aiii − 2b).");}
    /* A351 — A3b(iv) Total = A3(bi + bii + biii). */
    stEq.forEach(function(r){const dd=RG(r||{},"EquityMFonSTTDtls.DeductSec48",{})||{};
      A(351, REQ(N(dd.TotalDedn), N(dd.AquisitCost)+N(dd.ImproveCost)+N(dd.ExpOnTrans)),
        "Schedule CG: A3b(iv) total must equal A3(bi + bii + biii).");
    });
    /* A352 — A3c Balance = A(3a − biv). */
    stEq.forEach(function(r){const d=RG(r||{},"EquityMFonSTTDtls",{})||{};
      A(352, REQ(N(d.BalanceCG), N(d.FullConsideration)-N(RG(d,"DeductSec48.TotalDedn",0))),
        "Schedule CG: A3c balance must equal A(3a − biv).");
    });
    /* A353 — A3e = A(3c + 3d). */
    stEq.forEach(function(r){const d=RG(r||{},"EquityMFonSTTDtls",{})||{};
      A(353, REQ(N(d.CapgainonAssets), N(d.BalanceCG)+N(d.LossSec94of7Or94of8)),
        "Schedule CG: A3e must equal A(3c + 3d).");
    });
    /* A354 — A5(a)(ic) = higher of A5(a)(ia) or A5(a)(ib). */
    {const d=RG(ST,"NRISecur115AD",{})||{};
      A(354, REQ(N(d.FullValueConsdSec50CA), Math.max(N(d.FullValueConsdRecvUnqshr),N(d.FairMrktValueUnqshr))),
        "Schedule CG: A5(a)(ic) must be the higher of A5(a)(ia) or A5(a)(ib).");}
    /* A355 — A5(aiii) = A5[(a)(ic) + (aii)]. */
    {const d=RG(ST,"NRISecur115AD",{})||{};
      A(355, REQ(N(d.FullConsideration), N(d.FullValueConsdSec50CA)+N(d.FullValueConsdOthUnqshr)),
        "Schedule CG: A5(aiii) must equal A5[(a)(ic) + (aii)].");}
    /* A356 — A5b(iv) Total = A5(bi + bii + biii). */
    {const dd=RG(ST,"NRISecur115AD.DeductSec48",{})||{};
      A(356, REQ(N(dd.TotalDedn), N(dd.AquisitCost)+N(dd.ImproveCost)+N(dd.ExpOnTrans)),
        "Schedule CG: A5b(iv) total must equal A5(bi + bii + biii).");}
  }
});
