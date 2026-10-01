/* ==================================================================
   CYLA · BFLA · CFL — the utility's own algorithm (see the build spec)
   ================================================================== */
const CFL_YEARS=[["2018-19","LossCFFromPrev8thYearFromAY",false],["2019-20","LossCFFromPrev7thYearFromAY",false],
 ["2020-21","LossCFFromPrev6thYearFromAY",false],["2021-22","LossCFFromPrev5thYearFromAY",false],
 ["2022-23","LossCFFromPrev4thYearFromAY",true],["2023-24","LossCFFromPrev3rdYearFromAY",true],
 ["2024-25","LossCFFromPrev2ndYearFromAY",true],["2025-26","LossCFFromPrevYrToAY",true]];
/* the eleven live rows, with the schema key of each */
const LOSS_ROWS=[["sal","Salaries","Salary",{hp:1,os:1,bf:0}],
 ["hp","House property","HP",{hp:0,os:1,bf:"hp"}],
 ["st20","Short-term capital gain taxable at 20%","STCG20Per",{hp:1,os:1,bf:"st"}],
 ["st30","Short-term capital gain taxable at 30%","STCG30Per",{hp:1,os:1,bf:"st"}],
 ["stApp","Short-term capital gain taxable at applicable rates","STCGAppRate",{hp:1,os:1,bf:"st"}],
 ["stDTAA","Short-term capital gain taxable at special rates as per DTAA","STCGDTAARate",{hp:1,os:1,bf:"st"}],
 ["lt125","Long-term capital gain taxable at 12.5%","LTCG12_5Per",{hp:1,os:1,bf:"lt"}],
 ["ltDTAA","Long-term capital gain taxable at special rates as per DTAA","LTCGDTAARate",{hp:1,os:1,bf:"lt"}],
 ["os","Net income from other sources chargeable at normal applicable rates","OthSrcExclRaceHorse",{hp:1,os:0,bf:0}],
 ["horse","Profit from activity of owning and maintaining race horses","OthSrcRaceHorse",{hp:1,os:1,bf:"horse"}],
 ["osDTAA","Income from other sources taxable at special rates as per DTAA","IncOSDTAA",{hp:1,os:1,bf:0}]];
/* the walk orders, from the S/O and U/Q formula chains plus the Feb-25 VBA additions */
const ORDER_HP=["sal","os","horse","st30","stApp","st20","lt125","stDTAA","ltDTAA","osDTAA"];
const ORDER_OS=["horse","sal","hp","st30","stApp","st20","lt125","stDTAA","ltDTAA","osDTAA"];
const ORDER_BF_ST=["st30","stApp","st20","stDTAA","lt125","ltDTAA"];
const ORDER_BF_LT=["lt125","ltDTAA"];

