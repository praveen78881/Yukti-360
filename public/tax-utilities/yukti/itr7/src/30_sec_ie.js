/* =====================================================================
   ITR-7 · Section "ie" — Income & Expenditure statements (Schedule IE-1/2/3/4)
   Screen ref: Schedule IE-1 / IE-2 / IE-3 / IE-4.  Screen order 30, compute order 28.

   Owns (built ONLY from books/ITR-7/Schedule_IE_1.md..4, section_map.json
   ["Schedule IE-1..4" -> "ie"], enums.json and the ITR-7 schema):
     · ScheduleIE_I    (regime 1 — blanket-exemption regimes 10(21)/10(23AAA)/
        10(23B)/10(23D)/10(23DA)/10(23EC)/10(23ED)/10(23EE)/10(23FB)/10(29A)/
        10(46)/10(46A)/10(46B)/10(47)/10(21) r.w. 35(1)): three plain figures —
        TotRcptVoluntaryContr, AppIncTwrdsObjInstn, AccmltnOfInc.
     · ScheduleIE_II   (regime 2 — 10(23A)/10(24)): the same three figures (Row A,
        exempt receipts) plus the taxable-heads gate AnyIncomeTaxable + head flags
        HPIncome/BPIncome/CGIncome/OSIncome (Yes routes to HP/BP/CG/OS).
     · ScheduleIE_III  (regime 3 — 10(23C)(iiiab)/(iiiac)): per-institution table
        ScheduleIEIIIDtls[] {objective EDU/MED, address+State code+PIN, total receipts,
        Government grants, amount applied, balance accumulated}; the exemption condition
        is Government grants exceeding 50% of total receipts.
     · ScheduleIE_IV   (regime 4 — 10(23C)(iiiad)/(iiiae)): per-institution table
        ScheduleIEIVDtls[] {objective, address, gross annual receipts, amount applied,
        balance accumulated} + SumGrossAnnualReceipts, tested against the Rs 5-crore ceiling.

   Which IE applies is driven by the exemption regime (SecExemptionClaimed) read from
   S.C.who.exsec (falling back to S.pi.exsec); when the regime does not select an IE the
   section falls back to whichever statement the user has actually filled. Only the ONE
   active statement is exported, so at most one ScheduleIE_* block appears in a return.

   Seam: publishes S.C.ie.{active, ex, regIE, receipts, applied, accumulation, anyTax,
   heads, sumReceipts, i3n, i4n, govtOK, ceilingOK} for the tax section (order 90), which
   routes the IE-2 taxable heads and reads the statement figures. No other builder writes
   the ScheduleIE_* blocks.

   Enums (verbatim from the ITR-7 schema, NOT the display words in the book's dropdown):
     · ObjectiveOfInstitution -> "EDU"/"MED"   (book shows Educational/Medical)
     · AnyIncomeTaxable / head flags -> "Y"/"N" (book shows Yes/No)
     · StateCode -> 2-digit code "01".."37"     (book shows "01-ANDAMAN…"; the coded value
        is the schema enum, the label is the display)
   ===================================================================== */

/* ---- objective (schema enum EDU/MED; display from the book) ---------- */
const IE_OBJ=[["EDU","Educational"],["MED","Medical"]];
/* ---- Yes/No routing flags (schema enum Y/N; display Yes/No) ---------- */
const IE_YN=[["Y","Yes"],["N","No"]];
/* ---- State (schema StateCode enum -> the book's verbatim display list;
   value is the 2-digit code, label is the utility's StateIE3 dropdown text) */
