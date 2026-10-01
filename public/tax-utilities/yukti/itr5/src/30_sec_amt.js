/* =====================================================================
   ITR-5 · Section "amt" — Alternate Minimum Tax and its credit
   Books: books/ITR-5/AMT.md (Schedule AMT · sheet39 · block ScheduleAMT)
          books/ITR-5/AMTC.md (Schedule AMTC · block ScheduleAMTC)
   Sheet tabs: AMT, AMTC · section_map "amt" → [ScheduleAMT, ScheduleAMTC].
   Schema blocks exported/imported: ScheduleAMT, ScheduleAMTC (both
   #/definitions, both required:false — built only when they apply).
   Compute / screen order: 54 (after ded=50; before the Part-B "tax"
   roll-up, which reads S.C.amt for the AMT-vs-normal higher-of and the
   §115JD credit).

   ─── what this section does ───────────────────────────────────────
   Schedule AMT (§115JC): adjusted total income = total income (item 13
   of Part B-TI) + the three add-backs u/s 115JC(2) — 2a Chapter VI-A
   Part C less 80P, 2b section 10AA, 2c section 35AD (net of the
   depreciation on those assets, a user input) — and the AMT is
   9% on IFSC-unit income (3a) + 18.5% (or 15% for a co-operative
   society) on the other units (3b), with a ₹20-lakh floor for
   AOP/BOI and AJP only. The whole schedule is zeroed under the new
   regime (bacValue=1, §115BAC).

   Schedule AMTC (§115JD): the per-AY brought-forward AMT-credit table
   (2012-13 … 2025-26, fourteen rows; the 2011-12 row is hidden and NOT
   built) with Gross → Set-off → Balance b/f → Utilised → Carried
   forward, a Current-Year row and the Total row; item 5 (utilised) and
   item 6 (carried forward) restate the Total column.

   ─── the cross-section contract ───────────────────────────────────
   S.C.amt is PUBLISHED here for the tax section:
     .amt        base AMT u/s 115JC — sl.4 / TaxPayableUnderSec115JC
     .total      AMT incl. surcharge + cess — Part B-TTI 1d (higher-of)
     .adjusted   sl.3 — deemed total income (Part B-TI sl.18)
     .creditAvail  §115JD credit AVAILABLE (Σ balance-b/f pool) — the
                   tax section utilises this against (2i − 1d)
   It CONSUMES (all guarded — siblings may not be built yet):
     S.C.loss.gti   Gross Total Income after CYLA/BFLA set-off
     S.C.ded.*      Chapter VI-A total / Part C / 80P / 10AA deduction
     S.C.bp.ded35AD 35AD(1) deduction claimed (default for the 2c input)
     S.C.bp.c.C48   specified-business profit (2a cap)
     S.C.si.totInc  income at special rates included in GTI (2a cap)
     S.C.tax.gross  normal-provisions gross tax liability — 2i, for the
                    AMTC head items / utilisation (only ready at render/
                    export/checks time, never inside engAmt).

   Rule 2: every formula is from ITR-5's own AMT/AMTC sheets (cell refs
   in comments), never ported from ITR-2/ITR-3.
   Rule 1 (hidden rows): the 2011-12 AMTC row (row 10H) is excluded.

   NOTE on AMT surcharge (S.C.amt.sur/.cess/.total): AMT.md defers the
   surcharge slab-helper (cols M–R, B23) to the tax engine. This section
   computes a best-effort, status-aware surcharge WITHOUT marginal
   relief so S.C.amt.total is a ready 1d for the higher-of; the tax
   engine may refine it (and, if it does, may overwrite S.C.amt.total,
   which the AMTC table then picks up at export/render time).
   ===================================================================== */

/* the fourteen brought-forward assessment years of Schedule AMTC — item 4
   rows i…xiv (AMTC.md; 2011-12 / row 10 is hidden and not built). Also the
   ScheduleAMTCDtls[].AssYr enum (maxItems 14). */
const AMT_AMTC_YRS=["2012-13","2013-14","2014-15","2015-16","2016-17","2017-18","2018-19",
  "2019-20","2020-21","2021-22","2022-23","2023-24","2024-25","2025-26"];
const AMT_CUR_AY="2026-27";                 /* CurrAssYr enum[1] */
const AMT_FLOOR=2000000;                     /* ₹20 lakh threshold (A682/A683), AOP/BOI/AJP only */

