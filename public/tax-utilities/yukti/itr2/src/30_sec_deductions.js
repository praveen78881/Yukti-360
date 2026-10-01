/* ---- Schedule 80D — the ITR-2 four-block working ------------------- */
function eng80D(){
  const d=S.d80||{};const g=k=>N(d[k]);
  const ins=k=>(d[k]||[]).reduce((s,r)=>s+N(r.amt),0);
  /* a · self and family, not senior */
  const aHI=ins("selfIns"),aPHC=g("selfPHC");
  /* b · self and family, senior */
  const bHI=ins("selfSrIns"),bPHC=g("selfSrPHC"),bMed=g("selfSrMed");
  /* parents, not senior */
  const cHI=ins("parIns"),cPHC=g("parPHC");
  /* parents, senior */
  const dHI=ins("parSrIns"),dPHC=g("parSrPHC"),dMed=g("parSrMed");
  const selfSr=d.selfSr==="Y",parSr=d.parSr==="Y";
  const selfClaim=d.selfSr!=="N/A",parClaim=d.parSr!=="N/A";
  /* the caps — 25,000 / 50,000, check-up inside the cap, medical expenditure only for a senior
     with no insurance, total check-up capped at 5,000 across everyone */
  let phcAll=5000;const take=v=>{const t=Math.min(v,phcAll);phcAll-=t;return t;};
  const aPHCu=selfClaim&&!selfSr?take(aPHC):0,bPHCu=selfClaim&&selfSr?take(bPHC):0,cPHCu=parClaim&&!parSr?take(cPHC):0,dPHCu=parClaim&&parSr?take(dPHC):0;
  /* each block's parts are trimmed to its ceiling — medical expenditure first, then the check-up, then the premium */
  /* each block is capped as a total (rules A291/294/296/298); the parts are written as entered */
  const selfTot=selfClaim?(selfSr?Math.min(50000,bHI+bMed+bPHCu):Math.min(25000,aHI+aPHCu)):0;
  const parTot=parClaim?(parSr?Math.min(50000,dHI+dMed+dPHCu):Math.min(25000,cHI+cPHCu)):0;
  return {aHI:R(aHI),aPHC:R(aPHC),aPHCu:R(aPHCu),bHI:R(bHI),bPHC:R(bPHC),bPHCu:R(bPHCu),bMed:R(bMed),cHI:R(cHI),cPHC:R(cPHC),cPHCu:R(cPHCu),
    dHI:R(dHI),dPHC:R(dPHC),dPHCu:R(dPHCu),dMed:R(dMed),selfTot:R(selfTot),parTot:R(parTot),eligible:R(Math.min(100000,selfTot+parTot)),
    selfSr,parSr,selfClaim,parClaim};
}
/* ---- Chapter VI-A ---------------------------------------------------- */
function engVIA(gti){
  const out={},why={},allow=k=>!isNew()||VIA_NEW.indexOf(k)>=0;
  const d80=eng80D();S.C.d80=d80;
  /* the sub-schedules feed their VI-A line */
  const fed={c80d:d80.eligible,
    c80g:(S.g80||[]).reduce((s,r)=>s+N(r.amt),0),
    c80gga:(S.gga||[]).reduce((s,r)=>s+(r.mode==="CASH"&&N(r.amt)>10000?0:N(r.amt)),0),
    c80ggc:(S.ggc||[]).reduce((s,r)=>s+(r.mode==="CASH"?0:N(r.amt)),0),
    c80e:(S.e80.e||[]).reduce((s,r)=>s+N(r.interest),0),
    c80ee:(S.e80.ee||[]).reduce((s,r)=>s+N(r.interest),0),
    c80eea:(S.e80.eea||[]).reduce((s,r)=>s+N(r.interest),0),
    c80eeb:(S.e80.eeb||[]).reduce((s,r)=>s+N(r.interest),0),
    c80c:(S.c80c||[]).length?(S.c80c||[]).reduce((s,r)=>s+N(r.amt),0):N(S.via.c80c),
    c80ccc:(S.pen80ccc||[]).length?(S.pen80ccc||[]).reduce((s,r)=>s+N(r.amt),0):N(S.via.c80ccc),
    c80ccd1:(S.pen80ccd1||[]).length?(S.pen80ccd1||[]).reduce((s,r)=>s+N(r.amt),0):N(S.via.c80ccd1),
    c80ccd1b:(S.pen80ccd1b||[]).length?(S.pen80ccd1b||[]).reduce((s,r)=>s+N(r.amt),0):N(S.via.c80ccd1b),
    c80dd:N((S.dd80||{}).amt)};
  VIA.forEach(x=>{const k=x[0],cap=x[3];
    let c=fed[k]!==undefined?fed[k]:N(S.via[k]);
    if(k==="c80dd"&&c){const sev=(S.dd80||{}).nature==="2";c=Math.min(c,sev?125000:75000);if(N(S.dd80.amt)>c)why[k]="capped at "+RS(c);}
    if(k==="c80u"&&c){const sev=(S.u80||{}).nature==="SelfSevere";const cp=sev?125000:75000;if(c>cp){why[k]="capped at "+RS(cp);c=cp;}}
    if(k==="c80ddb"&&c){const cp=(S.via.ddb_type==="2")?100000:40000;if(c>cp){why[k]="capped at "+RS(cp);c=cp;}}
    if(!allow(k)){out[k]=0;why[k]=c?"closed by section 115BAC":"";return;}
    if(cap&&c>cap&&!why[k]){why[k]="capped at "+RS(cap);c=cap;}
    out[k]=R(c);});
  const cce=out.c80c+out.c80ccc+out.c80ccd1;
  if(cce>150000){const f=150000/cce;out.c80c=R(out.c80c*f);out.c80ccc=R(out.c80ccc*f);out.c80ccd1=150000-out.c80c-out.c80ccc;
    why.c80c=(why.c80c?why.c80c+", ":"")+"80C, 80CCC and 80CCD(1) together stop at ₹1,50,000";}
  const os={sav:(S.C.os||{}).sav||0,dep:(S.C.os||{}).dep||0};
  if(senior()){if(out.c80tta){why.c80tta="a senior citizen claims 80TTB";out.c80tta=0;}}
  else if(out.c80ttb){why.c80ttb="80TTB is for a resident senior citizen";out.c80ttb=0;}
  if(out.c80tta>os.sav){why.c80tta="limited to the savings interest";out.c80tta=os.sav;}
  if(out.c80ttb>os.sav+os.dep){why.c80ttb="limited to the interest earned";out.c80ttb=os.sav+os.dep;}
  /* non-resident restrictions */
  if(S.pi.res!=="RES"){["c80dd","c80ddb","c80u","c80ttb","c80qqb","c80rrb"].forEach(k=>{if(out[k]){why[k]="not available to a non-resident";out[k]=0;}});}
  let total=0;VIA.forEach(x=>total+=out[x[0]]);
  return {out,why,fed,total:R(total),allowed:R(Math.min(total,Math.max(0,gti))),clipped:total>gti,conc:isNew()};
}

