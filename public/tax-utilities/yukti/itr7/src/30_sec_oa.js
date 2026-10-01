/* =====================================================================
   ITR-7 · Section "oa" — Business, general (Schedule OA)
   Book: books/ITR-7/Schedule_OA.md  ·  Schema block OWNED: ScheduleOA
   In ITR-7 the "General" schedule (OA) is the business-general disclosure
   that sits in front of the business-income computation (Schedule BP /
   CorpScheduleBP). It declares (1) whether the trust/institution has any
   income under the head "business and profession" (the gate flag), (2) the
   nature-of-business code(s) and trade name(s), (3) the number of branches
   and the method of accounting, and (4) the method of valuation of closing
   stock. Nothing here adds to total income; the gate flag decides whether
   Schedule BP is in play at all.
   Compute order: 41 (a disclosure face; publishes the BP gate seam).

   BOOK / SCHEMA gaps resolved (reported to the CEO):
   - Display values differ from schema values: the utility shows Yes/No,
     Mercantile/Cash, and "1./2./3. ..." labels, but the schema stores
     Y|N, MERC|CASH and "1"|"2"|"3". The dropdowns below carry the schema
     value as the option value and the utility text as the label.
   - Nature-of-business list: the book's Code-Sub Sector dropdown carries
     356 codes (357 incl. "(Select)"); the V0.1 schema's Code enum accepts
     350. Two book codes are the same sub-sector with cosmetic zero-padding
     ("20023_01"->"20023_1" Sports Management; "21008_01"->"21008_1" Event
     Management) and are NORMALISED to the schema value here. Six book codes
     have no schema-enum member at all (09029 Kachcha Arahtia; 16019 Other
     professional services; 16021 Social Media Influencers; 21009/21010/
     21011 speculative / F&O / share trading) — kept verbatim from the book
     (utility list is newer than the V0.1 schema) and FLAGGED. Every other
     code round-trips schema-valid.
   ===================================================================== */

/* ---- dropdown value lists (option value = schema value, label = utility text) ---- */
const OA_YN=[["Y","Yes"],["N","No"]];                                   /* IncUnHeadBPFlag / ChangeInAcctMethFlg / ChngStockValMetFlg (pattern Y|N) */
const OA_ACCT=[["MERC","Mercantile"],["CASH","Cash"]];                  /* MethodOfAcct (enum MERC|CASH) */
const OA_STKVAL=[["1","1. Cost or market rate, whichever is less"],["2","2. At cost"],["3","3. At market rate"]]; /* ValRawMaterial / ValFinishedGoods (enum 1|2|3) */
/* Code-Sub Sector — the utility's NatureOfBusiness list, verbatim from the book
   (356 codes), option value normalised to the schema Code enum where they differ. */
