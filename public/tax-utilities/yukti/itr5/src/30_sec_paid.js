/* =====================================================================
   ITR-5 · A.Y. 2026-27 — Section "paid" · Taxes paid other than via the return
   Books: books/ITR-5/TDS.md (sheet "Schedule TDS 1" 15B1 → block ScheduleTDS2
   [TAN, Form 16A]; sheet "Schedule TDS 2" 15B2 → block ScheduleTDS3 [buyer/
   tenant PAN or Aadhaar, Form 16B/16C/16D/16E]; "SCHEDULE TCS" 15C → block
   ScheduleTCS [collector TAN, Form 27D]) and books/ITR-5/IT.md (Schedule IT
   18A → block ScheduleIT, advance / self-assessment challans).

   THE OFF-BY-ONE (books/ITR-5/TDS.md): the sheet's visible labels are one
   ahead of the schema block names — sheet "Schedule TDS 1" is schema
   ScheduleTDS2, sheet "Schedule TDS 2" is schema ScheduleTDS3. ITR-5 has NO
   salary-TDS block (no ScheduleTDS1 / Form 16) — a firm/LLP/AOP/BOI has no
   salary income. The legacy hidden TCS-on-income table (rows 54-63) and the IT
   quarter-breakup helper region (cols Q-AA, rows 1-11) are NOT built.

   S.C.paid.income = 0 : taxes paid are credits against the liability, they add
   nothing to Gross Total Income, so this head contributes 0.

   S.C.paid publishes for the tax section (Part B-TTI 10a-10d, 234B/234C):
     .adv  → 10a Advance tax        .tds → 10b TDS (ScheduleTDS2 + ScheduleTDS3)
     .tcs  → 10c TCS                .sat → 10d Self-assessment tax
   plus .t2/.t3 (per-block TDS totals), .itTotal, .paid, .challans (dated, for
   the 234C instalment placement).
   ===================================================================== */

/* ---- state (namespace S.paid; repeatable arrays seeded []) ---- */
/* tds2 = schema ScheduleTDS2 (sheet "Schedule TDS 1", TAN)
   tds3 = schema ScheduleTDS3 (sheet "Schedule TDS 2", buyer/tenant PAN)
   tcs  = schema ScheduleTCS   it = schema ScheduleIT */
S.paid = S.paid || { tds2:[], tds3:[], tcs:[], it:[] };

/* default grid rows (the shell's add-handler also carries these by suffix) */
SEED["paid.tds2"] = SEED["paid.tds2"] || { who:"S", sec:"94A" };
SEED["paid.tds3"] = SEED["paid.tds3"] || { who:"S", sec:"4IA" };
SEED["paid.tcs"]  = SEED["paid.tcs"]  || { who:"S" };

/* ---- code tables, verbatim from books/ITR-5/enums.json ---- */
/* ScheduleTDS2/ScheduleTDS3 .TDSSection — 56 codes (schema enum, no "(Select)")
   from books/ITR-5/enums.json (identical list for both blocks). */
const TDSSEC_PAID=[["193","193- Interest on Securities"],["194","194- Dividends"],["94A","194A- Interest other than 'Interest on securities'"],["94B","194B- Winning from lottery or crossword puzzle"],["94BA","194BA- Winnings from online games"],["4BB","194BB- Winning from horse race"],["94C","194C- Payments to contractors and sub-contractors"],["94D","194D- Insurance commission"],["4DA","194DA- Payment in respect of life insurance policy"],["94E","194E- Payments to non-resident sportsmen or sports associations"],["4EE","194EE- Payments in respect of deposits under National Savings"],["4F","194F- Payments on account of repurchase of units by Mutual Fund or UTI"],["4G","194G- Commission, price, etc. on sale of lottery tickets"],["4H","194H- Commission or brokerage"],["4-IA","194I(a)- Rent on hiring of plant and machinery"],["4-IB","194I(b)- Rent on other than plant and machinery"],["4IA","194IA- TDS on Sale of immovable property"],["4IB","194IB- Payment of rent by certain individuals or HUF"],["4IC","194IC- Payment under specified agreement"],["94J-A","194J(a)- Fees for technical services"],["94J-B","194J(b)- Fees for professional services or royalty etc"],["94K","194K- Income on units of a specified mutual fund / UTI"],["4LA","194LA- Compensation on acquisition of certain immovable property"],["4LB","194LB- Interest from Infrastructure Debt fund"],["4LC1","194LC (2)(i) and (ia)"],["4LC2","194LC (2)(ib)"],["4LC3","194LC (2)(ic)"],["4BA1","194LBA(a)- interest from a business trust (resident)"],["4BA2","194LBA(b)- dividend from a business trust (resident)"],["LBA1","194LBA(a)- 10(23FC)(a) from a business trust (NR)"],["LBA2","194LBA(b)- 10(23FC)(b) from a business trust (NR)"],["LBA3","194LBA(c)- 10(23FCA) from a business trust (NR)"],["LBB","194LBB- Income in respect of units of investment fund"],["94R","194R- Benefits or perquisites of business or profession"],["94S","194S- Transfer of virtual digital asset"],["94B-P","Proviso to 194B- winnings in kind"],["94R-P","First Proviso to 194R(1)- benefit in kind"],["94S-P","Proviso to 194S(1)- VDA in kind"],["LBC","194LBC- Investment in securitization trust"],["4LD","194LD- Interest on bonds / government securities"],["94M","194M- Certain sums by certain individuals or HUF"],["94N","194N- Cash withdrawals (general)"],["94N-F","194N- First Proviso (non-filers)"],["94N-C","194N- Third Proviso (co-operative societies)"],["94N-FT","194N- First read with Third Proviso"],["94O","194O- E-commerce operator to participant"],["94P","194P- Specified senior citizen"],["94Q","194Q- Purchase of goods"],["195","195- Other sums payable to a non-resident"],["96A","196A- Units of non-residents"],["96B","196B- Units to an offshore fund"],["96C","196C- Foreign currency bonds or shares of Indian company"],["96D","196D- FII income from securities"],["96DA","196D(1A)- Specified fund from securities"],["94BA-P","194BA(2)- online-game net winnings in kind"],["94T","194T- Payments to partners of firms"]];
const TDSSEC_CODES=TDSSEC_PAID.map(x=>x[0]);
/* Financial-year dropdowns — TDS 2 / TDS 3 / TCS: 2024-25 … 2008-09
   (schema DeductedYr enum stores start year 2008..2024). One list serves all. */
