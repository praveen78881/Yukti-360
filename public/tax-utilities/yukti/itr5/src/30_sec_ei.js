/* =====================================================================
   ITR-5 · Section "ei" — Exempt income (Schedule EI)
   Book: books/ITR-5/EI.md · Sheet tab: EI · section_map: {"EI":{ei:[ScheduleEI]}}
   Schema block: ScheduleEI  (#/definitions/ScheduleEI)
   Compute / screen order: 30 (after the income heads/losses; net-agri is read
   by the tax section for partial integration / the rate-purpose add-back).

   REGIME: exempt income is not a 115BAC concession — nothing on this schedule
   closes on the new regime. engEi() reads isNew() only to keep the contract
   explicit; it applies no closure.

   GTI CONTRIBUTION: by definition exempt income is NOT part of Gross Total
   Income, so S.C.ei.income = 0. One figure carries a rate effect: the net
   agricultural income at Sl.No.2v (NetAgriIncOrOthrIncRule7, J10) is added
   back for rate purposes (Part B-TI Sl.15 "Net agricultural income / any other
   income for rate purpose" when 2v > Rs.5,000 — rules 4025/4030). This builder
   PUBLISHES that figure as S.C.ei.netAgri for the tax section.

   Item numbering follows rules.json / the [E47] caption "(1 + 2 + 3 + 4 + 5)":
   1 Interest · 2 Agriculture (i–vi) · 3 Other exempt · 4 DTAA · 5 Pass-through
   · 6 Total. Counter-intuitive schema keys: `Others` = the line-3 total (J38),
   `IncChrgblAsPerDTAA` = the line-4 DTAA total (J44). The hidden Dividend row
   (J5, DividendInc) and the hidden legacy pass-through / other-exempt blocks
   (rows 5,18–25,33–37) are NOT built (see EI.md "Hidden rows — not built");
   DividendInc contributes 0 to the J47 total here.
   ===================================================================== */

/* ---- dropdown value lists ---------------------------------------- */
/* ScheduleEI.ExcNetAgriInc...AgriLandOwnedFlag / AgriLandIrrigatedFlag (enums.json) */
const EI_OWNED=[["O","Owned"],["H","Held on lease"]];
const EI_IRR=[["IRG","Irrigated"],["RF","Rain-fed"]];
/* ScheduleEI.IncNotChrgblAsPerDTAA...HeadOfIncome (enums.json — 4 values, no Salary; BP=Business & Profession) */
const EI_HEAD=[["HP","House Property"],["BP","Business and Profession"],["CG","Capital Gain"],["OS","Income from Other sources"]];
const EI_TRC=[["Y","Yes"],["N","No"]];
/* ScheduleEI.OthersInc.OthersIncDtls[].Category (enums.json — 11 schema codes; the
   utility only OFFERS 9 of them via its dependent dropdown, see EI_CATORD_* below.
   SRSC/SRST are schema-valid but not surfaced by the ITR-5 utility). */
