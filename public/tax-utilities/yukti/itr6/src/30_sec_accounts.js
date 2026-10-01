/* ================================================================
   SCREEN — every live book row -> a field; computed rows -> cell().
   Part A accounts are not regime-closed, so no isNew() gating.
   ================================================================ */
function _acRi(l,pth,ref,o){o=o||{};return row(l,inp("accounts."+pth,{n:1}),{ref:ref,ind:o.ind,hint:o.hint,req:o.req,cls:o.cls});}
function _acRt(l,pth,ref,o){o=o||{};return row(l,inp("accounts."+pth,{max:o.max,ph:o.ph}),{ref:ref,ind:o.ind,hint:o.hint,req:o.req});}
function _acRc(l,pth,ref,o){o=o||{};return row(l,cell(N(get("accounts."+pth))),{ref:ref,ind:o.ind,cls:o.cls||"tot",hint:o.hint});}
function _acRsel(l,pth,opts,ref,o){o=o||{};return row(l,sel("accounts."+pth,opts,{blank:o.blank}),{ref:ref,req:o.req,hint:o.hint});}
function _acArr(p){const a=get("accounts."+p);return Array.isArray(a)?a:[];}
const _acV=p=>N(get("accounts."+p));
/* a "specify nature and amount" table with OthersDesc/OthersAmount (Ind-AS style) */
function _acOthTbl(pth,addLabel){return grid("accounts."+pth,
  [{k:"OthersDesc",h:"Nature",t:"txt",w:"auto",req:1,max:50},{k:"OthersAmount",h:"Amount",t:"num",w:"160px",req:1}],
  _acArr(pth),{min:"480px",empty:"Nothing entered.",add:addLabel||"Add a row"});}

/* ---------- Manufacturing Account (shared: regular / Ind-AS) ---------- */
function accMfg(pf){
  const o=pf+".OpeningInventory.";let m="";
  m+=sub("1 — Debits to the Manufacturing Account");
  m+=_acRi("Opening stock of raw material",o+"OpngStckRawMat","1Ai",{ind:1});
  m+=_acRi("Opening stock of work in progress",o+"OpngStckWrkinPrgrs","1Aii",{ind:1});
  m+=_acRc("Total opening inventory (i + ii)",o+"OpngInvntryTotal","1Aiii");
  m+=_acRi("Purchases (net of refunds and duty or tax)",o+"Purchases","1B");
  m+=_acRi("Direct wages",o+"DirectWages","1C");
  m+=_acRi("Carriage inward",o+"CarriageInward","1Di",{ind:1});
  m+=_acRi("Power and fuel",o+"PowerAndFuel","1Dii",{ind:1});
  m+=_acRi("Other direct expenses",o+"OthDirectExpenses","1Diii",{ind:1});
  m+=_acRc("Direct expenses (Di + Dii + Diii)",o+"DirectExpenses","1D");
  m+=sub("1E — Factory overheads");
  m+=_acRi("Indirect wages",o+"IndirectWages","1Ei",{ind:1});
  m+=_acRi("Factory rent and rates",o+"FactoryRentAndRates","1Eii",{ind:1});
  m+=_acRi("Factory insurance",o+"FactoryInsurance","1Eiii",{ind:1});
  m+=_acRi("Factory fuel and power",o+"FactoryFuelAndPower","1Eiv",{ind:1});
  m+=_acRi("Factory general expenses",o+"FactoryGeneralExpenses","1Ev",{ind:1});
  m+=_acRi("Depreciation of factory machinery",o+"DeprctnOfFactoryMachinery","1Evi",{ind:1});
  m+=_acRc("Total factory overheads (i to vi)",o+"TotalFactoryOverheads","1Evii");
  m+=_acRc("Total of debits to Manufacturing Account (Aiii + B + C + D + Evii)",o+"TotalDebtsManfctrngAcc","1F");
  m+=sub("2 — Closing stock");
  m+=_acRi("Raw material",pf+".ClosingStock.ClsngStckRawMaterial","2i",{ind:1});
  m+=_acRi("Work-in-progress",pf+".ClosingStock.ClsngStckWrkInPrgrs","2ii",{ind:1});
  m+=_acRc("Total closing stock (2i + 2ii)",pf+".ClosingStock.ClsngStckTotal","2iii");
  m+=_acRc("Cost of Goods Produced — transferred to Trading Account (1F − 2)",pf+".CostOfGoodsPrdcd","3",{hint:"may be negative; feeds Trading item 11"});
  return m;
}

/* ---------- Trading Account (shared: regular / Ind-AS) ---------- */
function accTrd(pf){
  let t="";
  t+=sub("4 — Revenue from operations");
  t+=_acRi("Sale of goods",pf+".SaleOfGoods","4Ai");
  t+=_acRi("Sale of services",pf+".SaleOfServices","4Aii");
  t+=grid("accounts."+pf+".OtherOperatingRevenueDtls",
    [{k:"OperatingRevenueName",h:"Other operating revenue — nature",t:"txt",w:"auto",req:1,max:125},{k:"OperatingRevenueAmt",h:"Amount",t:"num",w:"150px",req:1}],
    _acArr(pf+".OtherOperatingRevenueDtls"),{min:"520px",empty:"No other operating revenue.",add:"Add other operating revenue"});
  t+=_acRc("Total other operating revenues",pf+".OperatingRevenueTotal","4Aiiic");
  t+=_acRc("Total sales / gross receipts (i + ii + iiic)",pf+".SalesGrossReceiptsTotal","4Aiv");
  t+=_acRi("Gross receipts from profession",pf+".GrossRcptFromProfession","4B");
  t+=sub("4C — Duties, taxes and cess received or receivable on goods and services sold");
  t+=_acRi("Union excise duties",pf+".ExciseCustomsVAT.UnionExciseDuty","4Ci",{ind:1});
  t+=_acRi("Service tax",pf+".ExciseCustomsVAT.ServiceTax","4Cii",{ind:1});
  t+=_acRi("VAT / Sales tax",pf+".ExciseCustomsVAT.VATorSaleTax","4Ciii",{ind:1});
  t+=_acRi("Central GST (CGST)",pf+".ExciseCustomsVAT.CentralGoodServiceTax","4Civ",{ind:1});
  t+=_acRi("State GST (SGST)",pf+".ExciseCustomsVAT.StateGoodServiceTax","4Cv",{ind:1});
  t+=_acRi("Integrated GST (IGST)",pf+".ExciseCustomsVAT.IntegratedGoodServiceTax","4Cvi",{ind:1});
  t+=_acRi("Union Territory GST (UTGST)",pf+".ExciseCustomsVAT.UnionTerrGoodServiceTax","4Cvii",{ind:1});
  t+=_acRi("Any other duty, tax and cess",pf+".ExciseCustomsVAT.OthDutyTaxCess","4Cviii",{ind:1});
  t+=_acRc("Total (4Ci to 4Cviii)",pf+".ExciseCustomsVAT.TotExciseCustomsVAT","4Cix");
  t+=_acRc("Total Revenue from operations (Aiv + B + Cix)",pf+".TotRevenueFrmOperations","4D");
  t+=_acRi("5 — Closing Stock of Finished Stocks",pf+".ClsngStckOfFinishedStcks","5");
  t+=_acRc("6 — Total of credits to Trading Account (4D + 5)",pf+".TardingAccTotCred","6");
  t+=sub("Debits");
  t+=_acRi("7 — Opening Stock of Finished Goods",pf+".OpngStckOfFinishedStcks","7");
  t+=_acRi("8 — Purchases (net of refunds and duty or tax)",pf+".Purchases","8");
  t+=_acRi("Carriage inward",pf+".CarriageInward","9i",{ind:1});
  t+=_acRi("Power and fuel",pf+".PowerAndFuel","9ii",{ind:1});
  t+=grid("accounts."+pf+".OtherDirectExpenses",
    [{k:"NatureOfDirectExpense",h:"Other direct expenses — nature",t:"txt",w:"auto",req:1,max:125},{k:"Amount",h:"Amount",t:"num",w:"150px",req:1}],
    _acArr(pf+".OtherDirectExpenses"),{min:"520px",empty:"No other direct expenses.",add:"Add other direct expense"});
  t+=_acRc("Total other direct expenses (9iii)",pf+".TotOthDirectExpenses","9iii");
  t+=_acRc("9 — Direct Expenses (9i + 9ii + 9iii)",pf+".DirectExpenses","9");
  t+=sub("10 — Duties and taxes, paid or payable, on goods and services purchased");
  t+=_acRi("Custom duty",pf+".DutyTaxPay.ExciseCustomsVAT.CustomDuty","10i",{ind:1});
  t+=_acRi("Counter veiling duty",pf+".DutyTaxPay.ExciseCustomsVAT.CounterVailDuty","10ii",{ind:1});
  t+=_acRi("Special additional duty",pf+".DutyTaxPay.ExciseCustomsVAT.SplAddDuty","10iii",{ind:1});
  t+=_acRi("Union excise duty",pf+".DutyTaxPay.ExciseCustomsVAT.UnionExciseDuty","10iv",{ind:1});
  t+=_acRi("Service tax",pf+".DutyTaxPay.ExciseCustomsVAT.ServiceTax","10v",{ind:1});
  t+=_acRi("VAT / Sales tax",pf+".DutyTaxPay.ExciseCustomsVAT.VATorSaleTax","10vi",{ind:1});
  t+=_acRi("Central GST (CGST)",pf+".DutyTaxPay.ExciseCustomsVAT.CentralGoodServiceTax","10vii",{ind:1});
  t+=_acRi("State GST (SGST)",pf+".DutyTaxPay.ExciseCustomsVAT.StateGoodServiceTax","10viii",{ind:1});
  t+=_acRi("Integrated GST (IGST)",pf+".DutyTaxPay.ExciseCustomsVAT.IntegratedGoodServiceTax","10ix",{ind:1});
  t+=_acRi("Union Territory GST (UTGST)",pf+".DutyTaxPay.ExciseCustomsVAT.UnionTerrGoodServiceTax","10x",{ind:1});
  t+=_acRi("Any other tax, paid or payable",pf+".DutyTaxPay.ExciseCustomsVAT.OthDutyTaxCess","10xi",{ind:1});
  t+=_acRc("Total (10i to 10xi)",pf+".DutyTaxPay.ExciseCustomsVAT.TotExciseCustomsVAT","10xii");
  t+=_acRc("11 — Cost of goods produced — transferred from Manufacturing Account",pf+".GoodsCostPrdcdFrmMA","11",{hint:"fed from the Manufacturing Account"});
  t+=_acRc("12 — Gross Profit transferred to P&L (6 − 7 − 8 − 9 − 10xii − 11)",pf+".GrossProfitFrmBusProf","12",{hint:"may be negative"});
  t+=sub("Intraday and Futures & Options appendix");
  t+=_acRi("12a — Turnover from Intraday Trading",pf+".IntradayTradingTurnOver","12a");
  t+=_acRi("12b — Income from Intraday Trading (to P&L)",pf+".IntradayTradingIncome","12b");
  t+=_acRi("12c — Turnover from Futures & Options Trading",pf+".TurnoverFutureTrd","12c");
  t+=_acRi("12d — Income from Futures & Options Trading (to P&L)",pf+".IncomeFutureTrd","12d");
  return t;
}

