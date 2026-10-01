/* =====================================================================
   ITR-3 · Section "si" — Specified persons, special rates & firms
   Schedules SPI · SI · IF, built strictly from books/ITR-3/SPI_SI_IF.md
   (never ITR-2's numbers/item-numbers). Self-contained: state seed,
   engSi, secSi, expSi, impSi, chkSi and one reg() at the bottom.
   compute order 28 (after the income heads — cg@14, sal@10, bp@22,
   other@24 — before tax roll-up @90). Regime-gated per REGIME.md.

   Heads:
   · SPI (book Part 1) — a plain disclosure table of clubbed income of
     specified persons; the amount is taxed under the named head
     elsewhere, so SPI adds nothing to Gross Total Income (book: "SPI
     does not add income itself").  Total I12 = Σ AmtIncluded.
   · SI (book Part 2) — the special-rate engine. One computed row per
     live special-rate head, auto-populated from the capital-gains
     buckets (S.C.cg.buckets, published by cg@14) plus the manually
     disclosed OS / DTAA / PTI / NRI heads (the sheet's "edit the
     auto-populated details?" override, EditAutopoulatedDetail). It
     re-presents income already inside GTI, so it too adds nothing to
     GTI — but its tax (TotSplRateIncTax) is what Part B-TTI adds to the
     normal-rate tax.  Implements the ₹1,25,000 s.112A exemption share
     (own-112A → PTI-112A → 115AD proviso) and the resident basic-
     exemption walk, highest special rate first (book rules O4/P4/…).
   · IF (book Part 3) — a disclosure table of the partnership firms in
     which the assessee was a partner; four column totals. Adds nothing
     to GTI (firm share flows through Schedule BP).

   Therefore S.C.si.income = 0 (this head's contribution to GTI is nil —
   every rupee here is already counted under CG / OS / BP). S.C.si.totTax
   is the special-rate tax the tax section rolls up.
   ===================================================================== */

/* ---- state ---------------------------------------------------------- */
/* spi   : Schedule SPI persons  [{name,pan,aadhaar,rel,amt,head}]
   firms : Schedule IF firms     [{name,pan,audit,sec92e,pct,profit,
                                    interest,remun,capbal}]
   edit  : SI "Do you want to edit the auto-populated details?" (Yes/"")
   rows  : the SI heads the user discloses manually (OS / DTAA / PTI /
           NRI 115A/AC/AD/E / winnings / patent / carbon / PF-111 …),
           each {code,rate,inc}. The capital-gains special heads are
           auto-populated from Schedule CG and are NOT stored here.       */
S.si = S.si || { spi:[], firms:[], edit:"", rows:[] };

/* SPI head-of-income dropdown — book "Dropdowns", schema HeadIncIncluded */
const SPI_HEADS=[["BP","Business/Profession"],["SA","Salary"],["HP","House Property"],
  ["CG","Capital Gains"],["OS","Other sources"],["EI","Exempt Income"]];

/* SI SecCode dropdown — verbatim from books/ITR-3/enums.json
   (ScheduleSI.SplCodeRateTax[].SecCode). The capital-gains codes that
   the engine auto-populates from Schedule CG are marked cg:1 so the
   manual table can steer the filer to the non-CG heads.                  */
