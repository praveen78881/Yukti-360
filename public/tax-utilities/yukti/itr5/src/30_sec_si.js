/* =====================================================================
   ITR-5 · Section "si" — Schedule SI (income chargeable at special rates)
   Built strictly from books/ITR-5/SI.md (never ITR-2/3 numbers). One file:
   state seed · engSi · secSi · expSi · impSi · chkSi · one reg().

   compute order 52 — AFTER the loss engine (corder 46) so the special-rate
   capital-gains income can be scaled to POST-BFLA (Schedule BFLA column 5 =
   S.C.loss.afterB); the CG/OS/BP heads (corder 25/26/27) have already
   published their special-rate figures by then. Screen order 52.

   Schedule SI is a FIXED, auto-populated roster (SI.md §"The shape"): every
   income figure is pulled from Schedule OS / CG / BP / BFLA, the rate is a
   fixed constant per code, and the tax is system-computed. Nothing is keyed
   by hand except the single Yes/No switch EditAutopoulatedDetail (row 107)
   which, when Yes, unlocks a manual override of the auto rows (rare — the
   DTAA/treaty-rate cases). The 26 hidden pre-23-Jul-2024 / 115B / 115BBC /
   115BBDA / PTI-@10/15/20% legacy rows are NOT built (SI.md §"Hidden rows").

   Schedule SI RE-PRESENTS income already inside Gross Total Income (it comes
   from CG/OS/BP), so this head adds nothing to GTI — S.C.si.income = 0.
   Its tax (TotSplRateIncTax) is what PART B-TTI Sl.no 2b adds to the
   normal-rate tax (rule 697).

   CONSUMES (all reads guarded, never throw):
     S.C.cg.buckets   {si111a20,si112a,si112,si115bbh,stDTAA,ltDTAA}  (cg@26)
     S.C.cg.dtaaStcgRate / dtaaLtcgRate                               (cg@26)
     S.C.loss.afterB  {st20,lt125,stDTAA,ltDTAA,osDTAA}  BFLA col 5   (loss@46)
     S.C.os.{s2ai,s2aii,b2,splRows[],ptiRows[],dtaaRows[],item2e}     (os@27)
     S.bp.{a3d,a3e,a3f}  115BBF/115BBG/115BBH income credited to P&L  (bp state)
     S.C.gti          for the resident-AOP/BOI basic-exemption walk   (stale ok)
   PUBLISHES:
     S.C.si.{on,rows,totInc,totCalc,totTax,TotSplRateInc,TotSplRateIncTax,
             tax112A,cgDivTax,bbeTax,exemption112A,exemptionBasic,income:0}
   ===================================================================== */

/* ---- state ---------------------------------------------------------- */
/* edit : "Yes"/"No"/"" — EditAutopoulatedDetail switch (row 107, default No)
   over : manual override rows [{code,rate,inc}] used only when edit==="Yes";
          a code that matches an auto row overrides its income & rate, a new
          code is added.  Nothing else is stored — the roster is auto.        */
S.si = S.si || { edit:"", over:[] };

/* SecCode enum → label, VERBATIM code strings from the schema enum (71 codes,
   books/ITR-5/SI.md §"Dropdowns"/enums.json). The 111A code is `1` (schema),
   not the sheet's internal `[F]`-cell `1A` — the schema is authoritative.      */
