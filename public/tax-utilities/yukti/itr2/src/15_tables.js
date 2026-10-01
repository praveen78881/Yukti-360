/* ==================================================================
   1 · CODE TABLES — from the ITR-2 utility's DropDownValues
   ================================================================== */
const STATE={"01":"Andaman & Nicobar Islands","02":"Andhra Pradesh","03":"Arunachal Pradesh",
"04":"Assam","05":"Bihar","06":"Chandigarh","07":"Dadra & Nagar Haveli","08":"Daman & Diu",
"09":"Delhi","10":"Goa","11":"Gujarat","12":"Haryana","13":"Himachal Pradesh",
"14":"Jammu & Kashmir","15":"Karnataka","16":"Kerala","17":"Lakshadweep","18":"Madhya Pradesh",
"19":"Maharashtra","20":"Manipur","21":"Meghalaya","22":"Mizoram","23":"Nagaland","24":"Odisha",
"25":"Puducherry","26":"Punjab","27":"Rajasthan","28":"Sikkim","29":"Tamil Nadu","30":"Tripura",
"31":"Uttar Pradesh","32":"West Bengal","33":"Chhattisgarh","34":"Uttarakhand","35":"Jharkhand",
"36":"Telangana","37":"Ladakh","99":"Outside India"};
const PIN2ST={"11":"09","12":"12","13":"12","14":"26","15":"26","16":"06","17":"13","18":"14",
"19":"14","20":"31","21":"31","22":"31","23":"31","24":"31","25":"34","26":"34","27":"31",
"28":"31","30":"27","31":"27","32":"27","33":"27","34":"27","36":"11","37":"11","38":"11",
"39":"11","40":"19","41":"19","42":"19","43":"19","44":"19","45":"18","46":"18","47":"18",
"48":"18","49":"33","50":"36","51":"02","52":"02","53":"02","56":"15","57":"15","58":"15",
"59":"15","60":"29","61":"29","62":"29","63":"29","64":"29","67":"16","68":"16","69":"16",
"70":"32","71":"32","72":"32","73":"32","74":"32","75":"24","76":"24","77":"24","78":"04",
"79":"03","80":"05","81":"05","82":"05","83":"35","84":"05","85":"05"};
const BANK={ABHY:"Abhyudaya Co-op Bank",AUBL:"AU Small Finance Bank",BARB:"Bank of Baroda",
BDBL:"Bandhan Bank",BKID:"Bank of India",CBIN:"Central Bank of India",CIUB:"City Union Bank",
CNRB:"Canara Bank",CSBK:"CSB Bank",DBSS:"DBS Bank India",DCBL:"DCB Bank",
ESFB:"Equitas Small Finance Bank",FDRL:"Federal Bank",HDFC:"HDFC Bank",HSBC:"HSBC India",
IBKL:"IDBI Bank",ICIC:"ICICI Bank",IDFB:"IDFC FIRST Bank",INDB:"IndusInd Bank",
IOBA:"Indian Overseas Bank",IDIB:"Indian Bank",JAKA:"Jammu & Kashmir Bank",KARB:"Karnataka Bank",
KKBK:"Kotak Mahindra Bank",KVBL:"Karur Vysya Bank",MAHB:"Bank of Maharashtra",
PSIB:"Punjab & Sind Bank",PUNB:"Punjab National Bank",RATN:"RBL Bank",SBIN:"State Bank of India",
SIBL:"South Indian Bank",SRCB:"Saraswat Co-op Bank",TMBL:"Tamilnad Mercantile Bank",
UBIN:"Union Bank of India",UCBA:"UCO Bank",UTIB:"Axis Bank",
UTKS:"Utkarsh Small Finance Bank",YESB:"YES Bank"};
const STATUS=[["I","Individual"],["H","Hindu undivided family"]];
const RESIDENTIAL=[["RES","Resident and ordinarily resident"],
 ["NOR","Resident but not ordinarily resident"],["NRI","Non-resident"]];
const EMPCAT=[["CGOV","Central Government"],["SGOV","State Government"],
 ["PSU","Public Sector Undertaking"],["PE","Pensioners — Central Government"],
 ["PESG","Pensioners — State Government"],["PEPS","Pensioners — Public sector undertaking"],
 ["PEO","Pensioners — Others"],["OTH","Others"],["NA","Not applicable"]];
const RETSEC=[[11,"139(1) — on or before the due date"],[12,"139(4) — belated"],
 [17,"139(5) — revised"],[13,"142(1)"],[14,"148"],[16,"153C"],[18,"139(9) — defective"],
 [20,"119(2)(b) — after condonation of delay"]];
const ACCT=[["SB","Savings account"],["CA","Current account"],["CC","Cash credit account"],
 ["OD","Over draft account"],["NRO","Non-resident ordinary"],["OTH","Other"]];
const HPTYPE=[["S","Self occupied"],["L","Let out"],["D","Deemed let out"]];
const OWNER=[["SE","Self"],["MI","Minor"],["SP","Spouse"],["OT","Others"]];
const ALW10=[["10(5)","Travel concession or assistance"],
 ["10(6)","Remuneration of an official of an embassy or consulate"],
 ["10(7)","Allowances or perquisites paid by the Government outside India"],
 ["10(10)","Death-cum-retirement gratuity"],["10(10A)","Commuted value of a pension"],
 ["10(10AA)","Leave encashment on retirement"],
 ["10(10B)(i)","Compensation on retrenchment, to the extent notified"],
 ["10(10B)(ii)","Compensation on retrenchment, to the extent approved"],
 ["10(10C)","Amount received on voluntary retirement"],
 ["10(10CC)","Tax on a non-monetary perquisite paid by the employer"],
 ["10(13A)","House rent allowance"],
 ["10(14)(i)","Allowance to meet expenses in the course of duty"],
 ["10(14)(ii)","Allowance to meet personal expenses at the place of duty"],
 ["10(14)(i)(115BAC)","Allowance to meet expenses in the course of duty, under 115BAC"],
 ["10(14)(ii)(115BAC)","Transport allowance to a disabled employee, under 115BAC"],
 ["EIC","Exempt income of a specified class"],
 ["10(17)","Daily or constituency allowance of a legislator"]];