const SI_CODE_OPTS=[
 ["1","111 - accumulated balance of recognised PF"],
 ["1A","111A - STCG on shares/units (STT paid)"],
 ["21","112 - LTCG with indexing"],
 ["22","112 - LTCG without indexing"],
 ["21ciii","112(1)(c)(iii) - LTCG unlisted securities, non-resident"],
 ["2A","112A - LTCG equity/EOMF/business trust (STT paid)"],
 ["5A1ai","115A(1)(a)(i) - Dividends/interest/units in foreign currency"],
 ["5A1aA","115A(1)(a)(A) - Dividend from unit in IFSC, non-resident"],
 ["5A1aii","115A(1)(a)(ii) - Interest from govt/Indian concern in FC"],
 ["5A1aiia","115A(1)(a)(iia) - Interest from Infrastructure Debt Fund"],
 ["5A1aiiaa","115A(1)(a)(iiaa) - Interest u/s 194LC(1)"],
 ["5A1aiiaaP","115A(1)(a)(iiaa) - Income u/s proviso to 194LC(1)"],
 ["5A1aiiaa2P","115A(1)(a)(iiaa) - Income u/s second proviso to 194LC(1)"],
 ["5A1aiiab","115A(1)(a)(iiab) - Interest u/s 194LD"],
 ["5A1aiiac","115A(1)(a)(iiac) - Interest u/s 194LBA"],
 ["5A1aiii","115A(1)(a)(iii) - Income from units of UTI in FC"],
 ["5A1bA","115A(1)(b)(A) - Royalty / FTS from govt or Indian concern"],
 ["5AC1ab","115AC(1)(a) - Interest on bonds in FC, non-resident"],
 ["5AC1abD","115AC(1)(b) - Dividend on GDRs in FC, non-resident"],
 ["5AC1c","115AC(1)(c) - LTCG on bonds/GDR in FC, non-resident"],
 ["5ACA1a","115ACA(1)(a) - Income from GDR in FC, resident"],
 ["5ACA1b","115ACA(1)(b) - LTCG on GDR in FC, resident"],
 ["5AD1i","115AD(1)(i) - Income (other than dividend) of an FII"],
 ["5AD1iDiv","115AD(1)(i) - Dividend income of an FII"],
 ["5AD1iP","115AD(1)(i) - Interest of an FII u/s 194LD"],
 ["5ADii","115AD(1)(ii) - STCG by an FII"],
 ["5AD1biip","115AD(1)(b)(ii) - STCG referred to in 111A"],
 ["5ADiii","115AD(1)(iii) - LTCG by an FII"],
 ["5ADiiiP","Proviso to 115AD(iii)"],
 ["5BB","115BB - Winnings from lotteries, races, card games etc."],
 ["5BBJ","115BBJ - Winnings from online games"],
 ["5BBA","115BBA - Non-resident sportsmen / associations"],
 ["5BBH","115BBH - Virtual Digital Asset (Capital Gains)"],
 ["5BBH_BP","115BBH - Virtual Digital Asset (Business/Profession)"],
 ["5BBE","115BBE - Income u/s 68/69/69A/69B/69C/69D"],
 ["5BBF","115BBF - Income from patent (Other sources)"],
 ["5BBF_BP","115BBF - Income from patent (Business/Profession)"],
 ["5BBG","115BBG - Transfer of carbon credits (Other sources)"],
 ["5BBG_BP","115BBG - Transfer of carbon credits (Business/Profession)"],
 ["5Ea","115E(a) - Investment income of a non-resident Indian"],
 ["5Eb","115E(b) - LTCG of an NRI on a foreign exchange asset"],
 ["DTAASTCG","STCG chargeable at special rate as per DTAA"],
 ["DTAALTCG","LTCG chargeable at special rate as per DTAA"],
 ["DTAAOS","Other source income chargeable under DTAA rate"],
 ["PTI_STCG20P","PTI - STCG chargeable @20% u/s 111A"],
 ["PTI_STCG30P","PTI - STCG chargeable @30%"],
 ["PTI_LTCG12_5P112A","PTI - LTCG @12.5% u/s 112A"],
 ["PTI_LTCG12_5P","PTI - LTCG @12.5% other than 112A"],
 ["PTI_5A1ai","PTI - 115A(1)(a)(i)"],
 ["PTI_5A1aA","PTI - 115A(1)(a)(A)"],
 ["PTI_5A1aii","PTI - 115A(1)(a)(ii)"],
 ["PTI_5A1aiia","PTI - 115A(1)(a)(iia)"],
 ["PTI_5A1aiiaa","PTI - 115A(1)(a)(iiaa)"],
 ["PTI_5A1aiiaaP","PTI - 115A(1)(a)(iiaa) proviso to 194LC(1)"],
 ["PTI_5A1aiiaa2P","PTI - 115A(1)(a)(iiaa) second proviso to 194LC(1)"],
 ["PTI_5A1aiiab","PTI - 115A(1)(a)(iiab)"],
 ["PTI_5A1aiiac","PTI - 115A(1)(a)(iiac)"],
 ["PTI_5A1aiii","PTI - 115A(1)(a)(iii)"],
 ["PTI_5A1bA","PTI - 115A(1)(b)(A)"],
 ["PTI_5AC1ab","PTI - 115AC(1)(a)"],
 ["PTI_5AC1abD","PTI - 115AC(1)(b)"],
 ["PTI_5ACA1a","PTI - 115ACA(1)(a)"],
 ["PTI_5AD1i","PTI - 115AD(1)(i)"],
 ["PTI_5AD1iDiv","PTI - 115AD(1)(i) dividend"],
 ["PTI_5AD1iP","PTI - 115AD(1)(i) u/s 194LD"],
 ["PTI_5BBA","PTI - 115BBA"],
 ["PTI_5BBF","PTI - 115BBF"],
 ["PTI_5BBG","PTI - 115BBG"],
 ["PTI_5Ea","PTI - 115E(a)"]];
