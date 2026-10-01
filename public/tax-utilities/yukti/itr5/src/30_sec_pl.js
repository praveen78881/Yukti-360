/* enum tables from books/ITR-5/enums.json (verbatim; do not hand-type).
   PL_CODEAD (315, 44AD business codes), PL_CODEADA (38, 44ADA), PL_CODEAE (7, 44AE),
   PL_OWNFLAG (owned/leased/hired), PL_NRSEC (44B/44BB/44BBA/44BBC/44BBD),
   PL_BDSTATE (38 state codes), PL_BDCTRY (250 country codes) — for section pl. */
const PL_CODEAD=[["01001","Growing and manufacturing of tea"],["01002","Growing and manufacturing of coffee"],["01003","Growing and manufacturing of rubber"],["01004","Market gardening and horticulture specialties"],["01005","Raising of silk worms and production of silk"],["01006","Raising of bees and production of honey"],["01007","Raising of poultry and production of eggs"],["01008","Rearing of sheep and production of wool"],["01009","Rearing of animals and production of animal products"],["01010","Agricultural and animal husbandry services"],["01011","Soil conservation, soil testing and soil desalination services"],["01012","Hunting, trapping and game propagation services"],["01013","Growing of timber, plantation, operation of tree nurseries and conserving of forest"],["01014","Gathering of tendu leaves"],["01015","Gathering of other wild growing materials"],["01016","Forestry service activities, timber cruising, afforestation and reforestation"],["01017","Logging service activities, transport of logs within the forest"],["01018","Other agriculture, animal husbandry or forestry activity n.e.c"],["02001","Fishing on commercial basis in inland waters"],["02002","Fishing on commercial basis in ocean and coastal areas"],["02003","Fish farming"],["02004","Gathering of marine materials such as natural pearls, sponges, coral etc."],["02005","Services related to marine and fresh water fisheries, fish hatcheries and fish farms"],["02006","Other Fish farming activity n.e.c"],["03001","Mining and agglomeration of hard coal"],["03002","Mining and agglomeration of lignite"],["03003","Extraction and agglomeration of peat"],["03004","Extraction of crude petroleum and natural gas"],["03005","Service activities incidental to oil and gas extraction excluding surveying"],["03006","Mining of uranium and thorium ores"],["03007","Mining of iron ores"],["03008","Mining of non-ferrous metal ores, except uranium and thoriumores"],["03009","Mining of gemstones"],["03010","Mining of chemical and fertilizer minerals"],["03011","Mining of quarrying of abrasive materials"],["03012","Mining of mica, graphite and asbestos"],["03013","Quarrying of stones (marble/granite/dolomite), sand and clay"],["03014","Other mining and quarrying"],["03015","Mining and production of salt"],["03016","Other mining and quarrying n.e.c"],["04001","Production, processing and preservation of meat and meat products"],["04002","Production, processing and preservation of fish and fish products"],["04003","Manufacture of vegetable oil, animal oil and fats"],["04004","Processing of fruits, vegetables and edible nuts"],["04005","Manufacture of dairy products"],["04006","Manufacture of sugar"],["04007","Manufacture of cocoa, chocolates and sugar confectionery"],["04008","Flour milling"],["04009","Rice milling"],["04010","Dal milling"],["04011","Manufacture of other grain mill products"],["04012","Manufacture of bakery products"],["04013","Manufacture of starch products"],["04014","Manufacture of animal feeds"],["04015","Manufacture of other food products"],["04016","Manufacturing of wines"],["04017","Manufacture of beer"],["04018","Manufacture of malt liquors"],["04019","Distilling and blending of spirits, production of ethylalcohol"],["04020","Manufacture of mineral water"],["04021","Manufacture of soft drinks"],["04022","Manufacture of other non-alcoholic beverages"],["04023","Manufacture of tobacco products"],["04024","Manufacture of textiles (other than by handloom)"],["04025","Manufacture of textiles using handlooms (khadi)"],["04026","Manufacture of carpet, rugs, blankets, shawls etc. (other than by hand)"],["04027","Manufacture of carpet, rugs, blankets, shawls etc. by hand"],["04028","Manufacture of wearing apparel"],["04029","Tanning and dressing of leather"],["04030","Manufacture of luggage, handbags and the like saddler and harness"],["04031","Manufacture of footwear"],["04032","Manufacture of wood and wood products, cork, straw and plaiting material"],["04033","Manufacture of paper and paper products"],["04034","Publishing, printing and reproduction of recorded media"],["04035","Manufacture of coke oven products"],["04036","Manufacture of refined petroleum products"],["04037","Processing of nuclear fuel"],["04038","Manufacture of fertilizers and nitrogen compounds"],["04039","Manufacture of plastics in primary forms and of synthetic rubber"],["04040","Manufacture of paints, varnishes and similar coatings"],["04041","Manufacture of pharmaceuticals, medicinal chemicals and botanical products"],["04042","Manufacture of soap and detergents"],["04043","Manufacture of other chemical products"],["04044","Manufacture of man-made fibers"],["04045","Manufacture of rubber products"],["04046","Manufacture of plastic products"],["04047","Manufacture of glass and glass products"],["04048","Manufacture of cement, lime and plaster"],["04049","Manufacture of articles of concrete, cement and plaster"],["04050","Manufacture of Bricks"],["04051","Manufacture of other clay and ceramic products"],["04052","Manufacture of other non-metallic mineral products"],["04053","Manufacture of pig iron, sponge iron, Direct Reduced Iron etc."],["04054","Manufacture of Ferro alloys"],["04055","Manufacture of Ingots, billets, blooms and slabs etc."],["04056","Manufacture of steel products"],["04057","Manufacture of basic precious and non-ferrous metals"],["04058","Manufacture of non-metallic mineral products"],["04059","Casting of metals"],["04060","Manufacture of fabricated metal products"],["04061","Manufacture of engines and turbines"],["04062","Manufacture of pumps and compressors"],["04063","Manufacture of bearings and gears"],["04064","Manufacture of ovens and furnaces"],["04065","Manufacture of lifting and handling equipment"],["04066","Manufacture of other general purpose machinery"],["04067","Manufacture of agricultural and forestry machinery"],["04068","Manufacture of Machine Tools"],["04069","Manufacture of machinery for metallurgy"],["04070","Manufacture of machinery for mining, quarrying and constructions"],["04071","Manufacture of machinery for processing of food and beverages"],["04072","Manufacture of machinery for leather and textile"],["04073","Manufacture of weapons and ammunition"],["04074","Manufacture of other special purpose machinery"],["04075","Manufacture of domestic appliances"],["04076","Manufacture of office, accounting and computing machinery"],["04077","Manufacture of electrical machinery and apparatus"],["04078","Manufacture of Radio, Television, communication equipment and apparatus"],["04079","Manufacture of medical and surgical equipment"],["04080","Manufacture of industrial process control equipment"],["04081","Manufacture of instruments and appliances for measurements and navigation"],["04082","Manufacture of optical instruments"],["04083","Manufacture of watches and clocks"],["04084","Manufacture of motor vehicles"],["04085","Manufacture of body of motor vehicles"],["04086","Manufacture of parts and accessories of motor vehicles and engines"],["04087","Building and repair of ships and boats"],["04088","Manufacture of railway locomotive and rolling stocks"],["04089","Manufacture of aircraft and spacecraft"],["04090","Manufacture of bicycles"],["04091","Manufacture of other transport equipment"],["04092","Manufacture of furniture"],["04093","Manufacture of jewellery"],["04094","Manufacture of sports goods"],["04095","Manufacture of musical instruments"],["04096","Manufacture of games and toys"],["04097","Other manufacturing n.e.c."],["04098","Recycling of metal waste and scrap"],["04099","Recycling of non- metal waste and scrap"],["05001","Production, collection and distribution of electricity"],["05002","Manufacture and distribution of gas"],["05003","Collection, purification and distribution of water"],["05004","Other essential commodity service n.e.c"],["06001","Site preparation works"],["06002","Building of complete constructions or parts- civil contractors"],["06003","Building installation"],["06004","Building completion"],["06005","Construction and maintenance of roads, rails, bridges, tunnels, ports, harbour, runways etc."],["06006","Construction and maintenance of power plants"],["06007","Construction and maintenance of industrial plants"],["06008","Construction and maintenance of power transmission and telecommunication lines"],["06009","Construction of water ways and water reservoirs"],["06010","Other construction activity n.e.c."],["07001","Purchase, sale and letting of leased buildings (residential and non-residential)"],["07002","Operating of real estate of self-owned buildings (residential and non-residential)"],["07003","Developing and sub-dividing real estate into lots"],["07004","Real estate activities on a fee or contract basis"],["07005","Other real estate/renting services n.e.c"],["08001","Renting of land transport equipment"],["08002","Renting of water transport equipment"],["08003","Renting of air transport equipment"],["08004","Renting of agricultural machinery and equipment"],["08005","Renting of construction and civil engineering machinery"],["08006","Renting of office machinery and equipment"],["08007","Renting of other machinery and equipment n.e.c."],["08008","Renting of personal and household goods n.e.c."],["08009","Renting of other machinery n.e.c."],["09001","Wholesale and retail sale of motor vehicles"],["09002","Repair and maintenance of motor vehicles"],["09003","Sale of motor parts and accessories- wholesale and retail"],["09004","Retail sale of automotive fuel"],["09006","Wholesale of agricultural raw material"],["09007","Wholesale of food and beverages and tobacco"],["09008","Wholesale of household goods"],["09009","Wholesale of metals and metal ores"],["09010","Wholesale of household goods"],["09011","Wholesale of construction material"],["09012","Wholesale of hardware and sanitary fittings"],["09013","Wholesale of cotton and jute"],["09014","Wholesale of raw wool and raw silk"],["09015","Wholesale of other textile fibres"],["09016","Wholesale of industrial chemicals"],["09017","Wholesale of fertilizers and pesticides"],["09018","Wholesale of electronic parts and equipment"],["09019","Wholesale of other machinery, equipment and supplies"],["09020","Wholesale of waste, scrap and materials for re-cycling"],["09021","Retail sale of food, beverages and tobacco in specialized stores"],["09022","Retail sale of other goods in specialized stores"],["09023","Retail sale in non-specialized stores"],["09024","Retail sale of textiles, apparel, footwear, leather goods"],["09025","Retail sale of other household appliances"],["09026","Retail sale of hardware, paint and glass"],["09027","Wholesale of other products n.e.c"],["09028","Retail sale of other products n.e.c"],["10001","Hotels Star rated"],["10002","Hotels Non-star rated"],["10003","Motels, Inns and Dharmshalas"],["10004","Guest houses and circuit houses"],["10005","Dormitories and hostels at educational institutions"],["10006","Short stay accommodations n.e.c."],["10007","Restaurants with bars"],["10008","Restaurants without bars"],["10009","Canteens"],["10010","Independent caterers"],["10011","Casinos and other games of chance"],["10012","Other hospitality services n.e.c."],["11001","Travel agencies and tour operators"],["11002","Packers and movers"],["11003","Passenger land transport"],["11004","Air transport"],["11005","Transport by urban/sub-urban railways"],["11006","Inland water transport"],["11007","Sea and coastal water transport"],["11008","Freight transport by road"],["11009","Freight transport by railways"],["11010","Forwarding of freight"],["11011","Receiving and acceptance of freight"],["11012","Cargo handling"],["11013","Storage and warehousing"],["11014","Transport via pipelines (transport of gases, liquids, slurry and other commodities)"],["11015","Other Transport and Logistics services n.e.c"],["12001","Post and courier activities"],["12002","Basic telecom services"],["12003","Value added telecom services"],["12004","Maintenance of telecom network"],["12005","Activities of the cable operators"],["12006","Other Post and Telecommunication services n.e.c"],["13001","Commercial banks, saving banks and discount houses"],["13002","Specialised institutions granting credit"],["13003","Financial leasing"],["13004","Hire-purchase financing"],["13005","Housing finance activities"],["13006","Commercial loan activities"],["13007","Credit cards"],["13008","Mutual funds"],["13009","Chit fund"],["13010","Investment activities"],["13011","Life insurance"],["13012","Pension funding"],["13013","Non-life insurance"],["13014","Administration of financial markets"],["13015","Stock brokers, sub-brokers and related activities"],["13016","Financial advisers, mortgage advisers and brokers"],["13017","Foreign exchange services"],["13018","Other financial intermediation services n.e.c."],["14005","Other IT enabled services"],["14007","Cyber cafe"],["14009","Computer training and educational institutes"],["14010","Other computation related services n.e.c."],["15001","Natural sciences and engineering"],["15002","Social sciences and humanities"],["15003","Other Research and Development activities n.e.c."],["16006","Advertising"],["16010","Auctioneers"],["16012","Market research and public opinion polling"],["16014","Labour recruitment and provision of personnel"],["16015","Investigation and security services"],["16016","Building-cleaning and industrial cleaning activities"],["16017","Packaging activities"],["16019","Other professional services n.e.c."],["17001","Primary education"],["17002","Secondary/ senior secondary education"],["17003","Technical and vocational secondary/ senior secondary education"],["17004","Higher education"],["17005","Education by correspondence"],["17006","Coaching centres and tuitions"],["17007","Other education services n.e.c."],["18006","Independent blood banks"],["18007","Medical transcription"],["18008","Independent ambulance services"],["18009","Medical suppliers, agencies and stores"],["19001","Social work activities with accommodation (orphanages and oldage homes)"],["19002","Social work activities without accommodation (Creches)"],["19003","Industry associations, chambers of commerce"],["19004","Professional organisations"],["19005","Trade unions"],["19006","Religious organizations"],["19007","Political organisations"],["19008","Other membership organisations n.e.c. (rotary clubs, book clubs and philatelic clubs)"],["19009","Other Social or community service n.e.c"],["20001","Motion picture production"],["20002","Film distribution"],["20003","Film laboratories"],["20004","Television channel productions"],["20005","Television channels broadcast"],["20006","Video production and distribution"],["20007","Sound recording studios"],["20008","Radio - recording and distribution"],["20009","Stage production and related activities"],["20013","Circuses and race tracks"],["20014","Video Parlours"],["20015","News agency activities"],["20016","Library and archives activities"],["20017","Museum activities"],["20018","Preservation of historical sites and buildings"],["20019","Botanical and zoological gardens"],["20020","Operation and maintenance of sports facilities"],["20021","Activities of sports and game schools"],["20022","Organisation and operation of indoor/outdoor sports and promotion and production of sporting events"],["20023","Other sporting activities n.e.c."],["20023_1","Sports Management"],["20024","Other recreational activities n.e.c."],["21001","Hair dressing and other beauty treatment"],["21002","Funeral and related activities"],["21003","Marriage bureaus"],["21004","Pet care services"],["21005","Sauna and steam baths, massage salons etc."],["21006","Astrological and spiritualists activities"],["21007","Private households as employers of domestic staff"],["21008","Other services n.e.c."],["21008_1","Event Management"],["22001","Extra territorial organisations and bodies (IMF, World Bank,European Commission etc.)"],["21009","Speculative trading"],["21010","Futures and Options trading"],["21011","Buying and selling shares"]];
const PL_CODEADA=[["14001","Software development"],["14002","Other software consultancy"],["14003","Data processing"],["14004","Database activities and distribution of electronic content"],["14006","BPO services"],["14008","Maintenance and repair of office, accounting and computing machinery"],["16001","Legal profession"],["16002","Accounting, book-keeping and auditing profession"],["16003","Tax consultancy"],["16004","Architectural profession"],["16005","Engineering and technical consultancy"],["16007","Fashion designing"],["16008","Interior decoration"],["16009","Photography"],["16013","Business and management consultancy activities"],["16018","Secretarial activities"],["16019_1","Medical Profession"],["16020","Film Artist"],["18001","General hospitals"],["18002","Speciality and super speciality hospitals"],["18003","Nursing homes"],["18004","Diagnostic centres"],["18005","Pathological laboratories"],["18010","Medical clinics"],["18011","Dental practice"],["18012","Ayurveda practice"],["18013","Unani practice"],["18014","Homeopathy practice"],["18015","Nurses, physiotherapists or other para-medical practitioners"],["18016","Veterinary hospitals and practice"],["18017","Medical education"],["18018","Medical research"],["18019","Practice of other alternative medicine"],["18020","Other healthcare services"],["20010","Individual artists excluding authors"],["20011","Literary activities"],["20012","Other cultural activities n.e.c."],["16021","Social Media Influencers"]];
const PL_CODEAE=[["08001","Renting of land transport equipment"],["11002","Packers and movers"],["11008","Freight transport by road"],["11010","Forwarding of freight"],["11011","Receiving and acceptance of freight"],["11012","Cargo handling"],["11015","Other Transport and Logistics services n.e.c"]];
const PL_OWNFLAG=[["OWN","Owned"],["LEASE","Leased"],["HIRED","Hired"]];
const PL_NRSEC=[["44B","44B"],["44BB","44BB"],["44BBA","44BBA"],["44BBC","44BBC"],["44BBD","44BBD"]];
const PL_BDSTATE=[["01","Andaman and Nicobar islands"],["02","Andhra Pradesh"],["03","Arunachal Pradesh"],["04","Assam"],["05","Bihar"],["06","Chandigarh"],["07","Dadra Nagar and Haveli"],["08","Daman and Diu"],["09","Delhi"],["10","Goa"],["11","Gujarat"],["12","Haryana"],["13","Himachal Pradesh"],["14","Jammu and Kashmir"],["15","Karnataka"],["16","Kerala"],["17","Lakshadweep"],["18","Madhya Pradesh"],["19","Maharashtra"],["20","Manipur"],["21","meghalaya"],["22","Mizoram"],["23","Nagaland"],["24","Odisha"],["25","Puducherry"],["26","Punjab"],["27","Rajasthan"],["28","Sikkim"],["29","Tamil Nadu"],["30","Tripura"],["31","Uttar Pradesh"],["32","West Bengal"],["33","Chhattisgarh"],["34","Uttarakhand"],["35","Jharkhand"],["36","Telangana"],["37","Ladakh"],["99","Foreign"]];
const PL_BDCTRY=[["93","AFGHANISTAN,"],["1001","LAND ISLANDS,"],["355","ALBANIA,"],["213","ALGERIA,"],["684","AMERICAN SAMOA,"],["376","ANDORRA,"],["244","ANGOLA,"],["1264","ANGUILLA,"],["1010","ANTARCTICA,"],["1268","ANTIGUA AND BARBUDA,"],["54","ARGENTINA,"],["374","ARMENIA,"],["297","ARUBA,"],["61","AUSTRALIA,"],["43","AUSTRIA,"],["994","AZERBAIJAN,"],["1242","BAHAMAS,"],["973","BAHRAIN,"],["880","BANGLADESH,"],["1246","BARBADOS,"],["375","BELARUS,"],["32","BELGIUM,"],["501","BELIZE,"],["229","BENIN,"],["1441","BERMUDA,"],["975","BHUTAN,"],["591","BOLIVIA (PLURINATIONAL STATE OF),"],["1002","BONAIRE, SINT EUSTATIUS AND SABA,"],["387","BOSNIA AND HERZEGOVINA,"],["267","BOTSWANA,"],["1003","BOUVET ISLAND,"],["55","ALBANIA,"],["1014","BRITISH INDIAN OCEAN TERRITORY,"],["673","BRUNEI DARUSSALAM,"],["359","BULGARIA,"],["226","BURKINA FASO,"],["257","BURUNDI,"],["238","CABO VERDE,"],["855","CAMBODIA,"],["237","CAMEROON,"],["1","LAND ISLANDS,"],["1345","CAYMAN ISLANDS,"],["236","CENTRAL AFRICAN REPUBLIC,"],["235","CHAD,"],["56","CHILE,"],["86","CHINA,"],["9","BENIN,"],["672","COCOS (KEELING) ISLANDS,"],["57","BURUNDI,"],["270","COMOROS,"],["242","BAHAMAS,"],["243","CONGO (DEMOCRATIC REPUBLIC OF THE),"],["682","COOK ISLANDS,"],["506","COSTA RICA,"],["225","C TE D'IVOIRE,"],["385","CROATIA,"],["53","CUBA,"],["1015","CURA AO,"],["357","CYPRUS,"],["420","CZECHIA,"],["45","CAYMAN ISLANDS,"],["253","DJIBOUTI,"],["1767","DOMINICA,"],["1809","DOMINICAN REPUBLIC,"],["593","ECUADOR,"],["20","CZECHIA,"],["503","EL SALVADOR,"],["240","EQUATORIAL GUINEA,"],["291","ERITREA,"],["372","ESTONIA,"],["251","ETHIOPIA,"],["500","FALKLAND ISLANDS (MALVINAS),"],["298","FAROE ISLANDS,"],["679","FIJI,"],["358","FINLAND,"],["33","FRANCE,"],["594","FRENCH GUIANA,"],["689","FRENCH POLYNESIA,"],["1004","FRENCH SOUTHERN TERRITORIES,"],["241","GABON,"],["220","GAMBIA,"],["995","GEORGIA,"],["49","GERMANY,"],["233","GHANA,"],["350","GIBRALTAR,"],["30","GREECE,"],["299","GREENLAND,"],["1473","GRENADA,"],["590","GUADELOUPE,"],["1671","GUAM,"],["502","GUATEMALA,"],["1481","GUERNSEY,"],["224","GUINEA,"],["245","GUINEA-BISSAU,"],["592","GUYANA,"],["509","HAITI,"],["1005","HEARD ISLAND AND MCDONALD ISLANDS,"],["6","ANDORRA,"],["504","HONDURAS,"],["852","HONG KONG,"],["36","CENTRAL AFRICAN REPUBLIC,"],["354","ICELAND,"],["91","BOLIVIA (PLURINATIONAL STATE OF),"],["62","INDONESIA,"],["98","FAROE ISLANDS,"],["964","IRAQ,"],["353","IRELAND,"],["1624","ISLE OF MAN,"],["972","ISRAEL,"],["5","ALBANIA,"],["1876","JAMAICA,"],["81","GUERNSEY,"],["1534","JERSEY,"],["962","JORDAN,"],["7","ARUBA,"],["254","KENYA,"],["686","KIRIBATI,"],["850","KOREA(DEMOCRATIC PEOPLE'S REPUBLIC OF),"],["82","COOK ISLANDS,"],["965","KUWAIT,"],["996","KYRGYZSTAN,"],["856","LAO PEOPLE'S DEMOCRATIC REPUBLIC,"],["371","LATVIA,"],["961","LEBANON,"],["266","LESOTHO,"],["231","LIBERIA,"],["218","LIBYA,"],["423","LIECHTENSTEIN,"],["370","LITHUANIA,"],["352","LUXEMBOURG,"],["853","MACAO,"],["389","MACEDONIA(THE FORMER YUGOSLAV REPUBLIC OF),"],["261","MADAGASCAR,"],["265","MALAWI,"],["60","MALAYSIA,"],["960","MALDIVES,"],["223","MALI,"],["356","MALTA,"],["692","MARSHALL ISLANDS,"],["596","MARTINIQUE,"],["222","MAURITANIA,"],["230","MAURITIUS,"],["269","MAYOTTE,"],["52","HONG KONG,"],["691","MICRONESIA (FEDERATED STATES OF),"],["373","MOLDOVA (REPUBLIC OF),"],["377","MONACO,"],["976","MONGOLIA,"],["382","MONTENEGRO,"],["1664","MONTSERRAT,"],["212","MOROCCO,"],["258","MOZAMBIQUE,"],["95","GEORGIA,"],["264","ANGUILLA,"],["674","NAURU,"],["977","NEPAL,"],["31","LIBERIA,"],["687","NEW CALEDONIA,"],["64","ANGUILLA,"],["505","NICARAGUA,"],["227","NIGER,"],["234","NIGERIA,"],["683","NIUE,"],["15","CURA AO,"],["1670","NORTHERN MARIANA ISLANDS,"],["47","NORWAY,"],["968","OMAN,"],["92","GUYANA,"],["680","PALAU,"],["970","PALESTINE, STATE OF,"],["507","PANAMA,"],["675","PAPUA NEW GUINEA,"],["595","PARAGUAY,"],["51","ETHIOPIA,"],["63","PHILIPPINES,"],["1011","PITCAIRN,"],["48","POLAND,"],["14","BRITISH INDIAN OCEAN TERRITORY,"],["1787","PUERTO RICO,"],["974","QATAR,"],["262","R UNION,"],["40","EQUATORIAL GUINEA,"],["8","ANTIGUA AND BARBUDA,"],["250","RWANDA,"],["1006","SAINT BARTH LEMY,"],["290","SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA,"],["1869","SAINT KITTS AND NEVIS,"],["1758","SAINT LUCIA,"],["1007","SAINT MARTIN (FRENCH PART),"],["508","SAINT PIERRE AND MIQUELON,"],["1784","SAINT VINCENT AND THE GRENADINES,"],["685","SAMOA,"],["378","SAN MARINO,"],["239","SAO TOME AND PRINCIPE,"],["966","SAUDI ARABIA,"],["221","SENEGAL,"],["381","SERBIA,"],["248","SEYCHELLES,"],["232","SIERRA LEONE,"],["65","KUWAIT,"],["1721","SINT MAARTEN (DUTCH PART),"],["421","SLOVAKIA,"],["386","SLOVENIA,"],["677","SOLOMON ISLANDS,"],["252","SOMALIA,"],["28","SOUTH AFRICA,"],["1008","SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS,"],["211","SOUTH SUDAN,"],["35","CHAD,"],["94","AZERBAIJAN,"],["249","SUDAN,"],["597","SURINAME,"],["1012","SVALBARD AND JAN MAYEN,"],["268","ANTIGUA AND BARBUDA,"],["46","BARBADOS,"],["41","BERMUDA,"],["963","SYRIAN ARAB REPUBLIC,"],["886","TAIWAN, PROVINCE OF CHINA[A],"],["992","TAJIKISTAN,"],["255","TANZANIA, UNITED REPUBLIC OF,"],["66","LESOTHO,"],["670","NORTHERN MARIANA ISLANDS,"],["228","TOGO,"],["690","TOKELAU,"],["676","TONGA,"],["1868","TRINIDAD AND TOBAGO,"],["216","TUNISIA,"],["90","GUADELOUPE,"],["993","TURKMENISTAN,"],["1649","TURKS AND CAICOS ISLANDS,"],["688","TUVALU,"],["256","UGANDA,"],["380","UKRAINE,"],["971","UNITED ARAB EMIRATES,"],["44","ANGOLA,"],["2","BAHAMAS,"],["1009","UNITED STATES MINOR OUTLYING ISLANDS,"],["598","URUGUAY,"],["998","UZBEKISTAN,"],["678","VANUATU,"],["58","FINLAND,"],["84","AMERICAN SAMOA,"],["1284","VIRGIN ISLANDS (BRITISH),"],["1340","VIRGIN ISLANDS (U.S.),"],["681","WALLIS AND FUTUNA,"],["1013","WESTERN SAHARA,"],["967","YEMEN,"],["260","ZAMBIA,"],["263","ZIMBABWE,"],["9999","OTHERS"]];

