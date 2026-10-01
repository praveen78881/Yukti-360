/* =====================================================================
   ITR-6 · Section "ded" — Deductions (Chapter VI-A) + section 10AA
   The COMPANY return. Every field/number/formula below is from the ITR-6
   books (books/ITR-6/{VIA,10AA,80G,80GGA,RA,80,80M,80GGB,80GGC,80IAC,
   80LA}.md) and the CBDT ITR-6 schema — NOT from the ITR-3 reference,
   which gave the structural shape only (constitution rule 2).

   Schema blocks owned here (books/ITR-6/section_map.json → "ded"):
     ScheduleVIA (VIA sheet + 80M sheet), Schedule80G, Schedule80GGA,
     Schedule80RA, Schedule80GGB, Schedule80GGC, Schedule80_IA,
     Schedule80_IB, Schedule80_IC (the 80-IE block), Schedule80IAC,
     Schedule80LA, Schedule10AA.

   Compute order 40 (after the income heads / losses, before the tax
   roll-up reads GTI and Total Income). Chapter VI-A carries two parallel
   columns — claimed (UsrDeductUndChapVIA) and allowed / "System
   Calculated" (DeductUndChapVIA), GTI-capped. 80M SURVIVES 115BAA/115BAB
   (the only Part-C survivor besides 80JJAA); 80GGB/80GGC/80G and the rest
   are switched off under the concessional regimes.
   ===================================================================== */

/* ---- state (this section's namespace) ---- */
S.ded = S.ded || {};
S.ded.v   = S.ded.v   || {};   /* manual claimed amounts: iab, iba, jja, jjaa, pa */
S.ded.g80 = S.ded.g80 || [];   /* Schedule 80G donee rows (bucket A/B/C/D) */
S.ded.gga = S.ded.gga || [];   /* Schedule 80GGA donee rows */
S.ded.ra  = S.ded.ra  || [];   /* Schedule RA (80RA) donee rows */
S.ded.ggb = S.ded.ggb || [];   /* Schedule 80GGB contribution rows */
S.ded.ggc = S.ded.ggc || [];   /* Schedule 80GGC contribution rows */
S.ded.m80 = S.ded.m80 || [];   /* Schedule 80M distribution rows */
S.ded.la  = S.ded.la  || [];   /* Schedule 80LA unit rows */
S.ded.iac = S.ded.iac || {};   /* Schedule 80IAC — one start-up */
S.ded.aa10= S.ded.aa10|| [];   /* Schedule 10AA — SEZ undertakings */
S.ded.ia  = S.ded.ia  || {};   /* Schedule 80-IA groups: i, iv, v = {loc, rows:[{amt}]} */
S.ded.ib  = S.ded.ib  || {};   /* Schedule 80-IB groups: oil, hous, fruit, food */
S.ded.ie  = S.ded.ie  || {};   /* Schedule 80-IE (→80_IC) NE state groups */

/* ---- code tables (books/ITR-6 enums, verbatim) ---- */
/* State — StateWithoutForeign (37 values); used by 80G and RA (RA.md §4, 80G.md §5) */
const DED_ST37=[["01","01-Andaman and Nicobar islands"],["02","02-Andhra Pradesh"],["03","03-Arunachal Pradesh"],
 ["04","04-Assam"],["05","05-Bihar"],["06","06-Chandigarh"],["07","07-The Dadra And Nagar Haveli And Daman And Diu"],
 ["09","09-Delhi"],["10","10-Goa"],["11","11-Gujarat"],["12","12-Haryana"],["13","13-Himachal Pradesh"],
 ["14","14-Jammu and Kashmir"],["15","15-Karnataka"],["16","16-Kerala"],["17","17-Lakshadweep"],["18","18-Madhya Pradesh"],
 ["19","19-Maharashtra"],["20","20-Manipur"],["21","21-Meghalaya"],["22","22-Mizoram"],["23","23-Nagaland"],
 ["24","24-Odisha"],["25","25-Puducherry"],["26","26-Punjab"],["27","27-Rajasthan"],["28","28-Sikkim"],
 ["29","29-Tamil Nadu"],["30","30-Tripura"],["31","31-Uttar Pradesh"],["32","32-West Bengal"],["33","33-Chattisgarh"],
 ["34","34-Uttarakhand"],["35","35-Jharkhand"],["36","36-Telangana"],["37","37-Ladakh"]];
/* State — Sch80GGA.States (38 values); used ONLY by 80GGA (80GGA.md §5) — separate list */
const DED_ST38=[["01","01-Andaman and Nicobar islands"],["02","02-Andhra Pradesh"],["03","03-Arunachal Pradesh"],
 ["04","04-Assam"],["05","05-Bihar"],["06","06-Chandigarh"],["33","33-Chhattisgarh"],["07","07-Dadra Nagar and Haveli"],
 ["08","08-Daman and Diu"],["09","09-Delhi"],["10","10-Goa"],["11","11-Gujarat"],["12","12-Haryana"],
 ["13","13-Himachal Pradesh"],["14","14-Jammu and Kashmir"],["35","35-Jharkhand"],["15","15-Karnataka"],["16","16-Kerala"],
 ["17","17-Lakshadweep"],["18","18-Madhya Pradesh"],["19","19-Maharashtra"],["20","20-Manipur"],["21","21-Meghalaya"],
 ["22","22-Mizoram"],["23","23-Nagaland"],["24","24-Odisha"],["25","25-Puducherry"],["26","26-Punjab"],["27","27-Rajasthan"],
 ["28","28-Sikkim"],["29","29-Tamil Nadu"],["36","36-Telangana"],["30","30-Tripura"],["31","31-Uttar Pradesh"],
 ["34","34-Uttarakhand"],["32","32-West Bengal"],["37","37-Ladakh"]];
/* 80G bucket */
const DED_G80BKT=[["A","A · 100% deduction, without a qualifying limit"],["B","B · 50% deduction, without a qualifying limit"],
 ["C","C · 100% deduction, subject to the qualifying limit"],["D","D · 50% deduction, subject to the qualifying limit"]];
/* 80GGA relevant clause (Sch80GGA.RelevantClause, 8 codes — 80GGA.md §4) */
const DED_GGACLAUSE=[["80GGA2a","80GGA(2)(a) — Scientific Research (Research Association / University / college / institution)"],
 ["80GGA2aa","80GGA(2)(aa) — Social science or Statistical Research"],
 ["80GGA2b","80GGA(2)(b) — Rural Development (association or institution)"],
 ["80GGA2bb","80GGA(2)(bb) — Eligible project (PSU / Local Authority / approved institution)"],
 ["80GGA2c","80GGA(2)(c) — Conservation of Natural Resources or afforestation"],
 ["80GGA2cc","80GGA(2)(cc) — Afforestation fund notified by Central Govt."],
 ["80GGA2d","80GGA(2)(d) — Rural Development fund notified by Central Govt."],
 ["80GGA2e","80GGA(2)(e) — National Urban Poverty Eradication Fund"]];
/* 80M — schedule under which the received dividend income is offered */
const DED_M80TYPE=[["ScheduleOS","ScheduleOS — offered under Other Sources"],["ScheduleBP","ScheduleBP — offered under Business/Profession"]];
/* 80LA enums (80LA.md §3 / enums.json) */
const DED_LA_SUB=[["80LA(1)","1. 80LA(1)"],["80LA(1A)","2. 80LA(1A)"]];
const DED_LA_ENTITY=[["SchdBankSEZ","Scheduled bank having Overseas Banking Unit in SEZ"],
 ["FrgnBankSEZ","Any foreign bank having Overseas Banking Unit in SEZ"],["UntIFSC","A Unit of IFSC"]];
const DED_LA_INCOME=[["OffshoreBnkng","From an Offshore Banking Unit in a SEZ"],
 ["Sec10Of1949","From the business under s.6(1) of the Banking Regulation Act, 1949"],
 ["IFSCSplEcoZone","From any Unit of the IFSC approved for setting up in that centre"],
 ["TnfrAsst1949","Transfer of an asset (aircraft or ship) leased by a unit"]];
const DED_LA_AUTH=[["SEBI","1. SEBI"],["IFSCA","2. IFSCA"],["RBI","3. RBI"]];
/* 80IAC — first AY the deduction was claimed (10 values) */
const DED_IAC_AY=["2017-18","2018-19","2019-20","2020-21","2021-22","2022-23","2023-24","2024-25","2025-26","2026-27"]
 .map(y=>[y,y]);
/* 10AA — AY the SEZ unit began (16 values, ends 2022-23) */
const DED_10AA_AY=["2007-08","2008-09","2009-10","2010-11","2011-12","2012-13","2013-14","2014-15","2015-16",
 "2016-17","2017-18","2018-19","2019-20","2020-21","2021-22","2022-23"].map(y=>[y,y]);

