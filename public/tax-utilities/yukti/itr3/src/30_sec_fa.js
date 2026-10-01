/* =====================================================================
   ITR-3 · Section "fa" — Foreign income and assets
   Books: books/ITR-3/FSI.md  (Schedule FSI)
          books/ITR-3/TR_FA.md (Schedule TR · Schedule FA)
   Schema blocks: ScheduleFSI, ScheduleTR1, ScheduleFA
   Compute order 26.

   REGIME NOTE (books/ITR-3/REGIME.md, line "…all income heads and their
   computation; taxes paid; exempt income; foreign assets; AL. Only the
   concessions close, not the income side."): foreign-tax relief (FSI/TR)
   and the foreign-asset disclosure (FA) are NOT closed by the new regime
   u/s 115BAC. Nothing in this section is regime-gated; isNew() therefore
   does not open/close any item here, and eng zeroes nothing on regime.

   GTI NOTE: Schedule FSI "does not add income — the amounts in column (b)
   are already in Part B-TI" (FSI.md, The shape). So this head contributes
   0 to Gross Total Income. S.C.fa.income = 0. Its output is tax relief
   (feeds Part B-TTI, not GTI) and the informational FA tables.

   RESIDENCE GATE (S.fs.resStatus: RES / NOR / NRI):
   - FSI & TR: "available only in case of resident" / "not applicable if
     residential status is non resident" — apply for RES and NOR, off NRI.
   - FA: "not Applicable for NRI … resident-and-ordinarily-resident only
     (not NRI, not RNOR)" — applies for RES only.
   ===================================================================== */

/* ---- state ---- */
S.fa = S.fa || {
  fsi:[],                 /* ScheduleFSIDtls[] — one per country */
  trFlag:"", trAmt:"", trAY:"",   /* TR refund block (rows 14/13/16) */
  a1:[], a2:[], a3:[], a4:[],     /* FA depository / custodial / equity / insurance */
  b:[], c:[], d:[], e:[], f:[], g:[]  /* FA financial-interest / immovable / other / signing / trust / other-income */
};

/* ---- country list: FSI_newcountrycod / Country_NoIndia, India excluded
   (verbatim from FSI.md dropdown; value = code, label = NAME) ---- */
