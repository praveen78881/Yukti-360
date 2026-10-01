/* =====================================================================
   ITR-3 · Section "loss" — Losses: set-off and carry-forward
   Schedules CYLA · BFLA · CFL, built strictly from the ITR-3 books
   books/ITR-3/CYLA_BFLA.md and books/ITR-3/CFL.md (never ITR-2's numbers).
   Self-contained: state seed, engLoss, secLoss, expLoss, impLoss, chkLoss,
   and one reg() at the bottom. compute order 45 (after every income head,
   before tax roll-up). Regime-gated per books/ITR-3/REGIME.md.
   ===================================================================== */

/* ---- state ---------------------------------------------------------- */
/* S.loss.cfl is keyed by assessment year; each year holds the person's
   own inputs (date of filing + the historic per-column loss figures).
   editC / editB are the CYLA / BFLA "edit auto-populated details?" flags;
   the *Over objects hold the manual overrides behind those switches.     */
S.loss = S.loss || { cfl:{}, editC:"", editB:"", cylaOver:{}, busOver:{}, osOver:{}, bflaOver:{} };

/* the fourteen live income heads, in the book's row order (CYLA ii..xv /
   BFLA i..xiv). The three superseded CG rate rows (@15/@10/@20) are hidden
   in the book and never built. Flags:
     cyHP/cyBus/cyOS : which current-year set-off column exists on this row
                       (verbatim from the schema — see CYLA_BFLA.md leaves)
     bf2   : which brought-forward column feeds BFLA col-2 for this head
     bfDep : whether BFLA carries the depreciation / 35(4) columns          */
const LOSS_ROWS=[
 ["sal","Salaries","Salary",{cyHP:1,cyBus:0,cyOS:1},{bf2:0,bfDep:0}],
 ["hp","House property","HP",{cyHP:0,cyBus:1,cyOS:1},{bf2:"hp",bfDep:1}],
 ["bus","Business income (excluding speculation & specified business) or profession","BusProfExclSpecProf",{cyHP:1,cyBus:0,cyOS:1},{bf2:"bus",bfDep:1}],
 ["spec","Speculative income","SpeculativeInc",{cyHP:1,cyBus:0,cyOS:1},{bf2:"spec",bfDep:1}],
 ["specified","Specified business income","SpecifiedInc",{cyHP:1,cyBus:0,cyOS:1},{bf2:"specified",bfDep:1}],
 ["st20","Short-term capital gain taxable @ 20%","STCG20Per",{cyHP:1,cyBus:1,cyOS:1},{bf2:"st",bfDep:1}],
 ["st30","Short-term capital gain taxable @ 30%","STCG30Per",{cyHP:1,cyBus:1,cyOS:1},{bf2:"st",bfDep:1}],
 ["stApp","Short-term capital gain taxable at applicable rates","STCGAppRate",{cyHP:1,cyBus:1,cyOS:1},{bf2:"st",bfDep:1}],
 ["stDTAA","Short-term capital gain taxable at special rate as per DTAA","STCGDTAARate",{cyHP:1,cyBus:1,cyOS:1},{bf2:"st",bfDep:1}],
 ["lt125","Long-term capital gain taxable @ 12.5%","LTCG12_5Per",{cyHP:1,cyBus:1,cyOS:1},{bf2:"lt",bfDep:1}],
 ["ltDTAA","Long-term capital gain taxable at special rate as per DTAA","LTCGDTAARate",{cyHP:1,cyBus:1,cyOS:1},{bf2:"lt",bfDep:1}],
 ["os","Net income from other sources chargeable at normal applicable rates","OthSrcExclRaceHorse",{cyHP:1,cyBus:1,cyOS:0},{bf2:0,bfDep:1}],
 ["horse","Profit from activity of owning and maintaining race horses","OthSrcRaceHorse",{cyHP:1,cyBus:1,cyOS:1},{bf2:"horse",bfDep:1}],
 ["osDTAA","Income from other sources taxable at special rates as per DTAA","IncOSDTAA",{cyHP:1,cyBus:1,cyOS:1},{bf2:0,bfDep:1}]];

/* the set-off walk orders (heads that can absorb each current-year loss).
   HP & business loss reach every head that carries their column; the OS
   loss is set first against race horses and OS-DTAA (CYLA_BFLA.md rule).   */
/* HP-loss set-off order — from the CYLA sheet's R/N running-remainder chain:
   sal → bus → spec → specified → os(normal) → race-horse → CG heads. HP loss
   does NOT set off against OS-DTAA (the sheet has no HP column on that row). */
const CY_ORDER_HP =["sal","bus","spec","specified","os","horse","st30","stApp","st20","stDTAA","lt125","ltDTAA"];
const CY_ORDER_BUS=["hp","os","horse","osDTAA","st30","stApp","st20","stDTAA","lt125","ltDTAA"];
const CY_ORDER_OS =["horse","osDTAA","sal","hp","bus","spec","specified","st30","stApp","st20","stDTAA","lt125","ltDTAA"];
/* BFLA: a long-term loss goes first on the two long slots; a short-term
   loss then on all six capital slots (short first, long after).            */
const BF_ORDER_LT=["lt125","ltDTAA"];
const BF_ORDER_ST=["st30","stApp","st20","stDTAA","lt125","ltDTAA"];

/* Schedule CFL — the fixed sixteen year-rows, each with its own schema
   block and the set of columns that are live in that row's carry window
   (CFL.md: HP/business(5c)/STCG/LTCG carry 8 yrs = rows ix..xvi 2018-19+;
   speculative & race-horse carry 4 yrs = rows xiii..xvi 2022-23+;
   specified business u/s 35AD carries indefinitely = every row).            */
