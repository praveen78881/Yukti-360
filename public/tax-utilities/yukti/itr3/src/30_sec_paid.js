/* =====================================================================
   ITR-3 · A.Y. 2026-27 — Section "paid" · Taxes paid
   Books: books/ITR-3/IT.md (Schedule IT · 17A) and books/ITR-3/TDS.md
   (TDS 1 · 17B, TDS 2 · 17C1, TDS 3 · 18C2, Schedule TCS · 15C).
   Schema blocks: ScheduleTDS1, ScheduleTDS2, ScheduleTDS3, ScheduleTCS,
   ScheduleIT.  Order 60 (after the income heads, before tax roll-up).

   REGIME (books/ITR-3/REGIME.md): "taxes paid" STAYS OPEN in the new
   regime — no item in this section closes on isNew(); nothing is
   regime-gated here. Both regime paths render and compute identically.

   S.C.paid.income = 0 : taxes paid are credits against the liability,
   they add nothing to Gross Total Income (the tax section rolls up
   Σ S.C.<head>.income), so this head contributes 0.
   ===================================================================== */

/* ---- state (namespace S.paid; repeatable arrays seeded []) ---- */
S.paid = S.paid || { tds1:[], tds2:[], tds3:[], tcs:[], it:[] };

/* default grid rows (contract); the shell's add-handler also carries
   these by suffix — kept here so the namespace owns its defaults) */
SEED["paid.tds2"] = SEED["paid.tds2"] || { who:"S", sec:"94A" };
SEED["paid.tds3"] = SEED["paid.tds3"] || { who:"S", sec:"4IA" };
SEED["paid.tcs"]  = SEED["paid.tcs"]  || { who:"1" };

/* ---- code tables, verbatim from books/ITR-3/enums.json ---- */
/* TDS_Section_List_1 — 60 codes (schema TDSSection enum), TDS 2 & TDS 3 */
const TDSSEC_PAID=[["92A","192- Salary-Payment to Government employees other than Indian Government employees"],["92B","192- Salary-Payment to employees other than Government employees"],["92C","192- Salary-Payment to Indian Government employees"],["192A","192A- TDS on PF withdrawal"],["193","193- Interest on Securities"],["194","194- Dividends"],["94A","194A- Interest other than 'Interest on securities'"],["94B","194B- Winning from lottery or crossword puzzle"],["94BA","194BA- Winnings from online games"],["4BB","194BB- Winning from horse race"],["94C","194C- Payments to contractors and sub-contractors"],["94D","194D- Insurance commission"],["4DA","194DA- Payment in respect of life insurance policy"],["94E","194E- Payments to non-resident sportsmen or sports associations"],["4EE","194EE- Payments in respect of deposits under National Savings"],["4F","194F- Repurchase of units by Mutual Fund or UTI"],["4G","194G- Commission on sale of lottery tickets"],["4H","194H- Commission or brokerage"],["4-IA","194I(a)- Rent on hiring of plant and machinery"],["4-IB","194I(b)- Rent on other than plant and machinery"],["4IA","Rent on hiring of plant and machinery"],["4IB","Rent on other than plant and machinery"],["4IC","194IC- Payment under specified agreement"],["94J-A","194J(a)- Fees for technical services"],["94J-B","194J(b)- Fees for professional services or royalty etc"],["94K","194K- Income on units of a specified mutual fund / UTI"],["4LA","194LA- Compensation on acquisition of certain immovable property"],["4LB","194LB- Interest from Infrastructure Debt fund"],["4LC1","194LC (2)(i) and (ia)"],["4LC2","194LC (2)(ib)"],["4LC3","194LC (2)(ic)"],["4BA1","194LBA(a)- interest from a business trust (resident)"],["4BA2","194LBA(b)- dividend from a business trust (resident)"],["LBA1","194LBA(a)- 10(23FC)(a) from a business trust (NR)"],["LBA2","194LBA(b)- 10(23FC)(b) from a business trust (NR)"],["LBA3","194LBA(c)- 10(23FCA) from a business trust (NR)"],["LBB","194LBB- Income in respect of units of investment fund"],["94R","194R- Benefits or perquisites of business or profession"],["94S","194S- Transfer of virtual digital asset"],["94B-P","Proviso to 194B- winnings in kind"],["94R-P","First Proviso to 194R(1)- benefit in kind"],["94S-P","Proviso to 194S(1)- VDA in kind"],["LBC","194LBC- Investment in securitization trust"],["4LD","194LD- Interest on bonds / government securities"],["94M","194M- Certain sums by certain individuals or HUF"],["94N","194N- Cash withdrawals (general)"],["94N-F","194N- First Proviso (non-filers)"],["94N-C","194N- Third Proviso (co-operative societies)"],["94N-FT","194N- First read with Third Proviso"],["94O","194O- E-commerce operator to participant"],["94P","194P- Specified senior citizen"],["94Q","194Q- Purchase of goods"],["195","195- Other sums payable to a non-resident"],["96A","196A- Units of non-residents"],["96B","196B- Units to an offshore fund"],["96C","196C- Foreign currency bonds or shares of Indian company"],["96D","196D- FII income from securities"],["96DA","196D(1A)- Specified fund from securities"],["94BA-P","194BA(2)- online-game net winnings in kind"],["94T","194T- Payments to partners of firms"]];
const TDSSEC_CODES=TDSSEC_PAID.map(x=>x[0]);
/* Financial-year dropdowns — TDS 2 / TDS 3: 2024-25 … 2008-09 (enum 2008..2024);
   Schedule TCS: bare years 2024 … 2008 (same enum). One list of years serves both. */
