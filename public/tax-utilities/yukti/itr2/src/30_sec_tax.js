/* ==================================================================
   TAX — Part B-TTI lines 2 to 7, the utility's formulas (book 08)
   ================================================================== */
function slabTax(inc,bands){let t=0,l=0;for(const [u,r] of bands){if(inc>l)t+=(Math.min(inc,u)-l)*r/100;l=u;if(inc<=u)break;}return R(t);}
function bandsFor(){return isNew()?SLAB_NEW:(S.pi.status==="I"&&S.pi.res!=="NRI"?(superSr()?SLAB_SSR:senior()?SLAB_SR:SLAB_OLD):SLAB_OLD);}
function taxPlusSurchargeAt(ti,splTax,cgDivTax,bbeTax,normalInc){
  /* tax + surcharge at a given total income, used for the marginal-relief cutoff comparison */
  const normalTax=slabTax(normalInc,bandsFor());const taxOn=normalTax+splTax;
  const scr= ti>50000000?(isNew()?25:37): ti>20000000?25: ti>10000000?15: ti>5000000?10:0;
  const capRate=Math.min(scr,15);
  const other=taxOn-cgDivTax-bbeTax;
  return {taxOn,sur:R(other*scr/100+cgDivTax*capRate/100+bbeTax*0.25),scr,capRate};
}
function engTax(){
  const SI=S.C.si,ti=S.C.ti,splInc=SI.totInc,splTax=SI.totTax;
  const normalInc=Math.max(0,ti-splInc);
  const bands=bandsFor();
  /* line 15 of B-TI — agricultural income for rate, only if normal income exceeds the exemption */
  const agri=S.C.eiAgri||0,exempt=exemptionLimit();
  const aggFlag=normalInc>exempt&&agri>5000;
  const normalTax=slabTax(aggFlag?normalInc+agri:normalInc,bands);
  const agriRebate=aggFlag?slabTax(exempt+agri,bands):0;                 /* 2c */
  const taxOn=Math.max(0,normalTax+splTax-agriRebate);                     /* 2d */
  /* 3 — rebate 87A, as P80 / N65 */
  let rebate=0,marginal=0;
  if(S.pi.status==="I"&&S.pi.res!=="NRI"){
    if(isNew()){if(ti<=1200000)rebate=Math.min(taxOn,60000);
      else{const slabOnly=normalTax;const excess=ti-1200000;if(slabOnly>excess){marginal=slabOnly-excess;rebate=Math.min(taxOn,marginal);}}}
    else if(ti<=500000)rebate=Math.min(taxOn-SI.tax112A-SI.tax115AD,12500);}
  rebate=Math.max(0,R(rebate));
  const after=Math.max(0,taxOn-rebate);                                      /* 4 */
  /* 5 — surcharge: 25% on 115BBE (never relieved) + tiered on the rest, 15% cap on CG/dividend, marginal relief at four thresholds */
  const bbeTax=SI.bbeTax,cgDivTax=SI.cgDivTax;
  const here=taxPlusSurchargeAt(ti,splTax,cgDivTax,bbeTax,normalInc);
  let surII=R((after-bbeTax-cgDivTax)*here.scr/100+cgDivTax*here.capRate/100),surI=R(bbeTax*0.25),mr=0;
  const thresholds=[5000000,10000000,20000000,50000000];
  for(const th of thresholds){if(ti>th){
    const cut=taxPlusSurchargeAt(th,Math.min(splTax,th),Math.min(cgDivTax,th),bbeTax,Math.max(0,th-splInc));
    const excessInc=ti-th;const hereTot=after+surII;const cutTot=cut.taxOn+cut.sur;
    const relief=Math.max(0,hereTot-cutTot-excessInc);
    if(relief>mr){mr=relief;}}}
  surII=Math.max(0,surII-mr);
  const sur=surI+surII;                                                       /* 5B(iv) */
  const cess=R((after+sur)*0.04);                                             /* 6 */
  const gross=R(after+sur+cess);                                              /* 7 */
  return {bands,normalInc:R(normalInc),normalTax,agri:R(agri),aggFlag,agriRebate:R(agriRebate),splInc,splTax,taxOn:R(taxOn),
    rebate,marginal:R(marginal),after:R(after),scr:here.scr,scrCap:here.capRate,surI,surII:R(surII),mr:R(mr),sur:R(sur),cess,gross,
    regime:isNew()?"New":"Old",age:age()};
}
/* ==================================================================
   AMT · AMTC (book 03)
   ================================================================== */
