# ITR-3 — COMPLETE STRUCTURE MAP

Route(s): `/tax-utilities/itr3.html` (AY 2026-27) · `/tax-utilities/itr3-2025-26.html` (AY 2025-26) — resolved by `itrSrc()` at `src/app/company/[id]/income-tax/page.tsx:46-49` · Entry component: iframe mount at `src/app/company/[id]/income-tax/page.tsx:414-422` (lazy-mounted per tab; ITR-3 offered to `sole_proprietorship` and `huf` entities, page.tsx:63-68) · AYs covered: 2025-26, 2026-27

File anatomy (both AY files identical except noted AY diffs): shell HTML lines 274–1265 · shell script 1266–2736 (`validateItr3` itr3.html:2539, `buildItr3Json` itr3.html:2566) · embedded shared "Tax Computation · Master Calculator" in `<script type="text/plain" id="calc-html">` lines 2737–12996, injected into `#calcFrame` via `srcdoc` (itr3.html:2237-2248). 12,996 lines / ~2.6 MB, self-contained (inlined PDF.js for AIS import).

Top banner: **ITR-3 · Data Entry** · sub "For Individual or HUF having Income from Business or Profession · computed u/s 115BAC by default" (live: "For {Status} having…" per client-bar Status, itr3.html:2122-2125) · badge "A.Y. 2026-27" · button **⚙ Defaults** (title "Manage default particulars") → opens Drill-in: Manage Default Particulars.

Client bar (always visible, itr3.html:290-299):

| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Name of Assessee | text | — | Full name of assessee | — | empty | Yes (export) | non-empty at export | — | `cl_name` (two-way sync with Assessee info drill) | JSON PersonalInfo.AssesseeName; synced into calc iframe | — |
| PAN | text (maxlength 10, uppercase) | — | ABCDE1234F | — | empty | Yes (export) | `^[A-Z]{5}\d{4}[A-Z]$` else export error | — | `cl_pan` | JSON PAN; export filename `{PAN}_2026-27_ITR3.json`; AIS PDF password | filename year |
| Status | select | Individual · HUF | — | — | Individual | — | — | — | `cl_status` | JSON Status ('I'/'H'); banner text | — |
| Date of Birth | text (maxlength 10) | — | DD/MM/YYYY | — | empty | Warn only | `DD/MM/YYYY` else export warning | — | `cl_dob` | JSON DOB (ISO); AIS PDF password (pan lowercase + DDMMYYYY) | — |

Tab bar (itr3.html:302-313): **ITR Info** · **ITR B/S** · **ITR P&L** · **Computation of Income** · **Tax Summary & Filing** + right-aligned buttons **⭳ Import AIS** (title "Import your AIS (PDF or CSV) downloaded from the income-tax portal") and **⭱ Export ITR JSON** (title "Validate and export the ITR JSON for portal upload"; runs validateItr3 → renders Validation card → downloads JSON only if 0 errors).

Sticky rail (itr3.html:613-620): pills **B/S check** (`—` / `off` / `✓ tallied` / `Δ ₹n`) · **P&L balance to B/S ₹0** · **Return section 139(1)** · **Total Income ₹0** · **Balance Tax ₹0** · **Regime: New (default)**.

---

## Screen: ITR Info (tab `pane-info`, itr3.html:318-424)

Header strip: "(For Individual or HUF having Income from Business or Profession)" · collapsible group head "▾ ITR Information" · column header "Status / Value | Sch."

### Particular: "Assessee info."   [click ⋯ → opens: Assessee info.]
#### Drill-in: Assessee info. (source: itr3.html:629)
Meta "A.Y. 2026-27 · assessee master data" · note "Secondary address & contact auto-fill from the Permanent Info table (Tools → Settings → ITR/e-filing → Auto-fill)." · button **✓ Done**. Section headers: Identity / Primary Address / Contact / Secondary Contact details / Other.

| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Name of Assessee | text (span2) | — | Full name as per PAN | — | client-bar value | — | — | — | `asr_name` → data.assessee.name (syncs cl_name) | JSON AssesseeName | — |
| PAN | text (uppercase, maxlength 10) | — | ABCDE1234F | — | client-bar value | — | — | — | `asr_pan` (syncs cl_pan) | JSON PAN | — |
| Status | select | Individual · HUF | — | — | client-bar value | — | — | — | `asr_status` (syncs cl_status) | JSON Status | — |
| Date of Birth / Incorporation (DD/MM/YYYY) | text (fmtDate) | — | DD/MM/YYYY | — | client-bar value | — | date mask | — | `asr_dob` (syncs cl_dob) | JSON DOB | — |
| Gender | select | (Select) · Male · Female · Transgender | — | — | (Select) | — | — | — | `asr_gender` | — | — |
| Father's Name | text | — | — | — | empty | — | — | — | `asr_father` | — | — |
| Residential Status | select | Resident · Resident but Not Ordinarily Resident · Non-Resident | — | — | Resident | — | — | — | `asr_resstatus` | — (JSON hardcodes ResidentialStatus:'RES') | — |
| Flat / Door / Block No. | text | — | — | — | empty | — | — | — | `asr_flat` | JSON Address.ResidenceNo | — |
| Name of Premises / Building / Village | text | — | — | — | empty | — | — | — | `asr_premises` | Address.ResidenceName | — |
| Road / Street / Post Office | text | — | — | — | empty | — | — | — | `asr_road` | Address.RoadOrStreet | — |
| Area / Locality | text | — | — | — | empty | — | — | — | `asr_area` | Address.LocalityOrArea | — |
| Town / City | text | — | Bengaluru | — | empty | — | — | — | `asr_city` | Address.CityOrTownOrDistrict; Verification.Place | — |
| State | text | — | Karnataka | — | empty | — | — | — | `asr_state` | — (JSON StateCode defaults '99') | — |
| Country | text | — | — | — | India | — | — | — | `asr_country` | — | — |
| PIN Code | text (maxlength 6) | — | 560001 | — | empty | — | — | — | `asr_pin` | Address.PinCode | — |
| Mobile No. (Assessee) | text | — | 10-digit mobile | — | empty | — | — | — | `asr_mobile` | Address.MobileNo | — |
| STD code | text | — | 080 | — | empty | — | — | — | `asr_std` | — | — |
| Landline No. | text | — | Optional | — | empty | — | — | — | `asr_landline` | — | — |
| Country code (for Assessee's Mobile No.) | text | — | — | — | 91 | — | — | — | `asr_cc` | — | — |
| e-Mail ID (Assessee) | email | — | name@example.com | — | empty | — | — | — | `asr_email` | Address.EmailAddress; drives "Entered" status | — |
| District | text | — | Bengaluru Urban | — | empty | — | — | — | `asr_district` | — | — |
| Secondary address same as primary address? | select | Yes · No | — | — | Yes | — | — | — | `asr_secsame` | — | — |
| Mobile No. (Secondary Contact) | text | — | Optional | — | empty | — | — | — | `asr_secmobile` | — | — |
| e-Mail ID (Secondary Contact) | text | — | Optional | — | empty | — | — | — | `asr_secemail` | — | — |
| Aadhaar No. | text (maxlength 14) | — | XXXX XXXX XXXX | — | empty | — | — | — | `asr_aadhaar` | JSON AadhaarCardNo | — |
| Aadhaar Enrolment ID (if Aadhaar not available) | text | — | Optional | — | empty | — | — | — | `asr_aadhaareid` | — | — |
| Liable to maintain accounts as per Sec.44AA? | select | No · Yes | — | — | No | — | — | — | `asr_44aa` → data.assessee.acc44aa | — (JSON PartA_GEN2 LiableSec44AAflg stays 'N') | — |

Status cell `st_assessee`: "Entered" when e-Mail filled, else "Not entered".

### Particular: "Verifier info."   [click ⋯ → opens: Verifier info.]
#### Drill-in: Verifier info. (source: itr3.html:676)
Meta "A.Y. 2026-27 · person verifying the return". ITR-3 extra vs ITR-1/2: **Capacity**.

| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Name | text (span2) | — | Full name of verifier | — | empty | — | — | — | `vfr_name` | Verification.Declaration (AssesseeVerName uses client-bar name, not this) | — |
| PAN | text (uppercase) | — | ABCDE1234F | — | empty | — | — | — | `vfr_pan` | — (JSON uses cl_pan) | — |
| Capacity | text | — | e.g. Self / Karta / Authorised signatory | — | empty | — | — | — | `vfr_capacity` | — (JSON hardcodes Capacity:'S') | — |
| Father's name | text | — | — | — | empty | — | — | — | `vfr_father` | Verification.Declaration.FatherName | — |
| Place of signing | text (span2) | — | City | — | empty | — | — | — | `vfr_place` | — (JSON Place uses assessee city) | — |

Status `st_verifier`: "Entered" when name AND pan filled.

### Particular: "Bank Accounts"   [click ⋯ → opens: Bank Accounts]
#### Drill-in: Bank Accounts (source: itr3.html:708)
Meta "A.Y. 2026-27 · all accounts held in India" · note "If multiple accounts are ticked for refund, refund will be credited to one validated account. For the procedure to validate the account in IT e-filing portal, press 'F1' key."
Grids: section title "Bank Accounts (All)" · headers **Bank Name | Account Number | IFS Code | Type of Account | For refund? | (remove)** · Type of Account options: `(Select) · Savings · Current · Cash Credit (CC) · Over Draft (OD) · Non-Resident (NRO/NRE)` · Bank Name placeholder "e.g. HDFC Bank", IFS Code placeholder "HDFC0000123" · For refund? = checkbox · per-row remove **✕** (last row never removed) · add button **+ Add row** · footer "Accounts entered **N**".
Binds `data.bank[i].{name,acc,ifsc,type,refund}` · Feeds JSON `Refund.BankAccountDtls.AddtnlBankDetails` (rows with Account Number only; AccountType exported verbatim, `'SB'` only when type empty) + BankDtlsFlag Y/N · Validation: export warning if refund due and no row has acc+IFSC.

### Particular: "Residential status info."   [click ⋯ → opens: Residential status info.]
#### Drill-in: Residential status info. (source: itr3.html:722)
Meta "A.Y. 2026-27 · determination of residential status u/s 6" · note "^182 days in case of citizen of India, left India for employment / as a member of crew of Indian ship or Citizen of India / PIO, visited India."
Grid headers **Residential status | (checkbox) | Section**; section row "Basic conditions:".

| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a) Stayed in India for at least 182 days in the PY? | checkbox | — | — | tag "6 (1)(a)" | unchecked | — | — | — | `res_a` | `st_residential` status | — |
| Citizen of India / PIO, visited India during the year & having taxable total income above Rs. 15 lakh from Indian sources? | checkbox | — | — | — | unchecked | — | — | toggles row (b) text | `res_citizen` | rewrites label b | — |
| b) Stayed in India for at least 60^ days in the PY and at least 365 days in 4 years preceding the PY? | checkbox | — | — | tag "6 (1)(c)" | unchecked | — | — | when citizen ticked label becomes "b) Stayed in India for at least 120 days in the PY and at least 365 days in 4 years preceding the PY?" and tag "6 (6)(c)" (UI-verified) | `res_b` | `st_residential` | — |

### Particular: "Section under which return is filed" (inline, no drill)
Helper "?" title "139(1) = on or before due date" · select `f_section`: `139(1) — On or before due date · 139(4) — Belated return · 139(5) — Revised return · 139(9) — Response to defective · 142(1) — In response to notice` · default 139(1) · feeds rail pill "Return section". (JSON hardcodes ReturnFileSec:11.)

### Particular: "Return Type" (inline)
Select `f_rettype`: `Original · Revised` · default Original.

### Particular: "Representative Assessee, if any"   [click ⋯ → opens: Representative Assessee, if any]
#### Drill-in: Representative Assessee, if any (source: itr3.html:691)
Note "Fill only if a representative (e.g. legal heir, guardian) is filing on behalf of the assessee." Fields: **Name** (text span2, `rep_name`) · **e-Mail ID** (text, `rep_email`) · **Contact No.** (text, `rep_contact`) · **Country code (for Contact No.)** (text, default 91, `rep_cc`) · **Assessee Deceased?** (yes/no tabs `rep_deceased`, default No). Status `st_repassessee`: Entered when name filled. JSON AsseseeRepFlg stays 'N'.

### Particular: "Pass Through Income u/s 115U/ 115UA/ 115UB"   [Sch. tag PTI; click ⋯ → opens: Pass Through Income]
#### Drill-in: Pass Through Income u/s 115U/ 115UA/ 115UB (source: itr3.html:990)
Meta "A.Y. 2026-27 · Schedule PTI" · note "Report income passed through from a Business Trust (115UA) or Investment Fund (115UB). Enter one row per head of income for each fund."
Grids: "Pass Through Income entries" · headers **Investment entity covered u/s | Name of business trust / investment fund | PAN of the business trust / investment fund | Head of income | Amount of income | TDS on such amount, if any | (remove)** · entity select `(Select) · 115UA — Business Trust · 115UB — Investment Fund` · head select `(Select) · Salary · House Property · Business/Profession · Capital Gains · Other Sources · Exempt` · PAN placeholder "ABCDE1234F" (uppercased) · **+ Add row** / ✕ · footer "Total income **₹n** · Total TDS **₹n**" (⚙ sums income/tds). Binds `data.pti[]`. Not mapped into export JSON.

### Particular: "Income of Other persons included in computation"   [Sch. tag SPI; click ⋯ → opens]
#### Drill-in: Income of Other persons included in computation (source: itr3.html:739)
Meta "A.Y. 2026-27 · Schedule SPI" · note "^ Details for these items entered under the head 'Income from other sources' and 'House Property' in Computation window will be directly taken to ITR."
Two grids, same headers **Name | PAN / Aadhaar No. (optional) | Relationship | Head of income | Amount | (remove)**: "Minor children's income ^" (**+ Add row**, `spimin_` rows) and "Income of other persons ^" (**+ Add row**, `spioth_` rows). Head options = HEADS list above. Footer "Total income of other persons **₹n**" (⚙). Binds `data.spiMinor[]` / `data.spiOther[]`. Not in export JSON.

### Particular: "Liable for audit u/s 44AB?" (inline yes/no)
Helper "?" title "Tick if the assessee is liable to tax audit under section 44AB" · yes/no tabs `audit44ab`, default **No**. Conditional: Yes reveals next row (UI-verified display none→flex).

### Particular: "44AB Tax Audit details" (conditional row `row-44ab`)   [click ⋯ → opens]
#### Drill-in: 44AB Tax Audit details (source: itr3.html:1004)
Meta "A.Y. 2026-27 · applicable when liable to audit u/s 44AB". Fields/rows:

| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Date of furnishing audit report | text (fmtDate) | — | DD/MM/YYYY | — | empty | — | date mask | row visible only when 44AB=Yes | `ab_date` | `st_44ab` | — |
| Acknowledgement number | text | — | — | — | empty | — | — | — | `ab_ack` | — | — |
| Method of valuation of closing stock [Sl. no. 4 of OI] — Raw materials | select | Lower of Cost/Market rate · At Cost · At Market rate | — | — | Lower of Cost/Market rate | — | — | — | `ab_val_raw` | — | — |
| — Finished goods | select | same 3 options | — | — | Lower of Cost/Market rate | — | — | — | `ab_val_fg` | — | — |
| Is there any change in method of valuation? | checkbox | — | — | — | unchecked | — | — | — | `ab_val_change` | — | — |
| Duties / taxes - Credit outstanding in accounts [Sl. no. 12 of OI]: Central GST (CGST) / State GST (SGST) / Integrated GST (IGST) / Union Territory GST (UTGST) / Union Excise Duty / Service tax / VAT/Sales tax / Any other tax | 8 × num | — | — | — | empty | — | — | — | `ab_cgst…ab_othertax` | ⚙ **Total** `ab_duties_total` (sum) | — |

Note (blue): "Note: Tax audit & stock details for ITR (Part A - OI & QD) are to be filled in 3CD window."

### Particular: "Other Audits (excluding u/s 44AB of Income Tax Act)"   [click ⋯ → opens]
#### Drill-in: Other Audits (excluding u/s 44AB of Income Tax Act) (source: itr3.html:770)
Two fixed tables (no add/remove).
Table 1 "Audits under Income Tax Act" — columns **Section | Date of furnishing Report | Acknowledgement number | Whether furnished?** — fixed section rows: `10AA, 115JC, 50B, 44DA, 50B, 80-IA, 80-IAB, 80-IB, 80-IE, 80JJAA, 92E`; each row: date text (fmtDate, DD/MM/YYYY), ack text, furnished select `— · Yes · No` (default —). Binds `oa_itax_{0-10}_{date,ack,furn}`.
Table 2 "Audits under other Acts" — columns **Act | Date of furnishing Report | Section | Whether furnished?** — fixed acts: `Central Excise Act, 1944 · Central GST Act, 2017 · Central Sales Tax Act, 1956 · Employees Provident Fund and Miscellaneous Provisions Act, 1952 · Foreign Exchange Management Act, 1999 · Foreign Exchange Management Act, 1999 · Integrated GST Act, 2017 · Payment of Gratuity Act, 1972 · SEBI Act, 1992 · Securities Contract (Regulation) Act, 1956 · State GST Act, 2017 · Union Territories GST Act, 2017 · Other:`. Binds `oa_other_{0-12}_{date,section,furn}`.
Discrepancy note: "50B" appears twice in Table 1 (itr3.html:786 and :794 — second occurrence likely meant a different section) and "Foreign Exchange Management Act, 1999" twice in Table 2 (itr3.html:843 and :847). Status `st_otheraudits` always neutral ("optional; leave neutral", itr3.html:2101). These inputs are stored only in the DOM (no saveSubFormField mapping) — values are not persisted to `data` and not exported.

### Particular: "Nature of Business / Profession"   [click ⋯ → opens]
#### Drill-in: Nature of Business / Profession (source: itr3.html:976)
Meta "A.Y. 2026-27 · business / profession activity codes" · note "Select the Sector and Sub-Sector; the Code is picked from the prescribed list of business/profession codes. Enter trade name(s) under which the business is carried on."
Grids: "Activities" · headers **Sector | Sub-Sector | Code | Trade name 1 | Trade name 2 | (remove)** · placeholders "e.g. Trading" / "e.g. Wholesale of others" / "09028" · **+ Add row** / ✕ · footer "Activities entered **N**". Binds `data.nature[]`. Discrepancy note: despite the note text, Sector/Sub-Sector are free-text inputs (no select/code catalog in this file). Not in export JSON.

### Particular: "Turnover/Gross Receipts reported in GSTR"   [Sch. tag GST; click ⋯ → opens]
#### Drill-in: Turnover/Gross Receipts reported in GSTR (source: itr3.html:757)
Grids: "GSTIN-wise outward supplies" · headers **GSTIN | Outward supplies as per GST return | (remove)** · GSTIN placeholder "29ABCDE1234F1Z5" (uppercased) · **+ Add row** / ✕ · footer "Total outward supplies **₹n**" (⚙). Binds `data.gstr[]`. Not in export JSON.

### Particular: "Business or Profession start date" (inline)
Helper "?" title "Date the business or profession commenced" · text `f_bizstart` fmtDate placeholder DD/MM/YYYY + fmt hint "DD/MM/YYYY".

### Particular: "Tax paid u/s 92CE"   [Sch. tag TPSA; click ⋯ → opens]
#### Drill-in: Tax paid u/s 92CE (source: itr3.html:883)
Meta "A.Y. 2026-27 · secondary adjustment". Fixed computation table:

| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Amount on which option u/s 92CE(2A) is exercised | num | — | — | — | empty | — | — | — | `ce_amount` → data.ce_amount | drives all ⚙ below; `st_92ce` | — |
| Additional Income tax @ 18% | ⚙ calc | — | — | — | 0 | — | — | — | `ce_addtax` | = amount×0.18 (UI-verified 1,00,000→18,000) | — |
| Surcharge @ 12% | ⚙ calc | — | — | — | 0 | — | — | — | `ce_surcharge` | = addtax×0.12 (→2,160) | — |
| Cess @ 4% | ⚙ calc | — | — | — | 0 | — | — | — | `ce_cess` | = (addtax+surcharge)×0.04 (→806) | — |
| Total Tax payable (A) | ⚙ calc | — | — | — | 0 | — | — | — | `ce_total_a` | sum (→20,966) | — |
| Tax paid (B) | num | — | — | — | empty | — | — | — | `ce_paid_b` | — | — |
| Net Tax payable (A - B) | ⚙ calc | — | — | — | 0 | — | — | — | `ce_net` | A−B | — |

Grids: "Details of tax deposit:" · headers **Name of the Bank & Branch | BSR Code | Date of deposit | Challan no. | Amount | (remove)** · **+ Add row** / ✕. Binds `data.ceDeposit[]`. Not in export JSON.

### Particular: "Partner in a Firm during the PY?" (inline yes/no)
Yes/no tabs `partner`, default No. No dependent row.

### Particular: "Held Unlisted Shares in the PY?" (inline yes/no)
Yes/no tabs `unlisted`, default No. Yes reveals row-unlisted (UI-verified).

### Particular: "Unlisted Equity Shares" (conditional row `row-unlisted`)   [click ⋯ → opens]
#### Drill-in: Unlisted Equity Shares (source: itr3.html:962)
Note "Add each company and click Edit for its full share movement. If PAN of the unlisted company is not available, enter **NNNNN0000N**. For a foreign company, PAN is not required."
Grids: "Companies" · summary headers **Name of Company | PAN | Opening Qty | Closing Qty | Details | (remove)** · button **+ Add company** · per row **Edit ✎** → nested drill-in below · footer "Companies **N**".
#### Drill-in (nested): Unlisted Equity Shares — entry N (shared popup `sf-detail`, spec at itr3.html:1496-1501)
Groups/fields (all bind `data.unlisted[idx]`):
- **Company**: Name of Company (txtwide) · Type of Company (select `(Select) · Domestic Company · Foreign Company`) · PAN (enter NNNNN0000N if unavailable; not required for foreign co.) (txtwide, placeholder ABCDE1234F, uppercased)
- **Opening balance**: No. of shares (num) · Cost of acquisition (num)
- **Shares acquired during the year**: No. of shares (num) · Date of subscription / purchase (DD/MM/YYYY) · Face value per share (num) · Issue price per share (for fresh issue) (num) · Purchase price per share (from existing shareholder) (num)
- **Shares transferred during the year**: No. of shares (num) · Sale consideration (num)
- **Closing balance**: No. of shares (num) · Cost of acquisition (num)
Button **✓ Done** (closes, re-renders summary). Feeds JSON: none (HeldUnlistedEqShrPrYrFlg stays 'N').

