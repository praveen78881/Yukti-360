/* =====================================================================
   ITR-5 · Section "loss" — set-off and carry-forward of losses
   Schedules CYLA · BFLA · CFL · UD (Unabsorbed Depreciation), built
   strictly from the ITR-5 books (never ITR-3's numbers):
     books/ITR-5/CYLA_BFLA.md   — current-year & brought-forward set-off
     books/ITR-5/CFL.md         — 16 brought-forward AY rows in three tiers
     books/ITR-5/Unabsorbed_Depreciation.md — Schedule UD (cols 4 & 7 → BFLA)
   Self-contained: state seed, engLoss, secLoss, expLoss, impLoss, chkLoss
   and one reg() at the bottom. corder 46 — computes AFTER every income head
   (hp order 6, bp corder 25, cg 26, os 27) and before the tax roll-up.

   Schema (sources/ITR-5/…schema.json) verified verbatim: the CYLA OS-normal
   head is block `OthSrcExclRaceHorseLottery`, but the BFLA one is
   `OthSrcExclRaceHorse`; 5b/3a keys are `AdjustAccTax115BADAmt` (BAD, not BAC);
   CFL adds `CurrentYearDistrUnitHolder` (xx) and `CurrentYearLossCF` (xxi).
   ITR-5 has NO salary head; the CFL/CYLA "Life insurance business u/s 115B"
   display rows carry NO schema leaf and are excluded (rule 3) — see report.
   ===================================================================== */

/* ---- state ---------------------------------------------------------- */
/* S.loss.cfl is keyed by assessment year; each year holds the person's own
   inputs (date of filing + the historic per-column loss figures).
   S.loss.ud holds Schedule UD: the current-AY carry balances plus the
   earlier-year rows[] grid. editC/editB are the CYLA/BFLA "edit auto-
   populated details?" flags; the *Over objects hold the manual overrides. */
S.loss = S.loss || { cfl:{}, ud:{curBal:"",curAllowBal:"",rows:[]},
                     editC:"", editB:"", cylaOver:{}, busOver:{}, osOver:{}, bflaOver:{} };
SEED["loss.ud.rows"] = SEED["loss.ud.rows"] || {ay:"",bfUD:0,adj:0,deprSO:0,bfUAllow:0,allowSO:0};

/* the thirteen live income heads, in the book's row order. ITR-5 has no
   salary row; the "Life insurance business u/s 115B" display rows (CYLA iv /
   BFLA iii) carry no CYLA/BFLA schema leaf and are not built.
   Fields, verbatim from the schema:
     cyKey/bfKey : the CYLA and BFLA schema block name (differ for OS-normal)
     cySl/bfSl   : the item number from the rules document (CFL.md / CYLA_BFLA.md)
     cyHP/cyBus/cyOS : which current-year set-off column exists on this CYLA row
     bf2   : which brought-forward CFL column feeds this BFLA row's col-2
             (0 = no BF-loss column — OS-normal & OS-DTAA are never carried)
     bfDep : whether the BFLA row carries the depreciation / 35(4) columns   */
const LOSS_ROWS=[
 ["hp","House property","HP","HP","ii","i",{cyHP:0,cyBus:1,cyOS:1},{bf2:"hp",bfDep:1}],
 ["bus","Business (excluding life insurance u/s 115B, speculation & specified business)","BusProfExclSpecProf","BusProfExclSpecProf","iii","ii",{cyHP:1,cyBus:0,cyOS:1},{bf2:"bus",bfDep:1}],
 ["spec","Speculative income","SpeculationIncome","SpeculationIncome","v","iv",{cyHP:1,cyBus:0,cyOS:1},{bf2:"spec",bfDep:1}],
 ["specified","Specified business income u/s 35AD","SpecifiedBusIncome","SpecifiedBusIncome","vi","v",{cyHP:1,cyBus:0,cyOS:1},{bf2:"specified",bfDep:1}],
 ["st20","Short-term capital gain taxable @ 20%","STCG20Per","STCG20Per","vii","vi",{cyHP:1,cyBus:1,cyOS:1},{bf2:"st",bfDep:1}],
 ["st30","Short-term capital gain taxable @ 30%","STCG30Per","STCG30Per","viii","vii",{cyHP:1,cyBus:1,cyOS:1},{bf2:"st",bfDep:1}],
 ["stApp","Short-term capital gain taxable at applicable rates","STCGAppRate","STCGAppRate","ix","viii",{cyHP:1,cyBus:1,cyOS:1},{bf2:"st",bfDep:1}],
 ["stDTAA","Short-term capital gain taxable at special rate as per DTAA","STCGDTAARate","STCGDTAARate","x","ix",{cyHP:1,cyBus:1,cyOS:1},{bf2:"st",bfDep:1}],
 ["lt125","Long-term capital gain taxable @ 12.5%","LTCG12_5Per","LTCG12_5Per","xi","x",{cyHP:1,cyBus:1,cyOS:1},{bf2:"lt",bfDep:1}],
 ["ltDTAA","Long-term capital gain taxable at special rate as per DTAA","LTCGDTAARate","LTCGDTAARate","xii","xi",{cyHP:1,cyBus:1,cyOS:1},{bf2:"lt",bfDep:1}],
 ["os","Net income from other sources chargeable at normal applicable rates","OthSrcExclRaceHorseLottery","OthSrcExclRaceHorse","xiii","xii",{cyHP:1,cyBus:1,cyOS:0},{bf2:0,bfDep:1}],
 ["horse","Profit from the activity of owning and maintaining race horses","ProfitFrmRaceHorse","ProfitFrmRaceHorse","xiv","xiii",{cyHP:1,cyBus:1,cyOS:1},{bf2:"horse",bfDep:1}],
 ["osDTAA","Income from other sources taxable at special rates as per DTAA","IncOSDTAA","IncOSDTAA","xv","xiv",{cyHP:1,cyBus:1,cyOS:1},{bf2:0,bfDep:1}]];

/* the current-year set-off walk orders (heads that can absorb each loss).
   Only rows whose column flag is set are visited (guarded again in the loop). */
/* HP loss → business, speculative, specified, OS-normal, race-horse, then the
   CG heads. HP loss cannot be set off against HP itself. */
const CY_ORDER_HP =["bus","spec","specified","os","horse","st30","stApp","st20","stDTAA","lt125","ltDTAA","osDTAA"];
/* Business loss (non-speculative) → every head carrying a business column, i.e.
   NOT speculative and NOT specified (those are ring-fenced) and NOT business. */
