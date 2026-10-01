/* =====================================================================
   ITR-7 · Section "hp" — Income from house property (Schedule HP)
   Built from books/ITR-7/Schedule_HP.md only (rows 3–48, one property
   block, rules A179–A193/A360/A373/A383/A459/A485/A554/A592) and confirmed
   against the CBDT ITR-7 schema block ScheduleHP (schema §ScheduleHP /
   PropertyDetails / Rentdetails / CoOwners / TenantDetails).
   Structured on forms/ITR-6/src/70_sec_hp.js (the shell idiom: engine /
   screen / export / import / checks) — but every field, formula, enum and
   item-letter is taken from the ITR-7 book, never from ITR-6.

   ITR-7 is the return for TRUSTS, INSTITUTIONS and other bodies (sections
   139(4A)–(4F)). House property is computed head-by-head as for any
   assessee, but two things narrow the sheet (book §§ intro, 8):
     • Owner of the property = Self (SE) / Deemed owner (DO) ONLY — no
       minor / spouse / others.
     • Type of house property = Let Out (Y) / Deemed Let Out (D) ONLY —
       there is NO self-occupied, so the annual value is never nil and the
       full a–j working always runs; the gross rent (1a) is always > 0
       (rule A186).

   ITR-7 LETTERING (differs from ITR-6 — book §2, App. A):
     a AnnualLetableValue       gross rent / lettable value  (typed)
     b RentNotRealized          rent that cannot be realised (typed)
     c LocalTaxes               tax paid to local authorities(typed)
     d TotalUnrealizedAndTax    = 1b + 1c                    (A179)
     e BalanceALV               = 1a − 1d  (annual value)    (A180)
     f ThirtyPercentOfBalance   = 30% of 1e  (std ded 24a)    (A181)
     g IntOnBorwCap             interest u/s 24(b)            (A189)
     h TotalDeduct              = 1f + 1g                    (A182)
     i ArrearsUnrealizedRentRcvd arrears/unrealised recd less 30% (typed)
     j IncomeOfHP               = 1e − 1h + 1i               (A183)
   There is NO "annual value of the property owned (share × 1e)" line and
   NO AnnualOfPropOwned leaf — the 30% deduction bites at 30% of 1e
   directly (book §2 note). The assessee's share only guards the interest
   (A189): interest is admitted only when share% > 0 and 1a > 0.

   LOSS → CYLA: item 3 = Σ1j + item 2 (signed; a loss is negative). If a
   loss, it goes to 2i of Schedule CYLA capped at ₹2,00,000 (A360/A373;
   the CYLA HP-loss column xiv is itself capped at ₹2,00,000, A354), the
   balance remaining carried forward. Published as
   S.C.hp.{total, loss, lossFull, cflExcess, partBTI} for the cyla / cfl /
   tax / fsi seams (see report).
   ===================================================================== */

/* ---- state: S.hp namespace (shape matches the shell's add/commit wiring;
   the shell seeds a new hp property as {type:"S",co:"NO",country:"91",
   owner:"SE",loans:[],coowners:[],tenants:[]} — the "S" is an ITR-2/3
   default that has no meaning on ITR-7; the type dropdown offers only Y/D,
   so it renders unselected, the engine runs the full working regardless,
   export coerces to Y/D and a check flags a missing/invalid type). ---- */
S.hp = S.hp || { on:"", pti:"", props:[] };
if(!S.hp.props) S.hp.props = [];

/* ---- code tables (book App. C) ------------------------------------- */
/* Owner of the Property — enum PropertyOwner : SE / DO only.
   (Schema description reads "Deemed Ownwer" — a source typo; the book /
   utility dropdown reads "Deemed owner"; the code DO is correct.) */
const HP_OWNER=[["SE","Self"],["DO","Deemed owner"]];
/* Is the property co-owned? — enum PropCoOwnedFlg : YES / NO */
const HP_COOWN=[["NO","No"],["YES","Yes"]];
/* Type Of House Property — enum ifLetOut : Y / D only (no self-occupied) */
const HP_TYPE=[["Y","Let Out"],["D","Deemed Let Out"]];
/* Loan taken from — enum LoanTknFrom : B / I */
const HP_LOANFROM=[["B","Bank"],["I","Other than bank"]];
/* State — enum StateCode, 38 entries (book App. C). Unlike ITR-6, codes
   07 (Dadra Nagar and Haveli) and 08 (Daman and Diu) are SEPARATE. */
