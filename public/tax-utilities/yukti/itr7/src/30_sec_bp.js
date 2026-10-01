/* =====================================================================
   ITR-7 · Section "bp" — Business income (Schedule BP)
   Book: books/ITR-7/Schedule_BP.md  ·  schema block: CorpScheduleBP
   Reference model: forms/ITR-6/src/70_sec_bp.js — but ITR-7's BP is the
   LEANER corporate BP for a trust/institution, so the shape differs:
     - item 1 starts from the *Income and Expenditure account* surplus
       (ProfBfrTaxPL), not a company P&L;
     - the "income considered under other heads" group (item 3) carries
       House property / Capital gains / Other sources (dividend + other)
       and a single 115BBH line (3d = UnderSec115BBH);
     - item 4 is the single Section-44AE profit (PLUs44sChapXIIG) — the
       whole 44B/44BB/…/Ch-XII-G/rule-7-8/115B ladder of ITR-6 is gone;
     - item 21 is ONE key (Total33ABto35ABB) — the twelve 32AC…80-IA
       sub-lines collapse to the single total;
     - NO DPM/DOA/DEP/DCG/ESR/ICDS sub-schedules are owned here (ITR-7's
       section_map maps only CorpScheduleBP to `bp`): item 12i
       (DepreciationAllowUs32_1_ii) is a plain fed input, item 28
       (DebPLUs35ExcessAmt, the ESR excess) and item 32
       (DecProfIncLossAccICDSAdj, the ICDS decrease) are plain inputs;
     - the presumptive block (item 35) shows only Section 44AE;
     - Part C's 35AD(5) drop-down has the thirteen specified-business
       clauses INCLUDING the new (aj) semi-conductor wafer clause; the
       filed value is the clause CODE (schema pattern a|aa|…|aj|ak|b);
     - Part D adds the 115BBH income back: D = A36 + B40 + C46 + A3d.
   Excluded (book §6): the hidden trust-specific "Computation of income
   chargeable to tax under section 11(4)" part (rows 108-110) — it has no
   CorpScheduleBP schema key.

   Publishes for downstream seams (nothing else writes S.C.bp):
     - S.C.bp.total / .income / .d = D  (business-head total, = D48 of
       Schedule BP → Part B-TI item 10ii/7ii "Profits and gains of
       business or profession"; also the aggregate CYLA business figure);
     - S.C.bp.a.A36, S.C.bp.e.* (Table-E after-set-off speculative /
       specified income) for Schedule CYLA rows 1ii/1iii/1iv;
     - S.C.bp.siFeed = { "5BBHi": <item 3d> } — the 115BBH business income
       for Schedule SI (SecCode 5BBHi, enum §3 of the SI book). Part B-TI
       item 14 nets this special-rate income out of the slab base, so the
       full D in .total is not double-taxed.
   Compute order 42 (corder). Screen order 90.
   ===================================================================== */

/* ---- state ---- */
S.bp = S.bp || {
  /* Part A — items 1-6 */
  pbt:0,                 /* 1  Profit before tax as per Income & Expenditure a/c (signed) */
  nplSpec:0,             /* 2a net P/L speculative included in 1 (signed) */
  nplSpecified:0,        /* 2b net P/L specified 35AD included in 1 (signed) */
  a3a:0,a3b:0,           /* 3a House property, 3b Capital gains */
  a3ci:0,a3cii:0,        /* 3c(i) dividend, 3c(ii) other than dividend (3c = ci+cii) */
  a3d:0,                 /* 3d u/s 115BBH (net of cost of acquisition) */
  s44AE:0,               /* 4  profit included in 1 referred to in s.44AE (signed) */
  a5a:0,a5b:0,           /* 5a firm share, 5b AOP/BOI share */
  divExempt:0,           /* 5c fixed Dividend-income row */
  othExempt:[],          /* 5c other exempt rows [{name,amt}] */
  /* Part A — items 7-13 */
  e7a:0,e7b:0,e7c:0,e7d:0,   /* 7a HP, 7b CG, 7c OS, 7d 115BBH (expenses under other heads) */
  depDebPL:0,            /* 11 depreciation & amortization debited to I&E a/c */
  dep32ii:0,            /* 12i  depreciation allowable u/s 32(1)(ii) & (iia) (fed) */
  dep32i:0,             /* 12ii depreciation allowable u/s 32(1)(i) — power sector own comp. */
  /* Part A — items 14-24 (additions) */
  d14:0,d15:0,d16:0,d17:0,d18:0,d19:0,   /* 14 s36, 15 s37, 16 s40, 17 s40A, 18 s43B, 19 s23 MSMED */
  d20:0,                 /* 20 deemed income u/s 41 */
  d21:0,                 /* 21 deemed income 32AC/32AD/33AB/…/72A (single total key) */
  d22:0,                 /* 22 deemed income u/s 43CA */
  d23:0,                 /* 23 any other item of addition u/s 28-44DB */
  d24:0,                 /* 24 any other income not in I&E / expense not allowable */
  /* Part A — items 26-32 (deductions) */
  k26:0,                 /* 26 deduction u/s 32(1)(iii) */
  k27:0,                 /* 27 amount allowable u/s 32AC */
  k28:0,                 /* 28 s35/35CCC/35CCD in excess of amount debited (ESR excess, fed) */
  k29:0,                 /* 29 s40 disallowed earlier, now allowable */
  k30:0,                 /* 30 s43B disallowed earlier, now allowable */
  k31:0,                 /* 31 any other amount allowable as deduction */
  k32:0,                 /* 32 decrease in profit on account of ICDS / stock valuation (fed) */
  /* Part A — item 35 presumptive */
  dp44AE:0,              /* 35i Section 44AE deemed profit */
  /* Part B — speculative */
  specAdd:0,specDed:0,   /* 38 additions, 39 deductions (37 = 2a) */
  /* Part C — specified 35AD */
  spAdd:0,spDed:0,sp35AD:0,   /* 42 additions, 43 deductions, 45 deduction u/s 35AD(1) */
  clause:["",""]         /* 35AD(5) clause drop-down (two rows) */
};