const IE_STATE=[
  ["01","01-ANDAMAN AND NICOBAR ISLANDS"],["02","02-ANDHRA PRADESH"],
  ["03","03-ARUNACHAL PRADESH"],["04","04-ASSAM"],["05","05-BIHAR"],
  ["06","06-CHANDIGARH"],["07","07-DADRA AND NAGAR HAVELI"],["08","08-DAMAN AND DIU"],
  ["09","09-DELHI"],["10","10-GOA"],["11","11-GUJARAT"],["12","12-HARYANA"],
  ["13","13-HIMACHAL PRADESH"],["14","14-JAMMU AND KASHMIR"],["15","15-KARNATAKA"],
  ["16","16-KERALA"],["17","17-LAKHSWADEEP"],["18","18-MADHYA PRADESH"],
  ["19","19-MAHARASHTRA"],["20","20-MANIPUR"],["21","21-MEGHALAYA"],["22","22-MIZORAM"],
  ["23","23-NAGALAND"],["24","24-ODISHA"],["25","25-PUDUCHERRY"],["26","26-PUNJAB"],
  ["27","27-RAJASTHAN"],["28","28-SIKKIM"],["29","29-TAMILNADU"],["30","30-TRIPURA"],
  ["31","31-UTTAR PRADESH"],["32","32-WEST BENGAL"],["33","33-CHHATISHGARH"],
  ["34","34-UTTARAKHAND"],["35","35-JHARKHAND"],["36","36-TELANGANA"],["37","37-LADAKH"]];

/* ---- exemption-regime -> which IE statement (from the four head notes) --
   codes from enums.json PartA_GEN1.OrgFirmInfo.SecExemptionClaimed. */
const IE_REGIME={
  /* IE-1 : blanket-exemption regimes, no application test */
  "21":1,"23AAA":1,"23B":1,"23D":1,"23DA":1,"23EC":1,"23ED":1,"23EE":1,
  "23FB":1,"29A":1,"26":1,"46A":1,"46B":1,"47":1,"2135I":1,
  /* IE-2 : certain heads taxable, rest exempt */
  "23A":2,"24":2,
  /* IE-3 : wholly/substantially govt-financed education/medical */
  "23CIIIAB":3,"23CIIIAC":3,
  /* IE-4 : small education/medical under the receipts ceiling */
  "23CIIIAD":4,"23CIIIAE":4};
const IE_CEILING=50000000;   /* Rs 5 crore — IE-4 aggregate-receipts ceiling */

/* ---- state seed (own namespace; not pre-seeded in 10_state.js) -------- */
S.ie = S.ie || {};
if(S.ie.rcpt===undefined)   S.ie.rcpt="";     /* Row A / IE-1 total receipts incl. voluntary contribution */
if(S.ie.appl===undefined)   S.ie.appl="";     /* application towards object */
if(S.ie.accum===undefined)  S.ie.accum="";    /* accumulation of income */
if(S.ie.anyTax===undefined) S.ie.anyTax="N";  /* IE-2 gate: any income taxable? (required Y/N) */
if(S.ie.hp===undefined)     S.ie.hp="N";      /* IE-2 head flags (only when anyTax=Y) */
if(S.ie.bp===undefined)     S.ie.bp="N";
if(S.ie.cg===undefined)     S.ie.cg="N";
if(S.ie.os===undefined)     S.ie.os="N";
S.ie.i3 = S.ie.i3 || [];    /* ScheduleIEIIIDtls[] — one row per institution (IE-3) */
S.ie.i4 = S.ie.i4 || [];    /* ScheduleIEIVDtls[]  — one row per institution (IE-4) */

/* ---- helpers -------------------------------------------------------- */
function _ieEx(){                                   /* the exemption code driving the statement */
  return st0(RG(S,"C.who.exsec","")||RG(S,"pi.exsec",""));
}
function _ieObj(v){return v==="MED"?"MED":"EDU";}
function _ieState(v){v=st0(v);return IE_STATE.some(s=>s[0]===v)?v:"";}
const _iePIN=/^[1-9][0-9]{5}$/;
/* a row counts as "live" once its objective and enough of its required address
   /receipt fields are present (mirrors the bank section's complete-row filter). */
function _ieLive(r){r=r||{};
  return st0(r.flat)&&st0(r.area)&&st0(r.town)&&_ieState(r.state)&&_iePIN.test(st0(r.pin));}
function _ieI3(){return (S.ie.i3||[]).filter(_ieLive);}
function _ieI4(){return (S.ie.i4||[]).filter(_ieLive);}

