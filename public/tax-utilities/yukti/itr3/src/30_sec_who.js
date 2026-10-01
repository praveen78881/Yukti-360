/* =====================================================================
   ITR-3 · Section "who" — Who is filing (Part A - General)
   Book: books/ITR-3/PART_A_General.md   (built from ITR-3 rows only)
   Schema blocks OWNED (export + import): PartA_GEN1, PartA_GEN2.
   Compute order: 5 (identity face; runs before every income head).

   SCREEN SPLIT (books/ITR-3/structure.md): Part A - General is drawn on
   two adjacent screens — this "who" screen renders the IDENTITY face
   (PartA_GEN1.PersonalInfo: status, name, dates, Aadhaar, the primary and
   secondary addresses and the communication rows), while the sibling
   "ret" screen (order 6) renders the FilingStatus return/regime/audit face
   and PartA_GEN2 into the SAME shared state (S.pi / S.fs / S.decl / S.aud /
   S.nob). Per this builder's dispatch, "who" is the assigned owner of the
   full PartA_GEN1 and PartA_GEN2 schema blocks, so expWho / impWho below
   serialise BOTH blocks from that shared state. They read exactly the keys
   and state paths the "ret" builder writes, so the two exporters are
   byte-identical and idempotent — the integrator keeps this one as the
   block owner (see the report note on the who/ret overlap).

   REGIME (books/ITR-3/REGIME.md): Part A - General carries the master
   switch itself (FilingStatus.OptOldRegimeCurrAY → isNew()); none of its
   own PersonalInfo items is opened or closed by 115BAC, so this screen
   renders and computes identically under isNew() true or false. The
   regime-gated Form-10IEA flow lives on the "ret" screen.

   GTI CONTRIBUTION: identity/eligibility only — Part A - General adds
   nothing to Gross Total Income, so S.C.who.income = 0 (signed integer),
   which the tax section rolls up as Σ S.C.<head>.income.
   ===================================================================== */

/* ---- dropdown value lists (verbatim from books/ITR-3/enums.json and the
   book's List 1 / List 2; never hand-typed) ------------------------- */
