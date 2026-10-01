/* =====================================================================
   ITR-7 · Section "cyla" — Schedule CYLA
   Current-year loss set-off (Details of Income after set-off of current
   years losses).  Built strictly from books/ITR-7/Schedule_CYLA.md
   (schema block ScheduleCYLA) — the trust/institution return.

   ITR-7 has ONE set-off sheet: Schedule CYLA (there is no BFLA matrix in
   this block — brought-forward adjustment is not part of it).  The matrix
   runs THIRTEEN live income-head rows (the three pre-23-Jul-2024 CG rate
   slots STCG@15% / LTCG@10% / LTCG@20% are hidden, not built).  Five
   columns:  1 income · 2 HP-loss set off · 3 business-loss set off ·
   4 OS-loss set off (excl race horses) · 5 income remaining (5 = 1−2−3−4).

   The house-property loss set off is capped at Rs 2,00,000 (s.71(3A) /
   rule A354); any excess is not relieved here (it carries under Schedule
   CFL, built elsewhere).  A normal other-sources loss not set off lapses.

   compute order 50 (corder) — runs AFTER every income head (hp 40, oa 41,
   bp 42, os 44, cg 45, vda 46, pti 47) and before the tax roll-up.

   CONSUMES (guarded, default 0):
     S.C.hp.total       house-property head total (signed)
     S.C.hp.lossFull    full HP loss magnitude (row-6 col-2 feed, A360)
     S.C.bp.a.A36       business (excl spec/specified) net P&L (signed)
     S.C.bp.e.specInc / .specifiedInc   Table-E 3ii / 3iii income
     S.C.bp.e.lossRemain                Table-E 2v business loss (col-3 feed, A361)
     S.C.cg.after.{st20,st30,stApp,stDTAA,lt125,ltDTAA}  Table-E 8ii..8vii
     S.C.os.total       normal-rate OS income  = MAX(0, item 6)
     S.C.os.loss        normal-rate OS loss    = MAX(0,−item 6) (col-4 feed, A362)
     S.C.os.raceHorse   race-horse balance (item 8e, signed)
     S.C.os.dtaaTotal   OS at special DTAA rates (item 2e)

   PUBLISHES on S.C.cyla (nothing else writes it) — for the tax (Part
   B-TI) / SI sections:
     .inc.<head>        col-1 current-year income by head (≥0)
     .after.<head>      col-5 income remaining after set-off (5=1−2−3−4)
     .setHP/.setBus/.setOS.<head>   the matrix set-off cells
     .hpLoss/.busLoss/.osLoss       the three "loss to be adjusted" figures
     .totHPset/.totBusset/.totOSset row xiv column totals (HP capped 2L)
     .totalSetOff       2xiv+3xiv+4xiv  → Part B-TI Sl.No.12/9/8 (A500/A565/A601)
     .balHP/.balBus/.balOS          row xv loss remaining after set-off
     .gti               Σ col-5 across the 13 heads (income remaining)
     .editFlag          "Y"/"N" (CYLAEditFlag)
   ===================================================================== */

/* ---- state ---------------------------------------------------------- */
/* S.cyla.edit  — the row-51 "edit auto-populated details?" switch ("Y"/"").
   S.cyla.over.<head> = {hp,bus,os} — the manual set-off cells behind it.  */
S.cyla = S.cyla || { edit:"", over:{} };
if(typeof S.cyla.over!=="object"||!S.cyla.over) S.cyla.over={};

/* The THIRTEEN live income-head rows, in the sheet's row order (i..xiii).
   Each entry: [key, schemaObject, label, {cyHP, cyBus, cyOS}]
   The flag object is which current-year set-off column exists on that row
   (Schedule_CYLA.md §3 — the schema leaf presence is the authority):
     cyHP  — HP loss may be set off here (column 2 present)
     cyBus — business loss may be set off here (column 3 present)
     cyOS  — normal OS loss may be set off here (column 4 present)
   "—" columns (A HP loss cannot go against HP income; a business loss not
   against a business row; a normal OS loss not against OS-normal income).  */
