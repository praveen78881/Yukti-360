/* =====================================================================
   ITR-3 · Section "hp" — House property (Schedule HP)
   Built from books/ITR-3/House_Property.md and books/ITR-3/REGIME.md only.
   Self-contained: state, engine, renderer, export, import, checks + reg().
   Cell refs from the book are quoted in comments beside each formula.
   (The ITR-2 HP sheet was read for shell idiom/style only — never its
   numbers, item-numbers or rules.)

   REGIME (books/ITR-3/REGIME.md): interest u/s 24(b) on a SELF-OCCUPIED
   house cannot be claimed under the new regime (A224/A232) — the renderer
   shows item 1h closed (cell 0 / a note, not an input) and the engine zeroes
   it. Let-out interest still stands. The HP-loss set-off (₹2,00,000 cap) and
   carry-forward are done in Schedule CYLA/CFL by the "loss" section (N74/N75
   are nil under the new regime, bacValue=1) — this section only publishes the
   signed head total S.C.hp.income for that roll-up.

   GTI CONTRIBUTION: S.C.hp.income = item 3 = Σ1k + item 2 (signed; a loss is
   negative). The "loss" engine reads S.C.hp.income (order 45, after this at 12)
   and the tax section rolls up Σ S.C.<head>.income.
   ===================================================================== */

/* ---- state: S.hp namespace (shape matches the shell add/commit wiring) --- */
S.hp = S.hp || { on:"", pti:"", props:[] };
if(!S.hp.props) S.hp.props = [];

/* SEED shapes for the shell's generic add-handler (documentary; the shell
   keeps its own seed map for hp.props / .loans / .coowners / .tenants). */
SEED.coowners = SEED.coowners || {};
SEED.tenants  = SEED.tenants  || {};

/* ---- code tables ---------------------------------------------------- */
/* Owner of the Property — enum PropertyOwner (F6) : SE/MI/SP/OT */
const HP_OWNER=[["SE","Self"],["MI","Minor"],["SP","Spouse"],["OT","Others"]];
/* Is the property co-owned? — enum PropCoOwnedFlg (I6) : YES/NO */
const HP_COOWN=[["NO","No"],["YES","Yes"]];
/* Type Of House Property? — enum ifLetOut (F15/H15) : L/D/S */
const HP_TYPE=[["S","Self Occupied"],["L","Let Out"],["D","Deemed Let Out"]];
/* Loan taken from — enum LoanTknFrom (E31:E34) : B/I */
const HP_LOANFROM=[["B","Bank"],["I","Other than Bank"]];
/* State — enum StateCode (H5/H40), 38 codes + 99-Foreign (from the book) */
const HP_STATE=[["01","Andaman and Nicobar Islands"],["02","Andhra Pradesh"],
  ["03","Arunachal Pradesh"],["04","Assam"],["05","Bihar"],["06","Chandigarh"],
  ["07","Dadra Nagar and Haveli"],["08","Daman and Diu"],["09","Delhi"],["10","Goa"],
  ["11","Gujarat"],["12","Haryana"],["13","Himachal Pradesh"],["14","Jammu and Kashmir"],
  ["15","Karnataka"],["16","Kerala"],["17","Lakshadweep"],["18","Madhya Pradesh"],
  ["19","Maharashtra"],["20","Manipur"],["21","Meghalaya"],["22","Mizoram"],
  ["23","Nagaland"],["24","Odisha"],["25","Puducherry"],["26","Punjab"],["27","Rajasthan"],
  ["28","Sikkim"],["29","Tamil Nadu"],["30","Tripura"],["31","Uttar Pradesh"],
  ["32","West Bengal"],["33","Chhattisgarh"],["34","Uttarakhand"],["35","Jharkhand"],
  ["36","Telangana"],["37","Ladakh"],["99","Foreign"]];
const HP_STATE_SET={}; HP_STATE.forEach(x=>HP_STATE_SET[x[0]]=1);
/* Country — enum CountryCode (I5/I40), 250 codes (from the book; the utility's
   enums.json country labels are corrupt, so the book's pairings are used). */