/* ---------- Statement of Profit & Loss (shared: regular / Ind-AS) ---------- */
function accPL(pf, isIas){
  const c=pf+".CreditsToPL.", oi=c+"OthIncome.", d=pf+".DebitsToPL.DebitPlAcnt.", tp=pf+".DebitsToPL.TaxProvAppr.";
  const incAmt=isIas?"OthersAmount":"Amount", incNat=isIas?"OthersDesc":"NatureOfIncome";
  let s="";
  s+=sub("Credits to the Statement of Profit and Loss");
  s+=_acRc("13 — Gross profit transferred from Trading Account (12 + 12b + 12d)",c+"GrossProfitTrnsfFrmTrdAcc","13",{hint:"fed from the Trading Account"});
  s+=sub("14 — Other income");
  s+=_acRi("Rent",oi+"RentInc","14i",{ind:1});
  s+=_acRi("Commission",oi+"Comissions","14ii",{ind:1});
  s+=_acRi("Dividend income",oi+"Dividends","14iii",{ind:1});
  s+=_acRi("Interest income",oi+"InterestInc","14iv",{ind:1});
  s+=_acRi("Profit on sale of fixed assets",oi+"ProfitOnSaleFixedAsset","14v",{ind:1});
  s+=_acRi("Profit on sale of investment (securities chargeable to STT)",oi+"ProfitOnInvChrSTT","14vi",{ind:1});
  s+=_acRi("Profit on sale of other investment",oi+"ProfitOnOthInv","14vii",{ind:1});
  s+=_acRi("Gain (loss) on foreign exchange fluctuation u/s 43AA",oi+"ProfitOnCurrFluct","14viii",{ind:1});
  s+=_acRi("Profit on conversion of inventory into capital asset u/s 28(via)",oi+"ProfitOnCnvInvntryToCapAsst","14ix",{ind:1});
  s+=_acRi("Agricultural income",oi+"ProfitOnAgriIncome","14x",{ind:1});
  s+=grid("accounts."+oi+"OtherIncDtls",
    [{k:incNat,h:"Any other income — nature",t:"txt",w:"auto",req:1,max:125},{k:incAmt,h:"Amount",t:"num",w:"150px",req:1}],
    _acArr(oi+"OtherIncDtls"),{min:"520px",empty:"No other income.",add:"Add other income"});
  s+=_acRi("Liabilities written back",oi+"LiabilityWrittenBack","14xia",{ind:1});
  s+=_acRi("Interest due or received from partnership firm",oi+"AmtofInterest","14xib",{ind:1});
  s+=_acRc("Total any other income (xia + xib + table)",oi+"MiscOthIncome","14xic");
  s+=_acRc("14xii — Total of other income",oi+"TotOthIncome","14xii");
  s+=_acRc("15 — Total of credits to statement of profit and loss (13 + 14xii)",c+"TotCreditsToPL","15");
  s+=sub("Debits to the Statement of Profit and Loss");
  s+=_acRi("16 — Freight outward",d+"Freight","16");
  s+=_acRi("17 — Consumption of stores and spare parts",d+"ConsumptionOfStores","17");
  s+=_acRi("18 — Power and fuel",d+"PowerFuel","18");
  s+=_acRi("19 — Rents",d+"RentExpdr","19");
  s+=_acRi("20 — Repairs to building",d+"RepairsBldg","20");
  s+=_acRi("21 — Repairs to machinery",d+"RepairMach","21");
  s+=sub("22 — Compensation to employees");
  s+=_acRi("Salaries and wages",d+"EmployeeComp.SalsWages","22i",{ind:1});
  s+=_acRi("Bonus",d+"EmployeeComp.Bonus","22ii",{ind:1});
  s+=_acRi("Reimbursement of medical expenses",d+"EmployeeComp.MedExpReimb","22iii",{ind:1});
  s+=_acRi("Leave encashment",d+"EmployeeComp.LeaveEncash","22iv",{ind:1});
  s+=_acRi("Leave travel benefits",d+"EmployeeComp.LeaveTravelBenft","22v",{ind:1});
  s+=_acRi("Contribution to approved superannuation fund",d+"EmployeeComp.ContToSuperAnnFund","22vi",{ind:1});
  s+=_acRi("Contribution to recognised provident fund",d+"EmployeeComp.ContToPF","22vii",{ind:1});
  s+=_acRi("Contribution to recognised gratuity fund",d+"EmployeeComp.ContToGratFund","22viii",{ind:1});
  s+=_acRi("Contribution to any other fund",d+"EmployeeComp.ContToOthFund","22ix",{ind:1});
  s+=_acRi("Any other benefit to employees",d+"EmployeeComp.OthEmpBenftExpdr","22x",{ind:1});
  s+=_acRc("22xi — Total compensation to employees",d+"EmployeeComp.TotEmployeeComp","22xi");
  s+=_acRsel("Any compensation in 22xi paid to non-residents?",d+"EmployeeComp.AnyCompPaidToNonRes",ACC_YN2,"22xiia");
  s+=_acRi("If Yes, amount paid to non-residents",d+"EmployeeComp.AmtPaidToNonRes","22xiib",{ind:1});
  s+=sub("23 — Insurance");
  s+=_acRi("Medical Insurance",d+"Insurances.MedInsur","23i",{ind:1});
  s+=_acRi("Life Insurance",d+"Insurances.LifeInsur","23ii",{ind:1});
  s+=_acRi("Keyman's Insurance",d+"Insurances.KeyManInsur","23iii",{ind:1});
  s+=_acRi("Other Insurance (factory, office, car, goods, etc.)",d+"Insurances.OthInsur","23iv",{ind:1});
  s+=_acRc("23v — Total expenditure on insurance",d+"Insurances.TotInsurances","23v");
  s+=_acRi("24 — Workmen and staff welfare expenses",d+"StaffWelfareExp","24");
  s+=_acRi("25 — Entertainment",d+"Entertainment","25");
  s+=_acRi("26 — Hospitality",d+"Hospitality","26");
  s+=_acRi("27 — Conference",d+"Conference","27");
  s+=_acRi("28 — Sales promotion (other than advertisement)",d+"SalePromoExp","28");
  s+=_acRi("29 — Advertisement",d+"Advertisement","29");
  s+=sub("30 — Commission");
  s+=_acRi("Paid outside India / to a non-resident (not a company)",d+"CommissionExpdrDtls.NonResOtherCompany","30i",{ind:1});
  s+=_acRi("To others",d+"CommissionExpdrDtls.Others","30ii",{ind:1});
  s+=_acRc("30iii — Total commission",d+"CommissionExpdrDtls.Total","30iii");
  s+=sub("31 — Royalty");
  s+=_acRi("Paid outside India / to a non-resident (not a company)",d+"RoyalityDtls.NonResOtherCompany","31i",{ind:1});
  s+=_acRi("To others",d+"RoyalityDtls.Others","31ii",{ind:1});
  s+=_acRc("31iii — Total royalty",d+"RoyalityDtls.Total","31iii");
  s+=sub("32 — Professional / consultancy / technical fees");
  s+=_acRi("Paid outside India / to a non-resident (not a company)",d+"ProfessionalConstDtls.NonResOtherCompany","32i",{ind:1});
  s+=_acRi("To others",d+"ProfessionalConstDtls.Others","32ii",{ind:1});
  s+=_acRc("32iii — Total professional fees",d+"ProfessionalConstDtls.Total","32iii");
  s+=_acRi("33 — Hotel, boarding and lodging",d+"HotelBoardLodge","33");
  s+=_acRi("34 — Travelling expenses (other than foreign)",d+"TravelExp","34");
  s+=_acRi("35 — Foreign travelling expenses",d+"ForeignTravelExp","35");
  s+=_acRi("36 — Conveyance expenses",d+"ConveyanceExp","36");
  s+=_acRi("37 — Telephone expenses",d+"TelephoneExp","37");
  s+=_acRi("38 — Guest house expenses",d+"GuestHouseExp","38");
  s+=_acRi("39 — Club expenses",d+"ClubExp","39");
  s+=_acRi("40 — Festival celebration expenses",d+"FestivalCelebExp","40");
  s+=_acRi("41 — Scholarship",d+"Scholarship","41");
  s+=_acRi("42 — Gift",d+"Gift","42");
  s+=_acRi("43 — Donation",d+"Donation","43");
  s+=sub("44 — Rates and taxes paid or payable (excluding taxes on income)");
  s+=_acRi("Union excise duty",d+"RatesTaxesPays.ExciseCustomsVAT.UnionExciseDuty","44i",{ind:1});
  s+=_acRi("Service tax",d+"RatesTaxesPays.ExciseCustomsVAT.ServiceTax","44ii",{ind:1});
  s+=_acRi("VAT / Sales tax",d+"RatesTaxesPays.ExciseCustomsVAT.VATorSaleTax","44iii",{ind:1});
  s+=_acRi("Cess",d+"RatesTaxesPays.ExciseCustomsVAT.Cess","44iv",{ind:1});
  s+=_acRi("Central GST (CGST)",d+"RatesTaxesPays.ExciseCustomsVAT.CentralGoodServiceTax","44v",{ind:1});
  s+=_acRi("State GST (SGST)",d+"RatesTaxesPays.ExciseCustomsVAT.StateGoodServiceTax","44vi",{ind:1});
  s+=_acRi("Integrated GST (IGST)",d+"RatesTaxesPays.ExciseCustomsVAT.IntegratedGoodServiceTax","44vii",{ind:1});
  s+=_acRi("Union Territory GST (UTGST)",d+"RatesTaxesPays.ExciseCustomsVAT.UnionTerrGoodServiceTax","44viii",{ind:1});
  s+=_acRi("Any other rate/tax/duty/cess incl. STT and CTT",d+"RatesTaxesPays.ExciseCustomsVAT.OthDutyTaxCess","44ix",{ind:1});
  s+=_acRc("44x — Total rates and taxes",d+"RatesTaxesPays.ExciseCustomsVAT.TotExciseCustomsVAT","44x");
  s+=_acRi("45 — Audit fee",d+"AuditFee","45");
  s+=sub("46 — Other expenses");
  s+=grid("accounts."+d+"OtherExpensesDtls",
    [{k:"ExpenseNature",h:"Other expenses — nature",t:"txt",w:"auto",req:1,max:125},{k:"Amount",h:"Amount",t:"num",w:"150px",req:1}],
    _acArr(d+"OtherExpensesDtls"),{min:"520px",empty:"No other expenses.",add:"Add other expense"});
  s+=_acRc("46 — Total other expenses",d+"OtherExpenses","46");
  s+=sub("47 — Bad debts");
  s+=grid("accounts."+d+"BadDebtDtls.BadDebtAmtDtls",
    [{k:"PAN",h:"PAN",t:"txt",w:"130px",max:10},{k:"Aadhaar",h:"Aadhaar",t:"txt",w:"150px",max:12},{k:"Amount",h:"Amount",t:"num",w:"150px",req:1}],
    _acArr(d+"BadDebtDtls.BadDebtAmtDtls"),{min:"520px",empty:"None (Rs 1 lakh or more, with PAN/Aadhaar).",add:"Add bad debt (with PAN/Aadhaar)"});
  s+=_acRc("47i — Total (with PAN/Aadhaar)",d+"BadDebtDtls.BadDebtAmtDtlsTotal","47i");
  s+=note("47ii — Others (more than Rs 1 lakh) where PAN/Aadhaar is not available (provide name and complete address).");
  s+=grid("accounts."+d+"BadDebtDtls.OthersPANNotAvlblDtl",
    [{k:"Name",h:"Name",t:"txt",w:"auto",req:1,max:75},{k:"FlatDoorBlockNumber",h:"Flat/Door/Block",t:"txt",w:"auto",req:1,max:50},
     {k:"PremisesBuildingName",h:"Premises/Building",t:"txt",w:"auto",max:50},{k:"RoadStreetPostOffice",h:"Road/Street/PO",t:"txt",w:"auto",max:50},
     {k:"AreaLocality",h:"Area/Locality",t:"txt",w:"auto",req:1,max:50},{k:"TownCityDistrict",h:"Town/City/District",t:"txt",w:"auto",req:1,max:50},
     {k:"StateCode",h:"State",t:"sel",opts:ACC_STATE,req:1},{k:"CountryCode",h:"Country",t:"sel",opts:ACC_CTRY,req:1},
     {k:"PinCode",h:"PIN",t:"num",w:"110px"},{k:"ZipCode",h:"ZIP",t:"txt",w:"110px",max:15},{k:"Amount",h:"Amount",t:"num",w:"140px",req:1}],
    _acArr(d+"BadDebtDtls.OthersPANNotAvlblDtl"),{min:"1400px",empty:"None (no-PAN, with address).",add:"Add bad debt (no PAN — with address)"});
  s+=_acRc("47ii — Total (no PAN, with address)",d+"BadDebtDtls.OthersPANNotAvlblDtlTotal","47ii");
  s+=_acRi("47iii — Others (amounts less than Rs 1 lakh)",d+"BadDebtDtls.OthersAmtLt1Lakh","47iii");
  s+=_acRc("47iv — Total Bad Debt (47i + 47ii + 47iii)",d+"BadDebtDtls.BadDebt","47iv");
  s+=_acRi("48 — Provision for bad and doubtful debts",d+"ProvForBadDoubtDebt","48");
  s+=_acRi("49 — Other provisions",d+"OthProvisionsExpdr","49");
  s+=_acRc("50 — Profit before interest, depreciation and taxes (PBIDTA)",d+"PBIDTA","50");
  s+=sub("51 — Interest");
  s+=_acRi("Paid outside India / to a non-resident (not a company)",d+"InterestExpdrtDtls.NonResOtherCompany","51i",{ind:1});
  s+=_acRi("To others",d+"InterestExpdrtDtls.Others","51ii",{ind:1});
  s+=_acRc("51iii — Total interest",d+"InterestExpdrtDtls.InterestExpdr","51iii");
  s+=_acRi("52 — Depreciation and amortization",d+"DepreciationAmort","52");
  s+=_acRc("53 — Net Profit before taxes (50 − 51iii − 52)",d+"PBT","53",{hint:"starting figure for Schedule BP"});
  s+=sub("Provisions for tax and appropriations");
  s+=_acRi("54 — Provision for current tax",tp+"ProvForCurrTax","54");
  s+=_acRi("55 — Provision for deferred tax",tp+"ProvDefTax","55");
  s+=_acRc("56 — Profit after tax (53 − 54 − 55)",tp+"ProfitAfterTax","56");
  s+=_acRi("57 — Balance brought forward from previous year",tp+"BalBFPrevYr","57");
  s+=_acRc("58 — Amount available for appropriation (56 + 57)",tp+"AmtAvlAppr","58");
  s+=sub("59 — Appropriations");
  s+=_acRi("Transfer to reserves and surplus",tp+"Appropriations.TrfToReserves","59i",{ind:1});
  s+=_acRi("Proposed / interim dividend",tp+"Appropriations.ProposedDividend","59ii",{ind:1});
  s+=_acRi("Tax on dividend (incl. earlier years)",tp+"Appropriations.TaxOnDividend","59iii",{ind:1});
  s+=_acRi("Appropriation towards CSR (s.135 Companies Act)",tp+"Appropriations.AppropriationsCSR","59iv",{ind:1});
  s+=_acRi("Any other appropriation",tp+"Appropriations.AnyOtherAppr","59v",{ind:1});
  s+=_acRc("59vi — Total appropriations",tp+"Appropriations.TotAppropriations","59vi");
  s+=_acRc("60 — Balance carried to balance sheet (58 − 59vi)",tp+"PartnerAccBalTrf","60",{hint:"feeds Balance Sheet 1Bviii"});
  if(isIas) s+=accOCI();
  else s+=acc44AE(pf);
  return s;
}

