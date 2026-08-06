# ITR-1 — UI GAP MAP (path to 100% schema-complete offline export)

Coverage now: AY2026-27 ~29% req-present · AY2025-26 ~27%. Target 100%.

**Emitter:** `buildItr1Json()` (identical builder in `public/tax-utilities/itr1.html` :1909 [AY26-27] and `itr1-2025-26.html`) · `chapVIA()` :1853.
**The systemic gap:** the emitter writes identity + aggregate roll-ups + the tax ladder + prepaid-tax totals, and builds **zero itemized `Schedule*` nodes**. The UI (Computation frame drill-ins) already *captures* ~150 of the missing required leaves; they are simply never read into `buildItr1Json()`. So the dominant action is **C (wire existing UI → JSON)**, not new data-entry.

Legend for action codes — **A** mis-key/shape (emitter rename only) · **B** compute-and-export (calc has it, no UI) · **C** captured-but-not-exported (existing drill-in → wire into emitter) · **D** missing UI (new/extended input).
Node counts below are per the required-MISSING lists in `diff-ITR1-2026.txt` (251) / `diff-ITR1-2025.txt` (266). Where a schedule splits across actions the split is shown; "~" flags a judgment split between itemized rows (C/D) and their roll-up totals (B).

---

## A. Mis-key / shape fixes (emitter-only)

| our path (emitted) | schema path (required) | schedule | #req |
|---|---|---|---|
| `LTCG112A.TotLTCG112A` (:1971) | `LTCG112A.LongCap112A` | LTCG112A | 1 |

Adjacent emitter-only correctness fixes (values wrong, but nodes are ZERO not MISS — belong in B mechanically):
- `chapVIA()` (:1856-1861) reads calc cells `it_80_c / it_80_ccc / it_80_ccd1 / it_80_ccd1b / it_80_ccd2 / it_80_g / it_80_gg / it_80_u / it_80_tta / it_80_ttb` that **do not exist** in the calc DOM (only bundle totals exist) → every `DeductUndChapVIA.SectionXX` / `UsrDeductUndChapVIA.SectionXX` exports 0. Re-source from the real bundle cells (`it_80_ccccd`, `it_80_d`, `it_80_dd`, `it_80_other`…) or from the itemized rows wired in C.
- `Section80EE/EEA/EEB/GGA/GGC` hard-coded `0` (:1859-1860) — compute from the C-wired grids.
- `FilingStatus.ReturnFileSec` hard-coded `11` (:1953) ignoring `f_section` / `filing_section`; `AsseseeRepFlg` hard-coded `'N'` (:1953) — flip both from captured UI (see C).
- `PersonalInfo.SecondaryAdd` emitted `''` (:1952) — must be enum `Y|N`; default `'N'` (see PersonalInfo in B).

---

## B. Compute-and-export (no new UI)

Value is derivable in the calc frame (or is a sum of C-wired rows); emitter must compute + emit. **All are gated on the itemized rows in C being wired first** (a total needs its line-items).

