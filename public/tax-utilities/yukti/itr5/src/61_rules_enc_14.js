/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, encoding batch 14.
   Serials 612–643 (books/ITR-5/rules.json), covering Schedule 80G (PAN of
   donee), Schedule 80IAC, Schedule 80LA, Schedule 80RA ("Schedule RA"),
   the profit-linked Schedule 80 (80-IA / 80-IB / 80-IE) totalling lines,
   and Schedule 80P.
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) FIRES when cond (the "lawful" assertion) is FALSE.
   Reads are guarded (RG / (X||{})); nothing throws; every block guards to
   a no-op when the schedule is absent. Schema keys come from
   forms/ITR-5/src/70_sec_ded.js exp() (Schedule80G donee buckets,
   Schedule80IAC, Schedule80LA / DED_LASUBALLOW enums, Schedule80RA totals,
   Schedule80_IA / _IB / _IC clause objects, Schedule80P flat matrix
   DED_80P / DED_80P_KEY) and forms/ITR-5/src/70_sec_gen.js exp()
   (PartA_GEN1.FilingStatus.StartUpDPIITFlag / OptOldRegimeCurrAY,
   PartA_GEN2.NatOfBus.NatureOfBusiness[].Code), cross-checked with books.
   NOTE: the rules.json text is line-shifted (each rule's tail bleeds into
   the next serial's start); every rule below is encoded from its own
   reconstructed sentence, not the raw fragment.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const arr=v=>Array.isArray(v)?v:[];
  const RGM=((S_||{}).C||{}).regime||{};                  /* resolved tax-regime object (65_regime.js) */
  const S=s=>String(s==null?"":s).trim();                 /* trimmed string */
  const has=s=>S(s).length>0;                             /* field present / non-blank */
  const isISO=s=>/^\d{4}-\d{2}-\d{2}$/.test(S(s));

  /* ===================================================================
     SCHEDULE 80G  (612)
     Donee rows live under four buckets, each carrying a DoneeDetail[]:
       Don100Percent · Don50PercentNoApprReqd ·
       Don100PercentApprReqd · Don50PercentApprReqd.
     Each row: DoneeName · DoneePAN · DonationAmtCash · DonationAmtOtherMode
             · DonationAmt · DonationElgAmt (· IFSCCode · TransactionRefNum).
     =================================================================== */
  if(I.Schedule80G){const G=I.Schedule80G;
    ["Don100Percent","Don50PercentNoApprReqd","Don100PercentApprReqd","Don50PercentApprReqd"].forEach(function(bk){
      arr(RG(G,bk+".DoneeDetail",[])).forEach(function(r,i){r=r||{};
        const don=N(r.DonationAmt)||N(r.DonationAmtCash)+N(r.DonationAmtOtherMode);
        /* 612: PAN of the donee is mandatory when the donation amount is > 0 */
        A(612,!(don>0)||has(r.DoneePAN),"Schedule 80G ("+bk+") donee "+(i+1)+": the PAN of the donee is mandatory when the donation amount is more than zero.");
      });
    });
  }

  /* ===================================================================
     SCHEDULE 80IAC  (613–615)   — single start-up object
     Fields: DateIncrpStrup · NatureOfBusiness · InterMnstBoardCertNum ·
             FstAYDeduction · AmtDedCurAY.  (Emitted only when amt > 0.)
     =================================================================== */
  if(I.Schedule80IAC){const X=I.Schedule80IAC||{}; const claimed=N(X.AmtDedCurAY)>0;
    /* 613: amount of deduction is > 0 but the remaining fields are not filled up */
    A(613,!claimed||(has(X.DateIncrpStrup)&&has(X.NatureOfBusiness)&&has(X.InterMnstBoardCertNum)&&has(X.FstAYDeduction)),
      "Schedule 80-IAC: the amount of deduction is more than zero but the remaining fields (date of incorporation, nature of business, board-certificate number, first AY of deduction) are not filled up.");
    /* 614: deduction can be claimed only by an entity incorporated after 01.04.2016 */
    A(614,!claimed||(isISO(X.DateIncrpStrup)&&S(X.DateIncrpStrup)>"2016-04-01"),
      "Schedule 80-IAC: the deduction can be claimed only by an entity whose date of incorporation is after 01st April, 2016.");
    /* 615: Schedule 80IAC is enabled only when the DPIIT start-up flag is "Yes" */
    A(615,S(RG(I,"PartA_GEN1.FilingStatus.StartUpDPIITFlag","")).toUpperCase()==="Y",
      "Schedule 80-IAC can be filled only when \"Recognised as a start-up by DPIIT\" in Part A-General is answered Yes.");
  }

  /* ===================================================================
     SCHEDULE 80LA  (616–619)
     Schedule80LADtls[] rows: SubSecDedClmd (Sl.1) · EntityType (Sl.2) ·
       IncmTypeUnt (Sl.3) · RegGNTAuth (Sl.4) · RegDate (Sl.5) ·
       RegNumber (Sl.6) · FstAYDeduction (Sl.7) · AmtDedCurAY (Sl.8).
     Sub-section → allowed EntityType / IncmTypeUnt (DED_LASUBALLOW):
       80LA(1)  : ent {SchdBankSEZ, FrgnBankSEZ} ; inc {OffshoreBnkng, Sec10Of1949}
       80LA(1A) : ent {UntIFSC}                  ; inc {IFSCSplEcoZone, TnfrAsst1949}
     =================================================================== */
  if(I.Schedule80LA){
    const LAENT={"80LA(1)":["SchdBankSEZ","FrgnBankSEZ"],"80LA(1A)":["UntIFSC"]};
    const LAINC={"80LA(1)":["OffshoreBnkng","Sec10Of1949"],"80LA(1A)":["IFSCSplEcoZone","TnfrAsst1949"]};
    arr(RG(I,"Schedule80LA.Schedule80LADtls",[])).forEach(function(r,i){r=r||{};
      const L=" row "+(i+1)+": "; const amt=N(r.AmtDedCurAY)>0; const sub=S(r.SubSecDedClmd);
      /* 616: amount claimed > 0 but the sub-section is not selected */
      A(616,!amt||has(r.SubSecDedClmd),"Schedule 80-LA"+L+"the amount of deduction is more than zero but the sub-section under which it is claimed is not selected.");
      /* 617: amount at Sl.8 > 0 but Sl.1–7 are not all filled up */
      A(617,!amt||(has(r.SubSecDedClmd)&&has(r.EntityType)&&has(r.IncmTypeUnt)&&has(r.RegGNTAuth)&&has(r.RegDate)&&has(r.RegNumber)&&has(r.FstAYDeduction)),
        "Schedule 80-LA"+L+"the amount of deduction at Sl. No. 8 is more than zero but one or more of the remaining fields at Sl. No. 1 to 7 is not filled up.");
      /* 618: type of entity must be one enabled by the chosen sub-section */
      if(LAENT[sub]&&has(r.EntityType))
        A(618,LAENT[sub].indexOf(S(r.EntityType))>=0,"Schedule 80-LA"+L+"the type of entity is not one that is enabled for the sub-section under which the deduction is claimed.");
      /* 619: type of income of the unit must be one enabled by the chosen sub-section */
      if(LAINC[sub]&&has(r.IncmTypeUnt))
        A(619,LAINC[sub].indexOf(S(r.IncmTypeUnt))>=0,"Schedule 80-LA"+L+"the type of income of the unit is not one that is enabled for the sub-section under which the deduction is claimed.");
    });
  }

  /* ===================================================================
     SCHEDULE RA  (620–623)   — schema block Schedule80RA (35(1) research assns)
     Rows (DonationDtlsRsrchAssctn[]): DonationAmtCash · DonationAmtOtherMode
       · DonationAmt.  Totals: TotalDonationAmtCash80RA · TotalDonationAmt-
       OtherMode80RA · TotalDonationsUs80RA.
     =================================================================== */
  if(I.Schedule80RA){const RA=I.Schedule80RA; const rr=arr(RG(RA,"DonationDtlsRsrchAssctn",[]));
    /* 620: total donation = donation in cash + donation in other mode */
    A(620,REQ(N(RA.TotalDonationsUs80RA),N(RA.TotalDonationAmtCash80RA)+N(RA.TotalDonationAmtOtherMode80RA)),
      "Schedule RA: the total donation must equal donation in cash + donation in other mode.");
    /* 621: total donation in cash = sum of the per-row cash amounts */
    A(621,REQ(N(RA.TotalDonationAmtCash80RA),RSUM(rr,"DonationAmtCash")),
      "Schedule RA: the total donation in cash must equal the sum of the per-row donations in cash.");
    /* 622: total donation in other mode = sum of the per-row other-mode amounts */
    A(622,REQ(N(RA.TotalDonationAmtOtherMode80RA),RSUM(rr,"DonationAmtOtherMode")),
      "Schedule RA: the total donation in other mode must equal the sum of the per-row donations in other than cash.");
    /* 623: total donation = sum of the per-row total donations */
    A(623,REQ(N(RA.TotalDonationsUs80RA),RSUM(rr,"DonationAmt")),
      "Schedule RA: the total donation must equal the sum of the per-row total donations.");
  }

  /* ===================================================================
     SCHEDULE 80  (624–627)   — the profit-linked 80-IA / 80-IB / 80-IE
     Each clause object holds Sch80DeductAmtDtls[] (up to two undertakings,
     each {DeductAmountSec80}); the clause value is the sum over that array.
       Schedule80_IA : DeductUs80_IA_4_i (a) · DeductUs80_IA_4_iv (b) ; total TotSchedule80_IA
       Schedule80_IB : DeductJKLocUs80_IB_4_Und (a) · DeductMinOilUs80_IB_9_Und (b) ·
                       DeductHousUs80_IB_10_Und (c) · DeductFruitVegUs80_IB_11A_Und (d) ·
                       DeductFoodGrainUs80_IB_11A_Und (e) ; total TotSchedule80_IB
       Schedule80_IC : DeductInNorthEast{ 8 state _Und clauses (aa..ah),
                       TotDeductInNorthEast (ai) } ; total TotSchedule80_IC (b)
     =================================================================== */
  const clauseVal=(blk,key)=>RSUM(arr(RG(blk,key+".Sch80DeductAmtDtls",[])),"DeductAmountSec80");
  /* 624: 80-IA total = a + b */
  if(I.Schedule80_IA){const IA=I.Schedule80_IA;
    A(624,REQ(N(IA.TotSchedule80_IA),clauseVal(IA,"DeductUs80_IA_4_i")+clauseVal(IA,"DeductUs80_IA_4_iv")),
      "Schedule 80-IA: the total deduction under section 80-IA must equal the value entered in (a + b).");
  }
  /* 625: 80-IB total (f) = total of a to e */
  if(I.Schedule80_IB){const IB=I.Schedule80_IB;
    const sumIB=clauseVal(IB,"DeductJKLocUs80_IB_4_Und")+clauseVal(IB,"DeductMinOilUs80_IB_9_Und")+
                clauseVal(IB,"DeductHousUs80_IB_10_Und")+clauseVal(IB,"DeductFruitVegUs80_IB_11A_Und")+
                clauseVal(IB,"DeductFoodGrainUs80_IB_11A_Und");
    A(625,REQ(N(IB.TotSchedule80_IB),sumIB),
      "Schedule 80-IB: the total at Sl. No. f must equal the sum of all individual line items (total of a to e).");
  }
  /* 626/627: 80-IE North-Eastern-States clauses */
  if(I.Schedule80_IC){const NE=RG(I,"Schedule80_IC.DeductInNorthEast",{})||{};
    const states=["Assam_Und","ArunachalPradesh_Und","Manipur_Und","Mizoram_Und","Meghalaya_Und","Nagaland_Und","Tripura_Und","Sikkim_Und"];
    const sumNE=states.reduce((s,k)=>s+clauseVal(NE,k),0);
    /* 627: ai (TotDeductInNorthEast) = sum of aa to ah */
    A(627,REQ(N(NE.TotDeductInNorthEast),sumNE),
      "Schedule 80-IE: Sl. No. ai must equal the sum of Sl. No. aa to ah.");
    /* 626: b (TotSchedule80_IC) = ai */
    A(626,REQ(N(RG(I,"Schedule80_IC.TotSchedule80_IC")),N(NE.TotDeductInNorthEast)),
      "Schedule 80-IE: Sl. No. b must equal Sl. No. ai.");
  }

  /* ===================================================================
     SCHEDULE 80P  (632, 633, 638–643)
     Flat matrix (Schedule80P). Per activity row there are three leaves:
       <key>      — income eligible (column "income")   [Sl. 1..13]
       <key>Amt   — amount of deduction ("Amount eligible for deduction")
       <key>Code  — the fixed nature-of-business code
     Totals: Sec80PTotal (income) · Sec80PTotalAmt (deduction = Sl.14).
     Row order / keys / mandated codes (DED_80P / DED_80P_KEY, 70_sec_ded.js):
       Sl.1  Sec80P2ai   80P(2)(a)(i)   23001
       Sl.2  Sec80P2aii  80P(2)(a)(ii)  23002
       Sl.3  Sec80P2aiii 80P(2)(a)(iii) 23003
       Sl.4  Sec80P2aiv  80P(2)(a)(iv)  23004
       Sl.5  Sec80P2av   80P(2)(a)(v)   23005
       Sl.6  Sec80P2avi  80P(2)(a)(vi)  23006
       Sl.7  Sec80P2avii 80P(2)(a)(vii) 23007
       Sl.8  Sec80P2b    80P(2)(b)      23008
       Sl.9  Sec80P2ci   80P(2)(c)(i)   23009   (deduction cap ₹1,00,000)
       Sl.10 Sec80P2cii  80P(2)(c)(ii)  23010   (deduction cap ₹50,000)
       Sl.11 Sec80P2d    80P(2)(d)      23011
       Sl.12 Sec80P2e    80P(2)(e)      23012
       Sl.13 Sec80P2f    80P(2)(f)      23013
     =================================================================== */
  if(I.Schedule80P){const P=I.Schedule80P||{};
    const ROWS=[["Sec80P2ai","23001","80P(2)(a)(i)"],["Sec80P2aii","23002","80P(2)(a)(ii)"],
      ["Sec80P2aiii","23003","80P(2)(a)(iii)"],["Sec80P2aiv","23004","80P(2)(a)(iv)"],
      ["Sec80P2av","23005","80P(2)(a)(v)"],["Sec80P2avi","23006","80P(2)(a)(vi)"],
      ["Sec80P2avii","23007","80P(2)(a)(vii)"],["Sec80P2b","23008","80P(2)(b)"],
      ["Sec80P2ci","23009","80P(2)(c)(i)"],["Sec80P2cii","23010","80P(2)(c)(ii)"],
      ["Sec80P2d","23011","80P(2)(d)"],["Sec80P2e","23012","80P(2)(e)"],["Sec80P2f","23013","80P(2)(f)"]];
    const present=k=>P[k]!=null||P[k+"Amt"]!=null||P[k+"Code"]!=null;

    /* 643: for each row, the eligible deduction cannot exceed the income disclosed */
    ROWS.forEach(function(x){if(present(x[0]))
      A(643,N(P[x[0]+"Amt"])<=N(P[x[0]])+1,"Schedule 80P ["+x[2]+"]: the eligible amount of deduction claimed cannot be more than the income disclosed for that row.");});

    /* 632: 80P(2)(c)(i) deduction cannot be more than ₹1,00,000
       (the alternative "or non-speculative business income" operand is a
       derived business-income pool — see the NOT-MAPPABLE note; the ₹1,00,000
       ceiling is an absolute upper bound and is always a lawful assertion) */
    A(632,N(P.Sec80P2ciAmt)<=100000+1,"Schedule 80P [80P(2)(c)(i)]: the deduction cannot be more than ₹1,00,000.");
    /* 633: 80P(2)(c)(ii) at Sl. No. 10 cannot be more than ₹50,000 */
    A(633,N(P.Sec80P2ciiAmt)<=50000+1,"Schedule 80P [80P(2)(c)(ii)] at Sl. No. 10: the deduction cannot be more than ₹50,000.");

    /* 638: each row's business code must match a code declared in the
       Schedule "Nature of business" (guarded to a no-op if that schedule
       is not filled, so an absent nature-of-business never false-fires) */
    {const nob=arr(RG(I,"PartA_GEN2.NatOfBus.NatureOfBusiness",[])).map(r=>S((r||{}).Code)).filter(has);
     if(nob.length) ROWS.forEach(function(x){if(present(x[0]))
       A(638,nob.indexOf(S(P[x[0]+"Code"]))>=0,"Schedule 80P ["+x[2]+"]: the business code selected does not match any \"Business code\" selected in the Schedule \"Nature of business\".");});
    }

    /* 640: rows Sl.1–7 [80P(2)(a)(i)–(vii)] carry only their mandated codes */
    ROWS.slice(0,7).forEach(function(x){if(present(x[0]))
      A(640,S(P[x[0]+"Code"])===x[1],"Schedule 80P: deduction under "+x[2]+" can be claimed only for business code "+x[1]+".");});
    /* 641 (part 1): rows Sl.8–13 [80P(2)(b)–(f)] carry only their mandated codes */
    ROWS.slice(7).forEach(function(x){if(present(x[0]))
      A(641,S(P[x[0]+"Code"])===x[1],"Schedule 80P: deduction under "+x[2]+" can be claimed only for business code "+x[1]+".");});
    /* 641 (part 2): 80P cannot be claimed if the new tax regime has been opted for.
       80P is a Part-C deduction claimable only by a co-operative society and is
       barred under the co-op concessional regimes 115BAD/115BAE (regime contract:
       Part-C survivors are only 80JJAA & 80LA(1A)). The OptOldRegimeCurrAY flag
       misses a co-op that opted 115BAD (via S.fs.newTaxRegime) or 115BAE, so read
       the resolved regime object: fire when is115BAD || is115BAE and 80P>0. */
    A(641,!(RGM.is115BAD||RGM.is115BAE)||N(P.Sec80PTotalAmt)===0,
      "Schedule 80P: a deduction u/s 80P cannot be claimed when the new tax regime has been opted for.");

    /* 639: total deduction at Sl.14 cannot exceed the sum of Sl.1–13 deductions */
    A(639,N(P.Sec80PTotalAmt)<=RSUM(ROWS,x=>N(P[x[0]+"Amt"]))+1,
      "Schedule 80P: the total deduction at Sl. No. 14 must be less than or equal to the sum of the deductions claimed at Sl. No. 1 to Sl. No. 13.");
  }

  /* ===================================================================
     SCHEDULE 80P  (642)   — cross-schedule presence linkage
     To claim a deduction u/s 80P (allowed amount carried in Schedule VI-A),
     Schedule 80P and the P&L account (PARTA_PL) must both be filled.
     =================================================================== */
  {const claimed80P=N(RG(I,"ScheduleVIA.DeductUndChapVIA.Section80P"))>0||N(RG(I,"ScheduleVIA.UsrDeductUndChapVIA.Section80P"))>0;
   if(claimed80P)
     A(642,!!I.Schedule80P&&!!I.PARTA_PL,"Schedule 80P: to claim a deduction u/s 80P it is mandatory to fill Schedule 80P and the Profit & Loss account, failing which the deduction is not allowed.");
  }

  /* ---- NOT MAPPABLE (reported, not encoded) ------------------------
     628 — "Deduction u/s 80IB (Sl. 2g) cannot be more than the non-
           speculative, non-specified-business, non-presumptive income."
           The cap operand is the derived business-income pool (business
           income after BFLA less 44AD/44ADA/44AE), not a single schema
           leaf; reconstructing it from ScheduleBFLA/CorpScheduleBP would
           false-fire on lawful returns.
     629 — same derived business-income-pool cap, for 80IE (Sl. 2i).
     630 — "Schedule 80P Sl. 11 [80P(2)(d)] eligible amount should not be
           more than (1a + 1bi + 1bii) of Schedule OS + 5(ii) and 5(xiii)
           of Schedule BFLA, subject to interest/dividend declared in the
           P&L." The cap operand spans Schedule OS line items and BFLA
           set-off columns with a P&L condition; there is no single stored
           field, so a literal encoding would false-fire.
     631 — "80P is allowed only to a Primary Agricultural Credit Society /
           Primary Co-op Agri & Rural Development Bank / other co-operative
           society, and cannot be claimed from income offered u/s 44AD."
           The first limb needs the filing sub-status enum semantics and
           the second needs the 44AD presumptive-income figure (a derived
           pool), neither being a checkable single leaf here (co-op status
           gate is encoded at the Schedule VI-A level, serial 653/batch 15).
     634 — "80P(2)(e) at Sl. 12 can be claimed on rental income included in
           gross total income." The operand (rental income within GTI) is a
           cross-schedule derived figure (Schedule HP into Part B-TI), not a
           single schema field.
     635 — "80P(2)(f) Others is allowed only when gross total income ≤
           ₹20,000, to the extent of interest income in Schedule OS and
           Sl. 4 of Schedule HP." GTI is the derived Part B-TI total and the
           extent operand spans Schedule OS/HP; no single checkable leaf.
     636 — "80P(2)(a)(i) to (vii) cannot be more than the non-speculative,
           non-specified-business, non-presumptive income." Same derived
           business-income-pool cap as 628.
     637 — "80P(2)(b) cannot be more than the non-speculative, non-
           specified-business, non-presumptive income." Same derived
           business-income-pool cap as 628.
     ------------------------------------------------------------------ */
});