/* The Chapter VI-A lettered list for a company — [key, sheet-letter, label].
   Part B (a-d) all fed from a detail schedule; Part C (e-p) mixes fed and
   manual. (VIA.md §3-4.) */
const DED_PARTB=[
 ["g80","a","80G — Donations to funds and institutions (from Schedule 80G)"],
 ["ggb","b","80GGB — Contribution by a company to political parties (from Schedule 80GGB)"],
 ["gga","c","80GGA — Donations for scientific research or rural development (from Schedule 80GGA)"],
 ["ggc","d","80GGC — Contribution to a political party (from Schedule 80GGC)"]];
const DED_PARTC=[
 ["ia","e","80-IA — Infrastructure undertakings (from Schedule 80-IA)"],
 ["iab","f","80-IAB — Development of a Special Economic Zone"],
 ["iac","g","80-IAC — Eligible start-up (from Schedule 80IAC)"],
 ["ib","h","80-IB — Certain industrial undertakings (from Schedule 80-IB)"],
 ["iba","i","80-IBA — Profits from housing projects"],
 ["ie","j","80-IE — Undertakings in North-Eastern / special-category States (from Schedule 80-IE)"],
 ["jja","k","80-JJA — Collecting and processing of bio-degradable waste"],
 ["jjaa","l","80-JJAA — Employment of new employees"],
 ["la1","m","80-LA(1) — Offshore Banking Unit (from Schedule 80LA)"],
 ["la1a","n","80-LA(1A) — Unit of an International Financial Services Centre (from Schedule 80LA)"],
 ["m80","o","80-M — Certain inter-corporate dividends (from Schedule 80M)"],
 ["pa","p","80-PA — Certain income of Producer Companies"]];
/* keys that read from a detail schedule (green cell); the rest are typed */
const DED_FED={g80:1,ggb:1,gga:1,ggc:1,ia:1,iac:1,ib:1,ie:1,la1:1,la1a:1,m80:1};
/* schema key on each VI-A object (single key used in both Usr and Ded objects) */
const DED_MAP={g80:"Section80G",ggb:"Section80GGB",gga:"Section80GGA",ggc:"Section80GGC",
 ia:"Section80IA",iab:"Section80IAB",iac:"Section80IAC",ib:"Section80IB",iba:"Section80IBA",
 ie:"Section80IC",jja:"Section80JJA",jjaa:"Section80JJAA",la1:"Section80LA",la1a:"Section80LA_1A",
 pa:"Section80PA"};   /* m80 uses Section80M / _OS / _BP + Section80MDtls, handled apart */
const DED_PARTB_KEYS=DED_PARTB.map(x=>x[0]);
const DED_PARTC_KEYS=DED_PARTC.map(x=>x[0]).filter(k=>k!=="m80");   /* m80 added separately */
/* what survives the concessional regimes 115BAA / 115BAB (VIA.md §5; notes A849/A850):
   only 80JJAA on the generic list, plus 80M (computed apart). */
const DED_CONC_SURV={jjaa:1};

/* ===================================================================
   Cross-section readers (defensive — the feeding sections may be empty).
   SEAMS for the integrator: the ded engine reads the concessional-regime
   choice, the belated-return flag, the domestic/foreign flag, GTI, the
   business-income head and the dividend offered under OS / BP. It reads
   them from S / S.C by best-effort key so it never throws on empty state.
   =================================================================== */
function dedGet(o,p){try{return p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);}catch(e){return undefined;}}
/* concessional regime → "115BAA" | "115BAB" | "115BA" | "" */
function dedConc(){
  /* D-F1 — read the regime engWho resolves and republishes as
     S.C.who.regime115 ("" | 115BA | 115BAA | 115BAB), falling back to the raw
     filing-status input S.fs.s115 ("NA" | 115BA | 115BAA | 115BAB). */
  const cand=[dedGet(S,"C.who.regime115"),dedGet(S,"fs.s115")];
  for(const raw of cand){ if(raw==null||raw==="")continue;
    const s=String(raw).replace(/[^0-9A-Za-z]/g,"").toUpperCase();
    if(s.indexOf("115BAB")>=0)return "115BAB";
    if(s.indexOf("115BAA")>=0)return "115BAA";
    if(s.indexOf("115BA")>=0)return "115BA"; }
  return "";
}
function dedIsConc(){const c=dedConc();return c==="115BAA"||c==="115BAB";}   /* only 115BAA/115BAB switch off the deductions */
/* belated return (139(4)) → IncomeTaxSec code "12" (enums.json) */
function dedBelated(){
  const cand=[dedGet(S,"fs.sec"),dedGet(S,"who.sec"),dedGet(S,"who.retSec"),dedGet(S,"fs.filedSec"),dedGet(S,"pi.retSec")];
  for(const c of cand){ if(c==null)continue; if(String(c)==="12")return true; if(/139\s*\(\s*4\s*\)/.test(String(c)))return true; }
  return false;
}
/* foreign company → DomesticCompFlg not "Y" (state seeds S.pi.domestic="Y") */
function dedForeign(){const d=dedGet(S,"pi.domestic");return d!=null&&String(d).toUpperCase().charAt(0)==="N";}
/* head income published by another section's engine */
function dedHead(h){return R(((S.C||{})[h]||{}).income||0);}
/* dividend income offered under a head (best-effort — os/bp scalar name is a seam) */
function dedDivOffered(head){const c=(S.C||{})[head]||{};
  const cand=[c.divInc,c.dividend,c.dividends,c.div,c.dividendInc,c.divOffered];
  for(const x of cand){ if(x!=null&&N(x))return N(x); }
  return 0;}
/* 80M distribution cutoff — one month before the 139(1) due date (A837) */
function dedM80Cutoff(){
  const due=(window.FORM&&FORM.due)||"2026-10-31";
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(due); if(!m)return "";
  let y=+m[1],mo=+m[2]-1,d=+m[3];      /* one calendar month earlier */
  const dt=new Date(Date.UTC(y,mo,d)); dt.setUTCMonth(dt.getUTCMonth()-1);
  return dt.toISOString().slice(0,10);
}

/* ===================================================================
   Detail-schedule engines
   =================================================================== */
/* 80G — four buckets, ₹2,000 cash cap, 10%-of-adjusted-TI qualifying
   limit on C and D (80G.md §3-4). */
function engDed80G(gtiLimit,partCProfitLinked){
  const rows=S.ded.g80||[];
  const base=r=>N(r.other)+(N(r.cash)>2000?0:N(r.cash));   /* a cash donation over ₹2,000 gives no deduction (A809) */
  let A=0,B=0,C=0,D=0,cash=0,other=0,gross=0;
  rows.forEach(r=>{const b=base(r);gross+=N(N(r.amt)||N(r.cash)+N(r.other));cash+=N(r.cash);other+=N(r.other);
    const bk=r.bucket||"A"; if(bk==="A")A+=b; else if(bk==="B")B+=b; else if(bk==="C")C+=b; else D+=b;});
  const ql=Math.max(0,R(0.1*Math.max(0,gtiLimit-Math.max(0,partCProfitLinked||0))));   /* 80G.md §4 V3 */
  const cE=Math.min(C,ql), residual=Math.max(0,ql-cE), dE=Math.min(R(0.5*D),residual);
  const eligible=R(A + 0.5*B + cE + dE);
  return {eligible:R(eligible),cash:R(cash),other:R(other),gross:R(gross),A:R(A),B:R(B),C:R(C),D:R(D),ql:R(ql)};
}

/* ===================================================================
   engDed — build S.C.ded from S.ded
   =================================================================== */
