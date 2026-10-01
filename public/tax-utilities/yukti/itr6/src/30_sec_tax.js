/* =====================================================================
   ITR-6 · Section "tax" (order 90) — Part B roll-up (the COMPANY return).
   Books: books/ITR-6/PARTB_TI_TTI.md, Tax.md (the hidden computation
          sheet), MAT.md / MATC.md (the 115JB / 115JAA interplay), SI.md,
          CYLA_BFLA.md / CFL.md, VIA.md, rules.json (716-745, 755-784).
   Schema blocks OWNED here: "PartB-TI" (hyphen) + "PartB_TTI" (underscore),
          and the hidden "Tax" computation-method sheet (read, not filed).
   NOT owned here (the `bank` section owns them, per phase-4 notes):
          PartB_TTI.Refund.* (BankDtlsFlag, AddtnlBankDetails[],
          ForeignBankDetails[], RefundDue) and AssetOutsideIndiaFlg —
          those are sourced from this sheet's rows 91-121 by `bank`, which
          reads the refund figure this engine publishes as S.C.int.refund.

   This is the Part B roll-up: it reads every income head via S.C.<head>,
   aggregates to Gross Total Income (item 9 = 7 − 8, INCLUDING special-rate
   income — the ITR-5 GTI bug was dropping it; loss totals come from
   S.C.loss.cylaTotal / bflaTotal), subtracts Chapter VI-A and 10AA
   (S.C.ded, each capped at 9 − item14), rounds Total Income to the nearest
   ten, then computes the CORPORATE tax: the 25/30/22/15 % domestic ladder
   (35 % foreign) with the 115BAA eligibility gate, company surcharge
   (7/12 % domestic, 2/5 % foreign) with marginal relief, a flat 25 %
   surcharge on 115BBE income, cess at 4 %, the MAT (115JB) interplay
   (gross tax = higher of normal 2f and MAT 1d, read as S.C.mat.tax1d),
   MAT credit (115JAA, computed here from S.C.matc.totBF, only when 2f > 1d),
   tax relief (Schedule TR),
   and 234A/234B/234C interest + 234F/234-I fees. It SETS the footer
   contract S.C.{gti, ti, tax, int}. There is NO salary head (Part B-TI
   opens at house property, item 1), NO basic exemption, NO 87A rebate,
   NO section 89 — this is a company.
   Rule 2 (CLAUDE.md): every figure/formula is ITR-6's own (Tax / PARTB
   sheets); nothing is ported from ITR-3. Every cross-read is guarded.
   ===================================================================== */

/* ---- state (my namespace S.tax — only my own typed inputs live here) ---- */
S.tax = S.tax || {};

/* ---- guarded multi-path state getter (returns the first non-empty) ---- */
function taxGet(){ for(var i=0;i<arguments.length;i++){var o=S,ok=true;
  var ks=String(arguments[i]).split("."); for(var j=0;j<ks.length;j++){ if(o==null){ok=false;break;} o=o[ks[j]]; }
  if(ok&&o!=null&&o!=="")return o; } return undefined; }

/* ---- resolve the Part A-General tax drivers (guarded — a company return) ----
   These are user inputs OWNED by the who/gen sections (PartA_GEN1.FilingStatus
   / OrgFirmInfo). The Tax sheet only reads them (Tax.md §1):
   - DomesticCompFlg  → Status_Dom_Foreign (MID(...,1,1)="Y" domestic)
   - Section115BA / Section115CurrAY → Check_115BA (115BA/115BAA/115BAB/"")
   - GrossReceipt (>400cr FY23-24?) → _Per25 (MID(...,1,1)="N" → small co. 25%)
   Consumed (in order) from computed publishes then raw state; the CEO wires
   the seam if the who/gen field names differ. Default: domestic, no option,
   turnover unknown → 30 % (the ELSE branch of the ladder). */
function taxDrivers(){
  var domVal = taxGet("C.who.domestic","C.gen.domestic","who.domestic","who.domesticFlg",
    "gen.domestic","pi.domestic");
  var domestic = (domVal==null) ? true                           /* default: a domestic company */
    : (typeof domVal==="boolean") ? domVal                       /* engWho publishes S.C.who.domestic as a BOOLEAN (who.js:84) */
    : st0(domVal).charAt(0).toUpperCase()==="Y";                 /* tolerate a raw "Y"/"N" input */
  /* the concessional regime is resolved by engWho and republished as
     S.C.who.regime115 ("" | 115BA | 115BAA | 115BAB); fall back to the raw
     filing-status input S.fs.s115 ("NA" | 115BA | 115BAA | 115BAB) when the
     who engine has not published yet (D-F1). */
  var secRaw = st0(taxGet("C.who.regime115","fs.s115")||"");
  var s = secRaw.replace(/[^0-9A-Za-z]/g,"").toUpperCase();
  var sec = /115BAB/.test(s)?"115BAB": /115BAA/.test(s)?"115BAA": /115BA/.test(s)?"115BA":"";
  if(!domestic) sec="";                                          /* rule 9-10: a foreign co. cannot opt */
  var grRaw = st0(taxGet("C.gen.gr400","C.who.gr400","who.grossReceipt","who.gr400","who.turnover400",
    "who.GrossReceipt","gen.grossReceipt","fs.grossRcpt","fs.grossReceipt")||"");
  var per25small = grRaw.charAt(0).toUpperCase()==="N";          /* "No, ≤400cr" → 25 % small company */
  var sec92E = st0(taxGet("C.gen.sec92E","who.sec92E","gen.sec92E","gen.liable92E",
    "fs.sec92E")||"").charAt(0).toUpperCase()==="Y";             /* TP audit → 30-Nov due date */
  return {domestic:domestic, sec:sec, per25small:per25small, sec92E:sec92E};
}

/* ---- the 115BAA eligibility gate (Tax!D65) ----
   If ANY of the listed incentives is claimed, the concessional 22 % is
   withdrawn and 30 % applies: additional depreciation, 10AA/SEZ, 35AD,
   32AD, ESR (35/35CCC/35CCD weighted), and Part-C Chapter VI-A other than
   80JJAA / 80M (80M survives, phase-4 notes). Guarded; if nothing is
   detected the concession stands (the rules phase refines). */
function taxIncentiveClaimed(){
  var BP=(S.C.bp||{}), DED=(S.C.ded||{});
  var addlDep=N(BP.addlDep!=null?BP.addlDep:(BP.additionalDep||0));
  var d10AA=N(DED.us10AA!=null?DED.us10AA:(DED.ded10AA||0));
  var d35AD=N(BP.ded35AD!=null?BP.ded35AD:(DED.ded35AD||0));
  var d32AD=N(BP.ded32AD||0);
  var esr=N(BP.esr!=null?BP.esr:(BP.esr35||0));
  /* Part-C VI-A net of 80JJAA + 80M (80M survives 115BAA — notes) */
  var partC=N(DED.partC!=null?DED.partC:(DED.PartCchapterVIA||0));
  var d80JJAA=N(DED.d80JJAA||0), d80M=N(DED.d80M||0);
  var partCNet=Math.max(0, partC - d80JJAA - d80M);
  return (addlDep+d10AA+d35AD+d32AD+esr+partCNet)>0;
}

