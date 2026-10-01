/* =====================================================================
   70_sec_oi.js — Other Information (Part A - OI) + Quantitative Details
   (Part A - QD).  ITR-5, A.Y. 2026-27, Phase 4.  Section id "oi".

   Built ONLY from this form's books:
     books/ITR-5/PART_A_OI.md          -> block PARTA_OI  (sheet PART - A OI)
     books/ITR-5/QUANTITATIVE_DETAILS.md -> block PARTA_QD (sheet QUANTITATIVE_DETAILS)
   plus books/ITR-5/enums.json for every dropdown, and the schema leaves
   (tools/dump.py --form ITR-5 --leaves PARTA_OI / PARTA_QD) for verbatim
   keys.  The ITR-3 file forms/ITR-3/src/70_sec_bpa.js was read for SHAPE
   only (rule 2: no engine ported — every formula below is from PART_A_OI.md
   with its cell reference in the comment).

   SHAPE FACTS specific to ITR-5 (do not carry over from ITR-3):
   - Section 6 (u/s 36) has 19 sub-items 6a..6s (ITR-3 had 18); 6t is the
     total of 6a..6s; 6u is the (optional) employee-count sub-object.
   - Section 8: 8B key is AnyAmtOfSec40AllowPrevYr (ITR-3 used a different key).
   - Section 10/11 optional key is RailwayAsstsPyble (spelling from schema).
   - Section 13 has three components 13a/13b/13c (33AB, 33ABA, 33AC).
   - Items 14,15,16,16A,17 (16A = MSMED s.23 interest, optional; 17 = 92CE).

   BLOCKS ARE OPTIONAL (not in SKEL): PARTA_OI and PARTA_QD are emitted only
   when they carry data — the whole schedule is conditionally mandatory
   (only when liable for audit u/s 44AB, header [F3]/[D3]).

   ---------------------------------------------------------------------
   SCHEMA GAP — OI row 9e / 40A(13)  (flagged in PART_A_OI.md):
   The sheet's row 9e (J74, "Marked to market loss or other expected loss
   except as allowable u/s 36(1)(xviii) [40A(13)]") has NO dedicated leaf in
   the ITR-5 schema block AmtDisallUs40A (its only leaves are AmtPaidUs40A2b,
   AmtGT20kCash, ProvPmtGrat, ContToSetupTrust, AnyOthDisallowance and the
   total TotAmtDisallUs40A — six keys for seven visible lines).  Per CLAUDE.md
   rule 3 (a live row with no schema key cannot be filed -> drop it and log)
   and the section brief ("do not invent a key"), 9e is NOT built as an input
   and is NOT exported.  Consequently the 9g total (TotAmtDisallUs40A) is
   computed here as SUM(9a,9b,9c,9d,9f) — the five schema leaves only — so the
   exported total always reconciles with the leaves present and the round-trip
   stays identical.  (On the utility the sheet formula 9g = SUM(J70:J75) also
   folds in J74/9e; that component is simply unfileable in this schema.)
   ===================================================================== */

/* ---- state: S.oi mirrors PARTA_OI; S.qd holds the three PARTA_QD grids.
   Every computed total is written back into S.oi by engOi, so S.oi/S.qd are
   the single source of truth for the renderer's cell()s and for expOi. ---- */
S.oi = S.oi || {
  MethodOfValClgStk:{},
  NoCredToPLAmt:{},
  AmtDisallUs36:{NoOfEmployeesEmployed:{}},
  AmtDisallUs37:{},
  AmtDisallUs40:{},
  AmtDisallUs40A:{},
  AmtDisallUs43BPyNowAll:{AmtUs43B:{}},
  AmtDisall43B:{AmtUs43B:{}},
  AmtExciseCustomsVATOutstanding:{ExciseCustomsVAT:{}}
};
S.qd = S.qd || {trd:[], raw:[], fin:[]};

/* two-flag Yes/No list for item 17 (ScheduleTPSAFlg) — a string enum whose
   source is "(Select),Yes,No"; it is NOT in enums.json, so it is given
   literally, exactly as the book records the dropdown. */
const OI_YN=[["Yes","Yes"],["No","No"]];
/* stock-valuation and change-of-method dropdowns come from enums.json verbatim */
const OI_MOA=[["MERC","Mercantile"],["CASH","Cash"]];                         /* PARTA_OI.MethodOfAcct */
const OI_NY=[["N","N"],["Y","Y"]];                                           /* ChangeInAcctMethFlg / ChngStockValMetFlg */
const OI_VAL=[["1","1. Cost or market rate , whichever is less"],["2","2. At cost"],["3","3. At market rate"]]; /* ValRawMaterial / ValFinishedGoods */
/* the 23-value unit-of-measure enum, identical for all three QD grids
   (PARTA_QD.*.QuantitDet[].UnitOfMeasure — verbatim from enums.json) */
const OI_UNIT=[["101","101-Gms"],["102","102-Kilograms"],["103","103-Litre"],["104","104-Kilolitre"],["105","105-Metre"],["106","106-Kilometre"],["107","107-Numbers"],["108","108-Quintal"],["109","109-Ton"],["110","110-Pound"],["111","111-Miligrams"],["112","112-Carat"],["113","113-Numbers (1000s)"],["114","114-Kwatt"],["115","115-Mwatt"],["116","116-Inch"],["117","117-Feet"],["118","118-Sqft"],["119","119-Acre"],["120","120-Cubicft"],["121","121-Sqmetre"],["122","122-Cubicmetre"],["999","999-Residual"]];

/* ---- sub-list key arrays (leaf order = sheet order; shared by eng + exp so
   the SUM ranges and the exported leaves cannot drift apart) ---- */
