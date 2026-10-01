/* =====================================================================
   ITR-3 · Section "sal" — Salary (Schedule S)
   Built from books/ITR-3/Schedule_S.md and books/ITR-3/REGIME.md only.
   Self-contained: state, engine, renderer, export, import, checks + reg().
   Cell refs from the book are quoted in comments beside each formula.
   ===================================================================== */

/* ---- state: S.sal namespace (own; nothing shared touched) ---------- */
S.sal = S.sal || { emp:[], alw:[], hra:{}, rel89a:"", ent:"", pt:"" };
if(!S.sal.emp) S.sal.emp=[];
if(!S.sal.alw) S.sal.alw=[];
if(!S.sal.hra) S.sal.hra={};

/* ---- code tables (verbatim from books/ITR-3/enums.json) ------------ */
/* Nature of employer — enum NatureOfEmployment (H4/H30) */
const SAL_EMPCAT=[["CGOV","Central Government"],["SGOV","State Government"],
  ["PSU","Public Sector Undertaking"],["PE","Pensioners — Central Government"],
  ["PESG","Pensioners — State Government"],["PEPS","Pensioners — Public sector undertaking"],
  ["PEO","Pensioners — Others"],["OTH","Others"]];
/* State — enum StateCode (H6/H32) */
const SAL_STATE=[["01","Andaman and Nicobar Islands"],["02","Andhra Pradesh"],
  ["03","Arunachal Pradesh"],["04","Assam"],["05","Bihar"],["06","Chandigarh"],
  ["07","Dadra Nagar and Haveli"],["08","Daman and Diu"],["09","Delhi"],["10","Goa"],
  ["11","Gujarat"],["12","Haryana"],["13","Himachal Pradesh"],["14","Jammu and Kashmir"],
  ["15","Karnataka"],["16","Kerala"],["17","Lakshadweep"],["18","Madhya Pradesh"],
  ["19","Maharashtra"],["20","Manipur"],["21","Meghalaya"],["22","Mizoram"],
  ["23","Nagaland"],["24","Odisha"],["25","Puducherry"],["26","Punjab"],["27","Rajasthan"],
  ["28","Sikkim"],["29","Tamil Nadu"],["30","Tripura"],["31","Uttar Pradesh"],
  ["32","West Bengal"],["33","Chhattisgarh"],["34","Uttarakhand"],["35","Jharkhand"],
  ["36","Telangana"],["37","Ladakh"],["99","Foreign"]];
/* Nature of salary — 1a — enum salarydropdown1 (NatureDesc) */
const SAL_S17_1=[["1","Basic Salary"],["2","Dearness Allowance (DA)"],
  ["3","Conveyance Allowance"],["4","House Rent Allowance (HRA)"],
  ["5","Leave Travel Allowance (LTA)"],["6","Children Education Allowance (CEA)"],
  ["7","Other Allowance"],["8","Employer's contribution to pension scheme u/s 80CCD"],
  ["9","Amount deemed income under rule 6 of Part-A of Fourth Schedule"],
  ["10","Amount deemed income under rule 11(4) of Part-A of Fourth Schedule"],
  ["11","Annuity or pension"],["12","Commuted Pension"],["13","Gratuity"],
  ["14","Fees / commission"],["15","Advance of salary"],["16","Leave Encashment"],
  ["17","Central government contribution to Agnipath scheme u/s 80CCH"],["OTH","Others"]];
/* Nature of perquisites — 1b — enum salarydropdown2 (NatureDesc) */
const SAL_S17_2=[["1","Accommodation"],["2","Cars / Other Automotive"],
  ["3","Sweeper, gardener, watchman or personal attendant"],["4","Gas, electricity, water"],
  ["5","Interest free or concessional loans"],["6","Holiday expenses"],
  ["7","Free or concessional travel"],["8","Free meals"],["9","Free education"],
  ["10","Gifts, vouchers, etc."],["11","Credit card expenses"],["12","Club expenses"],
  ["13","Use of movable assets by employees"],["14","Transfer of assets to employee"],
  ["15","Value of any other benefit/amenity/service/privilege"],
  ["16","ESOP of eligible start-up u/s 80-IAC — tax to be deferred"],
  ["17","Stock options (non-qualified options) other than ESOP in 16 above"],
  ["18","Contribution by employer to fund/scheme taxable u/s 17(2)(vii)"],
  ["19","Annual accretion to fund/scheme u/s 17(2)(viia)"],
  ["21","ESOP of eligible start-up u/s 80-IAC — tax not to be deferred"],
  ["OTH","Other benefits or amenities"]];
