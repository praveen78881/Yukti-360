/* =====================================================================
   ITR-5 · Section "ded" — Chapter VI-A + profit-linked deduction schedules
   Books: books/ITR-5/VI_A.md · 80G.md · 80GGA.md · 80GGC.md · RA.md ·
          80.md · 80IAC.md · 80LA.md · 80P.md · 10AA.md
   Schema blocks (12): ScheduleVIA, Schedule80G, Schedule80GGA,
     Schedule80GGC, Schedule80RA, Schedule80_IA, Schedule80_IB,
     Schedule80_IC, Schedule80IAC, Schedule80LA, Schedule80P, Schedule10AA.
   Compute/screen order 50 (after loss=46, before tax rolls up GTI/TI).
   ITR-5 is an entity return: NO 80C/80D/80DD/80U/80E-family/80TTA/80M —
   Chapter VI-A is only the donation lines (Part B: 80G/80GGA/80GGC) and
   the business/income lines (Part C: 80IA/IAB/IAC/IB/IBA/IE/JJA/JJAA/
   LA(1)/LA(1A)/80P). Every figure/letter/cap below is from ITR-5's own
   books; the ITR-3 reference gave SHAPE only (constitution rule 2).
   ===================================================================== */

/* ---- state (this section's namespace) ---- */
S.ded = S.ded || {
  v:{},                 /* keyed VI-A Part-C amounts: c80iab, c80iba, c80jja, c80jjaa */
  g80:[],               /* Schedule 80G donee rows (bucket A/B/C/D) */
  gga:[],               /* Schedule 80GGA rows */
  ra:[],                /* Schedule RA (35(1) research associations) rows */
  ggc:[],               /* Schedule 80GGC rows */
  ia:{inf:["",""],pow:["",""]},                                   /* 80-IA: 2 clauses × 2 undertakings */
  ib:{jk:["",""],oil:["",""],hous:["",""],fruit:["",""],food:["",""]}, /* 80-IB: 5 clauses × 2 */
  ic:{assam:["",""],arun:["",""],mani:["",""],mizo:["",""],       /* 80-IE North-East: 8 states × 2 */
      megh:["",""],naga:["",""],trip:["",""],sikk:["",""]},
  iac:{},               /* Schedule 80IAC — single start-up object */
  la:[],                /* Schedule 80LA rows */
  p:{},                 /* Schedule 80P — per-row {inc,amt} keyed by row id */
  aa:[]                 /* Schedule 10AA — SEZ undertaking rows (up to 5) */
};
SEED.g80=SEED.g80||{bucket:"A"};
SEED.gga=SEED.gga||{clause:"80GGA2a"};
SEED.ra=SEED.ra||{};
SEED.ggc=SEED.ggc||{mode:"OTH"};
SEED.la=SEED.la||{sub:"80LA(1)"};
SEED.aa=SEED.aa||{};

/* ---- code tables (books / enums.json) ---- */
/* State code → label (StatesWithoutForeign, 37 states, no "99-Foreign"); schema stores the 2-digit code */
const DED_STATE={"01":"Andaman and Nicobar Islands","02":"Andhra Pradesh","03":"Arunachal Pradesh","04":"Assam",
 "05":"Bihar","06":"Chandigarh","07":"Dadra Nagar and Haveli","08":"Daman and Diu","09":"Delhi","10":"Goa",
 "11":"Gujarat","12":"Haryana","13":"Himachal Pradesh","14":"Jammu and Kashmir","15":"Karnataka","16":"Kerala",
 "17":"Lakshadweep","18":"Madhya Pradesh","19":"Maharashtra","20":"Manipur","21":"Meghalaya","22":"Mizoram",
 "23":"Nagaland","24":"Odisha","25":"Puducherry","26":"Punjab","27":"Rajasthan","28":"Sikkim","29":"Tamil Nadu",
 "30":"Tripura","31":"Uttar Pradesh","32":"West Bengal","33":"Chhattisgarh","34":"Uttarakhand","35":"Jharkhand",
 "36":"Telangana","37":"Ladakh"};
const DED_STOPTS=Object.keys(DED_STATE).map(k=>[k,k+"-"+DED_STATE[k]]);
/* 80GGA relevant clause (RelevantClauseUndrDedClaimed enum[8]) */
const DED_GGACLAUSE=[["80GGA2a","80GGA(2)(a) — scientific research (research assn/univ/college)"],
 ["80GGA2aa","80GGA(2)(aa) — social science / statistical research"],
 ["80GGA2b","80GGA(2)(b) — rural development (assn/institution)"],
 ["80GGA2bb","80GGA(2)(bb) — PSU/local authority/eligible project"],
 ["80GGA2c","80GGA(2)(c) — conservation of natural resources / afforestation"],
 ["80GGA2cc","80GGA(2)(cc) — afforestation funds notified by Central Govt."],
 ["80GGA2d","80GGA(2)(d) — rural development funds notified by Central Govt."],
 ["80GGA2e","80GGA(2)(e) — National Urban Poverty Eradication Fund"]];
/* 80G buckets → schema block + total-key family (80G.md / --leaves Schedule80G) */
const DED_G80BUCKET=[["A","100% deduction — no qualifying limit"],["B","50% deduction — no qualifying limit"],
 ["C","100% deduction — subject to qualifying limit"],["D","50% deduction — subject to qualifying limit"]];
const DED_G80BLK={A:{blk:"Don100Percent",c:"TotDon100PercentCash",o:"TotDon100PercentOtherMode",t:"TotDon100Percent",e:"TotElgDon100Percent"},
 B:{blk:"Don50PercentNoApprReqd",c:"TotDon50PercentNoApprReqdCash",o:"TotDon50PercentNoApprReqdOtherMode",t:"TotDon50PercentNoApprReqd",e:"TotElgDon50PercentNoApprReqd"},
 C:{blk:"Don100PercentApprReqd",c:"TotDon100PercentApprReqdCash",o:"TotDon100PercentApprReqdOtherMode",t:"TotDon100Percent",e:"TotElgDon100Percent"},
 D:{blk:"Don50PercentApprReqd",c:"TotDon50PercentApprReqdCash",o:"TotDon50PercentApprReqdOtherMode",t:"TotDon50PercentApprReqd",e:"TotElgDon50PercentApprReqd"}};
/* 80LA dropdowns (Schedule80LADtls enums) */
const DED_LASUB=[["80LA(1)","80LA(1) — Offshore Banking Unit"],["80LA(1A)","80LA(1A) — Unit of IFSC"]];
const DED_LAENT=[["SchdBankSEZ","Scheduled bank having Overseas Banking Unit in SEZ"],
 ["FrgnBankSEZ","Any foreign bank having Overseas Banking Unit in SEZ"],["UntIFSC","A Unit of IFSC"]];
const DED_LAINC=[["OffshoreBnkng","From an Offshore Banking Unit in a SEZ"],
 ["Sec10Of1949","From business u/s 6(1) of the Banking Regulation Act, 1949"],
 ["IFSCSplEcoZone","From a Unit of the IFSC approved for setting up in a SEZ"],
 ["TnfrAsst1949","From transfer of an aircraft/ship leased by an IFSC unit"]];
const DED_LAAUTH=[["SEBI","SEBI"],["IFSCA","IFSCA"],["RBI","RBI"]];
const DED_LASUBALLOW={"80LA(1)":{ent:["SchdBankSEZ","FrgnBankSEZ"],inc:["OffshoreBnkng","Sec10Of1949"]},
 "80LA(1A)":{ent:["UntIFSC"],inc:["IFSCSplEcoZone","TnfrAsst1949"]}};
/* 80IAC first-AY enum + 10AA AY enum */
const DED_IACAY=["2017-18","2018-19","2019-20","2020-21","2021-22","2022-23","2023-24","2024-25","2025-26","2026-27"].map(x=>[x,x]);
const DED_AAAY=["2005-06","2006-07","2007-08","2008-09","2009-10","2010-11","2011-12","2012-13","2013-14","2014-15",
 "2015-16","2016-17","2017-18","2018-19","2019-20","2020-21","2021-22","2022-23"].map(x=>[x,x]);
/* 80-IA / 80-IB / 80-IE(80-IC) fixed section & location codes (80.md — NOT user inputs) */
const DED_IA_CLAUSE=[["inf","DeductUs80_IA_4_i","INFRAFAC","a · 80-IA(4)(i) — Infrastructure facility"],
 ["pow","DeductUs80_IA_4_iv","POWER","b · 80-IA(4)(iv) — Power"]];
