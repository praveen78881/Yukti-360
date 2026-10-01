/* ==================================================================
   OTHER SOURCES — the book's 1-to-9 working
   ================================================================== */
const OS_STATE_DEFAULT={
  on:false,
  d:{},            /* 1a — divOrd, div22e, div22f */
  i:{},            /* 1b — sav, dep, refund, pti, pf11a, pf11b, pf12a, pf12b, others */
  rent:"",         /* 1c */
  g:{},            /* 1d — money, immWithout, immInadeq, othWithout, othInadeq */
  e:{fap:"",n89a_US:"",n89a_UK:"",n89a_CA:"",oth89a:"",prev89a:"",s562xii:"",s562xiii:""},
  eOther:[],       /* 1e free rows {nature, amt} */
  sp:{},           /* 2a(i) lottery, 2a(ii) online, 2b six lines */
  pf111:[],        /* 2c rows {ay, incben, taxben} */
  spl:[],          /* 2d rows {code, amt} */
  pti:[],          /* 2e rows {code, amt} */
  dtaa:[],         /* 2f rows */
  ded:{},          /* 3 — exp, intClaimed, dep */
  s58:"",s59:"",rel89a:"",
  horse:{on:false},/* 8 — rec, ded57, s58, s59 */
  Q:{},            /* 10 — quarterly cells keyed row.q */
  editQ:false
};
/* the 21 special-rate natures — 2d and 2e — from the schema */
const OS_SPL=[
 ["5A1ai","115A(1)(a)(i) — dividends, interest and units bought in foreign currency",20],
 ["5A1aA","115A(1)(a)(A) — non-resident's dividend from an IFSC unit",10],
 ["5A1aii","115A(1)(a)(ii) — interest from government or Indian concerns in foreign currency",20],
 ["5A1aiia","115A(1)(a)(iia) — interest from an infrastructure debt fund",5],
 ["5A1aiiaa","115A(1)(a)(iiaa) — interest under 194LC(1)",5],
 ["5A1aiiaaP","115A(1)(a)(iiaa) — proviso to 194LC(1)",4],
 ["5A1aiiaa2P","115A(1)(a)(iiaa) — second proviso to 194LC(1), non-resident",9],
 ["5A1aiiab","115A(1)(a)(iiab) — interest under 194LD",5],
 ["5A1aiiac","115A(1)(a)(iiac) — interest under 194LBA",5],
 ["5A1aiii","115A(1)(a)(iii) — UTI units bought in foreign currency",20],
 ["5A1bA","115A(1)(b)(A) and (B) — royalty and technical services",20],
 ["5AC1ab","115AC(1)(a) — non-resident's interest on foreign-currency bonds",10],
 ["5AC1abD","115AC(1)(b) — non-resident's dividend on GDRs",10],
 ["5ACA1a","115ACA(1)(a) — resident's income from GDRs",10],
 ["5AD1i","115AD(1)(i) — FII's income other than dividend on securities",20],
 ["5AD1iP","115AD(1)(i) — FII's income on bonds and government securities under 194LD",5],
 ["5AD1iDiv","115AD(1)(i) — FII's dividend on securities",20],
 ["5BBA","115BBA — non-resident sportsmen and sports associations",20],
 ["5BBF","115BBF — income from a patent",10],
 ["5BBG","115BBG — transfer of carbon credits",10],
 ["5Ea","115E(a) — non-resident Indian's investment income",20]];
/* 2f — which item of this schedule, and which section of the Act */
const OS_NATURE=["1ai","1aiii","1b","1c","1d","2ai","2aii","2d","2e"];
const OS_ITEMNO=[["56i","56(2)(i) — dividends"],["56i_f","56(2)(i) — dividends under 2(22)(f)"],
 ["56","56(2) — interest"],["562iii","56(2)(iii) — rent from machinery, plants, buildings"],
 ["562x","56(2)(x)"],["5BB","115BB — lotteries, puzzles, races, games"],["5BBJ","115BBJ — online games"]]
 .concat(OS_SPL.map(x=>[x[0],x[1]])).concat(OS_SPL.map(x=>["PTI_"+x[0],"Pass-through — "+x[1]]));