const OI_5  =["Section28Items","ProformaCreditsDue","PrevYrEscalClaim","OthItemInc","CapReceipt"];                 /* 5a..5e -> 5f */
const OI_36 =["StkInsurPrem","EmpHealthInsurPrem","EmpBonusCommSum","IntOnBorrCap","ZeroCoupBondDisc","RecogPFContribAmt","AppSuperAnnFundAmt","PensionSchemeSec80CCD","AppGratFundAmt","OthFundAmt","EmpContributionCredits","BadDebtDoubtAmt","BadDebtDoubtProvn","SpecResrvTranfr","FamPlanPromoExp","SecuritiesPaidAmt","MrktLossOthExpLossICDS","ExpGovtApprovedSugarPrice","AnyOthDisallowance"]; /* 6a..6s -> 6t */
const OI_37 =["CapitalNatureExp","PersonalExp","BusOrProfessnExp","PoliticPartyExp","LawVoilatPenalExp","OthPenalFineExp","OffenceExp","ContigentLiability","OthAmtNotAllowUs37"]; /* 7a..7i -> 7j */
const OI_40 =["NonCompChapXVIIBAmt","NonComp40aiiChapXVIIBAmt","NonComp40aibChapXVIIBAmt","NonComp40aiiiChapXVIIBAmt","TaxAmtOnProfits","WTAmt","RolyatyOrServiceFee","IntSalBonPartner","AnyOthDisallowance"]; /* 8Aa..8Ai -> 8Aj */
const OI_40A=["AmtPaidUs40A2b","AmtGT20kCash","ProvPmtGrat","ContToSetupTrust","AnyOthDisallowance"];             /* 9a,9b,9c,9d,9f -> 9g (9e has NO schema leaf; see gap note) */
const OI_43B=["TaxDutyCesAmt","ContToEmpPFSFGF","EmpBonusComm","IntPayaleToFI","SumPayaleLoanBrToFinComp","IntPayaleToFISchBank","LeaveEncashPayable"]; /* 10a..10f / 11a..11f (required) */
const OI_43BO=["RailwayAsstsPyble","MSEPayable"];                                                                 /* 10g,10h / 11g,11h (optional) */
const OI_12 =["UnionExciseDuty","ServiceTax","VATorSaleTax","CentralGoodServiceTax","StateGoodServiceTax","IntegratedGoodServiceTax","UnionTerrGoodServiceTax","OthDutyTaxCess"]; /* 12a..12h -> 12i */

/* ================================================================
   eng — every total from PART_A_OI.md, cell reference in the comment.
   No item here is regime-closed (accounting figures are identical in
   both regimes), so nothing is gated on isNew().
   ================================================================ */
function engOi(){
  const G=p=>N(get("oi."+p)), St=(p,v)=>set("oi."+p,R(v));
  const sum=(base,keys)=>keys.reduce((a,k)=>a+G(base+"."+k),0);

  /* 3a/3b are read-only and populated from Schedule ICDS (L6 = ICDS.Total;
     L7 = ICDS.DeTotal1; rules 180/181).  Schedule ICDS is another section, so
     the feed is a cross-section seam: when that section exposes S.C.icds.total
     / S.C.icds.deTotal, take it; otherwise keep whatever is in state (0, or an
     imported value).  The cells render read-only either way. */
  const icds=(S.C&&S.C.icds)||{};
  if(icds.total   !=null) St("ProfDeviatDueAcctMeth", icds.total);   /* L6  3a */
  if(icds.deTotal !=null) St("DecProOrIncLossUs145_2", icds.deTotal);/* L7  3b */

  St("NoCredToPLAmt.TotNoCredToPLAmt", sum("NoCredToPLAmt",OI_5));                 /* L20 = SUM(J15:J19)  5f */
  St("AmtDisallUs36.TotAmtDisallUs36", sum("AmtDisallUs36",OI_36));               /* L41 = SUM(J22:J40)  6t (6a..6s) */
  St("AmtDisallUs36.NoOfEmployeesEmployed.Total",
     G("AmtDisallUs36.NoOfEmployeesEmployed.DeployedInIndia")
    +G("AmtDisallUs36.NoOfEmployeesEmployed.DeployedOutSideIndia"));             /* J45 = SUM(J43:J44)  6u.iii */
  St("AmtDisallUs37.TotAmtDisallUs37", sum("AmtDisallUs37",OI_37));               /* L56 = SUM(J47:J55)  7j */
  St("AmtDisallUs40.TotAmtDisallUs40", sum("AmtDisallUs40",OI_40));               /* L67 = SUM(J58:J66)  8Aj */
  St("AmtDisallUs40A.TotAmtDisallUs40A", sum("AmtDisallUs40A",OI_40A));           /* L76 = SUM(J70:J75) 9g — 9e (J74) unfileable, excluded (see gap note) */
  St("AmtDisallUs43BPyNowAll.AmtUs43B.TotAmtUs43b",
     sum("AmtDisallUs43BPyNowAll.AmtUs43B",OI_43B)+sum("AmtDisallUs43BPyNowAll.AmtUs43B",OI_43BO)); /* L87 = SUM(J78:J86) 10i */
  St("AmtDisall43B.AmtUs43B.TotAmtUs43b",
     sum("AmtDisall43B.AmtUs43B",OI_43B)+sum("AmtDisall43B.AmtUs43B",OI_43BO));   /* L98 = SUM(J89:J97) 11i */
  St("AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.TotExciseCustomsVAT",
     sum("AmtExciseCustomsVATOutstanding.ExciseCustomsVAT",OI_12));              /* L108 = SUM(J100:J107) 12i */
  St("DeemedProfUs33ABs",
     G("DeemedProfUs33AB")+G("DeemedProfUs33ABA")+G("DeemedProfUs33AC"));        /* L109 = SUM(L110:L112) 13 */

  /* ---- feeds Schedule BP (section "bp") consumes; OI carries no income head
     of its own, so no S.C.oi.income.  Cross-schedule links per PART_A_OI.md:
       BP A14 = 6t (rule 218), BP A17 = 9g (rule 221), BP A30 = 10i (rule 228),
       BP A29 = 8B (AnyAmtOfSec40AllowPrevYr), BP 8b = item 14, BP 19 = item 15,
       BP Sl.19 = item 17 (92CE flag, rule 271),
       BP Sl.23 = SUM(5a..5d) (rule 270). ---- */
  S.C.oi={
    amtDisallUs36 : R(G("AmtDisallUs36.TotAmtDisallUs36")),                       /* 6t  -> BP A14 */
    amtDisallUs37 : R(G("AmtDisallUs37.TotAmtDisallUs37")),                       /* 7j */
    amtDisallUs40 : R(G("AmtDisallUs40.TotAmtDisallUs40")),                       /* 8Aj -> BP A?? (Us40) */
    amtDisallUs40A: R(G("AmtDisallUs40A.TotAmtDisallUs40A")),                     /* 9g  -> BP A17 */
    amtDisall43B  : R(G("AmtDisall43B.AmtUs43B.TotAmtUs43b")),                    /* 11i -> BP Us43B */
    tot43BNowAllow: R(G("AmtDisallUs43BPyNowAll.AmtUs43B.TotAmtUs43b")),          /* 10i -> BP A30 */
    amt40NowAllow : R(G("AmtDisallUs40.AnyAmtOfSec40AllowPrevYr")),               /* 8B  -> BP A29 */
    profTaxUs41   : R(G("ProfTaxAmtUs41")),                                       /* 14  -> BP 8b */
    priorPeriod   : R(G("PriorAmtIncCrDrPL")),                                    /* 15  -> BP 19 */
    exp14A        : R(G("AmountOfExpDisAllwUs14A")),                              /* 16 */
    intSMEDisallow: R(G("InterestDisAllowUs23SMEAct")),                           /* 16A */
    deemedProf33  : R(G("DeemedProfUs33ABs")),                                    /* 13 */
    sum5aTo5d     : R(G("NoCredToPLAmt.Section28Items")+G("NoCredToPLAmt.ProformaCreditsDue")+G("NoCredToPLAmt.PrevYrEscalClaim")+G("NoCredToPLAmt.OthItemInc")), /* 5a..5d -> BP Sl.23 */
    tpsaFlg       : st0(get("oi.ScheduleTPSAFlg")),                               /* 17  -> BP Sl.19 */
    qdRows        : (S.qd.trd||[]).length+(S.qd.raw||[]).length+(S.qd.fin||[]).length
  };
}

