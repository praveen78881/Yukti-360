/* =====================================================================
   ITR-5 · A.Y. 2026-27 — Section "os" — Income from Other Sources
   Built from books/ITR-5/OS.md, books/ITR-5/section_map.json and
   books/ITR-5/enums.json only. Self-contained: state, engine, renderer,
   export, import, checks + one reg(). Cell refs from the book are quoted
   in comments beside each formula. The ITR-3 OS file was read for shell
   idiom/style only — never its numbers, item-numbers, enums or rules.

   ITR-5 FACTS (differ from ITR-2 / ITR-3 — this Schedule OS is stripped of
   the individual-only lines, book §"ITR-5 is filed by firms …"):
   - NO 89A retirement-account block (no NOT89A lines, no 1e 89A rows,
     no item-5a relief-89A line, no NOT89A quarterly row).
   - NO family-pension line and NO 57(iia) deduction (r69 hidden — the
     3a(ii) row does not exist for a firm/AOP/BOI).
   - 1b Interest has only FIVE sub-lines (bi savings, bii deposits,
     biii IT-refund, biv PTI, bv others) — NO provident-fund-proviso
     interest lines (the old 1b(v)-(ix) 10(11)/10(12) lines are absent).
   - NO section-111 accumulated-PF table (the ITR-3 "2c" is gone).
   - NO 56(2)(xiii) life-insurance line (only the 56(2)(xii) fixed line
     survives at 1e).
   - ITR-5 LETTERING for the special-rate sub-items (book §"The shape"):
       2a(i) 115BB · 2a(ii) 115BBJ · 2b 115BBE · 2c any-other-special-rate
       (OthersGrossDtls) · 2d PTI-special-rate (PTIOthersGrossDtls) ·
       2e DTAA (NRIOsDTAA). i.e. what ITR-3 calls 2d/2e/2f is 2c/2d/2e here.
   - Item 2 total (P30) and its DTAA carve-in behave as ITR-5's own book:
       P30 = MAX(0, 2a(i)+2a(ii)+2b+2c+2d + DTAA parts for the normal-rate
       section codes {56i,56i_f,56,562iii,562x}). The DTAA amount that
       belongs to item 1 is REMOVED from item 6 (normal leg) AND ADDED to
       item 2 (special leg) via those section codes — so a dividend taxed
       at a DTAA rate shifts from normal to special without changing the
       schedule total (rules 480-489). This carve-in is ITR-5-specific and
       is NOT the ITR-3 behaviour; it is built from ITR-5's own P30 formula.

   REGIME (books/ITR-5): Schedule OS is not in the regime-closure list; no
   OS income line or section-57 deduction closes under the new regime
   (there is no family-pension cap to switch, unlike an individual return).
   The engine reads isNew() once to keep the contract explicit.

   RESIDENCY drives the special-rate machinery (book §"Residency gate",
   T3 = IF(RES,"RES","NRI")): for a non-resident, only 2e DTAA rows whose
   TRC is "Yes" are counted (N58) and the applicable rate (N60) is blank
   unless the TRC is obtained; for a resident every DTAA row counts. Read
   from S.fs.resStatus ("RES"/"NRI", Part A-General).

   PUBLISHES onto S.C.os for the loss (CYLA/BFLA/CFL) and SI sections:
     S.C.os.income     — signed GTI contribution (item2 + item6 + MAX(0,8e))
     S.C.os.netNormal  — item 6 (signed; <0 ⇒ CYLA 4i OS loss)
     S.C.os.posNormal  — MAX(0, item 6)  (normal-rate OS income → CYLA)
     S.C.os.lossNormal — ABS(MIN(0,item6)) (OS loss available for set-off)
     S.C.os.special    — item 2 total (special-rate OS income → Schedule SI)
     S.C.os.item2c     — 2c OthersGross      (→ SI reconciliation)
     S.C.os.item2d     — 2d PTI special rate (→ SI reconciliation)
     S.C.os.item2e     — 2e DTAA total (TotalAmtTaxUsDTAASchOs → SI DTAA)
     S.C.os.splRows    — 2c rows {code,amt}  (per-code SI reconciliation)
     S.C.os.ptiRows    — 2d rows {code,amt}  (per-code SI reconciliation)
     S.C.os.dtaaRows   — 2e rows (per-row SI DTAA reconciliation)
     S.C.os.raceHorse  — item 8e (signed; <0 ⇒ Schedule CFL 11xvii)
     S.C.os.chargeable — item 9 IncChargeableFrmOthSrc (floored = exported)
     S.C.os.dtaaTotal  — = item2e (→ Schedule SI DTAA rates)
   Compute order 27 (income-head band; after bp/hp/cg, before loss/SI/tax).
   ===================================================================== */

/* ---- state: S.os namespace ---- */
S.os = S.os || {
  /* 1a — dividends */
  divOth:"", div22e:"", div22f:"",
  /* 1b — interest (five sub-lines; PTI (biv) may be negative) */
  intSaving:"", intDeposit:"", intRefund:"", intPTI:"", intOthers:"",
  /* 1c — rental from machinery / plant / buildings */
  rentMach:"",
  /* 1d — 56(2)(x) (five value lines) */
  giftMoney:"", giftImmovWo:"", giftImmovInadeq:"", giftOthWo:"", giftOthInadeq:"",
  /* 1e — any other income (table) + the 56(2)(xii) fixed line */
  others:[],                 /* {nat, amt} — OthersInc.OthersIncDtls[] */
  sum562xii:"",
  /* 2a(i) 115BB · 2a(ii) 115BBJ */
  win115BB:"", win115BBJ:"",
  /* 2b — 115BBE (six 68/69 lines) */
  cc68:"", ui69:"", um69a:"", udi69b:"", ue69c:"", hundi69d:"",
  /* 2c — any other special-rate income (OthersGrossDtls[]) */
  spl:[],                    /* {code, amt} */
  /* 2d — PTI special-rate income (PTIOthersGrossDtls[]) */
  pti:[],                    /* {code, amt} */
  /* 2e — DTAA table (NRIDTAADtlsSchOS[]) */
  dtaa:[],                   /* {amt, nature, itemno, cname, cc, article, treaty, trc, itact} */
  /* 3 — section 57 deductions */
  dExpenses:"", dDep:"", dIntClaimed:"",
  /* 4 / 5 */
  notDed58:"", profit59:"",
  /* 8 — race horses */
  horse:{ receipts:"", ded57:"", notDed58:"", profit59:"" },
  /* 10 — quarterly accrual/receipt (one object of period leaves per row) */
  q:{}
};

/* SEED defaults for the shell's generic add-row handler (keyed by full path) */
SEED["os.others"] = SEED["os.others"] || {};
SEED["os.spl"]    = SEED["os.spl"]    || {code:"5A1ai"};
SEED["os.pti"]    = SEED["os.pti"]    || {code:"PTI_5A1ai"};
SEED["os.dtaa"]   = SEED["os.dtaa"]   || {nature:"1ai", itemno:"56i", trc:"Yes"};

const os_isNRI = ()=> (S.fs && S.fs.resStatus) === "NRI";

/* ---- dropdowns (from books/ITR-5/OS.md · enums.json — never hand-typed) ---- */
/* 2e Col-3 "Item No. in which included" (NatureOfIncome), dropdown G60 */
const OS_DTAA_NAT = [["1ai","1a(i) - Dividend"],["1aiii","1a(iii) - Dividend u/s 2(22)(f)"],
  ["1b","1b - Interest"],["1c","1c - Rental machinery/plant/buildings"],["1d","1d - 56(2)(x)"],
  ["2ai","2a(i) - Winnings 115BB"],["2aii","2a(ii) - Online games 115BBJ"],
  ["2c","2c - Other special-rate"],["2d","2d - PTI special-rate"]];