const DEDYR_PAID=["2024","2023","2022","2021","2020","2019","2018","2017","2016","2015","2014","2013","2012","2011","2010","2009","2008"];
/* Head of income — TDS 2 has NA (194N); TDS 3 drops NA */
const TDS2_HEADS=[["HP","House property"],["BP","Business & profession"],["CG","Capital gains"],["OS","Other sources"],["EI","Exempt income"],["NA","Not applicable (194N)"]];
const TDS3_HEADS=TDS2_HEADS.slice(0,5);
/* head-of-income pre-fill from the section (a convenience default from the
   book's own section meanings; editable; not a tax figure) */
const TDS_HEAD_OF3={"4-IA":"HP","4-IB":"HP","4IA":"HP","4IB":"HP","4IC":"HP","4IA_S":"CG",
  "4LA":"CG","94S":"CG","94S-P":"CG",
  "193":"OS","194":"OS","94A":"OS","94B":"OS","94BA":"OS","4BB":"OS","94B-P":"OS","94BA-P":"OS",
  "4DA":"OS","4EE":"OS","94K":"OS","4LB":"OS","4LD":"OS","4BA1":"OS","4BA2":"OS","LBA1":"OS",
  "LBA2":"OS","LBA3":"OS","LBB":"OS","LBC":"OS","96A":"OS","96B":"OS","96C":"OS","96D":"OS","96DA":"OS",
  "94C":"BP","94D":"BP","4F":"OS","4G":"OS","4H":"BP","94J-A":"BP","94J-B":"BP","94M":"BP","94O":"BP",
  "94Q":"BP","94R":"BP","94R-P":"BP","94T":"BP","192A":"OS","94E":"OS","195":"OS"};

