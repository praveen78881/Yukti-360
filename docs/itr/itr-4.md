# ITR-4 Sugam — Presumptive Business / Profession

> Applicable: individuals / HUF / firms (non-LLP) with presumptive income u/s **44AD / 44ADA / 44AE** and total income ≤ ₹50 L. In this app it's offered to **sole proprietors** (with ITR-3) and **HUF**. File: `public/tax-utilities/itr4.html` (A.Y. 2026-27, ~2.5 MB, 12,243 lines) + `itr4-2025-26.html` (A.Y. 2025-26, identical logic, year labels differ). All line numbers below are into `itr4.html`.

## Layout
Three tabs (`:289-292`): **Info** (`data-tab="info"`), **Computation** (`data-tab="comp"`), **Summary** (`data-tab="summary"`); switch via `switchMainTab()` (`:1563`).
- **The Computation tab is itself an iframe** (`<iframe id="calcFrame">` `:479`) whose HTML lives in a `<script type="text/plain" id="calc-html">` block (`:1984+`), injected via `srcdoc` in `injectCalculator()` (`:1510`). So every `it_*` computation cell and the presumptive drill-ins live inside that embedded document.
- Identity uses the **simple `cl_*` set** (`:2146-2152`): `cl_name`, `cl_pan`, `cl_status` (Individual/HUF), `cl_res`, `cl_dob`.

## 1. Info Sheet particulars (`data-tab="info"`, `:300-472`)
**ITR Information (`g-info`, `:306-392`):** `st_assessee`→Assessee info (drill `sf-assessee`) · `st_verifier`→Verifier · `st_bank`→Bank Accounts · `f_section`→return section 139(1)/(4)/(5)/(9)/142(1) · `f_rettype`→Original/Revised · `f_regime`→New 115BAC / Old (via Form 10-IEA) · `st_repassessee`→Representative Assessee · `st_pti`→Pass-Through Income 115U/UA/UB · `st_nature`→Nature of Business (drill `sf-nature`) · `st_gstr`→Turnover per GSTR (drill `sf-gstr`) · `firsttime` (Y/N) + conditional `f_startdate` · `partner`/`unlisted`(→`st_unlisted`)/`director`(→`st_directorship`) toggles · `st_esop`→deferred sweat-equity tax · `st_otherforms`.
**Foreign Assets & Income (`g-fa`, schtag FA, `:397-434`):** master `hasFA` + 9 drill-in repeaters (depository, equity/debt, insurance, financial interest, immovable, other capital assets, signing authority, trusts, other income).
**Financial particulars of business (`g-fp`, schtag BP, `:439-471`):** master `discloseFP`; two-column balance sheet via `data-fp="…"` — Capital & Liabilities (`cap_capital/secured/unsecured/advances/creditors*/other` → `fp_cap_total`) and Assets (`ast_fixed/invest/inventory*/debtors*/bank*/cash*/loans/other` → `fp_ast_total`), balance check `fp_balance` (* = mandatory).

## 2. Presumptive income entry (computation iframe, `g-bp` `:2173-2231`)
- **44AD business** (`:2312`, JS `:5979`): per-business rows (`ad44_mode/to/pct/pr_{i}`); **6%** for A/c-payee receipts, else **8%** (`:6001`); turnover ceiling ₹3 cr if ≤5% cash else ₹2 cr (`:2316`). Addable `add44ad`.
- **44ADA profession** (`:2323`, JS `:6013`): rows `ada44_mode/gr/pct/pr_{i}`; default **50%** (`:6037`); ceiling ₹75 L if ≤5% cash else ₹50 L. Addable `add44ada`.
- **44AE transport** (`:2388`, JS `:6161`): per-vehicle rows (desc/months/weight/type/income/regNo/ownership); deemed profit **₹1,000 × tonnes × months** (HGV) or **₹7,500 × months** (`:6184`). Addable `add44ae`.
- Other heads feeding the return: **Salary** (`g-sal` `:2155`, per-employer, std ded 16(ia), prof-tax 16(iii)), **House Property** (`g-hp` `:2165`, SOP interest cap ₹2 L), **Other Sources** (`g-os` `:2242`: interest/dividend/DTAA/family pension/gifts/special/winnings/…), **Chapter VI-A** (`g-80` `:2262`: `it_80_ccch/d/dd/ddb/e/ccccd(80C+CCC+CCD)/other` → `it_80_total`).
- Non-presumptive rows (35AD/commission/F&O/firm/non-spec/speculation, `:2178-2185`) exist but are **blocked by the validator** (Sugam scope).