const DED_IB_CLAUSE=[["jk","DeductJKLocUs80_IB_4_Und","INDSRTL_JK","a · 80-IB(4) — J&K / Ladakh undertaking"],
 ["oil","DeductMinOilUs80_IB_9_Und","COMM_PROD","b · 80-IB(9) — mineral oil"],
 ["hous","DeductHousUs80_IB_10_Und","HOUSING_PROJECT","c · 80-IB(10) — housing projects"],
 ["fruit","DeductFruitVegUs80_IB_11A_Und","FRIUTS_VEGTBLE","d · 80-IB(11A) — fruits/vegetables/meat/dairy"],
 ["food","DeductFoodGrainUs80_IB_11A_Und","STOR_TRANS","e · 80-IB(11A) — foodgrains handling/storage"]];
const DED_IC_CLAUSE=[["assam","Assam_Und","INDSRTL_ASSAM","Assam"],["arun","ArunachalPradesh_Und","INDSRTL_ARUNPRADESH","Arunachal Pradesh"],
 ["mani","Manipur_Und","INDSRTL_MANIPUR","Manipur"],["mizo","Mizoram_Und","INDSRTL_MIZORAM","Mizoram"],
 ["megh","Meghalaya_Und","INDSRTL_MEGHALAYA","Meghalaya"],["naga","Nagaland_Und","INDSRTL_NAGALND","Nagaland"],
 ["trip","Tripura_Und","INDSRTL_TRIPURA","Tripura"],["sikk","Sikkim_Und","INDSRTL_SIKKIM","Sikkim"]];
/* NOTE: 80.md prints the Sikkim code as "INDSTRL_SIKKIM"; the schema's Sch80LocOrDescCode
   pattern for Sikkim_Und is "INDSRTL_SIKKIM" — the schema is authoritative, so we emit that. */
/* 80P — 13 activity rows: [rowid, fixed nature-of-business code, label, cap] (80P.md) */
const DED_80P=[["r5","23001","80P(2)(a)(i) — Banking / credit facilities to members",0],
 ["r6","23002","80P(2)(a)(ii) — Cottage industry",0],
 ["r7","23003","80P(2)(a)(iii) — Marketing of agricultural produce of members",0],
 ["r8","23004","80P(2)(a)(iv) — Purchase of agricultural implements/seeds/livestock for members",0],
 ["r9","23005","80P(2)(a)(v) — Processing (without power) of agricultural produce of members",0],
 ["r10","23006","80P(2)(a)(vi) — Collective disposal of labour of members",0],
 ["r11","23007","80P(2)(a)(vii) — Fishing / allied activities for members",0],
 ["r12","23008","80P(2)(b) — Primary co-op supplying milk/oilseeds/fruits/vegetables",0],
 ["r13","23009","80P(2)(c)(i) — Consumer co-op (other than 2a/2b)",100000],
 ["r14","23010","80P(2)(c)(ii) — Other co-op (other than 2a/2b)",50000],
 ["r15","23011","80P(2)(d) — Interest/dividend from other co-op society",0],
 ["r16","23012","80P(2)(e) — Letting of godowns/warehouses",0],
 ["r17","23013","80P(2)(f) — Others",0]];
/* 80P per-row schema key prefixes (Schedule80P flat leaves) in row order */
const DED_80P_KEY=["Sec80P2ai","Sec80P2aii","Sec80P2aiii","Sec80P2aiv","Sec80P2av","Sec80P2avi","Sec80P2avii",
 "Sec80P2b","Sec80P2ci","Sec80P2cii","Sec80P2d","Sec80P2e","Sec80P2f"];

/* the VI-A lettered rows — [key, letter, label, schemaKey, fed?] ; Part B a–c, Part C d–n (VI_A.md) */
const DED_VIA=[
 ["c80g","a","80G — donations to certain funds / institutions","Section80G",1],
 ["c80gga","b","80GGA — donations for scientific research or rural development","Section80GGA",1],
 ["c80ggc","c","80GGC — contribution to a political party","Section80GGC",1],
 ["c80ia","d","80IA — infrastructure undertakings (c of Schedule 80-IA)","Section80IA",1],
 ["c80iab","e","80IAB — development of a Special Economic Zone","Section80IAB",0],
 ["c80iac","f","80-IAC — eligible start-up (6 of Schedule 80-IAC)","Section80IAC",1],
 ["c80ib","g","80IB — certain industrial undertakings (f of Schedule 80-IB)","Section80IB",1],
 ["c80iba","h","80-IBA — profits from housing projects","Section80IBA",0],
 ["c80ie","i","80IE — special-category / North-Eastern States (B of Schedule 80-IE)","Section80IC",1],
 ["c80jja","j","80JJA — collecting and processing of bio-degradable waste","Section80JJA",0],
 ["c80jjaa","k","80JJAA — employment of new employees","Section80JJAA",0],
 ["c80la1","l","80LA(1) — offshore banking units (8 of Schedule 80-LA)","Section80LA",1],
 ["c80la1a","m","80LA(1A) — International Financial Services Centre","Section80LA_1A",1],
 ["c80p","n","80P — income of co-operative societies","Section80P",1]];
const DED_PARTB=["c80g","c80gga","c80ggc"];
const DED_PARTC=["c80ia","c80iab","c80iac","c80ib","c80iba","c80ie","c80jja","c80jjaa","c80la1","c80la1a","c80p"];
const DED_KEYED=["c80iab","c80iba","c80jja","c80jjaa"];  /* user-entered (no sub-schedule) */
/* new regime (115BAC(1A)/115BAD/115BAE): only 80JJAA and 80LA(1A) survive — VI_A.md §"New regime" */
const DED_VIA_NEW=["c80jjaa","c80la1a"];
const DED_MAP={c80g:"Section80G",c80gga:"Section80GGA",c80ggc:"Section80GGC",c80ia:"Section80IA",
 c80iab:"Section80IAB",c80iac:"Section80IAC",c80ib:"Section80IB",c80iba:"Section80IBA",c80ie:"Section80IC",
 c80jja:"Section80JJA",c80jjaa:"Section80JJAA",c80la1:"Section80LA",c80la1a:"Section80LA_1A",c80p:"Section80P"};

/* ===================================================================
   engDed80G — the four buckets, cash>₹2,000 disallowed, and the
   qualifying-limit waterfall (80G.md rules with cell refs).
   TI = Total_Income ('80G'!T5); otherDed = 80GGA+80GGC+Part-C (for the
   10% adjusted-income qualifying limit [X3]).  closed = new-regime gate.
   =================================================================== */
function engDed80G(TI,otherDed,closed){
  const rows=S.ded.g80||[];
  const base=r=>(N(r.cash)>2000?0:N(r.cash))+N(r.other);   /* cash over ₹2,000 gives no deduction [O7…] */
  const of=b=>rows.filter(r=>(r.bucket||"A")===b);
  const cashTot={},othTot={},donTot={};
  ["A","B","C","D"].forEach(b=>{const rs=of(b);
    cashTot[b]=R(rs.reduce((s,r)=>s+N(r.cash),0));
    othTot[b]=R(rs.reduce((s,r)=>s+N(r.other),0));
    donTot[b]=R(rs.reduce((s,r)=>s+(N(r.amt)||N(r.cash)+N(r.other)),0));});
  /* A (100%, no limit) [O7/O12] */
  const Aelig=Math.min(of("A").reduce((s,r)=>s+Math.min(base(r),TI),0),TI);
  /* B (50%, no limit) [O19/O24] */
  const Belig=Math.round(Math.min(of("B").reduce((s,r)=>s+Math.round(Math.min(base(r)/2,TI)),0),TI));
  /* qualifying limit [X3] = 10% × max(0, TI − (80GGA + 80GGC + other Part-C VI-A deductions)) */
  const QL=Math.max(0,Math.round(0.1*Math.max(0,TI-otherDed)));
  /* C (100%, with limit) [O31/O36] — per-row min(min(base,TI),QL), total capped at QL */
  const Craw=of("C").reduce((s,r)=>s+Math.round(Math.min(Math.min(base(r),TI),QL)),0);
  const Celig=Math.round(Math.min(Craw,QL));
  /* D (50%, with limit) [AA3/O43/O48] — remaining pool after C, halved */
  const CDE=Math.max(0,Math.round((QL-Craw)/2));
  const Dbase=of("D").reduce((s,r)=>s+base(r),0);
  const Delig=Math.round(Math.min(TI,Math.min(CDE,Dbase/2)));
  const gross=R(donTot.A+donTot.B+donTot.C+donTot.D);
  const eligible=closed?0:Math.max(0,Math.min(TI,R(Aelig+Belig+Celig+Delig)));  /* [O52] 0 in new regime */
  return {eligible:R(eligible),gross,cashTot,othTot,donTot,QL:R(QL),
    Aelig:R(Aelig),Belig:R(Belig),Celig:R(Celig),Delig:R(Delig),
    cashAll:R(cashTot.A+cashTot.B+cashTot.C+cashTot.D),othAll:R(othTot.A+othTot.B+othTot.C+othTot.D)};
}

