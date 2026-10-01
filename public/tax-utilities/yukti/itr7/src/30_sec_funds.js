/* =====================================================================
   70_sec_funds.js — Balance sheet, funds & corpus (ITR-7, Phase 4)
   Section id "funds", screen order 130 / compute order 20.
   Built ONLY from books/ITR-7/: BALANCE_SHEET.md (block PARTA_BS),
   Schedule_J.md (block ITRScheduleJ), Schedule_R.md (block ITRScheduleR),
   plus the schema for exact keys/enum codes. Modelled on the ITR-6
   accounts/balance-sheet builder (forms/ITR-6/src/70_sec_accounts.js).

   Three schema blocks (verbatim keys):
     PARTA_BS      — trust fund-accounting balance sheet: Sources of Funds
                     (own corpus + loans + advances) = Application of Funds
                     (fixed assets + investments + net current assets +
                     accumulated balance). Always filed (in SKEL, required).
     ITRScheduleJ  — statement of funds & investments on the last day: A1
                     corpus movement, A2 loan/borrowing movement, B corpus
                     11(5) investments (14-mode list), C 13(3)-concern
                     investments, D other investments, E in-kind voluntary
                     contributions. Optional block; when emitted, A1 & A2
                     are always present (block-required).
     ITRScheduleR  — reconciliation of the Schedule J closing corpus (line
                     A) to the Balance-Sheet corpus (line C = A + reasons)
                     across the three corpus columns. Optional block.

   COMPUTE CHAIN (trust fund-accounting identity):
     BS  : TotalFund/TotalLoanFund → TotSourceFund  (row 24, A)
           NetBlock/NetCurrAssets  → TotalApplicationOfFunds (row 57, B)
           the department requires  A == B.
     J-A1: ClosingBlc = (Opening + Received + col5 deposited-back) − Applied
           Investment_11_5_Other = Closing − Investment_11_5 − AmtTaxed
     J-A2: ClosingBlc = Opening + LoanBorrow − TotRepOfLoan
     R   : line A (per Sch J) = J-A1 closing corpus grouped by corpus type
           line B = B(i) Purchase FA + B(ii) Depreciation + B(iii) other
           line C (per BS) = A + B  (the required output; clamped ≥ 0)
   Publishes S.C.funds.* for downstream seams (corpus totals, 11(5) split,
   the source/application half-totals and the balancing flag).
   ===================================================================== */

/* ---- dropdown code lists (codes verbatim from the schema patterns;
   labels from Schedule_J.md Appendix 4) ---- */
const J_CORPUS=[["80G2B","i · 80G(2)(b) renovation-corpus donations (on/after 01.04.2020)"],
  ["OTIA","ii · Other corpus received on/after 01.04.2021"],
  ["OTHER","iii · Corpus other than (i) and (ii)"]];                      /* A1 CorpusDonation */
const J_INVOUT=[["CO80G","i · Corpus — 80G(2)(b) renovation donations"],
  ["COOT","ii · Corpus other than (i), received on/after 01.04.2021"],
  ["OTHER","iii · Other than (i) and (ii)"]];                             /* B InvestementOutOff */
const J_MODE=[["IGSS","Investment in Government Saving Scheme"],
  ["POSB","Post Office Saving Bank"],
  ["DSBC","Deposit in Scheduled Bank / co-op society — s.11(5)(iii)"],
  ["IUTI","Investment in UTI"],
  ["CGSG","Investment in CG/SG issued securities"],
  ["DEBT","CG/SG guaranteed debentures of a company/corporation"],
  ["PUSC","Investment/deposit in a public sector company"],
  ["FICO","Bonds of a financial corporation — s.11(5)(viii)"],
  ["PUCO","Bonds — long-term finance for construction — s.11(5)(ix)"],
  ["LTFU","Bonds — long-term finance for urban infra — s.11(5)(ixa)"],
  ["IMMP","Investment in immovable property"],
  ["IDBI","Deposits with the IDBI"],
  ["POWERGRID","Units of POWERGRID Infrastructure Investment Trust"],
  ["OTHER","Any other investment/deposit as per s.11(5)"]];               /* B ModeOfInvestment (14) */
const J_FY=[["11","2021-22"],["12","2022-23"],["13","2023-24"],["14","2024-25"],["15","2025-26"]]; /* A1/A2 FinacialYr */
const J_YN=[["Y","Yes"],["N","No"]];                                      /* C/D ConcernIsCompany, C PercentOfCapitalConcern */

/* ---- state: S.funds mirrors each schema block's nested shape; the engine
   writes computed totals back onto the same paths, so S.funds is the single
   source of truth for the renderer cells and the exporter. ---- */
S.funds = S.funds || {
  bs:{ SourcesOfFund:{ OwnFund:{ OtherReserve:[] }, LongTermBorrowings:{} },
       ApplicationOfFunds:{ FixedAsset:{},
         CurrentAssetsLoanAdv:{ CurrentAssets:{ CashNCashEquivalents:{} },
           CurrLiabilitiesProviosions:{ CurrLiability:{} } } } },
  j:{ a1:[], a2:[], us11:[], us13:[], other:[], vc:[] },
  r:{ ReasonsOfDiff:{ PurchFixedAsset:{}, Depreciation:{}, AnyOthReason:{} } }
};

/* ================================================================
   ENGINE — every total tagged with its book item/row reference.
   ================================================================ */
