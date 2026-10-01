/* =====================================================================
   ITR-6 * Section "ei" - Exempt income (Schedule EI)
   Book: books/ITR-6/EI.md   Schema block: ScheduleEI
   Modelled on forms/ITR-3/src/70_sec_ei.js; every field/number/formula
   from the ITR-6 books (enums.json / EI.md), not from ITR-3.

   Compute order 18 (after the income heads, before deductions/tax).

   THE COMPANY-RETURN DIFFERENCES from ITR-3 (EI.md 11):
   - Sl.2(iv) is a LIVE row (NetAgriIncRelateToRule7) - the Rule 7/7A/7B/8
     balance-agriculture portion, fed from Schedule BP (BalIncDeemedFrmAgri,
     Sl.No.40; rule A649). Net at 2(v) therefore ADDS iv: MAX(0, i-ii-iii+iv).
   - Category enum has 10 codes (ICSB/IOI/EIFE added; no SRSC/SRST); the
     Sub-category enum has 73 codes; DTAA Head enum is HP/BP/CG/OS (BP for a
     company, not Salary); DTAA total key IncChrgblAsPerDTAA; other-exempt
     array OthersInc.OthersIncDtls[] with amount key OthAmount.
   - The four computed totals (2v, 3, 4, 6) are written even at zero whenever
     the schedule is written (EI.md 8); the three table blocks only when they
     have rows.

   EXEMPT INCOME & GTI: exempt income is not part of Gross Total Income, so
   S.C.ei.income = 0. One line has a rate effect: net agricultural income at
   Sl.2(v) is carried for partial integration - published as S.C.eiAgri and
   read by the tax section for Part B-TI Sl.16 (rule A739).

   CROSS-SECTION SEAMS (CEO wires centrally):
   - CONSUMES: Schedule BP balance-agriculture (S.C.bp, guarded) -> 2(iv).
   - PUBLISHES: S.C.eiAgri = net agri income (2v) for the tax section.
   - Sl.5 pass-through is an input reconciled to Schedule PTI in checks (A646).
   ===================================================================== */

/* ---- dropdown value lists (from books/ITR-6/enums.json; country list from
        EI.md because the enums.json Country_Less_India dump is scrambled) ---- */
