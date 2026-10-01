/* =====================================================================
   ITR-6 · Section "hp" — House property (Schedule HP)
   Built from books/ITR-6/HOUSE_PROPERTY.md only (rows 3–76, rules
   A175–A194/A198/A503/A526/A704/A750, schema ScheduleHP §12).
   Structured on forms/ITR-3/src/70_sec_hp.js (shell idiom / engine /
   screen / export / import / checks pattern) — but every field, formula,
   enum and item-number is taken from the ITR-6 book, never from ITR-3.

   ITR-6 is the COMPANY return, so two things drive the whole schedule
   (book §§ intro, 8, 9):
     • Owner of the property = Self (SE) / Deemed Owner (DO) ONLY —
       no minor / spouse / others, no "specify" field.
     • Type of house property = Let Out (Y) / Deemed Let Out (D) ONLY —
       there is NO self-occupied on a company, so section 23(2)'s nil
       annual value never applies: the full a–k working ALWAYS runs and
       the gross rent (1a) is always required > 0 (A181).

   REGIME BAR — 115BAB (not 115BAC): where an individual's new regime
   disallows the HP working, a company that has opted for the
   manufacturing-company concessional rate u/s 115BAB has BOTH the 30%
   standard deduction u/s 24(a) (item 1g, rule A187) AND the interest
   u/s 24(b) (item 1h, rule A188) disallowed. Driven off the chosen
   concessional section (utility helper P22 = MID(sheet1.ReturnFileSec,1,6)
   == "115BAB"; canonical schema source FilingStatus.Section115BA /
   Section115CurrAY == "115BAB"; Tax sheet Check_115BA). See hpBAB().

   LOSS CAP — s.71(3A): the head loss is capped at ₹2,00,000 on the
   helper P-column (book §3): P70 → 2i of Schedule CYLA (A503/A526),
   P71 (excess) → Schedule CFL. Published as S.C.hp.{cyla2i,cflExcess}.

   CROSS-SECTION PUBLISH: S.C.hp.income = item 3 = Σ1k + item 2 (signed;
   a loss is negative). Consumed by the "loss" engine for Schedule CYLA
   (2i, capped) and by the "tax" section for Part B-TI item 1
   (= MAX(0, income), A750) and Schedule FSI (A704).
   CROSS-SECTION CONSUME: S.C.other.pti (Schedule PTI → item 2, A186);
   the 115BAB flag (see hpBAB()).
   ===================================================================== */

/* ---- state: S.hp namespace (shape matches the shell's add/commit wiring;
   the shell seeds a new hp property as {type:"S",co:"NO",country:"91",
   owner:"SE",...} — the "S" is an ITR-2/3 default that has no meaning on
   ITR-6; the type dropdown offers only Y/D so it renders unselected, the
   engine runs the full working regardless, export coerces to Y/D and a
   check flags a missing/invalid type). --- */
S.hp = S.hp || { on:"", pti:"", props:[] };
if(!S.hp.props) S.hp.props = [];

/* SEED shapes for the shell's generic add-handler (documentary; the shell
   keeps its own seed map for hp.props / .loans / .coowners / .tenants). */
SEED.coowners = SEED.coowners || {};
SEED.tenants  = SEED.tenants  || {};

/* ---- code tables (book §10) ---------------------------------------- */
/* Owner of the Property — enum PropertyOwner : SE/DO only.
   (Schema description reads "Deemed Ownwer" — a source typo; the utility
   dropdown reads "Deemed Owner"; the code DO is correct — book §10/§12.) */
const HP_OWNER=[["SE","Self"],["DO","Deemed Owner"]];
/* Is the property co-owned? — enum PropCoOwnedFlg : YES/NO */
const HP_COOWN=[["NO","No"],["YES","Yes"]];
/* Type Of House Property? — enum ifLetOut : Y/D only (no self-occupied) */
const HP_TYPE=[["Y","Let Out"],["D","Deemed Let Out"]];
/* Loan taken from — enum LoanTknFrom : B/I. (Schema desc garbled —
   [["B","Bank, I: Other than Bank"],["I","Other than Bank"]]: the B row's
   description has the I row's text merged in; the utility dropdown is clean
   and the codes B/I are correct — book §12 inconsistency 1.) */
