/* =====================================================================
   ITR-1 · Section "paid" — Taxes paid, interest, fee and the balance
   Screen order 80 (sits before the tax screen); compute order (corder) 92
   — runs AFTER "tax" (corder 90) so S.C.tax.netTaxLiability / .ti / .gti
   are ready when the interest and fee are worked out here.

   OWNS / writes on export:
     · TaxPaid.TaxesPaid.{AdvanceTax, TDS, TCS, SelfAssessmentTax,
       TotalTaxesPaid}  and  TaxPaid.BalTaxPayable
     · Refund.RefundDue                       (Refund.BankAccountDtls is bank's)
     · TDSonSalaries      {TDSonSalary[], TotalTDSonSalaries}
     · TDSonOthThanSals   {TDSonOthThanSal[], TotalTDSonOthThanSals}
     · ScheduleTDS3Dtls   {TDS3Details[], TotalTDS3Details}   ← the FIX
     · ScheduleTCS        {TCS[], TotalSchTCS}
     · TaxPayments        {TaxPayment[], TotalTaxPayments}

   THE FIX (books/ITR-1/caps.md §10, and the prior-builder flag): the prior
   builder rolled the 26QB (194IA/IB/M) TDS credit into TaxPaid.TaxesPaid.TDS
   but never emitted the ScheduleTDS3Dtls block, so those rows were lost and
   the return failed its own TDS reconciliation (TaxPaid.TDS included the
   26QB credit while only the salary + other-than-salary schedule totals were
   summed). This section emits ScheduleTDS3Dtls with its rows AND its
   TotalTDS3Details, so TaxPaid.TDS = salary + other + 26QB reconciles.

   INTEREST / FEE — the caps.md §8-9 fixes over the prior builder:
     · 234B and 234C are waived for a SENIOR CITIZEN (actual age ≥ 60) in
       BOTH regimes (bacage>59, s.207(2)) — read S.C.who.senior.
     · 234A is waived for a senior only in the OLD regime (the utility forces
       age 55 under the new regime, so the age branch never fires there).
     · 234C is nil when the net tax (baseTax − TDS − TCS) is below ₹10,000,
       and its instalment base excludes the tax on dividend income that arose
       after each instalment date (read S.C.os.dividendQtr).
     · 234F is charged only when GTI exceeds the basic exemption for the
       regime / age — new > ₹4L, old > ₹2.5L, senior (SC 60-79) > ₹3L,
       super-senior (SSC ≥ 80) > ₹5L — and is ₹1,000 when total income is not
       more than ₹5L, otherwise ₹5,000.

   Reads on compute: S.C.tax.* (net, ti, gti), S.C.who.senior /
   .superSenior, S.C.ret.regime, S.C.os.dividendQtr, and this section's own
   TDS / TCS / challan grids. Publishes S.C.paid.* (also aliased to S.C.int
   for the footer band). The interest / fee figures are consumed by the tax
   section's export (single writer of ITR1_TaxComputation).
   ===================================================================== */

