/* ==================================================================
   CAPITAL GAINS — data model, following the book
   land = repeatable blocks; every other head = one aggregate block
   ================================================================== */
const CG_STATE_DEFAULT={
  on:false,
  /* A1 / B1 — one entry per property */
  land:[],          /* {buy,sale,cons,sdv,cost,costIdx,improve:[{amt,yr,amtIdx}],exp,
                        s45_5a,ccDate,ded:{s54,s54B,s54EC,s54EE,s54F,s54GB,s54D,s54G,s54GA},
                        buyers:[{name,pan,aadhaar,share,amt}],paddr,pstate,ppin} */
  /* the aggregate heads — one object each, keyed by item letter */
  a2:{},            /* slump ST */
  a3i:{},           /* equity STT 111A */
  a3ii:{},          /* equity STT 115AD — NRI */
  a4:{},            /* NRI non-FII sec 48 proviso */
  a5:{},            /* NRI FII 115AD securities */
  a6:{},            /* other ST assets */
  a7:{deem:[]},     /* deemed ST — CGAS unutilised table + other */
  a8:{},            /* pass-through ST */
  a9:[],            /* DTAA claims ST */
  aA:[],            /* buy-back loss ST */
  b2:{},            /* slump LT */
  b3i:{},           /* resident unlisted bonds */
  b3ii:{},          /* listed securities 112(1) */
  b3iii:{},         /* GDR 115ACA */
  b4:{},            /* 112A — from Schedule 112A */
  b5:{},            /* NRI unlisted shares / listed debentures */
  b6i:{},b6ii:{},b6iii:{},  /* NRI 112(1)(c), 115AC, 115AD */
  b7:{},            /* FII 112A via 115AD(1)(iii) proviso */
  b8:{},            /* NRI 115F foreign-exchange asset */
  b9:{},            /* other LT assets */
  b10:{deem:[]},    /* deemed LT */
  b11:{},           /* pass-through LT */
  b12:[],           /* DTAA claims LT */
  bA:[],            /* buy-back loss LT */
  s112a:[], s115ad:[], vda:[],
  dedD:{},          /* Part D particulars keyed by section */
  editE:false
};

function eng112A(rows){
  let t={sale:0,cost:0,before:0,fmv:0,ded:0,bal:0};
  (rows||[]).forEach(r=>{
    const qty=N(r.qty),price=N(r.price),sale=R(qty*price);
    const fmvTot=r.pre18==="BE"?R(qty*N(r.fmv18)):0;
    const grand=r.pre18==="BE"?Math.min(sale,fmvTot):0;
    const cost=r.pre18==="BE"?Math.max(N(r.cost),grand):N(r.cost);
    const ded=cost+N(r.exp);
    r._={sale,fmvTot,grand,cost,ded,bal:sale-ded};
    t.sale+=sale;t.cost+=cost;t.before+=grand;t.fmv+=fmvTot;t.ded+=ded;t.bal+=sale-ded;
  });
  Object.keys(t).forEach(k=>t[k]=R(t[k]));return t;
}
function engVDA(rows){
  let cg=0;(rows||[]).forEach(r=>{const inc=Math.max(0,N(r.cons)-N(r.cost));
    r._={inc,q:qtrOf(r.sale)};cg+=inc;});return {cg:R(cg)};
}
/* ---- section 50C: stamp value displaces price only above 110% ---- */
function v50C(cons,sdv){cons=N(cons);sdv=N(sdv);
  return {value:(sdv>cons*1.10?sdv:cons),safe:(sdv>0&&sdv<=cons*1.10)};}
/* ---- one land/building property, short or long ------------------- */
function engLand(p){
  const buy=D(p.buy),sale=D(p.sale);
  const months=(buy&&sale)?(sale-buy)/(1000*60*60*24*30.4375):null;
  const isLT=p.lt==="Long"?true:p.lt==="Short"?false:(months!=null&&months>24);
  const after=sale?sale>=CUT:true;
  const c50=v50C(p.cons,p.sdv);
  const imps=(p.improve||[]).filter(x=>N(x.amt));
  const impNo=imps.reduce((a,x)=>a+N(x.amt),0);
  /* indexation is available only to a resident on a pre-23-Jul-2024 acquisition */
  const canIndex=isLT&&S.pi.res==="RES"&&buy&&buy<CUT;
  const fyB=FYof(p.buy),fyS=FYof(p.sale)||"2025-26";
  const idx=(amt,fy)=>{const b=CII[fy]||CII[fyB],s=CII[fyS];return (b&&s)?R(N(amt)*s/b):N(amt);};
  const nrLand=isLT&&S.pi.res!=="RES";   /* non-resident: no indexation (rule 570) — the indexed fields must be zero */
  const costIdx=canIndex?idx(p.cost,fyB):(nrLand?0:N(p.cost));
  const impRows=imps.map(x=>({amt:N(x.amt),yr:x.yr,idx:canIndex?idx(x.amt,x.yr&&CII[x.yr]?x.yr:fyB):(nrLand?0:N(x.amt))}));
  const impIdx=impRows.reduce((a,x)=>a+x.idx,0);
  const biv=N(p.cost)+impNo+N(p.exp);         /* un-indexed total */
  const biva=nrLand?0:(costIdx+impIdx+N(p.exp));         /* indexed total, for eiB — zero for a non-resident */
  const c=R(c50.value-biv);
  const ca=nrLand?0:R(c50.value-biva);
  const d=p.ded||{};
  const dedTot=isLT?(N(d.s54)+N(d.s54B)+N(d.s54EC)+N(d.s54EE)+N(d.s54F)+N(d.s54GB)):N(d.s54B);
  const e=R(c-Math.min(dedTot,Math.max(0,c)));
  const ea=nrLand?0:R(ca-Math.min(dedTot,Math.max(0,ca)));
  /* second proviso to 112(1)(a): a resident on a pre-July acquisition pays the lower of
     12.5% un-indexed and 20% indexed; the excess is ignored */
  let taxA=0,taxB=0,excess=0;
  if(isLT&&canIndex&&!after===false){}
  if(isLT&&canIndex){taxA=R(Math.max(0,e)*0.125);taxB=R(Math.max(0,ea)*0.20);
    excess=Math.max(0,taxA-taxB);}
  return {months,isLT,after,value:c50.value,safe:c50.safe,impNo:R(impNo),impIdx:R(impIdx),impRows,
    costIdx:R(costIdx),biv:R(biv),biva:R(biva),c,ca,dedTot:R(dedTot),e,ea,taxA,taxB,excess,
    canIndex,gain:e};
}
/* ---- an aggregate head with the section-48 block ----------------- */
function engAgg(o,opts){
  o=o||{};opts=opts||{};
  let cons=0;
  if(opts.unq){ const c50ca=Math.max(N(o.unqCons),N(o.unqFmv)); o._c50ca=c50ca;
    cons=c50ca+N(o.othCons); }
  else cons=N(o.cons);
  const biv=N(o.cost)+N(o.improve)+N(o.exp);
  const c=R(cons-biv);
  const l94=opts.loss94?N(o.loss94):0;
  const dcg=opts.dcg?N(o.dcg):0;
  const ded=(opts.deds||[]).reduce((a,k)=>a+N((o.ded||{})[k]),0);
  const e=R(c+l94+dcg-Math.min(ded,Math.max(0,c+l94+dcg)));
  return {cons:R(cons),biv:R(biv),c,l94:R(l94),dcg:R(dcg),ded:R(ded),e,gain:e};
}
function engSlump(o){o=o||{};const v=Math.max(N(o.fmv2),N(o.fmv3));
  const c=R(v-N(o.networth));const ded=N((o.ded||{}).s54EC)+N((o.ded||{}).s54EE)+N((o.ded||{}).s54F);
  return {value:R(v),c,ded:R(ded),gain:R(c-Math.min(ded,Math.max(0,c)))};}
