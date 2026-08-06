# ITR-2 — COMPLETE STRUCTURE MAP

Route(s): `/company/[id]/income-tax` (ITR workspace, form served into an iframe) · standalone `/tax-utilities/itr2.html` (AY 2026-27) and `/tax-utilities/itr2-2025-26.html` (AY 2025-26)
Entry component: `src/app/company/[id]/income-tax/page.tsx:414` (iframe, `src={itrSrc(ay, key)}`); path resolver `itrSrc()` at `page.tsx:46-49`; ITR-2 meta at `page.tsx:53` ("Capital gains, multiple properties & foreign assets — no business income"); offered to entity types `individual` and `huf` (`page.tsx:64,67`); AY list at `page.tsx:35-38` (`itr_ay2627` / `itr_ay2526` entity_data modules).
AYs covered: **2025-26, 2026-27**. The two HTML files are line-aligned (both 12,504 lines; diff is pure substitutions — no added/removed lines), so every `itr2.html:{line}` reference below is valid for `itr2-2025-26.html` too. All AY differences are listed in the "AY 2025-26 vs 2026-27" section at the end.

Form title: **"ITR-2 · Data Entry"** · banner sub-line: **"For Individual or HUF NOT having Income from Business or Profession · computed u/s 115BAC by default"** · AY pill: **"A.Y. 2026-27"** (itr2.html:284-289).

Verification method: code walk of the full DOM + scripts, cross-checked by a live Playwright (msedge) UI walk against `http://localhost:7777/tax-utilities/itr2.html` — all 28 drill-ins opened, all conditional reveals triggered, computed cells read live. No blocking `required` attributes exist anywhere in the form; "Required" below reflects export-validation only.

---

## Screen: Global chrome (top banner · client bar · tab bar · sticky rail)

### Particular: Client bar (itr2.html:294-303)
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Name of Assessee | text | — | Full name of assessee | — | empty | Yes (export) | non-empty else error "Name of Assessee is required." | — | `cl_name` | banner, calc `cl_name`, JSON `AssesseeName`, `Verification.AssesseeVerName` | — |
| PAN | text | — | ABCDE1234F | — | empty | Yes (export) | maxlength 10, uppercase, `^[A-Z]{5}\d{4}[A-Z]$` else error "PAN is missing or invalid (format ABCDE1234F)." | — | `cl_pan` | calc `cl_pan`, JSON `PAN`, export filename `{PAN}_2026-27_ITR2.json`, AIS PDF password | filename year `2025-26` |
| Status | select | Individual · HUF | — | — | Individual | — | — | — | `cl_status` | calc `cl_status`, JSON `Status` ('I'/'H') | — |
| Date of Birth | text | — | DD/MM/YYYY | — | empty | Warn only | maxlength 10, `DD/MM/YYYY` else warning "Date of Birth should be DD/MM/YYYY (needed for correct age-based slab)." | — | `cl_dob` | calc `cl_dob` (age slab), JSON `DOB` (ISO), AIS PDF password | — |

Buttons: **"⚙ Defaults"** (`openDefaultsBtn`, title "Manage default particulars") → opens Manage Default Particulars panel · **"⭳ Import AIS"** (`importAisBtn`, title "Import your AIS (PDF or CSV) downloaded from the income-tax portal") → hidden file input `aisFileInput` (accept .pdf,.csv) · **"⭱ Export ITR JSON"** (`exportJsonBtn`, title "Validate and export the ITR JSON for portal upload") → switches to Summary tab, runs `validateItr2()`, auto-downloads JSON when 0 errors.
Tabs (itr2.html:309-318): **"ITR Information"** · **"Computation of Income"** · **"Tax Summary & Filing"** (`switchMainTab`, closes any open popup).
Sticky rail (itr2.html:447-453): pills **"Return section"** (`r_sec` ⚙ mirrors `f_section`) · **"Total Income"** (`rail_ti` ⚚ calc `it_totalIncome`) · **"Balance Tax"** (`rail_bal` ⚙ |calc `it_balancePayable`|) · **"Assets total"** (`r_al` ⚙ = AL assets total) · badge **"Regime: New (default)"** (`r_regime`, static text).

---

## Screen: ITR Information (tab "ITR Information", `pane-info`, itr2.html:320-409)

Page sub-header (italic, centered): *"(For Individual or HUF NOT having Income from Business or Profession)"*.
Collapsible group headers (`.ittog`, ▾/▸ toggle): **"ITR Information"** (`g-info`) · **"Foreign Assets & Incomes"** (badge `FA`, `g-fa`) · **"Assets / Liabilities^"** (badge `AL`, `g-al`).
Column header row: (blank) | (blank) | **"Status / Value"** | **"Sch."**.
Status cells (`st_*`) show ⚙ chips: green "Entered" / blue "N entry(s)/account(s)/person(s)/company(s)" / grey "Not entered"/"Empty" (`stDone`/`stCnt`, itr2.html:1614-1632).

### Group: ITR Information (`g-info`) — sub-heading "Basic info."

