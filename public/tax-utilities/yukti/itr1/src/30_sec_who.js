/* =====================================================================
   ITR-1 · Section "who" — General (Personal information)
   Books: books/ITR-1/schema_tree.md §1 CreationInfo · §2 Form_ITR1 ·
   §3 PersonalInfo · sections.md S1 · enums.json (StateCode, EmployerCategory,
   SecondaryAdd) · skeleton.json.
   Compute order 10 (corder 10) — runs FIRST: every downstream tax/interest/
   deduction gate reads S.C.who.* (age → senior / super-senior, employerCat).
   Screen order 10.

   Owns / writes on export (home EVERY leaf of these blocks):
     · CreationInfo.{SWVersionNo, SWCreatedBy, JSONCreatedBy, JSONCreationDate,
       IntermediaryCity, Digest}                              (§1, auto/meta)
     · Form_ITR1.{FormName, Description, AssessmentYear "2026",
       SchemaVer, FormVer}                                    (§2, auto/meta)
     · PersonalInfo.AssesseeName.{FirstName, MiddleName, SurNameOrOrgName}
     · PersonalInfo.PAN
     · PersonalInfo.Address.{ResidenceNo, ResidenceName, RoadOrStreet,
       LocalityOrArea, CityOrTownOrDistrict, StateCode, CountryCode, PinCode,
       ZipCode, CountryCodeMobile, MobileNo, CountryCodeMobileNoSec, MobileNoSec,
       EmailAddress, EmailAddressSec}
     · PersonalInfo.SecondaryAdd
     · PersonalInfo.AlternateAddress.{ResidenceNo, ResidenceName, RoadOrStreet,
       LocalityOrArea, CityOrTownOrDistrict, StateCode, CountryCode, PinCode,
       ZipCode}                                               (only when SecondaryAdd=Y)
     · PersonalInfo.DOB
     · PersonalInfo.EmployerCategory
     · PersonalInfo.AadhaarCardNo

   PUBLISHES (S.C.who.*): age (as on 31-03-2026), senior (60-79),
   superSenior (>=80), employerCat, pan, name, income(=0). The tax section
   reads senior/superSenior for the 234A/B/C exemptions and the 87A/234F
   thresholds; the salary section reads employerCat for the HRA schedule and
   16(ii) entertainment-allowance visibility.

   ITR-1 is a RESIDENT-INDIVIDUAL-only return: there is NO exported residential-
   status leaf (the utility comments it all out — enums.json PersonType_Status
   note). Residency is a gate applied downstream, not a field on this screen;
   the communication address therefore defaults to India (CountryCode 91). The
   CountryCode / ZipCode leaves are still homed here (export + import round-trip)
   for a foreign communication address carried in a portal prefill.
   ===================================================================== */

/* ---- CreationInfo / Form_ITR1 meta constants (schema §1 / §2) --------- */
const WHO1_SWVER   ="R3";
const WHO1_SWBY    ="SW10000000";            /* [S][W][0-9]{8} pattern */
const WHO1_INTCITY ="Delhi";
const WHO1_FORMDESC="For Individuals having Income from Salaries, one house "+
  "property, other sources (Interest etc.) and having total income upto Rs.50 lakh";

/* ---- dropdown value lists ([code,label]) — enums.json VERBATIM -------- */
/* EmployerCategory — enums.json EmployerCategory (9 codes) */
const WHO1_EMPCAT=[
  ["CGOV","Central Government"],["SGOV","State Government"],
  ["PSU","Public Sector Undertaking"],["PE","Pensioners - Central Government"],
  ["PESG","Pensioners - State Government"],["PEPS","Pensioners - Public sector undertaking"],
  ["PEO","Pensioners - Others"],["OTH","Others"],
  ["NA","Not Applicable (eg. Family pension etc)"]];
