/* =====================================================================
   ITR-5 · Section "other" — Other schedules and disclosures
     Schedule PTI · Schedule IF · Schedule TPSA · Schedule GST · Schedule 115TD
   Books: books/ITR-5/Schedule_PTI.md, IF.md, Schedule_TPSA.md, GST.md, 115TD.md
   Schema blocks: SchedulePTI, ScheduleIF, ScheduleTPSA, ScheduleGST, Schedule115TD
   section_map.json: "Schedule PTI"|"IF"|"Schedule TPSA"|"GST"|"115TD" => other.
   Compute order: 28 (after every income head / loss / tax face, per the
   reg order the CEO fixed; see the seam note at the foot of the file).

   GTI CONTRIBUTION — none of the five schedules independently adds to Gross
   Total Income here, so S.C.other.income = 0:
     · Schedule PTI is a *disclosure*: each head's net "reappears in that head's
       own schedule" (PTI.md) — HP item 2 (A203), CG B10 (A385), OS 2d (A477),
       EI Sl.5 (A732). This section PUBLISHES those amounts on S.C.other.pti so
       the receiving heads can read them; it does not itself add income.
     · Schedule IF is partner-in-firm information (its interest total ties to
       P&L 14xi(b), n55) — disclosure, already inside the firm-share income.
     · Schedule TPSA is *additional* income-tax u/s 92CE(2A) (18%+12%+4%), not a
       head of income; its net payable is exposed as S.C.other.tpsa.net.
     · Schedule GST is turnover disclosure per GSTIN — no income figure.
     · Schedule 115TD is *additional* income-tax on accreted income + 115TE
       interest; its field-12 net feeds Part B-TTI Sr.12 (n762), exposed as
       S.C.other.td.net12.
   ===================================================================== */

/* ---- state ------------------------------------------------------- */
S.other = S.other || {
  /* Schedule PTI — repeatable, one object per business trust / investment fund */
  pti:[],
  /* Schedule IF — count + a table of firms (up to four on the sheet; add-row) */
  if:{ n:"", firms:[] },
  /* Schedule TPSA — one primary-adjustment figure + a challan grid (≤6) */
  tpsa:{ amt:"", challans:[] },
  /* Schedule GST — one row per GSTIN */
  gst:[],
  /* Schedule 115TD — six enterable numbers, a specified date, a challan grid */
  td:{ fmv:"", liab:"", fmv101:"", fmv12aa:"", fmv115td2:"", assetLiab:"",
       specDate:"", intOvr:"", challans:[] }
};

/* SEED defaults for new repeatable rows (the shared shell add-handler keeps its
   own SEED map; these are harmless and document the empty-row shape). */
SEED.pti = SEED.pti || {};
SEED.firms = SEED.firms || {};
SEED.challans = SEED.challans || {};

/* ---- dropdown value lists (from the books; enums.json carries no list for
   these — the values are quoted verbatim from the sheet's data-validation) --- */
/* PTI Col (2) E6/E21 — stored code A=115UA · B=115UB · C=115U (schema enum). */
const OTH_PTIKIND = [["A","Section 115UA"],["B","Section 115UB"],["C","Section 115U"]];
/* IF cols G/H — "(Select)/Yes/No", stored as the chosen string. */
const OTH_YN = [["Yes","Yes"],["No","No"]];

/* Schedule TPSA is gated on Part A-OI Sl.17 "ScheduleTPSAFlg" == "Yes"
   (rules n190/n191; the flag lives in S.oi, exported by the oi section). */
const oth_tpsa = ()=> st0(get("oi.ScheduleTPSAFlg"))==="Yes";

/* monthdiffTE — whole months (or part = full, for 1%/month u/s 115TE) between
   two Date objects; mirrors the utility's VBA monthdiffTE used in the Q:Z
   interest engine (115TD.md). */
function _monthdiffTE(a,b){ if(!a||!b||b<=a) return 0;
  let m=(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth());
  if(b.getDate()>a.getDate()) m++;                 /* part-month counts as full */
  return Math.max(0,m); }
/* round up to the nearest 10 (utility ROUNDUP(...,−1)), for x>0 */
const _rup10 = x => x>0 ? Math.ceil(x/10)*10 : 0;