SEED["bp.othExempt"] = SEED["bp.othExempt"] || {name:"",amt:0};

/* ---- the 35AD(5) clause list — [code,label] (book §7.4 + schema pattern
   a|aa|ab|ac|ad|ae|af|ag|ah|ai|aj|ak|b; the filed value is the CODE) ---- */
const BP_35AD5 = [
 ["a","(a) laying and operating a cross-country natural gas pipeline network for distribution, including storage facilities being an integral part of such network"],
 ["aa","(aa) building and operating a new hotel of two-star or above category as classified by the Central Government"],
 ["ab","(ab) building and operating a new hospital with at least one hundred beds for patients"],
 ["ac","(ac) developing and building a housing project under a scheme for slum redevelopment or rehabilitation"],
 ["ad","(ad) developing and building a housing project under a scheme for affordable housing"],
 ["ae","(ae) new plant or newly installed capacity in an existing plant for production of fertilizer"],
 ["af","(af) setting up and operating an inland container depot or a container freight station"],
 ["ag","(ag) bee-keeping and production of honey and beeswax"],
 ["ah","(ah) setting up and operating a warehousing facility for storage of sugar"],
 ["ai","(ai) laying and operating a slurry pipeline for the transportation of iron ore"],
 ["aj","(aj) setting up and operating a semi-conductor wafer fabrication manufacturing unit notified by the Board"],
 ["ak","(ak) developing or operating and maintaining any infrastructure facility"],
 ["b","(b) all other cases not falling under any of the above clauses"]
];

/* =====================================================================
   ENGINE
   ===================================================================== */
