/* ITR-3 · AY 2026-27 — validation-rule FIX batch 04 (enforcement gaps/weak fixes).
   Registered via ruleset(); A(n,cond,msg) fires when cond is FALSE. Reads guarded; nothing throws.
   Serials: 423 436 (WEAK companions) · 425 426 427 428 451 452 (Table F ↔ BFLA col 5) ·
            442 484 (Table D detail) · 459 462 463 464 473 (Table E loss caps) ·
            509 (WEAK companion, OS item 7) · 514 515 516 517 (OS table 2f ≤ item-1 lines).
   Schema paths copied from 70_sec_cg.js (expCg) / 70_sec_os.js (expOs) / 70_sec_loss.js (expLoss). */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const res=FS.ResidentialStatus||"RES";                    /* RES / RNOR / NRI */
  const arr=v=>Array.isArray(v)?v:[];
  /* ISO date + n months (YYYY-MM-DD); "" when the input is not a date */
  const addM=(iso,m)=>{const p=String(iso||"").split("-");if(p.length<3||!+p[0])return "";
    const d=new Date(Date.UTC(+p[0],+p[1]-1+m,+p[2]));return isNaN(d.getTime())?"":d.toISOString().slice(0,10);};

  /* =============================================================
     SCHEDULE CG
     ============================================================= */
  if(I.ScheduleCGFor23){const cg=I.ScheduleCGFor23,ST=RG(cg,"ShortTermCapGainFor23",{})||{},LT=RG(cg,"LongTermCapGain23",{})||{};
    const stLand=arr(RG(ST,"SaleofLandBuild.SaleofLandBuildDtls",[])),ltLand=arr(RG(LT,"SaleofLandBuild.SaleofLandBuildDtls",[]));

    /* ---- 423 (WEAK → strict companion): every deduction claimed in Parts A/B must equal Table D ----
       A1d (54B/54G/54GA on ST land) · A6 · B1d (54/54B/54D/54EC/54F/54G/54GA on LT land) · B2 · B3i/B3ii 54F ·
       B4b 54F · B5 54F · B6 54F · B7 54F · B8 115F · B9d.  Table D = DeducClaimInfo.TotDeductClaim. */
    const claimed=RSUM(stLand,d=>RG(d,"ExemptionOrDednUs54.ExemptionGrandTotal"))
      +N(RG(ST,"SaleOnOtherAssets.ExemptionOrDednUs54.ExemptionGrandTotal"))
      +RSUM(ltLand,d=>RG(d,"ExemptionOrDednUs54.ExemptionGrandTotal"))
      +N(RG(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg.ExemptionOrDednUs54.ExemptionGrandTotal"))
      +RSUM(arr(RG(LT,"Proviso112Applicable",[])),r=>RG(r,"Proviso112Applicabledtls.DeductionUs54F"))
      +N(RG(LT,"SaleOfEquityShareUs112A.DeductionUs54F"))
      +N(RG(LT,"NRIProvisoSec48.DeductionUs54F"))
      +RSUM(arr(RG(LT,"NRIOnSec112and115.NRIOnSec112and115Dtls",[])),"DeductionUs54F")
      +N(RG(LT,"NRISaleOfEquityShareUs112A.DeductionUs54F"))
      +N(RG(LT,"NRISaleofForeignAsset.DednSpecAssetus115"))
      +N(RG(LT,"SaleofAssetNADtls.SaleofAssetNA.ExemptionOrDednUs54.ExemptionGrandTotal"));
    A(423,REQ(claimed,RG(cg,"DeducClaimInfo.TotDeductClaim")),
      "Schedule CG: the deductions claimed under sections 54/54B/54D/54EC/54F/54G/54GA/115F in the STCG and LTCG items must equal the total deduction reported in Table D.");

    /* ---- 436 (WEAK companion): B1 dates mandatory when B1(a)(iii) or the B1(b)(ii) improvement cost is > 0 ---- */
    ltLand.forEach((d,i)=>{const ci=RG(d,"CostOfImprovements",{})||{};
      const trig=N(d.FullConsideration50C)>0||N(ci.TotalImprovecost)>0||N(ci.TotalindexImprovecost)>0||N(d.AquisitCost)>0;
      A(436,!trig||(!!d.DateofSale&&!!d.DateofPurchase),
        "Schedule CG B1 property "+(i+1)+": the date of sale and the date of purchase are mandatory when B1(a)(iii) or the cost of improvement B1(b)(ii)(b) is more than zero.");});

    /* ---- 442: Table D — CGAS deposit (iv) > 0 needs date of deposit (iva), account number (ivb) and IFSC (ivc) ---- */
    [["DeducClaimDtlsUs54","1a"],["DeducClaimDtlsUs54B","1b"],["DeducClaimDtlsUs54D","1c"],["DeducClaimDtlsUs54F","1e"],["DeducClaimDtlsUs54G","1f"],["DeducClaimDtlsUs54GA","1g"]]
      .forEach(([k,sl])=>{arr(RG(cg,"DeducClaimInfo."+k,[])).forEach((r,i)=>{r=r||{};
        A(442,!(N(r.AmtDeposited)>0)||(!!r.DepositDate&&!!r.AccountNo&&!!r.IFSC),
          "Schedule CG Table D "+sl+" row "+(i+1)+": the amount deposited in the Capital Gains Accounts Scheme (iv) is more than zero — the date of deposit (iva), account number (ivb) and IFS code (ivc) cannot be blank.");});});

    /* ---- 484: 115F — the new specified asset must be acquired within 6 months after the transfer ---- */
    const r115=arr(RG(cg,"DeducClaimInfo.DeducClaimDtlsUs115F",[]));
    A(484,!(N(RG(LT,"NRISaleofForeignAsset.DednSpecAssetus115"))>0)||r115.length>0,
      "Schedule CG B8: a deduction under section 115F needs the investment particulars (date of transfer, date of investment, amount) in Table D.");
    r115.forEach((r,i)=>{r=r||{};const inv=String(r.DateofInvestment||""),tr=String(r.DateofTransfer||"");
      A(484,!(N(r.AmtInvested)>0||N(r.AmtDeducted)>0)||!inv||!tr||(inv>=tr&&inv<=addM(tr,6)),
        "Schedule CG Table D 115F row "+(i+1)+": the deduction is allowed only if the new specified asset/savings certificate is acquired within 6 months after the date of transfer of the original asset.");});

    /* ---- Table E: sum of set-off claimed in a loss column cannot exceed the loss available (row 1) ---- */
    const E=RG(cg,"CurrYrLosses",{})||{};
    const GK=["InStcg20Per","InStcg30Per","InStcgAppRate","InStcgDTAARate","InLtcg12_5Per","InLtcgDTAARate"];
    const usedOf=lk=>GK.reduce((a,gk)=>a+N(RG(E,gk+"."+lk)),0);
    [[459,"StclSetoff20Per","short-term capital loss @20%"],[462,"StclSetoffDTAARate","short-term capital loss at DTAA rates"],
     [463,"LtclSetOff12_5Per","long-term capital loss @12.5%"],[464,"LtclSetOffDTAARate","long-term capital loss at DTAA rates"]]
      .forEach(([n,lk,lbl])=>{A(n,usedOf(lk)<=N(RG(E,"InLossSetOff."+lk))+1,
        "Schedule CG Table E: the total set-off claimed of the "+lbl+" cannot exceed the loss available for set-off.");});

    /* ---- 473: the entire loss must be set off while an eligible gain remains (STCL → any CG; LTCL → LTCG only) ---- */
    const LKS=[["StclSetoff20Per","st20",0],["StclSetoff30Per","st30",0],["StclSetoffAppRate","stApp",0],["StclSetoffDTAARate","stDTAA",0],["LtclSetOff12_5Per","lt125",1],["LtclSetOffDTAARate","ltDTAA",1]];
    const ownRow={StclSetoff20Per:"InStcg20Per",StclSetoff30Per:"InStcg30Per",StclSetoffAppRate:"InStcgAppRate",StclSetoffDTAARate:"InStcgDTAARate",LtclSetOff12_5Per:"InLtcg12_5Per",LtclSetOffDTAARate:"InLtcgDTAARate"};
    A(473,LKS.every(([lk,sk,isL])=>{
        const avail=Math.max(N(RG(E,"InLossSetOff."+lk)),N(RG(S_||{},"C.cg.loss."+sk)));   /* row 1, or the engine's live loss when larger */
        const remain=avail-usedOf(lk);if(remain<=1)return true;
        return GK.every(gk=>gk===ownRow[lk]||(isL&&gk.indexOf("InLtcg")!==0)||N(RG(E,gk+".CurrYrCapGain"))<=1);}),
      "Schedule CG Table E: the entire loss must be set off against the gains available for set-off — a loss cannot be left unabsorbed while an eligible gain remains in column 8.");

    /* ---- Table F: quarterly break-up of each rate row must total column 5 of Schedule BFLA ---- */
    const FQ=["Upto15Of6","Upto15Of9","Up16Of9To15Of12","Up16Of12To15Of3","Up16Of3To31Of3"];
    const fSum=fk=>{const dr=RG(cg,"AccruOrRecOfCG."+fk+".DateRange",{})||{};return FQ.reduce((a,q)=>a+N(dr[q]),0);};
    const bf5=bk=>N(RG(I,"ScheduleBFLA."+bk+".IncBFLA.IncOfCurYrAfterSetOffBFLosses"));
    /* FIXED: expCg now scales Table F quarters to post-BFLA (S.C.loss.afterB = BFLA col 5). */
    [[451,"ShortTermUnder20Per","STCG20Per","1","5vi"],[425,"ShortTermUnder30Per","STCG30Per","2","5vii"],
     [426,"ShortTermUnderAppRate","STCGAppRate","3","5viii"],[427,"ShortTermUnderDTAARate","STCGDTAARate","4","5ix"],
     [452,"LongTermUnder12_5Per","LTCG12_5Per","5","5x"],[428,"LongTermUnderDTAARate","LTCGDTAARate","6","5xi"]]
      .forEach(([n,fk,bk,sl,it])=>{A(n,!I.ScheduleBFLA||REQ(fSum(fk),bf5(bk)),
        "Schedule CG Table F Sl.No. "+sl+": the break-up of all the quarters must equal item "+it+" of Schedule BFLA.");});
  }

  /* =============================================================
     SCHEDULE OS
     ============================================================= */
  if(I.ScheduleOS){const io=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{},dd=RG(io,"Deductions",{})||{};
    const dtRows=arr(RG(io,"IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS",[]));
    const dtaaOf=nat=>dtRows.filter(r=>r&&String(r.NatureOfIncome||"")===nat).reduce((a,r)=>a+N(r.DTAAamt),0);
    /* ---- 509 (WEAK companion): item 7 = 2 + 6 (6 nil if negative); 6 = 1 − 3 + 4 + 5 − 5a − DTAA amounts included in item 1 ---- */
    const dt1=dtRows.filter(r=>r&&["1ai","1aiii","1b","1c","1d"].indexOf(String(r.NatureOfIncome||""))>=0&&(res!=="NRI"||r.TaxRescertifiedFlag==="Y"))
      .reduce((a,r)=>a+N(r.DTAAamt),0);
    const item6=N(io.GrossIncChrgblTaxAtAppRate)-N(dd.TotDeductions)+N(io.AmtNotDeductibleUs58)+N(io.ProfitChargTaxUs59)-N(io.Increliefus89AOS)-dt1;
    const item7=N(io.IncChargeableSpecialRates)+Math.max(0,item6);
    A(509,REQ(io.BalanceNoRaceHorse,item7)&&REQ(RG(I,"ScheduleOS.TotOthSrcNoRaceHorse"),item7),
      "Schedule OS: item 7 (income from other sources other than race horses) must equal item 2 + item 6, with item 6 taken as nil if negative.");
    /* ---- 514–517: table 2f amounts classified under an item-1 line cannot exceed that line ---- */
    A(514,dtaaOf("1ai")<=N(io.DividendOthThan22e)+1,"Schedule OS table 2f: the DTAA amounts included in 1a(i) cannot exceed 1a(i) dividend income [other than (ii)].");
    A(515,dtaaOf("1b")<=N(io.InterestGross)+1,"Schedule OS table 2f: the DTAA amounts included in 1b cannot exceed 1b interest, gross.");
    A(516,dtaaOf("1c")<=N(io.RentFromMachPlantBldgs)+1,"Schedule OS table 2f: the DTAA amounts included in 1c cannot exceed 1c rental income from machinery, plants, buildings, gross.");
    A(517,dtaaOf("1d")<=N(io.Tot562x)+1,"Schedule OS table 2f: the DTAA amounts included in 1d cannot exceed 1d income of the nature referred to in section 56(2)(x).");
  }
});