| schema nodes / schedule | source / derivation | #req (approx) |
|---|---|---|
| `LTCG112A.TotSaleCnsdrn`, `TotCstAcqisn` | sum of `Long Term Capital Gain u/s 112A` grid cols `ltcg112a_{i}_sale` and computed cost-deductible; `LongCap112A`=`ltcg112a_net` | 2 |
| `PersonalInfo.AlternateAddress.*` (ResidenceNo, LocalityOrArea, CityOrTownOrDistrict, StateCode) — 2026 | default `SecondaryAdd:'N'` ⇒ block not required; OR copy primary `addr` when `asr_secsame='Yes'`. No new UI. | 4 |
| `ITR1_IncomeDeductions.PropertyDetails[].Rentdetails` computed rungs: `TotalUnrealizedAndTax`, `BalanceALV`, `AnnualOfPropOwned`, `ThirtyPercentOfBalance`, `TotalDeduct`, `IncomeOfHP`, `Section24B.TotalInterestUs24B` — 2026 | calc cells `hp_nav_{i}`, `hp_sd_{i}` (30%), `hp_int_{i}`, `hpi_total`, `hp_inc_{i}` in the HP block | ~7 |
| `ITR1_IncomeDeductions.AnnualValue`, `StandardDeduction`, `TotalIncomeOfHP` — 2025 flat HP | same calc cells (`hp_gav`, `hp_sd`, `hp_income`) | 3 |
| `ScheduleEA10_13A` derived rungs: `ActlRentPaid10Per`, `Sal40Or50Per`, `EligbleExmpAllwncUs13A` (+ `Placeofwork` enum from `mon_city_{j}` metro/others) | HRA exemption already computed in `Salary as per monthly table` (mon_hra_*, mon_rent_*, basic) | ~4 |
| Per-schedule **grand totals**: `Schedule80C.TotalAmt`; `Schedule80D.*.TotalPayments`×4 + `EligibleAmountOfDedn`; `TotalInterest80E/80EE/80EEA/80EEB`; `Schedule80G` `TotDon*` (16) + 4 grand; `Schedule80GGA` 4 totals; `Schedule80GGC` 4 totals; `ScheduleTCS.TCS[].TotalTCS`+`TotalSchTCS`; `ScheduleTDS3Dtls.TotalTDS3Details`; `TotalTDSonSalaries`; `TotalTDSonOthThanSals`; `TaxPayments.TotalTaxPayments`; `AllwncExemptUs10.TotalAllwncExemptUs10`; `ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Total` | Σ of the C-wired rows; drills already show these as ⚙ cells (`d80d_total`, `d80g_total`, `tdstcs_*_total`, `advtax_total`…) | ~55 |
| `PartB-ATI.*` updated-return tax ladder (UpdatedTotInc, AmtPayable, AddtnlIncTax, TaxUS140B, NetPayable, ScheduleIT totals…) — **2025 only** | derivable from main tax ladder + `139(8A)` additional-tax % (25/50/60/70) in `Filing Details` | ~10 |

---

## C. Captured-but-not-exported (wire existing UI → JSON) — the bulk of the work

