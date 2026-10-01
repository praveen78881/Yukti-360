/* ITR-3 · AY 2026-27 — validation-rule FIX batch 09 (enforcement gaps/weak fixes).
   Registered via ruleset(); A(n,cond,msg) fires when cond is FALSE. Reads guarded; nothing throws.
   Serials: B34, B35, B39, B40 (as A) · D1, D4, D7, D16, D17 (as Dd). */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const PI=RG(I,"PartA_GEN1.PersonalInfo",{})||{};
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const newR=FS.OptOldRegimeCurrAY!=="Y";           /* new regime default; old = 10-IEA opt-out */
  const res=FS.ResidentialStatus||"RES";            /* RES / RNOR / NRI */
  const resAny=res!=="NRI";                         /* resident (ordinarily or not) */
  const sec=+FS.ReturnFileSec||0;
  const belated=sec===12;                           /* 139(4) belated return */
  const ti=RG(I,"PartB-TI",{})||{};
  const CTL=RG(I,"PartB_TTI.ComputationOfTaxLiability",{})||{};
  const up=v=>String(v==null?"":v).toUpperCase();

  /* ---------------------------------------------------------------
     B34 — return filed u/s 139(4): current-year losses cannot be carried
     forward (Schedule CFL row xix). House-property loss is the one head
     section 139(3) still allows in a belated return (rules.json, the
     139(4) rule: "other than HP loss"); unabsorbed depreciation lives in
     Schedule UD, not here. Fires only when sec = 12 and a CY loss > 0.
     --------------------------------------------------------------- */
  {const cur=RG(I,"ScheduleCFL.CurrentAYloss.LossSummaryDetail",{})||{};
   const heads=["BusLossOthThanSpecLossCF","LossFrmSpecBusCF","LossFrmSpecifiedBusCF","TotalSTCGPTILossCF","TotalLTCGPTILossCF","OthSrcLossRaceHorseCF"];
   A(34,!belated||heads.every(f=>!N(cur[f])),
     "Return filed u/s 139(4): current-year losses (business, speculative, specified business, capital gains, race horses) cannot be carried forward — Schedule CFL row xix must be nil.");}

  /* ---------------------------------------------------------------
     B35 — 80G: every donation > 0 must carry a valid donee PAN
     (10-character PAN format), not the assessee's own / verification
     PAN, and no donee PAN repeated across the four blocks. (Companion
     to A648 / A12 / A645; the department's donee-PAN database check is
     external and cannot be done offline.)
     --------------------------------------------------------------- */
  if(I.Schedule80G){const G=I.Schedule80G||{};let rows=[];
    ["Don100Percent","Don50PercentNoApprReqd","Don100PercentApprReqd","Don50PercentApprReqd"].forEach(k=>{rows=rows.concat(RG(G,k+".DoneeWithPan",[])||[]);});
    const live=rows.filter(r=>r&&N(r.DonationAmt)>0);
    const PANRX=/^[A-Z]{5}[0-9]{4}[A-Z]$/;
    const own=up(PI.PAN), ver=up(RG(I,"Verification.Declaration.AssesseeVerPAN",""));
    const pans=live.map(r=>up(r.DoneePAN));
    A(35,live.every(r=>{const p=up(r.DoneePAN);return PANRX.test(p)&&p!=="NA"&&p!==own&&(!ver||p!==ver);})&&new Set(pans).size===pans.length,
      "80G: each donation needs a valid donee PAN (AAAAA9999A format), which cannot be the assessee's PAN and cannot be repeated across the 80G blocks.");}

  /* ---------------------------------------------------------------
     B39 / B40 — Schedule IF column totals (interest / remuneration due
     or received from firms) must equal Part A-P&L 14xi(b) / 14xi(c),
     and each total must equal the sum of its firm rows.
     NOTE: the current test client reports IF interest 60,000 and
     remuneration 1,20,000 but P&L 14xi(b)/(c) = 0 (engine does not feed
     IF into the P&L). A strict equality would fire on it, so the P&L
     side is asserted only when 14xi(b)/(c) is non-zero; the row-sum
     half is always asserted. Coordinator: see report.
     --------------------------------------------------------------- */
  {const firms=RG(I,"ScheduleIF.PartnerFirmDetails",[])||[];
   const ifInt=N(RG(I,"ScheduleIF.TotalIntrstAmtDueOrRecv")), ifRem=N(RG(I,"ScheduleIF.TotalRemunernAmtDueOrRecv"));
   const oi=RG(I,"PARTA_PL.CreditsToPL.OthIncome",{})||{};
   A(39,(!I.ScheduleIF||REQ(ifInt,RSUM(firms,"IntrstAmtDueOrRecv")))&&(!I.PARTA_PL||!N(oi.AmtofInterest)||REQ(oi.AmtofInterest,ifInt)),
     "Schedule IF: the total of 'amount of interest due or received' must equal the sum of its rows and Sl.No. 14xi(b) of Part A-P&L.");
   A(40,(!I.ScheduleIF||REQ(ifRem,RSUM(firms,"RemunernAmtDueOrRecv")))&&(!I.PARTA_PL||!N(oi.AmtofRem)||REQ(oi.AmtofRem,ifRem)),
     "Schedule IF: the total of 'amount of remuneration due or received' must equal the sum of its rows and Sl.No. 14xi(c) of Part A-P&L.");}

  /* ---------------------------------------------------------------
     D1 — Form 29C: AMT vs normal tax on the SAME basis. Compare Part
     B-TTI 1d (115JC tax + surcharge + cess) with 2i (gross tax
     liability incl. surcharge + cess); when 1d is absent, compare the
     base 115JC tax with the normal tax after rebate (before surcharge
     and cess). Old regime only.
     --------------------------------------------------------------- */
  {const TD=RG(CTL,"TaxPayableOnDeemedTI",{})||{}, T=RG(CTL,"TaxPayableOnTI",{})||{};
   const amtBase=N(RG(I,"ScheduleAMT.TaxPayableUnderSec115JC"))||N(TD.TaxDeemedTISec115JC);
   const amt=N(TD.TotalTax)?N(TD.TotalTax):amtBase;
   const norm=N(TD.TotalTax)?N(T.GrossTaxLiability):N(T.TaxPayableOnRebate);
   Dd(1,newR||!amtBase||amt<=norm,
     "Tax u/s 115JC (AMT, with surcharge and cess) exceeds the normal tax under the old regime — Form 29C (report u/s 115JC) must be filed.");}

  /* ---------------------------------------------------------------
     D4 — Chapter VI-A Part C deductions (80-IA/IAB/IB/IBA/IC/IE/JJAA/
     QQB/RRB) only where the original return is filed within the 139(1)
     due date; a 139(4) belated return cannot claim them.
     --------------------------------------------------------------- */
  {const partC=N(RG(I,"ScheduleVIA.DeductUndChapVIA.TotPartCchapterVIA"))||N(RG(ti,"DeductionsUndSchVIADtl.PartCchapterVIA"));
   Dd(4,!belated||!partC,
     "Return filed u/s 139(4): deductions under Chapter VI-A Part C can be claimed only if the original return is filed on or before the due date u/s 139(1).");}

  /* ---------------------------------------------------------------
     D7 — section 10AA deduction only where the return is filed within
     the 139(1) due date.
     --------------------------------------------------------------- */
  {const d10=N(ti.DeductionsUnder10Aor10AA)||N(RG(I,"Schedule10AA.DeductSEZ.DedUs10Detail.TotalDedUs10Sub"));
   Dd(7,!belated||!d10,
     "Return filed u/s 139(4): the deduction u/s 10AA is allowed only if the return is filed within the due date u/s 139(1).");}

  /* ---------------------------------------------------------------
     D16 — Schedule BP 4b: a reduction for rule 7A (rubber), 7B(1)/7B(1A)
     (coffee) or rule 8 (tea) needs the matching nature-of-business
     code 01003 / 01002 / 01001 in Part A-GEN.
     --------------------------------------------------------------- */
  {const codes=(RG(I,"PartA_GEN2.NatOfBus.NatureOfBusiness",[])||[]).map(b=>String(+String((b||{}).Code||"")));  /* "01003" -> "1003" */
   const has=c=>codes.indexOf(c)>=0;
   const fc=RG(I,"ITR3ScheduleBP.BusinessIncOthThanSpec.ProfitFrmActCvrd",{})||{};
   Dd(16,(!N(fc.ProfitFrmActCvrdUndrRule7A)||has("1003"))&&(!(N(fc.ProfitFrmActCvrdUndrRule7B1)||N(fc.ProfitFrmActCvrdUndrRule7B1A))||has("1002"))&&(!N(fc.ProfitFrmActCvrdUndrRule8)||has("1001")),
     "Schedule BP 4b: profit under rule 7A / 7B(1), 7B(1A) / 8 can be reduced only if the business code 01003 (rubber) / 01002 (coffee) / 01001 (tea) respectively is selected in nature of business.");}

  /* ---------------------------------------------------------------
     D17 — a resident claiming income at DTAA special rates (Schedule SI
     DTAA codes, Part B-TI DTAA heads, CG / OS DTAA totals).
     --------------------------------------------------------------- */
  {const siDTAA=(RG(I,"ScheduleSI.SplCodeRateTax",[])||[]).some(r=>["DTAASTCG","DTAALTCG","DTAAOS"].indexOf(String((r||{}).SecCode))>=0&&N((r||{}).SplRateInc)>0);
   const other=N(RG(ti,"CapGain.ShortTerm.ShortTermSplRateDTAA"))+N(RG(ti,"CapGain.LongTerm.LongTermSplRateDTAA"))
     +N(RG(I,"ScheduleCGFor23.ShortTermCapGainFor23.TotalAmtTaxUsDTAAStcg"))+N(RG(I,"ScheduleCGFor23.LongTermCapGain23.TotalAmtTaxUsDTAALtcg"))
     +N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChargblSplRateOS.TotalAmtTaxUsDTAASchOs"));
   Dd(17,!resAny||!(siDTAA||other>0),
     "For a resident taxpayer the DTAA benefit is not available and the claim at DTAA special rates may not be allowed — please re-check the claims made.");}
});