/* ---- engine ------------------------------------------------------- */
function engPaid(){
  const P={income:0};

  /* TDS 1 (17B) — G13=SUM(IncChrgSal), H13=SUM(TotalTDSSal)=TotalTDSonSalaries */
  const t1  =(S.paid.tds1||[]).reduce((a,r)=>a+N(r.tds),0);
  const t1in=(S.paid.tds1||[]).reduce((a,r)=>a+N(r.inc),0);

  /* TDS 2 (17C1) / TDS 3 (18C2) — per-row carried forward:
     W23=MAX(0, bf + dedOwn + dedOthTDS − claimOwn − claimOthTDS)  (TDS 2)
     X38=MAX(0, bf + dedOwn + dedOthTDS − claimOwn − claimOthTDS)  (TDS 3, same shape) */
  const rowCF=rows=>(rows||[]).forEach(r=>{
    const avail=N(r.bf)+N(r.dedOwn)+N(r.dedOthTds);
    const claimed=N(r.claimOwn)+N(r.claimOthTds);
    r._avail=avail; r._claimed=claimed; r._cf=Math.max(0,avail-claimed); r._over=claimed>avail;});
  rowCF(S.paid.tds2); rowCF(S.paid.tds3);
  const t2=(S.paid.tds2||[]).reduce((a,r)=>a+N(r.claimOwn),0); /* P28=SUM(TaxClaimedOwnHands) */
  const t3=(S.paid.tds3||[]).reduce((a,r)=>a+N(r.claimOwn),0); /* Q43=SUM(TaxClaimedOwnHands) */

  /* Schedule TCS (15C) — per-row carried forward:
     O67=MAX(0, bf + collOwn + collOth − claimOwn − claimOth) */
  (S.paid.tcs||[]).forEach(r=>{
    const avail=N(r.bf)+N(r.collOwn)+N(r.collOth);
    const claimed=N(r.claimOwn)+N(r.claimOth);
    r._avail=avail; r._claimed=claimed; r._cf=Math.max(0,avail-claimed); r._over=claimed>avail;});
  const tcs=(S.paid.tcs||[]).reduce((a,r)=>a+N(r.claimOwn),0); /* L73=SUM(7i own hands) */

  /* Schedule IT (17A) — advance vs self-assessment split by deposit date.
     The sheet's helper (T7/FormulaOFS): T7<2 ⇒ advance, T7>=2 ⇒ self-assessment,
     i.e. a challan on or before 31 Mar 2026 (YREND) is advance tax [T31=SUMIF(<2)],
     one on or after 1 Apr 2026 is self-assessment tax [R31=SUMIF(>=2)].
     Advance total → Part B-TTI 10a; self-assessment total → 10d (row-18 note). */
  const isSAT=c=>{const d=D(c.dt);return d?d>YREND:false;};
  const challans=(S.paid.it||[]).map(c=>({amt:R(N(c.amt)),dt:c.dt,sat:isSAT(c),valid:!!D(c.dt)}));
  const adv=challans.filter(c=>!c.sat).reduce((a,c)=>a+c.amt,0);
  const sat=challans.filter(c=> c.sat).reduce((a,c)=>a+c.amt,0);

  P.t1=R(t1); P.t1in=R(t1in); P.t2=R(t2); P.t3=R(t3);
  P.tds=R(t1+t2+t3);                 /* 10b = TDS1 col5 + TDS2 col9 + TDS3 col9 */
  P.tcs=R(tcs);                      /* 10c = TCS col 7i */
  P.adv=R(adv); P.sat=R(sat); P.itTotal=R(adv+sat); /* TotalTaxPayments */
  P.paid=R(adv+t1+t2+t3+tcs+sat);
  P.challans=challans;
  P.income=0;                        /* taxes paid contribute nothing to GTI */
  S.C.paid=P;
}