/* ---- enums (verbatim from books/ITR-1/enums.json) ------------------- */
/* TDSSection — the 59 codes shared by TDSonOthThanSals and ScheduleTDS3Dtls */
const PD_TDSSEC=[
 ["92A","192-Salary-Payment to Govt employees other than Indian Govt"],
 ["92B","192-Salary-Payment to employees other than Govt employees"],
 ["92C","192-Salary-Payment to Indian Government employees"],
 ["192A","192A-TDS on PF withdrawal"],["193","193-Interest on Securities"],
 ["194","194-Dividends"],["94A","194A-Interest other than interest on securities"],
 ["94B","194B-Winning from lottery or crossword puzzle"],
 ["94BA","194BA-Winnings from online games"],["4BB","194BB-Winning from horse race"],
 ["94C","194C-Payments to contractors and sub-contractors"],["94D","194D-Insurance commission"],
 ["4DA","194DA-Payment in respect of life insurance policy"],
 ["94E","194E-Payments to non-resident sportsmen/associations"],
 ["4EE","194EE-Payments re deposits under National Savings"],
 ["4F","194F-Repurchase of units by MF/UTI"],["4G","194G-Commission on sale of lottery tickets"],
 ["4H","194H-Commission or brokerage"],["4-IA","194I(a)-Rent on plant and machinery"],
 ["4-IB","194I(b)-Rent other than plant and machinery"],
 ["4IA","194IA-TDS on Sale of immovable property"],["4IB","194IB-Rent by certain individuals/HUF"],
 ["4IC","194IC-Payment under specified agreement"],["94J-A","194J(a)-Fees for technical services"],
 ["94J-B","194J(b)-Fees for professional services/royalty"],["94K","194K-Income from units of MF/UTI"],
 ["4LA","194LA-Compensation on acquisition of immovable property"],
 ["4LB","194LB-Interest from Infrastructure Debt fund"],["4LC1","194LC(2)(i)&(ia)"],
 ["4LC2","194LC(2)(ib)"],["4LC3","194LC(2)(ic)"],
 ["4BA1","194LBA(a)-interest from business trust (resident)"],
 ["4BA2","194LBA(b)-dividend from business trust (resident)"],
 ["LBA1","194LBA(a)-10(23FC)(a) business trust (NR)"],
 ["LBA2","194LBA(b)-10(23FC)(b) business trust (NR)"],
 ["LBA3","194LBA(c)-10(23FCA) business trust (NR)"],["LBB","194LBB-units of investment fund"],
 ["94R","194R-Benefits/perquisites of business/profession"],["94S","194S-Transfer of virtual digital asset"],
 ["94B-P","Proviso to 194B-winnings in kind"],["94R-P","First Proviso 194R(1)-benefit in kind"],
 ["94S-P","Proviso 194S(1)-VDA in kind"],["LBC","194LBC-securitization trust"],
 ["4LD","194LD-interest on bonds/govt securities"],["94M","194M-certain sums by individuals/HUF"],
 ["94N","194N-cash withdrawal (general)"],["94N-F","194N First Proviso-non-filers"],
 ["94N-C","194N Third Proviso-co-op societies"],
 ["94N-FT","194N First+Third Proviso-non-filer co-op societies"],
 ["94O","194O-e-commerce operator to participant"],["94P","194P-specified senior citizen"],
 ["94Q","194Q-purchase of goods"],["195","195-Other sums payable to a non-resident"],
 ["96A","196A-units income of non-residents"],["96B","196B-units to an offshore fund"],
 ["96C","196C-foreign currency bonds/shares"],["96D","196D-FII income from securities"],
 ["96DA","196D(1A)-specified fund from securities"],["94BA-P","194BA(2)-net winnings online games in kind"]];
/* the 26QB rent codes offered on the TDS3 (194IA/194IB/194M) grid */
const PD_TDS3SEC=[["4IA","194IA-TDS on Sale of immovable property"],
 ["4IB","194IB-Rent by certain individuals/HUF"],["94M","194M-certain sums by individuals/HUF"]];
/* Deducted / Collected year — financial-year leading 'YYYY', 2025..2008 */
const PD_DEDYR=["2025","2024","2023","2022","2021","2020","2019","2018","2017",
 "2016","2015","2014","2013","2012","2011","2010","2009","2008"];

/* ---- seeds (only what is absent; never clobber the shell / an import) */
S.tds1=S.tds1||[];   /* TDS on salary            -> TDSonSalaries.TDSonSalary[]   */
S.tds2=S.tds2||[];   /* TDS other than salary    -> TDSonOthThanSals.TDSonOthThanSal[] */
S.tds3=S.tds3||[];   /* TDS on 26QB rent/sale    -> ScheduleTDS3Dtls.TDS3Details[] */
S.tcs =S.tcs ||[];   /* TCS                       -> ScheduleTCS.TCS[]             */
S.it  =S.it  ||[];   /* advance / self-assessment -> TaxPayments.TaxPayment[]      */

/* ---- cross-section readers (guarded) -------------------------------- */
function _pdRegNew(){
  const r=S.C.ret||{};
  if(r.regime==="new")return true;
  if(r.regime==="old")return false;
  if(typeof r.isNew==="boolean")return r.isNew;
  if(typeof r.new==="boolean")return r.new;
  const opt=((S.ret||{}).optout!=null?(S.ret||{}).optout:(S.fs||{}).optout);
  if(opt==="Yes"||opt==="Y")return false;
  return true;
}
/* who.senior is 60-79 ONLY; who.superSenior is >=80; who.seniorAny is >=60.
   The 234A/B/C exemption is for ANY age >= 60 (bacage>59), so it uses
   _pdAge60; the 234F GTI thresholds distinguish SC (60-79) from SSC (>=80). */
