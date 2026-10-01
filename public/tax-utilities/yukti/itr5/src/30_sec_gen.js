/* =====================================================================
   ITR-5 · Section "gen" — Part A - General & Part A - General(2)
   Books: books/ITR-5/PART_A_GENERAL.md, PART_A_GENERAL_2.md, HOME.md
   Sheets: HOME (no schema block), PART A - GENERAL (PartA_GEN1 + the
   physically-adjacent AuditInfo rows), PART A - GENERAL(2) (PartA_GEN2).
   Schema blocks OWNED (export + import): PartA_GEN1, PartA_GEN2.
   Compute / screen order: 5 (identity + filing-status face; runs before
   every income head and adds nothing to GTI — S.C.gen.income = 0).

   CROSS-SHEET NOTE (books' §): section_map.json binds only PartA_GEN1 to
   "PART A - GENERAL" and only PartA_GEN2 to "PART A - GENERAL(2)", but the
   AUDIT INFORMATION rows (44AA/44AB/92E, the accountant/92E reports, the
   two audit tables) physically sit on the "PART A - GENERAL" sheet while
   their schema keys live in PartA_GEN2 (LiableSec44AAflg, IncDclrdUs,
   LiableSec44ABflg, LiableSec92Eflg, AuditInfo{...}, AuditDetails92E{...},
   AuditDetails[], AuditReportDetails[], BiiDetails, AuditedByAccountantFlg,
   AccountAuditFlag, Cndnfor44AB, TotalSalesExcOneCr, AgrOFAllAmtsRcvd,
   AgrOFAllPayMade). They are rendered under PANEL 3 here and exported onto
   PartA_GEN2. HOME maps to no schema block and exports nothing.

   REGIME: FilingStatus.OptOldRegimeCurrAY is the master switch and drives
   isNew() via S.fs.optout (Yes = old regime). The 10-IEA / 115BAD / 115BAE
   option tree lives in the "Tax regime" fold; the hidden AY-2024-25/2025-26
   115BAC(6) ladder and the collapsed 10-IFA / representative / tax-audit
   sub-lines (book §9) are NOT built.

   GTI CONTRIBUTION: identity/eligibility/audit only — nothing added to
   Gross Total Income (S.C.gen.income = 0, a signed integer).
   ===================================================================== */

/* ---- long departmental code lists (verbatim from books/ITR-5/enums.json;
   GEN_COUNTRY from PART_A_GENERAL.md Appendix B, whose labels are clean —
   enums.json's CountryCode display labels are corrupted, codes are the same) */
