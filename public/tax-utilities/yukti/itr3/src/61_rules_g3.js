/* =====================================================================
   ITR-3 · AY 2026-27 — Category-A validation rules, batch g3 (Phase 6).
   Encoded from each rule's text in books/ITR-3/rules.json (constitution
   rule 6). Registered via ruleset(); runRules() runs this with its own
   A/Dd collectors and the globals RG/RSUM/REQ/N/R/isNew in scope.
   Each A(n,cond,msg): cond is the assertion that HOLDS for a valid
   return; the rule fires when cond is false. All reads are guarded so
   nothing throws. Regime-conditional rules guard on isNew() (REGIME.md).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  var FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  var PI=RG(I,"PartA_GEN1.PersonalInfo",{})||{};
  var newR=(typeof isNew==="function")?isNew():(FS.OptOldRegimeCurrAY!=="Y");
  var res=FS.ResidentialStatus||"RES";
  var ti=RG(I,"PartB-TI",{})||{};

  /* =============================================================
     PART A — MANUFACTURING ACCOUNT
     ============================================================= */
  if(I.ManufacturingAccount){var ma=RG(I,"ManufacturingAccount.OpeningInventory",{});
    A(61,REQ(ma.OpngInvntryTotal,N(ma.OpngStckRawMat)+N(ma.OpngStckWrkinPrgrs)),"Manufacturing Account: total opening inventory (1Aiii) must equal 1Ai + 1Aii.");
  }

  /* =============================================================
     PART A — TRADING ACCOUNT  (+ its feed into the P&L)
     ============================================================= */
  if(I.TradingAccount){var tr=I.TradingAccount;
    A(73,REQ(tr.DirectExpenses,N(tr.CarriageInward)+N(tr.PowerAndFuel)+N(tr.DirectExpensesTotal)),"Trading Account: total direct expenses (8) must equal carriage inward + power & fuel + other direct expenses.");
    if(I.PARTA_PL)
      A(79,REQ(RG(I,"PARTA_PL.CreditsToPL.GrossProfitTrnsfFrmTrdAcc"),N(tr.GrossProfitFrmBusProf)+N(tr.IncomeIntradayTrd)+N(tr.IncomeFutureTrd)),"P&L: gross profit transferred from Trading Account (13) must equal 12 + 12b + 12d.");
  }

  /* =============================================================
     PART A — PROFIT & LOSS
     ============================================================= */
  if(I.PARTA_PL){var pl=I.PARTA_PL,bd=RG(pl,"BadDebtDtls",{}),ad=RG(pl,"PersumptiveInc44AD",{}),ada=RG(pl,"PersumptiveInc44ADA",{}),nb=RG(pl,"NoBooksOfAccPL",{});
    A(91,REQ(bd.BadDebt,Math.max(0,N(bd.BadDebtAmtDtlsTotal)+N(bd.OthersPANNotAvlblDtlTotal)+N(bd.OthersAmtLt1Lakh))),"P&L: total bad debt (47iv) must equal the sum of 47i + 47ii + 47iii (floored at 0).");
    A(139,REQ(bd.BadDebtAmtDtlsTotal,RSUM(RG(bd,"BadDebtAmtDtls",[]),"Amount")),"P&L: total of 47(i) must equal the sum of the individual bad-debt (with PAN/Aadhaar) rows.");
    A(101,N(ad.PersumptiveInc44AD8Per)>=Math.floor(0.08*(N(ad.GrsTotalTrnOverInCash)+N(ad.GrsTrnOverAnyOthMode)))-1,"P&L: 61(ii)(b) cannot be less than 8% of 61(iB) + 61(iC).");
    A(107,!(RG(pl,"NatOfBus44ADA",[]).length)||N(ada.TotPersumptiveInc44ADA)>0,"P&L: a business code u/s 44ADA is selected — presumptive income u/s 44ADA (62ii) must be declared.");
    A(126,REQ(nb.GrossReceipt,N(nb.GrsRcptAccPayeeOrBankMode)+N(nb.GrsRcptOtherMode)),"P&L: 64(i)a must equal 64(i)a1 + 64(i)a2.");
    A(133,N(pl.GrossProfit)<=N(pl.TurnverFrmSpecActivity)+1,"P&L: gross profit from speculative activity (65ii) cannot exceed turnover (65i).");
    (RG(pl,"NonResidentPLDetails",[])||[]).forEach(function(r,i){if(String(r.Section)==="44BBA")
      A(145,N(r.NetProfit)>=Math.floor(0.05*N(r.GrossReceipt))-1,"P&L 66: for section 44BBA, net profit cannot be less than 5% of gross receipts.");});
  }

  /* =============================================================
     PART A — OTHER INFORMATION (43B / ICDS cross-links)
     ============================================================= */
  if(I.PARTA_OI){var oi=I.PARTA_OI,a43=RG(oi,"AmtDisallUs43BPyNowAll.AmtUs43B",{});
    A(157,REQ(a43.TotAmtUs43b,N(a43.TaxDutyCesAmt)+N(a43.ContToEmpPFSFGF)+N(a43.EmpBonusComm)+N(a43.IntPayaleToFI)+N(a43.SumPayaleLoanBrToFinComp)+N(a43.IntPayaleToFISchBank)+N(a43.LeaveEncashPayable)+N(a43.RailwayAssetsPayable)+N(a43.MSEPayable)),"Part A-OI: 10i (total allowable u/s 43B) must equal the sum of 10a to 10h.");
    if(I.ScheduleICDS)
      A(151,REQ(oi.DecProOrIncLossUs145_2,RG(I,"ScheduleICDS.TotalNetAmtDetl.DecreaseInProfit")),"Part A-OI: 3b (decrease in profit as per ICDS u/s 145(2)) must equal the ICDS decrease total.");
  }

  /* =============================================================
     SCHEDULE S — SALARY  (10(10) single employer; HRA vs 80GG)
     ============================================================= */
  if(I.ScheduleS){var emps=I.ScheduleS.Salaries||[];
    A(175,emps.filter(function(e){return RG(e,"Salarys.NatureOfSalary.OthersIncDtls",[]).some(function(x){return x.NatureDesc==="13"&&N(x.OthAmount);});}).length<=1,"Schedule S: exemption u/s 10(10) cannot be shown against more than one employer.");
    var al=RG(I,"ScheduleS.AllwncExemptUs10.AllwncExemptUs10Dtls",[]);
    var hra=RSUM(al.filter(function(a){return a.SalNatureDesc==="10(13A)";}),"SalOthAmount");
    A(192,!(hra>0&&N(RG(I,"ScheduleVIA.DeductUndChapVIA.Section80GG"))>0),"An exempt allowance u/s 10(13A) is claimed — deduction u/s 80GG cannot also be claimed.");
  }

  /* =============================================================
     SCHEDULE BP — BUSINESS OR PROFESSION
     ============================================================= */
  if(I.ITR3ScheduleBP){var P=RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec",{}),SB=RG(I,"ITR3ScheduleBP.SpecifiedBusinessInc",{});
    if(I.PARTA_PL)
      A(113,REQ(RG(P,"DeemedProfitBusUs.Section44ADA"),RG(I,"PARTA_PL.PersumptiveInc44ADA.TotPersumptiveInc44ADA")),"Schedule BP: 35(ii) (section 44ADA) must match 62(ii) presumptive income u/s 44ADA of Schedule P&L.");
    A(250,REQ(P.TotDeductionAmts,N(P.DeductUs32_1_iii)+N(P.DebPLUs35ExcessAmt)+N(P.AmtDisallUs40NowAllow)+N(P.AmtDisallUs43BNowAllow)+N(P.AnyOthAmtAllDeduct)+N(P.DecProfIncLossAccICDSAdj)),"Schedule BP: A33 must equal A(27+28+29+30+31+32).");
    if(I.PARTA_OI)
      A(260,REQ(P.AmtDisallUs43BNowAllow,RG(I,"PARTA_OI.AmtDisallUs43BPyNowAll.AmtUs43B.TotAmtUs43b")),"Schedule BP: A30 (amount disallowed u/s 43B in a preceding year, now allowable) must equal 10i of Part A-OI.");
    A(279,!N(SB.NetPLFrmSpecifiedBus)||RG(SB,"DedUs35ADSubSec5Dtls",[]).some(function(x){return x.DedUs35ADSubSec5;}),"Schedule BP: income/loss from a specified business is entered — the nature of the specified business (35AD sub-section (5) clause) must be selected.");
    if(I.ScheduleVDA)
      A(300,REQ(RG(P,"IncRecCredPLOthHeadDtls.115BBH"),RG(I,"ScheduleVDA.TotIncBusiness")),"Schedule BP: 3g (income u/s 115BBH) must match item A (total) of Schedule VDA.");
  }

  /* =============================================================
     SCHEDULE DPM / DOA / DEP / DCG — DEPRECIATION
     ============================================================= */
  if(I.ScheduleDPM){["Rate15","Rate30","Rate40","Rate45"].forEach(function(blk){var o=RG(I,"ScheduleDPM.PlantMachinery."+blk+".DepreciationDetail",{});if(!o||!Object.keys(o).length)return;
    A(307,REQ(o.NetAggregateDepreciation,Math.max(0,N(o.TotalDepreciation)-N(o.DepDisAllowUs38_2))),"Schedule DPM "+blk+": net aggregate depreciation (17) must be 15 - 16 (floored at 0).");});
  }
  if(I.ScheduleDOA){var DOABLK=[["Building.Rate5",5],["Building.Rate10",10],["Building.Rate40",40],["FurnitureFittings.Rate10",10],["IntangibleAssets.Rate25",25],["Ships.Rate20",20]];
    DOABLK.forEach(function(bk){var o=RG(I,"ScheduleDOA."+bk[0]+".DepreciationDetail",{});if(!o||!Object.keys(o).length)return;
      A(316,REQ(o.FullRateDeprAmt,Math.max(0,N(o.WDVFirstDay)+N(o.AdditionsGrThan180Days)-N(o.RealizationTotalPeriod))),"Schedule DOA "+bk[0]+": amount on which depreciation at full rate is allowed (6) must be 3 + 4 - 5 (floored at 0).");
      A(322,REQ(o.DepreciationAtFullRate,Math.round(N(o.FullRateDeprAmt)*bk[1]/100)),"Schedule DOA "+bk[0]+": depreciation at full rate (10) must match the block's depreciation rate.");});
  }
  if(I.ScheduleDEP&&I.ScheduleDOA){var b5=RG(I,"ScheduleDOA.Building.Rate5.DepreciationDetail",{});var dep5=N(RG(I,"ScheduleDEP.SummaryFromDeprSch.BuildingSummary.DeprBlockTot5Percent"));
    A(332,REQ(dep5,N(b5.NetAggregateDepreciation))||REQ(dep5,N(b5.ProportionateAggDepreciation)),"Schedule DEP: the 5% building block must equal Sl.No. 14 (or 15, as applicable) of the 5% building block in Schedule DOA.");
  }
  if(I.ScheduleDCG&&I.ScheduleDPM)
    A(341,REQ(RG(I,"ScheduleDCG.SummaryFromDeprSchCG.PlantMachinerySummaryCG.DeprBlockTot15Percent"),RG(I,"ScheduleDPM.PlantMachinery.Rate15.DepreciationDetail.CapGainUs50")),"Schedule DCG: 1a must equal Sl.No. 20i (capital gains u/s 50) of the 15% block of Schedule DPM.");

  /* =============================================================
     SCHEDULE ESR — EXPENDITURE ON SCIENTIFIC RESEARCH (regime)
     ============================================================= */
  if(I.ScheduleESR&&newR){["Section35_1_ii","Section35_1_iia","Section35_1_iii","Section35_2AA","Section35_CCC"].forEach(function(sc){
    A(354,N(RG(I,"ScheduleESR.DeductionUs35."+sc+".DeductUs35.AmtUs35Allowable"))<=0,"New regime: Schedule ESR column 3 (allowable) must be nil for section "+sc.replace("Section","").replace(/_/g,"(").replace(/$/,")")+".");});
  }

  /* =============================================================
     SCHEDULE CG — CAPITAL GAINS
     ============================================================= */
  if(I.ScheduleCGFor23){var cg=I.ScheduleCGFor23,so=RG(cg,"ShortTermCapGainFor23.SaleOnOtherAssets",{}),EL=RG(cg,"CurrYrLosses",{});
    A(378,REQ(so.FullValueConsdSec50CA,Math.max(N(so.FullValueConsdRecvUnqshr),N(so.FairMrktValueUnqshr))),"Schedule CG: A6(a)(ic) must be the higher of A6(a)(ia) and A6(a)(ib).");
    /* Table F (quarterly) for VDA @30% must tally with C2 */
    var vq=RG(cg,"AccruOrRecOfCG.VDATrnsfGainsUnder30Per.DateRange",{});
    A(440,REQ(N(vq.Upto15Of6)+N(vq.Upto15Of9)+N(vq.Up16Of9To15Of12)+N(vq.Up16Of12To15Of3)+N(vq.Up16Of3To31Of3),cg.IncmFromVDATrnsf),"Schedule CG: Table F Sl.No. 7 (quarterly VDA @30%) must total to C2.");
    /* Table E — loss set off claimed against an applicable-rate STCL cannot exceed the loss available */
    var lossAvail=N(RG(EL,"InLossSetOff.StclSetoffAppRate"));
    var lossUsed=["InStcg20Per","InStcg30Per","InStcgDTAARate","InLtcg12_5Per","InLtcgDTAARate"].reduce(function(a,k){return a+N(RG(EL,k+".StclSetoffAppRate"));},0);
    A(461,lossUsed<=lossAvail+1,"Schedule CG Table E: the applicable-rate STCL set off cannot exceed the loss available for set off.");
  }

  /* =============================================================
     SCHEDULE OS — OTHER SOURCES
     ============================================================= */
  if(I.ScheduleOS){var lq=RG(I,"ScheduleOS.IncFrmLottery.DateRange",{});
    A(527,REQ(N(lq.Upto15Of6)+N(lq.Up16Of6To15Of9)+N(lq.Up16Of9To15Of12)+N(lq.Up16Of12To15Of3)+N(lq.Up16Of3To31Of3),RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.LtryPzzlChrgblUs115BB")),"Schedule OS: the quarterly break-up of winnings (item 10) must equal 2a(i) — winnings chargeable u/s 115BB.");
  }

  /* =============================================================
     SCHEDULE CYLA / BFLA / CFL — SET-OFF AND CARRY-FORWARD
     ============================================================= */
  if(I.ScheduleCYLA&&I.ScheduleCGFor23)
    A(583,REQ(RG(I,"ScheduleCYLA.LTCG12_5Per.IncCYLA.IncOfCurYrUnderThatHead"),RG(I,"ScheduleCGFor23.CurrYrLosses.InLtcg12_5Per.CurrYrCapGain")),"Schedule CYLA: LTCG taxable @12.5% must equal Sl.No. 8vi of Table E of Schedule CG.");
  if(I.ScheduleBFLA){
    if(I.ITR3ScheduleUD)
      A(592,REQ(RG(I,"ScheduleBFLA.TotalBFLossSetOff.TotUnabsorbedDeprSetoff"),RG(I,"ITR3ScheduleUD.TotCurYrdepritSetoffInc")),"Schedule BFLA: the brought-forward depreciation set off must match the amount set off in Schedule UD.");
    if(I.ScheduleCFL){var adj=RG(I,"ScheduleCFL.AdjTotBFLossInBFLA.LossSummaryDetail",{});
      A(605,REQ(RG(I,"ScheduleBFLA.TotalBFLossSetOff.TotBFLossSetoff"),N(adj.TotalHPPTILossCF)+N(adj.BusLossOthThanSpecLossCF)+N(adj.LossFrmSpecBusCF)+N(adj.LossFrmSpecifiedBusCF)+N(adj.TotalSTCGPTILossCF)+N(adj.TotalLTCGPTILossCF)+N(adj.OthSrcLossRaceHorseCF)),"Schedule BFLA: 2xiii (total BF loss set off) must equal the total adjusted in BFLA (10xviii) of Schedule CFL.");}
  }
  if(I.ScheduleCFL&&!newR){["LossCFFromPrevYrToAY","LossCFCurrentAssmntYear","LossCFCurrentAssmntYear2021","LossCFCurrentAssmntYear2022","LossCFCurrentAssmntYear2023","LossCFCurrentAssmntYear2024","LossCFCurrentAssmntYear2025","LossCFCurrentAssmntYear2026"].forEach(function(nd){
    A(620,N(RG(I,"ScheduleCFL."+nd+".CarryFwdLossDetail.AdjustAccTax115BACAmt"))<=0,"Old regime: Schedule CFL 5b (amount adjusted on account of opting for 115BAC) must not be more than zero.");});
  }

  /* =============================================================
     SCHEDULE UD — UNABSORBED DEPRECIATION (column totals)
     ============================================================= */
  if(I.ITR3ScheduleUD){var ud=I.ITR3ScheduleUD,rows=ud.ScheduleUD||[];
    A(628,REQ(ud.TotBFUDepritAmt,RSUM(rows,"AmtBFUD"))&&REQ(ud.TotCurYrdepritSetoffInc,RSUM(rows,"AmtDeprSOCY"))&&REQ(ud.TotDepritBalCFNY,RSUM(rows,"BalCFNY"))&&REQ(ud.TotBFUAllowAmt,RSUM(rows,"AmtBFUAllow"))&&REQ(ud.TotCurYrAllowSetoffInc,RSUM(rows,"AmtAllowSOCY"))&&REQ(ud.TotalBalCFNY,RSUM(rows,"AllowBalCFNY")),"Schedule UD: each column total (3 to 8) must equal the sum of its individual rows.");
  }

  /* =============================================================
     DEDUCTIONS — 80G / 80GGC / 80DD / 80D
     ============================================================= */
  if(I.Schedule80G){var g=I.Schedule80G;
    ["Don100Percent","Don50PercentNoApprReqd","Don100PercentApprReqd","Don50PercentApprReqd"].forEach(function(cat){
      (RG(g,cat+".DoneeWithPan",[])||[]).forEach(function(d){
        A(638,N(d.DonationAmtCash)<=2000||N(d.EligibleDonationAmt)<=N(d.DonationAmtOtherMode)+1,"Schedule 80G: a cash donation above Rs.2,000 to a single donee PAN is not eligible for deduction.");});
    });
  }
  if(I.Schedule80GGC)
    A(657,REQ(I.Schedule80GGC.TotalDonationAmtOtherMode80GGC,RSUM(RG(I,"Schedule80GGC.Schedule80GGCDetails",[]),"DonationAmtOtherMode")),"Schedule 80GGC: contribution in other mode (B) must equal the sum of column iv.");
  if(I.Schedule80DD)
    A(674,!N(I.Schedule80DD.DeductionAmount)||!!I.Schedule80DD.NatureOfDisability,"Schedule 80DD: a deduction is claimed — the details (nature of disability / dependent) are required.");
  if(I.Schedule80D){var d80=RG(I,"Schedule80D.Sec80DSelfFamSrCtznHealth",{});
    A(712,!N(d80.SelfAndFamilySeniorCitizen)||d80.SeniorCitizenFlag==="Y","Schedule 80D: 1b (Self & Family incl. Senior Citizen) can be claimed only when the senior-citizen dropdown (1) is Yes.");
    var selfD=RG(d80,"Sec80DSelfFamHIDtls.Sch80DInsDtls",[]),parD=RG(d80,"Sec80DParentsHIDtls.Sch80DInsDtls",[]);
    A(719,REQ(RSUM(selfD,"HealthInsAmt"),d80.HealthInsPremSlfFam)&&REQ(RSUM(parD,"HealthInsAmt"),d80.HlthInsPremParents),"Schedule 80D: the health-insurance detail rows must total to the health-insurance premium entered.");
    A(725,!(N(d80.HealthInsPremSlfFam)>0)||selfD.every(function(r){return r.InsurerName&&r.PolicyNo;}),"Schedule 80D: name of insurer and policy number are required to claim the health-insurance deduction.");
  }

  /* =============================================================
     SCHEDULE AMT
     ============================================================= */
  if(I.ScheduleAMT&&I.ScheduleVIA)
    A(832,REQ(RG(I,"ScheduleAMT.AdjustmentSec115JC.DeductClaimSec6A"),RG(I,"ScheduleVIA.DeductUndChapVIA.TotPartCchapterVIA")),"Schedule AMT: 2a must equal the system-computed Part C deductions of Schedule VI-A.");

  /* =============================================================
     SCHEDULE SI — SPECIAL-RATE INCOME
     ============================================================= */
  if(I.ScheduleSI){var SIEXC={"1":1,"1A":1,"2A":1,"5Ea":1,"5Eb":1,"DTAAOS":1,"DTAASTCG":1,"DTAALTCG":1,"PTI_LTCG12_5P112A":1};
    (I.ScheduleSI.SplCodeRateTax||[]).forEach(function(r){
      A(857,N(r.SplRateInc)<=0||N(r.SplRateIncTax)>0||SIEXC[r.SecCode],"Schedule SI: tax computed cannot be nil where income is greater than zero (row "+(r.SecCode||"")+").");});
  }

  /* =============================================================
     PART B-TI — cross-checks with Table E of Schedule CG
     ============================================================= */
  if(I.ScheduleCGFor23){
    A(924,REQ(RG(ti,"CapGain.ShortTerm.ShortTermAppRate"),RG(I,"ScheduleCGFor23.CurrYrLosses.InStcgAppRate.CurrYrCapGain")),"Part B-TI: short-term gain chargeable at applicable rate must equal Sl.No. 8iv of Table E of Schedule CG.");
    A(958,REQ(RG(ti,"CapGain.ShortTerm.ShortTerm20Per"),RG(I,"ScheduleCGFor23.CurrYrLosses.InStcg20Per.CurrYrCapGain")),"Part B-TI: short-term gain chargeable @20% must equal Sl.No. 8ii of Table E of Schedule CG.");
  }

  /* =============================================================
     SCHEDULE EI — EXEMPT INCOME (regime)
     ============================================================= */
  if(I.ScheduleEI&&newR)
    A(997,!RG(I,"ScheduleEI.OthersInc.OthersIncDtls",[]).some(function(x){return x.SubCategory==="10(17)";}),"New regime: exempt income u/s 10(17) (allowance of MP/MLA/MLC) cannot be claimed.");
});
