/* ITR-3 · AY 2026-27 — validation-rule FIX batch 06 (enforcement gaps/weak fixes).
   Registered via ruleset(); A(n,cond,msg) fires when cond is FALSE. Reads guarded; nothing throws.
   Serials: 625 631 659 662 673 682 693 696 751 761 773 788 795 796 829 835 849 850 851 853. */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const PI=RG(I,"PartA_GEN1.PersonalInfo",{})||{};
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const newR=FS.OptOldRegimeCurrAY!=="Y";           /* new regime default; old = 10-IEA opt-out */
  const res=FS.ResidentialStatus||"RES";
  const ind=PI.Status==="I";
  const ti=RG(I,"PartB-TI",{})||{};
  const gti=N(ti.GrossTotalIncome);
  const U=RG(I,"ScheduleVIA.UsrDeductUndChapVIA",{})||{};
  const Dn=RG(I,"ScheduleVIA.DeductUndChapVIA",{})||{};
  const emps=RG(I,"ScheduleS.Salaries",[])||[];
  const PENS=["PE","PESG","PEPS","PEO"];              /* NatureOfEmployment pensioner codes (70_sec_sal.js) */
  const siRows=RG(I,"ScheduleSI.SplCodeRateTax",[])||[];
  const siInc=code=>RSUM(siRows.filter(r=>String((r||{}).SecCode)===code),"SplRateInc");
  const siTax=code=>RSUM(siRows.filter(r=>String((r||{}).SecCode)===code),"SplRateIncTax");
  const os=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};

  /* ---------- 625: Schedule UD — col 4 (set off in CY) <= col 3 - col 3a, every row ---------- */
  (RG(I,"ITR3ScheduleUD.ScheduleUD",[])||[]).forEach((r,i)=>{r=r||{};
    A(625,N(r.AmtDeprSOCY)<=Math.max(0,N(r.AmtBFUD)-N(r.AdjustAccTax115BACAmt)),
      "Schedule UD row "+(i+1)+": depreciation set off in the current year (4) cannot exceed the brought-forward amount (3) less the 115BAC adjustment (3a).");});

  /* ---------- 631: Schedule ICDS — Net Effect (5) = Increase (3) - Decrease (4), per ICDS row ---------- */
  if(I.ScheduleICDS&&typeof I.ScheduleICDS==="object"){
    Object.keys(I.ScheduleICDS).forEach(k=>{const b=I.ScheduleICDS[k];
      if(!b||typeof b!=="object"||k==="TotalNetAmtDetl")return;
      if(b.NetEffect==null&&b.IncreaseInProfit==null&&b.DecreaseInProfit==null)return;
      A(631,REQ(N(b.NetEffect),N(b.IncreaseInProfit)-N(b.DecreaseInProfit)),
        "Schedule ICDS ("+k+"): net effect (5) must equal increase in profit (3) less decrease in profit (4).");});
  }

  /* ---------- 659: Schedule 80GGC — GTI negative => eligible amount of donation (D) cannot exceed 0 ---------- */
  A(659,!I.Schedule80GGC||gti>=0||N(RG(I,"Schedule80GGC.TotalEligibleDonationAmt80GGC"))<=0,
    "Schedule 80GGC: when gross total income (Part B-TI) is negative, the eligible amount of donation (D) cannot be more than zero.");

  /* ---------- 662: Schedule 80GGC — cash contribution (iii) > 0 => other-mode details (iv-viii) are optional, never forbidden;
                the transaction details are required only for a contribution in other mode ---------- */
  (RG(I,"Schedule80GGC.Schedule80GGCDetails",[])||[]).forEach((r,i)=>{r=r||{};
    A(662,N(r.DonationAmtCash)>0||!N(r.DonationAmtOtherMode)||!!(r.TransactionRefNum||r.IFSCCode),
      "Schedule 80GGC row "+(i+1)+": the transaction reference / IFSC details are optional for a cash contribution but required for a contribution in other mode.");});

  /* ---------- 673: Schedule 80DD — i to iii mandatory and either iv (PAN) or v (Aadhaar) of the dependant ---------- */
  if(I.Schedule80DD&&typeof I.Schedule80DD==="object"){const x=I.Schedule80DD;
    const any=!!(x.NatureOfDisability||x.TypeOfDisability||N(x.DeductionAmount)||x.DependentType||x.DependentPan||x.DependentAadhaar||x.Form10IAFilingDate||x.Form10IAAckNum||x.UDIDNum);
    A(673,!any||(!!x.NatureOfDisability&&!!x.TypeOfDisability&&N(x.DeductionAmount)>0&&!!(x.DependentPan||x.DependentAadhaar)),
      "Schedule 80DD: nature of disability, type of disability and amount of deduction are mandatory, and either the PAN or the Aadhaar of the dependant must be given.");}

  /* ---------- 682: Form 10-IA must be filed separately for 80U and for 80DD ---------- */
  {const ddAck=String(RG(I,"Schedule80DD.Form10IAAckNum","")||""),uAck=String(RG(I,"Schedule80U.Form10IAAckNum","")||"");
    A(682,!(N(Dn.Section80DD)||N(RG(I,"Schedule80DD.DeductionAmount")))||!!ddAck,
      "80DD is claimed — the acknowledgement number of Form 10-IA filed for the dependant is mandatory in Schedule 80DD.");
    A(682,!(N(Dn.Section80U)||N(RG(I,"Schedule80U.DeductionAmount")))||!!uAck,
      "80U is claimed — the acknowledgement number of Form 10-IA filed for the assessee is mandatory in Schedule 80U.");
    A(682,!ddAck||!uAck||ddAck!==uAck,
      "Form 10-IA has to be filed separately for 80U and 80DD — the two acknowledgement numbers cannot be the same.");}

  /* ---------- 693: Schedule 80C — every row needs its amount and policy / document identification number ---------- */
  (RG(I,"Schedule80C.Schedule80CDtls",[])||[]).forEach((r,i)=>{r=r||{};const id=String(r.IdentificationNo||"").trim();
    A(693,N(r.Amount)>0&&!!id&&id.toUpperCase()!=="NA",
      "Schedule 80C row "+(i+1)+": the eligible amount and the policy number / document identification number are required to claim 80C.");});

  /* ---------- 696: new-regime individual — 80C/80E/80EE/80EEA/80EEB schedules AND the 10(13A) table must be blank ---------- */
  A(696,!(newR&&ind)||!(I.Schedule80C||I.Schedule80E||I.Schedule80EE||I.Schedule80EEA||I.Schedule80EEB||RG(I,"ScheduleS.Section10_13A",null)),
    "New regime individual: the 80C, 80E, 80EE, 80EEA, 80EEB schedules and the 10(13A) HRA table must not be filled.");

  /* ---------- 751: 80CCD(1) — old regime only; all employers pensioners => not more than 20% of GTI ---------- */
  {const cats=emps.map(e=>String((e||{}).NatureOfEmployment||""));
    const allPens=cats.length>0&&cats.every(c=>PENS.indexOf(c)>=0);
    const allNonPens=cats.length>0&&cats.every(c=>PENS.indexOf(c)<0);
    const ccd1=N(Dn.Section80CCDEmployeeOrSE);
    A(751,!ccd1||(!newR&&(!allPens||ccd1<=Math.round(Math.max(0,gti)*0.20)+1)),
      "80CCD(1) is available only in the old regime, and for a pensioner employer category it cannot exceed 20% of gross total income.");
    /* ---------- 773: all employers other than pensioners => 80CCD(1) not more than 10% of salary ---------- */
    A(773,!ccd1||!allNonPens||ccd1<=Math.round(N(RG(I,"ScheduleS.TotalGrossSalary"))*0.10)+1,
      "80CCD(1): where every employer category is other than a pensioner, the deduction cannot exceed 10% of salary.");}

  /* ---------- 761: 80GG — lower of 25% of adjusted gross total income and Rs.60,000 ---------- */
  {const gg=N(Dn.Section80GG);
    const agti=Math.max(0,gti-N(RG(ti,"CapGain.LongTerm.TotalLongTerm"))-N(RG(ti,"CapGain.ShortTerm.ShortTerm20Per"))-(N(Dn.TotalChapVIADeductions)-gg));
    A(761,!gg||gg<=Math.min(60000,Math.round(agti*0.25))+1,
      "80GG cannot exceed the lower of 25% of the adjusted gross total income and Rs.60,000.");}

  /* ---------- 788: 80RRB + 80QQB <= P&L item 15 (total credits) + Schedule OS 1e (any other income) ---------- */
  {const roy=N(Dn.Section80RRB)+N(Dn.Section80QQB);
    A(788,!roy||roy<=N(RG(I,"PARTA_PL.CreditsToPL.TotCreditsToPL"))+N(os.AnyOtherIncome)+1,
      "80RRB plus 80QQB cannot exceed the sum of item 15 of the P&L account and item 1e of Schedule OS.");}

  /* ---------- 795 / 796: 80CCH — Central Government employment, age, and the 60%-of-17(1) ceiling ---------- */
  {const sv=(S_&&S_.ded&&S_.ded.v)||null;
    const cch=(sv&&sv.c80cch!=null)?Math.min(N(sv.c80cch),N(Dn.AnyOthSec80CCH)):N(Dn.AnyOthSec80CCH);
    const s17_1=RSUM(emps,e=>RG(e,"Salarys.Salary"));
    const cgContrib=RSUM(emps,e=>RSUM((RG(e,"Salarys.NatureOfSalary.OthersIncDtls",[])||[]).filter(x=>String((x||{}).NatureDesc)==="17"),"OthAmount"));
    const dob=String(PI.DOB||"");let age=null;
    if(/^\d{4}-\d{2}-\d{2}$/.test(dob)){age=2026-(+dob.slice(0,4));if(dob.slice(5)>"03-31")age-=1;}
    /* 795: date of joining the armed forces is not in the schema, so the 17-27 window is checked as far as the return allows:
       the employer must be Central Government and the assessee cannot be under 17 at the end of the year. */
    A(795,!cch||(emps.some(e=>String((e||{}).NatureOfEmployment)==="CGOV")&&(age===null||age>=17)),
      "80CCH can be claimed only where the nature of employment is Central Government and the assessee joined the armed forces between 17 and 27 years of age.");
    A(796,!cch||cch<=Math.round(Math.max(0,s17_1-cgContrib)*0.60)+1,
      "80CCH is limited to 60% of salary u/s 17(1) other than the Central Government contribution to the Agnipath scheme (nature 17).");}

  /* ---------- 829 / 835: Schedule AMT ---------- */
  if(I.ScheduleAMT&&typeof I.ScheduleAMT==="object"){const am=I.ScheduleAMT;
    A(829,N(am.TotalIncItem11)>=0||N(RG(I,"ITR3ScheduleBP.SpecifiedBusinessInc.PLFrmSpecifiedBus"))<0,
      "Schedule AMT: total income (item 1) is negative — a loss in total income can arise only from the specified business u/s 35AD.");
    A(835,(N(am.AdjustedUnderSec115JC)>2000000&&N(RG(am,"AdjustmentSec115JC.Total"))>0)||N(am.TaxPayableUnderSec115JC)===0,
      "Schedule AMT: tax u/s 115JC (item 4) is computed only where the adjusted total income exceeds Rs.20 lakh and the adjustment (2d) is more than zero.");}

  /* ---------- 849 / 850: Schedule SI code 1 (accumulated balance of recognised PF) = Schedule OS 2c(iii) / 2c(iv) ---------- */
  {const pfInc=N(RG(os,"TaxAccumulatedBalRecPF.TotalIncomeBenefit")),pfTax=N(RG(os,"TaxAccumulatedBalRecPF.TotalTaxBenefit"));
    const hasPF=siRows.some(r=>String((r||{}).SecCode)==="1")||pfInc>0||pfTax>0;
    A(849,!hasPF||REQ(siInc("1"),pfInc),"Schedule SI: income (i) for tax on the accumulated balance of a recognised provident fund must equal item 2c(iii) (income benefit) of Schedule OS.");
    A(850,!hasPF||REQ(siTax("1"),pfTax),"Schedule SI: tax on the accumulated balance of a recognised provident fund must equal item 2c(iv) (tax benefit) of Schedule OS.");}

  /* ---------- 851: Schedule SI 115BB = Schedule OS 2a(i) less the DTAA income against 2a(i) ---------- */
  {const dtaa=RG(os,"IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS",[])||[];
    const dtaaBB=RSUM(dtaa.filter(r=>r&&String(r.NatureOfIncome)==="2ai"&&(res!=="NRI"||r.TaxRescertifiedFlag==="Y")),"DTAAamt");
    const exp=Math.max(0,N(os.LtryPzzlChrgblUs115BB)-dtaaBB);
    const hasBB=siRows.some(r=>String((r||{}).SecCode)==="5BB")||N(os.LtryPzzlChrgblUs115BB)>0;
    A(851,!hasBB||REQ(siInc("5BB"),exp),"Schedule SI: income u/s 115BB (winnings from lotteries, puzzles, races, card games etc.) must equal item 2a(i) of Schedule OS after reducing the corresponding DTAA income.");}

  /* ---------- 853: Schedule SI 115BBF (business/profession) = Schedule BP 3e ---------- */
  {const bp3e=N(RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.Us115BBF"));
    const hasBBF=siRows.some(r=>String((r||{}).SecCode)==="5BBF_BP")||bp3e>0;
    A(853,!hasBBF||REQ(siInc("5BBF_BP"),bp3e),"Schedule SI: income u/s 115BBF (income from patent under business or profession) must equal item 3e of Schedule BP.");}
});