/* ---- renderer ----------------------------------------------------- */
function secPaid(){
  const P=S.C.paid||{}; let h="";
  h+=formNote("Check every figure against <b>Form 26AS</b> and the annual information statement (AIS/TIS). Where possible the head of income is pre-filled from the section — please verify it.");

  /* TDS 1 · 17B */
  h+='<div class="cgband">TDS 1 · 17B — Tax deducted at source from salary, as per Form 16</div>';
  h+=grid("paid.tds1",[
    {k:"tan",h:"TAN of the employer",t:"txt",w:"130px",max:10,req:1},
    {k:"name",h:"Name of employer",t:"txt",w:"auto",max:125,req:1},
    {k:"inc",h:"Income chargeable under Salaries",t:"num",w:"190px",req:1},
    {k:"tds",h:"Total tax deducted",t:"num",w:"150px",req:1}],
    S.paid.tds1||[],{min:"900px",empty:"No salary TDS.",add:"Add an employer",
      foot:[{l:1,v:"Total",span:2},{v:P.t1in},{v:P.t1}]});
  h+=note("Total tax deducted (col 5) feeds <b>10b of Part B-TTI</b>.");

  /* the 13-column credit table shared by TDS 2 (deductor by TAN) and TDS 3 (buyer/tenant by PAN) */
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

  /* TDS 2 · 17C1 — 18 columns; claimOwn is the 11th; total under it feeds 10b */
  h+='<div class="cgband">TDS 2 · 17C1 — TDS on income other than salary, as per Form 16A</div>';
  h+=note("Carried forward = MAX(0, b/f + deducted − claimed). Credit may be claimed only where the corresponding income is offered this year under the head named. Credit in another person’s hands is the spouse under section 5A or any other person under rule 37BA(2).");
  h+=grid("paid.tds2",tdsCols(false),S.paid.tds2||[],{min:"2500px",empty:"No other-than-salary TDS.",add:"Add a deduction",
    foot:[{l:1,v:"Claimed in own hands — to 10b of Part B-TTI",span:10},{v:P.t2},{v:""},{v:""},{v:""},{v:""},{v:""},{v:""}]});
  (S.paid.tds2||[]).forEach((r,i)=>{if(r._over)h+=note("TDS 2 row "+(i+1)+": claimed "+RS(r._claimed)+" exceeds the "+RS(r._avail)+" deducted and brought forward.","stop");});

  /* TDS 3 · 18C2 — 19 columns (buyer/tenant PAN + Aadhaar); claimOwn is the 12th */
  h+='<div class="cgband">TDS 3 · 18C2 — TDS on income, as per Form 16B / 16C / 16D / 16E</div>';
  h+=note("The deductor here is a <b>buyer, tenant or payer identified by PAN</b> (194IA sale, 194IB rent, 194M, 194S), not a TAN.");
  h+=grid("paid.tds3",tdsCols(true),S.paid.tds3||[],{min:"2650px",empty:"Nothing under these sections.",add:"Add a deduction",
    foot:[{l:1,v:"Claimed in own hands — to 10b of Part B-TTI",span:11},{v:P.t3},{v:""},{v:""},{v:""},{v:""},{v:""},{v:""}]});
  (S.paid.tds3||[]).forEach((r,i)=>{if(r._over)h+=note("TDS 3 row "+(i+1)+": claimed "+RS(r._claimed)+" exceeds the "+RS(r._avail)+" deducted and brought forward.","stop");});

  /* Schedule TCS · 15C — 11 columns; codes 1/2, bare-year dropdown; claimOwn is 8th */
  h+='<div class="cgband">Schedule TCS · 15C — Tax collected at source, as per Form 27D</div>';
  h+=grid("paid.tcs",[
    {k:"who",h:"TCS credit relating to",t:"sel",w:"120px",req:1,opts:[["1","Self"],["2","Spouse / other person"]]},
    {k:"tan",h:"TAN of the collector",t:"txt",w:"130px",max:10,req:1},
    {k:"othPan",h:"PAN of other person",t:"txt",w:"120px",max:10},
    {k:"yr",h:"FY in which TCS collected",t:"sel",w:"100px",opts:DEDYR_PAID.map(y=>[y,y])},
    {k:"bf",h:"Unclaimed TCS b/f",t:"num",w:"110px"},
    {k:"collOwn",h:"Collected this FY — own hands",t:"num",w:"130px"},
    {k:"collOth",h:"Collected in other's hands",t:"num",w:"130px"},
    {k:"claimOwn",h:"Claimed this year — own hands",t:"num",w:"130px",req:1},
    {k:"claimOth",h:"Claimed in other's hands — TCS",t:"num",w:"130px"},
    {k:"claimOthPan",h:"— PAN",t:"txt",w:"110px",max:10},
    {k:"cf",h:"Carried forward",t:"calc",w:"110px",f:r=>r._cf||0}],
    S.paid.tcs||[],{min:"1500px",empty:"Nothing collected.",add:"Add a collection",
      foot:[{l:1,v:"Claimed in own hands (7i) — to 10c of Part B-TTI",span:7},{v:P.tcs},{v:""},{v:""},{v:""}]});

  /* Schedule IT · 17A — challans; advance/self-assessment split by date */
  h+='<div class="cgband">IT · 17A — Advance tax and self-assessment tax</div>';
  h+=note("A challan dated <b>on or before 31 March 2026</b> is advance tax (→ 10a of Part B-TTI); one dated <b>on or after 1 April 2026</b> is self-assessment tax (→ 10d). The date also places each advance challan in its 234C instalment. There is no dropdown — the split is by date.");
  h+=grid("paid.it",[
    {k:"bsr",h:"BSR code",t:"txt",w:"130px",max:7,req:1},
    {k:"dt",h:"Date of deposit",t:"date",w:"150px",req:1},
    {k:"sn",h:"Serial number of challan",t:"txt",w:"180px",max:5,req:1},
    {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],
    S.paid.it||[],{min:"760px",empty:"No challan.",add:"Add a challan",
      foot:[{l:1,v:"Advance tax "+F(P.adv)+"  ·  self-assessment tax "+F(P.sat),span:3},{v:P.itTotal}]});

  /* summary — the four Part B-TTI feeds */
  h+=row("10a · Advance tax — challans on or before 31 Mar 2026",cell(P.adv));
  h+=row("10b · TDS — TDS 1 col 5 + TDS 2 col 9 + TDS 3 col 9",cell(P.tds));
  h+=row("10c · TCS — Schedule TCS col 7(i)",cell(P.tcs));
  h+=row("10d · Self-assessment tax — challans on or after 1 Apr 2026",cell(P.sat));
  h+=row("Total taxes paid",cell(P.paid),{cls:"grand"});
  return h;
}

/* ---- export ------------------------------------------------------- */
function expPaid(j){
  const P=S.C.paid||{};

  /* ScheduleTDS1 — TotalTDSonSalaries present even at zero */
  const t1=(S.paid.tds1||[]).filter(r=>N(r.tds)&&TAN_RE.test(st0(r.tan).toUpperCase()));
  j.ScheduleTDS1={TotalTDSonSalaries:n0(P.t1)};
  if(t1.length)j.ScheduleTDS1.TDSonSalary=t1.map(r=>({
    EmployerOrDeductorOrCollectDetl:{TAN:st0(r.tan).toUpperCase(),
      EmployerOrDeductorOrCollecterName:(sv(r.name)||"NA").slice(0,125)},
    IncChrgSal:n0(r.inc),TotalTDSSal:n0(r.tds)}));

  /* the shared TDS 2 / TDS 3 credit row */
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
    let hd=st0(r.head)||TDS_HEAD_OF3[r.sec]||(buyer?"OS":"NA");
    if(!heads.some(x=>x[0]===hd))hd=buyer?"OS":"NA";
    o.HeadOfIncome=hd;
    o.AmtCarriedFwd=n0(r._cf||0);
    return o;};

  /* ScheduleTDS2 — TotalTDSonOthThanSals present even at zero */
  const t2=(S.paid.tds2||[]).filter(r=>(N(r.claimOwn)||N(r.dedOwn)||N(r.bf))&&TAN_RE.test(st0(r.tan).toUpperCase()));
  j.ScheduleTDS2={TotalTDSonOthThanSals:n0(P.t2)};
  if(t2.length)j.ScheduleTDS2.TDSOthThanSalaryDtls=t2.map(r=>tdsRow(r,false));

  /* ScheduleTDS3 — TotalTDS3OnOthThanSal present even at zero */
  const t3=(S.paid.tds3||[]).filter(r=>N(r.claimOwn)||N(r.dedOwn)||N(r.bf));
  j.ScheduleTDS3={TotalTDS3OnOthThanSal:n0(P.t3)};
  if(t3.length)j.ScheduleTDS3.TDS3onOthThanSalDtls=t3.map(r=>tdsRow(r,true));

  /* ScheduleTCS — TotalSchTCS present even at zero */
  const tc=(S.paid.tcs||[]).filter(r=>(N(r.claimOwn)||N(r.collOwn)||N(r.bf))&&st0(r.tan));
  j.ScheduleTCS={TotalSchTCS:n0(P.tcs)};
  if(tc.length)j.ScheduleTCS.TCS=tc.map(r=>{
    const o={TCSCreditOwner:r.who==="2"?"2":"1",EmployerOrDeductorOrCollectTAN:st0(r.tan).toUpperCase().slice(0,10)};
    if(r.who==="2"&&PAN_RE.test(st0(r.othPan).toUpperCase()))o.PANOfSpouseOrOthrPrsn=st0(r.othPan).toUpperCase();
    if(N(r.bf)&&DEDYR_PAID.indexOf(st0(r.yr))>=0){o.DeductedYr=parseInt(r.yr,10);o.BroughtFwdTDSAmt=n0(r.bf);}
    o.TCSCurrFYDtls={TCSAmtCollOwnHand:n0(r.collOwn),TCSAmtCollSpouseOrOthrHand:n0(r.collOth)};
    const cl={TCSAmtCollOwnHand:n0(r.claimOwn)};
    if(N(r.claimOth)||PAN_RE.test(st0(r.claimOthPan).toUpperCase())){
      const oth={TCSAmtCollSpouseOrOthrHand:n0(r.claimOth)};
      if(PAN_RE.test(st0(r.claimOthPan).toUpperCase()))oth.PANOfSpouseOrOthrPrsn=st0(r.claimOthPan).toUpperCase();
      cl.TCSAmtCollOthrHands=oth;}
    o.TCSClaimedThisYearDtls=cl;
    o.AmtCarriedFwd=n0(r._cf||0);
    return o;});

  /* ScheduleIT — TotalTaxPayments present even at zero; DateDep as YYYY-MM-DD */
  const ch=(S.paid.it||[]).filter(c=>N(c.amt)&&BSR.test(st0(c.bsr).toUpperCase())&&ISO(c.dt)&&/^\d{1,5}$/.test(st0(c.sn)));
  j.ScheduleIT={TotalTaxPayments:n0(P.itTotal)};
  if(ch.length)j.ScheduleIT.TaxPayment=ch.map(c=>({BSRCode:st0(c.bsr).toUpperCase(),
    DateDep:ISO(c.dt),SrlNoOfChaln:parseInt(c.sn,10),Amt:n0(c.amt)}));
}

