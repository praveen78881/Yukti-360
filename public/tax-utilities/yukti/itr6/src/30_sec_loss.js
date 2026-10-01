/* =====================================================================
   ITR-6 · Section "loss" — Losses: set-off and carry-forward + Sch UD
   Schedules CYLA · BFLA · CFL and Schedule UD (unabsorbed depreciation /
   s.35(4) allowance), built strictly from the ITR-6 books
   books/ITR-6/CYLA_BFLA.md, books/ITR-6/CFL.md and
   books/ITR-6/Unabsorbed_Depreciation.md — never ITR-3's numbers.
   Structural template: forms/ITR-3/src/70_sec_loss.js.

   The company return differs from ITR-2/3:
   - NO salary head; CYLA/BFLA run FOURTEEN live head rows (the three
     pre-23-Jul-2024 CG rate slots 15%/10%/20% are hidden, not built).
   - FOUR business heads are live (business, life-insurance u/s 115B,
     speculative, specified) and CYLA carries a live business-loss column.
   - BFLA carries TWO extra brought-forward columns beyond the loss:
     depreciation (col 3) and the s.35(4) allowance (col 4), both fed from
     Schedule UD and both settable against OTHER-SOURCES income too.
   - CFL runs SIXTEEN assessment-year rows (specified-business s.35AD and
     115B life-insurance losses carry without the 8-year cap; speculative
     and race-horse carry four years).
   - HP-loss set-off capped at Rs 2,00,000 (s.71(3A) / rule A502).

   compute order 45 (after every income head, before the tax roll-up).
   ===================================================================== */

/* ---- state ---------------------------------------------------------- */
/* S.loss.cfl  — keyed by assessment year "YYYY-YY"; each holds the date of
     filing + the historic per-column loss figures the filer types.
   S.loss.ud   — the repeatable ScheduleUD[] ledger; first row is the
     current AY 2026-27 (the sheet's gating first row).
   editC / editB — the CYLA / BFLA "edit auto-populated details?" flags;
     the *Over objects hold the manual overrides behind those switches.   */
S.loss = S.loss || { cfl:{}, ud:[{ay:"2026-27"}], editC:"", editB:"",
                     cylaOver:{}, busOver:{}, osOver:{}, bflaOver:{} };
if(!Array.isArray(S.loss.ud)||!S.loss.ud.length) S.loss.ud=[{ay:"2026-27"}];

/* Does the company opt for taxation u/s 115BAA?  Only then are the CFL 5b
   business-loss adjustment and the Schedule UD 3a adjustment live (rules
   A564 / A569).  Read defensively from whatever the tax/gen section
   publishes; default false so nothing is falsely gated open. */
function loss115BAA(){
  const t=(S.C&&S.C.tax)||{};
  if("is115BAA" in t) return !!t.is115BAA;
  if("s115BAA" in t)  return !!t.s115BAA;
  const g=(S.gen&&S.gen.taxRegime)||(S.tax&&(S.tax.regime||S.tax.optSec))||"";
  return /115BAA|(^|[^B])BAA/.test(String(g));
}

/* The FOURTEEN live income-head rows, in the book's row order
   (CYLA ii..xv / BFLA i..xiv).  Each entry:
     [key, label, cylaKey, bflaKey, cyFlags, bfFlags]
   cyFlags — which current-year set-off column exists on this row
     {cyHP, cyBus, cyOS}  (CYLA_BFLA.md §3 "which loss may go where")
   bfFlags — {bf2, bfDep}
     bf2   : which brought-forward loss column feeds this row (0 = none),
             also the head this row's BF loss is matched against
     bfDep : whether the BF depreciation / 35(4) columns are live here
             (true on EVERY live row — they may set off against any head)
   Note: OS-normal uses different schema keys on the two matrices
     (CYLA OthSrcExclRaceHorseLottery vs BFLA OthSrcExclRaceHorse).      */
const LOSS_ROWS=[
 ["hp","House property","HP","HP",{cyHP:0,cyBus:1,cyOS:1},{bf2:"hp",bfDep:1}],
 ["bus","Income from Business (excluding life-insurance u/s 115B, speculative and specified business)","BusProfExclSpecProf","BusProfExclSpecProf",{cyHP:1,cyBus:0,cyOS:1},{bf2:"bus",bfDep:1}],
 ["b115","Profit and gains from life insurance business u/s 115B","ProfGainUs115B","ProfGainUs115B",{cyHP:1,cyBus:0,cyOS:1},{bf2:"b115",bfDep:1}],
 ["spec","Speculative income","SpeculationIncome","SpeculationIncome",{cyHP:1,cyBus:0,cyOS:1},{bf2:"spec",bfDep:1}],
 ["specified","Specified business income","SpecifiedBusIncome","SpecifiedBusIncome",{cyHP:1,cyBus:0,cyOS:1},{bf2:"specified",bfDep:1}],
 ["st20","Short-term capital gain taxable @ 20%","STCG20Per","STCG20Per",{cyHP:1,cyBus:1,cyOS:1},{bf2:"st",bfDep:1}],
 ["st30","Short-term capital gain taxable @ 30%","STCG30Per","STCG30Per",{cyHP:1,cyBus:1,cyOS:1},{bf2:"st",bfDep:1}],
 ["stApp","Short-term capital gain taxable at applicable rates","STCGAppRate","STCGAppRate",{cyHP:1,cyBus:1,cyOS:1},{bf2:"st",bfDep:1}],
 ["stDTAA","Short-term capital gain taxable at special rates as per DTAA","STCGDTAARate","STCGDTAARate",{cyHP:1,cyBus:1,cyOS:1},{bf2:"st",bfDep:1}],
 ["lt125","Long-term capital gain taxable @ 12.5%","LTCG12_5Per","LTCG12_5Per",{cyHP:1,cyBus:1,cyOS:1},{bf2:"lt",bfDep:1}],
 ["ltDTAA","Long-term capital gain taxable at special rates as per DTAA","LTCGDTAARate","LTCGDTAARate",{cyHP:1,cyBus:1,cyOS:1},{bf2:"lt",bfDep:1}],
 ["os","Net income from other sources chargeable at normal applicable rates","OthSrcExclRaceHorseLottery","OthSrcExclRaceHorse",{cyHP:1,cyBus:1,cyOS:0},{bf2:0,bfDep:1}],
 ["horse","Profit from owning and maintaining race horses","ProfitFrmRaceHorse","ProfitFrmRaceHorse",{cyHP:1,cyBus:1,cyOS:1},{bf2:"horse",bfDep:1}],
 ["osDTAA","Income from other sources taxable at special rates as per DTAA","IncOSDTAA","IncOSDTAA",{cyHP:1,cyBus:1,cyOS:1},{bf2:0,bfDep:1}]];
const ROW_KEYS=LOSS_ROWS.map(r=>r[0]);

/* CYLA set-off walk orders (heads that can absorb each current-year loss,
   in the utility's running-remainder order; A525: the OS loss goes first
   against race horses, then OS-DTAA, then the rest). */