/* ===================================================================
   engDed80P — per-row eligible amount ≤ income, row caps (₹1L / ₹50k),
   totals; closed under new regime / s.12 return [G18/H18] (80P.md).
   =================================================================== */
function engDed80P(closed){
  const P=S.ded.p||{}; const out={}; let incTot=0,amtTot=0;
  DED_80P.forEach((x,i)=>{const id=x[0],cap=x[3];
    const inc=N((P[id]||{}).inc), amt0=N((P[id]||{}).amt);
    let amt=Math.min(amt0,inc);                 /* H(row) ≤ G(row) (n643) */
    if(cap&&amt>cap)amt=cap;                     /* row 9 ≤ ₹1,00,000 / row 10 ≤ ₹50,000 */
    out[id]={inc:R(inc),amt:R(Math.max(0,amt))}; incTot+=inc; amtTot+=out[id].amt;});
  return {rows:out,total:R(Math.max(0,incTot)),totalAmt:closed?0:R(Math.max(0,amtTot))};
}

/* ===================================================================
   engDed — build S.C.ded. Deductions add 0 to GTI; the allowed VI-A
   total and the Part-C-less-80P figure (AMT add-back) are exposed for
   the tax / AMT sections. GTI is read from the loss/heads S.C (the tax
   section at order 90 re-applies the authoritative cap on Total Income).
   =================================================================== */
function engDed(){
  /* regime contract published by 65_regime.js (S.C.regime) — guarded; falls back to the
     115BAC-only shell isNew() until the resolver publishes it. anyConc covers 115BAC(1A)
     AND the co-op concessional regimes 115BAD/115BAE, which isNew() never sees. */
  const RG=(S.C&&S.C.regime)||{};
  const is115BAD=!!RG.is115BAD, is115BAE=!!RG.is115BAE;
  const conc=(RG.anyConc!=null)?!!RG.anyConc:isNew();   /* new (concessional) regime — Part-C/10AA bar */
  const stat=st0((S.pi||{}).status)||"1";
  const sub=st0((S.pi||{}).substatus);
  const isLLP=stat==="1"&&/LLP/i.test(sub);
  const isCoop=stat==="14"&&/^(1a|1b|1c|3)/.test(sub);   /* co-operative society sub-statuses */
  const barred80ggc=(stat==="2"||stat==="9");        /* Local Authority / AJP (80GGC.md P7) */
  const fx=st0((S.fs||{}).foreignExch)==="Y";        /* IFSC convertible-forex (80LA(1A) gate) */

  /* ---- GTI / special-rate income / business pool ---- read the loss section's
     published BFLA contract S.C.loss.afterB {hp,bus,spec,specified,st20,st30,stApp,
     stDTAA,lt125,ltDTAA,os,horse,osDTAA} (post CYLA+BFLA col-5, tests/…/loss.md);
     fall back to the raw head incomes until loss is assembled. The tax section
     (order 90) re-applies the authoritative GTI cap on Total Income. */
  const L=S.C.loss||{}; const B=L.afterB||null;
  const head=h=>N(((S.C||{})[h]||{}).income);
  const pick=(o,ks,d)=>{if(o)for(const k of ks)if(o[k]!=null)return N(o[k]);return d;};
  const hp=Math.max(0,B?N(B.hp):head("hp"));
  const bpInc=B?N(B.bus):head("bp");                                  /* non-speculative business, after BFLA */
  const os=Math.max(0,B?N(B.os):head("os"));
  /* GTI = total of BFLA col-5 across every head (= Sheet8b.GrossTotalIncome) */
  const gtiFromB=B?["hp","bus","spec","specified","st20","st30","stApp","stDTAA","lt125","ltDTAA","os","horse","osDTAA"].reduce((s,k)=>s+N(B[k]),0):null;
  const gti=Math.max(0,pick(L,["gti"],gtiFromB!=null?gtiFromB:pick(S.C,["gti"],hp+Math.max(0,bpInc)+Math.max(0,N((S.C.cg||{}).C3))+os)));
  /* income chargeable at special rates (Sheet8b.IncChargeableTaxSplRates) — the
     special-rate BFLA buckets (STCG 20/30, LTCG 12.5, all DTAA); loss/heads fallback */
  const spl=Math.max(0,pick(L,["splRate","special"],B?(N(B.st20)+N(B.st30)+N(B.stDTAA)+N(B.lt125)+N(B.ltDTAA)+N(B.osDTAA)):(N((S.C.os||{}).special)+N((S.C.cg||{}).special))));
  const gtiNet=Math.max(0,R(gti)-R(spl));            /* GTI − income at special rates [W3/K8/K22] */
  const TI=R(gti);                                   /* Total_Income proxy for 80G ('80G'!T5) */
  /* non-presumptive / non-speculative business income after BFLA, less 44AD/44ADA/44AE [K21] */
  const bpS=S.bp||{};
  const pres=N(bpS.p44AD)+N(bpS.p44ADA)+N(bpS.p44AE);
  const bizPool=Math.max(0,Math.max(0,bpInc)-pres);
  const kv=k=>N((S.ded.v||{})[k]);
  const sum2=a=>{a=a||[];return N(a[0])+(N(a[0])?N(a[1]):0);};   /* U2 ignored unless U1 present (80.md [C3]) */

  /* ---- sub-schedule totals (Part C sources) ---- */
  const tot80IA=conc?0:R(sum2(S.ded.ia.inf)+sum2(S.ded.ia.pow));
  const IB=S.ded.ib, tot80IB=conc?0:R(sum2(IB.jk)+sum2(IB.oil)+sum2(IB.hous)+sum2(IB.fruit)+sum2(IB.food));
  const IC=S.ded.ic, totNE=R(DED_IC_CLAUSE.reduce((s,x)=>s+sum2(IC[x[0]]),0)), tot80IC=conc?0:totNE;
  const tot80IAC=conc?0:R(N((S.ded.iac||{}).amt));
  const la=S.ded.la||[];
  const la1raw=R(la.filter(r=>r.sub==="80LA(1)").reduce((s,r)=>s+N(r.amt),0));
  const la1araw=R(la.filter(r=>r.sub==="80LA(1A)").reduce((s,r)=>s+N(r.amt),0));
  const laTot=R(la.reduce((s,r)=>s+N(r.amt),0));
  const p80=engDed80P(conc);                          /* 80P closes in new regime */

  /* ---- Part C col-K (System Calculated) per line ---- */
  const out={};
  out.c80ia=tot80IA;                                  /* [K10] */
  out.c80iab=conc?0:R(kv("c80iab"));                  /* [K11] keyed */
  out.c80iac=tot80IAC;                                /* [K12] */
  out.c80ib=tot80IB;                                  /* [K13] */
  out.c80iba=conc?0:Math.min(R(kv("c80iba")),gti);   /* [K14] capped at GTI, 0 in new regime */
  out.c80ie=tot80IC;                                  /* [K15] */
  out.c80jja=conc?0:Math.min(R(kv("c80jja")),gti);   /* [K16] capped at GTI, 0 in new regime */
  out.c80jjaa=Math.min(R(kv("c80jjaa")),gtiNet);     /* [K17] SURVIVES new regime; ≤ post-BFLA income */
  out.c80la1=conc?0:(fx?0:la1raw);                   /* [K18] needs forex="No"; closes in new regime */
  out.c80la1a=fx?la1araw:0;                           /* [K19] needs forex="Yes"; SURVIVES new regime */
  out.c80p=(isCoop&&!(is115BAD||is115BAE))?p80.totalAmt:0; /* [K20] co-op only (A653/A631); forgone if it elected 115BAD/115BAE */
  const partCraw=DED_PARTC.reduce((s,k)=>s+N(out[k]),0);

  /* ---- Part B col-K (80G qualifying limit consumes 80GGA+80GGC+Part-C) ---- */
  const bizInc=Math.max(0,bpInc);
  const gga_e=Math.min((S.ded.gga||[]).reduce((s,r)=>s+Math.min((N(r.cash)>2000?0:N(r.cash))+N(r.other),TI),0),TI);
  out.c80gga=conc?0:(bizInc>0?0:R(gga_e));            /* [K6] 0 where there is business income */
  const ggc_e=Math.min((S.ded.ggc||[]).reduce((s,r)=>s+N(r.other),0),gti);  /* cash never eligible [I8] */
  out.c80ggc=(conc||barred80ggc||gti<0)?0:R(ggc_e);  /* [K7] closed: new regime / Local Authority / AJP */
  const g80=engDed80G(TI,N(out.c80gga)+N(out.c80ggc)+partCraw,conc);
  out.c80g=g80.eligible;                              /* [K5] */

  /* ---- part totals with the GTI clamps (VI_A.md summary) ---- */
  const partBraw=N(out.c80g)+N(out.c80gga)+N(out.c80ggc);
  const partB=Math.max(0,Math.min(partBraw,gtiNet));                     /* [K8] Part B ≤ GTI − special-rate */
  const has80P=N(out.c80p)>0;
  const partCpool=bizPool+(has80P?Math.max(0,hp)+Math.max(0,os):0);      /* 80P admits HP+OS income [K21] */
  const partC=Math.max(0,Math.min(partCraw,partCpool));                  /* [K21] Part C ≤ business income after BFLA */
  const total=R(partBraw+partCraw);                                      /* [I22] */
  const allowed=Math.max(0,Math.min(R(partB+partC),gtiNet));            /* [K22] total ≤ GTI − special-rate */
  const partCForAMT=Math.max(0,R(partC-N(out.c80p)));                    /* AMT 2a = Part C less 80P (AMT.md [H6]) */

  /* ---- Schedule 10AA (section-10AA deduction, NOT Chapter VI-A) ---- */
  const aaRaw=R((S.ded.aa||[]).reduce((s,r)=>s+N(r.amt),0));
  const ded10AA=conc?0:Math.max(0,Math.min(aaRaw,Math.max(0,gtiNet-allowed)));  /* PartB-TI L43 */

  S.C.ded={income:0,conc,
    out,g80,p80,
    gga_e:R(gga_e),ggc_e:R(ggc_e),
    la1raw,la1araw,laTot,tot80IA,tot80IB,tot80IC,totNE,tot80IAC,
    partBraw:R(partBraw),partCraw:R(partCraw),partB:R(partB),partC:R(partC),
    total:R(total),allowed:R(allowed),partCForAMT:R(partCForAMT),
    ded10AA:R(ded10AA),aa10Raw:aaRaw,
    gti:R(gti),spl:R(spl),gtiNet,TI,bizPool:R(bizPool),
    clipped:total>gtiNet,isLLP,isCoop,barred80ggc,fx};
}

