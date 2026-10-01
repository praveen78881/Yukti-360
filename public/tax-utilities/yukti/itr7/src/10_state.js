/* =====================================================================
   State, seeds and the schema skeleton (Phase 2 base scaffold — STUB).
   ITR-7 is the return for trusts, institutions and other bodies (sections
   139(4A)-(4F)). Modelled on forms/ITR-3/src/10_state.js and
   forms/ITR-6/src/10_state.js.
   ===================================================================== */
/* S — the working state. The shell contract (shell/README.md) requires
   meta, pi, fs, bank, ver, open:{} and C:{}; those are seeded enough that
   compute() and buildReturn() never throw; every real field is added in
   Phase 4. The per-screen-section namespaces (who/vc/ie/heads/app/funds/
   bodies/si/fa/tax/paid/bank) are intentionally NOT pre-seeded here: each
   Phase-4 section builder initialises its own with `S.<ns> = S.<ns> ||
   {..defaults}`, and a `{}` placeholder is truthy — it would short-circuit
   that `||` and drop every section's defaults (the ITR-6 lesson). Left
   undefined so each section's own seed runs. Defaults below are the
   shell-contract identity for a trust/institution: StatusOrCompanyType "4",
   filing section 11, exemption section 11, return furnished u/s 139(4A),
   Verification capacity "MD" — schema-valid enum members. */
const S={
  meta:{app:"yukti",form:"ITR-7",ay:"2026-27",ver:1},
  /* shell-contract identity / filing / verification (ITR-7 is a body, not an individual) */
  pi:{status:"4",res:"RES",name:"",pan:"",doi:"",retsec:"139-4A",exsec:"11"},
  fs:{optout:"No",sec:11,filed:""},
  bank:[],        /* shell array; also the 'bank' (verification) section's namespace */
  ver:{cap:"MD"},
  open:{}, C:{}
};

/* SEED — default row per grid key. No grids in the stub yet. */
const SEED={};

/* SKEL — the schema's required-key skeleton; equals books/ITR-7/skeleton.json,
   with the CreationInfo/Form_ITR7 constants made schema-valid (FormName
   "ITR-7", AssessmentYear "2026", SchemaVer/FormVer "Ver1.0"; SWCreatedBy/
   JSONCreatedBy matching [S][W][0-9]{8}; Digest "-"). Root object is ITR7;
   the return wrapper is {ITR:{ITR7:{...}}} (see 90_wiring.js). The seven
   required blocks (blocks.json): CreationInfo, Form_ITR7, PartA_GEN1,
   PartA_GEN2, PARTA_BS, PartB_TTI, Verification. */