/* ---- engine — resolve the active statement, publish S.C.ie ---------- */
function engIE(){
  const ex=_ieEx();
  const regIE=IE_REGIME[ex]||0;
  const rcpt=sg(S.ie.rcpt), appl=sg(S.ie.appl), accum=sg(S.ie.accum);
  const anyTax=(S.ie.anyTax==="Y")?"Y":(S.ie.anyTax==="N")?"N":"";
  const i3=_ieI3(), i4=_ieI4();
  const hasA=!!(N(S.ie.rcpt)||N(S.ie.appl)||N(S.ie.accum));
  const dataIE = i3.length?3 : i4.length?4 : (anyTax==="Y"?2 : hasA?1 : 0);
  /* S.ie.active is set only by imp() when a return is loaded; otherwise the
     regime chooses, then the data the user has filled. */
  const active = (S.ie.active===1||S.ie.active===2||S.ie.active===3||S.ie.active===4)
    ? S.ie.active : (regIE||dataIE);

  const heads={hp:S.ie.hp==="Y"?"Y":"N",bp:S.ie.bp==="Y"?"Y":"N",
    cg:S.ie.cg==="Y"?"Y":"N",os:S.ie.os==="Y"?"Y":"N"};
  const sumRcpt=i4.reduce((s,r)=>s+sg(r.rcpt),0);
  const i3Rcpt=i3.reduce((s,r)=>s+sg(r.rcpt),0);
  const i3Appl=i3.reduce((s,r)=>s+sg(r.appl),0);
  const i3Accum=i3.reduce((s,r)=>s+(sg(r.rcpt)-sg(r.appl)),0);
  const i4Appl=i4.reduce((s,r)=>s+sg(r.appl),0);
  /* IE-3 "substantially financed": Government grant exceeds 50% of total receipts */
  const govtFail=i3.filter(r=>!(sg(r.grants)*2>sg(r.rcpt))).length;

  /* exempt receipts of the ACTIVE statement (a single figure across IE-1/2/3/4):
     IE-1/2 carry one Row A total, IE-3/4 aggregate the per-institution rows. It
     is the income the statute exempts, read by the tax section's Part-B2 regime. */
  const exemptReceipts = active===3 ? i3Rcpt : active===4 ? sumRcpt : rcpt;
  const exemptApplied  = active===3 ? i3Appl : active===4 ? i4Appl  : appl;
  const exemptAccum    = active===3 ? i3Accum : accum;

  S.C.ie={
    active, ex, regIE,
    receipts:rcpt, applied:appl, accumulation:accum,
    exemptReceipts, exemptApplied, exemptAccum,
    anyTax:anyTax==="Y"?"Y":"N",
    heads,                              /* IE-2 routing for the tax section */
    i3n:i3.length, i4n:i4.length,
    sumReceipts:sumRcpt, i3Receipts:i3Rcpt,
    govtOK: i3.length?govtFail===0:true,     /* every institution passes the 50% test */
    ceilingOK: sumRcpt<=IE_CEILING           /* IE-4 aggregate <= Rs 5 crore */
  };
}

/* ---- money grid columns (shared by IE-3 / IE-4 address block) -------- */
function _ieAddrCols(){
  return [
    {k:"obj", h:"Objective",              t:"sel", w:"130px", req:1, opts:IE_OBJ},
    {k:"flat",h:"Flat/Door/Block No.",    t:"txt", w:"150px", req:1, max:50},
    {k:"prem",h:"Premises/Building/Village",t:"txt",w:"180px", max:50},
    {k:"road",h:"Road/Street/Post office", t:"txt", w:"170px", max:50},
    {k:"area",h:"Area/locality",           t:"txt", w:"150px", req:1, max:50},
    {k:"town",h:"Town/City/District",      t:"txt", w:"160px", req:1, max:50},
    {k:"state",h:"State",                  t:"sel", w:"210px", req:1, opts:IE_STATE},
    {k:"pin", h:"PIN code",                t:"txt", w:"110px", req:1, max:6}];
}

