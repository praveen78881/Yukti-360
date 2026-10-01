/* =====================================================================
   ITR-6 · Section "gen" — Company particulars (Part A - General (2))
   Books: books/ITR-6/GENERAL2.md · books/ITR-6/NATURE_OF_BUSINESS.md
   Sheets owned: GENERAL2 · NATURE OF BUSINESS (plus the AUDIT INFORMATION
   region that DISPLAYS on the PART A - GENERAL sheet but whose schema keys
   are the leading fields of PartA_GEN2For6 — this builder owns and exports
   those; the `who` builder / PartA_GEN1 does not, see the notes).
   Schema block OWNED (export + import): PartA_GEN2For6 — the whole block:
     · audit information (LiableSec44AAflg / IncDclrdUs / turnover band /
       cash %s / LiableSec44ABflg / AuditedByAccountantFlg / AuditInfo.* /
       LiableSec92Eflg / AccountAuditFlag / AuditDetails92E.* /
       AuditDetails[] / AuditReportDetails[]);
     · holding status + holding/subsidiary company tables;
     · business organisation (amalgamation / demerger);
     · key persons; 10%+ shareholders; ultimate beneficial owners;
     · foreign-company immediate / ultimate parents;
     · the eight nature-of-company flags;
     · nature-of-business codes.
   NOT owned here: FilingStatus.Cndnfor44AB and FilingStatus.ifMSME stay in
   PartA_GEN1 (the `who` builder), per the integration notes.
   Compute order: 6 (disclosure face; contributes nothing to GTI).

   SOURCE NOTES resolved (reported to the CEO):
   - The block PartA_GEN2For6 spans three display sheets (PART A - GENERAL,
     GENERAL2, NATURE OF BUSINESS) but exports into one object; this builder
     renders and serialises all of it.
   - enums.json's country labels (CountryCode / CountryOfResidence) are
     SCRAMBLED (e.g. code 55 labelled "ALBANIA" though it is BRAZIL); the
     code SET is correct and matches GENERAL2.md exactly (250 codes). The
     clean country labels below are taken from the book, not enums.json.
     StateCode (38) and NOBCode (356) are taken clean from enums.json.
   ===================================================================== */

/* ---- dropdown value lists ---------------------------------------------
   Small enums verbatim from books/ITR-6/enums.json (values) with the
   book's clean labels. GEN_STATE (38), GEN_NOB (356) from enums.json;
   GEN_COUNTRY (250) from GENERAL2.md (enums.json labels are corrupted). */
const GEN_YN=[["Y","Yes"],["N","No"]];
const GEN_NATFLG=[["1","1 - Holding company"],["2","2 - Subsidiary company"],["3","3 - Both"],["4","4 - If any other"]];  /* HoldingStatus.NatOfCompFlg */
const GEN_SALES=[["Upto1CR","Up to Rs. 1 crore"],["Upto10CR","More than Rs. 1 crore and up to Rs. 10 crores"],["MoreThan10CR","More than Rs. 10 crores"]];  /* TotalSalesExcOneCr */
const GEN_PCT=[["Upto5Per","Up to 5%"],["MoreThan5Per","More than 5%"]];  /* AgrOFAllAmtsRcvd / AgrOFAllPayMade */
const GEN_BUSORG=[["AMALGAMATING","Amalgamating"],["AMALGAMATED","Amalgamated"],["DEMERGED","Demerged"],["RESULTING","Resulting"]];  /* BusOrganisation[].BusOrgType */
const GEN_DESIG=[["MD","MD - Managing Director"],["DIR","DIR - Director"],["SEC","SEC - Secretary"],["CEO","CEO - Chief Executive Officer"],["CFO","CFO - Chief Financial Officer"],["MGR","MGR - Manager"],["OPO","OPO - Any other Principal Officer"]];  /* KeyPersons[].Designation */
const GEN_AUDSEC=[["10AA","10AA"],["10(4D)","10(4D)"],["10(23FF)","10(23FF)"],["44DA","44DA"],["50B","50B"],["80-IA","80-IA"],["80-IAB","80-IAB"],["80-IAC","80-IAC"],["80-IB","80-IB"],["80-IC","80-IC"],["80-ID","80-ID"],["80-IE","80-IE"],["80JJAA","80JJAA"],["80LA","80LA"],["115JB","115JB"],["115VW","115VW"],["33AB","33AB"],["33ABA","33ABA"],["10TIA","10TIA"],["OTH","OTH - Any other"]];  /* AuditDetails[].AuditedSection */
const GEN_AUDACT=[["1","Banking Regulation Act, 1949"],["2","Central Excise Act, 1944"],["3","Central Sales Tax Act, 1956"],["4","Central Goods and Services Tax Act, 2017"],["5","Charitable And Religious Trusts Act, 1920"],["6","Companies Act, 2013"],["7","Electricity Act, 2003"],["8","Employees Provident Fund and Miscellaneous Provisions Act, 1952"],["9","Foreign Exchange Management Act, 1999"],["10","Government Superannuation Fund Act, 1956"],["12","Integrated Goods and Services Tax Act, 2017"],["14","Payment of Gratuity Act, 1972"],["15","SEBI Act, 1992"],["16","Securities Contract (Regulation) Act, 1956"],["17","State Goods and Services Tax Act, 2017"],["18","Union Territories Goods and Services Tax Act, 2017"],["19","Others"]];  /* AuditReportDetails[].AuditReportAct */

const GEN_STATE=[["01","Andaman and Nicobar islands"],["02","Andhra Pradesh"],["03","Arunachal Pradesh"],["04","Assam"],["05","Bihar"],["06","Chandigarh"],["07","Dadra Nagar and Haveli"],["08","Daman and Diu"],["09","Delhi"],["10","Goa"],["11","Gujarat"],["12","Haryana"],["13","Himachal Pradesh"],["14","Jammu and Kashmir"],["15","Karnataka"],["16","Kerala"],["17","Lakshadweep"],["18","Madhya Pradesh"],["19","Maharashtra"],["20","Manipur"],["21","Meghalaya"],["22","Mizoram"],["23","Nagaland"],["24","Odisha"],["25","Puducherry"],["26","Punjab"],["27","Rajasthan"],["28","Sikkim"],["29","Tamil Nadu"],["30","Tripura"],["31","Uttar Pradesh"],["32","West Bengal"],["33","Chhattisgarh"],["34","Uttarakhand"],["35","Jharkhand"],["36","Telangana"],["37","Ladakh"],["99","Foreign"]];

