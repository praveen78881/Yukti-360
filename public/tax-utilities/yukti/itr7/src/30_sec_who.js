/* =====================================================================
   ITR-7 · Section "who" — Who is filing (Part A - General · PI · Audit)
   Books: books/ITR-7/PI.md (PartA_GEN1) · books/ITR-7/Audit.md (PartA_GEN2)
   Sheets owned: PI (rows 6-146) + Audit (rows 12-68). section_map.json maps
   BOTH the PI sheet (→ PartA_GEN1) and the Audit sheet (→ PartA_GEN2) to this
   one "who" section, so this builder owns and exports the whole of BOTH blocks.
   Compute order: 10 (identity face; runs first — most sections read who/status).

   BLOCK-STRADDLE (PI book §7.1 / Audit book §5). PartA_GEN2's
   `OtherDetailsFor7` sub-object (A23 section-2(15) trade test, A24 change in
   activities, A25 first-return flag, A26 22nd-proviso/13(10) flags) has its
   LIVE ROWS on the PI sheet (rows 91-146) but its schema KEYS belong to
   PartA_GEN2. This builder renders those rows (under the identity face) and
   serialises them into PartA_GEN2.OtherDetailsFor7. The rest of PartA_GEN2
   (A27/A28 audit, A29 members / authors / contributors) is on the Audit sheet
   and is also exported here.

   ITR-7 is filed by TRUSTS / INSTITUTIONS and other exemption-claiming bodies
   under sections 139(4A)-(4D). "Personal information" here is the entity's
   identity, its registrations/approvals, and its filing/exemption status — not
   a natural person's page. This screen contributes nothing to GTI, so
   S.C.who.income = 0.

   SOURCE NOTES resolved (reported to the CEO):
   - IDCode / UniqueIdentNumber are SWAPPED between the Audit book's prose and
     the schema. The book table says IDCode = ID-type dropdown, UniqueIdentNumber
     = the number; but the schema enforces the Audit_UIN enum
     (PAN/AAD/TIN/PAS/EPI/DLN/RCN) on `UniqueIdentNumber` and makes `IDCode`
     free text (maxLength 125). Followed the SCHEMA (enum enforcement wins):
     type code → UniqueIdentNumber, number → IDCode.
   - StatusOrCompanyType / ReturnFurnishedSec / SecExemptionClaimed /
     IncomeTaxSec / CompanyType values are the schema's CODED members
     (enums.json), not the sheet's display labels (e.g. status "4", not
     "04-Local Authority"; "139-4A", not "139(4A)"; unlisted company "D"/"F").
   - The exemption-section menu (A17 ii) is narrowed by the 139(4A-D) choice in
     the utility (ExemtionClaimed_List1..4); the schema carries one union enum
     (28 members), reproduced whole here with a note that the utility filters it.
   - Country/State labels in enums.json are scrambled (codes correct); clean
     labels below are the department's (PI book §5c / Audit book §4b). The code
     SET matches enums.json exactly.
   ===================================================================== */

/* ---- dropdown value lists ([value,label]); values verbatim from
   books/ITR-7/enums.json + the schema patterns; labels from the books. ---- */
const WHO7_YN=[["Y","Yes"],["N","No"]];
const WHO7_YNU=[["YES","YES"],["NO","NO"]];                 /* ClaimUS9090A91Flg */
const WHO7_YN_NA=[["Y","Yes"],["N","No"],["NA","Not applicable"]]; /* CharitablePurposeOfGeneralPublic */
const WHO7_STATUS=[["4","Local Authority"],["5","AOP/BOI"],["6","AJP (Artificial Juridical Person)"],["7","Company"]]; /* StatusOrCompanyType */
const WHO7_SUB5=[["5i","5i"],["5v","5v"],["5vii","5vii"]];  /* SubStatus when status = 5 (AOP/BOI) */
const WHO7_SUB7=[["7i","7i"],["7ii","7ii"]];                /* SubStatus when status = 7 (Company) */
const WHO7_SECADDR=[["Y","Yes — same as primary"],["N","No — a different address"]]; /* OrgFirmInfo.SecondaryAdd */
const WHO7_RETFURN=[["139-4A","139(4A)"],["139-4B","139(4B)"],["139-4C","139(4C)"],["139-4D","139(4D)"]]; /* ReturnFurnishedSec */
const WHO7_EXSEC=[["11","Section 11"],["13A","Section 13A"],["13B","Section 13B"],["21","Section 10(21)"],["23A","Section 10(23A)"],["23B","Section 10(23B)"],["23CIIIAB","Section 10(23C)(iiiab)"],["23CIIIAC","Section 10(23C)(iiiac)"],["23CIIIAD","Section 10(23C)(iiiad)"],["23CIIIAE","Section 10(23C)(iiiae)"],["23CIV","Section 10(23C)(iv)"],["23CV","Section 10(23C)(v)"],["23CVI","Section 10(23C)(vi)"],["23CVIA","Section 10(23C)(via)"],["23D","Section 10(23D)"],["23DA","Section 10(23DA)"],["23FB","Section 10(23FB)"],["24","Section 10(24)"],["26","Section 10(46)"],["46A","Section 10(46A)"],["46B","Section 10(46B)"],["47","Section 10(47)"],["23AAA","Section 10(23AAA)"],["23EC","Section 10(23EC)"],["23ED","Section 10(23ED)"],["23EE","Section 10(23EE)"],["29A","Section 10(29A)"],["2135I","Section 10(21) read with section 35(1)"]]; /* SecExemptionClaimed */
const WHO7_RETSEC=[["11","139(1) — on or before due date"],["12","139(4) — belated"],["13","142(1)"],["14","148"],["16","153C"],["17","139(5) — revised"],["18","139(9)"],["19","92CD — modified return"],["20","119(2)(b) — after condonation of delay"]]; /* FilingStatus.ReturnFileSec.IncomeTaxSec (integer) */
const WHO7_RES=[["RES","Resident"],["NRI","Non-Resident"]]; /* ResidentialStatus */
const WHO7_ACTNATURE=[["CHARITABLERELIGIOUS","Charitable & Religious"],["RESEARCH","Research"],["PROFESSIONALBODIES","Professional Bodies"],["TRADEUNION","Trade Union"],["POLITICAL","Political Party"],["ELECTORALTRUST","Electoral Trust"],["OTHERS","Others"]]; /* ProjectOrInstDtls[].ActivityNature */
const WHO7_CLASSCODE=[["iA","Relief of the poor"],["iB","Education"],["iC","Medical Relief"],["iD","Preservation of environment (watersheds, forests, wildlife)"],["iE","Preservation of monuments / places / objects of artistic or historic interest"],["iF","Object of general public utility"],["RELIGIOUS","Religious"],["iiiA","Scientific Research"],["iiiB","Social Research"],["iiiC","Statistical research"],["iiiD","Any other research"],["vA","Law"],["vB","Medicine"],["vC","Accountancy"],["vD","Engineering"],["vE","Architecture"],["vF","Company secretaries"],["vG","Chemistry"],["vH","Materials management"],["vI","Town planning"],["vJ","Any other profession"],["TRADEUNION","Trade union"],["POLITICAL_PARTY","Political party"],["ELECTORALTRUST","Electoral trust"],["ixA","Specified income u/s 10(46)/10(46A)"],["ixB","Infrastructure Debt fund u/s 10(47)"],["YOGA","Yoga"],["OTH","Any Other"],["46B","Section 10(46B) — credit-guarantee trust / fund"]]; /* ProjectOrInstDtls[].ClassificationCode */
const WHO7_REGSEC=[["I","10(23AAA)"],["II","10(23C)(iv)"],["III","10(23C)(v)"],["IV","10(23C)(vi)"],["V","10(23C)(via)"],["VI","12A / 12AB"],["VIII","13B"],["IX","35"],["X","80G(2)(b)"],["XI","80G(2)(a)(iv)"],["XII","Other than under section 80G"]]; /* RegApprUnderITADtls[].SectionRegistered */
const WHO7_REGEXCLAIM=[["true","Yes"],["false","No"]];      /* RegApprUnderITADtls[].RegSecExmpClaimed */
const WHO7_OTHLAW=[["I","FCRA"],["II","DARPAN Portal"],["III","SEBI"],["IV","IFSC"],["V","Any other Law"]]; /* RegApprUnderOthITADtls[].LawRegistered */
const WHO7_UNLCOMP=[["D","Domestic"],["F","Foreign"]];      /* HeldUnlistedEqShrPrYrDtls[].CompanyType */

/* -- PartA_GEN2 · Audit + governance -- */
const WHO7_AUDSEC=[["10(23C)(iv)","10(23C)(iv)"],["10(23C)(v)","10(23C)(v)"],["10(23C)(vi)","10(23C)(vi)"],["10(23C)(via)","10(23C)(via)"],["12A(1)(b)","12A(1)(b)"],["92E","92E"],["Others","Others"]]; /* AuditDetails[].AuditedSection */
const WHO7_AUDACT=[["1","Central Goods and Services Tax Act, 2017"],["2","Charitable and Religious Trust Act, 1920"],["3","Companies Act, 2013"],["4","Employees Provident Fund and Miscellaneous Provisions Act, 1952"],["5","Government Superannuation Fund Act, 1956"],["6","Indian Trusts Act, 1882"],["7","Integrated Goods and Services Tax Act, 2017"],["8","Limited Liability Partnership Act, 2008"],["9","Payment of Gratuity Act, 1972"],["10","State Goods and Services Tax Act, 2017"],["11","Union Territories Goods and Services Tax Act, 2017"],["12","Banking Regulation Act, 1949"],["13","Central Excise Act, 1944"],["14","Central Sales Tax Act, 1956"],["15","Electricity Act, 2003"],["16","Foreign Exchange Management Act, 1999"],["17","SEBI Act, 1992"],["18","Securities Contract (Regulation) Act, 1956"],["19","Foreign Contribution Regulation Act, 2010"],["20","Society Registration Act, 1860"],["OTH","Any other law"]]; /* LiableAnyOthThnINTActDetails[].AuditedAct */
const WHO7_MEMSTATUS=[["INDIVIDUAL","INDIVIDUAL"],["HUF","HUF"],["FIRM","FIRM"],["LLP","LLP"],["DOMESTIC_COMPANY","DOMESTIC_COMPANY"],["FOREIGN_COMPANY","FOREIGN_COMPANY"],["CO_OPERATIVE_SOCIETY","CO_OPERATIVE_SOCIETY"],["LOCAL_AUTHORITY","LOCAL_AUTHORITY"],["TRUST","TRUST"],["AOP_BOI","AOP_BOI"],["ANY_OTHER_AJP","ANY_OTHER_AJP"]]; /* PartnerOrMemberInfo[].Status */
const WHO7_RELATION=[["1","Author"],["2","Founder"],["3","Settlor"],["4","Trustee"],["5","Members of society"],["6","Members of the Governing Council"],["7","Director"],["8","Shareholders holding 5% or more"],["9","Office Bearer"],["10","Principal Officer"],["11","Person Competent to verify"],["12","Principal Secretary"],["13","Secretary"],["14","Chief Executive Officer"],["15","Chief Financial Officer"],["16","Manager"],["17","Representative Assessee"],["18","Any other Principal Officer"],["19","Managing director"],["20","Authorised signatory"]]; /* AuthorFounderDtls5percent[].Relation */
const WHO7_UIN=[["PAN","PAN"],["AAD","Aadhaar"],["TIN","Taxpayer Identification Number (country of residence)"],["PAS","Passport number"],["EPI","Elector's photo identity number"],["DLN","Driving License number"],["RCN","Ration card number"]]; /* UniqueIdentNumber (ID-TYPE per schema) */

