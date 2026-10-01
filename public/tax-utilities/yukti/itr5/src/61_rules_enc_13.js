/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, encoding batch 13.
   Serials 578–611 (books/ITR-5/rules.json): misc deduction cross-checks
   (Schedule ICDS · Schedule 10AA), Schedule 80GGC, Schedule 80GGA and
   Schedule 80G (donation buckets A/B/C/D).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) FIRES when cond (the "lawful" assertion) is FALSE.
   Reads are guarded (RG / (X||{})); nothing throws; every block guards
   to a no-op when the schedule is absent. Schema keys come from
   forms/ITR-5/src/70_sec_ded.js (expDed: Schedule80G / Schedule80GGA /
   Schedule80GGC / Schedule10AA), forms/ITR-5/src/70_sec_bp.js (expBp:
   ScheduleICDS), 70_sec_gen.js (PartA_GEN1 PAN + OptOldRegimeCurrAY) and
   70_sec_verify.js (Verification PAN), cross-checked against the books.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const arr=v=>Array.isArray(v)?v:[];
  const FYSTART="2025-04-01", FYEND="2026-03-31";              /* previous year 2025-26 (AY 2026-27) */
  const isISO=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||""));
  const upan=v=>String(v||"").trim().toUpperCase();
  const isPAN=v=>/^[A-Z]{5}\d{4}[A-Z]$/.test(upan(v));
  const aPAN=upan(RG(I,"PartA_GEN1.OrgFirmInfo.PAN",""));      /* assessee (firm) PAN */
  const vPAN=upan(RG(I,"Verification.Declaration.AssesseeVerPAN",""));  /* PAN at Verification */
  /* new (concessional) regime: OptOldRegimeCurrAY is the master switch (Y=old, N=new). Absent → treated as old (no-op). */
  const newRegime=String(RG(I,"PartA_GEN1.FilingStatus.OptOldRegimeCurrAY","Y")).toUpperCase()==="N";

  /* ===================================================================
     SCHEDULE ICDS  (578–579)   — owned by forms/ITR-5/src/70_sec_bp.js
     Per-row objects I.ScheduleICDS.<key>.{IncreaseInProfit,DecreaseInProfit,
     NetEffect}; totals in I.ScheduleICDS.TotalNetAmtDetl.{IncreaseInProfit,
     DecreaseInProfit}.  NetEffect (per row) = Increase − Decrease [H6].
     =================================================================== */
  if(I.ScheduleICDS){const IC=I.ScheduleICDS;
    const ICDS_KEYS=["AccPolicyAmtDetl","InventoriesValueDetl","ConstContractsAmtDetl","RevenueRcgAmtDetl",
      "TangibleFixedAssetDetl","ForeignExgRatesDetl","GovtGrantsDetl","SecuritiesDetl","BorrowingCostsDetl","ProvAssetsDetl"];
    let sumInc=0,sumDec=0;
    ICDS_KEYS.forEach(function(k){const o=RG(IC,k,null);if(o&&typeof o==="object"){
      sumInc+=N(o.IncreaseInProfit); sumDec+=N(o.DecreaseInProfit);
      /* 579: for each ICDS row, Net Effect must equal Increase in profit less Decrease in profit */
      A(579,REQ(N(o.NetEffect),N(o.IncreaseInProfit)-N(o.DecreaseInProfit)),"Schedule ICDS ("+k+"): the Net Effect must equal Increase in profit minus Decrease in profit.");
    }});
    /* 578: XI (total effect of ICDS adjustments) must equal the sum of the ten rows (I to X), for both the increase and the decrease side */
    A(578,REQ(N(RG(IC,"TotalNetAmtDetl.IncreaseInProfit")),sumInc)&&REQ(N(RG(IC,"TotalNetAmtDetl.DecreaseInProfit")),sumDec),
      "Schedule ICDS: the total effect at XI must equal the sum of the increase (and of the decrease) across ICDS I to X.");
  }

  /* ===================================================================
     SCHEDULE 10AA  (580)
     I.Schedule10AA.DeductSEZ.DedUs10Detail.Undertaking.DedFromUndertakingWithAy[]
       .DedUs10Sub  and  .TotalDedUs10Sub (total).
     =================================================================== */
  if(I.Schedule10AA){const AA=I.Schedule10AA;
    const aaRows=arr(RG(AA,"DeductSEZ.DedUs10Detail.Undertaking.DedFromUndertakingWithAy",[]));
    /* 580: total deduction under section 10AA must equal the sum of the per-undertaking amounts */
    A(580,REQ(N(RG(AA,"DeductSEZ.DedUs10Detail.TotalDedUs10Sub")),RSUM(aaRows,"DedUs10Sub")),
      "Schedule 10AA: the total deduction under section 10AA must equal the sum of the amounts at all rows.");
  }

  /* ===================================================================
     SCHEDULE VI-A cross-checks (581, 583, 595, 607, 610)
     ScheduleVIA.{UsrDeductUndChapVIA (claimed) , DeductUndChapVIA (allowed)}
       .{Section80G, Section80GGA, Section80GGC}.
     =================================================================== */
  if(I.ScheduleVIA){const usr=RG(I,"ScheduleVIA.UsrDeductUndChapVIA",{})||{},ded=RG(I,"ScheduleVIA.DeductUndChapVIA",{})||{};
    /* 583: if 80GGC is claimed in Schedule VI-A, Schedule 80GGC must be filled */
    A(583,!(N(usr.Section80GGC)>0)||!!I.Schedule80GGC,"If a deduction under section 80GGC is claimed in Schedule VI-A, the details must be provided in Schedule 80GGC.");
    /* 595: if 80GGA is claimed in Schedule VI-A, Schedule 80GGA must be filled */
    A(595,!(N(usr.Section80GGA)>0)||!!I.Schedule80GGA,"If a deduction under section 80GGA is claimed in Schedule VI-A, the details must be provided in Schedule 80GGA.");
    /* 607: if 80G is claimed in Schedule VI-A, donation details must be provided in Schedule 80G */
    A(607,!(N(usr.Section80G)>0)||!!I.Schedule80G,"If a deduction under section 80G is claimed in Schedule VI-A, the donation details must be provided in Schedule 80G.");
    if(newRegime){
      /* 581: under the new tax regime, 80GGC is not to be filled — the deduction must be nil */
      A(581,N(ded.Section80GGC)<=1&&N(usr.Section80GGC)<=1,"Under the new tax regime, a deduction under section 80GGC cannot be claimed (Schedule 80GGC is not required to be filled).");
      /* 610: 80G cannot be claimed under the new regime (115BAC/115BAD/115BAE) */
      A(610,N(ded.Section80G)<=1&&N(usr.Section80G)<=1,"A deduction under section 80G cannot be claimed when the new tax regime (115BAC / 115BAD / 115BAE) is selected.");
    }
  }

  /* ===================================================================
     SCHEDULE 80GGC  (584–587, 589–590)   — political-party contribution
     I.Schedule80GGC.Schedule80GGCDetails[]{DonationDate,DonationAmtCash,
       DonationAmtOtherMode,DonationAmt,EligibleDonationAmt,PoliticalPartyName,
       PoliticalPartyPAN} + Total{Cash,OtherMode,Us80GGC,EligibleDonationAmt}.
     (Cash gives no deduction: EligibleDonationAmt = other mode only.)
     =================================================================== */
  if(I.Schedule80GGC){const GC=I.Schedule80GGC,rows=arr(RG(GC,"Schedule80GGCDetails",[]));
    /* 584: total contribution = total cash + total other mode */
    A(584,REQ(N(GC.TotalDonationsUs80GGC),N(GC.TotalDonationAmtCash80GGC)+N(GC.TotalDonationAmtOtherMode80GGC)),
      "Schedule 80GGC: total contribution must equal contribution in cash plus contribution in other mode.");
    /* 587: D (total eligible amount of contribution) = sum of the per-row eligible amounts (column vi) */
    A(587,REQ(N(GC.TotalEligibleDonationAmt80GGC),RSUM(rows,"EligibleDonationAmt")),
      "Schedule 80GGC: D (total eligible amount of contribution) must equal the total of column vi (the per-row eligible amounts).");
    rows.forEach(function(r,i){r=r||{};const cash=N(r.DonationAmtCash),oth=N(r.DonationAmtOtherMode),L=" row "+(i+1)+": ";
      /* 585: per row, total contribution = cash (i) + other mode (ii) */
      A(585,REQ(N(r.DonationAmt),cash+oth),"Schedule 80GGC"+L+"total contribution must equal contribution in cash plus contribution in other mode (i + ii).");
      /* 586: a cash contribution is not eligible — the eligible amount cannot exceed the other-mode amount */
      A(586,N(r.EligibleDonationAmt)<=oth+1,"Schedule 80GGC"+L+"a contribution in cash is not eligible, so the eligible amount cannot be more than the other-mode amount.");
      /* 589: the date of contribution must fall within the previous year */
      A(589,!isISO(r.DonationDate)||(String(r.DonationDate)>=FYSTART&&String(r.DonationDate)<=FYEND),
        "Schedule 80GGC"+L+"the date of contribution must fall within the previous year (01-04-2025 to 31-03-2026).");
      /* 590: name and PAN of the political party are mandatory where a contribution is entered */
      if(cash||oth)A(590,!!String(r.PoliticalPartyName||"").trim()&&!!String(r.PoliticalPartyPAN||"").trim(),
        "Schedule 80GGC"+L+"the name and PAN of the political party are necessary to claim the deduction under section 80GGC.");
    });
  }

  /* ===================================================================
     SCHEDULE 80GGA  (591–594)  — scientific research / rural development
     I.Schedule80GGA.DonationDtlsSciRsrchRuralDev[]{DonationAmtCash,
       DonationAmtOtherMode,DonationAmt,EligibleDonationAmt,DoneePAN} +
       Total{Cash,OtherMode,Us80GGA} .  Cash over ₹2,000 is not eligible.
     =================================================================== */
  if(I.Schedule80GGA){const GA=I.Schedule80GGA,rows=arr(RG(GA,"DonationDtlsSciRsrchRuralDev",[]));
    /* 591: total donation = total cash + total other mode */
    A(591,REQ(N(GA.TotalDonationsUs80GGA),N(GA.TotalDonationAmtCash80GGA)+N(GA.TotalDonationAmtOtherMode80GGA)),
      "Schedule 80GGA: total donation must equal donation in cash plus donation in other mode.");
    rows.forEach(function(r,i){r=r||{};const cash=N(r.DonationAmtCash),oth=N(r.DonationAmtOtherMode),L=" row "+(i+1)+": ";
      /* 592: per row, total donation = cash (i) + other mode (ii) */
      A(592,REQ(N(r.DonationAmt),cash+oth),"Schedule 80GGA"+L+"total donation must equal donation in cash plus donation in other mode (i + ii).");
      /* 593: the eligible amount attributable to a cash donation cannot exceed ₹2,000 */
      A(593,N(r.EligibleDonationAmt)-oth<=2001,"Schedule 80GGA"+L+"the eligible amount donated in cash cannot exceed ₹2,000.");
      /* 594: donee PAN cannot be the same as the assessee's PAN or the PAN at Verification */
      const dp=upan(r.DoneePAN);
      A(594,!(isPAN(dp)&&(dp===aPAN||dp===vPAN)),"Schedule 80GGA"+L+"the PAN of the donee cannot be the same as the assessee's PAN or the PAN at Verification.");
    });
  }

  /* ===================================================================
     SCHEDULE 80G  (596–606, 608–609)   — donation buckets A/B/C/D
     Per bucket b: I.Schedule80G.<blk>.{DoneeDetail[]{DonationAmtCash,
       DonationAmtOtherMode,DonationElgAmt,DoneePAN,ArnNbr}, <total>, <cash>,
       <otherMode>}.  E totals: TotalDonationsUs80G / TotalEligibleDonationsUs80G.
     Bucket map [code, block, totalKey, cashKey, otherKey, eligKey]:
     =================================================================== */
  if(I.Schedule80G){const SG=I.Schedule80G;
    const G80=[
      ["A","Don100Percent","TotDon100Percent","TotDon100PercentCash","TotDon100PercentOtherMode","TotElgDon100Percent"],
      ["B","Don50PercentNoApprReqd","TotDon50PercentNoApprReqd","TotDon50PercentNoApprReqdCash","TotDon50PercentNoApprReqdOtherMode","TotElgDon50PercentNoApprReqd"],
      ["C","Don100PercentApprReqd","TotDon100Percent","TotDon100PercentApprReqdCash","TotDon100PercentApprReqdOtherMode","TotElgDon100Percent"],
      ["D","Don50PercentApprReqd","TotDon50PercentApprReqd","TotDon50PercentApprReqdCash","TotDon50PercentApprReqdOtherMode","TotElgDon50PercentApprReqd"]];
    let totBuckets=0; const allRows=[];
    G80.forEach(function(g,bi){const blk=RG(SG,g[1],null);if(!blk||typeof blk!=="object")return;
      const rows=arr(RG(blk,"DoneeDetail",[]));
      /* 602–605: per bucket, total donation = donation in cash + donation in other mode */
      A(602+bi,REQ(N(blk[g[2]]),N(blk[g[3]])+N(blk[g[4]])),
        "Schedule 80G table "+g[0]+": total donation must equal donation in cash plus donation in other mode.");
      rows.forEach(function(r,ri){r=r||{};const cash=N(r.DonationAmtCash),oth=N(r.DonationAmtOtherMode),L=" row "+(ri+1)+": ";
        /* 598–601: a donation in cash over ₹2,000 is not eligible, so the eligible amount
           cannot exceed the other-mode amount plus any cash of ₹2,000 or less */
        A(598+bi,N(r.DonationElgAmt)<=(cash>2000?0:cash)+oth+1,
          "Schedule 80G table "+g[0]+L+"a donation in cash over ₹2,000 is not eligible for the 80G deduction.");
        /* 596: donee PAN cannot be the same as the assessee's PAN or the PAN at Verification */
        const dp=upan(r.DoneePAN);
        A(596,!(isPAN(dp)&&(dp===aPAN||dp===vPAN)),
          "Schedule 80G table "+g[0]+L+"the PAN of the donee cannot be the same as the assessee's PAN or the PAN at Verification.");
        allRows.push({pan:dp,arn:String(r.ArnNbr||"").trim()});
      });
      totBuckets+=N(blk[g[2]]);
    });
    /* 606: E (total donation) = Aiii + Biii + Ciii + Diii (the sum of the bucket totals) */
    A(606,REQ(N(SG.TotalDonationsUs80G),totBuckets),
      "Schedule 80G: the total donation at E must equal the sum of the bucket totals (Aiii + Biii + Ciii + Diii).");
    /* 597: the total deduction computed for 80G cannot be more than the eligible amount at E */
    A(597,N(RG(I,"ScheduleVIA.DeductUndChapVIA.Section80G",0))<=N(SG.TotalEligibleDonationsUs80G)+1,
      "Schedule 80G: the total amount of deduction computed cannot be more than the eligible amount at sl. no. E.");
    /* 609: the system-calculated 80G value in Schedule VI-A must match the eligible donation at E */
    A(609,REQ(N(RG(I,"ScheduleVIA.DeductUndChapVIA.Section80G",0)),N(SG.TotalEligibleDonationsUs80G)),
      "Schedule VI-A / 80G: the system-calculated value of 80G in Schedule VI-A must match the eligible donation at sl. no. E in Schedule 80G.");
    /* 608: a donee PAN cannot repeat across the deduction blocks, except PAN 'AAAAR1077P'
       and (per the note) except a table-D row that carries an ARN (unique/exempt). We check
       only rows without an ARN, excluding AAAAR1077P, so ARN-differentiated D rows never fire. */
    const chk=allRows.filter(x=>isPAN(x.pan)&&x.pan!=="AAAAR1077P"&&!x.arn);
    const seen={};let dup=false;chk.forEach(function(x){if(seen[x.pan])dup=true;seen[x.pan]=1;});
    A(608,!dup,"Schedule 80G: the PAN of a donee cannot repeat across the blocks (100% / 50% / with or without qualifying limit), except PAN AAAAR1077P and table-D rows carrying a unique ARN.");
  }

  /* ---- NOT MAPPABLE (reported, not encoded) ------------------------
     582 — "In Schedule 80GGC, if Sl. No. iii > 0, then Sl. No. iv, vii and
           viii are not required to be filled." A conditional "not required to
           be filled" advisory keyed to form sl. nos. iv/vii/viii that have no
           corresponding fields in the ITR-5 Schedule80GGC schema (which stores
           only date/name/PAN/cash/other/total/eligible per row plus the four
           totals); there is no numeric assertion to check.
     588 — "If 'Donation in other mode' > 0, then details of such donation are
           required." The export writes the transaction-reference / IFSC fields
           only when supplied (expDed: `if(sv(r.ref))…` / `if(sv(r.ifsc))…`), so
           a return produced by this engine may lawfully omit them; a presence
           assertion would false-fire on such returns — not offline-checkable
           without false-firing.
     611 — "Transaction Reference number for UPI transfer / Cheque number /
           IMPS / NEFT / RTGS reference number and/ or IFSC" — a truncated
           fragment carrying no checkable assertion.
     ------------------------------------------------------------------ */
});
