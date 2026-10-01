/* =====================================================================
   ITR-7 · Section "vda" — Schedule VDA (Virtual Digital Assets).
   Built ONLY from books/ITR-7/Schedule_VDA.md (block ScheduleVDA),
   books/ITR-7/{enums.json,skeleton.json,section_map.json} and the schema
   sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json (definitions.ScheduleVDA).
   Structural template: forms/ITR-6/src/70_sec_cg.js — its VDA handling
   (engVDA / the Schedule VDA grid / the ScheduleVDA export & import) — but
   every field, number, formula, schema key and enum here is taken from the
   ITR-7 book, never from ITR-6.

   Schema block (section_map → vda):
     ScheduleVDA  (ScheduleVDADtls[]{DateofAcquisition, DateofTransfer,
                   HeadUndIncTaxed, AcquisitionCost, ConsidReceived,
                   IncomeFromVDA}, TotIncBusiness, TotIncCapGain)

   The law — section 115BBH (book §4):
   - Flat 30% tax on income from transfer of any Virtual Digital Asset.
   - Income (Col 7) = Consideration received (Col 6) − Cost of acquisition
     (Col 5) ONLY; no other deduction/allowance, and a LOSS is entered as
     nil (a VDA loss is neither set off against any income nor carried
     forward).  So each row's income = MAX(0, ConsidReceived − AcquisitionCost).
   - Only POSITIVE incomes are summed, split by the Head chosen in Col 4:
       A · TotIncBusiness  = Σ positive income where head = Business Income
       B · TotIncCapGain   = Σ positive income where head = Capital Gain
   - Both totals feed Schedule SI at 30% — the two 115BBH sub-rows
     5BBHi (business) / 5BBHii (capital gain) (SI book §2 rows 90-92, §3).
     Item A also routes to Schedule BP, Item B to the capital-gain line
     (Schedule CG C2). This section only PUBLISHES the scalars; the
     consuming sections read them from S.C.vda.

   Wrapped in an IIFE so no helper leaks into the shared namespace where
   parallel section-builders live.
   ===================================================================== */
