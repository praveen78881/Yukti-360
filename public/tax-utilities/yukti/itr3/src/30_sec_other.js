/* =====================================================================
   ITR-3 · Section "other" — Other schedules (Sch 5A · PTI · ESOP)
   Books: books/ITR-3/Sch_5A.md, books/ITR-3/PTI.md, books/ITR-3/ESOP.md
   Schema blocks: Schedule5A2014, SchedulePTI, ScheduleESOP
   Compute order: 24 (after the income heads, before tax @ 90).

   REGIME (books/ITR-3/REGIME.md): none of these three schedules appears in
   the 115BAC closure list — Schedule 5A (apportionment disclosure), Schedule
   PTI (pass-through disclosure, income already carried by each head's own
   schedule) and Schedule ESOP (tax deferral, not an income concession) are
   unaffected by the new-vs-old regime. So this section carries NO regime-gated
   item: it renders and computes identically with isNew() true or false. The
   engine still guards every cross-read and reads isNew() only to keep the
   contract explicit.

   GTI CONTRIBUTION: all three are disclosures/tax-deferral — none independently
   adds to Gross Total Income (Sch 5A only apportions receipts already sitting
   in the person's own head schedules; PTI's net per head "reappears in that
   head's own schedule" per the book; ESOP is deferred *tax*, not income). So
   S.C.other.income = 0. ESOP's column-7 (tax that has fallen due this year) is
   exposed separately as S.C.other.esopTaxPayable for the tax section's
   Part B-TTI 8c roll-up.
   ===================================================================== */

/* ---- state ------------------------------------------------------- */
S.other = S.other || {
  /* Schedule 5A — single non-repeating spouse block (four heads) */
  s5a:{ name:"", pan:"", aadhaar:"", aud44ab:"", aud92e:"",
        hp:{inc:"",spouse:"",tds:"",tdsSp:""},
        bp:{inc:"",spouse:"",tds:"",tdsSp:""},
        cg:{inc:"",spouse:"",tds:"",tdsSp:""},
        os:{inc:"",spouse:"",tds:"",tdsSp:""} },
  /* Schedule PTI — repeatable, one object per business trust / investment fund */
  pti:[],
  /* Schedule ESOP — two header fields, six fixed year rows, one sale sub-table */
  esop:{ pan:"", dpiit:"", defer2627:"",
         yrs:{ "2021-22":{bf:"",sec:"",ceased:"",dtCease:""},
               "2022-23":{bf:"",sec:"",ceased:"",dtCease:""},
               "2023-24":{bf:"",sec:"",ceased:"",dtCease:""},
               "2024-25":{bf:"",sec:"",ceased:"",dtCease:""},
               "2025-26":{bf:"",sec:"",ceased:"",dtCease:""} },
         sales:[] }
};

/* SEED defaults for new repeatable rows (the shared shell add-handler keeps its
   own SEED map; these are harmless and document the empty-row shape). */
SEED.pti = SEED.pti || {};
SEED.sales = SEED.sales || {};

/* dropdown value lists — from books/ITR-3/enums.json where present, else the book */
const OTH_SECTYPE = [["FS","Fully Sold"],["PS","Partly Sold"],["NS","Not sold"]]; /* ScheduleESOP…SecurityType */
const OTH_CEASED  = [["Y","Yes"],["N","No"]];                                     /* ScheduleESOP…CeasedEmployee */
const OTH_YN      = [["Y","Yes"],["N","No"]];                                     /* Schedule5A2014 audit flags */
const OTH_SALEAY  = [["2021-22","2021-22"],["2022-23","2022-23"],["2023-24","2023-24"],
                     ["2024-25","2024-25"],["2025-26","2025-26"]];                /* sale sub-table AY (E18:E21) */
const OTH_PTIKIND = [["A","Section 115UA"],["B","Section 115UB"],["C","Section 115U"]]; /* InvstmntCvrdUs115UA115UB A/B/C (book) */
const OTH_ESOP_YRS = ["2021-22","2022-23","2023-24","2024-25","2025-26"];         /* the five active allotment years */
/* per-year schema object suffix and its TotalTaxAttributedAmt<nn> key (from --leaves) */
const OTH_ESOP_OBJ = {"2021-22":"2122","2022-23":"2223","2023-24":"2324","2024-25":"2425","2025-26":"2526"};
const OTH_ESOP_TTA = {"2021-22":"21","2022-23":"22","2023-24":"22","2024-25":"22","2025-26":"25"};