function _pdSenior(){const w=S.C.who||{};                 /* 60-79, for the 234F ₹3L threshold */
  if(typeof w.senior==="boolean")return w.senior;
  if(w.senior==="Y")return true;
  return false;}
function _pdSuper(){const w=S.C.who||{};                  /* >=80, for the 234F ₹5L threshold */
  if(typeof w.superSenior==="boolean")return w.superSenior;
  if(w.superSenior==="Y")return true;
  return (typeof superSr==="function")?superSr():false;}
function _pdAge60(){const w=S.C.who||{};                  /* >=60, for the 234A/B/C exemption */
  if(typeof w.seniorAny==="boolean")return w.seniorAny;
  if(w.seniorAny==="Y")return true;
  if(w.senior===true||w.senior==="Y"||w.superSenior===true||w.superSenior==="Y")return true;
  return (typeof senior==="function")?senior():false;}
/* the date the return was furnished — the ret section captures it; the
   input on the tax screen writes it to S.ret.filed; the return JSON does
   not carry it, so an import cannot restore it */
function _pdFiled(){const r=S.C.ret||{};
  return D(r.filedDate)||D(r.filed)||D((S.ret||{}).filed)||D((S.fs||{}).filed)||null;}
function _pdLate(filed){const r=S.C.ret||{};
  if(r.late===true)return true; if(r.late===false)return false;
  return !!(filed&&filed>DUE);}
function _pdRetSec(){const r=S.C.ret||{};
  return +(r.sec!=null?r.sec:((S.ret||{}).sec!=null?(S.ret||{}).sec:(S.fs||{}).sec))||0;}
/* dividend income by 234C quarter (from os), normalised to {q1..q5} */
function _pdDivQtr(){
  const o=(S.C.os||{}).dividendQtr; const out={q1:0,q2:0,q3:0,q4:0,q5:0};
  if(!o)return out;
  if(Array.isArray(o)){["q1","q2","q3","q4","q5"].forEach((k,i)=>out[k]=N(o[i]));return out;}
  out.q1=N(o.q1!=null?o.q1:o.Upto15Of6);
  out.q2=N(o.q2!=null?o.q2:o.Upto15Of9);
  out.q3=N(o.q3!=null?o.q3:o.Up16Of9To15Of12);
  out.q4=N(o.q4!=null?o.q4:o.Up16Of12To15Of3);
  out.q5=N(o.q5!=null?o.q5:o.Up16Of3To31Of3);
  return out;
}