const GEN_COUNTRY=[["93","AFGHANISTAN"],["1001","ALAND ISLANDS"],["355","ALBANIA"],["213","ALGERIA"],["684","AMERICAN SAMOA"],["376","ANDORRA"],["244","ANGOLA"],["1264","ANGUILLA"],["1010","ANTARCTICA"],["1268","ANTIGUA AND BARBUDA"],["54","ARGENTINA"],["374","ARMENIA"],["297","ARUBA"],["61","AUSTRALIA"],["43","AUSTRIA"],["994","AZERBAIJAN"],["1242","BAHAMAS"],["973","BAHRAIN"],["880","BANGLADESH"],["1246","BARBADOS"],["375","BELARUS"],["32","BELGIUM"],["501","BELIZE"],["229","BENIN"],["1441","BERMUDA"],["975","BHUTAN"],["591","BOLIVIA (PLURINATIONAL STATE OF)"],["1002","BONAIRE, SINT EUSTATIUS AND SABA"],["387","BOSNIA AND HERZEGOVINA"],["267","BOTSWANA"],["1003","BOUVET ISLAND"],["55","BRAZIL"],["1014","BRITISH INDIAN OCEAN TERRITORY"],["673","BRUNEI DARUSSALAM"],["359","BULGARIA"],["226","BURKINA FASO"],["257","BURUNDI"],["238","CABO VERDE"],["855","CAMBODIA"],["237","CAMEROON"],["1","CANADA"],["1345","CAYMAN ISLANDS"],["236","CENTRAL AFRICAN REPUBLIC"],["235","CHAD"],["56","CHILE"],["86","CHINA"],["9","CHRISTMAS ISLAND"],["672","COCOS (KEELING) ISLANDS"],["57","COLOMBIA"],["270","COMOROS"],["242","CONGO"],["243","CONGO (DEMOCRATIC REPUBLIC OF THE)"],["682","COOK ISLANDS"],["506","COSTA RICA"],["225","COTE DIVOIRE"],["385","CROATIA"],["53","CUBA"],["1015","CURACAO"],["357","CYPRUS"],["420","CZECHIA"],["45","DENMARK"],["253","DJIBOUTI"],["1767","DOMINICA"],["1809","DOMINICAN REPUBLIC"],["593","ECUADOR"],["20","EGYPT"],["503","EL SALVADOR"],["240","EQUATORIAL GUINEA"],["291","ERITREA"],["372","ESTONIA"],["251","ETHIOPIA"],["500","FALKLAND ISLANDS (MALVINAS)"],["298","FAROE ISLANDS"],["679","FIJI"],["358","FINLAND"],["33","FRANCE"],["594","FRENCH GUIANA"],["689","FRENCH POLYNESIA"],["1004","FRENCH SOUTHERN TERRITORIES"],["241","GABON"],["220","GAMBIA"],["995","GEORGIA"],["49","GERMANY"],["233","GHANA"],["350","GIBRALTAR"],["30","GREECE"],["299","GREENLAND"],["1473","GRENADA"],["590","GUADELOUPE"],["1671","GUAM"],["502","GUATEMALA"],["1481","GUERNSEY"],["224","GUINEA"],["245","GUINEA-BISSAU"],["592","GUYANA"],["509","HAITI"],["1005","HEARD ISLAND AND MCDONALD ISLANDS"],["6","HOLY SEE"],["504","HONDURAS"],["852","HONG KONG"],["36","HUNGARY"],["354","ICELAND"],["91","INDIA"],["62","INDONESIA"],["98","IRAN (ISLAMIC REPUBLIC OF)"],["964","IRAQ"],["353","IRELAND"],["1624","ISLE OF MAN"],["972","ISRAEL"],["5","ITALY"],["1876","JAMAICA"],["81","JAPAN"],["1534","JERSEY"],["962","JORDAN"],["7","KAZAKHSTAN"],["254","KENYA"],["686","KIRIBATI"],["850","KOREA (DEMOCRATIC PEOPLES REPUBLIC OF)"],["82","KOREA (REPUBLIC OF)"],["965","KUWAIT"],["996","KYRGYZSTAN"],["856","LAO PEOPLES DEMOCRATIC REPUBLIC"],["371","LATVIA"],["961","LEBANON"],["266","LESOTHO"],["231","LIBERIA"],["218","LIBYA"],["423","LIECHTENSTEIN"],["370","LITHUANIA"],["352","LUXEMBOURG"],["853","MACAO"],["389","MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)"],["261","MADAGASCAR"],["265","MALAWI"],["60","MALAYSIA"],["960","MALDIVES"],["223","MALI"],["356","MALTA"],["692","MARSHALL ISLANDS"],["596","MARTINIQUE"],["222","MAURITANIA"],["230","MAURITIUS"],["269","MAYOTTE"],["52","MEXICO"],["691","MICRONESIA (FEDERATED STATES OF)"],["373","MOLDOVA (REPUBLIC OF)"],["377","MONACO"],["976","MONGOLIA"],["382","MONTENEGRO"],["1664","MONTSERRAT"],["212","MOROCCO"],["258","MOZAMBIQUE"],["95","MYANMAR"],["264","NAMIBIA"],["674","NAURU"],["977","NEPAL"],["31","NETHERLANDS"],["687","NEW CALEDONIA"],["64","NEW ZEALAND"],["505","NICARAGUA"],["227","NIGER"],["234","NIGERIA"],["683","NIUE"],["15","NORFOLK ISLAND"],["1670","NORTHERN MARIANA ISLANDS"],["47","NORWAY"],["968","OMAN"],["92","PAKISTAN"],["680","PALAU"],["970","PALESTINE, STATE OF"],["507","PANAMA"],["675","PAPUA NEW GUINEA"],["595","PARAGUAY"],["51","PERU"],["63","PHILIPPINES"],["1011","PITCAIRN"],["48","POLAND"],["14","PORTUGAL"],["1787","PUERTO RICO"],["974","QATAR"],["262","REUNION"],["40","ROMANIA"],["8","RUSSIAN FEDERATION"],["250","RWANDA"],["1006","SAINT BARTHELEMY"],["290","SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA"],["1869","SAINT KITTS AND NEVIS"],["1758","SAINT LUCIA"],["1007","SAINT MARTIN (FRENCH PART)"],["508","SAINT PIERRE AND MIQUELON"],["1784","SAINT VINCENT AND THE GRENADINES"],["685","SAMOA"],["378","SAN MARINO"],["239","SAO TOME AND PRINCIPE"],["966","SAUDI ARABIA"],["221","SENEGAL"],["381","SERBIA"],["248","SEYCHELLES"],["232","SIERRA LEONE"],["65","SINGAPORE"],["1721","SINT MAARTEN (DUTCH PART)"],["421","SLOVAKIA"],["386","SLOVENIA"],["677","SOLOMON ISLANDS"],["252","SOMALIA"],["28","SOUTH AFRICA"],["1008","SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS"],["211","SOUTH SUDAN"],["35","SPAIN"],["94","SRI LANKA"],["249","SUDAN"],["597","SURINAME"],["1012","SVALBARD AND JAN MAYEN"],["268","SWAZILAND"],["46","SWEDEN"],["41","SWITZERLAND"],["963","SYRIAN ARAB REPUBLIC"],["886","TAIWAN"],["992","TAJIKISTAN"],["255","TANZANIA, UNITED REPUBLIC OF"],["66","THAILAND"],["670","TIMOR-LESTE(EAST TIMOR)"],["228","TOGO"],["690","TOKELAU"],["676","TONGA"],["1868","TRINIDAD AND TOBAGO"],["216","TUNISIA"],["90","TURKEY"],["993","TURKMENISTAN"],["1649","TURKS AND CAICOS ISLANDS"],["688","TUVALU"],["256","UGANDA"],["380","UKRAINE"],["971","UNITED ARAB EMIRATES"],["44","UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND"],["2","UNITED STATES OF AMERICA"],["1009","UNITED STATES MINOR OUTLYING ISLANDS"],["598","URUGUAY"],["998","UZBEKISTAN"],["678","VANUATU"],["58","VENEZUELA (BOLIVARIAN REPUBLIC OF)"],["84","VIET NAM"],["1284","VIRGIN ISLANDS (BRITISH)"],["1340","VIRGIN ISLANDS (U.S.)"],["681","WALLIS AND FUTUNA"],["1013","WESTERN SAHARA"],["967","YEMEN"],["260","ZAMBIA"],["263","ZIMBABWE"],["9999","OTHERS"]];