const SKEL=
{
 "CreationInfo": {
  "SWVersionNo": "R3",
  "SWCreatedBy": "SW10000001",
  "JSONCreatedBy": "SW10000001",
  "JSONCreationDate": "2026-01-01",
  "IntermediaryCity": "na",
  "Digest": "-"
 },
 "Form_ITR7": {
  "FormName": "ITR-7",
  "Description": "na",
  "AssessmentYear": "2026",
  "SchemaVer": "Ver1.0",
  "FormVer": "Ver1.0"
 },
 "PartA_GEN1": {
  "OrgFirmInfo": {
   "AssesseeName": {
    "SurNameOrOrgName": "na"
   },
   "PAN": "na",
   "Address": {
    "ResidenceNo": "na",
    "LocalityOrArea": "na",
    "CityOrTownOrDistrict": "na",
    "StateCode": "01",
    "CountryCodeMobile": 0,
    "MobileNo": 0,
    "EmailAddress": "na"
   },
   "DateOFFormOrIncorp": "2026-01-01",
   "StatusOrCompanyType": "4",
   "ReturnFurnishedSec": "139-4A",
   "SecExemptionClaimed": "11"
  },
  "FilingStatus": {
   "ReturnFileSec": {
    "IncomeTaxSec": 11
   },
   "ResidentialStatus": "RES",
   "PartnerInFirmFlg": "Y",
   "HeldUnlistedEqShrPrYrFlg": "Y",
   "AsseseeRepFlg": "Y"
  }
 },
 "PartA_GEN2": {
  "LiableSec44ABflg": "N",
  "LiableAnyOthThnINTActflg": "N"
 },
 "PARTA_BS": {
  "SourcesOfFund": {
   "OwnFund": {
    "Corpus80G": 0,
    "OtherCorpus": 0,
    "AccumulatedInc": 0,
    "AccumulatedIncUS10_11": 0,
    "BalDeemedInc": 0,
    "TotalOtherReserve": 0,
    "TotalFund": 0
   },
   "LongTermBorrowings": {
    "SecuredLoan": 0,
    "UnSecuredLoan": 0,
    "TotalLoanFund": 0
   },
   "Advances": 0,
   "TotSourceFund": 0
  },
  "ApplicationOfFunds": {
   "FixedAsset": {
    "GrossBlock": 0,
    "Depreciation": 0,
    "NetBlock": 0
   },
   "CurrentAssetsLoanAdv": {
    "CurrentAssets": {
     "Inventory": 0,
     "SundryDebtor": 0,
     "CashNCashEquivalents": {
      "BalWithBanks": 0,
      "CashInHand": 0,
      "Others": 0,
      "TotCashNCashEquivalents": 0
     },
     "OtherCurrAssets": 0,
     "TotCurrAssets": 0
    },
    "LoansandAdvances": 0,
    "Total": 0,
    "CurrLiabilitiesProviosions": {
     "CurrLiability": {
      "SundryCreditor": 0,
      "OtherPayable": 0,
      "TotalCurrLiabilitiesProviosions": 0
     },
     "Provisions": 0,
     "TotCurrLiabilitiesandprovisions": 0
    },
    "NetCurrAssets": 0
   },
   "TotalApplicationOfFunds": 0
  }
 },
 "PartB_TTI": {
  "ComputationOfTaxLiability": {
   "TaxPayableOnTI": {
    "TaxAtNormalRates": 0,
    "TaxAtSpecialRates": 0,
    "DonationUs115BC": 0,
    "TaxAtMarginalRate": 0,
    "TaxPayableOnTotInc": 0,
    "TaxIncChargUs115BBI": 0,
    "RebateOnAgricultureInc": 0
   },
   "Surcharge25ofSI": 0,
   "SurchargeOnTaxPayable": 0,
   "TotalSurcharge": 0,
   "EducationCess": 0,
   "GrossTaxLiability": 0,
   "TaxRelief": {
    "Section90": 0,
    "Section91": 0,
    "TotTaxRelief": 0
   },
   "NetTaxLiability": 0,
   "IntrstPay": {
    "IntrstPayUs234A": 0,
    "IntrstPayUs234B": 0,
    "IntrstPayUs234C": 0,
    "LateFilingFee234F": 0,
    "TotalIntrstPay": 0
   },
   "AggregateTaxInterestLiability": 0
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
   "NetTaxPyblOn115TDInc": 0,
   "BankAccountDtls": {
    "BankDtlsFlag": "Y"
   }
  },
  "AssetOutsideIndiaFlg": "YES"
 },
 "Verification": {
  "Date": "2026-01-01",
  "Declaration": {
   "AssesseeVerName": "na",
   "FatherName": "na",
   "AssesseeVerPAN": "na",
   "Capacity": "MD"
  },
  "Place": "na"
 }
}
;

/* compute() / buildReturn() / importReturn() are defined in 90_wiring.js
   (loaded last). This file only seeds S, SEED and SKEL. */

/* Phase 2 bootstrap: placeholder registrations for all 12 screen sections so
   the form always boots with its full structure. Real section-builders call
   reg() later with the same id; 90_wiring resolves each id to the LAST
   registration, so a real section overrides its placeholder. Titles/refs and
   order from books/ITR-7/structure.md + section_map.json (the trust/institution
   return). `ret` (return & exemption status) is a VIEW of the who/PI sheet,
   not a separate section_map mapping, so it is not a boot stub of its own. */
[
 ["who","Who is filing","Part A - General · PI · Audit"],
 ["vc","Voluntary contributions & income","Schedule VC · AI"],
 ["ie","Income & Expenditure statements","Schedule IE-1/2/3/4"],
 ["hp","Income from house property","Schedule HP"],
 ["cg","Capital gains","Schedule CG"],
 ["vda","Virtual digital assets","Schedule VDA"],
 ["os","Income from other sources","Schedule OS"],
 ["oa","Business — general","Schedule OA"],
 ["bp","Business income","Schedule BP"],
 ["pti","Pass-through income","Schedule PTI"],
 ["cyla","Current-year loss set-off","Schedule CYLA"],
 ["app","Application & accumulation of income","Schedule A · I · IA · D · DA"],
 ["funds","Balance sheet, funds & corpus","Part A-BS · Schedule J · R"],
 ["bodies","Political party, electoral trust & shareholding","Schedule PP · ET · SH"],
 ["si","Special-rate, specified & accreted income","Schedule SI · 115BBI · 115TD"],
 ["fa","Foreign income & assets","Schedule FSI · TR · FA"],
 ["tax","Part B — total income & tax","Part B-TI · TTI"],
 ["paid","Tax payments","IT · TDS · TCS"],
 ["bank","Bank & verification","Verification"],
].forEach(([id,t,ref])=>reg({id,t,ref,f:()=>note("<b>"+esc(t)+"</b> — being built (Phase 4)."),s:()=>""}));
