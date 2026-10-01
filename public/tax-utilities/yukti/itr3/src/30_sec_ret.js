/* =====================================================================
   ITR-3 · Section "ret" — Return and regime (Part A - General)
   Screen ref: Part A - General · compute order 6.
   Owns schema blocks PartA_GEN1 (PersonalInfo + FilingStatus) and
   PartA_GEN2 (AuditInfo + NatOfBus). Built ONLY from
   books/ITR-3/PART_A_General.md and books/ITR-3/REGIME.md — every label,
   code, dropdown value and rule is the department's own, quoted from the
   sheet/book. Personal-identity fields (name/PAN/address) are collected by
   the "who" screen into S.pi; this section renders the return/regime/audit
   face, and exports/imports BOTH GEN blocks from S.pi / S.fs / S.decl /
   S.aud / S.nob.

   Part A - General carries NO income head: S.C.ret.income = 0 (nothing
   rolls into Gross Total Income from here). Regime (isNew()) here is the
   *mechanism* (Form 10-IEA opt-out), not a closed income item — so there is
   no cell(0) closure to build; the regime effect on this screen is the
   New-vs-Old comparison and the 10-IEA acknowledgement rows that open only
   when a business filer opts for the old regime.
   ===================================================================== */

/* ---- state (seed only what is absent; never clobber the "who" screen) --- */
S.pi = S.pi || {};
if(S.pi.status===undefined) S.pi.status="I";
if(S.pi.country===undefined)S.pi.country="91";
if(S.pi.addr2same===undefined)S.pi.addr2same="Y";
S.pi.dirco = S.pi.dirco || [];   /* FilingStatus.CompDirectorPrvYr...Dtls[]  (rows 122-126) */
S.pi.firms = S.pi.firms || [];   /* FilingStatus.PartnerInFirm.PartnerInFirmDtls[] (rows 128-131) */
S.pi.unlco = S.pi.unlco || [];   /* FilingStatus.HeldUnlistedEqShrPrYr...Dtls[] (rows 133-138) */

S.fs = S.fs || {};
if(S.fs.optout===undefined) S.fs.optout="No";              /* master switch → isNew() */
if(S.fs.sec===undefined)    S.fs.sec=11;                   /* FilingStatus.ReturnFileSec (11 = 139(1)) */
if(S.fs.filed===undefined)  S.fs.filed="";
if(S.fs.incBP===undefined)  S.fs.incBP="Y";               /* FilingStatus.IncFrmBusOrProf (A19(b)) */
if(S.fs.resStatus===undefined)S.fs.resStatus="RES";        /* FilingStatus.ResidentialStatus */
S.fs.jur = S.fs.jur || [];                                 /* FilingStatus.JurisdictionResPrevYr.JurisdictionResPrevYrDtls[] (rows 37-40) */
/* fs.resCond / fs.stayPY / fs.stay4Yr (rows 36,43,44) and the 10-IEA new-regime
   re-entry flags (fs.f10ieaNew*, rows 63-78) are left UNSEEDED — a resident
   leaves them empty so expWho emits nothing new and the round-trip is unchanged. */
if(S.fs.duedate===undefined)S.fs.duedate="2026-10-31";     /* FilingStatus.ItrFilingDueDate */
if(S.fs.seventh===undefined)S.fs.seventh="N";              /* FilingStatus.SeventhProvisio139 */
if(S.fs.foreignExch===undefined)S.fs.foreignExch="N";      /* FilingStatus.ForeignExchangeFlag */
if(S.fs.fpi===undefined)    S.fs.fpi="N";                  /* FilingStatus.FiiFpiFlag */
if(S.fs.nriPE===undefined)  S.fs.nriPE="N";
if(S.fs.nriSEP===undefined) S.fs.nriSEP="N";
if(S.fs.ifsc===undefined)   S.fs.ifsc="N";
if(S.fs.b115H===undefined)  S.fs.b115H="N";
if(S.fs.rep===undefined)    S.fs.rep="N";                  /* FilingStatus.AsseseeRepFlg */
if(S.fs.dir===undefined)    S.fs.dir="N";                  /* FilingStatus.CompDirectorPrvYrFlg */
if(S.fs.partner===undefined)S.fs.partner="N";              /* FilingStatus.PartnerInFirmFlg */
if(S.fs.unl===undefined)    S.fs.unl="N";                  /* FilingStatus.HeldUnlistedEqShrPrYrFlg */

S.decl = S.decl || {};                                     /* Seventh proviso to 139(1) */
if(S.decl.flag===undefined) S.decl.flag="N";
S.decl.c4 = S.decl.c4 || [];                               /* clauseiv7provisio139iDtls[] */

S.aud = S.aud || {};                                       /* PartA_GEN2 · AuditInfo */
if(S.aud.sec44AA===undefined)  S.aud.sec44AA="N";          /* LiableSec44AAflg */
if(S.aud.incDclrdUs===undefined)S.aud.incDclrdUs="N";      /* IncDclrdUs (a2) */
if(S.aud.sec44AB===undefined)  S.aud.sec44AB="N";          /* LiableSec44ABflg (b) */
if(S.aud.acctFlg===undefined)  S.aud.acctFlg="N";          /* AuditAccountantFlg (c) */
if(S.aud.sec92E===undefined)   S.aud.sec92E="N";           /* LiableSec92Eflg (d(i)) */
if(S.aud.acct92E===undefined)  S.aud.acct92E="N";          /* AccountAuditFlag (d(ii)) */
S.aud.oth = S.aud.oth || [];                               /* AuditInfo.AuditDetails[] (rows 177-184) */
S.aud.act = S.aud.act || [];                               /* AuditInfo.AuditReportDetails[] (rows 189-193) */

S.nob = S.nob || [];                                       /* NatOfBus.NatureOfBusiness[] */

/* SEED — default grid rows (per the task contract). The shell's add-row
   handler carries its own seeds for pi.dirco/pi.unlco/pi.firms/decl.c4;
   these cover this section's own grids. */
SEED["fs.jur"]=SEED["fs.jur"]||{country:"",tin:""};
SEED["aud.oth"]=SEED["aud.oth"]||{sec:"10AA",flag:"Y"};
SEED["aud.act"]=SEED["aud.act"]||{act:"6"};
SEED.nob=SEED.nob||{};

/* ---- code tables (from books/ITR-3/enums.json, verbatim) ---- */
const RET_SEC=[["11","139(1)- On or Before due date"],["12","139(4)- After due date"],
  ["13","142(1)"],["14","148"],["16","153C"],["17","139(5)- Revised Return"],
  ["18","139(9)"],["19","92CD-Modified return"],["20","119(2)(b)-After condonation of delay"],
  ["21","139(8A)-Updated Return"]];