function engTableF(){
  const cg=S.C.cg,L=S.C.loss,C=S.cg||{};if(!cg.on)return;
  const KEYS=["st20","st30","stApp","stDTAA","lt125","ltDTAA"];const Fauto={};KEYS.forEach(k=>Fauto[k]=[0,0,0,0,0]);
  (C.land||[]).forEach(p=>{if(!p._)return;const q=qtrOf(p.sale);const k=p._.isLT?"lt125":"stApp";if(p._.gain>0)Fauto[k][q]+=p._.gain;});
  KEYS.forEach(k=>{const target=Math.max(0,L.afterB[k]||0);const sum=Fauto[k].reduce((a,x)=>a+x,0);
    if(sum<target)Fauto[k][3]+=target-sum;
    else if(sum>target){const f=sum?target/sum:0;Fauto[k]=Fauto[k].map(x=>R(x*f));const d=target-Fauto[k].reduce((a,x)=>a+x,0);Fauto[k][3]+=d;}});
  cg.Fauto=Fauto;cg.F={};KEYS.forEach(k=>{const ov=(C.Fover||{})[k];cg.F[k]=(C.editF&&ov&&ov.some(x=>st0(x)!==""))?ov.map(x=>N(x)):Fauto[k];});
}
function engLoss(){
  const hp=S.C.hp,cg=S.C.cg,os=S.C.os,L=S.loss||{};
  /* ---- inputs (spec §1) ---- */
  const hpTotal=Math.max(0,-hp.income);                              /* G6 */
  const hpCapped=isNew()?0:Math.min(hpTotal,200000);                 /* HP.REStwolakh */
  const hpExcess=Math.max(0,hpTotal-200000);                         /* HP.REMloss */
  const osLoss=os.loss||0;                                           /* I6 */
  const inc={sal:Math.max(0,S.C.sal.income),hp:Math.max(0,hp.income),
    st20:Math.max(0,cg.after.st20||0),st30:Math.max(0,cg.after.st30||0),stApp:Math.max(0,cg.after.stApp||0),
    stDTAA:Math.max(0,cg.after.stDTAA||0),lt125:Math.max(0,cg.after.lt125||0),ltDTAA:Math.max(0,cg.after.ltDTAA||0),
    os:Math.max(0,os.income||0),horse:Math.max(0,os.horse?os.horse.bal:0),osDTAA:Math.max(0,os.sp?os.sp.dtaa-os.sp.dtaaNotTax:0)};
  /* ---- CYLA (spec §2) ---- */
  const setHP={},setOS={};LOSS_ROWS.forEach(r=>{setHP[r[0]]=0;setOS[r[0]]=0;});
  const over=L.editC&&L.cylaOver;
  if(over){LOSS_ROWS.forEach(r=>{const o=L.cylaOver[r[0]]||{};if(r[3].hp)setHP[r[0]]=Math.min(N(o.hp),inc[r[0]]);
      if(r[3].os)setOS[r[0]]=Math.min(N(o.os),inc[r[0]]-setHP[r[0]]);});}
  else{
    let remHP=hpCapped;ORDER_HP.forEach(k=>{if(remHP<=0)return;const take=Math.min(remHP,Math.max(0,inc[k]-setOS[k]));setHP[k]=take;remHP-=take;});
    let remOS=osLoss;ORDER_OS.forEach(k=>{if(remOS<=0)return;const take=Math.min(remOS,Math.max(0,inc[k]-setHP[k]));setOS[k]=take;remOS-=take;});
  }
  const totHPset=Math.min(Object.values(setHP).reduce((a,v)=>a+v,0),hpTotal,200000);   /* G25 */
  const totOSset=Object.values(setOS).reduce((a,v)=>a+v,0);                            /* I25 */
  const hpRemain=isNew()?0:(totHPset<200000?Math.max(0,(hpCapped-totHPset)+hpExcess):hpExcess); /* G26 */
  const osRemain=Math.max(0,osLoss-totOSset);                                          /* I26 — lapses */
  const afterC={};LOSS_ROWS.forEach(r=>{afterC[r[0]]=R(inc[r[0]]-setHP[r[0]]-setOS[r[0]]);});
  /* ---- CFL brought forward (spec §4) ---- */
  const cfl=(L.cfl||{});const yr=y=>cfl[y]||{};
  const bf={hp:0,st:0,lt:0,horse:0};
  CFL_YEARS.forEach(([y,key,horseOK])=>{const r=yr(y);bf.hp+=N(r.hp);bf.st+=N(r.st);bf.lt+=N(r.lt);if(horseOK)bf.horse+=N(r.horse);});
  /* ---- BFLA (spec §3) ---- */
  const setBF={};LOSS_ROWS.forEach(r=>setBF[r[0]]=0);
  const overB=L.editB&&L.bflaOver;
  if(overB){LOSS_ROWS.forEach(r=>{if(r[3].bf)setBF[r[0]]=Math.min(N((L.bflaOver||{})[r[0]]),afterC[r[0]]);});}
  else{
    setBF.hp=Math.min(bf.hp,afterC.hp);
    /* long-term loss first on the long slots */
    let remLT=bf.lt;ORDER_BF_LT.forEach(k=>{if(remLT<=0)return;const t=Math.min(remLT,afterC[k]-setBF[k]);setBF[k]+=t;remLT-=t;});
    let remST=bf.st;ORDER_BF_ST.forEach(k=>{if(remST<=0)return;const t=Math.min(remST,afterC[k]-setBF[k]);setBF[k]+=t;remST-=t;});
    setBF.horse=Math.min(bf.horse,afterC.horse);
  }
  const usedBF={hp:setBF.hp,horse:setBF.horse,st:0,lt:0};
  {let lt=0,st=0;const ltUsed=Math.min(bf.lt,ORDER_BF_LT.reduce((a,k)=>a+setBF[k],0));lt=ltUsed;
    st=Math.min(bf.st,ORDER_BF_ST.reduce((a,k)=>a+setBF[k],0)-ltUsed);usedBF.lt=Math.max(0,lt);usedBF.st=Math.max(0,st);}
  const afterB={};let gti=0;LOSS_ROWS.forEach(r=>{afterB[r[0]]=R(afterC[r[0]]-setBF[r[0]]);gti+=afterB[r[0]];});
  const totBFset=Object.values(setBF).reduce((a,v)=>a+v,0);
  /* the three VBA validators */
  const val=[];
  const stSet=ORDER_BF_ST.slice(0,4).reduce((a,k)=>a+setBF[k],0),ltSet=ORDER_BF_LT.reduce((a,k)=>a+setBF[k],0);
  if(stSet>bf.st+1)val.push("Losses set off against short-term gains cannot be more than the short-term loss brought forward in Schedule CFL.");
  if(ltSet>bf.st+bf.lt+1)val.push("Losses set off against long-term gains cannot be more than the losses brought forward in Schedule CFL.");
  const avail=(bf.st+bf.lt)-(usedBF.st+usedBF.lt),standing=ORDER_BF_ST.reduce((a,k)=>a+afterB[k],0);
  if(overB&&avail>1&&standing>1)val.push("Maximum losses has not been set off — brought-forward capital loss is still available while capital gain is still standing.");
  /* ---- CFL current year and the lapse rule (spec §4) ---- */
  const curr={hp:hpRemain,st:R(Object.keys(cg.loss||{}).filter(k=>!k.startsWith("lt")).reduce((a,k)=>a+((cg.loss[k]||0)-(cg.used[k]||0)),0)),
    lt:R(Object.keys(cg.loss||{}).filter(k=>k.startsWith("lt")).reduce((a,k)=>a+((cg.loss[k]||0)-(cg.used[k]||0)),0)),horse:os.horseLoss||0};
  const oldest={hp:N(yr("2018-19").hp),st:N(yr("2018-19").st),lt:N(yr("2018-19").lt),horse:N(yr("2022-23").horse)};
  const cf={};["hp","st","lt","horse"].forEach(k=>{cf[k]=Math.max(0,bf[k]-Math.max(usedBF[k],oldest[k])+curr[k]);});
  const lapsed={};["hp","st","lt","horse"].forEach(k=>{lapsed[k]=Math.max(0,oldest[k]-usedBF[k]);});
  cf.total=cf.hp+cf.st+cf.lt+cf.horse;
  return {inc,hpTotal:R(hpTotal),hpCapped:R(hpCapped),hpExcess:R(hpExcess),osLoss:R(osLoss),
    setHP,setOS,totHPset:R(totHPset),totOSset:R(totOSset),hpRemain:R(hpRemain),osRemain:R(osRemain),afterC,
    bf,setBF,usedBF,totBFset:R(totBFset),afterB,gti:R(gti),val,curr,oldest,cf,lapsed,
    /* what the rest of the engine reads */
    after:{hp:afterB.hp,stcg:afterB.st20+afterB.st30+afterB.stApp+afterB.stDTAA,ltcg:afterB.lt125+afterB.ltDTAA,os:afterB.os},
    cur:{hp:hp.income,os:os.income-(os.loss||0),stcg:cg.shortTerm,ltcg:cg.longTerm},
    cyla:{hp:R(totHPset),os:R(totOSset)},cylaTotal:R(totHPset+totOSset),bflaTotal:R(totBFset),
    cfOld:{hp:cf.hp,stcl:cf.st,ltcl:cf.lt,ud:0,horse:cf.horse,total:cf.total}};
}