/* 2e Col-7 "Whether TRC obtained?" (TaxRescertifiedFlag), dropdown K60 */
const OS_TRC = [["Yes","Yes"],["No","No"]];
/* 2e Col-4 country code (CountryCodeExcludingIndia), named range cmb_TRFA.Country */
const OS_CC = [
  ["93","AFGHANISTAN"],["1001","ALAND ISLANDS"],["355","ALBANIA"],["213","ALGERIA"],
  ["684","AMERICAN SAMOA"],["376","ANDORRA"],["244","ANGOLA"],["1264","ANGUILLA"],
  ["1010","ANTARCTICA"],["1268","ANTIGUA AND BARBUDA"],["54","ARGENTINA"],["374","ARMENIA"],
  ["297","ARUBA"],["61","AUSTRALIA"],["43","AUSTRIA"],["994","AZERBAIJAN"],
  ["1242","BAHAMAS"],["973","BAHRAIN"],["880","BANGLADESH"],["1246","BARBADOS"],
  ["375","BELARUS"],["32","BELGIUM"],["501","BELIZE"],["229","BENIN"],
  ["1441","BERMUDA"],["975","BHUTAN"],["591","BOLIVIA (PLURINATIONAL STATE OF)"],["1002","BONAIRE, SINT EUSTATIUS AND SABA"],
  ["387","BOSNIA AND HERZEGOVINA"],["267","BOTSWANA"],["1003","BOUVET ISLAND"],["55","BRAZIL"],
  ["1014","BRITISH INDIAN OCEAN TERRITORY"],["673","BRUNEI DARUSSALAM"],["359","BULGARIA"],["226","BURKINA FASO"],
  ["257","BURUNDI"],["238","CABO VERDE"],["855","CAMBODIA"],["237","CAMEROON"],
  ["1","CANADA"],["1345","CAYMAN ISLANDS"],["236","CENTRAL AFRICAN REPUBLIC"],["235","CHAD"],
  ["56","CHILE"],["86","CHINA"],["9","CHRISTMAS ISLAND"],["672","COCOS (KEELING) ISLANDS"],
  ["57","COLOMBIA"],["270","COMOROS"],["242","CONGO"],["243","CONGO (DEMOCRATIC REPUBLIC OF THE)"],
  ["682","COOK ISLANDS"],["506","COSTA RICA"],["225","COTE DIVOIRE"],["385","CROATIA"],
  ["53","CUBA"],["1015","CURACAO"],["357","CYPRUS"],["420","CZECHIA"],
  ["45","DENMARK"],["253","DJIBOUTI"],["1767","DOMINICA"],["1809","DOMINICAN REPUBLIC"],
  ["593","ECUADOR"],["20","EGYPT"],["503","EL SALVADOR"],["240","EQUATORIAL GUINEA"],
  ["291","ERITREA"],["372","ESTONIA"],["251","ETHIOPIA"],["500","FALKLAND ISLANDS (MALVINAS)"],
  ["298","FAROE ISLANDS"],["679","FIJI"],["358","FINLAND"],["33","FRANCE"],
  ["594","FRENCH GUIANA"],["689","FRENCH POLYNESIA"],["1004","FRENCH SOUTHERN TERRITORIES"],["241","GABON"],
  ["220","GAMBIA"],["995","GEORGIA"],["49","GERMANY"],["233","GHANA"],
  ["350","GIBRALTAR"],["30","GREECE"],["299","GREENLAND"],["1473","GRENADA"],
  ["590","GUADELOUPE"],["1671","GUAM"],["502","GUATEMALA"],["1481","GUERNSEY"],
  ["224","GUINEA"],["245","GUINEA-BISSAU"],["592","GUYANA"],["509","HAITI"],
  ["1005","HEARD ISLAND AND MCDONALD ISLANDS"],["6","HOLY SEE"],["504","HONDURAS"],["852","HONG KONG"],
  ["36","HUNGARY"],["354","ICELAND"],["62","INDONESIA"],["98","IRAN (ISLAMIC REPUBLIC OF)"],
  ["964","IRAQ"],["353","IRELAND"],["1624","ISLE OF MAN"],["972","ISRAEL"],
  ["5","ITALY"],["1876","JAMAICA"],["81","JAPAN"],["1534","JERSEY"],
  ["962","JORDAN"],["7","KAZAKHSTAN"],["254","KENYA"],["686","KIRIBATI"],
  ["850","KOREA (DEMOCRATIC PEOPLES REPUBLIC OF)"],["82","KOREA (REPUBLIC OF)"],["965","KUWAIT"],["996","KYRGYZSTAN"],
  ["856","LAO PEOPLES DEMOCRATIC REPUBLIC"],["371","LATVIA"],["961","LEBANON"],["266","LESOTHO"],
  ["231","LIBERIA"],["218","LIBYA"],["423","LIECHTENSTEIN"],["370","LITHUANIA"],
  ["352","LUXEMBOURG"],["853","MACAO"],["389","MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)"],["261","MADAGASCAR"],
  ["265","MALAWI"],["60","MALAYSIA"],["960","MALDIVES"],["223","MALI"],
  ["356","MALTA"],["692","MARSHALL ISLANDS"],["596","MARTINIQUE"],["222","MAURITANIA"],
  ["230","MAURITIUS"],["269","MAYOTTE"],["52","MEXICO"],["691","MICRONESIA (FEDERATED STATES OF)"],
  ["373","MOLDOVA (REPUBLIC OF)"],["377","MONACO"],["976","MONGOLIA"],["382","MONTENEGRO"],
  ["1664","MONTSERRAT"],["212","MOROCCO"],["258","MOZAMBIQUE"],["95","MYANMAR"],
  ["264","NAMIBIA"],["674","NAURU"],["977","NEPAL"],["31","NETHERLANDS"],
  ["687","NEW CALEDONIA"],["64","NEW ZEALAND"],["505","NICARAGUA"],["227","NIGER"],
  ["234","NIGERIA"],["683","NIUE"],["15","NORFOLK ISLAND"],["1670","NORTHERN MARIANA ISLANDS"],
  ["47","NORWAY"],["968","OMAN"],["92","PAKISTAN"],["680","PALAU"],
  ["970","PALESTINE, STATE OF"],["507","PANAMA"],["675","PAPUA NEW GUINEA"],["595","PARAGUAY"],
  ["51","PERU"],["63","PHILIPPINES"],["1011","PITCAIRN"],["48","POLAND"],
  ["14","PORTUGAL"],["1787","PUERTO RICO"],["974","QATAR"],["262","REUNION"],
  ["40","ROMANIA"],["8","RUSSIAN FEDERATION"],["250","RWANDA"],["1006","SAINT BARTHELEMY"],
  ["290","SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA"],["1869","SAINT KITTS AND NEVIS"],["1758","SAINT LUCIA"],["1007","SAINT MARTIN (FRENCH PART)"],
  ["508","SAINT PIERRE AND MIQUELON"],["1784","SAINT VINCENT AND THE GRENADINES"],["685","SAMOA"],["378","SAN MARINO"],
  ["239","SAO TOME AND PRINCIPE"],["966","SAUDI ARABIA"],["221","SENEGAL"],["381","SERBIA"],
  ["248","SEYCHELLES"],["232","SIERRA LEONE"],["65","SINGAPORE"],["1721","SINT MAARTEN (DUTCH PART)"],
  ["421","SLOVAKIA"],["386","SLOVENIA"],["677","SOLOMON ISLANDS"],["252","SOMALIA"],
  ["28","SOUTH AFRICA"],["1008","SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS"],["211","SOUTH SUDAN"],["35","SPAIN"],
  ["94","SRI LANKA"],["249","SUDAN"],["597","SURINAME"],["1012","SVALBARD AND JAN MAYEN"],
  ["268","SWAZILAND"],["46","SWEDEN"],["41","SWITZERLAND"],["963","SYRIAN ARAB REPUBLIC"],
  ["886","TAIWAN, PROVINCE OF CHINA[A]"],["992","TAJIKISTAN"],["255","TANZANIA, UNITED REPUBLIC OF"],["66","THAILAND"],
  ["670","TIMOR-LESTE(EAST TIMOR)"],["228","TOGO"],["690","TOKELAU"],["676","TONGA"],
  ["1868","TRINIDAD AND TOBAGO"],["216","TUNISIA"],["90","TURKEY"],["993","TURKMENISTAN"],
  ["1649","TURKS AND CAICOS ISLANDS"],["688","TUVALU"],["256","UGANDA"],["380","UKRAINE"],
  ["971","UNITED ARAB EMIRATES"],["44","UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND"],["2","UNITED STATES OF AMERICA"],["1009","UNITED STATES MINOR OUTLYING ISLANDS"],
  ["598","URUGUAY"],["998","UZBEKISTAN"],["678","VANUATU"],["58","VENEZUELA (BOLIVARIAN REPUBLIC OF)"],
  ["84","VIET NAM"],["1284","VIRGIN ISLANDS (BRITISH)"],["1340","VIRGIN ISLANDS (U.S.)"],["681","WALLIS AND FUTUNA"],
  ["1013","WESTERN SAHARA"],["967","YEMEN"],["260","ZAMBIA"],["263","ZIMBABWE"],
  ["9999","OTHERS"]];
