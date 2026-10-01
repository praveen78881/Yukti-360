/* =====================================================================
   ITR-6 · Section "si" — Schedule SI (income chargeable at special rates)
   Built strictly from books/ITR-6/SI.md (never ITR-3's numbers/rows).
   Self-contained: state seed, engSi, secSi, expSi, impSi, chkSi and one
   reg() at the bottom. Compute order 46 — after the income heads
   (cg/os/bp) and after CYLA/BFLA, before the tax roll-up (~90).
   Structural template: forms/ITR-3/src/70_sec_si.js.

   THE COMPANY RETURN — what differs from ITR-3's SI:
   · No SPI, no IF here. On ITR-6 the SI sheet is the ONLY sheet in this
     section; it backs the single block ScheduleSI. (Schedule IF is a
     separate visible sheet in section "other"; the hidden IF fragment on
     the SI sheet, rows 108-115, is NOT part of Schedule SI — book §10.)
   · NOTHING is typed. Every income figure is fed from OS / CG / BP by the
     head's section code (book §2/§6). The filer's only input is the
     override switch EditAutopoulatedDetail (Yes unlocks manual edit).
   · The minimum-chargeable-to-tax walk is INERT for a company: THRESOLD
     (SI!R6) = 0, so column I ("Taxable Income after adjusting for Min
     Chargeable to Tax") EQUALS column H (income) on every row (book §5).
     There is NO resident basic-exemption set-off (that machinery is the
     individual/HUF utility's; a company has none). Column I is not a
     schema leaf — only H (SplRateInc) and J (SplRateIncTax) are filed.
   · The ₹1,25,000 s.112A exemption DOES apply, in the tax column only
     (book §5): ONE pool shared across own-112A (code 2A) then PTI-112A
     (PTI_LTCG12_5P112A); the 115AD(1)(b)(iii) proviso (5ADiiiP) gets a
     SEPARATE ₹1,25,000. It reduces the tax base J, not the income H.
   · Tax J = ROUND(income × rate/100) EXCEPT the three DTAA rows (treaty
     rate — the tax comes from the feed, book §4/A617/A618) and the three
     112A-@12.5% rows (base reduced by the exemption above).

   This head adds NOTHING to Gross Total Income (every rupee is already
   counted under CG/OS/BP) → S.C.si.income = 0. S.C.si.totInc feeds
   Part B-TI Sl.10 (SplRateInc) & Sl.14 (SplRateIncCalc, = income here);
   S.C.si.totTax feeds Part B-TTI Sl.2b — both consumed by the tax section
   (SI does not write the Part B blocks itself: tax owns them).
   ===================================================================== */

/* ---- state ---------------------------------------------------------- */
/* edit : "Yes"/"" — EditAutopoulatedDetail (unlock the auto table).
   rows : manual override heads [{code,rate,inc,tax}]. Used ONLY when
          edit==="Yes"; a manual row overrides (or adds to) the fed head
          of the same code. `tax` is the treaty tax for a DTAA row (else
          left blank and computed).                                       */
S.si = S.si || { edit:"", rows:[] };

/* ---- the canonical live rows of the SI sheet (book §2, non-hidden) ---
   [schemaSecCode, defaultRate%, feed('cg'|'os'|'bp'|'oth'), label].
   Order = sheet order r8..r104. The schema enum SecCode is used as the
   internal code throughout (the sheet's display-code artifacts are mapped
   to the enum in SI_CODE_ALIAS at feed time and on manual entry, book §11).  */