const RES_STAT=[["RES","RES - Resident"],["NRI","NRI - NonResident"],["NOR","NOR - Resident but not Ordinarily Resident"]];
/* Conditions for residential status (row 36 / W36 · ConditionsResStatus, enum 1-9).
   The utility chooses the option list by the first three letters of the status
   (W36 = IF(MID(ResidentialStatus1,1,3)="RES",Resident_Dropdown, ...NOR...NRI...)).
   Codes and full text quoted from DropDownValues cols T (Resident), U (NOR),
   V (NRI); the codes are the schema enum values. */
const COND_TXT={
  "1":"You were in India for 182 days or more during the previous year [section 6(1)(a)]",
  "2":"You were in India for 60 days or more during the previous year, and have been in India for 365 days or more within the 4 preceding years [section (6)(1)(c)] [where Explanation 1 is not applicable]",
  "3":"You have been a non-resident in India in 9 out of 10 preceding years [section 6(6)(a)]",
  "4":"You have been in India for 729 days or less during the 7 preceding years [section 6(6)(a)]",
  "5":"You were a non-resident during the previous year.",
  "6":"You are a citizen of India or person of Indian origin, who comes on a visit to India, having total income, other than the income from foreign sources, exceeding Rs. 15 lakh and have been in India for 120 days or more but less than 182 days during the previous year [section 6(6)(c)]",
  "7":"You are a citizen of India having total income, other than the income from foreign sources, exceeding Rs. 15 lakh during the previous year and not liable to tax in any other country or territory by reason of your domicile or residence or any other criteria of similar nature [section 6(6)(d) read with section 6(1A)]",
  "8":"You are a citizen of India, who left India, for the purpose of employment, as a member of the crew of an Indian ship and were in India for 182 days or more during the previous year and 365 days or more within the preceding 4 years [Explanation 1(a) of section (6)(1)(c)]",
  "9":"You are a citizen of India or a person of Indian origin and have come on a visit to India during the previous year and were in India for a) 182 days or more during the previous year and 365 days or more within the preceding 4 years; or b) 120 days or more during the previous year and 365 days or more within the preceding 4 years if the total income, other than income from foreign sources, exceeds Rs. 15 lakh. [Explanation 1(b) of section (6)(1)(c)]"};
const RES_COND_RES=[["1",COND_TXT["1"]],["2",COND_TXT["2"]],["8",COND_TXT["8"]],["9",COND_TXT["9"]]]; /* col T */
const RES_COND_NOR=[["3",COND_TXT["3"]],["4",COND_TXT["4"]],["6",COND_TXT["6"]],["7",COND_TXT["7"]]]; /* col U */
const RES_COND_NRI=[["5",COND_TXT["5"]]];                                                             /* col V */
const POI_COND=["6","7","8","9"];   /* citizen/POI conditions → days-of-stay rows 43-44 (row 42 header) */
const NEW_AY=[["2024-25","2024-25"],["2025-26","2025-26"]];  /* AY of an earlier Form 10-IEA */
/* Jurisdiction(s) of residence (rows 37-40 · JurisdictionResidence, source
   "Country_NoIndia" — India excluded, plus 9998 "Not Applicable"). Codes are the
   schema enum values; labels taken from the vetted Schedule-FA country list
   (the enums.json label column for this leaf is corrupted). */
