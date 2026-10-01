/* =====================================================================
   ITR-6 · Section "other" — Other schedules
     Schedule IF   (ScheduleIF)      — investment in unincorporated entities
     Schedule PTI  (SchedulePTI)     — pass-through income (115U/115UA/115UB)
     Schedule TPSA (ScheduleTPSA)    — tax on secondary adjustments 92CE(2A)
     Schedule 115TD(Schedule115TD)   — accreted income + 115TE interest
     Schedule GST  (ScheduleGST)     — turnover/gross receipt reported for GST
     Schedule FD   (ScheduleFD)      — foreign-currency payments/receipts (non-audit)
   Books: books/ITR-6/{IF,PTI,TPSA,Schedule_115TD,GST,FD}.md
   Structural template: forms/ITR-3/src/70_sec_other.js (pattern only —
   every field/number/formula here is from the ITR-6 books).
   Compute order 11 (screen order 15; among the disclosure schedules, after
   the income heads). These schedules are disclosures / additional-tax
   computations — none adds to Gross Total Income, so S.C.other.income = 0.

   CROSS-SECTION SCALARS PUBLISHED into S.C.other (guarded reads by consumers):
     if:            [] computed IF entities (per-entity name/pan/profit/interest/capbal)
     ifProfitShare  Σ ProfitShareAmt   -> Schedule BP A5a/A5b cap (rule 827)
     ifInterest     Σ IntrstAmtDueOrRecv -> statement of P&L 14xib (rule B10)
     ifCapBal       Σ FirmCapBalOn31Mar
     pti:           [] computed PTI blocks (head objects, ITR-3-shaped so the
                    HP/OS/CG/SI/EI builders read each net the same way)
     ptiExemptTotal Σ exempt net -> Schedule EI Sl. No. 5 (PassThrIncNotChrgblTax, rule 646)
     ptiHP          Σ i·HP net   -> Schedule HP item 2 (rule 186)
     ptiOSDiv/ptiOSOth Σ OS nets -> Schedule OS 2 (rules 469/487)
     tpsaNet        ScheduleTPSA item 4 (net additional tax) -> Part B-TTI
     td115Net       Schedule 115TD item 12 NetPaybleRefble -> Part B-TTI Sl. 13 (rules 779/780)
     td115AddIncInt Schedule 115TD item 10 (7+8)
   CONSUMES: none required (all reads are of this section's own state); the
   FD/TPSA audit-flag reads of the gen/accounts sections are guarded and
   optional.
   ===================================================================== */

/* ---- state ------------------------------------------------------- */
S.other = S.other || {
  /* Schedule IF — repeatable, one object per unincorporated entity */
  if:[],
  /* Schedule PTI — repeatable, one object per business trust / investment fund */
  pti:[],
  /* Schedule TPSA — one primary-adjustment figure + a challan table */
  tpsa:{ adj:"", challans:[] },
  /* Schedule 115TD — accreted-income computation + a deposit table.
     addtax (item 7) and interest (item 8) are entered figures — see note. */
  td:{ fmv:"", liab:"", fmv4i:"", fmv4ii:"", fmv4iii:"", liab4:"",
       addtax:"", interest:"", specdate:"", challans:[] },
  /* Schedule GST — repeatable, one row per GSTIN */
  gst:[],
  /* Schedule FD — four fixed foreign-currency lines (non-audit filer) */
  fd:{ payCap:"", payRev:"", rcptCap:"", rcptRev:"" }
};

/* SEED defaults for new repeatable rows (the shell add-handler also keeps
   its own SEED map keyed by the last path segment). */
SEED["other.if"]           = SEED["other.if"]           || {};
SEED["other.pti"]          = SEED["other.pti"]          || {};
SEED["other.gst"]          = SEED["other.gst"]          || {};
SEED["other.tpsa.challans"]= SEED["other.tpsa.challans"]|| {};
SEED["other.td.challans"]  = SEED["other.td.challans"]  || {};

/* dropdown value lists (from the books) */
const OTH_YN      = [["Yes","Yes"],["No","No"]];                       /* IF audit / 92E flags */
/* PTI entity covered — book dropdown "(Select)/Section 115U/115UA/115UB";
   the schema leaf InvstmntCvrdUs115UA115UB stores the display string. */
const OTH_PTIKIND = [["Section 115U","Section 115U"],
                     ["Section 115UA","Section 115UA"],
                     ["Section 115UB","Section 115UB"]];

/* Is this a company liable to audit u/s 44AB? Schedule FD is filled only by a
   NON-audit filer (book heading). The 44AB flag lives in the gen section
   (PartA_GEN2For6.LiableSec44ABflg). Guarded read; when unknown, treat the
   filer as non-audit so the FD card is offered. */
const oth_audited = ()=>{
  const g = S.gen||{}, A = g.aud||{};
  const v = st0(A.sec44AB||"");
  return v==="Y" || v==="Yes";
};
/* Part A-OI "impermissible avoidance arrangement (section 96)" = Yes requires
   TPSA (rule 693). Owned by the accounts section; guarded read for a screen
   hint only (the department rule itself is Phase 6). */
const oth_s96 = ()=>{
  const a = S.accounts||{};
  const v = st0(a.s96||a.impermissibleAvoid||"");
  return v==="Y" || v==="Yes";
};