const GEN_STATE=[["01", "Andaman and Nicobar islands"], ["02", "Andhra Pradesh"], ["03", "Arunachal Pradesh"], ["04", "Assam"], ["05", "Bihar"], ["06", "Chandigarh"], ["07", "Dadra Nagar and Haveli"], ["08", "Daman and Diu"], ["09", "Delhi"], ["10", "Goa"], ["11", "Gujarat"], ["12", "Haryana"], ["13", "Himachal Pradesh"], ["14", "Jammu and Kashmir"], ["15", "Karnataka"], ["16", "Kerala"], ["17", "Lakshadweep"], ["18", "Madhya Pradesh"], ["19", "Maharashtra"], ["20", "Manipur"], ["21", "meghalaya"], ["22", "Mizoram"], ["23", "Nagaland"], ["24", "Odisha"], ["25", "Puducherry"], ["26", "Punjab"], ["27", "Rajasthan"], ["28", "Sikkim"], ["29", "Tamil Nadu"], ["30", "Tripura"], ["31", "Uttar Pradesh"], ["32", "West Bengal"], ["33", "Chhattisgarh"], ["34", "Uttarakhand"], ["35", "Jharkhand"], ["36", "Telangana"], ["37", "Ladakh"], ["99", "Foreign"]];   /* Address/AlternateAddress/AddressDetailWithZipCode.StateCode (38) */
const GEN_COUNTRY=[["93", "AFGHANISTAN"], ["1001", "ALAND ISLANDS"], ["355", "ALBANIA"], ["213", "ALGERIA"], ["684", "AMERICAN SAMOA"], ["376", "ANDORRA"], ["244", "ANGOLA"], ["1264", "ANGUILLA"], ["1010", "ANTARCTICA"], ["1268", "ANTIGUA AND BARBUDA"], ["54", "ARGENTINA"], ["374", "ARMENIA"], ["297", "ARUBA"], ["61", "AUSTRALIA"], ["43", "AUSTRIA"], ["994", "AZERBAIJAN"], ["1242", "BAHAMAS"], ["973", "BAHRAIN"], ["880", "BANGLADESH"], ["1246", "BARBADOS"], ["375", "BELARUS"], ["32", "BELGIUM"], ["501", "BELIZE"], ["229", "BENIN"], ["1441", "BERMUDA"], ["975", "BHUTAN"], ["591", "BOLIVIA (PLURINATIONAL STATE OF)"], ["1002", "BONAIRE, SINT EUSTATIUS AND SABA"], ["387", "BOSNIA AND HERZEGOVINA"], ["267", "BOTSWANA"], ["1003", "BOUVET ISLAND"], ["55", "BRAZIL"], ["1014", "BRITISH INDIAN OCEAN TERRITORY"], ["673", "BRUNEI DARUSSALAM"], ["359", "BULGARIA"], ["226", "BURKINA FASO"], ["257", "BURUNDI"], ["238", "CABO VERDE"], ["855", "CAMBODIA"], ["237", "CAMEROON"], ["1", "CANADA"], ["1345", "CAYMAN ISLANDS"], ["236", "CENTRAL AFRICAN REPUBLIC"], ["235", "CHAD"], ["56", "CHILE"], ["86", "CHINA"], ["9", "CHRISTMAS ISLAND"], ["672", "COCOS (KEELING) ISLANDS"], ["57", "COLOMBIA"], ["270", "COMOROS"], ["242", "CONGO"], ["243", "CONGO (DEMOCRATIC REPUBLIC OF THE)"], ["682", "COOK ISLANDS"], ["506", "COSTA RICA"], ["225", "COTE DIVOIRE"], ["385", "CROATIA"], ["53", "CUBA"], ["1015", "CURACAO"], ["357", "CYPRUS"], ["420", "CZECHIA"], ["45", "DENMARK"], ["253", "DJIBOUTI"], ["1767", "DOMINICA"], ["1809", "DOMINICAN REPUBLIC"], ["593", "ECUADOR"], ["20", "EGYPT"], ["503", "EL SALVADOR"], ["240", "EQUATORIAL GUINEA"], ["291", "ERITREA"], ["372", "ESTONIA"], ["251", "ETHIOPIA"], ["500", "FALKLAND ISLANDS (MALVINAS)"], ["298", "FAROE ISLANDS"], ["679", "FIJI"], ["358", "FINLAND"], ["33", "FRANCE"], ["594", "FRENCH GUIANA"], ["689", "FRENCH POLYNESIA"], ["1004", "FRENCH SOUTHERN TERRITORIES"], ["241", "GABON"], ["220", "GAMBIA"], ["995", "GEORGIA"], ["49", "GERMANY"], ["233", "GHANA"], ["350", "GIBRALTAR"], ["30", "GREECE"], ["299", "GREENLAND"], ["1473", "GRENADA"], ["590", "GUADELOUPE"], ["1671", "GUAM"], ["502", "GUATEMALA"], ["1481", "GUERNSEY"], ["224", "GUINEA"], ["245", "GUINEA-BISSAU"], ["592", "GUYANA"], ["509", "HAITI"], ["1005", "HEARD ISLAND AND MCDONALD ISLANDS"], ["6", "HOLY SEE"], ["504", "HONDURAS"], ["852", "HONG KONG"], ["36", "HUNGARY"], ["354", "ICELAND"], ["91", "INDIA"], ["62", "INDONESIA"], ["98", "IRAN (ISLAMIC REPUBLIC OF)"], ["964", "IRAQ"], ["353", "IRELAND"], ["1624", "ISLE OF MAN"], ["972", "ISRAEL"], ["5", "ITALY"], ["1876", "JAMAICA"], ["81", "JAPAN"], ["1534", "JERSEY"], ["962", "JORDAN"], ["7", "KAZAKHSTAN"], ["254", "KENYA"], ["686", "KIRIBATI"], ["850", "KOREA (DEMOCRATIC PEOPLES REPUBLIC OF)"], ["82", "KOREA (REPUBLIC OF)"], ["965", "KUWAIT"], ["996", "KYRGYZSTAN"], ["856", "LAO PEOPLES DEMOCRATIC REPUBLIC"], ["371", "LATVIA"], ["961", "LEBANON"], ["266", "LESOTHO"], ["231", "LIBERIA"], ["218", "LIBYA"], ["423", "LIECHTENSTEIN"], ["370", "LITHUANIA"], ["352", "LUXEMBOURG"], ["853", "MACAO"], ["389", "MACEDONIA (THE FORMER YUGOSLAV REPUBLIC OF)"], ["261", "MADAGASCAR"], ["265", "MALAWI"], ["60", "MALAYSIA"], ["960", "MALDIVES"], ["223", "MALI"], ["356", "MALTA"], ["692", "MARSHALL ISLANDS"], ["596", "MARTINIQUE"], ["222", "MAURITANIA"], ["230", "MAURITIUS"], ["269", "MAYOTTE"], ["52", "MEXICO"], ["691", "MICRONESIA (FEDERATED STATES OF)"], ["373", "MOLDOVA (REPUBLIC OF)"], ["377", "MONACO"], ["976", "MONGOLIA"], ["382", "MONTENEGRO"], ["1664", "MONTSERRAT"], ["212", "MOROCCO"], ["258", "MOZAMBIQUE"], ["95", "MYANMAR"], ["264", "NAMIBIA"], ["674", "NAURU"], ["977", "NEPAL"], ["31", "NETHERLANDS"], ["687", "NEW CALEDONIA"], ["64", "NEW ZEALAND"], ["505", "NICARAGUA"], ["227", "NIGER"], ["234", "NIGERIA"], ["683", "NIUE"], ["15", "NORFOLK ISLAND"], ["1670", "NORTHERN MARIANA ISLANDS"], ["47", "NORWAY"], ["968", "OMAN"], ["92", "PAKISTAN"], ["680", "PALAU"], ["970", "PALESTINE, STATE OF"], ["507", "PANAMA"], ["675", "PAPUA NEW GUINEA"], ["595", "PARAGUAY"], ["51", "PERU"], ["63", "PHILIPPINES"], ["1011", "PITCAIRN"], ["48", "POLAND"], ["14", "PORTUGAL"], ["1787", "PUERTO RICO"], ["974", "QATAR"], ["262", "REUNION"], ["40", "ROMANIA"], ["8", "RUSSIAN FEDERATION"], ["250", "RWANDA"], ["1006", "SAINT BARTHELEMY"], ["290", "SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA"], ["1869", "SAINT KITTS AND NEVIS"], ["1758", "SAINT LUCIA"], ["1007", "SAINT MARTIN (FRENCH PART)"], ["508", "SAINT PIERRE AND MIQUELON"], ["1784", "SAINT VINCENT AND THE GRENADINES"], ["685", "SAMOA"], ["378", "SAN MARINO"], ["239", "SAO TOME AND PRINCIPE"], ["966", "SAUDI ARABIA"], ["221", "SENEGAL"], ["381", "SERBIA"], ["248", "SEYCHELLES"], ["232", "SIERRA LEONE"], ["65", "SINGAPORE"], ["1721", "SINT MAARTEN (DUTCH PART)"], ["421", "SLOVAKIA"], ["386", "SLOVENIA"], ["677", "SOLOMON ISLANDS"], ["252", "SOMALIA"], ["28", "SOUTH AFRICA"], ["1008", "SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS"], ["211", "SOUTH SUDAN"], ["35", "SPAIN"], ["94", "SRI LANKA"], ["249", "SUDAN"], ["597", "SURINAME"], ["1012", "SVALBARD AND JAN MAYEN"], ["268", "SWAZILAND"], ["46", "SWEDEN"], ["41", "SWITZERLAND"], ["963", "SYRIAN ARAB REPUBLIC"], ["886", "TAIWAN, PROVINCE OF CHINA[A]"], ["992", "TAJIKISTAN"], ["255", "TANZANIA, UNITED REPUBLIC OF"], ["66", "THAILAND"], ["670", "TIMOR-LESTE(EAST TIMOR)"], ["228", "TOGO"], ["690", "TOKELAU"], ["676", "TONGA"], ["1868", "TRINIDAD AND TOBAGO"], ["216", "TUNISIA"], ["90", "TURKEY"], ["993", "TURKMENISTAN"], ["1649", "TURKS AND CAICOS ISLANDS"], ["688", "TUVALU"], ["256", "UGANDA"], ["380", "UKRAINE"], ["971", "UNITED ARAB EMIRATES"], ["44", "UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND"], ["2", "UNITED STATES OF AMERICA"], ["1009", "UNITED STATES MINOR OUTLYING ISLANDS"], ["598", "URUGUAY"], ["998", "UZBEKISTAN"], ["678", "VANUATU"], ["58", "VENEZUELA (BOLIVARIAN REPUBLIC OF)"], ["84", "VIET NAM"], ["1284", "VIRGIN ISLANDS (BRITISH)"], ["1340", "VIRGIN ISLANDS (U.S.)"], ["681", "WALLIS AND FUTUNA"], ["1013", "WESTERN SAHARA"], ["967", "YEMEN"], ["260", "ZAMBIA"], ["263", "ZIMBABWE"], ["9999", "OTHERS"]]; /* …CountryCode (250) */
const GEN_PMSTATUS=[["INDIVIDUAL", "INDIVIDUAL"], ["IND_WORKING", "IND_WORKING"], ["IND_RETIRED", "IND_RETIRED"], ["HUF", "HUF"], ["FIRM", "FIRM"], ["LLP", "LLP"], ["DOMESTIC_COMPANY", "DOMESTIC_COMPANY"], ["FOREIGN_COMPANY", "FOREIGN_COMPANY"], ["CO_OPERATIVE_SOCIETY", "CO_OPERATIVE_SOCIETY"], ["LOCAL_AUTHORITY", "LOCAL_AUTHORITY"], ["TRUST", "TRUST"], ["AOP_BOI", "AOP_BOI"], ["ANY_OTHER_AJP", "ANY_OTHER_AJP"], ["SETTLER", "SETTLER"], ["TRUSTEE", "TRUSTEE"], ["BENEFICIARY", "BENEFICIARY"], ["PRINCIPAL_OFFICER", "PRINCIPAL_OFFICER"], ["EXECUTOR", "EXECUTOR"]]; /* PartnerOrMemberInfo[].Status (18) */
const GEN_NOB=[["00002", "Not Applicable"], ["01001", "Growing and manufacturing of tea"], ["01002", "Growing and manufacturing of coffee"], ["01003", "Growing and manufacturing of rubber"], ["01004", "Market gardening and horticulture specialties"], ["01005", "Raising of silk worms and production of silk"], ["01006", "Raising of bees and production of honey"], ["01007", "Raising of poultry and production of eggs"], ["01008", "Rearing of sheep and production of wool"], ["01009", "Rearing of animals and production of animal products"], ["01010", "Agricultural and animal husbandry services"], ["01011", "Soil conservation, soil testing and soil desalination services"], ["01012", "Hunting, trapping and game propagation services"], ["01013", "Growing of timber, plantation, operation of tree nurseries and conserving of forest"], ["01014", "Gathering of tendu leaves"], ["01015", "Gathering of other wild growing materials"], ["01016", "Forestry service activities, timber cruising, afforestation and reforestation"], ["01017", "Logging service activities, transport of logs within the forest"], ["01018", "Other agriculture, animal husbandry or forestry activity n.e.c"], ["02001", "Fishing on commercial basis in inland waters"], ["02002", "Fishing on commercial basis in ocean and coastal areas"], ["02003", "Fish farming"], ["02004", "Gathering of marine materials such as natural pearls, sponges, coral etc."], ["02005", "Services related to marine and fresh water fisheries, fish hatcheries and fish farms"], ["02006", "Other Fish farming activity n.e.c"], ["03001", "Mining and agglomeration of hard coal"], ["03002", "Mining and agglomeration of lignite"], ["03003", "Extraction and agglomeration of peat"], ["03004", "Extraction of crude petroleum and natural gas"], ["03005", "Service activities incidental to oil and gas extraction excluding surveying"], ["03006", "Mining of uranium and thorium ores"], ["03007", "Mining of iron ores"], ["03008", "Mining of non-ferrous metal ores, except uranium and thorium ores"], ["03009", "Mining of gemstones"], ["03010", "Mining of chemical and fertilizer minerals"], ["03011", "Mining of quarrying of abrasive materials"], ["03012", "Mining of mica, graphite and asbestos"], ["03013", "Quarrying of stones (marble/granite/dolomite), sand and clay"], ["03014", "Other mining and quarrying"], ["03015", "Mining and production of salt"], ["03016", "Other mining and quarrying n.e.c"], ["04001", "Production, processing and preservation of meat and meat products"], ["04002", "Production, processing and preservation of fish and fish products"], ["04003", "Manufacture of vegetable oil, animal oil and fats"], ["04004", "Processing of fruits, vegetables and edible nuts"], ["04005", "Manufacture of dairy products"], ["04006", "Manufacture of sugar"], ["04007", "Manufacture of cocoa, chocolates and sugar confectionery"], ["04008", "Flour milling"], ["04009", "Rice milling"], ["04010", "Dal milling"], ["04011", "Manufacture of other grain mill products"], ["04012", "Manufacture of bakery products"], ["04013", "Manufacture of starch products"], ["04014", "Manufacture of animal feeds"], ["04015", "Manufacture of other food products"], ["04016", "Manufacturing of wines"], ["04017", "Manufacture of beer"], ["04018", "Manufacture of malt liquors"], ["04019", "Distilling and blending of spirits, production of ethyl alcohol"], ["04020", "Manufacture of mineral water"], ["04021", "Manufacture of soft drinks"], ["04022", "Manufacture of other non-alcoholic beverages"], ["04023", "Manufacture of tobacco products"], ["04024", "Manufacture of textiles (other than by handloom)"], ["04025", "Manufacture of textiles using handlooms (khadi)"], ["04026", "Manufacture of carpet, rugs, blankets, shawls etc. (other than by hand)"], ["04027", "Manufacture of carpet, rugs, blankets, shawls etc. by hand"], ["04028", "Manufacture of wearing apparel"], ["04029", "Tanning and dressing of leather"], ["04030", "Manufacture of luggage, handbags and the like saddler and harness"], ["04031", "Manufacture of footwear"], ["04032", "Manufacture of wood and wood products, cork, straw and plaiting material"], ["04033", "Manufacture of paper and paper products"], ["04034", "Publishing, printing and reproduction of recorded media"], ["04035", "Manufacture of coke oven products"], ["04036", "Manufacture of refined petroleum products"], ["04037", "Processing of nuclear fuel"], ["04038", "Manufacture of fertilizers and nitrogen compounds"], ["04039", "Manufacture of plastics in primary forms and of synthetic rubber"], ["04040", "Manufacture of paints, varnishes and similar coatings"], ["04041", "Manufacture of pharmaceuticals, medicinal chemicals and botanical products"], ["04042", "Manufacture of soap and detergents"], ["04043", "Manufacture of other chemical products"], ["04044", "Manufacture of man-made fibers"], ["04045", "Manufacture of rubber products"], ["04046", "Manufacture of plastic products"], ["04047", "Manufacture of glass and glass products"], ["04048", "Manufacture of cement, lime and plaster"], ["04049", "Manufacture of articles of concrete, cement and plaster"], ["04050", "Manufacture of Bricks"], ["04051", "Manufacture of other clay and ceramic products"], ["04052", "Manufacture of other non-metallic mineral products"], ["04053", "Manufacture of pig iron, sponge iron, Direct Reduced Iron etc."], ["04054", "Manufacture of Ferro alloys"], ["04055", "Manufacture of Ingots, billets, blooms and slabs etc."], ["04056", "Manufacture of steel products"], ["04057", "Manufacture of basic precious and non-ferrous metals"], ["04058", "Manufacture of non-metallic mineral products"], ["04059", "Casting of metals"], ["04060", "Manufacture of fabricated metal products"], ["04061", "Manufacture of engines and turbines"], ["04062", "Manufacture of pumps and compressors"], ["04063", "Manufacture of bearings and gears"], ["04064", "Manufacture of ovens and furnaces"], ["04065", "Manufacture of lifting and handling equipment"], ["04066", "Manufacture of other general purpose machinery"], ["04067", "Manufacture of agricultural and forestry machinery"], ["04068", "Manufacture of Machine Tools"], ["04069", "Manufacture of machinery for metallurgy"], ["04070", "Manufacture of machinery for mining, quarrying and constructions"], ["04071", "Manufacture of machinery for processing of food and beverages"], ["04072", "Manufacture of machinery for leather and textile"], ["04073", "Manufacture of weapons and ammunition"], ["04074", "Manufacture of other special purpose machinery"], ["04075", "Manufacture of domestic appliances"], ["04076", "Manufacture of office, accounting and computing machinery"], ["04077", "Manufacture of electrical machinery and apparatus"], ["04078", "Manufacture of Radio, Television, communication equipment and apparatus"], ["04079", "Manufacture of medical and surgical equipment"], ["04080", "Manufacture of industrial process control equipment"], ["04081", "Manufacture of instruments and appliances for measurements and navigation"], ["04082", "Manufacture of optical instruments"], ["04083", "Manufacture of watches and clocks"], ["04084", "Manufacture of motor vehicles"], ["04085", "Manufacture of body of motor vehicles"], ["04086", "Manufacture of parts and accessories of motor vehicles and engines"], ["04087", "Building and repair of ships and boats"], ["04088", "Manufacture of railway locomotive and rolling stocks"], ["04089", "Manufacture of aircraft and spacecraft"], ["04090", "Manufacture of bicycles"], ["04091", "Manufacture of other transport equipment"], ["04092", "Manufacture of furniture"], ["04093", "Manufacture of jewellery"], ["04094", "Manufacture of sports goods"], ["04095", "Manufacture of musical instruments"], ["04096", "Manufacture of games and toys"], ["04097", "Other manufacturing n.e.c."], ["04098", "Recycling of metal waste and scrap"], ["04099", "Recycling of non- metal waste and scrap"], ["05001", "Production, collection and distribution of electricity"], ["05002", "Manufacture and distribution of gas"], ["05003", "Collection, purification and distribution of water"], ["05004", "Other essential commodity service n.e.c"], ["06001", "Site preparation works"], ["06002", "Building of complete constructions or parts- civil contractors"], ["06003", "Building installation"], ["06004", "Building completion"], ["06005", "Construction and maintenance of roads, rails, bridges, tunnels, ports, harbour, runways etc."], ["06006", "Construction and maintenance of power plants"], ["06007", "Construction and maintenance of industrial plants"], ["06008", "Construction and maintenance of power transmission and telecommunication lines"], ["06009", "Construction of water ways and water reservoirs"], ["06010", "Other construction activity n.e.c."], ["07001", "Purchase, sale and letting of leased buildings (residential and non-residential)"], ["07002", "Operating of real estate of self-owned buildings (residential and non-residential)"], ["07003", "Developing and sub-dividing real estate into lots"], ["07004", "Real estate activities on a fee or contract basis"], ["07005", "Other real estate/renting services n.e.c"], ["08001", "Renting of land transport equipment"], ["08002", "Renting of water transport equipment"], ["08003", "Renting of air transport equipment"], ["08004", "Renting of agricultural machinery and equipment"], ["08005", "Renting of construction and civil engineering machinery"], ["08006", "Renting of office machinery and equipment"], ["08007", "Renting of other machinery and equipment n.e.c."], ["08008", "Renting of personal and household goods n.e.c."], ["08009", "Renting of other machinery n.e.c."], ["09001", "Wholesale and retail sale of motor vehicles"], ["09002", "Repair and maintenance of motor vehicles"], ["09003", "Sale of motor parts and accessories- wholesale and retail"], ["09004", "Retail sale of automotive fuel"], ["09005", "General commission agents, commodity brokers and auctioneers"], ["09006", "Wholesale of agricultural raw material"], ["09007", "Wholesale of food and beverages and tobacco"], ["09008", "Wholesale of household goods"], ["09009", "Wholesale of metals and metal ores"], ["09010", "Wholesale of household goods"], ["09011", "Wholesale of construction material"], ["09012", "Wholesale of hardware and sanitary fittings"], ["09013", "Wholesale of cotton and jute"], ["09014", "Wholesale of raw wool and raw silk"], ["09015", "Wholesale of other textile fibres"], ["09016", "Wholesale of industrial chemicals"], ["09017", "Wholesale of fertilizers and pesticides"], ["09018", "Wholesale of electronic parts and equipment"], ["09019", "Wholesale of other machinery, equipment and supplies"], ["09020", "Wholesale of waste, scrap and materials for re-cycling"], ["09021", "Retail sale of food, beverages and tobacco in specialized stores"], ["09022", "Retail sale of other goods in specialized stores"], ["09023", "Retail sale in non-specialized stores"], ["09024", "Retail sale of textiles, apparel, footwear, leather goods"], ["09025", "Retail sale of other household appliances"], ["09026", "Retail sale of hardware, paint and glass"], ["09027", "Wholesale of other products n.e.c"], ["09028", "Retail sale of other products n.e.c"], ["10001", "Hotels Star rated"], ["10002", "Hotels Non-star rated"], ["10003", "Motels, Inns and Dharmshalas"], ["10004", "Guest houses and circuit houses"], ["10005", "Dormitories and hostels at educational institutions"], ["10006", "Short stay accommodations n.e.c."], ["10007", "Restaurants with bars"], ["10008", "Restaurants without bars"], ["10009", "Canteens"], ["10010", "Independent caterers"], ["10011", "Casinos and other games of chance"], ["10012", "Other hospitality services n.e.c."], ["11001", "Travel agencies and tour operators"], ["11002", "Packers and movers"], ["11003", "Passenger land transport"], ["11004", "Air transport"], ["11005", "Transport by urban/sub-urban railways"], ["11006", "Inland water transport"], ["11007", "Sea and coastal water transport"], ["11008", "Freight transport by road"], ["11009", "Freight transport by railways"], ["11010", "Forwarding of freight"], ["11011", "Receiving and acceptance of freight"], ["11012", "Cargo handling"], ["11013", "Storage and warehousing"], ["11014", "Transport via pipelines (transport of gases, liquids, slurry and other commodities)"], ["11015", "Other Transport and Logistics services n.e.c"], ["12001", "Post and courier activities"], ["12002", "Basic telecom services"], ["12003", "Value added telecom services"], ["12004", "Maintenance of telecom network"], ["12005", "Activities of the cable operators"], ["12006", "Other Post and Telecommunication services n.e.c"], ["13001", "Commercial banks, saving banks and discount houses"], ["13002", "Specialised institutions granting credit"], ["13003", "Financial leasing"], ["13004", "Hire-purchase financing"], ["13005", "Housing finance activities"], ["13006", "Commercial loan activities"], ["13007", "Credit cards"], ["13008", "Mutual funds"], ["13009", "Chit fund"], ["13010", "Investment activities"], ["13011", "Life insurance"], ["13012", "Pension funding"], ["13013", "Non-life insurance"], ["13014", "Administration of financial markets"], ["13015", "Stock brokers, sub-brokers and related activities"], ["13016", "Financial advisers, mortgage advisers and brokers"], ["13017", "Foreign exchange services"], ["13018", "Other financial intermediation services n.e.c."], ["14001", "Software development"], ["14002", "Other software consultancy"], ["14003", "Data processing"], ["14004", "Database activities and distribution of electronic content"], ["14005", "Other IT enabled services"], ["14006", "BPO services"], ["14007", "Cyber caf"], ["14008", "Maintenance and repair of office, accounting and computing machinery"], ["14009", "Computer training and educational institutes"], ["14010", "Other computation related services n.e.c."], ["15001", "Natural sciences and engineering"], ["15002", "Social sciences and humanities"], ["15003", "Other Research and Development activities n.e.c."], ["16001", "Legal profession"], ["16002", "Accounting, book-keeping and auditing profession"], ["16003", "Tax consultancy"], ["16004", "Architectural profession"], ["16005", "Engineering and technical consultancy"], ["16006", "Advertising"], ["16007", "Fashion designing"], ["16008", "Interior decoration"], ["16009", "Photography"], ["16010", "Auctioneers"], ["16011", "Business brokerage"], ["16012", "Market research and public opinion polling"], ["16013", "Business and management consultancy activities"], ["16014", "Labour recruitment and provision of personnel"], ["16015", "Investigation and security services"], ["16016", "Building-cleaning and industrial cleaning activities"], ["16017", "Packaging activities"], ["16018", "Secretarial activities"], ["16019", "Other professional services n.e.c."], ["16019_1", "Medical Profession"], ["16020", "Film Artist"], ["17001", "Primary education"], ["17002", "Secondary/ senior secondary education"], ["17003", "Technical and vocational secondary/ senior secondary education"], ["17004", "Higher education"], ["17005", "Education by correspondence"], ["17006", "Coaching centres and tuitions"], ["17007", "Other education services n.e.c."], ["18001", "General hospitals"], ["18002", "Speciality and super speciality hospitals"], ["18003", "Nursing homes"], ["18004", "Diagnostic centres"], ["18005", "Pathological laboratories"], ["18006", "Independent blood banks"], ["18007", "Medical transcription"], ["18008", "Independent ambulance services"], ["18009", "Medical suppliers, agencies and stores"], ["18010", "Medical clinics"], ["18011", "Dental practice"], ["18012", "Ayurveda practice"], ["18013", "Unani practice"], ["18014", "Homeopathy practice"], ["18015", "Nurses, physiotherapists or other para-medical practitioners"], ["18016", "Veterinary hospitals and practice"], ["18017", "Medical education"], ["18018", "Medical research"], ["18019", "Practice of other alternative medicine"], ["18020", "Other healthcare services"], ["19001", "Social work activities with accommodation (orphanages and old age homes)"], ["19002", "Social work activities without accommodation (Creches)"], ["19003", "Industry associations, chambers of commerce"], ["19004", "Professional organisations"], ["19005", "Trade unions"], ["19006", "Religious organizations"], ["19007", "Political organisations"], ["19008", "Other membership organisations n.e.c. (rotary clubs, book clubs and philatelic clubs)"], ["19009", "Other Social or community service n.e.c"], ["20001", "Motion picture production"], ["20002", "Film distribution"], ["20003", "Film laboratories"], ["20004", "Television channel productions"], ["20005", "Television channels broadcast"], ["20006", "Video production and distribution"], ["20007", "Sound recording studios"], ["20008", "Radio - recording and distribution"], ["20009", "Stage production and related activities"], ["20010", "Individual artists excluding authors"], ["20011", "Literary activities"], ["20012", "Other cultural activities n.e.c."], ["20013", "Circuses and race tracks"], ["20014", "Video Parlours"], ["20015", "News agency activities"], ["20016", "Library and archives activities"], ["20017", "Museum activities"], ["20018", "Preservation of historical sites and buildings"], ["20019", "Botanical and zoological gardens"], ["20020", "Operation and maintenance of sports facilities"], ["20021", "Activities of sports and game schools"], ["20022", "Organisation and operation of indoor/outdoor sports and promotion and production of sporting events"], ["20023", "Other sporting activities n.e.c."], ["20023_1", "Sports Management"], ["20024", "Other recreational activities n.e.c."], ["21001", "Hair dressing and other beauty treatment"], ["21002", "Funeral and related activities"], ["21003", "Marriage bureaus"], ["21004", "Pet care services"], ["21005", "Sauna and steam baths, massage salons etc."], ["21006", "Astrological and spiritualists activities"], ["21007", "Private households as employers of domestic staff"], ["21008_1", "Event Management"], ["21008", "Other services n.e.c."], ["22001", "Extra territorial organisations and bodies (IMF, World Bank, European Commission etc.)"], ["23001", "Banking/Credit Facilities to its members"], ["23002", "Cottage Industry"], ["23003", "Marketing of Agricultural produce grown by its members"], ["23004", "Purchase of Agricultural Implements, seeds, livestock or other articles intended for agriculture for the purpose of supp"], ["23005", "Processing , without the aid of power, of the agricultural Produce of its members."], ["23006", "Collective disposal of Labour of its members"], ["23007", "Fishing or allied activities for the purpose of supplying to its members."], ["23008", "Primary cooperative society engaged in supplying Milk, oilseeds, fruits or vegetables raised or grown by its members to "], ["23009", "Consumer Cooperative Society Other than specified in 80P(2a) or 80P(2b)"], ["23010", "Other Cooperative Society engaged in activities Other than specified in 80P(2a) or 80P(2b)"], ["23011", "Interest/Dividend from Investment in other co-operative society"], ["23012", "Income from Letting of godowns / warehouses for storage, processing / facilitating the marketing of commodities"], ["23013", "Others"], ["23014", "Federal milk co-operative society"], ["09029", "Commission agents - Kachcha Arahtia"], ["16021", "Social Media Influencers"], ["21009", "Speculative trading"], ["21010", "Futures and Options trading"], ["21011", "Buying and selling shares"]]; /* NatOfBus.NatureOfBusiness[].Code (371) */

