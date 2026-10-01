/* =====================================================================
   ITR-3 · Section "ei" — Exempt income (Schedule EI)
   Book: books/ITR-3/EI.md
   Schema block: ScheduleEI
   Compute order: 18 (after the income heads/losses, before deductions/tax).

   REGIME (books/ITR-3/REGIME.md): Schedule EI is on the "STAYS OPEN in the
   new regime" list ("...all income heads and their computation; taxes paid;
   exempt income..."). Nothing on this schedule is a 115BAC concession, so NO
   item here closes on the new regime — the section renders and computes
   identically with isNew() true or false. The engine reads isNew() only to
   keep the contract explicit; it applies no closure.

   GTI CONTRIBUTION: by definition exempt income is NOT part of Gross Total
   Income, so S.C.ei.income = 0. But one line has a rate effect: the net
   agricultural income at Sl. No. 2 is carried for partial-integration
   (Part B-TI for-rate line + Part B-TTI rebate on agricultural income). The
   tax section reads it as (S.C.ei2||{}).netAgri ?? (S.C.eiAgri||0); this
   builder therefore also publishes S.C.eiAgri = net agricultural income.
   ===================================================================== */

/* ---- dropdown value lists (from books/ITR-3/enums.json via tools/dump.py) ---- */
/* ScheduleEI.ExcNetAgriInc...AgriLandOwnedFlag / AgriLandIrrigatedFlag */
const EI_OWNED=[["O","Owned"],["H","Held on lease"]];
const EI_IRR=[["IRG","Irrigated"],["RF","Rain-fed"]];
/* ScheduleEI.OthersInc.OthersIncDtls[].Category (9) */
const EI_CAT=[["AGRI","Agricultural & related incomes"],["GOVC","Compensation/other sums received by government or other approved entities"],["ISI","Income from specified Investments"],["SSRA","Specified sums received by armed forces personnel"],["SRSC","Sums received by Senior Citizens/Minors"],["SRST","Sums received by specified Category of Taxpayers"],["SRPC","Sums received from policies/contributions such as LIC/NPS/PF/Sukanya Samriddhi Yojana"],["OTH","Other Incomes"],["OTHN","Other Exempt Income for Non Residents"]];
/* ScheduleEI.OthersInc.OthersIncDtls[].SubCategory (63) */
const EI_SUB=[["10(30)","10(30)-subsidy received from or through the Tea Board"],["10(31)","10(31)-Subsidy received for Rubber/Coffee/Tea replantation, replacement, rejuvenation etc."],["10(37)","Capital gains on compulsory acquisition of urban agricultural land"],["10(10BB)","10(10BB)-payments made under the Bhopal Gas Leak Disaster"],["10(10BC)","10(10BC)-amount from the Central/State Govt./local authority by way of compensation on account of any disaster"],["10(17A)","10(17A)-Award instituted by Government"],["10(12AB)","10(12AB)-any sum received as lump sum amount as per clause (vi) of paragraph 2 of the notification number FX-1/3/2024-PR"],["10(15)","10(15)-Interest on specified securities/investments"],["10(23FBB)","10(23FBB)-income referred to in section 115UB, accruing or arising to, or received by, a unit holder of an investment fu"],["10(23FD)","10(23FD)Unit holder income from Business Trust (certain parts)"],["10(35)","10(35)-Income from specified Mutual Funds"],["10(35A)","10(35A)-distributed income referred to in section 115TA received from a securitisation trust"],["10(23FBC)","10(23FBC) Any income from a unit holder from a specified fund or on transfer of units in a specified fund"],["10(33)","10(33) Income from transfer of capital asset being a unit of the Unit Scheme, 1964"],["10(4B)","10(4B)-Interest on specified savings certificates"],["10(4C)","10(4C)-Interest on Rupee denominated bonds (specific window)"],["10(4E)","10(4E)-Non-deliverable forwards/ODI/OTC with IFSC OBU"],["10(36)","10(36)-LTCG on certain listed shares (public issue)"],["10(37A)","10(37A)-any income chargeable under the head 'Capital gains' in respect of transfer of a specified capital asset"],["10(12C)","10(12C)-Agniveer Corpus Fund income"],["10(18)","10(18)-Pension received by winner of 'Param Vir Chakra' or 'Maha Vir Chakra' or 'Vir Chakra' or such other gallantry awa"],["10(19)","10(19)-Armed Forces Family pension in case of death during operational duty"],["10(23AA)","10(23AA)-Sum received by any person on behalf of any Fund established by the armed forces"],["DMD","Defense Medical Disability Pension"],["10(32)","10(32)-Minor child's income—small exemption"],["10(43)","10(43)-Reverse mortgage—payments to senior citizens"],["10(19A)","10(19A)-Annual value of one palace in occupation of ex-ruler"],["10(26)","10(26)- Any income as referred to in section 10(26)"],["10(26AAA)","10(26AAA)-Any income as referred to in section 10(26AAA)"],["10(10D)","10(10D)-Any sum received under a life insurance policy, including the sum allocated by way of bonus on such policy excep"],["10(11)","10(11)-Statutory Provident Fund received"],["10(11A)","10(11A)-Sum received from an account opened under the Sukanya Samriddhi Yojana"],["10(12)","10(12)-Recognized Provident Fund received"],["10(12A)","10(12A)-Any payment from the National Pension System Trust to an assessee"],["10(12AA)","10(12AA)-any payment from the National Pension System Trust"],["10(12B)","10(12B)-Any payment from the National Pension System Trust to an Central Govt. Employee"],["10(12BA)","10(12BA)-partial withdrawal made from the National Pension System"],["10(13)","10(13)-Approved superannuation fund received"],["10(25)","10(25)-Sum received by trustees on behalf of approved superannuation, gratuity, or pension funds"],["10(44)","10(44)-Income received by any person for, or on behalf of, the New Pension System Trust"],["10(2)","10(2)-Member's share from HUF"],["10(16)","10(16)-Scholarships for education"],["10(4)(ii)","10(4)(ii)-NRE account interest"],["10(2A)","10(2A)-Partner’s share in firm/LLP"],["10(8)","10(8)-Income of individuals on cooperative technical assistance programmes"],["10(8A)","10(8A)-Remuneration or any other income of Consultant"],["10(8B)","10(8B)-Income from tech assistance programme in accordance with an agreement entered into by the Central Government and "],["10(9)","10(9)-Income of any family member of any individual accompanying him to India, which accrues or arises outside India"],["10(4)(i)","10(4)(i)-Interest on specified bonds"],["10(4F)","10(4F)-Royalty/interest on lease of aircraft/ship by IFSC unit"],["10(4G)","10(4G)-Portfolio income managed in IFSC OBU accruing outside India"],["10(6B)","10(6B)-Tax paid under Govt/international agreements (non-salary)"],["10(6D)","10(6D)-Royalty/FTS to non-resident for services to NTRO"],["10(4H)","10(4H)-Income from business of leasing of an aircraft"],["10(6BB)","10(6BB)-Tax paid on consideration for aircraft/engine leases (approved by CG)"],["10(23FF)","10(23FF)-Capital Gains on transfer of shares from wholly owned special purpose vehicle to the resultant fund in relocati"],["Incmexmptcircular","Incmexmptcircular - Income exempt as per CBDT Circular"],["Incmexmptnotification","Income exempt as per CBDT Notification"],["Receiptnotincme","Receiptnotincme - Receipts not in the nature of Income"],["Anyother1","Anyother1"],["Anyother2","Anyother2"],["Anyother3","Anyother3"],["Anyother4","Anyother4"]];
/* dependent filter: Category code -> permitted SubCategory codes (utility dependent dropdown) */
const EI_SUBG={AGRI:["10(30)","10(31)","10(37)"],GOVC:["10(10BB)","10(10BC)","10(17A)","10(12AB)"],ISI:["10(15)","10(23FBB)","10(23FD)","10(35)","10(35A)","10(23FBC)","10(33)","10(4B)","10(4C)","10(4E)","10(36)","10(37A)"],SSRA:["10(12C)","10(18)","10(19)","10(23AA)","DMD"],SRSC:["10(32)","10(43)"],SRST:["10(19A)","10(26)","10(26AAA)"],SRPC:["10(10D)","10(11)","10(11A)","10(12)","10(12A)","10(12AA)","10(12B)","10(12BA)","10(13)","10(25)","10(44)"],OTH:["10(2)","10(16)","10(4)(ii)","10(2A)","10(8)","10(8A)","10(8B)","10(9)","Incmexmptcircular","Incmexmptnotification","Receiptnotincme","Anyother1","Anyother2","Anyother3","Anyother4"],OTHN:["10(4)(i)","10(4F)","10(4G)","10(6B)","10(6D)","10(4H)","10(6BB)","10(23FF)"]};
/* ScheduleEI.IncNotChrgblAsPerDTAA...HeadOfIncome (5) / TRCFlag / CountryCodeExcludingIndia (India excluded) */
const EI_HEAD=[["SA","Salary"],["HP","House Property"],["PG","Profits & Gains from Business & Profession"],["CG","Capital Gain"],["OS","Income from Other sources"]];
const EI_TRC=[["Y","Yes"],["N","No"]];
const EI_CTRY=[["93","AFGHANISTAN"],["1001","ALAND ISLANDS"],["355","ALBANIA"],["213","ALGERIA"],["684","AMERICAN SAMOA"],["376","ANDORRA"],["244","ANGOLA"],["1264","ANGUILLA"],["1010","ANTARCTICA"],["1268","ANTIGUA AND BARBUDA"],["54","ARGENTINA"],["374","ARMENIA"],["297","ARUBA"],["61","AUSTRALIA"],["43","AUSTRIA"],["994","AZERBAIJAN"],["1242","BAHAMAS"],["973","BAHRAIN"],["880","BANGLADESH"],["1246","BARBADOS"],["375","BELARUS"],["32","BELGIUM"],["501","BELIZE"],["229","BENIN"],["1441","BERMUDA"],["975","BHUTAN"],["591","BOLIVIA (PLURINATIONAL STATE OF)"],["1002","BONAIRE, SINT EUSTATIUS AND SABA"],["387","BOSNIA AND HERZEGOVINA"],["267","BOTSWANA"],["1003","BOUVET ISLAND"],["55","BRAZIL"],["1014","BRITISH INDIAN OCEAN TERRITORY"],["673","BRUNEI DARUSSALAM"],["359","BULGARIA"],["226","BURKINA FASO"],["257","BURUNDI"],["238","CABO VERDE"],["855","CAMBODIA"],["237","CAMEROON"],["1","CANADA"],["1345","CAYMAN ISLANDS"],["236","CENTRAL AFRICAN REPUBLIC"],["235","CHAD"],["56","CHILE"],["86","CHINA"],["9","CHRISTMAS ISLAND"],["672","COCOS (KEELING) ISLANDS"],["57","COLOMBIA"],["270","COMOROS"],["242","CONGO"],["243","CONGO (DEMOCRATIC REPUBLIC OF THE)"],["682","COOK ISLANDS"],["506","COSTA RICA"],["225","COTE DIVOIRE"],["385","CROATIA"],["53","CUBA"],["1015","CURACAO"],["357","CYPRUS"],["420","CZECHIA"],["45","DENMARK"],["253","DJIBOUTI"],["1767","DOMINICA"],["1809","DOMINICAN REPUBLIC"],["593","ECUADOR"],["20","EGYPT"],["503","EL SALVADOR"],["240","EQUATORIAL GUINEA"],["291","ERITREA"],["372","ESTONIA"],["251","ETHIOPIA"],["500","FALKLAND ISLANDS (MALVINAS)"],["298","FAROE ISLANDS"],["679","FIJI"],["358","FINLAND"],["33","FRANCE"],["594","FRENCH GUIANA"],["689","FRENCH POLYNESIA"],["1004","FRENCH SOUTHERN TERRITORIES"],["241","GABON"],["220","GAMBIA"],["995","GEORGIA"],["49","GERMANY"],["233","GHANA"],["350","GIBRALTAR"],["30","GREECE"],["299","GREENLAND"],["1473","GRENADA"],["590","GUADELOUPE"],["1671","GUAM"],["502","GUATEMALA"],["1481","GUERNSEY"],["224","GUINEA"],["245","GUINEA-BISSAU"],["592","GUYANA"],["509","HAITI"],["1005","HEARD ISLAND AND MCDONALD ISLANDS"],["6","HOLY SEE"],["504","HONDURAS"],["852","HONG KONG"],["36","HUNGARY"],["354","ICELAND"],["62","INDONESIA"],["98","IRAN (ISLAMIC REPUBLIC OF)"],["964","IRAQ"],["353","IRELAND"],["1624","ISLE OF MAN"],["972","ISRAEL"],["5","ITALY"],["1876","JAMAICA"],["81","JAPAN"],["1534","JERSEY"],["962","JORDAN"],["7","KAZAKHSTAN"],["254","KENYA"],["686","KIRIBATI"],["850","KOREA (DEMOCRATIC PEOPLES REPUBLIC OF)"],["82","KOREA (REPUBLIC OF)"],["965","KUWAIT"],["996","KYRGYZSTAN"],["856","LAO PEOPLES DEMOCRATIC REPUBLIC"],["371","LATVIA"],["961","LEBANON"],["266","LESOTHO"],["231","LIBERIA"],["218","LIBYA"],["423","LIECHTENSTEIN"],["370","LITHUANIA"],["352","LUXEMBOURG"],["853","MACAO"],["389","MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)"],["261","MADAGASCAR"],["265","MALAWI"],["60","MALAYSIA"],["960","MALDIVES"],["223","MALI"],["356","MALTA"],["692","MARSHALL ISLANDS"],["596","MARTINIQUE"],["222","MAURITANIA"],["230","MAURITIUS"],["269","MAYOTTE"],["52","MEXICO"],["691","MICRONESIA (FEDERATED STATES OF)"],["373","MOLDOVA (REPUBLIC OF)"],["377","MONACO"],["976","MONGOLIA"],["382","MONTENEGRO"],["1664","MONTSERRAT"],["212","MOROCCO"],["258","MOZAMBIQUE"],["95","MYANMAR"],["264","NAMIBIA"],["674","NAURU"],["977","NEPAL"],["31","NETHERLANDS"],["687","NEW CALEDONIA"],["64","NEW ZEALAND"],["505","NICARAGUA"],["227","NIGER"],["234","NIGERIA"],["683","NIUE"],["15","NORFOLK ISLAND"],["1670","NORTHERN MARIANA ISLANDS"],["47","NORWAY"],["968","OMAN"],["92","PAKISTAN"],["680","PALAU"],["970","PALESTINE, STATE OF"],["507","PANAMA"],["675","PAPUA NEW GUINEA"],["595","PARAGUAY"],["51","PERU"],["63","PHILIPPINES"],["1011","PITCAIRN"],["48","POLAND"],["14","PORTUGAL"],["1787","PUERTO RICO"],["974","QATAR"],["262","REUNION"],["40","ROMANIA"],["8","RUSSIAN FEDERATION"],["250","RWANDA"],["1006","SAINT BARTHELEMY"],["290","SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA"],["1869","SAINT KITTS AND NEVIS"],["1758","SAINT LUCIA"],["1007","SAINT MARTIN (FRENCH PART)"],["508","SAINT PIERRE AND MIQUELON"],["1784","SAINT VINCENT AND THE GRENADINES"],["685","SAMOA"],["378","SAN MARINO"],["239","SAO TOME AND PRINCIPE"],["966","SAUDI ARABIA"],["221","SENEGAL"],["381","SERBIA"],["248","SEYCHELLES"],["232","SIERRA LEONE"],["65","SINGAPORE"],["1721","SINT MAARTEN (DUTCH PART)"],["421","SLOVAKIA"],["386","SLOVENIA"],["677","SOLOMON ISLANDS"],["252","SOMALIA"],["28","SOUTH AFRICA"],["1008","SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS"],["211","SOUTH SUDAN"],["35","SPAIN"],["94","SRI LANKA"],["249","SUDAN"],["597","SURINAME"],["1012","SVALBARD AND JAN MAYEN"],["268","SWAZILAND"],["46","SWEDEN"],["41","SWITZERLAND"],["963","SYRIAN ARAB REPUBLIC"],["886","TAIWAN"],["992","TAJIKISTAN"],["255","TANZANIA, UNITED REPUBLIC OF"],["66","THAILAND"],["670","TIMOR-LESTE(EAST TIMOR)"],["228","TOGO"],["690","TOKELAU"],["676","TONGA"],["1868","TRINIDAD AND TOBAGO"],["216","TUNISIA"],["90","TURKEY"],["993","TURKMENISTAN"],["1649","TURKS AND CAICOS ISLANDS"],["688","TUVALU"],["256","UGANDA"],["380","UKRAINE"],["971","UNITED ARAB EMIRATES"],["44","UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND"],["2","UNITED STATES OF AMERICA"],["1009","UNITED STATES MINOR OUTLYING ISLANDS"],["598","URUGUAY"],["998","UZBEKISTAN"],["678","VANUATU"],["58","VENEZUELA (BOLIVARIAN REPUBLIC OF)"],["84","VIET NAM"],["1284","VIRGIN ISLANDS (BRITISH)"],["1340","VIRGIN ISLANDS (U.S.)"],["681","WALLIS AND FUTUNA"],["1013","WESTERN SAHARA"],["260","ZAMBIA"],["9999","OTHERS"]];
/* subcategory options filtered by the row's chosen category (empty when no category) */
const eiSubOpts=cat=>{const g=EI_SUBG[cat]||[];const m={};EI_SUB.forEach(p=>m[p[0]]=p[1]);return g.map(c=>[c,m[c]||c]);};

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