function engBp(){
  const B=S.bp||{};
  const nb=k=>N(B[k]), sgb=k=>sg(B[k]);

  /* ================= Part A ================= */
  const K1   = sg(nb("pbt"));                          /* 1 */
  const _2a  = sgb("nplSpec");                         /* 2a */
  const _2b  = sgb("nplSpecified");                    /* 2b */
  const _3c  = R(nb("a3ci")+nb("a3cii"));              /* 3c = 3ci + 3cii */
  const a3d  = R(nb("a3d"));                           /* 3d 115BBH */
  const _4   = sgb("s44AE");                           /* 4  PLUs44sChapXIIG (44AE, signed) */
  const othExemptTot = R((B.othExempt||[]).reduce((a,r)=>a+N(r.amt),0));
  const _5c  = R(nb("divExempt")+othExemptTot);        /* 5c OthExempInc */
  const _5d  = R(nb("a5a")+nb("a5b")+_5c);             /* 5d TotExempInc */
  const _6   = R(K1 - _2a - _2b - nb("a3a") - nb("a3b") - _3c - a3d - _4 - _5d); /* 6 balance (signed) */
  const _9   = R(nb("e7a")+nb("e7b")+nb("e7c")+nb("e7d"));   /* 9 TotExpDebPL */
  const _10  = R(_6 + _9);                             /* 10 AdjustedPL (6 + expenses added back) */
  const _12iii = R(nb("dep32ii")+nb("dep32i"));       /* 12iii TotDeprAllowITAct */
  const _13  = R(_10 + nb("depDebPL") - _12iii);       /* 13 AdjustPLAfterDepr (signed) */
  const addBack = R(nb("d14")+nb("d15")+nb("d16")+nb("d17")+nb("d18")+nb("d19")+
    nb("d20")+nb("d21")+nb("d22")+nb("d23")+nb("d24"));      /* 14…24 */
  const _25  = R(_13 + addBack);                       /* 25 TotAfterAddToPLDeprOthSpecInc (signed) */
  const _33  = R(nb("k26")+nb("k27")+nb("k28")+nb("k29")+nb("k30")+nb("k31")+nb("k32")); /* 33 TotDeductionAmts */
  const _34  = R(_25 - _33);                           /* 34 PLAftAdjDedBusOthThanSpec (signed) */
  const dp44AE = R(nb("dp44AE"));                      /* 35i Section 44AE */
  const _35tot = dp44AE;                               /* 35 TotDeemedProfitBusUs */
  const _36  = R(_34 + _35tot);                        /* 36 NetPLAftAdjBusOthThanSpec (signed) */
  const A36  = _36;                                    /* A36 NetPLBusOthThanSpec7A7B7C (no rule 7A/7B/8 in ITR-7) */

  /* ================= Part B — speculative ================= */
  const _37  = _2a;                                    /* 37 = 2a NetPLFrmSpecBus */
  const _38  = R(nb("specAdd")), _39 = R(nb("specDed"));
  const B40  = R(_37 + _38 - _39);                     /* B40 AdjustedPLFrmSpecuBus (signed) */

  /* ================= Part C — specified 35AD ================= */
  const _41  = _2b;                                    /* 41 = 2b NetPLFrmSpecifiedBus */
  const _42  = R(nb("spAdd")), _43 = R(nb("spDed"));
  const _44  = R(_41 + _42 - _43);                     /* 44 ProfitLossSpecifiedBusiness (signed) */
  const _45  = R(nb("sp35AD"));                        /* 45 DedSec35AD */
  const C46  = R(_44 - _45);                           /* C46 ProfitLossSpecifiedBusFinal (signed) */

  /* ================= Part D ================= */
  const D    = R(A36 + Math.max(0,B40) + Math.max(0,C46) + a3d);  /* D = A36 + B40 + C46 + A3d */

  /* ================= Part E — intra-head set-off ================= */
  const lossSetOff  = Math.abs(Math.min(0, A36));      /* (i) business loss to set off */
  const specInc     = Math.max(0, B40);                /* (ii) speculative income */
  const specifiedInc= Math.max(0, C46);                /* (iii) specified income */
  let rem = lossSetOff;
  const specSet      = Math.min(rem, specInc);      rem -= specSet;
  const specifiedSet = Math.min(rem, specifiedInc); rem -= specifiedSet;
  const totSet    = R(specSet + specifiedSet);         /* (iv) TotLossSetOffOnBus */
  const lossRemain= R(Math.max(0, lossSetOff - totSet)); /* (v) LossRemainSetOffOnBus */

  /* ================= Schedule-SI feed (special-rate BP head) =================
     Only 115BBH (item 3d) is a special-rate business head in ITR-7's BP.
     si.js supplies the 30% rate from its own table; the amount is reused
     from the ladder above and emitted only when positive. */
  const siFeed = {};
  if(a3d>0) siFeed["5BBHi"] = a3d;                     /* 115BBH(i) business income */

  S.C.bp = {
    on:true,
    a:{K1,_2a,_2b,_3c,a3d,_4,_5c,_5d,_6,_9,_10,_12iii,_13,_25,_33,_34,dp44AE,_35tot,_36,A36},
    b:{_37,_38,_39,B40},
    c:{_41,_42,_43,_44,_45,C46},
    d:D,
    e:{lossSetOff,specInc,specifiedInc,specSet,specifiedSet,totSet,lossRemain},
    siFeed:siFeed,     /* special-rate BP heads for Schedule SI (S.C.bp.siFeed) */
    total:D,           /* business-head total for CYLA / Part B-TI (= D48) */
    income:D
  };
}

/* =====================================================================
   RENDERER
   ===================================================================== */
function bpRow(label,right,ref,o){o=o||{};o.ref=ref;return row(label,right,o);}
function bpInpN(p){return inp(p,{n:1});}