/* ---- engine ------------------------------------------------------ */
function engOther(){
  S.other = S.other || {};
  const O = S.other;
  const C = S.C.other = { income:0 };

  /* ================= Schedule PTI (book Schedule_PTI.md) ================= */
  /* Net Income/Loss (Col 9) = Col 7 − Col 8 on every line (A745); iia/iib/iii/iv
     subtotals = sums of their leaf lines (A746–A749). Col 8 (loss share) exists
     only for House property and Capital Gains — Other Sources and exempt lines
     have no loss column, so net = amount there. */
  const leaf   = r => {r=r||{}; const inc=R(r.inc), loss=R(r.loss), tds=Math.max(0,R(r.tds));
                        return {inc, loss, net:inc-loss, tds};};      /* N=L−M */
  const leaf3  = r => {r=r||{}; const inc=R(r.inc), tds=Math.max(0,R(r.tds));
                        return {inc, net:inc, tds};};                  /* OS / exempt: no loss col */
  const add4   = (a,b)=>({inc:a.inc+b.inc, loss:a.loss+b.loss, net:a.net+b.net, tds:a.tds+b.tds});
  const add3   = (a,b)=>({inc:a.inc+b.inc, net:a.net+b.net, tds:a.tds+b.tds});
  C.pti = (O.pti||[]).map(b=>{
    b = b||{};
    const hp     = leaf(b.hp);                                         /* row i (L6..O6) */
    const st111a = leaf(b.st111a), stOth = leaf(b.stOth);             /* rows 9/10 */
    const lt112a = leaf(b.lt112a), ltOth = leaf(b.ltOth);             /* rows 12/13 */
    const stAgg  = add4(st111a, stOth);                               /* iia [L8=L9+L10] (A746) */
    const ltAgg  = add4(lt112a, ltOth);                               /* iib [L11=L12+L13] (A747) */
    const osDiv  = leaf3(b.osDiv), osOth = leaf3(b.osOth);            /* rows 15/16 */
    const osAgg  = add3(osDiv, osOth);                                /* iii [L14=L15+L16] (A748) */
    const ex23   = leaf3(b.ex23fbb);                                  /* iv a 10(23FBB) row 18 */
    const exB    = {code:st0(b.exBcode), inc:R((b.exB||{}).inc), net:R((b.exB||{}).inc),
                    tds:Math.max(0,R((b.exB||{}).tds))};              /* iv b row 19 (optional) */
    const exC    = {code:st0(b.exCcode), inc:R((b.exC||{}).inc), net:R((b.exC||{}).inc),
                    tds:Math.max(0,R((b.exC||{}).tds))};              /* iv c row 20 (optional) */
    const exTot  = {inc:ex23.inc+exB.inc+exC.inc, net:ex23.net+exB.net+exC.net,
                    tds:ex23.tds+exB.tds+exC.tds};                    /* iv [L17=L18+L19+L20] (A749) */
    const hasVal = !!(st0(b.name)||st0(b.pan)|| hp.inc||hp.loss||stAgg.inc||ltAgg.inc||osAgg.inc||exTot.inc);
    return {kind:b.kind||"", name:st0(b.name), pan:st0(b.pan).toUpperCase(),
            hp, st111a, stOth, lt112a, ltOth, stAgg, ltAgg,
            osDiv, osOth, osAgg, ex23, exB, exC, exTot, hasVal};
  });
  /* head totals across all funds — the cross-schedule ties HP2 / CG B10 / OS 2d
     / EI 5 draw from these (A203/A385/A477/A732). */
  C.ptiTot = (C.pti||[]).reduce((t,b)=>{
    t.hp   += b.hp.net;                        /* → Schedule HP Sl.2   (A203) */
    t.stAgg+= b.stAgg.net;                     /* → Schedule CG STCG PTI */
    t.ltAgg+= b.ltAgg.net;                     /* → Schedule CG B10    (A385) */
    t.osAgg+= b.osAgg.net;                     /* → Schedule OS Sl.2d  (A477) */
    t.exTot+= b.exTot.net;                     /* → Schedule EI Sl.5   (A732) */
    return t;
  }, {hp:0, stAgg:0, ltAgg:0, osAgg:0, exTot:0});

  /* ================= Schedule IF (book IF.md) ================= */
  const IFo = O.if || {};
  const ifr = (IFo.firms||[]).map(f=>{ f=f||{};
    return {name:st0(f.name), pan:st0(f.pan).toUpperCase(), audit:st0(f.audit), s92e:st0(f.s92e),
            pct:N(f.pct), profit:R(f.profit), intr:Math.max(0,R(f.intr)), cap:R(f.cap),
            hasVal:!!(st0(f.name)||st0(f.pan)||N(f.profit)||N(f.cap)||N(f.intr)||N(f.pct))};});
  const ifT = ifr.reduce((t,f)=>{t.profit+=f.profit; t.intr+=f.intr; t.cap+=f.cap; return t;},
                          {profit:0, intr:0, cap:0});   /* [J11]/[K11]/[L11] = SUM (n731) */
  C.if = {rows:ifr, tot:ifT, n:st0(IFo.n)!==""?R(IFo.n):ifr.filter(f=>f.hasVal).length,
          any:ifr.some(f=>f.hasVal)};

  /* ================= Schedule TPSA (book Schedule_TPSA.md) ================= */
  /* One input (primary adjustment [H4]); the rest is a fixed tax cascade. */
  const T = O.tpsa || {};
  const tpsaAmt = Math.max(0, R(T.amt));                            /* [H4] AmtPrimaryAdjUs92CE_2A */
  const tax18 = Math.max(0, R(tpsaAmt*0.18));                       /* [H8]=ROUND(H4*0.18)   (n750) */
  const sur12 = Math.max(0, R(tax18*0.12));                         /* [H9]=ROUND(H8*0.12)   (n751) */
  const cess4 = Math.max(0, R((tax18+sur12)*0.04));                 /* [H10]=ROUND((H8+H9)*0.04) (n752) */
  const tpsaTotal = Math.max(0, tax18+sur12+cess4);                 /* [H11]=H8+H9+H10 (2d)  (n753) */
  const tpsaDep = (T.challans||[]).reduce((a,c)=>a+Math.max(0,R((c||{}).amt)),0); /* [H24]=SUM(H18:H23) */
  const tpsaPaid = Math.max(0, tpsaDep);                           /* [H12]=MAX(0,total)    (n754) */
  const tpsaNet = Math.max(0, tpsaTotal - tpsaPaid);              /* [H13]=MAX(0,2d−3)     (n755) */
  C.tpsa = {on:oth_tpsa(), amt:tpsaAmt, tax18, sur12, cess4, total:tpsaTotal,
            paid:tpsaPaid, net:tpsaNet, dep:tpsaDep};

  /* ================= Schedule GST (book GST.md) ================= */
  C.gst = (O.gst||[]).map(r=>{ r=r||{};
    const gstin=st0(r.gstin).toUpperCase(), amt=Math.max(0,R(r.amt));
    return {gstin, amt, hasVal:!!(gstin||amt)};});

  /* ================= Schedule 115TD (book 115TD.md) ================= */
  const D5 = O.td || {};
  const fmv    = Math.max(0, R(D5.fmv));                            /* 1  N6 FMVTotTrustInst */
  const liab   = Math.max(0, R(D5.liab));                           /* 2  N7 LessTotLiaTrustInst */
  const netVal = Math.max(0, fmv - liab);                          /* 3  N8=MAX(0,1−2)     (n757) */
  const fmv101 = Math.max(0, R(D5.fmv101));                        /* 4i  N9 */
  const fmv12aa= Math.max(0, R(D5.fmv12aa));                       /* 4ii N10 */
  const fmv1152= Math.max(0, R(D5.fmv115td2));                     /* 4iii N11 */
  const fmvTot = Math.max(0, fmv101+fmv12aa+fmv1152);             /* 4iv N12=MAX(0,4i+4ii+4iii) (n758) */
  const assetLiab = Math.max(0, R(D5.assetLiab));                  /* 5  N13 (active when 6>0) */
  const accreted  = Math.max(0, netVal - (fmvTot - assetLiab));    /* 6  N14=MAX(0,3−(4iv−5)) (n759) */
  const tax7 = R(Math.max(0, accreted*34.944/100));               /* 7  N15=ROUND(6×34.944%) MMR */
  /* interest u/s 115TE (8) — 1%/month engine keyed off (specified date + 14
     days) as the due date and each challan's deposit date; payment applies to
     interest first, remaining outstanding accrues to the system date. */
  let int8;
  const base = Math.floor(tax7/100)*100;                          /* [X18]=ROUNDDOWN(7,−2) */
  const spec = D(D5.specDate);
  const due  = spec ? new Date(spec.getFullYear(), spec.getMonth(), spec.getDate()+14) : null; /* [U18] +14d */
  if(st0(D5.intOvr)!==""){
    int8 = Math.max(0, R(D5.intOvr));                             /* manual override wins */
  } else if(due && base>0){
    const chs = (D5.challans||[]).map(c=>({d:D((c||{}).date), amt:Math.max(0,R((c||{}).amt))}))
                  .filter(c=>c.d).sort((a,b)=>a.d-b.d);
    let out = base, intr = 0, cursor = due;
    chs.forEach(c=>{
      if(out<=0) return;
      const m = _monthdiffTE(cursor, c.d);                        /* [Q]=monthdiffTE(due, deposit) */
      intr += Math.round(out*0.01*m);                             /* [R]=ROUND(OBTE×1%×months) */
      out = Math.max(0, out - c.amt);                             /* deposit reduces outstanding */
      cursor = c.d;
    });
    if(out>0) intr += Math.round(out*0.01*_monthdiffTE(cursor, new Date())); /* to system date */
    int8 = Math.max(0, intr);
  } else int8 = 0;
  const total10 = Math.max(0, tax7 + int8);                       /* 10 N18=7+8 */
  const paid11  = Math.max(0, (D5.challans||[]).reduce((a,c)=>a+Math.max(0,R((c||{}).amt)),0)); /* 11 N19=Σ K */
  const net12   = Math.max(0, _rup10(total10 - paid11));          /* 12 N20=MAX(0,ROUNDUP(10−11,−1)) (n760) */
  const dueISO = due ? (due.getFullYear()+"-"+String(due.getMonth()+1).padStart(2,"0")+"-"+
                        String(due.getDate()).padStart(2,"0")) : "";
  C.td = {fmv, liab, netVal, fmv101, fmv12aa, fmv115td2:fmv1152, fmvTot, assetLiab,
          accreted, tax7, int8, spec:ISO(D5.specDate), specRaw:st0(D5.specDate),
          total10, paid11, net12, base, due:dueISO,
          on:!!(fmv||liab||fmv101||fmv12aa||fmv1152||assetLiab||accreted||paid11||st0(D5.specDate))};
  C.td.net12 = net12;   /* → Part B-TTI Sr.12 (n762) */

  /* GTI contribution — disclosures / additional-tax only (see header) */
  C.income = 0;
}