/* ---- engine ------------------------------------------------------ */
function engOther(){
  S.other = S.other || {};
  const O = S.other;
  const C = S.C.other = { income:0 };

  /* ---------- Schedule IF (book IF.md) ---------- */
  const ifRows = (O.if||[]).map(r=>{
    r = r||{};
    const profit = R(r.profit), interest = Math.max(0,R(r.interest)), capbal = R(r.capbal);
    const pct = N(r.pct);
    const hasVal = !!(st0(r.name)||st0(r.ftype)||st0(r.pan)||profit||interest||capbal||pct);
    return { name:st0(r.name), ftype:st0(r.ftype), pan:st0(r.pan).toUpperCase(),
             audit:st0(r.audit), sec92e:st0(r.sec92e), pct:pct,
             profit:profit, interest:interest, capbal:capbal, hasVal:hasVal };
  });
  const ifTot = { profit:0, interest:0, capbal:0 };
  ifRows.forEach(x=>{ ifTot.profit+=x.profit; ifTot.interest+=x.interest; ifTot.capbal+=x.capbal; });
  C.if = ifRows;
  C.ifTot = ifTot;
  C.ifProfitShare = ifTot.profit;   /* -> BP A5a/A5b cap (rule 827) */
  C.ifInterest    = ifTot.interest; /* -> P&L 14xib (rule B10) */
  C.ifCapBal      = ifTot.capbal;

  /* ---------- Schedule PTI (book PTI.md) ---------- */
  /* col 9 = 7 - 8 on HP and each CG leaf; OS/exempt leaves carry no loss col.
     iia = ai+aii, iib = bi+bii, iii = a+b, iv = a+b+c (rules 661-665). */
  const leaf  = r => { r=r||{}; const inc=R(r.inc), loss=R(r.loss), tds=Math.max(0,R(r.tds));
                       return { inc, loss, net:inc-loss, tds }; };          /* col 9 = 7-8 */
  const leaf3 = r => { r=r||{}; const inc=R(r.inc), tds=Math.max(0,R(r.tds));
                       return { inc, net:inc, tds }; };                     /* no loss col */
  const add4  = (a,b)=>({ inc:a.inc+b.inc, loss:a.loss+b.loss, net:a.net+b.net, tds:a.tds+b.tds });
  const add3  = (a,b)=>({ inc:a.inc+b.inc, net:a.net+b.net, tds:a.tds+b.tds });
  C.pti = (O.pti||[]).map(b=>{
    b = b||{};
    const hp     = leaf(b.hp);
    const st111a = leaf(b.st111a), stOth = leaf(b.stOth);
    const lt112a = leaf(b.lt112a), ltOth = leaf(b.ltOth);
    const stAgg  = add4(st111a, stOth);     /* iia = ai + aii (rule 662) */
    const ltAgg  = add4(lt112a, ltOth);     /* iib = bi + bii (rule 663) */
    const osDiv  = leaf3(b.osDiv), osOth = leaf3(b.osOth);
    const osAgg  = add3(osDiv, osOth);      /* iii = a + b (rule 664) */
    const ex23   = leaf3(b.ex23fbb);
    const exB    = leaf3(b.exB); exB.code = st0(b.exBcode);
    const exC    = leaf3(b.exC); exC.code = st0(b.exCcode);
    const exTot  = { inc:ex23.inc+exB.inc+exC.inc, net:ex23.net+exB.net+exC.net,
                     tds:ex23.tds+exB.tds+exC.tds };   /* iv = a + b + c (rule 665) */
    const hasVal = !!(st0(b.name)||st0(b.pan)||st0(b.kind)||
                      hp.inc||hp.loss||stAgg.inc||ltAgg.inc||osAgg.inc||exTot.inc);
    return { kind:st0(b.kind), name:st0(b.name), pan:st0(b.pan).toUpperCase(),
             hp, st111a, stOth, lt112a, ltOth, stAgg, ltAgg,
             osDiv, osOth, osAgg, ex23, exB, exC, exTot, hasVal };
  });
  /* published totals for the head schedules */
  C.ptiExemptTotal = C.pti.reduce((a,b)=>a+R(b.exTot.net), 0);   /* -> EI Sl.5 (rule 646) */
  C.ptiHP          = C.pti.reduce((a,b)=>a+R(b.hp.net), 0);      /* -> HP item 2 (rule 186) */
  C.ptiOSDiv       = C.pti.reduce((a,b)=>a+R(b.osDiv.net), 0);   /* -> OS 2 dividend (rule 469) */
  C.ptiOSOth       = C.pti.reduce((a,b)=>a+R(b.osOth.net), 0);   /* -> OS 2 others (rule 487) */

  /* ---------- Schedule TPSA (book TPSA.md) ---------- */
  {
    const T = O.tpsa || {};
    const adj  = R(T.adj);                                  /* item 1 (typed) */
    const tax2a = R(adj * 0.18);                            /* 2a = 18% of 1 (rule 687) */
    const sur2b = R(tax2a * 0.12);                          /* 2b = 12% of 2a (rule 688) */
    const cess2c = R((tax2a + sur2b) * 0.04);               /* 2c = 4% of (2a+2b) (rule 689) */
    const tot2d = tax2a + sur2b + cess2c;                   /* 2d = 2a+2b+2c (rule 690) */
    const chal  = (T.challans||[]).map(c=>({ bsr:st0((c||{}).bsr), bank:st0((c||{}).bank),
                     date:st0((c||{}).date), srl:st0((c||{}).srl), amt:Math.max(0,R((c||{}).amt)) }));
    const paid3 = chal.reduce((a,c)=>a+c.amt, 0);           /* item 3 = Σ challans (rule 691) */
    const net4  = tot2d - paid3;                            /* item 4 = 2d - 3 (rule 692) */
    C.tpsa = { adj, tax2a, sur2b, cess2c, tot2d, paid3, net4, challans:chal,
               has:!!(adj || chal.length) };
    C.tpsaNet = net4;                                       /* -> Part B-TTI */
  }

  /* ---------- Schedule 115TD (book Schedule_115TD.md) ---------- */
  {
    const D6 = O.td || {};
    const fmv1   = R(D6.fmv);                               /* item 1 (typed) */
    const liab2  = R(D6.liab);                              /* item 2 (typed) */
    const net3   = fmv1 - liab2;                            /* item 3 = 1-2 (rule 695) */
    const f4i    = R(D6.fmv4i), f4ii = R(D6.fmv4ii), f4iii = R(D6.fmv4iii);
    const tot4iv = f4i + f4ii + f4iii;                      /* item 4iv (rule 696) */
    const liab4  = R(D6.liab4);                             /* item 5 (typed) */
    const acc6   = net3 - (tot4iv - liab4);                 /* item 6 = 3-(4iv-5) (rule 697) */
    const addtax7 = Math.max(0,R(D6.addtax));               /* item 7 (entered — MMR tax) */
    const int8    = Math.max(0,R(D6.interest));             /* item 8 (entered — 115TE) */
    const pay10   = addtax7 + int8;                         /* item 10 = 7+8 */
    const chal    = (D6.challans||[]).map(c=>({ date:st0((c||{}).date), bank:st0((c||{}).bank),
                      bsr:st0((c||{}).bsr), srl:st0((c||{}).srl), amt:Math.max(0,R((c||{}).amt)) }));
    const paid11  = chal.reduce((a,c)=>a+c.amt, 0);         /* item 11 = Σ challans */
    const net12   = Math.max(0, pay10 - paid11);            /* item 12 = 10-11, floor 0 (rule 698) */
    C.td = { fmv1, liab2, net3, f4i, f4ii, f4iii, tot4iv, liab4, acc6:acc6,
             addtax7, int8, pay10, paid11, net12, specdate:st0(D6.specdate), challans:chal,
             has:!!(fmv1 || liab2 || tot4iv || acc6 || addtax7 || int8 || chal.length) };
    C.td115AddIncInt = pay10;                               /* item 10 */
    C.td115Net       = net12;                               /* item 12 -> Part B-TTI Sl.13 (rule 779) */
  }

  /* ---------- Schedule GST (book GST.md) ---------- */
  C.gst = (O.gst||[]).map(r=>({ gstin:st0((r||{}).gstin), amt:R((r||{}).amt),
                                has:!!(st0((r||{}).gstin) || R((r||{}).amt)) }));

  /* ---------- Schedule FD (book FD.md) ---------- */
  {
    const F = O.fd || {};
    const payCap = R(F.payCap), payRev = R(F.payRev), rcptCap = R(F.rcptCap), rcptRev = R(F.rcptRev);
    C.fd = { payCap, payRev, rcptCap, rcptRev,
             has:!!(payCap || payRev || rcptCap || rcptRev), audited:oth_audited() };
  }

  /* disclosures only — nothing added to GTI here */
  C.income = 0;
}