const EI_CAT=[["AGRI","Agricultural & related incomes"],["GOVC","Compensation/other sums received by government or other approved entities"],["ISI","Income from specified Investments"],["SSRA","Specified sums received by armed forces personnel"],["SRSC","Sums received by Senior Citizens/Minors"],["SRST","Sums received by specified Category of Taxpayers"],["SRPC","Sums received from policies/contributions such as LIC/NPS/PF/Sukanya Samriddhi Yojana"],["OTH","Other Incomes"],["OTHN","Other Exempt Income for Non Residents"],["ICSB","Incomes of certain specified bodies"],["IOI","Income from other investments"]];
/* ScheduleEI.OthersInc.OthersIncDtls[].SubCategory (enums.json — full 106-code map) */
const EI_SUB=[["10(30)","10(30)-Subsidy received from or through the Tea Board"],["10(31)","10(31)-Subsidy for Rubber/Coffee/Tea replantation, replacement, rejuvenation"],["10(37)","10(37)-Capital gains on compulsory acquisition of urban agricultural land"],["10(10BB)","10(10BB)-Payments under Bhopal Gas Leak Disaster"],["10(10BC)","10(10BC)-Disaster compensation"],["10(17A)","10(17A)-Government instituted award"],["10(12AB)","10(12AB)-Lump sum amount (FX-1/3/2024-PR)"],["10(15)","10(15)-Interest on specified securities/investments"],["10(23FBB)","10(23FBB)-Income of unit holders of investment fund"],["10(23D)","10(23D)-Specified mutual fund income"],["10(23ED)","10(23ED)-Income of a business trust's unit holder under specific circumstances"],["10(23FD)","10(23FD)-Business Trust income"],["10(35)","10(35)-Income from specified Mutual Funds"],["10(35A)","10(35A)-Securitisation trust income"],["10(23FBC)","10(23FBC)-Income from specified fund"],["10(33)","10(33)-Unit Scheme 1964 transfer income"],["10(4B)","10(4B)-Interest on savings certificates"],["10(4C)","10(4C)-Interest on rupee denominated bonds"],["10(4E)","10(4E)-IFSC derivative income"],["10(36)","10(36)-LTCG on listed shares"],["10(37A)","10(37A)-Capital gains on specified asset"],["10(12C)","10(12C)-Agniveer Corpus Fund income"],["10(18)","10(18)-Gallantry award pension"],["10(19)","10(19)-Armed Forces family pension"],["10(23AA)","10(23AA)-Armed forces fund income"],["DMD","DMD-Defence Medical Disability Pension"],["10(32)","10(32)-Minor child income exemption"],["10(43)","10(43)-Reverse mortgage"],["10(19A)","10(19A)-Palace occupation income"],["10(26)","10(26)-Scheduled tribe income"],["10(26AAA)","10(26AAA)-Sikkim income"],["10(10D)","10(10D)-Life insurance proceeds"],["10(11)","10(11)-Statutory PF income"],["10(11A)","10(11A)-Sukanya Samriddhi income"],["10(12)","10(12)-Recognized PF income"],["10(12A)","10(12A)-NPS payment"],["10(12AA)","10(12AA)-NPS payment"],["10(12B)","10(12B)-NPS govt employee"],["10(12BA)","10(12BA)-NPS withdrawal"],["10(13)","10(13)-Superannuation fund income"],["10(25)","10(25)-Trustees income"],["10(44)","10(44)-NPS Trust income"],["10(2)","10(2)-HUF member share"],["10(16)","10(16)-Scholarship income"],["10(4)(ii)","10(4)(ii)-NRE interest"],["10(2A)","10(2A)-Partner share in firm"],["10(8A)","10(8A)-Consultant income"],["10(9)","10(9)-Foreign family income"],["10(4)(i)","10(4)(i)-Interest on specified bonds"],["10(4F)","10(4F)-Aircraft lease royalty"],["10(4G)","10(4G)-IFSC portfolio income"],["10(6B)","10(6B)-Tax paid agreements"],["10(6D)","10(6D)-Royalty to NTRO"],["10(4H)","10(4H)-Aircraft leasing income"],["10(6BB)","10(6BB)-Aircraft lease tax exemption"],["10(23FF)","10(23FF)-SPV relocation gains"],["10(4D)","10(4D)-Specified fund income"],["10(34B)","10(34B)-IFSC aircraft leasing unit income"],["10(39)","10(39)-Sports income"],["10(15A)","10(15A)-Lease payments for foreign aircraft"],["10(20)","10(20)-Local authority income"],["10(21)","10(21)-Approved research association income"],["10(22B)","10(22B)-Specified news agency income"],["10(23A)","10(23A)-Professional regulatory bodies income"],["10(23AAA)","10(23AAA)-Approved employee welfare fund income"],["10(23AAB)","10(23AAB)-Approved pension fund income"],["10(23B)","10(23B)-Approved khadi institution income"],["10(23BB)","10(23BB)-State khadi board income"],["10(23BBA)","10(23BBA)-Religious/charitable trust board income"],["10(23BBB)","10(23BBB)-European Economic Community income"],["10(23BBC)","10(23BBC)-SAARC Fund income"],["10(23BBE)","10(23BBE)-IRDA income"],["10(23BBG)","10(23BBG)-CERC income"],["10(23BBH)","10(23BBH)-Prasar Bharati income"],["10(23C)","10(23C)-Specified institution income"],["10(23DA)","10(23DA)-Securitisation trust income"],["10(23EA)","10(23EA)-Stock exchange fund income"],["10(23EC)","10(23EC)-Investor protection fund income"],["10(23EE)","10(23EE)-Core settlement guarantee fund income"],["10(23F)","10(23F)-Venture capital income"],["10(23FA)","10(23FA)-Venture capital dividend/LTCG"],["10(23FB)","10(23FB)-Venture capital fund income"],["10(23FBA)","10(23FBA)-Investment fund income"],["10(23FC)","10(23FC)-Business trust income"],["10(23FCA)","10(23FCA)-REIT rental income"],["10(23FE)","10(23FE)-Sovereign/pension infrastructure income"],["10(24)","10(24)-Trade union income"],["10(25A)","10(25A)-ESI fund income"],["10(26AAB)","10(26AAB)-Agricultural market committee income"],["10(26B)","10(26B)-SC/ST promotion income"],["10(26BB)","10(26BB)-Minority community promotion income"],["10(26BBB)","10(26BBB)-Ex-servicemen welfare corporation income"],["10(27)","10(27)-SC/ST cooperative society income"],["10(29A)","10(29A)-Commodity board income"],["10(42)","10(42)-Treaty-based international body income"],["10(46A)","10(46A)-Statutory authority income"],["10(46B)","10(46B)-NCGTC income"],["10(48D)","10(48D)-Infrastructure financing institution income"],["10(48E)","10(48E)-Development finance institution income"],["Incmexmptcircular","Incmexmptcircular - Income exempt as per CBDT Circular"],["Incmexmptnotification","Incmexmptnotification- Income exempt as per CBDT Notification"],["Receiptnotincme","Receiptnotincme - Receipts not to be considered as Income"],["Anyother1","Anyother1"],["Anyother2","Anyother2"],["Anyother3","Anyother3"],["Anyother4","Anyother4"]];

/* dependent Category -> permitted SubCategory codes (the utility's dependent
   dropdown, reconstructed from the DB named ranges the VBA wires to each
   category: Agri_dropdown, Comp_dropdown, Income_oth_Inves_dropdown,
   Income_spe_Inves_dropdown[_Res], Income_cer_Inves_dropdown,
   Other_inc_nri_dropdown, Other_dropdown[_Res], Specified_dropdown,
   Sum_rece_dropdown). Non-resident set: */