const SI_HEADS=[
 ["5B","12.5","bp","115B - Profits and gains of life insurance business"],
 ["1A","20","cg","111A - STCG on equity share/equity oriented fund (STT paid)"],
 ["5AD1biip","20","cg","115AD(1)(b)(ii) proviso - STCG referred to in 111A, by an FII"],
 ["21","12.5","cg","112 - Long term capital gains (with indexing)"],
 ["22","12.5","cg","112(1) - LTCG on listed securities / units"],
 ["21ciii","12.5","cg","112(1)(c)(iii) - LTCG unlisted securities, non-resident"],
 ["2A","12.5","cg","112A - LTCG on equity shares/units of EOF/business trust (STT paid)"],
 ["5AB1b","12.5","cg","115AB(1)(b) - LTCG on units purchased in foreign currency (off-shore fund)"],
 ["5A1ai","20","os","115A(1)(a)(i) - Dividends received by a foreign company"],
 ["5A1aii","20","os","115A(1)(a)(ii) - Interest from govt/Indian concern in foreign currency"],
 ["5A1aiia","5","os","115A(1)(a)(iia) - Interest from Infrastructure Debt Fund"],
 ["5A1aiiaa","5","os","115A(1)(a)(iiaa) - Interest u/s 194LC(1)"],
 ["5A1aiiab","5","os","115A(1)(a)(iiab) - Interest u/s 194LD"],
 ["5A1aiiac","5","os","115A(1)(a)(iiac) - Distributed income (interest) u/s 194LBA(2)"],
 ["5A1aiii","20","os","115A(1)(a)(iii) - Income from units of UTI/10(23D) in foreign currency"],
 ["FA","50","os","Para E-II Part I Sch. FA - royalty/technical services (non-domestic company)"],
 ["5A1bA","20","os","115A(1)(b) - Royalty & FTS, non-resident (agreement after 31-03-1976)"],
 ["5A1aA","10","os","115A(1)(a)(A) - Dividend from an IFSC unit (80LA), non-resident"],
 ["5AC1ab","10","os","115AC(1)(a) - Interest on bonds purchased in foreign currency, non-resident"],
 ["5AC1c","12.5","cg","115AC(1)(c) - LTCG on bonds/GDR purchased in foreign currency, non-resident"],
 ["5AD1i","20","os","115AD(1)(i) - Income (other than dividend) received by an FII"],
 ["5AD1iP","5","os","115AD(1)(i) proviso - FII income on bonds/govt securities (194LD)"],
 ["5ADii","30","cg","115AD(1)(b)(ii) - STCG (other than 111A) by an FII"],
 ["5ADiii","12.5","cg","115AD(1)(b)(iii) - LTCG (other than 112A) by an FII"],
 ["5ADiiiP","12.5","cg","115AD(1)(b)(iii) proviso - non-resident, sale of equity/units u/s 112A"],
 ["5BB","30","os","115BB - Winnings from lotteries, crosswords, races, card games etc."],
 ["5BBJ","30","os","115BBJ - Winnings from online games"],
 ["5BBA","20","os","115BBA - Non-resident sportsmen / sports associations / entertainer"],
 ["5BBE","60","os","115BBE - Income u/s 68/69/69A/69B/69C/69D"],
 ["5AB1a","10","os","115AB(1)(a) - Income on units purchased in foreign currency (off-shore fund)"],
 ["5BBF_BP","10","bp","115BBF - Income from patent (business or profession)"],
 ["5BBF","10","os","115BBF - Income from patent (other sources)"],
 ["5BBG_BP","10","bp","115BBG - Transfer of carbon credits (business or profession)"],
 ["5BBG","10","os","115BBG - Transfer of carbon credits (other sources)"],
 ["DTAASTCG","1","cg","STCG chargeable at special rate in India as per DTAA"],
 ["DTAALTCG","1","cg","LTCG chargeable at special rate in India as per DTAA"],
 ["DTAAOS","1","os","Other-source income chargeable at special rate in India as per DTAA"],
 ["PTI_STCG20P","20","cg","PTI - STCG chargeable @ 20%"],
 ["PTI_STCG30P","30","cg","PTI - STCG chargeable @ 30%"],
 ["PTI_LTCG12_5P112A","12.5","cg","PTI - LTCG @ 12.5% u/s 112A"],
 ["PTI_LTCG12_5P","12.5","cg","PTI - LTCG @ 12.5% other than u/s 112A"],
 ["PTI_5A1ai","20","os","PTI - 115A(1)(a)(i) dividends/interest/units in foreign currency"],
 ["PTI_5A1aii","20","os","PTI - 115A(1)(a)(ii) interest, non-residents"],
 ["PTI_5A1aiia","5","os","PTI - 115A(1)(a)(iia) Infrastructure Debt Fund interest"],
 ["PTI_5A1aiiaa","5","os","PTI - 115A(1)(a)(iiaa) interest u/s 194LC(1)"],
 ["PTI_5A1aiiab","5","os","PTI - 115A(1)(a)(iiab) interest u/s 194LD"],
 ["PTI_5A1aiiac","5","os","PTI - 115A(1)(a)(iiac) income u/s 194LBA"],
 ["PTI_5A1aiii","20","os","PTI - 115A(1)(a)(iii) units purchased in foreign currency"],
 ["PTI_FA","50","os","PTI - Para E-II Part I Sch. of the Finance Act (royalty, old agreements)"],
 ["PTI_5A1aA","10","os","PTI - 115A(1)(a)(A) dividend from an IFSC unit"],
 ["PTI_5A1bA","20","os","PTI - 115A(1)(b)(A) & 115A(b)(B) royalty / technical services, non-resident"],
 ["PTI_5AB1a","10","os","PTI - 115AB(1)(a) units purchased in foreign currency (off-shore fund)"],
 ["PTI_5AC1ab","10","os","PTI - 115AC(1)(a) interest on bonds purchased in foreign currency"],
 ["PTI_5AD1i","20","os","PTI - 115AD(1)(i) income received by an FII in respect of securities"],
 ["PTI_5AD1iP","5","os","PTI - 115AD(1)(i) proviso, income on bonds/govt securities (194LD)"],
 ["PTI_5BBA","20","os","PTI - 115BBA non-resident sportsmen / sports associations"],
 ["PTI_5BBF","10","os","PTI - 115BBF income from patent"],
 ["PTI_5BBG","10","os","PTI - 115BBG transfer of carbon credits"],
 ["5A1aiiaaP","4","os","115A(1)(a)(iiaa) - income u/s proviso to 194LC(1)"],
 ["PTI_5A1aiiaaP","4","os","PTI - 115A(1)(a)(iiaa) income u/s proviso to 194LC(1)"],
 ["5AD1iDiv","20","os","115AD(1)(i) - dividend received by an FII in respect of securities"],
 ["PTI_5AD1iDiv","20","os","PTI - 115AD(1)(i) dividend received by a specified fund"],
 ["5AD1IBd","10","os","115AD(1)(i)(B) - dividend received by a specified fund"],
 ["5AD1IB","10","os","115AD(1)(i)(B) - income (other than dividend) received by a specified fund"],
 ["PTI_5AD1IBd","10","os","PTI - 115AD(1)(i)(B) dividend received by a specified fund"],
 ["PTI_5AD1IB","10","os","PTI - 115AD(1)(i)(B) income (other than dividend), specified fund"],
 ["5AC1abD","10","os","115AC(1)(b) - Dividend on GDRs purchased in foreign currency, non-resident"],
 ["PTI_5AC1abD","10","os","PTI - 115AC(1)(b) dividend on GDRs purchased in foreign currency"],
 ["5BBH_BP","30","bp","115BBH - Virtual Digital Asset (business or profession)"],
 ["5BBH","30","cg","115BBH - Virtual Digital Asset (capital gains)"],
 ["5A1aiiaa2P","9","os","115A(1)(a)(iiaa) - income u/s second proviso to 194LC(1)"],
 ["PTI_5A1aiiaa2P","9","os","PTI - 115A(1)(a)(iiaa) income u/s second proviso to 194LC(1)"]];

