/* =====================================================================
   ITR-7 · A.Y. 2026-27 — Category-A validation rules, batch enc_09 (Phase 6).
   Serial range A409–A458. Registered via ruleset(fn); runRules() invokes it
   with (I,S_,A,Dd). A(n,cond,msg) fires (pushes a Category-A block) when cond
   — the "this return is lawful" assertion — is FALSE. Every read is guarded
   (RG / (X||{}) / N()); nothing throws. Keys are the built-return ITR7 schema
   paths (I = Object.values(buildReturn().ITR)[0]); the paths were taken from
   sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json, the built sections
   70_sec_si.js (expSi → ScheduleSI SecCode enum / Schedule115TD /
   Schedule115BBI), 70_sec_os.js (item-2 special-rate 2c/2d per-code tables),
   70_sec_cg.js (S.C.cg.siFeed split from the after-set-off gain →
   ScheduleCG.CurrYrLosses.<bucket>.CurrYrCapGain), 70_sec_cyla.js (col-5
   IncOfCurYrAfterSetOff heads), 70_sec_fa.js (expFa → ScheduleFSI) and
   books/ITR-7/{Schedule_SI,Schedule_OS,Schedule_CG,Schedule_CYLA,
   Schedule_115TD,Schedule_115BBI,Schedule_FSI,Schedule_J,Schedule_I,
   Schedule_D,rule_census}.md. Encoded from each rule's own re-joined text
   (constitution rule 6): rules.json is line-wrapped (entry n = tail of n−1 +
   head of n), so each assertion below is encoded to the semantic rule, not the
   raw fragment.

   BOUND METHOD (mirrors enc_08 A384–A408 / A389 and enc_06 A265–A273).
   The Schedule-SI special-rate feed is auto-populated FROM the source schedule
   (OS item-2 per code, or the CG after-set-off gain), so on every lawful return
   SI[code] ≤ the source figure. The SI↔OS/CG cross-checks are therefore encoded
   as the SAFE UPPER BOUND  SI ≤ source (±1): silent on every lawful return
   (SI is fed from the source), silent on a self-consistent non-zero CG/OS/SI
   return, firing only when the SI head OVER-states its feeding schedule. Each
   family is entered only under its source-schedule guard (if(I.ScheduleOS) /
   if(I.ScheduleCG) / if(I.ScheduleCYLA)) so an absent source never false-fires.

   ENCODED here (49 serials):
     A409–A426 (18) — SI per-code ≤ OS 2c/OthersGrossDtls[] or 2d/
       PTIOthersGrossDtls[] (keyed by SourceDescription = the SI SecCode),
       A424 ≤ OS 2aii IncChrgblUs115BBJ.                    [if(I.ScheduleOS)]
     A427–A428 (2)  — Σ(LTCG@12.5% | STCG@20% SI codes) ≤ Schedule CYLA
       5ix | 5v (IncOfCurYrAfterSetOff).                    [if(I.ScheduleCYLA)]
     A429–A430 (2)  — SI 2nd-proviso-194LC(1) code ≤ OS 2c / 2d.[if(I.ScheduleOS)]
     A431–A444 (14) — SI per-code ≤ the materialised Schedule CG bucket gain
       ScheduleCG.CurrYrLosses.<InStcg20Per/InStcg30Per/InLtcg12_5Per>.
       CurrYrCapGain (the after-set-off gain the siFeed is split from). [if(I.ScheduleCG)]
     A445–A450 (6)  — Schedule 115TD arithmetic / gates.
     A451–A453,A455 (4) — Schedule 115BBI cross-totals & gate.
     A456–A458 (3)  — Schedule FSI relief / total / residency.

   NOT encoded — re-filed OFFLINE-IMPOSSIBLE (1 serial; never faked):
     A454 (1) — "Schedule 115BBI Sl.No.6 ≥ Total of Sl.No.(i)+(ii) of Col 10 of
       A1 of Schedule J". Schedule J A1 Col 10 in this build is a SINGLE column
       (per-row Investment_11_5_Other, total TotInvestment_11_5_Other; verified
       against the schema — no other Col-10 leaf exists); the rule's "(i) and
       (ii)" sub-rows of Col 10 are not modelled as discrete fields, so the ≥
       comparison has no faithful operand.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0 = v=>v!=null&&String(v).trim()!=="";        /* "present / non-blank" */
  const eqR= (a,b)=>Math.abs(N(a)-N(b))<=1;            /* integer equality, ±1 rounding slack */
  const arr= v=>Array.isArray(v)?v:[];
  const LE = (si,src)=>N(si)<=N(src)+1;                /* safe upper bound (±1) */

  /* exemption regime + residency (Part A-General), read exactly as enc_01 */
  const OI  = RG(RG(I,"PartA_GEN1",{})||{},"OrgFirmInfo",{})||{};
  const FS  = RG(RG(I,"PartA_GEN1",{})||{},"FilingStatus",{})||{};
  const exsec = String(OI.SecExemptionClaimed==null?"":OI.SecExemptionClaimed);
  /* Schedule 115TD / 115BBI are permitted only under s.11 or s.10(23C)(iv/v/vi/via) */
  const EX_TD = ["11","23CIV","23CV","23CVI","23CVIA"];
  const inList= (v,arr)=>arr.indexOf(v)>=0;

  /* =====================================================================
     Schedule SI ↔ OS / CG / CYLA cross-checks (A409–A444), all as safe upper
     bounds. ScheduleSI.SplCodeRateTax[] is keyed by the schema SecCode; the OS
     item-2 per-code tables OthersGrossDtls[] (2c) and PTIOthersGrossDtls[] (2d)
     are keyed by SourceDescription = the same SecCode (see enc_08 A392–A408);
     the CG feed is the after-set-off gain ScheduleCG.CurrYrLosses.<bucket>.
     CurrYrCapGain (70_sec_cg.js splitSI(...,after.st20/st30/lt125,...)).
     ===================================================================== */
  if(I.ScheduleSI){
    const siRows = arr(RG(I,"ScheduleSI.SplCodeRateTax",[]));
    const siInc  = function(code){ var t=0; siRows.forEach(function(r){ if(r&&r.SecCode===code) t+=N(r.SplRateInc); }); return t; };
    const OS = RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};
    const os2c= function(code){ var t=0; arr(RG(OS,"OthersGrossDtls",[])).forEach(function(r){ if(r&&r.SourceDescription===code) t+=N(r.SourceAmount); }); return t; };
    const os2d= function(code){ var t=0; arr(RG(OS,"PTIOthersGrossDtls",[])).forEach(function(r){ if(r&&r.SourceDescription===code) t+=N(r.SourceAmount); }); return t; };
    const cgCap = function(b){ return N(RG(I,"ScheduleCG.CurrYrLosses."+b+".CurrYrCapGain",0)); };
    const cyla5 = function(h){ return N(RG(I,"ScheduleCYLA."+h+".IncCYLA.IncOfCurYrAfterSetOff",0)); };

    /* --- A409–A426 : each SI per-section special income ≤ its OS item-2 line
       (2c/OthersGrossDtls[] or 2d/PTIOthersGrossDtls[], after DTAA), and
       A424 (115BBJ) ≤ OS 2aii. Only when Schedule OS is present. --- */
    if(I.ScheduleOS){
      A(409, LE(siInc("PTI_5A1aiiab"), os2d("PTI_5A1aiiab")),
        "Schedule SI: pass-through special income u/s 115A(1)(a)(iiab) must match the corresponding income at Sl.No.2d of Schedule OS.");
      A(410, LE(siInc("PTI_5A1aiiac"), os2d("PTI_5A1aiiac")),
        "Schedule SI: pass-through special income u/s 115A(1)(a)(iiac) must match the corresponding income at Sl.No.2d of Schedule OS.");
      A(411, LE(siInc("PTI_5A1aiii"), os2d("PTI_5A1aiii")),
        "Schedule SI: pass-through special income u/s 115A(1)(a)(iii) must match the corresponding income at Sl.No.2d of Schedule OS.");
      A(412, LE(siInc("PTI_5A1bA"), os2d("PTI_5A1bA")),
        "Schedule SI: pass-through special income u/s 115A(1)(b) must match the corresponding income at Sl.No.2d of Schedule OS.");
      A(413, LE(siInc("PTI_5AC1ab"), os2d("PTI_5AC1ab")),
        "Schedule SI: pass-through special income u/s 115AC(1)(a) must match the corresponding income at Sl.No.2d of Schedule OS.");
      A(414, LE(siInc("PTI_5AD1i"), os2d("PTI_5AD1i")),
        "Schedule SI: pass-through special income u/s 115AD(1)(i) (interest/other) must match the corresponding income at Sl.No.2d of Schedule OS.");
      A(415, LE(siInc("PTI_5AD1iDiv"), os2d("PTI_5AD1iDiv")),
        "Schedule SI: pass-through special income u/s 115AD(1)(i) (dividend) must match the corresponding income at Sl.No.2d of Schedule OS.");
      A(416, LE(siInc("PTI_5BBA"), os2d("PTI_5BBA")),
        "Schedule SI: pass-through special income u/s 115BBA must match the corresponding income at Sl.No.2d of Schedule OS.");
      A(417, LE(siInc("PTI_5BBC"), os2d("PTI_5BBC")),
        "Schedule SI: pass-through special income u/s 115BBC must match the corresponding income at Sl.No.2d of Schedule OS.");
      A(418, LE(siInc("5A1aiiaaP"), os2c("5A1aiiaaP")),
        "Schedule SI: special income (interest referred to in the proviso to section 194LC(1)) offered u/s 115A(1)(a)(iiaa) must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(419, LE(siInc("PTI_5A1aiiaaP"), os2d("PTI_5A1aiiaaP")),
        "Schedule SI: pass-through special income (interest referred to in the proviso to section 194LC(1)) u/s 115A(1)(a)(iiaa) must match the corresponding income at Sl.No.2d of Schedule OS.");
      A(420, LE(siInc("5AD1i"), os2c("5AD1i")),
        "Schedule SI: special income u/s 115AD(1)(i) must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(421, LE(siInc("PTI_5AD1i"), os2d("PTI_5AD1i")),
        "Schedule SI: pass-through special income u/s 115AD(1)(i) must match the corresponding income at Sl.No.2d of Schedule OS.");
      A(422, LE(siInc("5AC1abD"), os2c("5AC1abD")),
        "Schedule SI: special income u/s 115AC(1)(b) (dividend from GDRs purchased in foreign currency by non-residents) must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(423, LE(siInc("PTI_5AC1abD"), os2d("PTI_5AC1abD")),
        "Schedule SI: pass-through special income u/s 115AC(1)(b) (dividend from GDRs purchased in foreign currency by non-residents) must match the corresponding income at Sl.No.2d of Schedule OS.");
      A(424, LE(siInc("5BBJ"), N(RG(OS,"IncChrgblUs115BBJ",0))),
        "Schedule SI: income u/s 115BBJ (winnings from online games) cannot exceed the corresponding income offered at Sl.No.2a(ii) of Schedule OS (net of DTAA).");
      A(425, LE(siInc("5A1aA"), os2c("5A1aA")),
        "Schedule SI: special income u/s 115A(1)(a)(A) (dividend received by a non-resident/foreign company from a unit in an IFSC, s.80LA(1A)) must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(426, LE(siInc("PTI_5A1aA"), os2d("PTI_5A1aA")),
        "Schedule SI: pass-through special income u/s 115A(1)(a)(A) (dividend from a unit in an IFSC, s.80LA(1A)) must match the corresponding income at Sl.No.2d of Schedule OS.");
    }

    /* --- A427–A428 : the block sum of the LTCG@12.5% / STCG@20% special-rate
       heads ≤ Schedule CYLA Sl.No.5ix / 5v (IncOfCurYrAfterSetOff of the
       LTCG12_5Per / STCG20Per row). Mirrors enc_08 A389. --- */
    if(I.ScheduleCYLA){
      var ltcg125 = siInc("22")+siInc("21ciii")+siInc("5AB1b")+siInc("5AC1c")+siInc("21")
                   +siInc("2A")+siInc("5ADiii")+siInc("5ADiiiP")
                   +siInc("PTI_LTCG12_5P112A")+siInc("PTI_LTCG12_5P");
      A(427, LE(ltcg125, cyla5("LTCG12_5Per")),
        "Schedule SI: the sum of the LTCG chargeable @12.5% heads (112(1), 112(1)(c)(iii), 115AB, 115AC, 112, 112A, 115AD(1)(b)(iii) and the two pass-through LTCG @12.5% heads) cannot exceed the corresponding income at Sl.No.5ix of Schedule CYLA.");
      var stcg20 = siInc("1A")+siInc("5AD1biiP")+siInc("PTI_STCG20P");
      A(428, LE(stcg20, cyla5("STCG20Per")),
        "Schedule SI: the sum of the STCG @20% heads (111A, 115AD(1)(b)(ii) proviso and pass-through STCG @20%) cannot exceed the corresponding income at Sl.No.5v of Schedule CYLA.");
    }

    /* --- A429–A430 : SI "income received by a non-resident as referred in the
       second proviso to section 194LC(1)" (@9%) ≤ OS 2c / 2d. --- */
    if(I.ScheduleOS){
      A(429, LE(siInc("5A1aiiaa2P"), os2c("5A1aiiaa2P")),
        "Schedule SI: special income (income received by a non-resident as referred in the second proviso to section 194LC(1)) offered u/s 115A(1)(a)(iiaa) must match the corresponding income at Sl.No.2c of Schedule OS.");
      A(430, LE(siInc("PTI_5A1aiiaa2P"), os2d("PTI_5A1aiiaa2P")),
        "Schedule SI: pass-through special income (income received by a non-resident as referred in the second proviso to section 194LC(1)) u/s 115A(1)(a)(iiaa) must match the corresponding income at Sl.No.2d of Schedule OS.");
    }

    /* --- A431–A444 : each SI capital-gain special-rate head ≤ the materialised
       Schedule CG bucket gain it is fed from (CurrYrLosses.<bucket>.CurrYrCapGain,
       the after-set-off gain the CG siFeed is split from). Only when Schedule CG
       is present. --- */
    if(I.ScheduleCG){
      A(431, LE(siInc("1A"), cgCap("InStcg20Per")),
        "Schedule SI: income under 111A (STCG on equity share/EOF chargeable to STT) cannot exceed the income offered in Schedule CG at Sl.No.A3ie or A4a (net of DTAA).");
      A(432, LE(siInc("5AD1biiP"), cgCap("InStcg20Per")),
        "Schedule SI: income under 115AD(1)(b)(ii) proviso (STCG referred to in s.111A by an FII) cannot exceed the income offered in Schedule CG at Sl.No.A3iie (net of DTAA).");
      A(433, LE(siInc("22"), cgCap("InLtcg12_5Per")),
        "Schedule SI: income under 112(1) (LTCG on listed securities/units) cannot exceed the income offered in Schedule CG at Sl.No.B3c (net of DTAA).");
      A(434, LE(siInc("21ciii"), cgCap("InLtcg12_5Per")),
        "Schedule SI: income under 112(1)(c)(iii) (LTCG for a non-resident on unlisted securities) cannot exceed the income offered in Schedule CG at Sl.No.B6ic (net of DTAA).");
      A(435, LE(siInc("2A"), cgCap("InLtcg12_5Per")),
        "Schedule SI: income under 112A (LTCG on equity shares/units of EOF/business trust on which STT is paid) cannot exceed the income offered in Schedule CG at Sl.No.B4 (or Col 14 of Schedule 112A), net of DTAA.");
      A(436, LE(siInc("5AB1b"), cgCap("InLtcg12_5Per")),
        "Schedule SI: income under 115AB(1)(b) (LTCG on units purchased in foreign currency by an off-shore fund) cannot exceed the income offered in Schedule CG at Sl.No.B6iic (net of DTAA).");
      A(437, LE(siInc("5AC1c"), cgCap("InLtcg12_5Per")),
        "Schedule SI: income under 115AC(1)(c) (LTCG on transfer of bonds or GDR purchased in foreign currency by a non-resident) cannot exceed the income offered in Schedule CG at Sl.No.B6iiic (net of DTAA).");
      A(438, LE(siInc("5ADii"), cgCap("InStcg30Per")),
        "Schedule SI: income under 115AD(1)(b)(ii) (STCG other than u/s 111A by an FII) cannot exceed the income offered in Schedule CG at Sl.No.A5e (net of DTAA).");
      A(439, LE(siInc("5ADiii"), cgCap("InLtcg12_5Per")),
        "Schedule SI: income under 115AD(1)(b)(iii) (LTCG other than u/s 112A by an FII) cannot exceed the income offered in Schedule CG at Sl.No.B6ivc (net of DTAA).");
      A(440, LE(siInc("5ADiiiP"), cgCap("InLtcg12_5Per")),
        "Schedule SI: income under 115AD(1)(b)(iii) proviso (LTCG for a non-resident on equity share/unit of EOF/business trust on which STT is paid, s.112A) cannot exceed the income offered in Schedule CG at Sl.No.B7 (net of DTAA).");
      A(441, LE(siInc("PTI_STCG20P"), cgCap("InStcg20Per")),
        "Schedule SI: pass-through income in the nature of STCG chargeable @20% cannot exceed the income offered in Schedule CG at Sl.No.A8a (net of DTAA).");
      A(442, LE(siInc("PTI_STCG30P"), cgCap("InStcg30Per")),
        "Schedule SI: pass-through income in the nature of STCG chargeable @30% cannot exceed the income offered in Schedule CG at Sl.No.A8b (net of DTAA).");
      A(443, LE(siInc("PTI_LTCG12_5P112A"), cgCap("InLtcg12_5Per")),
        "Schedule SI: pass-through income in the nature of LTCG chargeable @12.5% u/s 112A cannot exceed the income offered in Schedule CG at Sl.No.B10a1 (net of DTAA).");
      A(444, LE(siInc("PTI_LTCG12_5P"), cgCap("InLtcg12_5Per")),
        "Schedule SI: pass-through income in the nature of LTCG chargeable @12.5% other than u/s 112A cannot exceed the income offered in Schedule CG at Sl.No.B10a2 (net of DTAA).");
    }
  }

  /* =====================================================================
     Schedule 115TD — accreted income / exit tax (A445–A450).
     Fields per expSi()/schema: FMVTotTrustInst(1), LessTotLiaTrustInst(2),
     NetValAsst(3), FMVAsstAcqrdRfrdSec101(4i), FMVAsstAcqPeriodFromDateCrtn
     (4ii), FMVAsstTrnfsrdSec115TD2(4iii), FMVTotal(4iv),
     LiabilityRespectofAsset4Above(5), AccretedIncomeSection115TD(6),
     AddIncIntstPayb(10), TaxIntstPaid(11), NetPaybleRefble(12),
     SpecifiedDateUs115TD(9).
     ===================================================================== */
  if(I.Schedule115TD){
    const TD  = RG(I,"Schedule115TD",{})||{};
    const f1  = N(TD.FMVTotTrustInst), f2 = N(TD.LessTotLiaTrustInst);
    const net = N(TD.NetValAsst);
    const q1  = N(TD.FMVAsstAcqrdRfrdSec101), q2 = N(TD.FMVAsstAcqPeriodFromDateCrtn),
          q3  = N(TD.FMVAsstTrnfsrdSec115TD2);
    const fmv4= N(TD.FMVTotal), liab4 = N(TD.LiabilityRespectofAsset4Above);
    const acc = N(TD.AccretedIncomeSection115TD);
    const i10 = N(TD.AddIncIntstPayb), i11 = N(TD.TaxIntstPaid), i12 = N(TD.NetPaybleRefble);

    /* A445 — item 3 "Net value of assets" = item 1 − item 2. */
    A(445, eqR(net, f1-f2),
      "Schedule 115TD: the net value of assets (item 3) must equal FMV of total assets (item 1) less total liability (item 2).");
    /* A446 — item 4iv "Total" = 4i + 4ii + 4iii. */
    A(446, eqR(fmv4, q1+q2+q3),
      "Schedule 115TD: item 4(iv) Total must equal the sum of items 4(i), 4(ii) and 4(iii).");
    /* A447 — item 6 "Accreted income" = 3 − (4 − 5), not below zero (schema floor). */
    A(447, eqR(acc, Math.max(0, net-(fmv4-liab4))),
      "Schedule 115TD: accreted income (item 6) must equal item 3 minus (item 4 minus item 5).");
    /* A448 — item 12 "Net payable/refundable" = 10 − 11, not below zero (schema floor). */
    A(448, eqR(i12, Math.max(0, i10-i11)),
      "Schedule 115TD: net payable/refundable (item 12) must equal additional tax and interest payable (item 10) minus tax and interest paid (item 11).");
    /* A449 — accreted income entered ⇒ the specified date u/s 115TD (item 9) is not blank. */
    A(449, !(acc>0) || S0(TD.SpecifiedDateUs115TD),
      "Schedule 115TD: accreted income u/s 115TD has been entered but the specified date u/s 115TD (item 9) is blank.");
    /* A450 — Schedule 115TD may be filled only if s.11 or s.10(23C)(iv/v/vi/via) exemption is claimed. */
    A(450, inList(exsec, EX_TD),
      "Schedule 115TD can be filled only when the exemption claimed is Section 11 or Section 10(23C)(iv)/(v)/(vi)/(via).");
  }

  /* =====================================================================
     Schedule 115BBI — specified income @30% (A451–A455).
     Fields per expSi()/schema: DeemedIncSec1023C_113(1), DeemedIncSec111B(2),
     IncDeemedSec131c(3), IncNotExemptSec131d(4), IncNotExcludedSec111c(5),
     IncAccInExcess(6), Total(7).  Cross-schedule totals:
       Sl.1 = Column-15 total of Schedule I  → ITRScheduleI.TotAmountDeemedUs11
       Sl.2 = Column-8  total of Schedule D  → ITRScheduleD.TotAmountNotAppliedCurrAY
     A454 (Sl.6 ≥ Total of (i)+(ii) of Col 10 of A1 of Schedule J) is re-filed
     OFFLINE-IMPOSSIBLE: Schedule J A1 Col 10 is a single column in this build
     (Investment_11_5_Other / TotInvestment_11_5_Other), so the (i)/(ii) sub-rows
     the rule references are not materialised as discrete operands.
     ===================================================================== */
  if(I.Schedule115BBI){
    const B  = RG(I,"Schedule115BBI",{})||{};
    const b1 = N(B.DeemedIncSec1023C_113), b2 = N(B.DeemedIncSec111B),
          b3 = N(B.IncDeemedSec131c),      b4 = N(B.IncNotExemptSec131d),
          b5 = N(B.IncNotExcludedSec111c), b6 = N(B.IncAccInExcess),
          btot = N(B.Total);
    const schI_c15 = N(RG(I,"ITRScheduleI.TotAmountDeemedUs11",0));
    const schD_c8  = N(RG(I,"ITRScheduleD.TotAmountNotAppliedCurrAY",0));

    /* A451 — Sl.1 (deemed income Expln 4 / 11(3)) = total of Column 15 of Schedule I. */
    A(451, eqR(b1, schI_c15),
      "Schedule 115BBI: Sl. No. 1 (deemed income u/s Explanation 4 to the third proviso to s.10(23C) or s.11(3)) must equal the total of Column 15 of Schedule I.");
    /* A452 — Sl.2 (deemed income u/s 11(1B)) = total of Column 8 of Schedule D. */
    A(452, eqR(b2, schD_c8),
      "Schedule 115BBI: Sl. No. 2 (deemed income referred under section 11(1B)) must equal the total of Column 8 of Schedule D.");
    /* A453 — Sl.7 Total = Σ Sl.1..6. */
    A(453, eqR(btot, b1+b2+b3+b4+b5+b6),
      "Schedule 115BBI: the Total (Sl. No. 7) must equal the sum of Sl. No. 1 to 6.");
    /* A455 — Schedule 115BBI may be filled only if s.11 or s.10(23C)(iv/v/vi/via) exemption is claimed. */
    A(455, inList(exsec, EX_TD),
      "Schedule 115BBI can be filled only when the exemption claimed is Section 11 or Section 10(23C)(iv)/(v)/(vi)/(via).");
  }

  /* =====================================================================
     Schedule FSI — income from outside India & foreign tax relief (A456–A458).
     ScheduleFSI.ScheduleFSIDtls[] each: IncFromHP / IncFromBusiness / IncCapGain
     / IncOthSrc (i..iv) and TotalCountryWise (v), every head a
     {IncFrmOutsideInd(b), TaxPaidOutsideInd(c), TaxPayableinInd(d),
     TaxReliefinInd(e)}.
     ===================================================================== */
  if(I.ScheduleFSI){
    const rows = RG(I,"ScheduleFSI.ScheduleFSIDtls",[])||[];
    const HEADS= ["IncFromHP","IncFromBusiness","IncCapGain","IncOthSrc"];
    const COLS = ["IncFrmOutsideInd","TaxPaidOutsideInd","TaxPayableinInd","TaxReliefinInd"];

    /* A456 — per head, tax relief (col e) cannot exceed the lower of tax paid
       outside India (col c) or tax payable in India (col d). */
    const reliefOk = rows.every(r=>{ const R7=r||{};
      return HEADS.every(h=>{ const H=RG(R7,h,{})||{};
        return N(H.TaxReliefinInd) <= Math.min(N(H.TaxPaidOutsideInd), N(H.TaxPayableinInd))+1; }); });
    A(456, reliefOk,
      "Schedule FSI: the tax relief available (Column e) must be the lower of the tax paid outside India (Column c) or the tax payable on such income in India (Column d).");

    /* A457 — Schedule FSI is not applicable for non-residents. */
    A(457, FS.ResidentialStatus!=="NRI",
      "Schedule FSI is not applicable for non-residents.");

    /* A458 — per country, each column of the Total row (v) = Σ of heads (i+ii+iii+iv). */
    const totalOk = rows.every(r=>{ const R7=r||{}; const T=RG(R7,"TotalCountryWise",{})||{};
      return COLS.every(c=>{
        const sum=HEADS.reduce((a,h)=>a+N((RG(R7,h,{})||{})[c]),0);
        return eqR(N(T[c]), sum); }); });
    A(458, totalOk,
      "Schedule FSI: the Total (row v) of each column must equal the sum of Sl. No. (i)+(ii)+(iii)+(iv).");
  }
});
