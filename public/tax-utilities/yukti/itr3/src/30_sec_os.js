/* =====================================================================
   ITR-3 · Section "os" — Income from Other Sources
   Book: books/ITR-3/OS.md   ·   Schema block: ScheduleOS
   Compute order: 16 (an income head; before losses / deductions / tax).

   REGIME (books/ITR-3/REGIME.md): Schedule OS is NOT in the 115BAC closure
   list. Every income line and every section-57 deduction here is available
   under both regimes — the new regime closes concessions on the deduction
   side (Chapter VI-A, HP self-occupied interest, salary allowances …), none
   of which live in OS. The one regime-touched item, the family-pension
   deduction u/s 57(iia), is capped at MIN(1/3, ₹25,000) in BOTH regimes per
   the book's J88 (bacValue=1) and the schema's max-25000 on DeductionUs57iia,
   so it does not close. This section therefore carries NO regime-gated field:
   it renders and computes identically with isNew() true or false. The engine
   still reads isNew() once to keep the contract explicit.

   GTI CONTRIBUTION (S.C.os.income): the head figure = item 2 (special rates)
   + item 6 (net normal, signed — a loss here is negative and flows to CYLA)
   + MAX(0, item 8e race-horse). This is the schedule's item-9 IncChargeable
   but kept SIGNED on the normal-rate leg so the loss section can set it off;
   the exported IncChargeable floors item 6 at nil exactly as the book's L98/
   L105 require. Extra rolls exposed for other sections:
     S.C.os.netNormal   — item 6 (signed; <0 ⇒ CYLA OS loss)
     S.C.os.special     — item 2 total (special-rate OS income → Schedule SI)
     S.C.os.raceHorse   — item 8e (signed; <0 ⇒ Schedule CFL 10xii)
     S.C.os.chargeable  — item 9 IncChargeable (floored, = exported figure)
     S.C.os.dtaaTotal   — 2f TotalAmtTaxUsDTAASchOs (→ Schedule SI DTAA rates)
   ===================================================================== */

/* ---- state ------------------------------------------------------- */
S.os = S.os || {
  /* 1a — dividends */
  divOth:"", div22e:"", div22f:"",
  /* 1b — interest (nine sub-lines; PTI interest may be negative) */
  intSaving:"", intDeposit:"", intRefund:"", intPTI:"",
  int10_11_1:"", int10_11_2:"", int10_12_1:"", int10_12_2:"", intOthers:"",
  /* 1c — rental from machinery/plant/buildings */
  rentMach:"",
  /* 1d — 56(2)(x), total floored at zero */
  giftMoney:"", giftImmovWo:"", giftImmovInadeq:"", giftOthWo:"", giftOthInadeq:"",
  /* 1e — any other income */
  familyPension:"",
  others:[],                 /* {nat, amt} — OthersInc.OthersIncDtls[] */
  not89aUS:"", not89aUK:"", not89aCA:"",
  not89aOther:"", not89aPrYr:"", sum562xii:"", sum562xiii:"",
  /* 2a — 115BB / 115BBJ */
  win115BB:"", win115BBJ:"",
  /* 2b — 115BBE (six 68/69 lines, total floored at zero) */
  cc68:"", ui69:"", um69a:"", udi69b:"", ue69c:"", hundi69d:"",
  /* 2c — accumulated PF taxable u/s 111 */
  pf111:[],                  /* {ay, incBenefit, taxBenefit} */
  /* 2d / 2e — special-rate source arrays */
  spl:[],                    /* {code, amt} — OthersGrossDtls[] */
  pti:[],                    /* {code, amt} — PTIOthersGrossDtls[] */
  /* 2f — DTAA table */
  dtaa:[],                   /* {amt, nature, itemno, natdesc, cname, cc, article, treaty, trc, itact} */
  /* 3 — section 57 deductions */
  dExpenses:"", dDep:"", dIntClaimed:"",
  /* 4 / 5 / 5a */
  notDed58:"", profit59:"", relief89a:"",
  /* 8 — race horses */
  horse:{ receipts:"", ded57:"", notDed58:"", profit59:"" },
  /* 10 — quarterly accrual/receipt (one object of period leaves per income type) */
  q:{}
};

/* SEED defaults for the shell's generic add-row handler (keyed by full path) */
SEED["os.others"]  = SEED["os.others"]  || {};
SEED["os.pf111"]   = SEED["os.pf111"]   || {ay:"2025-26"};
SEED["os.spl"]     = SEED["os.spl"]     || {code:"5A1ai"};
SEED["os.pti"]     = SEED["os.pti"]     || {code:"PTI_5A1ai"};
SEED["os.dtaa"]    = SEED["os.dtaa"]    || {trc:"Y", nature:"1ai", itemno:"56i"};

/* ---- dropdowns (from books/ITR-3/enums.json — never hand-typed) ---- */
const OS_NOT89A = [["US","United States"],["UK","United Kingdom"],["CA","Canada"]];
const OS_PF_AY  = [["2000-01","2000-01"],["2001-02","2001-02"],["2002-03","2002-03"],["2003-04","2003-04"],
  ["2004-05","2004-05"],["2005-06","2005-06"],["2006-07","2006-07"],["2007-08","2007-08"],["2008-09","2008-09"],
  ["2009-10","2009-10"],["2010-11","2010-11"],["2011-12","2011-12"],["2012-13","2012-13"],["2013-14","2013-14"],
  ["2014-15","2014-15"],["2015-16","2015-16"],["2016-17","2016-17"],["2017-18","2017-18"],["2018-19","2018-19"],
  ["2019-20","2019-20"],["2020-21","2020-21"],["2021-22","2021-22"],["2022-23","2022-23"],["2023-24","2023-24"],
  ["2024-25","2024-25"],["2025-26","2025-26"]];
/* 2d — NRI special-rate sections (OthersGrossDtls[].SourceDescription) */
const OS_SPL = [["5A1ai","115A(1)(a)(i) - Dividends, interest & units in foreign currency"],
  ["5A1aA","115A(1)(a)(A) - Dividend from a unit in an IFSC (non-resident)"],
  ["5A1aii","115A(1)(a)(ii) - Interest from govt/Indian concerns in foreign currency"],
  ["5A1aiia","115A(1)(a)(iia) - Interest from Infrastructure Debt Fund"],
  ["5A1aiiaa","115A(1)(a)(iiaa) - Interest u/s 194LC(1)"],
  ["5A1aiiab","115A(1)(a)(iiab) - Interest u/s 194LD"],
  ["5A1aiiac","115A(1)(a)(iiac) - Interest u/s 194LBA"],
  ["5A1aiii","115A(1)(a)(iii) - Income from UTI units purchased in foreign currency"],
  ["5A1bA","115A(1)(b) - Royalty / fees for technical services"],
  ["5AC1ab","115AC(1)(a) - Interest on bonds purchased in foreign currency (non-resident)"],
  ["5AC1abD","115AC(1)(b) - Dividend on GDRs purchased in foreign currency (non-resident)"],
  ["5ACA1a","115ACA(1)(a) - Income from GDR purchased in foreign currency (resident)"],
  ["5AD1i","115AD(1)(i) - FII income other than dividend"],
  ["5AD1iP","115AD(1)(i) - FII income on bonds / govt securities (194LD)"],
  ["5BBA","115BBA - Non-resident sportsmen or sports associations"],
  ["5BBF","115BBF - Income from patent"],
  ["5BBG","115BBG - Transfer of carbon credits"],
  ["5Ea","115E(a) - Investment income"],
  ["5A1aiiaaP","115A(1)(a)(iiaa) - Interest per proviso to 194LC(1)"],
  ["5A1aiiaa2P","115A(1)(a)(iiaa) - Interest per second proviso to 194LC(1)"],
  ["5AD1iDiv","115AD(1)(i) - FII dividend income"]];