/* SI_HEADS lookups */
const SI_ORDER={}, SI_RATE_DEF={}, SI_LABEL={}, SI_FEED={};
SI_HEADS.forEach((h,i)=>{SI_ORDER[h[0]]=i;SI_RATE_DEF[h[0]]=h[1];SI_FEED[h[0]]=h[2];SI_LABEL[h[0]]=h[3];});
const siLabel=c=>SI_LABEL[c]||c;

/* the SplRatePercent enum — book §3 / enums.json (12 values) */
const SI_RATES=["1","4","5","9","10","12.5","15","20","25","30","50","60"];
/* manual-override section dropdown — every live head, in sheet order */
const SI_CODE_OPTS=SI_HEADS.map(h=>[h[0],h[3]]);

/* sheet display-code → schema enum code (book §11) — applied to the fed
   maps and to a manually keyed row, so the filed SecCode is the enum
   spelling. r101/r102 VDA carry a copy-paste F-cell (PTI_5AC1b); their
   feeds are keyed by the correct enum 5BBH_BP/5BBH by their source
   sections (BP/CG), so no alias is needed for those two.                 */
const SI_CODE_ALIAS={
  STCGDTAA:"DTAASTCG", LTCGDTAA:"DTAALTCG", OSDTAA:"DTAAOS",
  "PTI_30%":"PTI_STCG30P", "PTI_20%":"PTI_STCG20P",
  "5AC1b":"5AC1abD", PTI_5AC1b:"PTI_5AC1abD", PTI_5A1b:"PTI_5A1bA"};