const HP_COUNTRY=[
  ["93","Afghanistan"],["1001","Aland Islands"],["355","Albania"],["213","Algeria"],["684","American Samoa"],
  ["376","Andorra"],["244","Angola"],["1264","Anguilla"],["1010","Antarctica"],["1268","Antigua And Barbuda"],
  ["54","Argentina"],["374","Armenia"],["297","Aruba"],["61","Australia"],["43","Austria"],
  ["994","Azerbaijan"],["1242","Bahamas"],["973","Bahrain"],["880","Bangladesh"],["1246","Barbados"],
  ["375","Belarus"],["32","Belgium"],["501","Belize"],["229","Benin"],["1441","Bermuda"],["975","Bhutan"],
  ["591","Bolivia (plurinational State Of)"],["1002","Bonaire"],["387","Bosnia And Herzegovina"],
  ["267","Botswana"],["1003","Bouvet Island"],["55","Brazil"],["1014","British Indian Ocean Territory"],
  ["673","Brunei Darussalam"],["359","Bulgaria"],["226","Burkina Faso"],["257","Burundi"],["238","Cabo Verde"],
  ["855","Cambodia"],["237","Cameroon"],["1","Canada"],["1345","Cayman Islands"],
  ["236","Central African Republic"],["235","Chad"],["56","Chile"],["86","China"],["9","Christmas Island"],
  ["672","Cocos (keeling) Islands"],["57","Colombia"],["270","Comoros"],["242","Congo"],
  ["243","Congo (democratic Republic Of The)"],["682","Cook Islands"],["506","Costa Rica"],
  ["225","Cote Divoire"],["385","Croatia"],["53","Cuba"],["1015","Curacao"],["357","Cyprus"],["420","Czechia"],
  ["45","Denmark"],["253","Djibouti"],["1767","Dominica"],["1809","Dominican Republic"],["593","Ecuador"],
  ["20","Egypt"],["503","El Salvador"],["240","Equatorial Guinea"],["291","Eritrea"],["372","Estonia"],
  ["251","Ethiopia"],["500","Falkland Islands (malvinas)"],["298","Faroe Islands"],["679","Fiji"],
  ["358","Finland"],["33","France"],["594","French Guiana"],["689","French Polynesia"],
  ["1004","French Southern Territories"],["241","Gabon"],["220","Gambia"],["995","Georgia"],["49","Germany"],
  ["233","Ghana"],["350","Gibraltar"],["30","Greece"],["299","Greenland"],["1473","Grenada"],
  ["590","Guadeloupe"],["1671","Guam"],["502","Guatemala"],["1481","Guernsey"],["224","Guinea"],
  ["245","Guinea-bissau"],["592","Guyana"],["509","Haiti"],["1005","Heard Island And Mcdonald Islands"],
  ["6","Holy See"],["504","Honduras"],["852","Hong Kong"],["36","Hungary"],["354","Iceland"],["91","India"],
  ["62","Indonesia"],["98","Iran (islamic Republic Of)"],["964","Iraq"],["353","Ireland"],
  ["1624","Isle Of Man"],["972","Israel"],["5","Italy"],["1876","Jamaica"],["81","Japan"],["1534","Jersey"],
  ["962","Jordan"],["7","Kazakhstan"],["254","Kenya"],["686","Kiribati"],
  ["850","Korea (democratic Peoples Republic Of)"],["82","Korea (republic Of)"],["965","Kuwait"],
  ["996","Kyrgyzstan"],["856","Lao Peoples Democratic Republic"],["371","Latvia"],["961","Lebanon"],
  ["266","Lesotho"],["231","Liberia"],["218","Libya"],["423","Liechtenstein"],["370","Lithuania"],
  ["352","Luxembourg"],["853","Macao"],["389","Macedonia (the Former Yugoslav Republic Of)"],
  ["261","Madagascar"],["265","Malawi"],["60","Malaysia"],["960","Maldives"],["223","Mali"],["356","Malta"],
  ["692","Marshall Islands"],["596","Martinique"],["222","Mauritania"],["230","Mauritius"],["269","Mayotte"],
  ["52","Mexico"],["691","Micronesia (federated States Of)"],["373","Moldova (republic Of)"],["377","Monaco"],
  ["976","Mongolia"],["382","Montenegro"],["1664","Montserrat"],["212","Morocco"],["258","Mozambique"],
  ["95","Myanmar"],["264","Namibia"],["674","Nauru"],["977","Nepal"],["31","Netherlands"],
  ["687","New Caledonia"],["64","New Zealand"],["505","Nicaragua"],["227","Niger"],["234","Nigeria"],
  ["683","Niue"],["15","Norfolk Island"],["1670","Northern Mariana Islands"],["47","Norway"],["968","Oman"],
  ["92","Pakistan"],["680","Palau"],["970","Palestine"],["507","Panama"],["675","Papua New Guinea"],
  ["595","Paraguay"],["51","Peru"],["63","Philippines"],["1011","Pitcairn"],["48","Poland"],["14","Portugal"],
  ["1787","Puerto Rico"],["974","Qatar"],["262","Reunion"],["40","Romania"],["8","Russian Federation"],
  ["250","Rwanda"],["1006","Saint Barthelemy"],["290","Saint Helena"],["1869","Saint Kitts And Nevis"],
  ["1758","Saint Lucia"],["1007","Saint Martin (french Part)"],["508","Saint Pierre And Miquelon"],
  ["1784","Saint Vincent And The Grenadines"],["685","Samoa"],["378","San Marino"],
  ["239","Sao Tome And Principe"],["966","Saudi Arabia"],["221","Senegal"],["381","Serbia"],
  ["248","Seychelles"],["232","Sierra Leone"],["65","Singapore"],["1721","Sint Maarten (dutch Part)"],
  ["421","Slovakia"],["386","Slovenia"],["677","Solomon Islands"],["252","Somalia"],["28","South Africa"],
  ["1008","South Georgia And The South Sandwich Islands"],["211","South Sudan"],["35","Spain"],
  ["94","Sri Lanka"],["249","Sudan"],["597","Suriname"],["1012","Svalbard And Jan Mayen"],["268","Swaziland"],
  ["46","Sweden"],["41","Switzerland"],["963","Syrian Arab Republic"],["886","Taiwan"],["992","Tajikistan"],
  ["255","Tanzania"],["66","Thailand"],["670","Timor-leste(east Timor)"],["228","Togo"],["690","Tokelau"],
  ["676","Tonga"],["1868","Trinidad And Tobago"],["216","Tunisia"],["90","Turkey"],["993","Turkmenistan"],
  ["1649","Turks And Caicos Islands"],["688","Tuvalu"],["256","Uganda"],["380","Ukraine"],
  ["971","United Arab Emirates"],["44","United Kingdom Of Great Britain And Northern Ireland"],
  ["2","United States Of America"],["1009","United States Minor Outlying Islands"],["598","Uruguay"],
  ["998","Uzbekistan"],["678","Vanuatu"],["58","Venezuela (bolivarian Republic Of)"],["84","Viet Nam"],
  ["1284","Virgin Islands (british)"],["1340","Virgin Islands (u.s.)"],["681","Wallis And Futuna"],
  ["967","Yemen"],["263","Zimbabwe"],["260","Zambia"],["1013","Western Sahara"],["9999","Others"]];

