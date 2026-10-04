/* =====================================================================
   State, seeds and the schema skeleton (ITR-1 base scaffold — STUB).
   ITR-1 (SAHAJ) is the return for a resident individual. Modelled on
   forms/ITR-7/src/10_state.js.
   ===================================================================== */
/* S — the working state. The shell contract (shell/README.md) requires
   meta, pi, fs, bank, ver, open:{} and C:{}; those are seeded enough that
   compute() and buildReturn() never throw; every real field is added in
   the section-builder phase. The per-screen-section namespaces (who/ret/
   sal/hp/os/ded/ei/tax/paid) are intentionally NOT pre-seeded here: each
   section builder initialises its own with `S.<ns> = S.<ns> || {..defaults}`,
   and a `{}` placeholder is truthy — it would short-circuit that `||` and
   drop the section's defaults (the ITR-6 lesson). Left undefined so each
   section's own seed runs. `bank` is both the shell array and the bank
   (verification) section's namespace, so it is seeded as [].
   Defaults below are the shell-contract identity for a resident individual:
   OptOutNewTaxRegime "No" (new regime, the A.Y. 2026-27 default), filing
   section 11 (139(1)), verification capacity "S" (self) — schema-valid. */
const S={
  meta:{app:"yukti",form:"ITR-1",ay:"2026-27",ver:1},
  /* shell-contract identity: the individual's personal-info fields the shell reads */
  pi:{first:"",mid:"",last:"",name:"",pan:"",dob:"",aadhaar:"",
      addr:"",locality:"",city:"",state:"",pin:"",mobile:"",email:"",empcat:"OTH"},
  fs:{optout:"No",retsec:11,filed:""},   /* optout "No" => new regime (default); isNew()===true */
  bank:[],        /* shell array; also the 'bank' (verification) section's namespace */
  ver:{cap:"S"},  /* verification capacity: S = self */
  open:{}, C:{}
};

/* SEED — default row per grid key. No grids in the stub yet. */
const SEED={};

/* SKEL — the schema's required-key skeleton; equals the ITR.ITR1 object of
   books/ITR-1/skeleton.json, with the CreationInfo/Form_ITR1 constants made
   schema-valid: FormName "ITR-1", AssessmentYear "2026" (the utility hard-
   codes 2025 — a utility bug; we emit 2026 per the schema/protocol),
   SchemaVer/FormVer "Ver1.0", SWCreatedBy/JSONCreatedBy matching
   [S][W][0-9]{8}, Digest "-". Root object is ITR1; the return wrapper is
   {ITR:{ITR1:{...}}} (see 90_wiring.js). */
