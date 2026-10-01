/* =====================================================================
   ITR-7 · Section "fa" — Foreign income, tax relief and foreign assets
   Books: books/ITR-7/Schedule_FSI.md (block ScheduleFSI)
          books/ITR-7/Schedule_TR.md  (block ScheduleTR1)
          books/ITR-7/Schedule_FA.md  (block ScheduleFA)
   Schema blocks: ScheduleFSI, ScheduleTR1, ScheduleFA
   Screen order 160, compute order 58 (foreign relief is published for the
   Part B tax roll-up, so it computes after the income heads/CYLA/BFLA).

   TRUST / INSTITUTION RETURN — read from the ITR-7 books, never ported:
   - FSI head list is House Property · Business or Profession · Capital
     Gains · Other Sources. There is NO Salary head (Schedule_FSI.md). The
     four schema head objects are IncFromHP, IncFromBusiness, IncCapGain,
     IncOthSrc, plus TotalCountryWise.
   - ScheduleTR1's grand total of taxes paid is TotalTaxOutsideIndia. The
     refund flag TaxPaidOutsideIndFlg is REQUIRED on ITR-7 (optional on
     ITR-6) — it is written ALWAYS whenever the TR block is emitted
     (Schedule_TR.md: "Set TaxPaidOutsideIndFlg always — it is mandatory").
   - ONE country-code list on ITR-7 FA: every FA country field (A1–A4 and
     B–G) uses `Country_WithoutIndia` (code-NAME format). FSI and TR use
     `FSI_newcountrycod` / the TR reference list (NAME:code). The two share
     the same 249 codes; only code 670 (Timor-Leste) differs by one space —
     FSI/TR carry a non-breaking space, FA does not. Each list keeps its own
     verbatim name; value stored is always the code.
   - FA enum VALUES are the schema's, matched verbatim (enums.json):
       OwnerStatus/Status  : OWNER · BENEFICIAL_OWNER · BENIFICIARY
       NatureOfInt/Ownership: DIRECT · BENEFICIAL_OWNER · BENIFICIARY
       NatureOfAmount (A2) : INT · DIV · SALE · OTH · NAP  (NOT ITR-6's I/D/S/O/N)
       Schedule where offered: HP · BU · CG · OS · EI · NI  (no salary)
       "taxable in your hands?" flags: Y · N
     The department's misspelled BENIFICIARY is deliberate.

   RESIDENCE GATE: FSI, TR and FA are "available only in case of resident"
   / "not Applicable for NRI". ITR-7 residential status (S.pi.res) is RES or
   NRI. Everything here is off for NRI.

   GTI NOTE: Schedule FSI adds no income — column (b) is "already included in
   PART B-TI". This section contributes 0 to Gross Total Income; its output
   is the foreign-tax relief that feeds Part B-TTI via TR.

   SEAM (publishes): S.C.fa.relief (total 90/91 relief), S.C.fa.relief90
   (DTAA, s.90/90A), S.C.fa.relief91 (non-DTAA, s.91), plus paidTot,
   reliefTot, dtaa, notDtaa, hasFA, income. The tax section reads
   S.C.fa.relief / relief90 / relief91 to reduce liability (Part B-TTI
   TaxRelief.Section90 / Section91 / TotTaxRelief). Consumes: S.pi.res.
   ===================================================================== */

/* ---- state ---- */
S.fa = S.fa || {
  fsi:[],                          /* ScheduleFSIDtls[] — one per country */
  trFlag:"", trAmt:"", trAY:"",    /* TR refund clawback (rows 261/262) */
  a1:[], a2:[], a3:[], a4:[],      /* FA depository / custodial / equity-debt / insurance */
  b:[], c:[], d:[], e:[], f:[], g:[]  /* FA financial-interest / immovable / other-asset / signing / trust / other-income */
};

/* ---- FSI / TR country list (NAME:code — FSI_newcountrycod / TR reference),
   verbatim from books/ITR-7/Schedule_FSI.md Appendix C; India excluded,
   value = code. Code 670 carries the sheet's non-breaking space. ---- */
