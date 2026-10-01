/* =====================================================================
   ITR-7 · A.Y. 2026-27 — Section "paid" · Tax payments
   Books: books/ITR-7/IT.md  (Schedule IT · 15A, advance / self-assessment
   challans), books/ITR-7/TDS.md (the two other-than-salary TDS tables) and
   books/ITR-7/TCS.md (Schedule TCS · 18C1).

   THE SHEET-NAME ↔ SCHEMA-BLOCK OFFSET (books/ITR-7/TDS.md §0):
     sheet "Schedule TDS1" (15B1, Form 16A, deductor by TAN)   → ScheduleTDS2
                                                                 (TDSOthThanSalaryDtls[])
     sheet "Schedule TDS2" (15B2, Form 16B/C/D/E, buyer PAN)    → ScheduleTDS3
                                                                 (TDS3onOthThanSalDtls[])
     sheet "Schedule TCS"  (18C1, Form 27D)                     → ScheduleTCS
                                                                 (TCSDetails[])
   A TRUST / INSTITUTION HAS NO SALARY TDS — there is NO ScheduleTDS1 block
   (that is the salary Form-16 table, absent on ITR-7).

   Schema blocks written here: ScheduleTDS2, ScheduleTDS3, ScheduleTCS,
   ScheduleIT.  Part B-TTI is a RESULT block owned by the `tax` section; this
   section PUBLISHES the taxes-paid totals as cross-section scalars the tax
   section reads into Part B-TTI 9a/9b/9c/9d/9e (ITR-7 numbering — not ITR-6's
   10a-e).  No duplicate writer: only `tax` writes Part B-TTI.  corder 92
   (after the income heads and Part B roll-up feed the liability).

   Published scalars for the tax section (all rounded whole rupees):
     adv → 9a (Advance Tax)       tds → 9b (TDS, both tables col 9)
     tcs → 9c (TCS col 7(i))      sat → 9d (Self-Assessment)
     paid → 9e (Total taxes paid = 9a+9b+9c+9d).
   Also published: t2/t3 (per-TDS-table col-9 totals), itTotal (Σ challan
   amounts), challans[] (each {amt,dt,sat,valid} for the 234A/234C interest
   engine) and income:0 (taxes paid add nothing to Gross Total Income).
   ===================================================================== */

/* ---- state (namespace S.paid; repeatable arrays seeded []; NO tds1) ---- */
S.paid = S.paid || { tds2:[], tds3:[], tcs:[], it:[] };

/* default grid rows (contract; global SEED — the shell add-handler carries its
   own copy, this mirrors the ITR-6 section convention) */
SEED["paid.tds2"] = SEED["paid.tds2"] || { who:"S", sec:"94A" };
SEED["paid.tds3"] = SEED["paid.tds3"] || { who:"S", sec:"4IA" };
SEED["paid.tcs"]  = SEED["paid.tcs"]  || { who:"S" };

/* ---- code table, the schema TDSSection enum (54 codes) paired with the
   sheet's descriptive labels (books/ITR-7/TDS.md §6.5).  The dropdown SHOWS
   the descriptive label and STORES the schema code, so on export the stored
   value already IS the schema TDSSection code.  ITR-7's list ends at 196D(1A)
   — unlike ITR-6 there is NO 194T (payments to partners), NO 94BA-P and NO
   94BA-P/94T proviso codes.  The sheet also shows a 55th label, "194BA(2) …
   net winnings in kind", which the ITR-7 schema enum does NOT carry a code
   for; it is therefore omitted here (no valid code to store).  See report. */
