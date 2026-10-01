/* ITR-3 · AY 2026-27 — validation-rule FIX batch 08 (enforcement gaps/weak fixes).
   Registered via ruleset(); A(n,cond,msg) fires when cond is FALSE. Reads guarded; nothing throws.
   Slice: logs/ITR-3/rule_audit/fix_slices/fix_08.json — Category-A serials 950/966/967/972/982/990/991
   and Category-B ("may be treated as defective u/s 139(9)") serials 1/2/4/5/6/7/8/19/20/21/25/32/33.
   runRules has no B() collector, so the Category-B serials are recorded as Dd() advisories with a
   "B<n>:" message prefix (they do not turn Gate 6 red and do not collide with the D-notice family). */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const G2=RG(I,"PartA_GEN2.AuditInfo",{})||{};
  const newR=FS.OptOldRegimeCurrAY!=="Y";                 /* new regime default; old = 10-IEA opt-out */
  const res=FS.ResidentialStatus||"RES";                  /* RES / RNOR / NRI */
  const ti=RG(I,"PartB-TI",{})||{};
  const TI=N(ti.TotalIncome);
  const CTL=RG(I,"PartB_TTI.ComputationOfTaxLiability",{})||{};
  const TR=RG(CTL,"TaxRelief",{})||{};
  const Dn=RG(I,"ScheduleVIA.DeductUndChapVIA",{})||{};
  const sec=+FS.ReturnFileSec||0;                         /* 11 = 139(1), 12 = 139(4), 17 = 139(5) */
  const belated=sec===12;
  /* the schema carries no "date of filing"; it lives in the live state (S_.C.int.filed is a Date,
     S_.fs.filed is DD/MM/YYYY parsed by the shell's D()). Null when unknown → date rules stay silent. */
  const filedD=(function(){try{
    const d=S_&&S_.C&&S_.C.int&&S_.C.int.filed; if(d instanceof Date&&!isNaN(d))return d;
    if(typeof D==="function"&&S_&&S_.fs){const x=D(S_.fs.filed); if(x instanceof Date&&!isNaN(x))return x;}
  }catch(e){} return null;})();
  const late=!!(S_&&S_.C&&S_.C.int&&S_.C.int.late);       /* filed after the 139(1) due date (tax engine) */

  /* =============================================================
     A950 — 10(10B) retrenchment compensation is not for Government
     employees / Government pensioners
     ============================================================= */
  if(I.ScheduleS){
    const emps=RG(I,"ScheduleS.Salaries",[])||[];
    const al=RG(I,"ScheduleS.AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
    const ex10B=RSUM(al.filter(a=>a&&String(a.SalNatureDesc||"").indexOf("10(10B)")===0),"SalOthAmount"); /* 10(10B), 10(10B)(i), 10(10B)(ii) */
    const GOV=["CGOV","SGOV","PE","PESG"];                 /* CG / SG employees, CG / SG pensioners */
    const allGov=emps.length>0&&emps.every(e=>GOV.indexOf(e&&e.NatureOfEmployment)>=0);
    A(950,!ex10B||!allGov,"Exempt allowance u/s 10(10B) (retrenchment compensation) cannot be claimed by a Central/State Government employee or a Central/State Government pensioner.");
  }

  /* =============================================================
     A966 / A967 — Part B-TTI relief 6b/6c must equal Schedule TR items 2/3
     (no Schedule TR → no relief u/s 90/90A/91 in Part B-TTI)
     ============================================================= */
  {const tr=I.ScheduleTR1||null;
    A(966,tr?REQ(TR.Section90,RG(tr,"TaxReliefOutsideIndiaDTAA")):!N(TR.Section90),"Part B-TTI: relief claimed u/s 90/90A (6b) must equal the amount entered at item 2 of Schedule TR.");
    A(967,tr?REQ(TR.Section91,RG(tr,"TaxReliefOutsideIndiaNotDTAA")):!N(TR.Section91),"Part B-TTI: relief claimed u/s 91 (6c) must equal the amount entered at item 3 of Schedule TR.");
  }

  /* 972: not mappable — the RBI IFSC master is an external database; the form has no offline copy.
     The IFSC format (4 letters, 0, 6 alphanumerics) is already enforced by IFSC_RE in 70_sec_bank.js. */

  /* =============================================================
     A982 — relief u/s 89 only out of salary OR family pension (companion to 60_rules A982)
     ============================================================= */
  A(982,!N(TR.Section89)||N(ti.Salaries)>0||N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.FamilyPension"))>0,"Relief u/s 89 can be claimed only out of income from salary or family pension.");

  /* =============================================================
     A990 / A991 — fee u/s 234-I for a revised return (139(5)) filed after 31 Dec 2026
     ============================================================= */
  {const rev=sec===17, afterDec=!!(filedD&&filedD>new Date(2026,11,31));
    const f234i=N(RG(CTL,"IntrstPay.FeeFurnish234I"));
    A(990,!(rev&&afterDec&&TI<=500000)||f234i===1000,"Fee u/s 234-I: a revised return u/s 139(5) filed after 31 December 2026 with total income up to Rs.5 lakh attracts a fee of exactly Rs.1,000.");
    A(991,!(rev&&afterDec&&TI>500000)||f234i===5000,"Fee u/s 234-I: a revised return u/s 139(5) filed after 31 December 2026 with total income above Rs.5 lakh attracts a fee of exactly Rs.5,000.");
  }

  /* =============================================================
     CATEGORY B — defective-return checks (Dd advisories, "B<n>:" prefix)
     ============================================================= */
  /* B1 — 80-IA / 80-IAB / 80-IB / 80-IBA / 80-IE (schema key Section80IC) → Form 10CCB */
  Dd(1,!(N(Dn.Section80IA)||N(Dn.Section80IAB)||N(Dn.Section80IB)||N(Dn.Section80IBA)||N(Dn.Section80IC)),"B1: deduction u/s 80-IA/80-IAB/80-IB/80-IBA/80-IE is claimed — Form 10CCB must be filed within the due date.");

  /* B2 — return filed after the 139(1) due date (139(4) belated, or a late filing date):
     no current-year loss can be carried forward except house-property loss and specified-business loss */
  if(I.ScheduleCFL&&(belated||late)){const cy=RG(I,"ScheduleCFL.CurrentAYloss.LossSummaryDetail",{})||{};
    Dd(2,!(N(cy.BusLossOthThanSpecLossCF)||N(cy.LossFrmSpecBusCF)||N(cy.TotalSTCGPTILossCF)||N(cy.TotalLTCGPTILossCF)||N(cy.OthSrcLossRaceHorseCF)),"B2: the return is filed after the due date u/s 139(1) — no current-year loss other than the house-property loss and the specified-business loss can be carried forward in Schedule CFL.");
  }

  /* B4 — liable to audit u/s 92E → Part A-BS and Part A-P&L (direct flag trigger; Dd9 only covers business income > 0) */
  Dd(4,G2.LiableSec92Eflg!=="Y"||(!!I.PARTA_BS&&!!I.PARTA_PL),"B4: liable to audit u/s 92E — Part A-BS and Part A-P&L must be filled.");

  /* B5 — 35(2AB) in-house R&D deduction → Form 3CLA */
  {const r=RG(I,"ScheduleESR.DeductionUs35.Section35_2AB.DeductUs35",{})||{};
    Dd(5,!(N(r.AmtUs35Allowable)||N(r.AmtDebPL)),"B5: deduction u/s 35(2AB) (in-house scientific research) is claimed — Form 3CLA (report from an accountant) must be filed.");
  }

  /* B6 / B7 / B8 — 44AB liability from the Trading Account and Schedule BP */
  if(I.TradingAccount){const t=I.TradingAccount||{};
    const turn=N(t.SalesGrossReceiptsTotal), rec=N(t.GrossRcptFromProfession);
    const liable=G2.LiableSec44ABflg==="Y";
    /* B6 — plain thresholds: turnover > Rs.10 crore, or professional receipts > Rs.75 lakh (the lenient
       75-lakh bound is used; the 50-lakh bound applies only where cash receipts exceed 5%) */
    Dd(6,(turn<=100000000&&rec<=7500000)||liable,"B6: turnover exceeds Rs.10 crore or receipts from profession exceed Rs.75/50 lakh — the accounts must be audited u/s 44AB (Part A General: liable u/s 44AB = Yes).");
    if(I.ITR3ScheduleBP){const P=RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec",{})||{};
      const prof=N(P.NetPLBusOthThanSpec7A7B7C);            /* A37 — net profit of business other than speculative/specified */
      const exempt=newR?400000:250000;                     /* maximum amount not chargeable to tax */
      /* B7 — 44AD(5): eligible business (turnover ≤ Rs.3 crore, no profession mixed in) offering < 8% of turnover
         with total income above the exemption limit → audit u/s 44AB */
      const sub8=turn>0&&turn<=30000000&&!rec&&prof<Math.floor(turn*0.08)&&TI>exempt;
      Dd(7,!sub8||liable,"B7: income offered is less than 8% of the gross turnover while total income exceeds the exemption limit — check the liability for audit u/s 44AB read with 44AD(5) and fill the audit information.");
      /* B8 — 44ADA(4): profession (receipts ≤ Rs.75/50 lakh, no business mixed in) offering < 50% of receipts
         with total income above the exemption limit → audit information u/s 44AB is mandatory */
      const sub50=rec>0&&rec<=7500000&&!turn&&prof<Math.floor(rec*0.5)&&TI>exempt;
      Dd(8,!sub50||liable,"B8: receipts from profession are within Rs.75/50 lakh and the profit offered is less than 50% of the receipts — the audit information u/s 44AB is mandatory (section 44ADA(4)).");
    }
  }

  /* B19 — relief from taxation u/s 89A (Schedule S 2a / Schedule OS 5a) → Form 10EE */
  Dd(19,!(N(RG(I,"ScheduleS.Increliefus89A"))||N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.Increliefus89AOS"))),"B19: relief from taxation u/s 89A is claimed — Form 10EE must be filed with the amount of income claimed for relief.");

  /* B20 — non-resident claiming a treaty rate: Form 10F / TRC mandatory; a DTAA row without TRC = Yes earns no treaty benefit */
  if(res==="NRI"){
    const osRows=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS",[])||[];
    const cgRows=(RG(I,"ScheduleCGFor23.ShortTermCapGainFor23.NRICgDTAA.NRIDTAADtls",[])||[]).concat(RG(I,"ScheduleCGFor23.LongTermCapGain23.NRICgDTAA.NRIDTAADtls",[])||[]);
    const eiRows=RG(I,"ScheduleEI.IncNotChrgblAsPerDTAA.IncNotChrgblAsPerDTAADtls",[])||[];
    const noTRC=osRows.some(r=>r&&N(r.DTAAamt)>0&&r.TaxRescertifiedFlag!=="Y")
      ||cgRows.some(r=>r&&N(r.DTAAamt)>0&&r.TaxRescertifiedFlag!=="Y")
      ||eiRows.some(r=>r&&N(r.AmountOfIncome)>0&&r.TRCFlag!=="Y");
    Dd(20,!noTRC,"B20: a non-resident claiming a DTAA rate must file Form 10F and hold a Tax Residency Certificate — a DTAA row with TRC obtained = No is treated as no treaty benefit.");
  }

  /* B21 — dividend reduced from Schedule BP (A3d(i)) must be offered in Schedule OS (1a): the amount
     reduced from BP cannot exceed the dividend offered in OS (DGIT notification reconciliation) */
  if(I.ScheduleOS&&I.ITR3ScheduleBP){
    const bpDiv=N(RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.Dividend"));
    const osDiv=N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.DividendGross"));
    Dd(21,!bpDiv||bpDiv<=osDiv+1,"B21: the dividend reduced from Schedule BP (A3d(i)) must be offered as dividend income in Schedule OS (1a) — the two amounts do not reconcile.");
  }

  /* B25 — 80GG: Rs.5,000 per month of the period for which rent is actually paid → at most Rs.60,000 a year */
  Dd(25,N(Dn.Section80GG)<=60000,"B25: deduction u/s 80GG is limited to Rs.5,000 per month of the period for which rent is actually paid — at most Rs.60,000 for the year.");

  /* B32 / B33 — Form 10-IEA details in Part A General (old regime, business filer): the database match is
     CPC-side; offline the acknowledgement must be the 15-digit portal number and the date must lie within
     the window in which a Form 10-IEA for AY 2026-27 can exist (1 April 2026 to the 139(1) due date) */
  if(FS.OptOldRegimeCurrAY==="Y"&&FS.IncFrmBusOrProf==="Y"){
    const ack=String(FS.F10IEAAckNoCurrAYOldTax==null?"":FS.F10IEAAckNoCurrAYOldTax);
    const dt=String(FS.F10IEADateCurrAYOldTax||""), due=String(FS.ItrFilingDueDate||"2026-11-30");
    Dd(32,/^\d{15}$/.test(ack),"B32: the Form 10-IEA acknowledgement number in Part A General must be the 15-digit number issued by the e-filing portal — otherwise it will not match the department's records.");
    Dd(33,!!dt&&dt>="2026-04-01"&&dt<=due,"B33: the Form 10-IEA date in Part A General must fall between 1 April 2026 and the due date u/s 139(1) — otherwise it will not match the department's records.");
  }
});