const FSI_CO=[
["93","AFGHANISTAN"],["1001","ALAND ISLANDS"],["355","ALBANIA"],["213","ALGERIA"],["684","AMERICAN SAMOA"],["376","ANDORRA"],["244","ANGOLA"],
["1264","ANGUILLA"],["1010","ANTARCTICA"],["1268","ANTIGUA AND BARBUDA"],["54","ARGENTINA"],["374","ARMENIA"],["297","ARUBA"],["61","AUSTRALIA"],
["43","AUSTRIA"],["994","AZERBAIJAN"],["1242","BAHAMAS"],["973","BAHRAIN"],["880","BANGLADESH"],["1246","BARBADOS"],["375","BELARUS"],
["32","BELGIUM"],["501","BELIZE"],["229","BENIN"],["1441","BERMUDA"],["975","BHUTAN"],["591","BOLIVIA (PLURINATIONAL STATE OF)"],
["1002","BONAIRE, SINT EUSTATIUS AND SABA"],["387","BOSNIA AND HERZEGOVINA"],["267","BOTSWANA"],["1003","BOUVET ISLAND"],["55","BRAZIL"],
["1014","BRITISH INDIAN OCEAN TERRITORY"],["673","BRUNEI DARUSSALAM"],["359","BULGARIA"],["226","BURKINA FASO"],["257","BURUNDI"],
["238","CABO VERDE"],["855","CAMBODIA"],["237","CAMEROON"],["1","CANADA"],["1345","CAYMAN ISLANDS"],["236","CENTRAL AFRICAN REPUBLIC"],["235","CHAD"],
["56","CHILE"],["86","CHINA"],["9","CHRISTMAS ISLAND"],["672","COCOS (KEELING) ISLANDS"],["57","COLOMBIA"],["270","COMOROS"],["242","CONGO"],
["243","CONGO (DEMOCRATIC REPUBLIC OF THE)"],["682","COOK ISLANDS"],["506","COSTA RICA"],["225","COTE DIVOIRE"],["385","CROATIA"],["53","CUBA"],
["1015","CURACAO"],["357","CYPRUS"],["420","CZECHIA"],["45","DENMARK"],["253","DJIBOUTI"],["1767","DOMINICA"],["1809","DOMINICAN REPUBLIC"],
["593","ECUADOR"],["20","EGYPT"],["503","EL SALVADOR"],["240","EQUATORIAL GUINEA"],["291","ERITREA"],["372","ESTONIA"],["251","ETHIOPIA"],
["500","FALKLAND ISLANDS (MALVINAS)"],["298","FAROE ISLANDS"],["679","FIJI"],["358","FINLAND"],["33","FRANCE"],["594","FRENCH GUIANA"],
["689","FRENCH POLYNESIA"],["1004","FRENCH SOUTHERN TERRITORIES"],["241","GABON"],["220","GAMBIA"],["995","GEORGIA"],["49","GERMANY"],["233","GHANA"],
["350","GIBRALTAR"],["30","GREECE"],["299","GREENLAND"],["1473","GRENADA"],["590","GUADELOUPE"],["1671","GUAM"],["502","GUATEMALA"],
["1481","GUERNSEY"],["224","GUINEA"],["245","GUINEA-BISSAU"],["592","GUYANA"],["509","HAITI"],["1005","HEARD ISLAND AND MCDONALD ISLANDS"],
["6","HOLY SEE"],["504","HONDURAS"],["852","HONG KONG"],["36","HUNGARY"],["354","ICELAND"],["62","INDONESIA"],["98","IRAN (ISLAMIC REPUBLIC OF)"],
["964","IRAQ"],["353","IRELAND"],["1624","ISLE OF MAN"],["972","ISRAEL"],["5","ITALY"],["1876","JAMAICA"],["81","JAPAN"],["1534","JERSEY"],
["962","JORDAN"],["7","KAZAKHSTAN"],["254","KENYA"],["686","KIRIBATI"],["850","KOREA (DEMOCRATIC PEOPLES REPUBLIC OF)"],["82","KOREA (REPUBLIC OF)"],
["965","KUWAIT"],["996","KYRGYZSTAN"],["856","LAO PEOPLES DEMOCRATIC REPUBLIC"],["371","LATVIA"],["961","LEBANON"],["266","LESOTHO"],
["231","LIBERIA"],["218","LIBYA"],["423","LIECHTENSTEIN"],["370","LITHUANIA"],["352","LUXEMBOURG"],["853","MACAO"],
["389","MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)"],["261","MADAGASCAR"],["265","MALAWI"],["60","MALAYSIA"],["960","MALDIVES"],["223","MALI"],
["356","MALTA"],["692","MARSHALL ISLANDS"],["596","MARTINIQUE"],["222","MAURITANIA"],["230","MAURITIUS"],["269","MAYOTTE"],["52","MEXICO"],
["691","MICRONESIA (FEDERATED STATES OF)"],["373","MOLDOVA (REPUBLIC OF)"],["377","MONACO"],["976","MONGOLIA"],["382","MONTENEGRO"],
["1664","MONTSERRAT"],["212","MOROCCO"],["258","MOZAMBIQUE"],["95","MYANMAR"],["264","NAMIBIA"],["674","NAURU"],["977","NEPAL"],["31","NETHERLANDS"],
["687","NEW CALEDONIA"],["64","NEW ZEALAND"],["505","NICARAGUA"],["227","NIGER"],["234","NIGERIA"],["683","NIUE"],["15","NORFOLK ISLAND"],
["1670","NORTHERN MARIANA ISLANDS"],["47","NORWAY"],["968","OMAN"],["92","PAKISTAN"],["680","PALAU"],["970","PALESTINE, STATE OF"],["507","PANAMA"],
["675","PAPUA NEW GUINEA"],["595","PARAGUAY"],["51","PERU"],["63","PHILIPPINES"],["1011","PITCAIRN"],["48","POLAND"],["14","PORTUGAL"],
["1787","PUERTO RICO"],["974","QATAR"],["262","REUNION"],["40","ROMANIA"],["8","RUSSIAN FEDERATION"],["250","RWANDA"],["1006","SAINT BARTHELEMY"],
["290","SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA"],["1869","SAINT KITTS AND NEVIS"],["1758","SAINT LUCIA"],["1007","SAINT MARTIN (FRENCH PART)"],
["508","SAINT PIERRE AND MIQUELON"],["1784","SAINT VINCENT AND THE GRENADINES"],["685","SAMOA"],["378","SAN MARINO"],["239","SAO TOME AND PRINCIPE"],
["966","SAUDI ARABIA"],["221","SENEGAL"],["381","SERBIA"],["248","SEYCHELLES"],["232","SIERRA LEONE"],["65","SINGAPORE"],
["1721","SINT MAARTEN (DUTCH PART)"],["421","SLOVAKIA"],["386","SLOVENIA"],["677","SOLOMON ISLANDS"],["252","SOMALIA"],["28","SOUTH AFRICA"],
["1008","SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS"],["211","SOUTH SUDAN"],["35","SPAIN"],["94","SRI LANKA"],["249","SUDAN"],["597","SURINAME"],
["1012","SVALBARD AND JAN MAYEN"],["268","SWAZILAND"],["46","SWEDEN"],["41","SWITZERLAND"],["963","SYRIAN ARAB REPUBLIC"],
["886","TAIWAN, PROVINCE OF CHINA[A]"],["992","TAJIKISTAN"],["255","TANZANIA, UNITED REPUBLIC OF"],["66","THAILAND"],
["670","TIMOR-LESTE (EAST TIMOR)"],["228","TOGO"],["690","TOKELAU"],["676","TONGA"],["1868","TRINIDAD AND TOBAGO"],["216","TUNISIA"],
["90","TURKEY"],["993","TURKMENISTAN"],["1649","TURKS AND CAICOS ISLANDS"],["688","TUVALU"],["256","UGANDA"],["380","UKRAINE"],
["971","UNITED ARAB EMIRATES"],["44","UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND"],["2","UNITED STATES OF AMERICA"],
["1009","UNITED STATES MINOR OUTLYING ISLANDS"],["598","URUGUAY"],["998","UZBEKISTAN"],["678","VANUATU"],["58","VENEZUELA (BOLIVARIAN REPUBLIC OF)"],
["84","VIET NAM"],["1284","VIRGIN ISLANDS (BRITISH)"],["1340","VIRGIN ISLANDS (U.S.)"],["681","WALLIS AND FUTUNA"],["1013","WESTERN SAHARA"],
["967","YEMEN"],["260","ZAMBIA"],["263","ZIMBABWE"],["9999","OTHERS"]];
const FSI_CONM={};FSI_CO.forEach(x=>FSI_CONM[x[0]]=x[1]);

/* FA country list (Country_WithoutIndia, code-NAME) — same 249 codes as the
   FSI/TR list; only code 670 differs (no space). Derived with that one
   override, then seeds every FA country field. */
const FA_CO=FSI_CO.map(x=>x[0]==="670"?["670","TIMOR-LESTE(EAST TIMOR)"]:x);
const FA_CONM={};FA_CO.forEach(x=>FA_CONM[x[0]]=x[1]);

/* ---- enumerations (schema enum VALUES verbatim from enums.json; labels for the user) ---- */
const FA_OWN=[["OWNER","Owner"],["BENEFICIAL_OWNER","Beneficial owner"],["BENIFICIARY","Beneficiary"]];  /* A1 OwnerStatus / A2 Status */
const FA_DIR=[["DIRECT","Direct"],["BENEFICIAL_OWNER","Beneficial owner"],["BENIFICIARY","Beneficiary"]];  /* B NatureOfInt · C/D Ownership */
const FA_NAMT=[["INT","Interest"],["DIV","Dividend"],["SALE","Proceeds from sale or redemption of financial assets"],["OTH","Other income"],["NAP","No amount paid/credited"]]; /* A2 NatureOfAmount */
const FA_OFF=[["HP","House Property"],["BU","Business"],["CG","Capital Gains"],["OS","Other Sources"],["EI","Exempt Income"],["NI","No Income during the year"]]; /* IncTaxSch / IncOfferedSch — no salary */
const FA_YN=[["Y","Yes"],["N","No"]];                 /* E/F/G "taxable in your hands?" */
const FA_RELSEC=[["90","90"],["90A","90A"],["91","91"]]; /* TR ReliefClaimedUsSection */
const FA_REFFLAG=[["YES","YES"],["NO","NO"]];         /* TR refund flag */

/* residence: ITR-7 body is RES or NRI (no RNOR); default RES */
function faRes(){return st0((S.pi||{}).res)||"RES";}
function faOn(){return faRes()==="RES";}
function faCount(){return ["a1","a2","a3","a4","b","c","d","e","f","g"]
  .reduce((a,k)=>a+((S.fa[k]||[]).length),0);}
/* small local helper: count label for a table */
function faCnt(a){a=a||[];return a.length?(a.length+" row"+(a.length>1?"s":"")):"None";}

/* ================================================================
   ENGINE — engFa()
   ================================================================ */