const HP_STATE=[
  ["01","Andaman And Nicobar Islands"],["02","Andhra Pradesh"],["03","Arunachal Pradesh"],["04","Assam"],
  ["05","Bihar"],["06","Chandigarh"],["07","Dadra Nagar And Haveli"],["08","Daman And Diu"],
  ["09","Delhi"],["10","Goa"],["11","Gujarat"],["12","Haryana"],
  ["13","Himachal Pradesh"],["14","Jammu And Kashmir"],["15","Karnataka"],["16","Kerala"],
  ["17","Lakhswadeep"],["18","Madhya Pradesh"],["19","Maharashtra"],["20","Manipur"],
  ["21","Meghalaya"],["22","Mizoram"],["23","Nagaland"],["24","Odisha"],
  ["25","Puducherry"],["26","Punjab"],["27","Rajasthan"],["28","Sikkim"],
  ["29","Tamilnadu"],["30","Tripura"],["31","Uttar Pradesh"],["32","West Bengal"],
  ["33","Chhatishgarh"],["34","Uttarakhand"],["35","Jharkhand"],["36","Telangana"],
  ["37","Ladakh"],["99","Foreign"]];
const HP_STATE_SET={}; HP_STATE.forEach(x=>HP_STATE_SET[x[0]]=1);
/* Country — enum CountryCode, 250 entries (book App. C, schema order). */
const HP_COUNTRY=[
  ["93","Afghanistan"],["1001","Aland Islands"],["355","Albania"],["213","Algeria"],["684","American Samoa"],
  ["376","Andorra"],["244","Angola"],["1264","Anguilla"],["1010","Antarctica"],["1268","Antigua And Barbuda"],
  ["54","Argentina"],["374","Armenia"],["297","Aruba"],["61","Australia"],["43","Austria"],
  ["994","Azerbaijan"],["1242","Bahamas"],["973","Bahrain"],["880","Bangladesh"],["1246","Barbados"],
  ["375","Belarus"],["32","Belgium"],["501","Belize"],["229","Benin"],["1441","Bermuda"],
  ["975","Bhutan"],["591","Bolivia (Plurinational State Of)"],["1002","Bonaire, Sint Eustatius And Saba"],["387","Bosnia And Herzegovina"],["267","Botswana"],
  ["1003","Bouvet Island"],["55","Brazil"],["1014","British Indian Ocean Territory"],["673","Brunei Darussalam"],["359","Bulgaria"],
  ["226","Burkina Faso"],["257","Burundi"],["238","Cabo Verde"],["855","Cambodia"],["237","Cameroon"],
  ["1","Canada"],["1345","Cayman Islands"],["236","Central African Republic"],["235","Chad"],["56","Chile"],
  ["86","China"],["9","Christmas Island"],["672","Cocos (Keeling) Islands"],["57","Colombia"],["270","Comoros"],
  ["242","Congo"],["243","Congo (Democratic Republic Of The)"],["682","Cook Islands"],["506","Costa Rica"],["225","Cote Divoire"],
  ["385","Croatia"],["53","Cuba"],["1015","Curacao"],["357","Cyprus"],["420","Czechia"],
  ["45","Denmark"],["253","Djibouti"],["1767","Dominica"],["1809","Dominican Republic"],["593","Ecuador"],
  ["20","Egypt"],["503","El Salvador"],["240","Equatorial Guinea"],["291","Eritrea"],["372","Estonia"],
  ["251","Ethiopia"],["500","Falkland Islands (Malvinas)"],["298","Faroe Islands"],["679","Fiji"],["358","Finland"],
  ["33","France"],["594","French Guiana"],["689","French Polynesia"],["1004","French Southern Territories"],["241","Gabon"],
  ["220","Gambia"],["995","Georgia"],["49","Germany"],["233","Ghana"],["350","Gibraltar"],
  ["30","Greece"],["299","Greenland"],["1473","Grenada"],["590","Guadeloupe"],["1671","Guam"],
  ["502","Guatemala"],["1481","Guernsey"],["224","Guinea"],["245","Guinea-Bissau"],["592","Guyana"],
  ["509","Haiti"],["1005","Heard Island And Mcdonald Islands"],["6","Holy See"],["504","Honduras"],["852","Hong Kong"],
  ["36","Hungary"],["354","Iceland"],["91","India"],["62","Indonesia"],["98","Iran (Islamic Republic Of)"],
  ["964","Iraq"],["353","Ireland"],["1624","Isle Of Man"],["972","Israel"],["5","Italy"],
  ["1876","Jamaica"],["81","Japan"],["1534","Jersey"],["962","Jordan"],["7","Kazakhstan"],
  ["254","Kenya"],["686","Kiribati"],["850","Korea (Democratic Peoples Republic Of)"],["82","Korea (Republic Of)"],["965","Kuwait"],
  ["996","Kyrgyzstan"],["856","Lao Peoples Democratic Republic"],["371","Latvia"],["961","Lebanon"],["266","Lesotho"],
  ["231","Liberia"],["218","Libya"],["423","Liechtenstein"],["370","Lithuania"],["352","Luxembourg"],
  ["853","Macao"],["389","Macedonia (The Former Yugoslav Republic Of)"],["261","Madagascar"],["265","Malawi"],["60","Malaysia"],
  ["960","Maldives"],["223","Mali"],["356","Malta"],["692","Marshall Islands"],["596","Martinique"],
  ["222","Mauritania"],["230","Mauritius"],["269","Mayotte"],["52","Mexico"],["691","Micronesia (Federated States Of)"],
  ["373","Moldova (Republic Of)"],["377","Monaco"],["976","Mongolia"],["382","Montenegro"],["1664","Montserrat"],
  ["212","Morocco"],["258","Mozambique"],["95","Myanmar"],["264","Namibia"],["674","Nauru"],
  ["977","Nepal"],["31","Netherlands"],["687","New Caledonia"],["64","New Zealand"],["505","Nicaragua"],
  ["227","Niger"],["234","Nigeria"],["683","Niue"],["15","Norfolk Island"],["1670","Northern Mariana Islands"],
  ["47","Norway"],["968","Oman"],["92","Pakistan"],["680","Palau"],["970","Palestine, State Of"],
  ["507","Panama"],["675","Papua New Guinea"],["595","Paraguay"],["51","Peru"],["63","Philippines"],
  ["1011","Pitcairn"],["48","Poland"],["14","Portugal"],["1787","Puerto Rico"],["974","Qatar"],
  ["262","Reunion"],["40","Romania"],["8","Russian Federation"],["250","Rwanda"],["1006","Saint Barthelemy"],
  ["290","Saint Helena, Ascension And Tristan Da Cunha"],["1869","Saint Kitts And Nevis"],["1758","Saint Lucia"],["1007","Saint Martin (French Part)"],["508","Saint Pierre And Miquelon"],
  ["1784","Saint Vincent And The Grenadines"],["685","Samoa"],["378","San Marino"],["239","Sao Tome And Principe"],["966","Saudi Arabia"],
  ["221","Senegal"],["381","Serbia"],["248","Seychelles"],["232","Sierra Leone"],["65","Singapore"],
  ["1721","Sint Maarten (Dutch Part)"],["421","Slovakia"],["386","Slovenia"],["677","Solomon Islands"],["252","Somalia"],
  ["28","South Africa"],["1008","South Georgia And The South Sandwich Islands"],["211","South Sudan"],["35","Spain"],["94","Sri Lanka"],
  ["249","Sudan"],["597","Suriname"],["1012","Svalbard And Jan Mayen"],["268","Swaziland"],["46","Sweden"],
  ["41","Switzerland"],["963","Syrian Arab Republic"],["886","Taiwan, Province Of China"],["992","Tajikistan"],["255","Tanzania, United Republic Of"],
  ["66","Thailand"],["670","Timor-Leste(East Timor)"],["228","Togo"],["690","Tokelau"],["676","Tonga"],
  ["1868","Trinidad And Tobago"],["216","Tunisia"],["90","Turkey"],["993","Turkmenistan"],["1649","Turks And Caicos Islands"],
  ["688","Tuvalu"],["256","Uganda"],["380","Ukraine"],["971","United Arab Emirates"],["44","United Kingdom Of Great Britain And Northern Ireland"],
  ["2","United States Of America"],["1009","United States Minor Outlying Islands"],["598","Uruguay"],["998","Uzbekistan"],["678","Vanuatu"],
  ["58","Venezuela (Bolivarian Republic Of)"],["84","Viet Nam"],["1284","Virgin Islands (British)"],["1340","Virgin Islands (U.S.)"],["681","Wallis And Futuna"],
  ["1013","Western Sahara"],["967","Yemen"],["260","Zambia"],["263","Zimbabwe"],["9999","Others"]];