const EI_OWNED=[["O","Owned"],["H","Held on lease"]];
const EI_IRR=[["IRG","Irrigated"],["RF","Rain-fed"]];
const EI_CAT=[["AGRI","Agricultural & related incomes"],["GOVC","Compensation/other sums received by government or other approved entities"],["ISI","Income from specified Investments"],["SSRA","Specified sums received by armed forces personnel"],["SRPC","Sums received from policies/contributions such as LIC/NPS/PF/Sukanya Samriddhi Yojana"],["OTH","Other Incomes"],["OTHN","Other Exempt Income for Non Residents"],["ICSB","Incomes of certain specified bodies"],["IOI","Income from other investments"],["EIFE","Exempt income of foreign companies/ foreign enterprises"]];
const EI_SUB=[["10(30)","10(30)-subsidy received from or through the Tea Board"],["10(31)","10(31)-Subsidy received for Rubber/Coffee/Tea replantation, replacement, rejuvenation etc."],["10(17A)","10(17A)-Award instituted by Government"],["10(15)","10(15)-Interest on specified securities/investments"],["10(23FBB)","10(23FBB)-income referred to in section 115UB, accruing or arising to, or received by, a unit holder of an investment fu"],["10(23FD)","10(23FD)Unit holder income from Business Trust (certain parts)"],["10(35)","10(35)-Income from specified Mutual Funds"],["10(23FBC)","10(23FBC) Any income from a unit holder from a specified fund or on transfer of units in a specified fund"],["10(33)","10(33) Income from transfer of capital asset being a unit of the Unit Scheme, 1964"],["10(4C)","10(4C)-Interest on Rupee denominated bonds (specific window)"],["10(4E)","10(4E)-Non-deliverable forwards/ODI/OTC with IFSC OBU"],["10(36)","10(36)-LTCG on certain listed shares (public issue)"],["10(23AA)","10(23AA)-Sum received by any person on behalf of any Fund established by the armed forces"],["10(10D)","10(10D)-Any sum received under a life insurance policy, including the sum allocated by way of bonus on such policy excep"],["10(8A)","10(8A)-Remuneration or any other income of Consultant"],["10(4)(i)","10(4)(i)-Interest on specified bonds"],["10(4F)","10(4F)-Royalty/interest on lease of aircraft/ship by IFSC unit"],["10(4G)","10(4G)-Portfolio income managed in IFSC OBU accruing outside India"],["10(6B)","10(6B)-Tax paid under Govt/international agreements (non-salary)"],["10(6D)","10(6D)-Royalty/FTS to non-resident for services to NTRO"],["10(4H)","10(4H)-Income from business of leasing of an aircraft"],["10(2A)","10(2A)-Partner’s share in firm/LLP"],["10(6BB)","10(6BB)-Tax paid on consideration for aircraft/engine leases (approved by CG)"],["10(23FF)","10(23FF)-Capital Gains on transfer of shares from wholly owned special purpose vehicle to the resultant fund in relocati"],["10(15A)","10(15A)-Lease payments for foreign aircraft"],["10(4D)","10(4D)-Income of specified fund (IFSC) on certain transfers/securities"],["10(34B)","10(34B)-Income of a Unit of any International Financial Services Centre, primarily engaged in the business of leasing of"],["10(39)","10(39)Specified income from international sports events"],["10(40)","10(40)-Income of specified subsidiary companies by way of grant or otherwise received from indian holding company"],["10(21)","10(21)-Income of approved research associations"],["10(22B)","10(22B)-Income of specified news agencies"],["10(23A)","10(23A)-Income of professional regulatory bodies"],["10(23AAA)","10(23AAA)-Income of approved employee welfare funds"],["10(23AAB)","10(23AAB)-Income of approved pension funds"],["10(23B)","10(23B)-Income of approved khadi institutions"],["10(23BBA)","10(23BBA)-Religious and charitable trust board income"],["10(23BBB)","10(23BBB)-Income of European Economic Community"],["10(23BBC)","10(23BBC)-Any income of the SAARC Fund for Regional Projects set up by Colombo Declaration"],["10(23BBE)","10(23BBE)-Income of the Insurance Regulatory and Development Authority"],["10(23BBG)","10(23BBG)-Income of Central Electricity Regulatory Commission"],["10(23C)","10(23C)-Income of specified funds/educational/medical/charitable institutions"],["10(23D)","10(23D)-Income of specified Mutual Funds"],["10(23EA)","10(23EA)-Contributions received from recognised stock exchanges"],["10(23EC)","10(23EC)-Income of specific Investor protection fund"],["10(23ED)","10(23ED)-Income of a business trust's unit holder under specific circumstances"],["10(23EE)","10(23EE)-Specified income of Core settlement guarantee fund"],["10(23F)","10(23F)-Dividends or long-term capital gains of a venture capital fund or a venture capital company from investments mad"],["10(23FA)","10(23FA)-Dividends, other than dividends referred to in section 115-O, or long-term capital gains of a venture capital f"],["10(23FB)","10(23FB)-Income of Venture Capital Company/Fund from investment in Venture Capital undertaking"],["10(23FBA)","10(23FBA)-Any income of an Investment Fund"],["10(23FE)","10(23FE)-Specified sovereign wealth/pension funds—income from infrastructure investments"],["10(26B)","10(26B)-Income promoting the interest of the SC/ST"],["10(26BB)","10(26BB)-Income promoting interest of the Minority Community"],["10(26BBB)","10(26BBB)-Income of ex‑servicemen welfare corporations"],["10(29A)","10(29A)-Income accruing or arising to specific commodity boards"],["10(42)","10(42)-Specified income of treaty‑based international bodies"],["10(46B)","10(46B)-Specific tax exemption for NCGTC"],["10(48D)","10(48D)-Income of infrastructure financing institutions"],["10(48E)","10(48E)-Income of RBI‑licensed development finance institutions"],["10(6A)","10(6A)-Tax on income of foreign company by way of royalty or fees for technical services received from Government or an "],["10(6C)","10(6C)-Income to notified foreign company by way of royalty or fees for technical services in projects connected with se"],["10(15B)","10(15B)-Income of Foreign Company from lease rentals of cruise ships, received from a specified company which operates s"],["10(48)","10(48)-Income received in India in Indian currency by a foreign company on account of sale of crude oil, any other goods"],["10(48A)","10(48A)- Income accruing or arising to a foreign company on account of storage of crude oil in India and sale of crude o"],["10(48B)","10(48B)- Any income accruing or arising to a foreign company on account of sale of leftover stock of crude oil"],["10(48C)","10(48C)- Any income accruing or arising to the Indian Strategic Petroleum Reserves Limited, being a wholly owned subsidi"],["Incmexmptcircular","Incmexmptcircular - Income exempt as per CBDT Circular"],["Incmexmptnotification","Incmexmptnotification - Income exempt as per CBDT Notification"],["Receiptnotincme","Receiptnotincme - Receipts not in the nature of Income"],["Anyother1","Anyother1"],["Anyother2","Anyother2"],["Anyother3","Anyother3"],["Anyother4","Anyother4"]];
const EI_HEAD=[["HP","House Property"],["BP","Business and Profession"],["CG","Capital Gain"],["OS","Income from Other sources"]];
const EI_TRC=[["Y","Yes"],["N","No"]];
const EI_CTRY=[["93","AFGHANISTAN"],["1001","ALAND ISLANDS"],["355","ALBANIA"],["213","ALGERIA"],["684","AMERICAN SAMOA"],["376","ANDORRA"],["244","ANGOLA"],["1264","ANGUILLA"],["1010","ANTARCTICA"],["1268","ANTIGUA AND BARBUDA"],["54","ARGENTINA"],["374","ARMENIA"],["297","ARUBA"],["61","AUSTRALIA"],["43","AUSTRIA"],["994","AZERBAIJAN"],["1242","BAHAMAS"],["973","BAHRAIN"],["880","BANGLADESH"],["1246","BARBADOS"],["375","BELARUS"],["32","BELGIUM"],["501","BELIZE"],["229","BENIN"],["1441","BERMUDA"],["975","BHUTAN"],["591","BOLIVIA (PLURINATIONAL STATE OF)"],["1002","BONAIRE, SINT EUSTATIUS AND SABA"],["387","BOSNIA AND HERZEGOVINA"],["267","BOTSWANA"],["1003","BOUVET ISLAND"],["55","BRAZIL"],["1014","BRITISH INDIAN OCEAN TERRITORY"],["673","BRUNEI DARUSSALAM"],["359","BULGARIA"],["226","BURKINA FASO"],["257","BURUNDI"],["238","CABO VERDE"],["855","CAMBODIA"],["237","CAMEROON"],["1","CANADA"],["1345","CAYMAN ISLANDS"],["236","CENTRAL AFRICAN REPUBLIC"],["235","CHAD"],["56","CHILE"],["86","CHINA"],["9","CHRISTMAS ISLAND"],["672","COCOS (KEELING) ISLANDS"],["57","COLOMBIA"],["270","COMOROS"],["242","CONGO"],["243","CONGO (DEMOCRATIC REPUBLIC OF THE)"],["682","COOK ISLANDS"],["506","COSTA RICA"],["225","COTE DIVOIRE"],["385","CROATIA"],["53","CUBA"],["1015","CURACAO"],["357","CYPRUS"],["420","CZECHIA"],["45","DENMARK"],["253","DJIBOUTI"],["1767","DOMINICA"],["1809","DOMINICAN REPUBLIC"],["593","ECUADOR"],["20","EGYPT"],["503","EL SALVADOR"],["240","EQUATORIAL GUINEA"],["291","ERITREA"],["372","ESTONIA"],["251","ETHIOPIA"],["500","FALKLAND ISLANDS (MALVINAS)"],["298","FAROE ISLANDS"],["679","FIJI"],["358","FINLAND"],["33","FRANCE"],["594","FRENCH GUIANA"],["689","FRENCH POLYNESIA"],["1004","FRENCH SOUTHERN TERRITORIES"],["241","GABON"],["220","GAMBIA"],["995","GEORGIA"],["49","GERMANY"],["233","GHANA"],["350","GIBRALTAR"],["30","GREECE"],["299","GREENLAND"],["1473","GRENADA"],["590","GUADELOUPE"],["1671","GUAM"],["502","GUATEMALA"],["1481","GUERNSEY"],["224","GUINEA"],["245","GUINEA-BISSAU"],["592","GUYANA"],["509","HAITI"],["1005","HEARD ISLAND AND MCDONALD ISLANDS"],["6","HOLY SEE"],["504","HONDURAS"],["852","HONG KONG"],["36","HUNGARY"],["354","ICELAND"],["62","INDONESIA"],["98","IRAN (ISLAMIC REPUBLIC OF)"],["964","IRAQ"],["353","IRELAND"],["1624","ISLE OF MAN"],["972","ISRAEL"],["5","ITALY"],["1876","JAMAICA"],["81","JAPAN"],["1534","JERSEY"],["962","JORDAN"],["7","KAZAKHSTAN"],["254","KENYA"],["686","KIRIBATI"],["850","KOREA (DEMOCRATIC PEOPLES REPUBLIC OF)"],["82","KOREA (REPUBLIC OF)"],["965","KUWAIT"],["996","KYRGYZSTAN"],["856","LAO PEOPLES DEMOCRATIC REPUBLIC"],["371","LATVIA"],["961","LEBANON"],["266","LESOTHO"],["231","LIBERIA"],["218","LIBYA"],["423","LIECHTENSTEIN"],["370","LITHUANIA"],["352","LUXEMBOURG"],["853","MACAO"],["389","MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)"],["261","MADAGASCAR"],["265","MALAWI"],["60","MALAYSIA"],["960","MALDIVES"],["223","MALI"],["356","MALTA"],["692","MARSHALL ISLANDS"],["596","MARTINIQUE"],["222","MAURITANIA"],["230","MAURITIUS"],["269","MAYOTTE"],["52","MEXICO"],["691","MICRONESIA (FEDERATED STATES OF)"],["373","MOLDOVA (REPUBLIC OF)"],["377","MONACO"],["976","MONGOLIA"],["382","MONTENEGRO"],["1664","MONTSERRAT"],["212","MOROCCO"],["258","MOZAMBIQUE"],["95","MYANMAR"],["264","NAMIBIA"],["674","NAURU"],["977","NEPAL"],["31","NETHERLANDS"],["687","NEW CALEDONIA"],["64","NEW ZEALAND"],["505","NICARAGUA"],["227","NIGER"],["234","NIGERIA"],["683","NIUE"],["15","NORFOLK ISLAND"],["1670","NORTHERN MARIANA ISLANDS"],["47","NORWAY"],["968","OMAN"],["92","PAKISTAN"],["680","PALAU"],["970","PALESTINE, STATE OF"],["507","PANAMA"],["675","PAPUA NEW GUINEA"],["595","PARAGUAY"],["51","PERU"],["63","PHILIPPINES"],["1011","PITCAIRN"],["48","POLAND"],["14","PORTUGAL"],["1787","PUERTO RICO"],["974","QATAR"],["262","REUNION"],["40","ROMANIA"],["8","RUSSIAN FEDERATION"],["250","RWANDA"],["1006","SAINT BARTHELEMY"],["290","SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA"],["1869","SAINT KITTS AND NEVIS"],["1758","SAINT LUCIA"],["1007","SAINT MARTIN (FRENCH PART)"],["508","SAINT PIERRE AND MIQUELON"],["1784","SAINT VINCENT AND THE GRENADINES"],["685","SAMOA"],["378","SAN MARINO"],["239","SAO TOME AND PRINCIPE"],["966","SAUDI ARABIA"],["221","SENEGAL"],["381","SERBIA"],["248","SEYCHELLES"],["232","SIERRA LEONE"],["65","SINGAPORE"],["1721","SINT MAARTEN (DUTCH PART)"],["421","SLOVAKIA"],["386","SLOVENIA"],["677","SOLOMON ISLANDS"],["252","SOMALIA"],["28","SOUTH AFRICA"],["1008","SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS"],["211","SOUTH SUDAN"],["35","SPAIN"],["94","SRI LANKA"],["249","SUDAN"],["597","SURINAME"],["1012","SVALBARD AND JAN MAYEN"],["268","SWAZILAND"],["46","SWEDEN"],["41","SWITZERLAND"],["963","SYRIAN ARAB REPUBLIC"],["886","TAIWAN"],["992","TAJIKISTAN"],["255","TANZANIA, UNITED REPUBLIC OF"],["66","THAILAND"],["670","TIMOR-LESTE(EAST TIMOR)"],["228","TOGO"],["690","TOKELAU"],["676","TONGA"],["1868","TRINIDAD AND TOBAGO"],["216","TUNISIA"],["90","TURKEY"],["993","TURKMENISTAN"],["1649","TURKS AND CAICOS ISLANDS"],["688","TUVALU"],["256","UGANDA"],["380","UKRAINE"],["971","UNITED ARAB EMIRATES"],["44","UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND"],["2","UNITED STATES OF AMERICA"],["1009","UNITED STATES MINOR OUTLYING ISLANDS"],["598","URUGUAY"],["998","UZBEKISTAN"],["678","VANUATU"],["58","VENEZUELA (BOLIVARIAN REPUBLIC OF)"],["84","VIET NAM"],["1284","VIRGIN ISLANDS (BRITISH)"],["1340","VIRGIN ISLANDS (U.S.)"],["681","WALLIS AND FUTUNA"],["1013","WESTERN SAHARA"],["967","YEMEN"],["260","ZAMBIA"],["263","ZIMBABWE"],["9999","OTHERS"]];