/* 2c Nature (OS special-rate section code), OthersGrossDtls[].SourceDescription */
const OS_SPL = [
  ["5A1ai","115A(1)(a)(i)- Dividends interest and income from units purchase in foreign currency"],
  ["5A1aA","115A(1)(a)(A)- Dividend in the case of non-resident received from a unit in an International Financial Services Centre"],
  ["5A1aii","115A(1)(a)(ii)- Interest received from govt/Indian Concerns recived in Foreign Currency"],
  ["5A1aiia","115A(1) (a)(iia) -Interest from Infrastructure Debt Fund"],
  ["5A1aiiaa","115A(1) (a)(iiaa) -Interest as per Sec. 194LC(1)"],
  ["5A1aiiab","115A(1) (a)(iiab) -Interest as per Sec. 194LD"],
  ["5A1aiiac","115A(1)(a)(iiac) -Interest as per Sec. 194LBA"],
  ["5A1aiii","115A(1) (a)(iii) - Income received in respect of units of UTI purchased in Foreign Currency"],
  ["5A1bA","115A(1)(b)(A) & 115A(1)(b)(B)- Income from royalty or fees for technical services received from Government or Indian con"],
  ["5AC1ab","115AC(1)(a) - Income by way of interest on bonds purchased in foreign currency - non-resident"],
  ["5AC1abD","115AC(1)(b) - Income by way of Dividend on GDRs purchased in foreign currency - non-resident"],
  ["5AD1i","115AD(1)(i) -Income (other than Dividend) received by an FII in respect of securities (other than units as per Sec 115AB"],
  ["5AD1iP","115AD(1)(i) -Income received by an FII in respect of bonds or government securities as per Sec 194LD"],
  ["5BBA","115BBA - Tax on non-residents sportsmen or sports associations"],
  ["5BBF","115BBF - Tax on income from patent"],
  ["5BBG","115BBG - Tax on income from transfer of carbon credits"],
  ["5Ea","115E(a) -Investment Income of a Non-Resident Indian -chargeable u/s 115E"],
  ["5AB1a","115AB(1)(a) - Income in respect of units - off -shore fund"],
  ["5A1aiiaaP","115A(1) (a)(iiaa) -Interest as referred in proviso to section 194LC(1)"],
  ["5A1aiiaaSP","115A(1) (a)(iiaa)-Income received by non-resident as referred in second proviso to section 194LC(1)"],
  ["5AD1iDiv","115AD(1)(i) - Income (being dividend) received by an FII in respect of securities (other than units referred to in secti"],
  ["5AD1IBd","115AD(1)(i)(B) - Income (being dividend) received by a specified fund in respect of securities (other than units referre"],
  ["5AD1IB","115AD(1)(i)(B) - Income (other than dividend) received by a specified fund in respect of securities (other than units re"]];
/* 2d Nature (PTI special-rate section code), PTIOthersGrossDtls[].SourceDescription */
const OS_PTI = [
  ["PTI_5A1ai","PTI-115A(1)(a)(i)- Dividends interest and income from units purchase in foreign currency"],
  ["PTI_5A1aA","PTI-115A(1)(a)(A)- PTI-Dividends in the case of non-residents received from a unit in an International Financial Service"],
  ["PTI_5A1aii","PTI-115A(1)(a)(ii)- Interest received from govt/Indian Concerns received in Foreign Currency"],
  ["PTI_5A1aiia","PTI-115A(1) (a)(iia) -Interest from Infrastructure Debt Fund"],
  ["PTI_5A1aiiaa","PTI-115A(1) (a)(iiaa) -Interest as per Sec. 194LC(1)"],
  ["PTI_5A1aiiab","PTI-115A(1) (a)(iiab) -Interest as per Sec. 194LD"],
  ["PTI_5A1aiiac","PTI-115A(1) (a)(iiac) -Interest as per Sec. 194LBA"],
  ["PTI_5A1aiii","PTI-115A(1) (a)(iii) -Income received in respect of units of UTI purchased in foreign currency"],
  ["PTI_5A1bA","PTI-115A(1)(b)(A) & PTI-115A(1)(b)(B)- Income from royalty or fees for technical services received from Government or In"],
  ["PTI_5AC1ab","PTI-115AC(1)(a) -Income by way of interest on bonds purchased in foreign currency - non-resident"],
  ["PTI_5AC1abD","PTI-115AC(1)(b) - Income by way of Dividend on GDRs purchased in foreign currency - non-resident"],
  ["PTI_5AD1i","PTI-115AD(1)(i) -Income (other than Dividend) received by an FII in respect of securities (other than units as per Sec 1"],
  ["PTI_5AD1iP","PTI-115AD(1)(i) -Income received by an FII in respect of bonds or government securities as per Sec 194LD"],
  ["PTI_5BBA","PTI-115BBA - Tax on non-residents sportsmen or sports associations"],
  ["PTI_5BBF","PTI-115BBF - Tax on income from patent"],
  ["PTI_5BBG","PTI-115BBG - Tax on income from transfer of carbon credits"],
  ["PTI_5Ea","PTI-115E(a)-Investment Income of a Non-Resident Indian -chargeable u/s 115E"],
  ["PTI_5AB1a","PTI-115AB(1)(a) - Income in respect of units - off -shore fund"],
  ["PTI_5A1aiiaaP","PTI-115A(1) (a)(iiaa) - Interest as referred in proviso to section 194LC(1)"],
  ["PTI_5A1aiiaaSP","PTI-115A(1) (a)(iiaa) - Income received by non-resident as referred in second proviso to section 194LC(1)"],
  ["PTI_5AD1iDiv","PTI-115AD(1)(i) - Income (being dividend) received by an FII in respect of securities (other than units referred to in s"],
  ["PTI_5AD1IBd","PTI- 115AD(1)(i)(B) - PTI- Income (being dividend) received by a specified fund in respect of securities (other than uni"],
  ["PTI_5AD1IB","PTI-115AD(1)(i)(B) - PTI- Income (other than dividend) received by a specified fund in respect of securities (other than"]];
/* 2e Section of I.T. Act (Col 8), NRIDTAADtlsSchOS[].ItemNoincl */
const OS_DTAA_ITEM = [
  ["56i","56(2)(i)- Dividends"],
  ["56i_f","56(2)(i)- Dividends u/s 2(22)(f)"],
  ["56","56(2)- Interest"],
  ["562iii","56(2)(iii)-Rental income from machinery, plants, buildings etc."],
  ["562x","56(2)(x) - Income under section 56(2)(x)"],
  ["5A1ai","115A(1)(a)(i)- Dividends interest and income from units purchase in foreign currency,"],
  ["5A1aA","115A(1)(a)(A)- Dividend in the case of non-resident received from a unit in an International Financial Services Centre"],
  ["5A1aii","115A(1)(a)(ii)- Interest received from govt/Indian Concerns recived in Foreign Currency,"],
  ["5A1aiia","115A(1) (a)(iia) -Interest from Infrastructure Debt Fund,"],
  ["5A1aiiaa","115A(1) (a)(iiaa) -Interest as per Sec. 194LC(1),"],
  ["5A1aiiab","115A(1) (a)(iiab) -Interest as per Sec. 194LD,"],
  ["5A1aiiac","115A(1)(a)(iiac) -Interest as per Sec. 194LBA,"],
  ["5A1aiii","115A(1) (a)(iii) - Income received in respect of units of UTI purchased in Foreign Currency,"],
  ["5A1bA","115A(1)(b)(A)- Income from royalty or fees for technical services received from Government or Indian concern -chargeable"],
  ["5AB1a","115AB(1)(a) - Income in respect of units - off -shore fund,"],
  ["5AC1ab","115AC(1)(a) - Income by way of interest on bonds purchased in foreign currency - non-resident"],
  ["5AC1abD","115AC(1)(b) - Income by way of Dividend on GDRs purchased in foreign currency - non-resident"],
  ["5AD1i","115AD(1)(i) -Income (other than dividend) received by an FII in respect of securities (other than units as per Sec 115AB"],
  ["5AD1iP","115AD(1)(i) -Income received by an FII in respect of bonds or government securities as per Sec 194LD ,"],
  ["5BBA","115BBA - Tax on non-residents sportsmen or sports associations"],
  ["5BBG","Tax on Transfer of corbon credits"],
  ["5Ea","115E(a) - Investment Income of a Non-Resident Indian chargeable u/s 115E,"],
  ["5BB","Winnings from lotteries, crossword puzzles etc."],
  ["5BBJ","115BBJ - Winnings from online games"],
  ["5BBF","Tax on income from patent"],
  ["5A1aiiaaP","115A(1) (a)(iiaa) -Interest as referred in proviso to section 194LC(1)"],
  ["5A1aiiaaSP","115A(1) (a)(iiaa)-Income received by non-resident as referred in second proviso to section 194LC(1)"],
  ["5AD1iDiv","PTI-115AD(1)(i) - Income (being dividend) received by an FII in respect of securities (other than units referred to in s"],
  ["PTI_5A1ai","PTI - Dividends in the case of non-residents"],
  ["PTI_5A1aA","PTI- Proviso to 115A(1)(a)(A) -Dividends in the case of non-residents received from a unit in an International Financial"],
  ["PTI_5A1aii","PTI - Interest received in the case of non-residents"],
  ["PTI_5A1aiia","PTI - Interest received by non-resident from infrastructure debt fund"],
  ["PTI_5A1aiiaa","PTI - Income received by non-resident as referred in section 194LC(1)"],
  ["PTI_5A1aiiab","PTI - Income received by non-resident as referred in section 194LD"],
  ["PTI_5A1aiiac","PTI - Income received by non-resident as referred in section 194LBA"],
  ["PTI_5A1aiii","PTI - Income from units purchased in foreign currency in the case of non-residents"],
  ["PTI_5A1bA","PTI - PTI-Income from royalty or fees for technical services received from Government or Indian concern -chargeable u/s"],
  ["PTI_5AB1a","PTI - 115AB(1)(a) - Income in respect of units - off -shore fund,"],
  ["PTI_5AC1ab","PTI-115AC(1)(a) -Income by way of interest on bonds purchased in foreign currency - non-resident"],
  ["PTI_5AC1abD","PTI-115AC(1)(b) - Income by way of Dividend on GDRs purchased in foreign currency - non-resident"],
  ["PTI_5AD1i","PTI-115AD(1)(i) -Income(other than dividend) received by an FII in respect of securities (other than units as per Sec 11"],
  ["PTI_5AD1iP","PTI-115AD(1)(i) -Income received by an FII in respect of bonds or government securities as per Sec 194LD"],
  ["PTI_5BBA","PTI-115BBA - Tax on non-residents sportsmen or sports associations"],
  ["PTI_5BBG","PTI-115BBG - Tax on income from transfer of carbon credits"],
  ["PTI_5Ea","PTI -115E(a) - Investment Income of a Non-Resident Indian chargeable u/s 115E,"],
  ["PTI_5BBF","PTI-Tax on income from patent"],
  ["PTI_5A1aiiaaP","PTI-115A(1) (a)(iiaa) - Interest as referred in proviso to section 194LC(1)"],
  ["PTI_5A1aiiaaSP","PTI-115A(1) (a)(iiaa) - Income received by non-resident as referred in second proviso to section 194LC(1)"],
  ["PTI_5AD1iDiv","PTI-115AD(1)(i) - Income (being dividend) received by an FII in respect of securities (other than units referred to in s"],
  ["5AD1IBd","115AD(1)(i)(B) - Income (being dividend) received by a specified fund in respect of securities (other than units referre"],
  ["5AD1IB","115AD(1)(i)(B) - Income (other than dividend) received by a specified fund in respect of securities (other than units re"],
  ["PTI_5AD1IBd","PTI- 115AD(1)(i)(B) - PTI- Income (being dividend) received by a specified fund in respect of securities (other than uni"],
  ["PTI_5AD1IB","PTI-115AD(1)(i)(B) - PTI- Income (other than dividend) received by a specified fund in respect of securities (other than"]];
