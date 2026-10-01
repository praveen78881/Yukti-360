/* =====================================================================
   ITR-6 · Section "mat" — Minimum Alternate Tax (company)
   Schedules MAT (s.115JB book-profit MAT) + MATC (s.115JAA credit),
   built strictly from books/ITR-6/MAT.md and books/ITR-6/MATC.md
   (never ITR-3/ITR-5 numbers — those forms carry AMT s.115JC, not MAT).
   Self-contained: state seed, engMat, secMat, expMat, impMat, chkMat and
   one reg() at the bottom, overriding the Phase-4 boot stub for "mat".

   ITR-6 is the COMPANY return. Where ITR-3/ITR-5 compute AMT off *adjusted
   total income* (s.115JC/AMTC s.115JD), ITR-6 computes MAT off **book
   profit** (s.115JB) with a fixed add-back / deduction list, and MAT credit
   under s.115JAA (MATC). Applicability (books MAT §1 / MATC §1):
     · only a DOMESTIC company fills MAT/MATC (rule 685);
     · the whole schedule is NIL if the company opts for the concessional
       regime under section 115BAA or 115BAB (rule 674 / 683);
     · the MAT tax line is nil where book profit (deemed TI) <= 0.
   This build's client is a domestic company on the normal regime, so MAT
   applies. The concessional-regime and domestic-company gates are read
   defensively (Part A-General is owned by other builders) — see _matConc /
   _matDomestic; they default to "normal regime, domestic" so the section
   never throws and computes MAT for this client.

   Rate split (book MAT §1/§9): 9% on the IFSC slice (item 9a), 15% on the
   rest (item 9b). Surcharge and cess are applied in Part B-TTI by the tax
   section, not here.

   Compute model (books MAT §12 / MATC §9 — the FIX-WAVE-6A seam contract):
   this engine PUBLISHES, computed from Schedule MAT / book profit ALONE (it
   does NOT depend on the tax section):
     S.C.mat.deemedTI  (item 9)  -> Part B-TI (rule 745), via the tax section.
     S.C.mat.tax1d               -> Part B-TTI item 1d = MAT (item 10) +
                 surcharge + 4% cess (rule 774). This single figure feeds both
                 Schedule MATC item 1 AND the tax section's higher-of test at
                 Part B-TTI 3 (rule 768: gross = higher of 2f and 1d), so the
                 two share one source. (S.C.mat.tax = item 10 before surcharge/
                 cess is kept for Part B-TTI 1a, rule 771.)
     S.C.matc.* (the Schedule MATC figures: item 1/2/3, the year rows,
                 credit = item 5, carryFwd = item 6).
   and CONSUMES, for the MATC head (seam keys — never tax.mat1d/normal2f that
   do not exist):
     MATC item 1 <- S.C.mat.tax1d  (this section's own 1d, computed above).
     MATC item 2 <- S.C.tax.normal2f (published by engTax = Part B-TTI 2f, the
                 normal gross tax incl. surcharge+cess); 0 until the tax section
                 has run (pass 1). The compute() fixpoint (mat corder 70 < tax
                 corder ~90) makes MATC converge on the real 2f by pass 2.
   The credit SET-OFF for Part B-TTI point 4 is NOT computed here — the tax
   section derives it from S.C.mat.tax1d and S.C.tax.normal2f (contract); this
   section only publishes the Schedule MATC figures. It OWNS only ScheduleMAT /
   ScheduleMATC — it writes no Part B block (the tax section owns those).
   ===================================================================== */

/* ---- field metadata (labels, sheet cells, schema keys — from the books) -- */

/* Item 5 — Additions if debited to P&L (book MAT §4). All non-negative;
   schema block Additions.*; total Additions.TotAdditions (rule 669). */
const MAT_ADD=[
 ["a","F9","Income-tax paid or payable or its provision including the amount of deferred tax and the provision thereof","ITPaidInclDefTax"],
 ["b","F10","Reserve (except reserve under section 33AC)","ResvrNo33AC"],
 ["c","F11","Provisions for unascertained liability","ProvUncertainLiab"],
 ["d","F12","Provisions for losses of subsidiary companies","ProvLossOfSubsComp"],
 ["e","F13","Dividend paid or proposed","DividendPaidOrProposed"],
 ["f","F14","Expenditure related to exempt income under sections 10, 11 or 12 [exempt income excludes income exempt under section 10(38)]","ExpendExempIncUs10s"],
 ["g","F15","Expenditure related to share in income of AOP/BOI on which no income-tax is payable as per section 86","ExpAopBoi"],
 ["h","F16","Expenditure in case of foreign company referred to in clause (fb) of explanation 1 to section 115JB","ExpClauseFb"],
 ["i","F17","Notional loss on transfer of certain capital assets or units referred to in clause (fc) of explanation 1 to section 115JB","NotLossClauseFc"],
 ["j","F18","Expenditure relatable to income by way of royalty in respect of patent chargeable to tax u/s 115BBF","NotLossUs115bbf"],
 ["k","F19","Depreciation attributable to revaluation of assets","DepreciatAttribToRevalAsset"],
 ["l","F20","Gain on transfer of units referred to in clause (k) of explanation 1 to section 115JB","GainClauseK"],
 ["m","F21","Others (including residual unadjusted items and provision for diminution in the value of any asset)","Others"]];