/* helper: does an object subtree carry any nonzero number / any nonempty
   string / any array row? (0 totals do not count, so an all-blank OI is not
   emitted.) */
function _oiHas(o){
  if(o==null)return false;
  if(Array.isArray(o))return o.length>0;
  if(typeof o==="object")return Object.keys(o).some(k=>_oiHas(o[k]));
  if(typeof o==="number")return R(o)!==0;
  return st0(o)!=="";
}

/* ================================================================
   sec — renderer.  Every live book row -> a field; every computed
   total -> a read-only cell().  No hidden rows are built (the sheet
   has none).  9e (40A(13)) is intentionally absent (schema gap).
   ================================================================ */
function secOi(){
  const V=p=>N(get("oi."+p));
  if(!Array.isArray(S.qd.trd))S.qd.trd=[];
  if(!Array.isArray(S.qd.raw))S.qd.raw=[];
  if(!Array.isArray(S.qd.fin))S.qd.fin=[];
  const ri =(l,pth,ref,o)=>{o=o||{};return row(l,inp("oi."+pth,{n:1}),{ref:ref,ind:o.ind,hint:o.hint,req:o.req});};
  const rc =(l,pth,ref,o)=>{o=o||{};return row(l,cell(V(pth)),{ref:ref,ind:o.ind,cls:o.cls||"tot",hint:o.hint});};
  const rsel=(l,pth,opts,ref,o)=>{o=o||{};return row(l,sel("oi."+pth,opts,{}),{ref:ref,req:o.req,hint:o.hint});};
  let h="";
  h+=formNote("Other Information is the tax-audit annexure — <b>mandatory if the firm/entity is "+
    "liable for audit under section 44AB</b>. Serial numbers marked in red are compulsory when the "+
    "schedule applies; blank numeric fields are treated as zeroes. These figures feed Schedule BP.");

  let s="";
  /* ---- 1-3 method of accounting & ICDS deviation ---- */
  s+=rsel("1 — Method of accounting employed in the previous year","MethodOfAcct",OI_MOA,"1",{req:1});
  s+=rsel("2 — Is there any change in method of accounting?","ChangeInAcctMethFlg",OI_NY,"2",{req:1});
  s+=rc("3a — Increase in profit / decrease in loss from ICDS deviation u/s 145(2)","ProfDeviatDueAcctMeth","3a",{hint:"from Schedule ICDS col XI(3)"});
  s+=rc("3b — Decrease in profit / increase in loss from ICDS deviation u/s 145(2)","DecProOrIncLossUs145_2","3b",{hint:"from Schedule ICDS col XI(4)"});

  /* ---- 4 method of valuation of closing stock ---- */
  s+=sub("4 — Method of valuation of closing stock");
  s+=rsel("4a — Raw material","MethodOfValClgStk.ValRawMaterial",OI_VAL,"4a");
  s+=rsel("4b — Finished goods","MethodOfValClgStk.ValFinishedGoods",OI_VAL,"4b");
  s+=rsel("4c — Is there any change in stock valuation method?","MethodOfValClgStk.ChngStockValMetFlg",OI_NY,"4c");
  s+=ri("4d — Increase in profit / decrease in loss from deviation u/s 145A","MethodOfValClgStk.EffectOnPL","4d");
  s+=ri("4e — Decrease in profit / increase in loss from deviation u/s 145A","MethodOfValClgStk.DecProOrIncLossUs145_A","4e");

  /* ---- 5 amounts not credited to the P&L ---- */
  s+=sub("5 — Amounts not credited to the profit and loss account");
  s+=ri("5a — Items within the scope of section 28","NoCredToPLAmt.Section28Items","5a");
  s+=ri("5b — Proforma credits, drawbacks, refunds of duty / tax admitted as due","NoCredToPLAmt.ProformaCreditsDue","5b");
  s+=ri("5c — Escalation claims accepted during the year","NoCredToPLAmt.PrevYrEscalClaim","5c");
  s+=ri("5d — Any other item of income","NoCredToPLAmt.OthItemInc","5d");
  s+=ri("5e — Capital receipt, if any","NoCredToPLAmt.CapReceipt","5e");
  s+=rc("5f — Total (5a to 5e)","NoCredToPLAmt.TotNoCredToPLAmt","5f");

  /* ---- 6 disallowable u/s 36 ---- */
  const L36=["Insurance against damage/destruction of stocks or stores [36(1)(i)]","Insurance on the health of employees [36(1)(ib)]","Bonus/commission otherwise payable as profit or dividend [36(1)(ii)]","Interest on borrowed capital [36(1)(iii)]","Discount on a zero-coupon bond [36(1)(iiia)]","Contribution to a recognised provident fund [36(1)(iv)]","Contribution to an approved superannuation fund [36(1)(iv)]","Contribution to a pension scheme u/s 80CCD [36(1)(iva)]","Contribution to an approved gratuity fund [36(1)(v)]","Contribution to any other fund","Employees' contribution not credited by due date [36(1)(va)]","Bad and doubtful debts [36(1)(vii)]","Provision for bad and doubtful debts [36(1)(viia)]","Amount transferred to any special reserve [36(1)(viii)]","Family-planning promotion expenditure [36(1)(ix)]","Securities transaction tax where income not in business income [36(1)(xv)]","Marked-to-market / other expected loss per ICDS u/s 145(2) [36(1)(xviii)]","Sugarcane purchase above the government-approved price [36(1)(xvii)]","Any other disallowance"];
  const abc="abcdefghijklmnopqrs";
  s+=sub("6 — Amounts debited to P&L, disallowable under section 36");
  OI_36.forEach((k,i)=>s+=ri("6"+abc[i]+" — "+L36[i],"AmtDisallUs36."+k,"6"+abc[i],{ind:1}));
  s+=rc("6t — Total disallowable under section 36 (6a to 6s)","AmtDisallUs36.TotAmtDisallUs36","6t");
  s+=sub("6u — Total number of employees employed (mandatory if the assessee has a recognised Provident Fund)");
  s+=ri("6u(i) — Deployed in India","AmtDisallUs36.NoOfEmployeesEmployed.DeployedInIndia","6u(i)",{ind:1});
  s+=ri("6u(ii) — Deployed outside India","AmtDisallUs36.NoOfEmployeesEmployed.DeployedOutSideIndia","6u(ii)",{ind:1});
  s+=rc("6u(iii) — Total deployed (i + ii)","AmtDisallUs36.NoOfEmployeesEmployed.Total","6u(iii)");

  /* ---- 7 disallowable u/s 37 ---- */
  const L37=["Expenditure of a capital nature [37(1)]","Expenditure of a personal nature [37(1)]","Expenditure not wholly / exclusively for business or profession [37(1)]","Advertisement in a political party's publication [37(2B)]","Penalty or fine for violation of any law","Any other penalty or fine","Expenditure for an offence or prohibited by law","Any liability of a contingent nature","Any other amount not allowable under section 37"];
  s+=sub("7 — Amounts debited to P&L, disallowable under section 37");
  OI_37.forEach((k,i)=>s+=ri("7"+abc[i]+" — "+L37[i],"AmtDisallUs37."+k,"7"+abc[i],{ind:1}));
  s+=rc("7j — Total disallowable under section 37 (7a to 7i)","AmtDisallUs37.TotAmtDisallUs37","7j");

  /* ---- 8 disallowable u/s 40 ---- */
  const L40=["40(a)(i) — non-compliance with Chapter XVII-B","40(a)(ia) — non-compliance with Chapter XVII-B","40(a)(ib) — non-compliance with Chapter VIII, Finance Act 2016 (equalisation levy)","40(a)(iii) — non-compliance with Chapter XVII-B","Tax or rate levied on the basis of profits [40(a)(ii)]","Amount paid as wealth tax [40(a)(iia)]","Royalty / licence / service fee [40(a)(iib)]","Interest, salary, bonus, commission or remuneration to a partner/member [40(b)]","Any other disallowance"];
  s+=sub("8A — Amounts debited to P&L, disallowable under section 40");
  OI_40.forEach((k,i)=>s+=ri("8A."+abc[i]+" — "+L40[i],"AmtDisallUs40."+k,"8A"+abc[i],{ind:1}));
  s+=rc("8A.j — Total disallowable under section 40 (Aa to Ai)","AmtDisallUs40.TotAmtDisallUs40","8Aj");
  s+=ri("8B — Disallowed u/s 40 in an earlier year, allowable this year","AmtDisallUs40.AnyAmtOfSec40AllowPrevYr","8B",{hint:"feeds Schedule BP A29"});

  /* ---- 9 disallowable u/s 40A (9e / 40A(13) has no schema leaf — omitted) ---- */
  const L40A=["9a — Amounts paid to persons specified in 40A(2)(b)","9b — Paid otherwise than by prescribed mode, disallowable u/s 40A(3)","9c — Provision for payment of gratuity [40A(7)]","9d — Contribution to a fund / trust / company / AOP / BOI / society [40A(9)]","9f — Any other disallowance"];
  const R40A=["9a","9b","9c","9d","9f"];
  s+=sub("9 — Amounts debited to P&L, disallowable under section 40A");
  OI_40A.forEach((k,i)=>s+=ri(L40A[i],"AmtDisallUs40A."+k,R40A[i],{ind:1}));
  s+=note("Row 9e — marked-to-market / other expected loss u/s 40A(13) — is not shown: "+
    "the ITR-5 schema provides no field for it, so it cannot be filed and is excluded from the 9g total.");
  s+=rc("9g — Total disallowable under section 40A (9a to 9f)","AmtDisallUs40A.TotAmtDisallUs40A","9g");

  /* ---- 10 & 11 section 43B (same nine sub-items) ---- */
  const L43B=["Tax, duty, cess or fee under any law","Contribution to PF / superannuation / gratuity / welfare fund","Bonus or commission to an employee","Interest on a loan from a public FI / State FC / State IIC","Interest on a loan from a notified NBFC","Interest on a loan from a scheduled / co-operative bank","Sum payable towards leave encashment","Sum payable to Indian Railways for the use of railway assets","Sum payable to a micro / small enterprise beyond s.15 MSMED Act"];
  const R43B=["a","b","c","d","da","e","f","g","h"];
  const K43B=OI_43B.concat(OI_43BO);   /* 10a..10h / 11a..11h in sheet order */
  s+=sub("10 — Disallowed u/s 43B in an earlier year, allowable this year");
  K43B.forEach((k,i)=>s+=ri("10"+R43B[i]+" — "+L43B[i],"AmtDisallUs43BPyNowAll.AmtUs43B."+k,"10"+R43B[i],{ind:1}));
  s+=rc("10i — Total allowable under section 43B (10a to 10h)","AmtDisallUs43BPyNowAll.AmtUs43B.TotAmtUs43b","10i");
  s+=sub("11 — Debited to P&L this year but disallowable u/s 43B");
  K43B.forEach((k,i)=>s+=ri("11"+R43B[i]+" — "+L43B[i],"AmtDisall43B.AmtUs43B."+k,"11"+R43B[i],{ind:1}));
  s+=rc("11i — Total disallowable under section 43B (11a to 11h)","AmtDisall43B.AmtUs43B.TotAmtUs43b","11i");

  /* ---- 12 credit outstanding ---- */
  const L12=["Union excise duty","Service tax","VAT / Sales tax","Central GST (CGST)","State GST (SGST)","Integrated GST (IGST)","Union Territory GST (UTGST)","Any other tax"];
  s+=sub("12 — Amount of credit outstanding in the accounts");
  OI_12.forEach((k,i)=>s+=ri("12"+abc[i]+" — "+L12[i],"AmtExciseCustomsVATOutstanding.ExciseCustomsVAT."+k,"12"+abc[i],{ind:1}));
  s+=rc("12i — Total amount outstanding (12a to 12h)","AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.TotExciseCustomsVAT","12i");

  /* ---- 13-17 ---- */
  s+=sub("13 — Amounts deemed to be profits and gains u/s 33AB / 33ABA / 33AC");
  s+=ri("13a — u/s 33AB","DeemedProfUs33AB","13a",{ind:1});
  s+=ri("13b — u/s 33ABA","DeemedProfUs33ABA","13b",{ind:1});
  s+=ri("13c — u/s 33AC","DeemedProfUs33AC","13c",{ind:1});
  s+=rc("13 — Total deemed profits (13a + 13b + 13c)","DeemedProfUs33ABs","13");
  s+=ri("14 — Profit chargeable to tax under section 41","ProfTaxAmtUs41","14",{req:1,hint:"feeds Schedule BP 8b"});
  s+=ri("15 — Income/expenditure of prior period credited/debited to P&L (net; may be negative)","PriorAmtIncCrDrPL","15",{req:1,hint:"feeds Schedule BP 19"});
  s+=ri("16 — Expenditure disallowed u/s 14A","AmountOfExpDisAllwUs14A","16",{req:1});
  s+=ri("16A — Interest disallowable u/s 23 of the MSMED Act, 2006","InterestDisAllowUs23SMEAct","16A");
  s+=rsel("17 — Exercising option u/s 92CE(2A)? (if Yes, fill Schedule TPSA)","ScheduleTPSAFlg",OI_YN,"17",{req:1});

  h+=fold("oi_main","OI","Other information — tax-audit annexure (mandatory if 44AB)",
    _oiHas(S.oi)?"filled":"if 44AB",s,{def:true});

  /* ================= Quantitative Details (Part A - QD) ================= */
  let q="";
  q+=note("Mandatory if liable for audit under section 44AB. Quantities only; item names ≤ 25 characters "+
    "(the characters &lt; &gt; &amp; ' \" $ are not allowed); shortage/excess may be negative. "+
    "If the first row of a grid is left blank, later rows in that grid are ignored.");
  q+=sub("(a) Trading concern");
  q+=grid("qd.trd",[
      {k:"ItemName",h:"Item name",t:"txt",w:"auto",req:1,max:25},
      {k:"UnitOfMeasure",h:"Unit",t:"sel",w:"150px",req:1,opts:OI_UNIT},
      {k:"OpeningStock",h:"Opening",t:"num",w:"100px",req:1},
      {k:"PurchaseQty",h:"Purchase",t:"num",w:"100px",req:1},
      {k:"SaleQty",h:"Sales",t:"num",w:"100px",req:1},
      {k:"ClgStock",h:"Closing",t:"num",w:"100px",req:1},
      {k:"AnyShortExces",h:"Shortage/excess",t:"num",w:"110px",req:1}],
    S.qd.trd,{min:"820px",empty:"No trading-concern items.",add:"Add a stock item"});
  q+=sub("(b) Manufacturing concern — raw materials");
  q+=grid("qd.raw",[
      {k:"ItemName",h:"Item name",t:"txt",w:"auto",req:1,max:25},
      {k:"UnitOfMeasure",h:"Unit",t:"sel",w:"150px",req:1,opts:OI_UNIT},
      {k:"OpeningStock",h:"Opening",t:"num",w:"90px",req:1},
      {k:"PurchaseQty",h:"Purchase",t:"num",w:"90px",req:1},
      {k:"PrevYrConsum",h:"Consumption",t:"num",w:"100px",req:1},
      {k:"SaleQty",h:"Sales",t:"num",w:"90px",req:1},
      {k:"ClgStock",h:"Closing",t:"num",w:"90px",req:1},
      {k:"yldFinisProd",h:"Yield fin. prod.",t:"num",w:"100px",req:1},
      {k:"PercentYld",h:"% yield",t:"num",w:"80px",req:1},
      {k:"AnyShortExces",h:"Shortage/excess",t:"num",w:"110px",req:1}],
    S.qd.raw,{min:"1060px",empty:"No raw-material items.",add:"Add a raw material"});
  q+=sub("(c) Manufacturing concern — finished products / by-products");
  q+=grid("qd.fin",[
      {k:"ItemName",h:"Item name",t:"txt",w:"auto",req:1,max:25},
      {k:"UnitOfMeasure",h:"Unit",t:"sel",w:"150px",req:1,opts:OI_UNIT},
      {k:"OpeningStock",h:"Opening",t:"num",w:"100px",req:1},
      {k:"PurchaseQty",h:"Purchase",t:"num",w:"100px",req:1},
      {k:"PrevyrManfact",h:"Qty manufactured",t:"num",w:"120px",req:1},
      {k:"SaleQty",h:"Sales",t:"num",w:"100px",req:1},
      {k:"ClgStock",h:"Closing",t:"num",w:"100px",req:1},
      {k:"AnyShortExces",h:"Shortage/excess",t:"num",w:"110px",req:1}],
    S.qd.fin,{min:"960px",empty:"No finished/by-product items.",add:"Add a finished/by-product"});
  const nq=S.qd.trd.length+S.qd.raw.length+S.qd.fin.length;
  h+=fold("oi_qd","QD","Quantitative details (mandatory if liable to audit u/s 44AB)",
    nq?nq+" items":"if 44AB",q,{def:false});
  return h;
}