/* 2e — PTI NRI special-rate sections (PTIOthersGrossDtls[].SourceDescription) */
const OS_PTI = [["PTI_5A1ai","PTI 115A(1)(a)(i) - Dividends, interest & units in foreign currency"],
  ["PTI_5A1aA","PTI 115A(1)(a)(A) - Dividend from a unit in an IFSC (non-resident)"],
  ["PTI_5A1aii","PTI 115A(1)(a)(ii) - Interest in foreign currency"],
  ["PTI_5A1aiia","PTI 115A(1)(a)(iia) - Interest from Infrastructure Debt Fund"],
  ["PTI_5A1aiiaa","PTI 115A(1)(a)(iiaa) - Interest u/s 194LC(1)"],
  ["PTI_5A1aiiab","PTI 115A(1)(a)(iiab) - Interest u/s 194LD"],
  ["PTI_5A1aiiac","PTI 115A(1)(a)(iiac) - Interest u/s 194LBA"],
  ["PTI_5A1aiii","PTI 115A(1)(a)(iii) - Income from UTI units in foreign currency"],
  ["PTI_5A1bA","PTI 115A(1)(b) - Royalty / fees for technical services"],
  ["PTI_5AC1ab","PTI 115AC(1)(a) - Interest on bonds in foreign currency"],
  ["PTI_5AC1abD","PTI 115AC(1)(b) - Dividend on GDRs in foreign currency"],
  ["PTI_5ACA1a","PTI 115ACA(1)(a) - Income from GDR (resident)"],
  ["PTI_5AD1i","PTI 115AD(1)(i) - FII income other than dividend"],
  ["PTI_5AD1iP","PTI 115AD(1)(i) - FII income on bonds / govt securities (194LD)"],
  ["PTI_5BBA","PTI 115BBA - Non-resident sportsmen / sports associations"],
  ["PTI_5A1aiiaaP","PTI 115A(1)(a)(iiaa) - Interest per proviso to 194LC(1)"],
  ["PTI_5A1aiiaa2P","PTI 115A(1)(a)(iiaa) - Interest per second proviso to 194LC(1)"],
  ["PTI_5BBF","PTI 115BBF - Income from patent"],
  ["PTI_5BBG","PTI 115BBG - Transfer of carbon credits"],
  ["PTI_5Ea","PTI 115E(a) - Investment income"],
  ["PTI_5AD1iDiv","PTI 115AD(1)(i) - FII dividend income"]];
/* 2f — "Item No. in which included" classifier (NRIDTAADtlsSchOS[].NatureOfIncome) */
const OS_DTAA_NAT = [["1ai","1a(i) - Dividend"],["1aiii","1a(iii) - Dividend 2(22)(f)"],
  ["1b","1b - Interest"],["1c","1c - Rental machinery/plant/buildings"],["1d","1d - 56(2)(x)"],
  ["2ai","2a(i) - Winnings 115BB"],["2aii","2a(ii) - Online games 115BBJ"],
  ["2d","2d - Other special-rate"],["2e","2e - PTI special-rate"]];
/* 2f — section-code classifier (NRIDTAADtlsSchOS[].ItemNoincl); domestic + special heads */
const OS_DTAA_ITEM = [["56i","56(2)(i) - Dividends"],["56i_f","56(2)(i) - Dividends u/s 2(22)(f)"],
  ["56","56(2) - Interest"],["562iii","56(2)(iii) - Rental income"],["562x","56(2)(x)"],
  ["5A1ai","115A(1)(a)(i)"],["5A1aA","115A(1)(a)(A)"],["5A1aii","115A(1)(a)(ii)"],
  ["5A1aiia","115A(1)(a)(iia)"],["5A1aiiaa","115A(1)(a)(iiaa)"],["5A1aiiab","115A(1)(a)(iiab)"],
  ["5A1aiiac","115A(1)(a)(iiac)"],["5A1aiii","115A(1)(a)(iii)"],["5A1bA","115A(1)(b)"],
  ["5AD1i","115AD(1)(i)"],["5AC1ab","115AC(1)(a)"],["5AC1abD","115AC(1)(b)"],["5BBA","115BBA"],
  ["5BB","115BB"],["5BBJ","115BBJ"],["5BBG","115BBG"],["5BBF","115BBF"],["5Ea","115E(a)"],
  ["5ACA1a","115ACA(1)(a)"]];
/* 2f — 250 country codes (CountryCodeExcludingIndia) from enums.json (id:name) */
const OS_CC = [["93","AFGHANISTAN"],["1001","ALAND ISLANDS"],["355","ALBANIA"],["213","ALGERIA"],
  ["684","AMERICAN SAMOA"],["376","ANDORRA"],["244","ANGOLA"],["1264","ANGUILLA"],["1010","ANTARCTICA"],
  ["1268","ANTIGUA AND BARBUDA"],["54","ARGENTINA"],["374","ARMENIA"],["297","ARUBA"],["61","AUSTRALIA"],
  ["43","AUSTRIA"],["994","AZERBAIJAN"],["1242","BAHAMAS"],["973","BAHRAIN"],["880","BANGLADESH"],
  ["1246","BARBADOS"],["375","BELARUS"],["32","BELGIUM"],["501","BELIZE"],["229","BENIN"],["1441","BERMUDA"],
  ["975","BHUTAN"],["591","BOLIVIA"],["1002","BONAIRE"],["387","BOSNIA AND HERZEGOVINA"],["267","BOTSWANA"],
  ["1003","BOUVET ISLAND"],["55","BRAZIL"],["1014","BRITISH INDIAN OCEAN TERRITORY"],["673","BRUNEI DARUSSALAM"],
  ["359","BULGARIA"],["226","BURKINA FASO"],["257","BURUNDI"],["238","CABO VERDE"],["855","CAMBODIA"],
  ["237","CAMEROON"],["1","CANADA"],["1345","CAYMAN ISLANDS"],["236","CENTRAL AFRICAN REPUBLIC"],["235","CHAD"],
  ["56","CHILE"],["86","CHINA"],["9","CHRISTMAS ISLAND"],["672","COCOS (KEELING) ISLANDS"],["57","COLOMBIA"],
  ["270","COMOROS"],["242","CONGO"],["243","CONGO (DRC)"],["682","COOK ISLANDS"],["506","COSTA RICA"],
  ["225","COTE DIVOIRE"],["385","CROATIA"],["53","CUBA"],["1015","CURACAO"],["357","CYPRUS"],["420","CZECHIA"],
  ["45","DENMARK"],["253","DJIBOUTI"],["1767","DOMINICA"],["1809","DOMINICAN REPUBLIC"],["593","ECUADOR"],
  ["20","EGYPT"],["503","EL SALVADOR"],["240","EQUATORIAL GUINEA"],["291","ERITREA"],["372","ESTONIA"],
  ["251","ETHIOPIA"],["500","FALKLAND ISLANDS"],["298","FAROE ISLANDS"],["679","FIJI"],["358","FINLAND"],
  ["33","FRANCE"],["594","FRENCH GUIANA"],["689","FRENCH POLYNESIA"],["1004","FRENCH SOUTHERN TERRITORIES"],
  ["241","GABON"],["220","GAMBIA"],["995","GEORGIA"],["49","GERMANY"],["233","GHANA"],["350","GIBRALTAR"],
  ["30","GREECE"],["299","GREENLAND"],["1473","GRENADA"],["590","GUADELOUPE"],["1671","GUAM"],["502","GUATEMALA"],
  ["1481","GUERNSEY"],["224","GUINEA"],["245","GUINEA-BISSAU"],["592","GUYANA"],["509","HAITI"],
  ["1005","HEARD ISLAND"],["6","HOLY SEE"],["504","HONDURAS"],["852","HONG KONG"],["36","HUNGARY"],
  ["354","ICELAND"],["62","INDONESIA"],["98","IRAN"],["964","IRAQ"],["353","IRELAND"],["1624","ISLE OF MAN"],
  ["972","ISRAEL"],["5","ITALY"],["1876","JAMAICA"],["81","JAPAN"],["1534","JERSEY"],["962","JORDAN"],
  ["7","KAZAKHSTAN"],["254","KENYA"],["686","KIRIBATI"],["850","KOREA (DPR)"],["82","KOREA (REPUBLIC)"],
  ["965","KUWAIT"],["996","KYRGYZSTAN"],["856","LAO PDR"],["371","LATVIA"],["961","LEBANON"],["266","LESOTHO"],
  ["231","LIBERIA"],["218","LIBYA"],["423","LIECHTENSTEIN"],["370","LITHUANIA"],["352","LUXEMBOURG"],
  ["853","MACAO"],["389","MACEDONIA"],["261","MADAGASCAR"],["265","MALAWI"],["60","MALAYSIA"],["960","MALDIVES"],
  ["223","MALI"],["356","MALTA"],["692","MARSHALL ISLANDS"],["596","MARTINIQUE"],["222","MAURITANIA"],
  ["230","MAURITIUS"],["269","MAYOTTE"],["52","MEXICO"],["691","MICRONESIA"],["373","MOLDOVA"],["377","MONACO"],
  ["976","MONGOLIA"],["382","MONTENEGRO"],["1664","MONTSERRAT"],["212","MOROCCO"],["258","MOZAMBIQUE"],
  ["95","MYANMAR"],["264","NAMIBIA"],["674","NAURU"],["977","NEPAL"],["31","NETHERLANDS"],["687","NEW CALEDONIA"],
  ["64","NEW ZEALAND"],["505","NICARAGUA"],["227","NIGER"],["234","NIGERIA"],["683","NIUE"],["15","NORFOLK ISLAND"],
  ["1670","NORTHERN MARIANA ISLANDS"],["47","NORWAY"],["968","OMAN"],["92","PAKISTAN"],["680","PALAU"],
  ["970","PALESTINE"],["507","PANAMA"],["675","PAPUA NEW GUINEA"],["595","PARAGUAY"],["51","PERU"],
  ["63","PHILIPPINES"],["1011","PITCAIRN"],["48","POLAND"],["14","PORTUGAL"],["1787","PUERTO RICO"],
  ["974","QATAR"],["262","REUNION"],["40","ROMANIA"],["8","RUSSIAN FEDERATION"],["250","RWANDA"],
  ["1006","SAINT BARTHELEMY"],["290","SAINT HELENA"],["1869","SAINT KITTS AND NEVIS"],["1758","SAINT LUCIA"],
  ["1007","SAINT MARTIN"],["508","SAINT PIERRE AND MIQUELON"],["1784","SAINT VINCENT"],["685","SAMOA"],
  ["378","SAN MARINO"],["239","SAO TOME AND PRINCIPE"],["966","SAUDI ARABIA"],["221","SENEGAL"],["381","SERBIA"],
  ["248","SEYCHELLES"],["232","SIERRA LEONE"],["65","SINGAPORE"],["1721","SINT MAARTEN"],["421","SLOVAKIA"],
  ["386","SLOVENIA"],["677","SOLOMON ISLANDS"],["252","SOMALIA"],["28","SOUTH AFRICA"],
  ["1008","SOUTH GEORGIA"],["211","SOUTH SUDAN"],["35","SPAIN"],["94","SRI LANKA"],["249","SUDAN"],
  ["597","SURINAME"],["1012","SVALBARD AND JAN MAYEN"],["268","SWAZILAND"],["46","SWEDEN"],["41","SWITZERLAND"],
  ["963","SYRIAN ARAB REPUBLIC"],["886","TAIWAN"],["992","TAJIKISTAN"],["255","TANZANIA"],["66","THAILAND"],
  ["670","TIMOR-LESTE"],["228","TOGO"],["690","TOKELAU"],["676","TONGA"],["1868","TRINIDAD AND TOBAGO"],
  ["216","TUNISIA"],["90","TURKEY"],["993","TURKMENISTAN"],["1649","TURKS AND CAICOS ISLANDS"],["688","TUVALU"],
  ["256","UGANDA"],["380","UKRAINE"],["971","UNITED ARAB EMIRATES"],["44","UNITED KINGDOM"],
  ["2","UNITED STATES OF AMERICA"],["1009","US MINOR OUTLYING ISLANDS"],["598","URUGUAY"],["998","UZBEKISTAN"],
  ["678","VANUATU"],["58","VENEZUELA"],["84","VIET NAM"],["1284","VIRGIN ISLANDS (BRITISH)"],
  ["1340","VIRGIN ISLANDS (US)"],["681","WALLIS AND FUTUNA"],["1013","WESTERN SAHARA"],["967","YEMEN"],
  ["260","ZAMBIA"],["263","ZIMBABWE"],["9999","OTHERS"]];