const SI_CODE_OPTS=[
 ["1","111A - STCG on shares/units (STT paid)"],
 ["21","112 - Long term capital gains"],
 ["22","112 - LTCG (without indexing)"],
 ["21ciii","112(1)(c)(iii) - LTCG unlisted securities, non-resident"],
 ["2A","112A - LTCG equity/EOMF/business trust (STT paid) @12.5"],
 ["5A1ai","115A(1)(a)(i) - Dividends/interest/units in foreign currency"],
 ["5AB1a","115AB(1)(a) - Income in respect of units, off-shore fund"],
 ["5A1aA","115A(1)(a)(A) - Dividend from unit in IFSC, non-resident"],
 ["5AB1b","115AB(1)(b) - LTCG on units, off-shore fund"],
 ["5A1aii","115A(1)(a)(ii) - Interest from govt/Indian concern in FC"],
 ["5A1aiia","115A(1)(a)(iia) - Interest from Infrastructure Debt Fund"],
 ["5A1aiiaa","115A(1)(a)(iiaa) - Interest u/s 194LC(1)"],
 ["5A1aiiaaSP","115A(1)(a)(iiaa) - second proviso to 194LC(1)"],
 ["5A1aiiaaP","115A(1)(a)(iiaa) - proviso to 194LC(1)"],
 ["5A1aiiab","115A(1)(a)(iiab) - Interest u/s 194LD"],
 ["5A1aiiac","115A(1)(a)(iiac) - Interest u/s 194LBA"],
 ["5A1aiii","115A(1)(a)(iii) - Income from units of UTI in FC"],
 ["5A1bA","115A(1)(b)(A)/(B) - Royalty / FTS from govt or Indian concern"],
 ["5AD1IB","115AD(1)(i)(B) - Income (other than dividend), specified fund"],
 ["5AC1ab","115AC(1)(a) - Interest on bonds in FC, non-resident"],
 ["5AD1IBd","115AD(1)(i)(B) - Dividend, specified fund"],
 ["5AC1abD","115AC(1)(b) - Dividend on GDRs in FC, non-resident"],
 ["5AC1c","115AC(1)(c) - LTCG on bonds/GDR in FC, non-resident"],
 ["5AD1i","115AD(1)(i) - Income (other than dividend) of an FII"],
 ["5AD1iDiv","115AD(1)(i) - Dividend income of an FII"],
 ["5AD1iP","115AD(1)(i) - Income of an FII u/s 194LD"],
 ["5ADii","115AD(1)(ii) - STCG by an FII"],
 ["5AD1biip","115AD(1)(b)(ii) - STCG referred to in 111A"],
 ["5ADiii","115AD(1)(iii) - LTCG by an FII"],
 ["5ADiiiP","Proviso to 115AD(iii) - NR STT-paid units u/s 112A"],
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
 ["DTAASTCG","STCG chargeable at special rate as per DTAA"],
 ["DTAALTCG","LTCG chargeable at special rate as per DTAA"],
 ["DTAAOS","Other-source income chargeable at DTAA rate"],
 ["PTI_5AB1a","PTI - 115AB(1)(a) off-shore fund units"],
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
 ["PTI_5A1aiiaaSP","PTI - 115A(1)(a)(iiaa) second proviso to 194LC(1)"],
 ["PTI_5A1aiiab","PTI - 115A(1)(a)(iiab)"],
 ["PTI_5A1aiiac","PTI - 115A(1)(a)(iiac)"],
 ["PTI_5A1aiii","PTI - 115A(1)(a)(iii)"],
 ["PTI_5A1bA","PTI - 115A(1)(b)(A)"],
 ["PTI_5AC1ab","PTI - 115AC(1)(a)"],
 ["PTI_5AC1abD","PTI - 115AC(1)(b)"],
 ["PTI_5AD1i","PTI - 115AD(1)(i)"],
 ["PTI_5AD1iDiv","PTI - 115AD(1)(i) dividend"],
 ["PTI_5AD1iP","PTI - 115AD(1)(i) u/s 194LD"],
 ["PTI_5BBA","PTI - 115BBA"],
 ["PTI_5BBF","PTI - 115BBF"],
 ["PTI_5BBG","PTI - 115BBG"],
 ["PTI_5Ea","PTI - 115E(a)"],
 ["PTI_5AD1IBd","PTI - 115AD(1)(i)(B) dividend, specified fund"],
 ["PTI_5AD1IB","PTI - 115AD(1)(i)(B) other than dividend, specified fund"]];
const SI_CODE_LABEL=c=>{const r=SI_CODE_OPTS.find(x=>x[0]===c);return r?r[1]:c;};

/* SplRatePercent enum (12 values) — schema / SI.md §"Dropdowns" */
const SI_RATE_ENUM=[1,4,5,9,10,12.5,15,20,25,30,50,60];
const SI_RATES=SI_RATE_ENUM.map(String);
/* snap a rate to the enum (DTAA treaty rates outside the enum fall to 1
   "per treaty", per SI.md rows 7-9 — rule 705 exempts DTAA from income×rate) */
const siSnapRate=r=>{const n=N(r);return SI_RATE_ENUM.indexOf(n)>=0?n:1;};

/* the fixed statutory rate per SecCode (AY 2026-27, post-23-Jul-2024) — the
   Rate% column of SI.md's live-rows table. DTAA rows are "per treaty" (1).     */