function engAMT(){
  const V=S.C.via,partC=(V.out.c80qqb||0)+(V.out.c80rrb||0);
  const adjusted=S.C.ti+partC;
  const applies=!isNew()&&partC>0&&adjusted>2000000;
  const amt=applies?R(adjusted*0.185):0;
  const scr=adjusted>50000000?37:adjusted>20000000?25:adjusted>10000000?15:adjusted>5000000?10:0;
  const sur=R(amt*scr/100),cess=R((amt+sur)*0.04),total=R(amt+sur+cess);
  return {partC:R(partC),adjusted:R(adjusted),applies,amt,sur,cess,total};
}
function engAMTC(){
  const AM=S.C.amt,T=S.C.tax;const tax115JC=AM.total,taxOther=T.gross;
  const avail=Math.max(0,taxOther-tax115JC);                                   /* 3 */
  const rows=AMTC_YRS.map(y=>{const r=(S.amtc||{})[y]||{};const g=N(r.gross),so=N(r.setoff);return {y,gross:g,setoff:so,bf:Math.max(0,g-so),used:0,cf:0};});
  let rem=avail;rows.forEach(r=>{const u=Math.min(rem,r.bf);r.used=u;rem-=u;r.cf=r.bf-u;});
  const curr=Math.max(0,tax115JC-taxOther);                                     /* xiv */
  const used=R(rows.reduce((a,r)=>a+r.used,0));
  return {tax115JC,taxOther,avail:R(avail),rows,curr:R(curr),used,cfTotal:R(rows.reduce((a,r)=>a+r.cf,0)+curr),
    gross:R(rows.reduce((a,r)=>a+r.gross,0)),setoff:R(rows.reduce((a,r)=>a+r.setoff,0)),bf:R(rows.reduce((a,r)=>a+r.bf,0))};
}
/* ==================================================================
   INTEREST — 234A/B/C/F/I, the Tax Calculated and IT sheets (book 09,
   verified cell by cell — see the verification report)
   ================================================================== */
function monthsBetween(a,b){if(!a||!b||b<=a)return 0;let m=(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth());if(b.getDate()>a.getDate())m++;return Math.max(1,m);}
/* the instalment cutoffs the utility uses (IT sheet X7): 16 Jun · 20 Sep · 15 Dec · 16 Mar; 17–31 Mar is the fifth slot.
   The utility's July→Q1 quirk is not copied. */