### Particular: "Assessee info."   [click ⋯ → opens: sf-assessee]
#### Drill-in: Assessee info. (source: itr2.html:462-506)
Header: "Assessee info." · meta "A.Y. 2026-27 · assessee master data" · note: "Secondary address & contact auto-fill from the Permanent Info table (Tools → Settings → ITR/e-filing → Auto-fill)." · Button: **"✓ Done"**. Section headers: **Identity / Primary Address / Contact / Secondary Contact details / Other**.
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Name of Assessee | text | — | Full name as per PAN | — | pre-filled from `cl_name` | — | — | — | `asr_name` → `data.assessee.name` | syncs back to `cl_name` | — |
| PAN | text | — | ABCDE1234F | — | from `cl_pan` | — | maxlength 10, uppercase | — | `asr_pan` | syncs `cl_pan` | — |
| Status | select | Individual · HUF | — | — | from `cl_status` | — | — | — | `asr_status` | syncs `cl_status` | — |
| Date of Birth / Incorporation (DD/MM/YYYY) | text | — | DD/MM/YYYY | — | from `cl_dob` | — | `fmtDate` auto-slashes, maxlength 10 | — | `asr_dob` | syncs `cl_dob` | — |
| Gender | select | (Select) · Male · Female · Transgender | — | — | (Select) | — | — | — | `asr_gender` | — | — |
| Father's Name | text | — | — | — | empty | — | — | — | `asr_father` | — | — |
| Residential Status | select | Resident · Resident but Not Ordinarily Resident · Non-Resident | — | — | Resident | — | — | — | `asr_resstatus` | not exported (JSON hard-codes `RES`) | — |
| Flat / Door / Block No. | text | — | — | — | empty | — | — | — | `asr_flat` | JSON `Address.ResidenceNo` | — |
| Name of Premises / Building / Village | text | — | — | — | empty | — | — | — | `asr_premises` | JSON `ResidenceName` | — |
| Road / Street / Post Office | text | — | — | — | empty | — | — | — | `asr_road` | JSON `RoadOrStreet` | — |
| Area / Locality | text | — | — | — | empty | — | — | — | `asr_area` | JSON `LocalityOrArea` | — |
| Town / City | text | — | Bengaluru | — | empty | — | — | — | `asr_city` | JSON `CityOrTownOrDistrict`, `Verification.Place` | — |
| State | text | — | Karnataka | — | empty | — | — | — | `asr_state` | — (JSON `StateCode` falls back '99') | — |
| Country | text | — | — | — | India | — | — | — | `asr_country` | — | — |
| PIN Code | text | — | 560001 | — | empty | — | maxlength 6 | — | `asr_pin` | JSON `PinCode` | — |
| Mobile No. (Assessee) | text | — | 10-digit mobile | — | empty | — | — | — | `asr_mobile` | JSON `MobileNo` | — |
| STD code | text | — | 080 | — | empty | — | — | — | `asr_std` | — | — |
| Landline No. | text | — | Optional | — | empty | — | — | — | `asr_landline` | — | — |
| Country code (for Assessee's Mobile No.) | text | — | — | — | 91 | — | — | — | `asr_cc` | — | — |
| e-Mail ID (Assessee) | email | — | name@example.com | — | empty | — | — | — | `asr_email` | JSON `EmailAddress`; drives st_assessee "Entered" | — |
| District | text | — | Bengaluru Urban | — | empty | — | — | — | `asr_district` | — | — |
| Secondary address same as primary address? | select | Yes · No | — | — | Yes | — | — | — | `asr_secsame` | — | — |
| Mobile No. | text | — | Optional | — | empty | — | — | — | `asr_secmobile` | — | — |
| e-Mail ID | text | — | Optional | — | empty | — | — | — | `asr_secemail` | — | — |
| Aadhaar No. | text | — | XXXX XXXX XXXX | — | empty | — | maxlength 14 | — | `asr_aadhaar` | JSON `AadhaarCardNo` | — |
| Aadhaar Enrolment ID (if Aadhaar not available) | text | — | Optional | — | empty | — | — | — | `asr_aadhaareid` | — | — |
| Liable to maintain accounts as per Sec.44AA? | select | No · Yes | — | — | No | — | — | — | `asr_44aa` → `data.assessee.acc44aa` | not exported | — |

Discrepancy note: source comment `itr2.html:461` reads "(ITR-3: extra 'Liable to maintain accounts as per Sec.44AA?')" — the ITR-3 field is retained in ITR-2 and is never emitted in the JSON.

### Particular: "Verifier info."   [click ⋯ → opens: sf-verifier]
#### Drill-in: Verifier info. (source: itr2.html:509-521)
Meta "A.Y. 2026-27 · person verifying the return" · Button **"✓ Done"**.
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Name | text | — | Full name of verifier | — | empty | — | — | — | `vfr_name` | st_verifier ("Entered" needs name+PAN) | — |
| PAN | text | — | ABCDE1234F | — | empty | — | maxlength 10, uppercase | — | `vfr_pan` | st_verifier | — |
| Capacity | text | — | e.g. Self / Karta / Authorised signatory | — | empty | — | — | — | `vfr_capacity` | not exported (JSON `Capacity:'S'` hard-coded) | — |
| Father's name | text | — | — | — | empty | — | — | — | `vfr_father` | JSON `Verification.Declaration.FatherName` | — |
| Place of signing | text | — | City | — | empty | — | — | — | `vfr_place` | not exported (`Place` uses assessee city) | — |

### Particular: "Bank Accounts"   [click ⋯ → opens: sf-bank]
#### Drill-in: Bank Accounts (source: itr2.html:541-552)
Meta "A.Y. 2026-27 · all accounts held in India" · note: "If multiple accounts are ticked for refund, refund will be credited to one validated account. For the procedure to validate the account in IT e-filing portal, press 'F1' key." · Buttons: **"✓ Done"**, **"+ Add row"** (`addBankBtn`).
Grids: section "Bank Accounts (All)" — headers verbatim: **Bank Name | Account Number | IFS Code | Type of Account | For refund? | (remove)**. Row behavior: unlimited rows via "+ Add row"; per-row **✕** remove (last row never removed). Per-row fields: Bank Name (text, placeholder "e.g. HDFC Bank"), Account Number (text), IFS Code (text, placeholder "HDFC0000123"), Type of Account (select: **(Select) · Savings · Current · Cash Credit (CC) · Over Draft (OD) · Non-Resident (NRO/NRE)**), For refund? (checkbox). Totals: footer "Accounts entered **0**" (⚙ `bank_count` = rows with name or account no.).
Feeds: JSON `Refund.BankAccountDtls.AddtnlBankDetails[]` (`IFSCCode/BankName/BankAccountNo/AccountType`, rows with an account no. only), `BankDtlsFlag` Y/N; refund-due warning when no account has acc+IFSC. Cardinality: 1..n (starts with 1 blank row).

### Particular: "Residential status info."   [click ⋯ → opens: sf-residential]
#### Drill-in: Residential status info. (source: itr2.html:555-569)
Meta "A.Y. 2026-27 · determination of residential status u/s 6" · note: "^182 days in case of citizen of India, left India for employment / as a member of crew of Indian ship or Citizen of India / PIO, visited India."
Grids: table headers **Residential status | (checkbox) | Section**; section row "Basic conditions:".
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a) Stayed in India for at least 182 days in the PY? | checkbox | — | — | tag "6 (1)(a)" | unchecked | — | — | — | `res_a` | st_residential | — |
| Citizen of India / PIO, visited India during the year & having taxable total income above Rs. 15 lakh from Indian sources? | checkbox | — | — | — | unchecked | — | — | — | `res_citizen` | rewrites row (b) | — |
| b) Stayed in India for at least 60^ days in the PY and at least 365 days in 4 years preceding the PY? | checkbox | — | — | tag "6 (1)(c)" | unchecked | — | — | label/section swap (below) | `res_b` | st_residential | — |