const siCanon=c=>SI_CODE_ALIAS[c]||c;

/* ---- classification sets (book §5, §7, and the tax section's needs) --- */
const C_112A_OWN="2A";                    /* row 20 — own 112A            */
const C_112A_PTI="PTI_LTCG12_5P112A";     /* row 63 — PTI-112A, shares pool */
const C_112A_SEP="5ADiiiP";               /* row 41 — separate ₹1,25,000  */
const SI_DTAA=["DTAASTCG","DTAALTCG","DTAAOS"];   /* treaty-rate tax (§4)  */
const siIsDTAA=c=>SI_DTAA.indexOf(c)>=0;
/* CG + dividend heads capped at 15% surcharge — a convenience the tax
   section reads (S.C.si.cgDivTax); the tax section still owns the cap. */
const SI_CGDIV=["1A","5AD1biip","21","22","21ciii","2A","5AB1b","5AC1c","5ADii",
  "5ADiii","5ADiiiP","PTI_STCG20P","PTI_STCG30P","PTI_LTCG12_5P112A","PTI_LTCG12_5P",
  "5A1ai","5A1aA","5AC1abD","5AD1iDiv","5AD1IBd",
  "PTI_5A1ai","PTI_5A1aA","PTI_5AC1abD","PTI_5AD1iDiv","PTI_5AD1IBd"];

/* ---- engine --------------------------------------------------------- */
/* Reads (all guarded — never throws on empty state). Each income section
   is expected to publish a feed map keyed by the schema SecCode:
     S.C.cg.siFeed  — the CG-fed heads (111A/112/112A/115AB/115AC/115AD
                      CG, STCG/LTCG-DTAA, all pass-through CG, 115BBH-CG)
     S.C.os.siFeed  — the OS-fed heads (115A/115AC/115AD-dividend family,
                      115BB/BBJ/BBA/BBE, patent-OS, carbon-OS, OS-DTAA,
                      every PTI_*-OS twin, 194LC/194LBA sub-cases)
     S.C.bp.siFeed  — the BP-fed heads (5B, 5BBF_BP, 5BBG_BP, 5BBH_BP)
   A feed value is either a number (income) or an object
   {inc, rate?, tax?}; a DTAA head supplies {inc, tax} (the treaty tax).
   If a sibling has not landed / published, the head is simply absent and
   SI stays inert (no throw). Codes are siCanon()-mapped so a display-code
   key still resolves to the schema enum.                                 */
