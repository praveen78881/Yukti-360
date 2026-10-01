/* =====================================================================
   ITR-7 · A.Y. 2026-27 — Category-A validation rules, batch enc_11 (Phase 6).
   Serial range A509–A558 (Schedule Part B-TI — the trust/institution total-
   income statement: Part-B1 = PartB_TI, Part-B2 = PartB_TI2). Registered via
   ruleset(fn); runRules() invokes it with (I,S_,A,Dd). A(n,cond,msg) fires
   (pushes a Category-A block) when cond — the "this return is lawful"
   assertion — is FALSE. Every read is guarded (RG / (X||{}) / N()); nothing
   throws. Keys are the built-return ITR7 schema paths
   (I = Object.values(buildReturn().ITR)[0]); the paths and the exemption /
   registration enum codes were taken from
   sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json, books/ITR-7/PART_B_TI_TTI.md
   + enums.json, and the built section 70_sec_tax.js (expTaxB1 / expTaxB2).
   Encoded from each rule's own re-joined (line-unwrapped) text.

   The rules.json line-wrap offsets each serial's text by ~one physical line
   (rule n = tail of entry n + head of entry n+1); the assertions below are
   encoded to the RE-JOINED semantic rule, not the raw fragment.

   Scope discipline (mirrors enc_01): every Part-B1 check enters only under
   `if(I.PartB_TI){…}` and every Part-B2 check only under `if(I.PartB_TI2){…}`,
   so the batch is silent whenever the regime that owns the field is not the
   live one (only one Part-B regime is filed). The exemption-amount and
   application feeds (Schedule A/I/IA → app) are Phase-4 stubs (0); the
   exemption-vs-receipts and exemption-vs-registration checks therefore stay
   inert until those feeds emit, exactly as the A34–A37 / A50 / A53 app-fed
   checks do in enc_01 — but they are encoded, not faked.

   Serials in A509–A558 NOT encoded here, and why (2 re-filed OFFLINE-IMPOSSIBLE,
   never faked):
     A510 — "Part-B1 Sl. No. 2 should be zero" targets item 2 =
            PartB_TI.VoluntaryContributions.TotIncFromVC (the corpus /
            voluntary-contribution line), which is legitimately non-zero on a
            lawful s.11 trust that receives contributions (the reference client
            emits 75,00,000 there). The line-wrapped fragment carries no
            qualifying condition, so a literal unconditional "must be zero"
            assertion would fire on the lawful client — no non-vacuous,
            non-false-firing encoding exists in this V0.1 build.
     A550 — "Income entered in return and tax is not computed on the same" is a
            portal-side tax-computation assertion. The built return ALWAYS
            computes the tax (engTax runs on every build), and a lawful trust
            whose income is within the slab bears zero tax legitimately, so
            asserting "tax > 0 whenever income > 0" would false-fire. There is
            no non-vacuous, non-false-firing target field for this rule.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const gt0 = v => N(v) > 0;                       /* "> 0 / claimed"           */
  const eqn = (a,b) => N(a) === N(b);              /* integer-equal (both round) */

  /* ---- Part A-General filing-status reads (guarded, mirror enc_01) ---- */
  const G1  = RG(I,"PartA_GEN1",{})||{};
  const OI  = RG(G1,"OrgFirmInfo",{})||{};
  const exsec  = String(OI.SecExemptionClaimed==null?"":OI.SecExemptionClaimed);
  const regITA = RG(G1,"RegApprUnderITADtls",[])||[];      /* registration under the IT Act */
  const regHas = code => Array.isArray(regITA) &&
                 regITA.some(r=>r && String(r.SectionRegistered)===code);
  const inList = (v,arr) => arr.indexOf(v)>=0;
  const SEC1021 = ["21","2135I"];                          /* 10(21) or 10(21) r.w.s. 35(1) */

  /* =====================================================================
     Part-B1 (PartB_TI) — ss.11/12 or 10(23C)(iv)/(v)/(vi)/(via) trusts
     ===================================================================== */
  if(I.PartB_TI){
    const B1 = I.PartB_TI||{};

    /* A509 — application/exemption claimed with no income in Schedule VC and AI. */
    const applied = N(RG(B1,"TIDeductions.TotalDeductions",0));
    const VCtot   = N(RG(I,"ScheduleVC.TotalContribution",0));
    const AItot   = N(RG(I,"ScheduleAI.TotalofAggregateIncomes",0));
    A(509, !(applied>0 && VCtot===0 && AItot===0),
      "Part B-TI (Part-B1): application/exemption is claimed although there is no income in Schedule VC and Schedule AI.");

    /* A511 — 10iii Ai (short-term @20%) > 0 ⇒ Table E of Schedule CG must be
       filled and the amount must equal item E (short-term @20%) of Sch CG. */
    const st20 = N(RG(B1,"CapGain.ShortTerm.ShortTerm20Per",0));
    A(511, !gt0(st20) || (!!I.ScheduleCG &&
        eqn(st20, RG(I,"ScheduleCG.CurrYrLosses.InStcg20Per.CurrYrCapGain",0))),
      "Part B-TI (Part-B1): short-term capital gain chargeable @20% (10iii Ai) is claimed, so Table E of Schedule CG must be filled and the amount must equal item E (short-term @20%) of Schedule CG.");

    /* A512 — 10iii Bi (long-term @12.5%) > 0 ⇒ Table E of Schedule CG must be
       filled and the amount must equal 8vi of item E of Sch CG. */
    const lt125 = N(RG(B1,"CapGain.LongTerm.LongTerm12_5Per",0));
    A(512, !gt0(lt125) || (!!I.ScheduleCG &&
        eqn(lt125, RG(I,"ScheduleCG.CurrYrLosses.InLtcg12_5Per.CurrYrCapGain",0))),
      "Part B-TI (Part-B1): long-term capital gain chargeable @12.5% (10iii Bi) is claimed, so Table E of Schedule CG must be filled and the amount must equal 8vi of item E of Schedule CG.");
  }

  /* =====================================================================
     Part-B2 (PartB_TI2) — s.13A/13B or 10(21)…10(47)
     ===================================================================== */
  if(I.PartB_TI2){
    const B2 = I.PartB_TI2||{};
    const ex = k => N(RG(B2,k,0));                          /* an exemption amount */

    /* Schedule IE receipt totals (guarded; IE-3/IE-4 are repeatable) */
    const IE1 = N(RG(I,"ScheduleIE_I.TotRcptVoluntaryContr",0));
    const IE2 = N(RG(I,"ScheduleIE_II.TotRcptVoluntaryContr",0));
    const ie3 = RG(I,"ScheduleIE_III.ScheduleIEIIIDtls",[])||[];
    const IE3 = (Array.isArray(ie3)?ie3:[]).reduce((a,r)=>a+N(r&&r.TotRcptVoluntaryContr),0);
    const ie4 = RG(I,"ScheduleIE_IV.ScheduleIEIVDtls",[])||[];
    const IE4 = (Array.isArray(ie4)?ie4:[]).reduce((a,r)=>a+N(r&&r.GrossAnnualReceipts),0);

    /* exemption claimed (>0) ⇒ the matching section is selected in filing status */
    const sel  = (amt,code) => !gt0(amt) || exsec===code;
    const selL = (amt,arr)  => !gt0(amt) || inList(exsec,arr);
    /* exemption claimed (>0) ⇒ it equals the corresponding Schedule-IE receipts */
    const eqRc = (amt,rc)   => !gt0(amt) || eqn(amt,rc);

    /* ---- 10(21) — field 1a ---- */
    const e1021 = ex("ExemptionUs1021");
    A(513, selL(e1021,SEC1021),
      "Part B-TI (Part-B2): exemption is claimed under section 10(21) (field 1a) but neither Section 10(21) nor Section 10(21) r.w.s. 35(1) is selected under the filing status in Schedule PI.");
    A(514, eqRc(e1021,IE1),
      "Part B-TI (Part-B2): exemption claimed under section 10(21) (field 1a) must equal the total receipts including voluntary contribution (Sl. No. 1) in Schedule IE-1.");

    /* ---- 10(23A) — field 2a ---- */
    const e23A = ex("ExemptionUs10_23A");
    A(515, sel(e23A,"23A"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(23A) (field 2a) but Section 10(23A) is not selected under the filing status in Schedule PI.");
    A(516, eqRc(e23A,IE2),
      "Part B-TI (Part-B2): exemption claimed under section 10(23A) (field 2a) must equal the total receipts including voluntary contribution in Schedule IE-2.");

    /* ---- 10(23AAA) — field 1b ---- */
    const e23AAA = ex("ExemptionUs10_23AAA");
    A(517, sel(e23AAA,"23AAA"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(23AAA) (field 1b) but Section 10(23AAA) is not selected under the filing status in Schedule PI.");
    A(518, eqRc(e23AAA,IE1),
      "Part B-TI (Part-B2): exemption claimed under section 10(23AAA) (field 1b) must equal the total receipts including voluntary contribution in Schedule IE-1.");

    /* ---- 10(23B) — field 1c ---- */
    const e23B = ex("ExemptionUs10_23B");
    A(519, sel(e23B,"23B"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(23B) (field 1c) but Section 10(23B) is not selected under the filing status in Schedule PI.");
    A(520, eqRc(e23B,IE1),
      "Part B-TI (Part-B2): exemption claimed under section 10(23B) (field 1c) must equal the total receipts including voluntary contribution in Schedule IE-1.");

    /* ---- 10(23EC) — field 1f ---- */
    const e23EC = ex("ExemptionUs10_23EC");
    A(521, sel(e23EC,"23EC"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(23EC) (field 1f) but Section 10(23EC) is not selected under the filing status in Schedule PI.");
    A(522, eqRc(e23EC,IE1),
      "Part B-TI (Part-B2): exemption claimed under section 10(23EC) (field 1f) must equal the total receipts including voluntary contribution (Sl. No. 1) in Schedule IE-1.");

    /* ---- 10(23ED) — field 1g ---- */
    const e23ED = ex("ExemptionUs10_23ED");
    A(523, sel(e23ED,"23ED"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(23ED) (field 1g) but Section 10(23ED) is not selected under the filing status in Schedule PI.");
    A(524, eqRc(e23ED,IE1),
      "Part B-TI (Part-B2): exemption claimed under section 10(23ED) (field 1g) must equal the total receipts including voluntary contribution (Sl. No. 1) in Schedule IE-1.");

    /* ---- 10(23EE) — field 1h ---- */
    const e23EE = ex("ExemptionUs10_23EE");
    A(525, sel(e23EE,"23EE"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(23EE) (field 1h) but Section 10(23EE) is not selected under the filing status in Schedule PI.");
    A(526, eqRc(e23EE,IE1),
      "Part B-TI (Part-B2): exemption claimed under section 10(23EE) (field 1h) must equal the total receipts including voluntary contribution (Sl. No. 1) in Schedule IE-1.");

    /* ---- 10(29A) — field 1j ---- */
    const e29A = ex("ExemptionUs10_29A");
    A(527, sel(e29A,"29A"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(29A) (field 1j) but Section 10(29A) is not selected under the filing status in Schedule PI.");
    A(528, eqRc(e29A,IE1),
      "Part B-TI (Part-B2): exemption claimed under section 10(29A) (field 1j) must equal the total receipts including voluntary contribution in Schedule IE-1.");

    /* ---- 10(23C)(iiiab) — field 2b ---- */
    const e2Cab = ex("ExemptionUs10_23Ciiiab");
    A(529, sel(e2Cab,"23CIIIAB"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(23C)(iiiab) (field 2b) but Section 10(23C)(iiiab) is not selected under the filing status in Schedule PI.");
    A(530, eqRc(e2Cab,IE3),
      "Part B-TI (Part-B2): exemption claimed under section 10(23C)(iiiab) (field 2b) must equal the total receipts including voluntary contribution in Schedule IE-3.");

    /* ---- 10(23C)(iiiac) — field 2c ---- */
    const e2Cac = ex("ExemptionUs10_23Ciiiac");
    A(531, sel(e2Cac,"23CIIIAC"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(23C)(iiiac) (field 2c) but Section 10(23C)(iiiac) is not selected under the filing status in Schedule PI.");
    A(532, eqRc(e2Cac,IE3),
      "Part B-TI (Part-B2): exemption claimed under section 10(23C)(iiiac) (field 2c) must equal the total receipts including voluntary contribution in Schedule IE-3.");

    /* ---- 10(23C)(iiiad) — field 2d ---- */
    const e2Cad = ex("ExemptionUs10_23Ciiiad");
    A(533, sel(e2Cad,"23CIIIAD"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(23C)(iiiad) (field 2d) but Section 10(23C)(iiiad) is not selected under the filing status in Schedule PI.");
    A(534, eqRc(e2Cad,IE4),
      "Part B-TI (Part-B2): exemption claimed under section 10(23C)(iiiad) (field 2d) must equal the Gross Annual Receipts in Schedule IE-4.");

    /* ---- 10(23C)(iiiae) — field 2e ---- */
    const e2Cae = ex("ExemptionUs10_23Ciiiae");
    A(535, sel(e2Cae,"23CIIIAE"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(23C)(iiiae) (field 2e) but Section 10(23C)(iiiae) is not selected under the filing status in Schedule PI.");
    A(536, eqRc(e2Cae,IE4),
      "Part B-TI (Part-B2): exemption claimed under section 10(23C)(iiiae) (field 2e) must equal the Gross Annual Receipts in Schedule IE-4.");

    /* ---- 10(23D) — field 1d ---- */
    const e23D = ex("ExemptionUs10_23D");
    A(537, sel(e23D,"23D"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(23D) (field 1d) but Section 10(23D) is not selected under the filing status in Schedule PI.");
    A(538, eqRc(e23D,IE1),
      "Part B-TI (Part-B2): exemption claimed under section 10(23D) (field 1d) must equal the total receipts including voluntary contribution in Schedule IE-1.");

    /* ---- 10(23DA) — field 1e ---- */
    const e23DA = ex("ExemptionUs10_23DA");
    A(539, sel(e23DA,"23DA"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(23DA) (field 1e) but Section 10(23DA) is not selected under the filing status in Schedule PI.");
    A(540, eqRc(e23DA,IE1),
      "Part B-TI (Part-B2): exemption claimed under section 10(23DA) (field 1e) must equal the total receipts including voluntary contribution in Schedule IE-1.");

    /* ---- 10(23FB) — field 1i ---- */
    const e23FB = ex("ExemptionUs10_23FB");
    A(541, sel(e23FB,"23FB"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(23FB) (field 1i) but Section 10(23FB) is not selected under the filing status in Schedule PI.");
    A(542, eqRc(e23FB,IE1),
      "Part B-TI (Part-B2): exemption claimed under section 10(23FB) (field 1i) must equal the total receipts including voluntary contribution in Schedule IE-1.");

    /* ---- 10(24) — field 2f ---- */
    const e24 = ex("ExemptionUs10_24");
    A(543, sel(e24,"24"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(24) (field 2f) but Section 10(24) is not selected under the filing status in Schedule PI.");
    A(544, eqRc(e24,IE2),
      "Part B-TI (Part-B2): exemption claimed under section 10(24) (field 2f) must equal the total receipts including voluntary contribution in Schedule IE-2.");

    /* ---- 10(46) — field 1k (filing-status enum code for 10(46) is "26") ---- */
    const e46 = ex("ExemptionUs10_46");
    A(545, sel(e46,"26"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(46) (field 1k) but Section 10(46) is not selected under the filing status in Schedule PI.");
    A(546, eqRc(e46,IE1),
      "Part B-TI (Part-B2): exemption claimed under section 10(46) (field 1k) must equal the total receipts including voluntary contribution in Schedule IE-1.");

    /* ---- 10(47) — field 1n ---- */
    const e47 = ex("ExemptionUs10_47");
    A(547, sel(e47,"47"),
      "Part B-TI (Part-B2): exemption is claimed under section 10(47) (field 1n) but Section 10(47) is not selected under the filing status in Schedule PI.");
    A(548, eqRc(e47,IE1),
      "Part B-TI (Part-B2): exemption claimed under section 10(47) (field 1n) must equal the total receipts including voluntary contribution in Schedule IE-1.");

    /* A549 — Sl. No. 3 (income chargeable u/s 11(3) r.w. 10(21)) entered ⇒
       Section 10(21) or 10(21) r.w.s. 35(1) selected under filing status. */
    A(549, !gt0(ex("IncomeChargeable11_3")) || inList(exsec,SEC1021),
      "Part B-TI (Part-B2): a value is entered at Sl. No. 3 (income chargeable u/s 11(3) r.w. 10(21)) but neither Section 10(21) nor Section 10(21) r.w.s. 35(1) is selected under the filing status in Schedule PI.");

    /* A551 — exemption at 1a (s.10(21)) ⇒ Section 35 (code IX) in the Part A-General
       registration/approval-under-the-Income-tax-Act table. */
    A(551, !gt0(ex("ExemptionUs1021")) || regHas("IX"),
      "Part B-TI (Part-B2): exemption is claimed at Sl. No. 1a (section 10(21)) so Section 35 must be selected in Part A-General — Details of registration/provisional registration or approval under the Income-tax Act.");

    /* A552 — exemption at Sl. No. 5 (s.13B, electoral trust) ⇒ Section 13B (code VIII)
       in the Part A-General registration table. */
    A(552, !gt0(ex("ExemptionUs13_B")) || regHas("VIII"),
      "Part B-TI (Part-B2): exemption is claimed at Sl. No. 5 (section 13B) so Section 13B must be selected in Part A-General — Details of registration/provisional registration or approval under the Income-tax Act.");

    /* A553 — exemption at 1b (s.10(23AAA)) ⇒ Section 10(23AAA) (code I) in the
       Part A-General registration table. */
    A(553, !gt0(ex("ExemptionUs10_23AAA")) || regHas("I"),
      "Part B-TI (Part-B2): exemption is claimed at Sl. No. 1b (section 10(23AAA)) so Section 10(23AAA) must be selected in Part A-General — Details of registration/provisional registration or approval under the Income-tax Act.");

    /* A554 — 7(i) (income from house property) = Sl. No. 3 of Schedule HP
       (entered nil if a loss). */
    A(554, eqn(RG(B2,"IncomeFromHP",0),
               Math.max(0, N(RG(I,"ScheduleHP.TotalIncomeChargeableUnHP",0)))),
      "Part B-TI (Part-B2): value at Sl. No. 7(i) (income from house property) must equal Sl. No. 3 of Schedule HP.");

    /* A555 — 7iii(Aii) (short-term @30%) = 8iii of item E of Schedule CG. */
    A(555, eqn(RG(B2,"CapGain.ShortTerm.ShortTerm30Per",0),
               RG(I,"ScheduleCG.CurrYrLosses.InStcg30Per.CurrYrCapGain",0)),
      "Part B-TI (Part-B2): value at Sl. No. 7iii(Aii) (income under Capital Gains, short-term @30%) must equal item E(8iii) of Schedule CG.");

    /* A556 — 7iii(Aiii) (short-term at applicable rate) = 8iv of item E of Sch CG. */
    A(556, eqn(RG(B2,"CapGain.ShortTerm.ShortTermAppRate",0),
               RG(I,"ScheduleCG.CurrYrLosses.InStcgAppRate.CurrYrCapGain",0)),
      "Part B-TI (Part-B2): value at Sl. No. 7iii(Aiii) (income under Capital Gains, short-term at applicable rate) must equal item E(8iv) of Schedule CG.");

    /* A557 — 7iii(Aiv) (short-term at DTAA rate) = 8v of item E of Sch CG. */
    A(557, eqn(RG(B2,"CapGain.ShortTerm.ShortTermSplRateDTAA",0),
               RG(I,"ScheduleCG.CurrYrLosses.InStcgDTAARate.CurrYrCapGain",0)),
      "Part B-TI (Part-B2): value at Sl. No. 7iii(Aiv) (income under Capital Gains, short-term at special rates as per DTAA) must equal item E(8v) of Schedule CG.");

    /* A558 — 7iii(Av) (total short-term) = 7iii(Ai + Aii + Aiii + Aiv). */
    const cgST = RG(B2,"CapGain.ShortTerm",{})||{};
    A(558, eqn(cgST.TotalShortTerm,
               N(cgST.ShortTerm20Per)+N(cgST.ShortTerm30Per)+
               N(cgST.ShortTermAppRate)+N(cgST.ShortTermSplRateDTAA)),
      "Part B-TI (Part-B2): value at Sl. No. 7iii(Av) (total short-term) must equal 7iii(Ai + Aii + Aiii + Aiv).");
  }
});
