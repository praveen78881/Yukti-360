/* =====================================================================
   ITR-6 · Section "os" — Income from Other Sources (the COMPANY return)
   Book: books/ITR-6/OS.md   ·   Schema block: ScheduleOS
   Structural template: forms/ITR-3/src/70_sec_os.js — every field, number,
   formula, enum and schema key below is taken from the ITR-6 books, not
   from ITR-3.  Compute order: 16 (an income head; before losses/tax).

   HOW ITR-6's OS DIFFERS FROM ITR-3's (book §14, notes "os:")
   ---------------------------------------------------------------------
   · Interest 1b has FIVE sub-lines (bi–bv), NOT nine — a company has no
     provident-fund proviso interest (book §2.1b; rule 474's sixth term is
     a stale parse-merge, so five is booked per utility+schema).
   · 1e "any other income" is lean: one fixed business-trust 56(2)(xii)
     line + a free table.  NO family-pension row, NO 89A notified-country
     split, NO 56(2)(xiii) life-insurance line.  1e is floored at nil
     (J22 = MAX(0, free rows + 56(2)(xii))).
   · There is NO item "5a" (income claimed for 89A relief) — item 6 is
     1(after DTAA) − 3 + 4 + 5, with no 89A subtraction (book §6; rule 471).
   · The accumulated-PF u/s 111 sub-schedule is HIDDEN (r39H–r43H) and is
     NOT built (book §12).  Because it is hidden the visible special-rate
     lettering runs ai, aii, b, c, d, e — so ITR-6's 2c/2d/2e are ITR-2's
     2d/2e/2f (notes "os:").
   · 2c = "any other income at special rate"  (OthersGrossDtls)
     2d = pass-through income at special rate  (PTIOthersGrossDtls)
     2e = the DTAA table                       (NRIDTAADtlsSchOS)
   · The 2e DTAA table uses SecITAct (not ITR-2's ItemNoincl) for "Section
     of I.T. Act" and NatureOfIncome for "Item No." (book §15.8); its
     NatureOfIncome enum is {1ai,1aiii,1b,1c,1d,2ai,2aii,2c,2d}.
   · Item-6 normal OS loss routes to CYLA 4i (book §14; rule 518 → CYLA
     1xiii); ITR-2 routed to CYLA 3i.
   · Item-8e race-horse loss carries to CFL.  SOURCE INCONSISTENCY (book
     §7, notes): sheet 8e label says "11xvii of Schedule CFL", rule 561
     says "11xix".  This section PUBLISHES the value (S.C.os.raceHorse,
     signed); the LOSS/CFL section owner reconciles the row number.
   · Item 10 has ten quarterly break-up blocks (two 115AD(1)(i) dividend
     rows — FII @20% and specified-fund @10%; NO 115ACA, NO NOT89A).

   ITEM 2 / ITEM 6 — the DTAA reclassification (book §3 J29, §6 L81)
   ---------------------------------------------------------------------
   The DTAA amounts attributable to the item-1 normal-rate lines (natures
   1ai,1aiii,1b,1c,1d), call it DTAA6, are MOVED from the normal leg to the
   special leg: item 6 SUBTRACTS DTAA6 (L81) and item 2 ADDS it back as the
   "2e elements related to Sl.No.1" term (J29; rule 472).  This is the one
   place ITR-6 diverges from the ITR-3 engine (which did not add DTAA into
   item 2).  The special-rate DTAA rows (natures 2ai,2aii,2c,2d) are already
   inside 2ai/2aii/2c/2d and are NOT re-added.  TotalAmtTaxUsDTAASchOs (the
   2e disclosure total, J65) is the sum of ALL counted rows.

   CROSS-SECTION ROLLS published on S.C.os (consumed by loss/si/tax):
     netNormal / normal / six  — item 6 (signed; <0 ⇒ CYLA 4i)
     special                   — item 2 total (→ Schedule SI, Part B-TI)
     raceHorse / horse.bal     — item 8e (signed; <0 ⇒ Schedule CFL)
     chargeable                — item 9 IncChargeableFrmOthSrc (→ Part B-TI)
     dtaaTotal                 — 2e TotalAmtTaxUsDTAASchOs (→ SI DTAA / CYLA)
     income                    — signed head figure (item2 + item6 + MAX0(8e))
   Regime note: deductions 3d/8b are disallowed under 115BAB (rule 488) —
   that is a Phase-6 rule on the filing-status flag, not an OS-local field,
   so it is left to the rules-enforcer (no regime gate lives in this engine).
   ===================================================================== */

/* ---- state ------------------------------------------------------- */
S.os = S.os || {
  /* 1a — dividends */
  divOth:"", div22e:"", div22f:"",
  /* 1b — interest (FIVE sub-lines; PTI interest 1b(iv) may be negative) */
  intSaving:"", intDeposit:"", intRefund:"", intPTI:"", intOthers:"",
  /* 1c — rental from machinery/plant/buildings */
  rentMach:"",
  /* 1d — 56(2)(x), total floored at nil */
  giftMoney:"", giftImmovWo:"", giftImmovInadeq:"", giftOthWo:"", giftOthInadeq:"",
  /* 1e — any other income (business-trust fixed line + free table), floored at nil */
  sum562xii:"",
  others:[],                 /* {nat, amt} — OthersInc.OthersIncDtls[] */
  /* 2a — 115BB / 115BBJ */
  win115BB:"", win115BBJ:"",
  /* 2b — 115BBE (six 68/69 lines, total floored at nil) */
  cc68:"", ui69:"", um69a:"", udi69b:"", ue69c:"", hundi69d:"",
  /* 2c — other special-rate sources */
  spl:[],                    /* {code, amt} — OthersGrossDtls[] */
  /* 2d — PTI special-rate sources */
  pti:[],                    /* {code, amt} — PTIOthersGrossDtls[] */
  /* 2e — DTAA table (non-residents only) */
  dtaa:[],                   /* {amt, nature, cc, article, treaty, trc, sec, itact} */
  /* 3 — section 57 deductions */
  dExpenses:"", dDep:"", dIntClaimed:"",
  /* 4 / 5 */
  notDed58:"", profit59:"",
  /* 8 — race horses */
  horse:{ receipts:"", ded57:"", notDed58:"", profit59:"" },
  /* 10 — quarterly accrual/receipt (one object of period leaves per income type) */
  q:{}
};

/* SEED defaults for the shell's generic add-row handler (keyed by full path) */
SEED["os.others"] = SEED["os.others"] || {};
SEED["os.spl"]    = SEED["os.spl"]    || {code:"5AD1i"};
SEED["os.pti"]    = SEED["os.pti"]    || {code:"PTI_5AD1i"};
SEED["os.dtaa"]   = SEED["os.dtaa"]   || {nature:"1ai", sec:"56i", trc:"Y"};

/* ---- dropdowns (codes from books/ITR-6/enums.json — never hand-typed) ---- */
/* 2c — OthersGrossDtls[].SourceDescription (schema enum, 23 codes). The utility
   narrows this to a 4-way residential-status list (book §3, Appendix B); the
   schema enum is the filed set and is shown here so any lawful value validates. */