## 3. Drill-in Schedules (`.subform` popups) — **+ Add** where noted
Info-tab: `sf-assessee`, `sf-verifier`, `sf-repassessee`, `sf-esop` (+rows), `sf-otherforms`, **`sf-bank`** (+Add `:634`), **`sf-pti`** (+Add), **`sf-gstr`** (+Add), **`sf-nature`** (+Add ×3: AD/ADA/AE), **`sf-directorship`** (+Add), **`sf-unlisted`** (+Add), **9× `sf-fa_*`** foreign-asset tables (+Add each).
Presumptive: **`sf-44ad`/`sf-44ada`/`sf-44ae`** (+Add). Plus computation drill-ins: `sf-depit`, `sf-ltcg112a`, `sf-os-*`, `sf-80-*`, `sf-rel89-*`/`sf-rel90`, `sf-amt`, `sf-tdstcs`, `sf-advtax`, `sf-sat`, `sf-int-234`, `sf-schedule-ei`, `sf-loss-cfl`, `sf-agri`.

## 4. Computation Sheet (embedded iframe, `:2140-2308`)
Chain of `it_*` cells: `it_sal_income` → `it_hp_income` → `it_bp_income` (presumptive) → `it_cg_112a` (LTCG 112A) → OS aggregate → `it_80_total` → **`it_totalIncome`** → `it_regime` (New/Old) → **`it_taxOnTI`** → relief 89/90-91 → AMT (`it_amt_115jc` 18.5% old-regime only, credit 115JD) → prepaid (`it_tdstcs/advtax/sat`) → interest `it_int_234a/b/c` + fee `234f` → **`it_balancePayable`**. Surcharge with 15% cap on CG/OS-special + 115BBE 25% (`:12177`); cess 4% (`taxWithCess=tax*1.04`, `:10456`). Summary card `sm_*` (`:486-500`): GTI `sm_gti`, Total Income `sm_ti`, Balance `sm_bal`.

## 5. JSON mapping (`buildItr4Json` `:1855-1917`; export `doExportItr4` `:1833`)
Shape **`{ ITR: { ITR4: {…} } }`**; filename `{PAN}_2026-27_ITR4.json`.
- `CreationInfo` (SWVersion 1.0, SWCreatedBy `SW20000000`, Digest `-`) — `:1888`
- `Form_ITR4` — FormName `ITR-4`, **AssessmentYear `2026`**, **SchemaVer `Ver1.1`**, **FormVer `Ver1.0`** — `:1889`