/* Nature of profit in lieu of salary — 1c — enum salarydropdown3 (NatureDesc) */
const SAL_S17_3=[["1","Compensation on termination of employment or modification thereto"],
  ["2","Payment from employer / fund incl. Keyman Insurance Policy & bonus"],
  ["3","Amount due/received before joining or after cessation of employment"],
  ["OTH","Any Other"]];
/* Country — 1d — enum NOT89ACountrycode */
const SAL_NOT89=[["US","United States of America"],
  ["UK","United Kingdom of Great Britain and Northern Ireland"],["CA","Canada"]];
/* Exempt allowance — 3 — enum SalNatureDesc (17 values) */
const SAL_ALW10=[["10(5)","Sec 10(5) — Leave Travel allowance"],
  ["10(6)","Sec 10(6) — Remuneration of an embassy/high-commission official"],
  ["10(7)","Sec 10(7) — Allowances/perquisites paid outside India by Govt"],
  ["10(10)","Sec 10(10) — Death-cum-retirement gratuity received"],
  ["10(10A)","Sec 10(10A) — Commuted value of pension received"],
  ["10(10AA)","Sec 10(10AA) — Earned leave encashment on retirement"],
  ["10(10B)(i)","Sec 10(10B) first proviso — compensation limit notified by CG"],
  ["10(10B)(ii)","Sec 10(10B) second proviso — compensation under approved scheme"],
  ["10(10C)","Sec 10(10C) — amount on voluntary retirement / termination"],
  ["10(10CC)","Sec 10(10CC) — tax paid by employer on non-monetary perquisite"],
  ["10(13A)","Sec 10(13A) — House Rent Allowance"],
  ["10(14)(i)","Sec 10(14)(i) — prescribed allowances to meet duties expenses"],
  ["10(14)(ii)","Sec 10(14)(ii) — prescribed allowances for personal expenses"],
  ["10(14)(i)(115BAC)","Sec 10(14)(i) — allowances under Rule 2BB (1)(a)-(c) [115BAC]"],
  ["10(14)(ii)(115BAC)","Sec 10(14)(ii) — transport allowance for handicapped [115BAC]"],
  ["EIC","Exempt income of a Supreme Court / High Court judge"],
  ["10(17)","Sec 10(17) — Allowance MP/MLA/MLC"]];
/* Place of residence — 10(13A) — enum Placeofwork */
const SAL_PLACE=[["1","Metro (Delhi, Mumbai, Kolkata, Chennai)"],["2","Non-Metro"]];

/* Exempt allowances that stay exempt under the new regime u/s 115BAC — the
   utility's RngBacYes named range (DropDownValues col P, rows 21-31): the
   retirement/statutory 10(x) exemptions continue in BOTH regimes; only LTA
   10(5), HRA 10(13A) (handled separately), the generic 10(14)(i)/(ii), 10(17)
   and EIC close. 10(14) survives only as its 115BAC Rule-2BB subset (A198). */
const SAL_ALW10_NEW=["10(6)","10(7)","10(10)","10(10A)","10(10AA)",
  "10(10B)(i)","10(10B)(ii)","10(10C)","10(10CC)",
  "10(14)(i)(115BAC)","10(14)(ii)(115BAC)"];

/* helpers scoped to this section */
const _salEntEligible=cat=>cat==="CGOV"||cat==="SGOV"||cat==="PSU"; /* 16(ii) — book */
const _salIsGovt=cat=>cat==="CGOV"||cat==="SGOV";                   /* 80CCD(2) 14% */

/* ==================================================================
   ENGINE — engSal(): numbers from S.sal into S.C.sal
   ================================================================== */