Conditional fields: when `res_citizen` is checked, row (b) label becomes **"b) Stayed in India for at least 120 days in the PY and at least 365 days in 4 years preceding the PY?"** and its section tag becomes **"6 (6)(c)"** (`toggleResB`, itr2.html:1236-1242; UI-verified).

### Group: ITR Information — sub-heading "ITR filing info."

### Particular: "Section under which return is filed"   [inline — no drill-in]
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Section under which return is filed | select | 139(1) — On or before due date · 139(4) — Belated return · 139(5) — Revised return · 139(9) — Response to defective · 142(1) — In response to notice | — | "?" tooltip: "139(1) = on or before due date" | 139(1) | — | — | — | `f_section` | rail `r_sec`; **not** exported (JSON `ReturnFileSec:11` fixed) | — |

### Particular: "Return Type"   [inline — no drill-in]
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Return Type | select | Original · Revised | — | — | Original | — | — | — | `f_rettype` | not exported | — |

### Particular: "Representative Assessee, if any"   [click ⋯ → opens: sf-repassessee]
#### Drill-in: Representative Assessee, if any (source: itr2.html:524-538)
Note: "Fill only if a representative (e.g. legal heir, guardian) is filing on behalf of the assessee."
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Name | text | — | — | — | empty | — | — | — | `rep_name` | st_repassessee | — |
| e-Mail ID | text | — | — | — | empty | — | — | — | `rep_email` | — | — |
| Contact No. | text | — | — | — | empty | — | — | — | `rep_contact` | JSON addr fallback `MobileNo` | — |
| Country code (for Contact No.) | text | — | — | — | 91 | — | — | — | `rep_cc` | — | — |
| Assessee Deceased? | Yes/No tabs | Yes · No | — | — | No | — | — | — | `data.flags.rep_deceased` | not exported | — |

### Group: ITR Information — sub-heading "Income related info."

### Particular: "Pass Through Income u/s 115U/ 115UA/ 115UB"   [click ⋯ → opens: sf-pti]  Sch. tag: **PTI**
#### Drill-in: Pass Through Income u/s 115U/ 115UA/ 115UB (source: itr2.html:665-676)
Meta "A.Y. 2026-27 · Schedule PTI" · note: "Report income passed through from a Business Trust (115UA) or Investment Fund (115UB). Enter one row per head of income for each fund." · Buttons: **"✓ Done"**, **"+ Add row"** (`addPtiBtn`).
Grids: section "Pass Through Income entries" — headers verbatim: **Investment entity covered u/s | Name of business trust / investment fund | PAN of the business trust / investment fund | Head of income | Amount of income | TDS on such amount, if any | (remove)**. Per-row fields: entity (select: **(Select) · 115UA — Business Trust · 115UB — Investment Fund**), name (text, placeholder "Name of trust / fund"), PAN (text, uppercase, placeholder "ABCDE1234F"), head (select: **(Select) · Salary · House Property · Business/Profession · Capital Gains · Other Sources · Exempt**), income (text/number), tds (text/number). Row remove **✕**; 1..n rows.
Totals: "Total income **₹0**" (⚙ `pti_income_total` = Σ income) · "Total TDS **₹0**" (⚙ `pti_tds_total` = Σ tds). Feeds: st_pti count only — not exported to JSON.

### Particular: "Income of Other persons included in computation"   [click ⋯ → opens: sf-spi]  Sch. tag: **SPI**
#### Drill-in: Income of Other persons included in computation (source: itr2.html:572-587)
Meta "A.Y. 2026-27 · Schedule SPI" · note: "^ Details for these items entered under the head 'Income from other sources' and 'House Property' in Computation window will be directly taken to ITR."
Grids: two identical grids — sections **"Minor children's income ^"** (+ Add row `addSpiMinorBtn`) and **"Income of other persons ^"** (+ Add row `addSpiOtherBtn`). Headers verbatim: **Name | PAN / Aadhaar No. (optional) | Relationship | Head of income | Amount | (remove)**. Per-row: Name (text), PAN (text, placeholder "optional"), Relationship (text), Head (select — same 7 HEADS options as PTI), Amount (text/number), ✕ remove; each grid 1..n.
Totals: "Total income of other persons **₹0**" (⚙ `spi_total` = Σ both grids). Feeds: st_spi person count — not exported to JSON.

### Group: ITR Information — sub-heading "Other info."

### Particular: "Partner in a Firm during the PY?"   [inline Yes/No tabs]
Yes/No tabs (`data-fld="partner"`), default **No**. Binds `data.flags.partner`. No conditional row, not exported.

### Particular: "Held Unlisted Shares in the PY?"   [inline Yes/No tabs]
Yes/No tabs (`data-fld="unlisted"`), default **No**. Conditional: choosing **Yes** reveals indented row **"Unlisted Equity Shares"** (`row-unlisted`, itr2.html:361; UI-verified).

### Particular: "Unlisted Equity Shares"   [conditional row; click ⋯ → opens: sf-unlisted]
#### Drill-in: Unlisted Equity Shares (source: itr2.html:650-661)
Meta "A.Y. 2026-27 · shares held in unlisted companies" · note: "Add each company and click Edit for its full share movement. If PAN of the unlisted company is not available, enter **NNNNN0000N**. For a foreign company, PAN is not required." · Buttons: **"✓ Done"**, **"+ Add company"** (`add_unlisted_Btn`).
Grids: summary list — headers verbatim: **Name of Company | PAN | Opening Qty | Closing Qty | Details | (remove)**; per row **"Edit ✎"** button opens the shared detail popup, **✕** removes. Footer "Companies **0**" (⚙ `unlisted_count`).
##### Sub-drill-in: Unlisted Equity Shares — entry N (shared popup `sf-detail`, spec `UNLISTED_SPEC`, itr2.html:1113-1118; popup shell itr2.html:897-901)
Section groups & fields (14): **Company** — Name of Company (text wide) · Type of Company (select: **(Select) · Domestic Company · Foreign Company**) · PAN (enter NNNNN0000N if unavailable; not required for foreign co.) (text wide). **Opening balance** — No. of shares (num) · Cost of acquisition (num). **Shares acquired during the year** — No. of shares (num) · Date of subscription / purchase (date DD/MM/YYYY) · Face value per share (num) · Issue price per share (for fresh issue) (num) · Purchase price per share (from existing shareholder) (num). **Shares transferred during the year** — No. of shares (num) · Sale consideration (num). **Closing balance** — No. of shares (num) · Cost of acquisition (num). Button **"✓ Done"**. Not exported to JSON (JSON `HeldUnlistedEqShrPrYrFlg:'N'` fixed).

