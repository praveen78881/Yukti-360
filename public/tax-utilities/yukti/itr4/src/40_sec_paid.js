/* ---- code tables, verbatim from books/ITR-4/enums.json -------------- */
/* TDSSection enum (59 short codes) — TDS 2(i) and TDS 2(ii); labels condensed
   from the sheet's TDS_sectionslist for the narrow grid dropdown. */
const TDSSEC_P4=[
 ["92A","192- Salary (Govt, other than Indian Govt employees)"],
 ["92B","192- Salary (other than Govt employees)"],
 ["92C","192- Salary (Indian Govt employees)"],
 ["192A","192A- TDS on PF withdrawal"],
 ["193","193- Interest on securities"],
 ["194","194- Dividends"],
 ["94A","194A- Interest other than interest on securities"],
 ["94B","194B- Winnings from lottery or crossword puzzle"],
 ["94BA","194BA- Winnings from online games"],
 ["4BB","194BB- Winnings from horse race"],
 ["94C","194C- Payments to contractors / sub-contractors"],
 ["94D","194D- Insurance commission"],
 ["4DA","194DA- Life insurance policy payment"],
 ["94E","194E- Non-resident sportsmen / sports associations"],
 ["4EE","194EE- National Savings deposits"],
 ["4F","194F- Repurchase of units by MF / UTI"],
 ["4G","194G- Commission on sale of lottery tickets"],
 ["4H","194H- Commission or brokerage"],
 ["4-IA","194I(a)- Rent on plant and machinery"],
 ["4-IB","194I(b)- Rent other than plant and machinery"],
 ["4IA","Rent on hiring of plant and machinery"],
 ["4IB","Rent on other than plant and machinery"],
 ["4IC","194IC- Payment under specified agreement"],
 ["94J-A","194J(a)- Fees for technical services"],
 ["94J-B","194J(b)- Fees for professional services / royalty"],
 ["94K","194K- Income on units of a specified MF / UTI"],
 ["4LA","194LA- Compensation on acquisition of immovable property"],
 ["4LB","194LB- Interest from infrastructure debt fund"],
 ["4LC1","194LC (2)(i) and (ia)"],
 ["4LC2","194LC (2)(ib)"],
 ["4LC3","194LC (2)(ic)"],
 ["4BA1","194LBA(a)- interest from a business trust (resident)"],
 ["4BA2","194LBA(b)- dividend from a business trust (resident)"],
 ["LBA1","194LBA(a)- 10(23FC)(a) business trust (NR)"],
 ["LBA2","194LBA(b)- 10(23FC)(b) business trust (NR)"],
 ["LBA3","194LBA(c)- 10(23FCA) business trust (NR)"],
 ["LBB","194LBB- Units of investment fund"],
 ["94R","194R- Benefits or perquisites of business / profession"],
 ["94S","194S- Transfer of virtual digital asset"],
 ["94B-P","Proviso to 194B- winnings in kind"],
 ["94R-P","First Proviso to 194R(1)- benefit in kind"],
 ["94S-P","Proviso to 194S(1)- VDA in kind"],
 ["LBC","194LBC- Investment in securitization trust"],
 ["4LD","194LD- Interest on bonds / government securities"],
 ["94M","194M- Certain sums by individuals or HUF"],
 ["94N","194N- Cash withdrawals (general)"],
 ["94N-F","194N- First Proviso (non-filers)"],
 ["94N-C","194N- Third Proviso (co-operative societies)"],
 ["94N-FT","194N- First read with Third Proviso"],
 ["94O","194O- E-commerce operator to participant"],
 ["94P","194P- Specified senior citizen"],
 ["94Q","194Q- Purchase of goods"],
 ["195","195- Other sums payable to a non-resident"],
 ["96A","196A- Units of non-residents"],
 ["96B","196B- Units to an offshore fund"],
 ["96C","196C- Foreign currency bonds / shares of Indian company"],
 ["96D","196D- FII income from securities"],
 ["96DA","196D(1A)- Specified fund from securities"],
 ["94BA-P","194BA(2)- online-game net winnings in kind"]];
const TDSSEC_CODES=TDSSEC_P4.map(x=>x[0]);
/* the three "salary" codes u/s 192 — not allowed in TDS 2(i)/2(ii) (rules.json 1550) */
const SAL_CODES=["92A","92B","92C"];