/* SecondaryAdd — enums.json SecondaryAdd */
const WHO1_YN=[["Y","Yes"],["N","No"]];
/* Residential status — ResidentLis (DataBase!X3:X5). ITR-1 is for a RESIDENT
   AND ORDINARILY RESIDENT individual only; the utility offers just these two
   and blocks NOR. It is an eligibility GATE, NOT an exported leaf (the schema
   FilingStatus block has no residential-status field). */
const WHO1_RESSTATUS=[
  ["RES","RES — Resident (ordinarily resident)"],
  ["NOR","NOR — Resident but not ordinarily resident (not eligible for ITR-1)"]];
/* StateCode — enums.json StateCode (38 states/UTs + 99 foreign) VERBATIM */
const WHO1_STATE=[
  ["01","ANDAMAN AND NICOBAR ISLANDS"],["02","ANDHRA PRADESH"],["03","ARUNACHAL PRADESH"],
  ["04","ASSAM"],["05","BIHAR"],["06","CHANDIGARH"],["07","DADRA AND NAGAR HAVELI"],
  ["08","DAMAN AND DIU"],["09","DELHI"],["10","GOA"],["11","GUJARAT"],["12","HARYANA"],
  ["13","HIMACHAL PRADESH"],["14","JAMMU AND KASHMIR"],["15","KARNATAKA"],["16","KERALA"],
  ["17","LAKSHADWEEP"],["18","MADHYA PRADESH"],["19","MAHARASHTRA"],["20","MANIPUR"],
  ["21","MEGHALAYA"],["22","MIZORAM"],["23","NAGALAND"],["24","ORISSA"],["25","PONDICHERRY"],
  ["26","PUNJAB"],["27","RAJASTHAN"],["28","SIKKIM"],["29","TAMILNADU"],["30","TRIPURA"],
  ["31","UTTAR PRADESH"],["32","WEST BENGAL"],["33","CHHATTISGARH"],["34","UTTARAKHAND"],
  ["35","JHARKHAND"],["36","TELANGANA"],["37","LADAKH"],
  ["99","Foreign / Other (used with CountryCode<>91)"]];
/* CountryCode — enums.json CountryCode enumerates only 91 (India) for ITR-1;
   resident-individual return, so the communication country is India. */
const WHO1_COUNTRY=[["91","India"]];

/* ---- reference date for age (last day of PY 2025-26 / AY 2026-27) ----- */
const WHO1_AGEREF=new Date(2026,2,31);       /* 31 March 2026 */

/* ---- state (guarded seeds; a {} placeholder would short-circuit ||) --- */
S.who = S.who || {};
(function(W){
  const d=(k,v)=>{if(W[k]===undefined)W[k]=v;};
  d("first",""); d("mid",""); d("last",""); d("pan",""); d("dob",""); d("aadhaar","");
  d("addr1",""); d("premises",""); d("road",""); d("locality",""); d("city","");
  d("state",""); d("country","91"); d("pin",""); d("zip","");
  d("mobileCc","91"); d("mobile",""); d("mobile2Cc","91"); d("mobile2","");
  d("email",""); d("email2","");
  d("addr2same","N");                        /* SecondaryAdd (default N) */
  d("addr1b",""); d("premisesb",""); d("roadb",""); d("localityb",""); d("cityb","");
  d("stateb",""); d("countryb","91"); d("pinb",""); d("zipb","");
  d("empcat","OTH");                         /* EmployerCategory */
  d("resStatus","RES");                       /* residential status gate (ROR only) */
})(S.who);

/* =====================================================================
   ENGINE — engWho(): identity face, adds nothing to GTI. Publishes the age /
   senior status and employer category the whole return gates on.
   ===================================================================== */