/* ---- small dropdown value lists (verbatim from books/ITR-5/enums.json and
   the DB-sheet named ranges FSS_1/LASS_1/AOPSS_1/AJPSS_1; never hand-typed) --- */
const GEN_STATUS=[["1","Firm"],["2","Local Authority"],["14","AOP/BOI"],["9","Artificial Juridical Person"]]; /* OrgFirmInfo.StatusOrCompanyType (W12 MainStatus → schema codes 1/2/14/9) */
/* SubStatus (AH12) — dependent on Status; value stored = the utility's display string (schema has no enum). From DB!M12:M14 / M16:M17 / M19:M28 / M30:M33. */
const GEN_SUBSTATUS={
 "1":[["1-Partnership Firm","1-Partnership Firm"],["2-LLP (Limited Liability Partnership)","2-LLP (Limited Liability Partnership)"]],
 "2":[["1-Local Authority","1-Local Authority"]],
 "14":[["1a-Primary Agricultural Credit Society","1a-Primary Agricultural Credit Society"],["1b-Primary Co-operative Agricultural and Rural Development bank","1b-Primary Co-operative Agricultural and Rural Development bank"],["1c-Co-operative Bank other than a primary agricultural credit society or a primary co-operative agricultural and rural development bank","1c-Co-operative Bank other than a primary agricultural credit society or a primary co-operative agricultural and rural development bank"],["2-Society Registered under Societies Registration Act-1860 or any law corresponding to that State","2-Society Registered under Societies Registration Act-1860 or any law corresponding to that State"],["3-Other Cooperative Society","3-Other Cooperative Society"],["4-Business Trust","4-Business Trust"],["5-Investment Fund","5-Investment Fund"],["6-Trust other than trust eligible to file return in ITR-7","6-Trust other than trust eligible to file return in ITR-7"],["7-Any other AOP/BOI","7-Any other AOP/BOI"]],
 "9":[["1-Estate of the deceased","1-Estate of the deceased"],["2-Estate of the insolvent","2-Estate of the insolvent"],["3-Other AJP","3-Other AJP"]]
};
/* OrgFirmInfo.SubStatus is a schema CODE (pattern 4|5|8|10|…|21), while the
   engines (tax subC / amt / ded) parse the utility label above, so the label is
   the internal value and only the export/import cross the boundary. Local
   Authority has no schema code and SubStatus is not schema-required, so it is
   simply omitted from the return for that status. */
const GEN_SUBSTATUS_CODE={
 "1-Partnership Firm":"10", "2-LLP (Limited Liability Partnership)":"5",
 "1a-Primary Agricultural Credit Society":"15",
 "1b-Primary Co-operative Agricultural and Rural Development bank":"16",
 "1c-Co-operative Bank other than a primary agricultural credit society or a primary co-operative agricultural and rural development bank":"17",
 "2-Society Registered under Societies Registration Act-1860 or any law corresponding to that State":"11",
 "3-Other Cooperative Society":"4", "4-Business Trust":"20", "5-Investment Fund":"21",
 "6-Trust other than trust eligible to file return in ITR-7":"13", "7-Any other AOP/BOI":"8",
 "1-Estate of the deceased":"12", "2-Estate of the insolvent":"18", "3-Other AJP":"19"};
const GEN_SUBSTATUS_LABEL=(()=>{const m={};Object.keys(GEN_SUBSTATUS_CODE).forEach(k=>m[GEN_SUBSTATUS_CODE[k]]=k);return m;})();
const GEN_YN=[["Y","Yes"],["N","No"]];                                    /* the many Y/N flags */
const GEN_SEP=[["Y","Yes"],["N","No"],["NA","Not Applicable"]];           /* FilingStatus.NriSEPinIndia */
const GEN_SEC=[["11","139(1)-On or before due date"],["12","139(4)-Belated"],["13","142(1)"],["14","148"],["16","153C"],["17","139(5)-Revised"],["18","139(9)"],["19","92CD - Modified return"],["20","119(2)(b)- after condonation of delay"]]; /* FilingStatus.ReturnFileSec.IncomeTaxSec (AF27) */
const GEN_DUE=[["2026-07-31","31/07/2026 or extended"],["2026-08-31","31/08/2026 or extended"],["2026-10-31","31/10/2026 or extended"],["2026-11-30","30/11/2026 or extended"]]; /* FilingStatus.ItrFilingDueDate (J26) */
const GEN_RES=[["RES","RES-Resident"],["NRI","NRI-Non-Resident"]];       /* FilingStatus.ResidentialStatus (AL33) */
const GEN_AYOLD=[["2024-25","AY 2024-25"],["2025-26","AY 2025-26"]];     /* FilingStatus.Form10IEAAssYear (G39) */
const GEN_AYNEW=[["2025-26","AY 2025-26"]];                              /* FilingStatus.AssYrF10IEANewTaxReg (H44) */
const GEN_OPTNEW=[["1","Opting in now"],["2","Not opting"]];            /* FilingStatus.ReturnFileSec.OptingNewTaxRegime (F81) */
const GEN_BADAY=[["2021-22","2021-22"],["2022-23","2022-23"],["2023-24","2023-24"],["2024-25","2024-25"],["2025-26","2025-26"]]; /* ReturnFileSec.Section115BADAY (F78) */
const GEN_SALES=[["Upto1CR","Up to Rs. 1 crore"],["Upto10CR","More than Rs. 1 crore and up to Rs. 10 crores"],["MoreThan10CR","More than Rs. 10 crores"]]; /* PartA_GEN2.TotalSalesExcOneCr (F141) */
const GEN_PCT5=[["Upto5Per","Up to 5%"],["MoreThan5Per","More than 5%"]]; /* AgrOFAllAmtsRcvd / AgrOFAllPayMade (F142/F143) */
const GEN_CND44AB=[["bi","Sales, turnover or gross receipts exceeds the specified limits"],["bii","Assessee falling u/s 44AD/44ADA/44AE/44BB but not opting for offering income on presumptive basis"],["biii","others"]]; /* PartA_GEN2.Cndnfor44AB (F145 Dropdown_44AB) */
const GEN_AUDSEC=[["10A","10A"],["10AA","10AA"],["10(4D)","10(4D)"],["10(23FF)","10(23FF)"],["44DA","44DA"],["50B","50B"],["80-IA","80-IA"],["80-IAB","80-IAB"],["80-IAC","80-IAC"],["80-IB","80-IB"],["80-ID","80-ID"],["80-IE","80-IE"],["80JJAA","80JJAA"],["80LA","80LA"],["115JC","115JC"]]; /* AuditDetails[].AuditedSection (F166 AuditSectionCode) */
const GEN_AUDACT=[["1","Banking Regulation Act, 1949"],["2","Central Excise Act,1944"],["3","Central Sales Tax Act, 1956"],["4","Central Goods and Services Tax Act, 2017"],["5","Charitable And Religious Trusts Act, 1920"],["7","Electricity Act, 2003"],["8","Employees Provident Fund and Miscellaneous Provisions Act, 1952"],["9","Foreign Exchange Management Act, 1999"],["10","Government Superannuation Fund Act, 1956"],["11","Indian Trusts Act, 1882"],["12","Integrated Goods and Services Tax Act, 2017"],["13","Limited Liability Partnership Act, 2008"],["14","Payment of Gratuity Act, 1972"],["15","SEBI Act, 1992"],["16","Securities Contract (Regulation) Act, 1956"],["17","State Goods and Services Tax Act, 2017"],["18","Union Territories Goods and Services Tax Act, 2017"],["19","Others"]]; /* AuditReportDetails[].AuditReportAct (F174 Sheet1_Act_Dropdown) */
const GEN_COTYPE=[["D","Domestic"],["F","Foreign"]];                     /* HeldUnlistedEqShrPrYrDtls[].CompanyType (G126) */
const GEN_ADMRET=[["ADM","Admitted"],["RET","Retired"]];                 /* PrevYrMemPartDtls[].AdmRet (F5) */
const GEN_BYN=[["YES","Yes"],["NO","No"]];                               /* PartnerOrMemberInfo[].PartnerForeignCompFlg (K8) */

/* =====================================================================
   STATE — seed only what is absent (never clobber shell / an import).
   The base 10_state.js already seeds S.pi.status="1"/S.fs.optout="No"/
   S.fs.sec=11; these guards add the rest. Namespaces:
     S.pi  — OrgFirmInfo (identity + both addresses + dates)
     S.fs  — FilingStatus (sections, regime tree, flags, LEI)
     S.aud — the audit half of PartA_GEN2 (44AA/44AB/92E + reports)
     S.pm  — partners/members/trust half of PartA_GEN2
     S.nob — nature of business rows
   Repeating arrays are real JS arrays (constitution rule 12). ============ */
S.pi=S.pi||{};
if(S.pi.status===undefined)   S.pi.status="1";      /* OrgFirmInfo.StatusOrCompanyType */
if(S.pi.country===undefined)  S.pi.country="91";    /* Address.CountryCode (91 = India) */
if(S.pi.mobileCc===undefined) S.pi.mobileCc="91";   /* Address.CountryCodeMobile (91 = India; NRI firm may use another) */
if(S.pi.countryb===undefined) S.pi.countryb="91";   /* AlternateAddress.CountryCode */
if(S.pi.addr2same===undefined)S.pi.addr2same="Y";   /* OrgFirmInfo.SecondaryAdd */
if(!Array.isArray(S.pi.firms))S.pi.firms=[];        /* PartnerInFirm.PartnerInFirmDtls[] */
if(!Array.isArray(S.pi.unlco))S.pi.unlco=[];        /* HeldUnlistedEqShrPrYr…Dtls[] */
S.fs=S.fs||{};
if(S.fs.sec===undefined)      S.fs.sec=11;          /* ReturnFileSec.IncomeTaxSec */
if(S.fs.optout===undefined||S.fs.optout==="No") S.fs.optout="Yes"; /* RE-7(a): OptOldRegimeCurrAY master switch (Yes=old). A fresh return must START in the OLD/default regime — 10_state.js scaffolds "No" (=>115BAC), corrected here to "Yes". An import overrides via impGen (OptOldRegimeCurrAY, always emitted) and an eligible entity elects the new regime through the entity-gated switch below. */
if(S.fs.incBP===undefined)    S.fs.incBP="Y";       /* IncFrmBusOrProf (d(i)) */
if(S.fs.busTrust===undefined) S.fs.busTrust="N";    /* BusinessTrustFlag */
if(S.fs.invFund===undefined)  S.fs.invFund="N";     /* InvstmntFundRefrdSec115UB */
if(S.fs.resStatus===undefined)S.fs.resStatus="RES"; /* ResidentialStatus */
if(S.fs.foreignExch===undefined)S.fs.foreignExch="N"; /* ForeignExchangeFlag */
if(S.fs.startupDPIIT===undefined)S.fs.startupDPIIT="N"; /* StartUpDPIITFlag */
if(S.fs.interMinCert===undefined)S.fs.interMinCert="N"; /* InterMinisterialCertFlag */
if(S.fs.ifMSME===undefined)   S.fs.ifMSME="N";      /* ifMSME */
if(S.fs.fpi===undefined)      S.fs.fpi="N";         /* FiiFpiFlag */
if(S.fs.rep===undefined)      S.fs.rep="N";         /* AsseseeRepFlg */
if(S.fs.partner===undefined)  S.fs.partner="N";     /* PartnerInFirmFlg */
if(S.fs.unl===undefined)      S.fs.unl="N";         /* HeldUnlistedEqShrPrYrFlg */
if(S.fs.repCc===undefined)    S.fs.repCc="91";      /* AssesseeRep.CountryCodeRepMobileNo */
if(S.fs.duedate===undefined)  S.fs.duedate="2026-08-31"; /* ItrFilingDueDate (business, non-audit) */
S.aud=S.aud||{};
if(S.aud.sec44AA===undefined) S.aud.sec44AA="N";    /* LiableSec44AAflg (a1) */
if(S.aud.incDclrdUs===undefined)S.aud.incDclrdUs="N"; /* IncDclrdUs (a2) */
if(S.aud.sec44AB===undefined) S.aud.sec44AB="N";    /* LiableSec44ABflg (b) */
if(S.aud.acctFlg===undefined) S.aud.acctFlg="N";    /* AuditedByAccountantFlg (c) */
if(S.aud.sec92E===undefined)  S.aud.sec92E="N";     /* LiableSec92Eflg (di) */
if(S.aud.acct92E===undefined) S.aud.acct92E="N";    /* AccountAuditFlag (dii a) */
if(!Array.isArray(S.aud.oth)) S.aud.oth=[];         /* AuditDetails[] (diii) */
if(!Array.isArray(S.aud.act)) S.aud.act=[];         /* AuditReportDetails[] (e) */
S.pm=S.pm||{};
if(S.pm.prevChange===undefined)S.pm.prevChange="N"; /* PrevYrMemPartChange (A/K3) */
if(!Array.isArray(S.pm.prev))  S.pm.prev=[];        /* PrevYrMemPartDtls[] */
if(!Array.isArray(S.pm.members))S.pm.members=[];    /* PartnerOrMemberInfo[] (Table E) */
if(S.pm.isTrust===undefined)   S.pm.isTrust="N";    /* PvtDiscretioneryTrust on-switch (Section F) */
if(!S.pm.trust)                S.pm.trust={};        /* PvtDiscretioneryTrust fields */
if(!Array.isArray(S.nob))      S.nob=[];            /* NatOfBus.NatureOfBusiness[] */

/* =====================================================================
   ENGINE — engGen(): Part A - General carries NO head of income, so its
   GTI contribution is 0 (a signed integer). It also derives a few switches
   the checks and the summary read: the total member share, the "is Firm"
   flag and whether every member is a company (the AA15 helper column that
   drives the AMT surcharge rate on the AMT screen). No monetary figure
   flows out of this sheet (book §7). =================================== */
function engGen(){
  const C=S.C.gen={income:0};
  isNew();                                   /* regime read — OptOldRegimeCurrAY is the master switch (S.fs.optout) */
  C.isFirm=(S.pi.status==="1");              /* Status = 1-Firm (A14/A29 sub-status rule) */
  /* AA15 = IF(Y15=Z15,"Y","N") — every member is a company (DB helper col) */
  const mem=S.pm.members||[];
  const cos=mem.filter(r=>r.status==="DOMESTIC_COMPANY"||r.status==="FOREIGN_COMPANY").length;
  C.allCompanies=(mem.length>0 && cos===mem.length)?"Y":"N";
  /* V3 = MAX(0, SUM(SharePercentage) − retired-individual share) — total member share */
  const retired=mem.filter(r=>r.status==="IND_RETIRED").reduce((s,r)=>s+N(r.share),0);
  C.shareTotal=Math.max(0,mem.reduce((s,r)=>s+N(r.share),0)-(C.isFirm?retired:0)); /* cf. X4/V3 */
  /* W3 = SUMIF(StatusCode="FOREIGN_COMPANY", SharePercentage) — foreign-company share (B/C check) */
  C.foreignShare=mem.filter(r=>r.status==="FOREIGN_COMPANY").reduce((s,r)=>s+N(r.share),0);
  C.income=0;                                /* identity/eligibility screen — nothing added to GTI */
}

/* =====================================================================
   RENDERER — secGen(): every live (non-hidden) row of the three panels →
   a field. Dropdowns from the lists above; sub-fields gated behind their
   parent "Yes"; the four grids are real repeatable arrays. No hidden row
   (the 115BAC(6) AY-2024-25/2025-26 ladder, the collapsed 10-IFA/rep
   sub-lines and the tax-audit sub-lines) is built (book §9). ============ */
