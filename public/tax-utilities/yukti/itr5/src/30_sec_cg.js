/* =====================================================================
   ITR-5 · Section "cg" — Schedule CG (Capital Gains) + Schedule 112A +
   Schedule 115AD(1)(iii)(p) + Schedule VDA.  order 26 / corder 26.
   Built ONLY from books/ITR-5/{CG,Schedule_112A,Schedule_115AD_1_iii_p,VDA}.md
   and books/ITR-5/enums.json.  The ITR-3 cg file was read for SHELL IDIOM /
   contract shape only — never its numbers, item-codes, enums or schema keys.

   ITR-5 FACTS (differ from ITR-3 — from books/ITR-5/CG.md):
   - Root block is `ScheduleCG` (not ScheduleCGFor23); members are
     ShortTermCapGain, LongTermCapGain, SumOfCGIncm, IncmFromVDATrnsf,
     IncChargeableHeadCapGain, DeducClaimInfo, CurrYrLosses,
     EditAutopoulatedDetail, AccruOrRecOfCG.
   - Section 48 now has FIVE lines: bi Reduction48iii (clause (iii) of s.48
     r.w. rule 8AB), bii AquisitCost, biii ImproveCost, biv ExpOnTrans,
     bv TotalDedn = bi+bii+biii+biv.  Balance = 50C value − bv.
   - A land improvement is a SINGLE figure `ImproveCost` (no per-year grid).
   - STCG land exemptions: 54G / 54GA only.  LTCG land: 54D/54EC/54G/54GA.
     A6 (other STCG) & B8 (SaleofAssetNA): 54D/54G/54GA.  B2 slump: 54EC.
   - A3 has TWO sub-heads via EquityMFonSTT[] (MFSectionCode 1A=111A@20,
     5AD1biip=115AD FII@30).  A7/B9 carry an extra s.45(4) r.w. 9B line
     (AmtDeemedStcg45iv / AmtDeemedLtcg45iv).
   - LTCG land carries AquisitCostIndex (required) — a firm/AOP/BOI cannot
     claim the transitional 20%-with-indexation option (that proviso is for
     resident individuals/HUF only), so the "with-indexation" & excess-tax
     rows are all HIDDEN (§7); we set AquisitCostIndex = AquisitCost and the
     balance uses the non-indexed bv (r149/r150).
   - LTCG buy-back (B(A)) is a single negative TotalCapitalLossBuyBackShares
     (NO Dtls array — schema has only the total); STCG A(A) keeps the
     rate-split Dtls[] (STL20/STL30/STLAR).
   - Non-resident heads A4, A5, B5, B6, B7 (and every 23-Jul-2024 rate-split
     / with-indexation computation row) are surfaced only for a non-resident
     / FII and are otherwise not built (CG.md §7, §8).

   REGIME: the capital-gains head stays OPEN in both regimes (REGIME/BP books
   close nothing here); no CG item is regime-gated.  isNew() is not read.

   Everything is wrapped in an IIFE so no helper leaks into the shared
   namespace where the parallel section-builders live.
   ===================================================================== */