const HP_COUNTRY_SET={}; HP_COUNTRY.forEach(x=>HP_COUNTRY_SET[x[0]]=1);

/* ---- engine ------------------------------------------------------ */
/* One property block, exactly as the book's a–j working reads (book §2).
   The share only guards the interest (A189); there is NO share×1e line. */
function engProp(p){
  p = p || {};
  const co = p.co==="YES";
  const coShare = (p.coowners||[]).reduce((s,x)=>s+N(x.share), 0);
  /* AssessePercentShareProp (typed, required — book row 6):
     not co-owned → 100; co-owned → the typed assessee %. */
  const share = co ? N(p.share) : 100;

  const a = R(p.rent);                            /* 1a AnnualLetableValue — typed gross */
  const b = R(p.unreal);                          /* 1b RentNotRealized — typed */
  const c = R(p.taxes);                           /* 1c LocalTaxes — typed */
  const d = R(b + c);                             /* 1d TotalUnrealizedAndTax = 1b+1c (A179) */
  const e = Math.max(0, R(a - d));                /* 1e BalanceALV = 1a−1d (A180) */
  const f = Math.max(0, R(0.30 * e));             /* 1f ThirtyPercentOfBalance = 30% of 1e (A181) */

  /* 1g IntOnBorwCap — interest u/s 24(b), admitted only when share>0 and 1a>0
     (A189). TotalInterestUs24B = Σ loan rows (A192), disclosed as hRaw. */
  const loans = (p.loans||[]).filter(l => N(l.interest));
  const hRaw  = R(loans.reduce((s,l)=>s+N(l.interest), 0));  /* Section24B.TotalInterestUs24B */
  const guard = share > 0 && a > 0;
  const g = guard ? hRaw : 0;
  const barredGuard = !guard && hRaw > 0;

  const h  = R(f + g);                            /* 1h TotalDeduct = 1f+1g (A182) */
  const ar = R(p.arrears);                        /* 1i ArrearsUnrealizedRentRcvd — typed net of 30% */
  const j  = R(e - h + ar);                       /* 1j IncomeOfHP = 1e−1h+1i (A183, signed) */

  return {co, coShare, share, a, b, c, d, e, f, g, hRaw, guard, barredGuard,
          h, ar, j, nLoans:loans.length};
}