function engFunds(){
  const G=p=>N(get("funds."+p)),
        St=(p,v)=>set("funds."+p,R(v)),
        A=p=>{const a=get("funds."+p);return Array.isArray(a)?a:[];},
        SUM=(arr,k)=>arr.reduce((a,r)=>a+N(r[k]),0);

  /* ---------- Part A-BS — Sources of Funds ---------- */
  const of="bs.SourcesOfFund.OwnFund.";
  const orTot=SUM(A(of+"OtherReserve"),"Amount");                                    /* 1fiii */
  St(of+"TotalOtherReserve", orTot);
  const totFund=G(of+"Corpus80G")+G(of+"OtherCorpus")+G(of+"AccumulatedInc")
    +G(of+"AccumulatedIncUS10_11")+G(of+"BalDeemedInc")+orTot;                        /* 1g */
  St(of+"TotalFund", totFund);
  const lb="bs.SourcesOfFund.LongTermBorrowings.";
  const totLoan=G(lb+"SecuredLoan")+G(lb+"UnSecuredLoan");                            /* 2c */
  St(lb+"TotalLoanFund", totLoan);
  const totSrc=totFund+totLoan+G("bs.SourcesOfFund.Advances");                        /* A (row 24) */
  St("bs.SourcesOfFund.TotSourceFund", totSrc);

  /* ---------- Part A-BS — Application of Funds ---------- */
  const fa="bs.ApplicationOfFunds.FixedAsset.";
  const netBlk=G(fa+"GrossBlock")-G(fa+"Depreciation");                               /* 1c */
  St(fa+"NetBlock", netBlk);
  const cla="bs.ApplicationOfFunds.CurrentAssetsLoanAdv.", ca=cla+"CurrentAssets.", cce=ca+"CashNCashEquivalents.";
  const totCash=G(cce+"BalWithBanks")+G(cce+"CashInHand")+G(cce+"Others");            /* 3a iiiD */
  St(cce+"TotCashNCashEquivalents", totCash);
  const totCurAst=G(ca+"Inventory")+G(ca+"SundryDebtor")+totCash+G(ca+"OtherCurrAssets"); /* 3a v */
  St(ca+"TotCurrAssets", totCurAst);
  const tot3c=totCurAst+G(cla+"LoansandAdvances");                                    /* 3c */
  St(cla+"Total", tot3c);
  const cl=cla+"CurrLiabilitiesProviosions.CurrLiability.";
  const totCurLiab=G(cl+"SundryCreditor")+G(cl+"OtherPayable");                       /* 3d iC */
  St(cl+"TotalCurrLiabilitiesProviosions", totCurLiab);
  const clp=cla+"CurrLiabilitiesProviosions.";
  const totCLP=totCurLiab+G(clp+"Provisions");                                        /* 3d iii */
  St(clp+"TotCurrLiabilitiesandprovisions", totCLP);
  const netCur=tot3c-totCLP;                                                          /* 3e */
  St(cla+"NetCurrAssets", netCur);
  const app="bs.ApplicationOfFunds.";
  const totApp=netBlk+G(app+"Investements")+netCur+G(app+"AccBalAnyOthRes");          /* B (row 57) */
  St(app+"TotalApplicationOfFunds", totApp);

  /* ---------- Schedule J · A1 — corpus movement ---------- */
  A("j.a1").forEach((r,i)=>{
    const close=N(r.OpeningBlc)+N(r.ReceivedCorpus)+N(r.TotAmtDepositedBack)-N(r.AppliedPY); /* col 7 = (1+2+5)−3 */
    St("j.a1."+i+".ClosingBlc", close);
    St("j.a1."+i+".Investment_11_5_Other", close-N(r.Investment_11_5)-N(r.AmtTxdAssYr22_23)); /* col 10 = 7−8−9 */
  });
  const a1=A("j.a1");
  set("funds.j.a1Tot",{
    TotOpeningBlc:R(SUM(a1,"OpeningBlc")), TotReceivedCorpus:R(SUM(a1,"ReceivedCorpus")),
    TotAppliedPY:R(SUM(a1,"AppliedPY")), TotAmtDepositedBack:R(SUM(a1,"AmtDepositedBack")),
    TotTotAmtDepositedBack:R(SUM(a1,"TotAmtDepositedBack")), TotClosingBlc:R(SUM(a1,"ClosingBlc")),
    TotInvestment_11_5:R(SUM(a1,"Investment_11_5")), TotAmtTxdAssYr22_23:R(SUM(a1,"AmtTxdAssYr22_23")),
    TotInvestment_11_5_Other:R(SUM(a1,"Investment_11_5_Other")) });

  /* ---------- Schedule J · A2 — loan & borrowing movement ---------- */
  A("j.a2").forEach((r,i)=>{
    St("j.a2."+i+".ClosingBlc", N(r.OpeningBlc)+N(r.LoanBorrow)-N(r.TotRepOfLoan));   /* col 7 = 1+2−6 */
  });
  const a2=A("j.a2");
  set("funds.j.a2Tot",{
    TotOpeningBlc:R(SUM(a2,"OpeningBlc")), TotLoanBorrow:R(SUM(a2,"LoanBorrow")),
    TotAppliedPY:R(SUM(a2,"AppliedPY")), TotRepayment:R(SUM(a2,"Repayment")),
    TotTotRepOfLoan:R(SUM(a2,"TotRepOfLoan")), TotClosingBlc:R(SUM(a2,"ClosingBlc")) });

  /* ---------- Schedule J · B/C/D/E — investment & contribution totals ---------- */
  set("funds.j.us11Tot",{ TotalInvestmentAmt:R(SUM(A("j.us11"),"AmtOfInvestment")) });
  const us13=A("j.us13");
  set("funds.j.us13Tot",{ TotalNoOfShares:R(SUM(us13,"NoOfSharesHeld")),
    TotalValueOfInvestment:R(SUM(us13,"NominalaValueOfInvestment")),
    TotalIncFromInvestment:R(SUM(us13,"IncFromInvestment")) });
  const oth=A("j.other");
  set("funds.j.otherTot",{ TotalNoOfShares:R(SUM(oth,"NoOfSharesHeld")),
    TotalValueOfInvestment:R(SUM(oth,"NominalaValueOfInvestment")) });
  const vc=A("j.vc");
  set("funds.j.vcTot",{ TotalValueOfContribution:R(SUM(vc,"ValueOfContribution")),
    TotalValOfContrbnAppdTwrdsObj:R(SUM(vc,"ValueOfContributionObj")),
    TotalAmtInvestedUs11:R(SUM(vc,"AmtInvestedUs11")), TotalBalIncUs11:R(SUM(vc,"BalIncUs11")) });

  /* ---------- Schedule R — corpus reconciliation ---------- */
  /* line A: Schedule J A1 closing corpus grouped by corpus type */
  const grp={CorpOutOf80G2b:0, OthCorpReceived:0, CorpOthThan:0};
  a1.forEach(r=>{ const c=st0(r.CorpusDonation), v=N(r.ClosingBlc);
    if(c==="80G2B") grp.CorpOutOf80G2b+=v;
    else if(c==="OTIA") grp.OthCorpReceived+=v;
    else if(c==="OTHER") grp.CorpOthThan+=v; });
  set("funds.r.ClosngBalSchJ",{ CorpOutOf80G2b:R(grp.CorpOutOf80G2b),
    OthCorpReceived:R(grp.OthCorpReceived), CorpOthThan:R(grp.CorpOthThan) });
  const COLS=["CorpOutOf80G2b","OthCorpReceived","CorpOthThan"];
  const rd="r.ReasonsOfDiff.", totR={}, closeBS={};
  COLS.forEach(c=>{
    const b=G(rd+"PurchFixedAsset."+c)+G(rd+"Depreciation."+c)+G(rd+"AnyOthReason."+c); /* B = Bi+Bii+Biii */
    totR[c]=R(b);
    closeBS[c]=Math.max(0, R(grp[c])+R(b));                                            /* C = A + B (schema ≥ 0) */
  });
  set("funds."+rd+"TotalReasonsOfDiff", totR);
  set("funds.r.ClosngBalBalSheet", closeBS);

  /* ---------- cross-section scalars (seams) ---------- */
  S.C.funds={
    srcTot:R(totSrc), appTot:R(totApp), balances:(R(totSrc)===R(totApp)),
    totFund:R(totFund),
    corpus:{ c80g:R(G(of+"Corpus80G")), oth:R(G(of+"OtherCorpus")), other:R(G(of+"AccumulatedInc")) }, /* BS 1a/1b/1c */
    corpusCloseJ:{ c80g:R(grp.CorpOutOf80G2b), oth:R(grp.OthCorpReceived), other:R(grp.CorpOthThan),
                   total:R(grp.CorpOutOf80G2b+grp.OthCorpReceived+grp.CorpOthThan) },
    corpusCloseBS:{ c80g:closeBS.CorpOutOf80G2b, oth:closeBS.OthCorpReceived, other:closeBS.CorpOthThan,
                    total:closeBS.CorpOutOf80G2b+closeBS.OthCorpReceived+closeBS.CorpOthThan },
    inv11_5:R(G(app+"OutOf5InvModesUS11_5")), invOth11_5:R(G(app+"OutOf5InvModesOthUS11_5"))
  };
}