/* =====================================================================
   70_sec_pl.js — Manufacturing / Trading / Profit & Loss (ITR-5, Phase 4)
   Section id "pl", compute order 20. Built ONLY from books/ITR-5/:
   MANUFACTURING_ACCOUNT.md, TRADING_ACCOUNT.md, PROFIT_LOSS.md — plus
   enums.json for every dropdown (the PL_* tables above, verbatim).
   Schema blocks (books/ITR-5/section_map.json, section "pl"):
     ManufacturingAccount, TradingAccount, PARTA_PL.

   ITR-5 facts that differ from ITR-3 (read from this form's own books):
   - Every P&L debit head nests one level deeper, under
     DebitsToPL.DebitPlAcnt.*  (ITR-3 had them under DebitsToPL.* ).
   - Tax provisions / appropriations are DebitsToPL.TaxProvAppr.* and the
     item-61 balance carried is PartnerAccBalTrf (not ProprietorAccBalTrf);
     item 60 is DebitsToPL.TaxProvAppr.Appropriations.TrfToReserves.
   - Interest (52) has four legs: to Partners / to others, each split into
     non-resident (NonResOtherCompany / Others) and resident (ResPartners /
     ResOthers); 52iii InterestExpdr = the sum of all four.
   - Item 46 is Salary/Remuneration to Partners (DebitPlAcnt.SalRemuneration);
     item 47 Other expenses carries the array total in DebitPlAcnt.OtherExpenses.
   - Credits 14xi has only Liabilities-written-back (a) and interest from firm
     (b) — no "remuneration from firm" line (that key does not exist here).
   - Trading item numbering: 8 = Purchases, 9 = Direct Expenses; the item-9
     grand total is DirectExpenses (L31) and the 9(iii) array total is the
     required DirectExpensesTotal (J38) — two distinct keys.
   - 44AE carries TotalPrsumptvIncUs44EGoods and TotalPrsumptvIncGCUs44E as
     the col-5 totals, SalRemrtnToPartnerFirm (64iii) and the required
     TotalPrsumptvIncUs44E (64iv) = MAX(0, 64ii − 64iii).

   HEAD ROLL-UP: this section produces the *accounts* only. The PGBP head is
   computed by Schedule BP (section "bp"), which consumes these figures via
   S.C.pl.* and rolls the business head into GTI. So S.C.pl.income = 0 to
   avoid a double count. No item here is regime-closed — accounting figures
   are identical in both regimes, so nothing is gated on isNew().
   ===================================================================== */

