/* =====================================================================
   ITR-1 · Section "sal" — Salary income
   Screen ref: Income Details sheet, salary block + Schedule EA 10(13A).
   Compute order 30, screen order 30.

   Built from books/ITR-1/schema_tree.md §7.1/§7.2 (salary head +
   AllwncExemptUs10) and §19.9 (ScheduleEA10_13A), caps.md §2 (16(ia))
   and §1 (the 115BAC bar on section-10 allowances), enums.json
   (AllwncExemptUs10_SalNatureDesc, Placeofwork_EA_10_13A) and the prev
   engine engSal() in forms/ITR-1/Yukti_ITR1_prev.html — with the caps.md
   fixes applied.

   Owns / writes on export (no other builder writes these leaves):
     ITR1_IncomeDeductions.
       GrossSalary, Salary, PerquisitesValue, ProfitsInSalary,
       NetSalary, DeductionUs16, DeductionUs16ia, EntertainmentAlw16ii,
       ProfessionalTaxUs16iii, IncomeFromSal,
       AllwncExemptUs10.{AllwncExemptUs10Dtls[], TotalAllwncExemptUs10}
     ScheduleEA10_13A.{Placeofwork, ActlHRARecv, ActlRentPaid,
       DtlsSalUsSec171, BasicSalary, DearnessAllwnc, ActlRentPaid10Per,
       Sal40Or50Per, EligbleExmpAllwncUs13A}   (OLD regime & empcat<>NA)

   Publishes S.C.sal.{netSalary, incomeFromSal, ...}. netSalary drives the
   80CCD percentage-of-salary caps in the deductions section.
   Reads S.C.ret.regime (regime) and S.C.who.senior, and PersonalInfo's
   EmployerCategory (S.pi.empcat) for the HRA gate and the 16(ii) govt test.

   caps.md fixes over the prev builder:
     · 16(ia) std deduction = MIN(NetSalary, 75000 new / 50000 old).
     · New regime offers ONLY the 115BAC-permitted section-10 subset —
       10(5) and 10(17) are NOT in the new list (prev bug D-note).
     · HRA 10(13A) is computed here from the ScheduleEA10_13A least-of rule
       and auto-added as an AllwncExemptUs10 row (prev had no such schedule).
   ===================================================================== */

/* ---- section-10 allowances (code -> label), 10(13A) excluded here
        because it is auto-computed from the HRA schedule below --------- */
const _SAL_ALW=[
 ["10(5)","Leave travel concession or assistance"],
 ["10(6)","Remuneration of an official of an embassy or consulate"],
 ["10(7)","Allowances or perquisites paid by the Government outside India"],
 ["10(10)","Death-cum-retirement gratuity"],
 ["10(10A)","Commuted value of pension"],
 ["10(10AA)","Leave encashment on retirement"],
 ["10(10B)(i)","Compensation on retrenchment — limit notified by the Central Government"],
 ["10(10B)(ii)","Compensation on retrenchment — scheme approved by the Central Government"],
 ["10(10C)","Amount received on voluntary retirement"],
 ["10(10CC)","Tax on a non-monetary perquisite paid by the employer"],
 ["10(14)(i)","Allowance to meet expenses in the course of duty"],
 ["10(14)(ii)","Allowance for personal expenses at the place of duty"],
 ["10(14)(i)(115BAC)","Rule 2BB(1)(a)-(c) allowances (permitted under the new regime)"],
 ["10(14)(ii)(115BAC)","Transport allowance to a disabled employee (permitted under the new regime)"],
 ["10(17)","Allowance to a Member of Parliament, MLA or MLC"],
 ["EIC","Exempt income of a judge (Supreme/High Court Judges Act)"]];
/* section 115BAC(1A) leaves ONLY this subset standing — 10(5)/10(17)
   were WRONGLY included by the prev builder; they are removed here. */
const _SAL_ALW_NEW=["10(6)","10(7)","10(10)","10(10A)","10(10AA)","10(10C)","10(10CC)",
 "10(14)(i)(115BAC)","10(14)(ii)(115BAC)","EIC"];
const _SAL_METRO=[["1","A metro — Delhi, Mumbai, Kolkata or Chennai (50% of salary)"],
 ["2","Anywhere else (40% of salary)"]];

/* ---- regime / age / employer, read from the cross-section scalars ---- */
function _salIsOld(){
  const r=RG(S,"C.ret.regime","");
  if(r==="old"||r==="Old"||r==="OLD"||r==="Y"||r==="y"||r===2||r==="2")return true;
  if(r==="new"||r==="New"||r==="NEW"||r==="N"||r==="n"||r===1||r==="1")return false;
  if(typeof isNew==="function"){try{return !isNew();}catch(e){}}
  return false;                                   /* AY2026-27 default = new */
}
function _salIsNew(){return !_salIsOld();}
function _salEmpcat(){return st0(RG(S,"pi.empcat","")).toUpperCase()||"OTH";}
function _salGovt(){const e=_salEmpcat();return e==="CGOV"||e==="SGOV";}

