# ITR-1 — Schema Conformance / Fill-Capacity Matrix

Cross-check of the **schema leaf tree** (`docs/itr-schema-conformance/schema-ITR1.md`, 165 leaves / 17 schedules) against our **structure catalog** (`docs/itr-structure/ITR-1.md`) and the **actual emitter** `buildItr1Json()` in `public/tax-utilities/itr1.html:1909` (+ helper `chapVIA()` at `:1853`).

Classification:
- **✓ FILL** — a particular/field exists AND the emitter writes it with a real value.
- **⚠ PARTIAL** — field exists in UI/catalog but the emitter omits it, hard-codes `0`/`''`, or emits it under a **non-schema key** (data present but the schema node stays empty). Emitter line cited.
- **✗ MISSING** — nothing in our software can source it.

> Analysis target is the AY 2026-27 file (`itr1.html`). Note the AY diff: `itr1-2025-26.html` has **no `__taxBreakup`**, so its `ITR1_TaxComputation` (Rebate87A / EducationCess / Section89 / 234-interest) exports **zeros** — those 13 nodes would be ⚠ in the 2025-26 file.

---

## Fill-capacity summary

| Metric | Count |
|---|---|
| **Total leaf nodes** | **165** |
| ✓ FILL | **93** |
| ⚠ PARTIAL | **33** |
| ✗ MISSING | **39** |
| **% fillable (✓/total)** | **56.4 %** |
| % reachable (✓+⚠)/total | 76.4 % |

### Per-schedule roll-up

| Schedule | Leaves | ✓ | ⚠ | ✗ |
|---|--:|--:|--:|--:|
| CreationInfo | 6 | 6 | 0 | 0 |
| FilingStatus | 8 | 0 | 2 | 6 |
| Form_ITR1 | 5 | 5 | 0 | 0 |
| ITR1_IncomeDeductions | 62 | 37 | 19 | 6 |
| ITR1_TaxComputation | 13 | 13 | 0 | 0 |
| PersonalInfo | 18 | 17 | 1 | 0 |
| Refund | 6 | 5 | 1 | 0 |
| Schedule80D | 7 | 0 | 7 | 0 |
| Schedule80G | 20 | 0 | 0 | 20 |
| Schedule80GGA | 4 | 0 | 0 | 4 |
| ScheduleTCS | 1 | 0 | 0 | 1 |
| ScheduleTDS3Dtls | 1 | 0 | 0 | 1 |
| TDSonOthThanSals | 1 | 0 | 1 | 0 |
| TDSonSalaries | 1 | 0 | 1 | 0 |
| TaxPaid | 6 | 5 | 1 | 0 |
| TaxPayments | 1 | 0 | 0 | 1 |
| Verification | 5 | 5 | 0 | 0 |
| **Total** | **165** | **93** | **33** | **39** |

---

## Capacity matrix (by schedule)

### CreationInfo — 6 ✓
All hard-written constants/derived values in the assembler (`itr1.html:1951`): `Digest:'-'`, `IntermediaryCity:'NA'`, `JSONCreatedBy`/`SWCreatedBy` = `'SW20000000'`, `JSONCreationDate` = today, `SWVersionNo:'1.0'`. Placeholder but populated → ✓.

### Form_ITR1 — 5 ✓
`itr1.html:1952`: FormName `ITR-1`, Description, AssessmentYear `2026`, FormVer `Ver1.0`, SchemaVer `Ver1.1`. All ✓.

### PersonalInfo — 17 ✓ / 1 ⚠
| Node | Cls | Note (emitter) |
|---|---|---|
| PAN, DOB, AadhaarCardNo, EmployerCategory | ✓ | `:1954` (`EmployerCategory` fallback `'OTH'`, Aadhaar `''` if absent) |
| AssesseeName.FirstName, SurNameOrOrgName | ✓ | split of `cl_name` on space |
| AssesseeName.MiddleName | ⚠ | hard-coded `''` `:1954` — no middle-name particular |
| Address.* (ResidenceNo, ResidenceName, RoadOrStreet, LocalityOrArea, CityOrTownOrDistrict, StateCode, CountryCode, CountryCodeMobile, PinCode, MobileNo, EmailAddress) | ✓ | `addr{}` `:1945` (StateCode fallback `'99'`, CountryCode `'91'`, ResidenceNo fallback `'NA'`) |