const CYLA_ROWS=[
 ["hp",       "HP",                         "House property",                                                                       {cyHP:0,cyBus:1,cyOS:1}],
 ["bus",      "BusProfExclSpecProf",        "Income from Business (excluding speculation profit and income from specified business or profession)", {cyHP:1,cyBus:0,cyOS:1}],
 ["spec",     "SpeculationIncome",          "Speculative Income",                                                                   {cyHP:1,cyBus:0,cyOS:1}],
 ["specified","SpecifiedBusIncome",         "Specified Business Income u/s 35AD",                                                   {cyHP:1,cyBus:0,cyOS:1}],
 ["st20",     "STCG20Per",                  "Short-term capital gain taxable @ 20%",                                                {cyHP:1,cyBus:1,cyOS:1}],
 ["st30",     "STCG30Per",                  "Short-term capital gain taxable @ 30%",                                                {cyHP:1,cyBus:1,cyOS:1}],
 ["stApp",    "STCGAppRate",                "Short-term capital gain taxable at applicable rates",                                  {cyHP:1,cyBus:1,cyOS:1}],
 ["stDTAA",   "STCGDTAARate",               "Short-term capital gain taxable at special rates in India as per DTAA",                {cyHP:1,cyBus:1,cyOS:1}],
 ["lt125",    "LTCG12_5Per",                "Long term capital gain taxable @ 12.5%",                                               {cyHP:1,cyBus:1,cyOS:1}],
 ["ltDTAA",   "LTCGDTAARate",               "Long term capital gains taxable at special rates in India as per DTAA",                {cyHP:1,cyBus:1,cyOS:1}],
 ["os",       "OthSrcExclRaceHorseLottery", "Net Income from Other sources (excluding profit from owning race horses and winnings from lottery)", {cyHP:1,cyBus:1,cyOS:0}],
 ["horse",    "ProfitFrmRaceHorse",         "Profit from the activity of owning and maintaining race horses",                       {cyHP:1,cyBus:1,cyOS:1}],
 ["osDTAA",   "IncOSDTAA",                  "Income from other sources taxable at special rates in India as per DTAA",              {cyHP:1,cyBus:1,cyOS:1}]];
const CYLA_KEYS=CYLA_ROWS.map(r=>r[0]);
const CYLA_HPCAP=200000;                                      /* s.71(3A) / A354 */

/* Set-off walk orders — the heads each current-year loss may be set off
   against (flag-eligible), in the utility's running-remainder order.
   A374: a normal OS loss is set off FIRST against race-horse profit and OS
   income taxable at special DTAA rates, then the rest.  Each walk respects
   the row's remaining income, so on any row col2+col3+col4 ≤ col1 (A375). */
const CYLA_ORDER_HP =["bus","spec","specified","os","horse","st30","stApp","st20","stDTAA","lt125","ltDTAA","osDTAA"];
const CYLA_ORDER_BUS=["hp","os","horse","osDTAA","st30","stApp","st20","stDTAA","lt125","ltDTAA"];
const CYLA_ORDER_OS =["horse","osDTAA","hp","bus","spec","specified","st30","stApp","st20","stDTAA","lt125","ltDTAA"];