/* 10 — the quarterly rows, with the schema key of each */
const OS_Q=[
 ["lottery","Winnings from lotteries, crossword puzzles, races, games, gambling, betting — 115BB","IncFrmLottery",1],
 ["online","Winnings from online games — 115BBJ","IncFrmOnGames",0],
 ["div1ai","Dividend income referred to in 1a(i)","DividendIncUs115BBDA",1],
 ["div1aiii","Dividend income referred to in 1a(iii)","DividendIncUs115BBDAaiii",1],
 ["div115A","Dividend under 115A(1)(a)(i) at 20%, including pass-through","DividendIncUs115A1ai",1],
 ["div115AA","Dividend under the proviso to 115A(1)(a)(A) at 10%, including pass-through","DividendIncUs115A1aA",0],
 ["div115AC","Dividend under 115AC at 10%","DividendIncUs115AC",1],
 ["div115ACA","Dividend under 115ACA(1)(a) at 10%, including pass-through","DividendIncUs115ACA",1],
 ["div115AD","Dividend under 115AD(1)(i) at 20%, other than 115AB units","DividendIncUs115AD1i",1],
 ["n89a","Retirement benefit account in a notified country under 89A — taxable portion after relief","NOT89A",1],
 ["divDTAA","Dividend income taxable at DTAA rates","DividendDTAA",1]];