const OS6_SPL = [
  ["5A1ai","115A(1)(a)(i) - Dividends/interest/units in foreign currency (foreign co.)"],
  ["5A1aA","115A(1)(a)(A) - Dividend from an IFSC unit u/s 80LA(1A)"],
  ["5A1aii","115A(1)(a)(ii) - Interest from govt/Indian concerns in foreign currency"],
  ["5A1aiia","115A(1)(a)(iia) - Interest from Infrastructure Debt Fund"],
  ["5A1aiiaa","115A(1)(a)(iiaa) - Interest u/s 194LC(1)"],
  ["5A1aiiab","115A(1)(a)(iiab) - Interest u/s 194LD"],
  ["5A1aiiac","115A(1)(a)(iiac) - Interest u/s 194LBA"],
  ["5A1aiii","115A(1)(a)(iii) - Income from UTI units purchased in foreign currency"],
  ["FA","Para E-II, Part I, 1st Sch of FA - royalty/FTS (old agreements)"],
  ["5A1bA","115A(1)(b)(A) - Royalty / fees for technical services"],
  ["5AB1a","115AB(1)(a) - Units purchased in foreign currency by an off-shore fund"],
  ["5AC1ab","115AC(1)(a) - Interest on bonds/GDRs in foreign currency (non-resident)"],
  ["5AC1abD","115AC(1)(b) - Dividend on GDRs in foreign currency (non-resident)"],
  ["5AD1i","115AD(1)(i) - FII income (other than dividend) on securities"],
  ["5AD1iP","115AD(1)(i) - FII income on bonds/govt securities (194LD)"],
  ["5BBA","115BBA - Non-resident sportsmen / sports associations"],
  ["5BBF","115BBF - Income from patent"],
  ["5BBG","115BBG - Transfer of carbon credits"],
  ["5A1aiiaaP","115A(1)(a)(iiaa) - Interest per proviso to 194LC(1)"],
  ["5A1aiiaa2P","115A(1)(a)(iiaa) - Interest per second proviso to 194LC(1)"],
  ["5AD1iDiv","115AD(1)(i) - FII dividend income"],
  ["5AD1IBd","115AD(1)(i)(B) - Specified-fund dividend income"],
  ["5AD1IB","115AD(1)(i)(B) - Specified-fund income (other than dividend)"]];
/* 2d — PTIOthersGrossDtls[].SourceDescription (schema enum, 23 codes) */
const OS6_PTI = [
  ["PTI_5A1ai","PTI 115A(1)(a)(i) - Dividends/interest/units in foreign currency"],
  ["PTI_5A1aA","PTI 115A(1)(a)(A) - Dividend from an IFSC unit u/s 80LA(1A)"],
  ["PTI_5A1aii","PTI 115A(1)(a)(ii) - Interest in foreign currency"],
  ["PTI_5A1aiia","PTI 115A(1)(a)(iia) - Interest from Infrastructure Debt Fund"],
  ["PTI_5A1aiiaa","PTI 115A(1)(a)(iiaa) - Interest u/s 194LC(1)"],
  ["PTI_5A1aiiab","PTI 115A(1)(a)(iiab) - Interest u/s 194LD"],
  ["PTI_5A1aiiac","PTI 115A(1)(a)(iiac) - Interest u/s 194LBA"],
  ["PTI_5A1aiii","PTI 115A(1)(a)(iii) - Income from UTI units in foreign currency"],
  ["PTI_FA","PTI Para E-II, Part I, 1st Sch of FA - royalty/FTS (old agreements)"],
  ["PTI_5A1bA","PTI 115A(1)(b)(A) - Royalty / fees for technical services"],
  ["PTI_5AB1a","PTI 115AB(1)(a) - Units purchased in foreign currency (off-shore fund)"],
  ["PTI_5AC1ab","PTI 115AC(1)(a) - Interest on bonds/GDRs in foreign currency"],
  ["PTI_5AC1abD","PTI 115AC(1)(b) - Dividend on GDRs in foreign currency"],
  ["PTI_5AD1i","PTI 115AD(1)(i) - FII income (other than dividend) on securities"],
  ["PTI_5AD1iP","PTI 115AD(1)(i) - FII income on bonds/govt securities (194LD)"],
  ["PTI_5BBA","PTI 115BBA - Non-resident sportsmen / sports associations"],
  ["PTI_5BBF","PTI 115BBF - Income from patent"],
  ["PTI_5BBG","PTI 115BBG - Transfer of carbon credits"],
  ["PTI_5A1aiiaaP","PTI 115A(1)(a)(iiaa) - Interest per proviso to 194LC(1)"],
  ["PTI_5A1aiiaa2P","PTI 115A(1)(a)(iiaa) - Interest per second proviso to 194LC(1)"],
  ["PTI_5AD1iDiv","PTI 115AD(1)(i) - FII dividend income"],
  ["PTI_5AD1IBd","PTI 115AD(1)(i)(B) - Specified-fund dividend income"],
  ["PTI_5AD1IB","PTI 115AD(1)(i)(B) - Specified-fund income (other than dividend)"]];
/* 2e col (3) "Item No." (NRIDTAADtlsSchOS[].NatureOfIncome, 9 values — book Appendix C) */
const OS6_DTAA_NAT = [["1ai","1a(i) - Dividend"],["1aiii","1a(iii) - Dividend 2(22)(f)"],
  ["1b","1b - Interest"],["1c","1c - Rental machinery/plant/buildings"],["1d","1d - 56(2)(x)"],
  ["2ai","2a(i) - Winnings 115BB"],["2aii","2a(ii) - Online games 115BBJ"],
  ["2c","2c - Other special-rate"],["2d","2d - PTI special-rate"]];