/* ---- engine ------------------------------------------------------ */
/* one property block a–k, exactly as the book's cell formulas read */
function engProp(p){
  p = p || {};
  const self = p.type==="S";
  const co   = p.co==="YES";
  /* share% — 100 if not co-owned; the co-owner's own % if co-owned (K6) */
  const share = co ? Math.min(100, Math.max(0, N(p.share))) : 100;

  const a = self ? 0 : R(p.rent);                 /* 1a AnnualLetableValue — nil if self-occupied */
  const b = self ? 0 : R(p.unreal);               /* 1b RentNotRealized */
  const c = self ? 0 : R(p.taxes);                /* 1c LocalTaxes */
  const d = R(b + c);                             /* 1d [I23]=SUM(I21:I22) */
  const e = self ? 0 : Math.max(0, R(a - d));     /* 1e [K24]=MAX(0,(K20-I23)) — nil if self-occ (23(2)) */
  const f = Math.max(0, R((share/100) * e));      /* 1f [K25]=MAX(0,ROUND((K7/100)*K24,0)) — share bites here */
  const g = R(Math.max(0, 0.30 * f));             /* 1g [I26]=ROUND(30% of 1f,0) */

  /* h — Total interest u/s 24(b) = Σ loan rows [K35]; the ceiling bites here */
  const loans = (p.loans||[]).filter(l => N(l.interest));
  const hRaw  = R(loans.reduce((s,l)=>s+N(l.interest), 0));   /* Section24B.TotalInterestUs24B */
  let h = hRaw, cut = 0, barred = false;
  if(self){                                       /* "Cannot exceed 2 lacs if not let out" [H27] */
    if(isNew()){ cut = hRaw; h = 0; barred = true; }          /* new regime: self-occ interest disallowed (A224/A232) */
    else if(hRaw > 200000){ cut = hRaw - 200000; h = 200000; }/* old regime: capped at ₹2,00,000 */
  }
  const i = R(g + h);                             /* 1i [K36]=SUM(I26,I27) */
  const jRecd = R(p.arrears);                     /* 1j amount received (arrears/unrealised) */
  const j = R(0.70 * jRecd);                      /* 1j less 30% (70% taken) */
  const k = R(f - i + j);                         /* 1k [K38]=(K25-K36+K37) */

  const coShare = (p.coowners||[]).reduce((s,x)=>s+N(x.share), 0);
  return {self, co, share, a, b, c, d, e, f, g, hRaw, h, cut, barred,
          i, jRecd, j, k, nLoans:loans.length, coShare};
}