const OS_TRC = [["Y","Yes"],["N","No"]];

/* item-10 quarterly rows: schema object, its five period leaves (two rows use
   Upto15Of9 where the rest use Up16Of6To15Of9), and the screen label */
const OS_QP_STD = ["Upto15Of6","Up16Of6To15Of9","Up16Of9To15Of12","Up16Of12To15Of3","Up16Of3To31Of3"];
const OS_QP_ALT = ["Upto15Of6","Upto15Of9","Up16Of9To15Of12","Up16Of12To15Of3","Up16Of3To31Of3"];
const OS_QROWS = [
  {k:"lottery",      o:"IncFrmLottery",           p:OS_QP_STD, req:1, l:"Winnings from lotteries, crossword puzzles, races, games, gambling, betting etc. [2(24)(ix)]"},
  {k:"ongames",      o:"IncFrmOnGames",           p:OS_QP_ALT, req:0, l:"Winnings from online games u/s 115BBJ"},
  {k:"d115bbda",     o:"DividendIncUs115BBDA",     p:OS_QP_STD, req:1, l:"3a · Dividend income referred in Sl.No.1a(i)"},
  {k:"d115bbdaaiii", o:"DividendIncUs115BBDAaiii", p:OS_QP_STD, req:1, l:"3b · Dividend income referred in Sl.No.1a(iii)"},
  {k:"d115a1ai",     o:"DividendIncUs115A1ai",     p:OS_QP_STD, req:1, l:"Dividend u/s 115A(1)(a)(i) other than proviso @20% (incl. PTI)"},
  {k:"d115a1aA",     o:"DividendIncUs115A1aA",     p:OS_QP_ALT, req:0, l:"Dividend as per proviso to 115A(1)(a)(A) @10% (incl. PTI)"},
  {k:"d115ac",       o:"DividendIncUs115AC",       p:OS_QP_STD, req:1, l:"Dividend u/s 115AC @10% (incl. PTI)"},
  {k:"d115aca",      o:"DividendIncUs115ACA",      p:OS_QP_STD, req:1, l:"Dividend u/s 115ACA(1)(a) @10% (incl. PTI)"},
  {k:"d115ad1i",     o:"DividendIncUs115AD1i",     p:OS_QP_STD, req:1, l:"Dividend (other than 115AB units) u/s 115AD(1)(i) @20% (incl. PTI)"},
  {k:"not89a",       o:"NOT89A",                   p:OS_QP_STD, req:1, l:"Retirement benefit a/c in a notified country u/s 89A, not claimed for relief"},
  {k:"divdtaa",      o:"DividendDTAA",             p:OS_QP_STD, req:1, l:"Dividend income taxable at DTAA rates"}
];
const OS_QCOLH = ["Upto 15/6 (i)","16/6–15/9 (ii)","16/9–15/12 (iii)","16/12–15/3 (iv)","16/3–31/3 (v)"];

const os_isNRI = ()=> (S.pi && S.fs.resStatus) === "NRI";