/* ---------- item 61 — presumptive income u/s 44AE (regular P&L only) ---------- */
function acc44AE(pf){
  let s=sub("61(i) — Computation of presumptive income from goods carriages under section 44AE");
  s+=note("Applies only where the assessee opts for the presumptive scheme u/s 44AE. If the profit is lower than prescribed, or more than ten goods carriages were owned / leased / hired at any time, books must be maintained and audited.","warn");
  s+=grid("accounts."+pf+".NatOfBus44AE",
    [{k:"NameOfBusiness",h:"Name of business",t:"txt",w:"auto",req:1,max:75},
     {k:"CodeAE",h:"Business code",t:"sel",opts:ACC_44AE_CODE,req:1},
     {k:"Description",h:"Description",t:"txt",w:"auto",max:75}],
    _acArr(pf+".NatOfBus44AE"),{min:"560px",empty:"No nature-of-business row.",add:"Add nature of business",max:3});
  s+=grid("accounts."+pf+".GoodsDtlsUs44AE",
    [{k:"RegNumberGoodsCarriage",h:"Registration no.",t:"txt",w:"150px",req:1,max:11},
     {k:"OwnedLeasedHiredFlag",h:"Owned / leased / hired",t:"sel",opts:ACC_44AE_OWN,req:1},
     {k:"TonnageCapacity",h:"Tonnage (MT)",t:"num",w:"120px",req:1},
     {k:"HoldingPeriod",h:"Months held (1–12)",t:"num",w:"120px",req:1},
     {k:"PresumptiveIncome",h:"Presumptive income",t:"calc",w:"150px",
       f:r=>{const ton=N(r.TonnageCapacity),mo=Math.max(0,N(r.HoldingPeriod));return R(Math.max(7500,mo*(ton>12?1000*ton:7500)));}}],
    _acArr(pf+".GoodsDtlsUs44AE"),{min:"680px",empty:"No goods carriage listed.",add:"Add goods carriage"});
  s+=_acRc("Total number of months (col 4)",pf+".TotalNumOfMonths","206a");
  s+=_acRc("Total presumptive income from goods carriages (col 5)",pf+".TotalPrsumptvIncUs44EGoods","206b");
  s+=_acRc("61(ii) — Total presumptive income from goods carriage u/s 44AE",pf+".TotalPrsumptvIncUs44E","61ii",{cls:"grand"});
  return s;
}

/* ---------- Other Comprehensive Income (Ind-AS P&L only) ---------- */
function accOCI(){
  const na="plias.OtherComprnsvInc.ItemsNotReclsfdPnL.", re="plias.OtherComprnsvInc.ItemsReclsfdPnL.";
  let s=sub("61A — Other Comprehensive Income: items that will NOT be reclassified to P&L");
  s+=_acRi("Changes in revaluation surplus",na+"ChangesInSurplus","61Ai",{ind:1});
  s+=_acRi("Re-measurements of the defined benefit plans",na+"ReMesDefinedBenftPlans","61Aii",{ind:1});
  s+=_acRi("Equity instruments through OCI",na+"EquityOCI","61Aiii",{ind:1});
  s+=_acRi("Fair value changes — own credit risk of FVTPL financial liabilities",na+"FairValFVTPl","61Aiv",{ind:1});
  s+=_acRi("Share of OCI in associates/JVs (not reclassified)",na+"ShareOfOtherComprInc","61Av",{ind:1});
  s+=_acOthTbl(na+"OtherIncDtls","Add item (61A vi)");
  s+=_acRc("Total of (vi)",na+"OthersTotal","61Avi");
  s+=_acRi("Income tax relating to items not reclassified to P&L",na+"IncomeTaxNotPnL","61Avii",{ind:1});
  s+=_acRc("61A — Total",na+"TotalNotPnL","61A");
  s+=sub("61B — Other Comprehensive Income: items that WILL be reclassified to P&L");
  s+=_acRi("Exchange differences on translating a foreign operation",re+"ExchangeDiff","61Bi",{ind:1});
  s+=_acRi("Debt instruments through OCI",re+"DebtsOCI","61Bii",{ind:1});
  s+=_acRi("Effective portion of gains/loss on cash-flow-hedge instruments",re+"EffecPortionGainnLoss","61Biii",{ind:1});
  s+=_acRi("Share of OCI in associates/JVs (to be reclassified)",re+"ShareOCI","61Biv",{ind:1});
  s+=_acOthTbl(re+"OtherIncDtls","Add item (61B v)");
  s+=_acRc("Total of (v)",re+"OthersTotal","61Bv");
  s+=_acRi("Income tax relating to items reclassified to P&L",re+"IncomeTaxReclsPnL","61Bvi",{ind:1});
  s+=_acRc("61B — Total",re+"TotalPnL","61B");
  s+=_acRc("62 — Total Comprehensive Income (56 + 61A + 61B)","plias.OtherComprnsvInc.TotalComprIncome","62");
  return s;
}

/* =====================================================================
   Part A - OI item lists (schema key · item ref · label — from
   books/ITR-6/PART_A_OI.md). Shared by the screen and the exporter so the
   two never drift; the exporter builds the required-leaf skeleton from
   these arrays and every leaf here is a verbatim PARTA_OI schema key.
   ===================================================================== */
const OI_NC5=[["Section28Items","5a","Items falling within the scope of section 28"],
  ["ProformaCreditsDue","5b","Proforma credits, drawbacks, refund of duty/tax"],
  ["PrevYrEscalClaim","5c","Escalation claims accepted during the year"],
  ["OthItemInc","5d","Any other item of income"],
  ["CapReceipt","5e","Capital receipt, if any"]];
const OI36=[["StkInsurPrem","6a","Insurance premium — risk of damage/destruction of stocks or stores [36(1)(i)]"],
  ["EmpHealthInsurPrem","6b","Insurance premium on the health of employees [36(1)(ib)]"],
  ["EmpBonusCommSum","6c","Bonus or commission to an employee otherwise payable as profit/dividend"],
  ["IntOnBorrCap","6d","Interest on borrowed capital [36(1)(iii)]"],
  ["ZeroCoupBondDisc","6e","Discount on a zero-coupon bond [36(1)(iiia)]"],
  ["RecogPFContribAmt","6f","Contributions to a recognised provident fund [36(1)(iv)]"],
  ["AppSuperAnnFundAmt","6g","Contributions to an approved superannuation fund [36(1)(iv)]"],
  ["PensionSchemeSec80CCD","6h","Contribution to a pension scheme u/s 80CCD [36(1)(iva)]"],
  ["AppGratFundAmt","6i","Contributions to an approved gratuity fund [36(1)(v)]"],
  ["OthFundAmt","6j","Contributions to any other fund"],
  ["EmpContributionCredits","6k","Employees' contribution to any fund, not credited by the due date"],
  ["BadDebtDoubtAmt","6l","Bad and doubtful debts [36(1)(vii)]"],
  ["BadDebtDoubtProvn","6m","Provision for bad and doubtful debts [36(1)(viia)]"],
  ["SpecResrvTranfr","6n","Amount transferred to any special reserve [36(1)(viii)]"],
  ["FamPlanPromoExp","6o","Expenditure for promoting family planning amongst employees [36(1)(ix)]"],
  ["SecuritiesPaidAmt","6p","Securities transaction tax paid where such income is not business income"],
  ["MrktLossOthExpLossICDS","6q","Marked-to-market / expected loss as computed under ICDS u/s 145(2)"],
  ["AnyOthDisallowance","6r","Any other disallowance"]];
const OI37=[["CapitalNatureExp","7a","Expenditure of capital nature [37(1)]"],
  ["PersonalExp","7b","Expenditure of personal nature [37(1)]"],
  ["BusOrProfessnExp","7c","Expenditure not wholly and exclusively for business/profession"],
  ["PoliticPartyExp","7d","Advertisement in a publication of a political party"],
  ["LawVoilatPenalExp","7e","Expenditure by way of penalty/fine for violation of any law"],
  ["OthPenalFineExp","7f","Any other penalty or fine"],
  ["OffenceExp","7g","Expenditure incurred for any purpose which is an offence/prohibited by law"],
  ["SocialRespCSR","7h","Expenditure on corporate social responsibility (s.135 Companies Act)"],
  ["ContigentLiability","7i","Amount of any liability of a contingent nature"],
  ["OthAmtNotAllowUs37","7j","Any other amount not allowable under section 37"]];
