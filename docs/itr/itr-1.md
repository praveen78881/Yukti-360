# ITR-1 Sahaj — Salary / 1 House Property / Other Sources (≤ ₹50 L)

> Applicable: resident individuals with salary, one house property, other sources; total income ≤ ₹50 L. File: `public/tax-utilities/itr1.html` (A.Y. 2026-27, ~2.5 MB, 12,292 lines) + `itr1-2025-26.html`. Lines below are into `itr1.html`.

## Layout
Three tabs (`:303`): **Info** (`data-tab="info"`, `#pane-info` `:316`), **Computation** (`data-tab="comp"`, `#pane-comp` `:387`), **Summary** (`data-tab="summary"` `:394`). The **Computation tab is an iframe** (`#calcFrame` `:388`) whose HTML is a `<script type="text/plain" id="calc-html">` block (`:2033+`) injected by `injectCalculator()` (`:1567`). It's a shared **"Master Calculator"** — Business/Profession, full CG, AMT, depreciation exist but are hidden for ITR-1 (`g-bp` `display:none` `:2222`).

## 1. Info Sheet particulars (`#pane-info`, `:316-382`)
**Basic info (`:325`):** `sf-assessee`, `sf-verifier`, `sf-bank`. **Filing info (`:331`):** `f_section` (139(1)/(4)/(5)/(9)/142(1)), `f_rettype` (Original/Revised), `sf-repassessee`. **Income info (`:346`):** `sf-pti` (115U/UA/UB). **Other (`:350`):** toggles `partner`, `unlisted`(→`sf-unlisted`), `director`(→`sf-directorship`); `sf-esop`; `sf-otherforms`. **Foreign Assets (`g-fa` `:364`):** `f_hasFA` → 9 `sf-fa_*` drill-ins.
**Assessee master (`sf-assessee` `:440`):** `asr_name/pan/status(Individual|HUF)/dob/gender/father/resstatus`; address `asr_flat/premises/road/area/city/state/country/pin`; contact `asr_mobile/std/landline/cc/email/district/secsame`; secondary `asr_secmobile/secemail`; `asr_aadhaar/aadhaareid/44aa`. **Verifier (`:487`):** `vfr_name/pan/capacity/father/place`. **Bank (`sf-bank` `:519`, +Add):** Bank/AccNo/IFSC/Type/For-refund.

## 2. Income & deduction entry (calculator iframe, `#sheet-itcomp` `:2203`)
- **Salaries** (`g-sal` `:2204`): employer blocks (+Add employer, `emp_nature` per employer `:5153`) → `it_sal_total`, std ded 16(ia) `it_sal_std`, prof-tax 16(iii) `it_sal_proftax`, `it_sal_income`. Sub-forms: breakup/monthly/form16/89A/proftax.
- **House Property** (`g-hp` `:2214`): property blocks (+Add) → `it_hp_income`; SOP interest ₹2 L cap.
- **Other Sources** (`g-os` `:2291`): `it_os_interest/dividend/dtaa/familypension/gifts/special/kvp/minor/nsc/otherperson/rental1/89a/58_59/winnings/other`, BF loss `it_os_bfloss` — each a drill-in.
- **Chapter VI-A** (`g-80` `:2311`): `it_80_cch(80CCH)/d/dd/ddb/e/ccccd(80C+CCC+CCD bundle)/other(80U/G/GGA/GGC/GG/TTA/TTB/EE/EEA/EEB/IA/IB/IE)` → `it_80_total`. 80C bundle sub-form (`sf-80-ccccd` `:3734`) has 80C/80CCC tables + 80CCD fields + live 80CCE ₹1.5 L cap.

## 3. Drill-in Schedules (**+Add** where noted)
Info: `sf-bank`(+), `sf-pti`(+), `sf-esop`(+), `sf-directorship`(+), `sf-unlisted`(+), 9× `sf-fa_*`(+). Calculator: salary breakup/monthly/Form16/89A/proftax; HP property/GAV/interest/arrears (+loan/+rent); **Capital Gains** LTCG/STCG/112A/auto-classify + BF STCL/LTCL (all +Add) — *present but ITR-1 caps 112A at ₹1.25 L*; OS interest/dividends/winnings/gifts/KVP/NSC/minor/DTAA (+Add); Advance Tax/SAT challans (+Add); Agri B/F; TDS/TCS (16A/16A-BF/salary/TCS/16B-E + BF); Schedule EI (`:4715`); Schedule CFL (`:4805`); Relief 89 (Form 10E) & 90/91 (Form 67).

