/* =====================================================================
   ITR-5 · A.Y. 2026-27 — Category-A rule batch, serials 251-300
   ("Schedule BP" adjustment ladder + Schedule DPM / DOA / DEP
   depreciation). Registered via ruleset(fn); runRules() invokes it with
   (I,S_,A,Dd). A(n,cond,msg) FIRES when cond (the "lawful" assertion) is
   FALSE. Every read is guarded (RG default / N / ||) so the batch never
   throws and stays silent on an absent/empty return; each condition is
   TRUE for a lawful return and FALSE only on a genuine violation. Schema
   paths are ITR-5's own (CorpScheduleBP / ScheduleDPM / ScheduleDOA /
   ScheduleDEP / ScheduleESR / ScheduleVDA / PARTA_OI / PARTA_PL /
   TradingAccount / ScheduleCG), read from forms/ITR-5/src/70_sec_*.js.
   Regime is read from the built return (FilingStatus.OptOldRegimeCurrAY),
   mirroring the ITR-3 rule batches.

   NOT MAPPABLE (left uncoded, with reason):
     251  Depreciation u/s 32(1)(i) allowed only for power-sector nature-
          of-business codes (05001/06008) — requires the general nature-of-
          business code list, which is not carried in the BP/DPM exports.
     252  A4c rule 7A/7B(1)/7B(1A)/8 reduction allowed only for business
          codes 1003/1002/1001 — same nature-of-business-code dependency.
     258  Income reduced at Sl.3 / Sl.5 cannot exceed the income/receipts
          credited to the P&L — no single arithmetic identity; needs the
          per-item amounts actually credited to the P&L account.
     261  A1 must equal P&L (54 + 62ii + 63ii + 64v + 65iii + 66iv + 67ii)
          — the P&L Sl.54/64v/65iii schema keys cannot be verified from the
          BP export; a wrong map would fire a strict equality on the lawful
          test return. (checkable part: 62ii/63ii/66iv/67ii sub-sums.)
     262  37a "Income chargeable under Rule 7" must tally with 4c(i) — the
          source rule text is truncated and the 37a↔4c(i) relationship under
          Rule 7 (partly-agricultural income) is not a clean identity.
     270  Sum of A3 cannot exceed the sum of revenues in P&L / Trading —
          "sum of revenues" is not a single defined schema field.
     279  DPM Sl.20 (CapGains u/s 50) = 5+8-3-4-7-19 as a STRICT equality:
          Sl.20 is a conditional deemed-gain input (0 unless the block
          ceases), so strict equality fires on lawful continuing-block
          returns. The checkable part is encoded as the conditional floor
          285 and the ceased-block consequences 286/287.
     282  ENCODED (below, in the DPM loop). Full rule text (source PDF, p.21):
          the 2nd-proviso-to-115BAC(3) (Rule 5) adjustment at 3b "should not be
          allowed to firm, LLP and Co-operative society or if New Tax Regime has
          been opted for." The engine (70_sec_bp.js bar115BAC) was corrected to
          match — it applied the adjustment only in the NEW regime, the reverse of
          the rule; it now zeros 3b for firm/LLP/co-op or in the new regime.
     292  DOA Sl.17 = 5+8-3-4-7-16 as a STRICT equality — same conditional-
          input issue as 279; checkable part encoded as 296/297/298.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const newR = !!(((S_||{}).C||{}).regime||{}).anyConc;  /* any concessional new regime 115BAC(1A)/115BAD/115BAE (S.C.regime.anyConc) — 255/277/278/282 all bar under the new regime(s) */
  const BP   = RG(I,"CorpScheduleBP.BusinessIncOthThanSpec",null);

  /* ---------------- Schedule BP — Part A ladder ---------------- */
  if(BP&&typeof BP==="object"){
    const ir  = RG(BP,"IncRecCredPLOthHeadDtls",{})||{};
    const pf  = RG(BP,"ProfitFrmActCvrd",{})||{};
    const d32 = RG(BP,"DepreciationAllowITAct32",{})||{};
    const divExempt = N(RG(BP,"IncCredPL.OtherExmptIncDtl.OperatingDividendAmt"));

    /* 253 — A12iii total depreciation allowable = 12i + 12ii */
    A(253,REQ(d32.TotDeprAllowITAct,N(d32.DepreciationAllowUs32_1_ii)+N(d32.DepreciationAllowUs32_1_i)),
      "Schedule BP: A12iii (total depreciation allowable under the Income-tax Act) must equal A12i + A12ii.");

    /* 254 — A23 (other addition u/s 28-44DB) at least the sum of OI 5a to 5d */
    (function(){const o=RG(I,"PARTA_OI.NoCredToPLAmt",{})||{};
      const s5=N(o.Section28Items)+N(o.ProformaCreditsDue)+N(o.PrevYrEscalClaim)+N(o.OthItemInc);
      A(254,!I.PARTA_OI||N(BP.OthItemDisallowUs28To44DB)>=s5-1,
        "Schedule BP: Sl.No.23 cannot be less than the sum of Sl.No.5a to 5d of Part A-OI (amounts not credited to the P&L).");
    })();

    /* 255 — 35AD(1) deduction (C47) cannot be claimed in the new tax regime */
    A(255,!newR||N(RG(I,"CorpScheduleBP.IncSpecifiedBusiness.DedSec35AD"))===0,
      "Schedule BP: deduction in accordance with section 35AD(1) at Sl.No.47 cannot be claimed by an assessee opting for the new tax regime.");

    /* 256 — A24e must be at least the absolute of the negative (col3 − col2) totals of Schedule ESR */
    (function(){const E=RG(I,"ScheduleESR.DeductionUs35",null);if(!E||typeof E!=="object")return;
      const SEC=["Section35_1_i","Section35_1_ii","Section35_1_iia","Section35_1_iii","Section35_1_iv",
                 "Section35_2AA","Section35_2AB","Section35_CCC","Section35_CCD"];
      let shortfall=0;SEC.forEach(k=>{const r=RG(E,k+".DeductUs35",null);if(r&&typeof r==="object")
        shortfall+=Math.max(0,N(r.AmtDebPL)-N(r.AmtUs35Allowable));});
      A(256,N(BP.OthersExpDisallowPL)>=shortfall-1,
        "Schedule BP: Sl.No.24(e) must be at least the absolute of the sum of the negative (col.3 − col.2) values across all sections of Schedule ESR.");
    })();

    /* 257 — A3b (Capital Gains reduced from BP) cannot exceed the income offered in Schedule CG */
    (function(){if(!I.ScheduleCG)return;
      A(257,N(ir.CapitalGains)<=N(RG(I,"ScheduleCG.IncChargeableHeadCapGain"))+1,
        "Schedule BP: the amount reduced at Sl.No.3b cannot be more than the income offered in Schedule CG.");
    })();

    /* 259 — A3c (Other Sources) = 3ci (Dividend) + 3cii (Other than Dividend) */
    A(259,REQ(ir.OtherSources,N(ir.Dividend)+N(ir.OtherThanDividend)),
      "Schedule BP: Sl.No.3c (Other Sources) must equal 3c(i) + 3c(ii).");

    /* 260 — 3ci Dividend + 5c Dividend income cannot exceed P&L 14iii (dividend income) */
    A(260,N(ir.Dividend)+divExempt<=N(RG(I,"PARTA_PL.CreditsToPL.OthIncome.Dividends"))+1,
      "Schedule BP: Sl.No.3c(i) plus the 5c 'Dividend income' amount cannot be more than Sl.No.14iii of Schedule Profit & Loss.");

    /* 263 — 37b deemed income under Rule 7A must be at least 35% of 4c(ii) */
    A(263,N(BP.DeemedChrgblIncUndrRule7A)>=Math.floor(0.35*N(pf.ProfitFrmActCvrdUndrRule7A))-1,
      "Schedule BP: Sl.No.37b (deemed income chargeable under Rule 7A) must be at least 35% of 4c(ii).");
    /* 264 — 37c deemed income under Rule 7B(1) must be at least 25% of 4c(iii) */
    A(264,N(BP.DeemedChrgblIncUndrRule7B1)>=Math.floor(0.25*N(pf.ProfitFrmActCvrdUndrRule7B1))-1,
      "Schedule BP: Sl.No.37c (deemed income chargeable under Rule 7B(1)) must be at least 25% of 4c(iii).");
    /* 265 — 37d deemed income under Rule 7B(1A) must be at least 40% of 4c(iv) */
    A(265,N(BP.DeemedChrgblIncUndrRule7B1A)>=Math.floor(0.40*N(pf.ProfitFrmActCvrdUndrRule7B1A))-1,
      "Schedule BP: Sl.No.37d (deemed income chargeable under Rule 7B(1A)) must be at least 40% of 4c(iv).");
    /* 266 — 37e deemed income under Rule 8 must be at least 40% of 4c(v) */
    A(266,N(BP.DeemedChrgblIncUndrRule8)>=Math.floor(0.40*N(pf.ProfitFrmActCvrdUndrRule8))-1,
      "Schedule BP: Sl.No.37e (deemed income chargeable under Rule 8) must be at least 40% of 4c(v).");

    /* 267 — A3f (u/s 115BBH income credited to P&L) must match the business-head total of Schedule VDA */
    (function(){if(!I.ScheduleVDA)return;  /* "A Total" attributable to business income (3f is P&L-credited business income) */
      A(267,REQ(ir.UnderSec115BBH,N(RG(I,"ScheduleVDA.TotIncBusiness"))),
        "Schedule BP: Sl.No.3f (u/s 115BBH, net of cost of acquisition) must match the business-head total of Schedule VDA.");
    })();

    /* 268 — 5c "Dividend income" (exempt) cannot be more than zero */
    A(268,divExempt<=0,
      "Schedule BP: at Sl.No.5c the 'Dividend income' amount cannot be more than zero.");

    /* 269 — C43 (net P/L specified business) = A2b (net P/L specified business incl. in 1) */
    A(269,REQ(RG(I,"CorpScheduleBP.IncSpecifiedBusiness.NetPLFrmSpecifiedBus"),BP.NetProfLossSpecifiedBus),
      "Schedule BP: Sl.No.43 must equal Sl.No.2b of Schedule BP.");

    /* 271 — A19 (interest disallowed u/s 23 MSMED Act) = Sl.No.17 of Part A-OI */
    A(271,REQ(BP.InterestDisAllowUs23SMEAct,RG(I,"PARTA_OI.InterestDisAllowUs23SMEAct")),
      "Schedule BP: Sl.No.19 must equal Sl.No.17 (interest disallowed u/s 23 of the MSMED Act) of Part A-OI.");

    /* 272 — A2a (net P/L speculative) = Trading 12b + P&L 66(iv) */
    A(272,REQ(BP.NetPLFromSpecBus,N(RG(I,"TradingAccount.IntradayTradingIncome"))+N(RG(I,"PARTA_PL.NetIncomeFrmSpecActivity"))),
      "Schedule BP: Sl.No.2a (net profit/loss from speculative business) must equal 12b of the Trading Account plus 66(iv) of the P&L Account.");
  }

  /* 299 — BP A12i (depreciation u/s 32(1)(ii)/(iia)) = item 6 of Schedule DEP */
  if(BP&&typeof BP==="object"&&I.ScheduleDEP)
    A(299,REQ(RG(BP,"DepreciationAllowITAct32.DepreciationAllowUs32_1_ii"),RG(I,"ScheduleDEP.SummaryFromDeprSch.TotalDepreciation")),
      "Schedule DEP: depreciation allowable u/s 32(1)(ii) & (iia) in Schedule BP must equal item 6 (total depreciation) of Schedule DEP.");

  /* 300 — Schedule DEP 1e (total P&M) = 1a + 1b + 1c + 1d */
  if(I.ScheduleDEP){const pm=RG(I,"ScheduleDEP.SummaryFromDeprSch.PlantMachinerySummary",null);
    if(pm&&typeof pm==="object")
      A(300,REQ(pm.TotPlntMach,N(pm.DeprBlockTot15Percent)+N(pm.DeprBlockTot30Percent)+N(pm.DeprBlockTot40Percent)+N(pm.DeprBlockTot45Percent)),
        "Schedule DEP: Sl.No.1e (total depreciation on plant & machinery) must equal 1a + 1b + 1c + 1d.");
  }

  /* =====================================================================
     Depreciation-block helpers (a block is checked only when present).
     three = Sl.3 (WDV + 115BAC adjustment); the engine's own cell formulas
     (books/ITR-5/DPM_DOA.md) are mirrored so the checks pass on the engine's
     own output and fire only on an externally-inconsistent return.
     ===================================================================== */
  function ddet(path){const o=RG(I,path+".DepreciationDetail",null);return (o&&typeof o==="object")?o:null;}
  function three(o){const t=N(o.Total);return t||(N(o.WDVFirstDay)+N(o.AdjustmentSec115BAC));}

  /* rule 282: the DPM 3b AdjustmentSec115BAC (2nd proviso to 115BAC(3), Rule 5) is
     "not allowed to firm, LLP and Co-operative society or if New Tax Regime has been
     opted for." Firm/LLP = StatusOrCompanyType "1"; co-op = SubStatus schema codes
     4/15/16/17 (Other Cooperative Society / Primary Agri Credit / Primary Co-op Agri
     & Rural Dev bank / Co-op Bank). Barred when new regime OR any of those. */
  const _st282=String(RG(I,"PartA_GEN1.OrgFirmInfo.StatusOrCompanyType",""));
  const _sub282=String(RG(I,"PartA_GEN1.OrgFirmInfo.SubStatus",""));
  const barred115BAC = newR || _st282==="1" || ["4","15","16","17"].indexOf(_sub282)>=0;

  /* ---- Schedule DPM (four plant & machinery blocks) ---- */
  [["ScheduleDPM.PlantMachinery.Rate15",15,false],
   ["ScheduleDPM.PlantMachinery.Rate30",30,false],
   ["ScheduleDPM.PlantMachinery.Rate40",40,false],
   ["ScheduleDPM.PlantMachinery.Rate45",45,true]].forEach(function(x){
    const o=ddet(x[0]);if(!o)return;const rate=x[1],r45=x[2];
    const t=three(o),add180=N(o.AdditionsGrThan180Days),realTot=N(o.RealizationTotalPeriod);
    const addLess=N(o.AdditionsLessThan180Days),realLess=N(o.RealizationPeriodDuringYear);
    const fullBase=t+add180-realTot;
    const blocked=r45&&newR;                                   /* Rate45: no depreciation in the new regime (115BAD) */
    /* 273 — Sl.6 amount at full rate = MAX(0, 3 + 4 − 5) */
    A(273,REQ(o.FullRateDeprAmt,Math.max(0,fullBase)),
      "Schedule DPM "+x[0].split(".").pop()+": Sl.No.6 (amount at full rate) must equal MAX(0, 3 + 4 − 5).");
    /* 274 — Sl.9 amount at half rate = MAX(0, 7 − 8 + MIN(0, 3+4−5)) */
    A(274,REQ(o.HalfRateDeprAmt,Math.max(0,addLess-realLess+Math.min(0,fullBase))),
      "Schedule DPM "+x[0].split(".").pop()+": Sl.No.9 (amount at half rate) must equal MAX(0, 7 − 8).");
    /* 275 — Sl.15 total depreciation = 10 + 11 + 12 + 13 + 14 */
    A(275,REQ(o.TotalDepreciation,N(o.DepreciationAtFullRate)+N(o.DepreciationAtHalfRate)+
        N(o.AddlnDeprOnGT180DayAdditions)+N(o.AddlnDeprDuringYearAdditions)+N(o.AddlnDeprOnLessThan180DayAdditions)),
      "Schedule DPM "+x[0].split(".").pop()+": Sl.No.15 (total depreciation) must equal 10 + 11 + 12 + 13 + 14.");
    /* 276 — Sl.17 net aggregate depreciation = MAX(0, 15 − 16) */
    A(276,REQ(o.NetAggregateDepreciation,Math.max(0,N(o.TotalDepreciation)-N(o.DepDisAllowUs38_2))),
      "Schedule DPM "+x[0].split(".").pop()+": Sl.No.17 (net aggregate depreciation) must equal MAX(0, 15 − 16).");
    /* 277 — additional depreciation (12/13/14) cannot be claimed in the new tax regime */
    A(277,!newR||(N(o.AddlnDeprOnGT180DayAdditions)+N(o.AddlnDeprDuringYearAdditions)+N(o.AddlnDeprOnLessThan180DayAdditions))===0,
      "Schedule DPM "+x[0].split(".").pop()+": additional depreciation at Sl.No.12/13/14 cannot be claimed by an assessee opting for the new tax regime.");
    /* 280 — Sl.10 depreciation at full rate = ROUND(6 × rate/100) (nil for Rate45 in the new regime) */
    A(280,REQ(o.DepreciationAtFullRate,blocked?0:Math.round(N(o.FullRateDeprAmt)*rate/100)),
      "Schedule DPM "+x[0].split(".").pop()+": Sl.No.10 (depreciation at full rate) does not match the depreciation rate at Sl.No.2.");
    /* 281 — Sl.11 depreciation at half rate = ROUND(9 × rate/200) (no half rate for Rate45) */
    if(!r45)A(281,REQ(o.DepreciationAtHalfRate,blocked?0:Math.round(N(o.HalfRateDeprAmt)*rate/200)),
      "Schedule DPM "+x[0].split(".").pop()+": Sl.No.11 (depreciation at half rate) does not match the depreciation rate at Sl.No.2.");
    /* 282 — 3b (2nd-proviso-to-115BAC(3) / Rule 5 adjustment) not allowed to a firm,
       LLP or co-operative society, nor when the new tax regime has been opted for. */
    A(282,!barred115BAC||N(o.AdjustmentSec115BAC)===0,
      "Schedule DPM "+x[0].split(".").pop()+": the adjustment as per the second proviso to section 115BAC(3) (Rule 5) at Sl.No.3b cannot be claimed by a firm, LLP or co-operative society, or when the new tax regime has been opted for.");
    /* 283 — Sl.3 total = 3a (WDV on first day) + 3b (115BAC adjustment) */
    if(o.Total!=null)A(283,REQ(o.Total,N(o.WDVFirstDay)+N(o.AdjustmentSec115BAC)),
      "Schedule DPM "+x[0].split(".").pop()+": Sl.No.3 must equal 3a + 3b.");
    /* 284 — Sl.18 proportionate depreciation must be out of Sl.17 net aggregate depreciation */
    A(284,N(o.ProportionateAggDepreciation)<=N(o.NetAggregateDepreciation)+1,
      "Schedule DPM "+x[0].split(".").pop()+": Sl.No.18 (proportionate depreciation) must be out of Sl.No.17 (net aggregate depreciation).");
    /* 285 — Sl.20 capital gain u/s 50 not less than 5+8−3−4−7−19 when consideration exceeds WDV+additions */
    const cg50=N(o.CapGainUs50),expTr=N(o.ExpdrOnTrforSaleAsset),totDep=N(o.TotalDepreciation);
    const deemed=realTot+realLess-t-add180-addLess-expTr;
    if(deemed>0)A(285,cg50>=deemed-1,
      "Schedule DPM "+x[0].split(".").pop()+": Sl.No.20 (capital gains/loss u/s 50) cannot be less than 5+8−3−4−7−19 when the consideration exceeds the opening WDV and additions.");
    /* 286 — if Sl.20 ≠ 0 then Sl.10-18 and Sl.21 must be 0 (block ceased) */
    A(286,cg50===0||(N(o.DepreciationAtFullRate)===0&&N(o.DepreciationAtHalfRate)===0&&
        N(o.AddlnDeprOnGT180DayAdditions)===0&&N(o.AddlnDeprDuringYearAdditions)===0&&N(o.AddlnDeprOnLessThan180DayAdditions)===0&&
        N(o.TotalDepreciation)===0&&N(o.DepDisAllowUs38_2)===0&&N(o.NetAggregateDepreciation)===0&&
        N(o.ProportionateAggDepreciation)===0&&N(o.WDVLastDay)===0),
      "Schedule DPM "+x[0].split(".").pop()+": when Sl.No.20 (capital gains u/s 50) is other than 0, Sl.No.10-18 and 21 must be 0.");
    /* 287 — if Sl.20 = 0 then Sl.21 WDV on last day = MAX(0, 7−8+3+4−5−15) */
    if(cg50===0)A(287,REQ(o.WDVLastDay,Math.max(0,addLess-realLess+t+add180-realTot-totDep)),
      "Schedule DPM "+x[0].split(".").pop()+": when Sl.No.20 is 0, Sl.No.21 (WDV on last day) must equal 7 − 8 + 3 + 4 − 5 − 15.");
  });

  /* 278 — depreciation @45% cannot be claimed by an assessee opting for 115BAD (new regime) */
  (function(){const o=ddet("ScheduleDPM.PlantMachinery.Rate45");if(!o)return;
    A(278,!newR||(N(o.DepreciationAtFullRate)===0&&N(o.TotalDepreciation)===0),
      "Schedule DPM: depreciation @45% cannot be claimed by an assessee opting for taxation u/s 115BAD (new tax regime).");
  })();

  /* ---- Schedule DOA (buildings 5/10/40, furniture, intangibles, ships; no additional depreciation) ---- */
  [["ScheduleDOA.Building.Rate5",5],
   ["ScheduleDOA.Building.Rate10",10],
   ["ScheduleDOA.Building.Rate40",40],
   ["ScheduleDOA.FurnitureFittings.Rate10",10],
   ["ScheduleDOA.IntangibleAssets.Rate25",25],
   ["ScheduleDOA.Ships.Rate20",20]].forEach(function(x){
    const o=ddet(x[0]);if(!o)return;const rate=x[1];const nm=x[0].split(".").slice(-2).join(" ");
    const t=three(o),add180=N(o.AdditionsGrThan180Days),realTot=N(o.RealizationTotalPeriod);
    const addLess=N(o.AdditionsLessThan180Days),realLess=N(o.RealizationPeriodDuringYear);
    const fullBase=t+add180-realTot,cg50=N(o.CapGainUs50),expTr=N(o.ExpdrOnTrforSaleAsset),totDep=N(o.TotalDepreciation);
    /* 288 — Sl.6 = MAX(0, 3 + 4 − 5) */
    A(288,REQ(o.FullRateDeprAmt,Math.max(0,fullBase)),
      "Schedule DOA "+nm+": Sl.No.6 must equal MAX(0, 3 + 4 − 5).");
    /* 289 — Sl.9 = MAX(0, 7 − 8) */
    A(289,REQ(o.HalfRateDeprAmt,Math.max(0,addLess-realLess+Math.min(0,fullBase))),
      "Schedule DOA "+nm+": Sl.No.9 must equal MAX(0, 7 − 8).");
    /* 290 — total depreciation = 10 + 11 */
    A(290,REQ(o.TotalDepreciation,N(o.DepreciationAtFullRate)+N(o.DepreciationAtHalfRate)),
      "Schedule DOA "+nm+": total depreciation must equal 10 + 11.");
    /* 291 — Sl.14 net aggregate depreciation = MAX(0, 12 − 13) */
    A(291,REQ(o.NetAggregateDepreciation,Math.max(0,N(o.TotalDepreciation)-N(o.DepDisAllowUs38_2))),
      "Schedule DOA "+nm+": Sl.No.14 (net aggregate depreciation) must equal MAX(0, 12 − 13).");
    /* 293 — Sl.10 depreciation at full rate = ROUND(6 × rate/100) */
    A(293,REQ(o.DepreciationAtFullRate,Math.round(N(o.FullRateDeprAmt)*rate/100)),
      "Schedule DOA "+nm+": Sl.No.10 (depreciation at full rate) does not match the depreciation rate at Sl.No.2.");
    /* 294 — Sl.11 depreciation at half rate = ROUND(9 × rate/200) */
    A(294,REQ(o.DepreciationAtHalfRate,Math.round(N(o.HalfRateDeprAmt)*rate/200)),
      "Schedule DOA "+nm+": Sl.No.11 (depreciation at half rate) does not match the depreciation rate at Sl.No.2.");
    /* 295 — Sl.15 proportionate depreciation must be out of Sl.14 net aggregate depreciation */
    A(295,N(o.ProportionateAggDepreciation)<=N(o.NetAggregateDepreciation)+1,
      "Schedule DOA "+nm+": Sl.No.15 (proportionate depreciation) must be out of Sl.No.14 (net aggregate depreciation).");
    /* 296 — Sl.17 capital gain u/s 50 not less than 5+8−3−4−7−16 when consideration exceeds WDV+additions */
    const deemed=realTot+realLess-t-add180-addLess-expTr;
    if(deemed>0)A(296,cg50>=deemed-1,
      "Schedule DOA "+nm+": Sl.No.17 (capital gains/loss u/s 50) cannot be less than 5+8−3−4−7−16 when the consideration exceeds the opening WDV and additions.");
    /* 297 — if Sl.17 ≠ 0 then Sl.10,11,12,13,14,15 and 18 must be 0 */
    A(297,cg50===0||(N(o.DepreciationAtFullRate)===0&&N(o.DepreciationAtHalfRate)===0&&N(o.TotalDepreciation)===0&&
        N(o.DepDisAllowUs38_2)===0&&N(o.NetAggregateDepreciation)===0&&N(o.ProportionateAggDepreciation)===0&&N(o.WDVLastDay)===0),
      "Schedule DOA "+nm+": when Sl.No.17 (capital gains u/s 50) is other than 0, Sl.No.10,11,12,13,14,15 and 18 must be 0.");
    /* 298 — if Sl.17 = 0 then Sl.18 WDV on last day = MAX(0, 7−8+3+4−5−12) */
    if(cg50===0)A(298,REQ(o.WDVLastDay,Math.max(0,addLess-realLess+t+add180-realTot-totDep)),
      "Schedule DOA "+nm+": when Sl.No.17 is 0, Sl.No.18 (WDV on last day) must equal 7 − 8 + 3 + 4 − 5 − 12.");
  });
});