function engDed(){
  const conc=dedIsConc(), foreign=dedForeign(), belated=dedBelated();
  const bpInc=dedHead("bp");
  /* GTI ceiling: prefer the authoritative GTI (set by the tax roll-up, order 90 —
     available in pass 2); else estimate from the income heads. */
  const gtiC=R((S.C||{}).gti||0);
  const gtiEst=R(dedHead("bp")+dedHead("hp")+dedHead("cg")+dedHead("os"));
  const gtiLimit=Math.max(0,gtiC>0?gtiC:gtiEst);

  /* -- detail-schedule totals -- */
  const grpTot=g=>((g&&g.rows)||[]).reduce((s,r)=>s+N(r.amt),0);
  const ia=S.ded.ia||{}, ib=S.ded.ib||{}, ie=S.ded.ie||{};
  const ia80=grpTot(ia.i)+grpTot(ia.iv)+grpTot(ia.v);
  const ib80=grpTot(ib.oil)+grpTot(ib.hous)+grpTot(ib.fruit)+grpTot(ib.food);
  const NEKEYS=["assam","arun","manip","mizo","megh","naga","trip","sikk"];
  const ie80=NEKEYS.reduce((s,k)=>s+grpTot(ie[k]),0);
  const partCProfitLinked=R(ia80+ib80+ie80+N((S.ded.iac||{}).amt));   /* base of the 80G qualifying limit */

  const g80=engDed80G(gtiLimit,partCProfitLinked); S.C.g80=g80;

  /* 80GGA — cash over ₹2,000 not eligible; zeroed where business income exists (A836) */
  const ggaRows=S.ded.gga||[];
  const ggaEligRaw=ggaRows.reduce((s,r)=>s+((N(r.cash)>2000?0:N(r.cash))+N(r.other)),0);
  const ggaElig=bpInc!==0?0:R(Math.min(ggaEligRaw,gtiLimit));

  /* RA — supporting register; eligible = cash + other, no cap (RA.md §3) */
  const raRows=S.ded.ra||[];
  const raCash=raRows.reduce((s,r)=>s+N(r.cash),0), raOther=raRows.reduce((s,r)=>s+N(r.other),0);

  /* 80GGB / 80GGC — only the "other mode" contributions are eligible; cash never
     is; totals forced to 0 under 115BAA/115BAB (80GGB.md/80GGC.md §4). */
  const ggbRows=S.ded.ggb||[], ggcRows=S.ded.ggc||[];
  const ggbElig=conc?0:R(Math.min(ggbRows.reduce((s,r)=>s+N(r.other),0),gtiLimit));
  const ggcElig=conc?0:R(Math.min(ggcRows.reduce((s,r)=>s+N(r.other),0),gtiLimit));

  /* 80LA — per-sub-section subtotals (80LA.md §2) */
  const laRows=S.ded.la||[];
  const la1sub=R(laRows.reduce((s,r)=>s+(r.sub==="80LA(1)"?N(r.amt):0),0));
  const la1asub=R(laRows.reduce((s,r)=>s+(r.sub==="80LA(1A)"?N(r.amt):0),0));

  /* 80M — SUMIF distributions by the schedule the received dividend is offered
     under, each capped at the dividend offered under that head; date on or
     before one month prior to the 139(1) due date (A837); foreign company → 0
     (A842); belated 139(4) → 0. 80M SURVIVES 115BAA/115BAB (A849/A850). */
  const cutoff=dedM80Cutoff();
  const osDiv=dedDivOffered("os"), bpDiv=dedDivOffered("bp");
  let distOS=0, distBP=0, m80Late=false, m80NoType=false;
  (S.ded.m80||[]).forEach(r=>{const amt=N(r.amt); if(amt<=0)return;
    const iso=ISO(r.dt);
    if(!r.type)m80NoType=true;
    if(iso&&cutoff&&iso>cutoff){m80Late=true;return;}   /* past the distribution deadline — does not qualify */
    if(r.type==="ScheduleBP")distBP+=amt; else if(r.type==="ScheduleOS")distOS+=amt;});
  let m80OS=0,m80BP=0;
  if(!foreign&&!belated){
    m80OS=osDiv>0?Math.min(distOS,osDiv):distOS;      /* cap at dividend offered under OS where known */
    m80BP=bpDiv>0?Math.min(distBP,bpDiv):distBP;      /* cap at dividend offered under BP where known */
  }
  m80OS=R(m80OS); m80BP=R(m80BP); const m80=R(m80OS+m80BP);

  /* -- claimed amount per VI-A row -- */
  const fed={g80:g80.eligible,ggb:ggbElig,gga:ggaElig,ggc:ggcElig,
    ia:R(ia80),ib:R(ib80),ie:R(ie80),iac:N((S.ded.iac||{}).amt),la1:la1sub,la1a:la1asub,m80:m80};
  const claim=k=>fed[k]!==undefined?N(fed[k]):N((S.ded.v||{})[k]);

  /* -- allowed amount per VI-A row (regime + gates) -- */
  const out={},why={};
  DED_PARTB_KEYS.concat(DED_PARTC_KEYS).forEach(k=>{
    let c=claim(k);
    if(k==="gga"&&bpInc!==0&&c){why.gga="not available where there is business income (rule A836)";c=0;}
    if(conc&&!DED_CONC_SURV[k]&&c){why[k]="closed under section 115BAA / 115BAB";c=0;}
    out[k]=R(Math.max(0,c));
  });
  out.m80=m80;   /* 80M survives the concessional regime */
  if(foreign&&m80===0&&(distOS+distBP)>0)why.m80="a foreign company cannot claim 80M (rule A842)";
  else if(belated&&m80===0&&(distOS+distBP)>0)why.m80="a belated return under 139(4) gets no 80M";

  /* -- part totals, GTI-capped (VIA.md §5; A835 Part B = a+b+c+d, A850 Part C
        includes 80M; totals MIN'd against the GTI limit) -- */
  const rawB=DED_PARTB_KEYS.reduce((a,k)=>a+R(out[k]||0),0);
  const rawC=DED_PARTC_KEYS.reduce((a,k)=>a+R(out[k]||0),0)+m80;
  const partB=Math.max(0,Math.min(rawB,gtiLimit));
  const partC=Math.max(0,Math.min(rawC,gtiLimit));
  const total=rawB+rawC;                                    /* claimed grand total */
  const allowed=Math.max(0,Math.min(rawB+rawC,gtiLimit));   /* Total Chapter VI-A, capped */

  /* Section 10AA (SEZ) — NOT Chapter VI-A; subtracted separately at Part B-TI
     (10AA.md §1, rule A736). Closed under 115BAA/115BAB. */
  const aa10Raw=(S.ded.aa10||[]).reduce((s,r)=>s+N(r.amt),0);
  const ded10AA=conc?0:Math.max(0,Math.min(R(aa10Raw),gtiLimit));

  S.C.ded={income:0,                     /* a deduction contributes 0 to GTI */
    out,why,fed,
    partB:R(partB),partC:R(partC),allowed:R(allowed),total:R(total),clipped:total>gtiLimit,
    ded10AA:R(ded10AA),aa10Raw:R(aa10Raw),
    m80:m80,m80OS:m80OS,m80BP:m80BP,m80Late,m80NoType,distOS:R(distOS),distBP:R(distBP),
    ggaElig,ggbElig,ggcElig,raCash:R(raCash),raOther:R(raOther),
    ia80:R(ia80),ib80:R(ib80),ie80:R(ie80),la1sub,la1asub,
    conc,concKind:dedConc(),foreign,belated,gtiLimit,bpInc,osDiv:R(osDiv),bpDiv:R(bpDiv),cutoff};
}

/* ===================================================================
   secDed — the on-screen renderer
   =================================================================== */