function engOS(){
  const O=S.os2;
  const z={on:false,a:{tot:0},b:{tot:0},c:0,d:{tot:0},e:{tot:0,n89a:0},one:0,two:0,
    sp:{lottery:0,online:0,bbe:0,pf111:0,spl:0,pti:0,dtaa:0,dtaaNotTax:0},ded:{tot:0,intElig:0},
    s58:0,s59:0,rel89a:0,six:0,seven:0,horse:{bal:0},nine:0,income:0,special:0,gross:0,div:0,
    fap:0,sav:0,dep:0,loss:0,horseLoss:0,Q:{},buckets:{}};
  if(!O||!O.on)return z;
  const g=(o,k)=>N((o||{})[k]);
  /* ---- 1a dividends ---- */
  const a={ord:g(O.d,"ord"),e22:g(O.d,"e22"),f22:g(O.d,"f22")};a.tot=R(a.ord+a.e22+a.f22);
  /* ---- 1b interest, nine lines ---- */
  const bi=["sav","dep","refund","pti","pf11a","pf11b","pf12a","pf12b","others"];
  const b={};bi.forEach(k=>b[k]=g(O.i,k));b.tot=R(bi.reduce((s,k)=>s+b[k],0));
  /* ---- 1c rent ---- */
  const c=R(N(O.rent));
  /* ---- 1d 56(2)(x) ---- */
  const d={money:g(O.g,"money"),immWithout:g(O.g,"immWithout"),immInadeq:g(O.g,"immInadeq"),
    othWithout:g(O.g,"othWithout"),othInadeq:g(O.g,"othInadeq")};
  d.tot=R(d.money+d.immWithout+d.immInadeq+d.othWithout+d.othInadeq);
  /* ---- 1e any other ---- */
  const e={fap:g(O.e,"fap"),n89a:R(g(O.e,"n89a_US")+g(O.e,"n89a_UK")+g(O.e,"n89a_CA")),
    oth89a:g(O.e,"oth89a"),prev89a:g(O.e,"prev89a"),s562xii:g(O.e,"s562xii"),s562xiii:g(O.e,"s562xiii"),
    free:R((O.eOther||[]).reduce((s,r)=>s+N(r.amt),0))};
  e.tot=R(e.fap+e.n89a+e.oth89a+e.prev89a+e.s562xii+e.s562xiii+e.free);
  const one=R(a.tot+b.tot+c+d.tot+e.tot);
  /* ---- 2 special rates ---- */
  const sp={lottery:g(O.sp,"lottery"),online:g(O.sp,"online"),
    bbe:{s68:g(O.sp,"s68"),s69:g(O.sp,"s69"),s69A:g(O.sp,"s69A"),s69B:g(O.sp,"s69B"),s69C:g(O.sp,"s69C"),s69D:g(O.sp,"s69D")}};
  sp.bbeTot=R(Object.values(sp.bbe).reduce((s,v)=>s+v,0));
  sp.pf111inc=R((O.pf111||[]).reduce((s,r)=>s+N(r.incben),0));
  sp.pf111tax=R((O.pf111||[]).reduce((s,r)=>s+N(r.taxben),0));
  sp.spl=R((O.spl||[]).reduce((s,r)=>s+N(r.amt),0));
  sp.pti=R((O.pti||[]).reduce((s,r)=>s+N(r.amt),0));
  const dtaaRows=(O.dtaa||[]);
  sp.dtaa=R(dtaaRows.reduce((s,r)=>s+N(r.amt),0));
  sp.dtaaNotTax=R(dtaaRows.filter(r=>/^nil$/i.test(st0(r.treaty))||N(r.treaty)===0).reduce((s,r)=>s+N(r.amt),0));
  const two=R(sp.lottery+sp.online+sp.bbeTot+sp.pf111inc+sp.spl+sp.pti+sp.dtaa);
  /* ---- 3 deductions under 57, with the form's conditions ---- */
  const capFap=isNew()?25000:15000;
  const ded={exp:g(O.ded,"exp"),
    iia:e.fap?Math.min(Math.round(e.fap/3),capFap):0,
    dep:c>0?g(O.ded,"dep"):0,
    intClaimed:g(O.ded,"intClaimed")};
  const divBase=a.ord+a.e22;
  ded.intElig=divBase>0?Math.min(ded.intClaimed,R(divBase*0.20)):0;
  ded.tot=R(ded.exp+ded.iia+ded.dep+ded.intElig);
  const s58=N(O.s58),s59=N(O.s59),rel89a=N(O.rel89a);
  /* ---- 6 net at normal rates: 1 (less DTAA portion) − 3 + 4 + 5 − 5a ---- */
  const oneNet=one-sp.dtaaNotTax;
  const six=R(oneNet-ded.tot+s58+s59-rel89a);
  /* ---- 7: 2 + 6, taking 6 as nil if negative ---- */
  const seven=R(two+Math.max(0,six));
  /* ---- 8 race horses ---- */
  const H=O.horse||{};
  const horse={on:!!H.on,rec:g(H,"rec"),ded57:g(H,"ded57"),s58:g(H,"s58"),s59:g(H,"s59")};
  horse.bal=horse.on?R(horse.rec-horse.ded57+horse.s58+horse.s59):0;
  /* ---- 9: 7 + 8e, 8e as nil if negative ---- */
  const nine=R(seven+Math.max(0,horse.bal));
  /* the pieces the tax engine and Part B-TI read */
  const special=R(two);
  const income=R(Math.max(0,six));           /* normal-rate income into GTI */
  const loss=R(Math.max(0,-six));            /* normal-rate loss → CYLA */
  const horseLoss=R(Math.max(0,-horse.bal)); /* → CFL 6(xi) */
  /* ---- 10 quarterly ---- */
  const dtaaDiv=R(dtaaRows.filter(r=>/^1ai$/.test(r.nature||"")).reduce((s,r)=>s+N(r.amt),0));
  const divHi=Math.max(0,a.ord-dtaaDiv),divLo=Math.max(0,a.ord-dtaaDiv-R(ded.intElig));  /* rule 214: the 1a(i) quarter may net anything from 0 up to the full 57(i) interest — enter the figure the portal expects */
  const auto={lottery:sp.lottery,online:sp.online,div1ai:divHi,div1aiii:a.f22,
    div115A:0,div115AA:0,div115AC:0,div115ACA:0,div115AD:0,n89a:Math.max(0,e.n89a-rel89a),divDTAA:0};
  (O.spl||[]).concat(O.pti||[]).forEach(r=>{const m={"5A1ai":"div115A","5A1aA":"div115AA","5AC1abD":"div115AC",
    "5ACA1a":"div115ACA","5AD1iDiv":"div115AD"}[r.code];if(m)auto[m]+=N(r.amt);});
  dtaaRows.forEach(r=>{if(/^1a/.test(r.nature||""))auto.divDTAA+=N(r.amt);});
  const Q={};
  OS_Q.forEach(([k])=>{const ov=(O.Q||{})[k];
    if(O.editQ&&ov&&Object.values(ov).some(v=>st0(v)!==""))Q[k]=[0,1,2,3,4].map(i=>N(ov[i]));
    else Q[k]=[0,0,0,R(auto[k]||0),0];});
  const buckets={si115bb:sp.lottery,si115bbj:sp.online,si115bbe:sp.bbeTot,
    si115bbf:R((O.spl||[]).filter(r=>r.code==="5BBF").reduce((s,r)=>s+N(r.amt),0)),
    si115bbg:R((O.spl||[]).filter(r=>r.code==="5BBG").reduce((s,r)=>s+N(r.amt),0))};
  return {on:true,a,b,c,d,e,one:R(one),oneNet:R(oneNet),two:R(two),sp,ded,s58:R(s58),s59:R(s59),rel89a:R(rel89a),
    six,seven,horse,nine,income,loss,horseLoss,special,gross:R(one),div:R(a.tot),fap:R(e.fap),sav:R(b.sav),
    dep:R(b.dep),Q,auto,divLo,divHi,buckets};
}