### FilingStatus — 2 ⚠ / 6 ✗
| Node | Cls | Note |
|---|---|---|
| NewTaxRegime | ⚠ | regime **is** known but emitted under **non-schema key** `OptOutNewTaxRegime` (`:1953`); the schema's `NewTaxRegime` node stays empty |
| ReturnFileSec | ⚠ | **hard-coded `11`** `:1953` — ignores the `f_section` dropdown (139(1)/(4)/(5)/(9)/142(1)) |
| DepAmtAggAmtExcd1CrPrYrFlg | ✗ | no particular |
| IncrExpAggAmt1LkElctrctyPrYrFlg | ✗ | no particular |
| IncrExpAggAmt2LkTrvFrgnCntryFlg | ✗ | no particular |
| SeventhProvisio139 | ✗ | no particular |
| OrigRetFiledDate | ✗ | Return Type field exists but not emitted (revised-return date unsourced) |
| ReceiptNo | ✗ | not sourced |

### ITR1_IncomeDeductions — 37 ✓ / 19 ⚠ / 6 ✗
| Node | Cls | Note |
|---|---|---|
| GrossSalary, Salary, NetSalary, IncomeFromSal | ✓ | `:1955` all = `it_sal_total` |
| IncomeOthSrc, GrossTotIncome, TotalIncome | ✓ | `:1955-1958` |
| DeductUndChapVIA / UsrDeductUndChapVIA — Section80C, 80CCC, 80CCD1B, 80CCDEmployeeOrSE, 80CCDEmployer, 80D, 80DD, 80DDB, 80E, 80G, 80GG, 80TTA, 80TTB, 80U, TotalChapVIADeductions (×2 blocks = 30) | ✓ | `chapVIA()` `:1853` reads real cells |
| DeductUndChapVIA / Usr… — Section80EE, 80EEA, 80EEB, 80GGA, 80GGC (×2 = 10) | ⚠ | **hard-coded `0`** `:1859-1860` |
| DeductionUs16 | ⚠ | **hard-coded `0`** `:1955` — std-deduction lumped elsewhere |
| DeductionUs16ia | ⚠ | std deduction `it_sal_std` computed but not emitted here |
| StandardDeduction | ⚠ | same source `it_sal_std`, not emitted |
| TotalIncomeOfHP | ⚠ | HP income emitted under **non-schema key** `TotalIncomeChargeableUnHP` `:1956` |
| AnnualValue | ⚠ | HP annual value computed in calc, not emitted |
| PerquisitesValue | ⚠ | perquisites drill folded into GrossSalary, not itemized |
| ProfitsInSalary | ⚠ | profit-in-lieu folded into salary, not itemized |
| ProfessionalTaxUs16iii | ⚠ | `it_sal_proftax` computed, not emitted |
| AllwncExemptUs10.TotalAllwncExemptUs10 | ⚠ | exempt columns computed in salary breakup, not aggregated out |
| AllwncExemptUs10.AllwncExemptUs10Dtls | ✗ | array never built |
| ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Total / …Dtls | ✗ | no agri/exempt particular |
| OthersInc.OthersIncDtlsOthSrc | ✗ | array never built |
| DeductionUs57iia | ✗ | family-pension std-ded not emitted at this node |
| EntertainmentAlw16ii | ✗ | no particular emitted |

### ITR1_TaxComputation — 13 ✓
All from `window.__taxBreakup` (`:1926-1935`): EducationCess, GrossTaxLiability, NetTaxLiability, Rebate87A, Section89, TaxPayableOnRebate, TotalTaxPayable, TotTaxPlusIntrstPay, TotalIntrstPay, IntrstPay.{234A,234B,234C,LateFilingFee234F}. **AY diff: zeros in the 2025-26 file.**

### Refund — 5 ✓ / 1 ⚠
| Node | Cls | Note |
|---|---|---|
| RefundDue, BankAccountDtls.AddtnlBankDetails[] + BankAccountNo, BankName, IFSCCode | ✓ | `:1967` (rows with non-empty acc) |
| AddtnlBankDetails[].UseForRefund | ⚠ | UI `bank_{i}_refund` checkbox exists but emitter **omits** `UseForRefund` in the row map `:1967` |