/* ---- state seed (never clobber shell / import) --------------------- */
S.sal=S.sal||{};
if(S.sal.hra===undefined)S.sal.hra={place:"2"};
S.alw=S.alw||[];

/* ---- engine -------------------------------------------------------- */
function engSal(){
  S.C=S.C||{};
  const sl=S.sal||{}, g=k=>N(sl[k]);
  const gross=Math.max(0, g("s17_1")+g("s17_2")+g("s17_3"));
  const isNewR=_salIsNew();
  const ok=isNewR?(c=>_SAL_ALW_NEW.indexOf(c)>=0)
                 :(c=>_SAL_ALW.some(a=>a[0]===c));
  let manualExempt=0;
  (S.alw||[]).forEach(a=>{a._ok=(a.sec!=="10(13A)")&&!!ok(a.sec);
    if(a._ok)manualExempt+=n0(a.amt);});

  /* HRA 10(13A) — OLD regime and a real employer only (caps.md §1, sec plan S3) */
  const hraOn=_salIsOld() && _salEmpcat()!=="NA";
  const hra=sl.hra||{};
  let hraDet=null, hraElig=0;
  if(hraOn){
    const base=n0(hra.basic)+n0(hra.da);                /* salary for HRA = basic + DA */
    const metro=st0(hra.place)==="1";
    const rentLess10=Math.max(0, n0(hra.rent)-R(0.10*base));
    const pct=R((metro?0.50:0.40)*base);
    hraElig=Math.max(0, Math.min(n0(hra.hra), rentLess10, pct));
    hraDet={metro,base,rentLess10,pct,elig:hraElig};
  }

  /* 1iii  net = MAX(0, gross - MIN(exempt, gross)) */
  let exempt=manualExempt+hraElig;
  exempt=Math.min(exempt, gross);
  const net=Math.max(0, gross-exempt);

  /* 16(ia) std deduction = MIN(net, 75000 new / 50000 old) [caps.md §2] */
  const d16ia=Math.min(net, isNewR?75000:50000);
  /* 16(ii) entertainment — Government employees only, ceiling ₹5,000, old regime */
  const ent=(!isNewR && _salGovt())?Math.min(5000, n0(sl.ent)):0;
  /* 16(iii) professional tax — actual, old regime only */
  const pt=(!isNewR)?n0(sl.pt):0;
  const d16=Math.max(0, d16ia+ent+pt);
  const income=Math.max(0, net-d16);

  S.C.sal={netSalary:net, incomeFromSal:income, income:income,   /* income = alias the ded 80G / income-cap base reads (S.C.sal.income) */
    gross, manualExempt, hraElig, hraDet, hraOn, exempt,
    d16ia, ent, pt, d16, isNew:isNewR, govt:_salGovt(), empNA:_salEmpcat()==="NA"};
  return S.C.sal;
}