/* ---- engine ------------------------------------------------------ */
function engOs(){
  S.os = S.os || {};
  const O = S.os;
  const C = S.C.os = { income:0 };
  isNew();  /* regime read — no OS item closes under 115BAC (see header) */

  /* ===== item 1 — gross income at normal applicable rates ===== */
  /* 1a (J5) = 1a(i) + 1a(ii) + 1a(iii) */
  const div_i=R(O.divOth), div_ii=R(O.div22e), div_iii=R(O.div22f);
  const a1 = div_i + div_ii + div_iii;                                    /* DividendGross */
  /* 1b (J9) = nine interest lines; PTI interest (1b(iv)) may be negative */
  const bi=R(O.intSaving), bii=R(O.intDeposit), biii=R(O.intRefund), biv=R(O.intPTI),
        bv=R(O.int10_11_1), bvi=R(O.int10_11_2), bvii=R(O.int10_12_1), bviii=R(O.int10_12_2), bix=R(O.intOthers);
  const b1 = bi+bii+biii+biv+bv+bvi+bvii+bviii+bix;                        /* InterestGross */
  /* 1c */
  const c1 = R(O.rentMach);                                               /* RentFromMachPlantBldgs */
  /* 1d (J20) = MAX(0, 56(2)(x) five lines) */
  const d_i=R(O.giftMoney), d_ii=R(O.giftImmovWo), d_iii=R(O.giftImmovInadeq),
        d_iv=R(O.giftOthWo), d_v=R(O.giftOthInadeq);
  const d1 = Math.max(0, d_i+d_ii+d_iii+d_iv+d_v);                         /* Tot562x */
  /* 1e (J26) — family pension + OthersInc rows + 89A lines + 56(2)(xii)/(xiii) */
  const not89aOS = R(O.not89aUS)+R(O.not89aUK)+R(O.not89aCA);             /* J29 IncomeNotified89AOS */
  const othersSum = (O.others||[]).reduce((s,r)=>s+R(r.amt),0);
  const fp = R(O.familyPension);
  const e1 = fp + othersSum + not89aOS + R(O.not89aOther) + R(O.not89aPrYr)
             + R(O.sum562xii) + R(O.sum562xiii);                          /* AnyOtherIncome */
  const item1 = a1 + b1 + c1 + d1 + e1;                                   /* J4 GrossIncChrgblTaxAtAppRate */

  /* ===== item 2 — special rates ===== */
  const s2ai = R(O.win115BB);                                             /* LtryPzzlChrgblUs115BB */
  const s2aii = R(O.win115BBJ);                                           /* IncChrgblUs115BBJ (visible r45) */
  /* 2b (J46) = MAX(0, six 68/69 lines) */
  const b2 = Math.max(0, R(O.cc68)+R(O.ui69)+R(O.um69a)+R(O.udi69b)+R(O.ue69c)+R(O.hundi69d)); /* IncChrgblUs115BBE */
  /* 2c — accumulated PF u/s 111: TotalIncomeBenefit (J53) drives item 2 */
  const pfInc = (O.pf111||[]).reduce((s,r)=>s+R(r.incBenefit),0);         /* TotalIncomeBenefit */
  const pfTax = (O.pf111||[]).reduce((s,r)=>s+R(r.taxBenefit),0);         /* TotalTaxBenefit */
  /* 2d (J60) = Σ SourceAmount */
  const d2 = (O.spl||[]).reduce((s,r)=>s+R(r.amt),0);                     /* OthersGross */
  /* 2e (J69) = Σ PTI amounts */
  const e2 = (O.pti||[]).reduce((s,r)=>s+R(r.amt),0);                     /* PassThrIncOSChrgblSplRate */
  /* 2f (N78) DTAA total — for NRI only TRC="Y" rows count; residents: all rows */
  const dtaaRows = (O.dtaa||[]).map(r=>{
    const treaty = st0(r.treaty).toUpperCase()==="NIL" ? 0 : N(r.treaty);
    const itact  = N(r.itact);
    /* applicable rate (col 10) = lower of treaty (col 6) and IT-Act (col 9) */
    const appl = (r.treaty!==""&&r.treaty!=null) ? (r.itact!==""&&r.itact!=null ? Math.min(treaty,itact) : treaty)
                                                 : itact;
    const counts = os_isNRI() ? (r.trc==="Y") : true;                     /* rules.json line 2620/N78 */
    return {amt:R(r.amt), nature:st0(r.nature), itemno:st0(r.itemno), treaty, itact, appl,
            trc:r.trc||"", counts, natdesc:st0(r.natdesc), cname:st0(r.cname), cc:st0(r.cc), article:st0(r.article)};
  });
  const f2 = dtaaRows.filter(r=>r.counts).reduce((s,r)=>s+r.amt,0);       /* TotalAmtTaxUsDTAASchOs */
  /* item 2 (J40) = 2ai + 2aii + 2b + 2c(IncomeBenefit) + 2d + 2e
     (2f is a re-classification of amounts already in 1 & 2 — not added here) */
  const item2 = s2ai + s2aii + b2 + pfInc + d2 + e2;                      /* IncChargeableSpecialRates */

  /* ===== item 3 — section 57 deductions ===== */
  const expenses = R(O.dExpenses);                                        /* 3a(i) Expenses */
  /* 3a(ii) family-pension deduction (J88) = MIN(1/3 family pension, cap), only if fp>0.
     Cap is Rs.25,000 under the new regime 115BAC (bacValue=1) but Rs.15,000 in the old
     regime u/s 57(iia) (rule A531). */
  const fpDed = fp>0 ? Math.min(R(fp/3), isNew()?25000:15000) : 0;        /* DeductionUs57iia */
  /* 3b depreciation — allowed only if rental income (1c) offered */
  const dep = c1>0 ? Math.max(0,R(O.dDep)) : 0;                           /* Depreciation */
  /* 3c interest expenditure u/s 57(1): eligible ≤ 20% of dividend at 1a(i)/1a(ii);
     allowed only if that dividend is offered */
  const claimedInt = Math.max(0,R(O.dIntClaimed));                        /* UsrIntExp57 */
  const divForInt = div_i + div_ii;                                      /* 1a(i)+1a(ii) */
  const eligInt = divForInt>0 ? Math.min(claimedInt, R(0.20*divForInt)) : 0; /* IntExp57 (3c(i)) */
  const totDed = expenses + fpDed + dep + eligInt;                       /* J93 TotDeductions */

  /* ===== items 4,5,5a ===== */
  const notDed58 = R(O.notDed58);                                        /* AmtNotDeductibleUs58 */
  const profit59 = R(O.profit59);                                        /* ProfitChargTaxUs59 */
  const relief89a = R(O.relief89a);                                      /* Increliefus89AOS */

  /* ===== item 6 — net normal-rate (L97), signed ===== */
  /* DTAA amounts attributable to the item-1 normal-rate lines reduce item 6 */
  const dtaaItem1 = dtaaRows.filter(r=>r.counts && ["1ai","1aiii","1b","1c","1d"].indexOf(r.nature)>=0)
                            .reduce((s,r)=>s+r.amt,0);
  const item6 = item1 - totDed + notDed58 + profit59 - relief89a - dtaaItem1; /* L97 */

  /* ===== item 7 (L98) = 2 + MAX(0, 6) ; item-6 loss floored to nil here ===== */
  const item7 = item2 + Math.max(0, item6);                              /* BalanceNoRaceHorse / TotOthSrcNoRaceHorse */

  /* ===== item 8 — race horses (L104) ===== */
  const H = O.horse||{};
  const hReceipts=R(H.receipts), hDed57=Math.max(0,R(H.ded57)), hNot58=R(H.notDed58), hProfit59=R(H.profit59);
  const item8e = hReceipts - hDed57 + hNot58 + hProfit59;                /* BalanceOwnRaceHorse (signed; <0 → CFL 10xii) */

  /* ===== item 9 (L105) = 7 + MAX(0, 8e) ===== */
  const item9 = item7 + Math.max(0, item8e);                             /* IncChargeable (floored) */

  /* ---- expose the working ---- */
  C.a1={i:div_i,ii:div_ii,iii:div_iii,tot:a1};
  C.b1={i:bi,ii:bii,iii:biii,iv:biv,v:bv,vi:bvi,vii:bvii,viii:bviii,ix:bix,tot:b1};
  C.c1=c1;
  C.d1={i:d_i,ii:d_ii,iii:d_iii,iv:d_iv,v:d_v,tot:d1};
  C.e1={fp:fp, others:othersSum, not89aOS:not89aOS, tot:e1};
  C.item1=item1;
  C.s2ai=s2ai; C.s2aii=s2aii; C.b2=b2;
  C.pf={inc:pfInc, tax:pfTax};
  C.d2=d2; C.e2=e2; C.f2=f2; C.dtaaRows=dtaaRows;
  C.item2=item2;
  C.ded={expenses, fpDed, dep, claimedInt, eligInt, tot:totDed};
  C.notDed58=notDed58; C.profit59=profit59; C.relief89a=relief89a; C.dtaaItem1=dtaaItem1;
  C.item6=item6; C.item7=item7;
  C.horse={receipts:hReceipts, ded57:hDed57, not58:hNot58, profit59:hProfit59, bal:item8e};
  C.item9=item9;

  /* ---- rolls for other sections ---- */
  C.netNormal  = R(item6);                 /* signed; <0 → CYLA OS loss */
  C.special    = R(item2);                 /* special-rate OS income → Schedule SI */
  C.raceHorse  = R(item8e);                /* signed; <0 → Schedule CFL 10xii */
  C.chargeable = R(item9);                 /* exported IncChargeable (floored) */
  C.dtaaTotal  = R(f2);                    /* → Schedule SI DTAA rates */
  /* GTI contribution — signed on the normal leg so losses reach CYLA */
  C.income = R(item2 + item6 + Math.max(0, item8e));
}