function secGen(){
  const st=S.pi.status||"1", india=(S.pi.country||"91")==="91", indiab=(S.pi.countryb||"91")==="91";
  const nri=(S.fs.resStatus==="NRI"), old=(S.fs.optout==="Yes"), sec=+S.fs.sec;
  /* RE-7(b): entity-gate the concessional-regime switch. Sub-status first char:
     co-op society = 1a/1b/1c/3 (taxStatus() definition). 115BAC applies to a
     non-co-op AOP/BOI (status 14) or AJP (status 9); co-ops elect 115BAD/115BAE;
     firms/LLPs (1) and local authorities (2) have no concessional regime. */
  const subC=st0(S.pi.substatus).charAt(0);
  const isCoop=(st==="14"&&(subC==="1"||subC==="3"));
  const canBAC=((st==="14"&&!isCoop)||st==="9");
  let h="";

  /* ===== PANEL 1 — PERSONAL INFORMATION (OrgFirmInfo, rows 7-24) ===== */
  h+=sub("Personal information — organisation / firm");
  h+=row("Name (firm / organisation)",inp("pi.name",{max:125}),{req:1,ref:"E7 · SurNameOrOrgName"});
  h+=row("Is there any change in the name? If yes, the old name",inp("pi.oldName",{max:125}),{ref:"O7 · OrgOldName"});
  h+=row("PAN",inp("pi.pan",{max:10}),{req:1,ref:"W7 · PAN",hint:"ten characters; the fourth letter is F for a firm"});
  h+=row("LLPIN issued by MCA",inp("pi.llpin",{max:8}),{ref:"LLPINissuedByMCA",hint:"limited-liability partnerships only; eight characters [A-Z0-9-]"});
  h+=row("Status",sel("pi.status",GEN_STATUS,{blank:false}),{req:1,ref:"W12 · StatusOrCompanyType"});
  h+=row("Sub-status",sel("pi.substatus",GEN_SUBSTATUS[st]||[]),{req:1,ref:"AH12 · SubStatus",hint:st==="1"?"a firm must be Partnership Firm or LLP (rules A14 / A29)":""});
  h+=row("Date of formation (DD/MM/YYYY)",dte("pi.formed"),{req:1,ref:"W13 · DateOFFormOrIncorp",hint:"on or before 31 March 2026"});
  h+=row("Date of business commencement (DD/MM/YYYY)",dte("pi.bizStart"),{ref:"DateofBusCommencement"});

  /* ---- Primary address (rows 11-16) ---- */
  h+=sub("Primary address — for communication");
  h+=row("Flat / Door / Block number",inp("pi.addr1",{max:50}),{req:1,ref:"E11 · ResidenceNo"});
  h+=row("Name of premises / building / village",inp("pi.premises",{max:50}),{ref:"O11 · ResidenceName"});
  h+=row("Road / street / post office",inp("pi.road",{max:50}),{ref:"E13 · RoadOrStreet"});
  h+=row("Area or locality",inp("pi.locality",{max:50}),{req:1,ref:"O13 · LocalityOrArea"});
  h+=row("Town / city / district",inp("pi.city",{max:50}),{req:1,ref:"E15 · CityOrTownOrDistrict"});
  h+=row("Country",sel("pi.country",GEN_COUNTRY,{blank:false}),{req:1,ref:"W15 · CountryCode"});
  if(india){
    h+=row("State",sel("pi.state",GEN_STATE),{req:1,ref:"O15 · StateCode"});
    h+=row("PIN code",inp("pi.pin",{max:6}),{ref:"PinCode",hint:"six digits"});
  } else {
    h+=row("State",sel("pi.state",[["99","Foreign"]],{blank:false}),{req:1,ref:"O15 · StateCode"});
    h+=row("Zip code",inp("pi.zip",{max:8}),{ref:"ZipCode"});
  }

  /* ---- Secondary address (rows 17-22) ---- */
  h+=row("Is the secondary address the same as the primary address?",sel("pi.addr2same",GEN_YN,{blank:false}),{req:1,ref:"AQ17 · SecondaryAdd"});
  if(S.pi.addr2same==="N"){
    h+=sub("Secondary address");
    h+=row("Flat / Door / Block number",inp("pi.addr1b",{max:50}),{req:1,ref:"E19 · AlternateAddress.ResidenceNo"});
    h+=row("Name of premises / building / village",inp("pi.premisesb",{max:50}),{ref:"AlternateAddress.ResidenceName"});
    h+=row("Road / street / post office",inp("pi.roadb",{max:50}),{ref:"AlternateAddress.RoadOrStreet"});
    h+=row("Area or locality",inp("pi.localityb",{max:50}),{req:1,ref:"AlternateAddress.LocalityOrArea"});
    h+=row("Town / city / district",inp("pi.cityb",{max:50}),{req:1,ref:"AlternateAddress.CityOrTownOrDistrict"});
    h+=row("Country",sel("pi.countryb",GEN_COUNTRY,{blank:false}),{ref:"AlternateAddress.CountryCode"});
    if(indiab){h+=row("State",sel("pi.stateb",GEN_STATE),{req:1,ref:"AlternateAddress.StateCode"});
      h+=row("PIN code",inp("pi.pinb",{max:6}),{ref:"AlternateAddress.PinCode"});}
    else{h+=row("State",sel("pi.stateb",[["99","Foreign"]],{blank:false}),{req:1,ref:"AlternateAddress.StateCode"});
      h+=row("Zip code",inp("pi.zipb",{max:8}),{ref:"AlternateAddress.ZipCode"});}
  }

  /* ---- Details for communication (rows 23-24) ---- */
  h+=sub("Details for communication");
  h+=row("STD / area code",inp("pi.std",{n:1,max:5}),{ref:"Phone.STDcode"});
  h+=row("Landline / phone number",inp("pi.phone",{n:1,max:12}),{ref:"Phone.PhoneNo"});
  h+=row("Primary mobile of the taxpayer",inp("pi.mobileCc",{n:1,max:5,ph:"Code"})+' '+inp("pi.mobile",{n:1,max:10,ph:"Mobile"}),{req:1,ref:"T24 · MobileNo (CountryCodeMobile)",hint:"country code (91 for India, other codes for an NRI firm) + number"});
  h+=row("Secondary mobile",inp("pi.mobile2Cc",{n:1,max:5,ph:"Code"})+' '+inp("pi.mobile2",{n:1,max:10,ph:"Mobile"}),{ref:"MobileNoSec"});
  h+=row("Primary email of the taxpayer",inp("pi.email",{max:125,ph:"name@example.in"}),{req:1,ref:"E24 · EmailAddress",hint:"receives the copy of ITR-V"});
  h+=row("Secondary email",inp("pi.email2",{max:125}),{ref:"H24 · EmailAddressSecondary"});

  /* ===== PANEL 2 — FILING STATUS (FilingStatus, rows 26-137) ===== */
  h+=sub("Filing status");
  h+=row("Due date for filing return of income",sel("fs.duedate",GEN_DUE,{blank:false}),{req:1,ref:"E26 · ItrFilingDueDate (A43)"});
  h+=row("Filed under section",sel("fs.sec",GEN_SEC,{blank:false}),{req:1,ref:"AF27 · ReturnFileSec.IncomeTaxSec"});
  if([13,14,16,18,20].indexOf(sec)>=0){
    h+=row("Unique number / DIN (notice or order)",inp("fs.noticeNo",{max:100}),{ref:"E31/E32 · ReturnFileSec.NoticeNo"});
    h+=row("Date of such notice or order (DD/MM/YYYY)",dte("fs.noticeDate"),{ref:"W32 · ReturnFileSec.NoticeDate"});
  }
  if([12,17,18,19].indexOf(sec)>=0){
    h+=row("Receipt no. (revised / defective / modified)",inp("fs.receiptNo",{n:1,max:15}),{ref:"E30 · ReceiptNo"});
    h+=row("Date of filing original return (DD/MM/YYYY)",dte("fs.origDate"),{ref:"W30 · OrigRetFiledDate"});
  }
  h+=row("Whether you are a business trust?",sel("fs.busTrust",GEN_YN,{blank:false}),{req:1,ref:"E29 · BusinessTrustFlag"});
  h+=row("Whether you are an investment fund referred to in section 115UB?",sel("fs.invFund",GEN_YN,{blank:false}),{req:1,ref:"W29 · InvstmntFundRefrdSec115UB"});
  h+=row("Residential status",sel("fs.resStatus",GEN_RES,{blank:false}),{req:1,ref:"W33 · ResidentialStatus"});
  h+=row("Do you have income from business or profession for the current AY?",sel("fs.incBP",GEN_YN,{blank:false}),{req:1,ref:"F35 (d(i)) · IncFrmBusOrProf"});

  /* ---- Tax regime — old-regime opt-out via Form 10-IEA (II / d(i) / I(A)) ---- */
  h+=fold("gen_regime","Regime","Tax regime — old / new option (Form 10-IEA · 115BAD · 115BAE)",
    (old?"Old regime":"New regime"),(function(){let g="";
    if(canBAC){                                              /* 115BAC(6) opt-out — non-co-op AOP/BOI or AJP only */
    g+=row("Do you wish to opt for old tax regime for the current AY?",sel("fs.optout",[["Yes","Yes"],["No","No"]],{blank:false}),{req:1,ref:"F51 (II) · OptOldRegimeCurrAY (A51/A59/A60)"});
    if(old){
      g+=row("Have you furnished Form 10-IEA within due date for current AY (choosing old regime)?",sel("fs.f10ieaCurrOld",GEN_YN,{blank:false}),{ref:"G48 (B) · F10IEACurrAYOldRegime"});
      if(S.fs.f10ieaCurrOld==="Y"){
        g+=row("Date of filing of Form 10-IEA for AY 2026-27 (opting out)",dte("fs.f10ieaDateOld"),{ref:"H49 · F10IEADateCurrAYOldTax"});
        g+=row("Acknowledgement number of Form 10-IEA",inp("fs.f10ieaAckOld",{n:1,max:15}),{ref:"H50 · F10IEAAckNoCurrAYOldTax"});
      }
      g+=row("Filed Form 10-IEA within due date for an earlier AY (choosing old regime)?",sel("fs.f10ieaEarlierOld",GEN_YN,{blank:false}),{ref:"r36 (I(A)(i)) · Form10IEAEarlierAYOldRegime (A71)"});
      if(S.fs.f10ieaEarlierOld==="Y"){
        g+=row("Acknowledgement number (earlier-AY 10-IEA, old regime)",inp("fs.f10ieaEarlierAckOld",{n:1,max:15}),{ref:"G38 · Form10IEAEarlierAYAckOldRegime"});
        g+=row("Assessment year",sel("fs.f10ieaEarlierAY",GEN_AYOLD),{ref:"G39 · Form10IEAAssYear"});
      }
    }
    /* ---- new-regime re-entry (I(A)(ii)) ---- */
    g+=row("Have you re-entered the new tax regime by filing Form 10-IEA for a subsequent AY?",sel("fs.f10ieaEarlierNew",GEN_YN,{blank:false}),{ref:"G40 (IA(ii)) · F10IEAEarlierAYNewRegime (A64/A72)"});
    if(S.fs.f10ieaEarlierNew==="Y"){
      g+=row("Acknowledgement number (second 10-IEA, new regime)",inp("fs.f10ieaEarlierAckNew",{n:1,max:15}),{ref:"H43 · Form10IEAEarlierAYAckNewRegime"});
      g+=row("Assessment year",sel("fs.f10ieaEarlierAYNew",GEN_AYNEW),{ref:"H44 · AssYrF10IEANewTaxReg"});
    }
    g+=row("Have you furnished Form 10-IEA for re-entering the new regime in the current AY?",sel("fs.f10ieaCurrNew",GEN_YN,{blank:false}),{ref:"H45 (A(ii)b) · F10IEACurrAYNewRegime (A65-A67)"});
    if(S.fs.f10ieaCurrNew==="Y"){
      g+=row("Date of filing of Form 10-IEA for AY 2026-27 (re-entry)",dte("fs.f10ieaDateNew"),{ref:"H46 · F10IEADateCurrAYNewTax"});
      g+=row("Acknowledgement number of Form 10-IEA",inp("fs.f10ieaAckNew",{n:1,max:15}),{ref:"H47 · F10IEAAckNoCurrAYNewTax"});
    }
    }                                                        /* /canBAC */
    if(isCoop){                                              /* 115BAD / 115BAE — co-operative society only */
    /* ---- 115BAD — co-operative society new regime (d(ii)/d(iii)) ---- */
    g+=sub("Section 115BAD — co-operative society");
    g+=row("Have you opted for new tax regime u/s 115BAD?",sel("fs.newTaxRegime",GEN_YN),{ref:"F76 (d(ii)) · ReturnFileSec.NewTaxRegime"});
    if(S.fs.newTaxRegime==="Y"){
      g+=row("AY in which the option was first exercised",sel("fs.bad115AY",GEN_BADAY),{ref:"F78 · ReturnFileSec.Section115BADAY"});
      g+=row("Date of filing of Form 10-IF (DD/MM/YYYY)",dte("fs.form10IFDate"),{ref:"F79 · ReturnFileSec.Form10IFDate"});
      g+=row("Acknowledgement number of Form 10-IF",inp("fs.form10IFAck",{n:1,max:15}),{ref:"F80 · ReturnFileSec.Form10IFAckNo"});
    } else if(S.fs.newTaxRegime==="N"){
      g+=row("Option for the current AY",sel("fs.optNew",GEN_OPTNEW),{ref:"F81 (d(iii)) · ReturnFileSec.OptingNewTaxRegime"});
      if(String(S.fs.optNew)==="1"){
        g+=row("Date of filing of Form 10-IF (DD/MM/YYYY)",dte("fs.form10IFDate"),{ref:"F82 · ReturnFileSec.Form10IFDate"});
        g+=row("Acknowledgement number of Form 10-IF",inp("fs.form10IFAck",{n:1,max:15}),{ref:"F83 · ReturnFileSec.Form10IFAckNo"});
      }
    }
    /* ---- 115BAE — new manufacturing co-operative society (d(iv)) ---- */
    g+=sub("Section 115BAE — new manufacturing co-operative society");
    g+=row("New manufacturing co-op society: were you required to furnish the return for AY 2024-25 / 2025-26?",sel("fs.baeReturn",GEN_YN),{ref:"F85 (d(iv)) · 115BAEReturnFiling_24_25 (A44)"});
    if(S.fs.baeReturn==="Y"){
      g+=row("Have you exercised the option u/s 115BAE (opting new regime)?",sel("fs.baeYes",GEN_YN),{ref:"F92 (a) · OptingTaxation115BAEYes"});
    } else if(S.fs.baeReturn==="N"){
      g+=row("Do you wish to exercise the option u/s 115BAE (opting new regime)?",sel("fs.baeNo",GEN_YN),{ref:"F96 (b) · OptingTaxation115BAENo"});
    }
    if(S.fs.baeYes==="Y"||S.fs.baeNo==="Y"){
      g+=row("Date of filing of Form 10-IFA (DD/MM/YYYY)",dte("fs.form10IFADate"),{ref:"F93/F97 · Form10IFADate"});
      g+=row("Acknowledgement number of Form 10-IFA",inp("fs.form10IFAAck",{n:1,max:15}),{ref:"F94/F98 · Form10IFAAckNo"});
    }
    }                                                        /* /isCoop */
    if(!canBAC&&!isCoop)                                     /* firm / LLP / local authority — no concessional regime */
      g+=note("A firm / LLP or local authority has no concessional tax regime (section 115BAC / 115BAD / 115BAE do not apply); the return is taxed at the applicable flat rate.");
    return g;})(),{def:false});

  /* ---- Eligibility / recognition flags (rows 100-108) ---- */
  h+=sub("Recognition and other flags");
  h+=note("The IFSC-unit question (E100) carries no schema key in ITR-5, so it is not built (constitution rule 3).");
  h+=row("Recognised as a start-up by DPIIT?",sel("fs.startupDPIIT",GEN_YN,{blank:false}),{req:1,ref:"E101 · StartUpDPIITFlag"});
  if(S.fs.startupDPIIT==="Y") h+=row("DPIIT start-up recognition number",inp("fs.dpiitNum",{max:50}),{ref:"W101 · RecgnNumAllottedByDPIIT"});
  h+=row("Certificate from inter-ministerial board received?",sel("fs.interMinCert",GEN_YN,{blank:false}),{req:1,ref:"E102 · InterMinisterialCertFlag"});
  if(S.fs.interMinCert==="Y") h+=row("Certification number",inp("fs.certNum",{max:50}),{ref:"W102 · CertificationNumber"});
  h+=row("Recognised as an MSME?",sel("fs.ifMSME",GEN_YN,{blank:false}),{req:1,ref:"E103 · ifMSME (A41)"});
  if(S.fs.ifMSME==="Y") h+=row("MSMED Act, 2006 registration number",inp("fs.msmeNum",{max:50}),{req:1,ref:"W103 · RegNumMSMEDAct2006 (A41)"});
  if(nri){
    h+=row("Non-resident: is there a permanent establishment (PE) in India?",sel("fs.nriPE",GEN_YN),{ref:"E104 · NRI_PE"});
    h+=row("Non-resident: is there a significant economic presence (SEP) in India?",sel("fs.nriSEP",GEN_SEP),{ref:"E105 · NriSEPinIndia"});
    if(S.fs.nriSEP==="Y"){
      h+=row("Aggregate of payments arising from the transaction(s)",inp("fs.sepPay",{n:1}),{ref:"E106 · AggrPaymentTransac"});
      h+=row("Number of users in India (Expl. 2A(b) to s.9(1)(i))",inp("fs.sepUsers",{n:1}),{ref:"E107 · NumberOfUsers"});
    }
  }
  h+=row("Whether you are an FII / FPI?",sel("fs.fpi",GEN_YN,{blank:false}),{req:1,ref:"E108 · FiiFpiFlag"});
  if(S.fs.fpi==="Y") h+=row("SEBI registration number",inp("fs.sebi",{max:12}),{ref:"W108 · SebiRegnNo"});
  h+=row("Whether covered under section 90/90A/91 (foreign-exchange remittance)?",sel("fs.foreignExch",GEN_YN,{blank:false}),{req:1,ref:"ForeignExchangeFlag"});

  /* ---- Representative assessee (P, rows 109-112) ---- */
  h+=row("Is this return filed by a representative assessee?",sel("fs.rep",GEN_YN,{blank:false}),{req:1,ref:"F109 (P) · AsseseeRepFlg (A5/A6)"});
  if(S.fs.rep==="Y"){
    h+=row("Name of representative assessee",inp("fs.repName",{max:125}),{req:1,ref:"F110 · AssesseeRep.RepName"});
    h+=row("Email of representative assessee",inp("fs.repEmail",{max:125}),{req:1,ref:"F111 · AssesseeRep.RepEmailID"});
    h+=row("Contact number of representative assessee",inp("fs.repCc",{n:1,max:5,ph:"Code"})+' '+inp("fs.repMobile",{n:1,max:10,ph:"Mobile"}),{req:1,ref:"F112 · AssesseeRep.RepMobileNo"});
  }

  /* ---- Partner in a firm (q, rows 117-122) ---- */
  h+=row("Whether you are a partner in a firm?",sel("fs.partner",GEN_YN,{blank:false}),{req:1,ref:"F117 (q) · PartnerInFirmFlg"});
  if(S.fs.partner==="Y"){
    h+=grid("pi.firms",[
      {k:"name",h:"Name of firm",t:"txt",max:125,req:1,w:"320px"},
      {k:"pan",h:"PAN",t:"txt",max:10,req:1,w:"140px"}],
      S.pi.firms,{add:"Add a firm",empty:"No firm entered — at least one row is mandatory when this is Yes (note r124).",min:"480px"});
  }

  /* ---- Unlisted equity shares (r, rows 125-132) ---- */
  h+=row("Held unlisted equity shares at any time during the year?",sel("fs.unl",GEN_YN,{blank:false}),{req:1,ref:"F125 (r) · HeldUnlistedEqShrPrYrFlg (A4)"});
  if(S.fs.unl==="Y"){
    h+=grid("pi.unlco",[
      {k:"name",h:"Company",t:"txt",max:125,req:1,w:"200px"},
      {k:"type",h:"Type",t:"sel",opts:GEN_COTYPE,req:1,w:"120px"},
      {k:"pan",h:"PAN",t:"txt",max:10,w:"130px"},
      {k:"obNo",h:"Opening no.",t:"num",req:1,w:"110px"},
      {k:"obCost",h:"Opening cost",t:"num",req:1,w:"120px"},
      {k:"acqNo",h:"Acquired no.",t:"num",w:"110px"},
      {k:"subDate",h:"Date of purchase",t:"date",w:"130px"},
      {k:"faceVal",h:"Face value",t:"num",w:"110px"},
      {k:"issuePrice",h:"Issue price",t:"num",w:"110px"},
      {k:"purchPrice",h:"Purchase price",t:"num",w:"120px"},
      {k:"trnfNo",h:"Transfer no.",t:"num",w:"110px"},
      {k:"trnfCons",h:"Sale consideration",t:"num",w:"140px"},
      {k:"cbNo",h:"Closing no.",t:"num",req:1,w:"110px"},
      {k:"cbCost",h:"Closing cost",t:"num",req:1,w:"120px"}],
      S.pi.unlco,{add:"Add a company",empty:"No company entered — at least one row is mandatory when this is Yes (note r134).",min:"1700px"});
  }

  /* ---- LEI (s, rows 135-137) ---- */
  h+=sub("Legal Entity Identifier (mandatory if refund is 50 crore or more)");
  h+=row("LEI number",inp("fs.lei",{max:20}),{ref:"F136 · LEIDtls.LEINumber"});
  h+=row("Valid up to (DD/MM/YYYY)",dte("fs.leiValid"),{ref:"F137 · LEIDtls.ValidUptoDate"});

  /* ===== PANEL 3 — AUDIT INFORMATION (PartA_GEN2 audit half, rows 138-180) ===== */
  h+=sub("Audit information");
  h+=row("Liable to maintain accounts as per section 44AA?",sel("aud.sec44AA",GEN_YN,{blank:false}),{req:1,ref:"F139 (a1) · LiableSec44AAflg (A11/A13)"});
  h+=row("Declaring income only under 44AD/44ADA/44AE/44B/44BB/44BBA/44BBC/44BBD?",sel("aud.incDclrdUs",GEN_YN,{blank:false}),{req:1,ref:"F140 (a2) · IncDclrdUs"});
  if(S.aud.incDclrdUs==="N"){
    h+=row("Range of total sales / turnover / gross receipts",sel("aud.salesBand",GEN_SALES),{ref:"F141 (a2i) · TotalSalesExcOneCr"});
    if(S.aud.salesBand==="Upto10CR"){
      h+=row("Percentage of amounts received in cash / non-a-c-payee",sel("aud.pctRcvd",GEN_PCT5),{ref:"F142 (a2ii) · AgrOFAllAmtsRcvd (A45)"});
      h+=row("Percentage of payments made in cash / non-a-c-payee",sel("aud.pctPaid",GEN_PCT5),{ref:"F143 (a2iii) · AgrOFAllPayMade (A46)"});
    }
  }
  h+=row("Liable for audit under section 44AB?",sel("aud.sec44AB",GEN_YN,{blank:false}),{req:1,ref:"F144 (b) · LiableSec44ABflg (A2/A42)"});
  if(S.aud.sec44AB==="Y"){
    h+=row("Condition by which liable to audit u/s 44AB",sel("aud.cnd44AB",GEN_CND44AB),{req:1,ref:"F145 · Cndnfor44AB (A42)"});
    if(S.aud.cnd44AB==="bii"){
      h+=row("Assessee falling u/s 44AD?",sel("aud.bii44AD",GEN_YN),{ref:"BiiDetails.44AD",ind:1});
      h+=row("Assessee falling u/s 44ADA?",sel("aud.bii44ADA",GEN_YN),{ref:"BiiDetails.44ADA",ind:1});
      h+=row("Assessee falling u/s 44AE?",sel("aud.bii44AE",GEN_YN),{ref:"BiiDetails.44AE",ind:1});
      h+=row("Assessee falling u/s 44BB?",sel("aud.bii44BB",GEN_YN),{ref:"BiiDetails.44BB",ind:1});
    }
    h+=row("Have the accounts been audited by an accountant?",sel("aud.acctFlg",GEN_YN,{blank:false}),{ref:"F149 (c) · AuditedByAccountantFlg"});
    if(S.aud.acctFlg==="Y"){
      h+=row("Date of furnishing of the audit report (DD/MM/YYYY)",dte("aud.repDate"),{ref:"F150 (i) · AuditInfo.AuditReportFurnishDate"});
      h+=row("Acknowledgement number of the audit report",inp("aud.repAck",{n:1,max:15}),{ref:"F151 (ii) · AuditInfo.AckNum44AB"});
      h+=row("Name of the auditor (proprietorship / firm)",inp("aud.frmName",{max:125}),{ref:"F154 (iii) · AuditInfo.AudFrmName"});
      h+=row("PAN of the auditor (proprietorship / firm)",inp("aud.frmPAN",{max:10}),{req:1,ref:"F156 (iv) · AuditInfo.AudFrmPAN"});
      h+=row("Aadhaar of the auditor (proprietorship)",inp("aud.frmAadhaar",{max:12}),{ref:"F157 · AuditInfo.AudFrmAadhaar"});
    }
  }
  h+=row("Are you liable for audit u/s 92E?",sel("aud.sec92E",GEN_YN,{blank:false}),{req:1,ref:"F160 (di) · LiableSec92Eflg (A1)"});
  if(S.aud.sec92E==="Y"){
    h+=row("If yes, have the accounts been audited u/s 92E?",sel("aud.acct92E",GEN_YN,{blank:false}),{ref:"F161 (dii a) · AccountAuditFlag"});
    if(S.aud.acct92E==="Y"){
      h+=row("Date of furnishing 92E audit report (DD/MM/YYYY)",dte("aud.date92E"),{req:1,ref:"F162 · AuditDetails92E.DateOfAudit"});
      h+=row("Acknowledgement number of 92E audit report",inp("aud.ack92E",{n:1,max:15}),{req:1,ref:"F163 · AuditDetails92E.AckNum92E"});
    }
  }
  /* ---- other Income-tax-Act audit reports (diii, rows 165-170) ---- */
  h+=sub("Other audit reports under the Income-tax Act (diii)");
  h+=grid("aud.oth",[
    {k:"sec",h:"Section code",t:"sel",opts:GEN_AUDSEC,req:1,w:"150px"},
    {k:"flag",h:"Furnished?",t:"sel",opts:GEN_YN,req:1,w:"110px"},
    {k:"date",h:"Date",t:"date",w:"130px"},
    {k:"ack",h:"Acknowledgement no.",t:"num",w:"170px"}],
    S.aud.oth,{add:"Add an audit report",empty:"None.",min:"620px"});
  /* ---- audits under an Act other than the Income-tax Act (e, rows 174-180) ---- */
  h+=sub("Audits under an Act other than the Income-tax Act (e)");
  h+=grid("aud.act",[
    {k:"act",h:"Act",t:"sel",opts:GEN_AUDACT,req:1,w:"300px"},
    {k:"actOther",h:"If Others, name the Act",t:"txt",max:50,w:"200px"},
    {k:"section",h:"Section",t:"txt",max:30,req:1,w:"140px"},
    {k:"flag",h:"Audited?",t:"sel",opts:GEN_YN,req:1,w:"110px"},
    {k:"date",h:"Date",t:"date",w:"130px"}],
    S.aud.act,{add:"Add an audit",empty:"None.",min:"920px"});

  /* ===== PART A - GENERAL(2) — PARTNERS / MEMBERS / TRUST INFORMATION ===== */
  h+=sub("Partners / members / trust information — PART A - GENERAL(2)");
  /* Table A — change during the year (rows 3-6) */
  h+=row("Was there any change during the year in the partners/members?",sel("pm.prevChange",GEN_YN,{blank:false}),{req:1,ref:"K3 · PrevYrMemPartChange (A76)",hint:"societies/co-op banks: give Managing Committee changes"});
  if(S.pm.prevChange==="Y"){
    h+=grid("pm.prev",[
      {k:"name",h:"Name of partner/member",t:"txt",max:125,req:1,w:"220px"},
      {k:"admret",h:"Admitted / Retired",t:"sel",opts:GEN_ADMRET,req:1,w:"150px"},
      {k:"pan",h:"PAN",t:"txt",max:10,req:1,w:"130px"},
      {k:"date",h:"Date of adm./ret.",t:"date",req:1,w:"140px"},
      {k:"remun",h:"Remuneration (retiring)",t:"num",req:1,w:"150px"},
      {k:"share",h:"% share",t:"num",req:1,w:"100px"}],
      S.pm.prev,{add:"Add a change",empty:"At least one row is mandatory when the answer above is Yes (A76).",min:"900px"});
  }
  /* Questions B, C, D (rows 8-10) — stored on the first PartnerOrMemberInfo row on export */
  h+=row("B. Is any member of the AOP/BOI / executor of AJP a foreign company?",sel("pm.bForeign",GEN_BYN),{ref:"K8 · PartnerOrMemberInfo[].PartnerForeignCompFlg"});
  if(S.pm.bForeign==="YES") h+=row("C. Percentage of share of that foreign company",inp("pm.cPct",{n:1}),{ref:"K9 · PercentageOfShareForeignComp (A33)"});
  h+=row("D. Does any member's total income (excl. their share) exceed the basic exemption?",sel("pm.dExceeds",GEN_YN),{ref:"K10 · TotIncFrmMemberOfAop"});
  /* Table E — particulars of partners/members (rows 11-25) */
  h+=grid("pm.members",[
    {k:"name",h:"Name",t:"txt",max:125,req:1,w:"180px"},
    {k:"addr",h:"Address",t:"txt",max:200,req:1,w:"200px"},
    {k:"city",h:"City",t:"txt",max:50,req:1,w:"130px"},
    {k:"state",h:"State",t:"sel",opts:GEN_STATE,req:1,w:"150px"},
    {k:"country",h:"Country",t:"sel",opts:GEN_COUNTRY,req:1,w:"150px"},
    {k:"pin",h:"PIN",t:"num",w:"100px"},
    {k:"zip",h:"Zip",t:"txt",max:8,w:"90px"},
    {k:"share",h:"% share",t:"num",req:1,w:"90px"},
    {k:"pan",h:"PAN",t:"txt",max:10,w:"130px"},
    {k:"aadhaar",h:"Aadhaar",t:"txt",max:12,w:"130px"},
    {k:"dpin",h:"DPIN (LLP)",t:"txt",max:8,w:"110px"},
    {k:"status",h:"Status",t:"sel",opts:GEN_PMSTATUS,req:1,w:"180px"},
    {k:"roi",h:"Rate of interest",t:"num",req:1,w:"120px"},
    {k:"remun",h:"Remuneration",t:"num",req:1,w:"130px"}],
    S.pm.members,{add:"Add a partner / member",empty:"No partner / member entered.",min:"1780px"});
  /* Section F — private discretionary trust s.160(1)(iii)/(iv) (rows 27-35) */
  h+=row("Is this a person referred to in section 160(1)(iii) or (iv) (private discretionary trust)?",sel("pm.isTrust",GEN_YN,{blank:false}),{ref:"C27 · PvtDiscretioneryTrust"});
  if(S.pm.isTrust==="Y"){
    h+=row("Whether the shares of the beneficiary are determinate or known?",sel("pm.trust.share",GEN_YN,{blank:false}),{req:1,ref:"M28 · PvtDiscTrustShareFlg"});
    h+=row("Whether the s.160(1)(iv) person has business income?",sel("pm.trust.busInc",GEN_YN,{blank:false}),{req:1,ref:"M29 · PvtDiscTrustBusIncFlg"});
    h+=row("Declared by will / exclusively for a dependent relative / only trust declared?",sel("pm.trust.will",GEN_YN),{ref:"M30 · PvtDiscTrustWillFlg"});
    h+=row("(i) All beneficiaries have income below the basic exemption limit?",sel("pm.trust.basic",GEN_YN),{ref:"M32 · PvtDiscTrustBasicFlg"});
    h+=row("(ii) Relevant income receivable under a will and the only such trust?",sel("pm.trust.receivable",GEN_YN),{ref:"M33 · PvtDiscTrustReceivableFlg"});
    h+=row("(iii) Non-testamentary trust before 01-03-1970 for relatives/HUF members?",sel("pm.trust.relatives",GEN_YN),{ref:"M34 · PvtDiscTrustRelativesFlg"});
    h+=row("(iv) On behalf of a PF/superannuation/gratuity/pension/other bona-fide fund?",sel("pm.trust.busProf",GEN_YN),{ref:"M35 · PvtDiscTrustBusProfFlg"});
  }
  /* Nature of business (rows 37-43) */
  h+=sub("Nature of business / profession (other than 44AD / 44ADA / 44AE)");
  h+=grid("nob",[
    {k:"code",h:"Code",t:"sel",opts:GEN_NOB,req:1,w:"420px"},
    {k:"trade",h:"Trade name",t:"txt",max:125,w:"200px"},
    {k:"desc",h:"Description",t:"txt",max:125,w:"220px"}],
    S.nob,{add:"Add a nature of business",empty:"No nature of business entered — mandatory in ITR (A11).",min:"900px"});

  return h;
}