/* ================================================================
   exp — write PARTA_OI and PARTA_QD onto j via put().  Both blocks are
   OPTIONAL (not in SKEL): each is emitted only when it carries data.
   Required integer leaves are written even when 0 (put keeps 0), so an
   emitted block is schema-complete; optional leaves are written only when
   nonzero.  9e / 40A(13) is never written (no schema leaf).
   ================================================================ */
const OI_STR  =["MethodOfAcct","ChangeInAcctMethFlg","ValRawMaterial","ValFinishedGoods","ChngStockValMetFlg","ScheduleTPSAFlg","ItemName","UnitOfMeasure"];
const OI_FLOAT=["PercentYld"];
function _oiVal(k,v){
  if(OI_STR.indexOf(k)>=0){const s=st0(v);return s||undefined;}
  if(OI_FLOAT.indexOf(k)>=0){const n=N(v);return n||undefined;}
  return R(N(v));                       /* integer (AnyShortExces keeps its sign) */
}
function _oiNode(o){                     /* coerce one QD row object */
  const out={};
  for(const k in o){const cv=_oiVal(k,o[k]); if(cv!==undefined)out[k]=cv;}
  return out;
}
/* first-row-governs: a grid is emitted only if its first row has an item name;
   empty rows are dropped. */
function _qdArr(rows){
  rows=Array.isArray(rows)?rows:[];
  if(!rows.length||!st0(rows[0].ItemName))return [];
  return rows.map(_oiNode).filter(r=>st0(r.ItemName));
}
function expOi(j){
  const g=p=>R(N(get("oi."+p)));
  if(_oiHas(S.oi)){
    const o={};
    /* 1,2 (string enums) */
    put(o,"MethodOfAcct", sv(get("oi.MethodOfAcct")));
    put(o,"ChangeInAcctMethFlg", sv(get("oi.ChangeInAcctMethFlg")));
    /* 3a,3b */
    put(o,"ProfDeviatDueAcctMeth", g("ProfDeviatDueAcctMeth"));
    put(o,"DecProOrIncLossUs145_2", g("DecProOrIncLossUs145_2"));
    /* 4 method of valuation (whole object optional; emit if any leaf has data) */
    if(_oiHas(S.oi.MethodOfValClgStk)){
      put(o,"MethodOfValClgStk.ValRawMaterial", sv(get("oi.MethodOfValClgStk.ValRawMaterial")));
      put(o,"MethodOfValClgStk.ValFinishedGoods", sv(get("oi.MethodOfValClgStk.ValFinishedGoods")));
      put(o,"MethodOfValClgStk.ChngStockValMetFlg", sv(get("oi.MethodOfValClgStk.ChngStockValMetFlg")));
      put(o,"MethodOfValClgStk.EffectOnPL", g("MethodOfValClgStk.EffectOnPL"));
      put(o,"MethodOfValClgStk.DecProOrIncLossUs145_A", g("MethodOfValClgStk.DecProOrIncLossUs145_A"));
    }
    /* 5 */
    OI_5.forEach(k=>put(o,"NoCredToPLAmt."+k, g("NoCredToPLAmt."+k)));
    put(o,"NoCredToPLAmt.TotNoCredToPLAmt", g("NoCredToPLAmt.TotNoCredToPLAmt"));
    /* 6 */
    OI_36.forEach(k=>put(o,"AmtDisallUs36."+k, g("AmtDisallUs36."+k)));
    put(o,"AmtDisallUs36.TotAmtDisallUs36", g("AmtDisallUs36.TotAmtDisallUs36"));
    /* 6u — optional sub-object; emit only if it carries data */
    if(_oiHas(S.oi.AmtDisallUs36&&S.oi.AmtDisallUs36.NoOfEmployeesEmployed)){
      put(o,"AmtDisallUs36.NoOfEmployeesEmployed.DeployedInIndia", g("AmtDisallUs36.NoOfEmployeesEmployed.DeployedInIndia"));
      put(o,"AmtDisallUs36.NoOfEmployeesEmployed.DeployedOutSideIndia", g("AmtDisallUs36.NoOfEmployeesEmployed.DeployedOutSideIndia"));
      put(o,"AmtDisallUs36.NoOfEmployeesEmployed.Total", g("AmtDisallUs36.NoOfEmployeesEmployed.Total"));
    }
    /* 7 */
    OI_37.forEach(k=>put(o,"AmtDisallUs37."+k, g("AmtDisallUs37."+k)));
    put(o,"AmtDisallUs37.TotAmtDisallUs37", g("AmtDisallUs37.TotAmtDisallUs37"));
    /* 8 */
    OI_40.forEach(k=>put(o,"AmtDisallUs40."+k, g("AmtDisallUs40."+k)));
    put(o,"AmtDisallUs40.TotAmtDisallUs40", g("AmtDisallUs40.TotAmtDisallUs40"));
    put(o,"AmtDisallUs40.AnyAmtOfSec40AllowPrevYr", g("AmtDisallUs40.AnyAmtOfSec40AllowPrevYr"));
    /* 9  (9e / 40A(13) intentionally not written — no schema leaf) */
    OI_40A.forEach(k=>put(o,"AmtDisallUs40A."+k, g("AmtDisallUs40A."+k)));
    put(o,"AmtDisallUs40A.TotAmtDisallUs40A", g("AmtDisallUs40A.TotAmtDisallUs40A"));
    /* 10 — one writer per path: the mandatory keys (OI_43B) always, the optional
       ones (OI_43BO) only when non-zero. Built from a single put() so no path has
       two source writers. */
    {const P="AmtDisallUs43BPyNowAll.AmtUs43B.";
     OI_43B.concat(OI_43BO).forEach(k=>{const key=P+k,v=g(key); if(OI_43B.indexOf(k)>=0||v)put(o,key,v);});
     put(o,P+"TotAmtUs43b", g(P+"TotAmtUs43b"));}
    /* 11 */
    {const P="AmtDisall43B.AmtUs43B.";
     OI_43B.concat(OI_43BO).forEach(k=>{const key=P+k,v=g(key); if(OI_43B.indexOf(k)>=0||v)put(o,key,v);});
     put(o,P+"TotAmtUs43b", g(P+"TotAmtUs43b"));}
    /* 12 */
    OI_12.forEach(k=>put(o,"AmtExciseCustomsVATOutstanding.ExciseCustomsVAT."+k, g("AmtExciseCustomsVATOutstanding.ExciseCustomsVAT."+k)));
    put(o,"AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.TotExciseCustomsVAT", g("AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.TotExciseCustomsVAT"));
    /* 13 (total required; 13a/13b/13c optional) */
    put(o,"DeemedProfUs33ABs", g("DeemedProfUs33ABs"));
    ["DeemedProfUs33AB","DeemedProfUs33ABA","DeemedProfUs33AC"].forEach(k=>{const v=g(k); if(v)put(o,k,v);});
    /* 14,15,16 (required) */
    put(o,"ProfTaxAmtUs41", g("ProfTaxAmtUs41"));
    put(o,"PriorAmtIncCrDrPL", g("PriorAmtIncCrDrPL"));   /* may be negative */
    put(o,"AmountOfExpDisAllwUs14A", g("AmountOfExpDisAllwUs14A"));
    /* 16A optional */
    {const v=g("InterestDisAllowUs23SMEAct"); if(v)put(o,"InterestDisAllowUs23SMEAct", v);}
    /* 17 */
    put(o,"ScheduleTPSAFlg", sv(get("oi.ScheduleTPSAFlg")));
    j.PARTA_OI=o;
  }
  /* ---- Part A - QD ---- */
  const qd={}, mc={};
  const t=_qdArr(S.qd.trd); if(t.length) qd.TradingConcern={QuantitDet:t};
  const raw=_qdArr(S.qd.raw); if(raw.length) mc.RawMaterial={QuantitDet:raw};
  const fin=_qdArr(S.qd.fin); if(fin.length) mc.FinishrByProd={QuantitDet:fin};
  if(Object.keys(mc).length) qd.ManfactrConcern=mc;
  if(Object.keys(qd).length) j.PARTA_QD=qd;
}

