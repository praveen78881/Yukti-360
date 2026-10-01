/* =====================================================================
   ITR-6 · Section "who" — Who is filing (Part A - General)
   Book: books/ITR-6/PART_A_GENERAL.md  (built from the ITR-6 company sheet)
   Schema block OWNED (export + import): PartA_GEN1 only.
   Compute order: 5 (identity face; runs before every income head).

   COMPANY RETURN. Unlike ITR-2/3, "Part A - General" here is the company's
   page: name/old-name/CIN/PAN, dates of incorporation and commencement,
   status (public/private) and domestic flag; both addresses; communication;
   filing status (section, notice/DIN, revised particulars, due date);
   residential status + treaty/PE/SEP; the concessional regime
   115BA/115BAA/115BAB (domestic only); and the company-particulars block
   (registration, Ind AS, IFSC, liquidation, FII/FPI, producer company,
   representative, start-up/DPIIT, LEI, MSME). All of these are
   PartA_GEN1 (OrgFirmInfo + FilingStatus) leaves.

   AUDIT-BLOCK SPLIT (integration notes; book §8.1). The AUDIT INFORMATION
   table (rows 84-126) is physically on THIS sheet but its schema keys are
   the leading fields of PartA_GEN2For6, which section_map.json assigns to
   the GENERAL2 sheet (section "gen"). Per the notes, the `who` builder
   (PartA_GEN1) writes ONLY FilingStatus.Cndnfor44AB — the single string that
   the four bi-biv "condition for 44AB audit" flags fold into (book §8.3).
   Every other audit key (a1/a2/a2i-iii, b flag, c auditor, di-div tables)
   belongs to `gen` and is NOT exported or imported here. So the who screen
   renders the identity/filing/particulars face + the one Cndnfor44AB row,
   and the audit block itself lives on the gen (Audit information) screen.

   REGIME: for a company the "regime" is 115BA/115BAA/115BAB (domestic only),
   not 115BAC; the tax section reads DomesticCompFlg / StatusOrCompanyType and
   the concessional choice. This screen contributes nothing to GTI, so
   S.C.who.income = 0.
   ===================================================================== */

/* ---- dropdown value lists (verbatim from books/ITR-6/PART_A_GENERAL.md §5
   and books/ITR-6/enums.json; never hand-typed / never borrowed from ITR-3) */