const Q_CUT=[new Date(2025,5,16),new Date(2025,8,20),new Date(2025,11,15),new Date(2026,2,16)];
function qtrOf(d){const x=D(d);if(!x)return 0;for(let i=0;i<4;i++)if(x<=Q_CUT[i])return i;return 4;}
function engInt(){
  const T=S.C.tax,P=S.C.paid,AM=S.C.amt,AC=S.C.amtc,SI=S.C.si,cg=S.C.cg,os=S.C.os;
  const dueDate=D(S.fs.dueExt)||DUE;
  const filed=D(S.fs.filed);
  /* 234A runs to the original return's date for a revised or defective return (B12) */
  const endA=([17,18].indexOf(+S.fs.sec)>=0&&D(S.fs.origdate))?D(S.fs.origdate):filed;
  const late=!!(endA&&endA>dueDate);
  const grossPayable=Math.max(T.gross,AM.total);                                  /* 8 */
  const esopDef=N((S.esop||{}).deferNow),esopDue=S.C.esopDue||0;
  const credit=(T.gross>AM.total)?AC.used:0;                                      /* 9 */
  const afterCredit=Math.max(0,grossPayable-esopDef+esopDue-credit);              /* 10 */
  const rel89=N(S.tax.s89),rel90=S.pi.res==="NRI"?0:(S.C.trDTAA||0),rel91=S.pi.res==="NRI"?0:(S.C.trNoDTAA||0);   /* a non-resident gets no Schedule-TR relief (rules 526/527) */
  const relief=R(rel89+rel90+rel91);                                              /* 11d */
  const net=Math.max(0,R(afterCredit-relief));                                    /* 12 */
  const satIn=(a,b)=>(S.it||[]).filter(c=>P.isSAT(c)&&D(c.dt)&&D(c.dt)>=a&&D(c.dt)<=b).reduce((s,c)=>s+N(c.amt),0);
  /* ---- 234A: principal net of SAT paid on or before the due date (matchedSAT = IT_Sat Apr–Jul + ExSAT) ---- */
  const matchedSAT=satIn(new Date(2026,3,1),dueDate);
  let p234a=Math.max(0,net-P.adv-P.tds-P.tcs-matchedSAT);if(p234a>100)p234a=Math.floor(p234a/100)*100;
  const m234a=late?monthsBetween(dueDate,endA):0;const i234a=R(p234a*0.01*m234a);
  /* ---- 234F / 234-I ---- */
  const f234f=late?(S.C.ti<=500000?1000:5000):0;
  const f234i=(+S.fs.sec===17)?Math.min(99999,N(S.tax.f234i)):0;
  /* ---- 234C: tax on income cumulative to each instalment (rows 117–130), or the flat AMT base (rows 271–275) ---- */
  const taxDueBase=Math.max(0,net-P.tds-P.tcs);   /* C271: base − TDS − TCS − relief */
  const amtCase=AM.applies&&AM.total>T.gross;
  const seniorRes=S.pi.res!=="NRI"&&S.pi.status==="I"&&senior();
  const cum=(arr,k)=>arr.slice(0,k+1).reduce((a,v)=>a+v,0);
  /* tracked special-rate income by quarter: the six CG slots (Table F) and the OS item-10 rows */
  const F=cg.F||{},Q=os.Q||{};
  const cgQ=k=>({st20:cum(F.st20||[0,0,0,0,0],k),st30:cum(F.st30||[0,0,0,0,0],k),stApp:cum(F.stApp||[0,0,0,0,0],k),stDTAA:cum(F.stDTAA||[0,0,0,0,0],k),lt125:cum(F.lt125||[0,0,0,0,0],k),ltDTAA:cum(F.ltDTAA||[0,0,0,0,0],k)});
  const lotQ=k=>cum(Q.lottery||[0,0,0,0,0],k)+cum(Q.online||[0,0,0,0,0],k);
  const divQ=k=>cum(Q.div1ai||[0,0,0,0,0],k)+cum(Q.div1aiii||[0,0,0,0,0],k);
  const totalStApp=cum(F.stApp||[0,0,0,0,0],4),totalDivNormal=cum(Q.div1ai||[0,0,0,0,0],4)+cum(Q.div1aiii||[0,0,0,0,0],4),totalLot=lotQ(4);
  /* untracked special income (115BBE, the 2d natures, PF 111, PTI …) accrues from Q1 */
  const untrackedSpl=Math.max(0,SI.totInc-(cgQ(4).st20+cgQ(4).st30+cgQ(4).stDTAA+cgQ(4).lt125+cgQ(4).ltDTAA)-totalLot);
  const untrackedSplTax=Math.max(0,SI.totTax-SI.rows.filter(r=>["1A","5ADii","DTAASTCG","2A","21","22","DTAALTCG","5BB","5BBJ","5ADiiiP","21ciii","PTI_STCG20P","PTI_STCG30P","PTI_LTCG12_5P112A","PTI_LTCG12_5P"].indexOf(r.code)>=0).reduce((a,r)=>a+r.tax,0));
  const exemptLim=exemptionLimit();
  const normalTotal=T.normalInc;   /* includes the applicable-rate CG and normal-rate dividend */
  const surRatio=T.after>0?T.sur/T.after:0;
  const taxCum=k=>{
    if(amtCase)return AM.total;
    const c=cgQ(k);
    /* F117: normal income less the applicable-rate CG and dividend not yet accrued */
    const normalCum=Math.max(0,normalTotal-Math.max(0,totalStApp-c.stApp)-Math.max(0,totalDivNormal-divQ(k)));
    /* D117: the unexhausted exemption goes against the tracked special income, in the utility's order */
    let rem=Math.max(0,exemptLim-normalTotal);const take=v=>{const t=Math.min(rem,v);rem-=t;return v-t;};
    const lt125=take(c.lt125),st20=take(c.st20),st30=c.st30,stDTAA=c.stDTAA,ltDTAA=c.ltDTAA;
    let t=slabTax(normalCum,T.bands)+st20*0.20+st30*0.30+stDTAA*0.10+lt125*0.125+ltDTAA*0.10+lotQ(k)*0.30+untrackedSplTax;
    t=Math.max(0,t-T.rebate*(k===4?1:Math.min(1,t/Math.max(1,T.taxOn))));
    return R(t*(1+surRatio)*1.04);
  };
  const upto=d=>(S.it||[]).filter(c=>!P.isSAT(c)&&D(c.dt)&&D(c.dt)<=d).reduce((a,c)=>a+N(c.amt),0);
  const paidIn5=(S.it||[]).filter(c=>!P.isSAT(c)&&D(c.dt)&&D(c.dt)>Q_CUT[3]&&D(c.dt)<=YREND).reduce((a,c)=>a+N(c.amt),0);
  const gate234c=net>=10000&&!seniorRes;
  const QDEF=[[.15,.12,3],[.45,.36,3],[.75,null,3],[1,null,1]];
  const qs=QDEF.map(([pc,safe,mo],k)=>{const base=Math.max(0,taxCum(k)-P.tds-P.tcs-relief);const need=R(base*pc),got=upto(Q_CUT[k]);
    let sh=(safe!==null&&got>=Math.floor(base*safe/100)*100)?0:Math.floor(Math.max(0,need-got)/100)*100;if(!gate234c)sh=0;
    return {base:R(base),need,got,short:sh,mo,int:R(sh*0.01*mo)};});
  /* the fifth slot — income arising 16 to 31 March, its own month of interest (B275 … H275) */
  const q5base=amtCase?0:Math.max(0,taxCum(4)-taxCum(3));
  const q5short=gate234c?Math.floor(Math.max(0,q5base-paidIn5)/100)*100:0;
  qs.push({base:R(q5base),need:R(q5base),got:R(paidIn5),short:q5short,mo:1,int:R(q5short*0.01)});
  const i234c=R(qs.reduce((a,q)=>a+q.int,0));
  /* ---- 234B: the monthly cycle; a self-assessment challan pays accrued interest first (B82), then principal (B83) ---- */
  const assessed=net-P.tds-P.tcs;let i234b=0;const cycles=[];
  if(assessed>=10000&&net>=10000&&P.adv<0.9*assessed){
    let principal=Math.floor(Math.max(0,net-P.adv-P.tds-P.tcs)/100)*100;
    let balInt=f234f+i234a+i234c;
    const end=filed||new Date();const months=Math.min(24,monthsBetween(new Date(2026,3,1),end)||1);
    for(let m=0;m<months;m++){const mStart=new Date(2026,3+m,1),mEnd=new Date(2026,4+m,0);
      const intr=R(principal*0.01);i234b+=intr;balInt+=intr;
      const sat=satIn(mStart,mEnd);const toInt=Math.min(sat,balInt);const toPrin=Math.max(0,Math.min(sat-toInt,principal));
      cycles.push({m:m+1,principal,intr,sat,toInt,toPrin});
      balInt-=toInt;principal=Math.max(0,principal-toPrin);}}
  const total=R(i234a+i234b+i234c+f234f+f234i);                                  /* 13e */
  const agg=R(net+total),bal=agg-P.paid;                                          /* 14 */
  return {late,filed,endA,dueDate,grossPayable:R(grossPayable),esopDef:R(esopDef),esopDue:R(esopDue),credit:R(credit),afterCredit:R(afterCredit),
    rel89:R(rel89),rel90:R(rel90),rel91:R(rel91),relief,net,matchedSAT:R(matchedSAT),p234a:R(p234a),m234a,i234a,assessed:R(assessed),i234b:R(i234b),cycles,
    qs,i234c,f234f,f234i:R(f234i),total,aggregate:agg,paid:P.paid,adv:P.adv,sat:P.sat,tds:P.tds,tcs:P.tcs,amtCase,
    balance:R(Math.round(Math.max(0,bal)/10)*10),refund:R(Math.round(Math.max(0,-bal)/10)*10)};
}