### Particular: "Director in a company during the PY?"   [inline Yes/No tabs]
Yes/No tabs (`data-fld="director"`), default **No**. Conditional: **Yes** reveals indented row **"Directorship info."** (`row-directorship`, itr2.html:364; UI-verified).

### Particular: "Directorship info."   [conditional row; click ⋯ → opens: sf-directorship]
#### Drill-in: Directorship info. (source: itr2.html:638-649)
Meta "A.Y. 2026-27 · companies in which the assessee is a director" · note: "Add each company. Click Edit to enter its details." · Buttons: **"✓ Done"**, **"+ Add company"** (`add_director_Btn`).
Grids: summary list — headers verbatim: **Name of the Company | DIN | Shares listed? | Details | (remove)**; per row **"Edit ✎"** + **✕**. Footer "Companies **0**" (⚙ `director_count`).
##### Sub-drill-in: Directorship info. — entry N (shared popup `sf-detail`, spec `DIRECTOR_SPEC`, itr2.html:1111-1112)
Group **Company** (5 fields): Director Identification No.(DIN) (text) · Name of the Company (text wide) · Type of Company (select: (Select) · Domestic Company · Foreign Company) · PAN (text, placeholder ABCDE1234F, uppercase) · Whether shares are listed? (select: **(Select) · Listed · Unlisted**). Not exported to JSON.

### Particular: "Tax deferred on Sweat Equity Shares / Securities - B/F"   [click ⋯ → opens: sf-esop]  Sch. tag: **ESOP**
#### Drill-in: Tax deferred on Sweat Equity Shares / Securities - B/F (source: itr2.html:592-616)
Meta "A.Y. 2026-27 · deferred tax on eligible start-up ESOP".
Section "Employer (Startup) details:" — **PAN** (`esr_pan`, text uppercase) · **DPIIT registration No.** (`esr_dpiit`, text).
Grids: section "Year-wise deferred tax" — headers verbatim: **Assessment Year | Tax deferred - B/F | Tax attributed to sale | Date of Cessation of Employment, if any | Tax payable in CY | Balance Tax C/F**. Fixed rows for AYs **2021-22 · 2022-23 · 2023-24 · 2024-25 · 2025-26** (no add/remove); per row: bf (num), sale (num), cess-date (date DD/MM/YYYY), cy (num), **Balance Tax C/F** ⚙ = max(0, bf − sale − cy). Totals row "Total": ⚙ `esop_bf_tot`/`esop_sale_tot`/`esop_cy_tot`/`esop_cf_tot` (column sums; UI-verified 100000−20000−30000 → 50,000).
Conditional fields: checkbox **"Details of tax attributable to Sweat Equity Shares/Securities sold"** (`esop_sold_chk`) reveals grid `esop_sold_wrap` — headers: **Assessment Year in which Tax deferred | Date of Sale | Tax attributed to Sale | (remove)** with **"+ Add row"** (`addEsopSoldBtn`); per-row ay (text, placeholder "2023-24"), date (date), tax (num). Feeds: st_esop ("Entered" when PAN set or B/F total > 0) — not exported to JSON. AY diff: fixed AY row list is identical in both files (see AY section).

### Particular: "Other Forms filed"   [click ⋯ → opens: sf-otherforms]
#### Drill-in: Other Forms filed (source: itr2.html:619-635)
Meta "A.Y. 2026-27 · Form 10-IEA & Tax Return Preparer".
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Opted out of 115BAC by filing Form 10-IEA within due date in earlier year? | select | Yes · No · NA (without business) | — | — | Yes | — | — | drives variant block | `ofr_optearlier` | st_otherforms | — |
| AY in which opted out | text | — | 2024-25 | — | empty | — | — | shown when opt = "Yes" | `ofr_ay` | st_otherforms | — |
| Acknowledgment no. of Form 10-IEA | text | — | — | — | empty | — | — | shown when opt = "Yes" | `ofr_ack` | — | — |
| Date of upload of Form 10-IEA | text | — | DD/MM/YYYY | under sub-row "Opting out of 115BAC in CY (10-IEA filed within due date):" | empty | — | fmtDate | shown when opt = "No" or "NA (without business)" | `ofr_iea_date` | — | — |
| Acknowledgment no. of Form 10-IEA | text | — | — | same sub-row | empty | — | — | shown when opt = "No"/"NA" | `ofr_iea_ack` | — | — |
| Tax Return Preparer (TRP) info., if any | checkbox | — | — | — | unchecked | — | — | — | `ofr_trp_chk` | — | — |
| ID No. | text | — | — | — | empty | — | — | — | `ofr_trp_id` | st_otherforms | — |
| Name | text | — | — | — | empty | — | — | — | `ofr_trp_name` | — | — |
| Reimbursement amount | text (num) | — | — | — | empty | — | — | — | `ofr_trp_amt` | — | — |

Conditional fields UI-verified: opt "Yes" → variant shows "AY in which opted out / Acknowledgment no. of Form 10-IEA"; "No"/"NA" → "Opting out of 115BAC in CY (10-IEA filed within due date): Date of upload of Form 10-IEA / Acknowledgment no. of Form 10-IEA". Note: JSON `OptOutNewTaxRegime` is derived from the calculator's regime toggle, not from this drill-in.

### Group heading: "Foreign Assets & Incomes"  (badge **FA**, itr2.html:370-386)

### Particular: "Having Foreign assets and Income or Signing authority in Foreign a/c?^"   [inline checkbox `f_hasFA`]
Conditional: checking reveals `fa-wrap` with the 9 FA rows below (UI-verified). Footnotes under the group: "^Enter all items held (including any beneficial interest) at any time during the calendar year 2025." and "Note: If the ZIP code is not available, enter 'XXXXXX'."