/* ---- renderer ---------------------------------------------------- */
function secOther(){
  const O = S.other||{}, C = S.C.other||{};
  let h = "";

  /* ===================== Schedule PTI ===================== */
  {
    let b = note("Pass-through income from a business trust (REIT/InvIT, u/s 115UA), an investment fund (AIF Cat I/II, u/s 115UB) or a securitisation trust (u/s 115U). Each head's net reappears in that head's own schedule — House property Sl.2, Capital Gains B10, Other Sources Sl.2d, Exempt income Sl.5; TDS in column (10) flows to Schedule TDS.");
    const blocks = C.pti || [];
    (O.pti||[]).forEach((raw,i)=>{
      const cb = blocks[i] || {};
      const pre = "other.pti."+i+".";
      const title = "Trust / fund " + (i+1) + (st0(raw.name)?" — "+esc(st0(raw.name)):"");
      let inner = "";
      inner += row("Investment entity covered by section", sel(pre+"kind", OTH_PTIKIND), {req:1, ref:"(2)"});
      inner += row("Name of business trust / investment fund", inp(pre+"name",{max:125}), {req:1, ref:"(3)"});
      inner += row("PAN of business trust / investment fund", inp(pre+"pan",{max:10}), {req:1, ref:"(4)"});
      /* body table: head | income (7) | loss (8) | net (9) | TDS (10) */
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
      t += aggRow("a · Short term (111A + others)", cb.stAgg, 20);
      t += money4("st111a","ai · Section 111A", 36);
      t += money4("stOth","aii · Others", 36);
      t += aggRow("b · Long term (112A + other)", cb.ltAgg, 20);
      t += money4("lt112a","bi · Section 112A", 36);
      t += money4("ltOth","bii · Other than section 112A", 36);
      t += '<tr><td class="l" colspan="5"><b>iii · Other Sources</b></td></tr>';
      t += aggRow("Other Sources total", cb.osAgg, 20);
      t += money3("osDiv","· Dividend", 36);
      t += money3("osOth","· Others", 36);
      t += '<tr><td class="l" colspan="5"><b>iv · Income claimed to be exempt</b></td></tr>';
      t += aggRow("Exempt total", cb.exTot, 20);
      t += money3("ex23fbb","a · u/s 10(23FBB)", 36);
      t += '</tbody></table></div>';
      /* iv b / iv c — optional u/s specify rows (SectionCode max 10) */
      t += row("iv b · Exempt u/s (specify code)", inp(pre+"exBcode",{max:10}), {ref:"(iv b)"});
      t += '<div class="full"><table class="gt" style="min-width:520px"><tbody>'+
        '<tr><td class="l">Amount</td><td>'+inp(pre+"exB.inc",{n:1})+'</td>'+
        '<td class="l">TDS</td><td>'+inp(pre+"exB.tds",{n:1})+'</td></tr></tbody></table></div>';
      t += row("iv c · Exempt u/s (specify code)", inp(pre+"exCcode",{max:10}), {ref:"(iv c)"});
      t += '<div class="full"><table class="gt" style="min-width:520px"><tbody>'+
        '<tr><td class="l">Amount</td><td>'+inp(pre+"exC.inc",{n:1})+'</td>'+
        '<td class="l">TDS</td><td>'+inp(pre+"exC.tds",{n:1})+'</td></tr></tbody></table></div>';
      inner += t;
      b += blk("pti"+i, title, (cb.hasVal?"Entered":"Empty"), inner, "other.pti."+i);
    });
    b += '<button class="add" data-add="other.pti">Add a trust / fund</button>';
    h += card("pti","Schedule PTI — Pass-through income (115U / 115UA / 115UB)",
              (blocks.some(x=>x.hasVal)?blocks.filter(x=>x.hasVal).length+" fund(s)":""), b);
  }

  /* ===================== Schedule IF ===================== */
  {
    const CI = C.if || {rows:[], tot:{}};
    let b = note("Firms / LLPs in which the assessee is a partner or member at any time during the year. The total interest due/received (column ii) must tie to Sl.No. 14xi(b) of Schedule P&L (rule n55). Filling this schedule (or Schedule 5A / audit details) satisfies the audit due-date requirement in Part A-General.");
    b += row("Number of firms in which you are partner", inp("other.if.n",{n:1}), {req:1, ref:"[L4]"});
    b += grid("other.if.firms",[
      {k:"name", h:"Name of the Firm", t:"txt", w:"200px", max:125, req:1},
      {k:"pan",  h:"PAN of the firm", t:"txt", w:"120px", max:10, req:1},
      {k:"audit",h:"Liable for audit?", t:"sel", w:"110px", opts:OTH_YN, req:1},
      {k:"s92e", h:"Section 92E applicable?", t:"sel", w:"120px", opts:OTH_YN, req:1},
      {k:"pct",  h:"% Share in profit", t:"num", w:"110px", req:1},
      {k:"profit",h:"Amount of share in profit (i)", t:"num", w:"140px", req:1},
      {k:"intr", h:"Interest due or received (ii)", t:"num", w:"140px"},
      {k:"cap",  h:"Capital balance on 31 Mar (iii)", t:"num", w:"150px", req:1}
    ], (O.if&&O.if.firms)||[], {empty:"No firms entered.", add:"Add a firm", min:"980px"});
    /* totals row */
    const TT = CI.tot||{};
    b += row("Total — Amount of share in profit", cell(TT.profit), {ref:"[J11]"});
    b += row("Total — Amount of interest due or received (ties to P&L 14xi(b))", cell(TT.intr), {ref:"[K11]"});
    b += row("Total — Capital balance on 31st March", cell(TT.cap), {ref:"[L11]"});
    h += card("if","Schedule IF — Firms in which partner",
              (CI.any?CI.rows.filter(f=>f.hasVal).length+" firm(s)":""), b);
  }

  /* ===================== Schedule TPSA ===================== */
  {
    const CT = C.tpsa || {};
    const on = oth_tpsa();
    let inner;
    if(!on){
      inner = note('Opens when item 17 of Part A-OI — "Whether assessee is exercising option under sub-section 2A of section 92CE?" — is answered <b>Yes</b>. When Yes, this schedule must be filled (rules n190/n191).');
    } else {
      let b = note("Additional income-tax on the secondary adjustment to transfer price u/s 92CE(2A): 18% of the primary adjustment, plus 12% surcharge and 4% health-&-education cess.");
      b += row("1 · Amount of primary adjustment on which option u/s 92CE(2A) is exercised and the excess money is not repatriated in time",
               inp("other.tpsa.amt",{n:1}), {req:1, ref:"[H4]"});
      b += row("2a · Additional income-tax payable @ 18% on above", cell(CT.tax18), {ref:"[H8]"});
      b += row("2b · Surcharge @ 12% on (a)", cell(CT.sur12), {ref:"[H9]"});
      b += row("2c · Health & Education cess @ 4% on (a+b)", cell(CT.cess4), {ref:"[H10]"});
      b += row("2d · Total additional tax payable (a+b+c)", cell(CT.total), {ref:"[H11]"});
      b += row("3 · Taxes paid (total of the challan table)", cell(CT.paid), {ref:"[H12]"});
      b += row("4 · Net tax payable (2d − 3)", cell(CT.net), {ref:"[H13]"});
      b += sub("Details of taxes paid — challan table (up to 6 rows)");
      b += grid("other.tpsa.challans",[
        {k:"bsr",  h:"BSR Code", t:"txt", w:"110px", max:7, req:1},
        {k:"bank", h:"Name of Bank and Branch", t:"txt", w:"220px", max:125, req:1},
        {k:"date", h:"Date of Deposit", t:"date", w:"140px", req:1},
        {k:"srl",  h:"Serial No. of Challan", t:"num", w:"130px", req:1},
        {k:"amt",  h:"Amount deposited (₹)", t:"num", w:"150px", req:1}
      ], (O.tpsa&&O.tpsa.challans)||[], {empty:"No challans entered.", add:"Add a challan", min:"800px"});
      b += row("Total amount deposited", cell(CT.dep), {ref:"[H24]"});
      inner = b;
    }
    h += card("tpsa","Schedule TPSA — Tax on secondary adjustments u/s 92CE(2A)",
              (on&&CT.net?RS(CT.net):(on?"":"")), inner);
  }

  /* ===================== Schedule GST ===================== */
  {
    let b = note("Turnover / gross receipt reported for GST, one row per GSTIN. Within a row both the GSTIN and the annual value of outward supplies are all-or-nothing (rules A779/A780).");
    b += grid("other.gst",[
      {k:"gstin", h:"GSTIN No(s).", t:"txt", w:"200px", max:15, req:1},
      {k:"amt",   h:"Annual value of outward supplies as per the GST return(s) filed", t:"num", w:"260px", req:1}
    ], (O.gst)||[], {empty:"No GSTINs entered.", add:"Add a GSTIN", min:"520px"});
    const rows = (C.gst||[]).filter(r=>r.hasVal);
    h += card("gst","Schedule GST — Turnover / gross receipt reported for GST",
              (rows.length?rows.length+" GSTIN(s)":""), b);
  }

  /* ===================== Schedule 115TD ===================== */
  {
    const CD = C.td || {};
    let b = note("Additional income-tax on the accreted income of a specified person (trust/institution) u/s 115TD at the maximum marginal rate (34.944%), plus interest u/s 115TE at 1% per month. Field 12 (net payable) feeds Part B-TTI Sr.No.12 (rule n762).");
    b += row("1 · Aggregate Fair Market Value (FMV) of total assets of the specified person", inp("other.td.fmv",{n:1}), {ref:"[N6]"});
    b += row("2 · Less: Total liability of the specified person", inp("other.td.liab",{n:1}), {ref:"[N7]"});
    b += row("3 · Net value of assets (1 − 2)", cell(CD.netVal), {ref:"[N8]"});
    b += row("4(i) · FMV of assets directly acquired out of income u/s 10(1)", inp("other.td.fmv101",{n:1}), {ref:"[N9]"});
    b += row("4(ii) · FMV of assets acquired between creation and effective registration u/s 12AA/12AB", inp("other.td.fmv12aa",{n:1}), {ref:"[N10]"});
    b += row("4(iii) · FMV of assets transferred per third proviso to section 115TD(2)", inp("other.td.fmv115td2",{n:1}), {ref:"[N11]"});
    b += row("4(iv) · Total (4i + 4ii + 4iii)", cell(CD.fmvTot), {ref:"[N12]"});
    b += row("5 · Liability in respect of assets at 4 above", inp("other.td.assetLiab",{n:1}), {ref:"[N13]"});
    b += row("6 · Accreted income u/s 115TD [3 − (4(iv) − 5)]", cell(CD.accreted), {ref:"[N14]"});
    b += row("7 · Additional income-tax payable u/s 115TD @ MMR (34.944%)", cell(CD.tax7), {ref:"[N15]"});
    b += row("8 · Interest payable u/s 115TE (1% per month)", cell(CD.int8), {ref:"[N16]"});
    b += row("Interest override (leave blank to use the 1%/month engine)", inp("other.td.intOvr",{n:1}), {ref:"[N16]", hint:"optional"});
    b += row("9 · Specified date u/s 115TD (within FY 2025-26)", inp("other.td.specDate",{ph:DF,max:10}), {ref:"[N17]"});
    b += row("10 · Additional income-tax and interest payable (7 + 8)", cell(CD.total10), {ref:"[N18]"});
    b += row("11 · Tax and interest paid (total of the challan table)", cell(CD.paid11), {ref:"[N19]"});
    b += row("12 · Net payable / refundable (10 − 11) → Part B-TTI Sr.12", cell(CD.net12), {ref:"[N20]"});
    b += sub("Date(s) of deposit of tax on accreted income — challan table");
    b += grid("other.td.challans",[
      {k:"date", h:"Date of deposit", t:"date", w:"140px", req:1},
      {k:"bank", h:"Name of Bank and Branch", t:"txt", w:"220px", max:125, req:1},
      {k:"bsr",  h:"BSR Code", t:"txt", w:"110px", max:7, req:1},
      {k:"srl",  h:"Serial No. of Challan", t:"num", w:"130px", req:1},
      {k:"amt",  h:"Amount deposited (₹)", t:"num", w:"150px", req:1}
    ], (O.td&&O.td.challans)||[], {empty:"No challans entered.", add:"Add a challan", min:"820px"});
    h += card("td115","Schedule 115TD — Accreted income & tax u/s 115TD / 115TE",
              (CD.net12?RS(CD.net12):(CD.accreted?RS(CD.tax7):"")), b);
  }

  return h;
}