const HP_LOANFROM=[["B","Bank"],["I","Other than Bank"]];
/* State — enum StateCode, 38 entries (book §10): 37 states/UTs + 99-Foreign.
   Note there is NO code 08 (07 is the merged Dadra/Daman UT). */
const HP_STATE=[["01","Andaman and Nicobar islands"],["02","Andhra Pradesh"],
  ["03","Arunachal Pradesh"],["04","Assam"],["05","Bihar"],["06","Chandigarh"],
  ["07","The Dadra And Nagar Haveli And Daman And Diu"],["09","Delhi"],["10","Goa"],
  ["11","Gujarat"],["12","Haryana"],["13","Himachal Pradesh"],["14","Jammu and Kashmir"],
  ["15","Karnataka"],["16","Kerala"],["17","Lakshadweep"],["18","Madhya Pradesh"],
  ["19","Maharashtra"],["20","Manipur"],["21","Meghalaya"],["22","Mizoram"],
  ["23","Nagaland"],["24","Odisha"],["25","Puducherry"],["26","Punjab"],["27","Rajasthan"],
  ["28","Sikkim"],["29","Tamil Nadu"],["30","Tripura"],["31","Uttar Pradesh"],
  ["32","West Bengal"],["33","Chattisgarh"],["34","Uttarakhand"],["35","Jharkhand"],
  ["36","Telangana"],["37","Ladakh"],["99","Foreign"]];
const HP_STATE_SET={}; HP_STATE.forEach(x=>HP_STATE_SET[x[0]]=1);
/* Country — enum CountryCode, 250 codes (book §10). The code set is the
   CBDT standard reference DB and is byte-identical to the codes read for
   ITR-3 (verified code-by-code); only the codes are exported/validated, so
   the shared label list is reused — no ITR-6 number is taken from ITR-3. */
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

/* ---- 115BAB regime detector -------------------------------------------
   The utility drives the 24(a)/24(b) bar off the chosen concessional
   section (P22 = MID(sheet1.ReturnFileSec,1,6) == "115BAB"). The canonical
   schema source is PartA_GEN1.FilingStatus.Section115BA (opted earlier) /
   Section115CurrAY (opting this year) == "115BAB", surfaced on the Tax
   sheet as Check_115BA. The "who" (Part A-General) and "tax" builders own
   those fields and are built in parallel, so this read is guarded across
   the likely publish points and defaults to FALSE (the full working) when
   the flag is absent. Integrator seam: point this at whatever canonical
   flag the who/tax engines publish (see report). */
function hpBAB(){
  try{
    var C = S.C || {};
    if(C.opt115==="115BAB" || C.regimeSec==="115BAB") return true;
    if(C.tax && (C.tax.sec115==="115BAB" || C.tax.check115BA==="115BAB" || C.tax.concSec==="115BAB")) return true;
    if(C.who && (C.who.sec115==="115BAB" || C.who.concSec==="115BAB")) return true;
    var w = S.who || {};
    if(st0(w.sec115)==="115BAB" || st0(w.sec115CurrAY)==="115BAB" ||
       st0(w.concSec)==="115BAB" || st0(w.optSec)==="115BAB") return true;
    var f = S.fs || {};
    if(st0(f.sec115)==="115BAB" || st0(f.conc)==="115BAB") return true;
  }catch(e){}
  return false;
}

/* ---- engine ------------------------------------------------------ */
/* One property block a–k, exactly as the book's cell formulas read (§2).
   `bab` = the company has opted 115BAB → 24(a) (g) and 24(b) (h) disallowed. */