const OI40=[["NonCompChapXVIIBAmt","8Aa","Amount disallowable u/s 40(a)(i) — non-compliance with Chapter XVII-B"],
  ["NonComp40aiaChapXVIIBAmt","8Ab","Amount disallowable u/s 40(a)(ia)"],
  ["NonComp40aibChapXVIIBAmt","8Ac","Amount disallowable u/s 40(a)(ib)"],
  ["NonComp40aiiiChapXVIIBAmt","8Ad","Amount disallowable u/s 40(a)(iii)"],
  ["TaxAmtOnProfits","8Ae","Amount of tax on profits (s.40(a)(ii))"],
  ["WTAmt","8Af","Amount of wealth-tax (s.40(a)(iia))"],
  ["RolyatyOrServiceFee","8Ag","Royalty/licence/service fee to a State Government undertaking (s.40(a)(iib))"],
  ["IntSalBonPartner","8Ah","Interest/salary/bonus to a partner (s.40(b)/40(ba))"]];
const OI40A=[["AmtPaidUs40A2b","9a","Amounts paid to persons specified u/s 40A(2)(b)"],
  ["AmtGT20kCash","9b","Amount paid otherwise than by account-payee mode u/s 40A(3)/(3A)"],
  ["ProvPmtGrat","9c","Provision for payment of gratuity u/s 40A(7)"],
  ["ContToSetupTrust","9d","Contribution to a non-statutory fund/trust u/s 40A(9)"]];
const OI43=[["TaxDutyCesAmt","a","Any sum of tax, duty, cess or fee"],
  ["ContToEmpPFSFGF","b","Contribution to any provident/superannuation/gratuity or other employee fund"],
  ["EmpBonusComm","c","Bonus or commission to employees"],
  ["IntPayaleToFI","d","Interest on any loan/borrowing from a public financial institution/NBFC"],
  ["SumPayaleLoanBrToFinComp","e","Interest on any loan/advance from a scheduled bank/co-op bank"],
  ["IntPayaleToFISchBank","f","Interest on any loan/borrowing from a deposit-taking NBFC"],
  ["LeaveEncashPayable","g","Sum payable towards leave encashment"],
  ["RailwayAsstsPyble","h","Sum payable to Indian Railways for use of railway assets"],
  ["MSEPayable","i","Sum payable to a micro or small enterprise beyond the MSMED time limit"]];
const OI_EXC=["UnionExciseDuty","ServiceTax","VATorSaleTax","CentralGoodServiceTax","StateGoodServiceTax","IntegratedGoodServiceTax","UnionTerrGoodServiceTax","OthDutyTaxCess"];
const OI13=[["DeemedProfUs33AB","13a","Deemed profit u/s 33AB (tea/coffee/rubber development)"],
  ["DeemedProfUs33ABA","13b","Deemed profit u/s 33ABA (site restoration fund)"],
  ["DeemedProfUs33AC","13c","Deemed profit u/s 33AC (shipping reserve)"]];
const ACC_BASIS=[["reg","Schedule III (non-Ind-AS) accounts"],["ias","Ind-AS accounts (Companies (Ind-AS) Rules, 2015)"],["ol","Company under liquidation — Receipt & Payment account"]];
const ACC_OIYN=[["Y","Yes"],["N","No"]];