/* Item 6 — Deductions (book MAT §5). All non-negative; schema block Deducts.*;
   total Deducts.TotDeducts (rule 670). 6h key LossTrnsClauseiig backs the
   ROYALTY(iig) line by POSITION — schema name is stale (book §11 obs 1). */
const MAT_DED=[
 ["a","F24","Amount withdrawn from reserve or provisions if credited to statement of profit and loss","AmtWithdrawFromResvrIfCredPL"],
 ["b","F25","Income exempt under sections 10, 11 or 12 [exempt income excludes income exempt under section 10(38)]","IncExempIncUs10s"],
 ["c","F26","Amount withdrawn from revaluation reserve and credited to P&L to the extent it does not exceed the depreciation attributable to revaluation of asset","AmtWithdrawFromResvrIfCredPLNoAttrib"],
 ["d","F27","Share in income of AOP/BOI on which no income-tax is payable as per section 86 credited to statement of profit and loss","ShareIncAopBoi"],
 ["e","F28","Income in case of foreign company referred to in clause (iid) of explanation 1 to section 115JB","IncClauseiid"],
 ["f","F29","Notional gain on transfer of certain capital assets or units referred to in clause (iie) of explanation 1 to section 115JB","NotGainClauseiie"],
 ["g","F30","Loss on transfer of units referred to in clause (iif) of explanation 1 to section 115JB","LossTrnsClauseiif"],
 ["h","F31","Income by way of royalty referred to in clause (iig) of explanation 1 to section 115JB","LossTrnsClauseiig"],
 ["i","F32","Loss brought forward or unabsorbed depreciation whichever is less or both as may be applicable","UnAbsorbedDepreciat"],
 ["j","F33","Profit of sick industrial company till net worth is equal to or exceeds accumulated losses","ProSickIndustryOrExcedAccumLos"],
 ["k","F34","Others (including residual unadjusted items and the amount of deferred tax credited to P&L A/c)","Others"]];

/* Item 8A — Ind-AS additions (book MAT §7). Keys match labels here (8Aa
   credited, 8Ab debited). Total AdditionsProfUs115JB.TotalAdditions (rule 672). */
const MAT_8A=[
 ["a","F39","Amounts credited to other comprehensive income in P&L under the head “items that will not be reclassified to profit & loss”","AmountsCredited"],
 ["b","F40","Amounts debited to the statement of profit & loss on distribution of non-cash assets to shareholders in a demerger","AmountsDebited"],
 ["c","F41","One fifth of the transition amount as referred to in section 115JB (2C) (if applicable)","OneFifthTransitionAmt"],
 ["d","F42","Others (including residual adjustment)","OthersInclResidualAdjust"]];

/* Item 8B — Ind-AS deductions (book MAT §7). Keys are SWAPPED vs labels
   (book §11 obs 2): map by POSITION — 8f -> AmountsCredited,
   8g -> AmountsDebited. Deductions total is keyed DeductionsProfUs115JB.
   TotalAdditions ("Additions"), schema names it so (book §11 obs 4).
   Total = 8f+8g+8h+8i (rule 673); the utility H49 sums 8h twice and omits
   8i (book §11 obs 3) — the engine sums 8i, not 8h twice. */
const MAT_8B=[
 ["f","F45","Amounts debited to other comprehensive income in P&L under the head “items that will not be reclassified to profit & loss”","AmountsCredited"],
 ["g","F46","Amounts credited to the statement of profit & loss on distribution of non-cash assets to shareholders in a demerger","AmountsDebited"],
 ["h","F47","One fifth of the transition amount as referred to in section 115JB (2C) (if applicable)","OneFifthTransitionAmt"],
 ["i","F48","Others (including residual adjustment)","OthersInclResidualAdjust"]];

/* MATC — the fifteen carry-forward assessment years (book MATC §3);
   2009-10/2010-11 are hidden (outside the 15-yr window) and NOT built. */
const MATC_AYS=["2011-12","2012-13","2013-14","2014-15","2015-16","2016-17",
  "2017-18","2018-19","2019-20","2020-21","2021-22","2022-23","2023-24",
  "2024-25","2025-26"];
const MATC_CURAY="2026-27";
const MATC_ROMAN=["i","ii","iii","iv","v","vi","vii","viii","ix","x","xi",
  "xii","xiii","xiv","xv"];