/* the Portuguese-Civil-Code master switch lives in Part A General (the "who"
   section), mirroring ITR-2's S.pi.s5a. Guarded read — if "who" is not built
   yet the card shows its "opens when Yes" note. */
const oth_s5a = ()=> (S.pi && S.pi.s5a) === "Yes";

/* ---- engine ------------------------------------------------------ */
function engOther(){
  S.other = S.other || {};
  const O = S.other;
  const C = S.C.other = { income:0 };
  isNew(); /* regime read — no closures apply to this section (see header) */

  /* ---------- Schedule 5A (book Sch_5A.md) ---------- */
  /* four heads HP/BP/CG/OS, each with (ii) receipts, (iii) spouse share,
     (iv) TDS deducted, (v) TDS apportioned. Total row = SUM of the four. */
  const s5 = O.s5a || {};
  const HEADS5A = ["hp","bp","cg","os"];
  const h5 = HEADS5A.map(h=>{const r=s5[h]||{};
    return {h, inc:R(r.inc), spouse:R(r.spouse), tds:Math.max(0,R(r.tds)), tdsSp:Math.max(0,R(r.tdsSp))};});
  const t5 = {inc:0,spouse:0,tds:0,tdsSp:0};
  h5.forEach(x=>{t5.inc+=x.inc; t5.spouse+=x.spouse; t5.tds+=x.tds; t5.tdsSp+=x.tdsSp;}); /* [I14][J14][K14][L14] */
  C.s5a = {heads:h5, tot:t5, on:oth_s5a()};

  /* ---------- Schedule PTI (book PTI.md) ---------- */
  /* each block: net = income − loss per leaf; CG/OS/exempt aggregate rows. */
  const leaf   = r => {r=r||{}; const inc=R(r.inc), loss=R(r.loss), tds=Math.max(0,R(r.tds));
                        return {inc, loss, net:inc-loss, tds};};        /* N=L−M */
  const leaf3  = r => {r=r||{}; const inc=R(r.inc), tds=Math.max(0,R(r.tds));
                        return {inc, net:inc, tds};};                    /* OS/exempt: no loss col */
  const add4   = (a,b)=>({inc:a.inc+b.inc, loss:a.loss+b.loss, net:a.net+b.net, tds:a.tds+b.tds});
  const add3   = (a,b)=>({inc:a.inc+b.inc, net:a.net+b.net, tds:a.tds+b.tds});
  C.pti = (O.pti||[]).map(b=>{
    b = b||{};
    const hp = leaf(b.hp);
    const st111a = leaf(b.st111a), stOth = leaf(b.stOth);
    const lt112a = leaf(b.lt112a), ltOth = leaf(b.ltOth);
    const stAgg = add4(st111a, stOth);      /* [L7]=L8+L9 … */
    const ltAgg = add4(lt112a, ltOth);      /* [L10]=L11+L12 … */
    const osDiv = leaf3(b.osDiv), osOth = leaf3(b.osOth);
    const osAgg = add3(osDiv, osOth);       /* [L13]=L14+L15, [N13]=N14+N15 */
    const ex23  = leaf3(b.ex23fbb);
    const exB   = {code:st0(b.exBcode), inc:R((b.exB||{}).inc), loss:R((b.exB||{}).loss),
                   tds:Math.max(0,R((b.exB||{}).tds))}; exB.net = exB.inc - exB.loss;
    const exC   = {code:st0(b.exCcode), inc:R((b.exC||{}).inc), loss:R((b.exC||{}).loss),
                   tds:Math.max(0,R((b.exC||{}).tds))}; exC.net = exC.inc - exC.loss;
    const exTot = {inc:ex23.inc+exB.inc+exC.inc, net:ex23.net+exB.net+exC.net,
                   tds:ex23.tds+exB.tds+exC.tds};                        /* [L16]=L17+L18+L19 */
    const hasVal = !!(st0(b.name)||st0(b.pan)|| hp.inc||hp.loss||stAgg.inc||ltAgg.inc||osAgg.inc||exTot.inc);
    return {kind:b.kind||"", name:st0(b.name), pan:st0(b.pan).toUpperCase(),
            hp, st111a, stOth, lt112a, ltOth, stAgg, ltAgg,
            osDiv, osOth, osAgg, ex23, exB, exC, exTot, hasVal};
  });

  /* ---------- Schedule ESOP (book ESOP.md) ---------- */
  const E = O.esop || {};
  const sales = (E.sales||[]);
  /* column 4(ii) H per year: SUMIF(sale rows tagged to this AY) unless fully
     sold or ceased employee (then the whole b/f falls due) */
  const esopYear = y => {
    const r = (E.yrs||{})[y] || {};
    const bf = R(r.bf);
    const sumSales = sales.filter(s=>s.ay===y).reduce((a,s)=>a+Math.max(0,R(s.amt)),0);
    /* [H8] IF(OR(FS, ceased Yes), TaxPrevAY, SUMIF(...)) */
    const h = (r.sec==="FS" || r.ceased==="Y") ? bf : sumSales;
    /* [L] column 7 */
    let l;
    if(y==="2021-22"){
      l = bf;                                   /* [L8] = TaxPrevAY — 48-month expiry falls due */
    } else {
      /* [L9] nested IF, in the book's order */
      if(r.sec==="FS")                     l = bf;            /* ceased Y or N & Fully Sold ⇒ F */
      else if(r.sec==="PS" && r.ceased==="Y") l = bf;         /* ceased Y & Partly Sold ⇒ F */
      else if(r.sec==="FS" || r.sec==="PS")   l = h;          /* remaining sold (PS & ceased N) ⇒ H */
      else if(r.sec==="NS" && r.ceased==="N") l = 0;          /* Not sold & ceased N ⇒ 0 */
      else                                    l = (h>0 ? h : bf); /* else (Not sold & ceased Y, or blank) */
    }
    const bal = Math.max(0, bf - l);            /* [M] = MAX(0, col3 − col7) */
    return {y, bf, h, l, bal, sumSales, sec:r.sec||"", ceased:r.ceased||"", dtCease:r.dtCease||""};
  };
  const esopRows = OTH_ESOP_YRS.map(esopYear);
  let esopDue = 0; esopRows.forEach(r=>{esopDue += r.l;});            /* Σ col 7 → Part B-TTI 8c */
  /* whole-schedule sum of tax attributed (TotalTaxAttributedAmt) */
  const esopSoldTotal = sales.reduce((a,s)=>a+Math.max(0,R(s.amt)),0);
  /* 2026-27 balance [M13] ties to Part B-TTI Gross Tax Payable (3b/8b). tax
     computes at order 90 (after this section), so read it guarded; a manual
     defer2627 override wins when the user supplies it. */
  const defer2627 = st0(E.defer2627)!=="" ? R(E.defer2627) : R((S.C.tax||{}).gross||0);
  C.esop = {rows:esopRows, due:R(esopDue), soldTotal:R(esopSoldTotal), defer2627:R(defer2627)};
  C.esopTaxPayable = R(esopDue);

  /* GTI contribution — disclosures only, nothing added here (see header) */
  C.income = 0;
}