/* ---------------- 15 · Part B-TI and Part B-TTI — book 08 ------------- */
function secTax(){
  const T=S.C.tax,I=S.C.int,L=S.C.loss,CG=S.C.cg,O=S.C.os,SI=S.C.si,AM=S.C.amt,AC=S.C.amtc,E=S.C.ei2;let h="";
  const r=(n,l,v,o)=>row(l,cell(v),Object.assign({ref:n},o||{}));
  h+='<div class="cgband">Part B-TI — Computation of total income</div>';
  h+=r("1","Salaries — 6 of Schedule S",S.C.sal.income);
  h+=r("2","Income from house property — 3 of Schedule HP, nil if loss",Math.max(0,S.C.hp.income));
  h+=sub("3 · Capital gains");
  h+=r("3a(i)","Short term at 20% — 8ii of Table E",CG.after.st20||0,{ind:1});h+=r("3a(ii)","Short term at 30% — 8iii",CG.after.st30||0,{ind:1});
  h+=r("3a(iii)","Short term at applicable rate — 8iv",CG.after.stApp||0,{ind:1});h+=r("3a(iv)","Short term at DTAA rates — 8v",CG.after.stDTAA||0,{ind:1});
  h+=r("3a(v)","Total short term — nil if loss",Math.max(0,CG.shortTerm),{cls:"tot"});
  h+=r("3b(i)","Long term at 12.5% — 8vi",CG.after.lt125||0,{ind:1});h+=r("3b(ii)","Long term at DTAA rates — 8vii",CG.after.ltDTAA||0,{ind:1});
  h+=r("3b(iii)","Total long term — nil if loss",Math.max(0,CG.longTerm),{cls:"tot"});
  h+=r("3c","Sum of short-term and long-term (3av + 3biii)",Math.max(0,CG.shortTerm)+Math.max(0,CG.longTerm));
  h+=r("3d","Capital gains at 30% under 115BBH — C2 of Schedule CG",CG.C2);
  h+=r("3e","Total capital gains (3c + 3d)",Math.max(0,CG.shortTerm)+Math.max(0,CG.longTerm)+CG.C2,{cls:"tot"});
  h+=sub("4 · Income from other sources");
  h+=r("4a","Net income at normal rates — 6 of Schedule OS",Math.max(0,O.six||0),{ind:1});h+=r("4b","Income at special rates — 2 of Schedule OS",O.special||0,{ind:1});
  h+=r("4c","Race horses — 8e of Schedule OS, nil if loss",Math.max(0,O.horse?O.horse.bal:0),{ind:1});
  const four=Math.max(0,O.six||0)+(O.special||0)+Math.max(0,O.horse?O.horse.bal:0);h+=r("4d","Total (4a + 4b + 4c)",four,{cls:"tot"});
  const five=S.C.sal.income+Math.max(0,S.C.hp.income)+Math.max(0,CG.shortTerm)+Math.max(0,CG.longTerm)+CG.C2+four;
  h+=r("5","Total of head-wise income (1 + 2 + 3e + 4d)",five,{cls:"tot"});
  h+=r("6","Losses of the current year set off against 5 — 2xiii and 3xiii of Schedule CYLA",L.totHPset+L.totOSset);
  h+=r("7","Balance after set-off of current-year losses (5 − 6)",five-L.totHPset-L.totOSset);
  h+=r("8","Brought-forward losses set off against 7 — 2xii of Schedule BFLA",L.totBFset);
  h+=r("9","Gross total income (7 − 8)",S.C.gti,{cls:"grand"});
  h+=r("10","Income chargeable at special rates under 111A, 112, 112A etc. included in 9",SI.totInc);
  h+=r("11","Deductions under Chapter VI-A — v of Schedule VI-A, limited to (9 − 10)",S.C.via.allowed);
  h+=r("12","Total income (9 − 11)",S.C.ti,{cls:"grand",hint:"rounded to the nearest ten"});
  h+=r("13","Income included in 12 chargeable at special rates — total of (i) of Schedule SI",SI.totInc);
  h+=r("14","Net agricultural income for rate purposes — 2 of Schedule EI",T.agri);
  h+=r("15","Aggregate income (12 − 13 + 14) — applicable if (12 − 13) exceeds the maximum not chargeable",T.aggFlag?(S.C.ti-SI.totInc+T.agri):0);
  h+=r("16","Losses of the current year to be carried forward — row xi of Schedule CFL",L.curr.hp+L.curr.st+L.curr.lt+L.curr.horse);
  h+=r("17","Deemed income under section 115JC — 3 of Schedule AMT",AM.applies?AM.adjusted:0);
  /* ===== TTI ===== */
  h+='<div class="cgband">Part B-TTI — Computation of tax liability on total income</div>';
  h+=sub("1 · Tax payable on deemed total income — Schedule AMT");
  if(AM.applies){h+=r("1a","Tax under 115JC — 4 of Schedule AMT",AM.amt,{ind:1});h+=r("1b","Surcharge on 1a",AM.sur,{ind:1});h+=r("1c","Cess at 4% on (1a + 1b)",AM.cess,{ind:1});h+=r("1d","Total tax on deemed total income",AM.total,{cls:"tot"});}
  else h+=note("Section 115JC does not arise — "+(isNew()?"the new regime":AM.partC?"adjusted total income is within ₹20 lakh":"no deduction under 80QQB or 80RRB is claimed")+".");
  h+=sub("2 · Tax payable on total income");
  h+=r("2a","Tax at normal rates on 15 of Part B-TI",T.normalTax,{ind:1});
  h+='<div class="full"><table class="gt" style="min-width:600px"><thead><tr><th class="l">Slab</th><th style="width:70px">Rate</th><th style="width:150px">Income in it</th><th style="width:150px">Tax</th></tr></thead><tbody>';
  let last=0;const base=T.aggFlag?T.normalInc+T.agri:T.normalInc;
  T.bands.forEach(([u,rt])=>{const inS=Math.max(0,Math.min(base,u)-last);if(inS||rt===0)h+='<tr><td class="l">'+esc(u===Infinity?"Above "+RS(last):(last===0?"Up to "+RS(u):RS(last+1)+" to "+RS(u)))+'</td><td class="num" style="color:var(--ink-3)">'+rt+'%</td><td class="num">'+cell(inS)+'</td><td class="num">'+cell(inS*rt/100)+'</td></tr>';last=u;});
  h+='</tbody></table></div>';
  h+=r("2b","Tax at special rates — total of (ii) of Schedule SI",T.splTax,{ind:1});
  if(T.aggFlag)h+=r("2c","Rebate on agricultural income — tax on the exemption plus agricultural income",-T.agriRebate,{ind:1});
  h+=r("2d","Tax payable on total income (2a + 2b − 2c)",T.taxOn,{cls:"tot"});
  h+=r("3","Rebate under section 87A",-T.rebate,{hint:T.marginal?"marginal relief — tax held to the income above ₹12,00,000":(isNew()?"₹60,000 where total income is within ₹12,00,000":"₹12,500 where total income is within ₹5,00,000, not against 112A gains")});
  h+=r("4","Tax payable after rebate (2d − 3)",T.after,{cls:"tot"});
  h+=sub("5 · Surcharge");
  h+=r("5A(i)","Before marginal relief — 25% of tax under 115BBE",T.surI,{ind:1});
  h+=r("5A(ii)+(iii)","— at "+T.scr+"% on the rest, "+T.scrCap+"% on capital gains and dividend",T.surII+T.mr,{ind:1});
  if(T.mr)h+=r("5B","Marginal relief",-T.mr,{ind:1,hint:"tax plus surcharge held to the amount at the threshold plus the income above it"});
  h+=r("5B(iv)","Total surcharge",T.sur,{cls:"tot"});
  h+=r("6","Health and education cess at 4% on (4 + 5iv)",T.cess);
  h+=r("7","Gross tax liability (4 + 5iv + 6)",T.gross,{cls:"tot"});
  h+=r("8","Gross tax payable — higher of 1d and 7",I.grossPayable,{cls:"tot"});
  h+=row("8b · Tax deferred on the ESOP perquisite of 17(2)(vi) — this year",inp("esop.deferNow",{n:1}),{ref:"8b",ind:1});
  h+=r("8c","Tax deferred from earlier years but payable now — column 7 of Schedule ESOP",I.esopDue,{ind:1});
  h+=r("9","Credit under 115JD of tax paid in earlier years — only if 7 exceeds 1d",-I.credit);
  h+=r("10","Tax payable after credit (8a + 8c − 9)",I.afterCredit,{cls:"tot"});
  h+=sub("11 · Tax relief");
  h+=row("11a · Section 89 — ensure Form 10E is submitted",inp("tax.s89",{n:1}),{ref:"11a",ind:1});
  if(N(S.tax.s89))h+=row("Acknowledgement number of Form 10E",inp("tax.e10ack",{max:15}),{req:1,ind:1});
  h+=r("11b","Section 90 / 90A — 2 of Schedule TR",I.rel90,{ind:1});h+=r("11c","Section 91 — 3 of Schedule TR",I.rel91,{ind:1});
  h+=r("11d","Total relief",I.relief,{cls:"tot"});
  h+=r("12","Net tax liability (10 − 11d)",I.net,{cls:"grand"});
  h+=sub("13 · Interest and fee payable");
  h+=row("Date of filing",dte("fs.filed"),{req:1,hint:"due "+DISP(DUE)});
  h+=r("13a","Interest for default in furnishing the return — 234A",I.i234a,{ind:1,hint:I.m234a?I.m234a+" month"+(I.m234a>1?"s":"")+" on "+RS(I.p234a)+(I.matchedSAT?" — after "+RS(I.matchedSAT)+" self-assessment paid by the due date":"")+([17,18].indexOf(+S.fs.sec)>=0&&D(S.fs.origdate)?" — to the original return's date":""):""});
  h+=r("13b","Interest for default in payment of advance tax — 234B",I.i234b,{ind:1,hint:I.cycles.length?I.cycles.length+" monthly cycles on "+RS(I.cycles[0].principal)+(I.cycles.some(c=>c.sat)?" — a challan pays accrued interest first, then principal":""):""});
  if(I.cycles.some(c=>c.sat)){h+='<div class="full"><table class="gt" style="min-width:700px"><thead><tr><th class="l">Month</th><th style="width:120px">Principal</th><th style="width:100px">Interest</th><th style="width:120px">Self-assessment paid</th><th style="width:110px">To interest</th><th style="width:110px">To principal</th></tr></thead><tbody>';
    I.cycles.forEach(c=>{h+='<tr><td class="l">'+c.m+'</td><td class="num">'+cell(c.principal)+'</td><td class="num">'+cell(c.intr)+'</td><td class="num">'+cell(c.sat)+'</td><td class="num">'+cell(c.toInt)+'</td><td class="num">'+cell(c.toPrin)+'</td></tr>';});h+='</tbody></table></div>';}
  h+=r("13c","Interest for deferment of advance tax — 234C",I.i234c,{ind:1,hint:I.amtCase?"on the alternate minimum tax, flat":"on the tax on income cumulative to each instalment"});
  if(I.i234c){h+='<div class="full"><table class="gt" style="min-width:740px"><thead><tr><th class="l">Instalment</th><th style="width:120px">Tax to date</th><th style="width:120px">Required</th><th style="width:120px">Paid by then</th><th style="width:110px">Short</th><th style="width:100px">Interest</th></tr></thead><tbody>';
    ["By 16 June — 15% (12% safe)","By 20 September — 45% (36% safe)","By 15 December — 75%","By 16 March — 100%","17 to 31 March — income arising after the last instalment"].forEach((l,n)=>{const q=I.qs[n];if(!q)return;h+='<tr><td class="l">'+l+'</td><td class="num">'+cell(q.base)+'</td><td class="num">'+cell(q.need)+'</td><td class="num">'+cell(q.got)+'</td><td class="num">'+cell(q.short)+'</td><td class="num">'+cell(q.int)+'</td></tr>';});h+='</tbody></table></div>';}
  h+=r("13d","Fee for default in furnishing the return — 234F",I.f234f,{ind:1});
  h+=row("13da · Fee for furnishing a revised return — 234-I",(+S.fs.sec===17)?inp("tax.f234i",{n:1}):cell(0),{ref:"13da",ind:1});
  h+=r("13e","Total interest and fee",I.total,{cls:"tot"});
  h+=r("14","Aggregate liability (12 + 13e)",I.aggregate,{cls:"grand"});
  h+=sub("15 · Taxes paid");
  h+=r("15a","Advance tax",I.adv,{ind:1});h+=r("15b","TDS",I.tds,{ind:1});h+=r("15c","TCS",I.tcs,{ind:1});h+=r("15d","Self-assessment tax",I.sat,{ind:1});
  h+=r("15e","Total taxes paid",I.paid,{cls:"tot"});
  h+=r("16","Amount payable — if 14 exceeds 15e, rounded to ten",I.balance,{cls:I.balance?"grand":"tot"});
  h+=r("17","Refund — if 15e exceeds 14, rounded to ten",I.refund,{cls:I.refund?"grand":"tot"});
  /* AMTC — hidden under the new regime, where AMT does not apply */
  if(!isNew())h+=card("amtc","Schedule AMTC — Computation of tax credit under section 115JD",(AC.used||AC.curr?RS(AC.used||AC.curr):""),
    r("1","Tax under 115JC in A.Y. 2026-27 — 1d of Part B-TTI",AC.tax115JC)+r("2","Tax under other provisions in A.Y. 2026-27 — 7 of Part B-TTI",AC.taxOther)+
    r("3","Amount of tax against which credit is available (2 − 1 if 2 > 1)",AC.avail,{cls:"tot"})+
    '<div class="full"><table class="gt" style="min-width:900px"><thead><tr><th class="l" style="width:90px">Assessment year</th><th style="width:120px">Gross (B1)</th><th style="width:140px">Set off in earlier years (B2)</th><th style="width:130px">Balance b/f (B3)</th><th style="width:130px">Utilised this year (C)</th><th style="width:130px">Carried forward (D)</th></tr></thead><tbody>'+
    AC.rows.map(x=>'<tr><td class="l">'+x.y+'</td><td>'+inp("amtc."+x.y+".gross",{n:1})+'</td><td>'+inp("amtc."+x.y+".setoff",{n:1})+'</td><td class="num">'+cell(x.bf)+'</td><td class="num">'+cell(x.used)+'</td><td class="num">'+cell(x.cf)+'</td></tr>').join("")+
    '<tr><td class="l">2026-27 (current)</td><td class="num">'+cell(AC.curr)+'</td><td></td><td></td><td></td><td class="num">'+cell(AC.curr)+'</td></tr></tbody><tfoot><tr><td class="l">Total</td><td>'+F(AC.gross)+'</td><td>'+F(AC.setoff)+'</td><td>'+F(AC.bf)+'</td><td>'+F(AC.used)+'</td><td>'+F(AC.cfTotal)+'</td></tr></tfoot></table></div>'+
    r("5","Credit under 115JD utilised during the year → 9 of Part B-TTI",AC.used,{cls:"tot"})+r("6","AMT liability available for credit in subsequent years",AC.cfTotal,{cls:"tot"}));
  return h;
}