/* subcategory options — the utility's Sub-category range (PART4_Sub_Category) is a
   single flat list of all 73 codes; the per-Category dependent grouping lives in
   named ranges the dump could not resolve (EI.md §13), so every row offers the
   full enum and the Category/Sub-category mandatory pairing is enforced in checks
   (rule A659). This is the faithful reading of the only resolvable ITR-6 source. */
const eiSubOpts=()=>EI_SUB;

/* residents may not report these (rule A656); a domestic company may not report
   these (rule A657) — screen warnings, the department encoding is Phase 6. */
const EI_SUB_NOTRES=["10(4)(i)","10(4E)","10(4F)","10(4G)","10(6BB)","10(8A)","10(15A)"];
const EI_SUB_NOTDOM=["10(4C)","10(6A)","10(6B)","10(6C)","10(6D)","10(15B)","10(48)","10(48A)","10(48B)"];
/* description is mandatory (A658) only for these free-text sub-categories */
const EI_SUB_DESC=["Incmexmptcircular","Incmexmptnotification","Receiptnotincme"];

/* ---- state ------------------------------------------------------- */
S.ei = S.ei || {
  interest:"",          /* 1   InterestInc */
  grossAgri:"",         /* 2i  GrossAgriRecpt */
  expAgri:"",           /* 2ii ExpIncAgri */
  unabAgri:"",          /* 2iii UnabAgriLossPrev8 */
  land:[],              /* 2vi ExcNetAgriInc.ExcNetAgriIncDtls[] {district,pin,meas,owned,irr} */
  others:[],            /* 3   OthersInc.OthersIncDtls[] {cat,sub,desc,amt} */
  dtaa:[],              /* 4   IncNotChrgblAsPerDTAA.IncNotChrgblAsPerDTAADtls[] {amt,nature,cname,ccode,article,head,trc} */
  passThr:""            /* 5   PassThrIncNotChrgblTax (Schedule PTI) */
};

