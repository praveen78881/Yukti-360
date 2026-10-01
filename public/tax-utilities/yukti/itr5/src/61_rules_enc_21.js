/* =====================================================================
   ITR-5 · AY 2026-27 — advisory rules, encoding batch 21 (CATEGORY-B).
   Serials 1–29 (cat=="B") of books/ITR-5/rules.json — advisory / disclosure
   rules spanning Part B-TI / Part B-TTI, Schedule VI-A / P&L / Part A-General,
   Schedule OS, Schedule SI, Schedule AMT and Schedule BP.

   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   THIS BATCH USES Dd — Dd(n,cond,msg) raises an ADVISORY notice (category
   "D", "may be defective u/s 139(9)") when cond (the "lawful" assertion) is
   FALSE. Dd NEVER blocks a lawful return. As with Category-A, cond is written
   as "what must be TRUE on a lawful return"; each Dd is silent on a lawful
   return (0 fire) and on an absent/empty schedule.

   Every read is guarded (RG default / (X||{}) / arr()); nothing throws; each
   block enters only under `if(I.ScheduleXxx){...}`. Schema keys come from the
   owning sections' exp() functions:
     tax → forms/ITR-5/src/70_sec_tax.js  (PartB-TI / PartB_TTI)
     si  → forms/ITR-5/src/70_sec_si.js   (ScheduleSI)
     os  → forms/ITR-5/src/70_sec_os.js   (ScheduleOS)
     amt → forms/ITR-5/src/70_sec_amt.js  (ScheduleAMT + PartB_TTI deemed-TI)
     bp  → forms/ITR-5/src/70_sec_bp.js   (CorpScheduleBP) ; bs → PARTA_BS ; pl → PARTA_PL
   Cross-checked against the rules.json text. Serials that reference AIS/26AS,
   Form-filing state (3CA-3CD/3CEB/29C/10CCF/10CCB/10DA/56F/3CFA/3CLA/67),
   PAN/RBI databases, due-date/portal/assessment state — i.e. with no offline
   schema field or checkable assertion — are listed in the NOT MAPPABLE block
   at the foot with the precise reason, never forced into a false-firing check.
   Reference for structure/guarding: forms/ITR-5/src/61_rules_enc_10.js
   (that batch uses A; this one uses Dd).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const arr=v=>Array.isArray(v)?v:[];

  /* ===================================================================
     B15 — Part B-TI  (owner: tax → 70_sec_tax.js)
     "Income details and tax computation have not been disclosed / left
      blank or zero by the taxpayer in the ITR, but details regarding taxes
      paid have been provided."  Genuine offline consistency check: total
      income (Part B-TI) and gross tax liability (Part B-TTI) are both nil
      while taxes paid (TDS/TCS/advance/self-assessment) are disclosed.
     =================================================================== */
  if(I.PartB_TTI){
    const ti  =N(RG(I,"PartB-TI.TotalIncome"));
    const gtax=N(RG(I,"PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.GrossTaxLiability"));
    const paid=N(RG(I,"PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid"));
    Dd(15,!(ti<=0&&gtax<=0&&paid>0),"Part B-TI: the income details and tax computation are blank/zero while taxes paid (TDS/TCS/advance/self-assessment tax) have been disclosed — please verify that the income and tax-computation details have been filled.");
  }

  /* ===================================================================
     B16 — Part B-TI vs Schedule SI  (owner: tax / si)
     "Income chargeable to tax at special rate has been shown only in Sch.
      Part-B-TI, without giving the details of the same in the relevant
      schedules, viz. Sch. CG / Sch. OS and Sch. SI."  Check: special-rate
      income appears in Part B-TI but Schedule SI carries no total.
     =================================================================== */
  if(I["PartB-TI"]){
    const spl=N(RG(I,"PartB-TI.IncChargeableTaxSplRates"));
    const si =N(RG(I,"ScheduleSI.TotSplRateInc"));
    Dd(16,!(spl>0&&si<=0),"Part B-TI: income chargeable to tax at special rates is shown in Part B-TI but no corresponding details are given in Schedule SI (and the relevant Sch. CG / Sch. OS) — please disclose the special-rate income in the relevant schedules.");
  }

  /* ===================================================================
     B23 — Part B-TTI / Schedule AMT  (owner: amt / tax)
     "Surcharge on AMT can be claimed only if AMT income at Sl.No.3 in
      Schedule AMT is > 1Cr or 50L as the case may be."  Surcharge on the
      tax on deemed total income (Part B-TTI) can arise only when the
      adjusted total income (Sl.No.3 = AdjustedUnderSec115JC) crosses the
      surcharge threshold; the lowest threshold at which ANY surcharge
      applies is ₹50 lakh (AOP/BOI), so a lawful return never fires here.
     =================================================================== */
  if(I.ScheduleAMT){
    const sur   =N(RG(I,"PartB_TTI.ComputationOfTaxLiability.TaxPayableOnDeemedTI.Surcharge"));
    const amtInc=N(RG(I,"ScheduleAMT.AdjustedUnderSec115JC"));
    Dd(23,!(sur>0)||amtInc>5000000,"Schedule Part B-TTI: surcharge on AMT (tax on deemed total income u/s 115JC) can arise only when the adjusted total income at Sl.No.3 of Schedule AMT exceeds the applicable surcharge threshold (₹50 lakh / ₹1 crore, as the case may be).");
  }

  /* ===================================================================
     B25 — Part A-P&L / Balance Sheet vs Schedule BP  (owner: bp / pl / bs)
     "Income from 'Profits and Gains from Business or Profession' is greater
      than 2.5 lakhs in Sl.No. D of Schedule BP, then Manufacturing A/c or
      Trading Account or P&L account and Balance sheet should be filled."
     =================================================================== */
  if(I.CorpScheduleBP){
    const bpD=N(RG(I,"CorpScheduleBP.IncChrgUnHdProftGain"));
    Dd(25,!(bpD>250000)||(!!I.PARTA_PL&&!!I.PARTA_BS),"Part A-P&L / Balance Sheet: income under 'Profits and gains of business or profession' at Sl.No. D of Schedule BP exceeds ₹2.5 lakh — the Manufacturing / Trading / P&L account and the Balance Sheet should be filled.");
  }

  /* ===================================================================
     B28 — Schedule OS item 10 quarterly dividend break-up  (owner: os)
     "In Schedule OS, Sl.No.10 the quarterly break-up of Dividend Income
      should be equal to amount in Sl.No.1a(i) i.e. normal dividend − DTAA
      for Dividend subject to TRC − Adj Expenditure u/s 57(i)."
     "Adj Expenditure u/s 57(i) = Max(0, exp u/s 57(1) at Sl.No.3c −
      Deemed dividend u/s 2(22e) at Sl.No.1a(ii))."
     Genuine offline arithmetic. Quarterly break-up of "Dividend income
     referred in Sl.No.1a(i)" is DividendIncUs115BBDA.DateRange (five leaves,
     always emitted). Guarded to only advise when there is dividend activity.
     =================================================================== */
  /* 28 — NOT MAPPABLE (downgraded after review). "Quarterly break-up (Sl.No.10) of
     dividend income referred in 1a(i)" has no unambiguous single schema block: Schedule OS
     exports EIGHT dividend quarterly DateRange blocks (DividendIncUs115BBDA / 115BBDAaiii /
     115A1ai / 115A1aA / 115AC / 115AD1iDiv / 115AD1IBd / DividendDTAA), none of which is a
     clean "generic 1a(i) normal dividend" bucket. The rule's own text is a stitched
     fragment (serials 28+29) mixing in a DTAA-TRC reduction and a 57(1) adjustment whose
     mapping to a specific block is not determinable from the schema, so any literal
     encoding false-fires on a lawful return (a return with 1a(i) dividend but its quarterly
     break-up entered under the block the rule did not read). Left as an advisory the portal
     evaluates against the full item-10 model. */

  /* ---- NOT MAPPABLE (reported, not encoded) ------------------------
     No offline schema field / no checkable arithmetic assertion — encoding
     any of these would false-fire on lawful returns, so they are listed
     rather than coded.

     1  — "If net tax liability is as per AMT (Sl.3 = Sl.1d), then Form 29C
           is required to be filed." Form-29C filing status is an external
           record, not present in the return schema.
     2  — "Part B-TI Sl.11b can be claimed only if the original return is
           filed / being filed on or before the due date u/s 139(1)."
           Depends on due-date-vs-filing-date / portal state; no offline field.
     3  — "Schedule VI-A deduction u/s 80LA / 80LA(1) allowed only if Form
           10CCF is filed." Form-10CCF filing status — external record.
     4  — (fragment) "If income under B&P is claimed then gross receipts are
           required in P&L OR ..." Presumptive (44AD/44ADA) OR-condition split
           across serials 4-6; the alternative limb (profit ≥ 6%/8% of gross
           receipts) is gated on book-maintenance / 44AB-audit status and the
           digital-vs-cash receipt split — no faithful non-false-firing encoding.
     5  — (fragment) presumptive floor "profit ≥ 6%/8% of gross receipts if
           details of maintenance of books and audit u/s 44AB are not provided"
           + "loss under PGBP must fill BS and P&L." Gated on book-maintenance
           state; text is a cross-serial fragment with no self-contained assertion.
     6  — (fragment) presumptive floor "profit ≥ 50% of gross receipts (44ADA)
           if book-maintenance / 44AB details not provided." Same reason as 5.
     7  — (fragment) "...Name of the assessee in Part A-General should match the
           Name as per the PAN database." PAN-database match — external service.
     8  — "If the original return is filed u/s 142(1) then the taxpayer cannot
           file a revised return." Filing-history / portal state — no offline field.
     9  — "Assessee liable to audit u/s 44AB must file Form 3CA-3CD / 3CB-3CD."
           Form-filing status — external record.
     10 — "Assessee liable for audit u/s 44DA must file Form 3CE." Form-filing.
     11 — "Assessee liable for audit u/s 92E must file Form 3CEB." Form-filing.
     12 — "Assessee liable to pay AMT u/s 115JC must file Form 29C." Form-filing.
     13 — "Return u/s 139(1)/139(4)/139(5)/142(1) cannot be filed if assessment
           u/s 143(3)/144 is completed." Assessment / portal state — no field.
     14 — "IFSC under Bank Details (Part B-TTI / 80G / 80GGC) not matching the
           RBI database." RBI-database validation — external service.
     17 — (fragment) "...Assessee claiming relief u/s 90 & 91 must file Form 67."
           Form-67 filing status — external record.
     18 — "Assessee claiming deduction u/s 10AA must file the ITR within the due
           date." Due-date-vs-filing state — no offline field.
     19 — "Income u/s 115BBF can be declared only if the original return is filed
           within the due date." Due-date / filing state — no offline field.
     20 — "Income u/s 115BBF shown without furnishing Form 3CFA / Form 3CFA not
           filed within the due date." Form-filing + due-date state — external.
     21 — (fragment) "...Once a proceeding is initiated u/s 148, the original
           return filed u/s 139 cannot be revised." Proceeding / portal state.
     22 — "Deduction u/s 80-I(7)/80-IA(7)/80IAB/80IAC/80-IB/80IC/80IE claimed only
           if Form 10CCB is filed within the due date." Form-filing + due-date.
     24 — "Form 10DA required to claim deduction u/s 80JJAA (PY 2020-21)."
           Form-10DA filing status — external record.
     26 — (fragment) "...Deduction u/s 10AA is claimed only if Form 56F is filed."
           Form-56F filing status — external record. (The other limb of serial 26
           — the BP>2.5L → P&L/BS check — is encoded under B25 above.)
     27 — "Total Income at Schedule AMT can be negative only if the loss arises
           because of the Specified business." The offline model floors Sl.No.1
           (TotalIncItem13) at 0 (70_sec_amt.js L101-105) so it is never negative,
           and there is no schema field identifying whether a loss arose from the
           specified business — nothing to check without false-firing.
     29 — (fragment) "...Taxpayer claiming deduction u/s 35(2AB) (in-house R&D)
           but Form 3CLA (report from an accountant) is not filed." Form-3CLA
           filing status — external record. (The other limb of serial 29 — the
           adjusted-expenditure formula — is used inside B28 above.)
     ------------------------------------------------------------------ */
});