/* ---- export ------------------------------------------------------ */
function expOther(j){
  const C = S.C.other||{}, O = S.other||{};

  /* ---------------- Schedule PTI ---------------- */
  const pb = (C.pti||[]).filter(b=>b.hasVal);
  if(pb.length){
    const m4 = o => ({AmountOfInc:sg(o.inc), CurrYrLossShareByInvstFund:n0(o.loss),
                      NetIncomeLoss:sg(o.net), TDSAmount:n0(o.tds)});
    const m3 = o => ({AmountOfInc:sg(o.inc), NetIncomeLoss:sg(o.net), TDSAmount:n0(o.tds)});
    j.SchedulePTI = { SchedulePTIDtls: pb.map(b=>{
      const IncClmdPTI = {
        TotalSec23FBB:{AmountOfInc:sg(b.exTot.inc), NetIncomeLoss:sg(b.exTot.net), TDSAmount:n0(b.exTot.tds)},
        Sec23FBB:m3(b.ex23)
      };
      if(sv(b.exB.code)) IncClmdPTI.SecBIncExmptDtl = {SectionCode:b.exB.code,
        SecBCIncExmptDtl:{AmountOfInc:sg(b.exB.inc), NetIncomeLoss:sg(b.exB.net), TDSAmount:n0(b.exB.tds)}};
      if(sv(b.exC.code)) IncClmdPTI.SecCIncExmptDtl = {SectionCode:b.exC.code,
        SecBCIncExmptDtl:{AmountOfInc:sg(b.exC.inc), NetIncomeLoss:sg(b.exC.net), TDSAmount:n0(b.exC.tds)}};
      return {
        InvstmntCvrdUs115UA115UB:b.kind||"A",
        BusinessName:(sv(b.name)||"NA").slice(0,125),
        BusinessPAN:PAN_RE.test(b.pan)?b.pan:"AAAAA0000A",
        IncFromHP:m4(b.hp),
        CapitalGainsPTI:{ShortTermCG:m4(b.stAgg), STCG_Sec111A:m4(b.st111a), STCG_Others:m4(b.stOth),
                         LongTermCG:m4(b.ltAgg), LTCG_Sec112A:m4(b.lt112a), LTCG_Others:m4(b.ltOth)},
        IncClmdPTI:IncClmdPTI,
        IncOthSrc:m3(b.osAgg), OS_Dividend:m3(b.osDiv), OS_Others:m3(b.osOth)
      };
    })};
  }

  /* ---------------- Schedule IF ---------------- */
  const CI = C.if||{rows:[], tot:{}};
  const ifRows = (CI.rows||[]).filter(f=>f.hasVal);
  if(ifRows.length || R((O.if||{}).n)>0){
    const o = {
      PartnerInNumberOfFirms: sg(CI.n),
      TotalProfitShareAmt: sg((CI.tot||{}).profit),
      TotalFirmCapBalOn31Mar: sg((CI.tot||{}).cap)
    };
    if((CI.tot||{}).intr) o.TotalIntrstAmtDueOrRecv = sg(CI.tot.intr);
    if(ifRows.length) o.PartnerFirmDetails = ifRows.map(f=>{
      const r = {
        FirmName:(sv(f.name)||"NA").slice(0,125),
        FirmPAN:PAN_RE.test(f.pan)?f.pan:"AAAAA0000A",
        IsLiableToAudit:sv(f.audit)||"No",
        Sec92EFirmFlag:sv(f.s92e)||"No",
        ProfitSharePercent:sg(f.pct),
        ProfitShareAmt:sg(f.profit),
        FirmCapBalOn31Mar:sg(f.cap)
      };
      if(f.intr) r.IntrstAmtDueOrRecv = n0(f.intr);
      return r;
    });
    j.ScheduleIF = o;
  }

  /* ---------------- Schedule TPSA (only when the Part A-OI flag is Yes) ---- */
  if(C.tpsa && C.tpsa.on){
    const T = C.tpsa;
    const o = {
      AmtPrimaryAdjUs92CE_2A:n0(T.amt),
      AdditionalIncTax18PercAbove:n0(T.tax18),
      Surcharge12Perc:n0(T.sur12),
      HealthEducationCess:n0(T.cess4),
      TotalAdditionalTax:n0(T.total),
      TaxesPaid:n0(T.paid),
      NetTaxPayable:n0(T.net),
      TotalAmountDeposited:n0(T.dep)
    };
    const ch = (O.tpsa&&O.tpsa.challans||[]).filter(c=>st0(c.bsr)||st0(c.bank)||ISO(c.date)||R(c.amt));
    if(ch.length) o.DtlsTaxesPaid = ch.map(c=>({
      BSRCode:(sv(c.bsr)||"0000000").slice(0,7),
      BankBranchName:(sv(c.bank)||"NA").slice(0,125),
      DateDep:ISO(c.date)||"2025-04-01",
      SrlNoOfChaln:Math.min(99999,n0(c.srl)),
      Amount:n0(c.amt)
    }));
    j.ScheduleTPSA = o;
  }

  /* ---------------- Schedule GST ---------------- */
  const gr = (C.gst||[]).filter(r=>r.hasVal);
  if(gr.length){
    j.ScheduleGST = { TurnoverGrsRcptForGSTIN: gr.map(r=>({
      GSTINNo:(sv(r.gstin)||"NA").slice(0,15),
      AmtTurnGrossRcptGSTIN:n0(r.amt)
    })) };
  }

  /* ---------------- Schedule 115TD ---------------- */
  const CD = C.td||{};
  if(CD.on){
    const o = {
      FMVTotTrustInst:n0(CD.fmv),
      LessTotLiaTrustInst:n0(CD.liab),
      NetValAsst:n0(CD.netVal),
      FMVAsstAcqrdRfrdSec101:n0(CD.fmv101),
      FMVAsstAcqPeriodFromDateCrtn:n0(CD.fmv12aa),
      FMVAsstTrnfsrdSec115TD2:n0(CD.fmv115td2),
      FMVTotal:n0(CD.fmvTot),
      LiabilityRespectofAsset4Above:n0(CD.assetLiab),
      AccretedIncomeSection115TD:n0(CD.accreted),
      AddIncPay115TDMarginalRate:n0(CD.tax7),
      InterestPayable115TE:n0(CD.int8),
      AddIncIntstPayb:n0(CD.total10),
      TaxIntstPaid:n0(CD.paid11),
      NetPaybleRefble:n0(CD.net12)
    };
    if(CD.spec) o.SpecifiedDateUs115TD = CD.spec;
    const ch = (O.td&&O.td.challans||[]).filter(c=>ISO(c.date)||st0(c.bank)||st0(c.bsr)||R(c.amt));
    if(ch.length) o.DepositofTaxAccInc = { DepositofTaxAccIncDtls: ch.map(c=>({
      DateDep:ISO(c.date)||"2025-04-01",
      NameBankBranch:(sv(c.bank)||"NA").slice(0,125),
      BSRCode:(sv(c.bsr)||"0000000").slice(0,7),
      SrlNoOfChaln:Math.min(99999,n0(c.srl)),
      Amount:n0(c.amt)
    })) };
    j.Schedule115TD = o;
  }
}