function engSal(){
  const emp=S.sal.emp||[];
  let gS=0,gP=0,gPr=0,g89d=0,g89e=0,g89f=0,basicDA=0,basic=0;
  let entEligible=false,anyGovt=false;
  emp.forEach(e=>{
    const sumOf=arr=>(arr||[]).reduce((a,r)=>a+N(r.amt),0);
    /* 1a/1b/1c totals: from the breakup rows when present, else the typed total */
    if((e.nsal||[]).length)  e.s17_1=sumOf(e.nsal);
    if((e.nperq||[]).length) e.s17_2=sumOf(e.nperq);
    if((e.nprof||[]).length) e.s17_3=sumOf(e.nprof);
    const s=N(e.s17_1),perq=N(e.s17_2),prof=N(e.s17_3);
    /* basic (code 1) and basic+DA (codes 1,2) from the 1a breakup */
    e._basic  =(e.nsal||[]).filter(r=>r.code==="1").reduce((a,r)=>a+N(r.amt),0);
    e._basicDA=(e.nsal||[]).filter(r=>r.code==="1"||r.code==="2").reduce((a,r)=>a+N(r.amt),0);
    /* 1d — income from notified countries (US/UK/CA rows) */
    const d=SAL_NOT89.reduce((a,c)=>a+N(e["n89_"+c[0]]),0);
    const eOther=N(e.oth89a);   /* 1e */
    const fPrev=N(e.prev89a);   /* 1f */
    /* [E7/E33] Gross Salary = 1a+1b+1c+1d+1e+1f */
    e._gross=Math.max(0,R(s+perq+prof+d+eOther+fPrev));
    e._d=R(d); e._e=R(eOther); e._f=R(fPrev);
    gS+=s;gP+=perq;gPr+=prof;g89d+=d;g89e+=eOther;g89f+=fPrev;
    basic+=e._basic; basicDA+=e._basicDA;
    if(_salEntEligible(e.empcat)) entEligible=true;
    if(_salIsGovt(e.empcat))      anyGovt=true;
  });
  /* [E57] Total gross salary from all employers = sum over employers */
  const gross=Math.max(0,R(gS+gP+gPr+g89d+g89e+g89f));

  /* --- HRA 10(13A) working (Section10_13A) --- */
  const H=S.sal.hra||{};
  const salHRA=N(H.salary), aHRA=N(H.hra), rent=N(H.rent);
  const metro=st0(H.place)==="1";
  /* [J72] B = round(rent - 10% of salary) */
  const hraB=R(rent-salHRA*0.10);
  /* [E73] C = 50% (metro) / 40% (non-metro) of salary */
  const hraC=R((metro?0.50:0.40)*salHRA);
  /* [J74] eligible = max(0, min(A,B,C)); [J69] nil under new regime (bacValue=1) */
  const hra13a=isNew()?0:Math.max(0,R(Math.min(aHRA,hraB,hraC)));

  /* --- allowances exempt u/s 10 (rows 60-64) --- */
  let exemptDrop=0;
  (S.sal.alw||[]).forEach(a=>{
    a._ok=!isNew()||SAL_ALW10_NEW.indexOf(a.sec)>=0; /* REGIME.md 10(14) subset only */
    if(a._ok) exemptDrop+=N(a.amt);
  });
  /* [L59] Allowances exempt u/s 10 = SUM(dropdowns) + HRA table output */
  let exempt=R(exemptDrop+hra13a);
  exempt=Math.min(exempt,gross);

  /* relief u/s 89A (3a on sheet, "2a" in the E75 formula) — only if 1d exists */
  const rel89a=(g89d>0)?N(S.sal.rel89a):0;

  /* [L75] Net Salary = max(0, gross - 2a - 3) = gross - rel89a - exempt */
  const net=Math.max(0,R(gross-rel89a-exempt));

  /* [J77] Std deduction 16(ia) = min(net, 75000 new / 50000 old) */
  const d16ia=Math.min(net,isNew()?75000:50000);
  /* 16(ii): closed under new regime; else CG/SG/PSU only, min(5000, entered, 1/5 basic) */
  const ent=(isNew()||!entEligible)?0:Math.min(5000,N(S.sal.ent),Math.floor(basic/5));
  /* 16(iii): closed under new regime; else min(5000, entered) (book cap 5000) */
  const pt=isNew()?0:Math.min(5000,N(S.sal.pt));
  /* [L76] Deduction u/s 16 = 5a+5b+5c */
  const d16=R(d16ia+ent+pt);
  /* [L80] Income chargeable under Salaries = max(0, net - deduction16) */
  const income=Math.max(0,R(net-d16));

  return S.C.sal={gross:R(gross),grossS:R(gS),grossP:R(gP),grossPr:R(gPr),
    n89d:R(g89d),n89e:R(g89e),n89f:R(g89f),
    hraB,hraC,hra13a:R(hra13a),exemptDrop:R(exemptDrop),exempt:R(exempt),
    rel89a:R(rel89a),net:R(net),d16ia:R(d16ia),ent:R(ent),pt:R(pt),d16:R(d16),
    basic:R(basic),basicDA:R(basicDA),entEligible,anyGovt,
    income:R(income)};
}

