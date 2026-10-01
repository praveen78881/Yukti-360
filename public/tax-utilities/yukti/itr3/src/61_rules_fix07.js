/* ITR-3 · AY 2026-27 — validation-rule FIX batch 07 (enforcement gaps/weak fixes).
   Registered via ruleset(); A(n,cond,msg) fires when cond is FALSE. Reads guarded; nothing throws.
   Serials: 854 855 857 859 862 863 864 865 866 869 870 871 872 873 891 892 893 894 922 939.
   Schema paths copied from 70_sec_si.js / 70_sec_os.js / 70_sec_loss.js / 70_sec_fa.js /
   70_sec_bp.js / 70_sec_tax.js and the existing 60_rules.js / 61_rules_g*.js batches. */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  var FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  var res=FS.ResidentialStatus||"RES";
  var isNRI=(res==="NRI");
  var ti=RG(I,"PartB-TI",{})||{};
  var tti=RG(I,"PartB_TTI",{})||{};

  /* ---- shared guarded readers -------------------------------------------------- */
  /* Schedule SI rows (SecCode / SplRateInc / SplRateIncTax) — 70_sec_si.js expSi */
  var siRows=RG(I,"ScheduleSI.SplCodeRateTax",[]); if(!Array.isArray(siRows))siRows=[];
  var siSum=function(codes){var m={};codes.forEach(function(c){m[c]=1;});
    return RSUM(siRows.filter(function(r){return !!m[String((r||{}).SecCode)];}),"SplRateInc");};
  var siHas=function(codes){var m={};codes.forEach(function(c){m[c]=1;});
    return siRows.some(function(r){return !!m[String((r||{}).SecCode)];});};
  /* Schedule BFLA column 5 (income after set-off of brought-forward losses) — 70_sec_loss.js expLoss:
     row i Salary · ii HP · iii BusProfExclSpecProf · iv SpeculativeInc · v SpecifiedInc · vi STCG20Per ·
     vii STCG30Per · viii STCGAppRate · ix STCGDTAARate · x LTCG12_5Per · xi LTCGDTAARate ·
     xii OthSrcExclRaceHorse · xiii OthSrcRaceHorse · xiv IncOSDTAA */
  var hasBFLA=!!I.ScheduleBFLA;
  var bf5=function(key){return N(RG(I,"ScheduleBFLA."+key+".IncBFLA.IncOfCurYrAfterSetOffBFLosses"));};
  /* Schedule OS item 2f DTAA rows — 70_sec_os.js expOs (NRIDTAADtlsSchOS[]): for a non-resident a
     row counts only when TaxRescertifiedFlag (TRC) is "Y"; for a resident every row counts. */
  var osIO=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};
  var dtaaRows=RG(osIO,"IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS",[]); if(!Array.isArray(dtaaRows))dtaaRows=[];
  var dtaaCounted=dtaaRows.filter(function(r){r=r||{};return isNRI?(r.TaxRescertifiedFlag==="Y"):true;});
  var dtaaAmt=function(nature,item){return RSUM(dtaaCounted.filter(function(r){
      return String(r.NatureOfIncome)===nature&&(item==null||String(r.ItemNoincl)===String(item));}),"DTAAamt");};

  /* =============================================================
     SCHEDULE SI ↔ SCHEDULE BP (854)
     ============================================================= */
  if(I.ScheduleSI||I.ITR3ScheduleBP)
    A(854, REQ(siSum(["5BBG_BP"]), N(RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.Us115BBG"))),
      "Schedule SI: income u/s 115BBG under the head business or profession must equal Sl.No. 3f of Schedule BP.");

  /* =============================================================
     SCHEDULE SI ↔ SCHEDULE BFLA column 5 (855, 859, 870, 871, 872, 873)
     ============================================================= */
  if(I.ScheduleSI&&hasBFLA){
    A(855, REQ(siSum(["DTAAOS"]), bf5("IncOSDTAA")),
      "Schedule SI: income from other sources chargeable at special rates as per DTAA must equal Sl.No. 5(xiv) of Schedule BFLA"+(isNRI?" (non-resident: DTAA income counts only where the TRC flag is Yes)":"")+".");
    A(859, REQ(siSum(["5ADii","PTI_STCG30P"]), bf5("STCG30Per")),
      "Schedule SI: income u/s 115AD(1)(ii) (STCG of FII, STT not paid) plus pass-through STCG chargeable @30% must equal Sl.No. 5(vii) of Schedule BFLA.");
    /* FIXED (engSi now scales the special-rate CG heads to post-BFLA, S.C.loss.afterB). */
    A(870, REQ(siSum(["21","22","21ciii","5AC1c","5ACA1b","5ADiii","5Eb","2A","5ADiiiP","PTI_LTCG12_5P112A","PTI_LTCG12_5P"]), bf5("LTCG12_5Per")),
      "Schedule SI: the sum of the long-term capital gain heads (112(1), 112(1)(c)(iii), 115AC, 115ACA, 115AD, 115E, 112A, 115AD(1)(iii) proviso, PTI LTCG @12.5%) must equal Sl.No. 5(x) of Schedule BFLA.");
    A(871, REQ(siSum(["1A","5AD1biip","PTI_STCG20P"]), bf5("STCG20Per")),
      "Schedule SI: income u/s 111A / 115AD(1)(b)(ii) proviso plus pass-through STCG chargeable @20% must equal Sl.No. 5(vi) of Schedule BFLA.");
    A(872, REQ(siSum(["DTAASTCG"]), bf5("STCGDTAARate")),
      "Schedule SI: short-term capital gains chargeable at special rates as per DTAA must equal Sl.No. 5(ix) of Schedule BFLA.");
    A(873, REQ(siSum(["DTAALTCG"]), bf5("LTCGDTAARate")),
      "Schedule SI: long-term capital gains chargeable at special rates as per DTAA must equal Sl.No. 5(xi) of Schedule BFLA.");
  }

  /* =============================================================
     SCHEDULE SI — tax cannot be nil where income > 0 (857, corrected exclusion set)
     Rule note excludes: OS DTAA, tax on accumulated PF (111), 112A, PTI 112A @12.5%, 111A,
     112 (proviso) (codes 21/22), 115AD(1)(iii) proviso, STCG/LTCG DTAA, PTI STCG @20%.
     (The g3 version wrongly excluded 5Ea/5Eb and omitted 21/22/5ADiiiP/PTI_STCG20P.)
     ============================================================= */
  if(I.ScheduleSI){
    var SIEXC7={"DTAAOS":1,"1":1,"2A":1,"PTI_LTCG12_5P112A":1,"1A":1,"21":1,"22":1,"5ADiiiP":1,"DTAASTCG":1,"DTAALTCG":1,"PTI_STCG20P":1};
    siRows.forEach(function(r){r=r||{};
      A(857, N(r.SplRateInc)<=0||N(r.SplRateIncTax)>0||!!SIEXC7[String(r.SecCode)],
        "Schedule SI: tax computed cannot be nil where the income is greater than zero (row "+(r.SecCode||"")+").");});
  }

  /* =============================================================
     SCHEDULE OS item 2 ↔ SCHEDULE SI (862, 863–866, 869)
     Each special-rate code in OS 2d / 2e is passed to SI after reducing the 2f DTAA amount
     disclosed against that item and section (NRI: TRC = Yes rows only; resident: every row).
     ============================================================= */
  if(I.ScheduleOS){
    /* 2d "Any other income chargeable at special rate" — OthersGrossDtls[] */
    var d2=RG(osIO,"OthersGrossDtls",[]); if(!Array.isArray(d2))d2=[];
    var d2ByCode={};
    d2.forEach(function(r){r=r||{};var c=String(r.SourceDescription||"");if(!c)return;d2ByCode[c]=N(d2ByCode[c])+N(r.SourceAmount);});
    A(862, Object.keys(d2ByCode).every(function(c){
        var expect=Math.max(0,N(d2ByCode[c])-dtaaAmt("2d",c));
        return REQ(siSum([c]),expect);}),
      "Schedule SI: each income selected at 2d of Schedule OS (any other income chargeable at a special rate) must appear in Schedule SI under the same section, net of the DTAA amount disclosed against it at 2f.");
    /* 2e "Pass through income chargeable at special rates" — PTIOthersGrossDtls[] */
    var e2=RG(osIO,"PTIOthersGrossDtls",[]); if(!Array.isArray(e2))e2=[];
    var e2ByCode={};
    e2.forEach(function(r){r=r||{};var c=String(r.SourceDescription||"");if(!c)return;e2ByCode[c]=N(e2ByCode[c])+N(r.SourceAmount);});
    var e2Codes=Object.keys(e2ByCode);
    var e2Expect=function(c){return Math.max(0,N(e2ByCode[c])-dtaaAmt("2e",c));};
    A(863, e2Codes.every(function(c){return REQ(siSum([c]),e2Expect(c));}),
      "Schedule SI: each pass-through income selected at 2e of Schedule OS must appear in Schedule SI under the same section, net of the DTAA amount disclosed against it at 2f.");
    A(864, REQ(e2Codes.reduce(function(a,c){return a+siSum([c]);},0), e2Codes.reduce(function(a,c){return a+e2Expect(c);},0)),
      "Schedule SI: the total of the 2e pass-through special-rate heads of Schedule OS (net of 2f DTAA) must equal the corresponding rows of Schedule SI.");
    /* reverse direction: an OS-type PTI head in SI (PTI_5…) must have been disclosed at 2e */
    A(865, siRows.every(function(r){r=r||{};var c=String(r.SecCode||"");
        if(c.indexOf("PTI_5")!==0||N(r.SplRateInc)<=0)return true;
        return e2Codes.indexOf(c)>=0;}),
      "Schedule SI: a pass-through other-sources head (PTI 115A/115AC/115ACA/115AD/115BBA/115BBF/115BBG/115E) carries income but is not disclosed at 2e of Schedule OS.");
    A(866, e2Codes.every(function(c){return siSum([c])<=N(e2ByCode[c])+1;}),
      "Schedule SI: the income under a 2e pass-through section cannot exceed the amount disclosed for that section at 2e of Schedule OS.");
    /* 2a(ii) winnings from online games u/s 115BBJ */
    A(869, REQ(siSum(["5BBJ"]), Math.max(0,N(osIO.IncChrgblUs115BBJ)-dtaaAmt("2aii",null))),
      "Schedule SI: income u/s 115BBJ (winnings from online games) must equal Sl.No. 2a(ii) of Schedule OS after reducing the corresponding DTAA income at 2f.");
  }

  /* =============================================================
     SCHEDULE FSI — relief claimed against a head needs that much income under the head (891–894)
     Companion to A890 (salary, 61_rules_g2.js). Schema: ScheduleFSI.ScheduleFSIDtls[].<head>
     {IncFrmOutsideInd, TaxPaidOutsideInd, TaxPayableinInd, TaxReliefinInd} — 70_sec_fa.js expFa.
     ============================================================= */
  if(I.ScheduleFSI){
    var fsi=RG(I,"ScheduleFSI.ScheduleFSIDtls",[]); if(!Array.isArray(fsi))fsi=[];
    /* HP: Sl.No. 1k (each property) + 2 (pass-through) = item 3 TotalIncomeChargeableUnHP (A216) */
    var hpProps=RG(I,"ScheduleHP.PropertyDetails",[]); if(!Array.isArray(hpProps))hpProps=[];
    var hpShown=I.ScheduleHP?(RSUM(hpProps,function(p){return RG(p,"Rentdetails.IncomeOfHP");})+N(RG(I,"ScheduleHP.PassThroghIncome"))):0;
    /* Business: gross profit of the Trading Account + positive net profit of P&L (or no-books), never
       less than the income as per Schedule BP D / Part B-TI 3v — the widest lawful measure */
    var busShown=Math.max(
      Math.max(0,N(RG(I,"TradingAccount.GrossProfitFrmBusProf")))+Math.max(0,N(RG(I,"PARTA_PL.DebitsToPL.PBT"))),
      Math.max(0,N(RG(I,"PARTA_PL.NoBooksOfAccPL.TotBusinessProfession"))),
      Math.max(0,N(RG(I,"ITR3ScheduleBP.IncChrgUnHdProftGain"))),
      Math.max(0,N(RG(ti,"ProfBusGain.TotProfBusGain"))));
    /* Capital gains: Schedule CG C1 (SumOfCGIncm) or Part B-TI 4e (incl. 115BBH) */
    var cgShown=Math.max(N(RG(I,"ScheduleCGFor23.SumOfCGIncm")),N(RG(ti,"CapGain.TotalCapGains")));
    /* Other sources: the income shown in Schedule OS — gross item 1 + item 2 + race-horse receipts (8a),
       or the chargeable figures if higher */
    var osShown=Math.max(
      N(osIO.GrossIncChrgblTaxAtAppRate)+N(osIO.IncChargeableSpecialRates)+N(RG(I,"ScheduleOS.IncFromOwnHorse.Receipts")),
      N(RG(I,"ScheduleOS.TotOthSrcNoRaceHorse")),N(RG(I,"ScheduleOS.IncChargeable")),N(RG(ti,"IncFromOS.TotIncFromOS")));
    fsi.forEach(function(b,i){b=b||{};var L="Schedule FSI country "+(i+1)+": ";
      /* FIXED: the client's FSI-UK foreign income moved from HP (net HP is a loss) to CG (has headroom). */
      A(891, !N(RG(b,"IncFromHP.TaxReliefinInd"))||hpShown>=N(RG(b,"IncFromHP.IncFrmOutsideInd"))-1,
        L+"tax relief is claimed against house property — the income at Sl.No. 1k + 2 of Schedule HP cannot be less than the house-property income shown in Schedule FSI.");
      A(892, !N(RG(b,"IncFromBusiness.TaxReliefinInd"))||busShown>=N(RG(b,"IncFromBusiness.IncFrmOutsideInd"))-1,
        L+"tax relief is claimed against business or profession — the business income shown (Trading Account gross profit + positive P&L net profit / no-books profit) cannot be less than the business income shown in Schedule FSI.");
      A(893, !N(RG(b,"IncCapGain.TaxReliefinInd"))||cgShown>=N(RG(b,"IncCapGain.IncFrmOutsideInd"))-1,
        L+"tax relief is claimed against capital gains — the income shown under capital gains cannot be less than the capital-gains income shown in Schedule FSI.");
      A(894, !N(RG(b,"IncOthSrc.TaxReliefinInd"))||osShown>=N(RG(b,"IncOthSrc.IncFrmOutsideInd"))-1,
        L+"tax relief is claimed against other sources — the income shown under other sources cannot be less than the other-sources income shown in Schedule FSI.");
    });
  }

  /* =============================================================
     PART B-TI 3v ↔ SCHEDULE BP (922 — the 60_rules.js version ends in "||true" and never fires)
     3i = A37 (nil if loss), 3ii = B42 (nil if loss), 3iii = C48 (nil if loss), 3iv = 115BBF/G/H;
     3v = 3i + 3ii + 3iii + 3iv, i.e. Schedule BP D with each component floored at nil.
     ============================================================= */
  if(I.ITR3ScheduleBP){
    var pg=RG(ti,"ProfBusGain",{})||{};
    var a37=N(RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec.NetPLBusOthThanSpec7A7B7C"));
    var b42=N(RG(I,"ITR3ScheduleBP.SpecBusinessInc.AdjustedPLFrmSpecuBus"));
    var c48=N(RG(I,"ITR3ScheduleBP.SpecifiedBusinessInc.PLFrmSpecifiedBus"));
    var bpD=N(RG(I,"ITR3ScheduleBP.IncChrgUnHdProftGain"));
    var expectBP=Math.max(0,a37)+Math.max(0,b42)+Math.max(0,c48)+N(pg.ProfIncome115BBF);
    A(922, REQ(pg.TotProfBusGain, expectBP)||(a37>=0&&b42>=0&&c48>=0&&REQ(pg.TotProfBusGain, bpD+N(pg.ProfIncome115BBF))),
      "Part B-TI: income under the head profits and gains of business or profession (3v) must equal the income as per Schedule BP (D), each component nil if a loss.");
  }

  /* =============================================================
     PART B-TTI taxes paid → income details and tax computation must be disclosed (939)
     ============================================================= */
  {var tp=RG(tti,"TaxPaid.TaxesPaid",{})||{};
    var anyPaid=N(tp.TotalTaxesPaid)>0||N(tp.AdvanceTax)>0||N(tp.TDS)>0||N(tp.TCS)>0||N(tp.SelfAssessmentTax)>0;
    A(939, !anyPaid||(!!I["PartB-TI"]&&!!RG(tti,"ComputationOfTaxLiability",null)),
      "Part B-TTI: taxes paid are disclosed — the income details (Part B-TI) and the tax computation (Part B-TTI) must also be disclosed.");
  }
});