/* ---- state (my namespace S.amt) ---------------------------------- */
S.amt = S.amt || {};
if(S.amt.d35AD==null) S.amt.d35AD="";        /* 2c [H8] input — 35AD net of depreciation */
if(S.amt.ifsc==null)  S.amt.ifsc="";         /* 3a [J11] input — adjusted TI of IFSC units */
if(S.amt.amtc==null)  S.amt.amtc={};         /* {AssYr:{gross,setoff}} prior-year AMT credit (B1/B2) */

/* ---- status helpers (AMT.md O13 / P12) ---------------------------- */
/* FormulaOfAMT [O13] = IF(MID(MainStatus,1,1)="1" or "2","Y","N"). DB!O1:O5
   MainStatus = 1-Firm / 2-Local Authority / 3-AOP/BOI / 4-AJP, so the ₹20-lakh
   floor ("N") applies to AOP/BOI (schema status 14) and AJP (9), and NOT to
   Firm (1) or Local Authority (2). */
function amtFloorApplies(){const st=st0(S.pi&&S.pi.status);return st==="14"||st==="9";}
/* AsseesseeSubStatusFlag [P12] = 1 (⇒ 3b @ 15%) for a co-operative society
   (SubStatus 1a/1b/1c or "3-Other Cooperative Society"), else 2 (⇒ 18.5%). */
function amtIsCoop(){const sub=st0(S.pi&&S.pi.substatus);
  return /^(1a-|1b-|1c-)/.test(sub)||sub==="3-Other Cooperative Society";}