const RES_JUR=[["93","AFGHANISTAN"],["1001","ALAND ISLANDS"],["355","ALBANIA"],["213","ALGERIA"],["684","AMERICAN SAMOA"],["376","ANDORRA"],["244","ANGOLA"],["1264","ANGUILLA"],["1010","ANTARCTICA"],["1268","ANTIGUA AND BARBUDA"],["54","ARGENTINA"],["374","ARMENIA"],["297","ARUBA"],["61","AUSTRALIA"],["43","AUSTRIA"],["994","AZERBAIJAN"],["1242","BAHAMAS"],["973","BAHRAIN"],["880","BANGLADESH"],["1246","BARBADOS"],["375","BELARUS"],["32","BELGIUM"],["501","BELIZE"],["229","BENIN"],["1441","BERMUDA"],["975","BHUTAN"],["591","BOLIVIA (PLURINATIONAL STATE OF)"],["1002","BONAIRE, SINT EUSTATIUS AND SABA"],["387","BOSNIA AND HERZEGOVINA"],["267","BOTSWANA"],["1003","BOUVET ISLAND"],["55","BRAZIL"],["1014","BRITISH INDIAN OCEAN TERRITORY"],["673","BRUNEI DARUSSALAM"],["359","BULGARIA"],["226","BURKINA FASO"],["257","BURUNDI"],["238","CABO VERDE"],["855","CAMBODIA"],["237","CAMEROON"],["1","CANADA"],["1345","CAYMAN ISLANDS"],["236","CENTRAL AFRICAN REPUBLIC"],["235","CHAD"],["56","CHILE"],["86","CHINA"],["9","CHRISTMAS ISLAND"],["672","COCOS (KEELING) ISLANDS"],["57","COLOMBIA"],["270","COMOROS"],["242","CONGO"],["243","CONGO (DEMOCRATIC REPUBLIC OF THE)"],["682","COOK ISLANDS"],["506","COSTA RICA"],["225","COTE DIVOIRE"],["385","CROATIA"],["53","CUBA"],["1015","CURACAO"],["357","CYPRUS"],["420","CZECHIA"],["45","DENMARK"],["253","DJIBOUTI"],["1767","DOMINICA"],["1809","DOMINICAN REPUBLIC"],["593","ECUADOR"],["20","EGYPT"],["503","EL SALVADOR"],["240","EQUATORIAL GUINEA"],["291","ERITREA"],["372","ESTONIA"],["251","ETHIOPIA"],["500","FALKLAND ISLANDS (MALVINAS)"],["298","FAROE ISLANDS"],["679","FIJI"],["358","FINLAND"],["33","FRANCE"],["594","FRENCH GUIANA"],["689","FRENCH POLYNESIA"],["1004","FRENCH SOUTHERN TERRITORIES"],["241","GABON"],["220","GAMBIA"],["995","GEORGIA"],["49","GERMANY"],["233","GHANA"],["350","GIBRALTAR"],["30","GREECE"],["299","GREENLAND"],["1473","GRENADA"],["590","GUADELOUPE"],["1671","GUAM"],["502","GUATEMALA"],["1481","GUERNSEY"],["224","GUINEA"],["245","GUINEA-BISSAU"],["592","GUYANA"],["509","HAITI"],["1005","HEARD ISLAND AND MCDONALD ISLANDS"],["6","HOLY SEE"],["504","HONDURAS"],["852","HONG KONG"],["36","HUNGARY"],["354","ICELAND"],["62","INDONESIA"],["98","IRAN (ISLAMIC REPUBLIC OF)"],["964","IRAQ"],["353","IRELAND"],["1624","ISLE OF MAN"],["972","ISRAEL"],["5","ITALY"],["1876","JAMAICA"],["81","JAPAN"],["1534","JERSEY"],["962","JORDAN"],["7","KAZAKHSTAN"],["254","KENYA"],["686","KIRIBATI"],["850","KOREA (DEMOCRATIC PEOPLES REPUBLIC OF)"],["82","KOREA (REPUBLIC OF)"],["965","KUWAIT"],["996","KYRGYZSTAN"],["856","LAO PEOPLES DEMOCRATIC REPUBLIC"],["371","LATVIA"],["961","LEBANON"],["266","LESOTHO"],["231","LIBERIA"],["218","LIBYA"],["423","LIECHTENSTEIN"],["370","LITHUANIA"],["352","LUXEMBOURG"],["853","MACAO"],["389","MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)"],["261","MADAGASCAR"],["265","MALAWI"],["60","MALAYSIA"],["960","MALDIVES"],["223","MALI"],["356","MALTA"],["692","MARSHALL ISLANDS"],["596","MARTINIQUE"],["222","MAURITANIA"],["230","MAURITIUS"],["269","MAYOTTE"],["52","MEXICO"],["691","MICRONESIA (FEDERATED STATES OF)"],["373","MOLDOVA (REPUBLIC OF)"],["377","MONACO"],["976","MONGOLIA"],["382","MONTENEGRO"],["1664","MONTSERRAT"],["212","MOROCCO"],["258","MOZAMBIQUE"],["95","MYANMAR"],["264","NAMIBIA"],["674","NAURU"],["977","NEPAL"],["31","NETHERLANDS"],["687","NEW CALEDONIA"],["64","NEW ZEALAND"],["505","NICARAGUA"],["227","NIGER"],["234","NIGERIA"],["683","NIUE"],["15","NORFOLK ISLAND"],["1670","NORTHERN MARIANA ISLANDS"],["47","NORWAY"],["968","OMAN"],["92","PAKISTAN"],["680","PALAU"],["970","PALESTINE, STATE OF"],["507","PANAMA"],["675","PAPUA NEW GUINEA"],["595","PARAGUAY"],["51","PERU"],["63","PHILIPPINES"],["1011","PITCAIRN"],["48","POLAND"],["14","PORTUGAL"],["1787","PUERTO RICO"],["974","QATAR"],["262","REUNION"],["40","ROMANIA"],["8","RUSSIAN FEDERATION"],["250","RWANDA"],["1006","SAINT BARTHELEMY"],["290","SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA"],["1869","SAINT KITTS AND NEVIS"],["1758","SAINT LUCIA"],["1007","SAINT MARTIN (FRENCH PART)"],["508","SAINT PIERRE AND MIQUELON"],["1784","SAINT VINCENT AND THE GRENADINES"],["685","SAMOA"],["378","SAN MARINO"],["239","SAO TOME AND PRINCIPE"],["966","SAUDI ARABIA"],["221","SENEGAL"],["381","SERBIA"],["248","SEYCHELLES"],["232","SIERRA LEONE"],["65","SINGAPORE"],["1721","SINT MAARTEN (DUTCH PART)"],["421","SLOVAKIA"],["386","SLOVENIA"],["677","SOLOMON ISLANDS"],["252","SOMALIA"],["28","SOUTH AFRICA"],["1008","SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS"],["211","SOUTH SUDAN"],["35","SPAIN"],["94","SRI LANKA"],["249","SUDAN"],["597","SURINAME"],["1012","SVALBARD AND JAN MAYEN"],["268","SWAZILAND"],["46","SWEDEN"],["41","SWITZERLAND"],["963","SYRIAN ARAB REPUBLIC"],["886","TAIWAN, PROVINCE OF CHINA[A]"],["992","TAJIKISTAN"],["255","TANZANIA, UNITED REPUBLIC OF"],["66","THAILAND"],["670","TIMOR-LESTE (EAST TIMOR)"],["228","TOGO"],["690","TOKELAU"],["676","TONGA"],["1868","TRINIDAD AND TOBAGO"],["216","TUNISIA"],["90","TURKEY"],["993","TURKMENISTAN"],["1649","TURKS AND CAICOS ISLANDS"],["688","TUVALU"],["256","UGANDA"],["380","UKRAINE"],["971","UNITED ARAB EMIRATES"],["44","UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND"],["2","UNITED STATES OF AMERICA"],["1009","UNITED STATES MINOR OUTLYING ISLANDS"],["598","URUGUAY"],["998","UZBEKISTAN"],["678","VANUATU"],["58","VENEZUELA (BOLIVARIAN REPUBLIC OF)"],["84","VIET NAM"],["1284","VIRGIN ISLANDS (BRITISH)"],["1340","VIRGIN ISLANDS (U.S.)"],["681","WALLIS AND FUTUNA"],["1013","WESTERN SAHARA"],["967","YEMEN"],["260","ZAMBIA"],["263","ZIMBABWE"],["9999","OTHERS"],["9998","Not Applicable (Not Resident in any Country)"]];
const DUE_DATES=[["2026-08-31","31/08/2026"],["2026-10-31","31/10/2026"],["2026-11-30","30/11/2026"]];
const YN=[["Y","Yes"],["N","No"]];
const YN_NA=[["Y","Yes"],["N","No"],["NA","Not Applicable"]];
const CO_TYPE=[["D","Domestic"],["F","Foreign"]];
const SHARE_TYPE=[["L","Listed"],["U","Unlisted"]];
const CLAUSEIV=[
  ["1","total sales, turnover or gross receipts in the business exceeds sixty lakh rupees during the previous year"],
  ["2","the total gross receipts in profession exceeds ten lakh rupees during the previous year"],
  ["3","the aggregate of TDS and TCS during the previous year is twenty-five thousand rupees or more"],
  ["4","total deposits in one or more savings bank accounts is fifty lakh rupees or more in the previous year"]];
const SALES_BAND=[["Upto1CR","Up to Rs. 1 crore"],["Upto10CR","More than Rs. 1 crore and up to Rs. 10 crores"],["MoreThan10CR","More than Rs. 10 crores"]];
const PCT_BAND=[["Upto5Per","Up to 5%"],["MoreThan5Per","More than 5%"]];
const CND_44AB=[["bi","Sales, turnover or gross receipts exceeds the specified limits"],
  ["bii","Assessee falling u/s 44AD/44ADA/44AE/44BB but not opting for offering income on presumptive basis"],
  ["biii","others"]];