/* ---- renderer ---------------------------------------------------- */
function secOther(){
  const O = S.other||{}, C = S.C.other||{};
  let h = "";

  /* ===== Schedule 5A ===== */
  {
    const A5 = C.s5a || {heads:[],tot:{}};
    const on = oth_s5a();
    let inner;
    if(!on){
      inner = note('Opens when "Are you governed by the Portuguese Civil Code under section 5A?" is answered Yes in <b>Who is filing</b> (Part A General). When No, Schedule 5A must not be filed (rule A14 equivalent).');
    } else {
      let b = "";
      b += row("Name of the Spouse", inp("other.s5a.name",{max:125}), {req:1, ref:"[D4]"});
      b += row("PAN of the Spouse", inp("other.s5a.pan",{max:10}), {req:1, ref:"[D5]"});
      b += row("Aadhaar of the spouse", inp("other.s5a.aadhaar",{max:12}), {ref:"[D6]"});
      b += row("Whether books of accounts of spouse is audited u/s 44AB or under any other provisions",
               sel("other.s5a.aud44ab", OTH_YN), {ref:"[D7]"});
      b += row("Whether your spouse is liable for audit u/s 92E (or a partner of a firm liable for audit u/s 92E)",
               sel("other.s5a.aud92e", OTH_YN), {ref:"[D8]"});
      /* the apportionment table — four heads + computed Total */
      const heads = [["hp","House Property"],["bp","Business or profession"],
                     ["cg","Capital Gains"],["os","Other Sources"]];
      let t = '<div class="full"><table class="gt" style="min-width:640px"><thead><tr>'+
        '<th class="l">Heads of Receipts (i)</th>'+
        '<th class="req">Receipts under the head (ii)</th>'+
        '<th class="req">Amount apportioned to spouse (iii)</th>'+
        '<th class="req">TDS deducted on (ii) (iv)</th>'+
        '<th class="req">TDS apportioned to spouse (v)</th></tr></thead><tbody>';
      heads.forEach(([k,lbl])=>{
        t += '<tr><td class="l">'+esc(lbl)+'</td>'+
          '<td>'+inp("other.s5a."+k+".inc",{n:1})+'</td>'+
          '<td>'+inp("other.s5a."+k+".spouse",{n:1})+'</td>'+
          '<td>'+inp("other.s5a."+k+".tds",{n:1})+'</td>'+
          '<td>'+inp("other.s5a."+k+".tdsSp",{n:1})+'</td></tr>';
      });
      const T = A5.tot||{};
      t += '<tr><td class="l"><b>Total (1+2+3+4)</b></td>'+
        '<td class="num">'+cell(T.inc)+'</td><td class="num">'+cell(T.spouse)+'</td>'+
        '<td class="num">'+cell(T.tds)+'</td><td class="num">'+cell(T.tdsSp)+'</td></tr>';
      t += '</tbody></table></div>';
      b += t;
      b += note("Column (ii) is the whole receipt under the head; column (iii) is the spouse's half. Salary is not apportioned. TDS in column (v) is credited to the spouse (Schedule TDS, with the spouse's PAN).");
      inner = b;
    }
    h += card("s5a","Schedule 5A — Apportionment of receipts between spouses (Portuguese Civil Code, section 5A)",
              (on?RS((A5.tot||{}).spouse||0):""), inner);
  }

  /* ===== Schedule PTI ===== */
  {
    let b = note("Pass-through income from a business trust (REIT/InvIT), investment fund (AIF I/II) or venture capital fund/company under sections 115U / 115UA / 115UB. Each head's net reappears in that head's own schedule (HP item 2, OS Sl.10 dividend, SI special rates); TDS in column (10) flows to Schedule TDS.");
    const blocks = C.pti || [];
    (O.pti||[]).forEach((raw,i)=>{
      const cb = blocks[i] || {};
      const pre = "other.pti."+i+".";
      const title = "Trust / fund " + (i+1) + (st0(raw.name)?" — "+esc(st0(raw.name)):"");
      let inner = "";
      inner += row("Investment covered by section", sel(pre+"kind", OTH_PTIKIND), {req:1, ref:"(2)"});
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
      t += money4("stOth","aii · others", 36);
      t += aggRow("b · Long term (112A + other)", cb.ltAgg, 20);
      t += money4("lt112a","bi · Section 112A", 36);
      t += money4("ltOth","bii · other than section 112A", 36);
      t += '<tr><td class="l" colspan="5"><b>iii · Other Sources</b></td></tr>';
      t += aggRow("Other Sources total", cb.osAgg, 20);
      t += money3("osDiv","a · Dividend", 36);
      t += money3("osOth","b · others", 36);
      t += '<tr><td class="l" colspan="5"><b>iv · Income claimed to be exempt</b></td></tr>';
      t += aggRow("Exempt total", cb.exTot, 20);
      t += money3("ex23fbb","a · u/s 10(23FBB)", 36);
      t += '</tbody></table></div>';
      /* iv b / iv c — optional u/s specify rows */
      t += row("iv b · Exempt u/s (specify code)", inp(pre+"exBcode",{max:10}), {ref:"(iv b)"});
      t += '<div class="full"><table class="gt" style="min-width:520px"><tbody>'+
        '<tr><td class="l">Amount</td><td>'+inp(pre+"exB.inc",{n:1})+'</td>'+
        '<td class="l">Loss share</td><td>'+inp(pre+"exB.loss",{n:1})+'</td>'+
        '<td class="l">TDS</td><td>'+inp(pre+"exB.tds",{n:1})+'</td></tr></tbody></table></div>';
      t += row("iv c · Exempt u/s (specify code)", inp(pre+"exCcode",{max:10}), {ref:"(iv c)"});
      t += '<div class="full"><table class="gt" style="min-width:520px"><tbody>'+
        '<tr><td class="l">Amount</td><td>'+inp(pre+"exC.inc",{n:1})+'</td>'+
        '<td class="l">Loss share</td><td>'+inp(pre+"exC.loss",{n:1})+'</td>'+
        '<td class="l">TDS</td><td>'+inp(pre+"exC.tds",{n:1})+'</td></tr></tbody></table></div>';
      inner += t;
      b += blk("pti"+i, title, (cb.hasVal?"Entered":"Empty"), inner, "other.pti."+i);
    });
    b += '<button class="add" data-add="other.pti">Add a trust / fund</button>';
    h += card("pti","Schedule PTI — Pass-through income (115U / 115UA / 115UB)",
              (blocks.some(x=>x.hasVal)?blocks.filter(x=>x.hasVal).length+" block(s)":""), b);
  }

  /* ===== Schedule ESOP ===== */
  {
    const CE = C.esop || {rows:[]};
    let b = "";
    b += note("Tax deferred u/s 192(1C) on the ESOP perquisite [17(2)(vi)] of an eligible start-up (section 80-IAC). The deferred tax falls due on the earliest of: shares sold, cessation of employment, or 48 months from the end of the AY of allotment.");
    b += row("PAN of the employer (eligible start-up)", inp("other.esop.pan",{max:10}), {ref:"[C4]"});
    b += row("DPIIT registration number of the employer", inp("other.esop.dpiit",{max:50}), {ref:"[C5]"});
    /* main six-year table */
    let t = '<div class="full"><table class="gt" style="min-width:820px"><thead><tr>'+
      '<th>SI (1)</th><th class="l">Assessment Year (2)</th>'+
      '<th>Tax deferred b/f (3)</th><th class="l">Sold (4i)</th>'+
      '<th>Total 4(ii)</th><th class="l">Ceased (5)</th><th class="l">Date ceasing (5i)</th>'+
      '<th>Tax payable this AY (7)</th><th>Balance c/f (8)=3−7</th></tr></thead><tbody>';
    (CE.rows||[]).forEach((r,i)=>{
      const y = r.y, pre = "other.esop.yrs."+y+".";
      t += '<tr><td class="num">'+(i+1)+'</td><td class="l">'+esc(y)+'</td>'+
        '<td>'+inp(pre+"bf",{n:1})+'</td>'+
        '<td class="l">'+sel(pre+"sec", OTH_SECTYPE, {style:"width:100%"})+'</td>'+
        '<td class="num">'+cell(r.h)+'</td>'+
        '<td class="l">'+sel(pre+"ceased", OTH_CEASED, {style:"width:100%"})+'</td>'+
        '<td>'+inp(pre+"dtCease",{ph:DF,max:10})+'</td>'+
        '<td class="num">'+cell(r.l)+'</td>'+
        '<td class="num">'+cell(r.bal)+'</td></tr>';
    });
    /* 2026-27 row — only AY + balance (ties to Part B-TTI gross tax payable) */
    t += '<tr><td class="num">6</td><td class="l">2026-27</td>'+
      '<td class="num">'+cell(0)+'</td><td class="l">—</td><td class="num">'+cell(0)+'</td>'+
      '<td class="l">—</td><td class="l">—</td><td class="l">—</td>'+
      '<td class="num">'+cell(CE.defer2627)+'</td></tr>';
    t += '</tbody></table></div>';
    b += t;
    b += row("2026-27 balance c/f override (Part B-TTI Gross Tax Payable, if a fresh deferral this year)",
             inp("other.esop.defer2627",{n:1}), {ref:"[M13]", hint:"leave blank to pull from Part B-TTI"});
    /* sale sub-table — feeds column 4(ii); one flat table tagged by AY */
    b += sub("Sale sub-table — leave blank if the shares were not sold (feeds column 4(ii))");
    b += grid("other.esop.sales",[
      {k:"ay",h:"Assessment Year (i)",t:"sel",w:"140px",opts:OTH_SALEAY},
      {k:"date",h:"Date of sale (ii)",t:"date",w:"140px"},
      {k:"amt",h:"Tax attributed out of the sale (iii)",t:"num",w:"180px"}
    ], (O.esop&&O.esop.sales)||[], {empty:"No sale rows.", add:"Add a sale row"});
    b += row("Total tax attributed (whole schedule)", cell(CE.soldTotal), {ref:"TotalTaxAttributedAmt"});
    b += row("Tax payable this year from ESOP (Σ column 7 → Part B-TTI 8c)", cell(CE.due));
    h += card("esop","Schedule ESOP — Tax deferred on ESOP of an eligible start-up",
              (CE.due||CE.soldTotal?RS(CE.due):""), b);
  }

  return h;
}