function engWho(){
  const W=S.who||{};
  const C=S.C.who={ income:0 };
  /* age as on the last day of the previous year (31-03-2026). A person who
     attains 60 (or 80) on or before that date is senior (super-senior) for
     the year — the "at any time during the PY" test. */
  const dob=(typeof D==="function")?D(W.dob):null;
  let age=0;
  if(dob){
    age=WHO1_AGEREF.getFullYear()-dob.getFullYear();
    const m=WHO1_AGEREF.getMonth()-dob.getMonth();
    if(m<0||(m===0&&WHO1_AGEREF.getDate()<dob.getDate())) age--;
    if(age<0) age=0;
  }
  C.age        = age;
  C.senior     = age>=60 && age<80;          /* 60-79 : basic exemption 3,00,000 (old) */
  C.superSenior= age>=80;                     /* >=80  : basic exemption 5,00,000 (old) */
  C.seniorAny  = age>=60;                      /* helper: 234B/234C exemption (bacage>59) */
  C.employerCat= st0(W.empcat)||"OTH";         /* HRA schedule + 16(ii) gate */
  C.resStatus  = (st0(W.resStatus)==="NOR")?"NOR":"RES";  /* eligibility gate */
  C.resident   = C.resStatus==="RES";           /* ROR — the only ITR-1-eligible status */
  C.pan        = st0(W.pan).toUpperCase();
  C.name       = [st0(W.first),st0(W.mid),st0(W.last)].filter(Boolean).join(" ");
  C.income=0;
}

/* =====================================================================
   RENDERER — secWho(): the personal-information page.
   ===================================================================== */