function engHp(){
  const H = S.hp || {};
  const C = S.C.hp = { income:0, on:!!H.on, rows:[], sum1k:0, pti:0, cut:0,
                       selfCount:0, ptiFromSch:false };
  if(!H.on) return;

  const rows = (H.props||[]).map((p,idx)=>{ const r=engProp(p); p._=r; p._i=idx; return r; });
  const sum1k = R(rows.reduce((s,r)=>s+r.k, 0));           /* Σ1k */

  /* item 2 — Pass-through income/loss from Schedule PTI (book: from Sch PTI).
     The "other" section computes S.C.other.pti (order 24, after this at 12);
     guarded read — falls back to the manual figure H.pti. */
  const oth = S.C.other || {};
  const ptiFromSch = (oth.pti||[]).reduce((s,b)=>s+N((b.hp||{}).net), 0);
  const usedSch = Math.abs(ptiFromSch) > 0;
  const pti = R(usedSch ? ptiFromSch : N(H.pti));          /* PassThroghIncome */

  const income = R(sum1k + pti);                           /* item 3 = Σ1k + 2 = TotalIncomeChargeableUnHP */

  C.rows = rows;
  C.sum1k = sum1k;
  C.pti = pti;
  C.ptiFromSch = usedSch;
  C.income = income;                                       /* signed head total for CYLA/GTI roll-up */
  C.cut = R(rows.reduce((s,r)=>s+r.cut, 0));
  C.selfCount = (H.props||[]).filter(p=>p.type==="S").length;
}