/* ---- state seed (this section owns S.mat; MATC lives under S.mat.matc) --- */
S.mat = S.mat || {};
if(!S.mat._seeded){
  S.mat.q1  = S.mat.q1  || "";   /* PLAcntPrepSchedVICompAct (1/2) */
  S.mat.q2  = S.mat.q2  || "";   /* PLAcctFlg (1/2, optional) */
  S.mat.q3  = S.mat.q3  || "";   /* PLAcntPrepAsperAGM (1/2) */
  S.mat.pat = (S.mat.pat==null?"":S.mat.pat);  /* item 4 ProfAfterTaxPLAcnt (signed) */
  S.mat.add = S.mat.add || {};   /* 5a..5m */
  S.mat.ded = S.mat.ded || {};   /* 6a..6k */
  S.mat.indas = S.mat.indas || "";           /* FinancialStamentFlag (Y/N) */
  S.mat.a8  = S.mat.a8  || {};    /* 8Aa..8Ad */
  S.mat.b8  = S.mat.b8  || {};    /* 8f..8i */
  S.mat.ifsc = (S.mat.ifsc==null?"":S.mat.ifsc);  /* item 9a IFSC slice */
  S.mat.matc = S.mat.matc || {};
  if(!(S.mat.matc.rows&&S.mat.matc.rows.length===MATC_AYS.length))
    S.mat.matc.rows = MATC_AYS.map(ay=>({ay:ay, gross:"", setoff:""}));
  S.mat._seeded = 1;
}

/* ---- applicability gates (read Part A-General defensively) --------------- */
/* Domestic company? (rule 685). S.pi.domestic is seeded "Y"; other builders
   may also stamp S.who. Default to domestic so MAT computes for this client. */
function _matDomestic(){
  const v=st0((S.pi&&S.pi.domestic)!=null?S.pi.domestic:"Y").toUpperCase();
  if(v==="N"||v==="FOREIGN"||v==="F") return false;
  const w=(S.who||{});
  const wv=st0(w.domestic||w.domesticFlg||w.DomesticCompFlg||"").toUpperCase();
  if(wv==="N"||wv==="FOREIGN"||wv==="F") return false;
  return true;
}
/* Opted concessional regime 115BAA / 115BAB? (rule 674/683 -> schedule nil).
   Read a published scalar first, then Part A-General state (owned by who/gen);
   defaults to false = normal regime (correct for this build). */
function _matConc(){
  const t=(S.C&&S.C.tax)||{};
  let s=st0(t.conc115||t.regime115||t.regimeSec||t.sec115||"");
  if(!s){
    const w=(S.who||{}), g=(S.gen||{});
    s=[w.sec115,w.section115,w.Section115BA,w.regime,w.sec115cur,w.Section115CurrAY,
       g.sec115,g.Section115BA].map(st0).join(" ");
  }
  return /115BA[AB]/.test(s);
}

/* Surcharge on the MAT (Tax.md §4 / MAT.md §9), tiered on the deemed total
   income (item 9) with marginal relief; MAT rate 15% at the cut-off income.
   Self-contained so S.C.mat.tax1d is computed from book profit alone (the seam
   contract forbids depending on the tax section); it mirrors taxMatSurcharge in
   70_sec_tax.js so the two agree to the rupee. MAT is a domestic-company charge
   (rule 685), so the domestic tiers (7% >1cr / 12% >10cr) apply; the foreign
   tiers (2%/5%) are kept only for completeness. Returns the surcharge amount. */
function _matSurcharge(deemedTI, matTax, domestic){
  const rate = deemedTI>100000000?(domestic?0.12:0.05)
             : deemedTI>10000000 ?(domestic?0.07:0.02):0;
  let sur=R(matTax*rate);
  if(rate>0){
    const th   = deemedTI>100000000?100000000:10000000;
    const lower= deemedTI>100000000?(domestic?0.07:0.02):0;   /* surcharge of the tier below */
    const matTaxAtTh=R(th*0.15), surAtTh=R(matTaxAtTh*lower);
    const mr=Math.max(0,(matTax+sur)-(matTaxAtTh+surAtTh)-(deemedTI-th));
    sur=Math.max(0,sur-mr);
  }
  return R(sur);
}

/* ---- engine ------------------------------------------------------------- */
/* Computes MAT (items 4..10) then MATC (items 1..6), publishing S.C.mat and
   S.C.matc. All cross-reads guarded; never throws on empty state. */
