/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_17 (Phase 6).
   Serial range A813–A862 (Schedule 80G, Schedule 80GGA, Schedule 80-IA,
   Schedule 80-IB, Schedule 80-IC/80-IE, Schedule 10AA, Schedule IF and
   Schedule VI-A). All 50 serials are marked ENF in books/ITR-6/rule_census.md
   (none NA / OFFLINE in this range).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this
   return is lawful" assertion — is FALSE. Every read is guarded (RG /
   (X||{}) / N()); nothing throws. Keys are the built-return ITR6 schema
   paths (I = Object.values(buildReturn().ITR)[0]); the paths were taken
   from sources/ITR-6 schema and the built section 70_sec_ded. Encoded
   from each rule's own text (constitution rule 6).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";                 /* present / non-blank */
  const P0=v=>S0(v)&&String(v).trim().toUpperCase()!=="NA";   /* present and not the "NA" placeholder */

  /* ---- shared Part A General / cross-schedule reads ---- */
  const OF=RG(I,"PartA_GEN1.OrgFirmInfo",{})||{};
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const G2=RG(I,"PartA_GEN2For6",{})||{};
  const AVPAN=String(RG(I,"Verification.Declaration.AssesseeVerPAN","")||"").toUpperCase();
  const ASPAN=String(OF.PAN||"").toUpperCase();
  const foreign=OF.DomesticCompFlg==="N";                     /* foreign company */
  const s115=String(FS.Section115BA||"");                     /* "", "115BA", "115BAA", "115BAB", "NA" */

  /* the two VI-A columns: user-entered (claimed) and system-calculated (allowed). */
  const USR=RG(I,"ScheduleVIA.UsrDeductUndChapVIA",{})||{};
  const DED=RG(I,"ScheduleVIA.DeductUndChapVIA",{})||{};

  /* sum of DeductAmountSec80 over a Sch80DeductAmtDtls[] under a 80-IA/IB/IC sub-block */
  const sum80=blk=>RSUM(RG(blk||{},"Sch80DeductAmtDtls",[])||[],"DeductAmountSec80");

  /* =====================================================================
     Schedule 80G — donations.
     ===================================================================== */
  if(I.Schedule80G){
    const G=RG(I,"Schedule80G",{})||{};
    const BLKS=["Don100Percent","Don50PercentNoApprReqd","Don100PercentApprReqd","Don50PercentApprReqd"];
    const rowsOf=b=>RG(G,b+".DoneeDetail",[])||[];
    const allRows=[];BLKS.forEach(b=>rowsOf(b).forEach(r=>{if(r)allRows.push(r);}));

    /* A813 — a donee PAN entered in one block cannot be entered in any other block. */
    const panBlock={};let dup813=false;
    BLKS.forEach(b=>{const seen={};rowsOf(b).forEach(r=>{const p=r&&P0(r.DoneePAN)?String(r.DoneePAN).trim().toUpperCase():null;
      if(!p||seen[p])return;seen[p]=1;if(panBlock[p]&&panBlock[p]!==b)dup813=true;panBlock[p]=b;});});
    A(813, !dup813,
      "Schedule 80G: the same donee PAN cannot be entered in more than one of the 80G blocks (100% / 50% / with & without qualifying limit).");

    /* A814 — VI-A Sl.1a (system-calculated 80G) must equal eligible donation (Sl.E) of Schedule 80G. */
    A(814, !I.ScheduleVIA || REQ(DED.Section80G, G.TotalEligibleDonationsUs80G),
      "Schedule 80G: the system-calculated 80G deduction at Sl.No.1a of Schedule VI-A must equal the total eligible donation (Sl.No.E) in Schedule 80G.");

    /* A815 — deduction under Part B cannot be claimed under the new regime (115BAA / 115BAB). */
    A(815, (s115!=="115BAA"&&s115!=="115BAB") || N(DED.TotPartBchapterVIA)<=0,
      "Schedule 80G: deduction under Part B of Chapter VI-A cannot be claimed when the new tax regime (section 115BAA / 115BAB) is opted.");

    /* A816 — a row with donation in "other mode" > 0 needs the transaction reference and the bank IFSC. */
    A(816, allRows.every(r=>N(r.DonationAmtOtherMode)<=0 || (S0(r.TransactionRefNum)&&P0(r.IFSCCode))),
      "Schedule 80G: when 'contribution in other mode' is greater than zero the transaction reference number (UPI/cheque/IMPS/NEFT/RTGS) and the bank IFSC code are mandatory.");

    /* A817 — donee PAN is mandatory when the donation amount is more than zero. */
    A(817, allRows.every(r=>N(r.DonationAmt)<=0 || P0(r.DoneePAN)),
      "Schedule 80G: the PAN of the donee is mandatory when the donation amount is more than zero.");
  }

  /* =====================================================================
     Schedule 80GGA — donations for scientific research / rural development.
     ===================================================================== */
  if(I.Schedule80GGA){
    const GGA=RG(I,"Schedule80GGA",{})||{};
    const rows=RG(GGA,"DonationDtlsSciRsrchRuralDev",[])||[];

    /* A818 — Total donation = donation in cash + donation in other mode. */
    A(818, REQ(GGA.TotalDonationsUs80GGA, N(GGA.TotalDonationAmtCash80GGA)+N(GGA.TotalDonationAmtOtherMode80GGA)),
      "Schedule 80GGA: total donation must equal the sum of donation in cash and donation in other mode.");

    /* A819 — Total donation = sum of the individual donation rows. */
    A(819, REQ(GGA.TotalDonationsUs80GGA, RSUM(rows,"DonationAmt")),
      "Schedule 80GGA: total donation must equal the sum of the individual donation line items (i + ii + ...).");

    /* A820 — amount donated in cash must not exceed Rs. 2000. */
    A(820, rows.every(r=>N(r.DonationAmtCash)<=2000),
      "Schedule 80GGA: the amount donated in cash must not exceed Rs. 2,000.");

    /* A821 — donee PAN must not be the same as the assessee PAN or the PAN at verification. */
    A(821, rows.every(r=>{const p=P0(r.DoneePAN)?String(r.DoneePAN).trim().toUpperCase():"";
        return p===""||(p!==ASPAN&&p!==AVPAN);}),
      "Schedule 80GGA: the donee PAN must not be the same as the assessee's PAN or the PAN at verification.");
  }

  /* =====================================================================
     Schedule 80-IA — total = a + b + c.
     ===================================================================== */
  if(I.Schedule80_IA){
    const IA=RG(I,"Schedule80_IA",{})||{};
    A(823, REQ(IA.TotSchedule80_IA, sum80(IA.DeductUs80_IA_4_i)+sum80(IA.DeductUs80_IA_4_iv)+sum80(IA.DeductUs80_IA_4_v)),
      "Schedule 80-IA: the total deduction under section 80-IA must equal the sum of its line items (a + b + c).");
  }

  /* =====================================================================
     Schedule 80-IB — total = sum of all line items (a to d).
     ===================================================================== */
  if(I.Schedule80_IB){
    const IB=RG(I,"Schedule80_IB",{})||{};
    A(824, REQ(IB.TotSchedule80_IB, sum80(IB.DeductMinOilUs80_IB_9_Und)+sum80(IB.DeductHousUs80_IB_10_Und)
        +sum80(IB.DeductFruitVegUs80_IB_11A_Und)+sum80(IB.DeductFoodGrainUs80_IB_11A_Und)),
      "Schedule 80-IB: the total must equal the sum of all individual line items (total of a to d).");
  }

  /* =====================================================================
     Schedule 80-IC / 80-IE — North-East total (ai) = sum of the states (aa..ah).
     ===================================================================== */
  if(I.Schedule80_IC){
    const NE=RG(I,"Schedule80_IC.DeductInNorthEast",{})||{};
    const st=["Assam_Und","ArunachalPradesh_Und","Manipur_Und","Mizoram_Und","Meghalaya_Und","Nagaland_Und","Tripura_Und","Sikkim_Und"];
    A(825, REQ(NE.TotDeductInNorthEast, st.reduce((a,k)=>a+sum80(NE[k]),0)),
      "Schedule 80-IC/80-IE: Sl.No. ai (total for the North-Eastern States) must equal the sum of Sl.No. aa to ah.");
  }

  /* =====================================================================
     Schedule 10AA — total deduction u/s 10AA = sum of "amount of deduction".
     ===================================================================== */
  if(I.Schedule10AA){
    const DU=RG(I,"Schedule10AA.DeductSEZ.DedUs10Detail",{})||{};
    const rows=RG(DU,"Undertaking.DedFromUndertakingWithAy",[])||[];
    A(826, REQ(DU.TotalDedUs10Sub, RSUM(rows,"DedUs10Sub")),
      "Schedule 10AA: the total deduction under section 10AA must equal the sum of the amounts of deduction of each undertaking.");
  }

  /* =====================================================================
     Schedule IF — Schedule BP share of income cannot exceed the share of
     profits reported in Schedule IF.
     ===================================================================== */
  if(I.ScheduleIF){
    const totShare=N(RG(I,"ScheduleIF.TotalProfitShareAmt"));
    const a5a=N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.IncCredPL.FirmShareInc"));
    const a5b=N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.IncCredPL.AOPBOISharInc"));
    A(827, (a5a<=totShare+1)&&(a5b<=totShare+1),
      "Schedule IF: Schedule BP Sl.No. A5a (share of income from firm(s)) and A5b (share of income from AOP/BOI) cannot exceed the 'amount of share in the profits' column of Schedule IF.");
  }

  /* =====================================================================
     Schedule VI-A — Chapter VI-A deductions.
     ===================================================================== */
  if(I.ScheduleVIA){
    /* A822 — 80GGA claimed in VI-A ⇒ details must be provided in Schedule 80GGA. */
    A(822, N(USR.Section80GGA)<=0 || (I.Schedule80GGA && (RG(I,"Schedule80GGA.DonationDtlsSciRsrchRuralDev",[])||[]).length>0),
      "Schedule VI-A: when deduction u/s 80GGA is claimed, the donation details must be provided in Schedule 80GGA.");

    /* A828 — 80-IA claimed (Sl.2e) cannot exceed the total of Schedule 80-IA (Sl.2d). */
    A(828, N(USR.Section80IA) <= N(RG(I,"Schedule80_IA.TotSchedule80_IA"))+1,
      "Schedule VI-A: the value claimed for section 80-IA (Sl.No.2e) cannot exceed the total in Schedule 80-IA (Sl.No.2d).");

    /* A829 — 80-IA cannot be claimed in Sl.2e without filling Schedule 80-IA. */
    A(829, N(USR.Section80IA)<=0 || !!I.Schedule80_IA,
      "Schedule VI-A: deduction u/s 80-IA (Sl.No.2e) cannot be claimed without filling Schedule 80-IA.");

    /* A830 — 80-IB claimed (Sl.2h) cannot exceed the total of Schedule 80-IB (Sl.e). */
    A(830, N(USR.Section80IB) <= N(RG(I,"Schedule80_IB.TotSchedule80_IB"))+1,
      "Schedule VI-A: the value claimed for section 80-IB (Sl.No.2h) cannot exceed the total in Schedule 80-IB (Sl.No.e).");

    /* A831 — 80-IB cannot be claimed in Sl.2h without filling Schedule 80-IB. */
    A(831, N(USR.Section80IB)<=0 || !!I.Schedule80_IB,
      "Schedule VI-A: deduction u/s 80-IB (Sl.No.2h) cannot be claimed without filling Schedule 80-IB.");

    /* A832 — 80-IE claimed (Sl.2j) cannot exceed the total of Schedule 80-IE (Sl.b). */
    A(832, N(USR.Section80IC) <= N(RG(I,"Schedule80_IC.TotSchedule80_IC"))+1,
      "Schedule VI-A: the value claimed for section 80-IE (Sl.No.2j) cannot exceed the total in Schedule 80-IE (Sl.No.b).");

    /* A833 — 80-IE cannot be claimed in Sl.2j without filling Schedule 80-IE. */
    A(833, N(USR.Section80IC)<=0 || !!I.Schedule80_IC,
      "Schedule VI-A: deduction u/s 80-IE (Sl.No.2j) cannot be claimed without filling Schedule 80-IE.");

    /* A834 — Sl.3 = Sl.1 + Sl.2. */
    A(834, REQ(DED.TotalChapVIADeductions, N(DED.TotPartBchapterVIA)+N(DED.TotPartCchapterVIA)),
      "Schedule VI-A: Sl.No.3 must equal the total of Sl.No.1 and Sl.No.2.");

    /* A835 — Sl.1 (Total Part B) = a(80G) + b(80GGB) + c(80GGA) + d(80GGC). */
    A(835, REQ(DED.TotPartBchapterVIA, N(DED.Section80G)+N(DED.Section80GGB)+N(DED.Section80GGA)+N(DED.Section80GGC)),
      "Schedule VI-A: Sl.No.1 'Total Deduction under Part B' must equal 80G + 80GGB + 80GGA + 80GGC.");

    /* A836 — 80GGA is allowed only to an assessee having no business income. */
    A(836, N(USR.Section80GGA)<=0 || N(RG(I,"PartB-TI.ProfBusGain.TotProfBusGain"))<=0,
      "Schedule VI-A: deduction u/s 80GGA is allowed only to an assessee having no income under the head 'Profits and gains of business or profession'.");

    /* A837 — 80M: date of distribution of dividend cannot be after one month prior to
       the due date u/s 139(1) (31/10/2026 → 30/09/2026; with 92E audit 30/11/2026 → 31/10/2026). */
    const cut80M=(G2.LiableSec92Eflg==="Y")?"2026-10-31":"2026-09-30";
    A(837, (RG(USR,"Section80MDtls",[])||[]).every(r=>!r||!S0(r.Section80MDate)||String(r.Section80MDate)<=cut80M),
      "Schedule VI-A: for the deduction u/s 80M the date of distribution of dividend cannot be after one month prior to the due date for furnishing the return u/s 139(1).");

    /* A838 — 80LA(1) and 80LA(1A) cannot be claimed together. */
    A(838, !(N(USR.Section80LA)>0 && N(USR.Section80LA_1A)>0),
      "Schedule VI-A: deductions u/s 80LA(1) and 80LA(1A) cannot both be claimed.");

    /* A839 — 80LA(1A) can be claimed only if the IFSC / convertible-forex question is 'Yes'. */
    A(839, N(USR.Section80LA_1A)<=0 || FS.IsIfsc==="Y",
      "Schedule VI-A: deduction u/s 80LA(1A) can be claimed only if the assessee is located in an International Financial Services Centre and derives income solely in convertible foreign exchange (answered 'Yes').");

    /* A840 — 80LA(1) can be claimed only if the IFSC / convertible-forex question is 'No'. */
    A(840, N(USR.Section80LA)<=0 || FS.IsIfsc==="N",
      "Schedule VI-A: deduction u/s 80LA(1) can be claimed only if the IFSC / convertible-foreign-exchange question is answered 'No'.");

    /* A841 — 80M deduction cannot exceed the dividend income offered in Schedule OS and Schedule BP. */
    const divOS=N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.DividendGross"));
    const divBP=N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.Dividend"));
    A(841, N(DED.Section80M) <= divOS+divBP+1,
      "Schedule VI-A: the deduction claimed u/s 80M cannot exceed the dividend income offered in Schedule OS and Schedule BP.");

    /* A842 — a foreign company cannot claim deduction u/s 80M. */
    A(842, !foreign || N(USR.Section80M)<=0,
      "Schedule VI-A: a foreign company cannot claim deduction u/s 80M.");

    /* A843 — 80PA allowed only if a nature-of-business code 1001–1018 is selected. */
    const nbCodes=RG(I,"PartA_GEN2For6.NatOfBus.NatureOfBusiness",[])||[];
    A(843, N(USR.Section80PA)<=0 || nbCodes.some(r=>{const c=N(r&&r.Code);return c>=1001&&c<=1018;}),
      "Schedule VI-A: deduction u/s 80PA is not allowed if the nature-of-business code is other than 1001 to 1018.");

    /* A844 — 80M claimed ⇒ each distribution row must select Schedule OS or Schedule BP. */
    A(844, N(USR.Section80M)<=0 || (RG(USR,"Section80MDtls",[])||[]).every(r=>!r||N(r.Section80MAmnt)<=0||(r.Section80MType==="ScheduleOS"||r.Section80MType==="ScheduleBP")),
      "Schedule VI-A: when deduction u/s 80M is claimed, Schedule OS or Schedule BP (as applicable) must be selected for each dividend-distribution row.");

    /* A845 — 80PA claimed ⇒ producer-company (Sec.581A) flag must be 'Yes'. */
    A(845, N(USR.Section80PA)<=0 || FS.Sec581AFlag==="Y",
      "Schedule VI-A: to claim deduction u/s 80PA, 'Whether the company is a producer company as defined in Sec.581A of the Companies Act, 1956?' must be 'Yes' in Part A-General.");

    /* A846 — 80GGB is not allowed to a foreign company. */
    A(846, !foreign || N(USR.Section80GGB)<=0,
      "Schedule VI-A: deduction u/s 80GGB is not allowed if the type of company is a foreign company.");

    /* Chapter VI-A totals allowed under the concessional regimes (for A847–A849). */
    const ded10AA=N(RG(I,"Schedule10AA.DeductSEZ.DedUs10Detail.TotalDedUs10Sub"));
    const partB=N(DED.TotPartBchapterVIA);
    const partCexJJAA=N(DED.TotPartCchapterVIA)-N(DED.Section80JJAA);

    /* A847 — 115BA ⇒ no 10AA, no Schedule-80 (Part C) deductions other than 80JJAA. */
    A(847, s115!=="115BA" || (ded10AA<=0 && partCexJJAA<=0),
      "Schedule VI-A: on opting for section 115BA, Schedule 10AA and Part C Chapter VI-A deductions (other than 80JJAA) cannot be claimed.");

    /* A848 — 115BAB ⇒ no 10AA; no Part B & C deductions other than 80JJAA or 80M. */
    A(848, s115!=="115BAB" || (ded10AA<=0 && partB<=0 && (N(DED.TotPartCchapterVIA)-N(DED.Section80JJAA)-N(DED.Section80M))<=0),
      "Schedule VI-A: on opting for section 115BAB, Schedule 10AA and Part B & C Chapter VI-A deductions (other than 80JJAA or 80M) cannot be claimed.");

    /* A849 — 115BAA ⇒ no 10AA; no Part B & C deductions other than 80JJAA, 80LA(1A) or 80M. */
    A(849, s115!=="115BAA" || (ded10AA<=0 && partB<=0 && (N(DED.TotPartCchapterVIA)-N(DED.Section80JJAA)-N(DED.Section80LA_1A)-N(DED.Section80M))<=0),
      "Schedule VI-A: on opting for section 115BAA, Schedule 10AA and Part B & C Chapter VI-A deductions (other than 80JJAA, 80LA(1A) or 80M) cannot be claimed.");

    /* A850 — Sl.2 (Total Part C) = sum of Sl.e (80-IA) to Sl.p (80PA). */
    A(850, REQ(DED.TotPartCchapterVIA, N(DED.Section80IA)+N(DED.Section80IAB)+N(DED.Section80IAC)+N(DED.Section80IBA)
        +N(DED.Section80IB)+N(DED.Section80IC)+N(DED.Section80JJA)+N(DED.Section80JJAA)+N(DED.Section80LA)
        +N(DED.Section80LA_1A)+N(DED.Section80M)+N(DED.Section80PA)),
      "Schedule VI-A: Sl.No.2 'Part C — Deduction in respect of certain incomes' must equal the total of Sl.No.e (80-IA) to Sl.No.p (80PA).");

    /* A851–A862 — the eligible (system-calculated) deduction cannot exceed the user-entered amount. */
    A(851, N(DED.Section80G)   <= N(USR.Section80G),   "Schedule VI-A: the eligible deduction u/s 80G cannot be more than the user-entered amount.");
    A(852, N(DED.Section80GGB) <= N(USR.Section80GGB), "Schedule VI-A: the eligible deduction u/s 80GGB cannot be more than the user-entered amount.");
    A(853, N(DED.Section80GGA) <= N(USR.Section80GGA), "Schedule VI-A: the eligible deduction u/s 80GGA cannot be more than the user-entered amount.");
    A(854, N(DED.Section80GGC) <= N(USR.Section80GGC), "Schedule VI-A: the eligible deduction u/s 80GGC cannot be more than the user-entered amount.");
    A(855, N(DED.Section80IAB) <= N(USR.Section80IAB), "Schedule VI-A: the eligible deduction u/s 80IAB cannot be more than the user-entered amount.");
    A(856, N(DED.Section80IAC) <= N(USR.Section80IAC), "Schedule VI-A: the eligible deduction u/s 80IAC cannot be more than the user-entered amount.");
    A(857, N(DED.Section80IB)  <= N(USR.Section80IB),  "Schedule VI-A: the eligible deduction u/s 80IB cannot be more than the user-entered amount.");
    A(858, N(DED.Section80IBA) <= N(USR.Section80IBA), "Schedule VI-A: the eligible deduction u/s 80IBA cannot be more than the user-entered amount.");
    A(859, N(DED.Section80IC)  <= N(USR.Section80IC),  "Schedule VI-A: the eligible deduction u/s 80IE cannot be more than the user-entered amount.");
    A(860, N(DED.Section80JJA) <= N(USR.Section80JJA), "Schedule VI-A: the eligible deduction u/s 80JJA cannot be more than the user-entered amount.");
    A(861, N(DED.Section80JJAA)<= N(USR.Section80JJAA),"Schedule VI-A: the eligible deduction u/s 80JJAA cannot be more than the user-entered amount.");
    A(862, N(DED.Section80LA)  <= N(USR.Section80LA),  "Schedule VI-A: the eligible deduction u/s 80LA cannot be more than the user-entered amount.");
  }
});