/* ---- renderer ---------------------------------------------------- */
function secOs(){
  const O = S.os||{}, C = S.C.os||{};
  let h = "";

  h += note('Please include the income of the specified persons (spouse, minor child, etc.) referred to in Schedule SPI while computing the income under this head.');

  /* ===== item 1 — normal-rate income ===== */
  {
    let b = "";
    /* 1a — dividends */
    b += row("1a · Dividends, Gross (i + ii + iii)", cell((C.a1||{}).tot), {ref:"1a", cls:"tot"});
    b += row("Dividend income [other than (ii) and (iii)]", inp("os.divOth",{n:1}), {ind:1, ref:"1a(i)"});
    b += row("Dividend income u/s 2(22)(e)", inp("os.div22e",{n:1}), {ind:1, ref:"1a(ii)"});
    b += row("Dividend income u/s 2(22)(f)", inp("os.div22f",{n:1}), {ind:1, ref:"1a(iii)"});
    /* 1b — interest */
    b += row("1b · Interest, Gross (i … ix)", cell((C.b1||{}).tot), {ref:"1b", cls:"tot"});
    b += row("From Savings Bank", inp("os.intSaving",{n:1}), {ind:1, ref:"1b(i)"});
    b += row("From Deposit (Bank / Post Office / Co-op Society)", inp("os.intDeposit",{n:1}), {ind:1, ref:"1b(ii)"});
    b += row("From Income Tax refund", inp("os.intRefund",{n:1}), {ind:1, ref:"1b(iii)"});
    b += row("In the nature of Pass through income / loss", inp("os.intPTI",{n:1}), {ind:1, ref:"1b(iv)", hint:"may be negative"});
    b += row("Interest accrued on PF, taxable per first proviso to section 10(11)", inp("os.int10_11_1",{n:1}), {ind:1, ref:"1b(v)"});
    b += row("Interest accrued on PF, taxable per second proviso to section 10(11)", inp("os.int10_11_2",{n:1}), {ind:1, ref:"1b(vi)"});
    b += row("Interest accrued on PF, taxable per first proviso to section 10(12)", inp("os.int10_12_1",{n:1}), {ind:1, ref:"1b(vii)"});
    b += row("Interest accrued on PF, taxable per second proviso to section 10(12)", inp("os.int10_12_2",{n:1}), {ind:1, ref:"1b(viii)"});
    b += row("Others, incl. interest from Companies, NBFCs & HFCs", inp("os.intOthers",{n:1}), {ind:1, ref:"1b(ix)"});
    /* 1c */
    b += row("1c · Rental income from machinery, plants, buildings etc., Gross", inp("os.rentMach",{n:1}), {ref:"1c"});
    /* 1d — 56(2)(x) */
    b += row("1d · Income u/s 56(2)(x) chargeable to tax (i … v, floored at nil)", cell((C.d1||{}).tot), {ref:"1d", cls:"tot"});
    b += row("Aggregate sum of money received without consideration", inp("os.giftMoney",{n:1}), {ind:1, ref:"1d(i)"});
    b += row("Immovable property without consideration — stamp duty value", inp("os.giftImmovWo",{n:1}), {ind:1, ref:"1d(ii)"});
    b += row("Immovable property for inadequate consideration — SDV in excess", inp("os.giftImmovInadeq",{n:1}), {ind:1, ref:"1d(iii)"});
    b += row("Any other property without consideration — fair market value", inp("os.giftOthWo",{n:1}), {ind:1, ref:"1d(iv)"});
    b += row("Any other property for inadequate consideration — FMV in excess", inp("os.giftOthInadeq",{n:1}), {ind:1, ref:"1d(v)"});
    /* 1e — any other income */
    b += row("1e · Any other income", cell((C.e1||{}).tot), {ref:"1e", cls:"tot"});
    b += row("Family Pension", inp("os.familyPension",{n:1}), {ind:1, ref:"1e"});
    b += sub("Any other income — specify nature and amount");
    b += grid("os.others",[
      {k:"nat",h:"Nature",t:"txt",max:50,req:1},
      {k:"amt",h:"Amount",t:"num",w:"160px",req:1}
    ], O.others||[], {empty:"No other-income rows.", add:"Add an income row"});
    b += row("Retirement benefit account in a notified country u/s 89A (US + UK + CA)", cell((C.e1||{}).not89aOS), {ind:1, ref:"1e", cls:"tot"});
    b += '<div class="full"><table class="gt" style="min-width:420px"><thead><tr><th class="l">Country</th><th class="req">Amount</th></tr></thead><tbody>'+
      '<tr><td class="l">United States of America</td><td>'+inp("os.not89aUS",{n:1})+'</td></tr>'+
      '<tr><td class="l">United Kingdom</td><td>'+inp("os.not89aUK",{n:1})+'</td></tr>'+
      '<tr><td class="l">Canada</td><td>'+inp("os.not89aCA",{n:1})+'</td></tr>'+
      '</tbody></table></div>';
    b += row("Retirement benefit account in a country other than a notified country u/s 89A", inp("os.not89aOther",{n:1}), {ind:1, ref:"1e"});
    b += row("Income taxable this year on which 89A relief was claimed in an earlier year", inp("os.not89aPrYr",{n:1}), {ind:1, ref:"1e"});
    b += row("Specified sum received by a unit holder from a business trust u/s 56(2)(xii)", inp("os.sum562xii",{n:1}), {ind:1, ref:"1e"});
    b += row("Sum received (incl. bonus) referred to in section 56(2)(xiii)", inp("os.sum562xiii",{n:1}), {ind:1, ref:"1e"});
    b += row("1 · Gross income chargeable at normal rates (1a+1b+1c+1d+1e)", cell(C.item1), {ref:"1", cls:"tot"});
    h += fold("os_1","1","Income chargeable at normal applicable rates", RS(C.item1||0), b, {def:true});
  }

  /* ===== item 2 — special rates ===== */
  {
    let b = "";
    b += row("2a(i) · Winnings from lotteries, crossword puzzles, races, card games etc. u/s 115BB", inp("os.win115BB",{n:1}), {ref:"2a(i)"});
    b += row("2a(ii) · Winnings from online games u/s 115BBJ", inp("os.win115BBJ",{n:1}), {ref:"2a(ii)"});
    /* 2b — 115BBE */
    b += row("2b · Income chargeable u/s 115BBE (i … vi, floored at nil)", cell(C.b2), {ref:"2b", cls:"tot"});
    b += row("Cash credits u/s 68", inp("os.cc68",{n:1}), {ind:1, ref:"2b(i)"});
    b += row("Unexplained investments u/s 69", inp("os.ui69",{n:1}), {ind:1, ref:"2b(ii)"});
    b += row("Unexplained money etc. u/s 69A", inp("os.um69a",{n:1}), {ind:1, ref:"2b(iii)"});
    b += row("Undisclosed investments etc. u/s 69B", inp("os.udi69b",{n:1}), {ind:1, ref:"2b(iv)"});
    b += row("Unexplained expenditure etc. u/s 69C", inp("os.ue69c",{n:1}), {ind:1, ref:"2b(v)"});
    b += row("Amount borrowed or repaid on hundi u/s 69D", inp("os.hundi69d",{n:1}), {ind:1, ref:"2b(vi)"});
    /* 2c — accumulated PF u/s 111 */
    b += sub("2c · Accumulated balance of recognised provident fund taxable u/s 111");
    b += grid("os.pf111",[
      {k:"ay",h:"Assessment Year",t:"sel",w:"140px",opts:OS_PF_AY,req:1},
      {k:"incBenefit",h:"Income Benefit",t:"num",w:"150px",req:1},
      {k:"taxBenefit",h:"Tax Benefit",t:"num",w:"150px",req:1}
    ], O.pf111||[], {empty:"No accumulated-PF rows.", add:"Add a PF row",
       foot:[{l:1,v:"Total"},{v:(C.pf||{}).inc},{v:(C.pf||{}).tax}]});
    /* 2d — other special-rate sources */
    b += sub("2d · Any other income chargeable at special rate");
    b += grid("os.spl",[
      {k:"code",h:"Nature (NRI special-rate section)",t:"sel",opts:OS_SPL,req:1},
      {k:"amt",h:"Amount",t:"num",w:"150px"}
    ], O.spl||[], {min:640, empty:"No special-rate rows.", add:"Add a special-rate row",
       foot:[{l:1,v:"2d Total"},{v:C.d2}]});
    /* 2e — PTI special-rate */
    b += sub("2e · Pass through income in the nature of income from other sources at special rate");
    b += grid("os.pti",[
      {k:"code",h:"Nature (PTI NRI special-rate section)",t:"sel",opts:OS_PTI,req:1},
      {k:"amt",h:"Amount",t:"num",w:"150px"}
    ], O.pti||[], {min:640, empty:"No PTI special-rate rows.", add:"Add a PTI row",
       foot:[{l:1,v:"2e Total"},{v:C.e2}]});
    /* 2f — DTAA */
    b += sub("2f · Amount included in 1 and 2 above, chargeable at special rates in India as per DTAA");
    b += note("For a non-resident, a row is counted in the DTAA total only if the TRC is obtained (Yes); for a resident, every row is counted irrespective of the TRC. The applicable rate is the lower of the treaty rate and the rate under the Income-tax Act.");
    b += grid("os.dtaa",[
      {k:"amt",h:"Amount of income",t:"num",w:"130px",req:1},
      {k:"nature",h:"Item No. in which included",t:"sel",opts:OS_DTAA_NAT,req:1},
      {k:"itemno",h:"Section",t:"sel",opts:OS_DTAA_ITEM,req:1},
      {k:"natdesc",h:"Nature of income",t:"txt",max:50,req:1},
      {k:"cname",h:"Country name",t:"txt",max:50,req:1},
      {k:"cc",h:"Country code",t:"sel",opts:OS_CC,req:1},
      {k:"article",h:"Article of DTAA",t:"txt",max:20,req:1},
      {k:"treaty",h:"Rate as per Treaty (NIL if not chargeable)",t:"txt",max:10,req:1},
      {k:"trc",h:"TRC obtained",t:"sel",opts:OS_TRC},
      {k:"itact",h:"Rate as per I.T. Act",t:"txt",max:10,req:1},
      {k:"appl",h:"Applicable rate [lower of (6),(9)]",t:"calc",f:(r,i)=>((C.dtaaRows||[])[i]||{}).appl}
    ], O.dtaa||[], {min:1180, empty:"No DTAA rows.", add:"Add a DTAA row",
       foot:[{l:1,v:"2f Total"},{v:C.f2},{l:1,v:"",span:9}]});
    b += row("2 · Income chargeable at special rates (2ai+2aii+2b+2c+2d+2e)", cell(C.item2), {ref:"2", cls:"tot"});
    h += fold("os_2","2","Income chargeable at special rates", RS(C.item2||0), b);
  }

  /* ===== item 3 — section 57 deductions ===== */
  {
    const D = C.ded||{};
    let b = "";
    b += row("3a(i) · Expenses / deductions (other than family pension)", inp("os.dExpenses",{n:1}), {ref:"3a(i)"});
    b += row("3a(ii) · Deduction u/s 57(iia) (family pension only)", cell(D.fpDed), {ref:"3a(ii)",
      hint:"MIN(1/3 of family pension, ₹25,000) — computed"});
    b += row("3b · Depreciation", (C.c1>0?inp("os.dDep",{n:1}):cell(0)), {ref:"3b",
      hint:(C.c1>0?"allowed against rental income at 1c":"available only if rental income is offered at 1c")});
    b += row("3c · Interest expenditure u/s 57(1) claimed", inp("os.dIntClaimed",{n:1}), {ref:"3c",
      hint:"available only if dividend is offered at 1a(i)/1a(ii); eligible ≤ 20% of that dividend"});
    b += row("3c(i) · Eligible interest expenditure u/s 57(1) — computed", cell(D.eligInt), {ind:1, ref:"3c(i)"});
    b += row("3d · Total deductions (3a(i)+3a(ii)+3b+3c(i))", cell(D.tot), {ref:"3d", cls:"tot"});
    h += fold("os_3","3","Deductions under section 57", RS((C.ded||{}).tot||0), b);
  }

  /* ===== items 4–7 ===== */
  {
    let b = "";
    b += row("4 · Amounts not deductible u/s 58", inp("os.notDed58",{n:1}), {ref:"4"});
    b += row("5 · Profits chargeable to tax u/s 59", inp("os.profit59",{n:1}), {ref:"5"});
    b += row("5a · Income claimed for relief from taxation u/s 89A", inp("os.relief89a",{n:1}), {ref:"5a"});
    if(C.dtaaItem1) b += row("Less: DTAA amounts attributable to item-1 lines", cell(-(C.dtaaItem1||0)), {ind:1, ref:"L97"});
    b += row("6 · Net income at normal rates (1 − 3 + 4 + 5 − 5a − DTAA), a loss goes to CYLA", cell(C.item6), {ref:"6", cls:"tot"});
    b += row("7 · Income from other sources other than race horses (2 + 6; 6 as nil if negative)", cell(C.item7), {ref:"7", cls:"tot"});
    h += fold("os_67","4–7","Net income from other sources", RS(C.item7||0), b, {def:true});
  }

  /* ===== item 8 — race horses ===== */
  {
    const RH = C.horse||{};
    let b = "";
    b += row("8a · Receipts", inp("os.horse.receipts",{n:1}), {ref:"8a"});
    b += row("8b · Deductions u/s 57 in relation to 8a only", inp("os.horse.ded57",{n:1}), {ref:"8b"});
    b += row("8c · Amounts not deductible u/s 58", inp("os.horse.notDed58",{n:1}), {ref:"8c"});
    b += row("8d · Profits chargeable to tax u/s 59", inp("os.horse.profit59",{n:1}), {ref:"8d"});
    b += row("8e · Balance (8a − 8b + 8c + 8d)", cell(RH.bal), {ref:"8e", cls:"tot",
      });
    if(R(RH.bal)<0) b += note("A negative 8e is carried to Schedule CFL 10xii (loss from owning and maintaining race horses) and is taken as nil at item 9.");
    h += fold("os_8","8","Income from owning and maintaining race horses", RS((C.horse||{}).bal||0), b);
  }

  /* ===== item 9 ===== */
  h += row("9 · Income under the head Income from other sources (7 + 8e; 8e as nil if negative)",
           cell(C.item9), {ref:"9", cls:"tot"});

  /* ===== item 10 — quarterly accrual/receipt ===== */
  {
    let t = '<div class="full"><table class="gt" style="min-width:920px"><thead><tr>'+
      '<th class="l">Other Source Income</th>'+OS_QCOLH.map(x=>'<th>'+esc(x)+'</th>').join("")+'</tr></thead><tbody>';
    OS_QROWS.forEach(qr=>{
      t += '<tr><td class="l">'+esc(qr.l)+'</td>'+
        qr.p.map(pk=>'<td>'+inp("os.q."+qr.k+"."+pk,{n:1})+'</td>').join("")+'</tr>';
    });
    t += '</tbody></table></div>';
    let b = note("Quarterly break-up of income that accrues or is received under this head, for interest u/s 234C. The dividend break-up must reconcile to Sl.No.1a(i) net of the DTAA dividend and the attributable interest expenditure u/s 57.");
    b += t;
    h += fold("os_10","10","Information about accrual / receipt of income from Other Sources", "", b);
  }

  return h;
}