/* SEED default rows for the shared shell add-handler */
SEED["ei.land"]   = SEED["ei.land"]   || {owned:"O", irr:"IRG"};
SEED["ei.others"] = SEED["ei.others"] || {cat:""};
SEED["ei.dtaa"]   = SEED["ei.dtaa"]   || {trc:"", head:""};

const EI_5L = 500000;   /* land-details threshold: net agri income > Rs.5 lakh */

/* 2(iv) feed — the balance income deemed to be from agriculture (Schedule BP
   BalIncDeemedFrmAgri, EI Sl.2(iv) NetAgriIncRelateToRule7; rule A649). The BP
   builder publishes this scalar into S.C.bp; the read is guarded across the
   likely names so EI never throws before/without a BP engine (CEO wires the seam). */
function eiBpBalAgri(){
  const b = S.C.bp || {}, a = b.a || {};
  const cands = [b.balAgri, a.balAgri, b.balIncDeemedFrmAgri, a.balIncDeemedFrmAgri, b.netAgri, a.netAgri];
  for(const c of cands){ if(c!=null && isFinite(N(c))) return N(c); }
  return 0;
}

/* ---- engine ------------------------------------------------------ */
function engEi(){
  S.ei = S.ei || {};
  const E = S.ei;
  const C = S.C.ei = { income:0 };
  isNew();  /* regime read — no closures apply to Schedule EI (exempt income stays open) */

  /* line 1 */
  const interest = R(E.interest);                                   /* [InterestInc] */

  /* line 2 — the agricultural working */
  const grossAgri = R(E.grossAgri);                                 /* 2i  GrossAgriRecpt */
  const expAgri   = R(E.expAgri);                                   /* 2ii ExpIncAgri */
  const unabAgri  = R(E.unabAgri);                                  /* 2iii UnabAgriLossPrev8 */
  /* 2iv = MAX(0, balance income deemed to be from agriculture, from Sch BP) [H9=BP.40] */
  const agri4 = Math.max(0, R(eiBpBalAgri()));                      /* NetAgriIncRelateToRule7 */
  /* 2v = MAX(0, i - ii - iii + iv) — enter nil if loss [H10] */
  const net2v = Math.max(0, grossAgri - expAgri - unabAgri + agri4);/* NetAgriIncOrOthrIncRule7 */

  /* land rows (2vi) — only meaningful when net2v > 5 lakh */
  const land = (E.land||[]).map(r=>({
    district:st0((r||{}).district), pin:st0((r||{}).pin),
    meas:N((r||{}).meas), owned:st0((r||{}).owned), irr:st0((r||{}).irr),
    filled: !!(st0((r||{}).district)||st0((r||{}).pin)||N((r||{}).meas)||st0((r||{}).owned)||st0((r||{}).irr))
  }));

  /* line 3 — other exempt income table; Others = MAX(0, SUM(Amount)) [G39] */
  const others = (E.others||[]).map(r=>({
    cat:st0((r||{}).cat), sub:st0((r||{}).sub), desc:st0((r||{}).desc),
    amt:R((r||{}).amt)
  }));
  const Others = Math.max(0, others.reduce((a,r)=>a+r.amt,0));     /* Others */

  /* line 4 — DTAA (non-residents); IncChrgblAsPerDTAA = MAX(0, SUM(AmountOfIncome)) [J56] */
  const dtaa = (E.dtaa||[]).map(r=>({
    amt:R((r||{}).amt), nature:st0((r||{}).nature), cname:st0((r||{}).cname),
    ccode:st0((r||{}).ccode), article:st0((r||{}).article),
    head:st0((r||{}).head), trc:st0((r||{}).trc)
  }));
  const dtaaTotal = Math.max(0, dtaa.reduce((a,r)=>a+r.amt,0));    /* IncChrgblAsPerDTAA */

  /* line 5 */
  const passThr = R(E.passThr);                                     /* PassThrIncNotChrgblTax */

  /* line 6 = MAX(0, 1 + 2(v) + 3 + 4 + 5) [J58] */
  const total6 = Math.max(0, interest + net2v + Others + dtaaTotal + passThr); /* TotalExemptInc */

  C.interest = interest;
  C.grossAgri = grossAgri; C.expAgri = expAgri; C.unabAgri = unabAgri;
  C.agri4 = agri4;
  C.net2v = net2v;                 /* Sl.No.2 net agricultural income */
  C.land = land;
  C.others = others; C.othersTot = Others;
  C.dtaa = dtaa; C.dtaaTotal = dtaaTotal;
  C.passThr = passThr;
  C.total = total6;
  C.needLand = net2v > EI_5L;

  /* rate effect — net agri income for the tax section (Part B-TI Sl.16, rule A739) */
  S.C.eiAgri = net2v;

  /* exempt income adds nothing to Gross Total Income */
  C.income = 0;
}

