/* ---- ret — Filing status & regime ------------------------------------ */
function secRet(){
  const sec=+S.fs.sec; let h="";
  h+=sub("Filing");
  h+=row("Filed under section",sel("fs.sec",RET_SEC,{blank:false}),{req:1,ref:"N36"});
  if([13,14,16,18,20].indexOf(sec)>=0){
    h+=row("Unique Number / DIN of the notice or order",inp("fs.noticeNo",{max:100}),{req:1,ind:1,ref:"E43"});
    h+=row("Date of the notice or order",dte("fs.noticeDate"),{req:1,ind:1});
  }
  if([17].indexOf(sec)>=0){
    h+=row("Receipt No. of the original return",inp("fs.receipt",{max:15}),{req:1,ind:1,ref:"E41"});
    h+=row("Date of filing of the original return",dte("fs.origDate"),{req:1,ind:1});
  }
  h+=row("Date of filing this return",dte("fs.filed"),{req:1,hint:"drives interest u/s 234A and fee u/s 234F"});
  h+=row("Due date u/s 139(1)",sel("fs.duedate",DUE_DATES,{blank:false}),{req:1,ref:"N38"});
  h+=row("Residential status in India",sel("pi.res",RES_STAT,{blank:false}),{req:1,
    hint:"ITR-4 (Sugam) is for a Resident"});

  h+=sub("Tax regime — section 115BAC");
  h+=row("Do you wish to opt for the OLD tax regime for AY 2026-27? (115BAC(6))",
    sel("fs.optout",[["No","No — stay in the new regime (default)"],["Yes","Yes — opt out to the old regime"]],{blank:false}),
    {req:1,ref:"E72",hint:"the default is the new regime u/s 115BAC(1A)"});
  h+=row("Have you filed Form 10-IEA within due date for any earlier AY (old regime)?",
    sel("fs.f10ieaEarlier",YNNA,{blank:false}),{req:1,ref:"E45 · Form10IEAEarlierAYOldRegime"});
  if(S.fs.f10ieaEarlier==="Y"){
    h+=row("AY for which Form 10-IEA (old regime) was filed",sel("fs.f10ieaAY",AY10IEA),{ind:1,ref:"G49"});
    h+=row("Acknowledgement number of Form 10-IEA",inp("fs.f10ieaAck",{max:15}),{ind:1,ref:"G50"});
  }
  if(S.fs.optout==="Yes"){
    h+=note("Opting out of the new regime is exercised through Form 10-IEA and is sticky. "+
      "Furnish its current-AY acknowledgement and date.","warn");
    h+=row("Date of filing Form 10-IEA for AY 2026-27 (old regime)",dte("fs.f10ieaDateCur"),{req:1,ind:1,ref:"H69"});
    h+=row("Acknowledgement number of Form 10-IEA (AY 2026-27, old regime)",inp("fs.f10ieaAckCur",{max:15}),{req:1,ind:1,ref:"H70"});
  } else {
    h+=note("New regime u/s 115BAC(1A). Standard deduction ₹75,000 and family-pension "+
      "deduction remain; HRA/other exempt allowances, s.16(ii)/16(iii), self-occupied "+
      "24(b) interest and most Chapter VI-A deductions are closed.");
  }

  h+=sub("Seventh proviso to section 139(1)");
  h+=row("Filing under the seventh proviso though not otherwise required to?",
    sel("fs.seventh",YN,{blank:false}),{ref:"F89"});
  if(S.fs.seventh==="Y"){
    h+=row("Deposited over ₹1 crore in one or more current accounts?",sel("fs.dep1cr",YN),
      {ref:"E90",v2:S.fs.dep1cr==="Y"?inp("fs.dep1crAmt",{n:1}):""});
    h+=row("Spent over ₹2 lakh on foreign travel?",sel("fs.trv2l",YN),
      {ref:"E91",v2:S.fs.trv2l==="Y"?inp("fs.trv2lAmt",{n:1}):""});
    h+=row("Spent over ₹1 lakh on electricity?",sel("fs.ele1l",YN),
      {ref:"E92",v2:S.fs.ele1l==="Y"?inp("fs.ele1lAmt",{n:1}):""});
    h+=row("Required to file under other conditions in clause (iv)?",sel("fs.clz",YN),{ref:"E93"});
    if(S.fs.clz==="Y")
      h+=grid("fs.clause7",[
        {k:"nat",h:"Condition",t:"sel",w:"560px",req:1,opts:CLAUSE7},
        {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],
        S.fs.clause7||[],{min:"760px",empty:"No condition added.",add:"Add a condition"});
  }

  h+=sub("Representative assessee");
  h+=row("Is this return being filed by a representative assessee?",sel("fs.rep",YN,{blank:false}),{req:1,ref:"F98"});
  if(S.fs.rep==="Y"){
    h+=row("Name of the representative assessee",inp("fs.repName",{max:125}),{req:1,ind:1,ref:"G99"});
    h+=row("Email-ID of the representative assessee",inp("fs.repEmail",{max:125}),{req:1,ind:1,ref:"G100"});
    h+=row("Contact number of the representative assessee",inp("fs.repMobile",{n:1}),{req:1,ind:1,ref:"G101"});
  }
  return h;
}

function chkRet(){
  const out=[], sec=+S.fs.sec;
  if(!st0(S.fs.f10ieaEarlier)) out.push({lvl:"err",t:"Form 10-IEA (earlier AY) required",m:"Answer whether Form 10-IEA was filed within the due date for an earlier AY (mandatory).",sec:"ret"});
  if(S.fs.optout==="Yes"){
    if(!st0(S.fs.f10ieaAckCur)) out.push({lvl:"err",t:"Form 10-IEA acknowledgement required",m:"Opting out of the new regime is exercised only through Form 10-IEA — furnish its acknowledgement number.",sec:"ret"});
    if(!D(S.fs.f10ieaDateCur)) out.push({lvl:"err",t:"Form 10-IEA date required",m:"Furnish the date of filing of Form 10-IEA for AY 2026-27.",sec:"ret"});
  }
  if([13,14,16,18,20].indexOf(sec)>=0 && !st0(S.fs.noticeNo)) out.push({lvl:"err",t:"DIN required",m:"A return filed against a 142(1)/148/153C/139(9) notice or 119(2)(b) order needs the DIN.",sec:"ret"});
  if(sec===17 && !st0(S.fs.receipt)) out.push({lvl:"err",t:"Receipt number required",m:"A revised return (139(5)) needs the receipt number of the original return.",sec:"ret"});
  if(S.fs.rep==="Y"){
    if(st0(S.fs.repEmail)&&st0(S.pi.email)&&S.fs.repEmail.toLowerCase()===st0(S.pi.email).toLowerCase())
      out.push({lvl:"err",t:"Representative email clashes",m:"The representative's email must differ from the taxpayer's.",sec:"ret"});
  }
  return out;
}
reg({id:"ret", t:"Return and regime", ref:"Filing Status", f:secRet,
  s:()=>(S.fs.optout==="Yes"?"Old regime":"New regime"), chk:chkRet, order:9});