function engFa(){
  const C=S.C.fa={income:0, fsi:[], trRows:[], paidTot:0, reliefTot:0,
                  dtaa:0, notDtaa:0, relief:0, relief90:0, relief91:0, hasFA:false};
  /* Schedule FSI adds no income to GTI — column (b) is already in Part B-TI. */
  C.income=0;

  /* Schedule FA present ⟺ any table has a row and the body is resident.
     Published so a Part B-TTI / who owner can set AssetOutsideIndiaFlg. */
  C.hasFA = faOn() && faCount()>0;

  if(!faOn()){S.fa.fsi=S.fa.fsi||[];return;}  /* NRI: schedules not applicable */

  (S.fa.fsi||[]).forEach(rw=>{
    const heads=["hp","bus","cg","os"];       /* NO salary head */
    let tb=0,tc=0,td=0,te=0; const hc={};
    heads.forEach(k=>{
      const h=rw[k]||{};
      const b=n0(h.b), c=n0(h.c), d=n0(h.d);
      const e=Math.min(c,d);                  /* (e)=MIN(c,d): relief = lower of tax paid (c) and tax payable (d) */
      hc[k]={b,c,d,e};
      tb+=b; tc+=c; td+=d; te+=e;             /* Total row = SUM down each column */
    });
    C.fsi.push({code:rw.code||"", name:FSI_CONM[rw.code]||rw.name||"", tin:rw.tin||"",
                sec:rw.sec||"", heads:hc, tot:{b:tb,c:tc,d:td,e:te}});
    /* one Schedule TR row per country: (c)=country total tax paid, (d)=country total relief */
    if(rw.code){
      C.trRows.push({code:rw.code, name:FSI_CONM[rw.code]||rw.name||"", tin:rw.tin||"",
                     paid:tc, relief:te, sec:rw.sec||""});
    }
  });

  /* TR totals (Schedule_TR.md) */
  C.paidTot   = C.trRows.reduce((a,r)=>a+n0(r.paid),0);      /* SUM col (c) -> TotalTaxOutsideIndia */
  C.reliefTot = C.trRows.reduce((a,r)=>a+n0(r.relief),0);    /* SUM col (d) -> TotalTaxReliefOutsideIndia */
  C.dtaa      = C.trRows.reduce((a,r)=>a+((r.sec==="90"||r.sec==="90A")?n0(r.relief):0),0); /* SUMIF 90/90A */
  C.notDtaa   = C.trRows.reduce((a,r)=>a+(r.sec==="91"?n0(r.relief):0),0);                  /* SUMIF 91 */
  /* SEAM: relief90 -> Part B-TTI Section90, relief91 -> Section91, relief -> TotTaxRelief */
  C.relief90  = C.dtaa;
  C.relief91  = C.notDtaa;
  C.relief    = C.reliefTot;
}

/* ================================================================
   RENDERER — secFa()
   (the FSI country loop calls the shell renderer blk(); no local var is
    named `blk`, to avoid shadowing it — that once crashed ITR-6.)
   ================================================================ */