### Schedule80D — 7 ⚠
Entire schedule **not emitted**; 80D drill-in data (`d80d_*`) and total `it_80_d` exist but only `it_80_d` is pushed into `DeductUndChapVIA.Section80D`. EligibleAmountOfDedn, SelfAndFamily, Parents, ParentsSeniorCitizen, SelfAndFamilySeniorCitizen, SeniorCitizenFlag, ParentsSeniorCitizenFlag → all ⚠ (sourceable, unemitted).

### Schedule80G — 20 ✗
No donee-level particulars; only a single 80G total cell (`it_80_g`). The 100%/50%, approval-reqd, cash/other-mode, and eligible-donation split leaves cannot be sourced. Schedule absent from JSON.

### Schedule80GGA — 4 ✗
`Section80GGA` is hard-coded `0` (`:1860`); no scientific-research/rural-development donation particulars.

### ScheduleTCS — 1 ✗
`TotalSchTCS` — TaxPaid.TCS hard-coded `0`; no TCS source.

### ScheduleTDS3Dtls — 1 ✗
`TotalTDS3Details` — TDS-on-immovable/26QB not sourced.

### TDSonSalaries — 1 ⚠
`TotalTDSonSalaries` leaf not written; emitter instead builds a `TDSonSalary[]` array **only if AIS is imported** (`:1971`), and omits the documented Total leaf.

### TDSonOthThanSals — 1 ⚠
`TotalTDSonOthThanSals` leaf not written; `TDSonOthThanSal[]` built **only from AIS import** (`:1972`), Total leaf omitted.

### TaxPaid — 5 ✓ / 1 ⚠
| Node | Cls | Note |
|---|---|---|
| BalTaxPayable, TaxesPaid.{TDS, AdvanceTax, SelfAssessmentTax, TotalTaxesPaid} | ✓ | `:1966` from `__taxBreakup` |
| TaxesPaid.TCS | ⚠ | **hard-coded `0`** `:1966` |

### TaxPayments — 1 ✗
`TotalTaxPayments` — self-assessment/advance challan detail table not emitted.

### Verification — 5 ✓
`:1968`: Capacity `'S'`, Declaration.AssesseeVerName / AssesseeVerPAN / FatherName, Place (= assessee city). All ✓ (note: `vfr_capacity`/`vfr_place` particulars are ignored — fixed `'S'` and assessee-city used instead, but nodes are populated).

---

## Ranked GAP LIST (all ✗ + material ⚠, most important first)

1. **FilingStatus.NewTaxRegime — ⚠ wrong key** (`:1953`). Regime is the single most consequential flag on the return; emitted as `OptOutNewTaxRegime`, leaving the schema's `NewTaxRegime` node empty. Portal may reject / mis-slab.
2. **FilingStatus.ReturnFileSec — ⚠ hard-coded `11`** (`:1953`). Ignores `f_section`; belated/revised/defective returns are all filed as if 139(1). Identity-of-filing defect.
3. **Standard deduction — ⚠ DeductionUs16 hard-coded `0` + DeductionUs16ia + StandardDeduction unemitted** (`:1955`). The ₹75k/₹50k std deduction (`it_sal_std`) is computed but zeroed in JSON → GTI/TotalIncome will fail portal re-computation.
4. **Schedule80G — ✗ 20 nodes unsourceable**. No donee/100%-50%/cash-vs-other/eligible-amount capture; any 80G claim cannot be filed correctly (Section80G amount also can't be substantiated).
5. **ITR1_IncomeDeductions.TotalIncomeOfHP — ⚠ wrong key** (`:1956`). House-property income emitted as `TotalIncomeChargeableUnHP`; schema `TotalIncomeOfHP` node stays empty for every filer with HP income.

**Runner-ups:** Schedule80D breakup (7 ⚠, entirely omitted despite full drill-in data); TDS schedules depend on AIS import and omit the Total* leaves (TotalTDSonSalaries / TotalTDSonOthThanSals / ScheduleTDS3Dtls) with TaxPaid.TCS = 0; Section 80EE/80EEA/80EEB/80GGA/80GGC hard-coded 0 (10 ⚠); Refund.UseForRefund omitted; FilingStatus flags (DepAmt…/IncrExp…×2/SeventhProvisio139) and TaxPayments challan total all ✗.