const ALW10_NEW=["10(5)","10(6)","10(7)","10(10)","10(10A)","10(10AA)","10(10C)","10(10CC)",
 "10(14)(i)(115BAC)","10(14)(ii)(115BAC)","EIC","10(17)"];
const OSNAT=[["SAV","Interest from a savings account"],
 ["IFD","Interest from a deposit — bank, post office or co-operative society"],
 ["TAX","Interest on an income-tax refund"],["FAP","Family pension"],["DIV","Dividend"],
 ["RENT","Rent from machinery, plant or furniture"],
 ["10(11)(iP)","Provident fund interest — first proviso to 10(11)"],
 ["10(11)(iiP)","Provident fund interest — second proviso to 10(11)"],
 ["10(12)(iP)","Provident fund interest — first proviso to 10(12)"],
 ["10(12)(iiP)","Provident fund interest — second proviso to 10(12)"],
 ["OTH","Any other income"]];
const EICAT=[["AGRI","Agricultural & related incomes"],["GOVC","Compensation/other sums received by government or other approved entities"],["ISI","Income from specified Investments"],["SSRA","Specified sums received by armed forces personnel"],["SRSC","Sums received by Senior Citizens/Minors"],["SRST","Sums received by specified Category of Taxpayers"],["SRPC","Sums received from policies/contributions such as LIC/NPS/PF/Sukanya Samriddhi Yojana"],["OTH","Other Incomes"],["OTHN","Other Exempt Income for Non Residents"]];
const TDSSEC=[["92A","192- Salary-Payment to Government employees other than Indian Government employees"],["92B","192- Salary-Payment to employees other than Government employees"],["92C","192- Salary-Payment to Indian Government employees"],["192A","192A/2AA- TDS on PF withdrawal"],["193","193- Interest on Securities"],["194","194- Dividends"],["94A","194A- Interest other than 'Interest on securities'"],["94B","194B- Winning from lottery or crossword puzzle"],["94BA","194BA- Winnings from online games"],["4BB","194BB- Winning from horse race"],["94C","194C- Payments to contractors and sub-contractors"],["94D","194D- Insurance commission"],["4DA","194DA- Payment in respect of life insurance policy"],["94E","194E- Payments to non-resident sportsmen or sports associations"],["4EE","194EE- Payments in respect of deposits under National Savings"],["4F","194F/94F- Payments on account of repurchase of units by Mutual Fund or Unit Trust of India"],["4G","194G/94G- Commission, price, etc. on sale of lottery tickets"],["4H","194H/94H- Commission or brokerage"],["4-IA","194I(a)/4IA- Rent on hiring of plant and machinery"],["4-IB","194I(b)/4IB - Rent on other than plant and machinery"],["4IA","Rent on hiring of plant and machinery"],["4IB","Rent on other than plant and machinery"],["4IC","194IC- Payment under specified agreement"],["94J-A","194J(a)/4JA - Fees for technical services"],["94J-B","194J(b)/4JB- Fees for professional services or royalty etc"],["94K","194K- Income payable to a resident assessee in respect of units of a specified mutual fund or of the units of "],["4LA","194LA- Payment of compensation on acquisition of certain immovable"],["4LB","194LB- Income by way of Interest from Infrastructure Debt fund"],["4LC1","194LC/LC1- 194LC (2)(i) and (ia) Income under clause (i) and (ia) of sub-section (2) of section 194LC"],["4LC2","194LC/LC2- 194LC (2)(ib) Income under clause (ib) of sub-section (2) of section 194LC"],["4LC3","194LC/LC3- 194LC (2)(ic) Income under clause (ic) of sub-section (2) of section 194LC"],["4BA1","194LBA(a)/BA1- Certain income in the form of interest from units of a business trust to a resident unit holder"],["4BA2","194LBA(b)/BA2- Certain income in the form of dividend from units of a business trust to a resident unit holder"],["LBA1","194LBA(a)/BA1- 194LBA(a) income referred to in section 10(23FC)(a) from units of a business trust-NR"],["LBA2","194LBA(b)/BA2-194LBA(b) Income referred to in section 10(23FC)(b) from units of a business trust-NR"],["LBA3","194LBA(c)/BA3- 194LBA(c) Income referred to in section 10(23FCA) from units of a business trust-NR"],["LBB","194LBB- Income in respect of units of investment fund"],["94R","194R- Benefits or perquisites of business or profession"],["94S","194S- Payment of consideration for transfer of virtual digital asset by persons other than specified persons"],["94B-P","Proviso to section 194B/4BP- Winnings from lotteries and crossword puzzles where consideration is made in kind"],["94R-P","First Proviso to sub-section(1) of section 194R/4RP- Benefits or perquisites of business or profession where s"],["94S-P","Proviso to sub- section(1) of section 194S/4SP- Payment for transfer of virtual digital asset where payment is"],["LBC","194LBC- Income in respect of investment in securitization trust"],["4LD","194LD- TDS on interest on bonds / government securities"],["94M","194M- Payment of certain sums by certain individuals or HUF"],["94N","194N- Payment of certain amounts in cash other than cases covered by first proviso or third proviso"],["94N-F","194N/4NF -First Proviso Payment of certain amounts in cash to non-filers except in case of co-operativesocieti"],["94N-C","194N/4NC- Third Proviso Payment of certain amounts in cash to co-operative societies not covered by first prov"],["94N-FT","194N/NFT- First Proviso read with Third Proviso Payment of certain amount in cash to non-filers being co-opera"],["94O","194O- Payment of certain sums by e-commerce operator to e-commerce participant."],["94P","194P- Deduction of tax in case of specified senior citizen"],["94Q","194Q- Deduction of tax at source on payment of certain sum for purchase of goods"],["195","195- Other sums payable to a non-resident"],["96A","196A- Income in respect of units of non-residents"],["96B","196B- Payments in respect of units to an offshore fund"],["96C","196C- Income from foreign currency bonds or shares of Indian"],["96D","196D- Income of foreign institutional investors from securities"],["96DA","196D(1A)/6DA- Income of specified fund from securities"],["94BA-P","194BA(2)/BAP-Sub-section (2) of section 194BA Net Winnings from online games where the net winnings are made i"]];
const DEDYR=["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012", "2011", "2010", "2009", "2008"];
const SICODE=[["1","111 - Tax on accumulated balance of recognised PF"],["1A","111A - STCG on shares units on which STT paid"],["21","112 - LTCG on Others and tax thereon after taking into account Sl. no. \u01a9 B1he of Schedule CG, if any."],["22","112(1) (LTCG on listed securities/ units)"],["21ciii","112(1)(c)(iii)- Long term capital gains on transfer of unlisted securities in the case of non-residents"],["2A","112A-LTCG on equity shares/units of equity oriented fund/units of business trust on which STT is paid"],["5A1ai","115A(1)(a)(i)- Dividends interest and income from units purchase in foreign currency"],["5A1aA","115A(1)(a)(A)- Dividend in the case of non-resident received from a unit in an International Financial Service"],["5A1aii","115A(1)(a)(ii)- Interest received from govt/Indian Concerns recived in Foreign Currency"],["5A1aiia","115A(1) (a)(iia) -Interest from Infrastructure Debt Fund"],["5A1aiiaa","115A(1) (a)(iiaa) -Income received by non-resident as referred in section 194LC(1)"],["5A1aiiaaP","115A(1) (a)(iiaa) -Income received by non-resident as referred in proviso to section 194LC(1)"],["5A1aiiaa2P","115A(1) (a)(iiaa)-Income received by non-resident as referred in second proviso to section 194LC(1)"],["5A1aiiab","115A(1) (a)(iiab) -Interest as per Sec. 194LD"],["5A1aiiac","115A(1)(a)(iiac) -Interest as per Sec. 194LBA"],["5A1aiii","115A(1) (a)(iii) - Income received in respect of units of UTI purchased in Foreign Currency"],["5A1bA","115A(1)(b)(A) & 115A(1)(b)(B)- Income from royalty & technical services"],["5AC1ab","115AC(1)(a) - Income by way of interest on bonds purchased in foreign currency - non-resident"],["5AC1abD","115AC(1)(b) - Income by way of Dividend on GDRs purchased in foreign currency - non-resident"],["5AC1c","115AC(1)(c) - Long term capital gains arising from their transfer of bonds or GDR purchased in foreign currenc"],["5ACA1a","115ACA(1)(a) - Income from GDR purchased in foreign currency -resident"],["5ACA1b","115ACA(1)(b) - Long term capital gains arising from the transfer of GDR purchased in foreign currency -residen"],["5AD1i","115AD(1)(i) -Income (other than Dividend) received by an FII in respect of securities (other than units as per"],["5AD1iDiv","115AD(1)(i) - Income (being dividend) received by an FII in respect of securities (other than units referred t"],["5AD1iP","115AD(1)(i) -Income received by an FII in respect of bonds or government securities as per Sec 194LD"],["5ADii","115AD(1)(ii) -STCG (other than on equity share or equity oriented mutual fund referred to in section 111A) by "],["5AD1biip","115AD(1)(b)(ii)- Short term capital gains referred to in section 111A as applicable u/s 115AD(1)(b)(ii)"],["5ADiii","115AD(1)(iii)-Long term capital gains by an FII"],["5ADiiiP","115AD(1)(b)(iii) Proviso- For NON-RESIDENTS from sale of equity share in a company or unit of equity oriented "],["5BB","115BB (Winnings from lotteries, crosswords puzzles, races including horse races, card games and other games of"],["5BBJ","115BBJ - Winnings from online games"],["5BBA","115BBA - Tax on non-residents sportsmen or sports associations"],["5BBE","115BBE - Tax on income referred to in sections 68 or 69 or 69A or 69B or 69C or 69D"],["5BBF","115BBF -Tax on income from patent"],["5BBG","115BBG -Tax on income from transfer of carbon credits"],["5BBH","115BBH - VDA"],["5Ea","115E(a) - Investment income"],["5Eb","115E(b) - Long term capital gains of a non-resident Indian on any foreign exchange asset"],["DTAASTCG","STCGDTAARate - STCG Chargeable at special rates in India as per DTAA"],["DTAALTCG","LTCGDTAARate - LTCG Chargeable at special rates in India as per DTAA"],["DTAAOS","OSDTAARate - Other source income chargeable under DTAA rates"],["PTI_STCG20P","Pass Through Income in the nature of Short Term Capital Gain chargeable @ 20% Under Section 111A"],["PTI_STCG30P","Pass Through Income in the nature of Short Term Capital Gain chargeable @ 30%"],["PTI_LTCG12_5P112A","Pass Through Income in the nature of Long Term Capital Gain chargeable @ 12.5% u/s 112A"],["PTI_LTCG12_5P","Pass Through Income in the nature of Long Term Capital Gain chargeable @ 12.5%"],["PTI_5A1ai","PTI-115A(1)(a)(i)- Dividends interest and income from units purchase in foreign currency"],["PTI_5A1aA","PTI-115A(1)(a)(A)- PTI-Dividend in the case of non-residents received from a unit in an International Financia"],["PTI_5A1aii","PTI-115A(1)(a)(ii)- Interest received from govt/Indian Concerns received in Foreign Currency"],["PTI_5A1aiia","PTI-115A(1) (a)(iia) -Interest from Infrastructure Debt Fund"],["PTI_5A1aiiaa","PTI-115A(1) (a)(iiaa) -Interest as per Sec. 194LC(1)"],["PTI_5A1aiiaaP","PTI-115A(1)(a)(iiaa) -Income received by non-resident as referred in proviso to section 194LC(1)"],["PTI_5A1aiiaa2P","PTI-115A(1)(a)(iiaa)-Income received by non-resident as referred in second proviso to section 194LC(1)"],["PTI_5A1aiiab","PTI-115A(1) (a)(iiab) -Interest as per Sec. 194LD"],["PTI_5A1aiiac","PTI-115A(1) (a)(iiac) -Interest as per Sec. 194LBA"],["PTI_5A1aiii","PTI-115A(1) (a)(iii) -Income received in respect of units of UTI purchased in foreign currency"],["PTI_5A1bA","PTI-115A(1)(b)(A) & PTI-115A(1)(b)(B)- Income from royalty & technical services"],["PTI_5AC1ab","PTI-115AC(1)(a) - Income by way of interest on bonds purchased in foreign currency - non-resident"],["PTI_5AC1abD","PTI-115AC(1)(b) - Income by way of Dividend on GDRs purchased in foreign currency - non-resident"],["PTI_5ACA1a","PTI-115ACA(1)(a) - Income from GDR purchased in foreign currency - resident"],["PTI_5AD1i","PTI-115AD(1)(i) -Income(other than Dividend) received by an FII in respect of securities (other than units as "],["PTI_5AD1iDiv","PTI-115AD(1)(i) - Income (being dividend) received by an FII in respect of securities (other than units referr"],["PTI_5AD1iP","PTI-115AD(1)(i) -Income received by an FII in respect of bonds or government securities as per Sec 194LD"],["PTI_5BBA","PTI-115BBA - Tax on non-residents sportsmen or sports associations"],["PTI_5BBF","PTI_5BBF"],["PTI_5BBG","PTI-115BBG - Tax on income from transfer of carbon credits"],["PTI_5Ea","PTI-115E(a) - Investment income"]];
const EISUB=[["10(30)","10(30)-subsidy received from or through the Tea Board"],["10(31)","10(31)-Subsidy received for Rubber/Coffee/Tea replantation, replacement, rejuvenation etc."],["10(37)","Capital gains on compulsory acquisition of urban agricultural land"],["10(10BB)","10(10BB)-payments made under the Bhopal Gas Leak Disaster"],["10(10BC)","10(10BC)-amount from the Central/State Govt./local authority by way of compensation on account of any disaster"],["10(17A)","10(17A)-Award instituted by Government"],["10(12AB)","10(12AB)-any sum received as lump sum amount as per clause (vi) of paragraph 2 of the notification number FX-1"],["10(15)","10(15)-Interest on specified securities/investments"],["10(23FBB)","10(23FBB)-income referred to in section 115UB, accruing or arising to, or received by, a unit holder of an inv"],["10(23FD)","10(23FD)Unit holder income from Business Trust (certain parts)"],["10(35)","10(35)-Income from specified Mutual Funds"],["10(35A)","10(35A)-distributed income referred to in section 115TA received from a securitisation trust"],["10(23FBC)","10(23FBC) Any income from a unit holder from a specified fund or on transfer of units in a specified fund"],["10(33)","10(33) Income from transfer of capital asset being a unit of the Unit Scheme, 1964"],["10(4B)","10(4B)-Interest on specified savings certificates"],["10(4C)","10(4C)-Interest on Rupee denominated bonds (specific window)"],["10(4E)","10(4E)-Non-deliverable forwards/ODI/OTC with IFSC OBU"],["10(36)","10(36)-LTCG on certain listed shares (public issue)"],["10(37A)","10(37A)-any income chargeable under the head 'Capital gains' in respect of transfer of a specified capital ass"],["10(12C)","10(12C)-Agniveer Corpus Fund income"],["10(18)","10(18)-Pension received by winner of 'Param Vir Chakra' or 'Maha Vir Chakra' or 'Vir Chakra' or such other gal"],["10(19)","10(19)-Armed Forces Family pension in case of death during operational duty"],["DMD","Defense Medical Disability Pension"],["10(32)","10(32)-Minor child's income\u2014small exemption"],["10(43)","10(43)-Reverse mortgage\u2014payments to senior citizens"],["10(19A)","10(19A)-Annual value of one palace in occupation of ex-ruler"],["10(26)","10(26)- Any income as referred to in section 10(26)"],["10(26AAA)","10(26AAA)-Any income as referred to in section 10(26AAA)"],["10(10D)","10(10D)-Any sum received under a life insurance policy, including the sum allocated by way of bonus on such po"],["10(11)","10(11)-Statutory Provident Fund received"],["10(11A)","10(11A)-Sum received from an account opened under the Sukanya Samriddhi Yojana"],["10(12)","10(12)-Recognized Provident Fund received"],["10(12A)","10(12A)-Any payment from the National Pension System Trust to an assessee"],["10(12AA)","10(12AA)-any payment from the National Pension System Trust"],["10(12B)","10(12B)-Any payment from the National Pension System Trust to an Central Govt. Employee"],["10(12BA)","10(12BA)-partial withdrawal made from the National Pension System"],["10(13)","10(13)-Approved superannuation fund received"],["10(2)","10(2)-Member's share from HUF"],["10(16)","10(16)-Scholarships for education"],["10(4)(ii)","10(4)(ii)-NRE account interest"],["10(4)(i)","10(4)(i)-Interest on specified bonds"],["10(4F)","10(4F)-Royalty/interest on lease of aircraft/ship by IFSC unit"],["10(4G)","10(4G)-Portfolio income managed in IFSC OBU accruing outside India"],["10(6B)","10(6B)-Tax paid under Govt/international agreements (non-salary)"],["10(6D)","10(6D)-Royalty/FTS to non-resident for services to NTRO"],["Incmexmptcircular","Incmexmptcircular - Income exempt as per CBDT Circular"],["Incmexmptnotification","Incmexmptnotification- Income exempt as per CBDT Notification"],["Receiptnotincme","Receiptnotincme - Receipts not in the nature of Income"],["10(8)","10(8)- Income of individuals on cooperative technical assistance programmes"],["10(8A)","10(8A)- Remuneration or any other income of Consultant"],["10(8B)","10(8B)- Income from tech assistance programme in accordance with an agreement entered into by the Central Gove"],["10(9)","10(9)- Income of any family member of any individual accompanying him to India, which accrues or arises outsid"]];
const AMTC_YRS=["2013-14", "2014-15", "2015-16", "2016-17", "2017-18", "2018-19", "2019-20", "2020-21", "2021-22", "2022-23", "2023-24", "2024-25", "2025-26"];
const FA_NAT=[["I", "Interest"], ["D", "Dividend"], ["S", "Proceeds from sale or redemption of financial assets"], ["O", "Other income"], ["N", "No Amount paid/credited"]];
const CC_ALL=[["93","AFGHANISTAN"],["1001","\u00c5LAND ISLANDS"],["355","ALBANIA"],["213","ALGERIA"],["684","AMERICAN SAMOA"],["376","ANDORRA"],["244","ANGOLA"],["1264","ANGUILLA"],["1010","ANTARCTICA"],["1268","ANTIGUA AND BARBUDA"],["54","ARGENTINA"],["374","ARMENIA"],["297","ARUBA"],["61","AUSTRALIA"],["43","AUSTRIA"],["994","AZERBAIJAN"],["1242","BAHAMAS"],["973","BAHRAIN"],["880","BANGLADESH"],["1246","BARBADOS"],["375","BELARUS"],["32","BELGIUM"],["501","BELIZE"],["229","BENIN"],["1441","BERMUDA"],["975","BHUTAN"],["591","BOLIVIA (PLURINATIONAL STATE OF)"],["1002","BONAIRE, SINT EUSTATIUS AND SABA"],["387","BOSNIA AND HERZEGOVINA"],["267","BOTSWANA"],["1003","BOUVET ISLAND"],["55","ALBANIA"],["1014","BRITISH INDIAN OCEAN TERRITORY"],["673","BRUNEI DARUSSALAM"],["359","BULGARIA"],["226","BURKINA FASO"],["257","BURUNDI"],["238","CABO VERDE"],["855","CAMBODIA"],["237","CAMEROON"],["1","\u00c5LAND ISLANDS"],["1345","CAYMAN ISLANDS"],["236","CENTRAL AFRICAN REPUBLIC"],["235","CHAD"],["56","CHILE"],["86","CHINA"],["9","BENIN"],["672","COCOS (KEELING) ISLANDS"],["57","BURUNDI"],["270","COMOROS"],["242","BAHAMAS"],["243","CONGO (DEMOCRATIC REPUBLIC OF THE)"],["682","COOK ISLANDS"],["506","COSTA RICA"],["225","C\u00d4TE D'IVOIRE"],["385","CROATIA"],["53","CUBA"],["1015","CURA\u00c7AO"],["357","CYPRUS"],["420","CZECHIA"],["45","CAYMAN ISLANDS"],["253","DJIBOUTI"],["1767","DOMINICA"],["1809","DOMINICAN REPUBLIC"],["593","ECUADOR"],["20","CZECHIA"],["503","EL SALVADOR"],["240","EQUATORIAL GUINEA"],["291","ERITREA"],["372","ESTONIA"],["251","ETHIOPIA"],["500","FALKLAND ISLANDS (MALVINAS)"],["298","FAROE ISLANDS"],["679","FIJI"],["358","FINLAND"],["33","FRANCE"],["594","FRENCH GUIANA"],["689","FRENCH POLYNESIA"],["1004","FRENCH SOUTHERN TERRITORIES"],["241","GABON"],["220","GAMBIA"],["995","GEORGIA"],["49","GERMANY"],["233","GHANA"],["350","GIBRALTAR"],["30","GREECE"],["299","GREENLAND"],["1473","GRENADA"],["590","GUADELOUPE"],["1671","GUAM"],["502","GUATEMALA"],["1481","GUERNSEY"],["224","GUINEA"],["245","GUINEA-BISSAU"],["592","GUYANA"],["509","HAITI"],["1005","HEARD ISLAND AND MCDONALD ISLANDS"],["6","ANDORRA"],["504","HONDURAS"],["852","HONG KONG"],["36","CENTRAL AFRICAN REPUBLIC"],["354","ICELAND"],["91","BOLIVIA (PLURINATIONAL STATE OF)"],["62","INDONESIA"],["98","FAROE ISLANDS"],["964","IRAQ"],["353","IRELAND"],["1624","ISLE OF MAN"],["972","ISRAEL"],["5","ALBANIA"],["1876","JAMAICA"],["81","GUERNSEY"],["1534","JERSEY"],["962","JORDAN"],["7","ARUBA"],["254","KENYA"],["686","KIRIBATI"],["850","KOREA(DEMOCRATIC PEOPLE'S REPUBLIC OF)"],["82","COOK ISLANDS"],["965","KUWAIT"],["996","KYRGYZSTAN"],["856","LAO PEOPLE'S DEMOCRATIC REPUBLIC"],["371","LATVIA"],["961","LEBANON"],["266","LESOTHO"],["231","LIBERIA"],["218","LIBYA"],["423","LIECHTENSTEIN"],["370","LITHUANIA"],["352","LUXEMBOURG"],["853","MACAO"],["389","MACEDONIA(THE FORMER YUGOSLAV REPUBLIC OF)"],["261","MADAGASCAR"],["265","MALAWI"],["60","MALAYSIA"],["960","MALDIVES"],["223","MALI"],["356","MALTA"],["692","MARSHALL ISLANDS"],["596","MARTINIQUE"],["222","MAURITANIA"],["230","MAURITIUS"],["269","MAYOTTE"],["52","HONG KONG"],["691","MICRONESIA (FEDERATED STATES OF)"],["373","MOLDOVA (REPUBLIC OF)"],["377","MONACO"],["976","MONGOLIA"],["382","MONTENEGRO"],["1664","MONTSERRAT"],["212","MOROCCO"],["258","MOZAMBIQUE"],["95","GEORGIA"],["264","ANGUILLA"],["674","NAURU"],["977","NEPAL"],["31","LIBERIA"],["687","NEW CALEDONIA"],["64","ANGUILLA"],["505","NICARAGUA"],["227","NIGER"],["234","NIGERIA"],["683","NIUE"],["15","CURA\u00c7AO"],["1670","NORTHERN MARIANA ISLANDS"],["47","NORWAY"],["968","OMAN"],["92","GUYANA"],["680","PALAU"],["970","PALESTINE, STATE OF"],["507","PANAMA"],["675","PAPUA NEW GUINEA"],["595","PARAGUAY"],["51","ETHIOPIA"],["63","PHILIPPINES"],["1011","PITCAIRN"],["48","POLAND"],["14","BRITISH INDIAN OCEAN TERRITORY"],["1787","PUERTO RICO"],["974","QATAR"],["262","R\u00c9UNION"],["40","EQUATORIAL GUINEA"],["8","ANTIGUA AND BARBUDA"],["250","RWANDA"],["1006","SAINT BARTH\u00c9LEMY"],["290","SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA"],["1869","SAINT KITTS AND NEVIS"],["1758","SAINT LUCIA"],["1007","SAINT MARTIN (FRENCH PART)"],["508","SAINT PIERRE AND MIQUELON"],["1784","SAINT VINCENT AND THE GRENADINES"],["685","SAMOA"],["378","SAN MARINO"],["239","SAO TOME AND PRINCIPE"],["966","SAUDI ARABIA"],["221","SENEGAL"],["381","SERBIA"],["248","SEYCHELLES"],["232","SIERRA LEONE"],["65","KUWAIT"],["1721","SINT MAARTEN (DUTCH PART)"],["421","SLOVAKIA"],["386","SLOVENIA"],["677","SOLOMON ISLANDS"],["252","SOMALIA"],["28","SOUTH AFRICA"],["1008","SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS"],["211","SOUTH SUDAN"],["35","CHAD"],["94","AZERBAIJAN"],["249","SUDAN"],["597","SURINAME"],["1012","SVALBARD AND JAN MAYEN"],["268","ANTIGUA AND BARBUDA"],["46","BARBADOS"],["41","BERMUDA"],["963","SYRIAN ARAB REPUBLIC"],["886","TAIWAN"],["992","TAJIKISTAN"],["255","TANZANIA, UNITED REPUBLIC OF"],["66","LESOTHO"],["670","NORTHERN MARIANA ISLANDS"],["228","TOGO"],["690","TOKELAU"],["676","TONGA"],["1868","TRINIDAD AND TOBAGO"],["216","TUNISIA"],["90","GUADELOUPE"],["993","TURKMENISTAN"],["1649","TURKS AND CAICOS ISLANDS"],["688","TUVALU"],["256","UGANDA"],["380","UKRAINE"],["971","UNITED ARAB EMIRATES"],["44","ANGOLA"],["2","BAHAMAS"],["1009","UNITED STATES MINOR OUTLYING ISLANDS"],["598","URUGUAY"],["998","UZBEKISTAN"],["678","VANUATU"],["58","FINLAND"],["84","AMERICAN SAMOA"],["1284","VIRGIN ISLANDS (BRITISH)"],["1340","VIRGIN ISLANDS (U.S.)"],["681","WALLIS AND FUTUNA"],["1013","WESTERN SAHARA"],["967","YEMEN"],["260","ZAMBIA"],["263","ZIMBABWE"],["9999","OTHERS"]];
const QTR=[["q1","Up to 15 June 2025"],["q2","16 June to 15 September 2025"],
 ["q3","16 September to 15 December 2025"],["q4","16 December 2025 to 15 March 2026"],
 ["q5","16 March to 31 March 2026"]];