const F_SPEC={specified:1};
const F_8YR ={hp:1,bus:1,specified:1,st:1,lt:1};
const F_FULL={hp:1,bus:1,spec:1,specified:1,st:1,lt:1,horse:1};
const CFL_YEARS=[
 ["2010-11","LossCFFromPrev9thYearFromAY",F_SPEC],
 ["2011-12","LossCFFromPrev8thYearFromAY",F_SPEC],
 ["2012-13","LossCFFromPrev7thYearFromAY",F_SPEC],
 ["2013-14","LossCFFromPrev6thYearFromAY",F_SPEC],
 ["2014-15","LossCFFromPrev5thYearFromAY",F_SPEC],
 ["2015-16","LossCFFromPrev4thYearFromAY",F_SPEC],
 ["2016-17","LossCFFromPrev3rdYearFromAY",F_SPEC],
 ["2017-18","LossCFFromPrev2ndYearFromAY",F_SPEC],
 ["2018-19","LossCFFromPrevYrToAY",F_8YR],
 ["2019-20","LossCFCurrentAssmntYear",F_8YR],
 ["2020-21","LossCFCurrentAssmntYear2021",F_8YR],
 ["2021-22","LossCFCurrentAssmntYear2022",F_8YR],
 ["2022-23","LossCFCurrentAssmntYear2023",F_FULL],
 ["2023-24","LossCFCurrentAssmntYear2024",F_FULL],
 ["2024-25","LossCFCurrentAssmntYear2025",F_FULL],
 ["2025-26","LossCFCurrentAssmntYear2026",F_FULL]];
/* the oldest year in each carry window — its unrelieved figure lapses (CFL
   [G25]/[L25]/[M25]/[O25]/[R25]/[U25]); specified business never lapses.    */
const CFL_OLDEST_8="2018-19", CFL_OLDEST_4="2022-23";

/* ---- engine --------------------------------------------------------- */
/* Every cross-head figure is read defensively (never throw). The assumed
   S.C.<head> contract each income section publishes (guarded, default 0):
     sal.income                    salary head income
     hp.income                     house-property head income (signed)
     bp.busExcl / bp.spec / bp.specified   adjusted P&L per business kind (signed)
     cg.after.{st20,st30,stApp,stDTAA,lt125,ltDTAA}  current-yr gains after CG set-off
     cg.cflSTCL / cg.cflLTCL       Table E unabsorbed STCL/LTCL (current-yr carry)
     os.netNormal                  net OS at normal rates (signed)  [os.BalanceNoRaceHorse]
     os.raceHorse                  race-horse balance (signed)      [os.BalanceOwnRaceHorse]
     os.dtaaTotal                  OS income taxable at special DTAA rates  [os.DTAA_Amt]
   Each falls back to .income where a finer key is absent.                  */