/* Financial-year dropdowns — TDS 2(i): 2024-25 … 2008-09; TDS 2(ii): 2024-25 … 2017-18 */
const DEDYR2=["2024","2023","2022","2021","2020","2019","2018","2017","2016","2015","2014","2013","2012","2011","2010","2009","2008"];
const DEDYR3=["2024","2023","2022","2021","2020","2019","2018","2017"];
const yrLbl=y=>y+"-"+String((+y+1)%100).padStart(2,"0");

/* Head of income — TDS 2(i) has NA (194N); TDS 2(ii) drops NA */
const TDS2_HEADS=[["BP","Business & profession"],["HP","House property"],
  ["OS","Other sources"],["EI","Exempt income"],["NA","Not applicable (194N)"]];
const TDS3_HEADS=[["HP","House property"],["BP","Business & profession"],
  ["OS","Other sources"],["EI","Exempt income"]];
/* head-of-income pre-fill from the section (a convenience default; editable) */
const TDS_HEAD_P4={"4-IA":"HP","4-IB":"HP","4IA":"HP","4IB":"HP","4IC":"HP",
  "193":"OS","194":"OS","94A":"OS","94B":"OS","94BA":"OS","4BB":"OS","94B-P":"OS",
  "94BA-P":"OS","4DA":"OS","4EE":"OS","94K":"OS","4LB":"OS","4LD":"OS","4BA1":"OS",
  "4BA2":"OS","LBA1":"OS","LBA2":"OS","LBA3":"OS","LBB":"OS","LBC":"OS","96A":"OS",
  "96B":"OS","96C":"OS","96D":"OS","96DA":"OS","195":"OS","192A":"OS","94E":"OS",
  "94C":"BP","94D":"BP","4F":"OS","4G":"OS","4H":"BP","94J-A":"BP","94J-B":"BP",
  "94M":"BP","94O":"BP","94Q":"BP","94R":"BP","94R-P":"BP","94S":"BP","94S-P":"BP"};

/* =====================================================================
   PAID — engine (order 60): the five payment schedules → S.C.paid
   ===================================================================== */
function engPaid(){
  const P={income:0};                 /* taxes paid contribute nothing to GTI */

  /* TDS 1 (Sch TDS1) — S4=SUM(IncChrgSal); H11=SUM(TotalTDSSal)=TotalTDSonSalaries */
  const t1  =(S.paid.tds1||[]).reduce((a,r)=>a+N(r.tds),0);
  const t1in=(S.paid.tds1||[]).reduce((a,r)=>a+N(r.inc),0);

  /* TDS 2(i) — M30=MAX(0, bf + deducted − claimed); J35=SUM(TDSClaimed) */
  (S.paid.tds2||[]).forEach(r=>{
    const avail=N(r.bf)+N(r.ded);
    r._avail=avail; r._cf=Math.max(0,avail-N(r.claim)); r._over=N(r.claim)>avail;});
  const t2=(S.paid.tds2||[]).reduce((a,r)=>a+N(r.claim),0);

  /* TDS 2(ii) — N42=MAX(0, bf + deducted − claimed); K47=SUM(TDSClaimed) */
  (S.paid.tds3||[]).forEach(r=>{
    const avail=N(r.bf)+N(r.ded);
    r._avail=avail; r._cf=Math.max(0,avail-N(r.claim)); r._over=N(r.claim)>avail;});
  const t3=(S.paid.tds3||[]).reduce((a,r)=>a+N(r.claim),0);

  /* Schedule TCS — I11=SUM(AmtTCSClaimedThisYear)=TotalSchTCS; claimed ≤ TotalTCS */
  (S.paid.tcs||[]).forEach(r=>{ r._over=N(r.claim)>N(r.coll); });
  const tcs=(S.paid.tcs||[]).reduce((a,r)=>a+N(r.claim),0);

  /* Schedule IT — advance vs self-assessment split by deposit date (FormulaOFS):
     a challan on or before 31 Mar 2026 (YREND) is advance tax; on/after 1 Apr 2026
     is self-assessment tax. H12=SUM(Amt)=TotalTaxPayments; O5=SAT total; Q5=advance. */
  const isSAT=c=>{const d=D(c.dt);return d?d>YREND:false;};
  const challans=(S.paid.it||[]).map(c=>({amt:R(N(c.amt)),dt:c.dt,sat:isSAT(c),valid:!!D(c.dt)}));
  const adv=challans.filter(c=>!c.sat).reduce((a,c)=>a+c.amt,0);
  const sat=challans.filter(c=> c.sat).reduce((a,c)=>a+c.amt,0);

  P.t1=R(t1); P.t1in=R(t1in); P.t2=R(t2); P.t3=R(t3);
  P.tds=R(t1+t2+t3);                 /* D15 / 10b = TDS1 col4 + TDS2(i) col6 + TDS2(ii) col6 */
  P.tcs=R(tcs);                      /* D16 = TCS col 5 */
  P.adv=R(adv); P.sat=R(sat); P.itTotal=R(adv+sat);   /* TotalTaxPayments (before rounding) */
  P.total=R(adv+P.tds+tcs+sat);      /* S.C.paid.total = advance + TDS + TCS + SAT */
  P.paid=P.total;                    /* alias for display */
  P.challans=challans;
  P.income=0;
  S.C.paid=P;
}

