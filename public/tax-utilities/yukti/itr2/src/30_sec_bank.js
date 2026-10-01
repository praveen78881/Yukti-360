
/* ---------------- 16 · Bank and verification --------------------- */
function secBank(){
  const I=S.C.int;let h="";
  h+=row("Number of accounts held at any time in the year",inp("ver.nacc",{n:1}),
    {hint:"dormant accounts excluded"});
  h+=note("Every account held at any time has to be reported, except a dormant one. "+
    "Tick the one the refund should go to.");
  h+=grid("bank",[{k:"ifsc",h:"IFS code",t:"txt",w:"140px",max:11,req:1},
    {k:"bank",h:"Name of the bank",t:"txt",w:"auto",req:1},
    {k:"acno",h:"Account number",t:"txt",w:"200px",req:1},
    {k:"type",h:"Type",t:"sel",w:"170px",req:1,opts:ACCT},
    {k:"refund",h:"For the refund",t:"chk",w:"120px"}],
    S.bank,{min:"960px",empty:"No account given — a refund cannot be credited.",add:"Add an account"});
  h+=note("Type the IFS code and the name of the bank fills itself.");
  h+=sub("Verification");
  h+=row("Name of the person verifying the return",inp("ver.name"),{req:1});
  h+=row("Son or daughter of",inp("ver.father"),{req:1});
  h+=row("PAN of the person verifying",inp("ver.pan",{max:10}),{req:1});
  h+=row("Capacity",sel("ver.cap",[["S","Self"],["R","Representative assessee"],
    ["K","Karta of a Hindu undivided family"]],{blank:false}),{req:1});
  h+=row("Place",inp("ver.place"),{req:1});
  h+=card("trp","Prepared by a tax return preparer",(st0((S.trp||{}).name)?st0(S.trp.name):""),
    row("Identification number of the TRP",inp("trp.id",{max:10}),{req:1})+row("Name of the TRP",inp("trp.name"),{req:1})+
    row("Amount of reimbursement from the Government, if any",inp("trp.reimb",{n:1}),{req:1,hint:"nil if none"})+
    formNote("The TRP counter-signs the paper form; the JSON carries the three particulars."));
  h+=rulesPanel();
  h+=sub("Software registration");
  h+=note("The department wants the JSON to carry the registration number of the software "+
    "that made it, as SW and eight digits.");
  h+=row("Registration number",inp("ver.swid",{ph:"SW00000000",max:10}));
  h+=sub("Export");
  const errs=S.C.checks.filter(c=>c.lvl==="err").length;
  h+= errs
    ? note("<b>"+errs+" thing"+(errs>1?"s":"")+" still to fix.</b> Each sits against its section.","stop")
    : note("Every check passes. The JSON is validated against the schema skeleton before it is "+
      "written. Import it into the government utility to seal and upload.","form");
  h+='<div style="padding:8px 14px;display:flex;gap:10px">'+
     '<button class="add" id="b_json2" style="height:32px;padding:0 18px;margin:0'+
     (errs?";opacity:.45":"")+'"'+(errs?" disabled":"")+'>Export the return as JSON</button>'+
     '<button class="add" id="b_save2" style="height:32px;padding:0 18px;margin:0">Save the working file</button></div>';
  return h;
}