function engLoss(){
  const g=(o)=>o||{};
  const sal=g(S.C.sal), hp=g(S.C.hp), bp=g(S.C.bp), cg=g(S.C.cg), os=g(S.C.os), ud=g(S.C.ud);
  const cgAfter=g(cg.after);
  const busExcl   = ("busExcl"   in bp)?N(bp.busExcl)   : N(bp.income);  /* NetPLBusOthThanSpec7A7B7C */
  const specPL    = ("spec"      in bp)?N(bp.spec)      : 0;             /* AdjustedPLFrmSpecuBus     */
  const specifiedPL=("specified" in bp)?N(bp.specified) : 0;            /* AdjustedPLFrmSpecifiedBus */
  const osNorm    = ("netNormal" in os)?N(os.netNormal) : N(os.income); /* os.BalanceNoRaceHorse */
  const osHorseBal= ("raceHorse" in os)?N(os.raceHorse) : 0;            /* os.BalanceOwnRaceHorse */
  const osDtaa    = N(os.dtaaTotal);                                    /* os.DTAA_Amt */
  const New=isNew();

  /* ---- CYLA row i · the three incoming current-year losses ---------- */
  const hpTotal = Math.max(0,-N(hp.income));                            /* G6 = ABS(MIN(HP.TotalIncomeChargeableUnHP,0)) */
  const hpCapped= New?0:Math.min(hpTotal,200000);                       /* new regime: HP loss not set off (A572/A579) */
  const hpExcess= New?0:Math.max(0,hpTotal-200000);                     /* over ₹2,00,000 → straight to CFL */
  const busLoss = Math.max(0,-R(busExcl+Math.max(0,specPL)+Math.max(0,specifiedPL))); /* H6 */
  const osLoss  = Math.max(0,-osNorm);                                  /* I6 = ABS(MIN(os.BalanceNoRaceHorse,0)) */

  /* ---- CYLA col 1 · income of the current year (positive only) ------ */
  const inc={
    sal:Math.max(0,N(sal.income)), hp:Math.max(0,N(hp.income)),
    bus:Math.max(0,busExcl), spec:Math.max(0,specPL), specified:Math.max(0,specifiedPL),
    st20:Math.max(0,N(cgAfter.st20)), st30:Math.max(0,N(cgAfter.st30)),
    stApp:Math.max(0,N(cgAfter.stApp)), stDTAA:Math.max(0,N(cgAfter.stDTAA)),
    lt125:Math.max(0,N(cgAfter.lt125)), ltDTAA:Math.max(0,N(cgAfter.ltDTAA)),
    os:Math.max(0,osNorm), horse:Math.max(0,osHorseBal), osDTAA:Math.max(0,osDtaa)};

  /* ---- CYLA cols 2/3/4 · set-off (greedy, respecting 2+3+4 ≤ 1) ----- */
  const setHP={},setBus={},setOS={},remInc={};
  LOSS_ROWS.forEach(r=>{setHP[r[0]]=0;setBus[r[0]]=0;setOS[r[0]]=0;remInc[r[0]]=inc[r[0]];});
  const flag={};LOSS_ROWS.forEach(r=>flag[r[0]]=r[3]);
  const over=S.loss.editC;
  if(over){                                                            /* manual override behind the sheet's own switch */
    LOSS_ROWS.forEach(r=>{const k=r[0],f=r[3];
      if(f.cyHP){setHP[k]=Math.min(N((S.loss.cylaOver[k]||{}).hp),remInc[k]);remInc[k]-=setHP[k];}
      if(f.cyBus){setBus[k]=Math.min(N((S.loss.busOver[k]||{}).bus),remInc[k]);remInc[k]-=setBus[k];}
      if(f.cyOS){setOS[k]=Math.min(N((S.loss.osOver[k]||{}).os),remInc[k]);remInc[k]-=setOS[k];}});
  }else{
    let rem=hpCapped;CY_ORDER_HP.forEach(k=>{if(rem<=0||!flag[k].cyHP)return;const t=Math.min(rem,remInc[k]);setHP[k]=t;remInc[k]-=t;rem-=t;});
    rem=busLoss;   CY_ORDER_BUS.forEach(k=>{if(rem<=0||!flag[k].cyBus)return;const t=Math.min(rem,remInc[k]);setBus[k]=t;remInc[k]-=t;rem-=t;});
    rem=osLoss;    CY_ORDER_OS.forEach(k=>{if(rem<=0||!flag[k].cyOS)return;const t=Math.min(rem,remInc[k]);setOS[k]=t;remInc[k]-=t;rem-=t;});
  }
  const sum=o=>Object.keys(o).reduce((a,k)=>a+o[k],0);
  const totHPset =Math.min(sum(setHP),hpTotal,200000);                 /* G25, capped at ₹2,00,000 (s.71(3A)) */
  const totBusset=sum(setBus);                                         /* business-loss column total */
  const totOSset =sum(setOS);                                          /* I25 */
  const hpRemain = New?0:(totHPset<200000?Math.max(0,(hpCapped-totHPset)+hpExcess):hpExcess); /* G26 → CFL */
  const busRemain= Math.max(0,busLoss-totBusset);                      /* business loss to CFL */
  const osRemain = Math.max(0,osLoss-totOSset);                        /* I26 — normal OS loss lapses */
  const afterC={};LOSS_ROWS.forEach(r=>{const k=r[0];afterC[k]=R(inc[k]-setHP[k]-setBus[k]-setOS[k]);}); /* col 5 = 1−2−3−4 */

  /* ---- CFL · brought-forward figures from the year-rows ------------- */
  const cflRow=y=>(S.loss.cfl||{})[y]||{};
  const b5c=r=>Math.max(0,N(r.bus5a)-(New?N(r.bus5b):0));              /* 5c = MAX(0, 5a − 5b); 5b only in new regime */
  const bf={hp:0,bus:0,spec:0,specified:0,st:0,lt:0,horse:0};
  CFL_YEARS.forEach(([y,,F])=>{const r=cflRow(y);
    if(F.hp)bf.hp+=N(r.hp); if(F.bus)bf.bus+=b5c(r); if(F.spec)bf.spec+=N(r.spec);
    if(F.specified)bf.specified+=N(r.specified); if(F.st)bf.st+=N(r.st);
    if(F.lt)bf.lt+=N(r.lt); if(F.horse)bf.horse+=N(r.horse);});

  /* ---- BFLA col 2 · brought-forward loss set off against col-1 (=CYLA5) */
  const setBF={};LOSS_ROWS.forEach(r=>setBF[r[0]]=0);
  const overB=S.loss.editB;
  if(overB){
    LOSS_ROWS.forEach(r=>{const k=r[0],c2=r[4].bf2;if(c2)setBF[k]=Math.min(N(S.loss.bflaOver[k]),afterC[k]);});
  }else{
    setBF.hp       =Math.min(bf.hp,afterC.hp);
    setBF.bus      =Math.min(bf.bus,afterC.bus);
    setBF.spec     =Math.min(bf.spec,afterC.spec);
    setBF.specified=Math.min(bf.specified,afterC.specified);
    let remLT=bf.lt;BF_ORDER_LT.forEach(k=>{if(remLT<=0)return;const t=Math.min(remLT,afterC[k]-setBF[k]);setBF[k]+=t;remLT-=t;}); /* LTCL first, long slots only */
    let remST=bf.st;BF_ORDER_ST.forEach(k=>{if(remST<=0)return;const t=Math.min(remST,afterC[k]-setBF[k]);setBF[k]+=t;remST-=t;}); /* STCL against any CG slot */
    setBF.horse    =Math.min(bf.horse,afterC.horse);
  }
  /* how much of each brought-forward column was actually used (for CFL xviii) */
  const usedBF={hp:setBF.hp,bus:setBF.bus,spec:setBF.spec,specified:setBF.specified,horse:setBF.horse,st:0,lt:0};
  {const ltUsed=Math.min(bf.lt,BF_ORDER_LT.reduce((a,k)=>a+setBF[k],0));
   const stUsed=Math.min(bf.st,BF_ORDER_ST.reduce((a,k)=>a+setBF[k],0)-ltUsed);
   usedBF.lt=Math.max(0,ltUsed);usedBF.st=Math.max(0,stUsed);}

  /* BFLA cols 3/4 · brought-forward depreciation & 35(4) allowance from
     Schedule UD (owned by the bp section); read guarded, default nil.      */
  const depr=g(ud.deprByHead), all35=g(ud.all35ByHead);
  const setDep={},set35={};LOSS_ROWS.forEach(r=>{setDep[r[0]]=r[4].bfDep?N(depr[r[0]]):0;set35[r[0]]=r[4].bfDep?N(all35[r[0]]):0;});

  const afterB={};let gti=0;
  LOSS_ROWS.forEach(r=>{const k=r[0];afterB[k]=R(Math.max(0,afterC[k]-setBF[k]-setDep[k]-set35[k]));gti+=afterB[k];}); /* J = MAX(0,F−G−H−I) */
  const totBFset=sum(setBF), totDep=sum(setDep), tot35=sum(set35);

  /* ---- CFL xix · current-year losses to carry forward -------------- */
  const cur={
    hp:hpRemain,                                                       /* [G24] = CYLA HP balance */
    bus:busRemain,                                                     /* [L24] = CYLA business balance */
    spec:Math.max(0,-R(specPL)),                                       /* [M24] = ABS(MIN(0, AdjustedPLFrmSpecuBus)) */
    specified:Math.max(0,-R(specifiedPL)),                             /* [N24] = ABS(MIN(0, AdjustedPLFrmSpecifiedBus)) */
    st:Math.max(0,R(("cflSTCL" in cg)?N(cg.cflSTCL):0)),               /* [O24] = CG Table E unabsorbed STCL */
    lt:Math.max(0,R(("cflLTCL" in cg)?N(cg.cflLTCL):0)),               /* [R24] = CG Table E unabsorbed LTCL */
    horse:Math.max(0,-R(osHorseBal))};                                 /* [U24] = ABS(MIN(0, os.BalanceOwnRaceHorse)) */

  /* ---- CFL xx · total carried forward, with the window lapse rule --- */
  const old8=cflRow(CFL_OLDEST_8), old4=cflRow(CFL_OLDEST_4);
  const oldest={hp:N(old8.hp),bus:b5c(old8),st:N(old8.st),lt:N(old8.lt),spec:N(old4.spec),horse:N(old4.horse)};
  const cf={};
  ["hp","bus","st","lt"].forEach(k=>{cf[k]=Math.max(0,bf[k]-Math.max(usedBF[k],oldest[k])+cur[k]);}); /* 8-yr window lapse */
  ["spec","horse"].forEach(k=>{cf[k]=Math.max(0,bf[k]-Math.max(usedBF[k],oldest[k])+cur[k]);});       /* 4-yr window lapse */
  cf.specified=Math.max(0,bf.specified-usedBF.specified+cur.specified);                               /* no lapse — indefinite */
  const lapsed={};["hp","bus","st","lt","spec","horse"].forEach(k=>{lapsed[k]=Math.max(0,oldest[k]-usedBF[k]);});
  cf.total=cf.hp+cf.bus+cf.spec+cf.specified+cf.st+cf.lt+cf.horse;

  /* ---- BFLA validators (CFL.md / rules.json) ----------------------- */
  const val=[];
  const stSetTotal=BF_ORDER_ST.reduce((a,k)=>a+setBF[k],0), ltSetTotal=BF_ORDER_LT.reduce((a,k)=>a+setBF[k],0);
  if(stSetTotal>bf.st+bf.lt+1) val.push("Losses set off against capital gains cannot exceed the capital loss brought forward in Schedule CFL.");
  if(ltSetTotal>bf.lt+1)       val.push("Losses set off against long-term gains cannot exceed the long-term loss brought forward in Schedule CFL.");

  /* ---- this head's contribution to gross total income --------------
     GTI = BFLA total (income after CYLA & BFLA, all heads). The other
     heads publish their own signed income; loss.income is the correction
     that makes Σ S.C.<head>.income equal that true GTI (losses set off /
     carried forward, and the ₹2L cap, are all folded in here).            */
  const otherHeads=N(sal.income)+N(hp.income)+N(bp.income)+N(cg.income)+N(os.income);
  const income=R(gti)-R(otherHeads);

  S.C.loss={
    inc,hpTotal:R(hpTotal),hpCapped:R(hpCapped),hpExcess:R(hpExcess),busLoss:R(busLoss),osLoss:R(osLoss),
    setHP,setBus,setOS,totHPset:R(totHPset),totBusset:R(totBusset),totOSset:R(totOSset),
    hpRemain:R(hpRemain),busRemain:R(busRemain),osRemain:R(osRemain),afterC,
    bf,setBF,setDep,set35,usedBF,totBFset:R(totBFset),totDep:R(totDep),tot35:R(tot35),afterB,gti:R(gti),
    cur,cf,oldest,lapsed,val,income:R(income),
    cylaTotal:R(totHPset+totBusset+totOSset), bflaTotal:R(totBFset)};
  return S.C.loss;
}