/* the SplRatePercent enum — book "Dropdowns" / enums.json (12 values) */
const SI_RATES=["1","4","5","9","10","12.5","15","20","25","30","50","60"];
/* a friendly default rate per code, from the section's statutory rate
   (AY 2026-27, post-23-Jul-2024). Used to seed a fresh manual row and to
   rate the auto-populated CG heads. The filer can still pick any enum
   rate. Rates the book leaves to the DTAA are seeded blank.               */
const SI_RATE_DEF={"1":"","1A":"20","21":"20","22":"12.5","21ciii":"12.5","2A":"12.5",
  "5A1ai":"20","5A1aA":"10","5A1aii":"20","5A1aiia":"5","5A1aiiaa":"5","5A1aiiaaP":"5",
  "5A1aiiaa2P":"9","5A1aiiab":"5","5A1aiiac":"5","5A1aiii":"20","5A1bA":"10","5AC1ab":"10",
  "5AC1abD":"10","5AC1c":"12.5","5ACA1a":"10","5ACA1b":"12.5","5AD1i":"20","5AD1iDiv":"20",
  "5AD1iP":"5","5ADii":"30","5AD1biip":"20","5ADiii":"12.5","5ADiiiP":"12.5","5BB":"30",
  "5BBJ":"30","5BBA":"20","5BBH":"30","5BBH_BP":"30","5BBE":"60","5BBF":"10","5BBF_BP":"10",
  "5BBG":"10","5BBG_BP":"10","5Ea":"20","5Eb":"12.5","DTAASTCG":"","DTAALTCG":"","DTAAOS":"",
  "PTI_STCG20P":"20","PTI_STCG30P":"30","PTI_LTCG12_5P112A":"12.5","PTI_LTCG12_5P":"12.5"};
const codeLabel=c=>{const r=SI_CODE_OPTS.find(x=>x[0]===c);return r?r[1]:c;};

/* ---- classification sets (book Part 2 rules) ------------------------- */
/* the ₹1,25,000 s.112A exemption family, in the book's sharing order
   (O4/P4 own-112A → O6/P6 PTI-112A → O7/P7 115AD(1)(b)(iii) proviso).     */
const SI_112A_ORDER=["2A","PTI_LTCG12_5P112A","5ADiiiP"];
/* the capital-gain special heads that share the resident basic-exemption
   slack, highest rate first (book col-X walk 1st..12th; matched by
   descending rate at engine time among the codes present).               */
const SI_CG_WALK=["1A","21","22","2A","5ADiiiP","5ADii","PTI_STCG20P","PTI_STCG30P",
  "PTI_LTCG12_5P112A","PTI_LTCG12_5P"];
/* codes whose tax is surcharge-capped at 15% (CG + dividend) — feeds
   S.C.si.cgDivTax, read by the tax section's surcharge cap.               */
const SI_CGDIV=["1A","21","22","2A","5ADiii","5ADiiiP","5ADii","5AD1biip","PTI_STCG20P",
  "PTI_STCG30P","PTI_LTCG12_5P112A","PTI_LTCG12_5P","5A1ai","5A1aA","5AC1abD","5ACA1a",
  "5AD1iDiv","PTI_5A1ai","PTI_5A1aA","PTI_5AD1iDiv"];
const SI_115AD=["5AD1i","5AD1iDiv","5AD1iP","5ADii","5AD1biip","5ADiii","5ADiiiP",
  "PTI_5AD1i","PTI_5AD1iDiv","PTI_5AD1iP"];

/* ---- engine --------------------------------------------------------- */
/* Cross-reads are guarded (never throw). CG publishes S.C.cg.buckets
   (cg@14): si112a (112A @12.5, ₹1.25L exempt here), si112 (other LTCG
   @12.5), si111a20 (STCG 111A @20), si115bbh (VDA @30), stDTAA / ltDTAA.  */