/* ---- engine --------------------------------------------------------- */
function engCyla(){
  const g=o=>o||{};
  const hp=g(S.C.hp), bp=g(S.C.bp), cg=g(S.C.cg), os=g(S.C.os);
  const bpE=g(bp.e), bpA=g(bp.a), cgAfter=g(cg.after);

  /* ---- row 6 · the three current-year losses coming in --------------- */
  /* HP: full loss magnitude (Sl.No.3 of Sch HP, A360). The 2L cap of s.71(3A)
     bites on the total SET OFF (xiv col 2, A354), not on this figure. */
  const hpLoss  = R(("lossFull" in hp)?N(hp.lossFull):Math.max(0,-N(hp.total)));   /* G6 TotHPlossCurYr */
  const hpAvail = Math.min(hpLoss, CYLA_HPCAP);                                     /* set-off limited to 2,00,000 */
  const busLoss = R(("lossRemain" in bpE)?Math.max(0,N(bpE.lossRemain))            /* H6 TotBusLoss = Table-E 2v (A361) */
                    : Math.max(0,-N(bpA.A36)));
  const osLoss  = R(("loss" in os)?Math.max(0,N(os.loss)):Math.max(0,-N(os.total)));/* I6 TotOthSrcLossNoRaceHorse (A362) */

  /* ---- col 1 · income of the current year (positive only) ----------- */
  const specInc      = ("specInc" in bpE)?N(bpE.specInc):Math.max(0,N(g(bp.b).B40));
  const specifiedInc = ("specifiedInc" in bpE)?N(bpE.specifiedInc):Math.max(0,N(g(bp.c).C46));
  const inc={
    hp:Math.max(0,N(hp.total)),                                  /* i  = MAX(0, Sch HP item 3) */
    bus:Math.max(0,N(bpA.A36)),                                  /* ii = A36 of BP if positive (A372) */
    spec:Math.max(0,specInc),                                    /* iii= Table-E 3ii (A364) */
    specified:Math.max(0,specifiedInc),                          /* iv = Table-E 3iii (A365) */
    st20:Math.max(0,N(cgAfter.st20)),                            /* v  = Table-E 8ii (A376) */
    st30:Math.max(0,N(cgAfter.st30)),                            /* vi = Table-E 8iii (A366) */
    stApp:Math.max(0,N(cgAfter.stApp)),                          /* vii= Table-E 8iv (A367) */
    stDTAA:Math.max(0,N(cgAfter.stDTAA)),                        /* viii=Table-E 8v (A368) */
    lt125:Math.max(0,N(cgAfter.lt125)),                          /* ix = Table-E 8vi (A377) */
    ltDTAA:Math.max(0,N(cgAfter.ltDTAA)),                        /* x  = Table-E 8vii (A369) */
    os:Math.max(0,N(("total" in os)?os.total:0)),                /* xi = MAX(0, OS item 6) (A370) */
    horse:Math.max(0,N(os.raceHorse)),                           /* xii= OS item 8e (A371) */
    osDTAA:Math.max(0,N(os.dtaaTotal))};                         /* xiii=OS item 2e (A378) */

  /* ---- cols 2/3/4 · the set-off matrix ------------------------------ */
  const setHP={},setBus={},setOS={},remInc={},flag={};
  CYLA_ROWS.forEach(r=>{setHP[r[0]]=0;setBus[r[0]]=0;setOS[r[0]]=0;remInc[r[0]]=inc[r[0]];flag[r[0]]=r[3];});

  if(S.cyla.edit==="Y"){                                         /* row-51 manual override */
    CYLA_ROWS.forEach(r=>{const k=r[0],f=r[3],ov=g(S.cyla.over[k]);
      if(f.cyHP){setHP[k]=Math.max(0,Math.min(N(ov.hp),remInc[k]));remInc[k]-=setHP[k];}
      if(f.cyBus){setBus[k]=Math.max(0,Math.min(N(ov.bus),remInc[k]));remInc[k]-=setBus[k];}
      if(f.cyOS){setOS[k]=Math.max(0,Math.min(N(ov.os),remInc[k]));remInc[k]-=setOS[k];}});
  }else{                                                         /* auto set-off (greedy, running remainder) */
    let rem=hpAvail; CYLA_ORDER_HP.forEach(k=>{if(rem<=0||!flag[k].cyHP)return;
      const t=Math.max(0,Math.min(rem,remInc[k]));setHP[k]=t;remInc[k]-=t;rem-=t;});
    rem=busLoss;     CYLA_ORDER_BUS.forEach(k=>{if(rem<=0||!flag[k].cyBus)return;
      const t=Math.max(0,Math.min(rem,remInc[k]));setBus[k]=t;remInc[k]-=t;rem-=t;});
    rem=osLoss;      CYLA_ORDER_OS.forEach(k=>{if(rem<=0||!flag[k].cyOS)return;
      const t=Math.max(0,Math.min(rem,remInc[k]));setOS[k]=t;remInc[k]-=t;rem-=t;});
  }

  const sum=o=>CYLA_KEYS.reduce((a,k)=>a+N(o[k]),0);
  const totHPset =R(Math.max(0,Math.min(CYLA_HPCAP,sum(setHP))));      /* xiv col 2 — capped 2L (A354) */
  const totBusset=R(Math.max(0,Math.min(sum(setBus),busLoss)));       /* xiv col 3 (A355) */
  const totOSset =R(Math.max(0,Math.min(sum(setOS),osLoss)));         /* xiv col 4 (A356) */
  const balHP =R(Math.max(0,hpLoss-totHPset));                        /* xv col 2 (A357) */
  const balBus=R(Math.max(0,busLoss-totBusset));                      /* xv col 3 (A358) */
  const balOS =R(Math.max(0,osLoss-totOSset));                        /* xv col 4 (A359) */

  const after={};let gti=0;
  CYLA_ROWS.forEach(r=>{const k=r[0];
    after[k]=R(Math.max(0,inc[k]-setHP[k]-setBus[k]-setOS[k]));       /* col 5 = 1−2−3−4 (A363) */
    gti+=after[k];});

  S.C.cyla={
    inc,after,setHP,setBus,setOS,flag,
    hpLoss:R(hpLoss),busLoss:R(busLoss),osLoss:R(osLoss),
    totHPset,totBusset,totOSset,balHP,balBus,balOS,
    totalSetOff:R(totHPset+totBusset+totOSset),                       /* → Part B-TI Sl.No.12/9/8 */
    total:R(totHPset+totBusset+totOSset),                             /* SEAM: tax reads S.C.cyla.total */
    cyTotal:R(totHPset+totBusset+totOSset),                           /* SEAM: tax's secondary read S.C.cyla.cyTotal */
    gti:R(gti),                                                       /* Σ col-5 income remaining */
    editFlag:S.cyla.edit==="Y"?"Y":"N"};
  return S.C.cyla;
}

