# ITR-7 — COMPLETE STRUCTURE MAP

Route(s): `/company/[id]/income-tax` (statutory view for entity types `trust` / `society` / `section8`) · iframe loads `/tax-utilities/itr7.html`
Entry component: `src/app/company/[id]/income-tax/page.tsx` — `STATUTORY_ITR` map at `page.tsx:74-84` (`trust: 'itr7'`, `society: 'itr7'`, `section8: 'itr7'`), URL builder at `page.tsx:47` (`if (key === 'itr5' || key === 'itr6' || key === 'itr7') return \`/tax-utilities/${key}.html\``), rendered by `StatutoryItrView` at `page.tsx:693` → `ItrYearForms` at `page.tsx:710` (same iframe workspace as individual forms, `page.tsx:249`).
AYs covered: **2026-27 only** (no 2025-26 file ships; every subform meta reads "A.Y. 2026-27").
Source file: `public/tax-utilities/itr7.html` (12,357 lines, fully self-contained).

Builder globals (confirmed by grep): `buildITR7Json()` at `itr7.html:12027`, `exportJson()` at `itr7.html:12327`, `validateITR7()` at `itr7.html:11941`, `runValidate(openPanel)` at `itr7.html:12294`. Layout: scroll sections (`div.sec`), tab buttons scroll via `data-go` (`itr7.html:11874`), "Go to next →" walks `ORDER=['sec-itrinfo','sec-115td','sec-fa','sec-inc','sec-app','sec-bs','sec-10b','sec-10bb']` (`itr7.html:11872`). Drill-ins are `SF['sf-…']` popup definitions (`itr7.html:10923-11494`) opened by clicking any `[data-sf]` cell (`⋯` drill dots or the status chip).

Method note — **UI-walk performed** (Playwright + msedge against `http://localhost:7777/tax-utilities/itr7.html`): main sheet fully live-verified (sections, drill-open/close, conditionals, live totals, validation panel, JSON build). Computation iframe found **inert at runtime** — see Screen: Computation discrepancy.

---

## Chrome (always visible)

**Top bar** (`itr7.html:146-158`): title "ITR-7 data entry — Trust (ITR 7)" · tabs (verbatim): `ITR Info` (→sec-itrinfo) · `ITR B/S` (→sec-bs) · `Form 10B` (→sec-10b) · `Form 10BB` (→sec-10bb) · `Computation` (id `tabComp`, swaps the sheet for the comp iframe) · badge `A.Y. 2026-27` · button `Go to next →` (`btnNext`, scrolls to next visible section; no-op in Computation view).

**Client bar** (`itr7.html:160-165`):

| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds |
|---|---|---|---|---|---|---|---|---|---|---|
| Name of the Trust / Institution | text | — | — | — | '' | Yes (if sf-assessee name blank) | ≤125 chars | — | `S.name` (`data-k="name"`) | JSON `AssesseeName.SurNameOrOrgName` (fallback), comp banner |
| PAN | text (maxlength 10, auto-uppercase) | — | — | — | '' | Yes (if sf-assessee PAN blank) | `RX_PAN` 5 letters+4 digits+1 letter | — | `S.pan` | JSON `PAN` fallback, export filename `{PAN}_ITR7_AY2026-27.json` |
| Date of formation | text | — | DD/MM/YYYY | — | '' | Yes | valid DD/MM/YYYY | — | `S.dof` | JSON `DateOFFormOrIncorp` (ISO) |
| Residential Status | select | (blank) / Resident / Non-Resident | — | — | '' | Yes | — | — | `S.res` | JSON `FilingStatus.ResidentialStatus` ('NRI' if Non-Resident else 'RES') |

**Status line** (`itr7.html:169`): "For persons required to furnish ITR-7 u/s 139(4A) to (4D)".

**Bottom rail** (`itr7.html:419-428`): pills `ITR-7 · Trust` · `Aggregate income (10/11/12) ₹ {r_agg}` · `Application allowed ₹ {r_app}` · `B/S {r_bs}` ("Tallied ✓" when TA−TL=0, else "Diff {n}", "—" when B/S off) · validation pill `r_val` ("Not validated" → live "⚠ N errors — not ready to upload" / "⚠ N warnings — export allowed" / "✓ Validated — ready to upload") · buttons `Validate` · `Export JSON`. UI-walk: empty sheet shows "⚠ 21 errors — not ready to upload".

---

## Screen: ITR Information (`sec-itrinfo`, itr7.html:171-220)

Collapsible (− toggle `bd-itrinfo`). Section tag column shows `Schedule` header chip; per-row chips noted below. Group sub-headers (non-interactive, verbatim): `Basic info.` · `Trust info.` · `ITR filing info.` · `Income related info.` · `Audit related details` · `Business related info. (if applicable)` · `Funds & Investments info.` · `Other info.`

### Particular: "Assessee info."   [click → opens: sf-assessee]
#### Drill-in: Assessee info. (source: itr7.html:10925)
Cards: "Name & PAN", "Address", "Contact" (all `fields('assessee',…)` label+input pairs).

| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds |
|---|---|---|---|---|---|---|---|---|---|---|
| Name of the Trust / Institution | text (wide) | — | — | — | '' | Yes | ≤125 chars | — | `assessee.name` | `AssesseeName.SurNameOrOrgName` |
| PAN | text | — | — | — | '' | Yes | RX_PAN | — | `assessee.pan` | `PAN`, export filename |
| Office held (if any) | text | — | — | — | '' | No | — | — | `assessee.off` | (not exported) |
| Flat / Door / Block No. | text | — | — | — | '' | Yes | — | — | `assessee.flat` | `Address.ResidenceNo` |
| Name of Premises / Building / Village | text | — | — | — | '' | No | — | — | `assessee.prem` | `Address.ResidenceName` |
| Road / Street / Post office | text | — | — | — | '' | No | — | — | `assessee.road` | `Address.RoadOrStreet` |
| Area / Locality | text | — | — | — | '' | Yes | — | — | `assessee.area` | `Address.LocalityOrArea` |
| Town / City / District | text | — | — | — | '' | Yes | — | — | `assessee.town` | `Address.CityOrTownOrDistrict`, `CreationInfo.IntermediaryCity` |
| State | select | STATES (blank + 36 Indian states/UTs, 'Andaman & Nicobar' … 'West Bengal') | — | — | '' | Yes | must map to portal state list (`SC_STATE`) | — | `assessee.state` | `Address.StateCode` |
| Country | select | COUNTRIES (blank, India, Australia, Bangladesh, Canada, China, France, Germany, Hong Kong, Indonesia, Ireland, Italy, Japan, Kenya, Malaysia, Mauritius, Nepal, Netherlands, New Zealand, Nigeria, Oman, Qatar, Russia, Saudi Arabia, Singapore, South Africa, South Korea, Spain, Sri Lanka, Sweden, Switzerland, Thailand, U.A.E., United Kingdom, United States, Other) | — | — | '' | No (defaults 91) | — | — | `assessee.country` | `Address.CountryCode` |
| PIN / ZIP code | text | — | — | — | '' | Yes if country=India | RX_PIN 6 digits, no leading 0 | — | `assessee.pin` | `Address.PinCode` |
| Phone No. (with STD code) | text | — | — | — | '' | No | — | — | `assessee.phone` | (not exported) |
| Mobile No. | text | — | — | — | '' | Yes | RX_MOBILE 10 digits, no leading 0 | — | `assessee.mobile` | `Address.MobileNo` (`CountryCodeMobile:91` fixed) |
| e-Mail ID | text (wide) | — | — | — | '' | Yes | RX_EMAIL | — | `assessee.email` | `Address.EmailAddress` |

Buttons: `✓ Done` (close). Status chip `st_assessee`: "Entered" when any field filled.

### Particular: "Verifier info."   [click → opens: sf-verifier]
#### Drill-in: Verifier info. (source: itr7.html:10937)

| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds |
|---|---|---|---|---|---|---|---|---|---|---|
| Name | text | — | — | — | '' | Yes | — | — | `verifier.name` | `Verification.Declaration.AssesseeVerName` |
| PAN | text | — | — | — | '' | Yes | RX_PAN_PERS (4th char must be 'P') | — | `verifier.pan` | `AssesseeVerPAN` |
| Designation | text | — | — | — | '' | No | — | — | `verifier.desig` | (not exported) |
| Father's name | text | — | — | — | '' | Yes | — | — | `verifier.father` | `FatherName` |
| Capacity | select | CAPACITY: (blank), Managing Director, Director, Principal Officer, Chief Executive Officer, Representative Assessee, Others | — | — | '' | Yes | — | — | `verifier.capacity` | `Capacity` via MAP_CAPACITY (MD/DR/PO/CE/RE/OT; default 'PO') |
| Place of signing | text | — | — | — | '' | Yes | — | — | `verifier.place` | `Verification.Place` |
| Date of signing | text | — | DD/MM/YYYY | — | '' | Yes | valid DD/MM/YYYY | — | `verifier.date` | `Verification.Date` (ISO) |