function engSi(){
  const New=isNew();
  const resident=S.pi&&S.fs.resStatus==="RES";
  const cg=(S.C.cg||{}), cgB=(cg.buckets||{});

  /* ----- SPI total (book I12 = Σ AmtIncluded) — a disclosure ------- */
  const spiTotal=R((S.si.spi||[]).reduce((a,p)=>a+N(p.amt),0));

  /* ----- IF totals (book row 132) --------------------------------- */
  const ifRows=S.si.firms||[];
  const ifTot={
    profit:R(ifRows.reduce((a,f)=>a+N(f.profit),0)),   /* K132 TotalProfitShareAmt */
    interest:R(ifRows.reduce((a,f)=>a+N(f.interest),0)),/* L132 TotalIntrstAmtDueOrRecv */
    remun:R(ifRows.reduce((a,f)=>a+N(f.remun),0)),      /* M132 TotalRemunernAmtDueOrRecv */
    capbal:R(ifRows.reduce((a,f)=>a+N(f.capbal),0))};   /* N132 TotalFirmCapBalOn31Mar */

  /* ----- SI rows: auto (from Schedule CG) + manual (OS/DTAA/PTI…) -- */
  const rows=[];
  const push=(code,rate,inc,src)=>{if(R(inc)===0)return;
    rows.push({code,rate:st0(rate),inc:R(inc),src});};
  /* auto-populate the capital-gains special heads from cg buckets, scaled to the
     POST-BFLA income (Schedule BFLA column 5 = S.C.loss.afterB) so the special-rate
     income and its tax reflect brought-forward-loss set-off — rules A870/A871/A872/
     A873 require SI heads to equal BFLA col 5. Proportional split across sub-heads of
     the same loss row (112A vs other 112 both sit under afterB.lt125). Scale defaults
     to 1 when the loss engine has not run (no regression). VDA (115BBH) has no set-off. */
  const _Lb=(S.C.loss||{}).afterB||{};
  const _scl=(pre,post)=>{pre=N(pre);return pre>0?(N(post)/pre):1;};
  const _lt125pre=N(cgB.si112a)+N(cgB.si112);
  const _ltS =_scl(_lt125pre, _Lb.lt125!=null?_Lb.lt125:_lt125pre);
  const _st20S=_scl(cgB.si111a20, _Lb.st20 !=null?_Lb.st20 :cgB.si111a20);
  const _stDs =_scl(cgB.stDTAA,   _Lb.stDTAA!=null?_Lb.stDTAA:cgB.stDTAA);
  const _ltDs =_scl(cgB.ltDTAA,   _Lb.ltDTAA!=null?_Lb.ltDTAA:cgB.ltDTAA);
  push("2A","12.5",R(N(cgB.si112a)*_ltS),"cg");   /* 112A @12.5 — ₹1.25L exemption applied below */
  push("22","12.5",R(N(cgB.si112)*_ltS),"cg");    /* 112(1) other LTCG @12.5 */
  push("1A","20",R(N(cgB.si111a20)*_st20S),"cg"); /* 111A STCG @20 */
  push("5BBH","30",cgB.si115bbh,"cg");            /* 115BBH VDA (capital gains) @30 — no BFLA set-off */
  push("DTAASTCG",(cg.dtaaStcgRate||""),R(N(cgB.stDTAA)*_stDs),"cg");  /* STCG at DTAA rate */
  push("DTAALTCG",(cg.dtaaLtcgRate||""),R(N(cgB.ltDTAA)*_ltDs),"cg");  /* LTCG at DTAA rate */
  /* the manually disclosed heads (the sheet's edit override) */
  (S.si.rows||[]).forEach(r=>{if(!r||!r.code)return;
    push(r.code,r.rate||SI_RATE_DEF[r.code]||"",N(r.inc),"man");});

  /* ----- taxable income after the ₹1,25,000 s.112A exemption ------- */
  /* book O4/P4/O6/P6/O7/P7: one ₹1,25,000 pool shared across the 112A
     family in order own-112A → PTI-112A → 115AD proviso.                 */
  let pool112A=125000;
  const taxable={};                         /* col H per row index */
  rows.forEach((r,i)=>{taxable[i]=r.inc;});
  SI_112A_ORDER.forEach(code=>{
    rows.forEach((r,i)=>{if(r.code!==code)return;
      const ex=Math.min(pool112A,Math.max(0,taxable[i]));
      taxable[i]=Math.max(0,taxable[i]-ex);pool112A-=ex;});});
  const exemption112A=125000-pool112A;

  /* ----- resident basic-exemption walk (book U19/col-X) ----------- */
  /* U19: a resident's unused basic exemption (₹4,00,000 new regime, else
     by age) feeds the adjustment; nil for a non-resident. U22: it is the
     slack over the normal-rate income — max(0, basic − (GTI − splInc)).
     Set off against the capital-gain heads, highest rate first.           */
  const basic = resident ? (New?400000:(superSr()?500000:senior()?300000:250000)) : 0;
  const splIncTotal=rows.reduce((a,r)=>a+r.inc,0);
  const normalRateInc=Math.max(0,R((S.C.gti||0))-splIncTotal);   /* stale GTI ok; converges over paints */
  let slack=Math.max(0,basic-normalRateInc);
  /* order the CG-walk rows by descending rate, then set off */
  const walkIdx=rows.map((r,i)=>i)
    .filter(i=>SI_CG_WALK.indexOf(rows[i].code)>=0)
    .sort((a,b)=>N(rows[b].rate)-N(rows[a].rate));
  walkIdx.forEach(i=>{if(slack<=0)return;
    const u=Math.min(slack,taxable[i]);taxable[i]-=u;slack-=u;});
  const exemptionBasic=Math.max(0,basic-normalRateInc)-slack;

  /* ----- tax thereon (book I = ROUND(H*F/100,0)) ------------------- */
  let totInc=0,totCalc=0,totTax=0,tax112A=0,tax115AD=0,bbeTax=0,cgDivTax=0;
  rows.forEach((r,i)=>{
    const h=Math.max(0,R(taxable[i]));
    const tax=R(h*N(r.rate)/100);           /* ROUND(H*F/100,0) */
    r.taxable=h; r.tax=tax;
    totInc+=r.inc; totCalc+=h; totTax+=tax;
    if(SI_112A_ORDER.indexOf(r.code)>=0) tax112A+=tax;
    if(SI_115AD.indexOf(r.code)>=0) tax115AD+=tax;
    if(r.code==="5BBE") bbeTax+=tax;
    if(SI_CGDIV.indexOf(r.code)>=0) cgDivTax+=tax;});

  S.C.si={
    on:rows.length>0||spiTotal>0||ifRows.length>0,
    rows, spiTotal, ifTot,
    totInc:R(totInc), totCalc:R(totCalc), totTax:R(totTax),
    tax112A:R(tax112A), tax115AD:R(tax115AD), bbeTax:R(bbeTax), cgDivTax:R(cgDivTax),
    exemption112A:R(exemption112A), exemptionBasic:R(exemptionBasic),
    /* this head adds nothing to Gross Total Income — SPI is a disclosure,
       SI re-presents CG/OS income, IF discloses firm partnership. */
    income:0};
}