/* ---- renderer ---------------------------------------------------- */
function secEi(){
  const E = S.ei||{}, C = S.C.ei||{};
  let h = "";
  h += note('Schedule EI collects income that is not chargeable to tax. Nothing here is taxed. Two figures still matter: the <b>net agricultural income</b> at Sl. No. 2 is carried for rate purposes (Part B-TI Sl. No. 16, partial integration), and Sl. No. 2(iv) &amp; Sl. No. 5 reconcile to Schedule BP (Sl. No. 40) and Schedule PTI. A company has no basic-exemption slab, so the rate effect is carried but does not change the flat rate. Exempt income is unaffected by the new tax regime.');

  /* ===== 1 · Interest income ===== */
  h += row("1 · Interest income", inp("ei.interest",{n:1}), {ref:"InterestInc"});

  /* ===== 2 · Agricultural income working ===== */
  h += sub("2 · Agricultural income");
  h += row("i · Gross agricultural receipts (other than income excluded under rule 7A/7B/8)",
           inp("ei.grossAgri",{n:1}), {ref:"GrossAgriRecpt", ind:1});
  h += row("ii · Expenditure incurred on agriculture", inp("ei.expAgri",{n:1}),
           {ref:"ExpIncAgri", ind:1});
  h += row("iii · Unabsorbed agricultural loss of the previous eight assessment years",
           inp("ei.unabAgri",{n:1}), {ref:"UnabAgriLossPrev8", ind:1});
  h += row("iv · Agricultural income portion relating to Rule 7/7A/7B(1)/7B(1A)/8 (from Sl. No. 40 of Schedule BP)",
           cell(C.agri4), {ref:"NetAgriIncRelateToRule7", ind:1, hint:"= balance income deemed from agriculture in Schedule BP; auto-pulled"});
  h += row("v · Net agricultural income for the year (i − ii − iii + iv; nil if loss)",
           cell(C.net2v), {ref:"NetAgriIncOrOthrIncRule7", ind:1, req:1});

  /* 2(vi) — land details, only when 2(v) > Rs.5 lakh */
  if(C.needLand){
    h += note("Net agricultural income exceeds ₹5,00,000 — the details of each agricultural land are mandatory (Sl. No. 2(vi)).","warn");
    h += grid("ei.land",[
      {k:"district",h:"District (with PIN)",t:"txt",max:125,w:"200px",req:1},
      {k:"pin",h:"PIN code",t:"txt",max:6,w:"100px",req:1,ph:"6-digit"},
      {k:"meas",h:"Measurement (Acre)",t:"num",w:"130px",req:1},
      {k:"owned",h:"Owned / Held on lease",t:"sel",opts:EI_OWNED,w:"170px",req:1},
      {k:"irr",h:"Irrigated / Rain-fed",t:"sel",opts:EI_IRR,w:"160px",req:1}
    ], E.land||[], {min:"780px", empty:"Add each agricultural land parcel.", add:"Add a land parcel"});
  } else {
    h += note("The land table (Sl. No. 2(vi)) opens only when net agricultural income exceeds ₹5,00,000.");
  }

  /* ===== 3 · Other exempt income ===== */
  h += sub("3 · Other exempt income (please specify)");
  {
    let t = '<div class="full"><table class="gt" style="min-width:860px"><thead><tr>'+
      '<th>Sl</th><th class="l req">Category</th><th class="l req">Sub-Category</th>'+
      '<th class="l">Description</th><th class="req">Amount</th><th class="x"></th></tr></thead><tbody>';
    const rows = E.others||[];
    if(!rows.length){
      t += '<tr><td class="emp" colspan="6">Nothing entered.</td></tr>';
    } else {
      rows.forEach((r,i)=>{
        const pre = "ei.others."+i+".";
        t += '<tr><td class="num">'+(i+1)+'</td>'+
          '<td class="l">'+sel(pre+"cat", EI_CAT, {style:"width:100%"})+'</td>'+
          '<td class="l">'+sel(pre+"sub", eiSubOpts(), {style:"width:100%"})+'</td>'+
          '<td>'+inp(pre+"desc",{max:125})+'</td>'+
          '<td>'+inp(pre+"amt",{n:1})+'</td>'+
          '<td class="x"><button data-del="ei.others.'+i+'" title="Remove">'+TRASH+'</button></td></tr>';
      });
      t += '<tr><td class="l" colspan="4"><b>Total (other exempt income)</b></td>'+
        '<td class="num">'+cell(C.othersTot)+'</td><td></td></tr>';
    }
    t += '</tbody></table></div><button class="add" data-add="ei.others">Add an exempt-income row</button>';
    h += t;
    h += note("Choose the Category, then the Sub-Category (both mandatory where an amount is entered — rule A659). The Sub-Category list carries all 73 coded exemptions; the utility's per-Category filter lives in named ranges the source dump could not resolve. The row total feeds Sl. No. 3 (Others).");
  }

  /* ===== 4 · Income not chargeable as per DTAA (non-residents only) ===== */
  h += sub("4 · Income claimed as not chargeable to tax as per DTAA (non-residents only)");
  h += grid("ei.dtaa",[
    {k:"amt",h:"Amount of income",t:"num",w:"140px",req:1},
    {k:"nature",h:"Nature of income",t:"txt",max:75,w:"170px"},
    {k:"cname",h:"Country name",t:"txt",max:55,w:"160px",req:1},
    {k:"ccode",h:"Country code",t:"sel",opts:EI_CTRY,w:"210px",req:1},
    {k:"article",h:"Article of DTAA",t:"txt",max:16,w:"130px"},
    {k:"head",h:"Head of income",t:"sel",opts:EI_HEAD,w:"210px",req:1},
    {k:"trc",h:"TRC obtained",t:"sel",opts:EI_TRC,w:"120px"}
  ], E.dtaa||[], {min:"1130px", empty:"For non-residents only.", add:"Add a DTAA row",
     foot:[{v:(C.dtaaTotal||0)},{l:1,v:"Total income from DTAA claimed not chargeable (Sl. No. 4)",span:6}]});

  /* ===== 5 · Pass-through income ===== */
  h += row("5 · Pass-through income claimed as not chargeable to tax (Schedule PTI)",
           inp("ei.passThr",{n:1}), {ref:"PassThrIncNotChrgblTax",
           hint:"must equal the exempt pass-through in Schedule PTI (rule A646)"});

  /* ===== 6 · Total ===== */
  h += row("6 · Total exempt income (1 + 2(v) + 3 + 4 + 5)", cell(C.total),
           {ref:"TotalExemptInc", req:1, cls:"tot"});

  return h;
}