const NOTIFIED89=[["US","United States of America"],["UK","United Kingdom of Great Britain and Northern Ireland"],["CA","Canada"]];
/* ---- Part A General — code tables from the book ------------------- */
const RESCOND=[
 ["1","In India 182 days or more during the year — 6(1)(a)","RES"],
 ["2","In India 60 days or more this year and 365 or more in the 4 preceding years — 6(1)(c)","RES"],
 ["3","Non-resident in 9 of the 10 preceding years — 6(6)(a)","NOR"],
 ["4","In India 729 days or less during the 7 preceding years — 6(6)(a)","NOR"],
 ["5","A non-resident during the year","NRI"],
 ["6","Citizen or PIO on a visit, income over ₹15 lakh, in India 120 to 181 days — 6(6)(c)","NRI"],
 ["7","Citizen with income over ₹15 lakh, not liable to tax elsewhere by domicile — 6(6)(d) with 6(1A)","NRI"],
 ["8","Citizen who left India as crew of an Indian ship, 182+ days and 365+ in 4 years — Expl. 1(a) to 6(1)(c)","RES"]];
const COTYPE=[["D","Domestic"],["F","Foreign"]];
const NOTICESEC=[["","(Select)"],["139(9)","139(9)"],["142(1)","142(1)"],["148","148"],["153C","153C"],["119(2)(b)","119(2)(b)"]];
const REPCAP=[["","(Select)"],["Guardian","Guardian"],["LegalHeir","Legal heir"],["Agent","Agent of a non-resident"],
 ["Trustee","Trustee"],["Manager","Manager"],["Karta","Karta"],["OfficialAssignee","Official assignee or receiver"],
 ["Other","Other"]];