/* =====================================================================
   RENDERER
   ===================================================================== */
function secSi(){
  const G=S.C.si||{}; let h="";
  const resident=S.pi&&S.fs.resStatus==="RES"; const New=isNew();

  /* ===== Schedule SPI ============================================== */
  h+='<div class="cgband">Schedule SPI — income of specified persons includable u/s 64</div>';
  h+=note("Income of a specified person (spouse, minor child etc.) that section 64 includes in your income. "+
    "This is a disclosure of who it came from — the amount is taxed under the head named in the last column, "+
    "so it is not added again here.");
  h+=grid("si.spi",[
    {h:"Name of person",k:"name",t:"txt",max:125,req:1},
    {h:"PAN (optional)",k:"pan",t:"txt",max:10},
    {h:"Aadhaar (optional)",k:"aadhaar",t:"txt",max:12},
    {h:"Relationship",k:"rel",t:"txt",max:50,req:1},
    {h:"Amount (Rs)",k:"amt",t:"num",req:1},
    {h:"Head included under",k:"head",t:"sel",opts:SPI_HEADS,req:1}],
    S.si.spi||[],
    {empty:"No clubbed income disclosed.",add:"Add a specified person",
     foot:[{l:1,v:"Total amount included (I12)",span:5},{v:G.spiTotal||0}]});

  /* ===== Schedule SI =============================================== */
  h+='<div class="cgband">Schedule SI — income chargeable to tax at special rates</div>';
  h+=note("Income taxed at a special rate (please see instruction No. 7 for the rate). The capital-gains heads "+
    "are picked up automatically from Schedule CG; use the override below to disclose the other-sources, DTAA, "+
    "pass-through and non-resident heads. Tax is rate × the income after the ₹1,25,000 section-112A exemption"+
    (resident?" and, for a resident, the basic-exemption set-off":"")+".");
  const rows=G.rows||[];
  h+='<div class="full"><table class="gt" style="min-width:820px"><thead><tr>'+
     '<th class="l" style="width:40px">Sl.</th><th class="l" style="min-width:340px">Section</th>'+
     '<th style="width:90px">Rate (%)</th><th style="width:130px">Income (i)</th>'+
     '<th style="width:150px">Taxable after Min-Chg adj. (ii)</th><th style="width:130px">Tax thereon (iii)</th></tr></thead><tbody>';
  if(!rows.length)h+='<tr><td class="emp" colspan="6">No special-rate income.</td></tr>';
  rows.forEach((r,i)=>{h+='<tr><td class="l">'+(i+1)+'</td>'+
    '<td class="l">'+esc(codeLabel(r.code))+(r.src==="cg"?'<span class="dt">from Schedule CG</span>':'')+'</td>'+
    '<td class="num">'+(r.rate?esc(r.rate):"—")+'</td>'+
    '<td class="num">'+cell(r.inc)+'</td><td class="num">'+cell(r.taxable)+'</td>'+
    '<td class="num">'+cell(r.tax)+'</td></tr>';});
  h+='</tbody><tfoot><tr><td class="l" colspan="3">Total (row 119)</td>'+
     '<td>'+F(G.totInc||0)+'</td><td>'+F(G.totCalc||0)+'</td><td>'+F(G.totTax||0)+'</td></tr></tfoot></table></div>';
  if(R(G.exemption112A)>0)h+=note("₹"+F(G.exemption112A)+" of the ₹1,25,000 section-112A exemption applied to the 112A / PTI-112A / 115AD-proviso heads.");
  if(resident&&R(G.exemptionBasic)>0)h+=note("₹"+F(G.exemptionBasic)+" of unused basic exemption ("+RS(New?400000:(superSr()?500000:senior()?300000:250000))+") set off against the capital-gains special heads, highest rate first.");
  else if(!resident)h+=note("Basic-exemption set-off against special-rate income is not available to a non-resident (book U19).");

  /* override switch — book I120 "Do you want to edit the details auto-populated…" */
  h+=row("Do you want to edit the details auto-populated in the table above?",
    sel("si.edit",[["Yes","Yes"],["No","No"]],{blank:false}),{ref:"I120",hint:"EditAutopoulatedDetail"});
  if(S.si.edit==="Yes"){
    h+=note("Disclose the special-rate heads that do not come from Schedule CG — other sources, DTAA, pass-through and non-resident 115A/AC/AD/E income. Pick the section, its rate and the income; the ₹1,25,000 and basic-exemption adjustments are applied automatically.");
    h+=grid("si.rows",[
      {h:"Section",k:"code",t:"sel",opts:SI_CODE_OPTS,req:1},
      {h:"Rate (%)",k:"rate",t:"sel",opts:SI_RATES.map(x=>[x,x])},
      {h:"Income",k:"inc",t:"num",req:1}],
      S.si.rows||[],
      {empty:"No manual special-rate head added.",add:"Add a special-rate head"});
  }

  /* ===== Schedule IF =============================================== */
  h+='<div class="cgband">Schedule IF — partnership firms in which you are a partner</div>';
  h+=note("Every partnership firm in which you were a partner at any time during the previous year. "+
    "The share of profit, interest and remuneration flow through Schedule BP; the capital balance is as on 31 March.");
  const fc=(S.si.firms||[]).length;
  h+=row("Number of firms in which you are a partner",cell(fc),{ref:"row 123"});
  h+=grid("si.firms",[
    {h:"Name of the firm",k:"name",t:"txt",max:125,req:1},
    {h:"PAN of the firm",k:"pan",t:"txt",max:10,req:1},
    {h:"Liable for audit? (Y/N)",k:"audit",t:"sel",opts:[["Y","Y"],["N","N"]]},
    {h:"Section 92E applicable? (Y/N)",k:"sec92e",t:"sel",opts:[["Y","Y"],["N","N"]]},
    {h:"% share in profit",k:"pct",t:"num",req:1},
    {h:"Share in profit (i)",k:"profit",t:"num",req:1},
    {h:"Interest due/received (ii)",k:"interest",t:"num"},
    {h:"Remuneration due/received (iii)",k:"remun",t:"num"},
    {h:"Capital balance 31-Mar (iv)",k:"capbal",t:"num",req:1}],
    S.si.firms||[],
    {min:"1000px",empty:"No partnership firm disclosed.",add:"Add a firm",
     foot:[{l:1,v:"Column totals (row 132)",span:5},
       {v:(G.ifTot||{}).profit||0},{v:(G.ifTot||{}).interest||0},
       {v:(G.ifTot||{}).remun||0},{v:(G.ifTot||{}).capbal||0}]});

  return h;
}