const WHO_STATUS=[["I", "Individual"], ["H", "HUF"]];   /* PersonalInfo.Status */
const WHO_STATE=[["01", "Andaman and Nicobar islands"], ["02", "Andhra Pradesh"], ["03", "Arunachal Pradesh"], ["04", "Assam"], ["05", "Bihar"], ["06", "Chandigarh"], ["07", "Dadra Nagar and Haveli"], ["08", "Daman and Diu"], ["09", "Delhi"], ["10", "Goa"], ["11", "Gujarat"], ["12", "Haryana"], ["13", "Himachal Pradesh"], ["14", "Jammu and Kashmir"], ["15", "Karnataka"], ["16", "Kerala"], ["17", "Lakshadweep"], ["18", "Madhya Pradesh"], ["19", "Maharashtra"], ["20", "Manipur"], ["21", "meghalaya"], ["22", "Mizoram"], ["23", "Nagaland"], ["24", "Odisha"], ["25", "Puducherry"], ["26", "Punjab"], ["27", "Rajasthan"], ["28", "Sikkim"], ["29", "Tamil Nadu"], ["30", "Tripura"], ["31", "Uttar Pradesh"], ["32", "West Bengal"], ["33", "Chhattisgarh"], ["34", "Uttarakhand"], ["35", "Jharkhand"], ["36", "Telangana"], ["37", "Ladakh"], ["99", "Foreign"]];     /* Address/AlternateAddress.StateCode (List 1) */
const WHO_COUNTRY=[["93", "AFGHANISTAN"], ["1001", "ALAND ISLANDS"], ["355", "ALBANIA"], ["213", "ALGERIA"], ["684", "AMERICAN SAMOA"], ["376", "ANDORRA"], ["244", "ANGOLA"], ["1264", "ANGUILLA"], ["1010", "ANTARCTICA"], ["1268", "ANTIGUA AND BARBUDA"], ["54", "ARGENTINA"], ["374", "ARMENIA"], ["297", "ARUBA"], ["61", "AUSTRALIA"], ["43", "AUSTRIA"], ["994", "AZERBAIJAN"], ["1242", "BAHAMAS"], ["973", "BAHRAIN"], ["880", "BANGLADESH"], ["1246", "BARBADOS"], ["375", "BELARUS"], ["32", "BELGIUM"], ["501", "BELIZE"], ["229", "BENIN"], ["1441", "BERMUDA"], ["975", "BHUTAN"], ["591", "BOLIVIA (PLURINATIONAL STATE OF)"], ["1002", "BONAIRE, SINT EUSTATIUS AND SABA"], ["387", "BOSNIA AND HERZEGOVINA"], ["267", "BOTSWANA"], ["1003", "BOUVET ISLAND"], ["55", "BRAZIL"], ["1014", "BRITISH INDIAN OCEAN TERRITORY"], ["673", "BRUNEI DARUSSALAM"], ["359", "BULGARIA"], ["226", "BURKINA FASO"], ["257", "BURUNDI"], ["238", "CABO VERDE"], ["855", "CAMBODIA"], ["237", "CAMEROON"], ["1", "CANADA"], ["1345", "CAYMAN ISLANDS"], ["236", "CENTRAL AFRICAN REPUBLIC"], ["235", "CHAD"], ["56", "CHILE"], ["86", "CHINA"], ["9", "CHRISTMAS ISLAND"], ["672", "COCOS (KEELING) ISLANDS"], ["57", "COLOMBIA"], ["270", "COMOROS"], ["242", "CONGO"], ["243", "CONGO (DEMOCRATIC REPUBLIC OF THE)"], ["682", "COOK ISLANDS"], ["506", "COSTA RICA"], ["225", "COTE DIVOIRE"], ["385", "CROATIA"], ["53", "CUBA"], ["1015", "CURACAO"], ["357", "CYPRUS"], ["420", "CZECHIA"], ["45", "DENMARK"], ["253", "DJIBOUTI"], ["1767", "DOMINICA"], ["1809", "DOMINICAN REPUBLIC"], ["593", "ECUADOR"], ["20", "EGYPT"], ["503", "EL SALVADOR"], ["240", "EQUATORIAL GUINEA"], ["291", "ERITREA"], ["372", "ESTONIA"], ["251", "ETHIOPIA"], ["500", "FALKLAND ISLANDS (MALVINAS)"], ["298", "FAROE ISLANDS"], ["679", "FIJI"], ["358", "FINLAND"], ["33", "FRANCE"], ["594", "FRENCH GUIANA"], ["689", "FRENCH POLYNESIA"], ["1004", "FRENCH SOUTHERN TERRITORIES"], ["241", "GABON"], ["220", "GAMBIA"], ["995", "GEORGIA"], ["49", "GERMANY"], ["233", "GHANA"], ["350", "GIBRALTAR"], ["30", "GREECE"], ["299", "GREENLAND"], ["1473", "GRENADA"], ["590", "GUADELOUPE"], ["1671", "GUAM"], ["502", "GUATEMALA"], ["1481", "GUERNSEY"], ["224", "GUINEA"], ["245", "GUINEA-BISSAU"], ["592", "GUYANA"], ["509", "HAITI"], ["1005", "HEARD ISLAND AND MCDONALD ISLANDS"], ["6", "HOLY SEE"], ["504", "HONDURAS"], ["852", "HONG KONG"], ["36", "HUNGARY"], ["354", "ICELAND"], ["91", "INDIA"], ["62", "INDONESIA"], ["98", "IRAN (ISLAMIC REPUBLIC OF)"], ["964", "IRAQ"], ["353", "IRELAND"], ["1624", "ISLE OF MAN"], ["972", "ISRAEL"], ["5", "ITALY"], ["1876", "JAMAICA"], ["81", "JAPAN"], ["1534", "JERSEY"], ["962", "JORDAN"], ["7", "KAZAKHSTAN"], ["254", "KENYA"], ["686", "KIRIBATI"], ["850", "KOREA (DEMOCRATIC PEOPLES REPUBLIC OF)"], ["82", "KOREA (REPUBLIC OF)"], ["965", "KUWAIT"], ["996", "KYRGYZSTAN"], ["856", "LAO PEOPLES DEMOCRATIC REPUBLIC"], ["371", "LATVIA"], ["961", "LEBANON"], ["266", "LESOTHO"], ["231", "LIBERIA"], ["218", "LIBYA"], ["423", "LIECHTENSTEIN"], ["370", "LITHUANIA"], ["352", "LUXEMBOURG"], ["853", "MACAO"], ["389", "MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)"], ["261", "MADAGASCAR"], ["265", "MALAWI"], ["60", "MALAYSIA"], ["960", "MALDIVES"], ["223", "MALI"], ["356", "MALTA"], ["692", "MARSHALL ISLANDS"], ["596", "MARTINIQUE"], ["222", "MAURITANIA"], ["230", "MAURITIUS"], ["269", "MAYOTTE"], ["52", "MEXICO"], ["691", "MICRONESIA (FEDERATED STATES OF)"], ["373", "MOLDOVA (REPUBLIC OF)"], ["377", "MONACO"], ["976", "MONGOLIA"], ["382", "MONTENEGRO"], ["1664", "MONTSERRAT"], ["212", "MOROCCO"], ["258", "MOZAMBIQUE"], ["95", "MYANMAR"], ["264", "NAMIBIA"], ["674", "NAURU"], ["977", "NEPAL"], ["31", "NETHERLANDS"], ["687", "NEW CALEDONIA"], ["64", "NEW ZEALAND"], ["505", "NICARAGUA"], ["227", "NIGER"], ["234", "NIGERIA"], ["683", "NIUE"], ["15", "NORFOLK ISLAND"], ["1670", "NORTHERN MARIANA ISLANDS"], ["47", "NORWAY"], ["968", "OMAN"], ["92", "PAKISTAN"], ["680", "PALAU"], ["970", "PALESTINE, STATE OF"], ["507", "PANAMA"], ["675", "PAPUA NEW GUINEA"], ["595", "PARAGUAY"], ["51", "PERU"], ["63", "PHILIPPINES"], ["1011", "PITCAIRN"], ["48", "POLAND"], ["14", "PORTUGAL"], ["1787", "PUERTO RICO"], ["974", "QATAR"], ["262", "REUNION"], ["40", "ROMANIA"], ["8", "RUSSIAN FEDERATION"], ["250", "RWANDA"], ["1006", "SAINT BARTHELEMY"], ["290", "SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA"], ["1869", "SAINT KITTS AND NEVIS"], ["1758", "SAINT LUCIA"], ["1007", "SAINT MARTIN (FRENCH PART)"], ["508", "SAINT PIERRE AND MIQUELON"], ["1784", "SAINT VINCENT AND THE GRENADINES"], ["685", "SAMOA"], ["378", "SAN MARINO"], ["239", "SAO TOME AND PRINCIPE"], ["966", "SAUDI ARABIA"], ["221", "SENEGAL"], ["381", "SERBIA"], ["248", "SEYCHELLES"], ["232", "SIERRA LEONE"], ["65", "SINGAPORE"], ["1721", "SINT MAARTEN (DUTCH PART)"], ["421", "SLOVAKIA"], ["386", "SLOVENIA"], ["677", "SOLOMON ISLANDS"], ["252", "SOMALIA"], ["28", "SOUTH AFRICA"], ["1008", "SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS"], ["211", "SOUTH SUDAN"], ["35", "SPAIN"], ["94", "SRI LANKA"], ["249", "SUDAN"], ["597", "SURINAME"], ["1012", "SVALBARD AND JAN MAYEN"], ["268", "SWAZILAND"], ["46", "SWEDEN"], ["41", "SWITZERLAND"], ["963", "SYRIAN ARAB REPUBLIC"], ["886", "TAIWAN"], ["992", "TAJIKISTAN"], ["255", "TANZANIA, UNITED REPUBLIC OF"], ["66", "THAILAND"], ["670", "TIMOR-LESTE(EAST TIMOR)"], ["228", "TOGO"], ["690", "TOKELAU"], ["676", "TONGA"], ["1868", "TRINIDAD AND TOBAGO"], ["216", "TUNISIA"], ["90", "TURKEY"], ["993", "TURKMENISTAN"], ["1649", "TURKS AND CAICOS ISLANDS"], ["688", "TUVALU"], ["256", "UGANDA"], ["380", "UKRAINE"], ["971", "UNITED ARAB EMIRATES"], ["44", "UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND"], ["2", "UNITED STATES OF AMERICA"], ["1009", "UNITED STATES MINOR OUTLYING ISLANDS"], ["598", "URUGUAY"], ["998", "UZBEKISTAN"], ["678", "VANUATU"], ["58", "VENEZUELA (BOLIVARIAN REPUBLIC OF)"], ["84", "VIET NAM"], ["1284", "VIRGIN ISLANDS (BRITISH)"], ["1340", "VIRGIN ISLANDS (U.S.)"], ["681", "WALLIS AND FUTUNA"], ["967", "YEMEN"], ["263", "ZIMBABWE"], ["260", "ZAMBIA"], ["1013", "WESTERN SAHARA"], ["9999", "OTHERS"]]; /* Address/AlternateAddress.CountryCode (List 2) */
const WHO_YN=[["Y","Yes"],["N","No"]];   /* the "same as primary?" flag (Y/N) */

/* ---- state (identity face; guarded so it never clobbers a sibling seed) */
S.pi = S.pi || {};
if(S.pi.status===undefined)   S.pi.status="I";     /* PersonalInfo.Status (I / H) */
if(S.pi.country===undefined)  S.pi.country="91";   /* Address.CountryCode (91 = India) */
if(S.pi.addr2same===undefined)S.pi.addr2same="Y";  /* PersonalInfo.SecondaryAdd (Y = same) */
if(S.pi.mobile2Cc===undefined)S.pi.mobile2Cc="91"; /* Address.CountryCodeMobileNoSec (guarded — emitted only with mobile2) */

/* =====================================================================
   ENGINE — engWho(): Part A - General contributes nothing to GTI.
   ===================================================================== */
function engWho(){
  S.pi = S.pi || {};
  const C = S.C.who = { income:0 };
  isNew();                       /* regime read — no PersonalInfo closure applies (see header) */
  C.ind = (S.pi.status!=="H");   /* individual vs HUF — steers name / Aadhaar rows */
  /* GTI contribution — identity/eligibility screen, nothing added here */
  C.income = 0;
}

/* =====================================================================
   RENDERER — secWho(): the identity face (PartA_GEN1.PersonalInfo).
   Every live (non-hidden) PersonalInfo row of the book → a field.
   ===================================================================== */