/* ---- renderer ---------------------------------------------------- */
function secOther(){
  const O = S.other||{}, C = S.C.other||{};
  let h = "";

  /* ===== Schedule IF ===== */
  {
    let b = note("Information regarding investment in unincorporated entities — a company that is a partner in a firm, or holds an investment in an LLP / AOP / BOI, discloses one line per entity. The share of profit is generally exempt (taxed in the entity's hands); the interest is business income. This schedule is the source that Schedule BP item A5a/A5b reconciles against (rule 827), and the interest column ties to statement of P&L item 14xib (rule B10).");
    const rows = O.if||[];
    const cr = C.if||[];
    rows.forEach((raw,i)=>{
      const cb = cr[i] || {};
      const pre = "other.if."+i+".";
      const title = "Entity " + (i+1) + (st0(raw.name)?" — "+esc(st0(raw.name)):"");
      let inner = "";
      inner += row("Name of the entity", inp(pre+"name",{max:125}), {req:1, ref:"FirmName"});
      inner += row("Type of the entity", inp(pre+"ftype",{max:125}), {req:1, ref:"FirmType"});
      inner += row("PAN of the entity", inp(pre+"pan",{max:10}), {req:1, ref:"FirmPAN"});
      inner += row("Whether the entity is liable for audit?", sel(pre+"audit", OTH_YN), {ref:"IsLiableToAudit"});
      inner += row("Whether section 92E is applicable to the entity?", sel(pre+"sec92e", OTH_YN), {ref:"Sec92EFirmFlag"});
      inner += row("Percentage share in the profit of the entity", inp(pre+"pct",{n:1}), {req:1, ref:"ProfitSharePercent", hint:"0 to 100"});
      inner += row("i · Amount of share in the profit", inp(pre+"profit",{n:1}), {req:1, ref:"ProfitShareAmt"});
      inner += row("ii · Amount of interest due or received", inp(pre+"interest",{n:1}), {ref:"IntrstAmtDueOrRecv"});
      inner += row("iii · Capital balance as on 31st March in the entity", inp(pre+"capbal",{n:1}), {req:1, ref:"FirmCapBalOn31Mar"});
      b += blk("if"+i, title, (cb.hasVal?"Entered":"Empty"), inner, "other.if."+i);
    });
    b += '<button class="add" data-add="other.if">Add an entity</button>';
    const T = C.ifTot||{};
    b += row("Total amount of share in profit (Σ i)", cell(T.profit), {ref:"TotalProfitShareAmt"});
    b += row("Total capital balance as on 31st March (Σ iii)", cell(T.capbal), {ref:"TotalFirmCapBalOn31Mar"});
    b += row("Total interest due or received (→ P&L 14xib, rule B10)", cell(T.interest), {});
    h += card("if","Schedule IF — Investment in unincorporated entities",
              ((C.if||[]).some(x=>x.hasVal)?(C.if||[]).filter(x=>x.hasVal).length+" entity(ies)":""), b);
  }

  /* ===== Schedule PTI ===== */
  {
    let b = note("Pass-through income from a business trust (REIT/InvIT) or investment fund (AIF/VCF) under sections 115U / 115UA / 115UB. Each head's net (col 9 = 7 − 8) reappears in that head's own schedule (HP item 2, OS Sl.2, Schedule CG / SI special rates); the exempt total (iv) flows to Schedule EI Sl. No. 5; column 10 TDS flows to Schedule TDS.");
    const blocks = C.pti || [];
    (O.pti||[]).forEach((raw,i)=>{
      const cb = blocks[i] || {};
      const pre = "other.pti."+i+".";
      const title = "Trust / fund " + (i+1) + (st0(raw.name)?" — "+esc(st0(raw.name)):"");
      let inner = "";
      inner += row("Investment entity covered by section", sel(pre+"kind", OTH_PTIKIND), {req:1, ref:"(2)"});
      inner += row("Name of business trust / investment fund", inp(pre+"name",{max:125}), {req:1, ref:"(3)"});
      inner += row("PAN of business trust / investment fund", inp(pre+"pan",{max:10}), {req:1, ref:"(4)"});
      const money4 = (k,lbl,ind)=> '<tr><td class="l"'+(ind?' style="padding-left:'+ind+'px"':'')+'>'+esc(lbl)+'</td>'+
        '<td>'+inp(pre+k+".inc",{n:1})+'</td><td>'+inp(pre+k+".loss",{n:1})+'</td>'+
        '<td class="num">'+cell((cb[k]||{}).net)+'</td><td>'+inp(pre+k+".tds",{n:1})+'</td></tr>';
      const money3 = (k,lbl,ind)=> '<tr><td class="l"'+(ind?' style="padding-left:'+ind+'px"':'')+'>'+esc(lbl)+'</td>'+
        '<td>'+inp(pre+k+".inc",{n:1})+'</td><td class="num">'+cell(0)+'</td>'+
        '<td class="num">'+cell((cb[k]||{}).net)+'</td><td>'+inp(pre+k+".tds",{n:1})+'</td></tr>';
      const aggRow = (lbl,o,ind)=> '<tr><td class="l"'+(ind?' style="padding-left:'+ind+'px"':'')+'><b>'+esc(lbl)+'</b></td>'+
        '<td class="num">'+cell((o||{}).inc)+'</td><td class="num">'+cell((o||{}).loss!==undefined?(o||{}).loss:0)+'</td>'+
        '<td class="num">'+cell((o||{}).net)+'</td><td class="num">'+cell((o||{}).tds)+'</td></tr>';
      let t = '<div class="full"><table class="gt" style="min-width:660px"><thead><tr>'+
        '<th class="l">Head of income (6)</th><th>Current year income (7)</th>'+
        '<th>Share of loss distributed (8)</th><th>Net income/loss 9=7−8 (9)</th>'+
        '<th>TDS (10)</th></tr></thead><tbody>';
      t += money4("hp","i · House property");
      t += '<tr><td class="l" colspan="5"><b>ii · Capital Gains</b></td></tr>';
      t += aggRow("a · Short term (iia = ai + aii)", cb.stAgg, 20);
      t += money4("st111a","ai · Section 111A", 36);
      t += money4("stOth","aii · Others", 36);
      t += aggRow("b · Long term (iib = bi + bii)", cb.ltAgg, 20);
      t += money4("lt112a","bi · Section 112A", 36);
      t += money4("ltOth","bii · Sections other than 112A", 36);
      t += '<tr><td class="l" colspan="5"><b>iii · Other Sources (iii = a + b)</b></td></tr>';
      t += aggRow("Other Sources total", cb.osAgg, 20);
      t += money3("osDiv","a · Dividend", 36);
      t += money3("osOth","b · Others", 36);
      t += '<tr><td class="l" colspan="5"><b>iv · Income claimed to be exempt (iv = a + b + c)</b></td></tr>';
      t += aggRow("Exempt total", cb.exTot, 20);
      t += money3("ex23fbb","a · u/s 10(23FBB)", 36);
      t += '</tbody></table></div>';
      t += row("iv b · Exempt u/s (specify section code)", inp(pre+"exBcode",{max:15}), {ref:"(iv b)"});
      t += '<div class="full"><table class="gt" style="min-width:520px"><tbody>'+
        '<tr><td class="l">Amount</td><td>'+inp(pre+"exB.inc",{n:1})+'</td>'+
        '<td class="l">TDS</td><td>'+inp(pre+"exB.tds",{n:1})+'</td></tr></tbody></table></div>';
      t += row("iv c · Exempt u/s (specify section code)", inp(pre+"exCcode",{max:15}), {ref:"(iv c)"});
      t += '<div class="full"><table class="gt" style="min-width:520px"><tbody>'+
        '<tr><td class="l">Amount</td><td>'+inp(pre+"exC.inc",{n:1})+'</td>'+
        '<td class="l">TDS</td><td>'+inp(pre+"exC.tds",{n:1})+'</td></tr></tbody></table></div>';
      inner += t;
      b += blk("pti"+i, title, (cb.hasVal?"Entered":"Empty"), inner, "other.pti."+i);
    });
    b += '<button class="add" data-add="other.pti">Add a trust / fund</button>';
    h += card("pti","Schedule PTI — Pass-through income (115U / 115UA / 115UB)",
              (blocks.some(x=>x.hasVal)?blocks.filter(x=>x.hasVal).length+" block(s)":""), b);
  }

  /* ===== Schedule TPSA ===== */
  {
    const T = C.tpsa || {};
    let b = note("Tax on secondary adjustments u/s 92CE(2A): where a transfer-pricing primary adjustment left excess money with the associated enterprise that was not repatriated in time, an additional tax of 18% (plus 12% surcharge and 4% health & education cess) may be paid in lieu of the secondary adjustment.");
    if(oth_s96())
      b += note("Part A-OI's 'impermissible avoidance arrangement (section 96)' answer is Yes — Schedule TPSA is expected to be filled (rule 693).","warn");
    b += row("1 · Amount of primary adjustment on which option u/s 92CE(2A) is exercised (total across all AYs)",
             inp("other.tpsa.adj",{n:1}), {ref:"[D4]", req:1});
    b += row("2a · Additional income tax payable @ 18% on item 1", cell(T.tax2a), {ref:"[D8]"});
    b += row("2b · Surcharge @ 12% on 2a", cell(T.sur2b), {ref:"[D9]"});
    b += row("2c · Health & Education cess @ 4% on (2a + 2b)", cell(T.cess2c), {ref:"[D10]"});
    b += row("2d · Total additional tax payable (2a + 2b + 2c)", cell(T.tot2d), {ref:"[D11]"});
    b += sub("Details of taxes paid (challans) — feeds item 3");
    b += grid("other.tpsa.challans",[
      {k:"bsr",h:"BSR Code",t:"txt",w:"110px",max:7},
      {k:"bank",h:"Name of Bank and Branch",t:"txt",max:125},
      {k:"date",h:"Date of Deposit",t:"date",w:"140px"},
      {k:"srl",h:"Serial No. of Challan",t:"txt",w:"120px",max:5},
      {k:"amt",h:"Amount deposited (Rs)",t:"num",w:"150px"}
    ], O.tpsa&&O.tpsa.challans||[], {min:"720px", empty:"No challans entered.", add:"Add a challan"});
    b += row("Total amount deposited (Σ challans)", cell(T.paid3), {ref:"TotalAmountDeposited"});
    b += row("3 · Taxes paid", cell(T.paid3), {ref:"[D12]"});
    b += row("4 · Net tax payable (2d − 3) → Part B-TTI", cell(T.net4), {ref:"[D13]"});
    h += card("tpsa","Schedule TPSA — Tax on secondary adjustments (section 92CE(2A))",
              (T.has?RS(T.net4):""), b);
  }

  /* ===== Schedule 115TD ===== */
  {
    const D6 = C.td || {};
    let b = note("Accreted income u/s 115TD: when a charitable/religious trust or institution ceases to exist as such (registration cancelled, converted, or merged/dissolved without transfer to another eligible entity), the excess of the FMV of its assets over its liabilities is taxed at the maximum marginal rate, with interest u/s 115TE.");
    b += row("1 · Aggregate FMV of total assets of the specified person", inp("other.td.fmv",{n:1}), {ref:"[F4]"});
    b += row("2 · Less: total liability of the specified person", inp("other.td.liab",{n:1}), {ref:"[F5]"});
    b += row("3 · Net value of assets (1 − 2)", cell(D6.net3), {ref:"[F6]"});
    b += row("4i · FMV of assets directly acquired out of income u/s 10(1)", inp("other.td.fmv4i",{n:1}), {ref:"[F7]"});
    b += row("4ii · FMV of assets acquired during the pre-registration period (11/12 benefit not claimed)", inp("other.td.fmv4ii",{n:1}), {ref:"[F8]"});
    b += row("4iii · FMV of assets transferred per third proviso to 115TD(2)", inp("other.td.fmv4iii",{n:1}), {ref:"[F9]"});
    b += row("4iv · Total (4i + 4ii + 4iii)", cell(D6.tot4iv), {ref:"[F10]"});
    b += row("5 · Liability in respect of assets at 4 above", inp("other.td.liab4",{n:1}), {ref:"[F11]"});
    b += row("6 · Accreted income u/s 115TD [3 − (4iv − 5)]", cell(D6.acc6), {ref:"[F12]"});
    b += row("7 · Additional income-tax payable u/s 115TD at maximum marginal rate",
             inp("other.td.addtax",{n:1}), {ref:"[F13]", req:1, hint:"MMR tax on the accreted income"});
    b += row("8 · Interest payable u/s 115TE", inp("other.td.interest",{n:1}), {ref:"[F14]", hint:"from the specified date to the date of payment"});
    b += row("9 · Specified date u/s 115TD", dte("other.td.specdate"), {ref:"[F15]", req:1});
    b += row("10 · Additional income-tax and interest payable (7 + 8)", cell(D6.pay10), {ref:"[F16]"});
    b += sub("Date(s) of deposit of tax on accreted income (challans) — feeds item 11");
    b += grid("other.td.challans",[
      {k:"date",h:"Date",t:"date",w:"140px"},
      {k:"bank",h:"Name of Bank and Branch",t:"txt",max:125},
      {k:"bsr",h:"BSR Code",t:"txt",w:"110px",max:7},
      {k:"srl",h:"Serial No. of Challan",t:"txt",w:"120px",max:5},
      {k:"amt",h:"Amount deposited",t:"num",w:"150px"}
    ], O.td&&O.td.challans||[], {min:"720px", empty:"No challans entered.", add:"Add a challan"});
    b += row("11 · Tax and interest paid (Σ challans)", cell(D6.paid11), {ref:"[F17]"});
    b += row("12 · Net payable/refundable (10 − 11) → Part B-TTI Sl. 13", cell(D6.net12), {ref:"[F18]"});
    h += card("td115","Schedule 115TD — Accreted income (section 115TD) + interest (115TE)",
              (D6.has?RS(D6.net12):""), b);
  }

  /* ===== Schedule GST ===== */
  {
    let b = note("Turnover / gross receipt reported for GST: one line per GSTIN, the annual value of outward supplies reported in the GST returns filed for the year. A disclosure that lets the department reconcile the income-tax turnover against the GST turnover. Both columns are paired-mandatory (rules 714/715).");
    b += grid("other.gst",[
      {k:"gstin",h:"GSTIN No.",t:"txt",w:"200px",max:15},
      {k:"amt",h:"Annual value of outward supplies as per the GST return(s) filed",t:"num"}
    ], O.gst||[], {min:"560px", empty:"No GSTIN entered.", add:"Add a GSTIN"});
    h += card("gst","Schedule GST — Turnover/gross receipt reported for GST",
              ((C.gst||[]).some(x=>x.has)?(C.gst||[]).filter(x=>x.has).length+" GSTIN(s)":""), b);
  }

  /* ===== Schedule FD ===== */
  {
    const F = C.fd || {};
    let b = note("Break-up of payments/receipts in foreign currency — to be filled only by an assessee not liable to get accounts audited u/s 44AB. An audited company leaves this blank (the audit report captures the same information).");
    if(F.audited)
      b += note("This company appears to be liable to audit u/s 44AB — Schedule FD is not to be filled by an audited company. Leave it blank.","warn");
    b += row("i · Payments made during the year on capital account", inp("other.fd.payCap",{n:1}), {ref:"[E5]"});
    b += row("ii · Payments made during the year on revenue account", inp("other.fd.payRev",{n:1}), {ref:"[E6]"});
    b += row("iii · Receipts during the year on capital account", inp("other.fd.rcptCap",{n:1}), {ref:"[E7]"});
    b += row("iv · Receipts during the year on revenue account", inp("other.fd.rcptRev",{n:1}), {ref:"[E8]"});
    h += card("fd","Schedule FD — Foreign-currency payments/receipts (non-audit filer)",
              (F.has?"Entered":""), b);
  }

  return h;
}