const CY_ORDER_BUS=["hp","os","horse","osDTAA","st30","stApp","st20","stDTAA","lt125","ltDTAA"];
/* Normal OS loss → race-horse profit and OS-DTAA FIRST (book rule 2625), then
   the remaining heads. OS loss cannot be set off against OS-normal itself. */
const CY_ORDER_OS =["horse","osDTAA","hp","bus","spec","specified","st30","stApp","st20","stDTAA","lt125","ltDTAA"];
/* BFLA capital set-off: a long-term loss sits only on the two long slots; a
   short-term loss on all six capital slots (short first, then long). */
const BF_ORDER_LT=["lt125","ltDTAA"];
const BF_ORDER_ST=["st30","stApp","st20","stDTAA","lt125","ltDTAA"];
/* Order in which the BFLA depreciation / 35(4) pools (Schedule UD col-4 /
   col-7 totals) are allotted across the heads' remaining income. */
const BF_DEP_ORDER=["bus","spec","specified","hp","st30","stApp","st20","stDTAA","lt125","ltDTAA","os","horse","osDTAA"];

/* Schedule CFL — the fixed sixteen year-rows, each with its own schema block
   and the set of columns live in that row's carry window (CFL.md tiers):
     Tier-1 2010-11..2017-18 : only specified-business loss (35AD, indefinite)
     Tier-2 2018-19..2021-22 : + HP, business(5a/5b/5c), STCG, LTCG (8-yr)
     Tier-3 2022-23..2025-26 : + speculative & race-horse (their 4-yr window)  */
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
/* the oldest year in each carry window — its unrelieved figure lapses this
   year (CFL [G30] MAX(0,G23-G26-MAX(0,G15-G26))); specified never lapses. */
const CFL_OLDEST_8="2018-19", CFL_OLDEST_4="2022-23";

/* Schedule CFL row xx ("loss distributed among unit-holders") applies only to
   an investment fund (AOP/BOI sub-status "5-Investment Fund"). Every other
   assessee leaves the row at nil. */
const isAIF=()=>st0((S.pi||{}).substatus)==="5-Investment Fund";
/* Schedule UD earlier-year AssYr choices — the CFL year horizon, newest first;
   every value matches the schema pattern YYYY-YY (a plain <select>, so a free
   entry can never break the pattern). */
const UD_AY=CFL_YEARS.map(x=>x[0]).reverse();

/* ---- engine --------------------------------------------------------- */
/* Every cross-head figure is read defensively (never throw). The upstream
   S.C contract consumed here (guarded, default 0):
     hp.income                              HP head income (signed) [G7=ABS(MIN(,0))]
     bp.a.A37 / bp.e.{specRemain,specifiedRemain,lossRemain}
                                            Part A business income, and Table-E
                                            remaining speculative / specified income,
                                            and remaining business loss (CYLA H7)
     bp.b.B42 / bp.c.C48                    speculative / specified P&L (signed → CFL xix)
     cg.after.{st20,st30,stApp,stDTAA,lt125,ltDTAA}  gains after CG set-off (CYLA col-1)
     cg.cflSTCL / cg.cflLTCL                Table-E unabsorbed STCL/LTCL (→ CFL xix)
     os.netNormal / os.raceHorse / os.dtaaTotal   OS normal (signed), race-horse
                                            balance (signed), OS-DTAA total          */