/* =====================================================================
   EXPORT — expGen(j): write PartA_GEN1 (OrgFirmInfo + FilingStatus) and
   PartA_GEN2 (audit half + AuditInfo + partners/members/trust + NatOfBus)
   onto j. put() skips empty values; the SKEL skeleton keeps every required
   leaf present at nil, so a blank field falls back to its skeleton default.
   Repeating tables are real JSON arrays (constitution rule 12). ========= */
function expGen(j){
  const india=(S.pi.country||"91")==="91", nri=(S.fs.resStatus==="NRI"), sec=+S.fs.sec, old=(S.fs.optout==="Yes");
  const oPut=(o,k,v)=>{if(v!==undefined&&v!==null&&v!=="")o[k]=v;};
  const putArr=(p,a)=>{if(a&&a.length)put(j,p,a);};

  /* ---------- PartA_GEN1 · OrgFirmInfo ---------- */
  put(j,"PartA_GEN1.OrgFirmInfo.AssesseeName.SurNameOrOrgName",sv(S.pi.name));
  put(j,"PartA_GEN1.OrgFirmInfo.AssesseeName.OrgOldName",sv(S.pi.oldName));
  put(j,"PartA_GEN1.OrgFirmInfo.PAN",sv(S.pi.pan&&String(S.pi.pan).toUpperCase()));
  put(j,"PartA_GEN1.OrgFirmInfo.LLPINissuedByMCA",sv(S.pi.llpin));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.ResidenceNo",sv(S.pi.addr1));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.ResidenceName",sv(S.pi.premises));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.RoadOrStreet",sv(S.pi.road));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.LocalityOrArea",sv(S.pi.locality));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.CityOrTownOrDistrict",sv(S.pi.city));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.StateCode",sv(india?S.pi.state:"99"));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.CountryCode",sv(S.pi.country||"91"));
  if(india){if(S.pi.pin)put(j,"PartA_GEN1.OrgFirmInfo.Address.PinCode",R(S.pi.pin));}
  else if(S.pi.zip)put(j,"PartA_GEN1.OrgFirmInfo.Address.ZipCode",sv(S.pi.zip));
  if(st0(S.pi.std)&&st0(S.pi.phone)){                          /* Phone.STDcode/PhoneNo — required as a pair when present */
    put(j,"PartA_GEN1.OrgFirmInfo.Address.Phone.STDcode",R(S.pi.std));
    put(j,"PartA_GEN1.OrgFirmInfo.Address.Phone.PhoneNo",R(S.pi.phone));
  }
  if(st0(S.pi.mobile)){put(j,"PartA_GEN1.OrgFirmInfo.Address.CountryCodeMobile",R(S.pi.mobileCc||91));
    put(j,"PartA_GEN1.OrgFirmInfo.Address.MobileNo",R(S.pi.mobile));}
  if(st0(S.pi.mobile2)){put(j,"PartA_GEN1.OrgFirmInfo.Address.CountryCodeMobileNoSec",R(S.pi.mobile2Cc||91));
    put(j,"PartA_GEN1.OrgFirmInfo.Address.MobileNoSec",R(S.pi.mobile2));}
  put(j,"PartA_GEN1.OrgFirmInfo.Address.EmailAddress",sv(S.pi.email));
  put(j,"PartA_GEN1.OrgFirmInfo.Address.EmailAddressSecondary",sv(S.pi.email2));
  put(j,"PartA_GEN1.OrgFirmInfo.SecondaryAdd",sv(S.pi.addr2same||"Y"));
  if(S.pi.addr2same==="N"){const ib=(S.pi.countryb||"91")==="91";
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.ResidenceNo",sv(S.pi.addr1b));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.ResidenceName",sv(S.pi.premisesb));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.RoadOrStreet",sv(S.pi.roadb));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.LocalityOrArea",sv(S.pi.localityb));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.CityOrTownOrDistrict",sv(S.pi.cityb));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.StateCode",sv(ib?S.pi.stateb:"99"));
    put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.CountryCode",sv(S.pi.countryb||"91"));
    if(ib){if(S.pi.pinb)put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.PinCode",R(S.pi.pinb));}
    else if(S.pi.zipb)put(j,"PartA_GEN1.OrgFirmInfo.AlternateAddress.ZipCode",sv(S.pi.zipb));
  }
  put(j,"PartA_GEN1.OrgFirmInfo.DateOFFormOrIncorp",ISO(S.pi.formed));
  if(S.pi.bizStart)put(j,"PartA_GEN1.OrgFirmInfo.DateofBusCommencement",ISO(S.pi.bizStart));
  put(j,"PartA_GEN1.OrgFirmInfo.StatusOrCompanyType",sv(S.pi.status||"1"));
  {const _sc=GEN_SUBSTATUS_CODE[st0(S.pi.substatus)]; if(_sc)put(j,"PartA_GEN1.OrgFirmInfo.SubStatus",sv(_sc));}  /* util label -> schema code; omitted where no code exists (e.g. Local Authority) */

  /* ---------- PartA_GEN1 · FilingStatus ---------- */
  put(j,"PartA_GEN1.FilingStatus.ReturnFileSec.IncomeTaxSec",R(sec||11));
  if([13,14,16,18,20].indexOf(sec)>=0){
    put(j,"PartA_GEN1.FilingStatus.ReturnFileSec.NoticeNo",sv(S.fs.noticeNo));
    put(j,"PartA_GEN1.FilingStatus.ReturnFileSec.NoticeDate",ISO(S.fs.noticeDate));
  }
  put(j,"PartA_GEN1.FilingStatus.IncFrmBusOrProf",sv(S.fs.incBP||"Y"));
  put(j,"PartA_GEN1.FilingStatus.OptOldRegimeCurrAY",old?"Y":"N");
  if(old){
    if(S.fs.f10ieaCurrOld){put(j,"PartA_GEN1.FilingStatus.F10IEACurrAYOldRegime",sv(S.fs.f10ieaCurrOld));
      if(S.fs.f10ieaCurrOld==="Y"){put(j,"PartA_GEN1.FilingStatus.F10IEADateCurrAYOldTax",ISO(S.fs.f10ieaDateOld));
        if(S.fs.f10ieaAckOld)put(j,"PartA_GEN1.FilingStatus.F10IEAAckNoCurrAYOldTax",R(S.fs.f10ieaAckOld));}}
    if(S.fs.f10ieaEarlierOld){put(j,"PartA_GEN1.FilingStatus.Form10IEAEarlierAYOldRegime",sv(S.fs.f10ieaEarlierOld));
      if(S.fs.f10ieaEarlierOld==="Y"){if(S.fs.f10ieaEarlierAckOld)put(j,"PartA_GEN1.FilingStatus.Form10IEAEarlierAYAckOldRegime",R(S.fs.f10ieaEarlierAckOld));
        put(j,"PartA_GEN1.FilingStatus.Form10IEAAssYear",sv(S.fs.f10ieaEarlierAY));}}
  }
  if(S.fs.f10ieaEarlierNew){put(j,"PartA_GEN1.FilingStatus.F10IEAEarlierAYNewRegime",sv(S.fs.f10ieaEarlierNew));
    if(S.fs.f10ieaEarlierNew==="Y"){if(S.fs.f10ieaEarlierAckNew)put(j,"PartA_GEN1.FilingStatus.Form10IEAEarlierAYAckNewRegime",R(S.fs.f10ieaEarlierAckNew));
      put(j,"PartA_GEN1.FilingStatus.AssYrF10IEANewTaxReg",sv(S.fs.f10ieaEarlierAYNew));}}
  if(S.fs.f10ieaCurrNew){put(j,"PartA_GEN1.FilingStatus.F10IEACurrAYNewRegime",sv(S.fs.f10ieaCurrNew));
    if(S.fs.f10ieaCurrNew==="Y"){put(j,"PartA_GEN1.FilingStatus.F10IEADateCurrAYNewTax",ISO(S.fs.f10ieaDateNew));
      if(S.fs.f10ieaAckNew)put(j,"PartA_GEN1.FilingStatus.F10IEAAckNoCurrAYNewTax",R(S.fs.f10ieaAckNew));}}
  if(S.fs.newTaxRegime){put(j,"PartA_GEN1.FilingStatus.ReturnFileSec.NewTaxRegime",sv(S.fs.newTaxRegime));
    /* Form 10-IF (§115BAD/BAE) date+ack is written from a SINGLE place so no
       schema path has two source writers: it applies when opting new via Y, or
       when NewTaxRegime=N and OptingNewTaxRegime=1 (Yes). */
    let want10IF=false;
    if(S.fs.newTaxRegime==="Y"){put(j,"PartA_GEN1.FilingStatus.ReturnFileSec.Section115BADAY",sv(S.fs.bad115AY));
      want10IF=true;}
    else if(S.fs.newTaxRegime==="N"&&S.fs.optNew){put(j,"PartA_GEN1.FilingStatus.ReturnFileSec.OptingNewTaxRegime",R(S.fs.optNew));
      if(String(S.fs.optNew)==="1")want10IF=true;}
    if(want10IF){put(j,"PartA_GEN1.FilingStatus.ReturnFileSec.Form10IFDate",ISO(S.fs.form10IFDate));
      if(S.fs.form10IFAck)put(j,"PartA_GEN1.FilingStatus.ReturnFileSec.Form10IFAckNo",R(S.fs.form10IFAck));}}
  if(S.fs.baeReturn){put(j,"PartA_GEN1.FilingStatus.115BAEReturnFiling_24_25",sv(S.fs.baeReturn));
    if(S.fs.baeReturn==="Y"&&S.fs.baeYes)put(j,"PartA_GEN1.FilingStatus.OptingTaxation115BAEYes",sv(S.fs.baeYes));
    if(S.fs.baeReturn==="N"&&S.fs.baeNo)put(j,"PartA_GEN1.FilingStatus.OptingTaxation115BAENo",sv(S.fs.baeNo));
    if(S.fs.baeYes==="Y"||S.fs.baeNo==="Y"){put(j,"PartA_GEN1.FilingStatus.Form10IFADate",ISO(S.fs.form10IFADate));
      if(S.fs.form10IFAAck)put(j,"PartA_GEN1.FilingStatus.Form10IFAAckNo",R(S.fs.form10IFAAck));}}
  put(j,"PartA_GEN1.FilingStatus.BusinessTrustFlag",sv(S.fs.busTrust||"N"));
  put(j,"PartA_GEN1.FilingStatus.InvstmntFundRefrdSec115UB",sv(S.fs.invFund||"N"));
  if([12,17,18,19].indexOf(sec)>=0){if(S.fs.receiptNo)put(j,"PartA_GEN1.FilingStatus.ReceiptNo",R(S.fs.receiptNo));
    put(j,"PartA_GEN1.FilingStatus.OrigRetFiledDate",ISO(S.fs.origDate));}
  put(j,"PartA_GEN1.FilingStatus.ResidentialStatus",sv(S.fs.resStatus||"RES"));
  put(j,"PartA_GEN1.FilingStatus.ForeignExchangeFlag",sv(S.fs.foreignExch||"N"));
  put(j,"PartA_GEN1.FilingStatus.StartUpDPIITFlag",sv(S.fs.startupDPIIT||"N"));
  if(S.fs.startupDPIIT==="Y")put(j,"PartA_GEN1.FilingStatus.RecgnNumAllottedByDPIIT",sv(S.fs.dpiitNum));
  put(j,"PartA_GEN1.FilingStatus.InterMinisterialCertFlag",sv(S.fs.interMinCert||"N"));
  if(S.fs.interMinCert==="Y")put(j,"PartA_GEN1.FilingStatus.CertificationNumber",sv(S.fs.certNum));
  put(j,"PartA_GEN1.FilingStatus.ifMSME",sv(S.fs.ifMSME||"N"));
  if(S.fs.ifMSME==="Y")put(j,"PartA_GEN1.FilingStatus.RegNumMSMEDAct2006",sv(S.fs.msmeNum));
  if(nri){put(j,"PartA_GEN1.FilingStatus.NRI_PE",sv(S.fs.nriPE));
    put(j,"PartA_GEN1.FilingStatus.NriSEPinIndia",sv(S.fs.nriSEP));
    if(S.fs.nriSEP==="Y"){if(st0(S.fs.sepPay)!=="")put(j,"PartA_GEN1.FilingStatus.AggrPaymentTransac",N(S.fs.sepPay));
      if(st0(S.fs.sepUsers)!=="")put(j,"PartA_GEN1.FilingStatus.NumberOfUsers",N(S.fs.sepUsers));}}
  put(j,"PartA_GEN1.FilingStatus.FiiFpiFlag",sv(S.fs.fpi||"N"));
  if(S.fs.fpi==="Y")put(j,"PartA_GEN1.FilingStatus.SebiRegnNo",sv(S.fs.sebi));
  put(j,"PartA_GEN1.FilingStatus.AsseseeRepFlg",sv(S.fs.rep||"N"));
  if(S.fs.rep==="Y"){put(j,"PartA_GEN1.FilingStatus.AssesseeRep.RepName",sv(S.fs.repName));
    put(j,"PartA_GEN1.FilingStatus.AssesseeRep.RepEmailID",sv(S.fs.repEmail));
    if(st0(S.fs.repMobile)){put(j,"PartA_GEN1.FilingStatus.AssesseeRep.CountryCodeRepMobileNo",R(S.fs.repCc||91));
      put(j,"PartA_GEN1.FilingStatus.AssesseeRep.RepMobileNo",R(S.fs.repMobile));}}
  put(j,"PartA_GEN1.FilingStatus.PartnerInFirmFlg",sv(S.fs.partner||"N"));
  if(S.fs.partner==="Y")putArr("PartA_GEN1.FilingStatus.PartnerInFirm.PartnerInFirmDtls",
    (S.pi.firms||[]).map(r=>{const o={};oPut(o,"NameOfFirm",sv(r.name));
      oPut(o,"PAN",sv(r.pan&&String(r.pan).toUpperCase()));return o;}));
  put(j,"PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYrFlg",sv(S.fs.unl||"N"));
  if(S.fs.unl==="Y")putArr("PartA_GEN1.FilingStatus.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls",
    (S.pi.unlco||[]).map(r=>{const o={};oPut(o,"NameOfCompany",sv(r.name));oPut(o,"CompanyType",sv(r.type||"D"));
      oPut(o,"PAN",sv(r.pan&&String(r.pan).toUpperCase()));
      oPut(o,"OpngBalNumberOfShares",R(r.obNo));oPut(o,"OpngBalCostOfAcquisition",N(r.obCost));
      if(st0(r.acqNo))oPut(o,"ShrAcqDurYrNumberOfShares",R(r.acqNo));oPut(o,"DateOfSubscrPurchase",ISO(r.subDate));
      if(st0(r.faceVal))oPut(o,"FaceValuePerShare",N(r.faceVal));if(st0(r.issuePrice))oPut(o,"IssuePricePerShare",N(r.issuePrice));
      if(st0(r.purchPrice))oPut(o,"PurchasePricePerShare",N(r.purchPrice));if(st0(r.trnfNo))oPut(o,"ShrTrnfNumberOfShares",R(r.trnfNo));
      if(st0(r.trnfCons))oPut(o,"ShrTrnfSaleConsideration",N(r.trnfCons));
      oPut(o,"ClsngBalNumberOfShares",R(r.cbNo));oPut(o,"ClsngBalCostOfAcquisition",N(r.cbCost));return o;}));
  if(st0(S.fs.lei)){put(j,"PartA_GEN1.FilingStatus.LEIDtls.LEINumber",sv(String(S.fs.lei).toUpperCase()));
    put(j,"PartA_GEN1.FilingStatus.LEIDtls.ValidUptoDate",ISO(S.fs.leiValid));}
  put(j,"PartA_GEN1.FilingStatus.ItrFilingDueDate",sv(S.fs.duedate||"2026-08-31"));

  /* ---------- PartA_GEN2 · audit half ---------- */
  put(j,"PartA_GEN2.LiableSec44AAflg",sv(S.aud.sec44AA||"N"));
  put(j,"PartA_GEN2.IncDclrdUs",sv(S.aud.incDclrdUs||"N"));
  if(S.aud.incDclrdUs==="N"){put(j,"PartA_GEN2.TotalSalesExcOneCr",sv(S.aud.salesBand));
    if(S.aud.salesBand==="Upto10CR"){put(j,"PartA_GEN2.AgrOFAllAmtsRcvd",sv(S.aud.pctRcvd));
      put(j,"PartA_GEN2.AgrOFAllPayMade",sv(S.aud.pctPaid));}}
  put(j,"PartA_GEN2.LiableSec44ABflg",sv(S.aud.sec44AB||"N"));
  if(S.aud.sec44AB==="Y"){put(j,"PartA_GEN2.Cndnfor44AB",sv(S.aud.cnd44AB));
    if(S.aud.cnd44AB==="bii"){oPut2(j,"PartA_GEN2.BiiDetails.44AD",sv(S.aud.bii44AD));
      oPut2(j,"PartA_GEN2.BiiDetails.44ADA",sv(S.aud.bii44ADA));oPut2(j,"PartA_GEN2.BiiDetails.44AE",sv(S.aud.bii44AE));
      oPut2(j,"PartA_GEN2.BiiDetails.44BB",sv(S.aud.bii44BB));}
    put(j,"PartA_GEN2.AuditedByAccountantFlg",sv(S.aud.acctFlg));
    if(S.aud.acctFlg==="Y"){put(j,"PartA_GEN2.AuditInfo.AuditReportFurnishDate",ISO(S.aud.repDate));
      if(S.aud.repAck)put(j,"PartA_GEN2.AuditInfo.AckNum44AB",R(S.aud.repAck));
      put(j,"PartA_GEN2.AuditInfo.AudFrmName",sv(S.aud.frmName));
      put(j,"PartA_GEN2.AuditInfo.AudFrmPAN",sv(S.aud.frmPAN&&String(S.aud.frmPAN).toUpperCase()));
      put(j,"PartA_GEN2.AuditInfo.AudFrmAadhaar",sv(S.aud.frmAadhaar));}}
  put(j,"PartA_GEN2.LiableSec92Eflg",sv(S.aud.sec92E||"N"));
  if(S.aud.sec92E==="Y"){put(j,"PartA_GEN2.AccountAuditFlag",sv(S.aud.acct92E||"N"));
    if(S.aud.acct92E==="Y"){put(j,"PartA_GEN2.AuditDetails92E.DateOfAudit",ISO(S.aud.date92E));
      if(S.aud.ack92E)put(j,"PartA_GEN2.AuditDetails92E.AckNum92E",R(S.aud.ack92E));}}
  putArr("PartA_GEN2.AuditDetails",(S.aud.oth||[]).map(r=>{const o={};oPut(o,"AuditedSection",sv(r.sec));
    oPut(o,"AuditFlag",sv(r.flag));oPut(o,"DateOfAudit",ISO(r.date));if(r.ack)oPut(o,"AckNumOth",R(r.ack));return o;}));
  putArr("PartA_GEN2.AuditReportDetails",(S.aud.act||[]).map(r=>{const o={};oPut(o,"AuditReportAct",sv(r.act));
    oPut(o,"AuditReportActOthers",sv(r.actOther));oPut(o,"AuditReportSection",sv(r.section));
    oPut(o,"OtherITActFlag",sv(r.flag));oPut(o,"AuditReportDate",ISO(r.date));return o;}));

  /* ---------- PartA_GEN2 · partners / members / trust / nature of business ---------- */
  put(j,"PartA_GEN2.PrevYrMemPartChange",sv(S.pm.prevChange||"N"));
  if(S.pm.prevChange==="Y")putArr("PartA_GEN2.PrevYrMemPart.PrevYrMemPartDtls",
    (S.pm.prev||[]).map(r=>{const o={};oPut(o,"PartnerName",sv(r.name));oPut(o,"AdmRet",sv(r.admret));
      oPut(o,"PAN",sv(r.pan&&String(r.pan).toUpperCase()));oPut(o,"AdmRetDate",ISO(r.date));
      oPut(o,"RemunerationpaidAmt",R(r.remun));if(st0(r.share)!=="")oPut(o,"SharePercentage",N(r.share));return o;}));
  const mem=(S.pm.members||[]).map(r=>{const o={};oPut(o,"PartnerOrMemberName",sv(r.name));
    const a={};oPut(a,"AddrDetail",sv(r.addr));oPut(a,"CityOrTownOrDistrict",sv(r.city));
    oPut(a,"StateCode",sv(r.state));oPut(a,"CountryCode",sv(r.country||"91"));
    if(st0(r.pin))oPut(a,"PinCode",R(r.pin));oPut(a,"ZipCode",sv(r.zip));
    if(Object.keys(a).length)o.AddressDetailWithZipCode=a;
    if(st0(r.share)!=="")oPut(o,"SharePercentage",N(r.share));oPut(o,"PAN",sv(r.pan&&String(r.pan).toUpperCase()));
    oPut(o,"AadhaarCardNo",sv(r.aadhaar));oPut(o,"LLPIdentificationNo",sv(r.dpin));oPut(o,"Status",sv(r.status));
    if(st0(r.roi)!=="")oPut(o,"RateOfInterest",N(r.roi));oPut(o,"RemunerationPaid",R(r.remun));return o;});
  if(mem.length){                                             /* questions B/C/D ride on the first member row (book §2 of GEN2) */
    if(S.pm.bForeign)mem[0].PartnerForeignCompFlg=st0(S.pm.bForeign);
    if(S.pm.bForeign==="YES"&&st0(S.pm.cPct)!=="")mem[0].PercentageOfShareForeignComp=N(S.pm.cPct);
    if(S.pm.dExceeds)mem[0].TotIncFrmMemberOfAop=st0(S.pm.dExceeds);
    put(j,"PartA_GEN2.PartnerOrMemberInfo",mem);
  }
  if(S.pm.isTrust==="Y"){const t=S.pm.trust||{};
    put(j,"PartA_GEN2.PvtDiscretioneryTrust.PvtDiscTrustShareFlg",sv(t.share));
    put(j,"PartA_GEN2.PvtDiscretioneryTrust.PvtDiscTrustBusIncFlg",sv(t.busInc));
    put(j,"PartA_GEN2.PvtDiscretioneryTrust.PvtDiscTrustWillFlg",sv(t.will));
    put(j,"PartA_GEN2.PvtDiscretioneryTrust.PvtDiscTrustBasicFlg",sv(t.basic));
    put(j,"PartA_GEN2.PvtDiscretioneryTrust.PvtDiscTrustReceivableFlg",sv(t.receivable));
    put(j,"PartA_GEN2.PvtDiscretioneryTrust.PvtDiscTrustRelativesFlg",sv(t.relatives));
    put(j,"PartA_GEN2.PvtDiscretioneryTrust.PvtDiscTrustBusProfFlg",sv(t.busProf));}
  putArr("PartA_GEN2.NatOfBus.NatureOfBusiness",(S.nob||[]).map(r=>{const o={};oPut(o,"Code",sv(r.code));
    oPut(o,"TradeName1",sv(r.trade));oPut(o,"Description",sv(r.desc));return o;}));
}
/* oPut2 — put onto j at a full dotted path but skip empties (for BiiDetails.<digit> keys) */
function oPut2(j,p,v){if(v!==undefined&&v!==null&&v!=="")put(j,p,v);}