const TDSSEC=[
  ["193","193-Interest on Securities"],
  ["194","194-Dividends"],
  ["94A","194A-Interest other than 'Interest on securities'"],
  ["94B","194B-Winning from lottery or crossword puzzle"],
  ["94BA","194BA-Winnings from online games"],
  ["4BB","194BB-Winning from horse race"],
  ["94C","194C-Payments to contractors and sub-contractors"],
  ["94D","194D-Insurance commission"],
  ["4DA","194DA-Payment in respect of life insurance policy"],
  ["94E","194E-Payments to non-resident sportsmen or sports associations"],
  ["4EE","194EE-Payments in respect of deposits under National Savings"],
  ["4F","194F-Payments on account of repurchase of units by Mutual Fund or Unit Trust of India"],
  ["4G","194G-Commission, price, etc. on sale of lottery tickets"],
  ["4H","194H-Commission or brokerage"],
  ["4-IA","194I(a)-Rent on hiring of plant and machinery"],
  ["4-IB","194I(b)-Rent on other than plant and machinery"],
  ["4IA","194IA-TDS on Sale of immovable property"],
  ["4IB","194IB-Payment of rent by certain individuals or Hindu undivided"],
  ["4IC","194IC-Payment under specified agreement"],
  ["94J-A","194J(a)-Fees for technical services"],
  ["94J-B","194J(b)-Fees for professional  services or royalty etc"],
  ["94K","194K-Income payable to a resident assessee in respect of units of a specified mutual fund or of the units of the Unit Trust of India"],
  ["4LA","194LA-Payment of compensation on acquisition of certain immovable"],
  ["4LB","194LB-Income by way of Interest from Infrastructure Debt fund"],
  ["4LC1","194LC-194LC (2)(i) and (ia) Income under clause (i) and (ia) of sub-section (2) of section 194LC"],
  ["4LC2","194LC-194LC (2)(ib) Income under clause (ib) of sub-section (2) of section 194LC"],
  ["4LC3","194LC-194LC (2)(ic) Income under clause (ic) of sub-section (2) of section 194LC"],
  ["4BA1","194LBA(a)-Certain income in the form of interest from units of a business trust to a resident unit holder"],
  ["4BA2","194LBA(b)-Certain income in the form of dividend from units of a business trust to a resident unit holder"],
  ["LBA1","194LBA(a)-194LBA(a) income referred to in section 10(23FC)(a) from units of a business trust-NR"],
  ["LBA2","194LBA(b)-194LBA(b) Income referred to in section 10(23FC)(b) from units of a business trust-NR"],
  ["LBA3","194LBA(c)-194LBA(c) Income referred to in section 10(23FCA) from units of a business trust-NR"],
  ["LBB","194LBB-Income in respect of units of investment fund"],
  ["94R","194R-Benefits or perquisites of business or profession"],
  ["94S","194S-Payment of consideration for transfer of virtual digital asset by persons other than specified persons"],
  ["94B-P","Proviso to section 194B-Winnings from lotteries and crossword puzzles where consideration is made in kind"],
  ["94R-P","First Proviso to sub-section(1) of section 194R-Benefit or perquisite provided in kind"],
  ["94S-P","Proviso to sub- section(1) of section 194S-Payment for transfer of VDA where payment is in kind"],
  ["LBC","194LBC-Income in respect of investment in securitization trust"],
  ["4LD","194LD-TDS on interest on bonds / government securities"],
  ["94M","194M-Payment of certain sums by certain individuals or HUF"],
  ["94N","194N-Payment of certain amounts in cash other than cases covered by first proviso or third proviso"],
  ["94N-F","194N -First Proviso Payment of certain amounts in cash to non-filers except in case of co-operative societies"],
  ["94N-C","194N -Third Proviso Payment of certain amounts in cash to co-operative societies not covered by first proviso"],
  ["94N-FT","194N-First Proviso read with Third Proviso Payment of certain amount in cash to non-filers being co-operative societies"],
  ["94O","194O-Payment of certain sums by e-commerce operator to e-commerce participant."],
  ["94P","194P-Deduction of tax in case of specified senior citizen"],
  ["94Q","194Q-Deduction of tax at source on payment of certain sum for purchase of goods"],
  ["195","195-Other sums payable to a non-resident"],
  ["96A","196A-Income in respect of units of non-residents"],
  ["96B","196B-Payments in respect of units to an offshore fund"],
  ["96C","196C-Income from foreign currency bonds or shares of Indian"],
  ["96D","196D-Income of foreign institutional investors from securities"],
  ["96DA","196D(1A)-Income of specified fund from securities"]];
const TDSSEC_CODES=TDSSEC.map(x=>x[0]);

/* Financial-year dropdown — all three tables (books/ITR-7/TDS.md §6.4 and
   TCS.md §4.2: 2024 … 2008). Schema DeductedYr / TDSFinYr files the integer
   starting year; the option value is the year string "2024", text "2024-25". */
const DEDYR=["2024","2023","2022","2021","2020","2019","2018","2017","2016","2015","2014","2013","2012","2011","2010","2009","2008"];
const DEDYR_OPTS=DEDYR.map(y=>[y,y+"-"+String((+y+1)%100).padStart(2,"0")]);