/* ---------- Balance Sheet — Schedule III, non-Ind-AS (accBS) ---------- */
function accBS(){
  const el="bs.EquityAndLiablities.", as="bs.Assets.";
  const shf=el+"ShareHolderFund.", sc=shf+"ShareCapital.", rs=shf+"ResrNSurp.";
  let h=sub("Part I — Equity and Liabilities");
  h+=sub("1A — Share capital");
  h+=_acRi("Authorised",sc+"Authorised","1Ai",{ind:1});
  h+=_acRi("Issued, subscribed and fully paid up",sc+"IssuedSubsPaidUp","1Aii",{ind:1});
  h+=_acRi("Subscribed but not fully paid",sc+"SubscribedNotFullyPaid","1Aiii",{ind:1});
  h+=_acRc("Total share capital (Aii + Aiii)",sc+"TotShareCapital","1Aiv");
  h+=sub("1B — Reserves and surplus");
  h+=_acRi("Capital reserve",rs+"CapResr","1Bi",{ind:1});
  h+=_acRi("Capital redemption reserve",rs+"CapRedempResr","1Bii",{ind:1});
  h+=_acRi("Securities premium reserve",rs+"SecurPremResr","1Biii",{ind:1});
  h+=_acRi("Debenture redemption reserve",rs+"DebunRedResr","1Biv",{ind:1});
  h+=_acRi("Revaluation reserve",rs+"RevResr","1Bv",{ind:1});
  h+=_acRi("Share options outstanding amount",rs+"ShareOptOSAmount","1Bvi",{ind:1});
  h+=grid("accounts."+rs+"OtherResrvDtls",
    [{k:"Nature",h:"Other reserve — nature",t:"txt",w:"auto",req:1,max:125},{k:"Amount",h:"Amount",t:"num",w:"150px",req:1}],
    _acArr(rs+"OtherResrvDtls"),{min:"480px",empty:"No other reserves.",add:"Add other reserve"});
  h+=_acRc("Total other reserves (1Bvii)",rs+"OtherResrvTotal","1Bvii");
  h+=_acRi("Surplus — balance in the statement of profit and loss (fed from P&L item 60; debit balance as −ve)",rs+"PLAccount","1Bviii",{hint:"fed from the P&L"});
  h+=_acRc("Total reserves and surplus (1Bix)",rs+"TotResrNSurp","1Bix");
  h+=_acRi("1C — Money received against share warrants",shf+"MoneyRecvdAgainstShares","1C");
  h+=_acRc("1D — Total shareholders' fund (Aiv + Bix + 1C)",shf+"TotShareHolderFund","1D");
  const sam=el+"ShareAppMoneyAllot.";
  h+=sub("2 — Share application money pending allotment");
  h+=_acRi("Pending for less than one year",sam+"PendingLtOneYr","2i",{ind:1});
  h+=_acRi("Pending for more than one year",sam+"PendingMtOneYr","2ii",{ind:1});
  h+=_acRc("Total (i + ii)",sam+"Total","2iii");
  const ncl=el+"NonCurrLiabilities.", ltb=ncl+"LongTermBorrowings.";
  h+=sub("3A — Long-term borrowings");
  h+=_acRi("Bonds/debentures — foreign currency",ltb+"BondsDebentures.ForeignCurrency","3Aia",{ind:1});
  h+=_acRi("Bonds/debentures — rupee",ltb+"BondsDebentures.Rupee","3Aib",{ind:1});
  h+=_acRc("Total bonds/debentures",ltb+"BondsDebentures.Total","3Aic");
  h+=_acRi("Term loans — foreign currency",ltb+"TermLoans.ForeignCurrency","3Aiia",{ind:1});
  h+=_acRi("Rupee term loans — from banks",ltb+"TermLoans.RupeeLoans.FromBanks","3Aiib1",{ind:1});
  h+=_acRi("Rupee term loans — from others",ltb+"TermLoans.RupeeLoans.FromOthers","3Aiib2",{ind:1});
  h+=_acRc("Total rupee term loans",ltb+"TermLoans.RupeeLoans.Total","3Aiib3");
  h+=_acRc("Total term loans",ltb+"TermLoans.TotalTermLoans","3Aiic");
  h+=_acRi("Deferred payment liabilities",ltb+"DeferredPymtLiabilities","3Aiii",{ind:1});
  h+=_acRi("Deposits from related parties",ltb+"DepositsFrmRelatedParties","3Aiv",{ind:1});
  h+=_acRi("Other deposits",ltb+"OtherDeposits","3Av",{ind:1});
  h+=_acRi("Loans and advances from related parties",ltb+"LoansAndAdv","3Avi",{ind:1});
  h+=_acRi("Other loans and advances",ltb+"OthersLoanAdv","3Avii",{ind:1});
  h+=_acRi("Long-term maturities of finance lease obligations",ltb+"LongTermMaturities","3Aviii",{ind:1});
  h+=_acRc("Total long-term borrowings (3Aix)",ltb+"TotalLTBorrowings","3Aix");
  h+=_acRi("3B — Deferred tax liabilities (net)",ncl+"NetDefferedTaxLiability","3B");
  h+=sub("3C — Other long-term liabilities");
  h+=_acRi("Trade payables",ncl+"OthLongTermLiablities.TradePayables","3Ci",{ind:1});
  h+=_acRi("Others",ncl+"OthLongTermLiablities.Others","3Cii",{ind:1});
  h+=_acRc("Total other long-term liabilities",ncl+"OthLongTermLiablities.TotalOthLtLiabilities","3Ciii");
  h+=sub("3D — Long-term provisions");
  h+=_acRi("Provision for employee benefits",ncl+"LongTermProvisions.ProvEmpBenefits","3Di",{ind:1});
  h+=_acRi("Others",ncl+"LongTermProvisions.Others","3Dii",{ind:1});
  h+=_acRc("Total long-term provisions",ncl+"LongTermProvisions.Total","3Diii");
  h+=_acRc("3E — Total non-current liabilities (3A + 3B + 3C + 3D)",ncl+"TotalNonCurrLiabilites","3E");
  const cl=el+"CurrentLiabilities.", stb=cl+"ShortTrmBorrowings.";
  h+=sub("4A — Short-term borrowings");
  h+=_acRi("Loans repayable on demand — from banks",stb+"LoansRepaybleOnDemand.FromBanks","4Aia",{ind:1});
  h+=_acRi("Loans repayable on demand — from NBFCs",stb+"LoansRepaybleOnDemand.FrmNonBanking","4Aib",{ind:1});
  h+=_acRi("Loans repayable on demand — from other financial institutions",stb+"LoansRepaybleOnDemand.OthFinanceInst","4Aic",{ind:1});
  h+=_acRi("Loans repayable on demand — from others",stb+"LoansRepaybleOnDemand.Others","4Aid",{ind:1});
  h+=_acRc("Total loans repayable on demand",stb+"LoansRepaybleOnDemand.TotLoansRepaybleOnDemand","4Aie");
  h+=_acRi("Deposits from related parties",stb+"DepositsFrmRelatedParties","4Aii",{ind:1});
  h+=_acRi("Loans and advances from related parties",stb+"LoansAndAdv","4Aiii",{ind:1});
  h+=_acRi("Other loans and advances",stb+"OthLoansAndAdv","4Aiv",{ind:1});
  h+=_acRi("Other deposits",stb+"OthDeposits","4Av",{ind:1});
  h+=_acRc("Total short-term borrowings (4Avi)",stb+"TotShortTrmBorrowings","4Avi");
  h+=sub("4B — Trade payables");
  h+=_acRi("Outstanding for more than one year",cl+"TradePayables.OSMoreThanOneYr","4Bi",{ind:1});
  h+=_acRi("Others",cl+"TradePayables.Others","4Bii",{ind:1});
  h+=_acRc("Total trade payables",cl+"TradePayables.TotalTradePayables","4Biii");
  const ocl=cl+"OthCurrLiabilities.";
  h+=sub("4C — Other current liabilities");
  h+=_acRi("Current maturities of long-term debt",ocl+"CurrMatOnLTDebt","4Ci",{ind:1});
  h+=_acRi("Current maturities of finance lease obligations",ocl+"CurrMatFinanceOblg","4Cii",{ind:1});
  h+=_acRi("Interest accrued but not due on borrowings",ocl+"AccrInterestNotDue","4Ciii",{ind:1});
  h+=_acRi("Interest accrued and due on borrowings",ocl+"AccrInterest","4Civ",{ind:1});
  h+=_acRi("Income received in advance",ocl+"IncRecvdAdvance","4Cv",{ind:1});
  h+=_acRi("Unpaid dividends",ocl+"UnpaidDividend","4Cvi",{ind:1});
  h+=_acRi("Application money received for allotment (due for refund) and interest accrued",ocl+"AppMonyRecvdAllotSecurities","4Cvii",{ind:1});
  h+=_acRi("Unpaid matured deposits and interest accrued thereon",ocl+"UnpaidMatDeposits","4Cviii",{ind:1});
  h+=_acRi("Unpaid matured debentures and interest accrued thereon",ocl+"UnpaidMatureDebenture","4Cix",{ind:1});
  h+=_acRi("Other payables",ocl+"OthPayables","4Cx",{ind:1});
  h+=_acRc("Total other current liabilities (4Cxi)",ocl+"TotOthCurrLiabilities","4Cxi");
  const sp=cl+"ShortTermProv.";
  h+=sub("4D — Short-term provisions");
  h+=_acRi("Provision for employee benefit",sp+"EmpBenefitProv","4Di",{ind:1});
  h+=_acRi("Provision for income-tax",sp+"ITProvision","4Dii",{ind:1});
  h+=_acRi("Proposed dividend",sp+"ProposedDividend","4Diii",{ind:1});
  h+=_acRi("Tax on dividend",sp+"TaxOnDividend","4Div",{ind:1});
  h+=_acRi("Other",sp+"OthProvision","4Dv",{ind:1});
  h+=_acRc("Total short-term provisions (4Dvi)",sp+"TotShortTermProvisions","4Dvi");
  h+=_acRc("4E — Total current liabilities (4Avi + 4Biii + 4Cxi + 4Dvi)",cl+"TotCurrLiabilitiesProvision","4E");
  h+=_acRc("I — Total Equity and liabilities (1D + 2 + 3E + 4E)",el+"TotEquityAndLiabilities","I",{cls:"grand"});
  /* ---- Assets ---- */
  const nca=as+"NonCurrAssets.", fa=nca+"FixedAsset.";
  h+=sub("Part II — Assets");
  h+=sub("1A — Fixed assets");
  h+=_acRi("Tangible assets — gross block",fa+"Tangible.GrossBlock","1Aia",{ind:1});
  h+=_acRi("Tangible assets — depreciation",fa+"Tangible.Depreciation","1Aib",{ind:1});
  h+=_acRi("Tangible assets — impairment losses",fa+"Tangible.ImpairmentLosses","1Aic",{ind:1});
  h+=_acRc("Tangible assets — net block (ia − ib − ic)",fa+"Tangible.NetBlock","1Aid");
  h+=_acRi("Intangible assets — gross block",fa+"InTangible.GrossBlock","1Aiia",{ind:1});
  h+=_acRi("Intangible assets — amortization",fa+"InTangible.Amortization","1Aiib",{ind:1});
  h+=_acRi("Intangible assets — impairment losses",fa+"InTangible.ImpairmentLosses","1Aiic",{ind:1});
  h+=_acRc("Intangible assets — net block (iia − iib − iic)",fa+"InTangible.NetBlock","1Aiid");
  h+=_acRi("Capital work-in-progress",fa+"CapWrkProg","1Aiii",{ind:1});
  h+=_acRi("Intangible assets under development",fa+"IntangibleAssetUnDev","1Aiv",{ind:1});
  h+=_acRc("Total fixed assets (1Av)",fa+"TotFixedAsset","1Av");
  const nci=nca+"NonCurrInvstmnts.";
  h+=sub("1B — Non-current investments");
  h+=_acRi("Investment in property",nci+"InvInProperty","1Bi",{ind:1});
  h+=_acRi("Equity instruments — listed",nci+"EquityInstruments.ListedEquities","1Biia",{ind:1});
  h+=_acRi("Equity instruments — unlisted",nci+"EquityInstruments.UnListedEquities","1Biib",{ind:1});
  h+=_acRc("Total equity instruments",nci+"EquityInstruments.Total","1Biic");
  h+=_acRi("Preference shares",nci+"PreferenceShares","1Biii",{ind:1});
  h+=_acRi("Government or trust securities",nci+"GovtOrTrustSecurities","1Biv",{ind:1});
  h+=_acRi("Debentures or bonds",nci+"DebenturesOrBonds","1Bv",{ind:1});
  h+=_acRi("Mutual funds",nci+"MutualFunds","1Bvi",{ind:1});
  h+=_acRi("Partnership firms",nci+"InvstmntInPrtnrShipFirm","1Bvii",{ind:1});
  h+=_acRi("Other investments",nci+"OtherInvstmnts","1Bviii",{ind:1});
  h+=_acRc("Total non-current investments (1Bix)",nci+"TotNonCurrInvstmnts","1Bix");
  h+=_acRi("1C — Deferred tax assets (net)",nca+"NetDeferredTaxAssets","1C");
  const lla=nca+"LongTrmLoanAdv.";
  h+=sub("1D — Long-term loans and advances");
  h+=_acRi("Capital advances",lla+"CapitalAdv","1Di",{ind:1});
  h+=_acRi("Security deposits",lla+"SecurityDeposits","1Dii",{ind:1});
  h+=_acRi("Loans and advances to related parties",lla+"LoanAdvRelatedParties","1Diii",{ind:1});
  h+=_acRi("Other loans and advances",lla+"OthLoanAdv","1Div",{ind:1});
  h+=_acRc("Total long-term loans and advances (1Dv)",lla+"TotLTLoanAdv","1Dv");
  h+=_acRi("of Dv — for the purpose of business or profession",lla+"LTLoanAdvDtls.BusOrProf","1Dvia",{ind:1});
  h+=_acRi("of Dv — not for the purpose of business or profession",lla+"LTLoanAdvDtls.NotForBusOrProf","1Dvib",{ind:1});
  h+=_acRi("of Dv — to a shareholder/concern u/s 2(22)(e)",lla+"LTLoanAdvDtls.ShareHolderUs2_22","1Dvic",{ind:1});
  const onc=nca+"OthNonCurrAssets.";
  h+=sub("1E — Other non-current assets");
  h+=_acRi("Long-term trade receivables — secured, considered good",onc+"LTTradeReceivables.Secured","1Eia",{ind:1});
  h+=_acRi("Long-term trade receivables — unsecured, considered good",onc+"LTTradeReceivables.Unsecured","1Eib",{ind:1});
  h+=_acRi("Long-term trade receivables — doubtful",onc+"LTTradeReceivables.Doubtful","1Eic",{ind:1});
  h+=_acRc("Total long-term trade receivables",onc+"LTTradeReceivables.TotOthNonCurrAssets","1Eid");
  h+=_acRi("Others",onc+"Others","1Eii",{ind:1});
  h+=_acRc("Total other non-current assets (1Eiii)",onc+"Total","1Eiii");
  h+=_acRi("of Eiii — due from a shareholder/concern u/s 2(22)(e)",onc+"NonCurrAssetUs2_22","1Eiv",{ind:1});
  h+=_acRc("1F — Total non-current assets (Av + Bix + C + Dv + Eiii)",nca+"TotNonCurrAssets","1F");
  const ca=as+"CurrentAssets.", ci=ca+"CurrInvstmnts.";
  h+=sub("2A — Current investments");
  h+=_acRi("Equity instruments — listed",ci+"EquityInstruments.ListedEquities","2Aia",{ind:1});
  h+=_acRi("Equity instruments — unlisted",ci+"EquityInstruments.UnListedEquities","2Aib",{ind:1});
  h+=_acRc("Total equity instruments",ci+"EquityInstruments.Total","2Aic");
  h+=_acRi("Preference shares",ci+"PreferenceShares","2Aii",{ind:1});
  h+=_acRi("Government or trust securities",ci+"GovtOrTrustSecurities","2Aiii",{ind:1});
  h+=_acRi("Debentures or bonds",ci+"DebenturesOrBonds","2Aiv",{ind:1});
  h+=_acRi("Mutual funds",ci+"MutualFunds","2Av",{ind:1});
  h+=_acRi("Partnership firms",ci+"InvstmntInPrtnrShipFirm","2Avi",{ind:1});
  h+=_acRi("Other investment",ci+"OtherInvstmnts","2Avii",{ind:1});
  h+=_acRc("Total current investments (2Aviii)",ci+"TotCurrInvstmnts","2Aviii");
  const iv=ca+"Inventories.";
  h+=sub("2B — Inventories");
  h+=_acRi("Raw materials",iv+"RawMatl","2Bi",{ind:1});
  h+=_acRi("Work-in-progress",iv+"WorkInProgress","2Bii",{ind:1});
  h+=_acRi("Finished goods",iv+"FinOrTradGood","2Biii",{ind:1});
  h+=_acRi("Stock-in-trade (goods acquired for trading)",iv+"StkInTrade","2Biv",{ind:1});
  h+=_acRi("Stores and spares",iv+"StoresConsumables","2Bv",{ind:1});
  h+=_acRi("Loose tools",iv+"LooseTools","2Bvi",{ind:1});
  h+=_acRi("Others",iv+"Others","2Bvii",{ind:1});
  h+=_acRc("Total inventories (2Bviii)",iv+"TotInventries","2Bviii");
  h+=sub("2C — Trade receivables");
  h+=_acRi("Outstanding for more than six months",ca+"TradeReceivables.OSMoreThanSixMonths","2Ci",{ind:1});
  h+=_acRi("Others",ca+"TradeReceivables.Others","2Cii",{ind:1});
  h+=_acRc("Total trade receivables",ca+"TradeReceivables.TotalTradeReceivables","2Ciii");
  const ce=ca+"CashNCashEquivalents.";
  h+=sub("2D — Cash and cash equivalents");
  h+=_acRi("Balances with banks",ce+"BalWithBanks","2Di",{ind:1});
  h+=_acRi("Cheques, drafts in hand",ce+"ChequesDrafts","2Dii",{ind:1});
  h+=_acRi("Cash in hand",ce+"CashInHand","2Diii",{ind:1});
  h+=_acRi("Others",ce+"Others","2Div",{ind:1});
  h+=_acRc("Total cash and cash equivalents (2Dv)",ce+"TotCashNCashEquivalents","2Dv");
  const stl=ca+"TotShortTermLoanAdv.";
  h+=sub("2E — Short-term loans and advances");
  h+=_acRi("Loans and advances to related parties",stl+"LoanAdv","2Ei",{ind:1});
  h+=_acRi("Others",stl+"Others","2Eii",{ind:1});
  h+=_acRc("Total short-term loans and advances (2Eiii)",stl+"TotShrtTermLoans","2Eiii");
  h+=_acRi("of Eiii — for the purpose of business or profession",stl+"STLoanAdvDtls.BusOrProf","2Eiva",{ind:1});
  h+=_acRi("of Eiii — not for the purpose of business or profession",stl+"STLoanAdvDtls.NotForBusOrProf","2Eivb",{ind:1});
  h+=_acRi("of Eiii — to a shareholder/concern u/s 2(22)(e)",stl+"STLoanAdvDtls.ShareHolderUs2_22","2Eivc",{ind:1});
  h+=_acRi("2F — Other current assets",ca+"OtherCurrAssets","2F");
  h+=_acRc("2G — Total current assets (Aviii + Bviii + Ciii + Dv + Eiii + F)",ca+"TotCurrAssets","2G");
  h+=_acRc("II — Total Assets (1F + 2G)","bs.TotalAssets","II",{cls:"grand"});
  return h;
}