/* ---- renderer ------------------------------------------------------- */
function secLoss(){
  const L=S.C.loss||engLoss();let h="";
  const New=isNew();
  const closed='style="background:var(--closed)"';

  /* ===== Schedule CYLA ===== */
  h+='<div class="cgband">Schedule CYLA — set-off of the current year\'s losses</div>';
  h+=note("This year's house-property loss, business loss and normal other-sources loss are set against the other heads in the order the utility uses. "+
    "A house-property loss is set against other heads only up to ₹2,00,000"+(New?" — and not at all under the new regime, where it lapses":"; the excess goes to Schedule CFL")+
    ". A normal other-sources loss not set off here lapses.");
  const ed=!!S.loss.editC;
  h+='<div class="full"><table class="gt" style="min-width:1120px"><thead><tr><th class="l" style="width:34px">Sl.</th>'+
     '<th class="l" style="min-width:320px">Head / source of income</th><th style="width:120px">Income of current year (1)</th>'+
     '<th style="width:130px">HP loss set off (2)</th><th style="width:150px">Business loss set off (3)</th>'+
     '<th style="width:150px">OS loss set off (4)</th><th style="width:130px">Remaining after set-off (5)</th></tr></thead><tbody>';
  h+='<tr><td class="l">i</td><td class="l"><b>Loss to be set off (fill only if the computed figure is negative)</b></td><td></td>'+
     '<td class="num">'+cell(-L.hpTotal)+(L.hpExcess?'<span class="dt">+ '+F(L.hpExcess)+' over ₹2L → CFL</span>':'')+'</td>'+
     '<td class="num">'+cell(-L.busLoss)+'</td><td class="num">'+cell(-L.osLoss)+'</td><td></td></tr>';
  const slC=["ii","iii","iv","v","vi","vii","viii","ix","x","xi","xii","xiii","xiv","xv"];
  LOSS_ROWS.forEach((r,i)=>{const [k,label,,f]=r;
    h+='<tr><td class="l">'+slC[i]+'</td><td class="l">'+esc(label)+'</td><td class="num">'+cell(L.inc[k])+'</td>'+
       '<td class="num"'+(f.cyHP?'':' '+closed)+'>'+(f.cyHP?(ed?inp("loss.cylaOver."+k+".hp",{n:1}):cell(L.setHP[k])):'')+'</td>'+
       '<td class="num"'+(f.cyBus?'':' '+closed)+'>'+(f.cyBus?(ed?inp("loss.busOver."+k+".bus",{n:1}):cell(L.setBus[k])):'')+'</td>'+
       '<td class="num"'+(f.cyOS?'':' '+closed)+'>'+(f.cyOS?(ed?inp("loss.osOver."+k+".os",{n:1}):cell(L.setOS[k])):'')+'</td>'+
       '<td class="num">'+cell(L.afterC[k])+'</td></tr>';});
  h+='</tbody><tfoot>'+
     '<tr><td class="l">xvi</td><td class="l">Total loss set off</td><td></td><td>'+F(L.totHPset)+'</td><td>'+F(L.totBusset)+'</td><td>'+F(L.totOSset)+'</td><td></td></tr>'+
     '<tr><td class="l">xvii</td><td class="l">Loss remaining after set-off (i − xvi)</td><td></td><td>'+F(L.hpRemain)+'<span class="dt">→ CFL</span></td><td>'+F(L.busRemain)+'<span class="dt">→ CFL</span></td><td>'+F(L.osRemain)+'<span class="dt">lapses</span></td><td></td></tr>'+
     '</tfoot></table></div>';
  if(New)h+=note("New regime u/s 115BAC(1A): a house-property loss cannot be set off against any other head, nor carried forward through Schedule CYLA (A572 / A573 / A579).","warn");
  h+=row("Do you want to edit the details auto-populated in the table above?",sel("loss.editC",[["","No"],["Y","Yes"]],{blank:false}),{ref:"CYLA"});

  /* ===== Schedule BFLA ===== */
  h+='<div class="cgband">Schedule BFLA — set-off of brought-forward losses of earlier years</div>';
  h+=note("Losses brought forward from Schedule CFL, set against what remains after CYLA. HP loss against HP income only; business against business, speculative against speculative, specified against specified; a short-term capital loss against any capital gain; a long-term loss against long-term gains only (and first); a race-horse loss against race-horse income only. Brought-forward depreciation and the 35(4) allowance come from Schedule UD. Nothing against salary or the DTAA / normal other-sources rows.");
  const edB=!!S.loss.editB;
  h+='<div class="full"><table class="gt" style="min-width:1120px"><thead><tr><th class="l" style="width:34px">Sl.</th>'+
     '<th class="l" style="min-width:320px">Head / source of income</th><th style="width:130px">Income after CYLA (1)</th>'+
     '<th style="width:130px">B/f loss set off (2)</th><th style="width:130px">B/f depreciation (3)</th>'+
     '<th style="width:140px">B/f 35(4) allowance (4)</th><th style="width:130px">Remaining after set-off (5)</th></tr></thead><tbody>';
  const slB=["i","ii","iii","iv","v","vi","vii","viii","ix","x","xi","xii","xiii","xiv"];
  LOSS_ROWS.forEach((r,i)=>{const [k,label,,,b]=r;
    h+='<tr><td class="l">'+slB[i]+'</td><td class="l">'+esc(label)+'</td><td class="num">'+cell(L.afterC[k])+'</td>'+
       '<td class="num"'+(b.bf2?'':' '+closed)+'>'+(b.bf2?(edB?inp("loss.bflaOver."+k,{n:1}):cell(L.setBF[k])):'')+'</td>'+
       '<td class="num"'+(b.bfDep?'':' '+closed)+'>'+(b.bfDep?cell(L.setDep[k]):'')+'</td>'+
       '<td class="num"'+(b.bfDep?'':' '+closed)+'>'+(b.bfDep?cell(L.set35[k]):'')+'</td>'+
       '<td class="num">'+cell(L.afterB[k])+'</td></tr>';});
  h+='</tbody><tfoot>'+
     '<tr><td class="l">xv</td><td class="l">Total of brought-forward set off</td><td></td><td>'+F(L.totBFset)+'</td><td>'+F(L.totDep)+'</td><td>'+F(L.tot35)+'</td><td></td></tr>'+
     '<tr><td class="l">xvi</td><td class="l">Current year\'s income remaining after set-off — gross total income</td><td></td><td></td><td></td><td></td><td>'+F(L.gti)+'</td></tr>'+
     '</tfoot></table></div>';
  (L.val||[]).forEach(m=>h+=note(m,"stop"));
  h+=row("Do you want to edit the details auto-populated in the table above?",sel("loss.editB",[["","No"],["Y","Yes"]],{blank:false}),{ref:"BFLA"});

  /* ===== Schedule CFL ===== */
  h+='<div class="cgband">Schedule CFL — losses to be carried forward to future years</div>';
  h+=note("One row per assessment year. The date of filing ("+DF+") is required on any year that carries a loss — a loss carries only if that year's return was filed within the 139(1) due date. Business, speculative and specified-business columns are live on ITR-3. Speculative and race-horse losses carry four years (their columns show only on the last four rows); the specified-business loss u/s 35AD carries indefinitely; the rest carry eight years.");
  h+='<div class="full"><table class="gt" style="min-width:1500px"><thead><tr><th class="l" style="width:30px">Sl.</th>'+
     '<th class="l" style="width:78px">AY</th><th class="l" style="width:118px">Date of filing</th>'+
     '<th style="width:110px">HP (4)</th><th style="width:110px">Business 5a</th><th style="width:120px">115BAC adj 5b</th><th style="width:120px">Business 5c</th>'+
     '<th style="width:110px">Speculative (6)</th><th style="width:110px">Specified (7)</th>'+
     '<th style="width:110px">STCL (8)</th><th style="width:110px">LTCL (9)</th><th style="width:120px">Race horses (10)</th></tr></thead><tbody>';
  const slR=["i","ii","iii","iv","v","vi","vii","viii","ix","x","xi","xii","xiii","xiv","xv","xvi"];
  const b5cView=r=>Math.max(0,N(r.bus5a)-(New?N(r.bus5b):0));
  CFL_YEARS.forEach(([y,,F],i)=>{const p="loss.cfl."+y+".";const r=(S.loss.cfl||{})[y]||{};
    const dead=(v)=>'<td class="num" '+closed+'>'+(v?cell(0):'')+'</td>';
    h+='<tr><td class="l">'+slR[i]+'</td><td class="l">'+y+'</td><td>'+inp(p+"dt",{ph:DF,max:10})+'</td>'+
       (F.hp?'<td>'+inp(p+"hp",{n:1})+'</td>':dead(1))+
       (F.bus?'<td>'+inp(p+"bus5a",{n:1})+'</td>':dead(1))+
       (F.bus?(New?'<td>'+inp(p+"bus5b",{n:1})+'</td>':'<td class="num" '+closed+'>'+cell(0)+'</td>'):dead(1))+
       (F.bus?'<td class="num">'+cell(b5cView(r))+'</td>':dead(1))+
       (F.spec?'<td>'+inp(p+"spec",{n:1})+'</td>':dead(0))+
       (F.specified?'<td>'+inp(p+"specified",{n:1})+'</td>':dead(1))+
       (F.st?'<td>'+inp(p+"st",{n:1})+'</td>':dead(1))+
       (F.lt?'<td>'+inp(p+"lt",{n:1})+'</td>':dead(1))+
       (F.horse?'<td>'+inp(p+"horse",{n:1})+'</td>':dead(0))+'</tr>';});
  const B=L.bf,U=L.usedBF,C=L.cur,X=L.cf;
  const frow=(sl,lbl,o)=>'<tr><td class="l">'+sl+'</td><td class="l" colspan="2">'+lbl+'</td>'+
     '<td>'+F(o.hp)+'</td><td></td><td></td><td>'+F(o.bus)+'</td><td>'+F(o.spec)+'</td><td>'+F(o.specified)+'</td><td>'+F(o.st)+'</td><td>'+F(o.lt)+'</td><td>'+F(o.horse)+'</td></tr>';
  h+='</tbody><tfoot>'+
     frow("xvii","Total of earlier-year losses brought forward",B)+
     frow("xviii","Adjustment of the above in Schedule BFLA",U)+
     frow("xix","2026-27 — current-year losses to be carried forward",C)+
     frow("xx","Total loss carried forward to future years",X)+
     '</tfoot></table></div>';
  const lp=["hp","bus","spec","specified","st","lt","horse"].filter(k=>L.lapsed[k]>0);
  if(lp.length)h+=note("<b>Lapsed this year:</b> "+lp.map(k=>({hp:"house property",bus:"business",spec:"speculative",specified:"specified business",st:"short-term capital",lt:"long-term capital",horse:"race horse"})[k]+" "+RS(L.lapsed[k])).join(", ")+" — the loss at the end of its carry window that BFLA did not use.","warn");
  if(L.cf.total>0)h+=note("Total carried forward to next year: <b>"+RS(L.cf.total)+"</b>.");
  return h;
}