const GEN_NOB=[["01001","Growing and manufacturing of tea"],["01002","Growing and manufacturing of coffee"],["01003","Growing and manufacturing of rubber"],["01004","Market gardening and horticulture specialties"],["01005","Raising of silk worms and production of silk"],["01006","Raising of bees and production of honey"],["01007","Raising of poultry and production of eggs"],["01008","Rearing of sheep and production of wool"],["01009","Rearing of animals and production of animal products"],["01010","Agricultural and animal husbandry services"],["01011","Soil conservation, soil testing and soil desalination services"],["01012","Hunting, trapping and game propagation services"],["01013","Growing of timber, plantation, operation of tree nurseries and conserving of forest"],["01014","Gathering of tendu leaves"],["01015","Gathering of other wild growing materials"],["01016","Forestry service activities, timber cruising, afforestation and reforestation"],["01017","Logging service activities, transport of logs within the forest"],["01018","Other agriculture, animal husbandry or forestry activity n.e.c"],["02001","Fishing on commercial basis in inland waters"],["02002","Fishing on commercial basis in ocean and coastal areas"],["02003","Fish farming"],["02004","Gathering of marine materials such as natural pearls, sponges, coral etc."],["02005","Services related to marine and fresh water fisheries, fish hatcheries and fish farms"],["02006","Other Fish farming activity n.e.c"],["03001","Mining and agglomeration of hard coal"],["03002","Mining and agglomeration of lignite"],["03003","Extraction and agglomeration of peat"],["03004","Extraction of crude petroleum and natural gas"],["03005","Service activities incidental to oil and gas extraction excluding surveying"],["03006","Mining of uranium and thorium ores"],["03007","Mining of iron ores"],["03008","Mining of non-ferrous metal ores, except uranium and thorium ores"],["03009","Mining of gemstones"],["03010","Mining of chemical and fertilizer minerals"],["03011","Mining of quarrying of abrasive materials"],["03012","Mining of mica, graphite and asbestos"],["03013","Quarrying of stones (marble/granite/dolomite), sand and clay"],["03014","Other mining and quarrying"],["03015","Mining and production of salt"],["03016","Other mining and quarrying n.e.c"],["04001","Production, processing and preservation of meat and meat products"],["04002","Production, processing and preservation of fish and fish products"],["04003","Manufacture of vegetable oil, animal oil and fats"],["04004","Processing of fruits, vegetables and edible nuts"],["04005","Manufacture of dairy products"],["04006","Manufacture of sugar"],["04007","Manufacture of cocoa, chocolates and sugar confectionery"],["04008","Flour milling"],["04009","Rice milling"],["04010","Dal milling"],["04011","Manufacture of other grain mill products"],["04012","Manufacture of bakery products"],["04013","Manufacture of starch products"],["04014","Manufacture of animal feeds"],["04015","Manufacture of other food products"],["04016","Manufacturing of wines"],["04017","Manufacture of beer"],["04018","Manufacture of malt liquors"],["04019","Distilling and blending of spirits, production of ethyl alcohol"],["04020","Manufacture of mineral water"],["04021","Manufacture of soft drinks"],["04022","Manufacture of other non-alcoholic beverages"],["04023","Manufacture of tobacco products"],["04024","Manufacture of textiles (other than by handloom)"],["04025","Manufacture of textiles using handlooms (khadi)"],["04026","Manufacture of carpet, rugs, blankets, shawls etc. (other than by hand)"],["04027","Manufacture of carpet, rugs, blankets, shawls etc. by hand"],["04028","Manufacture of wearing apparel"],["04029","Tanning and dressing of leather"],["04030","Manufacture of luggage, handbags and the like saddler and harness"],["04031","Manufacture of footwear"],["04032","Manufacture of wood and wood products, cork, straw and plaiting material"],["04033","Manufacture of paper and paper products"],["04034","Publishing, printing and reproduction of recorded media"],["04035","Manufacture of coke oven products"],["04036","Manufacture of refined petroleum products"],["04037","Processing of nuclear fuel"],["04038","Manufacture of fertilizers and nitrogen compounds"],["04039","Manufacture of plastics in primary forms and of synthetic rubber"],["04040","Manufacture of paints, varnishes and similar coatings"],["04041","Manufacture of pharmaceuticals, medicinal chemicals and botanical products"],["04042","Manufacture of soap and detergents"],["04043","Manufacture of other chemical products"],["04044","Manufacture of man-made fibers"],["04045","Manufacture of rubber products"],["04046","Manufacture of plastic products"],["04047","Manufacture of glass and glass products"],["04048","Manufacture of cement, lime and plaster"],["04049","Manufacture of articles of concrete, cement and plaster"],["04050","Manufacture of Bricks"],["04051","Manufacture of other clay and ceramic products"],["04052","Manufacture of other non-metallic mineral products"],["04053","Manufacture of pig iron, sponge iron, Direct Reduced Iron etc."],["04054","Manufacture of Ferro alloys"],["04055","Manufacture of Ingots, billets, blooms and slabs etc."],["04056","Manufacture of steel products"],["04057","Manufacture of basic precious and non-ferrous metals"],["04058","Manufacture of non-metallic mineral products"],["04059","Casting of metals"],["04060","Manufacture of fabricated metal products"],["04061","Manufacture of engines and turbines"],["04062","Manufacture of pumps and compressors"],["04063","Manufacture of bearings and gears"],["04064","Manufacture of ovens and furnaces"],["04065","Manufacture of lifting and handling equipment"],["04066","Manufacture of other general purpose machinery"],["04067","Manufacture of agricultural and forestry machinery"],["04068","Manufacture of Machine Tools"],["04069","Manufacture of machinery for metallurgy"],["04070","Manufacture of machinery for mining, quarrying and constructions"],["04071","Manufacture of machinery for processing of food and beverages"],["04072","Manufacture of machinery for leather and textile"],["04073","Manufacture of weapons and ammunition"],["04074","Manufacture of other special purpose machinery"],["04075","Manufacture of domestic appliances"],["04076","Manufacture of office, accounting and computing machinery"],["04077","Manufacture of electrical machinery and apparatus"],["04078","Manufacture of Radio, Television, communication equipment and apparatus"],["04079","Manufacture of medical and surgical equipment"],["04080","Manufacture of industrial process control equipment"],["04081","Manufacture of instruments and appliances for measurements and navigation"],["04082","Manufacture of optical instruments"],["04083","Manufacture of watches and clocks"],["04084","Manufacture of motor vehicles"],["04085","Manufacture of body of motor vehicles"],["04086","Manufacture of parts and accessories of motor vehicles and engines"],["04087","Building and repair of ships and boats"],["04088","Manufacture of railway locomotive and rolling stocks"],["04089","Manufacture of aircraft and spacecraft"],["04090","Manufacture of bicycles"],["04091","Manufacture of other transport equipment"],["04092","Manufacture of furniture"],["04093","Manufacture of jewellery"],["04094","Manufacture of sports goods"],["04095","Manufacture of musical instruments"],["04096","Manufacture of games and toys"],["04097","Other manufacturing n.e.c."],["04098","Recycling of metal waste and scrap"],["04099","Recycling of non- metal waste and scrap"],["05001","Production, collection and distribution of electricity"],["05002","Manufacture and distribution of gas"],["05003","Collection, purification and distribution of water"],["05004","Other essential commodity service n.e.c"],["06001","Site preparation works"],["06002","Building of complete constructions or parts- civil contractors"],["06003","Building installation"],["06004","Building completion"],["06005","Construction and maintenance of roads, rails, bridges, tunnels, ports, harbour, runways etc."],["06006","Construction and maintenance of power plants"],["06007","Construction and maintenance of industrial plants"],["06008","Construction and maintenance of power transmission and telecommunication lines"],["06009","Construction of water ways and water reservoirs"],["06010","Other construction activity n.e.c."],["07001","Purchase, sale and letting of leased buildings (residential and non-residential)"],["07002","Operating of real estate of self-owned buildings (residential and non-residential)"],["07003","Developing and sub-dividing real estate into lots"],["07004","Real estate activities on a fee or contract basis"],["07005","Other real estate/renting services n.e.c"],["08001","Renting of land transport equipment"],["08002","Renting of water transport equipment"],["08003","Renting of air transport equipment"],["08004","Renting of agricultural machinery and equipment"],["08005","Renting of construction and civil engineering machinery"],["08006","Renting of office machinery and equipment"],["08007","Renting of other machinery and equipment n.e.c."],["08008","Renting of personal and household goods n.e.c."],["08009","Renting of other machinery n.e.c."],["09001","Wholesale and retail sale of motor vehicles"],["09002","Repair and maintenance of motor vehicles"],["09003","Sale of motor parts and accessories- wholesale and retail"],["09004","Retail sale of automotive fuel"],["09005","General commission agents, commodity brokers and auctioneers"],["09006","Wholesale of agricultural raw material"],["09007","Wholesale of food and beverages and tobacco"],["09008","Wholesale of household goods"],["09009","Wholesale of metals and metal ores"],["09010","Wholesale of household goods"],["09011","Wholesale of construction material"],["09012","Wholesale of hardware and sanitary fittings"],["09013","Wholesale of cotton and jute"],["09014","Wholesale of raw wool and raw silk"],["09015","Wholesale of other textile fibres"],["09016","Wholesale of industrial chemicals"],["09017","Wholesale of fertilizers and pesticides"],["09018","Wholesale of electronic parts and equipment"],["09019","Wholesale of other machinery, equipment and supplies"],["09020","Wholesale of waste, scrap and materials for re-cycling"],["09021","Retail sale of food, beverages and tobacco in specialized stores"],["09022","Retail sale of other goods in specialized stores"],["09023","Retail sale in non-specialized stores"],["09024","Retail sale of textiles, apparel, footwear, leather goods"],["09025","Retail sale of other household appliances"],["09026","Retail sale of hardware, paint and glass"],["09027","Wholesale of other products n.e.c"],["09028","Retail sale of other products n.e.c"],["09029","Commission agents - Kachcha Arahtia"],["10001","Hotels Star rated"],["10002","Hotels Non-star rated"],["10003","Motels, Inns and Dharmshalas"],["10004","Guest houses and circuit houses"],["10005","Dormitories and hostels at educational institutions"],["10006","Short stay accommodations n.e.c."],["10007","Restaurants with bars"],["10008","Restaurants without bars"],["10009","Canteens"],["10010","Independent caterers"],["10011","Casinos and other games of chance"],["10012","Other hospitality services n.e.c."],["11001","Travel agencies and tour operators"],["11002","Packers and movers"],["11003","Passenger land transport"],["11004","Air transport"],["11005","Transport by urban/sub-urban railways"],["11006","Inland water transport"],["11007","Sea and coastal water transport"],["11008","Freight transport by road"],["11009","Freight transport by railways"],["11010","Forwarding of freight"],["11011","Receiving and acceptance of freight"],["11012","Cargo handling"],["11013","Storage and warehousing"],["11014","Transport via pipelines (transport of gases, liquids, slurry and other commodities)"],["11015","Other Transport and Logistics services n.e.c"],["12001","Post and courier activities"],["12002","Basic telecom services"],["12003","Value added telecom services"],["12004","Maintenance of telecom network"],["12005","Activities of the cable operators"],["12006","Other Post and Telecommunication services n.e.c"],["13001","Commercial banks, saving banks and discount houses"],["13002","Specialised institutions granting credit"],["13003","Financial leasing"],["13004","Hire-purchase financing"],["13005","Housing finance activities"],["13006","Commercial loan activities"],["13007","Credit cards"],["13008","Mutual funds"],["13009","Chit fund"],["13010","Investment activities"],["13011","Life insurance"],["13012","Pension funding"],["13013","Non-life insurance"],["13014","Administration of financial markets"],["13015","Stock brokers, sub-brokers and related activities"],["13016","Financial advisers, mortgage advisers and brokers"],["13017","Foreign exchange services"],["13018","Other financial intermediation services n.e.c."],["14001","Software development"],["14002","Other software consultancy"],["14003","Data processing"],["14004","Database activities and distribution of electronic content"],["14005","Other IT enabled services"],["14006","BPO services"],["14007","Cyber cafe"],["14008","Maintenance and repair of office, accounting and computing machinery"],["14009","Computer training and educational institutes"],["14010","Other computation related services n.e.c."],["15001","Natural sciences and engineering"],["15002","Social sciences and humanities"],["15003","Other Research and Development activities n.e.c."],["16001","Legal profession"],["16002","Accounting, book-keeping and auditing profession"],["16003","Tax consultancy"],["16004","Architectural profession"],["16005","Engineering and technical consultancy"],["16006","Advertising"],["16007","Fashion designing"],["16008","Interior decoration"],["16009","Photography"],["16010","Auctioneers"],["16011","Business brokerage"],["16012","Market research and public opinion polling"],["16013","Business and management consultancy activities"],["16014","Labour recruitment and provision of personnel"],["16015","Investigation and security services"],["16016","Building-cleaning and industrial cleaning activities"],["16017","Packaging activities"],["16018","Secretarial activities"],["16019","Other professional services n.e.c."],["16019_1","Medical Profession"],["16020","Film Artist"],["16021","Social Media Influencers"],["17001","Primary education"],["17002","Secondary/ senior secondary education"],["17003","Technical and vocational secondary/ senior secondary education"],["17004","Higher education"],["17005","Education by correspondence"],["17006","Coaching centres and tuitions"],["17007","Other education services n.e.c."],["18001","General hospitals"],["18002","Speciality and super speciality hospitals"],["18003","Nursing homes"],["18004","Diagnostic centres"],["18005","Pathological laboratories"],["18006","Independent blood banks"],["18007","Medical transcription"],["18008","Independent ambulance services"],["18009","Medical suppliers, agencies and stores"],["18010","Medical clinics"],["18011","Dental practice"],["18012","Ayurveda practice"],["18013","Unani practice"],["18014","Homeopathy practice"],["18015","Nurses, physiotherapists or other para-medical practitioners"],["18016","Veterinary hospitals and practice"],["18017","Medical education"],["18018","Medical research"],["18019","Practice of other alternative medicine"],["18020","Other healthcare services"],["19001","Social work activities with accommodation (orphanages and old age homes)"],["19002","Social work activities without accommodation (Creches)"],["19003","Industry associations, chambers of commerce"],["19004","Professional organisations"],["19005","Trade unions"],["19006","Religious organizations"],["19007","Political organisations"],["19008","Other membership organisations n.e.c. (rotary clubs, book clubs and philatelic clubs)"],["19009","Other Social or community service n.e.c"],["20001","Motion picture production"],["20002","Film distribution"],["20003","Film laboratories"],["20004","Television channel productions"],["20005","Television channels broadcast"],["20006","Video production and distribution"],["20007","Sound recording studios"],["20008","Radio - recording and distribution"],["20009","Stage production and related activities"],["20010","Individual artists excluding authors"],["20011","Literary activities"],["20012","Other cultural activities n.e.c."],["20013","Circuses and race tracks"],["20014","Video Parlours"],["20015","News agency activities"],["20016","Library and archives activities"],["20017","Museum activities"],["20018","Preservation of historical sites and buildings"],["20019","Botanical and zoological gardens"],["20020","Operation and maintenance of sports facilities"],["20021","Activities of sports and game schools"],["20022","Organisation and operation of indoor/outdoor sports and promotion and production of sporting events"],["20023","Other sporting activities n.e.c."],["20023_1","Sports Management"],["20024","Other recreational activities n.e.c."],["21001","Hair dressing and other beauty treatment"],["21002","Funeral and related activities"],["21003","Marriage bureaus"],["21004","Pet care services"],["21005","Sauna and steam baths, massage salons etc."],["21006","Astrological and spiritualists activities"],["21007","Private households as employers of domestic staff"],["21008","Other services n.e.c."],["21008_1","Event Management"],["21009","Speculative Trading"],["21010","Futures and Options trading"],["21011","Buying and selling of shares"],["22001","Extra territorial organisations and bodies (IMF, World Bank, European Commission etc.)"]];