/* ---------------- 7 · Deductions — Schedule VI-A, from the sheet ------ */
function insTable(key){
  return grid(key,[{k:"insurer",h:"Name of the insurer",t:"txt",w:"auto",req:1},
    {k:"policy",h:"Policy number",t:"txt",w:"180px",req:1},{k:"amt",h:"Health insurance amount",t:"num",w:"160px",req:1}],
    get(key)||[],{min:"720px",empty:"No policy listed.",add:"Add a policy"});
}
function pensionTable(key,withName){
  return grid(key,[{k:"type",h:"Type of identifier",t:"sel",w:"220px",req:1,opts:IDENT_TYPE},
    {k:"id",h:withName?"Name of identifier":"Identifier number",t:"txt",w:"auto",req:1},
    {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],get(key)||[],{min:"640px",empty:"None listed.",add:"Add a row"});
}
function loanTable(key,intKey){
  const extra=key==="e80.eeb"?[{k:"reg",h:"Vehicle registration number",t:"txt",w:"150px",max:11,req:1}]:[];
  return grid(key,[{k:"from",h:"Loan taken from",t:"sel",w:"150px",req:1,opts:LOANFROM},...extra,
    {k:"name",h:"Name of the bank, institution or person",t:"txt",w:"auto",req:1},
    {k:"acno",h:"Loan account number",t:"txt",w:"160px",req:1},{k:"dt",h:"Date of sanction",t:"date",w:"130px",req:1},
    {k:"amt",h:"Total loan",t:"num",w:"130px",req:1},{k:"os",h:"Outstanding on 31-03-2026",t:"num",w:"150px",req:1},
    {k:"interest",h:"Interest in the year",t:"num",w:"140px",req:1}],get(key)||[],{min:"1240px",empty:"No loan.",add:"Add a loan"});
}
function secDed(){
  const V=S.C.via,D8=S.C.d80;let h="";
  if(S.pi.res!=="RES")h+=note("A non-resident cannot claim 80DD, 80DDB, 80U, 80TTB, 80QQB or 80RRB. Yukti allows only what a non-resident may.","warn");
  if(isNew())h+=note("<b>Under section 115BAC only 80CCD(2) and 80CCH survive</b>, so the rest are hidden. Fill them under the old regime in <b>Return and regime</b> if you want the comparison there to use them.","stop");
  h+='<div class="cgband">1 · Part B — Deduction in respect of certain payments</div>';
  h+='<div class="r sub"><div class="l">Section</div><div class="ref"></div><div class="v2 hd2">You claim</div><div class="v hd2">System calculated</div></div>';
  const fedNote={c80d:"from Schedule 80D",c80g:"from Schedule 80G",c80gga:"from Schedule 80GGA",c80ggc:"from Schedule 80GGC",
    c80e:"from the 80E loan table",c80ee:"from the 80EE loan table",c80eea:"from the 80EEA loan table",c80eeb:"from the 80EEB loan table",c80dd:"from Schedule 80DD"};
  const partC=["c80qqb"];
  VIA.forEach(x=>{const [k,ref,label,cap]=x;
    if(k==="c80qqb")h+='<div class="cgband">2 · Part C, CA and D — Deduction in respect of certain incomes and other deductions</div>';
    const open=!isNew()||VIA_NEW.indexOf(k)>=0;
    if(!open)return;
    const fedK=V.fed&&V.fed[k]!==undefined&&(fedNote[k]||["c80c","c80ccc","c80ccd1","c80ccd1b"].indexOf(k)>=0&&((k==="c80c"?S.c80c:k==="c80ccc"?S.pen80ccc:k==="c80ccd1"?S.pen80ccd1:S.pen80ccd1b)||[]).length);
    h+='<div class="r'+(open?"":" closed")+'"><div class="l">'+esc(label)+
       (cap?'<span class="hint">ceiling '+RS(cap)+'</span>':'')+(fedK&&fedNote[k]?'<span class="hint">'+fedNote[k]+'</span>':'')+
       (!open&&N(S.via[k])?'<span class="hint">closed by section 115BAC</span>':'')+'</div>'+
       '<div class="ref">'+esc(ref)+'</div>'+
       '<div class="v2">'+(fedK?cell(V.fed[k]):inp("via."+k,{n:1}))+'</div>'+
       '<div class="v">'+cell(V.out[k])+'</div></div>';
    if(k==="c80ccc")h+=fold("pccc","b","Identifier details for 80CCC",(S.pen80ccc||[]).length?(S.pen80ccc||[]).length+" rows":"optional",pensionTable("pen80ccc",false));
    if(k==="c80ccd1")h+=fold("pccd1","c","Identifier details for 80CCD(1)",(S.pen80ccd1||[]).length?(S.pen80ccd1||[]).length+" rows":"optional",pensionTable("pen80ccd1",true));
    if(k==="c80ccd1b")h+=fold("pccd1b","d","Identifier details for 80CCD(1B), with the PRAN",(S.pen80ccd1b||[]).length?(S.pen80ccd1b||[]).length+" rows":"optional",
      pensionTable("pen80ccd1b",true)+row("PRAN",inp("via.pran",{max:12}),{ind:1,hint:"permanent retirement account number"}));
    if(k==="c80ddb"&&N(S.via.c80ddb)){
      h+=row("Claimed for",sel("via.ddb_type",[["1","Self or dependant"],["2","Self or dependant — senior citizen"]],{blank:false}),{req:1,ind:1,hint:"₹40,000, or ₹1,00,000 for a senior citizen"});
      h+=row("Name of the specified disease",sel("via.ddb_disease",DISEASE80DDB),{req:1,ind:1});}
    if(k==="c80gg"&&N(S.via.c80gg))h+=row("Acknowledgement number of Form 10BA",inp("via.ack10ba",{max:15}),{req:1,ind:1,hint:"fifteen digits"});
    if(k==="c80qqb"&&N(S.via.c80qqb))h+=row("Acknowledgement number of Form 10CCD",inp("via.ack10ccd",{max:15}),{req:1,ind:1});
    if(k==="c80rrb"&&N(S.via.c80rrb))h+=row("Acknowledgement number of Form 10CCE",inp("via.ack10cce",{max:15}),{req:1,ind:1});
  });
  h+=row("v · Deductions — total of a to ua",cell(V.total),{ref:"v",cls:"tot"});
  if(V.clipped)h+=row("Limited to gross total income",cell(V.allowed),{cls:"tot"});
  h+=row("Deduction under Chapter VI-A",cell(V.allowed),{cls:"grand"});

  if(isNew()){h+=note("The Chapter VI-A working schedules — 80C, 80D, 80G, 80GGA, 80GGC, 80U/80DD, the 80E group, research donations and AMT — are closed under section 115BAC, so they are hidden here and left out of the export. Switch to the old regime in <b>Return and regime</b> if you need them.","stop");return h;}
  h+='<div class="cgband">The schedules behind the figures</div>';
  /* 80C */
  h+=card("80c","Section 80C — the items",(S.c80c||[]).length?RS((S.c80c||[]).reduce((s,r)=>s+N(r.amt),0)):"",
    grid("c80c",[{k:"amt",h:"Amount eligible for deduction under 80C",t:"num",w:"220px",req:1},
      {k:"id",h:"Policy number or document identification number",t:"txt",w:"auto",req:1}],
      S.c80c||[],{min:"640px",empty:"No item listed.",add:"Add an item",foot:[{l:1,v:"Total deduction under 80C",span:1},{v:(S.c80c||[]).reduce((s,r)=>s+N(r.amt),0)}]}));
  /* 80D — the four blocks */
  const d=S.d80||{};
  h+=card("80d","Schedule 80D — health insurance",D8.eligible?RS(D8.eligible):"",
    row("If you are an individual, whether you or any of your family member, excluding parents, is a senior citizen?",
      sel("d80.selfSr",[["N","No"],["Y","Yes"],["N/A","Not claiming for self or family"]],{blank:false}),{req:1})+
    (d.selfSr==="N"?(sub("a · Self and family")+sub("(i) Health insurance — details of insurance")+insTable("d80.selfIns")+
      row("(ii) Preventive health check-up",inp("d80.selfPHC",{n:1}),{ind:1})):"")+
    (d.selfSr==="Y"?(sub("b · Self and family — senior citizen")+sub("(i) Health insurance — details of insurance")+insTable("d80.selfSrIns")+
      row("(ii) Preventive health check-up",inp("d80.selfSrPHC",{n:1}),{ind:1})+
      row("(iii) Medical expenditure — claimable only where no health insurance is taken",inp("d80.selfSrMed",{n:1}),{ind:1})):"")+
    row("Whether any one of your parents is a senior citizen?",sel("d80.parSr",[["N","No"],["Y","Yes"],["N/A","Not claiming for parents"]],{blank:false}),{req:1})+
    (d.parSr==="N"?(sub("a · Parents")+sub("(i) Health insurance — details of insurance")+insTable("d80.parIns")+
      row("(ii) Preventive health check-up",inp("d80.parPHC",{n:1}),{ind:1})):"")+
    (d.parSr==="Y"?(sub("b · Parents — senior citizen")+sub("(i) Health insurance — details of insurance")+insTable("d80.parSrIns")+
      row("(ii) Preventive health check-up",inp("d80.parSrPHC",{n:1}),{ind:1})+
      row("(iii) Medical expenditure — claimable only where no health insurance is taken",inp("d80.parSrMed",{n:1}),{ind:1})):"")+
    row("Self and family — eligible",cell(D8.selfTot),{cls:"tot",hint:D8.selfSr?"up to ₹50,000":"up to ₹25,000"})+
    row("Parents — eligible",cell(D8.parTot),{cls:"tot",hint:D8.parSr?"up to ₹50,000":"up to ₹25,000"})+
    row("Eligible amount of deduction",cell(D8.eligible),{cls:"grand",hint:"preventive check-up sits inside the ceilings, ₹5,000 in all"}));
  /* 80DD */
  h+=card("80dd","Schedule 80DD — a dependant with a disability",N((S.dd80||{}).amt)?RS(N(S.dd80.amt)):"",
    row("Nature of disability",sel("dd80.nature",DD_NATURE),{req:1})+row("Type of disability",sel("dd80.type",DD_TYPE),{req:1})+
    row("Amount of deduction",inp("dd80.amt",{n:1}),{req:1,hint:"₹75,000, or ₹1,25,000 for a severe disability"})+
    row("Dependant",sel("dd80.dep",DD_DEP),{req:1})+row("PAN of the dependant",inp("dd80.pan",{max:10}))+
    row("Aadhaar of the dependant",inp("dd80.aadhaar",{max:12}))+row("Date of filing of Form 10-IA",dte("dd80.f10dt"))+
    row("Acknowledgement number of Form 10-IA",inp("dd80.f10ack",{max:15}))+row("UDID number",inp("dd80.udid"))+
    formNote("<b>Form 10-IA</b> has to be filed before the return."));
  /* 80U */
  h+=card("80u","Schedule 80U — the person has a disability",N(S.via.c80u)?RS(V.out.c80u):"",
    row("Nature of the disability",sel("u80.nature",[["Self","Disability — 40% or more"],["SelfSevere","Severe disability — 80% or more"]]),{req:1})+
    row("Type of disability",sel("u80.type",DD_TYPE),{req:1})+
    row("Date of filing of Form 10-IA",dte("u80.dt"))+row("Acknowledgement number of Form 10-IA",inp("u80.ack",{max:15}))+
    row("UDID number",inp("u80.udid"))+formNote("<b>Form 10-IA</b> has to be filed before the return."));
  /* 80E group */
  const e=S.e80||{};const et=k=>(e[k]||[]).reduce((s,r)=>s+N(r.interest),0);
  h+=card("80e","80E, 80EE, 80EEA, 80EEB — loans, lender by lender",(et("e")+et("ee")+et("eea")+et("eeb"))?RS(et("e")+et("ee")+et("eea")+et("eeb")):"",
    sub("80E — interest on a loan taken for higher education")+loanTable("e80.e")+
    sub("80EE — interest on a loan taken for a residential house")+loanTable("e80.ee")+
    sub("80EEA — interest on a loan taken for certain house property")+row("Stamp duty value of the property",inp("e80.eeaSdv",{n:1}),{req:1,hint:"not over ₹45 lakh for the deduction"})+loanTable("e80.eea")+
    sub("80EEB — interest on a loan taken to buy an electric vehicle")+loanTable("e80.eeb"));
  /* 80G */
  h+=card("80g","Schedule 80G — donations, donee by donee",(S.g80||[]).length?RS((S.g80||[]).reduce((s,r)=>s+N(r.amt),0)):"",
    note("<b>Where any row is filled, every field in that row becomes mandatory.</b>")+
    grid("g80",[{k:"bucket",h:"Bucket",t:"sel",w:"230px",req:1,opts:[["A","100% without a qualifying limit"],["B","50% without a qualifying limit"],["C","100% subject to the limit"],["D","50% subject to the limit"]]},
      {k:"name",h:"Name of the donee",t:"txt",w:"auto",req:1},{k:"addr",h:"Address",t:"txt",w:"auto",req:1},{k:"city",h:"City",t:"txt",w:"120px",req:1},
      {k:"state",h:"State",t:"sel",w:"150px",req:1,opts:Object.keys(STATE).map(k=>[k,STATE[k]])},{k:"pin",h:"PIN",t:"txt",w:"90px",max:6,req:1},
      {k:"pan",h:"PAN of the donee",t:"txt",w:"120px",max:10,req:1},{k:"arn",h:"ARN — donation reference",t:"txt",w:"150px",max:25},
      {k:"cash",h:"In cash",t:"num",w:"100px"},{k:"other",h:"Other mode",t:"num",w:"100px"},
      {k:"ref",h:"Transaction reference — UPI, cheque, IMPS, NEFT, RTGS",t:"txt",w:"170px",max:50},{k:"ifsc",h:"IFSC of the bank",t:"txt",w:"110px",max:11},
      {k:"amt",h:"Total",t:"num",w:"120px",req:1}],S.g80||[],{min:"2000px",empty:"No donation listed.",add:"Add a donee",
      foot:[{l:1,v:"Total donated",span:12},{v:(S.g80||[]).reduce((s,r)=>s+N(r.amt),0)}]})+
    note("A donation in cash above ₹2,000 gives no deduction. For a donation by any other mode the transaction reference and the bank's IFSC are mandatory.","warn"));
  /* 80GGA + RA */
  h+=card("80gga","Schedule 80GGA — donations for scientific research or rural development",(S.gga||[]).length?RS((S.gga||[]).reduce((s,r)=>s+N(r.amt),0)):"",
    grid("gga",[{k:"clause",h:"Relevant clause",t:"sel",w:"auto",req:1,opts:GGA_CLAUSE},{k:"name",h:"Name of the donee",t:"txt",w:"auto",req:1},
      {k:"addr",h:"Address",t:"txt",w:"auto",req:1},{k:"city",h:"City",t:"txt",w:"110px",req:1},
      {k:"state",h:"State",t:"sel",w:"140px",req:1,opts:Object.keys(STATE).map(k=>[k,STATE[k]])},{k:"pin",h:"PIN",t:"txt",w:"80px",max:6,req:1},
      {k:"pan",h:"PAN of the donee",t:"txt",w:"120px",max:10,req:1},{k:"mode",h:"Mode",t:"sel",w:"110px",req:1,opts:[["CASH","Cash"],["OTH","Other"]]},
      {k:"amt",h:"Amount",t:"num",w:"120px",req:1}],S.gga||[],{min:"1600px",empty:"No donation listed.",add:"Add a donee"})+
    note("A donation in cash above ₹10,000 gives no deduction.","warn")+
    sub("Schedule RA — the research associations, universities and institutions the donation went to, under 35(1)(ii), (iia), (iii) and 35(2AA)")+
    grid("ra",[{k:"name",h:"Name of the donee",t:"txt",w:"auto",req:1},{k:"addr",h:"Address",t:"txt",w:"auto",req:1},
      {k:"city",h:"City or town or district",t:"txt",w:"140px",req:1},{k:"state",h:"State code",t:"sel",w:"140px",req:1,opts:Object.keys(STATE).map(k=>[k,STATE[k]])},
      {k:"pin",h:"PIN code",t:"txt",w:"90px",max:6,req:1},{k:"pan",h:"PAN of the donee",t:"txt",w:"120px",max:10,req:1},
      {k:"cash",h:"Donation in cash",t:"num",w:"120px"},{k:"other",h:"Donation in other mode",t:"num",w:"140px"}],
      S.ra||[],{min:"1300px",empty:"None listed.",add:"Add a donee"}));
  /* 80GGC */
  h+=card("80ggc","Schedule 80GGC — contribution to a political party or an electoral trust",(S.ggc||[]).length?RS((S.ggc||[]).reduce((s,r)=>s+N(r.amt),0)):"",
    grid("ggc",[{k:"dt",h:"Date of contribution",t:"date",w:"130px",req:1},{k:"name",h:"Name of the party or trust",t:"txt",w:"auto"},
      {k:"pan",h:"PAN",t:"txt",w:"120px",max:10},{k:"mode",h:"Mode",t:"sel",w:"110px",req:1,opts:[["CASH","Cash"],["OTH","Other than cash"]]},
      {k:"ref",h:"Transaction reference",t:"txt",w:"170px"},{k:"ifsc",h:"IFSC",t:"txt",w:"120px",max:11},{k:"amt",h:"Amount",t:"num",w:"120px",req:1}],
      S.ggc||[],{min:"1100px",empty:"No contribution listed.",add:"Add a contribution"})+
    note("A contribution in cash gives no deduction at all.","warn"));

  h+='<div class="cgband">How the total income comes out</div>';
  h+=row("Gross total income",cell(S.C.gti),{cls:"tot"});
  h+=row("Less: deductions under Chapter VI-A",cell(-V.allowed));
  h+=row("Total income",cell(S.C.ti),{cls:"grand",hint:"rounded to the nearest ten rupees"});
  return h;
}