function _siNorm(v){
  if(v==null)return null;
  if(typeof v==="object")return {inc:R(N(v.inc!=null?v.inc:v.income)),
    rate:(v.rate!=null&&v.rate!=="")?st0(v.rate):null,
    tax:(v.tax!=null&&v.tax!=="")?R(N(v.tax)):null};
  return {inc:R(N(v)),rate:null,tax:null};
}
function engSi(){
  const cg=(S.C.cg||{}), os=(S.C.os||{}), bp=(S.C.bp||{});
  const feeds={};                           /* code -> {inc,rate,tax,src} */
  const merge=(src,head)=>{if(!src||typeof src!=="object")return;
    Object.keys(src).forEach(k=>{const f=_siNorm(src[k]); if(!f)return;
      feeds[siCanon(k)]={inc:f.inc,rate:f.rate,tax:f.tax,src:head};});};
  merge(cg.siFeed,"cg"); merge(os.siFeed,"os"); merge(bp.siFeed,"bp");

  /* manual override (book §9 — EditAutopoulatedDetail unlocks the table) */
  if(S.si.edit==="Yes"){
    (S.si.rows||[]).forEach(r=>{if(!r||!r.code)return; const code=siCanon(r.code);
      feeds[code]={
        inc:R(N(r.inc)),
        rate:(r.rate!=null&&r.rate!=="")?st0(r.rate):(SI_RATE_DEF[code]||null),
        tax:(r.tax!=null&&r.tax!=="")?R(N(r.tax)):null,
        src:"man"};});
  }

  /* assemble rows in canonical sheet order (unknown codes appended) */
  const codes=Object.keys(feeds).sort((a,b)=>
    (SI_ORDER[a]==null?999:SI_ORDER[a])-(SI_ORDER[b]==null?999:SI_ORDER[b]));
  const rows=[];
  codes.forEach(code=>{const f=feeds[code];
    const rate=(f.rate!=null?f.rate:SI_RATE_DEF[code])||"";
    const inc=R(f.inc);
    if(inc===0)return;                       /* one row per head that carries income (book §12.1) */
    rows.push({code,rate:st0(rate),inc,tax:(f.tax!=null?R(f.tax):null),
      src:(f.src==="man"?"man":(SI_FEED[code]||f.src||""))});});

  /* ----- the ₹1,25,000 s.112A exemption (book §5, tax column only) ----
     P3 = MIN(125000, I20)         own 112A (2A)
     P5 = MIN(125000-P3, I63)      PTI-112A (PTI_LTCG12_5P112A)  [same pool]
     P6 = MIN(125000, I41)         115AD(1)(b)(iii) proviso (5ADiiiP) [separate] */
  let pool=125000, exOwn=0, exPti=0, exSep=0;
  const rOwn=rows.find(r=>r.code===C_112A_OWN);
  const rPti=rows.find(r=>r.code===C_112A_PTI);
  const rSep=rows.find(r=>r.code===C_112A_SEP);
  if(rOwn){exOwn=Math.min(pool,Math.max(0,rOwn.inc));pool-=exOwn;}
  if(rPti){exPti=Math.min(pool,Math.max(0,rPti.inc));pool-=exPti;}
  if(rSep){exSep=Math.min(125000,Math.max(0,rSep.inc));}
  const exemption112A=exOwn+exPti+exSep;

  /* ----- taxable income after Min-Chg adjust (col I) == income (col H)
     on ITR-6 (THRESOLD=0, book §5) — carried but inert. Then tax (col J). */
  let totInc=0, totCalc=0, totTax=0, tax112A=0, bbeInc=0, bbeTax=0,
      cgDivInc=0, cgDivTax=0, dtaaInc=0, dtaaTax=0;
  rows.forEach(r=>{
    r.taxable=r.inc;                          /* col I = col H (no min-chg reduction) */
    let base=r.inc;                           /* col J base */
    if(r.code===C_112A_OWN)      base=Math.max(0,r.inc-exOwn);
    else if(r.code===C_112A_PTI) base=Math.max(0,r.inc-exPti);
    else if(r.code===C_112A_SEP) base=Math.max(0,r.inc-exSep);
    if(siIsDTAA(r.code)){
      /* treaty rate — tax from the feed; fall back to base×rate only if
         the source did not supply it (A618 flags a null in checks). */
      r.tax=(r.tax!=null)?R(r.tax):R(base*N(r.rate)/100);
    }else{
      r.tax=R(base*N(r.rate)/100);            /* ROUND(H×G/100) with 112A base */
    }
    totInc+=r.inc; totCalc+=r.taxable; totTax+=r.tax;
    if(r.code===C_112A_OWN||r.code===C_112A_PTI||r.code===C_112A_SEP) tax112A+=r.tax;
    if(r.code==="5BBE"){bbeInc+=r.inc; bbeTax+=r.tax;}
    if(SI_CGDIV.indexOf(r.code)>=0){cgDivInc+=r.inc; cgDivTax+=r.tax;}
    if(siIsDTAA(r.code)){dtaaInc+=r.inc; dtaaTax+=r.tax;}});

  S.C.si={
    on:rows.length>0,
    rows,
    totInc:R(totInc),                         /* H106 → PartB-TI Sl.10 (SplRateInc) */
    totCalc:R(totCalc),                       /* I106 → PartB-TI Sl.14 (SplRateIncCalc; = income here) */
    totTax:R(totTax),                         /* J106 → PartB-TTI Sl.2b (TaxAtSpecialRates) */
    exemption112A:R(exemption112A),
    exOwn:R(exOwn), exPti:R(exPti), exSep:R(exSep),
    tax112A:R(tax112A),
    bbeInc:R(bbeInc), bbeTax:R(bbeTax),       /* 115BBE — flat 25% surcharge (tax section) */
    cgDivInc:R(cgDivInc), cgDivTax:R(cgDivTax),/* CG+dividend — 15% surcharge cap (tax section) */
    dtaaInc:R(dtaaInc), dtaaTax:R(dtaaTax),
    /* this head adds nothing to Gross Total Income — it re-presents
       income already counted under CG/OS/BP (book §1). */
    income:0};
}