const OA_NOB=[["01001","01001-Growing and manufacturing of tea"],["01002","01002-Growing and manufacturing of coffee"],["01003","01003-Growing and manufacturing of rubber"],["01004","01004-Market gardening and horticulture specialties"],["01005","01005-Raising of silk worms and production of silk"],["01006","01006-Raising of bees and production of honey"],["01007","01007-Raising of poultry and production of eggs"],["01008","01008-Rearing of sheep and production of wool"],["01009","01009-Rearing of animals and production of animal products"],["01010","01010-Agricultural and animal husbandry services"],["01011","01011-Soil conservation, soil testing and soil desalination services"],["01012","01012-Hunting, trapping and game propagation services"],["01013","01013-Growing of timber, plantation, operation of tree nurseries and conserving of forest"],["01014","01014-Gathering of tendu leaves"],["01015","01015-Gathering of other wild growing materials"],["01016","01016-Forestry service activities, timber cruising, afforestation and reforestation"],["01017","01017-Logging service activities, transport of logs within the forest"],["01018","01018-Other agriculture, animal husbandry or forestry activity n.e.c"],["02001","02001-Fishing on commercial basis in inland waters"],["02002","02002-Fishing on commercial basis in ocean and coastal areas"],["02003","02003-Fish farming"],["02004","02004-Gathering of marine materials such as natural pearls, sponges, coral etc."],["02005","02005-Services related to marine and fresh water fisheries, fish hatcheries and fish farms"],["02006","02006-Other Fish farming activity n.e.c"],["03001","03001-Mining and agglomeration of hard coal"],["03002","03002-Mining and agglomeration of lignite"],["03003","03003-Extraction and agglomeration of peat"],["03004","03004-Extraction of crude petroleum and natural gas"],["03005","03005-Service activities incidental to oil and gas extraction excluding surveying"],["03006","03006-Mining of uranium and thorium ores"],["03007","03007-Mining of iron ores"],["03008","03008-Mining of non-ferrous metal ores, except uranium and thorium ores"],["03009","03009-Mining of gemstones"],["03010","03010-Mining of chemical and fertilizer minerals"],["03011","03011-Mining of quarrying of abrasive materials"],["03012","03012-Mining of mica, graphite and asbestos"],["03013","03013-Quarrying of stones (marble/granite/dolomite), sand and clay"],["03014","03014-Other mining and quarrying"],["03015","03015-Mining and production of salt"],["03016","03016-Other mining and quarrying n.e.c"],["04001","04001-Production, processing and preservation of meat and meat products"],["04002","04002-Production, processing and preservation of fish and fish products"],["04003","04003-Manufacture of vegetable oil, animal oil and fats"],["04004","04004-Processing of fruits, vegetables and edible nuts"],["04005","04005-Manufacture of dairy products"],["04006","04006-Manufacture of sugar"],["04007","04007-Manufacture of cocoa, chocolates and sugar confectionery"],["04008","04008-Flour milling"],["04009","04009-Rice milling"],["04010","04010-Dal milling"],["04011","04011-Manufacture of other grain mill products"],["04012","04012-Manufacture of bakery products"],["04013","04013-Manufacture of starch products"],["04014","04014-Manufacture of animal feeds"],["04015","04015-Manufacture of other food products"],["04016","04016-Manufacturing of wines"],["04017","04017-Manufacture of beer"],["04018","04018-Manufacture of malt liquors"],["04019","04019-Distilling and blending of spirits, production of ethyl alcohol"],["04020","04020-Manufacture of mineral water"],["04021","04021-Manufacture of soft drinks"],["04022","04022-Manufacture of other non-alcoholic beverages"],["04023","04023-Manufacture of tobacco products"],["04024","04024-Manufacture of textiles (other than by handloom)"],["04025","04025-Manufacture of textiles using handlooms (khadi)"],["04026","04026-Manufacture of carpet, rugs, blankets, shawls etc. (other than by hand)"],["04027","04027-Manufacture of carpet, rugs, blankets, shawls etc. by hand"],["04028","04028-Manufacture of wearing apparel"],["04029","04029-Tanning and dressing of leather"],["04030","04030-Manufacture of luggage, handbags and the like saddler and harness"],["04031","04031-Manufacture of footwear"],["04032","04032-Manufacture of wood and wood products, cork, straw and plaiting material"],["04033","04033-Manufacture of paper and paper products"],["04034","04034-Publishing, printing and reproduction of recorded media"],["04035","04035-Manufacture of coke oven products"],["04036","04036-Manufacture of refined petroleum products"],["04037","04037-Processing of nuclear fuel"],["04038","04038-Manufacture of fertilizers and nitrogen compounds"],["04039","04039-Manufacture of plastics in primary forms and of synthetic rubber"],["04040","04040-Manufacture of paints, varnishes and similar coatings"],["04041","04041-Manufacture of pharmaceuticals, medicinal chemicals and botanical products"],["04042","04042-Manufacture of soap and detergents"],["04043","04043-Manufacture of other chemical products"],["04044","04044-Manufacture of man-made fibers"],["04045","04045-Manufacture of rubber products"],["04046","04046-Manufacture of plastic products"],["04047","04047-Manufacture of glass and glass products"],["04048","04048-Manufacture of cement, lime and plaster"],["04049","04049-Manufacture of articles of concrete, cement and plaster"],["04050","04050-Manufacture of Bricks"],["04051","04051-Manufacture of other clay and ceramic products"],["04052","04052-Manufacture of other non-metallic mineral products"],["04053","04053-Manufacture of pig iron, sponge iron, Direct Reduced Iron etc."],["04054","04054-Manufacture of Ferro alloys"],["04055","04055-Manufacture of Ingots, billets, blooms and slabs etc."],["04056","04056-Manufacture of steel products"],["04057","04057-Manufacture of basic precious and non-ferrous metals"],["04058","04058-Manufacture of non-metallic mineral products"],["04059","04059-Casting of metals"],["04060","04060-Manufacture of fabricated metal products"],["04061","04061-Manufacture of engines and turbines"],["04062","04062-Manufacture of pumps and compressors"],["04063","04063-Manufacture of bearings and gears"],["04064","04064-Manufacture of ovens and furnaces"],["04065","04065-Manufacture of lifting and handling equipment"],["04066","04066-Manufacture of other general purpose machinery"],["04067","04067-Manufacture of agricultural and forestry machinery"],["04068","04068-Manufacture of Machine Tools"],["04069","04069-Manufacture of machinery for metallurgy"],["04070","04070-Manufacture of machinery for mining, quarrying and constructions"],["04071","04071-Manufacture of machinery for processing of food and  beverages"],["04072","04072-Manufacture of machinery for leather and textile"],["04073","04073-Manufacture of weapons and ammunition"],["04074","04074-Manufacture of other special purpose machinery"],["04075","04075-Manufacture of domestic appliances"],["04076","04076-Manufacture of office, accounting and computing machinery"],["04077","04077-Manufacture of electrical machinery and apparatus"],["04078","04078-Manufacture of Radio, Television, communication equipment and apparatus"],["04079","04079-Manufacture of medical and surgical equipment"],["04080","04080-Manufacture of industrial process control equipment"],["04081","04081-Manufacture of instruments and appliances for measurements and navigation"],["04082","04082-Manufacture of optical instruments"],["04083","04083-Manufacture of watches and clocks"],["04084","04084-Manufacture of motor vehicles"],["04085","04085-Manufacture of body of motor vehicles"],["04086","04086-Manufacture of parts & accessories of motor vehicles &  engines"],["04087","04087-Building & repair of ships and boats"],["04088","04088-Manufacture of railway locomotive and rolling stocks"],["04089","04089-Manufacture of aircraft and spacecraft"],["04090","04090-Manufacture of bicycles"],["04091","04091-Manufacture of other transport equipment"],["04092","04092-Manufacture of furniture"],["04093","04093-Manufacture of jewellery"],["04094","04094-Manufacture of sports goods"],["04095","04095-Manufacture of musical instruments"],["04096","04096-Manufacture of games and toys"],["04097","04097-Other manufacturing n.e.c."],["04098","04098-Recycling of metal waste and scrap"],["04099","04099-Recycling of non- metal waste and scrap"],["05001","05001-Production, collection and distribution of electricity"],["05002","05002-Manufacture and distribution of gas"],["05003","05003-Collection, purification and distribution of water"],["05004","05004-Other essential commodity service  n.e.c"],["06001","06001-Site preparation works"],["06002","06002-Building of complete constructions or parts- civil contractors"],["06003","06003-Building installation"],["06004","06004-Building completion"],["06005","06005-Construction and maintenance of roads, rails, bridges, tunnels, ports, harbour, runways etc."],["06006","06006-Construction and maintenance of power plants"],["06007","06007-Construction  and maintenance of industrial plants"],["06008","06008-Construction  and maintenance of power transmission and telecommunication lines"],["06009","06009-Construction of water ways and water reservoirs"],["06010","06010-Other construction activity n.e.c."],["07001","07001-Purchase, sale and letting of leased buildings  (residential and non-residential)"],["07002","07002-Operating of real estate of self-owned buildings (residential and non-residential)"],["07003","07003-Developing and sub-dividing real estate into lots"],["07004","07004-Real estate activities on a fee or contract basis"],["07005","07005-Other real estate/renting services n.e.c"],["08001","08001-Renting of land transport equipment"],["08002","08002-Renting of water transport equipment"],["08003","08003-Renting of air transport equipment"],["08004","08004-Renting of agricultural machinery and equipment"],["08005","08005-Renting of construction and civil engineering machinery"],["08006","08006-Renting of office machinery and equipment"],["08007","08007-Renting of other machinery and equipment n.e.c."],["08008","08008-Renting of personal and household goods n.e.c."],["08009","08009-Renting of other machinery n.e.c."],["09001","09001-Wholesale and retail sale of motor vehicles"],["09002","09002-Repair and maintenance of motor vehicles"],["09003","09003-Sale of motor parts and accessories- wholesale and retail"],["09004","09004-Retail sale of automotive fuel"],["09005","09005-General commission agents, commodity brokers and auctioneers"],["09006","09006-Wholesale of agricultural raw material"],["09007","09007-Wholesale of food & beverages and tobacco"],["09008","09008-Wholesale of household goods"],["09009","09009-Wholesale of metals and metal ores"],["09010","09010-Wholesale of household goods"],["09011","09011-Wholesale of construction material"],["09012","09012-Wholesale of hardware and sanitary fittings"],["09013","09013-Wholesale of cotton and jute"],["09014","09014-Wholesale of raw wool and raw silk"],["09015","09015-Wholesale of other textile fibres"],["09016","09016-Wholesale of industrial chemicals"],["09017","09017-Wholesale of fertilizers and pesticides"],["09018","09018-Wholesale of electronic parts & equipment"],["09019","09019-Wholesale of other machinery, equipment and supplies"],["09020","09020-Wholesale of waste, scrap & materials for re-cycling"],["09021","09021-Retail sale of food, beverages and tobacco in specialized stores"],["09022","09022-Retail sale of other goods in specialized stores"],["09023","09023-Retail sale in non-specialized stores"],["09024","09024-Retail sale of textiles, apparel, footwear, leather goods"],["09025","09025-Retail sale of other household appliances"],["09026","09026-Retail sale of hardware, paint and glass"],["09027","09027-Wholesale of other products n.e.c"],["09028","09028-Retail sale of other products n.e.c"],["09029","09029-Commission agents-Kachcha Arahtia"],["10001","10001-Hotels – Star rated"],["10002","10002-Hotels – Non-star rated"],["10003","10003-Motels, Inns and Dharmshalas"],["10004","10004-Guest houses and circuit houses"],["10005","10005-Dormitories and hostels at educational institutions"],["10006","10006-Short stay accommodations n.e.c."],["10007","10007-Restaurants – with bars"],["10008","10008-Restaurants – without bars"],["10009","10009-Canteens"],["10010","10010-Independent caterers"],["10011","10011-Casinos and other games of chance"],["10012","10012-Other hospitality services n.e.c."],["11001","11001-Travel agencies and tour operators"],["11002","11002-Packers and movers"],["11003","11003-Passenger land transport"],["11004","11004-Air transport"],["11005","11005-Transport by urban/sub-urban railways"],["11006","11006-Inland water transport"],["11007","11007-Sea and coastal water transport"],["11008","11008-Freight transport by road"],["11009","11009-Freight transport by railways"],["11010","11010-Forwarding of freight"],["11011","11011-Receiving and acceptance of freight"],["11012","11012-Cargo handling"],["11013","11013-Storage and warehousing"],["11014","11014-Transport via pipelines (transport of gases, liquids, slurry and other commodities)"],["11015","11015-Other Transport & Logistics services n.e.c"],["12001","12001-Post and courier activities"],["12002","12002-Basic telecom services"],["12003","12003-Value added telecom services"],["12004","12004-Maintenance of telecom network"],["12005","12005-Activities of the cable operators"],["12006","12006-Other Post & Telecommunication services n.e.c"],["13001","13001-Commercial banks, saving banks and discount houses"],["13002","13002-Specialised institutions granting credit"],["13003","13003-Financial leasing"],["13004","13004-Hire-purchase financing"],["13005","13005-Housing finance activities"],["13006","13006-Commercial loan activities"],["13007","13007-Credit cards"],["13008","13008-Mutual funds"],["13009","13009-Chit fund"],["13010","13010-Investment activities"],["13011","13011-Life insurance"],["13012","13012-Pension funding"],["13013","13013-Non-life insurance"],["13014","13014-Administration of financial markets"],["13015","13015-Stock brokers, sub-brokers and related activities"],["13016","13016-Financial advisers, mortgage advisers and brokers"],["13017","13017-Foreign exchange services"],["13018","13018-Other financial intermediation services n.e.c."],["14001","14001-Software development"],["14002","14002-Other software consultancy"],["14003","14003-Data processing"],["14004","14004-Database activities and distribution of electronic content"],["14005","14005-Other IT enabled services"],["14006","14006-BPO services"],["14007","14007-Cyber café"],["14008","14008-Maintenance and repair of office, accounting and computing machinery"],["14009","14009-Computer training and educational institutes"],["14010","14010-Other computation related services n.e.c."],["15001","15001-Natural sciences and engineering"],["15002","15002-Social sciences and humanities"],["15003","15003-Other Research & Development activities n.e.c."],["16001","16001-Legal profession"],["16002","16002-Accounting, book-keeping and auditing profession"],["16003","16003-Tax consultancy"],["16004","16004-Architectural profession"],["16005","16005-Engineering and technical consultancy"],["16006","16006-Advertising"],["16007","16007-Fashion designing"],["16008","16008-Interior decoration"],["16009","16009-Photography"],["16010","16010-Auctioneers"],["16011","16011-Business brokerage"],["16012","16012-Market research and public opinion polling"],["16013","16013-Business and management consultancy activities"],["16014","16014-Labour recruitment and provision of personnel"],["16015","16015-Investigation and security services"],["16016","16016-Building-cleaning and industrial cleaning activities"],["16017","16017-Packaging activities"],["16018","16018-Secretarial activities"],["16019_1","16019_1-Medical Profession"],["16020","16020-Film Artist"],["16021","16021-Social Media Influencers"],["16019","16019-Other professional services n.e.c."],["17001","17001-Primary education"],["17002","17002-Secondary/ senior secondary education"],["17003","17003-Technical and vocational secondary/ senior secondary education"],["17004","17004-Higher education"],["17005","17005-Education by correspondence"],["17006","17006-Coaching centres and tuitions"],["17007","17007-Other education services n.e.c."],["18001","18001-General  hospitals"],["18002","18002-Speciality and super speciality hospitals"],["18003","18003-Nursing homes"],["18004","18004-Diagnostic centres"],["18005","18005-Pathological laboratories"],["18006","18006-Independent blood banks"],["18007","18007-Medical transcription"],["18008","18008-Independent ambulance services"],["18009","18009-Medical suppliers, agencies and stores"],["18010","18010-Medical clinics"],["18011","18011-Dental practice"],["18012","18012-Ayurveda practice"],["18013","18013-Unani practice"],["18014","18014-Homeopathy practice"],["18015","18015-Nurses, physiotherapists or other para-medical practitioners"],["18016","18016-Veterinary hospitals and practice"],["18017","18017-Medical education"],["18018","18018-Medical research"],["18019","18019-Practice of other alternative medicine"],["18020","18020-Other healthcare services"],["19001","19001-Social work activities with accommodation (orphanages and old age homes)"],["19002","19002-Social work activities without accommodation (Creches)"],["19003","19003-Industry associations, chambers of commerce"],["19004","19004-Professional organisations"],["19005","19005-Trade unions"],["19006","19006-Religious organizations"],["19007","19007-Political organisations"],["19008","19008-Other membership organisations n.e.c. (rotary clubs, book clubs and philatelic clubs)"],["19009","19009-Other Social or community service n.e.c"],["20001","20001-Motion picture production"],["20002","20002-Film distribution"],["20003","20003-Film laboratories"],["20004","20004-Television channel productions"],["20005","20005-Television channels broadcast"],["20006","20006-Video production and distribution"],["20007","20007-Sound recording studios"],["20008","20008-Radio - recording and distribution"],["20009","20009-Stage production and related activities"],["20010","20010-Individual artists excluding authors"],["20011","20011-Literary activities"],["20012","20012-Other cultural activities n.e.c."],["20013","20013-Circuses and race tracks"],["20014","20014-Video Parlours"],["20015","20015-News agency activities"],["20016","20016-Library and archives activities"],["20017","20017-Museum activities"],["20018","20018-Preservation of historical sites and buildings"],["20019","20019-Botanical and zoological gardens"],["20020","20020-Operation and maintenance of sports facilities"],["20021","20021-Activities of sports and game schools"],["20022","20022-Organisation and operation of indoor/outdoor sports and promotion and production of sporting events"],["20023_1","20023_01-Sports Management"],["20023","20023-Other sporting activities n.e.c."],["20024","20024-Other recreational activities n.e.c."],["21001","21001-Hair dressing and other beauty treatment"],["21002","21002-Funeral and related activities"],["21003","21003-Marriage bureaus"],["21004","21004-Pet care services"],["21005","21005-Sauna and steam baths, massage salons etc."],["21006","21006-Astrological and spiritualists’ activities"],["21007","21007-Private households as employers of domestic staff"],["21008_1","21008_01-Event Management"],["21008","21008-Other services n.e.c."],["21009","21009-Speculative trading"],["21010","21010-Futures and Options trading"],["21011","21011-Buying and selling shares"],["22001","22001-Extra territorial organisations and bodies (IMF, World Bank, European Commission etc.)"]];