All 9 FA drill-ins share the same shell: meta "A.Y. 2026-27 · Schedule FA · items held during calendar year 2025" · note: "Report items held at any time during calendar year 2025. Click **Edit** on a row to enter its full details. If ZIP code is unavailable, enter **XXXXXX**. All amounts in ₹." · Buttons **"✓ Done"**, **"+ Add entry"** (`add_{key}_Btn`) · summary grid with per-row **"Edit ✎"** (opens `sf-fa-detail` popup titled "{schedule} — entry N") and **✕** · footer "Entries **0**" (⚙ `{key}_count`). Every "Country" field is a select with options: **(Select) · United States · United Kingdom · United Arab Emirates · Singapore · Canada · Australia · Germany · Switzerland · Netherlands · Hong Kong · Japan · Mauritius · Other**. Date fields append "(DD/MM/YYYY)" and auto-format; ZIP placeholder "XXXXXX". None of Schedule FA is exported to JSON (`AssetOutIndiaFlag:'N'` fixed).

### Particular: "Foreign Depository / Custodial accounts"   [click ⋯ → opens: sf-fa_depository]
#### Drill-in: Foreign Depository / Custodial accounts (source: itr2.html:680-691; detail spec itr2.html:959)
Grids: summary headers **Country | Institution | Peak Balance (₹) | Details | (remove)**.
Detail groups/fields (12): **Location & Institution** — Country (sel) · Institution name · Institution address (wide) · ZIP code. **Account** — Account Type · Account Number · Ownership · Account opening date (date). **Balances & Income (₹)** — Peak Balance during the year (n) · Closing balance (n) · Gross Income received (n) · Nature of Income. (UI-verified labels.)

### Particular: "Investments in Foreign Equity / Debts"   [click ⋯ → opens: sf-fa_equity]
#### Drill-in: Investments in Foreign Equity / Debts (source: itr2.html:692-703; spec itr2.html:960)
Grids: **Country | Entity | Closing value (₹) | Details | (remove)**.
Detail groups/fields (11): **Entity** — Country (sel) · Entity name · Entity address (wide) · ZIP code · Nature · Date of acquiring interest (date). **Value of Investment (₹)** — Initial value (n) · Peak value (n) · Closing value (n). **Income (₹)** — Gross Income received (n) · Proceeds from Sale / Redemption (n).

### Particular: "Surrender value of Foreign Insurance / Annuity Contract"   [click ⋯ → opens: sf-fa_insurance]
#### Drill-in: Surrender value of Foreign Insurance / Annuity Contract (source: itr2.html:704-715; spec itr2.html:961)
Grids: **Country | Institution | Surrender value (₹) | Details | (remove)**.
Detail groups/fields (7): **Institution** — Country (sel) · Institution name · Institution address (wide) · ZIP code · Date of contract (date). **Values (₹)** — Surrender value of contract (n) · Gross Income received (n).

### Particular: "Financial Interest in any Entity"   [click ⋯ → opens: sf-fa_interest]
#### Drill-in: Financial Interest in any Entity (source: itr2.html:716-727; spec itr2.html:962)
Grids: **Country | Entity | Total Investment (₹) | Details | (remove)**.
Detail groups/fields (13): **Entity** — Country (sel) · ZIP code · Nature of Entity · Name of the Entity · Address of the Entity (wide) · Ownership · Date since held (date). **Investment & Income (₹)** — Total Investment (n) · Income accrued (n) · Nature of Income. **Income offered in this return** — Taxable Income (₹) (n) · Schedule of ITR · Item No. of schedule.

### Particular: "Immovable Property"   [click ⋯ → opens: sf-fa_immovable]
#### Drill-in: Immovable Property (source: itr2.html:728-739; spec itr2.html:963)
Grids: **Country | Property | Total Investment (₹) | Details | (remove)**.
Detail groups/fields (11): **Property** — Country (sel) · ZIP code · Property address (wide) · Ownership · Acquisition date (date). **Investment & Income (₹)** — Total Investment (n) · Income (n) · Nature of Income. **Income offered in this return** — Taxable Income (₹) (n) · Schedule of ITR · Item No. of schedule.

### Particular: "Other Capital Assets"   [click ⋯ → opens: sf-fa_othercap]
#### Drill-in: Other Capital Assets (source: itr2.html:740-751; spec itr2.html:964)
Grids: **Country | Asset | Total Investment (₹) | Details | (remove)**.
Detail groups/fields (11): **Asset** — Country (sel) · ZIP code · Nature of asset · Ownership · Acquisition date (date). **Investment & Income (₹)** — Total Investment (n) · Income (n) · Nature of Income. **Income offered in this return** — Taxable Income (₹) (n) · Schedule of ITR · Item No. of schedule.

### Particular: "Account in which Assessee is signing authority (not included above)"   [click ⋯ → opens: sf-fa_signing]
#### Drill-in: Account in which Assessee is signing authority (source: itr2.html:752-763; spec itr2.html:965)
Grids: **Country | Institution | Peak Balance (₹) | Details | (remove)**.
Detail groups/fields (11): **Institution** — Institution name · Institution address (wide) · Country (sel) · ZIP code. **Account** — Account holder name · Account Number · Peak Balance (₹) (n) · Income accrued (if liable to tax) (₹) (n). **Income offered in this return** — Taxable Income (₹) (n) · Schedule of ITR · Item No. of schedule.

### Particular: "Trusts in which Assessee is a Trustee / Beneficiary / Settlor"   [click ⋯ → opens: sf-fa_trusts]
#### Drill-in: Trusts (Trustee / Beneficiary / Settlor) (source: itr2.html:764-775; spec itr2.html:966)
Grids: **Country | Trust | Income derived (₹) | Details | (remove)**.
Detail groups/fields (15): **Trust** — Country (sel) · ZIP code · Trust name · Trust address (wide). **Trustees** — Trustee name · Trustee address (wide). **Settlor** — Settlor name · Settlor address (wide). **Beneficiaries** — Beneficiary name · Beneficiary address (wide). **Position & Income** — Position held since (date) · Income derived (if liable to tax) (₹) (n). **Income offered in this return** — Taxable Income (₹) (n) · Schedule of ITR · Item No. of schedule.

### Particular: "Other income not included above"   [click ⋯ → opens: sf-fa_otherincome]
#### Drill-in: Other income not included above or in Sch. BP (source: itr2.html:776-787; spec itr2.html:967)
Grids: **Country | Person | Income derived (₹) | Details | (remove)**.
Detail groups/fields (9): **Source** — Country (sel) · ZIP code · Person from whom income derived — Name (wide) · Address (wide) · Income derived (₹) (n) · Nature of Income. **Income offered in this return** — Taxable Income (₹) (n) · Schedule of ITR · Item No. of schedule.
Discrepancy note: the row label on the master sheet is "Other income not included above" (itr2.html:382) while the popup h2 is "Other income not included above or in Sch. BP" — "Sch. BP" is an ITR-3/4 leftover (ITR-2 has no Schedule BP).