const WHO_STATUS=[["6", "Public Company"], ["7", "Private Company"]];  /* OrgFirmInfo.StatusOrCompanyType */
const WHO_DOM=[["Y", "Domestic Company"], ["N", "Foreign Company"]];    /* OrgFirmInfo.DomesticCompFlg */
const WHO_YN=[["Y", "Yes"], ["N", "No"]];
const WHO_SECADDR=[["Y", "Yes — same as primary"], ["N", "No — a different address"]]; /* OrgFirmInfo.SecondaryAdd */
const WHO_DUE=[["2026-10-31", "31/10/2026 or extended"], ["2026-11-30", "30/11/2026 (audit u/s 92E case)"]]; /* FilingStatus.ItrFilingDueDate */
const WHO_RETSEC=[["11", "139(1) - On or before due date"], ["12", "139(4) - After due date"], ["13", "142(1)"], ["14", "148"], ["16", "153C"], ["17", "139(5) - Revised Return"], ["18", "139(9)"], ["19", "92CD - Modified return"], ["20", "119(2)(b) - after condonation of delay"], ["41", "170A - After order by the tribunal or court"]]; /* FilingStatus.ReturnFileSec.IncomeTaxSec */
const WHO_RES=[["RES", "Resident"], ["NRI", "Non-Resident"]];          /* FilingStatus.ResidentialStatus */
const WHO_SEP=[["Y", "Yes"], ["N", "No"], ["NA", "Not Applicable"]];    /* FilingStatus.NriSEPinIndia */
const WHO_115=[["115BA", "Section 115BA"], ["115BAA", "Section 115BAA"], ["115BAB", "Section 115BAB"], ["NA", "None of above"]]; /* FilingStatus.Section115BA */
const WHO_115CUR=[["115BA", "Section 115BA"], ["115BAA", "Section 115BAA"], ["115BAB", "Section 115BAB"]]; /* FilingStatus.SectionCurrAY */
const WHO_CND44=[["bi", "bi — Sales, turnover or gross receipts exceed the limits specified u/s 44AB"], ["bii", "bii — Assessee falling u/s 44BB but not opting for presumptive income"], ["biii", "biii — Assessee falling u/s 44BBB but not opting for presumptive income"], ["biv", "biv — Others"]]; /* FilingStatus.Cndnfor44AB */
const WHO_STATE=[["01", "Andaman and Nicobar islands"], ["02", "Andhra Pradesh"], ["03", "Arunachal Pradesh"], ["04", "Assam"], ["05", "Bihar"], ["06", "Chandigarh"], ["07", "The Dadra And Nagar Haveli And Daman And Diu"], ["09", "Delhi"], ["10", "Goa"], ["11", "Gujarat"], ["12", "Haryana"], ["13", "Himachal Pradesh"], ["14", "Jammu and Kashmir"], ["15", "Karnataka"], ["16", "Kerala"], ["17", "Lakshadweep"], ["18", "Madhya Pradesh"], ["19", "Maharashtra"], ["20", "Manipur"], ["21", "Meghalaya"], ["22", "Mizoram"], ["23", "Nagaland"], ["24", "Odisha"], ["25", "Puducherry"], ["26", "Punjab"], ["27", "Rajasthan"], ["28", "Sikkim"], ["29", "Tamil Nadu"], ["30", "Tripura"], ["31", "Uttar Pradesh"], ["32", "West Bengal"], ["33", "Chattisgarh"], ["34", "Uttarakhand"], ["35", "Jharkhand"], ["36", "Telangana"], ["37", "Ladakh"], ["99", "Foreign"]];   /* Address/AlternateAddress.StateCode (§5a) */
const WHO_COUNTRY=[["93", "AFGHANISTAN"], ["1001", "ALAND ISLANDS"], ["355", "ALBANIA"], ["213", "ALGERIA"], ["684", "AMERICAN SAMOA"], ["376", "ANDORRA"], ["244", "ANGOLA"], ["1264", "ANGUILLA"], ["1010", "ANTARCTICA"], ["1268", "ANTIGUA AND BARBUDA"], ["54", "ARGENTINA"], ["374", "ARMENIA"], ["297", "ARUBA"], ["61", "AUSTRALIA"], ["43", "AUSTRIA"], ["994", "AZERBAIJAN"], ["1242", "BAHAMAS"], ["973", "BAHRAIN"], ["880", "BANGLADESH"], ["1246", "BARBADOS"], ["375", "BELARUS"], ["32", "BELGIUM"], ["501", "BELIZE"], ["229", "BENIN"], ["1441", "BERMUDA"], ["975", "BHUTAN"], ["591", "BOLIVIA (PLURINATIONAL STATE OF)"], ["1002", "BONAIRE, SINT EUSTATIUS AND SABA"], ["387", "BOSNIA AND HERZEGOVINA"], ["267", "BOTSWANA"], ["1003", "BOUVET ISLAND"], ["55", "BRAZIL"], ["1014", "BRITISH INDIAN OCEAN TERRITORY"], ["673", "BRUNEI DARUSSALAM"], ["359", "BULGARIA"], ["226", "BURKINA FASO"], ["257", "BURUNDI"], ["238", "CABO VERDE"], ["855", "CAMBODIA"], ["237", "CAMEROON"], ["1", "CANADA"], ["1345", "CAYMAN ISLANDS"], ["236", "CENTRAL AFRICAN REPUBLIC"], ["235", "CHAD"], ["56", "CHILE"], ["86", "CHINA"], ["9", "CHRISTMAS ISLAND"], ["672", "COCOS (KEELING) ISLANDS"], ["57", "COLOMBIA"], ["270", "COMOROS"], ["242", "CONGO"], ["243", "CONGO (DEMOCRATIC REPUBLIC OF THE)"], ["682", "COOK ISLANDS"], ["506", "COSTA RICA"], ["225", "COTE DIVOIRE"], ["385", "CROATIA"], ["53", "CUBA"], ["1015", "CURACAO"], ["357", "CYPRUS"], ["420", "CZECHIA"], ["45", "DENMARK"], ["253", "DJIBOUTI"], ["1767", "DOMINICA"], ["1809", "DOMINICAN REPUBLIC"], ["593", "ECUADOR"], ["20", "EGYPT"], ["503", "EL SALVADOR"], ["240", "EQUATORIAL GUINEA"], ["291", "ERITREA"], ["372", "ESTONIA"], ["251", "ETHIOPIA"], ["500", "FALKLAND ISLANDS (MALVINAS)"], ["298", "FAROE ISLANDS"], ["679", "FIJI"], ["358", "FINLAND"], ["33", "FRANCE"], ["594", "FRENCH GUIANA"], ["689", "FRENCH POLYNESIA"], ["1004", "FRENCH SOUTHERN TERRITORIES"], ["241", "GABON"], ["220", "GAMBIA"], ["995", "GEORGIA"], ["49", "GERMANY"], ["233", "GHANA"], ["350", "GIBRALTAR"], ["30", "GREECE"], ["299", "GREENLAND"], ["1473", "GRENADA"], ["590", "GUADELOUPE"], ["1671", "GUAM"], ["502", "GUATEMALA"], ["1481", "GUERNSEY"], ["224", "GUINEA"], ["245", "GUINEA-BISSAU"], ["592", "GUYANA"], ["509", "HAITI"], ["1005", "HEARD ISLAND AND MCDONALD ISLANDS"], ["6", "HOLY SEE"], ["504", "HONDURAS"], ["852", "HONG KONG"], ["36", "HUNGARY"], ["354", "ICELAND"], ["91", "INDIA"], ["62", "INDONESIA"], ["98", "IRAN (ISLAMIC REPUBLIC OF)"], ["964", "IRAQ"], ["353", "IRELAND"], ["1624", "ISLE OF MAN"], ["972", "ISRAEL"], ["5", "ITALY"], ["1876", "JAMAICA"], ["81", "JAPAN"], ["1534", "JERSEY"], ["962", "JORDAN"], ["7", "KAZAKHSTAN"], ["254", "KENYA"], ["686", "KIRIBATI"], ["850", "KOREA (DEMOCRATIC PEOPLES REPUBLIC OF)"], ["82", "KOREA (REPUBLIC OF)"], ["965", "KUWAIT"], ["996", "KYRGYZSTAN"], ["856", "LAO PEOPLES DEMOCRATIC REPUBLIC"], ["371", "LATVIA"], ["961", "LEBANON"], ["266", "LESOTHO"], ["231", "LIBERIA"], ["218", "LIBYA"], ["423", "LIECHTENSTEIN"], ["370", "LITHUANIA"], ["352", "LUXEMBOURG"], ["853", "MACAO"], ["389", "MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)"], ["261", "MADAGASCAR"], ["265", "MALAWI"], ["60", "MALAYSIA"], ["960", "MALDIVES"], ["223", "MALI"], ["356", "MALTA"], ["692", "MARSHALL ISLANDS"], ["596", "MARTINIQUE"], ["222", "MAURITANIA"], ["230", "MAURITIUS"], ["269", "MAYOTTE"], ["52", "MEXICO"], ["691", "MICRONESIA (FEDERATED STATES OF)"], ["373", "MOLDOVA (REPUBLIC OF)"], ["377", "MONACO"], ["976", "MONGOLIA"], ["382", "MONTENEGRO"], ["1664", "MONTSERRAT"], ["212", "MOROCCO"], ["258", "MOZAMBIQUE"], ["95", "MYANMAR"], ["264", "NAMIBIA"], ["674", "NAURU"], ["977", "NEPAL"], ["31", "NETHERLANDS"], ["687", "NEW CALEDONIA"], ["64", "NEW ZEALAND"], ["505", "NICARAGUA"], ["227", "NIGER"], ["234", "NIGERIA"], ["683", "NIUE"], ["15", "NORFOLK ISLAND"], ["1670", "NORTHERN MARIANA ISLANDS"], ["47", "NORWAY"], ["968", "OMAN"], ["92", "PAKISTAN"], ["680", "PALAU"], ["970", "PALESTINE, STATE OF"], ["507", "PANAMA"], ["675", "PAPUA NEW GUINEA"], ["595", "PARAGUAY"], ["51", "PERU"], ["63", "PHILIPPINES"], ["1011", "PITCAIRN"], ["48", "POLAND"], ["14", "PORTUGAL"], ["1787", "PUERTO RICO"], ["974", "QATAR"], ["262", "REUNION"], ["40", "ROMANIA"], ["8", "RUSSIAN FEDERATION"], ["250", "RWANDA"], ["1006", "SAINT BARTHELEMY"], ["290", "SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA"], ["1869", "SAINT KITTS AND NEVIS"], ["1758", "SAINT LUCIA"], ["1007", "SAINT MARTIN (FRENCH PART)"], ["508", "SAINT PIERRE AND MIQUELON"], ["1784", "SAINT VINCENT AND THE GRENADINES"], ["685", "SAMOA"], ["378", "SAN MARINO"], ["239", "SAO TOME AND PRINCIPE"], ["966", "SAUDI ARABIA"], ["221", "SENEGAL"], ["381", "SERBIA"], ["248", "SEYCHELLES"], ["232", "SIERRA LEONE"], ["65", "SINGAPORE"], ["1721", "SINT MAARTEN (DUTCH PART)"], ["421", "SLOVAKIA"], ["386", "SLOVENIA"], ["677", "SOLOMON ISLANDS"], ["252", "SOMALIA"], ["28", "SOUTH AFRICA"], ["1008", "SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS"], ["211", "SOUTH SUDAN"], ["35", "SPAIN"], ["94", "SRI LANKA"], ["249", "SUDAN"], ["597", "SURINAME"], ["1012", "SVALBARD AND JAN MAYEN"], ["268", "SWAZILAND"], ["46", "SWEDEN"], ["41", "SWITZERLAND"], ["963", "SYRIAN ARAB REPUBLIC"], ["886", "TAIWAN"], ["992", "TAJIKISTAN"], ["255", "TANZANIA, UNITED REPUBLIC OF"], ["66", "THAILAND"], ["670", "TIMOR-LESTE(EAST TIMOR)"], ["228", "TOGO"], ["690", "TOKELAU"], ["676", "TONGA"], ["1868", "TRINIDAD AND TOBAGO"], ["216", "TUNISIA"], ["90", "TURKEY"], ["993", "TURKMENISTAN"], ["1649", "TURKS AND CAICOS ISLANDS"], ["688", "TUVALU"], ["256", "UGANDA"], ["380", "UKRAINE"], ["971", "UNITED ARAB EMIRATES"], ["44", "UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND"], ["2", "UNITED STATES OF AMERICA"], ["1009", "UNITED STATES MINOR OUTLYING ISLANDS"], ["598", "URUGUAY"], ["998", "UZBEKISTAN"], ["678", "VANUATU"], ["58", "VENEZUELA (BOLIVARIAN REPUBLIC OF)"], ["84", "VIET NAM"], ["1284", "VIRGIN ISLANDS (BRITISH)"], ["1340", "VIRGIN ISLANDS (U.S.)"], ["681", "WALLIS AND FUTUNA"], ["1013", "WESTERN SAHARA"], ["967", "YEMEN"], ["260", "ZAMBIA"], ["263", "ZIMBABWE"], ["9999", "OTHERS"]]; /* Address/AlternateAddress.CountryCode (§5b, default 91-INDIA) */

/* ---- section codes that open the notice / revised-return sub-rows (book §Block 4) */
const WHO_SEC_NOTICE=["13","14","16","18","20","41"]; /* 142(1)/148/153C/139(9)/119(2)(b)/170A -> DIN + notice date */
const WHO_SEC_REVISED=["17","18","19"];               /* 139(5) revised / 139(9) defective / 92CD modified -> receipt + orig date */
const WHO_SEC_APA=["19"];                             /* 92CD -> advance-pricing-agreement date (NoticeDateUnderSec) */