/* ---- renderer ------------------------------------------------------- */
function secIE(){
  engIE();
  const A=(S.C.ie||{}).active||0, ex=(S.C.ie||{}).ex||"";
  let h="";

  h+=note("The Income &amp; Expenditure statement is chosen automatically by the exemption "+
    "section claimed in <b>Who is filing</b> (Part A - General). Only the statement for the "+
    "regime you claim is shown; if you claim exemption under section 11 or 10(23C)(iv)-(via) "+
    "no IE statement applies (the application of income is stated in Schedule A instead).");
  h+=row("Exemption section claimed",'<span class="c">'+(esc(ex)||"—")+'</span>',
    {ref:"A17 ii",hint:"from Who is filing"});

  if(A===1){
    /* ---------- Schedule IE-1 ---------- */
    h+=sub("Schedule IE-1 — Income &amp; Expenditure statement");
    h+=note("Applicable for exemption under sections 10(21), 10(23AAA), 10(23B), 10(23D), "+
      "10(23DA), 10(23EC), 10(23ED), 10(23EE), 10(23FB), 10(29A), 10(46), 10(46A), 10(46B), "+
      "10(47) and 10(21) read with section 35(1). These exemptions are not subject to a "+
      "computational or application test — state the money that moved.");
    h+=row("1. Total receipts including any voluntary contribution",inp("ie.rcpt",{n:1}),{req:1,ref:"IE-1 row 4"});
    h+=row("2. Application of income towards object of the institution",inp("ie.appl",{n:1}),{req:1,ref:"IE-1 row 5"});
    h+=row("3. Accumulation of income",inp("ie.accum",{n:1}),{req:1,ref:"IE-1 row 6"});

  } else if(A===2){
    /* ---------- Schedule IE-2 ---------- */
    h+=sub("Schedule IE-2 — Income &amp; Expenditure statement");
    h+=note("Applicable for exemption under sections 10(23A) and 10(24), where only certain "+
      "heads of income are taxable and the other receipts (Row A) are exempt.");
    h+=row("A. Total receipts including any voluntary contribution",inp("ie.rcpt",{n:1}),
      {req:1,ref:"IE-2 row 4",hint:"excluding receipts under taxable heads (Row B)"});
    h+=row("Application of income towards object of the institution",inp("ie.appl",{n:1}),{req:1,ref:"IE-2 row 5"});
    h+=row("Accumulation of income",inp("ie.accum",{n:1}),{req:1,ref:"IE-2 row 6"});
    h+=row("B. Do you have any income which is taxable?",sel("ie.anyTax",IE_YN,{blank:true}),
      {req:1,ref:"IE-2 row 7"});
    if(S.ie.anyTax==="Y"){
      h+=note("For each head marked <b>Yes</b>, the corresponding computational schedule must be "+
        "filled and that income offered to tax; everything in Row A stays exempt.");
      h+=row("a. Income from House Property (fill Schedule HP)",sel("ie.hp",IE_YN,{blank:false}),{ref:"IE-2 row 8"});
      h+=row("b. Income from Business or Profession (fill Schedule BP)",sel("ie.bp",IE_YN,{blank:false}),{ref:"IE-2 row 9"});
      h+=row("c. Income from Capital gains (fill Schedule CG)",sel("ie.cg",IE_YN,{blank:false}),{ref:"IE-2 row 10"});
      h+=row("d. Income from other Sources (fill Schedule OS)",sel("ie.os",IE_YN,{blank:false}),{ref:"IE-2 row 11"});
    }

  } else if(A===3){
    /* ---------- Schedule IE-3 ---------- */
    h+=sub("Schedule IE-3 — Income &amp; Expenditure statement (per institution)");
    h+=note("Applicable for exemption under sections 10(23C)(iiiab) or 10(23C)(iiiac). Fill the "+
      "address for each institution separately. Exemption is subject to Government grants "+
      "exceeding fifty per cent of the total receipts including voluntary contribution.");
    h+=grid("ie.i3",_ieAddrCols().concat([
      {k:"rcpt",  h:"Total receipts incl. voluntary contribution",t:"num",w:"150px",req:1},
      {k:"grants",h:"Government grants (out of receipts)",t:"num",w:"150px",req:1},
      {k:"appl",  h:"Amount applied for objective",t:"num",w:"150px",req:1},
      {k:"bal",   h:"Balance accumulated",t:"calc",w:"140px",f:(r)=>sg(r.rcpt)-sg(r.appl)}]),
      S.ie.i3,{min:"1800px",empty:"No institution entered.",add:"Add an institution"});
    if((S.C.ie||{}).govtOK===false)
      h+=note("At least one institution's Government grant does not exceed 50% of its total "+
        "receipts — the 10(23C)(iiiab)/(iiiac) condition of being substantially financed by "+
        "the Government is not met for that institution.","warn");

  } else if(A===4){
    /* ---------- Schedule IE-4 ---------- */
    h+=sub("Schedule IE-4 — Income &amp; Expenditure statement (per institution)");
    h+=note("Applicable for exemption under sections 10(23C)(iiiad) or 10(23C)(iiiae). Fill the "+
      "address for each institution separately. Exemption is subject to the total receipts from "+
      "all the institutions/universities not exceeding five crore rupees.");
    h+=grid("ie.i4",_ieAddrCols().concat([
      {k:"rcpt",h:"Gross annual receipts",t:"num",w:"150px",req:1},
      {k:"appl",h:"Amount applied for objective",t:"num",w:"150px",req:1},
      {k:"bal", h:"Balance accumulated",t:"calc",w:"140px",f:(r)=>sg(r.rcpt)-sg(r.appl)}]),
      S.ie.i4,{min:"1650px",empty:"No institution entered.",add:"Add an institution"});
    h+=row("Sum of Gross Annual receipts (Sum of Sl. No. 3)",cell((S.C.ie||{}).sumReceipts),
      {ref:"IE-4 row 12",hint:"tested against the Rs 5 crore ceiling"});
    if((S.C.ie||{}).ceilingOK===false)
      h+=note("The aggregate gross annual receipts exceed Rs 5 crore, so the 10(23C)(iiiad)/"+
        "(iiiae) threshold exemption is not available — the institution must claim under "+
        "10(23C)(iiiab)/(iiiac) or seek approval under 10(23C)(vi)/(via).","warn");

  } else {
    h+=note("No Income &amp; Expenditure statement applies to the exemption section currently "+
      "claimed. Choose a section 10(21)/10(23A)/10(24)/10(23C)(iiiab-iiiae)/… regime in "+
      "<b>Who is filing</b> to open the matching IE-1/2/3/4 statement.","warn");
  }
  return h;
}