/* ---- engine ------------------------------------------------------ */
function engEi(){
  S.ei = S.ei || {};
  const E = S.ei;
  const C = S.C.ei = { income:0 };
  isNew();  /* regime read — no closures apply to Schedule EI (see header) */

  /* line 1 */
  const interest = R(E.interest);                                   /* [InterestInc] */

  /* line 2 — the agricultural working */
  const grossAgri = R(E.grossAgri);                                 /* 2i  GrossAgriRecpt */
  const expAgri   = R(E.expAgri);                                   /* 2ii ExpIncAgri */
  const unabAgri  = R(E.unabAgri);                                  /* 2iii UnabAgriLossPrev8 */
  /* 2iv = MAX(0, Sch BP Sl.No.38 balance income deemed to be from agriculture) [J10] */
  const agri4 = Math.max(0, R(((S.C.bp||{}).a||{})._38 || 0));      /* AgriIncRule7and8 */
  /* 2v = MAX(0, i - ii - iii + iv) — enter nil if loss [J11] */
  const net2v = Math.max(0, grossAgri - expAgri - unabAgri + agri4);/* NetAgriIncOrOthrIncRule7 */

  /* land rows (2vi) — only meaningful when net2v > 5 lakh */
  const land = (E.land||[]).map(r=>({
    district:st0((r||{}).district), pin:st0((r||{}).pin),
    meas:N((r||{}).meas), owned:st0((r||{}).owned), irr:st0((r||{}).irr),
    filled: !!(st0((r||{}).district)||st0((r||{}).pin)||N((r||{}).meas)||st0((r||{}).owned)||st0((r||{}).irr))
  }));

  /* line 3 — other exempt income table; Others = SUM(Amount) [I27] */
  const others = (E.others||[]).map(r=>({
    cat:st0((r||{}).cat), sub:st0((r||{}).sub), desc:st0((r||{}).desc),
    amt:R((r||{}).amt)
  }));
  const Others = others.reduce((a,r)=>a+r.amt,0);                   /* Others */

  /* line 4 — DTAA (non-residents); IncChrgblAsPerDTAA = SUM(AmountOfIncome) [J37] */
  const dtaa = (E.dtaa||[]).map(r=>({
    amt:R((r||{}).amt), nature:st0((r||{}).nature), cname:st0((r||{}).cname),
    ccode:st0((r||{}).ccode), article:st0((r||{}).article),
    head:st0((r||{}).head), trc:st0((r||{}).trc)
  }));
  const dtaaTotal = dtaa.reduce((a,r)=>a+r.amt,0);                  /* IncChrgblAsPerDTAA */

  /* line 5 */
  const passThr = R(E.passThr);                                     /* PassThrIncNotChrgblTax */

  /* line 6 = MAX(0, 1 + 2(v) + 3 + 4 + 5) [J39] */
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

  /* rate effect — publish net agri income for the tax section (partial integration) */
  S.C.eiAgri = net2v;

  /* exempt income adds nothing to Gross Total Income */
  C.income = 0;
}