const WHO7_STATE=[["01","ANDAMAN AND NICOBAR ISLANDS"],["02","ANDHRA PRADESH"],["03","ARUNACHAL PRADESH"],["04","ASSAM"],["05","BIHAR"],["06","CHANDIGARH"],["07","DADRA NAGAR AND HAVELI"],["08","DAMAN AND DIU"],["09","DELHI"],["10","GOA"],["11","GUJARAT"],["12","HARYANA"],["13","HIMACHAL PRADESH"],["14","JAMMU AND KASHMIR"],["15","KARNATAKA"],["16","KERALA"],["17","LAKHSWADEEP"],["18","MADHYA PRADESH"],["19","MAHARASHTRA"],["20","MANIPUR"],["21","MEGHALAYA"],["22","MIZORAM"],["23","NAGALAND"],["24","ODISHA"],["25","PUDUCHERRY"],["26","PUNJAB"],["27","RAJASTHAN"],["28","SIKKIM"],["29","TAMILNADU"],["30","TRIPURA"],["31","UTTAR PRADESH"],["32","WEST BENGAL"],["33","CHHATISHGARH"],["34","UTTARAKHAND"],["35","JHARKHAND"],["36","TELANGANA"],["37","LADAKH"],["99","FOREIGN"]]; /* State (38) */

const WHO7_COUNTRY=[["93","AFGHANISTAN"],["1001","ALAND ISLANDS"],["355","ALBANIA"],["213","ALGERIA"],["684","AMERICAN SAMOA"],["376","ANDORRA"],["244","ANGOLA"],["1264","ANGUILLA"],["1010","ANTARCTICA"],["1268","ANTIGUA AND BARBUDA"],["54","ARGENTINA"],["374","ARMENIA"],["297","ARUBA"],["61","AUSTRALIA"],["43","AUSTRIA"],["994","AZERBAIJAN"],["1242","BAHAMAS"],["973","BAHRAIN"],["880","BANGLADESH"],["1246","BARBADOS"],["375","BELARUS"],["32","BELGIUM"],["501","BELIZE"],["229","BENIN"],["1441","BERMUDA"],["975","BHUTAN"],["591","BOLIVIA (PLURINATIONAL STATE OF)"],["1002","BONAIRE, SINT EUSTATIUS AND SABA"],["387","BOSNIA AND HERZEGOVINA"],["267","BOTSWANA"],["1003","BOUVET ISLAND"],["55","BRAZIL"],["1014","BRITISH INDIAN OCEAN TERRITORY"],["673","BRUNEI DARUSSALAM"],["359","BULGARIA"],["226","BURKINA FASO"],["257","BURUNDI"],["238","CABO VERDE"],["855","CAMBODIA"],["237","CAMEROON"],["1","CANADA"],["1345","CAYMAN ISLANDS"],["236","CENTRAL AFRICAN REPUBLIC"],["235","CHAD"],["56","CHILE"],["86","CHINA"],["9","CHRISTMAS ISLAND"],["672","COCOS (KEELING) ISLANDS"],["57","COLOMBIA"],["270","COMOROS"],["242","CONGO"],["243","CONGO (DEMOCRATIC REPUBLIC OF THE)"],["682","COOK ISLANDS"],["506","COSTA RICA"],["225","COTE DIVOIRE"],["385","CROATIA"],["53","CUBA"],["1015","CURACAO"],["357","CYPRUS"],["420","CZECHIA"],["45","DENMARK"],["253","DJIBOUTI"],["1767","DOMINICA"],["1809","DOMINICAN REPUBLIC"],["593","ECUADOR"],["20","EGYPT"],["503","EL SALVADOR"],["240","EQUATORIAL GUINEA"],["291","ERITREA"],["372","ESTONIA"],["251","ETHIOPIA"],["500","FALKLAND ISLANDS (MALVINAS)"],["298","FAROE ISLANDS"],["679","FIJI"],["358","FINLAND"],["33","FRANCE"],["594","FRENCH GUIANA"],["689","FRENCH POLYNESIA"],["1004","FRENCH SOUTHERN TERRITORIES"],["241","GABON"],["220","GAMBIA"],["995","GEORGIA"],["49","GERMANY"],["233","GHANA"],["350","GIBRALTAR"],["30","GREECE"],["299","GREENLAND"],["1473","GRENADA"],["590","GUADELOUPE"],["1671","GUAM"],["502","GUATEMALA"],["1481","GUERNSEY"],["224","GUINEA"],["245","GUINEA-BISSAU"],["592","GUYANA"],["509","HAITI"],["1005","HEARD ISLAND AND MCDONALD ISLANDS"],["6","HOLY SEE"],["504","HONDURAS"],["852","HONG KONG"],["36","HUNGARY"],["354","ICELAND"],["91","INDIA"],["62","INDONESIA"],["98","IRAN (ISLAMIC REPUBLIC OF)"],["964","IRAQ"],["353","IRELAND"],["1624","ISLE OF MAN"],["972","ISRAEL"],["5","ITALY"],["1876","JAMAICA"],["81","JAPAN"],["1534","JERSEY"],["962","JORDAN"],["7","KAZAKHSTAN"],["254","KENYA"],["686","KIRIBATI"],["850","KOREA (DEMOCRATIC PEOPLES REPUBLIC OF)"],["82","KOREA (REPUBLIC OF)"],["965","KUWAIT"],["996","KYRGYZSTAN"],["856","LAO PEOPLES DEMOCRATIC REPUBLIC"],["371","LATVIA"],["961","LEBANON"],["266","LESOTHO"],["231","LIBERIA"],["218","LIBYA"],["423","LIECHTENSTEIN"],["370","LITHUANIA"],["352","LUXEMBOURG"],["853","MACAO"],["389","MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)"],["261","MADAGASCAR"],["265","MALAWI"],["60","MALAYSIA"],["960","MALDIVES"],["223","MALI"],["356","MALTA"],["692","MARSHALL ISLANDS"],["596","MARTINIQUE"],["222","MAURITANIA"],["230","MAURITIUS"],["269","MAYOTTE"],["52","MEXICO"],["691","MICRONESIA (FEDERATED STATES OF)"],["373","MOLDOVA (REPUBLIC OF)"],["377","MONACO"],["976","MONGOLIA"],["382","MONTENEGRO"],["1664","MONTSERRAT"],["212","MOROCCO"],["258","MOZAMBIQUE"],["95","MYANMAR"],["264","NAMIBIA"],["674","NAURU"],["977","NEPAL"],["31","NETHERLANDS"],["687","NEW CALEDONIA"],["64","NEW ZEALAND"],["505","NICARAGUA"],["227","NIGER"],["234","NIGERIA"],["683","NIUE"],["15","NORFOLK ISLAND"],["1670","NORTHERN MARIANA ISLANDS"],["47","NORWAY"],["968","OMAN"],["92","PAKISTAN"],["680","PALAU"],["970","PALESTINE, STATE OF"],["507","PANAMA"],["675","PAPUA NEW GUINEA"],["595","PARAGUAY"],["51","PERU"],["63","PHILIPPINES"],["1011","PITCAIRN"],["48","POLAND"],["14","PORTUGAL"],["1787","PUERTO RICO"],["974","QATAR"],["262","REUNION"],["40","ROMANIA"],["8","RUSSIAN FEDERATION"],["250","RWANDA"],["1006","SAINT BARTHELEMY"],["290","SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA"],["1869","SAINT KITTS AND NEVIS"],["1758","SAINT LUCIA"],["1007","SAINT MARTIN (FRENCH PART)"],["508","SAINT PIERRE AND MIQUELON"],["1784","SAINT VINCENT AND THE GRENADINES"],["685","SAMOA"],["378","SAN MARINO"],["239","SAO TOME AND PRINCIPE"],["966","SAUDI ARABIA"],["221","SENEGAL"],["381","SERBIA"],["248","SEYCHELLES"],["232","SIERRA LEONE"],["65","SINGAPORE"],["1721","SINT MAARTEN (DUTCH PART)"],["421","SLOVAKIA"],["386","SLOVENIA"],["677","SOLOMON ISLANDS"],["252","SOMALIA"],["28","SOUTH AFRICA"],["1008","SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS"],["211","SOUTH SUDAN"],["35","SPAIN"],["94","SRI LANKA"],["249","SUDAN"],["597","SURINAME"],["1012","SVALBARD AND JAN MAYEN"],["268","SWAZILAND"],["46","SWEDEN"],["41","SWITZERLAND"],["963","SYRIAN ARAB REPUBLIC"],["886","TAIWAN, PROVINCE OF CHINA"],["992","TAJIKISTAN"],["255","TANZANIA, UNITED REPUBLIC OF"],["66","THAILAND"],["670","TIMOR-LESTE(EAST TIMOR)"],["228","TOGO"],["690","TOKELAU"],["676","TONGA"],["1868","TRINIDAD AND TOBAGO"],["216","TUNISIA"],["90","TURKEY"],["993","TURKMENISTAN"],["1649","TURKS AND CAICOS ISLANDS"],["688","TUVALU"],["256","UGANDA"],["380","UKRAINE"],["971","UNITED ARAB EMIRATES"],["44","UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND"],["2","UNITED STATES OF AMERICA"],["1009","UNITED STATES MINOR OUTLYING ISLANDS"],["598","URUGUAY"],["998","UZBEKISTAN"],["678","VANUATU"],["58","VENEZUELA (BOLIVARIAN REPUBLIC OF)"],["84","VIET NAM"],["1284","VIRGIN ISLANDS (BRITISH)"],["1340","VIRGIN ISLANDS (U.S.)"],["681","WALLIS AND FUTUNA"],["1013","WESTERN SAHARA"],["967","YEMEN"],["260","ZAMBIA"],["263","ZIMBABWE"],["9999","OTHERS"]]; /* Country (250) */

/* section codes that open the notice / revised-return sub-rows */
const WHO7_SEC_REVISED=["17","18","19"]; /* 139(5) revised / 139(9) defective / 92CD modified -> receipt + orig date */
const WHO7_SEC_NOTICE=["13","14","16","18","20"]; /* 142(1)/148/153C/139(9)/119(2)(b) -> DIN + notice date */
const WHO7_SEC_APA=["19"]; /* 92CD -> advance-pricing-agreement date (NoticeDateUnderSec) */

/* ---- state (guarded seeds; a {} placeholder would short-circuit ||) -------- */
S.who = S.who || {};
(function(W){
  const d=(k,v)=>{if(W[k]===undefined)W[k]=v;};
  d("status","4"); d("substatus",""); d("name",""); d("pan",""); d("doi","");
  d("addr1",""); d("premises",""); d("road",""); d("locality",""); d("city","");
  d("country","91"); d("state",""); d("pin",""); d("zip","");
  d("std",""); d("phone",""); d("mobileCc","91"); d("mobile",""); d("mobile2Cc","91"); d("mobile2","");
  d("email",""); d("email2","");
  d("addr2same","Y"); d("countryb","91");
  d("addr1b",""); d("premisesb",""); d("roadb",""); d("localityb",""); d("cityb","");
  d("stateb",""); d("pinb",""); d("zipb","");
  d("retfurn","139-4A"); d("exsec","11");
  d("projFlg","N"); d("proj",[]); d("reg",[]); d("regothFlg","N"); d("regoth",[]);
  d("sec","11"); d("receipt",""); d("origdate",""); d("din",""); d("noticedate","");
  d("resStatus","RES"); d("domcomp","Y"); d("claim90","NO");
  d("repFlg","N"); d("repName",""); d("repEmail",""); d("repMobileCc","91"); d("repMobile","");
  d("partnerFlg","N"); d("partners",[]);
  d("lei",""); d("leiValid","");
  d("unlistedFlg","N"); d("unlisted",[]);
})(S.who);