const CLAUSEIV=[["1","Sales, turnover or gross receipts in business over ₹60 lakh"],
 ["2","Gross receipts in profession over ₹10 lakh"],
 ["3","TDS and TCS in the year of ₹25,000 or more — ₹50,000 for a senior citizen"],
 ["4","Deposits in savings accounts of ₹50 lakh or more"]];
/* the 250-country list is long; the ones that matter for jurisdictions and the address */
const COUNTRIES=[["91","India"],["1","United States of America"],["44","United Kingdom"],["971","United Arab Emirates"],
 ["65","Singapore"],["61","Australia"],["1001","Canada"],["49","Germany"],["33","France"],["81","Japan"],
 ["852","Hong Kong"],["60","Malaysia"],["966","Saudi Arabia"],["974","Qatar"],["968","Oman"],["973","Bahrain"],
 ["965","Kuwait"],["64","New Zealand"],["31","Netherlands"],["41","Switzerland"],["353","Ireland"],["27","South Africa"],
 ["94","Sri Lanka"],["977","Nepal"],["880","Bangladesh"],["230","Mauritius"],["86","China"],["82","South Korea"],
 ["39","Italy"],["34","Spain"],["46","Sweden"],["47","Norway"],["45","Denmark"],["358","Finland"],["32","Belgium"],
 ["43","Austria"],["48","Poland"],["7","Russia"],["55","Brazil"],["52","Mexico"],["54","Argentina"],["20","Egypt"],
 ["234","Nigeria"],["254","Kenya"],["255","Tanzania"],["66","Thailand"],["62","Indonesia"],["63","Philippines"],
 ["84","Vietnam"],["93","Afghanistan"],["9999","Other"]];