/* ---------- Balance Sheet — Ind AS (accBSias) ---------- */
function accBSias(){
  const el="bsias.EquityAndLiablities.";
  const eq=el+"Equity.", esc=eq+"EquityShareCapital.", oe=eq+"OtherEquityReserv.";
  let h=sub("Part I — Equity and Liabilities");
  h+=sub("1A — Equity share capital");
  h+=_acRi("Authorised",esc+"Authorised","1Ai",{ind:1});
  h+=_acRi("Issued, subscribed and fully paid up",esc+"IssuedSubsPaidUp","1Aii",{ind:1});
  h+=_acRi("Subscribed but not fully paid",esc+"SubscribedNotFullyPaid","1Aiii",{ind:1});
  h+=_acRc("Total share capital (1Aiv)",esc+"TotShareCapital","1Aiv");
  h+=sub("1B — Other equity");
  h+=_acRi("Capital redemption reserve",oe+"CapRedempResr","1Bia",{ind:1});
  h+=_acRi("Debenture redemption reserve",oe+"DebunRedResr","1Bib",{ind:1});
  h+=_acRi("Share options outstanding amount",oe+"ShareOptOSAmount","1Bic",{ind:1});
  h+=_acOthTbl(oe+"OtherResrvDtls","Add other reserve (1Bid)");
  h+=_acRc("Total of other reserves table",oe+"OthersTotal","1Bid");
  h+=_acRc("Total other reserves (1Bie)",oe+"TotalOtherResrv","1Bie");
  h+=_acRi("Retained earnings (fed from P&L item 60)",oe+"RetainedEarngs","1Bii",{hint:"fed from the P&L Ind-AS"});
  h+=_acRc("Total reserves and retained earnings (1Biii)",oe+"TotResrNRetEar","1Biii");
  h+=_acRc("1C — Total equity",oe+"TotalEquity","1C",{cls:"grand"});
  const li=el+"Liabilities.", ncl=li+"NonCurrLiabilities.", fl=ncl+"FinancialLiabilities.";
  h+=sub("Non-current liabilities · I — Financial liabilities (borrowings)");
  h+=_acRi("Bonds/debentures — foreign currency",fl+"BondsDebentures.ForeignCurrency","a1",{ind:1});
  h+=_acRi("Bonds/debentures — rupee",fl+"BondsDebentures.Rupee","a2",{ind:1});
  h+=_acRc("Total bonds/debentures",fl+"BondsDebentures.Total","a3");
  h+=_acRi("Term loans — foreign currency",fl+"TermLoans.ForeignCurrency","b1",{ind:1});
  h+=_acRi("Rupee term loans — from banks",fl+"TermLoans.RupeeLoans.FromBanks","b2a",{ind:1});
  h+=_acRi("Rupee term loans — from others",fl+"TermLoans.RupeeLoans.FromOthers","b2b",{ind:1});
  h+=_acRc("Total rupee term loans",fl+"TermLoans.RupeeLoans.Total","b2");
  h+=_acRc("Total term loans",fl+"TermLoans.TotalTermLoans","b3");
  h+=_acRi("Deferred payment liabilities",fl+"DeferredPymtLiabilities","c",{ind:1});
  h+=_acRi("Deposits",fl+"Deposits","d",{ind:1});
  h+=_acRi("Loans from related parties",fl+"LoansReltdParties","e",{ind:1});
  h+=_acRi("Long-term maturities of finance lease obligations",fl+"LongTermMaturities","f",{ind:1});
  h+=_acRi("Liability component of compound financial instruments",fl+"LiabilityComp","g",{ind:1});
  h+=_acRi("Other loans",fl+"OtherLoans","h",{ind:1});
  h+=_acRc("Total long-term borrowings",fl+"TotalLTBorrowings","i");
  h+=_acRi("Trade payables",fl+"TradePayables","j");
  h+=_acRi("Other financial liabilities",fl+"OtherFinancialLiab","k");
  const prv=ncl+"Provisions.";
  h+=sub("II — Provisions");
  h+=_acRi("Provision for employee benefits",prv+"ProvEmpBenefits","IIa",{ind:1});
  h+=_acOthTbl(prv+"OthersProvisions","Add other provision (IIb)");
  h+=_acRc("Total of other provisions",prv+"OthersTotal","IIb");
  h+=_acRc("Total provisions (IIc)",prv+"TotalProvisions","IIc");
  h+=_acRi("III — Deferred tax liabilities (net)",ncl+"DefrdTaxCurrLiabilites","III");
  const onl=ncl+"OtherNonCurLiabilites.";
  h+=sub("IV — Other non-current liabilities");
  h+=_acRi("Advances",onl+"Advances","IVa",{ind:1});
  h+=_acOthTbl(onl+"OthersNonCurrLiab","Add other non-current liability (IVb)");
  h+=_acRc("Total of others",onl+"OthersTotal","IVb");
  h+=_acRc("Total other non-current liabilities (IVc)",onl+"TotalOthNonCurrLiab","IVc");
  h+=_acRc("2A — Total non-current liabilities",ncl+"TotalNonCurrLiab","2A");
  const cl=li+"CurrentLiabilities.", flb=cl+"FinancialLiabBorrowings.";
  h+=sub("Current liabilities · I — Financial liabilities (borrowings)");
  h+=_acRi("Loans repayable on demand — from banks",flb+"LoansRepaybleOnDemand.FromBanks","i",{ind:1});
  h+=_acRi("Loans repayable on demand — from other parties",flb+"LoansRepaybleOnDemand.FrmOtherParties","i2",{ind:1});
  h+=_acRc("Total loans repayable on demand",flb+"LoansRepaybleOnDemand.TotLoansRepaybleOnDemand","i3");
  h+=_acRi("Loans from related parties",flb+"LoansFrmRelatedParties","b",{ind:1});
  h+=_acRi("Deposits",flb+"Deposits","c",{ind:1});
  h+=_acOthTbl(flb+"BrwngOtherLoans","Add other loan (d)");
  h+=_acRc("Total of other loans",flb+"OthersTotal","d");
  h+=_acRc("Total borrowings",flb+"TotalBorrowings","Ia");
  h+=_acRi("Trade payables",flb+"TradePayables","ii");
  const ofl=cl+"OthFinancialLiabilities.";
  h+=sub("III — Other financial liabilities");
  h+=_acRi("Current maturities of long-term debt",ofl+"CurrMatOnLTDebt","a",{ind:1});
  h+=_acRi("Current maturities of finance lease obligations",ofl+"CurrMatFinanceOblg","b",{ind:1});
  h+=_acRi("Interest accrued",ofl+"AccrInterest","c",{ind:1});
  h+=_acRi("Unpaid dividends",ofl+"UnpaidDividend","d",{ind:1});
  h+=_acRi("Application money received for allotment (due for refund) and interest",ofl+"AppMonyRecvdAllotSecurities","e",{ind:1});
  h+=_acRi("Unpaid matured deposits and interest accrued",ofl+"UnpaidMatDeposits","f",{ind:1});
  h+=_acRi("Unpaid matured debentures and interest accrued",ofl+"UnpaidMatureDebenture","g",{ind:1});
  h+=_acOthTbl(ofl+"OthPayables","Add other payable (h)");
  h+=_acRc("Total of other payables",ofl+"OthersTotal","h");
  h+=_acRc("Total other financial liabilities (Iiii)",ofl+"TotOthFinancialLiab","Iiii");
  h+=_acRc("Total financial liabilities (Iiv)",cl+"TottalFinancialLiab","Iiv");
  const ocl=cl+"OtherCuurLiabilities.";
  h+=sub("II — Other current liabilities");
  h+=_acRi("Revenue received in advance",ocl+"RevenueRecvdAdvance","a",{ind:1});
  h+=_acOthTbl(ocl+"OtherAdvance","Add other advance (b)");
  h+=_acRc("Total of other advances",ocl+"OthersAdvTotal","b");
  h+=_acOthTbl(ocl+"Others","Add other (c)");
  h+=_acRc("Total of others",ocl+"OthersTotal","c");
  h+=_acRc("Total other current liabilities (IId)",ocl+"TotalOthCurrLiab","IId");
  const pv2=cl+"Provosions.";
  h+=sub("III — Provisions");
  h+=_acRi("Provision for employee benefits",pv2+"ProvosionEmpBenft","a",{ind:1});
  h+=_acOthTbl(pv2+"OthersProvisions","Add other provision (b)");
  h+=_acRc("Total of other provisions",pv2+"OthersTotal","b");
  h+=_acRc("Total provisions (IIIc)",pv2+"TotalProvosions","IIIc");
  h+=_acRi("IV — Current tax liabilities (net)",cl+"CurrTaxLiabilities","IV");
  h+=_acRc("2B — Total current liabilities",cl+"TotalCurrentLiab","2B");
  h+=_acRc("Total Equity and liabilities (1C + 2A + 2B)",cl+"TotalEquityLiab","1(I)",{cls:"grand"});
  /* ---- Assets ---- */
  const ppe="bsias.Assets.NonCurrAssets.PropertyPlantEquip.";
  h+=sub("Part II — Assets · Non-current · Property, plant and equipment");
  h+=_acRi("Gross block",ppe+"GrossBlock","Aa",{ind:1});
  h+=_acRi("Depreciation",ppe+"Depreciation","Ab",{ind:1});
  h+=_acRi("Impairment losses",ppe+"ImpairmentLosses","Ac",{ind:1});
  h+=_acRc("Net block (Ad)",ppe+"NetBlock","Ad");
  h+=_acRi("Capital work-in-progress",ppe+"CapWrkProg","B");
  h+=_acRi("Investment property — gross block",ppe+"InvstPropGrossBlock","Ca",{ind:1});
  h+=_acRi("Investment property — depreciation",ppe+"InvstPropDepreciation","Cb",{ind:1});
  h+=_acRi("Investment property — impairment losses",ppe+"InvstPropImprLosses","Cc",{ind:1});
  h+=_acRc("Investment property — net block (Cd)",ppe+"InvstPropNetBlock","Cd");
  h+=_acRi("Goodwill — gross block",ppe+"GoodWlGrossBlock","Da",{ind:1});
  h+=_acRi("Goodwill — impairment losses",ppe+"GoodWlImprLosses","Db",{ind:1});
  h+=_acRc("Goodwill — net block (Dc)",ppe+"GoodWlNetBlock","Dc");
  h+=_acRi("Other intangible assets — gross block",ppe+"OthIntAstGrossBlock","Ea",{ind:1});
  h+=_acRi("Other intangible assets — amortisation",ppe+"OthIntAstAmortisation","Eb",{ind:1});
  h+=_acRi("Other intangible assets — impairment losses",ppe+"OthIntAstImprLosses","Ec",{ind:1});
  h+=_acRc("Other intangible assets — net block (Ed)",ppe+"OthIntAstNetBlock","Ed");
  h+=_acRi("Intangible assets under development",ppe+"IntAstUndrDevlpmnt","F");
  h+=_acRi("Biological assets — gross block",ppe+"BioAstGrossBlock","Ga",{ind:1});
  h+=_acRi("Biological assets — impairment losses",ppe+"BioAstImprLosses","Gb",{ind:1});
  h+=_acRc("Biological assets — net block (Gc)",ppe+"BioAstNetBlock","Gc");
  const nfa=ppe+"FinancialAssets.", inv=nfa+"Investments.";
  h+=sub("H — Financial assets · Investments");
  h+=_acRi("Listed equities",inv+"ListedEquities","Hi1",{ind:1});
  h+=_acRi("Unlisted equities",inv+"UnListedEquities","Hi2",{ind:1});
  h+=_acRc("Total equities",inv+"Total","Hi3");
  h+=_acRi("Preference shares",inv+"InvstPrfShares","Hii",{ind:1});
  h+=_acRi("Government or trust securities",inv+"InvstGovtTrust","Hiii",{ind:1});
  h+=_acRi("Debentures",inv+"InvstInDebenture","Hiv",{ind:1});
  h+=_acRi("Mutual funds",inv+"InvstInMutualFunds","Hv",{ind:1});
  h+=_acRi("Partnership firms",inv+"InvstInPartnershpFirm","Hvi",{ind:1});
  h+=_acOthTbl(inv+"OtherInvestment","Add other investment");
  h+=_acRc("Total of other investments",inv+"OthersTotal","Hvii");
  h+=_acRc("Total non-current investments (HI)",inv+"TotalNonCurrentInvst","HI");
  h+=sub("H II — Trade receivables");
  h+=_acRi("Secured, considered good",nfa+"TradeReceivables.SecuredConsGoods","HIIa",{ind:1});
  h+=_acRi("Unsecured, considered good",nfa+"TradeReceivables.UnSecuredConsGoods","HIIb",{ind:1});
  h+=_acRi("Doubtful",nfa+"TradeReceivables.Doubtful","HIIc",{ind:1});
  h+=_acRc("Total trade receivables (HII)",nfa+"TradeReceivables.TotalTradeReceivbls","HII");
  const lo=nfa+"Loans.";
  h+=sub("H III — Loans");
  h+=_acRi("Security deposits",lo+"SecurityDepsts","HIIIa",{ind:1});
  h+=_acRi("Loans to related parties",lo+"LoansRltdParties","HIIIb",{ind:1});
  h+=_acOthTbl(lo+"OtherLoans","Add other loan");
  h+=_acRc("Total of other loans",lo+"OthersTotal","HIIIc");
  h+=_acRc("Total loans (HIII)",lo+"TotalLoans","HIII");
  h+=sub("H IV — Other financial assets");
  h+=_acRi("Bank deposits",nfa+"OtherFinacialAssets.BankDeposits","HIVa",{ind:1});
  h+=_acRi("Other deposits",nfa+"OtherFinacialAssets.OtherDeposits","HIVb",{ind:1});
  h+=_acRc("Total other financial assets (HIV)",nfa+"OtherFinacialAssets.TotalOthFinancialAsst","HIV");
  h+=_acRi("Deferred tax assets (net)",nfa+"OtherFinacialAssets.DefrdTaxAsst","J0");
  const ona=nfa+"OtherNonCurrentAssets.";
  h+=sub("J — Other non-current assets");
  h+=_acRi("Capital advances",ona+"CapitalAdvanc","Ja",{ind:1});
  h+=_acRi("Advances other than capital advances",ona+"AdvancOthCapital","Jb",{ind:1});
  h+=_acOthTbl(ona+"OtherNonCurrAsst","Add other non-current asset");
  h+=_acRc("Total of others",ona+"OthersTotal","Jc");
  h+=_acRc("Total other non-current assets (J)",ona+"TotalNonCurrAsst","J");
  h+=_acRc("Total non-current assets",nfa+"TotalNonCurrntAsst","NCA",{cls:"grand"});
  const cca="bsias.Assets.CurrentAssets.", cin=cca+"Inventories.";
  h+=sub("Current assets · 2A — Inventories");
  h+=_acRi("Raw materials",cin+"RawMaterials","2Aa",{ind:1});
  h+=_acRi("Work-in-progress",cin+"WorkInProgress","2Ab",{ind:1});
  h+=_acRi("Finished goods",cin+"FinishedGoods","2Ac",{ind:1});
  h+=_acRi("Stock-in-trade",cin+"StockInTrade","2Ad",{ind:1});
  h+=_acRi("Stores and spares",cin+"StoresSpares","2Ae",{ind:1});
  h+=_acRi("Loose tools",cin+"LooseTools","2Af",{ind:1});
  h+=_acRi("Others",cin+"Others","2Ag",{ind:1});
  h+=_acRc("Total inventories (2A)",cin+"TotalInventories","2A");
  const cfa=cca+"FinancialAssets.", cinv=cfa+"Investments.";
  h+=sub("2B — Financial assets · Investments");
  h+=_acRi("Listed equities",cinv+"ListedEquities","Bi1",{ind:1});
  h+=_acRi("Unlisted equities",cinv+"UnListedEquities","Bi2",{ind:1});
  h+=_acRc("Total equities",cinv+"Total","Bi3");
  h+=_acRi("Preference shares",cinv+"InvstPrfShares","Bii",{ind:1});
  h+=_acRi("Government or trust securities",cinv+"InvstGovtTrust","Biii",{ind:1});
  h+=_acRi("Debentures",cinv+"InvstInDebenture","Biv",{ind:1});
  h+=_acRi("Mutual funds",cinv+"InvstInMutualFunds","Bv",{ind:1});
  h+=_acRi("Partnership firms",cinv+"InvstInPartnershpFirm","Bvi",{ind:1});
  h+=_acRi("Other investment",cinv+"OtherInvestment","Bvii",{ind:1});
  h+=_acRc("Total current investments (BI)",cinv+"TotalCurrentInvst","BI");
  h+=sub("B II — Trade receivables");
  h+=_acRi("Secured, considered good",cfa+"TradeReceivables.SecuredConsGoods","BIIa",{ind:1});
  h+=_acRi("Unsecured, considered good",cfa+"TradeReceivables.UnSecuredConsGoods","BIIb",{ind:1});
  h+=_acRi("Doubtful",cfa+"TradeReceivables.Doubtful","BIIc",{ind:1});
  h+=_acRc("Total trade receivables (BII)",cfa+"TradeReceivables.TotalTradeReceivbls","BII");
  const cce=cfa+"CashEquivalents.";
  h+=sub("B III — Cash and cash equivalents");
  h+=_acRi("Balances with banks",cce+"BalancesWithBanks","BIIIa",{ind:1});
  h+=_acRi("Cheques, drafts in hand",cce+"ChequeDraftsInHand","BIIIb",{ind:1});
  h+=_acRi("Cash on hand",cce+"CashOnHand","BIIIc",{ind:1});
  h+=_acOthTbl(cce+"OtherCashDtls","Add other cash item");
  h+=_acRc("Total of others",cce+"OthersTotal","BIIId");
  h+=_acRc("Total cash and cash equivalents (BIII)",cce+"TotalCashEquivalents","BIII");
  h+=_acRi("B IV — Bank balances other than cash and cash equivalents",cfa+"BankBalanceOther","BIV");
  const clo=cfa+"Loans.";
  h+=sub("B V — Loans");
  h+=_acRi("Security deposits",clo+"SecurityDepsts","BVa",{ind:1});
  h+=_acRi("Loans to related parties",clo+"LoansRltdParties","BVb",{ind:1});
  h+=_acOthTbl(clo+"OtherLoans","Add other loan");
  h+=_acRc("Total of other loans",clo+"OthersTotal","BVc");
  h+=_acRc("Total loans (BV)",clo+"TotalLoans","BV");
  h+=_acRi("B VI — Other financial assets",cfa+"OtherFinancialAsst","BVI");
  h+=_acRc("Total financial assets (2B)",cfa+"TotalFinancialAsst","2Bfa");
  h+=_acRi("2C — Current tax assets (net)",cfa+"CurrentTaxAsst","2C");
  const oca=cfa+"OtherCurrentAssets.";
  h+=sub("2D — Other current assets");
  h+=_acRi("Advances other than capital advances",oca+"AdvancOthCapital","2Da",{ind:1});
  h+=_acOthTbl(oca+"OthersCurrentAssts","Add other current asset");
  h+=_acRc("Total of others",oca+"OthersTotal","2Db");
  h+=_acRc("Total other current assets (2D)",oca+"TotalOthCurrentAsst","2D");
  h+=_acRc("Total current assets",oca+"TotalCurrAsst","CA");
  h+=_acRc("II — Total Assets","bsias.TotalAssets","II",{cls:"grand"});
  return h;
}