/* ---- state (disclosure face; guarded so it never throws on empty) ---- */
S.oa = S.oa || {};
S.oa.nob = S.oa.nob || [];                 /* NatOfBus[].NatureOfBusiness[] rows (max 3) */
if(S.oa.bpFlag===undefined)  S.oa.bpFlag="N";   /* IncUnHeadBPFlag — required (Y|N) */
if(S.oa.acctMeth===undefined)S.oa.acctMeth="MERC"; /* MethodOfAcct default */
if(S.oa.acctChg===undefined) S.oa.acctChg="N";  /* ChangeInAcctMethFlg */
if(S.oa.vRaw===undefined)    S.oa.vRaw="1";     /* ValRawMaterial — required */
if(S.oa.vFin===undefined)    S.oa.vFin="1";     /* ValFinishedGoods — required */
if(S.oa.stkChg===undefined)  S.oa.stkChg="N";   /* ChngStockValMetFlg — required */

/* =====================================================================
   ENGINE — engOa(): disclosure only; contributes nothing to GTI. Publishes
   the cross-section scalars that gate the business-income computation:
   S.C.oa.bpFlag (whether Schedule BP applies) is the seam the bp builder
   reads; the accounting-deviation and stock-valuation figures feed the
   ICDS / 145A adjustments used in the BP reconciliation.
   ===================================================================== */