/* ---- the whole schedule -------------------------------------------- */
function engCG(){
  const C=S.cg;
  const Z6={st20:0,st30:0,stApp:0,stDTAA:0,lt125:0,ltDTAA:0};
  const empty={on:false,nri:S.pi.res!=="RES",land:{st:[],lt:[]},A:{total:0},B:{total:0},st:0,lt:0,C1:0,C2:0,C3:0,
    buckets:{},E:{},F:{},after:Object.assign({},Z6),gain:Object.assign({},Z6),loss:Object.assign({},Z6),
    used:Object.assign({},Z6),absorbed:Object.assign({},Z6),matrix:{},s112a:eng112A([]),s115ad:eng112A([]),
    vda:{cg:0},exempt112a:0,shortTerm:0,longTerm:0,total:0,dedD:{},dedTotal:0};
  if(!C.on)return empty;
  const nri=S.pi.res!=="RES";
  /* land blocks split by term */
  const land={st:[],lt:[]};
  (C.land||[]).forEach((p,i)=>{const r=engLand(p);p._=r;p._i=i;(r.isLT?land.lt:land.st).push(p);});
  const A={},B={};
  A.a1=R(land.st.reduce((a,p)=>a+p._.gain,0));
  A.a2={gain:0};
  if((C.a3trades||[]).some(r=>N(r.cons))){C.a3i=C.a3i||{};
    C.a3i.cons=C.a3trades.reduce((a,r)=>a+N(r.cons),0);C.a3i.cost=C.a3trades.reduce((a,r)=>a+N(r.cost),0);
    C.a3i.exp=C.a3trades.reduce((a,r)=>a+N(r.exp),0);}
  A.a3i=engAgg(C.a3i,{loss94:1});
  A.a3ii=nri?engAgg(C.a3ii,{loss94:1}):{gain:0,e:0};
  A.a4=nri?{stt:R(N((C.a4||{}).ai)+N((C.a4||{}).aii)),nostt:R(N((C.a4||{}).b)),gain:R(N((C.a4||{}).ai)+N((C.a4||{}).aii)+N((C.a4||{}).b))}:{gain:0,stt:0,nostt:0};
  A.a5=nri?engAgg(C.a5,{unq:1,loss94:1}):{gain:0,e:0};
  A.a6=engAgg(C.a6,{unq:1,loss94:1,dcg:1,deds:["s54D","s54G","s54GA"]});
  const a7t=(C.a7&&C.a7.deem||[]).reduce((a,x)=>a+N(x.unused),0)+N((C.a7||{}).other);
  A.a7={gain:R(a7t)};
  if(S.C.pti&&S.C.pti.blocks){C.a8=C.a8||{};C.a8.r20=S.C.pti.h.st111a.net;C.a8.rApp=S.C.pti.h.stOth.net;}
  A.a8={gain:R(["r20","r30","rApp"].reduce((a,k)=>a+N((C.a8||{})[k]),0))};
  const a9a=(C.a9||[]).filter(x=>x.rate==="NIL"||N(x.rate)===0).reduce((a,x)=>a+N(x.amt),0);
  A.a9={notTax:R(a9a),special:R((C.a9||[]).reduce((a,x)=>a+N(x.amt),0)-a9a)};
  A.aA={loss:R((C.aA||[]).reduce((a,x)=>a+N(x.amt),0))};
  A.total=R(A.a1+A.a2.gain+A.a3i.gain+A.a3ii.gain+A.a4.gain+A.a5.gain+A.a6.gain+A.a7.gain
    +A.a8.gain-A.a9.notTax-A.aA.loss);
  /* long-term */
  B.b1=R(land.lt.reduce((a,p)=>a+p._.gain,0));
  B.b1before=R(land.lt.filter(p=>!p._.after).reduce((a,p)=>a+p._.gain,0));
  B.b1after=R(land.lt.filter(p=>p._.after).reduce((a,p)=>a+p._.gain,0));
  B.b1excess=R(land.lt.reduce((a,p)=>a+p._.excess,0));
  B.b2={gain:0};
  B.b3i=engAgg(C.b3i,{deds:["s54EC","s54EE","s54F"]});
  B.b3ii=engAgg(C.b3ii,{deds:["s54EC","s54EE","s54F"]});
  B.b3iii=engAgg(C.b3iii,{deds:["s54EC","s54EE","s54F"]});
  const s112a=eng112A(C.s112a);
  const b4ded=N((C.b4||{}).s54F);
  B.b4={a:s112a.bal,ded:R(b4ded),gain:R(s112a.bal-Math.min(b4ded,Math.max(0,s112a.bal)))};
  B.b5=nri?{gain:R(N((C.b5||{}).ai)+N((C.b5||{}).aii)+N((C.b5||{}).aiii)-N((C.b5||{}).b))}:{gain:0};
  B.b6i=nri?engAgg(C.b6i,{unq:1,deds:["s54F"]}):{gain:0,e:0};
  B.b6iv=nri?engAgg(C.b6iv,{deds:["s54F"]}):{gain:0,e:0};
  B.b6ii=nri?engAgg(C.b6ii,{unq:1,deds:["s54F"]}):{gain:0,e:0};
  B.b6iii=nri?engAgg(C.b6iii,{unq:1,deds:["s54F"]}):{gain:0,e:0};
  const s115ad=eng112A(C.s115ad);
  B.b7=nri?{gain:R(s115ad.bal-Math.min(N((C.b7||{}).b),Math.max(0,s115ad.bal)))}:{gain:0};
  B.b8=nri?{gain:R(N((C.b8||{}).a)-N((C.b8||{}).b)+N((C.b8||{}).d))}:{gain:0};
  if(C.b9&&C.b9.ded){const t9=Object.values(C.b9.ded).reduce((a,v)=>a+N(v),0);C.b9.ded=t9?{s54F:t9}:{};}
  B.b9=engAgg(C.b9,{unq:1,deds:["s54F"]});
  const b10t=(C.b10&&C.b10.deem||[]).reduce((a,x)=>a+N(x.unused),0)+N((C.b10||{}).other);
  B.b10={gain:R(b10t)};
  if(S.C.pti&&S.C.pti.blocks){C.b11=C.b11||{};C.b11.r125a=S.C.pti.h.lt112a.net;C.b11.r125o=S.C.pti.h.ltOth.net;}
  B.b11={gain:R(["r125a","r125o"].reduce((a,k)=>a+N((C.b11||{})[k]),0))};
  const b12a=(C.b12||[]).filter(x=>x.rate==="NIL"||N(x.rate)===0).reduce((a,x)=>a+N(x.amt),0);
  B.b12={notTax:R(b12a),special:R((C.b12||[]).reduce((a,x)=>a+N(x.amt),0)-b12a)};
  B.bA={loss:R((C.bA||[]).reduce((a,x)=>a+N(x.amt),0))};
  B.total=R(B.b1+B.b2.gain+B.b3i.gain+B.b3ii.gain+B.b3iii.gain+B.b4.gain+B.b5.gain
    +B.b6i.gain+B.b6ii.gain+B.b6iii.gain+B.b7.gain+B.b8.gain+B.b9.gain+B.b10.gain
    +B.b11.gain-B.b12.notTax-B.bA.loss);
  /* ---- Table E: the utility's live version — six slots ------------ */
  /* the 15%, 10% and long-20% rows are hidden in the AY 2026-27 utility, so
     nothing lands there: pre-July gains fold into the live slots */
  /* the official composition (validation rules A573/A574, A163, A164, A165, A576):
     20%  = A2e (equity STT) + A3a (NRI s.48, STT paid) + A7a (PTI 20%)  − buy-back loss at 20%
     30%  = A4e (FII 115AD)  + A7b (PTI 30%)                              − buy-back loss at 30%
     app. = A1e (land) + A3b (NRI s.48, no STT) + A5e (other) + A6 (deemed) + A7c (PTI app.) − buy-back loss at app.
     DTAA = A8b (claimed at a special treaty rate)
     12.5%= every long-term head, less the long-term buy-back loss; DTAA = B12b */
  const bbAt=code=>R((C.aA||[]).filter(x=>(x.rate||"STL20")===code).reduce((a,x)=>a+N(x.amt),0));
  const E={
    st20:R(A.a3i.gain+A.a3ii.gain+A.a4.stt+N((C.a8||{}).r20)-bbAt("STL20")),
    st30:R(A.a5.gain+N((C.a8||{}).r30)-bbAt("STL30")),
    stApp:R(A.a1+A.a4.nostt+A.a6.gain+A.a7.gain+N((C.a8||{}).rApp)-bbAt("STLAR")),
    stDTAA:R(A.a9.special),
    lt125:R(B.b1+B.b3i.gain+B.b3ii.gain+B.b3iii.gain+B.b4.gain+B.b5.gain
      +B.b6i.gain+B.b6ii.gain+B.b6iii.gain+B.b6iv.gain+B.b7.gain+B.b8.gain+B.b9.gain+B.b10.gain+B.b11.gain-B.bA.loss),
    ltDTAA:R(B.b12.special)};
  const KEYS=["st20","st30","stApp","stDTAA","lt125","ltDTAA"];
  const gain={},loss={},used={},absorbed={},matrix={};
  KEYS.forEach(k=>{gain[k]=Math.max(0,E[k]);loss[k]=Math.max(0,-E[k]);used[k]=0;absorbed[k]=0;matrix[k]={};});
  const isLong=k=>k.startsWith("lt");
  if(C.editE&&C.Eover){
    /* the person has overridden the auto-populated matrix */
    KEYS.forEach(gk=>{KEYS.forEach(lk=>{const v=N(((C.Eover[gk]||{})[lk]));
      if(v>0){matrix[gk][lk]=v;absorbed[gk]+=v;used[lk]+=v;}});});
  } else {
    KEYS.forEach(lk=>{if(!loss[lk])return;let avail=loss[lk];
      KEYS.forEach(gk=>{if(avail<=0||gk===lk||!gain[gk])return;
        if(isLong(lk)&&!isLong(gk))return;
        const u=Math.min(avail,gain[gk]-absorbed[gk]);if(u<=0)return;
        matrix[gk][lk]=(matrix[gk][lk]||0)+u;absorbed[gk]+=u;used[lk]+=u;avail-=u;});});
  }
  const after={};let C1=0;
  KEYS.forEach(k=>{after[k]=R(gain[k]-absorbed[k]);C1+=after[k];});
  const vda=engVDA(C.vda);
  const exempt112a=Math.min(125000,Math.max(0,after.lt125>0?Math.min(after.lt125,B.b4.gain):0));
  const buckets={si111a20:after.st20,stcgApp:after.stApp,si112a:Math.min(after.lt125,Math.max(0,B.b4.gain)),
    si112n:Math.max(0,after.lt125-Math.max(0,B.b4.gain)),si115bbh:vda.cg,si111a15:0,si112a10:0,si112o:0};
  /* ---- Table F: auto-filled from the sale dates, then editable ----- */
  /* Table F is finalised after BFLA (engTableF) — the rows must equal 3(iii)…3(viii) of BFLA */
  const Fauto={},F={};KEYS.forEach(k=>{Fauto[k]=[0,0,0,0,0];F[k]=[0,0,0,0,0];});
  /* Part D — pull the particulars for every exemption claimed */
  const dedD={};
  const addD=(sec,amt,src)=>{if(!N(amt))return;(dedD[sec]=dedD[sec]||[]).push({amt:N(amt),src});};
  (C.land||[]).forEach((p,i)=>{Object.keys(p.ded||{}).forEach(k=>addD(k.replace("s",""),p.ded[k],"land"+i));});
  [["a6",C.a6],["b3i",C.b3i],["b3ii",C.b3ii],["b3iii",C.b3iii],["b6i",C.b6i],["b6ii",C.b6ii],["b6iii",C.b6iii]]
    .forEach(([h,o])=>{Object.keys((o||{}).ded||{}).forEach(k=>addD(k.replace("s",""),o.ded[k],h));});
  Object.keys((C.b9||{}).ded||{}).forEach(k=>addD("54F",(C.b9.ded||{})[k],"b9"));
  if(N((C.b4||{}).s54F))addD("54F",C.b4.s54F,"b4");
  ["a2","b2"].forEach(h=>{Object.keys((C[h]||{}).ded||{}).forEach(k=>addD(k.replace("s",""),C[h].ded[k],h));});
  const dedTotal=Object.values(dedD).reduce((a,rows)=>a+rows.reduce((b,r)=>b+r.amt,0),0);
  return {on:true,nri,land,A,B,E,gain,loss,used,absorbed,matrix,after,F,Fauto,s115ad,C1:R(C1),
    C2:vda.cg,C3:R(C1+vda.cg),buckets,s112a,vda,exempt112a:R(exempt112a),dedD,dedTotal:R(dedTotal),
    shortTerm:R(after.st20+after.st30+after.stApp+after.stDTAA),
    longTerm:R(after.lt125+after.ltDTAA),total:R(C1+vda.cg)};
}