/* ---- renderer ------------------------------------------------------ */
function secSal(){
  const A=S.C.sal||engSal();
  const isNewR=A.isNew;
  let h="";

  h+=sub("Salary as per section 17");
  h+=row("Salary under section 17(1)",inp("sal.s17_1",{n:1}),{req:1,ref:"1(a)"});
  h+=row("Value of perquisites under section 17(2)",inp("sal.s17_2",{n:1}),{ref:"1(b)"});
  h+=row("Profits in lieu of salary under section 17(3)",inp("sal.s17_3",{n:1}),{ref:"1(c)"});
  h+=row("Gross salary",cell(A.gross),{cls:"tot",ref:"1"});

  /* --- allowances exempt u/s 10 --- */
  h+=sub("Allowances exempt under section 10");
  const opts=isNewR?_SAL_ALW.filter(a=>_SAL_ALW_NEW.indexOf(a[0])>=0):_SAL_ALW;
  h+=grid("alw",[{k:"sec",h:"Nature of the allowance",t:"sel",w:"auto",req:1,opts},
    {k:"amt",h:"Amount exempt",t:"num",w:"190px",req:1}],
    S.alw,{min:"620px",empty:"No allowance exempt under section 10.",add:"Add an allowance"});
  if(isNewR)
    h+=note("Under the new regime only the allowances permitted by section 115BAC are exempt. "+
      "Leave travel concession (10(5)), house rent allowance (10(13A)) and the legislator's "+
      "allowance (10(17)) are not among them.");
  if(A.hraOn && A.hraElig)
    h+=note("House rent allowance under 10(13A) of "+RS(A.hraElig)+" is added automatically from the "+
      "schedule below.","form");

  /* --- HRA 10(13A) schedule (old regime, real employer) --- */
  if(A.hraOn){
    const d=A.hraDet||{};
    h+=card("hpea","Schedule EA 10(13A) — house rent allowance exemption",
      (A.hraElig?F(A.hraElig):""),
      row("Place of work",sel("sal.hra.place",_SAL_METRO,{blank:false}),{req:1})+
      row("Basic salary",inp("sal.hra.basic",{n:1}),{req:1})+
      row("Dearness allowance forming part of pay",inp("sal.hra.da",{n:1}))+
      row("Salary as per section 17(1) for the schedule",inp("sal.hra.sal17",{n:1}),
        {hint:"defaults to the 17(1) salary above when left blank"})+
      row("House rent allowance actually received",inp("sal.hra.hra",{n:1}),{req:1})+
      row("Rent paid in the year",inp("sal.hra.rent",{n:1}),{req:1})+
      row("Rent paid less ten per cent of salary",cell(d.rentLess10),{ind:1})+
      row((d.metro?"Fifty":"Forty")+" per cent of salary",cell(d.pct),{ind:1})+
      row("Exemption eligible under 10(13A)",cell(d.elig),{cls:"grand",
        hint:"the least of the allowance received, rent less 10% of salary, and 50%/40% of salary"}));
  } else if(_salIsOld() && A.empNA){
    h+=note("The employer category is 'Not Applicable', so the house rent allowance schedule "+
      "does not apply.");
  }

  /* --- deductions u/s 16 --- */
  h+=sub("Deductions under section 16");
  h+=row("Net salary",cell(A.netSalary),{cls:"tot",ref:"2"});
  h+=row("Standard deduction under section 16(ia)",cell(A.d16ia),
    {ref:"3(a)",hint:isNewR?"least of net salary and ₹75,000":"least of net salary and ₹50,000"});
  h+=row("Entertainment allowance under section 16(ii)",
    isNewR?cell(0):inp("sal.ent",{n:1}),
    {ref:"3(b)",hint:isNewR?"closed under the new regime":
      (A.govt?"Government employees only, up to ₹5,000":"allowed to Government employees only")});
  h+=row("Professional tax under section 16(iii)",
    isNewR?cell(0):inp("sal.pt",{n:1}),
    {ref:"3(c)",hint:isNewR?"closed under the new regime":"tax on employment actually paid"});
  h+=row("Total deduction under section 16",cell(A.d16),{cls:"tot",ref:"3"});
  h+=row("Income chargeable under the head salaries",cell(A.incomeFromSal),{cls:"grand",ref:"4"});
  return h;
}

/* ---- export -------------------------------------------------------- */
function expSal(j){
  const A=S.C.sal||engSal();
  const sl=S.sal||{};
  const ID=j.ITR1_IncomeDeductions;
  put(ID,"GrossSalary",n0(A.gross));
  put(ID,"Salary",n0(sl.s17_1));
  put(ID,"PerquisitesValue",n0(sl.s17_2));
  put(ID,"ProfitsInSalary",n0(sl.s17_3));

  /* AllwncExemptUs10 — manual rows plus the auto HRA 10(13A) row */
  const dtls=[];
  (S.alw||[]).forEach(a=>{if(a._ok && n0(a.amt))dtls.push({SalNatureDesc:a.sec,SalOthAmount:n0(a.amt)});});
  if(A.hraOn && n0(A.hraElig))dtls.push({SalNatureDesc:"10(13A)",SalOthAmount:n0(A.hraElig)});
  if(dtls.length){
    ID.AllwncExemptUs10={AllwncExemptUs10Dtls:dtls, TotalAllwncExemptUs10:n0(A.exempt)};
  }

  put(ID,"NetSalary",n0(A.netSalary));
  put(ID,"DeductionUs16",n0(A.d16));
  put(ID,"DeductionUs16ia",n0(A.d16ia));
  put(ID,"EntertainmentAlw16ii",n0(A.ent));       /* required leaf — written even at 0 */
  put(ID,"ProfessionalTaxUs16iii",n0(A.pt));      /* required leaf — written even at 0 */
  put(ID,"IncomeFromSal",n0(A.incomeFromSal));

  /* ScheduleEA10_13A — OLD regime & employer <> NA & an HRA figure present */
  if(A.hraOn && A.hraDet && (n0((sl.hra||{}).hra) || n0(A.hraElig))){
    const hra=sl.hra||{}, d=A.hraDet;
    j.ScheduleEA10_13A={
      Placeofwork:d.metro?"1":"2",
      ActlHRARecv:n0(hra.hra),
      ActlRentPaid:n0(hra.rent),
      DtlsSalUsSec171:n0(hra.sal17)||n0(sl.s17_1),
      BasicSalary:n0(hra.basic),
      DearnessAllwnc:n0(hra.da),
      ActlRentPaid10Per:n0(d.rentLess10),
      Sal40Or50Per:n0(d.pct),
      EligbleExmpAllwncUs13A:n0(d.elig)};
  }
}