const AUD_SEC=[["10A","10A"],["10AA","10AA"],["44DA","44DA"],["50B","50B"],["80-IA","80-IA"],
  ["80-IAB","80-IAB"],["80-IAC","80-IAC"],["80-IB","80-IB"],["80-IC","80-IC"],["80-ID","80-ID"],
  ["80-IE","80-IE"],["80JJAA","80JJAA"],["80LA","80LA"],["115JC","115JC"]];
const AUD_ACT=[["1","Banking Regulation Act, 1949"],["2","Central Excise Act,1944"],
  ["3","Central Sales Tax Act, 1956"],["4","Central Goods and Services Tax Act, 2017"],
  ["5","Charitable And Religious Trusts Act, 1920"],["6","Companies Act, 2013"],
  ["7","Electricity Act, 2003"],["8","Employees Provident Fund and Miscellaneous Provisions Act, 1952"],
  ["9","Foreign Exchange Management Act, 1999"],["10","Government Superannuation Fund Act, 1956"],
  ["11","Indian Trusts Act, 1882"],["12","Integrated Goods and Services Tax Act, 2017"],
  ["13","Limited Liability Partnership Act, 2008"],["14","Payment of Gratuity Act, 1972"],
  ["15","SEBI Act, 1992"],["16","Securities Contract (Regulation) Act, 1956"],
  ["17","State Goods and Services Tax Act, 2017"],["18","Union Territories Goods and Services Tax Act, 2017"],
  ["19","Others"]];
/* Return-section codes that carry a notice/order (DIN + date mandatory) and
   those that carry an original-return receipt (revised/defective/modified). */
const RET_NOTICE=[13,14,16,18,20];   /* 142(1) / 148 / 153C / 139(9) / 119(2)(b) */
const RET_ORIG=[17,19];              /* 139(5) revised / 92CD modified */

/* =====================================================================
   ENGINE — engRet(): Part A - General carries no income head.
   ===================================================================== */
function engRet(){
  const A={income:0};                         /* contribution to GTI = 0 */
  A.optOld  = (S.fs.optout==="Yes");          /* old regime chosen */
  A.regime  = A.optOld?"Old":"New";
  A.hasBP   = (S.fs.incBP==="Y");             /* A19(b) — business/profession income */
  /* Form 10-IEA is the sticky opt-out mechanism, and is REQUIRED to opt out
     of the new regime only when there is business/profession income
     (REGIME.md · A45). A person without BP income opts in the return itself. */
  A.need10IEA = A.optOld && A.hasBP;
  S.C.ret=A;
}

/* =====================================================================
   New-vs-Old comparison — compute the whole return both ways.
   Reads other heads' compute output defensively; never throws.
   (REGIME.md: "the ret section shows the both-ways comparison".)
   ===================================================================== */
function retCompare(){
  if(typeof compute!=="function" || S._retCmp) return null;
  S._retCmp=1;
  const keep=S.fs.optout;
  const pick=()=>({ via:((S.C.ded||{}).allowed||(S.C.via||{}).allowed||0),
                    ti:(S.C.ti||0),
                    tax:(((S.C.int||{}).net!=null?(S.C.int||{}).net:((S.C.tax||{}).gross||0))||0) });
  let a={via:0,ti:0,tax:0}, b={via:0,ti:0,tax:0};
  try{ S.fs.optout="No";  compute(); a=pick(); }catch(e){}
  try{ S.fs.optout="Yes"; compute(); b=pick(); }catch(e){}
  S.fs.optout=keep; try{ compute(); }catch(e){}
  S._retCmp=0;
  return {a,b};
}
function regimeTable(){
  const c=retCompare();
  if(!c) return note("The New-vs-Old comparison appears once the income and tax "+
    "sections are computed.");
  const a=c.a,b=c.b,gap=Math.abs(R(a.tax)-R(b.tax)),better=R(a.tax)<=R(b.tax)?"new":"old";
  let h='<div class="full"><table class="gt" style="min-width:640px"><thead><tr>'+
    '<th class="l">Regime</th><th style="width:170px">Chapter VI-A allowed</th>'+
    '<th style="width:150px">Total income</th><th style="width:150px">Tax after credit</th>'+
    '</tr></thead><tbody>'+
    '<tr><td class="l">New — section 115BAC(1A)</td><td class="num">'+cell(a.via)+
      '</td><td class="num">'+cell(a.ti)+'</td><td class="num">'+cell(a.tax)+'</td></tr>'+
    '<tr><td class="l">Old</td><td class="num">'+cell(b.via)+'</td><td class="num">'+
      cell(b.ti)+'</td><td class="num">'+cell(b.tax)+'</td></tr></tbody></table></div>';
  h+=(gap?note("On the figures entered so far the <b>"+better+" regime costs "+RS(gap)+
      " less</b>. A business filer opts out of the new regime only through Form 10-IEA — "+
      "settle it before filing.")
        :note("On the figures entered so far the two regimes come to the same tax."));
  return h;
}

/* =====================================================================
   RENDERER — secRet(): the Return / regime / audit face.
   ===================================================================== */