/* ==================================================================
   CAPITAL GAINS — the screen, six parts, every head from the book
   ================================================================== */
const BYR_COLS=[{k:"name",h:"Name of buyer",t:"txt",w:"auto",req:1},
  {k:"pan",h:"PAN of buyer",t:"txt",w:"120px",max:10},
  {k:"aadhaar",h:"Aadhaar of buyer",t:"txt",w:"130px",max:12},
  {k:"share",h:"Percentage share",t:"num",w:"90px",req:1},
  {k:"amt",h:"Amount",t:"num",w:"130px",req:1}];
/* the section-48 block, reused by every aggregate head */
function sec48(p,o,r,opts){
  opts=opts||{};let b="";
  if(opts.unq){
    b+=sub("a · Full value of consideration");
    b+=row("i · Where the securities sold include unquoted shares",'',{cls:"sub"});
    b+=row("a · Consideration received or receivable for unquoted shares",inp(p+"unqCons",{n:1}),{ind:1,ref:"aia"});
    b+=row("b · Fair market value of unquoted shares, determined in the prescribed manner",inp(p+"unqFmv",{n:1}),{ind:1,ref:"aib"});
    b+=row("c · Full value adopted under section 50CA — the higher of a and b",cell(o._c50ca||Math.max(N(o.unqCons),N(o.unqFmv))),{ind:1,ref:"aic",cls:"tot"});
    b+=row("ii · Full value of consideration for assets other than unquoted shares",inp(p+"othCons",{n:1}),{ref:"aii"});
    b+=row("iii · Total (ic + ii)",cell(r.cons),{ref:"aiii",cls:"tot"});
  } else {
    b+=row("a · Full value of consideration",inp(p+"cons",{n:1}),{req:1,ref:"a"});
  }
  b+=sub("b · Deductions under section 48");
  b+=row("i · Cost of acquisition without indexation",inp(p+"cost",{n:1}),{ref:"bi",ind:1});
  b+=row("ii · Cost of improvement without indexation",inp(p+"improve",{n:1}),{ref:"bii",ind:1});
  b+=row("iii · Expenditure wholly and exclusively in connection with the transfer",inp(p+"exp",{n:1}),{ref:"biii",ind:1});
  b+=row("iv · Total (bi + bii + biii)",cell(r.biv),{ref:"biv",cls:"tot"});
  b+=row("c · Balance (a − biv)",cell(r.c),{ref:"c",cls:"tot"});
  if(opts.loss94)b+=row("d · Loss to be disallowed under section 94(7) or 94(8)",inp(p+"loss94",{n:1}),{ref:"d",
    hint:"dividend or bonus stripping — bought within 3 months before the record date"});
  if(opts.dcg)b+=row("e · Deemed short-term gain on depreciable assets — item 6 of Schedule DCG",inp(p+"dcg",{n:1}),{ref:"e"});
  if(opts.deds&&opts.deds.length){
    b+=sub("Deductions claimed — particulars go in Part D");
    opts.deds.forEach(k=>{const sec=k.replace("s","");
      b+=row("Deduction under section "+sec,inp(p+"ded."+k,{n:1}),{ind:1});});
    b+=row("Total deduction",cell(r.ded),{cls:"tot"});
  }
  return b;
}
/* ---- one land/building property block ------------------------------ */
function landBlock(p,i,ordinal){
  const r=p._,pre="cg.land."+i+".",id="land"+i;
  const on=S.open["b_"+id]!==false;
  const term=r.isLT?"Long-term":"Short-term";
  const status=(D(p.sale)?DISP(D(p.sale)):"no date")+" · "+term+" · "+RS(r.gain);
  let b="";
  b+=sub("Dates");
  b+=row("Date of purchase or acquisition",dte(pre+"buy"),{req:1});
  b+=row("Date of sale or transfer",dte(pre+"sale"),{req:1});
  b+=row("Period of holding",'<span class="c">'+(r.months!=null?Math.floor(r.months)+" months":"—")+'</span>',
    {hint:r.isLT?"more than 24 months — long-term":"24 months or less — short-term"});
  b+=row("Treat as",sel(pre+"lt",[["","As worked out"],["Short","Short-term"],["Long","Long-term"]],{blank:false}),
    {hint:p.lt?"set when the block was added — choose 'As worked out' to let the dates decide":""});
  if(p.lt&&r.months!=null&&((p.lt==="Long")!==(r.months>24)))
    b+=note("The dates make this "+(r.months>24?"long":"short")+"-term, but the block is held as "+
      p.lt.toLowerCase()+"-term. Set 'Treat as' to 'As worked out' to move it, unless the Act treats the holding differently.","warn");
  if(r.isLT){
    b+=row("Whether chargeable to tax under section 45(5A)?",sel(pre+"s45_5a",["No","Yes"],{blank:false}),
      {hint:"a joint development agreement"});
    if(p.s45_5a==="Yes")b+=row("Date of the completion certificate",dte(pre+"ccDate"),{req:1,ind:1});
  }
  b+=sub("a · Full value of consideration");
  b+=row("i · Full value of consideration received or receivable",inp(pre+"cons",{n:1}),{req:1,ref:"ai"});
  b+=row("ii · Value of the property as per the stamp valuation authority",inp(pre+"sdv",{n:1}),{ref:"aii"});
  b+=row("iii · Full value adopted under section 50C",cell(r.value),{ref:"aiii",cls:"tot",
    hint:r.safe?"the stamp value is within 1.10 times the price, so the price stands":
      (N(p.sdv)>N(p.cons)*1.10?"the stamp value exceeds 1.10 times the price, so it is adopted":"")});
  b+=sub("b · Deductions under section 48");
  b+=row("i · Cost of acquisition without indexation",inp(pre+"cost",{n:1}),{req:1,ref:"bi",ind:1});
  if(r.isLT)b+=row("ii a · Cost of acquisition with indexation",cell(r.costIdx),{ref:"biia",ind:1,
    hint:r.canIndex?"indexed by the cost inflation index — residents, acquisition before 23 July 2024"
      :"no indexation — acquired on or after 23 July 2024, or a non-resident"});
  b+=row((r.isLT?"ii b · ":"ii · ")+"Cost of improvement",cell(r.impNo),{ref:r.isLT?"biib":"bii",ind:1,
    hint:"the sum of the improvements below"});
  b+=grid(pre.slice(0,-1)+".improve",[
    {k:"amt",h:"Cost without indexation",t:"num",w:"170px",req:1},
    {k:"yr",h:"Year of improvement",t:"sel",w:"150px",opts:Object.keys(CII).map(y=>[y,y])},
    {k:"idx",h:"Cost with indexation",t:"calc",w:"170px",f:x=>{
      if(!r.canIndex)return N(x.amt);const b0=CII[x.yr]||CII[FYof(p.buy)],s0=CII[FYof(p.sale)||"2025-26"];
      return (b0&&s0)?R(N(x.amt)*s0/b0):N(x.amt);}}],
    p.improve||[],{min:"560px",empty:"No improvement.",add:"Add an improvement"});
  if(r.isLT)b+=row("Total cost of improvement with indexation",cell(r.impIdx),{ind:1});
  b+=row("iii · Expenditure wholly and exclusively in connection with the transfer",inp(pre+"exp",{n:1}),{ref:"biii",ind:1});
  b+=row("iv · Total (bi + Σbii + biii)",cell(r.biv),{ref:"biv",cls:"tot"});
  if(r.isLT&&r.canIndex)b+=row("iv a · Total on the indexed basis (biia + Σbiib(c) + biii)",cell(r.biva),{ref:"biva",cls:"tot",
    hint:"only for working out eiB under the second proviso"});
  b+=row("c · Balance (aiii − biv)",cell(r.c),{ref:"c",cls:"tot"});
  if(r.isLT&&r.canIndex)b+=row("c a · Balance on the indexed basis (aiii − biva)",cell(r.ca),{ref:"ca",cls:"tot"});
  b+=sub("d · Deductions claimed — particulars go in Part D");
  const deds=r.isLT?[["s54","54 — a residential house from a residential house"],["s54B","54B — agricultural land"],
    ["s54EC","54EC — specified bonds, up to ₹50 lakh"],["s54EE","54EE — specified fund units"],
    ["s54F","54F — a residential house from any other asset"],["s54GB","54GB — eligible start-up company"]]
    :[["s54B","54B — agricultural land"]];
  deds.forEach(([k,l])=>b+=row(l,inp(pre+"ded."+k,{n:1}),{ind:1}));
  b+=row("Total deduction",cell(r.dedTot),{ref:"d",cls:"tot"});
  b+=row((r.isLT?"e · Long-term":"e · Short-term")+" capital gain on immovable property (c − d)",cell(r.e),{ref:"e",cls:"grand"});
  if(r.isLT&&r.canIndex){
    b+=row("e(a) · Gain on the indexed basis (ca − d)",cell(r.ea),{ref:"ea"});
    b+=sub("e i · Second proviso to section 112(1)(a) — residents, acquisition before 23 July 2024");
    b+=row("A · Tax under 112(1)(a)(ii)(B) — e × 12.5%",cell(r.taxA),{ind:1});
    b+=row("B · Tax for the second proviso — e(a) × 20%",cell(r.taxB),{ind:1});
    b+=row("e ii · Excess amount to be ignored (A − B)",cell(r.excess),{ref:"eii",cls:"tot",
      hint:"the person pays the lower of the two"});
  }
  b+=sub("f · Buyer details");
  b+=note("PAN or Aadhaar of the buyer is mandatory where tax was deducted under section 194-IA, "+
    "or where it is quoted in the documents. For more than one buyer give each one's share and amount.");
  b+=grid(pre.slice(0,-1)+".buyers",BYR_COLS,p.buyers||[],{min:"780px",empty:"No buyer listed.",add:"Add a buyer"});
  b+=row("Address of the property",inp(pre+"paddr"),{req:1});
  b+=row("State",sel(pre+"pstate",Object.keys(STATE).map(k=>[k,STATE[k]])),{req:1});
  b+=row("PIN code",inp(pre+"ppin",{max:6}),{req:1});
  b+=row("Country",'<span class="c">91 — INDIA</span>');
  return '<div class="blk'+(on?" on":"")+'"><div class="bh">'+
    '<button class="bhx" data-blk="'+id+'"><span class="cv2">'+(on?"−":"+")+'</span>'+
    '<span class="t">Property '+ordinal+(st0(p.paddr)?" — "+st0(p.paddr):"")+'</span>'+
    '<span class="s">'+esc(status)+'</span></button>'+
    '<button class="blkdel" data-del="cg.land.'+i+'" title="Remove">'+TRASH+'</button>'+
    '</div><div class="bb">'+(on?b:"")+'</div></div>';
}

