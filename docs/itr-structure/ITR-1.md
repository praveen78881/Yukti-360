# ITR-1 — COMPLETE STRUCTURE MAP

Route(s): `/company/[id]/income-tax` (Income-tax hub → ITR workspace; ITR-1 tab shown for entity types `individual` and `huf`) · Entry component: `src/app/company/[id]/income-tax/page.tsx:46` (`itrSrc()` maps AY→file), `:52` (`ITR_META.itr1` = label "ITR-1 Sahaj", note "Salary, one house property & other sources (income ≤ ₹50L)"), `:63-65` (`ENTITY_FORMS`: `individual: ['itr1','itr2']`, `huf: ['itr2','itr3','itr4']`), `:414-416` (lazy-mounted same-origin `<iframe src={itrSrc(ay, key)}>`) · AYs covered: 2025-26 (`public/tax-utilities/itr1-2025-26.html`), 2026-27 (`public/tax-utilities/itr1.html`)

UI-walk: performed with Playwright (msedge channel) against `http://localhost:7777/tax-utilities/itr1.html` and `.../itr1-2025-26.html`. Both load with **zero page errors**; every drill-in listed below was clicked open and every conditional toggle exercised. Source line numbers below refer to `itr1.html` (AY 2026-27); the 2025-26 file is line-shifted by ≤ 25 lines with identical structure except the AY-diff column notes.

Architecture: one self-contained HTML per AY. The outer document is the **Data Entry** shell (3 main tabs). The **Computation of Income** tab injects a second full HTML document (stored inline in `<script type="text/plain" id="calc-html">`, itr1.html:2046) into `<iframe id="calcFrame">` via `srcdoc` (`injectCalculator()`, itr1.html:1567-1578). The client bar (Name/PAN/DOB/Status) is synced into the calc frame (`syncClientToCalc()`, itr1.html:1581). The **Tax Summary & Filing** tab reads computed cells back out of the frame (`refreshSummary()`, itr1.html:1592).

Key functions: `buildItr1Json()` itr1.html:1909 (2025-26: :1909) · `validateItr1()` itr1.html:1881 · export handler itr1.html:1867 · calc-frame `computeAll()` itr1.html:12145 · `window.__taxBreakup` itr1.html:12278 (2026-27 only).

Column key for field tables: **Label** (verbatim) | **Type** | **Options** (verbatim, full) | **Placeholder** | **Helper** (tooltip/note) | **Default** | **Req** (required?) | **Validation** | **Conditional** (visibility rule) | **Binds** (DOM id / data key) | **Feeds** (computation line) | **AY diff** (2025-26 vs 2026-27). "—" = none/not applicable. ⚙ marks computed-readonly cells.

---

## Screen: ITR-1 · Data Entry — header & client bar (itr1.html:279-311)

Banner: `ITR-1 · Data Entry` + sub `For Resident Individual having Income only from Salary / One House Property / Other Sources · computed u/s 115BAC by default` + badge `A.Y. 2026-27` (2025-26 file: `A.Y. 2025-26`).

### Particular: "Client bar" (always visible; syncs into Assessee drill-in and calc frame)

| Label | Type | Options | Placeholder | Helper | Default | Req | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Name of Assessee | text | — | Full name of assessee | — | — | Yes (export) | non-empty at export | — | `cl_name` | PersonalInfo.AssesseeName; Verification | — |
| PAN | text | — | ABCDE1234F | — | — | Yes (export) | maxlength 10, uppercased, `^[A-Z]{5}\d{4}[A-Z]$` | — | `cl_pan` | PersonalInfo.PAN; JSON filename `{PAN}_2026-27_ITR1.json` | filename year 2025-26 |
| Status | dropdown | Individual · HUF | — | — | Individual | — | — | — | `cl_status` | — | — |
| Date of Birth | text | — | DD/MM/YYYY | — | — | Warn (export) | maxlength 10; `DD/MM/YYYY` else export warning "needed for correct age-based slab" | — | `cl_dob` | age → slab (calc `ageFromDOB`, age vs 2026); DOB ISO in JSON; AIS PDF password (pan lowercase+DDMMYYYY) | — |

Tab bar (itr1.html:302-311): tabs `ITR Information` · `Computation of Income` · `Tax Summary & Filing` (`switchMainTab`). Toolbar buttons: `⭳ Import AIS` (title "Import your AIS (PDF or CSV) downloaded from the income-tax portal"; opens hidden `<input type=file id="aisFileInput" accept=".pdf,.csv,application/pdf,text/csv">`) · `⭱ Export ITR JSON` (title "Validate and export the ITR JSON for portal upload"; runs `validateItr1()` then `doExportItr1()` if 0 errors).

Sticky rail (itr1.html:426-431): pills `Return section` (`r_sec` ⚙ mirrors `f_section`) · `Total Income` (`rail_ti` ⚙) · `Balance Tax` (`rail_bal` ⚙) · `Regime: New (default)` (`r_regime`).

---

## Screen: ITR-1 · Data Entry — "ITR Information" tab (`pane-info`, itr1.html:316-382)

Sub-header (italic): `(For Resident Individual having Income only from Salary / One House Property / Other Sources)`.
Group header `▾ ITR Information` (collapsible, `data-grp="g-info"`). Column header row: (blank) | (blank) | `Status / Value` | `Sch.`
Sub-group captions (`it-sub`): `Basic info.` · `ITR filing info.` · `Income related info.` · `Other info.`

### Particular: "Assessee info."   [click ⋯ → opens: Assessee info.] — status cell `st_assessee` (⚙ "Entered" when email present)
#### Drill-in: Assessee info. (source: itr1.html:440-484)
Header: h2 `Assessee info.` · meta `A.Y. 2026-27 · assessee master data` · note `Secondary address & contact auto-fill from the Permanent Info table (Tools → Settings → ITR/e-filing → Auto-fill).` Section headers: `Identity` / `Primary Address` / `Contact` / `Secondary Contact details` / `Other`.