(function(){
"use strict";

/* ---- dropdown table (book §6 / schema HeadUndIncTaxed enum, verbatim) ----
   Cells F6:F10 source "(Select),Business Income,Capital Gain"; the schema
   files the enum members "BI"/"CG". */
const HEADVDA=[["BI","Business Income"],["CG","Capital Gain"]];

/* ---- state (S.vda) --------------------------------------------------
   One flat transaction table (book §1: "Details of every transaction are to
   be filled" — reported deal by deal, not netted). */
S.vda = S.vda || { rows:[] };   /* rows: {buy,sale,head,cost,cons} */
SEED["vda.rows"]=SEED["vda.rows"]||{};

/* =====================================================================
   ENGINE — Col 7 income and the two totals (book §2/§3)
   ===================================================================== */
function engVda(){
  const V=S.vda||{};
  const rows=Array.isArray(V.rows)?V.rows:[];
  let bi=0,cg=0,on=false;
  rows.forEach(r=>{
    const inc=Math.max(0,R(N(r.cons)-N(r.cost)));   /* Col 7 = MAX(0, Col6 − Col5) */
    r._={inc};                                       /* for the grid's calc column */
    if(r.head==="BI")bi+=inc; else if(r.head==="CG")cg+=inc;   /* only positive, by head */
    if(st0(r.head)||N(r.cost)||N(r.cons)||st0(r.buy)||st0(r.sale))on=true;
  });
  bi=R(bi); cg=R(cg);
  const total=R(bi+cg);

  /* ---- Schedule-SI feed (book §5 out; SI book §2 rows 90-92, §3) --------
     70_sec_si.js consumes S.C.vda.siFeed keyed by the exact schema SecCode.
     The 115BBH group (row 90 header, no code) has TWO sub-rows in the enum:
       5BBHi  — 115BBH(i)  income under head Business or Profession @30% <- A
       5BBHii — 115BBH(ii) income under head Capital Gain @30%          <- B
     Value = a plain number (income); si.js supplies the 30% rate from its
     own rate table and computes the tax. VDA is not part of any set-off
     matrix, so the incomes are fed directly. */
  const siFeed={};
  if(bi>0)siFeed["5BBHi"]=bi;
  if(cg>0)siFeed["5BBHii"]=cg;

  S.C.vda={on:on, bi:bi, cg:cg, total:total, siFeed:siFeed};
}

/* =====================================================================
   RENDERER
   ===================================================================== */
function calcRow(label,ref,n){return row(label,cell(n),{ref:ref});}

function secVda(){
  const V=S.vda||{};
  const rows=Array.isArray(V.rows)?V.rows:[];
  const G=S.C.vda||{bi:0,cg:0,total:0};
  let h="";
  h+=note("Section 115BBH — income from transfer of a Virtual Digital Asset is taxed at a flat 30%. "+
    "Details of every transaction are to be filled (VDA income is reported deal by deal, not netted). "+
    "Income = consideration received − cost of acquisition ONLY (no other deduction, no set-off); "+
    "a loss is entered as nil and is neither set off against any income nor carried forward. "+
    "For a VDA received as a gift, the cost of acquisition is the amount on which tax was paid u/s 56(2)(x), if any, else the cost to the previous owner.");
  h+=grid("vda.rows",[
      {h:"Date of acquisition",k:"buy",t:"date"},
      {h:"Date of transfer",k:"sale",t:"date"},
      {h:"Head under which income to be taxed",k:"head",t:"sel",opts:HEADVDA},
      {h:"Cost of acquisition (Col 5)",k:"cost",t:"num"},
      {h:"Consideration received (Col 6)",k:"cons",t:"num"},
      {h:"Income — Col 6 − Col 5 (nil if loss)",k:"inc",t:"calc",f:r=>(r._||{}).inc||0}
    ],rows,{empty:"No VDA transfer entered.",add:"Add a transfer",min:"960px"});
  h+=calcRow("A · Total — sum of all positive incomes under Business Income (Col 7)","A · TotIncBusiness",G.bi);
  h+=calcRow("B · Total — sum of all positive incomes under Capital Gain (Col 7)","B · TotIncCapGain",G.cg);
  h+=calcRow("Total income from transfer of VDA (A + B) — taxed at 30% u/s 115BBH","115BBH",G.total);
  return h;
}

/* =====================================================================
   EXPORT — ScheduleVDA (block object built directly: TotIncBusiness /
   TotIncCapGain and the row integers are REQUIRED and may legitimately be
   0, which put() would drop — so the block is assigned, mirroring ITR-6.
   Emitted only when at least one row is complete.)
   ===================================================================== */
function expVda(j){
  const V=S.vda||{};
  const rows=Array.isArray(V.rows)?V.rows:[];
  const G=S.C.vda||{bi:0,cg:0};
  const vr=rows.filter(r=>ISO(r.buy)&&ISO(r.sale)&&(r.head==="BI"||r.head==="CG"));
  if(!vr.length)return;
  j.ScheduleVDA={
    ScheduleVDADtls:vr.map(r=>({
      DateofAcquisition:ISO(r.buy),
      DateofTransfer:ISO(r.sale),
      HeadUndIncTaxed:r.head,
      AcquisitionCost:n0(r.cost),
      ConsidReceived:n0(r.cons),
      IncomeFromVDA:n0(Math.max(0,N(r.cons)-N(r.cost)))
    })),
    TotIncBusiness:n0(G.bi),
    TotIncCapGain:n0(G.cg)
  };
}

/* =====================================================================
   IMPORT — inverse of export (schema → S.vda)
   ===================================================================== */
function impVda(I){
  const b=I&&I.ScheduleVDA;
  if(!b)return [];
  S.vda=S.vda||{rows:[]};
  S.vda.rows=(b.ScheduleVDADtls||[]).map(x=>({
    buy:dmy(x.DateofAcquisition),
    sale:dmy(x.DateofTransfer),
    head:x.HeadUndIncTaxed,
    cost:nz(x.AcquisitionCost),
    cons:nz(x.ConsidReceived)}));
  return ["Schedule VDA"];
}

/* =====================================================================
   CHECKS — the section's own screen validations (not the department rules)
   ===================================================================== */
function chkVda(){
  const out=[];
  const G=S.C.vda; if(!G)return out;
  const V=S.vda||{};
  const rows=Array.isArray(V.rows)?V.rows:[];
  rows.forEach((r,i)=>{
    const dA=D(r.buy), dS=D(r.sale);
    /* dates cannot be after 31 March of the financial year */
    if((dS&&dS>YREND)||(dA&&dA>YREND))out.push({lvl:"err",t:"Schedule VDA row "+(i+1),
      m:"Date of acquisition/transfer cannot be after 31 March of the financial year.",sec:"vda"});
    /* transfer before acquisition */
    if(dA&&dS&&dS<dA)out.push({lvl:"warn",t:"Schedule VDA row "+(i+1),
      m:"Date of transfer is before the date of acquisition.",sec:"vda"});
    /* amounts entered but no head chosen (Col 4 routes the income) */
    if((N(r.cost)||N(r.cons))&&!(r.head==="BI"||r.head==="CG"))out.push({lvl:"err",t:"Schedule VDA row "+(i+1),
      m:"Choose the head (Business Income or Capital Gain) under which this VDA income is to be taxed.",sec:"vda"});
    /* a loss row — income is entered as nil (reminder of the 115BBH rule) */
    if((r.head==="BI"||r.head==="CG")&&R(N(r.cons)-N(r.cost))<0)out.push({lvl:"warn",t:"Schedule VDA row "+(i+1),
      m:"Consideration is below cost — the loss is entered as nil (a VDA loss is neither set off nor carried forward).",sec:"vda"});
  });
  if(G.total)out.push({lvl:"ok",t:"Virtual digital assets",
    m:"Income from transfer of VDA = "+RS(G.total)+" (Business "+RS(G.bi)+" + Capital Gain "+RS(G.cg)+"), taxed at 30% u/s 115BBH.",sec:"vda"});
  return out;
}

reg({id:"vda", t:"Virtual digital assets", ref:"Schedule VDA",
  f:secVda, s:()=>(S.C.vda&&S.C.vda.total)?RS(S.C.vda.total):((S.C.vda&&S.C.vda.on)?"Reporting":"None"),
  eng:engVda, exp:expVda, imp:impVda, chk:chkVda, order:60, corder:46});

})();
