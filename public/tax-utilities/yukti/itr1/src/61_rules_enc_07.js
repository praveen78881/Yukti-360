/* =====================================================================
   ITR-1 · A.Y. 2026-27 — Category-A validation rules, batch enc_07 (Phase 6).
   Serial range A301–A339 (the new-regime EIC-judge exempt-allowance bar; the
   80CCC row-sum identity plus its "add a row" and PRAN gates; the twenty-plus
   ExemptIncAgriOthUs10 single-select drop-downs and the new-regime 10(32) bar;
   the Schedule-80G non-cash IFSC/transaction-reference mandate and the cash
   Rs.2,000 eligibility cap; the Schedule-80GGC name/PAN and mode gates; the
   representative-assessee contact-collision rule; the co-owned house-property
   share rules and the unrealised-rent ceiling; and the Part-A-General
   secondary-address rules).

   Registered via ruleset(fn); runRules() (forms/ITR-1/src/60_rules.js) invokes
   it with (I,S_,A,Dd). A(n,cond,msg) fires (pushes a Category-A block) when cond
   — the "this return is lawful" assertion — is FALSE. Every read is guarded
   (RG / N / (X||{}) / S0); nothing throws. Keys are the built-return ITR1 schema
   paths (I = Object.values(buildReturn().ITR)[0]); the paths and enum codes were
   taken from books/ITR-1/schema_tree.md, rule_census.md, caps.md, enums.json and
   the section builders (70_sec_sal expSal — AllwncExemptUs10 SalNatureDesc/
   SalOthAmount; 70_sec_ded expDed — UsrDeductUndChapVIA.{PensionContribution80CCC,
   PRANDtls,Section80CCC/CCD}, Schedule80G four buckets, Schedule80GGC; 70_sec_ei
   expEi — ExemptIncAgriOthUs10 SubCategory/OthAmount; 70_sec_hp expHP —
   PropertyDetails[] PropCoOwnedFlg/AsseseeShareProperty/CoOwners; 70_sec_ret
   expRet — FilingStatus.AssesseeRep; 70_sec_who expWho — PersonalInfo.Address /
   SecondaryAdd / AlternateAddress). Encoded from each rule's own text (rule 6).

   Regime gate: FilingStatus.OptOutNewTaxRegime — "Y" = OLD regime, "N"/absent =
   NEW regime (default). A301 and A323 are the NEW-regime "must be 0" bars (the
   EIC judge allowance and the 10(32) minor-child exemption). The Chapter-VI-A
   nested leaves (PensionContribution80CCC, PRANDtls) are built only under the
   OLD regime (expDed), which is why A302/A335/A337 read them under a presence
   guard rather than a regime gate.

   Secondary-address note (A339): in the built return PersonalInfo.SecondaryAdd
   is the utility's "add a distinct secondary/communication address?" flag —
   "Y" is the branch under which expWho emits PersonalInfo.AlternateAddress
   (70_sec_who §"SecondaryAdd + AlternateAddress"). So the faithful encoding of
   "the secondary address must not be the same as the primary address" is: when
   SecondaryAdd==="Y" the AlternateAddress signature must differ from the primary
   Address signature. A338 only asks that the flag itself be present.

   Serials in A301–A339 NOT encoded here, and why (bucketed in the census —
   books/ITR-1/rule_census.md — never faked):
     A324 — NA (census). 234-I fee = Rs.1,000 for a 139(5) revised return filed
            after 31.12.2026 with total income <= Rs.5,00,000 — keyed to the
            FILING TIMESTAMP, which the built return does not carry (the portal
            applies it at upload).
     A328 — NA (census). 234-I fee = Rs.5,000 for the same, total income >
            Rs.5,00,000 — filing-timestamp keyed; see A324.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";          /* "present / non-blank" */
  const LC=v=>String(v==null?"":v).trim().toLowerCase();
  const tol=1;

  /* ---- guarded reads ---- */
  const ID  = RG(I,"ITR1_IncomeDeductions",{})||{};
  const usr = RG(ID,"UsrDeductUndChapVIA",{})||{};      /* entered Chapter VI-A */
  const FS  = RG(I,"FilingStatus",{})||{};
  const PI  = RG(I,"PersonalInfo",{})||{};
  const AD  = RG(PI,"Address",{})||{};
  const AA  = RG(PI,"AlternateAddress",{})||{};
  const AR  = RG(FS,"AssesseeRep",{})||{};

  const old = String(FS.OptOutNewTaxRegime)==="Y";      /* Y = OLD regime */

  /* repeating rows */
  const allw10 = RG(ID,"AllwncExemptUs10.AllwncExemptUs10Dtls",[])||[];
  const eiRows = RG(ID,"ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls",[])||[];
  const pen    = RG(usr,"PensionContribution80CCC",[])||[];   /* 80CCC rows */
  const pran   = RG(usr,"PRANDtls",[])||[];                   /* NPS PRAN rows */
  const props  = RG(ID,"PropertyDetails",[])||[];

  const allwAmt = code => allw10.filter(r=>r&&String(r.SalNatureDesc)===code)
                                .reduce((a,r)=>a+N(r.SalOthAmount),0);
  const eiCount = code => eiRows.filter(r=>r&&String(r.SubCategory)===code).length;
  const eiAmt   = code => eiRows.filter(r=>r&&String(r.SubCategory)===code)
                                .reduce((a,r)=>a+N(r.OthAmount),0);

  /* ===================== Salary — exempt allowances (new regime) ===================== */
  /* A301 — new regime: the judge's exempt income (EIC, Supreme/High Court Judges Act) must be 0. */
  A(301, old || !(allwAmt("EIC")>0),
    "New regime: the exempt allowance for income received by a judge covered under the Supreme Court / High Court Judges (Salaries) Act cannot be more than zero.");

  /* ===================== 80CCC — pension-fund contribution rows ===================== */
  /* A302 — the sum of the individual 80CCC "Amount" rows must equal the 80CCC total. */
  A(302, !pen.length || REQ(N(usr.Section80CCC), pen.reduce((a,r)=>a+N(r&&r.Amount),0), 2),
    "The sum of the individual 80CCC contribution rows (Amount) must equal the total deduction shown against 80CCC in the income details.");

  /* ===================== Exempt income — single-select drop-downs ===================== */
  /* A303–A322 — each ExemptIncAgriOthUs10 sub-category can be selected only once. */
  A(303, eiCount("10(2)")<=1,     "Exempt income: Sec 10(2) (member's share from a HUF) can be selected only once.");
  A(304, eiCount("10(10BB)")<=1,  "Exempt income: Sec 10(10BB) (Bhopal Gas Leak Disaster payments) can be selected only once.");
  A(305, eiCount("10(11A)")<=1,   "Exempt income: Sec 10(11A) (Sukanya Samriddhi Yojana account) can be selected only once.");
  A(306, eiCount("10(12A)")<=1,   "Exempt income: Sec 10(12A) (NPS partial withdrawal) can be selected only once.");
  A(307, eiCount("10(12AA)")<=1,  "Exempt income: Sec 10(12AA) (payment from the National Pension System Trust) can be selected only once.");
  A(308, eiCount("10(12AB)")<=1,  "Exempt income: Sec 10(12AB) (lump sum per notification FX-1/3/2024-PR) can be selected only once.");
  A(309, eiCount("10(12B)")<=1,   "Exempt income: Sec 10(12B) (NPS lump sum at exit/closure) can be selected only once.");
  A(310, eiCount("10(12BA)")<=1,  "Exempt income: Sec 10(12BA) (partial withdrawal from the National Pension System) can be selected only once.");
  A(311, eiCount("10(12C)")<=1,   "Exempt income: Sec 10(12C) (Agniveer Corpus Fund income) can be selected only once.");
  A(312, eiCount("10(15)")<=1,    "Exempt income: Sec 10(15) (interest on specified securities/investments) can be selected only once.");
  A(313, eiCount("10(19A)")<=1,   "Exempt income: Sec 10(19A) (annual value of one palace of an ex-ruler) can be selected only once.");
  A(314, eiCount("10(23AA)")<=1,  "Exempt income: Sec 10(23AA) (sum received on behalf of an armed-forces Fund) can be selected only once.");
  A(315, eiCount("10(23FBB)")<=1, "Exempt income: Sec 10(23FBB) (Sec 115UB income to a unit holder of an investment fund) can be selected only once.");
  A(316, eiCount("10(23FD)")<=1,  "Exempt income: Sec 10(23FD) (unit-holder income from a Business Trust, certain parts) can be selected only once.");
  A(317, eiCount("10(25)")<=1,    "Exempt income: Sec 10(25) (sum received by trustees of an approved superannuation/gratuity/pension fund) can be selected only once.");
  A(318, eiCount("10(32)")<=1,    "Exempt income: Sec 10(32) (minor child's income — small exemption) can be selected only once.");
  A(319, eiCount("10(35)")<=1,    "Exempt income: Sec 10(35) (income from specified Mutual Funds) can be selected only once.");
  A(320, eiCount("10(35A)")<=1,   "Exempt income: Sec 10(35A) (distributed income u/s 115TA from a securitisation trust) can be selected only once.");
  A(321, eiCount("10(43)")<=1,    "Exempt income: Sec 10(43) (reverse-mortgage payments to senior citizens) can be selected only once.");
  A(322, eiCount("10(44)")<=1,    "Exempt income: Sec 10(44) (income for/on behalf of the New Pension System Trust) can be selected only once.");
  /* A323 — new regime: exempt income u/s 10(32) (minor child) must be 0. */
  A(323, old || !(eiAmt("10(32)")>0),
    "New regime: exempt income u/s 10(32) (minor child's income) cannot be more than zero.");

  /* A324 — NA (234-I fee, filing-timestamp keyed); see header. */

  /* ===================== Schedule 80G — donee rows ===================== */
  const G80 = RG(I,"Schedule80G",{})||{};
  const G80BUCKETS=["Don100Percent","Don50PercentNoApprReqd","Don100PercentApprReqd","Don50PercentApprReqd"];
  const g80rows = [];
  if(I.Schedule80G) G80BUCKETS.forEach(bk=>{
    (RG(G80,bk+".DoneeWithPan",[])||[]).forEach(r=>{ if(r) g80rows.push(r); });
  });
  /* A325 — non-cash donation: IFSC and the transaction reference number are mandatory. */
  const g80NoRef = g80rows.some(r=>N(r.DonationAmtOtherMode)>0 && !(S0(r.IFSCCode)&&S0(r.TransactionRefNum)));
  A(325, !g80NoRef,
    "Schedule 80G: the IFSC and the transaction reference number (UPI / cheque / IMPS / NEFT / RTGS) are mandatory when a donation is made in a mode other than cash.");
  /* A326 — duplicate of A325 (both serials present in rules.json). */
  A(326, !g80NoRef,
    "Schedule 80G: the IFSC and the transaction reference number are mandatory when a donation is made in a mode other than cash.");
  /* A327 — a cash donation is eligible only to the extent of Rs.2,000 (or claimed, whichever is lower). */
  const g80Over = g80rows.some(r=>N(r.EligibleDonationAmt) > N(r.DonationAmtOtherMode)+Math.min(N(r.DonationAmtCash),2000)+tol);
  A(327, !g80Over,
    "Schedule 80G: the eligible amount of a cash donation is allowed only to the extent of Rs.2,000 or the amount claimed, whichever is lower.");

  /* A328 — NA (234-I fee, filing-timestamp keyed); see header. */

  /* ===================== Schedule 80GGC — donation to a political party ===================== */
  const ggc = RG(I,"Schedule80GGC.Schedule80GGCDetails",[])||[];
  /* A329 — the political party's name and PAN are necessary to claim the 80GGC deduction. */
  A(329, !I.Schedule80GGC || ggc.every(r=>!r || (S0(r.PoliticalPartyName)&&S0(r.PoliticalPartyPAN))),
    "The name and PAN of the political party are required to claim the deduction u/s 80GGC.");
  /* A330 — each 80GGC row must carry either a cash donation or a donation in another mode. */
  A(330, !I.Schedule80GGC || ggc.every(r=>!r || N(r.DonationAmtCash)>0 || N(r.DonationAmtOtherMode)>0),
    "Schedule 80GGC: either a cash donation or a donation in another mode must be entered under each row.");

  /* ===================== Representative assessee ===================== */
  /* A331 — the representative's email / contact must not match the taxpayer's (primary or secondary). */
  const taxEmails  = [AD.EmailAddress, AD.EmailAddressSec].filter(S0).map(LC);
  const taxMobiles = [AD.MobileNo, AD.MobileNoSec].filter(S0).map(v=>String(v).trim());
  const repEmailClash  = S0(AR.RepEmailID) && taxEmails.indexOf(LC(AR.RepEmailID))>=0;
  const repMobileClash = S0(AR.RepMobileNo) && taxMobiles.indexOf(String(AR.RepMobileNo).trim())>=0;
  A(331, String(FS.AsseseeRepFlg)!=="Y" || !(repEmailClash || repMobileClash),
    "Part A General: the representative assessee's email id and contact number must not match the taxpayer's email id or contact number (primary or secondary).");

  /* ===================== House property — co-ownership & unrealised rent ===================== */
  props.forEach((p,i)=>{
    p=p||{};
    const rd  = RG(p,"Rentdetails",{})||{};
    const co  = String(p.PropCoOwnedFlg)==="YES";
    const shr = N(p.AsseseeShareProperty);
    const cos = RG(p,"CoOwners",[])||[];
    const alv = N(rd.AnnualLetableValue);
    const rnr = N(rd.RentNotRealized);
    const tag = " (property "+(i+1)+")";
    /* A332 — co-owned: the assessee's share must be less than 100%. */
    A(332, !co || shr<100,
      "For a co-owned house property the assessee's percentage share must be less than 100%."+tag);
    /* A333 — co-owned: every other co-owner's share must be greater than 0 and less than 100%. */
    A(333, !co || cos.every(c=>{const s=N(c&&c.PercentShareProperty); return s>0 && s<100;}),
      "For a co-owned house property each other co-owner's percentage share must be greater than 0 and less than 100%."+tag);
    /* A334 — not co-owned: the assessee's share must be 100%. */
    A(334, co || REQ(shr,100,0.5),
      "For a property that is not co-owned the assessee's percentage share must be 100%."+tag);
    /* A336 — unrealised rent cannot exceed the gross rent / annual lettable value. */
    A(336, rnr<=alv+tol,
      "The amount of rent which cannot be realised cannot be more than the gross rent received / receivable (annual lettable value)."+tag);
  });

  /* ===================== NPS PRAN & 80CCC completeness ===================== */
  /* A335 — a PRAN is entered but both 80CCD(1) and 80CCD(1B) are zero. */
  A(335, !(pran.length>0) || N(usr.Section80CCDEmployeeOrSE)>0 || N(usr.Section80CCD1B)>0,
    "A PRAN has been entered but the amounts claimed u/s 80CCD(1) and 80CCD(1B) are both zero.");
  /* A337 — 80CCC claimed: at least one row must carry the identifier type, number and amount. */
  A(337, !(N(usr.Section80CCC)>0) || pen.some(r=>r && S0(r.TypeofIdentifier) && S0(r.NameofIdentifier) && N(r.Amount)>0),
    "When a deduction u/s 80CCC is claimed, at least one row with the type of identifier, the identifier number and the amount must be provided.");

  /* ===================== Part A General — secondary address ===================== */
  /* A338 — the secondary-address flag must be present in the return (Part A General is built). */
  A(338, !I.PersonalInfo || S0(PI.SecondaryAdd),
    "Part A General Information: the secondary-address selection is mandatory in the return of income.");
  /* A339 — when a distinct secondary address is added it must not equal the primary address. */
  const addrSig = a => [a.ResidenceNo,a.ResidenceName,a.RoadOrStreet,a.LocalityOrArea,
    a.CityOrTownOrDistrict,a.StateCode,a.CountryCode,a.PinCode,a.ZipCode]
    .map(v=>LC(v)).join("|");
  A(339, String(PI.SecondaryAdd)!=="Y" || !PI.AlternateAddress || addrSig(AA)!==addrSig(AD),
    "Part A General Information: the secondary address must not be the same as the primary address.");
});