function secWho(){
  const W=S.who;
  const india =(st0(W.country)||"91")==="91";
  const indiab=(st0(W.countryb)||"91")==="91";
  let h="";

  h+=note("<b>Who is filing.</b> ITR-1 is filed by a <b>resident individual</b> "+
    "whose total income is up to ₹50 lakh from salary, one house property and "+
    "other sources. This page is the person's identity and communication details; "+
    "it adds nothing to total income. The date of birth settles the slab and the "+
    "senior-citizen benefits. Every date is <b>"+DF+"</b>.");

  /* ===================== Name / PAN / DOB / Aadhaar ===================== */
  h+=sub("Name and identity");
  h+=row("First name",inp("who.first",{max:25}),{ref:"AssesseeName.FirstName"});
  h+=row("Middle name",inp("who.mid",{max:25}),{ref:"AssesseeName.MiddleName"});
  h+=row("Last name / surname",inp("who.last",{max:25}),{req:1,ref:"AssesseeName.SurNameOrOrgName"});
  h+=row("Permanent Account Number (PAN)",inp("who.pan",{max:10}),
    {req:1,ref:"PAN",hint:"ten characters; the fourth letter must be P for an individual"});
  h+=row("Date of birth",dte("who.dob"),
    {req:1,ref:"DOB",hint:"this settles the slab and the senior-citizen benefit"});
  h+=row("Aadhaar number",inp("who.aadhaar",{n:1,max:12}),
    {ref:"AadhaarCardNo",hint:"twelve digits; mandatory to be quoted with the PAN"});
  {const C=S.C.who||{};
   if(C.age)h+=note("On the date of birth entered, the assessee is <b>"+C.age+
     "</b> as on 31 March 2026 — "+(C.superSenior?"a <b>super-senior citizen</b> (≥80)":
       C.senior?"a <b>senior citizen</b> (60–79)":"not a senior citizen")+".");}

  /* ===================== Residential status (eligibility gate) ============ */
  h+=sub("Residential status");
  h+=row("Residential status for the year",sel("who.resStatus",WHO1_RESSTATUS,{blank:false}),
    {req:1,hint:"ITR-1 can be filed only by a resident and ordinarily resident individual"});
  if(st0(W.resStatus)==="NOR")
    h+=note("<b>A resident but not ordinarily resident (RNOR) individual cannot file ITR-1.</b> "+
      "File <b>ITR-2</b> instead. (A non-resident is likewise not eligible for ITR-1.)","stop");

  /* ===================== Employer category ===================== */
  h+=sub("Nature of employment");
  h+=row("Employer category / nature of employment",sel("who.empcat",WHO1_EMPCAT,{blank:false}),
    {req:1,ref:"EmployerCategory",
     hint:"drives the entertainment-allowance 16(ii) (government only) and the HRA schedule"});

  /* ===================== Primary address ===================== */
  h+=sub("Primary address — for communication");
  h+=row("Flat / Door / Block No",inp("who.addr1",{max:50}),{req:1,ref:"Address.ResidenceNo"});
  h+=row("Name of premises / building / village",inp("who.premises",{max:50}),{ref:"Address.ResidenceName"});
  h+=row("Road / Street / Post Office",inp("who.road",{max:50}),{ref:"Address.RoadOrStreet"});
  h+=row("Area / Locality",inp("who.locality",{max:50}),{req:1,ref:"Address.LocalityOrArea"});
  h+=row("Town / City / District",inp("who.city",{max:50}),{req:1,ref:"Address.CityOrTownOrDistrict"});
  h+=row("Country",sel("who.country",WHO1_COUNTRY,{blank:false}),
    {req:1,ref:"Address.CountryCode",hint:"ITR-1 is a resident return — India"});
  if(india){
    h+=row("State",sel("who.state",WHO1_STATE),{req:1,ref:"Address.StateCode"});
    h+=row("PIN code",inp("who.pin",{n:1,max:6}),{req:1,ref:"Address.PinCode",hint:"six digits"});
  } else {
    h+=row("State",sel("who.state",[["99","Foreign / Other"]],{blank:false}),{req:1,ref:"Address.StateCode"});
    h+=row("ZIP code",inp("who.zip",{max:10}),{req:1,ref:"Address.ZipCode"});
  }

  /* ===================== Communication ===================== */
  h+=sub("Details for communication");
  h+=row("Primary mobile number",
    inp("who.mobileCc",{n:1,max:3,ph:"Code"})+" "+inp("who.mobile",{n:1,max:10,ph:"Mobile"}),
    {req:1,ref:"Address.CountryCodeMobile / MobileNo",hint:"country code 91, then ten digits"});
  h+=row("Secondary mobile number",
    inp("who.mobile2Cc",{n:1,max:3,ph:"Code"})+" "+inp("who.mobile2",{n:1,max:10,ph:"Mobile"}),
    {ref:"Address.CountryCodeMobileNoSec / MobileNoSec"});
  h+=row("Primary email address",inp("who.email",{max:125,ph:"name@example.in"}),
    {req:1,ref:"Address.EmailAddress",hint:"receives the copy of the ITR-V"});
  h+=row("Secondary email address",inp("who.email2",{max:125}),{ref:"Address.EmailAddressSec"});

  /* ===================== Secondary address ===================== */
  h+=sub("Secondary address");
  h+=row("Do you want to give a second (different) address?",
    sel("who.addr2same",WHO1_YN,{blank:false}),
    {req:1,ref:"SecondaryAdd",hint:"choose Yes only if a separate communication address is to be added"});
  if(st0(W.addr2same)==="Y"){
    h+=row("Flat / Door / Block No",inp("who.addr1b",{max:50}),{req:1,ref:"AlternateAddress.ResidenceNo"});
    h+=row("Name of premises / building / village",inp("who.premisesb",{max:50}),{ref:"AlternateAddress.ResidenceName"});
    h+=row("Road / Street / Post Office",inp("who.roadb",{max:50}),{ref:"AlternateAddress.RoadOrStreet"});
    h+=row("Area / Locality",inp("who.localityb",{max:50}),{req:1,ref:"AlternateAddress.LocalityOrArea"});
    h+=row("Town / City / District",inp("who.cityb",{max:50}),{req:1,ref:"AlternateAddress.CityOrTownOrDistrict"});
    h+=row("Country",sel("who.countryb",WHO1_COUNTRY,{blank:false}),{req:1,ref:"AlternateAddress.CountryCode"});
    if(indiab){
      h+=row("State",sel("who.stateb",WHO1_STATE),{req:1,ref:"AlternateAddress.StateCode"});
      h+=row("PIN code",inp("who.pinb",{n:1,max:6}),{req:1,ref:"AlternateAddress.PinCode"});
    } else {
      h+=row("State",sel("who.stateb",[["99","Foreign / Other"]],{blank:false}),{req:1,ref:"AlternateAddress.StateCode"});
      h+=row("ZIP code",inp("who.zipb",{max:10}),{req:1,ref:"AlternateAddress.ZipCode"});
    }
  }

  return h;
}