/* ---- export ------------------------------------------------------ */
function expOs(j){
  const C = S.C.os||{}, O = S.os||{};

  /* ---- item 3 Deductions object (required Depreciation, TotDeductions) ---- */
  const D = C.ded||{};
  const ded = { Depreciation:n0(D.dep), TotDeductions:n0(D.tot) };
  if(D.expenses)  ded.Expenses      = sg(D.expenses);
  if(D.claimedInt)ded.UsrIntExp57   = n0(D.claimedInt);
  if(D.eligInt)   ded.IntExp57      = n0(D.eligInt);
  if(D.fpDed)     ded.DeductionUs57iia = n0(D.fpDed);

  /* ---- IncOthThanOwnRaceHorse (parent of 1–7) ---- */
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
    IntrstFrmOthers: sg(b1.ix),
    RentFromMachPlantBldgs: sg(C.c1),
    Tot562x: n0(d1.tot),
    Aggrtvaluewithoutcons562x: sg(d1.i),
    Immovpropwithoutcons562x: sg(d1.ii),
    Immovpropinadeqcons562x: sg(d1.iii),
    Anyotherpropwithoutcons562x: sg(d1.iv),
    Anyotherpropinadeqcons562x: sg(d1.v),
    FamilyPension: sg(e1.fp),
    AnyOtherIncome: sg(e1.tot),
    IncChargeableSpecialRates: sg(C.item2),
    LtryPzzlChrgblUs115BB: sg(C.s2ai),
    IncChrgblUs115BBE: n0(C.b2),
    CashCreditsUs68: sg(R(O.cc68)),
    UnExplndInvstmntsUs69: sg(R(O.ui69)),
    UnExplndMoneyUs69A: sg(R(O.um69a)),
    UnDsclsdInvstmntsUs69B: sg(R(O.udi69b)),
    UnExplndExpndtrUs69C: sg(R(O.ue69c)),
    AmtBrwdRepaidOnHundiUs69D: sg(R(O.hundi69d)),
    OthersGross: n0(C.d2),
    PassThrIncOSChrgblSplRate: n0(C.e2),
    IncChargblSplRateOS: { TotalAmtTaxUsDTAASchOs: n0(C.f2) },
    Deductions: ded,
    BalanceNoRaceHorse: sg(C.item7)
  };
  /* optional interest PF-proviso lines */
  if(R(O.int10_11_1)) io.IntrstSec10XIFirstProviso   = sg(R(O.int10_11_1));
  if(R(O.int10_11_2)) io.IntrstSec10XISecondProviso  = sg(R(O.int10_11_2));
  if(R(O.int10_12_1)) io.IntrstSec10XIIFirstProviso  = sg(R(O.int10_12_1));
  if(R(O.int10_12_2)) io.IntrstSec10XIISecondProviso = sg(R(O.int10_12_2));
  if(R(O.div22f))     io.Dividend22f = sg(R(O.div22f));
  if(C.s2aii)         io.IncChrgblUs115BBJ = sg(C.s2aii);
  /* 1e extra fixed lines */
  if((e1.not89aOS)||0) io.IncomeNotified89AOS = sg(e1.not89aOS);
  if(R(O.not89aOther)) io.IncomeNotifiedOther89AOS = sg(R(O.not89aOther));
  if(R(O.not89aPrYr))  io.IncomeNotifiedPrYr89AOS  = sg(R(O.not89aPrYr));
  if(R(O.sum562xii))   io.SumRecdPrYrBusTRU562xii   = sg(R(O.sum562xii));
  if(R(O.sum562xiii))  io.SumRecdPrYrLifIns562xiii  = sg(R(O.sum562xiii));
  if(R(O.notDed58))    io.AmtNotDeductibleUs58 = sg(C.notDed58);
  if(R(O.profit59))    io.ProfitChargTaxUs59   = sg(C.profit59);
  if(R(O.relief89a))   io.Increliefus89AOS     = sg(C.relief89a);
  /* 1e OthersInc array */
  const others = (O.others||[]).filter(r=>st0(r.nat)||R(r.amt));
  if(others.length) io.OthersInc = { OthersIncDtls: others.map(r=>({
    OthNatOfInc:(sv(r.nat)||"NA").slice(0,50), OthAmount:sg(R(r.amt)) })) };
  /* 1e 89A notified-country array */
  const not89a = [["US",R(O.not89aUS)],["UK",R(O.not89aUK)],["CA",R(O.not89aCA)]].filter(x=>x[1]);
  if(not89a.length) io.IncomeNotified89ATypeOS = not89a.map(x=>({NOT89ACountrycode:x[0], NOT89AAmount:sg(x[1])}));
  /* 2c accumulated-PF table */
  const pf = (O.pf111||[]).filter(r=>st0(r.ay)||R(r.incBenefit)||R(r.taxBenefit));
  if(pf.length) io.TaxAccumulatedBalRecPF = {
    TaxAccmltdBalRecPFDtls: pf.map(r=>({AssessmentYear:st0(r.ay)||"2025-26",
      IncomeBenefit:sg(R(r.incBenefit)), TaxBenefit:sg(R(r.taxBenefit))})),
    TotalIncomeBenefit:sg((C.pf||{}).inc), TotalTaxBenefit:sg((C.pf||{}).tax)
  };
  /* 2d other special-rate rows */
  const spl = (O.spl||[]).filter(r=>st0(r.code)||R(r.amt));
  if(spl.length) io.OthersGrossDtls = spl.map(r=>({SourceDescription:st0(r.code)||"5A1ai", SourceAmount:sg(R(r.amt))}));
  /* 2e PTI special-rate rows */
  const pti = (O.pti||[]).filter(r=>st0(r.code)||R(r.amt));
  if(pti.length) io.PTIOthersGrossDtls = pti.map(r=>({SourceDescription:st0(r.code)||"PTI_5A1ai", SourceAmount:sg(R(r.amt))}));
  /* 2f DTAA rows */
  const dtaa = (C.dtaaRows||[]).filter(r=>r.amt||st0(r.natdesc)||st0(r.cname));
  if(dtaa.length) io.IncChargblSplRateOS.NRIOsDTAA = { NRIDTAADtlsSchOS: dtaa.map(r=>{
    const o = {
      DTAAamt: sg(r.amt),
      NatureOfIncome: st0(r.nature)||"1ai",
      CountryName: (sv(r.cname)||"NA").slice(0,50),
      CountryCodeExcludingIndia: st0(r.cc)||"9999",
      DTAAarticle: (sv(r.article)||"NA").slice(0,20),
      RateAsPerTreaty: r.treaty,
      ItemNoincl: st0(r.itemno)||"56i",
      RateAsPerITAct: r.itact,
      ApplicableRate: r.appl
    };
    if(r.trc) o.TaxRescertifiedFlag = r.trc;
    return o;
  }) };

  const OS = { IncOthThanOwnRaceHorse: io, TotOthSrcNoRaceHorse: sg(C.item7) };

  /* ---- item 8 race horses (only when the working carries a value) ---- */
  const RH = C.horse||{};
  if(RH.receipts||RH.ded57||RH.not58||RH.profit59){
    const rh = { Receipts:n0(RH.receipts), DeductSec57:n0(RH.ded57), BalanceOwnRaceHorse:sg(RH.bal) };
    if(RH.not58)   rh.AmtNotDeductibleUs58 = sg(RH.not58);
    if(RH.profit59)rh.ProfitChargTaxUs59   = sg(RH.profit59);
    OS.IncFromOwnHorse = rh;
  }

  /* ---- item 9 ---- */
  OS.IncChargeable = sg(C.item9);

  /* ---- item 10 quarterly DateRange objects (required ones always present) ---- */
  const q = O.q||{};
  OS_QROWS.forEach(qr=>{
    const src = q[qr.k]||{};
    const dr = {}; let any=false;
    qr.p.forEach(pk=>{ const v=sg(R(src[pk])); dr[pk]=v; if(v) any=true; });
    if(qr.req || any) OS[qr.o] = { DateRange: dr };
  });

  j.ScheduleOS = OS;
}