/* ---- state (identity/filing face; guarded so a sibling seed is never clobbered) */
S.pi = S.pi || {};
if(S.pi.status===undefined)    S.pi.status="6";      /* StatusOrCompanyType (6 public / 7 private) */
if(S.pi.domestic===undefined)  S.pi.domestic="Y";    /* DomesticCompFlg (Y domestic / N foreign) */
if(S.pi.country===undefined)   S.pi.country="91";     /* Address.CountryCode (91 = India) */
if(S.pi.countryb===undefined)  S.pi.countryb="91";   /* AlternateAddress.CountryCode */
if(S.pi.addr2same===undefined) S.pi.addr2same="Y";   /* SecondaryAdd (Y = same as primary) */
if(S.pi.mobileCc===undefined)  S.pi.mobileCc="91";   /* CountryCodeMobile */
if(S.pi.mobile2Cc===undefined) S.pi.mobile2Cc="91";  /* CountryCodeMobileNoSec (emitted only with mobile2) */
S.fs = S.fs || {};
if(S.fs.sec===undefined)       S.fs.sec="11";        /* ReturnFileSec.IncomeTaxSec */
if(S.fs.due===undefined)       S.fs.due="2026-10-31";/* ItrFilingDueDate */
if(S.fs.resStatus===undefined) S.fs.resStatus="RES"; /* ResidentialStatus */
if(S.fs.s115===undefined)      S.fs.s115="NA";       /* Section115BA (None of above) */
if(S.fs.repMobileCc===undefined)S.fs.repMobileCc="91";

/* =====================================================================
   ENGINE — engWho(): Part A - General contributes nothing to GTI; it
   publishes the company-identity scalars downstream sections key on
   (domestic/foreign for the tax rate, residential status for FSI/TR/FA,
   FII/FPI for Schedule 115AD, the due date, the concessional choice).
   ===================================================================== */
function engWho(){
  S.pi=S.pi||{}; S.fs=S.fs||{};
  const C=S.C.who={ income:0 };
  const dom=(S.pi.domestic||"Y")!=="N";
  const res=(S.fs.resStatus||"RES")==="RES";
  const conc=dom?(S.fs.s115==="115BA"||S.fs.s115==="115BAA"||S.fs.s115==="115BAB"?S.fs.s115
              :(S.fs.s115Curr==="Y"?(S.fs.s115CurrSec||""):"")):"";
  C.domestic=dom;                         /* DomesticCompFlg = Y */
  C.foreign=!dom;                         /* foreign company -> different tax rate */
  C.companyType=S.pi.status||"6";         /* 6 public / 7 private */
  C.resident=res;
  C.nonResident=!res;
  C.regime115=conc;                       /* "" | 115BA | 115BAA | 115BAB (domestic only) */
  C.is115BAA=conc==="115BAA";
  C.is115BAB=conc==="115BAB";
  C.fpi=(S.fs.fpi||"N")==="Y";            /* FII/FPI -> unlocks Schedule 115AD */
  C.due=S.fs.due||"2026-10-31";           /* 139(1) due date */
  C.audit92E=(S.fs.due==="2026-11-30");   /* 30/11 case -> TP / 92E audit path */
  C.income=0;                             /* identity screen adds nothing to GTI */
}

/* =====================================================================
   RENDERER — secWho(): the company identity / filing / particulars face.
   Every live (non-hidden) PartA_GEN1 row of the book -> a field.
   ===================================================================== */