function secWho(){
  const ind=S.pi.status!=="H";
  const india=(S.pi.country||"91")==="91";
  let h="";

  /* ---- Personal information (rows 7-9, 110) ---- */
  h+=sub("Personal information");
  h+=row("Status",sel("pi.status",WHO_STATUS,{blank:false}),
    {req:1,ref:"PersonalInfo.Status",hint:"I — individual, H — Hindu undivided family"});
  if(ind){
    h+=row("First name",inp("pi.first",{max:25}),{req:1,ref:"E7"});
    h+=row("Middle name",inp("pi.mid",{max:25}),{ref:"O7"});
    h+=row("Last name",inp("pi.last",{max:25}),{req:1,ref:"W7 · SurNameOrOrgName"});
  } else {
    h+=row("Name of the Hindu undivided family",inp("pi.last",{max:75}),{req:1,ref:"W7 · SurNameOrOrgName"});
  }
  h+=row("PAN",inp("pi.pan",{max:10}),
    {req:1,ref:"PersonalInfo.PAN",hint:ind?"the fourth letter must be P":"the fourth letter must be H"});
  h+=row(ind?"Date of birth (DD/MM/YYYY)":"Date of formation (DD/MM/YYYY)",dte("pi.dob"),
    {req:1,ref:"W9 · DOB",hint:"on or before 31 March 2026"});
  h+=row("Date of commencement of business (DD/MM/YYYY)",dte("pi.bizStart"),
    {ref:"E9 · DateofBusCommencement",hint:"if a business or profession was newly set up"});
  if(ind){
    h+=row("Aadhaar number",inp("pi.aadhaar",{max:12}),
      {ref:"E110 · AadhaarCardNo",hint:"twelve digits — applicable to an individual only"});
  }

  /* ---- Primary address (rows 11-18) ---- */
  h+=sub("Primary address — for communication");
  h+=row("Flat / Door / Block number",inp("pi.addr1",{max:50}),{req:1,ref:"E13 · ResidenceNo"});
  h+=row("Name of premises / building / village",inp("pi.premises",{max:50}),{ref:"W13 · ResidenceName"});
  h+=row("Road / street / post office",inp("pi.road",{max:50}),{ref:"RoadOrStreet"});
  h+=row("Area or locality",inp("pi.locality",{max:50}),{req:1,ref:"LocalityOrArea"});
  h+=row("Town / city / district",inp("pi.city",{max:50}),{req:1,ref:"E16 · CityOrTownOrDistrict"});
  h+=row("Country or region",sel("pi.country",WHO_COUNTRY,{blank:false}),{req:1,ref:"CountryCode"});
  if(india){
    h+=row("State",sel("pi.state",WHO_STATE),{req:1,ref:"W16 · StateCode"});
    h+=row("PIN code",inp("pi.pin",{max:6}),{req:1,ref:"PinCode",hint:"six digits"});
  } else {
    h+=row("State",sel("pi.state",[["99","Foreign"]],{blank:false}),{req:1,ref:"W16 · StateCode"});
    h+=row("Zip code",inp("pi.zip",{max:10}),{req:1,ref:"E18 · ZipCode"});
  }

  /* ---- Secondary address (rows 19-25) ---- */
  h+=row("Is the secondary address the same as the primary address?",
    sel("pi.addr2same",WHO_YN,{blank:false}),{req:1,ref:"E19 · SecondaryAdd"});
  if(S.pi.addr2same==="N"){
    h+=sub("Secondary address");
    h+=row("Flat / Door / Block number",inp("pi.addr1b",{max:50}),{req:1,ref:"E21 · AlternateAddress.ResidenceNo"});
    h+=row("Name of premises / building / village",inp("pi.premisesb",{max:50}),{ref:"W21 · ResidenceName"});
    h+=row("Road / street / post office",inp("pi.roadb",{max:50}),{ref:"RoadOrStreet"});
    h+=row("Area or locality",inp("pi.localityb",{max:50}),{req:1,ref:"LocalityOrArea"});
    h+=row("Town / city / district",inp("pi.cityb",{max:50}),{req:1,ref:"E23 · CityOrTownOrDistrict"});
    h+=row("State",sel("pi.stateb",WHO_STATE),{req:1,ref:"W23 · StateCode"});
    h+=row("PIN code",inp("pi.pinb",{max:6}),{req:1,ref:"PinCode"});
    h+=note("The secondary address is mandatory when it is not the same as the primary, and it must not be identical to the primary address (rules.json, rows 19-25).");
  }

  /* ---- Details for communication (rows 26-27) ---- */
  h+=sub("Details for communication");
  h+=row("Primary email of the taxpayer",inp("pi.email",{max:125,ph:"name@example.in"}),
    {req:1,ref:"E27 · EmailAddress",hint:"needed for the copy of ITR-V"});
  h+=row("Secondary email",inp("pi.email2",{max:125}),{ref:"N27 · EmailAddressSec"});
  h+=row("Primary mobile of the taxpayer",inp("pi.mobile",{max:10}),
    {req:1,ref:"W27 · MobileNo",hint:"ten digits, country code 91"});
  h+=row("Secondary mobile of the taxpayer",
    inp("pi.mobile2Cc",{n:1,max:3,ph:"Code"})+' '+inp("pi.mobile2",{n:1,max:10,ph:"Mobile"}),
    {ref:"MobileNoSec",hint:"country code and number, if a second mobile is given"});
  h+=row("STD / landline area code",inp("pi.std",{max:5}),{ref:"Phone.STDcode"});
  h+=row("Residence / office phone number",inp("pi.phone",{max:10}),{ref:"Phone.PhoneNo"});

  return h;
}

/* =====================================================================
   EXPORT — expWho(j): write PartA_GEN1 and PartA_GEN2 onto j from the
   shared identity/filing/audit state. put() skips empty values; the SKEL
   skeleton keeps every required leaf present even at nil.
   ===================================================================== */
