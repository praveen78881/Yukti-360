/* =====================================================================
   ITR-1 · Section "ret" — Return and regime (filing status)
   Books: books/ITR-1/schema_tree.md §4 FilingStatus · §5 PartA_139_8A ·
   §6 PartB-ATI · sections.md S2 · caps.md §1 (regime bar) · enums.json
   (ReturnFileSec, OptOutNewTaxRegime, AsseseeRepFlg, SeventhProvisio_flags,
   clauseiv7provisio139iNature, ReasonsForUpdatingIncome_139_8A,
   UpdatedReturnDuringPeriod_139_8A, PreviouslyFiledForThisAY_139_8A).
   Compute order 12 (corder 12) — runs right after "who": it publishes the
   TAX-REGIME master gate S.C.ret.regime that every other section's engine
   reads. Screen order 20.

   Owns / writes on export (home EVERY leaf):
     §4 FilingStatus:
       · ReturnFileSec (valid for ITR-1: 11/12/17/20/21 ONLY; 13/14/15/16/18
         are blocked with an error)
       · OptOutNewTaxRegime (N = new/default, Y = old) — the regime toggle
       · SeventhProvisio139 + DepAmtAggAmtExcd1CrPrYrFlg / AmtSeventhProvisio139i
         + IncrExpAggAmt2LkTrvFrgnCntryFlg / AmtSeventhProvisio139ii
         + IncrExpAggAmt1LkElctrctyPrYrFlg / AmtSeventhProvisio139iii
       · NoticeNo / NoticeDateUnderSec (13/14/15/16/18/20)
       · ReceiptNo / OrigRetFiledDate (17/18/21)
       · ItrFilingDueDate (auto 2026-07-31)
       · clauseiv7provisio139i + clauseiv7provisio139iDtls[]{Nature, Amount}
       · AsseseeRepFlg + AssesseeRep{RepName, RepEmailID,
         CountryCodeRepMobileNo, RepMobileNo}
     §5 PartA_139_8A + §6 PartB-ATI (ONLY when ReturnFileSec == 21, 139(8A)):
       the whole updated-return subtree — reasons, period, unabsorbed-
       depreciation years, head-wise income, the 140B additional-tax
       computation, Schedule IT-1 / IT-2 challans and relief u/s 89.
       Emits PartA_139_8A.AssessmentYear "2026" (utility hard-codes 2025 — bug).

   PUBLISHES (S.C.ret.*):
     · regime   "new" | "old"     — the master gate (OptOutNewTaxRegime N/Y)
     · optout   "N" | "Y"         — the raw flag
     · is8A     bool              — ReturnFileSec == 21 (updated return)
     · sec      int               — the chosen ReturnFileSec
     · secValid bool              — whether the section is legal for ITR-1
     · seventhProviso bool        — SeventhProvisio139 == Y (forces 234F)
     · dueDate  "2026-07-31"      — ItrFilingDueDate (234A / 234F reference)
     · filedDate (DD/MM/YYYY)     — actual filing date (not a schema leaf;
       published for the tax section's 234A month-count and 234F late test)
   ===================================================================== */

/* ---- ReturnFileSec — enums.json ReturnFileSec [code,label,valid] ------- */
const RET1_RETSEC=[
  [11,"139(1) - On or before due date",true],
  [12,"139(4) - Belated",true],
  [13,"142(1)",false],
  [14,"148",false],
  [15,"153A",false],
  [16,"153C",false],
  [17,"139(5) - Revised",true],
  [18,"139(9) - Defective",false],
  [20,"119(2)(b) - After condonation of delay",true],
  [21,"139(8A) - Updated return",true]];
const RET1_VALIDSEC=[11,12,17,20,21];
const RET1_BLOCKSEC=[13,14,15,16,18];
/* codes that open the NoticeNo / NoticeDateUnderSec pair (schema §4 cond) */
const RET1_SEC_NOTICE=[13,14,15,16,18,20];
/* codes that open the ReceiptNo / OrigRetFiledDate pair (schema §4 cond) */
const RET1_SEC_RECEIPT=[17,18,21];

/* ---- Y/N flag list (SeventhProvisio_flags, AsseseeRepFlg, generic) ---- */
const RET1_YN=[["Y","Yes"],["N","No"]];
/* OptOutNewTaxRegime — enums.json OptOutNewTaxRegime (N=new default, Y=old) */
const RET1_OPTOUT=[["N","No — stay in the new tax regime u/s 115BAC(1A) (default)"],
                   ["Y","Yes — opt OUT of the new regime (the old regime)"]];
/* clauseiv7provisio139iNature — enums.json (1 = deposit>1cr, 2 = expenditure>2L) */
const RET1_CLAUSE_NATURE=[
  ["1","Deposit exceeding ₹1 crore in one or more current accounts"],
  ["2","Expenditure exceeding ₹2 lakh on foreign travel / other specified expenditure"]];
/* ReasonsForUpdatingIncome_139_8A — enums.json VERBATIM */
const RET1_REASONS=[
  ["1","Return previously not filed"],["2","Income not reported correctly"],
  ["3","Wrong heads of income chosen"],["4","Reduction of carried forward loss"],
  ["5","Reduction of unabsorbed depreciation"],["6","Reduction of tax credit u/s 115JB/115JC"],
  ["7","Wrong rate of tax"],["OTH","Others"]];
/* UpdatedReturnDuringPeriod_139_8A — enums.json VERBATIM (drives the 140B rate) */
const RET1_PERIOD=[
  ["1","Up to 12 months from end of Relevant AY"],
  ["2","Between 12 to 24 months from end of Relevant AY"],
  ["3","Between 24 to 36 months from end of Relevant AY"],
  ["4","Between 36 to 48 months from end of Relevant AY"]];
/* additional-tax rate u/s 140B by the period above (25 / 50 / 60 / 70 %) */
const RET1_140B_RATE={"1":0.25,"2":0.50,"3":0.60,"4":0.70};
/* PreviouslyFiledForThisAY_139_8A — enums.json (1 = Yes, 2 = No) */
const RET1_PREVFILED8A=[["1","Yes"],["2","No"]];
/* PreviouslyFiledForThisAY / LaidOutIn_139_8A / UnabsorbedDepreciation /
   RevisedReturnFile / UpdatedReturnFile — schema §5 gives no dedicated enum
   block; the utility stores a Yes/No (Mid 1). Y/N used. */