/* ---- Part A ---------------------------------------------------- */
function partA(){
  const G=S.C.cg,A=G.A,C=S.cg,nri=G.nri;let h="";
  const st=(v)=>RS(v);
  /* A1 land — repeatable */
  let a1="";
  if(!G.land.st.length)a1=note("No short-term property yet. A property held 24 months or less "+
    "lands here once you add it below; longer than that goes under B1.");
  G.land.st.forEach((p,k)=>a1+=landBlock(p,p._i,k+1));
  a1+='<button class="add" data-addland="Short">Add a property</button>';
  h+=fold("A1","A1","From sale of land or building or both — one block per property",
    G.land.st.length?G.land.st.length+" property · "+st(A.a1):"none",a1,{def:1});
  /* A3 equity STT */
  let s3=sub("(i) · Under section 111A — for everyone other than an FII");
  s3+=fold("A3w","","Working — trade by trade, summed into the figures below",
    (C.a3trades||[]).length?(C.a3trades||[]).length+" trade"+((C.a3trades||[]).length>1?"s":""):"optional",
    note("The form takes only the totals. Enter each trade here and Yukti sums the consideration, cost "+
      "and expenses into A3(i); or leave this shut and type the totals directly.")+
    grid("cg.a3trades",[{k:"name",h:"Share or unit",t:"txt",w:"auto"},{k:"buy",h:"Bought",t:"date",w:"120px"},
      {k:"sale",h:"Sold",t:"date",w:"120px"},{k:"cons",h:"Consideration",t:"num",w:"120px"},
      {k:"cost",h:"Cost",t:"num",w:"110px"},{k:"exp",h:"Expenses",t:"num",w:"100px"},
      {k:"g",h:"Gain",t:"calc",w:"110px",f:r=>N(r.cons)-N(r.cost)-N(r.exp)}],
      C.a3trades||[],{min:"900px",empty:"No trade entered.",add:"Add a trade",
      foot:[{l:1,v:"Summed into A3(i)",span:3},{v:(C.a3trades||[]).reduce((a,r)=>a+N(r.cons),0)},
        {v:(C.a3trades||[]).reduce((a,r)=>a+N(r.cost),0)},{v:(C.a3trades||[]).reduce((a,r)=>a+N(r.exp),0)},
        {v:(C.a3trades||[]).reduce((a,r)=>a+N(r.cons)-N(r.cost)-N(r.exp),0)}]}));
  s3+=sec48("cg.a3i.",C.a3i||{},A.a3i,{loss94:1});
  s3+=row("i e · Short-term gain on equity with STT under 111A (c + d)",cell(A.a3i.gain),{ref:"A3ie",cls:"grand"});
  if(nri){s3+=sub("(ii) · Under section 115AD(1)(b)(ii) — for an FII only");
    s3+=sec48("cg.a3ii.",C.a3ii||{},A.a3ii,{loss94:1});
    s3+=row("ii e · Short-term gain under 115AD(1)(b)(ii) (c + d)",cell(A.a3ii.gain),{ref:"A3iie",cls:"grand"});}
  h+=fold("A3","A2","From sale of equity shares, equity-oriented fund units or business-trust units, STT paid",
    (A.a3i.gain||A.a3ii.gain)?st(A.a3i.gain+A.a3ii.gain):"none",s3);
  if(nri){
    let s4=note("For a non-resident who is not an FII. Computed with the foreign-exchange adjustment "+
      "under the first proviso to section 48 — enter the computed figures.");
    s4+=row("a · STCG on transactions covered under 111A",'',{cls:"sub"});
    s4+=row("a i · where the transfer was before 23 July 2024",inp("cg.a4.ai",{n:1}),{ind:1,ref:"A3ai"});
    s4+=row("a ii · where the transfer was on or after 23 July 2024",inp("cg.a4.aii",{n:1}),{ind:1,ref:"A3aii"});
    s4+=row("b · STCG on shares not covered in 3a, or on debentures",inp("cg.a4.b",{n:1}),{ref:"A3b"});
    s4+=row("Short-term gain — non-resident, section 48 proviso",cell(A.a4.gain),{cls:"grand"});
    h+=fold("A4","A3","For a non-resident, not an FII — shares or debentures of an Indian company",
      A.a4.gain?st(A.a4.gain):"none",s4);
    let s5=note("For a non-resident FII — securities under section 115AD, other than those at A3.");
    s5+=sec48("cg.a5.",C.a5||{},A.a5,{unq:1,loss94:1});
    s5+=row("e · Short-term gain on securities by an FII (c + d)",cell(A.a5.gain),{ref:"A4e",cls:"grand"});
    h+=fold("A5","A4","For a non-resident FII — securities under section 115AD",A.a5.gain?st(A.a5.gain):"none",s5);
  }
  /* A6 other */
  let s6=sec48("cg.a6.",C.a6||{},A.a6,{unq:1,loss94:1,dcg:1,deds:["s54D","s54G","s54GA"]});
  s6+=row("e · STCG on assets other than at A1 to A4 (c + d + e − f)",cell(A.a6.gain),{ref:"A5e",cls:"grand"});
  h+=fold("A6","A5","From sale of assets other than at A1 to A4",A.a6.gain?st(A.a6.gain):"none",s6);
  /* A7 deemed */
  let s7=sub("a · Unutilised capital gain from an earlier year, deposited in a Capital Gains Account Scheme");
  s7+=grid("cg.a7.deem",[{k:"py",h:"Previous year the asset was transferred",t:"sel",w:"180px",req:1,
      opts:[["2023-24","2023-24"],["2024-25","2024-25"]]},
    {k:"sec",h:"Section claimed that year",t:"sel",w:"140px",req:1,opts:[["54B","54B"]]},
    {k:"acqyr",h:"Year the new asset was acquired",t:"sel",w:"150px",opts:[["2023","2023"],["2024","2024"],["2025","2025"]]},
    {k:"used",h:"Amount utilised from the account",t:"num",w:"170px"},
    {k:"unused",h:"Amount not used — deemed income",t:"num",w:"180px",req:1}],
    (C.a7||{}).deem||[],{min:"900px",empty:"Nothing deemed.",add:"Add a year"});
  s7+=row("b · Amount deemed to be short-term capital gain, other than at a",inp("cg.a7.other",{n:1}),{ref:"A6b"});
  s7+=row("Total amount deemed to be short-term capital gain",cell(A.a7.gain),{ref:"A6",cls:"grand"});
  h+=fold("A7","A6","Amount deemed to be short-term capital gain",A.a7.gain?st(A.a7.gain):"none",s7);
  /* A8 PTI */
  let s8=note("Fill up Schedule PTI. The figures here are the short-term part of pass-through income.");
  s8+=row("chargeable at 15%",inp("cg.a8.r15",{n:1}),{ind:1,ref:"7ai"});
  s8+=row("chargeable at 20%",inp("cg.a8.r20",{n:1}),{ind:1,ref:"7a"});
  s8+=row("chargeable at 30%",inp("cg.a8.r30",{n:1}),{ind:1,ref:"7b"});
  s8+=row("chargeable at applicable rates",inp("cg.a8.rApp",{n:1}),{ind:1,ref:"7c"});
  s8+=row("Pass-through income in the nature of short-term capital gain",cell(A.a8.gain),{ref:"A7",cls:"grand"});
  h+=fold("A8","A7","Pass-through income or loss in the nature of short-term capital gain",A.a8.gain?st(A.a8.gain):"none",s8);
  /* A9 DTAA — NRI */
  if(nri){
    let s9=grid("cg.a9",[{k:"amt",h:"Amount of income",t:"num",w:"130px",req:1},
      {k:"item",h:"Item A1 to A8 in which included",t:"sel",w:"150px",req:1,
        opts:["A1e","A2c","A3ie","A3iie","A3a","A3b","A4e","A5e","A6","A7"].map(x=>[x,x])},
      {k:"country",h:"Country name and code",t:"txt",w:"180px",req:1},
      {k:"article",h:"Article of the DTAA",t:"txt",w:"110px",req:1},
      {k:"rate",h:"Rate per treaty (NIL if not chargeable)",t:"txt",w:"140px",req:1},
      {k:"trc",h:"TRC obtained?",t:"sel",w:"100px",opts:[["Y","Yes"],["N","No"]]},
      {k:"sec",h:"Section of the Act",t:"txt",w:"110px",req:1},
      {k:"itrate",h:"Rate per the Act",t:"num",w:"110px",req:1}],
      C.a9||[],{min:"1180px",empty:"No DTAA claim.",add:"Add a claim"});
    s9+=row("a · Total STCG not chargeable to tax in India under a DTAA",cell(A.a9.notTax),{ref:"A8a",cls:"tot"});
    s9+=row("b · Total STCG chargeable at special rates under a DTAA",cell(A.a9.special),{ref:"A8b",cls:"tot"});
    h+=fold("A9","A8","STCG claimed as not chargeable, or at special rates, under a DTAA",
      (A.a9.notTax+A.a9.special)?st(A.a9.notTax+A.a9.special):"none",s9);
  }
  /* A(A) buy-back */
  let sA=note("Can be claimed only if the corresponding dividend under section 2(22)(f) is offered in Schedule OS.");
  sA+=grid("cg.aA",[{k:"rate",h:"Rate",t:"sel",w:"220px",req:1,
      opts:[["STL20","Short-term at 20%"],["STL30","Short-term at 30%"],["STLAR","Short-term at the applicable rate"]]},
    {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],C.aA||[],{min:"460px",empty:"No buy-back loss.",add:"Add a row"});
  h+=fold("AA","A(A)","Capital loss on buy-back of shares — short-term",A.aA.loss?"("+st(A.aA.loss)+")":"none",sA);
  h+=row("Total short-term capital gain (A1e + A2e + A3a + A3b + A4e + A5e + A6 + A7 − A8a + A(A))",cell(A.total),{ref:"A9",cls:"grand"});
  return h;
}
/* ---- Part B ---------------------------------------------------- */
function partB(){
  const G=S.C.cg,B=G.B,C=S.cg,nri=G.nri;let h="";const st=v=>RS(v);
  let b1="";
  if(!G.land.lt.length)b1=note("No long-term property yet. A property held more than 24 months lands here.");
  G.land.lt.forEach((p,k)=>b1+=landBlock(p,p._i,k+1));
  b1+='<button class="add" data-addland="Long">Add a property</button>';
  if(G.land.lt.length){
    b1+=sub("g · Across all immovable properties");
    b1+=row("Total long-term gain on all immovable properties",cell(B.b1),{ref:"B1g",cls:"tot"});
    b1+=row("a · from transfers before 23 July 2024",cell(B.b1before),{ind:1,ref:"B1ga"});
    b1+=row("b · from transfers on or after 23 July 2024",cell(B.b1after),{ind:1,ref:"B1gb"});
    b1+=row("h · Total excess tax to be ignored",cell(B.b1excess),{ref:"B1h",cls:"tot"});
  }
  h+=fold("B1","B1","From sale of land or building or both — one block per property",
    G.land.lt.length?G.land.lt.length+" property · "+st(B.b1):"none",b1,{def:1});
  let s3=sub("(i) · Listed securities other than units, or zero-coupon bonds — section 112(1)");
  s3+=sec48("cg.b3i.",C.b3i||{},B.b3i,{deds:["s54EC","s54EE","s54F"]});
  s3+=row("e · LTCG on bonds or debentures (c − d)",cell(B.b3i.gain),{cls:"grand"});
  s3+=sub("(ii) · Listed securities other than units, or zero-coupon bonds — section 112(1)");
  s3+=sec48("cg.b3ii.",C.b3ii||{},B.b3ii,{deds:["s54EC","s54EE","s54F"]});
  s3+=row("e · LTCG on listed securities (c − d)",cell(B.b3ii.gain),{cls:"grand"});
  s3+=sub("(iii) · GDR of an Indian company under section 115ACA — residents only");
  s3+=sec48("cg.b3iii.",C.b3iii||{},B.b3iii,{deds:["s54EC","s54EE","s54F"]});
  s3+=row("e · LTCG on GDRs (c − d)",cell(B.b3iii.gain),{cls:"grand"});
  h+=fold("B3","B2","Listed securities, zero-coupon bonds and GDRs — sections 112(1) and 115ACA",
    (B.b3i.gain+B.b3ii.gain+B.b3iii.gain)?st(B.b3i.gain+B.b3ii.gain+B.b3iii.gain):"none",s3);
  let s4=note("Fed from Schedule 112A below, column 14, scrip by scrip.");
  s4+=row("a · LTCG under 112A — the sum of column 14",cell(G.s112a.bal),{ref:"4a",cls:"tot"});
  s4+=row("b · Deduction under section 54F",inp("cg.b4.s54F",{n:1}),{ref:"4b"});
  s4+=row("c · Long-term gain on equity with STT (4a − 4b)",cell(B.b4.gain),{ref:"B4c",cls:"grand"});
  h+=fold("B4","B3","Equity shares, equity-oriented fund units or business-trust units with STT — section 112A",
    B.b4.gain?st(B.b4.gain):"none",s4);
  if(nri){
    let s5=note("Computed without indexation, with the foreign-exchange adjustment.");
    s5+=row("a i · Before 23 July 2024 — listed debentures",inp("cg.b5.ai",{n:1}),{ind:1});
    s5+=row("a ii · Before 23 July 2024 — other than listed debentures",inp("cg.b5.aii",{n:1}),{ind:1});
    s5+=row("a iii · On or after 23 July 2024",inp("cg.b5.aiii",{n:1}),{ind:1});
    s5+=row("b · Deduction under section 54F",inp("cg.b5.b",{n:1}));
    s5+=row("c · LTCG on unlisted shares or listed debentures (4a − 4b)",cell(B.b5.gain),{ref:"B5c",cls:"grand"});
    h+=fold("B5","B4","For a non-resident — unlisted shares or listed debentures of an Indian company",B.b5.gain?st(B.b5.gain):"none",s5);
    let s6="";
    [["b6i","(i) · Unlisted securities under section 112(1)(c)"],["b6ii","(ii) · Bonds or GDRs under section 115AC"],
     ["b6iii","(iii) · Securities by an FII under section 115AD, other than those at B7"]].forEach(([k,l])=>{
      s6+=sub(l);s6+=sec48("cg."+k+".",C[k]||{},B[k],{unq:1,deds:["s54F"]});
      s6+=row("e · Long-term gain (c − d)",cell(B[k].gain),{cls:"grand"});});
    h+=fold("B6","B5","For a non-resident — unlisted securities under 112(1)(c), bonds or GDRs under 115AC, and FII securities under 115AD",
      (B.b6i.gain+B.b6ii.gain+B.b6iii.gain)?st(B.b6i.gain+B.b6ii.gain+B.b6iii.gain):"none",s6);
    let s6b=sec48("cg.b6iv.",C.b6iv||{},B.b6iv,{deds:["s54F"]});
    s6b+=row("c · Long-term gain (a − b)",cell(B.b6iv.gain),{ref:"B6c",cls:"grand"});
    h+=fold("B6b","B6","For a non-resident — bonds or GDRs under section 115AC",B.b6iv.gain?st(B.b6iv.gain):"none",s6b);
    let s7=note("Fed from Schedule 115AD(1)(iii) proviso — scrip by scrip, the FII's counterpart of Schedule 112A.");
    s7+=grid("cg.s115ad",[{k:"isin",h:"ISIN",t:"txt",w:"130px",max:12},
      {k:"name",h:"Name of the share or unit",t:"txt",w:"auto"},
      {k:"pre18",h:"Held on 31-01-2018",t:"sel",w:"130px",opts:[["AE","No"],["BE","Yes"]]},
      {k:"qty",h:"Quantity",t:"num",w:"92px"},{k:"price",h:"Sale price each",t:"num",w:"104px"},
      {k:"cost",h:"Cost",t:"num",w:"104px"},{k:"fmv18",h:"Value on 31-01-2018",t:"num",w:"120px"},
      {k:"exp",h:"Expenses",t:"num",w:"92px"},{k:"bal",h:"Gain",t:"calc",w:"104px",f:r=>r._?r._.bal:0}],
      S.cg.s115ad||[],{min:"1300px",empty:"No scrip.",add:"Add a scrip",
      foot:[{l:1,v:"Column 14 — feeds 7a",span:8},{v:G.s115ad.bal}]});
    s7+=row("a · LTCG under 112A — the sum of column 14",cell(G.s115ad.bal),{ref:"7a",cls:"tot"});
    s7+=row("b · Deduction under section 54F",inp("cg.b7.b",{n:1}),{ref:"7b"});
    s7+=row("c · Long-term gain (7a − 7b)",cell(B.b7.gain),{ref:"B7c",cls:"grand"});
    h+=fold("B7","B7","For an FII — securities under section 115AD, including equity with STT through the 115AD(1)(iii) proviso",B.b7.gain?st(B.b7.gain):"none",s7);
    let s8=row("a · LTCG on a foreign-exchange asset under section 115F, without indexation",inp("cg.b8.a",{n:1}),{ref:"8a"});
    s8+=row("b · Less: deduction under section 115F",inp("cg.b8.b",{n:1}),{ref:"8b"});
    s8+=row("d · LTCG on any other asset under section 115E",inp("cg.b8.d",{n:1}),{ref:"8d"});
    s8+=row("c · Balance long-term gain",cell(B.b8.gain),{ref:"B8c",cls:"grand"});
    h+=fold("B8","B8","For a non-resident Indian — foreign-exchange asset under Chapter XII-A",B.b8.gain?st(B.b8.gain):"none",s8);
  }
  let s9=sec48("cg.b9.",C.b9||{},B.b9,{unq:1,deds:["s54F"]});
  s9+=row("e · LTCG on assets at B9 (c − d)",cell(B.b9.gain),{ref:"B9e",cls:"grand"});
  h+=fold("B9","B9","From sale of assets where B1 to B8 do not apply",B.b9.gain?st(B.b9.gain):"none",s9);
  let s10=sub("a · Unutilised capital gain from an earlier year, deposited in a Capital Gains Account Scheme");
  s10+=grid("cg.b10.deem",[{k:"py",h:"Previous year the asset was transferred",t:"sel",w:"180px",req:1,
      opts:[["2023-24","2023-24"],["2024-25","2024-25"]]},
    {k:"sec",h:"Section claimed that year",t:"sel",w:"140px",req:1,
      opts:["54","54B","54D","54EC","54F","54G","54GA","54GB","115F"].map(x=>[x,x])},
    {k:"acqyr",h:"Year the new asset was acquired",t:"sel",w:"150px",opts:[["2023","2023"],["2024","2024"],["2025","2025"]]},
    {k:"used",h:"Amount utilised",t:"num",w:"150px"},
    {k:"unused",h:"Amount not used — deemed income",t:"num",w:"180px",req:1}],
    (C.b10||{}).deem||[],{min:"900px",empty:"Nothing deemed.",add:"Add a year"});
  s10+=row("b · Amount deemed to be long-term capital gain, other than at a",inp("cg.b10.other",{n:1}),{ref:"10b"});
  s10+=row("Total amount deemed to be long-term capital gain",cell(B.b10.gain),{ref:"B10",cls:"grand"});
  h+=fold("B10","B10","Amount deemed to be long-term capital gain",B.b10.gain?st(B.b10.gain):"none",s10);
  let s11=note("Fill up Schedule PTI.");
  [["r10a","chargeable at 10% under 112A"],["r125a","chargeable at 12.5% under 112A"],
   ["r10o","chargeable at 10% under other sections"],["r125o","chargeable at 12.5% under other sections"],
   ["r20","chargeable at 20%"]].forEach(([k,l])=>s11+=row(l,inp("cg.b11."+k,{n:1}),{ind:1}));
  s11+=row("Pass-through income in the nature of long-term capital gain",cell(B.b11.gain),{ref:"B11",cls:"grand"});
  h+=fold("B11","B11","Pass-through income or loss in the nature of long-term capital gain",B.b11.gain?st(B.b11.gain):"none",s11);
  if(nri){
    let s12=grid("cg.b12",[{k:"amt",h:"Amount of income",t:"num",w:"130px",req:1},
      {k:"item",h:"Item B1 to B11 in which included",t:"sel",w:"150px",req:1,
        opts:["B1e","B2e","B3e","B4c","B5c","B6e","B7c","B8c","B9e","B10","B11"].map(x=>[x,x])},
      {k:"country",h:"Country name and code",t:"txt",w:"180px",req:1},
      {k:"article",h:"Article of the DTAA",t:"txt",w:"110px",req:1},
      {k:"rate",h:"Rate per treaty (NIL if not chargeable)",t:"txt",w:"140px",req:1},
      {k:"trc",h:"TRC obtained?",t:"sel",w:"100px",opts:[["Y","Yes"],["N","No"]]},
      {k:"sec",h:"Section of the Act",t:"txt",w:"110px",req:1},
      {k:"itrate",h:"Rate per the Act",t:"num",w:"110px",req:1}],
      C.b12||[],{min:"1180px",empty:"No DTAA claim.",add:"Add a claim"});
    s12+=row("a · Total LTCG not chargeable to tax in India under a DTAA",cell(B.b12.notTax),{ref:"B12a",cls:"tot"});
    s12+=row("b · Total LTCG chargeable at special rates under a DTAA",cell(B.b12.special),{ref:"B12b",cls:"tot"});
    h+=fold("B12","B12","LTCG claimed as not chargeable, or at special rates, under a DTAA",
      (B.b12.notTax+B.b12.special)?st(B.b12.notTax+B.b12.special):"none",s12);
  }
  let sB=note("Can be claimed only if the corresponding dividend under section 2(22)(f) is offered in Schedule OS.");
  sB+=grid("cg.bA",[{k:"rate",h:"Rate",t:"sel",w:"220px",req:1,opts:[["LTL125","Long-term at 12.5%"]]},
    {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],C.bA||[],{min:"460px",empty:"No buy-back loss.",add:"Add a row"});
  h+=fold("BA","B(A)","Capital loss on buy-back of shares — long-term at 12.5%",B.bA.loss?"("+st(B.bA.loss)+")":"none",sB);
  h+=row("Total long-term capital gain chargeable under the Act (B1g + B2e + B3 + B4c + B5 + B6 + B7c + B8c + B9e + B10 + B11 − B12a + B(A))",
    cell(B.total),{ref:"B12",cls:"grand"});
  return h;
}

/* ---- Part D: the sheet's exact columns, section by section --------- */
const D_COLS={
 "54":[["transfer","Date of transfer of original asset","date"],["cost","Cost of new residential house","num"],
   ["purchase","Date of purchase or construction of the new house","date"],
   ["dep","Amount deposited in the Capital Gains Accounts Scheme before the due date","num"],
   ["depdt","Date of deposit","date"],["acno","Account number","txt"],["ifsc","IFS code","txt"]],
 "54B":[["transfer","Date of transfer of original asset","date"],["cost","Cost of new agricultural land","num"],
   ["purchase","Date of purchase of the new agricultural land","date"],
   ["dep","Amount deposited in the Capital Gains Accounts Scheme before the due date","num"],
   ["depdt","Date of deposit","date"],["acno","Account number","txt"],["ifsc","IFS code","txt"]],
 "54D":[["transfer","Date of acquisition of original asset","date"],
   ["cost","Cost of purchase or construction of new land or building for the industrial undertaking","num"],
   ["purchase","Date of purchase of the new land or building","date"],
   ["dep","Amount deposited in the Capital Gains Accounts Scheme before the due date","num"]],
 "54EC":[["transfer","Date of transfer of original asset","date"],
   ["cost","Amount invested in specified or notified bonds — not exceeding fifty lakh rupees","num"],
   ["purchase","Date of investment","date"]],
 "54EE":[["transfer","Date of transfer of original residential property","date"],
   ["cost","Amount invested in specified assets","num"],["purchase","Date of investment","date"]],
 "54F":[["transfer","Date of transfer of original asset","date"],["cost","Cost of new residential house","num"],
   ["purchase","Date of purchase or construction of the new house","date"],
   ["dep","Amount deposited in the Capital Gains Accounts Scheme before the due date","num"],
   ["depdt","Date of deposit","date"],["acno","Account number","txt"],["ifsc","IFS code","txt"]],
 "54G":[["transfer","Date of transfer of original asset from the urban area","date"],
   ["cost","Cost and expenses incurred for purchase or construction of the new asset","num"],
   ["purchase","Date of purchase or construction of the new asset in an area other than urban","date"],
   ["dep","Amount deposited in the Capital Gains Accounts Scheme before the due date","num"]],
 "54GA":[["transfer","Date of transfer of original asset","date"],
   ["cost","Cost and expenses of the new asset in the special economic zone","num"],
   ["purchase","Date of purchase or construction","date"],
   ["dep","Amount deposited in the Capital Gains Accounts Scheme before the due date","num"]],
 "54GB":[["transfer","Date of transfer of original residential property","date"],
   ["copan","PAN of the eligible company","txt"],
   ["cost","Amount utilised for subscription of equity shares of the eligible company","num"],
   ["purchase","Date of subscription of the shares","date"],
   ["plant","Cost of new plant and machinery purchased by the eligible company","num"],
   ["plantdt","Date of purchase of the plant and machinery","date"],
   ["dep","Amount deposited in the Capital Gains Accounts Scheme before the due date","num"]],
 "115F":[["transfer","Date of transfer of original foreign-exchange asset","date"],
   ["cost","Amount invested in the new specified asset or savings certificate","num"],
   ["purchase","Date of investment","date"]]
};
function partD(){
  const G=S.C.cg;let h="";
  const secs=Object.keys(G.dedD);
  if(!secs.length)return note("No exemption has been claimed in Part A or Part B, so there is nothing to give particulars of.");
  h+=note("In case of deduction under 54, 54B, 54EC, 54F or 115F give the following details. Every "+
    "exemption claimed above appears here with the columns the form asks for that section. Dates are "+DF+".");
  const letters={"54":"a","54B":"b","54D":"c","54EC":"c","54EE":"e","54F":"d","54G":"f","54GA":"f","54GB":"e","115F":"e"};
  secs.forEach(sec=>{
    const rows=G.dedD[sec],cols=D_COLS[sec]||D_COLS["54F"];
    const tot=rows.reduce((a,r)=>a+r.amt,0);
    let b="";
    rows.forEach((r,k)=>{const p="cg.dedD."+sec+"."+k+".";
      b+=sub("Sl. "+(k+1));
      cols.forEach(([key,label,typ])=>{
        b+=row(label,typ==="date"?dte(p+key):(typ==="num"?inp(p+key,{n:1}):inp(p+key,{max:key==="ifsc"?11:key==="copan"?10:40})),
          {req:1,ind:1});});
      b+=row("Amount of deduction claimed",cell(r.amt),{cls:"tot",ind:1});});
    b+=row("Total",cell(tot),{cls:"tot"});
    h+=fold("D_"+sec,letters[sec]||"",'Deduction claimed under section '+sec,RS(tot),b);
  });
  h+=row("f · Total deduction claimed",cell(G.dedTotal),{ref:"Df",cls:"grand"});
  return h;
}
/* ---- Part E: the utility's live table — six slots, with the edit switch */
const E_ROWS=[["st20","ii","Short-term capital gain at 20%"],["st30","iii","Short-term capital gain at 30%"],
  ["stApp","iv","Short-term capital gain at applicable rate"],["stDTAA","v","Short-term capital gain at DTAA rates"],
  ["lt125","vi","Long-term capital gain at 12.5%"],["ltDTAA","vii","Long-term capital gain at DTAA rates"]];
const E_LOSSCOL=[["st20","20%"],["st30","30%"],["stApp","applicable rate"],["stDTAA","DTAA rates"],
  ["lt125","12.5%"],["ltDTAA","DTAA rates"]];
function partE(){
  const G=S.C.cg,ed=!!S.cg.editE;let h="";
  h+=note("Set-off of current-year capital losses against current-year capital gains, excluding the amounts "+
    "in A9a and B12a that are not chargeable under a DTAA. Filled from Parts A and B: a short-term loss may "+
    "go against any gain, a long-term loss only against a long-term gain, nothing against its own slot.");
  h+='<div class="full"><table class="gt" style="min-width:1100px"><thead><tr>'+
     '<th class="l" style="width:36px">Sl.</th><th class="l" style="min-width:230px">Type of capital gain</th>'+
     '<th style="width:120px">Capital gain of the year — positive only</th>'+
     '<th colspan="4">Short-term capital loss</th><th colspan="2">Long-term capital loss</th>'+
     '<th style="width:130px">Gain remaining after set-off</th></tr><tr><th></th><th></th><th></th>';
  E_LOSSCOL.forEach(([k,l])=>h+='<th style="width:90px">'+esc(l)+'</th>');
  h+='<th></th></tr></thead><tbody>';
  h+='<tr><td class="l">i</td><td class="l"><b>Capital loss to be set off — negative only</b></td><td></td>';
  E_LOSSCOL.forEach(([k])=>h+='<td class="num">'+cell(-G.loss[k])+'</td>');h+='<td></td></tr>';
  E_ROWS.forEach(([k,sl,label])=>{
    h+='<tr><td class="l">'+sl+'</td><td class="l">'+esc(label)+'</td><td class="num">'+cell(G.gain[k])+'</td>';
    E_LOSSCOL.forEach(([lk])=>{
      const own=(lk===k),longV=(lk.startsWith("lt")&&!k.startsWith("lt"));
      if(own||longV){h+='<td class="num" style="background:var(--closed)"></td>';return;}
      const v=(G.matrix[k]||{})[lk]||0;
      h+='<td class="num">'+(ed?inp("cg.Eover."+k+"."+lk,{n:1}):cell(v))+'</td>';});
    h+='<td class="num">'+cell(G.after[k])+'</td></tr>';});
  h+='</tbody><tfoot><tr><td class="l">viii</td><td class="l">Total loss set off (ii + iii + iv + v + vi + vii)</td><td></td>';
  E_LOSSCOL.forEach(([k])=>h+='<td>'+F(G.used[k])+'</td>');h+='<td>'+F(G.C1)+'</td></tr>';
  h+='<tr><td class="l">ix</td><td class="l">Loss remaining after set-off (i − viii)</td><td></td>';
  E_LOSSCOL.forEach(([k])=>h+='<td>'+F(G.loss[k]-G.used[k])+'</td>');h+='<td></td></tr></tfoot></table></div>';
  h+=row("Do you want to edit the detail auto-populated above?",sel("cg.editE",[["","No"],["1","Yes"]],{blank:false}),
    {hint:ed?"type the set-off amounts into the cells above":"the utility fills this; switch to edit it"});
  if(ed){const bad=E_ROWS.filter(([k])=>G.absorbed[k]>G.gain[k]);
    if(bad.length)h+=note("More loss has been set against a slot than it holds: "+bad.map(x=>x[2]).join(", ")+".","stop");}
  return h;
}
/* ---- Part F: auto-filled, then editable ---------------------------- */
const F_ROWS=[["st20","Short-term capital gains taxable at 20% — item 3iii of Schedule BFLA"],
  ["st30","Short-term capital gains taxable at 30% — item 3iv of Schedule BFLA"],
  ["stApp","Short-term capital gains taxable at applicable rates — item 3v of Schedule BFLA"],
  ["stDTAA","Short-term capital gains taxable at DTAA rates — item 3vi of Schedule BFLA"],
  ["lt125","Long-term capital gains taxable at 12.5% — item 3vii of Schedule BFLA"],
  ["ltDTAA","Long-term capital gains taxable at DTAA rates — item 3viii of Schedule BFLA"]];
function partF(){
  const G=S.C.cg,ed=!!S.cg.editF;let h="";
  const seniorRes=S.pi.res==="RES"&&S.pi.status==="I"&&senior();
  if(seniorRes)h+=note("Table F is not mandatory for a resident senior citizen or super senior citizen — no "+
    "advance tax is due, so interest under 234C does not arise.");
  h+=note("The quarter each gain accrued in. Each row must add up to the gain after brought-forward losses — "+
    "3(iii) to 3(viii) of Schedule BFLA. Filled from the sale dates on the land blocks; the rest falls in the fourth "+
    "quarter. Switch on editing to enter the split yourself.");
  h+='<div class="full"><table class="gt" style="min-width:1000px"><thead><tr>'+
     '<th class="l" style="min-width:300px">Type of capital gain</th>';
  ["Up to 15/6 (i)","16/6 to 15/9 (ii)","16/9 to 15/12 (iii)","16/12 to 15/3 (iv)","16/3 to 31/3 (v)"].forEach(q=>h+='<th style="width:110px">'+q+'</th>');
  h+='<th style="width:120px">Total</th></tr></thead><tbody>';
  const LB=S.C.loss.afterB||{};
  F_ROWS.forEach(([k,l])=>{if(!(LB[k]>0)&&!ed)return;
    const sum=G.F[k].reduce((a,x)=>a+x,0);const off=Math.abs(sum-(LB[k]||0))>1;
    h+='<tr><td class="l">'+esc(l)+'</td>';
    G.F[k].forEach((v,i)=>h+='<td class="num">'+(ed?inp("cg.Fover."+k+"."+i,{n:1}):cell(v))+'</td>');
    h+='<td class="num"'+(off&&ed?' style="color:var(--red)"':'')+'>'+cell(LB[k]||0)+
       (off&&ed?'<span class="dt">split is '+F(sum)+'</span>':'')+'</td></tr>';});
  if(G.C2){const vq=[0,0,0,0,0];(S.cg.vda||[]).forEach(r=>{if(r._&&r._.inc)vq[r._.q]+=r._.inc;});
    h+='<tr><td class="l">Capital gains on transfer of virtual digital assets at 30% — item 16 of Schedule SI</td>';
    vq.forEach(v=>h+='<td class="num">'+cell(v)+'</td>');h+='<td class="num">'+cell(G.C2)+'</td></tr>';}
  h+='</tbody></table></div>';
  h+=row("Do you want to edit the detail auto-populated above?",sel("cg.editF",[["","No"],["1","Yes"]],{blank:false}));
  return h;
}

/* ---- the section ---------------------------------------------------- */
function secCG(){
  const G=S.C.cg;let h="";
  h+=row("Is there any capital gain or loss?",sel("cg.on",[["","No"],["1","Yes"]],{blank:false}),{req:1});
  if(!S.cg.on)return h;
  h+=note("Six parts. <b>A</b> and <b>B</b> hold the gains, head by head. <b>C</b> is the summary. "+
    "<b>D</b> proves every exemption. <b>E</b> sets losses against gains. <b>F</b> is when each gain arose.");
  if(!G.nri)h+=note("Heads A3(ii), A4, A5, A9, B5 to B8 and B12 are for non-residents and are hidden. "+
    "They appear when residential status is set to non-resident in <b>Assessee Information</b>.");
  h+='<div class="cgband">A · Short-term capital gains</div>';
  h+='<div class="cghead on"><div class="cghb open">'+partA()+'</div></div>';
  h+='<div class="cgband">B · Long-term capital gains</div>';
  h+='<div class="cghead on"><div class="cghb open">'+partB()+'</div></div>';
  h+='<div class="cgsubband">Schedule 112A — listed equity and equity funds with STT, scrip by scrip</div>';
  h+=grid("cg.s112a",[{k:"isin",h:"ISIN",t:"txt",w:"130px",max:12,ph:"INE009A01021"},
    {k:"name",h:"Name of the share or unit",t:"txt",w:"auto"},
    {k:"pre18",h:"Held on 31-01-2018",t:"sel",w:"130px",opts:[["AE","No"],["BE","Yes"]]},
    {k:"qty",h:"Quantity",t:"num",w:"92px"},{k:"price",h:"Sale price each",t:"num",w:"104px"},
    {k:"cost",h:"Cost",t:"num",w:"104px"},{k:"fmv18",h:"Value on 31-01-2018",t:"num",w:"120px"},
    {k:"exp",h:"Expenses",t:"num",w:"92px"},{k:"bal",h:"Gain",t:"calc",w:"104px",f:r=>r._?r._.bal:0}],
    S.cg.s112a,{min:"1300px",empty:"No listed equity sold.",add:"Add a scrip",
    foot:[{l:1,v:"Column 14 — feeds B4a",span:8},{v:G.s112a.bal}]});
  h+='<div class="cgsubband">Schedule VDA — virtual digital assets</div>';
  h+=grid("cg.vda",[{k:"buy",h:"Date of acquisition",t:"date",w:"130px"},{k:"sale",h:"Date of transfer",t:"date",w:"130px"},
    {k:"cost",h:"Cost of acquisition",t:"num",w:"130px"},{k:"cons",h:"Consideration",t:"num",w:"130px"},
    {k:"inc",h:"Income",t:"calc",w:"110px",f:r=>r._?r._.inc:0}],
    S.cg.vda,{min:"760px",empty:"No virtual digital asset transferred.",add:"Add a transfer",
    foot:[{l:1,v:"Column 7 — feeds C2",span:4},{v:G.vda.cg}]});
  h+='<div class="cgband">C · Income chargeable under the head</div>';
  h+=row("C1 · Sum of capital-gain incomes — after the set-off in Table E",cell(G.C1),{ref:"C1",cls:"tot"});
  h+=row("C2 · Income from transfer of virtual digital assets — column 7 of Schedule VDA",cell(G.C2),{ref:"C2"});
  h+=row("C3 · Income chargeable under the head Capital Gains (C1 + C2)",cell(G.C3),{ref:"C3",cls:"grand"});
  h+='<div class="cgband">D · Information about deductions claimed against capital gains</div>';
  h+=partD();
  h+='<div class="cgband">E · Set-off of current-year capital losses with current-year capital gains</div>';
  h+=partE();
  h+='<div class="cgband">F · Information about accrual or receipt of capital gain</div>';
  h+=partF();
  return h;
}