/* Head of income — TRUST-specific (books/ITR-7/TDS.md §6.2 / §6.3). Includes
   the exemption schedules (AI, IE-1..IE-4, VC) as well as the four heads.
   Sheet "Schedule TDS1" (schema TDS2) also carries "Not applicable" (194N);
   sheet "Schedule TDS2" (schema TDS3) drops it. Schema HeadOfIncome enum:
   TDS2 = HP/BP/CG/OS/AI/IE1..IE4/VC/NA ; TDS3 = the same without NA. */
const TDS2_HEADS=[
  ["AI","Schedule AI"],["IE1","Schedule IE-1"],["IE2","Schedule IE-2"],
  ["IE3","Schedule IE-3"],["IE4","Schedule IE-4"],["VC","Schedule VC"],
  ["HP","Income from House Property"],["BP","Income from Business & Profession"],
  ["CG","Income from Capital Gains"],["OS","Income from Other Sources"],
  ["NA","Not applicable (only in case TDS is deducted u/s 194N)"]];
const TDS3_HEADS=TDS2_HEADS.filter(x=>x[0]!=="NA");

/* head-of-income pre-fill from the section (a convenience default; editable;
   not a tax figure). Keyed by schema TDSSection code. Everything not listed
   defaults to Other Sources (interest / dividend / units — the trust's usual
   TDS). No 194T on ITR-7. */
const TDS_HEAD_OF={
  "94C":"BP","94D":"BP","4H":"BP","94J-A":"BP","94J-B":"BP","94M":"BP","94O":"BP",
  "94Q":"BP","94R":"BP","94R-P":"BP","4IC":"BP","94E":"BP",
  "4-IA":"HP","4-IB":"HP","4IB":"HP",
  "4IA":"CG","94S":"CG","94S-P":"CG","4LA":"CG",
  "94N":"NA","94N-F":"NA","94N-C":"NA","94N-FT":"NA"};

/* ---- engine ------------------------------------------------------- */
function engPaid(){
  const P={income:0};

  /* TDS credit tables (schema TDS2 / TDS3) — per-row carried forward
     (rule A654: col 13 = col 6 + 7 + 8(ii) − 9 − 10):
       cf = MAX(0, bf + dedOwn + dedOthTds − claimOwn − claimOthTds) */
  const rowCF=rows=>(rows||[]).forEach(r=>{
    const avail=N(r.bf)+N(r.dedOwn)+N(r.dedOthTds);
    const claimed=N(r.claimOwn)+N(r.claimOthTds);
    r._avail=avail; r._claimed=claimed; r._cf=Math.max(0,avail-claimed); r._over=claimed>avail;});
  rowCF(S.paid.tds2); rowCF(S.paid.tds3);
  const t2=(S.paid.tds2||[]).reduce((a,r)=>a+N(r.claimOwn),0); /* Σ col 9 own hands */
  const t3=(S.paid.tds3||[]).reduce((a,r)=>a+N(r.claimOwn),0); /* Σ col 9 own hands */

  /* Schedule TCS (18C1) — per-row carried forward (rule A661:
       col 8 = col 5 + col 6 − col 7):
       cf = MAX(0, bf + collOwn + collOth − claimOwn − claimOth) */
  (S.paid.tcs||[]).forEach(r=>{
    const avail=N(r.bf)+N(r.collOwn)+N(r.collOth);
    const claimed=N(r.claimOwn)+N(r.claimOth);
    r._avail=avail; r._claimed=claimed; r._cf=Math.max(0,avail-claimed); r._over=claimed>avail;});
  const tcs=(S.paid.tcs||[]).reduce((a,r)=>a+N(r.claimOwn),0); /* Σ col 7(i) own hands */

  /* Schedule IT (15A) — advance vs self-assessment split by deposit date
     (books/ITR-7/IT.md §3; rules A631 / A632): a challan dated on or before
     31 Mar 2026 (YREND) is advance tax (→ 9a); on or after 1 Apr 2026 is
     self-assessment tax (→ 9d). No dropdown — the date decides. */
  const isSAT=c=>{const d=D(c.dt);return d?d>YREND:false;};
  const challans=(S.paid.it||[]).map(c=>({amt:R(N(c.amt)),dt:c.dt,sat:isSAT(c),valid:!!D(c.dt)}));
  const adv=challans.filter(c=>!c.sat).reduce((a,c)=>a+c.amt,0);
  const sat=challans.filter(c=> c.sat).reduce((a,c)=>a+c.amt,0);

  P.t2=R(t2); P.t3=R(t3);
  P.tds=R(t2+t3);                    /* 9b = TDS1 col 9 + TDS2 col 9 (rule A633) */
  P.tcs=R(tcs);                      /* 9c = TCS col 7(i)          (rule A634) */
  P.adv=R(adv); P.sat=R(sat); P.itTotal=R(adv+sat); /* TotalTaxPayments = Σ Amt */
  P.paid=R(adv+t2+t3+tcs+sat);       /* 9e = 9a + 9b + 9c + 9d (rule A628) */
  P.challans=challans;
  P.income=0;                        /* taxes paid contribute nothing to GTI */
  S.C.paid=P;
}