function secWho(){
  const dom=(S.pi.domestic||"Y")!=="N";
  const nri=(S.fs.resStatus||"RES")==="NRI";
  const india=(S.pi.country||"91")==="91";
  const indiab=(S.pi.countryb||"91")==="91";
  const sec=st0(S.fs.sec);
  let h="";

  /* ---- Block 1 · Personal information (rows 8-12) ---- */
  h+=sub("Company information");
  h+=row("Name of the company",inp("pi.name",{max:75}),
    {req:1,ref:"OrgFirmInfo.AssesseeName.SurNameOrOrgName"});
  h+=row("Is there any change in the company's name?",sel("pi.nameChg",WHO_YN),
    {ref:"—",hint:"if Yes, furnish the old name"});
  if(S.pi.nameChg==="Y")
    h+=row("Old name of the company",inp("pi.oldName",{max:75}),
      {req:1,ref:"OrgFirmInfo.AssesseeName.OrgOldName"});
  h+=row("PAN",inp("pi.pan",{max:10}),
    {req:1,ref:"OrgFirmInfo.PAN",hint:"the fourth letter must be C for a company"});
  h+=row("Corporate Identity Number (CIN) issued by MCA",inp("pi.cin",{max:21}),
    {ref:"OrgFirmInfo.CINissuedByMCA"});
  h+=row("Date of incorporation (DD/MM/YYYY)",dte("pi.doi"),
    {req:1,ref:"OrgFirmInfo.DateOFFormOrIncorp",hint:"on or before 31 March 2026"});
  h+=row("Date of commencement of business (DD/MM/YYYY)",dte("pi.bizStart"),
    {ref:"A6 · OrgFirmInfo.DateofBusCommencement",hint:"must not be before the date of incorporation"});
  h+=row("Status",sel("pi.status",WHO_STATUS,{blank:false}),
    {req:1,ref:"OrgFirmInfo.StatusOrCompanyType"});
  h+=row("Domestic company?",sel("pi.domestic",WHO_DOM,{blank:false}),
    {req:1,ref:"OrgFirmInfo.DomesticCompFlg"});

  /* ---- Block 2 · Primary address (rows 14-24) ---- */
  h+=sub("Primary address — for communication");
  h+=row("Flat / Door / Block number",inp("pi.addr1",{max:50}),{req:1,ref:"Address.ResidenceNo"});
  h+=row("Name of premises / building / village",inp("pi.premises",{max:50}),{ref:"Address.ResidenceName"});
  h+=row("Road / street / post office",inp("pi.road",{max:50}),{ref:"Address.RoadOrStreet"});
  h+=row("Area or locality",inp("pi.locality",{max:50}),{req:1,ref:"Address.LocalityOrArea"});
  h+=row("Town / city / district",inp("pi.city",{max:50}),{req:1,ref:"Address.CityOrTownOrDistrict"});
  h+=row("Country or region",sel("pi.country",WHO_COUNTRY,{blank:false}),{req:1,ref:"Address.CountryCode"});
  if(india){
    h+=row("State",sel("pi.state",WHO_STATE),{req:1,ref:"Address.StateCode"});
    h+=row("PIN code",inp("pi.pin",{n:1,max:6}),{req:1,ref:"Address.PinCode",hint:"six digits"});
  } else {
    h+=row("State",sel("pi.state",[["99","Foreign"]],{blank:false}),{req:1,ref:"Address.StateCode"});
    h+=row("Zip code",inp("pi.zip",{max:10}),{req:1,ref:"Address.ZipCode"});
  }

  /* ---- Block 2 · Secondary address (rows 26-34) ---- */
  h+=row("Is the secondary address the same as the primary address?",
    sel("pi.addr2same",WHO_SECADDR,{blank:false}),{req:1,ref:"OrgFirmInfo.SecondaryAdd"});
  if(S.pi.addr2same==="N"){
    h+=sub("Secondary address");
    h+=row("Flat / Door / Block number",inp("pi.addr1b",{max:50}),{req:1,ref:"AlternateAddress.ResidenceNo"});
    h+=row("Name of premises / building / village",inp("pi.premisesb",{max:50}),{ref:"AlternateAddress.ResidenceName"});
    h+=row("Road / street / post office",inp("pi.roadb",{max:50}),{ref:"AlternateAddress.RoadOrStreet"});
    h+=row("Area or locality",inp("pi.localityb",{max:50}),{req:1,ref:"AlternateAddress.LocalityOrArea"});
    h+=row("Town / city / district",inp("pi.cityb",{max:50}),{req:1,ref:"AlternateAddress.CityOrTownOrDistrict"});
    h+=row("Country or region",sel("pi.countryb",WHO_COUNTRY,{blank:false}),{ref:"AlternateAddress.CountryCode"});
    if(indiab){
      h+=row("State",sel("pi.stateb",WHO_STATE),{req:1,ref:"AlternateAddress.StateCode"});
      h+=row("PIN code",inp("pi.pinb",{n:1,max:6}),{ref:"AlternateAddress.PinCode"});
    } else {
      h+=row("State",sel("pi.stateb",[["99","Foreign"]],{blank:false}),{req:1,ref:"AlternateAddress.StateCode"});
      h+=row("Zip code",inp("pi.zipb",{max:10}),{ref:"AlternateAddress.ZipCode"});
    }
    h+=note("The secondary address is mandatory when it is not the same as the primary, and it must not be identical to the primary address (book §Block 2, rules 40-41).");
  }

  /* ---- Block 3 · Communication (rows 35-38) ---- */
  h+=sub("Details for communication");
  h+=row("Primary email of the company",inp("pi.email",{max:125,ph:"name@example.in"}),
    {req:1,ref:"Address.EmailAddress",hint:"needed for the copy of ITR-V"});
  h+=row("Secondary email",inp("pi.email2",{max:125}),{ref:"Address.EmailAddressSecondary"});
  h+=row("Primary mobile of the company",
    inp("pi.mobileCc",{n:1,max:3,ph:"Code"})+' '+inp("pi.mobile",{n:1,max:10,ph:"Mobile"}),
    {req:1,ref:"Address.CountryCodeMobile / MobileNo",hint:"country code 91, then ten digits"});
  h+=row("Secondary mobile",
    inp("pi.mobile2Cc",{n:1,max:3,ph:"Code"})+' '+inp("pi.mobile2",{n:1,max:10,ph:"Mobile"}),
    {ref:"Address.CountryCodeMobileNoSec / MobileNoSec"});
  h+=row("STD / ISD area code",inp("pi.std",{n:1,max:5}),{req:1,ref:"Address.Phone.STDcode"});
  h+=row("Office phone number",inp("pi.phone",{n:1,max:10}),{req:1,ref:"Address.Phone.PhoneNo"});

  /* ---- Block 4 · Filing (rows 38-44) ---- */
  h+=sub("Filing status");
  h+=row("Due date for filing the return of income",sel("fs.due",WHO_DUE,{blank:false}),
    {req:1,ref:"FilingStatus.ItrFilingDueDate"});
  h+=row("Return filed under section / in response to notice under section",
    sel("fs.sec",WHO_RETSEC),{req:1,ref:"FilingStatus.ReturnFileSec.IncomeTaxSec"});
  if(WHO_SEC_REVISED.indexOf(sec)>=0){
    h+=row("Receipt no. of the original return",inp("fs.receipt",{n:1,max:23}),
      {req:1,ref:"FilingStatus.ReceiptNo",hint:"for a revised / defective / modified return"});
    h+=row("Date of filing of the original return (DD/MM/YYYY)",dte("fs.origdate"),
      {req:1,ref:"FilingStatus.OrigRetFiledDate"});
  }
  if(WHO_SEC_NOTICE.indexOf(sec)>=0){
    h+=row("Unique number / Document Identification Number (DIN)",inp("fs.din",{max:30}),
      {req:1,ref:"FilingStatus.UniqueNumNoticeUs",hint:"notice u/s 139(9)/142(1)/148/153C or order u/s 119(2)(b)/170A"});
  }
  if(WHO_SEC_NOTICE.indexOf(sec)>=0||WHO_SEC_APA.indexOf(sec)>=0){
    h+=row(sec==="19"?"Date of the advance pricing agreement (DD/MM/YYYY)":"Date of such notice or order (DD/MM/YYYY)",
      dte("fs.noticedate"),{req:1,ref:"FilingStatus.NoticeDateUnderSec"});
  }

  /* ---- Block 5 · Residential status and treaty / PE / SEP (rows 45, 53-58) ---- */
  h+=sub("Residential status");
  h+=row("Residential status",sel("fs.resStatus",WHO_RES,{blank:false}),
    {req:1,ref:"FilingStatus.ResidentialStatus",hint:"a domestic company cannot be a non-resident"});
  if(dom)
    h+=row("Did total turnover / gross receipts in FY 2023-24 exceed ₹400 crore? (domestic company)",
      sel("fs.grossRcpt",WHO_YN),{ref:"FilingStatus.GrossReceipt"});
  h+=row("Is the assessee a resident of a country with which India has an agreement u/s 90(1) / 90A(1)?",
    sel("fs.resSec90",WHO_YN),{ref:"FilingStatus.ResidentSec90"});
  if(nri){
    h+=row("Non-resident: is there a Permanent Establishment (PE) in India?",
      sel("fs.nriPE",WHO_YN),{ref:"FilingStatus.NRI_PE"});
    h+=row("Non-resident: is there a Significant Economic Presence (SEP) in India?",
      sel("fs.nriSEP",WHO_SEP),{ref:"FilingStatus.NriSEPinIndia"});
    if(S.fs.nriSEP==="Y"){
      h+=row("Aggregate of payments under Explanation 2A(a) to section 9(1)(i)",inp("fs.sepPay",{n:1}),
        {ref:"FilingStatus.AggrPaymentTransac"});
      h+=row("Number of users in India under Explanation 2A(b) to section 9(1)(i)",inp("fs.sepUsers",{n:1}),
        {ref:"FilingStatus.NumberOfUsers"});
    }
  }

  /* ---- Block 6 · Concessional regime 115BA/115BAA/115BAB (domestic only, rows 47-52) ---- */
  if(dom){
    h+=sub("Concessional regime — section 115BA / 115BAA / 115BAB");
    h+=row("Have you opted for taxation under section 115BA / 115BAA / 115BAB (in an earlier year)?",
      sel("fs.s115",WHO_115,{blank:false}),{ref:"FilingStatus.Section115BA"});
    if(S.fs.s115==="115BA"||S.fs.s115==="115BAA"||S.fs.s115==="115BAB"){
      h+=row("A.Y. in which the option was first exercised",inp("fs.s115AY",{max:9,ph:"2020-21"}),
        {req:1,ref:"FilingStatus.Section115BAAY"});
      h+=row("Acknowledgment no. of Form 10-IB / 10-IC / 10-ID",inp("fs.s115Ack",{n:1,max:15}),
        {req:1,ref:"FilingStatus.ReceiptNo115BA"});
      h+=row("Date of filing of Form 10-IB / 10-IC / 10-ID (DD/MM/YYYY)",dte("fs.s115Date"),
        {req:1,ref:"FilingStatus.115BAFormFiledDate"});
    } else {
      h+=row("If not opted earlier, are you choosing to opt this year?",
        sel("fs.s115Curr",WHO_YN),{ref:"FilingStatus.Section115CurrAY"});
      if(S.fs.s115Curr==="Y"){
        h+=row("Section chosen this year",sel("fs.s115CurrSec",WHO_115CUR),
          {req:1,ref:"FilingStatus.SectionCurrAY"});
        h+=row("Acknowledgment no. of Form 10-IB / 10-IC / 10-ID",inp("fs.s115CurrAck",{n:1,max:15}),
          {req:1,ref:"FilingStatus.Section115CurrAYRecNo"});
        h+=row("Date of filing of the relevant form (DD/MM/YYYY)",dte("fs.s115CurrDate"),
          {req:1,ref:"FilingStatus.Section115CurrAYDate"});
      }
    }
  }

  /* ---- Block 7 · Company particulars (rows 59-83) ---- */
  h+=sub("Company particulars");
  h+=row("Is the company required to seek registration under any law relating to companies?",
    sel("fs.regLaw",WHO_YN),{ref:"FilingStatus.RegistratedLaw"});
  if(S.fs.regLaw==="Y"){
    h+=row("Act under which registration is required",inp("fs.actDesc",{max:100}),{ref:"FilingStatus.ActDesc"});
    h+=row("Registration number",inp("fs.actRegNo",{max:25}),{ref:"FilingStatus.ActRegNo"});
    h+=row("Date of registration (DD/MM/YYYY)",dte("fs.actRegDate"),{ref:"FilingStatus.ActRegDate"});
  }
  h+=row("Are the financial statements drawn up in compliance with Ind AS?",
    sel("fs.finStmt",WHO_YN),{req:1,ref:"FilingStatus.FinancialStmtFlag"});
  h+=row("Does the company have a unit in an IFSC deriving income solely in convertible foreign exchange?",
    sel("fs.ifsc",WHO_YN),{ref:"FilingStatus.IsIfsc"});
  h+=row("Is the company under liquidation?",
    sel("fs.underLiq",WHO_YN),{req:1,ref:"FilingStatus.UnderLiquidation"});
  h+=row("Are you an FII / FPI?",sel("fs.fpi",WHO_YN),
    {req:1,ref:"FilingStatus.FiiFpiFlag",hint:"Yes unlocks Schedule 115AD"});
  if(S.fs.fpi==="Y")
    h+=row("SEBI registration number",inp("fs.sebi",{max:25}),{req:1,ref:"FilingStatus.SebiRegnNo"});
  h+=row("Is the company a producer company u/s 378A of the Companies Act, 2013?",
    sel("fs.producer",WHO_YN),{req:1,ref:"FilingStatus.Sec581AFlag"});
  h+=row("Is this return filed by a representative assessee?",
    sel("fs.rep",WHO_YN),{req:1,ref:"FilingStatus.AsseseeRepFlg"});
  if(S.fs.rep==="Y"){
    h+=row("Name of the representative assessee",inp("fs.repName",{max:75}),
      {req:1,ref:"AssesseeRep.RepName"});
    h+=row("Email-ID of the representative",inp("fs.repEmail",{max:125}),
      {req:1,ref:"AssesseeRep.RepEmailID"});
    h+=row("Contact number of the representative",
      inp("fs.repMobileCc",{n:1,max:3,ph:"Code"})+' '+inp("fs.repMobile",{n:1,max:10,ph:"Mobile"}),
      {req:1,ref:"AssesseeRep.CountryCodeRepMobileNo / RepMobileNo"});
  }
  h+=row("Are you recognized as a start-up by DPIIT?",
    sel("fs.startup",WHO_YN),{req:1,ref:"FilingStatus.StartUpDPIITFlag"});
  if(S.fs.startup==="Y"){
    h+=row("Start-up recognition number allotted by DPIIT",inp("fs.dpiitNo",{max:25}),
      {req:1,ref:"FilingStatus.RecgnNumAllottedByDPIIT"});
    h+=row("Is a certificate from the inter-ministerial board received?",
      sel("fs.imbCert",WHO_YN),{ref:"FilingStatus.InterMinisterialCertFlag"});
    if(S.fs.imbCert==="Y")
      h+=row("Certification number",inp("fs.certNo",{max:25}),{ref:"FilingStatus.CertificationNumber"});
    h+=row("Has Form-2 (para 5 of the DPIIT notification dated 19/02/2019) been filed before this return?",
      sel("fs.form2",WHO_YN),{ref:"FilingStatus.Form2AccordPara5DPIITFlag"});
    if(S.fs.form2==="Y")
      h+=row("Date of filing of Form-2 (DD/MM/YYYY)",dte("fs.form2Date"),{ref:"FilingStatus.DateOfFilingForm2"});
  }
  h+=row("Are you recognized as an MSME?",sel("fs.msme",WHO_YN),
    {req:1,ref:"FilingStatus.ifMSME"});
  if(S.fs.msme==="Y")
    h+=row("Registration number allotted under the MSMED Act, 2006",inp("fs.msmeNo",{max:25}),
      {req:1,ref:"FilingStatus.RegNumMSMEDAct2006"});

  /* ---- Item r · Legal Entity Identifier (mandatory when refund >= 50 crore) ---- */
  h+=sub("Legal Entity Identifier (LEI) — item r");
  h+=row("LEI number",inp("fs.lei",{max:20}),
    {ref:"r · FilingStatus.LEIDtls.LEINumber",hint:"mandatory when the refund is ₹50 crore or more"});
  h+=row("Valid up to (DD/MM/YYYY)",dte("fs.leiValid"),{ref:"r · FilingStatus.LEIDtls.ValidUptoDate"});

  /* ---- Condition for audit u/s 44AB (Cndnfor44AB) — the only audit leaf of PartA_GEN1 ---- */
  h+=sub("Condition for audit under section 44AB");
  h+=row("By virtue of which condition is the company liable for audit u/s 44AB?",
    sel("fs.cnd44AB",WHO_CND44),{ref:"FilingStatus.Cndnfor44AB"});
  h+=note("The audit-liability flag (b), section 44AA / 44AB / 92E and the auditor and other-audit-report tables live on the <b>Audit information</b> screen (PartA_GEN2For6). Only this single condition string (bi-biv folded to one value) belongs to Part A - General / PartA_GEN1.");

  return h;
}

