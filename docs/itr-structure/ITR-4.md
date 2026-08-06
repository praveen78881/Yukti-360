# ITR-4 — COMPLETE STRUCTURE MAP

Route(s): `/company/[id]/income-tax` (tab "ITR-4 Sugam") · served directly at `/tax-utilities/itr4.html` (AY 2026-27) and `/tax-utilities/itr4-2025-26.html` (AY 2025-26)
Entry component: `src/app/company/[id]/income-tax/page.tsx:414` (iframe mount; src resolved by `itrSrc()` at `page.tsx:46-49`; ITR-4 meta at `page.tsx:55`; offered to `sole_proprietorship` and `huf` entities at `page.tsx:65-67`)
AYs covered: 2025-26, 2026-27 — the two HTML files are byte-identical except AY strings and the new-regime slab/rebate constants (see "AY diff" notes; `slabNew` + `rebate87A` at line 5225 / 12063 of each file).

Banner: `ITR-4 SUGAM · ITR Information` · sub `Individual · Resident · presumptive income u/s 44AD / 44ADA / 44AE · computed u/s 115BAC by default` · `A.Y. 2026-27` chip · button **Go to Computation →** (toast only: "Computation screen is the next build — every figure here flows into it.")

Architecture: single self-contained HTML. Three main tabs (`ITR Information`, `Computation of Income`, `Tax Summary & Filing`). The Computation tab injects an embedded calculator (script block `id="calc-html"`, itr4.html:1984) into `iframe#calcFrame` via `srcdoc` (`injectCalculator()`, itr4.html:1510). Toolbar buttons: **⭳ Import AIS** (PDF/CSV; PDF decrypted in-browser via inlined PDF.js, password = PAN lowercase + DOBddmmyyyy) and **⭱ Export ITR JSON** (`validateItr4()` itr4.html:1812 → `buildItr4Json()` itr4.html:1855 → download `{PAN}_2026-27_ITR4.json`).

UI-walk: verified live at http://localhost:7777/tax-utilities/itr4.html via Playwright/msedge — all 20 top-level drill triggers open their subform, all 5 conditional reveals fire, 44AD/44ADA/44AE math confirmed (values noted below).

---

## Screen: Client Bar (persistent, above tabs) (source: itr4.html:275-286)

| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Name of Assessee | text | — | Full name of assessee | — | '' | Yes (export) | non-empty else error "Name of Assessee is required." | always | `cl_name` | banner sub; `PersonalInfo.AssesseeName`; synced into calc | — |
| PAN | text (maxlength 10, uppercase) | — | ABCDE1234F | — | '' | Yes (export) | `/^[A-Z]{5}\d{4}[A-Z]$/` else error "PAN is missing or invalid (format ABCDE1234F)." | always | `cl_pan` | `PersonalInfo.PAN`; export filename; AIS PDF password; AIS PAN-mismatch check | — |
| Status | select | Individual · HUF | — | — | Individual | — | — | always | `cl_status` | `PersonalInfo.Status` ('I'/'H'); banner | — |
| Residential Status | select | Resident · Resident but Not Ordinarily Resident · Non-Resident | — | — | Resident | — | — | always | `cl_res` | banner sub only | — |
| Date of Birth | text (maxlength 10) | — | DD/MM/YYYY | — | '' | Warn | `/^\d{2}\/\d{2}\/\d{4}$/` else warning "Date of Birth should be DD/MM/YYYY (needed for correct age-based slab)." | always | `cl_dob` | `PersonalInfo.DOB` (ISO); age-based old-regime slab in calc; AIS PDF password | — |

Buttons: tab bar `ITR Information` / `Computation of Income` / `Tax Summary & Filing` (`switchMainTab`) · **⭳ Import AIS** (`importAisBtn`, title "Import your AIS (PDF or CSV) downloaded from the income-tax portal") · **⭱ Export ITR JSON** (`exportJsonBtn`, title "Validate and export the ITR JSON for portal upload") · hidden `input#aisFileInput` accept `.pdf,.csv`.
Sticky rail pills (itr4.html:515-523): `Core sections 0/4` (`r_core` = assessee-email + verifier name&PAN + ≥1 bank + ≥1 nature activity) · `Foreign disclosures 0` (`r_fa`, counts only when hasFA=yes) · `Mandatory pending 0` (`r_pending`, red, shown when >0) · `Return section 139(1)` (`r_sec`) · `Total Income ₹0` (`rail_ti`) · `Balance Tax ₹0` (`rail_bal`) · `Regime: New (default)` (`r_regime`).

---

## Screen: ITR Information (tab `pane-info`, source: itr4.html:300-475)

### Section header: "ITR Information" (collapsible `g-info`) — column header "Status / Value | Sch."

Sub-group **Basic info.**

### Particular: "Assessee info."   [click ⋯ → opens: sf-assessee]
#### Drill-in: Assessee info. (source: itr4.html:532)
Meta: "A.Y. 2026-27 · assessee master data". Note: "Secondary address & contact auto-fill from the Permanent Info table (Tools → Settings → ITR/e-filing → Auto-fill)."

| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| STD code | text | — | 080 | — | '' | No | — | — | `asr_std`→`data.assessee.std` | JSON (unused) | — |
| Landline No. | text | — | Optional | — | '' | No | — | — | `asr_landline`→`.landline` | — | — |
| Country code (for Assessee's Mobile No.) | text | — | — | — | 91 | No | — | — | `asr_cc`→`.cc` | `Address.CountryCodeMobile` (hardcoded 91 in export) | — |
| e-Mail ID (Assessee) | text (email) | — | name@example.com | — | '' | No (drives "Entered" status + core count) | — | — | `asr_email`→`.email` | `st_assessee`; `Address.EmailAddress`; rail Core | — |
| District | text | — | Bengaluru Urban | — | '' | No | — | — | `asr_district`→`.district` | — | — |
| Secondary address same as primary address? | select | Yes · No | — | — | Yes | No | — | — | `asr_secsame`→`.secsame` | — | — |
| Mobile No. *(under "Secondary Contact details")* | text | — | Optional | — | '' | No | — | — | `asr_secmobile`→`.secmobile` | — | — |
| e-Mail ID *(under "Secondary Contact details")* | text | — | Optional | — | '' | No | — | — | `asr_secemail`→`.secemail` | — | — |
| Aadhaar No. | text (maxlength 14) | — | XXXX XXXX XXXX | — | '' | No | — | — | `asr_aadhaar`→`.aadhaar` | `PersonalInfo.AadhaarCardNo` | — |

Buttons: **✓ Done** (closes). Status cell `st_assessee`: "Entered" when email present, else "Not entered".

### Particular: "Verifier info."   [click ⋯ → opens: sf-verifier]
#### Drill-in: Verifier info. (source: itr4.html:553)
Meta: "A.Y. 2026-27 · person verifying the return".

| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Name | text | — | Full name of verifier | — | '' | drives status + core | — | — | `vfr_name`→`data.verifier.name` | `Verification.Declaration.AssesseeVerName` uses cl_name (see Discrepancy) | — |
| PAN | text (up, maxlength 10) | — | ABCDE1234F | — | '' | drives status | live format check → inline warning "PAN format looks invalid — expected ABCDE1234F." (`vfr_panwarn`) | — | `vfr_pan`→`.pan` (uppercased) | status `st_verifier`; rail Core | — |
| Father's name | text | — | — | — | '' | No | — | — | `vfr_father`→`.father` | `Verification.Declaration.FatherName` | — |
| Place of signing | text | — | City | — | '' | No | — | — | `vfr_place`→`.place` | — (export `Place` uses assessee city) | — |

Buttons: **✓ Done**.

### Particular: "Bank Accounts"   [click ⋯ → opens: sf-bank]
#### Drill-in: Bank Accounts (source: itr4.html:628)
Meta: "A.Y. 2026-27 · all accounts held in India". Note: "If multiple accounts are ticked for refund, the refund is credited to one validated account. Account must be pre-validated on the e-filing portal."
Grid "Bank Accounts (All)" — headers: **Bank Name | Account Number | IFS Code | Type of Account | For refund? | (✕)**. Add button: **+ Add row**. Row remove ✕ (min 1 row kept). Totals: `Accounts entered <n>` (⚙ count of rows with name or acc).

Per-row fields: Bank Name (text, ph "e.g. HDFC Bank") · Account Number (text, ph "Account no.") · IFS Code (text, ph "HDFC0000123") · Type of Account (select: (Select) · Savings · Current · Cash Credit (CC) · Over Draft (OD) · Non-Resident (NRO/NRE)) · For refund? (checkbox). Binds `bank_{i}_name/acc/ifsc/type/refund`→`data.bank[i]`. Feeds: `st_bank` count; rail Core; export `Refund.BankAccountDtls.AddtnlBankDetails` (rows with acc) + `BankDtlsFlag`; refund warning "Refund due but no bank account with IFSC entered — add one for the refund to be credited."

Sub-group **ITR filing info.**

### Particular: "Section under which return is filed"   [inline select, no drill-in]
Field `f_section` — Options (verbatim): `139(1) — On or before due date` · `139(4) — Belated return` · `139(5) — Revised return` · `139(9) — Response to defective` · `142(1) — In response to notice`. Default 139(1). Feeds rail `r_sec`. Discrepancy note: export `FilingStatus.ReturnFileSec` is hardcoded `11` regardless of this select.

### Particular: "Return Type"   [inline select]
Field `f_rettype` — Options: `Original` · `Revised`. Default Original. Feeds: nothing in export (display only).

### Particular: "Tax regime for this return" — small helper "set once — flows into the whole computation"   [inline select; Sch. tag "10-IEA"]
Field `f_regime` — Options: `New regime (115BAC — default)` (value New) · `Old regime (opt out via Form 10-IEA)` (value Old). Default New. Feeds banner + rail regime + `data.regime`. Discrepancy note: the embedded calculator has its own regime select (`it_regime`, calc sheet row "**Tax rate** - computed u/s 115BAC by default", options `New (115BAC)`/`Old regime`) and `buildItr4Json` reads the calc's `it_regime`, not `f_regime`; the two are not synchronised.

### Particular: "Representative Assessee, if any"   [click ⋯ → opens: sf-repassessee]
#### Drill-in: Representative Assessee, if any (source: itr4.html:568)
Note: "Fill only if a representative (e.g. legal heir, guardian) is filing on behalf of the assessee."

| Label | Type | Options | Default | Binds | Feeds |
|---|---|---|---|---|---|
| Name | text | — | '' | `rep_name`→`data.repassessee.name` | `st_repassessee` "Entered" |
| e-Mail ID | text | — | '' | `rep_email` | — |
| Contact No. | text | — | '' | `rep_contact` | fallback for export MobileNo |
| Country code (for Contact No.) | text | — | 91 | `rep_cc` | — |
| PAN | text (up, maxlength 10) | — | '' | `rep_pan` (uppercased) | — |
| Assessee Deceased? | Y/N tabs (Yes/No) | Yes · No | No | `data.repassessee.deceased` | — |

Discrepancy note: export `FilingStatus.AsseseeRepFlg` is hardcoded 'N' even when a representative is entered.

Sub-group **Income related info.**

### Particular: "Pass Through Income u/s 115U / 115UA / 115UB"   [click ⋯ → opens: sf-pti; Sch. tag "PTI"]
#### Drill-in: Pass Through Income u/s 115U / 115UA / 115UB (source: itr4.html:643)
Meta: "A.Y. 2026-27 · Venture Capital / Business Trust / Investment Fund". Note: "Exempt income disclosed here auto-fills the "Incomes fully exempt" table of the Computation window."
Grid "Pass Through Income entries" — headers: **Name of Trust / Fund | Income | TDS | PAN | Head of income | Investment Entity | (✕)**. Add: **+ Add row**. Totals: `Total income ₹0` (`pti_income_total` ⚙ Σ income) · `Total TDS ₹0` (`pti_tds_total` ⚙ Σ tds).
Per-row: Name (text, ph "Fund name") · Income (num) · TDS (num) · PAN (text up, ph "ABCDE1234F") · Head of income (select: (Select) · Salary · House Property · Business/Profession · Capital Gains · Other Sources · Exempt) · Investment Entity (select: (Select) · Venture Capital (115U) · Business Trust (115UA) · Investment Fund (115UB)). Binds `pti_{i}_*`→`data.pti[i]`. Feeds `st_pti` count. Discrepancy note: despite the note, no code pushes PTI rows into the calc's exempt-income table or the export JSON.

Sub-group **Business related info.**

### Particular: "Nature of Business / Profession"   [click ⋯ → opens: sf-nature; Sch. tag "BP"]
#### Drill-in: Nature of Business / Profession (source: itr4.html:673)
Meta: "A.Y. 2026-27 · presumptive activities u/s 44AD / 44ADA / 44AE". Note: "Pick the activity code for each line. Turnover for each section is entered on the Computation screen (44AD / 44ADA / 44AE drill-ins)."
Grid — headers: **Sector | Sub-sector | Code | Trade name | Description, if any | (✕)**. Rows grouped by maroon section dividers `Taxable u/s 44AD` / `Taxable u/s 44ADA` / `Taxable u/s 44AE`. Add buttons: **+ Add 44AD activity** · **+ Add 44ADA activity** · **+ Add 44AE activity**. Totals: `Activities entered <n>`.
Per-row: Sector (fixed text = section label) · Sub-sector (text, ph "Sub-sector") · Code (select "— code —" + per-section catalog, verbatim):
- 44AD: `09027 — Wholesale of other products` · `09028 — Retail sale of other products` · `04001 — Manufacturing — food products` · `11007 — Trading — others` · `20023 — Other services n.e.c.`
- 44ADA: `16019 — Legal profession` · `16003 — Accounting / auditing` · `16008 — Medical profession` · `14005 — Software / IT consultancy` · `16013 — Engineering / architectural` · `16021 — Other professional services`
- 44AE: `20016 — Plying, hiring or leasing of goods carriages`
· Trade name (text) · Description, if any (text, ph "Optional"). Binds `nat_{i}_subsector/code/trade/desc`→`data.nature[i]` (with `.sec` = ad/ada/ae). Feeds `st_nature` "N activities"; rail Core. Default: one 44AD row.

### Particular: "Turnover / Gross Receipts reported in GSTR"   [click ⋯ → opens: sf-gstr; Sch. tag "BP"]
#### Drill-in: Turnover / Gross Receipts reported in GSTR (source: itr4.html:658)
Note: "Enter each GSTIN and the total outward supplies reported. Reconciles against presumptive turnover on the Computation screen."
Grid "GSTIN-wise outward supplies" — headers: **GSTIN | Outward supplies as per GST return | (✕)**. Add: **+ Add row**. Totals: `Total outward supplies ₹0` (`gstr_total` ⚙ Σ). Per-row: GSTIN (text up, ph "29ABCDE1234F1Z5") · Outward supplies (num). Binds `gstr_{i}_gstin/outward`. Feeds `st_gstr` "N GSTINs". Discrepancy note: no actual reconciliation against 44AD/44ADA turnover is computed, and rows are not exported.

### Particular: "Earning Business or Profession income for the first time?"   [inline Y/N tabs `firsttime`, flag label "first year of business"]
Default No. Conditional: Yes reveals next row.

### Particular: "Business or Profession start date" `required`   [conditional row `row-startdate`; visible only when firsttime = Yes]
Field `f_startdate` (text, ph DD/MM/YYYY, maxlength 10). Required when visible; unfilled adds to "Mandatory pending" rail pill; mark flips to ✓ when filled. Not exported.

Sub-group **Other info.**

### Particular: "Partner in a Firm during the PY?"   [inline Y/N tabs `partner`]
Default No. No dependent row, not exported (display flag only).

### Particular: "Held Unlisted Shares in the PY?"   [inline Y/N tabs `unlisted`]
Default No. Yes reveals "Unlisted Equity Shares" row (mandatory).

### Particular: "Unlisted Equity Shares" `required`   [conditional row `row-unlisted`; click ⋯ → opens: sf-unlisted]
#### Drill-in: Unlisted Equity Shares (source: itr4.html:847) + level-2 detail (source: itr4.html:861)
Note: "Mandatory because "Held Unlisted Shares in the PY?" is set to Yes. Add each company and click **Edit** for its full share movement (opening / acquired / transferred / closing). If PAN of the unlisted company is not available, enter **NNNNN0000N**. For a foreign company, PAN is not required."
Summary grid "Companies" — headers: **Name of Company | PAN | Opening Qty | Closing Qty | Details | (✕)** · per-row **Edit ✎** button → opens `sf-unlisted-detail` ("Unlisted Equity Shares — detail", title "… — company N"). Add: **+ Add company**. Totals: `Companies <n>`.
Detail form (grouped, `buildGroupedDetail` itr4.html:1121, binds `unldet_*`→`data.unlisted[idx]`):
- Group **Company**: Name of Company (txtwide) · Type of Company (select: (Select) · Domestic Company · Foreign Company) · PAN (enter NNNNN0000N if unavailable; not required for foreign co.) (txtwide, uppercased)
- Group **Opening balance**: Quantity (n) · Cost (n)
- Group **Shares Acquired**: Quantity (n) · Date (DD/MM/YYYY) · Face value per share (n) · Price paid per share — For Fresh issue (n) · Price paid per share — To Existing Shareholder (n)
- Group **Shares Transferred**: Quantity (n) · Sale consideration (n)
- Group **Closing balance**: Quantity (n) · Cost (n)
Feeds `st_unlisted` (shows red "Required" when flag Yes and 0 companies; contributes to Mandatory-pending count). Not exported to JSON.

### Particular: "Director in a company during the PY?"   [inline Y/N tabs `director`]
Default No. Yes reveals "Directorship info." row (mandatory).

### Particular: "Directorship info." `required`   [conditional row `row-directorship`; click ⋯ → opens: sf-directorship]
#### Drill-in: Directorship info. (source: itr4.html:826) + level-2 detail (source: itr4.html:840)
Note: "Mandatory because "Director in a company during the PY?" is set to Yes. Add each company. Click **Edit** to enter its details."
Summary grid "Companies" — headers: **Name of the Company | DIN | Shares listed? | Details | (✕)** · per-row **Edit ✎** → `sf-director-detail` ("Directorship — detail", title "Directorship info. — company N"). Add: **+ Add company**. Totals: `Companies <n>`.
Detail form group **Company** (binds `dirdet_*`→`data.director[idx]`): Director Identification No. (DIN) (txt) · Name of the Company (txtwide) · Type of Company (select: (Select) · Domestic Company · Foreign Company) · PAN (txt, ph ABCDE1234F, uppercased) · Whether shares are listed? (select: (Select) · Listed · Unlisted).
Feeds `st_directorship` ("Required" when flag Yes & empty; Mandatory-pending). Not exported.

### Particular: "Tax deferred on Sweat Equity Shares / Securities — B/F"   [click ⋯ → opens: sf-esop; Sch. tag "ESOP"]
#### Drill-in: Tax deferred on Sweat Equity Shares / Securities — B/F (source: itr4.html:586)
Meta: "A.Y. 2026-27 · deferred tax on eligible start-up ESOP". Note: "Tax becomes payable on the earliest of: 5 years from the end of the relevant AY, sale of the shares, or cessation of employment. Balance C/F is computed as B/F − attributed to sale − payable in CY."
Section "Employer (Start-up) details": PAN of employer (start-up) (`esr_pan`, uppercased) · DPIIT registration No. (`esr_dpiit`).
Grid "Year-wise deferred tax" — headers: **Assessment Year | Tax deferred — B/F | Tax attributed to sale | Date of cessation of employment | Tax payable in CY | Balance tax C/F**. Fixed 5 rows (no add/remove): AYs 2021-22 … 2025-26. Per-row: bf (num) · sale (num) · cess (text date, ph DD/MM/YYYY) · cy (num) · Balance tax C/F (⚙ `max(0, bf − sale − cy)`). Binds `esop_{AY}_bf/sale/cess/cy`→`data.esop.years[AY]`.
Totals bar: `Total deferred B/F ₹0 · Payable in CY ₹0 · Balance C/F ₹0` (⚙ Σ per column). Feeds `st_esop` "Entered". Not exported. AY diff: same 5 AY row labels in both files (2025-26 file does not shift the year window).

### Particular: "Other Forms filed"   [click ⋯ → opens: sf-otherforms]
#### Drill-in: Other Forms filed (source: itr4.html:606)
Meta: "A.Y. 2026-27 · Form 10-IEA & Tax Return Preparer".
Section "Opting out of 115BAC":

| Label | Type | Options | Default | Binds |
|---|---|---|---|---|
| Opted out of 115BAC by filing Form 10-IEA within due date in an earlier year? | select | NA (without business) · Yes · No | NA (without business) | `ofr_optearlier` |
| Date of upload of Form 10-IEA *(under sub-head "Opting out of 115BAC in CY (10-IEA filed within due date)")* | text | ph DD/MM/YYYY | '' | `ofr_iea_date` |
| Acknowledgment no. of Form 10-IEA | text | — | '' | `ofr_iea_ack` |

Section "Tax Return Preparer (TRP) info., if any": TRP ID No. (`ofr_trp_id`) · TRP Name (`ofr_trp_name`) · Reimbursement amount (num, `ofr_trp_amt`).
Feeds `st_otherforms` "Entered". Discrepancy note: export `Form10IEAEarlierAYOldRegime` derives only from calc regime (isNew ? 'N' : 'NA'), ignoring these fields.

### Section header: "Foreign Assets & Incomes" (collapsible `g-fa`; tag "FA") (source: itr4.html:397-434)

### Particular: "Having Foreign assets and Income or Signing authority in Foreign a/c?"   [master Y/N tabs `hasFA`]
Default No. Hint (No): "Set to "Yes" if the assessee holds any foreign asset, income or signing authority at any time during calendar year 2025. Then fill the applicable tables below." Hint (Yes): "Fill the applicable tables below. Enter items held at any time during calendar year 2025." Conditional: `g-fa` gets class `fa-off` when No (the 9 rows below are greyed/disabled via CSS; DOM remains). Warning note (verbatim): "Enter all items held (including any beneficial interest) at any time during calendar year 2025. If the ZIP code is not available, enter **XXXXXX**."

All nine FA particulars share the same pattern (source: itr4.html:691-816): meta "A.Y. 2026-27 · Schedule FA · items held during calendar year 2025"; note "Report items held at any time during calendar year 2025. Click **Edit** on a row to enter its full details. If ZIP code is unavailable, enter **XXXXXX**. All amounts in ₹."; summary grid with **+ Add entry**, per-row **Edit ✎** (opens shared level-2 popup `sf-fa-detail`, title "{schedule} — entry N", meta "A.Y. 2026-27 · Schedule FA"), ✕ remove (min 1), totals `Entries <n>`. Country selects use: (Select) · United States · United Kingdom · United Arab Emirates · Singapore · Canada · Australia · Germany · Switzerland · Netherlands · Hong Kong · Japan · Mauritius · Other. Binds `fadet_{field}`→`data.{schedule}[idx]`; feeds `st_{schedule}` row-counts + rail "Foreign disclosures". None are exported to JSON (Discrepancy note: Schedule FA data stays local).

### Particular: "Foreign Depository / Custodial accounts"   [⋯ → sf-fa_depository]
Summary cols: **Country | Institution | Peak Balance (₹) | Details | (✕)**. Detail groups (spec itr4.html:907): **Location & Institution** — Country (sel) · Institution name · Institution address (wide) · ZIP code (ph XXXXXX); **Account** — Account Type · Account Number · Ownership · Account opening date (DD/MM/YYYY); **Balances & Income (₹)** — Peak Balance during the year (n) · Closing balance (n) · Gross Income received (n) · Nature of Income.

### Particular: "Investments in Foreign Equity / Debts"   [⋯ → sf-fa_equity]
Summary: **Country | Entity | Closing value (₹)**. Groups: **Entity** — Country · Entity name · Entity address (wide) · ZIP code · Nature · Date of acquiring interest (date); **Value of Investment (₹)** — Initial value · Peak value · Closing value; **Income (₹)** — Gross Income received · Proceeds from Sale / Redemption.

### Particular: "Surrender value of Foreign Insurance / Annuity Contract"   [⋯ → sf-fa_insurance]
Summary: **Country | Institution | Surrender value (₹)**. Groups: **Institution** — Country · Institution name · Institution address (wide) · ZIP code · Date of contract (date); **Values (₹)** — Surrender value of contract · Gross Income received.

### Particular: "Financial Interest in any Entity"   [⋯ → sf-fa_interest]
Summary: **Country | Entity | Total Investment (₹)**. Groups: **Entity** — Country · ZIP code · Nature of Entity · Name of the Entity · Address of the Entity (wide) · Ownership · Date since held (date); **Investment & Income (₹)** — Total Investment · Income accrued · Nature of Income; **Income offered in this return** — Taxable Income (₹) · Schedule of ITR · Item No. of schedule.

### Particular: "Immovable Property"   [⋯ → sf-fa_immovable]
Summary: **Country | Property | Total Investment (₹)**. Groups: **Property** — Country · ZIP code · Property address (wide) · Ownership · Acquisition date (date); **Investment & Income (₹)** — Total Investment · Income · Nature of Income; **Income offered in this return** — Taxable Income (₹) · Schedule of ITR · Item No. of schedule.

### Particular: "Other Capital Assets"   [⋯ → sf-fa_othercap]
Summary: **Country | Asset | Total Investment (₹)**. Groups: **Asset** — Country · ZIP code · Nature of asset · Ownership · Acquisition date (date); **Investment & Income (₹)** — Total Investment · Income · Nature of Income; **Income offered in this return** — Taxable Income (₹) · Schedule of ITR · Item No. of schedule.

### Particular: "Account in which Assessee is signing authority (not included above)"   [⋯ → sf-fa_signing]
Summary: **Country | Institution | Peak Balance (₹)**. Groups: **Institution** — Institution name · Institution address (wide) · Country · ZIP code; **Account** — Account holder name · Account Number · Peak Balance (₹) · Income accrued (if liable to tax) (₹); **Income offered in this return** — Taxable Income (₹) · Schedule of ITR · Item No. of schedule.

### Particular: "Trusts in which Assessee is a Trustee / Beneficiary / Settlor"   [⋯ → sf-fa_trusts]
Popup h2: "Trusts (Trustee / Beneficiary / Settlor)". Summary: **Country | Trust | Income derived (₹)**. Groups: **Trust** — Country · ZIP code · Trust name · Trust address (wide); **Trustees** — Trustee name · Trustee address (wide); **Settlor** — Settlor name · Settlor address (wide); **Beneficiaries** — Beneficiary name · Beneficiary address (wide); **Position & Income** — Position held since (date) · Income derived (if liable to tax) (₹); **Income offered in this return** — Taxable Income (₹) · Schedule of ITR · Item No. of schedule.

### Particular: "Other income not included above or in sch. BP of ITR"   [⋯ → sf-fa_otherincome]
Popup h2: "Other income not included above or in Sch. BP". Summary: **Country | Person | Income derived (₹)**. Groups: **Source** — Country · ZIP code · Person from whom income derived — Name (wide) · Address (wide) · Income derived (₹) (n) · Nature of Income; **Income offered in this return** — Taxable Income (₹) · Schedule of ITR · Item No. of schedule.

### Section header: "Financial particulars of the Business" (collapsible `g-fp`; tag "BP") (source: itr4.html:439-472)

### Particular: "Want to disclose non-mandatory items of Financial particulars?"   [master Y/N tabs `discloseFP`]
Default **Yes**. Hint (Yes): "Disclosing all items. The five items marked "required" are mandatory in every case; the rest are optional." Hint (No): "Not disclosing optional items. Only the mandatory items below must be filled: Sundry creditors, Inventories, Sundry debtors, Balance with Banks and Cash-in-hand." Conditional: No hides all `.fp-nonmand` rows (UI-verified).

#### Grid: Financial particulars two-column split (no drill-in; inline `data-fp` inputs)
Column **Capital and Liabilities**: Capital* · Secured loans* · Unsecured loans* · Advances* · Sundry creditors `required` · Other liabilities* · ⚙ **Total Capital & Liabilities** (`fp_cap_total`). Column **Assets**: Fixed assets* · Investments* · Inventories `required` · Sundry debtors `required` · Balance with Banks `required` · Cash-in-hand `required` · Loans and advances* · Other assets* · ⚙ **Total Assets** (`fp_ast_total`). (* = non-mandatory, hidden when disclosure = No.) All num inputs, placeholder 0, bind `data.fp[key]` via `data-fp` attributes.
Balance check line: `Balance check: Balanced · difference ₹0` (ok) / `Off by ₹N` (off) — ⚙ |capT − astT|. The five `required` marks flip to green ✓ when filled; unfilled ones count into the rail "Mandatory pending" pill. Not exported to JSON (Discrepancy note: schema's ScheduleBP financial-particulars block absent from export).

---

## Screen: Computation of Income (tab `pane-comp`) (source: itr4.html:478-480; embedded calculator `calc-html` itr4.html:1984-11516)

The tab hosts the embedded Master Calculator ("Tax Computation · Statement of Total Income", injected srcdoc). The full calculator (Salaries employer blocks, House Property blocks, Capital Gains 112A, 15 Other-sources drill-ins, Chapter VI-A drill-ins `sf-80-cch/-d/-dd/-ddb/-e/-ccccd/-other`, Agricultural income, Relief 89/90-91, AMT 115JC, TDS/TCS, Advance tax, SAT, Filing details, 234A/B/C/F, Schedule EI, Schedule CFL) is the **shared Computation Sheet — documented separately; not extracted here**. Below are the ITR-4-specific items.

### ITR-4-specific: BP section "Profits and gains of Business or Profession" (calc sheet, itr4.html:2173-2231)
Column header: **Turnover/Receipts | Profit**. Visible particulars (UI-verified):

### Particular: "Business: Presumptive profits u/s 44AD"   [click ⋯ → opens: sf-44ad]
#### Drill-in: Business: Presumptive profits u/s 44AD (source: itr4.html:2312)
Note (verbatim): "**A/c payee modes** include A/c payee Cheque/DD/ECS/other Electronic modes prescribed under Rule 6ABBA — Credit Card, Debit Card, Net Banking, IMPS, UPI, RTGS, NEFT, BHIM. If the receipts in 'Cash', 'Non-A/c payee modes' and 'Others' do not exceed 5% of Total Receipts, the eligible turnover limit for section 44AD is **Rs.3 crore**. Otherwise, the limit is **Rs.2 crore**."
Repeatable business cards "44AD Business-N" (add: **+ Add 44AD business**; per-card **✕ Remove** when >1). Card grid headers: **Receipts Mode | Turnover / Receipts | % | Profits**.

| Label | Type | Options | Placeholder | Default | Validation / formula | Binds | Feeds |
|---|---|---|---|---|---|---|---|
| Receipts Mode | select | `A/c payee modes (within due date) - 6% profit case` · `Cash` · `Non-A/c payee modes` · `Others` | — | A/c payee modes… | mode drives default % (6 for A/c-payee, 8 otherwise) | `ad44_mode_{i}` | % placeholder |
| Turnover / Receipts | num | — | — | '' | — | `ad44_to_{i}` | Σ → sheet cell `it_bp_44ad_to` |
| % | num | — | 6 (A/c payee) / 8 (others) | '' (auto) | override of statutory rate | `ad44_pct_{i}` | profit calc |
| Profits | num | — | auto | '' | manual override; else ⚙ `round(turnover × %/100)` (must be ≥ presumptive minimum — not enforced) | `ad44_pr_{i}` | Σ → `it_bp_44ad_pr` + grand `Total presumptive profits u/s 44AD ₹0` |

UI-verified: turnover 10,00,000 default mode → profit 60,000 (6%); mode Cash → 80,000 (8%). Discrepancy note: the ₹2Cr/₹3Cr turnover caps and the 8%/6% minimum-profit floor are stated in the note but not enforced in code.

### Particular: "Profession: u/s 44ADA - Presumptive profits"   [click ⋯ → opens: sf-44ada]
#### Drill-in: Profession: u/s 44ADA — Presumptive profits (source: itr4.html:2323)
Note (verbatim): "Applicable only if it is a profession specified or notified u/s 44AA(1). Otherwise, enter data in 'Non-specified Profession without books of a/c' sub-table. If receipts in 'Cash', 'Non-A/c payee modes' and 'Others' do not exceed 5% of Total Gross Receipts, the eligible turnover limit for section 44ADA is **Rs.75 lakhs**. Otherwise, the limit is **Rs.50 lakh**."
Cards "44ADA Profession-N" (add: **+ Add 44ADA profession**). Headers: **Receipts Mode | Gross Receipts | % | Profits**. Receipts Mode options: `A/c payee modes (within due date)` · `Cash` · `Non-A/c payee modes` · `Others`. % placeholder 50; profit ⚙ `round(gross × %/100)` (default 50%) unless overridden. Binds `ada44_mode/gr/pct/pr_{i}`. Feeds `it_bp_44ada_to` / `it_bp_44ada_pr` + grand `Total presumptive profits u/s 44ADA`. Caps (₹75L/₹50L) not enforced (same discrepancy).

### Sub-group (maroon): "Special Business: Income from Firm, speculation, 44AE....."

### Particular: "Transport business - U/s 44AE"   [click ⋯ → opens: sf-44ae]
#### Drill-in: Transport business — U/s 44AE (source: itr4.html:2388)
Meta: "Deemed profits". Note (verbatim): "If gross vehicle weight / unladen weight of goods carriage is more than 12 tonnes, then it is a **Heavy goods vehicle**. Income: ₹1,000 per tonne of gross vehicle weight (or unladen weight) per month for HGV; ₹7,500 per month for other goods vehicles."
Goods-carriage grid — headers (verbatim): **Description | No. of months | Weight (Tonnes) | Vehicle type | Income | Registration No. | Ownership | (✕)**. Add: **+ Add vehicle**; ✕ per row when >1. Totals: `Total deemed profits u/s 44AE ₹0` (`sf44ae_total`).
Per-row: Description (text) · No. of months (num) · Weight (Tonnes) (num) · Vehicle type (select: `Heavy goods vehicle (>12 tonnes)` · `Other goods vehicle`, default Other) · Income (⚙ HGV: `round(1000 × weight × months)`; other: `round(7500 × months)`) · Registration No. (text) · Ownership (select: `Owned` · `Leased` · `Hired`, default Owned). Binds `ae44_desc/mon/wt/type/reg/own_{i}`. Feeds sheet cell `it_bp_44ae`. UI-verified: HGV, 15 t × 12 m → 1,80,000. Discrepancy note: the statutory 10-vehicle limit for 44AE is not enforced.

### Hidden non-presumptive particulars (present in DOM with `style="display:none"`, subforms fully wired; itr4.html:2179-2185)
`35AD - Specified business profits:` (⋯→sf-35ad) · `Commission / Agency Business without books:` (⋯→sf-comm) · `Futures & Options - without books of a/c:` (⋯→sf-fno) · `Income from partnership firm:` (⋯→sf-firm) · `Non-specified Profession without books of a/c:` (⋯→sf-nonspec) · `Speculation business profits:` (⋯→sf-spec). Their totals (`it_bp_35ad/comm/fno/firm/nonspec/spec`) are read by `validateItr4()` which raises the blocking error: "Non-presumptive business income detected (F&O / speculation / firm / commission / 35AD) — Sugam allows only 44AD/44ADA/44AE; use ITR-3." (rows hidden in ITR-4, so normally always 0).

### Shared P&L-adjustment blocks visible inside the BP group (shared machinery — row labels only)
Sub-group **Business-1**: `Net Profit Before Tax as per P & L a/c` (input `it_b1_npbt`) · Add-block "Add: Inadmissible expenses & Income not included": `Depreciation debited to P & L a/c:` · `36 disallowance` (⋯sf-b1-36) · `37 disallowance` (⋯sf-b1-37) · `40 disallowance` (⋯sf-b1-40) · `40A disallowance` (⋯sf-b1-40a) · `43B disallowance` (⋯sf-b1-43b) · `Deemed Incomes` (⋯sf-b1-deemed) · `Effect of deviation from ICDS and Valuation method u/s 145A` (⋯sf-b1-icds) · `Expenses / Losses considered under other heads` (⋯sf-b1-othheads) · `Income not credited to P & L A/c` (⋯sf-b1-notcredit) · `Other additions` (⋯sf-b1-otheradd) · Less-block "Less: Deductible expenditure & income to be excluded": `35 to 35E, 33AB, 33ABA deductions` (⋯sf-b1-35to35e) · `Exempt income included in net profit` (⋯sf-b1-exempt) · `Income tax refund:` · `Incomes considered separately` (⋯sf-b1-sep) · `Other deductions` (⋯sf-b1-othded) · ⚙ `Adjusted Profit of Business-1`.
Sub-group **Profession-1**: mirrored rows (`it_p1_*`, sf-p1-* drill-ins, `Deemed income u/s 41`) · ⚙ `Adjusted Income of Profession-1` · `Less: Depreciation as per IT Act` (⋯sf-depit) · ⚙ **`Income chargeable under 'Business or Profession'`** (`it_bp_income`).

### ITR-4 comp lines the parent form reads (feeds; `refreshSummary` itr4.html:1535, `buildItr4Json` itr4.html:1855)
`it_sal_total` → Income from Salaries / GrossSalary · `it_hp_income` → Income from House Property / TotalIncomeChargeableUnHP · `it_os_interest`+`it_os_dividend`+`it_os_familypension`+`it_os_other`+`it_os_winnings` → Income from Other Sources / IncomeOthSrc · `it_bp_income` → Presumptive Business/Profession row / IncomeFromBusinessProf · `it_cg_112a` → LTCG u/s 112A (≤ ₹1.25L) / GrossTotIncomeIncLTCG112A · `it_80_total` → Deductions VI-A · `it_totalIncome` → Total Income / TI ceiling check · `it_taxOnTI` → tax · `it_balancePayable` → Balance Tax Payable / Refund Due · chapVIA4() additionally reads `it_80_c, it_80_ccc, it_80_ccd1, it_80_ccd1b, it_80_ccd2, it_80_d, it_80_dd, it_80_ddb, it_80_e, it_80_g, it_80_gg, it_80_ggc, it_80_u, it_80_tta, it_80_ttb, it_80_cch`.
BP aggregation into TI (calc `computeBP` itr4.html:6272 + `computeAll` itr4.html:12083): `normal = 44AD + 44ADA + comm + fno + firm + nonspec + 44AE + B1 + P1`; speculation and 35AD isolated per Sec 73/73A; GTI = salary + HP + BP + CG + OS with Sec 71 set-off rules; TI rounded to nearest ₹10.

---

## Screen: Tax Summary & Filing (tab `pane-summary`) (source: itr4.html:483-511)

Card "Statement of Total Income & Tax" (all ⚙, refreshed every 1.5 s from calc): `Income from Salaries` · `Income from House Property` · `Presumptive Business/Profession (44AD / 44ADA / 44AE)` · `Income from Other Sources` · `LTCG u/s 112A (≤ ₹1.25L)` · `Gross Total Income` · `Less: Deductions under Chapter VI-A` · `Total Income` · `Tax on Total Income (after rebate, cess, relief)` · `Less: TDS / TCS / Advance Tax / SAT` · `Balance Tax Payable` (label flips to `Refund Due` when negative). Footnote: "Figures are computed live on the Computation tab. ITR-4 (Sugam) is for presumptive income under 44AD/44ADA/44AE, with a total-income ceiling of ₹50 lakh."
Card "Validation" — placeholder "Click "Export ITR JSON" to run validation checks."; after export shows ✕ errors / ⚠ warnings / ✓ "No blocking errors. JSON exported…" + "N error(s), N warning(s)".
Card "AIS Import Preview" (hidden until import): rows PAN in AIS · Financial Year · Salary (gross) · Salary TDS · Interest income · Dividend income · Total TDS · Advance Tax · Self-Assessment Tax; PAN-mismatch warning; buttons **Fill into Computation** / **Cancel**.

### Validation rules (`validateItr4`, itr4.html:1812 — verbatim messages)
Errors: PAN format · Name required · `Total Income exceeds ₹50 lakh — ITR-4 (Sugam) cannot be used; use ITR-3.` (ti > 5,000,000) · `LTCG u/s 112A exceeds ₹1.25 lakh — not allowed in ITR-4; use ITR-2 or ITR-3.` (>125,000) · non-presumptive guard (message above). Warnings: DOB format · refund-without-bank · `Open the Computation tab at least once so tax figures are available.`

### Export JSON shape (`buildItr4Json`) — top keys
`ITR.ITR4.{CreationInfo, Form_ITR4 (FormName 'ITR-4', Description 'Sugam - Presumptive income from Business & Profession', AssessmentYear '2026', SchemaVer 'Ver1.1'), PersonalInfo, FilingStatus, IncomeDeductions, TaxComputation, TaxPaid, Refund, Verification}` + optional `TDSonSalaries` / `TDSonOthThanSals` built only from imported AIS TDS entries.

---

## AY differences (itr4.html vs itr4-2025-26.html — full diff = 120 lines)
1. All "A.Y. 2026-27" strings → "A.Y. 2025-26" (title, banner, every subform meta).
2. `slabNew` (line 5225): 2026-27 = 0/4L nil, 4-8L 5%, 8-12L 10%, 12-16L 15%, 16-20L 20%, 20-24L 25%, >24L 30%; 2025-26 = 0/3L nil, 3-7L 5%, 7-10L 10%, 10-12L 15%, 12-15L 20%, >15L 30%.
3. `rebate87A` new-regime arm (line ~12063): 2026-27 `ti≤12,00,000 → min(tax, 60,000)` with marginal relief above; 2025-26 `ti≤7,00,000 → min(tax, 25,000)` with marginal relief above.
Everything else (fields, options, drill-ins, formulas, export) is identical; export filename embeds the AY string.

## Discrepancy notes (source vs observed behaviour)
1. **`it_bp_income` is never computed.** No JS writes the "Income chargeable under 'Business or Profession'" cell; UI-verified: after entering 44AD ₹80,000 + 44AE ₹1,80,000, Total Income = ₹2,60,000 but `it_bp_income` stays 0 → Summary row "Presumptive Business/Profession" shows ₹0 and exported `IncomeFromBusinessProf` = 0 (TI itself is correct).
2. **Business-1 / Profession-1 P&L-adjustment blocks are visible** in a presumptive-only form, feed `bpRes.normal` → TI, and are NOT caught by the non-presumptive validation guard (which only checks 35AD/comm/F&O/firm/nonspec/spec).
3. **chapVIA4 reads non-existent cells**: `it_80_c, it_80_ccc, it_80_ccd1, it_80_ccd1b, it_80_ccd2, it_80_g, it_80_gg, it_80_ggc, it_80_u, it_80_tta, it_80_ttb` exist nowhere in the DOM (calc exposes the bundle `it_80_ccccd` + `it_80_other` instead) → the section-wise VI-A breakup exports as zeros except 80D/80DD/80DDB/80E/80CCH and the total.
4. **Address/mobile export**: `buildItr4Json` reads `A.flat/premises/road/area/city/stateCode/pin/mobile` — none collected by the Assessee subform → Address exports as 'NA'/'' defaults.
5. **Hardcoded export fields**: `FilingStatus.ReturnFileSec: 11` (ignores `f_section`), `AsseseeRepFlg: 'N'` (ignores Representative subform), `Rebate87A: 0`, `EducationCess: 0`, 234-interest zeros (ignores calc's computed 234A/B/C/F).
6. **Statutory caps not enforced in drill-ins**: 44AD ₹2Cr/₹3Cr, 44ADA ₹50L/₹75L turnover limits and the 6%/8%/50% minimum-profit floors are advisory notes only; 44AE 10-vehicle cap absent. (The ₹50L total-income ceiling IS enforced at export.)
7. **Dead-end disclosures**: GSTR turnover, PTI, Schedule FA, Directorship, Unlisted shares, ESOP and Financial-particulars data are captured and status-tracked but never emitted into the exported ITR JSON; GSTR reconciliation and PTI→exempt-income auto-fill promised in the notes are not implemented.
8. **Two regime selects**: parent `f_regime` vs calc `it_regime` are independent; export uses the calc's value.

## Counts
Screens: 4 (Client Bar/chrome · ITR Information · Computation of Income [ITR-4 additions] · Tax Summary & Filing) · Particulars: 34 (19 g-info + 10 g-fa + 2 g-fp + 3 visible presumptive BP; +6 hidden BP rows and 33 shared B1/P1 rows listed) · Drill-ins documented: 26 (23 parent-document subforms incl. 3 level-2 details + 3 calculator presumptive subforms; 38 further calculator subforms belong to the shared Computation Sheet) · Field definitions: 212 · Repeaters: 16 (bank, pti, gstr, nature, 9×FA, director, unlisted, 44AD, 44ADA, 44AE — plus fixed 5-row ESOP grid) · Discrepancies: 8.