Helper note (verbatim): "Details of 'Verifier' entered here, should match with the 'Key Person Details' under 'My Profile' of Income tax website. PAN must be the verifier's own (individual) PAN — the 4th character has to be 'P'."

### Particular: "Bank Accounts"   [click → opens: sf-bank]
#### Drill-in: Bank Accounts (source: itr7.html:10945)
Grid "Bank Accounts (All)" — headers verbatim: `Bank Name | Account Number | IFS Code | Type of Account | For refund?` + remove `✕` column. Row fields: bank(text)→`bank[i].bank`, acno(text), ifsc(text, RX_IFSC `[A-Z]{4}0[A-Z0-9]{6}`), type(select ACCT_TYPE: blank/Savings/Current/Cash Credit/Overdraft/Other), refund(checkbox). Add button: `+ Add row`. Required: ≥1 account; per row Bank name / IFS Code / Account number / Account type; ≥1 refund tick.
Helper note (verbatim): "If multiple accounts are ticked, refund will be credited to one of the validated account. For the procedure to validate the account in IT e-filing portal, press 'F1' key."
Feeds: `PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[]` (IFSCCode, BankName, BankAccountNo, AccountType via MAP_ACCTTYPE SB/CA/CC/OD — 'Other'→'SB', UseForRefund 'true'/'false'). Status chip: "N account(s)".

### Particular: "Is a Venture capital fund?"  (inline)
Select in value column: (blank)/Yes/No · Binds `q.vcf` · Not exported. Default ''.

### Particular: "Trustees & related persons"   [click → opens: sf-trustees]
#### Drill-in: Trustees & related persons (source: itr7.html:10953)
Card 1 title: "Trustees & related persons (as at any time during the Previous year)"; helper line: "Details of all the Authors/ Founders/ Settlors/ Trustees/ Members/ Directors/ Office Bearers/ Shareholders holding 5% or more share".
Grid headers verbatim: `Name | Address | Relation | Resident? | Type of ID | ID No. | Mobile No. | E-mail ID | Shareholding (%) | Changes in Relation, if any^^ | State | PIN / ZIP code | Area / Locality | Post office | District | Country` (+ ✕). Relation options: (blank), Author, Founder, Settlor, Trustee, Member, Director, Office Bearer, Shareholder holding 5% or more share, Manager, Other. Resident?: Yes/No. Type of ID: (blank), PAN, Aadhaar, Passport, Driving Licence, Voter ID, Tax Identification Number, Other. Add: `+ Add row`. Binds `trustees[]`.
Field below grid: "Whether any of the above mentioned persons is other than Individual?" — checkbox `tr_other` (default false). **Conditional:** when ticked, reveals card "Details of natural persons who are beneficial owners (5% or more) of such entity" — grid headers: `Name of Individual | Address | Resident? | Corresponding Entity ^^ | Type of ID | ID No. | % of beneficial ownership | Changes, if any^^ | State | PIN / ZIP code | Area / Locality | Post office | District | Country` (binds `benef[]`). (UI-walk verified: hidden before tick, shown after.)
Card: "Details of Persons who made substantial contribution - Sec. 13(3)(b)" — grid `Name | Address | PAN | Aadhaar No.` (binds `substc[]`).
Card: "Details of relatives of Authors/ Founders/ Trustees/ Managers/ Substantial contributors mentioned above ^" — grid `Name | Address | PAN | Aadhaar No.` (binds `relatives[]`).
Notes (verbatim): "^ If HUF, its Family members and their relatives." · "^^ Required for Form 10B and 10BB only" · "Values in 'State' to 'Country' columns are required separately in Form 10B and 10BB only. If not applicable, full address can be entered in 'Address' column."
Feeds: nothing in JSON export (10B/10BB workpaper only). Status chip: "N person(s)".

### Particular: "Registrations / Approvals"   [click → opens: sf-reg]
#### Drill-in: Registrations / Approvals (source: itr7.html:10980)
Grid "Under Income Tax Act" — headers: `Section | Date of Registration | Registration/Approval No. | Approving Authority | Effective Date of Registration` (binds `regIT[]`). Section options REG_SECS: (blank), 11(1)(c), 12A/12AA/12AB, 10(23C)(iv), 10(23C)(v), 10(23C)(vi), 10(23C)(via), 10(21), 10(22B), 10(23A), 10(23B), 10(24), 10(46), 10(47), 13A, 13B, 35(1)(ii), 35(1)(iia), 35(1)(iii), 80G(5), Other. Add: `+ Add row`.
Grid "Under Other Acts" — headers: `Act | Date of Registration | Registration/Approval No. | Approving Authority | Registration effective — From | To` (binds `regOth[]`). Act options OTHER_ACTS (20 acts: Banking Regulation Act, 1949 … Union Territories GST Act, 2017, incl. 'Other:').
Validation: warning if no IT registration — "No registration / approval entered — a trust claiming exemption u/s 11 normally needs 12A/12AB or 10(23C) details." Feeds: not exported. Chip: "Entered".

### Particular: "Projects / Institutions"   [click → opens: sf-proj]
#### Drill-in: Projects / Institutions (source: itr7.html:10991)
Grid headers: `Name of the project / institutions run by trust, if any | Nature of activity` (binds `proj[]`, add `+ Add row`). Feeds: `PartA_GEN1.ProjectOrInstDtlsFlg` ('Y' if any name). Chip: "N project(s)".

### Particular: "Section 13(10) applicable?"   [click → opens: sf-s1310]
#### Drill-in: Section 13(10) applicable? (source: itr7.html:10997)

| Label | Type | Options | Default | Binds | Feeds |
|---|---|---|---|---|---|
| Violated conditions of Proviso to Section 2(15)? | select | Yes/No | '' | `s1310.viol` | — |
| Maintained books as per rule 17AA? | select | Yes/No | '' | `s1310.books` | — |
| Audit report filed within specified due date? | select | Yes/No | '' | `s1310.audit` | — |
| ITR filed within 31-Dec-2026? | read-only cell | — | 'Yes' | `s1310.itr` | — |
| Section 13(10) applicable? | read-only result | — | 'No' | `s1310.res` | — |

Note: "Values are auto-filled if necessary details are filled. Press F1 to know more." **Discrepancy note:** the "auto-filled" result cells are static state values — no code recomputes `s1310.itr`/`s1310.res` from the three answers.

### Particular: "Other Info."   [click → opens: sf-otherinfo]
#### Drill-in: Other Info. (source: itr7.html:11008)
Fields (all select Yes/No): "Whether purpose includes advancement of any other object of general public utility?" (`otherinfo.gpu`, default '') · "Any change in objects during the Year?" (`otherinfo.chg`, default 'No') · "Is this Assessee's First Return?" (`otherinfo.first`, default 'No'). Not exported.

### Particular: "Section under which return is filed ?"  (inline; `?` help tooltip verbatim: "139(4A) — trust / institution holding property for charitable or religious purposes / 139(4B) — political party / 139(4C) — specified institutions / 139(4D) — university / college / institution referred u/s 35")
Select: (blank), 139(4A), 139(4B), 139(4C), 139(4D) · Binds `S.sec` · Required · Feeds `ReturnFurnishedSec` via MAP_RETSEC ('139-4A' etc., default '139-4A') and comp `itr7.sec`.

### Particular: "Return Type"  (inline)
Select: (blank), Original, Revised, Modified · Binds `S.ret` · Required · Feeds `FilingStatus.ReturnFileSec.IncomeTaxSec` via MAP_RETTYPE (11/17/19).

### Particular: "Representative Assessee, if any"   [click → opens: sf-rep]
#### Drill-in: Representative Assessee, if any (source: itr7.html:11017)
Fields: Name (wide), e-Mail ID, Contact No., Country code (for Contact No.) — binds `rep.name/email/contact/cc` (cc default '91'). Feeds `FilingStatus.AsseseeRepFlg` ('Y' if name present; details themselves not exported).

### Particular: "Accumulation u/s 11(2)"  [stag: I, IA]   [click → opens: sf-accum]
#### Drill-in: Accumulation u/s 11(2) (source: itr7.html:11022)
Fixed-row grid, one row per Financial Year `2020-21, 2021-22, 2022-23, 2023-24, 2024-25, 2025-26` (FY6). Headers verbatim: `Financial Year | Amount accumulated in the year of accumulation | Purpose | Application for specified purpose in earlier years | Accumulated income taxed u/s 11(3) in earlier years^ | Amt applied CY — For specified purpose | For other than specified purpose | Credited to other regd. Trust / Institution | Balance | Amount Invested — As per Sec.11(5) | Other modes | Amount not utilised during accumulation period | Deemed Income u/s 11(3)`.
Row inputs: amt, purp(text), appspec, apspec, apoth, apcred, inv115, invoth, notutil (binds `accum[i].*`). ⚙ per-row: Balance = amt−appspec−apspec−apoth−apcred; Deemed Income u/s 11(3) = notutil. Last row (2025-26): "Amount accumulated" and "Application … earlier years" cells are blocked (na). "Accumulated income taxed u/s 11(3) in earlier years^" column is na in every row. Totals row `Total` ⚙ for every numeric column.
Checkbox below: "^Accumulated income taxed u/s 11(3) in earlier years" (`accum_taxflag`, default off). **Conditional:** reveals card "Accumulated income taxed u/s 11(3) in earlier years" — fixed grid rows `FY 2020-21 … FY 2024-25`, column headers: `FY of accumulation | Assessment year in which amount is taxed (AY 2021-22 | AY 2022-23 | AY 2023-24 | AY 2024-25 | AY 2025-26) | Total` (binds `accum_tax[i].a[0..4]`, ⚙ row & column totals + grand total).
Note: "^^Date of furnishing Form 10 of current FY is taken to ITR. Dates relating to other FYs are required only for Form 10B."
Feeds: total accumulated → `PartB_TI.TIDeductions.AmtAccumulatedForCharitable`; status chip shows the total. **Discrepancy note:** the taxed-in-earlier-years sub-table totals never flow back into the main grid's na column.

