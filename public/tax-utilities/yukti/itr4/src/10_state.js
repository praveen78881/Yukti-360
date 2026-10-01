/* =====================================================================
   State, seeds and the compute pass (Phase 2 STUB).
   ===================================================================== */
/* S — the working state. meta/pi/fs/bank/ver seeded enough that compute()
   and buildReturn() never throw; every real field is added in Phase 4. */
const S={
  meta:{app:"yukti",form:"ITR-4",ay:"2026-27",ver:1},
  pi:{status:"I",res:"RES",first:"",last:"",pan:"",dob:""},
  fs:{optout:"No",sec:11,filed:""},
  bank:[],
  ver:{cap:"S"},
  open:{},
  C:{}
};

/* SEED — default row per grid key. No grids in the stub yet. */
const SEED={};

/* SKEL — the schema's required-key skeleton; equals books/ITR-4/skeleton.json. */
const SKEL=
{
 "CreationInfo": {
  "SWVersionNo": "1.0",
  "SWCreatedBy": "SW10000000",
  "JSONCreatedBy": "SW10000000",
  "JSONCreationDate": "2026-01-01",
  "IntermediaryCity": "na",
  "Digest": "-"
 },
 "Form_ITR4": {
  "FormName": "ITR-4",
  "Description": "For presumptive income from Business & Profession (44AD/44ADA/44AE)",
  "AssessmentYear": "2026",
  "SchemaVer": "Ver1.0",
  "FormVer": "Ver1.0"
 },
 "PersonalInfo": {
  "AssesseeName": {
   "SurNameOrOrgName": "na"
  },
  "PAN": "na",
  "Address": {
   "ResidenceNo": "na",
   "LocalityOrArea": "na",
   "CityOrTownOrDistrict": "na",
   "StateCode": "01",
   "CountryCode": "93",
   "CountryCodeMobile": 0,
   "MobileNo": 0,
   "EmailAddress": "na@na.in"
  },
  "SecondaryAdd": "Y",
  "DOB": "2026-01-01",
  "EmployerCategory": "CGOV",
  "Status": "I"
 },
 "FilingStatus": {
  "ReturnFileSec": 11,
  "Form10IEAEarlierAYOldRegime": "Y",
  "AsseseeRepFlg": "Y",
  "ItrFilingDueDate": "na"
 },
 "IncomeDeductions": {
  "IncomeFromBusinessProf": 0,
  "GrossSalary": 0,
  "NetSalary": 0,
  "DeductionUs16": 0,
  "IncomeFromSal": 0,
  "IncomeOthSrc": 0,
  "TotalIncomeChargeableUnHP": 0,
  "GrossTotIncome": 0,
  "GrossTotIncomeIncLTCG112A": 0,
  "UsrDeductUndChapVIA": {
   "Section80C": 0,
   "Section80CCC": 0,
   "Section80CCDEmployeeOrSE": 0,
   "Section80CCD1B": 0,
   "Section80CCDEmployer": 0,
   "Section80D": 0,
   "Section80DD": 0,
   "Section80DDB": 0,
   "Section80E": 0,
   "Section80G": 0,
   "Section80GG": 0,
   "Section80GGC": 0,
   "Section80U": 0,
   "Section80TTA": 0,
   "Section80TTB": 0,
   "AnyOthSec80CCH": 0,
   "TotalChapVIADeductions": 0
  },
  "DeductUndChapVIA": {
   "Section80C": 0,
   "Section80CCC": 0,
   "Section80CCDEmployeeOrSE": 0,
   "Section80CCD1B": 0,
   "Section80CCDEmployer": 0,
   "Section80D": 0,
   "Section80DD": 0,
   "Section80DDB": 0,
   "Section80E": 0,
   "Section80G": 0,
   "Section80GG": 0,
   "Section80GGC": 0,
   "Section80U": 0,
   "Section80TTA": 0,
   "Section80TTB": 0,
   "AnyOthSec80CCH": 0,
   "TotalChapVIADeductions": 0
  },
  "TotalIncome": 0
 },
 "TaxComputation": {
  "TotalTaxPayable": 0,
  "Rebate87A": 0,
  "TaxPayableOnRebate": 0,
  "EducationCess": 0,
  "GrossTaxLiability": 0,
  "NetTaxLiability": 0,
  "IntrstPay": {
   "IntrstPayUs234A": 0,
   "IntrstPayUs234B": 0,
   "IntrstPayUs234C": 0,
   "LateFilingFee234F": 0
  },
  "TotTaxPlusIntrstPay": 0
 },
 "TaxPaid": {
  "TaxesPaid": {
   "AdvanceTax": 0,
   "TDS": 0,
   "TCS": 0,
   "SelfAssessmentTax": 0,
   "TotalTaxesPaid": 0
  },
  "BalTaxPayable": 0
 },
 "Refund": {
  "RefundDue": 0,
  "BankAccountDtls": {}
 },
 "Verification": {
  "Declaration": {
   "AssesseeVerName": "na",
   "FatherName": "na",
   "AssesseeVerPAN": "na"
  },
  "Capacity": "S",
  "Place": "na"
 }
};
