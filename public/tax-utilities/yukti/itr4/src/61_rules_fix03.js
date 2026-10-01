/* ITR-4 · AY 2026-27 — validation-rule FIX batch 03 (enforcement gaps/weak fixes).
   Registered via ruleset(); A(n,cond,msg) fires when cond is FALSE. Reads guarded; nothing throws.
   Serials: 167 186 187 188 212 213 215 222 224 225 235 238 247 249 252 253 254 259 261 263.
   Schema paths are the exact keys the ITR-4 exporters write (70_sec_inccore.js / 70_sec_ded.js /
   70_sec_paidbank.js) and that 61_rules_g0/g1/g2.js already read. Regime: isNew() (shell). */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  var USR    = RG(I,"IncomeDeductions.UsrDeductUndChapVIA",{})||{};   /* claimed (user-enterable) */
  var ALW    = RG(I,"IncomeDeductions.DeductUndChapVIA",{})||{};      /* allowed (post-cap, post-regime) */
  var status = RG(I,"PersonalInfo.Status","I");
  var empcat = RG(I,"PersonalInfo.EmployerCategory","OTH");
  var g      = function(p){ return N(RG(I,p)); };                     /* numeric read, default 0 */
  var nw     = (typeof isNew==="function") ? isNew() : true;          /* new regime unless opted out */

  var alwRows = RG(I,"IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
  var alwAmt  = function(code){ return RSUM(alwRows.filter(function(r){return r&&r.SalNatureDesc===code;}),"SalOthAmount"); };
  var exRows  = RG(I,"TaxExmpIntIncDtls.OthersInc.OthersIncDtls",[])||[];
  var osRows  = RG(I,"IncomeDeductions.OthersInc.OthersIncDtlsOthSrc",[])||[];
  var gcv     = RG(I,"ScheduleBP.GoodsDtlsUs44AE",[])||[];
  var ggcRows = RG(I,"Schedule80GGC.Schedule80GGCDetails",[])||[];
  /* salary u/s 17(1); the exporter writes IncomeDeductions.Salary only when non-zero, so fall back to gross */
  var sal171  = g("IncomeDeductions.Salary") || g("IncomeDeductions.GrossSalary");

  /* ---------------- Filing status: revised return over a 142(1) / 148 original ---------------- */
  /* 167: not mappable — the section under which the ORIGINAL return was filed is not captured by this
     form (FilingStatus carries only ReceiptNo and OrigRetFiledDate for a 139(5) return); no key exists. */
  /* 188 (second half, 148 proceeding bars revising the 139 return): not mappable — no filing-history /
     notice-history key exists in the ITR-4 schema for the original return; only NoticeNo of THIS return. */

  /* ---------------- Salary exempt allowances u/s 10(14) — 115BAC sub-codes ---------------- */
  /* 186: transport allowance to a physically handicapped assessee (10(14)(ii)(115BAC)) ≤ Rs. 3,200 × 12 */
  A(186, alwAmt("10(14)(ii)(115BAC)") <= 38400,
    "Exempt transport allowance u/s 10(14)(ii) granted to a physically handicapped assessee cannot exceed Rs. 38,400.");
  /* 187: the 115BAC-only 10(14)(i) sub-clause (a)-(c) code is closed under the OLD regime */
  A(187, nw || alwAmt("10(14)(i)(115BAC)")===0,
    "Old regime: exempt allowance u/s 10(14)(i) — allowances referred in sub-clauses (a) to (c) of Rule 2BB(1) (115BAC code) must be zero.");
  /* 188 (first half): the 115BAC-only 10(14)(ii) transport-handicapped code is closed under the OLD regime */
  A(188, nw || alwAmt("10(14)(ii)(115BAC)")===0,
    "Old regime: exempt transport allowance u/s 10(14)(ii) to a physically handicapped assessee (115BAC code) must be zero.");

  /* ---------------- Schedule BP ---------------- */
  /* 212: a HUF cannot declare presumptive income u/s 44ADA */
  A(212, status!=="H" || (N(RG(I,"ScheduleBP.PersumptiveInc44ADA.TotPersumptiveInc44ADA"))===0
                       && N(RG(I,"ScheduleBP.PersumptiveInc44ADA.GrsReceipt"))===0
                       && (RG(I,"ScheduleBP.NatOfBus44ADA",[])||[]).length===0),
    "A HUF is not eligible to claim presumptive income u/s 44ADA.");
  /* 213: goods-carriage registration numbers must not repeat within Schedule 44AE */
  A(213, (function(){ var seen={}; return gcv.every(function(v){ var k=String((v&&v.RegNumberGoodsCarriage)||"").toUpperCase().replace(/\s+/g,"");
      if(!k) return true; if(seen[k]) return false; seen[k]=1; return true; }); })(),
    "Schedule BP: the registration number of a goods carriage cannot be repeated in Schedule 44AE.");
  /* 238 (corrected): 44ADA receipts above Rs. 50 lakh are allowed only up to Rs. 75 lakh when cash receipts are ≤ 5% */
  (function(){ var e3=g("ScheduleBP.PersumptiveInc44ADA.GrsReceipt"), e3b=g("ScheduleBP.PersumptiveInc44ADA.GrsTotalTrnOverInCash44ADA");
    A(238, e3 <= 5000000 || (e3 <= 7500000 && e3b <= 0.05*e3),
      "Schedule BP: gross receipts u/s 44ADA above Rs. 50 lakh (up to Rs. 75 lakh only when cash receipts are 5% or less) need a tax audit u/s 44AB — use ITR-3/ITR-5.");
  })();

  /* ---------------- Salary: 10(10CC) vs TDS u/s 192 ---------------- */
  /* 215: tax paid by the employer on a non-monetary perquisite cannot exceed the TDS u/s 192 claimed in Schedule TDS1 */
  A(215, alwAmt("10(10CC)") <= g("TDSonSalaries.TotalTDSonSalaries")+1,
    "Exempt allowance u/s 10(10CC) cannot be more than the TDS claimed u/s 192 in Schedule TDS1.");

  /* ---------------- Exempt income (D20): no sub-category more than once (all codes) ---------------- */
  A(222, (function(){ var seen={}; return exRows.every(function(r){ var k=r&&r.SubCategory; if(!k) return true;
      if(seen[k]) return false; seen[k]=1; return true; }); })(),
    "Under exempt income, a nature-of-income dropdown cannot be selected more than once.");

  /* ---------------- 80CCH (Agnipath) ---------------- */
  var cch = Math.max(N(USR.AnyOthSec80CCH), N(ALW.AnyOthSec80CCH));
  /* 224 (corrected): 80CCH ≤ 46.2% of salary u/s 17(1), and never above Rs. 2,88,000 */
  A(224, !(cch>0) || cch <= Math.min(R(0.462*sal171), 288000)+1,
    "Deduction u/s 80CCH cannot exceed 46.2% of salary u/s 17(1), to a maximum of Rs. 2,88,000.");
  /* 225: 80CCH only when the nature of employment is Central Government (the joining-age 17-27 test is not
     mappable — the date of joining the armed forces is not captured by this form). */
  A(225, !(cch>0) || empcat==="CGOV",
    "Deduction u/s 80CCH can be claimed only when the nature of employment is 'Central Government'.");

  /* ---------------- Firm: tax regime (A23 / 115BAC) not applicable ---------------- */
  A(235, status!=="F" || (RG(I,"FilingStatus.Form10IEAEarlierAYOldRegime","NA")==="NA"
                       && RG(I,"FilingStatus.F10IEACurrAYOldRegime","")!=="Y"
                       && !RG(I,"FilingStatus.Form10IEAAssYear","")
                       && !RG(I,"FilingStatus.F10IEADateCurrAYOldTax","")),
    "For a Firm the tax regime (115BAC) is not applicable — Form 10-IEA fields must be 'Not applicable' and left blank.");

  /* ---------------- Schedule 80GGC: other-mode donations need transaction details ---------------- */
  A(247, ggcRows.every(function(r){ if(!r||!(N(r.DonationAmtOtherMode)>0)) return true;
      return !!r.TransactionRefNum && !!r.IFSCCode; }),
    "Schedule 80GGC: for a donation made in a mode other than cash, the transaction reference number and IFSC code are required.");

  /* ---------------- Schedule 80U / 80DD ---------------- */
  /* 249: VIA Section 80U (user and system) = Schedule 80U sl. ii */
  A(249, REQ(N(ALW.Section80U), N(RG(I,"Schedule80U.DeductionAmount"))) && REQ(N(USR.Section80U), N(RG(I,"Schedule80U.DeductionAmount"))),
    "In Schedule VIA, the value at Section 80U (both user and system) must equal the deduction amount in Schedule 80U.");
  /* 252 / 253: Form 10-IA acknowledgement is required when a deduction is claimed */
  A(252, !(N(RG(I,"Schedule80DD.DeductionAmount"))>0) || /^\d{15}$/.test(String(RG(I,"Schedule80DD.Form10IAAckNum",""))),
    "Schedule 80DD: when a deduction is claimed, the 15-digit acknowledgement number of Form 10-IA is required.");
  A(253, !(N(RG(I,"Schedule80U.DeductionAmount"))>0) || /^\d{15}$/.test(String(RG(I,"Schedule80U.Form10IAAckNum",""))),
    "Schedule 80U: when a deduction is claimed, the 15-digit acknowledgement number of Form 10-IA is required.");
  /* 254: dependent 'Member of the HUF' (code 8) is for a HUF only, and a HUF's dependent must be a member of the HUF */
  A(254, !I.Schedule80DD || (status==="H" ? RG(I,"Schedule80DD.DependentType","")==="8"
                                          : RG(I,"Schedule80DD.DependentType","")!=="8"),
    "Schedule 80DD: the dependent type 'Member of the HUF' applies only to a HUF, and a HUF can claim 80DD only for a member of the HUF.");

  /* ---------------- Personal info: valid mobile number ---------------- */
  (function(){ var m=RG(I,"PersonalInfo.Address.MobileNo",""); var cc=String(RG(I,"PersonalInfo.Address.CountryCodeMobile","91")||"91");
    if(m===""||m==null) return;                                     /* presence is enforced by the required-key skeleton */
    var s=String(m).replace(/\D/g,"");
    A(259, cc==="91" ? /^[6-9]\d{9}$/.test(s) : (s.length>=4 && s.length<=15),
      "Enter a valid mobile number (10 digits starting with 6-9 for an Indian number).");
  })();

  /* ---------------- 57(iia) family-pension deduction (both regimes) ---------------- */
  (function(){ var fap=RSUM(osRows.filter(function(r){return r&&r.OthSrcNatureDesc==="FAP";}),"OthSrcOthAmount");
    var ded=g("IncomeDeductions.DeductionUs57iia");
    A(261, !(ded>0) || ded <= Math.min(Math.round(fap/3), nw?25000:15000)+1,
      "Deduction u/s 57(iia) cannot exceed one-third of the family pension, subject to Rs. 25,000 (new regime) / Rs. 15,000 (old regime).");
  })();

  /* ---------------- 80CCD(2) — new regime: 14% of salary u/s 17(1) for CG/SG/PSU/Others ---------------- */
  A(263, !nw || ["CGOV","SGOV","PSU","OTH"].indexOf(empcat)<0 || sal171===0
        || N(USR.Section80CCDEmployer) <= R(0.14*sal171)+1,
    "New regime: deduction u/s 80CCD(2) cannot exceed 14% of salary u/s 17(1) for an employer category of Central Govt, State Govt, PSU or Others.");
});