/* =====================================================================
   EXPORT — expWho(j): serialise CreationInfo, Form_ITR1 and PersonalInfo onto
   j (the ITR1 root). put() skips undefined/null/"" but keeps 0; required
   string leaves fall back to a schema-valid placeholder so the block is never
   short of a required key.
   ===================================================================== */
function expWho(j){
  const W=S.who||{};
  const UP=v=>{v=sv(v);return v?String(v).toUpperCase():undefined;};
  const india =(st0(W.country)||"91")==="91";
  const indiab=(st0(W.countryb)||"91")==="91";
  const today=new Date().toISOString().slice(0,10);

  /* ---------- §1 CreationInfo (auto/meta) ---------- */
  put(j,"CreationInfo.SWVersionNo",WHO1_SWVER);
  put(j,"CreationInfo.SWCreatedBy",WHO1_SWBY);
  put(j,"CreationInfo.JSONCreatedBy",WHO1_SWBY);
  put(j,"CreationInfo.JSONCreationDate",today);
  put(j,"CreationInfo.IntermediaryCity",(sv(W.city)||WHO1_INTCITY).slice(0,25));
  put(j,"CreationInfo.Digest","-");

  /* ---------- §2 Form_ITR1 (auto/meta; AssessmentYear "2026") ---------- */
  put(j,"Form_ITR1.FormName","ITR-1");
  put(j,"Form_ITR1.Description",WHO1_FORMDESC);
  put(j,"Form_ITR1.AssessmentYear","2026");   /* utility hard-codes 2025 (bug); emit 2026 */
  put(j,"Form_ITR1.SchemaVer","Ver1.0");
  put(j,"Form_ITR1.FormVer","Ver1.0");

  /* ---------- §3 PersonalInfo ---------- */
  put(j,"PersonalInfo.AssesseeName.FirstName",sv(W.first));
  put(j,"PersonalInfo.AssesseeName.MiddleName",sv(W.mid));
  put(j,"PersonalInfo.AssesseeName.SurNameOrOrgName",(sv(W.last)||"NA").slice(0,25));
  put(j,"PersonalInfo.PAN",UP(W.pan)||"AAAPA0000A");
  if(AADH.test(st0(W.aadhaar))) put(j,"PersonalInfo.AadhaarCardNo",st0(W.aadhaar));

  /* Address (primary) */
  put(j,"PersonalInfo.Address.ResidenceNo",(sv(W.addr1)||"NA").slice(0,50));
  put(j,"PersonalInfo.Address.ResidenceName",sv(W.premises));
  put(j,"PersonalInfo.Address.RoadOrStreet",sv(W.road));
  put(j,"PersonalInfo.Address.LocalityOrArea",(sv(W.locality)||"NA").slice(0,50));
  put(j,"PersonalInfo.Address.CityOrTownOrDistrict",(sv(W.city)||"NA").slice(0,50));
  put(j,"PersonalInfo.Address.StateCode",sv(india?W.state:"99")||"19");
  put(j,"PersonalInfo.Address.CountryCode",sv(W.country)||"91");
  if(india){ put(j,"PersonalInfo.Address.PinCode",R(W.pin)||400001); }
  else if(sv(W.zip)) put(j,"PersonalInfo.Address.ZipCode",sv(W.zip));
  put(j,"PersonalInfo.Address.CountryCodeMobile",R(W.mobileCc)||91);
  put(j,"PersonalInfo.Address.MobileNo",R(W.mobile)||9999999999);
  if(sv(W.mobile2)){
    put(j,"PersonalInfo.Address.CountryCodeMobileNoSec",R(W.mobile2Cc)||91);
    put(j,"PersonalInfo.Address.MobileNoSec",R(W.mobile2));
  }
  put(j,"PersonalInfo.Address.EmailAddress",sv(W.email)||"na@na.in");
  put(j,"PersonalInfo.Address.EmailAddressSec",sv(W.email2));

  /* SecondaryAdd + AlternateAddress */
  put(j,"PersonalInfo.SecondaryAdd",sv(W.addr2same)||"N");
  if(st0(W.addr2same)==="Y"){
    put(j,"PersonalInfo.AlternateAddress.ResidenceNo",(sv(W.addr1b)||"NA").slice(0,50));
    put(j,"PersonalInfo.AlternateAddress.ResidenceName",sv(W.premisesb));
    put(j,"PersonalInfo.AlternateAddress.RoadOrStreet",sv(W.roadb));
    put(j,"PersonalInfo.AlternateAddress.LocalityOrArea",(sv(W.localityb)||"NA").slice(0,50));
    put(j,"PersonalInfo.AlternateAddress.CityOrTownOrDistrict",(sv(W.cityb)||"NA").slice(0,50));
    put(j,"PersonalInfo.AlternateAddress.StateCode",sv(indiab?W.stateb:"99")||"19");
    put(j,"PersonalInfo.AlternateAddress.CountryCode",sv(W.countryb)||"91");
    if(indiab){ if(sv(W.pinb)) put(j,"PersonalInfo.AlternateAddress.PinCode",R(W.pinb)); }
    else if(sv(W.zipb)) put(j,"PersonalInfo.AlternateAddress.ZipCode",sv(W.zipb));
  }

  /* DOB + EmployerCategory */
  put(j,"PersonalInfo.DOB",ISO(W.dob)||"1990-01-01");
  put(j,"PersonalInfo.EmployerCategory",WHO1_EMPCAT.some(e=>e[0]===st0(W.empcat))?st0(W.empcat):"OTH");
}