/* item 2 — Pass through income/loss from Schedule PTI (book §4; A383/A485).
   The pti section (id "pti") aggregates SchedulePTIDtls[].IncFromHP.NetIncomeLoss;
   its engine is expected to publish that net figure at S.C.pti.hp (signed).
   Guarded read — falls back to the manual H.pti figure until that engine
   has run / been built (integrator seam: see report). */
function hpPTI(){
  const fromSch = RG(S.C, "pti.hp", undefined);
  if(fromSch!==undefined && N(fromSch)!==0) return {val:R(fromSch), sch:true};
  return {val:R(N(S.hp && S.hp.pti)), sch:false};
}

function engHp(){
  const H = S.hp || {};
  const C = S.C.hp = { on:!!H.on, rows:[], sum1j:0, pti:0, ptiFromSch:false,
                       total:0, loss:0, lossFull:0, cflExcess:0, partBTI:0 };
  if(!H.on) return;

  const rows  = (H.props||[]).map((p,idx)=>{ const r=engProp(p); p._=r; p._i=idx; return r; });
  const sum1j = R(rows.reduce((s,r)=>s+r.j, 0));          /* Σ1j across properties */

  const P = hpPTI();
  const pti = P.val;                                      /* item 2 PassThroghIncome */
  const total = R(sum1j + pti);                           /* item 3 = Σ1j + 2 = TotalIncomeChargeableUnHP (signed) */

  C.rows = rows;
  C.sum1j = sum1j;
  C.pti = pti;
  C.ptiFromSch = P.sch;
  C.total = total;                                        /* signed head total (income) */

  /* loss → Schedule CYLA 2i, capped at ₹2,00,000 (A360/A373/A354); the
     balance remaining carries forward under Schedule CFL. */
  C.lossFull  = total < 0 ? R(-total) : 0;                /* full HP loss magnitude (positive) */
  C.loss      = Math.min(200000, C.lossFull);             /* loss available for CYLA set-off (≤2 lakh) */
  C.cflExcess = Math.max(0, R(C.lossFull - 200000));      /* balance remaining → Schedule CFL */
  C.partBTI   = Math.max(0, total);                       /* Part B-TI item = MAX(0, income) */
}