/* ---- renderer ---------------------------------------------------- */
function secEi(){
  const E = S.ei||{}, C = S.C.ei||{};
  let h = "";
  h += note('Schedule EI collects income that is not chargeable to tax. Nothing here is taxed. Two figures still matter: the <b>net agricultural income</b> at Sl. No. 2 is carried for rate purposes (partial integration), and Sl. No. 2(iv) &amp; Sl. No. 5 reconcile to Schedule BP (Sl. No. 38) and Schedule PTI. Exempt income is unaffected by the new tax regime.');

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
  h += row("iv · Agricultural income portion under Rule 7/7A/7B(1)/7B(1A)/8 (from Sl. No. 38 of Schedule BP)",
           cell(C.agri4), {ref:"AgriIncRule7and8", ind:1, hint:"= MAX(0, Sch BP Sl.No.38); auto-pulled"});
  h += row("v · Net agricultural income for the year (i − ii − iii + iv; nil if loss)",
           cell(C.net2v), {ref:"NetAgriIncOrOthrIncRule7", ind:1, req:1});

  /* 2(vi) — land details, only when 2(v) > Rs.5 lakh */
  if(C.needLand){
    h += note("Net agricultural income exceeds ₹5,00,000 — the details of each agricultural land are mandatory (Sl. No. 2(vi)).","warn");
    h += grid("ei.land",[
      {k:"district",h:"District (with PIN)",t:"txt",max:125,w:"200px",req:1},
      {k:"pin",h:"PIN code",t:"txt",max:6,w:"100px",req:1,ph:"6-digit"},
      {k:"meas",h:"Measurement (Acre)",t:"num",w:"130px",req:1},
      {k:"owned",h:"Owned / Leased",t:"sel",opts:EI_OWNED,w:"150px",req:1},
      {k:"irr",h:"Irrigated / Rain-fed",t:"sel",opts:EI_IRR,w:"160px",req:1}
    ], E.land||[], {min:"760px", empty:"Add each agricultural land parcel.", add:"Add a land parcel"});
  } else {
    h += note("The land table (Sl. No. 2(vi)) opens only when net agricultural income exceeds ₹5,00,000.");
  }

  /* ===== 3 · Other exempt income ===== */
  h += sub("3 · Other exempt income (including exempt income of a minor child)");
  {
    let t = '<div class="full"><table class="gt" style="min-width:820px"><thead><tr>'+
      '<th>Sl</th><th class="l">Category</th><th class="l">Sub-Category</th>'+
      '<th class="l">Description</th><th class="req">Amount</th><th class="x"></th></tr></thead><tbody>';
    const rows = E.others||[];
    if(!rows.length){
      t += '<tr><td class="emp" colspan="6">Nothing entered.</td></tr>';
    } else {
      rows.forEach((r,i)=>{
        const pre = "ei.others."+i+".";
        const subOpts = eiSubOpts(st0(r.cat));
        t += '<tr><td class="num">'+(i+1)+'</td>'+
          '<td class="l">'+sel(pre+"cat", EI_CAT, {style:"width:100%"})+'</td>'+
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
    h += note("Choose the Category first; the Sub-Category list is filtered to that category (dependent dropdown). The row total feeds Sl. No. 3 (Others).");
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
     foot:[{v:(C.dtaaTotal||0)},{l:1,v:"Total income from DTAA claimed not chargeable (Sl. No. 4)",span:6}]});

  /* ===== 5 · Pass-through income ===== */
  h += row("5 · Pass-through income claimed not chargeable to tax (Schedule PTI)",
           inp("ei.passThr",{n:1}), {ref:"PassThrIncNotChrgblTax",
           hint:"must equal the exempt pass-through in Schedule PTI"});

  /* ===== 6 · Total ===== */
  h += row("6 · Total exempt income (1 + 2(v) + 3 + 4 + 5)", cell(C.total),
           {ref:"TotalExemptInc", req:1, cls:"tot"});

  return h;
}

/* ---- export ------------------------------------------------------ */
function expEi(j){
  const C = S.C.ei||{}, E = S.ei||{};
  const o = {};

  /* single figures (written only when non-zero, except the two required totals) */
  put(o,"InterestInc", C.interest ? sg(C.interest) : undefined);
  if(C.grossAgri) put(o,"GrossAgriRecpt", sg(C.grossAgri));
  if(C.expAgri)   put(o,"ExpIncAgri", sg(C.expAgri));
  if(C.unabAgri)  put(o,"UnabAgriLossPrev8", sg(C.unabAgri));
  if(C.agri4)     put(o,"AgriIncRule7and8", n0(C.agri4));
  /* required total — always present, even at zero */
  o.NetAgriIncOrOthrIncRule7 = n0(C.net2v);

  /* 2(vi) land table — only when it has rows carrying data */
  const land = (C.land||[]).filter(r=>r.filled);
  if(land.length){
    o.ExcNetAgriInc = { ExcNetAgriIncDtls: land.map(r=>{
      const d = {};
      put(d,"NameOfDistrict",(sv(r.district)||"NA").slice(0,125));
      put(d,"PinCode", R(r.pin)||undefined);
      put(d,"MeasurementOfLand", r.meas ? r.meas : undefined);
      put(d,"AgriLandOwnedFlag", sv(r.owned));
      put(d,"AgriLandIrrigatedFlag", sv(r.irr));
      return d;
    })};
  }

  /* line 3 — other exempt income; write rows carrying an amount */
  const others = (C.others||[]).filter(r=>r.amt || st0(r.cat) || st0(r.sub) || st0(r.desc));
  if(others.length){
    o.OthersInc = { OthersIncDtls: others.map(r=>{
      const d = {};
      put(d,"Category", sv(r.cat));
      put(d,"SubCategory", sv(r.sub));
      put(d,"Description", sv(r.desc) ? sv(r.desc).slice(0,125) : undefined);
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
      put(d,"NatureOfIncome", sv(r.nature) ? sv(r.nature).slice(0,75) : undefined);
      pf(d,"CountryName",(sv(r.cname)||"NA").slice(0,55));
      pf(d,"CountryCodeExcludingIndia", sv(r.ccode));
      put(d,"ArticleOfDTAA", sv(r.article) ? sv(r.article).slice(0,16) : undefined);
      put(d,"HeadOfIncome", sv(r.head));
      put(d,"TRCFlag", sv(r.trc));
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
function impEi(I3){
  const read = [];
  const EI = I3 && I3.ScheduleEI;
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
  const out = [], C = S.C.ei||{}, E = S.ei||{};

  /* net agri income > 5 lakh requires the land table (cross-sheet rule) */
  if(C.needLand){
    const rows = (C.land||[]).filter(r=>r.filled);
    if(!rows.length){
      out.push({lvl:"err", t:"Schedule EI · agricultural land",
        m:"Net agricultural income exceeds ₹5,00,000, so the details of each agricultural land (Sl. No. 2(vi)) are mandatory.", sec:"ei"});
    } else {
      rows.forEach((r,i)=>{
        if(!st0(r.district) || !/^\d{6}$/.test(st0(r.pin)) || !(r.meas>0) || !st0(r.owned) || !st0(r.irr))
          out.push({lvl:"err", t:"Schedule EI · agricultural land",
            m:"Land row "+(i+1)+": district, a 6-digit PIN code, measurement, owned/leased and irrigated/rain-fed are all required.", sec:"ei"});
      });
    }
  }

  /* other exempt income rows — amount and category */
  (C.others||[]).forEach((r,i)=>{
    if(r.amt && !st0(r.cat))
      out.push({lvl:"warn", t:"Schedule EI · other exempt income",
        m:"Row "+(i+1)+": an amount is entered but no Category is chosen.", sec:"ei"});
    if((st0(r.cat)||st0(r.sub)||st0(r.desc)) && !r.amt)
      out.push({lvl:"warn", t:"Schedule EI · other exempt income",
        m:"Row "+(i+1)+": a category/description is set but the amount is nil.", sec:"ei"});
  });

  /* DTAA rows — required fields and non-resident applicability */
  const dtaaRows = (C.dtaa||[]).filter(r=>r.amt || st0(r.cname) || st0(r.ccode));
  dtaaRows.forEach((r,i)=>{
    if(!r.amt || !st0(r.cname) || !st0(r.ccode) || !st0(r.head))
      out.push({lvl:"err", t:"Schedule EI · DTAA",
        m:"DTAA row "+(i+1)+": amount, country name, country code and head of income are mandatory.", sec:"ei"});
  });
  if(dtaaRows.length && st0(S.pi&&S.fs.resStatus)==="RES")
    out.push({lvl:"warn", t:"Schedule EI · DTAA",
      m:"The DTAA not-chargeable table (Sl. No. 4) is applicable for non-residents only, but the residential status is Resident.", sec:"ei"});

  /* line 5 must reconcile to Schedule PTI exempt pass-through (guarded cross-read) */
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