/* two-flag list not present in enums.json (book gives it literally: L45) */
const PL_YN=[["Yes","Yes"],["No","No"]];

/* ---- state: S.pl mirrors each schema block exactly. eng writes every
   computed total back into the same paths, so S.pl is the one source of
   truth for both the renderer's cell()s and expPl(). ---- */
function _plState(){
  return {
    mfg:{OpeningInventory:{}, ClosingStock:{}},
    trd:{ExciseCustomsVAT:{}, DutyTaxPay:{ExciseCustomsVAT:{}},
         OtherOperatingRevenueDtls:[], OtherDirectExpenses:[]},
    pl:{CreditsToPL:{OthIncome:{OtherIncDtls:[]}},
        DebitsToPL:{DebitPlAcnt:{EmployeeComp:{}, Insurances:{},
            CommissionExpdrDtls:{}, RoyalityDtls:{}, ProfessionalConstDtls:{},
            RatesTaxesPays:{ExciseCustomsVAT:{}},
            OtherExpensesDtls:[],
            BadDebtDtls:{BadDebtAmtDtls:[], OthersPANNotAvlblDtl:[]},
            InterestExpdrtDtls:{}},
          TaxProvAppr:{Appropriations:{}}},
        NatOfBus44AD:[], PersumptiveInc44AD:{},
        NatOfBus44ADA:[], PersumptiveInc44ADA:{},
        NatOfBus44AE:[], GoodsDtlsUs44AE:[],
        NoBooksOfAccPL:{},
        NonResidentPLDetails:[], NonResidentPL:{}}
  };
}
S.pl = S.pl || _plState();

/* ================================================================
   engPl — every formula tagged with its book cell reference (column O/L
   verbatim from PROFIT_LOSS.md / TRADING_ACCOUNT.md / MANUFACTURING_ACCOUNT.md).
   ================================================================ */

/* turnover-cap helpers (PROFIT_LOSS.md rows 158/172):
   44AD  T148 = IF(cash>5% of turnover, MIN(turnover,2cr), MIN(turnover,3cr))
   44ADA T161 = IF(cash>5% of receipts, MIN(receipts,50L), MIN(receipts,75L)) */
function _plCapAD(bank,cash,other){
  const turn=N(bank)+N(cash)+N(other), five=turn*5/100; /* T144, T142 */
  return N(cash)>five?Math.min(turn,20000000):Math.min(turn,30000000); /* T148 */
}
function _plCapADA(bank,cash,other){
  const rec=N(bank)+N(cash)+N(other), five=rec*5/100; /* T157, T155 */
  return N(cash)>five?Math.min(rec,5000000):Math.min(rec,7500000); /* T161 */
}