/* ===================================================================
   secDed — renderer
   =================================================================== */
function dedClauseUnd(base,label,code){    /* two undertaking amount inputs for an 80-IA/IB/IE clause */
  const a=get(base)||["",""];
  return row(label,cell(sum2Disp(a)),{ref:code,hint:"fixed code "+code})+
    row("Undertaking 1",inp(base+".0",{n:1}),{ind:1})+
    row("Undertaking 2",inp(base+".1",{n:1}),{ind:1,hint:"ignored unless Undertaking 1 is filled"});
}
function sum2Disp(a){a=a||[];return N(a[0])+(N(a[0])?N(a[1]):0);}
function dedDoneeTbl(){  /* Schedule 80G — one table, bucket dropdown */
  return grid("ded.g80",[{k:"bucket",h:"Bucket",t:"sel",w:"230px",req:1,opts:DED_G80BUCKET},
    {k:"name",h:"Name of donee",t:"txt",w:"auto",req:1,max:125},{k:"addr",h:"Address",t:"txt",w:"auto",req:1,max:200},
    {k:"city",h:"City / Town / District",t:"txt",w:"130px",req:1,max:50},{k:"state",h:"State",t:"sel",w:"150px",req:1,opts:DED_STOPTS},
    {k:"pin",h:"PIN",t:"txt",w:"90px",max:6,req:1},{k:"pan",h:"PAN of donee",t:"txt",w:"120px",max:10,req:1},
    {k:"arn",h:"ARN (bucket D)",t:"txt",w:"140px",max:25},{k:"cash",h:"In cash",t:"num",w:"100px"},
    {k:"other",h:"Other mode",t:"num",w:"100px"},{k:"ref",h:"Transaction ref",t:"txt",w:"150px",max:50},
    {k:"ifsc",h:"IFSC",t:"txt",w:"110px",max:11},{k:"amt",h:"Total",t:"num",w:"110px",req:1}],
    S.ded.g80||[],{min:"2000px",empty:"No donation listed.",add:"Add a donee"});
}
function secDed(){
  const V=S.C.ded||{out:{},g80:{},p80:{rows:{}}}, O=V.out||{};
  let h="";
  if(V.conc)h+=note("<b>Under the new tax regime (115BAC(1A)/115BAD/115BAE) only 80JJAA and 80LA(1A) survive.</b> Every other Chapter VI-A deduction and section 10AA are closed and shown as zero.","stop");
  if(V.barred80ggc)h+=note("A Local Authority / Artificial Juridical Person cannot claim 80GGC — it is set to zero.","warn");

  const hdr='<div class="r sub"><div class="l">Section</div><div class="ref"></div><div class="v2 hd2">You claim</div><div class="v hd2">System calculated</div></div>';
  const line=(k)=>{const x=DED_VIA.find(y=>y[0]===k);const [,ref,label,,fed]=x;
    const open=!V.conc||DED_VIA_NEW.indexOf(k)>=0;
    const keyed=DED_KEYED.indexOf(k)>=0;
    const claimBox=(open&&keyed)?inp("ded.v."+k,{n:1}):cell(O[k]||0);
    return '<div class="r'+(open?"":" closed")+'"><div class="l">'+esc(label)+
      (!open&&(N(O[k])||kv0(k))?'<span class="hint">closed by the new regime</span>':(fed&&open?'<span class="hint">from the schedule below</span>':''))+'</div>'+
      '<div class="ref">'+esc(ref)+'</div><div class="v2">'+claimBox+'</div>'+
      '<div class="v">'+cell(O[k]||0)+'</div></div>';};

  h+='<div class="cgband">1 · Part B — Deduction in respect of certain payments (a to c)</div>'+hdr;
  DED_PARTB.forEach(k=>h+=line(k));
  h+=row("Total deduction under Part B",cell(V.partB),{ref:"8",cls:"tot"});
  h+='<div class="cgband">2 · Part C — Deduction in respect of certain incomes (d to n)</div>'+hdr;
  DED_PARTC.forEach(k=>h+=line(k));
  h+=row("Total deduction under Part C",cell(V.partC),{ref:"21",cls:"tot"});
  if(V.clipped)h+=note("The Chapter VI-A total is limited to the gross total income less income taxed at special rates.","warn");
  h+=row("Total deductions under Chapter VI-A (1 + 2)",cell(V.allowed),{ref:"22",cls:"grand"});

  /* ---------------- the schedules behind the figures ---------------- */
  h+='<div class="cgband">The schedules behind the figures</div>';
  /* 80G */
  const g80sum=(S.ded.g80||[]).reduce((s,r)=>s+N(r.amt),0);
  h+=card("d80g","Schedule 80G — donations, donee by donee",g80sum?RS(g80sum):"",
    note("Buckets: A 100% no-limit · B 50% no-limit · C 100% with the 10% qualifying limit · D 50% with the limit. A donation in cash over ₹2,000 gives no deduction; for any other mode the transaction reference and IFSC are needed. Use PAN <b>GGGGG0000G</b> for a Government donee without a PAN.")+
    dedDoneeTbl()+
    row("Eligible donation (A + B + C + D)",cell(V.g80?V.g80.eligible:0),{cls:"grand",hint:V.g80?"qualifying limit "+RS(V.g80.QL):""}));
  /* 80GGA + RA */
  const ggasum=(S.ded.gga||[]).reduce((s,r)=>s+N(r.amt),0);
  h+=card("d80gga","Schedule 80GGA — scientific research or rural development",ggasum?RS(ggasum):"",
    grid("ded.gga",[{k:"clause",h:"Relevant clause",t:"sel",w:"200px",req:1,opts:DED_GGACLAUSE},{k:"name",h:"Name of donee",t:"txt",w:"auto",req:1,max:125},
      {k:"addr",h:"Address",t:"txt",w:"auto",req:1,max:200},{k:"city",h:"City / Town / District",t:"txt",w:"120px",req:1,max:50},
      {k:"state",h:"State",t:"sel",w:"150px",req:1,opts:DED_STOPTS},{k:"pin",h:"PIN",t:"txt",w:"90px",max:6,req:1},
      {k:"pan",h:"PAN of donee",t:"txt",w:"120px",max:10,req:1},{k:"cash",h:"In cash",t:"num",w:"110px"},
      {k:"other",h:"Other mode",t:"num",w:"110px"},{k:"amt",h:"Total donation",t:"num",w:"120px",req:1}],S.ded.gga||[],
      {min:"1600px",empty:"No donation listed.",add:"Add a donee"})+
    note("Cash over ₹2,000 gives no deduction. 80GGA is allowed only to an assessee with no business income — for a firm/LLP with business income it computes as zero.","warn")+
    sub("Schedule RA — research associations etc. under 35(1)(ii)/(iia)/(iii)/35(2AA)")+
    grid("ded.ra",[{k:"name",h:"Name of donee",t:"txt",w:"auto",req:1,max:125},{k:"addr",h:"Address",t:"txt",w:"auto",req:1,max:200},
      {k:"city",h:"City / Town / District",t:"txt",w:"140px",req:1,max:50},{k:"state",h:"State",t:"sel",w:"150px",req:1,opts:DED_STOPTS},
      {k:"pin",h:"PIN",t:"txt",w:"90px",max:6,req:1},{k:"pan",h:"PAN of donee",t:"txt",w:"120px",max:10,req:1},
      {k:"cash",h:"Donation in cash",t:"num",w:"120px"},{k:"other",h:"Donation in other mode",t:"num",w:"140px"}],
      S.ded.ra||[],{min:"1300px",empty:"None listed.",add:"Add a donee"})+
    formNote("Schedule RA is required (at least one row) when a 35(1)(ii)/(iia)/(iii)/(2AA) deduction is claimed in Schedule ESR."));
  /* 80GGC */
  const ggcsum=(S.ded.ggc||[]).reduce((s,r)=>s+(N(r.cash)+N(r.other)),0);
  h+=card("d80ggc","Schedule 80GGC — contribution to a political party",ggcsum?RS(ggcsum):"",
    grid("ded.ggc",[{k:"dt",h:"Date of contribution",t:"date",w:"130px",req:1},{k:"name",h:"Name of party",t:"txt",w:"auto",req:1,max:125},
      {k:"pan",h:"PAN of party",t:"txt",w:"120px",max:10,req:1},{k:"cash",h:"In cash",t:"num",w:"110px"},
      {k:"other",h:"Other mode",t:"num",w:"110px"},{k:"ref",h:"Transaction ref",t:"txt",w:"150px",max:50},{k:"ifsc",h:"IFSC",t:"txt",w:"120px",max:11}],
      S.ded.ggc||[],{min:"1150px",empty:"No contribution listed.",add:"Add a contribution"})+
    note("A contribution in cash gives no deduction — only the other-mode amount is eligible. Name and PAN of the party are mandatory.","warn"));
  /* 80-IA / 80-IB / 80-IE */
  h+=card("d80ia","Schedule 80-IA — infrastructure undertakings",V.tot80IA?RS(V.tot80IA):"",
    DED_IA_CLAUSE.map(x=>dedClauseUnd("ded.ia."+x[0],x[3],x[2])).join("")+
    row("Total deduction under section 80-IA",cell(V.tot80IA),{ref:"c",cls:"grand"})+
    formNote("Form 10CCB must be filed. Closed under the new regime."));
  h+=card("d80ib","Schedule 80-IB — certain industrial undertakings",V.tot80IB?RS(V.tot80IB):"",
    DED_IB_CLAUSE.map(x=>dedClauseUnd("ded.ib."+x[0],x[3],x[2])).join("")+
    row("Total deduction under section 80-IB",cell(V.tot80IB),{ref:"f",cls:"grand"})+
    formNote("Form 10CCB must be filed. Closed under the new regime."));
  h+=card("d80ie","Schedule 80-IE — North-Eastern / special-category States",V.tot80IC?RS(V.tot80IC):"",
    sub("A · Industrial undertaking located in the North-East")+
    DED_IC_CLAUSE.map(x=>dedClauseUnd("ded.ic."+x[0],x[3],x[2])).join("")+
    row("Ai · Total for North-East undertakings",cell(V.totNE),{cls:"tot"})+
    row("B · Total deduction under section 80-IE",cell(V.tot80IC),{cls:"grand"})+
    formNote("Form 10CCB must be filed. Closed under the new regime."));
  /* 80IAC */
  h+=card("d80iac","Schedule 80-IAC — eligible start-up",N((S.ded.iac||{}).amt)?RS(N(S.ded.iac.amt)):"",
    (V.isLLP?"":note("80-IAC can be claimed only by an LLP.","warn"))+
    ((S.fs||{}).startupDPIIT!=="Y"?note("Enable only when Part A-General records DPIIT start-up recognition = Yes.","warn"):"")+
    row("Date of incorporation of the start-up",dte("ded.iac.dt"),{req:1,hint:"after 01-Apr-2016 and on/before 01-Apr-2025"})+
    row("Nature of business",inp("ded.iac.nob",{max:120}),{req:1})+
    row("Inter-Ministerial Board certificate number",inp("ded.iac.cert",{max:30}),{req:1})+
    row("First AY in which the deduction was claimed",sel("ded.iac.fay",DED_IACAY),{req:1})+
    row("Amount of deduction for the current AY",inp("ded.iac.amt",{n:1}),{req:1})+
    formNote("Form 10CCB must be filed. Closed under the new regime."));
  /* 80LA */
  const lasum=(S.ded.la||[]).reduce((s,r)=>s+N(r.amt),0);
  h+=card("d80la","Schedule 80-LA — offshore banking unit / IFSC",lasum?RS(lasum):"",
    note("Choose 80LA(1) when the IFSC-convertible-foreign-exchange answer in Part A-General is <b>No</b>; 80LA(1A) when it is <b>Yes</b>. The two cannot be claimed together. Form 10CCF must be filed.")+
    grid("ded.la",[{k:"sub",h:"Sub-section",t:"sel",w:"180px",req:1,opts:DED_LASUB},{k:"ent",h:"Type of entity",t:"sel",w:"260px",req:1,opts:DED_LAENT},
      {k:"inc",h:"Type of income",t:"sel",w:"300px",req:1,opts:DED_LAINC},{k:"auth",h:"Registration authority",t:"sel",w:"130px",req:1,opts:DED_LAAUTH},
      {k:"dt",h:"Date of registration",t:"date",w:"130px",req:1},{k:"regno",h:"Registration no.",t:"txt",w:"140px",max:30,req:1},
      {k:"fay",h:"First AY",t:"txt",w:"90px",max:7,req:1},{k:"amt",h:"Amount for current AY",t:"num",w:"150px",req:1}],
      S.ded.la||[],{min:"1650px",empty:"No unit listed.",add:"Add a unit"})+
    row("80LA(1) subtotal → VI-A l",cell(V.la1raw),{cls:"tot"})+
    row("80LA(1A) subtotal → VI-A m",cell(V.la1araw),{cls:"tot"}));
  /* 80P */
  h+=card("d80p","Schedule 80P — income of co-operative societies",(V.p80&&V.p80.totalAmt)?RS(V.p80.totalAmt):"",
    (V.isCoop?"":note("80P can be claimed only by a co-operative society (Primary Agricultural Credit Society / Primary Co-op Agricultural & Rural Development bank / other co-op society).","warn"))+
    '<div class="r sub"><div class="l">Activity (Sec. 80P(2)) — nature-of-business code auto-set</div><div class="ref"></div><div class="v2 hd2">Income</div><div class="v hd2">Amount eligible</div></div>'+
    DED_80P.map(x=>{const id=x[0];
      return '<div class="r"><div class="l">'+esc(x[2])+'<span class="hint">code '+x[1]+(x[3]?" · cap "+RS(x[3]):"")+'</span></div><div class="ref"></div>'+
        '<div class="v2">'+inp("ded.p."+id+".inc",{n:1})+'</div><div class="v2">'+inp("ded.p."+id+".amt",{n:1})+'</div></div>';}).join("")+
    row("Total income",cell(V.p80?V.p80.total:0),{cls:"tot"})+
    row("Total amount eligible for deduction",cell(V.p80?V.p80.totalAmt:0),{cls:"grand"})+
    note("Eligible amount cannot exceed the income in that row; 80P(2)(c)(i) ≤ ₹1,00,000, 80P(2)(c)(ii) ≤ ₹50,000. P&L must be filled. Closed under the new regime / for a section-12 return.","warn"));
  /* 10AA */
  const aasum=(S.ded.aa||[]).reduce((s,r)=>s+N(r.amt),0);
  h+=card("d10aa","Schedule 10AA — units in a Special Economic Zone",(V.ded10AA||aasum)?RS(V.ded10AA||aasum):"",
    (V.conc?note("Closed under the new regime (section 115BAC).","stop"):"")+
    grid("ded.aa",[{k:"ay",h:"AY the unit began to manufacture / provide services",t:"sel",w:"auto",req:1,opts:DED_AAAY},
      {k:"amt",h:"Amount of deduction",t:"num",w:"200px",req:1}],S.ded.aa||[],
      {min:"640px",empty:"No unit listed.",add:"Add a unit (max 5)",foot:[{l:1,v:"Total under section 10AA",span:1},{v:V.ded10AA||0}]})+
    formNote("Return within due date and Form 56F required; also fill sl. B of Schedule DI."));

  /* how the total income comes out */
  h+='<div class="cgband">How the total income comes out</div>';
  h+=row("Gross total income (indicative)",cell(V.gti||0),{cls:"tot",hint:"set authoritatively by Part B-TI"});
  h+=row("Less: deductions under Chapter VI-A",cell(-(V.allowed||0)));
  if(V.ded10AA)h+=row("Less: deduction under section 10AA",cell(-(V.ded10AA||0)));
  h+=row("Total income (indicative)",cell(Math.max(0,(V.gti||0)-(V.allowed||0)-(V.ded10AA||0))),{cls:"grand",hint:"the tax section rounds and finalises this"});
  return h;
}
function kv0(k){return N((S.ded.v||{})[k]);}