/* ---- engine ------------------------------------------------------ */
function engAmt(){
  /* AMT u/s 115JC does NOT apply once ANY concessional regime is opted
     (115BAC(1A)/115BAD/115BAE) — those regimes forgo the Ch VI-A Part-C /
     10AA / 35AD deductions that trigger AMT. Read the regime contract
     (S.C.regime.anyConc), NOT the shell isNew() which sees only 115BAC.
     Fall back to isNew() only if the regime module hasn't published yet. */
  const REG=(S.C.regime||{});
  const New=(REG.anyConc!=null)?!!REG.anyConc:isNew();
  const DED=(S.C.ded||{}), LOSS=(S.C.loss||{}), BP=(S.C.bp||{}), SI=(S.C.si||{});

  /* Gross Total Income after CYLA/BFLA set-off (Sheet8b.GrossTotalIncome) */
  const gti=R(S.C.gti!=null?S.C.gti:(LOSS.gti!=null?LOSS.gti:(LOSS.ti!=null?LOSS.ti:0)));
  /* Chapter VI-A allowed total and the 10AA deduction (from the ded section) */
  const viaAllowed=Math.max(0,R(DED.allowed!=null?DED.allowed:(DED.total!=null?DED.total:
    ((DED.partB||0)+(DED.partCAandD||0)+(DED.partC||0)))));
  const us10AA=Math.max(0,R(DED.ded10AA!=null?DED.ded10AA:(DED.us10AA!=null?DED.us10AA:(DED.d10AA||0))));
  /* Part C total (kept for the screen / checks) and the AMT Part-C add-back.
     The 2a add-back is Chapter VI-A Part C LESS 80P — the deduction section
     publishes exactly that figure as S.C.ded.partCForAMT (ded.js: partC−80P).
     Fall back to the raw Part-C total if that key is absent (a firm has no
     80P, so the two coincide). s80P is derived only for the published record. */
  const partCtot=Math.max(0,R(DED.partC!=null?DED.partC:(DED.PartCchapterVIA||0)));
  const partCForAMT=Math.max(0,R(DED.partCForAMT!=null?DED.partCForAMT:partCtot));
  const s80P=Math.max(0,R(partCtot-partCForAMT));
  /* income at special rates and specified-business profit — the 2a cap terms */
  const splInc=Math.max(0,R(SI.totInc!=null?SI.totInc:(SI.income||0)));
  const specBusProfit=Math.max(0,R((BP.c&&BP.c.C48!=null)?BP.c.C48:(BP.specified!=null?BP.specified:0)));

  /* sl.1 — total income as per item 13 of Part B-TI, = round10(MAX(0, GTI − VI-A − 10AA))
     [J4]/Sheet8b.TotalIncome; Part B-TI L45 rounds to the nearest ten. (The
     specified-business-loss route that lets sl.1 go negative — Amt_condn/B27 —
     is not separately modelled; sl.1 floors at 0 in that rare case.) */
  const ti=New?0:Math.max(0,Math.round((gti-viaAllowed-us10AA)/10)*10);

  /* 2a [H6] = MAX(0, MIN(GTI − splRateInc − specifiedBusProfit, PartC − 80P)) */
  const add2a=New?0:Math.max(0,Math.min(gti-splInc-specBusProfit,partCForAMT));
  /* 2b [H7] = the section-10AA deduction (MIN of 10AA-unit income and the 10AA deduction) */
  const add2b=New?0:us10AA;
  /* 2c [H8] = user input (35AD net of depreciation); prefilled from Sch BP 35AD */
  const d35ADdef=Math.max(0,R(BP.ded35AD||0));
  const add2c=New?0:(st0(S.amt.d35AD)!==""?Math.max(0,R(N(S.amt.d35AD))):d35ADdef);
  /* 2d [H9] = 2a + 2b + 2c */
  const add2d=New?0:R(add2a+add2b+add2c);

  /* sl.3 [J10] = MAX(0, sl.1 + 2d) */
  const adjusted=New?0:Math.max(0,R(ti+add2d));
  /* 3a [J11] IFSC units (input, ≤ sl.3); 3b [J12] = sl.3 − 3a */
  const ifsc=New?0:Math.max(0,Math.min(R(N(S.amt.ifsc)),adjusted));
  const other=New?0:R(adjusted-ifsc);

  /* the schedule is built only in the old regime when there are add-backs */
  const applies=!New && add2d>0;
  const floor=amtFloorApplies();
  const coop=amtIsCoop();
  const rate3b=coop?0.15:0.185;                          /* [N11]=18.5% / [N12]=15% */

  /* sl.4 [J13] — 9%·3a + rate·3b, floored to 0 for AOP/BOI/AJP when sl.3 ≤ ₹20L */
  let amt=0, payable=false;
  if(applies && !(floor && adjusted<=AMT_FLOOR)){
    amt=Math.max(0,R(0.09*ifsc + rate3b*Math.max(0,other)));   /* [N10] 9% IFSC + 3b rate */
    payable=amt>0;
  }

  /* AMT surcharge + cess (Part B-TTI 1b/1c) — best-effort, status-aware, pre
     marginal-relief (AMT.md defers the full slab helper to the tax engine).
     Surcharge only when sl.3 crosses the threshold (B23). */
  let sur=0;
  if(payable){
    let rt=0;
    if(!floor){                                           /* Firm / Local Authority */
      rt = adjusted>10000000?12:0;                        /* 12% above ₹1cr */
    } else if(coop){                                      /* co-operative society (status 14) */
      rt = adjusted>100000000?12:(adjusted>10000000?7:0); /* 7% >₹1cr, 12% >₹10cr */
    } else {                                              /* AOP/BOI / AJP */
      rt = adjusted>50000000?37:adjusted>20000000?25:adjusted>10000000?15:adjusted>5000000?10:0;
    }
    sur=R(amt*rt/100);
  }
  const cess=payable?R((amt+sur)*0.04):0;                 /* 4% health & education cess */
  const total=payable?R(amt+sur+cess):0;                  /* 1d — for the higher-of comparison */

  /* ── Schedule AMTC — the brought-forward credit pool (B1/B2/B3) ──
     Utilisation (col C/D) needs the normal-provisions tax (2i), which is not
     available inside compute() at this order; the pool is published here and
     amtcTable() finalises utilisation at render/export/checks time. */
  const rows=AMT_AMTC_YRS.map(y=>{const r=(S.amt.amtc||{})[y]||{};
    const g=Math.max(0,R(N(r.gross))), so=Math.max(0,R(N(r.setoff)));
    return {y, gross:g, setoff:so, bf:Math.max(0,g-so)};});  /* B3 [I·n] = MAX(B1−B2,0) */
  const creditAvail=R(rows.reduce((a,r)=>a+r.bf,0));      /* §115JD credit available (Σ B3) */

  /* ── publish the cross-section contract ── */
  S.C.amt={
    regime:New?"New":"Old", applies, payable, floor, coop, rate3b,
    ti:R(ti), partC:R(add2a), d10AA:R(add2b), d35AD:R(add2c), total2d:R(add2d),
    d35ADdef:R(d35ADdef),
    adjusted:R(adjusted), ifsc:R(ifsc), other:R(other),
    amt:R(amt), sur:R(sur), cess:R(cess), total:R(total),
    creditAvail, amtcRows:rows,
    /* consumed terms kept for the screen / checks */
    gti:R(gti), viaAllowed:R(viaAllowed), us10AA:R(us10AA), partCtot:R(partCtot), s80P:R(s80P),
    splInc:R(splInc), specBusProfit:R(specBusProfit)
  };
}