/* ---- renderer ---------------------------------------------------- */
function hpBlock(p, i, ordinal){
  const r = p._ || engProp(p);
  const pre = "hp.props."+i+".", id = "hp"+i;
  const typeLbl = (HP_TYPE.find(t=>t[0]===p.type)||["","—"])[1];
  const status = (st0(p.addr)?typeLbl+" · ":"") + (r.j<0?"loss "+RS(-r.j):RS(r.j));
  let b = "";

  /* --- the property --- */
  b += sub("The property");
  b += row("Address of property", inp(pre+"addr",{max:250}), {req:1, ref:"F4", hint:"do not leave the address blank"});
  b += row("Town / City", inp(pre+"city",{max:50}), {req:1, ref:"G4"});
  b += row("Country", sel(pre+"country", HP_COUNTRY), {req:1, ref:"I4"});
  if((p.country||"91")==="91"){
    b += row("State", sel(pre+"state", HP_STATE), {req:1, ref:"H4"});
    b += row("PIN Code", inp(pre+"pin",{max:6}), {ref:"J4", hint:"100000–999999"});
  } else {
    b += row("State", sel(pre+"state", [["99","Foreign"]], {blank:false}), {req:1, ref:"H4"});
    b += row("Zip Code", inp(pre+"zip",{max:8}), {ref:"K4", hint:"for a property abroad"});
  }

  /* --- ownership (Self / Deemed owner only) --- */
  b += sub("Ownership");
  b += row("Owner of the Property", sel(pre+"owner", HP_OWNER), {req:1, ref:"F6",
           hint:"a body can own only as itself or as a deemed owner"});
  b += row("Is the property co-owned?", sel(pre+"co", HP_COOWN, {blank:false}), {req:1, ref:"H6"});
  if(p.co==="YES"){
    b += row("Assessee's percentage of share in the property (%)", inp(pre+"share",{n:1}),
             {req:1, ref:"J6", hint:"the body's own share; the assessee's + co-owners' shares must total 100%"});
    b += grid(pre.slice(0,-1)+".coowners",[
        {k:"name",h:"Name of Co-owner(s)",t:"txt",w:"auto",req:1,max:125},
        {k:"pan",h:"PAN of Co-owner(s)",t:"txt",w:"120px",max:10},
        {k:"aadhaar",h:"Aadhaar of Co-owner(s)",t:"txt",w:"150px",max:12},
        {k:"share",h:"Percentage share of co-owner(s) %",t:"num",w:"170px"}],
      p.coowners||[], {min:"780px", empty:"No co-owner listed.", add:"Add a co-owner",
        foot:[{l:1,v:"Shares — assessee "+r.share+"% + co-owners "+r.coShare+"%",span:3},{v:r.share+r.coShare}]});
    if(Math.abs(r.share+r.coShare-100)>0.01)
      b += note("The assessee's share + the co-owners' shares add to "+(r.share+r.coShare)+"%, not 100%.","warn");
  } else {
    b += row("Assessee's percentage of share in the property (%)", cell(r.share),
             {ref:"J6", cls:"tot", hint:"not co-owned — 100%"});
  }

  /* --- type (Let Out / Deemed Let Out only) --- */
  b += sub("Type of house property");
  b += row("Type of House property", sel(pre+"type", HP_TYPE), {req:1, ref:"F16",
           hint:"a trust/institution has no self-occupied house — Let Out or Deemed Let Out only"});
  b += grid(pre.slice(0,-1)+".tenants",[
      {k:"name",h:"Name(s) of Tenant(s) (if let out)",t:"txt",w:"auto",max:125},
      {k:"pan",h:"PAN of Tenant(s) (if available)",t:"txt",w:"120px",max:10},
      {k:"aadhaar",h:"Aadhaar of Tenant(s)",t:"txt",w:"150px",max:12},
      {k:"pantan",h:"PAN / TAN of Tenant(s) (if TDS credit is claimed)",t:"txt",w:"230px",max:10}],
    p.tenants||[], {min:"900px", empty:"No tenant listed.", add:"Add a tenant"});
  b += note("Furnishing the PAN of the tenant is mandatory if tax is deducted u/s 194-IB; furnishing the "+
    "TAN of the tenant is mandatory if tax is deducted u/s 194-I (sheet note, row 48).");

  /* --- the working a–j (always full — no self-occupied branch) --- */
  b += sub("Computation of income from the property");
  b += row("a · Gross rent received or receivable or lettable value", inp(pre+"rent",{n:1}),
           {req:1, ref:"1a", hint:"higher of the two if let out for the whole year — a let-out / deemed let-out property cannot have nil rent"});
  b += row("b · The amount of rent which cannot be realized", inp(pre+"unreal",{n:1}), {ref:"1b", hint:"cannot exceed 1a"});
  b += row("c · Tax paid to local authorities", inp(pre+"taxes",{n:1}), {ref:"1c"});
  b += row("d · Total (1b + 1c)", cell(r.d), {ref:"1d", cls:"tot"});
  b += row("e · Annual value (1a − 1d)", cell(r.e), {ref:"1e", cls:"tot"});
  b += row("f · 30% of 1e", cell(r.f), {ref:"1f", cls:"tot", hint:"standard deduction u/s 24(a)"});

  /* --- 24(b) loan table (inside the block) — feeds item g --- */
  b += sub("g · Interest payable on borrowed capital — Section 24(b)");
  b += note("One row per loan; every column is required on a filled row. The interest sums into "+
    "Total Interest u/s 24(b) and into item g. Interest is admitted only when the assessee's share > 0 "+
    "and the annual value (1a) > 0 (rule A189).");
  b += grid(pre.slice(0,-1)+".loans",[
      {k:"from",h:"Loan taken from",t:"sel",w:"180px",req:1,opts:HP_LOANFROM},
      {k:"name",h:"Name of the bank / institution / person",t:"txt",w:"auto",req:1,max:125},
      {k:"acno",h:"Loan Account number of the Bank / Institution",t:"txt",w:"210px",req:1,max:20},
      {k:"dt",h:"Date of sanction of loan",t:"date",w:"150px",req:1},
      {k:"amt",h:"Total amount of loan",t:"num",w:"150px",req:1},
      {k:"os",h:"Loan outstanding as on 31-03-2026",t:"num",w:"180px",req:1},
      {k:"interest",h:"Interest on Borrowed capital u/s 24(b)",t:"num",w:"180px",req:1}],
    p.loans||[], {min:"1370px", empty:"No loan.", add:"Add a loan",
      foot:[{l:1,v:"Total Interest on borrowed capital u/s 24(b)",span:6},{v:r.hRaw}]});
  let gHint = "";
  if(!r.guard && r.hRaw>0) gHint = "not admissible — the assessee's share is nil or the annual value (1a) is nil";
  b += row("g · Interest payable on borrowed capital", cell(r.g), {ref:"1g", cls:"tot", hint:gHint});

  b += row("h · Total (1f + 1g)", cell(r.h), {ref:"1h", cls:"tot"});
  b += row("i · Arrears / Unrealized Rent received during the year, less 30%", inp(pre+"arrears",{n:1}),
           {ref:"1i", hint:"enter the amount already net of the 30% deduction"});
  b += row("j · Income from house property "+ordinal+" (1e − 1h + 1i)", cell(r.j), {ref:"1j", cls:"grand"});

  return blk(id, "Property "+ordinal+(st0(p.addr)?" — "+st0(p.addr):""), status, b, "hp.props."+i);
}