const SI_RATE_DEF={
  "1":20,"21":12.5,"22":12.5,"21ciii":12.5,"2A":12.5,
  "5A1ai":20,"5AB1a":10,"5A1aA":10,"5AB1b":12.5,"5A1aii":20,"5A1aiia":5,
  "5A1aiiaa":5,"5A1aiiaaSP":9,"5A1aiiaaP":4,"5A1aiiab":5,"5A1aiiac":5,
  "5A1aiii":20,"5A1bA":20,"5AD1IB":10,"5AC1ab":10,"5AD1IBd":10,"5AC1abD":10,
  "5AC1c":12.5,"5AD1i":20,"5AD1iDiv":20,"5AD1iP":5,"5ADii":30,"5AD1biip":20,
  "5ADiii":12.5,"5ADiiiP":12.5,"5BB":30,"5BBJ":30,"5BBA":20,"5BBH":30,
  "5BBH_BP":30,"5BBE":60,"5BBF":10,"5BBF_BP":10,"5BBG":10,"5BBG_BP":10,"5Ea":20,
  "DTAASTCG":1,"DTAALTCG":1,"DTAAOS":1,
  "PTI_5AB1a":10,"PTI_STCG20P":20,"PTI_STCG30P":30,"PTI_LTCG12_5P112A":12.5,
  "PTI_LTCG12_5P":12.5,"PTI_5A1ai":20,"PTI_5A1aA":10,"PTI_5A1aii":20,
  "PTI_5A1aiia":5,"PTI_5A1aiiaa":5,"PTI_5A1aiiaaP":4,"PTI_5A1aiiaaSP":9,
  "PTI_5A1aiiab":5,"PTI_5A1aiiac":5,"PTI_5A1aiii":20,"PTI_5A1bA":20,
  "PTI_5AC1ab":10,"PTI_5AC1abD":10,"PTI_5AD1i":20,"PTI_5AD1iDiv":20,
  "PTI_5AD1iP":5,"PTI_5BBA":20,"PTI_5BBF":10,"PTI_5BBG":10,"PTI_5Ea":20,
  "PTI_5AD1IBd":10,"PTI_5AD1IB":10};

/* ---- classification sets (SI.md §"The rules the sheet computes") ------ */
/* §112A ₹1,25,000 exemption pool A — shared 2A (own 112A, [O17]) then
   PTI-112A ([O18]=MIN(125000-O17,H64)), in that order.                     */
const SI_112A_A=["2A","PTI_LTCG12_5P112A"];
/* §115AD(1)(iii)-Proviso ₹1,25,000 exemption pool B ([O19]=MIN(125000,H43)) */
const SI_112A_B=["5ADiiiP"];
/* the capital-gain special heads that share a resident AOP/BOI's unused
   basic-exemption slack (P/Q/R/S/T/U spreading), set off highest rate first */
const SI_CG_WALK=["1","21","2A","21ciii","5AC1c","5AB1b","5ADiii","5ADiiiP",
  "5ADii","5AD1biip","PTI_STCG20P","PTI_STCG30P","PTI_LTCG12_5P112A","PTI_LTCG12_5P"];
/* DTAA-rate rows (SI.md rows 7-9) whose tax carries NO health-&-education cess
   (Tax(N) AE25 = NoCess_CR = SI!J95:J98, subtracted from the cess base). */
const SI_NOCESS=["DTAAOS","DTAASTCG","DTAALTCG"];
/* CG + dividend codes whose tax is surcharge-capped at 15% (→ tax section) */
const SI_CGDIV=["1","21","2A","21ciii","5AC1c","5AB1b","5ADiii","5ADiiiP","5ADii",
  "5AD1biip","PTI_STCG20P","PTI_STCG30P","PTI_LTCG12_5P112A","PTI_LTCG12_5P",
  "5A1ai","5A1aA","5AC1abD","5AD1iDiv","5AD1IBd","PTI_5A1ai","PTI_5A1aA",
  "PTI_5AD1iDiv","PTI_5AD1IBd"];
/* the CG-auto codes re-derived from Schedule CG each compute (never imported
   back into S.si.over — only the non-CG manual/override heads are kept).     */
const SI_CG_AUTO=["1","21","2A","5BBH","DTAASTCG","DTAALTCG"];