const CY_ORDER_HP =["bus","b115","spec","specified","os","horse","st30","stApp","st20","stDTAA","lt125","ltDTAA","osDTAA"];
const CY_ORDER_BUS=["hp","os","horse","osDTAA","st30","stApp","st20","stDTAA","lt125","ltDTAA"];
const CY_ORDER_OS =["horse","osDTAA","hp","bus","b115","spec","specified","st30","stApp","st20","stDTAA","lt125","ltDTAA"];
/* BFLA capital set-off: a LT loss on the two long slots only; a ST loss on
   any capital slot (short first, then long). */
const BF_ORDER_LT=["lt125","ltDTAA"];
const BF_ORDER_ST=["st30","stApp","st20","stDTAA","lt125","ltDTAA"];
/* BF depreciation / 35(4) pools distribute across every head, row order. */
const DEP_ORDER=ROW_KEYS.slice();

/* Schedule CFL — the fixed SIXTEEN assessment-year rows.  Each entry:
     [AY, schemaKey, windowFlags]
   The schema keys are the department's legacy "LossCF…FromAY" names
   (CFL.md §3); they do NOT correspond to the year — map by row position.
   Window flags (CFL.md §3):
     specified — indefinite (every row); b115/hp/bus/st/lt — 8 yrs (2018-19+);
     spec/horse — 4 yrs (2022-23+).                                        */
const F_SPEC ={specified:1};
const F_8YR  ={hp:1,bus:1,specified:1,b115:1,st:1,lt:1};
const F_FULL ={hp:1,bus:1,spec:1,specified:1,b115:1,st:1,lt:1,horse:1};
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
/* oldest year in each carry window — its unrelieved figure lapses;
   specified business never lapses. */
const CFL_OLDEST_8="2018-19", CFL_OLDEST_4="2022-23";
/* per-year VBA minimum date of filing (CFL.md §3): 1 April of the AY. */
const CFL_MINDATE={};CFL_YEARS.forEach(([y])=>{CFL_MINDATE[y]="01/04/"+y.slice(0,4);});

/* ---- engine --------------------------------------------------------- */
/* Every cross-head figure is read guarded (never throw). Consumed S.C
   contract each income section publishes (guarded, default 0):
     hp.income                         house-property head income (signed)
     bp.busExcl [NetPLBusOthThanSpec7A7B7C] / bp.income   business excl spec
     bp.b115    [Table-E (iv) ProfGainUs115B]             115B life-insurance
     bp.spec    [AdjustedPLFrmSpecuBus]                   speculative (signed)
     bp.specified [ProfitLossSpecifiedBusFinal]           specified (signed)
     bp.busLossCY [Table-E 2vi LossRemainSetOffOnBus]     CYLA business loss H6
     bp.inc12iii [TotDeprAllowITAct]                      UD depreciation cap
     cg.after.{st20,st30,stApp,stDTAA,lt125,ltDTAA}       gains after CG set-off
     cg.cflSTCL / cg.cflLTCL           Table-E unabsorbed STCL / LTCL
     os.netNormal [BalanceNoRaceHorse]                    net OS at normal rates
     os.raceHorse [BalanceOwnRaceHorse]                   race-horse balance
     os.dtaaTotal [os DTAA amount]                        OS at special DTAA rates
   Each falls back to .income where a finer key is absent.                */
