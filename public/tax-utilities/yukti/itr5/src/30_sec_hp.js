/* =====================================================================
   ITR-5 · Section "hp" — House property (Schedule HP)
   Built from books/ITR-5/HOUSE_PROPERTY.md, books/ITR-5/CYLA_BFLA.md and
   books/ITR-5/enums.json only. Self-contained: state, engine, renderer,
   export, import, checks + one reg(). Cell refs from the book are quoted in
   comments beside each formula.
   (The ITR-3 HP file was read for shell idiom/style only — never its
   numbers, item-numbers, enums or rules; ITR-5 has no self-occupied type.)

   ITR-5 FACTS (differ from ITR-3):
   - PropertyOwner enum is SE/DO (Self / Deemed Owner) — no "Others".
   - ifLetOut enum is Y/D (Let Out / Deemed Let Out) — there is NO
     self-occupied property in ITR-5, so every property computes the full
     a–k with its gross rent; there is no per-property interest cap.
   - The assessee's own share % (J6 / AssessePercentShareProp) is COMPUTED,
     not entered: co-owned "YES" -> 100 − Σ co-owner shares; "NO" -> 100.
   - The single ₹2,00,000 cap in ITR-5 HP is the AGGREGATE HP-loss set-off
     cap into Schedule CYLA (row-3 scratch P3/T3), NOT a per-loan cap.

   GTI / LOSS CONTRIBUTION (books/ITR-5/CYLA_BFLA.md):
   - Schedule CYLA reads HP.TotalIncomeChargeableUnHP directly:
       F8 = MAX(income,0)          (HP positive income into CYLA)
       G7 = ABS(MIN(income,0))     (HP loss available, taken positive)
     the ₹2,00,000 set-off cap (TotHPlossCurYrSetoff ≤ 200000, s.71(3A))
     and the new-regime zeroing (bacValue=1 ⇒ HP loss not adjustable) are
     applied inside the "loss" section. This section computes and publishes
     onto S.C.hp everything that section needs: the signed head total
     (income), the positive income (posInc), the loss available (lossAvail)
     and the book's row-3 scratch figures p3 (loss for the 2-lakh
     adjustment) / t3 (loss remaining beyond 2 lakh) / capLoss.
   ===================================================================== */

/* ---- state: S.hp namespace (shape matches the shell add/commit wiring) --- */
S.hp = S.hp || { on:"", pti:"", props:[] };
if(!S.hp.props) S.hp.props = [];

/* SEED shapes for the shell's generic grid add-handler (documentary; the
   shell keeps its own seed map and a hardcoded data-addprop handler that
   pushes {type,co,country,owner,loans,coowners,tenants}). */
SEED.coowners = SEED.coowners || {};
SEED.tenants  = SEED.tenants  || {};