function secRet(){
  const sec=+S.fs.sec, ind=S.pi.status!=="H";
  let h="";

  /* ---- Filing (rows 29-35) ---- */
  h+=sub("Filing");
  h+=row("Filed under section",sel("fs.sec",RET_SEC,{blank:false}),{req:1,ref:"A18"});
  if(RET_NOTICE.indexOf(sec)>=0){
    h+=row("Unique Number / Document Identification Number (DIN) of the notice or order",
      inp("fs.din"),{req:1,ind:1,ref:"E35",hint:"mandatory for a return filed against a 139(9)/142(1)/148/153C notice or 119(2)(b) order"});
    h+=row("Date of the notice or order",dte("fs.noticedate"),{req:1,ind:1});
  }
  if(RET_ORIG.indexOf(sec)>=0){
    h+=row("Receipt number of the original return",inp("fs.receipt",{max:15}),{req:1,ind:1,ref:"E32"});
    h+=row("Date of filing of the original return",dte("fs.origdate"),{req:1,ind:1});
  }
  h+=row("Date of filing this return",dte("fs.filed"),{req:1,hint:"drives interest under 234A and the fee under 234F"});
  h+=row("Due date for filing return of income",sel("fs.duedate",DUE_DATES,{blank:false}),
    {req:1,ref:"FilingStatus.ItrFilingDueDate",hint:"if 31 Oct or 30 Nov is selected, Schedule IF / 5A / audit details apply"});

  /* ---- Regime — Form 10-IEA machinery (rows 62-79 visible) ---- */
  h+=sub("Tax regime — section 115BAC");
  h+=row("Do you have income from business or profession for the current Assessment Year?",
    sel("fs.incBP",YN,{blank:false}),{req:1,ref:"A19(b) / E62"});
  h+=row("Do you wish to opt for the OLD tax regime for the current Assessment Year? (section 115BAC(6))",
    sel("fs.optout",[["No","No — stay in the new regime (default)"],["Yes","Yes — opt out to the old regime"]],{blank:false}),
    {req:1,ref:"E79",hint:"the default is the new regime u/s 115BAC(1A)"});
  if(S.fs.optout==="Yes"){
    if(S.fs.incBP==="Y"){
      h+=note("Opting out of the new regime with business/profession income is exercised "+
        "<b>only</b> through Form 10-IEA, and is sticky. Furnish its current-AY acknowledgement "+
        "and date below (REGIME.md · A45).","warn");
      h+=row("Date of filing of Form 10-IEA for AY 2026-27",dte("fs.f10ieaDate"),{req:1,ind:1,ref:"O77"});
      h+=row("Acknowledgement Number of Form 10-IEA",inp("fs.f10ieaAck",{max:15}),{req:1,ind:1,ref:"O78"});
    } else {
      h+=note("Without business/profession income the old regime is exercised in the return "+
        "itself — Form 10-IEA is not applicable.");
    }
    h+=row("Have you filed Form 10-IEA within the due date for any earlier AY to opt out (old regime)?",
      sel("fs.f10ieaEarlier",YN),{ind:1,ref:"N63"});
    if(S.fs.f10ieaEarlier==="Y"){
      h+=row("Form 10-IEA acknowledgement number (earlier AY, old regime)",inp("fs.f10ieaEarlierAck",{max:15}),{ind:1,ref:"O66"});
      h+=row("Assessment Year of that Form 10-IEA",sel("fs.f10ieaEarlierAY",NEW_AY),{ind:1,ref:"O65"});
    }
  } else if(S.fs.incBP==="Y"){
    /* New-regime RE-ENTRY through Form 10-IEA (rows 63-78, paths (I)(A)(ii) and
       (I)(B)) — the counterpart of the old-regime opt-out above: a business filer
       who had opted OUT of the new regime in an earlier year and is now re-entering
       it. All flags default empty, so a filer who never opted out emits nothing. */
    h+=note("If you had opted out of the new regime in an earlier year and are now "+
      "re-entering it, the re-entry is exercised through Form 10-IEA — furnish its "+
      "particulars below (rows 63-78).");
    h+=row("Have you filed ITR-3/4 in the past and re-entered the new tax regime by filing Form 10-IEA for an earlier AY? [(I)(A)(ii)]",
      sel("fs.f10ieaNewEarlier",YN),{ind:1,ref:"N67"});
    if(S.fs.f10ieaNewEarlier==="Y"){
      h+=row("Assessment Year of that Form 10-IEA (new regime re-entry)",sel("fs.f10ieaNewEarlierAY",NEW_AY),{ind:1,ref:"O69"});
      h+=row("Form 10-IEA acknowledgement number (earlier AY, new regime re-entry)",inp("fs.f10ieaNewEarlierAck",{max:15}),{ind:1,ref:"O70"});
    }
    h+=row("Have you furnished Form 10-IEA to re-enter the new tax regime for the current AY? [(I)(A)(ii)(b)/(I)(B)]",
      sel("fs.f10ieaNewCurr",YN),{ind:1,ref:"N71 / N75"});
    if(S.fs.f10ieaNewCurr==="Y"){
      h+=row("Date of filing of Form 10-IEA for AY 2026-27 (new regime re-entry)",dte("fs.f10ieaNewDate"),{ind:1,ref:"O73 / O77"});
      h+=row("Acknowledgement Number of Form 10-IEA (current AY, new regime re-entry)",inp("fs.f10ieaNewAck",{max:15}),{ind:1,ref:"O74 / O78"});
    }
  }
  h+=regimeTable();

  /* ---- Residential status ---- */
  h+=sub("Residential status");
  h+=row("Residential status in India",sel("fs.resStatus",RES_STAT,{blank:false}),{req:1,ref:"FilingStatus.ResidentialStatus"});
  if(ind && S.fs.resStatus==="RES")
    h+=row("Do you want to claim the benefit under section 115H? (resident)",sel("fs.b115H",YN),{ref:"E112"});
  /* Conditions for residential status (rows 36-44, individuals only). The
     conditions dropdown is offered for RES/NOR/NRI (its option list is chosen by
     status — W36); the jurisdiction table opens for a non-resident (NRI/NOR) and
     the days-of-stay rows for the citizen/POI conditions (row 42). */
  if(ind){
    const rs=S.fs.resStatus;
    const CONDOPTS = rs==="NOR"?RES_COND_NOR : rs==="NRI"?RES_COND_NRI : RES_COND_RES;
    h+=row("Conditions for residential status (applicable for individuals only)",
      sel("fs.resCond",CONDOPTS),{ind:1,ref:"W36 · ConditionsResStatus"});
    if(rs==="NRI"||rs==="NOR"){
      h+=note("Specify the jurisdiction(s) of residence during the previous year and the Taxpayer Identification Number (TIN) allotted in each (rows 37-40).");
      h+=grid("fs.jur",[
        {k:"country",h:"Jurisdiction of residence",t:"sel",w:"340px",req:1,opts:RES_JUR},
        {k:"tin",h:"Taxpayer Identification Number (TIN)",t:"txt",w:"240px",req:1,max:50}],
        S.fs.jur||[],{min:"620px",empty:"No jurisdiction added.",add:"Add a jurisdiction"});
    }
    if(POI_COND.indexOf(st0(S.fs.resCond))>=0){
      h+=row("Total period of stay in India during the previous year (in days)",inp("fs.stayPY",{n:1}),{ind:1,ref:"E43 · TotalPrStayIndiaPrevYr"});
      h+=row("Total period of stay in India during the 4 preceding years (in days)",inp("fs.stay4Yr",{n:1}),{ind:1,ref:"E44 · TotalPrStayIndia4PrecYr"});
    }
  }

  /* ---- Seventh proviso to 139(1) (rows 101-109) ---- */
  h+=sub("Seventh proviso to section 139(1)");
  h+=card("declret","Filing under the seventh proviso though not otherwise required to",
    (S.decl.flag==="Y"?"Declared":""),
    row("Are you filing under the seventh proviso to 139(1) but otherwise not required to file?",
      sel("decl.flag",YN,{blank:false}),{ref:"E101"})+
    (S.decl.flag==="Y"?(
      row("Deposited over ₹1 crore in one or more current accounts?",sel("decl.dep_f",YN),
        {ref:"E102",v2:S.decl.dep_f==="Y"?inp("decl.dep",{n:1}):""})+
      row("Spent over ₹2 lakh on travel to a foreign country?",sel("decl.trv_f",YN),
        {ref:"E103",v2:S.decl.trv_f==="Y"?inp("decl.trv",{n:1}):""})+
      row("Spent over ₹1 lakh on consumption of electricity?",sel("decl.ele_f",YN),
        {ref:"E104",v2:S.decl.ele_f==="Y"?inp("decl.ele",{n:1}):""})+
      row("Required to file under other conditions in clause (iv) of the seventh proviso?",
        sel("decl.c4_f",YN),{ref:"E105"})+
      (S.decl.c4_f==="Y"?grid("decl.c4",[
        {k:"nature",h:"Condition",t:"sel",w:"560px",req:1,opts:CLAUSEIV},
        {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],
        S.decl.c4||[],{min:"760px",empty:"No condition added.",add:"Add a condition"}):"")
    ):""));

  /* ---- Directorship / Partnership / Unlisted shares ---- */
  h+=sub("Directorship, partnership and unlisted shares");
  h+=row("Were you a Director in a company at any time during the previous year?",
    sel("fs.dir",YN,{blank:false}),{ref:"E122"});
  if(S.fs.dir==="Y")
    h+=grid("pi.dirco",[
      {k:"name",h:"Name of company",t:"txt",w:"320px",req:1},
      {k:"type",h:"Type of company",t:"sel",w:"140px",req:1,opts:CO_TYPE},
      {k:"pan",h:"PAN",t:"txt",w:"130px",max:10},
      {k:"listed",h:"Shares",t:"sel",w:"130px",req:1,opts:SHARE_TYPE},
      {k:"din",h:"DIN",t:"txt",w:"140px"}],
      S.pi.dirco||[],{min:"900px",empty:"No company added.",add:"Add a company"});
  h+=row("Were you a Partner in a Firm?",sel("fs.partner",YN,{blank:false}),{ref:"E128"});
  if(S.fs.partner==="Y")
    h+=grid("pi.firms",[
      {k:"name",h:"Name of firm",t:"txt",w:"420px",req:1},
      {k:"pan",h:"PAN",t:"txt",w:"140px",req:1,max:10}],
      S.pi.firms||[],{min:"640px",empty:"No firm added.",add:"Add a firm"});
  h+=row("Did you hold unlisted equity shares at any time during the previous year?",
    sel("fs.unl",YN,{blank:false}),{req:1,ref:"E133"});
  if(S.fs.unl==="Y")
    h+=grid("pi.unlco",[
      {k:"name",h:"Name of company",t:"txt",w:"260px",req:1},
      {k:"type",h:"Type",t:"sel",w:"120px",req:1,opts:CO_TYPE},
      {k:"pan",h:"PAN",t:"txt",w:"120px",max:10},
      {k:"obNo",h:"Opening — no. of shares",t:"num",w:"120px",req:1},
      {k:"obCost",h:"Opening — cost of acquisition",t:"num",w:"140px",req:1},
      {k:"acqNo",h:"Acquired — no. of shares",t:"num",w:"120px"},
      {k:"subDate",h:"Date of subscription / purchase",t:"date",w:"150px"},
      {k:"faceVal",h:"Face value per share",t:"num",w:"120px"},
      {k:"issuePrice",h:"Issue price per share",t:"num",w:"120px"},
      {k:"purchPrice",h:"Purchase price per share",t:"num",w:"130px"},
      {k:"trnfNo",h:"Transferred — no. of shares",t:"num",w:"130px"},
      {k:"trnfCons",h:"Transfer — sale consideration",t:"num",w:"140px"},
      {k:"cbNo",h:"Closing — no. of shares",t:"num",w:"120px",req:1},
      {k:"cbCost",h:"Closing — cost of acquisition",t:"num",w:"140px",req:1}],
      S.pi.unlco||[],{min:"1960px",empty:"No company added.",add:"Add a company"});

  /* ---- Non-resident PE/SEP, IFSC, FPI, LEI ---- */
  h+=sub("Non-resident, IFSC, FPI and LEI");
  if(S.fs.resStatus!=="RES"){
    h+=row("In case of non-resident, is there a Permanent Establishment (PE) in India?",sel("fs.nriPE",YN),{ref:"E140"});
    h+=row("In case of non-resident, is there a Significant Economic Presence (SEP) in India?",sel("fs.nriSEP",YN_NA),{ref:"E141"});
    if(S.fs.nriSEP==="Y"){
      h+=row("Aggregate of payments arising from the transaction(s)",inp("fs.sepPay",{n:1}),{ind:1,ref:"E142"});
      h+=row("Number of users in India [Explanation 2A(b) to 9(1)(i)]",inp("fs.sepUsers",{n:1}),{ind:1,ref:"E143"});
    }
  }
  h+=row("Do you have a unit in an IFSC deriving income solely in convertible foreign exchange?",
    sel("fs.foreignExch",YN,{blank:false}),{req:1,ref:"E144 / ForeignExchangeFlag"});
  h+=row("Whether you are an FPI?",sel("fs.fpi",YN,{blank:false}),{req:1,ref:"E145 / FiiFpiFlag"});
  if(S.fs.fpi==="Y")
    h+=row("SEBI Registration No.",inp("fs.sebi"),{ind:1,ref:"E146"});
  h+=row("Legal Entity Identifier (LEI) Number",inp("fs.lei",{max:20}),{ref:"E148",hint:"mandatory if the refund is ₹50 crore or more"});
  if(st0(S.fs.lei))
    h+=row("LEI valid upto date",dte("fs.leiValid"),{ind:1,ref:"E149"});

  /* ---- Representative assessee (rows 114-117) ---- */
  h+=sub("Representative assessee");
  h+=row("Is this return being filed by a representative assessee?",sel("fs.rep",YN,{blank:false}),{ref:"E114"});
  if(S.fs.rep==="Y"){
    h+=row("Name of the representative assessee",inp("fs.repName"),{req:1,ind:1,ref:"G115"});
    h+=row("Email-ID of the representative assessee",inp("fs.repEmail"),{req:1,ind:1,ref:"N116",hint:"must differ from the taxpayer's primary email"});
    h+=row("Contact number of the representative assessee",inp("fs.repMobile",{n:1}),{req:1,ind:1,ref:"N117",hint:"must differ from the taxpayer's primary mobile"});
  }

  /* ---- Audit information — PartA_GEN2 (rows 151-193) ---- */
  h+=sub("Audit information");
  h+=row("a1 · Are you liable to maintain accounts as per section 44AA?",sel("aud.sec44AA",YN,{blank:false}),{req:1,ref:"F151"});
  h+=row("a2 · Are you declaring income only under section 44AE/44B/44BB/44AD/44ADA/44BBA/44BBC/44BBD/44DA?",
    sel("aud.incDclrdUs",YN,{blank:false}),{req:1,ref:"F152"});
  if(S.aud.incDclrdUs==="N"){
    h+=row("a2i · Range of total sales / turnover / gross receipts of business",sel("aud.salesBand",SALES_BAND),{ind:1,ref:"F153"});
    if(S.aud.salesBand==="Upto10CR"){
      h+=row("a2ii · Percentage of aggregate of all amounts received (incl. sales/turnover) in cash",sel("aud.pctRcvd",PCT_BAND),{ind:1,req:1,ref:"F154"});
      h+=row("a2iii · Percentage of aggregate of all payments made (incl. expenditure) in cash",sel("aud.pctPaid",PCT_BAND),{ind:1,req:1,ref:"F155"});
    }
  }
  h+=row("b · Are you liable for audit under section 44AB?",sel("aud.sec44AB",YN,{blank:false}),{req:1,ref:"F156"});
  if(S.aud.sec44AB==="Y"){
    h+=row("Condition by virtue of which liable for audit u/s 44AB",sel("aud.cnd44AB",CND_44AB),{ind:1,req:1,ref:"F157"});
    if(S.aud.cnd44AB==="bii"){S.aud.bii=S.aud.bii||{};
      h+=row("Falling under section 44AD (but not opting presumptive)?",sel("aud.bii.44AD",YN),{ind:2,ref:"AQ157"});
      h+=row("Falling under section 44ADA?",sel("aud.bii.44ADA",YN),{ind:2,ref:"AR157"});
      h+=row("Falling under section 44AE?",sel("aud.bii.44AE",YN),{ind:2,ref:"AS157"});
      h+=row("Falling under section 44BB?",sel("aud.bii.44BB",YN),{ind:2,ref:"AT157"});
    }
    h+=row("c · Have the accounts been audited by an accountant?",sel("aud.acctFlg",YN),{ind:1,ref:"F161"});
    if(S.aud.acctFlg==="Y"){
      h+=row("Date of furnishing of the audit report",dte("aud.repDate"),{ind:1,req:1,ref:"G162",hint:"cannot be after today"});
      h+=row("Acknowledgement number of the audit report",inp("aud.repAck",{max:15}),{ind:1,req:1,ref:"N163"});
      h+=row("Name of the auditor (proprietorship / firm)",inp("aud.frmName"),{ind:1,req:1,ref:"G166"});
      h+=row("PAN of the proprietorship / firm",inp("aud.frmPAN",{max:10}),{ind:1,ref:"G168"});
      h+=row("Aadhaar of the proprietorship",inp("aud.frmAadhaar",{max:12}),{ind:1,ref:"G169"});
    }
  }
  h+=row("d(i) · Are you liable for audit u/s 92E?",sel("aud.sec92E",YN,{blank:false}),{req:1,ref:"F173"});
  if(S.aud.sec92E==="Y"){
    h+=row("d(ii) · Have the accounts been audited u/s 92E?",sel("aud.acct92E",YN,{blank:false}),{ind:1,req:1,ref:"W173"});
    if(S.aud.acct92E==="Y"){
      h+=row("Date of audit report (92E)",dte("aud.date92E"),{ind:1,req:1,ref:"E174"});
      h+=row("Acknowledgement number (92E)",inp("aud.ack92E",{max:15}),{ind:1,req:1,ref:"E175"});
    }
  }
  h+=fold("audoth","d(iii)","Other audit reports furnished under the Income-tax Act",
    (S.aud.oth||[]).length?(S.aud.oth||[]).length+" rows":"if any",
    grid("aud.oth",[
      {k:"sec",h:"Section code",t:"sel",w:"140px",req:1,opts:AUD_SEC},
      {k:"flag",h:"Furnished?",t:"sel",w:"110px",opts:YN},
      {k:"othDtls",h:"Other audit details",t:"txt",w:"200px"},
      {k:"date",h:"Date",t:"date",w:"150px"},
      {k:"ack",h:"Acknowledgement number",t:"txt",w:"180px",max:15}],
      S.aud.oth||[],{min:"840px",empty:"No other audit report.",add:"Add an audit report"}));
  h+=fold("audact","Other Act","Audits under an Act other than the Income-tax Act",
    (S.aud.act||[]).length?(S.aud.act||[]).length+" rows":"if any",
    grid("aud.act",[
      {k:"act",h:"Act",t:"sel",w:"320px",req:1,opts:AUD_ACT},
      {k:"actOther",h:"If others, specify",t:"txt",w:"180px"},
      {k:"sec",h:"Section",t:"txt",w:"120px"},
      {k:"othFlag",h:"Audited under an Act other than the IT Act?",t:"sel",w:"140px",opts:YN},
      {k:"othDtls",h:"Other audit details (other than IT Act)",t:"txt",w:"200px"},
      {k:"date",h:"Date of audit report",t:"date",w:"150px"}],
      S.aud.act||[],{min:"1160px",empty:"No other-Act audit.",add:"Add an audit"}));

  /* ---- Nature of business ---- */
  h+=sub("Nature of business or profession");
  h+=grid("nob",[
    {k:"code",h:"Code",t:"txt",w:"110px",req:1,ph:"e.g. 09028",max:5},
    {k:"trade",h:"Trade name",t:"txt",w:"240px"},
    {k:"desc",h:"Description",t:"txt",w:"320px"}],
    S.nob||[],{min:"720px",empty:"Add at least one nature of business.",add:"Add a business"});
  h+=note("Codes are the department's NatureOfBusiness list (357 entries); enter the five-digit code as it appears in the utility.");

  return h;
}

/* =====================================================================
   EXPORT — expRet(j): write PartA_GEN1 and PartA_GEN2 onto j.
   put() skips empty values; the SKEL skeleton keeps required leaves present.
   ===================================================================== */
/* expRet removed by integrator — who owns PartA_GEN1/GEN2 (dedup, rule 11) */

/* =====================================================================
   IMPORT — impRet(I3): inverse of expRet. Returns short labels read.
   ===================================================================== */
/* impRet removed by integrator — who owns PartA_GEN1/GEN2 (dedup, rule 11) */

/* =====================================================================
   CHECKS — chkRet(): the sheet's own rules as live messages.
   ===================================================================== */
function chkRet(){
  const out=[], sec=+S.fs.sec;
  /* Notice / order sections → DIN + date mandatory (rules.json, rows 34-35) */
  if(RET_NOTICE.indexOf(sec)>=0){
    if(!st0(S.fs.din)) out.push({lvl:"err",t:"DIN required",m:"A return filed under 142(1)/148/153C/139(9) or an order u/s 119(2)(b) needs the Unique Number / Document Identification Number.",sec:"ret"});
    if(!D(S.fs.noticedate)) out.push({lvl:"err",t:"Notice date required",m:"Enter the date of the notice or order.",sec:"ret"});
  }
  if(RET_ORIG.indexOf(sec)>=0){
    if(!st0(S.fs.receipt)) out.push({lvl:"err",t:"Receipt number required",m:"A revised (139(5)) or modified (92CD) return needs the receipt number of the original return.",sec:"ret"});
    if(!D(S.fs.origdate)) out.push({lvl:"err",t:"Original-return date required",m:"Enter the date of filing of the original return.",sec:"ret"});
  }
  /* Regime: opting old with business income needs Form 10-IEA (A45) */
  if(S.fs.optout==="Yes"&&S.fs.incBP==="Y"){
    if(!st0(S.fs.f10ieaAck)) out.push({lvl:"err",t:"Form 10-IEA acknowledgement required",m:"A business filer opts out of the new regime only through Form 10-IEA — furnish its acknowledgement number.",sec:"ret"});
    if(!D(S.fs.f10ieaDate)) out.push({lvl:"err",t:"Form 10-IEA date required",m:"Furnish the date of filing of Form 10-IEA for AY 2026-27.",sec:"ret"});
    /* old regime cannot be opted after the 139(1) due date */
    if(D(S.fs.filed)&&D(S.fs.duedate?dmy(S.fs.duedate):"")&&D(S.fs.filed)>D(dmy(S.fs.duedate)))
      out.push({lvl:"warn",t:"Old regime after due date",m:"The old regime under 115BAC(6) cannot be opted after the due date under 139(1).",sec:"ret"});
  }
  /* Yes-then-table gates */
  if(S.fs.dir==="Y"&&!(S.pi.dirco||[]).length) out.push({lvl:"err",t:"Director table empty",m:"You answered Yes to being a Director — list each company.",sec:"ret"});
  if(S.fs.partner==="Y"&&!(S.pi.firms||[]).length) out.push({lvl:"err",t:"Partner table empty",m:"You answered Yes to being a Partner — list each firm.",sec:"ret"});
  if(S.fs.unl==="Y"&&!(S.pi.unlco||[]).length) out.push({lvl:"err",t:"Unlisted-shares table empty",m:"You answered Yes to holding unlisted equity shares — fill the shares table.",sec:"ret"});
  if(S.fs.rep==="Y"){
    if(st0(S.fs.repEmail)&&st0(S.pi.email)&&st0(S.fs.repEmail).toLowerCase()===st0(S.pi.email).toLowerCase())
      out.push({lvl:"err",t:"Representative email clashes",m:"The representative's email must differ from the taxpayer's primary email.",sec:"ret"});
    if(st0(S.fs.repMobile)&&st0(S.pi.mobile)&&st0(S.fs.repMobile)===st0(S.pi.mobile))
      out.push({lvl:"err",t:"Representative contact clashes",m:"The representative's contact number must differ from the taxpayer's primary mobile.",sec:"ret"});
  }
  /* Audit: 44AB liable + accountant-audited → auditor / report mandatory; date not future */
  if(S.aud.sec44AB==="Y"){
    if(!st0(S.aud.cnd44AB)) out.push({lvl:"err",t:"44AB condition required",m:"Select the condition by virtue of which you are liable for audit u/s 44AB.",sec:"ret"});
    if(S.aud.acctFlg==="Y"){
      if(!D(S.aud.repDate)) out.push({lvl:"err",t:"Audit-report date required",m:"When accounts are audited by an accountant, the date of furnishing the audit report is mandatory.",sec:"ret"});
      else if(D(S.aud.repDate)>new Date()) out.push({lvl:"warn",t:"Audit-report date in the future",m:"The date of the audit report cannot be after the system date.",sec:"ret"});
      if(!st0(S.aud.repAck)) out.push({lvl:"err",t:"Audit-report acknowledgement required",m:"Enter the acknowledgement number of the 44AB audit report.",sec:"ret"});
      if(!st0(S.aud.frmName)) out.push({lvl:"err",t:"Auditor name required",m:"Enter the name of the auditor (proprietorship / firm).",sec:"ret"});
    }
  }
  /* a2i turnover band drives a2ii/a2iii; > 5% → liable to 44AB */
  if(S.aud.incDclrdUs==="N"&&S.aud.salesBand==="Upto10CR"){
    if(!st0(S.aud.pctRcvd)||!st0(S.aud.pctPaid))
      out.push({lvl:"err",t:"Cash-percentage required",m:"With turnover over ₹1 crore up to ₹10 crores, both a2ii and a2iii percentages must be filled.",sec:"ret"});
    else if((S.aud.pctRcvd==="MoreThan5Per"||S.aud.pctPaid==="MoreThan5Per")&&S.aud.sec44AB!=="Y")
      out.push({lvl:"warn",t:"Likely liable u/s 44AB",m:"Cash receipts or payments exceed 5% — the assessee is liable to audit u/s 44AB.",sec:"ret"});
  }
  if(S.aud.sec92E==="Y"&&S.aud.acct92E==="Y"){
    if(!D(S.aud.date92E)) out.push({lvl:"err",t:"92E audit date required",m:"Enter the date of the 92E audit report.",sec:"ret"});
    if(!st0(S.aud.ack92E)) out.push({lvl:"err",t:"92E acknowledgement required",m:"Enter the acknowledgement number of the 92E audit report.",sec:"ret"});
  }
  /* Nature of business is mandatory for a business filer (NatureOfBusiness[].Code) */
  if(S.fs.incBP==="Y"&&!(S.nob||[]).length)
    out.push({lvl:"err",t:"Nature of business required",m:"A filer with business/profession income must enter at least one nature-of-business code.",sec:"ret"});
  if(!out.length) out.push({lvl:"ok",t:"Return and regime",m:(S.fs.optout==="Yes"?"Old":"New")+" regime · filed under "+((RET_SEC.find(x=>+x[0]===sec)||["",""])[1]||"section "+sec)+".",sec:"ret"});
  return out;
}

reg({id:"ret", t:"Return and regime", ref:"Part A - General", f:secRet,
  s:()=>(S.fs.optout==="Yes"?"Old regime":"New regime")+(D(S.fs.filed)?" · filed "+DISP(D(S.fs.filed)):""),
  /* exp/imp intentionally unregistered: the `who` section owns PartA_GEN1 / PartA_GEN2
     export+import from the shared S.pi / S.fs state. ret is the regime view only. */
  eng:engRet, chk:chkRet, order:6});