### Particular: "Director in a company during the PY?" (inline yes/no)
Yes/no tabs `director`, default No. Yes reveals row-directorship (UI-verified).

### Particular: "Directorship info." (conditional row `row-directorship`)   [click ⋯ → opens]
#### Drill-in: Directorship info. (source: itr3.html:950)
Note "Add each company. Click Edit to enter its details." · Grids: "Companies" · summary headers **Name of the Company | DIN | Shares listed? | Details | (remove)** · **+ Add company** · **Edit ✎** → nested detail · footer "Companies **N**".
#### Drill-in (nested): Directorship info. — entry N (shared `sf-detail`, spec itr3.html:1494-1495)
Group **Company**: Director Identification No.(DIN) (text) · Name of the Company (txtwide) · Type of Company (select `(Select) · Domestic Company · Foreign Company`) · PAN (text, placeholder ABCDE1234F) · Whether shares are listed? (select `(Select) · Listed · Unlisted`). Binds `data.director[idx]`. Not in export JSON.

### Particular: "Tax deferred on Sweat Equity Shares / Securities - B/F"   [Sch. tag ESOP; click ⋯ → opens]
#### Drill-in: Tax deferred on Sweat Equity Shares / Securities - B/F (source: itr3.html:904)
Meta "A.Y. 2026-27 · deferred tax on eligible start-up ESOP".
"Employer (Startup) details:" — **PAN** (`esr_pan`, uppercased) · **DPIIT registration No.** (`esr_dpiit`).
Grids: "Year-wise deferred tax" — fixed rows for AYs `2021-22 · 2022-23 · 2023-24 · 2024-25 · 2025-26` (same list both AY files) · headers **Assessment Year | Tax deferred - B/F | Tax attributed to sale | Date of Cessation of Employment, if any | Tax payable in CY | Balance Tax C/F** · Balance Tax C/F ⚙ = max(0, B/F − sale − CY) per row; **Total** row ⚙ sums all 5 columns.
Conditional: checkbox **"Details of tax attributable to Sweat Equity Shares/Securities sold"** (`esop_sold_chk`) reveals grid (UI-verified) — headers **Assessment Year in which Tax deferred | Date of Sale | Tax attributed to Sale | (remove)** · placeholder "2023-24" · **+ Add row** / ✕. Binds `data.esop`. Not in export JSON.

### Particular: "Other Forms filed"   [click ⋯ → opens]
#### Drill-in: Other Forms filed (source: itr3.html:931)
Meta "A.Y. 2026-27 · Form 10-IEA & Tax Return Preparer".

| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds | AY diff |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Opted out of 115BAC by filing Form 10-IEA within due date in earlier year? | select | Yes · No · NA (without business) | — | — | Yes | — | — | switches variant block below (UI-verified) | `ofr_optearlier` | `st_otherforms` | — |
| AY in which opted out | text | — | 2024-25 | — | empty | — | — | shown when = Yes | `ofr_ay` | — | — |
| Acknowledgment no. of Form 10-IEA | text | — | — | — | empty | — | — | shown when = Yes | `ofr_ack` | — | — |
| (subhead) Opting out of 115BAC in CY (10-IEA filed within due date): | — | — | — | — | — | — | — | shown when = No or NA (without business) | — | — | — |
| Date of upload of Form 10-IEA | text (fmtDate) | — | DD/MM/YYYY | — | empty | — | date mask | when No/NA | `ofr_iea_date` | — | — |
| Acknowledgment no. of Form 10-IEA | text | — | — | — | empty | — | — | when No/NA | `ofr_iea_ack` | — | — |
| Tax Return Preparer (TRP) info., if any | checkbox | — | — | — | unchecked | — | — | — | `ofr_trp_chk` | — | — |
| ID No. | text | — | — | — | empty | — | — | — | `ofr_trp_id` | — | — |
| Name | text | — | — | — | empty | — | — | — | `ofr_trp_name` | — | — |
| Reimbursement amount | num | — | — | — | empty | — | — | — | `ofr_trp_amt` | — | — |

### Particular: "Having Foreign assets and Income or Signing authority in Foreign a/c?"   [Sch. tag FA; checkbox `f_hasFA`]
Note row: "[Enter all items held (including any beneficial interest) at any time during the calendar year 2025.]" (same "calendar year 2025" text in BOTH AY files). Conditional: ticking reveals 9 sub-particular rows (`fa-wrap`, UI-verified). JSON ForeignExchangeFlag stays 'N'.

Sub-particulars (each ⋯ → its own drill-in; all 9 share the pattern: note "Report items held at any time during calendar year 2025. Click **Edit** on a row to enter its full details. If ZIP code is unavailable, enter **XXXXXX**. All amounts in ₹.", section "Entries", button **+ Add entry**, per-row **Edit ✎** → nested `sf-fa-detail` popup, remove ✕, footer "Entries **N**"):