/* =====================================================================
   IMPORT — impGen(I5): the inverse; read PartA_GEN1 + PartA_GEN2 back into
   S.pi / S.fs / S.aud / S.pm / S.nob. Returns short labels of what was read
   (constitution rule 12 — export→import→export must be identical). ======= */
function impGen(I5){
  const read=[];
  const g1=(I5&&I5.PartA_GEN1)||{}, OI=g1.OrgFirmInfo||{}, AD=OI.Address||{}, FS=g1.FilingStatus||{};
  const g2=(I5&&I5.PartA_GEN2)||{};
  S.pi=S.pi||{};S.fs=S.fs||{};S.aud=S.aud||{};S.pm=S.pm||{};S.pm.trust=S.pm.trust||{};

  if(OI.AssesseeName){if(OI.AssesseeName.SurNameOrOrgName!=null)S.pi.name=OI.AssesseeName.SurNameOrOrgName;
    if(OI.AssesseeName.OrgOldName!=null)S.pi.oldName=OI.AssesseeName.OrgOldName;read.push("name");}
  if(OI.PAN){S.pi.pan=OI.PAN;read.push("PAN");}
  if(OI.LLPINissuedByMCA!=null)S.pi.llpin=OI.LLPINissuedByMCA;
  if(Object.keys(AD).length){
    if(AD.ResidenceNo!=null)S.pi.addr1=AD.ResidenceNo;if(AD.ResidenceName!=null)S.pi.premises=AD.ResidenceName;
    if(AD.RoadOrStreet!=null)S.pi.road=AD.RoadOrStreet;if(AD.LocalityOrArea!=null)S.pi.locality=AD.LocalityOrArea;
    if(AD.CityOrTownOrDistrict!=null)S.pi.city=AD.CityOrTownOrDistrict;if(AD.StateCode!=null)S.pi.state=AD.StateCode;
    if(AD.CountryCode!=null)S.pi.country=AD.CountryCode;if(AD.PinCode!=null)S.pi.pin=String(AD.PinCode);
    if(AD.ZipCode!=null)S.pi.zip=AD.ZipCode;
    if(AD.Phone){if(AD.Phone.STDcode!=null)S.pi.std=String(AD.Phone.STDcode);if(AD.Phone.PhoneNo!=null)S.pi.phone=String(AD.Phone.PhoneNo);}
    if(AD.CountryCodeMobile!=null)S.pi.mobileCc=String(AD.CountryCodeMobile);
    if(AD.MobileNo!=null)S.pi.mobile=String(AD.MobileNo);
    if(AD.CountryCodeMobileNoSec!=null)S.pi.mobile2Cc=String(AD.CountryCodeMobileNoSec);
    if(AD.MobileNoSec!=null)S.pi.mobile2=String(AD.MobileNoSec);
    if(AD.EmailAddress!=null)S.pi.email=AD.EmailAddress;if(AD.EmailAddressSecondary!=null)S.pi.email2=AD.EmailAddressSecondary;
    read.push("address");}
  if(OI.SecondaryAdd!=null)S.pi.addr2same=OI.SecondaryAdd;
  if(OI.AlternateAddress){const AA=OI.AlternateAddress;
    if(AA.ResidenceNo!=null)S.pi.addr1b=AA.ResidenceNo;if(AA.ResidenceName!=null)S.pi.premisesb=AA.ResidenceName;
    if(AA.RoadOrStreet!=null)S.pi.roadb=AA.RoadOrStreet;if(AA.LocalityOrArea!=null)S.pi.localityb=AA.LocalityOrArea;
    if(AA.CityOrTownOrDistrict!=null)S.pi.cityb=AA.CityOrTownOrDistrict;if(AA.StateCode!=null)S.pi.stateb=AA.StateCode;
    if(AA.CountryCode!=null)S.pi.countryb=AA.CountryCode;if(AA.PinCode!=null)S.pi.pinb=String(AA.PinCode);
    if(AA.ZipCode!=null)S.pi.zipb=AA.ZipCode;read.push("secondary address");}
  if(OI.DateOFFormOrIncorp)S.pi.formed=dmy(OI.DateOFFormOrIncorp)||S.pi.formed;
  if(OI.DateofBusCommencement)S.pi.bizStart=dmy(OI.DateofBusCommencement);
  if(OI.StatusOrCompanyType!=null)S.pi.status=OI.StatusOrCompanyType;
  if(OI.SubStatus!=null)S.pi.substatus=GEN_SUBSTATUS_LABEL[String(OI.SubStatus)]||OI.SubStatus;  /* schema code -> util label the engines parse */

  if(FS.ReturnFileSec){const R2=FS.ReturnFileSec;
    if(R2.IncomeTaxSec!=null){S.fs.sec=R2.IncomeTaxSec;read.push("filing section");}
    if(R2.NoticeNo!=null)S.fs.noticeNo=R2.NoticeNo;if(R2.NoticeDate)S.fs.noticeDate=dmy(R2.NoticeDate);
    if(R2.NewTaxRegime!=null)S.fs.newTaxRegime=R2.NewTaxRegime;if(R2.OptingNewTaxRegime!=null)S.fs.optNew=R2.OptingNewTaxRegime;
    if(R2.Section115BADAY!=null)S.fs.bad115AY=R2.Section115BADAY;if(R2.Form10IFDate)S.fs.form10IFDate=dmy(R2.Form10IFDate);
    if(R2.Form10IFAckNo!=null)S.fs.form10IFAck=String(R2.Form10IFAckNo);}
  if(FS.IncFrmBusOrProf!=null)S.fs.incBP=FS.IncFrmBusOrProf;
  if(FS.OptOldRegimeCurrAY!=null){S.fs.optout=(FS.OptOldRegimeCurrAY==="Y")?"Yes":"No";read.push("regime");}
  if(FS.F10IEACurrAYOldRegime!=null)S.fs.f10ieaCurrOld=FS.F10IEACurrAYOldRegime;
  if(FS.F10IEADateCurrAYOldTax)S.fs.f10ieaDateOld=dmy(FS.F10IEADateCurrAYOldTax);
  if(FS.F10IEAAckNoCurrAYOldTax!=null)S.fs.f10ieaAckOld=String(FS.F10IEAAckNoCurrAYOldTax);
  if(FS.Form10IEAEarlierAYOldRegime!=null)S.fs.f10ieaEarlierOld=FS.Form10IEAEarlierAYOldRegime;
  if(FS.Form10IEAEarlierAYAckOldRegime!=null)S.fs.f10ieaEarlierAckOld=String(FS.Form10IEAEarlierAYAckOldRegime);
  if(FS.Form10IEAAssYear!=null)S.fs.f10ieaEarlierAY=FS.Form10IEAAssYear;
  if(FS.F10IEAEarlierAYNewRegime!=null)S.fs.f10ieaEarlierNew=FS.F10IEAEarlierAYNewRegime;
  if(FS.Form10IEAEarlierAYAckNewRegime!=null)S.fs.f10ieaEarlierAckNew=String(FS.Form10IEAEarlierAYAckNewRegime);
  if(FS.AssYrF10IEANewTaxReg!=null)S.fs.f10ieaEarlierAYNew=FS.AssYrF10IEANewTaxReg;
  if(FS.F10IEACurrAYNewRegime!=null)S.fs.f10ieaCurrNew=FS.F10IEACurrAYNewRegime;
  if(FS.F10IEADateCurrAYNewTax)S.fs.f10ieaDateNew=dmy(FS.F10IEADateCurrAYNewTax);
  if(FS.F10IEAAckNoCurrAYNewTax!=null)S.fs.f10ieaAckNew=String(FS.F10IEAAckNoCurrAYNewTax);
  if(FS["115BAEReturnFiling_24_25"]!=null)S.fs.baeReturn=FS["115BAEReturnFiling_24_25"];
  if(FS.OptingTaxation115BAEYes!=null)S.fs.baeYes=FS.OptingTaxation115BAEYes;
  if(FS.OptingTaxation115BAENo!=null)S.fs.baeNo=FS.OptingTaxation115BAENo;
  if(FS.Form10IFADate)S.fs.form10IFADate=dmy(FS.Form10IFADate);
  if(FS.Form10IFAAckNo!=null)S.fs.form10IFAAck=String(FS.Form10IFAAckNo);
  if(FS.BusinessTrustFlag!=null)S.fs.busTrust=FS.BusinessTrustFlag;
  if(FS.InvstmntFundRefrdSec115UB!=null)S.fs.invFund=FS.InvstmntFundRefrdSec115UB;
  if(FS.ReceiptNo!=null)S.fs.receiptNo=FS.ReceiptNo;if(FS.OrigRetFiledDate)S.fs.origDate=dmy(FS.OrigRetFiledDate);
  if(FS.ResidentialStatus!=null){S.fs.resStatus=FS.ResidentialStatus;read.push("residential status");}
  if(FS.ForeignExchangeFlag!=null)S.fs.foreignExch=FS.ForeignExchangeFlag;
  if(FS.StartUpDPIITFlag!=null)S.fs.startupDPIIT=FS.StartUpDPIITFlag;if(FS.RecgnNumAllottedByDPIIT!=null)S.fs.dpiitNum=FS.RecgnNumAllottedByDPIIT;
  if(FS.InterMinisterialCertFlag!=null)S.fs.interMinCert=FS.InterMinisterialCertFlag;if(FS.CertificationNumber!=null)S.fs.certNum=FS.CertificationNumber;
  if(FS.ifMSME!=null)S.fs.ifMSME=FS.ifMSME;if(FS.RegNumMSMEDAct2006!=null)S.fs.msmeNum=FS.RegNumMSMEDAct2006;
  if(FS.NRI_PE!=null)S.fs.nriPE=FS.NRI_PE;if(FS.NriSEPinIndia!=null)S.fs.nriSEP=FS.NriSEPinIndia;
  if(FS.AggrPaymentTransac!=null)S.fs.sepPay=FS.AggrPaymentTransac;if(FS.NumberOfUsers!=null)S.fs.sepUsers=FS.NumberOfUsers;
  if(FS.FiiFpiFlag!=null)S.fs.fpi=FS.FiiFpiFlag;if(FS.SebiRegnNo!=null)S.fs.sebi=FS.SebiRegnNo;
  if(FS.AsseseeRepFlg!=null)S.fs.rep=FS.AsseseeRepFlg;
  if(FS.AssesseeRep){S.fs.repName=FS.AssesseeRep.RepName;S.fs.repEmail=FS.AssesseeRep.RepEmailID;
    if(FS.AssesseeRep.CountryCodeRepMobileNo!=null)S.fs.repCc=String(FS.AssesseeRep.CountryCodeRepMobileNo);
    if(FS.AssesseeRep.RepMobileNo!=null)S.fs.repMobile=String(FS.AssesseeRep.RepMobileNo);}
  if(FS.PartnerInFirmFlg!=null)S.fs.partner=FS.PartnerInFirmFlg;
  if(FS.PartnerInFirm&&FS.PartnerInFirm.PartnerInFirmDtls){
    S.pi.firms=FS.PartnerInFirm.PartnerInFirmDtls.map(r=>({name:r.NameOfFirm,pan:r.PAN}));read.push("partnerships");}
  if(FS.HeldUnlistedEqShrPrYrFlg!=null)S.fs.unl=FS.HeldUnlistedEqShrPrYrFlg;
  if(FS.HeldUnlistedEqShrPrYr&&FS.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls){
    S.pi.unlco=FS.HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls.map(r=>({name:r.NameOfCompany,type:r.CompanyType,
      pan:r.PAN,obNo:r.OpngBalNumberOfShares,obCost:r.OpngBalCostOfAcquisition,acqNo:r.ShrAcqDurYrNumberOfShares,
      subDate:dmy(r.DateOfSubscrPurchase),faceVal:r.FaceValuePerShare,issuePrice:r.IssuePricePerShare,
      purchPrice:r.PurchasePricePerShare,trnfNo:r.ShrTrnfNumberOfShares,trnfCons:r.ShrTrnfSaleConsideration,
      cbNo:r.ClsngBalNumberOfShares,cbCost:r.ClsngBalCostOfAcquisition}));read.push("unlisted shares");}
  if(FS.LEIDtls){S.fs.lei=FS.LEIDtls.LEINumber;if(FS.LEIDtls.ValidUptoDate)S.fs.leiValid=dmy(FS.LEIDtls.ValidUptoDate);}
  if(FS.ItrFilingDueDate!=null)S.fs.duedate=FS.ItrFilingDueDate;

  if(g2.LiableSec44AAflg!=null)S.aud.sec44AA=g2.LiableSec44AAflg;
  if(g2.IncDclrdUs!=null)S.aud.incDclrdUs=g2.IncDclrdUs;
  if(g2.TotalSalesExcOneCr!=null)S.aud.salesBand=g2.TotalSalesExcOneCr;
  if(g2.AgrOFAllAmtsRcvd!=null)S.aud.pctRcvd=g2.AgrOFAllAmtsRcvd;if(g2.AgrOFAllPayMade!=null)S.aud.pctPaid=g2.AgrOFAllPayMade;
  if(g2.LiableSec44ABflg!=null)S.aud.sec44AB=g2.LiableSec44ABflg;if(g2.Cndnfor44AB!=null)S.aud.cnd44AB=g2.Cndnfor44AB;
  if(g2.BiiDetails){const B=g2.BiiDetails;S.aud.bii44AD=B["44AD"];S.aud.bii44ADA=B["44ADA"];S.aud.bii44AE=B["44AE"];S.aud.bii44BB=B["44BB"];}
  if(g2.AuditedByAccountantFlg!=null)S.aud.acctFlg=g2.AuditedByAccountantFlg;
  if(g2.AuditInfo){const A=g2.AuditInfo;if(A.AuditReportFurnishDate)S.aud.repDate=dmy(A.AuditReportFurnishDate);
    if(A.AckNum44AB!=null)S.aud.repAck=String(A.AckNum44AB);if(A.AudFrmName!=null)S.aud.frmName=A.AudFrmName;
    if(A.AudFrmPAN!=null)S.aud.frmPAN=A.AudFrmPAN;if(A.AudFrmAadhaar!=null)S.aud.frmAadhaar=A.AudFrmAadhaar;}
  if(g2.LiableSec92Eflg!=null)S.aud.sec92E=g2.LiableSec92Eflg;if(g2.AccountAuditFlag!=null)S.aud.acct92E=g2.AccountAuditFlag;
  if(g2.AuditDetails92E){if(g2.AuditDetails92E.DateOfAudit)S.aud.date92E=dmy(g2.AuditDetails92E.DateOfAudit);
    if(g2.AuditDetails92E.AckNum92E!=null)S.aud.ack92E=String(g2.AuditDetails92E.AckNum92E);}
  if(Array.isArray(g2.AuditDetails))S.aud.oth=g2.AuditDetails.map(r=>({sec:r.AuditedSection,flag:r.AuditFlag,date:dmy(r.DateOfAudit),ack:r.AckNumOth}));
  if(Array.isArray(g2.AuditReportDetails))S.aud.act=g2.AuditReportDetails.map(r=>({act:r.AuditReportAct,actOther:r.AuditReportActOthers,section:r.AuditReportSection,flag:r.OtherITActFlag,date:dmy(r.AuditReportDate)}));
  if(g2.LiableSec44AAflg!=null||g2.LiableSec44ABflg!=null)read.push("audit information");
  if(g2.PrevYrMemPartChange!=null)S.pm.prevChange=g2.PrevYrMemPartChange;
  if(g2.PrevYrMemPart&&g2.PrevYrMemPart.PrevYrMemPartDtls)
    S.pm.prev=g2.PrevYrMemPart.PrevYrMemPartDtls.map(r=>({name:r.PartnerName,admret:r.AdmRet,pan:r.PAN,date:dmy(r.AdmRetDate),remun:r.RemunerationpaidAmt,share:r.SharePercentage}));
  if(Array.isArray(g2.PartnerOrMemberInfo)){
    S.pm.members=g2.PartnerOrMemberInfo.map(r=>{const a=r.AddressDetailWithZipCode||{};
      return {name:r.PartnerOrMemberName,addr:a.AddrDetail,city:a.CityOrTownOrDistrict,state:a.StateCode,country:a.CountryCode,
        pin:a.PinCode,zip:a.ZipCode,share:r.SharePercentage,pan:r.PAN,aadhaar:r.AadhaarCardNo,dpin:r.LLPIdentificationNo,
        status:r.Status,roi:r.RateOfInterest,remun:r.RemunerationPaid};});
    const h0=g2.PartnerOrMemberInfo[0]||{};
    if(h0.PartnerForeignCompFlg!=null)S.pm.bForeign=h0.PartnerForeignCompFlg;
    if(h0.PercentageOfShareForeignComp!=null)S.pm.cPct=h0.PercentageOfShareForeignComp;
    if(h0.TotIncFrmMemberOfAop!=null)S.pm.dExceeds=h0.TotIncFrmMemberOfAop;
    read.push("partners/members");}
  if(g2.PvtDiscretioneryTrust){const t=g2.PvtDiscretioneryTrust;S.pm.isTrust="Y";
    S.pm.trust={share:t.PvtDiscTrustShareFlg,busInc:t.PvtDiscTrustBusIncFlg,will:t.PvtDiscTrustWillFlg,
      basic:t.PvtDiscTrustBasicFlg,receivable:t.PvtDiscTrustReceivableFlg,relatives:t.PvtDiscTrustRelativesFlg,busProf:t.PvtDiscTrustBusProfFlg};}
  if(g2.NatOfBus&&Array.isArray(g2.NatOfBus.NatureOfBusiness)){
    S.nob=g2.NatOfBus.NatureOfBusiness.map(r=>({code:r.Code,trade:r.TradeName1,desc:r.Description}));read.push("nature of business");}
  return read;
}

