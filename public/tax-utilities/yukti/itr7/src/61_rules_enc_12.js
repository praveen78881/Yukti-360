/* =====================================================================
   ITR-7 · A.Y. 2026-27 — Category-A validation rules, batch enc_12 (Phase 6).
   Serial range A559–A608 (Part B-TI · the three parallel Part-B statements).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this
   return is lawful" assertion — is FALSE. Every read is guarded (RG / N /
   (X||{})); nothing throws.

   The department numbers its three Part-B statements "Part B1 / B2 / B3";
   the built return spells them PartB_TI (Part-B1, ss.11/12 or 10(23C)
   (iv)/(v)/(vi)/(via)), PartB_TI2 (Part-B2, s.13A/13B or 10(21)…10(47)) and
   PartB_TI3 (Part-B3, income at the maximum marginal rate under the 22nd
   proviso to 10(23C) / s.13(10)). ITR-7 files only the statement matching the
   filing status, so each block-scoped batch enters only under its own
   `if(PartB_TIx){…}` guard and stays silent when that regime is absent (the
   whole range is silent on the lawful s.11 client, which is Part-B1).

   Keys are the built-return schema paths, taken from
   sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json, books/ITR-7/PART_B_TI_TTI.md
   (the item ⇔ key tables) and the built section 70_sec_tax.js (expTaxB1/B2/B3,
   expTaxCG) plus the referenced schedule sections (70_sec_cg/os/hp/bp/vc/si/
   cyla and Schedule115BBI / ScheduleIE_I). The income-not-forming-part heads
   (HP 3 / BP D48 / OS 9 / the Schedule-CG item-E buckets) are carried into
   Part B-TI floored at nil on a loss, so the head comparisons below floor
   both sides (max(0,·)) to mirror that.

   The rules.json line-wrap offsets each serial by ~one physical line (rule n =
   tail of entry n + head of entry n+1); the assertions below are encoded to
   the RE-JOINED semantic rule. A583/A585 and A584/A586 are the department's
   own duplicate serials (Sl.1 = Σ1a–1n / Sl.2 = Σ2a–2f), encoded twice so the
   coverage grep tallies both. Encoded from each rule's own text (rule 6).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};

  /* ---- Part A-General: section under which exemption is claimed ---- */
  const OI    = RG(RG(I,"PartA_GEN1",{})||{},"OrgFirmInfo",{})||{};
  const exsec = String(OI.SecExemptionClaimed==null?"":OI.SecExemptionClaimed);
  const inSet = (v,a)=>a.indexOf(v)>=0;

  /* the three Part-B statements (null when that regime is not filed) */
  const TI  = RG(I,"PartB_TI",null);
  const TI2 = RG(I,"PartB_TI2",null);
  const TI3 = RG(I,"PartB_TI3",null);

  /* ---- referenced schedules (guarded; default {} so nothing throws) ---- */
  const CG   = RG(I,"ScheduleCG",{})||{};
  const CE   = RG(CG,"CurrYrLosses",{})||{};       /* Schedule CG item E */
  const hasCGE = RG(I,"ScheduleCG.CurrYrLosses",null)!=null;
  const OSs  = RG(I,"ScheduleOS",{})||{};
  const HPs  = RG(I,"ScheduleHP",{})||{};
  const BPs  = RG(I,"CorpScheduleBP",{})||{};
  const VCs  = RG(I,"ScheduleVC",{})||{};
  const SIs  = RG(I,"ScheduleSI",{})||{};
  const BBI  = RG(I,"Schedule115BBI",{})||{};
  const CYLA = RG(I,"ScheduleCYLA",{})||{};
  const IE1  = RG(I,"ScheduleIE_I",{})||{};

  /* ---- schedule reference figures ---- */
  const cgE   = k => N(RG(CE,k+".CurrYrCapGain",0));   /* item-E per-bucket CY gain */
  const cg8ii = cgE("InStcg20Per");                    /* 8ii  — ST @20%  */
  const cg8iii= cgE("InStcg30Per");                    /* 8iii — ST @30%  */
  const cg8iv = cgE("InStcgAppRate");                  /* 8iv  — ST applicable rate */
  const cg8v  = cgE("InStcgDTAARate");                 /* 8v   — ST DTAA  */
  const cg8vi = cgE("InLtcg12_5Per");                  /* 8vi  — LT @12.5% */
  const cg8vii= cgE("InLtcgDTAARate");                 /* 8vii — LT DTAA  */
  const cgC2  = N(RG(CG,"IncmFromVDATrnsf",0));        /* C2   — 115BBH @30% (VDA) */
  const os9   = N(RG(OSs,"IncChargeableFrmOthSrc",0)); /* Schedule OS item 9 */
  const hp3   = N(RG(HPs,"TotalIncomeChargeableUnHP",0));/* Schedule HP item 3 */
  const bpD   = N(RG(BPs,"IncChrgUnHdProftGain",0));   /* Schedule BP D48 */
  const siCol = N(RG(SIs,"TotSplRateInc",0));          /* Schedule SI col (i) total */
  const bbi7  = N(RG(BBI,"Total",0));                  /* Schedule 115BBI Sl.7 total */
  const vcC   = N(RG(VCs,"TotalContribution",0));      /* Schedule VC — C */
  const vcDiii= N(RG(VCs,"AnonymousDonations.AnonymousDonations115BBC",0)); /* VC Diii */
  const cylaSet = N(RG(CYLA,"TotalLossSetOff.TotHPlossCurYrSetoff",0))
                + N(RG(CYLA,"TotalLossSetOff.TotBusLossSetoff",0))
                + N(RG(CYLA,"TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff",0)); /* CYLA 2xiv+3xiv+4xiv */
  const ie1Rcpt = N(RG(IE1,"TotRcptVoluntaryContr",0));/* Schedule IE-1 total receipts incl. VC */

  const EQ  = (a,b)=>N(a)===N(b);                      /* exact equality */
  const EQz = (a,b)=>Math.max(0,N(a))===Math.max(0,N(b)); /* floored (nil-if-loss heads) */

  /* codes for the exemption sections that MAY file Part-B2 (13A/13B, 10(21)…10(47)) */
  const B2SET=["13A","13B","21","23A","23AAA","23B","23EC","23ED","23EE","29A",
    "23CIIIAB","23CIIIAC","23CIIIAD","23CIIIAE","23D","23DA","23FB","24",
    "46","46A","46B","47","2135I"];
  /* codes for the exemption sections that MAY file Part-B3 (ss.11/12 or 10(23C)(iv)-(via)) */
  const B3SET=["11","23CIV","23CV","23CVI","23CVIA"];

  /* =====================================================================
     Part-B2 — s.13A/13B or 10(21)…10(47)   (PartB_TI2)
     ===================================================================== */
  if(TI2){
    const T   = TI2;
    const cg  = RG(T,"CapGain",{})||{};
    const st  = RG(cg,"ShortTerm",{})||{};
    const lt  = RG(cg,"LongTerm",{})||{};
    const hp  = N(RG(T,"IncomeFromHP",0));
    const bp  = N(RG(T,"ProfBusGain.ProfGainNoSpecBus",0));
    const os  = N(RG(T,"IncFromOS.TotIncFromOS",0));

    /* A559 — 7iii(Bii) long-term at special rate as per DTAA = E(8vii) of Sch CG. */
    A(559, EQz(lt.LongTermSplRateDTAA, cg8vii),
      "Part B-TI (Part B2): Sl. 7iii(Bii) — long-term capital gain chargeable at special rates as per DTAA must equal E(8vii) of Schedule CG.");
    /* A560 — 7iii(Biii) total long-term = 7iii(Bi + Bii). */
    A(560, EQ(lt.TotalLongTerm, N(lt.LongTerm12_5Per)+N(lt.LongTermSplRateDTAA)),
      "Part B-TI (Part B2): Sl. 7iii(Biii) — total long-term capital gain must equal the sum of 7iii(Bi + Bii).");
    /* A561 — 7iii(C) sum of short-term / long-term = (Av + Biii). */
    A(561, EQ(cg.ShortTermLongTermTotal, N(st.TotalShortTerm)+N(lt.TotalLongTerm)),
      "Part B-TI (Part B2): Sl. 7iii(C) — sum of short-term and long-term capital gains must equal (Av + Biii).");
    /* A562 — 7iv income from other sources = Sl. 9 of Schedule OS. */
    A(562, EQz(os, os9),
      "Part B-TI (Part B2): Sl. 7iv — income from other sources must equal Sl. 9 of Schedule OS.");
    /* A563 — 7v total = 7i + 7ii + 7iiiE + 7iv. */
    A(563, EQ(T.TotIncNotPart7And11Abv, hp+bp+N(cg.TotalCapGains)+os),
      "Part B-TI (Part B2): Sl. 7v — total income not forming part must equal 7i + 7ii + 7iiiE + 7iv.");
    /* A564 — 8 gross income = [6 + 7v − 4 − 5] + 3. */
    A(564, EQ(T.GrossIncome, N(T.VoluntaryContributions)+N(T.TotIncNotPart7And11Abv)
        - N(T.ExemptionUs13_A) - N(T.ExemptionUs13_B) + N(T.IncomeChargeable11_3)),
      "Part B-TI (Part B2): Sl. 8 — gross income must equal [6 + 7v − 4 − 5] + 3.");
    /* A565 — 9 current-year losses to be set off = (2xiv + 3xiv + 4xiv) of Schedule CYLA. */
    A(565, EQ(T.CurrentYearLoss, cylaSet),
      "Part B-TI (Part B2): Sl. 9 — losses of the current year to be set off must equal (2xiv + 3xiv + 4xiv) of Schedule CYLA.");
    /* A566 — 10 gross total income = 8 − 9. */
    A(566, EQ(T.GrossTotalIncome, N(T.GrossIncome)-N(T.CurrentYearLoss)),
      "Part B-TI (Part B2): Sl. 10 — gross total income must equal (8 − 9).");
    /* A567 — Part-B2 may be filled only when the exemption claimed is 13A/13B or one of 10(21)…10(47). */
    A(567, exsec==="" || inSet(exsec,B2SET),
      "Part B-TI (Part B2): Part B2 may be filled only when exemption is claimed u/s 13A/13B or one of sections 10(21) to 10(47).");
    /* A568 — Sl. 4 (income exempt u/s 13A) is allowed only when exemption is claimed u/s 13A. */
    A(568, N(T.ExemptionUs13_A)<=0 || exsec==="13A",
      "Part B-TI (Part B2): Sl. 4 — income claimed exempt u/s 13A is allowed only when the exemption claimed is Section 13A.");
    /* A569 — Sl. 5 (income exempt u/s 13B) is allowed only when exemption is claimed u/s 13B. */
    A(569, N(T.ExemptionUs13_B)<=0 || exsec==="13B",
      "Part B-TI (Part B2): Sl. 5 — income claimed exempt u/s 13B is allowed only when the exemption claimed is Section 13B.");
    /* A570 — 10(23C)(iiiad)/(iiiae): the amount at 2d/2e cannot exceed ₹5 crore. */
    A(570, (exsec!=="23CIIIAD" || N(T.ExemptionUs10_23Ciiiad)<=50000000)
        && (exsec!=="23CIIIAE" || N(T.ExemptionUs10_23Ciiiae)<=50000000),
      "Part B-TI (Part B2): where exemption is claimed u/s 10(23C)(iiiad)/(iiiae), the amount at Sl. 2d/2e cannot exceed ₹5 crore.");
    /* A571 — 7ii profits & gains of business or profession = Sl. D of Schedule BP. */
    A(571, EQz(bp, bpD),
      "Part B-TI (Part B2): Sl. 7ii — profits and gains of business or profession is not consistent with Sl. D of Schedule BP.");
    /* A573 — 7iii(d) capital gain @30% u/s 115BBH = C2 of Schedule CG. */
    A(573, EQz(cg.CapGains30Per115BBH, cgC2),
      "Part B-TI (Part B2): Sl. 7iii(d) — capital gain chargeable u/s 115BBH must equal C2 of Schedule CG.");
    /* A574 — 7iiiE total capital gains = 7iii(C + D). */
    A(574, EQ(cg.TotalCapGains, N(cg.ShortTermLongTermTotal)+N(cg.CapGains30Per115BBH)),
      "Part B-TI (Part B2): Sl. 7iiiE — total capital gains must equal 7iii(C + D).");
    /* A575 — 6 voluntary contribution received during the year = C of Schedule VC. */
    A(575, EQ(T.VoluntaryContributions, vcC),
      "Part B-TI (Part B2): Sl. 6 — voluntary contribution received during the year must equal Sl. C of Schedule VC.");
    /* A577 — exemption at 1l (10(46A)) requires Section 10(46A) selected under filing status. */
    A(577, N(T.ExemptionUs10_46A)<=0 || exsec==="46A",
      "Part B-TI (Part B2): exemption is claimed at 1l u/s 10(46A) but Section 10(46A) is not selected under filing status in Schedule Personal Information.");
    /* A578 — exemption at 1l = total receipts including voluntary contribution in Schedule IE-1. */
    A(578, EQ(T.ExemptionUs10_46A, ie1Rcpt),
      "Part B-TI (Part B2): exemption claimed at 1l must equal the total receipts including voluntary contribution in Schedule IE-1.");
    /* A579 — exemption at 1m (10(46B)) requires Section 10(46B) selected under filing status. */
    A(579, N(T.ExemptionUs10_46B)<=0 || exsec==="46B",
      "Part B-TI (Part B2): exemption is claimed at 1m u/s 10(46B) but Section 10(46B) is not selected under filing status in Schedule Personal Information.");
    /* A580 — exemption at 1m = total receipts including voluntary contribution in Schedule IE-1. */
    A(580, EQ(T.ExemptionUs10_46B, ie1Rcpt),
      "Part B-TI (Part B2): exemption claimed at 1m must equal the total receipts including voluntary contribution in Schedule IE-1.");
    /* A581 — 7iii(Ai) short-term @20% > 0 ⇒ Table E of Sch CG filled and the amount = 8ii of item E. */
    A(581, N(st.ShortTerm20Per)<=0 || (hasCGE && EQz(st.ShortTerm20Per, cg8ii)),
      "Part B-TI (Part B2): Sl. 7iii(Ai) short-term chargeable @20% is greater than nil — Table E of Schedule CG must be filled and the amount must equal 8ii of item E.");
    /* A582 — 7iii(Bi) long-term @12.5% > 0 ⇒ Table E of Sch CG filled and the amount = 8vi of item E. */
    A(582, N(lt.LongTerm12_5Per)<=0 || (hasCGE && EQz(lt.LongTerm12_5Per, cg8vi)),
      "Part B-TI (Part B2): Sl. 7iii(Bi) long-term chargeable @12.5% is greater than nil — Table E of Schedule CG must be filled and the amount must equal 8vi of item E.");
    /* A583 — Sl. 1 amount eligible for exemption = sum of Sl. 1a to 1n. */
    const sum1 = N(T.ExemptionUs1021)+N(T.ExemptionUs10_23AAA)+N(T.ExemptionUs10_23B)
      +N(T.ExemptionUs10_23D)+N(T.ExemptionUs10_23DA)+N(T.ExemptionUs10_23EC)
      +N(T.ExemptionUs10_23ED)+N(T.ExemptionUs10_23EE)+N(T.ExemptionUs10_23FB)
      +N(T.ExemptionUs10_29A)+N(T.ExemptionUs10_46)+N(T.ExemptionUs10_46A)
      +N(T.ExemptionUs10_46B)+N(T.ExemptionUs10_47);
    A(583, EQ(T.TotExemptionUs10_21to29, sum1),
      "Part B-TI (Part B2): Sl. 1 — amount eligible for exemption under sections 10(21)…10(47) must equal the sum of Sl. 1a to 1n.");
    /* A584 — Sl. 2 amount eligible for exemption = sum of Sl. 2a to 2f. */
    const sum2 = N(T.ExemptionUs10_23A)+N(T.ExemptionUs10_23Ciiiab)+N(T.ExemptionUs10_23Ciiiac)
      +N(T.ExemptionUs10_23Ciiiad)+N(T.ExemptionUs10_23Ciiiae)+N(T.ExemptionUs10_24);
    A(584, EQ(T.TotExemptionUs10_23Cto10_47, sum2),
      "Part B-TI (Part B2): Sl. 2 — amount eligible for exemption under sections 10(23A), 10(23C)(iiiab)…(iiiae), 10(24) must equal the sum of Sl. 2a to 2f.");
    /* A585 — duplicate of A583 (Sl. 1 = Σ 1a to 1n). */
    A(585, EQ(T.TotExemptionUs10_21to29, sum1),
      "Part B-TI (Part B2): Sl. 1 — amount eligible for exemption under sections 10(21)…10(47) must equal the sum of Sl. 1a to 1n.");
    /* A586 — duplicate of A584 (Sl. 2 = Σ 2a to 2f). */
    A(586, EQ(T.TotExemptionUs10_23Cto10_47, sum2),
      "Part B-TI (Part B2): Sl. 2 — amount eligible for exemption under sections 10(23A)…10(24) must equal the sum of Sl. 2a to 2f.");
  }

  /* =====================================================================
     Part-B3 — income at the maximum marginal rate (22nd proviso / 13(10))
     (PartB_TI3.ComputationIncChargeable)
     ===================================================================== */
  if(TI3){
    const C   = RG(TI3,"ComputationIncChargeable",{})||{};
    const ED  = RG(C,"ExpDisallowed",{})||{};
    const ADD = RG(C,"Additions",{})||{};
    const INF = RG(C,"IncNotForming",{})||{};
    const cg  = RG(INF,"CapGain",{})||{};
    const st  = RG(cg,"ShortTerm",{})||{};
    const lt  = RG(cg,"LongTerm",{})||{};

    /* A587 — 3(x) total expenditure to be disallowed = sum of 3(i) to 3(ix). */
    const sum3 = N(ED.ExpCorpusStandingCredit)+N(ED.ExpLoanBorrow)+N(ED.DeprRespAsset)
      +N(ED.ExpFormContri)+N(ED.CapExp)+N(ED.AmtDisallSubClauseiaSec40)
      +N(ED.AmtDisallSubSec3Sec40A)+N(ED.AmtDisallSubSec3ASec40A)+N(ED.AnyOthDisall);
    A(587, EQ(ED.TotExpDisall, sum3),
      "Part B-TI (Part B3): Sl. 3(x) — total expenditure to be disallowed must equal the sum of Sl. 3(i) to 3(ix).");
    /* A588 — 4(i) income chargeable u/s 115BBI = total of Sl. 7 of Schedule 115BBI. */
    A(588, EQ(ADD.IncChargSec115BBI, bbi7),
      "Part B-TI (Part B3): Sl. 4(i) — income chargeable u/s 115BBI must equal the total of Sl. 7 of Schedule 115BBI.");
    /* A589 — 4(ii) additions (anonymous donation) = Diii of Schedule VC. */
    A(589, EQ(ADD.IncExemptNotAvail, vcDiii),
      "Part B-TI (Part B3): Sl. 4(ii) — additions must equal Diii of Schedule VC.");
    /* A590 — 4(vii) total additions = sum of 4i + 4ii + 4iii + 4iv + 4v + 4vi. */
    const sum4 = N(ADD.IncChargSec115BBI)+N(ADD.IncExemptNotAvail)+N(ADD.IncChargSec122)
      +N(ADD.IncExpl3B)+N(ADD.IncExpl1B)+N(ADD.AnyOthrIncome);
    A(590, EQ(ADD.TotAdditions, sum4),
      "Part B-TI (Part B3): Sl. 4(vii) — total additions must equal the sum of Sl. (4i + 4ii + 4iii + 4iv + 4v + 4vi).");
    /* A591 — 6 sum total = (1 − 2 + 3x) + 4vii + 5. */
    A(591, EQ(C.SumTotal, N(C.TotIncPrevYr)-N(C.TotExpIncur)+N(ED.TotExpDisall)
        +N(ADD.TotAdditions)+N(C.IncChargSec114)),
      "Part B-TI (Part B3): Sl. 6 — sum total must equal [(1 − 2 + 3x) + 4vii + 5].");
    /* A592 — 7(i) income from house property = Sl. 3 of Schedule HP. */
    A(592, EQz(INF.IncFromHP, hp3),
      "Part B-TI (Part B3): Sl. 7(i) — income from house property must equal Sl. 3 of Schedule HP.");
    /* A593 — 7(ii) profits & gains of business or profession = D48 of Schedule BP. */
    A(593, EQz(INF.ProfitGainsBP, bpD),
      "Part B-TI (Part B3): Sl. 7(ii) — profits and gains of business or profession must equal Sl. D48 of Schedule BP.");
    /* A594 — 7(iii)(av) total short-term = sum of ai + aii + aiii + aiv. */
    A(594, EQ(st.TotalShortTerm, N(st.ShortTerm20Per)+N(st.ShortTerm30Per)
        +N(st.ShortTermAppRate)+N(st.ShortTermSplRateDTAA)),
      "Part B-TI (Part B3): Sl. 7(iii)(av) — total short-term capital gains must equal the sum of ai + aii + aiii + aiv.");
    /* A595 — 7(iii)(biii) total long-term = sum of bi + bii. */
    A(595, EQ(lt.TotalLongTerm, N(lt.LongTerm12_5Per)+N(lt.LongTermSplRateDTAA)),
      "Part B-TI (Part B3): Sl. 7(iii)(biii) — total long-term capital gains must equal the sum of bi + bii.");
    /* A596 — 7(iii)(d) capital gain @30% u/s 115BBH = C2 of Schedule CG. */
    A(596, EQz(cg.CapGains30Per115BBH, cgC2),
      "Part B-TI (Part B3): Sl. 7(iii)(d) — capital gain chargeable u/s 115BBH must equal C2 of Schedule CG.");
    /* A597 — 7(iii)(e) total capital gains = sum of 7iii(c + d). */
    A(597, EQ(cg.TotalCapGains, N(cg.ShortTermLongTermTotal)+N(cg.CapGains30Per115BBH)),
      "Part B-TI (Part B3): Sl. 7(iii)(e) — total capital gains must equal the sum of 7iii(c + d).");
    /* A598 — 7(iii)(c) sum of short-term / long-term = (av) + (biii). */
    A(598, EQ(cg.ShortTermLongTermTotal, N(st.TotalShortTerm)+N(lt.TotalLongTerm)),
      "Part B-TI (Part B3): Sl. 7(iii)(c) — sum of short-term and long-term capital gains must equal (av) + (biii).");
    /* A599 — 7(iv) income from other sources = Sl. 9 of Schedule OS. */
    A(599, EQz(INF.IncOS, os9),
      "Part B-TI (Part B3): Sl. 7(iv) — income from other sources must equal Sl. 9 of Schedule OS.");
    /* A600 — 7(v) total = 7i + 7ii + 7iiie + 7iv. */
    A(600, EQ(INF.Total, N(INF.IncFromHP)+N(INF.ProfitGainsBP)+N(cg.TotalCapGains)+N(INF.IncOS)),
      "Part B-TI (Part B3): Sl. 7(v) — total must equal the sum of (7i + 7ii + 7iiie + 7iv).");
    /* A601 — 8 current-year losses to be set off = (2xiv + 3xiv + 4xiv) of Schedule CYLA. */
    A(601, EQ(C.LossCurYrToBeSetOff, cylaSet),
      "Part B-TI (Part B3): Sl. 8 — losses of the current year to be set off must equal (2xiv + 3xiv + 4xiv) of Schedule CYLA.");
    /* A602 — 9 total income = (6 + 7 − 8). */
    A(602, EQ(C.TotalInc, N(C.SumTotal)+N(INF.Total)-N(C.LossCurYrToBeSetOff)),
      "Part B-TI (Part B3): Sl. 9 — total income must equal the difference (6 + 7 − 8).");
    /* A603 — 11 anonymous donation taxed u/s 115BBC @30% = Diii of Schedule VC. */
    A(603, EQ(C.AnonymousDonation, vcDiii),
      "Part B-TI (Part B3): Sl. 11 — anonymous donation to be taxed u/s 115BBC @30% must equal Diii of Schedule VC.");
    /* A604 — 10 income chargeable at special rates = total of col. (i) of Schedule SI. */
    A(604, EQ(C.IncIncludedChargRateSpec, siCol),
      "Part B-TI (Part B3): Sl. 10 — income included in Sl. 9 and chargeable at special rates must equal the total of col. (i) of Schedule SI.");
    /* A605 — 12 income chargeable u/s 115BBI @30% = Sl. 7 of Schedule 115BBI. */
    A(605, EQ(C.IncChargSec115BBI, bbi7),
      "Part B-TI (Part B3): Sl. 12 — income chargeable u/s 115BBI @30% must equal Sl. 7 of Schedule 115BBI.");
    /* A606 — Sl. 1 to 13 may be entered only when exemption is claimed u/s 11 or 10(23C)(iv)/(v)/(vi)/(via). */
    A(606, exsec==="" || inSet(exsec,B3SET),
      "Part B-TI (Part B3): the values at Sl. 1 to 13 may be entered only when exemption is claimed u/s 11 or 10(23C)(iv)/(v)/(vi)/(via) under filing status.");
    /* A607 — 7(iii)(aii) short-term @30% > 0 ⇒ Table E of Sch CG filled and the amount = 8iii of item E. */
    A(607, N(st.ShortTerm30Per)<=0 || (hasCGE && EQz(st.ShortTerm30Per, cg8iii)),
      "Part B-TI (Part B3): Sl. 7(iii)(aii) short-term chargeable @30% is greater than nil — Table E of Schedule CG must be filled and the amount must equal 8iii of item E.");
    /* A608 — 7(iii)(aiii) short-term at applicable rate > 0 ⇒ Table E of Sch CG filled and the amount = 8iv of item E. */
    A(608, N(st.ShortTermAppRate)<=0 || (hasCGE && EQz(st.ShortTermAppRate, cg8iv)),
      "Part B-TI (Part B3): Sl. 7(iii)(aiii) short-term chargeable at applicable rate is greater than nil — Table E of Schedule CG must be filled and the amount must equal 8iv of item E.");
  }

  /* =====================================================================
     Part-B1 / general (PartB_TI) — the two serials in range that touch the
     ss.11/12 statement or the completeness of the Statement of Income.
     ===================================================================== */
  /* A572 — Part-B1 Sl. (income chargeable at special rates) = total of col. (i) of Schedule SI. */
  if(TI){
    A(572, EQ(RG(TI,"IncChargeableTaxSplRates",0), siCol),
      "Part B-TI (Part B1): income included in total income and chargeable to tax at special rates must equal the total of col. (i) of Schedule SI.");
  }
  /* A576 — the return may not be filed without a Statement of Income (Part B1 or B2 or B3 of Part B-TI). */
  A(576, !!(TI||TI2||TI3),
    "Part B-TI: the return of income cannot be filed without filling the Statement of Income (Part B1, Part B2 or Part B3 of Part B-TI).");
});