function dedDoneeCols(stOpts,withArn){
  const c=[{k:"name",h:"Name of the donee",t:"txt",w:"auto",req:1,max:125},
   {k:"addr",h:"Address",t:"txt",w:"auto",req:1,max:200},{k:"city",h:"City / Town / District",t:"txt",w:"120px",req:1,max:50},
   {k:"state",h:"State",t:"sel",w:"170px",req:1,opts:stOpts},{k:"pin",h:"PIN",t:"txt",w:"90px",max:6,req:1},
   {k:"pan",h:"PAN of the donee",t:"txt",w:"120px",max:10,req:1}];
  if(withArn)c.push({k:"arn",h:"ARN (donation reference no.)",t:"txt",w:"150px",max:25});
  c.push({k:"cash",h:"In cash",t:"num",w:"100px"},{k:"other",h:"Other mode",t:"num",w:"100px"},
   {k:"tot",h:"Total",t:"calc",w:"110px",f:r=>N(r.cash)+N(r.other)});
  return c;
}
function secDed(){
  const V=S.C.ded||{out:{},fed:{},why:{},partB:0,partC:0,allowed:0}, G8=S.C.g80||{};
  const out=V.out||{}, fed=V.fed||{}, why=V.why||{};
  let h="";

  if(V.foreign)h+=note("A foreign company cannot claim section 80M — Yukti sets it to zero (rule A842).","warn");
  if(V.belated)h+=note("This is a belated return under section 139(4); section 80M is not available.","warn");
  if(V.conc)h+=note("<b>Under the concessional regime (section 115BAA / 115BAB) only 80JJAA and 80M survive.</b> "+
    "80G, 80GGA, 80GGB, 80GGC, the 80-IA/IB/IE family, 80-IAC, 80-LA, 80-PA and section 10AA are all switched off.","stop");

  /* ---- the two-column VI-A summary ---- */
  const hdr='<div class="r sub"><div class="l">Section</div><div class="ref"></div>'+
    '<div class="v2 hd2">You claim</div><div class="v hd2">System calculated</div></div>';
  const rowFor=(k,ref,label)=>{
    const isFed=!!DED_FED[k];
    const open=!V.conc||!!DED_CONC_SURV[k]||k==="m80";
    let claimCell;
    if(isFed) claimCell=cell(open?N(fed[k]||0):0);
    else claimCell=open?inp("ded.v."+k,{n:1}):cell(0);
    return '<div class="r'+(open?"":" closed")+'"><div class="l">'+esc(label)+
      (why[k]?'<span class="hint">'+esc(why[k])+'</span>':(!open?'<span class="hint">closed by 115BAA / 115BAB</span>':''))+'</div>'+
      '<div class="ref">'+esc(ref)+'</div>'+
      '<div class="v2">'+claimCell+'</div>'+
      '<div class="v">'+cell(out[k]||0)+'</div></div>';
  };
  h+='<div class="cgband">1 · Part B — deduction in respect of certain payments (a to d)</div>'+hdr;
  DED_PARTB.forEach(x=>h+=rowFor(x[0],x[1],x[2]));
  h+=row("Total deduction under Part B (a + b + c + d)",cell(V.partB),{ref:"1",cls:"tot"});
  h+='<div class="cgband">2 · Part C — deduction in respect of certain incomes (e to p)</div>'+hdr;
  DED_PARTC.forEach(x=>h+=rowFor(x[0],x[1],x[2]));
  h+=row("Total deduction under Part C (e to p)",cell(V.partC),{ref:"2",cls:"tot"});
  if(V.clipped)h+=note("The Chapter VI-A total is limited to the gross total income.","warn");
  h+=row("Total deductions under Chapter VI-A (1 + 2)",cell(V.allowed),{cls:"grand"});

  /* ---- the schedules behind the figures ---- */
  h+='<div class="cgband">The schedules behind the figures</div>';

  /* 80G */
  const g80sum=(S.ded.g80||[]).reduce((s,r)=>s+(N(r.amt)||N(r.cash)+N(r.other)),0);
  h+=card("d80g","Schedule 80G — donations to funds and institutions",out.g80?RS(out.g80):"",
    note("Sort each donee into its bucket. A cash donation over ₹2,000 gives no deduction; buckets C and D are limited to 10% of the adjusted total income (C draws first).")+
    grid("ded.g80",dedDoneeCols(DED_ST37,true).concat([
      {k:"ref",h:"Transaction reference",t:"txt",w:"150px",max:50},{k:"ifsc",h:"IFSC",t:"txt",w:"110px",max:11}])
      .reduce((a,c,i)=>{if(i===0)a.push({k:"bucket",h:"Bucket",t:"sel",w:"150px",req:1,opts:DED_G80BKT});a.push(c);return a;},[])
      .concat([{k:"elig",h:"Eligible",t:"calc",w:"110px",f:r=>{const b=N(r.other)+(N(r.cash)>2000?0:N(r.cash));
        return r.bucket==="B"?R(0.5*b):(r.bucket==="D"?R(0.5*b):b);}}]),
      S.ded.g80||[],{min:"2100px",empty:"No donation listed.",add:"Add a donee"})+
    row("Total eligible donation (E)",cell(out.g80||0),{cls:"grand",hint:"feeds VI-A item 1a"})+
    note("For a donation in other mode the transaction reference and IFSC are mandatory (rule A816). The same PAN cannot appear in two buckets (A813).","warn"));

  /* 80GGA + RA */
  h+=card("d80gga","Schedule 80GGA — scientific research or rural development",out.gga?RS(out.gga):(V.bpInc!==0?"Nil (business income)":""),
    (V.bpInc!==0?note("This company has business income, so 80GGA is not available (rule A836) — the eligible amount is zero.","warn"):"")+
    grid("ded.gga",[{k:"clause",h:"Relevant clause",t:"sel",w:"200px",req:1,opts:DED_GGACLAUSE},
      {k:"name",h:"Name of the donee",t:"txt",w:"auto",req:1,max:125},{k:"addr",h:"Address",t:"txt",w:"auto",req:1,max:200},
      {k:"city",h:"City / Town / District",t:"txt",w:"120px",req:1,max:50},{k:"state",h:"State",t:"sel",w:"170px",req:1,opts:DED_ST38},
      {k:"pin",h:"PIN",t:"txt",w:"90px",max:6,req:1},{k:"pan",h:"PAN of the donee",t:"txt",w:"120px",max:10,req:1},
      {k:"cashdt",h:"Date of cash donation",t:"date",w:"130px"},
      {k:"cash",h:"In cash",t:"num",w:"100px"},{k:"other",h:"Other mode",t:"num",w:"100px"},
      {k:"tot",h:"Total",t:"calc",w:"110px",f:r=>N(r.cash)+N(r.other)},
      {k:"elig",h:"Eligible",t:"calc",w:"110px",f:r=>(N(r.cash)>2000?0:N(r.cash))+N(r.other)}],
      S.ded.gga||[],{min:"1800px",empty:"No donation listed.",add:"Add a donee"})+
    note("The state list here (38 values, with Chhattisgarh spelt with 'hh') differs from the 80G / RA list — build each from its own range. \"Date of cash donation\" is on screen only; it is not filed. A cash donation over ₹2,000 gives no deduction (A820).","warn")+
    sub("Schedule RA — donations to research associations etc. under 35(1)(ii)/(iia)/(iii)/35(2AA)")+
    grid("ded.ra",[{k:"name",h:"Name of the donee",t:"txt",w:"auto",req:1,max:125},{k:"addr",h:"Address",t:"txt",w:"auto",req:1,max:200},
      {k:"city",h:"City / Town / District",t:"txt",w:"140px",req:1,max:50},{k:"state",h:"State",t:"sel",w:"170px",req:1,opts:DED_ST37},
      {k:"pin",h:"PIN",t:"txt",w:"90px",max:6,req:1},{k:"pan",h:"PAN of the donee",t:"txt",w:"120px",max:10,req:1},
      {k:"cash",h:"In cash",t:"num",w:"120px"},{k:"other",h:"Other mode",t:"num",w:"130px"},
      {k:"tot",h:"Total",t:"calc",w:"120px",f:r=>N(r.cash)+N(r.other)}],
      S.ded.ra||[],{min:"1400px",empty:"None listed.",add:"Add a donee"}));

  /* 80GGB */
  const ggbTbl=key=>grid(key,[{k:"dt",h:"Date",t:"date",w:"130px",req:1},
    {k:"cash",h:"In cash",t:"num",w:"110px"},{k:"other",h:"Other mode",t:"num",w:"120px"},
    {k:"tot",h:"Total",t:"calc",w:"110px",f:r=>N(r.cash)+N(r.other)},
    {k:"elig",h:"Eligible",t:"calc",w:"110px",f:r=>N(r.cash)>0?N(r.other):N(r.other)},
    {k:"name",h:"Name of the political party",t:"txt",w:"auto",req:1,max:125},{k:"pan",h:"PAN",t:"txt",w:"120px",max:10,req:1},
    {k:"ref",h:"Transaction reference",t:"txt",w:"160px",max:50},{k:"ifsc",h:"IFSC",t:"txt",w:"110px",max:11}],
    get(key)||[],{min:"1500px",empty:"No contribution listed.",add:"Add a contribution"});
  h+=card("d80ggb","Schedule 80GGB — contributions by the company to political parties",out.ggb?RS(out.ggb):"",
    (V.conc?note("Closed under section 115BAA / 115BAB — the total is forced to zero (rule A576).","stop"):"")+
    ggbTbl("ded.ggb")+
    note("A contribution in cash earns no deduction — only \"other mode\" is eligible. Name and PAN of the party are mandatory; for other-mode contributions the transaction reference and IFSC are mandatory; the date must fall in FY 2025-26 (rules A578/A586/A587/A585).","warn"));

  /* 80GGC */
  h+=card("d80ggc","Schedule 80GGC — contributions to political parties",out.ggc?RS(out.ggc):"",
    (V.conc?note("Closed under section 115BAA / 115BAB — the total is forced to zero (rule A588).","stop"):"")+
    ggbTbl("ded.ggc")+
    note("Cash earns no deduction — only \"other mode\" is eligible. Name and PAN mandatory; other-mode ⇒ transaction reference + IFSC mandatory; date within FY 2025-26 (A589/A597/A598/A596).","warn"));

  /* Schedule 80 — 80-IA / 80-IB / 80-IE undertakings */
  const grp=(gk,label)=>{const g=(get(gk)||{});const t=((g.rows)||[]).reduce((s,r)=>s+N(r.amt),0);
    return fold("f_"+gk.replace(/\W+/g,"_"),"",label,t?RS(t):"optional",
      row("Location / description code",inp(gk+".loc",{max:30}),{ind:1,hint:"Sch80LocOrDescCode — the undertaking's code"})+
      grid(gk+".rows",[{k:"amt",h:"Deduction for the undertaking",t:"num",w:"240px",req:1}],(g.rows)||[],
        {min:"420px",empty:"No undertaking listed.",add:"Add an undertaking"}));};
  h+=card("d80","Schedule 80-IA / 80-IB / 80-IE — profit-linked undertakings",
    (V.ia80+V.ib80+V.ie80)?RS(V.ia80+V.ib80+V.ie80):"",
    sub("Schedule 80-IA — infrastructure development (only the live sub-clauses)")+
    grp("ded.ia.i","(4)(i) — Infrastructure facility")+grp("ded.ia.iv","(4)(iv) — Power")+grp("ded.ia.v","(4)(v) — Revival of a power generating plant")+
    row("Total deduction under 80-IA",cell(V.ia80),{cls:"tot",ref:"e"})+
    sub("Schedule 80-IB — certain industrial undertakings (only the live sub-clauses)")+
    grp("ded.ib.oil","(9) — Mineral oil, commercial production / refining")+grp("ded.ib.hous","(10) — Housing project")+
    grp("ded.ib.fruit","(11A) — Processing / preservation of fruit, vegetables, meat, dairy etc.")+grp("ded.ib.food","(11A) — Integrated handling, storage and transport of food grains")+
    row("Total deduction under 80-IB",cell(V.ib80),{cls:"tot",ref:"h"})+
    sub("Schedule 80-IE — undertakings in the North-Eastern States")+
    grp("ded.ie.assam","Assam")+grp("ded.ie.arun","Arunachal Pradesh")+grp("ded.ie.manip","Manipur")+grp("ded.ie.mizo","Mizoram")+
    grp("ded.ie.megh","Meghalaya")+grp("ded.ie.naga","Nagaland")+grp("ded.ie.trip","Tripura")+grp("ded.ie.sikk","Sikkim")+
    row("Total deduction under 80-IE (North-East)",cell(V.ie80),{cls:"tot",ref:"j"})+
    note("These sheets have no dropdowns — the location/description code is derived from the sub-clause the undertaking sits under. Only the live sub-clauses are built; the hidden lapsed reliefs (telecom, industrial park, the old 80-IC Sikkim/HP/Uttaranchal rows, etc.) are not.","warn"));

  /* 80M */
  h+=card("d80m","Schedule 80M — inter-corporate dividends distributed",V.m80?RS(V.m80):"",
    grid("ded.m80",[{k:"dt",h:"Date of distribution of dividend",t:"date",w:"160px",req:1},
      {k:"amt",h:"Amount of dividend distributed",t:"num",w:"200px",req:1},
      {k:"type",h:"Schedule under which the received dividend income is offered",t:"sel",w:"260px",req:1,opts:DED_M80TYPE}],
      S.ded.m80||[],{min:"680px",empty:"No distribution listed.",add:"Add a distribution"})+
    row("80M attributable to income offered under Other Sources",cell(V.m80OS),{cls:"tot",hint:"capped at the dividend offered under OS"})+
    row("80M attributable to income offered under Business/Profession",cell(V.m80BP),{cls:"tot",hint:"capped at the dividend offered under BP"})+
    row("Total deduction under 80M",cell(V.m80),{cls:"grand",ref:"o"})+
    note("The distribution must be made on or before one month prior to the due date under section 139(1) ("+
      (V.cutoff?dmy(V.cutoff):"the cut-off date")+", rule A837). 80M survives 115BAA / 115BAB but is nil for a foreign company or a belated return.","warn"));

  /* 80IAC */
  const iac=S.ded.iac||{};
  h+=card("d80iac","Schedule 80IAC — deduction for an eligible start-up",N(iac.amt)?RS(N(iac.amt)):"",
    (V.conc?note("Closed under section 115BAA / 115BAB.","stop"):"")+
    row("Date of incorporation of the start-up",dte("ded.iac.doi"),{req:1,hint:"must be after 01-04-2016 (rule A600)"})+
    row("Nature of business",inp("ded.iac.nature",{max:120}),{req:1})+
    row("Certificate number (Inter-Ministerial Board of Certification)",inp("ded.iac.cert",{max:30}),{req:1})+
    row("First AY in which the deduction was claimed",sel("ded.iac.fay",DED_IAC_AY),{req:1})+
    row("Amount of deduction claimed for the current AY",inp("ded.iac.amt",{n:1}),{req:1})+
    formNote("This schedule is available only to a start-up recognised by DPIIT (Part A-General must say Yes, rule A601)."));

  /* 80LA */
  h+=card("d80la","Schedule 80LA — Offshore Banking Unit / IFSC unit",(V.la1sub+V.la1asub)?RS(V.la1sub+V.la1asub):"",
    grid("ded.la",[{k:"sub",h:"Sub-section claimed",t:"sel",w:"140px",req:1,opts:DED_LA_SUB},
      {k:"entity",h:"Type of entity",t:"sel",w:"220px",req:1,opts:DED_LA_ENTITY},
      {k:"income",h:"Type of income of the unit",t:"sel",w:"240px",req:1,opts:DED_LA_INCOME},
      {k:"auth",h:"Authority granting registration",t:"sel",w:"130px",req:1,opts:DED_LA_AUTH},
      {k:"dt",h:"Date of registration",t:"date",w:"130px",req:1},{k:"regno",h:"Registration number",t:"txt",w:"150px",max:30,req:1},
      {k:"ay",h:"First AY of deduction",t:"txt",w:"120px",max:7,req:1,ph:"e.g. 2025-26"},
      {k:"amt",h:"Amount for the current AY",t:"num",w:"150px",req:1}],
      S.ded.la||[],{min:"1500px",empty:"No unit listed.",add:"Add a unit"})+
    row("80-LA(1) — Offshore Banking Unit",cell(V.la1sub),{cls:"tot",ref:"m"})+
    row("80-LA(1A) — IFSC unit",cell(V.la1asub),{cls:"tot",ref:"n"})+
    note("Type of entity and type of income depend on the sub-section chosen (rules A606/A607). 80-LA(1) and 80-LA(1A) cannot both be claimed together (A838).","warn"));

  /* 10AA */
  const aasum=(S.ded.aa10||[]).reduce((s,r)=>s+N(r.amt),0);
  h+=card("d10aa","Schedule 10AA — units in a Special Economic Zone",(V.ded10AA||0)?RS(V.ded10AA):(aasum?RS(aasum):""),
    (V.conc?note("Closed under section 115BAA / 115BAB (rule A633).","stop"):"")+
    grid("ded.aa10",[{k:"ay",h:"AY the unit began to manufacture / produce / provide service",t:"sel",w:"auto",req:1,opts:DED_10AA_AY},
      {k:"amt",h:"Amount of deduction",t:"num",w:"220px",req:1}],S.ded.aa10||[],
      {min:"640px",empty:"No unit listed.",add:"Add a unit",foot:[{l:1,v:"Total deduction under section 10AA",span:1},{v:aasum}]})+
    note("Section 10AA is not a Chapter VI-A deduction — it is subtracted separately at Part B-TI (rule A736). The window ends at AY 2022-23.","warn"));

  /* how total income comes out */
  h+='<div class="cgband">How the total income comes out</div>';
  const gti=S.C.gti||V.gtiLimit||0;
  h+=row("Gross total income",cell(gti),{cls:"tot",hint:"set by Part B — total income and tax"});
  h+=row("Less: deductions under Chapter VI-A",cell(-(V.allowed||0)));
  if(V.ded10AA)h+=row("Less: deduction under section 10AA",cell(-(V.ded10AA||0)));
  h+=row("Total income (indicative)",cell(Math.max(0,gti-(V.allowed||0)-(V.ded10AA||0))),{cls:"grand",hint:"the tax section rounds and finalises this"});
  return h;
}