/* ---- import ------------------------------------------------------ */
function impOther(I){
  const read = [];
  S.other = S.other || {};

  /* Schedule PTI */
  if(I && I.SchedulePTI){
    const l4 = o => o ? {inc:nz(o.AmountOfInc), loss:nz(o.CurrYrLossShareByInvstFund), tds:nz(o.TDSAmount)} : {};
    const l3 = o => o ? {inc:nz(o.AmountOfInc), tds:nz(o.TDSAmount)} : {};
    S.other.pti = (I.SchedulePTI.SchedulePTIDtls||[]).map(b=>{
      const c = b.CapitalGainsPTI||{}, x = b.IncClmdPTI||{};
      const r = {kind:b.InvstmntCvrdUs115UA115UB||"", name:b.BusinessName||"", pan:b.BusinessPAN||"",
        hp:l4(b.IncFromHP), st111a:l4(c.STCG_Sec111A), stOth:l4(c.STCG_Others),
        lt112a:l4(c.LTCG_Sec112A), ltOth:l4(c.LTCG_Others),
        osDiv:l3(b.OS_Dividend), osOth:l3(b.OS_Others), ex23fbb:l3(x.Sec23FBB)};
      if(x.SecBIncExmptDtl){r.exBcode=x.SecBIncExmptDtl.SectionCode||"";
        const d=x.SecBIncExmptDtl.SecBCIncExmptDtl||{}; r.exB={inc:nz(d.AmountOfInc), tds:nz(d.TDSAmount)};}
      if(x.SecCIncExmptDtl){r.exCcode=x.SecCIncExmptDtl.SectionCode||"";
        const d=x.SecCIncExmptDtl.SecBCIncExmptDtl||{}; r.exC={inc:nz(d.AmountOfInc), tds:nz(d.TDSAmount)};}
      return r;
    });
    read.push("Schedule PTI");
  }

  /* Schedule IF */
  if(I && I.ScheduleIF){
    const A = I.ScheduleIF;
    S.other.if = {
      n: nz(A.PartnerInNumberOfFirms),
      firms:(A.PartnerFirmDetails||[]).map(f=>({
        name:f.FirmName||"", pan:f.FirmPAN||"", audit:f.IsLiableToAudit||"", s92e:f.Sec92EFirmFlag||"",
        pct:nz(f.ProfitSharePercent), profit:nz(f.ProfitShareAmt),
        intr:nz(f.IntrstAmtDueOrRecv), cap:nz(f.FirmCapBalOn31Mar)}))
    };
    read.push("Schedule IF");
  }

  /* Schedule TPSA */
  if(I && I.ScheduleTPSA){
    const T = I.ScheduleTPSA;
    S.other.tpsa = {
      amt: nz(T.AmtPrimaryAdjUs92CE_2A),
      challans:(T.DtlsTaxesPaid||[]).map(c=>({
        bsr:c.BSRCode||"", bank:c.BankBranchName||"", date:dmy(c.DateDep)||"",
        srl:nz(c.SrlNoOfChaln), amt:nz(c.Amount)}))
    };
    read.push("Schedule TPSA");
  }

  /* Schedule GST */
  if(I && I.ScheduleGST){
    S.other.gst = (I.ScheduleGST.TurnoverGrsRcptForGSTIN||[]).map(r=>({
      gstin:r.GSTINNo||"", amt:nz(r.AmtTurnGrossRcptGSTIN)}));
    read.push("Schedule GST");
  }

  /* Schedule 115TD */
  if(I && I.Schedule115TD){
    const D5 = I.Schedule115TD;
    S.other.td = {
      fmv:nz(D5.FMVTotTrustInst), liab:nz(D5.LessTotLiaTrustInst),
      fmv101:nz(D5.FMVAsstAcqrdRfrdSec101), fmv12aa:nz(D5.FMVAsstAcqPeriodFromDateCrtn),
      fmv115td2:nz(D5.FMVAsstTrnfsrdSec115TD2), assetLiab:nz(D5.LiabilityRespectofAsset4Above),
      specDate:dmy(D5.SpecifiedDateUs115TD)||"", intOvr:"",
      challans:(((D5.DepositofTaxAccInc||{}).DepositofTaxAccIncDtls)||[]).map(c=>({
        date:dmy(c.DateDep)||"", bank:c.NameBankBranch||"", bsr:c.BSRCode||"",
        srl:nz(c.SrlNoOfChaln), amt:nz(c.Amount)}))
    };
    read.push("Schedule 115TD");
  }

  return read;
}