### Group heading: "Assets / Liabilities^"  (badge **AL**, itr2.html:389-407)

### Particular: "Having Assets and Liabilities? (if total income > Rs. 1 crore)"   [inline checkbox `f_hasAL`]
Conditional: checking reveals `al-wrap` (UI-verified). Group footnote: "^ Details of Assets/ Liabilities are compulsory where Total Income > Rs.1 crore. In case value of an item is 'NIL', please enter '0'." Column caption (right-aligned, maroon): **"Cost at the end of FY (₹)"**.
Rows (in order): **Do you own any Immovable asset ?** (inline num input, `data-al="al_immovable"`, placeholder 0) · **Bank Balances & deposits** ⋯ (⚙ `al_bank_cv`) · **Shares and Securities** ⋯ (⚙ `al_shares_cv`) · **Insurance policies** ⋯ (⚙ `al_insurance_cv`) · **Loans and Advances** ⋯ (⚙ `al_loans_cv`) · **Cash in hand** (inline num input, `data-al="al_cash"`) · **Jewellery, bullion etc.** ⋯ (⚙ `al_jewellery_cv`) · **Paintings / Artwork etc.** ⋯ (⚙ `al_paintings_cv`) · **Vehicles / Boats etc.** ⋯ (⚙ `al_vehicles_cv`) · **Total** (⚙ `al_total` = al_immovable + bank + shares + insurance + loans + al_cash + jewellery + paintings + vehicles; UI-verified 10,00,000 + 50,000 → 10,50,000) · **Liabilities relating to the above assets** ⋯ (⚙ `al_liab_cv`; NOT included in Total).

### Particular: "Bank Balances & deposits" (AL)   [click ⋯ → opens: sf-al_bank]
#### Drill-in: Bank Balances & deposits (source: itr2.html:794-803)
Meta "A.Y. 2026-27 · Schedule AL · cost at end of FY" · Buttons **"✓ Done"**, **"+ Add row"** (`addBk_al_bank`).
Grids: section "Break-up" — headers **Particulars | Amount | (remove)**; per-row Particulars (text, placeholder "Particulars"), Amount (num); ✕ remove; 1..n rows. Totals: "Total **₹0**" (⚙ `bk_al_bank_total` = Σ amounts) — feeds the AL row value `al_bank_cv` and AL Total + rail "Assets total". Defaults toolbar (injected once): **"⤓ Load my default particulars"** · **"★ Save these labels as my default"** · hint "no defaults saved yet"/"N default label(s) saved"; auto-fill on open when a template exists, drill is empty, and the "Auto-fill defaults" toggle is on.
The remaining 7 AL drill-ins are structurally identical (same grid, totals, defaults toolbar, feeds): **Shares and Securities** (sf-al_shares, itr2.html:804) · **Insurance policies** (sf-al_insurance, :814) · **Loans and Advances** (sf-al_loans, :824) · **Jewellery, bullion etc.** (sf-al_jewellery, :834) · **Paintings / Artwork etc.** (sf-al_paintings, :844) · **Vehicles / Boats etc.** (sf-al_vehicles, :854) · **Liabilities relating to the above assets** (sf-al_liab, :864). Schedule AL is not exported to JSON.

---

## Screen: Computation of Income (tab, `pane-comp`, itr2.html:412-414)

The tab hosts the shared **"Tax Computation · Master Calculator · AY 2026-27"** in an iframe (`calcFrame`), injected from the inline `calc-html` script block (itr2.html:2245-12502). **Not extracted here — the shared Computation Sheet is mapped by a separate agent.** The calculator is byte-identical to the one embedded in ITR-1 except for the ITR-2-specific deltas below (full-file diff produced exactly these).

### ITR-2-specific computation additions (calc "Capital Gains" group, itr2.html:2494-2501)
Four rows that are `display:none` in ITR-1's copy are visible in ITR-2 (UI-verified visible + openable):
- **"LTCG-1:"** ⋯ → drill-in **Long Term Capital Gains** (`sf-ltcg`, itr2.html:2923) — multi-entry cards via **"+ Add LTCG entry"**; note steers 112A cases to the dedicated row; asset categories: Land / Non-residential building · Residential House Property · Shares / Debentures / Units / Bonds (9 sub-types incl. 115ACA(1)(b), Buy back u/s 46A, Listed not-112A, Listed 112A, Listed MF, EOF not-112A, Unlisted debentures, Unlisted shares, Unlisted units of BT/MF) · Gains u/s 45(2)/50B/115E(b)/115U/115UB/115BBH/Deemed · Any other asset (itr2.html:7880-7906). Total: "Total Net LTCG" ⚙ `sf_ltcg_total` → master cell `it_cg_ltcg1`.
- **"Long Term Capital Gain u/s 112A"** ⋯ → drill-in `sf-ltcg112a` (itr2.html:2945; visible in ITR-1 too) — scrip-wise grid, headers verbatim: **Quantity | Date of transfer | Sale consideration | Selling expenses | Net sale consideration | Actual Cost of Acquisition | Pre-01/02/18? | FMV u/s 55(2)(ac) per share/unit | Total FMV | Cost of Acquisition deductible | LTCG | ISIN code | (remove)**; **"+ Add row"**; grandfathering note (₹1,25,000 exemption, 12.5%); conditional **"Claiming Exemption u/s 54F?"** checkbox reveals 54F block (Date of transfer of original asset, Net sale consideration, Capital Gain (per 112A table above) ⚙, Invested Date, Invested amount, CG scheme deposit, CG scheme — Account Number, CG scheme — IFSC, Exempt Amount (auto: capped at CG) ⚙). Totals: "Total LTCG u/s 112A" ⚙ `ltcg112a_total` · "Net LTCG (after 54F exemption)" ⚙ `ltcg112a_net` → master cell `it_cg_112a`.
- **"Long-term Capital gain from Auto-classification table"** — ⚙ read-only cell `it_cg_ltauto` (no drill).
- **"STCG-1:"** ⋯ → drill-in **Short Term Capital Gains** (`sf-stcg`, itr2.html:2934) — multi-entry via **"+ Add STCG entry"**; note: "STCG on listed equity STT-paid (u/s 111A) is taxed at 20%; VDA (u/s 115BBH) at 30%; other STCG added to slab income."; categories: Immovable property · Shares/Debentures/Units/Bonds (50AA MLD, Buy back 46A, Listed not-111A, Listed 111A, Unlisted) · Gains u/s 50B/115U/115UB/115BBH/Deemed/Depreciable · Any other asset (itr2.html:7907-7926). Total "Total Net STCG" ⚙ `sf_stcg_total` → `it_cg_stcg1`.
- **"Auto-classification of STCG / LTCG"** ⋯ → drill-in `sf-auto-cg` (itr2.html:3004) — three sections: **"1. STT-paid shares / Units of EOF / Business Trust (STCG u/s 111A & LTCG u/s 112A)"** (grid: Quantity | Date Purchase | Date Transfer | Is LTCG? | Sale consideration | Selling Expenses | Net Sale | Actual cost | Pre-01/02/18? | FMV u/s 55(2)(ac) per share | Total FMV | Cost deductible | STCG u/s 111A | LTCG u/s 112A | ISIN, + 54F option) · **"2. Units of MF (except EOF) — auto-classify into STCG / LTCG"** (adds "Loss ignored u/s 94(7)/(8)" column, + 54F option) · **"3. Virtual Digital Asset u/s 115BBH"** (Date Purchase | Date Transfer | Sale consideration | Cost of Acquisition | Income (loss ignored) | Head of Income). "Is LTCG?" auto-fills from holding period (>12m listed / >24m MF), user-overridable. Net → `it_cg_auto` (STCG side) and `it_cg_ltauto` (LTCG side).