const RET1_YESNO=[["Y","Yes"],["N","No"]];

const RET1_DUEDATE="2026-07-31";             /* ItrFilingDueDate (auto) */

/* ---- state (guarded seeds) ------------------------------------------- */
S.ret = S.ret || {};
(function(R0){
  const d=(k,v)=>{if(R0[k]===undefined)R0[k]=v;};
  /* FilingStatus */
  d("optout","N");                           /* OptOutNewTaxRegime (default new) */
  d("sec",11);                               /* ReturnFileSec */
  d("filed","");                             /* actual filing date (non-schema; for 234A/F) */
  d("noticeNo",""); d("noticeDate","");
  d("receiptNo",""); d("origDate","");
  d("provFlag","N");                         /* SeventhProvisio139 */
  d("depFlag","N");  d("depAmt","");         /* deposit > 1 crore */
  d("trvFlag","N");  d("trvAmt","");         /* foreign travel > 2 lakh */
  d("eleFlag","N");  d("eleAmt","");         /* electricity > 1 lakh */
  d("clauseFlag","N");                       /* clauseiv7provisio139i */
  d("cl1Flag","N");  d("cl1Amt","");         /* clause nature 1 (deposit) */
  d("cl2Flag","N");  d("cl2Amt","");         /* clause nature 2 (expenditure) */
  d("repFlg","N");                           /* AsseseeRepFlg */
  d("repName",""); d("repEmail",""); d("repMobileCc","91"); d("repMobile","");
  /* PartA_139_8A (updated return) */
  d("uAadhaar",""); d("uName",""); d("uPan","");
  d("prevFiled","N");                        /* PreviouslyFiledForThisAY */
  d("prevFiled8A","2");                      /* PreviouslyFiledForThisAY_139_8A */
  d("appItrForm","ITR1"); d("appAckNo",""); d("appOrigDate","");
  d("laidOut","N");                          /* LaidOutIn_139_8A */
  d("reasons",[]);                           /* ReasonsForUpdatingIncDtls[] */
  d("period","1");                           /* UpdatedReturnDuringPeriod */
  d("unabDep","N");                          /* RetrntoRedCarriedFL.UnabsorbedDepreciation */
  d("udYears",[]);                           /* UnabsorbedDepreciationYearDtls[] */
  /* PartB-ATI (updated return) */
  d("atiSal",""); d("atiHP",""); d("atiOS","");   /* HeadOfInc */
  d("latestTotInc","");                      /* LatestTotInc */
  d("amtPayable","");                        /* AmtPayable (Part B-TTI of updated ITR) */
  d("amtRefundable","");                     /* AmtRefundable */
  d("lastAmtPayable","");                    /* LastAmtPayable (per last valid return) */
  d("refund","");                            /* Refund (per last valid return) */
  d("feeIncUS234F","");                      /* FeeIncUS234F */
  d("regAssTax","");                         /* RegAssessementTAX */
  d("releifUS89","");                        /* ReleifUS89 */
  d("it1",[]);                               /* ScheduleIT1 challans */
  d("it2",[]);                               /* ScheduleIT2 challans */
})(S.ret);

/* =====================================================================
   ENGINE — engRet(): publishes the regime master-gate and the 139(8A)
   flag, and (when it is an updated return) the whole PartB-ATI 140B
   computation into S.C.ret so export and screen share one source of truth.
   ===================================================================== */
function engRet(){
  const R0=S.ret||{};
  const optout=(st0(R0.optout)==="Y")?"Y":"N";
  const sec=R(R0.sec)||11;
  const C=S.C.ret={ income:0 };
  C.optout   = optout;
  C.regime   = optout==="Y"?"old":"new";     /* the master gate */
  C.sec      = sec;
  C.secValid = RET1_VALIDSEC.indexOf(sec)>=0;
  C.is8A     = sec===21;                       /* updated return */
  C.seventhProviso = st0(R0.provFlag)==="Y";   /* forces 234F regardless of GTI */
  C.dueDate  = RET1_DUEDATE;
  C.filedDate= st0(R0.filed);
  C.repFlg   = st0(R0.repFlg)==="Y";

  /* ---- PartB-ATI · 140B additional-tax computation (updated return) ---- */
  const A={};
  A.salaries = R(R0.atiSal);
  A.hp       = R(R0.atiHP);
  A.os       = R(R0.atiOS);
  A.total    = A.salaries + A.hp + A.os;                 /* HeadOfInc.Total */
  A.latest   = R(R0.latestTotInc);                        /* last valid return TI */
  A.updated  = A.latest + A.total;                        /* UpdatedTotInc */
  A.amtPayable   = R(R0.amtPayable);
  A.amtRefundable= R(R0.amtRefundable);
  A.lastPayable  = R(R0.lastAmtPayable);
  A.refund       = R(R0.refund);
  A.fee234F      = R(R0.feeIncUS234F);
  A.regTax       = R(R0.regAssTax);
  A.relief89     = R(R0.releifUS89);
  /* aggregate liability on additional income (both variants homed):
     - no earlier refund : AmtPayable - LastAmtPayable
     - earlier refund     : AmtPayable + Refund (the refund is added back) */
  A.aggNoRefund = Math.max(0, A.amtPayable - A.lastPayable);
  A.aggRefund   = Math.max(0, A.amtPayable + A.refund);
  A.useRefund   = A.refund>0;
  const AGG     = A.useRefund ? A.aggRefund : A.aggNoRefund;
  const rate    = RET1_140B_RATE[st0(R0.period)]||0.25;
  A.rate        = rate;
  A.addtnlIncTax= R(AGG*rate);                            /* AddtnlIncTax */
  A.netPayable  = AGG + A.addtnlIncTax;                   /* NetPayable */
  A.it1Total    = (R0.it1||[]).reduce((s,r)=>s+R(r.amt),0);
  A.it2Total    = (R0.it2||[]).reduce((s,r)=>s+R(r.amt),0);
  A.tax140B     = A.it1Total + A.it2Total;                /* TaxUS140B (challans) */
  A.taxDue      = Math.max(0, A.netPayable - A.tax140B);  /* TaxDue10_11 */
  A.totRefund   = A.amtRefundable;                        /* TotRefund */
  C.ati=A;
}