/* ---- code tables (from books/ITR-5/enums.json + HOUSE_PROPERTY.md) ---- */
/* Owner of the Property — enum PropertyOwner (F6) : SE/DO */
const HP_OWNER=[["SE","Self"],["DO","Deemed Owner"]];
/* Is the property co-owned? — enum PropCoOwnedFlg (H6) : YES/NO */
const HP_COOWN=[["NO","No"],["YES","Yes"]];
/* Type of House property? — enum ifLetOut (I14) : Y/D (no self-occupied) */
const HP_TYPE=[["Y","Let Out"],["D","Deemed Let Out"]];
/* Loan taken from — enum LoanTknFrom (D30:D33) : B/I */
const HP_LOANFROM=[["B","Bank"],["I","Other than Bank"]];
/* State — enum StateCode (G5), 38 codes + 99-Foreign (HOUSE_PROPERTY.md) */
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
/* Country — enum CountryCode (H5), 250 codes + 9999-Others (HOUSE_PROPERTY.md) */
const HP_COUNTRY=[
  ["93","Afghanistan"],["1001","Aland Islands"],["355","Albania"],["213","Algeria"],["684","American Samoa"],
  ["376","Andorra"],["244","Angola"],["1264","Anguilla"],["1010","Antarctica"],["1268","Antigua And Barbuda"],
  ["54","Argentina"],["374","Armenia"],["297","Aruba"],["61","Australia"],["43","Austria"],
  ["994","Azerbaijan"],["1242","Bahamas"],["973","Bahrain"],["880","Bangladesh"],["1246","Barbados"],
  ["375","Belarus"],["32","Belgium"],["501","Belize"],["229","Benin"],["1441","Bermuda"],["975","Bhutan"],
  ["591","Bolivia (plurinational State Of)"],["1002","Bonaire, Sint Eustatius And Saba"],["387","Bosnia And Herzegovina"],
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
  ["92","Pakistan"],["680","Palau"],["970","Palestine, State Of"],["507","Panama"],["675","Papua New Guinea"],
  ["595","Paraguay"],["51","Peru"],["63","Philippines"],["1011","Pitcairn"],["48","Poland"],["14","Portugal"],
  ["1787","Puerto Rico"],["974","Qatar"],["262","Reunion"],["40","Romania"],["8","Russian Federation"],
  ["250","Rwanda"],["1006","Saint Barthelemy"],["290","Saint Helena, Ascension And Tristan Da Cunha"],
  ["1869","Saint Kitts And Nevis"],["1758","Saint Lucia"],["1007","Saint Martin (french Part)"],
  ["508","Saint Pierre And Miquelon"],["1784","Saint Vincent And The Grenadines"],["685","Samoa"],
  ["378","San Marino"],["239","Sao Tome And Principe"],["966","Saudi Arabia"],["221","Senegal"],["381","Serbia"],
  ["248","Seychelles"],["232","Sierra Leone"],["65","Singapore"],["1721","Sint Maarten (dutch Part)"],
  ["421","Slovakia"],["386","Slovenia"],["677","Solomon Islands"],["252","Somalia"],["28","South Africa"],
  ["1008","South Georgia And The South Sandwich Islands"],["211","South Sudan"],["35","Spain"],
  ["94","Sri Lanka"],["249","Sudan"],["597","Suriname"],["1012","Svalbard And Jan Mayen"],["268","Swaziland"],
  ["46","Sweden"],["41","Switzerland"],["963","Syrian Arab Republic"],["886","Taiwan, Province Of China"],
  ["992","Tajikistan"],["255","Tanzania, United Republic Of"],["66","Thailand"],["670","Timor-leste(east Timor)"],
  ["228","Togo"],["690","Tokelau"],["676","Tonga"],["1868","Trinidad And Tobago"],["216","Tunisia"],
  ["90","Turkey"],["993","Turkmenistan"],["1649","Turks And Caicos Islands"],["688","Tuvalu"],["256","Uganda"],
  ["380","Ukraine"],["971","United Arab Emirates"],
  ["44","United Kingdom Of Great Britain And Northern Ireland"],["2","United States Of America"],
  ["1009","United States Minor Outlying Islands"],["598","Uruguay"],["998","Uzbekistan"],["678","Vanuatu"],
  ["58","Venezuela (bolivarian Republic Of)"],["84","Viet Nam"],["1284","Virgin Islands (british)"],
  ["1340","Virgin Islands (u.s.)"],["681","Wallis And Futuna"],["1013","Western Sahara"],["967","Yemen"],
  ["260","Zambia"],["263","Zimbabwe"],["9999","Others"]];

/* ---- engine ------------------------------------------------------ */
/* one property block a–k, exactly as the book's cell formulas read.
   ITR-5 has no self-occupied type, so both Let Out (Y) and Deemed Let
   Out (D) run the same rent-based computation. */