function engPl(){
  const G=p=>N(get("pl."+p)), St=(p,v)=>set("pl."+p,R(v)),
        A=p=>get("pl."+p)||[], SUM=(arr,k)=>(arr||[]).reduce((a,r)=>a+N(r[k]),0);

  /* ---------- Manufacturing Account (MANUFACTURING_ACCOUNT.md) ---------- */
  const mOpngTot=Math.max(0, G("mfg.OpeningInventory.OpngStckRawMat")+G("mfg.OpeningInventory.OpngStckWrkinPrgrs")); /* Q8  1Aiii = Ai+Aii */
  St("mfg.OpeningInventory.OpngInvntryTotal", mOpngTot);
  const mDirExp=G("mfg.OpeningInventory.CarriageInward")+G("mfg.OpeningInventory.PowerAndFuel")+G("mfg.OpeningInventory.OthDirectExpenses"); /* Q11 1D = Di+Dii+Diii */
  St("mfg.OpeningInventory.DirectExpenses", mDirExp);
  const mFO=G("mfg.OpeningInventory.IndirectWages")+G("mfg.OpeningInventory.FactoryRentAndRates")+G("mfg.OpeningInventory.FactoryInsurance")+G("mfg.OpeningInventory.FactoryFuelAndPower")+G("mfg.OpeningInventory.FactoryGeneralExpenses")+G("mfg.OpeningInventory.DeprctnOfFactoryMachinery"); /* Q22 1Evii = Ei..Evi */
  St("mfg.OpeningInventory.TotalFactoryOverheads", mFO);
  const mDebits=mOpngTot+G("mfg.OpeningInventory.Purchases")+G("mfg.OpeningInventory.DirectWages")+mDirExp+mFO; /* Q23 1F = Aiii+B+C+D+Evii */
  St("mfg.OpeningInventory.TotalDebtsManfctrngAcc", mDebits);
  const mClose=G("mfg.ClosingStock.ClsngStckRawMaterial")+G("mfg.ClosingStock.ClsngStckWrkInPrgrs"); /* Q27 2iii = 2i+2ii */
  St("mfg.ClosingStock.ClsngStckTotal", mClose);
  const mCOGP=mDebits-mClose; /* Q28 3 = 1F − 2 (may be negative) */
  St("mfg.CostOfGoodsPrdcd", mCOGP);

  /* ---------- Trading Account (TRADING_ACCOUNT.md) ---------- */
  const tOOR=SUM(A("trd.OtherOperatingRevenueDtls"),"OperatingRevenueAmt"); /* J12 4A(iii) total */
  St("trd.OperatingRevenueTotal", tOOR);
  const tAiv=G("trd.SaleOfGoods")+G("trd.SaleOfServices")+tOOR; /* L14 4A(iv) = i+ii+iiic */
  St("trd.SalesGrossReceiptsTotal", tAiv);
  const t4Cix=G("trd.ExciseCustomsVAT.UnionExciseDuty")+G("trd.ExciseCustomsVAT.ServiceTax")+G("trd.ExciseCustomsVAT.VATorSaleTax")+G("trd.ExciseCustomsVAT.CentralGoodServiceTax")+G("trd.ExciseCustomsVAT.StateGoodServiceTax")+G("trd.ExciseCustomsVAT.IntegratedGoodServiceTax")+G("trd.ExciseCustomsVAT.UnionTerrGoodServiceTax")+G("trd.ExciseCustomsVAT.OthDutyTaxCess"); /* L25 4C(ix) = 4Ci..4Cviii */
  St("trd.ExciseCustomsVAT.TotExciseCustomsVAT", t4Cix);
  const t4D=tAiv+G("trd.GrossRcptFromProfession")+t4Cix; /* L26 4D = Aiv+B+Cix */
  St("trd.TotRevenueFrmOperations", t4D);
  const tCred=t4D+G("trd.ClsngStckOfFinishedStcks"); /* L28 item 6 = 4D + 5 */
  St("trd.TardingAccTotCred", tCred);
  const tODE=SUM(A("trd.OtherDirectExpenses"),"Amount"); /* J38 item 9iii array total */
  St("trd.DirectExpensesTotal", tODE);
  const t9=G("trd.CarriageInward")+G("trd.PowerAndFuel")+tODE; /* L31 item 9 = 9i+9ii+9iii */
  St("trd.DirectExpenses", t9);
  const t10xii=G("trd.DutyTaxPay.ExciseCustomsVAT.CustomDuty")+G("trd.DutyTaxPay.ExciseCustomsVAT.CounterVailDuty")+G("trd.DutyTaxPay.ExciseCustomsVAT.SplAddDuty")+G("trd.DutyTaxPay.ExciseCustomsVAT.UnionExciseDuty")+G("trd.DutyTaxPay.ExciseCustomsVAT.ServiceTax")+G("trd.DutyTaxPay.ExciseCustomsVAT.VATorSaleTax")+G("trd.DutyTaxPay.ExciseCustomsVAT.CentralGoodServiceTax")+G("trd.DutyTaxPay.ExciseCustomsVAT.StateGoodServiceTax")+G("trd.DutyTaxPay.ExciseCustomsVAT.IntegratedGoodServiceTax")+G("trd.DutyTaxPay.ExciseCustomsVAT.UnionTerrGoodServiceTax")+G("trd.DutyTaxPay.ExciseCustomsVAT.OthDutyTaxCess"); /* L52 10xii = 10i..10xi */
  St("trd.DutyTaxPay.ExciseCustomsVAT.TotExciseCustomsVAT", t10xii);
  St("trd.GoodsCostPrdcdFrmMA", mCOGP); /* L53 item 11 = Mfg Sl.No.3 (cross-block feed) */
  const tGP=tCred-G("trd.OpngStckOfFinishedStcks")-G("trd.Purchases")-t9-t10xii-mCOGP; /* L54 item 12 = 6−7−8−9−10xii−11 */
  St("trd.GrossProfitFrmBusProf", tGP);
  /* 12a/12c turnover are inputs; 12b/12d income inputs (12b<=12a, 12d<=12c checked) */

  /* ---------- Profit & Loss (PROFIT_LOSS.md) ---------- */
  const p=n=>"pl."+n;
  const t12b=G("trd.IntradayTradingIncome"), t12d=G("trd.IncomeFutureTrd");
  const gpTr=tGP+t12b+t12d; /* O4 item 13 = 12 + 12b + 12d */
  St(p("CreditsToPL.GrossProfitTrnsfFrmTrdAcc"), gpTr);
  const oiArr=SUM(A(p("CreditsToPL.OthIncome.OtherIncDtls")),"Amount");
  const misc=oiArr+G(p("CreditsToPL.OthIncome.LiabilityWrittenBack"))+G(p("CreditsToPL.OthIncome.AmtofInterest")); /* H23 14xi total = SUM(Amount)+LiabWrittenBack+AmtofInterest */
  St(p("CreditsToPL.OthIncome.MiscOthIncome"), misc);
  const totOI=G(p("CreditsToPL.OthIncome.RentInc"))+G(p("CreditsToPL.OthIncome.Comissions"))+G(p("CreditsToPL.OthIncome.Dividends"))+G(p("CreditsToPL.OthIncome.InterestInc"))+G(p("CreditsToPL.OthIncome.ProfitOnSaleFixedAsset"))+G(p("CreditsToPL.OthIncome.ProfitOnInvChrSTT"))+G(p("CreditsToPL.OthIncome.ProfitOnOthInv"))+G(p("CreditsToPL.OthIncome.ProfitOnCurrFluct"))+G(p("CreditsToPL.OthIncome.ProfitOnCnvInvntryToCapAsst"))+G(p("CreditsToPL.OthIncome.ProfitOnAgriIncome"))+misc; /* O25 14xii = 14i..14x + 14xi */
  St(p("CreditsToPL.OthIncome.TotOthIncome"), totOI);
  const totCred=gpTr+totOI; /* O26 item 15 = 13 + 14xii */
  St(p("CreditsToPL.TotCreditsToPL"), totCred);

  const d="DebitsToPL.DebitPlAcnt.";
  const empT=G(p(d+"EmployeeComp.SalsWages"))+G(p(d+"EmployeeComp.Bonus"))+G(p(d+"EmployeeComp.MedExpReimb"))+G(p(d+"EmployeeComp.LeaveEncash"))+G(p(d+"EmployeeComp.LeaveTravelBenft"))+G(p(d+"EmployeeComp.ContToSuperAnnFund"))+G(p(d+"EmployeeComp.ContToPF"))+G(p(d+"EmployeeComp.ContToGratFund"))+G(p(d+"EmployeeComp.ContToOthFund"))+G(p(d+"EmployeeComp.OthEmpBenftExpdr")); /* O44 22xi = 22i..22x */
  St(p(d+"EmployeeComp.TotEmployeeComp"), empT);
  const insT=G(p(d+"Insurances.MedInsur"))+G(p(d+"Insurances.LifeInsur"))+G(p(d+"Insurances.KeyManInsur"))+G(p(d+"Insurances.OthInsur")); /* O52 23v = 23i..23iv */
  St(p(d+"Insurances.TotInsurances"), insT);
  const commT=G(p(d+"CommissionExpdrDtls.NonResOtherCompany"))+G(p(d+"CommissionExpdrDtls.Others")); St(p(d+"CommissionExpdrDtls.Total"),commT); /* O62 30iii */
  const royT=G(p(d+"RoyalityDtls.NonResOtherCompany"))+G(p(d+"RoyalityDtls.Others")); St(p(d+"RoyalityDtls.Total"),royT); /* O66 31iii */
  const profT=G(p(d+"ProfessionalConstDtls.NonResOtherCompany"))+G(p(d+"ProfessionalConstDtls.Others")); St(p(d+"ProfessionalConstDtls.Total"),profT); /* O70 32iii */
  const rtE=d+"RatesTaxesPays.ExciseCustomsVAT.";
  const rt44x=G(p(rtE+"UnionExciseDuty"))+G(p(rtE+"ServiceTax"))+G(p(rtE+"VATorSaleTax"))+G(p(rtE+"Cess"))+G(p(rtE+"CentralGoodServiceTax"))+G(p(rtE+"StateGoodServiceTax"))+G(p(rtE+"IntegratedGoodServiceTax"))+G(p(rtE+"UnionTerrGoodServiceTax"))+G(p(rtE+"OthDutyTaxCess")); /* O92 44x = 44i..44ix */
  St(p(rtE+"TotExciseCustomsVAT"), rt44x);
  const oExp=SUM(A(p(d+"OtherExpensesDtls")),"Amount"); St(p(d+"OtherExpenses"),oExp); /* O100 item 47 total */
  const bd1=SUM(A(p(d+"BadDebtDtls.BadDebtAmtDtls")),"Amount"); St(p(d+"BadDebtDtls.BadDebtAmtDtlsTotal"),bd1); /* H105 48i total */
  const bd2=SUM(A(p(d+"BadDebtDtls.OthersPANNotAvlblDtl")),"Amount"); St(p(d+"BadDebtDtls.OthersPANNotAvlblDtlTotal"),bd2); /* O111 48ii total */
  const badTot=bd1+bd2+G(p(d+"BadDebtDtls.OthersAmtLt1Lakh")); /* O114 48iv = 48i+48ii+48iii */
  St(p(d+"BadDebtDtls.BadDebt"), badTot);
  const debHeads=G(p(d+"Freight"))+G(p(d+"ConsumptionOfStores"))+G(p(d+"PowerFuel"))+G(p(d+"RentExpdr"))+G(p(d+"RepairsBldg"))+G(p(d+"RepairMach"))
    +empT+insT
    +G(p(d+"StaffWelfareExp"))+G(p(d+"Entertainment"))+G(p(d+"Hospitality"))+G(p(d+"Conference"))+G(p(d+"SalePromoExp"))+G(p(d+"Advertisement"))
    +commT+royT+profT
    +G(p(d+"HotelBoardLodge"))+G(p(d+"TravelExp"))+G(p(d+"ForeignTravelExp"))+G(p(d+"ConveyanceExp"))+G(p(d+"TelephoneExp"))+G(p(d+"GuestHouseExp"))+G(p(d+"ClubExp"))+G(p(d+"FestivalCelebExp"))+G(p(d+"Scholarship"))+G(p(d+"Gift"))+G(p(d+"Donation"))
    +rt44x+G(p(d+"AuditFee"))+G(p(d+"SalRemuneration"))+oExp+badTot+G(p(d+"ProvForBadDoubtDebt"))+G(p(d+"OthProvisionsExpdr")); /* item-51 subtractor: 16..21+22xi+23v+24..29+30iii+31iii+32iii+33..43+44x+45+46+47+48iv+49+50 */
  const pbidta=totCred-debHeads; /* O117 item 51 PBIDTA */
  St(p(d+"PBIDTA"), pbidta);
  const intT=G(p(d+"InterestExpdrtDtls.NonResOtherCompany"))+G(p(d+"InterestExpdrtDtls.Others"))+G(p(d+"InterestExpdrtDtls.ResPartners"))+G(p(d+"InterestExpdrtDtls.ResOthers")); /* O125 52iii = 52ia+52ib+52iia+52iib */
  St(p(d+"InterestExpdrtDtls.InterestExpdr"),intT);
  const pbt=pbidta-intT-G(p(d+"DepreciationAmort")); /* O127 item 54 = 51 − 52iii − 53 */
  St(p(d+"PBT"), pbt);
  const tp="DebitsToPL.TaxProvAppr.";
  const pat=pbt-G(p(tp+"ProvForCurrTax"))-G(p(tp+"ProvDefTax")); St(p(tp+"ProfitAfterTax"),pat); /* O131 item 57 = 54 − 55 − 56 */
  const avl=pat+G(p(tp+"BalBFPrevYr")); St(p(tp+"AmtAvlAppr"),avl); /* O133 item 59 = 57 + 58 */
  St(p(tp+"PartnerAccBalTrf"), avl-G(p(tp+"Appropriations.TrfToReserves"))); /* O135 item 61 = 59 − 60 */

  /* presumptive 44AD (62) */
  const ad62i=G(p("PersumptiveInc44AD.GrsTrnOverBank"))+G(p("PersumptiveInc44AD.GrsTotalTrnOverInCash"))+G(p("PersumptiveInc44AD.GrsTrnOverAnyOthMode")); St(p("PersumptiveInc44AD.GrsTrnOverOrReceipt"),ad62i); /* O142 62i = iA+iB+iC */
  const ad62ii=G(p("PersumptiveInc44AD.PersumptiveInc44AD6Per"))+G(p("PersumptiveInc44AD.PersumptiveInc44AD8Per")); St(p("PersumptiveInc44AD.TotPersumptiveInc44AD"),ad62ii); /* O146 62ii = iiA+iiB */
  /* presumptive 44ADA (63) */
  const ada63i=G(p("PersumptiveInc44ADA.GrsTrnOverBank44ADA"))+G(p("PersumptiveInc44ADA.GrsTotalTrnOverInCash44ADA"))+G(p("PersumptiveInc44ADA.GrsTrnOverAnyOthMode44ADA")); St(p("PersumptiveInc44ADA.GrsReceipt"),ada63i); /* O155 63i = iA+iB+iC */
  const ada63ii=G(p("PersumptiveInc44ADA.TotPersumptiveInc44ADA")); /* 63ii typed (>=50% of 63i) */
  /* presumptive 44AE (64): per-carriage income Rs.1000/ton/month if >12MT else Rs.7500/month */
  const goods=A(p("GoodsDtlsUs44AE")); let aeMonths=0, aeInc=0;
  goods.forEach((r,i)=>{const t=N(r.TonnageCapacity),m=N(r.HoldingPeriod);
    const pi=t>12?Math.round(1000*t*m):Math.round(7500*m); /* col 5 */
    set("pl."+p("GoodsDtlsUs44AE")+"."+i+".PresumptiveIncome", R(pi));
    aeMonths+=m; aeInc+=pi;});
  St(p("TotalNumOfMonths"), aeMonths);           /* I172 total col 4 (<=120) */
  St(p("TotalPrsumptvIncUs44EGoods"), aeInc);    /* J172 total col 5 */
  St(p("TotalPrsumptvIncGCUs44E"), aeInc);       /* O175 64ii */
  const ae64iv=Math.max(0, aeInc-G(p("SalRemrtnToPartnerFirm"))); St(p("TotalPrsumptvIncUs44E"), ae64iv); /* O177 64iv = MAX(0, 64ii − 64iii) */
  /* no-account (65) */
  St(p("NoBooksOfAccPL.GrossReceipt"), G(p("NoBooksOfAccPL.GrsRcptAccPayeeOrBankMode"))+G(p("NoBooksOfAccPL.GrsRcptOtherMode"))); /* O180 65(i)a = a1+a2 */
  const nbBus=Math.max(0, G(p("NoBooksOfAccPL.GrossProfit"))-G(p("NoBooksOfAccPL.Expenses"))); St(p("NoBooksOfAccPL.NetProfit"),nbBus); /* O185 65(i)d = MAX(0, b − c) */
  St(p("NoBooksOfAccPL.GrossReceiptPrf"), G(p("NoBooksOfAccPL.GrsRcptAccPayeeOrBankModePrf"))+G(p("NoBooksOfAccPL.GrsRcptOtherModePrf"))); /* O187 65(ii)a */
  const nbPrf=Math.max(0, G(p("NoBooksOfAccPL.GrossProfitPrf"))-G(p("NoBooksOfAccPL.ExpensesPrf"))); St(p("NoBooksOfAccPL.NetProfitPrf"),nbPrf); /* O192 65(ii)d */
  const nbTot=nbBus+nbPrf; St(p("NoBooksOfAccPL.TotBusinessProfession"),nbTot); /* O193 65 total */
  /* speculative (66) */
  const specNet=G(p("GrossProfit"))-G(p("Expenditure")); St(p("NetIncomeFrmSpecActivity"),specNet); /* O197 66iv = 66ii − 66iii */
  /* non-resident (67) */
  const nrArr=A(p("NonResidentPLDetails"));
  const nrGross=SUM(nrArr,"GrossReceipt"), nrNet=SUM(nrArr,"NetProfit");
  St(p("NonResidentPL.GrossReceipt"), nrGross); /* O199 67a = SUM(ai..av) */
  St(p("NonResidentPL.NetProfit"), nrNet);      /* O205 67b = SUM(bi..bv) */

  /* ================= feeds & head roll-up =================
     PGBP head is computed in Schedule BP (section "bp"); pl contributes 0
     directly so GTI is not double-counted. The feeds bp/checks consume: */
  S.C.pl={
    income:0,
    costOfGoodsPrdcd:R(mCOGP),                 /* Mfg item 3 -> Trading item 11 */
    factoryDepreciation:R(G("mfg.OpeningInventory.DeprctnOfFactoryMachinery")), /* 1Evi -> BP depreciation check */
    grossProfitTrading:R(tGP),                 /* Trading item 12 */
    grossProfitTransfPL:R(gpTr),               /* P&L item 13 */
    pbidta:R(pbidta),                          /* P&L item 51 */
    pbt:R(pbt),                                /* P&L item 54 (net profit before tax) */
    depreciationPL:R(G(p(d+"DepreciationAmort"))), /* P&L 53 -> BP Sl.11 */
    salRemPartner:R(G(p(d+"SalRemuneration"))),    /* item 46 -> Part A-General-2 remuneration tie (with 64iii) */
    salRem44AE:R(G(p("SalRemrtnToPartnerFirm"))),  /* item 64iii */
    presAD:R(ad62ii), presADA:R(ada63ii), presAE:R(ae64iv), /* BP 35(i)/(ii)/(iii) */
    presADturnover:R(ad62i), presADAreceipt:R(ada63i),
    capAD:R(_plCapAD(G(p("PersumptiveInc44AD.GrsTrnOverBank")),G(p("PersumptiveInc44AD.GrsTotalTrnOverInCash")),G(p("PersumptiveInc44AD.GrsTrnOverAnyOthMode")))),
    capADA:R(_plCapADA(G(p("PersumptiveInc44ADA.GrsTrnOverBank44ADA")),G(p("PersumptiveInc44ADA.GrsTotalTrnOverInCash44ADA")),G(p("PersumptiveInc44ADA.GrsTrnOverAnyOthMode44ADA")))),
    specTurnover:R(G(p("TurnverFrmSpecActivity"))), specNet:R(specNet),
    nrGross:R(nrGross), nrNet:R(nrNet),
    noBooksProfit:R(nbTot)                      /* 65 total */
  };
}

