/* ---------------- 2 · Return and regime — from the book -------------- */
function secRet(){
  let h="";
  h+=sub("Filing");
  h+=row("Filed under section",sel("fs.sec",RETSEC,{blank:false}),{req:1});
  if([13,14,16,18,20].indexOf(+S.fs.sec)>=0){
    h+=row("Filed in response to a notice under section",sel("fs.noticesec",NOTICESEC.slice(1)),{req:1,ind:1});
    h+=row("Unique number or document identification number of the notice or order",inp("fs.notice"),{req:1,ind:1});
    h+=row("Date of the notice or order",dte("fs.noticedate"),{req:1,ind:1});
  }
  if([17,18,19].indexOf(+S.fs.sec)>=0){
    h+=row("Receipt number of the original return",inp("fs.receipt",{max:15}),{req:1,ind:1,hint:"fifteen digits"});
    h+=row("Date of filing of the original return",dte("fs.origdate"),{req:1,ind:1});
  }
  if(+S.fs.sec===19)h+=row("Date of the advance pricing agreement",dte("fs.apadate"),{req:1,ind:1});
  if(+S.fs.sec===18)h+=note("A corrected return filed against a 139(9) notice on a return that was itself "+
    "filed under 139(8A) has to select 139(8A) again.","warn");
  h+=row("Date of filing",dte("fs.filed"),{req:1,hint:"drives interest under 234A and the fee under 234F"});
  h+=row("Due date under section 139(1)",'<span class="c">'+DISP(DUE)+'</span>');
  h+=row("Extended due date, if the Board extended it",dte("fs.dueExt"),{hint:"leave blank unless a circular extended the date — 234A and 234F then run from it"});
  h+=sub("Regime");
  h+=row("Do you wish to exercise the option under section 115BAC(6) of opting out of the new tax regime?",
    sel("fs.optout",["No","Yes"],{blank:false}),{req:1,hint:"the default is No — the new regime"});
  h+=note("For ITR-2 the option is exercised in the return itself. Form 10-IE or 10-IEA is needed only "+
    "where there is business or professional income, which does not arise on this form.");
  h+=regimeTable();
  h+=sub("Seventh proviso to section 139(1)");
  h+=card("decl","Filing under the seventh proviso though not otherwise required to",
    (S.decl&&S.decl.flag==="Yes"?"Declared":""),
    row("Are you filing under the seventh proviso to 139(1) but otherwise not required to?",
      sel("decl.flag",["No","Yes"],{blank:false}))+
    (S.decl&&S.decl.flag==="Yes"?(
      row("Deposited over ₹1 crore in one or more current accounts?",sel("decl.dep_f",["No","Yes"],{blank:false}),
        {v2:S.decl.dep_f==="Yes"?inp("decl.dep",{n:1}):""})+
      row("Spent over ₹2 lakh on travel to a foreign country, for yourself or another?",sel("decl.trv_f",["No","Yes"],{blank:false}),
        {v2:S.decl.trv_f==="Yes"?inp("decl.trv",{n:1}):""})+
      row("Spent over ₹1 lakh on consumption of electricity?",sel("decl.ele_f",["No","Yes"],{blank:false}),
        {v2:S.decl.ele_f==="Yes"?inp("decl.ele",{n:1}):""})+
      row("Required to file under other conditions in clause (iv) of the seventh proviso?",
        sel("decl.c4_f",["No","Yes"],{blank:false}))+
      (S.decl.c4_f==="Yes"?grid("decl.c4",[{k:"nature",h:"Condition",t:"sel",w:"520px",req:1,opts:CLAUSEIV},
        {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],S.decl.c4||[],{min:"720px",empty:"No condition.",add:"Add a condition"}):"")
    ):""));
  return h;
}

function regimeTable(){
  const keep=S.fs.optout;
  const run=v=>{S.fs.optout=v;compute();
    return {via:S.C.via.allowed,ti:S.C.ti,tax:S.C.int.net};};
  const a=run("No"),b=run("Yes");S.fs.optout=keep;compute();
  const gap=Math.abs(a.tax-b.tax),better=a.tax<=b.tax?"new":"old";
  return '<div class="full"><table class="gt" style="min-width:640px"><thead><tr>'+
    '<th class="l">Regime</th><th style="width:160px">Chapter VI-A allowed</th>'+
    '<th style="width:150px">Total income</th><th style="width:150px">Tax after credit</th>'+
    '</tr></thead><tbody>'+
    '<tr><td class="l">New — section 115BAC(1A)</td><td class="num">'+cell(a.via)+
      '</td><td class="num">'+cell(a.ti)+'</td><td class="num">'+cell(a.tax)+'</td></tr>'+
    '<tr><td class="l">Old</td><td class="num">'+cell(b.via)+'</td><td class="num">'+
      cell(b.ti)+'</td><td class="num">'+cell(b.tax)+'</td></tr></tbody></table></div>'+
    (gap?note("On the figures entered so far the <b>"+better+" regime costs "+RS(gap)+
      " less</b>. Fill the rest before settling it.")
        :note("On the figures entered so far the two come to the same tax."));
}