const S17_1=[["1","Basic salary"],["2","Dearness allowance"],["3","Conveyance allowance"],["4","House rent allowance"],["5","Leave travel allowance"],["6","Children education allowance"],["7","Other allowance"],["8","Employer's contribution to the pension scheme under 80CCD"],["9","Amount deemed income under rule 6 of Part A of the Fourth Schedule"],["10","Amount deemed income under rule 11(4) of Part A of the Fourth Schedule"],["11","Annuity or pension"],["12","Commuted pension"],["13","Gratuity"],["14","Fees or commission"],["15","Advance of salary"],["16","Leave encashment"],["17","Central Government's contribution to the Agnipath scheme under 80CCH"],["OTH","Others \u2014 specify"]];
const S17_2=[["1","Accommodation"],["2","Cars or other automotive"],["3","Sweeper, gardener, watchman or personal attendant"],["4","Gas, electricity, water"],["5","Interest-free or concessional loans"],["6","Holiday expenses"],["7","Free or concessional travel"],["8","Free meals"],["9","Free education"],["10","Gifts, vouchers, etc."],["11","Credit card expenses"],["12","Club expenses"],["13","Use of movable assets"],["14","Transfer of assets to the employee"],["15","Value of any other benefit, amenity, service or privilege"],["16","Stock options of an eligible start-up under 80-IAC \u2014 tax to be deferred"],["17","Stock options other than those in 16"],["18","Employer's contribution to a fund or scheme taxable under 17(2)(vii)"],["19","Annual accretion on that balance, taxable under 17(2)(viia)"],["21","Stock options of an eligible start-up under 80-IAC \u2014 tax not to be deferred"],["OTH","Other benefits or amenities \u2014 specify"]];
const S17_3=[["1","Compensation on termination of employment or modification of its terms"],["2","Payment from the employer, a former employer, a provident or other fund, or under a Keyman insurance policy"],["3","Amount received before joining or after leaving the employer"],["OTH","Any other \u2014 specify"]];
const NOTIFIED=[["US","United States of America"],
 ["UK","United Kingdom of Great Britain and Northern Ireland"],["CAN","Canada"]];