/* ---- engine --------------------------------------------------------- */
function engSi(){
  const cg=(S.C.cg||{}), cgB=(cg.buckets||{});
  const os=(S.C.os||{}), bp=(S.C.bp||{});   /* bp (corder 25) < si (52): read the published S.C.bp.{a3d,a3e,a3f} */
  const Lb=(S.C.loss||{}).afterB||{};
  const resident=S.fs&&S.fs.resStatus==="RES";
  const isAopBoi=S.pi&&String(S.pi.status)==="14";     /* AOP/BOI — the only ITR-5 status with a basic-exemption limit */
  const New=isNew();

  /* post-BFLA scale factors — SI CG income must equal BFLA col 5 (rules 707/
     713/714/715/709/710). Scale each CG bucket by afterB/pre; default 1 when
     the loss engine has not run (no regression). VDA (115BBH) has no set-off. */
  const scl=(pre,post)=>{pre=N(pre);return pre>0?(N(post)/pre):1;};
  const lt125pre=N(cgB.si112a)+N(cgB.si112);
  const ltS =scl(lt125pre, Lb.lt125!=null?Lb.lt125:lt125pre);
  const st20S=scl(cgB.si111a20, Lb.st20 !=null?Lb.st20 :cgB.si111a20);
  const stDs =scl(cgB.stDTAA,    Lb.stDTAA!=null?Lb.stDTAA:cgB.stDTAA);
  const ltDs =scl(cgB.ltDTAA,    Lb.ltDTAA!=null?Lb.ltDTAA:cgB.ltDTAA);

  /* ----- build the auto roster (only codes carrying income > 0) ------- */
  const rows=[]; const idx={};
  const push=(code,rate,inc,src,taxFix)=>{inc=R(inc);if(inc<=0)return;
    const o={code,rate:siSnapRate(rate),inc,src};
    if(taxFix!=null)o.taxFix=R(taxFix);            /* tax NOT income×rate (DTAA rows) */
    rows.push(o);idx[code]=rows.length-1;};

  /* Capital gains (post-BFLA scaled) — SI.md rows 11/13-15/18/104/8/9 */
  push("1",  20,  N(cgB.si111a20)*st20S,"cg");     /* 111A STCG @20 (schema code 1) */
  push("21", 12.5,N(cgB.si112)*ltS,     "cg");     /* 112 / 112(1) LTCG @12.5 */
  push("2A", 12.5,N(cgB.si112a)*ltS,    "cg");     /* 112A LTCG @12.5 — ₹1.25L exempt below */
  push("5BBH",30, N(cgB.si115bbh),      "cg");     /* 115BBH VDA (capital gains) @30 — no BFLA set-off */
  {const r=siSnapRate(N(cg.dtaaStcgRate)); push("DTAASTCG",r,N(cgB.stDTAA)*stDs,"cg",
     R(N(cgB.stDTAA)*stDs*r/100));}                /* STCG at DTAA rate (row 8) */
  {const r=siSnapRate(N(cg.dtaaLtcgRate)); push("DTAALTCG",r,N(cgB.ltDTAA)*ltDs,"cg",
     R(N(cgB.ltDTAA)*ltDs*r/100));}                /* LTCG at DTAA rate (row 9) */

  /* Other sources 2a(i)/2a(ii)/2b — SI.md rows 44/47/49 */
  push("5BB", 30,os.s2ai, "os");                   /* 115BB winnings */
  push("5BBJ",30,os.s2aii,"os");                   /* 115BBJ online games */
  push("5BBE",60,os.b2,   "os");                   /* 115BBE 68/69/… */

  /* Other sources 2c (special-rate) & 2d (PTI special-rate) — each net of the
     DTAA amount disclosed for the SAME code (SI.md income = Source_X - DTAA_X);
     that DTAA amount is re-presented in the DTAAOS aggregate row instead.       */
  const dtaaByCode={};
  (os.dtaaRows||[]).forEach(r=>{if(r&&r.counts)dtaaByCode[st0(r.itemno)]=(dtaaByCode[st0(r.itemno)]||0)+N(r.amt);});
  const pushOS=r=>{const code=st0(r.code);if(!code||SI_RATE_DEF[code]==null)return;
    push(code, SI_RATE_DEF[code], N(r.amt)-N(dtaaByCode[code]||0), "os");};
  (os.splRows||[]).forEach(pushOS);
  (os.ptiRows||[]).forEach(pushOS);

  /* Other sources 2e — DTAA aggregate (row 7). Income = item2e (post-BFLA
     scaled to afterB.osDTAA, rule 704 = BFLA 5xiv); tax = Σ each counted
     row × its applicable treaty rate (rule 705 exempts income×rate).          */
  {const osD=N(os.item2e); const s=scl(osD, Lb.osDTAA!=null?Lb.osDTAA:osD);
   const osDtaaTax=(os.dtaaRows||[]).filter(r=>r&&r.counts).reduce((a,r)=>a+R(N(r.amt)*N(r.appl)/100),0);
   push("DTAAOS",1,osD*s,"os",R(osDtaaTax*s));}

  /* Business/profession — 115BBF/115BBG/115BBH (SI.md rows 51/54/103) */
  push("5BBF_BP",10,bp.a3d,"bp");                  /* 115BBF patent (BP) */
  push("5BBG_BP",10,bp.a3e,"bp");                  /* 115BBG carbon credits (BP) */
  push("5BBH_BP",30,bp.a3f,"bp");                  /* 115BBH VDA (BP) */

  /* ----- manual override (row 107 switch = Yes) ---------------------- */
  if(S.si.edit==="Yes"){
    (S.si.over||[]).forEach(o=>{const code=st0(o.code);if(!code)return;
      const rate=(o.rate!==""&&o.rate!=null)?o.rate:(SI_RATE_DEF[code]!=null?SI_RATE_DEF[code]:"");
      if(idx[code]!=null){const r=rows[idx[code]];r.rate=siSnapRate(rate);r.inc=R(N(o.inc));r.src="edit";delete r.taxFix;}
      else{const inc=R(N(o.inc));if(inc>0){rows.push({code,rate:siSnapRate(rate),inc,src:"edit"});idx[code]=rows.length-1;}}});
  }
  /* an override may have zeroed an auto row — drop the empties, keep order */
  const live=rows.filter(r=>R(r.inc)>0);

  /* ----- taxable income after the ₹1,25,000 §112A / §115AD-proviso exemptions */
  const taxable={}; live.forEach((r,i)=>{taxable[i]=r.inc;});
  const spread=(codes)=>{let pool=125000;
    codes.forEach(code=>{live.forEach((r,i)=>{if(r.code!==code)return;
      const ex=Math.min(pool,Math.max(0,taxable[i]));taxable[i]-=ex;pool-=ex;});});
    return 125000-pool;};
  const ex112A=spread(SI_112A_A)+spread(SI_112A_B);     /* two independent ₹1.25L pools */

  /* ----- resident AOP/BOI basic-exemption walk (P/Q/R/S/T/U spreading) --
     a firm / local authority / AJP has NO basic-exemption limit (flat rate),
     so basic = 0 for them; only a resident AOP/BOI taxed at slab carries one.
     The slack is basic − normal-rate income, set off against the CG special
     heads highest rate first. (An MMR-taxed AOP/BOI is a tax-section refinement.) */
  const basic=(resident&&isAopBoi)?(New?400000:250000):0;
  const splIncTotal=live.reduce((a,r)=>a+r.inc,0);
  const normalRateInc=Math.max(0,R((S.C.gti||0))-splIncTotal);      /* stale GTI ok; converges */
  let slack=Math.max(0,basic-normalRateInc);
  const walkIdx=live.map((r,i)=>i).filter(i=>SI_CG_WALK.indexOf(live[i].code)>=0)
    .sort((a,b)=>N(live[b].rate)-N(live[a].rate));
  walkIdx.forEach(i=>{if(slack<=0)return;const u=Math.min(slack,taxable[i]);taxable[i]-=u;slack-=u;});
  const exBasic=Math.max(0,basic-normalRateInc)-slack;

  /* ----- tax thereon (SI.md: J = ROUND(I×G/100,0); DTAA rows keep taxFix) - */
  let totInc=0,totCalc=0,totTax=0,tax112A=0,bbeTax=0,cgDivTax=0,noCess=0;
  live.forEach((r,i)=>{const h=Math.max(0,R(taxable[i]));
    const tax=(r.taxFix!=null&&r.src!=="edit")?r.taxFix:R(h*N(r.rate)/100);
    r.taxable=h;r.tax=tax;
    totInc+=r.inc;totCalc+=h;totTax+=tax;
    if(SI_112A_A.indexOf(r.code)>=0||SI_112A_B.indexOf(r.code)>=0)tax112A+=tax;
    if(r.code==="5BBE")bbeTax+=tax;
    if(SI_CGDIV.indexOf(r.code)>=0)cgDivTax+=tax;
    if(SI_NOCESS.indexOf(r.code)>=0)noCess+=tax;});   /* AE25 = tax on the DTAA-rate rows; cess is not levied on it */

  S.C.si={
    on:live.length>0,
    rows:live,
    totInc:R(totInc), totCalc:R(totCalc), totTax:R(totTax),
    TotSplRateInc:R(totInc), TotSplRateIncTax:R(totTax),      /* schema-named for the tax section */
    tax112A:R(tax112A), bbeTax:R(bbeTax), cgDivTax:R(cgDivTax), noCess:R(noCess),
    exemption112A:R(ex112A), exemptionBasic:R(exBasic),
    income:0};                                                /* re-presents CG/OS/BP income — adds nothing to GTI */
  return S.C.si;
}