/* ---- renderer ---------------------------------------------------- */
function hpBlock(p, i, ordinal){
  const r = p._ || engProp(p);
  const pre = "hp.props."+i+".", id = "hp"+i;
  const typeLbl = (HP_TYPE.find(t=>t[0]===p.type)||["","—"])[1];
  const status = (st0(p.addr)?typeLbl+" · ":"") + (r.k<0?"loss "+RS(-r.k):RS(r.k));
  let b = "";

  /* --- the property --- */
  b += sub("The property");
  b += row("Address of property", inp(pre+"addr",{max:200}), {req:1, ref:"F4", hint:"do not leave the address blank"});
  b += row("Town / City", inp(pre+"city",{max:50}), {req:1, ref:"G4"});
  b += row("Country", sel(pre+"country", HP_COUNTRY), {req:1, ref:"I4"});
  if((p.country||"91")==="91"){
    b += row("State", sel(pre+"state", HP_STATE), {req:1, ref:"H4"});
    b += row("PIN Code", inp(pre+"pin",{max:6}), {req:1, ref:"J4", hint:"100000–999999"});
  } else {
    b += row("State", sel(pre+"state", [["99","Foreign"]], {blank:false}), {req:1, ref:"H4"});
    b += row("Zip Code", inp(pre+"zip",{max:8}), {ref:"K4", hint:"for property abroad"});
  }

  /* --- ownership --- */
  b += sub("Ownership");
  b += row("Owner of the Property", sel(pre+"owner", HP_OWNER), {req:1, ref:"F6"});
  if(p.owner==="OT") b += row("Please specify (Others)", inp(pre+"ownerOther",{max:50}), {req:1, ind:1, ref:"F6"});
  b += row("Is the property co-owned?", sel(pre+"co", HP_COOWN, {blank:false}), {req:1, ref:"I6"});
  b += row("Your percentage of share in the property (%)",
           p.co==="YES" ? inp(pre+"share",{n:1}) : cell(100),
           {req:1, ref:"K6", hint:p.co==="YES"?"co-owners below must bring the total to 100%":"not co-owned — 100%"});
  if(p.co==="YES"){
    b += grid(pre.slice(0,-1)+".coowners",[
        {k:"name",h:"Name of co-owner(s)",t:"txt",w:"auto",req:1,max:125},
        {k:"pan",h:"PAN of Co-owner(s)",t:"txt",w:"120px",max:10},
        {k:"aadhaar",h:"Aadhaar of Co-owner(s)",t:"txt",w:"140px",max:12},
        {k:"share",h:"Percentage share of co-owner(s) %",t:"num",w:"160px"}],
      p.coowners||[], {min:"760px", empty:"No co-owner listed.", add:"Add a co-owner",
        foot:[{l:1,v:"Shares — yours "+(N(p.share)||0)+"% + co-owners "+r.coShare+"%",span:3},{v:(N(p.share)||0)+r.coShare}]});
    if(Math.abs((N(p.share)||0)+r.coShare-100)>0.01)
      b += note("The owner + co-owner shares add to "+((N(p.share)||0)+r.coShare)+"%, not 100%.","warn");
  }

  /* --- type --- */
  b += sub("Type of house property");
  b += row("Type Of House Property?", sel(pre+"type", HP_TYPE, {blank:false}), {req:1, ref:"F15"});
  if(p.type!=="S"){
    b += grid(pre.slice(0,-1)+".tenants",[
        {k:"name",h:"Name(s) of Tenant(s)",t:"txt",w:"auto",req:1,max:125},
        {k:"pan",h:"PAN of Tenant(s)",t:"txt",w:"120px",max:10},
        {k:"aadhaar",h:"Aadhaar of Tenant(s)",t:"txt",w:"140px",max:12},
        {k:"pantan",h:"PAN / TAN of Tenant(s) — if TDS credit is claimed",t:"txt",w:"220px",max:10}],
      p.tenants||[], {min:"880px", empty:"No tenant listed.", add:"Add a tenant"});
  }

  /* --- the working a–k --- */
  b += sub("Computation of income from the property");
  if(r.self){
    b += note("Self-occupied — the annual value is nil under section 23(2), so only interest u/s 24(b) counts."+
      (isNew()?" <b>Under the new regime section 115BAC disallows even that</b> (item 1h is closed)."
              :" Under the old regime it is allowed up to ₹2,00,000."));
    b += row("a · Gross Rent received or receivable or letable value", cell(0), {ref:"1a"});
    b += row("e · Annual value (nil, self-occupied — s.23(2))", cell(0), {ref:"1e"});
    b += row("f · Annual value of the property owned", cell(0), {ref:"1f"});
    b += row("g · 30% of f", cell(0), {ref:"1g"});
  } else {
    b += row("a · Gross Rent received or receivable or letable value", inp(pre+"rent",{n:1}),
             {req:1, ref:"1a", hint:"in full — your share is applied at f"});
    b += row("b · The amount of rent which cannot be realized", inp(pre+"unreal",{n:1}), {ref:"1b"});
    b += row("c · Tax paid to local authorities", inp(pre+"taxes",{n:1}), {ref:"1c"});
    b += row("d · Total (b + c)", cell(r.d), {ref:"1d", cls:"tot"});
    b += row("e · Annual value (a − d)", cell(r.e), {ref:"1e", cls:"tot"});
    b += row("f · Annual value of the property owned (own share × e)", cell(r.f),
             {ref:"1f", cls:"tot", hint:r.share<100?r.share+"% of "+RS(r.e):""});
    b += row("g · 30% of f", cell(r.g), {ref:"1g"});
  }

  /* --- 24(b) loan table (inside the block) --- */
  b += sub("h · Interest payable on borrowed capital — Section 24(b)");
  b += note("One row per loan; every column is required on a filled row. The interest sums into item h."+
    (r.self?" On a self-occupied house the sheet caps this at ₹2,00,000 (nil under the new regime).":""));
  if(!(r.self && isNew())){
    b += grid(pre.slice(0,-1)+".loans",[
        {k:"from",h:"Loan taken from",t:"sel",w:"160px",req:1,opts:HP_LOANFROM},
        {k:"name",h:"Name of the bank / institution / person",t:"txt",w:"auto",req:1,max:125},
        {k:"acno",h:"Loan Account number",t:"txt",w:"170px",req:1,max:25},
        {k:"dt",h:"Date of sanction of loan",t:"date",w:"140px",req:1},
        {k:"amt",h:"Total amount of loan",t:"num",w:"150px",req:1},
        {k:"os",h:"Loan outstanding on 31-03-2026",t:"num",w:"170px",req:1},
        {k:"interest",h:"Interest on Borrowed capital u/s 24(b)",t:"num",w:"170px",req:1}],
      p.loans||[], {min:"1320px", empty:"No loan.", add:"Add a loan",
        foot:[{l:1,v:"Total Interest on borrowed capital u/s 24(b)",span:6},{v:r.hRaw}]});
    b += row("h · Interest payable on borrowed capital", cell(r.h),
             {ref:"1h", cls:"tot", hint:r.cut?("capped at ₹2,00,000 — "+RS(r.cut)+" above the ceiling"):""});
  } else {
    /* regime-closed: self-occupied interest under the new regime */
    b += note("Closed by section 115BAC — interest on a self-occupied house cannot be claimed in the new regime.","stop");
    b += row("h · Interest payable on borrowed capital", cell(0), {ref:"1h", cls:"tot"});
  }

  b += row("i · Total (g + h)", cell(r.i), {ref:"1i", cls:"tot"});
  b += row("j · Arrears / Unrealized Rent received during the year", inp(pre+"arrears",{n:1}),
           {ref:"1j", hint:"amount received — 70% is taken (less 30%)"});
  b += row("j · Less 30%", cell(r.j), {ref:"1j", ind:1});
  b += row("k · Income from house property "+ordinal+" (f − i + j)", cell(r.k), {ref:"1k", cls:"grand"});

  return blk(id, "Property "+ordinal+(st0(p.addr)?" — "+st0(p.addr):""), status, b, "hp.props."+i);
}

