/* ITR-3 · AY 2026-27 — validation-rule FIX batch 02 (enforcement gaps/weak fixes).
   Registered via ruleset(); A(n,cond,msg) fires when cond is FALSE. Reads guarded; nothing throws.
   Serials: 180 181 183 189 190 196 197 202 209 (Schedule S) · 227 228 229 234 (HP / 80EE / 80EEA)
            237 242 243 256 257 261 270 (Schedule BP cross-links). Paths copied from 60_rules.js,
            61_rules_g*.js and the 70_sec_*.js export writers; no new keys invented. */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const newR=FS.OptOldRegimeCurrAY!=="Y";           /* new regime default; old = 10-IEA opt-out */

  /* =============================================================
     SCHEDULE S — exempt-allowance caps (item 3) against 17(1) drop-downs
     ============================================================= */
  if(I.ScheduleS){const sc=I.ScheduleS||{},emps=sc.Salaries||[];
    const al=RG(sc,"AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
    const ex=code=>RSUM(al.filter(a=>a&&a.SalNatureDesc===code),"SalOthAmount");
    const natSum=code=>RSUM(emps,e=>RSUM((RG(e,"Salarys.NatureOfSalary.OthersIncDtls",[])||[]).filter(x=>x&&x.NatureDesc===code),"OthAmount"));
    const cat=e=>String((e||{}).NatureOfEmployment||"");
    const gross=N(sc.TotalGrossSalary);
    const govtAny=emps.some(e=>["CGOV","SGOV","PE","PESG"].indexOf(cat(e))>=0);   /* CG/SG incl. their pensioners */
    const cgsg=emps.some(e=>cat(e)==="CGOV"||cat(e)==="SGOV");
    const othAllw=natSum("7")+natSum("OTH");                                       /* 17(1) "Other Allowance" + "Others" */
    /* 180 — 10(7) <= gross salary */
    A(180,ex("10(7)")<=gross+1,"Exempt allowance u/s 10(7) (allowances/perquisites paid outside India by the Government) cannot exceed the gross salary.");
    /* 181 — 10(10) gratuity: Rs.20 lakh for PSU / PSU-pensioners / Others-pensioners / Others; Rs.25 lakh where a CG/SG employer (or its pensioner) is present */
    A(181,ex("10(10)")<=(govtAny?2500000:2000000)+1,"Exempt allowance u/s 10(10) (death-cum-retirement gratuity) cannot exceed Rs."+(govtAny?"25":"20")+" lakh for this nature of employment.");
    /* 183 — WEAK fix: 10(10AA) <= the 'Leave Encashment' drop-down (code 16) in 17(1), with no bypass when that drop-down is nil */
    A(183,ex("10(10AA)")<=natSum("16")+1,"Exempt allowance u/s 10(10AA) cannot exceed the 'Leave Encashment' amount selected under section 17(1).");
    /* 189 / 190 — 10(14)(i) and 10(14)(ii) <= 'Other Allowance' + 'Others' in 17(1) */
    A(189,ex("10(14)(i)")<=othAllw+1,"Exempt allowance u/s 10(14)(i) cannot exceed the salary shown under 'Other Allowance' and 'Others' in section 17(1).");
    A(190,ex("10(14)(ii)")<=othAllw+1,"Exempt allowance u/s 10(14)(ii) cannot exceed the salary shown under 'Other Allowance' and 'Others' in section 17(1).");
    /* 196 — WEAK fix: the real enum key is 10(14)(ii)(115BAC) (transport allowance, handicapped) capped at Rs.38,400 */
    A(196,ex("10(14)(ii)(115BAC)")<=38400,"Exempt allowance u/s 10(14)(ii) — transport allowance for a physically handicapped assessee — cannot exceed Rs.38,400.");
    /* 197 — regime split of the 10(14) rows: new regime only the Rule-2BB(1)(a)-(c) / handicapped-transport [115BAC] rows; old regime only the general 10(14)(i)/(ii) rows */
    A(197,newR
      ? !al.some(a=>a&&(a.SalNatureDesc==="10(14)(i)"||a.SalNatureDesc==="10(14)(ii)")&&N(a.SalOthAmount))
      : !al.some(a=>a&&(a.SalNatureDesc==="10(14)(i)(115BAC)"||a.SalNatureDesc==="10(14)(ii)(115BAC)")&&N(a.SalOthAmount)),
      newR?"New regime: only 10(14)(i) allowances under Rule 2BB(1)(a)-(c) and the 10(14)(ii) transport allowance for a handicapped assessee can be claimed as exempt u/s 10(14)."
          :"Old regime: the 115BAC-specific 10(14) rows cannot be selected — claim the allowance under the general 10(14)(i)/10(14)(ii) row.");
    /* 202 — WEAK fix: the enum is 10(10B)(i) (first proviso), not 10(10B); cap Rs.5,00,000 */
    A(202,ex("10(10B)(i)")<=500000,"Exempt allowance u/s 10(10B) first proviso (compensation limit notified by the Central Government) cannot exceed Rs.5,00,000.");
    /* 209 — EIC (judge of Supreme Court / High Court) only against a Central/State Government employer */
    A(209,!ex("EIC")||cgsg,"Exempt income of a Supreme Court / High Court judge can be claimed only where the nature of employer is Central Government or State Government.");
  }

  /* =============================================================
     SCHEDULE HP — co-owners' share (234)
     ============================================================= */
  const props=RG(I,"ScheduleHP.PropertyDetails",[])||[];
  if(I.ScheduleHP){
    props.forEach((p,i)=>{p=p||{};const L="Property "+(i+1)+": ";const co=p.PropCoOwnedFlg==="YES";
      /* 234 — WEAK fix: the sum of the OTHER co-owners' shares must be below 100% (assessee share cannot be nil) */
      A(234,!co||RSUM(p.CoOwners||[],"PercentShareProperty")<100,L+"co-owned: the sum of the percentage shares of the other co-owner(s) must be less than 100%.");
    });
  }

  /* =============================================================
     80EE / 80EEA against the Section 24(b) loan table of Schedule HP (227-229)
     ============================================================= */
  const VD=RG(I,"ScheduleVIA.DeductUndChapVIA",{})||{};
  const int24b=RSUM(props,p=>RG(p,"Rentdetails.IntOnBorwCap"));
  const loans24b=[];props.forEach(p=>(RG(p,"Rentdetails.Section24B.Section24BDtls",[])||[]).forEach(l=>{if(l)loans24b.push(l);}));
  const nrm=s=>String(s==null?"":s).replace(/[^A-Za-z0-9]/g,"").toUpperCase();
  const in24b=r=>{r=r||{};const ac=nrm(r.LoanAccNoOfBankOrInstnRefNo),nm=nrm(r.BankOrInstnName);
    return loans24b.some(l=>(ac&&ac!=="NA"&&nrm(l.LoanAccNoOfBankOrInstnRefNo)===ac)||(nm&&nm!=="NA"&&nrm(l.BankOrInstnName)===nm));};
  /* 227 — 80EE/80EEA sit over and above 24(b): the Rs.2,00,000 limit u/s 24(b) must be exhausted in Schedule HP first */
  A(227,newR||!(N(VD.Section80EE)||N(VD.Section80EEA))||int24b>=200000,"Deduction u/s 80EE / 80EEA can be claimed only when the limit of interest u/s 24(b) (Rs.2,00,000) is exhausted in Schedule HP.");
  /* 228 / 229 — every 80EE / 80EEA loan must be one of the loans disclosed in Table 24(b) of Schedule HP (same lender or loan account) */
  A(228,!I.Schedule80EE||(RG(I,"Schedule80EE.Schedule80EEDtls",[])||[]).every(in24b),"Schedule 80EE: the loan details must be part of the loans disclosed in Table 24(b) of Schedule HP.");
  A(229,!I.Schedule80EEA||(RG(I,"Schedule80EEA.Schedule80EEADtls",[])||[]).every(in24b),"Schedule 80EEA: the loan details must be part of the loans disclosed in Table 24(b) of Schedule HP.");

  /* =============================================================
     SCHEDULE BP — cross-links to P&L / CG / OS / Part A-OI and 4a vs 35
     ============================================================= */
  if(I.ITR3ScheduleBP){const P=RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec",{})||{};
    /* 237 — A1 = P&L 53 + 61(ii) + 62(ii) + 63(ii) + 64(iii) + 65(iv) + 66(ii) (book BP.md K5) */
    if(I.PARTA_PL){const pl=I.PARTA_PL||{},nb=RG(pl,"NoBooksOfAccPL",{})||{};
      const noAcc=N(nb.TotBusinessProfession)||(N(nb.NetProfit)+N(nb.NetProfitPrf));
      const pbtPL=N(RG(pl,"DebitsToPL.PBT"))
        +N(RG(pl,"PersumptiveInc44AD.TotPersumptiveInc44AD"))
        +N(RG(pl,"PersumptiveInc44ADA.TotPersumptiveInc44ADA"))
        +N(RG(pl,"TotalPrsumptvIncUs44E"))
        +noAcc
        +N(RG(pl,"NetIncomeFrmSpecActivity"))
        +RSUM(RG(pl,"NonResidentPLDetails",[])||[],"NetProfit");
      /* FIXED: the test client's Trading account was reconciled so P&L PBT (item 53) = BP item 1 (1,110,000). */
      A(237,REQ(P.ProfBfrTaxPL,pbtPL),"Schedule BP: item 1 (profit before tax as per P&L) must equal P&L item 53 plus the presumptive income (61ii, 62ii, 63ii, 66ii), the no-account net profit (64iii) and speculative income (65iv).");
    }
    /* 242 / 243 — A3c / A3d cannot exceed the income offered in Schedule CG / Schedule OS (analogues of A241) */
    A(242,N(RG(P,"IncRecCredPLOthHeadDtls.CapitalGains"))<=Math.max(0,N(RG(I,"ScheduleCGFor23.TotScheduleCGFor23")))+1,"Schedule BP: the amount reduced at A3c (capital gains) cannot exceed the income offered in Schedule CG.");
    A(243,N(RG(P,"IncRecCredPLOthHeadDtls.OtherSources"))<=Math.max(0,N(RG(I,"ScheduleOS.IncChargeable")),N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.GrossIncChrgblTaxAtAppRate"))+N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChargeableSpecialRates")))+1,"Schedule BP: the amount reduced at A3d (other sources) cannot exceed the income offered in Schedule OS.");
    /* 256 / 257 / 261 — A20, A25, A32 against Part A-OI items 14, 3a+4d, 3b+4e */
    if(I.PARTA_OI){const oi=I.PARTA_OI||{};
      A(256,REQ(P.DeemIncUs41,RG(oi,"ProfTaxAmtUs41")),"Schedule BP: A20 (deemed income u/s 41) must equal item 14 of Part A-OI.");
      A(257,REQ(P.IncProfDecLossAccICDSAdj,N(oi.ProfDeviatDueAcctMeth)+N(RG(oi,"MethodOfValClgStk.EffectOnPL"))),"Schedule BP: A25 (increase in profit on account of ICDS adjustments and deviation in stock valuation) must equal items 3a + 4d of Part A-OI.");
      A(261,REQ(P.DecProfIncLossAccICDSAdj,N(oi.DecProOrIncLossUs145_2)+N(RG(oi,"MethodOfValClgStk.DecProOrIncLossUs145_A"))),"Schedule BP: A32 (decrease in profit on account of ICDS adjustments and deviation in stock valuation) must equal items 3b + 4e of Part A-OI.");
    }
    /* 270 — 4a (profit included in 1 referred to in 44AD…44DA) = 35(i) to 35(vii) */
    const s44=["44AD","44ADA","44AE","44B","44BB","44BBA","44BBC","44BBD","44DA"];
    A(270,REQ(s44.reduce((a,k)=>a+N(RG(P,"ProfitLossInclRefrdSec.ProfitLossUs"+k)),0),s44.reduce((a,k)=>a+N(RG(P,"DeemedProfitBusUs.Section"+k)),0)),"Schedule BP: item 4a (profit included in 1 referred to in sections 44AD to 44DA) must equal the total of items 35(i) to 35(vii).");
  }
});
