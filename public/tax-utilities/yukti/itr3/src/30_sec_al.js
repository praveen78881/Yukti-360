/* =====================================================================
   ITR-3 · Section "al" — Schedule AL (Assets and liabilities at year end)
   Book: books/ITR-3/AL.md
   Schema block: ScheduleAL
   Compute order: 30 (a disclosure — after the income heads, before tax @ 90).

   REGIME (books/ITR-3/REGIME.md): Schedule AL is NOT in the 115BAC closure
   list — REGIME.md's "What STAYS OPEN in the new regime" names AL explicitly.
   So NO item here is regime-gated: the section renders and computes identically
   whether isNew() is true (new) or false (old). The engine reads isNew() only
   to keep the contract explicit.

   GTI CONTRIBUTION: Schedule AL is a pure year-end disclosure of assets (at
   cost) and liabilities. It never adds to Gross Total Income. So
   S.C.al.income = 0. The engine still exposes the Part A/B/C/D totals for the
   renderer and for cross-checks.

   Applicability (book / rules.json n=905, cat A): mandatory when Total Income
   exceeds Rs. 1 crore (the filing requirement); the utility VBA prompts the
   Part A/Part C dropdowns and the amount fields once Total Income exceeds
   Rs. 50,00,000. Both thresholds are encoded (checks below). The card stays
   available/optional below the threshold.
   ===================================================================== */

/* ---- state ------------------------------------------------------- */
S.al = S.al || {
  ownImm:"",                 /* Part A flag [J4] — "Do you own any immovable asset?" Yes/No (UI gate; no schema field) */
  imm:[],                    /* ScheduleAL.ImmovableDetails[] — one flat row per property */
  mov:{ jewellery:"", art:"", vehicles:"",      /* Part B (i)(ii)(iii) */
        bank:"", shares:"", insurance:"", loans:"", cash:"" }, /* Part B (iv)(a..e) */
  aopFlag:"",                /* Part C flag [M25] — InterstAOPFlag, stored as enum Y/N */
  aop:[],                    /* ScheduleAL.InterestHeldInaAsset[] — one flat row per firm/AOP */
  liab:""                    /* Part D [O34] — LiabilityInRelatAssets */
};

/* SEED defaults for new repeatable rows (the shared shell add-handler resolves
   its SEED map by the path's suffix; rows are flat so a shallow copy is safe —
   no nested object is shared between rows). Address defaults to India (91). */
SEED.imm = SEED.imm || { country:"91" };
SEED.aop = SEED.aop || { country:"91" };

/* ---- dropdown value lists (book AL.md · schema enums StateCode / CountryCode) ---- */
/* State [K8:K11, K28:K31] — enum StateCode, 38 values (value = numeric code) */
const AL_STATE=[["01","Andaman and Nicobar Islands"],["02","Andhra Pradesh"],
  ["03","Arunachal Pradesh"],["04","Assam"],["05","Bihar"],["06","Chandigarh"],
  ["07","Dadra Nagar and Haveli"],["08","Daman and Diu"],["09","Delhi"],["10","Goa"],
  ["11","Gujarat"],["12","Haryana"],["13","Himachal Pradesh"],["14","Jammu and Kashmir"],
  ["15","Karnataka"],["16","Kerala"],["17","Lakshadweep"],["18","Madhya Pradesh"],
  ["19","Maharashtra"],["20","Manipur"],["21","Meghalaya"],["22","Mizoram"],
  ["23","Nagaland"],["24","Odisha"],["25","Puducherry"],["26","Punjab"],["27","Rajasthan"],
  ["28","Sikkim"],["29","Tamil Nadu"],["30","Tripura"],["31","Uttar Pradesh"],
  ["32","West Bengal"],["33","Chhattisgarh"],["34","Uttarakhand"],["35","Jharkhand"],
  ["36","Telangana"],["37","Ladakh"],["99","Foreign"]];
