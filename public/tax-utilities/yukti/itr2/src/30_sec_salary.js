/* ==================================================================
   4 · ENGINES
   ================================================================== */
/* ---- salary: full per-employer schedule, 89A per employer ------- */
function engSal(){
  if(!S.sal.emp||!S.sal.emp.length)S.sal.emp=[{empcat:"OTH"}];
  let gS=0,gP=0,gPr=0,g89d=0,g89e=0,g89f=0;
  S.sal.emp.forEach(e=>{
    const sumOf=arr=>(arr||[]).reduce((a,r)=>a+N(r.amt),0);
    if((e.n17_1||[]).length)e.s17_1=sumOf(e.n17_1);if((e.n17_2||[]).length)e.s17_2=sumOf(e.n17_2);if((e.n17_3||[]).length)e.s17_3=sumOf(e.n17_3);
    e._basicDA=(e.n17_1||[]).filter(r=>r.code==="1"||r.code==="2").reduce((a,r)=>a+N(r.amt),0);
    e._basic=(e.n17_1||[]).filter(r=>r.code==="1").reduce((a,r)=>a+N(r.amt),0);
    e._hra=(e.n17_1||[]).filter(r=>r.code==="4").reduce((a,r)=>a+N(r.amt),0);
    const s=N(e.s17_1),perq=N(e.s17_2),prof=N(e.s17_3);
    /* 1d — income from a notified country, the sum of its country rows */
    const d=NOTIFIED89.reduce((a,c)=>a+N(e["n89a_"+c[0]]),0);
    const eOther=N(e.n89a_other);   /* 1e */
    const fPrev=N(e.n89a_prev);     /* 1f */
    /* the employer's gross salary is 1a+1b+1c+1d+1e+1f */
    e._gross=Math.max(0,s+perq+prof+d+eOther+fPrev);
    e._d=d; e._e=eOther; e._f=fPrev;
    gS+=s;gP+=perq;gPr+=prof;g89d+=d;g89e+=eOther;g89f+=fPrev;
  });
  const basicDA=S.sal.emp.reduce((a,e)=>a+(e._basicDA||0),0),basic=S.sal.emp.reduce((a,e)=>a+(e._basic||0),0),anyGovt=S.sal.emp.some(e=>e.empcat==="CG"||e.empcat==="SG");
  const gross=Math.max(0,gS+gP+gPr+g89d+g89e+g89f);
  let exempt=0;
  S.alw.forEach(a=>{a._ok=!isNew()||ALW10_NEW.indexOf(a.sec)>=0;if(a._ok)exempt+=N(a.amt);});
  exempt=Math.min(exempt,gross);
  const rel89a=N(S.sal.rel89a);
  const net=Math.max(0,gross-exempt-rel89a);
  const d16ia=Math.min(net,isNew()?75000:50000);
  /* 16(ii): government employees only, the lower of 5,000 and a fifth of basic (rules A35, A36) */
  const ent=(isNew()||!anyGovt)?0:Math.min(5000,N(S.sal.ent),Math.floor(basic/5));
  const pt=isNew()?0:Math.min(5000,N(S.sal.pt));
  return {gross:R(gross),grossS:R(gS),grossP:R(gP),grossPr:R(gPr),
    n89d:R(g89d),n89e:R(g89e),n89f:R(g89f),
    exempt:R(exempt),rel89a:R(rel89a),net:R(net),d16ia:R(d16ia),ent:R(ent),pt:R(pt),basicDA:R(basicDA),basic:R(basic),anyGovt,
    d16:R(d16ia+ent+pt),income:R(Math.max(0,net-d16ia-ent-pt))};
}