/* helper: does an object subtree carry any nonzero number / any array row? */
function _plHas(o){
  if(o==null)return false;
  if(Array.isArray(o))return o.length>0;
  if(typeof o==="object")return Object.keys(o).some(k=>_plHas(o[k]));
  if(typeof o==="number")return R(o)!==0;
  return st0(o)!=="";
}

/* ================================================================
   secPl — renderer. Three faces:
     (1) regular-books P&L (Manufacturing + Trading + items 13-61),
     (2) presumptive (62/63/64),
     (3) no-account / speculative / non-resident (65/66/67).
   Every live book row -> a field; every computed cell -> cell().
   No item is regime-closed (accounting figures are the same in both), so
   there is no isNew() gating anywhere here.
   ================================================================ */
function secPl(){
  const B=S.pl, V=p=>N(get("pl."+p));
  /* defensive: guarantee containers/arrays the renderer reads */
  _plFillMissing(B,_plState());
  const ri=(l,pth,ref,o)=>{o=o||{};return row(l,inp("pl."+pth,{n:1}),{ref:ref,ind:o.ind,hint:o.hint,req:o.req,cls:o.cls});};
  const rc=(l,pth,ref,o)=>{o=o||{};return row(l,cell(V(pth)),{ref:ref,ind:o.ind,cls:o.cls||"tot",hint:o.hint});};
  const rsel=(l,pth,opts,ref,o)=>{o=o||{};return row(l,sel("pl."+pth,opts,{blank:o.blank}),{ref:ref,req:o.req,hint:o.hint});};
  let h="";
  h+=formNote("Part A accounts are the business/profession statements. Fill the Manufacturing, "+
    "Trading and Profit &amp; Loss accounts where regular books are maintained (mandatory if liable "+
    "to audit u/s 44AB or 92E, or liable to maintain accounts u/s 44AA); otherwise use the "+
    "presumptive faces (62-64) or the no-account rows (65). These figures feed Schedule BP, which "+
    "computes the business head.");

  /* ---- Face 1a — Manufacturing Account (items 1-3) ---- */
  let m="";
  m+=sub("1 — Debits to the Manufacturing Account");
  m+=ri("Opening stock of raw material","mfg.OpeningInventory.OpngStckRawMat","1Ai");
  m+=ri("Opening stock of work in progress","mfg.OpeningInventory.OpngStckWrkinPrgrs","1Aii");
  m+=rc("Total opening inventory (i + ii)","mfg.OpeningInventory.OpngInvntryTotal","1Aiii");
  m+=ri("Purchases (net of refunds and duty or tax)","mfg.OpeningInventory.Purchases","1B");
  m+=ri("Direct wages","mfg.OpeningInventory.DirectWages","1C");
  m+=ri("Carriage inward","mfg.OpeningInventory.CarriageInward","1Di",{ind:1});
  m+=ri("Power and fuel","mfg.OpeningInventory.PowerAndFuel","1Dii",{ind:1});
  m+=ri("Other direct expenses","mfg.OpeningInventory.OthDirectExpenses","1Diii",{ind:1});
  m+=rc("Direct expenses (Di + Dii + Diii)","mfg.OpeningInventory.DirectExpenses","1D");
  m+=sub("1E — Factory overheads");
  m+=ri("Indirect wages","mfg.OpeningInventory.IndirectWages","1Ei",{ind:1});
  m+=ri("Factory rent and rates","mfg.OpeningInventory.FactoryRentAndRates","1Eii",{ind:1});
  m+=ri("Factory insurance","mfg.OpeningInventory.FactoryInsurance","1Eiii",{ind:1});
  m+=ri("Factory fuel and power","mfg.OpeningInventory.FactoryFuelAndPower","1Eiv",{ind:1});
  m+=ri("Factory general expenses","mfg.OpeningInventory.FactoryGeneralExpenses","1Ev",{ind:1});
  m+=ri("Depreciation of factory machinery","mfg.OpeningInventory.DeprctnOfFactoryMachinery","1Evi",{ind:1,hint:"feeds the BP depreciation cross-check"});
  m+=rc("Total factory overheads (i to vi)","mfg.OpeningInventory.TotalFactoryOverheads","1Evii");
  m+=rc("Total of debits to Manufacturing Account (Aiii + B + C + D + Evii)","mfg.OpeningInventory.TotalDebtsManfctrngAcc","1F");
  m+=sub("2 — Closing stock");
  m+=ri("Raw material","mfg.ClosingStock.ClsngStckRawMaterial","2i");
  m+=ri("Work-in-progress","mfg.ClosingStock.ClsngStckWrkInPrgrs","2ii");
  m+=rc("Total closing stock (2i + 2ii)","mfg.ClosingStock.ClsngStckTotal","2iii");
  m+=rc("Cost of goods produced — transferred to Trading Account (1F − 2)","mfg.CostOfGoodsPrdcd","3",{hint:"may be negative; feeds Trading item 11"});
  h+=fold("pl_mfg","1-3","Manufacturing Account (if a manufacturing account is maintained)",
    _plHas(B.mfg)?RS(V("mfg.CostOfGoodsPrdcd")):"if maintained",m);

  /* ---- Face 1b — Trading Account (items 4-12d) ---- */
  let t="";
  t+=sub("4 — Revenue from operations");
  t+=ri("Sale of goods","trd.SaleOfGoods","4A(i)");
  t+=ri("Sale of services","trd.SaleOfServices","4A(ii)");
  t+=grid("pl.trd.OtherOperatingRevenueDtls",[{k:"OperatingRevenueName",h:"Other operating revenue — nature",t:"txt",w:"auto",req:1,max:50},{k:"OperatingRevenueAmt",h:"Amount",t:"num",w:"150px",req:1}],
    B.trd.OtherOperatingRevenueDtls,{min:"560px",empty:"No other operating revenue.",add:"Add other operating revenue"});
  t+=rc("Total other operating revenues","trd.OperatingRevenueTotal","4A(iiic)");
  t+=rc("Total sales/gross receipts (i + ii + iiic)","trd.SalesGrossReceiptsTotal","4A(iv)");
  t+=ri("Gross receipts from profession","trd.GrossRcptFromProfession","4B");
  t+=sub("4C — Duties, taxes and cess received/receivable on goods and services sold");
  t+=ri("Union excise duties","trd.ExciseCustomsVAT.UnionExciseDuty","4C(i)",{ind:1});
  t+=ri("Service tax","trd.ExciseCustomsVAT.ServiceTax","4C(ii)",{ind:1});
  t+=ri("VAT / Sales tax","trd.ExciseCustomsVAT.VATorSaleTax","4C(iii)",{ind:1});
  t+=ri("Central GST (CGST)","trd.ExciseCustomsVAT.CentralGoodServiceTax","4C(iv)",{ind:1});
  t+=ri("State GST (SGST)","trd.ExciseCustomsVAT.StateGoodServiceTax","4C(v)",{ind:1});
  t+=ri("Integrated GST (IGST)","trd.ExciseCustomsVAT.IntegratedGoodServiceTax","4C(vi)",{ind:1});
  t+=ri("Union Territory GST (UTGST)","trd.ExciseCustomsVAT.UnionTerrGoodServiceTax","4C(vii)",{ind:1});
  t+=ri("Any other duty, tax and cess","trd.ExciseCustomsVAT.OthDutyTaxCess","4C(viii)",{ind:1});
  t+=rc("Total duties/taxes (i to viii)","trd.ExciseCustomsVAT.TotExciseCustomsVAT","4C(ix)");
  t+=rc("Total revenue from operations (Aiv + B + Cix)","trd.TotRevenueFrmOperations","4D");
  t+=ri("Closing stock of finished goods","trd.ClsngStckOfFinishedStcks","5");
  t+=rc("Total of credits to Trading Account (4D + 5)","trd.TardingAccTotCred","6");
  t+=sub("Debits to the Trading Account");
  t+=ri("Opening stock of finished goods","trd.OpngStckOfFinishedStcks","7");
  t+=ri("Purchases (net of refunds and duty or tax)","trd.Purchases","8");
  t+=ri("Carriage inward","trd.CarriageInward","9(i)",{ind:1});
  t+=ri("Power and fuel","trd.PowerAndFuel","9(ii)",{ind:1});
  t+=grid("pl.trd.OtherDirectExpenses",[{k:"NatureOfDirectExpense",h:"Other direct expenses — nature",t:"txt",w:"auto",req:1,max:125},{k:"Amount",h:"Amount",t:"num",w:"150px",req:1}],
    B.trd.OtherDirectExpenses,{min:"560px",empty:"No other direct expenses.",add:"Add other direct expense"});
  t+=rc("Total other direct expenses (9iii)","trd.DirectExpensesTotal","9(iii)");
  t+=rc("Direct Expenses (9i + 9ii + 9iii)","trd.DirectExpenses","9");
  t+=sub("10 — Duties and taxes paid or payable on goods and services purchased");
  t+=ri("Custom duty","trd.DutyTaxPay.ExciseCustomsVAT.CustomDuty","10(i)",{ind:1});
  t+=ri("Counter veiling duty","trd.DutyTaxPay.ExciseCustomsVAT.CounterVailDuty","10(ii)",{ind:1});
  t+=ri("Special additional duty","trd.DutyTaxPay.ExciseCustomsVAT.SplAddDuty","10(iii)",{ind:1});
  t+=ri("Union excise duty","trd.DutyTaxPay.ExciseCustomsVAT.UnionExciseDuty","10(iv)",{ind:1});
  t+=ri("Service tax","trd.DutyTaxPay.ExciseCustomsVAT.ServiceTax","10(v)",{ind:1});
  t+=ri("VAT / Sales tax","trd.DutyTaxPay.ExciseCustomsVAT.VATorSaleTax","10(vi)",{ind:1});
  t+=ri("Central GST (CGST)","trd.DutyTaxPay.ExciseCustomsVAT.CentralGoodServiceTax","10(vii)",{ind:1});
  t+=ri("State GST (SGST)","trd.DutyTaxPay.ExciseCustomsVAT.StateGoodServiceTax","10(viii)",{ind:1});
  t+=ri("Integrated GST (IGST)","trd.DutyTaxPay.ExciseCustomsVAT.IntegratedGoodServiceTax","10(ix)",{ind:1});
  t+=ri("Union Territory GST (UTGST)","trd.DutyTaxPay.ExciseCustomsVAT.UnionTerrGoodServiceTax","10(x)",{ind:1});
  t+=ri("Any other tax paid or payable","trd.DutyTaxPay.ExciseCustomsVAT.OthDutyTaxCess","10(xi)",{ind:1});
  t+=rc("Total duties/taxes on purchases (10i to 10xi)","trd.DutyTaxPay.ExciseCustomsVAT.TotExciseCustomsVAT","10(xii)");
  t+=rc("Cost of goods produced — transferred from Manufacturing Account","trd.GoodsCostPrdcdFrmMA","11",{hint:"= Manufacturing Account item 3"});
  t+=rc("Gross Profit from Business/Profession — transferred to P&amp;L","trd.GrossProfitFrmBusProf","12",{hint:"6 − 7 − 8 − 9 − 10xii − 11; may be negative"});
  t+=sub("Intraday and Futures &amp; Options");
  t+=ri("Turnover from intraday trading","trd.IntradayTradingTurnOver","12a");
  t+=ri("Income from intraday trading — transferred to P&amp;L","trd.IntradayTradingIncome","12b",{hint:"not more than 12a; feeds Schedule BP speculative"});
  t+=ri("Turnover from Futures &amp; Options trading","trd.TurnoverFutureTrd","12c");
  t+=ri("Income from Futures &amp; Options trading — transferred to P&amp;L","trd.IncomeFutureTrd","12d",{hint:"not more than 12c"});
  h+=fold("pl_trd","4-12d","Trading Account (if regular books are maintained)",
    _plHas(B.trd)?RS(V("trd.GrossProfitFrmBusProf")):"if maintained",t);

  /* ---- Face 1c — Profit & Loss regular books (items 13-61) ---- */
  h+=secPlRegular(B,V,ri,rc,rsel);
  /* ---- Face 2 — presumptive (62-64) ---- */
  h+=secPlPresumptive(B,V,ri,rc);
  /* ---- Face 3 — no-account / speculative / non-resident (65-67) ---- */
  h+=secPlOther(B,V,ri,rc);
  return h;
}