function secFa(){
  const C=S.C.fa||{fsi:[],trRows:[],paidTot:0,reliefTot:0,dtaa:0,notDtaa:0};

  if(!faOn())
    return note("<b>Not applicable.</b> Schedules FSI, TR and FA are available only when the body is <b>resident</b> (FA is not applicable for NRI). Set residential status to Resident under <i>Who is filing</i> to enter foreign income, tax relief and foreign assets.","form");

  let H="";

  /* ---------- Schedule FSI ---------- */
  let fsiInner=note("Details of income from outside India and tax relief (available only in case of resident). The amounts in (b) are already included in Part B-TI — this schedule identifies that slice and computes the relief. Column (e) = lower of (c) tax paid outside India and (d) tax payable in India. If no Country Code is entered, the row is not considered.");
  const HEADS=[["hp","i","House Property"],["bus","ii","Business or Profession"],["cg","iii","Capital Gains"],["os","iv","Other Sources"]];
  (S.fa.fsi||[]).forEach((rw,i)=>{
    const cr=(C.fsi||[])[i]||{heads:{},tot:{b:0,c:0,d:0,e:0}};
    let tbl='<div class="full"><table class="gt" style="min-width:920px"><thead><tr>'+
      '<th class="l">Head of income (a)</th>'+
      '<th>Income from outside India (b)</th>'+
      '<th>Tax paid outside India (c)</th>'+
      '<th>Tax payable in India (d)</th>'+
      '<th>Tax relief (e)=min(c,d)</th>'+
      '<th class="l">DTAA article u/s 90/90A (f)</th></tr></thead><tbody>';
    HEADS.forEach(hd=>{const k=hd[0], p="fa.fsi."+i+"."+k, hc=(cr.heads||{})[k]||{e:0};
      tbl+='<tr><td class="l">'+hd[1]+' — '+esc(hd[2])+'</td>'+
        '<td>'+inp(p+".b",{n:1})+'</td>'+
        '<td>'+inp(p+".c",{n:1})+'</td>'+
        '<td>'+inp(p+".d",{n:1})+'</td>'+
        '<td class="num">'+cell(hc.e)+'</td>'+
        '<td class="l">'+inp(p+".art",{max:16,ph:"Article"})+'</td></tr>';});
    const tt=cr.tot||{b:0,c:0,d:0,e:0};
    tbl+='<tr><td class="l"><b>Total (i+ii+iii+iv)</b></td>'+
       '<td class="num">'+cell(tt.b)+'</td><td class="num">'+cell(tt.c)+'</td>'+
       '<td class="num">'+cell(tt.d)+'</td><td class="num">'+cell(tt.e)+'</td><td></td></tr>';
    tbl+='</tbody></table></div>';
    const hdr=row("Country/Region Code",sel("fa.fsi."+i+".code",FSI_CO),{req:1})+
      row("Taxpayer Identification Number",inp("fa.fsi."+i+".tin",{max:75}),{req:1})+
      row("Section under which relief claimed",sel("fa.fsi."+i+".sec",FA_RELSEC),{hint:"90 / 90A (DTAA) or 91 (no DTAA) — carried to Schedule TR"});
    const nm=rw.code?(FSI_CONM[rw.code]||rw.code):"New country";
    fsiInner+=blk("fsi"+i, "Country "+(i+1)+" — "+esc(nm), tt.e?RS(tt.e)+" relief":"—", hdr+tbl, "fa.fsi."+i);
  });
  fsiInner+='<button class="add" data-add="fa.fsi">Add a country</button>';
  H+=fold("fa_fsi","Schedule FSI","Income from outside India & tax relief",
      (C.fsi||[]).length?(C.fsi.length+" countr"+(C.fsi.length>1?"ies":"y")):"None", fsiInner, {def:true});

  /* ---------- Schedule TR ---------- */
  let trTbl;
  if((C.trRows||[]).length){
    trTbl='<div class="full"><table class="gt" style="min-width:760px"><thead><tr>'+
      '<th class="l">Country/Region (a)</th><th class="l">TIN (b)</th>'+
      '<th>Taxes paid outside India (c)</th><th>Tax relief available (d)</th>'+
      '<th class="l">Relief section (e)</th></tr></thead><tbody>';
    (C.trRows||[]).forEach(r=>{
      let fi=-1;(S.fa.fsi||[]).forEach((bk,j)=>{if(fi<0&&bk.code===r.code)fi=j;});
      trTbl+='<tr><td class="l">'+esc(r.name||r.code)+'</td><td class="l">'+esc(r.tin||"—")+'</td>'+
        '<td class="num">'+cell(r.paid)+'</td><td class="num">'+cell(r.relief)+'</td>'+
        '<td class="l">'+(fi>=0?sel("fa.fsi."+fi+".sec",FA_RELSEC,{style:"width:100%"}):esc(r.sec||"—"))+'</td></tr>';
    });
    trTbl+='<tr><td class="l"><b>Total</b></td><td></td>'+
      '<td class="num">'+cell(C.paidTot)+'</td><td class="num">'+cell(C.reliefTot)+'</td><td></td></tr>';
    trTbl+='</tbody></table></div>';
  } else {
    trTbl=note("Schedule TR is generated from Schedule FSI — add a country in FSI above (with a Country Code) and its taxes paid (c) and relief (e) appear here per country.");
  }
  let trInner=trTbl+
    row("Total relief where DTAA applies (section 90/90A)",cell(C.dtaa),{hint:"sum of (d) where section is 90 or 90A"})+
    row("Total relief where DTAA does not apply (section 91)",cell(C.notDtaa),{hint:"sum of (d) where section is 91"})+
    row("Total taxes paid outside India",cell(C.paidTot),{hint:"TotalTaxOutsideIndia"})+
    row("Total tax relief available",cell(C.reliefTot),{hint:"TotalTaxReliefOutsideIndia"})+
    row("Any tax paid outside India, on which relief was allowed in India, refunded/credited by the foreign authority this year?",
        sel("fa.trFlag",FA_REFFLAG),{req:1,hint:"required on ITR-7"});
  if(S.fa.trFlag==="YES"){
    trInner+=row("Amount of tax refunded",inp("fa.trAmt",{n:1}))+
             row("Assessment year in which the relief was allowed in India",inp("fa.trAY",{max:9,ph:"YYYY-YY"}));
  }
  H+=fold("fa_tr","Schedule TR","Summary of tax relief for taxes paid outside India",
      C.reliefTot?RS(C.reliefTot)+" relief":"—", trInner, {def:false});

  /* ---------- Schedule FA ---------- */
  let faInner=note("Details of foreign assets and income from any source outside India, held at any time during the <b>calendar year</b> 1 Jan – 31 Dec 2025 (peak and closing balances are for that period, not the financial year). Values in rupees. Beneficial interest counts. If no Country Code (or, in E, no institution name) is entered in a row, that row is not considered. The \"schedule / item where offered\" columns point at where the income already sits in this return — FA adds no income.");

  /* A1 — Foreign Depository Accounts */
  faInner+=fold("fa_a1","A1","Foreign Depository Accounts", faCnt(S.fa.a1),
    grid("fa.a1",[
      {h:"Country/Region",k:"code",t:"sel",opts:FA_CO},
      {h:"Financial institution",k:"Bankname",t:"txt",max:125},
      {h:"Address",k:"AddressOfBank",t:"txt",max:200},
      {h:"ZIP",k:"ZipCode",t:"txt",max:8},
      {h:"Account no.",k:"ForeignAccountNumber",t:"txt",max:34},
      {h:"Status",k:"OwnerStatus",t:"sel",opts:FA_OWN},
      {h:"Opened",k:"AccOpenDate",t:"date"},
      {h:"Peak balance (₹)",k:"PeakBalanceDuringYear",t:"num"},
      {h:"Closing balance",k:"ClosingBalance",t:"num"},
      {h:"Gross interest",k:"IntrstAccured",t:"num"}
    ],S.fa.a1,{min:"1200px",empty:"No foreign depository accounts.",add:"Add a depository account"}),{def:false});

  /* A2 — Foreign Custodial Accounts */
  faInner+=fold("fa_a2","A2","Foreign Custodial Accounts", faCnt(S.fa.a2),
    grid("fa.a2",[
      {h:"Country/Region",k:"code",t:"sel",opts:FA_CO},
      {h:"Financial institution",k:"FinancialInstName",t:"txt",max:125},
      {h:"Address",k:"FinancialInstAddress",t:"txt",max:200},
      {h:"ZIP",k:"ZipCode",t:"txt",max:8},
      {h:"Account no.",k:"AccountNumber",t:"txt",max:34},
      {h:"Status",k:"Status",t:"sel",opts:FA_OWN},
      {h:"Opened",k:"AccOpenDate",t:"date"},
      {h:"Peak balance (₹)",k:"PeakBalanceDuringPeriod",t:"num"},
      {h:"Closing balance",k:"ClosingBalance",t:"num"},
      {h:"Nature of amount",k:"NatureOfAmount",t:"sel",opts:FA_NAMT},
      {h:"Gross amount",k:"GrossAmtPaidCredited",t:"num"}
    ],S.fa.a2,{min:"1300px",empty:"No foreign custodial accounts.",add:"Add a custodial account"}),{def:false});

  /* A3 — Foreign Equity & Debt Interest */
  faInner+=fold("fa_a3","A3","Foreign Equity and Debt Interest", faCnt(S.fa.a3),
    grid("fa.a3",[
      {h:"Country/Region",k:"code",t:"sel",opts:FA_CO},
      {h:"Name of entity",k:"NameOfEntity",t:"txt",max:125},
      {h:"Address",k:"AddressOfEntity",t:"txt",max:200},
      {h:"ZIP",k:"ZipCode",t:"txt",max:8},
      {h:"Nature of entity",k:"NatureOfEntity",t:"txt",max:34},
      {h:"Acquired on",k:"InterestAcquiringDate",t:"date"},
      {h:"Initial value (₹)",k:"InitialValOfInvstmnt",t:"num"},
      {h:"Peak value",k:"PeakBalanceDuringPeriod",t:"num"},
      {h:"Closing balance",k:"ClosingBalance",t:"num"},
      {h:"Gross amount paid",k:"TotGrossAmtPaidCredited",t:"num"},
      {h:"Gross sale proceeds",k:"TotGrossProceeds",t:"num"}
    ],S.fa.a3,{min:"1300px",empty:"No foreign equity/debt interest.",add:"Add an equity/debt interest"}),{def:false});

  /* A4 — Foreign Cash Value Insurance / Annuity */
  faInner+=fold("fa_a4","A4","Foreign Cash Value Insurance / Annuity Contract", faCnt(S.fa.a4),
    grid("fa.a4",[
      {h:"Country/Region",k:"code",t:"sel",opts:FA_CO},
      {h:"Financial institution",k:"FinancialInstName",t:"txt",max:125},
      {h:"Address",k:"FinancialInstAddress",t:"txt",max:200},
      {h:"ZIP",k:"ZipCode",t:"txt",max:8},
      {h:"Date of contract",k:"ContractDate",t:"date"},
      {h:"Cash / surrender value (₹)",k:"CashValOrSurrenderVal",t:"num"},
      {h:"Gross amount paid",k:"TotGrossAmtPaidCredited",t:"num"}
    ],S.fa.a4,{min:"1000px",empty:"No insurance/annuity contracts.",add:"Add a contract"}),{def:false});

  /* B — Financial Interest in any Entity */
  faInner+=fold("fa_b","B","Financial Interest in any Entity", faCnt(S.fa.b),
    grid("fa.b",[
      {h:"Country/Region",k:"code",t:"sel",opts:FA_CO},
      {h:"ZIP",k:"ZipCode",t:"txt",max:8},
      {h:"Nature of entity",k:"NatureOfEntity",t:"txt",max:100},
      {h:"Name of entity",k:"NameOfEntity",t:"txt",max:125},
      {h:"Address of entity",k:"AddressOfEntity",t:"txt",max:200},
      {h:"Nature of interest",k:"NatureOfInt",t:"sel",opts:FA_DIR},
      {h:"Held since",k:"DateHeld",t:"date"},
      {h:"Total investment (₹)",k:"TotalInvestment",t:"num"},
      {h:"Income accrued",k:"IncFromInt",t:"num"},
      {h:"Nature of income",k:"NatureOfInc",t:"txt",max:100},
      {h:"Income offered (₹)",k:"IncTaxAmt",t:"num"},
      {h:"Schedule",k:"IncTaxSch",t:"sel",opts:FA_OFF},
      {h:"Item no.",k:"IncTaxSchNo",t:"txt",max:50}
    ],S.fa.b,{min:"1600px",empty:"No financial interest.",add:"Add a financial interest"}),{def:false});

  /* C — Immovable Property */
  faInner+=fold("fa_c","C","Immovable Property", faCnt(S.fa.c),
    grid("fa.c",[
      {h:"Country/Region",k:"code",t:"sel",opts:FA_CO},
      {h:"ZIP",k:"ZipCode",t:"txt",max:8},
      {h:"Address of property",k:"AddressOfProperty",t:"txt",max:200},
      {h:"Ownership",k:"Ownership",t:"sel",opts:FA_DIR},
      {h:"Acquired on",k:"DateOfAcq",t:"date"},
      {h:"Total investment (₹)",k:"TotalInvestment",t:"num"},
      {h:"Income derived",k:"IncDrvProperty",t:"num"},
      {h:"Nature of income",k:"NatureOfInc",t:"txt",max:100},
      {h:"Income offered (₹)",k:"IncTaxAmt",t:"num"},
      {h:"Schedule",k:"IncTaxSch",t:"sel",opts:FA_OFF},
      {h:"Item no.",k:"IncTaxSchNo",t:"txt",max:50}
    ],S.fa.c,{min:"1400px",empty:"No immovable property.",add:"Add an immovable property"}),{def:false});

  /* D — Any other Capital Asset */
  faInner+=fold("fa_d","D","Any other Capital Asset", faCnt(S.fa.d),
    grid("fa.d",[
      {h:"Country/Region",k:"code",t:"sel",opts:FA_CO},
      {h:"ZIP",k:"ZipCode",t:"txt",max:8},
      {h:"Nature of asset",k:"NatureOfAsset",t:"txt",max:100},
      {h:"Ownership",k:"Ownership",t:"sel",opts:FA_DIR},
      {h:"Acquired on",k:"DateOfAcq",t:"date"},
      {h:"Total investment (₹)",k:"TotalInvestment",t:"num"},
      {h:"Income derived",k:"IncDrvAsset",t:"num"},
      {h:"Nature of income",k:"NatureOfInc",t:"txt",max:100},
      {h:"Income offered (₹)",k:"IncTaxAmt",t:"num"},
      {h:"Schedule",k:"IncTaxSch",t:"sel",opts:FA_OFF},
      {h:"Item no.",k:"IncTaxSchNo",t:"txt",max:50}
    ],S.fa.d,{min:"1400px",empty:"No other capital assets.",add:"Add a capital asset"}),{def:false});

  /* E — Accounts with signing authority (not in A–D) */
  faInner+=fold("fa_e","E","Accounts with signing authority (not in A–D)", faCnt(S.fa.e),
    grid("fa.e",[
      {h:"Institution name",k:"NameOfInstitution",t:"txt",max:125},
      {h:"Institution address",k:"AddressOfInstitution",t:"txt",max:200},
      {h:"Country/Region",k:"code",t:"sel",opts:FA_CO},
      {h:"ZIP",k:"ZipCode",t:"txt",max:8},
      {h:"Account holder",k:"NameMentionedInAccnt",t:"txt",max:125},
      {h:"Account no.",k:"InstitutionAccountNumber",t:"txt",max:34},
      {h:"Peak balance (₹)",k:"PeakBalanceOrInvestment",t:"num"},
      {h:"Income taxable?",k:"IncAccuredTaxFlag",t:"sel",opts:FA_YN},
      {h:"Income accrued",k:"IncAccuredInAcc",t:"num"},
      {h:"Income offered (₹)",k:"IncOfferedAmt",t:"num"},
      {h:"Schedule",k:"IncOfferedSch",t:"sel",opts:FA_OFF},
      {h:"Item no.",k:"IncOfferedSchNo",t:"txt",max:50}
    ],S.fa.e,{min:"1500px",empty:"No signing-authority accounts.",add:"Add an account"}),{def:false});

  /* F — Trusts outside India */
  faInner+=fold("fa_f","F","Trusts outside India (trustee/beneficiary/settlor)", faCnt(S.fa.f),
    grid("fa.f",[
      {h:"Country/Region",k:"code",t:"sel",opts:FA_CO},
      {h:"ZIP",k:"ZipCode",t:"txt",max:8},
      {h:"Name of trust",k:"NameOfTrust",t:"txt",max:125},
      {h:"Address of trust",k:"AddressOfTrust",t:"txt",max:200},
      {h:"Trustees",k:"NameOfOtherTrustees",t:"txt",max:125},
      {h:"Trustees address",k:"AddressOfOtherTrustees",t:"txt",max:200},
      {h:"Settlor",k:"NameOfSettlor",t:"txt",max:125},
      {h:"Settlor address",k:"AddressOfSettlor",t:"txt",max:200},
      {h:"Beneficiaries",k:"NameOfBeneficiaries",t:"txt",max:125},
      {h:"Beneficiaries address",k:"AddressOfBeneficiaries",t:"txt",max:200},
      {h:"Held since",k:"DateHeld",t:"date"},
      {h:"Income taxable?",k:"IncDrvTaxFlag",t:"sel",opts:FA_YN},
      {h:"Income derived",k:"IncDrvFromTrust",t:"num"},
      {h:"Income offered (₹)",k:"IncOfferedAmt",t:"num"},
      {h:"Schedule",k:"IncOfferedSch",t:"sel",opts:FA_OFF},
      {h:"Item no.",k:"IncOfferedSchNo",t:"txt",max:50}
    ],S.fa.f,{min:"1900px",empty:"No foreign trusts.",add:"Add a trust"}),{def:false});

  /* G — Any other income from a source outside India */
  faInner+=fold("fa_g","G","Other income from a source outside India", faCnt(S.fa.g),
    grid("fa.g",[
      {h:"Country/Region",k:"code",t:"sel",opts:FA_CO},
      {h:"ZIP",k:"ZipCode",t:"txt",max:8},
      {h:"Name of person",k:"NameOfPerson",t:"txt",max:125},
      {h:"Address",k:"AddressOfPerson",t:"txt",max:200},
      {h:"Income derived (₹)",k:"IncDerived",t:"num"},
      {h:"Nature of income",k:"NatureOfInc",t:"txt",max:100},
      {h:"Income taxable?",k:"IncDrvTaxFlag",t:"sel",opts:FA_YN},
      {h:"Income offered (₹)",k:"IncOfferedAmt",t:"num"},
      {h:"Schedule",k:"IncOfferedSch",t:"sel",opts:FA_OFF},
      {h:"Item no.",k:"IncOfferedSchNo",t:"txt",max:50}
    ],S.fa.g,{min:"1200px",empty:"No other foreign income.",add:"Add an income"}),{def:false});

  const fc=faCount();
  H+=fold("fa_fa","Schedule FA","Foreign assets & income from any source outside India",
      fc?(fc+" row"+(fc>1?"s":"")):"None", faInner, {def:false});

  return H;
}

