/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, batch enc_09 (Phase 6).
   Serials 401–450 from books/ITR-5/rules.json (ALL Schedule CG).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) FIRES when cond (the "valid" assertion) is FALSE.

   Self-contained: local guarded helpers (g/n/arr/sum/eqi/approx) are
   defined here so the batch never throws even if the 60_rules globals are
   absent, and every read is guarded — an empty return is a no-op.

   Schema paths copied from forms/ITR-5/src/70_sec_cg.js (expCg),
   70_sec_loss.js (ScheduleBFLA), 70_sec_os.js (Dividend22f).  ITR-5 FACTS:
   - Root block is `ScheduleCG`; ST=ShortTermCapGain, LT=LongTermCapGain,
     summary C1/C2/C3 = SumOfCGIncm/IncmFromVDATrnsf/IncChargeableHeadCapGain,
     Part D=DeducClaimInfo, Part E=CurrYrLosses, Part F=AccruOrRecOfCG.
   - Table E has SIX rate columns: InStcg20Per, InStcg30Per, InStcgAppRate,
     InStcgDTAARate, InLtcg12_5Per, InLtcgDTAARate; loss legs StclSetoff20Per,
     StclSetoff30Per, StclSetoffAppRate, StclSetoffDTAARate, LtclSetOff12_5Per,
     LtclSetOffDTAARate; plus InLossSetOff / TotLossSetOff / LossRemainSetOff.
   - Table F rate rows: ShortTermUnder20Per, …30Per, …AppRate, …DTAARate,
     LongTermUnder12_5Per, LongTermUnderDTAARate, VDATrnsfGainsUnder30Per,
     each with a five-window DateRange (234C quarters).
   - BFLA CG keys: STCG20Per, STCG30Per, STCGAppRate, STCGDTAARate,
     LTCG12_5Per, LTCGDTAARate (…IncBFLA.IncOfCurYrAfterSetOffBFLosses = col 5).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const CG=(I.ScheduleCG&&typeof I.ScheduleCG==="object")?I.ScheduleCG:null;
  if(!CG)return;                                                    /* no Schedule CG → whole batch no-op */

  /* ---- local guarded helpers (never throw) ---- */
  const g=(o,p)=>{try{return String(p).split(".").reduce((t,k)=>(t==null?undefined:t[k]),o);}catch(e){return undefined;}};
  const n=v=>{const x=+v;return isFinite(x)?x:0;};
  const arr=v=>Array.isArray(v)?v:[];
  const sum=(a,f)=>arr(a).reduce((t,x)=>t+n(typeof f==="function"?f(x):(x&&x[f])),0);
  const eqi=(a,b)=>Math.abs(n(a)-n(b))<=1;                          /* integer-rupee equality (±1 rounding) */
  const approx=(a,b)=>Math.abs(n(a)-n(b))<0.01;                     /* rate equality */
  const isDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||""));

  const ST=(CG.ShortTermCapGain&&typeof CG.ShortTermCapGain==="object")?CG.ShortTermCapGain:{};
  const LT=(CG.LongTermCapGain&&typeof CG.LongTermCapGain==="object")?CG.LongTermCapGain:{};
  const res=g(I,"PartA_GEN1.FilingStatus.ResidentialStatus")||"RES";

  /* =============================================================
     PART A / B — 50C band, slump higher-of, land dates, B1 total
     ============================================================= */
  const stLand=arr(g(ST,"SaleofLandBuild.SaleofLandBuildDtls"));
  const ltLand=arr(g(LT,"SaleofLandBuild.SaleofLandBuildDtls"));

  /* ---- 405: A1(aiii) 50C value = A1(aii) when it exceeds 1.10×A1(ai), else A1(ai) ---- */
  stLand.forEach((d,i)=>{d=d||{};
    if(!(n(d.FullConsideration)>0||n(d.PropertyValuation)>0))return;
    const exp=n(d.PropertyValuation)>1.1*n(d.FullConsideration)?n(d.PropertyValuation):n(d.FullConsideration);
    A(405,eqi(d.FullConsideration50C,exp),
      "Schedule CG A1 property "+(i+1)+": the full value of consideration adopted (A1aiii) must be the stamp-duty value (A1aii) only when it exceeds 1.10 times the actual consideration (A1ai), otherwise the actual consideration.");});

  /* ---- 406: B1(aiii) 50C value — same 10% band for LTCG land/building ---- */
  ltLand.forEach((d,i)=>{d=d||{};
    if(!(n(d.FullConsideration)>0||n(d.PropertyValuation)>0))return;
    const exp=n(d.PropertyValuation)>1.1*n(d.FullConsideration)?n(d.PropertyValuation):n(d.FullConsideration);
    A(406,eqi(d.FullConsideration50C,exp),
      "Schedule CG B1 property "+(i+1)+": the full value of consideration adopted (B1aiii) must be the stamp-duty value (B1aii) only when it exceeds 1.10 times the actual consideration (B1ai), otherwise the actual consideration.");});

  /* ---- 410 / 411: B1 date of sale and date of purchase mandatory when B1(aiii) 50C value,
         B1(bii) cost of acquisition, or B1(biia) cost of improvement is more than zero ---- */
  ltLand.forEach((d,i)=>{d=d||{};
    const trig=n(d.FullConsideration50C)>0||n(d.AquisitCost)>0||n(d.ImproveCost)>0;
    A(410,!trig||(isDate(d.DateofSale)&&isDate(d.DateofPurchase)),
      "Schedule CG B1 property "+(i+1)+": the date of sale and the date of purchase are mandatory when B1(aiii) or the cost of acquisition B1(bii) is more than zero.");
    A(411,!trig||(isDate(d.DateofSale)&&isDate(d.DateofPurchase)),
      "Schedule CG B1 property "+(i+1)+": the date of sale and the date of purchase are mandatory when B1(aiii) or the cost of improvement B1(biia) is more than zero.");});

  /* ---- 448: date of sale/transfer of land or building in A1 or B1 cannot be after 31 March of the FY ---- */
  const FYEND="2026-03-31";
  stLand.concat(ltLand).forEach((d,i)=>{d=d||{};
    A(448,!isDate(d.DateofSale)||d.DateofSale<=FYEND,
      "Schedule CG: the date of sale/transfer of land or building (Sl. No. A1 or B1) cannot be after 31st March of the financial year.");});

  /* ---- 408: A2(aiii) slump full value = higher of A2(ai) and A2(aii) (11UAE ii / iii) ---- */
  const ss=g(ST,"SlumpSaleInStcg");
  if(ss&&typeof ss==="object"&&(n(ss.FMV11UAEii)>0||n(ss.FMV11UAEiii)>0||n(ss.NetWorthOfDivision)>0))
    A(408,eqi(ss.FullConsideration,Math.max(n(ss.FMV11UAEii),n(ss.FMV11UAEiii))),
      "Schedule CG A2: the full value of consideration for the slump sale (A2aiii) must be the higher of A2(ai) and A2(aii).");

  /* ---- 409: B2(aiii) slump full value = higher of B2(ai) and B2(aii) ---- */
  const sl=g(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg");
  if(sl&&typeof sl==="object"&&(n(sl.FMV11UAEii)>0||n(sl.FMV11UAEiii)>0||n(sl.NetWorthOfDivision)>0))
    A(409,eqi(sl.FullConsideration,Math.max(n(sl.FMV11UAEii),n(sl.FMV11UAEiii))),
      "Schedule CG B2: the full value of consideration for the slump sale (B2aiii) must be the higher of B2(ai) and B2(aii).");

  /* ---- 407: A6g = A(6c + 6d + 6e − 6f), floored at zero unless the pre-exemption balance is negative ---- */
  const a6=g(ST,"SaleOnOtherAssets");
  if(a6&&typeof a6==="object"&&(n(a6.FullConsideration)>0||n(a6.BalanceCG)!==0||n(a6.DeemedSTCGDeprAsset)>0)){
    const raw=n(a6.BalanceCG)+n(a6.LossSec94of7Or94of8)+n(a6.DeemedSTCGDeprAsset);          /* 6c + 6d + 6e */
    const exemp=n(g(a6,"ExemptionOrDednUs54.ExemptionGrandTotal"));                          /* 6f */
    const exp=raw<0?raw:Math.max(0,raw-exemp);
    A(407,eqi(a6.CapgainonAssets,exp),
      "Schedule CG A6g: the capital gain must equal A(6c + 6d + 6e − 6f).");}

  /* ---- 417 / 418 / 419: A3(ii) sub-head (115AD FII, MFSectionCode 5AD1biip) internal arithmetic ---- */
  arr(ST.EquityMFonSTT).forEach(row=>{row=row||{};
    if(String(row.MFSectionCode||"")!=="5AD1biip")return;                                     /* the A3(ii) sub-head */
    const dt=g(row,"EquityMFonSTTDtls")||{};const d48=g(dt,"DeductSec48")||{};
    if(!(n(dt.FullConsideration)>0||n(d48.AquisitCost)>0||n(d48.ImproveCost)>0))return;
    A(417,eqi(d48.TotalDedn,n(d48.Reduction48iii)+n(d48.AquisitCost)+n(d48.ImproveCost)+n(d48.ExpOnTrans)),
      "Schedule CG A3iib(v): the total deduction under section 48 must equal the sum of A3iib (i + ii + iii + iv).");
    A(418,eqi(dt.BalanceCG,n(dt.FullConsideration)-n(d48.TotalDedn)),
      "Schedule CG A3ii(c): the balance must equal A3iia − A3iibv.");
    A(419,eqi(dt.CapgainonAssets,n(dt.BalanceCG)+n(dt.LossSec94of7Or94of8)),
      "Schedule CG A3iie: the capital gain must equal the sum of A3ii(c + d).");});

  /* ---- 443: B1g (ΣB1e) = sum of B1e of all LTCG land/building properties ---- */
  if(ltLand.length)
    A(443,eqi(g(LT,"SaleofLandBuild.TotalLTCGImmblPrprty"),sum(ltLand,"CapgainonAssets")),
      "Schedule CG B1(g): the total long-term capital gain on immovable property (ΣB1e) must equal the sum of B1e of all the properties.");

  /* =============================================================
     PART A/B — DTAA applicable-rate = lower of treaty (col 6) and IT-Act (col 9)
     ============================================================= */
  const dtaaRate=(rows,serial,lbl)=>arr(rows).forEach((r,i)=>{r=r||{};
    if(r.ApplicableRate==null)return;                                                          /* col 10 blank → nothing to check */
    A(serial,approx(r.ApplicableRate,Math.min(n(r.RateAsPerTreaty),n(r.RateAsPerITAct))),
      "Schedule CG "+lbl+" row "+(i+1)+": the applicable rate (Col. 10) must be the lower of the rate as per Treaty (Col. 6) and the rate as per the I.T. Act (Col. 9).");});
  /* 403 — STCG A9 DTAA table */
  dtaaRate(g(ST,"NRICgDTAA.NRIDTAADtls"),403,"A9 (STCG DTAA)");
  /* 404 & 450 — LTCG B11 DTAA table (same underlying validation, two serials) */
  dtaaRate(g(LT,"NRICgDTAA.NRIDTAADtls"),404,"B11 (LTCG DTAA)");
  dtaaRate(g(LT,"NRICgDTAA.NRIDTAADtls"),450,"B11 (LTCG DTAA)");

  /* ---- 420: a resident cannot claim the DTAA rate of taxation in Schedule CG (advisory Category-A) ---- */
  const anyDtaa=arr(g(ST,"NRICgDTAA.NRIDTAADtls")).some(r=>r&&n(r.DTAAamt)!==0)
             || arr(g(LT,"NRICgDTAA.NRIDTAADtls")).some(r=>r&&n(r.DTAAamt)!==0);
  A(420,res!=="RES"||!anyDtaa,
    "Schedule CG: for a resident taxpayer the DTAA benefit is not available in the rate of taxation — the claim may be disallowed (residents may claim DTAA relief under Schedule TR and FSI).");

  /* =============================================================
     PART C — summary identities and cross-schedule ties
     ============================================================= */
  /* ---- 412: C3 = C1 + C2 ---- */
  A(412,eqi(CG.IncChargeableHeadCapGain,n(CG.SumOfCGIncm)+n(CG.IncmFromVDATrnsf)),
    "Schedule CG C3: income chargeable under the head CAPITAL GAINS must equal C1 (sum of capital gain incomes) + C2 (income from transfer of Virtual Digital Assets).");

  /* ---- 413: C2 = Item B of Schedule VDA ---- */
  if(I.ScheduleVDA&&typeof I.ScheduleVDA==="object")
    A(413,eqi(CG.IncmFromVDATrnsf,g(I,"ScheduleVDA.TotIncCapGain")),
      "Schedule CG C2: income from transfer of Virtual Digital Assets must equal Sl. No. B of Schedule VDA.");

  /* ---- 421: value of LTCG u/s 112A (B4) = the balance in Schedule 112A ---- */
  if(I.Schedule112A&&typeof I.Schedule112A==="object")
    A(421,eqi(g(LT,"SaleOfEquityShareUs112A.CapgainonAssets"),g(I,"Schedule112A.Balance112A")),
      "Schedule CG B4: the capital gains u/s 112A must equal the corresponding amount computed in Schedule 112A.");

  /* =============================================================
     TABLE D — CGAS deposit rows need deposit date, account no. and IFSC
     (416 & 445 — the same validation over the 54D/54G/54GA deposit tables)
     ============================================================= */
  [["DeducClaimDtlsUs54D","1a"],["DeducClaimDtlsUs54G","1c"],["DeducClaimDtlsUs54GA","1d"]]
    .forEach(([k,slno])=>arr(g(CG,"DeducClaimInfo."+k)).forEach((r,i)=>{r=r||{};
      const ok=!(n(r.AmtDeposited)>0)||(isDate(r.DepositDate)&&!!r.AccountNo&&!!r.IFSC);
      A(416,ok,"Schedule CG Table D "+slno+"iv row "+(i+1)+": the amount deposited in the Capital Gains Accounts Scheme (iv) is more than zero — the date of deposit (iva), account number (ivb) and IFS code (ivc) cannot be blank.");
      A(445,ok,"Schedule CG Table D "+slno+"iv row "+(i+1)+": when the amount deposited in the Capital Gains Accounts Scheme before the due date is more than zero, the date of deposit, account number and IFS code cannot be blank or null.");}));

  /* =============================================================
     TABLE E — set-off matrix (CurrYrLosses)
     ============================================================= */
  const E=(CG.CurrYrLosses&&typeof CG.CurrYrLosses==="object")?CG.CurrYrLosses:null;
  if(E){
    const GAIN=["InStcg20Per","InStcg30Per","InStcgAppRate","InStcgDTAARate","InLtcg12_5Per","InLtcgDTAARate"];
    const LOSS=["StclSetoff20Per","StclSetoff30Per","StclSetoffAppRate","StclSetoffDTAARate","LtclSetOff12_5Per","LtclSetOffDTAARate"];
    const ILS=g(E,"InLossSetOff")||{},TLS=g(E,"TotLossSetOff")||{},LRS=g(E,"LossRemainSetOff")||{};
    const node=gk=>{const o=E[gk];return (o&&typeof o==="object")?o:{};};
    const setoffInRow=gk=>{const o=node(gk);return LOSS.reduce((a,lk)=>a+n(o[lk]),0);};       /* Σ of the loss legs in a gain row */
    const usedOf=lk=>GAIN.reduce((a,gk)=>a+n(node(gk)[lk]),0);                                 /* a loss column summed down the gain rows */

    /* ---- 428–433: Σ set-off claimed in a gain row cannot exceed the income available (that row's current-year income) ---- */
    [[428,"InStcg20Per","STCG @20%"],[429,"InStcg30Per","STCG @30%"],[430,"InStcgAppRate","STCG at applicable rates"],
     [431,"InStcgDTAARate","STCG at DTAA rates"],[432,"InLtcg12_5Per","LTCG @12.5%"],[433,"InLtcgDTAARate","LTCG at DTAA rates"]]
      .forEach(([sn,gk,lbl])=>{A(sn,setoffInRow(gk)<=n(node(gk).CurrYearIncome)+1,
        "Schedule CG Table E: the total set-off claimed cannot exceed the income available for set-off ("+lbl+").");});

    /* ---- 434–439: a loss column set off cannot exceed the loss available (row i) ---- */
    [[434,"StclSetoff20Per","STCL @20%"],[435,"StclSetoff30Per","STCL @30%"],[436,"StclSetoffAppRate","STCL at applicable rate"],
     [437,"StclSetoffDTAARate","STCL at DTAA rates"],[438,"LtclSetOff12_5Per","LTCL @12.5%"],[439,"LtclSetOffDTAARate","LTCL at DTAA rates"]]
      .forEach(([sn,lk,lbl])=>{A(sn,usedOf(lk)<=n(ILS[lk])+1,
        "Schedule CG Table E: the total amount of set-off claimed cannot exceed the losses available for set-off ("+lbl+").");});

    /* ---- 440: column 8 (gain remaining) = 1 − (2 + 3 + 4 + 5 + 6 + 7) for each gain row ---- */
    GAIN.forEach(gk=>{const o=node(gk);A(440,eqi(o.CurrYrCapGain,n(o.CurrYearIncome)-setoffInRow(gk)),
      "Schedule CG Table E: column 8 (current year's capital gains remaining after set-off) of each row must equal column 1 − (columns 2+3+4+5+6+7).");});

    /* ---- 441: row (viii) 'Total loss set off' of each column = ii + iii + iv + v + vi + vii ---- */
    LOSS.forEach(lk=>{A(441,eqi(TLS[lk],usedOf(lk)),
      "Schedule CG Table E: row (viii) 'Total loss set off' of each column must equal (ii + iii + iv + v + vi + vii).");});

    /* ---- 442: row (ix) 'Loss remaining after set off' = i − viii (floored at zero) ---- */
    LOSS.forEach(lk=>{A(442,eqi(LRS[lk],Math.max(0,n(ILS[lk])-n(TLS[lk]))),
      "Schedule CG Table E: row (ix) 'Loss remaining after set off' must equal (i − viii).");});

    /* ---- 444: the entire loss must be set off while an eligible gain remains
           (STCL → any capital gain; LTCL → LTCG only) ---- */
    const OWN={StclSetoff20Per:"InStcg20Per",StclSetoff30Per:"InStcg30Per",StclSetoffAppRate:"InStcgAppRate",
      StclSetoffDTAARate:"InStcgDTAARate",LtclSetOff12_5Per:"InLtcg12_5Per",LtclSetOffDTAARate:"InLtcgDTAARate"};
    const isLT=lk=>lk.indexOf("Ltcl")===0;
    A(444,LOSS.every(lk=>{const remain=n(ILS[lk])-usedOf(lk);if(remain<=1)return true;
        return GAIN.every(gk=>gk===OWN[lk]||(isLT(lk)&&gk.indexOf("InLtcg")!==0)||n(node(gk).CurrYrCapGain)<=1);}),
      "Schedule CG Table E: the entire loss must be set off against the gains available for set-off — a loss cannot be left unabsorbed while an eligible gain remains.");
  }

  /* =============================================================
     TABLE F — quarter break-up (234C) ties to Schedule BFLA / summary
     ============================================================= */
  const AF=(CG.AccruOrRecOfCG&&typeof CG.AccruOrRecOfCG==="object")?CG.AccruOrRecOfCG:{};
  const QK=["Upto15Of6","Upto15Of9","Up16Of9To15Of12","Up16Of12To15Of3","Up16Of3To31Of3"];
  const fSum=fk=>{const dr=g(AF,fk+".DateRange")||{};return QK.reduce((a,q)=>a+n(dr[q]),0);};
  const bf5=bk=>n(g(I,"ScheduleBFLA."+bk+".IncBFLA.IncOfCurYrAfterSetOffBFLosses"));

  if(I.ScheduleBFLA&&typeof I.ScheduleBFLA==="object"){
    /* 426 — Sl.1 (STCG @20%) ↔ item 5vi of BFLA */
    A(426,eqi(fSum("ShortTermUnder20Per"),bf5("STCG20Per")),
      "Schedule CG Table F Sl.No. 1: the break-up of all the quarters must equal item 5vi of Schedule BFLA.");
    /* 401 — Sl.4 (STCG at DTAA rates) ↔ item 5ix of BFLA */
    A(401,eqi(fSum("ShortTermUnderDTAARate"),bf5("STCGDTAARate")),
      "Schedule CG Table F Sl.No. 4: the break-up of all the quarters must equal item 5ix of Schedule BFLA.");
    /* 427 — Sl.7 (LTCG @12.5%) ↔ item 5xb of BFLA */
    A(427,eqi(fSum("LongTermUnder12_5Per"),bf5("LTCG12_5Per")),
      "Schedule CG Table F Sl.No. 7: the break-up of all the quarters must equal item 5xb of Schedule BFLA.");
  }

  /* ---- 415: Sl.8 (VDA @30%) quarter break-up = C2 (income from transfer of VDA) ---- */
  A(415,eqi(fSum("VDATrnsfGainsUnder30Per"),CG.IncmFromVDATrnsf),
    "Schedule CG Table F Sl.No. 8: the break-up of all the quarters (VDA) must equal the value at Sl. No. C2.");

  /* =============================================================
     446 — Schedule OS dividend u/s 2(22)(f) mandatory when a buy-back loss
     (A(A) or B(A)) is shown in Schedule CG
     ============================================================= */
  const bbLoss=n(g(ST,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"))<0
            || n(g(LT,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"))<0;
  A(446,!bbLoss||n(g(I,"ScheduleOS.IncOthThanOwnRaceHorse.Dividend22f"))>0,
    "Schedule CG: dividend income u/s 2(22)(f) at Sl. No. 1a(iii) of Schedule OS is mandatory when a capital loss on buy-back is shown at A(A) or B(A) of Schedule CG.");

  // =====================================================================
  // NOT MAPPABLE (checkable part absent in the ITR-5 build — logged, not fired):
  // - 402  Table F Sl.6 ~ BFLA 5xi (LTCG taxable @20% with indexation): that
  //        transitional proviso is for resident individuals/HUF only, so the
  //        @20%-with-indexation bucket is HIDDEN for a firm/AOP/BOI (CG.md sec 7)
  //        — no LongTermUnder20Per Table-F row and no BFLA LTCG20Per key exist.
  //        not mappable: rate bucket not built for ITR-5 filers.
  // - 414  Table F Sl.8 ~ 'Income under head Capital Gain' of Schedule SI:
  //        duplicate of 415 — the VDA (115BBH) CG income that feeds SI is the
  //        same C2 figure already tied by 415; SI further rate-splits VDA into
  //        CG vs business, which cannot be reconstructed from the CG leaves
  //        without risking a false positive.
  //        not mappable: duplicate of 415 (SI 115BBH split not reproducible).
  // - 422/423  Ei2 / Eii = A3e + A4a + A8a + A(A)@20%  and
  // - 424/425  Ei6 / Evi = B1g+B2e+B3c+B4+B5+B6c+B7+B8e+B9+B10a1+B10a2+B(A)@12.5%:
  //        the Table-E 'income available' rows are composed inside the CG engine
  //        from the rate-split of several heads (incl. non-resident-only A4/A5/
  //        B5/B6/B7 and the rate-split buy-back), not from schema leaves.
  //        not mappable: engine-computed rate-split aggregate.
  // - 447  B4 (112A) — 'deduction u/s 48 cannot be claimed if cost of
  //        acquisition is not provided': in ITR-5 the B4 head (SaleOfEquityShare
  //        Us112A) carries only CapgainonAssets — the section-48 working lives in
  //        Schedule 112A, so there is no u/s-48 deduction leaf at CG B4 to test.
  //        not mappable: no section-48 leaf at ITR-5 CG B4.
  // - 449  A10 = A1e+A2c+A3e+A4a+A4b+A5e+A6g+A7+A8-A9a+A(A): TotalSTCG is the
  //        engine's aggregate across all rate-split STCG heads incl. NR-only
  //        A4b/A5e and the A9a DTAA-not-taxable subtraction — not safely
  //        reconstructible from schema leaves without false positives.
  //        not mappable: engine-computed cross-head total.
  // =====================================================================
});