### Particular: "Deemed Application - clause (2) of Expln.1 to Sec.11(1)"  [stag: D, DA]   [click → opens: sf-deemed]
#### Drill-in: Deemed Application (source: itr7.html:11066)
Fixed-row grid, FY rows `Prior to 2020-21, 2020-21 … 2025-26` (FY_DEEM). Headers verbatim: `Financial Year | Amount deemed to be applied | Reason | Amount taxed u/s 11(1B) in earlier years | Amount remaining to be applied | Amount required to be applied in CY | Amount applied in CY | Deemed Income u/s 11(1B) | Amount to be applied in future years`. Inputs: amt, reason(text), taxed, reqcy, appcy (binds `deem[i].*`). ⚙: remaining = amt−taxed; Deemed Income 11(1B) = max(reqcy−appcy,0); future = max(remaining−appcy−DI,0). Totals row ⚙ all columns.
Checkbox: "Amount taxed u/s 11(1B) in earlier years" (`deem_taxflag`) → conditional card, fixed grid rows `Prior to FY 2020-21, FY 2020-21 … FY 2023-24` (FY_DTAX), headers: `FY in which amount deemed to be applied | Assessment year in which amount is Taxed (Upto AY 2021-22 | AY 2022-23 | AY 2023-24 | AY 2024-25 | AY 2025-26) | Total` (binds `deem_tax[i].a[]`, ⚙ totals).
Feeds: total deemed → `TIDeductions.AmtDeemedForCharitable`; chip shows total. (Row factory `nDeem` carries an unused `remain` key — display value is always recomputed.)