/* ===================================================================
   expDed — write the schema blocks onto j (EXACT ITR-6 keys)
   =================================================================== */
function dedAddr(r){return {AddrDetail:(sv(r.addr)||"NA").slice(0,200),
  CityOrTownOrDistrict:(sv(r.city)||"NA").slice(0,50),StateCode:st0(r.state)||"01",
  PinCode:/^\d{6}$/.test(st0(r.pin))?+r.pin:100000};}
function expDed(j){
  const V=S.C.ded||{out:{},fed:{}}; const out=V.out||{}, fed=V.fed||{};
  const conc=!!V.conc;
  const regOpen=k=>!conc||!!DED_CONC_SURV[k]||k==="m80";     /* claimed side blank for items closed by 115BAA/115BAB */
  const claim=k=>fed[k]!==undefined?N(fed[k]):N((S.ded.v||{})[k]);

  /* ---- ScheduleVIA (always present; the three totals required on each object) ---- */
  const usr={},ded={};
  Object.keys(DED_MAP).forEach(k=>{const f=DED_MAP[k];
    if(claim(k)&&regOpen(k))put(usr,f,n0(claim(k)));
    if(out[k])put(ded,f,n0(out[k]));});
  /* 80M — the OS/BP split, the total, and the distribution detail array */
  /* written through a computed key, exactly like DED_MAP above: the claimed (usr) and
     allowed (ded) sides are two different parent objects, not a duplicate writer. */
  [["Section80M_OS",V.m80OS],["Section80M_BP",V.m80BP],["Section80M",V.m80]].forEach(function(p_){
    const f=p_[0],v=n0(p_[1]); if(v){put(usr,f,v);put(ded,f,v);}
  });
  const m80rows=(S.ded.m80||[]).filter(r=>N(r.amt)).map(r=>{const o={Section80MAmnt:n0(r.amt)};
    if(ISO(r.dt))o.Section80MDate=ISO(r.dt);
    if(r.type==="ScheduleOS"||r.type==="ScheduleBP")o.Section80MType=r.type;return o;});
  if(m80rows.length)usr.Section80MDtls=m80rows;
  /* the three required totals on both objects */
  usr.TotPartBchapterVIA=n0(V.partB);usr.TotPartCchapterVIA=n0(V.partC);usr.TotalChapVIADeductions=n0(V.allowed);
  ded.TotPartBchapterVIA=n0(V.partB);ded.TotPartCchapterVIA=n0(V.partC);ded.TotalChapVIADeductions=n0(V.allowed);
  j.ScheduleVIA={UsrDeductUndChapVIA:usr,DeductUndChapVIA:ded};

  /* ---- Schedule80G (four buckets) ---- */
  {const rows=(S.ded.g80||[]).filter(r=>N(r.cash)||N(r.other)||N(r.amt));
   if(rows.length){
    const mk=r=>{const o={DoneeName:(sv(r.name)||"NA").slice(0,125),DoneePAN:(st0(r.pan)||"NA").toUpperCase(),
        AddressDetail:dedAddr(r),DonationAmtCash:n0(r.cash),DonationAmtOtherMode:n0(r.other),
        DonationAmt:n0(N(r.amt)||N(r.cash)+N(r.other))};
      const b=N(r.other)+(N(r.cash)>2000?0:N(r.cash));
      o.DonationElgAmt=n0((r.bucket==="B"||r.bucket==="D")?R(0.5*b):b);
      if(sv(r.arn))o.ArnNbr=sv(r.arn).slice(0,25);
      if(sv(r.ref))o.TransactionRefNum=sv(r.ref).slice(0,50);
      if(sv(r.ifsc))o.IFSCCode=st0(r.ifsc).toUpperCase().slice(0,11);return o;};
    const B={A:{o:"Don100Percent",c:"TotDon100PercentCash",m:"TotDon100PercentOtherMode",t:"TotDon100Percent",e:"TotElgDon100Percent"},
      B:{o:"Don50PercentNoApprReqd",c:"TotDon50PercentNoApprReqdCash",m:"TotDon50PercentNoApprReqdOtherMode",t:"TotDon50PercentNoApprReqd",e:"TotElgDon50PercentNoApprReqd"},
      C:{o:"Don100PercentApprReqd",c:"TotDon100PercentApprReqdCash",m:"TotDon100PercentApprReqdOtherMode",t:"TotDon100Percent",e:"TotElgDon100Percent"},
      D:{o:"Don50PercentApprReqd",c:"TotDon50PercentApprReqdCash",m:"TotDon50PercentApprReqdOtherMode",t:"TotDon50PercentApprReqd",e:"TotElgDon50PercentApprReqd"}};
    const G={};let gc=0,go=0,gt=0,ge=0;
    Object.keys(B).forEach(bk=>{const rs=rows.filter(r=>(r.bucket||"A")===bk);if(!rs.length)return;
      const cash=rs.reduce((a,r)=>a+N(r.cash),0),oth=rs.reduce((a,r)=>a+N(r.other),0),
        tot=rs.reduce((a,r)=>a+N(N(r.amt)||N(r.cash)+N(r.other)),0),
        elg=rs.reduce((a,r)=>{const b=N(r.other)+(N(r.cash)>2000?0:N(r.cash));return a+n0((bk==="B"||bk==="D")?R(0.5*b):b);},0);
      const M=B[bk];const obj={DoneeDetail:rs.map(mk)};
      obj[M.c]=n0(cash);obj[M.m]=n0(oth);obj[M.t]=n0(tot);obj[M.e]=n0(elg);
      G[M.o]=obj;gc+=cash;go+=oth;gt+=tot;ge+=elg;});
    G.TotalDonationsUs80GCash=n0(gc);G.TotalDonationsUs80GOtherMode=n0(go);
    G.TotalDonationsUs80G=n0(gt);G.TotalEligibleDonationsUs80G=n0(out.g80);
    j.Schedule80G=G;}}

  /* ---- Schedule80GGA ---- */
  {const rows=(S.ded.gga||[]).filter(r=>N(r.cash)||N(r.other));
   if(rows.length){const cash=rows.reduce((a,r)=>a+N(r.cash),0),oth=rows.reduce((a,r)=>a+N(r.other),0);
    j.Schedule80GGA={DonationDtlsSciRsrchRuralDev:rows.map(r=>({RelevantClauseUndrDedClaimed:st0(r.clause)||"80GGA2a",
      NameOfDonee:(sv(r.name)||"NA").slice(0,125),AddressDetail:dedAddr(r),DoneePAN:(st0(r.pan)||"NA").toUpperCase(),
      DonationAmtCash:n0(r.cash),DonationAmtOtherMode:n0(r.other),DonationAmt:n0(N(r.cash)+N(r.other)),
      EligibleDonationAmt:n0((N(r.cash)>2000?0:N(r.cash))+N(r.other))})),   /* "Date of cash donation" has no schema key — not exported */
      TotalDonationAmtCash80GGA:n0(cash),TotalDonationAmtOtherMode80GGA:n0(oth),
      TotalDonationsUs80GGA:n0(cash+oth),TotalEligibleDonationAmt80GGA:n0(V.ggaElig)};}}

  /* ---- Schedule80RA ---- */
  {const rows=(S.ded.ra||[]).filter(r=>N(r.cash)||N(r.other));
   if(rows.length){const cash=rows.reduce((a,r)=>a+N(r.cash),0),oth=rows.reduce((a,r)=>a+N(r.other),0);
    j.Schedule80RA={DonationDtlsRsrchAssctn:rows.map(r=>({NameOfDonee:(sv(r.name)||"NA").slice(0,125),
      AddressDetail:dedAddr(r),DoneePAN:(st0(r.pan)||"NA").toUpperCase(),
      DonationAmtCash:n0(r.cash),DonationAmtOtherMode:n0(r.other),DonationAmt:n0(N(r.cash)+N(r.other)),
      EligibleDonationAmt:n0(N(r.cash)+N(r.other))})),
      TotalDonationAmtCash80RA:n0(cash),TotalDonationAmtOtherMode80RA:n0(oth),
      TotalDonationsUs80RA:n0(cash+oth),TotalEligibleDonationAmt80RA:n0(cash+oth)};}}

  /* ---- Schedule80GGB / Schedule80GGC ---- */
  const mkPol=r=>{const o={DonationDate:ISO(r.dt)||"2025-04-01",DonationAmtCash:n0(r.cash),DonationAmtOtherMode:n0(r.other),
      DonationAmt:n0(N(r.cash)+N(r.other)),EligibleDonationAmt:n0(N(r.other))};   /* cash never eligible */
    if(sv(r.name))o.PoliticalPartyName=sv(r.name).slice(0,125);
    if(st0(r.pan))o.PoliticalPartyPAN=st0(r.pan).toUpperCase();
    if(sv(r.ref))o.TransactionRefNum=sv(r.ref).slice(0,50);
    if(sv(r.ifsc))o.IFSCCode=st0(r.ifsc).toUpperCase().slice(0,11);return o;};
  {const rows=(S.ded.ggb||[]).filter(r=>N(r.cash)||N(r.other));
   if(rows.length){const cash=rows.reduce((a,r)=>a+N(r.cash),0),oth=rows.reduce((a,r)=>a+N(r.other),0);
    j.Schedule80GGB={Schedule80GGBDetails:rows.map(mkPol),
      TotalDonationAmtCash80GGB:n0(cash),TotalDonationAmtOtherMode80GGB:n0(oth),
      TotalDonationsUs80GGB:n0(conc?0:cash+oth),TotalEligibleDonationAmt80GGB:n0(V.ggbElig)};}}
  {const rows=(S.ded.ggc||[]).filter(r=>N(r.cash)||N(r.other));
   if(rows.length){const cash=rows.reduce((a,r)=>a+N(r.cash),0),oth=rows.reduce((a,r)=>a+N(r.other),0);
    j.Schedule80GGC={Schedule80GGCDetails:rows.map(mkPol),
      TotalDonationAmtCash80GGC:n0(cash),TotalDonationAmtOtherMode80GGC:n0(oth),
      TotalDonationsUs80GGC:n0(conc?0:cash+oth),TotalEligibleDonationAmt80GGC:n0(V.ggcElig)};}}

  /* ---- Schedule80_IA / 80_IB / 80_IC (the 80-IE block) ---- */
  /* Sch80LocOrDescCode is a FIXED per-sub-clause constant (schema pattern), not free text —
     the exporter supplies it; each group is schema-required, so all groups are emitted (amount
     details only where claimed). */
  const grp80=(g,code)=>{const o={Sch80LocOrDescCode:code};
    const rows=((g&&g.rows)||[]).filter(r=>N(r.amt)).map(r=>({DeductAmountSec80:n0(r.amt)}));
    if(rows.length)o.Sch80DeductAmtDtls=rows;return o;};
  const ia=S.ded.ia||{},ib=S.ded.ib||{},ie=S.ded.ie||{};
  if(V.ia80>0)j.Schedule80_IA={Sch80SectionCode:"80-IA",DeductUs80_IA_4_i:grp80(ia.i,"INFRAFAC"),
    DeductUs80_IA_4_iv:grp80(ia.iv,"POWER"),DeductUs80_IA_4_v:grp80(ia.v,"REVIVAL_POWER_PLNT"),TotSchedule80_IA:n0(V.ia80)};
  if(V.ib80>0)j.Schedule80_IB={Sch80SectionCode:"80-IB",DeductMinOilUs80_IB_9_Und:grp80(ib.oil,"COMM_PROD"),
    DeductHousUs80_IB_10_Und:grp80(ib.hous,"HOUSING_PROJECT"),DeductFruitVegUs80_IB_11A_Und:grp80(ib.fruit,"FRIUTS_VEGTBLE"),
    DeductFoodGrainUs80_IB_11A_Und:grp80(ib.food,"STOR_TRANS"),TotSchedule80_IB:n0(V.ib80)};
  if(V.ie80>0){const NE={};
    [["assam","Assam_Und","INDSRTL_ASSAM"],["arun","ArunachalPradesh_Und","INDSRTL_ARUNPRADESH"],
     ["manip","Manipur_Und","INDSRTL_MANIPUR"],["mizo","Mizoram_Und","INDSRTL_MIZORAM"],
     ["megh","Meghalaya_Und","INDSRTL_MEGHALAYA"],["naga","Nagaland_Und","INDSRTL_NAGALND"],
     ["trip","Tripura_Und","INDSRTL_TRIPURA"],["sikk","Sikkim_Und","INDSRTL_SIKKIM"]].forEach(([k,K,code])=>{NE[K]=grp80(ie[k],code);});
    NE.TotDeductInNorthEast=n0(V.ie80);
    j.Schedule80_IC={Sch80SectionCode:"80-IC_IE",DeductInNorthEast:NE,TotSchedule80_IC:n0(V.ie80)};}

  /* ---- Schedule80IAC (one start-up) ---- */
  {const x=S.ded.iac||{};
   if(N(x.amt)){const o={DateIncrpStrup:ISO(x.doi)||"2016-04-02",NatureOfBusiness:(sv(x.nature)||"NA").slice(0,120),
      InterMnstBoardCertNum:(sv(x.cert)||"NA").slice(0,30),FstAYDeduction:st0(x.fay)||"2025-26",AmtDedCurAY:n0(x.amt)};
    j.Schedule80IAC=o;}}

  /* ---- Schedule80LA ---- */
  {const rows=(S.ded.la||[]).filter(r=>N(r.amt));
   if(rows.length){j.Schedule80LA={Schedule80LADtls:rows.map(r=>{const o={AmtDedCurAY:n0(r.amt)};
      if(r.sub==="80LA(1)"||r.sub==="80LA(1A)")o.SubSecDedClmd=r.sub;
      if(st0(r.entity))o.EntityType=st0(r.entity);
      if(st0(r.income))o.IncmTypeUnt=st0(r.income);
      if(st0(r.auth))o.RegGNTAuth=st0(r.auth);
      if(ISO(r.dt))o.RegDate=ISO(r.dt);
      if(sv(r.regno))o.RegNumber=sv(r.regno).slice(0,30);
      if(sv(r.ay))o.FstAYDeduction=sv(r.ay).slice(0,7);return o;}),
      Total:n0(rows.reduce((a,r)=>a+N(r.amt),0))};}}

  /* ---- Schedule10AA (SEZ) — closed under the concessional regime ---- */
  {const rows=(S.ded.aa10||[]).filter(r=>N(r.amt));
   if(rows.length&&!conc)j.Schedule10AA={DeductSEZ:{DedUs10Detail:{
      Undertaking:{DedFromUndertakingWithAy:rows.map(r=>({AssmtYrUnit:st0(r.ay)||"2022-23",DedUs10Sub:n0(r.amt)}))},
      TotalDedUs10Sub:n0(V.ded10AA)}}};}
}