/* ---- import (inverse) --------------------------------------------- */
function impPaid(I3){
  const read=[]; const g=(o,p)=>p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);
  if(I3.ScheduleTDS1){
    S.paid.tds1=(I3.ScheduleTDS1.TDSonSalary||[]).map(r=>({
      tan:g(r,"EmployerOrDeductorOrCollectDetl.TAN")||"",
      name:g(r,"EmployerOrDeductorOrCollectDetl.EmployerOrDeductorOrCollecterName")||"",
      inc:nz(r.IncChrgSal),tds:nz(r.TotalTDSSal)}));
    read.push("TDS on salary");}
  const back=(r,buyer)=>{const c=r.TaxDeductCreditDtls||{};return {
    who:r.TDSCreditName||"S",othPan:r.PANofOtherPerson||"",othAadh:r.AadhaarOfOtherPerson||"",
    tan:r.TANOfDeductor||"",pan:r.PANOfBuyerTenant||"",aadh:r.AadhaarOfBuyerTenant||"",
    sec:r.TDSSection||"",yr:nz(r.DeductedYr)+"",bf:nz(r.BroughtFwdTDSAmt),
    dedOwn:nz(c.TaxDeductedOwnHands),dedOthInc:nz(c.TaxDeductedIncome),dedOthTds:nz(c.TaxDeductedTDS),
    claimOwn:nz(c.TaxClaimedOwnHands),claimOthInc:nz(c.TaxClaimedIncome),claimOthTds:nz(c.TaxClaimedTDS),
    claimOthPan:c.TaxClaimedSpouseOthPrsnPAN||"",claimOthAadh:c.SpouseOthPrsnAadhaar||"",
    gross:nz(r.GrossAmount),head:r.HeadOfIncome||""};};
  if(I3.ScheduleTDS2){S.paid.tds2=(I3.ScheduleTDS2.TDSOthThanSalaryDtls||[]).map(r=>back(r,false));read.push("TDS 2 (other than salary)");}
  if(I3.ScheduleTDS3){S.paid.tds3=(I3.ScheduleTDS3.TDS3onOthThanSalDtls||[]).map(r=>back(r,true));read.push("TDS 3 (16B/16C/16D/16E)");}
  if(I3.ScheduleTCS){S.paid.tcs=(I3.ScheduleTCS.TCS||[]).map(r=>({
    who:r.TCSCreditOwner||"1",tan:r.EmployerOrDeductorOrCollectTAN||"",othPan:r.PANOfSpouseOrOthrPrsn||"",
    yr:nz(r.DeductedYr)+"",bf:nz(r.BroughtFwdTDSAmt),
    collOwn:nz(g(r,"TCSCurrFYDtls.TCSAmtCollOwnHand")),collOth:nz(g(r,"TCSCurrFYDtls.TCSAmtCollSpouseOrOthrHand")),
    claimOwn:nz(g(r,"TCSClaimedThisYearDtls.TCSAmtCollOwnHand")),
    claimOth:nz(g(r,"TCSClaimedThisYearDtls.TCSAmtCollOthrHands.TCSAmtCollSpouseOrOthrHand")),
    claimOthPan:g(r,"TCSClaimedThisYearDtls.TCSAmtCollOthrHands.PANOfSpouseOrOthrPrsn")||""}));
    read.push("Schedule TCS");}
  if(I3.ScheduleIT){S.paid.it=(I3.ScheduleIT.TaxPayment||[]).map(c=>({
    bsr:c.BSRCode||"",dt:dmy(c.DateDep),sn:c.SrlNoOfChaln!=null?String(c.SrlNoOfChaln):"",amt:nz(c.Amt)}));
    read.push("advance / self-assessment tax");}
  return read;
}