/* ---- export ------------------------------------------------------ */
function expOther(j){
  const C = S.C.other||{}, O = S.other||{};

  /* ---- Schedule IF ---- */
  const ifRows = (C.if||[]).filter(r=>r.hasVal);
  if(ifRows.length){
    j.ScheduleIF = {
      PartnerFirmDetails: ifRows.map(r=>{
        const o = {
          FirmName:(sv(r.name)||"NA").slice(0,125),
          FirmType:(sv(r.ftype)||"NA").slice(0,125),
          FirmPAN:PAN_RE.test(r.pan)?r.pan:"AAAAA0000A",
          ProfitSharePercent:N(r.pct),
          ProfitShareAmt:sg(r.profit),
          FirmCapBalOn31Mar:sg(r.capbal)
        };
        if(sv(r.audit))  o.IsLiableToAudit = r.audit;
        if(sv(r.sec92e)) o.Sec92EFirmFlag  = r.sec92e;
        if(r.interest)   o.IntrstAmtDueOrRecv = n0(r.interest);
        return o;
      }),
      TotalProfitShareAmt:sg((C.ifTot||{}).profit||0),
      TotalFirmCapBalOn31Mar:sg((C.ifTot||{}).capbal||0)
    };
  }

  /* ---- Schedule PTI ---- */
  const pb = (C.pti||[]).filter(b=>b.hasVal);
  if(pb.length){
    const m4 = o => ({ AmountOfInc:sg(o.inc), CurrYrLossShareByInvstFund:n0(o.loss),
                       NetIncomeLoss:sg(o.net), TDSAmount:n0(o.tds) });
    const m3 = o => ({ AmountOfInc:sg(o.inc), NetIncomeLoss:sg(o.net), TDSAmount:n0(o.tds) });
    j.SchedulePTI = { SchedulePTIDtls: pb.map(b=>{
      const IncClmdPTI = {
        TotalSec23FBB:{ AmountOfInc:sg(b.exTot.inc), NetIncomeLoss:sg(b.exTot.net), TDSAmount:n0(b.exTot.tds) },
        Sec23FBB:m3(b.ex23)
      };
      if(sv(b.exB.code)) IncClmdPTI.SecBIncExmptDtl = { SectionCode:b.exB.code, SecBCIncExmptDtl:m3(b.exB) };
      if(sv(b.exC.code)) IncClmdPTI.SecCIncExmptDtl = { SectionCode:b.exC.code, SecBCIncExmptDtl:m3(b.exC) };
      return {
        InvstmntCvrdUs115UA115UB:sv(b.kind)||"Section 115UB",
        BusinessName:(sv(b.name)||"NA").slice(0,125),
        BusinessPAN:PAN_RE.test(b.pan)?b.pan:"AAAAA0000A",
        IncFromHP:m4(b.hp),
        CapitalGainsPTI:{ ShortTermCG:m4(b.stAgg), STCG_Sec111A:m4(b.st111a), STCG_Others:m4(b.stOth),
                          LongTermCG:m4(b.ltAgg), LTCG_Sec112A:m4(b.lt112a), LTCG_Others:m4(b.ltOth) },
        IncClmdPTI:IncClmdPTI,
        IncOthSrc:m3(b.osAgg), OS_Dividend:m3(b.osDiv), OS_Others:m3(b.osOth)
      };
    })};
  }

  /* ---- Schedule TPSA ---- */
  const T = C.tpsa||{};
  if(T.has){
    const o = {
      AmtPrimaryAdjUs92CE_2A:sg(T.adj),
      AdditionalIncTax18PercAbove:sg(T.tax2a),
      Surcharge12Perc:sg(T.sur2b),
      HealthEducationCess:sg(T.cess2c),
      TotalAdditionalTax:sg(T.tot2d),
      TaxesPaid:sg(T.paid3),
      NetTaxPayable:sg(T.net4),
      TotalAmountDeposited:sg(T.paid3)
    };
    const chal = (T.challans||[]).filter(c=>c.amt || st0(c.bsr) || st0(c.bank) || ISO(c.date) || st0(c.srl));
    if(chal.length) o.DtlsTaxesPaid = chal.map(c=>{
      const r = { BSRCode:(sv(c.bsr)||"").slice(0,7), BankBranchName:(sv(c.bank)||"NA").slice(0,125),
                  SrlNoOfChaln:sg(N(c.srl)), Amount:n0(c.amt) };
      if(ISO(c.date)) r.DateDep = ISO(c.date);
      return r;
    });
    j.ScheduleTPSA = o;
  }

  /* ---- Schedule 115TD ---- */
  const D6 = C.td||{};
  if(D6.has){
    const o = {
      FMVTotTrustInst:sg(D6.fmv1),
      LessTotLiaTrustInst:sg(D6.liab2),
      NetValAsst:sg(D6.net3),
      FMVAsstAcqrdRfrdSec101:sg(D6.f4i),
      FMVAsstAcqPeriodFromDateCrtn:sg(D6.f4ii),
      FMVAsstTrnfsrdSec115TD2:sg(D6.f4iii),
      FMVTotal:sg(D6.tot4iv),
      LiabilityRespectofAsset4Above:sg(D6.liab4),
      AccretedIncomeSection115TD:sg(D6.acc6),
      AddIncPay115TDMarginalRate:sg(D6.addtax7),
      InterestPayable115TE:sg(D6.int8),
      AddIncIntstPayb:sg(D6.pay10),
      TaxIntstPaid:sg(D6.paid11),
      NetPaybleRefble:sg(D6.net12)
    };
    if(ISO(D6.specdate)) o.SpecifiedDateUs115TD = ISO(D6.specdate);
    const chal = (D6.challans||[]).filter(c=>c.amt || st0(c.bsr) || st0(c.bank) || ISO(c.date) || st0(c.srl));
    if(chal.length) o.DepositofTaxAccInc = { DepositofTaxAccIncDtls: chal.map(c=>{
      const r = { NameBankBranch:(sv(c.bank)||"NA").slice(0,125), BSRCode:(sv(c.bsr)||"").slice(0,7),
                  SrlNoOfChaln:sg(N(c.srl)), Amount:n0(c.amt) };
      if(ISO(c.date)) r.DateDep = ISO(c.date);
      return r;
    })};
    j.Schedule115TD = o;
  }

  /* ---- Schedule GST ---- */
  const gst = (C.gst||[]).filter(r=>st0(r.gstin) && R(r.amt));  /* paired: both present */
  if(gst.length){
    j.ScheduleGST = { TurnoverGrsRcptForGSTIN: gst.map(r=>({
      GSTINNo:st0(r.gstin).slice(0,15), AmtTurnGrossRcptGSTIN:sg(r.amt)
    })) };
  }

  /* ---- Schedule FD (non-audit filer, when any of the four is non-zero) ---- */
  const F = C.fd||{};
  if(F.has && !F.audited){
    j.ScheduleFD = {
      PaymntMadeOnCapitalAcc:sg(F.payCap),
      PaymntMadeOnRevenueAcc:sg(F.payRev),
      ReceiptsOnCapitalAcc:sg(F.rcptCap),
      ReceiptsOnRevenueAcc:sg(F.rcptRev)
    };
  }
}