/* 2e col (8) "Section of I.T. Act" (NRIDTAADtlsSchOS[].SecITAct, schema enum 54 codes) */
const OS6_DTAA_SEC = [
  ["56i","56(2)(i) - Dividends"],["56","56(2) - Interest"],["56i_f","56(2)(i) - Dividends u/s 2(22)(f)"],
  ["562iii","56(2)(iii) - Rental income machinery/plant/buildings"],["562x","56(2)(x)"],
  ["5A1ai","115A(1)(a)(i)"],["5A1aA","115A(1)(a)(A)"],["5A1aii","115A(1)(a)(ii)"],
  ["5A1aiia","115A(1)(a)(iia)"],["5A1aiiaa","115A(1)(a)(iiaa)"],["5A1aiiab","115A(1)(a)(iiab)"],
  ["5A1aiiac","115A(1)(a)(iiac)"],["5A1aiii","115A(1)(a)(iii)"],["FA","Para E-II 1st Sch of FA - royalty/FTS"],
  ["5A1bA","115A(1)(b)(A)"],["5AB1a","115AB(1)(a)"],["5AC1ab","115AC(1)(a)"],["5AC1abD","115AC(1)(b)"],
  ["5AD1i","115AD(1)(i)"],["5AD1iP","115AD(1)(i) - 194LD"],["5BBA","115BBA"],
  ["5BBG","115BBG - carbon credits"],["5BB","115BB - Winnings"],["5BBJ","115BBJ - Online games"],
  ["5BBF","115BBF - Patent"],
  ["PTI_5A1ai","PTI 115A(1)(a)(i)"],["PTI_5A1aA","PTI 115A(1)(a)(A)"],["PTI_5A1aii","PTI 115A(1)(a)(ii)"],
  ["PTI_5A1aiia","PTI 115A(1)(a)(iia)"],["PTI_5A1aiiaa","PTI 115A(1)(a)(iiaa)"],
  ["PTI_5A1aiiab","PTI 115A(1)(a)(iiab)"],["PTI_5A1aiiac","PTI 115A(1)(a)(iiac)"],
  ["PTI_5A1aiii","PTI 115A(1)(a)(iii)"],["PTI_FA","PTI Para E-II 1st Sch of FA"],
  ["PTI_5A1bA","PTI 115A(1)(b)(A)"],["PTI_5AB1a","PTI 115AB(1)(a)"],["PTI_5AC1ab","PTI 115AC(1)(a)"],
  ["PTI_5AC1abD","PTI 115AC(1)(b)"],["PTI_5AD1i","PTI 115AD(1)(i)"],["PTI_5AD1iP","PTI 115AD(1)(i) - 194LD"],
  ["PTI_5BBA","PTI 115BBA"],["PTI_5BBG","PTI 115BBG - carbon credits"],["PTI_5BB","PTI 115BB - Winnings"],
  ["PTI_5BBF","PTI 115BBF - Patent"],
  ["5A1aiiaaP","115A(1)(a)(iiaa) - proviso to 194LC(1)"],["5A1aiiaa2P","115A(1)(a)(iiaa) - 2nd proviso to 194LC(1)"],
  ["5AD1iDiv","115AD(1)(i) - FII dividend"],["PTI_5A1aiiaaP","PTI 115A(1)(a)(iiaa) - proviso to 194LC(1)"],
  ["PTI_5A1aiiaa2P","PTI 115A(1)(a)(iiaa) - 2nd proviso to 194LC(1)"],["PTI_5AD1iDiv","PTI 115AD(1)(i) - FII dividend"],
  ["5AD1IBd","115AD(1)(i)(B) - specified-fund dividend"],["5AD1IB","115AD(1)(i)(B) - specified-fund other"],
  ["PTI_5AD1IBd","PTI 115AD(1)(i)(B) - specified-fund dividend"],["PTI_5AD1IB","PTI 115AD(1)(i)(B) - specified-fund other"]];