| schema schedule | EXISTING drill-in / particular (verbatim) | binds → schema | #req (approx) |
|---|---|---|---|
| `FilingStatus.AssesseeRep.{RepName,RepEmailID,CountryCodeRepMobileNo,RepMobileNo}` + `AsseseeRepFlg='Y'` — 2026 | **Representative Assessee, if any** | `rep_name`→RepName, `rep_email`→RepEmailID, `rep_cc`→CountryCodeRepMobileNo, `rep_contact`→RepMobileNo; set flag `Y` when `rep_name` present | 4 |
| `ITR1_IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls[]` (SalNatureDesc enum, SalOthAmount) | **Salaries, allowances and perquisites** / **Salary as per Form 16 / Certificate** (Exempt columns tagged with 10(x) sections) | exempt cells (`sab_ex_*`, `f16_ex_*`, `mon_hra_ex`) grouped by section tag → SalNatureDesc/SalOthAmount | 2 |
| `PropertyDetails[]` structural: `HPSNo`, `AddressDetailWithZipCode.{AddrDetail,City,StateCode,CountryCode}`, `PropertyOwner`, `PropCoOwnedFlg`, `ifLetOut`, `AnnualLetableValue`, `IntOnBorwCap`, `Section24B.Section24BDtls[].{LoanTknFrom,BankOrInstnName,LoanAccNoOfBankOrInstnRefNo,DateofLoan,TotalLoanAmt,LoanOutstndngAmt,InterestUs24B}` — 2026 | **Details of the property** + **Interest on borrowed capital** + **Gross annual value (including co-owners' shares)** | `prop_flat/road/locality/city/state`, `prop_owner`, self/let-out tab→ifLetOut, `prop.gav.rentRows`→AnnualLetableValue, loan grid `prop.interest.loans[]`→Section24BDtls | ~15 |
| `ScheduleUs24B.ScheduleUs24BDtls[]` (LoanTknFrom, Bank, AcctNo, DateofLoan, TotalLoanAmt, LoanOutstndngAmt, InterestUs24B) — **2025 flat HP** | **Interest on borrowed capital** (same loans grid) | `prop.interest.loans[]` → ScheduleUs24BDtls[] | 7 |
| `OthersInc.OthersIncDtlsOthSrc[]` (OthSrcNatureDesc enum, OthSrcOthAmount, `DividendInc.DateRange.{Upto15Of6,Upto15Of9,Up16Of9To15Of12,Up16Of12To15Of3,Up16Of3To31Of3}`) | **Interest income** (SAV/deposits/other) + **Dividends** (per-row **Quarter** dropdown Q1–Q4) | `os_int_*`/`os_div_norm_{i}_q` amount×quarter → DateRange buckets; category → OthSrcNatureDesc | 7 |
| `UsrDeductUndChapVIA.PensionContribution80CCC[]` (TypeofIdentifier, NameofIdentifier, Amount) | **Investments u/s 80C, 80CCC, 80CCD** — 80CCC section | `s80ccc_{i}_*` (PRAN/Doc ID, amount) | 3 |
| `Schedule80C.Schedule80CDtls[]` (Amount, IdentificationNo) | **Investments u/s 80C, 80CCC, 80CCD** — 80C grid | `s80c_{i}_amt`→Amount, `s80c_{i}_acc`→IdentificationNo | 2 |
| `Schedule80D.*.Sec80D*HIDtls.Sch80DInsDtls[]` (InsurerName, PolicyNo, HealthInsAmt) + `SeniorCitizenFlag`, `ParentsSeniorCitizenFlag` (4 person buckets) | **80D — Health Insurance Premium** | `d80d_{par|sel}_{sc|ot}_co/_pol/_prem` → the 4 Sch80DInsDtls buckets; senior rows → flags | ~12 |
| `Schedule80DD.{NatureOfDisability,TypeOfDisability,DeductionAmount,DependentType}` | **80DD — Medical treatment of Handicapped Dependent** | `d80dd_type`→NatureOfDisability, `d80dd_severe`→TypeOfDisability, `d80dd_deduction`, `d80dd_relation`→DependentType (free-text→enum map) | 4 |
| `Schedule80U.{NatureOfDisability,TypeOfDisability,DeductionAmount}` | **Other Chapter VI-A Deductions** — 80U sub-section | `d80u_type`, `d80u_severe`, `d80u_ded` (free-text→enum) | 3 |
| `Schedule80E.Schedule80EDtls[]` (LoanTknFrom, Bank, AcctNo, DateofLoan, Interest80E) | **80E — Interest on Education Loan repaid** | `s80e_{i}_bank/_acct/_sdate/_int` (TotalLoanAmt/Outstanding NOT captured → see D) | 5 |
| `Schedule80EE.Schedule80EEDtls[]` (all 7) | **Other Chapter VI-A Deductions** — 80EE grid | `d80ee_{i}_*` (Loan-from, Bank, Acct, Sanction date, Total loan, Closing bal→LoanOutstndngAmt, Interest) | 7 |
| `Schedule80EEA` (PropStmpDtyVal + Dtls 8) | **Other Chapter VI-A Deductions** — 80EEA grid | `d80eea_{i}_*` incl. `_stamp`→PropStmpDtyVal | 8 |
| `Schedule80EEB.Schedule80EEBDtls[]` (all 8 incl. VehicleRegNo) | **Other Chapter VI-A Deductions** — 80EEB grid | `d80eeb_{i}_*` incl. `_vreg`→VehicleRegNo | 8 |
| `Schedule80G.{Don100Percent,Don50PercentNoApprReqd,Don100PercentApprReqd,Don50PercentApprReqd}.DoneeWithPan[]` (DoneeWithPanName, DoneePAN, AddressDetail.{AddrDetail,City,StateCode}, DonationAmtCash, DonationAmtOtherMode, DonationAmt, EligibleDonationAmt) | **Other Chapter VI-A Deductions** — 80G two grids (`Donations with 50%` / `100%`) + `Subject to ceiling?` checkbox | `g50_{i}_*`/`g100_{i}_*`; ceiling flag splits ApprReqd vs NoApprReqd → 4 buckets (PinCode missing → D) | ~40 |
| `Schedule80GGA.DonationDtlsSciRsrchRuralDev[]` (Clause, NameOfDonee, AddressDetail incl PinCode, DoneePAN, DonationAmtCash/OtherMode/Amt, EligibleDonationAmt) | **Other Chapter VI-A Deductions** — 80GGA grid | `gga_{i}_*` (has Pin code col) | 11 |
| `Schedule80GGC.Schedule80GGCDetails[]` (DonationDate, DonationAmtCash/OtherMode/Amt, EligibleDonationAmt) | **Other Chapter VI-A Deductions** — 80GGC grid | `ggc_{i}_date/_amt/_cash/_party*` | 5 |
| `ScheduleTCS.TCS[]` (TAN, name, AmtTaxCollected, CollectedYr, AmtTCSClaimedThisYear) | **TDS / TCS** — `Tax Collected at Source (TCS)` grid | `tcs_{i}_*` (Collector, TAN, collected, claimed, FY→CollectedYr). Also flips hard-coded `TaxPaid.TaxesPaid.TCS:0` | 5 |
| `ScheduleTDS3Dtls.TDS3Details[]` (PANofTenant, TDSSection, NameOfTenant, GrsRcptToTaxDeduct, DeductedYr, TDSDeducted, TDSClaimed) | **TDS / TCS** — `TDS Form 16B/16C/16D/16E` grid | `tds_16bcde_{i}_*` (PAN, Section, deductor→NameOfTenant, gross, FY, deducted, claimed) | 7 |
| `TDSonOthThanSals.TDSonOthThanSal[]` (TAN, name, TDSSection, AmtForTaxDeduct, DeductedYr, TotTDSOnAmtPaid, ClaimOutOfTotTDSOnAmtPaid) | **TDS / TCS** — `TDS as per Form 16A (other than salary)` grid | `tds_16a_{i}_*` (has Section + FY cols the AIS path lacked). Replace AIS-only emit (:1977) with UI grid | 7 |
| `TDSonSalaries.TDSonSalary[]` (TAN, name, IncChrgSal, TotalTDSSal) | **TDS / TCS** — `TDS from Salaries (Form 16)` grid | `tds_sal_{i}_*`. Replace AIS-only emit (:1976) | 4 |
| `TaxPayments.TaxPayment[]` (BSRCode, DateDep, SrlNoOfChaln, Amt) | **Advance Tax** + **Self-Assessment Tax paid** | `advtax_{i}_*` + `sat_{i}_*` (Bank, BSR, Date, Challan Sl, Amount) | 4 |
| `Refund.BankAccountDtls.AddtnlBankDetails[].UseForRefund` | **Bank Accounts** — `For refund?` checkbox | `bank_{i}_refund` → UseForRefund (true/false). (Other 4 bank cols already emitted at :1967, conditionally) | 1 |
| `TaxReturnPreparer.{IdentificationNoOfTRP,NameOfTRP}` (+ ReImbFrmGov) | **Other Forms filed** — TRP block | `ofr_trp_id`→IdentificationNoOfTRP, `ofr_trp_name`→NameOfTRP, `ofr_trp_amt`→ReImbFrmGov | 2 |
| `ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls[]` (Category/SubCategory, OthAmount; +NatureDesc 2025) | **Schedule EI — Exempt Income (Disclosure)** + **Agricultural Income** | `ei_*` rows + `agri_net` → category-tagged rows | ~2 |
| `IncomeNotified89A` / `NOT89AType[]` / OS `NOT89AInc.DateRange` — **2025 only** | **Section 89A — Income from retirement benefit a/c** (per-employer + OS variants) | `emp.a89[]`, `os_89a_{canada|uk|usa|others}` → country/amount | ~7 |

---

## D. MISSING UI — new fields / drill-ins to ADD

Most of "not fillable" is C (wiring), not D. Only these need real new inputs. Prefer **EXTEND** an existing drill-in over a new one.

| what it collects | PARENT screen | NEW / EXTENDED drill-in | key fields (label \| type \| grid cols) | #req | priority |
|---|---|---|---|---|---|
| **HP co-owners + tenants** (2026 nested HP) — `PropertyDetails[].CoOwners[]` (CoOwnersSNo, NameCoOwner) + `TenantDetails[]` (TenantSNo, NameofTenant) + `PropCoOwnedFlg`/`ifLetOut` selectors | Computation → House Property | **EXTEND: Details of the property** | Co-owned? (Yes/No) · co-owner grid: `S.No \| Name \| PAN \| % share` · Let-out?→enum L/D/S · tenant grid: `S.No \| Name of Tenant \| PAN` | ~5 (26 only) | High |
| **80E loan financials** — `Schedule80E` `LoanTknFrom`, `TotalLoanAmt`, `LoanOutstndngAmt` (grid captures bank/acct/date/interest only) | Computation → Chapter VI-A | **EXTEND: 80E — Interest on Education Loan repaid** | add cols `Loan taken from (Bank/Instn)` \| dropdown B/I · `Total loan amount` \| number · `Closing balance` \| number | 3 | High |
| **80G PinCode + State-as-code** — `Schedule80G...AddressDetail.PinCode` (+ StateCode enum) across 4 buckets | Computation → Chapter VI-A | **EXTEND: Other Chapter VI-A Deductions** (80G grids) | add `Pin code` \| number col; convert `State` free-text → StateCode dropdown (01–37/99) | ~8 | High |
| **PersonalInfo AlternateAddress** (only if genuinely different secondary address) — 2026 | Data Entry → Assessee info. | **EXTEND: Assessee info.** (secondary section) | `Secondary Flat/Door`, `Locality`, `City`, `State` \| text/dropdown — only when `asr_secsame='No'` (else use B) | 4 (26 only) | Low |
| **139(1) seventh-proviso disclosures** — `FilingStatus.clauseiv7provisio139iDtls[]` (Nature enum 1/2, Amount) | Data Entry → ITR filing info. | **NEW: Seventh Proviso 139(1)** | grid `Nature (1=deposit>1cr / 2=other) \| dropdown · Amount \| number` | 2 (both AYs) | Low |
| **ITR-U machinery** — `PartA_139_8A` (12) + `PartB-ATI` (20) updated-return block — **2025-26 ONLY** | Computation → Filing Details (139(8A) branch) | **NEW/EXTEND: Filing Details → Updated Return (ITR-U)** | PAN/Name/AY (echo), `Previously filed? \| Y/N`, `Orig ack no.`, `Orig filed date \| date`, `Filed within period \| dropdown`, reason grid `Reason for updating`; unabsorbed-dep grid `Year \| Amount`. PartB-ATI tax rungs are **B** (compute) | ~15 UI + ~17 B | Med (AY25-26 blocker) |

---

## E. Per-required-schedule checklist

| schedule | #req MISS (26 / 25) | current coverage | action | target |
|---|---|---|---|---|
| FilingStatus | 6 / 2 | rep drill captured, flag hard-coded N; clause-iv-7 none | C (AssesseeRep) + D (clause-iv-7) + A (ReturnFileSec) | 100% |
| PersonalInfo | 4 / 0 | primary addr captured | B (SecondaryAdd='N') / D-opt | 100% |
| ITR1_IncomeDeductions | 43 / 26 | totals emitted; itemized captured, unwired | C (rows) + B (subtotals) + D (co-owner/tenant 26) | 100% |
| LTCG112A | 3 / 3 | value computed, wrong key | A (LongCap112A) + B (2 totals) | 100% |
| Refund | 5 / 5 | 4 cols emitted (cond.), refund flag captured | C (UseForRefund) | 100% |
| Schedule80C | 3 / 3 | grid captured | C (2) + B (total) | 100% |
| Schedule80D | 19 / 19 | full insurer grid captured | C (~12) + B (~7) | 100% |
| Schedule80DD | 4 / 4 | drill captured (free-text) | C (enum map) | 100% |
| Schedule80U | 3 / 3 | sub-section captured | C (enum map) | 100% |
| Schedule80E | 8 / 8 | partial grid | C (5) + D (2 cols) + B (1) | 100% |
| Schedule80EE | 8 / 8 | grid captured | C (7) + B (1) | 100% |
| Schedule80EEA | 9 / 9 | grid captured (+stamp) | C (8) + B (1) | 100% |
| Schedule80EEB | 9 / 9 | grid captured (+vreg) | C (8) + B (1) | 100% |
| Schedule80G | 60 / 60 | 2 grids + ceiling flag captured; Pin missing | C (~40) + D (Pin/State ~8) + B (~12) | 100% |
| Schedule80GGA | 15 / 15 | full grid incl Pin | C (11) + B (4) | 100% |
| Schedule80GGC | 9 / 9 | grid captured | C (5) + B (4) | 100% |
| ScheduleEA10_13A (HRA) | 8 / 8 | HRA in monthly table | C/B (compute from mon_hra) | 100% |
| ScheduleTCS | 7 / 7 | TCS grid captured; TaxPaid.TCS hard-0 | C (5/6) + B (total) | 100% |
| ScheduleTDS3Dtls | 8 / 8 | 16B/C/D/E grid captured | C (7) + B (total) | 100% |
| TDSonSalaries | 5 / 5 | AIS-only; UI grid captured | C (grid, 4) + B (total) | 100% |
| TDSonOthThanSals | 8 / 8 | AIS-only; UI grid has Section+FY | C (7) + B (total) | 100% |
| TaxPayments (challans) | 5 / 5 | AdvTax + SAT grids captured | C (4) + B (total) | 100% |
| TaxReturnPreparer | 2 / 2 | TRP block in Other Forms | C | 100% |
| ScheduleUs24B *(2025 only)* | — / 8 | loans grid captured | C (7) + B (total) | 100% |
| PartA_139_8A *(2025 only)* | — / 12 | Filing 139(8A) partial | D (new ITR-U block) | 100% |
| PartB-ATI *(2025 only)* | — / 20 | none | B (tax ladder) + D (ScheduleIT challans reuse) | 100% |

**AY-specific required schedules:** 2025-26 adds ITR-U (`PartA_139_8A` + `PartB-ATI`, 32 nodes) and Sec-89A leaves (`IncomeNotified89A`/`NOT89A*`) and **flat** HP (`AnnualValue`/`StandardDeduction`/`TotalIncomeOfHP` + top-level `ScheduleUs24B`). 2026-27 drops all ITR-U and Sec-89A, and replaces flat HP with **nested** `PropertyDetails[]` (co-owners/tenants/Rentdetails/Section24B). Any HP fix must branch on AY.

---

## F. Path-to-100 summary

**Approx action counts (AY2026-27, 251 reqMISS):** A ≈ 1 · B ≈ 70 (schedule totals + HP/LTCG/HRA computed rungs) · C ≈ 155 (itemized rows already captured) · D ≈ 25 (co-owner/tenant, 80E cols, 80G Pin, alt-address, 7th-proviso).
**AY2025-26 (266 reqMISS):** A ≈ 1 · B ≈ 85 (+PartB-ATI ladder, flat-HP) · C ≈ 145 (−AssesseeRep, +ScheduleUs24B, +Sec89A) · D ≈ 35 (+ITR-U PartA block).

**NEW drill-ins needed: 2** — (1) *Seventh Proviso 139(1)* (2 nodes, low priority); (2) *Filing Details → Updated Return (ITR-U)* for AY2025-26. Everything else is **wiring (C)** or **extending 4 existing drills** (Details of the property; 80E; 80G; Assessee info.).

**Top 3 new-UI surfaces:** (1) EXTEND *Details of the property* — co-owner + tenant grids (unlocks 2026 nested HP); (2) EXTEND *Other Chapter VI-A Deductions* — 80G Pin code / State-code + confirm ceiling→bucket mapping (unlocks the 60-node Schedule80G); (3) EXTEND *80E* loan-amount/outstanding/lender columns.

**Biggest single blocker:** not a UI gap — it is that `buildItr1Json()` builds **no itemized `Schedule*` node at all** (only aggregates). One emitter pass that reads the already-captured deduction/TDS/TCS/challan/HP drill data into the ~20 `Schedule*` nodes moves ~155 required leaves from MISS to present in a single change. By node count the largest schedule is **Schedule80G (60)**, fully captured in the two 80G grids (+ Pin/State extension) — wire the `g50_*`/`g100_*` rows into the four `Don*Percent*` buckets.

**Ordered build list (identity → tax-core → income heads → VIA proof → TDS/challan → bank/refund → FA/AL):**
1. **Emitter A/B core:** `LongCap112A` rename; `SecondaryAdd='N'`; `ReturnFileSec` from `filing_section`; `AsseseeRepFlg` from rep drill; re-source `chapVIA()` from real bundle cells.
2. **Identity:** wire *Representative Assessee* (C); 7th-proviso NEW UI (D).
3. **Income heads:** HP `PropertyDetails[]`/`ScheduleUs24B` from the 3 HP drills (C) + co-owner/tenant EXTEND (D) + computed rungs (B); `AllwncExemptUs10` + `OthersInc` dividend-quarter (C); `ScheduleEA10_13A` HRA (B/C); LTCG112A totals (B).
4. **Chapter VI-A proof schedules:** 80C, 80D, 80DD, 80U, 80E(+D cols), 80EE/EEA/EEB, 80G(+Pin D), 80GGA, 80GGC, 80CCC from the deduction drills (C) + all totals (B).
5. **TDS/TCS/challans:** TDSonSalaries, TDSonOthThanSals, ScheduleTCS, ScheduleTDS3Dtls from *TDS / TCS* drill (C); TaxPayments from *Advance Tax*/*Self-Assessment Tax paid* (C); totals (B).
6. **Bank/refund:** `UseForRefund` from `bank_{i}_refund` (C).
7. **AY2025-26 ITR-U:** *Updated Return* block (D) + PartB-ATI ladder (B) + Sec-89A wiring (C).
8. TaxReturnPreparer (C). (Schedule FA / AL are not part of ITR-1 — no action.)