/* address columns reused by every table (AddressDetailWithZipCode) */
const GEN_ADDR_COLS=[
  {h:"Address",k:"addr",t:"txt",req:1,max:250},
  {h:"Town / City",k:"city",t:"txt",req:1,max:50},
  {h:"State",k:"state",t:"sel",opts:GEN_STATE,req:1},
  {h:"Country",k:"country",t:"sel",opts:GEN_COUNTRY,req:1},
  {h:"PIN",k:"pin",t:"txt",max:6},
  {h:"ZIP",k:"zip",t:"txt",max:10}
];

/* ---- state (disclosure face; guarded so it never throws on empty) ---- */
S.gen = S.gen || {};
S.gen.aud    = S.gen.aud || {};
S.gen.hold   = S.gen.hold || {};
S.gen.nat    = S.gen.nat || {};
S.gen.busorg = S.gen.busorg || [];
S.gen.keyp   = S.gen.keyp || [];
S.gen.shr    = S.gen.shr || [];
S.gen.own    = S.gen.own || [];
S.gen.frnImm = S.gen.frnImm || [];
S.gen.frnUlt = S.gen.frnUlt || [];
S.gen.nob    = S.gen.nob || [];
S.gen.hold.holding = S.gen.hold.holding || [];
S.gen.hold.subsid  = S.gen.hold.subsid || [];
S.gen.aud.oth = S.gen.aud.oth || [];
S.gen.aud.act = S.gen.aud.act || [];
/* required Y/N flags default to "N" (schema-required leaves) */
(function(){const A=S.gen.aud;
  if(A.sec44AA===undefined)   A.sec44AA="N";     /* LiableSec44AAflg */
  if(A.incDclrdUs===undefined) A.incDclrdUs="N"; /* IncDclrdUs (whether presumptive-only) */
  if(A.sec44AB===undefined)   A.sec44AB="N";     /* LiableSec44ABflg */
  if(A.sec92E===undefined)    A.sec92E="N";      /* LiableSec92Eflg */
  const NC=S.gen.nat;
  ["pubSect","rbi","gov40","bank","schedBank","irda","nbfi","unlisted"].forEach(k=>{if(NC[k]===undefined)NC[k]="N";});
})();

/* =====================================================================
   ENGINE — engGen(): disclosure only. Contributes nothing to GTI, but
   publishes the cross-section scalars other sections read (book §13):
   CompanyUnlistedFlag gates SH-1/AL-1; nature-of-business codes gate
   80PA / rule-7&8 income / power-sector depreciation; 92E liability moves
   the 139(1) due date to 30 Nov (read by the tax/interest engine).
   ===================================================================== */
function engGen(){
  const C = S.C.gen = { income:0 };
  const A = (S.gen&&S.gen.aud)||{}, NC=(S.gen&&S.gen.nat)||{};
  C.foreign    = !!(S.pi && S.pi.domestic==="N");
  C.unlisted   = NC.unlisted==="Y";                 /* -> SH-1 / AL-1 gate (al) */
  C.liable44AA = A.sec44AA==="Y";
  C.liable44AB = A.sec44AB==="Y";                    /* -> BS/P&L not blank (A42); due date */
  C.liable92E  = A.sec92E==="Y";                     /* -> due date 30 Nov (A33/A34); Form 3CEB */
  /* derived 44AB liability from turnover + cash %s (A27/A28/A29/A36) —
     advisory only; the department rules are Phase 6. */
  C.auto44AB = (A.salesBand==="MoreThan10CR") ||
    (A.salesBand==="Upto10CR" && (A.pctRcvd==="MoreThan5Per" || A.pctPaid==="MoreThan5Per"));
  C.nobCodes = ((S.gen&&S.gen.nob)||[]).map(r=>r&&r.code).filter(Boolean);  /* -> bp/ded gating */
  C.income = 0;
}

/* =====================================================================
   RENDERER — secGen(): every live row of GENERAL2 + the audit region of
   PART A - GENERAL + NATURE OF BUSINESS. Company-particulars disclosure.
   ===================================================================== */