/* =====================================================================
   EXPORT — expWho(j): write PartA_GEN1 onto j. put() skips empty values;
   the SKEL skeleton keeps every required leaf present even at nil.
   No PartA_GEN2For6 audit key is written here (owned by section "gen").
   ===================================================================== */
function expWho(j){
  const P=S.pi||{}, F=S.fs||{};
  const dom=(P.domestic||"Y")!=="N";
  const nri=(F.resStatus||"RES")==="NRI";
  const india=(P.country||"91")==="91";
  const indiab=(P.countryb||"91")==="91";
  const sec=st0(F.sec);

  /* ---------- PartA_GEN1 · OrgFirmInfo ---------- */
  put(j,"PartA_GEN1.OrgFirmInfo.AssesseeName.SurNameOrOrgName",sv(P.name));
  if(P.nameChg==="Y") put(j,"PartA_GEN1.OrgFirmInfo.AssesseeName.OrgOldName",sv(P.oldName));
  put(j,"PartA_GEN1.OrgFirmInfo.PAN",sv(P.pan&&String(P.pan).toUpperCase()));
  put(j,"PartA_GEN1.OrgFirmInfo.CINissuedByMCA",sv(P.cin&&String(P.cin).toUpperCase()));
  put(j,"PartA_GEN1.OrgFirmInfo.DateOFFormOrIncorp",ISO(P.doi));
  if(P.bizStart) put(j,"PartA_GEN1.OrgFirmInfo.DateofBusCommencement",ISO(P.bizStart));
  put(j,"PartA_GEN1.OrgFirmInfo.StatusOrCompanyType",sv(P.status||"6"));
  put(j,"PartA_GEN1.OrgFirmInfo.DomesticCompFlg",sv(P.domestic||"Y"));
  /* Address (primary) */
  put(j,"PartA_GEN1.OrgFirmInfo.Address.ResidenceNo",sv(P.addr1));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.ResidenceName",sv(P.premises));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.RoadOrStreet",sv(P.road));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.LocalityOrArea",sv(P.locality));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.CityOrTownOrDistrict",sv(P.city));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.StateCode",sv(india?P.state:"99"));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.CountryCode",sv(P.country||"91"));
  if(india){ if(P.pin) put(j,"PartA_GEN1.OrgFirmInfo.Address.PinCode",R(P.pin)); }
  else if(P.zip) put(j,"PartA_GEN1.OrgFirmInfo.Address.ZipCode",sv(P.zip));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.EmailAddress",sv(P.email));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.EmailAddressSecondary",sv(P.email2));
  if(P.mobile){ put(j,"PartA_GEN1.OrgFirmInfo.Address.CountryCodeMobile",R(P.mobileCc||91));
                put(j,"PartA_GEN1.OrgFirmInfo.Address.MobileNo",R(P.mobile)); }
  if(P.mobile2){ put(j,"PartA_GEN1.OrgFirmInfo.Address.CountryCodeMobileNoSec",R(P.mobile2Cc||91));
                 put(j,"PartA_GEN1.OrgFirmInfo.Address.MobileNoSec",R(P.mobile2)); }
  if(P.std) put(j,"PartA_GEN1.OrgFirmInfo.Address.Phone.STDcode",R(P.std));
  if(P.phone) put(j,"PartA_GEN1.OrgFirmInfo.Address.Phone.PhoneNo",R(P.phone));
  put(j,"PartA_GEN1.OrgFirmInfo.SecondaryAdd",sv(P.addr2same||"Y"));
  if(P.addr2same==="N"){
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.ResidenceNo",sv(P.addr1b));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.ResidenceName",sv(P.premisesb));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.RoadOrStreet",sv(P.roadb));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.LocalityOrArea",sv(P.localityb));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.CityOrTownOrDistrict",sv(P.cityb));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.StateCode",sv(indiab?P.stateb:"99"));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.CountryCode",sv(P.countryb||"91"));
    if(indiab){ if(P.pinb) put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.PinCode",R(P.pinb)); }
    else if(P.zipb) put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.ZipCode",sv(P.zipb));
  }

  /* ---------- PartA_GEN1 · FilingStatus ---------- */
  put(j,"PartA_GEN1.FilingStatus.ItrFilingDueDate",sv(F.due||"2026-10-31"));
  put(j,"PartA_GEN1.FilingStatus.ReturnFileSec.IncomeTaxSec",R(F.sec||11));
  if(WHO_SEC_REVISED.indexOf(sec)>=0){
    put(j,"PartA_GEN1.FilingStatus.ReceiptNo",sv(F.receipt));
    put(j,"PartA_GEN1.FilingStatus.OrigRetFiledDate",ISO(F.origdate));
  }
  if(WHO_SEC_NOTICE.indexOf(sec)>=0) put(j,"PartA_GEN1.FilingStatus.UniqueNumNoticeUs",sv(F.din));
  if(WHO_SEC_NOTICE.indexOf(sec)>=0||WHO_SEC_APA.indexOf(sec)>=0)
    put(j,"PartA_GEN1.FilingStatus.NoticeDateUnderSec",ISO(F.noticedate));
  put(j,"PartA_GEN1.FilingStatus.ResidentialStatus",sv(F.resStatus||"RES"));
  if(dom) put(j,"PartA_GEN1.FilingStatus.GrossReceipt",sv(F.grossRcpt));
  put(j,"PartA_GEN1.FilingStatus.ResidentSec90",sv(F.resSec90));
  if(nri){
    put(j,"PartA_GEN1.FilingStatus.NRI_PE",sv(F.nriPE));
    put(j,"PartA_GEN1.FilingStatus.NriSEPinIndia",sv(F.nriSEP));
    if(F.nriSEP==="Y"){
      if(F.sepPay) put(j,"PartA_GEN1.FilingStatus.AggrPaymentTransac",R(F.sepPay));
      if(F.sepUsers) put(j,"PartA_GEN1.FilingStatus.NumberOfUsers",R(F.sepUsers));
    }
  }
  /* Concessional regime — domestic company only (a foreign company cannot opt, rule 9) */
  if(dom){
    put(j,"PartA_GEN1.FilingStatus.Section115BA",sv(F.s115||"NA"));
    if(F.s115==="115BA"||F.s115==="115BAA"||F.s115==="115BAB"){
      put(j,"PartA_GEN1.FilingStatus.Section115BAAY",sv(F.s115AY));
      if(F.s115Ack) put(j,"PartA_GEN1.FilingStatus.ReceiptNo115BA",R(F.s115Ack));
      put(j,"PartA_GEN1.FilingStatus.115BAFormFiledDate",ISO(F.s115Date));
    } else {
      put(j,"PartA_GEN1.FilingStatus.Section115CurrAY",sv(F.s115Curr));
      if(F.s115Curr==="Y"){
        put(j,"PartA_GEN1.FilingStatus.SectionCurrAY",sv(F.s115CurrSec));
        if(F.s115CurrAck) put(j,"PartA_GEN1.FilingStatus.Section115CurrAYRecNo",R(F.s115CurrAck));
        put(j,"PartA_GEN1.FilingStatus.Section115CurrAYDate",ISO(F.s115CurrDate));
      }
    }
  }
  put(j,"PartA_GEN1.FilingStatus.RegistratedLaw",sv(F.regLaw));
  if(F.regLaw==="Y"){
    put(j,"PartA_GEN1.FilingStatus.ActDesc",sv(F.actDesc));
    put(j,"PartA_GEN1.FilingStatus.ActRegNo",sv(F.actRegNo));
    put(j,"PartA_GEN1.FilingStatus.ActRegDate",ISO(F.actRegDate));
  }
  put(j,"PartA_GEN1.FilingStatus.FinancialStmtFlag",sv(F.finStmt));
  put(j,"PartA_GEN1.FilingStatus.IsIfsc",sv(F.ifsc));
  put(j,"PartA_GEN1.FilingStatus.UnderLiquidation",sv(F.underLiq));
  put(j,"PartA_GEN1.FilingStatus.FiiFpiFlag",sv(F.fpi||"N"));
  if(F.fpi==="Y") put(j,"PartA_GEN1.FilingStatus.SebiRegnNo",sv(F.sebi));
  put(j,"PartA_GEN1.FilingStatus.Sec581AFlag",sv(F.producer||"N"));
  put(j,"PartA_GEN1.FilingStatus.AsseseeRepFlg",sv(F.rep||"N"));
  if(F.rep==="Y"){
    put(j,"PartA_GEN1.FilingStatus.AssesseeRep.RepName",sv(F.repName));
    put(j,"PartA_GEN1.FilingStatus.AssesseeRep.RepEmailID",sv(F.repEmail));
    if(F.repMobile){
      put(j,"PartA_GEN1.FilingStatus.AssesseeRep.CountryCodeRepMobileNo",R(F.repMobileCc||91));
      put(j,"PartA_GEN1.FilingStatus.AssesseeRep.RepMobileNo",R(F.repMobile));
    }
  }
  put(j,"PartA_GEN1.FilingStatus.StartUpDPIITFlag",sv(F.startup||"N"));
  if(F.startup==="Y"){
    put(j,"PartA_GEN1.FilingStatus.RecgnNumAllottedByDPIIT",sv(F.dpiitNo));
    put(j,"PartA_GEN1.FilingStatus.InterMinisterialCertFlag",sv(F.imbCert));
    if(F.imbCert==="Y") put(j,"PartA_GEN1.FilingStatus.CertificationNumber",sv(F.certNo));
    put(j,"PartA_GEN1.FilingStatus.Form2AccordPara5DPIITFlag",sv(F.form2));
    if(F.form2==="Y") put(j,"PartA_GEN1.FilingStatus.DateOfFilingForm2",ISO(F.form2Date));
  }
  put(j,"PartA_GEN1.FilingStatus.ifMSME",sv(F.msme||"N"));
  if(F.msme==="Y") put(j,"PartA_GEN1.FilingStatus.RegNumMSMEDAct2006",sv(F.msmeNo));
  if(F.lei){
    put(j,"PartA_GEN1.FilingStatus.LEIDtls.LEINumber",sv(String(F.lei).toUpperCase()));
    put(j,"PartA_GEN1.FilingStatus.LEIDtls.ValidUptoDate",ISO(F.leiValid));
  }
  /* the one audit leaf that lives in PartA_GEN1 (book §8.3; bi-biv folded to one string) */
  put(j,"PartA_GEN1.FilingStatus.Cndnfor44AB",sv(F.cnd44AB));
}