/* =====================================================================
   RENDERER
   ===================================================================== */
function secSi(){
  const G=S.C.si||{}; let h="";

  h+='<div class="cgband">Schedule SI — income chargeable to tax at special rates</div>';
  h+=note("Income taxed at a special rate (please see instruction No. 7 for the rate). Every figure is picked up "+
    "automatically from Schedule OS, CG and BP by the head's section code — nothing is typed here. On a company the "+
    "\"minimum chargeable to tax\" adjustment does nothing, so column (ii) equals the income in column (i); tax in "+
    "column (iii) is rate × income, after the ₹1,25,000 section-112A exemption on the 112A / PTI-112A / 115AD-proviso heads.");

  const rows=G.rows||[];
  h+='<div class="full"><table class="gt" style="min-width:860px"><thead><tr>'+
     '<th class="l" style="width:40px">Sl.</th><th class="l" style="min-width:360px">Section</th>'+
     '<th style="width:80px">Rate (%)</th><th style="width:130px">Income (i)</th>'+
     '<th style="width:160px">Taxable after Min-Chg adj. (ii)</th><th style="width:130px">Tax thereon (iii)</th></tr></thead><tbody>';
  if(!rows.length)h+='<tr><td class="emp" colspan="6">No special-rate income — Schedule SI has nothing to show.</td></tr>';
  rows.forEach((r,i)=>{h+='<tr><td class="l">'+(i+1)+'</td>'+
    '<td class="l">'+esc(siLabel(r.code))+
      (r.src==="man"?'<span class="dt">manually edited</span>':
        (r.src?'<span class="dt">from Schedule '+esc(String(r.src).toUpperCase())+'</span>':''))+'</td>'+
    '<td class="num">'+(r.rate?esc(r.rate):"—")+(siIsDTAA(r.code)?'<span class="dt">treaty</span>':'')+'</td>'+
    '<td class="num">'+cell(r.inc)+'</td><td class="num">'+cell(r.taxable)+'</td>'+
    '<td class="num">'+cell(r.tax)+'</td></tr>';});
  h+='</tbody><tfoot><tr><td class="l" colspan="3">Total (row 106)</td>'+
     '<td>'+F(G.totInc||0)+'</td><td>'+F(G.totCalc||0)+'</td><td>'+F(G.totTax||0)+'</td></tr></tfoot></table></div>';

  if(R(G.exemption112A)>0)h+=note("₹"+F(G.exemption112A)+" of section-112A exemption applied in the tax column — "+
    "one ₹1,25,000 shared across own-112A then PTI-112A"+(R(G.exSep)>0?", and a separate ₹1,25,000 on the 115AD(1)(b)(iii) proviso head":"")+".");

  /* override switch — book r116 "Do you want to edit the details auto-populated…" */
  h+=row("Do you want to edit the details auto-populated in the table above?",
    sel("si.edit",[["Yes","Yes"],["No","No"]],{blank:false}),{ref:"r116",hint:"EditAutopoulatedDetail"});
  if(S.si.edit==="Yes"){
    h+=note("Override the auto-populated table — add or correct a special-rate head. Pick the section and its rate, "+
      "enter the income; a row here replaces the fed figure for the same section. For a DTAA head, also enter the "+
      "treaty tax (the tax is at the treaty rate, not income × 1%). The ₹1,25,000 section-112A adjustment is applied automatically.");
    h+=grid("si.rows",[
      {h:"Section",k:"code",t:"sel",opts:SI_CODE_OPTS,req:1},
      {h:"Rate (%)",k:"rate",t:"sel",opts:SI_RATES.map(x=>[x,x])},
      {h:"Income",k:"inc",t:"num",req:1},
      {h:"Treaty tax (DTAA only)",k:"tax",t:"num"}],
      S.si.rows||[],
      {min:"760px",empty:"No manual special-rate head added.",add:"Add / override a special-rate head"});
  }

  return h;
}

/* =====================================================================
   EXPORT — ScheduleSI (book §8/§12). Written only when a head carries
   income; totals present even at zero within the block. Column I
   (SplRateIncCalc) has no schema leaf and is not filed.
   ===================================================================== */