/* =====================================================================
   RENDERER
   ===================================================================== */
function secSi(){
  const G=S.C.si||{}; let h="";
  const resident=S.fs&&S.fs.resStatus==="RES";
  const isAopBoi=S.pi&&String(S.pi.status)==="14";
  const New=isNew();

  h+='<div class="cgband">Schedule SI — income chargeable to Income tax at special rates</div>';
  h+=note("Income taxed at a special rate (see instruction No. 9 for the section code and rate). "+
    "Every figure is picked up automatically from Schedule CG / OS / BP after the losses in Schedule BFLA "+
    "are set off — this table is not typed in. Tax is the fixed rate × the income after the ₹1,25,000 "+
    "section-112A / 115AD(1)(iii)-proviso exemption"+
    (resident&&isAopBoi?" and the basic-exemption set-off":"")+".");

  const rows=G.rows||[];
  h+='<div class="full"><table class="gt" style="min-width:860px"><thead><tr>'+
     '<th class="l" style="width:40px">Sl.</th><th class="l" style="min-width:360px">Section / Description</th>'+
     '<th style="width:80px">Rate (%)</th><th style="width:130px">Income (i)</th>'+
     '<th style="width:160px">Taxable after Min-Chg adj.</th><th style="width:140px">Tax thereon (ii)</th></tr></thead><tbody>';
  if(!rows.length)h+='<tr><td class="emp" colspan="6">No special-rate income.</td></tr>';
  const srcTag={cg:"from Schedule CG",os:"from Schedule OS",bp:"from Schedule BP",edit:"edited"};
  rows.forEach((r,i)=>{h+='<tr><td class="l">'+(i+1)+'</td>'+
    '<td class="l">'+esc(SI_CODE_LABEL(r.code))+(srcTag[r.src]?'<span class="dt">'+srcTag[r.src]+'</span>':'')+'</td>'+
    '<td class="num">'+(r.rate?esc(String(r.rate)):"—")+'</td>'+
    '<td class="num">'+cell(r.inc)+'</td><td class="num">'+cell(r.taxable)+'</td>'+
    '<td class="num">'+cell(r.tax)+'</td></tr>';});
  h+='</tbody><tfoot><tr><td class="l" colspan="3">Total (row 105)</td>'+
     '<td>'+F(G.TotSplRateInc||0)+'</td><td>'+F(G.totCalc||0)+'</td><td>'+F(G.TotSplRateIncTax||0)+'</td></tr></tfoot></table></div>';

  if(R(G.exemption112A)>0)h+=note("₹"+F(G.exemption112A)+" of the ₹1,25,000 section-112A / 115AD(1)(iii)-proviso exemption applied.");
  if(resident&&isAopBoi&&R(G.exemptionBasic)>0)h+=note("₹"+F(G.exemptionBasic)+" of unused basic exemption ("+RS(New?400000:250000)+") set off against the capital-gains special heads, highest rate first.");
  else if(!resident)h+=note("Basic-exemption set-off against special-rate income is not available to a non-resident.");

  /* row 107 — the only human control */
  h+=row("Do you want to edit the details auto-populated in the table above?",
    sel("si.edit",[["Yes","Yes"],["No","No"]],{blank:false}),{ref:"C107",hint:"EditAutopoulatedDetail"});
  if(S.si.edit==="Yes"){
    h+=note("Override the auto-populated rows — for the DTAA / treaty-rate cases. Pick the section, its rate and the income; "+
      "a code already in the table above is replaced, a new code is added. The ₹1,25,000 and basic-exemption adjustments still apply.");
    h+=grid("si.over",[
      {h:"Section",k:"code",t:"sel",opts:SI_CODE_OPTS,req:1},
      {h:"Rate (%)",k:"rate",t:"sel",opts:SI_RATES.map(x=>[x,x])},
      {h:"Income",k:"inc",t:"num",req:1}],
      S.si.over||[],
      {min:"620px",empty:"No override added — the table is fully auto-populated.",add:"Add / override a special-rate head"});
  }
  return h;
}