/* ── Schedule AMTC utilisation — reads S.C.amt (pool + 1d) and the tax
   section's normal-provisions liability (S.C.tax.gross = 2i). Safe from
   render / export / checks (they run after compute() has populated S.C.tax),
   never from engAmt. Utilises oldest year first, capped by item 3 and pool. */
function amtcTable(){
  const A=S.C.amt||{};
  const REG=(S.C&&S.C.regime)||{}; const New=(REG.anyConc!=null)?!!REG.anyConc:isNew();  /* A696: hold AMTC col C/D to 0 under ANY concessional regime (115BAC/115BAD/115BAE), not just 115BAC */
  const rows=(A.amtcRows||[]).map(r=>Object.assign({},r,{used:0,cf:r.bf}));
  const pool=R(A.creditAvail!=null?A.creditAvail:rows.reduce((a,r)=>a+r.bf,0)); /* Σ B3 */
  const tax115JC=R(A.total!=null?A.total:0);              /* item 1 [L4] = 1d of Part B-TTI */
  const taxOther=R((S.C.tax||{}).gross||0);               /* item 2 [L5] = 2i of Part B-TTI */
  const avail=Math.max(0,R(taxOther-tax115JC));           /* item 3 [L6] = MAX(0, 2−1) */
  let used=0, curr=0;
  if(!New){
    let cap=Math.min(avail,pool);                         /* col C cap: item 3 ∧ Σ B3 (E7 caption) */
    rows.forEach(r=>{const u=Math.min(cap,r.bf);r.used=u;r.cf=Math.max(0,r.bf-u);cap-=u;}); /* D=MAX(B3−C,0) */
    used=R(rows.reduce((a,r)=>a+r.used,0));               /* [J26] Σ col C */
    curr=Math.max(0,R(tax115JC-taxOther));                /* [G25] current-year credit generated */
  } else {
    rows.forEach(r=>{r.used=0;r.cf=0;});                  /* A696: col C & D = 0 in the new regime */
  }
  const gross=R(rows.reduce((a,r)=>a+r.gross,0));
  const setoff=R(rows.reduce((a,r)=>a+r.setoff,0));
  const bf=R(rows.reduce((a,r)=>a+r.bf,0));
  const cfTotal=R(rows.reduce((a,r)=>a+r.cf,0)+curr);     /* [K26] item 6 = Σ D + current-year cf */
  return {rows, New, pool, tax115JC, taxOther, avail, used, curr, gross, setoff, bf, cfTotal};
}