| Label | Type | Options | Placeholder | Helper | Default | Req | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Name of Assessee | text | — | Full name as per PAN | — | ← client bar | — | — | — | `asr_name` → `data.assessee.name` (syncs back to `cl_name`) | PersonalInfo.AssesseeName (First/SurName split on space) | — |
| PAN | text | — | ABCDE1234F | — | ← client bar | — | maxlength 10, uppercase | — | `asr_pan` (syncs `cl_pan`) | PersonalInfo.PAN | — |
| Status | dropdown | Individual · HUF | — | — | ← client bar | — | — | — | `asr_status` (syncs `cl_status`) | — | — |
| Date of Birth / Incorporation (DD/MM/YYYY) | text | — | DD/MM/YYYY | format hint `(DD/MM/YYYY)` | ← client bar | — | `fmtDate` auto-slash mask, maxlength 10 | — | `asr_dob` (syncs `cl_dob`) | PersonalInfo.DOB (ISO) | — |
| Gender | dropdown | (Select) · Male · Female · Transgender | — | — | (Select) | — | — | — | `asr_gender` | — | — |
| Father's Name | text | — | — | — | — | — | — | — | `asr_father` | — | — |
| Residential Status | dropdown | Resident · Resident but Not Ordinarily Resident · Non-Resident | — | — | Resident | — | — | — | `asr_resstatus` | — | — |
| Flat / Door / Block No. | text | — | — | — | — | — | — | — | `asr_flat` | Address.ResidenceNo (fallback 'NA') | — |
| Name of Premises / Building / Village | text | — | — | — | — | — | — | — | `asr_premises` | Address.ResidenceName | — |
| Road / Street / Post Office | text | — | — | — | — | — | — | — | `asr_road` | Address.RoadOrStreet | — |
| Area / Locality | text | — | — | — | — | — | — | — | `asr_area` | Address.LocalityOrArea | — |
| Town / City | text | — | Bengaluru | — | — | — | — | — | `asr_city` | Address.CityOrTownOrDistrict; Verification.Place | — |
| State | text | — | Karnataka | — | — | — | — | — | `asr_state` | Address.StateCode (fallback '99') | — |
| Country | text | — | — | — | India | — | — | — | `asr_country` | — | — |
| PIN Code | text | — | 560001 | — | — | — | maxlength 6 | — | `asr_pin` | Address.PinCode | — |
| Mobile No. (Assessee) | text | — | 10-digit mobile | — | — | — | — | — | `asr_mobile` | Address.MobileNo | — |
| STD code | text | — | 080 | — | — | — | — | — | `asr_std` | — | — |
| Landline No. | text | — | Optional | — | — | — | — | — | `asr_landline` | — | — |
| Country code (for Assessee's Mobile No.) | text | — | — | — | 91 | — | — | — | `asr_cc` | — | — |
| e-Mail ID (Assessee) | text (type=email) | — | name@example.com | — | — | — | — | — | `asr_email` | Address.EmailAddress; drives `st_assessee` "Entered" | — |
| District | text | — | Bengaluru Urban | — | — | — | — | — | `asr_district` | — | — |
| Secondary address same as primary address? | dropdown | Yes · No | — | — | Yes | — | — | — | `asr_secsame` | — | — |
| Mobile No. | text | — | Optional | — | — | — | — | — | `asr_secmobile` | — | — |
| e-Mail ID | text | — | Optional | — | — | — | — | — | `asr_secemail` | — | — |
| Aadhaar No. | text | — | XXXX XXXX XXXX | — | — | — | maxlength 14 | — | `asr_aadhaar` | PersonalInfo.AadhaarCardNo | — |
| Aadhaar Enrolment ID (if Aadhaar not available) | text | — | Optional | — | — | — | — | — | `asr_aadhaareid` | — | — |
| Liable to maintain accounts as per Sec.44AA? | dropdown | No · Yes | — | — | No | — | — | — | `asr_44aa` → `data.assessee.acc44aa` | — | — |

Buttons: `✓ Done` (closes). Discrepancy note: HTML comment says this field is "ITR-3: extra" — the Sec.44AA question is rendered and bound in ITR-1 too but is never used by `buildItr1Json` (ITR-1 has no business income).

### Particular: "Verifier info."   [click ⋯ → opens: Verifier info.] — status `st_verifier` (⚙ "Entered" when name+PAN)
#### Drill-in: Verifier info. (source: itr1.html:487-499)

| Label | Type | Options | Placeholder | Helper | Default | Req | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Name | text | — | Full name of verifier | — | — | — | — | — | `vfr_name` | — (Verification.Declaration uses assessee name) | — |
| PAN | text | — | ABCDE1234F | — | — | — | maxlength 10, uppercase | — | `vfr_pan` | — | — |
| Capacity | text | — | e.g. Self / Karta / Authorised signatory | — | — | — | — | — | `vfr_capacity` | — (JSON Capacity fixed 'S') | — |
| Father's name | text | — | — | — | — | — | — | — | `vfr_father` | Verification.Declaration.FatherName | — |
| Place of signing | text | — | City | — | — | — | — | — | `vfr_place` | — | — |

Buttons: `✓ Done`. Discrepancy note: `vfr_place` is captured but `Verification.Place` in the JSON is taken from the assessee's Town/City (`A.city`), not from Place of signing.

### Particular: "Bank Accounts"   [click ⋯ → opens: Bank Accounts] — status `st_bank` (⚙ "N account(s)")
#### Drill-in: Bank Accounts (source: itr1.html:519-530)
Note: `If multiple accounts are ticked for refund, refund will be credited to one validated account. For the procedure to validate the account in IT e-filing portal, press 'F1' key.` Section title: `Bank Accounts (All)`.

Grid: headers `Bank Name | Account Number | IFS Code | Type of Account | For refund? | (remove)` · rows added via `+ Add row` (`addBankBtn`), removed per-row via `✕`; min 1 row retained. Totals: `Accounts entered` ⚙ `bank_count` (count of rows with name or account no.).

| Label (column) | Type | Options | Placeholder | Helper | Default | Req | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Bank Name | text | — | e.g. HDFC Bank | — | — | — | — | — | `bank_{i}_name` | Refund.BankAccountDtls.AddtnlBankDetails[].BankName | — |
| Account Number | text | — | — | — | — | — | — | — | `bank_{i}_acc` | …BankAccountNo (row included only if non-empty) | — |
| IFS Code | text | — | HDFC0000123 | — | — | Warn | refund-due + no acc-with-IFSC → export warning | — | `bank_{i}_ifsc` | …IFSCCode | — |
| Type of Account | dropdown | (Select) · Savings · Current · Cash Credit (CC) · Over Draft (OD) · Non-Resident (NRO/NRE) | — | — | (Select) | — | — | — | `bank_{i}_type` | …AccountType (fallback 'SB') | — |
| For refund? | checkbox | — | — | — | unchecked | — | — | — | `bank_{i}_refund` | — | — |

### Particular: "Section under which return is filed" (inline, no drill-in)

| Label | Type | Options | Placeholder | Helper | Default | Req | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Section under which return is filed | dropdown | 139(1) — On or before due date · 139(4) — Belated return · 139(5) — Revised return · 139(9) — Response to defective · 142(1) — In response to notice | — | tooltip `?` = "139(1) = on or before due date" | 139(1) | — | — | — | `f_section` | rail pill `r_sec` | — |

Discrepancy note: `f_section` only drives the rail display; the exported `FilingStatus.ReturnFileSec` is hard-coded `11` and the calc frame has its own independent `Filing under Section` dropdown (sf-filing) with a different, larger option list.

### Particular: "Return Type" (inline)

| Label | Type | Options | Placeholder | Helper | Default | Req | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Return Type | dropdown | Original · Revised | — | — | Original | — | — | — | `f_rettype` | — (not exported) | — |

### Particular: "Representative Assessee, if any"   [click ⋯ → opens: Representative Assessee, if any] — status `st_repassessee`
#### Drill-in: Representative Assessee, if any (source: itr1.html:502-516)
Note: `Fill only if a representative (e.g. legal heir, guardian) is filing on behalf of the assessee.`

| Label | Type | Options | Placeholder | Helper | Default | Req | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Name | text | — | — | — | — | — | — | — | `rep_name` | drives `st_repassessee` "Entered" | — |
| e-Mail ID | text | — | — | — | — | — | — | — | `rep_email` | — | — |
| Contact No. | text | — | — | — | — | — | — | — | `rep_contact` | Address.MobileNo fallback | — |
| Country code (for Contact No.) | text | — | — | — | 91 | — | — | — | `rep_cc` | — | — |
| Assessee Deceased? | yes/no tabs | Yes · No | — | — | No | — | — | — | `data.flags.rep_deceased` (yn-tabs `data-fld="rep_deceased"`) | — | — |

Discrepancy note: JSON `AsseseeRepFlg` is hard-coded `'N'` regardless of entries here.

### Particular: "Pass Through Income u/s 115U/ 115UA/ 115UB"   [click ⋯ → opens: Pass Through Income u/s 115U/ 115UA/ 115UB] — status `st_pti` · Sch. tag `PTI`
#### Drill-in: Pass Through Income u/s 115U/ 115UA/ 115UB (source: itr1.html:610-621)
Note: `Report income passed through from a Business Trust (115UA) or Investment Fund (115UB). Enter one row per head of income for each fund.` Section title `Pass Through Income entries`.

Grid: headers `Investment entity covered u/s | Name of business trust / investment fund | PAN of the business trust / investment fund | Head of income | Amount of income | TDS on such amount, if any | (remove)` · `+ Add row` (`addPtiBtn`) · Totals ⚙ `Total income {pti_income_total} · Total TDS {pti_tds_total}` (sum of rows).

| Label (column) | Type | Options | Placeholder | Default | Binds | Feeds |
|---|---|---|---|---|---|---|
| Investment entity covered u/s | dropdown | (Select) · 115UA — Business Trust · 115UB — Investment Fund | — | (Select) | `pti_{i}_entity` | — |
| Name of business trust / investment fund | text | — | Name of trust / fund | — | `pti_{i}_name` | `st_pti` count |
| PAN of the business trust / investment fund | text | — | ABCDE1234F | — | `pti_{i}_pan` (uppercase) | — |
| Head of income | dropdown | (Select) · Salary · House Property · Business/Profession · Capital Gains · Other Sources · Exempt | — | (Select) | `pti_{i}_head` | — |
| Amount of income | number-text | — | — | — | `pti_{i}_income` | pti_income_total ⚙ |
| TDS on such amount, if any | number-text | — | — | — | `pti_{i}_tds` | pti_tds_total ⚙ |

Discrepancy note: PTI totals are display-only; they are not merged into the computation or the exported JSON.

### Particular: "Partner in a Firm during the PY?" (inline yes/no tabs, default **No**, binds `data.flags.partner`) — no dependent row in ITR-1 (flag captured only).
### Particular: "Held Unlisted Shares in the PY?" (inline yes/no tabs, default **No**, binds `data.flags.unlisted`)
Conditional fields: row "Unlisted Equity Shares" (`#row-unlisted`) appears when Held Unlisted Shares = **Yes** (`onFlagChange`, itr1.html:1530-1533). UI-verified.

### Particular: "Unlisted Equity Shares"   [click ⋯ → opens: Unlisted Equity Shares] — hidden until flag Yes; status `st_unlisted`
#### Drill-in: Unlisted Equity Shares (source: itr1.html:595-606; detail spec `UNLISTED_SPEC` itr1.html:977-982)
Note: `Add each company and click Edit for its full share movement. If PAN of the unlisted company is not available, enter NNNNN0000N. For a foreign company, PAN is not required.`
Summary grid: headers `Name of Company | PAN | Opening Qty | Closing Qty | Details | (remove)`; `+ Add company` (`add_unlisted_Btn`); per-row `Edit ✎` opens shared Detail popup (`sf-detail`). Totals: `Companies` ⚙ `unlisted_count`.
Detail popup (title "Unlisted Equity Shares — entry N") groups & fields: **Company**: `Name of Company` (wide text, `det_company`) · `Type of Company` (dropdown: (Select) · Domestic Company · Foreign Company, `det_ctype`) · `PAN (enter NNNNN0000N if unavailable; not required for foreign co.)` (wide text, `det_pan`, placeholder ABCDE1234F, uppercase). **Opening balance**: `No. of shares` (`det_opQty`, num) · `Cost of acquisition` (`det_opCost`, num). **Shares acquired during the year**: `No. of shares` (`det_acQty`) · `Date of subscription / purchase (DD/MM/YYYY)` (`det_acDate`, date mask) · `Face value per share` (`det_acFace`) · `Issue price per share (for fresh issue)` (`det_acPriceFresh`) · `Purchase price per share (from existing shareholder)` (`det_acPriceExisting`). **Shares transferred during the year**: `No. of shares` (`det_trQty`) · `Sale consideration` (`det_trSale`). **Closing balance**: `No. of shares` (`det_clQty`) · `Cost of acquisition` (`det_clCost`).

### Particular: "Director in a company during the PY?" (inline yes/no tabs, default **No**, binds `data.flags.director`)
Conditional fields: row "Directorship info." (`#row-directorship`) appears when = **Yes**. UI-verified.

### Particular: "Directorship info."   [click ⋯ → opens: Directorship info.] — hidden until flag Yes; status `st_directorship`
#### Drill-in: Directorship info. (source: itr1.html:583-594; detail spec `DIRECTOR_SPEC` itr1.html:975-976)
Note: `Add each company. Click Edit to enter its details.` Summary grid headers `Name of the Company | DIN | Shares listed? | Details | (remove)`; `+ Add company` (`add_director_Btn`); totals `Companies` ⚚ `director_count`.
Detail popup (title "Directorship info. — entry N"), group **Company**: `Director Identification No.(DIN)` (`det_din`, text) · `Name of the Company` (wide text `det_company`) · `Type of Company` (dropdown (Select) · Domestic Company · Foreign Company, `det_ctype`) · `PAN` (`det_pan`) · `Whether shares are listed?` (dropdown (Select) · Listed · Unlisted, `det_listed`).

### Particular: "Tax deferred on Sweat Equity Shares / Securities - B/F"   [click ⋯ → opens: same title] — status `st_esop` · Sch. tag `ESOP`
#### Drill-in: Tax deferred on Sweat Equity Shares / Securities - B/F (source: itr1.html:537-561)
Section `Employer (Startup) details:`: `PAN` (`esr_pan`, uppercase) · `DPIIT registration No.` (`esr_dpiit`).
Section `Year-wise deferred tax` — fixed grid, one row per AY in `ESOP_YEARS = 2021-22 · 2022-23 · 2023-24 · 2024-25 · 2025-26` (itr1.html:775; same list in both AY files): headers `Assessment Year | Tax deferred - B/F | Tax attributed to sale | Date of Cessation of Employment, if any | Tax payable in CY | Balance Tax C/F`. Per row: `esop_{yr}_bf`, `esop_{yr}_sale`, `esop_{yr}_cess` (date mask DD/MM/YYYY), `esop_{yr}_cy`, ⚙ `esop_{yr}_cf` = max(0, bf − sale − cy). Totals row `Total`: ⚙ `esop_bf_tot`/`esop_sale_tot`/`esop_cy_tot`/`esop_cf_tot`.
Checkbox: `Details of tax attributable to Sweat Equity Shares/Securities sold` (`esop_sold_chk`) — reveals (UI-verified) hidden block `esop_sold_wrap` with grid headers `Assessment Year in which Tax deferred | Date of Sale | Tax attributed to Sale | (remove)` (`esopsold_{i}_ay` placeholder 2023-24 · `esopsold_{i}_date` date mask · `esopsold_{i}_tax`), `+ Add row` (`addEsopSoldBtn`).
Discrepancy note: ESOP data drives status/totals only; not emitted in the ITR JSON. AY diff: `ESOP_YEARS` list is identical in the 2025-26 file (not shifted back one year).

### Particular: "Other Forms filed"   [click ⋯ → opens: Other Forms filed] — status `st_otherforms`
#### Drill-in: Other Forms filed (source: itr1.html:564-580; variant renderer itr1.html:1309-1326)
Meta: `A.Y. 2026-27 · Form 10-IEA & Tax Return Preparer`.

| Label | Type | Options | Placeholder | Default | Conditional | Binds | AY diff |
|---|---|---|---|---|---|---|---|
| Opted out of 115BAC by filing Form 10-IEA within due date in earlier year? | dropdown | Yes · No · NA (without business) | — | Yes | — (controls variant below) | `ofr_optearlier` | — |
| AY in which opted out | text | — | 2024-25 | — | shown when opt-earlier = **Yes** (UI-verified) | `ofr_ay` | — |
| Acknowledgment no. of Form 10-IEA | text | — | — | — | shown when opt-earlier = **Yes** | `ofr_ack` | — |
| *(sub-header)* Opting out of 115BAC in CY (10-IEA filed within due date): | — | — | — | — | shown when opt-earlier = **No** or **NA (without business)** | — | — |
| Date of upload of Form 10-IEA | text (date mask) | — | DD/MM/YYYY | — | opt-earlier ≠ Yes | `ofr_iea_date` | — |
| Acknowledgment no. of Form 10-IEA | text | — | — | — | opt-earlier ≠ Yes | `ofr_iea_ack` | — |
| Tax Return Preparer (TRP) info., if any | checkbox | — | — | unchecked | — | `ofr_trp_chk` | — |
| ID No. | text | — | — | — | — (always visible) | `ofr_trp_id` | — |
| Name | text | — | — | — | — | `ofr_trp_name` | — |
| Reimbursement amount | number-text | — | — | — | — | `ofr_trp_amt` | — |

Discrepancy note: TRP checkbox does not hide/show the ID/Name/Amount rows and is itself never saved (`saveSubFormField` has no case for `ofr_trp_chk`).

### Particular: "Having Foreign assets and Income or Signing authority in Foreign a/c?^" (own section header `▾ Foreign Assets & Incomes` with red tag `FA`)

| Label | Type | Default | Conditional effect | Binds |
|---|---|---|---|---|
| Having Foreign assets and Income or Signing authority in Foreign a/c?^ | checkbox | unchecked | reveals the 9 FA rows (`#fa-wrap`, `toggleFA()` itr1.html:1199) — UI-verified | `f_hasFA` |

Footnotes (verbatim): `^Enter all items held (including any beneficial interest) at any time during the calendar year 2025.` · `Note: If the ZIP code is not available, enter 'XXXXXX'.`
AY diff: both files say "calendar year 2025" (2025-26 file not adjusted to 2024 — discrepancy).

The 9 FA particulars (each hidden until `f_hasFA` checked; each opens a summary-list drill-in with `+ Add entry` button `add_{key}_Btn`, per-row `Edit ✎` → nested detail popup `sf-fa-detail`, per-row `✕`, count ⚙ `{key}_count`, status `st_{key}`; shared note verbatim: `Report items held at any time during calendar year 2025. Click Edit on a row to enter its full details. If ZIP code is unavailable, enter XXXXXX. All amounts in ₹.`). Country dropdown options everywhere (COUNTRIES, itr1.html:789): `(Select) · United States · United Kingdom · United Arab Emirates · Singapore · Canada · Australia · Germany · Switzerland · Netherlands · Hong Kong · Japan · Mauritius · Other`.

### Particular: "Foreign Depository / Custodial accounts"   [click ⋯ → opens: Foreign Depository / Custodial accounts]
#### Drill-in: (source: itr1.html:625-636; field spec `FA_SPEC.fa_depository` itr1.html:803)
Summary grid: `Country | Institution | Peak Balance (₹) | Details | (remove)`. Detail groups/fields (all text unless noted): **Location & Institution**: `Country` (dropdown COUNTRIES) · `Institution name` · `Institution address` (wide) · `ZIP code` (placeholder XXXXXX). **Account**: `Account Type` · `Account Number` · `Ownership` · `Account opening date (DD/MM/YYYY)` (date mask). **Balances & Income (₹)**: `Peak Balance during the year` (num) · `Closing balance` (num) · `Gross Income received` (num) · `Nature of Income`. Binds `fadet_{key}` → `data.fa_depository[idx]`.

### Particular: "Investments in Foreign Equity / Debts"
#### Drill-in: (source: itr1.html:637-648; `FA_SPEC.fa_equity` itr1.html:804)
Summary: `Country | Entity | Closing value (₹)`. Detail — **Entity**: `Country` · `Entity name` · `Entity address` (wide) · `ZIP code` · `Nature` · `Date of acquiring interest (DD/MM/YYYY)`. **Value of Investment (₹)**: `Initial value` · `Peak value` · `Closing value`. **Income (₹)**: `Gross Income received` · `Proceeds from Sale / Redemption`.

### Particular: "Surrender value of Foreign Insurance / Annuity Contract"
#### Drill-in: (source: itr1.html:649-660; `FA_SPEC.fa_insurance` itr1.html:805)
Summary: `Country | Institution | Surrender value (₹)`. Detail — **Institution**: `Country` · `Institution name` · `Institution address` (wide) · `ZIP code` · `Date of contract (DD/MM/YYYY)`. **Values (₹)**: `Surrender value of contract` · `Gross Income received`.

### Particular: "Financial Interest in any Entity"
#### Drill-in: (source: itr1.html:661-672; `FA_SPEC.fa_interest` itr1.html:806)
Summary: `Country | Entity | Total Investment (₹)`. Detail — **Entity**: `Country` · `ZIP code` · `Nature of Entity` · `Name of the Entity` · `Address of the Entity` (wide) · `Ownership` · `Date since held (DD/MM/YYYY)`. **Investment & Income (₹)**: `Total Investment` · `Income accrued` · `Nature of Income`. **Income offered in this return**: `Taxable Income (₹)` · `Schedule of ITR` · `Item No. of schedule`.

### Particular: "Immovable Property"
#### Drill-in: (source: itr1.html:673-684; `FA_SPEC.fa_immovable` itr1.html:807)
Summary: `Country | Property | Total Investment (₹)`. Detail — **Property**: `Country` · `ZIP code` · `Property address` (wide) · `Ownership` · `Acquisition date (DD/MM/YYYY)`. **Investment & Income (₹)**: `Total Investment` · `Income` · `Nature of Income`. **Income offered in this return**: `Taxable Income (₹)` · `Schedule of ITR` · `Item No. of schedule`.

### Particular: "Other Capital Assets"
#### Drill-in: (source: itr1.html:685-696; `FA_SPEC.fa_othercap` itr1.html:808)
Summary: `Country | Asset | Total Investment (₹)`. Detail — **Asset**: `Country` · `ZIP code` · `Nature of asset` · `Ownership` · `Acquisition date (DD/MM/YYYY)`. **Investment & Income (₹)** and **Income offered in this return**: same three + three fields as Immovable Property.

### Particular: "Account in which Assessee is signing authority (not included above)"
#### Drill-in: Account in which Assessee is signing authority (source: itr1.html:697-708; `FA_SPEC.fa_signing` itr1.html:809)
Summary: `Country | Institution | Peak Balance (₹)`. Detail — **Institution**: `Institution name` · `Institution address` (wide) · `Country` · `ZIP code`. **Account**: `Account holder name` · `Account Number` · `Peak Balance (₹)` (num) · `Income accrued (if liable to tax) (₹)` (num). **Income offered in this return**: `Taxable Income (₹)` · `Schedule of ITR` · `Item No. of schedule`.
Discrepancy note: row label on-sheet includes "(not included above)"; drill-in h2 omits it.

### Particular: "Trusts in which Assessee is a Trustee / Beneficiary / Settlor"
#### Drill-in: Trusts (Trustee / Beneficiary / Settlor) (source: itr1.html:709-720; `FA_SPEC.fa_trusts` itr1.html:810)
Summary: `Country | Trust | Income derived (₹)`. Detail — **Trust**: `Country` · `ZIP code` · `Trust name` · `Trust address` (wide). **Trustees**: `Trustee name` · `Trustee address` (wide). **Settlor**: `Settlor name` · `Settlor address` (wide). **Beneficiaries**: `Beneficiary name` · `Beneficiary address` (wide). **Position & Income**: `Position held since (DD/MM/YYYY)` · `Income derived (if liable to tax) (₹)` (num). **Income offered in this return**: `Taxable Income (₹)` · `Schedule of ITR` · `Item No. of schedule`.
Discrepancy note: sheet-row label vs drill-in h2 wording differs (see above).

### Particular: "Other income not included above or in sch. BP of ITR"
#### Drill-in: Other income not included above or in Sch. BP (source: itr1.html:721-732; `FA_SPEC.fa_otherincome` itr1.html:811)
Summary: `Country | Person | Income derived (₹)`. Detail — **Source**: `Country` · `ZIP code` · `Person from whom income derived — Name` (wide) · `Address` (wide) · `Income derived (₹)` (num) · `Nature of Income`. **Income offered in this return**: `Taxable Income (₹)` · `Schedule of ITR` · `Item No. of schedule`.

Discrepancy note (whole FA section): FA entries feed only the per-schedule entry counts/status; they are **not** included in `buildItr1Json()` output (no Schedule FA node — genuine ITR-1 has no Schedule FA; the tool still collects it).

---

## Screen: Computation of Income tab (`pane-comp` → `calcFrame` iframe; inner document "Tax Computation · Statement of Total Income", itr1.html:2046-12313)

The inner sheet `#sheet-itcomp` (itr1.html:2216) is the shared Winman-style Statement of Total Income. **Shared computation line-items (totals, slabs, tax ladder) are documented in COMPUTATION-COMMON.md — not repeated here.** Below: the ITR-1 visibility profile, every drill-in reachable in ITR-1, and which computation line each feeds.

ITR-1-specific visibility (all verified in UI):
- Head `Profits and gains of Business or Profession` (`g-bp`) is `display:none` **statically and permanently** (no JS ever unhides it) — itr1.html:2235-2236.
- In `Capital Gains`, rows `LTCG-1:` (sf-ltcg), `Long-term Capital gain from Auto-classification table`, `STCG-1:` (sf-stcg) and `Auto-classification of STCG / LTCG` (sf-auto-cg) are `display:none`; only `Long Term Capital Gain u/s 112A` is visible (itr1.html:2295-2302).
- Visible heads (UI-verified): `Income from Salaries` · `Income from House Property` · `Capital Gains` · `Income from other sources` · `Deductions under Chapter VI-A` (all collapsible `ittog`, collapsed by default ▸).
- Regime selector: row `Tax rate - computed u/s 115BAC by default` → dropdown `it_regime`: `New (115BAC)` · `Old regime` (default New). Flipping it toggles exempt-column availability (`refreshExemptColors`) and old-regime-only deductions.

ITR-1-specific computation additions (2026-27 file only): `window.__taxBreakup` (itr1.html:12278-12285) exposes {rebate87A, taxBeforeSurcharge, surcharge, cess, taxOnTI, relief89, relief90, reliefTotal, taxAfterRelief, amt, amtCreditUsed, taxForLiability, intFeeTotal, tdsTcs, advTax, sat, satInterest, prepaid, balance} for the outer `buildItr1Json()` Part B-TTI mapping. **AY diff: absent in itr1-2025-26.html** (its export writes zeros for Rebate87A/EducationCess/Section89/234 interest).

### Particular: group "Income from Salaries" (g-sal, itr1.html:2217-2225)
Employer blocks are JS-generated (`renderEmployers()`, itr1.html:5374). Cardinality: 1..n employers; add via button `+ Add Employer` (`addEmployer`); per-block remove button `Remove Employer-{N}` (blocks 2+ only). Each block (labels verbatim):
- `Employer-{N}` header row with `Employer details ✎` edit-link [→ opens: Employer Details] and live name suffix.
- `Pension` — inline number input (binds `salaryData[i].pension`) → adds to Total salary.
- `Salaries, allowances and perquisites` [⋯ → opens: Salaries, allowances and perquisites] — ⚙ `emp_salperq_{i}`.
- `Salary as per monthly table` [⋯ → opens: Salary as per monthly table] — ⚙ `emp_monthly_{i}`.
- `Salary: as per Form 16 / Certificate` [⋯ → opens: Salary as per Form 16 / Certificate] — ⚙ `emp_form16_{i}`.
- `Section 89A - Income from retirement benefit a/c` [⋯ → opens: Section 89A — Income from retirement benefit a/c (per-employer)] — ⚙ `emp_89a_{i}`.
Sheet rows after blocks: `Total salary` ⚙ `it_sal_total` (= Σ pension+breakup+monthly+form16+89A) · `Standard deduction u/s 16(ia)` ⚙ `it_sal_std` (= min(cap, total salary); cap 75,000 new regime / 50,000 old — same both AYs) · `Tax on employment u/s 16(iii)` [⋯ → opens: Tax on employment u/s 16(iii)] ⚙ `it_sal_proftax` · `Income chargeable under the head 'Salaries'` ⚙ `it_sal_income`.

#### Drill-in: Employer Details (source: itr1.html:5155-5169)
| Label | Type | Options | Binds |
|---|---|---|---|
| Name | text | — | `emp_name` |
| TAN (if tax deducted) | text (maxlength 10, uppercase style) | — | `emp_tan` |
| Address | text | — | `emp_addr` |
| City | text | — | `emp_city` |
| State | dropdown | STATES list (itr1.html:5304): (Select) · 01-ANDAMAN AND NICOBAR ISLANDS · 02-ANDHRA PRADESH · 03-ARUNACHAL PRADESH · 04-ASSAM · 05-BIHAR · 06-CHANDIGARH · 07-DADRA NAGAR AND HAVELI · 08-DAMAN AND DIU · 09-DELHI · 10-GOA · 11-GUJARAT · 12-HARYANA · 13-HIMACHAL PRADESH · 14-JAMMU AND KASHMIR · 15-KARNATAKA · 16-KERALA · 17-LAKHSWADEEP · 18-MADHYA PRADESH · 19-MAHARASHTRA · 20-MANIPUR · 21-MEGHALAYA · 22-MIZORAM · 23-NAGALAND · 24-ODISHA · 25-PUDUCHERRY · 26-PUNJAB · 27-RAJASTHAN · 28-SIKKIM · 29-TAMILNADU · 30-TRIPURA · 31-UTTAR PRADESH · 32-WEST BENGAL · 33-CHHATTISGARH · 34-UTTARAKHAND · 35-JHARKHAND · 36-TELANGANA · 37-LADAKH · 99-FOREIGN | `emp_state` |
| Pin Code | text (maxlength 6) | — | `emp_pin` |
| Nature of Employment | dropdown | EMPCAT (itr1.html:5305): (Select) · Central Government · State Government · Public Sector Undertaking · Pensioners - Central Government · Pensioners - State Government · Pensioners - Public sector undertaking · Pensioners - Others · Others · Not Applicable (eg. Family pension etc) | `emp_nature` |

#### Drill-in: Salaries, allowances and perquisites (source: itr1.html:5171-5179; tables built by `renderBreakup()` itr1.html:5406)
Note: `If opting taxation u/s 115BAC, exemption for free food & non-alcoholic beverage through paid voucher is not available (second proviso to Rule 3(7)(iii)).`
Five fixed tables (per current employer). Row pattern for the first three: columns `Particulars | Received | Exempt | Taxable ⚙ | Exemption Section`; Exempt cell is regime-gated (`data-avail` = none/old/both; "old" cells disabled under New regime — Conditional: Exempt input usable only when regime rules allow).
1. **Salary Income** (`sib_rec_{i}`/`sib_ex_{i}`/⚙`sib_tax_{i}`), rows verbatim (tag): `Basic Salary` · `Dearness allowance forming part of Salary` · `Advance Salary` · `Any other Remuneration treated as salary for HRA` · `Commission` · `Commutation of Pension` (10(10A), both) · `Deemed income - Rule 11 of Part A of Fourth Schedule` · `Deemed income - Rule 6 of Part A of Fourth Schedule` · `Employer's contribution to NPS` · `Fees` · `Gratuity` (10(10), both) · `Leave encashment at the time of retirement` (10(10AA), both) · `Leave encashment during employment` · `Pension`.
2. **Allowances** (`sab_*`), rows: `House Rent Allowance` (10(13A), old) · `Academic and research allowance` (10(14)(i), both) · `Children allowance - Hostel - 1 child` (10(14)(ii), old) · `Children allowance - Hostel - 2 children` (10(14)(ii), old) · `Children education allowance - 1 child` (10(14)(ii), old) · `Children education allowance - 2 children` (10(14)(ii), old) · `Conveyance allowance` (10(14)(i), both) · `Daily allowance on Tour / Transfer` (10(14)(i), both) · `Dearness allowance not forming part of Salary` · `Duty allowance in Transport business` (10(14)(ii), old) · `Entertainment allowance` · `Family allowance` · `Fixed medical allowance` · `Helper allowance` (10(14)(i), both) · `Leave Travel Allowance` (10(5), old) · `Overtime allowance` · `Refreshment allowance` · `Servant allowance` · `Sumptuary allowances of SC/HC judges` (EIC, both) · `Transport allowance` (10(14)(ii), old) · `Travelling allowance` (10(14)(i), both) · `Uniform allowance` (10(14)(i), both) · `Warden allowance`.
3. **Profit in lieu of salary** (`spb_*`), rows: `Retrenchment Compensation` (both) · `Sum received before joining or after cessation of employment u/s 17(3)(iii)` · `Sum received from any Fund / Employer / Keyman Policy u/s 17(3)(ii)` · `VRS receipts - exemption u/s 10(10C)` (10(10C), both).
4. **Perquisites** — columns `Particulars | Value | Recovered | Net value ⚙` (`sqb_val_{i}`/`sqb_rec_{i}`/⚙`sqb_net_{i}`), rows: `Club expenditure` · `Contribution to NPS/PF/Superannuation Fund` · `Credit card facility` · `Education facility` · `Employee's obligations met` · `Free food facility` · `Gift or gift voucher` · `Holiday expenses` · `Interest / Dividend on balance of NPS/PF/Superannuation Fund` · `Interest concession on loans` · `Leave Travel Concession` · `Medical facilities (for treatment in India)` · `Medical facilities (for treatment outside India)` · `Motor car facility` · `Other perquisites (excluding telephone)` · `Provision of free personal journey` · `Provision of gas, electricity, water` · `Provision of sweeper, watchman etc.` · `Rent free accommodation` · `Sweat Equity Shares/Securities of a Startup u/s 80IAC (if Tax Deferred)` · `Sweat Equity Shares/Securities of a Startup u/s 80IAC (if Tax paid)` · `Sweat Equity Shares / securities` · `Tax paid by employer on perquisite` · `Transfer of movable asset` · `Use of movable assets`.
5. **Less: Exempt Perquisites** — columns `Particulars | Amount | Section` (`seb_amt_{i}`), rows: `Leave travel concession exempt u/s 10(5)` (10(5), old) · `Tax paid by employer on perquisite exempted u/s 10(10CC)` (10(10CC), both); totals row `Taxable Perquisites` ⚙ `sqb_taxable`.
Grand: `Taxable Salary & Perquisites (this employer)` ⚙ `sfb_total`. Feeds `emp_salperq_{i}` → `it_sal_total`.

#### Drill-in: Salary as per monthly table (source: itr1.html:5181-5188; `renderMonthly()` itr1.html:5445)
Wide grid, columns `Monthly salary | April | May | June | July | August | September | October | November | December | January | February | March | Total ⚙ | Exemption | Taxable salary ⚙ | Section`. Rows: `Basic` (`mon_basic_{0..11}`, exempt `mon_basic_ex` — avail none) · `Dearness allowance` (`mon_da_*`) · `HRA` (`mon_hra_*`, exempt `mon_hra_ex`, tag 10(13A), old-regime only) · totals row `Total` (⚙ per-month `mon_total_{j}`, `mon_grandtot`, `mon_grandtax`) · `Rent paid` (`mon_rent_{j}`, ⚙ `mon_rent_tot`) · `City` (per-month dropdown `mon_city_{j}`: `others` · `metro`) · `Profession tax` (`mon_pt_{j}`, ⚙ `mon_pt_tot`) · `Net salary` (⚙ `mon_net_total` / `mon_net_taxable`).
Note: `Profession tax entered here is informational; the amount feeding the master is taken from the Tax on employment u/s 16(iii) sheet.` Grand: `Taxable Salary (monthly table)` ⚙ `sfm_total` → `emp_monthly_{i}`.

#### Drill-in: Salary as per Form 16 / Certificate (source: itr1.html:5190-5197; `renderForm16()` itr1.html:5431)
Table `Salary details | Amount | Exemption Section`: `Salary u/s 17(1)` (`f16_17_1`) · `Allowances u/s 17(1)` (`f16_allow`) · `Perquisites u/s 17(2)` (`f16_17_2`) · `Profit in lieu of salary u/s 17(3)` (`f16_17_3`).
Section `Less: Exemptions` (`f16_ex_{i}`, regime-gated), rows: `HRA to the extent exempt u/s 10(13A)` (old) · `Academic and research allowance` (10(14)(i), both) · `Children allowance` (10(14)(ii), old) · `Commutation of Pension` (10(10A), both) · `Conveyance allowance` (10(14)(i), both) · `Duty allowance in Transport business` (10(14)(ii), old) · `Entertainment allowance` (old) · `Gratuity` (10(10), both) · `Helper allowance` (10(14)(i), both) · `Leave encashment at the time of retirement` (10(10AA), both) · `Leave travel concession` (10(5), old) · `Retrenchment Compensation` (both) · `Sumptuary allowances of SC/HC judges` (EIC, both) · `Tax paid by employer on perquisite` (10(10CC), both) · `Transport allowance` (10(14)(ii), old) · `Travelling allowance` (10(14)(i), both) · `Uniform allowance` (10(14)(i), both) · `VRS receipts - exemption u/s 10(10C)` (10(10C), both). Totals: `Net salary` ⚙ `f16_net`; grand `Net Salary (Form 16)` ⚙ `sff_total` → `emp_form16_{i}`.

#### Drill-in: Section 89A — Income from retirement benefit a/c (per-employer) (source: itr1.html:5199-5207)
Grid `Country | Amount` (free-text country + amount per row, binds `emp.a89[]`), button `+ Add country` (`data-add89a`). Grand `Total u/s 89A` ⚙ `sf89a_total` → `emp_89a_{i}` → Total salary.

#### Drill-in: Tax on employment u/s 16(iii) (source: itr1.html:5209-5216; `renderProftax()` itr1.html:5521)
Grid `Employer | Amount`: one row per employer, label `Employer-{N}: {name}`, input `pt_emp_{i}` (binds `salaryData[i].proftax`). Grand `Total Professional Tax` ⚙ `sfpt_total` → sheet cell `it_sal_proftax` (deducted from salary).

### Particular: group "Income from House Property" (g-hp, itr1.html:2227-2233)
Property blocks JS-generated (`renderProperties()`, itr1.html:5803). Cardinality 1..n; `+ Add Property` (`addProperty`); `Remove` button on blocks 2+. Each block header: `Property-{N}:` + type tabs `Self-occupied` | `Let-out` (default Self-occupied) + `Property details ✎` [→ opens: Details of the property] + (Let-out only, UI-verified) `share <input> %` (default 100, binds `p.share`).
Conditional fields — **Self-occupied** rows: `Interest on borrowed capital` [⋯ → sf-hp-int] ⚙ `hp_int_{i}` · `Income / Loss from Property-{N}` ⚙ `hp_inc_{i}` (= −interest). **Let-out** rows (appear when type=Let-out, UI-verified): `Gross annual value (including co-owners' shares)` [⋯ → sf-hp-gav] ⚙ `hp_gav_{i}` · `Less: Municipal taxes (including co-owners' shares)` (inline input, binds `p.municipal`) · `Net annual value (assessee's share)` ⚙ `hp_nav_{i}` · `Less: Standard deduction u/s 24(a)` ⚙ `hp_sd_{i}` (30% of NAV if +ve) · `Interest on borrowings u/s 24(b): Assessee's share` [⋯ → sf-hp-int] ⚙ `hp_int_{i}` · `Add: Arrears / Unrealised rent received (Assessee's share)` [⋯ → sf-hp-arrears] ⚙ `hp_arrears_{i}` · `Add: Pass-through income` (inline input, binds `p.pti`) · `Income / Loss from Property-{N}` ⚙.
Sheet rows: `Income chargeable under the head 'House Property'` ⚙ `it_hp_income` · conditional note row (appears when total SOP interest > ₹2,00,000): `Note: SOP interest capped at ₹2,00,000 (excess {it_hp_sop_excess} not allowed)`.

#### Drill-in: Details of the property (source: itr1.html:5219-5236)
`Flat / Door / House No.` (`prop_flat`) · `Premises` (`prop_premises`) · `Road` (`prop_road`) · `Locality / Village` (`prop_locality`) · `Town / City` (`prop_city`) · `State` (dropdown STATES, `prop_state`) · `Pin Code` (maxlength 6, `prop_pin`) · section header `Details of Owner` · `Owner` (`prop_owner`) · `Assessee's share in the property (%)` (`prop_share`, default 100).

#### Drill-in: Interest on borrowed capital (source: itr1.html:5238-5251)
Section `Interest details` — grid `Loan taken from | Name of Bank / Institution / Person | Loan Account No. | Sanction date | Total loan amount | Closing Balance | Interest | (remove)` (binds `prop.interest.loans[]`; remove only on rows 2+), `+ Add loan`. Below: `Pre-construction interest C/F (not taken to ITR)` (`hpi_pre_cf`) · `Pre-construction interest (1/5 claimed this year)` (`hpi_pre`). Grand `Total Interest u/s 24(b)` ⚙ `hpi_total` (= Σ Interest + 1/5 pre-construction) → `hp_int_{i}`.

#### Drill-in: Gross annual value (including co-owners' shares) (source: itr1.html:5253-5265)
Grid `Description | Amount` (`prop.gav.rentRows[]`), `+ Add row`. Then `Total` ⚙ `hpg_total` · `Less: Unrealised Rent [Expln. to Sec. 23(1)]` (`hpg_unrealised`) · `Gross annual value` ⚙ `hpg_gav` → `hp_gav_{i}` (× share%).

#### Drill-in: Arrears / Unrealised Rent received u/s 25A (source: itr1.html:5267-5277)
`Arrears / Unrealised Rent received u/s 25A` (`hpa_received`) · `Less: Standard deduction (30%)` ⚙ `hpa_sd` · `Taxable amount` ⚙ `hpa_taxable` → `hp_arrears_{i}`.

### Particular: group "Capital Gains" (g-cg, itr1.html:2295-2302)
Visible row (only one in ITR-1): `Long Term Capital Gain u/s 112A` [⋯ → opens: Long Term Capital Gain u/s 112A] ⚙ `it_cg_112a`.

#### Drill-in: Long Term Capital Gain u/s 112A (source: itr1.html:2746-2802; row renderer itr1.html:8183)
Meta: `A.Y. 2026-27 · Listed Shares / Units of EOF / Business Trust`. Note (verbatim): `For shares/units acquired before 01-Feb-2018, the cost of acquisition is grandfathered: Cost deductible = MAX(actual cost, MIN(FMV u/s 55(2)(ac) on 31-Jan-2018 × Qty, Sale consideration)). Aggregate LTCG u/s 112A is exempt up to ₹1,25,000 per year (Finance Act 2024); above is taxed at 12.5%.`
Header buttons: `+ Add row` (`addLtcg112aBtn`, in title bar) · `✓ Done`.
Grid headers: `Quantity | Date of transfer | Sale consideration | Selling expenses | Net sale consideration ⚙ | Actual Cost of Acquisition | Pre-01/02/18? | FMV u/s 55(2)(ac) per share/unit | Total FMV ⚙ | Cost of Acquisition deductible ⚙ | LTCG ⚙ | ISIN code | (remove)`.
Per-row binds: `ltcg112a_{i}_qty` · `_dot` (DD/MM/YYYY) · `_sale` · `_se` · `_ac` · `_pre` (checkbox — **Conditional: FMV input disabled unless Pre-01/02/18 checked**; re-render on toggle) · `_fmv` · `_isin`.
Section: `Claiming Exemption u/s 54F?` + checkbox label `Yes — claim exemption u/s 54F` (`ltcg112a_claim54F`) — reveals (UI-verified) block `sf-ltcg112a-54F`: `Date of transfer of original asset` (`ltcg112a_54F_dot`, DD/MM/YYYY) · `Net sale consideration` (`ltcg112a_54F_netSale`) · `Capital Gain (per 112A table above)` ⚙ `ltcg112a_54F_cg` · `Invested Date` (`ltcg112a_54F_invDate`) · `Invested amount` (`ltcg112a_54F_invAmt`) · `CG scheme deposit` (`ltcg112a_54F_cgScheme`) · `CG scheme — Account Number` (`ltcg112a_54F_acct`) · `CG scheme — IFSC` (`ltcg112a_54F_ifsc`) · `Exempt Amount (auto: capped at CG)` ⚙ `ltcg112a_54F_exempt` (= min(invested+scheme, max(0,total LTCG))).
Grand: `Total LTCG u/s 112A` ⚙ `ltcg112a_total` · `Net LTCG (after 54F exemption)` ⚙ `ltcg112a_net` → sheet `it_cg_112a`. Feeds: special-rate CG bucket (12.5% above ₹1.25L exemption), Summary `LTCG u/s 112A (≤ ₹1.25L)`, export `LTCG112A.TotLTCG112A`; export **error** if > ₹1,25,000.

### Particular: group "Income from other sources" (g-os, itr1.html:2304-2322) — 16 rows, each [⋯ → drill-in], all ⚙ except "Other:" which has an inline input `it_os_other` too

#### Drill-in: Interest income (row label `Interest income`; h2 `Interest income (other than NSC/KVP interest)`) (source: itr1.html:2996-3064)
Note: `Deduction u/s 80TTA (₹10,000 on Savings interest, non-seniors) or 80TTB (₹50,000 on all interest, senior citizens) is applied separately under Chapter VI-A — not here.`
Three identical repeat-grids, headers `Name of the Bank / Institution | Interest | Account No. (for reference) | (remove)`; buttons `+ Add row` (`addOsIntDepBtn` / `addOsIntSbBtn` / `addOsIntOthBtn`); section titles: `Interest from Deposits in Bank, Post office or Co-op. society` (`os_int_dep_{i}_*`) · `Interest on Savings a/c` (`os_int_sb_{i}_*`) · `Other Interest (including Companies, NBFCs & HFCs)` (`os_int_oth_{i}_*`).
Section `Pass through income u/s 115U / 115UA / 115UB`: `Pass through interest income` (`os_int_passThrough`). Section `Deductible expenses`: `Expenses deductible from Interest on Savings a/c` (`os_int_expSb`, capped at SB interest in compute) · `Other expenses / deductions u/s 57` (`os_int_expOther`).
Grand ⚙: `Gross Interest {os_int_gross} · Less: Expenses {os_int_exp_total} · Taxable Interest {os_int_taxable}` → sheet `it_os_interest`. Also feeds Summary tab `Income from Other Sources` and JSON `IncomeOthSrc`.

#### Drill-in: Dividends (row `Dividends`; h2 `Dividends taxable at Normal rate`) (source: itr1.html:3067-3130)
Note: `Quarter-wise bifurcation is required for ITR and computing Interest u/s 234C. If 'Quarter' is not filled, it will be considered for quarter 'up to 15-Jun'. Cost of Acquisition for 2(22)(f) buyback is required only for Form 3CD.`
Quarter dropdown options (all quarter cells): `(Quarter)` (empty) · `Q1 (Apr–Jun)` · `Q2 (Jul–Sep)` · `Q3 (Oct–Dec)` · `Q4 (Jan–Mar)`.
Four grids: 1. `Dividends from Company — other than u/s 2(22)(e) & 2(22)(f)` — `Particulars | Amount | Quarter | ✕` (`os_div_norm_{i}_part/_amt/_q`, `+ Add row` `addOsDivNormBtn`). 2. `Buy back of shares u/s 2(22)(f)` — `Particulars (Company / Shares) | Amount | Quarter | Cost of Acquisition (3CD only) | ✕` (`os_div_bb_*`, `addOsDivBuybackBtn`). 3. `Dividends u/s 2(22)(e) — Deemed dividends` — `Particulars (Company) | Amount | Date | ✕` (`os_div_22e_*`, date DD/MM/YYYY, `addOsDiv22eBtn`). 4. `Others (income from Units of MF, etc.)` — `Particulars | Amount | Quarter | ✕` (`os_div_mf_*`, `addOsDivMfBtn`).
Grand ⚙ `Total Dividend Income (slab-taxable)` `os_div_total` → sheet `it_os_dividend`.

#### Drill-in: DTAA income (only for Non-residents) (source: itr1.html:3480-3506; rows itr1.html:9625)
Note: `For each income type covered under a DTAA: applicable rate = lower of IT Act rate and DTAA rate. If applicable rate is 0%, the income is exempted under the DTAA and excluded from Total Income computation (per ITR format).`
Header buttons `+ Add row` (`addOsDtaaBtn`) · `✓ Done`. Grid headers: `Nature of Income | Rate IT Act (%) | Rate DTAA (%) | Applicable rate (%) ⚙ | Income | Tax ⚙ | Country | Article of DTAA | Section of IT Act | Pass-through 115U/UA/UB? | ✕` (binds `os_dtaa_{i}_nature/_rateIT/_rateDTAA/_income/_country/_article/_sectionIT/_pt(checkbox)`; applicable rate ⚙ = min of the two entered rates). Grand ⚙ `Total DTAA income (included in TI) {os_dtaa_income_total} · Total DTAA tax {os_dtaa_tax_total}` → sheet `it_os_dtaa`, special-rate bucket.
Discrepancy note: ITR-1 is for Residents only (banner), yet this NR-only drill remains reachable.

#### Drill-in: Family pension (source: itr1.html:3133-3147)
Note: `Standard deduction u/s 57 on family pension: 1/3 of family pension OR ₹25,000 (new regime) / ₹15,000 (old regime), whichever is lower. Finance Act 2024 raised the new-regime cap from ₹15,000 to ₹25,000 effective AY 2025-26.`
`Family pension received` (`os_fp_amount`) · `Less: Standard deduction u/s 57 (auto)` ⚙ `os_fp_stdDed` (UI-verified: 1,20,000 → ₹25,000 under New) · `Taxable family pension` ⚙ `os_fp_taxable` → sheet `it_os_familypension`. Same caps both AYs.

#### Drill-in: Gifts taxable u/s 56(2)(x) (source: itr1.html:3215-3292)
Note: `Aggregate test: For money — taxable if total from non-relatives exceeds ₹50,000 in a year. For immovable property — if (Stamp Duty Value − Consideration) exceeds ₹50,000 AND 10% of consideration. For movable property — if (FMV − Consideration) exceeds ₹50,000 per category. Enter the taxable amount (after considering relative-exemption and thresholds).`
Section `Money received`: `Money received (aggregate > ₹50,000)` (`os_gifts_money`). Section `Immovable property` (`+ Add row` `addOsGiftsImmovBtn`): grid `Description / Property | Stamp Duty Value | Consideration, if any | Taxable amount (SDV − Consid.) ⚙ | ✕` (`os_gifts_im_{i}_desc/_sdv/_cons`). Section `Movable property (per category — Fair Market Value & Consideration)` — fixed 9 rows, columns `Category | Fair Market Value | Consideration, if any | Difference (taxable) ⚙`: `Archaeological collections` (`os_gifts_mov_arch_*`) · `Art works` (`_art_`) · `Bullion` (`_bul_`) · `Drawings` (`_drw_`) · `Jewellery` (`_jew_`) · `Paintings` (`_ptg_`) · `Sculptures` (`_scu_`) · `Shares / securities` (`_shr_`) · `Virtual Digital Asset` (`_vda_`).
Grand ⚙ `Grand total (taxable u/s 56(2)(x))` `os_gifts_total` → sheet `it_os_gifts`.

#### Drill-in: Income taxable at special rates (source: itr1.html:3190-3212; rows itr1.html:9242-9300)
Meta: `Sections 111 / 115ACA / 115BBF / 115BBG / 115E / 115BBE`. Note: `Tax rates per section: 10% — 115ACA(1)(a) GDR dividend, 115BBF Patent royalty, 115BBG Carbon credits. 20% — 115E(a) FX asset investment income. 60% — Sec 68/69/69A/69B/69C/69D (covered by 115BBE; additional 25% surcharge applies regardless of TI level — applied automatically below). No basic exemption, no 87A rebate, no 15% surcharge cap on these.`
Grid headers: `Section | Rate | Income | Tax ⚙ | PF accumulated in AY | Pass-through 115U/UA/UB?`. Pre-populated fixed rows (UI-verified, no add/remove): `Tax on accumulated balance of Recognised PF` (rate = user input `os_sp_0_rate`; PF-years input) · `115ACA(1)(a) — Dividend from approved GDR (foreign currency)` (10) · `115BBF — Royalty income from Patent` (10) · `115BBG — Income from transfer of Carbon Credits` (10) · `115E(a) — Investment income of Foreign Exchange Asset` (20) · `68 — Cash credits (115BBE)` (60) · `69 — Unexplained investments (115BBE)` (60) · `69A — Unexplained money, etc. (115BBE)` (60) · `69B — Investments not fully disclosed in books (115BBE)` (60) · `69C — Unexplained expenditure, etc. (115BBE)` (60) · `69D — Amount borrowed or repaid on hundi (115BBE)` (60). Non-PF rows show `NA` in PF column. Binds `os_sp_{i}_inc/_pf/_pt`.
Grand ⚙: `Total special-rate income {os_special_income_total} · Total tax {os_special_tax_total}` + conditional note `+ 25% surcharge on Sec 115BBE income (auto-applied)` (shown when any 115BBE income) → sheet `it_os_special`; tax joins special-rate tax; BBE surcharge added to surcharge line.

#### Drill-in: KVP — Interest on Kisan Vikas Patra (row `KVP Interest`) (source: itr1.html:3295-3320)
Section `KVP holdings` (`+ Add row` `addOsKvpBtn`): grid `Purchase Date | Amount | Interest for ₹1,000 | Interest for Current Year | Cumulative Interest | ✕` (`os_kvp_{i}_date/_amt/_per1000/_cy/_cum`). Then `Deductible expenses` (`os_kvp_expenses`) · `Taxable Interest (KVP)` ⚙ `os_kvp_taxable` (= Σ Interest-for-CY − expenses) → sheet `it_os_kvp`.

#### Drill-in: NSC — Interest on National Savings Certificates (row `NSC Interest`) (source: itr1.html:3323-3372)
Meta: `VIII Issue reinvested interest qualifies for 80C carryover`. Note: `If investment amount is entered under 'Interest on NSC - computation', the same will be considered for 80C next year automatically.`
Two grids `VIII Issue` (`addOsNscVIIIBtn`) and `IX Issue` (`addOsNscIXBtn`), headers `Purchase Date | Amount | Interest for ₹100 | Interest for CY | Cumulative Interest | NSC Certificate No. | ✕` (`os_nsc_viii_{i}_*` / `os_nsc_ix_{i}_*`). Scalars: `Interest not shown above (not considered for 80C)` (`os_nsc_intNotShown`) · `Deductible expenses` (`os_nsc_expenses`) · `Taxable Interest (NSC)` ⚙ `os_nsc_taxable` · `Total re-invested interest (VIII Issue) — for 80C next year` ⚙ `os_nsc_reinvested` → sheet `it_os_nsc`; reinvested figure surfaces as hint in 80C bundle (`s80c_nsc_carry`, display-only).

#### Drill-in: Minor child's income (row `Minor child's income:`; h2 `Minor child's income (clubbed u/s 64(1A))`) (source: itr1.html:3375-3385; card renderer itr1.html:9465)
Meta: `Exemption u/s 10(32) — ₹1,500 per minor child per year`. Note: `Minor child's income (other than from manual work or skill, or from disability) is clubbed with the parent having higher income. Exemption ₹1,500 per child u/s 10(32). Income from a minor child's own skill/talent is NOT clubbed.`
Repeatable child-cards, 0..n; header button `+ Add child` (`addOsMinorBtn`); per-card `✕ Remove`. Card fields (`os_minor_{idx}_…`): `Name` (`_name`) · `PAN / Aadhaar` (`_pan`) · income rows: `Dividend from Company — Buyback u/s 2(22)(f)` (`_dividendBuyback`) · `Dividends from Company — other than u/s 2(22)(e) & (f)` (`_dividendsOther`) · `Interest — others (from companies, NBFC, HFC, etc.)` (`_interestOther`) · `Interest from Deposits in Bank/PO/Co-op` (`_interestDeposit`) · `Interest on SB a/c` (`_interestSb`) · `Other Dividends (income from Units of MF etc.)` (`_otherDividends`) · `Rental income — land/building/P&M` (`_rental`) · **Deductions** sub-header · `Interest expenses — relating to Dividends from Company` (`_intExpDiv`) · `Interest expenses — relating to other Dividends` (`_intExpOther`) · ⚙ `Gross income from this child` · ⚙ `Less: Exemption u/s 10(32) (capped at ₹1,500)` · ⚙ `Net clubbed income (this child)`.
Grand ⚙ `Total clubbed income (after Sec 10(32) exemption)` `os_minor_total` → sheet `it_os_minor`.

#### Drill-in: Other person's income (row `Other person's income`; h2 `Other person's income (clubbed u/s 64)`) (source: itr1.html:3388-3398; itr1.html:9519)
Meta: `Spouse, daughter-in-law etc.` Note: `Income of spouse or daughter-in-law from assets transferred without adequate consideration is clubbed with the transferor's income u/s 64. No ₹1,500 exemption (unlike minor children).`
Same card structure as Minor (`os_op_{idx}_…`) plus `Relationship` (`_relationship`, placeholder e.g. Spouse); no 10(32) exemption line; footer ⚙ `Net clubbed income (no exemption)`. Buttons: `+ Add person` (`addOsOtherPersonBtn`), per-card `✕ Remove`. Grand ⚙ `Total clubbed income from other persons` `os_otherperson_total` → sheet `it_os_otherperson`.

#### Drill-in: Rental income — Land, Building, Plant & Machinery (row `Rental income: from land, building, plant & machinery, etc.`) (source: itr1.html:3401-3417)
Meta: `Sec 56(2)(ii) / (iii) — taxable as Other Sources when not Business income`. Note: `Use this section when rental from machinery / plant / furniture is not part of a business. If it IS business income, use the PGBP head instead.`
`Rental income (gross)` (`os_rental_income`) · `Less: Deductions u/s 57 (repairs, insurance, etc.)` (`os_rental_deductions`) · `Less: Depreciation` (`os_rental_depreciation`) · `Taxable rental income` ⚙ `os_rental_taxable` → sheet `it_os_rental1`.

#### Drill-in: Section 89A — Income from retirement benefit a/c (OS row) (source: itr1.html:3420-3438)
Meta: `Specified country relief — defer until withdrawal`. Note: `Resident individuals with retirement benefit accounts opened in notified countries (Canada, UK, USA) can elect under Sec 89A to defer Indian tax on accrued income until withdrawal. Enter accrued income per country. Tax computation here is on the gross accrued amount (election to defer is handled at filing time).`
Fixed rows: `Canada` (`os_89a_canada`) · `United Kingdom (UK)` (`os_89a_uk`) · `United States (USA)` (`os_89a_usa`) · `Others` (`os_89a_others`) · `Total income from retirement benefit a/c` ⚙ `os_89a_total` → sheet `it_os_89a`.

#### Drill-in: Taxable income u/s 58, 59 & 56(2)(ix), (xii), (xiii) (source: itr1.html:3441-3460)
Fixed rows: `Amount not deductible u/s 58` (`os_5859_not58`) · `Profits chargeable to tax u/s 59 (recovered bad debts etc.)` (`os_5859_chargeable59`) · `Advance received but forfeited u/s 56(2)(ix)` (`os_5859_advance`) · `Sum received from Business trust u/s 56(2)(xii)` (`os_5859_btrust`) · `Sum received under life insurance policy u/s 56(2)(xiii)` (`os_5859_lifeins`) · `Total taxable` ⚙ `os_5859_total` → sheet `it_os_58_59`.

#### Drill-in: Winnings — Lotteries, Games, Betting (row `Winnings: Lotteries, Games, Betting`) (source: itr1.html:3150-3187)
Meta: `Sec 115BB & 115BBJ — flat 30%`. Note: `Winnings taxed at flat 30% (Sec 115BB — Lotteries, crossword puzzles, races, card games, gambling, betting). Sec 115BBJ — Online games at flat 30%. No deductions, no basic exemption, no 87A rebate, no 15% surcharge cap. Loss from one form of winnings cannot be set off against another, nor against any other income.`
Grid 1 `Winnings taxable u/s 115BB (Lotteries / Crossword / Races / Card games / Betting)` (`addOsWin115BBBtn`): `Description | Income | Date | ✕` (`os_win_115bb_{i}_desc/_inc/_date`). Grid 2 `Winnings from Online games taxable u/s 115BBJ` (`addOsWin115BBJBtn`): `Description / Platform | Income (Net winnings) | Date | ✕` (`os_win_115bbj_*`).
Grand ⚙ `Total Winnings {os_win_total} · Tax @ 30% {os_win_tax}` → sheet `it_os_winnings`; special-rate income/tax.

#### Drill-in: Other Other-Sources income (row `Other:` with inline sheet input `it_os_other`) (source: itr1.html:3463-3477)
Meta: `Catch-all for income not covered above`. Note: `Gross Income from this section will be taken to item no. 1e of 'Schedule OS' of ITR. Do not enter Interest, Dividend or Rental income here — those have dedicated sub-forms.`
`Income (description / amount)` (`os_other_income`) · `Less: Deductions u/s 57` (`os_other_deductions`) · `Taxable income` ⚙ `os_other_taxable` → sheet `it_os_other`.
Discrepancy note: the sheet row also carries a direct editable input `it_os_other`; the drill's computed value overwrites it via `setTxt` — two write-paths to the same cell.

#### Drill-in: Brought forward losses set off (source: itr1.html:2921-2993; rows itr1.html:8689)
Meta: `Schedule CFL — Capital Losses (Section 74)`. Note (verbatim): `Section 74 rules: Brought-forward Short Term Capital Loss (STCL) can be set off against any Capital Gain (STCG or LTCG) of subsequent 8 years. Brought-forward Long Term Capital Loss (LTCL) can be set off only against LTCG of subsequent 8 years. Section 115BBH: Loss from Virtual Digital Asset (VDA) cannot be set off against any other income; also no other loss can be set off against VDA gains. Set-off priority (most beneficial for assessee — saves highest tax rate first): STCL → STCG-111A (20%) → STCG-slab → LTCG-flat (12.5%) → LTCG-115E (10%) → LTCG-112A taxable. LTCL → LTCG-flat → LTCG-115E → LTCG-112A taxable.`
Two grids `Short Term Capital Loss — Brought Forward` (`addBflStclBtn`) and `Long Term Capital Loss — Brought Forward` (`addBflLtclBtn`), headers `A.Y. of loss | Amount Brought Forward | Set-off this year ⚙ | Balance Carried Forward ⚙ | Status ⚙ | ✕`. AY dropdown options: `(Select AY)` · 2018-19 · 2019-20 · 2020-21 · 2021-22 · 2022-23 · 2023-24 · 2024-25 · 2025-26 (`BFL_AY_OPTIONS` itr1.html:8673 — identical list in the 2025-26 file, an AY-shift discrepancy). Amount input disabled when AY invalid; Status ⚙ shows `{n}/8 yrs used` / `Expired (>8 yrs)` / `Future AY` / `Invalid AY`.
Sub-totals ⚙: `Total STCL B/F · STCL Set-off applied · STCL Carry forward` and LTCL equivalents. Section `How the set-off was applied to current year Capital Gains` — ⚙ table `Bucket (current year gain) | Gain before set-off | STCL applied | LTCL applied | Gain after set-off | Tax rate | Tax saved by set-off` (`bfl-breakdown`). Grand ⚙ `Total set-off applied (this year) {bfl_grand_setoff} · Tax saved {bfl_grand_tax_saved}` → sheet `it_os_bfloss`; TI reduced by `bflSetOff` (calc `computeAll`).
Discrepancy note: the row lives under "Income from other sources" on the sheet but is a Capital-loss engine (feeds CG buckets, not OS).

### Particular: group "Deductions under Chapter VI-A" (g-80, itr1.html:2324-2334)
Rows (each ⚙ + drill): `80CCH: Contribution to Agniveer Corpus Fund` → sf-80-cch · `80D: Health Insurance Premium` → sf-80-d · `80DD: Medical treatment of Handicapped` → sf-80-dd · `80DDB: Medical treatment of specified diseases` → sf-80-ddb · `80E: Interest on education loan repaid` → sf-80-e · `Investment u/s 80C, CCC, CCD` → sf-80-ccccd · `Other Chapter VI-A deductions (80G/80GG/80TTA/80TTB/80U…)` → sf-80-other · totals row `Total Chapter VI-A deductions` ⚙ `it_80_total` → Summary `Less: Deductions under Chapter VI-A`, JSON `DeductUndChapVIA` (via `chapVIA()` itr1.html:1853 which reads per-section cells `it_80_c`, `it_80_ccc`, `it_80_ccd1`, `it_80_ccd1b`, `it_80_ccd2`, `it_80_g`, `it_80_gg`, `it_80_u`, `it_80_tta`, `it_80_ttb` — see discrepancy below).

#### Drill-in: 80CCH — Contribution to Agniveer Corpus Fund (source: itr1.html:4439-4486)
Meta: `80CCH(1) own + 80CCH(2) Central Govt contribution · Available in BOTH regimes`. Note: `Section 80CCH (Finance Act 2023) is for Agniveers enrolled in the Agnipath Scheme on or after 1-Nov-2022. Both components are 100% deductible with no cap, available under both old and new regimes (per Sec 115BAC(2)). The Central Government's contribution u/s 80CCH(2) is first added to salary income u/s 17(1)(viii) and then claimed as deduction here.`
`Agniveer enrolment date (must be on/after 1-Nov-2022)` (`agni_enrolDate`, DD/MM/YYYY) · `Service Number / Agniveer ID` (`agni_serviceNo`) · `Own contribution u/s 80CCH(1)` — helper "From own salary, deposited to Agniveer Corpus Fund" (`agni_own`) · `Central Govt contribution u/s 80CCH(2)` — helper "Amount contributed by Centre into Corpus Fund (also added to salary u/s 17(1)(viii))" (`agni_govt`) · `Total deduction u/s 80CCH` ⚙ `agni_total` → `it_80_cch` (JSON `AnyOthSec80CCH`).

#### Drill-in: 80D — Health Insurance Premium (source: itr1.html:3833-3935)
Meta: `Caps: Self/Family ₹25K (senior ₹50K) + Parents ₹25K (senior ₹50K); Health check-up ₹5K each`. Top checkbox: `Premium is paid in lump sum covering more than 1 year` (`d80d_lumpsum`) — enables multi-year spread (Earlier-yrs portion / C/F columns).
Grid `Health Insurance Premium`, headers `Insured Person | Name of Insurance Company | Policy Number | Premium paid | No. of years | Earlier yrs. portion ⚙ | Deduction in CY ⚙ | Premium C/F ⚙`; fixed rows: `Parents — Senior Citizen (Resident)` (`d80d_par_sc_co/_pol/_prem/_yrs` + ⚙ `_eyp/_cy/_cf`) · `Parents — Others (non-senior)` (`d80d_par_ot_*`) · `Self / Family — Senior Citizen (Resident)` (`d80d_sel_sc_*`) · `Self / Family — Others (non-senior)` (`d80d_sel_ot_*`).
Grid `Health check-up and Medical expenses`, headers `Person | Medical expenses (senior, no insurance) | Health check-up (max ₹5,000)`; same 4 person rows (`_med`, `_chk`; non-senior `_med` placeholder `(senior only)`).
Grid `Break-up of deductible amount (auto)` — all ⚙: `Person | Insurance Premium | Medical expenses | Health check-up | Category cap (₹50,000/₹25,000 fixed text) | Deduction` (`d80d_brk_*`).
Grand ⚙ `Total deduction u/s 80D {d80d_total} (max ₹25K+₹25K=₹50K non-senior, up to ₹1L if both senior)` → `it_80_d`.

#### Drill-in: 80DD — Medical treatment of Handicapped Dependent (row label `80DD: Medical treatment of Handicapped`) (source: itr1.html:3938-3958)
Meta: `Flat deduction: ₹75,000 (normal) / ₹1,25,000 (severe ≥80%)`. Note: `Fixed flat deduction — actual expenses are NOT required (only deposit in approved scheme or maintenance). Conditions: dependent is a person with disability as defined u/s 2(i) of RPWD Act, 2016. If disability is 80% or more, it is "severe".`
`Name of dependent` (`d80dd_name`) · `Relationship` (`d80dd_relation`, placeholder Spouse / Child / Parent / Sibling) · `Suffering from severe disability (≥80%)?` checkbox label `Yes — severe (deduction ₹1,25,000)` (`d80dd_severe`) · `Type of disability` (`d80dd_type`, placeholder e.g. Blindness / Low vision / Locomotor...) · `UDID Number (if available)` (`d80dd_udid`) · `Eligible deduction` ⚙ `d80dd_deduction` → `it_80_dd`.

#### Drill-in: 80DDB — Medical treatment of specified diseases (source: itr1.html:3961-3981)
Meta: `Cap: ₹1,00,000 senior / ₹40,000 others; less insurance reimbursement`. Note: `Deductible amount = min(actual expenses, cap) − amount received from insurer/employer. Specified diseases listed in Rule 11DD (neurological diseases, malignant cancers, AIDS, chronic renal failure, haematological disorders). Certificate from specialist required.`
`Person for whom treatment incurred` (`d80ddb_person`, placeholder Self / Spouse / Child / Parent / Sibling) · `Nature of disease (as per Rule 11DD)` (`d80ddb_disease`) · `Patient is Senior Citizen (age ≥ 60)?` checkbox label `Yes — cap ₹1,00,000; non-senior cap ₹40,000` (`d80ddb_senior`) · `Actual expenses incurred` (`d80ddb_expenses`) · `Amount received from insurer / employer` (`d80ddb_reimbursed`) · `Eligible deduction (auto)` ⚙ `d80ddb_deduction` → `it_80_ddb`.

#### Drill-in: 80E — Interest on Education Loan repaid (source: itr1.html:3984-4005)
Meta: `100% of interest paid, no ceiling; available 8 consecutive AYs from first repayment`. Header button `+ Add loan` (`add80eBtn`). Note: `Deduction available on interest (NOT principal) paid on education loan taken from an approved financial institution or approved charitable institution, for higher education (self / spouse / children / student for whom assessee is legal guardian). No ceiling on amount. Available for 8 consecutive AYs from the year in which interest repayment begins.`
Grid: `Lending institution | Loan Account No. | Student (relation) | Sanction Date | First repayment AY | Interest paid this year | ✕` (`s80e_{i}_bank/_acct/_stud/_sdate/_fay/_int`). Grand ⚙ `Total deduction u/s 80E (full interest; no cap)` `d80e_total` → `it_80_e`.

#### Drill-in: Investments u/s 80C, 80CCC, 80CCD (row label `Investment u/s 80C, CCC, CCD`) (source: itr1.html:3746-3830)
Meta: `Sec 80CCE aggregate cap ₹1,50,000 on (80C + 80CCC + 80CCD(1)); 80CCD(1B) additional ₹50,000; 80CCD(2) employer NPS — no cap`. Note: `Under new regime (Sec 115BAC): only 80CCD(2) employer contribution to NPS is available (plus 80CCH Agniveer and 80JJAA). Old regime: full ₹1.5L cap + ₹50K NPS additional + employer NPS.`
Section `Deductions u/s 80C` (`add80cBtn` `+ Add row`): grid `Category | A/c No. / Doc. ID / Receipt No. | Amount | Date | ✕`; Category dropdown options: `(Select category)` · Deferred Annuity · Deposit in Sukanya Samriddhi Account · Duty/fees/expenses for transfer of Residential Property · ELSS · Housing loan repayment · Instalment towards cost of Residential Property · Life insurance premium · NPS contribution by Central Govt. Employee to specified account - 80C(2)(xxv) · NSC Interest (re-invested) · NSC Investment · PF contribution · Post Office Time Deposit · PPF contribution · Superannuation fund contribution · Senior citizen savings scheme deposit · Time Deposit in Bank · Tuition fees · Others (`s80c_{i}_cat/_acc/_amt/_date`). Sub-line ⚙: `80C raw total: {s80c_raw_total} · (incl. NSC VIII Issue reinvested interest auto-pulled from OS: {s80c_nsc_carry})` (display-only hint; NOT auto-added).
Section `Pension fund contribution u/s 80CCC` (`add80cccBtn`): grid `Description | PRAN / Doc. ID / Policy No. | Retirement A/c No. (PRAN)? | Amount | ✕` (`s80ccc_{i}_…`); sub-line ⚙ `80CCC raw total`.
Section `NPS contribution u/s 80CCD` — fixed table `Particulars | Contribution | Deduction allowable`: `Assessee's contribution` (`s80ccd_contrib`) · `Deduction u/s 80CCD(1) — within 80CCE ₹1.5L cap (max 10% of salary; 20% self-employed)` (`s80ccd1`) · `— u/s 80CCD(1B) — additional ₹50,000 outside cap` (`s80ccd1b`, capped 50,000 in compute) · `Employer's contribution u/s 80CCD(2) — no cap; available in NEW regime too` (`s80ccd2_contrib`, ⚙ `s80ccd2`) · `Total NPS deduction` ⚙ `s80ccd_total`.
Grand (Cap Summary, all ⚙): `Sec 80CCE aggregate cap calculation: 80C: {cap_80c} + 80CCC: {cap_80ccc} + 80CCD(1): {cap_80ccd1} = {cap_80cce_raw} → capped at ₹1,50,000 → {cap_80cce_final}` · `Plus 80CCD(1B): {cap_80ccd1b} (cap ₹50K) · Plus 80CCD(2) employer: {cap_80ccd2}` · `Total Chapter VI-A from 80C/CCC/CCD bundle {cap_total}` + conditional warning `⚠ New regime: only 80CCD(2) allowed` (shown under New regime) → `it_80_ccccd`.

#### Drill-in: Other Chapter VI-A Deductions (row label `Other Chapter VI-A deductions (80G/80GG/80TTA/80TTB/80U…)`) (source: itr1.html:4008-4302)
Meta: `80U · 80G · 80GGA · 80GGC · 80GG · 80TTA/TTB · 80EE/EEA/EEB · 80IA/IB/IE`. Sub-sections:
- **80U — Income of person with disability (Self)** — note `Flat deduction: ₹75,000 (normal disability) / ₹1,25,000 (severe ≥80%). Available in old regime only.` Fields: `Suffering from severe disability (≥80%)?` checkbox label `Yes — ₹1,25,000; No — ₹75,000` (`d80u_severe`) · `Type of disability` (`d80u_type`, placeholder Blindness / Low vision / Autism / etc.) · `UDID Number (if available)` (`d80u_udid`) · `Eligible deduction` ⚙ `d80u_ded`.
- **80G — Donations to approved funds/institutions** — note `Cash > ₹2,000 per donation is disallowed (per Sec 80G(5D)). Qualifying limit (for "with ceiling" rows) = 10% of Adjusted GTI.` Two grids `Donations with 50% deduction` (`add80g50Btn`) and `Donations with 100% deduction` (`add80g100Btn`), headers `Name of Donee | Subject to ceiling? (checkbox) | Donation amount | PAN | Address | City | State | Paid in Cash? (checkbox) | IFS Code | Txn Ref / Cheque No. | ✕` (binds `g50_{i}_*` / `g100_{i}_*`). ⚙ Sub-tables: `Total 50% donations {d80g50_total}` · `50% with ceiling: qualifying amount {d80g50_wc_qual}` · `Deductible amount — 50% {d80g50_ded}`; 100% equivalents (`d80g100_*`); `Total 80G deduction {d80g_total}` · `Total Income for qualifying limit (10%) {d80g_agti}`.
- **80GGA — Donation for scientific research / rural development** (`add80ggaBtn`) — note `100% deduction; no ceiling. Cash > ₹10,000 disallowed.` Grid `Name of Donee | Clause of 80GGA(2) | Donation amount | PAN | Address | City | State | Pin code | Paid in Cash? | ✕` (`gga_{i}_*`, clause placeholder `2(a)/(b)...`). ⚙ `Eligible donation: {d80gga_ded}`.
- **80GGC — Contribution to political party** (`add80ggcBtn`) — note `100% deduction; no cash contributions allowed (all must be via banking channels).` Grid `Particulars | Amount | Paid in Cash? | Date | IFS Code | Txn Ref / Cheque No. | Party Name | Party PAN | ✕` (`ggc_{i}_*`). ⚙ `Eligible Contribution: {d80ggc_ded}`.
- **80GG — Deduction for House Rent paid (no HRA)** — note `Available only if NOT in receipt of HRA from employer. Deduction = min of: (a) Rent paid − 10% of Total Income, (b) 25% of Total Income, (c) ₹60,000. Not available in new regime.` Fields: `Actual rent paid during the year` (`d80gg_rent`) · ⚙ `Total Income for deduction u/s 80GG (auto from TI)` `d80gg_ti` · ⚙ `Rent paid in excess of 10% of total income (a)` `d80gg_a` · ⚙ `25% of total income (b)` `d80gg_b` · `Limit specified (c)` fixed `₹60,000` · ⚙ `Allowable deduction (min of a, b, c)` `d80gg_ded`.
- **80TTA / 80TTB — Interest Deduction** — note `80TTA: Non-senior citizens — min(SB a/c interest, ₹10,000). 80TTB: Senior citizens (age≥60) — min(ALL interest from banks/PO/co-op, ₹50,000). These are old regime only. Also auto-hooks into interest from sf-os-interest.` Fields: `Interest on Savings Bank a/c (for 80TTA — non-senior)` (`d80tta_sbint`, ⚙ `d80tta_ded` "80TTA: ₹0") · `Total interest from Bank / PO / Co-op (for 80TTB — senior citizens)` (`d80ttb_allint`, ⚙ `d80ttb_ded`) · ⚙ `Deduction applied (80TTA or 80TTB, age-based)` `d80tta_ttb_ded` (age from client-bar DOB).
- **80EE / 80EEA / 80EEB — Additional Housing / EV Loan Interest** — note `80EE: Housing loan sanctioned FY 2016-17 — max ₹50,000. 80EEA: Housing loan sanctioned FY 2019-20 to 2021-22 (stamp duty ≤₹45L) — max ₹1,50,000 (over & above Sec 24 limit). 80EEB: Electric vehicle loan — max ₹1,50,000.` Three grids (`add80eeBtn`/`add80eeaBtn`/`add80eebBtn`), common headers `Loan taken from | Bank / Institution | Loan Account No. | Sanction Date | Total loan amount | Closing Balance | Interest paid | … | ✕`; 80EEA extra column `Stamp duty value of property` (`d80eea_{i}_stamp`); 80EEB extra column `Vehicle Reg. No.` (`d80eeb_{i}_vreg`). ⚙ `Total interest (max ₹50,000): {d80ee_ded}` / `(max ₹1,50,000): {d80eea_ded}` / `(max ₹1,50,000): {d80eeb_ded}`.
- **80IA — Infrastructure development (sub-section 4)** — fixed rows `Power — clause (iv)` (+nested input placeholder "Sub-section details" `d80ia_power_nature`) and `Others`; columns `Nature of undertaking [sub-section 4] | Profits | Year | % | Amount ⚙ | Total ⚙` (`d80ia_power_*` / `d80ia_oth_*`). ⚙ `Total 80IA: {d80ia_total}`.
- **80IB — Other industrial undertakings** — fixed rows `Housing projects (Sub-section 10)` · `Preservation of food (Sub-section 11A)` · `Transportation of food grains (Sub-section 11A)` (`d80ib_housing_*`/`_food_*`/`_grain_*`). ⚙ `Total 80IB: {d80ib_total}`.
- **80IE — Special category states (North-East)** — fixed rows `Assam · Arunachal Pradesh · Manipur · Mizoram · Meghalaya · Nagaland · Sikkim · Tripura`, columns `State | Profits | Year | % | Amount ⚙ | Total ⚙` (`d80ie_{state}_p/_y/_pct`). ⚙ `Total 80IE: {d80ie_total}`.
Grand ⚙: `Total Other Chapter VI-A deductions (80U + 80G + 80GGA + 80GGC + 80GG + 80TTA/TTB + 80EE/EEA/EEB + 80IA/IB/IE): {d80other_total}` → `it_80_other`; 80IA/IB/IE totals also feed AMT add-back (`amt_80ia/ib/ie`).
Discrepancy note: 80GGA/80GGC/80EE/80EEA/80EEB/80IA/IB/IE and several others are not valid ITR-1 deductions but are collectable here; also `chapVIA()` in the outer export reads cells `it_80_c`, `it_80_ccc`, `it_80_ccd1`, `it_80_ccd1b`, `it_80_ccd2`, `it_80_g`, `it_80_gg`, `it_80_u`, `it_80_tta`, `it_80_ttb` that do **not exist** in the calc DOM (only bundle totals exist), so those JSON per-section fields export as 0 while `TotalChapVIADeductions` carries the real total.

### Particular: tail rows below Chapter VI-A (itr1.html:2336-2362) — shared ladder lines (Total Income · Tax rate/regime · Tax on total income · Balance tax payable) are in COMPUTATION-COMMON.md. ITR-1-reachable drill rows:

`Agricultural Income:` [⋯ → Agricultural Income] ⚙ `it_agri` · `Relief u/s 89 - Arrears of Salary / Family pension` [⋯ → sf-rel89-arrears] ⚙ `it_rel89_arrears` · `Relief u/s 89 - Commutation of Pension` [⋯ → sf-rel89-commute] ⚙ `it_rel89_commute` · `Relief u/s 89 - Compensation on Termination` [⋯ → sf-rel89-comp] ⚙ `it_rel89_comp` · `Relief u/s 89 - Gratuity` [⋯ → sf-rel89-gratuity] ⚙ `it_rel89_gratuity` · `Relief u/s 90 to 91` [⋯ → sf-rel90] ⚙ `it_rel90` · `AMT u/s 115JC (old regime only)` / `Less: AMT Credit u/s 115JD set off` / `Tax payable (after AMT comparison)` [all three ⋯ → sf-amt] ⚙ `it_amt_115jc` / `it_amt_credit` / `it_taxPayable_amt` · `TDS / TCS:` [⋯ → sf-tdstcs] ⚙ `it_tdstcs` · `Advance Tax` [⋯ → sf-advtax] ⚙ `it_advtax` · `Self-assessment tax paid` [⋯ → sf-sat] ⚙ `it_sat` · `Filing Details (Section, dates, audit)` [⋯ → sf-filing] status text `(not specified)` (`it_filing_status`) · `Interest u/s 234A — Late filing` / `Interest u/s 234B — Advance Tax shortfall` / `Interest u/s 234C — Quarterly Adv Tax deferment` / `Late filing fee u/s 234F` / `Total Interest + Fee (234A+B+C+F)` [all ⋯ → sf-int-234] ⚙ `it_int_234a/b/c`, `it_fee_234f`, `it_int_total` · `Incomes fully exempt` [⋯ → sf-schedule-ei] ⚙ `it_exempt` · `Loss Carry-Forward (Schedule CFL)` [⋯ → sf-loss-cfl] ⚙ `it_loss_cfl_total` · `Footnotes / Pending issues` row carries label `Prepared by` + input `it_preparedby` · `List of documents` row carries label `Approved by` + input `it_approvedby` (these two ⋯ cells are inert — no data-sf; discrepancy: drill glyph shown but nothing opens).

#### Drill-in: Agricultural Income (source: itr1.html:3559-3588)
Meta: `Sec 10(1) — exempt; old-regime aggregation for rate determination`. Note: `Agricultural income is exempt under Sec 10(1). Under the old regime, if agri income > ₹5,000 AND non-agri TI > basic exemption, partial-integration applies: tax = [tax on (TI + agri)] − [tax on (basic exemption + agri)]. Under the new regime, agri income is fully exempt with no aggregation. Gross Receipts here exclude income exempt under Rule 7, 7A, 7B or 8.`
`Gross Receipts (excluding Rule 7/7A/7B/8 exempt)` (`agri_gross`) · `Less: Expenditure` (`agri_expenditure`) · section `B/F agricultural loss of last 8 assessment years` (`addAgriBfBtn` `+ Add row`): grid `Assessment Year | B/F Agricultural Loss | ✕` (`agri_bf_{i}_ay` placeholder 2018-19, `_amt`) · `Net Agricultural Income (after B/F losses)` ⚙ `agri_net` → `it_agri`; old-regime slab aggregation (`baseTaxWithAgri` itr1.html:10183); also ⚙ into Schedule EI `Agricultural income (auto from sf-agri)`.

#### Drill-in: Relief u/s 89 — Arrears of Salary / Family Pension (source: itr1.html:4971-5000; fields itr1.html:10385)
Meta: `Section 89(1) — spread method · Form 10E required`. Note ends `…Form 10E filing is mandatory before claiming this relief. Enter past AY data below; final relief can be overridden manually after offline computation.`
Grid `AY-wise inputs (Current AY 2026-27 + past 3 AYs shown; extend offline if more years needed)`, columns `Particulars | 2026-27 | 2025-26 | 2024-25 | 2023-24`; input rows (per `REL89_INPUT_FIELDS`; Arrears keeps all 8): `Salary u/s 15 (excluding lump-sum)` · `Arrears of Salary` (the variant special row) · `Arrears of Family pension (Arrears only)` · `Income exempt (included in lump-sum)` · `Tax on employment (Sec 16(iii))` · `Other income` · `Deduction Under Chapter VI-A` · `Qualifying amount of Investments u/s 88 (Arrears only)` (binds `rel89_arrears_{field}_{2627|2526|2425|2324}`).
Section `Final Tax Relief u/s 89 — Arrears`: ⚙ `Tax on receipt basis (b) — lump-sum current AY` `rel89_arr_taxReceipt` · ⚙ `Tax on accrual basis (a) — spread to relevant AYs` `rel89_arr_taxAccrual` · ⚙ `Tax Relief u/s 89 (b − a) — computed` `rel89_arr_computed` · `Manual override (final relief) — leave blank to use computed` (`rel89_arr_override`, placeholder "Enter final relief if computed offline") · ⚙ `Tax Relief applied` `rel89_arr_applied` → `it_rel89_arrears`.

#### Drill-in: Relief u/s 89 — Commutation of Pension (source: itr1.html:5003-5032)
Same 4-AY grid minus Arrears-only rows (special row label `Commutation of Pension`). Tail ⚙/inputs: `Average rate of past 3 AYs (b)` `rel89_com_avgRate` · `Tax at current AY rate (a)` `rel89_com_taxCurr` · `Tax at average past-3-year rate (b)` `rel89_com_taxAvg` · `Tax Relief u/s 89 (a − b) — computed` `rel89_com_computed` · `Manual override (final relief)` (`rel89_com_override`, placeholder "Leave blank to use computed") · `Tax Relief applied` ⚙ `rel89_com_applied` → `it_rel89_commute`.

#### Drill-in: Relief u/s 89 — Compensation on Termination (source: itr1.html:5035-5064)
Note: `Average-rate method applied to retrenchment / VRS / termination compensation taxable as Salary u/s 17(3). Same formula as Commutation of Pension.` Same structure; ids `rel89_cmp_*`, override `rel89_cmp_override` → `it_rel89_comp`. Special row label `Compensation on Termination`.

#### Drill-in: Relief u/s 89 — Gratuity (Past service 15 years or more) (source: itr1.html:5067-5096)
Note: `Relief on gratuity received in lump-sum where past service is 15 years or more (full average-rate spread). For 5–15 years service, only half the relief applies. Computed via the average-rate method — same as Commutation/Compensation.` Ids `rel89_gra_*`, override `rel89_gra_override` → `it_rel89_gratuity`. Special row label `Gratuity - Past service 15 years or more`.

#### Drill-in: Relief u/s 90 / 90A / 91 — Foreign Tax Credit (row label `Relief u/s 90 to 91`) (source: itr1.html:5099-5129; renderer itr1.html:10561)
Meta: `DTAA / Bilateral / Unilateral relief · Form 67 required`. Note: `Sec 90/90A: Relief under bilateral DTAA agreements with notified specified associations. Sec 91: Unilateral relief where no DTAA exists. Per Rule 128, Form 67 must be filed before due date of return to claim FTC. Relief = lower of [tax paid abroad on the doubly-taxed income] OR [Indian tax on that income at average Indian rate].`
Header button `+ Add country` (`addRel90Btn`). Section `Country-wise foreign tax credit` with toggle checkbox `Do you want to enter data for Form 67? (shows extra columns)` (`rel90_form67`).
Grid base headers: `Country Name | Income | Tax paid outside India | Tax payable in India | Relief claimed | Taxpayer Identification No. | Heads of income | Article of DTAA | Section of relief` (+ remove col). Conditional (Form 67 checked, UI-verified 10 → 15 columns): `DTAA rate | Tax under normal provisions - IT Act | Tax u/s 115JC | Tax rate outside India | Nature of income`. Binds `rel90_{i}_country/_income/_tOut/_tIn/_relief/_tin/_head/_art/_sec` (+ `_dtaaRate/_taxNorm/_tax115JC/_outRate/_nature`).
Section `Relief claimed earlier but refunded by foreign tax authority during the year`: `AY of claiming relief` (`rel90_refundAY`, placeholder 2024-25) · `Tax refunded` (`rel90_refundAmount`).
Grand ⚙: `Total relief claimed (Sec 90/90A/91) {rel90_total} · Less: Refunded in CY {rel90_refund_disp} · Net relief applied {rel90_net}` → `it_rel90`.

#### Drill-in: Alternate Minimum Tax (AMT) u/s 115JC + Credit u/s 115JD (rows `AMT u/s 115JC (old regime only)` etc.) (source: itr1.html:4628-4722)
Meta: `Applies to non-corporate assessees claiming Part C deductions / 10AA / 35AD · ONLY in old regime`. Long note verbatim in source (AMT = 18.5% × ATI + surcharge + 4% cess; applies only if ATI > ₹20 lakh; excess carried forward as AMT Credit u/s 115JD for 15 AYs).
`Step 1 — Adjusted Total Income (ATI)`: ⚙ `Total Income (TI) — from main computation` `amt_ti` · ⚙ add-backs `80IA — Infrastructure development` `amt_80ia` · `80IB — Industrial undertakings` `amt_80ib` · `80IE — North-Eastern States` `amt_80ie` · `Total Part C add-back` `amt_addbackC` · inputs `Sec 10AA deduction (SEZ profits)` (`amt_10aa`) · `Sec 35AD addback (deduction less depreciation u/s 32)` (`amt_35ad`, helper "35AD deduction claimed minus what depreciation would have been allowable u/s 32") · `Other addbacks (specify in remarks)` (`amt_other`) · ⚙ `Adjusted Total Income (ATI)` `amt_ati`.
`Step 2 — AMT computation (only if ATI > ₹20 lakh)`: ⚙ `ATI threshold check` `amt_threshold_status` (default text "ATI ≤ ₹20L — AMT not applicable") · ⚙ `AMT base @ 18.5% × ATI` `amt_base` · ⚙ `Surcharge rate (based on ATI slab)` `amt_sc_rate` · ⚙ `Surcharge amount` `amt_sc` · ⚙ `Cess @ 4%` `amt_cess` · ⚙ `Total AMT u/s 115JC` `amt_total`.
`Step 3 — Compare AMT vs Normal Tax`: ⚙ `Normal Tax (after Relief 89/90)` `amt_normalTax` · ⚙ `AMT u/s 115JC` `amt_amtAmount` · ⚙ `Higher of two` `amt_higher` · ⚙ `Which applies?` `amt_applicableSection` (default "Normal Tax applies").
`Step 4 — AMT Credit u/s 115JD (carry forward / set off)`: input `AMT Credit Brought Forward from prior years` (`amt_credit_bf`) · ⚙ `Credit Generated CY (if AMT > Normal Tax)` `amt_credit_gen` · ⚙ `Credit Set Off CY (if Normal > AMT and B/F > 0)` `amt_credit_used` · ⚙ `AMT Credit C/F (15 AYs)` `amt_credit_cf`.
Grand ⚙: `Tax payable after AMT/Credit = {amt_taxForLiability}` (helper "This becomes the base for Interest u/s 234A/B/C calculation") → `it_amt_115jc`, `it_amt_credit`, `it_taxPayable_amt`.

#### Drill-in: TDS / TCS (source: itr1.html:3591-3743)
Note: `Data can be auto-filled directly from Form 26AS. ^ Not required for ITR-1. TDS / TCS transferred to/from others happens u/s 5A (spouse, Portuguese Civil Code) or Rule 37BA(2) / 37-I(1A)(a) (when income is assessable in another person's hands).`
Top checkbox: `TDS / TCS transferred to/from others (u/s 5A or rule 37BA(2) and 37-I(1A)(a))?` (`tds_transferred`) — flag only (no extra UI).
Seven repeat-grids, all with `+ Add row` buttons (`addTds16ABtn`, `addTds16ABfBtn`, `addTdsSalaryBtn`, `addTcsBtn`, `addTcsBfBtn`, `addTds16BcdeBtn`, `addTds16BcdeBfBtn`) and per-row `✕`. Head-of-Income dropdown options (`HEAD_OF_INCOME_OPTS`): `(Head)` (empty) · Salary · House Property · Business / Profession · Capital Gains · Other Sources · Exempt income.
1. `TDS as per Form 16A (other than salary)` — headers `Name of the Deductor | TAN | TDS deducted | TDS claimed CY | Balance TDS C/F | Gross Receipts (26AS) | Head of Income | Gross receipt offered | FY of TDS | Section | ✕` (`tds_16a_{i}_name/_tan/_ded/_clm/_cf/_gr/_head/_off/_fy(placeholder 2025-26)/_sec(placeholder 194A)`).
2. `Unclaimed TDS (Form 16A) B/F` — identical columns (`tds_16abf_*`).
3. `TDS from Salaries (Form 16)` — `Name of the Employer | TAN | TDS deducted | TDS claimed | Gross Salary | ✕` (`tds_sal_{i}_emp/_tan/_ded/_clm/_sal`).
4. `Tax Collected at Source (TCS)` — `Name of the Collector | TAN | TCS collected | TCS claimed CY | Balance TCS C/F | Expenditure (26AS) | FY of TCS | ✕` (`tcs_{i}_*`).
5. `Unclaimed TCS B/F` — same (`tcs_bf_{i}_*`).
6. `TDS as per Form 16B (194-IA) / 16C (194-IB) / 16D (194M) / 16E (194S)` — like 16A but `PAN` instead of TAN, Section placeholder `194-IA` (`tds_16bcde_*`).
7. `Unclaimed TDS — Form 16B (194-IA) / 16C (194-IB) / 16D (194M) / 16E (194S) B/F` (`tds_16bcdebf_*`).
Grand ⚙: `Total TDS / TCS credit claimed in CY {tdstcs_total}` + breakdown `Form 16A: {tdstcs_16a_total} · 16A B/F: {tdstcs_16abf_total} · Salary: {tdstcs_salary_total} · TCS: {tdstcs_tcs_total} · TCS B/F: {tdstcs_tcsbf_total} · 16B-E: {tdstcs_16bcde_total} · 16B-E B/F: {tdstcs_16bcdebf_total}` → sheet `it_tdstcs`; `__taxBreakup.tdsTcs`; 234A/B bases.

#### Drill-in: Advance Tax (source: itr1.html:3509-3529)
Meta: `Tax paid in challans during FY 2025-26`. Note: `Advance Tax challans (ITNS 280, Code 100). Quarterly due dates: 15-Jun (15%), 15-Sep (45% cumulative), 15-Dec (75% cumulative), 15-Mar (100% cumulative). Shortfall attracts 234B/C interest. Data can be imported from AIS.`
Header `+ Add row` (`addAdvTaxBtn`). Grid: `Name of the Bank | BSR Code | Date of deposit | Challan Sl. No. | Amount | ✕` (`advtax_{i}_bank/_bsr(placeholder "7-digit BSR")/_date(DD/MM/YYYY)/_chal/_amt`). Grand ⚙ `Total advance tax paid {advtax_total}` → `it_advtax`; challan dates feed 234C quarterly paid-by-date cells.

#### Drill-in: Self-Assessment Tax paid (row `Self-assessment tax paid`) (source: itr1.html:3532-3556)
Note: `Self-Assessment tax challans (ITNS 280, Code 300). Amount paid splits into the Income tax portion (counts as prepaid tax credit) and Interest/Fee portion (offsets 234A/B/C/F interest separately). Data can be imported from Form 26AS.`
Header `+ Add row` (`addSatBtn`). Grid: `Name of the Bank | BSR Code | Date of deposit | Challan Sl. No. | Amount paid | Income tax portion | Interest / Fee portion | ✕` (`sat_{i}_bank/_bsr/_date/_chal/_paid/_tax/_int`). Grand ⚙ `Total amount paid {sat_amount_total} · Income tax portion (credit) {sat_inctax_total} · Interest/Fee {sat_interest_total}` → `it_sat` (income-tax portion only); interest portion offsets 234 totals.

#### Drill-in: Filing Details (row `Filing Details (Section, dates, audit)`) (source: itr1.html:4305-4436)
Meta: `Section 139 / Due dates / Audit flag — drives Interest u/s 234A and Late Filing Fee u/s 234F`. Note: `Due date for AY 2026-27 (income earned in FY 2025-26): 31-Jul-2026 (non-audit individuals/HUF/firm without audit) or 31-Oct-2026 (audit u/s 44AB / company / firm with audit). Filing after the due date attracts interest u/s 234A (1% per month, simple, on unpaid tax) and late filing fee u/s 234F (₹1,000 if TI ≤ ₹5L, else ₹5,000).`
Section `Return filing particulars`:
| Label | Type | Options | Default | Binds |
|---|---|---|---|---|
| Filing under Section | dropdown | 139(1) — Normal return (filed within due date) · 139(4) — Belated return (filed after due date) · 139(5) — Revised return · 139(8A) — Updated return (ITR-U) · 142(1) — In response to notice from AO · 148 — Reassessment notice · 153A — Search/Requisition assessment · 119(2)(b) — Condonation of delay · 92CD — Modified return (APA) | 139(1) | `filing_section` |
| Audit u/s 44AB applicable? | checkbox `Yes — due date becomes 31-Oct-2026` | — | unchecked | `filing_audit44AB` |
| Transfer Pricing / Sec 92E applicable? | checkbox `Yes — due date becomes 30-Nov-2026` | — | unchecked | `filing_tp` |
| Due date (auto) | ⚙ | — | 31-Jul-2026 | `filing_dueDate` |
| Date of filing return | text | — | — (DD/MM/YYYY) | `filing_dateOfFiling` |
| Filing status (auto) | ⚙ | — | Not specified | `filing_statusDetail` |
| Months late (for 234A calc) — auto | ⚙ | — | 0 | `filing_monthsLate` |
Conditional blocks (UI-verified): section = **139(5)** → `Revised Return u/s 139(5) — Original return details`: `Original return acknowledgment number` (`filing_origAckNo`) · `Original filing date` (`filing_origDate`). section ∈ **{148, 142(1), 153A}** → `Notice details`: `Date of notice (148 / 142(1) / 153A)` (`filing_noticeDate`) · `DIN / Notice reference number` (`filing_noticeRef`). section = **139(8A)** → `Updated Return u/s 139(8A) — Additional details` + note `Updated returns under 139(8A) carry additional tax: 25% of (tax + interest) if filed within 12 months, 50% if filed within 12-24 months, 60% if 24-36 months, 70% if 36-48 months of end of AY.` + `Reason for updating` dropdown: `(Select reason)` · Return previously not filed · Income not reported correctly · Wrong head of income chosen · Reduction of carried-forward loss · Reduction of unabsorbed depreciation · Reduction of MAT/AMT credit · Wrong rate of tax · Others (`filing_updReason`).
Footer: `This sub-form drives: Interest u/s 234A (months from due date to filing date × 1% × unpaid tax) and Late Filing Fee u/s 234F (₹1,000 if TI ≤ ₹5L, ₹5,000 otherwise; nil if filed by due date).` Feeds `it_filing_status`, 234A/F. AY diff: 2025-26 file note/logic text still says "AY 2025-26" but uses the same 2026 due dates (see AY-diff table).

#### Drill-in: Interest u/s 234A / B / C + Late Filing Fee u/s 234F (rows 234A/B/C/F + total) (source: itr1.html:4489-4625)
Note: `Interest is computed automatically based on Filing Details (months late from due date), Advance Tax challan dates (for 234C quarterly check), and the final tax liability. Each section can be manually overridden if a specific scenario requires it — e.g., Capital Gains arising after a quarter's due date is exempt from that quarter's 234C; or where an assessee has filed responding to specific notices.`
`Interest u/s 234A — Late filing of return (1% per month)` table: ⚙ `Tax on Total Income (after Relief 89/90)` `int_234a_tax` · ⚙ `Less: TDS / TCS` `int_234a_tds` · ⚙ `Less: Advance Tax paid` `int_234a_adv` · ⚙ `Unpaid tax (base for 234A)` `int_234a_unpaid` · ⚙ `Months late (from Filing Details, ceiling)` `int_234a_months` · ⚙ `Auto interest @ 1% × months × unpaid` `int_234a_auto` · input `Manual override (leave blank for auto)` (`ov_234a`) · ⚙ `Interest u/s 234A applied` `int_234a_applied`.
`Interest u/s 234B — Default in payment of Advance Tax (1% per month)`: ⚙ `Assessed tax (Tax − TDS − Reliefs)` `int_234b_assessed` · ⚙ `Advance Tax paid` `int_234b_adv` · ⚙ `90% threshold (no interest if AdvTax ≥ 90%)` `int_234b_threshold` · ⚙ `Shortfall (if AdvTax < 90% of assessed)` `int_234b_shortfall` · ⚙ `Months (1-Apr-2026 to filing/assessment date)` `int_234b_months` · ⚙ `Auto interest @ 1% × months × shortfall` `int_234b_auto` · input `Manual override` (`ov_234b`) · ⚙ `Interest u/s 234B applied` `int_234b_applied`.
`Interest u/s 234C — Quarterly Advance Tax deferment` + note `Quarterly cumulative requirement: 15% / 45% / 75% / 100% of assessed tax. Interest @ 1% × 3 months on shortfall (Q1-Q3), 1% × 1 month for Q4. For Q1-Q2, safe harbor applies if cumulative payment ≥ 12% / 36% respectively (not applied here — manual override available).` Grid (all ⚙ except months fixed 3/3/3/1): `Quarter (due date) | Required cumulative | Adv Tax paid by date | Shortfall | Months | Interest`; rows `Q1 (by 15-Jun-2025) — 15%` · `Q2 (by 15-Sep-2025) — 45%` · `Q3 (by 15-Dec-2025) — 75%` · `Q4 (by 15-Mar-2026) — 100%` (`int_234c_q{n}_req/_paid/_short/_int`). Then ⚙ `Total 234C interest (auto)` `int_234c_auto` · input `Manual override` (`ov_234c`) · ⚙ `Interest u/s 234C applied` `int_234c_applied`.
`Late Filing Fee u/s 234F`: ⚙ `Filing status (from Filing Details)` `int_234f_status` · ⚙ `Total Income (TI)` `int_234f_ti` · `Fee structure` fixed text `TI ≤ ₹2.5L → nil · TI ≤ ₹5L → ₹1,000 · TI > ₹5L → ₹5,000` · ⚙ `Auto-computed fee` `int_234f_auto` · input `Manual override` (`ov_234f`) · ⚙ `Fee u/s 234F applied` `int_234f_applied`.
`SAT Interest Portion (already paid — offsets total)`: ⚙ `Interest/Fee portion of SAT challans already paid` `int_satOffset` · fixed note row `Note: Reduces 234A/B/C/F effective payable — Captured in Self-Assessment Tax sub-form`.
Grand ⚙: `Total Interest + Fee (234A+B+C+F) {int_total_applied} · SAT Interest paid: {int_satOffsetDisp} · Net interest/fee payable: {int_net_payable}` → sheet `it_int_234a/b/c`, `it_fee_234f`, `it_int_total`; JSON `IntrstPay` (2026-27 real values; 2025-26 zeros).

#### Drill-in: Schedule EI — Exempt Income (Disclosure) (row `Incomes fully exempt`) (source: itr1.html:4725-4812)
Meta: `For disclosure in ITR · Does NOT affect tax computation (income already excluded from TI)`.
Section `1. Salary-related exemptions u/s 10`: `HRA exemption u/s 10(13A)` (helper "From Salary sub-form if entered there; can be added here for completeness", `ei_hra`) · `LTA / Leave Travel Allowance u/s 10(5)` (`ei_lta`) · `Gratuity exempt u/s 10(10)` (`ei_gratuity`) · `Pension commutation u/s 10(10A)` (`ei_commute`) · `Leave encashment u/s 10(10AA)` (`ei_leaveEnc`) · `Voluntary retirement compensation u/s 10(10C)` (`ei_vrs`) · `Other Sec 10 allowances (travel, transport etc.)` (`ei_otherAllow`) · ⚙ `Salary-related total` `ei_salaryTotal`.
Section `2. Investment / Interest / Dividend exemptions`: `Interest on PPF / EPF u/s 10(11), 10(12)` (`ei_ppfInt`) · `Interest on Sukanya Samriddhi u/s 10(11A)` (`ei_sukanya`) · `PF withdrawal exempt (after 5+ years)` (`ei_pfWith`) · `Dividend exempt (specific Sec 10 items)` (helper "Note: General dividends are now taxable from AY 2021-22", `ei_divExempt`) · `LTCG exempt — legacy Sec 10(38) / grandfathered` (`ei_ltcgExempt`) · ⚙ `Investment-related total` `ei_invTotal`.
Section `3. Other exempt incomes`: `Share of profits from partnership firm u/s 10(2A)` (`ei_firmShare`) · `Share from AOP/BOI u/s 86` (`ei_aopShare`) · ⚙ `Agricultural income (auto from sf-agri)` `ei_agriAuto` · `Income exempt under DTAA — foreign sourced` (helper "Salary/business/CG income exempt under treaty with foreign country", `ei_dtaa`) · `Income exempt u/s 10(34A) — Buyback of shares (legacy)` (`ei_buyback`) · `Awards/scholarships u/s 10(16), 10(17A)` (`ei_awards`) · `Maturity from LIC u/s 10(10D)` (`ei_lic10d`) · `Other Sec 10 exempt incomes (specify)` (`ei_otherSec10`) · `Other notes / Remarks` (`ei_remarks`, placeholder "Free text for ITR notes") · ⚙ `Other exemptions total` `ei_otherTotal`.
Grand ⚙: `Total Exempt Income (for Schedule EI disclosure) = {ei_grandTotal} · Disclosure only — does not affect tax computation` → sheet `it_exempt`.

#### Drill-in: Schedule CFL — Loss Carry-Forward Dashboard (row `Loss Carry-Forward (Schedule CFL)`) (source: itr1.html:4815-4954)
Note (verbatim, incl. in-note link): `Carry-forward periods: HP loss = 8 AYs (Sec 71B), Business loss (normal) = 8 AYs (Sec 72), Speculation loss = 4 AYs (Sec 73), Specified business 35AD loss = indefinite (Sec 73A), Capital losses = 8 AYs (Sec 74). Set-off rules: HP B/F → HP income only. Business B/F → any business head. Speculation/35AD → same head only. STCL → any CG. LTCL → LTCG only. For Capital losses, use the separate Brought-forward losses set off sub-form (Sec 74 with full set-off engine).` (the underlined phrase is a live link that closes this popup and opens sf-bfl).
Section `Current Year (AY 2026-27) — Unabsorbed losses generated` — ⚙ table `Head of Loss | Amount unabsorbed (CY) | Section | Max carry forward period`: `House Property loss (excess over ₹2L cap)` `cfl_cy_hp` / Sec 71B / 8 AYs · `Business loss (normal) — couldn't offset other heads` `cfl_cy_business` / Sec 72 / 8 AYs · `Speculation loss (Sec 43(5))` `cfl_cy_speculation` / Sec 73 / 4 AYs · `Specified business 35AD loss` `cfl_cy_specified` / Sec 73A / Indefinite. Footer: `These amounts auto-derive from the current year's inter-head set-off rules (Sec 71/73/73A). Capital losses are managed separately in the Brought-forward losses sub-form.`
Four B/F grids, each with `+ Add row` (`addCflHpBtn`/`addCflBizBtn`/`addCflSpecBtn`/`addCflSpecBzBtn`): `House Property Loss — Brought Forward` · `Business Loss (normal) — Brought Forward` · `Speculation Loss — Brought Forward (Sec 73, 4 AY max)` (extra ⚙ column `Status (lapse after 4 AYs)`) · `Specified Business 35AD Loss — Brought Forward (Indefinite C/F)`; common headers `A.Y. of loss | Amount Brought Forward | Set off this year (manual) | Balance to Carry Forward ⚙ | ✕` (`cfl_{hp|biz|spec|specbz}_{i}_ay/_amt/_setoff`, ⚙ `_cf`). Per-head ⚙ summaries e.g. `Total HP B/F … · Set off … · Plus CY HP unabsorbed … · Total HP C/F …`.
Grand ⚙: `Total Loss Carry-Forward to AY 2027-28 = {cfl_grand_total} · Total Set-off applied this year = {cfl_grand_setoff}` → sheet `it_loss_cfl_total`.
Discrepancy note: HP loss cannot actually be carried forward in a genuine ITR-1 (form restriction); dashboard is disclosure-only here.

---

## Screen: Tax Summary & Filing tab (`pane-summary`, itr1.html:394-423)

### Particular: "Statement of Total Income & Tax" (card, all ⚙ read-only, refreshed every 1.5 s while tab active)
Rows: `Income from Salaries` `sm_salary` · `Income from House Property` `sm_hp` · `Income from Other Sources` `sm_os` · `LTCG u/s 112A (≤ ₹1.25L)` `sm_ltcg` · `Gross Total Income` `sm_gti` · `Less: Deductions under Chapter VI-A` `sm_ded` · `Total Income` `sm_ti` · `Tax on Total Income (after rebate, cess, relief)` `sm_tax` · `Less: TDS / TCS / Advance Tax / SAT` `sm_prepaid` · `Balance Tax Payable` `sm_bal` (label ⚙ switches to `Refund Due` when balance < 0). Footer: `Figures are computed live on the Computation tab. Switch there to enter income details.`
Discrepancy note: `sm_os` sums only interest+dividend+family pension+other+winnings cells — the other 11 OS drill cells (gifts, special, KVP, NSC, minor, other-person, rental, 89A, 58/59, DTAA, B/F loss) are in the calc's own TI but excluded from this summary row and from `IncomeOthSrc`/`GrossTotIncome` in the exported JSON (same formula in `buildItr1Json`).

### Particular: "Validation" (card)
Placeholder: `Click "Export ITR JSON" to run validation checks.` After export click: list of `✕` errors / `⚠` warnings / `✓ No blocking errors. JSON exported (with warnings above).` + summary `N error(s), N warning(s)`.
Validation rules (`validateItr1()` itr1.html:1881-1898): PAN regex error `PAN is missing or invalid (format ABCDE1234F).` · `Name of Assessee is required.` · DOB warning `Date of Birth should be DD/MM/YYYY (needed for correct age-based slab).` · `Total Income exceeds ₹50 lakh — ITR-1 cannot be used; use ITR-2.` (ti > 5,000,000) · `LTCG u/s 112A exceeds ₹1.25 lakh — not allowed in ITR-1; use ITR-2.` (>125,000) · refund-due-no-bank warning `Refund due but no bank account with IFSC entered — add one for the refund to be credited.` · `Open the Computation tab at least once so tax figures are available.` (calc not ready).

### Particular: "AIS Import Preview" (card `aisCard`, hidden until an AIS file parsed)
⚙ Rows: `PAN in AIS` · `Financial Year` · `Salary (gross)` · `Salary TDS` · `Interest income` · `Dividend income` · `Total TDS` · `Advance Tax` · `Self-Assessment Tax`. Conditional warning: `AIS PAN ({pan}) differs from the PAN entered ({formPan}). Check you're importing the right taxpayer's AIS.` Buttons: `Fill into Computation` (`aisConfirmBtn` → `applyAisToCalc`) · `Cancel` (`aisCancelBtn`). PDF path: password auto-derived (PAN lowercase + DDMMYYYY), else `window.prompt` fallback; parses TDS-192/194A/194 + SFT + Payment of Taxes + Other Information sections.
Discrepancy note: `applyAisToCalc` targets calc input ids `it_sal_gross_master`/`sal_gross`/`emp1_gross`, `os_int_master`/`it_os_int_input`, `os_div_master`/`it_os_div_input`, `it_advtax_input`/`advtax_master`, `it_tds_master`/`tds_total_input` — **none of these ids exist** in the calc document, so "Fill into Computation" fills nothing into the sheet; only `window.__aisData` is stashed (its TDS entries do reach the exported JSON as `TDSonSalaries`/`TDSonOthThanSals`).

---

## Latent DOM (present in source, unreachable in ITR-1 UI)

The calc document carries the full shared Business/Profession + generic-CG subform set; in ITR-1 the `Profits and gains of Business or Profession` head (its only launcher rows) is `display:none` (itr1.html:2235) with no unhide path, and the generic CG rows are `display:none` (itr1.html:2297-2301). These 41 subforms are therefore latent: `sf-44ad` (:2374) · `sf-44ada` (:2385) · `sf-35ad` (:2396) · `sf-comm` (:2406) · `sf-fno` (:2417) · `sf-firm` (:2428) · `sf-nonspec` (:2439) · `sf-44ae` (:2450) · `sf-spec` (:2461) · Business-1 set `sf-b1-36/-37/-40/-40a/-43b/-deemed/-icds/-othheads/-notcredit/-otheradd/-35to35e/-exempt/-sep/-othded` (:2476-2587) · Profession-1 set `sf-p1-36/-37/-40/-40a/-43b/-deemed/-icds/-othheads/-notcredit/-otheradd/-35to35e/-othded` (:2590-2687) · `sf-depit` Depreciation as per IT Act (:2690) · `sf-ltcg` Long Term Capital Gains multi-entry (:2724) · `sf-stcg` Short Term Capital Gains multi-entry (:2735) · `sf-auto-cg` Auto-classification of STCG / LTCG (3 sections: STT-paid shares 111A/112A grid, MF-except-EOF grid, VDA u/s 115BBH grid, each with 54F blocks) (:2805-2918). Field-level detail for these lives with the ITR-3/ITR-4 structure maps (same shared markup). The outer document likewise contains never-triggered leftovers: `sf-detail` breakup titles for B/S–P&L keys (`BREAKUP_TITLES` itr1.html:985), `FIXED_BREAKUP` F&O/Intraday specs (:997), AL/spi/gstr/ceDeposit render+save paths, and a "Manage Default Particulars" panel (`sf-defaults`, `renderDefaultsPanel` :908) whose host element does not exist in this file.

---

## AY differences (2025-26 vs 2026-27) — complete list (from full-file diff)

| Area | AY 2025-26 (`itr1-2025-26.html`) | AY 2026-27 (`itr1.html`) |
|---|---|---|
| Title / banners / sf-meta strings | `A.Y. 2025-26` everywhere | `A.Y. 2026-27` |
| Export filename | `{PAN}_2025-26_ITR1.json` | `{PAN}_2026-27_ITR1.json` |
| JSON `Form_ITR1` | AssessmentYear `'2025'`, SchemaVer `Ver1.0` | AssessmentYear `'2026'`, SchemaVer `Ver1.1` |
| JSON `FilingStatus.ItrFilingDueDate` | `2025-09-15` | `2026-07-31` |
| JSON Part B-TTI / TaxPaid | zeros for Rebate87A, EducationCess, Section89, all 234 interest; TDS=whole prepaid, AdvanceTax only from AIS, SAT=0 | real figures from calc `__taxBreakup` (rebate/cess/relief/234A-F/TDS/AdvTax/SAT split) |
| `window.__taxBreakup` | absent | present (itr1.html:12278) |
| New-regime slabs `slabNew` | 0-3L nil · 3-7L 5% · 7-10L 10% · 10-12L 15% · 12-15L 20% · >15L 30% | 0-4L nil · 4-8L 5% · 8-12L 10% · 12-16L 15% · 16-20L 20% · 20-24L 25% · >24L 30% |
| Rebate 87A (new regime) | TI ≤ ₹7,00,000, cap ₹25,000 (+ marginal relief) | TI ≤ ₹12,00,000, cap ₹60,000 (+ marginal relief) |
| Everything else | identical structure, labels, options, caps (std-ded 75K/50K, FP 25K/15K, 112A ₹1.25L @12.5%, 80X caps, ESOP_YEARS, BFL_AY_OPTIONS, filing due dates 31-Jul/31-Oct/30-Nov-2026, 234C quarters 2025 dates) | — |

Discrepancy notes (2025-26 file): (a) its Filing-Details note reads `Due date for AY 2025-26 (income earned in FY 2025-26)` yet lists 2026 due dates identical to the 2026-27 file, and its `getFilingDueDate` uses 31-Jul-2026/31-Oct-2026/30-Nov-2026 — inconsistent with its own JSON due date `2025-09-15`; (b) Schedule-FA metas still say `calendar year 2025`; (c) `ESOP_YEARS` and `BFL_AY_OPTIONS` are not shifted back one year; (d) old-regime slabs (`slabOld`), surcharge, 234C quarter dates (15-Jun-2025 …) are unchanged between files.

---

## Cross-cutting behaviors

- Keyboard: `Escape` closes the top-most popup (detail → fa-detail → subform).
- Every subform saves on keystroke (`input`/`change` delegated at subform root); no explicit Save button — `✓ Done` only closes.
- Group headers `▾/▸` toggle collapse (both documents).
- Outer status column values (⚙): `Entered` / `Not entered` / `Empty` / `{N} entry(ies)/account(s)/company(ies)`.
- ITR JSON export structure (`buildItr1Json`): `ITR.ITR1.{CreationInfo, Form_ITR1, PersonalInfo, FilingStatus, ITR1_IncomeDeductions, ITR1_TaxComputation, TaxPaid, Refund, Verification}` + conditional `LTCG112A` (when 112A > 0) + conditional `TDSonSalaries` / `TDSonOthThanSals` (only when AIS was imported).

## Subform-id index (every `id="sf-…"` in the DOM → section above)

Outer document (Data Entry): `sf-assessee` → Assessee info. · `sf-verifier` → Verifier info. · `sf-repassessee` → Representative Assessee, if any · `sf-bank` → Bank Accounts · `sf-esop` → Tax deferred on Sweat Equity Shares / Securities - B/F · `sf-otherforms` → Other Forms filed · `sf-directorship` → Directorship info. · `sf-unlisted` → Unlisted Equity Shares · `sf-pti` → Pass Through Income u/s 115U/ 115UA/ 115UB · `sf-fa_depository` / `sf-fa_equity` / `sf-fa_insurance` / `sf-fa_interest` / `sf-fa_immovable` / `sf-fa_othercap` / `sf-fa_signing` / `sf-fa_trusts` / `sf-fa_otherincome` → the nine Schedule-FA drill-ins · `sf-fa-detail` → nested FA entry detail popup · `sf-detail` → shared Detail popup (Directorship / Unlisted edit).

Calc document — reachable in ITR-1: `sf-employer` → Employer Details · `sf-breakup` → Salaries, allowances and perquisites · `sf-monthly` → Salary as per monthly table · `sf-form16` → Salary as per Form 16 / Certificate · `sf-89a` → Section 89A (per-employer) · `sf-proftax` → Tax on employment u/s 16(iii) · `sf-property` → Details of the property · `sf-hp-int` → Interest on borrowed capital · `sf-hp-gav` → Gross annual value · `sf-hp-arrears` → Arrears / Unrealised Rent received u/s 25A · `sf-ltcg112a` → Long Term Capital Gain u/s 112A · `sf-os-interest` · `sf-os-dividends` · `sf-os-dtaa` · `sf-os-fpension` · `sf-os-gifts` · `sf-os-special` · `sf-os-kvp` · `sf-os-nsc` · `sf-os-minor` · `sf-os-otherperson` · `sf-os-rental1` · `sf-os-89a` · `sf-os-58_59` · `sf-os-winnings` · `sf-os-other` · `sf-bfl` → the sixteen Other-Sources drill-ins · `sf-80-cch` · `sf-80-d` · `sf-80-dd` · `sf-80-ddb` · `sf-80-e` · `sf-80-ccccd` · `sf-80-other` → Chapter VI-A drill-ins · `sf-agri` · `sf-rel89-arrears` · `sf-rel89-commute` · `sf-rel89-comp` · `sf-rel89-gratuity` · `sf-rel90` · `sf-amt` · `sf-tdstcs` · `sf-advtax` · `sf-sat` · `sf-filing` · `sf-int-234` · `sf-schedule-ei` · `sf-loss-cfl` → tail-row drill-ins.

Calc document — latent (unreachable in ITR-1): `sf-44ad` · `sf-44ada` · `sf-35ad` · `sf-comm` · `sf-fno` · `sf-firm` · `sf-nonspec` · `sf-44ae` · `sf-spec` · `sf-b1-36` · `sf-b1-37` · `sf-b1-40` · `sf-b1-40a` · `sf-b1-43b` · `sf-b1-deemed` · `sf-b1-icds` · `sf-b1-othheads` · `sf-b1-notcredit` · `sf-b1-otheradd` · `sf-b1-35to35e` · `sf-b1-exempt` · `sf-b1-sep` · `sf-b1-othded` · `sf-p1-36` · `sf-p1-37` · `sf-p1-40` · `sf-p1-40a` · `sf-p1-43b` · `sf-p1-deemed` · `sf-p1-icds` · `sf-p1-othheads` · `sf-p1-notcredit` · `sf-p1-otheradd` · `sf-p1-35to35e` · `sf-p1-othded` · `sf-depit` · `sf-ltcg` · `sf-stcg` · `sf-auto-cg` — see "Latent DOM" section. (The literal `data-sf="sf-<key>"` in itr1.html:1498 is a code comment placeholder, not a real target.)

PROOF: 39 particular/drill-in launchers re-walked in UI (18 outer drills + 14 tail drills + employer 5 + property 3 sub-drills + conditional toggles) — all opened; remaining drill-ins re-verified against source lines cited above. Screens: 3 (Data Entry / Computation / Tax Summary & Filing).