/* ---- export --------------------------------------------------------- */
function expIE(j){
  const C=S.C.ie||{}; const A=C.active||0;

  if(A===1){
    /* ScheduleIE_I — three required integers (written even when 0) */
    put(j,"ScheduleIE_I.TotRcptVoluntaryContr",sg(S.ie.rcpt));
    put(j,"ScheduleIE_I.AppIncTwrdsObjInstn",sg(S.ie.appl));
    put(j,"ScheduleIE_I.AccmltnOfInc",sg(S.ie.accum));

  } else if(A===2){
    /* ScheduleIE_II — Row A three integers + the taxable-heads gate */
    put(j,"ScheduleIE_II.TotRcptVoluntaryContr",sg(S.ie.rcpt));
    put(j,"ScheduleIE_II.AppIncTwrdsObjInstn",sg(S.ie.appl));
    put(j,"ScheduleIE_II.AccmltnOfInc",sg(S.ie.accum));
    const yes=S.ie.anyTax==="Y";
    put(j,"ScheduleIE_II.AnyIncomeTaxable",yes?"Y":"N");
    if(yes){                                  /* all four head flags accompany a Yes */
      put(j,"ScheduleIE_II.HPIncome",S.ie.hp==="Y"?"Y":"N");
      put(j,"ScheduleIE_II.BPIncome",S.ie.bp==="Y"?"Y":"N");
      put(j,"ScheduleIE_II.CGIncome",S.ie.cg==="Y"?"Y":"N");
      put(j,"ScheduleIE_II.OSIncome",S.ie.os==="Y"?"Y":"N");
    }

  } else if(A===3){
    /* ScheduleIE_III — ScheduleIEIIIDtls[] (only complete institution rows) */
    const rows=_ieI3().map(r=>{
      const rcpt=sg(r.rcpt), appl=sg(r.appl);
      const el={};
      pf(el,"ObjectiveOfInstitution",_ieObj(r.obj));
      pf(el,"FlatDoorBlockNumber",st0(r.flat).slice(0,50));
      if(st0(r.prem))pf(el,"PremisesBuildingName",st0(r.prem).slice(0,50));
      if(st0(r.road))pf(el,"RoadStreetPostOffice",st0(r.road).slice(0,50));
      pf(el,"AreaLocality",st0(r.area).slice(0,50));
      pf(el,"TownCityDistrict",st0(r.town).slice(0,50));
      pf(el,"StateCode",_ieState(r.state));
      pf(el,"PinCode",N(r.pin));
      pf(el,"TotRcptVoluntaryContr",rcpt);
      pf(el,"GovtGrants",sg(r.grants));
      pf(el,"AmountAppliedObj",appl);
      pf(el,"BalanceAccumulated",n0(rcpt-appl));
      return el;});
    if(rows.length)j.ScheduleIE_III={ScheduleIEIIIDtls:rows};

  } else if(A===4){
    /* ScheduleIE_IV — ScheduleIEIVDtls[] + SumGrossAnnualReceipts */
    const rows=_ieI4().map(r=>{
      const rcpt=sg(r.rcpt), appl=sg(r.appl);
      const el={};
      pf(el,"ObjectiveOfInstitution",_ieObj(r.obj));
      pf(el,"FlatDoorBlockNumber",st0(r.flat).slice(0,50));
      if(st0(r.prem))pf(el,"PremisesBuildingName",st0(r.prem).slice(0,50));
      if(st0(r.road))pf(el,"RoadStreetPostOffice",st0(r.road).slice(0,50));
      pf(el,"AreaLocality",st0(r.area).slice(0,50));
      pf(el,"TownCityDistrict",st0(r.town).slice(0,50));
      pf(el,"StateCode",_ieState(r.state));
      pf(el,"PinCode",N(r.pin));
      pf(el,"GrossAnnualReceipts",rcpt);
      pf(el,"AmountAppliedObj",appl);
      pf(el,"BalanceAccumulated",n0(rcpt-appl));
      return el;});
    if(rows.length)
      j.ScheduleIE_IV={ScheduleIEIVDtls:rows,
        SumGrossAnnualReceipts:rows.reduce((s,e)=>s+N(e.GrossAnnualReceipts),0)};
  }
}