function engLoss(){
  const g=(o)=>o||{};
  const hp=g(S.C.hp), bp=g(S.C.bp), cg=g(S.C.cg), os=g(S.C.os);
  const cgAfter=g(cg.after);
  const busExcl    = ("busExcl"   in bp)?N(bp.busExcl)   : N(bp.income);
  const b115PL     = ("b115"      in bp)?N(bp.b115)      : 0;
  const specPL     = ("spec"      in bp)?N(bp.spec)      : 0;
  const specifiedPL= ("specified" in bp)?N(bp.specified) : 0;
  const osNorm     = ("netNormal" in os)?N(os.netNormal) : N(os.income);
  const osHorseBal = ("raceHorse" in os)?N(os.raceHorse) : 0;
  const osDtaa     = N(os.dtaaTotal);
  const baa=loss115BAA();

  /* ---- CYLA row i · the three incoming current-year losses ---------- */
  const hpTotal = Math.max(0,-N(hp.income));                            /* G6 = ABS(MIN(HP total,0)) */
  const hpCapped= Math.min(hpTotal,200000);                            /* set-off limited to 2,00,000 (A502) */
  const hpExcess= Math.max(0,hpTotal-200000);                          /* over 2,00,000 -> straight to CFL */
  const busLoss = ("busLossCY" in bp)?Math.max(0,N(bp.busLossCY)):Math.max(0,-R(busExcl)); /* H6 = ABS(MAX(LossRemainSetOffOnBus,0)) */
  const osLoss  = Math.max(0,-osNorm);                                  /* I6 = ABS(MIN(BalanceNoRaceHorse,0)) */

  /* ---- CYLA col 1 · income of the current year (positive only) ------ */
  const inc={
    hp:Math.max(0,N(hp.income)), bus:Math.max(0,busExcl), b115:Math.max(0,b115PL),
    spec:Math.max(0,specPL), specified:Math.max(0,specifiedPL),
    st20:Math.max(0,N(cgAfter.st20)), st30:Math.max(0,N(cgAfter.st30)),
    stApp:Math.max(0,N(cgAfter.stApp)), stDTAA:Math.max(0,N(cgAfter.stDTAA)),
    lt125:Math.max(0,N(cgAfter.lt125)), ltDTAA:Math.max(0,N(cgAfter.ltDTAA)),
    os:Math.max(0,osNorm), horse:Math.max(0,osHorseBal), osDTAA:Math.max(0,osDtaa)};

  /* ---- CYLA cols 2/3/4 · set-off (greedy, respecting 2+3+4 <= 1) ---- */
  const setHP={},setBus={},setOS={},remInc={},flag={};
  LOSS_ROWS.forEach(r=>{setHP[r[0]]=0;setBus[r[0]]=0;setOS[r[0]]=0;remInc[r[0]]=inc[r[0]];flag[r[0]]=r[4];});
  if(S.loss.editC){                                                     /* manual override behind I29 switch */
    LOSS_ROWS.forEach(r=>{const k=r[0],f=r[4];
      if(f.cyHP){setHP[k]=Math.min(N((S.loss.cylaOver[k]||{}).hp),remInc[k]);remInc[k]-=setHP[k];}
      if(f.cyBus){setBus[k]=Math.min(N((S.loss.busOver[k]||{}).bus),remInc[k]);remInc[k]-=setBus[k];}
      if(f.cyOS){setOS[k]=Math.min(N((S.loss.osOver[k]||{}).os),remInc[k]);remInc[k]-=setOS[k];}});
  }else{
    let rem=hpCapped;CY_ORDER_HP.forEach(k=>{if(rem<=0||!flag[k].cyHP)return;const t=Math.max(0,Math.min(rem,remInc[k]));setHP[k]=t;remInc[k]-=t;rem-=t;});
    rem=busLoss;   CY_ORDER_BUS.forEach(k=>{if(rem<=0||!flag[k].cyBus)return;const t=Math.max(0,Math.min(rem,remInc[k]));setBus[k]=t;remInc[k]-=t;rem-=t;});
    rem=osLoss;    CY_ORDER_OS.forEach(k=>{if(rem<=0||!flag[k].cyOS)return;const t=Math.max(0,Math.min(rem,remInc[k]));setOS[k]=t;remInc[k]-=t;rem-=t;});
  }
  const sum=o=>ROW_KEYS.reduce((a,k)=>a+N(o[k]),0);
  const totHPset =Math.max(0,Math.min(200000,sum(setHP)));              /* G26, capped at 2,00,000 (s.71(3A)) */
  const totBusset=Math.max(0,Math.min(sum(setBus),busLoss));           /* H26 */
  const totOSset =Math.max(0,Math.min(sum(setOS),osLoss));             /* I26 */
  const hpRemain = totHPset<200000?Math.max(0,(hpCapped-totHPset)+hpExcess):hpExcess; /* G27 -> CFL */
  const busRemain= Math.max(0,busLoss-totBusset);                      /* H27 -> CFL */
  const osRemain = Math.max(0,osLoss-totOSset);                        /* I27 — normal OS loss lapses */
  const afterC={};LOSS_ROWS.forEach(r=>{const k=r[0];afterC[k]=R(inc[k]-setHP[k]-setBus[k]-setOS[k]);}); /* col 5 = 1-2-3-4 */

  /* ---- Schedule UD · the depreciation / 35(4) ledger --------------- */
  const udRows=(S.loss.ud||[]);
  const ud={rows:[]};let uBF=0,uAdj=0,uSO=0,uBal=0,uBFa=0,uSOa=0,uBala=0;
  const firstHasData=(()=>{const r=udRows[0]||{};return N(r.bfud)||N(r.adj115)||N(r.soc)||N(r.bfallow)||N(r.allowsoc);})();
  udRows.forEach((r,i)=>{
    const bf=N(r.bfud), adj=baa?N(r.adj115):0, so=N(r.soc), bal=Math.max(0,bf-adj-so); /* (5)=(3)-(3a)-(4) A571 */
    const bfa=N(r.bfallow), soa=N(r.allowsoc), bala=Math.max(0,bfa-soa);               /* (8)=(6)-(7) A572 */
    ud.rows.push({ay:st0(r.ay),bf:R(bf),adj:R(adj),so:R(so),bal:R(bal),bfa:R(bfa),soa:R(soa),bala:R(bala)});
    /* first-row gating: if the first row is empty, later rows are ignored (sheet D4 note) */
    if(firstHasData||i===0){uBF+=bf;uAdj+=adj;uSO+=so;uBal+=bal;uBFa+=bfa;uSOa+=soa;uBala+=bala;}
  });
  if(!firstHasData){uBF=uAdj=uSO=uBal=uBFa=uSOa=uBala=0;}
  ud.totBF=R(uBF);ud.totAdj=R(uAdj);ud.totSO=R(uSO);ud.totBal=R(uBal);
  ud.totBFa=R(uBFa);ud.totSOa=R(uSOa);ud.totBala=R(uBala);
  /* current-AY balances c/f = the first (2026-27) row's balance columns */
  ud.curDep  =R((ud.rows[0]||{}).bal);
  ud.curAllow=R((ud.rows[0]||{}).bala);
  const poolDep=ud.totSO, poolAllow=ud.totSOa;                          /* BFLA col-3 / col-4 pools (H34/I34) */

  /* ---- CFL · brought-forward figures from the year-rows ------------- */
  const cflRow=y=>(S.loss.cfl||{})[y]||{};
  const b5c=r=>Math.max(0,N(r.bus5a)-(baa?N(r.bus5b):0));               /* 5c = MAX(0, 5a - 5b); 5b only under 115BAA */
  const bf={hp:0,bus:0,b115:0,spec:0,specified:0,st:0,lt:0,horse:0};
  CFL_YEARS.forEach(([y,,F])=>{const r=cflRow(y);
    if(F.hp)bf.hp+=N(r.hp); if(F.bus)bf.bus+=b5c(r); if(F.b115)bf.b115+=N(r.b115);
    if(F.spec)bf.spec+=N(r.spec); if(F.specified)bf.specified+=N(r.specified);
    if(F.st)bf.st+=N(r.st); if(F.lt)bf.lt+=N(r.lt); if(F.horse)bf.horse+=N(r.horse);});

  /* ---- BFLA col 2 · brought-forward loss set off (head-matched) ----- */
  const setBF={};LOSS_ROWS.forEach(r=>setBF[r[0]]=0);
  if(S.loss.editB){
    LOSS_ROWS.forEach(r=>{const k=r[0],c2=r[5].bf2;if(c2)setBF[k]=Math.max(0,Math.min(N(S.loss.bflaOver[k]),afterC[k]));});
  }else{
    setBF.hp       =Math.min(bf.hp,afterC.hp);
    setBF.bus      =Math.min(bf.bus,afterC.bus);
    setBF.b115     =Math.min(bf.b115,afterC.b115);
    setBF.spec     =Math.min(bf.spec,afterC.spec);
    setBF.specified=Math.min(bf.specified,afterC.specified);
    let remLT=bf.lt;BF_ORDER_LT.forEach(k=>{if(remLT<=0)return;const t=Math.max(0,Math.min(remLT,afterC[k]-setBF[k]));setBF[k]+=t;remLT-=t;}); /* LTCL first, long slots only */
    let remST=bf.st;BF_ORDER_ST.forEach(k=>{if(remST<=0)return;const t=Math.max(0,Math.min(remST,afterC[k]-setBF[k]));setBF[k]+=t;remST-=t;}); /* STCL against any CG slot */
    setBF.horse    =Math.min(bf.horse,afterC.horse);
  }
  /* how much of each brought-forward column BFLA actually used (for CFL xviii) */
  const usedBF={hp:setBF.hp,bus:setBF.bus,b115:setBF.b115,spec:setBF.spec,specified:setBF.specified,horse:setBF.horse,st:0,lt:0};
  {const ltUsed=Math.min(bf.lt,BF_ORDER_LT.reduce((a,k)=>a+setBF[k],0));
   const stUsed=Math.min(bf.st,BF_ORDER_ST.reduce((a,k)=>a+setBF[k],0)-ltUsed);
   usedBF.lt=Math.max(0,ltUsed);usedBF.st=Math.max(0,stUsed);}

  /* ---- BFLA cols 3/4 · BF depreciation & 35(4) from Schedule UD ----- */
  /* Distribute the two UD pools across every head's income remaining after
     the BF-loss set-off (they may set off against any head, OS included).  */
  const setDep={},set35={};LOSS_ROWS.forEach(r=>{setDep[r[0]]=0;set35[r[0]]=0;});
  let remDep=poolDep;DEP_ORDER.forEach(k=>{if(remDep<=0)return;const avail=afterC[k]-setBF[k]-setDep[k];const t=Math.max(0,Math.min(remDep,avail));setDep[k]=t;remDep-=t;});
  let rem35=poolAllow;DEP_ORDER.forEach(k=>{if(rem35<=0)return;const avail=afterC[k]-setBF[k]-setDep[k]-set35[k];const t=Math.max(0,Math.min(rem35,avail));set35[k]=t;rem35-=t;});

  const afterB={};let gti=0;
  LOSS_ROWS.forEach(r=>{const k=r[0];afterB[k]=R(Math.max(0,afterC[k]-setBF[k]-setDep[k]-set35[k]));gti+=afterB[k];}); /* J = MAX(0,F-G-H-I) */
  const totBFset=sum(setBF), totDep=sum(setDep), tot35=sum(set35);

  /* ---- CFL xix · current-year losses to carry forward (assembled) --- */
  const cur={
    hp:hpRemain,                                                        /* A560 = CYLA 2xvii */
    bus:busRemain,                                                      /* BP Table-E business loss remaining */
    b115:Math.max(0,-R(b115PL)),                                        /* A562 = BP 4b (115B loss) */
    spec:Math.max(0,-R(specPL)),                                        /* A556 = BP speculative loss */
    specified:Math.max(0,-R(specifiedPL)),                             /* A557 = BP specified-business loss */
    st:Math.max(0,R(("cflSTCL" in cg)?N(cg.cflSTCL):0)),               /* A558 = CG Table-E unabsorbed STCL */
    lt:Math.max(0,R(("cflLTCL" in cg)?N(cg.cflLTCL):0)),               /* A559 = CG Table-E unabsorbed LTCL */
    horse:Math.max(0,-R(osHorseBal))};                                 /* A561 = OS 8e (race-horse loss) -> row xix (NOT xvii) */

  /* ---- CFL xx-xxii · carry forward, with the window lapse rule ------ */
  const old8=cflRow(CFL_OLDEST_8), old4=cflRow(CFL_OLDEST_4);
  const oldest={hp:N(old8.hp),bus:b5c(old8),b115:N(old8.b115),st:N(old8.st),lt:N(old8.lt),spec:N(old4.spec),horse:N(old4.horse)};
  const cf={};
  ["hp","bus","b115","st","lt"].forEach(k=>{cf[k]=Math.max(0,bf[k]-Math.max(usedBF[k],oldest[k])+cur[k]);}); /* 8-yr window lapse */
  ["spec","horse"].forEach(k=>{cf[k]=Math.max(0,bf[k]-Math.max(usedBF[k],oldest[k])+cur[k]);});             /* 4-yr window lapse */
  cf.specified=Math.max(0,bf.specified-usedBF.specified+cur.specified);                                     /* no lapse — indefinite */
  const lapsed={};["hp","bus","b115","st","lt","spec","horse"].forEach(k=>{lapsed[k]=Math.max(0,oldest[k]-usedBF[k]);});
  cf.total=cf.hp+cf.bus+cf.b115+cf.spec+cf.specified+cf.st+cf.lt+cf.horse;
  const curTotal=cur.hp+cur.bus+cur.b115+cur.spec+cur.specified+cur.st+cur.lt+cur.horse;                    /* Part B-TI item 17 (Sch CFL xxi) */

  /* ---- validators (CFL.md / rules.json) ---------------------------- */
  const val=[];
  const stSetTotal=BF_ORDER_ST.reduce((a,k)=>a+setBF[k],0), ltSetTotal=BF_ORDER_LT.reduce((a,k)=>a+setBF[k],0);
  if(stSetTotal>bf.st+bf.lt+1) val.push("Losses set off against capital gains cannot exceed the capital loss brought forward in Schedule CFL.");
  if(ltSetTotal>bf.lt+1)       val.push("Losses set off against long-term gains cannot exceed the long-term loss brought forward in Schedule CFL.");
  if(totDep+1<poolDep)         val.push("Brought-forward depreciation set off (Rs "+F(totDep)+") is less than the amount in Schedule UD (Rs "+F(poolDep)+") — reduce the depreciation set off in Schedule UD.");
  if(tot35+1<poolAllow)        val.push("Brought-forward s.35(4) allowance set off (Rs "+F(tot35)+") is less than the amount in Schedule UD (Rs "+F(poolAllow)+") — reduce the allowance set off in Schedule UD.");

  /* ---- this head's contribution to the footer's gross total income --- */
  const otherHeads=N(hp.income)+N(bp.income)+N(cg.income)+N(os.income);
  const income=R(gti)-R(otherHeads);

  S.C.loss={
    inc,hpTotal:R(hpTotal),hpCapped:R(hpCapped),hpExcess:R(hpExcess),busLoss:R(busLoss),osLoss:R(osLoss),
    setHP,setBus,setOS,totHPset:R(totHPset),totBusset:R(totBusset),totOSset:R(totOSset),
    hpRemain:R(hpRemain),busRemain:R(busRemain),osRemain:R(osRemain),afterC,
    bf,setBF,setDep,set35,usedBF,totBFset:R(totBFset),totDep:R(totDep),tot35:R(tot35),afterB,
    cur,cf,oldest,lapsed,val,income:R(income),ud,
    /* published scalars for the tax roll-up (Part B-TI) and cross-checks */
    cylaTotal:R(totHPset+totBusset+totOSset),                          /* item 6 */
    bflaTotal:R(totBFset),                                             /* BF-loss set-off only */
    bfSetoffTotal:R(totBFset+totDep+tot35),                           /* item 8 = BFLA 2xv+3xv+4xv */
    gti:R(gti),                                                        /* item 9 (normal-head part) / BFLA J53 */
    curTotal:R(curTotal),                                             /* item 17 (Sch CFL xxi) */
    udPoolDep:R(poolDep),udPoolAllow:R(poolAllow)};
  return S.C.loss;
}