### Particular: "Foreign Depository / Custodial accounts"   [click ⋯ → opens]
#### Drill-in: Foreign Depository / Custodial accounts (source: itr3.html:1032)
Summary headers **Country | Institution | Peak Balance (₹) | Details |** — nested detail groups (UI-verified): **Location & Institution**: Country (select: `(Select) · United States · United Kingdom · United Arab Emirates · Singapore · Canada · Australia · Germany · Switzerland · Netherlands · Hong Kong · Japan · Mauritius · Other`) · Institution name · Institution address (span2) · ZIP code (placeholder XXXXXX). **Account**: Account Type · Account Number · Ownership · Account opening date (DD/MM/YYYY). **Balances & Income (₹)**: Peak Balance during the year (num) · Closing balance (num) · Gross Income received (num) · Nature of Income.
### Particular: "Investments in Foreign Equity / Debts"   [click ⋯ → opens]
#### Drill-in: Investments in Foreign Equity / Debts (source: itr3.html:1044)
Summary **Country | Entity | Closing value (₹)**. Detail groups: **Entity**: Country · Entity name · Entity address · ZIP code · Nature · Date of acquiring interest (date). **Value of Investment (₹)**: Initial value · Peak value · Closing value. **Income (₹)**: Gross Income received · Proceeds from Sale / Redemption.
### Particular: "Surrender value of Foreign Insurance / Annuity Contract"   [click ⋯ → opens]
#### Drill-in: Surrender value of Foreign Insurance / Annuity Contract (source: itr3.html:1056)
Summary **Country | Institution | Surrender value (₹)**. Groups: **Institution**: Country · Institution name · Institution address · ZIP code · Date of contract (date). **Values (₹)**: Surrender value of contract · Gross Income received.
### Particular: "Financial Interest in any Entity"   [click ⋯ → opens]
#### Drill-in: Financial Interest in any Entity (source: itr3.html:1068)
Summary **Country | Entity | Total Investment (₹)**. Groups: **Entity**: Country · ZIP code · Nature of Entity · Name of the Entity · Address of the Entity · Ownership · Date since held (date). **Investment & Income (₹)**: Total Investment · Income accrued · Nature of Income. **Income offered in this return**: Taxable Income (₹) · Schedule of ITR · Item No. of schedule.
### Particular: "Immovable Property outside India"   [click ⋯ → opens]
#### Drill-in: Immovable Property (source: itr3.html:1080)
Summary **Country | Property | Total Investment (₹)**. Groups: **Property**: Country · ZIP code · Property address · Ownership · Acquisition date (date). **Investment & Income (₹)**: Total Investment · Income · Nature of Income. **Income offered in this return**: Taxable Income (₹) · Schedule of ITR · Item No. of schedule. (Row label on ITR Info says "outside India"; drill-in h2 omits it.)
### Particular: "Other Capital Assets outside India"   [click ⋯ → opens]
#### Drill-in: Other Capital Assets (source: itr3.html:1092)
Summary **Country | Asset | Total Investment (₹)**. Groups: **Asset**: Country · ZIP code · Nature of asset · Ownership · Acquisition date. **Investment & Income (₹)** and **Income offered in this return** as above.
### Particular: "Account in which Assessee is signing authority (not included above)"   [click ⋯ → opens]
#### Drill-in: Account in which Assessee is signing authority (source: itr3.html:1104)
Summary **Country | Institution | Peak Balance (₹)**. Groups: **Institution**: Institution name · Institution address · Country · ZIP code. **Account**: Account holder name · Account Number · Peak Balance (₹) · Income accrued (if liable to tax) (₹). **Income offered in this return**: Taxable Income (₹) · Schedule of ITR · Item No. of schedule.
### Particular: "Trusts in which Assessee is a Trustee / Beneficiary / Settlor"   [click ⋯ → opens]
#### Drill-in: Trusts (Trustee / Beneficiary / Settlor) (source: itr3.html:1116)
Summary **Country | Trust | Income derived (₹)**. Groups: **Trust**: Country · ZIP code · Trust name · Trust address. **Trustees**: Trustee name · Trustee address. **Settlor**: Settlor name · Settlor address. **Beneficiaries**: Beneficiary name · Beneficiary address. **Position & Income**: Position held since (date) · Income derived (if liable to tax) (₹). **Income offered in this return**: Taxable Income (₹) · Schedule of ITR · Item No. of schedule.
### Particular: "Other income not included above or in Sch. BP"   [click ⋯ → opens]
#### Drill-in: Other income not included above or in Sch. BP (source: itr3.html:1128)
Summary **Country | Person | Income derived (₹)**. Groups: **Source**: Country · ZIP code · Person from whom income derived — Name (span2) · Address (span2) · Income derived (₹) · Nature of Income. **Income offered in this return**: Taxable Income (₹) · Schedule of ITR · Item No. of schedule.
#### Drill-in (nested, shared): Foreign asset — detail (source: itr3.html:1140, `sf-fa-detail`)
Title becomes "{schedule title} — entry N" · meta "A.Y. 2026-27 · Schedule FA" · button **✓ Done**. FA data binds `data.fa_*[idx]`; none exported to JSON.

### Particular: "Having Assets and Liabilities? (if total income > Rs. 1 crore)"   [Sch. tag AL; checkbox `f_hasAL`]
Conditional: reveals `al-wrap` (UI-verified). Sub-header "Items entered in Part A-BS in ITR to be excluded · Cost at the end of FY (₹)". Footer note "^ Details of Assets/ Liabilities are compulsory where Total Income > Rs.1 crore. In case value of an item is 'NIL', please enter '0'."
AL rows (acct-row style, Amount column):
- **Do you own any Immovable asset ?** — direct num input `data-al="al_immovable"` (no drill). Discrepancy note: yes/no wording but amount field.
- **Bank Balances & deposits** ⋯ → Drill-in (source: itr3.html:1146) — generic break-up: "Break-up" + **+ Add row**, grid **Particulars | Amount | (remove)**, footer "Total **₹n**" (⚙ feeds read-only `al_bank_cv` cell); Load/Save-defaults toolbar injected (see Defaults). Same pattern for:
- **Shares and Securities** ⋯ (itr3.html:1156) → `al_shares_cv`
- **Insurance policies** ⋯ (itr3.html:1166) → `al_insurance_cv`
- **Loans and Advances** ⋯ (itr3.html:1176) → `al_loans_cv`
- **Cash in hand** — direct num `data-al="al_cash"` (no drill)
- **Jewellery, bullion etc.** ⋯ (itr3.html:1186) → `al_jewellery_cv`
- **Paintings / Artwork etc.** ⋯ (itr3.html:1196) → `al_paintings_cv`
- **Vehicles / Boats etc.** ⋯ (itr3.html:1206) → `al_vehicles_cv`
- **Interests in assets of Firm/AOP** ⋯ → Drill-in (source: itr3.html:1226): "Firms / AOPs" + **+ Add row**, wide grid headers **Name of Firm/AOP | Investment (cost) | PAN | Flat / Door / House No. | Premises | Road | Area/Locality | Town/City | State | PIN / ZIP code | Country | (remove)** · footer "Total investment **₹n**" (⚙ feeds `al_firm_cv`)
- **Total** — ⚙ `al_total` = immovable + all breakup totals + cash + firm total
- **Liabilities relating to the above assets** ⋯ (itr3.html:1216) → `al_liab_cv` (excluded from Total)
Not in export JSON.

### Particular: "Having Books not maintained cases of Business/profession?" (checkbox `f_noBooks`)
Conditional: reveals `nobooks-wrap` (UI-verified). Sub-header "Financial particulars of the Business / Profession". Rows (direct num inputs, no drills): **Sundry creditors** (`nb_creditors`) · **Stock- in-trade** (`nb_stock`) · **Sundry debtors** (`nb_debtors`) · **Cash balance** (`nb_cash`). Not overlaid into JSON NoBooksOfAccPL (only NetProfit is set there from the computation).

---

## Screen: ITR B/S (tab `pane-bs`, itr3.html:428-484)

Enable checkbox: **"ITR B/S"** (`bs_enable`, default checked; unchecked → rail "B/S check off").
All rows are `acct-row` with right-aligned num input (`data-bs="…"`, placeholder 0, oninput computeAll). ⚙ totals live-verified (capital 1,00,000 vs gross block 1,00,000 → "✓ tallied").

**Liabilities** (sub-header): Proprietor's capital (`bs_capital`) · Reserves and surplus ⋯ (`bs_reserves`, breakup drill) · group **Secured loans**: Foreign Currency Loans (`bs_sec_fcl`) · Rupee Loans - Banks (`bs_sec_rlb`) · - Others (`bs_sec_rlo`) · group **Unsecured loans (including deposits)**: Banks (`bs_unsec_banks`) · Others (`bs_unsec_others`) · Deferred tax liability (`bs_dtl`) · Advances^^ (`bs_advances`) · group **Current liabilities**: Sundry Creditors (`bs_cl_creditors`) · Liability for Leased Assets (`bs_cl_leased`) · Interest Accrued on above (`bs_cl_intacc`) · Interest accrued but not due on loans (`bs_cl_intnotdue`) · group **Provisions**: Income Tax (`bs_prov_it`) · Leave encashment/Superannuation/Gratuity (`bs_prov_leave`) · Other provisions (`bs_prov_other`) · **Total Liabilities** ⚙ `bs_total_liab` = capital+reserves+secured+unsecured+dtl+advances+curliab+provisions.