function engOa(){
  const O=(S&&S.oa)||{};
  const C=S.C.oa={ income:0 };
  C.bpFlag = O.bpFlag==="Y";                                  /* -> bp: build Schedule BP? */
  C.nobCodes = ((O.nob)||[]).map(r=>r&&r.code).filter(Boolean); /* -> bp/ded descriptive gating */
  C.methodOfAcct = st0(O.acctMeth);                          /* MERC|CASH */
  C.acctChanged = O.acctChg==="Y";                           /* change in method of accounting */
  C.acctDeviationEffect = R(O.acctDev);                      /* ProfDeviatDueAcctMeth (145) */
  C.stkValChanged = O.stkChg==="Y";                          /* change in stock valuation method */
  C.stkDeviationEffect = R(O.stkEff);                        /* EffectOnPL (145A) */
  C.income = 0;
}

/* =====================================================================
   RENDERER — secOa(): every live row of Schedule OA. The gate flag first;
   the nature-of-business table, accounting particulars and stock-valuation
   rows are shown only when the gate flag is Yes.
   ===================================================================== */
function secOa(){
  const O=S.oa; let h="";
  h+=note("<b>Schedule OA — General (business & profession).</b> A descriptive schedule in front of the business-income computation (Schedule BP). It adds nothing to total income; the first answer decides whether Schedule BP applies at all. A trust or institution with only property / other-sources income answers <b>No</b>.");

  /* ---- the gate flag (row 4) ---- */
  h+=row("Do you have any income under the head business and profession?",
    sel("oa.bpFlag",OA_YN,{blank:false}),{req:1,ref:"IncUnHeadBPFlag",hint:"No ⇒ Schedule BP is not filled"});

  if(O.bpFlag!=="Y"){
    h+=note("Business income not declared — the nature-of-business, accounting and stock-valuation particulars below, and the whole Schedule BP, are not filled.");
    return h;
  }

  /* ---- nature of business or profession (rows 5-8) ---- */
  h+=sub("Nature of Business or Profession");
  h+=note("Give the Code-Sub Sector and trade name for each line of business (up to three). Where there is more than one business, indicate the three main activities / products.");
  h+=grid("oa.nob",[
    {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
    {h:"Code — Sub sector",k:"code",t:"sel",opts:OA_NOB,req:1},
    {h:"Trade name",k:"trade",t:"txt",max:125}
  ],S.oa.nob,{min:"760px",add:"Add a business code",empty:"No business code entered."});

  /* ---- accounting particulars (rows 12-15) ---- */
  h+=sub("Accounting particulars");
  h+=row("Number of branches",inp("oa.branches",{n:1}),{ref:"NumberOfBranches"});
  h+=row("Method of accounting employed in the previous year",
    sel("oa.acctMeth",OA_ACCT,{blank:false}),{ref:"MethodOfAcct",hint:"section 145 — Mercantile or Cash"});
  h+=row("Is there any change in method of accounting?",
    sel("oa.acctChg",OA_YN,{blank:false}),{ref:"ChangeInAcctMethFlg"});
  h+=row("Effect on the profit because of deviation, if any, in the method of accounting",
    inp("oa.acctDev",{n:1}),{ref:"ProfDeviatDueAcctMeth",hint:"may be negative"});

  /* ---- method of valuation of closing stock (rows 16-20) ---- */
  h+=sub("Method of valuation of closing stock employed in the previous year");
  h+=row("a · Raw material",sel("oa.vRaw",OA_STKVAL,{blank:false}),
    {req:1,ref:"MethodOfValClgStk.ValRawMaterial",hint:"6a"});
  h+=row("b · Finished goods",sel("oa.vFin",OA_STKVAL,{blank:false}),
    {req:1,ref:"MethodOfValClgStk.ValFinishedGoods",hint:"6b"});
  h+=row("c · Is there any change in stock valuation method?",
    sel("oa.stkChg",OA_YN,{blank:false}),{req:1,ref:"MethodOfValClgStk.ChngStockValMetFlg",hint:"6c"});
  h+=row("d · Effect on the profit or loss because of deviation, if any, from the method of valuation prescribed under section 145A",
    inp("oa.stkEff",{n:1}),{req:1,ref:"MethodOfValClgStk.EffectOnPL",hint:"6d — may be negative"});

  return h;
}

/* =====================================================================
   EXPORT — expOa(j): serialise block ScheduleOA from S.oa. The gate flag
   is always written; when the flag is No, only the flag is emitted (the
   rest of OA is not filled). When Yes, the nature-of-business array, the
   accounting particulars and the (required) MethodOfValClgStk object are
   written. put() skips undefined/null/"" (0 is written), so the required
   integer EffectOnPL is always present at its nil value.
   ===================================================================== */
function expOa(j){
  const O=S.oa||{};
  const flag = O.bpFlag==="Y" ? "Y" : "N";
  put(j,"ScheduleOA.IncUnHeadBPFlag",flag);
  if(flag!=="Y") return;                    /* No business — only the gate flag */

  /* nature of business: NatOfBus[] -> one element carrying the NatureOfBusiness[] rows */
  const rows=(O.nob||[]).map(r=>{const o={}; pf(o,"Code",sv(r.code)); pf(o,"TradeName1",sv(r.trade)); return o;})
    .filter(o=>o.Code!==undefined);
  if(rows.length) put(j,"ScheduleOA.NatOfBus",[{NatureOfBusiness:rows.slice(0,3)}]);

  /* accounting particulars */
  put(j,"ScheduleOA.NumberOfBranches",R(O.branches));           /* optional integer (0 default) */
  put(j,"ScheduleOA.MethodOfAcct",sv(O.acctMeth));
  put(j,"ScheduleOA.ChangeInAcctMethFlg",sv(O.acctChg));
  put(j,"ScheduleOA.ProfDeviatDueAcctMeth",R(O.acctDev));       /* optional integer, may be negative */

  /* method of valuation of closing stock (object with four required leaves).
     put() skips only undefined/null/"" — 0 is written — so EffectOnPL lands
     present at its nil value and all four required leaves are always emitted. */
  put(j,"ScheduleOA.MethodOfValClgStk.ValRawMaterial",sv(O.vRaw)||"1");
  put(j,"ScheduleOA.MethodOfValClgStk.ValFinishedGoods",sv(O.vFin)||"1");
  put(j,"ScheduleOA.MethodOfValClgStk.ChngStockValMetFlg",sv(O.stkChg)||"N");
  put(j,"ScheduleOA.MethodOfValClgStk.EffectOnPL",R(O.stkEff));
}

/* =====================================================================
   IMPORT — impOa(I7): read block ScheduleOA back into S.oa (inverse of the
   export, so buildReturn -> importReturn -> buildReturn is identity).
   ===================================================================== */
function impOa(I7){
  const read=[];
  const O=(I7&&I7.ScheduleOA)||{};
  if(!Object.keys(O).length) return read;
  S.oa=S.oa||{};
  if(O.IncUnHeadBPFlag!=null) S.oa.bpFlag=O.IncUnHeadBPFlag;
  if(Array.isArray(O.NatOfBus)){
    const rows=[];
    O.NatOfBus.forEach(g=>{ if(g&&Array.isArray(g.NatureOfBusiness))
      g.NatureOfBusiness.forEach(r=>rows.push({code:r&&r.Code,trade:(r&&r.TradeName1)||""})); });
    S.oa.nob=rows;
  }
  if(O.NumberOfBranches!=null) S.oa.branches=O.NumberOfBranches;
  if(O.MethodOfAcct!=null) S.oa.acctMeth=O.MethodOfAcct;
  if(O.ChangeInAcctMethFlg!=null) S.oa.acctChg=O.ChangeInAcctMethFlg;
  if(O.ProfDeviatDueAcctMeth!=null) S.oa.acctDev=O.ProfDeviatDueAcctMeth;
  if(O.MethodOfValClgStk){const M=O.MethodOfValClgStk;
    if(M.ValRawMaterial!=null)     S.oa.vRaw=M.ValRawMaterial;
    if(M.ValFinishedGoods!=null)   S.oa.vFin=M.ValFinishedGoods;
    if(M.ChngStockValMetFlg!=null) S.oa.stkChg=M.ChngStockValMetFlg;
    if(M.EffectOnPL!=null)         S.oa.stkEff=M.EffectOnPL;
  }
  read.push("Schedule OA (business — general)");
  return read;
}

/* =====================================================================
   CHECKS — chkOa(): this section's own screen validations (err/warn).
   Department rules are Phase 6.
   ===================================================================== */
function chkOa(){
  const out=[]; const O=S.oa||{};
  if(!st0(O.bpFlag))
    out.push({lvl:"err",t:"Business income flag required",m:"Answer whether you have any income under the head business and profession.",sec:"oa"});
  if(O.bpFlag==="Y"){
    if(!(O.nob||[]).some(r=>st0(r&&r.code)))
      out.push({lvl:"warn",t:"Nature of business",m:"Enter at least one Code-Sub Sector when business income is declared.",sec:"oa"});
    if((O.nob||[]).length>3)
      out.push({lvl:"warn",t:"Nature of business",m:"Only three nature-of-business codes are permitted; extra rows are dropped on export.",sec:"oa"});
    if(!st0(O.acctMeth))
      out.push({lvl:"warn",t:"Method of accounting",m:"Select the method of accounting (Mercantile or Cash).",sec:"oa"});
    if(!st0(O.vRaw)||!st0(O.vFin))
      out.push({lvl:"warn",t:"Stock valuation",m:"Select the method of valuation for raw material and finished goods.",sec:"oa"});
  }
  if(!out.some(x=>x.lvl==="err"))
    out.push({lvl:"ok",t:"Schedule OA",m:O.bpFlag==="Y"?((O.nob||[]).filter(r=>st0(r&&r.code)).length+" business code(s) · "+(O.acctMeth==="CASH"?"Cash":"Mercantile")):"No business income.",sec:"oa"});
  return out;
}

/* ---- register (overrides the boot stub for "oa") ---------------- */
reg({id:"oa", t:"Business — general", ref:"Schedule OA",
     f:secOa, s:()=>{ const O=S.oa||{}; if(O.bpFlag!=="Y") return "No business income";
       const n=(O.nob||[]).filter(r=>st0(r&&r.code)).length; return n?(n+" business code"+(n>1?"s":"")):"Business income"; },
     eng:engOa, exp:expOa, imp:impOa, chk:chkOa, order:80, corder:41});