### Particular: "Pass Through Income u/s 115U/ 115UA/ 115UB"  [stag: PTI]   [click → opens: sf-pti]
#### Drill-in: Pass Through Income (source: itr7.html:11103)
Card title verbatim: "Pass Through Income from Venture Capital u/s 115U, Business Trust u/s 115UA and Investment Fund u/s 115UB". Grid headers: `Name of Trust / Fund | Income | TDS | PAN | Head of income | Investment Entity` (+ ✕, `+ Add row`; head options HEADS: (blank), House Property, Business or Profession, Capital Gains, Other Sources, Exempt Income). Binds `pti[]`.
Note: "Exempt incomes disclosed in this table will be auto-filled in 'Incomes fully exempt' table of Computation window."
Feeds: Σincome → `ScheduleAI.PassThroughIncome` (JSON only — the sheet's on-screen AI Total uses `othinc` fixed row instead). Chip "N fund(s)". **Discrepancy note:** the promised auto-fill into the Computation "Incomes fully exempt" table cannot happen at runtime (comp frame inert — see Computation screen).

### Particular: "Audits under Income tax and other Acts"   [click → opens: sf-audit]
#### Drill-in: Audits (source: itr7.html:11110)
Fixed-row grid "Audits under Income Tax Act" — one row per section `10(23C)(iv), 10(23C)(v), 10(23C)(vi), 10(23C)(via), 12A(1)(b), 92E, Other:` (IT_AUDIT_SECS). Headers verbatim: `Section | Auditor's name^ | Membership No. (not taken to return) | Firm Name | PAN of the firm /Proprietorship | Furnished date | Acknowledgement number | Whether audited?` (audited: Yes/No). Binds `auditIT[]`.
Grid "Audits under other Acts" — headers: `Act | Section | Date of furnishing Report` (Act = OTHER_ACTS select; binds `auditOth[]`, `+ Add row`).
Note: "^ Auditor's name is taken to ITR only if the 'Firm Name' is blank."
Feeds: any `audited==='Yes'` → `PartA_GEN2.LiableSec44ABflg='Y'`; any other-act row → `LiableAnyOthThnINTActflg='Y'`. Chip "Entered".

### Particular: "Nature of Business"  [stag: OA]   [click → opens: sf-nob]
#### Drill-in: Nature of Business (source: itr7.html:11126)
Grid headers: `Sector | Sub-sector | Code | Trade name | Particulars of change^` (+ ✕, `+ Add row`). Sector options SECTORS: (blank), AGRICULTURE, ANIMAL HUSBANDRY & FORESTRY, CONSTRUCTION, EDUCATION SERVICES, FINANCIAL INTERMEDIATION SERVICES, HEALTH CARE SERVICES, MANUFACTURING, REAL ESTATE & RENTING SERVICES, SOCIAL & COMMUNITY WORK, TRADE, TRANSPORT & COMMUNICATION SERVICES, OTHER SERVICES. Binds `nob[]`. Note: "^Required only for 3CD". Not exported. Chip "N business(es)".

### Particular: "Other details of business"  [stag: OA]   [click → opens: sf-odb]
#### Drill-in: Other details of business (source: itr7.html:11133)
Card "For Sch. OA of ITR": Number of branches (text, `odb.branches`) · Method of Accounting (select: blank/Mercantile/Cash; default 'Mercantile') · "Is there any change?" (checkbox `odb.mchg`) · Effect on Profit / Loss because of deviation u/s145 (₹, `odb.eff145`) · group "Method of valuation of closing stock": Raw materials / Finished goods (selects VAL_METHOD: blank, Cost or market rate, whichever is less, At cost, At market rate, Not Applicable) · "Is there any change?" (checkbox `odb.vchg`) · Effect on Profit / Loss because of deviation u/s145A (₹, `odb.eff145a`). Not exported.

### Particular: "Earning Business or Profession income for the First time?"  (inline)
Select Yes/No · binds `q.first` · not exported.

### Particular: "Corpus fund"  [stag: J(A1), R]   [click → opens: sf-corpus]
#### Drill-in: Corpus fund (source: itr7.html:11148)
Grid "Corpus fund - For J(A1) of ITR" — fixed rows per CORP_PURP: `(i) Renovation/ repair of places u/s 80G(2)(b) from 01.04.20` · `(ii) Other than (i) from 01.04.21` · `(iii) Other than (i) till 31.03.21`. Headers verbatim: `Purpose of Corpus Donation | Opening Balance | Received during the year | Applied during the year | Amount invested / deposited back — Earlier applied & not claimed | Others | Total | Closing balance | Amount taxed in earlier years^^ | Investment as on 31-03-2026 — As per Sec.11(5) | Other modes`. Inputs: ob, recd, applied, invoth ("Others"), i115, ioth (binds `corpus[i].*`). ⚙ per row: Total = invoth; Closing balance = ob+recd−applied+Total. "Amount invested/deposited back—Earlier…" and "Amount taxed in earlier years^^" cells are na. Totals row ⚙.
Checkbox: "^ Amount invested / deposited back - [Sec. 11(1) - Expln. 4(i) - proviso] (earlier applied & not claimed as application)" (`corp_invflag`) → conditional grid "Amount invested / deposited back": `Purpose of Corpus Donation (select CORP_PURP) | Amount invested / deposited back | FY in which applied` (binds `corp_inv[]`, `+ Add row`).
Checkbox: "^^ Amount taxed in earlier years" (`corp_taxflag`) → conditional grid "Amount taxed in earlier years": `Purpose of Corpus Donation | Amount taxed | AY in which taxed` (binds `corp_tax[]`).
Card "Reconciliation of Corpus fund - For Sch. R of ITR" — columns `(i) For Renovation/ repair of places u/s 80G(2)(b) - from 01.04.20 | (ii) Other than (i) from 01.04.21 | (iii) Other than (i) till 31.03.21`; rows: "Closing balance as per Sch. J(A1)" (⚙ from grid), 2× "Adjustments [For deletions enter minus(-)]:" input rows (binds `corp_rec[0/1].a[0..2]`), ⚙ "Balance as per ITR B/S ('Own Funds details' table)".
Feeds: `corpus[].invoth` sum → comp bridge `itr7.corpBack`; chip shows closing-balance total. **Discrepancy note:** the flag sub-tables (`corp_inv`/`corp_tax`) never feed the main grid's na columns or totals — grid "Total" is `invoth` alone; the reconciliation "Balance as per ITR B/S" is not cross-checked against `sf-ownf` values.

### Particular: "Loans and Borrowings"  [stag: J(A2)]   [click → opens: sf-lb]
#### Drill-in: Loans and Borrowings (source: itr7.html:11185)
Grid "Loans & Borrowings - For J(A2) of ITR" — headers verbatim: `Sl. No. | Particulars^ | Opening Balance | Loan borrowed during the year towards objectives | Applied during the year towards objectives | Amount Repaid in CY — Earlier applied & not claimed^^ | Others | Total | Closing balance` (+ ✕, `+ Add row`; empty state "No entries yet. Use + Add row."). Inputs: part(text), ob, borrow, applied, repoth (binds `loans[]`). ⚙: Total = repoth; Closing balance = ob+borrow−applied−Total. "Amount Repaid in CY — Earlier…" is na.
Checkbox: "^^ Loans repaid during the year (earlier applied & not claimed as application)" (`loan_repflag`) → conditional grid "Loans repaid during the year": `Sl. no. of Loan | Amount Repaid | FY in which applied` (binds `loan_rep[]`).
Note: "^ 'Particulars' is not taken to return." Not exported. Chip "N loan(s)". **Discrepancy note:** same na-column gap as Corpus.

### Particular: "Corpus fund Invested / Deposited u/s 11(5)"  [stag: J(B)]   [click → opens: sf-cinv]
#### Drill-in: (source: itr7.html:11206) Grid "Corpus fund Invested / Deposited u/s 11(5) as on 31st March": `Particulars | Amount | Mode of investment u/s 11(5) | Source of Investment (Corpus fund)` (mode options MODE115: (blank), Government Savings Bonds, Post Office Savings Bank, Scheduled Bank deposit, Co-operative Society / Bank deposit, UTI units, Central/State Government securities, Debentures - Government guaranteed, Public Sector Company investment, Immovable property, Mutual Fund u/s 10(23D), Other prescribed mode). Binds `cinv[]`. Not exported. Chip "N row(s)".

### Particular: "Investment in concern where person u/s 13(3) has substantial interest"  [stag: J(C)]   [click → opens: sf-subst]
#### Drill-in: (source: itr7.html:11212) Card "Investment at any time during PY, in a concern where person u/s 13(3) has substantial interest - For Sch. J(C) of ITR". Grid headers: `Name | Nominal value | Income | Nominal Value exceeds 5% of capital of concern? | Class of shares | No. of shares | Is a Company? | Address | State | PIN / ZIP code | Area / Locality | Post office | District` (Yes/No selects for the two questions). Binds `subst[]`. Not exported.

### Particular: "Any Other investments"  [stag: J(D)]   [click → opens: sf-othinv]
#### Drill-in: (source: itr7.html:11221) Card "For Sch. J(D) of ITR". Grid: `Name and address | Class of shares | Nominal value | No. of shares | Is a Company?`. Binds `othinv[]`. Not exported.

### Particular: "Voluntary contributions in kind, not invested as per section 11(5)"  [stag: J(E)]   [click → opens: sf-vckind]
#### Drill-in: (source: itr7.html:11227) Card "For Sch. J(E) of ITR". Grid: `Name and address of the donor | Amount of contribution | Amount applied towards objective | Amount invested in prescribed modes | Amount to be treated as income u/s 13(1)(d)`. Binds `vckind[]`. Feeds: Σ`treat` → comp bridge `itr7.corpNotInv` (sf-1113 addition "Corpus donations not invested in modes as per Sec.11(5)"). Chip "N donor(s)".

### Particular: "Partner in a Firm during the PY?"  (inline)
Select Yes/No · `q.partner` · Required · Feeds `FilingStatus.PartnerInFirmFlg`.

### Particular: "Held Unlisted Shares in the PY?"  (inline)
Select Yes/No · `q.unl` · Required · Feeds `FilingStatus.HeldUnlistedEqShrPrYrFlg`.

### Particular: "Legal Entity Identifier (LEI) details (if refund = > Rs. 50 Cr)"   [click → opens: sf-lei]
#### Drill-in: (source: itr7.html:11234) Fields: LEI Number (`lei.no`) · Valid up to date (`lei.valid`, DD/MM/YYYY placeholder). Not exported.

---

## Screen: Accreted income u/s 115TD (`sec-115td`, itr7.html:224-238)  [stag: 115TD]

### Particular: "Having accreted income u/s 115TD?"  — checkbox `td.on` (default checked). **Conditional:** unchecking hides all `.c-td` rows below (UI-walk verified).

| Label | Type | Default | Binds | Feeds |
|---|---|---|---|---|
| Aggregate Fair Market Value (FMV) of total assets | ₹ input | 0 | `td.fmv` | td_net ⚙ |
| Less: Total Liability | ₹ input | 0 | `td.liab` | td_net ⚙ |
| Net value of Assets | ⚙ `td_net` = fmv−liab | — | — | td_acc |
| Less: FMV of assets | drill → **sf-fmv** | — | — | td_acc |
| Accreted income as per sec. 115TD | ⚙ `td_acc` = td_net − fmv-popup total | — | — | — |
| Additional income-tax payable u/s 115TD at MMR | blocked (na cell) | — | — | — |
| Interest payable u/s 115TE | blocked (na cell) | — | — | — |
| Additional income-tax & interest payable (A) | blocked (na cell) | — | — | — |
| Tax & Interest paid (B) | drill → **sf-taxpaid** | — | — | — |
| Net payable/refundable (A - B) | ⚙ `td_netpay` | — | — | — |
| Date of conversion / merger / dissolution | date input (DD/MM/YYYY) | '' | `td.date` | — |

#### Drill-in: Less: FMV of assets (source: itr7.html:11238)
Fixed rows (labels verbatim): `- Directly acquired out of income referred to in Sec. 10(1)` · `- Acquired till date of registration/approval, if benefit u/s 11/12/10(23C)(iv) to (via) not claimed during that period` · `- Transferred in accordance with third proviso to Sec. 115TD(2)` · `Less: Liability in respect of above assets` — each ₹ (binds `fmv[i].amt`). ⚙ Total = row1+row2+row3−row4.

#### Drill-in: Tax & Interest paid (B) (source: itr7.html:11246)
Grid "Tax & Interest paid (B)": `Name of Bank & Branch | BSR Code | Date of deposit | Challan No. | Challan Amount` (+ ✕, `+ Add row`) binds `challan[]`; ⚙ Total row.
**Discrepancy note:** MMR tax, 115TE interest and "(A)" are never computed (na cells) and `td_netpay` is hardcoded `P('td_netpay',0)` — always 0 regardless of challans; nothing from this section is exported to JSON (only `PartB_TTI.Refund.NetTaxPyblOn115TDInc:0`).

---

## Screen: Foreign Assets & Incomes (`sec-fa`, itr7.html:242-256)  [stag: FA]

### Particular: "Having Foreign assets and Income or Signing authority in Foreign a/c?^" — checkbox `fa.on` (default checked); unchecking hides all `.c-fa` rows. Feeds `PartB_TTI.AssetOutsideIndiaFlg` ('YES'/'NO').
Notes (verbatim): "^Enter all items held (including any beneficial interest) at any time during the calendar year 2025." · "Note: If the ZIP code is not available, enter 'XXXXXX'."

All nine particulars are drill-in grids (add `+ Add row`, ✕ remove, empty state "No entries yet. Use + Add row."). None are exported to JSON (disclosure workpaper only). Ownership options OWNERSHIP: (blank), Direct, Beneficial owner, Beneficiary. "Schedule of ITR" options FA_SCHED: (blank), Sch. HP, Sch. BP, Sch. CG, Sch. OS, Sch. EI.

### Particular: "Foreign Depository / Custodial accounts"   [click → opens: sf-fa_dep]
#### Drill-in: (source: itr7.html:11255) Headers: `Country Name | Institution — Name | Address | Zip code | Account Type | Account Number | Ownership | A/c opening date | Peak Balance during the year (Rs.) | Closing balance (Rs.) | Gross Income received | Nature of Income`. Binds `fa_dep[]`. Chip "N a/c(s)".

### Particular: "Investments in Foreign Equity / Debts"   [click → opens: sf-fa_eq]
#### Drill-in: (source: itr7.html:11263) Headers: `Country Name | Entity — Name | Address | Zip code | Nature | Date of acquiring interest | Initial value | Peak value | Closing value | Gross Income received | Proceeds from Sale/Redemption`. Binds `fa_eq[]`.

### Particular: "Surrender value of Foreign Insurance / Annuity Contract"   [click → opens: sf-fa_ins]
#### Drill-in: (source: itr7.html:11270) Headers: `Country Name | Institution — Name | Address | Zip code | Date of contract | Surrender value of contract | Gross Income received`. Binds `fa_ins[]`.

### Particular: "Financial Interest in any Entity"   [click → opens: sf-fa_fin]
#### Drill-in: (source: itr7.html:11276) Headers: `Country Name | ZIP code | Nature of Entity | Name of the Entity | Address of the Entity | Ownership | Date since held | Total Investment (Rs.) | Income accrued | Nature of Income | Income offered — Taxable Income | Schedule of ITR | Item No. of sch.`. Binds `fa_fin[]`.

### Particular: "Immovable Property"   [click → opens: sf-fa_imm]
#### Drill-in: (source: itr7.html:11284) Headers: `Country Name | ZIP code | Property address | Ownership | Acquisition date | Total Investment (Rs.) | Income | Nature of Income | Income offered — Taxable Income | Schedule of ITR | Item No. of sch.`. Binds `fa_imm[]`.

### Particular: "Other Capital Assets"   [click → opens: sf-fa_cap]
#### Drill-in: (source: itr7.html:11291) Headers: as Immovable Property but `Nature of asset` instead of Property address. Binds `fa_cap[]`.

### Particular: "Account in which Assessee is signing authority (not included above)"   [click → opens: sf-fa_sign]
#### Drill-in: (source: itr7.html:11298) Headers: `Institution — Name | Address | Country Name | Zip code | Account holder name | Account Number | Peak Balance (Rs.) | Income accrued (if liable to tax) | Income offered — Taxable Income | Schedule of ITR | Item No. of sch.`. Binds `fa_sign[]`.

### Particular: "Trusts in which Assessee is a Trustee / Beneficiary / Settlor"   [click → opens: sf-fa_trust]
#### Drill-in: (source: itr7.html:11305) Headers: `Country Name | ZIP code | Trust — Name | Address | Trustees — Name | Address | Settlor — Name | Address | Beneficiaries — Name | Address | Position held since | Income derived (if liable to tax) | Income offered — Taxable Income | Schedule of ITR | Item No. of sch.`. Binds `fa_trust[]`.

### Particular: "Other income not included above or income in sch. BP of ITR"   [click → opens: sf-fa_oth]
#### Drill-in: (source: itr7.html:11315) Headers: `Country Name | ZIP code | Person from whom income is derived — Name | Address | Income derived | Nature of Income | Income offered — Taxable Income | Schedule of ITR | Item No. of sch.`. Binds `fa_oth[]`.

---

## Screen: Income details (`sec-inc`, itr7.html:260-298)

### Sub-block "Donations"  [stag: VC] → "Domestic Contribution"

| Label (verbatim) | Type | Default | Binds | Feeds (JSON ScheduleVC / comp) |
|---|---|---|---|---|
| Anonymous donations | ₹ | 0 | `vc.anon` | `AnonymousDonations115BBC` (part), PartB_TI additions `AnonymousDonationVC`, `DonationsUs115BBC` |
| Corpus donations — "- For renovation or repair of places notified u/s 80G(2)(b)" | ₹ | 0 | `vc.c80g` | `Local.CorpusFundDonationUS80G2b`, PartB_TI `CorpusDonationUS80G` |
| "- Other corpus donations" | ₹ | 0 | `vc.coth` | `Local.CorpusFundDonationOther80G2b`, `CorpusOtherThan80G` |
| Other than Corpus donations — "- Grants from Government" | ₹ | 0 | `vc.gov` | `GrantsReceivedFormGovt` |
| "- Grants from Companies under CSR" | ₹ | 0 | `vc.csr` | `GrantsReceivedFromCompanie` |
| "- Other specific grants" | ₹ | 0 | `vc.spec` | `OtherSpecificGrants` |
| "- Other donations" | ₹ | 0 | `vc.oth` | `OtherDonation` |
| Total | ⚙ `vd_total` = Σ all 7 | — | — | — |

### Particular: "Foreign Contribution" — checkbox `fc.on` (default checked); unchecking hides `.c-fc` rows and excludes foreign amounts from all totals (UI-walk verified).

| Label | Type | Default | Binds | Feeds |
|---|---|---|---|---|
| Purpose for which contribution received | drill → **sf-fcpurp** | — | `fc.purpose` | chip "Entered"; not exported |
| Anonymous donations | ₹ | 0 | `fc.anon` | anon aggregate |
| Corpus donations — "- For renovation or repair of places notified u/s 80G(2)(b)" | ₹ | 0 | `fc.c80g` | `Foreign.CorpusFundDonationUS80G2b` |
| "- Other corpus donations" | ₹ | 0 | `fc.coth` | `Foreign.CorpusFundDonationOther80G2b` |
| Other than corpus donations | ₹ | 0 | `fc.other` | `Foreign.OtherThanCorpusFund` |
| Total | ⚙ `fc_total` | — | — | — |

#### Drill-in: Purpose for which contribution received (source: itr7.html:11323) — single field "Purpose" (text, binds `fc.purpose`).

### Particular: "Grand Total" — ⚙ `vc_grand` = domestic + (foreign if fc.on). Feeds `ScheduleVC.AnonymousDonations.TotalDonationsReceived`, comp `itr7.agg` component. (UI-walk: ₹10,00,000 in `vc.oth` → vd_total/agg/rail update live.)

### Sub-block "Income other than Donation referred in Sec. 10, 11 & 12"  [stag: AI]

| Label | Type | Default | Binds | Feeds (ScheduleAI) |
|---|---|---|---|---|
| Receipts from main objects | ₹ | 0 | `ai.main` | `RecptMainObj` |
| Receipts from incidental objects | ₹ | 0 | `ai.inc` | `RecptsIncidentalObj` |
| Rent | ₹ | 0 | `ai.rent` | `Rent` |
| Commission | ₹ | 0 | `ai.comm` | `Commission` |
| Dividend | ₹ | 0 | `ai.div` | `DividendIncome` |
| Interest | ₹ | 0 | `ai.int` | `InterestIncome` |
| Net consideration on transfer of Capital asset | ₹ | 0 | `ai.cons` | `NetConsdrnTrnsfrCapAsst` |
| Other income | drill → **sf-othinc** | — | `othinc[]` | `TotalofOtherIncomes` |
| Total | ⚙ `ai_total` | — | — | `TotalofAggregateIncomes` |
| Agriculture income (exempt) | ₹ | 0 | `ai.agri` | `AgricultureIncome` (excluded from Total) |
| **Aggregate income referred to in sections 10, 11 & 12** (bold) | ⚙ `agg` = Grand Total + AI Total | — | — | `PartB_TI.AggregateIncomeUs1112`, rail `r_agg`, comp `itr7.agg` |

#### Drill-in: Other income (source: itr7.html:11329)
Table `Description | Amount` (+ ✕ on non-fixed rows). Row 1 fixed label: "Pass through income u/s 115U / 115UA/ 115UB:" (amount only); further rows free text + amount (`othinc[]`, add via `+ Add row` — sect has no add base here so rows added by default factory only from initial state). ⚙ Total `oi_tot`. **Discrepancy note:** sheet AI Total uses `othinc` Σ, but `buildITR7Json` computes `TotalofOtherIncomes` from `othinc` AND adds `PassThroughIncome` from the separate `pti[]` grid — entering PTI in both places double-counts in the JSON `TotalofAggregateIncomes`.

---

## Screen: Application of income (`sec-app`, itr7.html:302-341)  [stag: A]

Two value columns headed `Revenue | Capital` (each labeled row binds `ap.{key}.0` / `ap.{key}.1`).

### Sub-block "A. Expenditure of the trust/institution:"
| Label (verbatim) | Type | Binds |
|---|---|---|
| - Non-corpus Donations to trust/institution regd. u/s 12AB/ 10(23C)(iv) to (via) | drill → **sf-noncorp** (shows 85% values in both columns) | `noncorp.a[0/1]` |
| - Religious | ₹×2 | `ap.rel` |
| - Relief of poor | ₹×2 | `ap.poor` |
| - Educational | ₹×2 | `ap.edu` |
| - Yoga | ₹×2 | `ap.yoga` |
| - Medical relief | ₹×2 | `ap.med` |
| - Preservation of Environment | ₹×2 | `ap.env` |
| - Preservation of Monuments, etc. | ₹×2 | `ap.mon` |
| - General public utility | ₹×2 | `ap.gpu` |
| - Cost of new asset [to claim Exemption u/s 11(1A)] | ₹ (Capital column only) | `ap.asset` |
| - Other expenses | drill → **sf-othexp** | `othexp_r[]`/`othexp_c[]` |
| Total expenditure | ⚙ `tot_a_r`/`tot_a_c` = Σ above (85% of noncorp) | — |

#### Drill-in: - Non-corpus Donations to trust/institution regd. u/s 12AB/ 10(23C)(iv) to (via) (source: itr7.html:11342)
Table columns `Revenue | Capital`; rows: input "Non-corpus Donations to trust/institution regd. u/s 12AB/ 10(23C)(iv) to (via)" (`noncorp.a.0/.1`) · ⚙ "15% of above not considered as application for charitable or religious purposes" (`nc_15_*` = round(15%)) · ⚙ total "Balance 85% amount to be treated as application" (`nc_85_*`). Feeds comp `itr7.nc15`.

#### Drill-in: - Other expenses (source: itr7.html:11375, factory `twoListPopup` at 11355)
Two cards: "Revenue Expenses" and "Capital Expenses" — each a `Description|Amount` list (`+ Add row`, ✕, ⚙ Total `oe_tr`/`oe_tc`).

### Sub-block "B. Expenditure included in 'A' above not allowed as application:"  (note line: "(out of sources of fund in 'Ci' below)")
| Label | Type | Binds |
|---|---|---|
| - Donations to Trust/Institution registered u/s 12AB / 10(23C)(iv) to (via) | drill → **sf-bdon** | `bdon.*` |
| - Donations other than the above | ₹×2 | `ap.doth` |
| - Applied outside India - approved u/s 11(1)(c) proviso | ₹×2 | `ap.appr` |
| - not approved u/s 11(1)(c) proviso | ₹×2 | `ap.nappr` |
| - Applied for other than objects | ₹×2 | `ap.obj` |
| - Others | drill → **sf-bothers** (twoListPopup 'Revenue Expenses'/'Capital Expenses', totals `bo_tr`/`bo_tc`) | `bothers_r/c[]` |
| Total expenditure not allowed as application | ⚙ `tot_b_r`/`tot_b_c` | — |

#### Drill-in: - Donations to Trust/Institution registered u/s 12AB / 10(23C)(iv) to (via) (source: itr7.html:11379)
Table `Donations to Trust/Institution registered u/s 12AB or 10(23C)(iv) to (via) | Revenue | Capital`; rows: `- Towards Corpus` (`bdon.corpus`) · `- Other than towards Corpus - out of accumulated income` (`bdon.accum`) · `- Not having same objects` (`bdon.notsame`) · ⚙ Total (`bd_t0/bd_t1`).

### Sub-block "C. Sources of Fund for expenses in 'A' above"
| Label | Type | Binds |
|---|---|---|
| i) Income derived from the property / earned during the PY (excluding Corpus donation) | ₹×2 | `ap.ci` |
| ii) Sources not allowed for application: — "- Income accumulated in earlier years u/s 11(2)" | ₹×2 | `ap.acc` |
| - 11(1) Expln: Deemed application of earlier years | ₹×2 | `ap.deem` |
| - Earlier years' income up to 15% accumulated | ₹×2 | `ap.p15` |
| - Corpus Fund | ₹×2 | `ap.corp` |
| - Borrowed Fund | ₹×2 | `ap.bor` |
| - Other sources | drill → **sf-othsrc** (twoListPopup 'Towards Revenue Expenses'/'Towards Capital Expenses', totals `os_tr`/`os_tc`) | `othsrc_r/c[]` |
| Total Sources not allowed for application (Cii) | ⚙ `tot_cii_r/c` | — |
| Total Sources of Fund (Ci + Cii) | ⚙ `tot_cf_r/c` | — |