function engProp(p, bab){
  p = p || {};
  const co = p.co==="YES";
  const coShare = (p.coowners||[]).reduce((s,x)=>s+N(x.share), 0);
  /* assessee's share I7 (computed, not typed):
     = IF(co="Y", 100 − Σ co-owners' shares, IF(co="N", 100, 0))  (book §2) */
  let share;
  if(co)              share = Math.max(0, R(100 - coShare));
  else if(p.co==="NO") share = 100;
  else                 share = 0;

  const a = R(p.rent);                            /* 1a AnnualLetableValue — typed gross (full) */
  const b = R(p.unreal);                          /* 1b RentNotRealized — typed */
  const c = R(p.taxes);                           /* 1c LocalTaxes — typed */
  const d = R(b + c);                             /* 1d TotalUnrealizedAndTax [J21]=SUM(J19:J20) */
  const e = Math.max(0, R(a - d));                /* 1e BalanceALV [L22]=MAX(0,L18−J21) */
  const f = Math.max(0, R((share/100) * e));      /* 1f AnnualOfPropOwned [L23]=MAX(0,ROUND(L22×I7/100,0)) */
  /* 1g ThirtyPercentOfBalance [J24]=MAX(ROUND(0.3×1f,0),0) — 24(a); 0 under 115BAB (A187) */
  const g = bab ? 0 : Math.max(0, R(0.30 * f));

  /* 1h IntOnBorwCap [J25]=MAX(0, IF(AND(share>0, 1a>0), Σ24(b) interest, 0)) — A178;
     0 under 115BAB (A188). TotalInterestUs24B (K33)=Σ rows (A191), disclosed as hRaw. */
  const loans = (p.loans||[]).filter(l => N(l.interest));
  const hRaw  = R(loans.reduce((s,l)=>s+N(l.interest), 0));   /* Section24B.TotalInterestUs24B */
  const guard = share > 0 && a > 0;
  let h = 0, barredBAB = false, barredGuard = false;
  if(bab){ h = 0; if(hRaw>0) barredBAB = true; }              /* 115BAB — interest disallowed */
  else if(guard){ h = hRaw; }
  else { h = 0; if(hRaw>0) barredGuard = true; }              /* share 0 or ALV nil — interest not admissible */

  const i = R(g + h);                             /* 1i TotalDeduct [L34]=SUM(J24:J25) */
  const j = R(p.arrears);                         /* 1j ArrearsUnrealizedRentRcvd — typed net of 30% */
  const k = R(f - i + j);                         /* 1k IncomeOfHP [L36]=L23−L34+L35 (signed) */

  return {co, coShare, share, a, b, c, d, e, f, g, hRaw, h, guard, barredBAB, barredGuard,
          i, j, k, nLoans:loans.length};
}

function engHp(){
  const H   = S.hp || {};
  const bab = hpBAB();
  const C = S.C.hp = { income:0, on:!!H.on, rows:[], sum1k:0, pti:0, ptiFromSch:false,
                       bab:bab, cyla2i:0, cflExcess:0, partBTI1:0, barred:0 };
  if(!H.on) return;

  const rows  = (H.props||[]).map((p,idx)=>{ const r=engProp(p,bab); p._=r; p._i=idx; return r; });
  const sum1k = R(rows.reduce((s,r)=>s+r.k, 0));           /* Σ1k */

  /* item 2 — Pass through income/loss from Schedule PTI (A186). The "other"
     section computes S.C.other.pti (screen order after HP); guarded read —
     falls back to the manual figure H.pti until that engine has run. */
  const oth = S.C.other || {};
  const ptiFromSch = (oth.pti||[]).reduce((s,x)=>s+N((x.hp||{}).net), 0);
  const usedSch = Math.abs(ptiFromSch) > 0;
  const pti = R(usedSch ? ptiFromSch : N(H.pti));          /* PassThroghIncome */

  const income = R(sum1k + pti);                           /* item 3 = Σ1k + 2 = TotalIncomeChargeableUnHP */

  C.rows = rows;
  C.sum1k = sum1k;
  C.pti = pti;
  C.ptiFromSch = usedSch;
  C.income = income;                                       /* signed head total for CYLA/PartB-TI/FSI roll-up */

  /* helper P-column — s.71(3A) ₹2,00,000 loss cap (book §3) */
  C.cyla2i    = income < 0 ? Math.max(income, -200000) : 0;   /* P70 → 2i of Schedule CYLA (signed, ≤0) */
  C.cflExcess = Math.max(0, R(-income - 200000));            /* P71 → Schedule CFL (positive) */
  C.partBTI1  = Math.max(0, income);                        /* Part B-TI item 1 = MAX(0, income) (A750) */
  C.barred    = R(rows.reduce((s,r)=>s+(r.barredBAB?r.hRaw:0), 0));
}