/* ---- export ------------------------------------------------------ */
function expEi(j){
  const C = S.C.ei||{};
  const o = {};

  /* single figures (written only when non-zero) */
  put(o,"InterestInc", C.interest ? sg(C.interest) : undefined);
  if(C.grossAgri) put(o,"GrossAgriRecpt", sg(C.grossAgri));
  if(C.expAgri)   put(o,"ExpIncAgri", sg(C.expAgri));
  if(C.unabAgri)  put(o,"UnabAgriLossPrev8", sg(C.unabAgri));
  if(C.agri4)     put(o,"NetAgriIncRelateToRule7", n0(C.agri4));
  /* required total (2v) — always present, even at zero */
  o.NetAgriIncOrOthrIncRule7 = n0(C.net2v);

  /* 2(vi) land table — only when it has rows carrying data */
  const land = (C.land||[]).filter(r=>r.filled);
  if(land.length){
    o.ExcNetAgriInc = { ExcNetAgriIncDtls: land.map(r=>{
      const d = {};
      pf(d,"NameOfDistrict",(sv(r.district)||"NA").slice(0,125));
      pf(d,"PinCode", R(r.pin)||undefined);
      pf(d,"MeasurementOfLand", r.meas ? r.meas : undefined);
      pf(d,"AgriLandOwnedFlag", sv(r.owned));
      pf(d,"AgriLandIrrigatedFlag", sv(r.irr));
      return d;
    })};
  }

  /* line 3 — other exempt income; write rows carrying an amount or a selection */
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
  }
  /* required total (3) — always present, even at zero */
  o.Others = n0(C.othersTot);

  /* line 4 — DTAA */
  const dtaa = (C.dtaa||[]).filter(r=>r.amt || st0(r.cname) || st0(r.ccode));
  if(dtaa.length){
    o.IncNotChrgblAsPerDTAA = { IncNotChrgblAsPerDTAADtls: dtaa.map(r=>{
      const d = {};
      d.AmountOfIncome = n0(r.amt);
      pf(d,"NatureOfIncome", sv(r.nature) ? sv(r.nature).slice(0,75) : undefined);
      pf(d,"CountryName",(sv(r.cname)||"NA").slice(0,55));
      pf(d,"CountryCodeExcludingIndia", sv(r.ccode));
      pf(d,"ArticleOfDTAA", sv(r.article) ? sv(r.article).slice(0,16) : undefined);
      pf(d,"HeadOfIncome", sv(r.head));
      pf(d,"TRCFlag", sv(r.trc));
      return d;
    })};
  }
  /* required total (4) — always present, even at zero */
  o.IncChrgblAsPerDTAA = n0(C.dtaaTotal);

  /* line 5 */
  if(C.passThr) put(o,"PassThrIncNotChrgblTax", sg(C.passThr));

  /* required total (6) — always present, even at zero */
  o.TotalExemptInc = n0(C.total);

  j.ScheduleEI = o;
}