/* =====================================================================
   EXPORT — ScheduleSPI / ScheduleSI / ScheduleIF
   ===================================================================== */
function expSi(j){
  const G=S.C.si||engSi()||S.C.si||{};

  /* ===== ScheduleSPI ===== */
  const spi=(S.si.spi||[]).filter(p=>st0(p.name)||N(p.amt)||st0(p.rel));
  if(spi.length){
    const arr=spi.map(p=>{const o={
      SpecifiedPersonName:sv(p.name),
      ReltnShip:sv(p.rel),
      AmtIncluded:n0(p.amt),
      HeadIncIncluded:sv(p.head)||"OS"};      /* required per element */
      const pan=sv(p.pan); if(pan)o.PANofSpecPerson=String(pan).toUpperCase();
      const aad=sv(p.aadhaar); if(aad)o.AaadhaarOfSpecPerson=aad;
      return o;});
    j.ScheduleSPI={SpecifiedPerson:arr};
  }

  /* ===== ScheduleSI ===== */
  const si=(G.rows||[]).filter(r=>r.code&&N(r.rate));
  const SI={
    TotSplRateInc:n0(G.totInc),          /* G119 — required even at zero */
    TotSplRateIncTax:n0(G.totTax)};      /* I119 — required even at zero */
  if(si.length){
    SI.SplCodeRateTax=si.map(r=>({
      SecCode:r.code,
      SplRatePercent:N(r.rate),
      SplRateInc:n0(r.inc),
      SplRateIncTax:n0(r.tax)}));
  }
  if(S.si.edit==="Yes")SI.EditAutopoulatedDetail="Y"; else if(si.length)SI.EditAutopoulatedDetail="N";
  j.ScheduleSI=SI;

  /* ===== ScheduleIF ===== */
  const firms=(S.si.firms||[]).filter(f=>st0(f.name)||st0(f.pan)||N(f.profit)||N(f.capbal));
  if(firms.length){
    const arr=firms.map(f=>{const o={
      FirmName:sv(f.name),
      FirmPAN:sv(f.pan)?String(f.pan).toUpperCase():undefined,
      ProfitSharePercent:N(f.pct),
      ProfitShareAmt:sg(f.profit),         /* signed — a share of loss is negative */
      FirmCapBalOn31Mar:sg(f.capbal)};     /* required per element */
      if(f.audit==="Y"||f.audit==="N")o.IsLiableToAudit=f.audit;
      if(f.sec92e==="Y"||f.sec92e==="N")o.Sec92EFirmFlag=f.sec92e;
      if(N(f.interest))o.IntrstAmtDueOrRecv=n0(f.interest);
      if(N(f.remun))o.RemunernAmtDueOrRecv=n0(f.remun);
      return o;});
    const T=G.ifTot||{};
    j.ScheduleIF={
      PartnerFirmDetails:arr,
      TotalProfitShareAmt:sg(T.profit),      /* required (signed) */
      TotalIntrstAmtDueOrRecv:n0(T.interest),
      TotalRemunernAmtDueOrRecv:n0(T.remun),
      TotalFirmCapBalOn31Mar:sg(T.capbal)};  /* required */
  }
}