function secBp(){
  const A=(S.C.bp&&S.C.bp.a)||{}, Bp=(S.C.bp&&S.C.bp.b)||{}, Cp=(S.C.bp&&S.C.bp.c)||{}, E=(S.C.bp&&S.C.bp.e)||{};
  let h="";
  h+=formNote("Schedule BP turns the surplus of the Income &amp; Expenditure account into taxable business "+
    "income through a long adjustment ladder — head transfers (3, 7), exempt income (5), depreciation (11-13), "+
    "additions (14-24) and deductions (26-32) to business income (34), then presumptive income (35) and the "+
    "Part-A result (A36). Speculative (Part B) and specified 35AD business (Part C) are computed separately, "+
    "and Part D is the head total (A36 + B40 + C46 + A3d). Most rows carry the figures as they appear in the "+
    "accounts, Part A-OI and the depreciation summary; the free entries are the 5c exempt-income table and the "+
    "35AD(5) clause. Every green cell is computed.");

  /* ---- Part A ---- */
  h+=sub("A — Business other than speculative and specified business");
  h+=bpRow("1  Profit before tax as per Income and Expenditure account (as applicable)",bpInpN("bp.pbt"),"A1",{hint:"enter −ve for a deficit"});
  h+=bpRow("2a  Net profit/loss from speculative business included in 1",bpInpN("bp.nplSpec"),"A2a",{hint:"enter −ve for a loss"});
  h+=bpRow("2b  Net profit/loss from specified business u/s 35AD included in 1",bpInpN("bp.nplSpecified"),"A2b",{hint:"enter −ve for a loss"});
  h+=sub("3 — Income/receipts credited to I&E account considered under other heads / chargeable u/s 115BBH");
  h+=bpRow("3a  House property",bpInpN("bp.a3a"),"A3a",{ind:1});
  h+=bpRow("3b  Capital Gains",bpInpN("bp.a3b"),"A3b",{ind:1});
  h+=bpRow("3c(i)  Dividend income",bpInpN("bp.a3ci"),"A3ci",{ind:1});
  h+=bpRow("3c(ii)  Other than dividend income",bpInpN("bp.a3cii"),"A3cii",{ind:1});
  h+=bpRow("3c  Other sources (3c(i) + 3c(ii))",cell(A._3c),"A3c",{ind:1});
  h+=bpRow("3d  u/s 115BBH (net of cost of acquisition, if any)",bpInpN("bp.a3d"),"A3d",{ind:1});
  h+=bpRow("4  Profit or loss included in 1 which is referred to in section 44AE",bpInpN("bp.s44AE"),"A4",{hint:"enter −ve for a loss"});
  h+=sub("5 — Income credited to I&E account (included in 1) which is exempt");
  h+=bpRow("5a  Share of income from firm(s)",bpInpN("bp.a5a"),"A5a",{ind:1});
  h+=bpRow("5b  Share of income from AOP/BOI",bpInpN("bp.a5b"),"A5b",{ind:1});
  h+=bpRow("5c  Dividend income (exempt)",bpInpN("bp.divExempt"),"A5c",{ind:1});
  h+=grid("bp.othExempt",[{k:"name",h:"Nature of other exempt income",t:"txt",w:"60%"},{k:"amt",h:"Amount",t:"num",w:"30%"}],
    (S.bp&&S.bp.othExempt)||[],{empty:"No other exempt income.",add:"Add exempt income"});
  h+=bpRow("5c  Total exempt income credited (dividend + other)",cell(A._5c),"A5cTot",{ind:1});
  h+=bpRow("5d  Total exempt income (5a + 5b + 5c)",cell(A._5d),"A5d");
  h+=bpRow("6  Balance (1 − 2a − 2b − 3a − 3b − 3c − 3d − 4 − 5d)",cell(A._6),"A6");
  h+=sub("7 — Expenses debited to I&E account considered under other heads / related to 115BBH");
  h+=bpRow("7a  House property",bpInpN("bp.e7a"),"A7a",{ind:1});
  h+=bpRow("7b  Capital Gains",bpInpN("bp.e7b"),"A7b",{ind:1});
  h+=bpRow("7c  Other sources",bpInpN("bp.e7c"),"A7c",{ind:1});
  h+=bpRow("7d  u/s 115BBH (other than cost of acquisition)",bpInpN("bp.e7d"),"A7d",{ind:1});
  h+=bpRow("9  Total (7a + 7b + 7c + 7d)",cell(A._9),"A9");
  h+=bpRow("10  Adjusted profit or loss (6 + 8)",cell(A._10),"A10");
  h+=bpRow("11  Depreciation and amortization debited to I&E account",bpInpN("bp.depDebPL"),"A11");
  h+=bpRow("12i  Depreciation allowable u/s 32(1)(ii) & 32(1)(iia)",bpInpN("bp.dep32ii"),"A12i",{ind:1,hint:"from the depreciation summary"});
  h+=bpRow("12ii  Depreciation allowable u/s 32(1)(i) (own computation, Appendix-IA; power sector)",bpInpN("bp.dep32i"),"A12ii",{ind:1});
  h+=bpRow("12iii  Total (12i + 12ii)",cell(A._12iii),"A12iii");
  h+=bpRow("13  Profit/loss after adjustment for depreciation (10 + 11 − 12iii)",cell(A._13),"A13");
  h+=sub("14–24 — Amounts to be added back");
  [["d14","14 disallowable u/s 36"],["d15","15 disallowable u/s 37"],["d16","16 disallowable u/s 40"],
   ["d17","17 disallowable u/s 40A"],["d18","18 disallowable u/s 43B (of the previous year)"],
   ["d19","19 interest disallowable u/s 23 of the MSMED Act, 2006"],["d20","20 deemed income u/s 41"],
   ["d21","21 deemed income u/s 32AC/32AD/33AB/33ABA/35ABA/35ABB/35AC/40A(3A)/33AC/72A"],
   ["d22","22 deemed income u/s 43CA"],["d23","23 any other item of addition u/s 28 to 44DB"],
   ["d24","24 any other income not in I&E account / any other expense not allowable"]].forEach(x=>
     h+=bpRow(x[1],bpInpN("bp."+x[0]),"",{ind:1}));
  h+=bpRow("25  Total (13 + 14 … 24)",cell(A._25),"A25");
  h+=sub("26–32 — Amounts to be deducted");
  [["k26","26 deduction allowable u/s 32(1)(iii)"],["k27","27 amount allowable as deduction u/s 32AC"],
   ["k28","28 deduction u/s 35/35CCC/35CCD in excess of the amount debited to I&E account"],
   ["k29","29 s.40 disallowed in an earlier year, now allowable"],
   ["k30","30 s.43B disallowed in an earlier year, now allowable"],
   ["k31","31 any other amount allowable as deduction"],
   ["k32","32 decrease in profit on account of ICDS adjustments / deviation in stock valuation"]].forEach(x=>
     h+=bpRow(x[1],bpInpN("bp."+x[0]),"",{ind:1}));
  h+=bpRow("33  Total (26 … 32)",cell(A._33),"A33");
  h+=bpRow("34  Income (25 − 33)",cell(A._34),"A34");
  h+=sub("35 — Profits and gains deemed to be under presumptive section");
  h+=bpRow("35i  Section 44AE",bpInpN("bp.dp44AE"),"A35i",{ind:1});
  h+=bpRow("35  Total deemed profit",cell(A._35tot),"A35");
  h+=bpRow("36  Net profit/loss other than speculative and specified business (34 + 35)",cell(A._36),"A36pre");
  h+=bpRow("A36  Net profit/loss after applying rule 7A/7B/8, if applicable",cell(A.A36),"A36",{hint:"if loss → 2i of Schedule CYLA / CFL"});

  /* ---- Part B ---- */
  h+=sub("B — Speculative business");
  h+=bpRow("37  Net profit/loss from speculative business as per I&E account (item 2a)",cell(Bp._37),"B37");
  h+=bpRow("38  Additions in accordance with section 28 to 44DB",bpInpN("bp.specAdd"),"B38");
  h+=bpRow("39  Deductions in accordance with section 28 to 44DB",bpInpN("bp.specDed"),"B39");
  h+=bpRow("B40  Income from speculative business (37 + 38 − 39)",cell(Bp.B40),"B40",{hint:"if loss → Schedule CFL speculative line"});

  /* ---- Part C ---- */
  h+=sub("C — Specified business under section 35AD");
  h+=bpRow("41  Net profit/loss from specified business as per I&E account (item 2b)",cell(Cp._41),"C41");
  h+=bpRow("42  Additions in accordance with section 28 to 44DB",bpInpN("bp.spAdd"),"C42");
  h+=bpRow("43  Deductions u/s 28 to 44DB (other than 35AD / 32 or 35 on which 35AD is claimed)",bpInpN("bp.spDed"),"C43");
  h+=bpRow("44  Profit/loss from specified business (41 + 42 − 43)",cell(Cp._44),"C44");
  h+=bpRow("45  Deductions in accordance with section 35AD(1)",bpInpN("bp.sp35AD"),"C45");
  h+=bpRow("C46  Income from specified business (44 − 45)",cell(Cp.C46),"C46",{hint:"if loss → Schedule CFL specified line"});
  h+=bpRow("Relevant clause of s.35AD(5) (row 1)",sel("bp.clause.0",BP_35AD5),"35AD(5)");
  h+=bpRow("Relevant clause of s.35AD(5) (row 2)",sel("bp.clause.1",BP_35AD5),"35AD(5)");

  /* ---- Part D & E ---- */
  h+=sub("D & E — Chargeable income and intra-head set off");
  h+=bpRow("D  Income chargeable under 'Profits and gains from Business or profession' (A36 + B40 + C46 + A3d)",cell(S.C.bp?S.C.bp.d:0),"D");
  h+=bpRow("E(i)  Business loss of the current year to be set off",cell(E.lossSetOff),"E i");
  h+=bpRow("E(ii)  Income from speculative business",cell(E.specInc),"E ii",{v2:cell(E.specSet)});
  h+=bpRow("E(iii)  Income from specified business",cell(E.specifiedInc),"E iii",{v2:cell(E.specifiedSet)});
  h+=bpRow("E(iv)  Total loss set off (ii + iii)",cell(E.totSet),"E iv");
  h+=bpRow("E(v)  Loss remaining after set off (i − iv)",cell(E.lossRemain),"E v");
  h+=note("Include the income of the specified persons referred to in Schedule SPI while computing income under this head. "+
    "The 115BBH business income (item 3d) is carried to Schedule SI at the 30% rate; Part B-TI nets it out of the slab base.");
  return h;
}