/* ===================================================================
   impDed — read the schema blocks back into S.ded (inverse of expDed)
   =================================================================== */
function impDed(I){
  const got=[]; S.ded=S.ded||{}; if(!S.ded.v)S.ded.v={};
  const g_=(o,p)=>{try{return p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);}catch(e){return undefined;}};

  if(I.ScheduleVIA){const U=I.ScheduleVIA.UsrDeductUndChapVIA||{};
    const RMAP={Section80IAB:"iab",Section80IBA:"iba",Section80JJA:"jja",Section80JJAA:"jjaa",Section80PA:"pa"};
    Object.keys(RMAP).forEach(k=>{if(U[k]!=null)S.ded.v[RMAP[k]]=U[k];});
    S.ded.m80=(U.Section80MDtls||[]).map(r=>({dt:dmy(r.Section80MDate),amt:r.Section80MAmnt,type:r.Section80MType}));
    got.push("Chapter VI-A deductions");}

  if(I.Schedule80G){const G=I.Schedule80G;S.ded.g80=[];
    [["A","Don100Percent"],["B","Don50PercentNoApprReqd"],["C","Don100PercentApprReqd"],["D","Don50PercentApprReqd"]].forEach(([bk,ok])=>{
      (g_(G,ok+".DoneeDetail")||[]).forEach(r=>{const a=r.AddressDetail||{};
        S.ded.g80.push({bucket:bk,name:r.DoneeName,addr:a.AddrDetail,city:a.CityOrTownOrDistrict,state:a.StateCode,
          pin:nz(a.PinCode)+"",pan:r.DoneePAN,arn:r.ArnNbr||"",cash:nz(r.DonationAmtCash),other:nz(r.DonationAmtOtherMode),
          ref:r.TransactionRefNum||"",ifsc:r.IFSCCode||"",amt:r.DonationAmt});});});
    got.push("Schedule 80G");}

  if(I.Schedule80GGA)S.ded.gga=(I.Schedule80GGA.DonationDtlsSciRsrchRuralDev||[]).map(r=>{const a=r.AddressDetail||{};
    return {clause:r.RelevantClauseUndrDedClaimed,name:r.NameOfDonee,addr:a.AddrDetail,city:a.CityOrTownOrDistrict,
      state:a.StateCode,pin:nz(a.PinCode)+"",pan:r.DoneePAN,cashdt:"",cash:nz(r.DonationAmtCash),other:nz(r.DonationAmtOtherMode)};});
  if(I.Schedule80RA)S.ded.ra=(I.Schedule80RA.DonationDtlsRsrchAssctn||[]).map(r=>{const a=r.AddressDetail||{};
    return {name:r.NameOfDonee,addr:a.AddrDetail,city:a.CityOrTownOrDistrict,state:a.StateCode,pin:nz(a.PinCode)+"",
      pan:r.DoneePAN,cash:nz(r.DonationAmtCash),other:nz(r.DonationAmtOtherMode)};});

  const polIn=arr=>(arr||[]).map(r=>({dt:dmy(r.DonationDate),cash:nz(r.DonationAmtCash),other:nz(r.DonationAmtOtherMode),
    name:r.PoliticalPartyName||"",pan:r.PoliticalPartyPAN||"",ref:r.TransactionRefNum||"",ifsc:r.IFSCCode||""}));
  if(I.Schedule80GGB)S.ded.ggb=polIn(I.Schedule80GGB.Schedule80GGBDetails);
  if(I.Schedule80GGC)S.ded.ggc=polIn(I.Schedule80GGC.Schedule80GGCDetails);

  const grpIn=g=>({loc:(g&&g.Sch80LocOrDescCode)||"",rows:((g&&g.Sch80DeductAmtDtls)||[]).map(r=>({amt:r.DeductAmountSec80}))});
  if(I.Schedule80_IA)S.ded.ia={i:grpIn(I.Schedule80_IA.DeductUs80_IA_4_i),iv:grpIn(I.Schedule80_IA.DeductUs80_IA_4_iv),v:grpIn(I.Schedule80_IA.DeductUs80_IA_4_v)};
  if(I.Schedule80_IB)S.ded.ib={oil:grpIn(I.Schedule80_IB.DeductMinOilUs80_IB_9_Und),hous:grpIn(I.Schedule80_IB.DeductHousUs80_IB_10_Und),
    fruit:grpIn(I.Schedule80_IB.DeductFruitVegUs80_IB_11A_Und),food:grpIn(I.Schedule80_IB.DeductFoodGrainUs80_IB_11A_Und)};
  if(I.Schedule80_IC){const NE=I.Schedule80_IC.DeductInNorthEast||{};
    S.ded.ie={assam:grpIn(NE.Assam_Und),arun:grpIn(NE.ArunachalPradesh_Und),manip:grpIn(NE.Manipur_Und),mizo:grpIn(NE.Mizoram_Und),
      megh:grpIn(NE.Meghalaya_Und),naga:grpIn(NE.Nagaland_Und),trip:grpIn(NE.Tripura_Und),sikk:grpIn(NE.Sikkim_Und)};}

  if(I.Schedule80IAC){const x=I.Schedule80IAC;S.ded.iac={doi:dmy(x.DateIncrpStrup),nature:x.NatureOfBusiness||"",
    cert:x.InterMnstBoardCertNum||"",fay:x.FstAYDeduction||"",amt:x.AmtDedCurAY};}
  if(I.Schedule80LA)S.ded.la=(I.Schedule80LA.Schedule80LADtls||[]).map(r=>({sub:r.SubSecDedClmd,entity:r.EntityType,
    income:r.IncmTypeUnt,auth:r.RegGNTAuth,dt:dmy(r.RegDate),regno:r.RegNumber||"",ay:r.FstAYDeduction||"",amt:r.AmtDedCurAY}));
  if(I.Schedule10AA){S.ded.aa10=(g_(I,"Schedule10AA.DeductSEZ.DedUs10Detail.Undertaking.DedFromUndertakingWithAy")||[])
    .map(r=>({ay:r.AssmtYrUnit,amt:r.DedUs10Sub}));got.push("Schedule 10AA");}
  return got;
}