function expWho(j){
  const ind=S.pi.status!=="H";
  const fs=S.fs||{}, decl=S.decl||{}, aud=S.aud||{};
  /* repeating tables must be JSON ARRAYS (constitution rule 12 — round-trip),
     not objects keyed "0","1". oPut drops an empty leaf; putArr assigns the
     array (and builds its parents) only when it carries at least one row. */
  const oPut=(o,k,v)=>{if(v!==undefined&&v!==null&&v!=="")o[k]=v;};
  const putArr=(path,arr)=>{if(arr&&arr.length)put(j,path,arr);};

  /* ---------- PartA_GEN1 · PersonalInfo (rows 7-27, 110) ---------- */
  if(ind){
    put(j,"PartA_GEN1.PersonalInfo.AssesseeName.FirstName",sv(S.pi.first));
    put(j,"PartA_GEN1.PersonalInfo.AssesseeName.MiddleName",sv(S.pi.mid));
  }
  put(j,"PartA_GEN1.PersonalInfo.AssesseeName.SurNameOrOrgName",sv(S.pi.last));
  put(j,"PartA_GEN1.PersonalInfo.PAN",sv(S.pi.pan&&String(S.pi.pan).toUpperCase()));
  put(j,"PartA_GEN1.PersonalInfo.Address.ResidenceNo",sv(S.pi.addr1));
  put(j,"PartA_GEN1.PersonalInfo.Address.ResidenceName",sv(S.pi.premises));
  put(j,"PartA_GEN1.PersonalInfo.Address.RoadOrStreet",sv(S.pi.road));
  put(j,"PartA_GEN1.PersonalInfo.Address.LocalityOrArea",sv(S.pi.locality));
  put(j,"PartA_GEN1.PersonalInfo.Address.CityOrTownOrDistrict",sv(S.pi.city));
  put(j,"PartA_GEN1.PersonalInfo.Address.StateCode",sv((S.pi.country||"91")==="91"?S.pi.state:"99"));
  put(j,"PartA_GEN1.PersonalInfo.Address.CountryCode",sv(S.pi.country||"91"));
  if((S.pi.country||"91")==="91"){ if(S.pi.pin) put(j,"PartA_GEN1.PersonalInfo.Address.PinCode",R(S.pi.pin)); }
  else if(S.pi.zip) put(j,"PartA_GEN1.PersonalInfo.Address.ZipCode",sv(S.pi.zip));
  if(S.pi.std) put(j,"PartA_GEN1.PersonalInfo.Address.Phone.STDcode",R(S.pi.std));
  put(j,"PartA_GEN1.PersonalInfo.Address.Phone.PhoneNo",sv(S.pi.phone));
  if(S.pi.mobile){ put(j,"PartA_GEN1.PersonalInfo.Address.CountryCodeMobile",91);
                   put(j,"PartA_GEN1.PersonalInfo.Address.MobileNo",R(S.pi.mobile)); }
  if(S.pi.mobile2){ put(j,"PartA_GEN1.PersonalInfo.Address.CountryCodeMobileNoSec",R(S.pi.mobile2Cc||91));
                    put(j,"PartA_GEN1.PersonalInfo.Address.MobileNoSec",R(S.pi.mobile2)); }
  put(j,"PartA_GEN1.PersonalInfo.Address.EmailAddress",sv(S.pi.email));
  put(j,"PartA_GEN1.PersonalInfo.Address.EmailAddressSec",sv(S.pi.email2));
  put(j,"PartA_GEN1.PersonalInfo.SecondaryAdd",sv(S.pi.addr2same||"Y"));
  /* AlternateAddress — only when the secondary differs from the primary */
  if(S.pi.addr2same==="N"){
    put(j,"PartA_GEN1.PersonalInfo.AlternateAddress.ResidenceNo",sv(S.pi.addr1b));
    put(j,"PartA_GEN1.PersonalInfo.AlternateAddress.ResidenceName",sv(S.pi.premisesb));
    put(j,"PartA_GEN1.PersonalInfo.AlternateAddress.RoadOrStreet",sv(S.pi.roadb));
    put(j,"PartA_GEN1.PersonalInfo.AlternateAddress.LocalityOrArea",sv(S.pi.localityb));
    put(j,"PartA_GEN1.PersonalInfo.AlternateAddress.CityOrTownOrDistrict",sv(S.pi.cityb));
    put(j,"PartA_GEN1.PersonalInfo.AlternateAddress.StateCode",sv(S.pi.stateb));
    put(j,"PartA_GEN1.PersonalInfo.AlternateAddress.CountryCode",sv(S.pi.country||"91"));
    if(S.pi.pinb) put(j,"PartA_GEN1.PersonalInfo.AlternateAddress.PinCode",R(S.pi.pinb));
  }
  put(j,"PartA_GEN1.PersonalInfo.DOB",ISO(S.pi.dob));
  put(j,"PartA_GEN1.PersonalInfo.Status",sv(S.pi.status||"I"));
  if(S.pi.bizStart) put(j,"PartA_GEN1.PersonalInfo.DateofBusCommencement",ISO(S.pi.bizStart));
  if(ind&&S.pi.aadhaar) put(j,"PartA_GEN1.PersonalInfo.AadhaarCardNo",sv(S.pi.aadhaar));

  /* ---------- PartA_GEN1 · FilingStatus (rendered on the "ret" screen,
     serialised here as the block owner; keys identical to that builder) -- */
  put(j,"PartA_GEN1.FilingStatus.ReturnFileSec",R(fs.sec||11));
  put(j,"PartA_GEN1.FilingStatus.IncFrmBusOrProf",sv(fs.incBP||"Y"));
  put(j,"PartA_GEN1.FilingStatus.OptOldRegimeCurrAY",fs.optout==="Yes"?"Y":"N");
  if(fs.optout==="Yes"&&fs.incBP==="Y"){
    put(j,"PartA_GEN1.FilingStatus.F10IEACurrAYOldRegime","Y");
    put(j,"PartA_GEN1.FilingStatus.F10IEADateCurrAYOldTax",ISO(fs.f10ieaDate));
    if(fs.f10ieaAck) put(j,"PartA_GEN1.FilingStatus.F10IEAAckNoCurrAYOldTax",R(fs.f10ieaAck));
  }
  if(fs.f10ieaEarlier){
    put(j,"PartA_GEN1.FilingStatus.Form10IEAEarlierAYOldRegime",sv(fs.f10ieaEarlier));
    put(j,"PartA_GEN1.FilingStatus.Form10IEAAssYear",sv(fs.f10ieaEarlierAY));
    if(fs.f10ieaEarlierAck) put(j,"PartA_GEN1.FilingStatus.Form10IEAEarlierAYAckOldRegime",R(fs.f10ieaEarlierAck));
  }
  /* Form 10-IEA NEW-regime re-entry (rows 63-78, paths (I)(A)(ii)/(I)(B)) — the
     counterpart of the old-regime opt-out above. Emitted only when the filer set a
     re-entry flag, so a filer who never opted out (incl. every resident) writes nothing. */
  if(fs.f10ieaNewEarlier){
    put(j,"PartA_GEN1.FilingStatus.F10IEAEarlierAYNewRegime",sv(fs.f10ieaNewEarlier));
    put(j,"PartA_GEN1.FilingStatus.AssYrF10IEANewTaxReg",sv(fs.f10ieaNewEarlierAY));
    if(fs.f10ieaNewEarlierAck) put(j,"PartA_GEN1.FilingStatus.Form10IEAEarlierAYAckNewRegime",R(fs.f10ieaNewEarlierAck));
  }
  if(fs.f10ieaNewCurr){
    put(j,"PartA_GEN1.FilingStatus.F10IEACurrAYNewRegime",sv(fs.f10ieaNewCurr));
    put(j,"PartA_GEN1.FilingStatus.F10IEADateCurrAYNewTax",ISO(fs.f10ieaNewDate));
    if(fs.f10ieaNewAck) put(j,"PartA_GEN1.FilingStatus.F10IEAAckNoCurrAYNewTax",R(fs.f10ieaNewAck));
  }
  put(j,"PartA_GEN1.FilingStatus.SeventhProvisio139",sv(decl.flag||"N"));
  if(decl.flag==="Y"){
    put(j,"PartA_GEN1.FilingStatus.DepAmtAggAmtExcd1CrPrYrFlg",sv(decl.dep_f));
    if(decl.dep) put(j,"PartA_GEN1.FilingStatus.AmtSeventhProvisio139i",R(decl.dep));
    put(j,"PartA_GEN1.FilingStatus.IncrExpAggAmt2LkTrvFrgnCntryFlg",sv(decl.trv_f));
    if(decl.trv) put(j,"PartA_GEN1.FilingStatus.AmtSeventhProvisio139ii",R(decl.trv));
    put(j,"PartA_GEN1.FilingStatus.IncrExpAggAmt1LkElctrctyPrYrFlg",sv(decl.ele_f));
    if(decl.ele) put(j,"PartA_GEN1.FilingStatus.AmtSeventhProvisio139iii",R(decl.ele));
    put(j,"PartA_GEN1.FilingStatus.clauseiv7provisio139i",sv(decl.c4_f));
    if(decl.c4_f==="Y") putArr("PartA_GEN1.FilingStatus.clauseiv7provisio139iDtls",
      (decl.c4||[]).map(r=>{const o={};oPut(o,"clauseiv7provisio139iNature",sv(r.nature));
        oPut(o,"clauseiv7provisio139iAmount",R(r.amt));return o;}));
  }
  if([13,14,16,18,20].indexOf(+fs.sec)>=0){
    put(j,"PartA_GEN1.FilingStatus.NoticeNo",sv(fs.din));
    put(j,"PartA_GEN1.FilingStatus.NoticeDate",ISO(fs.noticedate));
  }
  if([17,18,19].indexOf(+fs.sec)>=0){
    put(j,"PartA_GEN1.FilingStatus.ReceiptNo",sv(fs.receipt));
    put(j,"PartA_GEN1.FilingStatus.OrigRetFiledDate",ISO(fs.origdate));
  }
  put(j,"PartA_GEN1.FilingStatus.ResidentialStatus",sv(fs.resStatus||"RES"));
  if(S.pi.status!=="H"&&fs.resStatus==="RES") put(j,"PartA_GEN1.FilingStatus.BenefitUs115HFlg",sv(fs.b115H||"N"));
  /* Residential-status conditions cascade (rows 36-44) — individuals only; every
     leaf is optional and emitted only when filled, so a resident writes nothing. */
  if(S.pi.status!=="H"){
    if(fs.resCond) put(j,"PartA_GEN1.FilingStatus.ConditionsResStatus",sv(fs.resCond));
    putArr("PartA_GEN1.FilingStatus.JurisdictionResPrevYr.JurisdictionResPrevYrDtls",
      (S.fs.jur||[]).map(r=>{const o={};
        oPut(o,"JurisdictionResidence",sv(r.country));
        oPut(o,"TIN",sv(r.tin)); return o;}));
    if(fs.stayPY!==undefined&&fs.stayPY!=="") put(j,"PartA_GEN1.FilingStatus.TotalPrStayIndiaPrevYr",R(fs.stayPY));
    if(fs.stay4Yr!==undefined&&fs.stay4Yr!=="") put(j,"PartA_GEN1.FilingStatus.TotalPrStayIndia4PrecYr",R(fs.stay4Yr));
  }
  put(j,"PartA_GEN1.FilingStatus.AsseseeRepFlg",sv(fs.rep||"N"));
  if(fs.rep==="Y"){
    put(j,"PartA_GEN1.FilingStatus.AssesseeRep.RepName",sv(fs.repName));
    put(j,"PartA_GEN1.FilingStatus.AssesseeRep.RepEmailID",sv(fs.repEmail));
    if(fs.repMobile){
      put(j,"PartA_GEN1.FilingStatus.AssesseeRep.CountryCodeRepMobileNo",91);
      put(j,"PartA_GEN1.FilingStatus.AssesseeRep.RepMobileNo",R(fs.repMobile));
    }
  }
  put(j,"PartA_GEN1.FilingStatus.CompDirectorPrvYrFlg",sv(fs.dir||"N"));
  if(fs.dir==="Y") putArr("PartA_GEN1.FilingStatus.CompDirectorPrvYr.CompDirectorPrvYrDtls",
    (S.pi.dirco||[]).map(r=>{const o={};
      oPut(o,"NameOfCompany",sv(r.name)); oPut(o,"CompanyType",sv(r.type||"D"));
      oPut(o,"PAN",sv(r.pan&&String(r.pan).toUpperCase()));
      oPut(o,"SharesTypes",sv(r.listed||"L")); oPut(o,"DIN",sv(r.din)); return o;}));
  put(j,"PartA_GEN1.FilingStatus.PartnerInFirmFlg",sv(fs.partner||"N"));
  if(fs.partner==="Y") putArr("PartA_GEN1.FilingStatus.PartnerInFirm.PartnerInFirmDtls",
    (S.pi.firms||[]).map(r=>{const o={};
      oPut(o,"NameOfFirm",sv(r.name)); oPut(o,"PAN",sv(r.pan&&String(r.pan).toUpperCase())); return o;}));
  put(j,"PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYrFlg",sv(fs.unl||"N"));
  if(fs.unl==="Y") putArr("PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls",
    (S.pi.unlco||[]).map(r=>{const o={};
      oPut(o,"NameOfCompany",sv(r.name)); oPut(o,"CompanyType",sv(r.type||"D"));
      oPut(o,"PAN",sv(r.pan&&String(r.pan).toUpperCase()));
      oPut(o,"OpngBalNumberOfShares",R(r.obNo)); oPut(o,"OpngBalCostOfAcquisition",R(r.obCost));
      if(r.acqNo) oPut(o,"ShrAcqDurYrNumberOfShares",R(r.acqNo));
      oPut(o,"DateOfSubscrPurchase",ISO(r.subDate));
      if(r.faceVal) oPut(o,"FaceValuePerShare",n0(r.faceVal));
      if(r.issuePrice) oPut(o,"IssuePricePerShare",R(r.issuePrice));
      if(r.purchPrice) oPut(o,"PurchasePricePerShare",n0(r.purchPrice));
      if(r.trnfNo) oPut(o,"ShrTrnfNumberOfShares",R(r.trnfNo));
      if(r.trnfCons) oPut(o,"ShrTrnfSaleConsideration",n0(r.trnfCons));
      oPut(o,"ClsngBalNumberOfShares",R(r.cbNo)); oPut(o,"ClsngBalCostOfAcquisition",R(r.cbCost));
      return o;}));
  if(fs.resStatus!=="RES"){
    put(j,"PartA_GEN1.FilingStatus.NriPEinIndia",sv(fs.nriPE));
    put(j,"PartA_GEN1.FilingStatus.NriSEPinIndia",sv(fs.nriSEP));
    if(fs.nriSEP==="Y"){
      if(fs.sepPay) put(j,"PartA_GEN1.FilingStatus.AggrPaymentTransac",R(fs.sepPay));
      if(fs.sepUsers) put(j,"PartA_GEN1.FilingStatus.NumberOfUsers",R(fs.sepUsers));
    }
  }
  put(j,"PartA_GEN1.FilingStatus.PortugeseCC5A",S.pi.s5a==="Yes"?"Y":"N");
  put(j,"PartA_GEN1.FilingStatus.ForeignExchangeFlag",sv(fs.foreignExch||"N"));
  put(j,"PartA_GEN1.FilingStatus.FiiFpiFlag",sv(fs.fpi||"N"));
  if(fs.fpi==="Y") put(j,"PartA_GEN1.FilingStatus.SebiRegnNo",sv(fs.sebi));
  put(j,"PartA_GEN1.FilingStatus.ItrFilingDueDate",sv(fs.duedate||"2026-10-31"));
  if(fs.lei){
    put(j,"PartA_GEN1.FilingStatus.LEIDtls.LEINumber",sv(String(fs.lei).toUpperCase()));
    put(j,"PartA_GEN1.FilingStatus.LEIDtls.ValidUptoDate",ISO(fs.leiValid));
  }

  /* ---------- PartA_GEN2 · AuditInfo ---------- */
  put(j,"PartA_GEN2.AuditInfo.LiableSec44AAflg",sv(aud.sec44AA||"N"));
  put(j,"PartA_GEN2.AuditInfo.IncDclrdUs",sv(aud.incDclrdUs||"N"));
  if(aud.incDclrdUs==="N"){
    put(j,"PartA_GEN2.AuditInfo.TotalSalesExcOneCr",sv(aud.salesBand));
    if(aud.salesBand==="Upto10CR"){
      put(j,"PartA_GEN2.AuditInfo.AgrOFAllAmtsRcvd",sv(aud.pctRcvd));
      put(j,"PartA_GEN2.AuditInfo.AgrOFAllPayMade",sv(aud.pctPaid));
    }
  }
  put(j,"PartA_GEN2.AuditInfo.LiableSec44ABflg",sv(aud.sec44AB||"N"));
  if(aud.sec44AB==="Y"){
    put(j,"PartA_GEN2.AuditInfo.Cndnfor44AB",sv(aud.cnd44AB));
    if(aud.cnd44AB==="bii"){const b=aud.bii||{};
      ["44AD","44ADA","44AE","44BB"].forEach(k=>{if(b[k])put(j,"PartA_GEN2.AuditInfo.BiiDetails."+k,sv(b[k]));});}
    put(j,"PartA_GEN2.AuditInfo.AuditAccountantFlg",sv(aud.acctFlg));
    if(aud.acctFlg==="Y"){
      put(j,"PartA_GEN2.AuditInfo.AuditReportFurnishDate",ISO(aud.repDate));
      if(aud.repAck) put(j,"PartA_GEN2.AuditInfo.AckNum44AB",R(aud.repAck));
      put(j,"PartA_GEN2.AuditInfo.AudFrmName",sv(aud.frmName));
      put(j,"PartA_GEN2.AuditInfo.AudFrmPAN",sv(aud.frmPAN&&String(aud.frmPAN).toUpperCase()));
      put(j,"PartA_GEN2.AuditInfo.AudFrmAadhaar",sv(aud.frmAadhaar));
    }
  }
  put(j,"PartA_GEN2.AuditInfo.LiableSec92Eflg",sv(aud.sec92E||"N"));
  put(j,"PartA_GEN2.AuditInfo.AccountAuditFlag",aud.sec92E==="Y"?sv(aud.acct92E||"N"):"N");
  if(aud.sec92E==="Y"&&aud.acct92E==="Y"){
    put(j,"PartA_GEN2.AuditInfo.AuditDetails92E.DateOfAudit",ISO(aud.date92E));
    if(aud.ack92E) put(j,"PartA_GEN2.AuditInfo.AuditDetails92E.AckNum92E",R(aud.ack92E));
  }
  putArr("PartA_GEN2.AuditInfo.AuditDetails",
    (aud.oth||[]).map(r=>{const o={};
      oPut(o,"AuditedSection",sv(r.sec)); oPut(o,"AuditFlag",sv(r.flag));
      oPut(o,"OthAuditDtls",sv(r.othDtls));
      oPut(o,"DateOfAudit",ISO(r.date)); if(r.ack) oPut(o,"AckNumOth",R(r.ack)); return o;}));
  putArr("PartA_GEN2.AuditInfo.AuditReportDetails",
    (aud.act||[]).map(r=>{const o={};
      oPut(o,"AuditReportAct",sv(r.act)); oPut(o,"AuditReportActOthers",sv(r.actOther));
      oPut(o,"AuditedSection",sv(r.sec));
      oPut(o,"OtherITActFlag",sv(r.othFlag)); oPut(o,"OthAuditDtlsOthThanITAct",sv(r.othDtls));
      oPut(o,"DateOfAudit",ISO(r.date)); return o;}));
  /* ---------- PartA_GEN2 · NatOfBus ---------- */
  putArr("PartA_GEN2.NatOfBus.NatureOfBusiness",
    (S.nob||[]).map(r=>{const o={};
      oPut(o,"Code",sv(r.code)); oPut(o,"TradeName1",sv(r.trade)); oPut(o,"Description",sv(r.desc)); return o;}));
}