/* ================================================================
   SCREEN — data-p paths bind every live row.
   ================================================================ */
function _fN(label,path,o){o=o||{};return row(label,inp(path,{n:1}),{ref:o.ref,hint:o.hint,ind:o.ind});}
function _fC(label,path,o){o=o||{};return row(label,cell(N(get(path))),{ref:o.ref,ind:o.ind,cls:"sub"});}

function secFunds(){
  const C=S.C.funds||{};
  let h="";
  h+=note("<b>Balance sheet, funds &amp; corpus.</b> The trust's fund-accounting balance sheet (Part A-BS), the statement of funds &amp; investments on 31.03.2026 (Schedule J) and the reconciliation of the Schedule J closing corpus to the Balance-Sheet corpus (Schedule R). Part A-BS is mandatory for every ITR-7 filer; amounts are whole rupees. The two half-totals — <b>Sources of funds</b> and <b>Total application of funds</b> — must be equal.");

  /* ---- Part A-BS ---- */
  h+=fold("fn_bs","Part A-BS","Balance Sheet",
    C.srcTot?(CR(C.srcTot)+(C.balances?" ✓":" ⚠ does not balance")):"", _fBS(), {def:true});
  /* ---- Schedule J ---- */
  const jClose=(S.funds.j&&S.funds.j.a1Tot)?N(S.funds.j.a1Tot.TotClosingBlc):0;
  h+=fold("fn_j","Schedule J","Funds & investments on the last day of the year",
    jClose?("corpus close "+CR(jClose)):"", _fJ(), {});
  /* ---- Schedule R ---- */
  h+=fold("fn_r","Schedule R","Reconciliation of corpus — Schedule J ↔ Balance sheet",
    (C.corpusCloseBS&&C.corpusCloseBS.total)?CR(C.corpusCloseBS.total):"", _fR(), {});
  return h;
}