/* =====================================================================
   RENDERER — secRet(): the return / regime page, then (only when the
   updated-return section 21 is chosen) the whole 139(8A) sub-form.
   ===================================================================== */
function secRet(){
  const R0=S.ret, C=S.C.ret||{};
  const sec=R(R0.sec)||11;
  const valid=RET1_VALIDSEC.indexOf(sec)>=0;
  let h="";

  /* ===================== The tax regime ===================== */
  h+=sub("Tax regime");
  h+=row("Do you opt OUT of the new tax regime under section 115BAC(6)?",
    sel("ret.optout",RET1_OPTOUT,{blank:false}),
    {req:1,ref:"FilingStatus.OptOutNewTaxRegime",
     hint:"the default is No — the new regime u/s 115BAC(1A)"});
  if(st0(R0.optout)==="Y")
    h+=note("<b>Old regime.</b> The Chapter VI-A detail schedules and the HRA "+
      "10(13A) exemption become available, the standard deduction u/s 16(ia) is "+
      "₹50,000, and the senior-citizen basic exemption (₹3,00,000 / "+
      "₹5,00,000) applies.");
  else
    h+=note("<b>New regime u/s 115BAC(1A)</b> (default). Only 80CCD(2) and "+
      "80CCH(2) survive of Chapter VI-A; 16(ii) and self-occupied 24(b) are "+
      "closed; the standard deduction u/s 16(ia) is ₹75,000; the 87A rebate "+
      "runs to a total income of ₹12,00,000.");
  h+=note("For a return on ITR-1 the option is exercised in the return itself — "+
    "Form 10-IEA is needed only where there is business or professional income.");

  /* ===================== The filing section ===================== */
  h+=sub("Under which section is the return filed?");
  h+=row("Return filed under section",
    sel("ret.sec",RET1_RETSEC.map(r=>[r[0],r[1]+(r[2]?"":" — NOT valid for ITR-1")]),{blank:false}),
    {req:1,ref:"FilingStatus.ReturnFileSec"});
  if(!valid){
    h+=note("<b>Section "+(RET1_RETSEC.find(r=>r[0]===sec)||[,""])[1]+" is not a valid "+
      "filing section for ITR-1.</b> ITR-1 may be filed only u/s <b>139(1) [11]</b>, "+
      "<b>139(4) belated [12]</b>, <b>139(5) revised [17]</b>, <b>119(2)(b) [20]</b> "+
      "or <b>139(8A) updated [21]</b>. Sections 142(1), 148, 153A, 153C and 139(9) "+
      "[codes 13/14/15/16/18] are blocked — choose another form. Correct the "+
      "section before the return can be built.","stop");
    return h;                                 /* nothing further until a valid section */
  }
  h+=row("Due date of filing",cell2(RET1_DUEDATE),{ref:"FilingStatus.ItrFilingDueDate"});
  h+=row("Actual date of filing this return",dte("ret.filed"),
    {hint:"the portal's own date on submission; drives 234A and the 234F late-fee test"});

  /* conditional: ReceiptNo / OrigRetFiledDate (17 / 21) */
  if(RET1_SEC_RECEIPT.indexOf(sec)>=0){
    h+=row("Receipt number of the original return",inp("ret.receiptNo",{max:23}),
      {req:1,ref:"FilingStatus.ReceiptNo"});
    h+=row("Date of filing of the original return",dte("ret.origDate"),
      {req:1,ref:"FilingStatus.OrigRetFiledDate"});
  }
  /* conditional: NoticeNo / NoticeDateUnderSec (20 among the valid set) */
  if(RET1_SEC_NOTICE.indexOf(sec)>=0){
    h+=row("Unique number / DIN of the notice or order",inp("ret.noticeNo",{max:30}),
      {req:1,ref:"FilingStatus.NoticeNo",hint:"the order u/s 119(2)(b) condoning the delay"});
    h+=row("Date of such notice or order",dte("ret.noticeDate"),
      {req:1,ref:"FilingStatus.NoticeDateUnderSec"});
  }

  /* ===================== Seventh proviso to 139(1) ===================== */
  h+=sub("Seventh proviso to section 139(1)");
  h+=row("Filing though not otherwise required, under the seventh proviso to 139(1)?",
    sel("ret.provFlag",RET1_YN,{blank:false}),{req:1,ref:"FilingStatus.SeventhProvisio139",
    hint:"Yes makes the 234F late-fee apply regardless of income"});
  if(st0(R0.provFlag)==="Y"){
    h+=row("(i) Deposited over ₹1 crore in one or more current accounts?",
      sel("ret.depFlag",RET1_YN,{blank:false}),
      {ref:"FilingStatus.DepAmtAggAmtExcd1CrPrYrFlg",v2:inp("ret.depAmt",{n:1,ph:"Amount"})});
    h+=row("(ii) Spent over ₹2 lakh on foreign travel (self or another)?",
      sel("ret.trvFlag",RET1_YN,{blank:false}),
      {ref:"FilingStatus.IncrExpAggAmt2LkTrvFrgnCntryFlg",v2:inp("ret.trvAmt",{n:1,ph:"Amount"})});
    h+=row("(iii) Spent over ₹1 lakh on electricity in the year?",
      sel("ret.eleFlag",RET1_YN,{blank:false}),
      {ref:"FilingStatus.IncrExpAggAmt1LkElctrctyPrYrFlg",v2:inp("ret.eleAmt",{n:1,ph:"Amount"})});
  }

  /* ===================== Clause (iv) of the seventh proviso ===================== */
  h+=sub("Clause (iv) of the seventh proviso to 139(1)");
  h+=row("Any of the clause-(iv) conditions applicable?",
    sel("ret.clauseFlag",RET1_YN,{blank:false}),{req:1,ref:"FilingStatus.clauseiv7provisio139i"});
  if(st0(R0.clauseFlag)==="Y"){
    h+=row("(1) Deposit exceeding ₹1 crore in one or more current accounts",
      sel("ret.cl1Flag",RET1_YN,{blank:false}),
      {ref:"clauseiv7provisio139iDtls[] nature 1",v2:inp("ret.cl1Amt",{n:1,ph:"Amount"})});
    h+=row("(2) Expenditure exceeding ₹2 lakh on foreign travel / other specified expenditure",
      sel("ret.cl2Flag",RET1_YN,{blank:false}),
      {ref:"clauseiv7provisio139iDtls[] nature 2",v2:inp("ret.cl2Amt",{n:1,ph:"Amount"})});
  }

  /* ===================== Representative assessee ===================== */
  h+=sub("Representative assessee");
  h+=row("Is this return filed by a representative assessee?",
    sel("ret.repFlg",RET1_YN,{blank:false}),{req:1,ref:"FilingStatus.AsseseeRepFlg"});
  if(st0(R0.repFlg)==="Y"){
    h+=row("Name of the representative assessee",inp("ret.repName",{max:75}),
      {req:1,ref:"AssesseeRep.RepName"});
    h+=row("Email-id of the representative",inp("ret.repEmail",{max:125}),
      {req:1,ref:"AssesseeRep.RepEmailID"});
    h+=row("Contact number of the representative",
      inp("ret.repMobileCc",{n:1,max:3,ph:"Code"})+" "+inp("ret.repMobile",{n:1,max:10,ph:"Mobile"}),
      {req:1,ref:"AssesseeRep.CountryCodeRepMobileNo / RepMobileNo"});
  }

  /* ===================== Updated return u/s 139(8A) ===================== */
  if(sec===21){
    const A=(S.C.ret||{}).ati||{};
    h+=sub("Updated return u/s 139(8A) — Part A 139(8A)");
    h+=note("An updated return u/s 139(8A) unlocks Part A 139(8A) and Part B-ATI. "+
      "It carries additional income and the additional income-tax u/s 140B. "+
      "The assessment year is 2026-27.");
    h+=row("Aadhaar number",inp("ret.uAadhaar",{n:1,max:12}),{ref:"PartA_139_8A.AadhaarCardNo"});
    h+=row("Name (as in the updated return)",inp("ret.uName",{max:75}),{ref:"PartA_139_8A.Name"});
    h+=row("PAN",inp("ret.uPan",{max:10}),{ref:"PartA_139_8A.PAN"});
    h+=row("Assessment year",cell2("2026 (AY 2026-27)"),{ref:"PartA_139_8A.AssessmentYear"});
    h+=row("Return previously filed for this assessment year?",
      sel("ret.prevFiled",RET1_YESNO,{blank:false}),{ref:"PartA_139_8A.PreviouslyFiledForThisAY"});
    h+=row("Whether a return was previously filed for this AY (139(8A))?",
      sel("ret.prevFiled8A",RET1_PREVFILED8A,{blank:false}),
      {ref:"PartA_139_8A.PreviouslyFiledForThisAY_139_8A"});
    if(st0(R0.prevFiled8A)==="1"){
      h+=row("If yes, ITR form of the original return",inp("ret.appItrForm",{max:10}),
        {ref:"Applicable_139_8A.ITRForm"});
      h+=row("Acknowledgement number of the original return",inp("ret.appAckNo",{max:23}),
        {ref:"Applicable_139_8A.AcknowledgementNo"});
      h+=row("Date of filing of the original return",dte("ret.appOrigDate"),
        {ref:"Applicable_139_8A.OrigRetFiledDate"});
    }
    h+=row("Are you eligible to file an updated return as per the conditions laid out in 139(8A)?",
      sel("ret.laidOut",RET1_YESNO,{blank:false}),{ref:"PartA_139_8A.LaidOutIn_139_8A"});
    h+=row("ITR form updating the income",cell2("ITR1"),{ref:"PartA_139_8A.ITRFormUpdatingInc"});

    h+=sub("Reason(s) for updating the income");
    h+=grid("ret.reasons",[
      {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
      {h:"Reason for updating (139(8A))",k:"reason",t:"sel",opts:RET1_REASONS,req:1,w:"420px"}
    ],R0.reasons,{min:"480px",add:"Add a reason",empty:"No reason for updating entered."});

    h+=row("Updated return is being filed during the period",
      sel("ret.period",RET1_PERIOD,{blank:false}),
      {req:1,ref:"PartA_139_8A.UpdatedReturnDuringPeriod",
       hint:"drives the 140B additional-tax rate: 25% / 50% / 60% / 70%"});

    h+=sub("Reduction in carried-forward loss / unabsorbed depreciation");
    h+=row("Does the updated return reduce carried-forward unabsorbed depreciation?",
      sel("ret.unabDep",RET1_YESNO,{blank:false}),
      {ref:"RetrntoRedCarriedFL.UnabsorbedDepreciation"});
    if(st0(R0.unabDep)==="Y"){
      h+=grid("ret.udYears",[
        {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
        {h:"Assessment year",k:"year",t:"num",req:1,w:"140px"},
        {h:"Revised return filed?",k:"rev",t:"sel",opts:RET1_YESNO,w:"150px"},
        {h:"Updated return filed?",k:"upd",t:"sel",opts:RET1_YESNO,w:"150px"}
      ],R0.udYears,{min:"560px",add:"Add a year",empty:"No unabsorbed-depreciation year entered."});
    }

    /* ---------------- Part B-ATI ---------------- */
    h+=sub("Part B-ATI — total updated income and additional tax u/s 140B");
    h+=note("Enter the head-wise <b>additional</b> income being returned and the tax "+
      "figures from the updated return. The additional income-tax u/s 140B is computed "+
      "below at "+Math.round((A.rate||0.25)*100)+"% of the aggregate liability on the "+
      "additional income.");
    h+=row("Salaries",inp("ret.atiSal",{n:1}),{ref:"HeadOfInc.Salaries"});
    h+=row("Income from house property",inp("ret.atiHP",{n:1}),{ref:"HeadOfInc.IncomeFromHP"});
    h+=row("Income from other sources",inp("ret.atiOS",{n:1}),{ref:"HeadOfInc.IncomeFromOS"});
    h+=row("Total additional income",cell(A.total),{cls:"tot",ref:"HeadOfInc.Total"});
    h+=row("Total income as per the last valid return",inp("ret.latestTotInc",{n:1}),{ref:"LatestTotInc"});
    h+=row("Total updated income (last + additional)",cell(A.updated),{cls:"tot",ref:"UpdatedTotInc"});
    h+=row("Amount payable as per the updated return (Part B-TTI)",inp("ret.amtPayable",{n:1}),{ref:"AmtPayable"});
    h+=row("Amount refundable as per the updated return (Part B-TTI)",inp("ret.amtRefundable",{n:1}),{ref:"AmtRefundable"});
    h+=row("Amount payable as per the last valid return",inp("ret.lastAmtPayable",{n:1}),{ref:"LastAmtPayable"});
    h+=row("Refund claimed / issued as per the last valid return",inp("ret.refund",{n:1}),{ref:"Refund"});
    h+=row("Fee for default in furnishing return u/s 234F",inp("ret.feeIncUS234F",{n:1}),{ref:"FeeIncUS234F"});
    h+=row("Regular-assessment tax already paid",inp("ret.regAssTax",{n:1}),{ref:"RegAssessementTAX"});
    h+=row("Aggregate liability on additional income (earlier refund case)",cell(A.aggRefund),{ref:"AggrLiabilityRefund"});
    h+=row("Aggregate liability on additional income (no earlier refund)",cell(A.aggNoRefund),{ref:"AggrLiabilityNoRefund"});
    h+=row("Additional income-tax u/s 140B ("+Math.round((A.rate||0.25)*100)+"%)",cell(A.addtnlIncTax),{cls:"tot",ref:"AddtnlIncTax"});
    h+=row("Net amount payable",cell(A.netPayable),{cls:"tot",ref:"NetPayable"});
    h+=row("Relief u/s 89",inp("ret.releifUS89",{n:1}),{ref:"ReleifUS89"});

    h+=sub("Schedule IT-1 — tax paid u/s 140B (advance / self-assessment challans)");
    h+=grid("ret.it1",[
      {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
      {h:"BSR code",k:"bsr",t:"txt",req:1,max:7,w:"120px"},
      {h:"Date of deposit",k:"date",t:"date",req:1,w:"150px"},
      {h:"Serial no. of challan",k:"srl",t:"num",req:1,w:"160px"},
      {h:"Amount",k:"amt",t:"num",req:1,w:"140px"}
    ],R0.it1,{min:"660px",add:"Add a challan",empty:"No IT-1 challan entered."});
    h+=row("Total of Schedule IT-1",cell(A.it1Total),{cls:"tot",ref:"ScheduleIT1.Total"});

    h+=sub("Schedule IT-2 — tax paid u/s 140B (further challans)");
    h+=grid("ret.it2",[
      {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
      {h:"BSR code",k:"bsr",t:"txt",req:1,max:7,w:"120px"},
      {h:"Date of deposit",k:"date",t:"date",req:1,w:"150px"},
      {h:"Serial no. of challan",k:"srl",t:"num",req:1,w:"160px"},
      {h:"Amount",k:"amt",t:"num",req:1,w:"140px"}
    ],R0.it2,{min:"660px",add:"Add a challan",empty:"No IT-2 challan entered."});
    h+=row("Total of Schedule IT-2",cell(A.it2Total),{cls:"tot",ref:"ScheduleIT2.Total"});

    h+=row("Total tax paid u/s 140B",cell(A.tax140B),{cls:"tot",ref:"TaxUS140B"});
    h+=row("Tax due (net payable − 140B paid)",cell(A.taxDue),{cls:"grand",ref:"TaxDue10_11"});
    h+=row("Total refund (from the updated return)",cell(A.totRefund),{ref:"TotRefund"});
  }

  return h;
}
/* small read-only text cell (independent of the numeric `cell`) */
function cell2(t){return '<span class="c">'+esc(t)+'</span>';}

/* =====================================================================
   EXPORT — expRet(j): FilingStatus always; PartA_139_8A + PartB-ATI only
   when ReturnFileSec == 21. put() keeps 0 for the required numeric leaves.
   ===================================================================== */
function expRet(j){
  const R0=S.ret||{}, C=S.C.ret||{}, A=C.ati||{};
  const UP=v=>{v=sv(v);return v?String(v).toUpperCase():undefined;};
  const sec=R(R0.sec)||11;

  /* ---------- §4 FilingStatus ---------- */
  put(j,"FilingStatus.ReturnFileSec",sec);
  put(j,"FilingStatus.OptOutNewTaxRegime",st0(R0.optout)==="Y"?"Y":"N");
  put(j,"FilingStatus.SeventhProvisio139",st0(R0.provFlag)==="Y"?"Y":"N");
  if(st0(R0.provFlag)==="Y"){
    put(j,"FilingStatus.DepAmtAggAmtExcd1CrPrYrFlg",st0(R0.depFlag)==="Y"?"Y":"N");
    if(st0(R0.depFlag)==="Y"&&sv(R0.depAmt)) put(j,"FilingStatus.AmtSeventhProvisio139i",R(R0.depAmt));
    put(j,"FilingStatus.IncrExpAggAmt2LkTrvFrgnCntryFlg",st0(R0.trvFlag)==="Y"?"Y":"N");
    if(st0(R0.trvFlag)==="Y"&&sv(R0.trvAmt)) put(j,"FilingStatus.AmtSeventhProvisio139ii",R(R0.trvAmt));
    put(j,"FilingStatus.IncrExpAggAmt1LkElctrctyPrYrFlg",st0(R0.eleFlag)==="Y"?"Y":"N");
    if(st0(R0.eleFlag)==="Y"&&sv(R0.eleAmt)) put(j,"FilingStatus.AmtSeventhProvisio139iii",R(R0.eleAmt));
  }
  /* conditional notice / receipt */
  if(RET1_SEC_NOTICE.indexOf(sec)>=0){
    put(j,"FilingStatus.NoticeNo",sv(R0.noticeNo));
    put(j,"FilingStatus.NoticeDateUnderSec",ISO(R0.noticeDate));
  }
  if(RET1_SEC_RECEIPT.indexOf(sec)>=0){
    put(j,"FilingStatus.ReceiptNo",sv(R0.receiptNo));
    put(j,"FilingStatus.OrigRetFiledDate",ISO(R0.origDate));
  }
  put(j,"FilingStatus.ItrFilingDueDate",RET1_DUEDATE);
  /* clause (iv) of the seventh proviso */
  put(j,"FilingStatus.clauseiv7provisio139i",st0(R0.clauseFlag)==="Y"?"Y":"N");
  if(st0(R0.clauseFlag)==="Y"){
    const cl=[];
    if(st0(R0.cl1Flag)==="Y") cl.push({clauseiv7provisio139iNature:"1",clauseiv7provisio139iAmount:R(R0.cl1Amt)});
    if(st0(R0.cl2Flag)==="Y") cl.push({clauseiv7provisio139iNature:"2",clauseiv7provisio139iAmount:R(R0.cl2Amt)});
    if(cl.length) put(j,"FilingStatus.clauseiv7provisio139iDtls",cl);
  }
  /* representative assessee */
  put(j,"FilingStatus.AsseseeRepFlg",st0(R0.repFlg)==="Y"?"Y":"N");
  if(st0(R0.repFlg)==="Y"){
    put(j,"FilingStatus.AssesseeRep.RepName",sv(R0.repName));
    put(j,"FilingStatus.AssesseeRep.RepEmailID",sv(R0.repEmail));
    if(sv(R0.repMobile)){
      put(j,"FilingStatus.AssesseeRep.CountryCodeRepMobileNo",R(R0.repMobileCc)||91);
      put(j,"FilingStatus.AssesseeRep.RepMobileNo",R(R0.repMobile));
    }
  }

  /* ---------- §5 PartA_139_8A + §6 PartB-ATI (updated return only) ---------- */
  if(sec!==21) return;

  /* PartA_139_8A */
  if(AADH.test(st0(R0.uAadhaar))) put(j,"PartA_139_8A.AadhaarCardNo",st0(R0.uAadhaar));
  put(j,"PartA_139_8A.Name",sv(R0.uName));
  put(j,"PartA_139_8A.PAN",UP(R0.uPan));
  put(j,"PartA_139_8A.AssessmentYear","2026");           /* utility bug emits 2025; emit 2026 */
  put(j,"PartA_139_8A.PreviouslyFiledForThisAY",st0(R0.prevFiled)==="Y"?"Y":"N");
  put(j,"PartA_139_8A.PreviouslyFiledForThisAY_139_8A",st0(R0.prevFiled8A)==="1"?"1":"2");
  if(st0(R0.prevFiled8A)==="1"){
    put(j,"PartA_139_8A.Applicable_139_8A.ITRForm",sv(R0.appItrForm)||"ITR1");
    put(j,"PartA_139_8A.Applicable_139_8A.AcknowledgementNo",sv(R0.appAckNo));
    put(j,"PartA_139_8A.Applicable_139_8A.OrigRetFiledDate",ISO(R0.appOrigDate));
  }
  put(j,"PartA_139_8A.LaidOutIn_139_8A",st0(R0.laidOut)==="Y"?"Y":"N");
  put(j,"PartA_139_8A.ITRFormUpdatingInc","ITR1");
  {const rs=(R0.reasons||[]).filter(r=>sv(r.reason)).map(r=>({ReasonsForUpdatingIncome:sv(r.reason)}));
   if(rs.length) put(j,"PartA_139_8A.UpdatingInc.ReasonsForUpdatingIncDtls",rs);}
  put(j,"PartA_139_8A.UpdatedReturnDuringPeriod",st0(R0.period)||"1");
  put(j,"PartA_139_8A.RetrntoRedCarriedFL.UnabsorbedDepreciation",st0(R0.unabDep)==="Y"?"Y":"N");
  if(st0(R0.unabDep)==="Y"){
    const uy=(R0.udYears||[]).filter(r=>sv(r.year)).map(r=>{const o={UnabsorbedDepreciationYear:R(r.year)};
      if(sv(r.rev)) o.RevisedReturnFile=st0(r.rev)==="Y"?"Y":"N";
      if(sv(r.upd)) o.UpdatedReturnFile=st0(r.upd)==="Y"?"Y":"N";
      return o;});
    if(uy.length) put(j,"PartA_139_8A.RetrntoRedCarriedFL.UDYear.UnabsorbedDepreciationYearDtls",uy);
  }

  /* PartB-ATI (schema §6; the block key carries a hyphen) */
  const B="PartB-ATI.";
  put(j,B+"HeadOfInc.Salaries",A.salaries||0);
  put(j,B+"HeadOfInc.IncomeFromHP",A.hp||0);
  put(j,B+"HeadOfInc.IncomeFromOS",A.os||0);
  put(j,B+"HeadOfInc.Total",A.total||0);
  put(j,B+"LatestTotInc",A.latest||0);
  put(j,B+"UpdatedTotInc",A.updated||0);
  put(j,B+"AmtPayable",A.amtPayable||0);
  put(j,B+"AmtRefundable",A.amtRefundable||0);
  put(j,B+"LastAmtPayable",A.lastPayable||0);
  put(j,B+"Refund",A.refund||0);
  put(j,B+"TotRefund",A.totRefund||0);
  put(j,B+"FeeIncUS234F",A.fee234F||0);
  put(j,B+"RegAssessementTAX",A.regTax||0);
  put(j,B+"AggrLiabilityRefund",A.aggRefund||0);
  put(j,B+"AggrLiabilityNoRefund",A.aggNoRefund||0);
  put(j,B+"AddtnlIncTax",A.addtnlIncTax||0);
  put(j,B+"NetPayable",A.netPayable||0);
  put(j,B+"TaxUS140B",A.tax140B||0);
  put(j,B+"TaxDue10_11",A.taxDue||0);
  put(j,B+"ReleifUS89",A.relief89||0);
  /* Schedule IT-1 / IT-2 challans */
  const chal=rows=>(rows||[]).filter(r=>sv(r.bsr)||sv(r.amt)).map((r,i)=>({
    slno:i+1,BSRCode:sv(r.bsr),DateDep:ISO(r.date),
    SrlNoOfChaln:R(r.srl),Amt:R(r.amt)}));
  const c1=chal(R0.it1);
  if(c1.length) put(j,B+"ScheduleIT1.TaxPayment1.ITTaxPayments",c1);
  put(j,B+"ScheduleIT1.Total",A.it1Total||0);
  const c2=chal(R0.it2);
  if(c2.length) put(j,B+"ScheduleIT2.TaxPayment2.ITTaxPayments",c2);
  put(j,B+"ScheduleIT2.Total",A.it2Total||0);
}

/* =====================================================================
   IMPORT — impRet(I): read FilingStatus and (if present) PartA_139_8A +
   PartB-ATI back into S.ret so the round-trip is stable.
   ===================================================================== */
function impRet(I){
  const read=[], R0=S.ret=S.ret||{};
  const _iso2dmy=s=>{s=st0(s);const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    return m?m[3]+"/"+m[2]+"/"+m[1]:"";};
  const FS=(I&&I.FilingStatus)||{};

  if(FS.OptOutNewTaxRegime!=null){R0.optout=FS.OptOutNewTaxRegime==="Y"?"Y":"N";read.push("regime");}
  if(FS.ReturnFileSec!=null){R0.sec=R(FS.ReturnFileSec);read.push("filing section");}
  if(FS.SeventhProvisio139!=null)R0.provFlag=FS.SeventhProvisio139;
  if(FS.DepAmtAggAmtExcd1CrPrYrFlg!=null)R0.depFlag=FS.DepAmtAggAmtExcd1CrPrYrFlg;
  if(FS.AmtSeventhProvisio139i!=null)R0.depAmt=String(FS.AmtSeventhProvisio139i);
  if(FS.IncrExpAggAmt2LkTrvFrgnCntryFlg!=null)R0.trvFlag=FS.IncrExpAggAmt2LkTrvFrgnCntryFlg;
  if(FS.AmtSeventhProvisio139ii!=null)R0.trvAmt=String(FS.AmtSeventhProvisio139ii);
  if(FS.IncrExpAggAmt1LkElctrctyPrYrFlg!=null)R0.eleFlag=FS.IncrExpAggAmt1LkElctrctyPrYrFlg;
  if(FS.AmtSeventhProvisio139iii!=null)R0.eleAmt=String(FS.AmtSeventhProvisio139iii);
  if(FS.NoticeNo!=null)R0.noticeNo=String(FS.NoticeNo);
  if(FS.NoticeDateUnderSec)R0.noticeDate=_iso2dmy(FS.NoticeDateUnderSec);
  if(FS.ReceiptNo!=null)R0.receiptNo=String(FS.ReceiptNo);
  if(FS.OrigRetFiledDate)R0.origDate=_iso2dmy(FS.OrigRetFiledDate);
  if(FS.clauseiv7provisio139i!=null)R0.clauseFlag=FS.clauseiv7provisio139i;
  if(Array.isArray(FS.clauseiv7provisio139iDtls)){
    FS.clauseiv7provisio139iDtls.forEach(x=>{
      if(String(x.clauseiv7provisio139iNature)==="1"){R0.cl1Flag="Y";R0.cl1Amt=String(x.clauseiv7provisio139iAmount==null?"":x.clauseiv7provisio139iAmount);}
      if(String(x.clauseiv7provisio139iNature)==="2"){R0.cl2Flag="Y";R0.cl2Amt=String(x.clauseiv7provisio139iAmount==null?"":x.clauseiv7provisio139iAmount);}
    });
  }
  if(FS.AsseseeRepFlg!=null){R0.repFlg=FS.AsseseeRepFlg;read.push("representative");}
  if(FS.AssesseeRep){const AR=FS.AssesseeRep;
    if(AR.RepName!=null)R0.repName=AR.RepName;
    if(AR.RepEmailID!=null)R0.repEmail=AR.RepEmailID;
    if(AR.CountryCodeRepMobileNo!=null)R0.repMobileCc=String(AR.CountryCodeRepMobileNo);
    if(AR.RepMobileNo!=null)R0.repMobile=String(AR.RepMobileNo);}

  /* PartA_139_8A */
  const PA=(I&&I.PartA_139_8A)||{};
  if(Object.keys(PA).length){
    if(PA.AadhaarCardNo!=null)R0.uAadhaar=String(PA.AadhaarCardNo);
    if(PA.Name!=null)R0.uName=PA.Name;
    if(PA.PAN!=null)R0.uPan=String(PA.PAN).toUpperCase();
    if(PA.PreviouslyFiledForThisAY!=null)R0.prevFiled=PA.PreviouslyFiledForThisAY;
    if(PA.PreviouslyFiledForThisAY_139_8A!=null)R0.prevFiled8A=String(PA.PreviouslyFiledForThisAY_139_8A);
    const AP=PA.Applicable_139_8A||{};
    if(AP.ITRForm!=null)R0.appItrForm=AP.ITRForm;
    if(AP.AcknowledgementNo!=null)R0.appAckNo=String(AP.AcknowledgementNo);
    if(AP.OrigRetFiledDate)R0.appOrigDate=_iso2dmy(AP.OrigRetFiledDate);
    if(PA.LaidOutIn_139_8A!=null)R0.laidOut=PA.LaidOutIn_139_8A;
    const RU=(PA.UpdatingInc||{}).ReasonsForUpdatingIncDtls;
    if(Array.isArray(RU))R0.reasons=RU.map(x=>({reason:x.ReasonsForUpdatingIncome}));
    if(PA.UpdatedReturnDuringPeriod!=null)R0.period=String(PA.UpdatedReturnDuringPeriod);
    const RC=PA.RetrntoRedCarriedFL||{};
    if(RC.UnabsorbedDepreciation!=null)R0.unabDep=RC.UnabsorbedDepreciation;
    const UYD=(RC.UDYear||{}).UnabsorbedDepreciationYearDtls;
    if(Array.isArray(UYD))R0.udYears=UYD.map(x=>({
      year:x.UnabsorbedDepreciationYear==null?"":String(x.UnabsorbedDepreciationYear),
      rev:x.RevisedReturnFile,upd:x.UpdatedReturnFile}));
    read.push("updated return (139(8A))");
  }
  /* PartB-ATI */
  const PB=(I&&I["PartB-ATI"])||{};
  if(Object.keys(PB).length){
    const HI=PB.HeadOfInc||{};
    if(HI.Salaries!=null)R0.atiSal=String(HI.Salaries);
    if(HI.IncomeFromHP!=null)R0.atiHP=String(HI.IncomeFromHP);
    if(HI.IncomeFromOS!=null)R0.atiOS=String(HI.IncomeFromOS);
    if(PB.LatestTotInc!=null)R0.latestTotInc=String(PB.LatestTotInc);
    if(PB.AmtPayable!=null)R0.amtPayable=String(PB.AmtPayable);
    if(PB.AmtRefundable!=null)R0.amtRefundable=String(PB.AmtRefundable);
    if(PB.LastAmtPayable!=null)R0.lastAmtPayable=String(PB.LastAmtPayable);
    if(PB.Refund!=null)R0.refund=String(PB.Refund);
    if(PB.FeeIncUS234F!=null)R0.feeIncUS234F=String(PB.FeeIncUS234F);
    if(PB.RegAssessementTAX!=null)R0.regAssTax=String(PB.RegAssessementTAX);
    if(PB.ReleifUS89!=null)R0.releifUS89=String(PB.ReleifUS89);
    const rd=arr=>(Array.isArray(arr)?arr:[]).map(x=>({
      bsr:x.BSRCode||"",date:_iso2dmy(x.DateDep),
      srl:x.SrlNoOfChaln==null?"":String(x.SrlNoOfChaln),amt:x.Amt==null?"":String(x.Amt)}));
    const P1=((PB.ScheduleIT1||{}).TaxPayment1||{}).ITTaxPayments;
    if(Array.isArray(P1))R0.it1=rd(P1);
    const P2=((PB.ScheduleIT2||{}).TaxPayment2||{}).ITTaxPayments;
    if(Array.isArray(P2))R0.it2=rd(P2);
    read.push("Part B-ATI");
  }
  return read;
}

/* =====================================================================
   CHECKS — chkRet(): this screen's own mandatory / validity checks.
   ===================================================================== */
function chkRet(){
  const out=[], R0=S.ret||{}; engRet();
  const C=S.C.ret||{}, sec=R(R0.sec)||11;

  /* the section must be legal for ITR-1 */
  if(RET1_BLOCKSEC.indexOf(sec)>=0)
    out.push({lvl:"err",t:"Filing section blocked",m:"Section "+
      (RET1_RETSEC.find(r=>r[0]===sec)||[,String(sec)])[1]+" is not valid for ITR-1. "+
      "Choose 139(1) [11], 139(4) [12], 139(5) [17], 119(2)(b) [20] or 139(8A) [21].",sec:"ret"});
  else if(RET1_VALIDSEC.indexOf(sec)<0)
    out.push({lvl:"err",t:"Filing section required",m:"Select a valid ITR-1 filing section.",sec:"ret"});

  /* conditional mandatory */
  if(RET1_SEC_RECEIPT.indexOf(sec)>=0){
    if(!st0(R0.receiptNo)) out.push({lvl:"err",t:"Receipt number required",m:"The receipt number of the original return is mandatory for this section.",sec:"ret"});
    if(!ISO(R0.origDate)) out.push({lvl:"err",t:"Original-return date required",m:"The date of filing of the original return is mandatory.",sec:"ret"});
  }
  if(sec===20){
    if(!st0(R0.noticeNo)) out.push({lvl:"err",t:"Order number required",m:"The DIN / number of the 119(2)(b) order is mandatory.",sec:"ret"});
    if(!ISO(R0.noticeDate)) out.push({lvl:"err",t:"Order date required",m:"The date of the 119(2)(b) order is mandatory.",sec:"ret"});
  }

  /* seventh-proviso amount consistency */
  if(st0(R0.provFlag)==="Y"){
    if(st0(R0.depFlag)==="Y"&&!sv(R0.depAmt)) out.push({lvl:"warn",t:"Deposit amount",m:"State the aggregate deposited in current accounts (over ₹1 crore).",sec:"ret"});
    if(st0(R0.trvFlag)==="Y"&&!sv(R0.trvAmt)) out.push({lvl:"warn",t:"Foreign-travel amount",m:"State the expenditure on foreign travel (over ₹2 lakh).",sec:"ret"});
    if(st0(R0.eleFlag)==="Y"&&!sv(R0.eleAmt)) out.push({lvl:"warn",t:"Electricity amount",m:"State the expenditure on electricity (over ₹1 lakh).",sec:"ret"});
  }

  /* representative details */
  if(st0(R0.repFlg)==="Y"){
    if(!st0(R0.repName)) out.push({lvl:"err",t:"Representative name required",m:"Furnish the name of the representative assessee.",sec:"ret"});
    if(!st0(R0.repEmail)||!MAIL.test(st0(R0.repEmail))) out.push({lvl:"err",t:"Representative email",m:"Furnish a valid email-id of the representative assessee.",sec:"ret"});
    if(!st0(R0.repMobile)) out.push({lvl:"err",t:"Representative contact",m:"Furnish the contact number of the representative assessee.",sec:"ret"});
  }

  /* updated-return checks */
  if(sec===21){
    if(st0(R0.uPan)&&!PAN_RE.test(st0(R0.uPan).toUpperCase())) out.push({lvl:"err",t:"Updated-return PAN",m:"The PAN in Part A 139(8A) is not valid.",sec:"ret"});
    if(!(R0.reasons||[]).some(r=>sv(r.reason))) out.push({lvl:"err",t:"Reason for updating required",m:"State at least one reason for updating the income (139(8A)).",sec:"ret"});
    if(!st0(R0.period)) out.push({lvl:"err",t:"Period required",m:"State the period during which the updated return is filed — it fixes the 140B rate.",sec:"ret"});
    const A=C.ati||{};
    if(A.total<=0) out.push({lvl:"warn",t:"No additional income",m:"An updated return u/s 139(8A) is expected to return additional income — the head-wise total is nil.",sec:"ret"});
    if(A.taxDue<=0&&A.netPayable>0&&A.tax140B<A.netPayable) out.push({lvl:"warn",t:"140B tax unpaid",m:"There is a net amount payable u/s 140B but the challans do not cover it.",sec:"ret"});
  }

  if(!out.some(x=>x.lvl==="err"))
    out.push({lvl:"ok",t:"Return and regime",m:(C.regime==="old"?"Old regime":"New regime")+
      " · filed u/s "+(RET1_RETSEC.find(r=>r[0]===sec)||[,String(sec)])[1]+
      (C.is8A?" · updated return u/s 139(8A)":"")+".",sec:"ret"});
  return out;
}

/* ---- register (overrides the boot stub) --------------------------- */
reg({id:"ret", t:"Return and regime", ref:"FilingStatus · PartA_139_8A · PartB-ATI",
     f:secRet,
     s:()=>{const C=S.C.ret||{};return (C.regime==="old"?"Old regime":"New regime")+
       (C.is8A?" · 139(8A)":"")+(C.secValid?"":" · invalid section");},
     eng:engRet, exp:expRet, imp:impRet, chk:chkRet, order:20, corder:12});