/* 2e col (4) country dropdown (CountryCodeExcludingIndia, code:name — book Appendix A) */
const OS6_CC = [["93","AFGHANISTAN"],["1001","ALAND ISLANDS"],["355","ALBANIA"],["213","ALGERIA"],
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
const OS6_CCNAME = {}; OS6_CC.forEach(x=>{OS6_CCNAME[x[0]]=x[1];});
const OS6_TRC = [["Y","Yes"],["N","No"]];

/* item-10 quarterly rows (book §9): ten LIVE blocks, five DateRange leaves each
   (all standard periods — ITR-6 has no ALT-period rows), all required. */
const OS6_QP = ["Upto15Of6","Up16Of6To15Of9","Up16Of9To15Of12","Up16Of12To15Of3","Up16Of3To31Of3"];
const OS6_QROWS = [
  {k:"lottery",     o:"IncFrmLottery",           l:"Winnings from lotteries, crossword puzzles, races, games, gambling, betting etc. [2(24)(ix)]  (= 2a(i))"},
  {k:"ongames",     o:"IncFrmOnGames",           l:"Winnings from online games u/s 115BBJ  (= 2a(ii))"},
  {k:"d115bbda",    o:"DividendIncUs115BBDA",     l:"Dividend income referred in Sl.No.1a(i)  (= 1a(i) − DTAA − adj. 57(1) interest)"},
  {k:"d115bbdaaiii",o:"DividendIncUs115BBDAaiii", l:"Dividend income referred in Sl.No.1a(iii)  (= 1a(iii) − DTAA of 1a(iii))"},
  {k:"d115a1ai",    o:"DividendIncUs115A1ai",     l:"Dividend u/s 115A(1)(a)(i) @20% (incl. PTI)  (= dividend selected at 2c/2d)"},
  {k:"d115a1aA",    o:"DividendIncUs115A1aA",     l:"Dividend per proviso to 115A(1)(a)(A) @10% (incl. PTI) — IFSC unit"},
  {k:"d115ac",      o:"DividendIncUs115AC",       l:"Dividend u/s 115AC @10% (incl. PTI)  (= 2c/2d)"},
  {k:"d115ad1idiv", o:"DividendIncUs115AD1iDiv",  l:"Dividend received by a FII u/s 115AD(1)(i) @20% (incl. PTI)"},
  {k:"d115ad1ibd",  o:"DividendIncUs115AD1IBd",   l:"Dividend received by a specified fund u/s 115AD(1)(i) @10% (incl. PTI)"},
  {k:"divdtaa",     o:"DividendDTAA",             l:"Dividend income taxable at DTAA rates"}
];
const OS6_QCOLH = ["Upto 15/6 (i)","16/6–15/9 (ii)","16/9–15/12 (iii)","16/12–15/3 (iv)","16/3–31/3 (v)"];

const os6_isNRI = ()=> (S.pi && S.pi.res) === "NRI";

/* ---- engine ------------------------------------------------------ */
function engOs(){
  S.os = S.os || {};
  const O = S.os;
  const C = S.C.os = { income:0 };

  /* ===== item 1 — gross income at normal applicable rates ===== */
  /* 1a (J5) = 1a(i) + 1a(ii) + 1a(iii) */
  const div_i=R(O.divOth), div_ii=R(O.div22e), div_iii=R(O.div22f);
  const a1 = div_i + div_ii + div_iii;                                    /* DividendGross */
  /* 1b (J9) = FIVE interest lines; PTI interest (1b(iv)) may be negative */
  const bi=R(O.intSaving), bii=R(O.intDeposit), biii=R(O.intRefund), biv=R(O.intPTI), bv=R(O.intOthers);
  const b1 = bi+bii+biii+biv+bv;                                          /* InterestGross */
  /* 1c */
  const c1 = R(O.rentMach);                                               /* RentFromMachPlantBldgs */
  /* 1d (J16) = MAX(0, 56(2)(x) five lines) */
  const d_i=R(O.giftMoney), d_ii=R(O.giftImmovWo), d_iii=R(O.giftImmovInadeq),
        d_iv=R(O.giftOthWo), d_v=R(O.giftOthInadeq);
  const d1 = Math.max(0, d_i+d_ii+d_iii+d_iv+d_v);                        /* Tot562x */
  /* 1e (J22) = MAX(0, free rows + business-trust 56(2)(xii)) */
  const othersSum = (O.others||[]).reduce((s,r)=>s+R(r.amt),0);
  const biz562xii = R(O.sum562xii);
  const e1 = Math.max(0, othersSum + biz562xii);                          /* AnyOtherIncome */
  const item1 = a1 + b1 + c1 + d1 + e1;                                   /* J4 GrossIncChrgblTaxAtAppRate */

  /* ===== item 2 — special rates ===== */
  const s2ai = R(O.win115BB);                                             /* LtryPzzlChrgblUs115BB */
  const s2aii = R(O.win115BBJ);                                           /* IncChrgblUs115BBJ */
  /* 2b (J32) = MAX(0, six 68/69 lines) */
  const b2 = Math.max(0, R(O.cc68)+R(O.ui69)+R(O.um69a)+R(O.udi69b)+R(O.ue69c)+R(O.hundi69d)); /* IncChrgblUs115BBE */
  /* 2c (J46) = Σ SourceAmount */
  const d2c = (O.spl||[]).reduce((s,r)=>s+R(r.amt),0);                    /* OthersGross */
  /* 2d (J58) = Σ PTI amounts */
  const d2d = (O.pti||[]).reduce((s,r)=>s+R(r.amt),0);                    /* PassThrIncOSChrgblSplRate */
  /* 2e (J65) DTAA — for an NRI only TRC="Y" rows count; residents: all rows */
  const dtaaRows = (O.dtaa||[]).map(r=>{
    const treaty = st0(r.treaty).toUpperCase()==="NIL" ? 0 : N(r.treaty);
    const hasTreaty = st0(r.treaty)!=="";
    const itact  = N(r.itact);
    const hasItact = st0(r.itact)!=="";
    /* col 10 applicable rate = lower of treaty (col 6) and IT-Act (col 9); L67 blanks it
       for a non-resident whose TRC is not "Y" */
    let appl = hasTreaty ? (hasItact ? Math.min(treaty,itact) : treaty) : (hasItact ? itact : "");
    if(os6_isNRI() && r.trc!=="Y") appl = "";
    const counts = os6_isNRI() ? (r.trc==="Y") : true;                    /* rule 495 / J65 */
    return {amt:R(r.amt), nature:st0(r.nature), sec:st0(r.sec), treaty, hasTreaty,
            itact, hasItact, appl, trc:r.trc||"", counts,
            cc:st0(r.cc), article:st0(r.article)};
  });
  /* DTAA6 = the item-1-attributable DTAA portion (natures 1ai,1aiii,1b,1c,1d),
     moved from the normal leg (item 6 subtracts) to the special leg (item 2 adds) */
  const OS_ITEM1_NAT = ["1ai","1aiii","1b","1c","1d"];
  const dtaa6 = dtaaRows.filter(r=>r.counts && OS_ITEM1_NAT.indexOf(r.nature)>=0)
                        .reduce((s,r)=>s+r.amt,0);                        /* OS.DTAA6 */
  const f2 = dtaaRows.filter(r=>r.counts).reduce((s,r)=>s+r.amt,0);       /* TotalAmtTaxUsDTAASchOs */
  /* item 2 (J29) = MAX(0, 2ai + 2aii + 2b + 2c + 2d + DTAA6) */
  const item2 = Math.max(0, s2ai + s2aii + b2 + d2c + d2d + dtaa6);       /* IncChargeableSpecialRates */

  /* ===== item 3 — section 57 deductions ===== */
  const expenses = R(O.dExpenses);                                        /* 3a Expenses */
  /* 3b depreciation — allowed only if rental income (1c) offered, restricted to 1c (rule 465) */
  const dep = c1>0 ? Math.min(Math.max(0,R(O.dDep)), c1) : 0;             /* Depreciation */
  /* 3c interest expenditure u/s 57(1): eligible ≤ 20% of dividend at 1a(i)+1a(ii) (rule 493) */
  const claimedInt = Math.max(0,R(O.dIntClaimed));                        /* UsrIntExp57 */
  const divForInt = div_i + div_ii;                                       /* 1a(i)+1a(ii) */
  const eligInt = divForInt>0 ? Math.min(claimedInt, R(0.20*divForInt)) : 0; /* IntExp57 */
  const totDed = expenses + dep + eligInt;                                /* J78 TotDeductions (3a+3b+3c) */

  /* ===== items 4, 5 ===== */
  const notDed58 = R(O.notDed58);                                         /* AmtNotDeductibleUs58 */
  const profit59 = R(O.profit59);                                         /* ProfitChargTaxUs59 */

  /* ===== item 6 (L81), signed — a loss routes to CYLA 4i ===== */
  const item6 = item1 - dtaa6 - totDed + notDed58 + profit59;            /* BalanceNoRaceHorse */

  /* ===== item 7 (L82) = 2 + MAX(0, 6) ===== */
  const item7 = item2 + Math.max(0, item6);                              /* TotOthSrcNoRaceHorse */

  /* ===== item 8 — race horses (L88) ===== */
  const H = O.horse||{};
  const hReceipts=R(H.receipts), hDed57=Math.max(0,R(H.ded57)), hNot58=R(H.notDed58), hProfit59=R(H.profit59);
  const item8e = hReceipts - hDed57 + hNot58 + hProfit59;                /* BalanceOwnRaceHorse (signed) */

  /* ===== item 9 (L89) = 7 + MAX(0, 8e) ===== */
  const item9 = item7 + Math.max(0, item8e);                             /* IncChargeableFrmOthSrc */

  /* ---- expose the working ---- */
  C.a1={i:div_i,ii:div_ii,iii:div_iii,tot:a1};
  C.b1={i:bi,ii:bii,iii:biii,iv:biv,v:bv,tot:b1};
  C.c1=c1;
  C.d1={i:d_i,ii:d_ii,iii:d_iii,iv:d_iv,v:d_v,tot:d1};
  C.e1={others:othersSum, biz562xii:biz562xii, tot:e1};
  C.item1=item1;
  C.s2ai=s2ai; C.s2aii=s2aii; C.b2=b2;
  C.d2c=d2c; C.d2d=d2d; C.f2=f2; C.dtaa6=dtaa6; C.dtaaRows=dtaaRows;
  C.item2=item2;
  C.ded={expenses, dep, claimedInt, eligInt, tot:totDed};
  C.notDed58=notDed58; C.profit59=profit59;
  C.item6=item6; C.item7=item7;
  C.horse={receipts:hReceipts, ded57:hDed57, not58:hNot58, profit59:hProfit59, bal:item8e};
  C.item9=item9;

  /* ---- rolls for other sections (loss / si / tax) ---- */
  C.netNormal  = R(item6);                 /* signed; <0 → CYLA 4i (rule 518) */
  C.normal     = R(item6);                 /* alias */
  C.six        = R(item6);                 /* alias (tax-section fallback name) */
  C.special    = R(item2);                 /* special-rate OS income → Schedule SI / Part B-TI */
  C.raceHorse  = R(item8e);                /* signed; <0 → Schedule CFL (rule 561: 11xix) */
  C.chargeable = R(item9);                 /* IncChargeableFrmOthSrc → Part B-TI */
  C.dtaaTotal  = R(f2);                    /* 2e total → Schedule SI DTAA / CYLA (rule 524, 616) */
  /* GTI contribution — signed on the normal leg so a loss reaches CYLA */
  C.income = R(item2 + item6 + Math.max(0, item8e));

  /* ================= Schedule-SI feed (special-rate OS heads) =================
     70_sec_si.js consumes S.C.os.siFeed keyed by the schema SecCode (SI.md
     §2/§3/§6). A value is a plain number (income — si.js supplies the rate
     from SI_RATE_DEF and computes the tax) or {inc,tax} for the DTAA head
     (treaty tax, rule A618). Every amount is REUSED from item 2 above — the
     2a winnings, 2b 115BBE, and the 2c/2d dropdown incomes summed by their
     own section code (which is already the schema enum spelling, verified
     against the SI SecCode enum) — never recomputed.

     DTAA netting (SI.md §6 r58 + Feed summary; OS book §13 l.407–410, rules
     616/630/631 "…after reducing DTAA"): the 2e income is disclosed once, at
     the treaty rate, under the single OS-DTAA head (code DTAAOS = the whole
     2e total f2, tax = Σ income × the applicable lower-of-treaty/IT-Act rate).
     Because the same DTAA income is also carried inside the 2a/2c/2d figures
     (see the item-2 note above — the 2ai/2aii/2c/2d DTAA rows are NOT re-added
     into item 2, they already sit in those heads), each special-rate head is
     reduced by its own counted-DTAA portion so no rupee is taxed twice; the
     natures map 2ai→5BB, 2aii→5BBJ 1:1, and a 2c/2d row names its head in the
     SecITAct (enum) column. The fed heads then reconcile to item 2. A head is
     emitted only when its remaining income is > 0 (SI.md §12.1). */
  const siFeed = {};
  const dtRows = (dtaaRows || []).filter(r => r.counts);           /* rule 495 gate already applied */
  const sumDt  = pred => dtRows.filter(pred).reduce((s, r) => s + r.amt, 0);

  /* gross special-rate incomes by SecCode, straight from item 2 */
  const osGross = {};
  const bump = (code, amt) => { if (code) osGross[code] = (osGross[code] || 0) + R(amt); };
  bump("5BB",  s2ai);                                              /* 2a(i)  115BB   */
  bump("5BBJ", s2aii);                                             /* 2a(ii) 115BBJ  */
  bump("5BBE", b2);                                                /* 2b     115BBE (never DTAA) */
  (O.spl || []).forEach(r => bump(st0(r.code), r.amt));            /* 2c dropdown incomes */
  (O.pti || []).forEach(r => bump(st0(r.code), r.amt));            /* 2d dropdown incomes */

  /* the DTAA portion carried inside those gross figures, by SecCode */
  const osDtaa = {};
  const bumpDt = (code, amt) => { if (code) osDtaa[code] = (osDtaa[code] || 0) + R(amt); };
  bumpDt("5BB",  sumDt(r => r.nature === "2ai"));                  /* 2ai ↔ 5BB   */
  bumpDt("5BBJ", sumDt(r => r.nature === "2aii"));                 /* 2aii ↔ 5BBJ */
  dtRows.filter(r => r.nature === "2c" || r.nature === "2d")       /* 2c/2d named by SecITAct */
        .forEach(r => bumpDt(st0(r.sec), r.amt));

  /* net each head; publish only what still carries income */
  Object.keys(osGross).forEach(code => {
    const net = R(Math.max(0, osGross[code] - R(osDtaa[code] || 0)));
    if (net > 0) siFeed[code] = net;
  });

  /* OS-DTAA head — the whole 2e total at the treaty rate ({inc,tax}); tax is
     Σ income × applicable rate (lower of treaty / IT-Act, per row). */
  if (R(f2) > 0) {
    const dtaaTax = dtRows.reduce((s, r) => {
      const rate = (r.appl !== "" && r.appl != null) ? N(r.appl) : 0;
      return s + R(r.amt * rate / 100);
    }, 0);
    siFeed["DTAAOS"] = { inc: R(f2), tax: R(dtaaTax) };
  }

  C.siFeed = siFeed;                        /* special-rate OS heads → Schedule SI (S.C.os.siFeed) */
}

/* ---- renderer ---------------------------------------------------- */
function secOs(){
  const O = S.os||{}, C = S.C.os||{};
  let h = "";

  h += note('Income from Other Sources for a company. Dividend reduced in Schedule BP / P&L must be offered here (rules 200, 201); a buy-back capital loss claimed in Schedule CG requires the 2(22)(f) dividend at 1a(iii) to be filled (rules 433, 500).');

  /* ===== item 1 — normal-rate income ===== */
  {
    let b = "";
    /* 1a — dividends */
    b += row("1a · Dividends, Gross (i + ii + iii)", cell((C.a1||{}).tot), {ref:"1a", cls:"tot"});
    b += row("Dividend income [other than (ii) and (iii)]", inp("os.divOth",{n:1}), {ind:1, ref:"1a(i)"});
    b += row("Dividend income u/s 2(22)(e)", inp("os.div22e",{n:1}), {ind:1, ref:"1a(ii)"});
    b += row("Dividend income u/s 2(22)(f) — buy-back treated as dividend", inp("os.div22f",{n:1}), {ind:1, ref:"1a(iii)",
      hint:"fill this if a buy-back loss is claimed in Schedule CG (rules 433, 500)"});
    /* 1b — interest (five lines) */
    b += row("1b · Interest, Gross (i … v)", cell((C.b1||{}).tot), {ref:"1b", cls:"tot"});
    b += row("From Savings Bank", inp("os.intSaving",{n:1}), {ind:1, ref:"1b(i)"});
    b += row("From Deposit (Bank / Post Office / Co-op Society)", inp("os.intDeposit",{n:1}), {ind:1, ref:"1b(ii)"});
    b += row("From Income Tax refund", inp("os.intRefund",{n:1}), {ind:1, ref:"1b(iii)"});
    b += row("In the nature of Pass through income / loss", inp("os.intPTI",{n:1}), {ind:1, ref:"1b(iv)", hint:"may be negative"});
    b += row("Others, incl. interest from Companies, NBFCs & HFCs", inp("os.intOthers",{n:1}), {ind:1, ref:"1b(v)"});
    /* 1c */
    b += row("1c · Rental income from machinery, plants, buildings etc., Gross", inp("os.rentMach",{n:1}), {ref:"1c",
      hint:"unlocks the depreciation deduction at 3b"});
    /* 1d — 56(2)(x) */
    b += row("1d · Income u/s 56(2)(x) chargeable to tax (i … v, floored at nil)", cell((C.d1||{}).tot), {ref:"1d", cls:"tot"});
    b += row("Aggregate sum of money received without consideration", inp("os.giftMoney",{n:1}), {ind:1, ref:"1d(i)"});
    b += row("Immovable property without consideration — stamp duty value", inp("os.giftImmovWo",{n:1}), {ind:1, ref:"1d(ii)"});
    b += row("Immovable property for inadequate consideration — SDV in excess", inp("os.giftImmovInadeq",{n:1}), {ind:1, ref:"1d(iii)"});
    b += row("Any other property without consideration — fair market value", inp("os.giftOthWo",{n:1}), {ind:1, ref:"1d(iv)"});
    b += row("Any other property for inadequate consideration — FMV in excess", inp("os.giftOthInadeq",{n:1}), {ind:1, ref:"1d(v)"});
    /* 1e — any other income */
    b += row("1e · Any other income (floored at nil)", cell((C.e1||{}).tot), {ref:"1e", cls:"tot"});
    b += row("Specified sum received by a unit holder from a business trust u/s 56(2)(xii)", inp("os.sum562xii",{n:1}), {ind:1, ref:"1e"});
    b += sub("Any other income — specify nature and amount");
    b += grid("os.others",[
      {k:"nat",h:"Nature",t:"txt",max:50,req:1},
      {k:"amt",h:"Amount",t:"num",w:"160px",req:1}
    ], O.others||[], {empty:"No other-income rows.", add:"Add an income row"});
    b += row("1 · Gross income chargeable at normal rates (1a+1b+1c+1d+1e)", cell(C.item1), {ref:"1", cls:"tot"});
    h += fold("os_1","1","Income chargeable at normal applicable rates", RS(C.item1||0), b, {def:true});
  }

  /* ===== item 2 — special rates ===== */
  {
    let b = "";
    b += note("Nothing in item 3 (deductions u/s 57) may be set against the special-rate income at 2a–2e (sheet row 72).");
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
    /* 2c — other special-rate sources */
    b += sub("2c · Any other income chargeable at special rate");
    b += note("The utility narrows the section list by residential status; the full filed set is shown here (book §3).");
    b += grid("os.spl",[
      {k:"code",h:"Nature (special-rate section)",t:"sel",opts:OS6_SPL,req:1},
      {k:"amt",h:"Amount",t:"num",w:"150px"}
    ], O.spl||[], {min:640, empty:"No special-rate rows.", add:"Add a special-rate row",
       foot:[{l:1,v:"2c Total"},{v:C.d2c}]});
    /* 2d — PTI special-rate */
    b += sub("2d · Pass through income in the nature of income from other sources at special rate");
    b += grid("os.pti",[
      {k:"code",h:"Nature (PTI special-rate section)",t:"sel",opts:OS6_PTI,req:1},
      {k:"amt",h:"Amount",t:"num",w:"150px"}
    ], O.pti||[], {min:640, empty:"No PTI special-rate rows.", add:"Add a PTI row",
       foot:[{l:1,v:"2d Total"},{v:C.d2d}]});
    /* 2e — DTAA */
    b += sub("2e · Amount included in 1 and 2 above, chargeable at special rates in India as per DTAA (non-residents only)");
    b += note("For a non-resident a row counts in the 2e total only if the TRC is obtained (Yes); for a resident every row counts. The applicable rate is the lower of the treaty rate and the Income-tax Act rate. DTAA attributable to items 1a(i)/1a(iii)/1b/1c/1d is moved from item 6 to item 2.");
    b += grid("os.dtaa",[
      {k:"amt",h:"Amount of income",t:"num",w:"130px",req:1},
      {k:"nature",h:"Item No. in which included",t:"sel",opts:OS6_DTAA_NAT,req:1},
      {k:"cc",h:"Country",t:"sel",opts:OS6_CC,req:1},
      {k:"article",h:"Article of DTAA",t:"txt",max:20,req:1},
      {k:"treaty",h:"Rate as per Treaty (NIL if not chargeable)",t:"txt",max:10,req:1},
      {k:"trc",h:"TRC obtained",t:"sel",opts:OS6_TRC},
      {k:"sec",h:"Section of I.T. Act",t:"sel",opts:OS6_DTAA_SEC,req:1},
      {k:"itact",h:"Rate as per I.T. Act",t:"txt",max:10,req:1},
      {k:"appl",h:"Applicable rate [lower of Treaty, I.T. Act]",t:"calc",f:(r,i)=>((C.dtaaRows||[])[i]||{}).appl}
    ], O.dtaa||[], {min:1180, empty:"No DTAA rows.", add:"Add a DTAA row",
       foot:[{l:1,v:"2e Total"},{v:C.f2},{l:1,v:"",span:7}]});
    b += row("2 · Income chargeable at special rates (2ai+2aii+2b+2c+2d+2e)", cell(C.item2), {ref:"2", cls:"tot"});
    h += fold("os_2","2","Income chargeable at special rates", RS(C.item2||0), b);
  }

  /* ===== item 3 — section 57 deductions ===== */
  {
    const D = C.ded||{};
    let b = "";
    b += row("3a · Expenses / deductions (other than those relating to 2a–2e)", inp("os.dExpenses",{n:1}), {ref:"3a"});
    b += row("3b · Depreciation (available only if rental income offered at 1c)", (C.c1>0?inp("os.dDep",{n:1}):cell(0)), {ref:"3b",
      hint:(C.c1>0?"restricted to the 1c rental income (rule 465)":"available only when rental income is offered at 1c")});
    if(C.c1>0) b += row("3b · Depreciation allowed — computed", cell(D.dep), {ind:1, ref:"3b", cls:"tot"});
    b += row("3c · Interest expenditure u/s 57(1) claimed (dividend only)", inp("os.dIntClaimed",{n:1}), {ref:"3c",
      hint:"available only if dividend offered at 1a(i)/1a(ii); eligible ≤ 20% of that dividend"});
    b += row("3c · Eligible interest expenditure u/s 57(1) — computed", cell(D.eligInt), {ind:1, ref:"3c", cls:"tot"});
    b += row("3d · Total deductions (3a + 3b + 3c)", cell(D.tot), {ref:"3d", cls:"tot"});
    h += fold("os_3","3","Deductions under section 57", RS((C.ded||{}).tot||0), b);
  }

  /* ===== items 4–7 ===== */
  {
    let b = "";
    b += row("4 · Amounts not deductible u/s 58", inp("os.notDed58",{n:1}), {ref:"4"});
    b += row("5 · Profits chargeable to tax u/s 59", inp("os.profit59",{n:1}), {ref:"5"});
    if(C.dtaa6) b += row("Less: DTAA amounts attributable to item-1 lines (moved to item 2)", cell(-(C.dtaa6||0)), {ind:1, ref:"L81"});
    b += row("6 · Net income at normal rates (1 − DTAA − 3 + 4 + 5); a loss goes to CYLA 4i", cell(C.item6), {ref:"6", cls:"tot"});
    b += row("7 · Income from other sources other than race horses (2 + 6; 6 as nil if negative)", cell(C.item7), {ref:"7", cls:"tot"});
    h += fold("os_67","4–7","Net income from other sources", RS(C.item7||0), b, {def:true});
  }

  /* ===== item 8 — race horses (its own card, off by default) ===== */
  {
    const RH = C.horse||{};
    let b = "";
    b += row("8a · Receipts", inp("os.horse.receipts",{n:1}), {ref:"8a"});
    b += row("8b · Deductions u/s 57 in relation to 8a only", inp("os.horse.ded57",{n:1}), {ref:"8b"});
    b += row("8c · Amounts not deductible u/s 58", inp("os.horse.notDed58",{n:1}), {ref:"8c"});
    b += row("8d · Profits chargeable to tax u/s 59", inp("os.horse.profit59",{n:1}), {ref:"8d"});
    b += row("8e · Balance (8a − 8b + 8c + 8d)", cell(RH.bal), {ref:"8e", cls:"tot"});
    if(R(RH.bal)<0) b += note("A negative 8e is a race-horse loss carried to Schedule CFL (sheet: 11xvii; rule 561: 11xix) and taken as nil at item 9. It is set off against race-horse income only, for four years.");
    h += fold("os_8","8","Income from owning and maintaining race horses", RS((C.horse||{}).bal||0), b);
  }

  /* ===== item 9 ===== */
  h += row("9 · Income under the head “Income from other sources” (7 + 8e; 8e as nil if negative)",
           cell(C.item9), {ref:"9", cls:"tot"});

  /* ===== item 10 — quarterly accrual/receipt ===== */
  {
    let t = '<div class="full"><table class="gt" style="min-width:960px"><thead><tr>'+
      '<th class="l">Other Source Income</th>'+OS6_QCOLH.map(x=>'<th>'+esc(x)+'</th>').join("")+'</tr></thead><tbody>';
    OS6_QROWS.forEach(qr=>{
      t += '<tr><td class="l">'+esc(qr.l)+'</td>'+
        OS6_QP.map(pk=>'<td>'+inp("os.q."+qr.k+"."+pk,{n:1})+'</td>').join("")+'</tr>';
    });
    t += '</tbody></table></div>';
    let b = note("Quarterly break-up of income that accrues or is received under this head, for interest u/s 234C. Each row must reconcile to its source figure by its tie-back rule (e.g. row 1 = 2a(i); the 1a(i) dividend row = 1a(i) − DTAA subject to TRC − adjusted interest u/s 57).");
    b += t;
    h += fold("os_10","10","Information about accrual / receipt of income from Other Sources", "", b);
  }

  return h;
}

/* ---- export ------------------------------------------------------ */
function expOs(j){
  const C = S.C.os||{}, O = S.os||{};

  /* ---- item 3 Deductions object (required: Depreciation, TotDeductions) ---- */
  const D = C.ded||{};
  const ded = { Depreciation:n0(D.dep), TotDeductions:n0(D.tot) };
  if(D.expenses)   ded.Expenses    = sg(D.expenses);
  if(D.claimedInt) ded.UsrIntExp57 = n0(D.claimedInt);
  if(D.eligInt)    ded.IntExp57    = n0(D.eligInt);

  /* ---- IncOthThanOwnRaceHorse (parent of items 1–7) ---- */
  const a1=C.a1||{}, b1=C.b1||{}, d1=C.d1||{}, e1=C.e1||{};
  const io = {
    GrossIncChrgblTaxAtAppRate: sg(C.item1),
    DividendGross: sg(a1.tot),
    DividendOthThan22e: sg(a1.i),
    Dividend22e: sg(a1.ii),
    Dividend22f: sg(a1.iii),
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
    IncChargeableSpecialRates: sg(C.item2),
    LtryPzzlChrgblUs115BB: sg(C.s2ai),
    IncChrgblUs115BBE: n0(C.b2),
    CashCreditsUs68: sg(R(O.cc68)),
    UnExplndInvstmntsUs69: sg(R(O.ui69)),
    UnExplndMoneyUs69A: sg(R(O.um69a)),
    UnDsclsdInvstmntsUs69B: sg(R(O.udi69b)),
    UnExplndExpndtrUs69C: sg(R(O.ue69c)),
    AmtBrwdRepaidOnHundiUs69D: sg(R(O.hundi69d)),
    OthersGross: n0(C.d2c),
    PassThrIncOSChrgblSplRate: n0(C.d2d),
    IncChargblSplRateOS: { TotalAmtTaxUsDTAASchOs: n0(C.f2) },
    Deductions: ded,
    BalanceNoRaceHorse: sg(C.item6)
  };
  /* optional fixed lines */
  if(C.s2aii)        io.IncChrgblUs115BBJ    = sg(C.s2aii);
  if(R(O.sum562xii)) io.SumRecdPrYrBusTRU562xii = sg(R(O.sum562xii));
  if(R(O.notDed58))  io.AmtNotDeductibleUs58  = sg(C.notDed58);
  if(R(O.profit59))  io.ProfitChargTaxUs59    = sg(C.profit59);
  /* 1e free "any other income" rows */
  const others = (O.others||[]).filter(r=>st0(r.nat)||R(r.amt));
  if(others.length) io.OthersInc = { OthersIncDtls: others.map(r=>({
    OthNatOfInc:(sv(r.nat)||"NA").slice(0,50), OthAmount:sg(R(r.amt)) })) };
  /* 2c other special-rate rows */
  const spl = (O.spl||[]).filter(r=>st0(r.code)||R(r.amt));
  if(spl.length) io.OthersGrossDtls = spl.map(r=>({SourceDescription:st0(r.code)||"5AD1i", SourceAmount:sg(R(r.amt))}));
  /* 2d PTI special-rate rows */
  const pti = (O.pti||[]).filter(r=>st0(r.code)||R(r.amt));
  if(pti.length) io.PTIOthersGrossDtls = pti.map(r=>{
    const o = {SourceDescription:st0(r.code)||"PTI_5AD1i"};
    if(R(r.amt)) o.SourceAmount = sg(R(r.amt));
    return o;
  });
  /* 2e DTAA rows */
  const dtaa = (C.dtaaRows||[]).filter(r=>r.amt||st0(r.cc)||st0(r.article));
  if(dtaa.length) io.IncChargblSplRateOS.NRIOsDTAA = { NRIDTAADtlsSchOS: dtaa.map(r=>{
    const o = {
      DTAAamt: sg(r.amt),
      NatureOfIncome: st0(r.nature)||"1ai",
      CountryName: (OS6_CCNAME[st0(r.cc)]||"NA").slice(0,50),
      CountryCodeExcludingIndia: st0(r.cc)||"9999",
      DTAAarticle: (sv(r.article)||"NA").slice(0,20),
      RateAsPerTreaty: r.hasTreaty ? r.treaty : 0,
      SecITAct: st0(r.sec)||"56i",
      RateAsPerITAct: r.hasItact ? r.itact : 0
    };
    if(r.trc) o.TaxRescertifiedFlag = r.trc;
    if(r.appl!=="" && r.appl!=null) o.ApplicableRate = r.appl;
    return o;
  }) };

  const OS = { IncOthThanOwnRaceHorse: io, TotOthSrcNoRaceHorse: sg(C.item7) };

  /* ---- item 8 race horses (required root group; always emitted) ---- */
  const RH = C.horse||{};
  const rh = { Receipts:n0(RH.receipts), DeductSec57:n0(RH.ded57), BalanceOwnRaceHorse:sg(RH.bal) };
  if(RH.not58)    rh.AmtNotDeductibleUs58 = sg(RH.not58);
  if(RH.profit59) rh.ProfitChargTaxUs59   = sg(RH.profit59);
  OS.IncFromOwnHorse = rh;

  /* ---- item 9 ---- */
  OS.IncChargeableFrmOthSrc = sg(C.item9);

  /* ---- item 10 quarterly DateRange objects (all ten required, always present) ---- */
  const q = O.q||{};
  OS6_QROWS.forEach(qr=>{
    const src = q[qr.k]||{};
    const dr = {};
    OS6_QP.forEach(pk=>{ dr[pk] = sg(R(src[pk])); });
    OS[qr.o] = { DateRange: dr };
  });

  j.ScheduleOS = OS;
}

/* ---- import ------------------------------------------------------ */
function impOs(I6){
  const read = [];
  if(!I6 || !I6.ScheduleOS) return read;
  const OS = I6.ScheduleOS, io = OS.IncOthThanOwnRaceHorse||{};
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
  O.dtaa = ((((io.IncChargblSplRateOS||{}).NRIOsDTAA||{}).NRIDTAADtlsSchOS)||[]).map(r=>({
    amt:nz(r.DTAAamt), nature:r.NatureOfIncome||"", cc:r.CountryCodeExcludingIndia||"",
    article:r.DTAAarticle||"", treaty:r.RateAsPerTreaty!=null?String(r.RateAsPerTreaty):"",
    trc:r.TaxRescertifiedFlag||"", sec:r.SecITAct||"",
    itact:r.RateAsPerITAct!=null?String(r.RateAsPerITAct):""}));

  const rh = OS.IncFromOwnHorse||{};
  O.horse = { receipts:nz(rh.Receipts), ded57:nz(rh.DeductSec57),
              notDed58:nz(rh.AmtNotDeductibleUs58), profit59:nz(rh.ProfitChargTaxUs59) };

  O.q = O.q || {};
  OS6_QROWS.forEach(qr=>{
    const dr = (OS[qr.o]||{}).DateRange;
    if(dr){ O.q[qr.k] = O.q[qr.k]||{}; OS6_QP.forEach(pk=>{ O.q[qr.k][pk] = nz(dr[pk]); }); }
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
    out.push({lvl:"err", t:"Section 57 · depreciation", m:"Depreciation (3b) can be claimed only when rental income from machinery/plant/buildings is offered at 1c (rule 465).", sec:"os"});
  else if(R(O.dDep)>0 && R(O.dDep)>C.c1)
    out.push({lvl:"warn", t:"Section 57 · depreciation", m:"Depreciation (3b) is restricted to the 1c rental income of "+RS(C.c1)+"; only that much is allowed (rule 465).", sec:"os"});

  /* 3c interest expenditure — only against dividend at 1a(i)/1a(ii), and ≤ 20% of it */
  const divForInt = (C.a1||{}).i + (C.a1||{}).ii;
  if(R(O.dIntClaimed)>0 && !(divForInt>0))
    out.push({lvl:"err", t:"Section 57 · interest expenditure", m:"Interest expenditure u/s 57(1) (3c) is available only when dividend income is offered at 1a(i) and/or 1a(ii).", sec:"os"});
  else if(R(O.dIntClaimed) > (D.eligInt||0))
    out.push({lvl:"warn", t:"Section 57 · interest expenditure", m:"Interest expenditure u/s 57(1) is restricted to 20% of the dividend at 1a(i)+1a(ii); only "+RS(D.eligInt||0)+" of "+RS(R(O.dIntClaimed))+" claimed is eligible (rule 493).", sec:"os"});

  /* 2e DTAA — NRI/TRC gate and applicable-rate note */
  (C.dtaaRows||[]).forEach((r,i)=>{
    if(os6_isNRI() && r.amt>0 && r.trc!=="Y")
      out.push({lvl:"warn", t:"DTAA row "+(i+1), m:"You are a non-resident and no TRC is obtained for this row, so its "+RS(r.amt)+" is not counted in the 2e DTAA total (rule 495).", sec:"os"});
  });
  /* 2e is a non-resident-only table */
  if((C.dtaaRows||[]).some(r=>r.amt>0) && !os6_isNRI())
    out.push({lvl:"warn", t:"DTAA table", m:"The 2e DTAA table is applicable for non-residents only; the residential status in Part A-General is Resident.", sec:"os"});

  /* per-item DTAA caps (rules 481–487): 1a(i), 1b, 1d, 2a(i), 2a(ii), 2c, 2d */
  const capMap = [
    {nat:"1ai",  lim:(C.a1||{}).i, l:"1a(i) dividend"},
    {nat:"1b",   lim:(C.b1||{}).tot, l:"1b interest"},
    {nat:"1c",   lim:C.c1, l:"1c rental"},
    {nat:"1d",   lim:(C.d1||{}).tot, l:"1d 56(2)(x)"},
    {nat:"2ai",  lim:C.s2ai, l:"2a(i) 115BB"},
    {nat:"2aii", lim:C.s2aii, l:"2a(ii) 115BBJ"},
    {nat:"2c",   lim:C.d2c, l:"2c other special-rate"},
    {nat:"2d",   lim:C.d2d, l:"2d PTI special-rate"}
  ];
  capMap.forEach(cm=>{
    const sum = (C.dtaaRows||[]).filter(r=>r.counts && r.nature===cm.nat).reduce((s,r)=>s+r.amt,0);
    if(sum>R(cm.lim))
      out.push({lvl:"err", t:"DTAA vs "+cm.l, m:"The 2e DTAA amounts against "+cm.l+" ("+RS(sum)+") exceed that item's own figure "+RS(cm.lim)+" (rules 481–487).", sec:"os"});
  });

  /* 115BBF cannot be offered by a non-resident (rules 462, 231, 498) */
  if(os6_isNRI()){
    const has5bbf = (O.spl||[]).some(r=>st0(r.code)==="5BBF") || (O.pti||[]).some(r=>st0(r.code)==="PTI_5BBF");
    if(has5bbf)
      out.push({lvl:"err", t:"Section 115BBF", m:"A non-resident cannot offer patent income u/s 115BBF at 2c/2d (rule 462).", sec:"os"});
  }

  /* item-1 gift 56(2)(x) floored at nil */
  const d1=C.d1||{};
  if((d1.i+d1.ii+d1.iii+d1.iv+d1.v)<0)
    out.push({lvl:"warn", t:"Section 56(2)(x)", m:"The 56(2)(x) sub-lines sum below nil; item 1d is taken as nil.", sec:"os"});

  /* race-horse loss goes to CFL */
  if(R((C.horse||{}).bal)<0)
    out.push({lvl:"ok", t:"Race horses", m:"The race-horse balance (8e) is a loss of "+RS((C.horse||{}).bal)+"; it is carried to Schedule CFL (sheet 11xvii / rule 561 11xix — reconciled by the loss schedule) and taken as nil at item 9.", sec:"os"});

  /* item-6 loss to CYLA 4i */
  if(R(C.item6)<0)
    out.push({lvl:"ok", t:"Other sources loss", m:"Net income at normal rates (item 6) is a loss of "+RS(C.item6)+"; it is available for set-off at 4i of Schedule CYLA (rule 518).", sec:"os"});

  return out;
}

/* ---- register ---------------------------------------------------- */
reg({id:"os", t:"Other sources", ref:"Schedule OS",
     f:secOs, s:()=>{const C=S.C.os||{}; return C.item9!=null?RS(C.item9):"";},
     eng:engOs, exp:expOs, imp:impOs, chk:chkOs, order:16});