const EI_SUBG={
  AGRI:["10(30)","10(31)"],
  GOVC:["10(17A)"],
  IOI:["10(4D)","10(34B)","10(39)"],
  ISI:["10(15)","10(23FBB)","10(23FD)","10(35)","10(23FBC)","10(33)","10(4C)","10(4E)","10(36)"],
  ICSB:["10(20)","10(21)","10(22B)","10(23A)","10(23AAA)","10(23AAB)","10(23B)","10(23BB)","10(23BBA)","10(23BBB)","10(23BBC)","10(23BBE)","10(23BBG)","10(23BBH)","10(23C)","10(23D)","10(23DA)","10(23EA)","10(23EC)","10(23ED)","10(23EE)","10(23F)","10(23FA)","10(23FB)","10(23FBA)","10(23FC)","10(23FCA)","10(23FE)","10(24)","10(25)","10(25A)","10(26AAB)","10(26B)","10(26BB)","10(26BBB)","10(27)","10(29A)","10(42)","10(44)","10(46A)","10(46B)","10(48D)","10(48E)"],
  OTHN:["10(4)(i)","10(4F)","10(4G)","10(6B)","10(6D)","10(6BB)","10(15A)"],
  OTH:["10(2A)","10(8A)","Incmexmptcircular","Incmexmptnotification","Receiptnotincme","10(4H)","10(23FF)"],
  SSRA:["10(23AA)"],
  SRPC:["10(10D)"]
};
/* Resident overrides — the utility swaps two subcategory ranges for residents
   (rule 3700: 10(4C),10(4E) drop from ISI; 10(8A) drops from OTH; the whole
   OTHN category is not offered to residents). */
const EI_SUBG_RES={
  ISI:["10(15)","10(23FBB)","10(23FD)","10(35)","10(23FBC)","10(33)","10(36)"],
  OTH:["10(2A)","Incmexmptcircular","Incmexmptnotification","Receiptnotincme","10(4H)","10(23FF)"]
};
/* Category order the utility presents (PART4_Nature_TP / _Res). */
const EI_CATORD_N=["AGRI","GOVC","IOI","ISI","ICSB","OTHN","OTH","SSRA","SRPC"];
const EI_CATORD_R=["AGRI","GOVC","IOI","ISI","ICSB","OTH","SSRA","SRPC"];
/* Sub-categories that require a Description when amount > 0 (rules 3705/3710). */
const EI_DESC_REQ=["Incmexmptcircular","Incmexmptnotification","Receiptnotincme"];

/* ScheduleEI...CountryCodeExcludingIndia (from the EI.md country dump; India (91)
   excluded because the schema key is CountryCodeExcludingIndia. The enums.json
   label column for this enum is scrambled — codes are correct there, names are
   not — so the correct code→name pairs are taken from the book's sheet dump). */