function secHp(){
  const C = S.C.hp || {};
  let h = "";
  h += row("Is there income or a loss from house property?",
           sel("hp.on",[["","No"],["1","Yes"]],{blank:false}), {req:1, ref:"Schedule HP"});
  if(!S.hp.on) return h;

  h += note("One block per property, unlimited. Type is Let Out or Deemed Let Out only — a trust/institution "+
    "has no self-occupied house, so the full a–j working always runs and the gross rent (1a) must be more than "+
    "nil. The Section 24(b) loan table sits inside each block and sums into item g; the 30% standard deduction "+
    "(item f) is 30% of the annual value (1e) directly — there is no 'share × annual value' line on ITR-7.");

  (S.hp.props||[]).forEach((p,i)=>h += hpBlock(p, i, i+1));
  h += '<button class="add" data-addprop="1">Add a property</button>';

  h += sub("Across all properties");
  h += row("Σ1j · Income from all properties", cell(C.sum1j), {cls:"tot"});
  if(C.ptiFromSch)
    h += row("2 · Pass through income / Loss — from Schedule PTI", cell(C.pti),
             {ref:"2", hint:"the house-property row(s) of Schedule PTI"});
  else
    h += row("2 · Pass through income / Loss (if any)", inp("hp.pti",{n:1}),
             {ref:"2", hint:"from Schedule PTI — leave blank if none"});
  h += row('3 · Income under the head "Income from house property" (Σ1j + 2)', cell(C.total),
           {ref:"3", cls:"grand",
            hint:C.total<0?"a loss — to 2i of Schedule CYLA, the set-off capped at ₹2,00,000; the balance remaining carries to CFL":""});
  if(C.total<0){
    h += row("Loss allowed to be set off this year (capped at ₹2,00,000) → CYLA 2i", cell(-C.loss), {cls:"tot"});
    if(C.cflExcess>0)
      h += row("Loss remaining, carried forward under Schedule CFL", cell(-C.cflExcess), {cls:"tot"});
  }
  return h;
}