/* ================================================================
   imp — read PARTA_OI / PARTA_QD back into S.oi / S.qd, then restore the
   default container skeleton so every object/array the renderer touches
   exists.
   ================================================================ */
function _oiFill(dst,def){
  for(const k in def){
    if(dst[k]===undefined||dst[k]===null)dst[k]=deep(def[k]);
    else if(def[k]&&typeof def[k]==="object"&&!Array.isArray(def[k])&&typeof dst[k]==="object"&&!Array.isArray(dst[k]))_oiFill(dst[k],def[k]);
  }
}
function impOi(I){
  const got=[];
  if(I&&I.PARTA_OI){S.oi=deep(I.PARTA_OI);got.push("Part A - OI");}
  if(I&&I.PARTA_QD){const q=I.PARTA_QD;
    S.qd={
      trd:deep((q.TradingConcern&&q.TradingConcern.QuantitDet)||[]),
      raw:deep((q.ManfactrConcern&&q.ManfactrConcern.RawMaterial&&q.ManfactrConcern.RawMaterial.QuantitDet)||[]),
      fin:deep((q.ManfactrConcern&&q.ManfactrConcern.FinishrByProd&&q.ManfactrConcern.FinishrByProd.QuantitDet)||[])};
    got.push("Quantitative Details");}
  _oiFill(S.oi,{MethodOfValClgStk:{},NoCredToPLAmt:{},AmtDisallUs36:{NoOfEmployeesEmployed:{}},AmtDisallUs37:{},AmtDisallUs40:{},AmtDisallUs40A:{},AmtDisallUs43BPyNowAll:{AmtUs43B:{}},AmtDisall43B:{AmtUs43B:{}},AmtExciseCustomsVATOutstanding:{ExciseCustomsVAT:{}}});
  if(!S.qd)S.qd={trd:[],raw:[],fin:[]};
  ["trd","raw","fin"].forEach(k=>{if(!Array.isArray(S.qd[k]))S.qd[k]=[];});
  return got;
}