const DEDYR_PAID=["2024","2023","2022","2021","2020","2019","2018","2017","2016","2015","2014","2013","2012","2011","2010","2009","2008"];
/* Head of income — ScheduleTDS2 (sheet TDS 1) has NA (194N); ScheduleTDS3 drops NA */
const TDS2_HEADS=[["HP","House property"],["BP","Business & profession"],["CG","Capital gains"],["OS","Other sources"],["EI","Exempt income"],["NA","Not applicable (194N)"]];
const TDS3_HEADS=TDS2_HEADS.slice(0,5);
/* head-of-income pre-fill from the section code (sheet note C3: "head of income
   has been pre-filled based on TDS section"); editable, not a tax figure */
const TDS_HEAD_OF5={"4-IA":"HP","4-IB":"HP","4IA":"HP","4IB":"HP","4IC":"HP",
  "4LA":"CG","94S":"CG","94S-P":"CG",
  "193":"OS","194":"OS","94A":"OS","94B":"OS","94BA":"OS","4BB":"OS","94B-P":"OS","94BA-P":"OS",
  "4DA":"OS","4EE":"OS","94K":"OS","4LB":"OS","4LD":"OS","4BA1":"OS","4BA2":"OS","LBA1":"OS",
  "LBA2":"OS","LBA3":"OS","LBB":"OS","LBC":"OS","96A":"OS","96B":"OS","96C":"OS","96D":"OS","96DA":"OS",
  "94C":"BP","94D":"BP","4F":"OS","4G":"OS","4H":"BP","94J-A":"BP","94J-B":"BP","94M":"BP","94O":"BP",
  "94Q":"BP","94R":"BP","94R-P":"BP","94T":"BP","94E":"OS","195":"OS"};