/* ---- engine — taxes paid, then interest and fee with the caps fixes -- */
function engPaid(){
  const TX=S.C.tax||{};
  const net=N(TX.netTaxLiability!=null?TX.netTaxLiability:TX.net);
  const ti =N(TX.ti), gti=N(TX.gti);
  const s6079=_pdSenior(), ssr=_pdSuper(), age60=_pdAge60(), regNew=_pdRegNew();
  const filed=_pdFiled(), late=_pdLate(filed);

  /* a challan on/before 31 Mar 2026 is advance tax, after that self-assessment */
  const isSAT=c=>{const d=D(c.dt);return d?d>YREND:false;};
  const adv=(S.it||[]).filter(c=>!isSAT(c)).reduce((a,c)=>a+N(c.amt),0);
  const sat=(S.it||[]).filter(c=> isSAT(c)).reduce((a,c)=>a+N(c.amt),0);
  const t1=(S.tds1||[]).reduce((a,r)=>a+N(r.tds),0);        /* salary TDS      */
  const t2=(S.tds2||[]).reduce((a,r)=>a+N(r.claim),0);      /* other-than-sal  */
  const t3=(S.tds3||[]).reduce((a,r)=>a+N(r.claim),0);      /* 26QB rent/sale  */
  const tcs=(S.tcs||[]).reduce((a,r)=>a+N(r.claim),0);
  const tds=t1+t2+t3;                                        /* includes 26QB   */
  const paidTot=adv+tds+tcs+sat;

  /* 234A — 1%/month on the unpaid tax; senior waived in the OLD regime only */
  const unpaid=Math.max(0,net-paidTot);
  let i234a=0;
  if(late && !(age60 && !regNew))
    i234a=R(Math.floor(unpaid/100)*100*0.01*MPART(DUE,filed));

  /* the assessed tax that the advance-tax defaults run on */
  const assessed=Math.max(0,net-tds-tcs);

  /* 234B — 1%/month on the shortfall; senior waived in BOTH regimes; the
     ₹10,000 floor is the statutory assessed-tax threshold */
  let i234b=0;
  if(!age60 && assessed>=10000 && adv<assessed*0.9){
    const end=filed||new Date(2026,11,31);
    i234b=R(Math.floor((assessed-adv)/100)*100*0.01*MPART(new Date(2026,3,1),end));
  }

  /* 234C — instalment deferment; senior waived in BOTH regimes; nil below
     ₹10,000 net tax; the instalment base excludes the tax on dividend income
     received after each instalment date (caps.md §8) */
  let i234c=0, qs=[];
  if(!age60 && assessed>=10000){
    const dq=_pdDivQtr();
    const rate=ti>0?net/ti:0;                               /* effective rate on TI */
    const dAfter=[dq.q2+dq.q3+dq.q4+dq.q5, dq.q3+dq.q4+dq.q5, dq.q4+dq.q5, dq.q5];
    const upto=d=>(S.it||[]).filter(c=>!isSAT(c)&&D(c.dt)&&D(c.dt)<=d)
      .reduce((a,c)=>a+N(c.amt),0);
    const Q=[[new Date(2025,5,15),.15,3],[new Date(2025,8,15),.45,3],
             [new Date(2025,11,15),.75,3],[new Date(2026,2,15),1,1]];
    qs=Q.map((x,i)=>{const d=x[0],pc=x[1],mo=x[2];
      const base=Math.max(0,assessed-R(rate*dAfter[i]));
      const need=R(base*pc), got=upto(d), sh=Math.max(0,need-got);
      return {need,got,short:sh,mo,int:R(Math.floor(sh/100)*100*0.01*mo)};});
    i234c=qs.reduce((a,q)=>a+q.int,0);
  }

  /* 234F — late-filing fee, only above the regime/age basic-exemption GTI */
  let f234f=0;
  if(late){
    const gtiThresh=regNew?400000:(ssr?500000:s6079?300000:250000);
    if(gti>gtiThresh) f234f=ti<=500000?1000:5000;
  }
  /* 234-I — fee for furnishing a revised return (s.139(5)); niche, input-driven */
  const f234i=(late && _pdRetSec()===17)?n0((S.tax||{}).f234i):0;

  const totalIntrstPay=R(i234a+i234b+i234c+f234f+f234i);
  const aggregate=R(net+totalIntrstPay);
  const bal=aggregate-paidTot;

  const P={net:R(net),ti:R(ti),gti:R(gti),
    adv:R(adv),sat:R(sat),t1:R(t1),t2:R(t2),t3:R(t3),tds:R(tds),tcs:R(tcs),
    paid:R(paidTot),totalTaxesPaid:R(paidTot),
    i234a:i234a,i234b:i234b,i234c:i234c,f234f:f234f,f234i:R(f234i),qs,
    totalIntrstPay:totalIntrstPay,aggregate:aggregate,
    balance:R(Math.max(0,bal)),refund:R(Math.max(0,-bal)),
    late:late,senior:age60,senior6079:s6079,superSenior:ssr,regime:regNew?"New":"Old"};
  S.C.paid=P;
  S.C.int=P;                                                /* footer band contract */
}