function expSi(j){
  const G=S.C.si||(engSi(),S.C.si)||{};
  const rows=(G.rows||[]).filter(r=>r.code&&N(r.inc));
  if(!rows.length){
    if(S.si.edit==="Yes"){ j.ScheduleSI={TotSplRateInc:0,TotSplRateIncTax:0,EditAutopoulatedDetail:"Y"}; }
    return;                                   /* no special income → omit the block (book §8) */
  }
  const SI={
    TotSplRateInc:n0(G.totInc),               /* H106 */
    TotSplRateIncTax:n0(G.totTax),            /* J106 */
    SplCodeRateTax:rows.map(r=>({
      SecCode:r.code,                          /* already the schema enum (SI_CODE_ALIAS applied at feed) */
      SplRatePercent:N(r.rate),
      SplRateInc:n0(r.inc),                    /* column H */
      SplRateIncTax:n0(r.tax)}))};             /* column J */
  SI.EditAutopoulatedDetail=(S.si.edit==="Yes")?"Y":"N";
  j.ScheduleSI=SI;
}

/* =====================================================================
   IMPORT — the inverse (round-trip identity). The fed heads are
   re-derived from OS/CG/BP each compute; a returned SI is read back into
   the manual-override rows only when EditAutopoulatedDetail = Y (the
   filer had edited it), so re-export reproduces the same SplCodeRateTax.
   ===================================================================== */
function impSi(I6){
  const read=[]; const si=I6.ScheduleSI; if(!si)return read;
  S.si.edit=(si.EditAutopoulatedDetail==="Y")?"Yes":(si.EditAutopoulatedDetail==="N"?"No":S.si.edit);
  if(S.si.edit==="Yes"&&Array.isArray(si.SplCodeRateTax)){
    S.si.rows=si.SplCodeRateTax.map(r=>{
      const code=r.SecCode, rate=r.SplRatePercent!=null?String(r.SplRatePercent):"";
      const o={code,rate,inc:nz(r.SplRateInc)};
      /* keep the treaty tax for a DTAA head so the round-trip is identity */
      if(siIsDTAA(code)&&r.SplRateIncTax!=null)o.tax=nz(r.SplRateIncTax);
      return o;});
  }
  read.push("Schedule SI (income at special rates)");
  return read;
}

/* =====================================================================
   CHECKS — the section's own screen validations (not the department
   rules; those are Phase 6). Regime-agnostic — a company has one regime.
   ===================================================================== */
function chkSi(){
  const out=[]; const G=S.C.si||(engSi(),S.C.si)||{};
  const add=(lvl,t,m)=>out.push({lvl,t,m,sec:"si"});

  (G.rows||[]).forEach(r=>{
    if(N(r.inc)&&!N(r.rate)&&!siIsDTAA(r.code))
      add("err","Special rate missing","The head \""+siLabel(r.code)+"\" has income of ₹"+F(r.inc)+" but no rate.");
    /* A618 — a DTAA row's tax cannot be null when its income > 0 */
    if(siIsDTAA(r.code)&&N(r.inc)>0&&!(N(r.tax)>0))
      add("warn","DTAA tax not entered","\""+siLabel(r.code)+"\" carries income of ₹"+F(r.inc)+
        " but no treaty tax. For a DTAA head the tax is at the treaty rate — set \"Do you want to edit…\" to Yes and enter it.");
  });

  /* total tax cross-check */
  if((G.rows||[]).length){
    const sumTax=(G.rows||[]).reduce((a,r)=>a+N(r.tax),0);
    if(Math.abs(sumTax-N(G.totTax))>1)
      add("err","Schedule SI total","Total tax at special rates (row 106) must equal the sum of the rows.");
  }

  if((G.totTax||0)>0)add("ok","Tax at special rates","₹"+F(G.totTax)+" of tax at special rates, added to the normal-rate tax in Part B-TTI (Sl. 2b).");
  if((G.exemption112A||0)>0)add("ok","Section-112A exemption","₹"+F(G.exemption112A)+" of the ₹1,25,000 section-112A exemption applied.");
  return out;
}

/* ---- register (overrides the boot stub) ----------------------------- */
reg({id:"si", t:"Special-rate income", ref:"Schedule SI",
  f:secSi, s:()=>{const G=S.C.si||{};
    return (G.totTax?RS(G.totTax)+" special-rate tax":(G.on?"disclosed":""));},
  eng:engSi, exp:expSi, imp:impSi, chk:chkSi, order:46, corder:46});