/* ---- import (inverse) ---------------------------------------------- */
function impSal(I){
  const read=[]; const ID=I&&I.ITR1_IncomeDeductions;
  S.sal=S.sal||{};
  if(ID){
    if(ID.Salary!=null){S.sal.s17_1=ID.Salary;read.push("salary 17(1)");}
    if(ID.PerquisitesValue!=null)S.sal.s17_2=ID.PerquisitesValue;
    if(ID.ProfitsInSalary!=null)S.sal.s17_3=ID.ProfitsInSalary;
    if(ID.EntertainmentAlw16ii!=null)S.sal.ent=ID.EntertainmentAlw16ii;
    if(ID.ProfessionalTaxUs16iii!=null)S.sal.pt=ID.ProfessionalTaxUs16iii;
    const al=ID.AllwncExemptUs10&&ID.AllwncExemptUs10.AllwncExemptUs10Dtls;
    if(Array.isArray(al)&&al.length){
      S.alw=al.filter(a=>a.SalNatureDesc!=="10(13A)")
             .map(a=>({sec:a.SalNatureDesc,amt:a.SalOthAmount}));
      read.push("allowances exempt u/s 10");
    }
  }
  const ea=I&&I.ScheduleEA10_13A;
  if(ea){
    S.sal.hra=S.sal.hra||{};
    S.sal.hra.place=String(ea.Placeofwork)==="1"?"1":"2";
    if(ea.ActlHRARecv!=null)S.sal.hra.hra=ea.ActlHRARecv;
    if(ea.ActlRentPaid!=null)S.sal.hra.rent=ea.ActlRentPaid;
    if(ea.DtlsSalUsSec171!=null)S.sal.hra.sal17=ea.DtlsSalUsSec171;
    if(ea.BasicSalary!=null)S.sal.hra.basic=ea.BasicSalary;
    if(ea.DearnessAllwnc!=null)S.sal.hra.da=ea.DearnessAllwnc;
    read.push("HRA exemption 10(13A)");
  }
  return read;
}

/* ---- checks (section-local sanity, not the CBDT rule engine) ------- */
function chkSal(){
  const out=[]; const A=engSal(); const sl=S.sal||{};
  /* allowances must be within gross salary */
  if(A.manualExempt+A.hraElig>A.gross && A.gross>0)
    out.push({lvl:"warn",t:"Exempt allowances",m:"The allowances exempt under section 10 exceed the gross salary; they have been limited to the salary.",sec:"sal"});
  /* stray allowance rows disallowed under the new regime */
  if(A.isNew){
    const lost=(S.alw||[]).filter(a=>n0(a.amt) && _SAL_ALW_NEW.indexOf(a.sec)<0 && a.sec!=="10(13A)");
    if(lost.length)
      out.push({lvl:"warn",t:"Allowances under the new regime",m:"Some allowances entered are not exempt under section 115BAC and will not be carried to the return.",sec:"sal"});
  }
  /* rows without a nature or amount */
  (S.alw||[]).forEach((a,i)=>{
    if(n0(a.amt) && !st0(a.sec))
      out.push({lvl:"err",t:"Allowance row "+(i+1),m:"Choose the nature of the allowance exempt under section 10.",sec:"sal"});
  });
  /* entertainment allowance only for Government employees */
  if(!A.isNew && n0(sl.ent) && !A.govt)
    out.push({lvl:"warn",t:"Entertainment allowance",m:"The section 16(ii) entertainment allowance is available only to Government employees; it has not been allowed.",sec:"sal"});
  /* HRA schedule sanity */
  if(A.hraOn){
    const hra=sl.hra||{};
    if(n0(hra.hra) && !n0(hra.rent))
      out.push({lvl:"warn",t:"House rent allowance",m:"No rent paid is entered, so no HRA exemption under 10(13A) is available.",sec:"sal"});
    if(n0(hra.hra) && !(n0(hra.basic)+n0(hra.da)))
      out.push({lvl:"warn",t:"House rent allowance",m:"Enter the basic salary (and dearness allowance) to work out the HRA exemption.",sec:"sal"});
  }
  if(!out.length && A.incomeFromSal)
    out.push({lvl:"ok",t:"Salary",m:"Income chargeable under salaries is "+RS(A.incomeFromSal)+
      " after "+RS(A.d16)+" of section-16 deductions.",sec:"sal"});
  return out;
}

/* ---- register (overrides the boot stub) ---------------------------- */
reg({id:"sal", t:"Salary income", ref:"Income Details · salary", f:secSal, s:()=>{
    const A=S.C.sal||{}; return A.incomeFromSal?RS(A.incomeFromSal):"";},
  eng:engSal, exp:expSal, imp:impSal, chk:chkSal, order:30, corder:30});
