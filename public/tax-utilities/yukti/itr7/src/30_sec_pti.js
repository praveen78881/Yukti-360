/* =====================================================================
   ITR-7 · Section "pti" — Schedule PTI (SchedulePTI)
     PASS-THROUGH INCOME FROM BUSINESS TRUST OR INVESTMENT FUND
     u/s 115U / 115UA / 115UB.
   Built ONLY from books/ITR-7/Schedule_PTI.md (block SchedulePTI) and
   books/ITR-7/{enums.json,skeleton.json,section_map.json} + the schema
   ITR-7_2026_Main_V1_0_schema.json.  Structural template (idioms only):
   forms/ITR-6/src/70_sec_other.js (its Schedule PTI card) and
   forms/ITR-6/src/70_sec_cg.js (the PTI heads A8 / B10) — but the exempt
   block here is the ITR-7 shape (an IncClmdExmptDtls[] array + a
   TotalSec23FBB line), not the ITR-6 fixed SecB/SecC slots.

   Schema block (section_map → pti): SchedulePTI
     SchedulePTIDtls[]  (repeatable, one object per business trust / fund)
       InvstmntCvrdUs115UA115UB, BusinessName, BusinessPAN
       IncFromHP                         {4-col: has a loss column}
       CapitalGainsPTI.{ShortTermCG, STCG_Sec111A, STCG_Others,
                        LongTermCG, LTCG_Sec112A, LTCG_Others}  {4-col}
       IncOthSrc, OS_Dividend, OS_Others {3-col: NO loss column}
       IncClmdPTI.TotalSec23FBB          {3-col}          (u/s 10(23FBB))
       IncClmdPTI.IncClmdExmptDtls[]     {SectionCode + SecBCIncExmptDtl 3-col}

   The four money columns on each head row (book §1):
     (7) AmountOfInc                 — current-year income
     (8) CurrYrLossShareByInvstFund  — share of CY loss distributed (HP+CG only)
     (9) NetIncomeLoss  = 7 − 8      — computed
     (10) TDSAmount                  — TDS on such amount
   CurrYrLossShareByInvstFund exists ONLY on the HP and CG objects; the
   other-sources and exempt objects have no col-8 leaf (book §2).

   PTI is a DISCLOSURE OF SOURCE — it does not itself add to Gross Total
   Income (each net reappears in the head's own schedule).  So
   S.C.pti.income = 0; the by-head nets are published for cyla / the head
   schedules / Part B-TI to fold in.

   CROSS-SECTION SCALARS PUBLISHED into S.C.pti (guarded reads by consumers):
     on          any block carries a value
     blocks      [] computed per-fund blocks (each head object, net & tds)
     hp          Σ i·HP net            -> Schedule HP item 2 (A383)
     stcg111a    Σ iiai·STCG 111A net  -> Schedule CG A8 / SI 111A (A442)
     stcgOth     Σ iiaii·STCG oth net  -> Schedule CG A8b / SI @30% (A389, A442)
     stcg        Σ iia·STCG net        (= stcg111a + stcgOth)
     ltcg112a    Σ iibi·LTCG 112A net  -> Schedule CG B10a1 / SI 112A (A428, A443)
     ltcgOth     Σ iibii·LTCG oth net  -> Schedule CG / SI (A444)
     ltcg        Σ iib·LTCG net        (= ltcg112a + ltcgOth)
     osDiv       Σ iiia·dividend net   -> Schedule OS 2
     osOth       Σ iiib·others net     -> Schedule OS 2d special (A305)
     os          Σ iii·OS net          (= osDiv + osOth)
     exempt      Σ iv·exempt net       -> Schedule EI (pass-through not chargeable)
     tds         Σ all col-10 TDS      -> Schedule TDS (head set accordingly)
     income      0  (disclosure — nothing added to GTI here)
   CONSUMES: none (every read is of this section's own state).
   ===================================================================== */