/* Country [L8:L11, L28:L31] — enum CountryCode, 250 values (value = numeric code) */
const AL_COUNTRY=[
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
  ["36","HUNGARY"],["354","ICELAND"],["91","INDIA"],["62","INDONESIA"],
  ["98","IRAN (ISLAMIC REPUBLIC OF)"],["964","IRAQ"],["353","IRELAND"],["1624","ISLE OF MAN"],
  ["972","ISRAEL"],["5","ITALY"],["1876","JAMAICA"],["81","JAPAN"],
  ["1534","JERSEY"],["962","JORDAN"],["7","KAZAKHSTAN"],["254","KENYA"],
  ["686","KIRIBATI"],["850","KOREA (DEMOCRATIC PEOPLES REPUBLIC OF)"],["82","KOREA (REPUBLIC OF)"],["965","KUWAIT"],
  ["996","KYRGYZSTAN"],["856","LAO PEOPLES DEMOCRATIC REPUBLIC"],["371","LATVIA"],["961","LEBANON"],
  ["266","LESOTHO"],["231","LIBERIA"],["218","LIBYA"],["423","LIECHTENSTEIN"],
  ["370","LITHUANIA"],["352","LUXEMBOURG"],["853","MACAO"],["389","MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)"],
  ["261","MADAGASCAR"],["265","MALAWI"],["60","MALAYSIA"],["960","MALDIVES"],
  ["223","MALI"],["356","MALTA"],["692","MARSHALL ISLANDS"],["596","MARTINIQUE"],
  ["222","MAURITANIA"],["230","MAURITIUS"],["269","MAYOTTE"],["52","MEXICO"],
  ["691","MICRONESIA (FEDERATED STATES OF)"],["373","MOLDOVA (REPUBLIC OF)"],["377","MONACO"],["976","MONGOLIA"],
  ["382","MONTENEGRO"],["1664","MONTSERRAT"],["212","MOROCCO"],["258","MOZAMBIQUE"],
  ["95","MYANMAR"],["264","NAMIBIA"],["674","NAURU"],["977","NEPAL"],
  ["31","NETHERLANDS"],["687","NEW CALEDONIA"],["64","NEW ZEALAND"],["505","NICARAGUA"],
  ["227","NIGER"],["234","NIGERIA"],["683","NIUE"],["15","NORFOLK ISLAND"],
  ["1670","NORTHERN MARIANA ISLANDS"],["47","NORWAY"],["968","OMAN"],["92","PAKISTAN"],
  ["680","PALAU"],["970","PALESTINE, STATE OF"],["507","PANAMA"],["675","PAPUA NEW GUINEA"],
  ["595","PARAGUAY"],["51","PERU"],["63","PHILIPPINES"],["1011","PITCAIRN"],
  ["48","POLAND"],["14","PORTUGAL"],["1787","PUERTO RICO"],["974","QATAR"],
  ["262","REUNION"],["40","ROMANIA"],["8","RUSSIAN FEDERATION"],["250","RWANDA"],
  ["1006","SAINT BARTHELEMY"],["290","SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA"],["1869","SAINT KITTS AND NEVIS"],["1758","SAINT LUCIA"],
  ["1007","SAINT MARTIN (FRENCH PART)"],["508","SAINT PIERRE AND MIQUELON"],["1784","SAINT VINCENT AND THE GRENADINES"],["685","SAMOA"],
  ["378","SAN MARINO"],["239","SAO TOME AND PRINCIPE"],["966","SAUDI ARABIA"],["221","SENEGAL"],
  ["381","SERBIA"],["248","SEYCHELLES"],["232","SIERRA LEONE"],["65","SINGAPORE"],
  ["1721","SINT MAARTEN (DUTCH PART)"],["421","SLOVAKIA"],["386","SLOVENIA"],["677","SOLOMON ISLANDS"],
  ["252","SOMALIA"],["28","SOUTH AFRICA"],["1008","SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS"],["211","SOUTH SUDAN"],
  ["35","SPAIN"],["94","SRI LANKA"],["249","SUDAN"],["597","SURINAME"],
  ["1012","SVALBARD AND JAN MAYEN"],["268","SWAZILAND"],["46","SWEDEN"],["41","SWITZERLAND"],
  ["963","SYRIAN ARAB REPUBLIC"],["886","TAIWAN"],["992","TAJIKISTAN"],["255","TANZANIA, UNITED REPUBLIC OF"],
  ["66","THAILAND"],["670","TIMOR-LESTE(EAST TIMOR)"],["228","TOGO"],["690","TOKELAU"],
  ["676","TONGA"],["1868","TRINIDAD AND TOBAGO"],["216","TUNISIA"],["90","TURKEY"],
  ["993","TURKMENISTAN"],["1649","TURKS AND CAICOS ISLANDS"],["688","TUVALU"],["256","UGANDA"],
  ["380","UKRAINE"],["971","UNITED ARAB EMIRATES"],["44","UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND"],["2","UNITED STATES OF AMERICA"],
  ["1009","UNITED STATES MINOR OUTLYING ISLANDS"],["598","URUGUAY"],["998","UZBEKISTAN"],["678","VANUATU"],
  ["58","VENEZUELA (BOLIVARIAN REPUBLIC OF)"],["84","VIET NAM"],["1284","VIRGIN ISLANDS (BRITISH)"],["1340","VIRGIN ISLANDS (U.S.)"],
  ["681","WALLIS AND FUTUNA"],["967","YEMEN"],["263","ZIMBABWE"],["260","ZAMBIA"],
  ["1013","WESTERN SAHARA"],["9999","OTHERS"]];
