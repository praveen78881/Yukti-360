/* ITR-4 (Sugam) · AY 2026-27 — validation-rule FIX batch 05 (enforcement gaps/weak fixes).
   Registered via ruleset(); A(n,cond,msg) fires when cond is FALSE. Reads guarded; nothing throws.
   Serials: 319 320 321 348 353 355 356 357 359 368 369 371 372 374 375 377 378 379 380 381.
   Schema paths are the exact keys the ITR-4 exporter (70_sec_inccore.js / 70_sec_ded.js) writes,
   plus the FilingStatus A23(A)(ii) keys from the CBDT schema (definitions/FilingStatus). Every
   assertion is TRUE when the relevant data is absent, so a lawful / empty return never fires. */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  var FS     = RG(I,"FilingStatus",{})||{};
  var status = RG(I,"PersonalInfo.Status","I");
  var dob    = String(RG(I,"PersonalInfo.DOB","")||"");                 /* ISO YYYY-MM-DD */
  var HP     = RG(I,"IncomeDeductions.PropertyDetails",[])||[];
  var alwRows= RG(I,"IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
  var exRows = RG(I,"TaxExmpIntIncDtls.OthersInc.OthersIncDtls",[])||[];
  var alwAmt = function(code){ return RSUM(alwRows.filter(function(r){return r&&r.SalNatureDesc===code;}),"SalOthAmount"); };
  var subKey = function(r){ return String((r&&r.SubCategory)||"").replace(/\s+/g,"").toUpperCase(); };
  var cntSub = function(code){ var k=code.toUpperCase(); return exRows.filter(function(r){return subKey(r)===k;}).length; };
  var has    = function(k){ var v=FS[k]; return v!=null && String(v)!==""; };   /* key present & non-blank */

  /* ---------------- Personal info ---------------- */
  /* 319: Individual with DOB on/after 01/04/2008 cannot file (per the rule text's floor). */
  A(319, status!=="I" || !dob || dob < "2008-04-01",
    "An Individual born on or after 01/04/2008 is not allowed to file this return.");

  /* ---------------- Salary · HRA 10(13A) ---------------- */
  /* 320: the 10(13A) row in the salary exempt-allowance table must equal the eligible exemption
     computed in Schedule 10(13A). Both absent → 0 = 0. */
  A(320, REQ(alwAmt("10(13A)"), N(RG(I,"ScheduleEA10_13A.EligbleExmpAllwncUs13A",0))),
    "Exempt allowance u/s 10(13A) in the salary schedule must match the eligible allowance u/s 10(13A) as per Schedule 10(13A).");

  /* ---------------- Filing status · Form 10-IEA (A23 tree) ---------------- */
  var E   = String(RG(I,"FilingStatus.Form10IEAEarlierAYOldRegime","NA")||"NA");   /* A23     Y/N/NA */
  var RE  = String(RG(I,"FilingStatus.F10IEAEarlierAYNewRegime","")||"");          /* A23(A)(ii) Y/N */
  var CB  = String(RG(I,"FilingStatus.F10IEACurrAYNewRegime","")||"");             /* A23(A)(ii)(b) Y/N */
  var CUR = String(RG(I,"FilingStatus.F10IEACurrAYOldRegime","")||"");             /* A23(B)  Y/N */
  var hasA = has("Form10IEAAssYear") || has("Form10IEAEarlierAYAckOldRegime") || has("F10IEAEarlierAYNewRegime")
          || has("AssYrF10IEANewTaxReg") || has("Form10IEAEarlierAYAckNewRegime") || has("F10IEACurrAYNewRegime")
          || has("F10IEADateCurrAYNewTax") || has("F10IEAAckNoCurrAYNewTax");
  var hasB = has("F10IEACurrAYOldRegime") || has("F10IEADateCurrAYOldTax") || has("F10IEAAckNoCurrAYOldTax");

  /* 321: A23 = Yes → answer A23(A) only; otherwise → answer A23(B) only. */
  A(321, E==="Y" ? !hasB : !hasA,
    "Based on the response to A23, only one of A23(A) (earlier-AY Form 10-IEA details) or A23(B) (current-AY Form 10-IEA) may be answered.");

  /* 353 (companion, stricter): A23 = Yes → A23(A)(i) (AY + acknowledgement) AND A23(A)(ii) (re-entry question) mandatory. */
  A(353, E!=="Y" || (has("Form10IEAAssYear") && has("Form10IEAEarlierAYAckOldRegime") && (RE==="Y"||RE==="N")),
    "When Form 10-IEA was filed for an earlier AY (A23 = Yes), the AY and acknowledgement in A23(A)(i) and the re-entry question in A23(A)(ii) are mandatory.");

  /* 355: A23(A)(ii) = Yes → Form 10-IEA re-entry details in A23(A)(ii)(a) mandatory. */
  A(355, RE!=="Y" || (has("AssYrF10IEANewTaxReg") && has("Form10IEAEarlierAYAckNewRegime")),
    "When A23(A)(ii) is Yes, the AY and acknowledgement of Form 10-IEA for re-entering the new regime (A23(A)(ii)(a)) are mandatory.");

  /* 356: A23(A)(ii) = No → A23(A)(ii)(b) (re-entered in the current AY?) mandatory. */
  A(356, RE!=="N" || (CB==="Y"||CB==="N"),
    "When A23(A)(ii) is No, the question in A23(A)(ii)(b) (Form 10-IEA furnished for re-entering the new regime in the current AY) is mandatory.");

  /* 357: A23(A)(ii)(b) = Yes → Form 10-IEA date and acknowledgement in A23(A)(ii)(b)(i) mandatory. */
  A(357, CB!=="Y" || (has("F10IEADateCurrAYNewTax") && has("F10IEAAckNoCurrAYNewTax")),
    "When A23(A)(ii)(b) is Yes, the date and acknowledgement of Form 10-IEA in A23(A)(ii)(b)(i) are mandatory.");

  /* 359 (companion, corrected): the schema/export value is "Y", not "Yes". A23(A)(ii)(b) = No → no
     (b)(i) details; A23(B) = Yes → A23(B)(i) date and acknowledgement mandatory. */
  A(359, (CB!=="N" || (!has("F10IEADateCurrAYNewTax") && !has("F10IEAAckNoCurrAYNewTax")))
      && (CUR!=="Y" || (has("F10IEADateCurrAYOldTax") && has("F10IEAAckNoCurrAYOldTax"))),
    "When Form 10-IEA is furnished for the current AY (A23(B) = Yes), its date and acknowledgement number are mandatory; A23(A)(ii)(b)(i) details apply only when A23(A)(ii)(b) is Yes.");

  /* ---------------- House property ---------------- */
  /* 348: co-owned property with the assessee's share = 0 → interest on borrowed capital must be 0. */
  A(348, HP.every(function(p){ if(!p) return true;
      var co=/^Y/i.test(String(p.PropCoOwnedFlg||""));
      if(!co || p.AsseseeShareProperty==null || String(p.AsseseeShareProperty)==="" || N(p.AsseseeShareProperty)!==0) return true;
      return N(RG(p,"Rentdetails.IntOnBorwCap",0))===0; }),
    "When the assessee's share in a co-owned property is zero, interest on borrowed capital cannot be more than zero.");

  /* ---------------- Exempt income (D20) — 'cannot be selected more than once' ---------------- */
  A(368, cntSub("10(10BB)") <= 1, "Exempt income u/s 10(10BB) (Bhopal Gas Leak Disaster payments) cannot be selected more than once.");
  A(369, cntSub("10(11A)")  <= 1, "Exempt income u/s 10(11A) (Sukanya Samriddhi Yojana) cannot be selected more than once.");
  A(371, cntSub("10(12AA)") <= 1, "Exempt income u/s 10(12AA) (payment from the National Pension System Trust) cannot be selected more than once.");
  A(372, cntSub("10(12AB)") <= 1, "Exempt income u/s 10(12AB) (lump sum under notification FX-1/3/2024-PR) cannot be selected more than once.");
  A(374, cntSub("10(12BA)") <= 1, "Exempt income u/s 10(12BA) (partial withdrawal from NPS) cannot be selected more than once.");
  A(375, cntSub("10(12C)")  <= 1, "Exempt income u/s 10(12C) (Agniveer Corpus Fund) cannot be selected more than once.");
  A(377, cntSub("10(19A)")  <= 1, "Exempt income u/s 10(19A) (annual value of one palace of an ex-ruler) cannot be selected more than once.");
  A(378, cntSub("10(23AA)") <= 1, "Exempt income u/s 10(23AA) (fund established by the armed forces) cannot be selected more than once.");
  /* 379: not mappable — the ITR-4 schema's TaxExmpIntIncDtls SubCategory enum has no "Contributions received
     from recognized stock exchange" code (10(23EE) is not an option in this form), so there is no key to count. */
  A(380, cntSub("10(23FBB)")<= 1, "Exempt income u/s 10(23FBB) (unit holder of an investment fund, s.115UB) cannot be selected more than once.");
  A(381, cntSub("10(23FD)") <= 1, "Exempt income u/s 10(23FD) (unit holder income from a Business Trust) cannot be selected more than once.");
});