/* ---- export ------------------------------------------------------ */
function expHp(j){
  const C = S.C.hp || {};
  if(!(S.hp && S.hp.on && (S.hp.props||[]).length)) return;

  const items = (S.hp.props||[]).map((p,i)=>{
    const r = p._ || engProp(p);
    const inIndia = (p.country||"91")==="91";
    const ad = {
      AddrDetail:(sv(p.addr)||"NA").slice(0,250),
      CityOrTownOrDistrict:(sv(p.city)||"NA").slice(0,50),
      StateCode: inIndia ? (HP_STATE_SET[st0(p.state)]?st0(p.state):"19") : "99",
      CountryCode:(HP_COUNTRY_SET[st0(p.country)]?st0(p.country):"91").slice(0,4)
    };
    if(inIndia){ if(/^[1-9]\d{5}$/.test(st0(p.pin))) ad.PinCode=parseInt(p.pin,10); }
    else if(sv(p.zip)) ad.ZipCode=sv(p.zip).slice(0,8);

    /* Rentdetails — every schema-required leaf written, even when zero
       (direct literal, not put(), so 0 is retained). */
    const rd = {
      AnnualLetableValue:n0(r.a),               /* 1a */
      RentNotRealized:n0(r.b),                  /* 1b */
      LocalTaxes:n0(r.c),                       /* 1c */
      TotalUnrealizedAndTax:n0(r.d),            /* 1d */
      BalanceALV:n0(r.e),                       /* 1e */
      ThirtyPercentOfBalance:n0(r.f),           /* 1f */
      IntOnBorwCap:n0(r.g),                     /* 1g */
      TotalDeduct:n0(r.h),                      /* 1h */
      IncomeOfHP:sg(r.j)                        /* 1j (signed) */
    };
    if(r.ar) rd.ArrearsUnrealizedRentRcvd=sg(r.ar);   /* 1i — optional, write when non-zero */

    const ln = (p.loans||[]).filter(l=>N(l.interest));
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
        TotalInterestUs24B:n0(r.hRaw)             /* Σ rows (A192) */
      };
    }

    const it = {
      HPSNo:i+1,
      AddressDetailWithZipCode:ad,
      PropertyOwner:(p.owner==="DO"?"DO":"SE"),
      PropCoOwnedFlg:(p.co==="YES"?"YES":"NO"),
      AssessePercentShareProp:r.share,            /* required number */
      ifLetOut:(p.type==="D"?"D":"Y"),            /* Y/D only; coerce anything else to Y */
      Rentdetails:rd
    };

    const co = (p.coowners||[]).filter(x=>st0(x.name));
    if(p.co==="YES" && co.length) it.CoOwners=co.map((x,k)=>{
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

  j.ScheduleHP = { PropertyDetails:items, TotalIncomeChargeableUnHP:sg(C.total) };
  if(C.pti) j.ScheduleHP.PassThroghIncome=sg(C.pti);
}

/* ---- import ------------------------------------------------------ */
function impHp(I){
  if(!(I && I.ScheduleHP)) return [];
  const hp = I.ScheduleHP;
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
        share:nz(p.AssessePercentShareProp),
        coowners:(p.CoOwners||[]).map(c=>({name:c.NameCoOwner||"", pan:c.PAN_CoOwner||"",
          aadhaar:c.Aadhaar_CoOwner||"", share:nz(c.PercentShareProperty)})),
        type:p.ifLetOut==="D"?"D":"Y",
        tenants:(p.TenantDetails||[]).map(t=>({name:t.NameofTenant||"", pan:t.PANofTenant||"",
          aadhaar:t.AadhaarofTenant||"", pantan:t.PANTANofTenant||""})),
        rent:nz(rd.AnnualLetableValue), unreal:nz(rd.RentNotRealized), taxes:nz(rd.LocalTaxes),
        arrears:nz(rd.ArrearsUnrealizedRentRcvd),
        loans:(RG(rd,"Section24B.Section24BDtls",[])||[]).map(l=>({
          from:l.LoanTknFrom==="I"?"I":"B", name:l.BankOrInstnName||"", acno:l.LoanAccNoOfBankOrInstnRefNo||"",
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

    /* required address */
    if(!st0(p.addr)) out.push({lvl:"err", t:L, m:"The address of the property is required.", sec:"hp"});
    if(!st0(p.city)) out.push({lvl:"err", t:L, m:"Town / City is required.", sec:"hp"});
    if((p.country||"91")==="91" && !HP_STATE_SET[st0(p.state)])
      out.push({lvl:"err", t:L, m:"State is required for a property in India.", sec:"hp"});
    /* owner Self / Deemed owner only */
    if(p.owner!=="SE" && p.owner!=="DO")
      out.push({lvl:"err", t:L, m:"Select the owner of the property — Self or Deemed owner.", sec:"hp"});
    /* type Let Out / Deemed Let Out only */
    if(p.type!=="Y" && p.type!=="D")
      out.push({lvl:"err", t:L, m:"Select the type of house property — Let Out or Deemed Let Out (there is no self-occupied on ITR-7).", sec:"hp"});

    /* gross rent must be > 0 for a let-out / deemed let-out property (A186) */
    if(!(N(p.rent)>0))
      out.push({lvl:"err", t:L, m:"A let-out or deemed let-out property needs a gross rent / lettable value (1a) greater than nil.", sec:"hp"});
    /* local tax not allowed if 1a is zero/null (A185) */
    if(N(p.taxes)>0 && !(N(p.rent)>0))
      out.push({lvl:"warn", t:L, m:"Tax paid to local authorities (1c) cannot be claimed when the gross rent (1a) is nil.", sec:"hp"});
    /* unrealised rent cannot exceed the gross rent */
    if(N(p.unreal) > N(p.rent))
      out.push({lvl:"warn", t:L, m:"The amount of rent that cannot be realised (1b) cannot exceed the gross rent (1a).", sec:"hp"});

    /* co-ownership: shares total 100 (A188); PAN or Aadhaar per co-owner;
       co-owner PAN ≠ assessee PAN (A190); assessee share > 0 to claim interest (A189) */
    if(p.co==="YES"){
      if(!(N(p.share)>0))
        out.push({lvl:"err", t:L, m:"Enter the assessee's percentage of share in the co-owned property.", sec:"hp"});
      if(!(p.coowners||[]).some(x=>st0(x.name)))
        out.push({lvl:"err", t:L, m:"List the other co-owner(s) of the property.", sec:"hp"});
      if(Math.abs(r.share+r.coShare-100)>0.01)
        out.push({lvl:"err", t:L, m:"The assessee's share plus the co-owners' shares must total 100%.", sec:"hp"});
      (p.coowners||[]).forEach((x,m)=>{
        const CL = L+", co-owner "+(m+1);
        if(!st0(x.name))
          out.push({lvl:"err", t:CL, m:"The co-owner's name is required.", sec:"hp"});
        if(!PAN_RE.test(st0(x.pan).toUpperCase()) && !AADH.test(st0(x.aadhaar)))
          out.push({lvl:"warn", t:CL, m:"The PAN or Aadhaar of the co-owner should be provided.", sec:"hp"});
        if(st0(x.pan) && !PAN_RE.test(st0(x.pan).toUpperCase()))
          out.push({lvl:"err", t:CL, m:"The PAN is not in the correct form.", sec:"hp"});
        if(myPan && st0(x.pan).toUpperCase()===myPan)
          out.push({lvl:"err", t:CL, m:"A co-owner's PAN cannot be the same as the assessee's own PAN.", sec:"hp"});
        if(N(x.share)>=100)
          out.push({lvl:"err", t:CL, m:"Each co-owner's share must be less than 100%.", sec:"hp"});
      });
      if(r.share===0 && r.hRaw>0)
        out.push({lvl:"err", t:L, m:"Interest u/s 24(b) cannot be claimed on a co-owned property in which the assessee's share is nil (rule A189).", sec:"hp"});
    }

    /* tenant PAN form */
    (p.tenants||[]).forEach((x,m)=>{
      if(st0(x.pan) && !PAN_RE.test(st0(x.pan).toUpperCase()))
        out.push({lvl:"err", t:L+", tenant "+(m+1), m:"The PAN is not in the correct form.", sec:"hp"});
    });

    /* interest not admissible when share is nil or the annual value (1a) is nil (A189) */
    if(r.barredGuard)
      out.push({lvl:"warn", t:L, m:"Interest u/s 24(b) is admitted only when the assessee's share > 0 and the annual value (1a) > 0; it has been set to nil for this property.", sec:"hp"});

    /* every column of a 24(b) loan row required to claim the deduction (A191/A193) */
    (p.loans||[]).filter(l=>N(l.interest)).forEach((l,m)=>{
      if(!st0(l.from)||!st0(l.name)||!st0(l.acno)||!ISO(l.dt)||!(N(l.amt)>0)||!(N(l.os)>=0))
        out.push({lvl:"err", t:L+", loan "+(m+1), m:"Every column of the Section 24(b) loan row is required (lender, name, account no., date of sanction, total loan, amount outstanding).", sec:"hp"});
    });
  });

  return out;
}

/* ---- register ---------------------------------------------------- */
reg({id:"hp", t:"Income from house property", ref:"Schedule HP",
     f:secHp,
     s:()=>{ const C=S.C.hp||{}; if(!(S.hp&&S.hp.on)) return "None";
       return C.total<0 ? "Loss "+CR(-C.total)
            : (C.total ? "Income "+CR(C.total)
                       : ((S.hp.props||[]).length+" property")); },
     eng:engHp, exp:expHp, imp:impHp, chk:chkHp, order:40, corder:40});