function secGen(){
  const A = S.gen.aud, H=S.gen.hold, NC=S.gen.nat;
  let h="";

  h+=note("<b>Company particulars.</b> These schedules identify the company, its group, its people and its owners, and its audit position. They add nothing to total income. Every date is <b>DD/MM/YYYY</b>. The audit rows below are displayed by the utility on the PART A - GENERAL sheet, but their fields belong to this block (PartA_GEN2For6).");

  /* ===================== A · Audit information ===================== */
  h+=sub("Audit information (sections 44AA / 44AB / 92E and other Acts)");
  h+=row("a1 · Whether liable to maintain accounts as per section 44AA?",
    sel("gen.aud.sec44AA",GEN_YN,{blank:false}),{req:1,ref:"LiableSec44AAflg"});
  h+=row("a2 · Whether declaring income only under section 44AE/44B/44BB/44BBA/44BBB/44BBC/44BBD/44D?",
    sel("gen.aud.incDclrdUs",GEN_YN,{blank:false}),{req:1,ref:"IncDclrdUs"});
  h+=row("a2i · Range of total sales / turnover / gross receipts of business",
    sel("gen.aud.salesBand",GEN_SALES),{ref:"TotalSalesExcOneCr"});
  if(A.salesBand==="Upto10CR"){
    h+=row("a2ii · Percentage of amounts received in cash & non-a/c-payee cheque/draft out of aggregate receipts",
      sel("gen.aud.pctRcvd",GEN_PCT),{ref:"AgrOFAllAmtsRcvd",hint:"more than 5% ⇒ liable u/s 44AB (A27/A36)"});
    h+=row("a2iii · Percentage of payments made in cash & non-a/c-payee cheque/draft out of aggregate payments",
      sel("gen.aud.pctPaid",GEN_PCT),{ref:"AgrOFAllPayMade",hint:"more than 5% ⇒ liable u/s 44AB (A28/A29)"});
  }
  h+=row("b · Whether liable for audit under section 44AB?",
    sel("gen.aud.sec44AB",GEN_YN,{blank:false}),{req:1,ref:"LiableSec44ABflg"});
  if(S.C.gen&&S.C.gen.auto44AB&&A.sec44AB!=="Y")
    h+=note("The turnover band and cash percentages entered point to a tax-audit liability under section 44AB (rules A27/A28/A29/A36). Set b to Yes unless an exception applies.","warn");
  if(A.sec44AB==="Y"){
    h+=row("c · If liable u/s 44AB, whether the accounts have been audited by an accountant?",
      sel("gen.aud.acctFlg",GEN_YN,{blank:false}),{req:1,ref:"AuditedByAccountantFlg"});
    if(A.acctFlg==="Y"){
      h+=card("audfrm","Auditor and audit report (section 44AB)","Furnished",
        row("Date of furnishing of the audit report",dte("gen.aud.repDate"),{req:1,ref:"AuditInfo.AuditReportFurnishDate",hint:"cannot be after today (A8)"})+
        row("Acknowledgement number of the audit report",inp("gen.aud.repAck",{n:1,max:15}),{req:1,ref:"AuditInfo.AckNum44AB"})+
        row("Name of the auditor (proprietorship / firm)",inp("gen.aud.frmName",{max:125}),{ref:"AuditInfo.AudFrmName"})+
        row("PAN of the auditor (proprietorship / firm)",inp("gen.aud.frmPAN",{max:10}),{req:1,ref:"AuditInfo.AudFrmPAN",hint:"firm's PAN or proprietor's PAN"}));
    }
  }
  h+=row("di · Are you liable for audit under section 92E?",
    sel("gen.aud.sec92E",GEN_YN,{blank:false}),{req:1,ref:"LiableSec92Eflg",hint:"transfer pricing — Form 3CEB (D1); due date 30 Nov (A33/A34)"});
  if(A.sec92E==="Y"){
    h+=row("dii · If (di) is Yes, whether the accounts have been audited u/s 92E?",
      sel("gen.aud.acct92E",GEN_YN,{blank:false}),{req:1,ref:"AccountAuditFlag"});
    if(A.acct92E==="Y"){
      h+=row("dii · Date of furnishing of the 92E audit report",dte("gen.aud.date92E"),{req:1,ref:"AuditDetails92E.DateOfAudit"});
      h+=row("dii · Acknowledgement number (92E)",inp("gen.aud.ack92E",{n:1,max:15}),{ref:"AuditDetails92E.AckNum92E"});
    }
  }
  h+=sub("diii · Other audit reports under the Income-tax Act");
  h+=grid("gen.aud.oth",[
    {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
    {h:"Section code",k:"sec",t:"sel",opts:GEN_AUDSEC,req:1},
    {h:"Other section (if OTH)",k:"otherSec",t:"txt",max:10},
    {h:"Report furnished?",k:"flag",t:"sel",opts:GEN_YN},
    {h:"Date",k:"date",t:"date"},
    {h:"Acknowledgement no.",k:"ack",t:"num"}
  ],S.gen.aud.oth,{min:"760px",add:"Add an audit report",empty:"No other Income-tax-Act audit reports."});
  h+=sub("div · Audit reports under any Act other than the Income-tax Act");
  h+=grid("gen.aud.act",[
    {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
    {h:"Act",k:"act",t:"sel",opts:GEN_AUDACT,req:1},
    {h:"Description (if Others)",k:"actOther",t:"txt",max:50},
    {h:"Section code",k:"sec",t:"txt",req:1,max:30},
    {h:"Audited under that Act?",k:"othFlag",t:"sel",opts:GEN_YN,req:1},
    {h:"Date",k:"date",t:"date"}
  ],S.gen.aud.act,{min:"820px",add:"Add an other-Act audit report",empty:"No audit reports under any other Act."});

  /* ===================== C · Holding status ===================== */
  h+=sub("Holding / subsidiary status");
  h+=row("Nature of company (holding / subsidiary status)",sel("gen.hold.natFlg",GEN_NATFLG),
    {req:1,ref:"HoldingStatus.NatOfCompFlg",hint:"1 holding · 2 subsidiary · 3 both · 4 any other"});
  h+=note("If no entry is made in the first row of a table, the other rows are not considered (utility row-3 note).");
  h+=blk("gen_hold","If a subsidiary — details of the holding company","Holding companies: "+S.gen.hold.holding.length,
    grid("gen.hold.holding",[
      {h:"Name of holding company",k:"name",t:"txt",req:1,max:125},
      {h:"PAN",k:"pan",t:"txt",max:10}
    ].concat(GEN_ADDR_COLS).concat([{h:"% shares held",k:"pct",t:"num"}]),
    S.gen.hold.holding,{min:"1180px",add:"Add a holding company",empty:"No holding company entered."}));
  h+=blk("gen_subsid","Details of subsidiary companies","Subsidiaries: "+S.gen.hold.subsid.length,
    grid("gen.hold.subsid",[
      {h:"Name of subsidiary company",k:"name",t:"txt",req:1,max:125},
      {h:"PAN",k:"pan",t:"txt",max:10}
    ].concat(GEN_ADDR_COLS).concat([{h:"% shares held",k:"pct",t:"num"}]),
    S.gen.hold.subsid,{min:"1180px",add:"Add a subsidiary company",empty:"No subsidiary company entered."}));

  /* ===================== D · Business organisation ===================== */
  h+=sub("Business organisation — amalgamating / amalgamated / demerged / resulting company");
  h+=grid("gen.busorg",[
    {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
    {h:"Business type",k:"type",t:"sel",opts:GEN_BUSORG},
    {h:"Name of the company",k:"name",t:"txt",max:125}
  ].concat(GEN_ADDR_COLS).concat([
    {h:"PAN",k:"pan",t:"txt",max:10},
    {h:"Date of event",k:"date",t:"date"}
  ]),S.gen.busorg,{min:"1280px",add:"Add a company",empty:"No business-organisation details."});

  /* ===================== E · Key persons ===================== */
  h+=sub("Key persons — managing director, directors, secretary, principal officers");
  h+=grid("gen.keyp",[
    {h:"Name",k:"name",t:"txt",req:1,max:125},
    {h:"Designation",k:"desig",t:"sel",opts:GEN_DESIG,req:1}
  ].concat(GEN_ADDR_COLS).concat([
    {h:"PAN",k:"pan",t:"txt",max:10},
    {h:"Aadhaar",k:"aadhaar",t:"txt",max:12},
    {h:"DIN",k:"din",t:"txt",max:20}
  ]),S.gen.keyp,{min:"1320px",add:"Add a key person",empty:"No key persons entered."});

  /* ===================== F · Shareholders (10%+) ===================== */
  h+=sub("Shareholders — beneficial owners of 10% or more of the voting power");
  h+=grid("gen.shr",[
    {h:"Name",k:"name",t:"txt",req:1,max:125},
    {h:"% shares held",k:"pct",t:"num",req:1}
  ].concat(GEN_ADDR_COLS).concat([
    {h:"PAN (if allotted)",k:"pan",t:"txt",max:10},
    {h:"Aadhaar",k:"aadhaar",t:"txt",max:12}
  ]),S.gen.shr,{min:"1240px",add:"Add a shareholder",empty:"No 10%+ shareholders entered."});

  /* ===================== G · Ownership (ultimate beneficial) ===================== */
  h+=sub("Ownership — ultimate beneficial owners (unlisted company), 10% or more of voting power");
  h+=grid("gen.own",[
    {h:"Name",k:"name",t:"txt",req:1,max:125},
    {h:"% share held",k:"pct",t:"num",req:1}
  ].concat(GEN_ADDR_COLS).concat([
    {h:"PAN",k:"pan",t:"txt",max:10},
    {h:"Aadhaar",k:"aadhaar",t:"txt",max:12}
  ]),S.gen.own,{min:"1240px",add:"Add an ultimate beneficial owner",empty:"No ultimate beneficial owners entered."});

  /* ===================== H · Foreign-company parents ===================== */
  h+=fold("gen_frn","GENERAL2","Foreign-company parents (immediate & ultimate)",
    "Immediate: "+S.gen.frnImm.length+" · Ultimate: "+S.gen.frnUlt.length,
    note("Complete these two tables only for a <b>foreign company</b>.")+
    sub("Immediate parent company")+
    grid("gen.frnImm",[
      {h:"Name",k:"name",t:"txt",req:1,max:125}
    ].concat(GEN_ADDR_COLS).concat([
      {h:"Country of residence",k:"cor",t:"sel",opts:GEN_COUNTRY,req:1},
      {h:"PAN (if allotted)",k:"pan",t:"txt",max:10},
      {h:"Taxpayer / unique ID no.",k:"trn",t:"txt",req:1,max:25}
    ]),S.gen.frnImm,{min:"1240px",add:"Add an immediate parent",empty:"No immediate parent entered."})+
    sub("Ultimate parent company")+
    grid("gen.frnUlt",[
      {h:"Name",k:"name",t:"txt",req:1,max:125}
    ].concat(GEN_ADDR_COLS).concat([
      {h:"Country of residence",k:"cor",t:"sel",opts:GEN_COUNTRY,req:1},
      {h:"PAN (if allotted)",k:"pan",t:"txt",max:10},
      {h:"Taxpayer / unique ID no.",k:"trn",t:"txt",req:1,max:25}
    ]),S.gen.frnUlt,{min:"1240px",add:"Add an ultimate parent",empty:"No ultimate parent entered."}));

  /* ===================== I · Nature of company ===================== */
  h+=sub("Nature of company (eight statutory-category flags)");
  h+=row("A public sector company as defined in section 2(36A)",sel("gen.nat.pubSect",GEN_YN,{blank:false}),{req:1,ref:"NatureOfComp.PubSectCompUs2_36AFlg"});
  h+=row("A company owned by the Reserve Bank of India",sel("gen.nat.rbi",GEN_YN,{blank:false}),{req:1,ref:"NatureOfComp.RBICompFlg"});
  h+=row("A company in which ≥ 40% of shares are held by the Government / RBI / an RBI-owned corporation",sel("gen.nat.gov40",GEN_YN,{blank:false}),{req:1,ref:"NatureOfComp.CompLes40PercSharGovRBIFlg"});
  h+=row("A banking company as defined in section 5(c) of the Banking Regulation Act, 1949",sel("gen.nat.bank",GEN_YN,{blank:false}),{req:1,ref:"NatureOfComp.BankCompUs5Flg"});
  h+=row("A scheduled bank (Second Schedule to the RBI Act)",sel("gen.nat.schedBank",GEN_YN,{blank:false}),{req:1,ref:"NatureOfComp.SchedBankOfRBIActFlg"});
  h+=row("A company registered with the IRDA (Insurance Regulatory and Development Authority Act, 1999)",sel("gen.nat.irda",GEN_YN,{blank:false}),{req:1,ref:"NatureOfComp.CompWithIRDARegisterFlg"});
  h+=row("A non-banking financial institution",sel("gen.nat.nbfi",GEN_YN,{blank:false}),{req:1,ref:"NatureOfComp.NonBankFIICompFlg"});
  h+=row("Is the company unlisted?",sel("gen.nat.unlisted",GEN_YN,{blank:false}),{req:1,ref:"NatureOfComp.CompanyUnlistedFlag",hint:"if yes, fill Schedule SH-1 and Schedule AL-1"});
  if(NC.unlisted==="Y")
    h+=note("Unlisted company — <b>Schedule SH-1 and Schedule AL-1 are required</b>.","form");

  /* ===================== J · Nature of business ===================== */
  h+=sub("Nature of business (up to four codes)");
  h+=note("At least one business code is mandatory here or at Point-61 of Schedule P&L (utility NOTE). Indicate the three main activities/products where there is more than one business.");
  h+=grid("gen.nob",[
    {h:"#",k:"_i",t:"calc",f:(r,i)=>i+1,w:"36px"},
    {h:"Code — Sub sector",k:"code",t:"sel",opts:GEN_NOB,req:1},
    {h:"Trade name",k:"trade",t:"txt",max:125},
    {h:"Description",k:"desc",t:"txt",max:125}
  ],S.gen.nob,{min:"760px",add:"Add a business code",empty:"No business code entered."});

  return h;
}

/* =====================================================================
   EXPORT — expGen(j): serialise the whole PartA_GEN2For6 block from S.gen.
   Repeating tables are JSON ARRAYS (constitution rule 12). put()/oPut
   skip empty values; SKEL keeps the required leaves present at nil.
   ===================================================================== */
function expGen(j){
  const A=S.gen.aud||{}, H=S.gen.hold||{}, NC=S.gen.nat||{};
  const oPut=(o,k,v)=>{if(v!==undefined&&v!==null&&v!=="")o[k]=v;};
  const putArr=(path,arr)=>{if(arr&&arr.length)put(j,path,arr);};
  const UP=v=>{v=sv(v);return v?String(v).toUpperCase():undefined;};
  const pctVal=v=>{if(v===undefined||v===null||v==="")return undefined;const n=N(v);return n>0?n:undefined;};
  /* AddressDetailWithZipCode — one shared six-field sub-object */
  function addr(r){r=r||{};const a={};
    oPut(a,"AddrDetail",sv(r.addr));
    oPut(a,"CityOrTownOrDistrict",sv(r.city));
    oPut(a,"StateCode",sv(r.state));
    const cc=sv(r.country);
    oPut(a,"CountryCode",cc);
    if((cc||"91")==="91"){const p=R(r.pin);if(p>=100000&&p<=999999)a.PinCode=p;}
    else oPut(a,"ZipCode",st0(r.zip).slice(0,10));
    return a;}

  /* ---- audit information (top-level leaves of the block) ---- */
  put(j,"PartA_GEN2For6.LiableSec44AAflg",sv(A.sec44AA||"N"));
  put(j,"PartA_GEN2For6.IncDclrdUs",sv(A.incDclrdUs||"N"));
  put(j,"PartA_GEN2For6.TotalSalesExcOneCr",sv(A.salesBand));
  if(A.salesBand==="Upto10CR"){
    put(j,"PartA_GEN2For6.AgrOFAllAmtsRcvd",sv(A.pctRcvd));
    put(j,"PartA_GEN2For6.AgrOFAllPayMade",sv(A.pctPaid));
  }
  put(j,"PartA_GEN2For6.LiableSec44ABflg",sv(A.sec44AB||"N"));
  if(A.sec44AB==="Y"){
    put(j,"PartA_GEN2For6.AuditedByAccountantFlg",sv(A.acctFlg));
    if(A.acctFlg==="Y"){
      put(j,"PartA_GEN2For6.AuditInfo.AuditReportFurnishDate",ISO(A.repDate));
      if(A.repAck) put(j,"PartA_GEN2For6.AuditInfo.AckNum44AB",R(A.repAck));
      put(j,"PartA_GEN2For6.AuditInfo.AudFrmName",sv(A.frmName));
      put(j,"PartA_GEN2For6.AuditInfo.AudFrmPAN",UP(A.frmPAN));
    }
  }
  put(j,"PartA_GEN2For6.LiableSec92Eflg",sv(A.sec92E||"N"));
  put(j,"PartA_GEN2For6.AccountAuditFlag",sv(A.sec92E==="Y"?(A.acct92E||"N"):"N"));
  if(A.sec92E==="Y"&&A.acct92E==="Y"){
    put(j,"PartA_GEN2For6.AuditDetails92E.DateOfAudit",ISO(A.date92E));
    if(A.ack92E) put(j,"PartA_GEN2For6.AuditDetails92E.AckNum92E",R(A.ack92E));
  }
  putArr("PartA_GEN2For6.AuditDetails",(A.oth||[]).map(r=>{const o={};
    oPut(o,"AuditedSection",sv(r.sec));
    if(r.sec==="OTH") oPut(o,"AnyOtherSection",sv(r.otherSec));
    oPut(o,"AuditFlag",sv(r.flag));
    oPut(o,"DateOfAudit",ISO(r.date));
    if(r.ack) oPut(o,"AckNumOth",R(r.ack));
    return o;}));
  putArr("PartA_GEN2For6.AuditReportDetails",(A.act||[]).map(r=>{const o={};
    oPut(o,"AuditReportAct",sv(r.act));
    if(r.act==="19") oPut(o,"AuditReportActOthers",sv(r.actOther));
    oPut(o,"AuditReportSection",sv(r.sec));
    oPut(o,"OtherITActFlag",sv(r.othFlag));
    oPut(o,"AuditReportDate",ISO(r.date));
    return o;}));

  /* ---- holding status ---- */
  put(j,"PartA_GEN2For6.HoldingStatus.NatOfCompFlg",sv(H.natFlg));
  const compRow=r=>{const cd={};
    oPut(cd,"CompName",sv(r.name));
    oPut(cd,"CompPAN",UP(r.pan));
    const a=addr(r); if(Object.keys(a).length) cd.AddressDetailWithZipCode=a;
    const p=pctVal(r.pct); if(p!==undefined) cd.CompSharePercent=p;
    return {CompDetails:cd};};
  putArr("PartA_GEN2For6.HoldingStatus.HoldingCompDetail",(H.holding||[]).map(compRow));
  putArr("PartA_GEN2For6.HoldingStatus.SubsidiaryCompDetail",(H.subsid||[]).map(compRow));

  /* ---- business organisation ---- */
  putArr("PartA_GEN2For6.BusOrganisation",(S.gen.busorg||[]).map(r=>{const o={};
    oPut(o,"BusOrgType",sv(r.type));
    oPut(o,"CompName",sv(r.name));
    const a=addr(r); if(Object.keys(a).length) o.AddressDetailWithZipCode=a;
    oPut(o,"BusOrgPAN",UP(r.pan));
    oPut(o,"DateOfBusinessOrg",ISO(r.date));
    return o;}));

  /* ---- key persons ---- */
  putArr("PartA_GEN2For6.KeyPersons",(S.gen.keyp||[]).map(r=>{const o={};
    oPut(o,"PersonName",sv(r.name));
    oPut(o,"Designation",sv(r.desig));
    const a=addr(r); if(Object.keys(a).length) o.AddressDetailWithZipCode=a;
    oPut(o,"KeyPerPAN",UP(r.pan));
    oPut(o,"KeyPersnAadhaar",sv(r.aadhaar));
    oPut(o,"DirectorIdNo",sv(r.din));
    return o;}));

  /* ---- shareholders (10%+) ---- */
  putArr("PartA_GEN2For6.ShareHolderInfo",(S.gen.shr||[]).map(r=>{const o={};
    oPut(o,"ShareHolderInfoName",sv(r.name));
    const p=pctVal(r.pct); if(p!==undefined) o.PercentageOfShare=p;
    const a=addr(r); if(Object.keys(a).length) o.AddressDetailWithZipCode=a;
    oPut(o,"ShareHolderPAN",UP(r.pan));
    oPut(o,"ShareHolderAadhaar",sv(r.aadhaar));
    return o;}));

  /* ---- ownership (ultimate beneficial owners) ---- */
  putArr("PartA_GEN2For6.OwnershipInfo",(S.gen.own||[]).map(r=>{const o={};
    oPut(o,"OwnerName",sv(r.name));
    const p=pctVal(r.pct); if(p!==undefined) o.PercentageOfShare=p;
    const a=addr(r); if(Object.keys(a).length) o.AddressDetailWithZipCode=a;
    oPut(o,"OwnerPAN",UP(r.pan));
    oPut(o,"OwnerAadhaar",sv(r.aadhaar));
    return o;}));

  /* ---- foreign-company parents ---- */
  const frnRow=r=>{const o={};
    oPut(o,"Name",sv(r.name));
    const a=addr(r); if(Object.keys(a).length) o.AddressDetailWithZipCode=a;
    oPut(o,"CountryOfResidence",sv(r.cor));
    oPut(o,"PAN",UP(r.pan));
    oPut(o,"TaxpayerRegNumber",sv(r.trn));
    return o;};
  putArr("PartA_GEN2For6.FrnCompImmediatePrntCompDtls",(S.gen.frnImm||[]).map(frnRow));
  putArr("PartA_GEN2For6.FrnCompUltimatePrntCompDtls",(S.gen.frnUlt||[]).map(frnRow));

  /* ---- nature of company (eight required flags) ---- */
  put(j,"PartA_GEN2For6.NatureOfComp.PubSectCompUs2_36AFlg",sv(NC.pubSect||"N"));
  put(j,"PartA_GEN2For6.NatureOfComp.RBICompFlg",sv(NC.rbi||"N"));
  put(j,"PartA_GEN2For6.NatureOfComp.CompLes40PercSharGovRBIFlg",sv(NC.gov40||"N"));
  put(j,"PartA_GEN2For6.NatureOfComp.BankCompUs5Flg",sv(NC.bank||"N"));
  put(j,"PartA_GEN2For6.NatureOfComp.SchedBankOfRBIActFlg",sv(NC.schedBank||"N"));
  put(j,"PartA_GEN2For6.NatureOfComp.CompWithIRDARegisterFlg",sv(NC.irda||"N"));
  put(j,"PartA_GEN2For6.NatureOfComp.NonBankFIICompFlg",sv(NC.nbfi||"N"));
  put(j,"PartA_GEN2For6.NatureOfComp.CompanyUnlistedFlag",sv(NC.unlisted||"N"));

  /* ---- nature of business codes ---- */
  putArr("PartA_GEN2For6.NatOfBus.NatureOfBusiness",(S.gen.nob||[]).map(r=>{const o={};
    oPut(o,"Code",sv(r.code));
    oPut(o,"TradeName1",sv(r.trade));
    oPut(o,"Description",sv(r.desc));
    return o;}));

}

/* =====================================================================
   IMPORT — impGen(I6): read PartA_GEN2For6 back into S.gen. Inverse of the
   export, so buildReturn -> importReturn -> buildReturn is identity.
   ===================================================================== */
function impGen(I6){
  const read=[];
  const G=(I6&&I6.PartA_GEN2For6)||{};
  if(!Object.keys(G).length) return read;
  S.gen=S.gen||{}; const A=S.gen.aud=S.gen.aud||{}, H=S.gen.hold=S.gen.hold||{}, NC=S.gen.nat=S.gen.nat||{};
  const inAddr=x=>{x=x||{};return {addr:x.AddrDetail,city:x.CityOrTownOrDistrict,state:x.StateCode,
    country:x.CountryCode,pin:x.PinCode!=null?String(x.PinCode):"",zip:x.ZipCode||""};};

  /* audit */
  if(G.LiableSec44AAflg!=null)A.sec44AA=G.LiableSec44AAflg;
  if(G.IncDclrdUs!=null)A.incDclrdUs=G.IncDclrdUs;
  if(G.TotalSalesExcOneCr!=null)A.salesBand=G.TotalSalesExcOneCr;
  if(G.AgrOFAllAmtsRcvd!=null)A.pctRcvd=G.AgrOFAllAmtsRcvd;
  if(G.AgrOFAllPayMade!=null)A.pctPaid=G.AgrOFAllPayMade;
  if(G.LiableSec44ABflg!=null)A.sec44AB=G.LiableSec44ABflg;
  if(G.AuditedByAccountantFlg!=null)A.acctFlg=G.AuditedByAccountantFlg;
  if(G.AuditInfo){const AI=G.AuditInfo;
    if(AI.AuditReportFurnishDate)A.repDate=dmy(AI.AuditReportFurnishDate);
    if(AI.AckNum44AB!=null)A.repAck=String(AI.AckNum44AB);
    if(AI.AudFrmName!=null)A.frmName=AI.AudFrmName;
    if(AI.AudFrmPAN!=null)A.frmPAN=AI.AudFrmPAN;}
  if(G.LiableSec92Eflg!=null)A.sec92E=G.LiableSec92Eflg;
  if(G.AccountAuditFlag!=null)A.acct92E=G.AccountAuditFlag;
  if(G.AuditDetails92E){if(G.AuditDetails92E.DateOfAudit)A.date92E=dmy(G.AuditDetails92E.DateOfAudit);
    if(G.AuditDetails92E.AckNum92E!=null)A.ack92E=String(G.AuditDetails92E.AckNum92E);}
  if(Array.isArray(G.AuditDetails))A.oth=G.AuditDetails.map(r=>({sec:r.AuditedSection,otherSec:r.AnyOtherSection,
    flag:r.AuditFlag,date:dmy(r.DateOfAudit),ack:r.AckNumOth!=null?String(r.AckNumOth):""}));
  if(Array.isArray(G.AuditReportDetails))A.act=G.AuditReportDetails.map(r=>({act:r.AuditReportAct,
    actOther:r.AuditReportActOthers,sec:r.AuditReportSection,othFlag:r.OtherITActFlag,date:dmy(r.AuditReportDate)}));
  read.push("audit information");

  /* holding status */
  if(G.HoldingStatus){const HS=G.HoldingStatus;
    if(HS.NatOfCompFlg!=null)H.natFlg=HS.NatOfCompFlg;
    const rc=x=>{const cd=(x&&x.CompDetails)||{};const a=inAddr(cd.AddressDetailWithZipCode);
      return Object.assign({name:cd.CompName,pan:cd.CompPAN,pct:cd.CompSharePercent},a);};
    if(Array.isArray(HS.HoldingCompDetail))H.holding=HS.HoldingCompDetail.map(rc);
    if(Array.isArray(HS.SubsidiaryCompDetail))H.subsid=HS.SubsidiaryCompDetail.map(rc);
  }

  /* business organisation */
  if(Array.isArray(G.BusOrganisation))S.gen.busorg=G.BusOrganisation.map(r=>Object.assign(
    {type:r.BusOrgType,name:r.CompName,pan:r.BusOrgPAN,date:dmy(r.DateOfBusinessOrg)},inAddr(r.AddressDetailWithZipCode)));
  /* key persons */
  if(Array.isArray(G.KeyPersons))S.gen.keyp=G.KeyPersons.map(r=>Object.assign(
    {name:r.PersonName,desig:r.Designation,pan:r.KeyPerPAN,aadhaar:r.KeyPersnAadhaar,din:r.DirectorIdNo},inAddr(r.AddressDetailWithZipCode)));
  /* shareholders */
  if(Array.isArray(G.ShareHolderInfo))S.gen.shr=G.ShareHolderInfo.map(r=>Object.assign(
    {name:r.ShareHolderInfoName,pct:r.PercentageOfShare,pan:r.ShareHolderPAN,aadhaar:r.ShareHolderAadhaar},inAddr(r.AddressDetailWithZipCode)));
  /* ownership */
  if(Array.isArray(G.OwnershipInfo))S.gen.own=G.OwnershipInfo.map(r=>Object.assign(
    {name:r.OwnerName,pct:r.PercentageOfShare,pan:r.OwnerPAN,aadhaar:r.OwnerAadhaar},inAddr(r.AddressDetailWithZipCode)));
  /* foreign parents */
  const frn=r=>Object.assign({name:r.Name,cor:r.CountryOfResidence,pan:r.PAN,trn:r.TaxpayerRegNumber},inAddr(r.AddressDetailWithZipCode));
  if(Array.isArray(G.FrnCompImmediatePrntCompDtls))S.gen.frnImm=G.FrnCompImmediatePrntCompDtls.map(frn);
  if(Array.isArray(G.FrnCompUltimatePrntCompDtls))S.gen.frnUlt=G.FrnCompUltimatePrntCompDtls.map(frn);

  /* nature of company */
  if(G.NatureOfComp){const N2=G.NatureOfComp;
    if(N2.PubSectCompUs2_36AFlg!=null)NC.pubSect=N2.PubSectCompUs2_36AFlg;
    if(N2.RBICompFlg!=null)NC.rbi=N2.RBICompFlg;
    if(N2.CompLes40PercSharGovRBIFlg!=null)NC.gov40=N2.CompLes40PercSharGovRBIFlg;
    if(N2.BankCompUs5Flg!=null)NC.bank=N2.BankCompUs5Flg;
    if(N2.SchedBankOfRBIActFlg!=null)NC.schedBank=N2.SchedBankOfRBIActFlg;
    if(N2.CompWithIRDARegisterFlg!=null)NC.irda=N2.CompWithIRDARegisterFlg;
    if(N2.NonBankFIICompFlg!=null)NC.nbfi=N2.NonBankFIICompFlg;
    if(N2.CompanyUnlistedFlag!=null)NC.unlisted=N2.CompanyUnlistedFlag;
    read.push("nature of company");
  }
  /* nature of business */
  if(G.NatOfBus&&Array.isArray(G.NatOfBus.NatureOfBusiness)){
    S.gen.nob=G.NatOfBus.NatureOfBusiness.map(r=>({code:r.Code,trade:r.TradeName1,desc:r.Description}));
    read.push("nature of business");
  }
  return read;
}

/* =====================================================================
   CHECKS — chkGen(): this section's own screen validations (err/warn).
   Department rules (A8/A23-A29/A33-A36 etc.) are Phase 6.
   ===================================================================== */
function chkGen(){
  const out=[]; const A=S.gen.aud||{}, H=S.gen.hold||{}, C=S.C.gen||{};
  const isPAN=v=>PAN_RE.test(st0(v).toUpperCase());

  /* holding-status flag is required */
  if(!st0(H.natFlg))
    out.push({lvl:"err",t:"Holding status required",m:"Select the nature of company (holding / subsidiary status).",sec:"gen"});

  /* 44AB auditor particulars */
  if(A.sec44AB==="Y"&&A.acctFlg==="Y"){
    if(!st0(A.repDate)||!D(A.repDate))
      out.push({lvl:"err",t:"Audit report date required",m:"Enter the date of furnishing of the section 44AB audit report (DD/MM/YYYY).",sec:"gen"});
    else if(D(A.repDate)>new Date())
      out.push({lvl:"err",t:"Audit report date",m:"The date of furnishing the audit report cannot be after today.",sec:"gen"});
    if(st0(A.frmPAN)&&!isPAN(A.frmPAN))
      out.push({lvl:"err",t:"Auditor PAN not valid",m:"The auditor's PAN must be five letters, four digits and a letter.",sec:"gen"});
    else if(!st0(A.frmPAN))
      out.push({lvl:"warn",t:"Auditor PAN",m:"The auditor's PAN is required when accounts are audited u/s 44AB.",sec:"gen"});
  }
  /* advisory 44AB liability from turnover + cash %s */
  if(C.auto44AB&&A.sec44AB!=="Y")
    out.push({lvl:"warn",t:"Section 44AB may apply",m:"The turnover band and cash percentages point to a tax-audit liability u/s 44AB (A27/A28/A29/A36).",sec:"gen"});

  /* 92E audit date when audited */
  if(A.sec92E==="Y"&&A.acct92E==="Y"&&(!st0(A.date92E)||!D(A.date92E)))
    out.push({lvl:"err",t:"92E audit date required",m:"Enter the date of furnishing of the section 92E audit report.",sec:"gen"});

  /* other-Act audit rows: Act + section code required per row */
  (A.act||[]).forEach((r,i)=>{
    if(st0(r.act)&&!st0(r.sec))
      out.push({lvl:"warn",t:"Other-Act audit — section",m:"Row "+(i+1)+": enter the section code for the selected Act.",sec:"gen"});
    if(r.act==="19"&&!st0(r.actOther))
      out.push({lvl:"warn",t:"Other-Act audit — description",m:"Row "+(i+1)+": describe the Act when 'Others' is selected.",sec:"gen"});
  });

  /* foreign-parent rows require country of residence + registration no. */
  const frnChk=(arr,label)=>{(arr||[]).forEach((r,i)=>{
    if(st0(r.name)){
      if(!st0(r.cor)) out.push({lvl:"warn",t:label+" parent — country",m:"Row "+(i+1)+": select the country of residence.",sec:"gen"});
      if(!st0(r.trn)) out.push({lvl:"warn",t:label+" parent — registration",m:"Row "+(i+1)+": enter the taxpayer / unique identification number.",sec:"gen"});
    }});};
  frnChk(S.gen.frnImm,"Immediate"); frnChk(S.gen.frnUlt,"Ultimate");

  /* share-percentage tables 0-100 */
  const pctChk=(arr,label)=>{(arr||[]).forEach((r,i)=>{
    const p=N(r.pct); if(r.pct!==""&&r.pct!=null&&(p<0||p>100))
      out.push({lvl:"warn",t:label+" percentage",m:"Row "+(i+1)+": percentage of shares must be between 0 and 100.",sec:"gen"});
  });};
  pctChk(S.gen.shr,"Shareholder"); pctChk(S.gen.own,"Ownership");

  /* at least one nature-of-business code (or at Point-61 of Sch P&L) */
  if(!(S.gen.nob||[]).some(r=>st0(r.code)))
    out.push({lvl:"warn",t:"Nature of business",m:"At least one business code is required here or at Point-61 of Schedule P&L.",sec:"gen"});

  if(!out.some(x=>x.lvl==="err"))
    out.push({lvl:"ok",t:"Company particulars",m:(S.gen.nob||[]).length+" business code(s)"+(A.sec44AB==="Y"?" · audit u/s 44AB":"")+(A.sec92E==="Y"?" · 92E":"")+".",sec:"gen"});
  return out;
}

/* ---- register (overrides the boot stub for "gen") ---------------- */
reg({id:"gen", t:"Company particulars", ref:"General2 · Nature of business",
     f:secGen, s:()=>{const n=(S.gen&&S.gen.nob||[]).filter(r=>r&&r.code).length;
       return n?n+" business code"+(n>1?"s":""):"Group, people, owners, audit, business";},
     eng:engGen, exp:expGen, imp:impGen, chk:chkGen, order:6, corder:6});