const EI_CTRY=[["93","AFGHANISTAN"],["1001","ALAND ISLANDS"],["355","ALBANIA"],["213","ALGERIA"],["684","AMERICAN SAMOA"],["376","ANDORRA"],["244","ANGOLA"],["1264","ANGUILLA"],["1010","ANTARCTICA"],["1268","ANTIGUA AND BARBUDA"],["54","ARGENTINA"],["374","ARMENIA"],["297","ARUBA"],["61","AUSTRALIA"],["43","AUSTRIA"],["994","AZERBAIJAN"],["1242","BAHAMAS"],["973","BAHRAIN"],["880","BANGLADESH"],["1246","BARBADOS"],["375","BELARUS"],["32","BELGIUM"],["501","BELIZE"],["229","BENIN"],["1441","BERMUDA"],["975","BHUTAN"],["591","BOLIVIA (PLURINATIONAL STATE OF)"],["1002","BONAIRE, SINT EUSTATIUS AND SABA"],["387","BOSNIA AND HERZEGOVINA"],["267","BOTSWANA"],["1003","BOUVET ISLAND"],["55","BRAZIL"],["1014","BRITISH INDIAN OCEAN TERRITORY"],["673","BRUNEI DARUSSALAM"],["359","BULGARIA"],["226","BURKINA FASO"],["257","BURUNDI"],["238","CABO VERDE"],["855","CAMBODIA"],["237","CAMEROON"],["1","CANADA"],["1345","CAYMAN ISLANDS"],["236","CENTRAL AFRICAN REPUBLIC"],["235","CHAD"],["56","CHILE"],["86","CHINA"],["9","CHRISTMAS ISLAND"],["672","COCOS (KEELING) ISLANDS"],["57","COLOMBIA"],["270","COMOROS"],["242","CONGO"],["243","CONGO (DEMOCRATIC REPUBLIC OF THE)"],["682","COOK ISLANDS"],["506","COSTA RICA"],["225","COTE DIVOIRE"],["385","CROATIA"],["53","CUBA"],["1015","CURACAO"],["357","CYPRUS"],["420","CZECHIA"],["45","DENMARK"],["253","DJIBOUTI"],["1767","DOMINICA"],["1809","DOMINICAN REPUBLIC"],["593","ECUADOR"],["20","EGYPT"],["503","EL SALVADOR"],["240","EQUATORIAL GUINEA"],["291","ERITREA"],["372","ESTONIA"],["251","ETHIOPIA"],["500","FALKLAND ISLANDS (MALVINAS)"],["298","FAROE ISLANDS"],["679","FIJI"],["358","FINLAND"],["33","FRANCE"],["594","FRENCH GUIANA"],["689","FRENCH POLYNESIA"],["1004","FRENCH SOUTHERN TERRITORIES"],["241","GABON"],["220","GAMBIA"],["995","GEORGIA"],["49","GERMANY"],["233","GHANA"],["350","GIBRALTAR"],["30","GREECE"],["299","GREENLAND"],["1473","GRENADA"],["590","GUADELOUPE"],["1671","GUAM"],["502","GUATEMALA"],["1481","GUERNSEY"],["224","GUINEA"],["245","GUINEA-BISSAU"],["592","GUYANA"],["509","HAITI"],["1005","HEARD ISLAND AND MCDONALD ISLANDS"],["6","HOLY SEE"],["504","HONDURAS"],["852","HONG KONG"],["36","HUNGARY"],["354","ICELAND"],["62","INDONESIA"],["98","IRAN (ISLAMIC REPUBLIC OF)"],["964","IRAQ"],["353","IRELAND"],["1624","ISLE OF MAN"],["972","ISRAEL"],["5","ITALY"],["1876","JAMAICA"],["81","JAPAN"],["1534","JERSEY"],["962","JORDAN"],["7","KAZAKHSTAN"],["254","KENYA"],["686","KIRIBATI"],["850","KOREA (DEMOCRATIC PEOPLES REPUBLIC OF)"],["82","KOREA (REPUBLIC OF)"],["965","KUWAIT"],["996","KYRGYZSTAN"],["856","LAO PEOPLES DEMOCRATIC REPUBLIC"],["371","LATVIA"],["961","LEBANON"],["266","LESOTHO"],["231","LIBERIA"],["218","LIBYA"],["423","LIECHTENSTEIN"],["370","LITHUANIA"],["352","LUXEMBOURG"],["853","MACAO"],["389","MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)"],["261","MADAGASCAR"],["265","MALAWI"],["60","MALAYSIA"],["960","MALDIVES"],["223","MALI"],["356","MALTA"],["692","MARSHALL ISLANDS"],["596","MARTINIQUE"],["222","MAURITANIA"],["230","MAURITIUS"],["269","MAYOTTE"],["52","MEXICO"],["691","MICRONESIA (FEDERATED STATES OF)"],["373","MOLDOVA (REPUBLIC OF)"],["377","MONACO"],["976","MONGOLIA"],["382","MONTENEGRO"],["1664","MONTSERRAT"],["212","MOROCCO"],["258","MOZAMBIQUE"],["95","MYANMAR"],["264","NAMIBIA"],["674","NAURU"],["977","NEPAL"],["31","NETHERLANDS"],["687","NEW CALEDONIA"],["64","NEW ZEALAND"],["505","NICARAGUA"],["227","NIGER"],["234","NIGERIA"],["683","NIUE"],["15","NORFOLK ISLAND"],["1670","NORTHERN MARIANA ISLANDS"],["47","NORWAY"],["968","OMAN"],["92","PAKISTAN"],["680","PALAU"],["970","PALESTINE, STATE OF"],["507","PANAMA"],["675","PAPUA NEW GUINEA"],["595","PARAGUAY"],["51","PERU"],["63","PHILIPPINES"],["1011","PITCAIRN"],["48","POLAND"],["14","PORTUGAL"],["1787","PUERTO RICO"],["974","QATAR"],["262","REUNION"],["40","ROMANIA"],["8","RUSSIAN FEDERATION"],["250","RWANDA"],["1006","SAINT BARTHELEMY"],["290","SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA"],["1869","SAINT KITTS AND NEVIS"],["1758","SAINT LUCIA"],["1007","SAINT MARTIN (FRENCH PART)"],["508","SAINT PIERRE AND MIQUELON"],["1784","SAINT VINCENT AND THE GRENADINES"],["685","SAMOA"],["378","SAN MARINO"],["239","SAO TOME AND PRINCIPE"],["966","SAUDI ARABIA"],["221","SENEGAL"],["381","SERBIA"],["248","SEYCHELLES"],["232","SIERRA LEONE"],["65","SINGAPORE"],["1721","SINT MAARTEN (DUTCH PART)"],["421","SLOVAKIA"],["386","SLOVENIA"],["677","SOLOMON ISLANDS"],["252","SOMALIA"],["28","SOUTH AFRICA"],["1008","SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS"],["211","SOUTH SUDAN"],["35","SPAIN"],["94","SRI LANKA"],["249","SUDAN"],["597","SURINAME"],["1012","SVALBARD AND JAN MAYEN"],["268","SWAZILAND"],["46","SWEDEN"],["41","SWITZERLAND"],["963","SYRIAN ARAB REPUBLIC"],["886","TAIWAN, PROVINCE OF CHINA[A]"],["992","TAJIKISTAN"],["255","TANZANIA, UNITED REPUBLIC OF"],["66","THAILAND"],["670","TIMOR-LESTE(EAST TIMOR)"],["228","TOGO"],["690","TOKELAU"],["676","TONGA"],["1868","TRINIDAD AND TOBAGO"],["216","TUNISIA"],["90","TURKEY"],["993","TURKMENISTAN"],["1649","TURKS AND CAICOS ISLANDS"],["688","TUVALU"],["256","UGANDA"],["380","UKRAINE"],["971","UNITED ARAB EMIRATES"],["44","UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND"],["2","UNITED STATES OF AMERICA"],["1009","UNITED STATES MINOR OUTLYING ISLANDS"],["598","URUGUAY"],["998","UZBEKISTAN"],["678","VANUATU"],["58","VENEZUELA (BOLIVARIAN REPUBLIC OF)"],["84","VIET NAM"],["1284","VIRGIN ISLANDS (BRITISH)"],["1340","VIRGIN ISLANDS (U.S.)"],["681","WALLIS AND FUTUNA"],["1013","WESTERN SAHARA"],["967","YEMEN"],["260","ZAMBIA"],["263","ZIMBABWE"],["9999","OTHERS"]];

/* code -> label maps and the residency-aware option builders */
const EI_SUBMAP=(()=>{const m={};EI_SUB.forEach(p=>m[p[0]]=p[1]);return m;})();
const EI_CATMAP=(()=>{const m={};EI_CAT.forEach(p=>m[p[0]]=p[1]);return m;})();
const eiIsRes=()=>st0(S.pi&&S.pi.res)==="RES";
/* category options the utility offers, in its order, for the current residency */
const eiCatOpts=isRes=>(isRes?EI_CATORD_R:EI_CATORD_N).map(c=>[c,EI_CATMAP[c]||c]);
/* subcategory options filtered by the row's chosen category + residency */
const eiSubOpts=(cat,isRes)=>{
  let g=(isRes&&EI_SUBG_RES[cat])?EI_SUBG_RES[cat]:(EI_SUBG[cat]||[]);
  return g.map(c=>[c,EI_SUBMAP[c]||c]);
};