/* =====================================================================
   CHECKS — chkGen(): the sheet's own rules as live messages. Consistency
   of switches, not arithmetic (book §10). ============================== */
function chkGen(){
  const out=[], P=S.pi||{}, F=S.fs||{}, A=S.aud||{}, M=S.pm||{}, C=S.C.gen||{};
  const pan=st0(P.pan).toUpperCase();
  /* Name / PAN */
  if(!st0(P.name)) out.push({lvl:"err",t:"Name required",m:"Enter the firm / organisation name (SurNameOrOrgName).",sec:"gen"});
  if(!pan) out.push({lvl:"err",t:"PAN required",m:"Enter the PAN of the assessee.",sec:"gen"});
  else if(!PAN_RE.test(pan)) out.push({lvl:"err",t:"PAN not valid",m:"The PAN must be five letters, four digits and a letter.",sec:"gen"});
  /* Status / sub-status — A14/A29: Firm ⇒ Partnership Firm or LLP */
  if(!st0(P.substatus)) out.push({lvl:"err",t:"Sub-status required",m:"Select the sub-status for the chosen status.",sec:"gen"});
  else if(P.status==="1"&&["1-Partnership Firm","2-LLP (Limited Liability Partnership)"].indexOf(st0(P.substatus))<0)
    out.push({lvl:"err",t:"Sub-status invalid for a firm",m:"A firm must have sub-status Partnership Firm or LLP (rules A14 / A29).",sec:"gen"});
  /* Date of formation — mandatory, on or before 31 March 2026 */
  const dof=D(P.formed);
  if(!dof) out.push({lvl:"err",t:"Date of formation required",m:"Enter the date of formation in DD/MM/YYYY.",sec:"gen"});
  else if(dof>YREND) out.push({lvl:"err",t:"Date of formation",m:"The date of formation must be on or before 31 March 2026.",sec:"gen"});
  /* Primary address required leaves */
  if(!st0(P.addr1)) out.push({lvl:"err",t:"Address required",m:"Flat / Door / Block number is mandatory.",sec:"gen"});
  if(!st0(P.locality)) out.push({lvl:"err",t:"Address required",m:"Area or locality is mandatory.",sec:"gen"});
  if(!st0(P.city)) out.push({lvl:"err",t:"Address required",m:"Town / city / district is mandatory.",sec:"gen"});
  if(!st0(P.state)) out.push({lvl:"err",t:"State required",m:"Select the state.",sec:"gen"});
  if((P.country||"91")==="91"&&st0(P.pin)&&!/^\d{6}$/.test(st0(P.pin)))
    out.push({lvl:"err",t:"PIN code",m:"The PIN code must be six digits.",sec:"gen"});
  /* Email / mobile */
  if(!st0(P.email)) out.push({lvl:"err",t:"Email required",m:"The primary email is mandatory — it receives the copy of ITR-V.",sec:"gen"});
  else if(!MAIL.test(st0(P.email))) out.push({lvl:"err",t:"Email not valid",m:"Enter a valid primary email address.",sec:"gen"});
  if(!st0(P.mobile)) out.push({lvl:"err",t:"Mobile required",m:"The primary mobile number is mandatory.",sec:"gen"});
  else if(!/^\d{10}$/.test(st0(P.mobile))) out.push({lvl:"warn",t:"Mobile number",m:"The primary mobile number should be ten digits.",sec:"gen"});
  /* Secondary address — mandatory when not the same as primary */
  if(P.addr2same==="N"&&(!st0(P.addr1b)||!st0(P.localityb)||!st0(P.cityb)||!st0(P.stateb)))
    out.push({lvl:"err",t:"Secondary address required",m:"The secondary address (Flat/Door, locality, town, state) is mandatory when it is not the same as the primary.",sec:"gen"});
  /* Due date & filing section (A43) */
  if(!st0(F.duedate)) out.push({lvl:"err",t:"Due date required",m:"Select the applicable due date for filing (rule A43).",sec:"gen"});
  /* MSME (A41) */
  if(F.ifMSME==="Y"&&!st0(F.msmeNum)) out.push({lvl:"err",t:"MSME number required",m:"With MSME = Yes, the MSMED Act, 2006 registration number is mandatory (rule A41).",sec:"gen"});
  /* Representative assessee (A5/A6) */
  if(F.rep==="Y"&&(!st0(F.repName)||!st0(F.repEmail)||!st0(F.repMobile)))
    out.push({lvl:"err",t:"Representative details required",m:"With representative assessee = Yes, name, email and contact are mandatory (rules A5 / A6).",sec:"gen"});
  /* Partner in a firm — ≥1 row when Yes (note r124) */
  if(F.partner==="Y"&&!(S.pi.firms||[]).length)
    out.push({lvl:"err",t:"Firm details required",m:"With 'partner in a firm' = Yes, at least one firm row is mandatory.",sec:"gen"});
  /* Unlisted shares — ≥1 row when Yes (A4) */
  if(F.unl==="Y"&&!(S.pi.unlco||[]).length)
    out.push({lvl:"err",t:"Unlisted-share details required",m:"With 'held unlisted equity shares' = Yes, at least one company row is mandatory (rule A4).",sec:"gen"});
  /* Audit condition & cash-percentage (A42/A45/A46) */
  if(A.sec44AB==="Y"&&!st0(A.cnd44AB))
    out.push({lvl:"err",t:"44AB condition required",m:"Select the condition by which the assessee is liable to audit u/s 44AB (rule A42).",sec:"gen"});
  if(A.sec44AB==="Y"&&A.acctFlg==="Y"&&!st0(A.frmPAN))
    out.push({lvl:"err",t:"Auditor PAN required",m:"The PAN of the auditor (proprietorship / firm) is mandatory.",sec:"gen"});
  if(A.incDclrdUs==="N"&&A.salesBand==="Upto10CR"){
    if(!st0(A.pctRcvd)||!st0(A.pctPaid))
      out.push({lvl:"err",t:"Cash-percentage required",m:"With turnover over ₹1 crore up to ₹10 crores, both cash-percentage fields (a2ii / a2iii) must be filled.",sec:"gen"});
    else if((A.pctRcvd==="MoreThan5Per"||A.pctPaid==="MoreThan5Per")&&A.sec44AB!=="Y")
      out.push({lvl:"warn",t:"Likely liable u/s 44AB",m:"Cash receipts or payments exceed 5% — the assessee is liable to audit u/s 44AB (rules A45 / A46).",sec:"gen"});
  }
  /* 92E acknowledgement (A1) */
  if(A.sec92E==="Y"&&A.acct92E==="Y"&&(!D(A.date92E)||!st0(A.ack92E)))
    out.push({lvl:"err",t:"92E audit detail required",m:"With 92E audit = Yes, the date and acknowledgement number of the 92E report are mandatory.",sec:"gen"});
  /* Audit forces Part A-BS / P&L (A1/A2/A13) */
  if((A.sec44AA==="Y"||A.sec44AB==="Y"||A.sec92E==="Y"))
    out.push({lvl:"warn",t:"Balance sheet & P&L required",m:"When liable to audit u/s 44AA / 44AB / 92E, Part A-BS and Part A-P&L cannot be blank (rules A1 / A2 / A13).",sec:"gen"});
  /* Table A when change = Yes (A76) */
  if(M.prevChange==="Y"&&!(S.pm.prev||[]).length)
    out.push({lvl:"err",t:"Change details required",m:"With a change in partners/members = Yes, at least one admitted/retired row is mandatory (rule A76).",sec:"gen"});
  /* Total share = 100 (A21) — firms/AOP with determinate members */
  if((S.pm.members||[]).length&&Math.abs(C.shareTotal-100)>0.01)
    out.push({lvl:"warn",t:"Total share not 100%",m:"The total percentage of share of the existing partners/members should equal 100 (rule A21). Current: "+(C.shareTotal||0)+"%.",sec:"gen"});
  /* B ⇒ C > 0 (A33) and B/C vs foreign-company member share (W3) */
  if(M.bForeign==="YES"&&!(N(M.cPct)>0))
    out.push({lvl:"err",t:"Foreign-company share required",m:"When a member is a foreign company (B = Yes), the percentage of share (C) cannot be zero (rule A33).",sec:"gen"});
  /* Questions B/C/D ride on the first partner/member row (PartnerOrMemberInfo[0]);
     with an empty grid the answers are silently dropped on export (GEN-2). */
  if((st0(M.bForeign)!==""||st0(M.dExceeds)!=="")&&!(S.pm.members||[]).length)
    out.push({lvl:"err",t:"Partner / member row required",m:"Answers to questions B/C/D (foreign-company member, its share and members' income above the basic exemption) are recorded against the first partner/member row. Add at least one partner/member row so the answer is not lost.",sec:"gen"});
  /* Nature of business mandatory (A11) */
  if(!(S.nob||[]).length)
    out.push({lvl:"err",t:"Nature of business required",m:"Disclosure of the nature of business or profession is mandatory (rule A11).",sec:"gen"});
  if(!out.some(x=>x.lvl==="err")){
    const stat=(GEN_STATUS.find(x=>x[0]===(P.status||"1"))||["","Firm"])[1];
    out.push({lvl:"ok",t:"Who is filing and filing status",m:stat+(pan?" · "+pan:"")+" · "+(F.optout==="Yes"?"old":"new")+" regime · due "+dmy(F.duedate||"2026-08-31")+".",sec:"gen"});
  }
  return out;
}

/* ---- summary + register -------------------------------------------- */
/* seedGen — the section summary shown in the nav (name per the dispatch); the
   real state seeding is done inline above at module load. */
function seedGen(){
  const P=S.pi||{};
  return st0(P.pan)?st0(P.pan).toUpperCase()+(P.name?" · "+st0(P.name):""):"Name, PAN, status, address, audit";
}

reg({id:"gen", t:"Who is filing and filing status", ref:"Part A - General · General(2)",
     f:secGen, s:seedGen, eng:engGen, exp:expGen, imp:impGen, chk:chkGen, order:5, corder:5});