/* ---- renderer ---------------------------------------------------- */
function hpBlock(p, i, ordinal, bab){
  const r = p._ || engProp(p, bab);
  const pre = "hp.props."+i+".", id = "hp"+i;
  const typeLbl = (HP_TYPE.find(t=>t[0]===p.type)||["","—"])[1];
  const status = (st0(p.addr)?typeLbl+" · ":"") + (r.k<0?"loss "+RS(-r.k):RS(r.k));
  let b = "";

  /* --- the property --- */
  b += sub("The property");
  b += row("Address of property", inp(pre+"addr",{max:200}), {req:1, ref:"F4", hint:"NOTE: do not leave the address blank"});
  b += row("Town / City", inp(pre+"city",{max:50}), {req:1, ref:"G4"});
  b += row("Country", sel(pre+"country", HP_COUNTRY), {req:1, ref:"I4"});
  if((p.country||"91")==="91"){
    b += row("State", sel(pre+"state", HP_STATE), {req:1, ref:"H4"});
    b += row("PIN Code", inp(pre+"pin",{max:6}), {req:1, ref:"J4", hint:"100000–999999"});
  } else {
    b += row("State", sel(pre+"state", [["99","Foreign"]], {blank:false}), {req:1, ref:"H4"});
    b += row("Zip Code", inp(pre+"zip",{max:8}), {ref:"K4", hint:"for property abroad"});
  }

  /* --- ownership (Self / Deemed Owner only) --- */
  b += sub("Ownership");
  b += row("Owner of the Property", sel(pre+"owner", HP_OWNER), {req:1, ref:"F6",
           hint:"a company can own only as itself or as a deemed owner"});
  b += row("Is the property co-owned?", sel(pre+"co", HP_COOWN, {blank:false}), {req:1, ref:"I6"});
  b += row("Assessee's percentage of share in the property (%)", cell(r.share),
           {ref:"I7", cls:"tot",
            hint:p.co==="YES"?"computed = 100 − co-owners' shares":"not co-owned — 100%"});
  if(p.co==="YES"){
    b += grid(pre.slice(0,-1)+".coowners",[
        {k:"name",h:"Name of other co-owner(s)",t:"txt",w:"auto",req:1,max:125},
        {k:"pan",h:"PAN of other co-owner(s)",t:"txt",w:"120px",max:10},
        {k:"aadhaar",h:"Aadhaar of other co-owner(s)",t:"txt",w:"140px",max:12},
        {k:"share",h:"Percentage share of co-owner(s) %",t:"num",w:"160px"}],
      p.coowners||[], {min:"760px", empty:"No co-owner listed.", add:"Add a co-owner",
        foot:[{l:1,v:"Shares — yours "+r.share+"% + co-owners "+r.coShare+"%",span:3},{v:r.share+r.coShare}]});
    if(Math.abs(r.share+r.coShare-100)>0.01)
      b += note("The assessee's share + co-owners' shares add to "+(r.share+r.coShare)+"%, not 100%.","warn");
  }

  /* --- type (Let Out / Deemed Let Out only) --- */
  b += sub("Type of house property");
  b += row("Type of House property", sel(pre+"type", HP_TYPE), {req:1, ref:"F15",
           hint:"a company has no self-occupied house — Let Out or Deemed Let Out only"});
  b += grid(pre.slice(0,-1)+".tenants",[
      {k:"name",h:"Name(s) of Tenant(s) (if let out)",t:"txt",w:"auto",max:125},
      {k:"pan",h:"PAN of Tenant(s) (if available)",t:"txt",w:"120px",max:10},
      {k:"aadhaar",h:"Aadhaar of Tenant(s) (if available)",t:"txt",w:"140px",max:12},
      {k:"pantan",h:"PAN / TAN of Tenant(s) (if TDS credit is claimed)",t:"txt",w:"220px",max:10}],
    p.tenants||[], {min:"880px", empty:"No tenant listed.", add:"Add a tenant"});
  b += note("Furnishing PAN/Aadhaar of the tenant is mandatory if tax is deducted u/s 194-IB; "+
    "furnishing the TAN of the tenant is mandatory if tax is deducted u/s 194-I (sheet note, row 76).");

  /* --- the working a–k (always full — no self-occupied branch) --- */
  b += sub("Computation of income from the property");
  b += row("a · Gross rent received or receivable or lettable value", inp(pre+"rent",{n:1}),
           {req:1, ref:"1a", hint:"in full — a let-out / deemed let-out property cannot have nil rent; your share is applied at f"});
  b += row("b · The amount of rent which cannot be realized", inp(pre+"unreal",{n:1}), {ref:"1b", hint:"cannot exceed 1a"});
  b += row("c · Tax paid to local authorities", inp(pre+"taxes",{n:1}), {ref:"1c"});
  b += row("d · Total (1b + 1c)", cell(r.d), {ref:"1d", cls:"tot"});
  b += row("e · Annual value (1a − 1d)", cell(r.e), {ref:"1e", cls:"tot"});
  b += row("f · Annual value of the property owned (own share × 1e)", cell(r.f),
           {ref:"1f", cls:"tot", hint:r.share<100?r.share+"% of "+RS(r.e):""});
  if(bab){
    b += note("Section 115BAB — the company has opted for the manufacturing concessional rate, so the "+
      "30% standard deduction u/s 24(a) (1g) and the interest u/s 24(b) (1h) are both disallowed "+
      "(rules A187 / A188).","stop");
    b += row("g · 30% of 1f", cell(0), {ref:"1g", cls:"tot", hint:"disallowed u/s 115BAB (24a)"});
  } else {
    b += row("g · 30% of 1f", cell(r.g), {ref:"1g", cls:"tot"});
  }

  /* --- 24(b) loan table (inside the block) --- */
  b += sub("h · Interest payable on borrowed capital — Section 24(b)");
  b += note("One row per loan; every column is required on a filled row. The interest sums into "+
    "Total Interest u/s 24(b) and, unless disallowed, into item h. Interest is admitted only when the "+
    "assessee's share > 0 and the annual value (1a) > 0.");
  b += grid(pre.slice(0,-1)+".loans",[
      {k:"from",h:"Loan taken from",t:"sel",w:"170px",req:1,opts:HP_LOANFROM},
      {k:"name",h:"Name of the bank / institution / person",t:"txt",w:"auto",req:1,max:125},
      {k:"acno",h:"Loan Account number of the Bank / Institution",t:"txt",w:"200px",req:1,max:25},
      {k:"dt",h:"Date of sanction of loan",t:"date",w:"150px",req:1},
      {k:"amt",h:"Total amount of loan",t:"num",w:"150px",req:1},
      {k:"os",h:"Loan outstanding as on 31-03-2026",t:"num",w:"180px",req:1},
      {k:"interest",h:"Interest on Borrowed capital u/s 24(b)",t:"num",w:"180px",req:1}],
    p.loans||[], {min:"1360px", empty:"No loan.", add:"Add a loan",
      foot:[{l:1,v:"Total Interest on borrowed capital u/s 24(b)",span:6},{v:r.hRaw}]});
  let hHint = "";
  if(bab) hHint = "disallowed u/s 115BAB (24b)";
  else if(!r.guard && r.hRaw>0) hHint = "not admissible — share is nil or the annual value (1a) is nil";
  b += row("h · Interest payable on borrowed capital", cell(r.h), {ref:"1h", cls:"tot", hint:hHint});

  b += row("i · Total (1g + 1h)", cell(r.i), {ref:"1i", cls:"tot"});
  b += row("j · Arrears / Unrealized Rent received during the year, less 30%", inp(pre+"arrears",{n:1}),
           {ref:"1j", hint:"enter the amount already net of the 30% deduction"});
  b += row("k · Income from house property "+ordinal+" (1f − 1i + 1j)", cell(r.k), {ref:"1k", cls:"grand"});

  return blk(id, "Property "+ordinal+(st0(p.addr)?" — "+st0(p.addr):""), status, b, "hp.props."+i);
}