function _fBS(){
  let h="";
  h+=sub("A · Sources of Funds");
  h+=sub("1 · Own Funds (corpus)");
  const of="funds.bs.SourcesOfFund.OwnFund.";
  h+=_fN("a · Corpus — 80G(2)(b) renovation donations (on/after 01.04.2020)",of+"Corpus80G",{ref:"1a"});
  h+=_fN("b · Other corpus received on/after 01.04.2021",of+"OtherCorpus",{ref:"1b"});
  h+=_fN("c · Corpus other than (a) and (b)",of+"AccumulatedInc",{ref:"1c"});
  h+=_fN("d · Income accumulated u/s 10(23C) 3rd proviso / 11(2)",of+"AccumulatedIncUS10_11",{ref:"1d"});
  h+=_fN("e · Balance of deemed income to be applied in FY 2026-27 onwards",of+"BalDeemedInc",{ref:"1e"});
  h+=row("f · Any other reserve (specify the nature)","",{ref:"1f"});
  h+=grid("funds.bs.SourcesOfFund.OwnFund.OtherReserve",
    [{h:"Specify the nature",k:"Nature",t:"txt",max:300},{h:"Amount",k:"Amount",t:"num",w:"140px"}],
    RG(S,"funds.bs.SourcesOfFund.OwnFund.OtherReserve",[]),{add:"Add a reserve",empty:"No other reserve."});
  h+=_fC("iii · Total other reserve",of+"TotalOtherReserve",{ref:"1fiii"});
  h+=_fC("g · Total fund (a+b+c+d+e+f)",of+"TotalFund",{ref:"1g"});
  h+=sub("2 · Loan and Borrowings");
  const lb="funds.bs.SourcesOfFund.LongTermBorrowings.";
  h+=_fN("a · Secured loans",lb+"SecuredLoan",{ref:"2a"});
  h+=_fN("b · Unsecured loans (including deposits)",lb+"UnSecuredLoan",{ref:"2b"});
  h+=_fC("c · Total loan funds (a+b)",lb+"TotalLoanFund",{ref:"2c"});
  h+=_fN("3 · Advances","funds.bs.SourcesOfFund.Advances",{ref:"3"});
  h+=_fC("A · Sources of funds (1g + 2c + 3)","funds.bs.SourcesOfFund.TotSourceFund",{ref:"A"});

  h+=sub("B · Application of Funds");
  h+=sub("1 · Fixed assets");
  const fa="funds.bs.ApplicationOfFunds.FixedAsset.";
  h+=_fN("a · Gross fixed assets",fa+"GrossBlock",{ref:"1a"});
  h+=_fN("b · Depreciation",fa+"Depreciation",{ref:"1b"});
  h+=_fC("c · Net fixed assets (1a − 1b)",fa+"NetBlock",{ref:"1c"});
  h+=_fN("2 · Investments","funds.bs.ApplicationOfFunds.Investements",{ref:"2",hint:"total investments per the balance sheet"});
  h+=sub("3 · Current assets, loans and advances");
  const ca="funds.bs.ApplicationOfFunds.CurrentAssetsLoanAdv.CurrentAssets.", cce=ca+"CashNCashEquivalents.";
  h+=_fN("a i · Inventories",ca+"Inventory",{ref:"3ai"});
  h+=_fN("a ii · Sundry debtors",ca+"SundryDebtor",{ref:"3aii"});
  h+=row("a iii · Cash and bank balances","",{ref:"3aiii"});
  h+=_fN("A · Balance with banks",cce+"BalWithBanks",{ref:"iiiA",ind:true});
  h+=_fN("B · Cash-in-hand",cce+"CashInHand",{ref:"iiiB",ind:true});
  h+=_fN("C · Others",cce+"Others",{ref:"iiiC",ind:true});
  h+=_fC("D · Total cash and cash equivalents (A+B+C)",cce+"TotCashNCashEquivalents",{ref:"iiiD"});
  h+=_fN("a iv · Other current assets",ca+"OtherCurrAssets",{ref:"3aiv"});
  h+=_fC("a v · Total current assets (i+ii+iiiD+iv)",ca+"TotCurrAssets",{ref:"3av"});
  const cla="funds.bs.ApplicationOfFunds.CurrentAssetsLoanAdv.";
  h+=_fN("b · Loans and advances",cla+"LoansandAdvances",{ref:"3b"});
  h+=_fC("c · Total (av + b)",cla+"Total",{ref:"3c"});
  h+=row("d · Current liabilities and provisions","",{ref:"3d"});
  const cl=cla+"CurrLiabilitiesProviosions.CurrLiability.";
  h+=_fN("i A · Sundry creditors",cl+"SundryCreditor",{ref:"3diA",ind:true});
  h+=_fN("i B · Other payables",cl+"OtherPayable",{ref:"3diB",ind:true});
  h+=_fC("i C · Total (A+B)",cl+"TotalCurrLiabilitiesProviosions",{ref:"3diC"});
  h+=_fN("ii · Provisions",cla+"CurrLiabilitiesProviosions.Provisions",{ref:"3dii"});
  h+=_fC("iii · Total (iC + ii)",cla+"CurrLiabilitiesProviosions.TotCurrLiabilitiesandprovisions",{ref:"3diii"});
  h+=_fC("e · Net current assets (3c − 3diii)",cla+"NetCurrAssets",{ref:"3e"});
  h+=_fN("4 · Accumulated balance / any other reserve (deficit)","funds.bs.ApplicationOfFunds.AccBalAnyOthRes",{ref:"4"});
  h+=_fC("B · Total application of funds (1+2+3e+4)","funds.bs.ApplicationOfFunds.TotalApplicationOfFunds",{ref:"B"});
  h+=_fN("Out of 5 — investment in modes specified u/s 11(5)","funds.bs.ApplicationOfFunds.OutOf5InvModesUS11_5",{ref:"58"});
  h+=_fN("Out of 5 — investment in modes other than u/s 11(5)","funds.bs.ApplicationOfFunds.OutOf5InvModesOthUS11_5",{ref:"59"});
  const C=S.C.funds||{};
  if(C.srcTot||C.appTot)
    h+=note(C.balances?("<b>Balanced.</b> Sources of funds and total application of funds both foot to ₹"+F(C.srcTot)+"."):
      ("<b>Does not balance.</b> Sources of funds ₹"+F(C.srcTot)+" ≠ total application of funds ₹"+F(C.appTot)+"."),
      C.balances?"":"warn");
  return h;
}