/* ---- renderer ----------------------------------------------------- */
/* the 13-column credit table shared by sheet "Schedule TDS1" (deductor by TAN
   → schema TDS2) and "Schedule TDS2" (buyer/tenant by PAN → schema TDS3).
   buyer=true is the PAN table. */
function _tdsCols(buyer){return [
    {k:"who",h:"TDS credit relating to",t:"sel",w:"120px",req:1,opts:[["S","Self"],["O","Other Person"]]},
    {k:"othPan",h:"PAN of other person",t:"txt",w:"120px",max:10},
    {k:"othAadh",h:"Aadhaar of other person",t:"txt",w:"130px",max:12},
    buyer?{k:"pan",h:"PAN of the buyer / tenant",t:"txt",w:"140px",max:10,req:1}
         :{k:"tan",h:"TAN of the deductor",t:"txt",w:"130px",max:10,req:1},
    ...(buyer?[{k:"aadh",h:"Aadhaar of buyer / tenant",t:"txt",w:"140px",max:12}]:[]),
    {k:"sec",h:"Section",t:"sel",w:"150px",req:1,opts:TDSSEC},
    {k:"yr",h:"FY in which TDS deducted",t:"sel",w:"120px",opts:DEDYR_OPTS},
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
    {k:"head",h:"Head of income",t:"sel",w:"220px",opts:buyer?TDS3_HEADS:TDS2_HEADS},
    {k:"cf",h:"TDS credit carried forward",t:"calc",w:"130px",f:r=>r._cf||0}];}