/* =====================================================================
   PAID — renderer
   ===================================================================== */
function secPaid(){
  const P=S.C.paid||{}; let h="";
  h+=formNote("Check every figure against <b>Form 26AS</b> and the annual information statement (AIS/TIS). Where possible the head of income is pre-filled from the section — please verify it.");

  /* Sch TDS1 — salary */
  h+='<div class="cgband">Sch TDS1 — Tax deducted at source from salary, as per Form 16</div>';
  h+=grid("paid.tds1",[
    {k:"tan",h:"TAN of the employer",t:"txt",w:"130px",max:10,req:1},
    {k:"name",h:"Name of the employer",t:"txt",w:"auto",max:125,req:1},
    {k:"inc",h:"Income under Salary",t:"num",w:"180px",req:1},
    {k:"tds",h:"Tax deducted",t:"num",w:"150px",req:1}],
    S.paid.tds1||[],{min:"880px",empty:"No salary TDS.",add:"Add an employer",
      foot:[{l:1,v:"TOTAL",span:2},{v:P.t1in},{v:P.t1}]});
  h+=note("Column 4 (tax deducted) feeds <b>D15 / 10b of Part B-TTI</b>.");

  /* shared TDS 2(i) / TDS 2(ii) credit table */
  const tdsCols=buyer=>[
    buyer?{k:"pan",h:"PAN of the tenant / deductor",t:"txt",w:"140px",max:10,req:1}
         :{k:"tan",h:"TAN of the deductor",t:"txt",w:"130px",max:10,req:1},
    ...(buyer?[{k:"aadh",h:"Aadhaar of the tenant / deductor",t:"txt",w:"150px",max:12}]:[]),
    {k:"sec",h:"Section (Col 2a)",t:"sel",w:"260px",req:1,opts:TDSSEC_P4},
    {k:"yr",h:"FY of b/f deduction (Col 3)",t:"sel",w:"140px",opts:(buyer?DEDYR3:DEDYR2).map(y=>[y,yrLbl(y)])},
    {k:"bf",h:"Unclaimed TDS b/f (Col 4)",t:"num",w:"120px"},
    {k:"ded",h:"TDS of current FY (Col 5)",t:"num",w:"120px"},
    {k:"claim",h:"TDS claimed this year (Col 6)",t:"num",w:"130px",req:1},
    {k:"gross",h:"Gross receipt offered (Col 7)",t:"num",w:"140px"},
    {k:"head",h:"Head of income (Col 8)",t:"sel",w:"150px",opts:buyer?TDS3_HEADS:TDS2_HEADS},
    {k:"cf",h:"TDS c/f (Col 9)",t:"calc",w:"120px",f:r=>r._cf||0}];

  /* Sch TDS2(i) — Form 16A, deductor by TAN */
  h+='<div class="cgband">Sch TDS2(i) — TDS on income other than salary, as per Form 16A</div>';
  h+=note("Carried forward (Col 9) = MAX(0, b/f + deducted − claimed). Credit may be claimed only where the corresponding receipt is offered this year under the head named. Section 192 (salary) cannot be used here.");
  h+=grid("paid.tds2",tdsCols(false),S.paid.tds2||[],{min:"1550px",empty:"No other-than-salary TDS.",add:"Add a deduction",
    foot:[{l:1,v:"TOTAL claimed (Col 6) → D15 / 10b",span:5},{v:P.t2},{v:""},{v:""},{v:""}]});
  (S.paid.tds2||[]).forEach((r,i)=>{if(r._over)h+=note("Sch TDS2(i) row "+(i+1)+": claimed "+RS(N(r.claim))+" exceeds the "+RS(r._avail)+" deducted and brought forward; carry-forward is held at zero.","stop");});

  /* Sch TDS2(ii) — Form 16C/16D, tenant/deductor by PAN + Aadhaar */
  h+='<div class="cgband">Sch TDS2(ii) — TDS as per Form 16C / 16D furnished by the payer</div>';
  h+=note("The deductor here is a <b>tenant or payer identified by PAN and Aadhaar</b> (194IB rent, 194M, 194S), not a TAN. The year of deduction dropdown stops at 2017-18 and the head of income has no 194N option.");
  h+=grid("paid.tds3",tdsCols(true),S.paid.tds3||[],{min:"1700px",empty:"Nothing under these sections.",add:"Add a deduction",
    foot:[{l:1,v:"TOTAL claimed (Col 6) → D15 / 10b",span:6},{v:P.t3},{v:""},{v:""},{v:""}]});
  (S.paid.tds3||[]).forEach((r,i)=>{if(r._over)h+=note("Sch TDS2(ii) row "+(i+1)+": claimed "+RS(N(r.claim))+" exceeds the "+RS(r._avail)+" deducted and brought forward; carry-forward is held at zero.","stop");});

  /* Schedule TCS — Form 27D */
  h+='<div class="cgband">Sch TCS — Tax collected at source, as per Form 27D</div>';
  h+=note("Amount claimed this year (Col 5) cannot exceed the tax collected (Col 4). The section-5A spouse column on the sheet has no schema field in ITR-4 and is not collected here.");
  h+=grid("paid.tcs",[
    {k:"tan",h:"TAN of the collector",t:"txt",w:"130px",max:10,req:1},
    {k:"name",h:"Name of the collector",t:"txt",w:"auto",max:125,req:1},
    {k:"paid26",h:"Amount paid (Form 26AS, Col 3)",t:"num",w:"170px",req:1},
    {k:"coll",h:"Tax collected (Col 4)",t:"num",w:"140px",req:1},
    {k:"claim",h:"Claimed this year (Col 5)",t:"num",w:"140px",req:1}],
    S.paid.tcs||[],{min:"1000px",empty:"Nothing collected.",add:"Add a collection",
      foot:[{l:1,v:"TOTAL claimed (Col 5) → D16",span:4},{v:P.tcs}]});
  (S.paid.tcs||[]).forEach((r,i)=>{if(r._over)h+=note("Sch TCS row "+(i+1)+": claimed "+RS(N(r.claim))+" exceeds the "+RS(N(r.coll))+" collected.","stop");});

  /* Sch IT — challans; advance/self-assessment split by date */
  h+='<div class="cgband">Sch IT — Advance tax and self-assessment tax</div>';
  h+=note("A challan dated <b>on or before 31 March 2026</b> is advance tax (→ D13); one dated <b>on or after 1 April 2026</b> is self-assessment tax (→ D14). The split is by date — there is no dropdown. The date of deposit must be on or after 1 April 2025.");
  h+=grid("paid.it",[
    {k:"bsr",h:"BSR code",t:"txt",w:"130px",max:7,req:1},
    {k:"dt",h:"Date of deposit",t:"date",w:"150px",req:1},
    {k:"sn",h:"Serial number of challan",t:"txt",w:"180px",max:5,req:1},
    {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],
    S.paid.it||[],{min:"760px",empty:"No challan.",add:"Add a challan",
      foot:[{l:1,v:"Advance tax "+F(P.adv)+"  ·  self-assessment tax "+F(P.sat),span:3},{v:P.itTotal}]});

  /* summary — the four Part B feeds and the total */
  h+=row("D13 · Advance tax — challans on or before 31 Mar 2026",cell(P.adv));
  h+=row("D14 · Self-assessment tax — challans on or after 1 Apr 2026",cell(P.sat));
  h+=row("D15 · TDS — TDS1 col 4 + TDS2(i) col 6 + TDS2(ii) col 6",cell(P.tds));
  h+=row("D16 · TCS — Schedule TCS col 5",cell(P.tcs));
  h+=row("D17 · Total taxes paid",cell(P.total),{cls:"grand"});
  return h;
}

/* =====================================================================
   PAID — export (TDSonSalaries, TDSonOthThanSals, ScheduleTDS3Dtls,
   ScheduleTCS, ScheduleIT). Totals present even at zero.
   ===================================================================== */
function expPaid(j){
  const P=S.C.paid||{};

  /* TDSonSalaries */
  const t1=(S.paid.tds1||[]).filter(r=>N(r.tds)&&TAN_RE.test(st0(r.tan).toUpperCase()));
  j.TDSonSalaries={TotalTDSonSalaries:n0(P.t1)};
  if(t1.length)j.TDSonSalaries.TDSonSalary=t1.map(r=>({
    EmployerOrDeductorOrCollectDetl:{TAN:st0(r.tan).toUpperCase(),
      EmployerOrDeductorOrCollecterName:(sv(r.name)||"NA").slice(0,125)},
    IncChrgSal:n0(r.inc),TotalTDSSal:n0(r.tds)}));

  /* shared TDS 2(i) / TDS 2(ii) row */
  const tdsRow=(r,buyer,yrs)=>{
    const o={};
    if(buyer){
      o.PANofTenant=PAN_RE.test(st0(r.pan).toUpperCase())?st0(r.pan).toUpperCase():"AAAAA0000A";
      if(AADH.test(st0(r.aadh)))o.AadhaarofTenant=st0(r.aadh);
    } else o.TANOfDeductor=st0(r.tan).toUpperCase();
    o.TDSSection=TDSSEC_CODES.indexOf(st0(r.sec))>=0?st0(r.sec):"94A";
    if(N(r.bf)&&yrs.indexOf(st0(r.yr))>=0){o.DeductedYr=st0(r.yr);o.BroughtFwdTDSAmt=n0(r.bf);}
    if(N(r.ded))o.TDSDeducted=n0(r.ded);
    o.TDSClaimed=n0(r.claim);
    if(N(r.gross))o.GrossAmount=n0(r.gross);
    const heads=buyer?TDS3_HEADS:TDS2_HEADS;
    let hd=st0(r.head)||TDS_HEAD_P4[r.sec]||(buyer?"OS":"NA");
    if(!heads.some(x=>x[0]===hd))hd=buyer?"OS":"NA";
    o.HeadOfIncome=hd;
    o.TDSCreditCarriedFwd=n0(r._cf||0);
    return o;};

  /* TDSonOthThanSals — Sch TDS2(i) */
  const t2=(S.paid.tds2||[]).filter(r=>(N(r.claim)||N(r.ded)||N(r.bf))&&TAN_RE.test(st0(r.tan).toUpperCase()));
  j.TDSonOthThanSals={TotalTDSonOthThanSals:n0(P.t2)};
  if(t2.length)j.TDSonOthThanSals.TDSonOthThanSalDtls=t2.map(r=>tdsRow(r,false,DEDYR2));

  /* ScheduleTDS3Dtls — Sch TDS2(ii) */
  const t3=(S.paid.tds3||[]).filter(r=>(N(r.claim)||N(r.ded)||N(r.bf))&&PAN_RE.test(st0(r.pan).toUpperCase()));
  j.ScheduleTDS3Dtls={TotalTDS3Details:n0(P.t3)};
  if(t3.length)j.ScheduleTDS3Dtls.TDS3Details=t3.map(r=>tdsRow(r,true,DEDYR3));

  /* ScheduleTCS */
  const tc=(S.paid.tcs||[]).filter(r=>(N(r.claim)||N(r.coll))&&TAN_RE.test(st0(r.tan).toUpperCase()));
  j.ScheduleTCS={TotalSchTCS:n0(P.tcs)};
  if(tc.length)j.ScheduleTCS.TCS=tc.map(r=>({
    EmployerOrDeductorOrCollectDetl:{TAN:st0(r.tan).toUpperCase(),
      EmployerOrDeductorOrCollecterName:(sv(r.name)||"NA").slice(0,125)},
    Amtfrom26AS:n0(r.paid26),TotalTCS:n0(r.coll),AmtTCSClaimedThisYear:n0(r.claim)}));

  /* ScheduleIT — DateDep as YYYY-MM-DD, on/after 2025-04-01 */
  const ch=(S.paid.it||[]).filter(c=>N(c.amt)&&BSR.test(st0(c.bsr).toUpperCase())&&ISO(c.dt)&&/^\d{1,5}$/.test(st0(c.sn)));
  j.ScheduleIT={TotalTaxPayments:n0(P.itTotal)};
  if(ch.length)j.ScheduleIT.TaxPayment=ch.map(c=>({BSRCode:st0(c.bsr).toUpperCase(),
    DateDep:ISO(c.dt),SrlNoOfChaln:parseInt(c.sn,10),Amt:n0(c.amt)}));
}

/* ---- PAID — import (inverse) --------------------------------------- */
function impPaid(I4){
  const read=[]; const g=(o,p)=>p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);
  if(I4.TDSonSalaries){
    S.paid.tds1=(I4.TDSonSalaries.TDSonSalary||[]).map(r=>({
      tan:g(r,"EmployerOrDeductorOrCollectDetl.TAN")||"",
      name:g(r,"EmployerOrDeductorOrCollectDetl.EmployerOrDeductorOrCollecterName")||"",
      inc:nz(r.IncChrgSal),tds:nz(r.TotalTDSSal)}));
    read.push("TDS on salary");}
  if(I4.TDSonOthThanSals){
    S.paid.tds2=(I4.TDSonOthThanSals.TDSonOthThanSalDtls||[]).map(r=>({
      tan:r.TANOfDeductor||"",sec:r.TDSSection||"",yr:st0(r.DeductedYr),bf:nz(r.BroughtFwdTDSAmt),
      ded:nz(r.TDSDeducted),claim:nz(r.TDSClaimed),gross:nz(r.GrossAmount),head:r.HeadOfIncome||""}));
    read.push("TDS 2(i) (other than salary)");}
  if(I4.ScheduleTDS3Dtls){
    S.paid.tds3=(I4.ScheduleTDS3Dtls.TDS3Details||[]).map(r=>({
      pan:r.PANofTenant||"",aadh:r.AadhaarofTenant||"",sec:r.TDSSection||"",yr:st0(r.DeductedYr),
      bf:nz(r.BroughtFwdTDSAmt),ded:nz(r.TDSDeducted),claim:nz(r.TDSClaimed),
      gross:nz(r.GrossAmount),head:r.HeadOfIncome||""}));
    read.push("TDS 2(ii) (16C/16D)");}
  if(I4.ScheduleTCS){
    S.paid.tcs=(I4.ScheduleTCS.TCS||[]).map(r=>({
      tan:g(r,"EmployerOrDeductorOrCollectDetl.TAN")||"",
      name:g(r,"EmployerOrDeductorOrCollectDetl.EmployerOrDeductorOrCollecterName")||"",
      paid26:nz(r.Amtfrom26AS),coll:nz(r.TotalTCS),claim:nz(r.AmtTCSClaimedThisYear)}));
    read.push("Schedule TCS");}
  if(I4.ScheduleIT){
    S.paid.it=(I4.ScheduleIT.TaxPayment||[]).map(c=>({
      bsr:c.BSRCode||"",dt:dmy(c.DateDep),sn:c.SrlNoOfChaln!=null?String(c.SrlNoOfChaln):"",amt:nz(c.Amt)}));
    read.push("advance / self-assessment tax");}
  return read;
}