**Assets** (sub-header): group **Fixed assets**: Gross block (`bs_fa_gross`) · Less: Depreciation (`bs_fa_dep`) · Capital work-in-progress (`bs_fa_cwip`) · group **Investments**: Long term - Quoted securities (`bs_inv_ltq`) · - Unquoted securities (`bs_inv_ltu`) · Short term - Equity Shares (`bs_inv_steq`) · - Preference Shares (`bs_inv_stpref`) · - Debentures (`bs_inv_stdeb`) · group **Current assets** › **Inventories**: Stores/Consumables/Packing materials (`bs_inv_stores`) · Raw materials (`bs_inv_raw`) · Stock- in- process (`bs_inv_wip`) · Finished Goods/Traded Goods (`bs_inv_fg`) · Sundry debtors (`bs_ca_debtors`) · Cash (`bs_ca_cash`) · Banks (`bs_ca_banks`) · Other Current Assets ⋯ (`bs_ca_other`, breakup) · group **Loans and advances**: Advances (`bs_la_adv`) · Deposits and loans ⋯ (`bs_la_dep`, breakup) · Balance with Revenue Authorities (`bs_la_bra`) · Miscellaneous expenditure (`bs_misc`) · Deferred tax asset (`bs_dta`) · Profit and loss A/c (Dr) (`bs_pldr`) · **Total Assets** ⚙ `bs_total_assets` = (gross−dep+cwip)+investments+(inventories+debtors+cash+banks+other)+(adv+dep+bra)+misc+dta+pldr.

**^^Additional Data** (maroon group): Others ⋯ (`bs_addl_others`, breakup).

### Particular: B/S breakup drills "Reserves and surplus" / "Other Current Assets" / "Deposits and loans" / "Additional Data — Others"   [click ⋯ → opens shared detail popup]
#### Drill-in: "{title} — details" (shared `sf-detail`, source itr3.html:1260; builder itr3.html:1742-1772)
Generic break-up: section "Break-up" + button **+ Add row** · defaults toolbar **⤓ Load my default particulars** / **★ Save these labels as my default** / hint "{N} default label(s) saved" or "no defaults saved yet" (only for templatable keys) · grid **Particulars | Amount | (remove ✕)** · footer "Total **₹n**". ⚙ Total auto-copies into the parent row's input when the breakup has data (never while parent focused). Binds `data.breakups[key][]`. UI-verified ("Other expenses — details" opened with add + defaults buttons).

---

## Screen: ITR P&L (tab `pane-pl`, itr3.html:488-573)

Enable checkbox: **"Manufacturing, Trading and P&L A/c"** (`pl_enable`, default checked).

**ITR Manufacturing A/c** (sub-header): group **Opening Stock**: Raw material (`pl_mfg_os_raw`) · Work-in-progress (`pl_mfg_os_wip`) · Purchases (net of returns / duty / tax) (`pl_mfg_purchases`) · group **Expenses**: Direct Wages (`pl_mfg_wages`) · Direct Expenses ⋯ (`pl_mfg_directexp`) · Factory Expenses ⋯ (`pl_mfg_factory`) · group **Less: Closing stock**: Raw material (`pl_mfg_cs_raw`) · Work-in-progress (`pl_mfg_cs_wip`) · **Cost of Production** ⚙ `pl_mfg_cop` = opening+purchases+expenses−closing.

**ITR Trading A/c**: group **Incomes** › **Sales / Gross receipts of Business (net of returns)**: Sale of products/goods (`pl_trd_sale_goods`) · Sale of services (excluding Professional receipts) (`pl_trd_sale_services`) · Other operating revenues ⋯ (`pl_trd_other_rev`) · Gross receipts from Profession (`pl_trd_gross_prof`) · Duties, taxes and cess on sales ⋯ (`pl_trd_duties`) · Closing Stock - Finished goods (`pl_trd_closing_fg`) · **Total** ⚙ `pl_trd_inc_total` (sum of the six) · group **Expenses**: Opening Stock - Finished goods (`pl_trd_opening_fg`) · Purchases (net of returns / duty / tax) (`pl_trd_purchases`) · Direct Expenses ⋯ (`pl_trd_directexp`) · Taxes on Inputs / Purchases ⋯ (`pl_trd_taxes_inputs`) · **Cost of Production  (as per Manufacturing A/c)** ⚙ `pl_trd_cop` (carried) · **Gross Profit** ⚙ `pl_trd_gp` = income total − (opening+purchases+direct+taxes+COP) (UI-verified 5,00,000−3,00,000=2,00,000) · Intraday Trading Income ⋯ (`pl_trd_intraday`, FIXED breakup) · Futures & Options Trading Income ⋯ (`pl_trd_fno`, FIXED breakup).

**ITR P&L A/c**: group **Incomes**: **Gross profit (as per Trading A/c)** ⚙ `pl_pl_gp` · Other Income ⋯ (`pl_pl_other_inc`) · group **Expenses** (each plain num unless ⋯): Advertisement · Audit fee · Bad debts* · Club expenses · Commission ^ · Conference · Consumption of stores and spares · Conveyance · Donation · Entertainment · Festival celebration · Freight outward · Gift · Guest House expenses · Hospitality · Hotel, boarding and lodging · Insurance ⋯ · Power and fuel · Professional / Consultancy / Technical fees ^ · Provisions ⋯ · Rents · Repairs - Building · Repairs - Machinery · Royalty ^ · Salaries and other benefits ^ ⋯ · Sales promotion (excluding Advertisement) · Scholarship · Staff welfare · Taxes and rates paid ⋯ · Telephone · Travelling ^ · Other expenses ⋯ (binds `pl_exp_advert … pl_exp_other`) · **Profit before interest, depreciation and taxes (PBIT)** ⚙ `pl_pbit` = GP + Other Income + Intraday + F&O − total expenses (UI-verified) · Less: Interest ^ (`pl_less_interest`) · Depreciation (`pl_less_depreciation`) · **Profit before Taxes (PBT)** ⚙ `pl_pbt` · Less: Provision for - Current tax (`pl_less_currenttax`) · - Deferred Tax (`pl_less_deferredtax`) · **Profit after taxes (PAT)** ⚙ `pl_pat` · Add: Balance B/F from previous year (`pl_add_bf`) · Less:  Transfer to Reserves (`pl_less_reserves`) · **Balance carried to B/S** ⚙ `pl_balance_bs` (also rail pill "P&L balance to B/S").

**Additional Data** (maroon): ^ Foreign payments, included in above ⋯ (`pl_addl_foreign`) · *Analysis of Bad debts ⋯ (`pl_addl_baddebts`).

### Particular: generic P&L breakup drills (Direct Expenses ×2, Factory Expenses, Other operating revenues, Duties taxes and cess on sales, Taxes on Inputs / Purchases, Other Income, Insurance, Provisions, Salaries and other benefits, Taxes and rates paid, Other expenses, Foreign payments included in above, Analysis of Bad debts)   [click ⋯ → opens shared detail popup]
Same generic break-up pattern as B/S (Particulars | Amount, + Add row, Total ⚙ → parent, defaults toolbar).