/* ---- engine ------------------------------------------------------- */
function engPaid(){
  const P={income:0};

  /* ScheduleTDS2 (sheet "Schedule TDS 1") / ScheduleTDS3 (sheet "Schedule TDS 2")
     — per-row TDS credit carried forward (col 13), same shape for both blocks:
       ScheduleTDS2 W9 =MAX(0, L9 [b/f]  + M9 [ded own]  + O9 [ded oth-TDS]
                               − P9 [claim own] − R9 [claim oth-TDS])
       ScheduleTDS3 X23=MAX(0, M23[b/f]  + N23[ded own]  + P23[ded oth-TDS]
                               − Q23[claim own]− S23[claim oth-TDS])
     (books/ITR-5/TDS.md rule A857: col13 = col6 + col7 + col8 − col9 − col10.) */
  const rowCF=rows=>(rows||[]).forEach(r=>{
    const avail=N(r.bf)+N(r.dedOwn)+N(r.dedOthTds);
    const claimed=N(r.claimOwn)+N(r.claimOthTds);
    r._avail=avail; r._claimed=claimed; r._cf=Math.max(0,avail-claimed); r._over=claimed>avail;});
  rowCF(S.paid.tds2); rowCF(S.paid.tds3);
  const t2=(S.paid.tds2||[]).reduce((a,r)=>a+N(r.claimOwn),0); /* P14=SUM(claimed own hands) → TotalTDSonOthThanSals */
  const t3=(S.paid.tds3||[]).reduce((a,r)=>a+N(r.claimOwn),0); /* Q28=SUM(claimed own hands) → TotalTDS3OnOthThanSal */

  /* ScheduleTCS (sheet "SCHEDULE TCS" 15C) — per-row carried forward (col 8):
       P37=MAX(0, J37 [b/f] + K37 [coll own] + L37 [coll oth]
                  − M37 [claim own] − N37 [claim oth-TCS])
     (books/ITR-5/TDS.md rule A866: col8 = col5 + col6 − col7.) */
  (S.paid.tcs||[]).forEach(r=>{
    const avail=N(r.bf)+N(r.collOwn)+N(r.collOth);
    const claimed=N(r.claimOwn)+N(r.claimOth);
    r._avail=avail; r._claimed=claimed; r._cf=Math.max(0,avail-claimed); r._over=claimed>avail;});
  const tcs=(S.paid.tcs||[]).reduce((a,r)=>a+N(r.claimOwn),0); /* M41=SUM(claimed own hands, col 7i) → TotalSchTCS */

  /* ScheduleIT (18A) — advance vs self-assessment split by deposit date.
     Sheet helper T18=IF(Q18>2026,2,IF(Q18>=2026,IF(S18>=4,2,1),1)): a challan
     on or before 31 Mar 2026 (YREND) is advance tax [T15=SUMIF(<2,Amt)]; one on
     or after 1 Apr 2026 is self-assessment tax [T16=SUMIF(>=2,Amt)].
     Advance total → Part B-TTI 10a; self-assessment total → 10d.
     H24=SUM(IT.Amt) = TotalTaxPayments (BSR-gated on export). */
  const isSAT=c=>{const d=D(c.dt);return d?d>YREND:false;};
  const challans=(S.paid.it||[]).map(c=>({amt:R(N(c.amt)),dt:c.dt,sat:isSAT(c),valid:!!D(c.dt)}));
  const adv=challans.filter(c=>!c.sat).reduce((a,c)=>a+c.amt,0); /* T15 → 10a */
  const sat=challans.filter(c=> c.sat).reduce((a,c)=>a+c.amt,0); /* T16 → 10d */

  P.t2=R(t2); P.t3=R(t3);
  P.tds=R(t2+t3);                    /* 10b = ScheduleTDS2 col9 + ScheduleTDS3 col9 */
  P.tcs=R(tcs);                      /* 10c = ScheduleTCS col 7(i) */
  P.adv=R(adv); P.sat=R(sat); P.itTotal=R(adv+sat); /* TotalTaxPayments = H24 */
  P.paid=R(adv+t2+t3+tcs+sat);       /* 10e Total taxes paid (rules.json n=831) */
  P.challans=challans;               /* for the tax section's 234C instalment placement */
  P.income=0;                        /* taxes paid contribute nothing to GTI */
  S.C.paid=P;
}