/* ---- import ------------------------------------------------------ */
function impOs(I3){
  const read = [];
  if(!I3 || !I3.ScheduleOS) return read;
  const OS = I3.ScheduleOS, io = OS.IncOthThanOwnRaceHorse||{};
  S.os = S.os || {};
  const O = S.os;

  O.divOth = nz(io.DividendOthThan22e); O.div22e = nz(io.Dividend22e); O.div22f = nz(io.Dividend22f);
  O.intSaving = nz(io.IntrstFrmSavingBank); O.intDeposit = nz(io.IntrstFrmTermDeposit);
  O.intRefund = nz(io.IntrstFrmIncmTaxRefund); O.intPTI = nz(io.NatofPassThrghIncome);
  O.int10_11_1 = nz(io.IntrstSec10XIFirstProviso); O.int10_11_2 = nz(io.IntrstSec10XISecondProviso);
  O.int10_12_1 = nz(io.IntrstSec10XIIFirstProviso); O.int10_12_2 = nz(io.IntrstSec10XIISecondProviso);
  O.intOthers = nz(io.IntrstFrmOthers);
  O.rentMach = nz(io.RentFromMachPlantBldgs);
  O.giftMoney = nz(io.Aggrtvaluewithoutcons562x); O.giftImmovWo = nz(io.Immovpropwithoutcons562x);
  O.giftImmovInadeq = nz(io.Immovpropinadeqcons562x); O.giftOthWo = nz(io.Anyotherpropwithoutcons562x);
  O.giftOthInadeq = nz(io.Anyotherpropinadeqcons562x);
  O.familyPension = nz(io.FamilyPension);
  O.not89aOther = nz(io.IncomeNotifiedOther89AOS); O.not89aPrYr = nz(io.IncomeNotifiedPrYr89AOS);
  O.sum562xii = nz(io.SumRecdPrYrBusTRU562xii); O.sum562xiii = nz(io.SumRecdPrYrLifIns562xiii);
  O.win115BB = nz(io.LtryPzzlChrgblUs115BB); O.win115BBJ = nz(io.IncChrgblUs115BBJ);
  O.cc68 = nz(io.CashCreditsUs68); O.ui69 = nz(io.UnExplndInvstmntsUs69); O.um69a = nz(io.UnExplndMoneyUs69A);
  O.udi69b = nz(io.UnDsclsdInvstmntsUs69B); O.ue69c = nz(io.UnExplndExpndtrUs69C); O.hundi69d = nz(io.AmtBrwdRepaidOnHundiUs69D);
  O.notDed58 = nz(io.AmtNotDeductibleUs58); O.profit59 = nz(io.ProfitChargTaxUs59); O.relief89a = nz(io.Increliefus89AOS);

  const dd = io.Deductions||{};
  O.dExpenses = nz(dd.Expenses); O.dDep = nz(dd.Depreciation); O.dIntClaimed = nz(dd.UsrIntExp57);

  O.others = ((io.OthersInc||{}).OthersIncDtls||[]).map(r=>({nat:r.OthNatOfInc||"", amt:nz(r.OthAmount)}));
  ((io.IncomeNotified89ATypeOS)||[]).forEach(r=>{
    if(r.NOT89ACountrycode==="US") O.not89aUS = nz(r.NOT89AAmount);
    else if(r.NOT89ACountrycode==="UK") O.not89aUK = nz(r.NOT89AAmount);
    else if(r.NOT89ACountrycode==="CA") O.not89aCA = nz(r.NOT89AAmount);
  });
  O.pf111 = (((io.TaxAccumulatedBalRecPF||{}).TaxAccmltdBalRecPFDtls)||[]).map(r=>({
    ay:r.AssessmentYear||"", incBenefit:nz(r.IncomeBenefit), taxBenefit:nz(r.TaxBenefit)}));
  O.spl = (io.OthersGrossDtls||[]).map(r=>({code:r.SourceDescription||"", amt:nz(r.SourceAmount)}));
  O.pti = (io.PTIOthersGrossDtls||[]).map(r=>({code:r.SourceDescription||"", amt:nz(r.SourceAmount)}));
  O.dtaa = ((((io.IncChargblSplRateOS||{}).NRIOsDTAA||{}).NRIDTAADtlsSchOS)||[]).map(r=>({
    amt:nz(r.DTAAamt), nature:r.NatureOfIncome||"", itemno:r.ItemNoincl||"", natdesc:"",
    cname:r.CountryName||"", cc:r.CountryCodeExcludingIndia||"", article:r.DTAAarticle||"",
    treaty:r.RateAsPerTreaty!=null?r.RateAsPerTreaty:"", trc:r.TaxRescertifiedFlag||"",
    itact:r.RateAsPerITAct!=null?r.RateAsPerITAct:""}));

  const rh = OS.IncFromOwnHorse||{};
  O.horse = { receipts:nz(rh.Receipts), ded57:nz(rh.DeductSec57),
              notDed58:nz(rh.AmtNotDeductibleUs58), profit59:nz(rh.ProfitChargTaxUs59) };

  O.q = O.q || {};
  OS_QROWS.forEach(qr=>{
    const dr = (OS[qr.o]||{}).DateRange;
    if(dr){ O.q[qr.k] = O.q[qr.k]||{}; qr.p.forEach(pk=>{ O.q[qr.k][pk] = nz(dr[pk]); }); }
  });

  read.push("Schedule OS");
  return read;
}