/* ================================================================
   EXPORT — expFa(j)   (schema keys/enum values verbatim)
   ================================================================ */
function expFa(j){
  const C=S.C.fa||{fsi:[],trRows:[],paidTot:0,reliefTot:0,dtaa:0,notDtaa:0};
  if(!faOn())return;   /* FSI/TR/FA not applicable to an NRI */

  /* ---- ScheduleFSI ---- (four heads: HP, Business, CG, OS — no salary) ---- */
  const fsiArr=[];
  (C.fsi||[]).forEach(cr=>{
    if(!cr.code)return;    /* no country code -> row not considered */
    const el={};
    pf(el,"CountryName", cr.name||FSI_CONM[cr.code]||"");
    pf(el,"CountryCodeExcludingIndia", cr.code);
    pf(el,"TaxIdentificationNo", cr.tin);
    const bst=(S.fa.fsi||[]).find(b=>b.code===cr.code)||{};
    const obj=(sk,dtaa)=>{const h=(cr.heads||{})[sk]||{b:0,c:0,d:0,e:0};const o={};
      o.IncFrmOutsideInd=n0(h.b); o.TaxPaidOutsideInd=n0(h.c);
      o.TaxPayableinInd=n0(h.d);  o.TaxReliefinInd=n0(h.e);
      const art=sv((bst[sk]||{}).art);
      if(art&&dtaa)o.DTAAReliefUs90or90A=art;
      return o;};
    el.IncFromHP      =obj("hp",1);
    el.IncFromBusiness=obj("bus",1);
    el.IncCapGain     =obj("cg",1);
    el.IncOthSrc      =obj("os",1);
    const t=cr.tot||{b:0,c:0,d:0,e:0};
    el.TotalCountryWise={IncFrmOutsideInd:n0(t.b),TaxPaidOutsideInd:n0(t.c),
                         TaxPayableinInd:n0(t.d),TaxReliefinInd:n0(t.e)};
    fsiArr.push(el);
  });
  if(fsiArr.length)put(j,"ScheduleFSI.ScheduleFSIDtls",fsiArr);

  /* ---- ScheduleTR1 ---- (grand total key is TotalTaxOutsideIndia) ---- */
  const trArr=[];
  (C.trRows||[]).forEach(r=>{
    const el={};
    pf(el,"CountryName", r.name||FSI_CONM[r.code]||"");
    pf(el,"CountryCodeExcludingIndia", r.code);
    pf(el,"TaxIdentificationNo", r.tin);
    el.TaxPaidOutsideIndia=n0(r.paid);
    el.TaxReliefOutsideIndia=n0(r.relief);
    if(sv(r.sec))el.ReliefClaimedUsSection=r.sec;
    trArr.push(el);
  });
  if(trArr.length)put(j,"ScheduleTR1.ScheduleTR",trArr);
  if(trArr.length||C.reliefTot||C.paidTot){
    /* block-level required totals — present even at zero once TR is filed */
    put(j,"ScheduleTR1.TotalTaxOutsideIndia",n0(C.paidTot));
    put(j,"ScheduleTR1.TotalTaxReliefOutsideIndia",n0(C.reliefTot));
    put(j,"ScheduleTR1.TaxReliefOutsideIndiaDTAA",n0(C.dtaa));
    put(j,"ScheduleTR1.TaxReliefOutsideIndiaNotDTAA",n0(C.notDtaa));
    /* TaxPaidOutsideIndFlg is REQUIRED on ITR-7 — always written (default NO) */
    put(j,"ScheduleTR1.TaxPaidOutsideIndFlg", st0(S.fa.trFlag)||"NO");
    if(S.fa.trFlag==="YES"){
      if(N(S.fa.trAmt))put(j,"ScheduleTR1.AmtTaxRefunded",n0(S.fa.trAmt));
      if(sv(S.fa.trAY))put(j,"ScheduleTR1.AssmtYrTaxRelief",st0(S.fa.trAY));
    }
  }

  /* ---- ScheduleFA ---- (resident body only) ---- */
  const hasCode=r=>st0(r.code)!=="";
  const cc=(el,r)=>{pf(el,"CountryCodeExcludingIndia",r.code);pf(el,"CountryName",FA_CONM[r.code]||"");}; /* one FA name list */
  const S1=(el,r,fields)=>fields.forEach(f=>pf(el,f,sv(r[f])));           /* strings/enums — drop if empty */
  const NR=(el,r,fields)=>fields.forEach(f=>pf(el,f,n0(r[f])));           /* required numerics — present even at 0 */
  const NO=(el,r,fields)=>fields.forEach(f=>{if(N(r[f]))pf(el,f,n0(r[f]));}); /* optional numerics — only if non-zero */
  const D1=(el,r,map)=>Object.keys(map).forEach(k=>{const iso=ISO(r[map[k]]);if(iso)pf(el,k,iso);}); /* dates -> ISO */

  const a1=(S.fa.a1||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["Bankname","AddressOfBank","ZipCode","ForeignAccountNumber","OwnerStatus"]);
    D1(el,r,{AccOpenDate:"AccOpenDate"});
    NR(el,r,["PeakBalanceDuringYear","ClosingBalance","IntrstAccured"]);return el;});
  if(a1.length)put(j,"ScheduleFA.DetailsForiegnBank",a1);

  const a2=(S.fa.a2||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["FinancialInstName","FinancialInstAddress","ZipCode","AccountNumber","Status","NatureOfAmount"]);
    D1(el,r,{AccOpenDate:"AccOpenDate"});
    NR(el,r,["PeakBalanceDuringPeriod","ClosingBalance","GrossAmtPaidCredited"]);return el;});
  if(a2.length)put(j,"ScheduleFA.DtlsForeignCustodialAcc",a2);

  const a3=(S.fa.a3||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["NameOfEntity","AddressOfEntity","ZipCode","NatureOfEntity"]);
    D1(el,r,{InterestAcquiringDate:"InterestAcquiringDate"});
    NR(el,r,["InitialValOfInvstmnt","PeakBalanceDuringPeriod","ClosingBalance","TotGrossAmtPaidCredited","TotGrossProceeds"]);
    return el;});
  if(a3.length)put(j,"ScheduleFA.DtlsForeignEquityDebtInterest",a3);

  const a4=(S.fa.a4||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["FinancialInstName","FinancialInstAddress","ZipCode"]);
    D1(el,r,{ContractDate:"ContractDate"});
    NR(el,r,["CashValOrSurrenderVal","TotGrossAmtPaidCredited"]);
    return el;});
  if(a4.length)put(j,"ScheduleFA.DtlsForeignCashValueInsurance",a4);

  const b=(S.fa.b||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["ZipCode","NatureOfEntity","NameOfEntity","AddressOfEntity","NatureOfInt","NatureOfInc","IncTaxSch","IncTaxSchNo"]);
    D1(el,r,{DateHeld:"DateHeld"});
    NR(el,r,["TotalInvestment","IncFromInt","IncTaxAmt"]);return el;});
  if(b.length)put(j,"ScheduleFA.DetailsFinancialInterest",b);

  const c=(S.fa.c||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["ZipCode","AddressOfProperty","Ownership","NatureOfInc","IncTaxSch","IncTaxSchNo"]);
    D1(el,r,{DateOfAcq:"DateOfAcq"});
    NR(el,r,["TotalInvestment","IncDrvProperty","IncTaxAmt"]);return el;});
  if(c.length)put(j,"ScheduleFA.DetailsImmovableProperty",c);

  const d=(S.fa.d||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["ZipCode","NatureOfAsset","Ownership","NatureOfInc","IncTaxSch","IncTaxSchNo"]);
    D1(el,r,{DateOfAcq:"DateOfAcq"});
    NR(el,r,["TotalInvestment","IncDrvAsset","IncTaxAmt"]);return el;});
  if(d.length)put(j,"ScheduleFA.DetailsOthAssets",d);

  const e=(S.fa.e||[]).filter(r=>st0(r.NameOfInstitution)!=="").map(r=>{const el={};cc(el,r);
    S1(el,r,["NameOfInstitution","AddressOfInstitution","ZipCode","NameMentionedInAccnt","InstitutionAccountNumber","IncAccuredTaxFlag","IncOfferedSch","IncOfferedSchNo"]);
    NR(el,r,["PeakBalanceOrInvestment"]);
    NO(el,r,["IncAccuredInAcc","IncOfferedAmt"]);return el;});
  if(e.length)put(j,"ScheduleFA.DetailsOfAccntsHvngSigningAuth",e);

  const f=(S.fa.f||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["ZipCode","NameOfTrust","AddressOfTrust","NameOfOtherTrustees","AddressOfOtherTrustees","NameOfSettlor","AddressOfSettlor","NameOfBeneficiaries","AddressOfBeneficiaries","IncDrvTaxFlag","IncOfferedSch","IncOfferedSchNo"]);
    D1(el,r,{DateHeld:"DateHeld"});
    NO(el,r,["IncDrvFromTrust","IncOfferedAmt"]);return el;});
  if(f.length)put(j,"ScheduleFA.DetailsOfTrustOutIndiaTrustee",f);

  const g=(S.fa.g||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["ZipCode","NameOfPerson","AddressOfPerson","NatureOfInc","IncDrvTaxFlag","IncOfferedSch","IncOfferedSchNo"]);
    NO(el,r,["IncDerived","IncOfferedAmt"]);return el;});
  if(g.length)put(j,"ScheduleFA.DetailsOfOthSourcesIncOutsideIndia",g);
}