/* item-10 quarterly rows — ITR-5 has TEN rows, each with the five standard
   DateRange leaves (book §"Item 10"); all ten objects (and their five
   fields) are schema-required, so every one is always emitted. */
const OS_QP = ["Upto15Of6","Up16Of6To15Of9","Up16Of9To15Of12","Up16Of12To15Of3","Up16Of3To31Of3"];
const OS_QROWS = [
  {k:"lottery",   o:"IncFrmLottery",            l:"Winnings from lotteries, crossword puzzles, races, games, gambling, betting etc. u/s 115BB", rec:"2a(i)"},
  {k:"ongames",   o:"IncFrmOnGames",            l:"Winnings from online games u/s 115BBJ", rec:"2a(ii)"},
  {k:"d1ai",      o:"DividendIncUs115BBDA",      l:"3a · Dividend income referred in Sl.No.1a(i)", rec:"1a(i)"},
  {k:"d1aiii",    o:"DividendIncUs115BBDAaiii",  l:"3b · Dividend income referred in Sl.No.1a(iii)", rec:"1a(iii)"},
  {k:"d115a1ai",  o:"DividendIncUs115A1ai",      l:"Dividend u/s 115A(1)(a)(i) @20% other than proviso to 115A(1)(a)(A) (incl. PTI)", rec:"2c & 2d"},
  {k:"d115a1aA",  o:"DividendIncUs115A1aA",      l:"Dividend as per proviso to 115A(1)(a)(A) @10% (incl. PTI)", rec:"2c & 2d"},
  {k:"d115ac",    o:"DividendIncUs115AC",        l:"Dividend u/s 115AC @10% (incl. PTI)", rec:"2c & 2d"},
  {k:"d115ad1id", o:"DividendIncUs115AD1iDiv",   l:"Dividend (other than 115AB units) received by an FII u/s 115AD(1)(i) @20% (incl. PTI)", rec:"2c & 2d"},
  {k:"d115ad1ib", o:"DividendIncUs115AD1IBd",    l:"Dividend (other than 115AB units) received by a specified fund u/s 115AD(1)(i) @10% (incl. PTI)", rec:"2c & 2d"},
  {k:"divdtaa",   o:"DividendDTAA",              l:"Dividend income taxable at DTAA rates", rec:"2e"}
];
const OS_QCOLH = ["Upto 15/6 (i)","16/6–15/9 (ii)","16/9–15/12 (iii)","16/12–15/3 (iv)","16/3–31/3 (v)"];