| Info field | JSON path |
|---|---|
| `cl_name`/`cl_pan`/`cl_dob`/`cl_status` | `PersonalInfo.{AssesseeName, PAN, DOB, Status}` (`:1890`) |
| assessee address | `PersonalInfo.Address.{ResidenceNo,LocalityOrArea,CityOrTownOrDistrict,StateCode,PinCode,MobileNo,EmailAddress}` |
| regime | `FilingStatus.Form10IEAEarlierAYOldRegime`, `ReturnFileSec` (`:1891`) |
| `it_bp_income` | `IncomeDeductions.IncomeFromBusinessProf` (`:1893`) |
| `it_sal_total` | `IncomeDeductions.GrossSalary/Salary/NetSalary/IncomeFromSal` (`:1894`) |
| `it_hp_income` / OS | `IncomeDeductions.TotalIncomeChargeableUnHP` / `IncomeOthSrc` (`:1895`) |
| gti | `IncomeDeductions.GrossTotIncome`, `GrossTotIncomeIncLTCG112A` (`:1896`) |
| `chapVIA4(ded)` | `IncomeDeductions.UsrDeductUndChapVIA` & `DeductUndChapVIA`; `TotalIncome` (`:1897`) |
| `it_taxOnTI` | `TaxComputation.{TotalTaxPayable,GrossTaxLiability,NetTaxLiability}` (`:1900`) |
| interest cells | `TaxComputation.IntrstPay.{234A,234B,234C,LateFilingFee234F}` (`:1902`) |
| prepaid | `TaxPaid.TaxesPaid.{AdvanceTax,TDS,TCS,SelfAssessmentTax,TotalTaxesPaid}`, `BalTaxPayable` (`:1905`) |
| balance | `Refund.{RefundDue, BankAccountDtls}` (`:1906`) |
| verifier | `Verification.Declaration.{AssesseeVerName,FatherName,AssesseeVerPAN}`, Capacity `S` (`:1907`) |
| AIS TDS | `ITR4.TDSonSalaries` (192) / `TDSonOthThanSals` (`:1910-1915`) |

`chapVIA4()` (`:1843`) emits 80C/CCC/CCD(1)/CCD1B/CCD(employer)/D/DD/DDB/E/G/GG/GGC/U/TTA/TTB/80CCH → `TotalChapVIADeductions`.

## 6. Validation rules (`validateItr4` `:1812-1831`, on Export)
- **PAN** `^[A-Z]{5}\d{4}[A-Z]$` → ERROR if bad (`:1817`)
- **Name** required → ERROR (`:1818`)
- **DOB** `dd/mm/yyyy` → WARNING if bad (`:1819`)
- **Total income > ₹50 L** → ERROR "use ITR-3" (`:1821`)
- **LTCG 112A > ₹1.25 L** → ERROR "use ITR-2/3" (`:1823`)
- **Non-presumptive income > 0** (35AD/comm/F&O/firm/non-spec/spec) → ERROR "use ITR-3" (`:1826`)
- **Refund with no bank acc+IFSC** → WARNING (`:1828`)
- **Computation tab never opened** (`!calcReady`) → WARNING (`:1830`)
- Export blocked unless `errors.length === 0` (`:1802`).

## 7. Add options
Info: bank, PTI, GSTR, nature (×3), 9 foreign-asset tables, directorship, unlisted, ESOP rows. Computation: employer, house property, 44AD/44ADA/44AE rows (self-restore a blank row if all removed).

## 8. Gaps / TODO (as-is; documentation only)
1. **No presumptive turnover-ceiling validation** — the ₹2 cr/₹3 cr (44AD), ₹50 L/₹75 L (44ADA), 44AE limits shown in UI notes are **not enforced** in `validateItr4`.
2. **No presumptive-minimum enforcement** — a user-entered profit below 8%/6%/50% is accepted without warning.
3. **Rebate 87A / EducationCess / Surcharge hardcoded 0 in JSON** (`:1900`) though computed internally — `TotalTaxPayable`/`GrossTaxLiability` all equal the single `it_taxOnTI`; the surcharge/cess/rebate breakdown isn't separated for the ITD schema.
4. **Presumptive detail not schema-mapped** — JSON sends aggregate `IncomeFromBusinessProf` only; no per-vehicle 44AE array or per-business 44AD/44ADA breakdown (ITD Sugam schema expects Schedule BP detail).
5. **Financial particulars (§3 balance sheet), Nature of Business, GSTR, PTI, Foreign Assets** captured in UI but **not serialized** in `buildItr4Json` (only bank + AIS-TDS arrays are emitted).
6. **`AssessmentYear:'2026'` and due-date hardcoded** (`:1889-1891`) — per-year maintenance.
7. **`SWCreatedBy/JSONCreatedBy:'SW20000000'`, `Digest:'-'`** are placeholders, not real utility credentials.