/* ---- export --------------------------------------------------------- */
function expLoss(j){
  const L=S.C.loss||engLoss();

  /* ===== ScheduleCYLA ===== */
  const CY={};
  LOSS_ROWS.forEach(r=>{const [k,,key,f]=r;
    const c={IncOfCurYrUnderThatHead:n0(L.inc[k]),IncOfCurYrAfterSetOff:n0(L.afterC[k])};
    if(f.cyHP)c.HPlossCurYrSetoff=n0(L.setHP[k]);
    if(f.cyBus)c.BusLossSetoff=n0(L.setBus[k]);
    if(f.cyOS)c.OthSrcLossNoRaceHorseSetoff=n0(L.setOS[k]);
    const req=["STCG20Per","STCG30Per","STCGAppRate","STCGDTAARate","LTCG12_5Per","LTCGDTAARate"].indexOf(key)>=0;
    if(req||L.inc[k]||L.setHP[k]||L.setBus[k]||L.setOS[k])CY[key]={IncCYLA:c};});
  CY.TotalCurYr={TotHPlossCurYr:n0(L.hpTotal),TotBusLoss:n0(L.busLoss),TotOthSrcLossNoRaceHorse:n0(L.osLoss)};
  CY.TotalLossSetOff={TotHPlossCurYrSetoff:n0(L.totHPset),TotBusLossSetoff:n0(L.totBusset),TotOthSrcLossNoRaceHorseSetoff:n0(L.totOSset)};
  CY.LossRemAftSetOff={BalHPlossCurYrAftSetoff:n0(L.hpRemain),BalBusLossAftSetoff:n0(L.busRemain),BalOthSrcLossNoRaceHorseAftSetoff:n0(L.osRemain)};
  CY.EditAutopoulatedDetail=S.loss.editC?"Y":"N";
  j.ScheduleCYLA=CY;

  /* ===== ScheduleBFLA ===== */
  const BF={};
  LOSS_ROWS.forEach(r=>{const [k,,key,,b]=r;
    const o={IncOfCurYrUndHeadFromCYLA:n0(L.afterC[k]),IncOfCurYrAfterSetOffBFLosses:n0(L.afterB[k])};
    if(b.bf2)o.BFlossPrevYrUndSameHeadSetoff=n0(L.setBF[k]);
    if(b.bfDep){o.BFUnabsorbedDeprSetoff=n0(L.setDep[k]);o.BFAllUs35Cl4Setoff=n0(L.set35[k]);}
    const req=["Salary","STCG20Per","STCG30Per","STCGAppRate","STCGDTAARate","LTCG12_5Per","LTCGDTAARate"].indexOf(key)>=0;
    if(req||L.afterC[k]||L.setBF[k])BF[key]={IncBFLA:o};});
  BF.TotalBFLossSetOff={TotBFLossSetoff:n0(L.totBFset),TotUnabsorbedDeprSetoff:n0(L.totDep),TotAllUs35cl4Setoff:n0(L.tot35)};
  BF.IncomeOfCurrYrAftCYLABFLA=n0(L.gti);
  BF.EditAutopoulatedDetail=S.loss.editB?"Y":"N";
  j.ScheduleBFLA=BF;

  /* ===== ScheduleCFL ===== */
  const anyYear=CFL_YEARS.some(([y,,F])=>{const r=(S.loss.cfl||{})[y]||{};
    return (F.hp&&N(r.hp))||(F.bus&&N(r.bus5a))||(F.spec&&N(r.spec))||(F.specified&&N(r.specified))||(F.st&&N(r.st))||(F.lt&&N(r.lt))||(F.horse&&N(r.horse));});
  if(anyYear||L.cf.total>0||L.bf.hp+L.bf.bus+L.bf.spec+L.bf.specified+L.bf.st+L.bf.lt+L.bf.horse>0){
    const C={};const New=isNew();
    CFL_YEARS.forEach(([y,key,F])=>{const r=(S.loss.cfl||{})[y]||{};
      const b5c=Math.max(0,N(r.bus5a)-(New?N(r.bus5b):0));
      const any=(F.hp&&N(r.hp))||(F.bus&&N(r.bus5a))||(F.spec&&N(r.spec))||(F.specified&&N(r.specified))||(F.st&&N(r.st))||(F.lt&&N(r.lt))||(F.horse&&N(r.horse));
      if(!any)return;
      const d={DateOfFiling:ISO(r.dt)||"2025-07-31"};
      if(F.hp&&N(r.hp))d.TotalHPPTILossCF=n0(r.hp);
      if(F.bus&&N(r.bus5a)){d.BrtFwdBusLoss=n0(r.bus5a);if(New&&N(r.bus5b))d.AdjustAccTax115BACAmt=n0(r.bus5b);d.BusLossOthThanSpecLossCF=n0(b5c);}
      if(F.spec&&N(r.spec))d.LossFrmSpecBusCF=n0(r.spec);
      if(F.specified&&N(r.specified))d.LossFrmSpecifiedBusCF=n0(r.specified);
      if(F.st&&N(r.st))d.TotalSTCGPTILossCF=n0(r.st);
      if(F.lt&&N(r.lt))d.TotalLTCGPTILossCF=n0(r.lt);
      if(F.horse&&N(r.horse))d.OthSrcLossRaceHorseCF=n0(r.horse);
      C[key]={CarryFwdLossDetail:d};});
    const summ=o=>({LossSummaryDetail:{TotalHPPTILossCF:n0(o.hp),BusLossOthThanSpecLossCF:n0(o.bus),LossFrmSpecBusCF:n0(o.spec),
      LossFrmSpecifiedBusCF:n0(o.specified),TotalSTCGPTILossCF:n0(o.st),TotalLTCGPTILossCF:n0(o.lt),OthSrcLossRaceHorseCF:n0(o.horse)}});
    C.TotalOfBFLossesEarlierYrs=summ(L.bf);
    C.AdjTotBFLossInBFLA=summ(L.usedBF);
    C.CurrentAYloss=summ(L.cur);
    C.TotalLossCFSummary=summ(L.cf);
    j.ScheduleCFL=C;
  }
}