function secPaid(){
  const P=S.C.paid||{}; let h="";
  h+=formNote("A trust or institution has no salary TDS — there is no Form 16 / TDS-1 table. Check every figure against <b>Form 26AS</b> and the AIS/TIS. The head of income here carries the trust exemption schedules (AI, IE-1…IE-4, VC) as well as the four heads; where possible it is pre-filled from the section — please verify it.");

  /* Schedule TDS1 · 15B1 (Form 16A) → schema ScheduleTDS2 */
  h+='<div class="cgband">Schedule TDS1 · 15B1 — TDS on income other than salary, as per Form 16A (deductor with TAN)</div>';
  h+=note("Carried forward = MAX(0, b/f + deducted − claimed) (rule A654). Credit may be claimed only where the corresponding receipt is offered this year under the head named (rules A649/A652). Credit in another person’s hands is under rule 37BA(2) — give that person’s PAN or Aadhaar (rule A647).");
  h+=grid("paid.tds2",_tdsCols(false),S.paid.tds2||[],{min:"2500px",empty:"No other-than-salary TDS.",add:"Add a deduction",
    foot:[{l:1,v:"Claimed in own hands — to 9b of Part B-TTI",span:10},{v:P.t2},{v:""},{v:""},{v:""},{v:""},{v:""},{v:""}]});
  (S.paid.tds2||[]).forEach((r,i)=>{if(r._over)h+=note("Schedule TDS1 row "+(i+1)+": claimed "+RS(r._claimed)+" exceeds the "+RS(r._avail)+" deducted and brought forward.","stop");});

  /* Schedule TDS2 · 15B2 (Form 16B/16C/16D/16E) → schema ScheduleTDS3 */
  h+='<div class="cgband">Schedule TDS2 · 15B2 — TDS as per Form 16B / 16C / 16D / 16E (buyer / tenant with PAN)</div>';
  h+=note("The deductor here is a <b>buyer, tenant or payer identified by PAN</b> (194IA sale, 194IB rent, 194M, 194S), not a TAN (rule A646/A647).");
  h+=grid("paid.tds3",_tdsCols(true),S.paid.tds3||[],{min:"2650px",empty:"Nothing under these sections.",add:"Add a deduction",
    foot:[{l:1,v:"Claimed in own hands — to 9b of Part B-TTI",span:11},{v:P.t3},{v:""},{v:""},{v:""},{v:""},{v:""},{v:""}]});
  (S.paid.tds3||[]).forEach((r,i)=>{if(r._over)h+=note("Schedule TDS2 row "+(i+1)+": claimed "+RS(r._claimed)+" exceeds the "+RS(r._avail)+" deducted and brought forward.","stop");});

  /* Schedule TCS · 18C1 (Form 27D) → schema ScheduleTCS. Credit-owner S/O. */
  h+='<div class="cgband">Schedule TCS · 18C1 — Tax collected at source, as per Form 27D</div>';
  h+=note("Carried forward = MAX(0, b/f + collected − claimed) (rule A661). Credit in another person’s hands is under rule 37i(1) — give that person’s PAN (rule A658).");
  h+=grid("paid.tcs",[
    {k:"who",h:"TCS credit relating to",t:"sel",w:"120px",req:1,opts:[["S","Self"],["O","Other Person"]]},
    {k:"tan",h:"TAN of the collector",t:"txt",w:"130px",max:10,req:1},
    {k:"othPan",h:"PAN of other person",t:"txt",w:"120px",max:10},
    {k:"yr",h:"FY in which TCS collected",t:"sel",w:"120px",opts:DEDYR_OPTS},
    {k:"bf",h:"Unclaimed TCS b/f",t:"num",w:"110px"},
    {k:"collOwn",h:"Collected this FY — own hands",t:"num",w:"130px"},
    {k:"collOth",h:"Collected in other's hands",t:"num",w:"130px"},
    {k:"claimOwn",h:"Claimed this year — own hands",t:"num",w:"130px",req:1},
    {k:"claimOth",h:"Claimed in other's hands — TCS",t:"num",w:"130px"},
    {k:"claimOthPan",h:"— PAN of other person",t:"txt",w:"120px",max:10},
    {k:"cf",h:"Carried forward",t:"calc",w:"110px",f:r=>r._cf||0}],
    S.paid.tcs||[],{min:"1550px",empty:"Nothing collected.",add:"Add a collection",
      foot:[{l:1,v:"Claimed in own hands (7i) — to 9c of Part B-TTI",span:7},{v:P.tcs},{v:""},{v:""},{v:""}]});
  (S.paid.tcs||[]).forEach((r,i)=>{if(r._over)h+=note("Schedule TCS row "+(i+1)+": claimed "+RS(r._claimed)+" exceeds the "+RS(r._avail)+" collected and brought forward.","stop");});

  /* Schedule IT · 15A — challans; advance/self-assessment split by date */
  h+='<div class="cgband">Schedule IT · 15A — Advance tax and self-assessment tax</div>';
  h+=note("A challan dated <b>on or before 31 March 2026</b> is advance tax (→ 9a of Part B-TTI); one dated <b>on or after 1 April 2026</b> is self-assessment tax (→ 9d). The date also places each advance challan in its 234C instalment. There is no dropdown — the split is by date (rules A631/A632).");
  h+=grid("paid.it",[
    {k:"bsr",h:"BSR code",t:"txt",w:"130px",max:7,req:1},
    {k:"dt",h:"Date of deposit",t:"date",w:"150px",req:1},
    {k:"sn",h:"Serial number of challan",t:"txt",w:"200px",max:14,req:1},
    {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],
    S.paid.it||[],{min:"780px",empty:"No challan.",add:"Add a challan",
      foot:[{l:1,v:"Advance tax "+F(P.adv)+"  ·  self-assessment tax "+F(P.sat),span:3},{v:P.itTotal}]});

  /* summary — the five Part B-TTI feeds (ITR-7 numbering) */
  h+=row("9a · Advance tax — challans on or before 31 Mar 2026",cell(P.adv));
  h+=row("9b · TDS — Schedule TDS1 col 9 + Schedule TDS2 col 9",cell(P.tds));
  h+=row("9c · TCS — Schedule TCS col 7(i)",cell(P.tcs));
  h+=row("9d · Self-assessment tax — challans on or after 1 Apr 2026",cell(P.sat));
  h+=row("9e · Total taxes paid (9a + 9b + 9c + 9d)",cell(P.paid),{cls:"grand"});
  return h;
}

/* ---- export ------------------------------------------------------- */
function expPaid(j){
  const P=S.C.paid||{};

  /* the shared TDS credit row (schema TDS2 / TDS3). buyer=true → PAN table. */
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
    if(N(r.bf)&&DEDYR.indexOf(st0(r.yr))>=0){o.DeductedYr=parseInt(r.yr,10);o.BroughtFwdTDSAmt=n0(r.bf);}
    const c={TaxClaimedOwnHands:n0(r.claimOwn)};                 /* required leaf */
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
    let hd=st0(r.head)||TDS_HEAD_OF[r.sec]||"OS";
    if(!heads.some(x=>x[0]===hd))hd="OS";
    o.HeadOfIncome=hd;
    o.AmtCarriedFwd=n0(r._cf||0);                                /* required leaf */
    return o;};

  /* ScheduleTDS2 (sheet "Schedule TDS1", Form 16A) — total present even at zero */
  const t2=(S.paid.tds2||[]).filter(r=>(N(r.claimOwn)||N(r.dedOwn)||N(r.bf))&&TAN_RE.test(st0(r.tan).toUpperCase()));
  j.ScheduleTDS2={TotalTDSonOthThanSals:n0(P.t2)};
  if(t2.length)j.ScheduleTDS2.TDSOthThanSalaryDtls=t2.map(r=>tdsRow(r,false));

  /* ScheduleTDS3 (sheet "Schedule TDS2", Form 16B/C/D/E) — total present even at zero */
  const t3=(S.paid.tds3||[]).filter(r=>N(r.claimOwn)||N(r.dedOwn)||N(r.bf));
  j.ScheduleTDS3={TotalTDS3OnOthThanSal:n0(P.t3)};
  if(t3.length)j.ScheduleTDS3.TDS3onOthThanSalDtls=t3.map(r=>tdsRow(r,true));

  /* ScheduleTCS (sheet "Schedule TCS", Form 27D) — total present even at zero.
     Credit-owner S/O; TAN inside EmployerOrDeductorOrCollectDetl; the current-FY
     and claimed blocks nest own/other hands; the claimed-other-hands is an
     OBJECT {TaxClaimedTCS, PANOfOthrPrsn} (books/ITR-7/TCS.md §2). */
  const tc=(S.paid.tcs||[]).filter(r=>(N(r.claimOwn)||N(r.collOwn)||N(r.bf))&&st0(r.tan));
  j.ScheduleTCS={TotalSchTCS:n0(P.tcs)};
  if(tc.length)j.ScheduleTCS.TCSDetails=tc.map(r=>{
    const det={TCSCreditName:r.who==="O"?"O":"S",TAN:st0(r.tan).toUpperCase()};
    if(r.who==="O"&&PAN_RE.test(st0(r.othPan).toUpperCase()))det.PANofOtherPerson=st0(r.othPan).toUpperCase();
    if(N(r.bf)&&DEDYR.indexOf(st0(r.yr))>=0)det.TDSFinYr=parseInt(r.yr,10);
    const o={EmployerOrDeductorOrCollectDetl:det};
    if(N(r.bf)&&DEDYR.indexOf(st0(r.yr))>=0)o.BroughtFwdTCSAmt=n0(r.bf);
    const cur={TCSAmtCollOwnHands:n0(r.collOwn)};                /* required leaf */
    if(N(r.collOth))cur.TCSAmtCollOthrHands=n0(r.collOth);
    o.TCSCurrFYDtls=cur;
    const cl={TCSAmtCollOwnHands:n0(r.claimOwn)};                /* required leaf */
    if(N(r.claimOth)||PAN_RE.test(st0(r.claimOthPan).toUpperCase())){
      const oth={};
      if(N(r.claimOth))oth.TaxClaimedTCS=n0(r.claimOth);
      if(PAN_RE.test(st0(r.claimOthPan).toUpperCase()))oth.PANOfOthrPrsn=st0(r.claimOthPan).toUpperCase();
      cl.TCSAmtCollOthrHands=oth;}
    o.TCSClaimedThisYearDtls=cl;
    o.AmtCarriedFwd=n0(r._cf||0);                               /* required leaf */
    return o;});

  /* ScheduleIT — TotalTaxPayments present even at zero; DateDep as YYYY-MM-DD */
  const ch=(S.paid.it||[]).filter(c=>N(c.amt)&&BSR.test(st0(c.bsr).toUpperCase())&&ISO(c.dt)&&/^\d{1,14}$/.test(st0(c.sn)));
  j.ScheduleIT={TotalTaxPayments:n0(P.itTotal)};
  if(ch.length)j.ScheduleIT.TaxPayment=ch.map(c=>({BSRCode:st0(c.bsr).toUpperCase(),
    DateDep:ISO(c.dt),SrlNoOfChaln:parseInt(c.sn,10),Amt:n0(c.amt)}));
}