function engMat(){
  const domestic=_matDomestic(), conc=_matConc();

  /* ===== Schedule MAT ============================================== */
  const item4 = sg(S.mat.pat);                          /* may be negative */
  const tot5  = MAT_ADD.reduce((a,x)=>a+n0(get("mat.add."+x[0])),0);
  const tot6  = MAT_DED.reduce((a,x)=>a+n0(get("mat.ded."+x[0])),0);
  const book7 = R(item4 + tot5 - tot6);                 /* 7 = 4 + 5n - 6l */
  const tot8e = Math.max(0, MAT_8A.reduce((a,x)=>a+n0(get("mat.a8."+x[0])),0));
  /* 8Bj = max(0, 8f+8g+8h+8i) — sums 8i (the utility's H49 bug corrected) */
  const tot8j = Math.max(0, MAT_8B.reduce((a,x)=>a+n0(get("mat.b8."+x[0])),0));
  const item9 = conc ? 0 : R(book7 + tot8e - tot8j);    /* 9 = 7 + 8e - 8j; 0 under 115BAA/BAB */
  const ifsc9a= conc ? 0 : Math.min(Math.max(0,item9), n0(S.mat.ifsc));  /* 9a in [0, item9] */
  const item9b= R(item9 - ifsc9a);                      /* 9b = 9 - 9a */
  const tax10 = (conc||item9<=0) ? 0
              : Math.max(0, R(0.09*ifsc9a + 0.15*item9b));  /* 9%*9a + 15%*9b */

  /* Part B-TTI 1d (rule 774) = MAT (item 10) + surcharge (1b) + 4% cess (1c),
     computed here from book profit alone. This is the seam figure the tax
     section reads for the higher-of test (rule 768) and that MATC item 1 uses. */
  const mat1b = (conc||item9<=0) ? 0 : _matSurcharge(item9, tax10, domestic);
  const mat1c = (conc||item9<=0) ? 0 : R((tax10 + mat1b)*0.04);
  const tax1d = (conc||item9<=0) ? 0 : R(tax10 + mat1b + mat1c);

  const matContent = item4!==0 || tot5>0 || tot6>0 || tot8e>0 || tot8j>0 ||
    st0(S.mat.q1) || st0(S.mat.q3) || n0(S.mat.ifsc)>0;

  S.C.mat={
    on: domestic && !conc && !!matContent,
    domestic, conc,
    item4, tot5:R(tot5), tot6:R(tot6), book7,
    tot8e:R(tot8e), tot8j:R(tot8j),
    item9, ifsc9a:R(ifsc9a), item9b, tax10,
    deemedTI:item9,      /* -> Part B-TI (rule 745), via the tax section */
    tax:tax10,           /* -> Part B-TTI 1a (rule 771), via the tax section */
    sur1b:mat1b, cess1c:mat1c,
    tax1d};              /* -> Part B-TTI 1d (rule 774) & Schedule MATC item 1 */

  /* ===== Schedule MATC ============================================= */
  const tax=(S.C&&S.C.tax)||{};
  /* item 1 (MATC §2, rule 677) <- Part B-TTI 1d = this section's own tax1d
     (MAT + surcharge + cess), computed above from book profit alone. */
  const td1d = tax1d;
  /* item 2 (MATC §2, rule 678) <- Part B-TTI 2f = S.C.tax.normal2f, published
     by engTax (normal gross tax incl. surcharge+cess); 0 until it has run. */
  const tf2f = tax.normal2f!=null ? N(tax.normal2f) : 0;
  /* relief net-off for the current-year gross (book MATC §3, G27): 2f IS the
     gross tax liability under normal provisions, so grossLiab = item 2. */
  const grossLiab = tf2f;
  const relief = tax.totRelief!=null ? Math.max(0, N(tax.totRelief)-N(grossLiab)) : 0;

  const item1 = R(td1d), item2 = R(tf2f);
  const item3 = conc ? 0 : Math.max(0, item2 - item1);   /* MAX(0, 2 - 1) */

  const rows=(S.mat.matc.rows||[]).map(r=>{
    const b1=n0(r.gross), b2=n0(r.setoff), b3=Math.max(0,b1-b2);
    return {ay:r.ay, b1, b2, b3, c:0, d:0};
  });
  const sumB3=rows.reduce((a,r)=>a+r.b3,0);
  /* column C: set off OLDEST year first, total capped at item 3 and at Σ B3 */
  let pool = conc ? 0 : Math.min(item3, sumB3);
  rows.forEach(r=>{ const u=Math.min(pool, r.b3); r.c=u; pool-=u;
    r.d = conc ? 0 : Math.max(0, r.b3 - r.c); });

  /* current-year row 2026-27: gross = MAX(0, 1 - 2 - relief); no set-off in
     the year it arises, so its D = its own gross */
  const g27 = conc ? 0 : Math.max(0, item1 - item2 - relief);
  const k27 = conc ? 0 : g27;

  const totGross = rows.reduce((a,r)=>a+r.b1,0) + g27;    /* Σ G12:G27 */
  const totSetoff= rows.reduce((a,r)=>a+r.b2,0);
  const totBF    = rows.reduce((a,r)=>a+r.b3,0);
  const totUtil  = rows.reduce((a,r)=>a+r.c,0);           /* item 5 */
  const totCF    = rows.reduce((a,r)=>a+r.d,0) + k27;     /* item 6 (Σ K12:K27) */

  const matcContent = sumB3>0 || g27>0 || totSetoff>0;

  S.C.matc={
    on: domestic && !conc && !!matcContent,
    domestic, conc,
    item1, item2, item3,
    rows, g27:R(g27), k27:R(k27),
    totGross:R(totGross), totSetoff:R(totSetoff), totBF:R(totBF),
    totUtil:R(totUtil), totCF:R(totCF),
    credit:R(totUtil),     /* item 5 -> Part B-TTI point 4 (rule 772) */
    carryFwd:R(totCF)};    /* item 6 -> future years */
}