/* ---- import ------------------------------------------------------ */
function impOther(I6){
  const read = [];
  S.other = S.other || {};

  /* Schedule IF */
  if(I6 && I6.ScheduleIF){
    const A = I6.ScheduleIF;
    S.other.if = (A.PartnerFirmDetails||[]).map(o=>({
      name:o.FirmName||"", ftype:o.FirmType||"", pan:o.FirmPAN||"",
      audit:o.IsLiableToAudit||"", sec92e:o.Sec92EFirmFlag||"",
      pct:nz(o.ProfitSharePercent), profit:nz(o.ProfitShareAmt),
      interest:nz(o.IntrstAmtDueOrRecv), capbal:nz(o.FirmCapBalOn31Mar)
    }));
    read.push("Schedule IF");
  }

  /* Schedule PTI */
  if(I6 && I6.SchedulePTI){
    const l4 = o => o ? { inc:nz(o.AmountOfInc), loss:nz(o.CurrYrLossShareByInvstFund), tds:nz(o.TDSAmount) } : {};
    const l3 = o => o ? { inc:nz(o.AmountOfInc), tds:nz(o.TDSAmount) } : {};
    S.other.pti = (I6.SchedulePTI.SchedulePTIDtls||[]).map(b=>{
      const c = b.CapitalGainsPTI||{}, x = b.IncClmdPTI||{};
      const r = { kind:b.InvstmntCvrdUs115UA115UB||"", name:b.BusinessName||"", pan:b.BusinessPAN||"",
        hp:l4(b.IncFromHP), st111a:l4(c.STCG_Sec111A), stOth:l4(c.STCG_Others),
        lt112a:l4(c.LTCG_Sec112A), ltOth:l4(c.LTCG_Others),
        osDiv:l3(b.OS_Dividend), osOth:l3(b.OS_Others), ex23fbb:l3(x.Sec23FBB) };
      if(x.SecBIncExmptDtl){ r.exBcode=x.SecBIncExmptDtl.SectionCode||""; r.exB=l3(x.SecBIncExmptDtl.SecBCIncExmptDtl); }
      if(x.SecCIncExmptDtl){ r.exCcode=x.SecCIncExmptDtl.SectionCode||""; r.exC=l3(x.SecCIncExmptDtl.SecBCIncExmptDtl); }
      return r;
    });
    read.push("Schedule PTI");
  }

  /* Schedule TPSA */
  if(I6 && I6.ScheduleTPSA){
    const A = I6.ScheduleTPSA;
    S.other.tpsa = {
      adj:nz(A.AmtPrimaryAdjUs92CE_2A),
      challans:(A.DtlsTaxesPaid||[]).map(c=>({ bsr:c.BSRCode||"", bank:c.BankBranchName||"",
        date:dmy(c.DateDep)||"", srl:c.SrlNoOfChaln!=null?String(c.SrlNoOfChaln):"", amt:nz(c.Amount) }))
    };
    read.push("Schedule TPSA");
  }

  /* Schedule 115TD */
  if(I6 && I6.Schedule115TD){
    const A = I6.Schedule115TD;
    S.other.td = {
      fmv:nz(A.FMVTotTrustInst), liab:nz(A.LessTotLiaTrustInst),
      fmv4i:nz(A.FMVAsstAcqrdRfrdSec101), fmv4ii:nz(A.FMVAsstAcqPeriodFromDateCrtn),
      fmv4iii:nz(A.FMVAsstTrnfsrdSec115TD2), liab4:nz(A.LiabilityRespectofAsset4Above),
      addtax:nz(A.AddIncPay115TDMarginalRate), interest:nz(A.InterestPayable115TE),
      specdate:dmy(A.SpecifiedDateUs115TD)||"",
      challans:(((A.DepositofTaxAccInc||{}).DepositofTaxAccIncDtls)||[]).map(c=>({
        date:dmy(c.DateDep)||"", bank:c.NameBankBranch||"", bsr:c.BSRCode||"",
        srl:c.SrlNoOfChaln!=null?String(c.SrlNoOfChaln):"", amt:nz(c.Amount) }))
    };
    read.push("Schedule 115TD");
  }

  /* Schedule GST */
  if(I6 && I6.ScheduleGST){
    S.other.gst = (I6.ScheduleGST.TurnoverGrsRcptForGSTIN||[]).map(r=>({
      gstin:r.GSTINNo||"", amt:nz(r.AmtTurnGrossRcptGSTIN) }));
    read.push("Schedule GST");
  }

  /* Schedule FD */
  if(I6 && I6.ScheduleFD){
    const A = I6.ScheduleFD;
    S.other.fd = { payCap:nz(A.PaymntMadeOnCapitalAcc), payRev:nz(A.PaymntMadeOnRevenueAcc),
                   rcptCap:nz(A.ReceiptsOnCapitalAcc), rcptRev:nz(A.ReceiptsOnRevenueAcc) };
    read.push("Schedule FD");
  }

  return read;
}