/* ---- state ------------------------------------------------------- */
S.ei = S.ei || {
  interest:"",          /* 1    InterestInc (J4) */
  grossAgri:"",         /* 2i   GrossAgriRecpt (J6) */
  expAgri:"",           /* 2ii  ExpIncAgri (J7) */
  unabAgri:"",          /* 2iii UnabAgriLossPrev8 (J8) */
  land:[],              /* 2vi  ExcNetAgriInc.ExcNetAgriIncDtls[] {district,pin,meas,owned,irr} */
  others:[],            /* 3    OthersInc.OthersIncDtls[] {cat,sub,desc,amt} */
  dtaa:[],              /* 4    IncNotChrgblAsPerDTAA.IncNotChrgblAsPerDTAADtls[] {amt,nature,cname,ccode,article,head,trc} */
  passThr:""            /* 5    PassThrIncNotChrgblTax (J46) */
};

/* SEED default rows for the shell add-handler (harmless if the shell keeps its own map). */
SEED["ei.land"]   = SEED["ei.land"]   || {owned:"O", irr:"IRG"};
SEED["ei.others"] = SEED["ei.others"] || {cat:""};
SEED["ei.dtaa"]   = SEED["ei.dtaa"]   || {trc:"", head:""};

const EI_5L = 500000;   /* land-details table threshold: net agri income > Rs.5 lakh (rule 3685) */

/* ---- engine ------------------------------------------------------ */
function engEi(){
  S.ei = S.ei || {};
  const E = S.ei;
  const C = S.C.ei = { income:0 };
  isNew();  /* regime read — no closures apply to Schedule EI (see header) */

  /* line 1 */
  const interest = R(E.interest);                                   /* J4  InterestInc */

  /* line 2 — the agricultural working */
  const grossAgri = R(E.grossAgri);                                 /* J6  GrossAgriRecpt (2i) */
  const expAgri   = R(E.expAgri);                                   /* J7  ExpIncAgri (2ii) */
  const unabAgri  = R(E.unabAgri);                                  /* J8  UnabAgriLossPrev8 (2iii) */
  /* 2iv = MAX(0, Sch BP Sl.No.38 balance income deemed to be from agriculture)
     J9 = MAX(0, sheet12.BalIncDeemedFrmAgri) — published by BP as S.C.bp.a._38 */
  const agri4 = Math.max(0, R(((S.C.bp||{}).a||{})._38 || 0));      /* J9  NetAgriIncRelateToRule7 (2iv) */
  /* 2v = MAX(0, i - ii - iii + iv) — enter nil if loss
     J10 = MAX(SUM(GrossAgri, -ExpenditureAgri, -UnabsorbedAgri, AgriculturalIncome), 0) */
  const net2v = Math.max(0, grossAgri - expAgri - unabAgri + agri4);/* J10 NetAgriIncOrOthrIncRule7 (2v) */

  /* land rows (2vi) — only meaningful when net2v > Rs.5 lakh */
  const land = (E.land||[]).map(r=>({
    district:st0((r||{}).district), pin:st0((r||{}).pin),
    meas:N((r||{}).meas), owned:st0((r||{}).owned), irr:st0((r||{}).irr),
    filled: !!(st0((r||{}).district)||st0((r||{}).pin)||N((r||{}).meas)||st0((r||{}).owned)||st0((r||{}).irr))
  }));

  /* line 3 — other exempt income table; Others (J38) = SUM(OthAmount) */
  const others = (E.others||[]).map(r=>({
    cat:st0((r||{}).cat), sub:st0((r||{}).sub), desc:st0((r||{}).desc),
    amt:R((r||{}).amt)
  }));
  const Others = others.reduce((a,r)=>a+r.amt,0);                   /* J38 Others */

  /* line 4 — DTAA (non-residents); IncChrgblAsPerDTAA (J44) = SUM(AmountOfIncome) */
  const dtaa = (E.dtaa||[]).map(r=>({
    amt:R((r||{}).amt), nature:st0((r||{}).nature), cname:st0((r||{}).cname),
    ccode:st0((r||{}).ccode), article:st0((r||{}).article),
    head:st0((r||{}).head), trc:st0((r||{}).trc)
  }));
  const dtaaTotal = dtaa.reduce((a,r)=>a+r.amt,0);                  /* J44 IncChrgblAsPerDTAA */

  /* line 5 */
  const passThr = R(E.passThr);                                     /* J46 PassThrIncNotChrgblTax */

  /* line 6 = MAX(0, 1 + Dividend(hidden→0) + 2(v) + 3 + 4 + 5)
     J47 = MAX(0, SUM(InterestInc, DividendInc, NetAgriIncOrOthrIncRule7, Others, DTAA, PassThrough)) */
  const total6 = Math.max(0, interest + net2v + Others + dtaaTotal + passThr); /* J47 TotalExemptInc */

  C.interest = interest;
  C.grossAgri = grossAgri; C.expAgri = expAgri; C.unabAgri = unabAgri;
  C.agri4 = agri4;
  C.net2v = net2v;                 /* Sl.No.2v net agricultural income */
  C.land = land;
  C.others = others; C.othersTot = Others;
  C.dtaa = dtaa; C.dtaaTotal = dtaaTotal;
  C.passThr = passThr;
  C.total = total6;
  C.needLand = net2v > EI_5L;

  /* rate effect — publish net agri income for the tax section (partial
     integration; Part B-TI Sl.15 rate-purpose add-back when > Rs.5,000). */
  C.netAgri = net2v;               /* S.C.ei.netAgri */

  /* exempt income adds nothing to Gross Total Income */
  C.income = 0;
}