function secHp(){
  const C = S.C.hp || {};
  let h = "";
  h += row("Is there income or a loss from house property?",
           sel("hp.on",[["","No"],["1","Yes"]],{blank:false}), {req:1, ref:"Schedule HP"});
  if(!S.hp.on) return h;

  h += note("One block per property, unlimited. The Section 24(b) loan table sits inside each block and "+
    "sums into item h. Rent, unrealised rent and local taxes are entered in full; a co-owner's share is "+
    "applied once, at f.");
  if(isNew())
    h += note("New regime — interest on a self-occupied house gives nothing, and an HP loss cannot be set "+
      "off against any other head or carried forward.","warn");
  if((C.selfCount||0) > 2)
    h += note("No more than two houses may be self-occupied (section 23(4)). The third and any further "+
      "self-occupied property must be treated as <b>deemed let out</b> — change its type.","stop");

  (S.hp.props||[]).forEach((p,i)=>h += hpBlock(p, i, i+1));
  h += '<button class="add" data-addprop="1">Add a property</button>';

  h += sub("Across all properties");
  h += row("Σ1k · Income from all properties", cell(C.sum1k), {cls:"tot"});
  if(C.ptiFromSch)
    h += row("2 · Pass through income / Loss — from Schedule PTI", cell(C.pti),
             {ref:"2", hint:"the house-property row(s) of Schedule PTI"});
  else
    h += row("2 · Pass through income / Loss (if any)", inp("hp.pti",{n:1}),
             {ref:"2", hint:"from Schedule PTI — leave blank if none"});
  h += row('3 · Income under the head "Income from house property" (Σ1k + 2)', cell(C.income),
           {ref:"3", cls:"grand",
            hint:C.income<0?(isNew()?"a loss — not set off under the new regime"
                                    :"a loss — to 2(i) of Schedule CYLA, capped at ₹2,00,000"):""});
  return h;
}

/* ---- export ------------------------------------------------------ */
function expHp(j){
  const C = S.C.hp || {};
  if(!(S.hp && S.hp.on && (S.hp.props||[]).length)) return;

  const items = (S.hp.props||[]).map((p,i)=>{
    const r = p._ || engProp(p);
    const ad = {
      AddrDetail:(sv(p.addr)||"NA").slice(0,200),
      CityOrTownOrDistrict:(sv(p.city)||"NA").slice(0,50),
      StateCode:(p.country||"91")==="91" ? (HP_STATE_SET[st0(p.state)]?st0(p.state):"19") : "99",
      CountryCode:(st0(p.country)||"91").slice(0,4)
    };
    if((p.country||"91")==="91"){ if(/^[1-9]\d{5}$/.test(st0(p.pin))) ad.PinCode=parseInt(p.pin,10); }
    else if(sv(p.zip)) ad.ZipCode=sv(p.zip).slice(0,8);

    const rd = {
      AnnualLetableValue:n0(r.a),               /* 1a */
      TotalUnrealizedAndTax:n0(r.d),            /* 1d */
      BalanceALV:n0(r.e),                       /* 1e */
      AnnualOfPropOwned:sg(r.f),                /* 1f */
      ThirtyPercentOfBalance:n0(r.g),           /* 1g */
      IntOnBorwCap:n0(r.h),                     /* 1h */
      TotalDeduct:n0(r.i),                      /* 1i */
      IncomeOfHP:sg(r.k)                        /* 1k */
    };
    if(r.b) rd.RentNotRealized=n0(r.b);         /* 1b (optional) */
    if(r.c) rd.LocalTaxes=n0(r.c);              /* 1c (optional) */
    if(r.j) rd.ArrearsUnrealizedRentRcvd=n0(r.j); /* 1j (optional) */

    const ln = (p.loans||[]).filter(l=>N(l.interest));
    if(ln.length){
      rd.Section24B = {
        Section24BDtls: ln.map(l=>({
          LoanTknFrom:l.from==="I"?"I":"B",
          BankOrInstnName:(sv(l.name)||"NA").slice(0,125),
          LoanAccNoOfBankOrInstnRefNo:(sv(l.acno)||"NA").slice(0,25),
          DateofLoan:ISO(l.dt)||"2025-04-01",
          TotalLoanAmt:n0(l.amt),
          LoanOutstndngAmt:n0(l.os),
          InterestUs24B:n0(l.interest)
        })),
        TotalInterestUs24B:n0(r.hRaw)
      };
    }

    const it = {
      HPSNo:i+1,
      AddressDetailWithZipCode:ad,
      PropertyOwner:p.owner||"SE",
      PropCoOwnedFlg:p.co==="YES"?"YES":"NO",
      ifLetOut:p.type||"S",
      Rentdetails:rd
    };
    if(N(r.share)) it.AsseseeShareProperty=N(r.share);
    if(p.owner==="OT" && sv(p.ownerOther)) it.PropertyOwnerOther=sv(p.ownerOther).slice(0,50);

    const co = (p.coowners||[]).filter(x=>st0(x.name));
    if(co.length) it.CoOwners=co.map((x,k)=>{
      const c={CoOwnersSNo:k+1, NameCoOwner:st0(x.name).slice(0,125)};
      if(PAN_RE.test(st0(x.pan).toUpperCase())) c.PAN_CoOwner=st0(x.pan).toUpperCase();
      if(AADH.test(st0(x.aadhaar))) c.Aadhaar_CoOwner=st0(x.aadhaar);
      if(N(x.share)) c.PercentShareProperty=N(x.share);
      return c;
    });
    const tn = (p.tenants||[]).filter(x=>st0(x.name));
    if(tn.length) it.TenantDetails=tn.map((x,k)=>{
      const t={TenantSNo:k+1, NameofTenant:st0(x.name).slice(0,125)};
      if(PAN_RE.test(st0(x.pan).toUpperCase())) t.PANofTenant=st0(x.pan).toUpperCase();
      if(AADH.test(st0(x.aadhaar))) t.AadhaarofTenant=st0(x.aadhaar);
      if(sv(x.pantan)) t.PANTANofTenant=st0(x.pantan).toUpperCase().slice(0,10);
      return t;
    });
    return it;
  });

  j.ScheduleHP = { PropertyDetails:items, TotalIncomeChargeableUnHP:sg(C.income) };
  if(C.pti) j.ScheduleHP.PassThroghIncome=sg(C.pti);
}