/* ---- PAID — checks (regime-neutral) -------------------------------- */
function chkPaid(){
  const out=[]; engPaid();
  /* TDS 2(i)/2(ii) — year required when b/f claimed (rules.json 570) */
  const needYr=(rows,lbl,yrs)=>(rows||[]).forEach((r,i)=>{
    if(N(r.bf)>0 && yrs.indexOf(st0(r.yr))<0)
      out.push({lvl:"err",t:lbl+" row "+(i+1),m:"Brought-forward TDS is claimed but the financial year of deduction is not given.",sec:"paid"});});
  needYr(S.paid.tds2,"Sch TDS2(i)",DEDYR2); needYr(S.paid.tds3,"Sch TDS2(ii)",DEDYR3);
  /* gross + head required when col 6 claimed (rules.json 605–610) */
  const needGH=(rows,lbl)=>(rows||[]).forEach((r,i)=>{
    if(N(r.claim)>0){
      if(N(r.gross)<=0)out.push({lvl:"err",t:lbl+" row "+(i+1),m:"TDS is claimed, so the corresponding gross receipt offered (Col 7) is required.",sec:"paid"});
      if(!st0(r.head))out.push({lvl:"err",t:lbl+" row "+(i+1),m:"TDS is claimed, so the head of income (Col 8) is required.",sec:"paid"});
    }});
  needGH(S.paid.tds2,"Sch TDS2(i)"); needGH(S.paid.tds3,"Sch TDS2(ii)");
  /* section 192 not allowed in TDS 2(i)/2(ii) (rules.json 1550) */
  const noSal=(rows,lbl)=>(rows||[]).forEach((r,i)=>{
    if(SAL_CODES.indexOf(st0(r.sec))>=0)
      out.push({lvl:"err",t:lbl+" row "+(i+1),m:"Section 192 (salary) cannot be selected here — this table is TDS on income other than salary. Report salary TDS in Sch TDS1.",sec:"paid"});});
  noSal(S.paid.tds2,"Sch TDS2(i)"); noSal(S.paid.tds3,"Sch TDS2(ii)");
  /* claimed cannot exceed deducted+b/f, nor the gross offered (rules.json 580/585) */
  const over=(rows,lbl)=>(rows||[]).forEach((r,i)=>{
    if(r._over)out.push({lvl:"warn",t:lbl+" row "+(i+1)+" over-claimed",m:"Claimed "+RS(N(r.claim))+" exceeds the "+RS(r._avail)+" deducted and brought forward; carry-forward is held at zero.",sec:"paid"});
    if(N(r.gross)>0&&N(r.claim)>N(r.gross))
      out.push({lvl:"warn",t:lbl+" row "+(i+1),m:"TDS claimed "+RS(N(r.claim))+" is more than the gross receipt offered "+RS(N(r.gross))+".",sec:"paid"});});
  over(S.paid.tds2,"Sch TDS2(i)"); over(S.paid.tds3,"Sch TDS2(ii)");
  /* Sch TDS2(ii) — PAN of tenant/deductor */
  (S.paid.tds3||[]).forEach((r,i)=>{
    if((N(r.claim)||N(r.ded)||N(r.bf))&&!PAN_RE.test(st0(r.pan).toUpperCase()))
      out.push({lvl:"err",t:"Sch TDS2(ii) row "+(i+1),m:"A valid PAN of the tenant / deductor is required.",sec:"paid"});});
  /* TCS — claimed ≤ collected; mandatory fields */
  (S.paid.tcs||[]).forEach((r,i)=>{
    if(N(r.claim)>N(r.coll))
      out.push({lvl:"err",t:"Sch TCS row "+(i+1),m:"Amount claimed this year "+RS(N(r.claim))+" cannot be more than the tax collected "+RS(N(r.coll))+".",sec:"paid"});
    if((N(r.claim)||N(r.coll))&&!TAN_RE.test(st0(r.tan).toUpperCase()))
      out.push({lvl:"err",t:"Sch TCS row "+(i+1),m:"A valid TAN of the collector is required.",sec:"paid"});});
  /* Sch IT — date lower bound 01/04/2025 and BSR format */
  const APR1_25=new Date(2025,3,1);
  (S.paid.it||[]).forEach((c,i)=>{
    const d=D(c.dt);
    if(N(c.amt)&&!d)
      out.push({lvl:"warn",t:"Challan "+(i+1),m:"An amount is entered but the date of deposit is missing or not "+DF+" — advance vs self-assessment cannot be decided.",sec:"paid"});
    else if(N(c.amt)&&d&&d<APR1_25)
      out.push({lvl:"err",t:"Challan "+(i+1),m:"The date of deposit cannot be before 01/04/2025.",sec:"paid"});
    if(N(c.amt)&&!BSR.test(st0(c.bsr).toUpperCase()))
      out.push({lvl:"warn",t:"Challan "+(i+1),m:"The BSR code should be 7 characters.",sec:"paid"});});
  const P=S.C.paid||{};
  if(P.total>0)out.push({lvl:"ok",t:"Taxes paid",m:RS(P.total)+" total — advance "+RS(P.adv)+", TDS "+RS(P.tds)+", TCS "+RS(P.tcs)+", self-assessment "+RS(P.sat)+".",sec:"paid"});
  return out;
}

/* =====================================================================
   register both screen sections (last reg overrides the boot placeholder)
   ===================================================================== */
reg({id:"paid", t:"Taxes paid", ref:"TDS · TCS · IT", f:secPaid,
  s:()=>{const P=S.C.paid||{};return P.total?RS(P.total)+" paid":"";},
  eng:engPaid, exp:expPaid, imp:impPaid, chk:chkPaid, order:60});