/* ===================================================================
   expDed — write the twelve schema blocks onto j (put)
   =================================================================== */
function expDed(j){
  const V=S.C.ded||{out:{}}; const O=V.out||{};

  /* ---- ScheduleVIA (always present; the three totals required each side) ---- */
  const usr={},ded={};
  DED_VIA.forEach(x=>{const k=x[0],f=DED_MAP[k];const v=n0(O[k]);
    if(v){put(usr,f,v);put(ded,f,v);}});               /* per line: claimed = allowed (col I = col K per line) */
  usr.TotPartBchapterVIA=n0(V.partBraw); usr.TotPartCchapterVIA=n0(V.partCraw); usr.TotalChapVIADeductions=n0(V.total);
  ded.TotPartBchapterVIA=n0(V.partB);    ded.TotPartCchapterVIA=n0(V.partC);    ded.TotalChapVIADeductions=n0(V.allowed);
  j.ScheduleVIA={UsrDeductUndChapVIA:usr,DeductUndChapVIA:ded};

  /* the donation / profit-linked sub-schedules are closed under the new regime — emit only in the old regime.
     Use the regime-resolved gate the engine already stored (covers 115BAC(1A)/115BAD/115BAE), not the
     115BAC-only isNew(), so Schedule10AA / Part-C sub-schedules are suppressed under 115BAD/115BAE too. */
  const conc=!!((S.C.ded||{}).conc);

  /* ---- Schedule80G ---- */
  {const rows=(S.ded.g80||[]).filter(r=>N(r.amt)||N(r.cash)||N(r.other));
   if(rows.length&&!conc){const G8=V.g80||{cashTot:{},othTot:{},donTot:{}};
    const mk=r=>{const cash=N(r.cash),oth=N(r.other);const o={DoneeName:(sv(r.name)||"NA").slice(0,125),
      DoneePAN:(st0(r.pan)||"NA").toUpperCase(),AddressDetail:{AddrDetail:(sv(r.addr)||"NA").slice(0,200),
        CityOrTownOrDistrict:(sv(r.city)||"NA").slice(0,50),StateCode:st0(r.state)||"01",PinCode:/^\d{6}$/.test(st0(r.pin))?+r.pin:100000},
      DonationAmtCash:n0(cash),DonationAmtOtherMode:n0(oth),DonationAmt:n0(N(r.amt)||cash+oth),
      DonationElgAmt:n0((cash>2000?0:cash)+oth)};
      if(sv(r.arn))o.ArnNbr=sv(r.arn).slice(0,25); if(sv(r.ref))o.TransactionRefNum=sv(r.ref).slice(0,50);
      if(sv(r.ifsc))o.IFSCCode=st0(r.ifsc).toUpperCase().slice(0,11); return o;};
    const G={};
    ["A","B","C","D"].forEach(b=>{const rs=rows.filter(r=>(r.bucket||"A")===b);if(!rs.length)return;const M=DED_G80BLK[b];
      const blk={DoneeDetail:rs.map(mk)};
      blk[M.c]=n0((G8.cashTot||{})[b]); blk[M.o]=n0((G8.othTot||{})[b]); blk[M.t]=n0((G8.donTot||{})[b]);
      blk[M.e]=n0(b==="A"?G8.Aelig:b==="B"?G8.Belig:b==="C"?G8.Celig:G8.Delig);
      G[M.blk]=blk;});
    G.TotalDonationsUs80GCash=n0(G8.cashAll); G.TotalDonationsUs80GOtherMode=n0(G8.othAll);
    G.TotalDonationsUs80G=n0(G8.gross); G.TotalEligibleDonationsUs80G=n0(O.c80g);
    j.Schedule80G=G;}}

  /* ---- Schedule80GGA ---- */
  {const rows=(S.ded.gga||[]).filter(r=>N(r.amt)||N(r.cash)||N(r.other));
   if(rows.length&&!conc){const cash=rows.reduce((a,r)=>a+N(r.cash),0),oth=rows.reduce((a,r)=>a+N(r.other),0);
    j.Schedule80GGA={DonationDtlsSciRsrchRuralDev:rows.map(r=>({RelevantClauseUndrDedClaimed:st0(r.clause)||"80GGA2a",
      NameOfDonee:(sv(r.name)||"NA").slice(0,125),AddressDetail:{AddrDetail:(sv(r.addr)||"NA").slice(0,200),
        CityOrTownOrDistrict:(sv(r.city)||"NA").slice(0,50),StateCode:st0(r.state)||"01",PinCode:/^\d{6}$/.test(st0(r.pin))?+r.pin:100000},
      DoneePAN:(st0(r.pan)||"NA").toUpperCase(),DonationAmtCash:n0(r.cash),DonationAmtOtherMode:n0(r.other),
      DonationAmt:n0(N(r.amt)||N(r.cash)+N(r.other)),EligibleDonationAmt:n0((N(r.cash)>2000?0:N(r.cash))+N(r.other))})),
      TotalDonationAmtCash80GGA:n0(cash),TotalDonationAmtOtherMode80GGA:n0(oth),
      TotalDonationsUs80GGA:n0(cash+oth),TotalEligibleDonationAmt80GGA:rows.reduce((a,r)=>a+n0((N(r.cash)>2000?0:N(r.cash))+N(r.other)),0)};}}

  /* ---- Schedule80RA (35(1) research associations) ---- */
  {const rows=(S.ded.ra||[]).filter(r=>N(r.cash)||N(r.other));
   if(rows.length){const cash=rows.reduce((a,r)=>a+N(r.cash),0),oth=rows.reduce((a,r)=>a+N(r.other),0);
    j.Schedule80RA={DonationDtlsRsrchAssctn:rows.map(r=>({NameOfDonee:(sv(r.name)||"NA").slice(0,125),
      AddressDetail:{AddrDetail:(sv(r.addr)||"NA").slice(0,200),CityOrTownOrDistrict:(sv(r.city)||"NA").slice(0,50),
        StateCode:st0(r.state)||"01",PinCode:/^\d{6}$/.test(st0(r.pin))?+r.pin:100000},DoneePAN:(st0(r.pan)||"NA").toUpperCase(),
      DonationAmtCash:n0(r.cash),DonationAmtOtherMode:n0(r.other),DonationAmt:n0(N(r.cash)+N(r.other)),EligibleDonationAmt:n0(N(r.cash)+N(r.other))})),
      TotalDonationAmtCash80RA:n0(cash),TotalDonationAmtOtherMode80RA:n0(oth),
      TotalDonationsUs80RA:n0(cash+oth),TotalEligibleDonationAmt80RA:n0(cash+oth)};}}

  /* ---- Schedule80GGC ---- */
  {const rows=(S.ded.ggc||[]).filter(r=>N(r.cash)||N(r.other));
   if(rows.length&&!conc&&!V.barred80ggc){const cash=rows.reduce((a,r)=>a+N(r.cash),0),oth=rows.reduce((a,r)=>a+N(r.other),0);
    j.Schedule80GGC={Schedule80GGCDetails:rows.map(r=>{const o={DonationDate:ISO(r.dt)||"2025-04-01",
      DonationAmtCash:n0(r.cash),DonationAmtOtherMode:n0(r.other),DonationAmt:n0(N(r.cash)+N(r.other)),
      EligibleDonationAmt:n0(r.other)};                       /* cash never eligible */
      if(sv(r.name))o.PoliticalPartyName=sv(r.name).slice(0,125); if(st0(r.pan))o.PoliticalPartyPAN=st0(r.pan).toUpperCase();
      if(sv(r.ref))o.TransactionRefNum=sv(r.ref).slice(0,50); if(sv(r.ifsc))o.IFSCCode=st0(r.ifsc).toUpperCase().slice(0,11); return o;}),
      TotalDonationAmtCash80GGC:n0(cash),TotalDonationAmtOtherMode80GGC:n0(oth),
      TotalDonationsUs80GGC:n0(cash+oth),TotalEligibleDonationAmt80GGC:rows.reduce((a,r)=>a+n0(r.other),0)};}}

  /* ---- Schedule80_IA / _IB / _IC — fixed clause objects (Sch80LocOrDescCode + up-to-2 amounts) ---- */
  const amtDtls=a=>{a=a||[];const arr=[];if(N(a[0])){arr.push({DeductAmountSec80:n0(a[0])});if(N(a[1]))arr.push({DeductAmountSec80:n0(a[1])});}
    else arr.push({DeductAmountSec80:0}); return arr;};                 /* first entry required per clause */
  if(!conc&&(N(sum2Disp(S.ded.ia.inf))||N(sum2Disp(S.ded.ia.pow)))){
    const IA={Sch80SectionCode:"80-IA"};
    DED_IA_CLAUSE.forEach(x=>IA[x[1]]={Sch80LocOrDescCode:x[2],Sch80DeductAmtDtls:amtDtls(S.ded.ia[x[0]])});
    IA.TotSchedule80_IA=n0(O.c80ia); j.Schedule80_IA=IA;}
  {const IBany=DED_IB_CLAUSE.some(x=>N(sum2Disp(S.ded.ib[x[0]])));
   if(!conc&&IBany){const IB={Sch80SectionCode:"80-IB"};
    DED_IB_CLAUSE.forEach(x=>IB[x[1]]={Sch80LocOrDescCode:x[2],Sch80DeductAmtDtls:amtDtls(S.ded.ib[x[0]])});
    IB.TotSchedule80_IB=n0(O.c80ib); j.Schedule80_IB=IB;}}
  {const ICany=DED_IC_CLAUSE.some(x=>N(sum2Disp(S.ded.ic[x[0]])));
   if(!conc&&ICany){const NE={};DED_IC_CLAUSE.forEach(x=>NE[x[1]]={Sch80LocOrDescCode:x[2],Sch80DeductAmtDtls:amtDtls(S.ded.ic[x[0]])});
    NE.TotDeductInNorthEast=n0(V.totNE);
    j.Schedule80_IC={Sch80SectionCode:"80-IC_IE",DeductInNorthEast:NE,TotSchedule80_IC:n0(O.c80ie)};}}

  /* ---- Schedule80IAC (single object) ---- */
  {const x=S.ded.iac||{};
   if(!conc&&N(x.amt)){j.Schedule80IAC={DateIncrpStrup:ISO(x.dt)||"2016-04-02",
     NatureOfBusiness:(sv(x.nob)||"NA").slice(0,120),InterMnstBoardCertNum:(sv(x.cert)||"NA").slice(0,30),
     FstAYDeduction:DED_IACAY.some(a=>a[0]===st0(x.fay))?st0(x.fay):"2026-27",AmtDedCurAY:n0(x.amt)};}}

  /* ---- Schedule80LA ---- */
  {const rows=(S.ded.la||[]).filter(r=>N(r.amt));
   if(rows.length){j.Schedule80LA={Schedule80LADtls:rows.map(r=>{const o={AmtDedCurAY:n0(r.amt)};
     if(st0(r.sub))o.SubSecDedClmd=st0(r.sub); if(st0(r.ent))o.EntityType=st0(r.ent); if(st0(r.inc))o.IncmTypeUnt=st0(r.inc);
     if(st0(r.auth))o.RegGNTAuth=st0(r.auth); if(ISO(r.dt))o.RegDate=ISO(r.dt);
     if(sv(r.regno))o.RegNumber=sv(r.regno).slice(0,30); if(sv(r.fay))o.FstAYDeduction=sv(r.fay).slice(0,7); return o;}),
     Total:n0(V.laTot)};}}

  /* ---- Schedule80P (flat matrix) ---- */
  {const P=S.ded.p||{}, pr=(V.p80||{rows:{}}).rows||{};
   const any=DED_80P.some(x=>N((P[x[0]]||{}).inc)||N((P[x[0]]||{}).amt));
   if(any&&V.isCoop){const blk={};
     DED_80P.forEach((x,i)=>{const id=x[0],key=DED_80P_KEY[i],row=pr[id]||{inc:0,amt:0};
       if(N(row.inc)||N(row.amt)){blk[key+"Code"]=x[1];blk[key]=n0(row.inc);blk[key+"Amt"]=conc?0:n0(row.amt);}});
     blk.Sec80PTotal=n0(V.p80?V.p80.total:0); blk.Sec80PTotalAmt=n0(V.p80?V.p80.totalAmt:0);
     j.Schedule80P=blk;}}

  /* ---- Schedule10AA (SEZ) ---- */
  {const rows=(S.ded.aa||[]).filter(r=>N(r.amt));
   if(rows.length&&!conc){j.Schedule10AA={DeductSEZ:{DedUs10Detail:{
     Undertaking:{DedFromUndertakingWithAy:rows.map(r=>({AssmtYrUnit:DED_AAAY.some(a=>a[0]===st0(r.ay))?st0(r.ay):"2022-23",DedUs10Sub:n0(r.amt)}))},
     TotalDedUs10Sub:rows.reduce((s,r)=>s+n0(r.amt),0)}}};}}
}

