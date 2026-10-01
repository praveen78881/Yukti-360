/* =====================================================================
   ITR-7 · Section "si" — Special-rate, specified & accreted income.
   Three sheets / three schema blocks live in this one section
   (section_map → si):
     · Schedule SI    → block ScheduleSI     (income at special rates)
     · Schedule 115BBI→ block Schedule115BBI (specified income @30%)
     · Schedule 115TD → block Schedule115TD  (accreted income / exit tax)

   Built strictly from books/ITR-7/{Schedule_SI,Schedule_115BBI,
   Schedule_115TD}.md, books/ITR-7/{enums.json,skeleton.json,
   section_map.json} and sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json.
   Structural template: forms/ITR-6/src/70_sec_si.js (Schedule SI consume
   pattern) and forms/ITR-6/src/70_sec_cg.js (Schedule VDA card idioms).
   Every code, rate, enum and formula is taken from the ITR-7 book, never
   ported from ITR-6.

   Schedule SI CONSUMES the special-rate feeds the head sections publish
   (SI book §2/§6):
     S.C.cg.siFeed  — CG heads (111A/112/112A/115AB/115AC/115AD CG,
                      STCG/LTCG-DTAA, pass-through CG, 115BBH-CG)
     S.C.os.siFeed  — OS heads (115A/115AC/115AD-dividend family,
                      115BB/BBJ/BBA/BBE/BBC, every PTI_*-OS twin, OS-DTAA)
     S.C.bp.siFeed  — BP heads (115BBH business)
     S.C.vda.siFeed — 115BBH business (5BBHi) & capital gain (5BBHii)
   A feed value is a plain number (income — si supplies the rate & tax) or
   {inc, rate?, tax?} (a DTAA head carries {inc, tax} = treaty tax).
   In addition, the trust's anonymous-donation charge is folded in:
     S.C.vc.anon115BBC → SI code 5BBC (@30%).

   Schedule SI adds NOTHING to Gross Total Income (every rupee is already
   counted under CG/OS/BP/VDA) → S.C.si.income = 0.

   PUBLISHED for the tax section (nothing else writes S.C.si):
     S.C.si.totInc     — TotSplRateInc  (G94)  → Part B-TI special income
     S.C.si.totTax     — TotSplRateIncTax (I94) → Part B-TTI special tax
     S.C.si.bbiTotal   — Schedule 115BBI Total (base @30%)
     S.C.si.bbiTax     — 30% of the 115BBI base (convenience)
     S.C.si.td12       — Schedule 115TD item 12 (net payable/refundable)
     S.C.si.td10 / td.* — 115TD item 10 & the full computed ladder
   Plus surcharge helpers (bbeInc/bbeTax, cgDivInc/cgDivTax, dtaaInc/
   dtaaTax, tax112A, exemption112A) the tax section reads for its caps.
   ===================================================================== */