/* ---------- Part A - OI (Other Information) screen (accOI) ---------- */
function accOI(){
  const o="oi."; let h="";
  h+=note("Part A-OI — Other Information. Mandatory for a filer liable to audit u/s 44AB. Each total feeds a corresponding add-back in Schedule BP.");
  h+=_acRsel("1 — Method of accounting employed in the previous year",o+"MethodOfAcct",ACC_ACCT,"1",{req:1});
  h+=_acRsel("2 — Is there any change in the method of accounting?",o+"ChangeInAcctMethFlg",ACC_OIYN,"2",{req:1});
  h+=_acRi("3a — Increase in profit / decrease in loss due to ICDS deviation",o+"ProfDeviatDueAcctMeth","3a",{hint:"auto-filled from Schedule ICDS when present"});
  h+=_acRi("3b — Decrease in profit / increase in loss due to ICDS deviation",o+"DecProOrIncLossUs145_2","3b",{hint:"auto-filled from Schedule ICDS when present"});
  h+=sub("4 — Method of valuation of closing stock");
  h+=_acRsel("4a — Raw material",o+"MethodOfValClgStk.ValRawMaterial",ACC_VAL,"4a");
  h+=_acRsel("4b — Finished goods",o+"MethodOfValClgStk.ValFinishedGoods",ACC_VAL,"4b");
  h+=_acRsel("4c — Is there any change in the stock valuation method?",o+"MethodOfValClgStk.ChngStockValMetFlg",ACC_OIYN,"4c");
  h+=_acRi("4d — Increase in profit / decrease in loss due to deviation in valuation",o+"MethodOfValClgStk.EffectOnPL","4d");
  h+=_acRi("4e — Decrease in profit / increase in loss due to deviation in valuation",o+"MethodOfValClgStk.DecProOrIncLossUs145_A","4e");
  h+=sub("5 — Amounts not credited to the statement of profit and loss");
  OI_NC5.forEach(x=>{ h+=_acRi(x[1]+" — "+x[2],o+"NoCredToPLAmt."+x[0],x[1],{ind:1}); });
  h+=_acRc("5f — Total amounts not credited to the P&L",o+"NoCredToPLAmt.TotNoCredToPLAmt","5f");
  h+=sub("6 — Amounts debited to the P&L, disallowable under section 36");
  OI36.forEach(x=>{ h+=_acRi(x[1]+" — "+x[2],o+"AmtDisallUs36."+x[0],x[1],{ind:1}); });
  h+=_acRc("6s — Total amount disallowable under section 36",o+"AmtDisallUs36.TotAmtDisallUs36","6s");
  h+=_acRi("6t(i) — Number of employees deployed in India",o+"AmtDisallUs36.NoOfEmployeesEmployed.DeployedInIndia","6ti",{ind:1});
  h+=_acRi("6t(ii) — Number of employees deployed outside India",o+"AmtDisallUs36.NoOfEmployeesEmployed.DeployedOutSideIndia","6tii",{ind:1});
  h+=_acRc("6t(iii) — Total number of employees",o+"AmtDisallUs36.NoOfEmployeesEmployed.Total","6tiii");
  h+=sub("7 — Amounts debited to the P&L, disallowable under section 37");
  OI37.forEach(x=>{ h+=_acRi(x[1]+" — "+x[2],o+"AmtDisallUs37."+x[0],x[1],{ind:1}); });
  h+=_acRc("7k — Total amount disallowable under section 37",o+"AmtDisallUs37.TotAmtDisallUs37","7k");
  h+=sub("8A — Amounts debited to the P&L, disallowable under section 40");
  OI40.forEach(x=>{ h+=_acRi(x[1]+" — "+x[2],o+"AmtDisallUs40."+x[0],x[1],{ind:1}); });
  h+=_acRi("8Ai — Any other disallowance under section 40",o+"AmtDisallUs40.AnyOthDisallowance","8Ai",{ind:1});
  h+=_acRc("8Aj — Total amount disallowable under section 40",o+"AmtDisallUs40.TotAmtDisallUs40","8Aj");
  h+=_acRi("8B — Amount of section 40 disallowance of an earlier year now allowable",o+"AmtDisallUs40.AnyAmtOfSec40AllowPrevYr","8B");
  h+=sub("9 — Amounts debited to the P&L, disallowable under section 40A");
  OI40A.forEach(x=>{ h+=_acRi(x[1]+" — "+x[2],o+"AmtDisallUs40A."+x[0],x[1],{ind:1}); });
  h+=_acRi("9e — Any other disallowance under section 40A",o+"AmtDisallUs40A.AnyOthDisallowance","9e",{ind:1});
  h+=_acRc("9f — Total amount disallowable under section 40A",o+"AmtDisallUs40A.TotAmtDisallUs40A","9f");
  h+=sub("10 — Section 43B: disallowed in an earlier year, allowable this year");
  OI43.forEach(x=>{ h+=_acRi("10"+x[1]+" — "+x[2],o+"AmtDisallUs43BPyNowAll.AmtUs43B."+x[0],"10"+x[1],{ind:1}); });
  h+=_acRc("10 — Total (allowable this year)",o+"AmtDisallUs43BPyNowAll.AmtUs43B.TotAmtUs43b","10tot");
  h+=sub("11 — Section 43B: debited this year, disallowable");
  OI43.forEach(x=>{ h+=_acRi("11"+x[1]+" — "+x[2],o+"AmtDisall43B.AmtUs43B."+x[0],"11"+x[1],{ind:1}); });
  h+=_acRc("11 — Total (disallowable this year)",o+"AmtDisall43B.AmtUs43B.TotAmtUs43b","11tot");
  h+=sub("12 — Amounts of tax/duty/cess/fee outstanding (credit balance in the accounts)");
  OI_EXC.forEach((k,i)=>{ h+=_acRi("12"+String.fromCharCode(97+i)+" — "+k,o+"AmtExciseCustomsVATOutstanding.ExciseCustomsVAT."+k,"12"+String.fromCharCode(97+i),{ind:1}); });
  h+=_acRc("12i — Total outstanding",o+"AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.TotExciseCustomsVAT","12i");
  h+=sub("13 — Amounts deemed to be profits chargeable under section 33AB/33ABA/33AC");
  OI13.forEach(x=>{ h+=_acRi(x[1]+" — "+x[2],o+x[0],x[1],{ind:1}); });
  h+=_acRc("13 — Total deemed profits (33AB + 33ABA + 33AC)",o+"DeemedProfUs33ABs","13");
  h+=_acRi("14 — Amount of profit chargeable to tax under section 41",o+"ProfTaxAmtUs41","14");
  h+=_acRi("15 — Amount of income/expenditure of a prior period credited/debited to the P&L",o+"PriorAmtIncCrDrPL","15");
  h+=_acRi("16 — Amount of expenditure disallowed under section 14A",o+"AmountOfExpDisAllwUs14A","16");
  h+=_acRi("17 — Amount of interest inadmissible under section 23 of the MSMED Act, 2006",o+"InterestDisAllowUs23SMEAct","17");
  h+=_acRsel("18 — Whether an option is exercised under section 92CE(2A)?",o+"ScheduleTPSAFlg",ACC_OIYN,"18");
  return h;
}