/* ---- renderer ---------------------------------------------------- */
function secAmt(){
  const A=S.C.amt||engAmt()||S.C.amt||{};
  const REG=(S.C&&S.C.regime)||{}; const New=(REG.anyConc!=null)?!!REG.anyConc:isNew();
  const r=(n,l,v,o)=>row(l,cell(v),Object.assign({ref:n},o||{}));
  let h="";

  h+=note("Alternate Minimum Tax (section 115JC) applies only under the <b>old regime</b>. "+
    "It is charged on the <b>adjusted total income</b> — the total income plus the deductions the "+
    "return claims under Chapter VI-A Part C (other than 80P), section 10AA and section 35AD — at "+
    "18.5% (15% for a co-operative society), or 9% on the income of units in an IFSC. Firms and "+
    "LLPs have no threshold; for an AOP/BOI or an artificial juridical person it applies only where "+
    "the adjusted total income exceeds &#8377;20,00,000. The tax you actually pay is the higher of "+
    "this and the normal tax; any excess of AMT over normal tax becomes a credit under section 115JD.");

  if(New){
    h+=note("The new tax regime (section 115BAC) is in force, so Schedule AMT does not apply and is left blank. "+
      "Any AMT credit brought forward can be recorded below but cannot be utilised or carried forward while the "+
      "new regime is opted (its utilised and carried-forward columns are held to zero).","warn");
  } else {
    /* ===== Schedule AMT ===== */
    h+=sub("Schedule AMT — Computation of Alternate Minimum Tax payable under section 115JC");
    h+=r("1","Total income as per item 13 of Part B-TI",A.ti||0);
    h+=sub("2 · Adjustment as per section 115JC(2)");
    h+=r("2a","Deduction under Chapter VI-A “C.—Deductions in respect of certain incomes” (other than 80P)",A.partC||0,{ind:1,hint:"capped at gross total income net of special-rate and specified-business income"});
    h+=r("2b","Deduction claimed under section 10AA",A.d10AA||0,{ind:1});
    h+=row("2c · Deduction under section 35AD, reduced by the depreciation on those assets",inp("amt.d35AD",{n:1}),{ref:"2c",ind:1,hint:A.d35ADdef?("Schedule BP 35AD is "+RS(A.d35ADdef)+" — enter it net of depreciation"):"enter the 35AD deduction net of depreciation on those assets"});
    h+=r("2d","Total adjustment (2a + 2b + 2c)",A.total2d||0,{cls:"tot"});
    h+=r("3","Adjusted total income under section 115JC(1) (1 + 2d)",A.adjusted||0,{cls:"grand"});
    h+=row("3a · Adjusted total income of units located in an IFSC, if any",inp("amt.ifsc",{n:1}),{ref:"3a",ind:1,hint:"taxed at 9%; cannot exceed item 3"});
    h+=r("3b","Adjusted total income of other units (3 − 3a)",A.other||0,{ind:1,hint:(A.coop?"15%":"18.5%")+" for this status"});
    h+=r("4","Tax payable under section 115JC [9% of 3a + "+(A.coop?"15%":"18.5%")+" of 3b]",A.amt||0,{cls:"tot"});
    if(A.applies && !A.payable && A.floor && (A.adjusted||0)<=AMT_FLOOR)
      h+=note("Adjusted total income is within &#8377;20,00,000, so no AMT is payable for an AOP/BOI or artificial juridical person.");
    else if(!A.applies)
      h+=note("Schedule AMT is not filled — no Chapter VI-A Part C, section 10AA or section 35AD deduction is claimed, so there is no adjustment under section 115JC(2).");
    else if(A.payable)
      h+=note("Tax under section 115JC is "+RS(A.total||A.amt)+" (including surcharge "+RS(A.sur||0)+" and cess "+RS(A.cess||0)+"); the tax section pays the higher of this and the normal tax.");
  }

  /* ===== Schedule AMTC ===== */
  const T=amtcTable();
  h+=sub("Schedule AMTC — Computation of tax credit under section 115JD");
  h+=r("1","Tax under section 115JC in A.Y. 2026-27 (1d of Part B-TTI)",T.tax115JC||0);
  h+=r("2","Tax under other provisions in A.Y. 2026-27 (2g of Part B-TTI)",T.taxOther||0);
  h+=r("3","Amount of tax against which credit is available (2 − 1, if 2 > 1, else 0)",T.avail||0,{cls:"tot"});
  h+=note("Enter, for each earlier assessment year, the gross AMT credit and any set-off already taken in earlier years. "+
    "The credit utilised this year is the balance brought forward set against item 3, oldest year first, and cannot exceed "+
    "item 3 or the total balance brought forward.");
  h+='<div class="full"><table class="gt" style="min-width:960px"><thead>'+
     '<tr><th class="l" style="width:34px">Sl.</th><th class="l" style="width:90px">Assessment year (A)</th>'+
     '<th style="width:140px">Gross (B1)</th><th style="width:170px">Set off in earlier years (B2)</th>'+
     '<th style="width:150px">Balance b/f (B3)=B1−B2</th><th style="width:150px">Utilised (C)</th>'+
     '<th style="width:150px">Carried fwd (D)=B3−C</th></tr></thead><tbody>';
  const ROMAN=["i","ii","iii","iv","v","vi","vii","viii","ix","x","xi","xii","xiii","xiv"];
  T.rows.forEach((x,i)=>{
    h+='<tr><td class="l">'+ROMAN[i]+'</td><td class="l">'+esc(x.y)+'</td>'+
      '<td>'+inp("amt.amtc."+x.y+".gross",{n:1})+'</td>'+
      '<td>'+inp("amt.amtc."+x.y+".setoff",{n:1})+'</td>'+
      '<td class="num">'+cell(x.bf)+'</td><td class="num">'+cell(x.used)+'</td><td class="num">'+cell(x.cf)+'</td></tr>';
  });
  h+='<tr><td class="l">xv</td><td class="l">'+AMT_CUR_AY+' (current)</td>'+
     '<td class="num">'+cell(T.curr)+'</td><td></td><td class="num">'+cell(T.curr)+'</td>'+
     '<td></td><td class="num">'+cell(T.New?0:T.curr)+'</td></tr>';
  h+='</tbody><tfoot><tr><td class="l" colspan="2">Total</td><td>'+F(T.gross+T.curr)+'</td><td>'+F(T.setoff)+'</td>'+
     '<td>'+F(T.bf+T.curr)+'</td><td>'+F(T.used)+'</td><td>'+F(T.cfTotal)+'</td></tr></tfoot></table></div>';
  h+=r("5","Tax credit under section 115JD utilised during the year — total of 4(C) → item 4 of Part B-TTI",T.used||0,{cls:"tot"});
  h+=r("6","AMT liability available for credit in subsequent years — total of 4(D)",T.cfTotal||0,{cls:"tot"});
  if(New)h+=note("Under the new regime the credit utilised (C) and carried forward (D) are held to zero (rule A696).","warn");

  return h;
}