/* ---- engine ------------------------------------------------------ */
function engOs(){
  S.os = S.os || {};
  const O = S.os;
  const C = S.C.os = { income:0 };
  isNew();  /* regime read — no OS line closes under the new regime (see header) */

  /* ===== item 1 — gross income at normal applicable rates ===== */
  /* 1a (N5) = 1a(i)+1a(ii)+1a(iii) (rule 495) */
  const div_i=R(O.divOth), div_ii=R(O.div22e), div_iii=R(O.div22f);
  const a1 = div_i + div_ii + div_iii;                                     /* DividendGross */
  /* 1b (N9) = SUM(N10:N14) — five lines (rule 490); biv PTI may be negative */
  const bi=R(O.intSaving), bii=R(O.intDeposit), biii=R(O.intRefund), biv=R(O.intPTI), bv=R(O.intOthers);
  const b1 = bi+bii+biii+biv+bv;                                           /* InterestGross */
  /* 1c */
  const c1 = R(O.rentMach);                                                /* RentFromMachPlantBldgs */
  /* 1d (N16) = SUM(N17:N21) (rule 478) — no floor in ITR-5's formula */
  const d_i=R(O.giftMoney), d_ii=R(O.giftImmovWo), d_iii=R(O.giftImmovInadeq),
        d_iv=R(O.giftOthWo), d_v=R(O.giftOthInadeq);
  const d1 = d_i+d_ii+d_iii+d_iv+d_v;                                      /* Tot562x */
  /* 1e (N22) = OthersInc table + 56(2)(xii) fixed line (no family pension in ITR-5) */
  const othersSum = (O.others||[]).reduce((s,r)=>s+R(r.amt),0);
  const x562xii = R(O.sum562xii);
  const e1 = othersSum + x562xii;                                          /* AnyOtherIncome */
  const item1 = a1 + b1 + c1 + d1 + e1;                                    /* 1 (P4) GrossIncChrgblTaxAtAppRate */

  /* ===== item 2 — special rates ===== */
  const s2ai = R(O.win115BB);                                             /* 2a(i) LtryPzzlChrgblUs115BB */
  const s2aii = R(O.win115BBJ);                                           /* 2a(ii) IncChrgblUs115BBJ (r35) */
  /* 2b (N36) = SUM(N37:N42) (rule 500) */
  const b2 = R(O.cc68)+R(O.ui69)+R(O.um69a)+R(O.udi69b)+R(O.ue69c)+R(O.hundi69d); /* IncChrgblUs115BBE */
  /* 2c (N43) = Σ SourceAmount (rules 486, 493) */
  const c2 = (O.spl||[]).reduce((s,r)=>s+R(r.amt),0);                     /* OthersGross */
  /* 2d (N52) = Σ PTI amounts (rule 477) */
  const d2manual = (O.pti||[]).reduce((s,r)=>s+R(r.amt),0);              /* PassThrIncOSChrgblSplRate */
  /* 2d — Schedule PTI reconciliation total (guarded; the "other"/PTI section,
     when built, publishes S.C.other.pti[] with a per-block .os.special leg).
     The coded 2d table is the schema-authoritative source; d2sch is exposed
     for a reconciliation note only, and is nil/ignored when absent. */
  const _oth = S.C.other || {};
  const d2sch = (Array.isArray(_oth.pti)?_oth.pti:[]).reduce((s,bk)=>s+R(((bk||{}).os||{}).special),0);
  const d2 = d2manual;

  /* 2e — DTAA table */
  const nri = os_isNRI();
  const dtaaRows = (O.dtaa||[]).map(r=>{
    const treatyNil = st0(r.treaty).toUpperCase()==="NIL";
    const treaty = treatyNil ? 0 : N(r.treaty);
    const itact  = N(r.itact);
    /* N58 — for an NRI only rows with TRC="Yes" count; a resident counts all */
    const counts = nri ? (st0(r.trc).charAt(0).toUpperCase()==="Y") : true;
    /* N60 applicable rate = lower of treaty (col 6) and I.T.-Act (col 9);
       for an NRI it is blank unless the TRC is obtained (rule 488) */
    const appl = nri ? (counts ? Math.min(treaty,itact) : "") : Math.min(treaty,itact);
    return {amt:R(r.amt), nature:st0(r.nature), itemno:st0(r.itemno), treaty, itact, appl, treatyNil,
            trc:st0(r.trc), counts, cname:st0(r.cname), cc:st0(r.cc), article:st0(r.article)};
  });
  const f2 = dtaaRows.filter(r=>r.counts).reduce((s,r)=>s+r.amt,0);       /* 2e (N58) TotalAmtTaxUsDTAASchOs */
  /* P30 DTAA carve-in — DTAA rows on the normal-rate section codes are added
     into item 2 (having been removed from item 6): {56i,56i_f,56,562iii,562x} */
  const DTAA_SEC1 = ["56i","56i_f","56","562iii","562x"];
  const dtaaSpecial = dtaaRows.filter(r=>r.counts && DTAA_SEC1.indexOf(r.itemno)>=0).reduce((s,r)=>s+r.amt,0);
  /* item 2 (P30) = MAX(0, 2a(i)+2a(ii)+2b+2c+2d + DTAA(normal-rate codes)) (rule 489) */
  const item2 = Math.max(0, s2ai + s2aii + b2 + c2 + d2 + dtaaSpecial);

  /* ===== item 3 — section 57 deductions (NO 57(iia) family pension in ITR-5) ===== */
  const expenses = R(O.dExpenses);                                        /* 3a Expenses */
  const dep = c1>0 ? Math.max(0,R(O.dDep)) : 0;                           /* 3b Depreciation — only if 1c>0 (rule 473) */
  const claimedInt = Math.max(0,R(O.dIntClaimed));                        /* 3c UsrIntExp57 (entered) */
  const divForInt = div_i + div_ii;                                       /* dividend at 1a(i)/1a(ii) (rule 492) */
  const eligInt = divForInt>0 ? Math.min(claimedInt, R(0.20*divForInt)) : 0; /* 3c(i) IntExp57 ≤ 20% (rules 494-495) */
  const totDed = dep + expenses + eligInt;                                /* 3d (N74) = Depreciation+Expenses+IntExp57 (rule 472) */

  /* ===== items 4, 5 ===== */
  const notDed58 = R(O.notDed58);                                         /* 4 AmtNotDeductibleUs58 */
  const profit59 = R(O.profit59);                                         /* 5 ProfitChargTaxUs59 */

  /* ===== item 6 (P77) — net normal-rate income, signed ===== */
  /* DTAA amounts attributable to item 1 (by NatureOfIncome) leave the normal leg */
  const NAT1 = ["1ai","1aiii","1b","1c","1d"];
  const dtaaItem1 = dtaaRows.filter(r=>r.counts && NAT1.indexOf(r.nature)>=0).reduce((s,r)=>s+r.amt,0);
  const item6 = item1 - totDed + Math.max(0,notDed58) + profit59 - dtaaItem1; /* P77 (rules 487-488,507) */

  /* ===== item 7 (P78) = MAX(0, item6) + item2 ===== */
  const item7 = Math.max(0, item6) + item2;                               /* TotOthSrcNoRaceHorse (rule 474) */

  /* ===== item 8 — race horses (P84) ===== */
  const H = O.horse||{};
  const hReceipts=R(H.receipts), hDed57=R(H.ded57), hNot58=R(H.notDed58), hProfit59=R(H.profit59);
  const item8e = hReceipts - hDed57 + hNot58 + hProfit59;                 /* 8e BalanceOwnRaceHorse (signed; <0 → CFL 11xvii) */

  /* ===== item 9 (P85) = item7 + MAX(0, item8e) ===== */
  const item9 = item7 + Math.max(0, item8e);                             /* IncChargeableFrmOthSrc (rule 476) */

  /* ---- expose the working ---- */
  C.a1={i:div_i,ii:div_ii,iii:div_iii,tot:a1};
  C.b1={i:bi,ii:bii,iii:biii,iv:biv,v:bv,tot:b1};
  C.c1=c1;
  C.d1={i:d_i,ii:d_ii,iii:d_iii,iv:d_iv,v:d_v,tot:d1};
  C.e1={others:othersSum, x562xii:x562xii, tot:e1};
  C.item1=item1;
  C.s2ai=s2ai; C.s2aii=s2aii; C.b2=b2;
  C.c2=c2; C.d2=d2; C.d2sch=d2sch; C.f2=f2; C.dtaaRows=dtaaRows; C.dtaaSpecial=dtaaSpecial;
  C.item2=item2;
  C.ded={expenses, dep, claimedInt, eligInt, tot:totDed};
  C.notDed58=notDed58; C.profit59=profit59; C.dtaaItem1=dtaaItem1;
  C.item6=item6; C.item7=item7;
  C.horse={receipts:hReceipts, ded57:hDed57, not58:hNot58, profit59:hProfit59, bal:item8e};
  C.item9=item9;

  /* ---- rolls for the loss (CYLA/BFLA/CFL) and SI sections ---- */
  C.netNormal  = R(item6);                          /* signed; <0 → CYLA 4i OS loss */
  C.posNormal  = Math.max(0, R(item6));             /* normal-rate OS income → CYLA */
  C.lossNormal = Math.abs(Math.min(0, R(item6)));   /* OS loss available for set-off */
  C.special    = R(item2);                          /* special-rate OS income → Schedule SI */
  C.item2c     = R(c2);                             /* 2c OthersGross → SI reconciliation */
  C.item2d     = R(d2);                             /* 2d PTI special rate → SI reconciliation */
  C.item2e     = R(f2);                             /* 2e DTAA total → SI DTAA rates */
  C.splRows    = (O.spl||[]).filter(r=>st0(r.code)||R(r.amt)).map(r=>({code:st0(r.code), amt:R(r.amt)}));
  C.ptiRows    = (O.pti||[]).filter(r=>st0(r.code)||R(r.amt)).map(r=>({code:st0(r.code), amt:R(r.amt)}));
  C.raceHorse  = R(item8e);                         /* signed; <0 → Schedule CFL 11xvii */
  C.chargeable = R(item9);                          /* exported IncChargeableFrmOthSrc (floored) */
  C.dtaaTotal  = R(f2);                             /* → Schedule SI DTAA rates */
  /* GTI contribution — signed on the normal leg so a loss reaches CYLA */
  C.income = R(item2 + item6 + Math.max(0, item8e));
}