/* =====================================================================
   EXPORT — ScheduleSI
   ===================================================================== */
function expSi(j){
  const G=S.C.si||engSi()||S.C.si||{};
  const si=(G.rows||[]).filter(r=>r.code&&SI_RATE_ENUM.indexOf(siSnapRate(r.rate))>=0&&R(r.inc)>0);
  const SI={
    TotSplRateInc:n0(G.TotSplRateInc),           /* H105 — required (fill zero) */
    TotSplRateIncTax:n0(G.TotSplRateIncTax)};    /* J105 — required (fill zero) */
  if(si.length){                                 /* SplCodeRateTax has minItems:1 — omit when empty */
    SI.SplCodeRateTax=si.map(r=>({
      SecCode:r.code,
      SplRatePercent:siSnapRate(r.rate),
      SplRateInc:n0(r.inc),
      SplRateIncTax:n0(r.tax)}));
  }
  if(S.si.edit==="Yes")SI.EditAutopoulatedDetail="Y"; else if(si.length)SI.EditAutopoulatedDetail="N";
  put(j,"ScheduleSI",SI);
}

/* =====================================================================
   IMPORT — the inverse (only the non-CG override heads are kept; the
   capital-gains heads are re-derived from Schedule CG each compute)
   ===================================================================== */
function impSi(I5){
  const read=[]; const si=I5&&I5.ScheduleSI; if(!si)return read;
  S.si.edit=(si.EditAutopoulatedDetail==="Y")?"Yes":(si.EditAutopoulatedDetail==="N"?"No":S.si.edit);
  if(Array.isArray(si.SplCodeRateTax)){
    S.si.over=si.SplCodeRateTax
      .filter(r=>SI_CG_AUTO.indexOf(r.SecCode)<0)
      .map(r=>({code:r.SecCode, rate:r.SplRatePercent!=null?String(r.SplRatePercent):"", inc:nz(r.SplRateInc)}));
    read.push("Schedule SI (special-rate income)");
  }
  return read;
}