/* =====================================================================
   IMPORT — impWho(I3): read PartA_GEN1 + PartA_GEN2 back into the shared
   identity/filing/audit state. Returns short labels of what was read.
   ===================================================================== */
function impWho(I3){
  const read=[];
  const g1=(I3&&I3.PartA_GEN1)||{}, PI=g1.PersonalInfo||{}, AD=PI.Address||{}, FS=g1.FilingStatus||{};
  const g2=(I3&&I3.PartA_GEN2)||{}, AU=g2.AuditInfo||{}, NB=g2.NatOfBus||{};
  S.pi=S.pi||{}; S.fs=S.fs||{}; S.decl=S.decl||{}; S.aud=S.aud||{};

  if(PI.AssesseeName){
    if(PI.AssesseeName.FirstName!=null)S.pi.first=PI.AssesseeName.FirstName;
    if(PI.AssesseeName.MiddleName!=null)S.pi.mid=PI.AssesseeName.MiddleName;
    if(PI.AssesseeName.SurNameOrOrgName!=null)S.pi.last=PI.AssesseeName.SurNameOrOrgName;
    read.push("name");
  }
  if(PI.PAN){S.pi.pan=PI.PAN;read.push("PAN");}
  if(Object.keys(AD).length){
    if(AD.ResidenceNo!=null)S.pi.addr1=AD.ResidenceNo;
    if(AD.ResidenceName!=null)S.pi.premises=AD.ResidenceName;
    if(AD.RoadOrStreet!=null)S.pi.road=AD.RoadOrStreet;
    if(AD.LocalityOrArea!=null)S.pi.locality=AD.LocalityOrArea;
    if(AD.CityOrTownOrDistrict!=null)S.pi.city=AD.CityOrTownOrDistrict;
    if(AD.StateCode!=null)S.pi.state=AD.StateCode;
    if(AD.CountryCode!=null)S.pi.country=AD.CountryCode;
    if(AD.PinCode!=null)S.pi.pin=String(AD.PinCode);
    if(AD.ZipCode!=null)S.pi.zip=AD.ZipCode;
    if(AD.Phone){if(AD.Phone.STDcode!=null)S.pi.std=String(AD.Phone.STDcode);
                 if(AD.Phone.PhoneNo!=null)S.pi.phone=String(AD.Phone.PhoneNo);}
    if(AD.MobileNo!=null)S.pi.mobile=String(AD.MobileNo);
    if(AD.CountryCodeMobileNoSec!=null)S.pi.mobile2Cc=String(AD.CountryCodeMobileNoSec);
    if(AD.MobileNoSec!=null)S.pi.mobile2=String(AD.MobileNoSec);
    if(AD.EmailAddress!=null)S.pi.email=AD.EmailAddress;
    if(AD.EmailAddressSec!=null)S.pi.email2=AD.EmailAddressSec;
    read.push("address");
  }
  if(PI.SecondaryAdd!=null)S.pi.addr2same=PI.SecondaryAdd;
  if(PI.AlternateAddress){const AA=PI.AlternateAddress;
    if(AA.ResidenceNo!=null)S.pi.addr1b=AA.ResidenceNo;
    if(AA.ResidenceName!=null)S.pi.premisesb=AA.ResidenceName;
    if(AA.RoadOrStreet!=null)S.pi.roadb=AA.RoadOrStreet;
    if(AA.LocalityOrArea!=null)S.pi.localityb=AA.LocalityOrArea;
    if(AA.CityOrTownOrDistrict!=null)S.pi.cityb=AA.CityOrTownOrDistrict;
    if(AA.StateCode!=null)S.pi.stateb=AA.StateCode;
    if(AA.PinCode!=null)S.pi.pinb=String(AA.PinCode);
    read.push("secondary address");
  }
  if(PI.DOB)S.pi.dob=dmy(PI.DOB)||S.pi.dob;
  if(PI.Status)S.pi.status=PI.Status;
  if(PI.DateofBusCommencement)S.pi.bizStart=dmy(PI.DateofBusCommencement);
  if(PI.AadhaarCardNo)S.pi.aadhaar=PI.AadhaarCardNo;

  if(FS.ReturnFileSec!=null){S.fs.sec=FS.ReturnFileSec;read.push("filing section");}
  if(FS.IncFrmBusOrProf!=null)S.fs.incBP=FS.IncFrmBusOrProf;
  if(FS.OptOldRegimeCurrAY!=null){S.fs.optout=(FS.OptOldRegimeCurrAY==="Y")?"Yes":"No";read.push("regime");}
  if(FS.F10IEADateCurrAYOldTax)S.fs.f10ieaDate=dmy(FS.F10IEADateCurrAYOldTax);
  if(FS.F10IEAAckNoCurrAYOldTax!=null)S.fs.f10ieaAck=String(FS.F10IEAAckNoCurrAYOldTax);
  if(FS.Form10IEAEarlierAYOldRegime!=null)S.fs.f10ieaEarlier=FS.Form10IEAEarlierAYOldRegime;
  if(FS.Form10IEAAssYear!=null)S.fs.f10ieaEarlierAY=FS.Form10IEAAssYear;
  if(FS.Form10IEAEarlierAYAckOldRegime!=null)S.fs.f10ieaEarlierAck=String(FS.Form10IEAEarlierAYAckOldRegime);
  if(FS.F10IEAEarlierAYNewRegime!=null)S.fs.f10ieaNewEarlier=FS.F10IEAEarlierAYNewRegime;
  if(FS.AssYrF10IEANewTaxReg!=null)S.fs.f10ieaNewEarlierAY=FS.AssYrF10IEANewTaxReg;
  if(FS.Form10IEAEarlierAYAckNewRegime!=null)S.fs.f10ieaNewEarlierAck=String(FS.Form10IEAEarlierAYAckNewRegime);
  if(FS.F10IEACurrAYNewRegime!=null)S.fs.f10ieaNewCurr=FS.F10IEACurrAYNewRegime;
  if(FS.F10IEADateCurrAYNewTax)S.fs.f10ieaNewDate=dmy(FS.F10IEADateCurrAYNewTax);
  if(FS.F10IEAAckNoCurrAYNewTax!=null)S.fs.f10ieaNewAck=String(FS.F10IEAAckNoCurrAYNewTax);
  if(FS.SeventhProvisio139!=null){S.decl.flag=FS.SeventhProvisio139;
    S.decl.dep_f=FS.DepAmtAggAmtExcd1CrPrYrFlg;S.decl.dep=FS.AmtSeventhProvisio139i;
    S.decl.trv_f=FS.IncrExpAggAmt2LkTrvFrgnCntryFlg;S.decl.trv=FS.AmtSeventhProvisio139ii;
    S.decl.ele_f=FS.IncrExpAggAmt1LkElctrctyPrYrFlg;S.decl.ele=FS.AmtSeventhProvisio139iii;
    S.decl.c4_f=FS.clauseiv7provisio139i;
    S.decl.c4=(FS.clauseiv7provisio139iDtls||[]).map(r=>({nature:r.clauseiv7provisio139iNature,amt:r.clauseiv7provisio139iAmount}));
  }
  if(FS.NoticeNo!=null)S.fs.din=FS.NoticeNo;
  if(FS.NoticeDate)S.fs.noticedate=dmy(FS.NoticeDate);
  if(FS.ReceiptNo!=null)S.fs.receipt=FS.ReceiptNo;
  if(FS.OrigRetFiledDate)S.fs.origdate=dmy(FS.OrigRetFiledDate);
  if(FS.ResidentialStatus!=null){S.fs.resStatus=FS.ResidentialStatus;read.push("residential status");}
  if(FS.BenefitUs115HFlg!=null)S.fs.b115H=FS.BenefitUs115HFlg;
  if(FS.ConditionsResStatus!=null)S.fs.resCond=String(FS.ConditionsResStatus);
  if(FS.JurisdictionResPrevYr&&FS.JurisdictionResPrevYr.JurisdictionResPrevYrDtls){
    S.fs.jur=FS.JurisdictionResPrevYr.JurisdictionResPrevYrDtls.map(r=>({country:r.JurisdictionResidence,tin:r.TIN}));
    read.push("residential conditions");
  }
  if(FS.TotalPrStayIndiaPrevYr!=null)S.fs.stayPY=String(FS.TotalPrStayIndiaPrevYr);
  if(FS.TotalPrStayIndia4PrecYr!=null)S.fs.stay4Yr=String(FS.TotalPrStayIndia4PrecYr);
  if(FS.PortugeseCC5A!=null)S.pi.s5a=FS.PortugeseCC5A==="Y"?"Yes":"No";  /* restore 5A on-switch for round-trip */
  if(FS.AsseseeRepFlg!=null)S.fs.rep=FS.AsseseeRepFlg;
  if(FS.AssesseeRep){S.fs.repName=FS.AssesseeRep.RepName;S.fs.repEmail=FS.AssesseeRep.RepEmailID;
    if(FS.AssesseeRep.RepMobileNo!=null)S.fs.repMobile=String(FS.AssesseeRep.RepMobileNo);}
  if(FS.CompDirectorPrvYrFlg!=null)S.fs.dir=FS.CompDirectorPrvYrFlg;
  if(FS.CompDirectorPrvYr&&FS.CompDirectorPrvYr.CompDirectorPrvYrDtls){
    S.pi.dirco=FS.CompDirectorPrvYr.CompDirectorPrvYrDtls.map(r=>({name:r.NameOfCompany,type:r.CompanyType,pan:r.PAN,listed:r.SharesTypes,din:r.DIN}));
    read.push("directorships");
  }
  if(FS.PartnerInFirmFlg!=null)S.fs.partner=FS.PartnerInFirmFlg;
  if(FS.PartnerInFirm&&FS.PartnerInFirm.PartnerInFirmDtls){
    S.pi.firms=FS.PartnerInFirm.PartnerInFirmDtls.map(r=>({name:r.NameOfFirm,pan:r.PAN}));
    read.push("partnerships");
  }
  if(FS.HeldUnlistedEqShrPrYrFlg!=null)S.fs.unl=FS.HeldUnlistedEqShrPrYrFlg;
  if(FS.HeldUnlistedEqShrPrYr&&FS.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls){
    S.pi.unlco=FS.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls.map(r=>({
      name:r.NameOfCompany,type:r.CompanyType,pan:r.PAN,obNo:r.OpngBalNumberOfShares,
      obCost:r.OpngBalCostOfAcquisition,acqNo:r.ShrAcqDurYrNumberOfShares,
      subDate:dmy(r.DateOfSubscrPurchase),faceVal:r.FaceValuePerShare,
      issuePrice:r.IssuePricePerShare,purchPrice:r.PurchasePricePerShare,
      trnfNo:r.ShrTrnfNumberOfShares,trnfCons:r.ShrTrnfSaleConsideration,
      cbNo:r.ClsngBalNumberOfShares,cbCost:r.ClsngBalCostOfAcquisition}));
    read.push("unlisted shares");
  }
  if(FS.NriPEinIndia!=null)S.fs.nriPE=FS.NriPEinIndia;
  if(FS.NriSEPinIndia!=null)S.fs.nriSEP=FS.NriSEPinIndia;
  if(FS.AggrPaymentTransac!=null)S.fs.sepPay=FS.AggrPaymentTransac;
  if(FS.NumberOfUsers!=null)S.fs.sepUsers=FS.NumberOfUsers;
  if(FS.ForeignExchangeFlag!=null)S.fs.foreignExch=FS.ForeignExchangeFlag;
  if(FS.FiiFpiFlag!=null)S.fs.fpi=FS.FiiFpiFlag;
  if(FS.SebiRegnNo!=null)S.fs.sebi=FS.SebiRegnNo;
  if(FS.ItrFilingDueDate!=null)S.fs.duedate=FS.ItrFilingDueDate;
  if(FS.LEIDtls){S.fs.lei=FS.LEIDtls.LEINumber;if(FS.LEIDtls.ValidUptoDate)S.fs.leiValid=dmy(FS.LEIDtls.ValidUptoDate);}

  if(Object.keys(AU).length){
    if(AU.LiableSec44AAflg!=null)S.aud.sec44AA=AU.LiableSec44AAflg;
    if(AU.IncDclrdUs!=null)S.aud.incDclrdUs=AU.IncDclrdUs;
    if(AU.TotalSalesExcOneCr!=null)S.aud.salesBand=AU.TotalSalesExcOneCr;
    if(AU.AgrOFAllAmtsRcvd!=null)S.aud.pctRcvd=AU.AgrOFAllAmtsRcvd;
    if(AU.AgrOFAllPayMade!=null)S.aud.pctPaid=AU.AgrOFAllPayMade;
    if(AU.LiableSec44ABflg!=null)S.aud.sec44AB=AU.LiableSec44ABflg;
    if(AU.Cndnfor44AB!=null)S.aud.cnd44AB=AU.Cndnfor44AB;
    if(AU.BiiDetails){const D=AU.BiiDetails;S.aud.bii={"44AD":D["44AD"]||"","44ADA":D["44ADA"]||"","44AE":D["44AE"]||"","44BB":D["44BB"]||""};}
    if(AU.AuditAccountantFlg!=null)S.aud.acctFlg=AU.AuditAccountantFlg;
    if(AU.AuditReportFurnishDate)S.aud.repDate=dmy(AU.AuditReportFurnishDate);
    if(AU.AckNum44AB!=null)S.aud.repAck=String(AU.AckNum44AB);
    if(AU.AudFrmName!=null)S.aud.frmName=AU.AudFrmName;
    if(AU.AudFrmPAN!=null)S.aud.frmPAN=AU.AudFrmPAN;
    if(AU.AudFrmAadhaar!=null)S.aud.frmAadhaar=AU.AudFrmAadhaar;
    if(AU.LiableSec92Eflg!=null)S.aud.sec92E=AU.LiableSec92Eflg;
    if(AU.AccountAuditFlag!=null)S.aud.acct92E=AU.AccountAuditFlag;
    if(AU.AuditDetails92E){if(AU.AuditDetails92E.DateOfAudit)S.aud.date92E=dmy(AU.AuditDetails92E.DateOfAudit);
      if(AU.AuditDetails92E.AckNum92E!=null)S.aud.ack92E=String(AU.AuditDetails92E.AckNum92E);}
    if(Array.isArray(AU.AuditDetails))S.aud.oth=AU.AuditDetails.map(r=>({sec:r.AuditedSection,flag:r.AuditFlag,othDtls:r.OthAuditDtls,date:dmy(r.DateOfAudit),ack:r.AckNumOth}));
    if(Array.isArray(AU.AuditReportDetails))S.aud.act=AU.AuditReportDetails.map(r=>({act:r.AuditReportAct,actOther:r.AuditReportActOthers,sec:r.AuditedSection,othFlag:r.OtherITActFlag,othDtls:r.OthAuditDtlsOthThanITAct,date:dmy(r.DateOfAudit)}));
    read.push("audit information");
  }
  if(NB.NatureOfBusiness&&Array.isArray(NB.NatureOfBusiness)){
    S.nob=NB.NatureOfBusiness.map(r=>({code:r.Code,trade:r.TradeName1,desc:r.Description}));
    read.push("nature of business");
  }
  return read;
}