/* ==================================================================
   RENDERER — secSal()
   ================================================================== */
function secSal(){
  const A=S.C.sal||engSal();
  let h="";
  if(st0(S.pi.status)==="H"){
    h+=note("<b>Schedule S does not apply to an HUF.</b> Salary income is not "+
      "assessable in the hands of a Hindu Undivided Family, so this schedule is "+
      "left blank.","warn");
    return h;
  }
  h+=formNote("Take these from Part B of each Form 16. Add one employer block per "+
    "Form 16 you hold — the return carries an unbounded list of employers.");

  (S.sal.emp||[]).forEach((e,i)=>{
    const g=e._gross||0;
    const status=st0(e.name)?(st0(e.name)+" · "+RS(g)):"not filled";
    let b=sub("The employer");
    b+=row("Name of employer",inp("sal.emp."+i+".name",{max:125}),{req:1});
    b+=row("Nature of employer",sel("sal.emp."+i+".empcat",SAL_EMPCAT,{blank:false}),{req:1});
    b+=row("TAN of employer",inp("sal.emp."+i+".tan",{max:10}),
      {hint:"mandatory if tax is deducted"});
    b+=row("Address of employer",inp("sal.emp."+i+".addr",{max:200}),{req:1});
    b+=row("Town / City",inp("sal.emp."+i+".city",{max:50}),{req:1});
    b+=row("State",sel("sal.emp."+i+".state",SAL_STATE),{req:1});
    b+=row("Pin code",inp("sal.emp."+i+".pin",{max:6}));
    b+=row("Zip code",inp("sal.emp."+i+".zip",{max:8}),{hint:"for a foreign address"});

    b+=sub("Gross salary from this employer");
    const natGrid=(k,opts)=>grid("sal.emp."+i+"."+k,
      [{k:"code",h:"Nature",t:"sel",w:"auto",req:1,opts:opts.map(o=>[o[0],o[1]])},
       {k:"desc",h:"If others, specify",t:"txt",w:"200px"},
       {k:"amt",h:"Amount",t:"num",w:"140px",req:1}],
      e[k]||[],{min:"760px",empty:"No breakup yet — the total stays typeable until a row is added.",add:"Add a nature"});
    b+=fold("nsal_"+i,"1a","Salary as per section 17(1) — nature-wise breakup",
      (e.nsal||[]).length?(e.nsal||[]).length+" rows":"if any",natGrid("nsal",SAL_S17_1));
    b+=row("a — Salary as per section 17(1)",
      (e.nsal||[]).length?cell(N(e.s17_1)):inp("sal.emp."+i+".s17_1",{n:1}),
      {ref:"1a",req:1,hint:(e.nsal||[]).length?"the sum of the rows above":""});
    b+=fold("nperq_"+i,"1b","Value of perquisites as per section 17(2) — nature-wise breakup",
      (e.nperq||[]).length?(e.nperq||[]).length+" rows":"if any",natGrid("nperq",SAL_S17_2));
    b+=row("b — Value of perquisites as per section 17(2)",
      (e.nperq||[]).length?cell(N(e.s17_2)):inp("sal.emp."+i+".s17_2",{n:1}),{ref:"1b",req:1});
    b+=fold("nprof_"+i,"1c","Profit in lieu of salary as per section 17(3) — nature-wise breakup",
      (e.nprof||[]).length?(e.nprof||[]).length+" rows":"if any",natGrid("nprof",SAL_S17_3));
    b+=row("c — Profit in lieu of salary as per section 17(3)",
      (e.nprof||[]).length?cell(N(e.s17_3)):inp("sal.emp."+i+".s17_3",{n:1}),{ref:"1c",req:1});
    b+=row("d — Income from a retirement benefit account in a notified country u/s 89A",
      cell(e._d||0),{ref:"1d",hint:"the sum of the three countries below"});
    SAL_NOT89.forEach(c=>b+=row(c[1],inp("sal.emp."+i+".n89_"+c[0],{n:1}),{ind:1}));
    b+=row("e — Income from a retirement benefit account in a country other than a notified one u/s 89A",
      inp("sal.emp."+i+".oth89a",{n:1}),{ref:"1e"});
    b+=row("f — Income taxable this year on which relief u/s 89A was claimed in an earlier year",
      inp("sal.emp."+i+".prev89a",{n:1}),{ref:"1f"});
    b+=row("Gross Salary (1a + 1b + 1c + 1d + 1e + 1f)",cell(g),{cls:"tot",ref:"1",
      hint:"worked out for you"});
    h+=blk("emp"+i,"Employer "+(i+1)+(st0(e.name)?" — "+st0(e.name):""),status,b,"sal.emp."+i);
  });
  h+='<button class="add" data-addemp="1">Add an employer</button>';

  /* --- summary block: one figure for all employers --- */
  h+=sub("Summary — all employers");
  h+=row("Total gross salary from all employers",cell(A.gross),{cls:"tot",ref:"2",
    hint:"the sum of every employer above"});

  h+=card("s89a","Income claimed for relief from taxation u/s 89A",
    (A.rel89a?F(A.rel89a):""),
    note("The income itself is entered employer by employer above, under 1d/1e/1f. "+
      "Enter here only the amount for which relief u/s 89A is claimed this year. "+
      "It cannot be claimed unless 1d (notified-country income) is non-zero.")+
    row("Income claimed for relief u/s 89A",inp("sal.rel89a",{n:1}),{ref:"3a"}));

  h+=sub("Allowances to the extent exempt u/s 10");
  if(isNew())h+=note("Section 115BAC closes most of these — house rent allowance, "+
    "leave travel concession and the ordinary 10(14) allowances among them. Only the "+
    "115BAC-permitted 10(14) allowances stay exempt; every other row is shown at nil.","warn");
  h+=grid("sal.alw",
    [{k:"sec",h:"Nature of exempt allowance",t:"sel",w:"360px",req:1,
      opts:SAL_ALW10.map(a=>[a[0],a[0]+" — "+a[1]])},
     {k:"desc",h:"Description",t:"txt",w:"180px"},
     {k:"amt",h:"Amount",t:"num",w:"150px",req:1},
     {k:"ok",h:"Exempt",t:"calc",w:"130px",f:r=>r._ok?N(r.amt):0}],
    S.sal.alw,{min:"820px",empty:"No exempt allowance claimed.",add:"Add an allowance"});

  h+=card("hra13a","Section 10(13A) — House Rent Allowance working",
    (A.hra13a?F(A.hra13a):(isNew()?"nil (115BAC)":"")),
    (isNew()?note("House rent allowance is not exempt under the new regime "+
        "(section 115BAC) — the exemption is shown at nil.","warn"):"")+
    row("Place of Residence",sel("sal.hra.place",SAL_PLACE),{req:1})+
    row("Details of salary as per section 17(1) for HRA (basic + DA)",inp("sal.hra.salary",{n:1}),{ref:"E71",req:1})+
    row("Actual HRA received (A)",inp("sal.hra.hra",{n:1}),{ref:"E69",req:1})+
    row("Actual rent paid",inp("sal.hra.rent",{n:1}),{ref:"E70",req:1})+
    row("Actual rent paid − 10% of salary (B)",cell(A.hraB),{ref:"E72"})+
    row((st0(S.sal.hra.place)==="1"?"50%":"40%")+" of salary (C)",cell(A.hraC),{ref:"E73"})+
    row("Eligible exempt allowance u/s 10(13A)",cell(A.hra13a),{cls:"tot",ref:"E74",
      hint:"the least of A, B and C"}));
  h+=row("Total allowances exempt u/s 10",cell(A.exempt),{cls:"tot",ref:"3",
    hint:"the dropdowns above plus the 10(13A) working"});

  h+=row("Net Salary (2 − 2a − 3)",cell(A.net),{cls:"tot",ref:"4"});

  h+=sub("Deduction u/s 16");
  h+=row("a — Standard deduction u/s 16(ia)",cell(A.d16ia),{ref:"5a",
    hint:isNew()?"₹75,000, or the net salary if less":"₹50,000, or the net salary if less"});
  h+=row("b — Entertainment allowance u/s 16(ii)",
    isNew()?cell(0):inp("sal.ent",{n:1}),{ref:"5b",
    hint:isNew()?"closed by section 115BAC":"Central/State Govt or PSU only — up to ₹5,000 or 1/5 of basic"});
  h+=row("c — Professional tax u/s 16(iii)",
    isNew()?cell(0):inp("sal.pt",{n:1}),{ref:"5c",
    hint:isNew()?"closed by section 115BAC":"up to ₹5,000"});
  h+=row("Deduction u/s 16 (5a + 5b + 5c)",cell(A.d16),{cls:"tot",ref:"5"});

  h+=row("Income chargeable under the head 'Salaries' (4 − 5)",cell(A.income),{cls:"grand",ref:"6"});
  return h;
}