/* ---- the corporate tax ladder (Tax.md §1, cell C4) ---- */
function taxRateInfo(dr){
  if(!dr.domestic) return {rate:0.35, kind:"foreign", label:"Foreign company · 35%"};
  if(dr.sec==="115BAA"){
    if(taxIncentiveClaimed()) return {rate:0.30, kind:"115BAA-withdrawn",
      label:"115BAA withdrawn (incentive claimed) · 30%"};
    return {rate:0.22, kind:"115BAA", label:"Section 115BAA · 22%"};
  }
  if(dr.sec==="115BAB") return {rate:0.22, kind:"115BAB", label:"Section 115BAB · 15% mfg / 22% balance"};
  if(dr.sec==="115BA")  return {rate:0.25, kind:"115BA",  label:"Section 115BA · 25%"};
  if(dr.per25small)     return {rate:0.25, kind:"small",  label:"Domestic (turnover ≤ ₹400 cr) · 25%"};
  return {rate:0.30, kind:"domestic", label:"Domestic company · 30%"};
}
/* corporate tax on a normal-rate income (2a), with the 115BAB manufacturing split */
function taxCorpTax(normalInc, ri, bab15){
  normalInc=Math.max(0,R(normalInc));
  if(ri.kind==="115BAB"){
    var mfg=Math.max(0,Math.min(R(bab15||0),normalInc));         /* 15 % manufacturing */
    return R(mfg*0.15 + (normalInc-mfg)*0.22);                   /* 22 % balance */
  }
  return R(normalInc*ri.rate);
}

/* ---- company surcharge on the normal computation (Tax.md §3), with
   marginal relief. Returns the two surcharge parts (2di flat-25 on 115BBE,
   never relieved; 2dii tiered on the rest, relieved). `taxAtTIfn(x)` gives
   the corporate tax if total income were x (bbe tax held constant). ---- */
function taxCoSurcharge(ti, tax2c, bbeTax, dr, taxAtTIfn){
  /* D-F2 — under §115BAA / §115BAB the domestic-company surcharge is a FLAT
     10 % of the income-tax, irrespective of income (no 7 %/12 % tiering, no
     marginal relief). The 115BBE flat-25 % surcharge (2di) still overrides and
     is never relieved. */
  if(dr.sec==="115BAA"||dr.sec==="115BAB"){
    var surIc = R(Math.max(0,bbeTax)*0.25);                        /* 2di — flat 25 % on 115BBE */
    var surIIc= R(Math.max(0, tax2c - bbeTax)*0.10);               /* 2dii — flat 10 %, no relief */
    return {surI:surIc, surII:surIIc, rate:0.10, mr:0};
  }
  var rate = ti>100000000?(dr.domestic?0.12:0.05): ti>10000000?(dr.domestic?0.07:0.02):0;
  var surI = R(Math.max(0,bbeTax)*0.25);                          /* 2di — flat 25 %, never relieved */
  var restTax = Math.max(0, tax2c - bbeTax);
  var surII = R(restTax*rate);
  var mr=0;
  if(rate>0){
    var th   = ti>100000000?100000000:10000000;
    var lower= ti>100000000?(dr.domestic?0.07:0.02):0;            /* surcharge of the tier BELOW */
    var taxAtTh = R(taxAtTIfn(th));
    var restAtTh= Math.max(0, taxAtTh - bbeTax);
    var surAtTh = R(restAtTh*lower);
    var hereLiab= tax2c + surII;                                  /* excl. the flat 115BBE surcharge */
    var thLiab  = taxAtTh + surAtTh + (ti - th);
    mr = Math.max(0, hereLiab - thLiab);
    surII = Math.max(0, surII - mr);
  }
  return {surI:surI, surII:R(surII), rate:rate, mr:R(mr)};
}
/* company surcharge on the MAT computation (Tax.md §4, SurchargeMAT = C20) */
function taxMatSurcharge(deemedTI, matTax, dr){
  var rate = deemedTI>100000000?(dr.domestic?0.12:0.05): deemedTI>10000000?(dr.domestic?0.07:0.02):0;
  var sur=R(matTax*rate), mr=0;
  if(rate>0){
    var th   = deemedTI>100000000?100000000:10000000;
    var lower= deemedTI>100000000?(dr.domestic?0.07:0.02):0;
    var matTaxAtTh = R(th*0.15);                                  /* MAT rate 15 % on the cut-off income */
    var surAtTh = R(matTaxAtTh*lower);
    mr = Math.max(0, (matTax+sur) - (matTaxAtTh+surAtTh) - (deemedTI-th));
    sur = Math.max(0, sur-mr);
  }
  return {sur:R(sur), rate:rate, mr:R(mr)};
}

/* the advance-tax instalment cut-offs (Schedule IT dates): 15 Jun · 15 Sep ·
   15 Dec · 15 Mar; the 17-31 Mar slot is the fifth (Tax.md §7, R3-R7) */
const TAX_Q_CUT=[new Date(2025,5,15),new Date(2025,8,15),new Date(2025,11,15),new Date(2026,2,15)];

/* =====================================================================
   the engine — the whole Part B roll-up and the S.C tax contract
   ===================================================================== */