/* ---- export ------------------------------------------------------ */
function expOther(j){
  const C = S.C.other||{}, O = S.other||{};

  /* ---- Schedule 5A (only when governed by Portuguese Civil Code = Yes) ---- */
  if(oth_s5a()){
    const A5 = C.s5a || {heads:[],tot:{}};
    const hd = x => ({IncRecvdUndHead:sg((x||{}).inc), AmtApprndOfSpouse:sg((x||{}).spouse),
                      AmtTDSDeducted:n0((x||{}).tds), TDSApprndOfSpouse:n0((x||{}).tdsSp)});
    const X = O.s5a||{};
    const o = {
      NameOfSpouse:(sv(X.name)||"NA").slice(0,125),
      PANOfSpouse:PAN_RE.test(st0(X.pan).toUpperCase())?st0(X.pan).toUpperCase():"AAAPA0000A",
      HPHeadIncome:hd(A5.heads[0]), BusHeadIncome:hd(A5.heads[1]),
      CapGainHeadIncome:hd(A5.heads[2]), OtherSourcesHeadIncome:hd(A5.heads[3]),
      TotalHeadIncome:hd(A5.tot)
    };
    if(AADH.test(st0(X.aadhaar))) o.AadhaarOfSpouse = st0(X.aadhaar);
    if(sv(X.aud44ab)) o.BooksSpouse44ABFlg = X.aud44ab;
    if(sv(X.aud92e))  o.BooksSpouse92EFlg  = X.aud92e;
    j.Schedule5A2014 = o;
  }

  /* ---- Schedule PTI ---- */
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
        SecBCIncExmptDtl:{AmountOfInc:sg(b.exB.inc), CurrYrLossShareByInvstFund:n0(b.exB.loss),
                          NetIncomeLoss:sg(b.exB.net), TDSAmount:n0(b.exB.tds)}};
      if(sv(b.exC.code)) IncClmdPTI.SecCIncExmptDtl = {SectionCode:b.exC.code,
        SecBCIncExmptDtl:{AmountOfInc:sg(b.exC.inc), CurrYrLossShareByInvstFund:n0(b.exC.loss),
                          NetIncomeLoss:sg(b.exC.net), TDSAmount:n0(b.exC.tds)}};
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

  /* ---- Schedule ESOP ---- */
  const CE = C.esop||{rows:[]};
  const E = O.esop||{};
  if(st0(E.pan) || CE.due || CE.soldTotal || st0(E.dpiit)){
    const o = {
      PanofStartUp:PAN_RE.test(st0(E.pan).toUpperCase())?st0(E.pan).toUpperCase():"AAAAA0000A",
      DPIITRegNo:(sv(E.dpiit)||"NA").slice(0,50),
      TotalTaxAttributedAmt:n0(CE.soldTotal)
    };
    (CE.rows||[]).forEach(r=>{
      const ev = {};
      if(sv(r.sec)) ev.SecurityType = r.sec;
      const sl = (E.sales||[]).filter(s=>s.ay===r.y && Math.max(0,R(s.amt))>0 && ISO(s.date));
      if(sl.length) ev.ScheduleESOPEventDtlsType = sl.map(s=>({Date:ISO(s.date), TaxAttributedAmt:n0(s.amt)}));
      if(sv(r.ceased)) ev.CeasedEmployee = r.ceased;
      if(r.ceased==="Y" && ISO(r.dtCease)) ev.DateOfCeasing = ISO(r.dtCease);
      const y = {
        AssessmentYear:r.y,
        TaxDeferredBFEarlierAY:n0(r.bf),
        TaxPayableCurrentAY:n0(r.l),
        BalanceTaxCF:n0(r.bal)
      };
      if(Object.keys(ev).length) y.ScheduleESOPEventDtls = ev;
      /* block total = Σ of this block's per-row TaxAttributedAmt (col 4(ii)
         sub-table). Empty block ⇒ 0, exactly as before. */
      const rowTaxAttr = sl.reduce((a,s)=>a+n0(s.amt),0);
      y["TotalTaxAttributedAmt"+OTH_ESOP_TTA[r.y]] = n0(rowTaxAttr);
      o["ScheduleESOP"+OTH_ESOP_OBJ[r.y]+"_Type"] = y;
    });
    o.ScheduleESOP2627_Type = {AssessmentYear:"2026-27", BalanceTaxCF:n0(CE.defer2627)};
    j.ScheduleESOP = o;
  }
}