/* =====================================================================
   IMPORT — impWho(I6): read PartA_GEN1 back into S.pi / S.fs, so the
   round-trip (JSON -> import -> export) is identity. Returns short labels.
   ===================================================================== */
function impWho(I6){
  const read=[];
  const g1=(I6&&I6.PartA_GEN1)||{}, OI=g1.OrgFirmInfo||{}, AD=OI.Address||{}, AA=OI.AlternateAddress||{}, FS=g1.FilingStatus||{};
  S.pi=S.pi||{}; S.fs=S.fs||{};

  if(OI.AssesseeName){
    if(OI.AssesseeName.SurNameOrOrgName!=null)S.pi.name=OI.AssesseeName.SurNameOrOrgName;
    if(OI.AssesseeName.OrgOldName!=null){S.pi.oldName=OI.AssesseeName.OrgOldName;S.pi.nameChg="Y";}
    read.push("name");
  }
  if(OI.PAN!=null){S.pi.pan=OI.PAN;read.push("PAN");}
  if(OI.CINissuedByMCA!=null)S.pi.cin=OI.CINissuedByMCA;
  if(OI.DateOFFormOrIncorp)S.pi.doi=dmy(OI.DateOFFormOrIncorp)||S.pi.doi;
  if(OI.DateofBusCommencement)S.pi.bizStart=dmy(OI.DateofBusCommencement);
  if(OI.StatusOrCompanyType!=null)S.pi.status=String(OI.StatusOrCompanyType);
  if(OI.DomesticCompFlg!=null)S.pi.domestic=OI.DomesticCompFlg;
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
    if(AD.EmailAddress!=null)S.pi.email=AD.EmailAddress;
    if(AD.EmailAddressSecondary!=null)S.pi.email2=AD.EmailAddressSecondary;
    if(AD.CountryCodeMobile!=null)S.pi.mobileCc=String(AD.CountryCodeMobile);
    if(AD.MobileNo!=null)S.pi.mobile=String(AD.MobileNo);
    if(AD.CountryCodeMobileNoSec!=null)S.pi.mobile2Cc=String(AD.CountryCodeMobileNoSec);
    if(AD.MobileNoSec!=null)S.pi.mobile2=String(AD.MobileNoSec);
    if(AD.Phone){if(AD.Phone.STDcode!=null)S.pi.std=String(AD.Phone.STDcode);
                 if(AD.Phone.PhoneNo!=null)S.pi.phone=String(AD.Phone.PhoneNo);}
    read.push("address");
  }
  if(OI.SecondaryAdd!=null)S.pi.addr2same=OI.SecondaryAdd;
  if(Object.keys(AA).length){
    if(AA.ResidenceNo!=null)S.pi.addr1b=AA.ResidenceNo;
    if(AA.ResidenceName!=null)S.pi.premisesb=AA.ResidenceName;
    if(AA.RoadOrStreet!=null)S.pi.roadb=AA.RoadOrStreet;
    if(AA.LocalityOrArea!=null)S.pi.localityb=AA.LocalityOrArea;
    if(AA.CityOrTownOrDistrict!=null)S.pi.cityb=AA.CityOrTownOrDistrict;
    if(AA.StateCode!=null)S.pi.stateb=AA.StateCode;
    if(AA.CountryCode!=null)S.pi.countryb=AA.CountryCode;
    if(AA.PinCode!=null)S.pi.pinb=String(AA.PinCode);
    if(AA.ZipCode!=null)S.pi.zipb=AA.ZipCode;
    read.push("secondary address");
  }

  if(FS.ItrFilingDueDate!=null){S.fs.due=FS.ItrFilingDueDate;read.push("due date");}
  if(FS.ReturnFileSec&&FS.ReturnFileSec.IncomeTaxSec!=null){S.fs.sec=String(FS.ReturnFileSec.IncomeTaxSec);read.push("filing section");}
  if(FS.ReceiptNo!=null)S.fs.receipt=String(FS.ReceiptNo);
  if(FS.OrigRetFiledDate)S.fs.origdate=dmy(FS.OrigRetFiledDate);
  if(FS.UniqueNumNoticeUs!=null)S.fs.din=FS.UniqueNumNoticeUs;
  if(FS.NoticeDateUnderSec)S.fs.noticedate=dmy(FS.NoticeDateUnderSec);
  if(FS.ResidentialStatus!=null){S.fs.resStatus=FS.ResidentialStatus;read.push("residential status");}
  if(FS.GrossReceipt!=null)S.fs.grossRcpt=FS.GrossReceipt;
  if(FS.ResidentSec90!=null)S.fs.resSec90=FS.ResidentSec90;
  if(FS.NRI_PE!=null)S.fs.nriPE=FS.NRI_PE;
  if(FS.NriSEPinIndia!=null)S.fs.nriSEP=FS.NriSEPinIndia;
  if(FS.AggrPaymentTransac!=null)S.fs.sepPay=String(FS.AggrPaymentTransac);
  if(FS.NumberOfUsers!=null)S.fs.sepUsers=String(FS.NumberOfUsers);
  if(FS.Section115BA!=null){S.fs.s115=FS.Section115BA;read.push("115BA regime");}
  if(FS.Section115BAAY!=null)S.fs.s115AY=FS.Section115BAAY;
  if(FS.ReceiptNo115BA!=null)S.fs.s115Ack=String(FS.ReceiptNo115BA);
  if(FS["115BAFormFiledDate"])S.fs.s115Date=dmy(FS["115BAFormFiledDate"]);
  if(FS.Section115CurrAY!=null)S.fs.s115Curr=FS.Section115CurrAY;
  if(FS.SectionCurrAY!=null)S.fs.s115CurrSec=FS.SectionCurrAY;
  if(FS.Section115CurrAYRecNo!=null)S.fs.s115CurrAck=String(FS.Section115CurrAYRecNo);
  if(FS.Section115CurrAYDate)S.fs.s115CurrDate=dmy(FS.Section115CurrAYDate);
  if(FS.RegistratedLaw!=null)S.fs.regLaw=FS.RegistratedLaw;
  if(FS.ActDesc!=null)S.fs.actDesc=FS.ActDesc;
  if(FS.ActRegNo!=null)S.fs.actRegNo=FS.ActRegNo;
  if(FS.ActRegDate)S.fs.actRegDate=dmy(FS.ActRegDate);
  if(FS.FinancialStmtFlag!=null)S.fs.finStmt=FS.FinancialStmtFlag;
  if(FS.IsIfsc!=null)S.fs.ifsc=FS.IsIfsc;
  if(FS.UnderLiquidation!=null)S.fs.underLiq=FS.UnderLiquidation;
  if(FS.FiiFpiFlag!=null)S.fs.fpi=FS.FiiFpiFlag;
  if(FS.SebiRegnNo!=null)S.fs.sebi=FS.SebiRegnNo;
  if(FS.Sec581AFlag!=null)S.fs.producer=FS.Sec581AFlag;
  if(FS.AsseseeRepFlg!=null){S.fs.rep=FS.AsseseeRepFlg;read.push("representative");}
  if(FS.AssesseeRep){S.fs.repName=FS.AssesseeRep.RepName;S.fs.repEmail=FS.AssesseeRep.RepEmailID;
    if(FS.AssesseeRep.CountryCodeRepMobileNo!=null)S.fs.repMobileCc=String(FS.AssesseeRep.CountryCodeRepMobileNo);
    if(FS.AssesseeRep.RepMobileNo!=null)S.fs.repMobile=String(FS.AssesseeRep.RepMobileNo);}
  if(FS.StartUpDPIITFlag!=null)S.fs.startup=FS.StartUpDPIITFlag;
  if(FS.RecgnNumAllottedByDPIIT!=null)S.fs.dpiitNo=FS.RecgnNumAllottedByDPIIT;
  if(FS.InterMinisterialCertFlag!=null)S.fs.imbCert=FS.InterMinisterialCertFlag;
  if(FS.CertificationNumber!=null)S.fs.certNo=FS.CertificationNumber;
  if(FS.Form2AccordPara5DPIITFlag!=null)S.fs.form2=FS.Form2AccordPara5DPIITFlag;
  if(FS.DateOfFilingForm2)S.fs.form2Date=dmy(FS.DateOfFilingForm2);
  if(FS.ifMSME!=null){S.fs.msme=FS.ifMSME;read.push("MSME");}
  if(FS.RegNumMSMEDAct2006!=null)S.fs.msmeNo=FS.RegNumMSMEDAct2006;
  if(FS.LEIDtls){S.fs.lei=FS.LEIDtls.LEINumber;if(FS.LEIDtls.ValidUptoDate)S.fs.leiValid=dmy(FS.LEIDtls.ValidUptoDate);read.push("LEI");}
  if(FS.Cndnfor44AB!=null)S.fs.cnd44AB=FS.Cndnfor44AB;
  return read;
}

