/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, encoding batch 17.
   Serials 697–744 (books/ITR-5/rules.json), covering Schedule SI
   (special-rate income, 697–730), Schedule IF (731) and Schedule EI
   (exempt income, 732–744).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) FIRES when cond (the "lawful" assertion) is FALSE.
   Reads are guarded (RG / arr); nothing throws; every block guards to a
   no-op when its schedule is absent. Schema keys come from
     forms/ITR-5/src/70_sec_si.js  (expSi → ScheduleSI.SplCodeRateTax rows
        {SecCode,SplRatePercent,SplRateInc,SplRateIncTax}; TotSplRateInc/
        TotSplRateIncTax)
     forms/ITR-5/src/70_sec_ei.js  (expEi → ScheduleEI …)
   cross-referenced (READ only) for keys named in the rule text:
     70_sec_tax.js (PartB_TTI…TaxAtSpecialRates), 70_sec_bp.js
     (CorpScheduleBP.BusinessIncOthThanSpec…), 70_sec_os.js
     (ScheduleOS.IncOthThanOwnRaceHorse.IncChrgblUs115BBE),
     70_sec_other.js (ScheduleIF, SchedulePTI), 70_sec_gen.js
     (PartA_GEN1.OrgFirmInfo.PAN, …FilingStatus.ResidentialStatus).
   Cross-checked against books/ITR-5/rules.json + structure.md.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const arr=v=>Array.isArray(v)?v:[];
  const up =s=>String(s==null?"":s).toUpperCase();

  /* ===================================================================
     SCHEDULE SI  (697–730) — special-rate income roster.
     Rows: SplCodeRateTax[] {SecCode, SplRatePercent, SplRateInc (col i),
     SplRateIncTax (col ii)}. Totals: TotSplRateInc (H105), TotSplRateIncTax
     (J105). SecCode strings are the schema enum (70_sec_si.js SI_CODE_OPTS).
     =================================================================== */
  if(I.ScheduleSI){
    const SI=I.ScheduleSI;
    const rows=arr(RG(SI,"SplCodeRateTax",[]));
    const inc=code=>RSUM(rows.filter(r=>r&&String(r.SecCode||"")===code),"SplRateInc");

    /* 697 — Part B-TTI Sl.no 2b (tax at special rates) must equal the total
       of Col.(ii) "Tax thereon" of Schedule SI (J105). */
    if(I.PartB_TTI)
      A(697,REQ(RG(I,"PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.TaxAtSpecialRates"),
                N(RG(SI,"TotSplRateIncTax"))),
        "Part B-TTI Sl.no 2b (tax at special rates) must equal the total of column (ii) \"Tax thereon\" of Schedule SI.");

    /* 705 — tax at Col.(ii) is income × the special rate, EXCEPT for the OS
       DTAA, 112A, PTI-112A, 115AD(1)(iii)-Proviso, STCG-DTAA and LTCG-DTAA
       rows. The post-exemption taxable base (₹1,25,000 / basic-exemption
       walk) is NOT exported, so only the LAWFUL UPPER BOUND is checkable
       offline: tax cannot exceed income × rate (equality would false-fire
       whenever an exemption lawfully reduces the base). */
    const R705_SKIP={DTAAOS:1,DTAASTCG:1,DTAALTCG:1,"2A":1,PTI_LTCG12_5P112A:1,"5ADiiiP":1};
    rows.forEach(function(r,i){r=r||{};const code=String(r.SecCode||"");
      if(R705_SKIP[code])return;
      A(705,N(r.SplRateIncTax)<=N(r.SplRateInc)*N(r.SplRatePercent)/100+1,
        "Schedule SI row "+(i+1)+" ("+code+"): the tax at column (ii) cannot exceed the income at column (i) multiplied by the special rate.");
    });

    /* 706 — tax at Col.(ii) cannot be null when income at Col.(i) > 0. Only
       enforced for codes that are NEVER reduced by an exemption: the CG
       "basic-exemption walk" codes (which include 112A / 115AD-proviso / the
       PTI CG codes) and the DTAA rows can lawfully carry income with nil tax,
       so they are skipped to stay silent on a lawful return. */
    const R706_SKIP={"1":1,"21":1,"2A":1,"21ciii":1,"5AC1c":1,"5AB1b":1,"5ADiii":1,
      "5ADiiiP":1,"5ADii":1,"5AD1biip":1,PTI_STCG20P:1,PTI_STCG30P:1,
      PTI_LTCG12_5P112A:1,PTI_LTCG12_5P:1,DTAAOS:1,DTAASTCG:1,DTAALTCG:1};
    rows.forEach(function(r,i){r=r||{};const code=String(r.SecCode||"");
      if(R706_SKIP[code])return;
      A(706,!(N(r.SplRateInc)>0)||N(r.SplRateIncTax)>0,
        "Schedule SI row "+(i+1)+" ("+code+"): the tax at column (ii) cannot be nil when the income at column (i) is greater than zero.");
    });

    /* 708 — the total of "Tax thereon" (ii) (row 105) must equal the sum of
       the individual line items. */
    A(708,REQ(N(RG(SI,"TotSplRateIncTax")),RSUM(rows,"SplRateIncTax")),
      "Schedule SI: the total tax at special rates (row 105, column (ii)) must equal the sum of the individual line items.");

    /* 701 — SI 115BBE income must equal Schedule OS Sl.no 2b (income u/s
       115BBE — sections 68/69/69A/69B/69C/69D). */
    if(I.ScheduleOS)
      A(701,REQ(inc("5BBE"),N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChrgblUs115BBE"))),
        "Schedule SI: the 115BBE income (u/s 68/69/69A/69B/69C/69D) must match Schedule OS Sl.no 2b.");

    /* 702/703/712 — the 115BBF / 115BBG / 115BBH "business or profession"
       special incomes in Schedule SI must equal Schedule BP Sl.no 3d/3e/3f. */
    if(I.CorpScheduleBP){
      const P="CorpScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.";
      A(702,REQ(inc("5BBF_BP"),N(RG(I,P+"UnderSec115BBF"))),
        "Schedule SI: the 115BBF (business/profession) income must match Schedule BP Sl.no 3d.");
      A(703,REQ(inc("5BBG_BP"),N(RG(I,P+"UnderSec115BBG"))),
        "Schedule SI: the 115BBG (business/profession) income must match Schedule BP Sl.no 3e.");
      A(712,REQ(inc("5BBH_BP"),N(RG(I,P+"UnderSec115BBH"))),
        "Schedule SI: the 115BBH virtual-digital-asset (business/profession) income must match Schedule BP Sl.no 3f.");
    }
  }

  /* ===================================================================
     SCHEDULE IF  (731)
     Rows: PartnerFirmDetails[] {ProfitShareAmt, …}. Total:
     TotalProfitShareAmt. (Serial 731's rule text is a Schedule IF rule;
     the batch mapping placed it after the SI block because of the wrapped
     rules.json layout — encoded here against its true owning schedule.)
     =================================================================== */
  if(I.ScheduleIF)
    A(731,REQ(N(RG(I,"ScheduleIF.TotalProfitShareAmt")),
              RSUM(arr(RG(I,"ScheduleIF.PartnerFirmDetails",[])),"ProfitShareAmt")),
      "Schedule IF: the total of \"Amount of share in the profit\" must equal the sum of the amounts entered against the individual firms.");

  /* ===================================================================
     SCHEDULE EI  (732–744) — exempt income.
     Line map (70_sec_ei.js): 1 InterestInc · 2i GrossAgriRecpt ·
     2ii ExpIncAgri · 2iii UnabAgriLossPrev8 · 2iv NetAgriIncRelateToRule7 ·
     2v NetAgriIncOrOthrIncRule7 · 2vi ExcNetAgriInc.ExcNetAgriIncDtls[] ·
     3 rows OthersInc.OthersIncDtls[]{Category,SubCategory,Description,
     OthAmount} + total Others · 4 total IncChrgblAsPerDTAA ·
     5 PassThrIncNotChrgblTax · 6 TotalExemptInc.
     =================================================================== */
  if(I.ScheduleEI){
    const EI=I.ScheduleEI;
    const oth=arr(RG(EI,"OthersInc.OthersIncDtls",[]));

    /* 732 — Sl.no 5 (pass-through claimed not chargeable) must equal
       Schedule PTI Sl.no 1(iv)(a+b+c) — the total exempt income claimed
       (IncClmdPTI.TotalSec23FBB.NetIncomeLoss) across the PTI rows. */
    if(I.SchedulePTI)
      A(732,REQ(N(RG(EI,"PassThrIncNotChrgblTax")),
                RSUM(arr(RG(I,"SchedulePTI.SchedulePTIDtls",[])),
                     r=>N(RG(r,"IncClmdPTI.TotalSec23FBB.NetIncomeLoss")))),
        "Schedule EI: Sl.no 5 (pass-through income claimed as not chargeable) must equal Schedule PTI Sl.no 1(iv)(a+b+c).");

    /* 733 — Sl.no 6 "Total" = 1 + 2(v) + 3 + 4 + 5 (floored at nil). */
    A(733,REQ(N(RG(EI,"TotalExemptInc")),
              Math.max(0, N(RG(EI,"InterestInc"))+N(RG(EI,"NetAgriIncOrOthrIncRule7"))
                          +N(RG(EI,"Others"))+N(RG(EI,"IncChrgblAsPerDTAA"))
                          +N(RG(EI,"PassThrIncNotChrgblTax")))),
      "Schedule EI: Sl.no 6 \"Total\" must equal the sum of Sl.no 1 + 2(v) + 3 + 4 + 5.");

    /* 734 — Sl.no 2(v) "Net Agricultural income" = 2(i − ii − iii + iv),
       taken as nil if the working is a loss. */
    A(734,REQ(N(RG(EI,"NetAgriIncOrOthrIncRule7")),
              Math.max(0, N(RG(EI,"GrossAgriRecpt"))-N(RG(EI,"ExpIncAgri"))
                          -N(RG(EI,"UnabAgriLossPrev8"))+N(RG(EI,"NetAgriIncRelateToRule7")))),
      "Schedule EI: Sl.no 2(v) net agricultural income must equal 2(i) − 2(ii) − 2(iii) + 2(iv).");

    /* 735 — Sl.no 2(iv) (agri portion under Rule 7/7A/7B(1)/7B(1A)/8) must
       equal Sl.no 38 of Schedule BP (both floored at nil). */
    if(I.CorpScheduleBP)
      A(735,REQ(N(RG(EI,"NetAgriIncRelateToRule7")),
                N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.BalIncDeemedFrmAgri"))),
        "Schedule EI: Sl.no 2(iv) (agricultural income under Rule 7/7A/7B(1)/7B(1A)/8) must equal Sl.no 38 of Schedule BP.");

    /* 736 — Sl.no 3 total of "Other exempt income" (Others) must equal the
       sum of the amounts entered in the individual rows. */
    A(736,REQ(N(RG(EI,"Others")),RSUM(oth,"OthAmount")),
      "Schedule EI: the total of other exempt income (Sl.no 3) must equal the sum of the amounts entered in the individual rows.");

    /* 737 — when net agricultural income (Sl.no 2(v)) exceeds ₹5,00,000 the
       land details must be provided in the table at Sl.no 2(vi). */
    A(737,!(N(RG(EI,"NetAgriIncOrOthrIncRule7"))>500000)
          || arr(RG(EI,"ExcNetAgriInc.ExcNetAgriIncDtls",[])).length>0,
      "Schedule EI: when net agricultural income (Sl.no 2(v)) exceeds ₹5,00,000, the details of each agricultural land (Sl.no 2(vi)) must be provided.");

    /* 738 — in the Sl.no 3 table, the same exemption (sub-category) must not
       be selected in more than one row. */
    {const subs=oth.map(r=>String((r&&r.SubCategory)||"")).filter(s=>s!=="");
     const seen={};let dup=false;
     subs.forEach(s=>{if(seen[s])dup=true;seen[s]=1;});
     A(738,!dup,
       "Schedule EI: the same exempt-income sub-category (Sl.no 3) must not be selected in more than one row.");}

    /* 739 — exempt income u/s 10(23BBH) (Prasar Bharati) may be claimed only
       by PAN "AAAJP0288R". */
    {const hasBBH=oth.some(r=>r&&String(r.SubCategory||"")==="10(23BBH)"&&N(r.OthAmount)>0);
     A(739,!hasBBH || up(RG(I,"PartA_GEN1.OrgFirmInfo.PAN",""))==="AAAJP0288R",
       "Schedule EI: exempt income u/s 10(23BBH) (Prasar Bharati) can be claimed only by PAN AAAJP0288R.");}

    /* 740 — exempt income u/s 10(4)(i), 10(4C), 10(4E), 10(4F), 10(4G),
       10(6B), 10(6BB), 10(6D), 10(8A) and 10(15A) cannot be reported by a
       resident. */
    {const NR_ONLY={"10(4)(i)":1,"10(4C)":1,"10(4E)":1,"10(4F)":1,"10(4G)":1,
       "10(6B)":1,"10(6BB)":1,"10(6D)":1,"10(8A)":1,"10(15A)":1};
     const resident=up(RG(I,"PartA_GEN1.FilingStatus.ResidentialStatus","RES")).slice(0,3)==="RES";
     oth.forEach(function(r,i){r=r||{};
       if(!(N(r.OthAmount)>0)||!NR_ONLY[String(r.SubCategory||"")])return;
       A(740,!resident,
         "Schedule EI row "+(i+1)+": exempt income u/s "+String(r.SubCategory||"")+" cannot be reported by a resident.");
     });}

    /* 741 — a Description is mandatory (amount > 0) for the sub-categories
       "Income exempt as per CBDT Circular" / "…Notification" / "Receipts not
       in the nature of income". */
    {const DESC_REQ={Incmexmptcircular:1,Incmexmptnotification:1,Receiptnotincme:1};
     oth.forEach(function(r,i){r=r||{};
       if(!(N(r.OthAmount)>0)||!DESC_REQ[String(r.SubCategory||"")])return;
       A(741,String(r.Description||"").trim()!=="",
         "Schedule EI row "+(i+1)+": a Description is mandatory for the CBDT Circular / Notification / \"Receipts not in the nature of income\" sub-category when the amount is greater than zero.");
     });}

    /* 742 — Category and Sub-category are mandatory when the amount reported
       in a Sl.no 3 row is greater than zero. */
    oth.forEach(function(r,i){r=r||{};
      if(!(N(r.OthAmount)>0))return;
      A(742,String(r.Category||"").trim()!==""&&String(r.SubCategory||"").trim()!=="",
        "Schedule EI row "+(i+1)+": the Category and Sub-category are mandatory when the amount reported is greater than zero.");
    });
  }

  /* ---- NOT MAPPABLE (reported, not encoded) ------------------------
     698 / 716 — "income offered in Sl.no 2c of Schedule OS should match the
           corresponding section in Schedule SI (net of DTAA)". No verifiable
           OS-2c source-code → SI SecCode crosswalk exists in the exported
           JSON, and the per-code DTAA reduction (table 2e) is not
           reconstructable, so a literal match would false-fire.
     699 / 715 — "income offered in Sl.no 2d (PTI) of Schedule OS should match
           the corresponding section in Schedule SI (net of DTAA)". Same
           reason as 698/716 (no verifiable 2d-code → SI-code mapping).
     700 — "Sl.no 2a 115BB of Schedule OS should match Schedule SI subject to
           DTAA". The "subject to DTAA" reduction is not reconstructable per
           code offline; the equality would false-fire whenever DTAA applies.
     704, 707, 709, 710, 713, 714 — tie a sum of specific SI section codes to
           a Schedule BFLA column-5 line item (5xiv / 5vii / 5ix / 5xi / 5vi /
           5xb). These need Schedule BFLA per-line keys (a schedule outside
           this batch), are gated by residential status + the TRC flag (704's
           note) and, for 714, by a 23-Jul-2024 sale-date condition, and the
           SI income is post-BFLA scaled — a raw tie is not offline-verifiable
           without false-firing.
     705 — encoded only as the lawful UPPER BOUND (tax ≤ income × rate). The
           full equality "tax = TAXABLE income × rate" is not offline-checkable
           because the post-exemption taxable base (the true multiplicand) is
           not a Schedule SI export field.
     711 — "Income u/s 115BBC (Anonymous Donations) cannot be more than 0".
           115BBC has NO SecCode in the ScheduleSI enum (the 115BBC legacy row
           is not built), so there is no schema field to test; the condition is
           enforced structurally by the absent enum value.
     717–730 — each caps an SI section-code income at a specific Schedule CG
           sub-item "after reducing DTAA income if any" (CG A3ie / A4a / A3iie
           / B3c / B6ic / B4 / B6iic / B6iiic / A5e / B6ivc / B7 / A8a / A8b /
           B10a1 / B10a2 / Col.14 of Sch.112A). Those CG sub-items are deeply
           nested / arrays keyed by section code with no single exported field,
           and the per-code DTAA reduction is not reconstructable; a mis-keyed
           read would default to 0 and false-fire. Not safely mappable.
     743 — states a Description is NOT required for sub-categories other than
           the three CBDT ones — a relaxation, not an assertion that can be
           violated; there is nothing to test.
     744 — "Exempt income fields should be reported only for applicable
           sections and sub-categories" — a general applicability statement
           with no single enumerable field mapping beyond what 740 already
           encodes; too vague to encode without false-firing.
     ------------------------------------------------------------------ */
});