function _fJ(){
  let h="";
  h+=note("Statement of the trust's funds and investments as on the last day of the previous year — to be filled by assessees claiming exemption u/s 11 &amp; 12 or u/s 10(23C)(iv)/(v)/(vi)/(via).");
  const T=(S.funds.j||{});
  /* A1 — corpus */
  h+=sub("A1 · Details of corpus");
  h+=grid("funds.j.a1",[
    {h:"Corpus donation",k:"CorpusDonation",t:"sel",opts:J_CORPUS,w:"150px"},
    {h:"Opening (1)",k:"OpeningBlc",t:"num"},
    {h:"Received (2)",k:"ReceivedCorpus",t:"num"},
    {h:"Applied (3)",k:"AppliedPY",t:"num"},
    {h:"Dep. back (4)",k:"AmtDepositedBack",t:"num"},
    {h:"Total dep. back (5)",k:"TotAmtDepositedBack",t:"num"},
    {h:"FY of (4)",k:"FinacialYr",t:"sel",opts:J_FY,w:"110px"},
    {h:"Closing (7)=(1+2+5)−3",k:"ClosingBlc",t:"calc",f:r=>N(r.OpeningBlc)+N(r.ReceivedCorpus)+N(r.TotAmtDepositedBack)-N(r.AppliedPY)},
    {h:"In 11(5) (8)",k:"Investment_11_5",t:"num"},
    {h:"Taxed earlier (9)",k:"AmtTxdAssYr22_23",t:"num"},
    {h:"Other than 11(5) (10)=7−8−9",k:"Investment_11_5_Other",t:"calc",
      f:r=>(N(r.OpeningBlc)+N(r.ReceivedCorpus)+N(r.TotAmtDepositedBack)-N(r.AppliedPY))-N(r.Investment_11_5)-N(r.AmtTxdAssYr22_23)}],
    RG(S,"funds.j.a1",[]),{add:"Add a corpus line",empty:"No corpus line.",min:"1150px"});
  if((T.a1||[]).length){const t=T.a1Tot||{};
    h+=note("TOTAL — opening ₹"+F(t.TotOpeningBlc)+" · received ₹"+F(t.TotReceivedCorpus)+" · applied ₹"+F(t.TotAppliedPY)+" · closing ₹"+F(t.TotClosingBlc)+" · in 11(5) ₹"+F(t.TotInvestment_11_5)+" · other than 11(5) ₹"+F(t.TotInvestment_11_5_Other)+".");}
  /* A2 — loans */
  h+=sub("A2 · Details of loan and borrowings");
  h+=grid("funds.j.a2",[
    {h:"Opening (1)",k:"OpeningBlc",t:"num"},
    {h:"Taken (2)",k:"LoanBorrow",t:"num"},
    {h:"Applied (3)",k:"AppliedPY",t:"num"},
    {h:"Repaid — applied ≥01.04.21 (4)",k:"Repayment",t:"num"},
    {h:"FY of (4)",k:"FinacialYr",t:"sel",opts:J_FY,w:"110px"},
    {h:"Total repaid (6)",k:"TotRepOfLoan",t:"num"},
    {h:"Closing (7)=1+2−6",k:"ClosingBlc",t:"calc",f:r=>N(r.OpeningBlc)+N(r.LoanBorrow)-N(r.TotRepOfLoan)}],
    RG(S,"funds.j.a2",[]),{add:"Add a loan line",empty:"No loan/borrowing line.",min:"820px"});
  if((T.a2||[]).length){const t=T.a2Tot||{};
    h+=note("TOTAL — opening ₹"+F(t.TotOpeningBlc)+" · taken ₹"+F(t.TotLoanBorrow)+" · total repaid ₹"+F(t.TotTotRepOfLoan)+" · closing ₹"+F(t.TotClosingBlc)+".");}
  /* B — 11(5) corpus investments */
  h+=sub("B · Corpus investment/deposits made under section 11(5) as on 31.03.2026");
  h+=grid("funds.j.us11",[
    {h:"Investment out of",k:"InvestementOutOff",t:"sel",opts:J_INVOUT,w:"220px"},
    {h:"Mode of investment (s.11(5))",k:"ModeOfInvestment",t:"sel",opts:J_MODE,req:true,w:"280px"},
    {h:"Amount of investment",k:"AmtOfInvestment",t:"num",req:true}],
    RG(S,"funds.j.us11",[]),{add:"Add an 11(5) investment",empty:"No 11(5) investment.",min:"680px"});
  if((T.us11||[]).length) h+=note("TOTAL amount of investment ₹"+F((T.us11Tot||{}).TotalInvestmentAmt)+".");
  /* C — 13(3) concern investments */
  h+=sub("C · Investment in concern(s) in which s.13(3) / 21st-proviso-10(23C) persons have a substantial interest");
  h+=grid("funds.j.us13",[
    {h:"Name and address of the concern",k:"NameAndAddress",t:"txt",max:300,w:"220px"},
    {h:"Is a company?",k:"ConcernIsCompany",t:"sel",opts:J_YN,w:"110px"},
    {h:"No. of shares (4)",k:"NoOfSharesHeld",t:"num"},
    {h:"Class of shares (5)",k:"ClassOfSharesHeld",t:"txt",max:50,w:"130px"},
    {h:"Value of investment (6)",k:"NominalaValueOfInvestment",t:"num"},
    {h:"Income from investment (7)",k:"IncFromInvestment",t:"num"},
    {h:"(6) > 5% of capital? (8)",k:"PercentOfCapitalConcern",t:"sel",opts:J_YN,w:"120px"}],
    RG(S,"funds.j.us13",[]),{add:"Add a 13(3)-concern investment",empty:"No 13(3)-concern investment.",min:"960px"});
  if((T.us13||[]).length){const t=T.us13Tot||{};
    h+=note("TOTAL — shares "+F(t.TotalNoOfShares)+" · value of investment ₹"+F(t.TotalValueOfInvestment)+" · income ₹"+F(t.TotalIncFromInvestment)+".");}
  /* D — other investments */
  h+=sub("D · Other investments as on the last day of the previous year");
  h+=grid("funds.j.other",[
    {h:"Name and address of the concern",k:"NameAndAddress",t:"txt",max:300,w:"240px"},
    {h:"Is a company?",k:"ConcernIsCompany",t:"sel",opts:J_YN,w:"110px"},
    {h:"Class of shares (4)",k:"ClassOfSharesHeld",t:"txt",max:50,w:"140px"},
    {h:"No. of shares (5)",k:"NoOfSharesHeld",t:"num"},
    {h:"Value of investment (6)",k:"NominalaValueOfInvestment",t:"num"}],
    RG(S,"funds.j.other",[]),{add:"Add an other investment",empty:"No other investment.",min:"760px"});
  if((T.other||[]).length){const t=T.otherTot||{};
    h+=note("TOTAL — shares "+F(t.TotalNoOfShares)+" · value of investment ₹"+F(t.TotalValueOfInvestment)+".");}
  /* E — in-kind voluntary contributions */
  h+=sub("E · Voluntary contributions/donations received in kind, not converted into 11(5) modes in time");
  h+=grid("funds.j.vc",[
    {h:"Name and address of the donor",k:"NameAndAddress",t:"txt",max:300,req:true,w:"240px"},
    {h:"Value of contribution (3)",k:"ValueOfContribution",t:"num"},
    {h:"Applied towards objective (4)",k:"ValueOfContributionObj",t:"num"},
    {h:"Invested in 11(5) modes (5)",k:"AmtInvestedUs11",t:"num"},
    {h:"Balance income u/s 11(3) (6)",k:"BalIncUs11",t:"num"}],
    RG(S,"funds.j.vc",[]),{add:"Add a contribution in kind",empty:"No contribution in kind.",min:"800px"});
  if((T.vc||[]).length){const t=T.vcTot||{};
    h+=note("TOTAL — contribution ₹"+F(t.TotalValueOfContribution)+" · applied ₹"+F(t.TotalValOfContrbnAppdTwrdsObj)+" · in 11(5) ₹"+F(t.TotalAmtInvestedUs11)+" · balance income ₹"+F(t.TotalBalIncUs11)+".");}
  return h;
}