/* --- Face 1c: regular-books P&L (13-61) --- */
function secPlRegular(B,V,ri,rc,rsel){
  let h=""; const d="pl.DebitsToPL.DebitPlAcnt.";
  /* credits 13-15 */
  let c="";
  c+=rc("Gross profit transferred from Trading Account (12 + 12b + 12d)","pl.CreditsToPL.GrossProfitTrnsfFrmTrdAcc","13");
  c+=sub("14 — Other income");
  c+=ri("Rent","pl.CreditsToPL.OthIncome.RentInc","14i");
  c+=ri("Commission","pl.CreditsToPL.OthIncome.Comissions","14ii");
  c+=ri("Dividend income","pl.CreditsToPL.OthIncome.Dividends","14iii");
  c+=ri("Interest income","pl.CreditsToPL.OthIncome.InterestInc","14iv");
  c+=ri("Profit on sale of fixed assets","pl.CreditsToPL.OthIncome.ProfitOnSaleFixedAsset","14v");
  c+=ri("Profit on sale of investment (securities chargeable to STT)","pl.CreditsToPL.OthIncome.ProfitOnInvChrSTT","14vi");
  c+=ri("Profit on sale of other investment","pl.CreditsToPL.OthIncome.ProfitOnOthInv","14vii");
  c+=ri("Gain/(loss) on foreign exchange fluctuation u/s 43AA","pl.CreditsToPL.OthIncome.ProfitOnCurrFluct","14viii");
  c+=ri("Profit on conversion of inventory into capital asset u/s 28(via)","pl.CreditsToPL.OthIncome.ProfitOnCnvInvntryToCapAsst","14ix");
  c+=ri("Agricultural income","pl.CreditsToPL.OthIncome.ProfitOnAgriIncome","14x");
  c+=grid("pl.pl.CreditsToPL.OthIncome.OtherIncDtls",[{k:"NatureOfIncome",h:"Any other income — nature",t:"txt",w:"auto",req:1,max:50},{k:"Amount",h:"Amount",t:"num",w:"150px",req:1}],
    B.pl.CreditsToPL.OthIncome.OtherIncDtls,{min:"560px",empty:"No other income rows.",add:"Add other income"});
  c+=ri("Liabilities written back","pl.CreditsToPL.OthIncome.LiabilityWrittenBack","14xi(a)",{ind:1});
  c+=ri("Interest due/received from partnership firm","pl.CreditsToPL.OthIncome.AmtofInterest","14xi(b)",{ind:1});
  c+=rc("Any other income — total (14xi)","pl.CreditsToPL.OthIncome.MiscOthIncome","14xi");
  c+=rc("Total of other income (14i to 14xi)","pl.CreditsToPL.OthIncome.TotOthIncome","14xii");
  c+=rc("Total of credits to profit and loss account (13 + 14xii)","pl.CreditsToPL.TotCreditsToPL","15");
  h+=fold("pl_pl_cr","13-15","P&L — credits",_plHas(B.pl.CreditsToPL)?RS(V("pl.CreditsToPL.TotCreditsToPL")):"credits",c);

  /* debits 16-54 */
  let dd="";
  dd+=ri("Freight outward",d+"Freight","16");
  dd+=ri("Consumption of stores and spare parts",d+"ConsumptionOfStores","17");
  dd+=ri("Power and fuel",d+"PowerFuel","18");
  dd+=ri("Rents",d+"RentExpdr","19");
  dd+=ri("Repairs to building",d+"RepairsBldg","20");
  dd+=ri("Repairs to machinery",d+"RepairMach","21");
  dd+=sub("22 — Compensation to employees");
  dd+=ri("Salaries and wages",d+"EmployeeComp.SalsWages","22i",{ind:1});
  dd+=ri("Bonus",d+"EmployeeComp.Bonus","22ii",{ind:1});
  dd+=ri("Reimbursement of medical expenses",d+"EmployeeComp.MedExpReimb","22iii",{ind:1});
  dd+=ri("Leave encashment",d+"EmployeeComp.LeaveEncash","22iv",{ind:1});
  dd+=ri("Leave travel benefits",d+"EmployeeComp.LeaveTravelBenft","22v",{ind:1});
  dd+=ri("Contribution to approved superannuation fund",d+"EmployeeComp.ContToSuperAnnFund","22vi",{ind:1});
  dd+=ri("Contribution to recognised provident fund",d+"EmployeeComp.ContToPF","22vii",{ind:1});
  dd+=ri("Contribution to recognised gratuity fund",d+"EmployeeComp.ContToGratFund","22viii",{ind:1});
  dd+=ri("Contribution to any other fund",d+"EmployeeComp.ContToOthFund","22ix",{ind:1});
  dd+=ri("Any other benefit to employees",d+"EmployeeComp.OthEmpBenftExpdr","22x",{ind:1});
  dd+=rc("Total compensation to employees (22i to 22x)",d+"EmployeeComp.TotEmployeeComp","22xi");
  dd+=rsel("Any compensation (in 22xi) paid to non-residents?",d+"EmployeeComp.AnyCompPaidToNonRes",PL_YN,"22xii(a)");
  dd+=ri("If yes, amount paid to non-residents",d+"EmployeeComp.AmtPaidToNonRes","22xii(b)");
  dd+=sub("23 — Insurance");
  dd+=ri("Medical insurance",d+"Insurances.MedInsur","23i",{ind:1});
  dd+=ri("Life insurance",d+"Insurances.LifeInsur","23ii",{ind:1});
  dd+=ri("Keyman's insurance",d+"Insurances.KeyManInsur","23iii",{ind:1});
  dd+=ri("Other insurance (factory, office, car, goods, etc.)",d+"Insurances.OthInsur","23iv",{ind:1});
  dd+=rc("Total expenditure on insurance (23i to 23iv)",d+"Insurances.TotInsurances","23v");
  dd+=ri("Workmen and staff welfare expenses",d+"StaffWelfareExp","24");
  dd+=ri("Entertainment",d+"Entertainment","25");
  dd+=ri("Hospitality",d+"Hospitality","26");
  dd+=ri("Conference",d+"Conference","27");
  dd+=ri("Sales promotion including publicity (other than advertisement)",d+"SalePromoExp","28");
  dd+=ri("Advertisement",d+"Advertisement","29");
  const trip=(title,base,ref)=>sub(title)
    +ri("Paid outside India / to a non-resident (not a company or foreign company)",d+base+".NonResOtherCompany",ref+"i",{ind:1})
    +ri("To others",d+base+".Others",ref+"ii",{ind:1})
    +rc("Total ("+ref+"i + "+ref+"ii)",d+base+".Total",ref+"iii");
  dd+=trip("30 — Commission","CommissionExpdrDtls","30");
  dd+=trip("31 — Royalty","RoyalityDtls","31");
  dd+=trip("32 — Professional / consultancy / technical fees","ProfessionalConstDtls","32");
  dd+=ri("Hotel, boarding and lodging",d+"HotelBoardLodge","33");
  dd+=ri("Travelling expenses other than foreign travelling",d+"TravelExp","34");
  dd+=ri("Foreign travelling expenses",d+"ForeignTravelExp","35");
  dd+=ri("Conveyance expenses",d+"ConveyanceExp","36");
  dd+=ri("Telephone expenses",d+"TelephoneExp","37");
  dd+=ri("Guest house expenses",d+"GuestHouseExp","38");
  dd+=ri("Club expenses",d+"ClubExp","39");
  dd+=ri("Festival celebration expenses",d+"FestivalCelebExp","40");
  dd+=ri("Scholarship",d+"Scholarship","41");
  dd+=ri("Gift",d+"Gift","42");
  dd+=ri("Donation",d+"Donation","43");
  dd+=sub("44 — Rates and taxes paid/payable to Government or local body (excluding income tax)");
  const rt=d+"RatesTaxesPays.ExciseCustomsVAT.";
  dd+=ri("Union excise duty",rt+"UnionExciseDuty","44i",{ind:1});
  dd+=ri("Service tax",rt+"ServiceTax","44ii",{ind:1});
  dd+=ri("VAT / Sales tax",rt+"VATorSaleTax","44iii",{ind:1});
  dd+=ri("Cess",rt+"Cess","44iv",{ind:1});
  dd+=ri("Central GST (CGST)",rt+"CentralGoodServiceTax","44v",{ind:1});
  dd+=ri("State GST (SGST)",rt+"StateGoodServiceTax","44vi",{ind:1});
  dd+=ri("Integrated GST (IGST)",rt+"IntegratedGoodServiceTax","44vii",{ind:1});
  dd+=ri("Union Territory GST (UTGST)",rt+"UnionTerrGoodServiceTax","44viii",{ind:1});
  dd+=ri("Any other rate, tax, duty or cess (incl. STT and CTT)",rt+"OthDutyTaxCess","44ix",{ind:1});
  dd+=rc("Total rates and taxes paid or payable (44i to 44ix)",rt+"TotExciseCustomsVAT","44x");
  dd+=ri("Audit fee",d+"AuditFee","45");
  dd+=ri("Salary / remuneration to partners of the firm",d+"SalRemuneration","46",{hint:"only a firm may claim; with 64iii ties to Part A-General-2"});
  dd+=sub("47 — Other expenses");
  dd+=grid("pl.pl.DebitsToPL.DebitPlAcnt.OtherExpensesDtls",[{k:"ExpenseNature",h:"Nature",t:"txt",w:"auto",req:1,max:50},{k:"Amount",h:"Amount",t:"num",w:"150px",req:1}],
    B.pl.DebitsToPL.DebitPlAcnt.OtherExpensesDtls,{min:"560px",empty:"No other expenses.",add:"Add an expense"});
  dd+=rc("Total other expenses","pl.DebitsToPL.DebitPlAcnt.OtherExpenses","47");
  dd+=sub("48 — Bad debts (PAN/Aadhaar required where a single bad debt of Rs 1 lakh or more is claimed)");
  dd+=grid("pl.pl.DebitsToPL.DebitPlAcnt.BadDebtDtls.BadDebtAmtDtls",[{k:"PAN",h:"PAN",t:"txt",w:"120px",max:10},{k:"Aadhaar",h:"Aadhaar",t:"txt",w:"150px",max:12},{k:"Amount",h:"Amount",t:"num",w:"150px",req:1}],
    B.pl.DebitsToPL.DebitPlAcnt.BadDebtDtls.BadDebtAmtDtls,{min:"480px",empty:"No PAN/Aadhaar bad-debt rows.",add:"Add a bad debt (with PAN/Aadhaar)"});
  dd+=rc("Total bad debts with PAN/Aadhaar","pl.DebitsToPL.DebitPlAcnt.BadDebtDtls.BadDebtAmtDtlsTotal","48i");
  dd+=grid("pl.pl.DebitsToPL.DebitPlAcnt.BadDebtDtls.OthersPANNotAvlblDtl",[{k:"Name",h:"Name",t:"txt",w:"auto",req:1,max:75},{k:"FlatDoorBlockNumber",h:"Flat/Door/Block",t:"txt",w:"120px",req:1,max:50},{k:"PremisesBuildingName",h:"Premises/Building",t:"txt",w:"120px",max:50},{k:"RoadStreetPostOffice",h:"Road/Street/PO",t:"txt",w:"120px",max:50},{k:"AreaLocality",h:"Area/Locality",t:"txt",w:"120px",req:1,max:50},{k:"TownCityDistrict",h:"Town/City/District",t:"txt",w:"120px",req:1,max:50},{k:"StateCode",h:"State",t:"sel",w:"160px",req:1,opts:PL_BDSTATE},{k:"CountryCode",h:"Country",t:"sel",w:"170px",req:1,opts:PL_BDCTRY},{k:"PinCode",h:"PIN",t:"num",w:"90px"},{k:"ZipCode",h:"ZIP",t:"txt",w:"90px",max:6},{k:"Amount",h:"Amount",t:"num",w:"130px",req:1}],
    B.pl.DebitsToPL.DebitPlAcnt.BadDebtDtls.OthersPANNotAvlblDtl,{min:"1260px",empty:"No bad-debt rows without PAN.",add:"Add a bad debt (no PAN, > Rs 1 lakh)"});
  dd+=rc("Total bad debts (others, no PAN, > Rs 1 lakh)","pl.DebitsToPL.DebitPlAcnt.BadDebtDtls.OthersPANNotAvlblDtlTotal","48ii");
  dd+=ri("Others (aggregate per person less than Rs 1 lakh)",d+"BadDebtDtls.OthersAmtLt1Lakh","48iii");
  dd+=rc("Total bad debt (48i + 48ii + 48iii)","pl.DebitsToPL.DebitPlAcnt.BadDebtDtls.BadDebt","48iv");
  dd+=ri("Provision for bad and doubtful debts",d+"ProvForBadDoubtDebt","49");
  dd+=ri("Other provisions",d+"OthProvisionsExpdr","50");
  dd+=rc("Profit before interest, depreciation and taxes","pl.DebitsToPL.DebitPlAcnt.PBIDTA","51");
  dd+=sub("52 — Interest");
  dd+=ri("Paid outside India / to a non-resident — to partners",d+"InterestExpdrtDtls.NonResOtherCompany","52i(a)",{ind:1});
  dd+=ri("Paid outside India / to a non-resident — to others",d+"InterestExpdrtDtls.Others","52i(b)",{ind:1});
  dd+=ri("Paid in India / to a resident — to partners",d+"InterestExpdrtDtls.ResPartners","52ii(a)",{ind:1});
  dd+=ri("Paid in India / to a resident — to others",d+"InterestExpdrtDtls.ResOthers","52ii(b)",{ind:1});
  dd+=rc("Total interest (52i + 52ii)",d+"InterestExpdrtDtls.InterestExpdr","52iii");
  dd+=ri("Depreciation and amortization",d+"DepreciationAmort","53",{hint:"include amortisation; feeds Schedule BP Sl.No.11"});
  dd+=rc("Net profit before taxes (51 − 52iii − 53)","pl.DebitsToPL.DebitPlAcnt.PBT","54");
  h+=fold("pl_pl_dr","16-54","P&L — debits and net profit",_plHas(B.pl.DebitsToPL.DebitPlAcnt)?RS(V("pl.DebitsToPL.DebitPlAcnt.PBT")):"debits",dd);

  /* provisions for tax and appropriations 55-61 */
  const tp="pl.DebitsToPL.TaxProvAppr.";
  let ap="";
  ap+=ri("Provision for current tax",tp+"ProvForCurrTax","55");
  ap+=ri("Provision for deferred tax",tp+"ProvDefTax","56");
  ap+=rc("Profit after tax (54 − 55 − 56)",tp+"ProfitAfterTax","57");
  ap+=ri("Balance brought forward from previous year",tp+"BalBFPrevYr","58");
  ap+=rc("Amount available for appropriation (57 + 58)",tp+"AmtAvlAppr","59");
  ap+=ri("Transferred to reserves and surplus",tp+"Appropriations.TrfToReserves","60");
  ap+=rc("Balance carried to balance sheet in partners' account (59 − 60)",tp+"PartnerAccBalTrf","61");
  h+=fold("pl_pl_ap","55-61","P&L — provisions for tax and appropriations",_plHas(B.pl.DebitsToPL.TaxProvAppr)?"filled":"if any",ap);

  return fold("pl_pl","13-61","Profit and Loss Account (if regular books are maintained)",
    _plHas(B.pl.CreditsToPL)||_plHas(B.pl.DebitsToPL)?RS(V("pl.DebitsToPL.DebitPlAcnt.PBT")):"if maintained",h,{def:false});
}