/* ===================================================================
   chkDed — this section's own screen validations (err / warn)
   The department rules (A578 etc.) are Phase 6; these are the checks the
   filer sees while entering data.
   =================================================================== */
function chkDed(){
  const out=[]; const V=S.C.ded||{out:{},why:{}}; const o=V.out||{};
  const add=(lvl,t,m)=>out.push({lvl,t,m,sec:"ded"});

  if(V.conc){
    add("warn","Concessional regime","Under section 115BAA / 115BAB only 80JJAA and 80M survive; 80G, 80GGA, 80GGB, 80GGC, the 80-IA/IB/IE family, 80-IAC, 80-LA, 80-PA and section 10AA are set to zero (rules A815 / A848 / A576 / A588 / A633).");
  }
  /* 80M */
  if(V.m80NoType)add("err","80M — schedule not chosen","Every 80M distribution row must say whether the received dividend is offered under Schedule OS or Schedule BP (rule A844).");
  if(V.m80Late)add("warn","80M — distribution too late","A distribution after "+(V.cutoff?dmy(V.cutoff):"one month before the due date")+" does not qualify for 80M (rule A837); it has been excluded.");
  if(V.foreign&&(V.distOS+V.distBP)>0)add("warn","80M — foreign company","A foreign company cannot claim 80M (rule A842); it has been set to zero.");
  if(V.belated&&(V.distOS+V.distBP)>0)add("warn","80M — belated return","A belated return under 139(4) gets no 80M; it has been set to zero.");
  /* 80GGA */
  if(V.bpInc!==0&&(S.ded.gga||[]).some(r=>N(r.cash)||N(r.other)))
    add("warn","80GGA and business income","80GGA is not available where there is business income (rule A836); the eligible amount is zero.");
  (S.ded.gga||[]).forEach((r,i)=>{if(N(r.cash)>2000)add("warn","80GGA — cash over ₹2,000","Row "+(i+1)+": a cash donation over ₹2,000 gives no deduction (rule A820).");});
  /* 80G / RA / 80GGB / 80GGC — other-mode ⇒ reference + IFSC */
  (S.ded.g80||[]).forEach((r,i)=>{if(N(r.other)&&(!sv(r.ref)||!st0(r.ifsc)))
    add("err","80G — reference required","Donee "+(i+1)+": an other-mode donation needs the transaction reference and IFSC (rule A816).");
    if(N(r.cash)>2000)add("warn","80G — cash over ₹2,000","Donee "+(i+1)+": a cash donation over ₹2,000 gives no deduction (rule A809).");});
  /* 80G — PAN uniqueness across buckets (A813) */
  {const seen={};(S.ded.g80||[]).forEach(r=>{const p=st0(r.pan).toUpperCase();if(!p)return;
    (seen[p]=seen[p]||{})[r.bucket||"A"]=1;});
   Object.keys(seen).forEach(p=>{if(Object.keys(seen[p]).length>1)add("warn","80G — repeated PAN","PAN "+p+" appears in more than one 80G bucket (rule A813).");});}
  const polChk=(rows,sec)=>{(rows||[]).forEach((r,i)=>{if(!(N(r.cash)||N(r.other)))return;
    if(!sv(r.name)||!st0(r.pan))add("err",sec+" — party details","Row "+(i+1)+": the political party's name and PAN are required.");
    if(N(r.other)&&(!sv(r.ref)||!st0(r.ifsc)))add("err",sec+" — reference required","Row "+(i+1)+": an other-mode contribution needs the transaction reference and IFSC.");
    const iso=ISO(r.dt);if(iso&&(iso<"2025-04-01"||iso>"2026-03-31"))add("warn",sec+" — date out of year","Row "+(i+1)+": the contribution must fall in FY 2025-26.");});};
  polChk(S.ded.ggb,"80GGB"); polChk(S.ded.ggc,"80GGC");
  /* 80IAC */
  {const x=S.ded.iac||{};if(N(x.amt)){const iso=ISO(x.doi);
    if(iso&&iso<="2016-04-01")add("warn","80IAC — incorporation date","The start-up must be incorporated after 01-04-2016 to claim 80-IAC (rule A600).");
    if(!sv(x.nature)||!sv(x.cert)||!st0(x.fay)||!iso)add("err","80IAC — details required","When 80-IAC is claimed, the incorporation date, nature of business, certificate number and first AY are all required (rule A599).");}}
  /* 80LA */
  {const rows=(S.ded.la||[]).filter(r=>N(r.amt));rows.forEach((r,i)=>{if(!r.sub)add("err","80LA — sub-section","Unit "+(i+1)+": choose the sub-section (80LA(1) or 80LA(1A)) claimed (rule A604).");});
   if(V.la1sub>0&&V.la1asub>0)add("warn","80LA — one sub-section only","80-LA(1) and 80-LA(1A) cannot both be claimed together (rule A838).");}
  /* GTI cap */
  if(V.clipped)add("warn","Deductions capped","The Chapter VI-A total is limited to the gross total income.");
  /* a settled figure */
  if((V.allowed||0)>0||(V.ded10AA||0)>0)add("ok","Deductions allowed","Chapter VI-A: "+RS(V.allowed||0)+
    (V.ded10AA?"; section 10AA: "+RS(V.ded10AA):"")+".");
  return out;
}

reg({id:"ded", t:"Deductions", ref:"VI-A · 80G/80GGA · 80-IA/IB/IE · 80M · 80IAC · 80LA · 10AA",
  f:secDed, eng:engDed, exp:expDed, imp:impDed, chk:chkDed, order:40, corder:42,
  s:()=>{const V=S.C.ded||{};return (V.allowed?"Allowed "+CR(V.allowed):(V.conc?"Almost none under 115BAA/115BAB":"Chapter VI-A"))+
    (V.ded10AA?" · 10AA "+CR(V.ded10AA):"");}});