Other ITR-2 delta inside the calc: the Business/Profession head is hidden (group `g-bp` display:none — UI-verified), matching "no business income" in ITR-2; and ITR-1's `window.__taxBreakup` exposure block is **absent** in ITR-2's calc (see Discrepancy 2).

---

## Screen: Tax Summary & Filing (tab, `pane-summary`, itr2.html:417-444)

### Particular: "Statement of Total Income & Tax" (card)
All cells ⚙ computed from the calculator via `refreshSummary()` (itr2.html:1768-1786), refreshed on tab switch, window focus, and a 1.5s interval:
**Income from Salaries** (`sm_salary` ← `it_sal_total`) · **Income from House Property** (`sm_hp` ← max(0,`it_hp_income`)) · **Income from Other Sources** (`sm_os` ← interest+dividend+family pension+other+winnings) · **Income from Capital Gains** (`sm_ltcg` ← `it_cg_112a` only — see Discrepancy 1) · **Gross Total Income** (`sm_gti` = salary+hp+os+ltcg) · **Less: Deductions under Chapter VI-A** (`sm_ded` ← `it_80_total`) · **Total Income** (`sm_ti` ← `it_totalIncome`) · **Tax on Total Income (after rebate, cess, relief)** (`sm_tax` ← `it_taxOnTI`) · **Less: TDS / TCS / Advance Tax / SAT** (`sm_prepaid` = max(0, tax−balance)) · **Balance Tax Payable** / **Refund Due** (`sm_bal_row` label flips on sign; `sm_bal` = |`it_balancePayable`|).
Card note: "Figures are computed live on the Computation tab. Switch there to enter income details. ITR-2 supports multiple employers, multiple house properties and full capital gains."

### Particular: "Validation" (card)
Placeholder: "Click \"Export ITR JSON\" to run validation checks." Populated by `validateItr2()` (itr2.html:2044-2058): errors — PAN format, Name required; warnings — DOB format, refund-due-without-IFSC-bank ("Refund due but no bank account with IFSC entered — add one for the refund to be credited."), calculator-not-opened ("Open the Computation tab at least once so tax figures are available."). Footer "N error(s), N warning(s)". 0 errors → JSON auto-downloads (UI-verified error set on empty form). Source comments note: no ₹50L cap and no 112A cap for ITR-2; business head cannot arise.

### Particular: "AIS Import Preview" (card, hidden until an AIS file parses)
Rows: **PAN in AIS · Financial Year · Salary (gross) · Salary TDS · Interest income · Dividend income · Total TDS · Advance Tax · Self-Assessment Tax**; PAN-mismatch warning: "AIS PAN (X) differs from the PAN entered (Y). Check you're importing the right taxpayer's AIS." Buttons: **"Fill into Computation"** (pushes into calc master inputs, stashes `window.__aisData` for the TDS schedules in export, jumps to Computation tab) · **"Cancel"**. CSV parsed directly; PDF decoded in-browser via embedded PDF.js (script blocks itr2.html:2185-2244), password auto-derived as PAN-lowercase+DDMMYYYY with `window.prompt` fallback.

---

## Panel: Manage Default Particulars (⚙ Defaults → `sf-defaults`, itr2.html:876-894)

Meta: "Reusable label templates · saved on this machine · amounts are never stored". Storage warning (shown when localStorage blocked): "⚠ Browser storage is blocked in this preview, so templates last only for this session. When you download and open this file locally, they will be saved permanently on your machine."
Toggle: **"Auto-fill defaults when a break-up opens empty"** (`def_autofill_chk`, default on). Buttons: **"⭳ Export templates (.json)"** · **"⭱ Import templates"** (file input, .json) · **"Clear all templates"** (danger) · **"✓ Done"**. Note: "Enter one label per line for each break-up you use often (e.g. under Direct Expenses: Freight, Loading & unloading, Octroi). Leave a line blank to skip it."
Grid: one group "Assets & Liabilities" ("N of 8 have defaults") with a 2-row textarea per AL break-up key (al_bank, al_shares, al_insurance, al_loans, al_jewellery, al_paintings, al_vehicles, al_liab), placeholder "One label per line…", live-saved to localStorage keys `itr2_default_particulars_v1` / `itr2_autofill_particulars_v1`.

---

## JSON export map — comp lines the form feeds (`buildItr2Json`, itr2.html:2069-2178)

Calculator cells read at export: `it_sal_total` → `PartB-TI.Salaries`; `it_hp_income` → `IncomeFromHP`; `it_os_interest`+`it_os_dividend`+`it_os_familypension`+`it_os_other` → `IncFromOS.OtherSrcThanOwnRaceHorse`; `it_os_winnings` → `IncChargblSplRate`; `it_cg_112a`+`it_cg_ltcg1`+`it_cg_ltauto` → LTCG (`LongTerm12_5Per`); `it_cg_stcg1`+`it_cg_auto` → STCG (`ShortTermAppRate`); `it_80_total` → `DeductionsUnderScheduleVIA`; `it_totalIncome` → `TotalIncome`/`AggregateIncome`; `it_taxOnTI` → Part B-TTI tax figures; `it_balancePayable` → prepaid split (AdvanceTax/SAT from AIS import, remainder TDS) and `Refund.RefundDue`; regime from calc `it_regime` → `OptOutNewTaxRegime`. Emitted nodes: CreationInfo, Form_ITR2, PartA_GEN1, ScheduleCYLA, ScheduleBFLA, PartB-TI, PartB_TTI, Verification, plus TDSonSalaries/TDSonOthThanSals only when AIS was imported.