/* ---- checks ------------------------------------------------------ */
function chkOther(){
  const out = [], C = S.C.other||{}, O = S.other||{};

  /* ---- Schedule PTI — header mandatory when a block carries a value ---- */
  (C.pti||[]).forEach((b,i)=>{
    if(!b.hasVal) return;
    if(!st0(b.kind) || !st0(b.name) || !PAN_RE.test(b.pan))
      out.push({lvl:"err", t:"Schedule PTI", m:"Fund "+(i+1)+": the section covered, the name and a valid PAN of the trust/fund are mandatory.", sec:"other"});
  });

  /* ---- Schedule IF ---- */
  const CI = C.if||{rows:[], tot:{}};
  (CI.rows||[]).forEach((f,i)=>{
    if(!f.hasVal) return;
    if(!st0(f.name) || !PAN_RE.test(f.pan) || !st0(f.audit) || !st0(f.s92e))
      out.push({lvl:"err", t:"Schedule IF", m:"Firm "+(i+1)+": name, a valid PAN, the audit flag and the 92E flag are all mandatory.", sec:"other"});
    if(f.pct<0 || f.pct>100)
      out.push({lvl:"err", t:"Schedule IF", m:"Firm "+(i+1)+": percentage share in profit must be between 0 and 100.", sec:"other"});
  });
  if(CI.any && st0(O.if&&O.if.n)!=="" && R(O.if.n)!==CI.rows.filter(f=>f.hasVal).length)
    out.push({lvl:"warn", t:"Schedule IF", m:"Number of firms ("+R(O.if.n)+") does not match the number of firm rows entered ("+CI.rows.filter(f=>f.hasVal).length+").", sec:"other"});
  if((CI.tot||{}).intr)
    out.push({lvl:"warn", t:"Schedule IF", m:"Total interest due/received ("+RS(CI.tot.intr)+") must equal Sl.No. 14xi(b) of Schedule P&L (rule n55).", sec:"other"});

  /* ---- Schedule TPSA — gated on Part A-OI item 17 ---- */
  if(C.tpsa && C.tpsa.on){
    if(!(C.tpsa.amt>0))
      out.push({lvl:"err", t:"Schedule TPSA", m:"Option u/s 92CE(2A) is 'Yes' (Part A-OI item 17) — enter the amount of primary adjustment on which the option is exercised (Sl.1).", sec:"other"});
    (O.tpsa&&O.tpsa.challans||[]).forEach((c,i)=>{
      const any = st0(c.bsr)||st0(c.bank)||st0(c.date)||N(c.amt)||N(c.srl);
      if(!any) return;
      if(!st0(c.bsr)||!st0(c.bank)||!ISO(c.date)||!(N(c.amt)>0))
        out.push({lvl:"err", t:"Schedule TPSA", m:"Challan "+(i+1)+": BSR code, bank/branch, date of deposit and amount are all required.", sec:"other"});
      const dd=D(c.date);
      if(dd && dd>new Date())
        out.push({lvl:"err", t:"Schedule TPSA", m:"Challan "+(i+1)+": date of deposit cannot be after today (rule n756).", sec:"other"});
    });
  } else if(O.tpsa && (N(O.tpsa.amt) || (O.tpsa.challans||[]).length)){
    out.push({lvl:"warn", t:"Schedule TPSA", m:"TPSA data is filled, but Part A-OI item 17 is not 'Yes' — Schedule TPSA will not be written.", sec:"other"});
  }

  /* ---- Schedule GST — all-or-nothing per row (A779/A780) ---- */
  (C.gst||[]).forEach((r,i)=>{
    if(!r.hasVal) return;
    if(st0(r.gstin) && !(r.amt>0))
      out.push({lvl:"err", t:"Schedule GST", m:"Row "+(i+1)+": GSTIN is filled, so the annual value of outward supplies is mandatory (A779).", sec:"other"});
    if(r.amt>0 && !st0(r.gstin))
      out.push({lvl:"err", t:"Schedule GST", m:"Row "+(i+1)+": an amount is filled, so the GSTIN is mandatory (A780).", sec:"other"});
    if(st0(r.gstin) && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/.test(r.gstin))
      out.push({lvl:"warn", t:"Schedule GST", m:"Row "+(i+1)+": GSTIN should be 2 numeric, 5 alphabets, 4 numeric, 1 alphabet, then 3 alphanumeric (15 chars).", sec:"other"});
  });

  /* ---- Schedule 115TD ---- */
  const CD = C.td||{};
  if(CD.accreted>0 && !ISO((O.td||{}).specDate))
    out.push({lvl:"err", t:"Schedule 115TD", m:"Accreted income is present, so the Specified date u/s 115TD (Sl.9) is mandatory (rule n761).", sec:"other"});
  if(st0((O.td||{}).specDate)){
    const sd = D(O.td.specDate);
    if(sd && (sd < new Date(2025,3,1) || sd > new Date(2026,2,31)))
      out.push({lvl:"err", t:"Schedule 115TD", m:"The specified date u/s 115TD must fall within FY 2025-26 (01/04/2025 – 31/03/2026).", sec:"other"});
  }
  (O.td&&O.td.challans||[]).forEach((c,i)=>{
    const any = st0(c.date)||st0(c.bank)||st0(c.bsr)||N(c.amt)||N(c.srl);
    if(!any) return;
    if(!ISO(c.date)||!st0(c.bank)||!st0(c.bsr)||!(N(c.amt)>0))
      out.push({lvl:"err", t:"Schedule 115TD", m:"Challan "+(i+1)+": date, bank/branch, BSR code and amount are all required.", sec:"other"});
    if(st0(c.bsr) && !BSR.test(st0(c.bsr).toUpperCase()))
      out.push({lvl:"warn", t:"Schedule 115TD", m:"Challan "+(i+1)+": BSR code should be 3 numeric + 4 alphanumeric (7 chars).", sec:"other"});
    const dd=D(c.date);
    if(dd && dd>new Date())
      out.push({lvl:"err", t:"Schedule 115TD", m:"Challan "+(i+1)+": date of deposit cannot be after today.", sec:"other"});
  });

  return out;
}