/* ---- import --------------------------------------------------------- */
function impLoss(I3){
  const read=[];
  const rg=(o,p)=>{let t=o;for(const k of p.split(".")){if(t==null)return undefined;t=t[k];}return t;};
  const cy=I3.ScheduleCYLA, bf=I3.ScheduleBFLA, cf=I3.ScheduleCFL;
  if(cy){S.loss.editC=(cy.EditAutopoulatedDetail==="Y")?"Y":"";
    if(S.loss.editC){S.loss.cylaOver={};S.loss.busOver={};S.loss.osOver={};
      LOSS_ROWS.forEach(r=>{const k=r[0],b=cy[r[2]]&&cy[r[2]].IncCYLA;if(!b)return;
        if(r[3].cyHP)S.loss.cylaOver[k]={hp:N(b.HPlossCurYrSetoff)};
        if(r[3].cyBus)S.loss.busOver[k]={bus:N(b.BusLossSetoff)};
        if(r[3].cyOS)S.loss.osOver[k]={os:N(b.OthSrcLossNoRaceHorseSetoff)};});}
    read.push("Schedule CYLA");}
  if(bf){S.loss.editB=(bf.EditAutopoulatedDetail==="Y")?"Y":"";
    if(S.loss.editB){S.loss.bflaOver={};
      LOSS_ROWS.forEach(r=>{const k=r[0],b=bf[r[2]]&&bf[r[2]].IncBFLA;if(b&&r[4].bf2)S.loss.bflaOver[k]=N(b.BFlossPrevYrUndSameHeadSetoff);});}
    read.push("Schedule BFLA");}
  if(cf){S.loss.cfl=S.loss.cfl||{};
    CFL_YEARS.forEach(([y,key,F])=>{const d=rg(cf,key+".CarryFwdLossDetail");if(!d)return;
      const row={dt:dmy(d.DateOfFiling)};
      if(F.hp)row.hp=nz(d.TotalHPPTILossCF);
      if(F.bus){row.bus5a=nz(d.BrtFwdBusLoss);row.bus5b=nz(d.AdjustAccTax115BACAmt);}
      if(F.spec)row.spec=nz(d.LossFrmSpecBusCF);
      if(F.specified)row.specified=nz(d.LossFrmSpecifiedBusCF);
      if(F.st)row.st=nz(d.TotalSTCGPTILossCF);
      if(F.lt)row.lt=nz(d.TotalLTCGPTILossCF);
      if(F.horse)row.horse=nz(d.OthSrcLossRaceHorseCF);
      S.loss.cfl[y]=row;});
    read.push("Schedule CFL (losses carried forward)");}
  return read;
}