/* ---------- Part A - QD (Quantitative Details) screen (accQD) ---------- */
function accQD(){
  let h=note("Part A-QD — Quantitative details of stock. Mandatory for a filer liable to audit u/s 44AB. Enter physical quantities (no commas, no units).");
  h+=sub("(a) Trading concern");
  h+=grid("accounts.qd.trd",
    [{k:"ItemName",h:"Item name",t:"txt",w:"auto",req:1,max:50},{k:"UnitOfMeasure",h:"Unit",t:"sel",opts:ACC_UNIT,req:1},
     {k:"OpeningStock",h:"Opening",t:"num",w:"110px"},{k:"PurchaseQty",h:"Purchase",t:"num",w:"110px"},
     {k:"SaleQty",h:"Sales",t:"num",w:"110px"},{k:"ClgStock",h:"Closing",t:"num",w:"110px"},
     {k:"AnyShortExces",h:"Shortage/excess",t:"num",w:"120px"}],
    _acArr("qd.trd"),{min:"900px",empty:"No trading items.",add:"Add trading item"});
  h+=sub("(b) Manufacturing concern — raw materials");
  h+=grid("accounts.qd.raw",
    [{k:"ItemName",h:"Item name",t:"txt",w:"auto",req:1,max:50},{k:"UnitOfMeasure",h:"Unit",t:"sel",opts:ACC_UNIT,req:1},
     {k:"OpeningStock",h:"Opening",t:"num",w:"100px"},{k:"PurchaseQty",h:"Purchase",t:"num",w:"100px"},
     {k:"PrevYrConsum",h:"Consumption",t:"num",w:"110px"},{k:"SaleQty",h:"Sales",t:"num",w:"90px"},
     {k:"ClgStock",h:"Closing",t:"num",w:"90px"},{k:"yldFinisProd",h:"Yield",t:"num",w:"90px"},
     {k:"PercentYld",h:"% yield",t:"num",w:"90px"},{k:"AnyShortExces",h:"Shortage/excess",t:"num",w:"110px"}],
    _acArr("qd.raw"),{min:"1200px",empty:"No raw materials.",add:"Add raw material"});
  h+=sub("(c) Manufacturing concern — finished goods / by-products");
  h+=grid("accounts.qd.fin",
    [{k:"ItemName",h:"Item name",t:"txt",w:"auto",req:1,max:50},{k:"UnitOfMeasure",h:"Unit",t:"sel",opts:ACC_UNIT,req:1},
     {k:"OpeningStock",h:"Opening",t:"num",w:"100px"},{k:"PurchaseQty",h:"Purchase",t:"num",w:"100px"},
     {k:"PrevyrManfact",h:"Manufactured",t:"num",w:"120px"},{k:"SaleQty",h:"Sales",t:"num",w:"100px"},
     {k:"ClgStock",h:"Closing",t:"num",w:"100px"},{k:"AnyShortExces",h:"Shortage/excess",t:"num",w:"120px"}],
    _acArr("qd.fin"),{min:"1000px",empty:"No finished goods.",add:"Add finished good"});
  return h;
}

/* ---------- Part A - OL (Receipt & Payment · liquidation) screen (accOL) ---------- */
function accOL(){
  const o="ol."; let h="";
  h+=note("Part A-OL — Receipt and payment account of a company under liquidation (substitutes the Balance Sheet / P&L). Amounts in rupees.");
  h+=sub("1 — Opening balance");
  h+=_acRi("Cash in hand",o+"OpeningBal.CashInHand","1i",{ind:1});
  h+=_acRi("Bank",o+"OpeningBal.CashInBank","1ii",{ind:1});
  h+=_acRc("Total opening balance (i + ii)",o+"OpeningBal.TotalOpenBal","1iii");
  h+=sub("2 — Receipts");
  h+=_acRi("Interest",o+"Receipts.Interest","2i",{ind:1});
  h+=_acRi("Dividend",o+"Receipts.Dividend","2ii",{ind:1});
  h+=grid("accounts."+o+"Receipts.SaleOfAssets.SaleOfAssetsDtls",
    [{k:"OthNatOfInc",h:"Sale of assets — nature",t:"txt",w:"auto",req:1,max:100},{k:"OthAmount",h:"Amount",t:"num",w:"150px",req:1}],
    _acArr("ol.Receipts.SaleOfAssets.SaleOfAssetsDtls"),{min:"480px",empty:"No asset sales.",add:"Add asset sale"});
  h+=_acRc("2iiib — Total sale of assets",o+"Receipts.TotalSaleofAssets","2iiib");
  h+=_acRi("Realization of dues / debtors",o+"Receipts.RlznDuesDebtors","2iv",{ind:1});
  h+=grid("accounts."+o+"Receipts.OthersIncRec.OthersIncDtls",
    [{k:"OthNatOfInc",h:"Other receipt — nature",t:"txt",w:"auto",req:1,max:100},{k:"TypeOfIncome",h:"Revenue/Capital",t:"sel",opts:ACC_RC,req:1},{k:"OthAmount",h:"Amount",t:"num",w:"150px",req:1}],
    _acArr("ol.Receipts.OthersIncRec.OthersIncDtls"),{min:"620px",empty:"No other receipts.",add:"Add other receipt"});
  h+=_acRc("2vb — Total other receipts",o+"Receipts.TotOthersReceiptsOnly","2vb");
  h+=_acRc("2vi — Total receipts",o+"Receipts.TotalOfReceipts","2vi");
  h+=_acRc("3 — Total of opening balance and receipts",o+"TotalOpenReceipts","3",{cls:"grand"});
  h+=sub("4 — Payments");
  h+=_acRi("Repayment of secured loans",o+"Payments.RepaymentSecuredloan","4i",{ind:1});
  h+=_acRi("Repayment of unsecured loans",o+"Payments.RepaymentUnsecuredloan","4ii",{ind:1});
  h+=_acRi("Repayment to creditors",o+"Payments.RepaymentCreditors","4iii",{ind:1});
  h+=_acRi("Commission",o+"Payments.Commission","4iv",{ind:1});
  h+=grid("accounts."+o+"Payments.OthersPayments.OthersPaymentsDtls",
    [{k:"OthNatOfInc",h:"Other payment — nature",t:"txt",w:"auto",req:1,max:100},{k:"OthAmount",h:"Amount",t:"num",w:"150px",req:1}],
    _acArr("ol.Payments.OthersPayments.OthersPaymentsDtls"),{min:"480px",empty:"No other payments.",add:"Add other payment"});
  h+=_acRc("4vb — Total other payments",o+"Payments.TotalOthersPayments","4vb");
  h+=_acRc("4vi — Total payments",o+"Payments.TotalPayments","4vi");
  h+=sub("5 — Closing balance");
  h+=_acRi("Cash in hand",o+"ClosingStock.CashInHand","5i",{ind:1});
  h+=_acRi("Bank",o+"ClosingStock.CashInBank","5ii",{ind:1});
  h+=_acRc("Total closing balance (i + ii)",o+"ClosingStock.TotalClBal","5iii");
  h+=_acRc("6 — Total of closing balance and payments (4vi + 5iii)",o+"TotalClPaymnts","6",{cls:"grand"});
  return h;
}

/* =====================================================================
   SCREEN — orchestrator: basis selector, then the block folds.
   ===================================================================== */
function _acCR(n){ n=R(n); return n?CR(n):""; }
function secAccounts(){
  const A=S.accounts||{}; let h="";
  h+=note("<b>Part A — Audited accounts.</b> Enter the audited Balance Sheet, Manufacturing / Trading Account and Statement of Profit &amp; Loss (or the Ind-AS set), the tax-audit Other Information (Part A-OI) and the Quantitative Details. Amounts are in rupees. The four Balance-Sheet / P&amp;L blocks are always filed (the schema requires all four); the set not used is filed as zeros.");
  h+=row("Basis of accounts",sel("accounts.basis",ACC_BASIS),{ref:"Part A",hint:"Schedule III, Ind-AS, or (in liquidation) the Receipt & Payment account"});
  const basis=st0(A.basis)||"reg";
  if(basis==="ol"){
    h+=fold("ac_ol","OL","Receipt and payment account (company under liquidation)",_acCR((S.C.accounts||{}).olIn),accOL(),{def:true});
    return h;
  }
  const ias=basis==="ias";
  const P=ias?{bs:"bsias",mfg:"mfgias",trd:"trdias",pl:"plias"}:{bs:"bs",mfg:"mfg",trd:"trd",pl:"pl"};
  const C=S.C.accounts||{};
  const bsTot=ias?C.biasTotEL:C.bsTotEL, mism=ias?C.biasMismatch:C.bsMismatch;
  h+=fold("ac_bs","1","Balance Sheet"+(ias?" (Ind AS)":""),(bsTot?_acCR(bsTot)+(mism?" ⚠ does not balance":" ✓"):""),ias?accBSias():accBS(),{def:true});
  h+=fold("ac_mfg","Mfg","Manufacturing Account"+(ias?" (Ind AS)":"")+" — if a manufacturing concern","",accMfg(P.mfg),{});
  h+=fold("ac_trd","Trd","Trading Account"+(ias?" (Ind AS)":""),"",accTrd(P.trd),{def:true});
  h+=fold("ac_pl","P&L","Statement of Profit and Loss"+(ias?" (Ind AS)":""),_acCR(ias?C.pbtIndAs:C.pbt),accPL(P.pl,ias),{def:true});
  h+=fold("ac_oi","OI","Part A-OI — Other Information (tax-audit annexure)","",accOI(),{def:true});
  h+=fold("ac_qd","QD","Part A-QD — Quantitative Details","",accQD(),{});
  return h;
}