/* =====================================================================
   EXPORT — writes block CorpScheduleBP
   ===================================================================== */
function expBp(j){
  const A=(S.C.bp&&S.C.bp.a)||{}, Bp=(S.C.bp&&S.C.bp.b)||{}, Cp=(S.C.bp&&S.C.bp.c)||{}, E=(S.C.bp&&S.C.bp.e)||{};
  const B=S.bp||{};
  const P="CorpScheduleBP.BusinessIncOthThanSpec.";

  /* ---- Part A: items 1-6 ---- */
  put(j,P+"ProfBfrTaxPL",sg(A.K1));
  put(j,P+"NetPLFromSpecBus",sg(A._2a));
  put(j,P+"NetProfLossSpecifiedBus",sg(A._2b));
  put(j,P+"IncRecCredPLOthHeadDtls.HouseProperty",n0(B.a3a));
  put(j,P+"IncRecCredPLOthHeadDtls.CapitalGains",n0(B.a3b));
  put(j,P+"IncRecCredPLOthHeadDtls.OtherSources",n0(A._3c));
  put(j,P+"IncRecCredPLOthHeadDtls.Dividend",n0(B.a3ci));
  put(j,P+"IncRecCredPLOthHeadDtls.OtherThanDividend",n0(B.a3cii));
  put(j,P+"IncRecCredPLOthHeadDtls.UnderSec115BBH",n0(B.a3d));
  put(j,P+"PLUs44sChapXIIG",sg(A._4));
  put(j,P+"IncCredPL.FirmShareInc",n0(B.a5a));
  put(j,P+"IncCredPL.AOPBOISharInc",n0(B.a5b));
  /* 5c OtherExmptIncDtl: fixed Dividend row (required leaves) + free rows */
  const oth=(B.othExempt||[]).filter(r=>N(r.amt)||st0(r.name))
    .map(r=>({OperatingRevenueName:sv(r.name),OperatingRevenueAmt:n0(r.amt)}));
  const oed={OperatingDividendName:"Dividend",OperatingDividendAmt:n0(B.divExempt)};
  if(oth.length)oed.OtherExmptIncDtls=oth;
  put(j,P+"IncCredPL.OtherExmptIncDtl",oed);
  put(j,P+"IncCredPL.OthExempInc",n0(A._5c));
  put(j,P+"IncCredPL.TotExempInc",n0(A._5d));
  put(j,P+"BalancePLOthThanSpecBus",sg(A._6));
  /* ---- Part A: items 7-13 ---- */
  put(j,P+"ExpDebToPLOthHeadsInc.HouseProperty",n0(B.e7a));
  put(j,P+"ExpDebToPLOthHeadsInc.CapitalGains",n0(B.e7b));
  put(j,P+"ExpDebToPLOthHeadsInc.OtherSources",n0(B.e7c));
  put(j,P+"ExpDebToPLOthHeadsInc.UnderSec115BBH",n0(B.e7d));
  put(j,P+"TotExpDebPL",n0(A._9));
  put(j,P+"AdjustedPLOthThanSpecBus",sg(A._10));
  put(j,P+"DepreciationDebPLCosAct",n0(B.depDebPL));
  put(j,P+"DepreciationAllowITAct32.DepreciationAllowUs32_1_ii",n0(B.dep32ii));
  put(j,P+"DepreciationAllowITAct32.DepreciationAllowUs32_1_i",n0(B.dep32i));
  put(j,P+"DepreciationAllowITAct32.TotDeprAllowITAct",n0(A._12iii));
  put(j,P+"AdjustPLAfterDeprOthSpecInc",sg(A._13));
  /* ---- Part A: items 14-24 (additions) ---- */
  put(j,P+"AmtDebPLDisallowUs36",n0(B.d14));
  put(j,P+"AmtDebPLDisallowUs37",n0(B.d15));
  put(j,P+"AmtDebPLDisallowUs40",n0(B.d16));
  put(j,P+"AmtDebPLDisallowUs40A",n0(B.d17));
  put(j,P+"AmtDebPLDisallowUs43B",n0(B.d18));
  put(j,P+"InterestDisAllowUs23SMEAct",n0(B.d19));
  put(j,P+"DeemIncUs41",n0(B.d20));
  put(j,P+"Total33ABto35ABB",n0(B.d21));
  put(j,P+"DeemIncUs43CA",n0(B.d22));
  put(j,P+"OthItemDisallowUs28To44DA",n0(B.d23));
  put(j,P+"AnyOthIncNotInclInExpDisallowPL",n0(B.d24));
  put(j,P+"TotAfterAddToPLDeprOthSpecInc",sg(A._25));
  /* ---- Part A: items 26-34 (deductions, income) ---- */
  put(j,P+"DeductUs32_1_iii",n0(B.k26));
  put(j,P+"Amt32AC",n0(B.k27));
  put(j,P+"DebPLUs35ExcessAmt",n0(B.k28));
  put(j,P+"AmtDisallUs40NowAllow",n0(B.k29));
  put(j,P+"AmtDisallUs43BNowAllow",n0(B.k30));
  put(j,P+"AnyOthAmtAllDeduct",n0(B.k31));
  put(j,P+"DecProfIncLossAccICDSAdj",n0(B.k32));
  put(j,P+"TotDeductionAmts",n0(A._33));
  put(j,P+"PLAftAdjDedBusOthThanSpec",sg(A._34));
  /* ---- Part A: item 35 presumptive, 36, A36 ---- */
  put(j,P+"DeemedProfitBusUs.Section44AE",n0(B.dp44AE));
  put(j,P+"DeemedProfitBusUs.TotDeemedProfitBusUs",n0(A._35tot));
  put(j,P+"NetPLAftAdjBusOthThanSpec",sg(A._36));
  put(j,P+"NetPLBusOthThanSpec7A7B7C",sg(A.A36));

  /* ---- Part B ---- */
  const SB="CorpScheduleBP.SpecBusinessInc.";
  put(j,SB+"NetPLFrmSpecBus",sg(Bp._37));
  put(j,SB+"AdditionUs28to44DA",n0(B.specAdd));
  put(j,SB+"DeductUs28to44DA",n0(B.specDed));
  put(j,SB+"AdjustedPLFrmSpecuBus",sg(Bp.B40));

  /* ---- Part C ---- */
  const SC="CorpScheduleBP.IncSpecifiedBusiness.";
  put(j,SC+"NetPLFrmSpecifiedBus",sg(Cp._41));
  put(j,SC+"AddSec28to44DA",n0(B.spAdd));
  put(j,SC+"DedSec28to44DAOTDedSec35AD",n0(B.spDed));
  put(j,SC+"ProfitLossSpecifiedBusiness",sg(Cp._44));
  put(j,SC+"DedSec35AD",n0(B.sp35AD));
  put(j,SC+"ProfitLossSpecifiedBusFinal",sg(Cp.C46));
  const clauses=(B.clause||[]).filter(c=>st0(c)).map(c=>({DedUs35ADSubSec5:st0(c)}));
  if(clauses.length)put(j,SC+"DedUs35ADSubSec5Dtls",clauses);

  /* ---- Part D ---- */
  put(j,"CorpScheduleBP.IncChrgUnHdProftGain",sg(S.C.bp?S.C.bp.d:0));

  /* ---- Part E ---- */
  const BE="CorpScheduleBP.BusSetoffCurrYr.";
  put(j,BE+"LossSetOffOnBusLoss",n0(E.lossSetOff));
  if(E.specInc){
    put(j,BE+"SpeculativeInc.IncOfCurYrUnderThatHead",n0(E.specInc));
    put(j,BE+"SpeculativeInc.BusLossSetoff",n0(E.specSet));
    put(j,BE+"SpeculativeInc.IncOfCurYrAfterSetOff",n0(E.specInc-E.specSet));
  }
  if(E.specifiedInc){
    put(j,BE+"SpecifiedInc.IncOfCurYrUnderThatHead",n0(E.specifiedInc));
    put(j,BE+"SpecifiedInc.BusLossSetoff",n0(E.specifiedSet));
    put(j,BE+"SpecifiedInc.IncOfCurYrAfterSetOff",n0(E.specifiedInc-E.specifiedSet));
  }
  put(j,BE+"TotLossSetOffOnBus",n0(E.totSet));
  put(j,BE+"LossRemainSetOffOnBus",n0(E.lossRemain));
}