### Closing rows
| Label | Type | Binds / ⚙ |
|---|---|---|
| D. Net  (A - B - Cii) | ⚙ `d_r`/`d_c` | — |
| Less: Amount actually not paid out of 'D' above | ₹×2 | `ap.np` |
| Add: Expenses accrued in earlier years but not claimed as application, paid in CY | ₹×2 | `ap.addacc` |
| **Amount allowed as application** (bold) | ⚙ `alw_r`/`alw_c` = D − np + addacc | rail `r_app` |

Feeds: Revenue+Capital of "A" (`ar`,`ac`) → JSON `PartB_TI.AmtForCharitableUs111` / `TIDeductions.AmtAppliedtForCharitablePurpose` and comp `itr7.appRev/appCap`. **Discrepancy note:** the JSON "applied" figure uses gross A-block totals (`ar+ac`), NOT the sheet's "Amount allowed as application" after B/Cii/np/addacc adjustments — B and C blocks affect only the on-screen D and rail, never the export. (UI-walk: edu Revenue 7,00,000 → tot_a_r=alw_r=7,00,000, JSON applied=700000, TotalTI = 12,00,000−7,00,000 = 5,00,000.)

---

## Screen: ITR B/S (`sec-bs`, itr7.html:345-379)

Header row checkbox `bs.on` (default checked) — unchecking hides all `.c-bs` rows and rail shows `B/S —`. Collapsible (`bd-bs`). Two staggered amount columns (inner = detail, outer = group amount).