S.g2 = S.g2 || {};
(function(G){
  const d=(k,v)=>{if(G[k]===undefined)G[k]=v;};
  d("aud44","N"); d("aud",{}); d("othact","N"); d("othacts",[]);
  d("members",[]); d("authA",[]); d("authB",[]); d("contC",[]); d("relD",[]);
  G.od = G.od || {};
  const o=(k,v)=>{if(G.od[k]===undefined)G.od[k]=v;};
  o("charPurpose","N"); o("act2_15","N"); o("pctTrade",""); o("rend2_15","N"); o("pctRend","");
  o("aggInst",[]);
  o("change","N"); o("changeDate",""); o("freshApplied","N"); o("freshGranted","N"); o("freshDate","");
  o("firstRet","N"); o("prov1310","N"); o("clause15","N"); o("subI","N"); o("subII","N"); o("subSec1","N");
})(S.g2);

/* =====================================================================
   ENGINE — engWho(): identity face, adds nothing to GTI. Publishes the
   cross-section scalars every downstream trust schedule keys on:
   status/entity, the 139(4A-D) return-section and exemption-section (which
   Schedule IE / VC / AI / ER apply), residential status (Schedule FSI/TR/FA),
   the s.90/90A/91 claim flag, and the domestic flag.
   ===================================================================== */
function engWho(){
  const W=S.who||{}, G=S.g2||{};
  const C=S.C.who={ income:0 };
  const status=st0(W.status)||"4";
  const res=(st0(W.resStatus)||"RES")==="RES";
  const isCompany=status==="7";
  const dom=isCompany?((st0(W.domcomp)||"Y")!=="N"):res; /* domestic company gates the RES range */
  C.status=status;                              /* StatusOrCompanyType (4/5/6/7) */
  C.isCompany=isCompany;
  C.isPoliticalParty=st0(W.retfurn)==="139-4B"; /* 139(4B) -> political party (13A) */
  C.returnSection=st0(W.retfurn)||"139-4A";     /* ReturnFurnishedSec (139-4A..4D) */
  C.exemptionSection=st0(W.exsec)||"";          /* SecExemptionClaimed */
  C.exsec=C.exemptionSection;                    /* SEAM: ie/tax read S.C.who.exsec (aligned to the publisher) */
  C.resident=res;
  C.nonResident=!res;
  C.domestic=dom;                               /* -> FSI/TR/FA availability, tax rate */
  C.claim9090A91=(st0(W.claim90)||"NO")==="YES";/* -> Schedule TR / FSI */
  C.heldUnlisted=(st0(W.unlistedFlg)||"N")==="Y";
  C.liableAudit=(st0(G.aud44)||"N")==="Y";      /* -> due-date / Form 10B(BB) path */
  C.firstReturn=(st0((G.od||{}).firstRet)||"N")==="Y";
  C.prov1310=(st0((G.od||{}).prov1310)||"N")==="Y"; /* -> 13(10)/22nd-proviso computation (Schedule at si) */
  C.income=0;
}

/* =====================================================================
   RENDERER — secWho(): every live (non-hidden) row of the PI and Audit
   sheets. Trust/institution identity, registration and filing/exemption
   status, plus the A23-A26 "other details", the A27/A28 audit and the
   A29 governance tables.
   ===================================================================== */
