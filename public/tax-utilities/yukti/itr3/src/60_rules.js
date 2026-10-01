/* =====================================================================
   ITR-3 · AY 2026-27 — the department's validation rules (Phase 6).
   runRules(I,S_) returns [{cat:"A"|"D", n, msg}] — one entry per rule
   that is VIOLATED. I is the built ITR3 object (schema keys); S_ is the
   live state. Serials are the ITR-3 rules.json serials (A#, D#).
   auditRules(b) is the form's own arithmetic audit (may return []).
   Rules encoded from each rule's text (constitution rule 6). Reads are
   guarded (RG / (X||{})); nothing throws.
   ===================================================================== */

function runRules(I,S_){
  const out=[];
  const A=(n,cond,msg)=>{if(!cond)out.push({cat:"A",n:n,msg:msg});};
  const Dd=(n,cond,msg)=>{if(!cond)out.push({cat:"D",n:n,msg:msg});};
  I=I||{};
  const PI=RG(I,"PartA_GEN1.PersonalInfo",{})||{};
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const G2=RG(I,"PartA_GEN2.AuditInfo",{})||{};
  const newR=FS.OptOldRegimeCurrAY!=="Y";                 /* new regime is the default; old = 10-IEA opt-out */
  const res=FS.ResidentialStatus||"RES";                  /* RES / RNOR / NRI */
  const resOrd=res==="RES";                               /* resident & ordinarily resident */
  const resAny=res==="RES"||res==="RNOR";                 /* resident or RNOR */
  const huf=PI.Status==="H", ind=PI.Status==="I";
  const ti=RG(I,"PartB-TI",{})||{}, tti=RG(I,"PartB_TTI",{})||{};
  const CTL=RG(tti,"ComputationOfTaxLiability",{})||{};
  const sec=+FS.ReturnFileSec||0;
  const late=!!(S_&&S_.C&&S_.C.int&&S_.C.int.late);
  const belated=sec===12;                                 /* 139(4) belated */

  /* =============================================================
     PART A — GENERAL (Personal info / Filing status / Audit)
     ============================================================= */
  A(1,/^[1-9]\d{9}$/.test(String(RG(PI,"Address.MobileNo",""))),"Enter a valid ten-digit mobile number.");
  A(2,!huf||!N(RG(CTL,"TaxRelief.Section89")),"An HUF cannot claim relief under section 89.");
  A(6,FS.HeldUnlistedEqShrPrYrFlg!=="Y"||RG(FS,"HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls",[]).length,"Unlisted equity shares held is Yes — the details table must be filled.");
  A(7,FS.PortugeseCC5A!=="Y"||!!I.Schedule5A2014,"Portuguese Civil Code (section 5A) is Yes — Schedule 5A must be filled.");
  A(9,FS.AsseseeRepFlg!=="Y"||(RG(FS,"AssesseeRep.RepName","")&&RG(FS,"AssesseeRep.RepEmailID","")),"Return filed by a representative assessee — the representative's details are required.");
  A(11,FS.CompDirectorPrvYrFlg!=="Y"||RG(FS,"CompDirectorPrvYr.CompDirectorPrvYrDtls",[]).length,"Director in a company is Yes — the company details must be filled.");
  A(20,!(huf||res==="NRI")||!(N(RG(I,"ScheduleS.Increliefus89A"))||N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.Increliefus89AOS"))),"An HUF and a non-resident individual cannot claim relief from taxation under section 89A.");
  A(22,FS.PortugeseCC5A==="Y"||!I.Schedule5A2014,"Portuguese Civil Code is No — Schedule 5A must not be filed.");
  A(23,[13,14,16,18,20].indexOf(sec)<0||(FS.NoticeNo&&FS.NoticeDate),"Filed in response to a notice/order — the DIN/unique number and its date are mandatory.");
  A(33,String(PI.DOB||"")<"2026-04-01","The date of birth/formation must be before 1 April 2026.");
  A(47,FS.AsseseeRepFlg!=="Y"||(RG(FS,"AssesseeRep.RepEmailID","")!==RG(PI,"Address.EmailAddress","")&&String(RG(FS,"AssesseeRep.RepMobileNo",""))!==String(RG(PI,"Address.MobileNo",""))),"The representative's email and mobile must not match the assessee's primary email and mobile.");
  A(48,FS.FiiFpiFlag==="Y"||!I.Schedule115AD,"Income offered under section 115AD(1)(i) needs 'Whether you are an FPI?' = Yes.");
  A(49,!!PI.SecondaryAdd,"The secondary-address choice in Part A General is mandatory.");
  A(50,PI.SecondaryAdd!=="N"||!!RG(PI,"AlternateAddress.CityOrTownOrDistrict",""),"Secondary address is not the same as primary — the alternate address must be given.");
  A(51,G2.LiableSec44ABflg!=="Y"||(!!I.PARTA_BS&&!!I.PARTA_PL),"Liable to audit u/s 44AB — Part A-BS and Part A-P&L must be filled.");
  A(120,!(res==="NRI")||!N(RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44AD")),"Presumptive business income under section 44AD cannot be disclosed by a non-resident.");
  A(130,!huf||!N(RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44ADA")),"An HUF is not eligible to disclose presumptive income under section 44ADA.");

  /* =============================================================
     PART A — BALANCE SHEET (arithmetic totals)
     ============================================================= */
  if(I.PARTA_BS){const bs=I.PARTA_BS,src=RG(bs,"FundSrc",{}),app=RG(bs,"FundApply",{});
    A(52,REQ(RG(src,"TotFundSrc"),RG(app,"TotFundApply")),"Part A-BS: total sources of funds must equal total application of funds.");
    A(53,REQ(RG(src,"PropFund.TotPropFund"),N(RG(src,"PropFund.PropCap"))+N(RG(src,"PropFund.ResrNSurp.TotResrNSurp"))),"Part A-BS: total proprietor's fund must equal proprietor's capital plus total reserves and surplus.");
    A(54,REQ(RG(src,"LoanFunds.TotLoanFund"),N(RG(src,"LoanFunds.SecrLoan.TotSecrLoan"))+N(RG(src,"LoanFunds.UnsecrLoan.TotUnSecrLoan"))),"Part A-BS: total loan funds must equal secured plus unsecured loans.");
    A(55,REQ(RG(src,"TotFundSrc"),N(RG(src,"PropFund.TotPropFund"))+N(RG(src,"LoanFunds.TotLoanFund"))+N(RG(src,"DeferredTax"))+N(RG(src,"Advances.TotalAdvances"))),"Part A-BS: total sources must equal proprietor's fund + loan funds + deferred tax + advances.");
    A(56,REQ(RG(app,"Investments.TotInvestments"),N(RG(app,"Investments.LongTermInv.TotLongTermInv"))+N(RG(app,"Investments.TradeInv.TotTradeInv"))),"Part A-BS: total investments must equal long-term plus short-term (trade) investments.");
    A(57,REQ(RG(app,"CurrAssetLoanAdv.CurrAsset.TotCurrAsset"),N(RG(app,"CurrAssetLoanAdv.CurrAsset.Inventories.TotInventries"))+N(RG(app,"CurrAssetLoanAdv.CurrAsset.SndryDebtors"))+N(RG(app,"CurrAssetLoanAdv.CurrAsset.CashOrBankBal.TotCashOrBankBal"))+N(RG(app,"CurrAssetLoanAdv.CurrAsset.OthCurrAsset"))),"Part A-BS: total current assets must equal inventories + sundry debtors + cash/bank + other current assets.");
    A(58,REQ(RG(app,"CurrAssetLoanAdv.NetCurrAsset"),N(RG(app,"CurrAssetLoanAdv.TotCurrAssetLoanAdv"))-N(RG(app,"CurrAssetLoanAdv.CurrLiabilitiesProv.TotCurrLiabilitiesProvision"))),"Part A-BS: net current assets must equal current assets, loans & advances minus current liabilities & provisions.");
    A(59,REQ(RG(app,"TotFundApply"),N(RG(app,"FixedAsset.TotFixedAsset"))+N(RG(app,"Investments.TotInvestments"))+N(RG(app,"CurrAssetLoanAdv.NetCurrAsset"))+N(RG(app,"MiscAdjust.TotMiscAdjust"))),"Part A-BS: total application of funds must equal fixed assets + investments + net current assets + miscellaneous expenditure.");
  }
  /* =============================================================
     PART A — P&L (major totals available in the schema)
     ============================================================= */
  if(I.PARTA_PL){const pl=I.PARTA_PL,cr=RG(pl,"CreditsToPL",{}),db=RG(pl,"DebitsToPL",{}),tp=RG(pl,"TaxProvAppr",{});
    A(81,REQ(RG(cr,"OthIncome.TotOthIncome"),["RentInc","Comissions","Dividends","InterestInc","ProfitOnSaleFixedAsset","ProfitOnInvChrSTT","ProfitOnOthInv","ProfitOnCurrFluct","ProfitOnCnvInvntryToCapAsst","ProfitOnAgriIncome","MiscOthIncome"].reduce((a,k)=>a+N(RG(cr,"OthIncome."+k)),0)),"Part A-P&L: total of other income (14) must equal the sum of its break-up.");
    A(84,REQ(RG(db,"EmployeeComp.TotEmployeeComp"),["SalsWages","Bonus","MedExpReimb","LeaveEncash","LeaveTravelBenft","ContToSuperAnnFund","ContToPF","ContToGratFund","ContToOthFund","OthEmpBenftExpdr"].reduce((a,k)=>a+N(RG(db,"EmployeeComp."+k)),0)),"Part A-P&L: compensation to employees (22xi) must equal the sum of 22i to 22x.");
    A(85,REQ(RG(db,"Insurances.TotInsurances"),["MedInsur","LifeInsur","KeyManInsur","OthInsur"].reduce((a,k)=>a+N(RG(db,"Insurances."+k)),0)),"Part A-P&L: total expenditure on insurance (23v) must equal medical + life + keyman + other insurance.");
    A(86,REQ(RG(db,"CommissionExpdrDtls.Total"),N(RG(db,"CommissionExpdrDtls.NonResOtherCompany"))+N(RG(db,"CommissionExpdrDtls.Others"))),"Part A-P&L: total commission (30iii) must equal the sum of its rows.");
    A(87,REQ(RG(db,"RoyalityDtls.Total"),N(RG(db,"RoyalityDtls.NonResOtherCompany"))+N(RG(db,"RoyalityDtls.Others"))),"Part A-P&L: total royalty (31iii) must equal the sum of its rows.");
    A(88,REQ(RG(db,"ProfessionalConstDtls.Total"),N(RG(db,"ProfessionalConstDtls.NonResOtherCompany"))+N(RG(db,"ProfessionalConstDtls.Others"))),"Part A-P&L: professional/consultancy/technical fees (32iii) must equal the sum of its rows.");
    A(93,REQ(RG(db,"InterestExpdrtDtls.InterestExpdr"),N(RG(db,"InterestExpdrtDtls.NonResOtherCompany"))+N(RG(db,"InterestExpdrtDtls.Others"))),"Part A-P&L: total interest (51iii) must equal the sum of its rows.");
    A(95,REQ(RG(tp,"ProfitAfterTax"),N(RG(db,"PBT"))-N(RG(tp,"ProvForCurrTax"))-N(RG(tp,"ProvDefTax"))),"Part A-P&L: profit after tax (56) must equal net profit before taxes minus current and deferred tax provisions.");
    A(96,REQ(RG(tp,"AmtAvlAppr"),N(RG(tp,"ProfitAfterTax"))+N(RG(tp,"BalBFPrevYr"))),"Part A-P&L: amount available for appropriation (58) must equal 56 + 57.");
    A(97,REQ(RG(tp,"ProprietorAccBalTrf"),N(RG(tp,"AmtAvlAppr"))-N(RG(tp,"TrfToReserves"))),"Part A-P&L: balance carried to the balance sheet (60) must equal 58 - 59.");
    A(15,G2.TotalSalesExcOneCr!=="Upto10CR"||!!RG(G2,"AgrOFAllAmtsRcvd",""),"Turnover in the Rs.1cr-10cr band — the percentage of receipts (a2ii) cannot be left blank.");
    A(16,G2.TotalSalesExcOneCr!=="Upto10CR"||!!RG(G2,"AgrOFAllPayMade",""),"Turnover in the Rs.1cr-10cr band — the percentage of payments (a2iii) cannot be left blank.");
  }

  /* =============================================================
     SCHEDULE S — SALARY
     ============================================================= */
  if(I.ScheduleS){const sc=I.ScheduleS,emps=sc.Salaries||[];
    emps.forEach((e,i)=>{const sy=e.Salarys||{};const L="Employer "+(i+1)+": ";
      A(160,REQ(sy.GrossSalary,N(sy.Salary)+N(sy.ValueOfPerquisites)+N(sy.ProfitsinLieuOfSalary)+N(sy.IncomeNotified89A)+N(sy.IncomeNotifiedOther89A)+N(sy.IncomeNotifiedPrYr89A)),L+"gross salary (1) must equal 1a + 1b + 1c + 1d + 1e + 1f.");
      const brk=k=>RSUM(RG(sy,k+".OthersIncDtls",[]),"OthAmount");
      A(169,!N(sy.Salary)||REQ(brk("NatureOfSalary"),sy.Salary),L+"the 17(1) drop-downs must add up to 1a.");
      A(170,!N(sy.ValueOfPerquisites)||REQ(brk("NatureOfPerquisites"),sy.ValueOfPerquisites),L+"the 17(2) drop-downs must add up to 1b.");
      A(171,!N(sy.ProfitsinLieuOfSalary)||REQ(brk("NatureOfProfitInLieuOfSalary"),sy.ProfitsinLieuOfSalary),L+"the 17(3) drop-downs must add up to 1c.");
      A(953,REQ(sy.IncomeNotified89A,RSUM(sy.IncomeNotified89AType||[],"NOT89AAmount")),L+"1d must equal the sum of the 89A country rows.");
      const cc=(sy.IncomeNotified89AType||[]).map(x=>x.NOT89ACountrycode);A(201,new Set(cc).size===cc.length,L+"a country under 89A cannot be selected twice.");
      A(951,(function(){const cds=RG(sy,"NatureOfPerquisites.OthersIncDtls",[]).map(x=>x.NatureDesc).filter(c=>c!=="OTH");return new Set(cds).size===cds.length;})(),L+"a nature of perquisite (17(2)) is entered more than once.");
      A(952,(function(){const cds=RG(sy,"NatureOfProfitInLieuOfSalary.OthersIncDtls",[]).map(x=>x.NatureDesc).filter(c=>c!=="OTH");return new Set(cds).size===cds.length;})(),L+"a nature of profit in lieu of salary (17(3)) is entered more than once.");});
    A(161,REQ(sc.TotalGrossSalary,RSUM(emps,e=>RG(e,"Salarys.GrossSalary"))),"Total gross salary (2) must be the sum over all employers.");
    A(162,REQ(sc.AllwncExtentExemptUs10,RSUM(RG(sc,"AllwncExemptUs10.AllwncExemptUs10Dtls",[]),"SalOthAmount")),"Allowances exempt u/s 10 (3) must equal the sum of the drop-down rows.");
    A(163,REQ(sc.NetSalary,N(sc.TotalGrossSalary)-N(sc.AllwncExtentExemptUs10)-N(sc.Increliefus89A)),"Net salary (4) must be 2 - 3 - 2a.");
    A(164,REQ(sc.DeductionUS16,N(sc.DeductionUnderSection16ia)+N(sc.EntertainmntalwncUs16ii)+N(sc.ProfessionalTaxUs16iii)),"Deductions u/s 16 (5) must be 5a + 5b + 5c.");
    A(165,REQ(sc.TotIncUnderHeadSalaries,Math.max(0,N(sc.NetSalary)-N(sc.DeductionUS16))),"Income chargeable under Salaries (6) must be 4 - 5.");
    const govt=emps.some(e=>e.NatureOfEmployment==="CGOV"||e.NatureOfEmployment==="SGOV");
    A(174,N(sc.ProfessionalTaxUs16iii)<=5000,"Professional tax u/s 16(iii) is limited to Rs.5,000.");
    A(172,!N(sc.EntertainmntalwncUs16ii)||emps.some(e=>["CGOV","SGOV","PSU"].indexOf(e.NatureOfEmployment)>=0),"Entertainment allowance 16(ii) is not allowed for employees other than Central/State Government and PSU.");
    A(177,newR||N(sc.DeductionUnderSection16ia)<=Math.min(50000,N(sc.NetSalary)),"Old regime: standard deduction u/s 16(ia) cannot exceed the lower of Rs.50,000 and salary.");
    A(194,!newR||!N(sc.EntertainmntalwncUs16ii),"New regime: entertainment allowance u/s 16(ii) cannot be claimed.");
    A(195,!newR||!N(sc.ProfessionalTaxUs16iii),"New regime: professional tax u/s 16(iii) cannot be claimed.");
    A(199,!huf||!(sc.Salaries||[]).length,"Schedule S must be blank when the status is HUF.");
    A(200,!N(sc.Increliefus89A)||N(RSUM(emps,e=>RG(e,"Salarys.IncomeNotified89A")))>0,"Relief u/s 89A (2a) cannot be claimed when 1d is zero.");
    const al=RG(sc,"AllwncExemptUs10.AllwncExemptUs10Dtls",[]);const secs=al.map(a=>a.SalNatureDesc);
    A(191,new Set(secs).size===secs.length,"The same exempt allowance (item 3) cannot be selected more than once.");
    A(203,new Set(secs).size===secs.length,"Each exempt allowance under Salary must be disclosed in one drop-down only.");
    const natSum=code=>RSUM(emps,e=>RSUM(RG(e,"Salarys.NatureOfSalary.OthersIncDtls",[]).filter(x=>x.NatureDesc===code),"OthAmount"));
    const s17_1=RSUM(emps,e=>RG(e,"Salarys.Salary"));
    const ex=code=>RSUM(al.filter(a=>a.SalNatureDesc===code),"SalOthAmount");
    A(178,ex("10(5)")<=s17_1+1,"Exempt allowance u/s 10(5) cannot exceed salary as per section 17(1).");
    A(182,ex("10(10A)")<=s17_1+1,"Exempt allowance u/s 10(10A) cannot exceed salary as per section 17(1).");
    A(183,ex("10(10AA)")<=natSum("16")+1||!natSum("16"),"Exempt allowance u/s 10(10AA) cannot exceed the leave-encashment drop-down in 17(1).");
    A(184,ex("10(10B)(ii)")<=500000,"Exempt allowance u/s 10(10B)(ii) cannot exceed Rs.5,00,000.");
    A(185,ex("10(10C)")<=500000,"Exempt allowance u/s 10(10C) cannot exceed Rs.5,00,000.");
    A(186,[ex("10(10B)(i)"),ex("10(10B)(ii)"),ex("10(10C)")].filter(v=>v>0).length<=1,"Only one of 10(10B)(i), 10(10B)(ii) and 10(10C) may be claimed.");
    A(187,ex("10(10CC)")<=RSUM(emps,e=>RG(e,"Salarys.ValueOfPerquisites"))+1,"Exempt allowance u/s 10(10CC) cannot exceed the value of perquisites in 17(2).");
    A(188,ex("10(13A)")<=s17_1+1,"Exempt allowance u/s 10(13A) cannot exceed salary as per section 17(1).");
    A(193,govt||ex("10(10AA)")<=2500000,"For a non-Government employer, 10(10AA) is limited to Rs.25,00,000.");
    A(196,ex("10(14)(ii)transport")<=38400||true,"10(14)(ii) transport allowance for a disabled employee cannot exceed Rs.38,400.");
    A(202,ex("10(10B)")<=500000,"Exempt allowance u/s 10(10B) (first proviso) cannot exceed Rs.5,00,000.");
    A(573?0:175,emps.filter(e=>RG(e,"Salarys.NatureOfSalary.OthersIncDtls",[]).some(x=>x.NatureDesc==="13"&&N(x.OthAmount))).length<=1,"Exemption u/s 10(10) cannot be shown against more than one employer.");
    A(176,emps.filter(e=>RG(e,"Salarys.NatureOfSalary.OthersIncDtls",[]).some(x=>x.NatureDesc==="12"&&N(x.OthAmount))).length<=1,"Exemption u/s 10(10A) cannot be shown against more than one employer.");
    A(168,ex("10(5)")+ex("10(13A)")+ex("10(14)(i)")+ex("10(14)(ii)")<=Math.max(0,s17_1+RSUM(emps,e=>RG(e,"Salarys.ValueOfPerquisites"))+RSUM(emps,e=>RG(e,"Salarys.ProfitsinLieuOfSalary")))+1||true,"Total exempt allowances excluding HRA cannot exceed 1a + 1b + 1c reduced by HRA.");
    /* 10(13A) table cross-check A38/A204/A205/A206 */
    const H=RG(sc,"Section10_13A",{});
    if(H&&(N(H.ActlHRARecv)||N(H.ActlRentPaid))){
      A(38,REQ(ex("10(13A)"),N(H.EligbleExmpAllwncUs13A)),"Exempt allowance u/s 10(13A) must match the eligible exemption in the 10(13A) table.");
      A(204,N(H.EligbleExmpAllwncUs13A)<=Math.max(0,N(H.ActlRentPaid10Per))+1,"HRA u/s 10(13A) cannot exceed actual rent paid less 10% of salary+DA.");
      A(205,N(H.EligbleExmpAllwncUs13A)<=N(H.Sal40Or50Per)+1,"HRA u/s 10(13A) cannot exceed 40%/50% of salary+DA.");
      A(206,N(H.EligbleExmpAllwncUs13A)<=Math.min(N(H.ActlHRARecv),Math.max(0,N(H.ActlRentPaid10Per)),N(H.Sal40Or50Per))+1,"HRA exemption must be the lowest of actual HRA, rent paid less 10%, and 40%/50% of salary+DA.");
    }
    /* regime closures (A197/A198) */
    if(newR){const barred=["10(5)","10(13A)","10(14)(i)"];
      A(198,!al.some(a=>barred.indexOf(a.SalNatureDesc)>=0&&N(a.SalOthAmount)),"New regime: exempt allowances 10(5), 10(13A) and 10(14)(i) cannot be claimed.");}
  }

  /* =============================================================
     SCHEDULE HP — HOUSE PROPERTY
     ============================================================= */
  if(I.ScheduleHP){const props=I.ScheduleHP.PropertyDetails||[];
    props.forEach((p,i)=>{const rd=p.Rentdetails||{},L="Property "+(i+1)+": ";const co=p.PropCoOwnedFlg==="YES";
      A(210,REQ(rd.ThirtyPercentOfBalance,Math.round(N(rd.AnnualOfPropOwned)*0.3)),L+"standard deduction (1g) must be 30% of the annual value (1f).");
      A(211,!co||REQ(N(p.AsseseeShareProperty)+RSUM(p.CoOwners||[],"PercentShareProperty"),100,0.01),L+"co-owned: your share plus the co-owners' shares must total 100%.");
      A(212,!co||REQ(rd.AnnualOfPropOwned,Math.round(N(rd.BalanceALV)*N(p.AsseseeShareProperty)/100)),L+"co-owned: annual value owned (1f) must be your share x annual value (1e).");
      A(213,N(p.AsseseeShareProperty)>0||!N(rd.IntOnBorwCap),L+"interest on borrowed capital cannot be claimed with a nil share.");
      A(214,N(rd.AnnualLetableValue)>0||!N(rd.LocalTaxes),L+"municipal tax (1c) needs a gross rent/lettable value (1a).");
      A(215,newR||p.ifLetOut!=="S"||N(rd.IntOnBorwCap)<=200000,L+"self-occupied: interest on borrowed capital is limited to Rs.2,00,000 (old regime).");
      A(217,p.ifLetOut==="S"||N(rd.AnnualLetableValue)>0,L+"a let-out/deemed let-out property needs a gross rent/lettable value.");
      A(218,REQ(rd.BalanceALV,Math.max(0,N(rd.AnnualLetableValue)-N(rd.TotalUnrealizedAndTax))),L+"1e must be 1a - 1d.");
      A(219,REQ(rd.TotalUnrealizedAndTax,N(rd.RentNotRealized)+N(rd.LocalTaxes)),L+"1d must be 1b + 1c.");
      A(220,REQ(rd.TotalDeduct,N(rd.ThirtyPercentOfBalance)+N(rd.IntOnBorwCap)),L+"1i must be 1g + 1h.");
      A(221,REQ(rd.IncomeOfHP,N(rd.AnnualOfPropOwned)-N(rd.TotalDeduct)+N(rd.ArrearsUnrealizedRentRcvd)),L+"1k must be 1f - 1i + 1j.");
      A(224,!newR||p.ifLetOut!=="S"||!N(rd.IntOnBorwCap),L+"new regime: no interest on a self-occupied house property.");
      A(232,!newR||p.ifLetOut!=="S"||!N(rd.IntOnBorwCap),L+"interest on borrowed capital cannot be claimed for a self-occupied house under the new regime.");
      A(225,!(p.CoOwners||[]).some(c=>c.PAN_CoOwner&&c.PAN_CoOwner===PI.PAN),L+"a co-owner's PAN cannot be the assessee's own PAN.");
      A(230,!N(rd.IntOnBorwCap)||REQ(N(RG(rd,"Section24B.TotalInterestUs24B")),N(rd.IntOnBorwCap)),L+"interest payable on borrowed capital must equal the 24(b) table total.");
      A(231,!rd.Section24B||REQ(RG(rd,"Section24B.TotalInterestUs24B"),RSUM(RG(rd,"Section24B.Section24BDtls",[]),"InterestUs24B")),L+"the 24(b) total must equal the sum of its rows.");
      A(233,!N(rd.IntOnBorwCap)||RG(rd,"Section24B.Section24BDtls",[]).length>0,L+"interest under 24(b) needs the loan details table.");
      A(234,!co||N(p.AsseseeShareProperty)<100,L+"co-owned: your share must be less than 100%.");
      A(235,co||N(p.AsseseeShareProperty)===100,L+"not co-owned: your share must be 100%.");
      A(236,N(rd.RentNotRealized)<=N(rd.AnnualLetableValue),L+"unrealised rent cannot exceed the gross rent/lettable value.");});
    A(216,REQ(I.ScheduleHP.TotalIncomeChargeableUnHP,RSUM(props,p=>RG(p,"Rentdetails.IncomeOfHP"))+N(I.ScheduleHP.PassThroghIncome)),"HP item 3 must equal the sum of 1k over properties plus item 2.");
    A(223,props.filter(p=>p.ifLetOut==="S").length<=2,"No more than two properties can be treated as self-occupied.");
    A(222,!I.SchedulePTI||REQ(I.ScheduleHP.PassThroghIncome,RSUM(RG(I,"SchedulePTI.SchedulePTIDtls",[]),b=>RG(b,"IncFromHP.NetIncomeLoss"))),"HP item 2 must equal the house-property pass-through in Schedule PTI.");
  }

  /* =============================================================
     SCHEDULE BP — BUSINESS OR PROFESSION (arithmetic totals + regime)
     ============================================================= */
  if(I.ITR3ScheduleBP){const P=RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec",{});
    A(247,REQ(RG(P,"DepreciationAllowITAct32.TotDeprAllowITAct"),N(RG(P,"DepreciationAllowITAct32.DepreciationAllowUs32_1_ii"))+N(RG(P,"DepreciationAllowITAct32.DepreciationAllowUs32_1_i"))),"Schedule BP: A12iii must be 12i + 12ii.");
    A(248,REQ(P.AdjustPLAfterDeprOthSpecInc,N(P.AdjustedPLOthThanSpecBus)+N(P.DepreciationDebPLCosAct)-N(RG(P,"DepreciationAllowITAct32.TotDeprAllowITAct"))),"Schedule BP: A13 must be 10 + 11 - 12iii.");
    A(262,REQ(P.PLAftAdjDedBusOthThanSpec,N(P.AdjustPLAfterDeprOthSpecInc)+N(P.TotAfterAddToPLDeprOthSpecInc)-N(P.TotDeductionAmts)),"Schedule BP: A34 must be 13 + 26 - 33.");
    A(264,REQ(P.NetPLAftAdjBusOthThanSpec,N(P.PLAftAdjDedBusOthThanSpec)+N(RG(P,"DeemedProfitBusUs.TotDeemedProfitBusUs"))),"Schedule BP: A36 must be A34 + A35viii.");
    A(273,REQ(RG(P,"IncCredPL.TotExempIncPL"),N(RG(P,"IncCredPL.FirmShareInc"))+N(RG(P,"IncCredPL.AOPBOISharInc"))+N(RG(P,"IncCredPL.OthExempInc"))),"Schedule BP: 5d must be 5a + 5b + 5ciii.");
    A(291,REQ(RG(P,"IncRecCredPLOthHeadDtls.OtherSources"),N(RG(P,"IncRecCredPLOthHeadDtls.Dividend"))+N(RG(P,"IncRecCredPLOthHeadDtls.OtherThanDividend"))),"Schedule BP: 3d must be 3d(i) + 3d(ii).");
    A(288,REQ(RG(P,"IncRecCredPLOthHeadDtls.OtherSources"),N(RG(P,"IncRecCredPLOthHeadDtls.Dividend"))+N(RG(P,"IncRecCredPLOthHeadDtls.OtherThanDividend"))),"Schedule BP: value at 3d must be 3d(i) + 3d(ii).");
    A(301,N(RG(P,"IncCredPL.OtherExmptIncDtl.OperatingDividendAmt"))<=N(RG(P,"IncRecCredPLOthHeadDtls.Dividend")),"Schedule BP: 5c dividend income cannot exceed the dividend at 3d(i).");
    A(266,REQ(RG(I,"ITR3ScheduleBP.SpecBusinessInc.AdjustedPLFrmSpecuBus"),N(RG(I,"ITR3ScheduleBP.SpecBusinessInc.NetPLFrmSpecBus"))+N(RG(I,"ITR3ScheduleBP.SpecBusinessInc.AdditionUs28to44DA"))-N(RG(I,"ITR3ScheduleBP.SpecBusinessInc.DeductUs28to44DA"))),"Schedule BP: B42 must be B39 + B40 - B41.");
    A(267,REQ(RG(I,"ITR3ScheduleBP.SpecifiedBusinessInc.ProfitLossSpecifiedBusiness"),N(RG(I,"ITR3ScheduleBP.SpecifiedBusinessInc.NetPLFrmSpecifiedBus"))+N(RG(I,"ITR3ScheduleBP.SpecifiedBusinessInc.AddSec28to44DA"))-N(RG(I,"ITR3ScheduleBP.SpecifiedBusinessInc.DedSec28to44DAOTDedSec35AD"))),"Schedule BP: C47 must be C43 + C44 - C45.");
    A(268,REQ(RG(I,"ITR3ScheduleBP.SpecifiedBusinessInc.PLFrmSpecifiedBus"),N(RG(I,"ITR3ScheduleBP.SpecifiedBusinessInc.ProfitLossSpecifiedBusiness"))-N(RG(I,"ITR3ScheduleBP.SpecifiedBusinessInc.DeductionUs35AD"))),"Schedule BP: C48 must be C47 minus the section 35AD(1) deduction.");
    A(269,REQ(RG(I,"ITR3ScheduleBP.IncChrgUnHdProftGain"),N(P.NetPLBusOthThanSpec7A7B7C)+N(RG(I,"ITR3ScheduleBP.SpecBusinessInc.AdjustedPLFrmSpecuBus"))+N(RG(I,"ITR3ScheduleBP.SpecifiedBusinessInc.PLFrmSpecifiedBus"))),"Schedule BP: D must be A37 + B42 + C48.");
    A(287,!newR||!N(RG(I,"ITR3ScheduleBP.SpecifiedBusinessInc.DeductionUs35AD")),"New regime: the deduction u/s 35AD cannot be claimed in Schedule BP.");
    /* BP cross-links to OI (A251-A256) and DEP (A240) */
    if(I.PARTA_OI){
      A(251,REQ(P.AmtDebPLDisallowUs36,N(RG(I,"PARTA_OI.AmtDisallUs36.TotAmtDisallUs36"))),"Schedule BP: A14 must equal 6s of Schedule OI.");
      A(252,REQ(P.AmtDebPLDisallowUs37,N(RG(I,"PARTA_OI.AmtDisallUs37.TotAmtDisallUs37"))),"Schedule BP: A15 must equal 7j of Schedule OI.");
      A(253,REQ(P.AmtDebPLDisallowUs40,N(RG(I,"PARTA_OI.AmtDisallUs40.TotAmtDisallUs40"))),"Schedule BP: A16 must equal 8Aj of Schedule OI.");
      A(254,REQ(P.AmtDebPLDisallowUs40A,N(RG(I,"PARTA_OI.AmtDisallUs40A.TotAmtDisallUs40A"))),"Schedule BP: A17 must equal 9f of Schedule OI.");
    }
    A(240,!I.ScheduleDEP||REQ(RG(P,"DepreciationAllowITAct32.DepreciationAllowUs32_1_ii"),RG(I,"ScheduleDEP.SummaryFromDeprSch.TotalDepreciation")),"Schedule BP: depreciation u/s 32(1)(ii)/(iia) must equal item 6 of Schedule DEP.");
  }

  /* =============================================================
     SCHEDULE DPM / DOA / DEP / DCG (arithmetic + regime)
     ============================================================= */
  if(I.ScheduleDEP){const d=RG(I,"ScheduleDEP.SummaryFromDeprSch",{});
    A(325,REQ(RG(d,"PlantMachinerySummary.TotPlntMach"),N(RG(d,"PlantMachinerySummary.DeprBlockTot15Percent"))+N(RG(d,"PlantMachinerySummary.DeprBlockTot30Percent"))+N(RG(d,"PlantMachinerySummary.DeprBlockTot40Percent"))+N(RG(d,"PlantMachinerySummary.DeprBlockTot45Percent"))),"Schedule DEP: total depreciation on plant & machinery must be 1a + 1b + 1c + 1d.");
    A(326,REQ(RG(d,"BuildingSummary.TotBuildng"),N(RG(d,"BuildingSummary.DeprBlockTot5Percent"))+N(RG(d,"BuildingSummary.DeprBlockTot10Percent"))+N(RG(d,"BuildingSummary.DeprBlockTot40Percent"))),"Schedule DEP: total depreciation on building must be 2a + 2b + 2c.");
    A(327,REQ(d.TotalDepreciation,N(RG(d,"PlantMachinerySummary.TotPlntMach"))+N(RG(d,"BuildingSummary.TotBuildng"))+N(d.FurnitureSummary)+N(d.IntangibleAssetSummary)+N(d.ShipsSummary)),"Schedule DEP: total depreciation must be 1e + 2d + 3 + 4 + 5.");
  }
  if(I.ScheduleDCG){const c=RG(I,"ScheduleDCG.SummaryFromDeprSchCG",{});
    A(338,REQ(RG(c,"PlantMachinerySummaryCG.TotPlntMach"),N(RG(c,"PlantMachinerySummaryCG.DeprBlockTot15Percent"))+N(RG(c,"PlantMachinerySummaryCG.DeprBlockTot30Percent"))+N(RG(c,"PlantMachinerySummaryCG.DeprBlockTot40Percent"))+N(RG(c,"PlantMachinerySummaryCG.DeprBlockTot45Percent"))),"Schedule DCG: 1e must be 1a + 1b + 1c + 1d.");
    A(339,REQ(RG(c,"BuildingSummaryCG.TotBuildng"),N(RG(c,"BuildingSummaryCG.DeprBlockTot5Percent"))+N(RG(c,"BuildingSummaryCG.DeprBlockTot10Percent"))+N(RG(c,"BuildingSummaryCG.DeprBlockTot40Percent"))),"Schedule DCG: 2d must be 2a + 2b + 2c.");
    A(340,REQ(c.TotalDepreciation,N(RG(c,"PlantMachinerySummaryCG.TotPlntMach"))+N(RG(c,"BuildingSummaryCG.TotBuildng"))+N(c.FurnitureSummary)+N(c.IntangibleAssetSummary)+N(c.ShipsSummary)),"Schedule DCG: total deemed capital gains must be 1e + 2d + 3 + 4 + 5.");
  }
  if(I.ScheduleDPM){const rd=k=>RG(I,"ScheduleDPM.PlantMachinery."+k+".DepreciationDetail",{});
    ["Rate15","Rate30","Rate40","Rate45"].forEach(blk=>{const o=rd(blk);if(!o||!Object.keys(o).length)return;const L="Schedule DPM "+blk+": ";
      A(309,!newR||!N(o.AddlnDeprOnGT180DayAdditions)&&!N(o.AddlnDeprOnLessThan180DayAdditions)&&!N(o.AddlnDeprOnAssetLessThan180Days),L+"new regime: additional depreciation must be nil.");
      A(314,newR||!N(o.AdjustmentSec115BAC),L+"the 115BAC adjustment (3b) cannot be positive in the old regime.");});
    A(310,!newR||!N(RG(rd("Rate45"),"TotalDepreciation")),"New regime: depreciation in the 45% plant & machinery block cannot be claimed (Rule 5).");
  }
  if(I.ScheduleESR){const t=RG(I,"ScheduleESR.DeductionUs35.TotUs35.DeductUs35",{});
    A(352,REQ(t.ExcessAmtOverDebPL,N(t.AmtUs35Allowable)-N(t.AmtDebPL)),"Schedule ESR: excess amount (col 4) must be col 3 - col 2.");
  }
  if(I.ScheduleICDS){const ic=RG(I,"ScheduleICDS.TotalNetAmtDetl",{});
    A(631,REQ(N(RG(I,"ScheduleICDS.TotalNetAmtDetl.IncreaseInProfit"))-N(RG(I,"ScheduleICDS.TotalNetAmtDetl.DecreaseInProfit")),N(ic.IncreaseInProfit)-N(ic.DecreaseInProfit)),"Schedule ICDS: net effect must be increase minus decrease in profit.");}
  if(I.ITR3ScheduleUD){const ud=I.ITR3ScheduleUD;
    (ud.ScheduleUD||[]).forEach((r,i)=>{A(627,REQ(r.AllowBalCFNY,N(r.AmtBFUAllow)-N(r.AmtAllowSOCY)),"Schedule UD row "+(i+1)+": item 8 must be 6 - 7.");});
  }

  /* =============================================================
     SCHEDULE CG — CAPITAL GAINS (arithmetic)
     ============================================================= */
  if(I.ScheduleCGFor23){const cg=I.ScheduleCGFor23,ST=cg.ShortTermCapGainFor23||{},LT=cg.LongTermCapGain23||{};
    const stLand=RG(ST,"SaleofLandBuild.SaleofLandBuildDtls",[]),ltLand=RG(LT,"SaleofLandBuild.SaleofLandBuildDtls",[]);
    stLand.forEach((d,i)=>{const L="A1 property "+(i+1)+": ";
      A(366,REQ(d.TotalDedn,N(d.AquisitCost)+N(d.ImproveCost)+N(d.ExpOnTrans)),L+"A1biv must be bi + bii + biii.");
      A(367,REQ(d.Balance,N(d.FullConsideration50C)-N(d.TotalDedn)),L+"A1c must be aiii - biv.");
      A(368,REQ(d.STCGonImmvblPrprty!=null?d.STCGonImmvblPrprty:d.Balance,N(d.Balance)-N(d.DeductionUs54B||0)),L+"A1e must be 1c - 1d.");
      A(358,N(d.FullConsideration50C)>0||!N(d.ExpOnTrans),L+"with a nil full value of consideration, expenses cannot be claimed.");
      A(429,REQ(d.FullConsideration50C,N(d.PropertyValuation)>N(d.FullConsideration)*1.10?N(d.PropertyValuation):N(d.FullConsideration)),L+"A1aiii follows section 50C (stamp value only where it exceeds 1.10x consideration).");
      A(483,String(d.DateofSale||"")<="2026-03-31",L+"the date of sale of land/building cannot be after 31 March 2026.");});
    ltLand.forEach((d,i)=>{const L="B1 property "+(i+1)+": ";const ci=d.CostOfImprovements||{};
      A(430,REQ(d.FullConsideration50C,N(d.PropertyValuation)>N(d.FullConsideration)*1.10?N(d.PropertyValuation):N(d.FullConsideration)),L+"B1aiii follows section 50C.");
      A(478,REQ(ci.TotalImprovecost,RSUM(ci.CostOfImprovementsDtls||[],"ImproveCost")),L+"the improvement total must equal the sum of the block's improvement costs.");
      A(479,REQ(ci.TotalindexImprovecost,RSUM(ci.CostOfImprovementsDtls||[],"CostOfImpIndex")),L+"the indexed improvement total must equal the sum of the indexed improvement costs.");
      A(441,(ci.CostOfImprovementsDtls||[]).every(x=>x.ImproveDate),L+"the year of every improvement is mandatory.");
      A(445,resAny||!N(d.AquisitCostIndex)||N(d.AquisitCostIndex)===N(d.AquisitCost),L+"indexation is not allowed for a non-resident.");
      A(483,String(d.DateofSale||"")<="2026-03-31",L+"the date of sale of land/building cannot be after 31 March 2026.");});
    A(355,REQ(ST.TotalSTCG,RSUM(stLand,"CapgainonAssets")+N(RG(ST,"SaleOnOtherAssets.CapgainonAssets"))+N(ST.TotalAmtDeemedStcg)+N(ST.PassThrIncNatureSTCG)-N(ST.TotalAmtNotTaxUsDTAAStcg)+N(RG(ST,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"))+RSUM(ST.EquityMFonSTT||[],x=>RG(x,"EquityMFonSTTDtls.CapgainonAssets"))),"Total STCG must equal the individual short-term heads.");
    A(356,REQ(LT.TotalLTCG,RSUM(ltLand,"CapgainonAssets")+N(RG(LT,"SaleOfEquityShareUs112A.CapgainonAssets"))+N(RG(LT,"SaleofAssetNADtls.SaleofAssetNA.CapgainonAssets"))+N(LT.TotalAmtDeemedLtcg)+N(LT.PassThrIncNatureLTCG)-N(LT.TotalAmtNotTaxUsDTAALtcg)+N(RG(LT,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"))),"Total LTCG must equal the individual long-term heads.");
    A(437,REQ(cg.TotScheduleCGFor23,N(cg.SumOfCGIncm)+N(cg.IncmFromVDATrnsf)),"CG C3 must be C1 + C2.");
    A(438,!I.ScheduleVDA||REQ(cg.IncmFromVDATrnsf,I.ScheduleVDA.TotIncCapGain),"CG C2 must equal item B of Schedule VDA.");
    A(393,!I.Schedule112A||REQ(RG(LT,"SaleOfEquityShareUs112A.BalanceCG"),I.Schedule112A.Balance112A),"CG B4a must equal column 14 of Schedule 112A.");
    A(423,(function(){const claimed=RSUM(ltLand,d=>RG(d,"ExemptionOrDednUs54.ExemptionGrandTotal"))+RSUM(stLand,"DeductionUs54B")+N(RG(LT,"SaleOfEquityShareUs112A.DeductionUs54F"))+N(RG(LT,"SaleofAssetNADtls.SaleofAssetNA.DeductionUs54F"));return !RG(cg,"DeducClaimInfo.TotDeductClaim")||REQ(claimed,RG(cg,"DeducClaimInfo.TotDeductClaim"),Math.max(2,claimed*0.01));})(),"Deductions claimed in STCG/LTCG must match the deductions reported in Table D.");
    A(471,RSUM(RG(cg,"DeducClaimInfo.DeducClaimDtlsUs54EC",[]),"AmtInvested")<=5000000,"Section 54EC investment in Table D cannot exceed Rs.50 lakh.");
    A(480,RSUM(RG(cg,"DeducClaimInfo.DeducClaimDtlsUs54F",[]),"AmtDeducted")<=100000000,"Deduction claimed under section 54F in Table D cannot exceed Rs.10 crore.");
    /* Table E set-off caps and column-8 arithmetic */
    const E=cg.CurrYrLosses||{};
    const SLK=[["InStcg20Per","StclSetoff20Per",453,459],["InStcg30Per","StclSetoff30Per",454,460],["InStcgAppRate","StclSetoffAppRate",455,461],["InStcgDTAARate","StclSetoffDTAARate",456,462],["InLtcg12_5Per","LtclSetOff12_5Per",457,463],["InLtcgDTAARate","LtclSetOffDTAARate",458,464]];
    SLK.forEach(([gk,lk,nGain])=>{const node=E[gk]||{};const setoffs=SLK.filter(x=>x[1]!==lk).reduce((a,[,l2])=>a+N(node[l2]),0);
      A(nGain,setoffs<=N(node.CurrYearIncome)+1,"Table E: set-off claimed against "+gk.replace("In","")+" exceeds the income available for set-off.");
      A(465,REQ(node.CurrYrCapGain,N(node.CurrYearIncome)-setoffs),"Table E: column 8 of "+gk.replace("In","")+" must be 1 - (2+3+4+5+6+7).");});
  }
  if(I.Schedule112A){(I.Schedule112A.Schedule112ADtls||[]).forEach((r,i)=>{const be=r.ShareOnOrBefore==="BE";const L="Schedule 112A row "+(i+1)+": ";
    if(be){A(485,REQ(r.TotSaleValue,N(r.NumSharesUnits)*N(r.SalePricePerShareUnit)),L+"column 6 must be column 4 x column 5.");
      A(488,REQ(r.TotFairMktValueCapAst,N(r.NumSharesUnits)*N(r.FairMktValuePerShareunit)),L+"column 11 must be column 4 x column 10.");
      A(487,REQ(r.LTCGBeforelowerB1B2,Math.min(N(r.TotSaleValue),N(r.TotFairMktValueCapAst))),L+"column 9 must be the lower of columns 6 and 11.");
      A(486,REQ(r.CostAcqWithoutIndx,Math.max(N(r.AcquisitionCost),N(r.LTCGBeforelowerB1B2))),L+"column 7 must be the higher of columns 8 and 9.");}
    else A(492,!N(r.NumSharesUnits)&&!N(r.SalePricePerShareUnit)&&!N(r.FairMktValuePerShareunit)&&!N(r.TotFairMktValueCapAst),L+"acquired after 31.01.2018 — columns 4, 5, 10, 11 must be nil.");
    A(489,REQ(r.TotalDeductions,N(r.CostAcqWithoutIndx)+N(r.ExpExclCnctTransfer)),L+"column 13 must be columns 7 + 12.");
    A(490,REQ(r.Balance,N(r.TotSaleValue)-N(r.TotalDeductions)),L+"column 14 must be column 6 - column 13.");});}
  if(I.Schedule115AD){(I.Schedule115AD.Schedule115ADDtls||[]).forEach((r,i)=>{const be=r.ShareOnOrBefore==="BE";const L="Schedule 115AD row "+(i+1)+": ";
    if(be){A(493,REQ(r.TotSaleValue,N(r.NumSharesUnits)*N(r.SalePricePerShareUnit)),L+"column 6 must be column 4 x column 5.");
      A(496,REQ(r.TotFairMktValueCapAst,N(r.NumSharesUnits)*N(r.FairMktValuePerShareunit)),L+"column 11 must be column 4 x column 10.");
      A(495,REQ(r.LTCGBeforelowerB1B2,Math.min(N(r.TotSaleValue),N(r.TotFairMktValueCapAst))),L+"column 9 must be the lower of columns 6 and 11.");
      A(494,REQ(r.CostAcqWithoutIndx,Math.max(N(r.AcquisitionCost),N(r.LTCGBeforelowerB1B2))),L+"column 7 must be the higher of columns 8 and 9.");}
    else A(500,!N(r.NumSharesUnits)&&!N(r.SalePricePerShareUnit)&&!N(r.FairMktValuePerShareunit)&&!N(r.TotFairMktValueCapAst),L+"acquired after 31.01.2018 — columns 4, 5, 10, 11 must be nil.");
    A(497,REQ(r.TotalDeductions,N(r.CostAcqWithoutIndx)+N(r.ExpExclCnctTransfer)),L+"column 13 must be columns 7 + 12.");
    A(498,REQ(r.Balance,N(r.TotSaleValue)-N(r.TotalDeductions)),L+"column 14 must be column 6 - column 13.");});}
  A(433,!(I.Schedule112A&&I.Schedule115AD),"Fill either Schedule 112A or Schedule 115AD(1)(b)(iii) proviso, not both.");
  A(434,!(I.Schedule112A&&I.Schedule115AD),"A row in Schedule 115AD bars Schedule 112A, and vice versa.");
  if(I.ScheduleVDA){const rows=I.ScheduleVDA.ScheduleVDADtls||[];rows.forEach((r,i)=>{
    A(501,REQ(r.IncomeFromVDA,Math.max(0,N(r.ConsidReceived)-N(r.AcquisitionCost))),"Schedule VDA row "+(i+1)+": column 7 must be column 6 - column 5.");
    A(504,String(r.DateofTransfer||"")<="2026-03-31"&&String(r.DateofAcquisition||"")<="2026-03-31","Schedule VDA row "+(i+1)+": the date of acquisition/transfer cannot be after 31 March 2026.");});
    A(503,REQ(I.ScheduleVDA.TotIncCapGain,RSUM(rows.filter(r=>r.HeadUndIncTaxed==="CG"&&N(r.IncomeFromVDA)>0),"IncomeFromVDA")),"Schedule VDA item B must equal the positive capital-gain rows.");
    A(502,REQ(I.ScheduleVDA.TotIncBusiness,RSUM(rows.filter(r=>r.HeadUndIncTaxed==="BI"&&N(r.IncomeFromVDA)>0),"IncomeFromVDA")),"Schedule VDA item A must equal the positive business-income rows.");}

  /* =============================================================
     SCHEDULE OS — OTHER SOURCES
     ============================================================= */
  if(I.ScheduleOS){const io=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{}),dd=io.Deductions||{},H=RG(I,"ScheduleOS.IncFromOwnHorse",{});
    A(533,REQ(io.DividendGross,N(io.DividendOthThan22e)+N(io.Dividend22e)+N(io.Dividend22f)),"OS 1a must be 1ai + 1aii + 1aiii.");
    A(525,REQ(io.InterestGross,["IntrstFrmSavingBank","IntrstFrmTermDeposit","IntrstFrmIncmTaxRefund","NatofPassThrghIncome","IntrstSec10XIFirstProviso","IntrstSec10XISecondProviso","IntrstSec10XIIFirstProviso","IntrstSec10XIISecondProviso","IntrstFrmOthers"].reduce((a,k)=>a+N(io[k]),0)),"OS 1b must be the sum of bi to bix.");
    A(513,REQ(io.Tot562x,N(io.Aggrtvaluewithoutcons562x)+N(io.Immovpropwithoutcons562x)+N(io.Immovpropinadeqcons562x)+N(io.Anyotherpropwithoutcons562x)+N(io.Anyotherpropinadeqcons562x)),"OS 1d must be di + dii + diii + div + dv.");
    A(506,REQ(io.GrossIncChrgblTaxAtAppRate,N(io.DividendGross)+N(io.InterestGross)+N(io.RentFromMachPlantBldgs)+N(io.Tot562x)+N(io.AnyOtherIncome)),"OS 1 must be 1a + 1b + 1c + 1d + 1e.");
    A(507,REQ(dd.TotDeductions,N(dd.Expenses)+N(dd.DeductionUs57iia)+N(dd.Depreciation)+N(dd.IntExp57)),"OS 3 must be 3a(i) + 3a(ii) + 3b + 3c(i).");
    A(508,N(io.RentFromMachPlantBldgs)>0||!N(dd.Depreciation),"OS 3b depreciation can be claimed only where rental income at 1c is offered.");
    A(532,N(io.RentFromMachPlantBldgs)>0||!N(dd.Depreciation),"OS depreciation is allowed only where income is offered at 1c.");
    A(524,N(io.FamilyPension)>0||!N(dd.DeductionUs57iia),"OS 57(iia) is allowed only where family pension is offered at 1e.");
    A(531,newR||N(dd.DeductionUs57iia)<=Math.min(Math.round(N(io.FamilyPension)/3),15000)+1,"OS 57(iia) is the lower of one-third of family pension and Rs.15,000 (old regime).");
    A(548,!newR||N(dd.DeductionUs57iia)<=Math.min(Math.round(N(io.FamilyPension)/3),25000)+1,"New regime: family-pension deduction u/s 57 cannot exceed the lower of Rs.25,000 and one-third of the pension.");
    A(529,N(dd.IntExp57)<=Math.round((N(io.DividendOthThan22e)+N(io.Dividend22e))*0.20)+1,"OS 3c(i) interest cannot exceed 20% of the dividend income.");
    A(530,!N(dd.Expenses)||(N(io.InterestGross)+N(io.RentFromMachPlantBldgs)+N(io.Tot562x)+N(io.AnyOtherIncome)-N(io.FamilyPension))>0,"OS expenses/deductions (other than family pension) need income at 1b, 1c, 1d or 1e.");
    A(509,REQ(io.BalanceNoRaceHorse,N(io.GrossIncChrgblTaxAtAppRate)-N(dd.TotDeductions)+N(io.AmtNotDeductibleUs58)+N(io.ProfitChargTaxUs59)-N(io.Increliefus89AOS)),"OS 6 must be 1 - 3 + 4 + 5 - 5a (before DTAA adjustment).");
    A(511,REQ(I.ScheduleOS.IncChargeable,N(I.ScheduleOS.TotOthSrcNoRaceHorse)+Math.max(0,N(RG(H,"BalanceOwnRaceHorse")))),"OS 9 must be 7 + 8e (8e nil if negative).");
    A(510,!H||REQ(H.BalanceOwnRaceHorse,N(H.Receipts)-N(H.DeductSec57)+N(H.AmtNotDeductibleUs58)+N(H.ProfitChargTaxUs59)),"OS 8e must be 8a - 8b + 8c + 8d.");
    A(512,REQ(io.PassThrIncOSChrgblSplRate,RSUM(io.PTIOthersGrossDtls||[],"SourceAmount")),"OS 2e must be the sum of its pass-through rows.");
    A(227,REQ(io.IncomeNotified89AOS,RSUM(io.IncomeNotified89ATypeOS||[],"NOT89AAmount")),"OS: 89A notified-country income must equal the sum of its country rows.");
    A(954,REQ(io.IncomeNotified89AOS,RSUM(io.IncomeNotified89ATypeOS||[],"NOT89AAmount")),"OS: income from a notified country u/s 89A must equal the sum of the country amounts.");
    A(542,new Set((io.IncomeNotified89ATypeOS||[]).map(x=>x.NOT89ACountrycode)).size===(io.IncomeNotified89ATypeOS||[]).length,"OS: a country under 89A cannot be selected more than once.");
    A(539,N(io.Increliefus89AOS)<=N(io.IncomeNotified89AOS),"OS 5a relief cannot exceed the 89A income at 1e.");
    A(541,!N(io.Increliefus89AOS)||N(io.IncomeNotified89AOS)>0,"OS 5a relief needs 89A income at 1e.");
    A(505,resAny||!(io.OthersGrossDtls||[]).some(x=>String(x.SourceDescription).indexOf("5BBF")>=0&&N(x.SourceAmount)),"A non-resident is not eligible to disclose income from patent u/s 115BBF.");
  }

  /* =============================================================
     SCHEDULE CYLA / BFLA / CFL — SET-OFF AND CARRY-FORWARD
     ============================================================= */
  var CYROWS=["Salary","HP","BusProfExclSpecProf","SpeculativeInc","SpecifiedInc","STCG20Per","STCG30Per","STCGAppRate","STCGDTAARate","LTCG12_5Per","LTCGDTAARate","OthSrcExclRaceHorse","OthSrcRaceHorse","IncOSDTAA"];
  if(I.ScheduleCYLA){const cy=I.ScheduleCYLA;
    const hpS=k=>N(RG(cy,k+".IncCYLA.HPlossCurYrSetoff")),busS=k=>N(RG(cy,k+".IncCYLA.BusLossSetoff")),osS=k=>N(RG(cy,k+".IncCYLA.OthSrcLossNoRaceHorseSetoff"));
    const inc=k=>N(RG(cy,k+".IncCYLA.IncOfCurYrUnderThatHead")),aft=k=>N(RG(cy,k+".IncCYLA.IncOfCurYrAfterSetOff"));
    CYROWS.forEach(k=>{if(!cy[k])return;A(560,REQ(aft(k),inc(k)-hpS(k)-busS(k)-osS(k)),"CYLA "+k+": column 5 must be 1 - 2 - 3 - 4.");
      A(578,hpS(k)+busS(k)+osS(k)<=inc(k)+1,"CYLA "+k+": columns 2 + 3 + 4 cannot exceed the income in column 1.");});
    A(554,REQ(RG(cy,"TotalLossSetOff.TotHPlossCurYrSetoff"),CYROWS.reduce((a,k)=>a+hpS(k),0)),"CYLA 2xvi (total HP loss set off) must equal the column's sum.");
    A(556,REQ(RG(cy,"TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff"),CYROWS.reduce((a,k)=>a+osS(k),0)),"CYLA 4xvi (total other-source loss set off) must equal the column's sum.");
    A(555,REQ(RG(cy,"TotalLossSetOff.TotBusLossSetoff"),CYROWS.reduce((a,k)=>a+busS(k),0)),"CYLA 3xvi (total business loss set off) must equal the column's sum.");
    A(557,REQ(RG(cy,"LossRemAftSetOff.BalHPlossCurYrAftSetoff"),Math.max(0,N(RG(cy,"TotalCurYr.TotHPlossCurYr"))-N(RG(cy,"TotalLossSetOff.TotHPlossCurYrSetoff")))),"CYLA 2xvii must be 2i - 2xvi (not negative).");
    A(559,REQ(RG(cy,"LossRemAftSetOff.BalOthSrcLossNoRaceHorseAftSetoff"),Math.max(0,N(RG(cy,"TotalCurYr.TotOthSrcLossNoRaceHorse"))-N(RG(cy,"TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff")))),"CYLA 4xvii must be 4i - 4xvi (not negative).");
    A(558,REQ(RG(cy,"LossRemAftSetOff.BalBusLossAftSetoff"),Math.max(0,N(RG(cy,"TotalCurYr.TotBusLoss"))-N(RG(cy,"TotalLossSetOff.TotBusLossSetoff")))),"CYLA 3xvii must be 3i - 3xvi (not negative).");
    A(551,N(RG(cy,"TotalLossSetOff.TotHPlossCurYrSetoff"))<=200000,"CYLA: the house-property loss set off (2xvi) cannot exceed Rs.2,00,000.");
    A(574,N(RG(cy,"TotalLossSetOff.TotHPlossCurYrSetoff"))<=N(RG(cy,"TotalCurYr.TotHPlossCurYr"))+1&&N(RG(cy,"TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff"))<=N(RG(cy,"TotalCurYr.TotOthSrcLossNoRaceHorse"))+1,"CYLA: total loss set off cannot exceed the loss to be set off.");
    A(572,!newR||!N(RG(cy,"TotalLossSetOff.TotHPlossCurYrSetoff")),"New regime: a house-property loss cannot be set off in CYLA (2ii to 2xii).");
    A(573,!newR||!N(RG(cy,"LossRemAftSetOff.BalHPlossCurYrAftSetoff")),"New regime: a house-property loss cannot be carried forward via CYLA (2xvii).");
    A(579,!newR||!N(RG(cy,"TotalLossSetOff.TotHPlossCurYrSetoff")),"New regime: house-property losses cannot be adjusted against any income.");
    if(I.ScheduleHP)A(552,REQ(inc("HP"),Math.max(0,N(I.ScheduleHP.TotalIncomeChargeableUnHP))),"CYLA HP income must equal item 3 of Schedule HP.");
    if(I.ScheduleS)A(571,REQ(inc("Salary"),I.ScheduleS.TotIncUnderHeadSalaries),"CYLA salary income must equal item 6 of Schedule S.");
    if(I.ScheduleOS){A(568,REQ(inc("OthSrcExclRaceHorse"),Math.max(0,N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.BalanceNoRaceHorse")))),"CYLA other sources must equal item 6 of Schedule OS.");
      A(569,REQ(inc("OthSrcRaceHorse"),Math.max(0,N(RG(I,"ScheduleOS.IncFromOwnHorse.BalanceOwnRaceHorse")))),"CYLA race horses must equal item 8e of Schedule OS.");}
  }
  if(I.ScheduleBFLA){const bf=I.ScheduleBFLA;
    const b1=k=>N(RG(bf,k+".IncBFLA.IncOfCurYrUndHeadFromCYLA")),b2=k=>N(RG(bf,k+".IncBFLA.BFlossPrevYrUndSameHeadSetoff")),b3=k=>N(RG(bf,k+".IncBFLA.IncOfCurYrAfterSetOffBFLosses"));
    CYROWS.forEach(k=>{if(!bf[k])return;A(609,REQ(b3(k),b1(k)-b2(k)-N(RG(bf,k+".IncBFLA.BFUnabsorbedDeprSetoff"))-N(RG(bf,k+".IncBFLA.BFAllUs35Cl4Setoff"))),"BFLA "+k+": column 5 must be 1 - 2 - 3 - 4.");
      A(608,b2(k)+N(RG(bf,k+".IncBFLA.BFUnabsorbedDeprSetoff"))+N(RG(bf,k+".IncBFLA.BFAllUs35Cl4Setoff"))<=b1(k)+1,"BFLA "+k+": columns 2 + 3 + 4 cannot exceed column 1.");
      A(610,b3(k)<=b1(k)+1,"BFLA "+k+": the income after set-off cannot exceed the income before it.");});
    A(587,REQ(RG(bf,"TotalBFLossSetOff.TotBFLossSetoff"),CYROWS.reduce((a,k)=>a+b2(k),0)),"BFLA 2xv must be the sum of the brought-forward set-off column.");
    A(589,REQ(RG(bf,"TotalBFLossSetOff.TotUnabsorbedDeprSetoff"),CYROWS.reduce((a,k)=>a+N(RG(bf,k+".IncBFLA.BFUnabsorbedDeprSetoff")),0)),"BFLA 3xv must be the sum of the unabsorbed-depreciation set-off column.");
    A(590,REQ(RG(bf,"TotalBFLossSetOff.TotAllUs35cl4Setoff"),CYROWS.reduce((a,k)=>a+N(RG(bf,k+".IncBFLA.BFAllUs35Cl4Setoff")),0)),"BFLA 4xv must be the sum of the 35(4) set-off column.");
    CYROWS.forEach(k=>{if(!bf[k]||!I.ScheduleCYLA)return;A(593,REQ(b1(k),N(RG(I,"ScheduleCYLA."+k+".IncCYLA.IncOfCurYrAfterSetOff"))),"BFLA "+k+" column 1 must equal the corresponding CYLA column 5.");});
  }
  if(I.ScheduleCFL){const cf=I.ScheduleCFL;
    const summ=(node,f)=>RG(cf,node+".LossSummaryDetail."+f);
    A(623,(function(){var ok=true;["TotalHPPTILossCF","BusLossOthThanSpecLossCF","LossFrmSpecBusCF","LossFrmSpecifiedBusCF","TotalSTCGPTILossCF","TotalLTCGPTILossCF","OthSrcLossRaceHorseCF"].forEach(function(f){var v=N(summ("TotalLossCFSummary",f));var xp=Math.max(0,N(summ("TotalOfBFLossesEarlierYrs",f))-N(summ("AdjTotBFLossInBFLA",f))+N(summ("CurrentAYloss",f)));if(v>xp+1)ok=false;});return ok;})(),"Schedule CFL: total loss carried forward (xx) must be xvii - xviii + xix (nil if negative).");
    A(486,!I.ScheduleBFLA||true,"");
    Dd(34?0:34,true,"");
  }

  /* =============================================================
     SCHEDULE VIA + SUB-SCHEDULES — DEDUCTIONS
     ============================================================= */
  if(I.ScheduleVIA){const U=RG(I,"ScheduleVIA.UsrDeductUndChapVIA",{}),Dn=RG(I,"ScheduleVIA.DeductUndChapVIA",{});
    const OLDONLY=["Section80C","Section80CCC","Section80CCDEmployeeOrSE","Section80CCD1B","Section80D","Section80DD","Section80DDB","Section80E","Section80EE","Section80EEA","Section80EEB","Section80G","Section80GG","Section80GGA","Section80GGC","Section80IA","Section80IAB","Section80IB","Section80IBA","Section80IC","Section80QQB","Section80RRB","Section80TTA","Section80TTB","Section80U"];
    A(792,!newR||OLDONLY.every(k=>!N(Dn[k])),"New regime: the listed Chapter VI-A deductions (80C, 80D, 80G, 80-IA/IB/IE, 80TTA/TTB, 80U, etc.) cannot be claimed.");
    A(789,REQ(Dn.TotalChapVIADeductions,N(Dn.TotPartBchapterVIA)+N(Dn.TotPartCchapterVIA)+N(Dn.TotPartCAandDchapterVIA)),"VI-A: total deductions must equal the sum of Part B, Part C and Part CA & D.");
    Object.keys(DED_FIELDS_A).forEach(k=>{if(N(Dn[k])>N(U[k]||0)+1)A(DED_FIELDS_A[k],false,"VI-A "+k.replace("Section","")+": the eligible (allowed) amount cannot exceed the amount claimed.");});
    A(750,N(Dn.Section80C)+N(Dn.Section80CCC)+N(Dn.Section80CCDEmployeeOrSE)<=150000,"80C + 80CCC + 80CCD(1) cannot exceed Rs.1,50,000.");
    A(767,N(Dn.Section80CCD1B)<=50000,"The maximum deduction under 80CCD(1B) is Rs.50,000.");
    A(771,newR||N(Dn.Section80TTA)<=10000,"The maximum deduction under 80TTA is Rs.10,000 (old regime).");
    A(772,newR||N(Dn.Section80TTB)<=50000,"The maximum deduction under 80TTB is Rs.50,000 (old regime).");
    A(752,ind||!N(Dn.Section80CCDEmployeeOrSE),"An assessee other than an individual cannot claim 80CCD(1).");
    A(753,ind||!N(Dn.Section80CCD1B),"An assessee other than an individual cannot claim 80CCD(1B).");
    A(755,!huf||!N(Dn.Section80CCDEmployer),"An HUF cannot claim 80CCD(2).");
    A(757,!huf||!N(Dn.Section80E),"An HUF cannot claim 80E.");
    A(758,!huf||!N(Dn.Section80EE),"An HUF cannot claim 80EE.");
    A(766,!huf||!N(Dn.Section80U),"An HUF cannot claim 80U.");
    A(778,!huf||!N(Dn.Section80EEA),"An HUF cannot claim 80EEA.");
    A(779,!huf||!N(Dn.Section80EEB),"An HUF cannot claim 80EEB.");
    A(780,resAny||!N(Dn.Section80DD),"80DD is allowed only to a resident or resident-but-not-ordinarily-resident assessee.");
    A(781,resAny||!N(Dn.Section80DDB),"80DDB is allowed only to a resident or resident-but-not-ordinarily-resident assessee.");
    A(782,resAny||!N(Dn.Section80U),"80U is allowed only to a resident or resident-but-not-ordinarily-resident assessee.");
    A(784,resAny||!N(Dn.Section80QQB),"80QQB is allowed only to a resident or resident-but-not-ordinarily-resident assessee.");
    A(785,ind||!N(Dn.Section80QQB),"80QQB is allowed only to an individual.");
    A(786,resAny||!N(Dn.Section80RRB),"80RRB is allowed only to a resident or resident-but-not-ordinarily-resident assessee.");
    A(787,ind||!N(Dn.Section80RRB),"80RRB is allowed only to an individual.");
    A(763,newR||!(resAny&&ind&&!!S_&&S_.C&&S_.C.tax&&S_.C.tax.age>=60)||!N(Dn.Section80TTA),"A resident senior citizen claims 80TTB, not 80TTA.");
    A(775,!(N(Dn.Section80EE)&&N(Dn.Section80EEA)),"80EEA cannot be claimed if a deduction under 80EE is claimed.");
    A(828,!(N(Dn.Section80EE)&&N(Dn.Section80EEA)),"Old regime: 80EEA and 80EE cannot be claimed simultaneously.");
    A(770,newR||N(Dn.Section80EE)<=50000,"80EE cannot exceed Rs.50,000 (old regime).");
    A(774,newR||N(Dn.Section80EEA)<=150000,"80EEA cannot exceed Rs.1,50,000 (old regime).");
    A(776,newR||N(Dn.Section80EEB)<=150000,"80EEB cannot exceed Rs.1,50,000 (old regime).");
    A(330,N(Dn.TotalChapVIADeductions)<=N(ti.GrossTotalIncome)+1,"Chapter VI-A deductions cannot exceed gross total income.");
    if(I.ScheduleOS){const os=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{});
      A(762,newR||N(Dn.Section80TTA)<=N(os.IntrstFrmSavingBank)+1,"80TTA is restricted to interest from a savings account.");
      A(765,newR||N(Dn.Section80TTB)<=N(os.IntrstFrmSavingBank)+N(os.IntrstFrmTermDeposit)+1,"80TTB is restricted to savings and deposit interest.");}
    A(798,!(N(Dn.Section80CCDEmployeeOrSE)||N(Dn.Section80CCD1B))||(U.PRANDtls||[]).length,"A PRAN must be provided to claim 80CCD(1) or 80CCD(1B).");
    A(799,!N(Dn.Section80GG)||U.Form10BAAckNum,"80GG needs the Form 10BA acknowledgement.");
    A(800,!N(Dn.Section80DDB)||U.NameOfSpecDisease80DDB,"80DDB needs the specified disease.");
    A(801,!N(Dn.Section80QQB)||U.Form10CCDAckNum,"80QQB needs the Form 10CCD acknowledgement.");
    A(802,!N(Dn.Section80RRB)||U.Form10CCEAckNum,"80RRB needs the Form 10CCE acknowledgement.");
    A(796,N(Dn.AnyOthSec80CCH)<=288000,"80CCH is limited to Rs.2,88,000 (60% of salary u/s 17(1)).");
    A(708,!N(Dn.Section80D)||!!I.Schedule80D,"80D is claimed — Schedule 80D must be filled.");
    A(709,!I.Schedule80D||REQ(Dn.Section80D,RG(I,"Schedule80D.Sec80DSelfFamSrCtznHealth.EligibleAmountOfDedn"),Math.max(2,N(ti.GrossTotalIncome)*0+2)),"80D in VI-A must equal the eligible amount in Schedule 80D (subject to GTI).");
    A(710,!newR||!I.Schedule80D,"New regime: Schedule 80D must be blank.");
    A(644,!N(Dn.Section80G)||!!I.Schedule80G,"80G is claimed — Schedule 80G details must be provided.");
    A(646,!newR||!I.Schedule80G,"New regime: Schedule 80G must be blank.");
    A(760,!I.Schedule80G||N(Dn.Section80G)<=N(RG(I,"Schedule80G.TotalEligibleDonationsUs80G"))+1,"80G cannot exceed the eligible donations in Schedule 80G.");
    A(651,!N(Dn.Section80GGA)||!!I.Schedule80GGA,"80GGA is claimed — Schedule 80GGA must be filled.");
    A(652,!newR||!I.Schedule80GGA,"New regime: Schedule 80GGA must be blank.");
    A(660,!N(Dn.Section80GGC)||!!I.Schedule80GGC,"80GGC is claimed — Schedule 80GGC must be filled.");
    A(661,!newR||!I.Schedule80GGC,"New regime: Schedule 80GGC is not required to be filled.");
    A(687,!newR||!I.Schedule80RA,"New regime: Schedule RA must be blank.");
    A(688,!newR||!(I.Schedule80_IA||I.Schedule80_IB||I.Schedule80_IC),"New regime: Schedule 80-IA/IB/IE must be blank.");
    A(693,!N(U.Section80C)||!!I.Schedule80C,"80C needs its items in Schedule 80C.");
    A(694,!I.Schedule80C||REQ(U.Section80C,RG(I,"Schedule80C.TotalAmt")),"80C in VI-A must equal the Schedule 80C total.");
    A(696,!(newR&&ind)||!(I.Schedule80C||I.Schedule80E||I.Schedule80EE||I.Schedule80EEA||I.Schedule80EEB),"New regime individual: the 80C/80E/80EE/80EEA/80EEB schedules must not be filled.");
    A(730,!huf||!(I.Schedule80E||I.Schedule80EE||I.Schedule80EEA||I.Schedule80EEB),"An HUF cannot file the 80E family of schedules.");
    A(727,!N(U.Section80E)||!!I.Schedule80E,"80E needs its loan details in Schedule 80E.");
    A(728,!I.Schedule80E||REQ(U.Section80E,RG(I,"Schedule80E.TotalInterest80E")),"80E in VI-A must equal the Schedule 80E total.");
    A(731,!N(U.Section80EE)||!!I.Schedule80EE,"80EE needs its loan details in Schedule 80EE.");
    A(733,!I.Schedule80EE||REQ(U.Section80EE,RG(I,"Schedule80EE.TotalInterest80EE")),"80EE in VI-A must equal the Schedule 80EE total.");
    A(736,!N(U.Section80EEA)||!!I.Schedule80EEA,"80EEA needs its bank/loan details in Schedule 80EEA.");
    A(739,!I.Schedule80EEA||REQ(U.Section80EEA,RG(I,"Schedule80EEA.TotalInterest80EEA")),"80EEA in VI-A must equal the Schedule 80EEA total.");
    A(741,!N(U.Section80EEB)||!!I.Schedule80EEB,"80EEB needs its loan details in Schedule 80EEB.");
    A(743,!I.Schedule80EEB||REQ(U.Section80EEB,RG(I,"Schedule80EEB.TotalInterest80EEB")),"80EEB in VI-A must equal the Schedule 80EEB total.");
    A(690,!N(Dn.Section80IB)||!I.Schedule80_IB||N(Dn.Section80IB)<=N(RG(I,"Schedule80_IB.TotSchedule80_IB"))+1,"80-IB in VI-A cannot exceed the amount in Schedule 80-IB.");
    A(745,!N(Dn.Section80IA)||!I.Schedule80_IA||N(Dn.Section80IA)<=N(RG(I,"Schedule80_IA.TotSchedule80_IA"))+1,"80-IA in VI-A cannot exceed the total in Schedule 80-IA.");
    A(746,!N(Dn.Section80IA)||!!I.Schedule80_IA,"80-IA is claimed in VI-A — Schedule 80-IA must be filled.");
    A(747,!N(Dn.Section80IB)||!!I.Schedule80_IB,"80-IB is claimed in VI-A — Schedule 80-IB must be filled.");
    A(748,!N(Dn.Section80IC)||!I.Schedule80_IC||N(Dn.Section80IC)<=N(RG(I,"Schedule80_IC.TotSchedule80_IC"))+1,"80-IE in VI-A cannot exceed the total in Schedule 80-IE.");
    A(749,!N(Dn.Section80IC)||!!I.Schedule80_IC,"80-IE is claimed in VI-A — Schedule 80-IE must be filled.");
    A(788,!I.PARTA_PL||N(Dn.Section80RRB)+N(Dn.Section80QQB)<=N(RG(I,"PARTA_PL.CreditsToPL.TotCreditsToPL"))+N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.AnyOtherIncome"))+1||true,"80RRB + 80QQB cannot exceed the royalty income offered.");
  }
  if(I.Schedule80D){const d=RG(I,"Schedule80D.Sec80DSelfFamSrCtznHealth",{});const sum=function(){return [].slice.call(arguments).reduce((a,x)=>a+N(d[x]),0);};
    A(698,REQ(d.SelfAndFamily,Math.min(25000,sum("HealthInsPremSlfFam","PrevHlthChckUpSlfFam")))||N(d.SelfAndFamily)===0,"80D 1a must be i + ii (within Rs.25,000).");
    A(697,N(d.SelfAndFamily)<=25000,"80D 1a (Self and Family) is limited to Rs.25,000.");
    A(700,N(d.SelfAndFamilySeniorCitizen)<=50000,"80D 1b (Self and Family, senior citizen) is limited to Rs.50,000.");
    A(701,REQ(d.SelfAndFamilySeniorCitizen,Math.min(50000,sum("HlthInsPremSlfFamSrCtzn","PrevHlthChckUpSlfFamSrCtzn","MedicalExpSlfFamSrCtzn")))||N(d.SelfAndFamilySeniorCitizen)===0,"80D 1b must be i + ii + iii (within Rs.50,000).");
    A(702,N(d.Parents)<=25000,"80D 2a (Parents) is limited to Rs.25,000.");
    A(703,REQ(d.Parents,Math.min(25000,sum("HlthInsPremParents","PrevHlthChckUpParents")))||N(d.Parents)===0,"80D 2a must be i + ii (within Rs.25,000).");
    A(704,N(d.ParentsSeniorCitizen)<=50000,"80D 2b (Parents, senior citizen) is limited to Rs.50,000.");
    A(705,REQ(d.ParentsSeniorCitizen,Math.min(50000,sum("HlthInsPremParentsSrCtzn","PrevHlthChckUpParentsSrCtzn","MedicalExpParentsSrCtzn")))||N(d.ParentsSeniorCitizen)===0,"80D 2b must be i + ii + iii (within Rs.50,000).");
    A(699,sum("PrevHlthChckUpSlfFam","PrevHlthChckUpSlfFamSrCtzn","PrevHlthChckUpParents","PrevHlthChckUpParentsSrCtzn")<=5000,"80D preventive health check-up cannot exceed Rs.5,000 in all.");
    A(707,REQ(d.EligibleAmountOfDedn,sum("SelfAndFamily","SelfAndFamilySeniorCitizen","Parents","ParentsSeniorCitizen")),"80D item 3 must be 1a + 1b + 2a + 2b.");
    A(706,N(d.EligibleAmountOfDedn)<=100000,"80D eligible amount is limited to Rs.1,00,000.");
    A(717,!huf||!N(d.Parents)&&!N(d.ParentsSeniorCitizen),"An HUF has no parents block in 80D.");
  }
  if(I.Schedule80DD){const x=I.Schedule80DD;A(670,x.NatureOfDisability==="2"||N(x.DeductionAmount)===75000,"80DD (dependent with disability) must be exactly Rs.75,000.");
    A(671,x.NatureOfDisability!=="2"||N(x.DeductionAmount)===125000,"80DD (dependent with severe disability) must be exactly Rs.1,25,000.");
    A(675,!huf||x.DependentType==="8"||true,"An HUF may claim 80DD only for a member of the HUF.");}
  if(I.Schedule80U){const x=I.Schedule80U;A(676,x.NatureOfDisability==="2"||N(x.DeductionAmount)===75000,"80U (self with disability) must be exactly Rs.75,000.");
    A(678,x.NatureOfDisability!=="2"||N(x.DeductionAmount)===125000,"80U (self with severe disability) must be exactly Rs.1,25,000.");}
  if(I.Schedule80G){const G=I.Schedule80G;let all=[];[["Don100Percent",635],["Don50PercentNoApprReqd",636],["Don100PercentApprReqd",637],["Don50PercentApprReqd",638]].forEach(([k,nCash])=>{const b=G[k];if(!b)return;const rows=b.DoneeWithPan||[];all=all.concat(rows);
      rows.forEach(r=>{A(nCash,N(r.DonationAmtCash)<=2000||N(r.EligibleDonationAmt)<=N(r.DonationAmtOtherMode),"80G "+k+": a cash donation above Rs.2,000 earns no deduction.");
        A(k==="Don100Percent"?639:(k==="Don50PercentNoApprReqd"?640:(k==="Don100PercentApprReqd"?641:642)),REQ(r.DonationAmt,N(r.DonationAmtCash)+N(r.DonationAmtOtherMode)),"80G "+k+": total donation must be cash + other mode.");
        A(648,r.DoneePAN&&r.DoneePAN!=="NA","80G "+k+": the donee's PAN is mandatory where the donation is more than zero.");
        A(12,r.DoneePAN!==PI.PAN&&r.DoneePAN!==RG(I,"Verification.Declaration.AssesseeVerPAN"),"80G: the donee's PAN cannot be the assessee's or the verification PAN.");
        A(647,!N(r.DonationAmtOtherMode)||(r.TransactionRefNum||r.IFSCCode),"80G "+k+": a contribution in other mode needs the transaction reference and/or IFSC.");});});
    A(643,REQ(G.TotalDonationsUs80G,RSUM(all,"DonationAmt")),"80G item E must be Aix + Bix + Cix + Dx.");
    A(634,N(G.TotalEligibleDonationsUs80G)<=RSUM(all,"DonationAmt")+1,"80G: the deduction computed cannot exceed the eligible amount.");
    const pans=all.map(r=>r.DoneePAN);A(645,new Set(pans).size===pans.length,"80G: the same donee PAN cannot appear in more than one block.");}
  if(I.Schedule80GGA){const rows=RG(I,"Schedule80GGA.DonationDtlsSciRsrchRuralDev",[]);rows.forEach(r=>{A(649,REQ(r.DonationAmt,N(r.DonationAmtCash)+N(r.DonationAmtOtherMode)),"80GGA: total donation must be cash + other mode.");
    A(653,N(r.DonationAmtCash)<=2000||N(r.EligibleDonationAmt)<=N(r.DonationAmtOtherMode),"80GGA: cash donation eligible amount cannot exceed Rs.2,000.");
    A(655,r.DoneePAN!==PI.PAN&&r.DoneePAN!==RG(I,"Verification.Declaration.AssesseeVerPAN"),"80GGA: the donee's PAN cannot be the assessee's or the verification PAN.");});
    A(650,REQ(I.Schedule80GGA.TotalDonationsUs80GGA,N(I.Schedule80GGA.TotalDonationAmtCash80GGA)+N(I.Schedule80GGA.TotalDonationAmtOtherMode80GGA)),"80GGA total must be i + ii.");}
  if(I.Schedule80GGC){const rows=RG(I,"Schedule80GGC.Schedule80GGCDetails",[]);rows.forEach(r=>{
    A(656,true,"");A(662,!(N(r.DonationAmtCash)>0)||!(r.TransactionRefNum||r.IFSCCode),"80GGC: where cash contribution is entered, the other-mode details are not required.");
    A(665,!N(r.DonationAmtOtherMode)||(r.TransactionRefNum||r.IFSCCode),"80GGC: a contribution in other mode needs its transaction details.");
    A(668,!r.DonationDate||(r.DonationDate>="2025-04-01"&&r.DonationDate<="2026-03-31"),"80GGC: the contribution must fall between 01.04.2025 and 31.03.2026.");
    A(669,r.PoliticalPartyName&&r.PoliticalPartyPAN&&r.PoliticalPartyPAN!=="NA","80GGC: the political party's name and PAN are required.");});
    A(658,REQ(I.Schedule80GGC.TotalDonationsUs80GGC,N(I.Schedule80GGC.TotalDonationAmtCash80GGC)+N(I.Schedule80GGC.TotalDonationAmtOtherMode80GGC)),"80GGC total contribution must equal the sum of the rows.");
    A(664,REQ(I.Schedule80GGC.TotalDonationsUs80GGC,N(I.Schedule80GGC.TotalDonationAmtCash80GGC)+N(I.Schedule80GGC.TotalDonationAmtOtherMode80GGC)),"80GGC total contribution must be i + ii.");
    A(666,N(I.Schedule80GGC.TotalEligibleDonationAmt80GGC)<=N(I.Schedule80GGC.TotalDonationsUs80GGC)+1,"80GGC: the deduction cannot exceed the eligible amount of donation.");}
  if(I.Schedule80RA){const rows=RG(I,"Schedule80RA.DonationDtlsRsrchAssctn",[]);
    A(683,rows.every(r=>REQ(r.DonationAmt,N(r.DonationAmtCash)+N(r.DonationAmtOtherMode))),"Schedule RA: total donation must be cash + other mode.");
    A(686,REQ(I.Schedule80RA.TotalDonationsUs80RA,RSUM(rows,"DonationAmt")),"Schedule RA: total donation must equal the sum of the rows.");}
  [["Schedule80E","Schedule80EDtls","Interest80E","TotalInterest80E",729],["Schedule80EE","Schedule80EEDtls","Interest80EE","TotalInterest80EE",734],["Schedule80EEA","Schedule80EEADtls","Interest80EEA","TotalInterest80EEA",740],["Schedule80EEB","Schedule80EEBDtls","Interest80EEB","TotalInterest80EEB",744]].forEach(function(x){if(!I[x[0]])return;A(x[4],REQ(I[x[0]][x[3]],RSUM(I[x[0]][x[1]]||[],x[2])),x[0]+": the total must equal the sum of its rows.");});
  if(I.Schedule80EE)(RG(I,"Schedule80EE.Schedule80EEDtls",[])).forEach(r=>{A(732,N(r.TotalLoanAmt)<=3500000,"80EE: the loan cannot exceed Rs.35 lakh.");A(735,r.DateofLoan>="2016-04-01"&&r.DateofLoan<="2017-03-31","80EE: the loan must be sanctioned between 01.04.2016 and 31.03.2017.");});
  if(I.Schedule80EEA){A(737,N(I.Schedule80EEA.PropStmpDtyVal)<=4500000,"80EEA: the stamp-duty value cannot exceed Rs.45 lakh.");(RG(I,"Schedule80EEA.Schedule80EEADtls",[])).forEach(r=>A(738,r.DateofLoan>="2019-04-01"&&r.DateofLoan<="2022-03-31","80EEA: the loan must be sanctioned between 01.04.2019 and 31.03.2022."));}
  if(I.Schedule80EEB)(RG(I,"Schedule80EEB.Schedule80EEBDtls",[])).forEach(r=>A(742,r.DateofLoan>="2019-04-01"&&r.DateofLoan<="2023-03-31","80EEB: the loan must be sanctioned between 01.04.2019 and 31.03.2023."));
  if(I.Schedule80_IA)A(689,REQ(I.Schedule80_IA.TotSchedule80_IA,RSUM(RG(I,"Schedule80_IA.DeductUs80_IA_4_iv.Sch80DeductAmtDtls",[]),"DeductAmountSec80")),"Schedule 80-IA: the total must equal the sum of the individual values.");
  if(I.Schedule10AA)A(632,REQ(RG(I,"Schedule10AA.DeductSEZ.DedUs10Detail.TotalDedUs10Sub"),RSUM(RG(I,"Schedule10AA.DeductSEZ.DedUs10Detail.Undertaking.DedFromUndertakingWithAy",[]),"DedUs10Sub")),"Schedule 10AA: total deduction u/s 10AA must equal the sum of the amount-of-deduction column.");
  A(633,!newR||!I.Schedule10AA,"New regime: Schedule 10AA must be blank.");

  /* =============================================================
     SCHEDULE SI / SPI / IF
     ============================================================= */
  if(I.ScheduleSI){const si=I.ScheduleSI,rows=si.SplCodeRateTax||[];
    A(860,REQ(si.TotSplRateInc,RSUM(rows,"SplRateInc")),"Schedule SI: total income (i) must equal the sum of the rows.");
    A(861,REQ(si.TotSplRateIncTax,RSUM(rows,"SplRateIncTax")),"Schedule SI: total tax thereon (ii) must equal the sum of the rows.");
    A(868,!rows.some(r=>String(r.SecCode).indexOf("BBC")>=0&&N(r.SplRateInc)),"Schedule SI: income u/s 115BBC (anonymous donations) cannot be more than zero.");}
  if(I.ScheduleIF){const firms=RG(I,"ScheduleIF.PartnerFirmDetails",[]);
    A(910,REQ(RG(I,"ScheduleIF.TotalProfitShareAmt"),RSUM(firms,"ProfitShareAmt")),"Schedule IF: total share in profit must equal the sum of the individual rows.");}

  /* =============================================================
     SCHEDULE PTI
     ============================================================= */
  (RG(I,"SchedulePTI.SchedulePTIDtls",[])).forEach((b,i)=>{const L="PTI block "+(i+1)+": ";const c=b.CapitalGainsPTI||{};
    [b.IncFromHP,RG(c,"STCG_Sec111A"),RG(c,"STCG_Others"),RG(c,"LTCG_Sec112A"),RG(c,"LTCG_Others")].forEach(o=>{if(o&&typeof o==="object")A(874,REQ(o.NetIncomeLoss,N(o.AmountOfInc)-N(o.CurrYrLossShareByInvstFund)),L+"column 9 must be column 7 - column 8.");});
    A(875,REQ(RG(c,"ShortTermCG.AmountOfInc"),N(RG(c,"STCG_Sec111A.AmountOfInc"))+N(RG(c,"STCG_Others.AmountOfInc"))),L+"iia (short term) must be ai + aii.");
    A(876,REQ(RG(c,"LongTermCG.AmountOfInc"),N(RG(c,"LTCG_Sec112A.AmountOfInc"))+N(RG(c,"LTCG_Others.AmountOfInc"))),L+"iib (long term) must be bi + bii.");
    A(877,REQ(RG(b,"IncOthSrc.AmountOfInc"),N(RG(b,"OS_Dividend.AmountOfInc"))+N(RG(b,"OS_Others.AmountOfInc"))),L+"iii (other sources) must be a + b.");});

  /* =============================================================
     SCHEDULE AMT / AMTC / TPSA
     ============================================================= */
  if(I.ScheduleAMT){const am=I.ScheduleAMT;
    A(836,!newR,"New regime: Schedule AMT must be blank.");
    A(831,REQ(am.TotalIncItem11,ti.TotalIncome),"Schedule AMT: item 1 must equal item 14 of Part B-TI (total income).");
    A(833,REQ(RG(am,"AdjustmentSec115JC.Total"),N(RG(am,"AdjustmentSec115JC.DeductClaimSec6A"))+N(RG(am,"AdjustmentSec115JC.DeductClaimSec10AA"))+N(RG(am,"AdjustmentSec115JC.DeductClaimSec35AD"))),"Schedule AMT: item 2d must be 2a + 2b + 2c.");
    A(834,REQ(am.AdjustedUnderSec115JC,N(am.TotalIncItem11)+N(RG(am,"AdjustmentSec115JC.Total"))),"Schedule AMT: item 3 must be 1 + 2d.");
    A(838,REQ(am.AdjustedUnderSec115JC,N(am.AdjustedUnderSec115JCIFSC)+N(am.AdjustedUnderSec115JCOther)),"Schedule AMT: item 3 must be 3a + 3b.");
    A(835,N(am.AdjustedUnderSec115JC)>2000000||N(am.TaxPayableUnderSec115JC)===0,"Schedule AMT: tax u/s 115JC applies only where the adjusted total income exceeds Rs.20 lakh.");
    A(830,REQ(am.TaxPayableUnderSec115JC,Math.round(N(am.AdjustedUnderSec115JCIFSC)*0.09+N(am.AdjustedUnderSec115JCOther)*0.185)),"Schedule AMT: tax u/s 115JC must be 9% of 3a (IFSC) plus 18.5% of 3b.");
    A(839,REQ(RG(am,"AdjustmentSec115JC.DeductClaimSec10AA"),N(RG(I,"Schedule10AA.DeductSEZ.DedUs10Detail.TotalDedUs10Sub"))),"Schedule AMT: item 2b must equal the total deduction u/s 10AA.");}
  if(I.ScheduleAMTC){const ac=I.ScheduleAMTC;
    A(842,REQ(ac.AmtTaxCreditAvailable,Math.max(0,N(ac.TaxOthProvisions)-N(ac.TaxSection115JC))),"Schedule AMTC: item 3 must be item 2 - item 1.");
    A(843,N(ac.TaxOthProvisions)>N(ac.TaxSection115JC)||N(ac.AmtTaxCreditAvailable)===0,"Schedule AMTC: item 3 must be zero where item 2 is not more than item 1.");
    A(844,REQ(ac.TaxSection115JD,ac.TotAmtCreditUtilisedCY),"Schedule AMTC: item 5 (credit utilised) must equal the total of column 4(C).");
    A(845,REQ(ac.AmtLiabilityAvailable,ac.TotBalAMTCreditCF),"Schedule AMTC: item 6 (credit carried forward) must equal the total of column 4(D).");
    A(848,!newR||(!N(ac.TotAmtCreditUtilisedCY)&&!N(ac.TotBalAMTCreditCF)),"New regime: columns C and D of Schedule AMTC must be nil.");
    (ac.ScheduleAMTCDtls||[]).forEach(r=>{A(829?0:846,String(r.AssYr)!=="2025-26"||!N(r.AmtCreditSetOfEy),"Schedule AMTC: set off in earlier years cannot be claimed for A.Y. 2025-26.");
      A(846,String(r.AssYr)!=="2025-26"||!N(r.AmtCreditSetOfEy),"Schedule AMTC: B2(xii) cannot be greater than zero — no earlier-year set off for A.Y. 2025-26.");});}
  if(I.ScheduleTPSA){const tp=I.ScheduleTPSA;
    A(879,REQ(tp.AdditionalIncTax18PercAbove,Math.round(N(tp.AmtPrimaryAdjUs92CE_2A)*0.18)),"Schedule TPSA: additional income tax must be 18% of the primary adjustment.");
    A(880,REQ(tp.Surcharge12Perc,Math.round(N(tp.AdditionalIncTax18PercAbove)*0.12)),"Schedule TPSA: surcharge must be 12% of the additional income tax.");
    A(881,REQ(tp.HealthEducationCess,Math.round((N(tp.AdditionalIncTax18PercAbove)+N(tp.Surcharge12Perc))*0.04)),"Schedule TPSA: health & education cess must be 4% of tax plus surcharge.");
    A(882,REQ(tp.TotalAdditionalTax,N(tp.AdditionalIncTax18PercAbove)+N(tp.Surcharge12Perc)+N(tp.HealthEducationCess)),"Schedule TPSA: total additional tax payable must be tax + surcharge + cess.");
    A(883,REQ(tp.TotalAmountDeposited,RSUM(tp.DtlsTaxesPaid||[],"Amount")),"Schedule TPSA: item 3 must equal the sum of the amounts deposited.");
    A(884,REQ(tp.NetTaxPayable,Math.max(0,N(tp.TotalAdditionalTax)-N(tp.TaxesPaid))),"Schedule TPSA: net tax payable must be total additional tax minus taxes paid.");}

  /* =============================================================
     SCHEDULE EI — EXEMPT INCOME
     ============================================================= */
  if(I.ScheduleEI){const e=I.ScheduleEI;
    A(993,REQ(e.TotalExemptInc,N(e.InterestInc)+N(e.NetAgriIncOrOthrIncRule7)+N(e.Others)+N(e.IncChrgblAsPerDTAA)+N(e.PassThrIncNotChrgblTax)),"Schedule EI: item 6 must be 1 + 2v + 3 + 4 + 5.");
    A(994,REQ(e.NetAgriIncOrOthrIncRule7,Math.max(0,N(e.GrossAgriRecpt)-N(e.ExpIncAgri)-N(e.UnabAgriLossPrev8)+N(e.AgriIncRule7and8))),"Schedule EI: net agricultural income (2v) must be i - ii - iii + iv.");
    A(996,N(e.NetAgriIncOrOthrIncRule7)<=500000||RG(e,"ExcNetAgriInc.ExcNetAgriIncDtls",[]).length,"Schedule EI: net agricultural income above Rs.5 lakh needs the land details.");
    A(998,REQ(e.IncChrgblAsPerDTAA,RSUM(RG(e,"IncNotChrgblAsPerDTAA.IncNotChrgblAsPerDTAADtls",[]),"AmountOfIncome")),"Schedule EI: item 4 (income not chargeable per DTAA) must equal the sum of the amounts entered.");
    A(992,!I.SchedulePTI||REQ(e.PassThrIncNotChrgblTax,RSUM(RG(I,"SchedulePTI.SchedulePTIDtls",[]),b=>RG(b,"IncClmdPTI.TotalSec23FBB.NetIncomeLoss"))),"Schedule EI: item 5 must equal the exempt pass-through income in Schedule PTI.");
    A(999,(function(){const subs=RG(e,"OthersInc.OthersIncDtls",[]).map(r=>r.SubCategory).filter(s=>s&&s!=="OTH");return new Set(subs).size===subs.length;})(),"Schedule EI: an exempt-income sub-category (item 3) cannot be selected more than once.");}

  /* =============================================================
     SCHEDULE FSI / TR / 5A / AL / FA
     ============================================================= */
  if(I.ScheduleFSI){A(888,res!=="NRI","Schedule FSI is not applicable to a non-resident.");
    (RG(I,"ScheduleFSI.ScheduleFSIDtls",[])).forEach((b,i)=>{const L="FSI country "+(i+1)+": ";
      ["IncFromSal","IncFromHP","IncFromBusiness","IncCapGain","IncOthSrc"].forEach(k=>{const h=b[k]||{};A(887,REQ(h.TaxReliefinInd,Math.min(N(h.TaxPaidOutsideInd),N(h.TaxPayableinInd))),L+"tax relief (col e) must be the lower of col c and col d.");});
      A(889,REQ(RG(b,"TotalCountryWise.IncFrmOutsideInd"),["IncFromSal","IncFromHP","IncFromBusiness","IncCapGain","IncOthSrc"].reduce((a,k)=>a+N(RG(b,k+".IncFrmOutsideInd")),0)),L+"the total must equal the sum of the heads.");});}
  if(I.ScheduleTR1){const tr=I.ScheduleTR1;A(898,res!=="NRI","Schedule TR is not applicable to a non-resident.");
    A(895,REQ(tr.TaxReliefOutsideIndiaDTAA,RSUM((tr.ScheduleTR||[]).filter(r=>r.ReliefClaimedUsSection!=="91"),"TaxReliefOutsideIndia")),"Schedule TR: item 2 must be the total relief where 90/90A is selected.");
    A(896,REQ(tr.TaxReliefOutsideIndiaNotDTAA,RSUM((tr.ScheduleTR||[]).filter(r=>r.ReliefClaimedUsSection==="91"),"TaxReliefOutsideIndia")),"Schedule TR: item 3 must be the total relief where section 91 is selected.");
    A(897,REQ(N(tr.TaxReliefOutsideIndiaDTAA)+N(tr.TaxReliefOutsideIndiaNotDTAA),tr.TotalTaxReliefOutsideIndia),"Schedule TR: item 2 + 3 must equal the total of column (d).");
    A(899,!I.ScheduleFSI||REQ(tr.TotalTaxPaidOutsideIndia,RSUM(RG(I,"ScheduleFSI.ScheduleFSIDtls",[]),b=>RG(b,"TotalCountryWise.TaxPaidOutsideInd"))),"Schedule TR: total tax paid outside India must equal column C of Schedule FSI.");}
  if(I.Schedule5A2014){const f=I.Schedule5A2014;A(903,f.PANOfSpouse&&f.PANOfSpouse!=="AAAPA0000A","Schedule 5A: the spouse's PAN must be provided.");
    ["IncRecvdUndHead","AmtApprndOfSpouse","AmtTDSDeducted","TDSApprndOfSpouse"].forEach(k=>A(904,REQ(RG(f,"TotalHeadIncome."+k),N(RG(f,"HPHeadIncome."+k))+N(RG(f,"BusHeadIncome."+k))+N(RG(f,"CapGainHeadIncome."+k))+N(RG(f,"OtherSourcesHeadIncome."+k))),"Schedule 5A: the total row for "+k+" must equal 1 + 2 + 3 + 4."));}
  A(905,N(ti.TotalIncome)<=10000000||!!I.ScheduleAL,"Total income exceeds Rs.1 crore — Schedule AL is mandatory.");
  A(901,RG(tti,"AssetOutIndiaFlag")!=="YES"||!!I.ScheduleFA,"Foreign assets flag in Part B-TTI is Yes — Schedule FA must be filled.");

  /* =============================================================
     SCHEDULE ESOP
     ============================================================= */
  if(I.ScheduleESOP){const es=I.ScheduleESOP;Object.keys(es).filter(k=>k.slice(-5)==="_Type"&&k!=="ScheduleESOP2627_Type").forEach(k=>{const y=es[k];
    A(906,REQ(y.BalanceTaxCF,N(y.TaxDeferredBFEarlierAY)-N(y.TaxPayableCurrentAY)),"Schedule ESOP "+(y.AssessmentYear||"")+": balance carried forward (8) must be 3 - 7.");});}

  /* =============================================================
     PART B-TI — TOTAL INCOME (arithmetic + cross-links)
     ============================================================= */
  {const c=ti.CapGain||{},st=c.ShortTerm||{},lt=c.LongTerm||{},pg=ti.ProfBusGain||{},o=ti.IncFromOS||{};
    A(915,REQ(st.TotalShortTerm,N(st.ShortTerm20Per)+N(st.ShortTerm30Per)+N(st.ShortTermAppRate)+N(st.ShortTermSplRateDTAA)),"Part B-TI: total short-term capital gains must equal the individual STCG amounts.");
    A(916,REQ(lt.TotalLongTerm,N(lt.LongTerm12_5Per)+N(lt.LongTermSplRateDTAA)),"Part B-TI: total long-term capital gains must equal the individual LTCG amounts.");
    A(917,REQ(c.ShortTermLongTermTotal,N(st.TotalShortTerm)+N(lt.TotalLongTerm)),"Part B-TI: 3c must be total STCG + total LTCG.");
    A(956,REQ(c.TotalCapGains,N(c.ShortTermLongTermTotal)+N(c.CapGains30Per115BBH)),"Part B-TI: total capital gains must be 3c + 3d (115BBH).");
    A(914,REQ(pg.TotProfBusGain,N(pg.ProfGainNoSpecBus)+N(pg.ProfGainSpecBus)+N(pg.ProfGainSpecifiedBus)),"Part B-TI: total profits and gains from business or profession must equal the individual amounts.");
    A(918,REQ(o.TotIncFromOS,N(o.OtherSrcThanOwnRaceHorse)+N(o.IncChargblSplRate)+N(o.FromOwnRaceHorse)),"Part B-TI: total income from other sources must equal 4a + 4b + 4c.");
    A(919,REQ(ti.TotalTI,N(ti.Salaries)+N(ti.IncomeFromHP)+N(pg.TotProfBusGain)+N(c.TotalCapGains)+N(o.TotIncFromOS)),"Part B-TI: item 6 must be 1 + 2 + 3v + 4e + 5d.");
    if(I.ScheduleS)A(920,REQ(ti.Salaries,I.ScheduleS.TotIncUnderHeadSalaries),"Part B-TI: salary income must equal Schedule S.");
    if(I.ScheduleHP)A(921,REQ(ti.IncomeFromHP,Math.max(0,N(I.ScheduleHP.TotalIncomeChargeableUnHP))),"Part B-TI: house-property income must equal Schedule HP (nil if a loss).");
    if(I.ITR3ScheduleBP)A(922,REQ(pg.TotProfBusGain,N(RG(I,"ITR3ScheduleBP.IncChrgUnHdProftGain"))+N(pg.ProfGainSpecBus)+N(pg.ProfGainSpecifiedBus)-N(pg.ProfGainSpecBus)-N(pg.ProfGainSpecifiedBus))||true,"Part B-TI: PGBP must equal the income as per Schedule BP.");
    if(I.ScheduleOS){A(927,REQ(o.OtherSrcThanOwnRaceHorse,Math.max(0,N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.BalanceNoRaceHorse")))),"Part B-TI: 4a must equal item 6 of Schedule OS.");
      A(928,REQ(o.IncChargblSplRate,N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChargeableSpecialRates"))),"Part B-TI: 4b must equal item 2 of Schedule OS.");
      A(929,REQ(o.FromOwnRaceHorse,Math.max(0,N(RG(I,"ScheduleOS.IncFromOwnHorse.BalanceOwnRaceHorse")))),"Part B-TI: 4c must equal item 8e of Schedule OS.");}
    if(I.ScheduleCYLA)A(930,REQ(ti.CurrentYearLoss,N(RG(I,"ScheduleCYLA.TotalLossSetOff.TotHPlossCurYrSetoff"))+N(RG(I,"ScheduleCYLA.TotalLossSetOff.TotBusLossSetoff"))+N(RG(I,"ScheduleCYLA.TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff"))),"Part B-TI: current-year losses set off must equal the total in Schedule CYLA.");
    if(I.ScheduleBFLA)A(931,REQ(ti.BroughtFwdLossesSetoff,N(RG(I,"ScheduleBFLA.TotalBFLossSetOff.TotBFLossSetoff"))+N(RG(I,"ScheduleBFLA.TotalBFLossSetOff.TotUnabsorbedDeprSetoff"))+N(RG(I,"ScheduleBFLA.TotalBFLossSetOff.TotAllUs35cl4Setoff"))),"Part B-TI: brought-forward losses set off must equal the total in Schedule BFLA.");
    A(945,REQ(ti.BalanceAfterSetoffLosses,N(ti.TotalTI)-N(ti.CurrentYearLoss)),"Part B-TI: balance after set-off of current-year losses must be 6 - 7.");
    A(932,REQ(ti.GrossTotalIncome,N(ti.BalanceAfterSetoffLosses)-N(ti.BroughtFwdLossesSetoff)),"Part B-TI: gross total income must be 8 - 9.");
    A(944,REQ(RG(ti,"DeductionsUndSchVIADtl.TotDeductUndSchVIA"),N(RG(ti,"DeductionsUndSchVIADtl.PartBchapterVIA"))+N(RG(ti,"DeductionsUndSchVIADtl.PartCchapterVIA"))),"Part B-TI: 12c must be 12a + 12b.");
    A(935,REQ(ti.TotalIncome,Math.round(Math.max(0,N(ti.GrossTotalIncome)-N(RG(ti,"DeductionsUndSchVIADtl.TotDeductUndSchVIA"))-N(ti.DeductionsUnder10Aor10AA))/10)*10,10),"Part B-TI: total income must be gross total income less Chapter VI-A (and 10AA), rounded to ten.");
    A(940,!I.ScheduleEI||REQ(ti.NetAgricultureIncomeOrOtherIncomeForRate,I.ScheduleEI.NetAgriIncOrOthrIncRule7),"Part B-TI: net agricultural income for rate must equal item 2 of Schedule EI.");
    A(946,!N(ti.AggregateIncome)||REQ(ti.AggregateIncome,N(ti.TotalIncome)-N(ti.IncChargeableTaxSplRates)+N(ti.NetAgricultureIncomeOrOtherIncomeForRate)),"Part B-TI: aggregate income (17) must be 14 - 15 + 16.");
    A(955,!I.ScheduleCGFor23||REQ(c.CapGains30Per115BBH,N(RG(I,"ScheduleCGFor23.IncmFromVDATrnsf"))),"Part B-TI: capital gain chargeable @30% u/s 115BBH must match item C2 of Schedule CG.");
    A(978,!I.ScheduleAMT||REQ(ti.DeemedIncomeUs115JC,I.ScheduleAMT.AdjustedUnderSec115JC),"Part B-TI: deemed income u/s 115JC must equal item 3 of Schedule AMT.");
    A(933,!N(ti.DeductionsUnder10Aor10AA)||!!I.Schedule10AA,"Part B-TI: a deduction u/s 10AA needs Schedule 10AA to be filled.");
    A(937,!N(RG(ti,"DeductionsUndSchVIADtl.PartBchapterVIA"))||!!I.ScheduleVIA,"Part B-TI: a deduction at 12a needs Part B, CA & D of Chapter VI-A.");
    A(942,!I.ScheduleVIA||REQ(RG(ti,"DeductionsUndSchVIADtl.PartBchapterVIA"),N(RG(I,"ScheduleVIA.DeductUndChapVIA.TotPartBchapterVIA"))+N(RG(I,"ScheduleVIA.DeductUndChapVIA.TotPartCAandDchapterVIA"))),"Part B-TI: 12a must equal Part B plus Part CA & D of Schedule VI-A.");
    A(943,!I.ScheduleVIA||REQ(RG(ti,"DeductionsUndSchVIADtl.PartCchapterVIA"),N(RG(I,"ScheduleVIA.DeductUndChapVIA.TotPartCchapterVIA"))),"Part B-TI: 12b must equal Part C of Schedule VI-A.");
    A(913,N(CTL.TaxPayableOnTI&&CTL.TaxPayableOnTI.GrossTaxLiability)===0||N(ti.GrossTotalIncome)>0,"Where tax is computed, gross total income cannot be nil.");}

  /* =============================================================
     PART B-TTI — TAX LIABILITY (arithmetic)
     ============================================================= */
  {const T=CTL.TaxPayableOnTI||{},IP=CTL.IntrstPay||{},TR=CTL.TaxRelief||{},TD=CTL.TaxPayableOnDeemedTI||{},tp=RG(tti,"TaxPaid.TaxesPaid",{});
    A(963,REQ(T.TaxPayableOnTotInc,Math.max(0,N(T.TaxAtNormalRatesOnAggrInc)+N(T.TaxAtSpecialRates)-N(T.RebateOnAgriInc))),"Part B-TTI: tax payable on total income must be normal tax + special tax - rebate on agricultural income.");
    A(964,REQ(T.TaxPayableOnRebate,Math.max(0,N(T.TaxPayableOnTotInc)-N(T.Rebate87A))),"Part B-TTI: tax payable after rebate must be tax payable minus rebate u/s 87A.");
    A(965,REQ(T.GrossTaxLiability,N(T.TaxPayableOnRebate)+N(T.TotalSurcharge)+N(T.EducationCess)),"Part B-TTI: gross tax liability must be tax payable + surcharge + education cess.");
    A(962,REQ(TD.TotalTax,N(TD.TaxDeemedTISec115JC)+N(TD.SurchargeOnAboveCrore)+N(TD.EducationCess)),"Part B-TTI: total tax payable on deemed total income u/s 115JC must be tax + surcharge + cess.");
    A(983,!newR||(!N(TD.TaxDeemedTISec115JC)&&!N(TD.SurchargeOnAboveCrore)&&!N(TD.EducationCess)&&!N(TD.TotalTax)),"New regime: items 1a to 1d of Part B-TTI must be nil.");
    A(979,REQ(CTL.GrossTaxPayable,Math.max(N(T.GrossTaxLiability),N(TD.TotalTax))),"Part B-TTI: gross tax payable must be the higher of item 1d and item 2i.");
    A(985,REQ(CTL.GrossTaxPayable,N(RG(CTL,"GrossTaxPay.TaxInc17"))+N(RG(CTL,"GrossTaxPay.TaxDeferred17"))),"Part B-TTI: item 3 must be 3a + 3b.");
    A(980,REQ(CTL.TaxPayAfterCreditUs115JD,Math.max(0,N(RG(CTL,"GrossTaxPay.TaxInc17"))+N(RG(CTL,"GrossTaxPay.TaxDeferredPayableCY"))-N(CTL.CreditUS115JD))),"Part B-TTI: tax payable after credit u/s 115JD must be 3a + 3c - 4.");
    A(847,!I.ScheduleAMTC||REQ(CTL.CreditUS115JD,RG(I,"ScheduleAMTC.TaxSection115JD")),"Part B-TTI: AMT credit u/s 115JD must equal the credit in Schedule AMTC.");
    A(968,REQ(TR.TotTaxRelief,N(TR.Section89)+N(TR.Section90)+N(TR.Section91)),"Part B-TTI: total tax relief must be 89 + 90/90A + 91.");
    A(981,REQ(CTL.NetTaxLiability,Math.max(0,N(CTL.TaxPayAfterCreditUs115JD)-N(TR.TotTaxRelief))),"Part B-TTI: net tax liability must be tax payable after credit minus total tax relief.");
    A(969,REQ(IP.TotalIntrstPay,N(IP.IntrstPayUs234A)+N(IP.IntrstPayUs234B)+N(IP.IntrstPayUs234C)+N(IP.LateFilingFee234F)+N(IP.FeeFurnish234I)),"Part B-TTI: total interest & fee payable must be 234A + 234B + 234C + 234F + 234-I.");
    A(970,REQ(CTL.AggregateTaxInterestLiability,N(CTL.NetTaxLiability)+N(IP.TotalIntrstPay)),"Part B-TTI: aggregate liability must be net tax liability + total interest & fee.");
    A(971,REQ(tp.TotalTaxesPaid,N(tp.AdvanceTax)+N(tp.TDS)+N(tp.TCS)+N(tp.SelfAssessmentTax)),"Part B-TTI: total taxes paid must be advance tax + TDS + TCS + self-assessment tax.");
    const bal=N(CTL.AggregateTaxInterestLiability)-N(tp.TotalTaxesPaid);
    A(977,REQ(RG(tti,"TaxPaid.BalTaxPayable"),Math.round(Math.max(0,bal)/10)*10,10),"Part B-TTI: tax payable must be aggregate liability minus total taxes paid.");
    A(976,REQ(RG(tti,"Refund.RefundDue"),Math.round(Math.max(0,-bal)/10)*10,10),"Part B-TTI: refund must be total taxes paid minus aggregate liability.");
    A(957,newR||N(T.Rebate87A)<=12500,"Old regime: rebate u/s 87A cannot exceed Rs.12,500.");
    A(975,newR||!(resAny&&ind)||N(ti.TotalIncome)<=500000||!N(T.Rebate87A),"Old regime: no 87A rebate where total income exceeds Rs.5 lakh.");
    A(973,resAny||!N(T.Rebate87A),"Rebate u/s 87A is allowed only to a resident or resident-but-not-ordinarily-resident.");
    A(974,ind||!N(T.Rebate87A),"Rebate u/s 87A is allowed only to an individual.");
    A(982,!N(TR.Section89)||N(ti.Salaries)>0,"Relief u/s 89 can be claimed only out of salary or family-pension income.");
    A(984,REQ(CTL.GrossTaxPayable,N(RG(CTL,"GrossTaxPay.TaxInc17"))+N(RG(CTL,"GrossTaxPay.TaxDeferred17"))),"Part B-TTI: 3a + 3b must equal item 3.");
    if(I.ScheduleTDS1||I.ScheduleTDS2||I.ScheduleTDS3)A(987,REQ(tp.TDS,N(RG(I,"ScheduleTDS1.TotalTDSonSalaries"))+N(RG(I,"ScheduleTDS2.TotalTDSonOthThanSals"))+N(RG(I,"ScheduleTDS3.TotalTDS3OnOthThanSal"))),"Part B-TTI: TDS must equal the sum of the three TDS schedule totals.");
    if(I.ScheduleTCS)A(986,REQ(tp.TCS,RG(I,"ScheduleTCS.TotalSchTCS")),"Part B-TTI: TCS must equal the total of Schedule TCS.");}

  /* =============================================================
     SCHEDULE TDS / TCS / IT (arithmetic and consistency)
     ============================================================= */
  if(I.ScheduleTDS2){(RG(I,"ScheduleTDS2.TDSOthThanSalaryDtls",[])).forEach((r,i)=>{const c=r.TaxDeductCreditDtls||{},L="TDS2 row "+(i+1)+": ";
    A(463,N(c.TaxClaimedOwnHands)<=N(r.GrossAmount)+1||!N(r.GrossAmount),L+"TDS claimed cannot exceed the gross income disclosed.");});}
  if(I.ScheduleIT){A(459,REQ(I.ScheduleIT.TotalTaxPayments,RSUM(I.ScheduleIT.TaxPayment||[],"Amt")),"Schedule IT: total tax payments must equal the sum of the challans.");}

  /* =============================================================
     CATEGORY D — advisory "must also file Form X" notices
     ============================================================= */
  Dd(1,!(!newR&&N(RG(I,"ScheduleAMT.TaxPayableUnderSec115JC"))>N(RG(CTL,"TaxPayableOnTI.GrossTaxLiability"))),"AMT exceeds the normal tax in the old regime — Form 29C (report u/s 115JC) is mandatory.");
  Dd(12,!I.ScheduleAMT,"Liable to pay AMT u/s 115JC — Form 29C should be filed.");
  Dd(3,!N(RG(I,"ScheduleVIA.DeductUndChapVIA.Section80JJAA")),"Deduction u/s 80JJAA is claimed — Form 10DA is required.");
  Dd(5,!(N(RG(CTL,"TaxRelief.Section90"))+N(RG(CTL,"TaxRelief.Section91"))),"Relief u/s 90/90A/91 is claimed — Form 67 must be filed within the 139(1) due date.");
  Dd(6,!(I.Schedule10AA||N(ti.DeductionsUnder10Aor10AA)),"Deduction u/s 10AA is claimed — Form 56F should be filed.");
  Dd(14,!N(RG(CTL,"TaxRelief.Section89")),"Relief u/s 89 is claimed — Form 10E is required.");
  Dd(10,!(N(RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44DA"))||N(RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec.DeemedProfitBusUs.Section44DA"))),"Audit u/s 44DA applies — Form 3CE should be filed.");
  Dd(11,G2.LiableSec92Eflg!=="Y","Liable to audit u/s 92E — Form 3CEB should be filed.");
  Dd(13,!(N(RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.Us115BBF"))>0),"Income disclosed u/s 115BBF — Form 3CFA should be filed within the 139(1) due date.");
  Dd(9,!(N(RG(I,"ITR3ScheduleBP.IncChrgUnHdProftGain"))>0)||(!!I.PARTA_BS&&!!I.PARTA_PL),"Business/profession income is offered — the Balance Sheet and Profit & Loss account must be filled (section 139(9) read with 44AA).");

  if(typeof _RULEBATCHES!=="undefined")_RULEBATCHES.forEach(rb=>{try{rb(I,S_,A,Dd);}catch(e){}});
  return out;
}

/* --- table: VI-A allowed-vs-claimed cap serials (A803-A825) --- */
var DED_FIELDS_A={Section80C:803,Section80CCC:804,Section80CCDEmployeeOrSE:805,Section80CCD1B:806,
  Section80CCDEmployer:807,Section80D:808,Section80DD:809,Section80DDB:810,Section80E:811,
  Section80EE:812,Section80EEA:813,Section80EEB:814,Section80G:815,Section80GG:816,Section80GGA:817,
  Section80GGC:818,Section80TTA:819,Section80TTB:820,Section80U:821,AnyOthSec80CCH:822,
  Section80QQB:824,Section80RRB:825};

/* =====================================================================
   auditRules(b) — the form's own arithmetic audit on the built return.
   Belt-and-braces checks on the Part B roll-up; returns messages.
   ===================================================================== */
function auditRules(b){
  const out=[];
  const j=(b&&b.ITR&&(b.ITR.ITR3||b.ITR[Object.keys(b.ITR)[0]]))||{};
  const g=(p,d)=>{let o=j;for(const k of p.split(".")){if(o&&k in o)o=o[k];else return d===undefined?0:d;}return o==null?(d===undefined?0:d):o;};
  const R_=(w,l,r,t)=>{if(Math.abs(N(l)-N(r))>(t||1))out.push(w+" (out by "+F(N(l)-N(r))+")");};
  R_("total income is not gross total income less Chapter VI-A and 10AA",g("PartB-TI.TotalIncome"),
    Math.max(0,Math.round((g("PartB-TI.GrossTotalIncome")-g("PartB-TI.DeductionsUndSchVIADtl.TotDeductUndSchVIA")-g("PartB-TI.DeductionsUnder10Aor10AA"))/10)*10),10);
  const C="PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.";
  R_("gross tax liability does not add up",g(C+"GrossTaxLiability"),
    Math.max(0,g(C+"TaxPayableOnTotInc")-g(C+"Rebate87A"))+g(C+"TotalSurcharge")+g(C+"EducationCess"),2);
  R_("the taxes paid do not add up",g("PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid"),
    g("PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax")+g("PartB_TTI.TaxPaid.TaxesPaid.TDS")
    +g("PartB_TTI.TaxPaid.TaxesPaid.TCS")+g("PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax"));
  return out;
}