/* =====================================================================
   IMPORT — impWho(I): read CreationInfo/Form_ITR1/PersonalInfo back into
   S.who so the round-trip (JSON -> import -> export) is stable.
   ===================================================================== */
function impWho(I){
  const read=[], W=S.who=S.who||{};
  const _iso2dmy=s=>{s=st0(s);const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    return m?m[3]+"/"+m[2]+"/"+m[1]:"";};
  const PI=(I&&I.PersonalInfo)||{}, NM=PI.AssesseeName||{}, AD=PI.Address||{}, AA=PI.AlternateAddress||{};

  if(NM.FirstName!=null){W.first=NM.FirstName;}
  if(NM.MiddleName!=null){W.mid=NM.MiddleName;}
  if(NM.SurNameOrOrgName!=null){W.last=NM.SurNameOrOrgName;read.push("name");}
  if(PI.PAN!=null){W.pan=String(PI.PAN).toUpperCase();read.push("PAN");}
  if(PI.AadhaarCardNo!=null)W.aadhaar=String(PI.AadhaarCardNo);
  if(PI.DOB){W.dob=_iso2dmy(PI.DOB)||W.dob;read.push("date of birth");}
  if(PI.EmployerCategory!=null)W.empcat=PI.EmployerCategory;

  if(Object.keys(AD).length){
    if(AD.ResidenceNo!=null)W.addr1=AD.ResidenceNo;
    if(AD.ResidenceName!=null)W.premises=AD.ResidenceName;
    if(AD.RoadOrStreet!=null)W.road=AD.RoadOrStreet;
    if(AD.LocalityOrArea!=null)W.locality=AD.LocalityOrArea;
    if(AD.CityOrTownOrDistrict!=null)W.city=AD.CityOrTownOrDistrict;
    if(AD.StateCode!=null)W.state=String(AD.StateCode);
    if(AD.CountryCode!=null)W.country=String(AD.CountryCode);
    if(AD.PinCode!=null)W.pin=String(AD.PinCode);
    if(AD.ZipCode!=null)W.zip=AD.ZipCode;
    if(AD.CountryCodeMobile!=null)W.mobileCc=String(AD.CountryCodeMobile);
    if(AD.MobileNo!=null)W.mobile=String(AD.MobileNo);
    if(AD.CountryCodeMobileNoSec!=null)W.mobile2Cc=String(AD.CountryCodeMobileNoSec);
    if(AD.MobileNoSec!=null)W.mobile2=String(AD.MobileNoSec);
    if(AD.EmailAddress!=null)W.email=AD.EmailAddress;
    if(AD.EmailAddressSec!=null)W.email2=AD.EmailAddressSec;
    read.push("address and contact");
  }
  if(PI.SecondaryAdd!=null)W.addr2same=PI.SecondaryAdd;
  if(Object.keys(AA).length){
    if(AA.ResidenceNo!=null)W.addr1b=AA.ResidenceNo;
    if(AA.ResidenceName!=null)W.premisesb=AA.ResidenceName;
    if(AA.RoadOrStreet!=null)W.roadb=AA.RoadOrStreet;
    if(AA.LocalityOrArea!=null)W.localityb=AA.LocalityOrArea;
    if(AA.CityOrTownOrDistrict!=null)W.cityb=AA.CityOrTownOrDistrict;
    if(AA.StateCode!=null)W.stateb=String(AA.StateCode);
    if(AA.CountryCode!=null)W.countryb=String(AA.CountryCode);
    if(AA.PinCode!=null)W.pinb=String(AA.PinCode);
    if(AA.ZipCode!=null)W.zipb=AA.ZipCode;
    read.push("secondary address");
  }
  return read;
}