/* =====================================================================
   IMPORT — the inverse
   ===================================================================== */
function impSi(I3){
  const read=[];
  const spi=I3.ScheduleSPI, si=I3.ScheduleSI, iff=I3.ScheduleIF;

  if(spi&&Array.isArray(spi.SpecifiedPerson)){
    S.si.spi=spi.SpecifiedPerson.map(p=>({
      name:p.SpecifiedPersonName||"", pan:p.PANofSpecPerson||"",
      aadhaar:p.AaadhaarOfSpecPerson||"", rel:p.ReltnShip||"",
      amt:nz(p.AmtIncluded), head:p.HeadIncIncluded||"OS"}));
    read.push("Schedule SPI (specified persons)");
  }

  if(si){
    S.si.edit=(si.EditAutopoulatedDetail==="Y")?"Yes":(si.EditAutopoulatedDetail==="N"?"No":S.si.edit);
    /* only the non-CG (manual) heads are read back into S.si.rows — the
       capital-gains heads are re-derived from Schedule CG each compute. */
    if(Array.isArray(si.SplCodeRateTax)){
      const autoCG=["2A","22","1A","5BBH","DTAASTCG","DTAALTCG"];
      S.si.rows=si.SplCodeRateTax
        .filter(r=>autoCG.indexOf(r.SecCode)<0)
        .map(r=>({code:r.SecCode, rate:r.SplRatePercent!=null?String(r.SplRatePercent):"",
          inc:nz(r.SplRateInc)}));
      read.push("Schedule SI (special-rate income)");
    }
  }

  if(iff&&Array.isArray(iff.PartnerFirmDetails)){
    S.si.firms=iff.PartnerFirmDetails.map(f=>({
      name:f.FirmName||"", pan:f.FirmPAN||"",
      audit:f.IsLiableToAudit||"", sec92e:f.Sec92EFirmFlag||"",
      pct:nz(f.ProfitSharePercent), profit:nz(f.ProfitShareAmt),
      interest:nz(f.IntrstAmtDueOrRecv), remun:nz(f.RemunernAmtDueOrRecv),
      capbal:nz(f.FirmCapBalOn31Mar)}));
    read.push("Schedule IF (partnership firms)");
  }
  return read;
}