/* ==================================================================
   EXPORT — expSal(j): write ScheduleS block onto j
   ================================================================== */
function expSal(j){
  const A=S.C.sal||engSal();
  if(st0(S.pi.status)==="H") return;              /* HUF: Schedule S blank */
  if(!(A.income||A.gross)) return;                /* nothing to write */

  const sch={
    Salaries:(S.sal.emp||[]).filter(e=>e._gross).map(e=>{
      const o={
        NameOfEmployer:(sv(e.name)||"NA").slice(0,125),
        NatureOfEmployment:SAL_EMPCAT.some(c=>c[0]===e.empcat)?e.empcat:"OTH",
        AddressDetail:{
          AddrDetail:(sv(e.addr)||sv(e.city)||"NA").slice(0,200),
          CityOrTownOrDistrict:(sv(e.city)||"NA").slice(0,50),
          StateCode:SAL_STATE.some(s=>s[0]===st0(e.state))?st0(e.state):"19"
        },
        Salarys:(()=>{
          const sy={
            GrossSalary:n0(e._gross),
            Salary:n0(e.s17_1),
            ValueOfPerquisites:n0(e.s17_2),
            ProfitsinLieuOfSalary:n0(e.s17_3)
          };
          const nat=(arr,valid)=>{
            const rows=(arr||[]).filter(r=>N(r.amt));
            if(!rows.length) return undefined;
            return {OthersIncDtls:rows.map(r=>{
              const q={NatureDesc:valid.some(x=>x[0]===r.code)?r.code:"OTH",OthAmount:n0(r.amt)};
              if(q.NatureDesc==="OTH") q.OthNatOfInc=(sv(r.desc)||"Others").slice(0,50);
              return q;})};
          };
          const n1=nat(e.nsal,SAL_S17_1),n2=nat(e.nperq,SAL_S17_2),n3=nat(e.nprof,SAL_S17_3);
          if(n1) sy.NatureOfSalary=n1;
          if(n2) sy.NatureOfPerquisites=n2;
          if(n3) sy.NatureOfProfitInLieuOfSalary=n3;
          if(e._d) sy.IncomeNotified89A=n0(e._d);
          const cc=SAL_NOT89.filter(c=>N(e["n89_"+c[0]])).map(c=>({
            NOT89ACountrycode:c[0],NOT89AAmount:n0(e["n89_"+c[0]])}));
          if(cc.length) sy.IncomeNotified89AType=cc;
          if(e._e) sy.IncomeNotifiedOther89A=n0(e._e);
          if(e._f) sy.IncomeNotifiedPrYr89A=n0(e._f);
          return sy;
        })()
      };
      if(TAN_RE.test(st0(e.tan).toUpperCase())) o.TANofEmployer=st0(e.tan).toUpperCase();
      if(/^[1-9]\d{5}$/.test(st0(e.pin))) o.AddressDetail.PinCode=parseInt(e.pin,10);
      if(sv(e.zip)) o.AddressDetail.ZipCode=st0(e.zip).slice(0,8);
      return o;
    })
  };
  /* required root totals — present even at zero */
  sch.TotalGrossSalary=n0(A.gross);
  sch.AllwncExtentExemptUs10=n0(A.exempt);
  sch.NetSalary=n0(A.net);
  sch.DeductionUS16=n0(A.d16);
  sch.DeductionUnderSection16ia=n0(A.d16ia);
  sch.EntertainmntalwncUs16ii=n0(A.ent);
  sch.ProfessionalTaxUs16iii=n0(A.pt);
  sch.TotIncUnderHeadSalaries=n0(A.income);
  if(A.rel89a) sch.Increliefus89A=n0(A.rel89a);

  /* exempt-allowance breakup (only the rows the regime allows) */
  const al=(S.sal.alw||[]).filter(a=>a._ok&&N(a.amt));
  const dtls=al.map(a=>{
    const q={SalNatureDesc:SAL_ALW10.some(x=>x[0]===a.sec)?a.sec:"10(17)",SalOthAmount:n0(a.amt)};
    if(sv(a.desc)) q.SalOthNatOfInc=st0(a.desc).slice(0,50);
    return q;});
  /* HRA 10(13A) is itself a drop-down row: aggregate AllwncExtentExemptUs10 = dropdowns + HRA,
     so the 10(13A) exemption must appear here too (rules A38/A162). */
  if(!isNew()&&N(A.hra13a)&&!dtls.some(q=>q.SalNatureDesc==="10(13A)"))
    dtls.push({SalNatureDesc:"10(13A)",SalOthAmount:n0(A.hra13a)});
  if(dtls.length) sch.AllwncExemptUs10={AllwncExemptUs10Dtls:dtls};

  /* Section10_13A HRA object — only when it carries a working (old regime) */
  const H=S.sal.hra||{};
  if(!isNew()&&(N(H.hra)||N(H.rent)||N(H.salary))) sch.Section10_13A={
    Placeofwork:SAL_PLACE.some(p=>p[0]===st0(H.place))?st0(H.place):"2",
    ActlHRARecv:n0(H.hra),
    ActlRentPaid:n0(H.rent),
    DtlsSalUsSec171:n0(H.salary),
    ActlRentPaid10Per:n0(A.hraB),
    Sal40Or50Per:n0(A.hraC),
    EligbleExmpAllwncUs13A:n0(A.hra13a)
  };

  put(j,"ScheduleS",sch);
}