/* ---- import (inverse) ---------------------------------------------- */
function impIE(I){
  const read=[]; S.ie=S.ie||{};
  const I1=I&&I.ScheduleIE_I, I2=I&&I.ScheduleIE_II,
        I3=I&&I.ScheduleIE_III, I4=I&&I.ScheduleIE_IV;

  if(I1){
    S.ie.rcpt=N(I1.TotRcptVoluntaryContr);
    S.ie.appl=N(I1.AppIncTwrdsObjInstn);
    S.ie.accum=N(I1.AccmltnOfInc);
    S.ie.active=1; read.push("Schedule IE-1");
  } else if(I2){
    S.ie.rcpt=N(I2.TotRcptVoluntaryContr);
    S.ie.appl=N(I2.AppIncTwrdsObjInstn);
    S.ie.accum=N(I2.AccmltnOfInc);
    S.ie.anyTax=I2.AnyIncomeTaxable==="Y"?"Y":"N";
    S.ie.hp=I2.HPIncome==="Y"?"Y":"N";
    S.ie.bp=I2.BPIncome==="Y"?"Y":"N";
    S.ie.cg=I2.CGIncome==="Y"?"Y":"N";
    S.ie.os=I2.OSIncome==="Y"?"Y":"N";
    S.ie.active=2; read.push("Schedule IE-2");
  }
  if(I3&&Array.isArray(I3.ScheduleIEIIIDtls)){
    S.ie.i3=I3.ScheduleIEIIIDtls.map(e=>({
      obj:_ieObj(e.ObjectiveOfInstitution),
      flat:e.FlatDoorBlockNumber||"", prem:e.PremisesBuildingName||"",
      road:e.RoadStreetPostOffice||"", area:e.AreaLocality||"",
      town:e.TownCityDistrict||"", state:_ieState(e.StateCode),
      pin:e.PinCode==null?"":String(e.PinCode),
      rcpt:N(e.TotRcptVoluntaryContr), grants:N(e.GovtGrants),
      appl:N(e.AmountAppliedObj)}));
    S.ie.active=3; read.push("Schedule IE-3");
  }
  if(I4&&Array.isArray(I4.ScheduleIEIVDtls)){
    S.ie.i4=I4.ScheduleIEIVDtls.map(e=>({
      obj:_ieObj(e.ObjectiveOfInstitution),
      flat:e.FlatDoorBlockNumber||"", prem:e.PremisesBuildingName||"",
      road:e.RoadStreetPostOffice||"", area:e.AreaLocality||"",
      town:e.TownCityDistrict||"", state:_ieState(e.StateCode),
      pin:e.PinCode==null?"":String(e.PinCode),
      rcpt:N(e.GrossAnnualReceipts), appl:N(e.AmountAppliedObj)}));
    S.ie.active=4; read.push("Schedule IE-4");
  }
  return read;
}