/* capital-gains asset classes */
const CGKIND=[
 ["land","Land or building",24,"50C"],
 ["eqstt","Listed equity or equity fund with STT",12,""],
 ["unlisted","Unlisted shares",24,"50CA"],
 ["seclisted","Listed security without STT",12,""],
 ["bond","Bonds or debentures",36,""],
 ["mf50aa","Specified mutual fund or market-linked debenture — section 50AA",0,""],
 ["slump","Slump sale of an undertaking — section 50B",36,""],
 ["vda","Virtual digital asset",0,""],
 ["other","Any other capital asset",24,""]];
const CGDED=[["","No exemption claimed"],
 ["54","54 — a residential house from another residential house"],
 ["54B","54B — agricultural land"],["54D","54D — compulsory acquisition of an industrial undertaking"],
 ["54EC","54EC — investment in specified bonds"],["54EE","54EE — units of a specified fund"],
 ["54F","54F — a residential house from any other asset"],
 ["54G","54G — shifting out of an urban area"],["54GA","54GA — shifting to a special economic zone"],
 ["54GB","54GB — investment in an eligible company"],["115F","115F — a non-resident Indian"]];
/* Schedule SI — special-rate heads, with the department's own section codes */
const SI=[
 ["si111a15","1A","Short-term gain on listed equity with STT, before 23-07-2024",15],
 ["si111a20","1A","Short-term gain on listed equity with STT, on or after 23-07-2024",20],
 ["si112a10","2A","Long-term gain on listed equity with STT, before 23-07-2024",10],
 ["si112a","2A","Long-term gain on listed equity with STT, on or after 23-07-2024, above ₹1.25 lakh",12.5],
 ["si112o","21","Long-term gain with indexation, before 23-07-2024",20],
 ["si112n","22","Long-term gain without indexation, on or after 23-07-2024",12.5],
 ["si115bbh","5BBH","Income from a virtual digital asset",30],
 ["si115bbe","5BBE","Unexplained cash credits, investments and expenditure",60],
 ["si115bbf","5BBF","Royalty from a patent developed in India",10],
 ["si115bbg","5BBG","Income from transfer of carbon credits",10],
 ["si115bb","5BB","Winnings from lotteries, card games and betting",30],
 ["si115bbj","5BBJ","Winnings from online games",30]];