/* ================================================================
   chk — the sheet's own rules as live messages (from the books).
   ================================================================ */
const OI_BADCHARS=/[<>&'"$]/;
function chkOi(){
  const out=[], C=(S.C&&S.C.oi)||{}, V=p=>N(get("oi."+p));

  /* 6u mandatory when a recognised PF contribution (6f) is disclosed [F42] */
  if(V("AmtDisallUs36.RecogPFContribAmt")>0 &&
     !(V("AmtDisallUs36.NoOfEmployeesEmployed.DeployedInIndia")+V("AmtDisallUs36.NoOfEmployeesEmployed.DeployedOutSideIndia")))
    out.push({lvl:"warn",t:"Employee count missing",m:"A recognised Provident Fund contribution (6f) is disclosed, so the total number of employees (6u) is mandatory.",sec:"oi"});

  /* 17: option u/s 92CE(2A) = Yes -> Schedule TPSA must be filled (rule 190) */
  if(st0(get("oi.ScheduleTPSAFlg"))==="Yes")
    out.push({lvl:"warn",t:"Schedule TPSA required",m:"Option u/s 92CE(2A) is 'Yes' (item 17) — Schedule TPSA must be filled (rule 190).",sec:"oi"});

  /* QD grid validators (VBA + data-validation from QUANTITATIVE_DETAILS.md) */
  const grids=[["Trading",S.qd.trd,false],["Raw material",S.qd.raw,true],["Finished/by-product",S.qd.fin,false]];
  grids.forEach(([lbl,rows,isRaw])=>{
    rows=rows||[];
    /* first-row-governs (D3): a filled later row is ignored if the first is blank */
    if(rows.length>1 && !st0(rows[0].ItemName) && rows.slice(1).some(r=>st0(r.ItemName)))
      out.push({lvl:"warn",t:lbl+": first row blank",m:"The first row of the "+lbl.toLowerCase()+" grid is blank, so its later rows will be ignored.",sec:"oi"});
    rows.forEach((r,i)=>{
      const nm=st0(r.ItemName); if(!nm)return;
      if(nm.length>25)
        out.push({lvl:"err",t:lbl+": item name too long",m:"Item name in row "+(i+1)+" exceeds 25 characters.",sec:"oi"});
      if(OI_BADCHARS.test(nm))
        out.push({lvl:"err",t:lbl+": invalid characters",m:"Item name in row "+(i+1)+" uses a disallowed character (< > & ' \" $).",sec:"oi"});
      if(!st0(r.UnitOfMeasure))
        out.push({lvl:"err",t:lbl+": unit missing",m:"Select a unit of measure for row "+(i+1)+".",sec:"oi"});
      if(isRaw){const p=N(r.PercentYld); if(p<0||p>100)
        out.push({lvl:"err",t:lbl+": % yield out of range",m:"Percentage of yield in row "+(i+1)+" must be between 0 and 100.",sec:"oi"});}
    });
  });

  /* Schedule-mandatory when liable for audit u/s 44AB (VBA trigger): at least
     one row across the Trading or Raw-material grids.  LiableSec44ABflg lives
     in PartA_GEN2 (section "gen"); its state key is a cross-section seam, so
     this is checked only when the flag can be read, else skipped (no false
     error).  When "gen" exposes its flag the integrator can point this here. */
  const flag=(S.gen&&S.gen.LiableSec44ABflg)||(S.gen2&&S.gen2.LiableSec44ABflg)||(S.C&&S.C.gen&&S.C.gen.liable44AB);
  if(flag==="Y"||flag==="Y-Yes"||flag===true){
    if(!(S.qd.trd||[]).length && !(S.qd.raw||[]).length)
      out.push({lvl:"err",t:"Quantitative details required",m:"Liable for audit u/s 44AB — Schedule QD is compulsory (at least one Trading or Raw-material item).",sec:"oi"});
    if(!_oiHas(S.oi))
      out.push({lvl:"err",t:"Other Information required",m:"Liable for audit u/s 44AB — Part A-OI must be filled.",sec:"oi"});
  }
  return out;
}

/* ================================================================ */
reg({id:"oi", t:"Other information and quantitative details", ref:"Part A - OI · QD",
  f:secOi, s:()=>{const C=(S.C&&S.C.oi)||{};
    if(C.profTaxUs41) return RS(C.profTaxUs41)+" u/s 41";
    if(C.qdRows) return C.qdRows+" QD items";
    return _oiHas(S.oi)?"filled":"";},
  /* order 6 — the Part-A accounts/disclosure band (bs=6, hp=6). OI must
     compute BEFORE Schedule BP (bp consumes S.C.oi.* feeds: 6t->A14, 9g->A17,
     10i->A30, 8B->A29, item14->8b, item15->19, SUM(5a..5d)->Sl.23, 17->Sl.19),
     so its order must be < bp's; bp, an income head built from these accounts,
     is necessarily later. (3a/3b optionally read S.C.icds — a Schedule-ICDS
     feed that may compute later; they fall back to state, so no hard dependency.
     Compute-order seams are the integrator's to finalise.) */
  eng:engOi, exp:expOi, imp:impOi, chk:chkOi, order:6});