(function(){
"use strict";

/* ---- dropdown (books/ITR-7/Schedule_PTI.md Appendix C, verbatim) -----
   "(Select) / Section 115U / Section 115UA / Section 115UB"; the schema
   leaf InvstmntCvrdUs115UA115UB stores the chosen display string. */
const PTIKIND=[["Section 115U","Section 115U"],
               ["Section 115UA","Section 115UA"],
               ["Section 115UB","Section 115UB"]];

/* ---- state (S.pti) ------------------------------------------------- */
/* one object per business trust / investment fund; head leaves seeded
   lazily (leaf()/leaf3() guard undefined), exempt "u/s specify" lines in
   a per-fund exList grid. */
S.pti = S.pti || { funds:[] };

/* SEED for the shell add-handler (a fresh block/row is an empty object) */
SEED["pti.funds"] = SEED["pti.funds"] || {};

/* =====================================================================
   ENGINE — col 9 = 7 − 8 on HP & CG; net = income on OS & exempt.
   iia = ai+aii, iib = bi+bii, iii = a+b, iv = 23FBB + Σ(specify).
   ===================================================================== */
/* a 4-column leaf (has the col-8 loss share): HP and every CG head */
function leaf4(r){r=r||{};const inc=R(r.inc),loss=R(r.loss),tds=Math.max(0,R(r.tds));
  return {inc,loss,net:inc-loss,tds};}
/* a 3-column leaf (no loss share): OS and exempt heads */
function leaf3(r){r=r||{};const inc=R(r.inc),tds=Math.max(0,R(r.tds));
  return {inc,net:inc,tds};}
function add4(a,b){return {inc:a.inc+b.inc,loss:a.loss+b.loss,net:a.net+b.net,tds:a.tds+b.tds};}
function add3(a,b){return {inc:a.inc+b.inc,net:a.net+b.net,tds:a.tds+b.tds};}

function engPti(){
  S.pti = S.pti || {funds:[]};
  const F = S.pti.funds || [];
  const C = S.C.pti = {income:0};

  C.blocks = F.map(b=>{
    b = b || {};
    const hp     = leaf4(b.hp);
    const st111a = leaf4(b.st111a), stOth = leaf4(b.stOth);
    const lt112a = leaf4(b.lt112a), ltOth = leaf4(b.ltOth);
    const stAgg  = add4(st111a, stOth);     /* iia = ai + aii */
    const ltAgg  = add4(lt112a, ltOth);     /* iib = bi + bii */
    const osDiv  = leaf3(b.osDiv), osOth = leaf3(b.osOth);
    const osAgg  = add3(osDiv, osOth);      /* iii = a + b */
    const ex23   = leaf3(b.ex23fbb);        /* iv u/s 10(23FBB) -> TotalSec23FBB */
    const exList = (b.exList || []).map(e=>{const o=leaf3(e); o.code=st0((e||{}).code); return o;});
    const exTot  = exList.reduce((a,e)=>add3(a,e), add3({inc:0,net:0,tds:0}, ex23)); /* iv total */
    const hasVal = !!(st0(b.kind)||st0(b.name)||st0(b.pan)||
                      hp.inc||hp.loss||stAgg.inc||stAgg.loss||ltAgg.inc||ltAgg.loss||
                      osAgg.inc||exTot.inc||exTot.tds);
    return { kind:st0(b.kind), name:st0(b.name), pan:st0(b.pan).toUpperCase(),
             hp, st111a, stOth, lt112a, ltOth, stAgg, ltAgg,
             osDiv, osOth, osAgg, ex23, exList, exTot, hasVal };
  });

  const sum = f => C.blocks.reduce((a,b)=>a + R(f(b)), 0);
  /* by-head nets (col 9) — for the head schedules / cyla / Part B-TI */
  C.hp        = sum(b=>b.hp.net);        /* -> Schedule HP item 2 */
  C.stcg111a  = sum(b=>b.st111a.net);    /* -> CG A8 / SI 111A */
  C.stcgOth   = sum(b=>b.stOth.net);     /* -> CG A8b / SI @30% */
  C.stcg      = R(C.stcg111a + C.stcgOth);
  C.ltcg112a  = sum(b=>b.lt112a.net);    /* -> CG B10a1 / SI 112A */
  C.ltcgOth   = sum(b=>b.ltOth.net);     /* -> CG / SI */
  C.ltcg      = R(C.ltcg112a + C.ltcgOth);
  C.osDiv     = sum(b=>b.osDiv.net);     /* -> OS 2 dividend */
  C.osOth     = sum(b=>b.osOth.net);     /* -> OS 2 others / special */
  C.os        = R(C.osDiv + C.osOth);
  C.exempt    = sum(b=>b.exTot.net);     /* -> Schedule EI (not chargeable) */
  C.tds       = sum(b=>b.hp.tds+b.stAgg.tds+b.ltAgg.tds+b.osAgg.tds+b.exTot.tds); /* -> Schedule TDS */
  C.on        = C.blocks.some(b=>b.hasVal);
  C.income    = 0;                        /* disclosure of source — not GTI */
}

/* =====================================================================
   RENDERER
   ===================================================================== */
function secPti(){
  const O = S.pti || {funds:[]}, C = S.C.pti || {};
  let h = note("Schedule PTI — pass-through income from a business trust (REIT / InvIT) or investment fund (AIF / VCF) u/s 115U / 115UA / 115UB. Each head's net (col 9 = col 7 − col 8) is taxed in your hands under the head it had in the fund's hands, so it reappears in that head's own schedule — house property (item 2), capital gains (A8 / B10 / Schedule SI) and other sources (Sl. 2). The exempt total (iv) flows to Schedule EI; column 10 TDS flows to Schedule TDS. PTI is a disclosure of source and does not itself add to total income.");

  const blocks = C.blocks || [];
  (O.funds || []).forEach((raw,i)=>{
    raw = raw || {};
    const cb = blocks[i] || {};
    const pre = "pti.funds."+i+".";
    const title = "Trust / fund " + (i+1) + (st0(raw.name)?" — "+esc(st0(raw.name)):"");
    let inner = "";
    inner += row("Investment entity covered by section 115U/115UA/115UB", sel(pre+"kind", PTIKIND), {req:1, ref:"(2)"});
    inner += row("Name of business trust / investment fund", inp(pre+"name",{max:125}), {req:1, ref:"(3)"});
    inner += row("PAN of business trust / investment fund", inp(pre+"pan",{max:10}), {req:1, ref:"(4)"});

    /* a 4-column head row (income · loss share · net · TDS) */
    const money4 = (k,lbl,ind)=> '<tr><td class="l"'+(ind?' style="padding-left:'+ind+'px"':'')+'>'+esc(lbl)+'</td>'+
      '<td>'+inp(pre+k+".inc",{n:1})+'</td><td>'+inp(pre+k+".loss",{n:1})+'</td>'+
      '<td class="num">'+cell((cb[k]||{}).net)+'</td><td>'+inp(pre+k+".tds",{n:1})+'</td></tr>';
    /* a 3-column head row (no loss share — net = income) */
    const money3 = (k,lbl,ind)=> '<tr><td class="l"'+(ind?' style="padding-left:'+ind+'px"':'')+'>'+esc(lbl)+'</td>'+
      '<td>'+inp(pre+k+".inc",{n:1})+'</td><td class="num">'+cell(0)+'</td>'+
      '<td class="num">'+cell((cb[k]||{}).net)+'</td><td>'+inp(pre+k+".tds",{n:1})+'</td></tr>';
    /* a computed aggregate row (iia / iib / iii) */
    const aggRow = (lbl,o,ind)=> '<tr><td class="l"'+(ind?' style="padding-left:'+ind+'px"':'')+'><b>'+esc(lbl)+'</b></td>'+
      '<td class="num">'+cell((o||{}).inc)+'</td><td class="num">'+cell((o||{}).loss!==undefined?(o||{}).loss:0)+'</td>'+
      '<td class="num">'+cell((o||{}).net)+'</td><td class="num">'+cell((o||{}).tds)+'</td></tr>';

    let t = '<div class="full"><table class="gt" style="min-width:680px"><thead><tr>'+
      '<th class="l">Sl · Head of income (5)(6)</th><th>Current year income (7)</th>'+
      '<th>Share of CY loss distributed (8)</th><th>Net income/loss 9 = 7−8 (9)</th>'+
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
    t += '<tr><td class="l" colspan="5"><b>iv · Income claimed to be exempt</b></td></tr>';
    t += money3("ex23fbb","u/s 10(23FBB)", 20);
    t += '</tbody></table></div>';
    inner += t;

    /* iv a-e · exempt income under a specified section (IncClmdExmptDtls[]) */
    inner += sub("Other income claimed to be exempt (u/s — specify the section)");
    inner += grid(pre+"exList",[
        {h:"Section", k:"code", t:"txt", max:15},
        {h:"Amount of income (7)", k:"inc", t:"num"},
        {h:"Net income (9)", k:"net", t:"calc", f:r=>Math.max(0,R((r||{}).inc))},
        {h:"TDS (10)", k:"tds", t:"num"}
      ], (raw.exList||[]), {empty:"No other exempt-income line entered.", add:"Add an exempt line", min:"620px"});
    if(cb.exTot) inner += row("Total income claimed to be exempt (iv)", cell(cb.exTot.net), {ref:"(iv)"});

    h += blk("ptifund"+i, title, (cb.hasVal?"Entered":"Empty"), inner, "pti.funds."+i);
  });
  h += '<button class="add" data-add="pti.funds">Add a trust / fund</button>';

  /* section totals (by head) */
  if((C.blocks||[]).some(b=>b.hasVal)){
    h += sub("Pass-through totals across all trusts / funds (feed the head schedules)");
    h += row("Net house-property income (→ Schedule HP item 2)", cell(C.hp), {});
    h += row("Net STCG — Section 111A (→ Schedule CG A8 / SI)", cell(C.stcg111a), {});
    h += row("Net STCG — Others (→ Schedule CG A8b / SI @30%)", cell(C.stcgOth), {});
    h += row("Net LTCG — Section 112A (→ Schedule CG B10 / SI)", cell(C.ltcg112a), {});
    h += row("Net LTCG — other than 112A (→ Schedule CG / SI)", cell(C.ltcgOth), {});
    h += row("Net dividend (→ Schedule OS 2)", cell(C.osDiv), {});
    h += row("Net other-source income (→ Schedule OS 2d)", cell(C.osOth), {});
    h += row("Net exempt pass-through income (→ Schedule EI)", cell(C.exempt), {});
    h += row("Total TDS on pass-through income (→ Schedule TDS)", cell(C.tds), {});
  }
  return h;
}

/* the section-bar summary (screen order) */
function selPti(){
  const C = S.C.pti || {};
  const n = (C.blocks||[]).filter(b=>b.hasVal).length;
  return n ? (n + (n===1?" fund":" funds")) : "";
}

/* =====================================================================
   EXPORT — writes SchedulePTI.SchedulePTIDtls[] (every head object present)
   ===================================================================== */
function expPti(j){
  const C = S.C.pti || {};
  const pb = (C.blocks || []).filter(b=>b.hasVal);
  if(!pb.length) return;

  /* 4-col schema object (HP + CG heads carry the loss-share leaf) */
  const m4 = o => ({ AmountOfInc:sg((o||{}).inc), CurrYrLossShareByInvstFund:n0((o||{}).loss),
                     NetIncomeLoss:sg((o||{}).net), TDSAmount:n0((o||{}).tds) });
  /* 3-col schema object (OS + exempt heads — no loss-share leaf) */
  const m3 = o => ({ AmountOfInc:sg((o||{}).inc), NetIncomeLoss:sg((o||{}).net), TDSAmount:n0((o||{}).tds) });

  const arr = pb.map(b=>{
    const IncClmdPTI = { TotalSec23FBB: m3(b.ex23) };   /* iv u/s 10(23FBB) */
    const ex = (b.exList||[]).filter(e=>sv(e.code)).map(e=>({
      SectionCode: st0(e.code).slice(0,15),
      SecBCIncExmptDtl: m3(e) }));
    if(ex.length) IncClmdPTI.IncClmdExmptDtls = ex;     /* iv a-e specify sections */
    return {
      InvstmntCvrdUs115UA115UB: sv(b.kind) || "Section 115UB",
      BusinessName: (sv(b.name) || "NA").slice(0,125),
      BusinessPAN: PAN_RE.test(b.pan) ? b.pan : "AAAAA0000A",
      IncFromHP: m4(b.hp),
      CapitalGainsPTI: {
        ShortTermCG: m4(b.stAgg), STCG_Sec111A: m4(b.st111a), STCG_Others: m4(b.stOth),
        LongTermCG:  m4(b.ltAgg), LTCG_Sec112A: m4(b.lt112a), LTCG_Others: m4(b.ltOth) },
      IncOthSrc: m3(b.osAgg), OS_Dividend: m3(b.osDiv), OS_Others: m3(b.osOth),
      IncClmdPTI: IncClmdPTI
    };
  });
  put(j, "SchedulePTI.SchedulePTIDtls", arr);
}

/* =====================================================================
   IMPORT — reads SchedulePTI back into S.pti.funds (round-trip)
   ===================================================================== */
function impPti(I){
  if(!I || !I.SchedulePTI) return [];
  const l4 = o => o ? { inc:nz(o.AmountOfInc), loss:nz(o.CurrYrLossShareByInvstFund), tds:nz(o.TDSAmount) } : {};
  const l3 = o => o ? { inc:nz(o.AmountOfInc), tds:nz(o.TDSAmount) } : {};
  S.pti = S.pti || {funds:[]};
  S.pti.funds = (I.SchedulePTI.SchedulePTIDtls || []).map(b=>{
    b = b || {};
    const cg = b.CapitalGainsPTI || {}, x = b.IncClmdPTI || {};
    const r = {
      kind: b.InvstmntCvrdUs115UA115UB || "", name: b.BusinessName || "", pan: b.BusinessPAN || "",
      hp: l4(b.IncFromHP),
      st111a: l4(cg.STCG_Sec111A), stOth: l4(cg.STCG_Others),
      lt112a: l4(cg.LTCG_Sec112A), ltOth: l4(cg.LTCG_Others),
      osDiv: l3(b.OS_Dividend), osOth: l3(b.OS_Others),
      ex23fbb: l3(x.TotalSec23FBB),
      exList: (x.IncClmdExmptDtls || []).map(e=>{
        const d = l3((e||{}).SecBCIncExmptDtl); d.code = (e||{}).SectionCode || ""; return d; })
    };
    return r;
  });
  return ["Schedule PTI"];
}

/* =====================================================================
   SECTION-LOCAL SANITY CHECKS (not the CBDT rule engine — Phase 6)
   ===================================================================== */
function chkPti(){
  const out = [];
  const C = S.C.pti || {};
  (C.blocks || []).forEach((b,i)=>{
    if(!b.hasVal) return;
    /* header mandatory when a block carries a value (book §5) */
    if(!st0(b.kind) || !st0(b.name) || !PAN_RE.test(b.pan))
      out.push({lvl:"err", t:"Schedule PTI", sec:"pti",
        m:"Trust/fund "+(i+1)+": the section covered (115U/115UA/115UB), the name and a valid PAN of the trust/fund are mandatory."});
    /* an exempt "u/s specify" line needs both a section and an amount */
    (b.exList||[]).forEach((e,k)=>{
      const hasC = !!st0(e.code), hasA = !!R(e.inc);
      if(hasC !== hasA)
        out.push({lvl:"err", t:"Schedule PTI", sec:"pti",
          m:"Trust/fund "+(i+1)+", exempt line "+(k+1)+": the section code and the amount must both be filled."});
    });
  });
  return out;
}

/* ---- register ----------------------------------------------------- */
reg({ id:"pti", t:"Pass-through income", ref:"Schedule PTI",
      f:secPti, s:selPti, eng:engPti, exp:expPti, imp:impPti, chk:chkPti,
      order:100, corder:47 });

})();