function engProp(p){
  p = p || {};
  const coShare = (p.coowners||[]).reduce((s,x)=>s+N(x.share), 0);   /* Σ co-owner shares */
  /* J6 own share%: =IF(co="Y",100-Σco,IF(co="N",100,0)) */
  const share = p.co==="YES" ? Math.max(0, R(100 - coShare))
              : p.co==="NO"  ? 100
              : 0;

  const a = R(p.rent);                             /* 1a AnnualLetableValue [J19] */
  const b = R(p.unreal);                           /* 1b RentNotRealized      [H20] */
  const c = R(p.taxes);                            /* 1c LocalTaxes           [H21] */
  const d = R(b + c);                              /* 1d [H22]=SUM(H20:H21)   = 1b+1c */
  const e = Math.max(0, R(a - d));                 /* 1e [J23]=MAX(0,J19-H22) = max(0,1a-1d) */
  const f = Math.max(0, R((share/100) * e));       /* 1f [J24]=ROUND(J23*J6/100,0) — own share bites */
  const g = Math.max(0, R(0.30 * f));              /* 1g [H25]=MAX(ROUND(0.3*J24,0),0) = 30% of 1f */

  /* h — Total interest u/s 24(b) = Σ loan rows [J34]=SUM(Intrst.24b1); no cap
     on a let-out / deemed let-out property in ITR-5. */
  const loans = (p.loans||[]).filter(l => N(l.interest) || st0(l.name) || N(l.amt));
  const hRaw  = R(loans.reduce((s,l)=>s+N(l.interest), 0));   /* Section24B.TotalInterestUs24B [J34] */
  const h = hRaw;                                  /* 1h [H26]=TotAmt.24b1 */

  const i = R(g + h);                              /* 1i [J35]=SUM(H25:H26) = 1g+1h */
  const jRecd = R(p.arrears);                      /* 1j amount received (arrears/unrealised) */
  const j = R(0.70 * jRecd);                       /* 1j less 30% (70% taken) [J36] */
  const k = R(f - i + j);                          /* 1k [J37]=J24-J35+J36 = 1f-1i+1j */

  return {coShare, share, a, b, c, d, e, f, g, hRaw, h, i, jRecd, j, k, nLoans:loans.length};
}