/* ---- Chapter VI-A, exactly the VI-A sheet's live rows a to ub ------ */
const VIA=[
 ["c80c","a","80C — life insurance premia, deferred annuity, provident fund, subscriptions, and the rest",150000],
 ["c80ccc","b","80CCC — payment in respect of a pension fund",150000],
 ["c80ccd1","c","80CCD(1) — contribution to the pension scheme of the Central Government",150000],
 ["c80ccd1b","d","80CCD(1B) — further contribution to the pension scheme",50000],
 ["c80ccd2","e","80CCD(2) — contribution to the pension scheme by the employer",0],
 ["c80d","f","80D — health insurance and preventive check-up (from Schedule 80D)",0],
 ["c80dd","g","80DD — maintenance and treatment of a dependant with a disability (from Schedule 80DD)",125000],
 ["c80ddb","h","80DDB — medical treatment of a specified disease",100000],
 ["c80e","i","80E — interest on a loan taken for higher education",0],
 ["c80ee","j","80EE — interest on a loan taken for a residential house",50000],
 ["c80eea","k","80EEA — interest on a loan taken for certain house property",150000],
 ["c80eeb","l","80EEB — purchase of an electric vehicle",150000],
 ["c80g","m","80G — donations to certain funds and charitable institutions (from Schedule 80G)",0],
 ["c80gg","n","80GG — rent paid (Form 10BA required)",60000],
 ["c80gga","o","80GGA — donations for scientific research or rural development (from Schedule 80GGA)",0],
 ["c80ggc","p","80GGC — donation to a political party (from Schedule 80GGC)",0],
 ["c80qqb","q","80QQB — royalty income of authors of certain books (Form 10CCD required)",300000],
 ["c80rrb","r","80RRB — royalty on patents (Form 10CCE required)",300000],
 ["c80tta","s","80TTA — interest on savings accounts, other than a resident senior citizen",10000],
 ["c80ttb","t","80TTB — interest on deposits, resident senior citizen",50000],
 ["c80u","u","80U — a person with a disability (from Schedule 80U)",125000],
 ["c80cch","ua","80CCH — contribution to the Agnipath scheme",0]];