/* ---- renderer ------------------------------------------------------- */
function secCyla(){
  const L=S.C.cyla||engCyla();
  const closed='style="background:var(--closed)"';
  const ed=S.cyla.edit==="Y";
  let h="";

  h+=note("Schedule CYLA sets <b>this year's</b> house-property, business and normal other-sources losses "+
    "against this year's income, head by head. A house-property loss is set off only up to "+
    "<b>Rs 2,00,000</b> (section 71(3A)); a normal other-sources loss not set off here lapses. "+
    "Column 5 (income remaining) = column 1 − 2 − 3 − 4.");

  const sl=["i","ii","iii","iv","v","vi","vii","viii","ix","x","xi","xii","xiii"];
  h+='<div class="full"><table class="gt" style="min-width:1180px"><thead><tr>'+
     '<th class="l" style="width:34px">Sl.</th>'+
     '<th class="l" style="min-width:340px">Head / Source of Income</th>'+
     '<th style="width:130px">Income of current year (1)</th>'+
     '<th style="width:140px">HP loss set off (2)</th>'+
     '<th style="width:150px">Business loss set off (3)</th>'+
     '<th style="width:170px">OS loss set off (4)</th>'+
     '<th style="width:140px">Remaining after set-off (5)</th></tr></thead><tbody>';

  /* row 6 — loss to be adjusted (the three incoming current-year losses) */
  h+='<tr><td class="l"></td><td class="l"><b>Loss to be adjusted</b></td><td></td>'+
     '<td class="num">'+cell(-L.hpLoss)+
       (L.hpLoss>CYLA_HPCAP?'<span class="dt">set-off capped at Rs 2,00,000</span>':'')+'</td>'+
     '<td class="num">'+cell(-L.busLoss)+'</td>'+
     '<td class="num">'+cell(-L.osLoss)+'</td><td></td></tr>';

  /* the thirteen head rows */
  CYLA_ROWS.forEach((r,i)=>{const k=r[0],label=r[2],f=r[3];
    h+='<tr><td class="l">'+sl[i]+'</td><td class="l">'+esc(label)+'</td>'+
       '<td class="num">'+cell(L.inc[k])+'</td>'+
       '<td class="num"'+(f.cyHP?'':' '+closed)+'>'+(f.cyHP?(ed?inp("cyla.over."+k+".hp",{n:1}):cell(L.setHP[k])):'')+'</td>'+
       '<td class="num"'+(f.cyBus?'':' '+closed)+'>'+(f.cyBus?(ed?inp("cyla.over."+k+".bus",{n:1}):cell(L.setBus[k])):'')+'</td>'+
       '<td class="num"'+(f.cyOS?'':' '+closed)+'>'+(f.cyOS?(ed?inp("cyla.over."+k+".os",{n:1}):cell(L.setOS[k])):'')+'</td>'+
       '<td class="num">'+cell(L.after[k])+'</td></tr>';});

  h+='</tbody><tfoot>'+
     '<tr><td class="l">xiv</td><td class="l">Total loss set-off</td><td></td>'+
       '<td>'+F(L.totHPset)+'</td><td>'+F(L.totBusset)+'</td><td>'+F(L.totOSset)+'</td><td></td></tr>'+
     '<tr><td class="l">xv</td><td class="l">Loss remaining after set-off</td><td></td>'+
       '<td>'+F(L.balHP)+'<span class="dt">&rarr; CFL</span></td>'+
       '<td>'+F(L.balBus)+'<span class="dt">&rarr; CFL</span></td>'+
       '<td>'+F(L.balOS)+'<span class="dt">lapses</span></td><td></td></tr>'+
     '</tfoot></table></div>';

  if(L.totHPset>=CYLA_HPCAP && L.hpLoss>CYLA_HPCAP)
    h+=note("The house-property loss set off is at the Rs 2,00,000 ceiling of section 71(3A); "+
      "Rs "+F(L.hpLoss-CYLA_HPCAP)+" of the loss is not relieved here and carries under Schedule CFL.","warn");

  h+=row("Do you want to edit the details auto-populated in the table above?",
    sel("cyla.edit",[["","No"],["Y","Yes"]],{blank:false}),{ref:"CYLA"});
  if(ed)h+=note("Editing is on. The two-lakh house-property cap, the col 2 + 3 + 4 &le; col 1 check and "+
    "the col-5 identity are enforced against the figures you enter.");

  return h;
}