/* ---- renderer ----------------------------------------------------- */
function secPaid(){
  const P=S.C.paid||{}; let h="";
  h+=formNote("Check every figure against <b>Form 26AS</b> and the annual information statement (AIS/TIS). Where possible the head of income is pre-filled from the section — please verify it. ITR-5 has no salary-TDS table.");

  /* the 13-column credit body shared by ScheduleTDS2 (deductor by TAN) and
     ScheduleTDS3 (buyer/tenant/deductor by PAN or Aadhaar) */
  const tdsCols=buyer=>[
    {k:"who",h:"TDS credit relating to",t:"sel",w:"120px",req:1,opts:[["S","Self"],["O","Other person"]]},
    {k:"othPan",h:"PAN of other person",t:"txt",w:"120px",max:10},
    {k:"othAadh",h:"Aadhaar of other person",t:"txt",w:"130px",max:12},
    buyer?{k:"pan",h:"PAN of the buyer / tenant / deductor",t:"txt",w:"140px",max:10,req:1}
         :{k:"tan",h:"TAN of the deductor",t:"txt",w:"130px",max:10,req:1},
    ...(buyer?[{k:"aadh",h:"Aadhaar of buyer / tenant / deductor",t:"txt",w:"140px",max:12}]:[]),
    {k:"sec",h:"Section",t:"sel",w:"110px",req:1,opts:TDSSEC_PAID.map(x=>[x[0],x[0]])},
    {k:"yr",h:"FY in which TDS deducted",t:"sel",w:"110px",opts:DEDYR_PAID.map(y=>[y,y+"-"+String((+y+1)%100).padStart(2,"0")])},
    {k:"bf",h:"Unclaimed TDS b/f",t:"num",w:"110px"},
    {k:"dedOwn",h:"Deducted this FY — own hands",t:"num",w:"130px"},
    {k:"dedOthInc",h:"Deducted in other's hands — income",t:"num",w:"140px"},
    {k:"dedOthTds",h:"— TDS",t:"num",w:"100px"},
    {k:"claimOwn",h:"Claimed this year — own hands",t:"num",w:"130px",req:1},
    {k:"claimOthInc",h:"Claimed in other's hands — income",t:"num",w:"140px"},
    {k:"claimOthTds",h:"— TDS",t:"num",w:"100px"},
    {k:"claimOthPan",h:"— PAN",t:"txt",w:"110px",max:10},
    {k:"claimOthAadh",h:"— Aadhaar",t:"txt",w:"120px",max:12},
    {k:"gross",h:"Corresponding gross amount offered",t:"num",w:"140px"},
    {k:"head",h:"Head of income",t:"sel",w:"130px",opts:buyer?TDS3_HEADS:TDS2_HEADS},
    {k:"cf",h:"TDS credit carried forward",t:"calc",w:"130px",f:r=>r._cf||0}];

  /* ScheduleTDS2 · sheet "Schedule TDS 1" 15B1 — TAN-based (Form 16A).
     18 columns; claimOwn is the 11th; total under it feeds 10b. */
  h+='<div class="cgband">Schedule TDS 1 · 15B1 (schema ScheduleTDS2) — TDS on income other than salary, as per Form 16A (deductor by TAN)</div>';
  h+=note("Carried forward = MAX(0, b/f + deducted − claimed). Credit may be claimed only where the corresponding income is offered this year under the head named. Credit in another person’s hands is any other person under rule 37BA(2).");
  h+=grid("paid.tds2",tdsCols(false),S.paid.tds2||[],{min:"2500px",empty:"No other-than-salary TDS.",add:"Add a deduction",
    foot:[{l:1,v:"Claimed in own hands — to 10b of Part B-TTI",span:10},{v:P.t2},{v:""},{v:""},{v:""},{v:""},{v:""},{v:""}]});
  (S.paid.tds2||[]).forEach((r,i)=>{if(r._over)h+=note("Schedule TDS 1 row "+(i+1)+": claimed "+RS(r._claimed)+" exceeds the "+RS(r._avail)+" deducted and brought forward.","stop");});

  /* ScheduleTDS3 · sheet "Schedule TDS 2" 15B2 — buyer/tenant PAN (Form 16B/16C/16D/16E).
     19 columns (buyer PAN + Aadhaar); claimOwn is the 12th. */
  h+='<div class="cgband">Schedule TDS 2 · 15B2 (schema ScheduleTDS3) — TDS on income, as per Form 16B / 16C / 16D / 16E (buyer/tenant by PAN)</div>';
  h+=note("The deductor here is a <b>buyer, tenant or payer identified by PAN or Aadhaar</b> (194IA sale, 194IB rent, 194M, 194S), not a TAN.");
  h+=grid("paid.tds3",tdsCols(true),S.paid.tds3||[],{min:"2650px",empty:"Nothing under these sections.",add:"Add a deduction",
    foot:[{l:1,v:"Claimed in own hands — to 10b of Part B-TTI",span:11},{v:P.t3},{v:""},{v:""},{v:""},{v:""},{v:""},{v:""}]});
  (S.paid.tds3||[]).forEach((r,i)=>{if(r._over)h+=note("Schedule TDS 2 row "+(i+1)+": claimed "+RS(r._claimed)+" exceeds the "+RS(r._avail)+" deducted and brought forward.","stop");});

  /* ScheduleTCS · 15C — collector by TAN (Form 27D).
     11 columns; claimOwn is the 8th (col 7i); total feeds 10c. */
  h+='<div class="cgband">Schedule TCS · 15C (schema ScheduleTCS) — Tax collected at source, as per Form 27D (collector by TAN)</div>';
  h+=note("Carried forward = MAX(0, b/f + collected − claimed). Credit in another person’s hands is any other person under rule 37-I(1).");
  h+=grid("paid.tcs",[
    {k:"who",h:"TCS credit relating to",t:"sel",w:"120px",req:1,opts:[["S","Self"],["O","Other person"]]},
    {k:"tan",h:"TAN of the collector",t:"txt",w:"130px",max:10,req:1},
    {k:"othPan",h:"PAN of other person",t:"txt",w:"120px",max:10},
    {k:"yr",h:"FY in which TCS collected",t:"sel",w:"110px",opts:DEDYR_PAID.map(y=>[y,y+"-"+String((+y+1)%100).padStart(2,"0")])},
    {k:"bf",h:"Unclaimed TCS b/f",t:"num",w:"110px"},
    {k:"collOwn",h:"Collected this FY — own hands",t:"num",w:"130px",req:1},
    {k:"collOth",h:"Collected in other's hands",t:"num",w:"130px"},
    {k:"claimOwn",h:"Claimed this year — own hands",t:"num",w:"130px",req:1},
    {k:"claimOth",h:"Claimed in other's hands — TCS",t:"num",w:"130px"},
    {k:"claimOthPan",h:"— PAN of other person",t:"txt",w:"120px",max:10},
    {k:"cf",h:"Carried forward",t:"calc",w:"110px",f:r=>r._cf||0}],
    S.paid.tcs||[],{min:"1550px",empty:"Nothing collected.",add:"Add a collection",
      foot:[{l:1,v:"Claimed in own hands (7i) — to 10c of Part B-TTI",span:7},{v:P.tcs},{v:""},{v:""},{v:""}]});
  (S.paid.tcs||[]).forEach((r,i)=>{if(r._over)h+=note("Schedule TCS row "+(i+1)+": claimed "+RS(r._claimed)+" exceeds the "+RS(r._avail)+" collected and brought forward.","stop");});

  /* ScheduleIT · 18A — challans; advance/self-assessment split by date */
  h+='<div class="cgband">Schedule IT · 18A (schema ScheduleIT) — Advance tax and self-assessment tax</div>';
  h+=note("A challan dated <b>on or before 31 March 2026</b> is advance tax (→ 10a of Part B-TTI); one dated <b>on or after 1 April 2026</b> is self-assessment tax (→ 10d). The date also places each advance challan in its 234C instalment. There is no dropdown — the split is by date. <b>The BSR code must be filled for the challan to count.</b>");
  h+=grid("paid.it",[
    {k:"bsr",h:"BSR code",t:"txt",w:"130px",max:7,req:1},
    {k:"dt",h:"Date of deposit",t:"date",w:"150px",req:1},
    {k:"sn",h:"Serial number of challan",t:"txt",w:"180px",max:5,req:1},
    {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],
    S.paid.it||[],{min:"760px",empty:"No challan.",add:"Add a challan",
      foot:[{l:1,v:"Advance tax "+F(P.adv)+"  ·  self-assessment tax "+F(P.sat),span:3},{v:P.itTotal}]});

  /* summary — the four Part B-TTI feeds */
  h+=row("10a · Advance tax — challans on or before 31 Mar 2026",cell(P.adv));
  h+=row("10b · TDS — Schedule TDS 1 col 9 + Schedule TDS 2 col 9",cell(P.tds));
  h+=row("10c · TCS — Schedule TCS col 7(i)",cell(P.tcs));
  h+=row("10d · Self-assessment tax — challans on or after 1 Apr 2026",cell(P.sat));
  h+=row("Total taxes paid",cell(P.paid),{cls:"grand"});
  return h;
}

/* ---- export (all four blocks via put) ----------------------------- */
function expPaid(j){
  const P=S.C.paid||{};

  /* the shared ScheduleTDS2 / ScheduleTDS3 credit row */
  const tdsRow=(r,buyer)=>{
    const o={TDSCreditName:r.who==="O"?"O":"S"};
    if(r.who==="O"){
      if(PAN_RE.test(st0(r.othPan).toUpperCase()))o.PANofOtherPerson=st0(r.othPan).toUpperCase();
      if(AADH.test(st0(r.othAadh)))o.AadhaarOfOtherPerson=st0(r.othAadh);}
    if(buyer){
      o.PANOfBuyerTenant=PAN_RE.test(st0(r.pan).toUpperCase())?st0(r.pan).toUpperCase():"AAAAA0000A";
      if(AADH.test(st0(r.aadh)))o.AadhaarOfBuyerTenant=st0(r.aadh);}
    else o.TANOfDeductor=st0(r.tan).toUpperCase();
    o.TDSSection=TDSSEC_CODES.indexOf(st0(r.sec))>=0?st0(r.sec):"94A";
    if(N(r.bf)&&DEDYR_PAID.indexOf(st0(r.yr))>=0){o.DeductedYr=parseInt(r.yr,10);o.BroughtFwdTDSAmt=n0(r.bf);}
    const c={TaxClaimedOwnHands:n0(r.claimOwn)};
    if(N(r.dedOwn))c.TaxDeductedOwnHands=n0(r.dedOwn);
    if(N(r.dedOthInc))c.TaxDeductedIncome=n0(r.dedOthInc);
    if(N(r.dedOthTds))c.TaxDeductedTDS=n0(r.dedOthTds);
    if(N(r.claimOthInc))c.TaxClaimedIncome=n0(r.claimOthInc);
    if(N(r.claimOthTds))c.TaxClaimedTDS=n0(r.claimOthTds);
    if(PAN_RE.test(st0(r.claimOthPan).toUpperCase()))c.TaxClaimedSpouseOthPrsnPAN=st0(r.claimOthPan).toUpperCase();
    if(AADH.test(st0(r.claimOthAadh)))c.SpouseOthPrsnAadhaar=st0(r.claimOthAadh);
    o.TaxDeductCreditDtls=c;
    if(N(r.gross))o.GrossAmount=n0(r.gross);
    const heads=buyer?TDS3_HEADS:TDS2_HEADS;
    let hd=st0(r.head)||TDS_HEAD_OF5[r.sec]||(buyer?"OS":"NA");
    if(!heads.some(x=>x[0]===hd))hd=buyer?"OS":"NA";
    o.HeadOfIncome=hd;
    o.AmtCarriedFwd=n0(r._cf||0);
    return o;};

  /* ScheduleTDS2 (sheet "Schedule TDS 1") — TotalTDSonOthThanSals present even at 0 */
  const t2=(S.paid.tds2||[]).filter(r=>(N(r.claimOwn)||N(r.dedOwn)||N(r.bf))&&TAN_RE.test(st0(r.tan).toUpperCase()));
  put(j,"ScheduleTDS2.TotalTDSonOthThanSals",n0(P.t2));
  if(t2.length)put(j,"ScheduleTDS2.TDSOthThanSalaryDtls",t2.map(r=>tdsRow(r,false)));

  /* ScheduleTDS3 (sheet "Schedule TDS 2") — TotalTDS3OnOthThanSal present even at 0 */
  const t3=(S.paid.tds3||[]).filter(r=>N(r.claimOwn)||N(r.dedOwn)||N(r.bf));
  put(j,"ScheduleTDS3.TotalTDS3OnOthThanSal",n0(P.t3));
  if(t3.length)put(j,"ScheduleTDS3.TDS3onOthThanSalDtls",t3.map(r=>tdsRow(r,true)));

  /* ScheduleTCS — ITR-5 schema: identity nested under EmployerOrDeductorOrCollectDetl,
     current-FY under TCSCurrFYDtls, claimed under TCSClaimedThisYearDtls; b/f key is
     BroughtFwdTCSAmt. TotalSchTCS present even at 0. */
  const tc=(S.paid.tcs||[]).filter(r=>(N(r.claimOwn)||N(r.collOwn)||N(r.bf))&&TAN_RE.test(st0(r.tan).toUpperCase()));
  put(j,"ScheduleTCS.TotalSchTCS",n0(P.tcs));
  if(tc.length)put(j,"ScheduleTCS.TCSDetails",tc.map(r=>{
    const det={TCSCreditName:r.who==="O"?"O":"S",TAN:st0(r.tan).toUpperCase()};
    if(r.who==="O"&&PAN_RE.test(st0(r.othPan).toUpperCase()))det.PANofOtherPerson=st0(r.othPan).toUpperCase();
    const o={EmployerOrDeductorOrCollectDetl:det};
    if(N(r.bf)&&DEDYR_PAID.indexOf(st0(r.yr))>=0){o.DeductedYr=parseInt(r.yr,10);o.BroughtFwdTCSAmt=n0(r.bf);}
    o.TCSCurrFYDtls={TCSAmtCollOwnHands:n0(r.collOwn),TCSAmtCollOthrHands:n0(r.collOth)};
    const cl={TCSAmtCollOwnHands:n0(r.claimOwn)};
    if(N(r.claimOth)||PAN_RE.test(st0(r.claimOthPan).toUpperCase())){
      const oth={};
      if(N(r.claimOth))oth.TaxClaimedTCS=n0(r.claimOth);
      if(PAN_RE.test(st0(r.claimOthPan).toUpperCase()))oth.PANOfOthrPrsn=st0(r.claimOthPan).toUpperCase();
      cl.TCSAmtCollOthrHands=oth;}
    o.TCSClaimedThisYearDtls=cl;
    o.AmtCarriedFwd=n0(r._cf||0);
    return o;}));

  /* ScheduleIT — TotalTaxPayments present even at 0; DateDep as YYYY-MM-DD;
     emit only BSR-gated rows (sheet [E16] gate + n=843). */
  const ch=(S.paid.it||[]).filter(c=>N(c.amt)&&BSR.test(st0(c.bsr).toUpperCase())&&ISO(c.dt)&&/^\d{1,5}$/.test(st0(c.sn)));
  put(j,"ScheduleIT.TotalTaxPayments",n0(P.itTotal));
  if(ch.length)put(j,"ScheduleIT.TaxPayment",ch.map(c=>({BSRCode:st0(c.bsr).toUpperCase(),
    DateDep:ISO(c.dt),SrlNoOfChaln:parseInt(c.sn,10),Amt:n0(c.amt)})));
}

/* ---- import (inverse) --------------------------------------------- */
function impPaid(I5){
  const read=[]; const g=(o,p)=>p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);
  const back=(r,buyer)=>{const c=r.TaxDeductCreditDtls||{};return {
    who:r.TDSCreditName||"S",othPan:r.PANofOtherPerson||"",othAadh:r.AadhaarOfOtherPerson||"",
    tan:r.TANOfDeductor||"",pan:r.PANOfBuyerTenant||"",aadh:r.AadhaarOfBuyerTenant||"",
    sec:r.TDSSection||"",yr:nz(r.DeductedYr)+"",bf:nz(r.BroughtFwdTDSAmt),
    dedOwn:nz(c.TaxDeductedOwnHands),dedOthInc:nz(c.TaxDeductedIncome),dedOthTds:nz(c.TaxDeductedTDS),
    claimOwn:nz(c.TaxClaimedOwnHands),claimOthInc:nz(c.TaxClaimedIncome),claimOthTds:nz(c.TaxClaimedTDS),
    claimOthPan:c.TaxClaimedSpouseOthPrsnPAN||"",claimOthAadh:c.SpouseOthPrsnAadhaar||"",
    gross:nz(r.GrossAmount),head:r.HeadOfIncome||""};};
  if(I5.ScheduleTDS2){S.paid.tds2=(I5.ScheduleTDS2.TDSOthThanSalaryDtls||[]).map(r=>back(r,false));read.push("Schedule TDS 1 (other than salary, TAN)");}
  if(I5.ScheduleTDS3){S.paid.tds3=(I5.ScheduleTDS3.TDS3onOthThanSalDtls||[]).map(r=>back(r,true));read.push("Schedule TDS 2 (16B/16C/16D/16E)");}
  if(I5.ScheduleTCS){S.paid.tcs=(I5.ScheduleTCS.TCSDetails||[]).map(r=>({
    who:g(r,"EmployerOrDeductorOrCollectDetl.TCSCreditName")||"S",
    tan:g(r,"EmployerOrDeductorOrCollectDetl.TAN")||"",
    othPan:g(r,"EmployerOrDeductorOrCollectDetl.PANofOtherPerson")||"",
    yr:nz(r.DeductedYr)+"",bf:nz(r.BroughtFwdTCSAmt),
    collOwn:nz(g(r,"TCSCurrFYDtls.TCSAmtCollOwnHands")),collOth:nz(g(r,"TCSCurrFYDtls.TCSAmtCollOthrHands")),
    claimOwn:nz(g(r,"TCSClaimedThisYearDtls.TCSAmtCollOwnHands")),
    claimOth:nz(g(r,"TCSClaimedThisYearDtls.TCSAmtCollOthrHands.TaxClaimedTCS")),
    claimOthPan:g(r,"TCSClaimedThisYearDtls.TCSAmtCollOthrHands.PANOfOthrPrsn")||""}));
    read.push("Schedule TCS");}
  if(I5.ScheduleIT){S.paid.it=(I5.ScheduleIT.TaxPayment||[]).map(c=>({
    bsr:c.BSRCode||"",dt:dmy(c.DateDep),sn:c.SrlNoOfChaln!=null?String(c.SrlNoOfChaln):"",amt:nz(c.Amt)}));
    read.push("advance / self-assessment tax");}
  return read;
}