### Particular: "Intraday Trading Income"   [click ⋯ → opens fixed breakup]
#### Drill-in: Intraday Trading Income — details (shared `sf-detail`; spec itr3.html:1521-1523)
Note "Intraday (speculative) trading — sales minus purchases." Fixed rows (no add/remove): **Sales / turnover** · **Less: Purchases** · **Less: Direct expenses** · footer "**Net intraday income ₹n**" ⚙ = sales − purchases − expenses → parent `pl_trd_intraday`. Binds `data.fixedBreakups.pl_trd_intraday`.

### Particular: "Futures & Options Trading Income"   [click ⋯ → opens fixed breakup]
#### Drill-in: Futures & Options Trading Income — details (shared `sf-detail`; spec itr3.html:1516-1520)
Note "Futures & Options — turnover is the aggregate of favourable & unfavourable differences." Fixed rows: **Aggregate of favourable differences** · **Aggregate of unfavourable differences (as +ve figure)** · **Premium on sale of options** · **Less: Expenses (brokerage, STT, etc.)** · footer "**Net F&O income ₹n**" ⚙ = favourable − unfavourable − premium − expenses (net spec: first positive, rest subtracted — see Discrepancy note) → parent `pl_trd_fno`. UI-verified: 2,00,000 / 50,000 / — / 10,000 → ₹1,40,000 auto-filled into the parent P&L field.

---

## Screen: Computation of Income (tab `pane-comp`, itr3.html:577-579)

`<iframe id="calcFrame">` loading the embedded shared "Tax Computation · Master Calculator · AY 2026-27" (calc-html block itr3.html:2737-12996). **The shared sheet is documented separately — not extracted here.** Verified byte-identical to ITR-2's embedded calculator except (diff-verified):

**ITR-3-specific computation addition — head "Profits and gains of Business or Profession" is UNHIDDEN** (ITR-1/ITR-2 ship it with `style="display:none"`; ITR-3 shows it collapsed, `g-bp`, calc source at itr3.html:2926-2984). Its particulars (columns **Turnover/Receipts | Profit**):
- Business: Presumptive profits u/s 44AD ⋯ (`sf-44ad`) → ⚙ `it_bp_44ad_to` / `it_bp_44ad_pr`
- Profession: u/s 44ADA - Presumptive profits ⋯ (`sf-44ada`; note: eligible limit Rs.75 lakhs if cash receipts ≤5%, else Rs.50 lakh) → `it_bp_44ada_to/_pr`
- Sub-head "Special Business: Income from Firm, speculation, 44AE.....": 35AD - Specified business profits ⋯ (`sf-35ad` → `it_bp_35ad`) · Commission / Agency Business without books ⋯ (`sf-comm` → `it_bp_comm`) · Futures & Options - without books of a/c ⋯ (`sf-fno` → `it_bp_fno`) · Income from partnership firm ⋯ (`sf-firm` → `it_bp_firm`) · Non-specified Profession without books of a/c ⋯ (`sf-nonspec` → `it_bp_nonspec`) · Transport business - U/s 44AE ⋯ (`sf-44ae` → `it_bp_44ae`) · Speculation business profits ⋯ (`sf-spec` → `it_bp_spec`)
- **Business-1** block: Net Profit Before Tax as per P & L a/c (input `it_b1_npbt`) · "Add: Inadmissible expenses & Income not included": Depreciation debited to P & L a/c (input `it_b1_dep`) · 36 disallowance ⋯ · 37 disallowance ⋯ · 40 disallowance ⋯ · 40A disallowance ⋯ · 43B disallowance ⋯ · Deemed Incomes ⋯ · Effect of deviation from ICDS and Valuation method u/s 145A ⋯ · Expenses / Losses considered under other heads ⋯ · Income not credited to P & L A/c ⋯ · Other additions ⋯ · "Less: Deductible expenditure & income to be excluded": 35 to 35E, 33AB, 33ABA deductions ⋯ · Exempt income included in net profit ⋯ · Income tax refund (input) · Incomes considered separately ⋯ · Other deductions ⋯ · **Adjusted Profit of Business-1** ⚙ `it_b1_adjusted`
- **Profession-1** block: mirror of Business-1 (Net Income Before Tax as per P & L a/c `it_p1_nibt`; "Deemed income u/s 41" instead of "Deemed Incomes"; no Exempt/Incomes-considered-separately rows) · **Adjusted Income of Profession-1** ⚙ `it_p1_adjusted` · Less: Depreciation as per IT Act ⋯ (`sf-depit` → `it_p1_depit`)
- **Income chargeable under 'Business or Profession'** ⚙ `it_bp_income` — the comp line ITR-3 reads everywhere.
Also unhidden vs ITR-1 (but same as ITR-2): CG rows LTCG-1 / Long-term Capital gain from Auto-classification table / STCG-1 / Auto-classification of STCG / LTCG.

Comp lines the ITR-3 shell reads from the calculator (`calcVal`, itr3.html:2262-2281, 2548-2591): `it_sal_total`, `it_hp_income`, `it_os_interest`, `it_os_dividend`, `it_os_familypension`, `it_os_other`, `it_os_winnings`, `it_bp_income`, `it_cg_112a`, `it_cg_ltcg1`, `it_cg_ltauto`, `it_cg_stcg1`, `it_cg_auto`, `it_80_total`, `it_totalIncome`, `it_taxOnTI`, `it_balancePayable`, `it_regime` (New/Old). Shell pushes into calc: `cl_name/cl_pan/cl_dob/cl_status`; AIS import pushes into calc candidate ids `it_sal_gross_master|sal_gross|emp1_gross`, `os_int_master|it_os_int_input`, `os_div_master|it_os_div_input`, `it_advtax_input|advtax_master`, `it_tds_master|tds_total_input`.

---

## Screen: Tax Summary & Filing (tab `pane-summary`, itr3.html:582-610)

Card **"Statement of Total Income & Tax"** (all ⚙ read-only, refreshed from calc every 1.5 s while active): Income from Salaries · Income from House Property · Profits & Gains of Business or Profession · Income from Capital Gains · Income from Other Sources · **Gross Total Income** · Less: Deductions under Chapter VI-A · **Total Income** · Tax on Total Income (after rebate, cess, relief) · Less: TDS / TCS / Advance Tax / SAT · **Balance Tax Payable** (label flips to **"Refund Due"** when balance < 0). Footnote: "Figures are computed live on the Computation tab. ITR-3 supports business/profession income (fill the B/S and P&L tabs), multiple employers, multiple house properties and full capital gains."

Card **"Validation"**: placeholder "Click \"Export ITR JSON\" to run validation checks." → after export: ✕ error items, ⚠ warning items, ✓ "No blocking errors. JSON exported (with warnings above)." + "N error(s), N warning(s)".
validateItr3 rules (itr3.html:2539-2554): ERRORS — "PAN is missing or invalid (format ABCDE1234F)." · "Name of Assessee is required." WARNINGS — "Date of Birth should be DD/MM/YYYY (needed for correct age-based slab)." · "Business/Profession income is present — review the Balance Sheet and P&L tabs and, if the accounts are audited u/s 44AB, set the audit flags before filing." (when it_bp_income>0) · "Refund due but no bank account with IFSC entered — add one for the refund to be credited." · "Open the Computation tab at least once so tax figures are available."

Card **"AIS Import Preview"** (hidden until import): rows PAN in AIS · Financial Year · Salary (gross) · Salary TDS · Interest income · Dividend income · Total TDS · Advance Tax · Self-Assessment Tax; PAN-mismatch warning "AIS PAN (X) differs from the PAN entered (Y)…"; buttons **Fill into Computation** / **Cancel**. AIS accepts CSV or password-protected PDF (password auto-derived: PAN lowercase + DDMMYYYY; `window.prompt` fallback).