/* =====================================================================
   CHECKS — chkWho(): this screen's own mandatory / format validations
   (not the CBDT rule engine, which is a later phase).
   ===================================================================== */
function chkWho(){
  const out=[], W=S.who||{}; engWho();
  const india=(st0(W.country)||"91")==="91";
  const pan=st0(W.pan).toUpperCase();

  if(!st0(W.last)) out.push({lvl:"err",t:"Name required",m:"The last name / surname is mandatory.",sec:"who"});
  if(!pan) out.push({lvl:"err",t:"PAN required",m:"Enter the PAN of the individual.",sec:"who"});
  else if(!PAN_RE.test(pan)) out.push({lvl:"err",t:"PAN not valid",m:"The PAN must be five letters, four digits and a letter.",sec:"who"});
  else if(pan.charAt(3)!=="P") out.push({lvl:"err",t:"PAN not an individual's",m:"ITR-1 is for an individual only: the fourth letter of the PAN must be P (it is '"+pan.charAt(3)+"' here — a "+({C:"company",H:"HUF",F:"firm",A:"AOP/BOI",T:"trust",B:"BOI",L:"local authority",J:"artificial juridical person",G:"government"}[pan.charAt(3)]||"non-individual")+" cannot file ITR-1).",sec:"who"});

  if(!st0(W.dob)) out.push({lvl:"err",t:"Date of birth required",m:"Enter the date of birth in "+DF+" — it settles the slab.",sec:"who"});
  else if(!(typeof D==="function"&&D(W.dob))) out.push({lvl:"err",t:"Date of birth",m:"The date of birth is not a valid "+DF+" date.",sec:"who"});
  else if(D(W.dob)>WHO1_AGEREF) out.push({lvl:"err",t:"Date of birth",m:"The date of birth must be on or before 31 March 2026.",sec:"who"});

  if(st0(W.resStatus)==="NOR") out.push({lvl:"err",t:"Not eligible for ITR-1",m:"A resident but not ordinarily resident (RNOR) individual cannot file ITR-1 — file ITR-2. (A non-resident is also not eligible.)",sec:"who"});

  if(st0(W.aadhaar)&&!AADH.test(st0(W.aadhaar))) out.push({lvl:"err",t:"Aadhaar",m:"The Aadhaar number must be twelve digits.",sec:"who"});
  if(!WHO1_EMPCAT.some(e=>e[0]===st0(W.empcat))) out.push({lvl:"err",t:"Employer category required",m:"Select the nature of employment.",sec:"who"});

  /* primary address */
  if(!st0(W.addr1)) out.push({lvl:"err",t:"Address required",m:"Flat / Door / Block No is mandatory.",sec:"who"});
  if(!st0(W.locality)) out.push({lvl:"err",t:"Address required",m:"Area / locality is mandatory.",sec:"who"});
  if(!st0(W.city)) out.push({lvl:"err",t:"Address required",m:"Town / City / District is mandatory.",sec:"who"});
  if(india&&!st0(W.state)) out.push({lvl:"err",t:"State required",m:"Select the state.",sec:"who"});
  if(india&&st0(W.pin)&&!/^\d{6}$/.test(st0(W.pin))) out.push({lvl:"err",t:"PIN code",m:"The PIN code must be six digits.",sec:"who"});
  else if(india&&!st0(W.pin)) out.push({lvl:"err",t:"PIN code required",m:"The six-digit PIN code is mandatory for an Indian address.",sec:"who"});

  /* communication */
  if(!st0(W.mobile)) out.push({lvl:"err",t:"Mobile required",m:"The primary mobile number is mandatory.",sec:"who"});
  else if((st0(W.mobileCc)||"91")==="91"&&!/^\d{10}$/.test(st0(W.mobile))) out.push({lvl:"warn",t:"Mobile number",m:"With country code 91 the mobile number should be ten digits.",sec:"who"});
  if(!st0(W.email)) out.push({lvl:"err",t:"Email required",m:"The primary email is mandatory — it receives the copy of the ITR-V.",sec:"who"});
  else if(!MAIL.test(st0(W.email))) out.push({lvl:"err",t:"Email not valid",m:"Enter a valid primary email address.",sec:"who"});
  if(st0(W.email2)&&!MAIL.test(st0(W.email2))) out.push({lvl:"err",t:"Secondary email",m:"The secondary email address is not valid.",sec:"who"});

  /* secondary address distinct */
  if(st0(W.addr2same)==="Y"&&(!st0(W.addr1b)||!st0(W.localityb)||!st0(W.cityb)))
    out.push({lvl:"err",t:"Secondary address required",m:"You chose to give a second address — its Flat/Door, locality and town are mandatory.",sec:"who"});

  if(!out.some(x=>x.lvl==="err")){
    const C=S.C.who||{};
    out.push({lvl:"ok",t:"Who is filing",m:(C.name||"Individual")+(pan?" · "+pan:"")+
      " · "+(C.superSenior?"super-senior":C.senior?"senior citizen":"below 60")+
      " (age "+(C.age||0)+").",sec:"who"});
  }
  return out;
}

/* ---- register (overrides the boot stub) --------------------------- */
reg({id:"who", t:"Assessee Information", ref:"PersonalInfo · CreationInfo · Form_ITR1",
     f:secWho,
     s:()=>{const W=S.who||{};return st0(W.pan)?st0(W.pan).toUpperCase()+
       (st0(W.last)?" · "+[st0(W.first),st0(W.last)].filter(Boolean).join(" "):""):
       "Name, PAN, DOB, Aadhaar, address";},
     eng:engWho, exp:expWho, imp:impWho, chk:chkWho, order:10, corder:10});