const SKEL=
{
  "CreationInfo": {
    "SWVersionNo": "R3",
    "SWCreatedBy": "SW10000000",
    "JSONCreatedBy": "SW10000000",
    "JSONCreationDate": "2026-01-01",
    "IntermediaryCity": "Delhi",
    "Digest": "-"
  },
  "Form_ITR1": {
    "FormName": "ITR-1",
    "Description": "For Individuals having Income from Salaries, one house property, other sources (Interest etc.) and having total income upto Rs.50 lakh",
    "AssessmentYear": "2026",
    "SchemaVer": "Ver1.0",
    "FormVer": "Ver1.0"
  },
  "PersonalInfo": {
    "AssesseeName": { "SurNameOrOrgName": "NA" },
    "PAN": "AAAPA0000A",
    "Address": {
      "ResidenceNo": "NA",
      "LocalityOrArea": "NA",
      "CityOrTownOrDistrict": "NA",
      "StateCode": "19",
      "CountryCode": "91",
      "PinCode": 400001,
      "CountryCodeMobile": 91,
      "MobileNo": 9999999999,
      "EmailAddress": "na@na.in"
    },
    "SecondaryAdd": "N",
    "DOB": "1990-01-01",
    "EmployerCategory": "OTH"
  },
  "FilingStatus": {
    "ReturnFileSec": 11,
    "SeventhProvisio139": "N",
    "OptOutNewTaxRegime": "N",
    "clauseiv7provisio139i": "N",
    "AsseseeRepFlg": "N",
    "ItrFilingDueDate": "2026-07-31"
  },
  "ITR1_IncomeDeductions": {
    "GrossSalary": 0,
    "Salary": 0,
    "PerquisitesValue": 0,
    "ProfitsInSalary": 0,
    "NetSalary": 0,
    "DeductionUs16": 0,
    "DeductionUs16ia": 0,
    "EntertainmentAlw16ii": 0,
    "ProfessionalTaxUs16iii": 0,
    "IncomeFromSal": 0,
    "TotalIncomeOfHP": 0,
    "IncomeOthSrc": 0,
    "DeductionUs57iia": 0,
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
      "Section80EE": 0,
      "Section80EEA": 0,
      "Section80EEB": 0,
      "Section80G": 0,
      "Section80GG": 0,
      "Section80GGA": 0,
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
      "Section80EE": 0,
      "Section80EEA": 0,
      "Section80EEB": 0,
      "Section80G": 0,
      "Section80GG": 0,
      "Section80GGA": 0,
      "Section80GGC": 0,
      "Section80U": 0,
      "Section80TTA": 0,
      "Section80TTB": 0,
      "AnyOthSec80CCH": 0,
      "TotalChapVIADeductions": 0
    },
    "TotalIncome": 0
  },
  "ITR1_TaxComputation": {
    "TotalTaxPayable": 0,
    "Rebate87A": 0,
    "TaxPayableOnRebate": 0,
    "EducationCess": 0,
    "GrossTaxLiability": 0,
    "Section89": 0,
    "NetTaxLiability": 0,
    "TotalIntrstPay": 0,
    "IntrstPay": {
      "IntrstPayUs234A": 0,
      "IntrstPayUs234B": 0,
      "IntrstPayUs234C": 0,
      "LateFilingFee234F": 0,
      "FeeFurnish234I": 0
    },
    "TotTaxPlusIntrstPay": 0
  },
  "LTCG112A": {
    "TotSaleCnsdrn": 0,
    "TotCstAcqisn": 0,
    "LongCap112A": 0
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
    "BankAccountDtls": {
      "AddtnlBankDetails": []
    }
  },
  "Verification": {
    "Declaration": {
      "AssesseeVerName": "NA",
      "FatherName": "NA",
      "AssesseeVerPAN": "AAAPA0000A"
    },
    "Capacity": "S",
    "Place": "NA"
  },
  "TDSonSalaries": {
    "TotalTDSonSalaries": 0
  },
  "TDSonOthThanSals": {
    "TotalTDSonOthThanSals": 0
  },
  "ScheduleTDS3Dtls": {
    "TotalTDS3Details": 0
  },
  "ScheduleTCS": {
    "TotalSchTCS": 0
  },
  "TaxPayments": {
    "TotalTaxPayments": 0
  }
}
;

/* compute() / buildReturn() / importReturn() are defined in 90_wiring.js
   (loaded last). This file only seeds S, SEED and SKEL. */

/* Bootstrap: placeholder registrations for all 10 screen sections so the form
   always boots with its full structure. Real section-builders call reg() later
   with the same id; 90_wiring resolves each id to the LAST registration, so a
   real section overrides its placeholder. Titles/refs and order from
   books/ITR-1/sections.md + section_map.json (the SAHAJ resident-individual
   return). Every section is present, each a "being built" placeholder body. */
[
 ["who","Assessee Information — Personal information","PersonalInfo · CreationInfo · Form_ITR1"],
 ["ret","Filing status & tax regime","FilingStatus (+ PartA_139_8A · PartB-ATI when 139(8A))"],
 ["sal","Salary income","ITR1_IncomeDeductions (salary) · ScheduleEA10_13A"],
 ["hp","Income from house property","ITR1_IncomeDeductions.PropertyDetails[]"],
 ["os","Income from other sources","ITR1_IncomeDeductions.OthersInc · DeductionUs57iia"],
 ["ded","Chapter VI-A deductions","UsrDeductUndChapVIA · DeductUndChapVIA · Schedule80*"],
 ["ei","Exempt income","ITR1_IncomeDeductions.ExemptIncAgriOthUs10"],
 ["tax","Tax computation","ITR1_TaxComputation · LTCG112A"],
 ["paid","Taxes paid — TDS / TCS / advance / self-assessment","TaxPaid · TDSonSalaries · TDSonOthThanSals · ScheduleTDS3Dtls · ScheduleTCS · TaxPayments"],
 ["bank","Bank accounts & verification","Refund · Verification"],
].forEach(([id,t,ref])=>reg({id,t,ref,f:()=>note("<b>"+esc(t)+"</b> — being built."),s:()=>""}));