/* ---- export --------------------------------------------------------- */
/* Writes the ScheduleCYLA block.  Fixed matrix — every live head object gets
   its required IncCYLA leaves (IncOfCurYrUnderThatHead + IncOfCurYrAfterSetOff)
   and the set-off leaves that exist on that row.  put() writes 0 (only skips
   undefined/""), so the schema-required leaves are always present. */
function expCyla(j){
  const L=S.C.cyla||engCyla();
  /* emit only when the matrix carries something (income or a loss) */
  const any=CYLA_KEYS.some(k=>N(L.inc[k])>0) || L.hpLoss>0 || L.busLoss>0 || L.osLoss>0;
  if(!any) return;

  const B="ScheduleCYLA.";
  CYLA_ROWS.forEach(r=>{const k=r[0],obj=r[1],f=r[3],p=B+obj+".IncCYLA.";
    put(j,p+"IncOfCurYrUnderThatHead",n0(L.inc[k]));
    if(f.cyHP)  put(j,p+"HPlossCurYrSetoff",n0(L.setHP[k]));
    if(f.cyBus) put(j,p+"BusLossSetoff",n0(L.setBus[k]));
    if(f.cyOS)  put(j,p+"OthSrcLossNoRaceHorseSetoff",n0(L.setOS[k]));
    put(j,p+"IncOfCurYrAfterSetOff",n0(L.after[k]));});

  put(j,B+"TotalCurYr.TotHPlossCurYr",n0(L.hpLoss));
  put(j,B+"TotalCurYr.TotBusLoss",n0(L.busLoss));
  put(j,B+"TotalCurYr.TotOthSrcLossNoRaceHorse",n0(L.osLoss));

  put(j,B+"TotalLossSetOff.TotHPlossCurYrSetoff",n0(L.totHPset));
  put(j,B+"TotalLossSetOff.TotBusLossSetoff",n0(L.totBusset));
  put(j,B+"TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff",n0(L.totOSset));

  put(j,B+"LossRemAftSetOff.BalHPlossCurYrAftSetoff",n0(L.balHP));
  put(j,B+"LossRemAftSetOff.BalBusLossAftSetoff",n0(L.balBus));
  put(j,B+"LossRemAftSetOff.BalOthSrcLossNoRaceHorseAftSetoff",n0(L.balOS));

  put(j,B+"CYLAEditFlag",L.editFlag);
}