function secWho(){
  const W=S.who, G=S.g2, OD=G.od;
  const india=(st0(W.country)||"91")==="91";
  const indiab=(st0(W.countryb)||"91")==="91";
  const status=st0(W.status)||"4";
  const sec=st0(W.sec);
  let h="";

  h+=note("<b>Who is filing.</b> ITR-7 is the return for a <b>trust / institution</b> (or other body) filing under section 139(4A)/(4B)/(4C)/(4D). This page is the entity's identity, its registrations/approvals and its filing &amp; exemption status; it adds nothing to total income. Every date is <b>DD/MM/YYYY</b>. The A23-A26 &quot;other details&quot; and the A27-A29 audit / governance tables are the <b>PartA_GEN2</b> block, displayed here with the identity face.");

  /* ===================== A1-A3 · Personal information ===================== */
  h+=sub("Personal information (A1-A3)");
  h+=row("A1 · Name (as in the deed of creation / establishing / incorporation / formation)",
    inp("who.name",{max:75}),{req:1,ref:"OrgFirmInfo.AssesseeName.SurNameOrOrgName"});
  h+=row("A2 · Permanent Account Number (PAN)",inp("who.pan",{max:10}),
    {req:1,ref:"OrgFirmInfo.PAN",hint:"the fourth letter denotes the status of the entity"});
  h+=row("A3 · Date of formation / incorporation",dte("who.doi"),
    {req:1,ref:"OrgFirmInfo.DateOFFormOrIncorp",hint:"on or before 31 March 2026"});
  h+=row("Status",sel("who.status",WHO7_STATUS,{blank:false}),
    {req:1,ref:"OrgFirmInfo.StatusOrCompanyType"});
  if(status==="5")
    h+=row("Sub-status",sel("who.substatus",WHO7_SUB5),{ref:"OrgFirmInfo.SubStatus"});
  else if(status==="7")
    h+=row("Sub-status",sel("who.substatus",WHO7_SUB7),{ref:"OrgFirmInfo.SubStatus"});

  /* ===================== A4-A11 · Primary address ===================== */
  h+=sub("Primary address — for communication (A4a-A11a)");
  h+=row("A4a · Flat / Door / Block No",inp("who.addr1",{max:50}),{req:1,ref:"Address.ResidenceNo"});
  h+=row("A5a · Name of premises / building / village",inp("who.premises",{max:50}),{ref:"Address.ResidenceName"});
  h+=row("A6a · Road / Street / Post Office",inp("who.road",{max:50}),{ref:"Address.RoadOrStreet"});
  h+=row("A7a · Area / Locality",inp("who.locality",{max:50}),{req:1,ref:"Address.LocalityOrArea"});
  h+=row("A8a · Town / City / District",inp("who.city",{max:50}),{req:1,ref:"Address.CityOrTownOrDistrict"});
  h+=row("A10a · Country",sel("who.country",WHO7_COUNTRY,{blank:false}),{ref:"Address.CountryCode"});
  if(india){
    h+=row("A9a · State",sel("who.state",WHO7_STATE),{req:1,ref:"Address.StateCode"});
    h+=row("A11a · PIN Code",inp("who.pin",{n:1,max:6}),{ref:"Address.PinCode",hint:"six digits"});
  } else {
    h+=row("A9a · State",sel("who.state",[["99","FOREIGN"]],{blank:false}),{req:1,ref:"Address.StateCode"});
    h+=row("Zip Code",inp("who.zip",{max:10}),{ref:"Address.ZipCode"});
  }

  /* ===================== Secondary address ===================== */
  h+=row("Is the secondary address the same as the primary address?",
    sel("who.addr2same",WHO7_SECADDR,{blank:false}),{req:1,ref:"OrgFirmInfo.SecondaryAdd"});
  if(st0(W.addr2same)==="N"){
    h+=sub("Secondary address (A4b-A9b)");
    h+=row("A4b · Flat / Door / Block No",inp("who.addr1b",{max:50}),{req:1,ref:"AlternateAddress.ResidenceNo"});
    h+=row("Name of premises / building / village",inp("who.premisesb",{max:50}),{ref:"AlternateAddress.ResidenceName"});
    h+=row("A6b · Road / Street / Post Office",inp("who.roadb",{max:50}),{ref:"AlternateAddress.RoadOrStreet"});
    h+=row("Area / Locality",inp("who.localityb",{max:50}),{req:1,ref:"AlternateAddress.LocalityOrArea"});
    h+=row("A8b · Town / City / District",inp("who.cityb",{max:50}),{req:1,ref:"AlternateAddress.CityOrTownOrDistrict"});
    h+=row("Country",sel("who.countryb",WHO7_COUNTRY,{blank:false}),{ref:"AlternateAddress.CountryCode"});
    if(indiab){
      h+=row("A9b · State",sel("who.stateb",WHO7_STATE),{req:1,ref:"AlternateAddress.StateCode"});
      h+=row("PIN Code",inp("who.pinb",{n:1,max:6}),{ref:"AlternateAddress.PinCode"});
    } else {
      h+=row("A9b · State",sel("who.stateb",[["99","FOREIGN"]],{blank:false}),{req:1,ref:"AlternateAddress.StateCode"});
      h+=row("Zip Code",inp("who.zipb",{max:10}),{ref:"AlternateAddress.ZipCode"});
    }
  }

  /* ===================== A13-A16 · Communication ===================== */
  h+=sub("Details for communication (A13-A16)");
  h+=row("A13 · STD code + office phone number",
    inp("who.std",{n:1,max:5,ph:"STD"})+' '+inp("who.phone",{n:1,max:10,ph:"Phone"}),
    {req:1,ref:"Address.Phone.STDcode / PhoneNo"});
  h+=row("A13 · Primary mobile number",
    inp("who.mobileCc",{n:1,max:3,ph:"Code"})+' '+inp("who.mobile",{n:1,max:10,ph:"Mobile"}),
    {req:1,ref:"Address.CountryCodeMobile / MobileNo",hint:"country code 91, then ten digits"});
  h+=row("A14 · Secondary mobile number",
    inp("who.mobile2Cc",{n:1,max:3,ph:"Code"})+' '+inp("who.mobile2",{n:1,max:10,ph:"Mobile"}),
    {ref:"Address.CountryCodeMobileNoSec / MobileNoSec"});
  h+=row("A15 · Primary email ID",inp("who.email",{max:125,ph:"name@example.in"}),
    {req:1,ref:"Address.EmailAddress",hint:"receives the copy of ITR-V"});
  h+=row("A16 · Secondary email ID",inp("who.email2",{max:125}),{ref:"Address.EmailAddressSecondary"});

  /* ===================== A18 · Projects / institutions run ===================== */
  h+=sub("A18 · Projects / institutions run by the assessee");
  h+=row("Whether any project / institution is run by the assessee?",
    sel("who.projFlg",WHO7_YN,{blank:false}),{ref:"ProjectOrInstDtlsFlg"});
  if(st0(W.projFlg)==="Y")
    h+=grid("who.proj",[
      {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
      {h:"Name of the project / institution",k:"name",t:"txt",req:1,max:100},
      {h:"Nature of activity",k:"nature",t:"sel",opts:WHO7_ACTNATURE,req:1},
      {h:"Classification code",k:"cls",t:"sel",opts:WHO7_CLASSCODE,req:1}
    ],W.proj,{min:"760px",add:"Add a project / institution",empty:"No project / institution entered."});

  /* ===================== A19 · Registration under the Income-tax Act ===================== */
  h+=sub("A19 · Registration / provisional registration or approval under the Income-tax Act");
  h+=note("Mandatory for a body claiming exemption. Mark, in the second column, the one registration on which the exemption claimed in <b>this</b> return rests.");
  h+=grid("who.reg",[
    {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
    {h:"Section registered / approved",k:"regsec",t:"sel",opts:WHO7_REGSEC,req:1},
    {h:"Exemption claimed on this?",k:"exclaim",t:"sel",opts:WHO7_REGEXCLAIM,req:1},
    {h:"Date of registration / approval",k:"regdate",t:"date",req:1},
    {h:"Approval / URN No.",k:"urn",t:"txt",req:1,max:30},
    {h:"Approving authority",k:"auth",t:"txt",req:1,max:100},
    {h:"Effective date",k:"effdate",t:"date"}
  ],W.reg,{min:"1040px",add:"Add a registration / approval",empty:"No Income-tax-Act registration entered."});

  /* ===================== A20 · Registration under any other law ===================== */
  h+=sub("A20 · Registration / approval under any law other than the Income-tax Act");
  h+=row("Whether registered / approved under any other law?",
    sel("who.regothFlg",WHO7_YN,{blank:false}),{ref:"—"});
  if(st0(W.regothFlg)==="Y")
    h+=grid("who.regoth",[
      {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
      {h:"Law / Portal",k:"law",t:"sel",opts:WHO7_OTHLAW,req:1},
      {h:"If 'Any other Law', specify",k:"lawdesc",t:"txt",max:100},
      {h:"Date of registration / approval",k:"regdate",t:"date",req:1},
      {h:"Approval / Registration No.",k:"regno",t:"txt",req:1,max:30},
      {h:"Approving authority",k:"auth",t:"txt",req:1,max:100},
      {h:"Effective date",k:"effdate",t:"date"},
      {h:"Valid date",k:"validdate",t:"date"}
    ],W.regoth,{min:"1120px",add:"Add an other-law registration",empty:"No other-law registration entered."});

  /* ===================== A21 / A17 · Filing status ===================== */
  h+=sub("Filing status (A21 / A17)");
  h+=row("A21 a · Return filed u/s / in response to notice u/s",
    sel("who.sec",WHO7_RETSEC),{req:1,ref:"FilingStatus.ReturnFileSec.IncomeTaxSec"});
  if(WHO7_SEC_REVISED.indexOf(sec)>=0){
    h+=row("b · Receipt no. of the original return",inp("who.receipt",{n:1,max:23}),
      {ref:"FilingStatus.ReceiptNo",hint:"for a revised / defective / modified return"});
    h+=row("b · Date of filing of the original return",dte("who.origdate"),{ref:"FilingStatus.OrigRetFiledDate"});
  }
  if(WHO7_SEC_NOTICE.indexOf(sec)>=0)
    h+=row("c · Unique number / DIN",inp("who.din",{max:30}),
      {ref:"FilingStatus.UniqueNumNoticeUs",hint:"notice u/s 139(9)/142(1)/148/153C or order u/s 119(2)(b)"});
  if(WHO7_SEC_NOTICE.indexOf(sec)>=0||WHO7_SEC_APA.indexOf(sec)>=0)
    h+=row(sec==="19"?"c · Date of the advance pricing agreement (u/s 92CD)":"c · Date of such notice or order",
      dte("who.noticedate"),{ref:"FilingStatus.NoticeDateUnderSec"});
  h+=row("A17 i · Return furnished under section",
    sel("who.retfurn",WHO7_RETFURN,{blank:false}),{req:1,ref:"OrgFirmInfo.ReturnFurnishedSec",
    hint:"139(4A) trusts u/s 11-12 · 139(4B) political parties · 139(4C) research/news/10(23C) · 139(4D) universities/colleges"});
  h+=row("A17 ii · Section under which the exemption is claimed",
    sel("who.exsec",WHO7_EXSEC),{req:1,ref:"OrgFirmInfo.SecExemptionClaimed",
    hint:"the utility narrows this list by the 139(4A-D) choice above"});

  /* ===================== d-g · Residential / representative / partner ===================== */
  h+=sub("Residential status and representation (d-g)");
  if(status==="7")
    h+=row("Is the company a domestic company?",sel("who.domcomp",WHO7_YN,{blank:false}),
      {ref:"—",hint:"a domestic company must be resident"});
  h+=row("d · Residential status",sel("who.resStatus",WHO7_RES,{blank:false}),
    {req:1,ref:"FilingStatus.ResidentialStatus"});
  h+=row("e · Any income for which a claim u/s 90 / 90A / 91 has been made?",
    sel("who.claim90",WHO7_YNU),{ref:"FilingStatus.ClaimUS9090A91Flg"});
  h+=row("f · Is this return filed by a representative assessee?",
    sel("who.repFlg",WHO7_YN,{blank:false}),{req:1,ref:"FilingStatus.AsseseeRepFlg"});
  if(st0(W.repFlg)==="Y"){
    h+=row("f · Name of the representative assessee",inp("who.repName",{max:75}),
      {req:1,ref:"AssesseeRep.RepName"});
    h+=row("f · Email-id of the representative",inp("who.repEmail",{max:125}),
      {req:1,ref:"AssesseeRep.RepEmailID"});
    h+=row("f · Contact number of the representative",
      inp("who.repMobileCc",{n:1,max:3,ph:"Code"})+' '+inp("who.repMobile",{n:1,max:10,ph:"Mobile"}),
      {req:1,ref:"AssesseeRep.CountryCodeRepMobileNo / RepMobileNo"});
  }
  h+=row("g · Are you a partner in a firm?",
    sel("who.partnerFlg",WHO7_YN,{blank:false}),{req:1,ref:"FilingStatus.PartnerInFirmFlg"});
  if(st0(W.partnerFlg)==="Y")
    h+=grid("who.partners",[
      {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
      {h:"Name of firm",k:"name",t:"txt",req:1,max:100},
      {h:"PAN",k:"pan",t:"txt",req:1,max:10}
    ],W.partners,{min:"520px",add:"Add a firm",empty:"No firm entered."});

  /* ===================== h · LEI ===================== */
  h+=sub("h · Legal Entity Identifier (LEI)");
  h+=row("LEI number",inp("who.lei",{max:20}),
    {ref:"FilingStatus.LEIDtls.LEINumber",hint:"mandatory when the refund is ₹50 crore or more"});
  h+=row("Valid up to",dte("who.leiValid"),{ref:"FilingStatus.LEIDtls.ValidUptoDate"});

  /* ===================== A22 · Unlisted equity shares ===================== */
  h+=sub("A22 · Unlisted equity shares held during the previous year");
  h+=row("Whether any unlisted equity shares were held at any time during the year?",
    sel("who.unlistedFlg",WHO7_YN,{blank:false}),{req:1,ref:"FilingStatus.HeldUnlistedEqShrPrYrFlg"});
  if(st0(W.unlistedFlg)==="Y")
    h+=grid("who.unlisted",[
      {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
      {h:"Name of company (1a)",k:"co",t:"txt",req:1,max:100},
      {h:"Type (1b)",k:"type",t:"sel",opts:WHO7_UNLCOMP,req:1},
      {h:"PAN (2)",k:"pan",t:"txt",max:10},
      {h:"Opening — no. of shares (3)",k:"obNo",t:"num",req:1},
      {h:"Opening — cost (4)",k:"obCost",t:"num",req:1},
      {h:"Acquired — no. (5)",k:"acqNo",t:"num"},
      {h:"Date of purchase (6)",k:"acqDate",t:"date"},
      {h:"Face value / share",k:"face",t:"num"},
      {h:"Issue price / share",k:"issue",t:"num"},
      {h:"Purchase price / share",k:"purch",t:"num"},
      {h:"Transferred — no.",k:"trNo",t:"num"},
      {h:"Transferred — consideration",k:"trCons",t:"num"},
      {h:"Closing — no. of shares",k:"cbNo",t:"num",req:1},
      {h:"Closing — cost",k:"cbCost",t:"num",req:1}
    ],W.unlisted,{min:"1720px",add:"Add a company",empty:"No unlisted equity shares entered."});

  /* ===================== A23-A26 · Other details (PartA_GEN2.OtherDetailsFor7) ===================== */
  h+=sub("A23-A26 · Other details — section 2(15) test, change in activities, first return, 13(10)");
  h+=note("These rows are shown on the PI sheet, but their schema keys are the <b>PartA_GEN2.OtherDetailsFor7</b> block.");
  h+=row("A23 i · Charitable purpose is advancement of general public utility?",
    sel("g2.od.charPurpose",WHO7_YN_NA,{blank:false}),
    {req:1,ref:"OtherDetailsFor7.OtherDetailsUs2_15.CharitablePurposeOfGeneralPublic"});
  h+=row("A23 ai · Any activity in the nature of trade, commerce or business (proviso to 2(15))?",
    sel("g2.od.act2_15",WHO7_YN),{ref:"...OtherDetailsUs2_15.ActivityNature2_15"});
  if(st0(OD.act2_15)==="Y")
    h+=row("A23 aii · Percentage of receipt from such activity vs total receipts",
      inp("g2.od.pctTrade",{n:1}),{ref:"...OtherDetailsUs2_15.PercntNatureOfTrade"});
  h+=row("A23 bi · Any activity of rendering service in relation to trade, commerce or business?",
    sel("g2.od.rend2_15",WHO7_YN),{ref:"...OtherDetailsUs2_15.ActivityRendering2_15"});
  if(st0(OD.rend2_15)==="Y")
    h+=row("A23 bii · Percentage of receipt from such activity vs total receipts",
      inp("g2.od.pctRend",{n:1}),{ref:"...OtherDetailsUs2_15.PercntAnyTrade"});
  if(st0(OD.act2_15)==="Y"||st0(OD.rend2_15)==="Y"){
    h+=note("A23 ii · If 'a' or 'b' is Yes, the aggregate annual receipts from such activities per institution:");
    h+=grid("g2.od.aggInst",[
      {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
      {h:"Name of the institution",k:"name",t:"txt",req:1,max:100},
      {h:"Aggregate annual receipts",k:"amt",t:"num",req:1}
    ],OD.aggInst,{min:"620px",add:"Add an institution",empty:"No institution entered."});
  }
  h+=row("A24 i · Any change in objects / activities during the year (basis of approval / registration)?",
    sel("g2.od.change",WHO7_YN),{ref:"OtherDetailsFor7.ChangeInActivitiesDuringYr"});
  if(st0(OD.change)==="Y"){
    h+=row("A24 ii A · Date of such change",dte("g2.od.changeDate"),{ref:"OtherDetailsFor7.DateOfChange"});
    h+=row("A24 ii B · Application for fresh registration / provisional registration made?",
      sel("g2.od.freshApplied",WHO7_YN),{ref:"OtherDetailsFor7.FreshRegSec12A"});
    h+=row("A24 ii C · Fresh registration / provisional registration granted u/s 12AB?",
      sel("g2.od.freshGranted",WHO7_YN),{ref:"OtherDetailsFor7.FreshRegGrantedUs12AA"});
    h+=row("A24 ii D · Date of such fresh registration / provisional registration",
      dte("g2.od.freshDate"),{ref:"OtherDetailsFor7.DateOfFreshReg"});
  }
  h+=row("A25 · Is this your first return?",
    sel("g2.od.firstRet",WHO7_YN,{blank:false}),{req:1,ref:"OtherDetailsFor7.FirstReturnFlag"});
  h+=row("A26 · Are the provisions of the twenty-second proviso to 10(23C) or section 13(10) applicable?",
    sel("g2.od.prov1310",WHO7_YN,{blank:false}),{req:1,ref:"OtherDetailsFor7.ProvisionsSec1310Applcbl"});
  if(st0(OD.prov1310)==="Y"){
    h+=row("A26 (a) · Provisions of the proviso to clause (15) of section 2 are applicable",
      sel("g2.od.clause15",WHO7_YN),{ref:"OtherDetailsFor7.Clause15Sec2ProvisioFlag"});
    h+=row("A26 (b) · Conditions in clause (a) of tenth proviso to 10(23C) / sub-clause (i) of 12A(1)(b)",
      sel("g2.od.subI",WHO7_YN),{ref:"OtherDetailsFor7.SubClauseiSec12AViolateFlag"});
    h+=row("A26 (c) · Conditions in clause (b) of tenth proviso to 10(23C) / sub-clause (ii) of 12A(1)(b)",
      sel("g2.od.subII",WHO7_YN),{ref:"OtherDetailsFor7.SubClauseiiSec12AViolateFlag"});
    h+=row("A26 (d) · Conditions in twentieth proviso to 10(23C) / clause (ba) of 12A(1)",
      sel("g2.od.subSec1",WHO7_YN),{ref:"OtherDetailsFor7.SubSec1Sec12AViolateFlag"});
  }

  /* ===================== A27 · Audit under the Income-tax Act ===================== */
  h+=sub("A27 · Audit under the Income-tax Act");
  h+=row("A27 i · Are you liable for audit under the Income-tax Act?",
    sel("g2.aud44",WHO7_YN,{blank:false}),{req:1,ref:"LiableSec44ABflg"});
  if(st0(G.aud44)==="Y"){
    h+=row("A27 ii · Section under which liable for audit",
      sel("g2.aud.sec",WHO7_AUDSEC),{req:1,ref:"AuditDetails[].AuditedSection"});
    if(st0((G.aud||{}).sec)==="Others")
      h+=row("Others section name",inp("g2.aud.othsec",{max:30}),{ref:"AuditDetails[].OtherSectionDesc"});
    h+=row("Whether the accounts have been audited by an accountant?",
      sel("g2.aud.flag",WHO7_YN,{blank:false}),{req:1,ref:"AuditDetails[].AuditFlag"});
    h+=row("a · Name of the auditor (proprietorship / firm)",inp("g2.aud.frmName",{max:125}),{ref:"AuditDetails[].AudFrmName"});
    h+=row("b · PAN of the proprietorship / firm",inp("g2.aud.frmPAN",{max:10}),{ref:"AuditDetails[].AudFrmPAN"});
    h+=row("Aadhaar number of the proprietorship",inp("g2.aud.frmAadhaar",{n:1,max:12}),{ref:"AuditDetails[].AudFrmAadhaar"});
    h+=row("c · Date of furnishing of the audit report",dte("g2.aud.date"),{ref:"AuditDetails[].AuditReportFurnishDate"});
    h+=row("d · Acknowledgement number of the audit report",inp("g2.aud.ack",{n:1,max:20}),{ref:"AuditDetails[].AckNumAudtRpt"});
  }

  /* ===================== A28 · Audit under any other Act ===================== */
  h+=sub("A28 · Audit under any Act other than the Income-tax Act");
  h+=row("A28 i · Liable to audit under any Act other than the Income-tax Act?",
    sel("g2.othact",WHO7_YN,{blank:false}),{req:1,ref:"LiableAnyOthThnINTActflg"});
  if(st0(G.othact)==="Y")
    h+=grid("g2.othacts",[
      {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
      {h:"Act",k:"act",t:"sel",opts:WHO7_AUDACT,req:1},
      {h:"Description (if 'Any other law')",k:"desc",t:"txt",max:100},
      {h:"Section",k:"sec",t:"txt",req:1,max:30},
      {h:"Date",k:"date",t:"date",req:1}
    ],G.othacts,{min:"820px",add:"Add an other-Act audit",empty:"No other-Act audit entered."});

  /* ===================== A29 i · Members in the AOP ===================== */
  h+=fold("who_a29i","A29 i","Members in the AOP on 31 March 2026",
    "Members: "+((G.members||[]).length),
    note("Fill only when the status is AOP/BOI.")+
    grid("g2.members",[
      {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
      {h:"Name",k:"name",t:"txt",req:1,max:100},
      {h:"Address",k:"addr",t:"txt",req:1,max:250},
      {h:"City",k:"city",t:"txt",req:1,max:50},
      {h:"State",k:"state",t:"sel",opts:WHO7_STATE,req:1},
      {h:"Country",k:"country",t:"sel",opts:WHO7_COUNTRY,req:1},
      {h:"PIN",k:"pin",t:"num"},
      {h:"ZIP",k:"zip",t:"txt",max:10},
      {h:"% share (if determinate)",k:"pct",t:"num"},
      {h:"PAN",k:"pan",t:"txt",max:10},
      {h:"Aadhaar",k:"aadhaar",t:"txt",max:12},
      {h:"Status",k:"status",t:"sel",opts:WHO7_MEMSTATUS,req:1}
    ],G.members,{min:"1560px",add:"Add a member",empty:"No AOP member entered."}));

  /* ===================== A29 ii A-D · Authors / founders / contributors ===================== */
  h+=fold("who_a29iiA","A29 ii A","Authors / Founders / Settlors / Trustees etc. (individuals)",
    "Persons: "+((G.authA||[]).length),
    grid("g2.authA",[
      {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
      {h:"Name",k:"name",t:"txt",req:1,max:100},
      {h:"Relation",k:"rel",t:"sel",opts:WHO7_RELATION,req:1},
      {h:"% shareholding (if shareholder)",k:"pct",t:"num",req:1},
      {h:"Resident of India?",k:"res",t:"sel",opts:WHO7_YN,req:1},
      {h:"Type of identification",k:"idtype",t:"sel",opts:WHO7_UIN},
      {h:"Identification number",k:"idno",t:"txt",max:125},
      {h:"Address",k:"addr",t:"txt",req:1,max:250},
      {h:"Mobile number",k:"mob",t:"num",req:1},
      {h:"E-mail address",k:"email",t:"txt",req:1,max:125}
    ],G.authA,{min:"1360px",add:"Add a person",empty:"No author / founder / trustee entered."}));

  h+=fold("who_a29iiB","A29 ii B","Where such a person is not an individual",
    "Persons: "+((G.authB||[]).length),
    grid("g2.authB",[
      {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
      {h:"Name",k:"name",t:"txt",req:1,max:100},
      {h:"Resident of India?",k:"res",t:"sel",opts:WHO7_YN,req:1},
      {h:"Type of identification",k:"idtype",t:"sel",opts:WHO7_UIN},
      {h:"Identification number",k:"idno",t:"txt",max:125},
      {h:"Address",k:"addr",t:"txt",req:1,max:250},
      {h:"% beneficial ownership",k:"pct",t:"num",req:1}
    ],G.authB,{min:"1080px",add:"Add a non-individual person",empty:"No non-individual person entered."}));

  h+=fold("who_a29iiC","A29 ii C","Large contributors u/s 13(3)(b)",
    "Contributors: "+((G.contC||[]).length),
    grid("g2.contC",[
      {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
      {h:"Name",k:"name",t:"txt",req:1,max:100},
      {h:"Address",k:"addr",t:"txt",req:1,max:250},
      {h:"PAN",k:"pan",t:"txt",max:10},
      {h:"Aadhaar",k:"aadhaar",t:"txt",max:12}
    ],G.contC,{min:"820px",add:"Add a contributor",empty:"No large contributor entered."}));

  h+=fold("who_a29iiD","A29 ii D","Relatives / HUF-linked persons",
    "Persons: "+((G.relD||[]).length),
    grid("g2.relD",[
      {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
      {h:"Name",k:"name",t:"txt",req:1,max:100},
      {h:"Address",k:"addr",t:"txt",req:1,max:250},
      {h:"PAN",k:"pan",t:"txt",max:10},
      {h:"Aadhaar",k:"aadhaar",t:"txt",max:12}
    ],G.relD,{min:"820px",add:"Add a relative / HUF-linked person",empty:"No relative / HUF-linked person entered."}));

  return h;
}

/* =====================================================================
   EXPORT — expWho(j): serialise PartA_GEN1 (from S.who) and PartA_GEN2
   (from S.g2) onto j. put()/pf skip empty values; SKEL keeps required
   leaves present at nil. Arrays are JSON arrays. UP = upper-case PAN/LEI.
   ===================================================================== */
function expWho(j){
  const W=S.who||{}, G=S.g2||{}, OD=G.od||{};
  const UP=v=>{v=sv(v);return v?String(v).toUpperCase():undefined;};
  const india=(st0(W.country)||"91")==="91";
  const indiab=(st0(W.countryb)||"91")==="91";
  const status=st0(W.status)||"4";
  const sec=st0(W.sec);

  /* ---------- PartA_GEN1 · OrgFirmInfo ---------- */
  put(j,"PartA_GEN1.OrgFirmInfo.AssesseeName.SurNameOrOrgName",sv(W.name));
  put(j,"PartA_GEN1.OrgFirmInfo.PAN",UP(W.pan));
  put(j,"PartA_GEN1.OrgFirmInfo.DateOFFormOrIncorp",ISO(W.doi));
  put(j,"PartA_GEN1.OrgFirmInfo.StatusOrCompanyType",sv(status));
  if((status==="5"||status==="7")&&sv(W.substatus)) put(j,"PartA_GEN1.OrgFirmInfo.SubStatus",sv(W.substatus));
  /* Address (primary) */
  put(j,"PartA_GEN1.OrgFirmInfo.Address.ResidenceNo",sv(W.addr1));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.ResidenceName",sv(W.premises));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.RoadOrStreet",sv(W.road));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.LocalityOrArea",sv(W.locality));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.CityOrTownOrDistrict",sv(W.city));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.StateCode",sv(india?W.state:"99"));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.CountryCode",sv(W.country||"91"));
  if(india){ if(W.pin) put(j,"PartA_GEN1.OrgFirmInfo.Address.PinCode",R(W.pin)); }
  else if(W.zip) put(j,"PartA_GEN1.OrgFirmInfo.Address.ZipCode",sv(W.zip));
  if(W.std) put(j,"PartA_GEN1.OrgFirmInfo.Address.Phone.STDcode",R(W.std));
  if(W.phone) put(j,"PartA_GEN1.OrgFirmInfo.Address.Phone.PhoneNo",R(W.phone));
  if(W.mobile){ put(j,"PartA_GEN1.OrgFirmInfo.Address.CountryCodeMobile",R(W.mobileCc||91));
                put(j,"PartA_GEN1.OrgFirmInfo.Address.MobileNo",R(W.mobile)); }
  if(W.mobile2){ put(j,"PartA_GEN1.OrgFirmInfo.Address.CountryCodeMobileNoSec",R(W.mobile2Cc||91));
                 put(j,"PartA_GEN1.OrgFirmInfo.Address.MobileNoSec",R(W.mobile2)); }
  put(j,"PartA_GEN1.OrgFirmInfo.Address.EmailAddress",sv(W.email));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.EmailAddressSecondary",sv(W.email2));
  put(j,"PartA_GEN1.OrgFirmInfo.SecondaryAdd",sv(W.addr2same||"Y"));
  if(st0(W.addr2same)==="N"){
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.ResidenceNo",sv(W.addr1b));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.ResidenceName",sv(W.premisesb));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.RoadOrStreet",sv(W.roadb));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.LocalityOrArea",sv(W.localityb));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.CityOrTownOrDistrict",sv(W.cityb));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.StateCode",sv(indiab?W.stateb:"99"));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.CountryCode",sv(W.countryb||"91"));
    if(indiab){ if(W.pinb) put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.PinCode",R(W.pinb)); }
    else if(W.zipb) put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.ZipCode",sv(W.zipb));
  }
  put(j,"PartA_GEN1.OrgFirmInfo.ReturnFurnishedSec",sv(W.retfurn||"139-4A"));
  put(j,"PartA_GEN1.OrgFirmInfo.SecExemptionClaimed",sv(W.exsec));

  /* A18 · projects/institutions */
  put(j,"PartA_GEN1.ProjectOrInstDtlsFlg",sv(W.projFlg||"N"));
  if(st0(W.projFlg)==="Y"){
    const arr=(W.proj||[]).map(r=>{const o={};
      pf(o,"NameOfProjectOrInst",sv(r.name));
      pf(o,"ActivityNature",sv(r.nature));
      pf(o,"ClassificationCode",sv(r.cls));
      return o;}).filter(o=>Object.keys(o).length);
    if(arr.length) put(j,"PartA_GEN1.ProjectOrInstDtls",arr);
  }

  /* A19 · registration under the Income-tax Act */
  {const arr=(W.reg||[]).map(r=>{const o={};
    pf(o,"SectionRegistered",sv(r.regsec));
    pf(o,"RegSecExmpClaimed",sv(r.exclaim));
    pf(o,"RegApprovalDate",ISO(r.regdate));
    pf(o,"ApprovalRegistrationNo",sv(r.urn));
    pf(o,"ApprovingAuthority",sv(r.auth));
    pf(o,"EffectiveDate",ISO(r.effdate));
    return o;}).filter(o=>Object.keys(o).length);
   if(arr.length) put(j,"PartA_GEN1.RegApprUnderITADtls",arr);}

  /* A20 · registration under any other law */
  if(st0(W.regothFlg)==="Y"){const arr=(W.regoth||[]).map(r=>{const o={};
    pf(o,"LawRegistered",sv(r.law));
    pf(o,"OtherLawDesc",sv(r.lawdesc));
    pf(o,"RegApprDate",ISO(r.regdate));
    pf(o,"ApprovalRegistrationNo",sv(r.regno));
    pf(o,"ApprovingAuthority",sv(r.auth));
    pf(o,"EffectiveDate",ISO(r.effdate));
    pf(o,"ValidDate",ISO(r.validdate));
    return o;}).filter(o=>Object.keys(o).length);
   if(arr.length) put(j,"PartA_GEN1.RegApprUnderOthITADtls",arr);}

  /* ---------- PartA_GEN1 · FilingStatus ---------- */
  put(j,"PartA_GEN1.FilingStatus.ReturnFileSec.IncomeTaxSec",R(W.sec||11));
  if(WHO7_SEC_REVISED.indexOf(sec)>=0){
    if(W.receipt) put(j,"PartA_GEN1.FilingStatus.ReceiptNo",R(W.receipt));
    put(j,"PartA_GEN1.FilingStatus.OrigRetFiledDate",ISO(W.origdate));
  }
  if(WHO7_SEC_NOTICE.indexOf(sec)>=0) put(j,"PartA_GEN1.FilingStatus.UniqueNumNoticeUs",sv(W.din));
  if(WHO7_SEC_NOTICE.indexOf(sec)>=0||WHO7_SEC_APA.indexOf(sec)>=0)
    put(j,"PartA_GEN1.FilingStatus.NoticeDateUnderSec",ISO(W.noticedate));
  put(j,"PartA_GEN1.FilingStatus.ResidentialStatus",sv(W.resStatus||"RES"));
  put(j,"PartA_GEN1.FilingStatus.ClaimUS9090A91Flg",sv(W.claim90));
  put(j,"PartA_GEN1.FilingStatus.AsseseeRepFlg",sv(W.repFlg||"N"));
  if(st0(W.repFlg)==="Y"){
    put(j,"PartA_GEN1.FilingStatus.AssesseeRep.RepName",sv(W.repName));
    put(j,"PartA_GEN1.FilingStatus.AssesseeRep.RepEmailID",sv(W.repEmail));
    if(W.repMobile){
      put(j,"PartA_GEN1.FilingStatus.AssesseeRep.CountryCodeRepMobileNo",R(W.repMobileCc||91));
      put(j,"PartA_GEN1.FilingStatus.AssesseeRep.RepMobileNo",R(W.repMobile));
    }
  }
  put(j,"PartA_GEN1.FilingStatus.PartnerInFirmFlg",sv(W.partnerFlg||"N"));
  if(st0(W.partnerFlg)==="Y"){const arr=(W.partners||[]).map(r=>{const o={};
    pf(o,"NameOfFirm",sv(r.name)); pf(o,"PAN",UP(r.pan)); return o;}).filter(o=>Object.keys(o).length);
   if(arr.length) put(j,"PartA_GEN1.FilingStatus.PartnerInFirm.PartnerInFirmDtls",arr);}
  if(W.lei){
    put(j,"PartA_GEN1.FilingStatus.LEIDtls.LEINumber",UP(W.lei));
    put(j,"PartA_GEN1.FilingStatus.LEIDtls.ValidUptoDate",ISO(W.leiValid));
  }
  put(j,"PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYrFlg",sv(W.unlistedFlg||"N"));
  if(st0(W.unlistedFlg)==="Y"){const arr=(W.unlisted||[]).map(r=>{const o={};
    pf(o,"NameOfCompany",sv(r.co));
    pf(o,"CompanyType",sv(r.type));
    pf(o,"PAN",UP(r.pan));
    if(r.obNo!==undefined&&r.obNo!=="") o.OpngBalNumberOfShares=R(r.obNo);
    if(r.obCost!==undefined&&r.obCost!=="") o.OpngBalCostOfAcquisition=N(r.obCost);
    if(r.acqNo!==undefined&&r.acqNo!=="") o.ShrAcqDurYrNumberOfShares=R(r.acqNo);
    pf(o,"DateOfSubscrPurchase",ISO(r.acqDate));
    if(r.face!==undefined&&r.face!=="") o.FaceValuePerShare=N(r.face);
    if(r.issue!==undefined&&r.issue!=="") o.IssuePricePerShare=N(r.issue);
    if(r.purch!==undefined&&r.purch!=="") o.PurchasePricePerShare=N(r.purch);
    if(r.trNo!==undefined&&r.trNo!=="") o.ShrTrnfNumberOfShares=R(r.trNo);
    if(r.trCons!==undefined&&r.trCons!=="") o.ShrTrnfSaleConsideration=N(r.trCons);
    if(r.cbNo!==undefined&&r.cbNo!=="") o.ClsngBalNumberOfShares=R(r.cbNo);
    if(r.cbCost!==undefined&&r.cbCost!=="") o.ClsngBalCostOfAcquisition=N(r.cbCost);
    return o;}).filter(o=>Object.keys(o).length);
   if(arr.length) put(j,"PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls",arr);}

  /* ---------- PartA_GEN2 · OtherDetailsFor7 (rows live on the PI sheet) ---------- */
  put(j,"PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.CharitablePurposeOfGeneralPublic",sv(OD.charPurpose||"N"));
  put(j,"PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.ActivityNature2_15",sv(OD.act2_15));
  if(st0(OD.act2_15)==="Y"&&OD.pctTrade!=="") put(j,"PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.PercntNatureOfTrade",N(OD.pctTrade));
  put(j,"PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.ActivityRendering2_15",sv(OD.rend2_15));
  if(st0(OD.rend2_15)==="Y"&&OD.pctRend!=="") put(j,"PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.PercntAnyTrade",N(OD.pctRend));
  if(st0(OD.act2_15)==="Y"||st0(OD.rend2_15)==="Y"){
    const arr=(OD.aggInst||[]).map(r=>{const o={};
      pf(o,"NameOfTheInstitution",sv(r.name));
      if(r.amt!==undefined&&r.amt!=="") o.AggregateAnnualReceipts=R(r.amt);
      return o;}).filter(o=>Object.keys(o).length);
    if(arr.length) put(j,"PartA_GEN2.OtherDetailsFor7.OtherDetailsUs2_15.AggAnnualRecptsofInst",arr);
  }
  put(j,"PartA_GEN2.OtherDetailsFor7.ChangeInActivitiesDuringYr",sv(OD.change));
  if(st0(OD.change)==="Y"){
    put(j,"PartA_GEN2.OtherDetailsFor7.DateOfChange",ISO(OD.changeDate));
    put(j,"PartA_GEN2.OtherDetailsFor7.FreshRegSec12A",sv(OD.freshApplied));
    put(j,"PartA_GEN2.OtherDetailsFor7.FreshRegGrantedUs12AA",sv(OD.freshGranted));
    put(j,"PartA_GEN2.OtherDetailsFor7.DateOfFreshReg",ISO(OD.freshDate));
  }
  put(j,"PartA_GEN2.OtherDetailsFor7.FirstReturnFlag",sv(OD.firstRet||"N"));
  put(j,"PartA_GEN2.OtherDetailsFor7.ProvisionsSec1310Applcbl",sv(OD.prov1310||"N"));
  if(st0(OD.prov1310)==="Y"){
    put(j,"PartA_GEN2.OtherDetailsFor7.Clause15Sec2ProvisioFlag",sv(OD.clause15));
    put(j,"PartA_GEN2.OtherDetailsFor7.SubClauseiSec12AViolateFlag",sv(OD.subI));
    put(j,"PartA_GEN2.OtherDetailsFor7.SubClauseiiSec12AViolateFlag",sv(OD.subII));
    put(j,"PartA_GEN2.OtherDetailsFor7.SubSec1Sec12AViolateFlag",sv(OD.subSec1));
  }

  /* ---------- PartA_GEN2 · A27 audit under the Income-tax Act ---------- */
  put(j,"PartA_GEN2.LiableSec44ABflg",sv(G.aud44||"N"));
  if(st0(G.aud44)==="Y"){const A=G.aud||{},o={};
    pf(o,"AuditedSection",sv(A.sec));
    if(st0(A.sec)==="Others") pf(o,"OtherSectionDesc",sv(A.othsec));
    pf(o,"AuditFlag",sv(A.flag));
    pf(o,"AudFrmName",sv(A.frmName));
    pf(o,"AudFrmPAN",UP(A.frmPAN));
    pf(o,"AudFrmAadhaar",sv(A.frmAadhaar));
    pf(o,"AuditReportFurnishDate",ISO(A.date));
    if(A.ack!==undefined&&A.ack!=="") o.AckNumAudtRpt=R(A.ack);
    if(Object.keys(o).length) put(j,"PartA_GEN2.AuditDetails",[o]);}

  /* ---------- PartA_GEN2 · A28 audit under any other Act ---------- */
  put(j,"PartA_GEN2.LiableAnyOthThnINTActflg",sv(G.othact||"N"));
  if(st0(G.othact)==="Y"){const arr=(G.othacts||[]).map(r=>{const o={};
    pf(o,"AuditedAct",sv(r.act));
    if(st0(r.act)==="OTH") pf(o,"AuditedActOther",sv(r.desc));
    pf(o,"AuditedSection",sv(r.sec));
    pf(o,"DateOfAudit",ISO(r.date));
    return o;}).filter(o=>Object.keys(o).length);
   if(arr.length) put(j,"PartA_GEN2.LiableAnyOthThnINTActDetails",arr);}

  /* ---------- PartA_GEN2 · A29 i members in the AOP ---------- */
  {const arr=(G.members||[]).map(r=>{const o={};
    pf(o,"PartnerOrMemberName",sv(r.name));
    const a={};
    pf(a,"AddrDetail",sv(r.addr));
    pf(a,"CityOrTownOrDistrict",sv(r.city));
    pf(a,"StateCode",sv(r.state));
    pf(a,"CountryCode",sv(r.country));
    if(r.pin!==undefined&&r.pin!=="") a.PinCode=R(r.pin);
    pf(a,"ZipCode",sv(r.zip));
    if(Object.keys(a).length) o.AddressDetailWithZipCode=a;
    if(r.pct!==undefined&&r.pct!=="") o.SharePercentage=N(r.pct);
    pf(o,"PAN",UP(r.pan));
    pf(o,"AadhaarCardNo",sv(r.aadhaar));
    pf(o,"Status",sv(r.status));
    return o;}).filter(o=>Object.keys(o).length);
   if(arr.length) put(j,"PartA_GEN2.PartnerOrMemberInfo",arr);}

  /* ---------- PartA_GEN2 · A29 ii A authors/founders (individuals) ---------- */
  {const arr=(G.authA||[]).map(r=>{const o={};
    pf(o,"Name",sv(r.name));
    pf(o,"Relation",sv(r.rel));
    if(r.pct!==undefined&&r.pct!=="") o.ShareHoldingPercentage=N(r.pct);
    pf(o,"ResidentOfIndia",sv(r.res));
    pf(o,"UniqueIdentNumber",sv(r.idtype));  /* schema: type code on UniqueIdentNumber */
    pf(o,"IDCode",sv(r.idno));               /* schema: number on IDCode (free text) */
    pf(o,"Address",sv(r.addr));
    if(r.mob!==undefined&&r.mob!=="") o.MobileNo=R(r.mob);
    pf(o,"EmailAddress",sv(r.email));
    return o;}).filter(o=>Object.keys(o).length);
   if(arr.length) put(j,"PartA_GEN2.AuthorFounderDtls5percent",arr);}

  /* ---------- PartA_GEN2 · A29 ii B non-individual such persons ---------- */
  {const arr=(G.authB||[]).map(r=>{const o={};
    pf(o,"Name",sv(r.name));
    pf(o,"ResidentOfIndia",sv(r.res));
    pf(o,"UniqueIdentNumber",sv(r.idtype));
    pf(o,"IDCode",sv(r.idno));
    pf(o,"Address",sv(r.addr));
    if(r.pct!==undefined&&r.pct!=="") o.BeneficialPercentage=N(r.pct);
    return o;}).filter(o=>Object.keys(o).length);
   if(arr.length) put(j,"PartA_GEN2.AuthorFounderDtls5percentNonInd",arr);}

  /* ---------- PartA_GEN2 · A29 ii C large contributors u/s 13(3)(b) ---------- */
  {const arr=(G.contC||[]).map(r=>{const o={};
    pf(o,"Name",sv(r.name)); pf(o,"Address",sv(r.addr));
    pf(o,"PAN",UP(r.pan)); pf(o,"AadhaarCardNo",sv(r.aadhaar));
    return o;}).filter(o=>Object.keys(o).length);
   if(arr.length) put(j,"PartA_GEN2.ContributionUs13_3bDtls",arr);}

  /* ---------- PartA_GEN2 · A29 ii D relatives / HUF-linked ---------- */
  {const arr=(G.relD||[]).map(r=>{const o={};
    pf(o,"Name",sv(r.name)); pf(o,"Address",sv(r.addr));
    pf(o,"PAN",UP(r.pan)); pf(o,"AadhaarCardNo",sv(r.aadhaar));
    return o;}).filter(o=>Object.keys(o).length);
   if(arr.length) put(j,"PartA_GEN2.ContributionHUFDtls",arr);}
}

/* =====================================================================
   IMPORT — impWho(I7): read PartA_GEN1 and PartA_GEN2 back into S.who / S.g2
   so the round-trip (JSON -> import -> export) is identity. Returns labels.
   ===================================================================== */
function impWho(I7){
  const read=[], W=S.who=S.who||{}, G=S.g2=S.g2||{};
  const g1=(I7&&I7.PartA_GEN1)||{}, OI=g1.OrgFirmInfo||{}, AD=OI.Address||{}, AA=OI.AlternateAddress||{}, FS=g1.FilingStatus||{};
  const g2=(I7&&I7.PartA_GEN2)||{}, OD7=g2.OtherDetailsFor7||{}, U15=OD7.OtherDetailsUs2_15||{};

  /* OrgFirmInfo */
  if(OI.AssesseeName&&OI.AssesseeName.SurNameOrOrgName!=null){W.name=OI.AssesseeName.SurNameOrOrgName;read.push("name");}
  if(OI.PAN!=null){W.pan=OI.PAN;read.push("PAN");}
  if(OI.DateOFFormOrIncorp)W.doi=dmy(OI.DateOFFormOrIncorp)||W.doi;
  if(OI.StatusOrCompanyType!=null)W.status=String(OI.StatusOrCompanyType);
  if(OI.SubStatus!=null)W.substatus=OI.SubStatus;
  if(Object.keys(AD).length){
    if(AD.ResidenceNo!=null)W.addr1=AD.ResidenceNo;
    if(AD.ResidenceName!=null)W.premises=AD.ResidenceName;
    if(AD.RoadOrStreet!=null)W.road=AD.RoadOrStreet;
    if(AD.LocalityOrArea!=null)W.locality=AD.LocalityOrArea;
    if(AD.CityOrTownOrDistrict!=null)W.city=AD.CityOrTownOrDistrict;
    if(AD.StateCode!=null)W.state=AD.StateCode;
    if(AD.CountryCode!=null)W.country=String(AD.CountryCode);
    if(AD.PinCode!=null)W.pin=String(AD.PinCode);
    if(AD.ZipCode!=null)W.zip=AD.ZipCode;
    if(AD.Phone){if(AD.Phone.STDcode!=null)W.std=String(AD.Phone.STDcode);
                 if(AD.Phone.PhoneNo!=null)W.phone=String(AD.Phone.PhoneNo);}
    if(AD.CountryCodeMobile!=null)W.mobileCc=String(AD.CountryCodeMobile);
    if(AD.MobileNo!=null)W.mobile=String(AD.MobileNo);
    if(AD.CountryCodeMobileNoSec!=null)W.mobile2Cc=String(AD.CountryCodeMobileNoSec);
    if(AD.MobileNoSec!=null)W.mobile2=String(AD.MobileNoSec);
    if(AD.EmailAddress!=null)W.email=AD.EmailAddress;
    if(AD.EmailAddressSecondary!=null)W.email2=AD.EmailAddressSecondary;
    read.push("address");
  }
  if(OI.SecondaryAdd!=null)W.addr2same=OI.SecondaryAdd;
  if(Object.keys(AA).length){
    if(AA.ResidenceNo!=null)W.addr1b=AA.ResidenceNo;
    if(AA.ResidenceName!=null)W.premisesb=AA.ResidenceName;
    if(AA.RoadOrStreet!=null)W.roadb=AA.RoadOrStreet;
    if(AA.LocalityOrArea!=null)W.localityb=AA.LocalityOrArea;
    if(AA.CityOrTownOrDistrict!=null)W.cityb=AA.CityOrTownOrDistrict;
    if(AA.StateCode!=null)W.stateb=AA.StateCode;
    if(AA.CountryCode!=null)W.countryb=String(AA.CountryCode);
    if(AA.PinCode!=null)W.pinb=String(AA.PinCode);
    if(AA.ZipCode!=null)W.zipb=AA.ZipCode;
    read.push("secondary address");
  }
  if(OI.ReturnFurnishedSec!=null)W.retfurn=OI.ReturnFurnishedSec;
  if(OI.SecExemptionClaimed!=null){W.exsec=OI.SecExemptionClaimed;read.push("exemption section");}
  if(OI.ProjectOrInstDtlsFlg!=null)W.projFlg=OI.ProjectOrInstDtlsFlg;
  if(Array.isArray(g1.ProjectOrInstDtls)){W.projFlg="Y";W.proj=g1.ProjectOrInstDtls.map(x=>({
    name:x.NameOfProjectOrInst,nature:x.ActivityNature,cls:x.ClassificationCode}));read.push("projects");}
  if(Array.isArray(g1.RegApprUnderITADtls)){W.reg=g1.RegApprUnderITADtls.map(x=>({
    regsec:x.SectionRegistered,exclaim:x.RegSecExmpClaimed==null?"":String(x.RegSecExmpClaimed),
    regdate:dmy(x.RegApprovalDate),urn:x.ApprovalRegistrationNo,auth:x.ApprovingAuthority,
    effdate:dmy(x.EffectiveDate)}));read.push("registration");}
  if(Array.isArray(g1.RegApprUnderOthITADtls)){W.regothFlg="Y";W.regoth=g1.RegApprUnderOthITADtls.map(x=>({
    law:x.LawRegistered,lawdesc:x.OtherLawDesc,regdate:dmy(x.RegApprDate),regno:x.ApprovalRegistrationNo,
    auth:x.ApprovingAuthority,effdate:dmy(x.EffectiveDate),validdate:dmy(x.ValidDate)}));}

  /* FilingStatus */
  if(FS.ReturnFileSec&&FS.ReturnFileSec.IncomeTaxSec!=null){W.sec=String(FS.ReturnFileSec.IncomeTaxSec);read.push("filing section");}
  if(FS.ReceiptNo!=null)W.receipt=String(FS.ReceiptNo);
  if(FS.OrigRetFiledDate)W.origdate=dmy(FS.OrigRetFiledDate);
  if(FS.UniqueNumNoticeUs!=null)W.din=FS.UniqueNumNoticeUs;
  if(FS.NoticeDateUnderSec)W.noticedate=dmy(FS.NoticeDateUnderSec);
  if(FS.ResidentialStatus!=null){W.resStatus=FS.ResidentialStatus;read.push("residential status");}
  if(FS.ClaimUS9090A91Flg!=null)W.claim90=FS.ClaimUS9090A91Flg;
  if(FS.AsseseeRepFlg!=null){W.repFlg=FS.AsseseeRepFlg;read.push("representative");}
  if(FS.AssesseeRep){W.repName=FS.AssesseeRep.RepName;W.repEmail=FS.AssesseeRep.RepEmailID;
    if(FS.AssesseeRep.CountryCodeRepMobileNo!=null)W.repMobileCc=String(FS.AssesseeRep.CountryCodeRepMobileNo);
    if(FS.AssesseeRep.RepMobileNo!=null)W.repMobile=String(FS.AssesseeRep.RepMobileNo);}
  if(FS.PartnerInFirmFlg!=null)W.partnerFlg=FS.PartnerInFirmFlg;
  if(FS.PartnerInFirm&&Array.isArray(FS.PartnerInFirm.PartnerInFirmDtls))
    W.partners=FS.PartnerInFirm.PartnerInFirmDtls.map(x=>({name:x.NameOfFirm,pan:x.PAN}));
  if(FS.LEIDtls){W.lei=FS.LEIDtls.LEINumber;if(FS.LEIDtls.ValidUptoDate)W.leiValid=dmy(FS.LEIDtls.ValidUptoDate);read.push("LEI");}
  if(FS.HeldUnlistedEqShrPrYrFlg!=null)W.unlistedFlg=FS.HeldUnlistedEqShrPrYrFlg;
  if(FS.HeldUnlistedEqShrPrYr&&Array.isArray(FS.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls)){
    W.unlisted=FS.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls.map(x=>({
      co:x.NameOfCompany,type:x.CompanyType,pan:x.PAN,
      obNo:x.OpngBalNumberOfShares,obCost:x.OpngBalCostOfAcquisition,acqNo:x.ShrAcqDurYrNumberOfShares,
      acqDate:dmy(x.DateOfSubscrPurchase),face:x.FaceValuePerShare,issue:x.IssuePricePerShare,
      purch:x.PurchasePricePerShare,trNo:x.ShrTrnfNumberOfShares,trCons:x.ShrTrnfSaleConsideration,
      cbNo:x.ClsngBalNumberOfShares,cbCost:x.ClsngBalCostOfAcquisition}));read.push("unlisted shares");}

  /* PartA_GEN2 · OtherDetailsFor7 */
  const OD=G.od=G.od||{};
  if(U15.CharitablePurposeOfGeneralPublic!=null)OD.charPurpose=U15.CharitablePurposeOfGeneralPublic;
  if(U15.ActivityNature2_15!=null)OD.act2_15=U15.ActivityNature2_15;
  if(U15.PercntNatureOfTrade!=null)OD.pctTrade=String(U15.PercntNatureOfTrade);
  if(U15.ActivityRendering2_15!=null)OD.rend2_15=U15.ActivityRendering2_15;
  if(U15.PercntAnyTrade!=null)OD.pctRend=String(U15.PercntAnyTrade);
  if(Array.isArray(U15.AggAnnualRecptsofInst))OD.aggInst=U15.AggAnnualRecptsofInst.map(x=>({
    name:x.NameOfTheInstitution,amt:x.AggregateAnnualReceipts}));
  if(OD7.ChangeInActivitiesDuringYr!=null)OD.change=OD7.ChangeInActivitiesDuringYr;
  if(OD7.DateOfChange)OD.changeDate=dmy(OD7.DateOfChange);
  if(OD7.FreshRegSec12A!=null)OD.freshApplied=OD7.FreshRegSec12A;
  if(OD7.FreshRegGrantedUs12AA!=null)OD.freshGranted=OD7.FreshRegGrantedUs12AA;
  if(OD7.DateOfFreshReg)OD.freshDate=dmy(OD7.DateOfFreshReg);
  if(OD7.FirstReturnFlag!=null){OD.firstRet=OD7.FirstReturnFlag;read.push("first return");}
  if(OD7.ProvisionsSec1310Applcbl!=null)OD.prov1310=OD7.ProvisionsSec1310Applcbl;
  if(OD7.Clause15Sec2ProvisioFlag!=null)OD.clause15=OD7.Clause15Sec2ProvisioFlag;
  if(OD7.SubClauseiSec12AViolateFlag!=null)OD.subI=OD7.SubClauseiSec12AViolateFlag;
  if(OD7.SubClauseiiSec12AViolateFlag!=null)OD.subII=OD7.SubClauseiiSec12AViolateFlag;
  if(OD7.SubSec1Sec12AViolateFlag!=null)OD.subSec1=OD7.SubSec1Sec12AViolateFlag;

  /* PartA_GEN2 · audit + governance */
  if(g2.LiableSec44ABflg!=null){G.aud44=g2.LiableSec44ABflg;read.push("audit");}
  if(Array.isArray(g2.AuditDetails)&&g2.AuditDetails[0]){const a=g2.AuditDetails[0];
    G.aud={sec:a.AuditedSection,othsec:a.OtherSectionDesc,flag:a.AuditFlag,frmName:a.AudFrmName,
      frmPAN:a.AudFrmPAN,frmAadhaar:a.AudFrmAadhaar,date:dmy(a.AuditReportFurnishDate),
      ack:a.AckNumAudtRpt==null?"":String(a.AckNumAudtRpt)};}
  if(g2.LiableAnyOthThnINTActflg!=null)G.othact=g2.LiableAnyOthThnINTActflg;
  if(Array.isArray(g2.LiableAnyOthThnINTActDetails))G.othacts=g2.LiableAnyOthThnINTActDetails.map(x=>({
    act:x.AuditedAct,desc:x.AuditedActOther,sec:x.AuditedSection,date:dmy(x.DateOfAudit)}));
  if(Array.isArray(g2.PartnerOrMemberInfo))G.members=g2.PartnerOrMemberInfo.map(x=>{const a=x.AddressDetailWithZipCode||{};
    return {name:x.PartnerOrMemberName,addr:a.AddrDetail,city:a.CityOrTownOrDistrict,state:a.StateCode,
      country:a.CountryCode==null?"":String(a.CountryCode),pin:a.PinCode==null?"":String(a.PinCode),zip:a.ZipCode,
      pct:x.SharePercentage,pan:x.PAN,aadhaar:x.AadhaarCardNo,status:x.Status};});
  if(Array.isArray(g2.AuthorFounderDtls5percent))G.authA=g2.AuthorFounderDtls5percent.map(x=>({
    name:x.Name,rel:x.Relation==null?"":String(x.Relation),pct:x.ShareHoldingPercentage,res:x.ResidentOfIndia,
    idtype:x.UniqueIdentNumber,idno:x.IDCode,addr:x.Address,mob:x.MobileNo,email:x.EmailAddress}));
  if(Array.isArray(g2.AuthorFounderDtls5percentNonInd))G.authB=g2.AuthorFounderDtls5percentNonInd.map(x=>({
    name:x.Name,res:x.ResidentOfIndia,idtype:x.UniqueIdentNumber,idno:x.IDCode,addr:x.Address,pct:x.BeneficialPercentage}));
  if(Array.isArray(g2.ContributionUs13_3bDtls))G.contC=g2.ContributionUs13_3bDtls.map(x=>({
    name:x.Name,addr:x.Address,pan:x.PAN,aadhaar:x.AadhaarCardNo}));
  if(Array.isArray(g2.ContributionHUFDtls))G.relD=g2.ContributionHUFDtls.map(x=>({
    name:x.Name,addr:x.Address,pan:x.PAN,aadhaar:x.AadhaarCardNo}));
  return read;
}

/* =====================================================================
   CHECKS — chkWho(): the identity / filing-face rules as live messages.
   Department rules (rules.json) are Phase 6; here only this screen's own
   mandatory / format / consistency validations.
   ===================================================================== */
function chkWho(){
  const out=[], W=S.who||{}, G=S.g2||{}, OD=G.od||{};
  const status=st0(W.status)||"4";
  /* name / PAN / date */
  if(!st0(W.name)) out.push({lvl:"err",t:"Name required",m:"Enter the name of the entity as in its deed of creation / incorporation.",sec:"who"});
  const pan=st0(W.pan).toUpperCase();
  if(!pan) out.push({lvl:"err",t:"PAN required",m:"Enter the PAN of the entity.",sec:"who"});
  else if(!PAN_RE.test(pan)) out.push({lvl:"err",t:"PAN not valid",m:"The PAN must be five letters, four digits and a letter.",sec:"who"});
  const doi=D(W.doi);
  if(!doi) out.push({lvl:"err",t:"Date of formation required",m:"Enter the date of formation / incorporation in DD/MM/YYYY.",sec:"who"});
  else if(doi>YREND) out.push({lvl:"err",t:"Date of formation",m:"The date must be on or before 31 March 2026.",sec:"who"});
  if(!st0(W.status)) out.push({lvl:"err",t:"Status required",m:"Select the status of the entity.",sec:"who"});
  /* primary address */
  if(!st0(W.addr1)) out.push({lvl:"err",t:"Address required",m:"Flat / Door / Block No is mandatory.",sec:"who"});
  if(!st0(W.locality)) out.push({lvl:"err",t:"Address required",m:"Area / locality is mandatory.",sec:"who"});
  if(!st0(W.city)) out.push({lvl:"err",t:"Address required",m:"Town / City / District is mandatory.",sec:"who"});
  if((st0(W.country)||"91")==="91"&&!st0(W.state)) out.push({lvl:"err",t:"State required",m:"Select the state.",sec:"who"});
  if((st0(W.country)||"91")==="91"&&st0(W.pin)&&!/^\d{6}$/.test(st0(W.pin)))
    out.push({lvl:"err",t:"PIN code",m:"The PIN code must be six digits.",sec:"who"});
  /* communication */
  if(!st0(W.std)||!st0(W.phone)) out.push({lvl:"err",t:"Phone required",m:"The STD code and office phone number are mandatory.",sec:"who"});
  if(!st0(W.mobile)) out.push({lvl:"err",t:"Mobile required",m:"The primary mobile number is mandatory.",sec:"who"});
  else if((st0(W.country)||"91")==="91"&&!/^\d{10}$/.test(st0(W.mobile))) out.push({lvl:"warn",t:"Mobile number",m:"With country India the mobile number should be ten digits.",sec:"who"});
  if(!st0(W.email)) out.push({lvl:"err",t:"Email required",m:"The primary email is mandatory — it receives the copy of ITR-V.",sec:"who"});
  else if(!MAIL.test(st0(W.email))) out.push({lvl:"err",t:"Email not valid",m:"Enter a valid primary email address.",sec:"who"});
  /* secondary address distinct */
  if(st0(W.addr2same)==="N"){
    if(!st0(W.addr1b)||!st0(W.localityb)||!st0(W.cityb))
      out.push({lvl:"err",t:"Secondary address required",m:"The secondary address is not the same as the primary — its Flat/Door, locality and town are mandatory.",sec:"who"});
  }
  /* filing / exemption */
  if(!st0(W.sec)) out.push({lvl:"err",t:"Filing section required",m:"Select the section under which the return is filed.",sec:"who"});
  if(!st0(W.retfurn)) out.push({lvl:"err",t:"139(4A-D) section required",m:"Select the section under which the return is furnished.",sec:"who"});
  if(!st0(W.exsec)) out.push({lvl:"err",t:"Exemption section required",m:"Select the section under which the exemption is claimed.",sec:"who"});
  /* A19 registration is the spine of exemption */
  if(!(W.reg||[]).some(r=>st0(r.regsec)))
    out.push({lvl:"warn",t:"No registration entered",m:"A19 registration/approval under the Income-tax Act is mandatory for an exemption-claiming body.",sec:"who"});
  if((W.reg||[]).filter(r=>st0(r.exclaim)==="true").length>1)
    out.push({lvl:"warn",t:"More than one registration marked",m:"Only one A19 registration should be marked as the one on which the exemption in this return rests.",sec:"who"});
  /* residential status */
  if(!st0(W.resStatus)) out.push({lvl:"err",t:"Residential status required",m:"Select the residential status.",sec:"who"});
  else if(status==="7"&&st0(W.domcomp)!=="N"&&W.resStatus==="NRI")
    out.push({lvl:"warn",t:"Domestic company but non-resident",m:"A domestic company cannot be a non-resident — reconcile the domestic flag with the residential status.",sec:"who"});
  /* representative / partner / unlisted */
  if(st0(W.repFlg)==="Y"&&(!st0(W.repName)||!st0(W.repEmail)||!st0(W.repMobile)))
    out.push({lvl:"err",t:"Representative details required",m:"Furnish the representative's name, email and contact number.",sec:"who"});
  if(st0(W.partnerFlg)==="Y"&&!(W.partners||[]).some(r=>st0(r.name)))
    out.push({lvl:"err",t:"Firm details required",m:"You marked partner-in-a-firm — furnish the firm name and PAN.",sec:"who"});
  /* A25/A26 required flags */
  if(!st0(OD.firstRet)) out.push({lvl:"err",t:"A25 first-return flag required",m:"State whether this is your first return.",sec:"who"});
  if(!st0(OD.prov1310)) out.push({lvl:"err",t:"A26 flag required",m:"State whether the 22nd proviso to 10(23C) / section 13(10) applies.",sec:"who"});
  if(!st0(OD.charPurpose)) out.push({lvl:"err",t:"A23 flag required",m:"State whether a charitable purpose is advancement of general public utility.",sec:"who"});
  /* audit */
  if(!st0(G.aud44)) out.push({lvl:"err",t:"A27 audit flag required",m:"State whether you are liable for audit under the Income-tax Act.",sec:"who"});
  else if(st0(G.aud44)==="Y"&&!st0((G.aud||{}).sec))
    out.push({lvl:"err",t:"Audit section required",m:"Select the section under which you are liable for audit.",sec:"who"});
  if(st0(G.othact)==="Y"&&!(G.othacts||[]).some(r=>st0(r.act)))
    out.push({lvl:"err",t:"Other-Act audit required",m:"You marked liable to audit under another Act — furnish the Act, section and date.",sec:"who"});
  /* summary */
  const STLAB={"4":"Local Authority","5":"AOP/BOI","6":"AJP","7":"Company"};
  if(!out.some(x=>x.lvl==="err"))
    out.push({lvl:"ok",t:"Who is filing",m:(st0(W.name)||"Entity")+(pan?" · "+pan:"")+" · "+(STLAB[status]||status)+" · u/s "+(WHO7_RETFURN.find(x=>x[0]===st0(W.retfurn))||[,st0(W.retfurn)])[1]+".",sec:"who"});
  return out;
}

/* ---- register (overrides the boot stub) --------------------------- */
reg({id:"who", t:"Who is filing", ref:"Part A - General · PI · Audit",
     f:secWho,
     s:()=>{const W=S.who||{};const STLAB={"4":"Local Authority","5":"AOP/BOI","6":"AJP","7":"Company"};
       return st0(W.pan)?st0(W.pan).toUpperCase()+" · "+(STLAB[st0(W.status)]||"")+" · "+st0(W.retfurn):"Name, PAN, status, registration";},
     eng:engWho, exp:expWho, imp:impWho, chk:chkWho, order:10, corder:10});