function secHp(){
  const C = S.C.hp || {};
  const bab = C.bab;
  let h = "";
  h += row("Is there income or a loss from house property?",
           sel("hp.on",[["","No"],["1","Yes"]],{blank:false}), {req:1, ref:"Schedule HP"});
  if(!S.hp.on) return h;

  h += note("One block per property, unlimited. Type is Let Out or Deemed Let Out only — a company has no "+
    "self-occupied house, so the full a–k working always runs and the gross rent (1a) must be more than nil. "+
    "The Section 24(b) loan table sits inside each block and sums into item h. Rent, unrealised rent and "+
    "local taxes are entered in full for the property; the assessee's share is applied once, at item f, and "+
    "is computed as 100 − the co-owners' shares.");
  if(bab)
    h += note("The company has opted for taxation u/s 115BAB — for every property the 30% standard deduction "+
      "(24a) and the interest on borrowed capital (24b) are disallowed (rules A187 / A188).","warn");

  (S.hp.props||[]).forEach((p,i)=>h += hpBlock(p, i, i+1, bab));
  h += '<button class="add" data-addprop="1">Add a property</button>';

  h += sub("Across all properties");
  h += row("Σ1k · Income from all properties", cell(C.sum1k), {cls:"tot"});
  if(C.ptiFromSch)
    h += row("2 · Pass through income / Loss — from Schedule PTI", cell(C.pti),
             {ref:"2", hint:"the house-property row(s) of Schedule PTI"});
  else
    h += row("2 · Pass through income / Loss (if any)", inp("hp.pti",{n:1}),
             {ref:"2", hint:"from Schedule PTI — leave blank if none"});
  h += row('3 · Income under the head "Income from house property" (Ʃ1K + 2)', cell(C.income),
           {ref:"3", cls:"grand",
            hint:C.income<0?"a loss — to 2i of Schedule CYLA, the set-off capped at ₹2,00,000 (s.71(3A)); the excess carries to CFL":""});
  if(C.income<0){
    h += row("Loss allowed to be set off this year (capped at ₹2,00,000) → CYLA 2i", cell(C.cyla2i), {cls:"tot"});
    if(C.cflExcess>0)
      h += row("Loss carried forward under Schedule CFL (excess beyond ₹2,00,000)", cell(-C.cflExcess), {cls:"tot"});
  }
  return h;
}