const FA_CO=[["93","AFGHANISTAN"],["1001","ALAND ISLANDS"],["355","ALBANIA"],["213","ALGERIA"],["684","AMERICAN SAMOA"],["376","ANDORRA"],["244","ANGOLA"],["1264","ANGUILLA"],["1010","ANTARCTICA"],["1268","ANTIGUA AND BARBUDA"],["54","ARGENTINA"],["374","ARMENIA"],["297","ARUBA"],["61","AUSTRALIA"],["43","AUSTRIA"],["994","AZERBAIJAN"],["1242","BAHAMAS"],["973","BAHRAIN"],["880","BANGLADESH"],["1246","BARBADOS"],["375","BELARUS"],["32","BELGIUM"],["501","BELIZE"],["229","BENIN"],["1441","BERMUDA"],["975","BHUTAN"],["591","BOLIVIA (PLURINATIONAL STATE OF)"],["1002","BONAIRE, SINT EUSTATIUS AND SABA"],["387","BOSNIA AND HERZEGOVINA"],["267","BOTSWANA"],["1003","BOUVET ISLAND"],["55","BRAZIL"],["1014","BRITISH INDIAN OCEAN TERRITORY"],["673","BRUNEI DARUSSALAM"],["359","BULGARIA"],["226","BURKINA FASO"],["257","BURUNDI"],["238","CABO VERDE"],["855","CAMBODIA"],["237","CAMEROON"],["1","CANADA"],["1345","CAYMAN ISLANDS"],["236","CENTRAL AFRICAN REPUBLIC"],["235","CHAD"],["56","CHILE"],["86","CHINA"],["9","CHRISTMAS ISLAND"],["672","COCOS (KEELING) ISLANDS"],["57","COLOMBIA"],["270","COMOROS"],["242","CONGO"],["243","CONGO (DEMOCRATIC REPUBLIC OF THE)"],["682","COOK ISLANDS"],["506","COSTA RICA"],["225","COTE DIVOIRE"],["385","CROATIA"],["53","CUBA"],["1015","CURACAO"],["357","CYPRUS"],["420","CZECHIA"],["45","DENMARK"],["253","DJIBOUTI"],["1767","DOMINICA"],["1809","DOMINICAN REPUBLIC"],["593","ECUADOR"],["20","EGYPT"],["503","EL SALVADOR"],["240","EQUATORIAL GUINEA"],["291","ERITREA"],["372","ESTONIA"],["251","ETHIOPIA"],["500","FALKLAND ISLANDS (MALVINAS)"],["298","FAROE ISLANDS"],["679","FIJI"],["358","FINLAND"],["33","FRANCE"],["594","FRENCH GUIANA"],["689","FRENCH POLYNESIA"],["1004","FRENCH SOUTHERN TERRITORIES"],["241","GABON"],["220","GAMBIA"],["995","GEORGIA"],["49","GERMANY"],["233","GHANA"],["350","GIBRALTAR"],["30","GREECE"],["299","GREENLAND"],["1473","GRENADA"],["590","GUADELOUPE"],["1671","GUAM"],["502","GUATEMALA"],["1481","GUERNSEY"],["224","GUINEA"],["245","GUINEA-BISSAU"],["592","GUYANA"],["509","HAITI"],["1005","HEARD ISLAND AND MCDONALD ISLANDS"],["6","HOLY SEE"],["504","HONDURAS"],["852","HONG KONG"],["36","HUNGARY"],["354","ICELAND"],["62","INDONESIA"],["98","IRAN (ISLAMIC REPUBLIC OF)"],["964","IRAQ"],["353","IRELAND"],["1624","ISLE OF MAN"],["972","ISRAEL"],["5","ITALY"],["1876","JAMAICA"],["81","JAPAN"],["1534","JERSEY"],["962","JORDAN"],["7","KAZAKHSTAN"],["254","KENYA"],["686","KIRIBATI"],["850","KOREA (DEMOCRATIC PEOPLES REPUBLIC OF)"],["82","KOREA (REPUBLIC OF)"],["965","KUWAIT"],["996","KYRGYZSTAN"],["856","LAO PEOPLES DEMOCRATIC REPUBLIC"],["371","LATVIA"],["961","LEBANON"],["266","LESOTHO"],["231","LIBERIA"],["218","LIBYA"],["423","LIECHTENSTEIN"],["370","LITHUANIA"],["352","LUXEMBOURG"],["853","MACAO"],["389","MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)"],["261","MADAGASCAR"],["265","MALAWI"],["60","MALAYSIA"],["960","MALDIVES"],["223","MALI"],["356","MALTA"],["692","MARSHALL ISLANDS"],["596","MARTINIQUE"],["222","MAURITANIA"],["230","MAURITIUS"],["269","MAYOTTE"],["52","MEXICO"],["691","MICRONESIA (FEDERATED STATES OF)"],["373","MOLDOVA (REPUBLIC OF)"],["377","MONACO"],["976","MONGOLIA"],["382","MONTENEGRO"],["1664","MONTSERRAT"],["212","MOROCCO"],["258","MOZAMBIQUE"],["95","MYANMAR"],["264","NAMIBIA"],["674","NAURU"],["977","NEPAL"],["31","NETHERLANDS"],["687","NEW CALEDONIA"],["64","NEW ZEALAND"],["505","NICARAGUA"],["227","NIGER"],["234","NIGERIA"],["683","NIUE"],["15","NORFOLK ISLAND"],["1670","NORTHERN MARIANA ISLANDS"],["47","NORWAY"],["968","OMAN"],["92","PAKISTAN"],["680","PALAU"],["970","PALESTINE, STATE OF"],["507","PANAMA"],["675","PAPUA NEW GUINEA"],["595","PARAGUAY"],["51","PERU"],["63","PHILIPPINES"],["1011","PITCAIRN"],["48","POLAND"],["14","PORTUGAL"],["1787","PUERTO RICO"],["974","QATAR"],["262","REUNION"],["40","ROMANIA"],["8","RUSSIAN FEDERATION"],["250","RWANDA"],["1006","SAINT BARTHELEMY"],["290","SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA"],["1869","SAINT KITTS AND NEVIS"],["1758","SAINT LUCIA"],["1007","SAINT MARTIN (FRENCH PART)"],["508","SAINT PIERRE AND MIQUELON"],["1784","SAINT VINCENT AND THE GRENADINES"],["685","SAMOA"],["378","SAN MARINO"],["239","SAO TOME AND PRINCIPE"],["966","SAUDI ARABIA"],["221","SENEGAL"],["381","SERBIA"],["248","SEYCHELLES"],["232","SIERRA LEONE"],["65","SINGAPORE"],["1721","SINT MAARTEN (DUTCH PART)"],["421","SLOVAKIA"],["386","SLOVENIA"],["677","SOLOMON ISLANDS"],["252","SOMALIA"],["28","SOUTH AFRICA"],["1008","SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS"],["211","SOUTH SUDAN"],["35","SPAIN"],["94","SRI LANKA"],["249","SUDAN"],["597","SURINAME"],["1012","SVALBARD AND JAN MAYEN"],["268","SWAZILAND"],["46","SWEDEN"],["41","SWITZERLAND"],["963","SYRIAN ARAB REPUBLIC"],["886","TAIWAN, PROVINCE OF CHINA[A]"],["992","TAJIKISTAN"],["255","TANZANIA, UNITED REPUBLIC OF"],["66","THAILAND"],["670","TIMOR-LESTE (EAST TIMOR)"],["228","TOGO"],["690","TOKELAU"],["676","TONGA"],["1868","TRINIDAD AND TOBAGO"],["216","TUNISIA"],["90","TURKEY"],["993","TURKMENISTAN"],["1649","TURKS AND CAICOS ISLANDS"],["688","TUVALU"],["256","UGANDA"],["380","UKRAINE"],["971","UNITED ARAB EMIRATES"],["44","UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND"],["2","UNITED STATES OF AMERICA"],["1009","UNITED STATES MINOR OUTLYING ISLANDS"],["598","URUGUAY"],["998","UZBEKISTAN"],["678","VANUATU"],["58","VENEZUELA (BOLIVARIAN REPUBLIC OF)"],["84","VIET NAM"],["1284","VIRGIN ISLANDS (BRITISH)"],["1340","VIRGIN ISLANDS (U.S.)"],["681","WALLIS AND FUTUNA"],["1013","WESTERN SAHARA"],["967","YEMEN"],["260","ZAMBIA"],["263","ZIMBABWE"],["9999","OTHERS"]];
const FA_CONM={};FA_CO.forEach(x=>FA_CONM[x[0]]=x[1]);

/* ---- enumerations (books/ITR-3/enums.json, verbatim value pairs) ---- */
const FA_OWN3=[["OWNER","OWNER"],["BENEFICIAL_OWNER","BENEFICIAL_OWNER"],["BENIFICIARY","BENIFICIARY"]];      /* A1/A2 status */
const FA_DIR3=[["DIRECT","DIRECT"],["BENEFICIAL_OWNER","BENEFICIAL_OWNER"],["BENIFICIARY","BENIFICIARY"]];      /* B/C/D nature/ownership */
const FA_NAMT=[["I","Interest"],["D","Dividend"],["S","Proceeds from sale or redemption of financial assets"],["O","Other income"],["N","No Amount paid/credited"]]; /* A2 NatureOfAmount */
const FA_OFF=[["SA","Salary"],["HP","House Property"],["BU","Business"],["CG","Capital Gains"],["OS","Other Sources"],["EI","Exempt Income"],["NI","No Income during the year"]]; /* where offered */
const FA_YN=[["Y","Yes"],["N","No"]];                 /* E/F/G taxable flags */
const FA_RELSEC=[["90","90"],["90A","90A"],["91","91"]];   /* TR relief section */
const FA_REFFLAG=[["YES","YES"],["NO","NO"]];              /* TR refund flag */

/* ================================================================
   ENGINE — eng<Id>()
   ================================================================ */