/* ---- import ------------------------------------------------------ */
function impEi(I6){
  const read = [];
  const EI = I6 && I6.ScheduleEI;
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
    ccode:(r.CountryCodeExcludingIndia!=null?String(r.CountryCodeExcludingIndia):""),
    article:r.ArticleOfDTAA||"", head:r.HeadOfIncome||"", trc:r.TRCFlag||""
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
  const res = st0((S.pi||{}).res), isRes = (res==="RES"||res==="");
  const isDom = st0((S.pi||{}).domestic)==="Y";

  /* net agri income > 5 lakh requires the land table (rules A654/A655) */
  if(C.needLand){
    const rows = (C.land||[]).filter(r=>r.filled);
    if(!rows.length){
      out.push({lvl:"err", t:"Schedule EI · agricultural land",
        m:"Net agricultural income exceeds ₹5,00,000, so the details of each agricultural land (Sl. No. 2(vi)) are mandatory.", sec:"ei"});
    } else {
      rows.forEach((r,i)=>{
        if(!st0(r.district) || !/^\d{6}$/.test(st0(r.pin)) || !(r.meas>0) || !st0(r.owned) || !st0(r.irr))
          out.push({lvl:"err", t:"Schedule EI · agricultural land",
            m:"Land row "+(i+1)+": district, a 6-digit PIN code, measurement, owned/held-on-lease and irrigated/rain-fed are all required.", sec:"ei"});
      });
    }
  }

  /* other exempt income rows — Category + Sub-category mandatory where amount>0 (A659),
     description for the free-text sub-categories (A658), duplicate sub-category (A655),
     resident/domestic applicability (A656/A657), and per-section forms (A652/A653) */
  const seen = {};
  (C.others||[]).forEach((r,i)=>{
    if(r.amt && (!st0(r.cat) || !st0(r.sub)))
      out.push({lvl:"err", t:"Schedule EI · other exempt income",
        m:"Row "+(i+1)+": Category and Sub-category are mandatory where an amount is entered (rule A659).", sec:"ei"});
    if((st0(r.cat)||st0(r.sub)||st0(r.desc)) && !r.amt)
      out.push({lvl:"warn", t:"Schedule EI · other exempt income",
        m:"Row "+(i+1)+": a category/description is set but the amount is nil.", sec:"ei"});
    if(r.amt && EI_SUB_DESC.indexOf(st0(r.sub))>=0 && !st0(r.desc))
      out.push({lvl:"err", t:"Schedule EI · other exempt income",
        m:"Row "+(i+1)+": a Description is mandatory for this sub-category (rule A658).", sec:"ei"});
    if(st0(r.sub)){
      if(seen[r.sub])
        out.push({lvl:"warn", t:"Schedule EI · other exempt income",
          m:"Sub-category "+r.sub+" is selected on more than one row; it may be reported only once (rule A655).", sec:"ei"});
      seen[r.sub]=1;
    }
    if(r.amt && isRes && EI_SUB_NOTRES.indexOf(st0(r.sub))>=0)
      out.push({lvl:"warn", t:"Schedule EI · other exempt income",
        m:"Row "+(i+1)+": exempt income u/s "+r.sub+" cannot be reported by a Resident (rule A656).", sec:"ei"});
    if(r.amt && isDom && EI_SUB_NOTDOM.indexOf(st0(r.sub))>=0)
      out.push({lvl:"warn", t:"Schedule EI · other exempt income",
        m:"Row "+(i+1)+": exempt income u/s "+r.sub+" cannot be reported by a domestic company (rule A657).", sec:"ei"});
    if(r.amt && st0(r.sub)==="10(23FF)")
      out.push({lvl:"warn", t:"Schedule EI · other exempt income",
        m:"Row "+(i+1)+": Form 10-II must be filed for exemption u/s 10(23FF) (rule A652).", sec:"ei"});
    if(r.amt && st0(r.sub)==="10(4D)")
      out.push({lvl:"warn", t:"Schedule EI · other exempt income",
        m:"Row "+(i+1)+": Form 10-IG or Form 10-IK must be filed for exemption u/s 10(4D) (rule A653).", sec:"ei"});
  });

  /* DTAA rows — required fields and non-resident applicability */
  const dtaaRows = (C.dtaa||[]).filter(r=>r.amt || st0(r.cname) || st0(r.ccode));
  dtaaRows.forEach((r,i)=>{
    if(!r.amt || !st0(r.cname) || !st0(r.ccode) || !st0(r.head))
      out.push({lvl:"err", t:"Schedule EI · DTAA",
        m:"DTAA row "+(i+1)+": amount, country name, country code and head of income are mandatory.", sec:"ei"});
  });
  if(dtaaRows.length && isRes)
    out.push({lvl:"warn", t:"Schedule EI · DTAA",
      m:"The DTAA not-chargeable table (Sl. No. 4) is applicable for non-residents only, but the residential status is Resident.", sec:"ei"});

  /* line 5 must reconcile to Schedule PTI exempt pass-through (guarded cross-read; rule A646) */
  const ptiExempt = ((S.C.other||{}).pti||[]).reduce((a,b)=>a+R((b.exTot||{}).net||0),0);
  if(R(C.passThr)!==R(ptiExempt) && (R(C.passThr)||R(ptiExempt)))
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
     eng:engEi, exp:expEi, imp:impEi, chk:chkEi, order:18});