/* ================================================================
   IMPORT — impFa(I7)   (inverse of export; round-trip identity)
   ================================================================ */
function impFa(I7){
  const got=[];
  const toDMY=s=>dmy(s)||st0(s);

  /* ScheduleFSI + the section stored on TR */
  if(I7.ScheduleFSI&&Array.isArray(I7.ScheduleFSI.ScheduleFSIDtls)){
    const trSec={};((I7.ScheduleTR1||{}).ScheduleTR||[]).forEach(r=>{trSec[r.CountryCodeExcludingIndia]=r.ReliefClaimedUsSection;});
    const hd=o=>{o=o||{};return {b:nz(o.IncFrmOutsideInd),c:nz(o.TaxPaidOutsideInd),d:nz(o.TaxPayableinInd),art:o.DTAAReliefUs90or90A||""};};
    S.fa.fsi=I7.ScheduleFSI.ScheduleFSIDtls.map(el=>({
      code:el.CountryCodeExcludingIndia||"", name:el.CountryName||"", tin:el.TaxIdentificationNo||"",
      sec:trSec[el.CountryCodeExcludingIndia]||"",
      hp:hd(el.IncFromHP), bus:hd(el.IncFromBusiness),
      cg:hd(el.IncCapGain), os:hd(el.IncOthSrc)}));
    got.push("Schedule FSI");
  }
  /* ScheduleTR1 refund block */
  if(I7.ScheduleTR1){const T=I7.ScheduleTR1;
    S.fa.trFlag=T.TaxPaidOutsideIndFlg||""; S.fa.trAmt=nz(T.AmtTaxRefunded); S.fa.trAY=T.AssmtYrTaxRelief||"";
    got.push("Schedule TR");
  }
  /* ScheduleFA — nine tables */
  if(I7.ScheduleFA){const F=I7.ScheduleFA;
    const cc=r=>({code:r.CountryCodeExcludingIndia||""});
    const map=(arr,fn)=>(arr||[]).map(fn);
    S.fa.a1=map(F.DetailsForiegnBank,r=>Object.assign(cc(r),{Bankname:r.Bankname,AddressOfBank:r.AddressOfBank,ZipCode:r.ZipCode,ForeignAccountNumber:r.ForeignAccountNumber,OwnerStatus:r.OwnerStatus,AccOpenDate:toDMY(r.AccOpenDate),PeakBalanceDuringYear:nz(r.PeakBalanceDuringYear),ClosingBalance:nz(r.ClosingBalance),IntrstAccured:nz(r.IntrstAccured)}));
    S.fa.a2=map(F.DtlsForeignCustodialAcc,r=>Object.assign(cc(r),{FinancialInstName:r.FinancialInstName,FinancialInstAddress:r.FinancialInstAddress,ZipCode:r.ZipCode,AccountNumber:r.AccountNumber,Status:r.Status,AccOpenDate:toDMY(r.AccOpenDate),PeakBalanceDuringPeriod:nz(r.PeakBalanceDuringPeriod),ClosingBalance:nz(r.ClosingBalance),NatureOfAmount:r.NatureOfAmount,GrossAmtPaidCredited:nz(r.GrossAmtPaidCredited)}));
    S.fa.a3=map(F.DtlsForeignEquityDebtInterest,r=>Object.assign(cc(r),{NameOfEntity:r.NameOfEntity,AddressOfEntity:r.AddressOfEntity,ZipCode:r.ZipCode,NatureOfEntity:r.NatureOfEntity,InterestAcquiringDate:toDMY(r.InterestAcquiringDate),InitialValOfInvstmnt:nz(r.InitialValOfInvstmnt),PeakBalanceDuringPeriod:nz(r.PeakBalanceDuringPeriod),ClosingBalance:nz(r.ClosingBalance),TotGrossAmtPaidCredited:nz(r.TotGrossAmtPaidCredited),TotGrossProceeds:nz(r.TotGrossProceeds)}));
    S.fa.a4=map(F.DtlsForeignCashValueInsurance,r=>Object.assign(cc(r),{FinancialInstName:r.FinancialInstName,FinancialInstAddress:r.FinancialInstAddress,ZipCode:r.ZipCode,ContractDate:toDMY(r.ContractDate),CashValOrSurrenderVal:nz(r.CashValOrSurrenderVal),TotGrossAmtPaidCredited:nz(r.TotGrossAmtPaidCredited)}));
    S.fa.b=map(F.DetailsFinancialInterest,r=>Object.assign(cc(r),{ZipCode:r.ZipCode,NatureOfEntity:r.NatureOfEntity,NameOfEntity:r.NameOfEntity,AddressOfEntity:r.AddressOfEntity,NatureOfInt:r.NatureOfInt,DateHeld:toDMY(r.DateHeld),TotalInvestment:nz(r.TotalInvestment),IncFromInt:nz(r.IncFromInt),NatureOfInc:r.NatureOfInc,IncTaxAmt:nz(r.IncTaxAmt),IncTaxSch:r.IncTaxSch,IncTaxSchNo:r.IncTaxSchNo}));
    S.fa.c=map(F.DetailsImmovableProperty,r=>Object.assign(cc(r),{ZipCode:r.ZipCode,AddressOfProperty:r.AddressOfProperty,Ownership:r.Ownership,DateOfAcq:toDMY(r.DateOfAcq),TotalInvestment:nz(r.TotalInvestment),IncDrvProperty:nz(r.IncDrvProperty),NatureOfInc:r.NatureOfInc,IncTaxAmt:nz(r.IncTaxAmt),IncTaxSch:r.IncTaxSch,IncTaxSchNo:r.IncTaxSchNo}));
    S.fa.d=map(F.DetailsOthAssets,r=>Object.assign(cc(r),{ZipCode:r.ZipCode,NatureOfAsset:r.NatureOfAsset,Ownership:r.Ownership,DateOfAcq:toDMY(r.DateOfAcq),TotalInvestment:nz(r.TotalInvestment),IncDrvAsset:nz(r.IncDrvAsset),NatureOfInc:r.NatureOfInc,IncTaxAmt:nz(r.IncTaxAmt),IncTaxSch:r.IncTaxSch,IncTaxSchNo:r.IncTaxSchNo}));
    S.fa.e=map(F.DetailsOfAccntsHvngSigningAuth,r=>Object.assign(cc(r),{NameOfInstitution:r.NameOfInstitution,AddressOfInstitution:r.AddressOfInstitution,ZipCode:r.ZipCode,NameMentionedInAccnt:r.NameMentionedInAccnt,InstitutionAccountNumber:r.InstitutionAccountNumber,PeakBalanceOrInvestment:nz(r.PeakBalanceOrInvestment),IncAccuredTaxFlag:r.IncAccuredTaxFlag,IncAccuredInAcc:nz(r.IncAccuredInAcc),IncOfferedAmt:nz(r.IncOfferedAmt),IncOfferedSch:r.IncOfferedSch,IncOfferedSchNo:r.IncOfferedSchNo}));
    S.fa.f=map(F.DetailsOfTrustOutIndiaTrustee,r=>Object.assign(cc(r),{ZipCode:r.ZipCode,NameOfTrust:r.NameOfTrust,AddressOfTrust:r.AddressOfTrust,NameOfOtherTrustees:r.NameOfOtherTrustees,AddressOfOtherTrustees:r.AddressOfOtherTrustees,NameOfSettlor:r.NameOfSettlor,AddressOfSettlor:r.AddressOfSettlor,NameOfBeneficiaries:r.NameOfBeneficiaries,AddressOfBeneficiaries:r.AddressOfBeneficiaries,DateHeld:toDMY(r.DateHeld),IncDrvTaxFlag:r.IncDrvTaxFlag,IncDrvFromTrust:nz(r.IncDrvFromTrust),IncOfferedAmt:nz(r.IncOfferedAmt),IncOfferedSch:r.IncOfferedSch,IncOfferedSchNo:r.IncOfferedSchNo}));
    S.fa.g=map(F.DetailsOfOthSourcesIncOutsideIndia,r=>Object.assign(cc(r),{ZipCode:r.ZipCode,NameOfPerson:r.NameOfPerson,AddressOfPerson:r.AddressOfPerson,IncDerived:nz(r.IncDerived),NatureOfInc:r.NatureOfInc,IncDrvTaxFlag:r.IncDrvTaxFlag,IncOfferedAmt:nz(r.IncOfferedAmt),IncOfferedSch:r.IncOfferedSch,IncOfferedSchNo:r.IncOfferedSchNo}));
    got.push("Schedule FA");
  }
  return got;
}