function engFa(){
  const C=S.C.fa={income:0, fsi:[], trRows:[], paidTot:0, reliefTot:0, dtaa:0, notDtaa:0};
  /* GTI contribution — foreign income is already inside Part B-TI (FSI.md).
     This head adds nothing to Gross Total Income. */
  C.income=0;

  const res=(S.fs||{}).resStatus||"RES";
  const fsiOn=(res==="RES"||res==="NOR");   /* FSI/TR only for residents */
  /* whether Schedule FA is actually filled (RES-only, any asset row) — drives
     Part B-TTI AssetOutIndiaFlag so a filer with no foreign assets exports "NO"
     (rule A901: flag YES ⟺ Schedule FA present). */
  C.hasFA=(res==="RES") && ["a1","a2","a3","a4","b","c","d","e","f","g"]
    .reduce((a,k)=>a+((S.fa[k]||[]).length),0) > 0;

  if(!fsiOn){S.fa.fsi=S.fa.fsi||[];return;} /* NRI: schedule not applicable — nothing computed */

  (S.fa.fsi||[]).forEach(blk=>{
    const heads=["sal","hp","bus","cg","os"];
    let tb=0,tc=0,td=0,te=0;
    const hc={};
    heads.forEach(k=>{
      const h=blk[k]||{};
      const b=n0(h.b), c=n0(h.c), d=n0(h.d);
      const e=Math.min(c,d);            /* [L7]=MIN(J7,K7): relief = lower of (c) tax paid, (d) tax payable */
      hc[k]={b,c,d,e};
      tb+=b; tc+=c; td+=d; te+=e;       /* [I12..L12]=SUM of the five heads for b,c,d,e */
    });
    const rowC={code:blk.code||"", name:FA_CONM[blk.code]||blk.name||"", tin:blk.tin||"",
                sec:blk.sec||"", heads:hc, tot:{b:tb,c:tc,d:td,e:te}};
    C.fsi.push(rowC);
    /* Schedule TR row is generated from FSI per country:
       (c) = country total tax paid outside India; (d) = country total relief (e) */
    if(blk.code){
      C.trRows.push({code:blk.code, name:FA_CONM[blk.code]||blk.name||"", tin:blk.tin||"",
                     paid:tc, relief:te, sec:blk.sec||""});
    }
  });

  /* TR totals (TR_FA.md rules) */
  C.paidTot   = C.trRows.reduce((a,r)=>a+n0(r.paid),0);     /* [G11]=SUM(TR_TaxPaidOutsideIndia) */
  C.reliefTot = C.trRows.reduce((a,r)=>a+n0(r.relief),0);   /* [H11]=SUM(TR_TaxReliefOutsideIndia) */
  C.notDtaa   = C.trRows.reduce((a,r)=>a+(r.sec==="91"?n0(r.relief):0),0); /* [J14]=SUMIF section="91" */
  C.dtaa      = Math.max(C.reliefTot - C.notDtaa, 0);       /* [J13]=MAX(total - notDtaa,0) */
}

/* ================================================================
   RENDERER — sec<Id>()
   ================================================================ */