/* --- Face 2: presumptive income 62/63/64 --- */
function secPlPresumptive(B,V,ri,rc){
  let pr="";
  pr+=note("Presumptive faces are for a Resident Partnership Firm (other than an LLP) declaring "+
    "income u/s 44AD / 44ADA, and for any assessee u/s 44AE (goods carriage). Selecting a business "+
    "code makes declaring that section's income mandatory.");
  /* 44AD (62) */
  pr+=sub("62 — Presumptive business income under section 44AD");
  pr+=grid("pl.pl.NatOfBus44AD",[{k:"NameOfBusiness",h:"Name of business",t:"txt",w:"auto",req:1,max:75},{k:"CodeAD",h:"Business code",t:"sel",w:"320px",req:1,opts:PL_CODEAD},{k:"Description",h:"Description",t:"txt",w:"auto",max:75}],
    B.pl.NatOfBus44AD,{min:"780px",empty:"No 44AD business.",add:"Add a 44AD business"});
  pr+=ri("Through a/c payee cheque/draft/ECS or other prescribed electronic mode","pl.PersumptiveInc44AD.GrsTrnOverBank","62iA",{ind:1});
  pr+=ri("Receipts in cash","pl.PersumptiveInc44AD.GrsTotalTrnOverInCash","62iB",{ind:1});
  pr+=ri("Any mode other than A and B","pl.PersumptiveInc44AD.GrsTrnOverAnyOthMode","62iC",{ind:1});
  pr+=rc("Gross turnover or gross receipts (iA + iB + iC)","pl.PersumptiveInc44AD.GrsTrnOverOrReceipt","62i",{hint:"cap Rs 2 cr (Rs 3 cr if cash+other <= 5%)"});
  pr+=ri("6% of 62iA, or the amount actually earned, whichever is higher","pl.PersumptiveInc44AD.PersumptiveInc44AD6Per","62iiA",{ind:1});
  pr+=ri("8% of (62iB + 62iC), or the amount actually earned, whichever is higher","pl.PersumptiveInc44AD.PersumptiveInc44AD8Per","62iiB",{ind:1});
  pr+=rc("Presumptive income under section 44AD (iiA + iiB)","pl.PersumptiveInc44AD.TotPersumptiveInc44AD","62ii");
  /* 44ADA (63) */
  pr+=sub("63 — Presumptive professional income under section 44ADA");
  pr+=grid("pl.pl.NatOfBus44ADA",[{k:"NameOfBusiness",h:"Name of business/profession",t:"txt",w:"auto",req:1,max:75},{k:"CodeADA",h:"Business code",t:"sel",w:"320px",req:1,opts:PL_CODEADA},{k:"Description",h:"Description",t:"txt",w:"auto",max:75}],
    B.pl.NatOfBus44ADA,{min:"780px",empty:"No 44ADA profession.",add:"Add a 44ADA profession"});
  pr+=ri("Through a/c payee cheque/draft/ECS or prescribed electronic mode","pl.PersumptiveInc44ADA.GrsTrnOverBank44ADA","63iA",{ind:1});
  pr+=ri("Receipts in cash","pl.PersumptiveInc44ADA.GrsTotalTrnOverInCash44ADA","63iB",{ind:1});
  pr+=ri("Any mode other than A and B","pl.PersumptiveInc44ADA.GrsTrnOverAnyOthMode44ADA","63iC",{ind:1});
  pr+=rc("Gross receipts (iA + iB + iC)","pl.PersumptiveInc44ADA.GrsReceipt","63i",{hint:"cap Rs 50 L (Rs 75 L if cash+other <= 5%)"});
  pr+=ri("Presumptive income u/s 44ADA (50% of 63i, or amount earned, whichever higher)","pl.PersumptiveInc44ADA.TotPersumptiveInc44ADA","63ii");
  /* 44AE (64) */
  pr+=sub("64 — Presumptive income from goods carriages under section 44AE");
  pr+=grid("pl.pl.NatOfBus44AE",[{k:"NameOfBusiness",h:"Name of business",t:"txt",w:"auto",req:1,max:75},{k:"CodeAE",h:"Business code",t:"sel",w:"320px",req:1,opts:PL_CODEAE},{k:"Description",h:"Description",t:"txt",w:"auto",max:75}],
    B.pl.NatOfBus44AE,{min:"780px",empty:"No 44AE business.",add:"Add a 44AE business"});
  pr+=grid("pl.pl.GoodsDtlsUs44AE",[{k:"RegNumberGoodsCarriage",h:"Registration No.",t:"txt",w:"150px",req:1,max:11},{k:"OwnedLeasedHiredFlag",h:"Owned/leased/hired",t:"sel",w:"160px",req:1,opts:PL_OWNFLAG},{k:"TonnageCapacity",h:"Tonnage (MT)",t:"num",w:"110px",req:1},{k:"HoldingPeriod",h:"Months",t:"num",w:"90px",req:1},{k:"PresumptiveIncome",h:"Presumptive income",t:"calc",w:"150px",f:r=>{const t=N(r.TonnageCapacity),m=N(r.HoldingPeriod);return t>12?Math.round(1000*t*m):Math.round(7500*m);}}],
    B.pl.GoodsDtlsUs44AE,{min:"700px",empty:"No goods carriage.",add:"Add a goods carriage",foot:[{l:1,v:"Total months / income",span:3},{v:V("pl.TotalNumOfMonths")},{v:V("pl.TotalPrsumptvIncGCUs44E")}]});
  pr+=rc("Total presumptive income from goods carriage u/s 44AE (col 5 total)","pl.TotalPrsumptvIncGCUs44E","64ii");
  pr+=ri("Less: Salary / remuneration to partners of the firm","pl.SalRemrtnToPartnerFirm","64iii",{hint:"can be > 0 only if 64ii > 0"});
  pr+=rc("Total Presumptive Income u/s 44AE (64ii − 64iii)","pl.TotalPrsumptvIncUs44E","64iv");
  return fold("pl_pres","62-64","Presumptive income (44AD / 44ADA / 44AE)",
    (V("pl.PersumptiveInc44AD.TotPersumptiveInc44AD")+V("pl.PersumptiveInc44ADA.TotPersumptiveInc44ADA")+V("pl.TotalPrsumptvIncUs44E"))
      ?RS(V("pl.PersumptiveInc44AD.TotPersumptiveInc44AD")+V("pl.PersumptiveInc44ADA.TotPersumptiveInc44ADA")+V("pl.TotalPrsumptvIncUs44E"))
      :"if presumptive",pr,{def:false});
}

/* --- Face 3: no-account / speculative / non-resident 65/66/67 --- */
function secPlOther(B,V,ri,rc){
  let nb="";
  nb+=sub("65 — No account case (if regular books of account are not maintained)");
  nb+=note("(i) For an assessee carrying on Business.");
  nb+=ri("Gross receipts through a/c payee cheque/draft/ECS or prescribed electronic mode","pl.NoBooksOfAccPL.GrsRcptAccPayeeOrBankMode","65(i)a(i)",{ind:1});
  nb+=ri("Gross receipts, any other mode","pl.NoBooksOfAccPL.GrsRcptOtherMode","65(i)a(ii)",{ind:1});
  nb+=rc("Business — gross receipts (a i + a ii)","pl.NoBooksOfAccPL.GrossReceipt","65(i)a");
  nb+=ri("Business — gross profit","pl.NoBooksOfAccPL.GrossProfit","65(i)b",{hint:"not more than 65(i)a"});
  nb+=ri("Business — expenses","pl.NoBooksOfAccPL.Expenses","65(i)c");
  nb+=rc("Business — net profit (65(i)b − 65(i)c)","pl.NoBooksOfAccPL.NetProfit","65(i)d");
  nb+=note("(ii) For an assessee carrying on Profession.");
  nb+=ri("Gross receipts through a/c payee cheque/draft/ECS or prescribed electronic mode","pl.NoBooksOfAccPL.GrsRcptAccPayeeOrBankModePrf","65(ii)a(i)",{ind:1});
  nb+=ri("Gross receipts, any other mode","pl.NoBooksOfAccPL.GrsRcptOtherModePrf","65(ii)a(ii)",{ind:1});
  nb+=rc("Profession — gross receipts (a i + a ii)","pl.NoBooksOfAccPL.GrossReceiptPrf","65(ii)a");
  nb+=ri("Profession — gross profit","pl.NoBooksOfAccPL.GrossProfitPrf","65(ii)b",{hint:"not more than 65(ii)a"});
  nb+=ri("Profession — expenses","pl.NoBooksOfAccPL.ExpensesPrf","65(ii)c");
  nb+=rc("Profession — net profit (65(ii)b − 65(ii)c)","pl.NoBooksOfAccPL.NetProfitPrf","65(ii)d");
  nb+=rc("Total profit (65(i)d + 65(ii)d)","pl.NoBooksOfAccPL.TotBusinessProfession","65");
  nb+=sub("66 — Speculative activity");
  nb+=ri("Turnover from speculative activity","pl.TurnverFrmSpecActivity","66(i)",{req:1});
  nb+=ri("Gross profit","pl.GrossProfit","66(ii)");
  nb+=ri("Expenditure, if any","pl.Expenditure","66(iii)");
  nb+=rc("Net income from speculative activity (66ii − 66iii)","pl.NetIncomeFrmSpecActivity","66(iv)");
  nb+=sub("67 — Non-resident, sections 44B / 44BB / 44BBA / 44BBC / 44BBD");
  nb+=grid("pl.pl.NonResidentPLDetails",[{k:"Section",h:"Section",t:"sel",w:"140px",req:1,opts:PL_NRSEC},{k:"GrossReceipt",h:"Gross receipts/turnover",t:"num",w:"190px"},{k:"NetProfit",h:"Net profit",t:"num",w:"160px"}],
    B.pl.NonResidentPLDetails,{min:"540px",empty:"No non-resident presumptive rows.",add:"Add a non-resident section",foot:[{l:1,v:"Totals (67a / 67b)",span:1},{v:V("pl.NonResidentPL.GrossReceipt")},{v:V("pl.NonResidentPL.NetProfit")}]});
  return fold("pl_other","65-67","No-account case, speculative and non-resident",
    (_plHas(B.pl.NoBooksOfAccPL)||V("pl.NetIncomeFrmSpecActivity")||V("pl.TurnverFrmSpecActivity")||B.pl.NonResidentPLDetails.length)?"filled":"if any",nb,{def:false});
}

/* ================================================================
   expPl — write ManufacturingAccount / TradingAccount / PARTA_PL onto j
   with put(). Each block is built from S.pl (computed totals already
   written back by engPl), coerced by key, then merged onto its required
   skeleton so every required leaf is present; the whole block is put()
   at its root path.
   ================================================================ */
const PL_STR=["OperatingRevenueName","NatureOfDirectExpense","NatureOfIncome","ExpenseNature",
  "AnyCompPaidToNonRes","PAN","Aadhaar","Name","FlatDoorBlockNumber","PremisesBuildingName",
  "RoadStreetPostOffice","AreaLocality","TownCityDistrict","StateCode","CountryCode","ZipCode",
  "NameOfBusiness","CodeAD","CodeADA","CodeAE","Description","RegNumberGoodsCarriage",
  "OwnedLeasedHiredFlag","Section"];