/* ---- import ------------------------------------------------------ */
function impHp(I3){
  if(!(I3 && I3.ScheduleHP)) return [];
  const hp = I3.ScheduleHP;
  S.hp = {
    on:"1",
    pti:nz(hp.PassThroghIncome),
    props:(hp.PropertyDetails||[]).map(p=>{
      const ad = p.AddressDetailWithZipCode||{}, rd = p.Rentdetails||{};
      return {
        addr:ad.AddrDetail||"", city:ad.CityOrTownOrDistrict||"",
        state:ad.StateCode||"", country:ad.CountryCode||"91",
        pin:ad.PinCode!=null?String(ad.PinCode):"", zip:ad.ZipCode||"",
        owner:p.PropertyOwner||"SE", ownerOther:p.PropertyOwnerOther||"",
        co:p.PropCoOwnedFlg==="YES"?"YES":"NO", share:nz(p.AsseseeShareProperty),
        coowners:(p.CoOwners||[]).map(c=>({name:c.NameCoOwner||"", pan:c.PAN_CoOwner||"",
          aadhaar:c.Aadhaar_CoOwner||"", share:nz(c.PercentShareProperty)})),
        type:p.ifLetOut||"S",
        tenants:(p.TenantDetails||[]).map(t=>({name:t.NameofTenant||"", pan:t.PANofTenant||"",
          aadhaar:t.AadhaarofTenant||"", pantan:t.PANTANofTenant||""})),
        rent:nz(rd.AnnualLetableValue), unreal:nz(rd.RentNotRealized), taxes:nz(rd.LocalTaxes),
        /* 1j is stored net (70%); recover the amount received = j / 0.70 */
        arrears:rd.ArrearsUnrealizedRentRcvd?Math.round(N(rd.ArrearsUnrealizedRentRcvd)/0.70):"",
        loans:(RG(rd,"Section24B.Section24BDtls",[])||[]).map(l=>({
          from:l.LoanTknFrom||"B", name:l.BankOrInstnName||"", acno:l.LoanAccNoOfBankOrInstnRefNo||"",
          dt:dmy(l.DateofLoan)||"", amt:nz(l.TotalLoanAmt), os:nz(l.LoanOutstndngAmt),
          interest:nz(l.InterestUs24B)}))
      };
    })
  };
  return ["Schedule HP (income from house property)"];
}