/* ---- import ------------------------------------------------------ */
function impOther(I3){
  const read = [];
  S.other = S.other || {};

  /* Schedule 5A */
  if(I3 && I3.Schedule5A2014){
    const A = I3.Schedule5A2014;
    const hd = o => o ? {inc:nz(o.IncRecvdUndHead), spouse:nz(o.AmtApprndOfSpouse),
                          tds:nz(o.AmtTDSDeducted), tdsSp:nz(o.TDSApprndOfSpouse)} : {};
    S.other.s5a = {
      name:A.NameOfSpouse||"", pan:A.PANOfSpouse||"", aadhaar:A.AadhaarOfSpouse||"",
      aud44ab:A.BooksSpouse44ABFlg||"", aud92e:A.BooksSpouse92EFlg||"",
      hp:hd(A.HPHeadIncome), bp:hd(A.BusHeadIncome),
      cg:hd(A.CapGainHeadIncome), os:hd(A.OtherSourcesHeadIncome)
    };
    read.push("Schedule 5A");
  }

  /* Schedule PTI */
  if(I3 && I3.SchedulePTI){
    const l4 = o => o ? {inc:nz(o.AmountOfInc), loss:nz(o.CurrYrLossShareByInvstFund), tds:nz(o.TDSAmount)} : {};
    const l3 = o => o ? {inc:nz(o.AmountOfInc), tds:nz(o.TDSAmount)} : {};
    S.other.pti = (I3.SchedulePTI.SchedulePTIDtls||[]).map(b=>{
      const c = b.CapitalGainsPTI||{}, x = b.IncClmdPTI||{};
      const r = {kind:b.InvstmntCvrdUs115UA115UB||"", name:b.BusinessName||"", pan:b.BusinessPAN||"",
        hp:l4(b.IncFromHP), st111a:l4(c.STCG_Sec111A), stOth:l4(c.STCG_Others),
        lt112a:l4(c.LTCG_Sec112A), ltOth:l4(c.LTCG_Others),
        osDiv:l3(b.OS_Dividend), osOth:l3(b.OS_Others), ex23fbb:l3(x.Sec23FBB)};
      if(x.SecBIncExmptDtl){r.exBcode=x.SecBIncExmptDtl.SectionCode||"";
        const d=x.SecBIncExmptDtl.SecBCIncExmptDtl||{}; r.exB={inc:nz(d.AmountOfInc),loss:nz(d.CurrYrLossShareByInvstFund),tds:nz(d.TDSAmount)};}
      if(x.SecCIncExmptDtl){r.exCcode=x.SecCIncExmptDtl.SectionCode||"";
        const d=x.SecCIncExmptDtl.SecBCIncExmptDtl||{}; r.exC={inc:nz(d.AmountOfInc),loss:nz(d.CurrYrLossShareByInvstFund),tds:nz(d.TDSAmount)};}
      return r;
    });
    read.push("Schedule PTI");
  }

  /* Schedule ESOP */
  if(I3 && I3.ScheduleESOP){
    const E = I3.ScheduleESOP;
    const yrs = {}, sales = [];
    [["2021-22","2122"],["2022-23","2223"],["2023-24","2324"],["2024-25","2425"],["2025-26","2526"]].forEach(([y,k])=>{
      const b = E["ScheduleESOP"+k+"_Type"]; if(!b) return;
      const ev = b.ScheduleESOPEventDtls||{};
      yrs[y] = {bf:nz(b.TaxDeferredBFEarlierAY), sec:ev.SecurityType||"", ceased:ev.CeasedEmployee||"", dtCease:dmy(ev.DateOfCeasing)||""};
      (ev.ScheduleESOPEventDtlsType||[]).forEach(s=>sales.push({ay:y, date:dmy(s.Date)||"", amt:s.TaxAttributedAmt}));
    });
    S.other.esop = {pan:E.PanofStartUp||"", dpiit:E.DPIITRegNo||"",
      defer2627:nz((E.ScheduleESOP2627_Type||{}).BalanceTaxCF), yrs:yrs, sales:sales};
    read.push("Schedule ESOP");
  }

  return read;
}