function secFa(){
  const res=(S.fs||{}).resStatus||"RES";
  const C=S.C.fa||{fsi:[],trRows:[],paidTot:0,reliefTot:0,dtaa:0,notDtaa:0};

  if(res==="NRI")
    return note("<b>Not applicable.</b> Schedules FSI, TR and FA are not applicable when the residential status is Non-Resident (NRI). Set residential status to Resident under <i>Who is filing</i> to fill foreign income, tax relief and foreign assets.","form");

  let H="";

  /* ---------- Schedule FSI ---------- */
  let fsiInner=note("Details of income from outside India and tax relief (available only in case of resident). The amounts in (b) are already included in Part B-TI — this schedule identifies that slice and computes the foreign-tax relief. Column (e) = lower of (c) tax paid outside India and (d) tax payable in India. If no Country Code is entered, the row is not considered.");
  const HEADS=[["sal","i","Salary"],["hp","ii","House Property"],["bus","iii","Business or Profession"],["cg","iv","Capital Gains"],["os","v","Other Sources"]];
  (S.fa.fsi||[]).forEach((blk,i)=>{
    const cr=(C.fsi||[])[i]||{heads:{},tot:{b:0,c:0,d:0,e:0}};
    let t='<div class="full"><table class="gt" style="min-width:920px"><thead><tr>'+
      '<th class="l">Head of income (a)</th>'+
      '<th>Income from outside India (b)</th>'+
      '<th>Tax paid outside India (c)</th>'+
      '<th>Tax payable in India (d)</th>'+
      '<th>Tax relief (e)=min(c,d)</th>'+
      '<th class="l">DTAA article u/s 90/90A (f)</th></tr></thead><tbody>';
    HEADS.forEach(hd=>{const k=hd[0], p="fa.fsi."+i+"."+k, hc=(cr.heads||{})[k]||{e:0};
      t+='<tr><td class="l">'+hd[1]+' — '+esc(hd[2])+'</td>'+
        '<td>'+inp(p+".b",{n:1})+'</td>'+
        '<td>'+inp(p+".c",{n:1})+'</td>'+
        '<td>'+inp(p+".d",{n:1})+'</td>'+
        '<td class="num">'+cell(hc.e)+'</td>'+
        '<td class="l">'+inp(p+".art",{max:16,ph:"Article"})+'</td></tr>';});
    const tt=cr.tot||{b:0,c:0,d:0,e:0};
    t+='<tr><td class="l"><b>Total (i+ii+iii+iv+v)</b></td>'+
       '<td class="num">'+cell(tt.b)+'</td><td class="num">'+cell(tt.c)+'</td>'+
       '<td class="num">'+cell(tt.d)+'</td><td class="num">'+cell(tt.e)+'</td><td></td></tr>';
    t+='</tbody></table></div>';
    const head=row("Country Code",sel("fa.fsi."+i+".code",FA_CO),{req:1})+
      row("Taxpayer Identification Number",inp("fa.fsi."+i+".tin",{max:75}),{req:1})+
      row("Section under which relief claimed",sel("fa.fsi."+i+".sec",FA_RELSEC),{hint:"90 / 90A (DTAA) or 91 (no DTAA) — carried to Schedule TR"});
    const nm=blk.code?(FA_CONM[blk.code]||blk.code):"New country";
    fsiInner+=blk_("fsi"+i, "Country "+(i+1)+" — "+esc(nm), tt.e?RS(tt.e)+" relief":"—", head+t, "fa.fsi."+i);
  });
  fsiInner+='<button class="add" data-add="fa.fsi">Add a country</button>';
  H+=fold("fa_fsi","Schedule FSI","Income from outside India & tax relief",
      (C.fsi||[]).length?(C.fsi.length+" country"+(C.fsi.length>1?"ies":"")):"None", fsiInner, {def:true});

  /* ---------- Schedule TR ---------- */
  let trTbl;
  if((C.trRows||[]).length){
    trTbl='<div class="full"><table class="gt" style="min-width:760px"><thead><tr>'+
      '<th class="l">Country (a)</th><th class="l">TIN (b)</th>'+
      '<th>Taxes paid outside India (c)</th><th>Tax relief available (d)</th>'+
      '<th class="l">Relief section (e)</th></tr></thead><tbody>';
    (C.trRows||[]).forEach((r,i)=>{
      /* which FSI block owns this country — its 'sec' drives the section dropdown */
      let fi=-1;(S.fa.fsi||[]).forEach((b,j)=>{if(fi<0&&b.code===r.code)fi=j;});
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
    row("2 · Total relief where DTAA applies (section 90/90A)",cell(C.dtaa),{hint:"MAX(total relief − section-91 relief, 0)"})+
    row("3 · Total relief where DTAA does not apply (section 91)",cell(C.notDtaa),{hint:"sum of (d) wherever section 91 is selected"})+
    row("4 · Any tax paid outside India, on which relief was allowed, refunded/credited by the foreign authority this year?",
        sel("fa.trFlag",FA_REFFLAG));
  if(S.fa.trFlag==="YES"){
    trInner+=row("4a · Amount of tax refunded",inp("fa.trAmt",{n:1}))+
             row("4b · Assessment year in which relief was allowed in India",inp("fa.trAY",{max:9,ph:"YYYY-YY"}));
  }
  H+=fold("fa_tr","Schedule TR","Summary of tax relief for taxes paid outside India",
      C.reliefTot?RS(C.reliefTot)+" relief":"—", trInner, {def:false});

  /* ---------- Schedule FA ---------- */
  let faInner;
  if(res!=="RES"){
    faInner=note("<b>Not applicable.</b> Schedule FA (foreign assets) is to be filled only by a person <b>resident and ordinarily resident</b>. It is not applicable to Non-Residents or to Resident-but-Not-Ordinarily-Resident (RNOR).","form");
  } else {
    faInner=note("Details of foreign assets and income from any source outside India, held at any time during the calendar year 1 Jan – 31 Dec 2025. If no Country Code is entered in a row, that row is not considered. <br><b>Note:</b> an individual, not being an Indian citizen, in India on a business, employment or student visa need not report an asset acquired while non-resident if no income is derived from it in the current year.");

    /* A1 — Foreign Depository Accounts */
    faInner+=fold("fa_a1","A1","Foreign Depository Accounts", cnt(S.fa.a1),
      grid("fa.a1",[
        {h:"Country",k:"code",t:"sel",opts:FA_CO},
        {h:"Financial institution",k:"Bankname",t:"txt"},
        {h:"Address",k:"AddressOfBank",t:"txt"},
        {h:"ZIP",k:"ZipCode",t:"txt"},
        {h:"Account no.",k:"ForeignAccountNumber",t:"txt"},
        {h:"Status",k:"OwnerStatus",t:"sel",opts:FA_OWN3},
        {h:"Opened",k:"AccOpenDate",t:"date"},
        {h:"Peak balance (₹)",k:"PeakBalanceDuringYear",t:"num"},
        {h:"Closing balance",k:"ClosingBalance",t:"num"},
        {h:"Gross interest",k:"IntrstAccured",t:"num"}
      ],S.fa.a1,{min:"1200px",empty:"No foreign depository accounts.",add:"Add a depository account"}),{def:false});

    /* A2 — Foreign Custodial Accounts */
    faInner+=fold("fa_a2","A2","Foreign Custodial Accounts", cnt(S.fa.a2),
      grid("fa.a2",[
        {h:"Country",k:"code",t:"sel",opts:FA_CO},
        {h:"Financial institution",k:"FinancialInstName",t:"txt"},
        {h:"Address",k:"FinancialInstAddress",t:"txt"},
        {h:"ZIP",k:"ZipCode",t:"txt"},
        {h:"Account no.",k:"AccountNumber",t:"txt"},
        {h:"Status",k:"Status",t:"sel",opts:FA_OWN3},
        {h:"Opened",k:"AccOpenDate",t:"date"},
        {h:"Peak balance (₹)",k:"PeakBalanceDuringPeriod",t:"num"},
        {h:"Closing balance",k:"ClosingBalance",t:"num"},
        {h:"Nature of amount",k:"NatureOfAmount",t:"sel",opts:FA_NAMT},
        {h:"Gross amount",k:"GrossAmtPaidCredited",t:"num"}
      ],S.fa.a2,{min:"1300px",empty:"No foreign custodial accounts.",add:"Add a custodial account"}),{def:false});

    /* A3 — Foreign Equity & Debt Interest */
    faInner+=fold("fa_a3","A3","Foreign Equity and Debt Interest", cnt(S.fa.a3),
      grid("fa.a3",[
        {h:"Country",k:"code",t:"sel",opts:FA_CO},
        {h:"Name of entity",k:"NameOfEntity",t:"txt"},
        {h:"Address",k:"AddressOfEntity",t:"txt"},
        {h:"ZIP",k:"ZipCode",t:"txt"},
        {h:"Nature of entity",k:"NatureOfEntity",t:"txt"},
        {h:"Acquired on",k:"InterestAcquiringDate",t:"date"},
        {h:"Initial value (₹)",k:"InitialValOfInvstmnt",t:"num"},
        {h:"Peak value",k:"PeakBalanceDuringPeriod",t:"num"},
        {h:"Closing balance",k:"ClosingBalance",t:"num"},
        {h:"Gross amount paid",k:"TotGrossAmtPaidCredited",t:"num"},
        {h:"Gross sale proceeds",k:"TotGrossProceeds",t:"num"}
      ],S.fa.a3,{min:"1300px",empty:"No foreign equity/debt interest.",add:"Add an equity/debt interest"}),{def:false});

    /* A4 — Foreign Cash Value Insurance / Annuity */
    faInner+=fold("fa_a4","A4","Foreign Cash Value Insurance / Annuity", cnt(S.fa.a4),
      grid("fa.a4",[
        {h:"Country",k:"code",t:"sel",opts:FA_CO},
        {h:"Financial institution",k:"FinancialInstName",t:"txt"},
        {h:"Address",k:"FinancialInstAddress",t:"txt"},
        {h:"ZIP",k:"ZipCode",t:"txt"},
        {h:"Date of contract",k:"ContractDate",t:"date"},
        {h:"Cash / surrender value (₹)",k:"CashValOrSurrenderVal",t:"num"},
        {h:"Gross amount paid",k:"TotGrossAmtPaidCredited",t:"num"}
      ],S.fa.a4,{min:"1000px",empty:"No insurance/annuity contracts.",add:"Add a contract"}),{def:false});

    /* B — Financial Interest in any Entity */
    faInner+=fold("fa_b","B","Financial Interest in any Entity", cnt(S.fa.b),
      grid("fa.b",[
        {h:"Country",k:"code",t:"sel",opts:FA_CO},
        {h:"ZIP",k:"ZipCode",t:"txt"},
        {h:"Nature of entity",k:"NatureOfEntity",t:"txt"},
        {h:"Name of entity",k:"NameOfEntity",t:"txt"},
        {h:"Address",k:"AddressOfEntity",t:"txt"},
        {h:"Nature of interest",k:"NatureOfInt",t:"sel",opts:FA_DIR3},
        {h:"Held since",k:"DateHeld",t:"date"},
        {h:"Total investment (₹)",k:"TotalInvestment",t:"num"},
        {h:"Income accrued",k:"IncFromInt",t:"num"},
        {h:"Nature of income",k:"NatureOfInc",t:"txt"},
        {h:"Income offered (₹)",k:"IncTaxAmt",t:"num"},
        {h:"Schedule",k:"IncTaxSch",t:"sel",opts:FA_OFF},
        {h:"Item no.",k:"IncTaxSchNo",t:"txt"}
      ],S.fa.b,{min:"1500px",empty:"No financial interest.",add:"Add a financial interest"}),{def:false});

    /* C — Immovable Property */
    faInner+=fold("fa_c","C","Immovable Property", cnt(S.fa.c),
      grid("fa.c",[
        {h:"Country",k:"code",t:"sel",opts:FA_CO},
        {h:"ZIP",k:"ZipCode",t:"txt"},
        {h:"Address of property",k:"AddressOfProperty",t:"txt"},
        {h:"Ownership",k:"Ownership",t:"sel",opts:FA_DIR3},
        {h:"Acquired on",k:"DateOfAcq",t:"date"},
        {h:"Total investment (₹)",k:"TotalInvestment",t:"num"},
        {h:"Income derived",k:"IncDrvProperty",t:"num"},
        {h:"Nature of income",k:"NatureOfInc",t:"txt"},
        {h:"Income offered (₹)",k:"IncTaxAmt",t:"num"},
        {h:"Schedule",k:"IncTaxSch",t:"sel",opts:FA_OFF},
        {h:"Item no.",k:"IncTaxSchNo",t:"txt"}
      ],S.fa.c,{min:"1400px",empty:"No immovable property.",add:"Add an immovable property"}),{def:false});

    /* D — Any other Capital Asset */
    faInner+=fold("fa_d","D","Any other Capital Asset", cnt(S.fa.d),
      grid("fa.d",[
        {h:"Country",k:"code",t:"sel",opts:FA_CO},
        {h:"ZIP",k:"ZipCode",t:"txt"},
        {h:"Nature of asset",k:"NatureOfAsset",t:"txt"},
        {h:"Ownership",k:"Ownership",t:"sel",opts:FA_DIR3},
        {h:"Acquired on",k:"DateOfAcq",t:"date"},
        {h:"Total investment (₹)",k:"TotalInvestment",t:"num"},
        {h:"Income derived",k:"IncDrvAsset",t:"num"},
        {h:"Nature of income",k:"NatureOfInc",t:"txt"},
        {h:"Income offered (₹)",k:"IncTaxAmt",t:"num"},
        {h:"Schedule",k:"IncTaxSch",t:"sel",opts:FA_OFF},
        {h:"Item no.",k:"IncTaxSchNo",t:"txt"}
      ],S.fa.d,{min:"1400px",empty:"No other capital assets.",add:"Add a capital asset"}),{def:false});

    /* E — Accounts with signing authority */
    faInner+=fold("fa_e","E","Accounts with signing authority (not in A–D)", cnt(S.fa.e),
      grid("fa.e",[
        {h:"Institution name",k:"NameOfInstitution",t:"txt"},
        {h:"Institution address",k:"AddressOfInstitution",t:"txt"},
        {h:"Country",k:"code",t:"sel",opts:FA_CO},
        {h:"ZIP",k:"ZipCode",t:"txt"},
        {h:"Account holder",k:"NameMentionedInAccnt",t:"txt"},
        {h:"Account no.",k:"InstitutionAccountNumber",t:"txt"},
        {h:"Peak balance (₹)",k:"PeakBalanceOrInvestment",t:"num"},
        {h:"Income taxable?",k:"IncAccuredTaxFlag",t:"sel",opts:FA_YN},
        {h:"Income accrued",k:"IncAccuredInAcc",t:"num"},
        {h:"Income offered (₹)",k:"IncOfferedAmt",t:"num"},
        {h:"Schedule",k:"IncOfferedSch",t:"sel",opts:FA_OFF},
        {h:"Item no.",k:"IncOfferedSchNo",t:"txt"}
      ],S.fa.e,{min:"1500px",empty:"No signing-authority accounts.",add:"Add an account"}),{def:false});

    /* F — Trusts outside India */
    faInner+=fold("fa_f","F","Trusts outside India (trustee/beneficiary/settlor)", cnt(S.fa.f),
      grid("fa.f",[
        {h:"Country",k:"code",t:"sel",opts:FA_CO},
        {h:"ZIP",k:"ZipCode",t:"txt"},
        {h:"Name of trust",k:"NameOfTrust",t:"txt"},
        {h:"Address of trust",k:"AddressOfTrust",t:"txt"},
        {h:"Trustees",k:"NameOfOtherTrustees",t:"txt"},
        {h:"Trustees address",k:"AddressOfOtherTrustees",t:"txt"},
        {h:"Settlor",k:"NameOfSettlor",t:"txt"},
        {h:"Settlor address",k:"AddressOfSettlor",t:"txt"},
        {h:"Beneficiaries",k:"NameOfBeneficiaries",t:"txt"},
        {h:"Beneficiaries address",k:"AddressOfBeneficiaries",t:"txt"},
        {h:"Held since",k:"DateHeld",t:"date"},
        {h:"Income taxable?",k:"IncDrvTaxFlag",t:"sel",opts:FA_YN},
        {h:"Income derived",k:"IncDrvFromTrust",t:"num"},
        {h:"Income offered (₹)",k:"IncOfferedAmt",t:"num"},
        {h:"Schedule",k:"IncOfferedSch",t:"sel",opts:FA_OFF},
        {h:"Item no.",k:"IncOfferedSchNo",t:"txt"}
      ],S.fa.f,{min:"1900px",empty:"No foreign trusts.",add:"Add a trust"}),{def:false});

    /* G — Any other income from a source outside India */
    faInner+=fold("fa_g","G","Other income from a source outside India", cnt(S.fa.g),
      grid("fa.g",[
        {h:"Country",k:"code",t:"sel",opts:FA_CO},
        {h:"ZIP",k:"ZipCode",t:"txt"},
        {h:"Name of person",k:"NameOfPerson",t:"txt"},
        {h:"Address",k:"AddressOfPerson",t:"txt"},
        {h:"Income derived (₹)",k:"IncDerived",t:"num"},
        {h:"Nature of income",k:"NatureOfInc",t:"txt"},
        {h:"Income taxable?",k:"IncDrvTaxFlag",t:"sel",opts:FA_YN},
        {h:"Income offered (₹)",k:"IncOfferedAmt",t:"num"},
        {h:"Schedule",k:"IncOfferedSch",t:"sel",opts:FA_OFF},
        {h:"Item no.",k:"IncOfferedSchNo",t:"txt"}
      ],S.fa.g,{min:"1200px",empty:"No other foreign income.",add:"Add an income"}),{def:false});
  }
  const faCnt=["a1","a2","a3","a4","b","c","d","e","f","g"].reduce((a,k)=>a+((S.fa[k]||[]).length),0);
  H+=fold("fa_fa","Schedule FA","Foreign assets & income from any source outside India",
      res==="RES"?(faCnt?faCnt+" row"+(faCnt>1?"s":""):"None"):"n/a", faInner, {def:false});

  return H;
}
/* small local helpers */
function cnt(a){a=a||[];return a.length?(a.length+" row"+(a.length>1?"s":"")):"None";}
/* a lighter block wrapper for FSI country cards (uses shell blk) */
function blk_(id,title,status,inner,delPath){return blk(id,title,status,inner,delPath);}

/* ================================================================
   EXPORT — exp<Id>(j)   (schema keys verbatim from --leaves)
   ================================================================ */
function expFa(j){
  const res=(S.fs||{}).resStatus||"RES";
  const C=S.C.fa||{fsi:[],trRows:[],paidTot:0,reliefTot:0,dtaa:0,notDtaa:0};
  if(res==="NRI")return;   /* FSI/TR/FA not applicable to non-resident */

  /* ---- ScheduleFSI ---- */
  const fsiArr=[];
  (C.fsi||[]).forEach(cr=>{
    if(!cr.code)return;    /* no country code → row not considered (E5 note) */
    const el={};
    pf(el,"CountryName", cr.name||FA_CONM[cr.code]||"");
    pf(el,"CountryCodeExcludingIndia", cr.code);
    pf(el,"TaxIdentificationNo", cr.tin);
    const H=cr.heads||{};
    const obj=(key,h)=>{h=h||{b:0,c:0,d:0,e:0};const o={};
      /* four required integer leaves, present even at zero */
      o.IncFrmOutsideInd=n0(h.b); o.TaxPaidOutsideInd=n0(h.c);
      o.TaxPayableinInd=n0(h.d);  o.TaxReliefinInd=n0(h.e);
      const art=sv((((S.fa.fsi||[]).find(b=>b.code===cr.code)||{})[key.k]||{}).art);
      if(art&&key.dtaa)o.DTAAReliefUs90or90A=art;
      return o;};
    el.IncFromSal     =obj({k:"sal",dtaa:1},H.sal);
    el.IncFromHP      =obj({k:"hp", dtaa:1},H.hp);
    el.IncFromBusiness=obj({k:"bus",dtaa:1},H.bus);
    el.IncCapGain     =obj({k:"cg", dtaa:1},H.cg);
    el.IncOthSrc      =obj({k:"os", dtaa:1},H.os);
    const t=cr.tot||{b:0,c:0,d:0,e:0};
    el.TotalCountryWise={IncFrmOutsideInd:n0(t.b),TaxPaidOutsideInd:n0(t.c),
                         TaxPayableinInd:n0(t.d),TaxReliefinInd:n0(t.e)};
    fsiArr.push(el);
  });
  if(fsiArr.length)put(j,"ScheduleFSI.ScheduleFSIDtls",fsiArr);

  /* ---- ScheduleTR1 ---- */
  const trArr=[];
  (C.trRows||[]).forEach(r=>{
    const el={};
    pf(el,"CountryName", r.name||FA_CONM[r.code]||"");
    pf(el,"CountryCodeExcludingIndia", r.code);
    pf(el,"TaxIdentificationNo", r.tin);
    el.TaxPaidOutsideIndia=n0(r.paid);
    el.TaxReliefOutsideIndia=n0(r.relief);
    if(sv(r.sec))el.ReliefClaimedUsSection=r.sec;
    trArr.push(el);
  });
  if(trArr.length)put(j,"ScheduleTR1.ScheduleTR",trArr);
  if(trArr.length||C.reliefTot||C.paidTot){
    /* required totals — present even at zero once TR is filed */
    put(j,"ScheduleTR1.TotalTaxPaidOutsideIndia",n0(C.paidTot));
    put(j,"ScheduleTR1.TotalTaxReliefOutsideIndia",n0(C.reliefTot));
    put(j,"ScheduleTR1.TaxReliefOutsideIndiaDTAA",n0(C.dtaa));
    put(j,"ScheduleTR1.TaxReliefOutsideIndiaNotDTAA",n0(C.notDtaa));
    if(sv(S.fa.trFlag))put(j,"ScheduleTR1.TaxPaidOutsideIndFlg",S.fa.trFlag);
    if(S.fa.trFlag==="YES"){
      if(N(S.fa.trAmt))put(j,"ScheduleTR1.AmtTaxRefunded",n0(S.fa.trAmt));
      if(sv(S.fa.trAY))put(j,"ScheduleTR1.AssmtYrTaxRelief",st0(S.fa.trAY));
    }
  }

  /* ---- ScheduleFA ---- (resident & ordinarily resident only) ---- */
  if(res!=="RES")return;
  const hasCode=r=>st0(r.code)!=="";
  const cc=(el,r)=>{pf(el,"CountryCodeExcludingIndia",r.code);pf(el,"CountryName",FA_CONM[r.code]||"");};
  const S1=(el,r,fields)=>fields.forEach(f=>pf(el,f,sv(r[f])));
  const N1=(el,r,fields)=>fields.forEach(f=>{if(N(r[f]))pf(el,f,n0(r[f]));});
  const D1=(el,r,map)=>Object.keys(map).forEach(k=>{const iso=ISO(r[map[k]]);if(iso)pf(el,k,iso);});

  const a1=(S.fa.a1||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["Bankname","AddressOfBank","ZipCode","ForeignAccountNumber","OwnerStatus"]);
    D1(el,r,{AccOpenDate:"AccOpenDate"});
    N1(el,r,["PeakBalanceDuringYear","ClosingBalance","IntrstAccured"]);return el;});
  if(a1.length)put(j,"ScheduleFA.DetailsForiegnBank",a1);

  const a2=(S.fa.a2||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["FinancialInstName","FinancialInstAddress","ZipCode","AccountNumber","Status","NatureOfAmount"]);
    D1(el,r,{AccOpenDate:"AccOpenDate"});
    N1(el,r,["PeakBalanceDuringPeriod","ClosingBalance","GrossAmtPaidCredited"]);return el;});
  if(a2.length)put(j,"ScheduleFA.DtlsForeignCustodialAcc",a2);

  const a3=(S.fa.a3||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["NameOfEntity","AddressOfEntity","ZipCode","NatureOfEntity"]);
    D1(el,r,{InterestAcquiringDate:"InterestAcquiringDate"});
    N1(el,r,["InitialValOfInvstmnt","PeakBalanceDuringPeriod","ClosingBalance"]);
    el.TotGrossAmtPaidCredited=n0(r.TotGrossAmtPaidCredited);el.TotGrossProceeds=n0(r.TotGrossProceeds);/* required */
    return el;});
  if(a3.length)put(j,"ScheduleFA.DtlsForeignEquityDebtInterest",a3);

  const a4=(S.fa.a4||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["FinancialInstName","FinancialInstAddress","ZipCode"]);
    D1(el,r,{ContractDate:"ContractDate"});
    N1(el,r,["CashValOrSurrenderVal"]);
    el.TotGrossAmtPaidCredited=n0(r.TotGrossAmtPaidCredited);/* required */
    return el;});
  if(a4.length)put(j,"ScheduleFA.DtlsForeignCashValueInsurance",a4);

  const b=(S.fa.b||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["ZipCode","NatureOfEntity","NameOfEntity","AddressOfEntity","NatureOfInt","NatureOfInc","IncTaxSch","IncTaxSchNo"]);
    D1(el,r,{DateHeld:"DateHeld"});
    N1(el,r,["TotalInvestment","IncFromInt","IncTaxAmt"]);return el;});
  if(b.length)put(j,"ScheduleFA.DetailsFinancialInterest",b);

  const c=(S.fa.c||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["ZipCode","AddressOfProperty","Ownership","NatureOfInc","IncTaxSch","IncTaxSchNo"]);
    D1(el,r,{DateOfAcq:"DateOfAcq"});
    N1(el,r,["TotalInvestment","IncDrvProperty","IncTaxAmt"]);return el;});
  if(c.length)put(j,"ScheduleFA.DetailsImmovableProperty",c);

  const d=(S.fa.d||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["ZipCode","NatureOfAsset","Ownership","NatureOfInc","IncTaxSch"]);
    D1(el,r,{DateOfAcq:"DateOfAcq"});
    N1(el,r,["TotalInvestment"]);
    el.IncDrvAsset=n0(r.IncDrvAsset);el.IncTaxAmt=n0(r.IncTaxAmt);el.IncTaxSchNo=sv(r.IncTaxSchNo)||"-";/* required */
    return el;});
  if(d.length)put(j,"ScheduleFA.DetailsOthAssets",d);

  const e=(S.fa.e||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["NameOfInstitution","AddressOfInstitution","ZipCode","NameMentionedInAccnt","InstitutionAccountNumber","IncAccuredTaxFlag","IncOfferedSch","IncOfferedSchNo"]);
    N1(el,r,["PeakBalanceOrInvestment","IncAccuredInAcc","IncOfferedAmt"]);return el;});
  if(e.length)put(j,"ScheduleFA.DetailsOfAccntsHvngSigningAuth",e);

  const f=(S.fa.f||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["ZipCode","NameOfTrust","AddressOfTrust","NameOfOtherTrustees","AddressOfOtherTrustees","NameOfSettlor","AddressOfSettlor","NameOfBeneficiaries","AddressOfBeneficiaries","IncDrvTaxFlag","IncOfferedSch","IncOfferedSchNo"]);
    D1(el,r,{DateHeld:"DateHeld"});
    N1(el,r,["IncDrvFromTrust","IncOfferedAmt"]);return el;});
  if(f.length)put(j,"ScheduleFA.DetailsOfTrustOutIndiaTrustee",f);

  const g=(S.fa.g||[]).filter(hasCode).map(r=>{const el={};cc(el,r);
    S1(el,r,["ZipCode","NameOfPerson","AddressOfPerson","NatureOfInc","IncDrvTaxFlag","IncOfferedSch","IncOfferedSchNo"]);
    N1(el,r,["IncDerived","IncOfferedAmt"]);return el;});
  if(g.length)put(j,"ScheduleFA.DetailsOfOthSourcesIncOutsideIndia",g);
}