/* ===================================================================
   impDed — read the schema blocks back into S.ded
   =================================================================== */
function impDed(I5){
  const got=[]; S.ded=S.ded||{}; if(!S.ded.v)S.ded.v={};
  const g_=(o,p)=>{try{return p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);}catch(e){return undefined;}};
  const addr=a=>({addr:(a||{}).AddrDetail||"",city:(a||{}).CityOrTownOrDistrict||"",state:(a||{}).StateCode||"",pin:nz((a||{}).PinCode)+""});

  if(I5.ScheduleVIA){const U=I5.ScheduleVIA.UsrDeductUndChapVIA||{};
    if(U.Section80IAB)S.ded.v.c80iab=U.Section80IAB; if(U.Section80IBA)S.ded.v.c80iba=U.Section80IBA;
    if(U.Section80JJA)S.ded.v.c80jja=U.Section80JJA; if(U.Section80JJAA)S.ded.v.c80jjaa=U.Section80JJAA;
    got.push("Chapter VI-A deductions");}

  if(I5.Schedule80G){S.ded.g80=[];const G=I5.Schedule80G;
    [["A","Don100Percent"],["B","Don50PercentNoApprReqd"],["C","Don100PercentApprReqd"],["D","Don50PercentApprReqd"]].forEach(([b,k])=>{
      (g_(G,k+".DoneeDetail")||[]).forEach(r=>{const a=addr(r.AddressDetail);S.ded.g80.push({bucket:b,name:r.DoneeName,addr:a.addr,
        city:a.city,state:a.state,pin:a.pin,pan:r.DoneePAN,arn:r.ArnNbr||"",cash:nz(r.DonationAmtCash),other:nz(r.DonationAmtOtherMode),
        ref:r.TransactionRefNum||"",ifsc:r.IFSCCode||"",amt:r.DonationAmt});});});
    got.push("Schedule 80G");}
  if(I5.Schedule80GGA)S.ded.gga=(I5.Schedule80GGA.DonationDtlsSciRsrchRuralDev||[]).map(r=>{const a=addr(r.AddressDetail);
    return {clause:r.RelevantClauseUndrDedClaimed,name:r.NameOfDonee,addr:a.addr,city:a.city,state:a.state,pin:a.pin,
      pan:r.DoneePAN,cash:nz(r.DonationAmtCash),other:nz(r.DonationAmtOtherMode),amt:r.DonationAmt};});
  if(I5.Schedule80RA)S.ded.ra=(I5.Schedule80RA.DonationDtlsRsrchAssctn||[]).map(r=>{const a=addr(r.AddressDetail);
    return {name:r.NameOfDonee,addr:a.addr,city:a.city,state:a.state,pin:a.pin,pan:r.DoneePAN,cash:nz(r.DonationAmtCash),other:nz(r.DonationAmtOtherMode)};});
  if(I5.Schedule80GGC)S.ded.ggc=(I5.Schedule80GGC.Schedule80GGCDetails||[]).map(r=>({dt:dmy(r.DonationDate),name:r.PoliticalPartyName||"",
    pan:r.PoliticalPartyPAN||"",cash:nz(r.DonationAmtCash),other:nz(r.DonationAmtOtherMode),ref:r.TransactionRefNum||"",ifsc:r.IFSCCode||""}));

  const rdUnd=o=>{const arr=(o&&o.Sch80DeductAmtDtls)||[];return [nz(g_(arr,"0.DeductAmountSec80")),nz(g_(arr,"1.DeductAmountSec80"))];};
  if(I5.Schedule80_IA){const A=I5.Schedule80_IA;S.ded.ia={inf:rdUnd(A.DeductUs80_IA_4_i),pow:rdUnd(A.DeductUs80_IA_4_iv)};}
  if(I5.Schedule80_IB){const B=I5.Schedule80_IB;S.ded.ib={jk:rdUnd(B.DeductJKLocUs80_IB_4_Und),oil:rdUnd(B.DeductMinOilUs80_IB_9_Und),
    hous:rdUnd(B.DeductHousUs80_IB_10_Und),fruit:rdUnd(B.DeductFruitVegUs80_IB_11A_Und),food:rdUnd(B.DeductFoodGrainUs80_IB_11A_Und)};}
  if(I5.Schedule80_IC){const NE=I5.Schedule80_IC.DeductInNorthEast||{};S.ded.ic={};
    DED_IC_CLAUSE.forEach(x=>S.ded.ic[x[0]]=rdUnd(NE[x[1]]));}
  if(I5.Schedule80IAC){const x=I5.Schedule80IAC;S.ded.iac={dt:dmy(x.DateIncrpStrup),nob:x.NatureOfBusiness||"",
    cert:x.InterMnstBoardCertNum||"",fay:x.FstAYDeduction||"",amt:x.AmtDedCurAY};}
  if(I5.Schedule80LA)S.ded.la=(I5.Schedule80LA.Schedule80LADtls||[]).map(r=>({sub:r.SubSecDedClmd||"",ent:r.EntityType||"",
    inc:r.IncmTypeUnt||"",auth:r.RegGNTAuth||"",dt:dmy(r.RegDate),regno:r.RegNumber||"",fay:r.FstAYDeduction||"",amt:r.AmtDedCurAY}));
  if(I5.Schedule80P){const b=I5.Schedule80P;S.ded.p={};
    DED_80P.forEach((x,i)=>{const key=DED_80P_KEY[i];if(b[key]!=null||b[key+"Amt"]!=null)S.ded.p[x[0]]={inc:nz(b[key]),amt:nz(b[key+"Amt"])};});}
  if(I5.Schedule10AA){S.ded.aa=(g_(I5,"Schedule10AA.DeductSEZ.DedUs10Detail.Undertaking.DedFromUndertakingWithAy")||[])
    .map(r=>({ay:r.AssmtYrUnit,amt:r.DedUs10Sub}));got.push("Schedule 10AA");}
  return got;
}