/* ---------------- 3 · Salary — the full schedule ----------------- */
function secSal(){
  const A=S.C.sal;let h="";
  h+=formNote("Take these from Part B of Form 16. A separate block for each employer, "+
    "as the return requires — add one per Form 16 you hold.");
  if(!S.sal.emp||!S.sal.emp.length)S.sal.emp=[{empcat:"OTH"}];
  S.sal.emp.forEach((e,i)=>{
    const g=e._gross||0;
    const cat=(EMPCAT.find(c=>c[0]===e.empcat)||["","—"])[1];
    const status=st0(e.name)?(st0(e.name)+" · "+RS(g)):"not filled";
    let b=sub("The employer");
    b+=row("Name of the employer",inp("sal.emp."+i+".name"),{req:1});
    b+=row("Nature of employment",sel("sal.emp."+i+".empcat",EMPCAT,{blank:false}),{req:1});
    b+=row("TAN of the employer",inp("sal.emp."+i+".tan",{max:10}),
      {hint:"as on Form 16 — needed to match the TDS"});
    b+=row("Town or city of the employer",inp("sal.emp."+i+".city"));
    b+=row("State",sel("sal.emp."+i+".state",Object.keys(STATE).map(k=>[k,STATE[k]])));
    b+=row("PIN code",inp("sal.emp."+i+".pin",{max:6}));
    b+=sub("Salary from this employer");
    const natGrid=(k,opts,label)=>grid("sal.emp."+i+"."+k,[{k:"code",h:"Nature",t:"sel",w:"auto",req:1,opts:opts},{k:"desc",h:"If others, specify",t:"txt",w:"200px"},{k:"amt",h:"Amount",t:"num",w:"140px",req:1}],
      e[k]||[],{min:"760px",empty:"No breakup yet — the total below stays typeable until a row is added.",add:"Add a nature"});
    b+=fold("n17_1_"+i,"1a","Salary as per section 17(1) — nature-wise breakup (the form requires it)",(e.n17_1||[]).length?(e.n17_1||[]).length+" rows":"required",natGrid("n17_1",S17_1));
    b+=row("Salary as per section 17(1) — total",(e.n17_1||[]).length?cell(N(e.s17_1)):inp("sal.emp."+i+".s17_1",{n:1}),{ref:"1a",req:1,
      hint:(e.n17_1||[]).length?"the sum of the rows above":"add the breakup above — the portal rejects a 17(1) figure without it"});
    b+=fold("n17_2_"+i,"1b","Value of perquisites as per section 17(2) — nature-wise breakup",(e.n17_2||[]).length?(e.n17_2||[]).length+" rows":"if any",natGrid("n17_2",S17_2));
    b+=row("Value of perquisites as per section 17(2) — total",(e.n17_2||[]).length?cell(N(e.s17_2)):inp("sal.emp."+i+".s17_2",{n:1}),{ref:"1b"});
    b+=fold("n17_3_"+i,"1c","Profit in lieu of salary as per section 17(3) — nature-wise breakup",(e.n17_3||[]).length?(e.n17_3||[]).length+" rows":"if any",natGrid("n17_3",S17_3));
    b+=row("Profit in lieu of salary as per section 17(3) — total",(e.n17_3||[]).length?cell(N(e.s17_3)):inp("sal.emp."+i+".s17_3",{n:1}),{ref:"1c"});
    b+=row("Income from a retirement benefit account in a notified country, under section 89A",
      cell(e._d||0),{ref:"1d",hint:"the sum of the three countries below"});
    NOTIFIED89.forEach(c=>b+=row(c[1],inp("sal.emp."+i+".n89a_"+c[0],{n:1}),{ind:1}));
    b+=row("Income from a retirement benefit account in a country other than a notified one",
      inp("sal.emp."+i+".n89a_other",{n:1}),{ref:"1e"});
    b+=row("Income taxable this year on which relief under 89A was claimed in an earlier year",
      inp("sal.emp."+i+".n89a_prev",{n:1}),{ref:"1f"});
    b+=row("Gross salary from this employer",cell(g),{cls:"tot",
      hint:"1a + 1b + 1c + 1d + 1e + 1f, worked out for you"});
    h+=blk("emp"+i,"Employer "+(i+1)+(st0(e.name)?" — "+st0(e.name):""),status,b,"sal.emp."+i);
  });
  h+='<button class="add" data-addemp="1">Add an employer</button>';
  h+=sub("Gross salary — all employers");
  h+=row("Salary under section 17(1)",cell(A.grossS),{ref:"1a"});
  h+=row("Perquisites under section 17(2)",cell(A.grossP),{ref:"1b"});
  h+=row("Profit in lieu of salary under section 17(3)",cell(A.grossPr),{ref:"1c"});
  if(A.n89d)h+=row("Income from a notified country under section 89A",cell(A.n89d),{ref:"1d"});
  if(A.n89e)h+=row("Income from a country other than a notified one",cell(A.n89e),{ref:"1e"});
  if(A.n89f)h+=row("Taxable this year on an earlier 89A claim",cell(A.n89f),{ref:"1f"});
  h+=row("Total gross salary — all employers",cell(A.gross),{cls:"tot",ref:"1",
    hint:"the sum of every employer above"});
  h+=sub("Allowances exempt under section 10");
  if(isNew())h+=note("Section 115BAC closes most of these — house rent allowance, leave travel "+
    "concession and the ordinary 10(14) allowances among them. A row it cannot allow is shown "+
    "at nil.","warn");
  h+=grid("alw",[{k:"sec",h:"Nature of the allowance",t:"sel",w:"360px",req:1,
      opts:(isNew()?ALW10.filter(a=>ALW10_NEW.indexOf(a[0])>=0):ALW10).map(a=>[a[0],a[0]+" — "+a[1]])},
    {k:"amt",h:"Amount",t:"num",w:"150px",req:1},
    {k:"ok",h:"Exempt",t:"calc",w:"140px",f:r=>r._ok?N(r.amt):0}],
    S.alw,{min:"760px",empty:"No exempt allowance claimed.",add:"Add an allowance",
    foot:[{l:1,v:"Total exempt under section 10",span:2},{v:A.exempt}]});
  h+=card("ea","Schedule EA 10(13A) — house rent allowance working",
    (S.sal.ea&&N(S.sal.ea.exempt)?F(N(S.sal.ea.exempt)):""),
    row("Place of work",sel("sal.ea.metro",
      [["M","A metro — Delhi, Mumbai, Kolkata or Chennai"],["N","Anywhere else"]]),{req:1})+
    row("Salary for the purpose of house rent allowance",inp("sal.ea.salary",{n:1}),{req:1})+
    row("Allowance received",inp("sal.ea.hra",{n:1}),{req:1})+
    row("Rent paid in the year",inp("sal.ea.rent",{n:1}),{req:1})+
    row("Exemption claimed",inp("sal.ea.exempt",{n:1}),{req:1,
      hint:"the least of the allowance, rent less ten per cent of salary, and 50% or 40% of salary"}));
  h+=card("s89a","Relief claimed under section 89A",
    (N(S.sal.rel89a)?F(N(S.sal.rel89a)):""),
    note("The income itself is entered employer by employer above, under 1d, 1e and 1f. "+
      "Enter here only the amount for which relief under section 89A is claimed this year.")+
    row("Income claimed for relief under section 89A",inp("sal.rel89a",{n:1}),{ref:"1iia"}));
  h+=row("Net salary",cell(A.net),{cls:"tot",ref:"3"});
  h+=sub("Deductions under section 16");
  h+=row("Standard deduction under section 16(ia)",cell(A.d16ia),{ref:"4a",
    hint:isNew()?"₹75,000, or the salary if less":"₹50,000, or the salary if less"});
  if(!isNew()){
    h+=row("Entertainment allowance under section 16(ii)",inp("sal.ent",{n:1}),{ref:"4b",
      hint:"government employees, up to ₹5,000"});
    h+=row("Professional tax under section 16(iii)",inp("sal.pt",{n:1}),{ref:"4c",
      hint:"up to ₹5,000"});
  }
  h+=row("Total deduction under section 16",cell(A.d16),{cls:"tot",ref:"4"});
  h+=row("Income chargeable under the head salaries",cell(A.income),{cls:"grand",ref:"6"});
  return h;
}