function _fR(){
  const COLS=["CorpOutOf80G2b","OthCorpReceived","CorpOthThan"];
  const HD=["(1) 80G(2)(b) renovation corpus","(2) Other corpus (on/after 01.04.2021)","(3) Corpus other than (1) & (2)"];
  const g=p=>N(get("funds.r."+p));
  let h=note("Line A (closing corpus per Schedule J) is carried automatically from Schedule J block A1, grouped by corpus type. Enter the reasons of difference (B); line C — closing corpus per the Balance sheet — is A + B and must equal the three corpus lines of Part A-BS (1a/1b/1c).");
  h+='<div class="full"><table class="gt"><thead><tr><th class="l">Particulars</th>'+HD.map(x=>'<th>'+esc(x)+'</th>').join("")+'</tr></thead><tbody>';
  const calcRow=(lbl,node)=>{ h+='<tr><td class="l">'+esc(lbl)+'</td>'+COLS.map(c=>'<td class="num">'+cell(g(node+"."+c))+'</td>').join("")+'</tr>'; };
  const inRow=(lbl,node)=>{ h+='<tr><td class="l">'+esc(lbl)+'</td>'+COLS.map(c=>'<td>'+inp("funds.r.ReasonsOfDiff."+node+"."+c,{n:1})+'</td>').join("")+'</tr>'; };
  calcRow("A · Closing balance as on 31.03.2026 per Schedule J","ClosngBalSchJ");
  calcRow("B · Reasons of difference (Bi+Bii+Biii)","ReasonsOfDiff.TotalReasonsOfDiff");
  inRow("(i) Purchase of fixed asset","PurchFixedAsset");
  inRow("(ii) Depreciation","Depreciation");
  inRow("(iii) Any other reason (please specify)","AnyOthReason");
  calcRow("C · Closing balance as on 31.03.2026 per Balance sheet (A+B)","ClosngBalBalSheet");
  h+='</tbody></table></div>';
  return h;
}

/* ================================================================
   EXPORT — writes PARTA_BS (onto the SKEL zero skeleton), and the
   optional ITRScheduleJ / ITRScheduleR blocks when they carry data.
   ================================================================ */
function _fEnum(v,allowed,def){ const t=st0(v); return allowed.indexOf(t)>=0?t:def; }
function _fClean(v){
  if(Array.isArray(v)){ const o=v.map(_fClean).filter(x=>x!==undefined); return o.length?o:undefined; }
  if(v&&typeof v==="object"){ const o={}; for(const k of Object.keys(v)){ const c=_fClean(v[k]); if(c!==undefined)o[k]=c; } return Object.keys(o).length?o:undefined; }
  if(typeof v==="number") return R(v);
  const t=st0(v); return t===""?undefined:t;
}
/* overlay src onto the SKEL subtree dst without ever creating an empty object */
function _fOverlay(dst,src){
  if(!dst||src==null||typeof src!=="object") return;
  for(const k of Object.keys(src)){
    const v=src[k];
    if(Array.isArray(v)){ const r=_fClean(v); if(r) dst[k]=r; }
    else if(v&&typeof v==="object"){ if(_fClean(v)===undefined) continue;
      if(dst[k]==null||typeof dst[k]!=="object"||Array.isArray(dst[k])) dst[k]={};
      _fOverlay(dst[k],v); }
    else if(typeof v==="number") dst[k]=R(v);
    else { const t=st0(v); if(t!=="") dst[k]=t; }
  }
}
/* Schedule J row builders — required integer leaves written even when 0 so a
   filled block covers them; enums validated to their schema codes. */
function _fA1row(r){ if(!r||typeof r!=="object") return undefined;
  const cd=_fEnum(r.CorpusDonation,["80G2B","OTIA","OTHER"],"");
  const money=["OpeningBlc","ReceivedCorpus","AppliedPY","AmtDepositedBack","TotAmtDepositedBack","ClosingBlc","Investment_11_5","AmtTxdAssYr22_23","Investment_11_5_Other"];
  if(cd===""&&!money.some(k=>N(r[k])!==0)) return undefined;
  const o={ CorpusDonation:cd||"OTHER" };
  money.forEach(k=>o[k]=R(N(r[k])));
  const fy=_fEnum(r.FinacialYr,["11","12","13","14","15"],""); if(fy) o.FinacialYr=fy;
  return o; }