/* ---- export ------------------------------------------------------ */
function expAmt(j){
  const A=S.C.amt||{};

  /* ---- Schedule AMT — old regime, when there is an adjustment ---- */
  if(A.applies){
    const o={};
    put(o,"TotalIncItem13",sg(A.ti));                     /* required; may be negative (no minimum) */
    o.AdjustmentSec115JC=[{                               /* array, single item (index 0) */
      DeductClaimSec6A:n0(A.partC),
      DeductClaimSec10AA:n0(A.d10AA),
      DeductClaimSec35AD:n0(A.d35AD),
      Total:n0(A.total2d)}];
    put(o,"AdjustedUnderSec115JC",n0(A.adjusted));
    put(o,"AdjustedUnderSec115JCIFSC",n0(A.ifsc));
    put(o,"AdjustedUnderSec115JCOther",sg(A.other));      /* may be negative (minimum −99999999999999) */
    put(o,"TaxPayableUnderSec115JC",n0(A.amt));
    j.ScheduleAMT=o;
  }

  /* ---- Schedule AMTC — whenever prior credit, current-year credit or headroom exists ---- */
  const T=amtcTable();
  const dtls=(T.rows||[]).filter(r=>r.gross||r.setoff||r.used||r.cf);
  if(dtls.length || T.curr){          /* only when there is actual credit (prior rows or generated this year) */
    const o={};
    put(o,"TaxSection115JC",n0(T.tax115JC));
    put(o,"TaxOthProvisions",n0(T.taxOther));
    put(o,"AmtTaxCreditAvailable",n0(T.avail));
    put(o,"CurrAssYr",AMT_CUR_AY);
    put(o,"CurrYrAmtCreditFwd",n0(T.curr));               /* [G25] */
    put(o,"CurrYrCreditBalBF",n0(T.curr));                /* [I25] */
    put(o,"CurrYrCreditCarryFwd",n0(T.New?0:T.curr));     /* [K25] 0 in new regime */
    put(o,"TotAMTGross",n0(T.gross+T.curr));              /* [G26]=SUM(G10:G25) incl current-year */
    put(o,"TotSetOffEys",n0(T.setoff));                   /* [H26] */
    put(o,"TotBalBF",n0(T.bf+T.curr));                    /* [I26]=SUM(I10:I25) incl current-year B3 */
    put(o,"TotAmtCreditUtilisedCY",n0(T.used));           /* [J26] */
    put(o,"TotBalAMTCreditCF",n0(T.cfTotal));             /* [K26] */
    put(o,"TaxSection115JD",n0(T.used));                  /* item 5 [K27] */
    put(o,"AmtLiabilityAvailable",n0(T.cfTotal));         /* item 6 [K28] */
    if(dtls.length) o.ScheduleAMTCDtls=dtls.map(r=>{
      const d={AssYr:r.y, AmtCreditFwd:n0(r.gross)};
      if(r.setoff) d.AmtCreditSetOfEy=n0(r.setoff);       /* optional (not in required) */
      d.AmtCreditBalBroughtFwd=n0(r.bf);
      d.AmtCreditUtilized=n0(r.used);
      d.BalAmtCreditCarryFwd=n0(r.cf);
      return d;});
    j.ScheduleAMTC=o;
  }
}