/* ---- checks ------------------------------------------------------ */
function chkOs(){
  const out = [], C = S.C.os||{}, O = S.os||{};
  const D = C.ded||{};

  /* 3b depreciation only if rental income (1c) is offered */
  if(R(O.dDep)>0 && !(C.c1>0))
    out.push({lvl:"err", t:"Section 57 · depreciation", m:"Depreciation (3b) can be claimed only when rental income from machinery/plant/buildings is offered at 1c.", sec:"os"});

  /* 3c interest expenditure — only against dividend at 1a(i)/1a(ii), and ≤ 20% of it */
  const divForInt = (C.a1||{}).i + (C.a1||{}).ii;
  if(R(O.dIntClaimed)>0 && !(divForInt>0))
    out.push({lvl:"err", t:"Section 57 · interest expenditure", m:"Interest expenditure u/s 57(1) (3c) is available only when dividend income is offered at 1a(i) and/or 1a(ii).", sec:"os"});
  else if(R(O.dIntClaimed) > (D.eligInt||0))
    out.push({lvl:"warn", t:"Section 57 · interest expenditure", m:"Interest expenditure u/s 57(1) is restricted to 20% of the dividend income; only "+RS(D.eligInt||0)+" is eligible against "+RS(R(O.dIntClaimed))+" claimed.", sec:"os"});

  /* family-pension deduction cap */
  if(R(O.familyPension)>0 && (D.fpDed||0)===25000 && R(O.familyPension/3)>25000)
    out.push({lvl:"ok", t:"Family pension", m:"Deduction u/s 57(iia) capped at ₹25,000 (one-third of family pension exceeds the cap).", sec:"os"});

  /* 2f DTAA — NRI/TRC gate and applicable-rate note */
  (C.dtaaRows||[]).forEach((r,i)=>{
    if(os_isNRI() && r.amt>0 && r.trc!=="Y")
      out.push({lvl:"warn", t:"DTAA row "+(i+1), m:"You are a non-resident and no TRC is obtained for this row, so its "+RS(r.amt)+" is not counted in the 2f DTAA total (rules.json).", sec:"os"});
    if(r.amt>0 && r.treaty!=null && r.itact!=null && r.appl===0 && !(r.treaty===0))
      out.push({lvl:"warn", t:"DTAA row "+(i+1), m:"The applicable rate is the lower of the treaty rate and the Income-tax Act rate.", sec:"os"});
  });

  /* item-1 gift 56(2)(x) floored at nil */
  const d1=C.d1||{};
  if((d1.i+d1.ii+d1.iii+d1.iv+d1.v)<0)
    out.push({lvl:"warn", t:"Section 56(2)(x)", m:"The 56(2)(x) sub-lines sum below nil; item 1d is taken as nil.", sec:"os"});

  /* race-horse loss goes to CFL */
  if(R((C.horse||{}).bal)<0)
    out.push({lvl:"ok", t:"Race horses", m:"The race-horse balance (8e) is a loss of "+RS((C.horse||{}).bal)+"; it is carried to Schedule CFL 10xii and taken as nil at item 9.", sec:"os"});

  /* item-6 loss to CYLA */
  if(R(C.item6)<0)
    out.push({lvl:"ok", t:"Other sources loss", m:"Net income at normal rates (item 6) is a loss of "+RS(C.item6)+"; it is available for set-off in Schedule CYLA.", sec:"os"});

  return out;
}

/* ---- register ---------------------------------------------------- */
reg({id:"os", t:"Other sources", ref:"Schedule OS",
     f:secOs, s:()=>{const C=S.C.os||{}; return C.item9!=null?RS(C.item9):"";},
     eng:engOs, exp:expOs, imp:impOs, chk:chkOs, order:16});