/* =====================================================================
   CHECKS — reconciliations to BFLA col 5 / OS / CG / BP (SI.md rules
   697-730), regime/residency aware
   ===================================================================== */
function chkSi(){
  const out=[]; const G=S.C.si||engSi()||S.C.si||{};
  const add=(lvl,t,m)=>out.push({lvl,t,m,sec:"si"});
  const cg=(S.C.cg||{}), cgB=(cg.buckets||{}), os=(S.C.os||{}), bp=(S.C.bp||{});   /* published S.C.bp.{a3d,a3e,a3f} */
  const Lb=(S.C.loss||{}).afterB||{};
  const rowInc=code=>{const r=(G.rows||[]).find(x=>x.code===code);return r?R(r.inc):0;};

  /* rule 708 — total tax = sum of the individual line items */
  const sumTax=(G.rows||[]).reduce((a,r)=>a+N(r.tax),0);
  if(Math.abs(sumTax-N(G.TotSplRateIncTax))>1)
    add("err","Schedule SI total (rule 708)","Total tax at special rates (row 105) must equal the sum of the line items.");

  /* rule 705/706 — income (i) > 0 must carry a tax (ii) [except the DTAA rows] */
  (G.rows||[]).forEach(r=>{if(R(r.inc)>0&&R(r.tax)<=0&&["DTAASTCG","DTAALTCG","DTAAOS"].indexOf(r.code)<0)
    add("err","Special-rate tax missing (rule 706)","\""+SI_CODE_LABEL(r.code)+"\" has income of ₹"+F(r.inc)+" but no tax.");});

  /* rules 713/714/715 — the 12.5% LTCG bucket + 111A/PTI STCG = BFLA col 5 */
  const bLt=N(Lb.lt125!=null?Lb.lt125:(N(cgB.si112a)+N(cgB.si112)));
  const siLt=rowInc("21")+rowInc("2A");
  if(bLt>0&&Math.abs(siLt-R(bLt))>1)
    add("warn","12.5% LTCG vs BFLA 5xb (rule 715)","Schedule SI's 12.5% LTCG (₹"+F(siLt)+") should tie to BFLA column 5 (₹"+F(bLt)+").");
  const bSt=N(Lb.st20!=null?Lb.st20:cgB.si111a20);
  if(bSt>0&&Math.abs(rowInc("1")-R(bSt))>1)
    add("warn","111A STCG vs BFLA 5vi (rule 713)","Schedule SI's 111A STCG (₹"+F(rowInc("1"))+") should tie to BFLA column 5 (₹"+F(bSt)+").");

  /* rules 709/710 — DTAA STCG/LTCG = BFLA 5ix / 5xi */
  const bStD=N(Lb.stDTAA!=null?Lb.stDTAA:cgB.stDTAA);
  if(bStD>0&&Math.abs(rowInc("DTAASTCG")-R(bStD))>1)
    add("warn","DTAA STCG vs BFLA 5ix (rule 709)","Schedule SI's DTAA STCG (₹"+F(rowInc("DTAASTCG"))+") should tie to BFLA column 5 (₹"+F(bStD)+").");
  const bLtD=N(Lb.ltDTAA!=null?Lb.ltDTAA:cgB.ltDTAA);
  if(bLtD>0&&Math.abs(rowInc("DTAALTCG")-R(bLtD))>1)
    add("warn","DTAA LTCG vs BFLA 5xi (rule 710)","Schedule SI's DTAA LTCG (₹"+F(rowInc("DTAALTCG"))+") should tie to BFLA column 5 (₹"+F(bLtD)+").");

  /* rule 704 — OS-DTAA special income = BFLA 5xiv */
  const bOsD=N(Lb.osDTAA!=null?Lb.osDTAA:os.item2e);
  if(N(os.item2e)>0&&Math.abs(rowInc("DTAAOS")-R(bOsD))>1)
    add("warn","OS-DTAA vs BFLA 5xiv (rule 704)","Schedule SI's OS-DTAA income (₹"+F(rowInc("DTAAOS"))+") should tie to BFLA column 5 (₹"+F(bOsD)+").");

  /* rules 700/701 — SI 115BB = OS 2a(i); SI 115BBE = OS 2b */
  if(N(os.s2ai)>0&&Math.abs(rowInc("5BB")-R(os.s2ai))>1)
    add("warn","115BB vs OS 2a(i) (rule 700)","Schedule SI's 115BB winnings (₹"+F(rowInc("5BB"))+") should equal Schedule OS 2a(i) (₹"+F(os.s2ai)+").");
  if(N(os.b2)>0&&Math.abs(rowInc("5BBE")-R(os.b2))>1)
    add("warn","115BBE vs OS 2b (rule 701)","Schedule SI's 115BBE income (₹"+F(rowInc("5BBE"))+") should equal Schedule OS 2b (₹"+F(os.b2)+").");

  /* rules 702/703/712 — SI 115BBF/G/H (BP) = BP 3d/3e/3f */
  if(N(bp.a3d)>0&&Math.abs(rowInc("5BBF_BP")-R(bp.a3d))>1)
    add("warn","115BBF (BP) vs BP 3d (rule 702)","Schedule SI's 115BBF patent (BP) income should equal Schedule BP 3d.");
  if(N(bp.a3e)>0&&Math.abs(rowInc("5BBG_BP")-R(bp.a3e))>1)
    add("warn","115BBG (BP) vs BP 3e (rule 703)","Schedule SI's 115BBG carbon-credit (BP) income should equal Schedule BP 3e.");
  if(N(bp.a3f)>0&&Math.abs(rowInc("5BBH_BP")-R(bp.a3f))>1)
    add("warn","115BBH (BP) vs BP 3f (rule 712)","Schedule SI's 115BBH VDA (BP) income should equal Schedule BP 3f.");

  /* §115BBF is claimable only by a resident (rules 249/479) */
  if(!(S.fs&&S.fs.resStatus==="RES")&&(rowInc("5BBF")>0||rowInc("5BBF_BP")>0))
    add("err","115BBF residents only (rule 249/479)","Section 115BBF (income from patent) can be claimed only by a resident.");

  if((G.TotSplRateIncTax||0)>0)add("ok","Tax at special rates","₹"+F(G.TotSplRateIncTax)+" of tax at special rates, added to the normal-rate tax in Part B-TTI 2b.");
  return out;
}

/* ---- register — corder 52, AFTER loss (46); screen order 52 ----------- */
reg({id:"si", t:"Special-rate income", ref:"Schedule SI",
  f:secSi, s:()=>{const G=S.C.si||{};return G.TotSplRateIncTax?RS(G.TotSplRateIncTax)+" special-rate tax":"";},
  eng:engSi, exp:expSi, imp:impSi, chk:chkSi, order:52, corder:52});