/* ==================================================================
   IMPORT — impSal(I3): read ScheduleS back into S.sal
   ================================================================== */
function impSal(I3){
  const got=[];
  const g_=(o,p)=>{try{return p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);}catch(e){return undefined;}};
  const sc=I3&&I3.ScheduleS;
  if(!sc) return got;
  const back=n=>(g_(n,"OthersIncDtls")||[]).map(r=>({code:r.NatureDesc,desc:r.OthNatOfInc||"",amt:r.OthAmount}));
  S.sal.emp=(sc.Salaries||[]).map(e=>{
    const sy=e.Salarys||{};
    const o={name:e.NameOfEmployer||"",empcat:e.NatureOfEmployment||"OTH",tan:e.TANofEmployer||"",
      addr:g_(e,"AddressDetail.AddrDetail")||"",city:g_(e,"AddressDetail.CityOrTownOrDistrict")||"",
      state:g_(e,"AddressDetail.StateCode")||"",pin:nz(g_(e,"AddressDetail.PinCode"))+"",
      zip:g_(e,"AddressDetail.ZipCode")||"",
      s17_1:nz(sy.Salary),s17_2:nz(sy.ValueOfPerquisites),s17_3:nz(sy.ProfitsinLieuOfSalary),
      oth89a:nz(sy.IncomeNotifiedOther89A),prev89a:nz(sy.IncomeNotifiedPrYr89A)};
    (sy.IncomeNotified89AType||[]).forEach(c=>o["n89_"+c.NOT89ACountrycode]=c.NOT89AAmount);
    o.nsal=back(sy.NatureOfSalary);
    o.nperq=back(sy.NatureOfPerquisites);
    o.nprof=back(sy.NatureOfProfitInLieuOfSalary);
    return o;
  });
  /* 10(13A) is re-derived from the Section10_13A HRA working on export, not a manual
     allowance row — drop it here so it is not double-counted on re-export (round-trip). */
  S.sal.alw=(g_(sc,"AllwncExemptUs10.AllwncExemptUs10Dtls")||[]).filter(a=>a.SalNatureDesc!=="10(13A)").map(a=>({
    sec:a.SalNatureDesc,desc:a.SalOthNatOfInc||"",amt:a.SalOthAmount}));
  const H=sc.Section10_13A;
  if(H) S.sal.hra={place:H.Placeofwork||"",salary:nz(H.DtlsSalUsSec171),
    hra:nz(H.ActlHRARecv),rent:nz(H.ActlRentPaid)};
  S.sal.rel89a=nz(sc.Increliefus89A);
  S.sal.ent=nz(sc.EntertainmntalwncUs16ii);
  S.sal.pt=nz(sc.ProfessionalTaxUs16iii);
  got.push("Schedule S (salary)");
  return got;
}