/* ================================================================
   IMPORT — imp<Id>(I3)
   ================================================================ */
function impFa(I3){
  const got=[];
  const toDMY=s=>dmy(s)||st0(s);

  /* ScheduleFSI + the section stored on TR */
  if(I3.ScheduleFSI&&Array.isArray(I3.ScheduleFSI.ScheduleFSIDtls)){
    const trSec={};((I3.ScheduleTR1||{}).ScheduleTR||[]).forEach(r=>{trSec[r.CountryCodeExcludingIndia]=r.ReliefClaimedUsSection;});
    const hd=o=>{o=o||{};return {b:nz(o.IncFrmOutsideInd),c:nz(o.TaxPaidOutsideInd),d:nz(o.TaxPayableinInd),art:o.DTAAReliefUs90or90A||""};};
    S.fa.fsi=I3.ScheduleFSI.ScheduleFSIDtls.map(el=>({
      code:el.CountryCodeExcludingIndia||"", name:el.CountryName||"", tin:el.TaxIdentificationNo||"",
      sec:trSec[el.CountryCodeExcludingIndia]||"90",
      sal:hd(el.IncFromSal), hp:hd(el.IncFromHP), bus:hd(el.IncFromBusiness),
      cg:hd(el.IncCapGain), os:hd(el.IncOthSrc)}));
    got.push("Schedule FSI");
  }
  /* ScheduleTR1 refund block */
  if(I3.ScheduleTR1){const T=I3.ScheduleTR1;
    S.fa.trFlag=T.TaxPaidOutsideIndFlg||""; S.fa.trAmt=nz(T.AmtTaxRefunded); S.fa.trAY=T.AssmtYrTaxRelief||"";
    got.push("Schedule TR");
  }
  /* ScheduleFA — nine tables */
  if(I3.ScheduleFA){const F=I3.ScheduleFA;
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
   CHECKS — chk<Id>()   (regime-aware; regime closes nothing here)
   ================================================================ */
function chkFa(){
  const out=[];
  const res=(S.fs||{}).resStatus||"RES";
  const C=S.C.fa||{fsi:[],trRows:[],reliefTot:0};
  const anyFsi=(S.fa.fsi||[]).length>0;
  const faCnt=["a1","a2","a3","a4","b","c","d","e","f","g"].reduce((a,k)=>a+((S.fa[k]||[]).length),0);

  /* Not applicable to non-resident (FSI/TR/FA) — rules doc */
  if(res==="NRI"&&(anyFsi||faCnt>0)){
    out.push({lvl:"err",t:"Foreign schedules not applicable",
      m:"Residential status is Non-Resident. Schedules FSI, TR and FA are not applicable — remove the foreign entries or correct the residential status.",sec:"fa"});
  }
  /* Schedule FA is for resident-and-ordinarily-resident only */
  if(res==="NOR"&&faCnt>0){
    out.push({lvl:"err",t:"Schedule FA not applicable to RNOR",
      m:"Schedule FA is only for a person resident and ordinarily resident. A Resident-but-Not-Ordinarily-Resident cannot file it — remove the foreign-asset rows.",sec:"fa"});
  }

  if(res==="NRI")return out.length?out:[{lvl:"ok",t:"Foreign income & assets",m:"Not applicable to a non-resident.",sec:"fa"}];

  /* Country-code note: a country block with figures but no code is ignored */
  (S.fa.fsi||[]).forEach((b,i)=>{
    const t=(C.fsi||[])[i]||{tot:{b:0,c:0,d:0}};
    const anyVal=(t.tot.b||t.tot.c||t.tot.d);
    if(!b.code&&anyVal)
      out.push({lvl:"warn",t:"FSI country "+(i+1)+" has no Country Code",
        m:"Figures are entered but no Country Code is chosen — the utility ignores a row with a blank Country Code (E5 note). Pick a country or clear the row.",sec:"fa"});
    if(b.code&&!st0(b.tin)&&anyVal)
      out.push({lvl:"warn",t:"FSI country "+(i+1)+" missing TIN",
        m:"Taxpayer Identification Number is required for each FSI country block.",sec:"fa"});
  });

  /* (e) is always MIN(c,d) — flag a head where relief was expected but (d) is zero */
  (C.fsi||[]).forEach((cr,i)=>{
    ["sal","hp","bus","cg","os"].forEach(k=>{const h=(cr.heads||{})[k]||{};
      if(n0(h.c)>0&&n0(h.d)===0)
        out.push({lvl:"warn",t:"No relief for country "+(i+1),
          m:"Tax was paid outside India on a head but tax payable in India (d) is nil, so relief (e)=min(c,d)=0. Enter (d) at the average Indian rate on that income.",sec:"fa"});
    });
  });

  /* TR refund follow-up */
  if(S.fa.trFlag==="YES"){
    if(!N(S.fa.trAmt))out.push({lvl:"warn",t:"Refund amount missing",m:"You answered that foreign tax relief was refunded — enter the amount of tax refunded (4a).",sec:"fa"});
    if(!st0(S.fa.trAY))out.push({lvl:"warn",t:"Refund AY missing",m:"Enter the assessment year in which the relief was allowed in India (4b).",sec:"fa"});
  }

  if(!out.length){
    out.push({lvl:"ok",t:"Foreign income & assets",
      m:(anyFsi||faCnt)?("FSI/TR relief "+RS(C.reliefTot||0)+"; FA rows "+faCnt+"."):"No foreign income, relief or assets.",sec:"fa"});
  }
  return out;
}

/* ================================================================
   REGISTER
   ================================================================ */
reg({id:"fa", t:"Foreign income and assets", ref:"FSI · TR · FA",
     f:secFa, s:()=>{const C=S.C.fa||{};const rel=C.reliefTot||0;
       return rel?RS(rel)+" foreign-tax relief":"No foreign income/assets";},
     eng:engFa, exp:expFa, imp:impFa, chk:chkFa, order:26});