/* ---------------- 5 · Other sources — the book's working ------------ */
function secOS(){
  const O=S.C.os,X=S.os2||{};let h="";
  h+=row("Is there any income from other sources?",sel("os2.on",[["","No"],["1","Yes"]],{blank:false}),{req:1});
  if(!X.on)return h;
  h+=note("A working, numbered 1 to 9: gross income at normal rates, plus income at special rates, "+
    "less deductions under section 57, adjusted under 58 and 59 and for 89A relief, then race horses "+
    "on their own. Include the income of the specified persons — spouse, minor child — referred to in "+
    "Schedule SPI.");
  /* ===== 1 ===== */
  h+='<div class="cgband">1 · Gross income chargeable to tax at normal applicable rates (1a + 1b + 1c + 1d + 1e)</div>';
  let a=row("i · Dividend income, other than (ii) and (iii)",inp("os2.d.ord",{n:1}),{ref:"1ai"});
  a+=row("ii · Dividend income under section 2(22)(e)",inp("os2.d.e22",{n:1}),{ref:"1aii",
    hint:"deemed dividend — a loan or advance by a closely-held company to a substantial shareholder"});
  a+=row("iii · Dividend income under section 2(22)(f)",inp("os2.d.f22",{n:1}),{ref:"1aiii",
    hint:"buy-back of shares — this is what unlocks the buy-back loss at A(A) and B(A) in Schedule CG"});
  a+=row("a · Dividends, gross (ai + aii + aiii)",cell(O.a.tot),{ref:"1a",cls:"tot"});
  h+=fold("os1a","1a","Dividends, gross",O.a.tot?RS(O.a.tot):"none",a,{def:1});
  let b=row("i · From savings bank",inp("os2.i.sav",{n:1}),{ref:"1bi"});
  b+=row("ii · From deposit — bank, post office, co-operative",inp("os2.i.dep",{n:1}),{ref:"1bii"});
  b+=row("iii · From income-tax refund",inp("os2.i.refund",{n:1}),{ref:"1biii"});
  b+=row("iv · In the nature of pass-through income or loss",inp("os2.i.pti",{n:1}),{ref:"1biv"});
  b+=row("v · Interest on provident-fund contributions taxable under the first proviso to 10(11)",inp("os2.i.pf11a",{n:1}),{ref:"1bv"});
  b+=row("vi · — under the second proviso to 10(11)",inp("os2.i.pf11b",{n:1}),{ref:"1bvi"});
  b+=row("vii · — under the first proviso to 10(12)",inp("os2.i.pf12a",{n:1}),{ref:"1bvii"});
  b+=row("viii · — under the second proviso to 10(12)",inp("os2.i.pf12b",{n:1}),{ref:"1bviii"});
  b+=row("ix · Others, including interest from companies, NBFCs and HFCs",inp("os2.i.others",{n:1}),{ref:"1bix"});
  b+=row("b · Interest, gross (bi to bix)",cell(O.b.tot),{ref:"1b",cls:"tot"});
  h+=fold("os1b","1b","Interest, gross",O.b.tot?RS(O.b.tot):"none",b,{def:1});
  h+=row("c · Rental income from machinery, plants, buildings, etc., gross",inp("os2.rent",{n:1}),{ref:"1c",
    hint:"this is what unlocks the depreciation deduction at 3b"});
  let d=row("i · Aggregate value of sum of money received without consideration",inp("os2.g.money",{n:1}),{ref:"1di"});
  d+=row("ii · Immovable property received without consideration — stamp duty value",inp("os2.g.immWithout",{n:1}),{ref:"1dii"});
  d+=row("iii · Immovable property for inadequate consideration — stamp duty value in excess of the consideration",inp("os2.g.immInadeq",{n:1}),{ref:"1diii"});
  d+=row("iv · Any other property received without consideration — fair market value",inp("os2.g.othWithout",{n:1}),{ref:"1div"});
  d+=row("v · Any other property for inadequate consideration — fair market value in excess of the consideration",inp("os2.g.othInadeq",{n:1}),{ref:"1dv"});
  d+=row("d · Income under section 56(2)(x) (di to dv)",cell(O.d.tot),{ref:"1d",cls:"tot"});
  h+=fold("os1d","1d","Income of the nature referred to in section 56(2)(x)",O.d.tot?RS(O.d.tot):"none",d);
  let e=row("Family pension",inp("os2.e.fap",{n:1}),{hint:"unlocks the deduction under 57(iia) at 3a(ii)"});
  e+=sub("Income from a retirement benefit account maintained in a notified country under section 89A");
  e+=row("2a · United States of America",inp("os2.e.n89a_US",{n:1}),{ind:1});
  e+=row("2b · United Kingdom of Great Britain and Northern Ireland",inp("os2.e.n89a_UK",{n:1}),{ind:1});
  e+=row("2c · Canada",inp("os2.e.n89a_CA",{n:1}),{ind:1});
  e+=row("Income from a retirement benefit account in a country other than a notified country under 89A",inp("os2.e.oth89a",{n:1}));
  e+=row("Income taxable this year on which relief under 89A was claimed in an earlier year",inp("os2.e.prev89a",{n:1}));
  e+=row("Specified sum received by a unit holder from a business trust — section 56(2)(xii)",inp("os2.e.s562xii",{n:1}));
  e+=row("Sum received under a life insurance policy, including bonus — section 56(2)(xiii)",inp("os2.e.s562xiii",{n:1}));
  e+=sub("Any other — specify the nature");
  e+=grid("os2.eOther",[{k:"nature",h:"Nature",t:"txt",w:"auto",req:1},{k:"amt",h:"Amount",t:"num",w:"150px",req:1}],
    X.eOther||[],{min:"600px",empty:"Nothing else.",add:"Add a row"});
  e+=row("e · Any other income",cell(O.e.tot),{ref:"1e",cls:"tot"});
  h+=fold("os1e","1e","Any other income",O.e.tot?RS(O.e.tot):"none",e);
  h+=row("1 · Gross income chargeable to tax at normal applicable rates",cell(O.one),{ref:"1",cls:"grand"});
  /* ===== 2 ===== */
  h+='<div class="cgband">2 · Income chargeable at special rates (2a(i) + 2a(ii) + 2b + 2c + 2d + 2e + 2f)</div>';
  h+=row("a(i) · Winnings from lotteries, crossword puzzles, races, card games etc. — section 115BB",inp("os2.sp.lottery",{n:1}),{ref:"2ai",hint:"thirty per cent"});
  h+=row("a(ii) · Winnings from online games — section 115BBJ",inp("os2.sp.online",{n:1}),{ref:"2aii",hint:"thirty per cent"});
  let bb=row("i · Cash credits — section 68",inp("os2.sp.s68",{n:1}),{ref:"2bi"});
  bb+=row("ii · Unexplained investments — section 69",inp("os2.sp.s69",{n:1}),{ref:"2bii"});
  bb+=row("iii · Unexplained money etc. — section 69A",inp("os2.sp.s69A",{n:1}),{ref:"2biii"});
  bb+=row("iv · Undisclosed investments etc. — section 69B",inp("os2.sp.s69B",{n:1}),{ref:"2biv"});
  bb+=row("v · Unexplained expenditure etc. — section 69C",inp("os2.sp.s69C",{n:1}),{ref:"2bv"});
  bb+=row("vi · Amount borrowed or repaid on hundi — section 69D",inp("os2.sp.s69D",{n:1}),{ref:"2bvi"});
  bb+=row("b · Income chargeable under section 115BBE (bi to bvi)",cell(O.sp.bbeTot),{ref:"2b",cls:"tot",hint:"sixty per cent, plus a twenty-five per cent surcharge"});
  h+=fold("os2b","2b","Income chargeable under section 115BBE",O.sp.bbeTot?RS(O.sp.bbeTot):"none",bb);
  let pf=grid("os2.pf111",[{k:"ay",h:"Assessment year",t:"sel",w:"140px",req:1,
      opts:["2025-26","2024-25","2023-24","2022-23","2021-22","2020-21","2019-20","2018-19"].map(y=>[y,y])},
    {k:"incben",h:"Income benefit",t:"num",w:"150px",req:1},{k:"taxben",h:"Tax benefit",t:"num",w:"150px",req:1}],
    X.pf111||[],{min:"520px",empty:"None.",add:"Add a year",foot:[{l:1,v:"Total",span:1},{v:O.sp.pf111inc},{v:O.sp.pf111tax}]});
  h+=fold("os2c","2c","Accumulated balance of recognised provident fund taxable under section 111",O.sp.pf111inc?RS(O.sp.pf111inc):"none",pf);
  let sd=grid("os2.spl",[{k:"code",h:"Nature",t:"sel",w:"auto",req:1,opts:OS_SPL.map(x=>[x[0],x[0]+" — "+x[1]])},
    {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],X.spl||[],{min:"900px",empty:"None.",add:"Add a row",
    foot:[{l:1,v:"Total of di to dxx",span:1},{v:O.sp.spl}]});
  h+=fold("os2d","2d","Any other income chargeable at a special rate",O.sp.spl?RS(O.sp.spl):"none",sd);
  let pt=grid("os2.pti",[{k:"code",h:"Nature",t:"sel",w:"auto",req:1,opts:OS_SPL.map(x=>[x[0],x[0]+" — "+x[1]])},
    {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],X.pti||[],{min:"900px",empty:"None.",add:"Add a row",
    foot:[{l:1,v:"Total",span:1},{v:O.sp.pti}]});
  h+=fold("os2e","2e","Pass-through income in the nature of other sources, at special rates",O.sp.pti?RS(O.sp.pti):"none",pt);
  if(S.pi.res!=="RES"){
    let dt=note("Amount included in 1 and 2 above, claimed at special rates in India under a DTAA. Two classifications "+
      "per row — which item of this schedule, and which section of the Act.");
    dt+=grid("os2.dtaa",[{k:"amt",h:"Amount of income",t:"num",w:"120px",req:1},
      {k:"nature",h:"Item of this schedule",t:"sel",w:"110px",req:1,opts:OS_NATURE.map(x=>[x,x])},
      {k:"itemno",h:"Section of the Act",t:"sel",w:"260px",req:1,opts:OS_ITEMNO},
      {k:"country",h:"Country name",t:"txt",w:"140px",req:1},
      {k:"code",h:"Country code",t:"sel",w:"140px",req:1,opts:COUNTRIES.filter(c=>c[0]!=="91")},
      {k:"article",h:"Article of the DTAA",t:"txt",w:"100px",req:1},
      {k:"treaty",h:"Rate per treaty — NIL if not chargeable",t:"txt",w:"120px",req:1},
      {k:"trc",h:"TRC obtained?",t:"sel",w:"90px",opts:[["Y","Yes"],["N","No"]]},
      {k:"itrate",h:"Rate per the Act",t:"num",w:"100px",req:1},
      {k:"app",h:"Applicable rate",t:"calc",w:"100px",f:r=>{const t=/^nil$/i.test(st0(r.treaty))?0:N(r.treaty);return Math.min(t,N(r.itrate));}}],
      X.dtaa||[],{min:"1500px",empty:"No DTAA claim.",add:"Add a claim",foot:[{l:1,v:"Total",span:0},{v:O.sp.dtaa}]});
    h+=fold("os2f","2f","Amount claimed at special rates under a DTAA",O.sp.dtaa?RS(O.sp.dtaa):"none",dt);
  }
  h+=row("2 · Income chargeable at special rates",cell(O.two),{ref:"2",cls:"grand"});
  /* ===== 3 ===== */
  h+='<div class="cgband">3 · Deductions under section 57 — other than against 2a, 2b and 2d</div>';
  h+=row("a(i) · Expenses or deductions other than a(ii)",inp("os2.ded.exp",{n:1}),{ref:"3ai",hint:"in the case of income other than family pension"});
  h+=row("a(ii) · Deduction under section 57(iia) — family pension only",cell(O.ded.iia),{ref:"3aii",
    hint:O.fap?"a third of the pension, capped at "+RS(isNew()?25000:15000):"no family pension entered at 1e, so nothing here"});
  h+=row("b · Depreciation",O.c>0?inp("os2.ded.dep",{n:1}):cell(0),{ref:"3b",
    hint:O.c>0?"available because rent is offered at 1c":"available only if income is offered at 1c"});
  h+=row("c · Interest expenditure claimed under section 57(i)",(O.a.ord+O.a.e22)>0?inp("os2.ded.intClaimed",{n:1}):cell(0),{ref:"3c",
    hint:(O.a.ord+O.a.e22)>0?"against the dividend at 1a(i) and 1a(ii)":"available only if dividend is offered at 1a(i) or 1a(ii)"});
  h+=row("c(i) · Eligible amount of interest expenditure — computed",cell(O.ded.intElig),{ref:"3ci",ind:1,
    hint:"capped at twenty per cent of the dividend in 1a(i) and 1a(ii)"});
  h+=row("d · Total",cell(O.ded.tot),{ref:"3d",cls:"grand"});
  /* ===== 4, 5, 5a ===== */
  h+='<div class="cgband">4 · 5 · 5a — Adjustments</div>';
  h+=row("4 · Amounts not deductible under section 58",inp("os2.s58",{n:1}),{ref:"4"});
  h+=row("5 · Profits chargeable to tax under section 59",inp("os2.s59",{n:1}),{ref:"5"});
  h+=row("5a · Income claimed for relief from taxation under section 89A",inp("os2.rel89a",{n:1}),{ref:"5a"});
  /* ===== 6, 7 ===== */
  h+='<div class="cgband">6 · 7 — Net income</div>';
  h+=row("6 · Net income from other sources at normal rates — 1 (less the DTAA portion) − 3 + 4 + 5 − 5a",cell(O.six),{ref:"6",cls:"tot",
    hint:O.six<0?"a loss — it goes to 3(i) of Schedule CYLA":""});
  h+=row("7 · Income from other sources, other than race horses — 2 + 6, taking 6 as nil if negative",cell(O.seven),{ref:"7",cls:"grand"});
  /* ===== 8 ===== */
  h+='<div class="cgband">8 · Income from the activity of owning and maintaining race horses</div>';
  h+=card("horse","Owning and maintaining race horses",(O.horse.on?RS(O.horse.bal):""),
    row("a · Receipts",inp("os2.horse.rec",{n:1}),{ref:"8a",req:1})+
    row("b · Deductions under section 57 in relation to 8a only",inp("os2.horse.ded57",{n:1}),{ref:"8b"})+
    row("c · Amounts not deductible under section 58",inp("os2.horse.s58",{n:1}),{ref:"8c"})+
    row("d · Profits chargeable to tax under section 59",inp("os2.horse.s59",{n:1}),{ref:"8d"})+
    row("e · Balance (8a − 8b + 8c + 8d)",cell(O.horse.bal),{ref:"8e",cls:"tot",
      hint:O.horse.bal<0?"a loss — it goes to 6(xi) of Schedule CFL, set only against race-horse income":""}));
  /* ===== 9 ===== */
  h+='<div class="cgband">9 · Income under the head Income from other sources (7 + 8e)</div>';
  h+=row("9 · Income under the head — taking 8e as nil if negative",cell(O.nine),{ref:"9",cls:"grand"});
  /* ===== 10 ===== */
  h+='<div class="cgband">10 · Information about accrual or receipt of income from other sources</div>';
  const ed=!!X.editQ;
  h+=note("The quarter each amount arose in, for interest under section 234C. Filled into the fourth quarter by default; "+
    "switch on editing to spread them across the year yourself. For the 1a(i) dividend the portal (rule 214) wants the quarters to add up to <b>1a(i) − DTAA dividend − the 57(i) interest attributable to that dividend</b>; the exact attributable interest is the portal's own figure, so if it rejects the default, switch on editing and set the dividend quarters to the number it asks for — anything from the gross 1a(i) down to 1a(i) less the full 57(i) interest is accepted here.");
  h+='<div class="full"><table class="gt" style="min-width:1100px"><thead><tr><th class="l" style="min-width:360px">Other source income</th>';
  ["Up to 15/6 (i)","16/6 to 15/9 (ii)","16/9 to 15/12 (iii)","16/12 to 15/3 (iv)","16/3 to 31/3 (v)"].forEach(q=>h+='<th style="width:105px">'+q+'</th>');
  h+='<th style="width:110px">Total</th></tr></thead><tbody>';
  OS_Q.forEach(([k,l,key,req])=>{const tot=O.Q[k].reduce((s,v)=>s+v,0);const src=O.auto[k]||0;
    if(!src&&!ed&&!req)return;
    h+='<tr><td class="l">'+esc(l)+(req?' <span class="hint" style="color:var(--red)">required</span>':'')+'</td>';
    O.Q[k].forEach((v,i)=>h+='<td class="num">'+(ed?inp("os2.Q."+k+"."+i,{n:1}):cell(v))+'</td>');
    h+='<td class="num"'+(ed&&Math.abs(tot-src)>1&&src?' style="color:var(--red)"':'')+'>'+cell(tot)+'</td></tr>';});
  h+='</tbody></table></div>';
  h+=row("Do you want to edit the detail auto-populated above?",sel("os2.editQ",[["","No"],["1","Yes"]],{blank:false}));
  return h;
}