/* ---- import (inverse) --------------------------------------------- */
function impPaid(I7){
  const read=[]; const g=(o,p)=>p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);
  const back=(r,buyer)=>{const c=r.TaxDeductCreditDtls||{};return {
    who:r.TDSCreditName||"S",othPan:r.PANofOtherPerson||"",othAadh:r.AadhaarOfOtherPerson||"",
    tan:r.TANOfDeductor||"",pan:r.PANOfBuyerTenant||"",aadh:r.AadhaarOfBuyerTenant||"",
    sec:r.TDSSection||"",yr:nz(r.DeductedYr)+"",bf:nz(r.BroughtFwdTDSAmt),
    dedOwn:nz(c.TaxDeductedOwnHands),dedOthInc:nz(c.TaxDeductedIncome),dedOthTds:nz(c.TaxDeductedTDS),
    claimOwn:nz(c.TaxClaimedOwnHands),claimOthInc:nz(c.TaxClaimedIncome),claimOthTds:nz(c.TaxClaimedTDS),
    claimOthPan:c.TaxClaimedSpouseOthPrsnPAN||"",claimOthAadh:c.SpouseOthPrsnAadhaar||"",
    gross:nz(r.GrossAmount),head:r.HeadOfIncome||""};};
  if(I7.ScheduleTDS2){S.paid.tds2=(I7.ScheduleTDS2.TDSOthThanSalaryDtls||[]).map(r=>back(r,false));read.push("Schedule TDS1 (Form 16A, other than salary)");}
  if(I7.ScheduleTDS3){S.paid.tds3=(I7.ScheduleTDS3.TDS3onOthThanSalDtls||[]).map(r=>back(r,true));read.push("Schedule TDS2 (Form 16B/16C/16D/16E)");}
  if(I7.ScheduleTCS){S.paid.tcs=(I7.ScheduleTCS.TCSDetails||[]).map(r=>{
    const det=r.EmployerOrDeductorOrCollectDetl||{};return {
    who:det.TCSCreditName||"S",tan:det.TAN||"",othPan:det.PANofOtherPerson||"",
    yr:nz(det.TDSFinYr)+"",bf:nz(r.BroughtFwdTCSAmt),
    collOwn:nz(g(r,"TCSCurrFYDtls.TCSAmtCollOwnHands")),collOth:nz(g(r,"TCSCurrFYDtls.TCSAmtCollOthrHands")),
    claimOwn:nz(g(r,"TCSClaimedThisYearDtls.TCSAmtCollOwnHands")),
    claimOth:nz(g(r,"TCSClaimedThisYearDtls.TCSAmtCollOthrHands.TaxClaimedTCS")),
    claimOthPan:g(r,"TCSClaimedThisYearDtls.TCSAmtCollOthrHands.PANOfOthrPrsn")||""};});
    read.push("Schedule TCS");}
  if(I7.ScheduleIT){S.paid.it=(I7.ScheduleIT.TaxPayment||[]).map(c=>({
    bsr:c.BSRCode||"",dt:dmy(c.DateDep),sn:c.SrlNoOfChaln!=null?String(c.SrlNoOfChaln):"",amt:nz(c.Amt)}));
    read.push("advance / self-assessment tax");}
  return read;
}