/* ---------------- 8 · Losses — CYLA · BFLA · CFL, from the utility --- */
function secLoss(){
  const L=S.C.loss,X=S.loss||{};let h="";
  /* ===== CYLA ===== */
  h+='<div class="cgband">Schedule CYLA — Details of income after set-off of current year\'s losses</div>';
  h+=note("This year's house-property loss and other-sources loss are set against the other heads, in the "+
    "order the utility uses. A house-property loss goes against other heads only up to ₹2,00,000"+
    (isNew()?" — and not at all under the new regime":"")+"; the excess goes straight to Schedule CFL. "+
    "An other-sources loss not set off here lapses.");
  const ed=!!X.editC;
  h+='<div class="full"><table class="gt" style="min-width:1060px"><thead><tr><th class="l" style="width:34px">Sl.</th>'+
     '<th class="l" style="min-width:300px">Head / source of income</th><th style="width:130px">Income of current year — positive only</th>'+
     '<th style="width:150px">House property loss of the current year set off</th><th style="width:150px">Net loss from other sources at normal rates set off</th>'+
     '<th style="width:130px">Current year\'s income remaining after set-off</th></tr></thead><tbody>';
  h+='<tr><td class="l">i</td><td class="l"><b>Loss to be set off — negative figures only</b></td><td></td>'+
     '<td class="num">'+cell(-L.hpCapped)+(L.hpExcess?'<span class="dt">+ '+F(L.hpExcess)+' over ₹2 lakh, to CFL</span>':'')+'</td>'+
     '<td class="num">'+cell(-L.osLoss)+'</td><td></td></tr>';
  const sl=["ii","iii","iv","v","vi","vii","viii","ix","x","xi","xii"];
  LOSS_ROWS.forEach((r,i)=>{const [k,label,,f]=r;
    h+='<tr><td class="l">'+sl[i]+'</td><td class="l">'+esc(label)+'</td><td class="num">'+cell(L.inc[k])+'</td>'+
       '<td class="num"'+(f.hp?'':' style="background:var(--closed)"')+'>'+(f.hp?(ed?inp("loss.cylaOver."+k+".hp",{n:1}):cell(L.setHP[k])):'')+'</td>'+
       '<td class="num"'+(f.os?'':' style="background:var(--closed)"')+'>'+(f.os?(ed?inp("loss.cylaOver."+k+".os",{n:1}):cell(L.setOS[k])):'')+'</td>'+
       '<td class="num">'+cell(L.afterC[k])+'</td></tr>';});
  h+='</tbody><tfoot><tr><td class="l">xiii</td><td class="l">Total loss set-off (ii to xii)</td><td></td><td>'+F(L.totHPset)+'</td><td>'+F(L.totOSset)+'</td><td></td></tr>'+
     '<tr><td class="l">xiv</td><td class="l">Loss remaining after set-off (i − xiii)</td><td></td><td>'+F(L.hpRemain)+'<span class="dt">to CFL</span></td><td>'+F(L.osRemain)+'<span class="dt">lapses</span></td><td></td></tr></tfoot></table></div>';
  h+=row("Do you want to edit the details auto-populated in the table above?",sel("loss.editC",[["","No"],["1","Yes"]],{blank:false}));
  /* ===== BFLA ===== */
  h+='<div class="cgband">Schedule BFLA — Details of income after set-off of brought-forward losses of earlier years</div>';
  h+=note("Losses brought forward from Schedule CFL, set against what is left after CYLA. A house-property loss "+
    "against house-property income only; a short-term capital loss against any capital gain; a long-term loss "+
    "against long-term gains only, and it goes first; a race-horse loss against race-horse income only. Nothing "+
    "against salary or the other-sources rows.");
  const edB=!!X.editB;
  h+='<div class="full"><table class="gt" style="min-width:960px"><thead><tr><th class="l" style="width:34px">Sl.</th>'+
     '<th class="l" style="min-width:300px">Head / source of income</th><th style="width:150px">Income after set-off of current year\'s losses — 5 of CYLA</th>'+
     '<th style="width:150px">Brought forward loss set off</th><th style="width:150px">Current year\'s income remaining after set-off</th></tr></thead><tbody>';
  const slB=["i","ii","iii","iv","v","vi","vii","viii","ix","x","xi"];
  LOSS_ROWS.forEach((r,i)=>{const [k,label,,f]=r;
    h+='<tr><td class="l">'+slB[i]+'</td><td class="l">'+esc(label)+'</td><td class="num">'+cell(L.afterC[k])+'</td>'+
       '<td class="num"'+(f.bf?'':' style="background:var(--closed)"')+'>'+(f.bf?(edB?inp("loss.bflaOver."+k,{n:1}):cell(L.setBF[k])):'')+'</td>'+
       '<td class="num">'+cell(L.afterB[k])+'</td></tr>';});
  h+='</tbody><tfoot><tr><td class="l">xii</td><td class="l">Total of brought forward loss set off</td><td></td><td>'+F(L.totBFset)+'</td><td></td></tr>'+
     '<tr><td class="l">xiii</td><td class="l">Current year\'s income remaining after set-off — gross total income</td><td></td><td></td><td>'+F(L.gti)+'</td></tr></tfoot></table></div>';
  h+=row("Do you want to edit the details auto-populated in the table above?",sel("loss.editB",[["","No"],["1","Yes"]],{blank:false}));
  (L.val||[]).forEach(m=>h+=note(m,"stop"));
  /* ===== CFL ===== */
  h+='<div class="cgband">Schedule CFL — Details of losses to be carried forward to future years</div>';
  h+=note("One row per assessment year. The date of filing is required on any year that carries a loss — a loss "+
    "carries only if that year's return was filed in time. A race-horse loss carries four years, so its column "+
    "exists only on the last four rows. Dates are "+DF+".");
  h+='<div class="full"><table class="gt" style="min-width:1000px"><thead><tr><th class="l" style="width:34px">Sl.</th>'+
     '<th class="l" style="width:110px">Assessment year</th><th class="l" style="width:130px">Date of filing '+DF+'</th>'+
     '<th style="width:150px">House property loss</th><th style="width:150px">Short-term capital loss</th>'+
     '<th style="width:150px">Long-term capital loss</th><th style="width:170px">Loss from owning and maintaining race horses</th></tr></thead><tbody>';
  const slC=["i","ii","iii","iv","v","vi","vii","viii"];
  CFL_YEARS.forEach(([y,,horseOK],i)=>{const p="loss.cfl."+y+".";
    h+='<tr><td class="l">'+slC[i]+'</td><td class="l">'+y+'</td><td>'+inp(p+"dt",{ph:DF,max:10})+'</td>'+
       '<td>'+inp(p+"hp",{n:1})+'</td><td>'+inp(p+"st",{n:1})+'</td><td>'+inp(p+"lt",{n:1})+'</td>'+
       '<td'+(horseOK?'':' style="background:var(--closed)"')+'>'+(horseOK?inp(p+"horse",{n:1}):'')+'</td></tr>';});
  h+='</tbody><tfoot>'+
     '<tr><td class="l">ix</td><td class="l" colspan="2">Total of earlier year losses</td><td>'+F(L.bf.hp)+'</td><td>'+F(L.bf.st)+'</td><td>'+F(L.bf.lt)+'</td><td>'+F(L.bf.horse)+'</td></tr>'+
     '<tr><td class="l">x</td><td class="l" colspan="2">Adjustment of above losses in Schedule BFLA</td><td>'+F(L.usedBF.hp)+'</td><td>'+F(L.usedBF.st)+'</td><td>'+F(L.usedBF.lt)+'</td><td>'+F(L.usedBF.horse)+'</td></tr>'+
     '<tr><td class="l">xi</td><td class="l" colspan="2">2026-27 — current year losses</td><td>'+F(L.curr.hp)+'</td><td>'+F(L.curr.st)+'</td><td>'+F(L.curr.lt)+'</td><td>'+F(L.curr.horse)+'</td></tr>'+
     '<tr><td class="l">xii</td><td class="l" colspan="2">Total loss carried forward to future years</td><td>'+F(L.cf.hp)+'</td><td>'+F(L.cf.st)+'</td><td>'+F(L.cf.lt)+'</td><td>'+F(L.cf.horse)+'</td></tr></tfoot></table></div>';
  const lp=["hp","st","lt","horse"].filter(k=>L.lapsed[k]>0);
  if(lp.length)h+=note("<b>Lapsed this year:</b> "+lp.map(k=>({hp:"house property",st:"short-term capital",lt:"long-term capital",horse:"race horse"})[k]+" "+RS(L.lapsed[k])).join(", ")+
    " — the "+(lp.indexOf("horse")>=0&&lp.length===1?"2022-23":"2018-19")+" loss that BFLA did not use has reached the end of its window.","warn");
  return h;
}