/* =====================================================================
   IMPORT — inverse of export (schema -> S.bp)
   ===================================================================== */
function impBp(I7){
  const got=[];
  const bp=I7&&I7.CorpScheduleBP;
  if(!bp)return got;
  const A=bp.BusinessIncOthThanSpec||{};
  S.bp.pbt=N(A.ProfBfrTaxPL); S.bp.nplSpec=N(A.NetPLFromSpecBus); S.bp.nplSpecified=N(A.NetProfLossSpecifiedBus);
  const ir=A.IncRecCredPLOthHeadDtls||{};
  S.bp.a3a=N(ir.HouseProperty);S.bp.a3b=N(ir.CapitalGains);
  S.bp.a3ci=N(ir.Dividend);S.bp.a3cii=N(ir.OtherThanDividend);S.bp.a3d=N(ir.UnderSec115BBH);
  S.bp.s44AE=N(A.PLUs44sChapXIIG);
  const ic=A.IncCredPL||{}, od=ic.OtherExmptIncDtl||{};
  S.bp.a5a=N(ic.FirmShareInc);S.bp.a5b=N(ic.AOPBOISharInc);S.bp.divExempt=N(od.OperatingDividendAmt);
  S.bp.othExempt=(od.OtherExmptIncDtls||[]).map(r=>({name:r.OperatingRevenueName||"",amt:N(r.OperatingRevenueAmt)}));
  const ed=A.ExpDebToPLOthHeadsInc||{};
  S.bp.e7a=N(ed.HouseProperty);S.bp.e7b=N(ed.CapitalGains);S.bp.e7c=N(ed.OtherSources);S.bp.e7d=N(ed.UnderSec115BBH);
  S.bp.depDebPL=N(A.DepreciationDebPLCosAct);
  const da=A.DepreciationAllowITAct32||{};
  S.bp.dep32ii=N(da.DepreciationAllowUs32_1_ii);S.bp.dep32i=N(da.DepreciationAllowUs32_1_i);
  S.bp.d14=N(A.AmtDebPLDisallowUs36);S.bp.d15=N(A.AmtDebPLDisallowUs37);S.bp.d16=N(A.AmtDebPLDisallowUs40);
  S.bp.d17=N(A.AmtDebPLDisallowUs40A);S.bp.d18=N(A.AmtDebPLDisallowUs43B);S.bp.d19=N(A.InterestDisAllowUs23SMEAct);
  S.bp.d20=N(A.DeemIncUs41);S.bp.d21=N(A.Total33ABto35ABB);S.bp.d22=N(A.DeemIncUs43CA);
  S.bp.d23=N(A.OthItemDisallowUs28To44DA);S.bp.d24=N(A.AnyOthIncNotInclInExpDisallowPL);
  S.bp.k26=N(A.DeductUs32_1_iii);S.bp.k27=N(A.Amt32AC);S.bp.k28=N(A.DebPLUs35ExcessAmt);
  S.bp.k29=N(A.AmtDisallUs40NowAllow);S.bp.k30=N(A.AmtDisallUs43BNowAllow);
  S.bp.k31=N(A.AnyOthAmtAllDeduct);S.bp.k32=N(A.DecProfIncLossAccICDSAdj);
  S.bp.dp44AE=N((A.DeemedProfitBusUs||{}).Section44AE);
  const sb=bp.SpecBusinessInc||{};
  S.bp.specAdd=N(sb.AdditionUs28to44DA);S.bp.specDed=N(sb.DeductUs28to44DA);
  const sc=bp.IncSpecifiedBusiness||{};
  S.bp.spAdd=N(sc.AddSec28to44DA);S.bp.spDed=N(sc.DedSec28to44DAOTDedSec35AD);S.bp.sp35AD=N(sc.DedSec35AD);
  S.bp.clause=(sc.DedUs35ADSubSec5Dtls||[]).map(c=>c.DedUs35ADSubSec5||"");
  if(S.bp.clause.length<2)S.bp.clause=S.bp.clause.concat(["",""]).slice(0,2);
  got.push("Schedule BP");
  return got;
}