/* ---- checks (screen validations only; department rules are Phase 6) ---- */
function chkPaid(){
  const out=[]; engPaid(); /* ensure row helpers set even if called stand-alone */
  const needYr=(rows,lbl)=>(rows||[]).forEach((r,i)=>{
    if(N(r.bf)>0 && DEDYR.indexOf(st0(r.yr))<0)
      out.push({lvl:"err",t:lbl+" row "+(i+1),m:"Unclaimed TDS brought forward is claimed but the financial year of deduction is not given (rule A648).",sec:"paid"});});
  needYr(S.paid.tds2,"Schedule TDS1"); needYr(S.paid.tds3,"Schedule TDS2");
  const needTan=(rows,lbl)=>(rows||[]).forEach((r,i)=>{
    if((N(r.claimOwn)||N(r.dedOwn))&&!TAN_RE.test(st0(r.tan).toUpperCase()))
      out.push({lvl:"err",t:lbl+" row "+(i+1),m:"The deductor’s TAN is required and must be 4 letters, 5 digits, 1 letter (rule A646).",sec:"paid"});});
  needTan(S.paid.tds2,"Schedule TDS1");
  (S.paid.tds3||[]).forEach((r,i)=>{
    if((N(r.claimOwn)||N(r.dedOwn))&&!PAN_RE.test(st0(r.pan).toUpperCase()))
      out.push({lvl:"err",t:"Schedule TDS2 row "+(i+1),m:"The buyer / tenant PAN is required (there is no TAN for 194IA/IB/M/S) (rule A647).",sec:"paid"});});
  const needOth=(rows,lbl)=>(rows||[]).forEach((r,i)=>{
    if(st0(r.who)==="O" && !(PAN_RE.test(st0(r.othPan).toUpperCase())||AADH.test(st0(r.othAadh))))
      out.push({lvl:"err",t:lbl+" row "+(i+1),m:"Credit relates to another person — give that person’s PAN or Aadhaar (rule 37BA(2) / A647).",sec:"paid"});});
  needOth(S.paid.tds2,"Schedule TDS1"); needOth(S.paid.tds3,"Schedule TDS2");
  const needGross=(rows,lbl)=>(rows||[]).forEach((r,i)=>{
    if(N(r.claimOwn)>0 && !st0(r.head))
      out.push({lvl:"warn",t:lbl+" row "+(i+1),m:"TDS credit is claimed — please confirm the head of income / exemption schedule under which the receipt is offered (rule A652).",sec:"paid"});});
  needGross(S.paid.tds2,"Schedule TDS1"); needGross(S.paid.tds3,"Schedule TDS2");
  (S.paid.tcs||[]).forEach((r,i)=>{
    if((N(r.claimOwn)||N(r.collOwn))&&!TAN_RE.test(st0(r.tan).toUpperCase()))
      out.push({lvl:"err",t:"Schedule TCS row "+(i+1),m:"The collector’s TAN is required (rule A660).",sec:"paid"});
    if(N(r.bf)>0 && DEDYR.indexOf(st0(r.yr))<0)
      out.push({lvl:"warn",t:"Schedule TCS row "+(i+1),m:"TCS brought forward is claimed but the year of collection is not given.",sec:"paid"});
    if(st0(r.who)==="O" && !PAN_RE.test(st0(r.othPan).toUpperCase()))
      out.push({lvl:"err",t:"Schedule TCS row "+(i+1),m:"Credit relates to another person — give that person’s PAN (rule 37i(1) / A658).",sec:"paid"});});
  const over=(rows,lbl)=>(rows||[]).forEach((r,i)=>{if(r._over)
    out.push({lvl:"warn",t:lbl+" row "+(i+1)+" over-claimed",m:"Claimed "+RS(r._claimed)+" exceeds the "+RS(r._avail)+" deducted / collected and brought forward; carry-forward is held at zero.",sec:"paid"});});
  over(S.paid.tds2,"Schedule TDS1"); over(S.paid.tds3,"Schedule TDS2"); over(S.paid.tcs,"Schedule TCS");
  (S.paid.it||[]).forEach((c,i)=>{
    if(N(c.amt)&&!D(c.dt))
      out.push({lvl:"warn",t:"Challan "+(i+1),m:"An amount is entered but the date of deposit is missing or not DD/MM/YYYY — advance vs self-assessment cannot be decided.",sec:"paid"});
    if(N(c.amt)&&!BSR.test(st0(c.bsr).toUpperCase()))
      out.push({lvl:"warn",t:"Challan "+(i+1),m:"BSR code should be 7 characters (3 digits + 4 alphanumerics).",sec:"paid"});});
  const P=S.C.paid||{};
  if(P.paid>0)out.push({lvl:"ok",t:"Tax payments",m:RS(P.paid)+" total — advance "+RS(P.adv)+", TDS "+RS(P.tds)+", TCS "+RS(P.tcs)+", self-assessment "+RS(P.sat)+".",sec:"paid"});
  return out;
}

/* ---- register (override the boot stub) ----------------------------- */
reg({id:"paid", t:"Tax payments", ref:"IT · TDS · TCS", f:secPaid,
  s:()=>{const P=S.C.paid||{};return P.paid?RS(P.paid)+" paid":"";},
  eng:engPaid, exp:expPaid, imp:impPaid, chk:chkPaid, order:180, corder:92});