/* ---- renderer ---------------------------------------------------- */
function secOs(){
  const O = S.os||{}, C = S.C.os||{};
  let h = "";

  h += note("Please include the income of the specified persons referred to in Schedule SPI while computing the income under this head.");

  /* ===== item 1 — normal-rate income ===== */
  {
    let b = "";
    /* 1a — dividends */
    b += row("1a · Dividends, Gross (i + ii + iii)", cell((C.a1||{}).tot), {ref:"1a", cls:"tot"});
    b += row("Dividend income [other than (ii) and (iii)]", inp("os.divOth",{n:1}), {ind:1, ref:"1a(i)"});
    b += row("Dividend income u/s 2(22)(e)", inp("os.div22e",{n:1}), {ind:1, ref:"1a(ii)"});
    b += row("Dividend income u/s 2(22)(f) — buy-back", inp("os.div22f",{n:1}), {ind:1, ref:"1a(iii)",
      hint:"mandatory if a buy-back capital loss is shown at A(A)/B(A) of Schedule CG"});
    /* 1b — interest (five lines) */
    b += row("1b · Interest, Gross (i … v)", cell((C.b1||{}).tot), {ref:"1b", cls:"tot"});
    b += row("From Savings bank", inp("os.intSaving",{n:1}), {ind:1, ref:"1b(i)"});
    b += row("From Deposits (Bank / Post Office / Co-operative Society)", inp("os.intDeposit",{n:1}), {ind:1, ref:"1b(ii)"});
    b += row("From Income Tax refund", inp("os.intRefund",{n:1}), {ind:1, ref:"1b(iii)"});
    b += row("In the nature of Pass through income / loss", inp("os.intPTI",{n:1}), {ind:1, ref:"1b(iv)", hint:"may be negative"});
    b += row("Others, incl. interest from Companies, NBFCs & HFCs", inp("os.intOthers",{n:1}), {ind:1, ref:"1b(v)"});
    /* 1c */
    b += row("1c · Rental income from machinery, plants, buildings etc., Gross", inp("os.rentMach",{n:1}), {ref:"1c",
      hint:"unlocks 3b depreciation"});
    /* 1d — 56(2)(x) */
    b += row("1d · Income u/s 56(2)(x) chargeable to tax (i … v)", cell((C.d1||{}).tot), {ref:"1d", cls:"tot"});
    b += row("Aggregate sum of money received without consideration", inp("os.giftMoney",{n:1}), {ind:1, ref:"1d(i)"});
    b += row("Immovable property without consideration — stamp duty value", inp("os.giftImmovWo",{n:1}), {ind:1, ref:"1d(ii)"});
    b += row("Immovable property for inadequate consideration — SDV in excess", inp("os.giftImmovInadeq",{n:1}), {ind:1, ref:"1d(iii)"});
    b += row("Any other property without consideration — fair market value", inp("os.giftOthWo",{n:1}), {ind:1, ref:"1d(iv)"});
    b += row("Any other property for inadequate consideration — FMV in excess", inp("os.giftOthInadeq",{n:1}), {ind:1, ref:"1d(v)"});
    /* 1e — any other income */
    b += row("1e · Any other income (table + 56(2)(xii))", cell((C.e1||{}).tot), {ref:"1e", cls:"tot"});
    b += sub("Any other income — specify nature and amount");
    b += grid("os.others",[
      {k:"nat",h:"Nature",t:"txt",max:50,req:1},
      {k:"amt",h:"Amount",t:"num",w:"160px",req:1}
    ], O.others||[], {empty:"No other-income rows.", add:"Add an income row",
       foot:[{l:1,v:"Table total"},{v:(C.e1||{}).others}]});
    b += row("Specified sum received by a unit holder from a business trust u/s 56(2)(xii)", inp("os.sum562xii",{n:1}), {ind:1, ref:"1e"});
    b += row("1 · Gross income chargeable at normal rates (1a+1b+1c+1d+1e)", cell(C.item1), {ref:"1", cls:"tot"});
    h += fold("os_1","1","Income chargeable at normal applicable rates", RS(C.item1||0), b, {def:true});
  }

  /* ===== item 2 — special rates ===== */
  {
    let b = "";
    const nriLbl = os_isNRI() ? " (non-resident — NRI section codes)" : " (resident section codes)";
    b += row("2a(i) · Winnings from lotteries, crossword puzzles, races, card games etc. u/s 115BB", inp("os.win115BB",{n:1}), {ref:"2a(i)"});
    b += row("2a(ii) · Winnings from online games u/s 115BBJ", inp("os.win115BBJ",{n:1}), {ref:"2a(ii)"});
    /* 2b — 115BBE */
    b += row("2b · Income chargeable u/s 115BBE (i … vi)", cell(C.b2), {ref:"2b", cls:"tot"});
    b += row("Cash credits u/s 68", inp("os.cc68",{n:1}), {ind:1, ref:"2b(i)"});
    b += row("Unexplained investments u/s 69", inp("os.ui69",{n:1}), {ind:1, ref:"2b(ii)"});
    b += row("Unexplained money etc. u/s 69A", inp("os.um69a",{n:1}), {ind:1, ref:"2b(iii)"});
    b += row("Undisclosed investments etc. u/s 69B", inp("os.udi69b",{n:1}), {ind:1, ref:"2b(iv)"});
    b += row("Unexplained expenditure etc. u/s 69C", inp("os.ue69c",{n:1}), {ind:1, ref:"2b(v)"});
    b += row("Amount borrowed or repaid on hundi u/s 69D", inp("os.hundi69d",{n:1}), {ind:1, ref:"2b(vi)"});
    /* 2c — other special-rate income */
    b += sub("2c · Any other income chargeable at special rate"+nriLbl);
    b += grid("os.spl",[
      {k:"code",h:"Nature (OS special-rate section code)",t:"sel",opts:OS_SPL,req:1},
      {k:"amt",h:"Amount",t:"num",w:"150px",req:1}
    ], O.spl||[], {min:"760px", empty:"No special-rate rows.", add:"Add a special-rate row",
       foot:[{l:1,v:"2c Total"},{v:C.c2}]});
    /* 2d — PTI special-rate income */
    b += sub("2d · Pass through income from other sources chargeable at special rate"+nriLbl);
    b += grid("os.pti",[
      {k:"code",h:"Nature (PTI special-rate section code)",t:"sel",opts:OS_PTI,req:1},
      {k:"amt",h:"Amount",t:"num",w:"150px",req:1}
    ], O.pti||[], {min:"760px", empty:"No PTI special-rate rows.", add:"Add a PTI row",
       foot:[{l:1,v:"2d Total"},{v:C.d2}]});
    if(R(C.d2sch)!==0 && R(C.d2sch)!==R(C.d2))
      b += note("Schedule PTI reports "+RS(C.d2sch)+" of special-rate pass-through income from other sources; the 2d table above ("+RS(C.d2)+") should reconcile to it.","warn");
    /* 2e — DTAA */
    b += sub("2e · Amount included in 1 and 2 above, chargeable at special rates in India as per DTAA");
    b += note("For a non-resident, a row is counted in the 2e total only if the TRC is obtained (Yes); for a resident, every row is counted. The applicable rate is the lower of the treaty rate and the rate under the Income-tax Act. Enter NIL as the treaty rate if not chargeable.");
    b += grid("os.dtaa",[
      {k:"amt",h:"Amount of income",t:"num",w:"130px",req:1},
      {k:"nature",h:"Item No. in which included",t:"sel",opts:OS_DTAA_NAT,req:1},
      {k:"itemno",h:"Section of I.T. Act",t:"sel",opts:OS_DTAA_ITEM,req:1},
      {k:"cname",h:"Country name",t:"txt",max:50,req:1},
      {k:"cc",h:"Country code (excl. India)",t:"sel",opts:OS_CC,req:1},
      {k:"article",h:"Article of DTAA",t:"txt",max:16,req:1},
      {k:"treaty",h:"Rate as per Treaty (NIL if not chargeable)",t:"txt",max:10,req:1},
      {k:"trc",h:"TRC obtained",t:"sel",opts:OS_TRC},
      {k:"itact",h:"Rate as per I.T. Act",t:"txt",max:10,req:1},
      {k:"appl",h:"Applicable rate [lower of (6),(9)]",t:"calc",f:(r,i)=>{const x=((C.dtaaRows||[])[i]||{}).appl; return x===""?"":x;}}
    ], O.dtaa||[], {min:"1180px", empty:"No DTAA rows.", add:"Add a DTAA row",
       foot:[{l:1,v:"2e Total"},{v:C.f2},{l:1,v:"",span:8}]});
    b += row("2 · Income chargeable at special rates (2a(i)+2a(ii)+2b+2c+2d+2e), floored at nil", cell(C.item2), {ref:"2", cls:"tot"});
    h += fold("os_2","2","Income chargeable at special rates", RS(C.item2||0), b);
  }

  /* ===== item 3 — section 57 deductions ===== */
  {
    const D = C.ded||{};
    let b = "";
    b += row("3a · Expenses / deductions (other than in relation to income at 2)", inp("os.dExpenses",{n:1}), {ref:"3a"});
    b += row("3b · Depreciation", (C.c1>0?inp("os.dDep",{n:1}):cell(0)), {ref:"3b",
      hint:(C.c1>0?"allowed against rental income at 1c":"available only if rental income is offered at 1c")});
    b += row("3c · Interest expenditure on dividend u/s 57(1) — claimed", inp("os.dIntClaimed",{n:1}), {ref:"3c",
      hint:"available only if dividend is offered at 1a(i)/1a(ii); eligible ≤ 20% of that dividend"});
    b += row("3c(i) · Eligible interest expenditure u/s 57(1) — computed", cell(D.eligInt), {ind:1, ref:"3c(i)"});
    b += row("3d · Total deductions (3a+3b+3c(i))", cell(D.tot), {ref:"3d", cls:"tot"});
    h += fold("os_3","3","Deductions under section 57", RS((C.ded||{}).tot||0), b);
  }

  /* ===== items 4-7 ===== */
  {
    let b = "";
    b += row("4 · Amounts not deductible u/s 58", inp("os.notDed58",{n:1}), {ref:"4"});
    b += row("5 · Profits chargeable to tax u/s 59", inp("os.profit59",{n:1}), {ref:"5"});
    if(C.dtaaItem1) b += row("Less: DTAA amounts attributable to item-1 lines", cell(-(C.dtaaItem1||0)), {ind:1, ref:"P77"});
    b += row("6 · Net income at normal rates (1 − 3 + 4 + 5 − DTAA(1)); a loss goes to CYLA 4i", cell(C.item6), {ref:"6", cls:"tot",
      hint:C.item6<0?"a loss — carried to 4i of Schedule CYLA":""});
    b += row("7 · Income from other sources other than race horses (2 + 6; 6 as nil if negative)", cell(C.item7), {ref:"7", cls:"tot"});
    h += fold("os_47","4–7","Net income from other sources", RS(C.item7||0), b, {def:true});
  }

  /* ===== item 8 — race horses ===== */
  {
    const RH = C.horse||{};
    let b = "";
    b += row("8a · Receipts", inp("os.horse.receipts",{n:1}), {ref:"8a"});
    b += row("8b · Deductions u/s 57 in relation to 8a only", inp("os.horse.ded57",{n:1}), {ref:"8b"});
    b += row("8c · Amounts not deductible u/s 58", inp("os.horse.notDed58",{n:1}), {ref:"8c"});
    b += row("8d · Profits chargeable to tax u/s 59", inp("os.horse.profit59",{n:1}), {ref:"8d"});
    b += row("8e · Balance (8a − 8b + 8c + 8d)", cell(RH.bal), {ref:"8e", cls:"tot"});
    if(R(RH.bal)<0) b += note("A negative 8e is carried to Schedule CFL 11xvii (loss from owning and maintaining race horses) and is taken as nil at item 9.");
    h += fold("os_8","8","Income from owning and maintaining race horses", RS((C.horse||{}).bal||0), b);
  }

  /* ===== item 9 ===== */
  h += row("9 · Income under the head Income from other sources (7 + 8e; 8e as nil if negative)",
           cell(C.item9), {ref:"9", cls:"grand"});

  /* ===== item 10 — quarterly accrual/receipt ===== */
  {
    let t = '<div class="full"><table class="gt" style="min-width:960px"><thead><tr>'+
      '<th class="l">Other Source Income</th>'+OS_QCOLH.map(x=>'<th>'+esc(x)+'</th>').join("")+'</tr></thead><tbody>';
    OS_QROWS.forEach(qr=>{
      t += '<tr><td class="l">'+esc(qr.l)+'</td>'+
        OS_QP.map(pk=>'<td>'+inp("os.q."+qr.k+"."+pk,{n:1})+'</td>').join("")+'</tr>';
    });
    t += '</tbody></table></div>';
    let b = note("Quarterly break-up of income that accrues or is received under this head, for section 234C. Each row's quarterly figures must reconcile back to the annual figure it feeds (rules 491, 496–503).");
    b += t;
    h += fold("os_10","10","Information about accrual / receipt of income from Other Sources", "", b);
  }

  return h;
}