/* ==================================================================
   CHECKS — chkSal(): the sheet's own rules as live messages
   ================================================================== */
function chkSal(){
  const out=[],A=S.C.sal||engSal();
  const add=(lvl,t,m)=>out.push({lvl,t,m,sec:"sal"});

  if(st0(S.pi.status)==="H"){
    if((S.sal.emp||[]).some(e=>e._gross))
      add("err","Schedule S — HUF","Salary income cannot be shown for an HUF; Schedule S must be blank.");
    return out;
  }

  (S.sal.emp||[]).forEach((e,i)=>{
    const nm="Employer "+(i+1);
    if(e._gross&&!st0(e.name)) add("err",nm+" — name","Name of employer is required.");
    if(e._gross&&!SAL_EMPCAT.some(c=>c[0]===e.empcat)) add("err",nm+" — nature","Nature of employer is required.");
    if(e._gross&&!st0(e.addr)) add("warn",nm+" — address","Address of employer is required.");
    if(e._gross&&!st0(e.city)) add("warn",nm+" — city","Town/City of employer is required.");
    if(e._gross&&!st0(e.state)) add("warn",nm+" — state","State of employer is required.");
    if(st0(e.tan)&&!TAN_RE.test(st0(e.tan).toUpperCase()))
      add("err",nm+" — TAN","TAN must be 4 letters, 5 digits and 1 letter.");
    if(st0(e.pin)&&!/^[1-9]\d{5}$/.test(st0(e.pin)))
      add("warn",nm+" — PIN","Pin code must be six digits (100000–999999).");
    /* 'Others' rows must name the nature */
    [["nsal","1a"],["nperq","1b"],["nprof","1c"]].forEach(([k,ref])=>
      (e[k]||[]).forEach((r,n)=>{if(N(r.amt)&&r.code==="OTH"&&!st0(r.desc))
        add("err",nm+" — "+ref,"Row "+(n+1)+" is 'Others' — specify the nature.");}));
  });

  /* relief u/s 89A only if 1d exists (book) */
  if(N(S.sal.rel89a)&&!A.n89d)
    add("err","Relief u/s 89A","Relief cannot be claimed unless income from a notified country (1d) is entered.");

  /* 16(ii) — CG/SG/PSU only (book) */
  if(!isNew()&&N(S.sal.ent)&&!A.entEligible)
    add("err","Entertainment allowance 16(ii)","Allowed only to a Central/State Government or Public Sector Undertaking employee — remove it.");

  /* caps carried by the schedule (book) */
  (S.sal.alw||[]).forEach((a,n)=>{
    if(a.sec==="10(10C)"&&N(a.amt)>500000)
      add("warn","10(10C)","Voluntary retirement exemption cannot exceed ₹5,00,000.");
    if(a.sec==="10(10B)(ii)"&&N(a.amt)>500000)
      add("warn","10(10B)(ii)","Compensation exemption under the second proviso cannot exceed ₹5,00,000.");
    if(a.sec==="10(10)"&&N(a.amt)>(A.anyGovt?2500000:2000000))
      add("warn","10(10)","Gratuity exemption cannot exceed "+(A.anyGovt?"₹25,00,000":"₹20,00,000")+".");
  });

  /* regime closures — warn when a closed item still carries a value (REGIME.md) */
  if(isNew()){
    if(N(S.sal.ent)) add("warn","16(ii) — new regime","Entertainment allowance is closed by section 115BAC; it is treated as nil.");
    if(N(S.sal.pt))  add("warn","16(iii) — new regime","Professional tax is closed by section 115BAC; it is treated as nil.");
    if((S.sal.hra&&(N(S.sal.hra.hra)||N(S.sal.hra.rent))))
      add("warn","10(13A) — new regime","House rent allowance is not exempt under section 115BAC; the exemption is nil.");
    (S.sal.alw||[]).forEach(a=>{if(N(a.amt)&&SAL_ALW10_NEW.indexOf(a.sec)<0)
      add("warn","Exempt allowance — new regime",(a.sec||"An allowance")+" is not exempt under section 115BAC; it is treated as nil.");});
  }

  if(A.income&&!out.some(x=>x.lvl==="err"))
    add("ok","Salary","Income chargeable under 'Salaries' is "+RS(A.income)+".");
  return out;
}

/* ---- register ---- */
reg({id:"sal",t:"Salary",ref:"Schedule S",f:secSal,
  s:()=>{const A=S.C.sal;return A&&A.income?RS(A.income):"";},
  eng:engSal,exp:expSal,imp:impSal,chk:chkSal,order:10});