function _plLeaf(k,v){
  if(PL_STR.indexOf(k)>=0){const s=st0(v);return s||undefined;}   /* string leaf */
  return R(N(v));                                                  /* integer leaf */
}
function _plNode(o){                        /* coerce an object subtree; drop empty */
  const out={};
  for(const k in o){const v=o[k];
    if(Array.isArray(v)){const rows=v.map(_plNode).filter(r=>r&&Object.keys(r).length);if(rows.length)out[k]=rows;}
    else if(v&&typeof v==="object"){const sub=_plNode(v);if(sub&&Object.keys(sub).length)out[k]=sub;}
    else{const cv=_plLeaf(k,v);if(cv!==undefined&&cv!==0)out[k]=cv;} }
  return out;
}
function _plMerge(t,s){                       /* merge coerced values over a skeleton */
  for(const k in s){
    if(Array.isArray(s[k]))t[k]=s[k];
    else if(s[k]&&typeof s[k]==="object"){if(typeof t[k]!=="object"||!t[k]||Array.isArray(t[k]))t[k]={};_plMerge(t[k],s[k]);}
    else t[k]=s[k];}
  return t;
}
/* required-leaf skeletons (computed totals that must always be present when
   the optional block is emitted) — from the * leaves in tools/dump --leaves */
const PL_MFG_REQ={OpeningInventory:{OpngInvntryTotal:0,DirectExpenses:0,TotalFactoryOverheads:0,TotalDebtsManfctrngAcc:0},ClosingStock:{ClsngStckTotal:0},CostOfGoodsPrdcd:0};
const PL_TRD_REQ={OperatingRevenueTotal:0,TotRevenueFrmOperations:0,TardingAccTotCred:0,DirectExpensesTotal:0,GrossProfitFrmBusProf:0,ExciseCustomsVAT:{TotExciseCustomsVAT:0},DutyTaxPay:{ExciseCustomsVAT:{TotExciseCustomsVAT:0}}};
function expPl(j){
  const B=S.pl;
  if(_plHas(B.mfg)) put(j,"ManufacturingAccount",_plMerge(deep(PL_MFG_REQ),_plNode(B.mfg)));
  if(_plHas(B.trd)) put(j,"TradingAccount",_plMerge(deep(PL_TRD_REQ),_plNode(B.trd)));
  /* PARTA_PL is a required block; merge onto the SKEL skeleton so every
     required leaf is present, then replace j.PARTA_PL wholesale. */
  put(j,"PARTA_PL",_plMerge(deep(SKEL.PARTA_PL),_plNode(B.pl)));
}

/* ================================================================
   impPl — read the three blocks back into S.pl, then re-establish the
   default skeleton so every container/array the renderer reads exists.
   ================================================================ */
function _plFillMissing(dst,def){
  for(const k in def){
    if(dst[k]===undefined||dst[k]===null){dst[k]=deep(def[k]);}
    else if(def[k]&&typeof def[k]==="object"&&!Array.isArray(def[k])&&typeof dst[k]==="object"&&!Array.isArray(dst[k]))_plFillMissing(dst[k],def[k]);
  }
}
function impPl(I5){
  const got=[];
  if(I5&&I5.ManufacturingAccount){S.pl.mfg=deep(I5.ManufacturingAccount);got.push("Manufacturing Account");}
  if(I5&&I5.TradingAccount){S.pl.trd=deep(I5.TradingAccount);got.push("Trading Account");}
  if(I5&&I5.PARTA_PL){S.pl.pl=deep(I5.PARTA_PL);got.push("Profit & Loss");}
  _plFillMissing(S.pl,_plState());
  return got;
}

/* ================================================================
   chkPl — the sheet's own rules as live messages (from the books /
   rules.json). {lvl,t,m,sec}.
   ================================================================ */
function chkPl(){
  const out=[], B=S.pl, V=p=>N(get("pl."+p)), C=S.C.pl||{};
  /* Manufacturing / Trading: no negatives in item 1/2 (Mfg) and everywhere but 11/12/12b/12d (Trading) */
  const mNeg=["mfg.OpeningInventory.OpngStckRawMat","mfg.OpeningInventory.OpngStckWrkinPrgrs","mfg.OpeningInventory.Purchases","mfg.OpeningInventory.DirectWages","mfg.OpeningInventory.CarriageInward","mfg.OpeningInventory.PowerAndFuel","mfg.OpeningInventory.OthDirectExpenses","mfg.OpeningInventory.IndirectWages","mfg.OpeningInventory.FactoryRentAndRates","mfg.OpeningInventory.FactoryInsurance","mfg.OpeningInventory.FactoryFuelAndPower","mfg.OpeningInventory.FactoryGeneralExpenses","mfg.OpeningInventory.DeprctnOfFactoryMachinery","mfg.ClosingStock.ClsngStckRawMaterial","mfg.ClosingStock.ClsngStckWrkInPrgrs"];
  if(mNeg.some(k=>V(k)<0))
    out.push({lvl:"err",t:"Negative value in Manufacturing Account",m:"Negative values are not allowed in Manufacturing Account items 1 and 2.",sec:"pl"});
  /* Trading 12b<=12a, 12d<=12c */
  if(V("trd.IntradayTradingIncome")>V("trd.IntradayTradingTurnOver"))
    out.push({lvl:"warn",t:"Intraday income exceeds turnover",m:"Item 12b (income from intraday trading) cannot exceed item 12a (turnover).",sec:"pl"});
  if(V("trd.IncomeFutureTrd")>V("trd.TurnoverFutureTrd"))
    out.push({lvl:"warn",t:"F&O income exceeds turnover",m:"Item 12d (income from Futures & Options) cannot exceed item 12c (turnover).",sec:"pl"});
  /* 22xii(a) Yes -> 22xii(b) != 0 (rule n=112) */
  if(st0(get("pl.pl.DebitsToPL.DebitPlAcnt.EmployeeComp.AnyCompPaidToNonRes"))==="Yes" && !V("pl.DebitsToPL.DebitPlAcnt.EmployeeComp.AmtPaidToNonRes"))
    out.push({lvl:"err",t:"Non-resident compensation amount missing",m:"22xii(a) is 'Yes', so the amount of compensation paid to non-residents (22xii b) must be entered.",sec:"pl"});
  /* Presumptive: selecting a code makes that section's income mandatory */
  if((B.pl.NatOfBus44AD||[]).some(r=>st0(r.CodeAD)) && !V("pl.PersumptiveInc44AD.TotPersumptiveInc44AD"))
    out.push({lvl:"err",t:"44AD income missing",m:"A 44AD business code is selected, so presumptive income u/s 44AD (62ii) must be declared.",sec:"pl"});
  if((B.pl.NatOfBus44ADA||[]).some(r=>st0(r.CodeADA)) && !V("pl.PersumptiveInc44ADA.TotPersumptiveInc44ADA"))
    out.push({lvl:"err",t:"44ADA income missing",m:"A 44ADA business code is selected, so presumptive income u/s 44ADA (63ii) must be declared.",sec:"pl"});
  if((B.pl.NatOfBus44AE||[]).some(r=>st0(r.CodeAE)) && !V("pl.TotalPrsumptvIncUs44E"))
    out.push({lvl:"err",t:"44AE income missing",m:"A 44AE business code is selected, so presumptive income u/s 44AE (64iv) must be declared.",sec:"pl"});
  /* 44AD minimum-rate floors (rules n=130/131) and turnover cap (n=169/171) */
  if(V("pl.PersumptiveInc44AD.PersumptiveInc44AD6Per")<Math.round(0.06*V("pl.PersumptiveInc44AD.GrsTrnOverBank")))
    out.push({lvl:"warn",t:"44AD 62iiA below 6%",m:"Presumptive income at 62iiA should be at least 6% of the bank/electronic-mode turnover (62iA).",sec:"pl"});
  if(V("pl.PersumptiveInc44AD.PersumptiveInc44AD8Per")<Math.round(0.08*(V("pl.PersumptiveInc44AD.GrsTotalTrnOverInCash")+V("pl.PersumptiveInc44AD.GrsTrnOverAnyOthMode"))))
    out.push({lvl:"warn",t:"44AD 62iiB below 8%",m:"Presumptive income at 62iiB should be at least 8% of (62iB + 62iC).",sec:"pl"});
  if(V("pl.PersumptiveInc44AD.GrsTrnOverOrReceipt")>C.capAD)
    out.push({lvl:"warn",t:"44AD turnover above cap",m:"Gross turnover u/s 44AD exceeds the applicable cap ("+RS(C.capAD)+") — tax audit u/s 44AB is mandatory.",sec:"pl"});
  /* 44ADA 50% floor (n=134) and cap (n=168/170) */
  if(V("pl.PersumptiveInc44ADA.TotPersumptiveInc44ADA")<Math.round(0.5*V("pl.PersumptiveInc44ADA.GrsReceipt")))
    out.push({lvl:"warn",t:"44ADA income below 50%",m:"Presumptive income u/s 44ADA (63ii) should be at least 50% of gross receipts (63i).",sec:"pl"});
  if(V("pl.PersumptiveInc44ADA.GrsReceipt")>C.capADA)
    out.push({lvl:"warn",t:"44ADA receipts above cap",m:"Gross receipts u/s 44ADA exceed the applicable cap ("+RS(C.capADA)+") — tax audit is mandatory.",sec:"pl"});
  /* 44AE: total months <=120 (n=147); >10 carriages bars 44AE; reg number unique (n=163) */
  if(V("pl.TotalNumOfMonths")>120)
    out.push({lvl:"err",t:"44AE months exceed 120",m:"Total number of months of goods carriages (column 4) cannot exceed 120.",sec:"pl"});
  if((B.pl.GoodsDtlsUs44AE||[]).length>10)
    out.push({lvl:"warn",t:"More than 10 goods carriages",m:"Owning/leasing/hiring more than 10 goods carriages bars 44AE — maintain books and get them audited.",sec:"pl"});
  const regs=(B.pl.GoodsDtlsUs44AE||[]).map(r=>st0(r.RegNumberGoodsCarriage)).filter(Boolean);
  if(new Set(regs).size<regs.length)
    out.push({lvl:"err",t:"Duplicate goods-carriage registration",m:"Registration number of a goods carriage must not repeat (item 64i).",sec:"pl"});
  /* 64iii can be > 0 only if 64ii > 0 (n=161) */
  if(V("pl.SalRemrtnToPartnerFirm")>0 && !V("pl.TotalPrsumptvIncGCUs44E"))
    out.push({lvl:"err",t:"64iii without 64ii",m:"Salary/remuneration to partners (64iii) can be greater than zero only if presumptive income u/s 44AE (64ii) is greater than zero.",sec:"pl"});
  /* No-account gross profit must not exceed gross receipts (n=155/156) */
  if(V("pl.NoBooksOfAccPL.GrossProfit")>V("pl.NoBooksOfAccPL.GrossReceipt"))
    out.push({lvl:"warn",t:"65(i) gross profit exceeds receipts",m:"Business gross profit (65(i)b) cannot exceed gross receipts (65(i)a).",sec:"pl"});
  if(V("pl.NoBooksOfAccPL.GrossProfitPrf")>V("pl.NoBooksOfAccPL.GrossReceiptPrf"))
    out.push({lvl:"warn",t:"65(ii) gross profit exceeds receipts",m:"Profession gross profit (65(ii)b) cannot exceed gross receipts (65(ii)a).",sec:"pl"});
  /* Bad debts: PAN/Aadhaar mandatory where amount filled (n=162); name+address where no PAN and >Rs 1 lakh (n=179) */
  (B.pl.DebitsToPL.DebitPlAcnt.BadDebtDtls.BadDebtAmtDtls||[]).forEach((r,i)=>{
    if(N(r.Amount)>0 && !st0(r.PAN) && !st0(r.Aadhaar))
      out.push({lvl:"err",t:"Bad-debt PAN/Aadhaar missing",m:"48(i) row "+(i+1)+": PAN or Aadhaar is mandatory when a bad-debt amount is claimed.",sec:"pl"});});
  (B.pl.DebitsToPL.DebitPlAcnt.BadDebtDtls.OthersPANNotAvlblDtl||[]).forEach((r,i)=>{
    if(N(r.Amount)>100000 && (!st0(r.Name)||!st0(r.FlatDoorBlockNumber)||!st0(r.TownCityDistrict)))
      out.push({lvl:"err",t:"Bad-debt name/address missing",m:"48(ii) row "+(i+1)+": name and complete address are mandatory where PAN/Aadhaar is absent and the amount exceeds Rs 1 lakh.",sec:"pl"});});
  /* speculative: turnover required if net income declared (n=160 / required leaf) */
  if(V("pl.NetIncomeFrmSpecActivity") && !V("pl.TurnverFrmSpecActivity"))
    out.push({lvl:"warn",t:"Speculative turnover missing",m:"Turnover from speculative activity (66i) is required when speculative income is declared.",sec:"pl"});
  return out;
}

/* ================================================================ */
reg({id:"pl", t:"Manufacturing / Trading / P&L", ref:"Mfg · Trading · Part A - P&L",
  f:secPl, s:()=>{const C=S.C.pl||{};
    if(C.pbt) return RS(C.pbt)+" net profit";
    const pr=(C.presAD||0)+(C.presADA||0)+(C.presAE||0);
    if(pr) return RS(pr)+" presumptive";
    if(C.noBooksProfit) return RS(C.noBooksProfit)+" (no books)";
    if(C.specNet) return RS(C.specNet)+" speculative";
    return "";},
  eng:engPl, exp:expPl, imp:impPl, chk:chkPl, order:20});