**Liabilities:** Own Funds^ (₹, `bs.own`) · Loan and Borrowings: Secured loans (`bs.sec`), Unsecured loans (including deposits) (`bs.unsec`) · Advances (`bs.adv`) · Current liabilities: Sundry Creditors (`bs.sc`), Other payables (`bs.op`) · Provisions (`bs.prov`) · Total Liabilities ⚙ `bs_tl`.
**Assets:** Fixed assets: Gross block (`bs.gross`), Less: Depreciation (`bs.dep`) · Investments (`bs.inv`) · Current assets: Inventories (`bs.invty`), Sundry debtors (`bs.debt`), Cash / Cash equivalents: Balances with Banks (`bs.bank`), Cash in hand (`bs.cash`), Others (`bs.coth`) · Other Current Assets (drill → **sf-oca**) · Loans and advances (`bs.la`) · Accumulated balance / Reserves (deficit) (`bs.res`) · Total Assets^ ⚙ `bs_ta`.
Red note: "^Additional Data" → drills: "Own Funds details" (**sf-ownf**) · "Breakup of Investments u/s 11(5) or otherwise" (**sf-binv**).
Validation: warning (not error) when TL≠TA: "Balance sheet does not tally — Total Liabilities {tl} vs Total Assets {ta} (difference {d})."

#### Drill-in: Other Current Assets (source: itr7.html:11390)
List `Particulars | Amount` (+ Add row, ✕, ⚙ Total `oca_tot`). Binds `oca[]`. Feeds `OtherCurrAssets` in PARTA_BS and asset totals.

#### Drill-in: Own Funds details (source: itr7.html:11401)
Fixed rows (labels verbatim): `Corpus Fund - (i) Renovation/ repair of places u/s 80G(2)(b) from 01.04.20` · `- (ii) Other than (i) from 01.04.21` · `- (iii) Other than (i) till 31.03.21` · `Accumulated income u/s 11(2) or 10(23C) third proviso` · `Amount to be applied in future years - clause (2) of Expln.1 to Sec.11(1)^` (blocked/na) · `Other Reserves` — ₹ each (binds `ownf[i].amt`); ⚙ `Total Funds` (`ownf_tot`). Note: "^Auto-filled from 'Deemed Application-clause (2) of Expln.1 to Sec.11(1)' table."
Feeds JSON `PARTA_BS.SourcesOfFund.OwnFund`: `Corpus80G`=ownf[0], `OtherCorpus`=ownf[1]+ownf[2], `AccumulatedInc`=ownf[3], `TotalOtherReserve`=ownf[5]; but `TotalFund` = sheet `bs.own`. **Discrepancy note:** (a) the "^Auto-filled" row is na and NO code ever auto-fills it (`AccumulatedIncUS10_11:0, BalDeemedInc:0` hardcoded); (b) `ownf_tot` vs `bs.own` are never reconciled — JSON OwnFund components can disagree with its own TotalFund.

#### Drill-in: Breakup of Investments u/s 11(5) or otherwise (source: itr7.html:11413)
Rows: ⚙ "Total Assets as reduced by 'Current liabilities and Provisions'" (`bi_ta` = TA−(sc+op+prov)) · "Out of above:" · `- Investments as per Section 11(5)` (₹, `binv.s115`) · `- Investments in other modes` (₹, `binv.soth`). Feeds `OutOf5InvModesUS11_5` / `OutOf5InvModesOthUS11_5`.

---

## Screen: Form 10B data entry (`sec-10b`, itr7.html:383-397)

Header checkbox `f10b.on` (default checked; hides `.c-b10` rows when off). Note: "To generate e-return, go to 'Forms' menu -> 10B". Right chip header: "Sl. no. / Sch. (as per Form)". Closing note: "Note: For trust approved u/s 10(23C), reference to sec. 11 & 13 to be read as reference to similar provisions of 10(23C)."

### Particular: "10B Basic Information"   [click → opens: sf-b10basic]
#### Drill-in: 10B Basic Information (source: itr7.html:11423/11433, factory `basicForm`)
Card "Trust / Institution": Name of the Trust / Institution (wide) · PAN · Assessment Year (default '2026-27') · Registration / Approval No. Card "Auditor": Auditor's name · Membership No. · Name of the Firm · PAN of the Firm · Firm Registration No. (FRN) · Place of signing · Date of signing (DD/MM/YYYY). Binds `b10basic.*`. Not exported.

### Particular: "Observations / Qualifications"   [click → opens: sf-b10obs]
#### Drill-in: (source: itr7.html:11436/11448, factory `listPopup`) — single-column list "Observation / Qualification" (+ Add row, ✕). Binds `b10obs[]`.

### Particular: "Footnotes / Pending issues"   [click → opens: sf-b10foot]
#### Drill-in: (source: itr7.html:11449) — list "Footnote / Pending issue". Binds `b10foot[]`.

### Annexure rows (catalog `B10A`, itr7.html:11497-11511; rendered by `buildRows` into `#b10ax`)
Each row: label · drill (`⋯`) or ⚙/input · stag = Form 10B Sl. no. All drill rows open **generic GEN popups** — a `Particulars | Amount` list grid (+ Add row, ✕; source itr7.html:11482-11494; binds `S['sf-g-…'][]`; chips "N row(s)"; none exported):