/* ---- renderer ------------------------------------------------------- */
function secLoss(){
  const L=S.C.loss||engLoss();let h="";
  const closed='style="background:var(--closed)"';
  const baa=loss115BAA();

  /* ===== Schedule CYLA ===== */
  h+='<div class="cgband">Schedule CYLA — set-off of the current year\'s losses</div>';
  h+=note("This year's house-property loss, business loss and normal other-sources loss are set against the other heads in the order the utility uses. "+
    "A house-property loss is set against the other heads only up to Rs 2,00,000 (section 71(3A)); any excess goes to Schedule CFL. "+
    "A normal other-sources loss not set off here lapses.");
  const ed=!!S.loss.editC;
  h+='<div class="full"><table class="gt" style="min-width:1120px"><thead><tr><th class="l" style="width:34px">Sl.</th>'+
     '<th class="l" style="min-width:340px">Head / source of income</th><th style="width:120px">Income of current year (1)</th>'+
     '<th style="width:130px">HP loss set off (2)</th><th style="width:150px">Business loss set off (3)</th>'+
     '<th style="width:150px">OS loss set off (4)</th><th style="width:130px">Remaining after set-off (5)</th></tr></thead><tbody>';
  h+='<tr><td class="l">i</td><td class="l"><b>Loss to be set off (from the negative computed figure)</b></td><td></td>'+
     '<td class="num">'+cell(-L.hpTotal)+(L.hpExcess?'<span class="dt">+ '+F(L.hpExcess)+' over Rs 2L &rarr; CFL</span>':'')+'</td>'+
     '<td class="num">'+cell(-L.busLoss)+'</td><td class="num">'+cell(-L.osLoss)+'</td><td></td></tr>';
  const slC=["ii","iii","iv","v","vi","vii","viii","ix","x","xi","xii","xiii","xiv","xv"];
  LOSS_ROWS.forEach((r,i)=>{const k=r[0],label=r[1],f=r[4];
    h+='<tr><td class="l">'+slC[i]+'</td><td class="l">'+esc(label)+'</td><td class="num">'+cell(L.inc[k])+'</td>'+
       '<td class="num"'+(f.cyHP?'':' '+closed)+'>'+(f.cyHP?(ed?inp("loss.cylaOver."+k+".hp",{n:1}):cell(L.setHP[k])):'')+'</td>'+
       '<td class="num"'+(f.cyBus?'':' '+closed)+'>'+(f.cyBus?(ed?inp("loss.busOver."+k+".bus",{n:1}):cell(L.setBus[k])):'')+'</td>'+
       '<td class="num"'+(f.cyOS?'':' '+closed)+'>'+(f.cyOS?(ed?inp("loss.osOver."+k+".os",{n:1}):cell(L.setOS[k])):'')+'</td>'+
       '<td class="num">'+cell(L.afterC[k])+'</td></tr>';});
  h+='</tbody><tfoot>'+
     '<tr><td class="l">xvi</td><td class="l">Total loss set off</td><td></td><td>'+F(L.totHPset)+'</td><td>'+F(L.totBusset)+'</td><td>'+F(L.totOSset)+'</td><td></td></tr>'+
     '<tr><td class="l">xvii</td><td class="l">Loss remaining after set-off (i &minus; xvi)</td><td></td><td>'+F(L.hpRemain)+'<span class="dt">&rarr; CFL</span></td><td>'+F(L.busRemain)+'<span class="dt">&rarr; CFL</span></td><td>'+F(L.osRemain)+'<span class="dt">lapses</span></td><td></td></tr>'+
     '</tfoot></table></div>';
  h+=row("Do you want to edit the details auto-populated in the table above?",sel("loss.editC",[["","No"],["Y","Yes"]],{blank:false}),{ref:"CYLA"});

  /* ===== Schedule BFLA ===== */
  h+='<div class="cgband">Schedule BFLA — set-off of brought-forward losses of earlier years</div>';
  h+=note("Losses brought forward from Schedule CFL, set against what remains after CYLA. HP loss against HP income only; business against business, life-insurance u/s 115B against 115B, speculative against speculative, specified against specified; a short-term capital loss against any capital gain; a long-term loss against long-term gains only (and first); a race-horse loss against race-horse income only. Brought-forward depreciation and the section 35(4) allowance come from Schedule UD and may be set off against any head — other sources included. Nothing is brought forward against the two other-sources rows as a loss.");
  const edB=!!S.loss.editB;
  h+='<div class="full"><table class="gt" style="min-width:1160px"><thead><tr><th class="l" style="width:34px">Sl.</th>'+
     '<th class="l" style="min-width:340px">Head / source of income</th><th style="width:130px">Income after CYLA (1)</th>'+
     '<th style="width:130px">B/f loss set off (2)</th><th style="width:130px">B/f depreciation (3)</th>'+
     '<th style="width:150px">B/f 35(4) allowance (4)</th><th style="width:130px">Remaining after set-off (5)</th></tr></thead><tbody>';
  const slB=["i","ii","iii","iv","v","vi","vii","viii","ix","x","xi","xii","xiii","xiv"];
  LOSS_ROWS.forEach((r,i)=>{const k=r[0],label=r[1],b=r[5];
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

  /* ===== Schedule UD ===== */
  h+='<div class="cgband">Schedule UD — unabsorbed depreciation and allowance under section 35(4)</div>';
  h+=note("One row per assessment year, no time limit. Enter the brought-forward amounts and the amount set off against this year's income; the balance carried forward is computed. The depreciation and allowance set off here feed Schedule BFLA columns 3 and 4. <b>If no entry is made in the first row (2026-27) the later rows are not considered.</b>"+
    (baa?" Column 3a (adjustment on opting for section 115BAA) is live because the company has opted for 115BAA.":" Column 3a (section 115BAA adjustment) is nil — the company has not opted for section 115BAA."));
  h+='<div class="full"><table class="gt" style="min-width:1180px"><thead><tr>'+
     '<th class="l" style="width:34px">Sl.</th><th class="l" style="width:120px">Assessment year (2)</th>'+
     '<th style="width:130px">B/f unabsorbed depreciation (3)</th><th style="width:140px">115BAA adjustment (3a)</th>'+
     '<th style="width:130px">Depreciation set off (4)</th><th style="width:130px">Balance c/f (5)</th>'+
     '<th style="width:130px">B/f 35(4) allowance (6)</th><th style="width:130px">Allowance set off (7)</th>'+
     '<th style="width:130px">Balance c/f (8)</th><th class="x"></th></tr></thead><tbody>';
  const U=L.ud||{rows:[]};
  (S.loss.ud||[]).forEach((r,i)=>{const p="loss.ud."+i+".";const cr=U.rows[i]||{};
    h+='<tr><td class="l">'+(i+1)+'</td>'+
       '<td class="l">'+(i===0?'2026-27':inp(p+"ay",{ph:"2018-19",max:7}))+'</td>'+
       '<td>'+inp(p+"bfud",{n:1})+'</td>'+
       '<td'+(baa?'':' '+closed)+'>'+(baa?inp(p+"adj115",{n:1}):cell(0))+'</td>'+
       '<td>'+inp(p+"soc",{n:1})+'</td>'+
       '<td class="num">'+cell(cr.bal)+'</td>'+
       '<td>'+inp(p+"bfallow",{n:1})+'</td>'+
       '<td>'+inp(p+"allowsoc",{n:1})+'</td>'+
       '<td class="num">'+cell(cr.bala)+'</td>'+
       '<td class="x">'+(i===0?'':'<button data-del="loss.ud.'+i+'" title="Remove">'+TRASH+'</button>')+'</td></tr>';});
  h+='</tbody><tfoot><tr><td class="l"></td><td class="l">Total</td>'+
     '<td>'+F(U.totBF)+'</td><td>'+F(U.totAdj)+'</td><td>'+F(U.totSO)+'</td><td>'+F(U.totBal)+'</td>'+
     '<td>'+F(U.totBFa)+'</td><td>'+F(U.totSOa)+'</td><td>'+F(U.totBala)+'</td><td></td></tr></tfoot></table></div>';
  h+='<button class="add" data-add="loss.ud">Add an earlier year</button>';

  /* ===== Schedule CFL ===== */
  h+='<div class="cgband">Schedule CFL — losses to be carried forward to future years</div>';
  h+=note("One row per assessment year (sixteen years). The date of filing ("+DF+") is required on any year that carries a loss — a loss carries only if that year's return was filed within the section 139(1) due date, on or after 1 April of that year. The specified-business loss u/s 35AD carries indefinitely (live on every row); house-property, business, life-insurance u/s 115B and capital losses carry eight years (from 2018-19); speculative and race-horse losses carry four years (from 2022-23). Column 5b (adjustment on opting for section 115BAA) is live only when the company has opted for 115BAA.");
  h+='<div class="full"><table class="gt" style="min-width:1720px"><thead><tr><th class="l" style="width:30px">Sl.</th>'+
     '<th class="l" style="width:78px">AY</th><th class="l" style="width:118px">Date of filing</th>'+
     '<th style="width:110px">HP (4)</th><th style="width:110px">Business 5a</th><th style="width:120px">115BAA adj 5b</th><th style="width:120px">Business 5c</th>'+
     '<th style="width:110px">Speculative (6)</th><th style="width:110px">Specified (7)</th><th style="width:110px">115B (8)</th>'+
     '<th style="width:110px">STCL (9)</th><th style="width:110px">LTCL (10)</th><th style="width:120px">Race horses (11)</th></tr></thead><tbody>';
  const slR=["i","ii","iii","iv","v","vi","vii","viii","ix","x","xi","xii","xiii","xiv","xv","xvi"];
  const b5cView=r=>Math.max(0,N(r.bus5a)-(baa?N(r.bus5b):0));
  CFL_YEARS.forEach(([y,,F],i)=>{const p="loss.cfl."+y+".";const r=(S.loss.cfl||{})[y]||{};
    const dead=()=>'<td class="num" '+closed+'></td>';
    h+='<tr><td class="l">'+slR[i]+'</td><td class="l">'+y+'</td><td>'+inp(p+"dt",{ph:DF,max:10})+'</td>'+
       (F.hp?'<td>'+inp(p+"hp",{n:1})+'</td>':dead())+
       (F.bus?'<td>'+inp(p+"bus5a",{n:1})+'</td>':dead())+
       (F.bus?(baa?'<td>'+inp(p+"bus5b",{n:1})+'</td>':'<td class="num" '+closed+'>'+cell(0)+'</td>'):dead())+
       (F.bus?'<td class="num">'+cell(b5cView(r))+'</td>':dead())+
       (F.spec?'<td>'+inp(p+"spec",{n:1})+'</td>':dead())+
       (F.specified?'<td>'+inp(p+"specified",{n:1})+'</td>':dead())+
       (F.b115?'<td>'+inp(p+"b115",{n:1})+'</td>':dead())+
       (F.st?'<td>'+inp(p+"st",{n:1})+'</td>':dead())+
       (F.lt?'<td>'+inp(p+"lt",{n:1})+'</td>':dead())+
       (F.horse?'<td>'+inp(p+"horse",{n:1})+'</td>':dead())+'</tr>';});
  const B=L.bf,Uu=L.usedBF,C=L.cur,X=L.cf;
  const frow=(sl,lbl,o)=>'<tr><td class="l">'+sl+'</td><td class="l" colspan="2">'+lbl+'</td>'+
     '<td>'+F(o.hp)+'</td><td></td><td></td><td>'+F(o.bus)+'</td><td>'+F(o.spec)+'</td><td>'+F(o.specified)+'</td><td>'+F(o.b115)+'</td><td>'+F(o.st)+'</td><td>'+F(o.lt)+'</td><td>'+F(o.horse)+'</td></tr>';
  h+='</tbody><tfoot>'+
     frow("xvii","Total of earlier-year losses brought forward",B)+
     frow("xviii","Adjustment of the above in Schedule BFLA",Uu)+
     frow("xix","2026-27 — current-year losses",C)+
     frow("xxi","Current-year losses to be carried forward",C)+
     frow("xxii","Total loss carried forward to future years",X)+
     '</tfoot></table></div>';
  const lp=["hp","bus","b115","spec","specified","st","lt","horse"].filter(k=>L.lapsed[k]>0);
  if(lp.length)h+=note("<b>Lapsed this year:</b> "+lp.map(k=>({hp:"house property",bus:"business",b115:"life insurance u/s 115B",spec:"speculative",specified:"specified business",st:"short-term capital",lt:"long-term capital",horse:"race horse"})[k]+" "+RS(L.lapsed[k])).join(", ")+" — the loss at the end of its carry window that BFLA did not use.","warn");
  if(L.cf.total>0)h+=note("Total carried forward to next year: <b>"+RS(L.cf.total)+"</b>.");
  return h;
}

/* ---- export --------------------------------------------------------- */
function expLoss(j){
  const L=S.C.loss||engLoss();
  const baa=loss115BAA();

  /* ===== ScheduleCYLA ===== */
  const CY={};
  LOSS_ROWS.forEach(r=>{const k=r[0],key=r[2],f=r[4];
    const c={IncOfCurYrUnderThatHead:n0(L.inc[k]),IncOfCurYrAfterSetOff:n0(L.afterC[k])};
    if(f.cyHP)c.HPlossCurYrSetoff=n0(L.setHP[k]);
    if(f.cyBus)c.BusLossSetoff=n0(L.setBus[k]);
    if(f.cyOS)c.OthSrcLossNoRaceHorseSetoff=n0(L.setOS[k]);
    CY[key]={IncCYLA:c};});                                             /* fixed matrix — every live head written */
  CY.TotalCurYr={TotHPlossCurYr:n0(L.hpTotal),TotBusLoss:n0(L.busLoss),TotOthSrcLossNoRaceHorse:n0(L.osLoss)};
  CY.TotalLossSetOff={TotHPlossCurYrSetoff:n0(L.totHPset),TotBusLossSetoff:n0(L.totBusset),TotOthSrcLossNoRaceHorseSetoff:n0(L.totOSset)};
  CY.LossRemAftSetOff={BalHPlossCurYrAftSetoff:n0(L.hpRemain),BalBusLossAftSetoff:n0(L.busRemain),BalOthSrcLossNoRaceHorseAftSetoff:n0(L.osRemain)};
  CY.CYLAEditFlag=S.loss.editC?"Y":"N";
  j.ScheduleCYLA=CY;

  /* ===== ScheduleBFLA ===== */
  const BF={};
  LOSS_ROWS.forEach(r=>{const k=r[0],key=r[3],b=r[5];
    const o={IncOfCurYrUndHeadFromCYLA:n0(L.afterC[k]),IncOfCurYrAfterSetOffBFLosses:n0(L.afterB[k])};
    if(b.bf2)o.BFlossPrevYrUndSameHeadSetoff=n0(L.setBF[k]);
    if(b.bfDep){o.BFUnabsorbedDeprSetoff=n0(L.setDep[k]);o.BFAllUs35Cl4Setoff=n0(L.set35[k]);}
    BF[key]={IncBFLA:o};});
  BF.TotalBFLossSetOff={TotBFLossSetoff:n0(L.totBFset),TotUnabsorbedDeprSetoff:n0(L.totDep),TotAllUs35cl4Setoff:n0(L.tot35)};
  BF.IncomeOfCurrYrAftCYLABFLA=n0(L.gti);
  BF.BFLAEditFlag=S.loss.editB?"Y":"N";
  j.ScheduleBFLA=BF;

  /* ===== ScheduleCFL ===== */
  const anyYear=CFL_YEARS.some(([y,,F])=>{const r=(S.loss.cfl||{})[y]||{};
    return (F.hp&&N(r.hp))||(F.bus&&N(r.bus5a))||(F.spec&&N(r.spec))||(F.specified&&N(r.specified))||(F.b115&&N(r.b115))||(F.st&&N(r.st))||(F.lt&&N(r.lt))||(F.horse&&N(r.horse));});
  if(anyYear||L.cf.total>0||L.curTotal>0||L.bf.hp+L.bf.bus+L.bf.b115+L.bf.spec+L.bf.specified+L.bf.st+L.bf.lt+L.bf.horse>0){
    const C={};
    CFL_YEARS.forEach(([y,key,F])=>{const r=(S.loss.cfl||{})[y]||{};
      const b5c=Math.max(0,N(r.bus5a)-(baa?N(r.bus5b):0));
      const any=(F.hp&&N(r.hp))||(F.bus&&N(r.bus5a))||(F.spec&&N(r.spec))||(F.specified&&N(r.specified))||(F.b115&&N(r.b115))||(F.st&&N(r.st))||(F.lt&&N(r.lt))||(F.horse&&N(r.horse));
      if(!any)return;
      const d={DateOfFiling:ISO(r.dt)||("2018-04-01")};
      if(F.hp&&N(r.hp))d.TotalHPPTILossCF=n0(r.hp);
      if(F.bus&&N(r.bus5a)){d.BroughtFrwrdBusLoss=n0(r.bus5a);if(baa&&N(r.bus5b))d.AmtAdjAccOptTaxUs115BAA_115BA=n0(r.bus5b);d.BroughtFrwdBusLossSetOffDrYr=n0(b5c);}
      if(F.spec&&N(r.spec))d.LossFrmSpecBusCF=n0(r.spec);
      if(F.specified&&N(r.specified))d.LossFrmSpecifiedBusCF=n0(r.specified);
      if(F.b115&&N(r.b115))d.LossFrmLifeInsBusUs115B=n0(r.b115);
      if(F.st&&N(r.st))d.TotalSTCGPTILossCF=n0(r.st);
      if(F.lt&&N(r.lt))d.TotalLTCGPTILossCF=n0(r.lt);
      if(F.horse&&N(r.horse))d.OthSrcLossRaceHorseCF=n0(r.horse);
      C[key]={CarryFwdLossDetail:d};});
    const summ=o=>({LossSummaryDetail:{TotalHPPTILossCF:n0(o.hp),BroughtFrwdBusLossSetOffDrYr:n0(o.bus),
      LossFrmSpecBusCF:n0(o.spec),LossFrmSpecifiedBusCF:n0(o.specified),LossFrmLifeInsBusUs115B:n0(o.b115),
      TotalSTCGPTILossCF:n0(o.st),TotalLTCGPTILossCF:n0(o.lt),OthSrcLossRaceHorseCF:n0(o.horse)}});
    C.TotalOfBFLossesEarlierYrs=summ(L.bf);                             /* xvii */
    C.AdjTotBFLossInBFLA=summ(L.usedBF);                               /* xviii */
    C.CurrentAYloss=summ(L.cur);                                       /* xix */
    C.CurrentYearLossCF=summ(L.cur);                                   /* xxi = xix - xx (xx = 0 for a company) */
    C.TotalLossCFSummary=summ(L.cf);                                   /* xxii */
    j.ScheduleCFL=C;
  }

  /* ===== ITRScheduleUD ===== */
  const U=L.ud||{rows:[]};
  const anyUD=(S.loss.ud||[]).some(r=>N(r.bfud)||N(r.soc)||N(r.bfallow)||N(r.allowsoc)||(baa&&N(r.adj115)))||U.totBF||U.totBFa;
  if(anyUD){
    const UD={CurrAssYr:"2026-27",CurBalCFNY:n0(U.curDep),CurAllowBalCFNY:n0(U.curAllow)};
    const arr=[];
    U.rows.forEach(r=>{if(!(r.bf||r.adj||r.so||r.bfa||r.soa))return;
      const o={AssYr:r.ay||"2026-27",AmtBFUD:n0(r.bf),AmtDeprSOCY:n0(r.so),BalCFNY:n0(r.bal),
               AmtBFUAllow:n0(r.bfa),AmtAllowSOCY:n0(r.soa),AllowBalCFNY:n0(r.bala)};
      o.AmtAdjOptTaxUs115BAA=(baa&&r.adj)?n0(r.adj):0;   /* schema-required in ScheduleUD; 0 when not 115BAA (Defect 12) */
      arr.push(o);});
    if(arr.length)UD.ScheduleUD=arr;
    UD.TotBFUDepritAmt=n0(U.totBF);
    UD.TotAmtAdjOptTaxUs115BAA=(baa&&U.totAdj)?n0(U.totAdj):0;   /* schema-required in ITRScheduleUD; 0 when not 115BAA (Defect 12) */
    UD.TotCurYrdepritSetoffInc=n0(U.totSO);
    UD.TotDepritBalCFNY=n0(U.totBal);
    UD.TotBFUAllowAmt=n0(U.totBFa);
    UD.TotCurYrAllowSetoffInc=n0(U.totSOa);
    UD.TotalBalCFNY=n0(U.totBala);
    j.ITRScheduleUD=UD;
  }
}

/* ---- import --------------------------------------------------------- */
function impLoss(I6){
  const read=[];
  const rg=(o,p)=>{let t=o;for(const k of p.split(".")){if(t==null)return undefined;t=t[k];}return t;};
  const cy=I6.ScheduleCYLA, bf=I6.ScheduleBFLA, cf=I6.ScheduleCFL, ud=I6.ITRScheduleUD;
  if(cy){S.loss.editC=(cy.CYLAEditFlag==="Y")?"Y":"";
    if(S.loss.editC){S.loss.cylaOver={};S.loss.busOver={};S.loss.osOver={};
      LOSS_ROWS.forEach(r=>{const k=r[0],b=cy[r[2]]&&cy[r[2]].IncCYLA;if(!b)return;
        if(r[4].cyHP)S.loss.cylaOver[k]={hp:N(b.HPlossCurYrSetoff)};
        if(r[4].cyBus)S.loss.busOver[k]={bus:N(b.BusLossSetoff)};
        if(r[4].cyOS)S.loss.osOver[k]={os:N(b.OthSrcLossNoRaceHorseSetoff)};});}
    read.push("Schedule CYLA");}
  if(bf){S.loss.editB=(bf.BFLAEditFlag==="Y")?"Y":"";
    if(S.loss.editB){S.loss.bflaOver={};
      LOSS_ROWS.forEach(r=>{const k=r[0],b=bf[r[3]]&&bf[r[3]].IncBFLA;if(b&&r[5].bf2)S.loss.bflaOver[k]=N(b.BFlossPrevYrUndSameHeadSetoff);});}
    read.push("Schedule BFLA");}
  if(cf){S.loss.cfl=S.loss.cfl||{};
    CFL_YEARS.forEach(([y,key,F])=>{const d=rg(cf,key+".CarryFwdLossDetail");if(!d)return;
      const row={dt:dmy(d.DateOfFiling)};
      if(F.hp)row.hp=nz(d.TotalHPPTILossCF);
      if(F.bus){row.bus5a=nz(d.BroughtFrwrdBusLoss);row.bus5b=nz(d.AmtAdjAccOptTaxUs115BAA_115BA);}
      if(F.spec)row.spec=nz(d.LossFrmSpecBusCF);
      if(F.specified)row.specified=nz(d.LossFrmSpecifiedBusCF);
      if(F.b115)row.b115=nz(d.LossFrmLifeInsBusUs115B);
      if(F.st)row.st=nz(d.TotalSTCGPTILossCF);
      if(F.lt)row.lt=nz(d.TotalLTCGPTILossCF);
      if(F.horse)row.horse=nz(d.OthSrcLossRaceHorseCF);
      S.loss.cfl[y]=row;});
    read.push("Schedule CFL (losses carried forward)");}
  if(ud){const arr=(ud.ScheduleUD||[]).map(r=>({ay:r.AssYr||"",bfud:N(r.AmtBFUD),adj115:N(r.AmtAdjOptTaxUs115BAA),
      soc:N(r.AmtDeprSOCY),bfallow:N(r.AmtBFUAllow),allowsoc:N(r.AmtAllowSOCY)}));
    if(arr.length){if(arr[0].ay!=="2026-27")arr.unshift({ay:"2026-27"});S.loss.ud=arr;}
    read.push("Schedule UD (unabsorbed depreciation / s.35(4) allowance)");}
  return read;
}

/* ---- checks --------------------------------------------------------- */
function chkLoss(){
  const out=[];const L=S.C.loss||engLoss();const baa=loss115BAA();
  const add=(lvl,t,m)=>out.push({lvl,t,m,sec:"loss"});

  /* CYLA Rs 2,00,000 cap on the HP set-off (s.71(3A) / A502: 2xvi <= 200000) */
  if(L.totHPset>200000) add("err","House-property set-off cap","The current-year house-property loss set off (Rs "+F(L.totHPset)+") exceeds the Rs 2,00,000 limit of section 71(3A).");

  /* CFL 5b (115BAA adjustment) only when the company has opted for 115BAA (A564) */
  if(!baa){const bad=CFL_YEARS.filter(([y,,F])=>F.bus&&N(((S.loss.cfl||{})[y]||{}).bus5b)>0).map(x=>x[0]);
    if(bad.length) add("warn","115BAA adjustment without opting","Schedule CFL 5b (amount adjusted on opting for section 115BAA) is filled for "+bad.join(", ")+" but must be nil unless the company opts for taxation u/s 115BAA.");}

  /* Schedule UD 3a (115BAA adjustment) only when opting for 115BAA (A569) */
  if(!baa){const badUD=(S.loss.ud||[]).some(r=>N(r.adj115)>0);
    if(badUD) add("warn","Schedule UD 115BAA adjustment","Schedule UD column 3a (adjustment on opting for section 115BAA) is filled but must be nil unless the company opts for taxation u/s 115BAA.");}

  /* Schedule UD col 4 depreciation set off cannot exceed BP 12iii (A574) */
  const bp12iii=("inc12iii" in ((S.C&&S.C.bp)||{}))?R(N(S.C.bp.inc12iii)):null;
  if(bp12iii!=null && L.udPoolDep>bp12iii+1)
    add("err","Depreciation set off exceeds business income","The depreciation set off in Schedule UD (Rs "+F(L.udPoolDep)+") cannot exceed the income available in item 12iii of Schedule BP (Rs "+F(bp12iii)+").");

  /* Schedule UD first-row gate */
  {const rows=S.loss.ud||[];const first=rows[0]||{};
   const firstEmpty=!(N(first.bfud)||N(first.adj115)||N(first.soc)||N(first.bfallow)||N(first.allowsoc));
   const laterFilled=rows.slice(1).some(r=>N(r.bfud)||N(r.soc)||N(r.bfallow)||N(r.allowsoc));
   if(firstEmpty&&laterFilled) add("warn","Schedule UD first row empty","The first row (2026-27) of Schedule UD has no entry, so the later rows will not be considered. Fill the first row or move the amounts up.");}

  /* CFL — a carried-forward loss needs the year's date of filing */
  const noDate=CFL_YEARS.filter(([y,,F])=>{const r=(S.loss.cfl||{})[y]||{};
    const has=(F.hp&&N(r.hp))||(F.bus&&N(r.bus5a))||(F.spec&&N(r.spec))||(F.specified&&N(r.specified))||(F.b115&&N(r.b115))||(F.st&&N(r.st))||(F.lt&&N(r.lt))||(F.horse&&N(r.horse));
    return has&&!ISO(r.dt);}).map(x=>x[0]);
  if(noDate.length) add("err","Date of filing required in Schedule CFL","A brought-forward loss carries only if that year's return was filed in time — enter the date of filing for "+noDate.join(", ")+".");

  /* CFL — date of filing cannot precede 1 April of the assessment year (VBA per-row minimum) */
  const badDate=CFL_YEARS.filter(([y])=>{const r=(S.loss.cfl||{})[y]||{};const iso=ISO(r.dt);if(!iso)return false;
    const min=D(CFL_MINDATE[y]),got=D(r.dt);return min&&got&&got<min;}).map(x=>x[0]);
  if(badDate.length) add("err","Date of filing too early in Schedule CFL","The date of filing for "+badDate.join(", ")+" is before 1 April of that assessment year.");

  /* BFLA arithmetic / UD-reconciliation validators */
  (L.val||[]).forEach(m=>add("err","Schedule BFLA",m));

  /* informational */
  if(L.cylaTotal>0) add("ok","Current-year losses set off","Rs "+F(L.cylaTotal)+" of this year's losses set against other heads in Schedule CYLA.");
  if(L.bfSetoffTotal>0) add("ok","Brought-forward set off","Rs "+F(L.bfSetoffTotal)+" of brought-forward losses, depreciation and s.35(4) allowance set off in Schedule BFLA.");
  if(L.cf.total>0) add("ok","Carried forward to future years","Rs "+F(L.cf.total)+" of losses carried forward through Schedule CFL.");
  return out;
}

/* ---- register ------------------------------------------------------- */
reg({id:"loss", t:"Losses — set-off and carry-forward", ref:"CYLA · BFLA · CFL · UD",
  f:secLoss,
  s:()=>{const L=S.C.loss||{};return L.cf&&L.cf.total?"Carried "+CR(L.cf.total):(((L.cylaTotal||0)+(L.bfSetoffTotal||0))?"Set off "+CR((L.cylaTotal||0)+(L.bfSetoffTotal||0)):"CYLA · BFLA · CFL · UD");},
  eng:engLoss, exp:expLoss, imp:impLoss, chk:chkLoss, order:45});