/* ---- register ---------------------------------------------------- */
/* SEAM (for the integrator): Schedule PTI's cross-schedule ties (HP Sl.2 A203,
   CG B10 A385, OS Sl.2d A477, EI Sl.5 A732) require this section's engine to
   run BEFORE those heads if they are to read S.C.other.pti / .ptiTot within the
   same compute pass (S.C is rebuilt each pass). The CEO fixed corder:28 here,
   which computes AFTER those heads — so today HP/OS/CG/EI fall back to their own
   manual PTI figures. If auto-feed from PTI is wanted, give "other" a corder
   lower than hp/os/cg/ei (they sit at 6). S.C.other.pti is published either way. */
reg({id:"other", t:"Other schedules and disclosures", ref:"PTI · IF · TPSA · GST · 115TD",
     f:secOther,
     s:()=>{const C=S.C.other||{};
       const bits=[];
       const p=(C.pti||[]).filter(x=>x.hasVal).length; if(p) bits.push(p+" PTI");
       if((C.if||{}).any) bits.push((C.if.rows||[]).filter(f=>f.hasVal).length+" firm(s)");
       if(C.tpsa&&C.tpsa.on&&C.tpsa.net) bits.push("TPSA "+RS(C.tpsa.net));
       const g=(C.gst||[]).filter(x=>x.hasVal).length; if(g) bits.push(g+" GST");
       if((C.td||{}).net12) bits.push("115TD "+RS(C.td.net12));
       return bits.join(" · ");},
     eng:engOther, exp:expOther, imp:impOther, chk:chkOther, order:28, corder:28});