/* =====================================================================
   CHECKS — chkWho(): the identity-face rules of Part A - General as live
   messages (regime-aware). Filing / regime / audit rules belong to the
   sibling "ret" screen; here only the PersonalInfo rules from the book.
   ===================================================================== */
function chkWho(){
  const out=[], ind=S.pi.status!=="H";
  const P=S.pi||{};
  /* PAN — present, valid, fourth letter matches the status (P/H) */
  const pan=st0(P.pan).toUpperCase();
  if(!pan) out.push({lvl:"err",t:"PAN required",m:"Enter the PAN of the "+(ind?"individual":"HUF")+".",sec:"who"});
  else if(!PAN_RE.test(pan)) out.push({lvl:"err",t:"PAN not valid",m:"The PAN must be five letters, four digits and a letter.",sec:"who"});
  else if(pan[3]!==(ind?"P":"H")) out.push({lvl:"warn",t:"PAN does not match status",m:"The fourth letter of the PAN should be "+(ind?"P for an individual":"H for a HUF")+".",sec:"who"});
  /* Name */
  if(!st0(P.last)) out.push({lvl:"err",t:"Name required",m:ind?"Enter the last name.":"Enter the name of the Hindu undivided family.",sec:"who"});
  if(ind&&!st0(P.first)) out.push({lvl:"err",t:"First name required",m:"Enter the first name.",sec:"who"});
  /* Date of birth / formation — mandatory, on or before 31 March 2026 */
  const dob=D(P.dob);
  if(!dob) out.push({lvl:"err",t:(ind?"Date of birth required":"Date of formation required"),m:"Enter the date in DD/MM/YYYY.",sec:"who"});
  else if(dob>YREND) out.push({lvl:"err",t:(ind?"Date of birth":"Date of formation"),m:"The date must be on or before 31 March 2026.",sec:"who"});
  /* Aadhaar — twelve digits (individual only) */
  if(ind&&st0(P.aadhaar)&&!AADH.test(st0(P.aadhaar)))
    out.push({lvl:"err",t:"Aadhaar not valid",m:"The Aadhaar number must be twelve digits.",sec:"who"});
  /* Primary address required leaves */
  if(!st0(P.addr1)) out.push({lvl:"err",t:"Address required",m:"Flat / Door / Block number is mandatory.",sec:"who"});
  if(!st0(P.locality)) out.push({lvl:"err",t:"Address required",m:"Area or locality is mandatory.",sec:"who"});
  if(!st0(P.city)) out.push({lvl:"err",t:"Address required",m:"Town / city / district is mandatory.",sec:"who"});
  if(!st0(P.state)) out.push({lvl:"err",t:"State required",m:"Select the state.",sec:"who"});
  if((P.country||"91")==="91"&&st0(P.pin)&&!/^\d{6}$/.test(st0(P.pin)))
    out.push({lvl:"err",t:"PIN code",m:"The PIN code must be six digits.",sec:"who"});
  /* Email / mobile */
  if(!st0(P.email)) out.push({lvl:"err",t:"Email required",m:"The primary email is mandatory — it receives the copy of ITR-V.",sec:"who"});
  else if(!MAIL.test(st0(P.email))) out.push({lvl:"err",t:"Email not valid",m:"Enter a valid primary email address.",sec:"who"});
  if(!st0(P.mobile)) out.push({lvl:"err",t:"Mobile required",m:"The primary mobile number is mandatory.",sec:"who"});
  else if(!/^\d{10}$/.test(st0(P.mobile))) out.push({lvl:"warn",t:"Mobile number",m:"The primary mobile number should be ten digits.",sec:"who"});
  /* Secondary address — mandatory and distinct when not the same as primary */
  if(P.addr2same==="N"){
    if(!st0(P.addr1b)||!st0(P.localityb)||!st0(P.cityb)||!st0(P.stateb))
      out.push({lvl:"err",t:"Secondary address required",m:"The secondary address is not the same as the primary — its Flat/Door, locality, town and state are mandatory.",sec:"who"});
    else if(st0(P.addr1b)===st0(P.addr1)&&st0(P.localityb)===st0(P.locality)&&st0(P.cityb)===st0(P.city))
      out.push({lvl:"warn",t:"Secondary address matches primary",m:"The secondary address must not be identical to the primary — set 'same as primary' to Yes instead.",sec:"who"});
  }
  if(!out.some(x=>x.lvl==="err"))
    out.push({lvl:"ok",t:"Who is filing",m:(ind?"Individual":"HUF")+(pan?" · "+pan:"")+(dob?" · born/formed "+DISP(dob):"")+".",sec:"who"});
  return out;
}

/* ---- register ---------------------------------------------------- */
reg({id:"who", t:"Who is filing", ref:"Part A - General", f:secWho,
     s:()=>{const P=S.pi||{}; return st0(P.pan)?st0(P.pan).toUpperCase()+(P.status==="H"?" · HUF":""):"Name, PAN, status, address";},
     eng:engWho, exp:expWho, imp:impWho, chk:chkWho, order:5});