/* ---- checks --------------------------------------------------------- */
function chkLoss(){
  const out=[];const L=S.C.loss||engLoss();const New=isNew();
  const add=(lvl,t,m)=>out.push({lvl,t,m,sec:"loss"});

  /* CYLA ₹2,00,000 cap on the HP set-off (s.71(3A) / rule: 2xvi ≤ 200000) */
  if(L.totHPset>200000) add("err","House-property set-off cap","The current-year house-property loss set off (₹"+F(L.totHPset)+") exceeds the ₹2,00,000 limit of section 71(3A).");

  /* Regime closures on house-property loss (A572 / A573 / A579) */
  if(New&&L.totHPset>0) add("err","HP loss set off under the new regime","Under section 115BAC(1A) a house-property loss cannot be set off against any other head. Set it to nil or opt out of the new regime.");

  /* 5b (115BAC(1A) adjustment) only in the new regime (rules.json) */
  if(!New){const bad=CFL_YEARS.filter(([y,,F])=>F.bus&&N(((S.loss.cfl||{})[y]||{}).bus5b)>0).map(x=>x[0]);
    if(bad.length) add("warn","115BAC adjustment without the new regime","Schedule CFL 5b (amount adjusted on account of section 115BAC(1A)) is filled for "+bad.join(", ")+" but must be nil unless the new regime is selected.");}

  /* CFL — a carried-forward loss needs the year's date of filing */
  const noDate=CFL_YEARS.filter(([y,,F])=>{const r=(S.loss.cfl||{})[y]||{};
    const has=(F.hp&&N(r.hp))||(F.bus&&N(r.bus5a))||(F.spec&&N(r.spec))||(F.specified&&N(r.specified))||(F.st&&N(r.st))||(F.lt&&N(r.lt))||(F.horse&&N(r.horse));
    return has&&!ISO(r.dt);}).map(x=>x[0]);
  if(noDate.length) add("err","Date of filing required in Schedule CFL","A brought-forward loss carries only if that year's return was filed in time — enter the date of filing for "+noDate.join(", ")+".");

  /* BFLA arithmetic validators */
  (L.val||[]).forEach(m=>add("err","Schedule BFLA",m));

  /* informational */
  if(L.cylaTotal>0) add("ok","Current-year losses set off","₹"+F(L.cylaTotal)+" of this year's losses set against other heads in Schedule CYLA.");
  if(L.totBFset>0) add("ok","Brought-forward losses set off","₹"+F(L.totBFset)+" of earlier-year losses set off in Schedule BFLA.");
  if(L.cf.total>0) add("ok","Carried forward to future years","₹"+F(L.cf.total)+" of losses carried forward through Schedule CFL.");
  return out;
}

/* ---- register ------------------------------------------------------- */
reg({id:"loss", t:"Losses — set-off and carry-forward", ref:"CYLA · BFLA · CFL",
  f:secLoss,
  s:()=>{const L=S.C.loss||{};return L.cf&&L.cf.total?"Carried "+CR(L.cf.total):((L.cylaTotal||0)+(L.bflaTotal||0)?"Set off "+CR((L.cylaTotal||0)+(L.bflaTotal||0)):"CYLA · BFLA · CFL");},
  eng:engLoss, exp:expLoss, imp:impLoss, chk:chkLoss, order:45});