/* =====================================================================
   CHECKS — the sheet's own rules, regime-aware
   ===================================================================== */
function chkSi(){
  const out=[]; const G=S.C.si||engSi()||S.C.si||{};
  const add=(lvl,t,m)=>out.push({lvl,t,m,sec:"si"});

  /* SPI — each disclosed person needs name / relationship / amount / head */
  (S.si.spi||[]).forEach((p,i)=>{
    if((st0(p.name)||N(p.amt)||st0(p.rel))&&(!st0(p.name)||!st0(p.rel)||!N(p.amt)||!st0(p.head)))
      add("err","Schedule SPI row "+(i+1)+" incomplete","A specified-person row needs the name, relationship, amount and the head it is included under.");
    if(st0(p.pan)&&!PAN_RE.test(String(p.pan).toUpperCase()))
      add("warn","Schedule SPI PAN","The PAN of "+(st0(p.name)||"the specified person")+" is not in the AAAAA9999A format.");
  });

  /* SI — a rated row must carry a rate; total tax cross-check */
  (G.rows||[]).forEach(r=>{if(r.inc&&!N(r.rate))
    add("err","Special rate missing","The special-rate head \""+codeLabel(r.code)+"\" has income of ₹"+F(r.inc)+" but no rate.");});
  if((G.rows||[]).length){
    const sumTax=(G.rows||[]).reduce((a,r)=>a+N(r.tax),0);
    if(Math.abs(sumTax-N(G.totTax))>1)
      add("err","Schedule SI total","Total tax at special rates (row 119) must equal the sum of the rows.");
  }

  /* IF — every firm row needs name / PAN / % share / capital balance */
  (S.si.firms||[]).forEach((f,i)=>{
    const any=st0(f.name)||st0(f.pan)||N(f.profit)||N(f.capbal);
    if(any&&(!st0(f.name)||!st0(f.pan)||f.pct==null||f.pct===""||f.capbal==null||f.capbal===""))
      add("err","Schedule IF row "+(i+1)+" incomplete","A firm row needs the name, PAN, percentage share of profit and the 31-March capital balance.");
    if(st0(f.pan)&&!PAN_RE.test(String(f.pan).toUpperCase()))
      add("err","Schedule IF PAN","\""+(st0(f.name)||"Firm "+(i+1))+"\" — the firm PAN is not a valid PAN.");
    if((N(f.pct)<0||N(f.pct)>100)&&any)
      add("err","Schedule IF share %","The percentage share of profit for \""+(st0(f.name)||"firm "+(i+1))+"\" must be between 0 and 100.");
  });
  /* IF gates Schedule BP A5a — share of firm income cannot exceed IF profit share (book note 6) */
  if((G.ifTot||{}).profit>0){
    const bpShare=R(((S.C.bp||{}).firmShare)||0);
    if(bpShare>R(G.ifTot.profit)+1)
      add("warn","Firm share vs Schedule BP","Share of firm income in Schedule BP (₹"+F(bpShare)+") exceeds the total profit share disclosed in Schedule IF (₹"+F(G.ifTot.profit)+").");
  }

  if((G.totTax||0)>0)add("ok","Tax at special rates","₹"+F(G.totTax)+" of tax at special rates, added to the normal-rate tax in Part B-TTI.");
  if((G.spiTotal||0)>0)add("ok","Clubbed income disclosed","₹"+F(G.spiTotal)+" of specified-person income disclosed in Schedule SPI.");
  return out;
}

/* ---- register ------------------------------------------------------- */
reg({id:"si", t:"Specified persons, special rates & firms", ref:"SPI · SI · IF",
  f:secSi, s:()=>{const G=S.C.si||{};
    return (G.totTax?RS(G.totTax)+" special-rate tax":((G.spiTotal||(G.ifTot||{}).profit)?"disclosed":""));},
  eng:engSi, exp:expSi, imp:impSi, chk:chkSi, order:28, corder:46});