function engHp(){
  const H = S.hp || {};
  const C = S.C.hp = { income:0, on:!!H.on, rows:[], sum1k:0, pti:0, ptiFromSch:false,
                       posInc:0, lossAvail:0, p3:0, t3:0, capLoss:0, newRegime:isNew() };
  if(!H.on) return;

  const rows = (H.props||[]).map((p,idx)=>{ const r=engProp(p); p._=r; p._i=idx; return r; });
  const sum1k = R(rows.reduce((s,r)=>s+r.k, 0));          /* D40 = Σ1k */

  /* item 2 — Pass-through income/loss (book: from Schedule PTI). The "other"
     section computes S.C.other.pti; guarded read falls back to the manual
     figure H.pti when that section has not published (or is nil). */
  const oth = S.C.other || {};
  const ptiFromSch = (oth.pti||[]).reduce((s,b)=>s+N((b.hp||{}).net), 0);
  const usedSch = Math.abs(ptiFromSch) > 0;
  const pti = R(usedSch ? ptiFromSch : N(H.pti));          /* PassThroghIncome (row 41) */

  const income = R(sum1k + pti);                           /* row 42 TotalIncomeChargeableUnHP = Σ1k + 2 */

  C.rows = rows;
  C.sum1k = sum1k;
  C.pti = pti;
  C.ptiFromSch = usedSch;
  C.income = income;                                       /* signed head total; CYLA reads this */
  C.posInc = Math.max(0, income);                          /* CYLA F8 = MAX(income,0) */
  C.lossAvail = Math.abs(Math.min(0, income));             /* CYLA G7 = ABS(MIN(income,0)) */
  C.p3 = Math.max(income, -200000);                        /* [P3]=MAX(income,-200000) loss for 2-lakh adj */
  C.t3 = Math.max(0, (-income - 200000));                  /* [T3]=MAX(0,(-income-200000)) loss beyond 2 lakh */
  C.capLoss = Math.min(C.lossAvail, 200000);               /* HP loss set off, capped at ₹2,00,000 (s.71(3A)) */
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
  b += row("Address of property", inp(pre+"addr",{max:200}), {req:1, ref:"E4", hint:"do not leave the address blank"});
  b += row("Town / City", inp(pre+"city",{max:50}), {req:1, ref:"F4"});
  b += row("Country", sel(pre+"country", HP_COUNTRY), {req:1, ref:"H4"});
  if((p.country||"91")==="91"){
    b += row("State", sel(pre+"state", HP_STATE), {req:1, ref:"G4"});
    b += row("PIN Code", inp(pre+"pin",{max:6}), {req:1, ref:"I4", hint:"100000–999999"});
  } else {
    b += row("State", sel(pre+"state", [["99","Foreign"]], {blank:false}), {req:1, ref:"G4"});
    b += row("Zip Code", inp(pre+"zip",{max:8}), {ref:"J4", hint:"for property abroad"});
  }

  /* --- ownership --- */
  b += sub("Ownership");
  b += row("Owner of the Property", sel(pre+"owner", HP_OWNER), {req:1, ref:"E6"});
  b += row("Is the property co-owned?", sel(pre+"co", HP_COOWN, {blank:false}), {req:1, ref:"G6"});
  b += row("Assessee's percentage of share in the property (%)",
           cell(r.share),
           {req:1, ref:"I6",
            hint:p.co==="YES"?"computed = 100% − co-owners' shares ("+r.coShare+"%)":
                 p.co==="NO"?"not co-owned — 100%":"select co-owned above"});
  if(p.co==="YES"){
    b += grid(pre.slice(0,-1)+".coowners",[
        {k:"name",h:"Name of other co-owner(s)",t:"txt",w:"auto",req:1,max:125},
        {k:"pan",h:"PAN of co-owner(s)",t:"txt",w:"120px",max:10},
        {k:"aadhaar",h:"Aadhaar of co-owner(s)",t:"txt",w:"140px",max:12},
        {k:"share",h:"Percentage share of co-owner(s) %",t:"num",w:"180px"}],
      p.coowners||[], {min:"780px", empty:"No co-owner listed.", add:"Add a co-owner",
        foot:[{l:1,v:"Co-owners' total share (your share = 100 − this)",span:3},{v:r.coShare}]});
    if(r.coShare>=100)
      b += note("The other co-owners' shares add to "+r.coShare+"% — they must be less than 100% so your own share is positive.","warn");
  }

  /* --- type & tenants --- */
  b += sub("Type of house property");
  b += row("Type of House property?", sel(pre+"type", HP_TYPE), {req:1, ref:"I14",
           hint:"ITR-5 has no self-occupied option"});
  b += grid(pre.slice(0,-1)+".tenants",[
      {k:"name",h:"Name(s) of Tenant(s)",t:"txt",w:"auto",req:1,max:125},
      {k:"pan",h:"PAN of Tenant(s)",t:"txt",w:"120px",max:10},
      {k:"aadhaar",h:"Aadhaar of Tenant(s)",t:"txt",w:"140px",max:12},
      {k:"pantan",h:"PAN / TAN of Tenant(s) — if TDS credit is claimed",t:"txt",w:"220px",max:10}],
    p.tenants||[], {min:"900px", empty:"No tenant listed.", add:"Add a tenant"});

  /* --- the working a–k --- */
  b += sub("Computation of income from the property");
  b += row("a · Gross rent received / receivable / letable value", inp(pre+"rent",{n:1}),
           {req:1, ref:"1a", hint:"in full — your share is applied at f"});
  b += row("b · The amount of rent which cannot be realized", inp(pre+"unreal",{n:1}), {ref:"1b"});
  b += row("c · Tax paid to local authorities", inp(pre+"taxes",{n:1}), {ref:"1c"});
  b += row("d · Total (b + c)", cell(r.d), {ref:"1d", cls:"tot"});
  b += row("e · Annual value (a − d)", cell(r.e), {ref:"1e", cls:"tot"});
  b += row("f · Annual value of the property owned (own share × e)", cell(r.f),
           {ref:"1f", cls:"tot", hint:r.share<100?r.share+"% of "+RS(r.e):""});
  b += row("g · 30% of f", cell(r.g), {ref:"1g"});

  /* --- 24(b) loan table (inside the block) --- */
  b += sub("h · Interest payable on borrowed capital — Section 24(b)");
  b += note("One row per loan; every column is required on a filled row. The interest sums into item h "+
    "(there is no ₹2,00,000 cap on a let-out or deemed let-out property).");
  b += grid(pre.slice(0,-1)+".loans",[
      {k:"from",h:"Loan taken from",t:"sel",w:"160px",req:1,opts:HP_LOANFROM},
      {k:"name",h:"Name of the bank / institution / person",t:"txt",w:"auto",req:1,max:125},
      {k:"acno",h:"Loan Account number",t:"txt",w:"170px",req:1,max:20},
      {k:"dt",h:"Date of sanction of loan",t:"date",w:"140px",req:1},
      {k:"amt",h:"Total amount of loan",t:"num",w:"150px",req:1},
      {k:"os",h:"Loan outstanding on 31-03-2026",t:"num",w:"170px",req:1},
      {k:"interest",h:"Interest on Borrowed capital u/s 24(b)",t:"num",w:"170px",req:1}],
    p.loans||[], {min:"1320px", empty:"No loan.", add:"Add a loan",
      foot:[{l:1,v:"Total Interest on borrowed capital u/s 24(b)",span:6},{v:r.hRaw}]});
  b += row("h · Interest payable on borrowed capital", cell(r.h), {ref:"1h", cls:"tot"});

  b += row("i · Total (g + h)", cell(r.i), {ref:"1i", cls:"tot"});
  b += row("j · Arrears / Unrealized rent received during the year", inp(pre+"arrears",{n:1}),
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

  h += note("One block per house property, unlimited. The Section 24(b) loan table sits inside each block "+
    "and sums into item h. Rent, unrealised rent and local taxes are entered in full; the co-owner's share "+
    "is applied once, at f. ITR-5 has no self-occupied property — every property is let out or deemed let out.");

  (S.hp.props||[]).forEach((p,i)=>h += hpBlock(p, i, i+1));
  h += '<button class="add" data-addprop="1">Add a property</button>';

  h += sub("Across all properties");
  h += row("Σ1k · Income from all properties", cell(C.sum1k), {ref:"D40", cls:"tot"});
  if(C.ptiFromSch)
    h += row("2 · Pass through income / Loss — from Schedule PTI", cell(C.pti),
             {ref:"E41", hint:"the house-property row(s) of Schedule PTI"});
  else
    h += row("2 · Pass through income / Loss (if any)", inp("hp.pti",{n:1}),
             {ref:"E41", hint:"from Schedule PTI — leave blank if none"});
  h += row('3 · Income under the head "Income from house property" (Σ1k + 2)', cell(C.income),
           {ref:"E42", cls:"grand",
            hint:C.income<0?("a loss — to 2(i) of Schedule CYLA, set off up to ₹2,00,000"+
                             (C.t3>0?"; "+RS(C.t3)+" beyond the cap carries forward":"")):""});
  if(C.income<0)
    h += note("A house-property loss can be set off against other heads only up to ₹2,00,000 (s.71(3A)); "+
      "under the new tax regime it cannot be set off at all. The set-off / carry-forward is done in "+
      "Schedule CYLA/CFL by the losses section.","warn");
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

    /* Rentdetails — the a–k. RentNotRealized / LocalTaxes are required, so
       always emitted (0 when nil); the computed cells are required too. */
    const rd = {
      AnnualLetableValue:n0(r.a),               /* 1a */
      RentNotRealized:n0(r.b),                  /* 1b (required) */
      LocalTaxes:n0(r.c),                       /* 1c (required) */
      TotalUnrealizedAndTax:n0(r.d),            /* 1d */
      BalanceALV:n0(r.e),                       /* 1e */
      AnnualOfPropOwned:n0(r.f),                /* 1f */
      ThirtyPercentOfBalance:n0(r.g),           /* 1g */
      IntOnBorwCap:n0(r.h),                     /* 1h */
      TotalDeduct:n0(r.i),                      /* 1i */
      IncomeOfHP:sg(r.k)                        /* 1k (signed) */
    };
    if(r.j) rd.ArrearsUnrealizedRentRcvd=n0(r.j); /* 1j (optional, stored net of 30%) */

    const ln = (p.loans||[]).filter(l=>N(l.interest) || st0(l.name) || N(l.amt));
    if(ln.length){
      rd.Section24B = {
        Section24BDtls: ln.map(l=>({
          LoanTknFrom:l.from==="I"?"I":"B",
          BankOrInstnName:(sv(l.name)||"NA").slice(0,125),
          LoanAccNoOfBankOrInstnRefNo:(sv(l.acno)||"NA").slice(0,20),
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
      PropertyOwner:p.owner==="DO"?"DO":"SE",
      PropCoOwnedFlg:p.co==="YES"?"YES":"NO",
      ifLetOut:p.type==="D"?"D":"Y",
      Rentdetails:rd
    };
    if(r.share) it.AssessePercentShareProp=R(r.share);   /* J6 computed own share % */

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

  /* written via put (HP is the sole writer of ScheduleHP.* — no gate-4 clash) */
  put(j,"ScheduleHP.PropertyDetails",items);
  put(j,"ScheduleHP.TotalIncomeChargeableUnHP",sg(C.income));   /* row 42; may be negative */
  if(C.pti) put(j,"ScheduleHP.PassThroghIncome",sg(C.pti));     /* row 41 (optional) */
}

/* ---- import ------------------------------------------------------ */
function impHp(I5){
  if(!(I5 && I5.ScheduleHP)) return [];
  const hp = I5.ScheduleHP;
  S.hp = {
    on:"1",
    pti:nz(hp.PassThroghIncome),
    props:(hp.PropertyDetails||[]).map(p=>{
      const ad = p.AddressDetailWithZipCode||{}, rd = p.Rentdetails||{};
      return {
        addr:ad.AddrDetail||"", city:ad.CityOrTownOrDistrict||"",
        state:ad.StateCode||"", country:ad.CountryCode||"91",
        pin:ad.PinCode!=null?String(ad.PinCode):"", zip:ad.ZipCode||"",
        owner:p.PropertyOwner==="DO"?"DO":"SE",
        co:p.PropCoOwnedFlg==="YES"?"YES":"NO",
        coowners:(p.CoOwners||[]).map(c=>({name:c.NameCoOwner||"", pan:c.PAN_CoOwner||"",
          aadhaar:c.Aadhaar_CoOwner||"", share:nz(c.PercentShareProperty)})),
        type:p.ifLetOut==="D"?"D":"Y",
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
  const myPan = st0((S.pi||{}).pan).toUpperCase();

  (S.hp.props||[]).forEach((p,n)=>{
    const r = p._ || engProp(p);
    const L = "Property "+(n+1);

    /* required address / type (book: address blank not allowed; type required) */
    if(!st0(p.addr)) out.push({lvl:"err", t:L, m:"The address of the property is required.", sec:"hp"});
    if(!st0(p.city)) out.push({lvl:"err", t:L, m:"Town / City is required.", sec:"hp"});
    if((p.country||"91")==="91" && !HP_STATE_SET[st0(p.state)])
      out.push({lvl:"err", t:L, m:"State is required for a property in India.", sec:"hp"});
    if(p.type!=="Y" && p.type!=="D")
      out.push({lvl:"err", t:L, m:"Select the type of house property (let out / deemed let out).", sec:"hp"});
    if(!st0(p.owner)) out.push({lvl:"err", t:L, m:"Select the owner of the property (self / deemed owner).", sec:"hp"});

    /* let-out / deemed let-out needs a gross rent (rule #198: 1a > 0) */
    if((p.type==="Y"||p.type==="D") && !(N(p.rent)>0))
      out.push({lvl:"err", t:L, m:"A let-out or deemed let-out property needs a gross rent / lettable value (1a).", sec:"hp"});
    /* local tax not allowed if 1a is zero/null (rule #196) */
    if(N(p.taxes)>0 && !(N(p.rent)>0))
      out.push({lvl:"warn", t:L, m:"Tax paid to local authorities (1c) cannot be claimed when the gross rent (1a) is nil.", sec:"hp"});
    /* unrealised rent cannot exceed the gross rent (rule #208) */
    if(N(p.unreal) > N(p.rent))
      out.push({lvl:"warn", t:L, m:"The amount of rent that cannot be realised (1b) cannot exceed the gross rent (1a).", sec:"hp"});

    /* co-ownership: shares must total 100 (own = 100 − Σco); co-owners < 100 (#207) */
    if(p.co==="YES"){
      if(!(p.coowners||[]).some(x=>st0(x.name)))
        out.push({lvl:"err", t:L, m:"List the other co-owner(s) of the property.", sec:"hp"});
      if(r.coShare>=100)
        out.push({lvl:"err", t:L, m:"The other co-owners' shares must total less than 100% so your own share is positive.", sec:"hp"});
      /* no interest u/s 24(b) if the assessee's share of a co-owned property is nil (#195) */
      if(r.share===0 && r.hRaw>0)
        out.push({lvl:"err", t:L, m:"You cannot claim interest u/s 24(b) on a co-owned property in which your share is nil.", sec:"hp"});
    }

    /* co-owner / tenant PAN form; co-owner PAN ≠ assessee's PAN (#204) */
    (p.coowners||[]).forEach((x,m)=>{
      if(st0(x.pan) && !PAN_RE.test(st0(x.pan).toUpperCase()))
        out.push({lvl:"err", t:L+", co-owner "+(m+1), m:"The PAN is not in the correct form.", sec:"hp"});
      if(myPan && st0(x.pan).toUpperCase()===myPan)
        out.push({lvl:"err", t:L+", co-owner "+(m+1), m:"A co-owner's PAN cannot be the same as the assessee's PAN.", sec:"hp"});
    });
    (p.tenants||[]).forEach((x,m)=>{
      if(st0(x.pan) && !PAN_RE.test(st0(x.pan).toUpperCase()))
        out.push({lvl:"err", t:L+", tenant "+(m+1), m:"The PAN is not in the correct form.", sec:"hp"});
      /* 194-IB: PAN/Aadhaar of the tenant is mandatory when TDS credit is claimed */
      if(st0(x.pantan) && !st0(x.pan) && !st0(x.aadhaar))
        out.push({lvl:"warn", t:L+", tenant "+(m+1), m:"Furnish the tenant's PAN or Aadhaar when TDS credit is claimed (s.194-IB).", sec:"hp"});
    });

    /* interest u/s 24(b) needs the loan table complete (rule #206) */
    if(r.hRaw>0){
      (p.loans||[]).filter(l=>N(l.interest)).forEach((l,m)=>{
        if(!st0(l.name)||!st0(l.acno)||!st0(l.from)||!ISO(l.dt))
          out.push({lvl:"err", t:L+", loan "+(m+1), m:"Every column of the Section 24(b) loan row is required (lender, name, account no., date of sanction).", sec:"hp"});
      });
    }
  });

  return out;
}

/* ---- register ---------------------------------------------------- */
/* order 6 = HP's 1-based position in FORM.SECTIONS (gen1 bs2 pl3 oi4 bp5 hp6
   cg7 os8 loss9 …). compute() sorts engines by corder||order; this keeps HP
   (an income head) computing before the "loss" section (order 9) so CYLA/BFLA
   can read S.C.hp.income. Screen order is fixed by SCREEN_ORDER, not by this. */
reg({id:"hp", t:"House property", ref:"Schedule HP",
     f:secHp,
     s:()=>{ const C=S.C.hp||{}; if(!(S.hp&&S.hp.on)) return "None";
       return C.income<0 ? "Loss "+CR(-C.income)
            : (C.income ? "Income "+CR(C.income)
                        : ((S.hp.props||[]).length+" property")); },
     eng:engHp, exp:expHp, imp:impHp, chk:chkHp, order:6});