function engLoss(){
  const g=(o)=>o||{};
  const hp=g(S.C.hp), bp=g(S.C.bp), cg=g(S.C.cg), os=g(S.C.os);
  const bpa=g(bp.a), bpb=g(bp.b), bpc=g(bp.c), bpe=g(bp.e), cgAfter=g(cg.after);
  const A37       = N(bpa.A37);                                       /* Part A business total (signed) */
  const specRemain= N(bpe.specRemain);                               /* Table-E speculative income remaining */
  const specifiedRemain=N(bpe.specifiedRemain);                      /* Table-E specified income remaining */
  const bpLossRem = Math.max(0,N(bpe.lossRemain));                   /* CYLA H7 = 2vi of Table E of Sch BP */
  const B42       = N(bpb.B42);                                       /* AdjustedPLFrmSpecuBus (signed) */
  const C48       = N(bpc.C48);                                       /* AdjustedPLFrmSpecifiedBus (signed) */
  const osNorm    = N(os.netNormal);                                 /* os.BalanceNoRaceHorse (signed) */
  const osHorseBal= N(os.raceHorse);                                 /* os.BalanceOwnRaceHorse (signed) */
  const osDtaa    = N(os.dtaaTotal);                                 /* os.TotalAmtTaxUsDTAASchOs */
  const New=isNew();

  /* ---- Schedule UD (own block) ------------------------------------- */
  const ud=engUD(bp);

  /* ---- CYLA row i · the three incoming current-year losses --------- */
  const hpTotal = Math.max(0,-N(hp.income));                         /* G7 = ABS(MIN(HP income,0)) */
  const hpCapped= New?0:Math.min(hpTotal,200000);                    /* set-off pool; nil under new regime (rule 2640) */
  const hpExcess= New?0:Math.max(0,hpTotal-200000);                  /* over ₹2,00,000 → straight to CFL */
  const busLoss = bpLossRem;                                         /* H7 */
  const osLoss  = Math.max(0,-osNorm);                               /* I7 = ABS(MIN(os.BalanceNoRaceHorse,0)) */

  /* ---- CYLA col-1 · income of the current year (positive only) ----- */
  const inc={
    hp:Math.max(0,N(hp.income)),                                     /* F8 = MAX(HP income,0) */
    bus:Math.max(0,A37),                                             /* F9 = MAX(A37,0) */
    spec:Math.max(0,specRemain), specified:Math.max(0,specifiedRemain),
    st20:Math.max(0,N(cgAfter.st20)), st30:Math.max(0,N(cgAfter.st30)),
    stApp:Math.max(0,N(cgAfter.stApp)), stDTAA:Math.max(0,N(cgAfter.stDTAA)),
    lt125:Math.max(0,N(cgAfter.lt125)), ltDTAA:Math.max(0,N(cgAfter.ltDTAA)),
    os:Math.max(0,osNorm),                                           /* F22 = MAX(os.BalanceNoRaceHorse,0) */
    horse:Math.max(0,osHorseBal),                                    /* F23 = MAX(os.BalanceOwnRaceHorse,0) */
    osDTAA:Math.max(0,osDtaa)};                                      /* F24 = MAX(os.DTAA,0) */

  /* ---- CYLA cols 2/3/4 · set-off (greedy, respecting 2+3+4 ≤ 1) ---- */
  const setHP={},setBus={},setOS={},remInc={},flag={};
  LOSS_ROWS.forEach(r=>{setHP[r[0]]=0;setBus[r[0]]=0;setOS[r[0]]=0;remInc[r[0]]=inc[r[0]];flag[r[0]]=r[6];});
  if(S.loss.editC){                                                  /* manual override behind the sheet's own switch (I28) */
    LOSS_ROWS.forEach(r=>{const k=r[0],f=r[6];
      if(f.cyHP){setHP[k]=Math.min(N((S.loss.cylaOver[k]||{}).hp),remInc[k]);remInc[k]-=setHP[k];}
      if(f.cyBus){setBus[k]=Math.min(N((S.loss.busOver[k]||{}).bus),remInc[k]);remInc[k]-=setBus[k];}
      if(f.cyOS){setOS[k]=Math.min(N((S.loss.osOver[k]||{}).os),remInc[k]);remInc[k]-=setOS[k];}});
  }else{
    let rem=hpCapped;CY_ORDER_HP.forEach(k=>{if(rem<=0||!flag[k].cyHP)return;const t=Math.min(rem,remInc[k]);setHP[k]=t;remInc[k]-=t;rem-=t;});
    rem=busLoss;   CY_ORDER_BUS.forEach(k=>{if(rem<=0||!flag[k].cyBus)return;const t=Math.min(rem,remInc[k]);setBus[k]=t;remInc[k]-=t;rem-=t;});
    rem=osLoss;    CY_ORDER_OS.forEach(k=>{if(rem<=0||!flag[k].cyOS)return;const t=Math.min(rem,remInc[k]);setOS[k]=t;remInc[k]-=t;rem-=t;});
  }
  const sum=o=>Object.keys(o).reduce((a,k)=>a+o[k],0);
  const totHPset =Math.min(sum(setHP),hpTotal,200000);               /* G25 — capped at ₹2,00,000 (s.71(3A)) */
  const totBusset=sum(setBus);                                       /* H25 */
  const totOSset =sum(setOS);                                        /* I25 */
  const hpRemain = New?0:(totHPset<200000?Math.max(0,(hpCapped-totHPset)+hpExcess):hpExcess); /* G26 → CFL; 0 in new regime */
  const busRemain= Math.max(0,busLoss-totBusset);                    /* H26 → CFL */
  const osRemain = Math.max(0,osLoss-totOSset);                      /* I26 — normal OS loss lapses */
  const afterC={};LOSS_ROWS.forEach(r=>{const k=r[0];afterC[k]=R(inc[k]-setHP[k]-setBus[k]-setOS[k]);}); /* J = 1−2−3−4 */

  /* ---- CFL · brought-forward figures from the year-rows ------------ */
  const cflRow=y=>(S.loss.cfl||{})[y]||{};
  const b5c=r=>Math.max(0,N(r.bus5a)-(New?N(r.bus5b):0));            /* 5c = MAX(0, 5a − 5b); 5b only in new regime */
  const bf={hp:0,bus:0,spec:0,specified:0,st:0,lt:0,horse:0};
  CFL_YEARS.forEach(([y,,F])=>{const r=cflRow(y);
    if(F.hp)bf.hp+=N(r.hp); if(F.bus)bf.bus+=b5c(r); if(F.spec)bf.spec+=N(r.spec);
    if(F.specified)bf.specified+=N(r.specified); if(F.st)bf.st+=N(r.st);
    if(F.lt)bf.lt+=N(r.lt); if(F.horse)bf.horse+=N(r.horse);});

  /* ---- BFLA col-2 · brought-forward loss set off against col-1 (=CYLA 5) */
  const setBF={};LOSS_ROWS.forEach(r=>setBF[r[0]]=0);
  if(S.loss.editB){
    LOSS_ROWS.forEach(r=>{const k=r[0],c2=r[7].bf2;if(c2)setBF[k]=Math.min(N(S.loss.bflaOver[k]),afterC[k]);});
  }else{
    setBF.hp       =Math.min(bf.hp,afterC.hp);                       /* HP BF loss → HP income only */
    setBF.bus      =Math.min(bf.bus,afterC.bus);                     /* business → business only */
    setBF.spec     =Math.min(bf.spec,afterC.spec);                   /* speculative → speculative only */
    setBF.specified=Math.min(bf.specified,afterC.specified);        /* specified → specified only */
    let remLT=bf.lt;BF_ORDER_LT.forEach(k=>{if(remLT<=0)return;const t=Math.min(remLT,afterC[k]-setBF[k]);setBF[k]+=t;remLT-=t;}); /* LTCL first, long slots only */
    let remST=bf.st;BF_ORDER_ST.forEach(k=>{if(remST<=0)return;const t=Math.min(remST,afterC[k]-setBF[k]);setBF[k]+=t;remST-=t;}); /* STCL against any CG slot */
    setBF.horse    =Math.min(bf.horse,afterC.horse);                 /* race-horse → race-horse only */
  }
  /* how much of each brought-forward column was actually used (for CFL xviii) */
  const usedBF={hp:setBF.hp,bus:setBF.bus,spec:setBF.spec,specified:setBF.specified,horse:setBF.horse,st:0,lt:0};
  {const ltUsed=Math.min(bf.lt,BF_ORDER_LT.reduce((a,k)=>a+setBF[k],0));
   const stUsed=Math.min(bf.st,BF_ORDER_ST.reduce((a,k)=>a+setBF[k],0)-ltUsed);
   usedBF.lt=Math.max(0,ltUsed);usedBF.st=Math.max(0,stUsed);}

  /* ---- BFLA cols 3/4 · brought-forward depreciation & 35(4) allowance
     from Schedule UD. UD publishes only the col-4 / col-7 TOTALS (a single
     pool each); BFLA allots them across the heads' remaining income (book:
     Hn = MIN(remaining income, pool − already used)); the column totals then
     equal UD col-4 / col-7 (rules 2670/2665, 533/534).                     */
  const setDep={},set35={};LOSS_ROWS.forEach(r=>{setDep[r[0]]=0;set35[r[0]]=0;});
  {let pool=ud.totSetoff;                                            /* UD col-4 total → depreciation */
   BF_DEP_ORDER.forEach(k=>{if(pool<=0)return;const avail=afterC[k]-setBF[k];if(avail<=0)return;
     const t=Math.min(pool,avail);setDep[k]=t;pool-=t;});
   pool=ud.totAllowSetoff;                                           /* UD col-7 total → 35(4) allowance */
   BF_DEP_ORDER.forEach(k=>{if(pool<=0)return;const avail=afterC[k]-setBF[k]-setDep[k];if(avail<=0)return;
     const t=Math.min(pool,avail);set35[k]=t;pool-=t;});}

  const afterB={};let gti=0;
  LOSS_ROWS.forEach(r=>{const k=r[0];afterB[k]=R(Math.max(0,afterC[k]-setBF[k]-setDep[k]-set35[k]));gti+=afterB[k];}); /* J = MAX(0,F−G−H−I) */
  const totBFset=sum(setBF), totDep=sum(setDep), tot35=sum(set35);

  /* ---- CFL xix · current-year losses arising this year ------------- */
  const cur={
    hp:hpRemain,                                                     /* [G27] = CYLA BalHPlossCurYrAftSetoff */
    bus:busRemain,                                                   /* [L27] = CYLA BalBusLossAftSetoff */
    spec:Math.max(0,-R(B42)),                                        /* [M27] = ABS(MIN(0, AdjustedPLFrmSpecuBus)) */
    specified:Math.max(0,-R(C48)),                                   /* [N27] = ABS(MIN(0, AdjustedPLFrmSpecifiedBus)) */
    st:Math.max(0,R(N(cg.cflSTCL))),                                 /* [P27] = CG Table-E unabsorbed STCL */
    lt:Math.max(0,R(N(cg.cflLTCL))),                                 /* [S27] = CG Table-E unabsorbed LTCL */
    horse:Math.max(0,-R(osHorseBal))};                              /* [W27] = ABS(MIN(0, os.BalanceOwnRaceHorse)) */

  /* ---- CFL xx · current-year loss distributed to unit-holders ------
     Investment-fund only (sub-status "5-Investment Fund"); nil for every other
     assessee, so the row exports 0 without any input. Schema CurrYrDistrLoss
     carries only the HP / STCG / LTCG / race-horse legs, so only those four
     are collected, each capped at that head's current-year loss (row xix).   */
  const distr={hp:0,bus:0,spec:0,specified:0,st:0,lt:0,horse:0};
  if(isAIF())["hp","st","lt","horse"].forEach(k=>distr[k]=Math.min(N((S.loss.distr||{})[k]),cur[k]));
  /* ---- CFL xxi · current-year losses to carry forward (xix − xx) --- */
  const curCF={};Object.keys(cur).forEach(k=>curCF[k]=Math.max(0,cur[k]-distr[k]));

  /* ---- CFL xxii · total carried forward, with the window lapse rule- */
  const old8=cflRow(CFL_OLDEST_8), old4=cflRow(CFL_OLDEST_4);
  const oldest={hp:N(old8.hp),bus:b5c(old8),st:N(old8.st),lt:N(old8.lt),spec:N(old4.spec),horse:N(old4.horse)};
  const cf={};
  ["hp","bus","st","lt","spec","horse"].forEach(k=>{cf[k]=Math.max(0,bf[k]-Math.max(usedBF[k],oldest[k]||0)+curCF[k]);}); /* [G30] window lapse */
  cf.specified=Math.max(0,bf.specified-usedBF.specified+curCF.specified);                                                 /* [N30] no lapse — indefinite */
  const lapsed={};["hp","bus","st","lt","spec","horse"].forEach(k=>{lapsed[k]=Math.max(0,(oldest[k]||0)-usedBF[k]);});
  cf.total=cf.hp+cf.bus+cf.spec+cf.specified+cf.st+cf.lt+cf.horse;

  /* ---- BFLA arithmetic validators (CFL.md / rules.json) ------------ */
  const val=[];
  const stSetTotal=BF_ORDER_ST.reduce((a,k)=>a+setBF[k],0), ltSetTotal=BF_ORDER_LT.reduce((a,k)=>a+setBF[k],0);
  if(stSetTotal>bf.st+bf.lt+1) val.push("Losses set off against capital gains cannot exceed the capital loss brought forward in Schedule CFL.");
  if(ltSetTotal>bf.lt+1)       val.push("Losses set off against long-term gains cannot exceed the long-term loss brought forward in Schedule CFL.");

  /* ---- this head's correction to gross total income ----------------
     GTI = BFLA total (income after CYLA & BFLA, all heads). The other heads
     publish their own signed income; loss.income is the correction that makes
     Σ S.C.<head>.income equal that true GTI (set-offs, carry-forward and the
     ₹2L cap all fold in here). ITR-5 has no salary head.                    */
  const otherHeads=N(hp.income)+N(bp.income)+N(cg.income)+N(os.income);
  const income=R(gti)-R(otherHeads);

  S.C.loss={
    ud,
    inc,hpTotal:R(hpTotal),hpCapped:R(hpCapped),hpExcess:R(hpExcess),busLoss:R(busLoss),osLoss:R(osLoss),
    setHP,setBus,setOS,totHPset:R(totHPset),totBusset:R(totBusset),totOSset:R(totOSset),
    hpRemain:R(hpRemain),busRemain:R(busRemain),osRemain:R(osRemain),afterC,
    bf,setBF,setDep,set35,usedBF,totBFset:R(totBFset),totDep:R(totDep),tot35:R(tot35),
    afterB,gti:R(gti),                                               /* afterB = BFLA col-5 by head (published contract) */
    cur,distr,curCF,cf,oldest,lapsed,val,income:R(income),
    cylaTotal:R(totHPset+totBusset+totOSset), bflaTotal:R(totBFset+totDep+tot35)};
  return S.C.loss;
}