/* ---- renderer -------------------------------------------------------- */
function secPaid(){
  const I=S.C.paid||S.C.int||{}; let h="";
  h+=formNote("Check every figure here against <b>Form 26AS</b> and the annual information "+
    "statement before filing.");

  h+=sub("Tax deducted from salary — Form 16");
  h+=grid("tds1",[{k:"tan",h:"TAN of the employer",t:"txt",w:"130px",max:10,req:1},
    {k:"name",h:"Name of the employer",t:"txt",w:"auto",req:1},
    {k:"inc",h:"Income chargeable under salaries",t:"num",w:"190px",req:1},
    {k:"tds",h:"Tax deducted",t:"num",w:"140px",req:1}],
    S.tds1,{min:"900px",empty:"No salary TDS.",add:"Add an employer",
    foot:[{l:1,v:"Total",span:3},{v:I.t1}]});

  h+=sub("Tax deducted other than from salary — Form 16A");
  h+=grid("tds2",[{k:"tan",h:"TAN of the deductor",t:"txt",w:"130px",max:10,req:1},
    {k:"name",h:"Name of the deductor",t:"txt",w:"auto",req:1},
    {k:"sec",h:"Section",t:"sel",w:"260px",req:1,opts:PD_TDSSEC},
    {k:"yr",h:"Year of deduction",t:"sel",w:"120px",req:1,opts:PD_DEDYR},
    {k:"gross",h:"Amount paid",t:"num",w:"130px",req:1},
    {k:"tds",h:"Tax deducted",t:"num",w:"130px",req:1},
    {k:"claim",h:"Credit claimed",t:"num",w:"140px",req:1}],
    S.tds2,{min:"1320px",empty:"No other TDS.",add:"Add a deduction",
    foot:[{l:1,v:"Credit claimed",span:6},{v:I.t2}]});

  h+=sub("Tax deducted under section 194IA / 194IB / 194M — Form 26QB / 26QC / 26QD");
  h+=grid("tds3",[{k:"pan",h:"PAN of the buyer or tenant",t:"txt",w:"170px",max:10,req:1},
    {k:"aadhaar",h:"Aadhaar of the buyer or tenant",t:"txt",w:"170px",max:12},
    {k:"name",h:"Name of the buyer or tenant",t:"txt",w:"auto",req:1},
    {k:"sec",h:"Section",t:"sel",w:"250px",req:1,opts:PD_TDS3SEC},
    {k:"yr",h:"Year of deduction",t:"sel",w:"120px",req:1,opts:PD_DEDYR},
    {k:"tds",h:"Tax deducted",t:"num",w:"130px",req:1},
    {k:"claim",h:"Credit claimed",t:"num",w:"140px",req:1}],
    S.tds3,{min:"1250px",empty:"Nothing deducted under these sections.",add:"Add a deduction",
    foot:[{l:1,v:"Credit claimed",span:6},{v:I.t3}]});
  h+=note("These 26QB / 26QC / 26QD credits are reported and reconciled in their own "+
    "schedule — they are included in the total tax deducted below.");

  h+=sub("Tax collected at source — Form 27D");
  h+=grid("tcs",[{k:"tan",h:"TAN of the collector",t:"txt",w:"130px",max:10,req:1},
    {k:"name",h:"Name of the collector",t:"txt",w:"auto",req:1},
    {k:"yr",h:"Year of collection",t:"sel",w:"120px",req:1,opts:PD_DEDYR},
    {k:"bf",h:"Brought-forward TCS",t:"num",w:"150px"},
    {k:"coll",h:"Tax collected",t:"num",w:"130px",req:1},
    {k:"claim",h:"Credit claimed",t:"num",w:"140px",req:1}],
    S.tcs,{min:"1060px",empty:"Nothing collected.",add:"Add a collection",
    foot:[{l:1,v:"Credit claimed",span:5},{v:I.tcs}]});

  h+=sub("Advance tax and self-assessment tax — challans");
  h+=note("Which of the two a challan is follows from its date — up to 31 March 2026 it is "+
    "advance tax, after that self-assessment tax. Nothing to choose.");
  h+=grid("it",[{k:"bsr",h:"BSR code",t:"txt",w:"130px",max:7,req:1},
    {k:"dt",h:"Date of deposit",t:"date",w:"150px",req:1},
    {k:"sn",h:"Challan serial number",t:"txt",w:"170px",max:5,req:1},
    {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],
    S.it,{min:"800px",empty:"No challan.",add:"Add a challan",
    foot:[{l:1,v:"Advance "+F(I.adv)+"  ·  self-assessment "+F(I.sat),span:3},{v:R(N(I.adv)+N(I.sat))}]});

  h+=sub("What has been paid, and the balance");
  h+=row("Total advance tax paid",cell(I.adv),{ref:"D12a"});
  h+=row("Total self-assessment tax paid",cell(I.sat),{ref:"D12b"});
  h+=row("Total tax deducted at source claimed",cell(I.tds),{ref:"D12c",hint:"salary + other + 26QB"});
  h+=row("Total tax collected at source claimed",cell(I.tcs),{ref:"D12d"});
  h+=row("Total taxes paid",cell(I.paid),{cls:"tot",ref:"D12"});
  h+=row("Net tax, fee and interest",cell(I.aggregate),{ref:"D11",hint:"from the tax screen"});
  h+=row("Balance tax payable",cell(I.balance),{cls:I.balance?"grand":"tot",ref:"D13"});
  h+=row("Refund due",cell(I.refund),{cls:I.refund?"grand":"tot",ref:"D14"});
  return h;
}

/* ---- export --------------------------------------------------------- */
function expPaid(j){
  const I=S.C.paid||S.C.int||{};

  /* TaxPaid — the totals (all required, kept even at 0) */
  const TP=j.TaxPaid=j.TaxPaid||{}; TP.TaxesPaid=TP.TaxesPaid||{};
  TP.TaxesPaid.AdvanceTax      =n0(I.adv);
  TP.TaxesPaid.TDS             =n0(I.tds);          /* salary + other + 26QB */
  TP.TaxesPaid.TCS             =n0(I.tcs);
  TP.TaxesPaid.SelfAssessmentTax=n0(I.sat);
  TP.TaxesPaid.TotalTaxesPaid  =n0(I.paid);
  TP.BalTaxPayable             =n0(I.balance);

  /* Refund.RefundDue — the bank block (BankAccountDtls) is the bank section's */
  const RF=j.Refund=j.Refund||{};
  RF.RefundDue=n0(I.refund);

  /* TDSonSalaries[] — complete rows with a valid TAN */
  const s1=(S.tds1||[]).filter(r=>N(r.tds)&&TAN_RE.test(st0(r.tan).toUpperCase()));
  const TS=j.TDSonSalaries=j.TDSonSalaries||{};
  TS.TotalTDSonSalaries=n0(I.t1);
  if(s1.length)TS.TDSonSalary=s1.map(r=>({
    EmployerOrDeductorOrCollectDetl:{TAN:st0(r.tan).toUpperCase(),
      EmployerOrDeductorOrCollecterName:(sv(r.name)||"NA").slice(0,125)},
    IncChrgSal:n0(r.inc),TotalTDSSal:n0(r.tds)}));

  /* TDSonOthThanSals[] — 16A, with the TDSSection enum */
  const s2=(S.tds2||[]).filter(r=>N(r.claim)&&TAN_RE.test(st0(r.tan).toUpperCase()));
  const TO=j.TDSonOthThanSals=j.TDSonOthThanSals||{};
  TO.TotalTDSonOthThanSals=n0(I.t2);
  if(s2.length)TO.TDSonOthThanSal=s2.map(r=>({
    EmployerOrDeductorOrCollectDetl:{TAN:st0(r.tan).toUpperCase(),
      EmployerOrDeductorOrCollecterName:(sv(r.name)||"NA").slice(0,125)},
    TDSSection:PD_TDSSEC.some(x=>x[0]===r.sec)?r.sec:"94A",
    DeductedYr:PD_DEDYR.indexOf(String(r.yr))>=0?String(r.yr):"2025",
    AmtForTaxDeduct:n0(r.gross),
    TotTDSOnAmtPaid:n0(r.tds!=null&&r.tds!==""?r.tds:r.claim),
    ClaimOutOfTotTDSOnAmtPaid:n0(r.claim)}));

  /* ScheduleTDS3Dtls[] — 26QB rent/sale.  THE FIX: emitted with its rows
     AND its total, so the 26QB credit inside TaxPaid.TDS reconciles and the
     rows are no longer dropped. */
  const s3=(S.tds3||[]).filter(r=>N(r.claim)&&PAN_RE.test(st0(r.pan).toUpperCase()));
  const T3=j.ScheduleTDS3Dtls=j.ScheduleTDS3Dtls||{};
  T3.TotalTDS3Details=n0(I.t3);
  if(s3.length)T3.TDS3Details=s3.map(r=>{const o={
      PANofTenant:st0(r.pan).toUpperCase(),
      NameOfTenant:(sv(r.name)||"NA").slice(0,125),
      TDSSection:PD_TDS3SEC.some(x=>x[0]===r.sec)?r.sec:"4IA",
      DeductedYr:PD_DEDYR.indexOf(String(r.yr))>=0?String(r.yr):"2025",
      TDSDeducted:n0(r.tds!=null&&r.tds!==""?r.tds:r.claim),
      TDSClaimed:n0(r.claim)};
    if(AADH.test(st0(r.aadhaar)))o.AadhaarofTenant=st0(r.aadhaar);
    return o;});

  /* ScheduleTCS[] — 27D */
  const c1=(S.tcs||[]).filter(r=>N(r.claim)&&TAN_RE.test(st0(r.tan).toUpperCase()));
  const TC=j.ScheduleTCS=j.ScheduleTCS||{};
  TC.TotalSchTCS=n0(I.tcs);
  if(c1.length)TC.TCS=c1.map(r=>{const o={
      EmployerOrDeductorOrCollectDetl:{TAN:st0(r.tan).toUpperCase(),
        EmployerOrDeductorOrCollecterName:(sv(r.name)||"NA").slice(0,125)},
      AmtTaxCollected:n0(r.coll),
      CollectedYr:PD_DEDYR.indexOf(String(r.yr))>=0?String(r.yr):"2025",
      AmtTCSClaimedThisYear:n0(r.claim)};
    if(N(r.bf))o.TotalTCS=n0(r.bf);
    return o;});

  /* TaxPayments[] — advance / self-assessment challans */
  const ch=(S.it||[]).filter(c=>N(c.amt)&&BSR.test(st0(c.bsr).toUpperCase())&&ISO(c.dt)
    &&/^\d{1,5}$/.test(st0(c.sn)));
  const PY=j.TaxPayments=j.TaxPayments||{};
  PY.TotalTaxPayments=n0(N(I.adv)+N(I.sat));
  if(ch.length)PY.TaxPayment=ch.map(c=>({BSRCode:st0(c.bsr).toUpperCase(),
    DateDep:ISO(c.dt),SrlNoOfChaln:parseInt(c.sn,10),Amt:n0(c.amt)}));
}

/* ---- import (inverse) ---------------------------------------------- */
function impPaid(I){
  const read=[]; const g=(o,p)=>p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);
  const dmyf=iso=>{const s=String(iso||"");
    return /^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(8,10)+"/"+s.slice(5,7)+"/"+s.slice(0,4):"";};

  const s1=g(I,"TDSonSalaries.TDSonSalary");
  if(Array.isArray(s1)&&s1.length){S.tds1=s1.map(r=>{const d=r.EmployerOrDeductorOrCollectDetl||{};
    return {tan:st0(d.TAN).toUpperCase(),name:d.EmployerOrDeductorOrCollecterName||"",
      inc:r.IncChrgSal||"",tds:r.TotalTDSSal||""};});read.push("salary TDS");}

  const s2=g(I,"TDSonOthThanSals.TDSonOthThanSal");
  if(Array.isArray(s2)&&s2.length){S.tds2=s2.map(r=>{const d=r.EmployerOrDeductorOrCollectDetl||{};
    return {tan:st0(d.TAN).toUpperCase(),name:d.EmployerOrDeductorOrCollecterName||"",
      sec:r.TDSSection||"94A",yr:String(r.DeductedYr||"2025"),gross:r.AmtForTaxDeduct||"",
      tds:r.TotTDSOnAmtPaid||"",claim:r.ClaimOutOfTotTDSOnAmtPaid||r.TotTDSOnAmtPaid||""};});
    read.push("other-than-salary TDS");}

  const s3=g(I,"ScheduleTDS3Dtls.TDS3Details");
  if(Array.isArray(s3)&&s3.length){S.tds3=s3.map(r=>({
    pan:st0(r.PANofTenant).toUpperCase(),aadhaar:r.AadhaarofTenant||"",
    name:r.NameOfTenant||"",sec:r.TDSSection||"4IA",yr:String(r.DeductedYr||"2025"),
    tds:r.TDSDeducted||"",claim:r.TDSClaimed||r.TDSDeducted||""}));
    read.push("26QB TDS");}

  const c1=g(I,"ScheduleTCS.TCS");
  if(Array.isArray(c1)&&c1.length){S.tcs=c1.map(r=>{const d=r.EmployerOrDeductorOrCollectDetl||{};
    return {tan:st0(d.TAN).toUpperCase(),name:d.EmployerOrDeductorOrCollecterName||"",
      yr:String(r.CollectedYr||"2025"),bf:r.TotalTCS||"",coll:r.AmtTaxCollected||"",
      claim:r.AmtTCSClaimedThisYear||""};});read.push("TCS");}

  const py=g(I,"TaxPayments.TaxPayment");
  if(Array.isArray(py)&&py.length){S.it=py.map(c=>({bsr:c.BSRCode||"",
    dt:dmyf(c.DateDep),sn:String(c.SrlNoOfChaln||""),amt:c.Amt||""}));read.push("challans");}
  return read;
}