/* =====================================================================
   CHECKS — chkWho(): the identity/filing-face rules of Part A - General as
   live messages. Department rules (n=... in rules.json) are Phase 6; here
   only this screen's own mandatory / format / consistency validations.
   ===================================================================== */
function chkWho(){
  const out=[], P=S.pi||{}, F=S.fs||{};
  const dom=(P.domestic||"Y")!=="N";
  /* Name */
  if(!st0(P.name)) out.push({lvl:"err",t:"Name required",m:"Enter the name of the company.",sec:"who"});
  if(P.nameChg==="Y"&&!st0(P.oldName)) out.push({lvl:"err",t:"Old name required",m:"A change of name is marked — furnish the old name.",sec:"who"});
  /* PAN — present, valid, fourth letter C for a company */
  const pan=st0(P.pan).toUpperCase();
  if(!pan) out.push({lvl:"err",t:"PAN required",m:"Enter the PAN of the company.",sec:"who"});
  else if(!PAN_RE.test(pan)) out.push({lvl:"err",t:"PAN not valid",m:"The PAN must be five letters, four digits and a letter.",sec:"who"});
  else if(pan[3]!=="C") out.push({lvl:"warn",t:"PAN does not match a company",m:"The fourth letter of a company's PAN should be C.",sec:"who"});
  /* Date of incorporation — mandatory, on or before 31 March 2026 */
  const doi=D(P.doi);
  if(!doi) out.push({lvl:"err",t:"Date of incorporation required",m:"Enter the date of incorporation in DD/MM/YYYY.",sec:"who"});
  else if(doi>YREND) out.push({lvl:"err",t:"Date of incorporation",m:"The date must be on or before 31 March 2026.",sec:"who"});
  /* Date of commencement (A6) must not be before incorporation (rule n=20) */
  const doc=D(P.bizStart);
  if(doc&&doi&&doc<doi) out.push({lvl:"err",t:"Commencement before incorporation",m:"The date of commencement of business (A6) must not be before the date of incorporation.",sec:"who"});
  /* Status / domestic flags */
  if(!st0(P.status)) out.push({lvl:"err",t:"Status required",m:"Select public or private company.",sec:"who"});
  if(!st0(P.domestic)) out.push({lvl:"err",t:"Domestic flag required",m:"State whether the company is domestic or foreign.",sec:"who"});
  /* Primary address required leaves */
  if(!st0(P.addr1)) out.push({lvl:"err",t:"Address required",m:"Flat / Door / Block number is mandatory.",sec:"who"});
  if(!st0(P.locality)) out.push({lvl:"err",t:"Address required",m:"Area or locality is mandatory.",sec:"who"});
  if(!st0(P.city)) out.push({lvl:"err",t:"Address required",m:"Town / city / district is mandatory.",sec:"who"});
  if(!st0(P.state)) out.push({lvl:"err",t:"State required",m:"Select the state.",sec:"who"});
  if(!st0(P.country)) out.push({lvl:"err",t:"Country required",m:"Select the country or region.",sec:"who"});
  if((P.country||"91")==="91"&&st0(P.pin)&&!/^\d{6}$/.test(st0(P.pin)))
    out.push({lvl:"err",t:"PIN code",m:"The PIN code must be six digits.",sec:"who"});
  /* Email / mobile / phone */
  if(!st0(P.email)) out.push({lvl:"err",t:"Email required",m:"The primary email is mandatory — it receives the copy of ITR-V.",sec:"who"});
  else if(!MAIL.test(st0(P.email))) out.push({lvl:"err",t:"Email not valid",m:"Enter a valid primary email address.",sec:"who"});
  if(!st0(P.mobile)) out.push({lvl:"err",t:"Mobile required",m:"The primary mobile number is mandatory.",sec:"who"});
  else if((P.country||"91")==="91"&&!/^\d{10}$/.test(st0(P.mobile))) out.push({lvl:"warn",t:"Mobile number",m:"With country India the mobile number should be ten digits.",sec:"who"});
  if(!st0(P.std)) out.push({lvl:"warn",t:"STD/ISD code",m:"The STD/ISD code is expected for a company.",sec:"who"});
  if(!st0(P.phone)) out.push({lvl:"warn",t:"Office phone",m:"The office phone number is expected for a company.",sec:"who"});
  /* Secondary address — mandatory and distinct when not the same as primary */
  if(P.addr2same==="N"){
    if(!st0(P.addr1b)||!st0(P.localityb)||!st0(P.cityb)||!st0(P.stateb))
      out.push({lvl:"err",t:"Secondary address required",m:"The secondary address is not the same as the primary — its Flat/Door, locality, town and state are mandatory.",sec:"who"});
    else if(st0(P.addr1b)===st0(P.addr1)&&st0(P.localityb)===st0(P.locality)&&st0(P.cityb)===st0(P.city))
      out.push({lvl:"warn",t:"Secondary address matches primary",m:"The secondary address must not be identical to the primary — set 'same as primary' to Yes instead.",sec:"who"});
  }
  /* Filing section / due date */
  if(!st0(F.sec)) out.push({lvl:"err",t:"Filing section required",m:"Select the section under which the return is filed.",sec:"who"});
  if(!st0(F.due)) out.push({lvl:"err",t:"Due date required",m:"Select the 139(1) due date.",sec:"who"});
  /* Residential status vs domestic flag (rule 11) — a domestic company cannot be non-resident */
  if(!st0(F.resStatus)) out.push({lvl:"err",t:"Residential status required",m:"Select the residential status.",sec:"who"});
  else if(dom&&F.resStatus==="NRI") out.push({lvl:"warn",t:"Domestic but non-resident",m:"A domestic company cannot be a non-resident — reconcile the domestic flag with the residential status.",sec:"who"});
  /* Concessional regime — a foreign company cannot opt (rule 9) */
  if(!dom&&(F.s115==="115BA"||F.s115==="115BAA"||F.s115==="115BAB"))
    out.push({lvl:"warn",t:"Foreign company and 115BA/BAA/BAB",m:"A foreign company cannot claim section 115BA / 115BAA / 115BAB.",sec:"who"});
  /* Mandatory company-particulars flags */
  if(!st0(F.finStmt)) out.push({lvl:"err",t:"Ind AS flag required",m:"State whether the financial statements comply with Ind AS.",sec:"who"});
  if(!st0(F.underLiq)) out.push({lvl:"err",t:"Liquidation flag required",m:"State whether the company is under liquidation.",sec:"who"});
  if(!st0(F.fpi)) out.push({lvl:"err",t:"FII/FPI flag required",m:"State whether the company is an FII / FPI.",sec:"who"});
  if(F.fpi==="Y"&&!st0(F.sebi)) out.push({lvl:"err",t:"SEBI number required",m:"An FII / FPI must provide its SEBI registration number.",sec:"who"});
  if(!st0(F.producer)) out.push({lvl:"err",t:"Producer-company flag required",m:"State whether the company is a producer company u/s 378A.",sec:"who"});
  if(!st0(F.rep)) out.push({lvl:"err",t:"Representative flag required",m:"State whether the return is filed by a representative assessee.",sec:"who"});
  if(F.rep==="Y"&&(!st0(F.repName)||!st0(F.repEmail)||!st0(F.repMobile)))
    out.push({lvl:"err",t:"Representative details required",m:"Furnish the representative's name, email and contact number.",sec:"who"});
  if(!st0(F.startup)) out.push({lvl:"err",t:"Start-up flag required",m:"State whether the company is recognized as a start-up by DPIIT.",sec:"who"});
  if(F.startup==="Y"&&!st0(F.dpiitNo)) out.push({lvl:"err",t:"DPIIT number required",m:"A DPIIT-recognized start-up must provide its recognition number.",sec:"who"});
  if(!st0(F.msme)) out.push({lvl:"err",t:"MSME flag required",m:"State whether the company is recognized as an MSME.",sec:"who"});
  if(F.msme==="Y"&&!st0(F.msmeNo)) out.push({lvl:"err",t:"MSME number required",m:"Provide the registration number allotted under the MSMED Act, 2006.",sec:"who"});
  /* LEI validity date sanity when an LEI is given */
  if(st0(F.lei)&&F.leiValid&&!D(F.leiValid)) out.push({lvl:"err",t:"LEI validity date",m:"Enter the LEI validity date in DD/MM/YYYY.",sec:"who"});
  /* summary */
  if(!out.some(x=>x.lvl==="err"))
    out.push({lvl:"ok",t:"Who is filing",m:(st0(P.name)||"Company")+(pan?" · "+pan:"")+(dom?" · domestic":" · foreign")+(P.status==="7"?" private":P.status==="6"?" public":"")+".",sec:"who"});
  return out;
}

/* ---- register (overrides the boot stub) --------------------------- */
reg({id:"who", t:"Who is filing", ref:"Part A - General",
     f:secWho,
     s:()=>{const P=S.pi||{}; return st0(P.pan)?st0(P.pan).toUpperCase()+((P.domestic||"Y")==="N"?" · foreign":"")+(P.status==="7"?" · private":P.status==="6"?" · public":""):"Name, PAN, status, address";},
     eng:engWho, exp:expWho, imp:impWho, chk:chkWho, order:5});