/* ---- renderer ---------------------------------------------------- */
function secEi(){
  const E = S.ei||{}, C = S.C.ei||{};
  const isRes = eiIsRes();
  let h = "";
  h += note('Schedule EI collects income that is not chargeable to tax. Nothing here is taxed. Two figures still matter: the <b>net agricultural income</b> at Sl. No. 2(v) is carried for rate purposes (partial integration — Part B-TI Sl. 15) when it exceeds &#8377;5,000, and Sl. No. 2(iv) &amp; Sl. No. 5 reconcile to Schedule BP (Sl. No. 38) and Schedule PTI. Exempt income is unaffected by the new tax regime.');

  /* ===== 1 · Interest income ===== */
  h += row("1 · Interest income", inp("ei.interest",{n:1}), {ref:"InterestInc"});

  /* ===== 2 · Agricultural income working ===== */
  h += sub("2 · Agricultural income");
  h += row("i · Gross agricultural receipts (other than income to be excluded under rule 7A, 7B or 8)",
           inp("ei.grossAgri",{n:1}), {ref:"GrossAgriRecpt", ind:1});
  h += row("ii · Expenditure incurred on agriculture", inp("ei.expAgri",{n:1}),
           {ref:"ExpIncAgri", ind:1});
  h += row("iii · Unabsorbed agricultural loss of the previous eight assessment years",
           inp("ei.unabAgri",{n:1}), {ref:"UnabAgriLossPrev8", ind:1});
  h += row("iv · Agricultural income portion under Rule 7/7A/7B(1)/7B(1A)/8 (from Sl. No. 38 of Schedule BP)",
           cell(C.agri4), {ref:"NetAgriIncRelateToRule7", ind:1, hint:"= MAX(0, Sch BP Sl.No.38); auto-pulled"});
  h += row("v · Net agricultural income for the year (i − ii − iii + iv; nil if loss)",
           cell(C.net2v), {ref:"NetAgriIncOrOthrIncRule7", ind:1, req:1});

  /* 2(vi) — land details, only when 2(v) > Rs.5 lakh */
  if(C.needLand){
    h += note("Net agricultural income exceeds &#8377;5,00,000 — the details of each agricultural land are mandatory (Sl. No. 2(vi)).","warn");
    h += grid("ei.land",[
      {k:"district",h:"Name of district",t:"txt",max:125,w:"200px",req:1},
      {k:"pin",h:"PIN code",t:"txt",max:6,w:"100px",req:1,ph:"6-digit"},
      {k:"meas",h:"Measurement (Acre)",t:"num",w:"130px",req:1},
      {k:"owned",h:"Owned / Leased",t:"sel",opts:EI_OWNED,w:"150px",req:1},
      {k:"irr",h:"Irrigated / Rain-fed",t:"sel",opts:EI_IRR,w:"160px",req:1}
    ], E.land||[], {min:"760px", empty:"Add each agricultural land parcel.", add:"Add a land parcel"});
  } else {
    h += note("The land table (Sl. No. 2(vi)) opens only when net agricultural income exceeds &#8377;5,00,000.");
  }

  /* ===== 3 · Other exempt income (repeats — OthersInc.OthersIncDtls[]) ===== */
  h += sub("3 · Other exempt income (including exempt income of a minor child)");
  {
    let t = '<div class="full"><table class="gt" style="min-width:840px"><thead><tr>'+
      '<th>Sl</th><th class="l">Category</th><th class="l">Sub-Category</th>'+
      '<th class="l">Description</th><th class="req">Amount</th><th class="x"></th></tr></thead><tbody>';
    const rows = E.others||[];
    const catOpts = eiCatOpts(isRes);
    if(!rows.length){
      t += '<tr><td class="emp" colspan="6">Nothing entered.</td></tr>';
    } else {
      rows.forEach((r,i)=>{
        const pre = "ei.others."+i+".";
        const subOpts = eiSubOpts(st0(r.cat), isRes);
        t += '<tr><td class="num">'+(i+1)+'</td>'+
          '<td class="l">'+sel(pre+"cat", catOpts, {style:"width:100%"})+'</td>'+
          '<td class="l">'+sel(pre+"sub", subOpts, {style:"width:100%"})+'</td>'+
          '<td>'+inp(pre+"desc",{max:125})+'</td>'+
          '<td>'+inp(pre+"amt",{n:1})+'</td>'+
          '<td class="x"><button data-del="ei.others.'+i+'" title="Remove">'+TRASH+'</button></td></tr>';
      });
      t += '<tr><td class="l" colspan="4"><b>Total (other exempt income)</b></td>'+
        '<td class="num">'+cell(C.othersTot)+'</td><td></td></tr>';
    }
    t += '</tbody></table></div><button class="add" data-add="ei.others">Add an exempt-income row</button>';
    h += t;
    h += note("Choose the Category first; the Sub-Category list is filtered to that category (dependent dropdown) and to the firm's residency. A Description is mandatory for the CBDT Circular / Notification / \"Receipts not in the nature of income\" sub-categories. The row total feeds Sl. No. 3 (Others = J38).");
  }

  /* ===== 4 · Income not chargeable as per DTAA (non-residents only) ===== */
  h += sub("4 · Income claimed not chargeable to tax as per DTAA (non-residents only)");
  h += grid("ei.dtaa",[
    {k:"amt",h:"Amount of income",t:"num",w:"140px",req:1},
    {k:"nature",h:"Nature of income",t:"txt",max:75,w:"170px"},
    {k:"cname",h:"Country name",t:"txt",max:55,w:"160px",req:1},
    {k:"ccode",h:"Country code",t:"sel",opts:EI_CTRY,w:"200px",req:1},
    {k:"article",h:"Article of DTAA",t:"txt",max:16,w:"130px"},
    {k:"head",h:"Head of income",t:"sel",opts:EI_HEAD,w:"200px",req:1},
    {k:"trc",h:"TRC obtained",t:"sel",opts:EI_TRC,w:"120px"}
  ], E.dtaa||[], {min:"1120px", empty:"For non-residents only.", add:"Add a DTAA row",
     foot:[{v:(C.dtaaTotal||0)},{l:1,v:"Total income from DTAA claimed not chargeable (Sl. No. 4 — J44)",span:6}]});

  /* ===== 5 · Pass-through income ===== */
  h += row("5 · Pass through income claimed as not chargeable to tax (Schedule PTI)",
           inp("ei.passThr",{n:1}), {ref:"PassThrIncNotChrgblTax",
           hint:"must equal Sl. No. 1(iv)(a+b+c) of Schedule PTI"});

  /* ===== 6 · Total ===== */
  h += row("6 · Total exempt income (1 + 2(v) + 3 + 4 + 5)", cell(C.total),
           {ref:"TotalExemptInc", req:1, cls:"tot"});

  return h;
}