---

## AY 2025-26 vs 2026-27 differences (itr2.html vs itr2-2025-26.html; 530-line diff, substitutions only)

1. All "A.Y. 2026-27" chrome/meta labels, both `<title>`s, calc title, and FA-detail meta → "A.Y. 2025-26".
2. Export: filename `{PAN}_2025-26_ITR2.json`; `Form_ITR2.AssessmentYear:'2025'`, `SchemaVer:'Ver1.0'` (2026-27: `'2026'`, `'Ver1.1'`); `ItrFilingDueDate:'2025-09-15'` (2026-27: `'2026-07-31'`).
3. Schema buckets: 2025-26 CYLA/BFLA/PartB-TI carry extra rate buckets `STCG15Per`, `LTCG10Per`, `LTCG20Per` alongside `STCG20Per`/`LTCG12_5Per` (post-23-07-2024 split-rate year); 2026-27 drops the 15%/10%/20% buckets.
4. New-regime slabs (calc): 2026-27 `0/4L/8L/12L/16L/20L/24L` at 0/.05/.1/.15/.2/.25/.3 with 87A rebate ≤ ₹12,00,000 capped ₹60,000; 2025-26 `0/3L/7L/10L/12L/15L` at 0/.05/.1/.15/.2/.3 with 87A ≤ ₹7,00,000 capped ₹25,000.
5. CFL/loss tables: AY column headers `2026-27 | 2025-26 | 2024-25 | 2023-24` → `2025-26 | 2025-26 | 2024-25 | 2023-24` (sic — first two columns both read "2025-26" in the 2025-26 file, 4 occurrences); 8-year loss comments AY-shifted; due-date logic comment "AY 2025-26".
6. Unchanged in the 2025-26 copy (flagged as discrepancies below): Schedule FA "calendar year 2025" notes, ESOP fixed AY list `2021-22…2025-26`, ITR-1-style hidden-row deltas.

---

## Discrepancy notes

1. **Summary CG understated:** Summary tab "Income from Capital Gains" (`sm_ltcg`) and its GTI read only `it_cg_112a` (itr2.html:1773-1776), while `buildItr2Json` sums all five CG cells (112a+ltcg1+ltauto+stcg1+auto, itr2.html:2081-2082). LTCG-1/STCG entries show in the exported JSON but not in the on-screen Statement.
2. **Part B-TTI zeros:** ITR-1's calc exposes `window.__taxBreakup` (rebate/surcharge/cess/234 interest); that block is absent from ITR-2's calc (only calc diff besides the CG rows), so `buildItr2Json` hard-codes `Surcharge:0, HealthEduCess:0, EducationCess:0, Rebate87A:0, TaxAtSpecialRates:0`, all 234A/B/C interest 0.
3. **Info-screen data largely not exported:** Schedule FA, AL, SPI, PTI, ESOP, Directorship, Unlisted shares, Residential-status ticks, 10-IEA/TRP details, `f_section`, `f_rettype`, and the partner/deceased flags are captured in `data` but never emitted; JSON hard-codes `ReturnFileSec:11`, `ResidentialStatus:'RES'`, `HeldUnlistedEqShrPrYrFlg:'N'`, `AsseseeRepFlg:'N'`, `AssetOutIndiaFlag:'N'`, `SeventhProvisio139:'N'`, `Capacity:'S'`.
4. **ITR-3 leftovers in the ITR-2 file:** template export writes `_type:'itr3-default-particulars'` and downloads `itr3-particulars-templates.json` (itr2.html:1082-1085); `BREAKUP_TITLES`/`FIXED_BREAKUP` still define B/S & P&L keys (bs_*, pl_* incl. F&O/Intraday); dead renderers/state for grids with no ITR-2 DOM (`renderGstr`, `renderCeDeposit` (92CE), `renderNature`, `renderAlFirm`, `sf-44ab` branch); assessee popup keeps the ITR-3 Sec.44AA field; `sf-fa_otherincome` h2 mentions "Sch. BP".
5. **AY 2025-26 copy not fully re-based:** FA notes still say "calendar year 2025" (expected 2024 for AY 2025-26); ESOP year-wise grid still lists AYs 2021-22…2025-26 (unshifted); CFL header repeats "2025-26" twice (see AY diff item 5).
6. **Stale comment:** itr2.html:305-306 says "ITR INFO (ITR-2 has a single section, no tabs)" yet the page has a 3-tab bar.
7. **SPI/PTI "Head of income" options include "Business/Profession"** although ITR-2 excludes business income (calc business head hidden).
8. UI-walk: automation fully succeeded (msedge via Playwright); zero page errors; all 28 info-pane drill-ins opened with matching titles; all conditional reveals behaved as documented.

---

## PROOF — coverage re-walk

Info-pane particulars (29): Assessee info. ✓ · Verifier info. ✓ · Bank Accounts ✓ · Residential status info. ✓ · Section under which return is filed ✓ · Return Type ✓ · Representative Assessee, if any ✓ · Pass Through Income u/s 115U/ 115UA/ 115UB ✓ · Income of Other persons included in computation ✓ · Partner in a Firm during the PY? ✓ · Held Unlisted Shares in the PY? ✓ · Unlisted Equity Shares ✓ · Director in a company during the PY? ✓ · Directorship info. ✓ · Tax deferred on Sweat Equity Shares / Securities - B/F ✓ · Other Forms filed ✓ · Having Foreign assets…? ✓ · 9 FA rows ✓✓✓✓✓✓✓✓✓ · Having Assets and Liabilities? ✓ · 11 AL rows (2 inline + 8 drills + Total) ✓ · plus chrome (client bar, tabs, rail), Summary cards, Defaults panel, and the 5 ITR-2 CG computation rows ✓.
Drill-ins documented: 28 openable subforms + 2 shared detail popups (`sf-detail`, `sf-fa-detail`) + Defaults panel = **31**, plus 4 ITR-2-specific calc drill-ins listed (not fully extracted — shared sheet).