/* ---- import (inverse) — restore only the user inputs; everything else recomputes */
function impAmt(I5){
  const read=[];
  S.amt=S.amt||{};
  const AMT=I5 && I5.ScheduleAMT;
  if(AMT){
    const adj=Array.isArray(AMT.AdjustmentSec115JC)?(AMT.AdjustmentSec115JC[0]||{}):(AMT.AdjustmentSec115JC||{});
    S.amt.d35AD=nz(adj.DeductClaimSec35AD);               /* 2c input */
    S.amt.ifsc =nz(AMT.AdjustedUnderSec115JCIFSC);        /* 3a input */
    read.push("Schedule AMT");
  }
  const AC=I5 && I5.ScheduleAMTC;
  if(AC){
    S.amt.amtc={};
    (AC.ScheduleAMTCDtls||[]).forEach(r=>{
      if(!r||!r.AssYr) return;
      S.amt.amtc[r.AssYr]={gross:nz(r.AmtCreditFwd), setoff:nz(r.AmtCreditSetOfEy)};
    });
    read.push("Schedule AMTC");
  }
  return read;
}

/* ---- checks ------------------------------------------------------ */
function chkAmt(){
  const out=[], A=S.C.amt||{};
  const add=(l,t,m)=>out.push({lvl:l,t,m,sec:"amt"});
  const New=isNew();

  /* AMT is closed by the new regime (AMT.md new-regime gate) */
  if(New && ((A.partCtot||0)||(A.us10AA||0)||st0(S.amt.d35AD)!==""))
    add("warn","Schedule AMT closed by the new regime",
      "The Chapter VI-A Part C, section 10AA and section 35AD add-backs are ignored — section 115JC does not apply under the new tax regime (section 115BAC).");
  else if(A.applies && A.payable)
    add("ok","Alternate minimum tax applies",
      "Adjusted total income "+RS(A.adjusted)+" yields tax under section 115JC of "+RS(A.total||A.amt)+"; the tax section pays the higher of this and the normal tax.");
  else if(A.applies && A.floor && (A.adjusted||0)<=AMT_FLOOR)
    add("ok","No AMT — within the ₹20-lakh threshold",
      "Adjusted total income "+RS(A.adjusted)+" is within &#8377;20,00,000, so no AMT is payable for an AOP/BOI or artificial juridical person.");

  /* 3a (IFSC units) cannot exceed sl.3 (A686) */
  if(!New && N(S.amt.ifsc)>(A.adjusted||0))
    add("err","Schedule AMT · IFSC units",
      "The adjusted total income of IFSC units (3a) cannot exceed the adjusted total income at item 3 ("+RS(A.adjusted)+").");

  /* Schedule AMTC — set-off in earlier years for A.Y. 2025-26 is not allowed (A693) */
  const r2526=(S.amt.amtc||{})["2025-26"]||{};
  if(N(r2526.setoff)>0)
    add("err","Schedule AMTC · A.Y. 2025-26",
      "Set off in earlier assessment years (column B2) cannot be claimed for A.Y. 2025-26.");

  /* each AMTC row: set-off cannot exceed the gross credit */
  AMT_AMTC_YRS.forEach(y=>{const r=(S.amt.amtc||{})[y]||{};
    if(N(r.setoff)>N(r.gross))
      add("err","Schedule AMTC · "+y,
        "Set off in earlier years ("+RS(N(r.setoff))+") cannot exceed the gross AMT credit ("+RS(N(r.gross))+").");});

  const T=amtcTable();
  if(New && (T.gross||T.setoff))
    add("warn","AMT credit under the new regime",
      "Under the new regime the AMT credit cannot be utilised or carried forward — columns C and D are held to zero.");
  else if((T.used||0)>0)
    add("ok","AMT credit utilised",
      RS(T.used)+" of section-115JD credit is set off this year; "+RS(T.cfTotal)+" carries forward.");

  return out;
}

/* ---- register ---------------------------------------------------- */
reg({id:"amt", t:"Alternate Minimum Tax and credit", ref:"AMT · AMTC",
  f:secAmt,
  s:()=>{const A=S.C.amt||{}; const T=(typeof amtcTable==="function")?amtcTable():{};
    const bits=[];
    if(A.applies && A.payable) bits.push("AMT "+CR(A.total||A.amt));
    if(T.used) bits.push("credit "+CR(T.used));
    return bits.join(" · ")||(isNew()?"Not under the new regime":"");},
  eng:engAmt, exp:expAmt, imp:impAmt, chk:chkAmt, order:54, corder:54});