/* ---- section-local sanity (not the CBDT rule engine) --------------- */
function chkPaid(){
  const out=[]; const I=S.C.paid||S.C.int||{};
  (S.tds1||[]).forEach((r,n)=>{if(N(r.tds)&&!TAN_RE.test(st0(r.tan).toUpperCase()))
    out.push({lvl:"err",t:"Salary TDS row "+(n+1),m:"The TAN is four letters, five digits and a letter.",sec:"paid"});});
  (S.tds2||[]).forEach((r,n)=>{if(!N(r.claim))return;
    if(!TAN_RE.test(st0(r.tan).toUpperCase()))
      out.push({lvl:"err",t:"TDS row "+(n+1),m:"The TAN is four letters, five digits and a letter.",sec:"paid"});
    if(!PD_TDSSEC.some(x=>x[0]===r.sec))
      out.push({lvl:"err",t:"TDS row "+(n+1),m:"Pick the section under which the tax was deducted.",sec:"paid"});});
  (S.tds3||[]).forEach((r,n)=>{if(N(r.claim)&&!PAN_RE.test(st0(r.pan).toUpperCase()))
    out.push({lvl:"err",t:"26QB row "+(n+1),m:"A valid ten-character PAN of the buyer or tenant is required.",sec:"paid"});});
  (S.tcs||[]).forEach((r,n)=>{if(N(r.claim)&&!TAN_RE.test(st0(r.tan).toUpperCase()))
    out.push({lvl:"err",t:"TCS row "+(n+1),m:"The TAN of the collector is four letters, five digits and a letter.",sec:"paid"});});
  (S.it||[]).forEach((c,n)=>{if(!N(c.amt))return;
    if(!BSR.test(st0(c.bsr).toUpperCase()))
      out.push({lvl:"err",t:"Challan "+(n+1),m:"The BSR code is seven characters.",sec:"paid"});
    if(!ISO(c.dt))
      out.push({lvl:"err",t:"Challan "+(n+1),m:"Give the date of deposit as "+DF+".",sec:"paid"});
    if(!/^\d{1,5}$/.test(st0(c.sn)))
      out.push({lvl:"err",t:"Challan "+(n+1),m:"The challan serial number is up to five digits.",sec:"paid"});});
  if((S.tds3||[]).some(r=>N(r.claim)))
    out.push({lvl:"ok",t:"26QB credit",m:"The 194IA/194IB/194M credit is carried in its own ScheduleTDS3Dtls and is part of the total tax deducted.",sec:"paid"});
  if(I.late){
    if(I.i234a||I.f234f)
      out.push({lvl:"warn",t:"Return filed late",m:"Interest under 234A of "+RS(I.i234a)+" and a fee under 234F of "+RS(I.f234f)+" follow.",sec:"paid"});
    else if(I.senior)
      out.push({lvl:"ok",t:"Senior citizen",m:"The senior-citizen exemptions from 234B/234C (and 234A in the old regime) apply.",sec:"paid"});
  }
  if(I.i234b>0)
    out.push({lvl:"warn",t:"Advance tax short",m:"Advance tax is below ninety per cent of the assessed tax, so 234B of "+RS(I.i234b)+" runs.",sec:"paid"});
  if(I.i234c>0)
    out.push({lvl:"warn",t:"Instalments missed",m:"Interest under 234C of "+RS(I.i234c)+" arises on the quarterly shortfall.",sec:"paid"});
  if(!out.length)
    out.push({lvl:"ok",t:"Taxes paid",m:"Total taxes paid "+RS(I.paid)+"; "+
      (I.refund?("refund "+RS(I.refund)):("balance "+RS(I.balance)))+".",sec:"paid"});
  return out;
}

/* ---- register (overrides the boot stub) ---------------------------- */
reg({id:"paid", t:"Taxes paid", ref:"TDS · TCS · IT", f:secPaid,
  s:()=>{const I=S.C.paid||S.C.int||{};
    return I.paid?("Paid "+CR(I.paid)+(I.refund?" · refund "+CR(I.refund):(I.balance?" · due "+CR(I.balance):""))):"TDS, TCS, challans";},
  eng:engPaid, exp:expPaid, imp:impPaid, chk:chkPaid, order:80, corder:92});