/* ---- checks ------------------------------------------------------ */
function chkOther(){
  const out = [], C = S.C.other||{}, O = S.other||{};

  /* Schedule 5A — mandatory when governed by Portuguese Civil Code (rule A6 eq.),
     must not be filed otherwise (rule A14 eq.) */
  if(oth_s5a()){
    const T = (C.s5a||{}).tot||{};
    if(!(T.inc||T.spouse||T.tds||T.tdsSp))
      out.push({lvl:"err", t:"Schedule 5A", m:"Governed by the Portuguese Civil Code is Yes, so Schedule 5A must carry the apportionment of receipts between the spouses.", sec:"other"});
    const X = O.s5a||{};
    if(!PAN_RE.test(st0(X.pan).toUpperCase()))
      out.push({lvl:"err", t:"Schedule 5A", m:"The spouse's PAN is required and must be a valid PAN.", sec:"other"});
  } else if(O.s5a && st0(O.s5a.name)){
    out.push({lvl:"warn", t:"Schedule 5A", m:"Spouse details are filled, but the Portuguese Civil Code answer is not Yes — Schedule 5A will not be written (rule A14 equivalent).", sec:"other"});
  }

  /* Schedule PTI — required header fields when a block carries a value */
  (C.pti||[]).forEach((b,i)=>{
    if(!b.hasVal) return;
    if(!st0(b.name) || !PAN_RE.test(b.pan) || !st0(b.kind))
      out.push({lvl:"err", t:"Schedule PTI", m:"Block "+(i+1)+": the section covered, name and a valid PAN of the trust/fund are mandatory.", sec:"other"});
  });

  /* Schedule ESOP — rule-document checks */
  (((C.esop||{}).rows)||[]).forEach(r=>{
    /* balance = col3 − col7 (computed, so always holds); the ties below are the warnings */
    if(r.bf>0 && !st0(r.sec) && !st0(r.ceased))
      out.push({lvl:"warn", t:"Schedule ESOP", m:r.y+": tax is deferred but no event (sold / ceased / 48-month) is answered — column 7 has been taken as the whole b/f.", sec:"other"});
    if(r.sec==="NS" && r.ceased==="N" && r.l!==0)
      out.push({lvl:"warn", t:"Schedule ESOP", m:r.y+": Not sold and not ceased — tax payable this year should be zero.", sec:"other"});
  });
  const CE = C.esop||{};
  if(st0((O.esop||{}).pan) && !PAN_RE.test(st0(O.esop.pan).toUpperCase()))
    out.push({lvl:"err", t:"Schedule ESOP", m:"The employer (start-up) PAN is not a valid PAN.", sec:"other"});
  if(st0((O.esop||{}).defer2627)==="")
    ; /* 2026-27 balance ties to Part B-TTI 3b/8b — resolved by the tax section */

  return out;
}

/* ---- register ---------------------------------------------------- */
reg({id:"other", t:"Other schedules", ref:"Sch 5A · PTI · ESOP",
     f:secOther, s:()=>{const C=S.C.other||{};const e=(C.esop||{}).due||0;
       const p=(C.pti||[]).filter(x=>x.hasVal).length; const s=oth_s5a();
       const bits=[]; if(s)bits.push("5A"); if(p)bits.push(p+" PTI"); if(e)bits.push("ESOP "+RS(e));
       return bits.join(" · ");},
     eng:engOther, exp:expOther, imp:impOther, chk:chkOther, order:11});