/* ---- export ------------------------------------------------------ */
function expOs(j){
  const C = S.C.os||{}, O = S.os||{};

  /* ---- item 3 Deductions (Depreciation, TotDeductions required) ---- */
  const D = C.ded||{};
  const ded = { Depreciation:n0(D.dep), TotDeductions:n0(D.tot) };
  if(D.expenses)   ded.Expenses    = sg(D.expenses);
  if(D.claimedInt) ded.UsrIntExp57 = n0(D.claimedInt);
  if(D.eligInt)    ded.IntExp57    = n0(D.eligInt);

  /* ---- IncOthThanOwnRaceHorse — parent of items 1-7 ---- */
  const a1=C.a1||{}, b1=C.b1||{}, d1=C.d1||{}, e1=C.e1||{};
  const io = {
    GrossIncChrgblTaxAtAppRate: sg(C.item1),
    DividendGross: sg(a1.tot),
    DividendOthThan22e: sg(a1.i),
    Dividend22e: sg(a1.ii),
    InterestGross: sg(b1.tot),
    IntrstFrmSavingBank: sg(b1.i),
    IntrstFrmTermDeposit: sg(b1.ii),
    IntrstFrmIncmTaxRefund: sg(b1.iii),
    NatofPassThrghIncome: sg(b1.iv),
    IntrstFrmOthers: sg(b1.v),
    RentFromMachPlantBldgs: sg(C.c1),
    Tot562x: n0(d1.tot),
    Aggrtvaluewithoutcons562x: sg(d1.i),
    Immovpropwithoutcons562x: sg(d1.ii),
    Immovpropinadeqcons562x: sg(d1.iii),
    Anyotherpropwithoutcons562x: sg(d1.iv),
    Anyotherpropinadeqcons562x: sg(d1.v),
    AnyOtherIncome: sg(e1.tot),
    IncChargeableSpecialRates: n0(C.item2),
    LtryPzzlChrgblUs115BB: sg(C.s2ai),
    IncChrgblUs115BBE: n0(C.b2),
    CashCreditsUs68: sg(R(O.cc68)),
    UnExplndInvstmntsUs69: sg(R(O.ui69)),
    UnExplndMoneyUs69A: sg(R(O.um69a)),
    UnDsclsdInvstmntsUs69B: sg(R(O.udi69b)),
    UnExplndExpndtrUs69C: sg(R(O.ue69c)),
    AmtBrwdRepaidOnHundiUs69D: sg(R(O.hundi69d)),
    OthersGross: n0(C.c2),
    PassThrIncOSChrgblSplRate: n0(C.d2),
    IncChargblSplRateOS: { TotalAmtTaxUsDTAASchOs: n0(C.f2) },
    Deductions: ded,
    BalanceNoRaceHorse: sg(C.item6)
  };
  /* optional scalar lines */
  if(R(O.div22f))    io.Dividend22f = sg(R(O.div22f));
  if(C.s2aii)        io.IncChrgblUs115BBJ = sg(C.s2aii);
  if(R(O.sum562xii)) io.SumRecdPrYrBusTRU562xii = sg(R(O.sum562xii));
  if(R(O.notDed58))  io.AmtNotDeductibleUs58 = sg(C.notDed58);
  if(R(O.profit59))  io.ProfitChargTaxUs59   = sg(C.profit59);
  /* 1e OthersInc array */
  const others = (O.others||[]).filter(r=>st0(r.nat)||R(r.amt));
  if(others.length) io.OthersInc = { OthersIncDtls: others.map(r=>({
    OthNatOfInc:(sv(r.nat)||"NA").slice(0,50), OthAmount:sg(R(r.amt)) })) };
  /* 2c other special-rate rows */
  const spl = (O.spl||[]).filter(r=>st0(r.code)||R(r.amt));
  if(spl.length) io.OthersGrossDtls = spl.map(r=>({SourceDescription:st0(r.code)||"5A1ai", SourceAmount:sg(R(r.amt))}));
  /* 2d PTI special-rate rows */
  const pti = (O.pti||[]).filter(r=>st0(r.code)||R(r.amt));
  if(pti.length) io.PTIOthersGrossDtls = pti.map(r=>({SourceDescription:st0(r.code)||"PTI_5A1ai", SourceAmount:sg(R(r.amt))}));
  /* 2e DTAA rows */
  const dtaa = (C.dtaaRows||[]).filter(r=>r.amt||st0(r.cname)||st0(r.article));
  if(dtaa.length) io.IncChargblSplRateOS.NRIOsDTAA = { NRIDTAADtlsSchOS: dtaa.map(r=>{
    const o = {
      DTAAamt: sg(r.amt),
      NatureOfIncome: st0(r.nature)||"1ai",
      CountryName: (sv(r.cname)||"NA").slice(0,50),
      CountryCodeExcludingIndia: st0(r.cc)||"9999",
      DTAAarticle: (sv(r.article)||"NA").slice(0,16),
      RateAsPerTreaty: R(r.treaty),
      ItemNoincl: st0(r.itemno)||"56i",
      RateAsPerITAct: R(r.itact)
    };
    if(typeof r.appl==="number") o.ApplicableRate = R(r.appl);
    if(r.trc) o.TaxRescertifiedFlag = r.trc;
    return o;
  }) };

  const OS = { IncOthThanOwnRaceHorse: io, TotOthSrcNoRaceHorse: sg(C.item7) };

  /* ---- item 8 race horses (only when the working carries a value) ---- */
  const RH = C.horse||{};
  if(RH.receipts||RH.ded57||RH.not58||RH.profit59){
    const rh = { Receipts:n0(RH.receipts), DeductSec57:n0(RH.ded57), BalanceOwnRaceHorse:sg(RH.bal) };
    if(RH.not58)    rh.AmtNotDeductibleUs58 = sg(RH.not58);
    if(RH.profit59) rh.ProfitChargTaxUs59   = sg(RH.profit59);
    OS.IncFromOwnHorse = rh;
  }

  /* ---- item 9 ---- */
  OS.IncChargeableFrmOthSrc = sg(C.item9);

  /* ---- item 10 quarterly DateRange objects (all ten required, always emitted) ---- */
  const q = O.q||{};
  OS_QROWS.forEach(qr=>{
    const src = q[qr.k]||{};
    const dr = {};
    OS_QP.forEach(pk=>{ dr[pk]=n0(src[pk]); });
    OS[qr.o] = { DateRange: dr };
  });

  put(j,"ScheduleOS",OS);
}