/* ---- export ------------------------------------------------------ */
function expEi(j){
  const C = S.C.ei||{};
  const o = {};

  /* single figures (written only when non-zero, except the required total) */
  if(C.interest)  put(o,"InterestInc", sg(C.interest));
  if(C.grossAgri) put(o,"GrossAgriRecpt", sg(C.grossAgri));
  if(C.expAgri)   put(o,"ExpIncAgri", sg(C.expAgri));
  if(C.unabAgri)  put(o,"UnabAgriLossPrev8", sg(C.unabAgri));
  if(C.agri4)     put(o,"NetAgriIncRelateToRule7", n0(C.agri4));       /* 2iv */
  /* 2v net agri — computed, mirrors the utility's always-present J10 cell */
  o.NetAgriIncOrOthrIncRule7 = n0(C.net2v);

  /* 2(vi) land table — only when it has rows carrying data */
  const land = (C.land||[]).filter(r=>r.filled);
  if(land.length){
    o.ExcNetAgriInc = { ExcNetAgriIncDtls: land.map(r=>{
      const d = {};
      pf(d,"NameOfDistrict",(sv(r.district)||"NA").slice(0,125));
      pf(d,"PinCode", R(r.pin)||100000);
      pf(d,"MeasurementOfLand", r.meas || 0);
      pf(d,"AgriLandOwnedFlag", sv(r.owned)||"O");
      pf(d,"AgriLandIrrigatedFlag", sv(r.irr)||"IRG");
      return d;
    })};
  }

  /* line 3 — other exempt income; write rows carrying an amount or any field */
  const others = (C.others||[]).filter(r=>r.amt || st0(r.cat) || st0(r.sub) || st0(r.desc));
  if(others.length){
    o.OthersInc = { OthersIncDtls: others.map(r=>{
      const d = {};
      pf(d,"Category", sv(r.cat));
      pf(d,"SubCategory", sv(r.sub));
      pf(d,"Description", sv(r.desc) ? sv(r.desc).slice(0,125) : undefined);
      d.OthAmount = n0(r.amt);
      return d;
    })};
    put(o,"Others", n0(C.othersTot));
  }

  /* line 4 — DTAA */
  const dtaa = (C.dtaa||[]).filter(r=>r.amt || st0(r.cname) || st0(r.ccode));
  if(dtaa.length){
    o.IncNotChrgblAsPerDTAA = { IncNotChrgblAsPerDTAADtls: dtaa.map(r=>{
      const d = {};
      d.AmountOfIncome = n0(r.amt);
      pf(d,"NatureOfIncome", sv(r.nature) ? sv(r.nature).slice(0,75) : undefined);
      pf(d,"CountryName",(sv(r.cname)||"NA").slice(0,55));
      pf(d,"CountryCodeExcludingIndia", sv(r.ccode)||"9999");
      pf(d,"ArticleOfDTAA", sv(r.article) ? sv(r.article).slice(0,16) : undefined);
      pf(d,"HeadOfIncome", sv(r.head)||"OS");
      pf(d,"TRCFlag", sv(r.trc));
      return d;
    })};
    put(o,"IncChrgblAsPerDTAA", n0(C.dtaaTotal));
  }

  /* line 5 */
  if(C.passThr) put(o,"PassThrIncNotChrgblTax", sg(C.passThr));

  /* required total — always present, even at zero */
  o.TotalExemptInc = n0(C.total);

  j.ScheduleEI = o;
}

/* ---- import ------------------------------------------------------ */
function impEi(I5){
  const read = [];
  const EI = I5 && I5.ScheduleEI;
  if(!EI) return read;
  S.ei = S.ei || {};
  const E = S.ei;

  E.interest  = nz(EI.InterestInc);
  E.grossAgri = nz(EI.GrossAgriRecpt);
  E.expAgri   = nz(EI.ExpIncAgri);
  E.unabAgri  = nz(EI.UnabAgriLossPrev8);
  E.passThr   = nz(EI.PassThrIncNotChrgblTax);

  const land = ((EI.ExcNetAgriInc||{}).ExcNetAgriIncDtls)||[];
  E.land = land.map(r=>({
    district:r.NameOfDistrict||"", pin:(r.PinCode!=null?String(r.PinCode):""),
    meas:(r.MeasurementOfLand!=null?String(r.MeasurementOfLand):""),
    owned:r.AgriLandOwnedFlag||"", irr:r.AgriLandIrrigatedFlag||""
  }));

  const others = ((EI.OthersInc||{}).OthersIncDtls)||[];
  E.others = others.map(r=>({
    cat:r.Category||"", sub:r.SubCategory||"", desc:r.Description||"", amt:nz(r.OthAmount)
  }));

  const dtaa = ((EI.IncNotChrgblAsPerDTAA||{}).IncNotChrgblAsPerDTAADtls)||[];
  E.dtaa = dtaa.map(r=>({
    amt:nz(r.AmountOfIncome), nature:r.NatureOfIncome||"", cname:r.CountryName||"",
    ccode:r.CountryCodeExcludingIndia||"", article:r.ArticleOfDTAA||"",
    head:r.HeadOfIncome||"", trc:r.TRCFlag||""
  }));

  read.push("Schedule EI");
  if(E.land.length)   read.push("EI agricultural land");
  if(E.others.length) read.push("EI other exempt income");
  if(E.dtaa.length)   read.push("EI DTAA income");
  return read;
}