/* ---- checks ------------------------------------------------------ */
function chkHp(){
  const out = [];
  if(!(S.hp && S.hp.on)) return out;
  const C = S.C.hp || {};
  const myPan = st0((S.pi||{}).pan).toUpperCase();

  (S.hp.props||[]).forEach((p,n)=>{
    const r = p._ || engProp(p);
    const L = "Property "+(n+1);

    /* required address (book: do not leave address blank) */
    if(!st0(p.addr)) out.push({lvl:"err", t:L, m:"The address of the property is required.", sec:"hp"});
    if(!st0(p.city)) out.push({lvl:"err", t:L, m:"Town / City is required.", sec:"hp"});
    if((p.country||"91")==="91" && !HP_STATE_SET[st0(p.state)])
      out.push({lvl:"err", t:L, m:"State is required for a property in India.", sec:"hp"});
    if(!st0(p.type)) out.push({lvl:"err", t:L, m:"Select the type of house property (self-occupied / let out / deemed let out).", sec:"hp"});
    if(p.owner==="OT" && !st0(p.ownerOther))
      out.push({lvl:"err", t:L, m:'Owner is "Others" — please specify.', sec:"hp"});

    /* let-out / deemed let-out needs a gross rent (book: 1a > 0 if let out / deemed) */
    if((p.type==="L"||p.type==="D") && !(N(p.rent)>0))
      out.push({lvl:"err", t:L, m:"A let-out or deemed let-out property needs a gross rent / lettable value (1a).", sec:"hp"});
    /* local tax not allowed if 1a is zero/null (book: 1c note) */
    if(N(p.taxes)>0 && !(N(p.rent)>0))
      out.push({lvl:"warn", t:L, m:"Tax paid to local authorities (1c) cannot be claimed when the gross rent (1a) is nil.", sec:"hp"});
    /* unrealised rent cannot exceed the gross rent */
    if(N(p.unreal) > N(p.rent))
      out.push({lvl:"warn", t:L, m:"The amount of rent that cannot be realised (1b) cannot exceed the gross rent (1a).", sec:"hp"});

    /* co-ownership: shares must total 100; assessee share must not be 100 if co-owned */
    if(p.co==="YES"){
      if(N(p.share)===100)
        out.push({lvl:"err", t:L, m:"The property is co-owned, so your own share must be less than 100%.", sec:"hp"});
      if(!(p.coowners||[]).some(x=>st0(x.name)))
        out.push({lvl:"err", t:L, m:"List the other co-owner(s) of the property.", sec:"hp"});
      if(Math.abs((N(p.share)||0)+r.coShare-100)>0.01)
        out.push({lvl:"err", t:L, m:"Your share plus the co-owners' shares must total 100%.", sec:"hp"});
      if(r.coShare>=100)
        out.push({lvl:"warn", t:L, m:"The other co-owners' shares must total less than 100%.", sec:"hp"});
      /* assessee cannot claim interest if his share of a co-owned property is zero */
      if(N(p.share)===0 && r.hRaw>0)
        out.push({lvl:"err", t:L, m:"You cannot claim interest u/s 24(b) on a co-owned property in which your share is nil.", sec:"hp"});
    }

    /* co-owner / tenant PAN form; co-owner PAN cannot equal the assessee's PAN */
    (p.coowners||[]).forEach((x,m)=>{
      if(st0(x.pan) && !PAN_RE.test(st0(x.pan).toUpperCase()))
        out.push({lvl:"err", t:L+", co-owner "+(m+1), m:"The PAN is not in the correct form.", sec:"hp"});
      if(myPan && st0(x.pan).toUpperCase()===myPan)
        out.push({lvl:"err", t:L+", co-owner "+(m+1), m:"A co-owner's PAN cannot be the same as the assessee's PAN.", sec:"hp"});
    });
    (p.tenants||[]).forEach((x,m)=>{
      if(st0(x.pan) && !PAN_RE.test(st0(x.pan).toUpperCase()))
        out.push({lvl:"err", t:L+", tenant "+(m+1), m:"The PAN is not in the correct form.", sec:"hp"});
    });

    /* interest ceiling on a self-occupied house (regime-aware) */
    if(p.type==="S"){
      if(isNew() && r.hRaw>0)
        out.push({lvl:"warn", t:L, m:"New regime — interest on a self-occupied house cannot be claimed; it has been set to nil (section 115BAC).", sec:"hp"});
      else if(!isNew() && r.hRaw>200000)
        out.push({lvl:"warn", t:L, m:"Interest on a self-occupied house is limited to ₹2,00,000 under the old regime; the excess of "+RS(r.hRaw-200000)+" has been set aside.", sec:"hp"});
    }

    /* interest u/s 24(b) needs the loan table (book: details of loan mandatory to claim) */
    if(r.hRaw>0){
      (p.loans||[]).filter(l=>N(l.interest)).forEach((l,m)=>{
        if(!st0(l.name)||!st0(l.acno)||!st0(l.from)||!ISO(l.dt))
          out.push({lvl:"err", t:L+", loan "+(m+1), m:"Every column of the Section 24(b) loan row is required (lender, name, account no., date of sanction).", sec:"hp"});
      });
    }
  });

  /* no more than two self-occupied houses (section 23(4)) */
  if((C.selfCount||0) > 2)
    out.push({lvl:"err", t:"House property", m:"No more than two houses may be self-occupied — treat the others as deemed let out.", sec:"hp"});

  return out;
}

/* ---- register ---------------------------------------------------- */
reg({id:"hp", t:"House property", ref:"Schedule HP",
     f:secHp,
     s:()=>{ const C=S.C.hp||{}; if(!(S.hp&&S.hp.on)) return "None";
       return C.income<0 ? "Loss "+CR(-C.income)
            : (C.income ? "Income "+CR(C.income)
                        : ((S.hp.props||[]).length+" property")); },
     eng:engHp, exp:expHp, imp:impHp, chk:chkHp, order:12});