| Label (verbatim) | Sl. no. | Type / opens |
|---|---|---|
| Registrations / Approvals | 9 | drill → sf-g-reg |
| Authors, Founders, Trustees, etc. | 10 | drill → sf-g-authors |
| Objects and Provisional Registration / Approval of Trust | 11-13 | drill → sf-g-objects |
| Books maintained | 14 | drill → sf-g-books |
| Advancement of General Public Utility | 15-16 | drill → sf-g-gpu |
| Business related info. | 17-18 | drill → sf-g-bri |
| Receipts on which TDS is charged u/s 194C, 194J, 194H, 194Q | 19 | drill → sf-g-tds194 |
| Section 13(10) applicable? | 20, 39(i), (ii) | drill → sf-g-s1310b |
| Income details | 21-30, 34 | drill → sf-g-incdet |
| Application of Income | 31 | drill → sf-g-appinc |
| Taxable income (net of above) | 32 | ⚙ `b10_tax` = agg − (alw_r+alw_c) |
| Income taxable u/s 115BBI | 33 | drill → sf-g-115bbi |
| Other Income | 35 | drill → sf-g-othincb |
| Capital asset transferred u/s 11(1A) | 36 | drill → sf-g-capasset |
| Application out of Sources not allowed for application | 37-38 | drill → sf-g-appsrc |
| Expenditure for Religious Purposes by trust approved u/s 80G(5) - second proviso | 40 | drill → sf-g-relig80g |
| Specified persons referred u/s 13(3) | 41 | drill → sf-g-sp133 |
| Specified Violation - Expln. to Sec.12AB(4) | 43 | drill → sf-g-viol |
| Depreciation or other allowance in respect of an asset which has been claimed as application - Sec.11(6) | 44 | ₹ input `f10b.dep` |
| Deduction claimed u/s 10 [other than clause (1), (23C) & (46) thereof] | 45 | ₹ input `f10b.ded` |

### Schedule rows (catalog `B10S`, itr7.html:11512-11530; into `#b10sx`) — all drill → GEN popups

| Label (verbatim) | Sch. | opens |
|---|---|---|
| Corpus fund | Corpus | sf-g-corpsch |
| Foreign contribution | FC | sf-g-fcsch |
| Loans and Borrowings | LB | sf-g-lbsch |
| Income applied outside India | Int App | sf-g-intapp |
| Deemed Application - clause (2) of Expln. 1 to Sec.11(1) | DI / DA | sf-g-disch |
| Accumulation u/s 11(2) | AC / ACA | sf-g-acsch |
| Income or property lent to specified person, without adequate security / interest | SP-a | sf-g-spa |
| Properties provided for use of specified person, without adequate compensation | SP-b | sf-g-spb |
| Salary, allowance, etc., paid to specified person in excess of reasonable pay for such services | SP-c | sf-g-spc |
| Services made available to the specified person, without adequate remuneration / compensation | SP-d | sf-g-spd |
| Properties purchased from specified person for consideration, more than adequate | SP-e1 / e2 | sf-g-spe |
| Properties sold to specified person for consideration, less than adequate | SP-f1 / f2 | sf-g-spf |
| Income or property diverted in favour of specified person | SP-g | sf-g-spg |
| Funds invested during FY in any concern, in which specified person has a substantial interest | SP-h | sf-g-sph |
| Disallowance u/s 11(1) r/w section 40(a)(ia) - for TDS defaults | TDS disallowable | sf-g-tdsdis |
| Disallowance u/s 11(1) r/w section 40A(3)/(3A) - for Cash payments | 40A(3) / (3A) | sf-g-40a3 |
| Loans / deposits / specified sums accepted u/s 269SS | 269SS | sf-g-269ss |
| Receipts of Rs.2 lakh or more u/s 269ST | 269ST | sf-g-269st |
| Loans / deposits / sums repaid u/s 269T | 269T | sf-g-269t |
| TDS / TCS summary, delay in filing returns, interest liability | TDS / TCS | sf-g-tdstcs |

**Discrepancy note:** the note says "To generate e-return, go to 'Forms' menu -> 10B" but no Forms menu exists in this tool; 10B data is never validated nor exported. GEN popups are shared objects — the same `sf-g-…` list opened from Form 10B and Form 10BB rows edits the same data.

---

## Screen: Form 10BB data entry (`sec-10bb`, itr7.html:401-415)

Header checkbox `f10bb.on` (default checked; hides `.c-bb`). Note: "To generate e-return, go to 'Forms' menu -> '10BB'". Same closing 10(23C) note as 10B.

### Particular: "10BB Basic Information"   [click → opens: sf-bbbasic] — same `basicForm` fields as 10B (binds `bbbasic.*`).
### Particular: "Observations / Qualifications"   [click → opens: sf-bbobs] — listPopup (binds `bbobs[]`).
### Particular: "Footnotes / Pending issues"   [click → opens: sf-bbfoot] — listPopup (binds `bbfoot[]`).

### Annexure rows (catalog `BBA`, itr7.html:11531-11538)

| Label (verbatim) | Sl. no. | Type / opens |
|---|---|---|
| Authors, Founders, Trustees, etc. | 9 | drill → sf-g-authors (shared with 10B) |
| Provisional Registration / Approval | 10 | drill → sf-g-prov |
| Books maintained | 6, 11 | drill → sf-g-books (shared) |
| Voluntary contributions | 13-20, 26 | drill → sf-g-vcsch |
| Income other than Donation referred in Sec. 10, 11 & 12 | 21 | blocked (na cell) |
| Application of income | 23 | drill → sf-g-appinc23 |
| Income taxable u/s 115BBI | 25 | blocked (na cell) |
| Application out of Sources not allowed for application | 27 | drill → sf-g-appsrc (shared) |
| Specified persons referred u/s 13(3) | 28 | drill → sf-g-sp133 (shared) |
| Income or property referred u/s 13(2) | 29 | drill → sf-g-ip132 |
| Specified Violation - Expln. to Sec.12AB(4) | 30 | drill → sf-g-viol (shared) |
| Depreciation or other allowance in respect of an asset which has been claimed as application -Sec.11(6) | 31 | ₹ input `f10bb.dep` |

### Schedule rows (catalog `BBS`, itr7.html:11539-11542): `Disallowance u/s 11(1) r/w section 40(a)(ia) - for TDS defaults` (TDS disallowable → sf-g-tdsdis) · `Disallowance u/s 11(1) r/w section 40A(3)/(3A) - for Cash payments` (40A(3) / (3A) → sf-g-40a3) · `TDS / TCS summary, delay in filing returns, interest liability` (TDS / TCS → sf-g-tdstcs) — all shared GEN popups.

---

## Screen: Computation (tab `Computation`, iframe `compFrame`; template `<script type="text/html" id="calcdoc">` itr7.html:441-10623; loader itr7.html:10625-10691)

The shared Computation Sheet (HP / BP incl. 44AD-44AE & Business-1/Profession-1 adjustment ladders / CG incl. 112A & auto-classification / OS family / Chapter VI-A / AMT 115JC / 234A-C+234F / TDS-TCS / Advance & SAT / Schedule EI / Schedule CFL / Relief 90-91) is **not extracted here** (separate agent). Banner: "Tax Computation · Statement of Total Income" / "Trust (ITR 7)" / "A.Y. 2026-27"; client bar Status is locked to `Trust (ITR 7)`; regime selector hidden and locked to `Old regime` (itr7.html:723); "ITR-7: no Salaries head" (itr7.html:10464).

### ITR-7-SPECIFIC COMPUTATION ADDITIONS

### Particular: "Taxable Income u/s 11 to 13"  (Other-Sources group row, itr7.html:705, ⚙ `it_1113`)   [click → opens: sf-1113]
#### Drill-in: Taxable Income u/s 11 to 13 (source: itr7.html:3484-3528; logic `compute1113()` itr7.html:3558)
Pink (auto-fed via parent bridge `window.__bridge` itr7.html:10629-10665) vs manual inputs:

| Label (verbatim) | Type | Fed by |
|---|---|---|
| Return to be furnished u/s | ⚙ text | `itr7.sec` (sheet `S.sec`) |
| Whether registered u/s 12A/ 12AB? | select Yes/No (default Yes) | manual |
| Whether approved u/s 10(23C) (iv) to (via)? | select No/Yes (default No) | manual |
| Aggregate income referred to in sections 10, 11 & 12 | ⚙ | `itr7.agg` |
| - 11(1): Applied in India during the PY — - Revenue expenses | ⚙ | `itr7.appRev` (A-block revenue total) |
| - Capital expenses | ⚙ | `itr7.appCap` |
| - Loan repayment | ⚙ | `itr7.appLoan` (always 0 — see discrepancy) |
| - 11(1) - Clause 2 to Expln. 1: Deemed Application | input | manual |
| - 11(1)(c): Applied outside India | input | manual |
| - 11(1)(d): Corpus Donations received | ⚙ | `itr7.corpDon` (vc+fc corpus) |
| - Amount deposited back into Corpus (not claimed as application earlier) | ⚙ | `itr7.corpBack` (Σ corpus[].invoth) |
| - 11(2): Amount accumulated for specified purpose | input | manual |
| - 11(1): Accumulation to the extent of 15% | ⚙ | `itr7.acc15` = round(max(0, agg−corpDon)×15%) |
| - 15% of Non-corpus Donations paid to trust/institution regd. u/s 12AB/ 10(23C)(iv) to (via) | ⚙ | `itr7.nc15` |
| Income after application | ⚙ subtotal | agg − Σ deductions |
| Additions: - 11(1)(d): Corpus donations not invested in modes as per Sec.11(5) | ⚙ + manual override input | `itr7.corpNotInv` (Σ vckind[].treat) + `x1113_corpnotinv_o` |
| - Disallowance u/s 11(1) r/w section 40(a)(ia) - for TDS defaults | input | manual |
| - Disallowance u/s 11(1) r/w section 40A(3)/(3A) - for Cash payments | input | manual |
| - Income chargeable u/s 11(1B) | input | manual |
| - Income chargeable u/s 11(3) | input | manual |
| - Income chargeable under Expln. 3B to section 11(1) | input | manual |
| - Income chargeable u/s 12(2) | input | manual |
| - Disallowance u/s 13(1)(c) | input | manual |
| - Disallowance u/s 13(1)(d) | input | manual |
| - Income taxable u/s 115BBI | input | manual → 30% flat in tax split |
| - Anonymous donations taxable u/s 115BBC | input | manual → 30% flat |
| Taxable Income u/s 11 to 13 | ⚙ total | → statement row `it_1113`, added into GTI (itr7.html:10517-10518) |

Footnote (verbatim): "Pink cells are auto-filled from the ITR data-entry sheet — Aggregate income, Revenue / Capital application, Corpus donations and the 15% accumulation flow in from Sch. A, Sch. J and the Donations tables. Amounts taxable u/s 115BBI and 115BBC are charged at 30% in the 'Tax on total income' window."

### Particular: "Tax on total income"  (statement row itr7.html:724, ⚙ `it_taxOnTI`)   [click → opens: sf-taxti]
#### Drill-in: Tax on total income (source: itr7.html:3531-3547; logic `computeTaxTI()` itr7.html:3582)
Read-only table `(blank) | Income | Tax`: `Income taxable at normal rates` (AOP-slab tax on TI minus special) · `Income taxable u/s 115BBI @30%` · `Anonymous donations u/s 115BBC @30%` · `Total`. Footnote (verbatim): "A trust is charged at the rates applicable to an AOP. Income specified u/s 115BBI (accumulation violations, corpus not invested, 13(1)(c)/(d) disallowances) and anonymous donations u/s 115BBC are taxed at 30% with no deduction allowed against them."

**ITR-7 computation flow** (itr7.html:10460-10603): GTI = HP + BP + CG + OS + `r1113.total`; trustSpecial = 115BBI+115BBC taxed at flat 30% outside the slab (itr7.html:10544-10545); slab tax on the remainder via `baseTaxOnly` (individual old/new slabs, itr7.html:3602-3603); **87A rebate applied** to slab tax (itr7.html:10553-10554); surcharge + 4% cess; AMT comparison; 234A/B/C/F.

**Discrepancy notes (Computation):**
1. **Computation view is inert at runtime (verified by UI-walk, 3 probe runs).** The calcdoc template's single inner `<script>` (opens itr7.html:3550) is "closed" with the escaped literal `<\/script>` at itr7.html:10619 — when the loader `doc.write`s the template (itr7.html:10675), that never terminates the script element, so the script's body swallows the trailing `</body></html>` text and dies with `SyntaxError: Unexpected token '<'` (confirmed: frame has 1 script, `typeof computeAll === 'undefined'`, `window.itr7` undefined). Consequences: the parent bridge no-ops (guard `!w.itr7||!w.computeAll`), sf-1113 / sf-taxti (and every comp drill-in) cannot open, identity/name never syncs, every ⚙ value stays 0, rail shows ₹0 regardless of sheet data. The entire computation engine exists only as dead code.
2. **87A anomaly (in the dead code path):** `rebate87A` (₹60,000 new-regime / ₹12,500 old-regime individual rebate) and individual slabs (`slabNew` ₹4L basic exemption / `slabOld` age-based) are applied to a trust assessed at AOP rates via MMR rules — a trust filing ITR-7 is generally not eligible for 87A, and AOP slabs/MMR handling differ.
3. `itr7.appLoan` is hardcoded 0 by the bridge — "Loan repayment" application can never be fed.
4. `acc15` is computed as flat 15% of (agg − corpus donations) with no 13(10)/2(15)-violation gating.
5. No 115BBC exemption floor: the higher-of-(5% of total donations, ₹1,00,000) carve-out is not computed anywhere — full anonymous-donation amounts are treated as taxable both here and in the JSON.

---

## Validation & Export

### Particular: "Validate" (rail button) → opens panel `sf-validate` (itr7.html:432-436)
Title: "Validation — before uploading to the e-filing portal". Live-refreshed on every recompute (`runValidate(false)` inside `computeAll`, itr7.html:11859). Error rows are clickable ("open →") and jump to the offending drill-in (verified). Empty-sheet UI-walk: 21 errors, header "21 errors — the portal will reject the JSON until these are fixed"; success text: "✓ No problems found. Every field the portal marks mandatory is present and correctly formatted. Use Export JSON and upload the file to the e-filing portal."
Checks (validateITR7, itr7.html:11941): name/PAN/DOF/section/return-type/residential status; full address + mobile + email; verifier block (individual PAN); ≥1 complete bank account + refund tick; `q.partner` & `q.unl` answered; warnings: B/S tally, missing 12A/12AB/10(23C) registration.

### Particular: "Export JSON" (rail button) → `exportJson()` (itr7.html:12327)
Blocks on errors (opens panel); else downloads `{PAN}_ITR7_AY2026-27.json` built by `buildITR7Json()` (itr7.html:12027) to schema "ITR-7 AY 2026-27 (SchemaVer Ver1.0 / FormVer Ver1.0)". JSON tree keys (runtime-verified): `CreationInfo, Form_ITR7, PartA_GEN1, PartA_GEN2, PARTA_BS, ScheduleVC, ScheduleAI, PartB_TI, PartB_TTI, Verification`.

**Discrepancy notes (Export — the known zero-tax-liability gap, runtime-verified):**
1. **`PartB_TTI` is entirely hardcoded to 0** (itr7.html:12245-12260): every tax figure — TaxAtNormalRates, TaxAtSpecialRates, DonationUs115BC, TaxIncChargUs115BBI, surcharge, cess, GrossTaxLiability, NetTaxLiability, 234A/B/C/F, AggregateTaxInterestLiability, AdvanceTax/TDS/TCS/SelfAssessmentTax, BalTaxPayable, RefundDue — exports as 0 even when TotalTI is positive (verified: TotalTI 5,00,000 → TaxPayableOnTotInc 0, GrossTaxLiability 0).
2. `PartB_TI` head-wise blocks (IncomeFromHP, CapGain.*, ProfBusGain, IncFromOS, IncChargeableUs115BBI, IncChargeableUs11_4, IncChargUs115BBIIncld13, CurrentYearLoss, IncChargeableTaxSplRates, AmtDsllwbl…, IncExp3B/1BUS80G) are all constant 0 — the computation sheet's heads never reach the JSON.
3. `TotalTI = max(0, agg − (applied+deemed+accum) + anon)` — uses gross A-block application (see Application screen note) and adds the FULL anonymous-donation amount (`AnonymousDonations115BBC:I(anon)`, `AnonymousDonationsOthr115BBC:0` — no 115BBC floor).
4. Entered but never exported: 115TD section, Foreign Assets grids (only the Y/N flag goes out), Trustees, Registrations, Projects details, Audits detail rows, Nature/Other details of business, Schedule J grids (corpus/loans/11(5)/substantial-interest/other-investments/in-kind), LEI, Representative details, accumulation/deemed FY-wise grids (only their grand totals), Form 10B/10BB data.
5. `CreationInfo` uses placeholder `SWCreatedBy/JSONCreatedBy:'SW10000000'`, `Digest:'-'`; `StatusOrCompanyType:'5'` and `SecExemptionClaimed:'11'` are hardcoded regardless of the filing section chosen.

---

## PROOF — re-walk coverage
Every particular above was re-checked against source line ranges: sec-itrinfo rows 175-217 (28 particulars, 19 drills — all 19 SF bodies documented), sec-115td rows 226-237 (12), sec-fa rows 244-253 (10 + 2 notes), sec-inc rows 262-297 (27), sec-app rows 304-340 (32), sec-bs rows 346-377 (22), sec-10b (4 + 20 annexure + 20 schedule rows; all catalog entries listed), sec-10bb (4 + 12 + 3), computation additions (2 particulars, 2 drill-ins), validation/export (2). All 90 sheet popups (49 named SF + 41 GEN) plus sf-validate, sf-1113, sf-taxti accounted for. UI-walk verified: section order, drill open/close (sf-assessee, sf-trustees incl. tr_other conditional), td.on/fc.on conditional hiding, live totals (vd_total/ai_total/agg/tot_a_r/alw_r/rail), validation panel (21 empty-sheet errors), JSON build values, and the computation-iframe script failure.