/* ---- checks ------------------------------------------------------ */
function chkEi(){
  const out = [], C = S.C.ei||{};

  /* net agri income > 5 lakh requires the land table (rule 3685) */
  if(C.needLand){
    const rows = (C.land||[]).filter(r=>r.filled);
    if(!rows.length){
      out.push({lvl:"err", t:"Schedule EI · agricultural land",
        m:"Net agricultural income exceeds ₹5,00,000, so the details of each agricultural land (Sl. No. 2(vi)) are mandatory.", sec:"ei"});
    } else {
      rows.forEach((r,i)=>{
        if(!st0(r.district) || !/^\d{6}$/.test(st0(r.pin)) || !(r.meas>0) || !st0(r.owned) || !st0(r.irr))
          out.push({lvl:"err", t:"Schedule EI · agricultural land",
            m:"Land row "+(i+1)+": name of district, a 6-digit PIN code, measurement, owned/leased and irrigated/rain-fed are all required.", sec:"ei"});
      });
    }
  }

  /* other exempt income rows — category/sub-category/amount and CBDT description (rules 3705/3710) */
  (C.others||[]).forEach((r,i)=>{
    const any = r.amt || st0(r.cat) || st0(r.sub) || st0(r.desc);
    if(!any) return;
    if(r.amt && !st0(r.cat))
      out.push({lvl:"err", t:"Schedule EI · other exempt income",
        m:"Row "+(i+1)+": an amount is entered but no Category is chosen (Category and Sub-Category are mandatory when amount > 0).", sec:"ei"});
    if(r.amt && st0(r.cat) && !st0(r.sub))
      out.push({lvl:"err", t:"Schedule EI · other exempt income",
        m:"Row "+(i+1)+": an amount is entered but no Sub-Category is chosen.", sec:"ei"});
    if((st0(r.cat)||st0(r.sub)||st0(r.desc)) && !r.amt)
      out.push({lvl:"warn", t:"Schedule EI · other exempt income",
        m:"Row "+(i+1)+": a category/description is set but the amount is nil.", sec:"ei"});
    if(r.amt && EI_DESC_REQ.indexOf(st0(r.sub))>=0 && !st0(r.desc))
      out.push({lvl:"err", t:"Schedule EI · other exempt income",
        m:"Row "+(i+1)+": a Description (the relevant Circular / Notification number or Act/Section reference) is mandatory for this sub-category.", sec:"ei"});
  });
  /* no exemption sub-category chosen more than once (rule 3690) */
  {
    const seen = {};
    (C.others||[]).forEach((r,i)=>{
      const s = st0(r.sub);
      if(!s) return;
      if(seen[s]!=null)
        out.push({lvl:"err", t:"Schedule EI · other exempt income",
          m:"Sub-category \""+s+"\" is selected in more than one row (rows "+(seen[s]+1)+" and "+(i+1)+"); each exemption may be reported once.", sec:"ei"});
      else seen[s]=i;
    });
  }

  /* DTAA rows — required fields and non-resident applicability */
  const dtaaRows = (C.dtaa||[]).filter(r=>r.amt || st0(r.cname) || st0(r.ccode));
  dtaaRows.forEach((r,i)=>{
    if(!r.amt || !st0(r.cname) || !st0(r.ccode) || !st0(r.head))
      out.push({lvl:"err", t:"Schedule EI · DTAA",
        m:"DTAA row "+(i+1)+": amount, country name, country code and head of income are mandatory.", sec:"ei"});
  });
  if(dtaaRows.length && eiIsRes())
    out.push({lvl:"warn", t:"Schedule EI · DTAA",
      m:"The DTAA not-chargeable table (Sl. No. 4) is applicable for non-residents only, but the residential status is Resident.", sec:"ei"});

  /* line 5 should reconcile to Schedule PTI exempt pass-through (rule 3660) —
     guarded cross-read: only warns when the PTI section has published a
     non-zero exempt figure that disagrees, so an unbuilt/empty PTI never
     false-warns. */
  const ptiExempt = ((S.C.other||{}).pti||[]).reduce((a,b)=>a+R((b.exTot||{}).net||0),0);
  if(R(ptiExempt) && R(C.passThr)!==R(ptiExempt))
    out.push({lvl:"warn", t:"Schedule EI · pass-through",
      m:"Sl. No. 5 pass-through income ("+RS(C.passThr)+") should equal the exempt pass-through in Schedule PTI ("+RS(ptiExempt)+").", sec:"ei"});

  return out;
}

/* ---- register ---------------------------------------------------- */
reg({id:"ei", t:"Exempt income", ref:"Schedule EI",
     f:secEi, s:()=>{const C=S.C.ei||{}; const bits=[];
       if(C.total)bits.push(RS(C.total)+" exempt");
       if(C.net2v)bits.push("agri "+RS(C.net2v));
       return bits.join(" · ");},
     eng:engEi, exp:expEi, imp:impEi, chk:chkEi, order:30, corder:30});