/* ---- export ------------------------------------------------------ */
function expHp(j){
  const C = S.C.hp || {};
  if(!(S.hp && S.hp.on && (S.hp.props||[]).length)) return;
  const bab = C.bab;

  const items = (S.hp.props||[]).map((p,i)=>{
    const r = p._ || engProp(p, bab);
    const ad = {
      AddrDetail:(sv(p.addr)||"NA").slice(0,200),
      CityOrTownOrDistrict:(sv(p.city)||"NA").slice(0,50),
      StateCode:(p.country||"91")==="91" ? (HP_STATE_SET[st0(p.state)]?st0(p.state):"19") : "99",
      CountryCode:(st0(p.country)||"91").slice(0,4)
    };
    if((p.country||"91")==="91"){ if(/^[1-9]\d{5}$/.test(st0(p.pin))) ad.PinCode=parseInt(p.pin,10); }
    else if(sv(p.zip)) ad.ZipCode=sv(p.zip).slice(0,8);

    /* Rentdetails — every leaf is schema-required (book §7/§12); write all,
       even zero (direct object literal, not put(), so 0 is retained). */
    const rd = {
      AnnualLetableValue:n0(r.a),               /* 1a */
      RentNotRealized:n0(r.b),                  /* 1b */
      LocalTaxes:n0(r.c),                       /* 1c */
      TotalUnrealizedAndTax:n0(r.d),            /* 1d */
      BalanceALV:n0(r.e),                       /* 1e */
      AnnualOfPropOwned:n0(r.f),                /* 1f */
      ThirtyPercentOfBalance:n0(r.g),           /* 1g */
      IntOnBorwCap:n0(r.h),                     /* 1h */
      TotalDeduct:n0(r.i),                      /* 1i */
      ArrearsUnrealizedRentRcvd:n0(r.j),        /* 1j (typed net of 30%) */
      IncomeOfHP:sg(r.k)                        /* 1k (signed) */
    };

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
        TotalInterestUs24B:n0(r.hRaw)             /* K33 = Σ rows (A191) */
      };
    }

    const it = {
      HPSNo:i+1,
      AddressDetailWithZipCode:ad,
      PropertyOwner:(p.owner==="DO"?"DO":"SE"),
      PropCoOwnedFlg:(p.co==="YES"?"YES":"NO"),
      AssessePercentShareProp:r.share,            /* computed I7 (required) */
      ifLetOut:(p.type==="D"?"D":"Y"),            /* Y/D only; coerce anything else to Y */
      Rentdetails:rd
    };

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
function impHp(I6){
  if(!(I6 && I6.ScheduleHP)) return [];
  const hp = I6.ScheduleHP;
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
        share:nz(p.AssessePercentShareProp),          /* recomputed by the engine on paint */
        coowners:(p.CoOwners||[]).map(c=>({name:c.NameCoOwner||"", pan:c.PAN_CoOwner||"",
          aadhaar:c.Aadhaar_CoOwner||"", share:nz(c.PercentShareProperty)})),
        type:p.ifLetOut==="D"?"D":"Y",
        tenants:(p.TenantDetails||[]).map(t=>({name:t.NameofTenant||"", pan:t.PANofTenant||"",
          aadhaar:t.AadhaarofTenant||"", pantan:t.PANTANofTenant||""})),
        rent:nz(rd.AnnualLetableValue), unreal:nz(rd.RentNotRealized), taxes:nz(rd.LocalTaxes),
        arrears:nz(rd.ArrearsUnrealizedRentRcvd),     /* stored net (typed net of 30%) — direct */
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
  const C = S.C.hp || {};
  const bab = C.bab;
  const myPan = st0((S.pi||{}).pan).toUpperCase();

  (S.hp.props||[]).forEach((p,n)=>{
    const r = p._ || engProp(p, bab);
    const L = "Property "+(n+1);

    /* required address (book: do not leave address blank) */
    if(!st0(p.addr)) out.push({lvl:"err", t:L, m:"The address of the property is required.", sec:"hp"});
    if(!st0(p.city)) out.push({lvl:"err", t:L, m:"Town / City is required.", sec:"hp"});
    if((p.country||"91")==="91" && !HP_STATE_SET[st0(p.state)])
      out.push({lvl:"err", t:L, m:"State is required for a property in India.", sec:"hp"});
    /* owner Self / Deemed Owner only */
    if(p.owner!=="SE" && p.owner!=="DO")
      out.push({lvl:"err", t:L, m:"Select the owner of the property — Self or Deemed Owner.", sec:"hp"});
    /* type Let Out / Deemed Let Out only (a company has no self-occupied house) */
    if(p.type!=="Y" && p.type!=="D")
      out.push({lvl:"err", t:L, m:"Select the type of house property — Let Out or Deemed Let Out (a company has no self-occupied house).", sec:"hp"});

    /* gross rent must be > 0 for a let-out / deemed let-out property (A181) */
    if(!(N(p.rent)>0))
      out.push({lvl:"err", t:L, m:"A let-out or deemed let-out property needs a gross rent / lettable value (1a) greater than nil.", sec:"hp"});
    /* local tax not allowed if 1a is zero/null (A179) */
    if(N(p.taxes)>0 && !(N(p.rent)>0))
      out.push({lvl:"warn", t:L, m:"Tax paid to local authorities (1c) cannot be claimed when the gross rent (1a) is nil.", sec:"hp"});
    /* unrealised rent cannot exceed the gross rent (A194) */
    if(N(p.unreal) > N(p.rent))
      out.push({lvl:"warn", t:L, m:"The amount of rent that cannot be realised (1b) cannot exceed the gross rent (1a).", sec:"hp"});

    /* co-ownership: shares must total 100 (A176); each co-owner < 100 (A192);
       PAN or Aadhaar required (A176); co-owner PAN cannot equal assessee PAN (A189) */
    if(p.co==="YES"){
      if(!(p.coowners||[]).some(x=>st0(x.name)))
        out.push({lvl:"err", t:L, m:"List the other co-owner(s) of the property.", sec:"hp"});
      if(Math.abs(r.share+r.coShare-100)>0.01)
        out.push({lvl:"err", t:L, m:"The assessee's share plus the co-owners' shares must total 100%.", sec:"hp"});
      (p.coowners||[]).forEach((x,m)=>{
        const CL = L+", co-owner "+(m+1);
        if(!st0(x.name))
          out.push({lvl:"err", t:CL, m:"The co-owner's name is required.", sec:"hp"});
        if(!PAN_RE.test(st0(x.pan).toUpperCase()) && !AADH.test(st0(x.aadhaar)))
          out.push({lvl:"err", t:CL, m:"The PAN or Aadhaar of the co-owner is required.", sec:"hp"});
        if(st0(x.pan) && !PAN_RE.test(st0(x.pan).toUpperCase()))
          out.push({lvl:"err", t:CL, m:"The PAN is not in the correct form.", sec:"hp"});
        if(myPan && st0(x.pan).toUpperCase()===myPan)
          out.push({lvl:"err", t:CL, m:"A co-owner's PAN cannot be the same as the assessee's PAN.", sec:"hp"});
        if(N(x.share)>=100)
          out.push({lvl:"err", t:CL, m:"Each co-owner's share must be less than 100%.", sec:"hp"});
      });
      /* assessee cannot claim interest if his share of a co-owned property is zero (A178) */
      if(r.share===0 && r.hRaw>0)
        out.push({lvl:"err", t:L, m:"Interest u/s 24(b) cannot be claimed on a co-owned property in which the assessee's share is nil.", sec:"hp"});
    }

    /* tenant PAN form */
    (p.tenants||[]).forEach((x,m)=>{
      if(st0(x.pan) && !PAN_RE.test(st0(x.pan).toUpperCase()))
        out.push({lvl:"err", t:L+", tenant "+(m+1), m:"The PAN is not in the correct form.", sec:"hp"});
    });

    /* 115BAB — 24(a) and 24(b) disallowed (informational, A187/A188) */
    if(bab && (r.hRaw>0 || N(p.rent)>0))
      out.push({lvl:"warn", t:L, m:"Section 115BAB — the 30% standard deduction (24a) and interest (24b) have been disallowed for this property.", sec:"hp"});
    /* interest not admissible when share is nil or the annual value (1a) is nil (A178) */
    else if(!bab && !r.guard && r.hRaw>0)
      out.push({lvl:"warn", t:L, m:"Interest u/s 24(b) is admitted only when the assessee's share > 0 and the annual value (1a) > 0; it has been set to nil for this property.", sec:"hp"});

    /* interest u/s 24(b) needs every column of the loan row (book §2/§7) */
    (p.loans||[]).filter(l=>N(l.interest)).forEach((l,m)=>{
      if(!st0(l.from)||!st0(l.name)||!st0(l.acno)||!ISO(l.dt)||!(N(l.amt)>0)||!(N(l.os)>=0))
        out.push({lvl:"err", t:L+", loan "+(m+1), m:"Every column of the Section 24(b) loan row is required (lender, name, account no., date of sanction, total loan, amount outstanding).", sec:"hp"});
    });
  });

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