/* ---- Schedule UD engine (rows 7-19) -------------------------------- */
/* Current-AY row (row 7): only the two carry balances are captured. Earlier
   years (rows 8-16, S.loss.ud.rows[]): H = MAX(BF − 3a − set-off, 0),
   K = MAX(BF − set-off, 0). Totals feed BFLA cols 3 & 4.                  */
function engUD(bp){
  const New=isNew();
  const U=S.loss.ud||{};
  const rows=(U.rows||[]).map(r=>{
    const bfUD=N(r.bfUD), adj=New?N(r.adj):0, deprSO=N(r.deprSO);   /* col 3a nil when not new regime (rule 572) */
    const bfUA=N(r.bfUAllow), allowSO=N(r.allowSO);
    return {ay:st0(r.ay), bfUD, adj, deprSO, bal:Math.max(0,bfUD-adj-deprSO),
            bfUA, allowSO, allowBal:Math.max(0,bfUA-allowSO)};       /* H = MAX(E−F−G,0); K = MAX(I−J,0) */
  });
  const s=k=>rows.reduce((a,r)=>a+r[k],0);
  const curBal=N(U.curBal), curAllowBal=N(U.curAllowBal);           /* H7 / K7 */
  return {rows, curBal, curAllowBal,
    totBF:R(s("bfUD")), totAdj:R(s("adj")), totSetoff:R(s("deprSO")), totBal:R(s("bal")+curBal),
    totBFAllow:R(s("bfUA")), totAllowSetoff:R(s("allowSO")), totAllowBal:R(s("allowBal")+curAllowBal)};
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
    ". A normal other-sources loss not set off here lapses. (Life-insurance-business income u/s 115B is taxed at a special rate and is not part of this set-off matrix.)");
  const ed=!!S.loss.editC;
  h+='<div class="full"><table class="gt" style="min-width:1120px"><thead><tr><th class="l" style="width:34px">Sl.</th>'+
     '<th class="l" style="min-width:340px">Head / source of income</th><th style="width:120px">Income of current year (1)</th>'+
     '<th style="width:130px">HP loss set off (2)</th><th style="width:150px">Business loss set off (3)</th>'+
     '<th style="width:150px">OS loss set off (4)</th><th style="width:130px">Remaining after set-off (5)</th></tr></thead><tbody>';
  h+='<tr><td class="l">i</td><td class="l"><b>Loss to be set off (fill only if the computed figure is negative)</b></td><td></td>'+
     '<td class="num">'+cell(-L.hpTotal)+(L.hpExcess?'<span class="dt">+ '+F(L.hpExcess)+' over ₹2L → CFL</span>':'')+'</td>'+
     '<td class="num">'+cell(-L.busLoss)+'</td><td class="num">'+cell(-L.osLoss)+'</td><td></td></tr>';
  LOSS_ROWS.forEach(r=>{const [k,label,,,cySl,,f]=r;
    h+='<tr><td class="l">'+cySl+'</td><td class="l">'+esc(label)+'</td><td class="num">'+cell(L.inc[k])+'</td>'+
       '<td class="num"'+(f.cyHP?'':' '+closed)+'>'+(f.cyHP?(ed?inp("loss.cylaOver."+k+".hp",{n:1}):cell(L.setHP[k])):'')+'</td>'+
       '<td class="num"'+(f.cyBus?'':' '+closed)+'>'+(f.cyBus?(ed?inp("loss.busOver."+k+".bus",{n:1}):cell(L.setBus[k])):'')+'</td>'+
       '<td class="num"'+(f.cyOS?'':' '+closed)+'>'+(f.cyOS?(ed?inp("loss.osOver."+k+".os",{n:1}):cell(L.setOS[k])):'')+'</td>'+
       '<td class="num">'+cell(L.afterC[k])+'</td></tr>';});
  h+='</tbody><tfoot>'+
     '<tr><td class="l">xvi</td><td class="l">Total loss set off</td><td></td><td>'+F(L.totHPset)+'</td><td>'+F(L.totBusset)+'</td><td>'+F(L.totOSset)+'</td><td></td></tr>'+
     '<tr><td class="l">xvii</td><td class="l">Loss remaining after set-off (i − xvi)</td><td></td><td>'+F(L.hpRemain)+'<span class="dt">→ CFL</span></td><td>'+F(L.busRemain)+'<span class="dt">→ CFL</span></td><td>'+F(L.osRemain)+'<span class="dt">lapses</span></td><td></td></tr>'+
     '</tfoot></table></div>';
  if(New)h+=note("New regime u/s 115BAC(1A)/115BAD: a house-property loss cannot be set off against any other head, nor carried forward through Schedule CYLA (rule 2640).","warn");
  h+=row("Do you want to edit the details auto-populated in the table above?",sel("loss.editC",[["","No"],["Y","Yes"]],{blank:false}),{ref:"CYLA"});

  /* ===== Schedule BFLA ===== */
  h+='<div class="cgband">Schedule BFLA — set-off of brought-forward losses of earlier years</div>';
  h+=note("Losses brought forward from Schedule CFL, set against what remains after CYLA. HP loss against HP income only; business against business, speculative against speculative, specified against specified; a short-term capital loss against any capital gain; a long-term loss against long-term gains only (and first); a race-horse loss against race-horse income only. Brought-forward depreciation and the section 35(4) allowance come from Schedule UD. Nothing against the DTAA / normal other-sources rows.");
  const edB=!!S.loss.editB;
  h+='<div class="full"><table class="gt" style="min-width:1120px"><thead><tr><th class="l" style="width:34px">Sl.</th>'+
     '<th class="l" style="min-width:340px">Head / source of income</th><th style="width:130px">Income after CYLA (1)</th>'+
     '<th style="width:130px">B/f loss set off (2)</th><th style="width:130px">B/f depreciation (3)</th>'+
     '<th style="width:140px">B/f 35(4) allowance (4)</th><th style="width:130px">Remaining after set-off (5)</th></tr></thead><tbody>';
  LOSS_ROWS.forEach(r=>{const [k,label,,,,bfSl,,b]=r;
    h+='<tr><td class="l">'+bfSl+'</td><td class="l">'+esc(label)+'</td><td class="num">'+cell(L.afterC[k])+'</td>'+
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
  h+='<div class="cgband">Schedule UD — unabsorbed depreciation and allowance u/s 35(4)</div>';
  h+=note("Assessment-year by assessment-year, the brought-forward unabsorbed depreciation and the section 35(4) allowance, how much of each is set off against this year's income, and the balance carried forward. The set-off totals (column 4 and column 7) feed Schedule BFLA columns 3 and 4. The current-year row (2026-27) captures only the balances carried to next year.");
  const U=S.loss.ud||{};const UD=L.ud;
  h+=row("2026-27 — depreciation balance carried to next year (col 5)",inp("loss.ud.curBal",{n:1}),{ref:"UD H7"});
  h+=row("2026-27 — allowance u/s 35(4) balance carried to next year (col 8)",inp("loss.ud.curAllowBal",{n:1}),{ref:"UD K7"});
  const udRows=(U.rows||[]).map((r,i)=>{const c=(UD.rows||[])[i]||{};return Object.assign({},r,{bal:c.bal,allowBal:c.allowBal});});
  let udG=grid("loss.ud.rows",[
    {k:"ay",h:"Assessment year",t:"sel",opts:UD_AY,w:"130px",req:1},
    {k:"bfUD",h:"B/f unabsorbed depreciation (3)",t:"num"},
    {k:"adj",h:"115BAD/115BAC adj (3a)",t:"num"},
    {k:"deprSO",h:"Depreciation set-off (4)",t:"num"},
    {k:"bal",h:"Balance c/f (5)",t:"calc"},
    {k:"bfUAllow",h:"B/f allowance u/s 35(4) (6)",t:"num"},
    {k:"allowSO",h:"Allowance set-off (7)",t:"num"},
    {k:"allowBal",h:"Balance c/f (8)",t:"calc"}],
    udRows,{min:"1180px",empty:"No earlier-year unabsorbed depreciation.",add:"Add an assessment year",
      foot:[{l:1,v:"Total"},{v:UD.totBF},{v:UD.totAdj},{v:UD.totSetoff},{v:UD.totBal},{v:UD.totBFAllow},{v:UD.totAllowSetoff},{v:UD.totAllowBal}]});
  if((U.rows||[]).length>=9){                                          /* the utility allows only 9 earlier-year rows (UD sheet rows 8-16) */
    udG=udG.replace(/<button class="add" data-add="loss\.ud\.rows">[\s\S]*<\/button>$/,'');
    udG+=note("Schedule UD allows up to 9 earlier-year rows.","warn");}
  h+=udG;
  if(!New)h+=note("Column 3a (amount adjusted on account of opting for 115BAD / 115BAC(1A)) must be nil unless the new regime is chosen — it is ignored here.","warn");

  /* ===== Schedule CFL ===== */
  h+='<div class="cgband">Schedule CFL — losses to be carried forward to future years</div>';
  h+=note("One row per assessment year. The date of filing ("+DF+") is required on any year that carries a loss — a loss carries only if that year's return was filed within the 139(1) due date. The specified-business loss u/s 35AD carries indefinitely (every row); the 8-year heads (HP, business, capital) show from 2018-19; speculative and race-horse losses carry four years (their columns show only on the last four rows).");
  h+='<div class="full"><table class="gt" style="min-width:1500px"><thead><tr><th class="l" style="width:30px">Sl.</th>'+
     '<th class="l" style="width:78px">AY</th><th class="l" style="width:118px">Date of filing</th>'+
     '<th style="width:110px">HP (4)</th><th style="width:110px">Business 5a</th><th style="width:120px">115BAD adj 5b</th><th style="width:120px">Business 5c</th>'+
     '<th style="width:110px">Speculative (6)</th><th style="width:110px">Specified (7)</th>'+
     '<th style="width:110px">STCL (9)</th><th style="width:110px">LTCL (10)</th><th style="width:120px">Race horses (11)</th></tr></thead><tbody>';
  const slR=["i","ii","iii","iv","v","vi","vii","viii","ix","x","xi","xii","xiii","xiv","xv","xvi"];
  const b5cView=r=>Math.max(0,N(r.bus5a)-(New?N(r.bus5b):0));
  CFL_YEARS.forEach(([y,,F],i)=>{const p="loss.cfl."+y+".";const r=(S.loss.cfl||{})[y]||{};
    const dead=(show)=>'<td class="num" '+closed+'>'+(show?cell(0):'')+'</td>';
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
  const B=L.bf,U2=L.usedBF,C=L.cur,D2=L.distr,X2=L.curCF,X=L.cf;
  const frow=(sl,lbl,o)=>'<tr><td class="l">'+sl+'</td><td class="l" colspan="2">'+lbl+'</td>'+
     '<td>'+F(o.hp)+'</td><td></td><td></td><td>'+F(o.bus)+'</td><td>'+F(o.spec)+'</td><td>'+F(o.specified)+'</td><td>'+F(o.st)+'</td><td>'+F(o.lt)+'</td><td>'+F(o.horse)+'</td></tr>';
  /* Row xx is an input row for an investment fund (the four schema legs
     HP / STCG / LTCG / race-horse); every other assessee sees read-only nil,
     and business / speculative / specified carry no schema leaf here. */
  const aif=isAIF();
  const dcell=k=>aif?'<td>'+inp("loss.distr."+k,{n:1})+'</td>':'<td class="num">'+cell(D2[k])+'</td>';
  const drow='<tr><td class="l">xx</td><td class="l" colspan="2">Current-year loss distributed among unit-holders (investment fund only)</td>'+
     dcell("hp")+'<td></td><td></td>'+
     '<td class="num" '+closed+'></td><td class="num" '+closed+'></td><td class="num" '+closed+'></td>'+
     dcell("st")+dcell("lt")+dcell("horse")+'</tr>';
  h+='</tbody><tfoot>'+
     frow("xvii","Total of earlier-year losses brought forward",B)+
     frow("xviii","Adjustment of the above in Schedule BFLA",U2)+
     frow("xix","2026-27 — current-year losses",C)+
     drow+
     frow("xxi","Current-year losses to be carried forward (xix − xx)",X2)+
     frow("xxii","Total loss carried forward to future years",X)+
     '</tfoot></table></div>';
  if(aif)h+=note("Investment fund: enter the current-year loss distributed to unit-holders (row xx) per head above. Each figure is capped at that head's current-year loss (row xix); the balance (xxi = xix − xx) is what the fund carries forward.");
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
  LOSS_ROWS.forEach(r=>{const [k,,cyKey,,,,f]=r;
    const c={IncOfCurYrUnderThatHead:n0(L.inc[k]),IncOfCurYrAfterSetOff:n0(L.afterC[k])};
    if(f.cyHP)c.HPlossCurYrSetoff=n0(L.setHP[k]);
    if(f.cyBus)c.BusLossSetoff=n0(L.setBus[k]);
    if(f.cyOS)c.OthSrcLossNoRaceHorseSetoff=n0(L.setOS[k]);
    CY[cyKey]={IncCYLA:c};});                                        /* every head emitted (6 CG blocks required) */
  CY.TotalCurYr={TotHPlossCurYr:n0(L.hpTotal),TotBusLoss:n0(L.busLoss),TotOthSrcLossNoRaceHorse:n0(L.osLoss)};
  CY.TotalLossSetOff={TotHPlossCurYrSetoff:n0(L.totHPset),TotBusLossSetoff:n0(L.totBusset),TotOthSrcLossNoRaceHorseSetoff:n0(L.totOSset)};
  CY.LossRemAftSetOff={BalHPlossCurYrAftSetoff:n0(L.hpRemain),BalBusLossAftSetoff:n0(L.busRemain),BalOthSrcLossNoRaceHorseAftSetoff:n0(L.osRemain)};
  CY.CYLAEditFlag=S.loss.editC?"Y":"N";
  put(j,"ScheduleCYLA",CY);

  /* ===== ScheduleBFLA ===== */
  const BF={};
  LOSS_ROWS.forEach(r=>{const [k,,,bfKey,,,,b]=r;
    const o={IncOfCurYrUndHeadFromCYLA:n0(L.afterC[k]),IncOfCurYrAfterSetOffBFLosses:n0(L.afterB[k]),
             BFUnabsorbedDeprSetoff:n0(L.setDep[k]),BFAllUs35Cl4Setoff:n0(L.set35[k])};
    if(b.bf2)o.BFlossPrevYrUndSameHeadSetoff=n0(L.setBF[k]);         /* OS-normal & OS-DTAA drop this leg */
    BF[bfKey]={IncBFLA:o};});
  BF.TotalBFLossSetOff={TotBFLossSetoff:n0(L.totBFset),TotUnabsorbedDeprSetoff:n0(L.totDep),TotAllUs35cl4Setoff:n0(L.tot35)};
  BF.IncomeOfCurrYrAftCYLABFLA=n0(L.gti);
  BF.BFLAEditFlag=S.loss.editB?"Y":"N";
  put(j,"ScheduleBFLA",BF);

  /* ===== ITRScheduleUD ===== */
  const UD=L.ud;
  const anyUD=(UD.rows||[]).some(r=>r.bfUD||r.deprSO||r.bfUA||r.allowSO)||UD.curBal||UD.curAllowBal;
  if(anyUD){
    const U={CurrAssYr:"2026-27",CurBalCFNY:n0(UD.curBal),CurAllowBalCFNY:n0(UD.curAllowBal),
      TotBFUDepritAmt:n0(UD.totBF),TotAdjustAccTax115BADAmt:n0(UD.totAdj),TotCurYrdepritSetoffInc:n0(UD.totSetoff),
      TotDepritBalCFNY:n0(UD.totBal),TotBFUAllowAmt:n0(UD.totBFAllow),TotCurYrAllowSetoffInc:n0(UD.totAllowSetoff),
      TotalBalCFNY:n0(UD.totAllowBal)};
    const arr=(UD.rows||[]).filter(r=>st0(r.ay)||r.bfUD||r.deprSO||r.bfUA||r.allowSO).map(r=>({
      AssYr:st0(r.ay)||"2025-26", AmtBFUD:n0(r.bfUD), AdjustAccTax115BADAmt:n0(r.adj), AmtDeprSOCY:n0(r.deprSO),
      BalCFNY:n0(r.bal), AmtBFUAllow:n0(r.bfUA), AmtAllowSOCY:n0(r.allowSO), AllowBalCFNY:n0(r.allowBal)}));
    if(arr.length)U.ScheduleUD=arr;
    put(j,"ITRScheduleUD",U);
  }

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
      if(F.hp)d.TotalHPPTILossCF=n0(r.hp);                            /* tier-2 requires HP/STCG/LTCG */
      if(F.bus){d.BrtFwdBusLoss=n0(r.bus5a);if(New&&N(r.bus5b))d.AdjustAccTax115BADAmt=n0(r.bus5b);d.BusLossOthThanSpecLossCF=n0(b5c);}
      if(F.spec&&N(r.spec))d.LossFrmSpecBusCF=n0(r.spec);
      if(F.specified&&N(r.specified))d.LossFrmSpecifiedBusCF=n0(r.specified);
      if(F.st)d.TotalSTCGPTILossCF=n0(r.st);
      if(F.lt)d.TotalLTCGPTILossCF=n0(r.lt);
      if(F.horse&&N(r.horse))d.OthSrcLossRaceHorseCF=n0(r.horse);
      C[key]={CarryFwdLossDetail:d};});
    const summ=o=>({LossSummaryDetail:{TotalHPPTILossCF:n0(o.hp),BusLossOthThanSpecLossCF:n0(o.bus),LossFrmSpecBusCF:n0(o.spec),
      LossFrmSpecifiedBusCF:n0(o.specified),TotalSTCGPTILossCF:n0(o.st),TotalLTCGPTILossCF:n0(o.lt),OthSrcLossRaceHorseCF:n0(o.horse)}});
    C.TotalOfBFLossesEarlierYrs=summ(L.bf);                          /* xvii */
    C.AdjTotBFLossInBFLA=summ(L.usedBF);                             /* xviii */
    C.CurrentAYloss=summ(L.cur);                                     /* xix */
    C.CurrentYearDistrUnitHolder={LossSummaryDetail:{TotalHPPTILossCF:n0(L.distr.hp),TotalSTCGPTILossCF:n0(L.distr.st),
      TotalLTCGPTILossCF:n0(L.distr.lt),OthSrcLossRaceHorseCF:n0(L.distr.horse)}};                                     /* xx */
    C.CurrentYearLossCF=summ(L.curCF);                              /* xxi */
    C.TotalLossCFSummary=summ(L.cf);                                /* xxii */
    put(j,"ScheduleCFL",C);
  }
}