/* ===================================================================
   chkDed — the section's own rules, regime-aware (VI_A.md + per-schedule)
   =================================================================== */
function chkDed(){
  const out=[]; const V=S.C.ded||{out:{}}; const O=V.out||{};
  const add=(lvl,t,m)=>out.push({lvl,t,m,sec:"ded"});
  /* new regime — closed deductions carrying a value */
  if(V.conc){
    const barred=DED_VIA.filter(x=>DED_VIA_NEW.indexOf(x[0])<0)
      .filter(x=>{const k=x[0];return N(O[k])||kv0(k)||(k==="c80g"&&(S.ded.g80||[]).length)||(k==="c80ggc"&&(S.ded.ggc||[]).length)
        ||(k==="c80p"&&Object.keys(S.ded.p||{}).length)||(k==="c80ia"&&V.tot80IA)||(k==="c80ib"&&V.tot80IB)||(k==="c80ie"&&V.tot80IC);})
      .map(x=>x[2].split(" — ")[0]);
    if(barred.length)add("warn","Closed under the new regime","Not allowed under 115BAC(1A)/115BAD/115BAE and set to zero: "+barred.join(", ")+". Only 80JJAA and 80LA(1A) survive.");
    if((S.ded.aa||[]).some(r=>N(r.amt)))add("warn","Schedule 10AA closed","Section 10AA cannot be claimed under the new regime; it is set to zero.");
  }
  /* 80GGA and business income */
  if(!V.conc&&(S.ded.gga||[]).some(r=>N(r.amt))&&N(O.c80gga)===0&&N((S.C.bp||{}).income)>0)
    add("warn","80GGA and business income","80GGA is allowed only to an assessee with no business income (VI-A K6); it computes as zero.");
  /* 80GGC Local Authority / AJP */
  if(!V.conc&&V.barred80ggc&&(S.ded.ggc||[]).some(r=>N(r.cash)||N(r.other)))
    add("warn","80GGC not available","A Local Authority / AJP cannot claim 80GGC; it is set to zero.");
  /* 80GGC party name/PAN */
  if((S.ded.ggc||[]).some(r=>(N(r.cash)||N(r.other))&&(!st0(r.name)||!PAN_RE.test(st0(r.pan).toUpperCase()))))
    add("err","80GGC party details","Name and a valid PAN of the political party are mandatory to claim 80GGC (rule 590).");
  /* 80G cash>2000 informational */
  if((S.ded.g80||[]).some(r=>N(r.cash)>2000))
    add("warn","80G cash over ₹2,000","A donation in cash above ₹2,000 gives no 80G deduction; only the other-mode amount is eligible.");
  /* 80IAC LLP-only */
  if(!V.conc&&N((S.ded.iac||{}).amt)&&!V.isLLP)
    add("err","80-IAC is LLP-only","Deduction u/s 80-IAC can be claimed only by an LLP (rule 652).");
  /* 80LA both sub-sections / forex gate */
  {const la=S.ded.la||[];const has1=la.some(r=>r.sub==="80LA(1)"&&N(r.amt)),has1a=la.some(r=>r.sub==="80LA(1A)"&&N(r.amt));
   if(has1&&has1a)add("err","80LA(1) and 80LA(1A)","Both 80LA(1) and 80LA(1A) cannot be claimed together (rule 663).");
   if(has1a&&!V.fx)add("warn","80LA(1A) needs IFSC forex = Yes","80LA(1A) requires the Part A-General IFSC-convertible-foreign-exchange answer to be Yes (rule 664).");
   if(has1&&V.fx)add("warn","80LA(1) needs IFSC forex = No","80LA(1) requires the IFSC-convertible-foreign-exchange answer to be No (rule 665).");}
  /* 80P eligibility */
  if(N(V.tot80IA||0)+N((V.p80||{}).totalAmt||0)&&Object.keys(S.ded.p||{}).length&&!V.isCoop&&N((V.p80||{}).totalAmt))
    add("err","80P is for co-operative societies","80P can be claimed only by a co-operative society (Primary Agricultural Credit Society / Primary Co-op Agri & Rural Dev bank / other co-op) (rule 653); the deduction is set to zero.");
  /* Chapter VI-A capped at GTI */
  if(V.clipped)add("warn","Deductions capped","The Chapter VI-A total is limited to the gross total income less income taxed at special rates.");
  /* a settled figure */
  if((V.allowed||0)>0)add("ok","Deductions allowed","Chapter VI-A deduction allowed: "+RS(V.allowed)+(V.ded10AA?"; section 10AA: "+RS(V.ded10AA):"")+".");
  return out;
}

reg({id:"ded", t:"Deductions", ref:"Chapter VI-A · 80G/GGA/GGC/RA · 80-IA/IB/IE/IAC/LA · 80P · 10AA", f:secDed,
  s:()=>{const V=S.C.ded||{};return (V.allowed?"Allowed "+CR(V.allowed):(V.conc?"Almost none under the new regime":"Chapter VI-A"))+(V.ded10AA?" · 10AA "+CR(V.ded10AA):"");},
  eng:engDed, exp:expDed, imp:impDed, chk:chkDed, order:50, corder:50});