---

## Global Drill-in: Manage Default Particulars (source: itr3.html:1239, opened by ⚙ Defaults)
Meta "Reusable label templates · saved on this machine · amounts are never stored" · storage warning "⚠ Browser storage is blocked in this preview…" (shown only when localStorage fails) · toggle "**Auto-fill defaults** when a break-up opens empty" (default ON) · buttons **⭳ Export templates (.json)** · **⭱ Import templates** · **Clear all templates** · note "Enter one label per line for each break-up you use often (e.g. under Direct Expenses: Freight, Loading & unloading, Octroi). Leave a line blank to skip it." · groups (details/summary, count badge "N of M have defaults"): **Balance Sheet** (Reserves and surplus · Other Current Assets · Deposits and loans · Additional Data — Others), **Manufacturing / Trading / P&L** (14 keys incl. all ⋯ P&L breakups), **Assets & Liabilities** (8 AL breakups). One textarea per key (placeholder "One label per line…", live-saved to localStorage `itr3_default_particulars_v1` / `itr3_autofill_particulars_v1`). Fixed breakups (Intraday, F&O) are NOT templatable.

---

## ITR-3 JSON export mapping (buildItr3Json, itr3.html:2566-2670)
Emits `ITR.ITR3` with CreationInfo, Form_ITR3, PartA_GEN1 (PersonalInfo + FilingStatus), PartA_GEN2 (all flags 'N'), PARTA_BS (zero skeleton), PARTA_PL (zero skeleton; NoBooksOfAccPL.NetProfit/TotBusinessProfession = it_bp_income), ITR3ScheduleBP (skeleton; ProfBfrTaxPL/NetPLAftAdjBusOthThanSpec/NetPLBusOthThanSpec7A7B7C/IncChrgUnHdProftGain = it_bp_income), ScheduleCYLA/ScheduleBFLA (pass-through of STCGAppRate/LTCG12_5Per/Salary), PartB-TI (heads from comp lines; IncChargeTaxSplRate111A112 = LTCG+winnings), PartB_TTI (tax figures; Rebate87A/surcharge/cess emitted 0), TaxPaid (AdvanceTax/SAT from AIS, TDS = prepaid−adv−sat), Refund + bank rows, Verification; TDSonSalaries / TDSonOthThanSals appended from AIS entries.

## AY differences (itr3.html vs itr3-2025-26.html — full diff, verified)
- Title/banner/all subform metas: "A.Y. 2026-27" ↔ "A.Y. 2025-26" (line-for-line identical otherwise; 12,996 vs 12,997 lines).
- Export filename: `{PAN}_2026-27_ITR3.json` ↔ `{PAN}_2025-26_ITR3.json` (2025-26 file line 2561).
- Form_ITR3: AssessmentYear '2026'/SchemaVer 'Ver1.1' ↔ '2025'/'Ver1.0'.
- FilingStatus: 2025-26 adds `OptOutNewTaxRegime_Method` ('OPTINRETURN'/'BY10IEA'); ItrFilingDueDate '2026-07-31' ↔ '2025-09-15'.
- PartB-TI CapGain buckets: 2025-26 keeps `ShortTerm15Per`, `LongTerm10Per`, `LongTerm20Per`; 2026-27 drops them (12.5% LTCG regime only).
- ScheduleCYLA/BFLA: 2025-26 adds `STCG15Per`/`LTCG10Per`/`LTCG20Per` keys.
- Embedded calc new-regime slabs: 2026-27 `0–4L nil, 4–8L 5%, 8–12L 10%, 12–16L 15%, 16–20L 20%, 20–24L 25%, >24L 30%` ↔ 2025-26 `0–3L nil, 3–7L 5%, 7–10L 10%, 10–12L 15%, 12–15L 20%, >15L 30%`.
- Rebate 87A (new regime): 2026-27 TI ≤ ₹12,00,000 cap ₹60,000 (+marginal relief) ↔ 2025-26 TI ≤ ₹7,00,000 cap ₹25,000.
- CFL year columns (embedded calc): 2026-27 `2026-27 | 2025-26 | 2024-25 | 2023-24` ↔ 2025-26 file shows `2025-26 | 2025-26 | 2024-25 | 2023-24` (first column not shifted to 2022-23 — see Discrepancy).
- "calendar year 2025" FA text and ESOP_YEARS list `2021-22…2025-26` are identical in both files (not year-shifted).

## Discrepancy notes (cross-cutting)
- **Discrepancy note (Other Audits):** "50B" section row duplicated (itr3.html:786, :794); "Foreign Exchange Management Act, 1999" act row duplicated (itr3.html:843, :847). Inputs in this drill are DOM-only — not saved to state, not exported.
- **Discrepancy note (JSON vs B/S / P&L tabs):** figures entered on the ITR B/S and ITR P&L tabs are NOT mapped into the exported PARTA_BS/PARTA_PL — both are emitted as schema-complete zero skeletons; business income rides only on `NoBooksOfAccPL.NetProfit` from the computation's `it_bp_income` (itr3.html:2604-2612).
- **Discrepancy note (P&L → computation):** the P&L tab's PBT does not auto-feed the calculator's Business-1 "Net Profit Before Tax as per P & L a/c" (`it_b1_npbt`); the user must re-enter it in the Computation tab; Tax Summary "Profits & Gains" reads `it_bp_income` only.
- **Discrepancy note (F&O net formula):** spec order `net:['favourable','unfavourable','premium','expenses']` subtracts **Premium on sale of options** (net = favourable − unfavourable − premium − expenses) although the row is not labelled "Less:".
- **Discrepancy note (Verifier):** Verification JSON hardcodes `Capacity:'S'` and `AssesseeVerPAN`=client-bar PAN; the drill-in's Capacity and PAN fields are not exported.
- **Discrepancy note (Bank type codes):** "Type of Account" UI strings (Savings/Current/…) are exported verbatim as `AccountType` (schema expects codes such as SB); `'SB'` used only when type empty.
- **Discrepancy note (Part B-TTI zeros):** Rebate87A/Surcharge/EducationCess are exported as 0; ITR-3's embedded calc lacks the `window.__taxBreakup` exposure that ITR-1's embedded calc has (itr1 calc diff at calc line ~10229).
- **Discrepancy note (2025-26 CFL header):** duplicated "2025-26" year column in the 2025-26 file's CFL tables (embedded calc).
- **Discrepancy note (Schedule AL row):** "Do you own any Immovable asset ?" is a yes/no-phrased label bound to an amount input (`al_immovable`).
- **Discrepancy note (labels):** ITR Info rows say "Immovable Property outside India", "Other Capital Assets outside India", "Trusts in which Assessee is a Trustee / Beneficiary / Settlor", "Account in which Assessee is signing authority (not included above)" while their drill-in h2 titles are the shorter forms documented above.
- **Discrepancy note (dead data):** PTI, SPI, GSTR, Nature of Business, 92CE, ESOP, Other Forms, Directorship, Unlisted shares, FA and AL data are captured in state but never emitted by buildItr3Json (flags in FilingStatus stay 'N').
- UI-walk: one console error during automated walk ("Cannot read properties of null (reading 'querySelectorAll')") — traced to bindRm being called for a popup body absent after close; not reproducible by manual flows; no functional impact observed.
