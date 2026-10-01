/* ITR-3 · AY 2026-27 — validation-rule FIX batch 01 (enforcement gaps/weak fixes).
   Registered via ruleset(); A(n,cond,msg) fires when cond is FALSE. Reads guarded; nothing throws.
   Serials: 10, 28, 37, 42, 43, 44, 46, 48(weak), 67, 76, 119, 121, 134, 141, 146, 149, 166, 168(weak),
   173(weak), 179. Every cond is TRUE when the data is absent or the rule is not applicable. */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const G2=RG(I,"PartA_GEN2.AuditInfo",{})||{};
  const newR=FS.OptOldRegimeCurrAY!=="Y";           /* new regime default; old = 10-IEA opt-out */
  const res=FS.ResidentialStatus||"RES";
  const hasBP=FS.IncFrmBusOrProf==="Y";

  /* =============================================================
     PART A — GENERAL
     ============================================================= */
  /* A10 — seventh proviso to 139(1) 'Yes' needs at least one condition and the amount/details of each 'Yes' */
  A(10,FS.SeventhProvisio139!=="Y"||(
      (FS.DepAmtAggAmtExcd1CrPrYrFlg==="Y"||FS.IncrExpAggAmt2LkTrvFrgnCntryFlg==="Y"||FS.IncrExpAggAmt1LkElctrctyPrYrFlg==="Y"||FS.clauseiv7provisio139i==="Y")
      &&(FS.DepAmtAggAmtExcd1CrPrYrFlg!=="Y"||N(FS.AmtSeventhProvisio139i)>0)
      &&(FS.IncrExpAggAmt2LkTrvFrgnCntryFlg!=="Y"||N(FS.AmtSeventhProvisio139ii)>0)
      &&(FS.IncrExpAggAmt1LkElctrctyPrYrFlg!=="Y"||N(FS.AmtSeventhProvisio139iii)>0)
      &&(FS.clauseiv7provisio139i!=="Y"||(RG(FS,"clauseiv7provisio139iDtls",[])||[]).some(r=>N((r||{}).clauseiv7provisio139iAmount)>0))),
    "Return filed under the seventh proviso to section 139(1) is 'Yes' — select the applicable condition(s) and give the amount/details of each.");
  /* A28 — a2ii 'More than 5%' means liable to audit u/s 44AB */
  A(28,RG(G2,"AgrOFAllAmtsRcvd","")!=="MoreThan5Per"||G2.LiableSec44ABflg==="Y",
    "You are liable to audit u/s 44AB, since Sl.No. a2ii (receipts in cash) is 'More than 5%' in Part A General.");
  /* A37 — DTAA rate benefit (CG A9/B12, OS 2f, EI 4) is for a non-resident only */
  (function(){
    const ST=RG(I,"ScheduleCGFor23.ShortTermCapGainFor23",{})||{}, LT=RG(I,"ScheduleCGFor23.LongTermCapGain23",{})||{};
    const cgDtaa=N(ST.TotalAmtTaxUsDTAAStcg)+N(ST.TotalAmtNotTaxUsDTAAStcg)+N(LT.TotalAmtTaxUsDTAALtcg)+N(LT.TotalAmtNotTaxUsDTAALtcg)
      +(RG(ST,"NRICgDTAA.NRIDTAADtls",[])||[]).length+(RG(LT,"NRICgDTAA.NRIDTAADtls",[])||[]).length;
    const osDtaa=N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChargblSplRateOS.TotalAmtTaxUsDTAASchOs"))
      +RSUM(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS",[])||[],"DTAAamt");
    const eiDtaa=N(RG(I,"ScheduleEI.IncChrgblAsPerDTAA"))+RSUM(RG(I,"ScheduleEI.IncNotChrgblAsPerDTAA.IncNotChrgblAsPerDTAADtls",[])||[],"AmountOfIncome");
    A(37,res==="NRI"||(cgDtaa===0&&osDtaa===0&&eiDtaa===0),
      "Status is not Non-Resident — DTAA benefit in the rate of taxation (CG A9/B12, OS 2f, EI 4) is not available.");
  })();
  /* A42 — 10-IEA filed to re-enter the new regime in an earlier AY: its AY and acknowledgement are mandatory */
  A(42,FS.F10IEAEarlierAYNewRegime!=="Y"||!!(FS.AssYrF10IEANewTaxReg&&FS.Form10IEAEarlierAYAckNewRegime),
    "Form 10-IEA filed to re-enter the new tax regime in an earlier year is 'Yes' — its assessment year and acknowledgement number are mandatory.");
  /* A43 — opted out earlier (old regime via 10-IEA), not re-entered earlier, now in the new regime: the current-AY re-entry answer is mandatory */
  A(43,!(newR&&hasBP&&FS.Form10IEAEarlierAYOldRegime==="Y"&&FS.F10IEAEarlierAYNewRegime!=="Y")||!!FS.F10IEACurrAYNewRegime,
    "Form 10-IEA was not filed with the re-enter option for an earlier year — answer 'Have you furnished Form 10-IEA for re-entering the new tax regime in the current AY?'.");
  /* A44 — re-entering the new regime in the current AY needs the 10-IEA date and acknowledgement */
  A(44,FS.F10IEACurrAYNewRegime!=="Y"||!!(FS.F10IEADateCurrAYNewTax&&FS.F10IEAAckNoCurrAYNewTax),
    "Form 10-IEA furnished for re-entering the new tax regime in the current AY — its date and acknowledgement number are mandatory.");
  /* A46 — A19(b) 'Yes' (income from business/profession) needs Schedule BP */
  A(46,!hasBP||!!I.ITR3ScheduleBP,
    "Income under 'Profits and gains of business or profession' is selected at A19(b) — Schedule BP (business income) is mandatory.");
  /* A48 (WEAK companion) — 115AD(1)(i) income in Schedule OS needs 'Whether you are an FPI?' = Yes */
  (function(){
    const OSI=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};
    const AD1=["5AD1i","5AD1iP","5AD1iDiv"], PAD1=["PTI_5AD1i","PTI_5AD1iP","PTI_5AD1iDiv"];
    const os2d=RSUM((OSI.OthersGrossDtls||[]).filter(r=>AD1.indexOf((r||{}).SourceDescription)>=0),"SourceAmount");
    const os2e=RSUM((OSI.PTIOthersGrossDtls||[]).filter(r=>PAD1.indexOf((r||{}).SourceDescription)>=0),"SourceAmount");
    const dr=RG(I,"ScheduleOS.DividendIncUs115AD1i.DateRange",{})||{};
    const q10=["Upto15Of6","Up16Of6To15Of9","Up16Of9To15Of12","Up16Of12To15Of3","Up16Of3To31Of3"].reduce((a,k)=>a+N(dr[k]),0);
    A(48,FS.FiiFpiFlag==="Y"||(os2d+os2e+q10)===0,
      "Income offered under section 115AD(1)(i) in Schedule OS needs 'Whether you are an FPI?' = Yes in Part A General.");
  })();

  /* =============================================================
     PART A — MANUFACTURING / TRADING ACCOUNT (no negative signs)
     ============================================================= */
  const negLeaves=function(o,skip,path,out){out=out||[];if(!o||typeof o!=="object")return out;
    Object.keys(o).forEach(k=>{const v=o[k];const p=path?path+"."+k:k;
      if(v&&typeof v==="object")negLeaves(v,skip,p,out);
      else if(typeof v==="number"&&v<0&&skip.indexOf(k)<0)out.push(p);});
    return out;};
  /* A67 — Manufacturing Account: only Sl.No.3 (cost of goods produced) may be negative */
  A(67,!I.ManufacturingAccount||negLeaves(I.ManufacturingAccount,["CostOfGoodsPrdcd"],"").length===0,
    "Part A-Manufacturing Account: a negative amount is allowed only at Sl.No. 3 'Cost of goods produced — transferred to Trading Account'.");
  /* A76 — Trading Account: only Sl.No.11 (cost from Mfg) and 12 (gross profit, 12b, 12d) may be negative */
  A(76,!I.TradingAccount||negLeaves(I.TradingAccount,["GoodsCostPrdcdFrmMA","GrossProfitFrmBusProf","IncomeIntradayTrd","IncomeFutureTrd"],"").length===0,
    "Part A-Trading Account: a negative amount is allowed only at Sl.No. 11 and/or 12.");

  /* =============================================================
     PART A — P&L / SCHEDULE BP cross-links
     ============================================================= */
  const PL=I.PARTA_PL||{};
  const BPo=RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec",{})||{};
  /* A119 — no-books speculative (65iv) filled: BP 2a must equal 65iv + Trading 12b */
  (function(){const s65iv=N(RG(PL,"NetIncomeFrmSpecActivity"));const t12b=N(RG(I,"TradingAccount.IncomeIntradayTrd"));
    A(119,!I.ITR3ScheduleBP||!s65iv||REQ(BPo.NetPLFromSpecBus,s65iv+t12b),
      "Schedule BP: Sl.No. 2a (net profit/loss from speculative business) must equal 65iv of Schedule P&L plus 12b of the Trading Account.");
  })();
  /* A121 — 44AD is not available to general commission agents or professions referred in 44AA(1) */
  (function(){
    const BAR=["09005","14001","14002","14003","14004","14006","14008","16001","16002","16003","16004","16005","16007","16008","16009","16013","16018","16020","16021",
      "18001","18002","18003","18004","18005","18010","18011","18012","18013","18014","18015","18016","18017","18018","18019","18020","20010","20011","20012"];
    const rows=RG(PL,"NatOfBus44AD",[])||[];
    A(121,!rows.some(r=>BAR.indexOf(String((r||{}).CodeAD||""))>=0),
      "Section 44AD is not applicable to general commission agents (code 09005) or to professions referred in section 44AA(1) — remove that code from the 44AD business table.");
  })();
  /* A134 — 44ADA gross receipts > 50 lakh with cash receipts > 5%: audit u/s 44AB is mandatory */
  (function(){const ada=RG(PL,"PersumptiveInc44ADA",{})||{};const gr=N(ada.GrsReceipt),cash=N(ada.GrsTotalTrnOverInCash44ADA);
    A(134,!(gr>5000000&&cash>0.05*gr)||G2.LiableSec44ABflg==="Y",
      "Gross receipts u/s 44ADA exceed Rs.50 lakh and cash receipts exceed 5% of total receipts — tax audit u/s 44AB is mandatory.");
  })();
  /* A141 — P&L 66(ii) net profit cannot exceed 66(i) gross receipts/turnover (total and each row) */
  (function(){const nr=RG(PL,"NonResidentPL",{})||{};const rows=RG(PL,"NonResidentPLDetails",[])||[];
    A(141,N(nr.NetProfit)<=N(nr.GrossReceipt)&&rows.every(r=>N((r||{}).NetProfit)<=N((r||{}).GrossReceipt)),
      "Part A-P&L: net profit at Sl.No. 66(ii) cannot be more than the gross receipts/turnover at Sl.No. 66(i).");
    /* A146 — 44BBC: net profit cannot be less than 20% of gross receipts/turnover */
    A(146,rows.filter(r=>(r||{}).Section==="44BBC").every(r=>N(r.NetProfit)>=Math.floor(0.2*N(r.GrossReceipt))-1),
      "Part A-P&L: under section 44BBC the net profit at 66(ii) cannot be less than 20% of the gross receipts/turnover at 66(i).");
  })();
  /* A149 — BP Sl.No.23 must be at least OI 5a + 5b + 5c + 5d */
  (function(){const oi=RG(I,"PARTA_OI.NoCredToPLAmt",{})||{};
    const s5=N(oi.Section28Items)+N(oi.ProformaCreditsDue)+N(oi.PrevYrEscalClaim)+N(oi.OthItemInc);
    A(149,!I.PARTA_OI||!I.ITR3ScheduleBP||N(BPo.OthItemDisallowUs28To44DA)>=s5-1,
      "Schedule BP: Sl.No. 23 cannot be less than the sum of Sl.No. 5a to 5d of Part A-OI (amounts not credited to the P&L).");
  })();

  /* =============================================================
     SCHEDULE S — SALARY
     ============================================================= */
  if(I.ScheduleS){const sc=I.ScheduleS,emps=sc.Salaries||[];
    const al=RG(sc,"AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
    const ex=code=>RSUM(al.filter(a=>(a||{}).SalNatureDesc===code),"SalOthAmount");
    const natSum=code=>RSUM(emps,e=>RSUM(RG(e,"Salarys.NatureOfSalary.OthersIncDtls",[]).filter(x=>(x||{}).NatureDesc===code),"OthAmount"));
    const s1a=RSUM(emps,e=>RG(e,"Salarys.Salary")), s1b=RSUM(emps,e=>RG(e,"Salarys.ValueOfPerquisites")), s1c=RSUM(emps,e=>RG(e,"Salarys.ProfitsinLieuOfSalary"));
    /* A166 — 10(10) gratuity: not more than the gratuity offered in 17(1); Rs.20 lakh cap for PSU / PSU-pensioner / other-pensioner / others */
    (function(){const g=ex("10(10)");const govt=emps.some(e=>["CGOV","SGOV","PE","PESG"].indexOf((e||{}).NatureOfEmployment)>=0);
      A(166,!g||(g<=natSum("13")+1&&(govt||g<=2000000)),
        "Exemption u/s 10(10) (gratuity) cannot exceed the gratuity offered under 17(1), and is limited to Rs.20 lakh for PSU, PSU-pensioner, other-pensioner and other employers.");
    })();
    /* A168 (WEAK companion) — exempt allowances excluding HRA cannot exceed (1a + 1b + 1c) less HRA */
    (function(){const hra=ex("10(13A)");const exclHRA=RSUM(al.filter(a=>(a||{}).SalNatureDesc!=="10(13A)"),"SalOthAmount");
      A(168,!exclHRA||exclHRA<=Math.max(0,s1a+s1b+s1c-hra)+1,
        "Schedule Salary: total exempt allowances excluding HRA cannot exceed 1(a) + 1(b) + 1(c) as reduced by HRA.");
    })();
    /* A173 (WEAK companion) — 16(ii) entertainment allowance: lower of Rs.5,000 and one-fifth of basic salary (Govt/PSU employers) */
    (function(){const ent=N(sc.EntertainmntalwncUs16ii);
      const basic=RSUM(emps.filter(e=>["CGOV","SGOV","PSU"].indexOf((e||{}).NatureOfEmployment)>=0),
        e=>RSUM(RG(e,"Salarys.NatureOfSalary.OthersIncDtls",[]).filter(x=>(x||{}).NatureDesc==="1"),"OthAmount"));
      A(173,!ent||ent<=Math.min(5000,Math.floor(basic/5))+1,
        "Schedule Salary: entertainment allowance u/s 16(ii) is allowed only up to Rs.5,000 or one-fifth of basic salary, whichever is less.");
    })();
    /* A179 — 10(6) embassy/high-commission remuneration cannot exceed gross salary */
    A(179,ex("10(6)")<=N(sc.TotalGrossSalary)+1,
      "Schedule Salary: exempt allowance u/s 10(6) cannot be more than the gross salary.");
  }
});