/* =====================================================================
   RENDERER
   ===================================================================== */
function secMat(){
  const G=S.C.mat||{}, M=S.C.matc||{}; let h="";
  const domestic=_matDomestic(), conc=_matConc();
  const YESNO=[["Y","Yes"],["N","No"]];
  const ONETWO=[["1","1 - Yes"],["2","2 - No"]];
  /* labelled numeric-input row */
  const ir=(path,ref,label,req)=>row(label, inp(path,{n:1}), {ref:ref, req:req, ind:1});
  /* computed (green) row */
  const cr=(label,ref,val,cls)=>row(label, cell(val), {ref:ref, cls:cls});

  h+='<div class="cgband">Schedule MAT — Minimum Alternate Tax payable under section 115JB</div>';
  if(!domestic)
    h+=note("Schedule MAT applies only to a <b>domestic company</b> (rule 685). This company is not marked domestic in Part A-General, so MAT is not computed.","warn");
  else if(conc)
    h+=note("The company has opted for the concessional regime under section <b>115BAA / 115BAB</b>, so it is not liable to MAT under section 115JB (rule 674). Every figure below is held at zero.","warn");
  else
    h+=note("MAT is charged at <b>15%</b> of book profit, and a concessional <b>9%</b> on the portion of book profit from units located in an IFSC (item 9a). Surcharge and cess are added in Part B-TTI.");

  /* --- items 1-3: the three opening questions --- */
  h+=sub("Preparation of the statement of profit and loss");
  h+=row("1 · Is the P&L prepared in accordance with Parts II of Schedule III to the Companies Act, 2013?",
    sel("mat.q1",ONETWO),{ref:"E4"});
  if(S.mat.q1==="2")
    h+=row("2 · If 1 is no, is the P&L prepared in accordance with the Act governing such company?",
      sel("mat.q2",ONETWO),{ref:"E5"});
  h+=row("3 · Are the same accounting policies, standards and depreciation method/rates followed as for the accounts laid before the AGM?",
    sel("mat.q3",ONETWO),{ref:"E6"});

  /* --- item 4 --- */
  h+=sub("4 · Profit after tax");
  h+=row("4 · Profit after tax as shown in the statement of profit and loss (item 56 of Part A-P&L / Part A-P&L Ind AS)",
    inp("mat.pat",{n:1}),{ref:"E7",req:1,hint:"enter Sl. No. 56 of Part A-P&L; may be negative"});

  /* --- item 5 additions --- */
  h+=sub("5 · Additions (if debited to the statement of profit and loss)");
  MAT_ADD.forEach((x,i)=>{ h+=ir("mat.add."+x[0], x[1], "5"+x[0]+" · "+x[2]); });
  h+=cr("5n · Total additions (5a to 5m)","J22",G.tot5||0,"tot");

  /* --- item 6 deductions --- */
  h+=sub("6 · Deductions");
  MAT_DED.forEach((x,i)=>{ h+=ir("mat.ded."+x[0], x[1], "6"+x[0]+" · "+x[2]); });
  h+=cr("6l · Total deductions (6a to 6k)","H35",G.tot6||0,"tot");

  /* --- item 7 book profit --- */
  h+=cr("7 · Book profit under section 115JB (4 + 5n − 6l)","E36",G.book7||0,"grand");

  /* --- item 8 Ind-AS adjustments --- */
  h+=sub("8 · Ind-AS adjustments (sub-sections 2A to 2C of section 115JB)");
  h+=row("Are the financial statements drawn up in compliance with Ind-AS (Companies (Indian Accounting Standards) Rules, 2015)?",
    sel("mat.indas",YESNO),{ref:"E37"});
  h+='<div class="cgband">8A · Additions to book profit under sub-sections (2A) to (2C)</div>';
  MAT_8A.forEach(x=>{ h+=ir("mat.a8."+x[0], x[1], "8A"+x[0]+" · "+x[2]); });
  h+=cr("8Ae · Total additions (8Aa to 8Ad)","H43",G.tot8e||0,"tot");
  h+='<div class="cgband">8B · Deductions from book profit under sub-sections (2A) to (2C)</div>';
  MAT_8B.forEach(x=>{ h+=ir("mat.b8."+x[0], x[1], "8"+x[0]+" · "+x[2]); });
  h+=cr("8Bj · Total deductions (8f + 8g + 8h + 8i)","H49",G.tot8j||0,"tot");
  h+=note("The total at 8Bj sums 8f + 8g + 8h + 8i per rule 673. (The department utility's H49 formula sums 8h twice and omits 8i; this form uses the correct four terms.)");

  /* --- item 9 deemed total income --- */
  h+=sub("9 · Deemed total income under section 115JB");
  h+=cr("9 · Deemed total income under section 115JB (7 + 8Ae − 8Bj)","E50",G.item9||0,"grand");
  h+=row("9a · Deemed total income from units located in an IFSC (taxed @ 9%)",
    inp("mat.ifsc",{n:1}),{ref:"E51",ind:1,hint:"the portion of item 9 from IFSC units"});
  h+=cr("9b · Deemed total income from other units (9 − 9a; taxed @ 15%)","E52",G.item9b||0);

  /* --- item 10 tax --- */
  h+=cr("10 · Tax payable under section 115JB [9% of 9a + 15% of 9b]","E53",G.tax10||0,"grand");
  if((G.tax10||0)>0)
    h+=note("This MAT of "+RS(G.tax10)+" feeds Part B-TTI point 1a; with surcharge and cess it becomes 1d, which the higher-of test (Part B-TTI point 3) weighs against the normal tax (rule 768).");

  /* ===== Schedule MATC ============================================= */
  h+='<div class="cgband">Schedule MATC — Computation of tax credit under section 115JAA</div>';
  h+=note("MAT paid above the normal tax becomes a credit, carried forward up to fifteen assessment years and set off in a later year when the normal tax exceeds that year's MAT.");
  h+=cr("1 · Tax under section 115JB in A.Y. 2026-27 (1d of Part B-TTI)","E4",M.item1||0);
  h+=cr("2 · Tax under other provisions in A.Y. 2026-27 (2f of Part B-TTI)","E5",M.item2||0);
  h+=cr("3 · Amount of tax against which credit is available [(2 − 1) if 2 > 1, else 0]","E6",M.item3||0,"tot");

  h+=sub("4 · Utilisation of MAT credit available");
  h+=note("The credit utilised this year (column C) is set off oldest year first, capped at item 3 above and at the total credit brought forward.");
  h+='<div class="full"><table class="gt" style="min-width:860px"><thead><tr>'+
     '<th class="l" style="width:44px">S.No</th>'+
     '<th class="l" style="min-width:96px">Assessment Year (A)</th>'+
     '<th style="width:120px">Gross (B1)</th>'+
     '<th style="width:150px">Set-off in earlier years (B2)</th>'+
     '<th style="width:140px">Balance b/f (B3 = B1−B2)</th>'+
     '<th style="width:140px">Utilised this year (C)</th>'+
     '<th style="width:150px">Balance c/f (D = B3−C)</th></tr></thead><tbody>';
  const rows=(M.rows||[]);
  rows.forEach((r,i)=>{ h+='<tr><td class="l">'+MATC_ROMAN[i]+'</td><td class="l">'+esc(r.ay)+'</td>'+
    '<td>'+inp("mat.matc.rows."+i+".gross",{n:1})+'</td>'+
    '<td>'+inp("mat.matc.rows."+i+".setoff",{n:1})+'</td>'+
    '<td class="num">'+cell(r.b3)+'</td><td class="num">'+cell(r.c)+'</td>'+
    '<td class="num">'+cell(r.d)+'</td></tr>'; });
  h+='<tr><td class="l">xvi</td><td class="l">'+MATC_CURAY+' (current)</td>'+
    '<td class="num">'+cell(M.g27||0)+'</td><td class="num">—</td><td class="num">—</td>'+
    '<td class="num">—</td><td class="num">'+cell(M.k27||0)+'</td></tr>';
  h+='</tbody><tfoot><tr><td class="l" colspan="2">xvii · Total</td>'+
    '<td>'+F(M.totGross||0)+'</td><td>'+F(M.totSetoff||0)+'</td><td>'+F(M.totBF||0)+'</td>'+
    '<td>'+F(M.totUtil||0)+'</td><td>'+F(M.totCF||0)+'</td></tr></tfoot></table></div>';

  h+=cr("5 · Amount of tax credit under section 115JAA utilised during the year [4(C) xvii]","E29",M.credit||0,"tot");
  h+=cr("6 · MAT liability available for credit in subsequent assessment years [4(D) xvii]","E30",M.carryFwd||0,"tot");
  if((M.credit||0)>0)
    h+=note("This "+RS(M.credit)+" of MAT credit is set off against the tax at Part B-TTI point 4 (rule 772).");
  return h;
}