## 4. Computation Sheet (`:2323-2349`; engine `:12132`)
Heads → **`it_totalIncome`** → `it_agri` → **`it_regime`** (New 115BAC default / Old) → **`it_taxOnTI`** (net of rebate/relief) → reliefs 89/90/91 → AMT 115JC/credit 115JD (old only) → prepaid `it_tdstcs/advtax/sat` → interest 234A/B/C + 234F `it_int_total` → **`it_balancePayable`**.
Engine: **rebate 87A** (`:12112`) New ≤₹12 L → up to ₹60,000 (tapered); Old ≤₹5 L → ₹12,500. **Surcharge** 10/15/25% (Old 37%) w/ marginal relief + CG 15% cap + 115BBE +25%. **Cess 4%**. New-regime disables most Ch VI-A + HP set-off. Summary tab (`:399`): `sm_gti/ti/tax/prepaid/bal`.

## 5. JSON mapping (`buildItr1Json` `:1909`; `chapVIA` `:1853`)
Shape **`{ ITR: { ITR1: {…} } }`**; filename `{PAN}_2026-27_ITR1.json`. `Form_ITR1` (`:1938`): AssessmentYear `2026`, **SchemaVer `Ver1.1`**, FormVer `Ver1.0`.
Key maps: `cl_name`→`PersonalInfo.AssesseeName`; `cl_pan`→`PAN`; `cl_dob`→`DOB`; `asr_*`→`PersonalInfo.Address.*`; regime→`FilingStatus.OptOutNewTaxRegime`; `it_sal_total`→`ITR1_IncomeDeductions.{GrossSalary,Salary,NetSalary,IncomeFromSal}`; `it_hp_income`→`TotalIncomeChargeableUnHP`; OS sum→`IncomeOthSrc`; gti→`GrossTotIncome`; `chapVIA(ded)`→`DeductUndChapVIA` (Section80C…AnyOthSec80CCH `:1856`); `it_totalIncome`→`TotalIncome`; `it_taxOnTI`→`ITR1_TaxComputation.{TotalTaxPayable,GrossTaxLiability,NetTaxLiability}`; prepaid→`TaxPaid.TaxesPaid`; balance→`Refund.RefundDue`; bank→`Refund.BankAccountDtls.AddtnlBankDetails[]`; verifier→`Verification.Declaration.*`; `it_cg_112a`→`LTCG112A.TotLTCG112A`; AIS TDS→`TDSonSalaries`/`TDSonOthThanSals`.

## 6. Validation (`validateItr1` `:1881`)
ERRORS: PAN `^[A-Z]{5}\d{4}[A-Z]$` (`:1886`); Name required (`:1887`); **Total income > ₹50 L → "use ITR-2"** (`:1890`); **LTCG 112A > ₹1.25 L → "use ITR-2"** (`:1892`). WARNINGS: DOB format (`:1888`); refund-no-bank (`:1895`); computation-not-opened (`:1896`). Export gated on zero errors.

## 7. Add options
Bank, ESOP-sold, directorship, unlisted, PTI, 9 FA (info); employers, properties, salary/HP rows, all CG tables, OS tables, advance/SAT, agri, TDS/TCS, 80C/CCC/E/G/GGA/EEB, CFL, relief-90 (calculator).

## 8. Gaps / TODO (as-is)
1. **Tax JSON largely hard-zeroed** (`:1948`): `Rebate87A:0`, `EducationCess:0`, `Section89:0`, all `IntrstPay.234*:0`, **no `Surcharge` key**; `TotalTaxPayable`/`GrossTaxLiability`/`NetTaxLiability` all = `it_taxOnTI` (no decomposition) — even though the engine computes them.
2. `DeductionUs16:0` hard-coded (`:1942`) despite std deduction computed.
3. `ReturnFileSec:11` + `ItrFilingDueDate:'2026-07-31'` hard-coded — ignore `f_section` (`:1940`).
4. `CreationInfo` placeholders: `SW20000000`, `Digest:'-'`, `IntermediaryCity:'NA'` (`:1937`).
5. Per-section 80 figures in JSON may be 0 (chapVIA reads `it_80_c/ccc/…` but pipeline only guarantees aggregates); `80EE/EEA/EEB/GGA/GGC` hard-0 (`:1859`).
6. Advance tax & TDS schedules only emitted when **AIS imported**; manual `sf-advtax`/`sf-sat`/TDS rows not serialized; `SelfAssessmentTax:0`.
7. `EmployerCategory` has no info-tab input (falls back `OTH`).
8. Shared Master Calculator carries hidden out-of-scope BP/CG/AMT machinery.