/* ---- import --------------------------------------------------------- */
/* Round-trips the override switch and (when on) the manual set-off cells.
   The auto matrix itself recomputes from the income heads, so only the
   person-set state is seeded. */
function impCyla(I7){
  const read=[];
  const cy=I7&&I7.ScheduleCYLA;
  if(!cy)return read;
  S.cyla.edit=(cy.CYLAEditFlag==="Y")?"Y":"";
  if(S.cyla.edit==="Y"){
    S.cyla.over={};
    CYLA_ROWS.forEach(r=>{const k=r[0],f=r[3],b=(cy[r[1]]||{}).IncCYLA;if(!b)return;
      const o={};
      if(f.cyHP) o.hp=N(b.HPlossCurYrSetoff);
      if(f.cyBus)o.bus=N(b.BusLossSetoff);
      if(f.cyOS) o.os=N(b.OthSrcLossNoRaceHorseSetoff);
      S.cyla.over[k]=o;});
  }
  read.push("Schedule CYLA");
  return read;
}

/* ---- checks --------------------------------------------------------- */
function chkCyla(){
  const out=[];
  const L=S.C.cyla||engCyla();
  const add=(lvl,t,m)=>out.push({lvl,t,m,sec:"cyla"});

  /* A354 — HP set-off cap */
  if(L.totHPset>CYLA_HPCAP)
    add("err","House-property set-off cap","The current-year house-property loss set off (Rs "+F(L.totHPset)+
      ") exceeds the Rs 2,00,000 limit of section 71(3A).");

  /* A375 — on any row, cols 2+3+4 shall not exceed col 1 */
  const bad=CYLA_KEYS.filter(k=>N(L.setHP[k])+N(L.setBus[k])+N(L.setOS[k])>N(L.inc[k])+1);
  if(bad.length)
    add("err","Set-off exceeds income","A head's total set-off (columns 2 + 3 + 4) cannot exceed its income (column 1).");

  /* A355 / A356 — a set-off column total cannot exceed the loss to be adjusted */
  if(L.totBusset>L.busLoss+1)
    add("err","Business set-off exceeds loss","The business loss set off (Rs "+F(L.totBusset)+
      ") exceeds the business loss to be adjusted (Rs "+F(L.busLoss)+").");
  if(L.totOSset>L.osLoss+1)
    add("err","Other-sources set-off exceeds loss","The other-sources loss set off (Rs "+F(L.totOSset)+
      ") exceeds the other-sources loss to be adjusted (Rs "+F(L.osLoss)+").");

  /* informational */
  if(L.totalSetOff>0)
    add("ok","Current-year losses set off","Rs "+F(L.totalSetOff)+" of this year's losses set against other heads in Schedule CYLA.");
  if(L.hpLoss>CYLA_HPCAP)
    add("ok","House-property loss over Rs 2 lakh","Rs "+F(L.hpLoss-CYLA_HPCAP)+" of the house-property loss is beyond the two-lakh set-off ceiling and carries under Schedule CFL.");
  const lapse=L.balOS;
  if(lapse>0)
    add("warn","Other-sources loss lapses","Rs "+F(lapse)+" of the normal other-sources loss could not be set off and lapses (it is not carried forward).");

  return out;
}

/* ---- register (overrides the boot stub) ---- */
reg({id:"cyla", t:"Current-year loss set-off", ref:"Schedule CYLA",
  f:secCyla,
  s:()=>{const L=S.C.cyla||{};return L.totalSetOff?"Set off "+CR(L.totalSetOff):"";},
  eng:engCyla, exp:expCyla, imp:impCyla, chk:chkCyla, order:110, corder:50});