(function(){
"use strict";

/* =====================================================================
   Schedule SI — the special-rate heads (SI book §2/§3).
   [schemaSecCode, defaultRate%, feed('cg'|'os'|'bp'|'vc'), label].
   Order = the sheet's visible-row order (r7..r93); the SecCode enum
   (§3 / Appendix C, 60 members) is the internal code throughout. Rates
   are the fixed per-head column-F rate (SplRatePercent enum §3).
   ===================================================================== */
const SI_HEADS=[
 ["1A","20","cg","111A - STCG on shares/units on which STT paid"],
 ["5AD1biiP","20","cg","115AD(1)(b)(ii) Proviso - STCG referred to in 111A rws 115AD by FII"],
 ["5ADii","30","cg","115AD(1)(ii) - STCG (other than on equity share/equity oriented fund)"],
 ["22","12.5","cg","112(1) - LTCG on listed securities/units"],
 ["21ciii","12.5","cg","112(1)(c)(iii) - LTCG on unlisted securities, non-resident"],
 ["5AC1c","12.5","cg","115AC(1)(c) - LTCG for non-resident on bonds/GDR"],
 ["21","12.5","cg","112 - LTCG on others"],
 ["2A","12.5","cg","112A - LTCG on shares/units of EOF/business trust (STT paid)"],
 ["5ADiii","12.5","cg","115AD(1)(b)(iii) - LTCG (other than on equity share/equity oriented fund)"],
 ["5AB1b","12.5","cg","115AB(1)(b) - LTCG for non-resident on units referred in 115AB"],
 ["5ADiiiP","12.5","cg","115AD(1)(b)(iii) Proviso - non-resident, sale of equity share/unit of EOF"],
 ["DTAASTCG","1","cg","STCG chargeable at special rates in India as per DTAA"],
 ["DTAALTCG","1","cg","LTCG chargeable at special rates in India as per DTAA"],
 ["5AC1ab","10","os","115AC(1)(a) - interest on bonds purchased in foreign currency, non-resident"],
 ["5AC1abD","10","os","115AC(1)(b) - dividend on GDRs purchased in foreign currency, non-resident"],
 ["5BB","30","os","115BB - winnings from lotteries, puzzles, races, games etc."],
 ["5BBJ","30","os","115BBJ - winnings from online games"],
 ["5BBE","60","os","115BBE - income u/s 68/69/69A/69B/69C/69D"],
 ["DTAAOS","1","os","Other-source income chargeable at special rates in India as per DTAA"],
 ["5A1aiiaa2P","9","os","115A(1)(a)(iiaa) - income of non-resident, second proviso to 194LC(1)"],
 ["PTI_STCG20P","20","cg","PTI - STCG chargeable @ 20%"],
 ["PTI_STCG30P","30","cg","PTI - STCG chargeable @ 30%"],
 ["PTI_LTCG12_5P112A","12.5","cg","PTI - LTCG @ 12.5% u/s 112A"],
 ["PTI_LTCG12_5P","12.5","cg","PTI - LTCG @ 12.5% other than u/s 112A"],
 ["5A1ai","20","os","115A(1)(a)(i) - dividends received by non-resident/foreign company"],
 ["5A1aii","20","os","115A(1)(a)(ii) - interest from govt/Indian concern in foreign currency"],
 ["5A1aiia","5","os","115A(1)(a)(iia) - interest from Infrastructure Debt Fund"],
 ["5A1aiiaa","5","os","115A(1)(a)(iiaa) - income received by non-resident u/s 194LC(1)"],
 ["5A1aiii","20","os","115A(1)(a)(iii) - income from units of UTI purchased in foreign currency"],
 ["5A1bA","20","os","115A(1)(b) - royalty/FTS from Government/Indian concern"],
 ["5BBA","20","os","115BBA - non-resident sportsmen / sports associations"],
 ["5AD1i","20","os","115AD(1)(i) - income (other than dividend) received by an FII"],
 ["5AD1iP","5","os","115AD(1)(i) - interest received by an FII on bonds/govt securities (194LD)"],
 ["5A1aiiab","5","os","115A(1)(a)(iiab) - interest as per Sec. 194LD"],
 ["5A1aiiac","5","os","115A(1)(a)(iiac) - interest as per Sec. 194LBA"],
 ["PTI_5A1ai","20","os","PTI - 115A(1)(a)(i) dividends, non-resident/foreign company"],
 ["PTI_5A1aii","20","os","PTI - 115A(1)(a)(ii) interest, non-residents"],
 ["PTI_5A1aiia","5","os","PTI - 115A(1)(a)(iia) Infrastructure Debt Fund interest"],
 ["PTI_5A1aiiaa","5","os","PTI - 115A(1)(a)(iiaa) income u/s 194LC(1)"],
 ["PTI_5A1aiiab","5","os","PTI - 115A(1)(a)(iiab) interest as per Sec. 194LD"],
 ["PTI_5A1aiiac","5","os","PTI - 115A(1)(a)(iiac) interest as per Sec. 194LBA"],
 ["PTI_5A1aiii","20","os","PTI - 115A(1)(a)(iii) units purchased in foreign currency"],
 ["PTI_5A1bA","20","os","PTI - 115A(1)(b) royalty/FTS from Government/Indian concern"],
 ["PTI_5AC1ab","10","os","PTI - 115AC(1)(a) interest on bonds purchased in foreign currency"],
 ["PTI_5AD1i","20","os","PTI - 115AD(1)(i) income received by an FII"],
 ["PTI_5AD1iP","5","os","PTI - 115AD(1)(i) income on bonds/govt securities (194LD)"],
 ["PTI_5BBA","20","os","PTI - 115BBA non-resident sportsmen / sports associations"],
 ["5A1aiiaaP","4","os","115A(1)(a)(iiaa) - interest referred to in proviso to 194LC(1) @4%"],
 ["PTI_5A1aiiaaP","4","os","PTI - 115A(1)(a)(iiaa) interest referred to in proviso to 194LC(1) @4%"],
 ["5AD1iDiv","20","os","115AD(1)(i) - dividend received by an FII"],
 ["PTI_5AD1iDiv","20","os","PTI - 115AD(1)(i) dividend received by an FII"],
 ["5A1aA","10","os","115A(1)(a)(A) - dividend from a unit in an IFSC, non-resident"],
 ["PTI_5AC1abD","10","os","PTI - 115AC(1)(b) dividend on GDRs purchased in foreign currency"],
 ["5BBC","30","vc","115BBC - anonymous donations"],
 ["PTI_5BBC","30","os","PTI - 115BBC anonymous donations"],
 ["PTI_5A1aA","10","os","PTI - 115A(1)(a)(A) dividend from a unit in an IFSC"],
 ["5BBHi","30","bp","115BBH(i) - Virtual Digital Asset (business or profession)"],
 ["5BBHii","30","cg","115BBH(ii) - Virtual Digital Asset (capital gain)"],
 ["PTI_5A1aiiaa2P","9","os","PTI - 115A(1)(a)(iiaa) second proviso to 194LC(1)"],
 ["5B","12.5","bp","115B - profits and gains of life insurance business"]];

const SI_ORDER={}, SI_RATE_DEF={}, SI_FEED={}, SI_LABEL={};
SI_HEADS.forEach((h,i)=>{SI_ORDER[h[0]]=i;SI_RATE_DEF[h[0]]=h[1];SI_FEED[h[0]]=h[2];SI_LABEL[h[0]]=h[3];});
const siLabel=c=>SI_LABEL[c]||c;

/* the SplRatePercent enum — SI book §3 / enums.json (11 values) */
const SI_RATES=["1","4","5","9","10","12.5","15","20","25","30","60"];
/* manual-override dropdown — every live head, in sheet order */
const SI_CODE_OPTS=SI_HEADS.map(h=>[h[0],h[3]]);

/* classification sets (SI book §4/§5 and the tax section's surcharge caps) */
const C_112A_OWN="2A";                        /* row 21 — own 112A            */
const C_112A_PTI="PTI_LTCG12_5P112A";         /* row 41 — PTI-112A, shares pool*/
const C_112A_SEP="5ADiiiP";                   /* row 26 — separate ₹1,25,000  */
const SI_DTAA=["DTAASTCG","DTAALTCG","DTAAOS"];   /* treaty-rate tax (§4)      */
const siIsDTAA=c=>SI_DTAA.indexOf(c)>=0;
/* CG + dividend heads capped at 15% surcharge — a convenience the tax
   section reads (S.C.si.cgDivTax); the tax section still owns the cap. */
const SI_CGDIV=["1A","5AD1biiP","5ADii","22","21ciii","5AC1c","21","2A","5ADiii","5AB1b","5ADiiiP",
  "PTI_STCG20P","PTI_STCG30P","PTI_LTCG12_5P112A","PTI_LTCG12_5P",
  "5A1ai","5A1aA","5AC1abD","5AD1iDiv","PTI_5A1ai","PTI_5A1aA","PTI_5AC1abD","PTI_5AD1iDiv"];

/* ---- 115TD constant (Schedule 115TD book §3) ------------------------
   Item 7 = additional income-tax at the maximum marginal rate. For A.Y.
   2026-27 the maximum marginal rate is 34.944% (30% + 12% surcharge +
   4% health & education cess). Exposed as a constant and overridable
   (see engTd) because the utility's rate/interest engine is authoritative. */
const TD_MMR=34.944;

/* =====================================================================
   STATE
   ===================================================================== */
/* Schedule SI override (SI book r96) */
S.si = S.si || { edit:"", rows:[] };
SEED["si.rows"]=SEED["si.rows"]||{};
/* Schedule 115BBI — six typed specified-income limbs (115BBI book §1) */
S.bbi = S.bbi || {};
/* Schedule 115TD — typed accreted-income inputs + challan table (115TD book) */
S.td  = S.td  || { challans:[] };
SEED["td.challans"]=SEED["td.challans"]||{};

/* =====================================================================
   ENGINE — Schedule SI (SI book §4/§5)
   ===================================================================== */
function _siNorm(v){
  if(v==null)return null;
  if(typeof v==="object")return {inc:R(N(v.inc!=null?v.inc:v.income)),
    rate:(v.rate!=null&&v.rate!=="")?st0(v.rate):null,
    tax:(v.tax!=null&&v.tax!=="")?R(N(v.tax)):null};
  return {inc:R(N(v)),rate:null,tax:null};
}
function engSi(){
  const cg=(S.C.cg||{}), os=(S.C.os||{}), bp=(S.C.bp||{}), vda=(S.C.vda||{}), vc=(S.C.vc||{});
  const feeds={};                                 /* code -> {inc,rate,tax,src} */
  const merge=(src,head)=>{if(!src||typeof src!=="object")return;
    Object.keys(src).forEach(k=>{const f=_siNorm(src[k]); if(!f)return;
      feeds[k]={inc:f.inc,rate:f.rate,tax:f.tax,src:head};});};
  merge(cg.siFeed,"cg"); merge(os.siFeed,"os"); merge(bp.siFeed,"bp"); merge(vda.siFeed,"vda");

  /* the trust's anonymous-donation charge u/s 115BBC (Schedule VC Diii) is
     NOT folded into Schedule SI: the ITR-7 Part B-TI/TTI carry a DEDICATED
     115BBC line (DonationsUs115BBC / DonationUs115BC), owned by the tax
     section (tax1c). Folding it here too would tax the same rupees twice.
     vc's Diii is published for reference (S.C.vc.anon115BBC → tax), but it
     does not enter the Schedule SI special-rate total. */
  const anon=R(N(vc.anon115BBC));

  /* manual override (SI book §9 — EditAutopoulatedDetail unlocks the table) */
  if(S.si.edit==="Yes"){
    (S.si.rows||[]).forEach(r=>{if(!r||!r.code)return; const code=st0(r.code);
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
    if(inc===0)return;                            /* one row per head carrying income (SI book §10) */
    rows.push({code,rate:st0(rate),inc,tax:(f.tax!=null?R(f.tax):null),
      src:(f.src==="man"?"man":(SI_FEED[code]||f.src||""))});});

  /* the ₹1,25,000 s.112A exemption (SI book §5, tax column only):
       own 112A (2A) then PTI-112A share one ₹1,25,000 pool;
       115AD(1)(b)(iii) proviso (5ADiiiP) gets a separate ₹1,25,000. */
  let pool=125000, exOwn=0, exPti=0, exSep=0;
  const rOwn=rows.find(r=>r.code===C_112A_OWN);
  const rPti=rows.find(r=>r.code===C_112A_PTI);
  const rSep=rows.find(r=>r.code===C_112A_SEP);
  if(rOwn){exOwn=Math.min(pool,Math.max(0,rOwn.inc));pool-=exOwn;}
  if(rPti){exPti=Math.min(pool,Math.max(0,rPti.inc));pool-=exPti;}
  if(rSep){exSep=Math.min(125000,Math.max(0,rSep.inc));}
  const exemption112A=exOwn+exPti+exSep;

  /* column H (taxable after min-charge adjust) == column G on ITR-7
     (SI book §5, THRESOLD inert). Then column I tax = ROUND(G × F/100). */
  let totInc=0, totCalc=0, totTax=0, tax112A=0, bbeInc=0, bbeTax=0,
      cgDivInc=0, cgDivTax=0, dtaaInc=0, dtaaTax=0;
  rows.forEach(r=>{
    r.taxable=r.inc;                              /* col H = col G */
    let base=r.inc;
    if(r.code===C_112A_OWN)      base=Math.max(0,r.inc-exOwn);
    else if(r.code===C_112A_PTI) base=Math.max(0,r.inc-exPti);
    else if(r.code===C_112A_SEP) base=Math.max(0,r.inc-exSep);
    if(siIsDTAA(r.code)){
      r.tax=(r.tax!=null)?R(r.tax):R(base*N(r.rate)/100);   /* treaty tax from feed */
    }else{
      r.tax=R(base*N(r.rate)/100);
    }
    totInc+=r.inc; totCalc+=r.taxable; totTax+=r.tax;
    if(r.code===C_112A_OWN||r.code===C_112A_PTI||r.code===C_112A_SEP) tax112A+=r.tax;
    if(r.code==="5BBE"){bbeInc+=r.inc; bbeTax+=r.tax;}
    if(SI_CGDIV.indexOf(r.code)>=0){cgDivInc+=r.inc; cgDivTax+=r.tax;}
    if(siIsDTAA(r.code)){dtaaInc+=r.inc; dtaaTax+=r.tax;}});

  const G={
    on:rows.length>0, rows,
    totInc:R(totInc),                             /* G94 → Part B-TI SplRateInc  */
    totCalc:R(totCalc),
    totTax:R(totTax),                             /* I94 → Part B-TTI special tax*/
    exemption112A:R(exemption112A), exOwn:R(exOwn), exPti:R(exPti), exSep:R(exSep),
    tax112A:R(tax112A),
    bbeInc:R(bbeInc), bbeTax:R(bbeTax),
    inc115BBE:R(bbeInc), tax115BBE:R(bbeTax),     /* SEAM: tax reads si.inc115BBE / si.tax115BBE */
    cgDivInc:R(cgDivInc), cgDivTax:R(cgDivTax),
    dtaaInc:R(dtaaInc), dtaaTax:R(dtaaTax),
    anon115BBC:anon,
    agri:0,                                        /* SEAM: tax reads si.agri (net agricultural income for rate) */
    income:0};                                    /* adds nothing to GTI (SI book §1) */

  /* fold in the 115BBI and 115TD computations onto the same S.C.si */
  Object.assign(G, engBbi(), engTd());
  /* SEAM aliases: the tax section reads si.spec115BBI (115BBI base @30%) and
     si.net115TD (Schedule 115TD item 12); publish them next to bbiTotal/td12. */
  G.spec115BBI=R(G.bbiTotal||0);
  G.net115TD  =R(G.td12||0);
  S.C.si=G;
}

/* =====================================================================
   ENGINE — Schedule 115BBI (115BBI book §2): six limbs → Total @30%.
   ===================================================================== */
function engBbi(){
  const B=S.bbi||{};
  const l1=R(N(B.l1)), l2=R(N(B.l2)), l3=R(N(B.l3)),
        l4=R(N(B.l4)), l5=R(N(B.l5)), l6=R(N(B.l6));
  const tot=R(l1+l2+l3+l4+l5+l6);
  return {
    bbi:{l1,l2,l3,l4,l5,l6,tot},
    bbiOn:(l1||l2||l3||l4||l5||l6)>0,
    bbiTotal:tot,                                 /* Total → base @30% (Part B-TTI) */
    bbiTax:R(tot*30/100)};                        /* convenience 30% charge         */
}

/* =====================================================================
   ENGINE — Schedule 115TD (115TD book §3): accreted-income ladder,
   MMR exit tax (item 7), 115TE interest (item 8) and the challan net.
   ===================================================================== */
function engTd(){
  const T=S.td||{};
  const f1=R(N(T.fmvTot)), f2=R(N(T.liab));
  const net=R(f1-f2);                             /* item 3 = 1 − 2 */
  const q1=R(N(T.fmv4i)), q2=R(N(T.fmv4ii)), q3=R(N(T.fmv4iii));
  const fmv4=R(q1+q2+q3);                         /* item 4iv = 4i+4ii+4iii */
  const liab4=R(N(T.liab4));                      /* item 5 */
  const accreted=R(Math.max(0,net-(fmv4-liab4))); /* item 6 = 3 − (4iv − 5), floored ≥0 */

  /* item 7 — additional income-tax at MMR (override honoured) */
  const addTax=(T.addTaxOvr!=null&&T.addTaxOvr!=="")?R(N(T.addTaxOvr)):R(accreted*TD_MMR/100);

  /* challans (item 11 = Σ amount deposited) */
  const challans=(T.challans||[]).map(c=>({
    date:c.date, bank:st0(c.bank), bsr:st0(c.bsr).toUpperCase(), sn:st0(c.sn),
    amt:R(N(c.amt)), d:D(c.date)}));
  const paid=R(challans.reduce((a,c)=>a+c.amt,0));  /* item 11 */

  /* item 8 — interest u/s 115TE at 1% per (part) month on item 7 from the
     specified date to the payment date. The utility's hidden helper columns
     (115TD book §2) split each challan interest-then-tax; here the interest
     total is computed to the latest challan deposit (the payment date), and
     is overridable to match the utility exactly (book §3/§8, resolved gap). */
  const spec=D(T.specDate);
  let interest;
  if(T.intOvr!=null&&T.intOvr!=="")interest=R(N(T.intOvr));
  else{
    const dated=challans.filter(c=>c.d).map(c=>c.d).sort((a,b)=>b-a);
    const payDate=dated.length?dated[0]:null;
    interest=(accreted>0&&spec&&payDate&&payDate>spec)?R(addTax*MPART(spec,payDate)/100):0;
  }

  const item10=R(addTax+interest);                /* item 10 = 7 + 8 */
  const item12=R(Math.max(0,item10-paid));        /* item 12 = 10 − 11, floored ≥0 */
  const on=(f1||f2||q1||q2||q3||liab4||accreted||paid||st0(T.specDate))?true:false;

  return {
    td:{f1,f2,net,q1,q2,q3,fmv4,liab4,accreted,addTax,interest,
        specDate:T.specDate||"",item10,paid,item12,challans,on},
    td10:item10,                                  /* item 10 (addl tax + interest) */
    td12:item12};                                 /* item 12 → Part B-TTI (Refund) */
}

/* =====================================================================
   RENDERER
   ===================================================================== */
function calcRow(label,ref,n){return row(label,cell(n),{ref:ref});}

function secSi(){
  const G=S.C.si||{}; let h="";

  /* ---------- Schedule SI ---------- */
  h+='<div class="cgband">Schedule SI — income chargeable to tax at special rates</div>';
  h+=note("Income taxed at a special rate. Every figure in column (i) is picked up automatically from Schedule CG, "+
    "OS, BP and VDA by the head's section code — nothing is typed here. On a trust/institution the \"minimum "+
    "chargeable to tax\" adjustment does nothing, so column (ii) equals the income in column (i); the tax in column "+
    "(iii) is rate × income, after the ₹1,25,000 section-112A exemption on the 112A / PTI-112A / 115AD-proviso heads. "+
    "The anonymous-donation charge under 115BBC flows in from Schedule VC.");

  const rows=G.rows||[];
  h+='<div class="full"><table class="gt" style="min-width:880px"><thead><tr>'+
     '<th class="l" style="width:40px">Sl.</th><th class="l" style="min-width:380px">Section</th>'+
     '<th style="width:80px">Rate (%)</th><th style="width:130px">Income (i)</th>'+
     '<th style="width:170px">Taxable after Min-Chg adj. (ii)</th><th style="width:130px">Tax thereon (iii)</th></tr></thead><tbody>';
  if(!rows.length)h+='<tr><td class="emp" colspan="6">No special-rate income — Schedule SI has nothing to show.</td></tr>';
  rows.forEach((r,i)=>{h+='<tr><td class="l">'+(i+1)+'</td>'+
    '<td class="l">'+esc(siLabel(r.code))+
      (r.src==="man"?'<span class="dt">manually edited</span>':
        (r.src?'<span class="dt">from Schedule '+esc(String(r.src).toUpperCase())+'</span>':''))+'</td>'+
    '<td class="num">'+(r.rate?esc(r.rate):"—")+(siIsDTAA(r.code)?'<span class="dt">treaty</span>':'')+'</td>'+
    '<td class="num">'+cell(r.inc)+'</td><td class="num">'+cell(r.taxable)+'</td>'+
    '<td class="num">'+cell(r.tax)+'</td></tr>';});
  h+='</tbody><tfoot><tr><td class="l" colspan="3">Total (row 94)</td>'+
     '<td>'+F(G.totInc||0)+'</td><td>'+F(G.totCalc||0)+'</td><td>'+F(G.totTax||0)+'</td></tr></tfoot></table></div>';

  if(R(G.exemption112A)>0)h+=note("₹"+F(G.exemption112A)+" of section-112A exemption applied in the tax column — "+
    "one ₹1,25,000 shared across own-112A then PTI-112A"+(R(G.exSep)>0?", and a separate ₹1,25,000 on the 115AD(1)(b)(iii) proviso head":"")+".");

  h+=row("Do you want to edit the details auto-populated in the table above?",
    sel("si.edit",[["Yes","Yes"],["No","No"]],{blank:false}),{ref:"r96",hint:"EditAutopoulatedDetail"});
  if(S.si.edit==="Yes"){
    h+=note("Override the auto-populated table — add or correct a special-rate head. Pick the section and its rate, "+
      "enter the income; a row here replaces the fed figure for the same section. For a DTAA head, also enter the "+
      "treaty tax. The ₹1,25,000 section-112A adjustment is applied automatically.");
    h+=grid("si.rows",[
      {h:"Section",k:"code",t:"sel",opts:SI_CODE_OPTS,req:1},
      {h:"Rate (%)",k:"rate",t:"sel",opts:SI_RATES.map(x=>[x,x])},
      {h:"Income",k:"inc",t:"num",req:1},
      {h:"Treaty tax (DTAA only)",k:"tax",t:"num"}],
      S.si.rows||[],
      {min:"780px",empty:"No manual special-rate head added.",add:"Add / override a special-rate head"});
  }

  /* ---------- Schedule 115BBI ---------- */
  const B=(G.bbi)||{};
  h+='<div class="cgband">Schedule 115BBI — specified income of certain institutions u/s 115BBI (taxed @30%)</div>';
  h+=note("Section 115BBI charges the specified income of a trust/institution (registered u/s 12AA/12AB or approved "+
    "u/s 10(23C)) to a flat 30%, with no deduction of expenditure/allowance and no set-off of loss. Enter each limb of "+
    "specified income; the total is the base on which 30% is charged.");
  h+=row("1 · Deemed income u/s Explanation 4 to the third proviso to s.10(23C) or s.11(3)",inp("bbi.l1",{n:1}),{ref:"D4"});
  h+=row("2 · Deemed income referred under section 11(1B)",inp("bbi.l2",{n:1}),{ref:"D5"});
  h+=row("3 · Income deemed u/s twenty-first proviso to s.10(23C) or not excluded per s.13(1)(c)",inp("bbi.l3",{n:1}),{ref:"D6"});
  h+=row("4 · Income not exempt u/s 10(23C) for violation of clause (b) of the third proviso, or not excluded per s.13(1)(d)",inp("bbi.l4",{n:1}),{ref:"D7"});
  h+=row("5 · Income not excluded from total income as per section 11(1)(c)",inp("bbi.l5",{n:1}),{ref:"D8"});
  h+=row("6 · Income accumulated/set apart in excess of 15% where such accumulation is not allowed",inp("bbi.l6",{n:1}),{ref:"D9"});
  h+=calcRow("Total (of Sl. 1 to 6) — specified income charged @30% u/s 115BBI","D10 · Total",B.tot||0);
  if(R(G.bbiTotal)>0)h+=note("30% of ₹"+F(G.bbiTotal)+" = ₹"+F(G.bbiTax)+" charged u/s 115BBI (added in Part B-TTI).");

  /* ---------- Schedule 115TD ---------- */
  const D=(G.td)||{};
  h+='<div class="cgband">Schedule 115TD — accreted income / exit tax u/s 115TD</div>';
  h+=note("Applicable if exemption is claimed u/s 11 and 12 or 10(23C)(iv)/(v)/(vi)/(via) and the trust/institution has "+
    "ceased to be eligible. Section 115TD taxes the accreted income (excess of FMV of assets over liabilities) at the "+
    "maximum marginal rate, with interest u/s 115TE. Items 3, 4iv, 6, 7, 8, 10, 11 and 12 are computed.");
  h+=row("1 · Aggregate Fair Market Value (FMV) of total assets of the specified person",inp("td.fmvTot",{n:1}),{ref:"F4"});
  h+=row("2 · Less: total liability of the specified person",inp("td.liab",{n:1}),{ref:"F5"});
  h+=calcRow("3 · Net value of assets (1 − 2)","F6",D.net||0);
  h+=row("4i · FMV of assets directly acquired out of income referred to in s.10(1)",inp("td.fmv4i",{n:1}),{ref:"F7"});
  h+=row("4ii · FMV of assets acquired before registration where 11/12 or 10(23C) benefit not claimed",inp("td.fmv4ii",{n:1}),{ref:"F8"});
  h+=row("4iii · FMV of assets transferred per third proviso to s.115TD(2)",inp("td.fmv4iii",{n:1}),{ref:"F9"});
  h+=calcRow("4iv · Total (4i + 4ii + 4iii)","F10",D.fmv4||0);
  h+=row("5 · Liability in respect of assets at 4 above",inp("td.liab4",{n:1}),{ref:"F11"});
  h+=calcRow("6 · Accreted income as per section 115TD [3 − (4 − 5)]","F12",D.accreted||0);
  h+=row("7 · Additional income-tax payable u/s 115TD at maximum marginal rate ("+TD_MMR+"%) — override",
    inp("td.addTaxOvr",{n:1}),{ref:"F13",hint:"blank = computed"});
  h+=calcRow("&nbsp;&nbsp;&nbsp;computed additional tax","",D.addTax||0);
  h+=row("8 · Interest payable u/s 115TE — override",inp("td.intOvr",{n:1}),{ref:"F14",hint:"blank = computed"});
  h+=calcRow("&nbsp;&nbsp;&nbsp;computed interest","",D.interest||0);
  h+=row("9 · Specified date u/s 115TD",inp("td.specDate",{ph:DF,max:10})+'<span class="dt">'+DF+'</span>',{ref:"F15"});
  h+=calcRow("10 · Additional income-tax and interest payable (7 + 8)","F16",D.item10||0);
  h+=note("Dates of deposit of tax on accreted income (challan table):");
  h+=grid("td.challans",[
      {h:"Date of deposit",k:"date",t:"date",w:"150px",req:1},
      {h:"Name of bank & branch",k:"bank",t:"txt",max:125,req:1},
      {h:"BSR code",k:"bsr",t:"txt",max:7,req:1},
      {h:"Serial no. of challan",k:"sn",t:"txt",max:5,req:1},
      {h:"Amount deposited",k:"amt",t:"num",req:1}],
      S.td.challans||[],{min:"820px",empty:"No challan entered.",add:"Add a challan"});
  h+=calcRow("11 · Tax and interest paid (Σ challans)","F17",D.paid||0);
  h+=calcRow("12 · Net payable / refundable (10 − 11)","F18",D.item12||0);
  if(R(G.td12)>0)h+=note("₹"+F(G.td12)+" net tax payable on 115TD accreted income (including 115TE interest) — carried to Part B-TTI.");

  return h;
}

/* =====================================================================
   EXPORT — ScheduleSI, Schedule115BBI, Schedule115TD (books §7/§8).
   Each block written only when it carries content.
   ===================================================================== */
function expSi(j){
  const G=S.C.si||(engSi(),S.C.si)||{};

  /* ---- ScheduleSI (SI book §7) ---- */
  const srows=(G.rows||[]).filter(r=>r.code&&N(r.inc));
  if(srows.length){
    const SI={
      TotSplRateInc:n0(G.totInc),                 /* G94 */
      TotSplRateIncTax:n0(G.totTax),              /* I94 */
      SplCodeRateTax:srows.map(r=>({
        SecCode:r.code,
        SplRatePercent:N(r.rate),
        SplRateInc:n0(r.inc),                     /* column G */
        SplRateIncTax:n0(r.tax)})),               /* column I */
      EditAutopoulatedDetail:(S.si.edit==="Yes")?"Y":"N"};
    j.ScheduleSI=SI;
  } else if(S.si.edit==="Yes"){
    j.ScheduleSI={TotSplRateInc:0,TotSplRateIncTax:0,EditAutopoulatedDetail:"Y"};
  }

  /* ---- Schedule115BBI (115BBI book §6 — all seven leaves required) ---- */
  const B=G.bbi||{};
  if(G.bbiOn){
    j.Schedule115BBI={
      DeemedIncSec1023C_113:n0(B.l1),
      DeemedIncSec111B:n0(B.l2),
      IncDeemedSec131c:n0(B.l3),
      IncNotExemptSec131d:n0(B.l4),
      IncNotExcludedSec111c:n0(B.l5),
      IncAccInExcess:n0(B.l6),
      Total:n0(B.tot)};
  }

  /* ---- Schedule115TD (115TD book §7) ---- */
  const D=G.td||{};
  if(D.on){
    const TD={
      FMVTotTrustInst:n0(D.f1),
      LessTotLiaTrustInst:n0(D.f2),
      NetValAsst:n0(D.net),
      FMVAsstAcqrdRfrdSec101:n0(D.q1),
      FMVAsstAcqPeriodFromDateCrtn:n0(D.q2),
      FMVAsstTrnfsrdSec115TD2:n0(D.q3),
      FMVTotal:n0(D.fmv4),
      LiabilityRespectofAsset4Above:n0(D.liab4),
      AccretedIncomeSection115TD:n0(D.accreted),
      AddIncPay115TDMarginalRate:n0(D.addTax),
      InterestPayable115TE:n0(D.interest),
      AddIncIntstPayb:n0(D.item10),
      TaxIntstPaid:n0(D.paid),
      NetPaybleRefble:n0(D.item12)};
    const sd=ISO(D.specDate); if(sd)TD.SpecifiedDateUs115TD=sd;
    const ch=(D.challans||[]).filter(c=>N(c.amt)&&ISO(c.date)&&BSR.test(st0(c.bsr).toUpperCase())&&st0(c.bank)&&st0(c.sn));
    if(ch.length)TD.DepositofTaxAccInc={DepositofTaxAccIncDtls:ch.map(c=>({
      DateDep:ISO(c.date),
      NameBankBranch:st0(c.bank),
      BSRCode:st0(c.bsr).toUpperCase(),
      SrlNoOfChaln:parseInt(st0(c.sn),10),
      Amount:n0(c.amt)}))};
    j.Schedule115TD=TD;
  }
}

/* =====================================================================
   IMPORT — inverse of export (round-trip identity).
   ===================================================================== */
function impSi(I){
  const read=[]; if(!I)return read;

  /* ScheduleSI — re-derived from the heads each compute; a returned SI is
     read into the manual-override rows only when EditAutopoulatedDetail=Y */
  const si=I.ScheduleSI;
  if(si){
    S.si.edit=(si.EditAutopoulatedDetail==="Y")?"Yes":(si.EditAutopoulatedDetail==="N"?"No":S.si.edit);
    if(S.si.edit==="Yes"&&Array.isArray(si.SplCodeRateTax)){
      S.si.rows=si.SplCodeRateTax.map(r=>{
        const code=r.SecCode, rate=r.SplRatePercent!=null?String(r.SplRatePercent):"";
        const o={code,rate,inc:nz(r.SplRateInc)};
        if(siIsDTAA(code)&&r.SplRateIncTax!=null)o.tax=nz(r.SplRateIncTax);
        return o;});
    }
    read.push("Schedule SI (income at special rates)");
  }

  /* Schedule115BBI */
  const b=I.Schedule115BBI;
  if(b){
    S.bbi={l1:nz(b.DeemedIncSec1023C_113),l2:nz(b.DeemedIncSec111B),l3:nz(b.IncDeemedSec131c),
      l4:nz(b.IncNotExemptSec131d),l5:nz(b.IncNotExcludedSec111c),l6:nz(b.IncAccInExcess)};
    read.push("Schedule 115BBI (specified income @30%)");
  }

  /* Schedule115TD */
  const d=I.Schedule115TD;
  if(d){
    S.td={
      fmvTot:nz(d.FMVTotTrustInst), liab:nz(d.LessTotLiaTrustInst),
      fmv4i:nz(d.FMVAsstAcqrdRfrdSec101), fmv4ii:nz(d.FMVAsstAcqPeriodFromDateCrtn),
      fmv4iii:nz(d.FMVAsstTrnfsrdSec115TD2), liab4:nz(d.LiabilityRespectofAsset4Above),
      addTaxOvr:nz(d.AddIncPay115TDMarginalRate), intOvr:nz(d.InterestPayable115TE),
      specDate:dmy(d.SpecifiedDateUs115TD),
      challans:(((d.DepositofTaxAccInc||{}).DepositofTaxAccIncDtls)||[]).map(c=>({
        date:dmy(c.DateDep), bank:c.NameBankBranch||"", bsr:c.BSRCode||"",
        sn:c.SrlNoOfChaln!=null?String(c.SrlNoOfChaln):"", amt:nz(c.Amount)}))};
    read.push("Schedule 115TD (accreted income / exit tax)");
  }
  return read;
}

/* =====================================================================
   CHECKS — the section's own screen validations (not the department
   rule engine, which is Phase 6).
   ===================================================================== */
function chkSi(){
  const out=[]; const G=S.C.si||(engSi(),S.C.si)||{};
  const add=(lvl,t,m)=>out.push({lvl,t,m,sec:"si"});

  (G.rows||[]).forEach(r=>{
    if(N(r.inc)&&!N(r.rate)&&!siIsDTAA(r.code))
      add("err","Special rate missing","The head \""+siLabel(r.code)+"\" has income of ₹"+F(r.inc)+" but no rate.");
    if(siIsDTAA(r.code)&&N(r.inc)>0&&!(N(r.tax)>0))
      add("warn","DTAA tax not entered","\""+siLabel(r.code)+"\" carries income of ₹"+F(r.inc)+
        " but no treaty tax. For a DTAA head the tax is at the treaty rate.");
  });
  if((G.rows||[]).length){
    const sumTax=(G.rows||[]).reduce((a,r)=>a+N(r.tax),0);
    if(Math.abs(sumTax-N(G.totTax))>1)
      add("err","Schedule SI total","Total tax at special rates (row 94) must equal the sum of the rows.");
  }
  if((G.totTax||0)>0)add("ok","Tax at special rates","₹"+F(G.totTax)+" of tax at special rates, added to the normal-rate tax in Part B-TTI.");
  if((G.exemption112A||0)>0)add("ok","Section-112A exemption","₹"+F(G.exemption112A)+" of the ₹1,25,000 section-112A exemption applied.");

  /* Schedule 115BBI */
  if((G.bbiTotal||0)>0)add("ok","Specified income u/s 115BBI","₹"+F(G.bbiTotal)+" of specified income charged @30% u/s 115BBI (₹"+F(G.bbiTax)+" tax).");

  /* Schedule 115TD */
  const TD=G.td||{};
  if((TD.accreted||0)>0&&!st0(TD.specDate))
    add("err","Specified date missing","Accreted income of ₹"+F(TD.accreted)+" is present u/s 115TD — the specified date (item 9) cannot be blank.");
  if(st0(TD.specDate)&&!D(TD.specDate))
    add("err","Specified date invalid","The specified date u/s 115TD (item 9) is not a valid "+DF+" date.");
  if((TD.accreted||0)>0&&(TD.paid||0)<(TD.item10||0))
    add("warn","115TD tax unpaid","Net ₹"+F(TD.item12)+" of additional tax/interest u/s 115TD is still payable (item 12).");
  if((TD.item12||0)>0)add("ok","Accreted income (exit tax)","₹"+F(TD.item12)+" net payable u/s 115TD carried to Part B-TTI.");
  return out;
}

/* ---- register (overrides the boot stub) ----------------------------- */
reg({id:"si", t:"Special-rate, specified & accreted income", ref:"Schedule SI · 115BBI · 115TD",
  f:secSi, s:()=>{const G=S.C.si||{};
    const bits=[];
    if(G.totTax)bits.push(RS(G.totTax)+" special-rate tax");
    if(G.bbiTotal)bits.push(RS(G.bbiTax)+" u/s 115BBI");
    if(G.td12)bits.push(RS(G.td12)+" u/s 115TD");
    return bits.length?bits.join(" · "):(G.on?"disclosed":"");},
  eng:engSi, exp:expSi, imp:impSi, chk:chkSi, order:150, corder:60});

})();