/* =====================================================================
   EXPORT — ScheduleMAT / ScheduleMATC (this section's own blocks only)
   ===================================================================== */
function expMat(j){
  const G=S.C.mat||{}, M=S.C.matc||{};

  /* ===== ScheduleMAT ===== */
  if(G.on){
    const mat={};
    put(mat,"PLAcntPrepSchedVICompAct", sv(S.mat.q1));
    put(mat,"PLAcctFlg", sv(S.mat.q2));                 /* schema-optional */
    put(mat,"PLAcntPrepAsperAGM", sv(S.mat.q3));
    put(mat,"ProfAfterTaxPLAcnt", sg(G.item4));         /* signed, required */
    /* item 5 additions + total */
    MAT_ADD.forEach(x=>put(mat,"Additions."+x[3], n0(get("mat.add."+x[0]))));
    put(mat,"Additions.TotAdditions", n0(G.tot5));
    /* item 6 deductions + total (6h royalty by position) */
    MAT_DED.forEach(x=>put(mat,"Deducts."+x[3], n0(get("mat.ded."+x[0]))));
    put(mat,"Deducts.TotDeducts", n0(G.tot6));
    /* item 7 */
    put(mat,"BookProfUs115JB", sg(G.book7));
    /* item 8 Ind-AS flag + 8A + 8B */
    put(mat,"FinancialStamentFlag", sv(S.mat.indas));   /* schema-optional */
    MAT_8A.forEach(x=>put(mat,"AdditionsProfUs115JB."+x[3], n0(get("mat.a8."+x[0]))));
    put(mat,"AdditionsProfUs115JB.TotalAdditions", n0(G.tot8e));
    MAT_8B.forEach(x=>put(mat,"DeductionsProfUs115JB."+x[3], n0(get("mat.b8."+x[0]))));
    put(mat,"DeductionsProfUs115JB.TotalAdditions", n0(G.tot8j));  /* deductions total keyed "TotalAdditions" */
    /* item 9 / 9a / 9b / 10 */
    put(mat,"DeemedTotalIncUs115JB", sg(G.item9));
    put(mat,"DeemedTotalIncUs115JBIFSC", n0(G.ifsc9a));
    put(mat,"DeemedTotalIncUs115JBOther", sg(G.item9b));
    put(mat,"TaxPayableUs115JB", n0(G.tax10));
    j.ScheduleMAT=mat;
  }

  /* ===== ScheduleMATC ===== */
  if(M.on){
    const mc={};
    put(mc,"TaxUs115JBCurrAssYr", n0(M.item1));
    put(mc,"TaxOthProvCurrAssYr", n0(M.item2));
    put(mc,"AmtOfTaxWithCred", n0(M.item3));
    /* the fifteen year rows (only those with a gross or set-off figure) */
    const arr=[];
    (M.rows||[]).forEach(r=>{ if(r.b1>0||r.b2>0) arr.push({
      AssYr:r.ay,
      MATCredGross:n0(r.b1),
      MATCredSetOff:n0(r.b2),
      MATCredBF:n0(r.b3),
      MATCredUtilCurrYr:n0(r.c),
      BalMATCredCF:n0(r.d)}); });
    if(arr.length) mc.UtilMATCredAvl=arr;
    /* current-year row */
    put(mc,"CurAssYr", MATC_CURAY);
    put(mc,"MATCredGrossCurAY", n0(M.g27));
    put(mc,"BalMATCredCFCurAY", n0(M.k27));
    /* totals (row xvii) */
    put(mc,"TotMatCredGross", n0(M.totGross));
    put(mc,"TotMatCredSetOff", n0(M.totSetoff));
    put(mc,"TotMatCredBF", n0(M.totBF));
    put(mc,"TotMatCredUtilCurrYr", n0(M.totUtil));
    put(mc,"TotBalMATCredCF", n0(M.totCF));
    /* items 5 / 6 */
    put(mc,"AmtTaxCredUs115JAA", n0(M.credit));
    put(mc,"AmtMATLiabAllAssYrAvailSubseqYr", n0(M.carryFwd));
    j.ScheduleMATC=mc;
  }
}