function _fA2row(r){ if(!r||typeof r!=="object") return undefined;
  const money=["OpeningBlc","LoanBorrow","AppliedPY","Repayment","TotRepOfLoan","ClosingBlc"];
  if(!money.some(k=>N(r[k])!==0)) return undefined;
  const o={}; money.forEach(k=>o[k]=R(N(r[k])));
  const fy=_fEnum(r.FinacialYr,["11","12","13","14","15"],""); if(fy) o.FinacialYr=fy;
  return o; }
function _fUs11row(r){ if(!r||typeof r!=="object") return undefined;
  const mode=_fEnum(r.ModeOfInvestment,["IGSS","POSB","DSBC","IUTI","CGSG","DEBT","PUSC","FICO","PUCO","LTFU","IMMP","IDBI","POWERGRID","OTHER"],"");
  const amt=R(N(r.AmtOfInvestment));
  if(mode===""&&amt===0) return undefined;
  const o={ ModeOfInvestment:mode||"OTHER", AmtOfInvestment:amt };
  const io=_fEnum(r.InvestementOutOff,["CO80G","COOT","OTHER"],""); if(io) o.InvestementOutOff=io;
  return o; }
function _fUs13row(r){ if(!r||typeof r!=="object") return undefined;
  const nm=st0(r.NameAndAddress), cls=st0(r.ClassOfSharesHeld);
  const money=["NoOfSharesHeld","NominalaValueOfInvestment","IncFromInvestment"];
  if(nm===""&&cls===""&&!money.some(k=>N(r[k])!==0)) return undefined;
  const o={}; if(nm) o.NameAndAddress=nm;
  const co=_fEnum(r.ConcernIsCompany,["Y","N"],""); if(co) o.ConcernIsCompany=co;
  o.NoOfSharesHeld=R(N(r.NoOfSharesHeld)); if(cls) o.ClassOfSharesHeld=cls;
  o.NominalaValueOfInvestment=R(N(r.NominalaValueOfInvestment)); o.IncFromInvestment=R(N(r.IncFromInvestment));
  const pc=_fEnum(r.PercentOfCapitalConcern,["Y","N"],""); if(pc) o.PercentOfCapitalConcern=pc;
  return o; }
function _fOtherRow(r){ if(!r||typeof r!=="object") return undefined;
  const nm=st0(r.NameAndAddress), cls=st0(r.ClassOfSharesHeld);
  const money=["NoOfSharesHeld","NominalaValueOfInvestment"];
  if(nm===""&&cls===""&&!money.some(k=>N(r[k])!==0)) return undefined;
  const o={}; if(nm) o.NameAndAddress=nm;
  const co=_fEnum(r.ConcernIsCompany,["Y","N"],""); if(co) o.ConcernIsCompany=co;
  if(cls) o.ClassOfSharesHeld=cls;
  o.NoOfSharesHeld=R(N(r.NoOfSharesHeld)); o.NominalaValueOfInvestment=R(N(r.NominalaValueOfInvestment));
  return o; }
function _fVcRow(r){ if(!r||typeof r!=="object") return undefined;
  const nm=st0(r.NameAndAddress);
  const money=["ValueOfContribution","ValueOfContributionObj","AmtInvestedUs11","BalIncUs11"];
  if(nm===""&&!money.some(k=>N(r[k])!==0)) return undefined;
  const o={ NameAndAddress:nm||"na" };
  money.forEach(k=>o[k]=R(N(r[k])));
  return o; }
function _fRows(a,fn){ if(!Array.isArray(a)) return []; return a.map(fn).filter(v=>v!==undefined); }
const _fT=o=>{const x={};for(const k of Object.keys(o||{}))x[k]=R(N(o[k]));return x;};