/* ---- checks (regime-aware; taxes-paid has no regime closures) ------ */
function chkPaid(){
  const out=[]; engPaid(); /* ensure row helpers set even if called stand-alone */
  const needYr=(rows,lbl)=>(rows||[]).forEach((r,i)=>{
    if(N(r.bf)>0 && DEDYR_PAID.indexOf(st0(r.yr))<0)
      out.push({lvl:"err",t:lbl+" row "+(i+1),m:"Unclaimed TDS brought forward is claimed but the financial year of deduction is not given.",sec:"paid"});});
  needYr(S.paid.tds2,"TDS 2"); needYr(S.paid.tds3,"TDS 3");
  const needOth=(rows,lbl,code)=>(rows||[]).forEach((r,i)=>{
    if(st0(r.who)===code && !(PAN_RE.test(st0(r.othPan).toUpperCase())||AADH.test(st0(r.othAadh))))
      out.push({lvl:"err",t:lbl+" row "+(i+1),m:"Credit relates to another person — give that person’s PAN or Aadhaar.",sec:"paid"});});
  needOth(S.paid.tds2,"TDS 2","O"); needOth(S.paid.tds3,"TDS 3","O");
  (S.paid.tcs||[]).forEach((r,i)=>{
    if(N(r.bf)>0 && DEDYR_PAID.indexOf(st0(r.yr))<0)
      out.push({lvl:"warn",t:"TCS row "+(i+1),m:"TCS brought forward is claimed but the year of collection is not given.",sec:"paid"});
    if(st0(r.who)==="2" && !PAN_RE.test(st0(r.othPan).toUpperCase()))
      out.push({lvl:"err",t:"TCS row "+(i+1),m:"Credit relates to another person — give that person’s PAN.",sec:"paid"});});
  const over=(rows,lbl)=>(rows||[]).forEach((r,i)=>{if(r._over)
    out.push({lvl:"warn",t:lbl+" row "+(i+1)+" over-claimed",m:"Claimed "+RS(r._claimed)+" exceeds the "+RS(r._avail)+" deducted and brought forward; carry-forward is held at zero.",sec:"paid"});});
  over(S.paid.tds2,"TDS 2"); over(S.paid.tds3,"TDS 3"); over(S.paid.tcs,"TCS");
  (S.paid.it||[]).forEach((c,i)=>{
    if(N(c.amt)&&!D(c.dt))
      out.push({lvl:"warn",t:"Challan "+(i+1),m:"An amount is entered but the date of deposit is missing or not DD/MM/YYYY — advance vs self-assessment cannot be decided.",sec:"paid"});
    if(N(c.amt)&&!BSR.test(st0(c.bsr).toUpperCase()))
      out.push({lvl:"warn",t:"Challan "+(i+1),m:"BSR code should be 7 characters.",sec:"paid"});});
  const P=S.C.paid||{};
  if(P.paid>0)out.push({lvl:"ok",t:"Taxes paid",m:RS(P.paid)+" total — advance "+RS(P.adv)+", TDS "+RS(P.tds)+", TCS "+RS(P.tcs)+", self-assessment "+RS(P.sat)+".",sec:"paid"});
  return out;
}

/* ---- register ----------------------------------------------------- */
reg({id:"paid", t:"Taxes paid", ref:"TDS · TCS · IT", f:secPaid,
  s:()=>{const P=S.C.paid||{};return P.paid?RS(P.paid)+" paid":"";},
  eng:engPaid, exp:expPaid, imp:impPaid, chk:chkPaid, order:60});