/* =====================================================================
   IMPORT — the inverse (schema -> S.mat); round-trip is identity because
   only the typed inputs are read back and the engine re-derives the totals.
   ===================================================================== */
function impMat(I6){
  const read=[];
  const m=I6.ScheduleMAT, c=I6.ScheduleMATC;

  if(m){
    S.mat.q1 = m.PLAcntPrepSchedVICompAct||"";
    S.mat.q2 = m.PLAcctFlg||"";
    S.mat.q3 = m.PLAcntPrepAsperAGM||"";
    S.mat.pat = nz(m.ProfAfterTaxPLAcnt);
    const A=m.Additions||{}; MAT_ADD.forEach(x=>{ S.mat.add[x[0]]=nz(A[x[3]]); });
    const D=m.Deducts||{};   MAT_DED.forEach(x=>{ S.mat.ded[x[0]]=nz(D[x[3]]); });
    S.mat.indas = m.FinancialStamentFlag||"";
    const AA=m.AdditionsProfUs115JB||{}; MAT_8A.forEach(x=>{ S.mat.a8[x[0]]=nz(AA[x[3]]); });
    const BB=m.DeductionsProfUs115JB||{}; MAT_8B.forEach(x=>{ S.mat.b8[x[0]]=nz(BB[x[3]]); });
    S.mat.ifsc = nz(m.DeemedTotalIncUs115JBIFSC);
    read.push("Schedule MAT (s.115JB book-profit MAT)");
  }

  if(c){
    const byAY={};
    (Array.isArray(c.UtilMATCredAvl)?c.UtilMATCredAvl:[]).forEach(r=>{ if(r&&r.AssYr) byAY[r.AssYr]=r; });
    S.mat.matc.rows = MATC_AYS.map(ay=>{ const r=byAY[ay]||{};
      return {ay:ay, gross:nz(r.MATCredGross), setoff:nz(r.MATCredSetOff)}; });
    read.push("Schedule MATC (s.115JAA MAT credit)");
  }
  return read;
}