/* ================================================================
   CHECKS — chkFa()   (this section's own screen validations)
   ================================================================ */
function chkFa(){
  const out=[];
  const C=S.C.fa||{fsi:[],trRows:[],reliefTot:0};
  const anyFsi=(S.fa.fsi||[]).length>0;
  const fc=faCount();

  /* Not applicable to an NRI (FSI/TR/FA) */
  if(!faOn()){
    if(anyFsi||fc>0)
      out.push({lvl:"err",t:"Foreign schedules not applicable",
        m:"Residential status is NRI. Schedules FSI, TR and FA are available only for a resident — remove the foreign entries or correct the residential status.",sec:"fa"});
    return out.length?out:[{lvl:"ok",t:"Foreign income & assets",m:"Not applicable to a non-resident.",sec:"fa"}];
  }

  /* FSI: country-code note; TIN per country block; relief section */
  (S.fa.fsi||[]).forEach((b,i)=>{
    const t=(C.fsi||[])[i]||{tot:{b:0,c:0,d:0}};
    const anyVal=(t.tot.b||t.tot.c||t.tot.d);
    if(!b.code&&anyVal)
      out.push({lvl:"warn",t:"FSI country "+(i+1)+" has no Country Code",
        m:"Figures are entered but no Country/Region Code is chosen — the utility ignores a row with a blank Country Code. Pick a country or clear the row.",sec:"fa"});
    if(b.code&&!st0(b.tin)&&anyVal)
      out.push({lvl:"warn",t:"FSI country "+(i+1)+" missing TIN",
        m:"Taxpayer Identification Number is required for each FSI country block.",sec:"fa"});
    if(b.code&&anyVal&&!st0(b.sec))
      out.push({lvl:"warn",t:"FSI country "+(i+1)+" missing relief section",
        m:"Choose the section under which relief is claimed (90 / 90A / 91) — it decides whether the relief goes to the DTAA or the non-DTAA total in Schedule TR.",sec:"fa"});
  });

  /* (e)=MIN(c,d): flag a head where tax was paid abroad but (d) is nil, so relief is 0 */
  (C.fsi||[]).forEach((cr,i)=>{
    ["hp","bus","cg","os"].forEach(k=>{const h=(cr.heads||{})[k]||{};
      if(n0(h.c)>0&&n0(h.d)===0)
        out.push({lvl:"warn",t:"No relief for country "+(i+1),
          m:"Tax was paid outside India on a head but tax payable in India (d) is nil, so relief (e)=min(c,d)=0. Enter (d) at the average Indian rate on that income.",sec:"fa"});
    });
  });

  /* TR refund clawback follow-up */
  if(S.fa.trFlag==="YES"){
    if(!N(S.fa.trAmt))out.push({lvl:"warn",t:"Refund amount missing",m:"You answered that foreign tax relief was refunded — enter the amount of tax refunded.",sec:"fa"});
    if(!st0(S.fa.trAY))out.push({lvl:"warn",t:"Refund AY missing",m:"Enter the assessment year in which the relief was allowed in India.",sec:"fa"});
  }

  /* FA where-offered pointer completeness (B/C/D require schedule + item no.) */
  [["b","B"],["c","C"],["d","D"]].forEach(pair=>{
    (S.fa[pair[0]]||[]).forEach((r,i)=>{
      if(st0(r.code)===""&&(N(r.TotalInvestment)||N(r.IncTaxAmt)))
        out.push({lvl:"warn",t:"FA "+pair[1]+" row "+(i+1)+" has no Country Code",
          m:"A row with values but no Country/Region Code is ignored by the utility — pick a country or clear the row.",sec:"fa"});
      else if(st0(r.code)!==""&&(!st0(r.IncTaxSch)||!st0(r.IncTaxSchNo)))
        out.push({lvl:"warn",t:"FA "+pair[1]+" row "+(i+1)+" incomplete",
          m:"Table "+pair[1]+" requires the schedule where the income is offered and its item number.",sec:"fa"});
    });
  });

  if(!out.length){
    out.push({lvl:"ok",t:"Foreign income & assets",
      m:(anyFsi||fc)?("FSI/TR relief "+RS(C.reliefTot||0)+"; FA rows "+fc+"."):"No foreign income, relief or assets.",sec:"fa"});
  }
  return out;
}

/* ================================================================
   REGISTER
   ================================================================ */
reg({id:"fa", t:"Foreign income & assets", ref:"Schedule FSI · TR · FA",
     f:secFa, s:()=>{const C=S.C.fa||{};const rel=C.reliefTot||0;
       return rel?RS(rel)+" foreign-tax relief":"No foreign income/assets";},
     eng:engFa, exp:expFa, imp:impFa, chk:chkFa, order:160, corder:58});