/* ---- checks (this section's own screen validations) --------------- */
function chkOther(){
  const out = [], C = S.C.other||{}, O = S.other||{};

  /* Schedule IF — per-entity mandatory fields when a row carries a value */
  (C.if||[]).forEach((r,i)=>{
    if(!r.hasVal) return;
    if(!st0(r.name) || !st0(r.ftype) || !PAN_RE.test(r.pan))
      out.push({lvl:"err", t:"Schedule IF", m:"Entity "+(i+1)+": name, type and a valid PAN of the entity are mandatory.", sec:"other"});
    if(r.pct<0 || r.pct>100)
      out.push({lvl:"err", t:"Schedule IF", m:"Entity "+(i+1)+": the percentage share in profit must be between 0 and 100.", sec:"other"});
  });

  /* Schedule PTI — required header fields when a block carries a value */
  (C.pti||[]).forEach((b,i)=>{
    if(!b.hasVal) return;
    if(!st0(b.kind) || !st0(b.name) || !PAN_RE.test(b.pan))
      out.push({lvl:"err", t:"Schedule PTI", m:"Block "+(i+1)+": the section covered (115U/115UA/115UB), name and a valid PAN of the trust/fund are mandatory.", sec:"other"});
  });

  /* Schedule TPSA — a challan date cannot be in the future (rule 694) */
  (((C.tpsa||{}).challans)||[]).forEach((c,i)=>{
    const d = ISO(c.date);
    if(d && new Date(d+"T00:00:00") > new Date())
      out.push({lvl:"err", t:"Schedule TPSA", m:"Challan "+(i+1)+": the date of deposit cannot be after today.", sec:"other"});
  });

  /* Schedule 115TD — if accreted income arises, the specified date and the
     additional tax must be present (rules 699/700). */
  const D6 = C.td||{};
  if(D6.acc6 > 0){
    if(!ISO(D6.specdate))
      out.push({lvl:"err", t:"Schedule 115TD", m:"Accreted income is present, so the specified date u/s 115TD (item 9) cannot be blank (rule 699).", sec:"other"});
    if(!D6.addtax7)
      out.push({lvl:"warn", t:"Schedule 115TD", m:"Accreted income is present but the additional income-tax u/s 115TD (item 7) at the maximum marginal rate has not been entered (rule 700).", sec:"other"});
  }

  /* Schedule GST — paired mandatory (rules 714/715) */
  (C.gst||[]).forEach((r,i)=>{
    const hasG = !!st0(r.gstin), hasA = !!R(r.amt);
    if(hasG !== hasA)
      out.push({lvl:"err", t:"Schedule GST", m:"Row "+(i+1)+": GSTIN No. and the annual value of outward supplies must both be filled (rules 714/715).", sec:"other"});
  });

  /* Schedule FD — an audited company must not fill it */
  const F = C.fd||{};
  if(F.has && F.audited)
    out.push({lvl:"warn", t:"Schedule FD", m:"This company appears liable to audit u/s 44AB; Schedule FD is for a non-audit filer and will not be written.", sec:"other"});

  return out;
}

/* ---- register ---------------------------------------------------- */
reg({id:"other", t:"Other schedules", ref:"IF · PTI · TPSA · 115TD · GST · FD",
     f:secOther,
     s:()=>{ const C=S.C.other||{}; const bits=[];
       const nif=(C.if||[]).filter(x=>x.hasVal).length; if(nif) bits.push(nif+" IF");
       const npti=(C.pti||[]).filter(x=>x.hasVal).length; if(npti) bits.push(npti+" PTI");
       if((C.tpsa||{}).has) bits.push("TPSA "+RS((C.tpsa||{}).net4||0));
       if((C.td||{}).has) bits.push("115TD "+RS((C.td||{}).net12||0));
       const ngst=(C.gst||[]).filter(x=>x.has).length; if(ngst) bits.push(ngst+" GST");
       if((C.fd||{}).has) bits.push("FD");
       return bits.join(" · "); },
     eng:engOther, exp:expOther, imp:impOther, chk:chkOther, order:11, corder:11});