/* =====================================================================
   CHECKS — this section's own screen validations (not the department rules)
   ===================================================================== */
function chkMat(){
  const out=[]; const G=S.C.mat||{}, M=S.C.matc||{};
  const add=(lvl,t,m)=>out.push({lvl,t,m,sec:"mat"});
  const domestic=_matDomestic(), conc=_matConc();

  if(!domestic || conc) return out;   /* MAT/MATC inert — nothing to validate */

  if(G.on){
    /* the mandatory opening flags */
    if(!st0(S.mat.q1))
      add("err","MAT item 1 unanswered","State whether the P&L is prepared per Parts II of Schedule III to the Companies Act, 2013.");
    if(S.mat.q1==="2"&&!st0(S.mat.q2))
      add("warn","MAT item 2 unanswered","Item 1 is “no”, so state whether the P&L is prepared per the Act governing the company.");
    if(!st0(S.mat.q3))
      add("err","MAT item 3 unanswered","State whether the same accounting policies/standards and depreciation method were followed as for the AGM accounts.");
    /* item 4 should equal Part A-P&L Sl. No. 56 (rule 676 — enforced in Phase 6) */
    if(N(S.mat.pat)===0)
      add("warn","MAT item 4 is zero","Profit after tax (item 4) is zero — it should equal Sl. No. 56 of Part A-P&L / Part A-P&L Ind AS.");
    /* 9a IFSC must not exceed item 9 */
    if(n0(S.mat.ifsc) > Math.max(0,G.item9)+0)
      add("err","IFSC deemed income too high","The IFSC portion (item 9a, ₹"+F(n0(S.mat.ifsc))+") cannot exceed the deemed total income at item 9 (₹"+F(Math.max(0,G.item9))+").");
    if((G.book7||0)>0 && (G.tax10||0)>0)
      add("ok","MAT computed","Book profit ₹"+F(G.book7)+", MAT ₹"+F(G.tax10)+" (before surcharge and cess).");
    else if((G.book7||0)<=0)
      add("ok","No MAT","Book profit is not positive, so the MAT under section 115JB is nil.");
  }

  if(M.on){
    /* rule 773 in spirit: credit is not usable in a year MAT is the higher tax */
    if((M.item1||0) > (M.item2||0) && (M.credit||0)>0)
      add("warn","MAT credit not set off this year","The MAT (item 1, ₹"+F(M.item1)+") exceeds the normal tax (item 2, ₹"+F(M.item2)+"), so no credit can be set off this year; any brought-forward credit carries forward.");
    /* set-off cannot exceed the headroom (item 3) — engine caps it, so warn only if data implies a claim beyond it */
    if((M.credit||0) > (M.item3||0)+1)
      add("err","MAT credit exceeds headroom","The credit utilised (₹"+F(M.credit)+") cannot exceed the amount of tax against which credit is available (item 3, ₹"+F(M.item3)+").");
    if((M.credit||0)>0)
      add("ok","MAT credit set off","₹"+F(M.credit)+" of MAT credit set off against the tax; ₹"+F(M.carryFwd)+" carried to subsequent years.");
  }
  return out;
}

/* ---- register (overrides the boot stub for "mat") ----------------------- */
reg({id:"mat", t:"MAT — section 115JB", ref:"MAT · MATC",
  f:secMat,
  s:()=>{const G=S.C.mat||{}, M=S.C.matc||{};
    return (G.tax10?RS(G.tax10)+" MAT":"")+((G.tax10&&M.credit)?" · ":"")+(M.credit?RS(M.credit)+" credit":"");},
  eng:engMat, exp:expMat, imp:impMat, chk:chkMat, order:60, corder:70});
