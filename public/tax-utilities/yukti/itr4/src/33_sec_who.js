/* =====================================================================
   RENDERERS
   ===================================================================== */
/* ---- who — Part A General (identity) ---------------------------------- */
function secWho(){
  let h="";
  h+=sub("Identity");
  h+=row("Status",sel("pi.status",STATUS,{blank:false}),{req:1,ref:"AF36"});
  h+=row("First name",inp("pi.first",{max:25}),{ref:"E6"});
  h+=row("Middle name",inp("pi.mid",{max:25}),{ref:"O6"});
  h+=row((S.pi.status==="F"?"Name of firm":"Last name / Surname"),inp("pi.last",{max:75}),{req:1,ref:"W6"});
  h+=row("PAN",inp("pi.pan",{max:10}),{req:1});
  h+=row("Aadhaar Number [linked to PAN]",inp("pi.aadhaar",{max:12}),{ref:"E32"});
  h+=row("Date of Birth / Incorporation",dte("pi.dob"),{req:1,hint:"maximum date 31/03/2026"});
  h+=row("Nature of Employment (Status)",sel("pi.empcat",EMPCAT,{blank:false}),{req:1,ref:"E36",
    hint:"'Not Applicable' greys off the salary schedule"});

  h+=sub("Primary address (for communication)");
  h+=row("Flat / Door / Block No.",inp("pi.resNo",{max:50}),{req:1,ref:"E10"});
  h+=row("Premises / Building / Village",inp("pi.resName",{max:50}),{});
  h+=row("Road / Street / Post Office",inp("pi.road",{max:50}),{ref:"E12"});
  h+=row("Area / Locality",inp("pi.locality",{max:50}),{req:1});
  h+=row("Town / City / District",inp("pi.city",{max:50}),{req:1,ref:"E14"});
  h+=row("State",sel("pi.state",STATE_CODES),{req:1,ref:"W14"});
  h+=row("PIN Code",inp("pi.pin",{n:1,max:6}),{req:1,hint:"6 digits, 100000–999999"});
  h+=row("STD code · Phone No.",inp("pi.std",{n:1}),{v2:inp("pi.phone")});
  h+=row("Mobile No.",inp("pi.mobile",{n:1}),{req:1,v2:inp("pi.mobcc",{n:1,ph:"91"})});
  h+=row("Primary Email ID",inp("pi.email",{max:125}),{req:1,ref:"E27"});
  h+=row("Secondary Email ID",inp("pi.emailSec",{max:125}),{ref:"S27"});

  h+=sub("Secondary address");
  h+=row("Is the secondary address same as primary?",sel("pi.secAdd",[["Y","Yes"],["N","No"]],{blank:false}),{req:1,ref:"E17"});
  if(S.pi.secAdd==="N"){
    h+=row("Flat / Door / Block No. (secondary)",inp("pi.altRes",{max:50}),{req:1,ind:1,ref:"E19"});
    h+=row("Area / Locality (secondary)",inp("pi.altLoc",{max:50}),{req:1,ind:1});
    h+=row("Town / City / District (secondary)",inp("pi.altCity",{max:50}),{req:1,ind:1,ref:"E23"});
    h+=row("State (secondary)",sel("pi.altState",STATE_CODES),{req:1,ind:1,ref:"W23"});
  }
  return h;
}

/* =====================================================================
   CHECKS — the sheet's own rules as live messages (regime-aware).
   ===================================================================== */
function chkWho(){
  const out=[];
  if(!st0(S.pi.last)) out.push({lvl:"err",t:"Name required",m:"Surname / last name (or firm name) is mandatory.",sec:"who"});
  if(st0(S.pi.pan)&&!PAN_RE.test(String(S.pi.pan).toUpperCase())) out.push({lvl:"err",t:"PAN not valid",m:"PAN must be 10 characters: AAAAA9999A.",sec:"who"});
  if(st0(S.pi.pin)&&!/^[1-9][0-9]{5}$/.test(String(S.pi.pin))) out.push({lvl:"warn",t:"PIN not valid",m:"PIN is 6 digits, 100000–999999.",sec:"who"});
  if(st0(S.pi.email)&&!MAIL.test(S.pi.email)) out.push({lvl:"warn",t:"Email looks wrong",m:"Enter a valid primary email.",sec:"who"});
  return out;
}
/* =====================================================================
   REGISTER — five screen sections. eng on inc(20)+tax(80); exp/imp on inc.
   ===================================================================== */
reg({id:"who", t:"Assessee Information", ref:"Part A - General", f:secWho,
  s:()=>st0(S.pi.last)?(st0(S.pi.pan)?S.pi.pan:S.pi.last):"", chk:chkWho, order:8});