/* ---- checks ------------------------------------------------------- */
function chkPaid(){
  const out=[]; engPaid(); /* ensure row helpers set even if called stand-alone */
  /* A847 — year of deduction required if b/f is claimed (TDS 1 / TDS 2 / TCS) */
  const needYr=(rows,lbl)=>(rows||[]).forEach((r,i)=>{
    if(N(r.bf)>0 && DEDYR_PAID.indexOf(st0(r.yr))<0)
      out.push({lvl:"err",t:lbl+" row "+(i+1),m:"Unclaimed TDS brought forward is claimed but the financial year of deduction is not given.",sec:"paid"});});
  needYr(S.paid.tds2,"Schedule TDS 1"); needYr(S.paid.tds3,"Schedule TDS 2");
  /* A855/A856 — if credit relates to another person, that person's PAN/Aadhaar is required */
  const needOth=(rows,lbl)=>(rows||[]).forEach((r,i)=>{
    if(st0(r.who)==="O" && !(PAN_RE.test(st0(r.othPan).toUpperCase())||AADH.test(st0(r.othAadh))))
      out.push({lvl:"err",t:lbl+" row "+(i+1),m:"Credit relates to another person — give that person’s PAN or Aadhaar.",sec:"paid"});});
  needOth(S.paid.tds2,"Schedule TDS 1"); needOth(S.paid.tds3,"Schedule TDS 2");
  /* A858/A859 — TDS credit-relating dropdown and TAN/PAN of deductor mandatory */
  (S.paid.tds2||[]).forEach((r,i)=>{if((N(r.claimOwn)||N(r.dedOwn)||N(r.bf))&&!TAN_RE.test(st0(r.tan).toUpperCase()))
    out.push({lvl:"err",t:"Schedule TDS 1 row "+(i+1),m:"TAN of the deductor is required and must be 10 characters.",sec:"paid"});});
  (S.paid.tds3||[]).forEach((r,i)=>{if((N(r.claimOwn)||N(r.dedOwn)||N(r.bf))&&!PAN_RE.test(st0(r.pan).toUpperCase()))
    out.push({lvl:"err",t:"Schedule TDS 2 row "+(i+1),m:"PAN of the buyer / tenant / deductor is required.",sec:"paid"});});
  /* A853/A854 — if TDS is claimed, gross amount + head of income mandatory (except 194N in TDS 1) */
  const is194N=s=>["94N","94N-F","94N-C","94N-FT"].indexOf(st0(s))>=0;
  (S.paid.tds2||[]).forEach((r,i)=>{if(N(r.claimOwn)&&!is194N(r.sec)){
    if(!N(r.gross))out.push({lvl:"warn",t:"Schedule TDS 1 row "+(i+1),m:"TDS is claimed but the corresponding gross amount offered is not given.",sec:"paid"});}});
  (S.paid.tds3||[]).forEach((r,i)=>{if(N(r.claimOwn)&&!N(r.gross))
    out.push({lvl:"warn",t:"Schedule TDS 2 row "+(i+1),m:"TDS is claimed but the corresponding gross amount offered is not given.",sec:"paid"});});
  /* A864/A865/A862 — TCS collector's TAN + credit-relating dropdown + other-person PAN */
  (S.paid.tcs||[]).forEach((r,i)=>{
    if((N(r.claimOwn)||N(r.collOwn)||N(r.bf))&&!TAN_RE.test(st0(r.tan).toUpperCase()))
      out.push({lvl:"err",t:"Schedule TCS row "+(i+1),m:"TAN of the collector is required and must be 10 characters.",sec:"paid"});
    if(N(r.bf)>0 && DEDYR_PAID.indexOf(st0(r.yr))<0)
      out.push({lvl:"warn",t:"Schedule TCS row "+(i+1),m:"TCS brought forward is claimed but the year of collection is not given.",sec:"paid"});
    if((st0(r.who)==="O"||N(r.claimOth)) && !PAN_RE.test(st0(r.claimOthPan).toUpperCase()) && !PAN_RE.test(st0(r.othPan).toUpperCase()))
      out.push({lvl:"err",t:"Schedule TCS row "+(i+1),m:"Credit relates to / is claimed in another person’s hands — give that person’s PAN.",sec:"paid"});});
  /* A857/A866/A862 — over-claim (carry-forward held at zero) */
  const over=(rows,lbl)=>(rows||[]).forEach((r,i)=>{if(r._over)
    out.push({lvl:"warn",t:lbl+" row "+(i+1)+" over-claimed",m:"Claimed "+RS(r._claimed)+" exceeds the "+RS(r._avail)+" deducted/collected and brought forward; carry-forward is held at zero.",sec:"paid"});});
  over(S.paid.tds2,"Schedule TDS 1"); over(S.paid.tds3,"Schedule TDS 2"); over(S.paid.tcs,"Schedule TCS");
  /* Schedule IT — BSR gate + date needed for AT/SAT split (n=837/838/839/843) */
  (S.paid.it||[]).forEach((c,i)=>{
    if(N(c.amt)&&!D(c.dt))
      out.push({lvl:"warn",t:"Challan "+(i+1),m:"An amount is entered but the date of deposit is missing or not DD/MM/YYYY — advance vs self-assessment cannot be decided.",sec:"paid"});
    if(N(c.amt)&&!BSR.test(st0(c.bsr).toUpperCase()))
      out.push({lvl:"warn",t:"Challan "+(i+1),m:"BSR code must be 7 characters for the challan to be included in the total.",sec:"paid"});});
  const P=S.C.paid||{};
  if(P.paid>0)out.push({lvl:"ok",t:"Taxes paid",m:RS(P.paid)+" total — advance "+RS(P.adv)+", TDS "+RS(P.tds)+", TCS "+RS(P.tcs)+", self-assessment "+RS(P.sat)+".",sec:"paid"});
  return out;
}

/* ---- register ----------------------------------------------------- */
/* order/corder 58 = the compute-order slot for taxes paid (after every income
   head and the loss/deduction chain, before the tax roll-up which reads
   S.C.paid). Screen order is fixed by SCREEN_ORDER (paid is 17th), not by this. */
reg({id:"paid", t:"Taxes paid", ref:"TDS · TCS · IT", f:secPaid,
  s:()=>{const P=S.C.paid||{};return P.paid?RS(P.paid)+" paid":"";},
  eng:engPaid, exp:expPaid, imp:impPaid, chk:chkPaid, order:58, corder:58});