function engTax(){
  var dr = taxDrivers();
  var ri = taxRateInfo(dr);

  /* ===== income heads (Part B-TI 1-4), each read via S.C.<head> (guarded) ===== */
  var HP=(S.C.hp||{}), BP=(S.C.bp||{}), CG=(S.C.cg||{}), OS=(S.C.os||{});

  /* item 1 — house property (no salary head): MAX(0, HP total) (L5) */
  var item1=Math.max(0, R(HP.income!=null?HP.income:(HP.total||0)));

  /* item 2 — profits and gains of business or profession (J7-L13) */
  var b2i =Math.max(0, R(BP.noSpec!=null?BP.noSpec:(BP.income||0)));         /* 2i  A38 non-spec */
  var b2ia=Math.max(0, R(BP.raw10TIA!=null?BP.raw10TIA:(BP.foreignDiamond||0)));/* 2ia raw diamonds 10TIA */
  var b2ii=Math.max(0, R(BP.spec||0));                                       /* 2ii speculative */
  var b2iii=Math.max(0, R(BP.specified||0));                                 /* 2iii specified */
  var b2iv=Math.max(0, R(BP.spl!=null?BP.spl:(BP.splRate||0)));              /* 2iv special-rate (115BBF/G/H + BP) */
  var b2v =Math.max(0, b2i+b2ia+b2ii+b2iii+b2iv);                            /* 2v total (nil if the sum is a loss) */

  /* item 3 — capital gains (J17-L30). The per-rate break-up lives in CG.after
     (Schedule CG item E, after the intra-head current-year loss set-off); the
     head published st20/st30/... only under `after`, so reading them at top level
     returned 0 while the head totals were non-zero — Part B-TI 3av/3biii then
     failed to equal Σ 3ai..3aiv / Σ 3bi..3bii (rules A717/A718). Read the break-up
     from CG.after and make the totals their sums, so the identity always holds. */
  var cgA=(CG.after||{});
  var st20=Math.max(0,R(cgA.st20!=null?cgA.st20:(CG.st20||0))), st30=Math.max(0,R(cgA.st30!=null?cgA.st30:(CG.st30||0))),
      stApp=Math.max(0,R(cgA.stApp!=null?cgA.stApp:(CG.stApp||0))), stDTAA=Math.max(0,R(cgA.stDTAA!=null?cgA.stDTAA:(CG.stDTAA||0)));
  var lt125=Math.max(0,R(cgA.lt125!=null?cgA.lt125:(CG.lt125||0))), ltDTAA=Math.max(0,R(cgA.ltDTAA!=null?cgA.ltDTAA:(CG.ltDTAA||0)));
  var totST=R(st20+st30+stApp+stDTAA);                                                /* 3av = Σ 3ai..3aiv */
  var totLT=R(lt125+ltDTAA);                                                          /* 3biii = Σ 3bi..3bii */
  var cg3c =CG.stlt!=null?Math.max(0,R(CG.stlt)):Math.max(0,totST+totLT);             /* 3c */
  var cgC2 =R(CG.C2!=null?CG.C2:(CG.cg115BBH||0));                                     /* 3d 115BBH @30 % */
  var cg3e =Math.max(0, cg3c+cgC2);                                                    /* 3e total */

  /* item 4 — other sources (J32-L35) */
  var os4a=Math.max(0, R(OS.normal!=null?OS.normal:(OS.six!=null?OS.six:(OS.income||0))));/* 4a normal */
  var os4b=R(OS.special!=null?OS.special:(OS.splRate||0));                              /* 4b special rate */
  var os4c=Math.max(0, R(OS.raceHorse!=null?OS.raceHorse:((OS.horse||{}).bal||0)));     /* 4c race horses */
  var os4d=Math.max(0, os4a+os4b+os4c);                                                 /* 4d total */

  /* item 5 — total of head-wise income (1 + 2v + 3e + 4d) (L36) */
  var item5=R(item1 + b2v + cg3e + os4d);

  /* ===== loss set-off (S.C.loss, guarded) — items 6, 8; item 7, 9 (L37-L40) ===== */
  var L=(S.C.loss||{});
  var cyla=R(L.cylaTotal!=null?L.cylaTotal:((L.totHPset||0)+(L.totBusset||0)+(L.totOSset||0)));/* 6 */
  var item7=Math.max(0, item5 - cyla);                                       /* 7 balance after CY set-off */
  var bfla=R(L.bfSetoffTotal!=null?L.bfSetoffTotal:((L.totBFset||0)+(L.totDep||0)+(L.tot35||0)));/* 8 = BFLA set-off total 2xv+3xv+4xv */
  /* item 9 GROSS TOTAL INCOME = 7 − 8. It INCLUDES special-rate income —
     item5 already carries every head (b2iv, cgC2, os4b, 3d), so do NOT
     subtract special-rate income here (the ITR-5 GTI bug). (L40) */
  var gti=Math.max(0, item7 - bfla);

  /* ===== special-rate income (Schedule SI) — items 10 & 14 (L41 / L48) ===== */
  var SI=(S.C.si||{});
  var splInc =Math.max(0, R(SI.totInc!=null?SI.totInc:(SI.TotSplRateInc||0)));          /* 10 (Σ SplRateInc) */
  var splCalc=Math.max(0, R(SI.totIncCalc!=null?SI.totIncCalc:splInc));                 /* 14 (Σ SplRateIncCalc) */

  /* ===== Chapter VI-A + 10AA (S.C.ded, guarded) — items 11, 12 (J43-L46) =====
     11a/11b/11c and 12 are each capped so they cannot be set against
     special-rate income: MIN(…, GTI − IncChargeableTaxSplRates). */
  var DED=(S.C.ded||{});
  var viaPartB=Math.max(0, R(DED.partB!=null?DED.partB:(DED.PartBchapterVIA||0)));
  var viaPartC=Math.max(0, R(DED.partC!=null?DED.partC:(DED.PartCchapterVIA||0)));
  var viaCap=Math.max(0, gti - splCalc);
  var viaTot=Math.max(0, Math.min(viaPartB+viaPartC, viaCap));               /* 11c */
  var us10AA=Math.max(0, Math.min(R(DED.us10AA!=null?DED.us10AA:(DED.ded10AA||0)),
                                  Math.max(0, gti - splCalc - viaTot)));      /* 12 */

  /* item 13 — Total income = round-to-ten of MAX(0, GTI − 11c − 12) (§288B, L47) */
  var ti=Math.max(0, Math.round((gti - viaTot - us10AA)/10)*10);

  /* item 15 — income at normal rates = MAX(0, TotalIncome − item10) (L49) */
  var normalInc=Math.max(0, ti - splInc);

  /* item 16 — net agricultural income for rate (Schedule EI 2v) (L50) */
  var agri=Math.max(0, R((S.C.ei||{}).net2v!=null?(S.C.ei||{}).net2v:((S.C.ei||{}).netAgri||0)));

  /* item 17 — current-year losses carried forward (Schedule CFL xxi) (L51) */
  var cf=R(L.curTotal!=null?L.curTotal:((L.cf&&L.cf.total)||0));            /* Sch CFL row xxi = current-year total */

  /* item 18 — deemed total income u/s 115JB (Schedule MAT item 9) (L52);
     0 if 115BAA/115BAB is opted (rule 674) */
  var MAT=(S.C.mat||{});
  var matBlocked = (ri.kind==="115BAA"||ri.kind==="115BAB");    /* concessional regime shuts MAT off */
  var deemedTI = matBlocked?0:Math.max(0, R(MAT.deemedTI!=null?MAT.deemedTI:(MAT.total9!=null?MAT.total9:(MAT.deemed||0))));

  /* ===== Part B-TTI 2 — tax on total income (the corporate ladder) ===== */
  var bab15=N(BP.bab15!=null?BP.bab15:(BP.mfg115BAB||0));       /* 115BAB manufacturing income */
  var splTax=R(SI.totTax!=null?SI.totTax:(SI.TotSplRateIncTax||0));           /* 2b — SI col (ii) */
  var bbeInc=Math.max(0,R(SI.bbeInc!=null?SI.bbeInc:(SI.inc115BBE||0)));
  var bbeTax=Math.max(0,R(SI.bbeTax!=null?SI.bbeTax:(SI.tax115BBE||0)));      /* 115BBE tax, for 2di */
  var tax2a=taxCorpTax(normalInc, ri, bab15);                                 /* 2a */
  var tax2c=Math.max(0, R(tax2a + splTax));                                   /* 2c = 2a + 2b (L62) */

  /* 2d — surcharge (2di flat 25 % on 115BBE, 2dii tiered + marginal relief) */
  var taxAtTIfn=function(x){ return taxCorpTax(Math.max(0,x-splInc), ri, bab15) + splTax; };
  var scg=taxCoSurcharge(ti, tax2c, bbeTax, dr, taxAtTIfn);
  var sur=Math.max(0, scg.surI + scg.surII);                                  /* 2diii */
  var cess=R((tax2c+sur)*0.04);                                              /* 2e — 4 % */
  var grossTaxLiability=R(tax2c + sur + cess);                                /* 2f (L68) */

  /* ===== Part B-TTI 1 — tax on the deemed income u/s 115JB (MAT) =====
     The MAT tax total (1d = base + surcharge + cess) is OWNED by engMat and
     read here as S.C.mat.tax1d (MAT seam contract). The 1a/1b/1c breakdown is
     recomputed locally for the on-screen rows and as a guarded fallback for
     1d when engMat has not yet published tax1d; both use the same domestic
     15 % + 7 %/12 % + 4 % ladder, so they agree. */
  var mat1a = matBlocked?0:Math.max(0, R(MAT.tax!=null?MAT.tax:(MAT.taxUs115JB||0)));   /* 1a — MAT item 10 (15 % base) */
  var mscg = matBlocked?{sur:0,rate:0,mr:0}:taxMatSurcharge(deemedTI, mat1a, dr);       /* 1b */
  var mat1b = mscg.sur;
  var mat1c = matBlocked?0:R((mat1a+mat1b)*0.04);                                       /* 1c — cess 4 % */
  var mat1dLocal = matBlocked?0:R(mat1a+mat1b+mat1c);                                   /* local 1d (fallback) */
  var mat1d = matBlocked?0:R(MAT.tax1d!=null?MAT.tax1d:mat1dLocal);                     /* 1d = S.C.mat.tax1d (MAT seam) */

  /* ===== Part B-TTI 3 — gross tax payable = higher of 2f and MAT 1d (rule 768) ===== */
  var grossTaxPayable=Math.max(grossTaxLiability, mat1d);

  /* ===== Part B-TTI 4 — 115JAA MAT credit set-off, computed HERE (MATC item 5) =====
     Only when the normal gross tax (2f) exceeds the MAT (1d); capped at the
     headroom (2f − 1d) and at the MAT credit brought forward and available
     (Schedule MATC ΣB3 = S.C.matc.totBF), rule 773. Not read from
     S.C.mat.credit — that seam is retired. */
  var availCredit115JAA=Math.max(0, N((S.C.matc||{}).totBF));                 /* MATC brought-forward credit (input-derived) */
  var matCredit=(grossTaxLiability>mat1d)?Math.max(0, R(Math.min(availCredit115JAA, grossTaxLiability-mat1d))):0;/* rule 773 */
  var afterCredit=Math.max(0, grossTaxPayable - matCredit);                   /* item 5 (L71) */

  /* ===== Part B-TTI 6 — tax relief (Schedule TR): 90/90A + 91 ===== */
  var FA=(S.C.fa||{});
  var rel90=R(FA.dtaa!=null?FA.dtaa:(FA.section90||0));                        /* 6a — TR Sl.2 */
  var rel91=R(FA.notDtaa!=null?FA.notDtaa:(FA.section91||0));                  /* 6b — TR Sl.3 */
  var relief=Math.max(0, R(rel90+rel91));                                      /* 6c */
  var net=Math.max(0, R(afterCredit - relief));                               /* item 7 net tax liability (L76) */

  /* ===== taxes paid (S.C.paid, guarded) ===== */
  var P=(S.C.paid||{});
  var adv=R(P.adv||0), tds=R(P.tds||0), tcs=R(P.tcs||0), sat=R(P.sat||0);
  var paidTot=R(P.total!=null?P.total:(P.paid!=null?P.paid:(adv+tds+tcs+sat)));/* 10e */

  /* ===== interest & fee (the hidden Tax sheet, Tax.md §7) ===== */
  var dueDate = dr.sec92E ? new Date(2026,10,30) : (D(dmy(S.fs.duedate))||DUE);/* 30-Nov if 92E, else 31-Oct */
  var filed=D(S.fs.filed);
  var late=!!(filed && filed>dueDate);
  var IT=Array.isArray((S.paid||{}).it)?S.paid.it:(Array.isArray(S.it)?S.it:[]);
  var isSAT=function(c){var d=D(c.dt);return d?d>YREND:false;};
  var upto=function(d){return IT.filter(function(c){return !isSAT(c)&&D(c.dt)&&D(c.dt)<=d;})
    .reduce(function(a,c){return a+N(c.amt);},0);};

  /* 234A (N18): 1 %/month on MAX(net − adv − tds − tcs, 0), principal floored to 100 */
  var p234a=Math.max(0, net-adv-tds-tcs); if(p234a>100)p234a=Math.floor(p234a/100)*100;
  var m234a=late?MPART(dueDate,filed):0;
  var i234a=R(p234a*0.01*m234a);

  /* 234F late-filing fee (companies): ₹5,000; ₹1,000 if total income ≤ ₹5 lakh */
  var f234f=late?(ti<=500000?1000:5000):0;

  /* 234-I revised-return fee (rules 783/784): if filed after 31-12-2026 u/s 139(5),
     ₹1,000 when TI ≤ ₹5 lakh else ₹5,000. Gated on a revised-return indicator. */
  var revised=/revis|139\s*\(?5/i.test(st0(taxGet("fs.retType","fs.revised","fs.sec")))||(+S.fs.sec===17);
  var f234i=(revised && filed && filed>new Date(2026,11,31))?(ti<=500000?1000:5000):0;

  /* 234C (five quarter buckets; MATC-higher path uses the MAT tax as the base) */
  var matHigher=mat1d>grossTaxLiability;
  var base234c=matHigher?mat1d:net;
  var gate234c=base234c>=10000;
  var paidIn5=IT.filter(function(c){return !isSAT(c)&&D(c.dt)&&D(c.dt)>TAX_Q_CUT[3]&&D(c.dt)<=YREND;})
    .reduce(function(a,c){return a+N(c.amt);},0);
  var QDEF=[[0.15,0.12,3],[0.45,0.36,3],[0.75,null,3],[1,null,1]];            /* target, safe-harbour, months */
  var qs=QDEF.map(function(q,k){var pc=q[0],safe=q[1],mo=q[2];
    var b=Math.max(0, base234c - tds - tcs - relief);
    var need=R(b*pc), got=R(upto(TAX_Q_CUT[k]));
    var sh=(safe!==null && got>=Math.floor(b*safe/100)*100)?0:Math.floor(Math.max(0,need-got)/100)*100;
    if(!gate234c)sh=0;
    return {need:need, got:got, short:sh, mo:mo, int:R(sh*0.01*mo)};});
  var i234c=R(qs.reduce(function(a,q){return a+q.int;},0));

  /* 234B (N17): assessed = net − (tds + tcs); if advance < 90 %, 1 %/month Apr→filing */
  var assessed=net-tds-tcs, i234b=0;
  if(assessed>=10000 && net>=10000 && adv<0.9*assessed){
    var principal=Math.floor(Math.max(0, net-adv-tds-tcs)/100)*100;
    var end=filed||new Date();
    var months=Math.min(30, MPART(new Date(2026,3,1),end)||1);
    i234b=R(principal*0.01*months);
  }

  /* ===== the closing lines (§288B rounding) ===== */
  var intTotal=R(i234a+i234b+i234c+f234f+f234i);                              /* 8e (L83) */
  var aggregate=R(net + intTotal);                                            /* item 9 — nearest rupee (L84) */
  var bal=aggregate - paidTot;
  var balance=Math.round(Math.max(0, bal)/10)*10;                            /* item 11 — nearest ten (L91) */
  var refund =Math.round(Math.max(0,-bal)/10)*10;                           /* item 12 — nearest ten (L92) */

  /* 115TD adjustment (items 13-15) — Schedule 115TD net payable (S.C.other) */
  var net115TD=Math.max(0, R((S.C.other||{}).td115Net!=null?(S.C.other||{}).td115Net:((S.C.other||{}).net115TD||0)));
  var payable115TD=net115TD>refund?(net115TD-refund):0;                       /* 14 */
  var netRefund=refund>net115TD?(refund-net115TD):0;                          /* 15 */

  /* ===== publish the S.C contract (footer + the MATC seam) ===== */
  S.C.gti=R(gti);
  S.C.ti=R(ti);
  S.C.tax={
    regime:ri.label, rebate:0,                                               /* footer contract */
    dr:dr, ri:ri,
    item1:item1, b2i:b2i, b2ia:b2ia, b2ii:b2ii, b2iii:b2iii, b2iv:b2iv, b2v:b2v,
    st20:st20, st30:st30, stApp:stApp, stDTAA:stDTAA, totST:totST,
    lt125:lt125, ltDTAA:ltDTAA, totLT:totLT, cg3c:cg3c, cgC2:cgC2, cg3e:cg3e,
    os4a:os4a, os4b:os4b, os4c:os4c, os4d:os4d,
    item5:item5, cyla:cyla, item7:R(item7), bfla:bfla, splInc:splInc, splCalc:splCalc,
    viaPartB:viaPartB, viaPartC:viaPartC, viaTot:viaTot, us10AA:us10AA,
    normalInc:R(normalInc), agri:agri, cf:cf, deemedTI:deemedTI,
    tax2a:tax2a, splTax:splTax, tax2c:tax2c, bbeInc:bbeInc, bbeTax:bbeTax,
    surI:scg.surI, surII:scg.surII, surRate:scg.rate, mr:scg.mr, sur:sur, cess:cess,
    gross:grossTaxLiability,                                                 /* 2f = footer tax */
    normal2f:grossTaxLiability, grossTaxLiability:grossTaxLiability,         /* MAT seam: engMat/engMatc read these as the normal 2f */
    mat1a:mat1a, mat1b:mat1b, mat1c:mat1c, matSurRate:mscg.rate, matMr:mscg.mr,
    deemedTotal:mat1d,                                                       /* 1d = MATC item 1 */
    grossPayable:grossTaxPayable, matBlocked:matBlocked, matHigher:matHigher};
  S.C.int={
    dueDate:dueDate, filed:filed, late:late,
    grossPayable:grossTaxPayable, credit:matCredit, afterCredit:R(afterCredit),
    rel90:rel90, rel91:rel91, relief:relief, net:net,
    adv:adv, tds:tds, tcs:tcs, sat:sat, paid:paidTot,
    p234a:R(p234a), m234a:m234a, i234a:i234a, i234b:R(i234b), qs:qs, i234c:i234c,
    f234f:f234f, f234i:f234i, total:intTotal, aggregate:aggregate,
    balance:balance, refund:refund,
    net115TD:net115TD, payable115TD:payable115TD, netRefund:netRefund, matHigher:matHigher};
}

/* =====================================================================
   the screen — Part B-TI and Part B-TTI as result blocks (green cells),
   plus the tax-computation basis panel (the hidden Tax sheet, surfaced
   read-only) and the filing-date input that drives the interest.
   ===================================================================== */
function secTax(){
  var T=S.C.tax||{}, I=S.C.int||{};
  var r=function(n,l,v,o){return row(l,cell(v),Object.assign({ref:n},o||{}));};
  var h="";

  h+=note("Part B is the roll-up for the <b>company</b> return. Every white figure is picked up from another schedule; only the filing date below is keyed here. There is no salary head, no basic exemption, no 87A rebate and no section-89 relief.");

  /* ---- tax-computation basis (the hidden Tax sheet) ---- */
  h+=card("taxbasis","Tax computation basis (from Part A-General)","",
    r("—","Company type / rate",0,{v2:esc((T.ri||{}).label||"—")})+
    r("—","MAT (section 115JB)",0,{v2:T.matBlocked?"Not applicable (115BAA/115BAB opted)":"Applies to a domestic company on the normal regime"})+
    note("The 25 / 30 / 22 / 15 % domestic ladder (35 % foreign), the 115BAA eligibility gate, the company surcharge with marginal relief and the 234A/B/C interest are computed here from the Part A-General flags (domestic, 115BA/BAA/BAB option, turnover) owned by the Company-particulars section."));

  /* ===== Part B-TI ===== */
  h+=sub("Part B-TI — Computation of total income");
  h+=r("1","Income from house property — 3 of Schedule HP (nil if loss)",T.item1||0);
  h+=sub("2 · Profits and gains from business or profession");
  h+=r("2i","Business other than 115B / speculative / specified — A38 of BP (nil if loss)",T.b2i||0,{ind:1});
  h+=r("2ia","Foreign company — eligible raw-diamond business (rule 10TIA) — 3iva of Table E BP",T.b2ia||0,{ind:1});
  h+=r("2ii","Speculative business — 3(ii) of Table E BP (nil if loss)",T.b2ii||0,{ind:1});
  h+=r("2iii","Specified business — 3(iii) of Table E BP (nil if loss)",T.b2iii||0,{ind:1});
  h+=r("2iv","Income chargeable at special rate — 3d,3e,3f,3iv of Table E BP",T.b2iv||0,{ind:1});
  h+=r("2v","Total (2i + 2ia + 2ii + 2iii + 2iv)",T.b2v||0,{cls:"tot"});
  h+=sub("3 · Capital gains");
  h+=r("3ai","Short term chargeable @ 20% — 8ii of item E of CG",T.st20||0,{ind:1});
  h+=r("3aii","Short term chargeable @ 30% — 8iii",T.st30||0,{ind:1});
  h+=r("3aiii","Short term at applicable rate — 8iv",T.stApp||0,{ind:1});
  h+=r("3aiv","STCG at special rates as per DTAA — 8v",T.stDTAA||0,{ind:1});
  h+=r("3av","Total short-term capital gain (nil if loss)",T.totST||0,{cls:"tot"});
  h+=r("3bi","Long term chargeable @ 12.5% — 8vi",T.lt125||0,{ind:1});
  h+=r("3bii","LTCG at special rates as per DTAA — 8vii",T.ltDTAA||0,{ind:1});
  h+=r("3biii","Total long-term capital gain (nil if loss)",T.totLT||0,{cls:"tot"});
  h+=r("3c","Sum of short-term and long-term (3av + 3biii, nil if loss)",T.cg3c||0);
  h+=r("3d","Capital gains @ 30% u/s 115BBH — C2 of Schedule CG",T.cgC2||0);
  h+=r("3e","Total capital gains (3c + 3d)",T.cg3e||0,{cls:"tot"});
  h+=sub("4 · Income from other sources");
  h+=r("4a","Net income at normal rates — 6 of Schedule OS (nil if loss)",T.os4a||0,{ind:1});
  h+=r("4b","Income chargeable at special rate — 2 of Schedule OS",T.os4b||0,{ind:1});
  h+=r("4c","Owning & maintaining race horses — 8e of OS (nil if loss)",T.os4c||0,{ind:1});
  h+=r("4d","Total (4a + 4b + 4c)",T.os4d||0,{cls:"tot"});
  h+=r("5","Total of head-wise income (1 + 2v + 3e + 4d)",T.item5||0,{cls:"tot"});
  h+=r("6","Current-year losses set off against 5 — Schedule CYLA",T.cyla||0);
  h+=r("7","Balance after set-off of current-year losses (5 − 6)",T.item7||0);
  h+=r("8","Brought-forward losses set off against 7 — Schedule BFLA",T.bfla||0);
  h+=r("9","Gross total income (7 − 8)",S.C.gti||0,{cls:"grand"});
  h+=r("10","Income at special rate under 111A/112/112A etc. included in 9",T.splInc||0);
  h+=r("11a","Part-B of Chapter VI-A (limited)",T.viaPartB||0,{ind:1});
  h+=r("11b","Part-C of Chapter VI-A",T.viaPartC||0,{ind:1});
  h+=r("11c","Total Chapter VI-A — capped at (9 − 14)",T.viaTot||0,{cls:"tot"});
  h+=r("12","Deduction u/s 10AA — Schedule 10AA (capped)",T.us10AA||0);
  h+=r("13","Total income (9 − 11c − 12)",S.C.ti||0,{cls:"grand",hint:"rounded to the nearest ten"});
  h+=r("14","Income chargeable at special rates — total of (i) of Schedule SI",T.splCalc||0);
  h+=r("15","Income chargeable at normal rates (13 − 10)",T.normalInc||0);
  h+=r("16","Net agricultural income — 2v of Schedule EI",T.agri||0);
  h+=r("17","Current-year losses carried forward — total of xxi of Schedule CFL",T.cf||0);
  h+=r("18","Deemed total income u/s 115JB — 9 of Schedule MAT",T.deemedTI||0,{hint:T.matBlocked?"nil under 115BAA/115BAB":""});

  /* ===== Part B-TTI ===== */
  h+=sub("Part B-TTI — Computation of tax liability on total income");
  h+=sub("1 · Tax payable u/s 115JB (MAT)");
  if(T.matBlocked)h+=note("MAT under section 115JB does not apply — the company has opted for section 115BAA / 115BAB (rule 674).");
  else{
    h+=r("1a","Tax payable on deemed total income u/s 115JB — 10 of Schedule MAT",T.mat1a||0,{ind:1});
    h+=r("1b","Surcharge on 1a (if applicable)",T.mat1b||0,{ind:1,hint:T.matSurRate?(R(T.matSurRate*100)+"%"):""});
    h+=r("1c","Health & education cess @ 4% on (1a + 1b)",T.mat1c||0,{ind:1});
    h+=r("1d","Total tax payable u/s 115JB (1a + 1b + 1c)",T.deemedTotal||0,{cls:"tot"});
  }
  h+=sub("2 · Tax payable on total income");
  h+=r("2a","Tax at the corporate rate on 15 of Part B-TI",T.tax2a||0,{ind:1,hint:(T.ri||{}).label});
  h+=r("2b","Tax at special rates — total of (ii) of Schedule SI",T.splTax||0,{ind:1});
  h+=r("2c","Tax payable on total income (2a + 2b)",T.tax2c||0,{cls:"tot"});
  h+=sub("2d · Surcharge");
  h+=r("2di","25% of tax on income chargeable u/s 115BBE (never marginal-relieved)",T.surI||0,{ind:1});
  h+=r("2dii","Company surcharge on the rest, after marginal relief",T.surII||0,{ind:1,hint:(T.surRate?R(T.surRate*100)+"%":"nil")+(T.mr?(" · marginal relief "+RS(T.mr)):"")});
  h+=r("2diii","Total surcharge (2di + 2dii)",T.sur||0,{cls:"tot"});
  h+=r("2e","Health & education cess @ 4% on (2c + 2diii)",T.cess||0);
  h+=r("2f","Gross tax liability (2c + 2diii + 2e)",T.gross||0,{cls:"tot"});
  h+=r("3","Gross tax payable — higher of 1d and 2f",I.grossPayable||0,{cls:"grand"});
  h+=r("4","Credit u/s 115JAA of tax paid in earlier years (only if 2f > 1d) — 5 of Schedule MATC",-(I.credit||0));
  h+=r("5","Tax payable after credit u/s 115JAA (3 − 4)",I.afterCredit||0,{cls:"tot"});
  h+=sub("6 · Tax relief");
  h+=r("6a","Section 90 / 90A — 2 of Schedule TR",I.rel90||0,{ind:1});
  h+=r("6b","Section 91 — 3 of Schedule TR",I.rel91||0,{ind:1});
  h+=r("6c","Total (6a + 6b)",I.relief||0,{cls:"tot"});
  h+=r("7","Net tax liability (5 − 6c) — nil if negative",I.net||0,{cls:"grand"});
  h+=sub("8 · Interest and fee payable");
  h+=row("Date of filing the return",dte("fs.filed"),{req:1,ref:"—",hint:"due "+DISP(I.dueDate||DUE)});
  h+=r("8a","Interest for default in furnishing the return — 234A",I.i234a||0,{ind:1,hint:I.m234a?(I.m234a+" month"+(I.m234a>1?"s":"")+" on "+RS(I.p234a||0)):""});
  h+=r("8b","Interest for default in payment of advance tax — 234B",I.i234b||0,{ind:1});
  h+=r("8c","Interest for deferment of advance tax — 234C",I.i234c||0,{ind:1,hint:I.matHigher?"on the MAT (115JB) tax":""});
  h+=r("8d","Fee for default in furnishing the return — 234F",I.f234f||0,{ind:1});
  h+=r("8da","Fee for furnishing a revised return — 234-I",I.f234i||0,{ind:1});
  h+=r("8e","Total interest and fee (8a+8b+8c+8d+8da)",I.total||0,{cls:"tot"});
  h+=r("9","Aggregate liability (7 + 8e)",I.aggregate||0,{cls:"grand"});
  h+=sub("10 · Taxes paid");
  h+=r("10a","Advance tax — Schedule IT",I.adv||0,{ind:1});
  h+=r("10b","TDS — Schedule TDS 1 & 2",I.tds||0,{ind:1});
  h+=r("10c","TCS — Schedule TCS",I.tcs||0,{ind:1});
  h+=r("10d","Self-assessment tax — Schedule IT",I.sat||0,{ind:1});
  h+=r("10e","Total taxes paid (10a+10b+10c+10d)",I.paid||0,{cls:"tot"});
  h+=r("11","Amount payable — if 9 exceeds 10e, rounded to ten",I.balance||0,{cls:I.balance?"grand":"tot"});
  h+=r("12","Refund — if 10e exceeds 9, rounded to ten",I.refund||0,{cls:I.refund?"grand":"tot"});
  if(I.net115TD){
    h+=r("13","Net tax payable on 115TD income including interest u/s 115TE — Schedule 115TD",I.net115TD||0);
    h+=r("14","Tax payable u/s 115TD after adjustment of refund at 12 (13 − 12)",I.payable115TD||0);
    h+=r("15","Net refund after adjustment as per 14 (12 − 13)",I.netRefund||0,{cls:I.netRefund?"grand":"tot"});
  }
  h+=note("Bank-account details for the refund, the foreign-asset declaration and the verification block are entered under <b>Verification</b>.");
  return h;
}

/* =====================================================================
   export — every live line of Part B-TI and Part B-TTI to its EXACT
   schema key (PARTB_TI_TTI.md). NOT written here (owned by `bank`):
   PartB_TTI.Refund.* and AssetOutsideIndiaFlg.
   ===================================================================== */
function expTax(j){
  var T=S.C.tax||{}, I=S.C.int||{};

  /* ---- Part B-TI ---- */
  put(j,"PartB-TI.IncomeFromHP",n0(T.item1));
  put(j,"PartB-TI.ProfBusGain.ProfGainNoSpecBus",n0(T.b2i));
  put(j,"PartB-TI.ProfBusGain.IncmForeignCompRule10TIA",n0(T.b2ia));
  put(j,"PartB-TI.ProfBusGain.ProfGainSpecBus",n0(T.b2ii));
  put(j,"PartB-TI.ProfBusGain.ProfGainSpecifiedBus",n0(T.b2iii));
  put(j,"PartB-TI.ProfBusGain.IncChrgblTaxSplRate",n0(T.b2iv));
  put(j,"PartB-TI.ProfBusGain.TotProfBusGain",n0(T.b2v));
  put(j,"PartB-TI.CapGain.ShortTerm.ShortTerm20Per",n0(T.st20));
  put(j,"PartB-TI.CapGain.ShortTerm.ShortTerm30Per",n0(T.st30));
  put(j,"PartB-TI.CapGain.ShortTerm.ShortTermAppRate",n0(T.stApp));
  put(j,"PartB-TI.CapGain.ShortTerm.ShortTermSplRateDTAA",n0(T.stDTAA));
  put(j,"PartB-TI.CapGain.ShortTerm.TotalShortTerm",n0(T.totST));
  put(j,"PartB-TI.CapGain.LongTerm.LongTerm12_5Per",n0(T.lt125));
  put(j,"PartB-TI.CapGain.LongTerm.LongTermSplRateDTAA",n0(T.ltDTAA));
  put(j,"PartB-TI.CapGain.LongTerm.TotalLongTerm",n0(T.totLT));
  put(j,"PartB-TI.CapGain.ShortTermLongTermTotal",n0(T.cg3c));
  put(j,"PartB-TI.CapGain.CapGains30Per115BBH",n0(T.cgC2));
  put(j,"PartB-TI.CapGain.TotalCapGains",n0(T.cg3e));
  put(j,"PartB-TI.IncFromOS.OtherSrcThanOwnRaceHorse",n0(T.os4a));
  put(j,"PartB-TI.IncFromOS.IncChargblSplRate",n0(T.os4b));
  put(j,"PartB-TI.IncFromOS.FromOwnRaceHorse",n0(T.os4c));
  put(j,"PartB-TI.IncFromOS.TotIncFromOS",n0(T.os4d));
  put(j,"PartB-TI.TotalTI",n0(T.item5));
  put(j,"PartB-TI.CurrentYearLoss",n0(T.cyla));
  put(j,"PartB-TI.BalanceAfterSetoffLosses",n0(T.item7));
  put(j,"PartB-TI.BroughtFwdLossesSetoff",n0(T.bfla));
  put(j,"PartB-TI.GrossTotalIncome",n0(S.C.gti));
  put(j,"PartB-TI.IncChargeTaxSplRate111A112",n0(T.splInc));
  put(j,"PartB-TI.DeductionsUndSchVIADtl.PartBchapterVIA",n0(T.viaPartB));
  put(j,"PartB-TI.DeductionsUndSchVIADtl.PartCchapterVIA",n0(T.viaPartC));
  put(j,"PartB-TI.DeductionsUndSchVIADtl.TotDeductUndSchVIA",n0(T.viaTot));
  put(j,"PartB-TI.DeductionsUnder10Aor10AA",n0(T.us10AA));
  put(j,"PartB-TI.TotalIncome",n0(S.C.ti));
  put(j,"PartB-TI.IncChargeableTaxSplRates",n0(T.splCalc));
  put(j,"PartB-TI.IncChargeableTaxNormalRates",n0(T.normalInc));
  put(j,"PartB-TI.NetAgricultureIncomeOrOtherIncomeForRate",n0(T.agri));
  put(j,"PartB-TI.LossesOfCurrentYearCarriedFwd",n0(T.cf));
  put(j,"PartB-TI.DeemedTotIncSec115JB",n0(T.deemedTI));

  /* ---- Part B-TTI ---- */
  var CTL=j.PartB_TTI.ComputationOfTaxLiability;
  /* 1 · tax on the deemed income u/s 115JB */
  put(CTL,"TaxPayableOnDeemedTI.TaxDeemedTISec115JB",n0(T.mat1a));
  put(CTL,"TaxPayableOnDeemedTI.Surcharge",n0(T.mat1b));
  put(CTL,"TaxPayableOnDeemedTI.EducationCess",n0(T.mat1c));
  put(CTL,"TaxPayableOnDeemedTI.TotalTax",n0(T.deemedTotal));
  /* 2 · tax on total income */
  put(CTL,"TaxPayableOnTI.TaxAtNormalRates",n0(T.tax2a));
  put(CTL,"TaxPayableOnTI.TaxAtSpecialRates",n0(T.splTax));
  put(CTL,"TaxPayableOnTI.TaxPayableOnTotInc",n0(T.tax2c));
  put(CTL,"TaxPayableOnTI.Surcharge25ofSI",n0(T.surI));
  put(CTL,"TaxPayableOnTI.SurchargeOnTaxPayable",n0(T.surII));
  put(CTL,"TaxPayableOnTI.TotalSurcharge",n0(T.sur));
  put(CTL,"TaxPayableOnTI.EducationCess",n0(T.cess));
  put(CTL,"TaxPayableOnTI.GrossTaxLiability",n0(T.gross));
  /* 3-7 */
  put(CTL,"GrossTaxPayable",n0(I.grossPayable));
  if(I.credit)put(CTL,"CredUs115JAATaxPaid",n0(I.credit));
  put(CTL,"TaxPayableAfterCredUs115JAA",n0(I.afterCredit));
  if(I.relief){put(CTL,"TaxRelief.Section90",n0(I.rel90));put(CTL,"TaxRelief.Section91",n0(I.rel91));}
  put(CTL,"TaxRelief.TotTaxRelief",n0(I.relief));
  put(CTL,"NetTaxLiability",n0(I.net));
  /* 8 · interest & fee */
  put(CTL,"IntrstPay.IntrstPayUs234A",n0(I.i234a));
  put(CTL,"IntrstPay.IntrstPayUs234B",n0(I.i234b));
  put(CTL,"IntrstPay.IntrstPayUs234C",n0(I.i234c));
  put(CTL,"IntrstPay.LateFilingFee234F",Math.min(5000,n0(I.f234f)));
  if(I.f234i)put(CTL,"IntrstPay.FeeFurnish234I",n0(I.f234i));
  put(CTL,"IntrstPay.TotalIntrstPay",n0(I.total));
  put(CTL,"AggregateTaxInterestLiability",n0(I.aggregate));
  /* 10 · taxes paid (Part B-TTI roll-up — distinct from Schedule IT/TDS/TCS) */
  if(I.adv)put(j,"PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax",n0(I.adv));
  if(I.tds)put(j,"PartB_TTI.TaxPaid.TaxesPaid.TDS",n0(I.tds));
  if(I.tcs)put(j,"PartB_TTI.TaxPaid.TaxesPaid.TCS",n0(I.tcs));
  if(I.sat)put(j,"PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax",n0(I.sat));
  put(j,"PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid",n0(I.paid));
  /* 11 · amount payable; 12 · refund. RefundDue was owned by nobody — the bank
     section defers it to the tax section and the tax section never wrote it — so
     PartB_TTI.Refund.RefundDue stayed 0 even when a refund was due (rule A766).
     Write it here (the bank section owns only Refund.BankAccountDtls.*). */
  put(j,"PartB_TTI.TaxPaid.BalTaxPayable",n0(I.balance));
  put(j,"PartB_TTI.Refund.RefundDue",n0(I.refund));
  /* 13-15 · the 115TD adjustment (only when Schedule 115TD carries a figure) */
  if(I.net115TD){
    put(j,"PartB_TTI.TaxPaid.NetTaxPayable115TD",n0(I.net115TD));
    put(j,"PartB_TTI.TaxPaid.TaxPayable115TD",n0(I.payable115TD));
    put(j,"PartB_TTI.TaxPaid.NetRefundAdjust",n0(I.netRefund));
  }
}

/* =====================================================================
   import — the inverse of export. Part B-TI / Part B-TTI are all computed
   figures (they recompute on import via compute()), so nothing there needs
   to be read back into state; only the keyed filing date lives in S.fs
   and is restored by the who/filing section. Kept as the contract's
   identity round-trip stub (rule 12).
   ===================================================================== */
function impTax(I6){
  var read=[];
  if(I6 && I6["PartB-TI"]) read.push("Part B-TI (computed on import)");
  if(I6 && I6.PartB_TTI)   read.push("Part B-TTI (computed on import)");
  return read;
}

/* =====================================================================
   checks — the section's own screen validations (err/warn); the
   department rules are Phase 6.
   ===================================================================== */
function chkTax(){
  var o=[], add=function(l,t,m){o.push({lvl:l,t:t,m:m,sec:"tax"});};
  var T=S.C.tax||{}, I=S.C.int||{};

  if((T.ri||{}).kind==="115BAA-withdrawn")
    add("warn","115BAA concession withdrawn","An incentive on the 115BAA exclusion list is claimed, so the 22% rate is withdrawn and 30% applies (Tax sheet D65). Remove the incentive or the 115BAA option.");
  if(T.matBlocked && (T.deemedTI>0))
    add("warn","MAT figure ignored","Section 115JB (MAT) does not apply under 115BAA/115BAB — the deemed total income of "+RS(T.deemedTI)+" is not brought to tax.");
  else if(!T.matBlocked && T.matHigher)
    add("ok","MAT (115JB) is the higher tax","MAT of "+RS(T.deemedTotal)+" exceeds the normal tax of "+RS(T.gross)+"; the gross tax payable is the MAT, and MAT credit u/s 115JAA is carried forward.");

  if(T.mr>0)add("ok","Marginal relief on surcharge",RS(T.mr)+" of surcharge falls away under marginal relief.");

  if(I.late)add("warn","Filed after the due date","Interest and fee of "+RS(I.total)+" arise because the return is filed after "+DISP(I.dueDate||DUE)+".");
  if((I.balance||0)>0)add("ok","Balance payable",RS(I.balance)+" is payable, including "+RS(I.total)+" of interest and fee.");
  else if((I.refund||0)>0)add("ok","Refund due",RS(I.refund)+" — credited to the bank account nominated under Verification.");

  if(st0(S.fs.filed)&&!D(S.fs.filed))add("err","Date of filing","The date of filing is not a valid date.");

  return o;
}

/* ---- register (overrides the boot stub) ---- */
reg({id:"tax", t:"Part B — total income and tax", ref:"Part B-TI · Part B-TTI · MAT / MATC · 234A/B/C",
  f:secTax,
  s:function(){return (S.C.tax&&S.C.tax.gross)?("Tax "+CR((S.C.int&&S.C.int.net)||0)):"Part B-TI · Part B-TTI";},
  eng:engTax, exp:expTax, imp:impTax, chk:chkTax, order:90, corder:90});