/* ---- import ------------------------------------------------------ */
function impOs(I5){
  const read = [];
  if(!I5 || !I5.ScheduleOS) return read;
  const OS = I5.ScheduleOS, io = OS.IncOthThanOwnRaceHorse||{};
  S.os = S.os || {};
  const O = S.os;

  O.divOth = nz(io.DividendOthThan22e); O.div22e = nz(io.Dividend22e); O.div22f = nz(io.Dividend22f);
  O.intSaving = nz(io.IntrstFrmSavingBank); O.intDeposit = nz(io.IntrstFrmTermDeposit);
  O.intRefund = nz(io.IntrstFrmIncmTaxRefund); O.intPTI = nz(io.NatofPassThrghIncome);
  O.intOthers = nz(io.IntrstFrmOthers);
  O.rentMach = nz(io.RentFromMachPlantBldgs);
  O.giftMoney = nz(io.Aggrtvaluewithoutcons562x); O.giftImmovWo = nz(io.Immovpropwithoutcons562x);
  O.giftImmovInadeq = nz(io.Immovpropinadeqcons562x); O.giftOthWo = nz(io.Anyotherpropwithoutcons562x);
  O.giftOthInadeq = nz(io.Anyotherpropinadeqcons562x);
  O.sum562xii = nz(io.SumRecdPrYrBusTRU562xii);
  O.win115BB = nz(io.LtryPzzlChrgblUs115BB); O.win115BBJ = nz(io.IncChrgblUs115BBJ);
  O.cc68 = nz(io.CashCreditsUs68); O.ui69 = nz(io.UnExplndInvstmntsUs69); O.um69a = nz(io.UnExplndMoneyUs69A);
  O.udi69b = nz(io.UnDsclsdInvstmntsUs69B); O.ue69c = nz(io.UnExplndExpndtrUs69C); O.hundi69d = nz(io.AmtBrwdRepaidOnHundiUs69D);
  O.notDed58 = nz(io.AmtNotDeductibleUs58); O.profit59 = nz(io.ProfitChargTaxUs59);

  const dd = io.Deductions||{};
  O.dExpenses = nz(dd.Expenses); O.dDep = nz(dd.Depreciation); O.dIntClaimed = nz(dd.UsrIntExp57);

  O.others = ((io.OthersInc||{}).OthersIncDtls||[]).map(r=>({nat:r.OthNatOfInc||"", amt:nz(r.OthAmount)}));
  O.spl = (io.OthersGrossDtls||[]).map(r=>({code:r.SourceDescription||"", amt:nz(r.SourceAmount)}));
  O.pti = (io.PTIOthersGrossDtls||[]).map(r=>({code:r.SourceDescription||"", amt:nz(r.SourceAmount)}));
  O.dtaa = (RG(io,"IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS",[])||[]).map(r=>({
    amt:nz(r.DTAAamt), nature:r.NatureOfIncome||"", itemno:r.ItemNoincl||"",
    cname:r.CountryName||"", cc:r.CountryCodeExcludingIndia||"", article:r.DTAAarticle||"",
    treaty:r.RateAsPerTreaty!=null?r.RateAsPerTreaty:"", trc:r.TaxRescertifiedFlag||"",
    itact:r.RateAsPerITAct!=null?r.RateAsPerITAct:""}));

  const rh = OS.IncFromOwnHorse||{};
  O.horse = { receipts:nz(rh.Receipts), ded57:nz(rh.DeductSec57),
              notDed58:nz(rh.AmtNotDeductibleUs58), profit59:nz(rh.ProfitChargTaxUs59) };

  O.q = O.q || {};
  OS_QROWS.forEach(qr=>{
    const dr = (OS[qr.o]||{}).DateRange;
    if(dr){ O.q[qr.k] = O.q[qr.k]||{}; OS_QP.forEach(pk=>{ O.q[qr.k][pk] = nz(dr[pk]); }); }
  });

  read.push("Schedule OS (income from other sources)");
  return read;
}

/* ---- checks ------------------------------------------------------ */
function chkOs(){
  const out = [], C = S.C.os||{}, O = S.os||{};
  const D = C.ded||{};

  /* 3b depreciation only if rental income (1c) is offered (rule 473) */
  if(R(O.dDep)>0 && !(C.c1>0))
    out.push({lvl:"err", t:"Section 57 · depreciation", m:"Depreciation (3b) can be claimed only when rental income from machinery/plant/buildings is offered at 1c.", sec:"os"});

  /* 3c interest expenditure — only against dividend at 1a(i)/1a(ii), and ≤ 20% (rules 492,494-495) */
  const divForInt = (C.a1||{}).i + (C.a1||{}).ii;
  if(R(O.dIntClaimed)>0 && !(divForInt>0))
    out.push({lvl:"err", t:"Section 57 · interest expenditure", m:"Interest expenditure u/s 57(1) (3c) is available only when dividend income is offered at 1a(i) and/or 1a(ii).", sec:"os"});
  else if(R(O.dIntClaimed) > (D.eligInt||0))
    out.push({lvl:"warn", t:"Section 57 · interest expenditure", m:"Interest expenditure u/s 57(1) is restricted to 20% of the dividend income; only "+RS(D.eligInt||0)+" is eligible against "+RS(R(O.dIntClaimed))+" claimed.", sec:"os"});

  /* 2e DTAA — NRI/TRC gate and applicable-rate note (N58/N60) */
  (C.dtaaRows||[]).forEach((r,i)=>{
    if(os_isNRI() && r.amt>0 && !r.counts)
      out.push({lvl:"warn", t:"DTAA row "+(i+1), m:"You are a non-resident and no TRC is obtained for this row, so its "+RS(r.amt)+" is not counted in the 2e DTAA total.", sec:"os"});
    if(r.amt>0 && !r.treatyNil && typeof r.appl==="number" && r.appl===0 && (r.treaty>0 && r.itact>0))
      out.push({lvl:"warn", t:"DTAA row "+(i+1), m:"The applicable rate is the lower of the treaty rate and the Income-tax Act rate.", sec:"os"});
  });

  /* 2e DTAA Col-2 caps — each item-code sum ≤ its parent field (rules 480-487) */
  const capMap = {"1ai":{v:(C.a1||{}).i,l:"1a(i) dividend"},"1aiii":{v:(C.a1||{}).iii,l:"1a(iii) dividend"},
    "1b":{v:(C.b1||{}).tot,l:"1b interest"},"1c":{v:C.c1,l:"1c rental"},"1d":{v:(C.d1||{}).tot,l:"1d 56(2)(x)"},
    "2ai":{v:C.s2ai,l:"2a(i) 115BB"},"2aii":{v:C.s2aii,l:"2a(ii) 115BBJ"},"2c":{v:C.c2,l:"2c other special-rate"},
    "2d":{v:C.d2,l:"2d PTI special-rate"}};
  const bynat = {};
  (C.dtaaRows||[]).forEach(r=>{ if(r.nature) bynat[r.nature]=(bynat[r.nature]||0)+r.amt; });
  Object.keys(bynat).forEach(k=>{
    const cap = capMap[k];
    if(cap && bynat[k] > R(cap.v)+1)
      out.push({lvl:"warn", t:"DTAA vs "+cap.l, m:"The 2e DTAA amounts classified under "+k+" ("+RS(bynat[k])+") exceed the "+cap.l+" figure ("+RS(cap.v)+"); each DTAA item-code total must not exceed its parent line.", sec:"os"});
  });

  /* 115BBF (patent) is resident-only (rules 249, 479) */
  if(os_isNRI()){
    const has5BBF = (O.spl||[]).some(r=>/5BBF/.test(st0(r.code))) || (O.pti||[]).some(r=>/5BBF/.test(st0(r.code)));
    if(has5BBF)
      out.push({lvl:"err", t:"Section 115BBF", m:"Income u/s 115BBF (patent) can be claimed only by a resident; a non-resident cannot show a 115BBF/PTI-115BBF special-rate row.", sec:"os"});
  }

  /* item-10 quarterly reconciliations — the annual-tied rows (rules 491, 496-503) */
  const qsum = k=>OS_QP.reduce((s,pk)=>s+R(((( (O.q||{})[k])||{})[pk])),0);
  const recon = [["lottery",C.s2ai,"2a(i) 115BB winnings"],["ongames",C.s2aii,"2a(ii) 115BBJ online games"],
    ["d1ai",(C.a1||{}).i,"1a(i) dividend"],["d1aiii",(C.a1||{}).iii,"1a(iii) dividend"]];
  recon.forEach(([k,ann,lbl])=>{
    const q = qsum(k);
    if((q||ann) && q!==R(ann))
      out.push({lvl:"warn", t:"Quarterly break-up", m:"The quarterly break-up for "+lbl+" ("+RS(q)+") does not equal the annual figure ("+RS(ann)+").", sec:"os"});
  });

  /* 1a(iii) 2(22)(f) mandatory if a buy-back capital loss is shown in Schedule CG (rule 446) */
  const cg = S.C.cg||{};
  if(cg.buyBackLoss && R(cg.buyBackLoss)<0 && !(R(O.div22f)>0))
    out.push({lvl:"warn", t:"Dividend u/s 2(22)(f)", m:"A buy-back capital loss is shown in Schedule CG, so dividend income u/s 2(22)(f) is required at 1a(iii).", sec:"os"});

  /* race-horse loss goes to CFL */
  if(R((C.horse||{}).bal)<0)
    out.push({lvl:"ok", t:"Race horses", m:"The race-horse balance (8e) is a loss of "+RS((C.horse||{}).bal)+"; it is carried to Schedule CFL 11xvii and taken as nil at item 9.", sec:"os"});

  /* item-6 loss to CYLA */
  if(R(C.item6)<0)
    out.push({lvl:"ok", t:"Other sources loss", m:"Net income at normal rates (item 6) is a loss of "+RS(C.item6)+"; it is available for set-off in Schedule CYLA (4i).", sec:"os"});

  return out;
}

/* ---- register ---------------------------------------------------- */
reg({id:"os", t:"Other sources", ref:"Schedule OS",
     f:secOs,
     s:()=>{ const C=S.C.os||{}; if(C.income==null) return "";
       return C.income<0 ? "Loss "+CR(-C.income) : (C.chargeable ? "Income "+CR(C.chargeable) : ""); },
     eng:engOs, exp:expOs, imp:impOs, chk:chkOs, order:27, corder:27});