/* ---- checks (section-local; not the CBDT rule engine) -------------- */
function chkIE(){
  const out=[]; engIE();
  const C=S.C.ie||{}, A=C.active||0;

  if(A===1||A===2){
    if(!(N(S.ie.rcpt)||N(S.ie.appl)||N(S.ie.accum)))
      out.push({lvl:"warn",t:"IE statement",m:"The Income & Expenditure statement is empty — enter the total receipts, application and accumulation.",sec:"ie"});
    if(sg(S.ie.appl)+sg(S.ie.accum)>sg(S.ie.rcpt) && N(S.ie.rcpt))
      out.push({lvl:"warn",t:"IE statement",m:"Application plus accumulation exceeds total receipts — check the figures.",sec:"ie"});
    if(A===2 && S.ie.anyTax!=="Y" && S.ie.anyTax!=="N")
      out.push({lvl:"err",t:"Taxable income (IE-2)",m:'Answer "Do you have any income which is taxable?" (Yes/No).',sec:"ie"});
    if(A===2 && S.ie.anyTax==="Y" && !(S.ie.hp==="Y"||S.ie.bp==="Y"||S.ie.cg==="Y"||S.ie.os==="Y"))
      out.push({lvl:"warn",t:"Taxable heads (IE-2)",m:"You answered Yes to taxable income but marked no head — tick at least one of HP/BP/CG/OS.",sec:"ie"});
  }
  if(A===3||A===4){
    const rows=(A===3?S.ie.i3:S.ie.i4)||[];
    if(!rows.length)
      out.push({lvl:"err",t:"IE statement",m:"Add at least one institution with its address and receipts.",sec:"ie"});
    rows.forEach((r,i)=>{
      if(!_ieLive(r) && (st0(r.flat)||st0(r.area)||st0(r.town)||st0(r.state)||st0(r.pin)||N(r.rcpt)))
        out.push({lvl:"err",t:"Institution "+(i+1),m:"Objective, Flat/Door No., Area, Town, State and a valid 6-digit PIN are all required.",sec:"ie"});
      if(st0(r.pin)&&!_iePIN.test(st0(r.pin)))
        out.push({lvl:"err",t:"Institution "+(i+1),m:"The PIN code is six digits and cannot start with zero.",sec:"ie"});
    });
    if(A===3 && C.govtOK===false)
      out.push({lvl:"warn",t:"Government grants (IE-3)",m:"Government grants do not exceed 50% of total receipts for at least one institution — the substantially-financed condition may not be met.",sec:"ie"});
    if(A===4 && C.ceilingOK===false)
      out.push({lvl:"warn",t:"Receipts ceiling (IE-4)",m:"Aggregate gross annual receipts exceed Rs 5 crore — the 10(23C)(iiiad)/(iiiae) exemption is not available.",sec:"ie"});
  }
  if(!out.length && A)
    out.push({lvl:"ok",t:"Income & Expenditure",m:"Schedule IE-"+A+" is complete.",sec:"ie"});
  return out;
}

/* ---- register (overrides the boot stub) ---------------------------- */
reg({id:"ie", t:"Income & Expenditure statements", ref:"Schedule IE-1/2/3/4",
  f:secIE,
  s:()=>{const A=(S.C.ie||{}).active||0;
    if(!A)return "";
    if(A===3)return "IE-3 · "+((S.C.ie||{}).i3n||0)+" institution"+(((S.C.ie||{}).i3n||0)===1?"":"s");
    if(A===4)return "IE-4 · "+CR((S.C.ie||{}).sumReceipts||0);
    return "IE-"+A+" · "+CR((S.C.ie||{}).receipts||0)+" receipts";},
  eng:engIE, exp:expIE, imp:impIE, chk:chkIE, order:30, corder:28});