function expFunds(j){
  const Fu=S.funds||{};
  /* ---- PARTA_BS (always filed; overlay onto the SKEL zero skeleton) ---- */
  const bs=deep(Fu.bs||{});
  try{ const orr=RG(bs,"SourcesOfFund.OwnFund.OtherReserve",[]);
    const clean=(Array.isArray(orr)?orr:[]).filter(x=>st0(x&&x.Nature)!=="")
      .map(x=>({Nature:st0(x.Nature),Amount:R(N(x.Amount))}));
    if(clean.length) bs.SourcesOfFund.OwnFund.OtherReserve=clean;
    else delete bs.SourcesOfFund.OwnFund.OtherReserve;
  }catch(e){}
  _fOverlay(j.PARTA_BS, bs);

  /* ---- ITRScheduleJ (optional; A1 & A2 always present when emitted) ---- */
  const a1=_fRows(Fu.j&&Fu.j.a1,_fA1row), a2=_fRows(Fu.j&&Fu.j.a2,_fA2row),
        us11=_fRows(Fu.j&&Fu.j.us11,_fUs11row), us13=_fRows(Fu.j&&Fu.j.us13,_fUs13row),
        oth=_fRows(Fu.j&&Fu.j.other,_fOtherRow), vc=_fRows(Fu.j&&Fu.j.vc,_fVcRow);
  if(a1.length||a2.length||us11.length||us13.length||oth.length||vc.length){
    const blk={};
    const A1=_fT(Fu.j&&Fu.j.a1Tot); if(a1.length) A1.ScheduleJ_A1Dtls=a1; blk.ScheduleJ_A1=A1;
    const A2=_fT(Fu.j&&Fu.j.a2Tot); if(a2.length) A2.ScheduleJ_A2Dtls=a2; blk.ScheduleJ_A2=A2;
    if(us11.length) blk.ScheduleJUs11_5={ ScheduleJUs11_5Dtls:us11, TotalInvestmentAmt:R(N((Fu.j.us11Tot||{}).TotalInvestmentAmt)) };
    if(us13.length){ const t=_fT(Fu.j.us13Tot); t.ScheduleJUs13_3Dtls=us13; blk.ScheduleJUs13_3=t; }
    if(oth.length){ const t=_fT(Fu.j.otherTot); t.ScheduleJOtherInvstmtsDtls=oth; blk.ScheduleJOtherInvstmts=t; }
    if(vc.length){ const t=_fT(Fu.j.vcTot); t.ScheduleJVoluntaryContributionDtls=vc; blk.ScheduleJVoluntaryContribution=t; }
    j.ITRScheduleJ=blk;
  }

  /* ---- ITRScheduleR (optional; only line C is schema-required) ---- */
  const r=Fu.r||{};
  const rBlk={};
  const schJ=_fClean(r.ClosngBalSchJ); if(schJ) rBlk.ClosngBalSchJ=schJ;
  const rod={};
  ["TotalReasonsOfDiff","PurchFixedAsset","Depreciation","AnyOthReason"].forEach(n=>{
    const c=RG(r,"ReasonsOfDiff."+n,null); if(c&&typeof c==="object"){ const cl=_fClean(c); if(cl) rod[n]=cl; }});
  if(Object.keys(rod).length) rBlk.ReasonsOfDiff=rod;
  const cbs=r.ClosngBalBalSheet;
  if(cbs&&typeof cbs==="object"&&["CorpOutOf80G2b","OthCorpReceived","CorpOthThan"].some(c=>N(cbs[c])!==0)){
    rBlk.ClosngBalBalSheet={ CorpOutOf80G2b:R(N(cbs.CorpOutOf80G2b)), OthCorpReceived:R(N(cbs.OthCorpReceived)), CorpOthThan:R(N(cbs.CorpOthThan)) };
  }
  /* emit R only if it carries a reconciliation output or a reason of difference */
  if(rBlk.ClosngBalBalSheet||rBlk.ReasonsOfDiff||rBlk.ClosngBalSchJ) j.ITRScheduleR=rBlk;
}

/* ================================================================
   IMPORT — inverse: pull the three blocks back into S.funds (the
   state subtree equals the schema shape, so a copy round-trips;
   totals are re-derived by the engine on the next compute()).
   ================================================================ */
function impFunds(I){
  const read=[]; if(!I||typeof I!=="object") return read;
  const Fu=S.funds=S.funds||{};
  const bs=I.PARTA_BS;
  if(bs&&typeof bs==="object"){ Fu.bs=deep(bs);
    if(!RG(Fu,"bs.SourcesOfFund.OwnFund.OtherReserve",null)) set("funds.bs.SourcesOfFund.OwnFund.OtherReserve",[]);
    read.push("Part A — Balance Sheet"); }
  const J=I.ITRScheduleJ;
  if(J&&typeof J==="object"){ Fu.j=Fu.j||{};
    Fu.j.a1=RG(J,"ScheduleJ_A1.ScheduleJ_A1Dtls",[])||[];
    Fu.j.a2=RG(J,"ScheduleJ_A2.ScheduleJ_A2Dtls",[])||[];
    Fu.j.us11=RG(J,"ScheduleJUs11_5.ScheduleJUs11_5Dtls",[])||[];
    Fu.j.us13=RG(J,"ScheduleJUs13_3.ScheduleJUs13_3Dtls",[])||[];
    Fu.j.other=RG(J,"ScheduleJOtherInvstmts.ScheduleJOtherInvstmtsDtls",[])||[];
    Fu.j.vc=RG(J,"ScheduleJVoluntaryContribution.ScheduleJVoluntaryContributionDtls",[])||[];
    read.push("Schedule J — funds & investments"); }
  const Rr=I.ITRScheduleR;
  if(Rr&&typeof Rr==="object"){ Fu.r=Fu.r||{ReasonsOfDiff:{}};
    Fu.r.ReasonsOfDiff={
      PurchFixedAsset:RG(Rr,"ReasonsOfDiff.PurchFixedAsset",{})||{},
      Depreciation:RG(Rr,"ReasonsOfDiff.Depreciation",{})||{},
      AnyOthReason:RG(Rr,"ReasonsOfDiff.AnyOthReason",{})||{} };
    read.push("Schedule R — corpus reconciliation"); }
  return read;
}

/* ================================================================
   CHECKS — this section's own screen validations (not the CBDT engine).
   ================================================================ */
function chkFunds(){
  const out=[]; const C=S.C.funds||{}; const add=(lvl,t,m)=>out.push({lvl,t,m,sec:"funds"});
  if(C.srcTot||C.appTot){
    if(!C.balances) add("err","Balance sheet does not balance","Sources of funds (₹"+F(C.srcTot)+") must equal Total application of funds (₹"+F(C.appTot)+").");
    else add("ok","Balance sheet balances","Both halves foot to ₹"+F(C.srcTot)+".");
  }
  if(C.corpusCloseBS&&C.corpus){
    const mis=["c80g","oth","other"].some(k=>R(C.corpusCloseBS[k])!==R(C.corpus[k]));
    if(mis&&(C.corpusCloseBS.total||C.corpus.c80g||C.corpus.oth||C.corpus.other))
      add("warn","Schedule R does not tie to the Balance-Sheet corpus","Closing corpus per Balance sheet (Schedule R line C) should equal the three corpus lines of Part A-BS (1a/1b/1c).");
  }
  return out;
}

/* ---- register (overrides the boot stub for "funds") ------------------- */
reg({id:"funds", t:"Balance sheet, funds & corpus", ref:"Part A-BS · Schedule J · R",
  f:secFunds,
  s:()=>{ const C=S.C.funds||{}; return C.srcTot?(CR(C.srcTot)+(C.balances?"":" ⚠")):""; },
  eng:engFunds, exp:expFunds, imp:impFunds, chk:chkFunds, order:130, corder:20});