/* Part A flag [J4] and Part C flag [M25] (Yes/No shown; C stored as Y/N per schema) */
const AL_YESNO=[["Yes","Yes"],["No","No"]];
const AL_YN=[["Y","Yes"],["N","No"]];
const AL_MAX14=99999999999999;                       /* 14-digit non-negative amount ceiling */
const ZIP_BAD=/[<>&'"]/;                              /* chars barred in ZipCode (VBA) */

/* ---- engine ------------------------------------------------------ */
function engAl(){
  S.al = S.al || {};
  const A = S.al;
  const C = S.C.al = { income:0 };
  isNew();   /* regime read — Schedule AL stays OPEN in both regimes (REGIME.md); no closures */

  /* ---------- Part B — movable asset (eight fixed lines, non-negative) ---------- */
  const M = A.mov || {};
  const mov = {
    jewellery:n0(M.jewellery),   /* [E16] JewelleryBullionEtc */
    art:n0(M.art),               /* [E17] ArchCollDrawPaintSulpArt */
    vehicles:n0(M.vehicles),     /* [E18] VehiclYachtsBoatsAircrafts */
    bank:n0(M.bank),             /* [E20] DepositsInBank */
    shares:n0(M.shares),         /* [E21] SharesAndSecurities */
    insurance:n0(M.insurance),   /* [E22] InsurancePolicies */
    loans:n0(M.loans),           /* [E23] LoansAndAdvancesGiven */
    cash:n0(M.cash)              /* [E24] CashInHand */
  };
  mov.total = mov.jewellery+mov.art+mov.vehicles+mov.bank+mov.shares+mov.insurance+mov.loans+mov.cash;
  C.mov = mov;

  /* ---------- Part A — immovable (unlimited table, amount at cost) ---------- */
  C.immCount = (A.imm||[]).length;
  C.immTotal = (A.imm||[]).reduce((a,r)=>a+n0((r||{}).amount),0);   /* Σ Amount [O6] */

  /* ---------- Part C — interest in a firm/AOP (unlimited table) ---------- */
  C.aopCount = (A.aop||[]).length;
  C.aopTotal = (A.aop||[]).reduce((a,r)=>a+n0((r||{}).invest),0);   /* Σ AssesseInvestment [P26] */
  C.aopFlag  = (st0(A.aopFlag)==="Y" || C.aopCount) ? "Y" : (st0(A.aopFlag)==="N" ? "N" : "");

  /* ---------- Part D — liabilities in relation to Assets at (A + B + C) ---------- */
  C.liab = n0(A.liab);                                              /* [O34] LiabilityInRelatAssets */
  C.assetsABC = C.immTotal + mov.total + C.aopTotal;                /* A + B + C (Part D relates to this) */

  /* GTI contribution — a disclosure schedule, nothing added to income (see header) */
  C.income = 0;
}

/* ---- shared address helpers (renderer + export) ------------------ */
function alAddrRows(pre,r){
  r = r || {};
  const india = (st0(r.country)||"91")==="91";
  let h = "";
  h += row("Flat / Door / Block No.", inp(pre+"resNo",{max:50}), {req:1, ref:"[F7]"});
  h += row("Name of Premises / Building / Village", inp(pre+"resName",{max:50}), {ref:"[G7]"});
  h += row("Road / Street / Post Office", inp(pre+"road",{max:50}), {ref:"[H7]"});
  h += row("Area / locality", inp(pre+"area",{max:50}), {req:1, ref:"[I7]"});
  h += row("Town / City / District", inp(pre+"city",{max:50}), {req:1, ref:"[J7]"});
  h += row("State", sel(pre+"state",AL_STATE), {req:1, ref:"[K7]"});
  h += row("Country", sel(pre+"country",AL_COUNTRY), {req:1, ref:"[L7]"});
  if(india) h += row("Pin code", inp(pre+"pin",{max:6}), {req:1, ref:"[M7]", hint:"6 digits — India"});
  else      h += row("Zip code", inp(pre+"zip",{max:8}), {req:1, ref:"[N7]", hint:"foreign address"});
  return h;
}
function alAddrOut(r){
  r = r || {};
  const country = sv(r.country) || "91";
  const a = {
    ResidenceNo:(sv(r.resNo)||"NA").slice(0,50),
    LocalityOrArea:(sv(r.area)||"NA").slice(0,50),
    CityOrTownOrDistrict:(sv(r.city)||"NA").slice(0,50),
    StateCode:sv(r.state)||"99",
    CountryCode:country.slice(0,4)
  };
  if(sv(r.resName)) a.ResidenceName = st0(r.resName).slice(0,50);
  if(sv(r.road))    a.RoadOrStreet  = st0(r.road).slice(0,50);
  if(country==="91"){ const p=R(r.pin); if(p>=100000 && p<=999999) a.PinCode = p; }
  else { if(sv(r.zip)) a.ZipCode = st0(r.zip).slice(0,8); }
  return a;
}

/* ---- renderer ---------------------------------------------------- */
function secAl(){
  const A = S.al||{}, C = S.C.al||{};
  const TI = R((S.C.ti)||0);
  let h = "";

  h += note("<b>Schedule AL — Assets and Liabilities at the end of the year</b> (other than those included in Part A-BS). Applicable when Total Income exceeds Rs. 1 crore (the utility prompts these fields once Total Income exceeds Rs. 50 lakh). Every amount is at <b>cost</b>, in rupees. Assets are disclosed here only — Schedule AL adds nothing to your total income.");
  if(TI>10000000) h += note("Your Total Income is above Rs. 1 crore — Schedule AL is <b>required</b> to be filled.","form");
  else if(TI>5000000) h += note("Your Total Income is above Rs. 50 lakh — please complete the dropdowns and amount fields of Schedule AL.","warn");

  /* ===== Part A — immovable asset ===== */
  h += sub("A · Details of immovable asset");
  h += row("Do you own any immovable asset?", sel("al.ownImm",AL_YESNO), {req:1, ref:"[J4]"});
  if(st0(A.ownImm)==="Yes"){
    (A.imm||[]).forEach((raw,i)=>{
      raw = raw||{};
      const pre = "al.imm."+i+".";
      const title = "Immovable asset " + (i+1) + (st0(raw.desc)?" — "+esc(st0(raw.desc)):"");
      let inner = "";
      inner += row("Description", inp(pre+"desc",{max:25}), {req:1, ref:"[E6]", hint:"max 25 characters"});
      inner += sub("Address [F6]");
      inner += alAddrRows(pre,raw);
      inner += row("Amount (cost) in Rs.", inp(pre+"amount",{n:1}), {req:1, ref:"[O6]"});
      h += blk("imm"+i, title, (n0(raw.amount)?RS(n0(raw.amount)):"—"), inner, "al.imm."+i);
    });
    h += '<button class="add" data-add="al.imm">Add an immovable asset</button>';
    h += row("Total immovable assets (Part A)", cell(C.immTotal||0));
  } else if(st0(A.ownImm)==="No"){
    h += note("No immovable asset declared. Part A will not be written.");
  }

  /* ===== Part B — movable asset ===== */
  h += sub("B · Details of movable asset");
  h += note("Enter the cost of each movable asset held at year end. All eight lines are required — enter zeros if nil.");
  h += row("(i) Jewellery, bullion etc.", inp("al.mov.jewellery",{n:1}), {ref:"[E16]"});
  h += row("(ii) Archaeological collections, drawings, painting, sculpture or any work of art", inp("al.mov.art",{n:1}), {ref:"[E17]"});
  h += row("(iii) Vehicles, yachts, boats and aircrafts", inp("al.mov.vehicles",{n:1}), {ref:"[E18]"});
  h += row("(iv) Financial asset", "", {ref:"[E19]", cls:"sub"});
  h += row("(a) Bank (including all deposits)", inp("al.mov.bank",{n:1}), {ref:"[E20]", ind:1});
  h += row("(b) Shares and securities", inp("al.mov.shares",{n:1}), {ref:"[E21]", ind:1});
  h += row("(c) Insurance policies", inp("al.mov.insurance",{n:1}), {ref:"[E22]", ind:1});
  h += row("(d) Loans and advances given", inp("al.mov.loans",{n:1}), {ref:"[E23]", ind:1});
  h += row("(e) Cash in hand", inp("al.mov.cash",{n:1}), {ref:"[E24]", ind:1});
  h += row("Total movable assets (Part B)", cell((C.mov||{}).total||0));

  /* ===== Part C — interest in a firm/AOP ===== */
  h += sub("C · Interest held in the assets of a firm or AOP as a partner or member");
  h += row("Do you have any Interest held in the assets of a firm or association of persons (AOP) as a partner or member?",
           sel("al.aopFlag",AL_YN), {req:1, ref:"[M25]"});
  if(st0(A.aopFlag)==="Y"){
    (A.aop||[]).forEach((raw,i)=>{
      raw = raw||{};
      const pre = "al.aop."+i+".";
      const title = "Firm / AOP " + (i+1) + (st0(raw.name)?" — "+esc(st0(raw.name)):"");
      let inner = "";
      inner += row("Name of the firm(s) / AOP(s)", inp(pre+"name",{max:50}), {req:1, ref:"[E26]", hint:"max 50 characters"});
      inner += sub("Address [F26]");
      inner += alAddrRows(pre,raw);
      inner += row("PAN of the firm / AOP", inp(pre+"pan",{max:10}), {req:1, ref:"[O26]"});
      inner += row("Assessee's investment in the firm / AOP on cost basis", inp(pre+"invest",{n:1}), {req:1, ref:"[P26]"});
      h += blk("aop"+i, title, (n0(raw.invest)?RS(n0(raw.invest)):"—"), inner, "al.aop."+i);
    });
    h += '<button class="add" data-add="al.aop">Add a firm / AOP</button>';
    h += row("Total investment in firms / AOPs (Part C)", cell(C.aopTotal||0));
  } else if(st0(A.aopFlag)==="N"){
    h += note("No interest in a firm or AOP declared. Part C will not be written.");
  }

  /* ===== Part D — liabilities ===== */
  h += sub("D · Liabilities");
  h += row("Liabilities in relation to Assets at (A + B + C)", inp("al.liab",{n:1}), {req:1, ref:"[O34]"});
  h += row("Assets at (A + B + C) — for reference", cell(C.assetsABC||0));

  /* cross-check reminders (warnings only — cost differs from value; see book point 6) */
  h += note("Cross-checks (warnings only, since Schedule AL is at cost): immovable assets against Schedule HP / Schedule FA; bank deposits against Part B-TTI bank details and FA; shares and securities against Schedule CG and the unlisted-share table; the firm/AOP interest against Schedule IF / partner details.");

  return h;
}

/* ---- export ------------------------------------------------------ */
function expAl(j){
  const A = S.al||{}, C = S.C.al||{};
  const mov = C.mov||{};
  const TI = R((S.C.ti)||0);

  /* emit ScheduleAL when the schedule is being filled or is applicable (TI > 50L) */
  const present = st0(A.ownImm) || st0(A.aopFlag) || (A.imm&&A.imm.length) ||
                  (A.aop&&A.aop.length) || (mov.total||0) || n0(A.liab) || TI>5000000;
  if(!present) return;

  const o = {};

  /* Part A — ImmovableDetails[] only when "Yes" and rows carry a value */
  if(st0(A.ownImm)==="Yes"){
    const rows = (A.imm||[]).filter(r=>st0((r||{}).desc)||n0((r||{}).amount)||st0((r||{}).city));
    if(rows.length){
      o.ImmovableDetails = rows.map(r=>({
        Description:(sv(r.desc)||"NA").slice(0,25),
        AddressAL:alAddrOut(r),
        Amount:n0(r.amount)
      }));
    }
  }

  /* Part B — MovableAsset (required; all eight lines always, zeros if nil) */
  o.MovableAsset = {
    DepositsInBank:n0(mov.bank),
    SharesAndSecurities:n0(mov.shares),
    InsurancePolicies:n0(mov.insurance),
    LoansAndAdvancesGiven:n0(mov.loans),
    CashInHand:n0(mov.cash),
    JewelleryBullionEtc:n0(mov.jewellery),
    ArchCollDrawPaintSulpArt:n0(mov.art),
    VehiclYachtsBoatsAircrafts:n0(mov.vehicles)
  };

  /* Part C — InterstAOPFlag (required Y/N) + InterestHeldInaAsset[] on Y with rows */
  const flag = (st0(A.aopFlag)==="Y" || (A.aop&&A.aop.length)) ? "Y" : "N";
  o.InterstAOPFlag = flag;
  if(flag==="Y"){
    const rows = (A.aop||[]).filter(r=>st0((r||{}).name)||n0((r||{}).invest)||st0((r||{}).pan));
    if(rows.length){
      o.InterestHeldInaAsset = rows.map(r=>({
        NameOfFirm:(sv(r.name)||"NA").slice(0,50),
        AddressAL:alAddrOut(r),
        PanOfFirm:PAN_RE.test(st0(r.pan).toUpperCase())?st0(r.pan).toUpperCase():"AAAAA0000A",
        AssesseInvestment:n0(r.invest)
      }));
    }
  }

  /* Part D — LiabilityInRelatAssets (required) */
  o.LiabilityInRelatAssets = n0(A.liab);

  j.ScheduleAL = o;
}

/* ---- import ------------------------------------------------------ */
function impAl(I3){
  const read = [];
  if(!(I3 && I3.ScheduleAL)) return read;
  const A = I3.ScheduleAL;
  S.al = S.al || {};

  const addrIn = x => { x = x||{}; return {
    resNo:x.ResidenceNo||"", resName:x.ResidenceName||"", road:x.RoadOrStreet||"",
    area:x.LocalityOrArea||"", city:x.CityOrTownOrDistrict||"", state:x.StateCode||"",
    country:x.CountryCode||"91", pin:x.PinCode!=null?String(x.PinCode):"", zip:x.ZipCode||""
  };};

  if(Array.isArray(A.ImmovableDetails)){
    S.al.imm = A.ImmovableDetails.map(r=>Object.assign(
      {desc:r.Description||"", amount:nz(r.Amount)}, addrIn(r.AddressAL)));
    S.al.ownImm = "Yes";
    read.push("Schedule AL Part A (immovable assets)");
  }
  if(A.MovableAsset){
    const m = A.MovableAsset;
    S.al.mov = {
      jewellery:nz(m.JewelleryBullionEtc), art:nz(m.ArchCollDrawPaintSulpArt),
      vehicles:nz(m.VehiclYachtsBoatsAircrafts), bank:nz(m.DepositsInBank),
      shares:nz(m.SharesAndSecurities), insurance:nz(m.InsurancePolicies),
      loans:nz(m.LoansAndAdvancesGiven), cash:nz(m.CashInHand)
    };
    read.push("Schedule AL Part B (movable assets)");
  }
  if(A.InterstAOPFlag){ S.al.aopFlag = A.InterstAOPFlag; read.push("Schedule AL Part C flag"); }
  if(Array.isArray(A.InterestHeldInaAsset)){
    S.al.aop = A.InterestHeldInaAsset.map(r=>Object.assign(
      {name:r.NameOfFirm||"", pan:r.PanOfFirm||"", invest:nz(r.AssesseInvestment)}, addrIn(r.AddressAL)));
    if(!st0(S.al.aopFlag)) S.al.aopFlag = "Y";
    read.push("Schedule AL Part C (firm/AOP interest)");
  }
  if(A.LiabilityInRelatAssets!=null){ S.al.liab = nz(A.LiabilityInRelatAssets); read.push("Schedule AL Part D (liabilities)"); }

  return read;
}

/* ---- checks ------------------------------------------------------ */
function chkAl(){
  const out = [], A = S.al||{}, C = S.C.al||{};
  const TI = R((S.C.ti)||0);
  const applic50 = TI>5000000;      /* VBA prompt threshold */

  /* Dropdown-not-blank (VBA) — both flags mandatory once income exceeds threshold */
  if(applic50){
    if(!st0(A.ownImm))
      out.push({lvl:"err", t:"Schedule AL — Part A", m:'"Do you own any immovable asset?" [J4] must be answered when Total Income exceeds Rs. 50 lakh.', sec:"al"});
    if(!st0(A.aopFlag))
      out.push({lvl:"err", t:"Schedule AL — Part C", m:'The interest-in-firm/AOP flag [M25] must be answered when Total Income exceeds Rs. 50 lakh.', sec:"al"});
  }

  /* Part A completeness (VBA) — when Yes, at least one row, each row complete */
  if(st0(A.ownImm)==="Yes"){
    const rows = (A.imm||[]);
    if(!rows.length || !rows.some(r=>st0((r||{}).desc)||n0((r||{}).amount)))
      out.push({lvl:"err", t:"Schedule AL — Part A", m:"At least one immovable asset detail is required when the answer is Yes.", sec:"al"});
    rows.forEach((r,i)=>{
      r = r||{};
      const has = st0(r.desc)||n0(r.amount)||st0(r.city)||st0(r.resNo);
      if(!has) return;
      const miss = [];
      if(!st0(r.desc)) miss.push("Description");
      if(!st0(r.resNo)) miss.push("Flat/Door/Block No.");
      if(!st0(r.area)) miss.push("Area/locality");
      if(!st0(r.city)) miss.push("Town/City/District");
      if(!st0(r.state)) miss.push("State");
      if(!st0(r.country)) miss.push("Country");
      if(!(n0(r.amount)>0)) miss.push("Amount");
      if(miss.length)
        out.push({lvl:"err", t:"Schedule AL — Part A", m:"Immovable asset "+(i+1)+": please fill "+miss.join(", ")+".", sec:"al"});
      alRowAddrChecks(out, r, "Immovable asset "+(i+1));
      if(n0(r.amount)>AL_MAX14)
        out.push({lvl:"warn", t:"Schedule AL — Part A", m:"Immovable asset "+(i+1)+": amount should not exceed 14 digits.", sec:"al"});
    });
  }

  /* Part B / D non-blank (VBA) — the eight lines and the liability export as zeros
     when blank, which satisfies the "enter zeros if nil" rule; only flag over-length */
  const mov = C.mov||{};
  [["Jewellery, bullion etc.",mov.jewellery],["Archaeological collections/art",mov.art],
   ["Vehicles, yachts, boats and aircrafts",mov.vehicles],["Bank (including all deposits)",mov.bank],
   ["Shares and securities",mov.shares],["Insurance policies",mov.insurance],
   ["Loans and advances given",mov.loans],["Cash in hand",mov.cash]].forEach(([lbl,v])=>{
    if(n0(v)>AL_MAX14)
      out.push({lvl:"warn", t:"Schedule AL — Part B", m:lbl+": amount should be non-negative and not exceed 14 digits.", sec:"al"});
  });
  if(n0(A.liab)>AL_MAX14)
    out.push({lvl:"warn", t:"Schedule AL — Part D", m:"Liability in relation to assets should be non-negative and not exceed 14 digits.", sec:"al"});

  /* Part C completeness (VBA) — when Y, at least one row, each row complete */
  if(st0(A.aopFlag)==="Y"){
    const rows = (A.aop||[]);
    if(!rows.length || !rows.some(r=>st0((r||{}).name)||n0((r||{}).invest)))
      out.push({lvl:"err", t:"Schedule AL — Part C", m:"At least one firm/AOP detail is required when the answer is Yes.", sec:"al"});
    rows.forEach((r,i)=>{
      r = r||{};
      const has = st0(r.name)||n0(r.invest)||st0(r.pan)||st0(r.city)||st0(r.resNo);
      if(!has) return;
      const miss = [];
      if(!st0(r.name)) miss.push("Name of firm/AOP");
      if(!st0(r.resNo)) miss.push("Flat/Door/Block No.");
      if(!st0(r.area)) miss.push("Area/locality");
      if(!st0(r.city)) miss.push("Town/City/District");
      if(!st0(r.state)) miss.push("State");
      if(!st0(r.country)) miss.push("Country");
      if(!(n0(r.invest)>0)) miss.push("Investment");
      if(miss.length)
        out.push({lvl:"err", t:"Schedule AL — Part C", m:"Firm/AOP "+(i+1)+": please fill "+miss.join(", ")+".", sec:"al"});
      if(st0(r.pan) && !PAN_RE.test(st0(r.pan).toUpperCase()))
        out.push({lvl:"err", t:"Schedule AL — Part C", m:"Firm/AOP "+(i+1)+": PAN is not a valid PAN.", sec:"al"});
      else if(!st0(r.pan) && has)
        out.push({lvl:"err", t:"Schedule AL — Part C", m:"Firm/AOP "+(i+1)+": PAN of the firm/AOP is required.", sec:"al"});
      alRowAddrChecks(out, r, "Firm/AOP "+(i+1));
      if(n0(r.invest)>AL_MAX14)
        out.push({lvl:"warn", t:"Schedule AL — Part C", m:"Firm/AOP "+(i+1)+": investment should not exceed 14 digits.", sec:"al"});
    });
  }

  return out;
}

/* Pin vs Zip and Country/State mapping checks for one address row (VBA) */
function alRowAddrChecks(out, r, who){
  r = r || {};
  const country = st0(r.country), state = st0(r.state);
  const india = country==="91";
  if(country){
    if(india){
      const p = R(r.pin);
      if(!(p>=100000 && p<=999999))
        out.push({lvl:"err", t:"Schedule AL — address", m:who+": Pin Code is mandatory for an Indian address and cannot exceed 6 digits.", sec:"al"});
    } else {
      if(!st0(r.zip))
        out.push({lvl:"err", t:"Schedule AL — address", m:who+": Zip Code is mandatory for a foreign address (max 8 characters).", sec:"al"});
      else if(st0(r.zip).length>8 || ZIP_BAD.test(st0(r.zip)))
        out.push({lvl:"err", t:"Schedule AL — address", m:who+": Zip Code cannot exceed 8 characters and cannot contain < > & ' \".", sec:"al"});
    }
  }
  /* Country/State mapping — Indian state (not 99) needs India (91); state 99 needs a foreign country */
  if(state && country){
    if(state!=="99" && country!=="91")
      out.push({lvl:"err", t:"Schedule AL — address", m:who+": an Indian state requires Country = India (91).", sec:"al"});
    if(state==="99" && country==="91")
      out.push({lvl:"err", t:"Schedule AL — address", m:who+": State '99-Foreign' requires a non-India country.", sec:"al"});
  }
}

/* ---- register ---------------------------------------------------- */
reg({id:"al", t:"Assets and liabilities", ref:"Schedule AL",
     f:secAl, s:()=>{const C=S.C.al||{};
       const tot=(C.immTotal||0)+((C.mov||{}).total||0)+(C.aopTotal||0);
       return tot?RS(tot)+" assets":"";},
     eng:engAl, exp:expAl, imp:impAl, chk:chkAl, order:30});