const VIA_NEW=["c80ccd2","c80cch"];
const DISEASE80DDB=[["a","Dementia"],["b","Dystonia musculorum deformans"],["c","Motor neuron disease"],["d","Ataxia"],
 ["e","Chorea"],["f","Hemiballismus"],["g","Aphasia"],["h","Parkinson's disease"],["i","Malignant cancers"],
 ["j","Full-blown AIDS"],["k","Chronic renal failure"],["l","Haematological disorders"],["m","Haemophilia"],["n","Thalassaemia"]];
const DD_NATURE=[["1","Dependant with a disability"],["2","Dependant with a severe disability"]];
const DD_TYPE=[["1","Autism, cerebral palsy or multiple disabilities"],["2","Others"]];
const DD_DEP=[["1","Spouse"],["2","Son"],["3","Daughter"],["4","Father"],["5","Mother"],["6","Brother"],["7","Sister"],["8","Member of the HUF"]];
const GGA_CLAUSE=[["80GGA2a","80GGA(2)(a) — research association, university or institution for scientific research"],
 ["80GGA2aa","80GGA(2)(aa) — for social science or statistical research"],
 ["80GGA2b","80GGA(2)(b) — association or institution for rural development"],
 ["80GGA2bb","80GGA(2)(bb) — PSU, local authority or approved institution for an eligible project"],
 ["80GGA2c","80GGA(2)(c) — conservation of natural resources or afforestation"],
 ["80GGA2cc","80GGA(2)(cc) — notified funds for afforestation"],
 ["80GGA2d","80GGA(2)(d) — rural development fund"],["80GGA2e","80GGA(2)(e) — National Urban Poverty Eradication Fund"]];
const IDENT_TYPE=[["PPF","Public provident fund"],["EPF","Employees provident fund"],["LIC","Life insurance policy"],
 ["NSC","National savings certificate"],["ELSS","Equity-linked savings scheme"],["ULIP","Unit-linked insurance plan"],
 ["TUIT","Tuition fees"],["HOUS","Housing loan principal"],["SSY","Sukanya Samriddhi"],["NPS","National pension system"],["OTH","Other"]];
const LOANFROM=[["B","Bank"],["I","Other than bank"]];

const SLAB_NEW=[[400000,0],[800000,5],[1200000,10],[1600000,15],[2000000,20],
                [2400000,25],[Infinity,30]];
const SLAB_OLD=[[250000,0],[500000,5],[1000000,20],[Infinity,30]];
const SLAB_SR =[[300000,0],[500000,5],[1000000,20],[Infinity,30]];
const SLAB_SSR=[[500000,0],[1000000,20],[Infinity,30]];
const DUE=new Date(2026,6,31), YREND=new Date(2026,2,31), CUT=new Date(2024,6,23);
const H1END=new Date(2025,9,3);
const DF="DD/MM/YYYY";
const CII={"2001-02":100,"2002-03":105,"2003-04":109,"2004-05":113,"2005-06":117,
"2006-07":122,"2007-08":129,"2008-09":137,"2009-10":148,"2010-11":167,"2011-12":184,
"2012-13":200,"2013-14":220,"2014-15":240,"2015-16":254,"2016-17":264,"2017-18":272,
"2018-19":280,"2019-20":289,"2020-21":301,"2021-22":317,"2022-23":331,"2023-24":348,
"2024-25":363,"2025-26":376};