/* ---- import --------------------------------------------------------- */
function impLoss(I5){
  const read=[];
  const rg=(o,p)=>{let t=o;for(const k of p.split(".")){if(t==null)return undefined;t=t[k];}return t;};
  const cy=I5.ScheduleCYLA, bf=I5.ScheduleBFLA, cf=I5.ScheduleCFL, ud=I5.ITRScheduleUD;

  if(cy){S.loss.editC=(cy.CYLAEditFlag==="Y")?"Y":"";
    if(S.loss.editC){S.loss.cylaOver={};S.loss.busOver={};S.loss.osOver={};
      LOSS_ROWS.forEach(r=>{const k=r[0],b=cy[r[2]]&&cy[r[2]].IncCYLA;if(!b)return;
        if(r[6].cyHP)S.loss.cylaOver[k]={hp:N(b.HPlossCurYrSetoff)};
        if(r[6].cyBus)S.loss.busOver[k]={bus:N(b.BusLossSetoff)};
        if(r[6].cyOS)S.loss.osOver[k]={os:N(b.OthSrcLossNoRaceHorseSetoff)};});}
    read.push("Schedule CYLA");}

  if(bf){S.loss.editB=(bf.BFLAEditFlag==="Y")?"Y":"";
    if(S.loss.editB){S.loss.bflaOver={};
      LOSS_ROWS.forEach(r=>{const k=r[0],b=bf[r[3]]&&bf[r[3]].IncBFLA;if(b&&r[7].bf2)S.loss.bflaOver[k]=N(b.BFlossPrevYrUndSameHeadSetoff);});}
    read.push("Schedule BFLA");}

  if(ud){S.loss.ud=S.loss.ud||{};
    S.loss.ud.curBal=nz(ud.CurBalCFNY); S.loss.ud.curAllowBal=nz(ud.CurAllowBalCFNY);
    S.loss.ud.rows=(ud.ScheduleUD||[]).map(r=>({ay:st0(r.AssYr),bfUD:nz(r.AmtBFUD),adj:nz(r.AdjustAccTax115BADAmt),
      deprSO:nz(r.AmtDeprSOCY),bfUAllow:nz(r.AmtBFUAllow),allowSO:nz(r.AmtAllowSOCY)}));
    read.push("Schedule UD (unabsorbed depreciation)");}

  if(cf){S.loss.cfl=S.loss.cfl||{};
    CFL_YEARS.forEach(([y,key,F])=>{const d=rg(cf,key+".CarryFwdLossDetail");if(!d)return;
      const row={dt:dmy(d.DateOfFiling)};
      if(F.hp)row.hp=nz(d.TotalHPPTILossCF);
      if(F.bus){row.bus5a=nz(d.BrtFwdBusLoss);row.bus5b=nz(d.AdjustAccTax115BADAmt);}
      if(F.spec)row.spec=nz(d.LossFrmSpecBusCF);
      if(F.specified)row.specified=nz(d.LossFrmSpecifiedBusCF);
      if(F.st)row.st=nz(d.TotalSTCGPTILossCF);
      if(F.lt)row.lt=nz(d.TotalLTCGPTILossCF);
      if(F.horse)row.horse=nz(d.OthSrcLossRaceHorseCF);
      S.loss.cfl[y]=row;});
    /* xx distribution (investment fund) */
    const dd=rg(cf,"CurrentYearDistrUnitHolder.LossSummaryDetail");
    if(dd){S.loss.distr={hp:N(dd.TotalHPPTILossCF),st:N(dd.TotalSTCGPTILossCF),lt:N(dd.TotalLTCGPTILossCF),horse:N(dd.OthSrcLossRaceHorseCF),bus:0,spec:0,specified:0};}
    read.push("Schedule CFL (losses carried forward)");}

  return read;
}

