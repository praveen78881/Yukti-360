/* ITR-4 · AY 2026-27 — validation-rule FIX batch 06 (enforcement gaps/weak fixes).
   Registered via ruleset(); A(n,cond,msg) fires when cond is FALSE. Reads guarded; nothing throws.
   Serials: 383 384 386 387 389 390 (exempt-income dedup), 392 397 (fee 234-I), 394 399 (80G row),
   402 (PRAN for 80CCD(1)), 403 (representative contact), 404 405 (HP co-ownership), 409 (80CCC rows),
   411 (secondary address), and Category-B 2 (TDS1 vs gross salary), 4 (Aadhaar u/s 139AA),
   6 7 (special-rate TDS section codes in TDS2(i)/TDS2(ii)). Schema paths are the exact keys the
   ITR-4 exporters write (70_sec_inccore.js / 70_sec_ded.js / 70_sec_paidbank.js). */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  var USR = RG(I,"IncomeDeductions.UsrDeductUndChapVIA",{})||{};   /* claimed (user-enterable) */
  var PI  = RG(I,"PersonalInfo",{})||{};
  var ADR = RG(I,"PersonalInfo.Address",{})||{};
  var status = RG(I,"PersonalInfo.Status","I");
  var str = function(v){ return (v==null)?"":String(v).trim(); };
  var lc  = function(v){ return str(v).toLowerCase(); };

  /* ---------------- Exempt income (D20) — 'cannot be selected more than once' ---------------- */
  /* TaxExmpIntIncDtls.OthersInc.OthersIncDtls[].SubCategory (70_sec_inccore.js:929) */
  var exRows = RG(I,"TaxExmpIntIncDtls.OthersInc.OthersIncDtls",[])||[];
  var cntSub = function(code){ return exRows.filter(function(r){ return r && str(r.SubCategory)===code; }).length; };
  /* 383: 10(25A) is not in this form's SubCategory enum (books/ITR-4/enums.json lists 10(25) only);
     the sub-category box is free text, so the check is kept live on the written value. */
  A(383, cntSub("10(25A)") <= 1, "Exempt income u/s 10(25A) (Employees' State Insurance Fund) cannot be selected more than once.");
  A(384, cntSub("10(30)")  <= 1, "Exempt income u/s 10(30) (subsidy from the Tea Board) cannot be selected more than once.");
  A(386, cntSub("10(32)")  <= 1, "Exempt income u/s 10(32) (minor child's income — small exemption) cannot be selected more than once.");
  A(387, cntSub("10(35)")  <= 1, "Exempt income u/s 10(35) (income from specified Mutual Funds) cannot be selected more than once.");
  A(389, cntSub("10(43)")  <= 1, "Exempt income u/s 10(43) (reverse mortgage — payments to senior citizens) cannot be selected more than once.");
  A(390, cntSub("10(44)")  <= 1, "Exempt income u/s 10(44) (New Pension System Trust) cannot be selected more than once.");

  /* ---------------- Fee u/s 234-I for a revised return (D11a) ---------------- */
  /* FilingStatus.ReturnFileSec 17 = 139(5) revised return (70_sec_inccore.js:110,747);
     IncomeDeductions.TotalIncome (:868); TaxComputation.IntrstPay.FeeFurnish234I (:918).
     The form carries no date-of-filing field; "filed after 31/12/2026" is judged on the day the
     return is validated (the same day it is uploaded from this file). */
  var fsec  = N(RG(I,"FilingStatus.ReturnFileSec",11));
  var ti    = N(RG(I,"IncomeDeductions.TotalIncome",0));
  var f234i = N(RG(I,"TaxComputation.IntrstPay.FeeFurnish234I",0));
  var late234i = (function(){ try{ return new Date() > new Date("2026-12-31T23:59:59"); }catch(e){ return false; } })();
  A(392, fsec!==17 ? f234i===0 : (ti>500000 || f234i===(late234i?1000:0)),
    "Fee u/s 234-I for a revised return (139(5)) filed after 31/12/2026 must be Rs. 1,000 when total income does not exceed Rs. 5,00,000 (nil before that date; nil for any other filing section).");
  A(397, fsec!==17 || ti<=500000 || f234i===(late234i?5000:0),
    "Fee u/s 234-I for a revised return (139(5)) filed after 31/12/2026 must be Rs. 5,000 when total income exceeds Rs. 5,00,000 (nil before that date).");

  /* ---------------- Schedule 80G — per-donee rows ---------------- */
  /* Schedule80G.<bucket>.DoneeWithPan[] with DonationAmtCash / DonationAmtOtherMode /
     TransactionRefNum / IFSCCode (70_sec_ded.js:486-501) */
  var G80B = ["Don100Percent","Don50PercentNoApprReqd","Don100PercentApprReqd","Don50PercentApprReqd"];
  var g80rows = [];
  G80B.forEach(function(b){ (RG(I,"Schedule80G."+b+".DoneeWithPan",[])||[]).forEach(function(d){ if(d) g80rows.push(d); }); });
  A(394, !I.Schedule80G || g80rows.every(function(d){
        return !(N(d.DonationAmtOtherMode)>0) || (!!str(d.TransactionRefNum) && !!str(d.IFSCCode)); }),
    "Schedule 80G: for a donation in a mode other than cash, the transaction reference number (UPI / cheque / IMPS / NEFT / RTGS) and the IFSC are mandatory.");
  A(399, !I.Schedule80G || g80rows.every(function(d){
        return !(N(d.DonationAmtCash)>0 && N(d.DonationAmtOtherMode)>0); }),
    "Schedule 80G: in any one row either a donation in cash or a donation in other mode can be entered, not both.");

  /* ---------------- 80CCD(1) — PRAN (WEAK: 70_sec_ded.js:589 covers only 80CCD(1B)) ---------------- */
  /* IncomeDeductions.UsrDeductUndChapVIA.Section80CCDEmployeeOrSE and .PRANDtls[].PRANNum (70_sec_ded.js:267) */
  var pranOK = (RG(I,"IncomeDeductions.UsrDeductUndChapVIA.PRANDtls",[])||[]).some(function(p){ return p && /^\d{12}$/.test(str(p.PRANNum)); });
  A(402, !(N(USR.Section80CCDEmployeeOrSE)>0) || pranOK,
    "A 12-digit PRAN must be provided in Schedule VIA to claim the deduction u/s 80CCD(1).");

  /* ---------------- Representative assessee — contact must not match the taxpayer's (WEAK: g1:233 omits Phone.PhoneNo) ---------------- */
  var repFlg = RG(I,"FilingStatus.AsseseeRepFlg","N");
  var repEm  = lc(RG(I,"FilingStatus.AssesseeRep.RepEmailID",""));
  var repMob = str(N(RG(I,"FilingStatus.AssesseeRep.RepMobileNo",0)));
  var tpEm1  = lc(ADR.EmailAddress), tpEm2 = lc(ADR.EmailAddressSec);
  var tpMob  = str(N(ADR.MobileNo)), tpPh = str(N(RG(I,"PersonalInfo.Address.Phone.PhoneNo","")));
  A(403, repFlg!=="Y" || (
        (!repEm || (repEm!==tpEm1 && repEm!==tpEm2)) &&
        (repMob==="0" || (repMob!==tpMob && (tpPh==="0" || repMob!==tpPh))) ),
    "Part A General: the e-mail ID and contact number of the representative assessee must not match the taxpayer's primary or secondary e-mail ID, mobile number or phone number.");

  /* ---------------- House property — co-ownership (PropCoOwnedFlg enum is YES/NO, 70_sec_inccore.js:820) ---------------- */
  (RG(I,"IncomeDeductions.PropertyDetails",[])||[]).forEach(function(p,i){ if(!p) return; var L="House property "+(i+1)+": ";
    var co = RG(p,"CoOwners",[])||[];
    A(404, p.PropCoOwnedFlg==="YES" || p.AsseseeShareProperty==null || N(p.AsseseeShareProperty)===100,
      L+"when the property is not co-owned the assessee's share must be 100%.");
    /* 405 (WEAK: g0:142 keys on "Y", the exporter writes "YES", so it never runs) */
    A(405, p.PropCoOwnedFlg!=="YES" || (co.length>0 && co.every(function(o){ var s=N(o&&o.PercentShareProperty); return s>0 && s<100; })),
      L+"when the property is co-owned, the percentage share of each other co-owner must be greater than 0 and less than 100%.");
    /* 346 (dead in g0:142 — same "Y" vs "YES" guard bug as 405; re-added here with the correct enum) */
    A(346, p.PropCoOwnedFlg!=="YES" || REQ(N(p.AsseseeShareProperty)+RSUM(co,"PercentShareProperty"), 100),
      L+"for a co-owned property the assessee's own percentage share and the co-owners' shares must total 100%.");
  });

  /* ---------------- 80CCC — at least one identifier row when claimed ---------------- */
  /* IncomeDeductions.UsrDeductUndChapVIA.PensionContribution80CCC[] (70_sec_ded.js:271-273) */
  A(409, !(N(USR.Section80CCC)>0) || (RG(I,"IncomeDeductions.UsrDeductUndChapVIA.PensionContribution80CCC",[])||[]).length>0,
    "When the deduction u/s 80CCC is more than 0, at least one row of identifier details (PRAN / other) must be added.");

  /* ---------------- Secondary address must differ from the primary when SecondaryAdd = N ---------------- */
  /* PersonalInfo.SecondaryAdd, PersonalInfo.AlternateAddress.{ResidenceNo,LocalityOrArea,CityOrTownOrDistrict,StateCode} (70_sec_inccore.js:734-740) */
  var ALT = RG(I,"PersonalInfo.AlternateAddress",{})||{};
  var altFilled = !!(str(ALT.ResidenceNo)||str(ALT.LocalityOrArea)||str(ALT.CityOrTownOrDistrict)||str(ALT.StateCode));
  var altSame = lc(ALT.ResidenceNo)===lc(ADR.ResidenceNo) && lc(ALT.LocalityOrArea)===lc(ADR.LocalityOrArea)
             && lc(ALT.CityOrTownOrDistrict)===lc(ADR.CityOrTownOrDistrict) && str(ALT.StateCode)===str(ADR.StateCode);
  A(411, RG(I,"PersonalInfo.SecondaryAdd","Y")!=="N" || !altFilled || !altSame,
    "Part A General: the secondary address must not be the same as the primary address when 'Is the secondary address same as primary?' is No.");

  /* ================= Category B (advisory in CBDT's list; offline-checkable, so asserted here) ================= */

  /* 2: TDS1 tax deducted cannot exceed gross salary — TDSonSalaries.TotalTDSonSalaries vs IncomeDeductions.GrossSalary */
  var tds1 = N(RG(I,"TDSonSalaries.TotalTDSonSalaries",0));
  A(2, !I.TDSonSalaries || tds1===0 || tds1 <= N(RG(I,"IncomeDeductions.GrossSalary",0))+1,
    "Schedule TDS1: the tax deducted on salary cannot be more than the gross salary reported in Part B.");

  /* 4: Aadhaar quoting u/s 139AA — PersonalInfo.AadhaarCardNo (70_sec_inccore.js:744), 12 digits, for an
        individual; exempt: residents of Assam (04), J&K (14), Meghalaya (21) and persons aged 80+ in the PY
        (Notification 37/2017); an Aadhaar enrolment ID (28 digits), if ever written, also satisfies it. */
  var aadh = str(PI.AadhaarCardNo), enrol = str(RG(I,"PersonalInfo.AadhaarEnrolmentId",""));
  var dob  = str(PI.DOB);
  var aadhExempt = ["04","14","21"].indexOf(str(ADR.StateCode))>=0 || (!!dob && dob < "1946-04-01");
  A(4, !str(PI.PAN) || status!=="I" || aadhExempt || /^\d{12}$/.test(aadh) || /^\d{28}$/.test(enrol),
    "Aadhaar number (12 digits) is mandatory for an individual u/s 139AA (Circular 03/2023); it must also be linked to the PAN.");

  /* 6 / 7: special-rate TDS section codes at col 2a — income taxed at special rates is not returnable in ITR-4.
     Short codes per TDSSEC_P4 (70_sec_paidbank.js:56-115): 194B = 94B / 94B-P, 194BB = 4BB, 194BA = 94BA / 94BA-P,
     194IA = 4IA (schema code; "4-IA" is 194I(a) rent and is not listed), 194IC = 4IC, 194LA = 4LA,
     194S = 94S / 94S-P, and for TDS2(ii) additionally 194R = 94R / 94R-P. */
  var SPEC2 = {"94B":1,"94B-P":1,"4BB":1,"94BA":1,"94BA-P":1,"4IA":1,"4IC":1,"4LA":1,"94S":1,"94S-P":1};
  var SPEC3 = {"94B":1,"94B-P":1,"4BB":1,"94BA":1,"94BA-P":1,"4IA":1,"4IC":1,"4LA":1,"94R":1,"94R-P":1,"94S":1,"94S-P":1};
  var firstHit = function(rows,set){ rows=rows||[]; for(var i=0;i<rows.length;i++){ if(rows[i] && set[str(rows[i].TDSSection)]) return i; } return -1; };
  var t2 = RG(I,"TDSonOthThanSals.TDSonOthThanSalDtls",[])||[], h2 = firstHit(t2,SPEC2);
  A(6, !I.TDSonOthThanSals || h2<0,
    "Schedule TDS2(i) row "+(h2+1)+": section "+(h2<0?"":str(t2[h2].TDSSection))+" at col 2a (194B/194BB/194BA/194IA/194IC/194LA/194S) implies income chargeable at a special rate; the assessee is not eligible to file ITR-4.");
  var t3 = RG(I,"ScheduleTDS3Dtls.TDS3Details",[])||[], h3 = firstHit(t3,SPEC3);
  A(7, !I.ScheduleTDS3Dtls || h3<0,
    "Schedule TDS2(ii) row "+(h3+1)+": section "+(h3<0?"":str(t3[h3].TDSSection))+" at col 2a (194B/194BB/194BA/194IA/194IC/194LA/194R/194S) implies income chargeable at a special rate; the assessee is not eligible to file ITR-4.");
});