(function(){
"use strict";

/* ---- constants -------------------------------------------------- */
/* the five 234C date-ranges (CG book Part F, r421) */
function cgQtr(iso){const d=D(iso);if(!d)return 4;
  const y=YREND.getFullYear();                 /* FY end year = 2026 */
  const j15=new Date(y-1,5,15),s15=new Date(y-1,8,15),d15=new Date(y-1,11,15),m15=new Date(y,2,15);
  if(d<=j15)return 0; if(d<=s15)return 1; if(d<=d15)return 2; if(d<=m15)return 3; return 4;}

/* ---- dropdown tables (from books/ITR-5/enums.json, verbatim) ------ */
const OB=[["BE","On or Before 31st January 2018"],["AE","After 31st January 2018"]];
const TR23=[["BF","Before 23rd July 2024"],["AF","On or after 23rd July 2024"]]; /* Col 1b (no schema key) */
const HEADVDA=[["BI","Business Income"],["CG","Capital Gain"]];
const MFSEC=[["1A","(i) 111A [for others]"],["5AD1biip","(ii) 115AD(1)(b)(ii) [for FIIs]"]];
const EXST_LAND=[["54G","54G"],["54GA","54GA"]];                                  /* STCG land Dbelow */
const EXLT_LAND=[["54D","54D"],["54EC","54EC"],["54G","54G"],["54GA","54GA"]];    /* LTCG land Dbelow */
const EX_A6=[["54D","54D"],["54G","54G"],["54GA","54GA"]];                         /* A6 / B8 exemption codes */
const BBST=[["STL20","Loss from buy back of 'shares taxable at 20%'"],
  ["STL30","Loss from buy back of 'shares taxable at 30%'"],
  ["STLAR","Loss from buy back of 'shares taxable at applicable rate'"]];          /* A(A) Rate */
const DEEM_ST_PY=[["2022-23","2022-23"],["2023-24","2023-24"],["2024-25","2024-25"]];
const YRACQ=[["2022","2022"],["2023","2023"],["2024","2024"],["2025","2025"]];   /* YrInWhichAssetAcq enum */
const YRACQ_SET={"2022":1,"2023":1,"2024":1,"2025":1};
const DEEM_ST_SEC=[["54G","54G"],["54GA","54GA"]];                                 /* A7 SectionClmd */
const DEEM_LT_SEC=[["54D","54D"],["54G","54G"],["54GA","54GA"]];                   /* B9 SectionClmd */
const B6SEC=[["21ciii","112(1)(c) — unlisted securities"],["5AC1c","115AC — bonds or GDR"],
  ["5AB1b","115AB — units"],["5ADiii","115AD — securities by FII"]];
const YN=[["Y","Yes"],["N","No"]];
const UNUTYN=[["Y","Yes"],["N","No"],["X","Not Applicable"]];
const TRCYN=[["Y","Yes"],["N","No"]];
const PROV112=[["22","22"]];                                                       /* Proviso112SectionCode */
/* DTAA ItemNoincl enums (schema NRITaxUsDTAAStcgType / NRITaxUsDTAALtcgType) */
const DTAA_ITEM_ST=[["A1e","A1e"],["A2c","A2c"],["A3ie","A3ie"],["A3iie","A3iie"],["A4a","A4a"],
  ["A4b","A4b"],["A5e","A5e"],["A6g","A6g"],["A7","A7"],["A8a","A8a"],["A8b","A8b"],["A8c","A8c"]];
const DTAA_ITEM_LT=[["B1g_12.5%","B1g_12.5%"],["B2e_12.5%","B2e_12.5%"],["B3c_12.5%","B3c_12.5%"],
  ["B4_12.5%","B4_12.5%"],["B5c_12.5%","B5c_12.5%"],["B6c112(1)(c)_12.5%","B6c112(1)(c)_12.5%"],
  ["B6c115AB1b_12.5%","B6c115AB1b_12.5%"],["B6c115AC_12.5%","B6c115AC_12.5%"],["B6ciii115AD","B6ciii115AD"],
  ["B7c_12.5%","B7c_12.5%"],["B8e_12.5%","B8e_12.5%"],["B9_12.5%","B9_12.5%"],
  ["B10a1_12.5%","B10a1_12.5%"],["B10a2_12.5%","B10a2_12.5%"]];
/* State-code list (StateCode, N25:N28 / N160:N161 — 37 states + Foreign) */
const CG_STATE=[["01","Andaman and Nicobar Islands"],["02","Andhra Pradesh"],["03","Arunachal Pradesh"],
  ["04","Assam"],["05","Bihar"],["06","Chandigarh"],["07","Dadra Nagar and Haveli"],["08","Daman and Diu"],
  ["09","Delhi"],["10","Goa"],["11","Gujarat"],["12","Haryana"],["13","Himachal Pradesh"],
  ["14","Jammu and Kashmir"],["15","Karnataka"],["16","Kerala"],["17","Lakshadweep"],["18","Madhya Pradesh"],
  ["19","Maharashtra"],["20","Manipur"],["21","Meghalaya"],["22","Mizoram"],["23","Nagaland"],["24","Odisha"],
  ["25","Puducherry"],["26","Punjab"],["27","Rajasthan"],["28","Sikkim"],["29","Tamil Nadu"],["30","Tripura"],
  ["31","Uttar Pradesh"],["32","West Bengal"],["33","Chhattisgarh"],["34","Uttarakhand"],["35","Jharkhand"],
  ["36","Telangana"],["37","Ladakh"],["99","Foreign"]];
const CG_STATE_SET={};CG_STATE.forEach(x=>CG_STATE_SET[x[0]]=1);
/* ---- country-code enum (books/ITR-5/enums.json / schema CountryCode & CountryCodeExcludingIndia,
   verbatim; same list/codes as Schedule FSI (70_sec_foreign FA_CO) and Schedule OS (70_sec_os OS_CC)) ---- */
const CG_CO=[["93","AFGHANISTAN"],["1001","ALAND ISLANDS"],["355","ALBANIA"],["213","ALGERIA"],["684","AMERICAN SAMOA"],["376","ANDORRA"],["244","ANGOLA"],["1264","ANGUILLA"],["1010","ANTARCTICA"],["1268","ANTIGUA AND BARBUDA"],["54","ARGENTINA"],["374","ARMENIA"],["297","ARUBA"],["61","AUSTRALIA"],["43","AUSTRIA"],["994","AZERBAIJAN"],["1242","BAHAMAS"],["973","BAHRAIN"],["880","BANGLADESH"],["1246","BARBADOS"],["375","BELARUS"],["32","BELGIUM"],["501","BELIZE"],["229","BENIN"],["1441","BERMUDA"],["975","BHUTAN"],["591","BOLIVIA (PLURINATIONAL STATE OF)"],["1002","BONAIRE, SINT EUSTATIUS AND SABA"],["387","BOSNIA AND HERZEGOVINA"],["267","BOTSWANA"],["1003","BOUVET ISLAND"],["55","BRAZIL"],["1014","BRITISH INDIAN OCEAN TERRITORY"],["673","BRUNEI DARUSSALAM"],["359","BULGARIA"],["226","BURKINA FASO"],["257","BURUNDI"],["238","CABO VERDE"],["855","CAMBODIA"],["237","CAMEROON"],["1","CANADA"],["1345","CAYMAN ISLANDS"],["236","CENTRAL AFRICAN REPUBLIC"],["235","CHAD"],["56","CHILE"],["86","CHINA"],["9","CHRISTMAS ISLAND"],["672","COCOS (KEELING) ISLANDS"],["57","COLOMBIA"],["270","COMOROS"],["242","CONGO"],["243","CONGO (DEMOCRATIC REPUBLIC OF THE)"],["682","COOK ISLANDS"],["506","COSTA RICA"],["225","COTE DIVOIRE"],["385","CROATIA"],["53","CUBA"],["1015","CURACAO"],["357","CYPRUS"],["420","CZECHIA"],["45","DENMARK"],["253","DJIBOUTI"],["1767","DOMINICA"],["1809","DOMINICAN REPUBLIC"],["593","ECUADOR"],["20","EGYPT"],["503","EL SALVADOR"],["240","EQUATORIAL GUINEA"],["291","ERITREA"],["372","ESTONIA"],["251","ETHIOPIA"],["500","FALKLAND ISLANDS (MALVINAS)"],["298","FAROE ISLANDS"],["679","FIJI"],["358","FINLAND"],["33","FRANCE"],["594","FRENCH GUIANA"],["689","FRENCH POLYNESIA"],["1004","FRENCH SOUTHERN TERRITORIES"],["241","GABON"],["220","GAMBIA"],["995","GEORGIA"],["49","GERMANY"],["233","GHANA"],["350","GIBRALTAR"],["30","GREECE"],["299","GREENLAND"],["1473","GRENADA"],["590","GUADELOUPE"],["1671","GUAM"],["502","GUATEMALA"],["1481","GUERNSEY"],["224","GUINEA"],["245","GUINEA-BISSAU"],["592","GUYANA"],["509","HAITI"],["1005","HEARD ISLAND AND MCDONALD ISLANDS"],["6","HOLY SEE"],["504","HONDURAS"],["852","HONG KONG"],["36","HUNGARY"],["354","ICELAND"],["62","INDONESIA"],["98","IRAN (ISLAMIC REPUBLIC OF)"],["964","IRAQ"],["353","IRELAND"],["1624","ISLE OF MAN"],["972","ISRAEL"],["5","ITALY"],["1876","JAMAICA"],["81","JAPAN"],["1534","JERSEY"],["962","JORDAN"],["7","KAZAKHSTAN"],["254","KENYA"],["686","KIRIBATI"],["850","KOREA (DEMOCRATIC PEOPLES REPUBLIC OF)"],["82","KOREA (REPUBLIC OF)"],["965","KUWAIT"],["996","KYRGYZSTAN"],["856","LAO PEOPLES DEMOCRATIC REPUBLIC"],["371","LATVIA"],["961","LEBANON"],["266","LESOTHO"],["231","LIBERIA"],["218","LIBYA"],["423","LIECHTENSTEIN"],["370","LITHUANIA"],["352","LUXEMBOURG"],["853","MACAO"],["389","MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)"],["261","MADAGASCAR"],["265","MALAWI"],["60","MALAYSIA"],["960","MALDIVES"],["223","MALI"],["356","MALTA"],["692","MARSHALL ISLANDS"],["596","MARTINIQUE"],["222","MAURITANIA"],["230","MAURITIUS"],["269","MAYOTTE"],["52","MEXICO"],["691","MICRONESIA (FEDERATED STATES OF)"],["373","MOLDOVA (REPUBLIC OF)"],["377","MONACO"],["976","MONGOLIA"],["382","MONTENEGRO"],["1664","MONTSERRAT"],["212","MOROCCO"],["258","MOZAMBIQUE"],["95","MYANMAR"],["264","NAMIBIA"],["674","NAURU"],["977","NEPAL"],["31","NETHERLANDS"],["687","NEW CALEDONIA"],["64","NEW ZEALAND"],["505","NICARAGUA"],["227","NIGER"],["234","NIGERIA"],["683","NIUE"],["15","NORFOLK ISLAND"],["1670","NORTHERN MARIANA ISLANDS"],["47","NORWAY"],["968","OMAN"],["92","PAKISTAN"],["680","PALAU"],["970","PALESTINE, STATE OF"],["507","PANAMA"],["675","PAPUA NEW GUINEA"],["595","PARAGUAY"],["51","PERU"],["63","PHILIPPINES"],["1011","PITCAIRN"],["48","POLAND"],["14","PORTUGAL"],["1787","PUERTO RICO"],["974","QATAR"],["262","REUNION"],["40","ROMANIA"],["8","RUSSIAN FEDERATION"],["250","RWANDA"],["1006","SAINT BARTHELEMY"],["290","SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA"],["1869","SAINT KITTS AND NEVIS"],["1758","SAINT LUCIA"],["1007","SAINT MARTIN (FRENCH PART)"],["508","SAINT PIERRE AND MIQUELON"],["1784","SAINT VINCENT AND THE GRENADINES"],["685","SAMOA"],["378","SAN MARINO"],["239","SAO TOME AND PRINCIPE"],["966","SAUDI ARABIA"],["221","SENEGAL"],["381","SERBIA"],["248","SEYCHELLES"],["232","SIERRA LEONE"],["65","SINGAPORE"],["1721","SINT MAARTEN (DUTCH PART)"],["421","SLOVAKIA"],["386","SLOVENIA"],["677","SOLOMON ISLANDS"],["252","SOMALIA"],["28","SOUTH AFRICA"],["1008","SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS"],["211","SOUTH SUDAN"],["35","SPAIN"],["94","SRI LANKA"],["249","SUDAN"],["597","SURINAME"],["1012","SVALBARD AND JAN MAYEN"],["268","SWAZILAND"],["46","SWEDEN"],["41","SWITZERLAND"],["963","SYRIAN ARAB REPUBLIC"],["886","TAIWAN, PROVINCE OF CHINA[A]"],["992","TAJIKISTAN"],["255","TANZANIA, UNITED REPUBLIC OF"],["66","THAILAND"],["670","TIMOR-LESTE (EAST TIMOR)"],["228","TOGO"],["690","TOKELAU"],["676","TONGA"],["1868","TRINIDAD AND TOBAGO"],["216","TUNISIA"],["90","TURKEY"],["993","TURKMENISTAN"],["1649","TURKS AND CAICOS ISLANDS"],["688","TUVALU"],["256","UGANDA"],["380","UKRAINE"],["971","UNITED ARAB EMIRATES"],["44","UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND"],["2","UNITED STATES OF AMERICA"],["1009","UNITED STATES MINOR OUTLYING ISLANDS"],["598","URUGUAY"],["998","UZBEKISTAN"],["678","VANUATU"],["58","VENEZUELA (BOLIVARIAN REPUBLIC OF)"],["84","VIET NAM"],["1284","VIRGIN ISLANDS (BRITISH)"],["1340","VIRGIN ISLANDS (U.S.)"],["681","WALLIS AND FUTUNA"],["1013","WESTERN SAHARA"],["967","YEMEN"],["260","ZAMBIA"],["263","ZIMBABWE"],["9999","OTHERS"]];                       /* CountryCodeExcludingIndia enum (India excluded) — A9/B11 DTAA ccode */
const CG_CO_IN=[["91","INDIA"]].concat(CG_CO);   /* CountryCode enum (India included) — TrnsfImmblPrprty CountryCode */
const CG_CO_SET={};CG_CO.forEach(x=>CG_CO_SET[x[0]]=1);
const CG_CO_IN_SET={};CG_CO_IN.forEach(x=>CG_CO_IN_SET[x[0]]=1);
/* Part D — DeducClaimInfo detail tables (ITR-5 exposes only 54D/54EC/54G/54GA). */
const DCLAIM=[
  {ns:"us54D", sec:"54D", key:"DeducClaimDtlsUs54D", lbl:"Sec 54D — new land / building for industrial undertaking",
    cost:"CostofNewLandBuilding",costH:"Cost of purchase/construction of new land or building",acq:true},
  {ns:"us54EC",sec:"54EC",key:"DeducClaimDtlsUs54EC",lbl:"Sec 54EC — investment in specified/notified bonds",invest:true},
  {ns:"us54G", sec:"54G", key:"DeducClaimDtlsUs54G", lbl:"Sec 54G — new asset (urban → non-urban area)",
    cost:"CostofNewAsset",costH:"Cost and expenses of new asset"},
  {ns:"us54GA",sec:"54GA",key:"DeducClaimDtlsUs54GA",lbl:"Sec 54GA — new asset (SEZ)",
    cost:"CostofNewAsset",costH:"Cost and expenses of new asset"}];
const EXST_SET={"54G":1,"54GA":1};
const EXLT_SET={"54D":1,"54EC":1,"54G":1,"54GA":1};
const EXA6_SET={"54D":1,"54G":1,"54GA":1};

/* ---- state (S.cg) — the shell bakes a `data-addland` handler that pushes
   {buy,sale,lt,ded:{},buyers:[],improve:[]} to S.cg.land; our land fields
   are a superset of that shape (we read p.imp, not p.improve). ------------ */
S.cg = S.cg || {
  on:false,
  land:[],   /* {buy,sale,lt:"Short"|"Long",cons,sdv,red,cost,imp,exp,
                ded:{s54D,s54EC,s54G,s54GA},buyers:[{name,pan,aadhaar,share,amt}],
                paddr,pstate,ppin,pcountry,pzip} */
  a2:{},     /* A2 slump-sale STCG {fmv2,fmv3,networth} */
  a3:[],     /* A3 EquityMFonSTT rows {mfsec,cons,red,cost,imp,exp,loss94} (max 2) */
  a4:{},     /* A4 NR 111A/other STCG {sttPaid,sttNot}  → NRITransacSec48Dtl (NR only) */
  a5:{},     /* A5 NR FII 115AD STCG {unqCons,unqFmv,othCons,red,cost,imp,exp,loss94} (NR only) */
  a6:{},     /* A6 other STCG {unqCons,unqFmv,othCons,red,cost,imp,exp,loss94,dcg,ded:{s54D,s54G,s54GA}} */
  a7:{unutFlag:"",deem:[],other:0,other45:0},   /* A7 deemed STCG */
  a8:{},     /* A8 pass-through STCG {r20,r30,rApp} */
  a9:[],     /* A9 DTAA STCG {amt,itemno,country,ccode,article,treaty,trc,secit,itact} (NR only) */
  aA:[],     /* A(A) buy-back STCL {rate,amt} */
  b2:{},     /* B2 slump LTCG {fmv2,fmv3,networth,ded:{s54EC}} */
  b3:{},     /* B3 listed securities/ZCB u/s 112(1) {sec,cons,red,cost,imp,exp} */
  b5:{},     /* B5 NR unlisted shares/listed deb {gain} (NR only) */
  b6:[],     /* B6 NR 112(1)(c)/115AB/115AC/115AD {sec,unqCons,unqFmv,othCons,red,cost,imp,exp} (NR only) */
  b8:{},     /* B8 SaleofAssetNA (resident catch-all) {unqCons,unqFmv,othCons,red,cost,imp,exp,ded:{s54D,s54G,s54GA}} */
  b9:{unutFlag:"",deem:[],other:0,other45:0},   /* B9 deemed LTCG */
  b10:{},    /* B10 pass-through LTCG {r125a,r125o} */
  b11:[],    /* B11 DTAA LTCG (NR only) */
  bA:{},     /* B(A) buy-back LTCL {amt} — single negative total, no rate split */
  s112a:[],  /* Schedule 112A scrips */
  s115ad:[], /* Schedule 115AD scrips (NR FII only) */
  vda:[],    /* Schedule VDA transfers */
  dclaim:{us54D:[],us54EC:[],us54G:[],us54GA:[]},   /* Part D detail (disclosure) */
  editE:false, Eover:null,
  editF:false, Fover:null
};
if(!S.cg.land)S.cg.land=[];

/* seed grid rows the shell's add-handler reaches by key suffix (documentary;
   the shell keeps its own baked SEED map — these mirror it for clarity) */
SEED["cg.buyers"]=SEED["cg.buyers"]||{share:100};
SEED["cg.a9"]=SEED["cg.a9"]||{trc:"Y"};
SEED["cg.b11"]=SEED["cg.b11"]||{trc:"Y"};
SEED["cg.aA"]=SEED["cg.aA"]||{rate:"STL20"};
SEED["cg.s112a"]=SEED["cg.s112a"]||{pre18:"AE"};
SEED["cg.s115ad"]=SEED["cg.s115ad"]||{pre18:"AE"};
SEED["cg.vda"]=SEED["cg.vda"]||{};
SEED["cg.a3"]=SEED["cg.a3"]||{mfsec:"1A"};
SEED["cg.a7.deem"]=SEED["cg.a7.deem"]||{py:"2024-25",sec:"54G"};
SEED["cg.b9.deem"]=SEED["cg.b9.deem"]||{py:"2024-25",sec:"54D"};
SEED["cg.b6"]=SEED["cg.b6"]||{sec:"21ciii"};

/* =====================================================================
   ENGINE — every formula carries its CG-sheet cell ref
   ===================================================================== */
/* Q10 / Q140 — full value u/s 50C: substitute stamp value only when it
   exceeds actual consideration by more than 10% (IF(sdv>1.1*cons,sdv,cons)) */
function v50C(cons,sdv){cons=N(cons);sdv=N(sdv);
  return {value:(sdv>cons*1.10?sdv:cons),safe:!(sdv>cons*1.10)};}

/* the section-48 five-line total (bi Reduction48iii + bii AquisitCost +
   biii ImproveCost + biv ExpOnTrans = bv TotalDedn) — Q16/Q149 etc. */
function dedn48(o){return R(N(o.red)+N(o.cost)+N(o.imp)+N(o.exp));}

/* one land/building property (STCG head A1 r22 S22, or LTCG head B1 r157 S157) */
function engLand(p){
  const isLT = p.lt==="Long";
  const c50=v50C(p.cons,p.sdv);                              /* aiii — Q10/Q140 */
  const bv=dedn48(p);                                        /* bv  — Q16/Q149 */
  const c=R(c50.value-bv);                                   /* 1c  = aiii − bv (Q17/Q150) */
  const d=p.ded||{};
  const dedTot = isLT ? R(N(d.s54D)+N(d.s54EC)+N(d.s54G)+N(d.s54GA))   /* 1d — Q156 (54D/54EC/54G/54GA) */
                      : R(N(d.s54G)+N(d.s54GA));                        /* 1d — Q21  (54G/54GA)         */
  /* S22 A1e = IF(1c<0,1c,MAX(0,1c-1d)) ; S157 B1e likewise */
  const e = c<0 ? c : R(Math.max(0,c-dedTot));
  const costIdx = N(p.cost);   /* AquisitCostIndex — no indexation for a firm/AOP/BOI (transitional proviso N/A) */
  return {isLT,value:c50.value,safe:c50.safe,bv:R(bv),c,dedTot,e,costIdx:R(costIdx),gain:e};
}

/* an aggregate head carrying the section-48 block (A3 rows, A6, B3, B8, NR B6) */
function engAgg(o,opts){o=o||{};opts=opts||{};
  let cons;
  if(opts.unq){const c50ca=Math.max(N(o.unqCons),N(o.unqFmv)); o._c50ca=c50ca; cons=R(c50ca+N(o.othCons));} /* 50CA MAX (Q70/Q86/Q290) */
  else cons=R(N(o.cons));
  const bv=dedn48(o);                                        /* bv */
  const c=R(cons-bv);                                        /* c = balance */
  const l94=opts.loss94?N(o.loss94):0;                       /* 94(7)/94(8) disallowed loss (3id/6d) */
  const dcg=opts.dcg?N(o.dcg):0;                             /* A6e DeemedSTCGDeprAsset (6 of Sch DCG) */
  const ded=(opts.deds||[]).reduce((a,k)=>a+N((o.ded||{})["s"+k]),0);
  const base=R(c+l94+dcg);
  const gain = opts.noExempt ? base : (base<0 ? base : R(Math.max(0,base-ded)));
  return {cons,bv:R(bv),c,l94:R(l94),dcg:R(dcg),ded:R(ded),c50ca:o._c50ca,gain};
}

/* slump sale (A2 r34-38 / B2 r170-176): FVC = MAX(FMV11UAEii,FMV11UAEiii) (Q36/Q172) */
function engSlump(o,lt){o=o||{};const v=Math.max(N(o.fmv2),N(o.fmv3));
  const c=R(v-N(o.networth));                                /* 2c = 2aiii − 2b (S38/Q174) */
  const ded=lt?N((o.ded||{}).s54EC):0;                       /* B2: DeductionUnderSec54 = 54EC (r175); A2: none */
  const gain=lt?(c<0?c:R(Math.max(0,c-ded))):c;              /* S176 B2e = IF(2c<0,2c,MAX(0,2c-2d)) ; A2c = 2c */
  return {value:R(v),c,ded:R(ded),gain};}

/* Schedule 112A / 115AD scrip table (both share the identical column math) */
function engScrip(rows){
  const t={sale:0,cwo:0,cost:0,before:0,fmv:0,exp:0,ded:0,bal:0,before23:0,after23:0};
  (rows||[]).forEach(r=>{
    const pre=r.pre18==="BE";                                /* Col 1a "on or before 31 Jan 2018" */
    const qty=pre?N(r.qty):0, price=pre?N(r.price):0;         /* A456 lock: cols 4,5,11 = 0 when AE */
    const sale=pre?R(Math.max(0,qty*price)):R(Math.max(0,N(r.sale6)));  /* Col 6 = Col4×Col5 (BE) / entered (AE) */
    const fmvTot=pre?R(Math.max(0,qty*N(r.fmv18))):0;        /* Col 11 = Col4×Col10 */
    const col9=pre?R(Math.max(0,Math.min(fmvTot,sale))):0;   /* Col 9 = lower of Col6 & Col11 */
    const cwo=R(Math.max(0,N(r.cost),col9));                 /* Col 7 = higher of Col8 & Col9 */
    const totded=R(Math.max(0,cwo+N(r.exp)));               /* Col 13 = Col7 + Col12 */
    const bal=R(sale-totded);                                /* Col 14 = Col6 − Col13 (may be negative) */
    r._={sale,fmvTot,col9,cwo,cost:N(r.cost),exp:N(r.exp),totded,bal};
    t.sale+=sale;t.cwo+=cwo;t.cost+=N(r.cost);t.before+=col9;t.fmv+=fmvTot;t.exp+=N(r.exp);
    t.ded+=totded;t.bal+=bal;
    if(r.after23==="AF")t.after23+=bal; else t.before23+=bal;
  });
  Object.keys(t).forEach(k=>t[k]=R(t[k]));return t;
}

/* Schedule VDA — per-row income = MAX(0, Consideration − Cost) (I5); totals SUMIF by head */
function engVDA(rows){let bi=0,cg=0;
  (rows||[]).forEach(r=>{const inc=Math.max(0,R(N(r.cons)-N(r.cost)));r._={inc,q:cgQtr(r.sale)};
    if(r.head==="BI")bi+=inc; else if(r.head==="CG")cg+=inc;});
  return {bi:R(bi),cg:R(cg)};}

/* A9 / B11 DTAA relief: applicable rate = lower of treaty & I.T.-Act rate; a
   row the treaty makes fully exempt (rate 0) is "not chargeable to tax". */
function engDTAA(rows){let notTax=0,special=0;
  (rows||[]).forEach(r=>{const amt=N(r.amt);
    const tr=(r.treaty===""||r.treaty==null)?null:N(r.treaty);
    const it=(r.itact===""||r.itact==null)?null:N(r.itact);
    let appl; if(tr!=null&&it!=null)appl=Math.min(tr,it); else appl=(tr!=null?tr:(it!=null?it:0));
    r._appl=appl;
    if(appl<=0)notTax+=amt; else special+=amt;});
  return {notTax:R(notTax),special:R(special)};}

/* the toggle is stored as a string "true"/"false" by the <select>, boolean by import */
function cgOn(){const v=(S.cg||{}).on;return v===true||v==="true"||v==="Yes";}
function isNr(){return S.fs&&S.fs.resStatus==="NRI";}
function isFii(){return S.fs&&(S.fs.fpi==="Y"||S.fs.fpi==="Yes");}

const KEYS=["st20","st30","stApp","stDTAA","lt125","ltDTAA"];
const Z=()=>({st20:0,st30:0,stApp:0,stDTAA:0,lt125:0,ltDTAA:0});

function engCg(){
  const C=S.cg;
  const nri=isNr();
  if(!cgOn()){
    S.C.cg={on:false,nri:nri,A:{total:0},B:{total:0},C1:0,C2:0,C3:0,
      gain:Z(),loss:Z(),used:Z(),absorbed:Z(),after:Z(),matrix:{},F:{},Fauto:{},
      s112a:engScrip([]),s115ad:engScrip([]),vda:{bi:0,cg:0},
      buckets:{},dedD:{},dedTotal:0,cflSTCL:0,cflLTCL:0,
      dtaaStcgRate:"",dtaaLtcgRate:"",
      shortTerm:0,longTerm:0,total:0,income:0};
    return;
  }
  const s112a=engScrip(C.s112a);
  const s115ad=engScrip(C.s115ad);
  const vda=engVDA(C.vda);

  /* ---- Part A · short-term ---------------------------------------- */
  const land={st:[],lt:[]};
  (C.land||[]).forEach((p,i)=>{const r=engLand(p);p._=r;p._i=i;(r.isLT?land.lt:land.st).push(p);});
  const A={};
  A.a1 = R(land.st.reduce((a,p)=>a+p._.gain,0));                       /* A1e ΣS22 (r22) */
  A.a2 = engSlump(C.a2,false);                                        /* A2c r38 */
  /* A3 — up to two EquityMFonSTT sub-heads (1A @20 / 5AD1biip @30) */
  A.a3rows=(C.a3||[]).map(o=>({o,r:engAgg(o,{loss94:1,noExempt:1})}));  /* A3ie/A3iie = 3ic+3id (r49/r60) */
  A.a3i =R(A.a3rows.filter(x=>x.o.mfsec!=="5AD1biip").reduce((a,x)=>a+x.r.gain,0)); /* 111A @20 */
  A.a3ii=R(A.a3rows.filter(x=>x.o.mfsec==="5AD1biip").reduce((a,x)=>a+x.r.gain,0)); /* 115AD @30 */
  /* A4 (r62/r65) NR: A4a=111A(STT), A4b=other shares/debentures — direct amounts */
  A.a4 = {a:R(N((C.a4||{}).sttPaid)), b:R(N((C.a4||{}).sttNot))};
  A.a4.gain = R(A.a4.a + A.a4.b);
  A.a5 = engAgg(C.a5,{unq:1,loss94:1,noExempt:1});                    /* A5e r81 (NR FII 115AD STCG) */
  A.a6 = engAgg(C.a6,{unq:1,loss94:1,dcg:1,deds:["54D","54G","54GA"]}); /* A6g r102 */
  const a7unut=(C.a7&&C.a7.deem||[]).reduce((a,x)=>a+N(x.unused),0);
  A.a7 = {gain:R(a7unut+N((C.a7||{}).other)+N((C.a7||{}).other45))};   /* A7 r114 = ΣX + 7b + 7c */
  A.a8 = {gain:R(["r20","r30","rApp"].reduce((a,k)=>a+N((C.a8||{})[k]),0))}; /* A8 r115 */
  A.a9 = engDTAA(C.a9);                                               /* A9a/A9b r125/126 (NR) */
  A.aA = {loss:R((C.aA||[]).reduce((a,x)=>a+N(x.amt),0))};            /* A(A) r128 buy-back STCL (≥0 magnitude) */
  /* A10 r133 = A1e+A2c+A3ie+A3iie+A4a+A4b+A5e+A6g+A7+A8−A9a + A(A) (A4/A5 = 0 for a resident) */
  A.total=R(A.a1+A.a2.gain+A.a3i+A.a3ii+A.a4.gain+A.a5.gain+A.a6.gain+A.a7.gain+A.a8.gain-A.a9.notTax-A.aA.loss);

  /* ---- Part B · long-term ----------------------------------------- */
  const B={};
  B.b1=R(land.lt.reduce((a,p)=>a+p._.gain,0));                        /* B1g ΣS157 = TotalLTCGImmblPrprty (r166) */
  B.b2=engSlump(C.b2,true);                                           /* B2e r176 */
  B.b3=engAgg(C.b3,{noExempt:1});                                     /* B3c r199 (listed sec / ZCB 112(1)) */
  B.b4=R(s112a.bal);                                                  /* B4 r207 = ROUND(Col14 of Sch 112A) */
  B.b5=nri?R(N((C.b5||{}).gain)):0;                                   /* B5 r213 (NR, without-indexation) */
  B.b6rows=nri?(C.b6||[]).map(o=>({o,r:engAgg(o,{unq:1,noExempt:1})})):[]; /* B6 r230/246/262/278 (NR) */
  B.b6=R(B.b6rows.reduce((a,x)=>a+x.r.gain,0));                       /* B6c */
  B.b7=(nri||isFii())?R(s115ad.bal):0;                               /* B7 r281 = ROUND(Col14 of Sch 115AD) (NR FII) */
  B.b8=engAgg(C.b8,{unq:1,deds:["54D","54G","54GA"]});               /* B8e r304 (SaleofAssetNA resident catch-all) */
  const b9unut=(C.b9&&C.b9.deem||[]).reduce((a,x)=>a+N(x.unused),0);
  B.b9={gain:R(b9unut+N((C.b9||{}).other)+N((C.b9||{}).other45))};    /* B9 r322 = ΣX + 9b + 9c */
  B.b10={gain:R(["r125a","r125o"].reduce((a,k)=>a+N((C.b10||{})[k]),0))}; /* B10 r325 */
  B.b11=engDTAA(C.b11);                                               /* B11a/B11b r336/337 (NR) */
  B.bA={loss:R(N((C.bA||{}).amt))};                                   /* B(A) r339 buy-back LTCL (≥0 magnitude) */
  /* B12 r344 = B1g+B2e+B3c+B4+B5+B6c+B7+B8e+B9+B10−B11a + B(A) (B5/B6/B7 = 0 for a resident) */
  B.total=R(B.b1+B.b2.gain+B.b3.gain+B.b4+B.b5+B.b6+B.b7+B.b8.gain+B.b9.gain+B.b10.gain-B.b11.notTax-B.bA.loss);

  /* ---- Part E · set-off matrix on the six rate slots -------------- */
  /* Composition (CG book Table E rows r393-r404, and the A10/B13 heads):
     20%   = A3ie (111A @20) + A4a (NR 111A) + A8 r20 (PTI 20%)             − STL20
     30%   = A3iie (115AD @30) + A5e (NR FII) + A8 r30 (PTI 30%)            − STL30
     app.  = A1e + A2c + A4b (NR other) + A6g + A7 + A8 rApp (PTI app.)     − STLAR
     DTAA  = A9b
     12.5% = B1g+B2e+B3c+B4+B5+B6c+B7+B8e+B9+B10                           − B(A)
     LTDTAA= B11b   (A4/A5/B5/B6/B7 = 0 for a resident)                          */
  const bbAt=code=>R((C.aA||[]).filter(x=>(x.rate||"STL20")===code).reduce((a,x)=>a+N(x.amt),0));
  const E={
    st20:R(A.a3i+A.a4.a+N((C.a8||{}).r20)-bbAt("STL20")),
    st30:R(A.a3ii+A.a5.gain+N((C.a8||{}).r30)-bbAt("STL30")),
    stApp:R(A.a1+A.a2.gain+A.a4.b+A.a6.gain+A.a7.gain+N((C.a8||{}).rApp)-bbAt("STLAR")),
    stDTAA:R(A.a9.special),
    lt125:R(B.b1+B.b2.gain+B.b3.gain+B.b4+B.b5+B.b6+B.b7+B.b8.gain+B.b9.gain+B.b10.gain-B.bA.loss),
    ltDTAA:R(B.b11.special)};
  const gain={},loss={},used={},absorbed={},matrix={};
  KEYS.forEach(k=>{gain[k]=Math.max(0,E[k]);loss[k]=Math.max(0,-E[k]);used[k]=0;absorbed[k]=0;matrix[k]={};});
  const isLong=k=>k.charAt(0)==="l";
  if(st0(C.editE)==="Yes" && C.Eover){                               /* r418 EditAutopoulatedDetail override */
    KEYS.forEach(gk=>KEYS.forEach(lk=>{const v=N(((C.Eover[gk]||{})[lk]));
      if(v>0){matrix[gk][lk]=v;absorbed[gk]+=v;used[lk]+=v;}}));
  } else {
    /* auto set-off: a STCL sets off any CG; a LTCL sets off only LTCG (Part E rule) */
    KEYS.forEach(lk=>{if(!loss[lk])return;let avail=loss[lk];
      KEYS.forEach(gk=>{if(avail<=0||gk===lk||!gain[gk])return;
        if(isLong(lk)&&!isLong(gk))return;
        const u=Math.min(avail,gain[gk]-absorbed[gk]);if(u<=0)return;
        matrix[gk][lk]=(matrix[gk][lk]||0)+u;absorbed[gk]+=u;used[lk]+=u;avail-=u;});});
  }
  const after={};let C1=0;
  KEYS.forEach(k=>{after[k]=R(gain[k]-absorbed[k]);C1+=after[k];}); /* C1 r345 = Σ 8ii..8vii of Table E */
  /* unabsorbed current-year capital losses → Schedule CFL (loss section reads these) */
  const cflSTCL=R(["st20","st30","stApp","stDTAA"].reduce((a,k)=>a+(loss[k]-used[k]),0));
  const cflLTCL=R(["lt125","ltDTAA"].reduce((a,k)=>a+(loss[k]-used[k]),0));

  /* ---- Part F · quarters (auto from land sale dates; leftover → last qtr) */
  const Fauto={};KEYS.forEach(k=>Fauto[k]=[0,0,0,0,0]);
  (C.land||[]).forEach(p=>{const r=p._;if(!r||r.gain<=0)return;const q=cgQtr(p.sale);
    Fauto[r.isLT?"lt125":"stApp"][q]+=r.gain;});
  KEYS.forEach(k=>{const placed=Fauto[k].reduce((a,v)=>a+v,0);const rest=Math.max(0,gain[k]-placed);
    if(rest>0)Fauto[k][4]+=rest;});                                   /* bucket total pre-set-off = Σ quarters */
  const F={};KEYS.forEach(k=>{const ov=(C.Fover||{})[k];
    F[k]=(st0(C.editF)==="Yes"&&ov)?ov.map(N):Fauto[k].slice();});

  /* ---- Part C · summary ------------------------------------------- */
  const C2=Math.max(0,vda.cg);                                        /* C2 r346 = MAX(0, Sch VDA item B) */
  const C3=Math.max(0,R(C1+C2));                                      /* C3 r347 = MAX(0, C1 + C2) */

  /* ---- Part D · deduction particulars (disclosure) --------------- */
  const dedD={};
  const addD=(sec,amt,src)=>{if(!N(amt))return;(dedD[sec]=dedD[sec]||[]).push({amt:N(amt),src});};
  (C.land||[]).forEach((p,i)=>Object.keys(p.ded||{}).forEach(k=>addD(k.replace("s",""),(p.ded||{})[k],"land"+i)));
  [["a6",C.a6],["b8",C.b8]].forEach(([h,o])=>Object.keys((o||{}).ded||{}).forEach(k=>addD(k.replace("s",""),(o.ded||{})[k],h)));
  if(N((C.b2||{}).ded&&C.b2.ded.s54EC))addD("54EC",C.b2.ded.s54EC,"b2");
  const dedTotal=Object.values(dedD).reduce((a,rows)=>a+rows.reduce((b,r)=>b+r.amt,0),0);

  /* ---- special-rate buckets for Schedule SI ----------------------- */
  const b4b7=Math.max(0,B.b4+B.b7);
  const buckets={
    si111a20:after.st20,                                             /* STCG 111A @20 */
    si30:after.st30,                                                 /* STCG @30 */
    stApp:after.stApp,                                              /* STCG at applicable rates */
    stDTAA:after.stDTAA,
    si112a:Math.max(0,Math.min(after.lt125,b4b7)),                   /* 112A/115AD @12.5 (₹1.25L exempt at tax) */
    si112:Math.max(0,after.lt125-b4b7),                              /* other LTCG @12.5 */
    ltDTAA:after.ltDTAA,
    si115bbh:C2};                                                    /* VDA @30 u/s 115BBH */

  S.C.cg={on:true,nri:nri,land,A,B,E,gain,loss,used,absorbed,matrix,after,F,Fauto,
    buyBackLoss:R(-(N((A.aA||{}).loss)+N((B.bA||{}).loss))),   /* STCL+LTCL buy-back, signed negative (os chk rule 446 / 2(22)(f)) */
    s112a,s115ad,vda,buckets,dedD,dedTotal:R(dedTotal),cflSTCL,cflLTCL,
    dtaaStcgRate:"",dtaaLtcgRate:"",
    C1:R(C1),C2:R(C2),C3:R(C3),
    shortTerm:A.total,longTerm:B.total,total:R(C3),
    income:R(C3)};   /* head's contribution to GTI — C3 (≥0; net CG loss carries via loss section) */
}

/* =====================================================================
   RENDERER
   ===================================================================== */
function calcRow(label,ref,n,ind){return row(label,cell(n),{ref:ref,ind:ind});}

function b48Body(path,r,ref3){let h="";
  h+=row("bi · Reduction as per clause (iii) of s.48 r.w. rule 8AB",inp(path+".red",{n:1}),{ref:"bi",ind:1});
  h+=row("bii · Cost of acquisition (without indexation)",inp(path+".cost",{n:1}),{ref:"bii",ind:1});
  h+=row("biii · Cost of improvement (without indexation)",inp(path+".imp",{n:1}),{ref:"biii",ind:1});
  h+=row("biv · Expenditure wholly & exclusively on transfer",inp(path+".exp",{n:1}),{ref:"biv",ind:1});
  h+=calcRow("bv · Total deductions u/s 48 (bi+bii+biii+biv)","bv",r.bv);
  h+=calcRow("c · Balance",ref3||"c",r.c);
  return h;}

function landBlock(p,i,lt){const r=p._||engLand(p);let h="";
  h+=row("Date of purchase / acquisition",dte("cg.land."+i+".buy"),{ref:lt?"B1":"A1"});
  h+=row("Date of sale / transfer",dte("cg.land."+i+".sale"),{});
  h+=row("a i · Full value of consideration received/receivable",inp("cg.land."+i+".cons",{n:1}),{ref:"ai"});
  h+=row("ii · Value per stamp valuation authority",inp("cg.land."+i+".sdv",{n:1}),{ref:"aii"});
  h+=calcRow("iii · Full value of consideration u/s 50C","aiii",r.value);
  if(!r.safe)h+=note("Stamp value exceeds consideration by more than 10% — u/s 50C the stamp value is adopted.","warn");
  h+=row("b · Deductions under section 48","",{ref:"b"});
  h+=row("bi · Reduction as per clause (iii) of s.48 r.w. rule 8AB",inp("cg.land."+i+".red",{n:1}),{ref:"bi",ind:1});
  h+=row("bii · Cost of acquisition (without indexation)",inp("cg.land."+i+".cost",{n:1}),{ref:"bii",ind:1});
  if(lt)h+=calcRow("Cost of acquisition (with indexation)","AquisitCostIndex",r.costIdx,1);
  h+=row("biii · Cost of improvement (without indexation)",inp("cg.land."+i+".imp",{n:1}),{ref:"biii",ind:1});
  h+=row("biv · Expenditure wholly & exclusively on transfer",inp("cg.land."+i+".exp",{n:1}),{ref:"biv",ind:1});
  h+=calcRow("bv · Total deductions u/s 48 (bi+bii+biii+biv)","bv",r.bv);
  h+=calcRow("c · Balance (aiii − bv)","1c",r.c);
  const ex=lt?EXLT_LAND:EXST_LAND;
  ex.forEach(([code])=>{h+=row("d · Deduction u/s "+code,inp("cg.land."+i+".ded.s"+code,{n:1}),{ref:code,ind:1});});
  h+=calcRow(lt?"e · LTCG on immovable property (1c − 1d)":"e · STCG on immovable property (1c − 1d)",lt?"B1e":"A1e",r.e);
  /* buyer table (194-IA) + property location → TrnsfImmblPrprtyDtls */
  h+=row("Address of property",inp("cg.land."+i+".paddr"),{ref:"AddressOfProperty"});
  h+=row("State",sel("cg.land."+i+".pstate",CG_STATE),{ref:"StateCode"});
  h+=row("Pin code",inp("cg.land."+i+".ppin",{max:6}),{ref:"PinCode"});
  h+=row("Country code",sel("cg.land."+i+".pcountry",CG_CO_IN,{blank:false}),{ref:"CountryCode"});
  h+=row("ZIP code (if property outside India)",inp("cg.land."+i+".pzip",{max:8}),{ref:"ZipCode"});
  h+=grid("cg.land."+i+".buyers",[
      {h:"Name of buyer",k:"name",t:"txt"},
      {h:"PAN",k:"pan",t:"txt",max:10},
      {h:"Aadhaar",k:"aadhaar",t:"txt",max:12},
      {h:"% share",k:"share",t:"num"},
      {h:"Amount",k:"amt",t:"num"}
    ],(p.buyers||[]),{empty:"No buyer detail.",add:"Add a buyer",min:"860px"});
  return blk("cgland"+(lt?"L":"S")+i,(lt?"Long-term property ":"Short-term property ")+(i+1),
    RS(r.gain),h,"cg.land."+i);
}

function aggBody(path,r,opts){opts=opts||{};let h="";
  if(opts.unq){
    h+=row("a · Full value — unquoted shares (received/receivable)",inp(path+".unqCons",{n:1}),{ref:"ia"});
    h+=row("b · Fair market value of unquoted shares (Rule 11UA)",inp(path+".unqFmv",{n:1}),{ref:"ib"});
    h+=calcRow("c · Full value u/s 50CA (higher of a / b)","ic",r.c50ca||Math.max(N(get(path+".unqCons")),N(get(path+".unqFmv"))));
    h+=row("ii · Full value — assets other than unquoted shares",inp(path+".othCons",{n:1}),{ref:"ii"});
    h+=calcRow("iii · Total consideration (ic + ii)","aiii",r.cons);
  } else {
    h+=row("a · Full value of consideration",inp(path+".cons",{n:1}),{ref:"a"});
  }
  h+=b48Body(path,r,"c");
  if(opts.loss94)h+=row("d · Loss disallowed u/s 94(7)/94(8)",inp(path+".loss94",{n:1}),{ref:"d"});
  if(opts.dcg)h+=row("e · Deemed STCG on depreciable assets (Sch DCG item 6)",inp(path+".dcg",{n:1}),{ref:"DeemedSTCGDeprAsset"});
  (opts.deds||[]).forEach(code=>h+=row("Deduction u/s "+code,inp(path+".ded.s"+code,{n:1}),{ref:code,ind:1}));
  return h;
}

function scripGrid(key,rows){
  return grid(key,[
    {h:"Acquired",k:"pre18",t:"sel",opts:OB},
    {h:"Transferred",k:"after23",t:"sel",opts:TR23},
    {h:"ISIN",k:"isin",t:"txt",max:12},
    {h:"Name",k:"name",t:"txt",max:30},
    {h:"Qty (if ≤31-Jan-18)",k:"qty",t:"num"},
    {h:"Sale price/unit",k:"price",t:"num"},
    {h:"Sale value (if >31-Jan-18)",k:"sale6",t:"num"},
    {h:"Sale value (Col 6)",k:"sale",t:"calc",f:r=>(r._||{}).sale||0},
    {h:"Cost (Col 8)",k:"cost",t:"num"},
    {h:"FMV/unit 31-Jan-18",k:"fmv18",t:"num"},
    {h:"Cost w/o index (Col 7)",k:"cwo",t:"calc",f:r=>(r._||{}).cwo||0},
    {h:"Expenditure",k:"exp",t:"num"},
    {h:"Total deductions",k:"td",t:"calc",f:r=>(r._||{}).totded||0},
    {h:"Balance (Col 14)",k:"bal",t:"calc",f:r=>(r._||{}).bal||0}
  ],rows,{empty:"No scrip entered.",add:"Add a scrip",min:"1360px"});
}

function setoffTable(G){
  const LBL={st20:"STCG @20%",st30:"STCG @30%",stApp:"STCG applicable",stDTAA:"STCG DTAA",
    lt125:"LTCG @12.5%",ltDTAA:"LTCG DTAA"};
  /* r418: the whole Table-E matrix auto-populates and is editable only via
     EditAutopoulatedDetail (CG.md:388). Off → read-only summary; On → editable matrix. */
  if(st0(S.cg.editE)!=="Yes"){
    let h='<div class="full"><table class="gt" style="min-width:720px"><thead><tr>'+
      '<th class="l">Type of capital gain</th><th>Gain of CY</th><th>Loss set off</th><th>Remaining</th></tr></thead><tbody>';
    KEYS.forEach(k=>{h+='<tr><td class="l">'+esc(LBL[k])+'</td><td class="num">'+cell(G.gain[k])+
      '</td><td class="num">'+cell(G.absorbed[k])+'</td><td class="num">'+cell(G.after[k])+'</td></tr>';});
    h+='</tbody></table></div>';return h;
  }
  /* manual override: each intersection is an editable cell writing S.cg.Eover[gain][loss]
     (mirrors quartersTable Part-F cg.Fover.*); the engine reads these at r418.
     A STCL may set off any capital gain; a LTCL only LTCG (Part-E rule, matches expCg gating). */
  const isLong=k=>k.charAt(0)==="l";
  let h=note("Manual set-off is on: enter the loss of each type set off against each gain. A short-term loss may set off any capital gain; a long-term loss only long-term gains. Blank cells are treated as nil.","warn")+
    '<div class="full"><table class="gt" style="min-width:1120px"><thead><tr>'+
    '<th class="l">Gain \\ Loss set off</th><th>Gain of CY</th>';
  KEYS.forEach(lk=>h+='<th>'+esc(LBL[lk])+'</th>');
  h+='<th>Total set off</th><th>Remaining</th></tr></thead><tbody>';
  KEYS.forEach(gk=>{h+='<tr><td class="l">'+esc(LBL[gk])+'</td><td class="num">'+cell(G.gain[gk])+'</td>';
    KEYS.forEach(lk=>{const valid=lk!==gk&&(isLong(gk)||!isLong(lk));
      h+=valid?'<td>'+inp("cg.Eover."+gk+"."+lk,{n:1})+'</td>':'<td class="num">—</td>';});
    h+='<td class="num">'+cell(G.absorbed[gk])+'</td><td class="num">'+cell(G.after[gk])+'</td></tr>';});
  h+='</tbody></table></div>';return h;
}

function quartersTable(G){
  const LBL={st20:"STCG @20%",st30:"STCG @30%",stApp:"STCG applicable",stDTAA:"STCG DTAA",
    lt125:"LTCG @12.5%",ltDTAA:"LTCG DTAA"};
  const ed=!!S.cg.editF;
  let h='<div class="full"><table class="gt" style="min-width:820px"><thead><tr><th class="l">Gain</th>'+
    '<th>Upto 15/6</th><th>16/6–15/9</th><th>16/9–15/12</th><th>16/12–15/3</th><th>16/3–31/3</th></tr></thead><tbody>';
  KEYS.forEach(k=>{h+='<tr><td class="l">'+esc(LBL[k])+'</td>';
    for(let q=0;q<5;q++){const v=(G.F[k]||[])[q]||0;
      h+='<td>'+(ed?inp("cg.Fover."+k+"."+q,{n:1}):cell(v))+'</td>';}
    h+='</tr>';});
  h+='</tbody></table></div>';return h;
}

function dclaimBlock(C){
  const dc=C.dclaim||{};let h="";
  DCLAIM.forEach(Dd=>{const rows=dc[Dd.ns]||[];let cols;
    if(Dd.invest)cols=[
      {h:"Date of transfer of original asset",k:"transfer",t:"date"},
      {h:"Amount invested in bonds",k:"invested",t:"num"},
      {h:"Date of investment",k:"invdate",t:"date"},
      {h:"Amount of deduction claimed",k:"amt",t:"num"}];
    else cols=[
      {h:(Dd.acq?"Date of acquisition of original asset":"Date of transfer of original asset"),k:"transfer",t:"date"},
      {h:Dd.costH,k:"cost",t:"num"},
      {h:"Date of purchase / construction",k:"purchase",t:"date"},
      {h:"Amount deposited in CGAS before due date",k:"deposited",t:"num"},
      {h:"Date of deposit",k:"depdate",t:"date"},
      {h:"Account no.",k:"acno",t:"txt",max:20},
      {h:"IFS code",k:"ifsc",t:"txt",max:11},
      {h:"Amount of deduction claimed",k:"amt",t:"num"}];
    h+='<p style="margin:12px 0 2px;font-weight:600;color:var(--ink-2)">'+esc(Dd.lbl)+'</p>';
    h+=grid("cg.dclaim."+Dd.ns,cols,rows,{empty:"No claim detail entered.",add:"Add a claim",min:Dd.invest?"760px":"1280px"});
  });
  return h;
}

function dtaaGrid(key,rows,itemOpts){
  return grid(key,[
    {h:"Amount of income",k:"amt",t:"num"},
    {h:"Item included",k:"itemno",t:"sel",opts:itemOpts||DTAA_ITEM_ST},
    {h:"Country name",k:"country",t:"txt"},
    {h:"Country code",k:"ccode",t:"sel",opts:CG_CO},
    {h:"Article of DTAA",k:"article",t:"txt",max:20},
    {h:"Rate as per Treaty (%)",k:"treaty",t:"num"},
    {h:"TRC obtained?",k:"trc",t:"sel",opts:TRCYN},
    {h:"Section of I.T. Act",k:"secit",t:"txt",max:20},
    {h:"Rate as per I.T. Act (%)",k:"itact",t:"num"},
    {h:"Applicable rate (lower)",k:"appl",t:"calc",f:r=>(r._appl!=null?r._appl:0)}
  ],rows,{empty:"No DTAA relief entered.",add:"Add a DTAA row",min:"1360px"});
}

function secCg(){
  const G=S.C.cg||{on:false};
  if(!G.on){
    return note("Turn this on to open Schedule CG — land/building, slump sale, listed/112A equity, other assets, deemed gains, pass-through, DTAA, buy-back losses, and Virtual Digital Assets.")+
      row("Report capital gains?",sel("cg.on",[["true","Yes"]],{blank:true}),{ref:"Schedule CG · C3"});
  }
  const C=S.cg;let h="";
  h+=row("Report capital gains?",sel("cg.on",[["false","No"],["true","Yes"]],{blank:false}),{ref:"Schedule CG"});

  /* ---- A · short-term ---- */
  let a="";
  (G.land.st||[]).forEach(p=>a+=landBlock(p,p._i,false));
  a+='<button class="add" data-addland="Short">Add a short-term property (A1)</button>';
  a+=fold("cga2","A2c","A2 · Slump sale (STCG)",RS(G.A.a2.gain),
    row("ai · FMV as per Rule 11UAE(2)",inp("cg.a2.fmv2",{n:1}),{ref:"ai"})+
    row("aii · FMV as per Rule 11UAE(3)",inp("cg.a2.fmv3",{n:1}),{ref:"aii"})+
    calcRow("aiii · Full value (higher of ai / aii)","aiii",G.A.a2.value)+
    row("b · Net worth of the undertaking / division",inp("cg.a2.networth",{n:1}),{ref:"2b"})+
    calcRow("c · STCG from slump sale (2aiii − 2b)","A2c",G.A.a2.gain),{});
  /* A3 — two EquityMFonSTT sub-heads (max 2) */
  let a3="";
  (C.a3||[]).forEach((o,i)=>{const rr=(G.A.a3rows[i]||{}).r||engAgg(o,{loss94:1,noExempt:1});
    a3+=blk("cga3_"+i,"A3 sub-head "+(i+1),RS(rr.gain),
      row("Section",sel("cg.a3."+i+".mfsec",MFSEC),{ref:"MFSectionCode"})+
      row("ia · Full value of consideration",inp("cg.a3."+i+".cons",{n:1}),{ref:"3ia"})+
      b48Body("cg.a3."+i,rr,"3ic")+
      row("id · Loss to be ignored u/s 94(7)/94(8)",inp("cg.a3."+i+".loss94",{n:1}),{ref:"3id"})+
      calcRow("ie · STCG on equity/EOMF (STT paid) (3ic + 3id)","A3ie",rr.gain),
      "cg.a3."+i);});
  if((C.a3||[]).length<2)a3+='<button class="add" data-add="cg.a3">Add an A3 sub-head</button>';
  a+=fold("cga3","A3","A3 · Equity share / EOMF / business-trust units (STT paid)",RS(G.A.a3i+G.A.a3ii),a3,{});
  a+=fold("cga6","A6g","A6 · STCG on other assets",RS(G.A.a6.gain),
    aggBody("cg.a6",G.A.a6,{unq:1,loss94:1,dcg:1,deds:["54D","54G","54GA"]})+
    calcRow("g · STCG on other assets (6c + 6d + 6e − 6f)","A6g",G.A.a6.gain),{});
  /* A7 deemed STCG */
  const a7unut=st0((C.a7||{}).unutFlag)==="Y"||(((C.a7||{}).deem||[]).length>0);
  a+=fold("cga7","A7","A7 · Amount deemed to be STCG",RS(G.A.a7.gain),
    row("Any unutilized capital gain from an earlier year chargeable now?",
      sel("cg.a7.unutFlag",UNUTYN,{blank:true}),{ref:"UnutilizedStcgFlag"})+
    (a7unut?grid("cg.a7.deem",[
      {h:"PY of transfer",k:"py",t:"sel",opts:DEEM_ST_PY},
      {h:"Section",k:"sec",t:"sel",opts:DEEM_ST_SEC},
      {h:"PY new asset acquired/constructed",k:"yracq",t:"sel",opts:YRACQ},
      {h:"Amount utilised out of CGAS",k:"util",t:"num"},
      {h:"Amount unutilised",k:"unused",t:"num"}
    ],(C.a7||{}).deem||[],{empty:"No unutilised CGAS.",add:"Add a row",min:"940px"}):"")+
    row("b · Amount deemed STCG u/s 54G/54GA, other than at 'a'",inp("cg.a7.other",{n:1}),{ref:"7b"})+
    row("c · Amount deemed STCG per s.45(4) r.w. s.9B",inp("cg.a7.other45",{n:1}),{ref:"7c"})+
    calcRow("Total deemed STCG (ΣX + 7b + 7c)","A7",G.A.a7.gain),{});
  /* A8 PTI */
  a+=fold("cga8","A8","A8 · Pass-through STCG (Sch PTI)",RS(G.A.a8.gain),
    row("a · chargeable @ 20%",inp("cg.a8.r20",{n:1}),{ref:"8a"})+
    row("b · chargeable @ 30%",inp("cg.a8.r30",{n:1}),{ref:"8b"})+
    row("c · at applicable rates",inp("cg.a8.rApp",{n:1}),{ref:"8c"})+
    calcRow("Total pass-through STCG","A8",G.A.a8.gain),{});
  /* A(A) buy-back STCL */
  a+=fold("cgaA","A(A)","A(A) · Capital loss on buy-back of shares (STCL)",RS(-G.A.aA.loss),
    note("Enter each loss as a positive amount; it is reported as a negative figure. Claimable only if the buy-back income is offered under IFOS.")+
    grid("cg.aA",[{h:"Rate",k:"rate",t:"sel",opts:BBST},{h:"Loss amount",k:"amt",t:"num"}],
      C.aA||[],{empty:"No buy-back loss.",add:"Add a row",min:"560px"}),{});
  /* NON-RESIDENT STCG heads A4/A5 + DTAA A9 — non-resident only */
  if(G.nri){
    a+=fold("cga4","A4","A4 · STCG for a non-resident (111A / other shares & debentures)",RS(G.A.a4.gain),
      row("a · STCG on transactions covered u/s 111A (STT paid)",inp("cg.a4.sttPaid",{n:1}),{ref:"A4a"})+
      row("b · STCG from shares/debentures not covered at 4a",inp("cg.a4.sttNot",{n:1}),{ref:"A4b"})+
      calcRow("Total STCG for non-resident (A4a + A4b)","A4",G.A.a4.gain),{});
    a+=fold("cga5","A5e","A5 · STCG on securities by an FII u/s 115AD",RS(G.A.a5.gain),
      aggBody("cg.a5",G.A.a5,{unq:1,loss94:1})+
      calcRow("e · STCG on securities by an FII (5c + 5d)","A5e",G.A.a5.gain),{});
    a+=fold("cga9","A9","A9 · STCG not chargeable / at special rate per DTAA",RS(G.A.a9.special),
      dtaaGrid("cg.a9",C.a9||[],DTAA_ITEM_ST)+
      calcRow("a · STCG not chargeable to tax as per DTAA","A9a",G.A.a9.notTax)+
      calcRow("b · STCG chargeable at special rate as per DTAA","A9b",G.A.a9.special),{});
  }
  a+=calcRow("A10 · Total short-term capital gain","A10",G.A.total);
  h+=fold("cgA","A · STCG","Short-term capital gains",RS(G.A.total),a,{def:true});

  /* ---- B · long-term ---- */
  let b="";
  (G.land.lt||[]).forEach(p=>b+=landBlock(p,p._i,true));
  b+='<button class="add" data-addland="Long">Add a long-term property (B1)</button>';
  b+=fold("cgb2","B2e","B2 · Slump sale (LTCG)",RS(G.B.b2.gain),
    row("ai · FMV as per Rule 11UAE(2)",inp("cg.b2.fmv2",{n:1}),{ref:"2ai"})+
    row("aii · FMV as per Rule 11UAE(3)",inp("cg.b2.fmv3",{n:1}),{ref:"2aii"})+
    calcRow("aiii · Full value (higher of ai / aii)","2aiii",G.B.b2.value)+
    row("b · Net worth of the undertaking / division",inp("cg.b2.networth",{n:1}),{ref:"2b"})+
    calcRow("c · Balance (2aiii − 2b)","2c",G.B.b2.c)+
    row("d · Deduction u/s 54EC",inp("cg.b2.ded.s54EC",{n:1}),{ref:"2d",ind:1})+
    calcRow("e · LTCG from slump sale (2c − 2d)","B2e",G.B.b2.gain),{});
  b+=fold("cgb3","B3c","B3 · Listed securities / zero-coupon bonds u/s 112(1)",RS(G.B.b3.gain),
    row("Section code",sel("cg.b3.sec",PROV112,{blank:false}),{ref:"Proviso112SectionCode"})+
    row("a · Full value of consideration",inp("cg.b3.cons",{n:1}),{ref:"3a"})+
    b48Body("cg.b3",G.B.b3,"B3c")+
    calcRow("c · LTCG on assets at B3 (3a − bv)","B3c",G.B.b3.gain),{});
  b+=fold("cgb4","B4","B4 · Equity / EOMF / business trust u/s 112A (STT paid)",RS(G.B.b4),
    note("Enter the scrips in Schedule 112A below; the Col 14 total feeds B4.")+
    calcRow("Total (Col 14 of Schedule 112A)","B4",G.B.b4)+
    scripGrid("cg.s112a",C.s112a||[]),{def:true});
  b+=fold("cgb8","B8e","B8 · LTCG on assets where B1–B7 are not applicable",RS(G.B.b8.gain),
    aggBody("cg.b8",G.B.b8,{unq:1,deds:["54D","54G","54GA"]})+
    calcRow("e · LTCG on assets at B8 (8c − 8d)","B8e",G.B.b8.gain),{});
  /* B9 deemed LTCG */
  const b9unut=st0((C.b9||{}).unutFlag)==="Y"||(((C.b9||{}).deem||[]).length>0);
  b+=fold("cgb9","B9","B9 · Amount deemed to be LTCG",RS(G.B.b9.gain),
    row("Any unutilized capital gain from an earlier year chargeable now?",
      sel("cg.b9.unutFlag",UNUTYN,{blank:true}),{ref:"UnutilizedLtcgFlag"})+
    (b9unut?grid("cg.b9.deem",[
      {h:"PY of transfer",k:"py",t:"sel",opts:DEEM_ST_PY},
      {h:"Section",k:"sec",t:"sel",opts:DEEM_LT_SEC},
      {h:"PY new asset acquired/constructed",k:"yracq",t:"sel",opts:YRACQ},
      {h:"Amount utilised out of CGAS",k:"util",t:"num"},
      {h:"Amount unutilised",k:"unused",t:"num"}
    ],(C.b9||{}).deem||[],{empty:"No unutilised CGAS.",add:"Add a row",min:"940px"}):"")+
    row("b · Amount deemed LTCG, other than at 'a'",inp("cg.b9.other",{n:1}),{ref:"9b"})+
    row("c · Amount deemed LTCG per s.45(4) r.w. s.9B",inp("cg.b9.other45",{n:1}),{ref:"9c"})+
    calcRow("Total deemed LTCG (ΣX + 9b + 9c)","B9",G.B.b9.gain),{});
  /* B10 PTI */
  b+=fold("cgb10","B10","B10 · Pass-through LTCG (Sch PTI)",RS(G.B.b10.gain),
    row("a1 · chargeable @ 12.5% u/s 112A",inp("cg.b10.r125a",{n:1}),{ref:"10a1"})+
    row("a2 · chargeable @ 12.5% other than 112A",inp("cg.b10.r125o",{n:1}),{ref:"10a2"})+
    calcRow("Total pass-through LTCG","B10",G.B.b10.gain),{});
  /* B(A) buy-back LTCL — single negative total */
  b+=fold("cgbA","B(A)","B(A) · Capital loss on buy-back of shares (LTCL @12.5%)",RS(-G.B.bA.loss),
    note("Enter the loss as a positive amount; it is reported as a negative figure. Claimable only if the buy-back income is offered under IFOS.")+
    row("Long-term capital loss on buy-back",inp("cg.bA.amt",{n:1}),{ref:"B(A)"}),{});
  /* NON-RESIDENT LTCG heads B5/B6/B7 + DTAA B11 — non-resident / FII only */
  if(G.nri){
    b+=fold("cgb5","B5","B5 · LTCG on unlisted shares / listed debentures (non-resident)",RS(G.B.b5),
      row("LTCG computed without indexation benefit (1st proviso to s.48)",inp("cg.b5.gain",{n:1}),{ref:"B5"}),{});
    let b6="";
    (C.b6||[]).forEach((o,i)=>{const rr=(G.B.b6rows[i]||{}).r||engAgg(o,{unq:1,noExempt:1});
      b6+=blk("cgb6_"+i,"B6 asset "+(i+1),RS(rr.gain),
        row("Section",sel("cg.b6."+i+".sec",B6SEC),{ref:"SectionCode"})+
        aggBody("cg.b6."+i,rr,{unq:1})+
        calcRow("c · LTCG on assets at B6 (aiii − bv)","B6c",rr.gain),
        "cg.b6."+i);});
    b6+='<button class="add" data-add="cg.b6">Add a B6 asset</button>';
    b+=fold("cgb6","B6c","B6 · LTCG for non-resident u/s 112(1)(c) / 115AB / 115AC / 115AD",RS(G.B.b6),b6,{});
  }
  if(G.nri||isFii()){
    b+=fold("cgb7","B7","B7 · FII/FPI 112A route u/s 115AD(1)(b)(iii) proviso",RS(G.B.b7),
      calcRow("Total (Col 14 of Schedule 115AD)","B7",G.B.b7)+
      scripGrid("cg.s115ad",C.s115ad||[]),{});
  }
  if(G.nri){
    b+=fold("cgb11","B11","B11 · LTCG not chargeable / at special rate per DTAA",RS(G.B.b11.special),
      dtaaGrid("cg.b11",C.b11||[],DTAA_ITEM_LT)+
      calcRow("a · LTCG not chargeable to tax as per DTAA","B11a",G.B.b11.notTax)+
      calcRow("b · LTCG chargeable at special rate as per DTAA","B11b",G.B.b11.special),{});
  }
  b+=calcRow("B12 · Total long-term capital gain","B12",G.B.total);
  h+=fold("cgB","B · LTCG","Long-term capital gains",RS(G.B.total),b,{def:true});

  /* ---- C · summary ---- */
  h+=fold("cgC","C","Summary of capital gains",RS(G.C3),
    calcRow("C1 · Sum of capital gain incomes (Table E after set-off)","C1",G.C1)+
    calcRow("C2 · Income from transfer of Virtual Digital Assets (Sch VDA item B)","C2",G.C2)+
    calcRow("C3 · Income chargeable under CAPITAL GAINS (C1 + C2)","C3",G.C3),{def:true});

  /* ---- Schedule VDA ---- */
  let v="";
  v+=grid("cg.vda",[
      {h:"Date of acquisition",k:"buy",t:"date"},
      {h:"Date of transfer",k:"sale",t:"date"},
      {h:"Head",k:"head",t:"sel",opts:HEADVDA},
      {h:"Cost of acquisition",k:"cost",t:"num"},
      {h:"Consideration received",k:"cons",t:"num"},
      {h:"Income (Col 6 − Col 5)",k:"inc",t:"calc",f:r=>(r._||{}).inc||0}
    ],C.vda||[],{empty:"No VDA transfer.",add:"Add a transfer",min:"820px"});
  v+=calcRow("A · Total positive Business Income (Sch BP 3f u/s 115BBH)","TotIncBusiness",G.vda.bi);
  v+=calcRow("B · Total positive Capital Gain (feeds C2)","TotIncCapGain",G.vda.cg);
  h+=fold("cgVDA","Schedule VDA","Virtual Digital Assets",RS(G.vda.bi+G.vda.cg),v,{});

  /* ---- D · deductions claimed ---- */
  let d="";
  if(G.dedTotal){Object.keys(G.dedD).forEach(sec=>{const rows=G.dedD[sec];
    d+=calcRow("Deduction u/s "+sec,sec,rows.reduce((a,r)=>a+r.amt,0));});}
  d+=calcRow("1e · Total deduction claimed","1e",G.dedTotal);
  h+=fold("cgD","D","Deductions claimed against capital gains",RS(G.dedTotal),
    (G.dedTotal?"":note("Deductions entered against each head above are totalled here."))+d,{});
  let dclaimTot=0;DCLAIM.forEach(Dd=>((C.dclaim||{})[Dd.ns]||[]).forEach(r=>dclaimTot+=N(r.amt)));
  h+=fold("cgDdet","D","Details of deduction claimed (CGAS / new asset)",RS(dclaimTot),
    note("Enter the proof of each 54D/54EC/54G/54GA exemption claimed above — date of transfer, cost of the new asset, "+
      "CGAS deposit and account. Disclosure detail; it does not alter the computed gain.")+
    dclaimBlock(C),{});

  /* ---- E · set-off ---- */
  h+=fold("cgE","E","Set-off of current-year capital losses",RS(G.C1),
    setoffTable(G)+
    row("Edit the auto-populated set-off?",sel("cg.editE",[["No","No"],["Yes","Yes"]],{blank:false}),{ref:"EditAutopoulatedDetail"}),{});

  /* ---- F · quarterly split (234C) ---- */
  h+=fold("cgF","F","Accrual / receipt of capital gain (quarterly, for 234C)","—",
    note("Each bucket's quarter total ties to the matching item of Schedule BFLA; the utility scales it to the after-set-off figure.")+
    quartersTable(G)+
    row("Edit the auto-filled quarters?",sel("cg.editF",[["No","No"],["Yes","Yes"]],{blank:false}),{ref:"AccruOrRecOfCG"}),{});

  return h;
}

/* =====================================================================
   EXPORT — ScheduleCG / Schedule112A / Schedule115AD / ScheduleVDA (via put)
   ===================================================================== */
function scripBlock(rows,suf){
  const good=(rows||[]).filter(r=>r.pre18&&(N((r._||{}).sale)||N((r._||{}).bal)||N(r.cost)||N(r.sale6)||N(r.qty)));
  if(!good.length)return null;
  const t=engScrip(good);
  const dtls=good.map(r=>{const x=r._||{};const pre=r.pre18==="BE";
    return {ShareOnOrBefore:pre?"BE":"AE",
      ISINCode: pre?(/^IN[0-9A-Z]{10}$/.test(st0(r.isin).toUpperCase())?st0(r.isin).toUpperCase():"INNOTAVAILAB"):"INNOTREQUIRD",
      ShareUnitName: pre?((sv(r.name)||"NA").slice(0,125)):"CONSOLIDATED",
      NumSharesUnits: pre?(N(r.qty)||undefined):undefined,
      SalePricePerShareUnit: pre?(N(r.price)||undefined):undefined,
      TotSaleValue:n0(x.sale),CostAcqWithoutIndx:n0(x.cwo),AcquisitionCost:n0(r.cost),
      LTCGBeforelower6and11:n0(x.col9),FairMktValuePerShareunit:pre?(N(r.fmv18)||0):0,
      TotFairMktValueCapAst:n0(x.fmvTot),ExpExclCnctTransfer:n0(r.exp),
      TotalDeductions:n0(x.totded),Balance:sg(x.bal)};});
  const bl={};bl["Schedule"+suf+"Dtls"]=dtls;
  bl["SaleValue"+suf]=n0(t.sale);bl["CostAcqWithoutIndx"+suf]=n0(t.cwo);
  bl["AcquisitionCost"+suf]=n0(t.cost);bl["LTCGBeforelowerB1B2"+suf]=n0(t.before);
  bl["FairMktValueCapAst"+suf]=n0(t.fmv);bl["ExpExclCnctTransfer"+suf]=n0(t.exp);
  bl["Deductions"+suf]=n0(t.ded);bl["Balance"+suf]=sg(t.bal);
  return bl;
}

function expCg(j){
  const G=S.C.cg;if(!G||!G.on)return;
  const C=S.cg,A=G.A,B=G.B;
  const buyers=p=>{const bs=(p.buyers||[]).filter(x=>st0(x.name));if(!bs.length)return undefined;
    return {TrnsfImmblPrprtyDtls:bs.map(x=>({NameOfBuyer:st0(x.name).slice(0,125),
      PANofBuyer:PAN_RE.test(st0(x.pan).toUpperCase())?st0(x.pan).toUpperCase():undefined,
      AaadhaarOfBuyer:AADH.test(st0(x.aadhaar))?st0(x.aadhaar):undefined,
      PercentageShare:N(x.share)||100,Amount:n0(x.amt),
      AddressOfProperty:(sv(p.paddr)||"NA").slice(0,50),
      StateCode:CG_STATE_SET[st0(p.pstate)]?st0(p.pstate):"19",
      CountryCode:CG_CO_IN_SET[st0(p.pcountry)]?st0(p.pcountry):"91",
      PinCode:/^[1-9]\d{5}$/.test(st0(p.ppin))?parseInt(p.ppin,10):undefined,
      ZipCode:st0(p.pzip)?st0(p.pzip).slice(0,8):undefined}))};};
  const exArr=(ded,set)=>{const ex=[];Object.keys(ded||{}).forEach(k=>{const code=k.replace("s","");
    if(set[code]&&N(ded[k]))ex.push({ExemptionSecCode:code,ExemptionAmount:n0(ded[k])});});return ex;};
  const dtaaOut=rows=>{const good=(rows||[]).filter(r=>N(r.amt));if(!good.length)return undefined;
    return {NRIDTAADtls:good.map(r=>{const o={DTAAamt:n0(r.amt),ItemNoincl:st0(r.itemno),
      CountryName:st0(r.country),CountryCodeExcludingIndia:CG_CO_SET[st0(r.ccode)]?st0(r.ccode):"9999",DTAAarticle:st0(r.article),
      RateAsPerTreaty:N(r.treaty),SecITAct:st0(r.secit),RateAsPerITAct:N(r.itact)};
      if(r.trc)o.TaxRescertifiedFlag=r.trc;
      if(r._appl!=null)o.ApplicableRate=r._appl;return o;})};};
  const ded48=o=>({Reduction48iii:n0(o.red),AquisitCost:n0(o.cost),ImproveCost:n0(o.imp),
    ExpOnTrans:n0(o.exp),TotalDedn:n0(dedn48(o))});

  /* ---- Part A · ShortTermCapGain ---- */
  const ST={};
  const stLand=(G.land.st||[]).map(p=>{const r=p._;const ex=exArr(p.ded,EXST_SET);
    return {DateofPurchase:ISO(p.buy),DateofSale:ISO(p.sale),
      FullConsideration:n0(p.cons),PropertyValuation:n0(p.sdv),FullConsideration50C:n0(r.value),
      Reduction48iii:n0(p.red),AquisitCost:n0(p.cost),ImproveCost:n0(p.imp),ExpOnTrans:n0(p.exp),
      TotalDedn:n0(r.bv),Balance:sg(r.c),
      ExemptionOrDednUs54:Object.assign({ExemptionGrandTotal:n0(r.dedTot)},ex.length?{ExemptionOrDednUs54Dtls:ex}:{}),
      CapgainonAssets:sg(r.e),TrnsfImmblPrprty:buyers(p)};});
  if(stLand.length)ST.SaleofLandBuild={SaleofLandBuildDtls:stLand};
  if(N(C.a2&&(C.a2.fmv2||C.a2.fmv3||C.a2.networth)))
    ST.SlumpSaleInStcg={FMV11UAEii:n0(C.a2.fmv2),FMV11UAEiii:n0(C.a2.fmv3),
      FullConsideration:n0(A.a2.value),NetWorthOfDivision:n0(C.a2.networth),CapgainonAssets:sg(A.a2.gain)};
  const a3good=(C.a3||[]).filter(o=>o.mfsec&&(N(o.cons)||N(o.cost)||N(o.red)||N(o.imp)));
  if(a3good.length)ST.EquityMFonSTT=a3good.slice(0,2).map(o=>{const r=engAgg(o,{loss94:1,noExempt:1});
    return {MFSectionCode:o.mfsec,EquityMFonSTTDtls:{FullConsideration:n0(o.cons),
      DeductSec48:ded48(o),BalanceCG:sg(r.c),LossSec94of7Or94of8:n0(o.loss94),CapgainonAssets:sg(r.gain)}};});
  if(N((C.a6||{}).unqCons)||N((C.a6||{}).othCons)||N((C.a6||{}).cost)||N(A.a6.dcg)){
    const ex=exArr((C.a6||{}).ded,EXA6_SET);
    ST.SaleOnOtherAssets={FullValueConsdRecvUnqshr:n0(C.a6.unqCons),FairMrktValueUnqshr:n0(C.a6.unqFmv),
      FullValueConsdSec50CA:n0(A.a6.c50ca||Math.max(N(C.a6.unqCons),N(C.a6.unqFmv))),
      FullValueConsdOthUnqshr:n0(C.a6.othCons),FullConsideration:n0(A.a6.cons),
      DeductSec48:ded48(C.a6),BalanceCG:sg(A.a6.c),LossSec94of7Or94of8:n0(C.a6.loss94),
      DeemedSTCGDeprAsset:n0(A.a6.dcg),
      ExemptionOrDednUs54:Object.assign({ExemptionGrandTotal:n0(A.a6.ded)},ex.length?{ExemptionOrDednUs54Dtls:ex}:{}),
      CapgainonAssets:sg(A.a6.gain)};}
  ST.TotalAmtDeemedStcg=n0(A.a7.gain);
  if(st0((C.a7||{}).unutFlag))ST.UnutilizedStcgFlag=st0(C.a7.unutFlag);
  const dm=(C.a7&&C.a7.deem||[]).filter(x=>N(x.unused)||N(x.util));
  if(dm.length)ST.UnutilizedCg={UnutilizedCgPrvYrDtls:dm.map(x=>{const o={
    PrvYrInWhichAsstTrnsfrd:x.py||"2024-25",SectionClmd:EXST_SET[x.sec]?x.sec:"54G",AmtUnutilized:n0(x.unused)};
    if(YRACQ_SET[st0(x.yracq)])o.YrInWhichAssetAcq=st0(x.yracq);
    if(N(x.util))o.AmtUtilized=n0(x.util);return o;})};
  if(N((C.a7||{}).other))ST.AmtDeemedStcg=n0(C.a7.other);
  if(N((C.a7||{}).other45))ST.AmtDeemedStcg45iv=n0(C.a7.other45);
  ST.PassThrIncNatureSTCG=n0(A.a8.gain);
  if(N((C.a8||{}).r20))ST.PassThrIncNatureSTCG20Per=n0(C.a8.r20);
  if(N((C.a8||{}).r30))ST.PassThrIncNatureSTCG30Per=n0(C.a8.r30);
  if(N((C.a8||{}).rApp))ST.PassThrIncNatureSTCGAppRate=n0(C.a8.rApp);
  ST.TotalAmtNotTaxUsDTAAStcg=n0(A.a9.notTax);ST.TotalAmtTaxUsDTAAStcg=n0(A.a9.special);
  const bb=(C.aA||[]).filter(x=>N(x.amt));
  if(bb.length)ST.CapitalLossBuyBackShares={TotalCapitalLossBuyBackShares:-n0(A.aA.loss),
    CapitalLossBuyBackSharesDtls:bb.map(x=>({Rate:x.rate||"STL20",Amount:-n0(x.amt)}))};
  if(G.nri){
    if(N((C.a4||{}).sttPaid)||N((C.a4||{}).sttNot))
      ST.NRITransacSec48Dtl={NRItaxSTTPaid:n0((C.a4||{}).sttPaid),NRItaxSTTNotPaid:n0((C.a4||{}).sttNot)};
    if(N((C.a5||{}).unqCons)||N((C.a5||{}).othCons)||N((C.a5||{}).cost))
      ST.NRISecur115AD={FullValueConsdRecvUnqshr:n0(C.a5.unqCons),FairMrktValueUnqshr:n0(C.a5.unqFmv),
        FullValueConsdSec50CA:n0(A.a5.c50ca||Math.max(N(C.a5.unqCons),N(C.a5.unqFmv))),
        FullValueConsdOthUnqshr:n0(C.a5.othCons),FullConsideration:n0(A.a5.cons),
        DeductSec48:ded48(C.a5),BalanceCG:sg(A.a5.c),LossSec94of7Or94of8:n0(C.a5.loss94),CapgainonAssets:sg(A.a5.gain)};
    const a9d=dtaaOut(C.a9);if(a9d)ST.NRICgDTAA=a9d;
  }
  ST.TotalSTCG=sg(A.total);

  /* ---- Part B · LongTermCapGain ---- */
  const LT={};
  const ltLand=(G.land.lt||[]).map(p=>{const r=p._;const ex=exArr(p.ded,EXLT_SET);
    return {DateofPurchase:ISO(p.buy),DateofSale:ISO(p.sale),
      FullConsideration:n0(p.cons),PropertyValuation:n0(p.sdv),FullConsideration50C:n0(r.value),
      Reduction48iii:n0(p.red),AquisitCost:n0(p.cost),AquisitCostIndex:n0(r.costIdx),ImproveCost:n0(p.imp),
      ExpOnTrans:n0(p.exp),TotalDedn:n0(r.bv),Balance:sg(r.c),
      ExemptionOrDednUs54:Object.assign({ExemptionGrandTotal:n0(r.dedTot)},ex.length?{ExemptionOrDednUs54Dtls:ex}:{}),
      CapgainonAssets:sg(r.e),TrnsfImmblPrprty:buyers(p)};});
  if(ltLand.length)LT.SaleofLandBuild={SaleofLandBuildDtls:ltLand,TotalLTCGImmblPrprty:sg(B.b1)};
  if(N(C.b2&&(C.b2.fmv2||C.b2.fmv3||C.b2.networth)))
    LT.SlumpSaleInLtcgDtls={SlumpSaleInLtcg:{FMV11UAEii:n0(C.b2.fmv2),FMV11UAEiii:n0(C.b2.fmv3),
      FullConsideration:n0(B.b2.value),NetWorthOfDivision:n0(C.b2.networth),SlumpBalance:sg(B.b2.c),
      DeductionUnderSec54:n0(B.b2.ded),CapgainonAssets:sg(B.b2.gain)}};
  if(N((C.b3||{}).cons)||N((C.b3||{}).cost)||N((C.b3||{}).red))
    LT.Proviso112Applicable={Proviso112SectionCode:st0((C.b3||{}).sec)||"22",
      Proviso112Applicabledtls:{FullConsideration:n0(C.b3.cons),DeductSec48:ded48(C.b3),BalanceCG:sg(B.b3.gain)}};
  LT.SaleOfEquityShareUs112A={CapgainonAssets:sg(B.b4)};
  if(G.nri){
    if(N((C.b5||{}).gain))LT.NRIProvisoSec48={BalanceCG:sg(B.b5)};
    const b6=(C.b6||[]).filter(o=>o.sec&&(N(o.unqCons)||N(o.othCons)||N(o.cost)||N(o.red)));
    if(b6.length)LT.NRIOnSec112and115={NRIOnSec112and115Dtls:b6.map(o=>{const rr=engAgg(o,{unq:1,noExempt:1});
      return {SectionCode:o.sec,FullValueConsdRecvUnqshr:n0(o.unqCons),FairMrktValueUnqshr:n0(o.unqFmv),
        FullValueConsdSec50CA:n0(rr.c50ca||Math.max(N(o.unqCons),N(o.unqFmv))),FullValueConsdOthUnqshr:n0(o.othCons),
        FullConsideration:n0(rr.cons),DeductSec48:ded48(o),BalanceCG:sg(rr.gain)};}),TotalNRIOnSec112and115:sg(B.b6)};
    if((G.nri||isFii()))LT.NRISaleOfEquityShareUs112A={CapgainonAssets:sg(B.b7)};
    const b11d=dtaaOut(C.b11);if(b11d)LT.NRICgDTAA=b11d;
  } else if(isFii()){
    LT.NRISaleOfEquityShareUs112A={CapgainonAssets:sg(B.b7)};
  }
  if(N((C.b8||{}).unqCons)||N((C.b8||{}).othCons)||N((C.b8||{}).cost)||N((C.b8||{}).red)){
    const ex=exArr((C.b8||{}).ded,EXA6_SET);
    LT.SaleofAssetNADtls={SaleofAssetNA:{FullValueConsdRecvUnqshr:n0(C.b8.unqCons),FairMrktValueUnqshr:n0(C.b8.unqFmv),
      FullValueConsdSec50CA:n0(B.b8.c50ca||Math.max(N(C.b8.unqCons),N(C.b8.unqFmv))),
      FullValueConsdOthUnqshr:n0(C.b8.othCons),FullConsideration:n0(B.b8.cons),
      DeductSec48:ded48(C.b8),BalanceCG:sg(B.b8.c),
      ExemptionOrDednUs54:Object.assign({ExemptionGrandTotal:n0(B.b8.ded)},ex.length?{ExemptionOrDednUs54Dtls:ex}:{}),
      CapgainonAssets:sg(B.b8.gain)}};}
  LT.TotalAmtDeemedLtcg=n0(B.b9.gain);
  if(st0((C.b9||{}).unutFlag))LT.UnutilizedLtcgFlag=st0(C.b9.unutFlag);
  const dml=(C.b9&&C.b9.deem||[]).filter(x=>N(x.unused)||N(x.util));
  if(dml.length)LT.UnutilizedCg={UnutilizedCgPrvYrDtls:dml.map(x=>{const o={
    PrvYrInWhichAsstTrnsfrd:x.py||"2024-25",SectionClmd:EXA6_SET[x.sec]?x.sec:"54D",AmtUnutilized:n0(x.unused)};
    if(YRACQ_SET[st0(x.yracq)])o.YrInWhichAssetAcq=st0(x.yracq);
    if(N(x.util))o.AmtUtilized=n0(x.util);return o;})};
  if(N((C.b9||{}).other))LT.AmtDeemedLtcg=n0(C.b9.other);
  if(N((C.b9||{}).other45))LT.AmtDeemedLtcg45iv=n0(C.b9.other45);
  LT.PassThrIncNatureLTCG=n0(B.b10.gain);
  if(N((C.b10||{}).r125a))LT.PassThrIncNatureLTCGUs112A12_5Per=n0(C.b10.r125a);
  if(N((C.b10||{}).r125o))LT.PassThrIncNatureLTCG12_5Per=n0(C.b10.r125o);
  LT.TotalAmtNotTaxUsDTAALtcg=n0(B.b11.notTax);LT.TotalAmtTaxUsDTAALtcg=n0(B.b11.special);
  if(N((C.bA||{}).amt))LT.CapitalLossBuyBackShares={TotalCapitalLossBuyBackShares:-n0(B.bA.loss)};
  LT.TotalLTCG=sg(B.total);

  /* schema-required sub-objects present even when the filer has no such
     transaction (empty stubs; the utility emits them at zero) */
  const dfl=(o,k,v)=>{if(o[k]===undefined)o[k]=v;};
  const zDed48=()=>({Reduction48iii:0,AquisitCost:0,ImproveCost:0,ExpOnTrans:0,TotalDedn:0});
  dfl(ST,"SlumpSaleInStcg",{FMV11UAEii:0,FMV11UAEiii:0,FullConsideration:0,NetWorthOfDivision:0,CapgainonAssets:0});
  dfl(ST,"NRITransacSec48Dtl",{NRItaxSTTPaid:0,NRItaxSTTNotPaid:0});
  dfl(ST,"NRISecur115AD",{FullValueConsdRecvUnqshr:0,FairMrktValueUnqshr:0,FullValueConsdSec50CA:0,
    FullValueConsdOthUnqshr:0,FullConsideration:0,DeductSec48:zDed48(),BalanceCG:0,LossSec94of7Or94of8:0,CapgainonAssets:0});
  dfl(ST,"SaleOnOtherAssets",{FullValueConsdRecvUnqshr:0,FairMrktValueUnqshr:0,FullValueConsdSec50CA:0,
    FullValueConsdOthUnqshr:0,FullConsideration:0,DeductSec48:zDed48(),BalanceCG:0,LossSec94of7Or94of8:0,
    DeemedSTCGDeprAsset:0,ExemptionOrDednUs54:{ExemptionGrandTotal:0},CapgainonAssets:0});
  dfl(LT,"SlumpSaleInLtcgDtls",{SlumpSaleInLtcg:{FMV11UAEii:0,FMV11UAEiii:0,FullConsideration:0,
    NetWorthOfDivision:0,SlumpBalance:0,DeductionUnderSec54:0,CapgainonAssets:0}});
  dfl(LT,"SaleOfEquityShareUs112A",{CapgainonAssets:0});
  dfl(LT,"NRISaleOfEquityShareUs112A",{CapgainonAssets:0});
  dfl(LT,"SaleofAssetNADtls",{SaleofAssetNA:{FullValueConsdRecvUnqshr:0,FairMrktValueUnqshr:0,FullValueConsdSec50CA:0,
    FullValueConsdOthUnqshr:0,FullConsideration:0,DeductSec48:zDed48(),BalanceCG:0,
    ExemptionOrDednUs54:{ExemptionGrandTotal:0},CapgainonAssets:0}});

  /* ---- Part D · DeducClaimInfo (disclosure) ---- */
  const DED={};let dedTot=0;
  DCLAIM.forEach(Dd=>{const rows=((C.dclaim||{})[Dd.ns]||[])
      .filter(r=>N(r.amt)||N(r.cost)||N(r.invested)||ISO(r.transfer));
    if(!rows.length)return;
    DED[Dd.key]=rows.map(r=>{let o;
      if(Dd.invest){o={DateofTransfer:ISO(r.transfer),AmtInvested:n0(r.invested),AmtDeducted:n0(r.amt)};
        if(ISO(r.invdate))o.DateofInvestment=ISO(r.invdate);}
      else {o={};
        if(Dd.acq)o.DateofAcquisition=ISO(r.transfer); else o.DateofTransfer=ISO(r.transfer);
        o[Dd.cost]=n0(r.cost);
        if(ISO(r.purchase))o.DateofPurchase=ISO(r.purchase);
        o.AmtDeposited=n0(r.deposited);
        if(ISO(r.depdate))o.DepositDate=ISO(r.depdate);
        if(st0(r.acno))o.AccountNo=st0(r.acno);
        if(st0(r.ifsc))o.IFSC=st0(r.ifsc).toUpperCase();
        o.AmtDeducted=n0(r.amt);}
      dedTot+=N(r.amt);return o;});});
  DED.TotDeductClaim=n0(dedTot);

  /* ---- Part E · CurrYrLosses (set-off matrix) ---- */
  const SL=[["st20","InStcg20Per","StclSetoff20Per"],["st30","InStcg30Per","StclSetoff30Per"],
    ["stApp","InStcgAppRate","StclSetoffAppRate"],["stDTAA","InStcgDTAARate","StclSetoffDTAARate"],
    ["lt125","InLtcg12_5Per","LtclSetOff12_5Per"],["ltDTAA","InLtcgDTAARate","LtclSetOffDTAARate"]];
  const E={InLossSetOff:{}};
  SL.forEach(x=>{E.InLossSetOff[x[2]]=n0(G.loss[x[0]]);});          /* row i = loss available */
  SL.forEach(x=>{const node={CurrYearIncome:n0(G.gain[x[0]])};
    SL.forEach(l=>{if(l[0]===x[0])return;
      if(x[0].charAt(0)==="l"||l[0].charAt(0)!=="l")node[l[2]]=n0((G.matrix[x[0]]||{})[l[0]]||0);});
    node.CurrYrCapGain=n0(G.after[x[0]]);E[x[1]]=node;});
  E.TotLossSetOff={};E.LossRemainSetOff={};
  SL.forEach(x=>{E.TotLossSetOff[x[2]]=n0(G.used[x[0]]);
    E.LossRemainSetOff[x[2]]=n0(Math.max(0,G.loss[x[0]]-G.used[x[0]]));});

  /* ---- Part F · AccruOrRecOfCG (scaled to post-BFLA when available) ---- */
  const QK=["Upto15Of6","Upto15Of9","Up16Of9To15Of12","Up16Of12To15Of3","Up16Of3To31Of3"];
  const FN={st20:"ShortTermUnder20Per",st30:"ShortTermUnder30Per",stApp:"ShortTermUnderAppRate",
    stDTAA:"ShortTermUnderDTAARate",lt125:"LongTermUnder12_5Per",ltDTAA:"LongTermUnderDTAARate"};
  const _Lb=(S.C.loss||{}).afterB||{};
  const AF={};SL.forEach(x=>{const k=x[0];const src=(G.F[k]||[]);
    const pre=src.reduce((a,v)=>a+N(v),0);const tgt=N(_Lb[k]!=null?_Lb[k]:pre);const dr={};
    if(pre>0){const f=tgt/pre;let acc=0;QK.forEach((q,i)=>{if(i<4){dr[q]=n0(N(src[i])*f);acc+=dr[q];}});dr[QK[4]]=n0(tgt-acc);}
    else {QK.forEach(q=>dr[q]=0);if(tgt>0)dr[QK[4]]=n0(tgt);}
    AF[FN[k]]={DateRange:dr};});
  {const vq=[0,0,0,0,0];if(G.C2)(C.vda||[]).forEach(r=>{if(r._&&r._.inc&&r.head==="CG")vq[r._.q]+=r._.inc;});
    const dr={};QK.forEach((q,i)=>dr[q]=n0(vq[i]));AF.VDATrnsfGainsUnder30Per={DateRange:dr};}

  /* ---- assemble ScheduleCG and put onto j ---- */
  const CG={ShortTermCapGain:ST,LongTermCapGain:LT,
    SumOfCGIncm:sg(G.C1),IncmFromVDATrnsf:n0(G.C2),IncChargeableHeadCapGain:sg(G.C3),
    DeducClaimInfo:DED,CurrYrLosses:E,AccruOrRecOfCG:AF};
  CG.EditAutopoulatedDetail=(st0(C.editE)==="Yes")?"Y":"N";
  put(j,"ScheduleCG",CG);

  /* ---- Schedule 112A / 115AD / VDA ---- */
  const b112=scripBlock(C.s112a,"112A");if(b112)put(j,"Schedule112A",b112);
  if(G.nri||isFii()){const b115=scripBlock(C.s115ad,"115AD");if(b115)put(j,"Schedule115AD",b115);}
  const vr=(C.vda||[]).filter(r=>ISO(r.buy)&&ISO(r.sale)&&r.head);
  if(vr.length)put(j,"ScheduleVDA",{ScheduleVDADtls:vr.map(r=>({DateofAcquisition:ISO(r.buy),DateofTransfer:ISO(r.sale),
    HeadUndIncTaxed:r.head,AcquisitionCost:n0(r.cost),ConsidReceived:n0(r.cons),
    IncomeFromVDA:n0(Math.max(0,N(r.cons)-N(r.cost)))})),
    TotIncBusiness:n0(G.vda.bi),TotIncCapGain:n0(G.vda.cg)});
}

/* =====================================================================
   IMPORT — inverse of expCg
   ===================================================================== */
function impCg(I5){
  const read=[];
  const g=(o,p)=>{try{return p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);}catch(e){return undefined;}};
  const CGb=I5&&I5.ScheduleCG;
  if(CGb){
    S.cg=S.cg||{};S.cg.on=true;
    const ST=CGb.ShortTermCapGain||{},LT=CGb.LongTermCapGain||{};
    const bback=x=>{const bs=(g(x,"TrnsfImmblPrprty.TrnsfImmblPrprtyDtls")||[]);
      const out={buyers:bs.map(y=>({name:y.NameOfBuyer||"",pan:y.PANofBuyer||"",aadhaar:y.AaadhaarOfBuyer||"",
        share:nz(y.PercentageShare),amt:nz(y.Amount)}))};
      if(bs.length){out.paddr=bs[0].AddressOfProperty||"";out.pstate=bs[0].StateCode||"";
        out.ppin=bs[0].PinCode!=null?String(bs[0].PinCode):"";out.pcountry=bs[0].CountryCode||"";out.pzip=bs[0].ZipCode||"";}
      return out;};
    const land=[];
    (g(ST,"SaleofLandBuild.SaleofLandBuildDtls")||[]).forEach(x=>{const d={};
      (g(x,"ExemptionOrDednUs54.ExemptionOrDednUs54Dtls")||[]).forEach(e=>d["s"+e.ExemptionSecCode]=nz(e.ExemptionAmount));
      land.push(Object.assign({buy:dmy(x.DateofPurchase),sale:dmy(x.DateofSale),lt:"Short",
        cons:nz(x.FullConsideration),sdv:nz(x.PropertyValuation),red:nz(x.Reduction48iii),cost:nz(x.AquisitCost),
        imp:nz(x.ImproveCost),exp:nz(x.ExpOnTrans),ded:d,improve:[]},bback(x)));});
    (g(LT,"SaleofLandBuild.SaleofLandBuildDtls")||[]).forEach(x=>{const d={};
      (g(x,"ExemptionOrDednUs54.ExemptionOrDednUs54Dtls")||[]).forEach(e=>d["s"+e.ExemptionSecCode]=nz(e.ExemptionAmount));
      land.push(Object.assign({buy:dmy(x.DateofPurchase),sale:dmy(x.DateofSale),lt:"Long",
        cons:nz(x.FullConsideration),sdv:nz(x.PropertyValuation),red:nz(x.Reduction48iii),cost:nz(x.AquisitCost),
        imp:nz(x.ImproveCost),exp:nz(x.ExpOnTrans),ded:d,improve:[]},bback(x)));});
    if(land.length){S.cg.land=land;read.push("capital gains (land/building)");}
    if(ST.SlumpSaleInStcg&&(N(ST.SlumpSaleInStcg.FMV11UAEii)||N(ST.SlumpSaleInStcg.FMV11UAEiii)||N(ST.SlumpSaleInStcg.NetWorthOfDivision)))
      S.cg.a2={fmv2:nz(ST.SlumpSaleInStcg.FMV11UAEii),fmv3:nz(ST.SlumpSaleInStcg.FMV11UAEiii),networth:nz(ST.SlumpSaleInStcg.NetWorthOfDivision)};
    S.cg.a3=(ST.EquityMFonSTT||[]).map(e=>({mfsec:e.MFSectionCode,
      cons:nz(g(e,"EquityMFonSTTDtls.FullConsideration")),red:nz(g(e,"EquityMFonSTTDtls.DeductSec48.Reduction48iii")),
      cost:nz(g(e,"EquityMFonSTTDtls.DeductSec48.AquisitCost")),imp:nz(g(e,"EquityMFonSTTDtls.DeductSec48.ImproveCost")),
      exp:nz(g(e,"EquityMFonSTTDtls.DeductSec48.ExpOnTrans")),loss94:nz(g(e,"EquityMFonSTTDtls.LossSec94of7Or94of8"))}));
    const a6=ST.SaleOnOtherAssets;
    if(a6&&(N(a6.FullConsideration)||N(a6.FullValueConsdRecvUnqshr)||N(a6.FullValueConsdOthUnqshr)||N(g(a6,"DeductSec48.AquisitCost")))){
      const d={};(g(a6,"ExemptionOrDednUs54.ExemptionOrDednUs54Dtls")||[]).forEach(e=>d["s"+e.ExemptionSecCode]=nz(e.ExemptionAmount));
      S.cg.a6={unqCons:nz(a6.FullValueConsdRecvUnqshr),unqFmv:nz(a6.FairMrktValueUnqshr),othCons:nz(a6.FullValueConsdOthUnqshr),
        red:nz(g(a6,"DeductSec48.Reduction48iii")),cost:nz(g(a6,"DeductSec48.AquisitCost")),
        imp:nz(g(a6,"DeductSec48.ImproveCost")),exp:nz(g(a6,"DeductSec48.ExpOnTrans")),
        loss94:nz(a6.LossSec94of7Or94of8),dcg:nz(a6.DeemedSTCGDeprAsset),ded:d};}
    S.cg.a7=S.cg.a7||{deem:[],other:0,other45:0};
    S.cg.a7.deem=(g(ST,"UnutilizedCg.UnutilizedCgPrvYrDtls")||[]).map(x=>({py:x.PrvYrInWhichAsstTrnsfrd,sec:x.SectionClmd,
      yracq:x.YrInWhichAssetAcq||"",util:nz(x.AmtUtilized),unused:nz(x.AmtUnutilized)}));
    S.cg.a7.other=nz(ST.AmtDeemedStcg);S.cg.a7.other45=nz(ST.AmtDeemedStcg45iv);S.cg.a7.unutFlag=ST.UnutilizedStcgFlag||"";
    S.cg.a8={r20:nz(ST.PassThrIncNatureSTCG20Per),r30:nz(ST.PassThrIncNatureSTCG30Per),rApp:nz(ST.PassThrIncNatureSTCGAppRate)};
    S.cg.aA=(g(ST,"CapitalLossBuyBackShares.CapitalLossBuyBackSharesDtls")||[]).map(x=>({rate:x.Rate,amt:Math.abs(nz(x.Amount))}));
    /* NR STCG heads */
    if(ST.NRITransacSec48Dtl&&(N(ST.NRITransacSec48Dtl.NRItaxSTTPaid)||N(ST.NRITransacSec48Dtl.NRItaxSTTNotPaid)))
      S.cg.a4={sttPaid:nz(ST.NRITransacSec48Dtl.NRItaxSTTPaid),sttNot:nz(ST.NRITransacSec48Dtl.NRItaxSTTNotPaid)};
    const a5b=ST.NRISecur115AD;
    if(a5b&&(N(a5b.FullConsideration)||N(a5b.FullValueConsdRecvUnqshr)||N(g(a5b,"DeductSec48.AquisitCost"))))
      S.cg.a5={unqCons:nz(a5b.FullValueConsdRecvUnqshr),unqFmv:nz(a5b.FairMrktValueUnqshr),othCons:nz(a5b.FullValueConsdOthUnqshr),
        red:nz(g(a5b,"DeductSec48.Reduction48iii")),cost:nz(g(a5b,"DeductSec48.AquisitCost")),
        imp:nz(g(a5b,"DeductSec48.ImproveCost")),exp:nz(g(a5b,"DeductSec48.ExpOnTrans")),loss94:nz(a5b.LossSec94of7Or94of8)};
    S.cg.a9=(g(ST,"NRICgDTAA.NRIDTAADtls")||[]).map(dtaaIn);
    /* LTCG heads */
    const s=g(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg");
    if(s&&(N(s.FMV11UAEii)||N(s.FMV11UAEiii)||N(s.NetWorthOfDivision)))
      S.cg.b2={fmv2:nz(s.FMV11UAEii),fmv3:nz(s.FMV11UAEiii),networth:nz(s.NetWorthOfDivision),ded:{s54EC:nz(s.DeductionUnderSec54)}};
    const p3=LT.Proviso112Applicable;
    if(p3&&(N(g(p3,"Proviso112Applicabledtls.FullConsideration"))||N(g(p3,"Proviso112Applicabledtls.DeductSec48.AquisitCost"))))
      S.cg.b3={sec:p3.Proviso112SectionCode||"22",cons:nz(g(p3,"Proviso112Applicabledtls.FullConsideration")),
        red:nz(g(p3,"Proviso112Applicabledtls.DeductSec48.Reduction48iii")),cost:nz(g(p3,"Proviso112Applicabledtls.DeductSec48.AquisitCost")),
        imp:nz(g(p3,"Proviso112Applicabledtls.DeductSec48.ImproveCost")),exp:nz(g(p3,"Proviso112Applicabledtls.DeductSec48.ExpOnTrans"))};
    const b8=g(LT,"SaleofAssetNADtls.SaleofAssetNA");
    if(b8&&(N(b8.FullConsideration)||N(b8.FullValueConsdRecvUnqshr)||N(g(b8,"DeductSec48.AquisitCost")))){
      const d={};(g(b8,"ExemptionOrDednUs54.ExemptionOrDednUs54Dtls")||[]).forEach(e=>d["s"+e.ExemptionSecCode]=nz(e.ExemptionAmount));
      S.cg.b8={unqCons:nz(b8.FullValueConsdRecvUnqshr),unqFmv:nz(b8.FairMrktValueUnqshr),othCons:nz(b8.FullValueConsdOthUnqshr),
        red:nz(g(b8,"DeductSec48.Reduction48iii")),cost:nz(g(b8,"DeductSec48.AquisitCost")),
        imp:nz(g(b8,"DeductSec48.ImproveCost")),exp:nz(g(b8,"DeductSec48.ExpOnTrans")),ded:d};}
    S.cg.b9=S.cg.b9||{deem:[],other:0,other45:0};
    S.cg.b9.deem=(g(LT,"UnutilizedCg.UnutilizedCgPrvYrDtls")||[]).map(x=>({py:x.PrvYrInWhichAsstTrnsfrd,sec:x.SectionClmd,
      yracq:x.YrInWhichAssetAcq||"",util:nz(x.AmtUtilized),unused:nz(x.AmtUnutilized)}));
    S.cg.b9.other=nz(LT.AmtDeemedLtcg);S.cg.b9.other45=nz(LT.AmtDeemedLtcg45iv);S.cg.b9.unutFlag=LT.UnutilizedLtcgFlag||"";
    S.cg.b10={r125a:nz(LT.PassThrIncNatureLTCGUs112A12_5Per),r125o:nz(LT.PassThrIncNatureLTCG12_5Per)};
    const b5b=LT.NRIProvisoSec48;if(b5b&&N(b5b.BalanceCG))S.cg.b5={gain:nz(b5b.BalanceCG)};
    S.cg.b6=(g(LT,"NRIOnSec112and115.NRIOnSec112and115Dtls")||[]).map(o=>({sec:o.SectionCode,
      unqCons:nz(o.FullValueConsdRecvUnqshr),unqFmv:nz(o.FairMrktValueUnqshr),othCons:nz(o.FullValueConsdOthUnqshr),
      red:nz(g(o,"DeductSec48.Reduction48iii")),cost:nz(g(o,"DeductSec48.AquisitCost")),
      imp:nz(g(o,"DeductSec48.ImproveCost")),exp:nz(g(o,"DeductSec48.ExpOnTrans"))}));
    S.cg.b11=(g(LT,"NRICgDTAA.NRIDTAADtls")||[]).map(dtaaIn);
    const blA=g(LT,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares");
    if(N(blA))S.cg.bA={amt:Math.abs(nz(blA))};
    /* Part D detail */
    const DI=CGb.DeducClaimInfo;
    if(DI){S.cg.dclaim={us54D:[],us54EC:[],us54G:[],us54GA:[]};
      DCLAIM.forEach(Dd=>{S.cg.dclaim[Dd.ns]=(DI[Dd.key]||[]).map(r=>{
        if(Dd.invest)return {transfer:dmy(r.DateofTransfer),invested:nz(r.AmtInvested),invdate:dmy(r.DateofInvestment),amt:nz(r.AmtDeducted)};
        return {transfer:dmy(Dd.acq?r.DateofAcquisition:r.DateofTransfer),cost:nz(r[Dd.cost]),
          purchase:dmy(r.DateofPurchase),deposited:nz(r.AmtDeposited),depdate:dmy(r.DepositDate),
          acno:r.AccountNo||"",ifsc:r.IFSC||"",amt:nz(r.AmtDeducted)};});});
      if(Object.keys(S.cg.dclaim).some(k=>S.cg.dclaim[k].length))read.push("CG deduction detail");}
    if(CGb.EditAutopoulatedDetail)S.cg.editE=(CGb.EditAutopoulatedDetail==="Y")?"Yes":"No";
    read.push("capital gains");
  }
  const b112=I5&&I5.Schedule112A;
  if(b112){S.cg=S.cg||{};S.cg.on=true;
    S.cg.s112a=(b112.Schedule112ADtls||[]).map(x=>({pre18:x.ShareOnOrBefore,isin:x.ISINCode,name:x.ShareUnitName,
      qty:nz(x.NumSharesUnits),price:nz(x.SalePricePerShareUnit),sale6:x.ShareOnOrBefore==="AE"?nz(x.TotSaleValue):"",
      cost:nz(x.AcquisitionCost),fmv18:nz(x.FairMktValuePerShareunit),exp:nz(x.ExpExclCnctTransfer)}));
    read.push("Schedule 112A");}
  const b115=I5&&I5.Schedule115AD;
  if(b115){S.cg=S.cg||{};S.cg.on=true;
    S.cg.s115ad=(b115.Schedule115ADDtls||[]).map(x=>({pre18:x.ShareOnOrBefore,isin:x.ISINCode,name:x.ShareUnitName,
      qty:nz(x.NumSharesUnits),price:nz(x.SalePricePerShareUnit),sale6:x.ShareOnOrBefore==="AE"?nz(x.TotSaleValue):"",
      cost:nz(x.AcquisitionCost),fmv18:nz(x.FairMktValuePerShareunit),exp:nz(x.ExpExclCnctTransfer)}));
    read.push("Schedule 115AD");}
  const vda=I5&&I5.ScheduleVDA;
  if(vda){S.cg=S.cg||{};S.cg.on=true;
    S.cg.vda=(vda.ScheduleVDADtls||[]).map(x=>({buy:dmy(x.DateofAcquisition),sale:dmy(x.DateofTransfer),
      head:x.HeadUndIncTaxed,cost:nz(x.AcquisitionCost),cons:nz(x.ConsidReceived)}));
    read.push("Schedule VDA");}
  return read;
}
function dtaaIn(r){return {amt:nz(r.DTAAamt),itemno:r.ItemNoincl||"",country:r.CountryName||"",
  ccode:r.CountryCodeExcludingIndia||"",article:r.DTAAarticle||"",
  treaty:r.RateAsPerTreaty!=null?r.RateAsPerTreaty:"",trc:r.TaxRescertifiedFlag||"",
  secit:r.SecITAct||"",itact:r.RateAsPerITAct!=null?r.RateAsPerITAct:""};}

/* =====================================================================
   CHECKS
   ===================================================================== */
function chkCg(){
  const out=[];const G=S.C.cg;if(!G||!G.on)return out;
  const C=S.cg;
  /* 50C — stamp value more than 10% above consideration (Q10/Q140) */
  (C.land||[]).forEach((p,i)=>{const r=p._;if(r&&!r.safe)
    out.push({lvl:"warn",t:"Property "+(i+1)+" · section 50C",
      m:"Stamp value exceeds consideration by more than 10% — the stamp value is adopted as full value.",sec:"cg"});});
  /* mutual exclusion 112A vs 115AD */
  const has112=(C.s112a||[]).some(r=>N((r._||{}).sale)||N(r.cost));
  const has115=(C.s115ad||[]).some(r=>N((r._||{}).sale)||N(r.cost));
  if(has112&&has115)out.push({lvl:"err",t:"Schedule 112A vs 115AD",
    m:"A row filled in Schedule 112A bars Schedule 115AD(1)(iii) proviso, and vice versa.",sec:"cg"});
  /* 115AD is FII/FPI (non-resident) only */
  if(has115&&!(G.nri||isFii()))out.push({lvl:"err",t:"Schedule 115AD",
    m:"Schedule 115AD(1)(iii) proviso applies only to a non-resident FII/FPI (Part A-General FII/FPI = Yes).",sec:"cg"});
  /* land dates & 31-Mar bound (A410/A411/A448) */
  (C.land||[]).forEach((p,i)=>{const dS=D(p.sale),dB=D(p.buy);const r=p._;
    if(r&&r.value>0&&(!dB||!dS))out.push({lvl:"warn",t:"Property "+(i+1)+" · dates",
      m:"Date of purchase and date of sale are mandatory when B1/A1 figures are positive.",sec:"cg"});
    if(dS&&dS>YREND)out.push({lvl:"err",t:"Property "+(i+1)+" · sale date",
      m:"Date of sale of land/building cannot be after 31 March of the financial year.",sec:"cg"});});
  /* VDA date bounds (A470) */
  (C.vda||[]).forEach((r,i)=>{const dS=D(r.sale),dA=D(r.buy);
    if((dS&&dS>YREND)||(dA&&dA>YREND))out.push({lvl:"err",t:"Schedule VDA row "+(i+1),
      m:"Date of acquisition/transfer cannot be after 31 March of the financial year.",sec:"cg"});
    if(dS&&dA&&dS<dA)out.push({lvl:"err",t:"Schedule VDA row "+(i+1),
      m:"Date of transfer cannot be before date of acquisition.",sec:"cg"});});
  /* section-48 expenses where consideration is zero (A340–A347) */
  (C.land||[]).forEach((p,i)=>{if(!N(p.cons)&&(N(p.cost)||N(p.exp)||N(p.red)||N(p.imp)))
    out.push({lvl:"warn",t:"Property "+(i+1)+" · section 48",
      m:"Where full value of consideration is zero, deductions u/s 48 cannot be claimed.",sec:"cg"});});
  /* EquityMFonSTT capped at two sub-heads */
  if((C.a3||[]).length>2)out.push({lvl:"err",t:"A3 · Equity/EOMF",
    m:"At most two A3 sub-heads (111A and 115AD) may be reported.",sec:"cg"});
  /* Part D disclosure vs claim reconciliation (A397) */
  let dclaimTot=0;DCLAIM.forEach(Dd=>((C.dclaim||{})[Dd.ns]||[]).forEach(r=>dclaimTot+=N(r.amt)));
  if(G.dedTotal&&dclaimTot&&Math.abs(dclaimTot-G.dedTotal)>1)
    out.push({lvl:"warn",t:"Part D · deduction detail",
      m:"Total deduction detail (₹"+R(dclaimTot).toLocaleString("en-IN")+") should equal deductions claimed in A/B ("+RS(G.dedTotal)+").",sec:"cg"});
  /* reconciled */
  if(G.C3!==0||G.A.total||G.B.total)
    out.push({lvl:"ok",t:"Capital gains",m:"C3 income chargeable under CAPITAL GAINS = "+RS(G.C3)+".",sec:"cg"});
  return out;
}

reg({id:"cg", t:"Capital gains", ref:"CG · 112A · 115AD · VDA",
  f:secCg, s:()=>!cgOn()?"None":((S.C.cg&&S.C.cg.C3)?RS(S.C.cg.C3):"Reporting"),
  eng:engCg, exp:expCg, imp:impCg, chk:chkCg, order:26, corder:26});

})();