/* ---- checks --------------------------------------------------------- */
function chkLoss(){
  const out=[];const L=S.C.loss||engLoss();const New=isNew();
  const add=(lvl,t,m)=>out.push({lvl,t,m,sec:"loss"});

  /* CYLA ₹2,00,000 cap on the HP set-off (s.71(3A) / TotHPlossCurYrSetoff ≤ 200000) */
  if(L.totHPset>200000) add("err","House-property set-off cap","The current-year house-property loss set off (₹"+F(L.totHPset)+") exceeds the ₹2,00,000 limit of section 71(3A).");

  /* Regime closure on house-property loss (rule 2640) */
  if(New&&L.totHPset>0) add("err","HP loss set off under the new regime","Under section 115BAC(1A)/115BAD a house-property loss cannot be set off against any other head. Set it to nil or opt out of the new regime.");

  /* 5b (115BAD/115BAC adjustment) only in the new regime (rule 567) */
  if(!New){const bad=CFL_YEARS.filter(([y,,F])=>F.bus&&N(((S.loss.cfl||{})[y]||{}).bus5b)>0).map(x=>x[0]);
    if(bad.length) add("warn","115BAD adjustment without the new regime","Schedule CFL 5b (amount adjusted on account of section 115BAD/115BAC(1A)) is filled for "+bad.join(", ")+" but must be nil unless the new regime is selected.");
    const udbad=(L.ud.rows||[]).filter(r=>N(r.adj)>0).length;
    if(udbad) add("warn","UD 3a adjustment without the new regime","Schedule UD column 3a is filled but must be nil unless the new regime is selected (rule 572).");}

  /* UD col 4 ≤ col 3 − col 3a per row (rule 573) */
  const udOver=(L.ud.rows||[]).filter(r=>N(r.deprSO)>Math.max(0,N(r.bfUD)-N(r.adj))).map(r=>st0(r.ay)||"a row");
  if(udOver.length) add("err","Depreciation set-off exceeds brought-forward","In Schedule UD the depreciation set off (col 4) cannot exceed brought-forward less the 115BAD adjustment (col 3 − col 3a) for "+udOver.join(", ")+".");

  /* UD current-year balance vs Schedule DEP 12iii (rule 577) */
  const curDep=N((S.C.bp||{}).curDep);
  if(curDep>0 && N(L.ud.curBal)>curDep) add("warn","UD current-year balance exceeds current depreciation","The 2026-27 depreciation balance carried forward (₹"+F(L.ud.curBal)+") exceeds the current-year depreciation allowable per Schedule DEP (₹"+F(curDep)+").");

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
  if(L.totDep+L.tot35>0) add("ok","Brought-forward depreciation / 35(4) set off","₹"+F(L.totDep+L.tot35)+" of unabsorbed depreciation and 35(4) allowance set off in Schedule BFLA from Schedule UD.");
  if(L.cf.total>0) add("ok","Carried forward to future years","₹"+F(L.cf.total)+" of losses carried forward through Schedule CFL.");
  return out;
}

/* ---- register ------------------------------------------------------- */
reg({id:"loss", t:"Losses — set-off and carry-forward", ref:"CYLA · BFLA · CFL · UD",
  f:secLoss,
  s:()=>{const L=S.C.loss||{};return L.cf&&L.cf.total?"Carried "+CR(L.cf.total):((L.cylaTotal||0)+(L.bflaTotal||0)?"Set off "+CR((L.cylaTotal||0)+(L.bflaTotal||0)):"CYLA · BFLA · CFL · UD");},
  eng:engLoss, exp:expLoss, imp:impLoss, chk:chkLoss, order:9, corder:46});