/* =====================================================================
   CHECKS — this section's own screen validations (not the dept rules)
   ===================================================================== */
function chkBp(){
  const out=[];
  const B=S.bp||{};
  /* 12ii power-sector depreciation */
  if(N(B.dep32i))
    out.push({lvl:"warn",t:"Verify 32(1)(i) depreciation",m:"Depreciation u/s 32(1)(i) (12ii) is allowable only for a power-sector business.",sec:"bp"});
  /* 5c other-exempt nature special characters (nonEmptyString leaves reject < > &) */
  if((B.othExempt||[]).some(r=>/[<>&]/.test(st0(r.name))))
    out.push({lvl:"err",t:"Invalid character in 5c nature",m:"The nature of exempt income at 5c cannot contain < > or &.",sec:"bp"});
  /* 35AD(5) clause not selected twice */
  const cl=(B.clause||[]).filter(c=>st0(c));
  if(cl.length===2 && cl[0]===cl[1])
    out.push({lvl:"err",t:"Duplicate 35AD(5) clause",m:"The same clause of sub-section (5) of section 35AD cannot be selected more than once.",sec:"bp"});
  /* a 35AD deduction (item 45) without a clause selected */
  if(N(B.sp35AD) && !cl.length)
    out.push({lvl:"warn",t:"35AD(5) clause missing",m:"A deduction u/s 35AD(1) is claimed but no clause of section 35AD(5) is selected.",sec:"bp"});
  /* income summary */
  if(S.C.bp){
    const d=N(S.C.bp.income);
    if(d<0)out.push({lvl:"ok",t:"Business loss",m:RS(-d)+" goes to Schedule CYLA / CFL for set off.",sec:"bp"});
    else if(d>0)out.push({lvl:"ok",t:"Business income",m:RS(d)+" chargeable under Profits and gains from Business or profession.",sec:"bp"});
  }
  return out;
}

/* ---- register (overrides the boot stub) ---- */
reg({id:"bp", t:"Business income", ref:"Schedule BP",
  f:secBp, s:()=>{const d=S.C.bp?N(S.C.bp.income):0;return d<0?"Loss "+CR(-d):(d?"Income "+CR(d):"");},
  eng:engBp, exp:expBp, imp:impBp, chk:chkBp, order:90, corder:42});
