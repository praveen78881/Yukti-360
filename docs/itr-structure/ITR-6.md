# ITR-6 — COMPLETE STRUCTURE MAP

Route(s): `/company/[id]/income-tax` (companies) · iframe → `/tax-utilities/itr6.html` · Entry component: `src/app/company/[id]/income-tax/page.tsx:693` (`StatutoryItrView`) → `ItrYearForms` (same file, line 257), form key resolved by `STATUTORY_ITR` at `page.tsx:74-85` (`pvt_ltd`/`opc`/`public_ltd` → `itr6`), routed at `page.tsx:740-742`; iframe src mapping at `page.tsx:47` (`/tax-utilities/itr6.html`) · AYs covered: **2026-27** (`public/tax-utilities/itr6.html`, 2,856 lines) and **2025-26** (`public/tax-utilities/itr6-ay2526-backup.html`, 13,645 lines — the pre-port backup; a *different generation* of the tool, see §AY-DIFF).

Legacy path (recorded, NOT active): `CompanyItr6View` at `page.tsx:444` — old ITR-6-only view with a `HYDRATE_ITR` postMessage bridge + `ca_tax_bridge` localStorage bridge (`page.tsx:456-490`); the active router path is `StatutoryItrView`. itr6.html itself still contains the receiving bridge at `itr6.html:2819-2853` (applies `companyName`/`pan`/`doi` into `cl_name`/`cl_pan`/`cl_doi` only if empty, same-origin checked). The 2025-26 backup has its own `HYDRATE_ITR` listener at `itr6-ay2526-backup.html:13634`.

Builder/validator globals (confirmed by grep + live UI walk): **`buildJSON()`** at `itr6.html:2720`, **`validate()`** at `itr6.html:2647` (also registered in `src/lib/itr/client.ts:103,113` as `['buildJSON','buildItr6Json']` / `['validate','validateItr6']`). Screens switch on **`data-scr`** (`itr` | `comp` | `val`): tab bar `itr6.html:261-265`, section heads stamped `data-scr` in `buildSheet()` `itr6.html:2064`, screen switch `showScreen()` `itr6.html:2600`.

**Architecture (config-driven; the DOM is a projection):** the whole sheet is declared in `const SHEET` (`itr6.html:399-810`) — 13 collapsible statute-order parts, 360 rows. Every drill-in popup is declared in `const SPEC` (`itr6.html:839-1901`) — **120 popups**, each rendered as a full-screen `.subform` takeover (`sfHTML` :2134), plus **3 shared level-2 detail popups** (`sf-co-detail`, `sf-al-detail`, `sf-fa-detail`, :2152-2164) reused by every master-detail table (123 `.subform` nodes counted live). Row types: `sub` (sub-heading) · `ctr` (centered heading) · `note` · `in` (₹ input) · `txt` · `date` · `sel` · `yn` (Yes/No tab pair) · `ovr` (green computed-but-overridable input) · `fig` (⚙ computed cell) · `figt` (⚙ computed total band) · `drill` (status cell + ⋯ opener) · `dnum` (⚙ computed cell + ⋯ opener). Section kinds inside popups: `f` = labelled field grid (single record) · `b` = fixed break-up list (Particulars | Amount…) · `r` = repeater table (`+ Add row` / ✕ remove) · `m` = master-detail (summary table → `Edit ✎` opens shared detail popup; `+ Add entry` adds a row and opens it). State: `S.v` (sheet scalars), `S.p` (popup scalars keyed `popup.field`), `S.r` (repeater rows), `S.ovr` (green-cell overrides), `S.C` (computed) — `itr6.html:1905-1911`. `computeAll()` (:2459) repaints conditionals, `naif` pink-outs, ⚙ cells, drill status cells, popup grand bars and the rail on every keystroke (no Save button, :2516).

**Global field legend (applies to every field below unless the row says otherwise):**
- Placeholder: none, except `date` fields → `DD/MM/YYYY` (maxlength 10) and the clientbar (`Name of the company`, `AAAAA0000A`, `DD/MM/YYYY`).
- Helper: none unless a `help:` tooltip (blue ? bubble) is quoted.
- Default: empty. Exceptions (S.v seed, :1906): `Section under which return is filed`=`139`, `Return Type`=`Original`, 115TD flag=`No`, FA flag=`No`, liquidation flag=`No`, Ind AS flag=`No`, `Manufacturing, Trading and P&L A/c`=`Yes`, `ITR Manufacturing A/c`=`No`.
- Required / Validation: only via `VRULES` (:2618-2645) + structural checks in `validate()` (:2647) — listed in §Screen: Validate & Export. Numeric inputs coerce via `num()` (strip non-numeric, round); `n` fields format Indian-grouped on blur.
- Conditional: none unless a `cond:` (row hidden until every listed flag = Yes) or `naif:` (row pinked/locked when expr true) is quoted.
- Binds: sheet fields → `S.v[fld]` (input id `f_<fld>`); overridables → `S.ovr[fld]`; popup `f`/`b` fields → `S.p["<popup>.<id>"]`; repeater/master rows → `S.r[<key>][i].<col>`; clientbar → `S.p["cl.*"]`.
- Feeds: every `dnum` popup's grand total feeds its sheet ⚙ cell (`it_<popup>`) via `popupValue()` (:1994); onward flows listed per section.
- AY diff: per-field diffing vs 2025-26 is not meaningful — the 2025-26 file is a different app generation (see §AY-DIFF). Section-level diffs noted there.

**Option catalogs (FULL VERBATIM, defined once at `itr6.html:304-389`; every `sel` references one — "options are never hand-written in HTML"):**
- **YN**: "", Yes, No
- **STATUSES**: Domestic Company, Foreign Company *(defined but referenced by no field — see Discrepancies)*
- **RESID**: "", Resident, Non-Resident
- **SECTIONS**: "", 139, 142(1), 148, 153A, 153C, 119(2)(b), 92CD
- **RETTYPES**: "", Original, Revised, Belated, Updated u/s 139(8A), Modified u/s 92CD, Defective u/s 139(9) - response
- **CO_PUBPVT**: "", Private Company, Public Company
- **CO_KIND**: "", Domestic Company, Foreign Company, Company in which public are substantially interested, Company in which public are not substantially interested
- **ACC_TYPE**: "", Current, Savings, Cash Credit, Overdraft
- **DESIGNATN**: "", Managing Director, Director, Whole-time Director, Independent Director, Nominee Director, Company Secretary, Principal Officer, Manager, Chief Executive Officer, Chief Financial Officer, Liquidator, Authorised Representative
- **SHARE_TYP**: "", Equity, Preference
- **CESS_MODE**: "", Transfer, Buy back, Redemption, Reduction of capital, Other:
- **HOLDKIND**: "", Holding Company, Subsidiary Company, Both, Associate / Joint Venture *(defined but referenced by no field — see Discrepancies)*
- **DM_KIND**: "", Demerged company, Resulting company, Amalgamating company, Amalgamated company
- **REGULATOR**: "", Reserve Bank of India (RBI), Insurance Regulatory and Development Authority (IRDA), Securities and Exchange Board of India (SEBI), Pension Fund Regulatory and Development Authority (PFRDA), Public Sector Company, National Housing Bank (NHB), Other Regulator *(defined but referenced by no field — regco uses checkboxes instead; see Discrepancies)*
- **PTI_ENT**: "", 115U - Venture Capital, 115UA - Business Trust, 115UB - Investment Fund
- **PTI_HEAD**: "", House Property, Capital Gains - Short Term, Capital Gains - Long Term, Other Sources, Business or Profession, Income claimed to be exempt
- **AUDIT_SEC**: "", 10AA, 115JB, 115VW, 33AB, 33ABA, 44DA, 50B, 80-IA, 80-IAB, 80-IAC, 80-IB, 80-IE, 80JJAA, 80LA, 92E, Other:
- **AUDIT_ACT**: "", Banking Regulation Act, 1949 · Central Excise Act, 1944 · Central GST Act, 2017 · Central Sales Tax Act, 1956 · Charitable and Religious Trusts Act, 1920 · Companies Act, 2013 · Electricity Act, 2003 · Employees Provident Fund and Miscellaneous Provisions Act, 1952 · Foreign Exchange Management Act, 1999 · Government Superannuation Fund Act, 1956 · Integrated GST Act, 2017 · Other: · Payment of Gratuity Act, 1972 · SEBI Act, 1992 · Securities Contract (Regulation) Act, 1956 · State GST Act, 2017 · Union Territories GST Act, 2017
- **CAP_KIND**: "", Partnership Firm, LLP, AOP, BOI, Joint Venture
- **FA_OWN**: "", Direct, Beneficial owner, Beneficiary
- **FA_ACCT**: "", Depository, Custodial
- **ENT_NATURE**: "", Company, Firm, Partnership, Trust, LLP, Individual, Others
- **FA_INCTYPE**: "", Interest, Dividend, Rent, Capital Gains, Business Income, Salary, Other
- **FA_SCHED**: "", Salary, House Property, Business or Profession, Capital Gains, Other Sources, Exempt Income
- **FPAY_HEAD**: "", Commission, Professional / Consultancy / Technical fees, Royalty, Salaries and other benefits, Travelling, Interest, Other *(defined but referenced by no field — pl_fpay uses a fixed break-up; see Discrepancies)*
- **AL_LISTED_TYP**: "", Bonus, Equity
- **AL_SEC_TYP**: "", Bonds, Debentures, Derivatives, Other:, Preference Shares
- **AL_VEH**: "", Aircraft, Motor Vehicle, Other:, Yacht
- **AL_JEW**: "", Archaeological Collections, Bullion, Diamond Jewellery, Drawings, Gold Jewellery, Other precious metal Jewellery, Other precious stone Jewellery, Other:, Paintings, Platinum Jewellery, Sculptures, Silver Jewellery, Work of Art
- **COUNTRIES**: "" + 143 ISO entries "AF - Afghanistan" … "ZW - Zimbabwe" (`itr6.html:370`)
- **STATES**: "" + 36 Indian states/UTs + "Outside India" (`itr6.html:372`)
- **REGIMES**: "", Normal provisions, 115BA - 25%, 115BAA - 22%, 115BAB - 15%, 115BAE - 15% *(defined but referenced by no field — the sheet uses CO_REGIME; see Discrepancies)*
- **CO_REGIME**: "", Normal provisions, 115BA - 25%, 115BAA - 22%, 115BAB - 15%
- **ESR_SEC**: "", 35(1)(i), 35(1)(ii), 35(1)(iia), 35(1)(iii), 35(1)(iv), 35(2AA), 35(2AB), 35CCC, 35CCD
- **HP_TYPE**: "", Let out, Deemed let out
- **HP_OWNER**: "", Self, Deemed owner
- **REL_SEC**: "", 90, 90A
- **DUE_DATE**: "", 31st October, 30th November
- **TDS_HEAD**: "", House Property, Business or Profession, Capital Gains, Other Sources, Exempt Income
- **SI_SEC**: "", 111A - STCG on STT paid shares (before 23/07/2024) - 15%, 111A - STCG on STT paid shares (on/after 23/07/2024) - 20%, 112(1) - LTCG with indexation (before 23/07/2024) - 20%, 112(1) - LTCG (on/after 23/07/2024) - 12.5%, 112A - LTCG on STT paid shares (before 23/07/2024) - 10%, 112A - LTCG on STT paid shares (on/after 23/07/2024) - 12.5%, 115A(1)(a) - Dividend / interest of a foreign company, 115AC - Bonds / GDR purchased in foreign currency, 115AD - Income of an FII, 115BB - Winnings from lotteries, races, card games - 30%, 115BBA - Non-resident sportsmen or sports associations, 115BBE - Cash credits / unexplained income - 60%, 115BBF - Royalty from a patent - 10%, 115BBG - Transfer of carbon credits - 10%, 115BBH - Virtual digital assets - 30%, 115BBJ - Winnings from online games - 30%, Chapter XII-G - Tonnage tax
- **CAPACITY**: "", Guardian, Manager, Administrator, Executor, Trustee, Court of Wards, Liquidator, Legal Heir, Other
- **NIC / NIC_44AE** (nature-of-business): CBDT annexure codes parsed from `NIC_RAW` (`itr6.html:335-359`) — 23 sectors ("Agriculture, Animal Husbandry, Forestry" … "Income from Partnership Firm") with `code~sub-sector` pairs (e.g. `01001~Growing and manufacturing of tea` … `22001~Extraterritorial organizations and bodies (IMF, World Bank, European Commission, etc.)`); `NIC_44AE_RAW` (:360-363) restricts to Renting of Machinery (08001) + Transport & Logistics (11002, 11008, 11010, 11011, 11012, 11015). Sector select drives Sub-sector list; Code cell is derived, never stored (`nicSync` :2566).

---

## Persistent chrome (all screens)

**Top bar** (`itr6.html:254-259`): "ITR-6 · {screen name}" · live subtitle (Status · Residential status · Name/PAN) · badge **"A.Y. 2026-27"** · button **"Go to next →"** (`btnNext`, scrolls to the next section head, :2591).

**Tab bar** (:261-265): buttons **"ITR Info"** (`data-scr="itr"`, default on) · **"IT Computation"** (`data-scr="comp"`) · **"Validate & Export"** (`data-scr="val"`).

**Client bar** (:267-273) — always visible, syncs into any popup field with the same `data-p`:

| Label | Type | Options | Placeholder | Binds | Feeds |
|---|---|---|---|---|---|
| Name | text (w 186px) | — | `Name of the company` | `S.p["cl.name"]` | JSON `PersonalInfo.AssesseeName`; top-bar subtitle |
| PAN | text, uppercase, maxlength 10 | — | `AAAAA0000A` | `S.p["cl.pan"]` | JSON `PAN`; export filename `{PAN}_ITR6_AY2026-27.json` |
| Status | select | **CO_KIND** | — | `S.p["cl.status"]` | surcharge/MAT foreign-co branch (`==="Foreign Company"`); JSON `CompanyType` D/F; rail "Status:" pill |
| Residential Status | select | **RESID** | — | `S.p["cl.resid"]` | JSON `ResidentialStatus` RES/NR |
| Date of Incorporation | text | — | `DD/MM/YYYY` (maxlength 10) | `S.p["cl.doi"]` | JSON `DOF` (ISO) |

**Bottom rail** (:290-297, repainted by `computeAll` :2500-2512): pills `Basic info. 0/4` (counts filled among assessee/verifier/bank/nature) · `B/S —` (→ "Tallied" green / "Diff {n}" red) · `PAT 0` (live `it_pl_pat`) · `FA off` (→ "{n} entries" when FA flag Yes) · right `Status: —`.

**Subform chrome**: every drill-in is a full-screen takeover with blue header — title · "A.Y. 2026-27" · button **"✓ Done"**; Esc also closes (stacked, level-2 details close first). Repeaters: **"+ Add row"**; master-detail: **"+ Add entry"**, per-row **"Edit ✎"**, per-row **"✕"** remove, empty state "No entries yet — use "+ Add …"." Footer `Total` cell when the section has a `tot` column; a `sf-grand` band ("{grand label}" + ⚙ value) when the popup contributes a number.

---

## Screen: ITR Info (`data-scr="itr"`) — 7 collapsible parts

Sheet note (only on this screen): *"(For Companies other than companies claiming exemption under section 11)"*.

### Part: ITR Information (SHEET id `info`, tag "Schedule", `itr6.html:400-444`)

Sub-heading **"Basic info."**

#### Particular: "Assessee info." [⋯ → opens Drill-in: assessee]
##### Drill-in: assessee (source: itr6.html:842-860) — single `f` grid
Note strip: *"^ Auto-filled from 'Permanent Info' table. To change the settings, go to 'Tools' menu → Settings → ITR/e-filing → Auto-fill Secondary Address & Contact details from 'Permanent Info'."*

| Label | Type | Options | Binds | Required/Validation | Feeds |
|---|---|---|---|---|---|
| STD code | text | — | `assessee.std` | — | — |
| Landline No. | text | — | `assessee.land` | — | JSON `Phone` |
| Country code (for Assessee's Mobile No.) | text | — | `assessee.ccode` | — | — |
| e-Mail ID (Assessee) | text wide | — | `assessee.email` | **required**, email regex | JSON `EmailAddress` |
| District | text | — | `assessee.district` | — | — |
| Secondary address same as primary address? | select | YN | `assessee.secsame` | — | — |
| *Secondary Contact details ^* (header) | — | — | — | — | — |
| Mobile No. | text | — | `assessee.secmob` | — | — |
| e-Mail ID | text wide | — | `assessee.secmail` | — | — |
| CIN issued by MCA | text wide | — | `assessee.cin` | — | JSON `CIN` |
| Liable to maintain accounts as per Sec.44AA? | select | YN | `assessee.ma44aa` | — | — |
| Status | select | CO_PUBPVT | `assessee.status` | **required** | — |
| Is an unlisted company? | select | YN | `assessee.unlisted` | **required** | — |
| Old name (in case of change) | text wide | — | `assessee.oldname` | — | — |

#### Particular: "Verifier info." [⋯ → opens Drill-in: verifier]
##### Drill-in: verifier (source: itr6.html:862-870)
Note: *"Details of 'Verifier' entered here, should match with the 'Key Person Details' under 'My Profile' of Income tax website."*

| Label | Type | Options | Binds | Required/Validation | Feeds |
|---|---|---|---|---|---|
| Name | text wide | — | `verifier.name` | **required**, max 75 | JSON `AssesseeVerName` |
| PAN | text | — | `verifier.pan` | **required**, PAN regex | JSON `AssesseeVerPAN` |
| Capacity | select | CAPACITY | `verifier.capacity` | **required** | JSON `Capacity` |
| Father's name | text wide | — | `verifier.father` | — | JSON `FatherName` |
| Place of signing | text | — | `verifier.place` | **required**, max 50 | JSON `Place`, `IntermediaryCity` |

#### Particular: "Bank Accounts" [⋯ → opens Drill-in: bank]
##### Drill-in: bank (source: itr6.html:872-880) — repeater, unit "accounts"
Note: *"If multiple accounts are ticked, refund will be credited to one of the validated account. For the procedure to validate the account in IT e-filing portal, press 'F1' key."*
Grid "Bank Accounts (All)", headers verbatim: **Bank Name | Account Number | IFS Code | Type of Account (ACC_TYPE) | For refund? (checkbox)**. + Add row / ✕. Validation: ≥1 account required; IFSC regex `ABCD0123456`; exactly-one-ticked-for-refund required. Feeds JSON `BankAccountDtls.BankDtls[]`.

Sub-heading **"Company Info."**

#### Particular: "Management & Ownership details" [⋯ → opens Drill-in: mgmt]
##### Drill-in: mgmt (source: itr6.html:883-898) — 3 master-detail tables, unit "entries", shared `co` detail popup
1. *"Particulars of Managing Director, Directors, Secretary & Principal officer(s) who have held office during the Previous Year"* — summary cols **Name | Designation | PAN | Director's ID No.**; detail groups: "Officer" (Name · Designation (DESIGNATN) · PAN · Director's ID No.) + "Residential address" (Residential Address · City · State (STATES) · PIN / ZIP code · Country (COUNTRIES)).
2. *"Beneficial owners of equity shares holding not less than 10% of the voting power at any time during the Previous Year"* — summary **Name | % of holding | PAN / Aadhaar No.**; detail: "Beneficial owner" (Name · % of holding (dec) · PAN / Aadhaar No.) + "Address" (Address · City · State · PIN / ZIP code · Country).
3. *"Ultimate beneficial owners (natural persons) having 10% or more of voting power at any time during the Previous Year"* — same shape as (2), group label "Ultimate beneficial owner".
Buttons: "+ Add entry" (opens detail), "Edit ✎", "✕". Feeds: status cell only — **not exported to JSON** (see Discrepancies).

#### Particular: "Whether recognised as Startup by DPIIT?" — yn tabs Yes/No, binds `S.v.dpiit`. Help: —. Feeds JSON `DPIITRecognised` Y/N.
#### Particular: "Start-up recognition number allotted by DPIIT" — text, binds `dpiit_no`, **Conditional: dpiit=Yes**, required-when-visible. Feeds JSON `DPIITRegNo`.
#### Particular: "Whether certificate from inter-ministerial board for certification is received?" — yn, binds `imb`, **Conditional: dpiit=Yes**. Help: *"The Inter-Ministerial Board certificate is what carries the deduction u/s 80-IAC. DPIIT recognition on its own does not."*
#### Particular: "Certification number" — text, binds `imb_no`, **Conditional: dpiit=Yes AND imb=Yes**, required-when-visible.
#### Particular: "Whether declaration in Form-2 (para 5 of DPIIT notification dated 19/02/2019) filed before filing the return?" — yn, binds `form2`, **Conditional: dpiit=Yes**.
#### Particular: "Date of filing Form-2" — date, binds `form2_dt`, **Conditional: dpiit=Yes AND form2=Yes**.

#### Particular: "Shareholders of Unlisted company" [tag SH-1] [⋯ → opens Drill-in: sh1]
##### Drill-in: sh1 (source: itr6.html:900-920) — 1 `f` field + 2 master-detail tables, unit "entries"
Note: *"If the shareholder is a non-resident, having no PAN, enter PAN as "NORES9999N". If PAN of the shareholder is not available due to any other reason, enter PAN as "NOAVL9999N"."*
- Field: **"Company registered u/s 8 or a company limited by guarantee u/s 3(2) of Companies Act, 2013?"** select YN → `sh1.u8`.
- Table *"Shareholders during the year"* — summary **Name | PAN | Quantity | Amount received**; detail groups: "Shareholders' details" (Name · PAN · Residential status (RESID)) · "Shares" (Type of share (SHARE_TYP) · Quantity (n) · Date of allotment (date) · Face value per share (dec) · Issue price per share (dec) · Amount received (n)) · "Cessation details (if not a shareholder as on 31-Mar-2026)" (Date · Mode (CESS_MODE) · Transferee's PAN).
- Table *"Equity Share application money pending allotment"* — summary **Name | PAN | Quantity | Application money received**; detail: "Applicants' details" (Name · PAN · Residential status) · "Application" (Type of share · Quantity · Date of application · Face value per share · Proposed Issue price · Application money received).
Not exported to JSON.

#### Particular: "Co. regulated by RBI / IRDA or Public sector Co." [⋯ → opens Drill-in: regco]
##### Drill-in: regco (source: itr6.html:922-931) — single-column checkbox grid "Nature of company"
Checkboxes (verbatim): **Public sector company · Owned by the RBI · Scheduled Bank · Owned by Govt / RBI (40% or more) · Non-scheduled Bank · NBFC · Co. regd. with IRDA** → `regco.psu/rbi/schbank/govt40/nonsch/nbfc/irda` ("Y"/""). Not exported.

#### Particular: "Holding / Subsidiary Co. Info." [⋯ → opens Drill-in: holdsub]
##### Drill-in: holdsub (source: itr6.html:933-942) — 2 master-detail tables, unit "companies"
- *"If Holding Company, details of subsidiary companies"* — summary **Name | PAN | % of Shares**; detail "Subsidiary company" (Name · PAN · % of Shares (dec)) + "Address" (Address · City · State · PIN / ZIP code · Country).
- *"If Subsidiary Company, details of holding company"* — same shape, group "Holding company".

#### Particular: "Whether Producer Company (Sec.378A of Co. Act, 2013)?" — yn, binds `producer`. Help: *"Asked only to carry the deduction u/s 80PA into Schedule VI-A. Nothing further is asked on this screen."*
#### Particular: "Recognised as MSME as per MSMED Act, 2006?" — yn, binds `msme`. Feeds JSON `MSMERegNo` gate.
#### Particular: "Registration number allotted as per MSMED Act, 2006" — text, binds `msme_no`, **Conditional: msme=Yes**, required-when-visible.

#### Particular: "Demerger / Amalgamation" [⋯ → opens Drill-in: demerger]
##### Drill-in: demerger (source: itr6.html:944-949) — master-detail, unit "entries"
*"Details of demerger / amalgamation during the year"* — summary **Other company's name | PAN | Other company's type | Date**; detail "Other company" (Other company's name · PAN · Other company's type (DM_KIND, wide) · Date) + "Address" (Address · City · State · PIN / ZIP code · Country).

Sub-heading **"ITR filing info."**

#### Particular: "Section under which return is filed" — select **SECTIONS**, binds `sec`, default `139`, **required**. Help: *"Section of the Income-tax Act, 1961 under which this return is being furnished."* Feeds JSON `ReturnFileSec`.
#### Particular: "Return Type" — select **RETTYPES**, binds `rettype`, default `Original`, **required**. Feeds JSON `ReturnType`.
#### Particular: "Representative Assessee, if any" [⋯ → opens Drill-in: repasse]
##### Drill-in: repasse (source: itr6.html:952-957)
Fields: **Name** (text wide) · **e-Mail ID** (text wide) · **Contact No.** (text) · **Country code (for Contact No.)** (text) → `repasse.*`. Not exported.

Sub-heading **"Income related info."**

#### Particular: "Pass Through Income u/s 115U/ 115UA/ 115UB" [tag PTI] [⋯ → opens Drill-in: pti]
##### Drill-in: pti (source: itr6.html:959-965) — repeater, unit "entries", grand "Total pass through income" (Σ Income)
Note: *"Exempt incomes disclosed in this table will be auto-filled in 'Incomes fully exempt' table of Computation window."*
Grid *"Pass Through Income from Venture Capital u/s 115U, Business Trust u/s 115UA and Investment Fund u/s 115UB"*: **Name of Trust / Fund | Income (n, totalled) | TDS (n) | PAN | Head of income (PTI_HEAD, wide) | Investment Entity (PTI_ENT)**. Discrepancy note: the promised auto-fill into the exempt-income table is **not implemented** — `ti_ei` has an independent `pti` row.

Sub-heading **"Audit related details"**

#### Particular: "Liable for audit u/s 44AB?" — yn, binds `aud44ab`, **required**. Help: *"Tick Yes if the accounts are required to be audited under section 44AB. Schedule FD is not applicable when Yes."* Feeds JSON `LiableSec44AB`; pinks the FD drill (naif).
#### Particular: "Tax audit details u/s 44AB" [⋯ → opens Drill-in: aud44ab_det] — **Conditional: aud44ab=Yes**
##### Drill-in: aud44ab_det (source: itr6.html:967-988)
Note: *"Form 3CA-3CD or 3CB-3CD must be filed on the e-filing portal at least one month before the due date for filing the return u/s 139(1)."*
Section "Liable for audit by virtue of" (checkboxes, one-column): **Sales, turnover or gross receipts exceeds the limits specified under section 44AB · Assessee falling u/s 44BB but not offering income on presumptive basis · Assessee falling u/s 44BBB but not offering income on presumptive basis · Others**.
Section "Audit report": **Whether the accounts have been audited by an accountant?** (YN) · **Date of furnishing of the audit report** (date) · **Name of the auditor signing the tax audit report** (wide; required when aud44ab=Yes) · **Membership No. of the auditor** (required when aud44ab=Yes) · **Name of the auditor (proprietorship / firm)** (wide) · **Proprietorship / firm registration number** · **PAN / Aadhaar No. of the proprietorship / firm** · **Date of audit report** (date; required + date-format when aud44ab=Yes) · **Acknowledgement Number of the Audit Report** · **UDIN** (required when aud44ab=Yes). Feeds JSON `AuditInfo`.

#### Particular: "Other Audits (excluding u/s 44AB of Income Tax Act)" [⋯ → opens Drill-in: othaudit]
##### Drill-in: othaudit (source: itr6.html:990-997) — 2 repeaters, unit "audits"
- *"Audits under Income Tax Act"*: **Section (AUDIT_SEC) | Date of furnishing Report (date) | Acknowledgement number | Whether furnished? (YN)**
- *"Audits under other Acts"*: **Act (AUDIT_ACT, wide) | Date of furnishing Report (date) | Section (text) | Whether furnished? (YN)**

Sub-heading **"Business related info."**

#### Particular: "Nature of Business / Profession" [⋯ → opens Drill-in: nature]
##### Drill-in: nature (source: itr6.html:1000-1007) — 2 repeaters, unit "entries"
- *"Taxable u/s 44AE"*: **Sector (NIC_44AE sector select) | Sub-sector (dependent select) | Code (derived, read-only) | Trade name | Description, if any**
- *"Other than Taxable u/s 44AE"*: same columns, full **NIC** catalog.
Validation: ≥1 business required; sub-sector required whenever sector picked. Feeds JSON `NatureOfBusiness[]` (Code/Sector/SubSector/PresumptiveUs44AE Y-N/TradeName/Description); rail "Basic info." count.

#### Particular: "Turnover/Gross Receipts reported in GSTR" [tag GST] [⋯ → opens Drill-in: gst]
##### Drill-in: gst (source: itr6.html:1009-1011) — repeater, grand "Total outward supplies"
Grid: **GSTIN | Outward supplies as per GST return (n, totalled)**. Not exported.

#### Particular: "Break-up of Transactions in Foreign currency" [tag FD] [⋯ → opens Drill-in: fd] — **naif: aud44ab=Yes** (pinked + locked when audit applies)
##### Drill-in: fd (source: itr6.html:1013-1018) — break-up with 2 amount columns, grand "Total"
Note: *"Applicable only if not liable for audit u/s 44AB. Enter break-up of transactions only in respect of business operations in India."*
Rows × columns: **Receipts** / **Payments** × **Capital | Revenue** → `fd.r_cap/r_rev/p_cap/p_rev`.

#### Particular: "Business or Profession start date" — date, binds `bizstart`. Help: *"Date on which the business or profession was set up."*

#### Particular: "Tax paid u/s 92CE" [tag TPSA] [⋯ → opens Drill-in: tpsa]
##### Drill-in: tpsa (source: itr6.html:1020-1033) — break-up + repeater, grand "Net Tax payable (A - B)", custom calc `tpsa()` (:1972)
Break-up rows: **Amount on which option u/s 92CE(2A) is exercised** (input) · **Additional Income tax @ 18%** (⚙ =18% of amount) · **Surcharge @ 12%** (⚙) · **Cess @ 4%** (⚙) · **Total Tax payable (A)** (⚙) · **Tax paid (B)** (⚙ = Σ deposits) · **Net Tax payable (A - B)** (⚙).
Repeater *"Details of tax deposit:"*: **Name of the Bank & Branch | BSR Code | Date of deposit | Challan no. | Amount (totalled)**. Not exported.

Sub-heading **"Other info."**

#### Particular: "Investment in unincorporated entities" [tag IF] [⋯ → opens Drill-in: unincorp]
##### Drill-in: unincorp (source: itr6.html:1035-1042) — master-detail, unit "entities", grand "Total capital balance" (Σ Capital Balance)
Note: *"Details entered in 'Income from partnership firm' table of 'IT Computation' window will be taken to 'Schedule IF' in the return. Do not enter those details again in this table."* (Discrepancy note: no such "Income from partnership firm" table exists in this build's Computation screen.)
Summary **Name of the entity | PAN | Share of Profit (Rs.) | Capital Balance**; detail "Entity" (Name of the entity · Type of the entity (CAP_KIND) · PAN · Liable for audit? (YN) · Is Section 92E applicable? (YN)) + "Share of profit & balance" (Share of Profit (%) (dec) · Share of Profit (Rs.) (n) · Interest (n) · Capital Balance on 31st March (n)).

#### Particular: "Legal Entity Identifier (LEI) details (if refund = > Rs. 50 Cr)" [⋯ → opens Drill-in: lei]
##### Drill-in: lei (source: itr6.html:1044-1047) — fields: **LEI Number** (wide) · **Valid up to date** (date).

### Part: Assets / Liabilities (SHEET id `al`, tag "AL-1", itr6.html:446-458)

All 10 particulars are `dnum` (⚙ total + ⋯); **"Total"** ⚙ band (`it_al_total` = Σ of the nine asset drill totals). Liabilities row sits below the total and is excluded from it.

#### Particular: "Residential Land / building" → Drill-in al_resland (itr6.html:1050) — repeater "properties", grand "Total cost of acquisition": **Particulars | Address | Pin code | Date of acquisition | Cost of acquisition (totalled) | Purpose**
#### Particular: "Other Land / building" → al_othland (:1055) — identical grid.
#### Particular: "Listed Equity shares" → al_listed (:1060) — master-detail (`al` family), grand "Total closing balance (cost)"; summary **Type | Opening Qty | Closing Qty | Closing Cost**; detail groups: "Share" (Type (AL_LISTED_TYP)) · "Opening balance" (Quantity · Cost) · "Shares Acquired" (Quantity · Cost) · "Shares Transferred" (Quantity · Consideration) · "Closing balance" (Quantity · Cost).
#### Particular: "Unlisted Equity shares" → al_unlisted (:1069) — master-detail; summary **Name of the Company | PAN | Closing Qty | Closing Cost**; detail: "Company" (Name of the Company · PAN) · "Opening balance" (Quantity · Cost) · "Shares acquired" (Quantity · Date · Face value per share · Price paid per Share for — Fresh issue · Price paid per Share for — Purchase from Shareholder) · "Shares Transferred" (Quantity · Consideration) · "Closing balance" (Quantity · Cost).
#### Particular: "Other Securities" → al_othsec (:1080) — master-detail; summary **Type | Whether listed? | Closing Qty | Closing Cost**; detail: "Security" (Type (AL_SEC_TYP) · Whether listed? (YN)) then same Opening/acquired/transferred/Closing groups as unlisted (labels "Securities acquired"/"Securities transferred").
#### Particular: "Capital contribution to other Entities" → al_capcon (:1091) — repeater "entities", grand "Total closing balance"; note *"^ Interest credited or debited during the year to be disclosed."*; cols **Name of the Entity | PAN | Opening balance | Amount contributed | Amount withdrawn | Profit/loss/ dividend/ interest^ | Closing balance (totalled)**
#### Particular: "Loans and Advances" → al_loans (:1098) — repeater *"Details of Loans & Advances given to a concern (if money lending is not assessee's substantial business)"*: **Name of the person | PAN | Opening balance | Amount Received | Amount paid | Interest received | Interest (%) | Closing balance (totalled)**
#### Particular: "Vehicles, Boats, etc." → al_vehicles (:1105) — repeater "items": **Particulars (AL_VEH) | Registration number | Cost of acquisition (totalled) | Date of acquisition | Purpose**
#### Particular: "Jewellery, bullion, artwork, etc." → al_jewel (:1110) — repeater "items": **Particulars (AL_JEW, wide) | Quantity | Cost of acquisition (totalled) | Date of acquisition | Purpose**
#### Particular: "Total" — ⚙ `it_al_total`.
#### Particular: "Liabilities (other than from Financial Institutions)" → al_liab (:1115) — repeater *"Loans, deposits & Advances (other than from Financial Institutions)"*: **Name of the person | PAN | Opening balance | Amount Received | Amount paid | Interest paid | Closing balance (totalled) | Interest (%)**
Discrepancy note: none of Schedule AL is exported to JSON.

### Part: Accreted income u/s 115TD (SHEET id `td`, tag "115TD", itr6.html:460-473)

#### Particular: "Having accreted income u/s 115TD?" — yn, binds `td`, default No. Everything below is **Conditional: td=Yes**.
| Row | Type | Binds/id | Formula (⚙) |
|---|---|---|---|
| Aggregate Fair Market Value (FMV) of total assets | in | `td_fmvtot` | — |
| Less: Total Liability | in | `td_liab` | — |
| Net value of Assets | fig | `it_td_netval` | fmvtot − liab |
| Less: FMV of assets [⋯ → td_fmvless] | dnum | `it_td_fmvless` | popup total |
| Accreted income as per sec. 115TD | fig | `it_td_accr` | netval − fmvless |
| Additional income-tax payable u/s 115TD at MMR | fig | `it_td_addtax` | max(0,accr) × **MMR 0.34944** (30% + 12% surcharge + 4% cess) |
| Interest payable u/s 115TE | in | `td_int` | — |
| Additional income-tax & interest payable (A) | fig | `it_td_a` | addtax + int |
| Tax & Interest paid (B) [⋯ → td_paid] | dnum | `it_td_b` | Σ challans |
| Net payable (A - B) | figt | `it_td_net` | A − B → JSON `NetTaxPyblOn115TDInc` |
| Date of conversion / merger / dissolution | date | `td_date` | — |

##### Drill-in: td_fmvless (itr6.html:1122) — break-up, grand "Total", calc a+b+c−liab; header "FMV of assets:"; rows: **- Directly acquired out of income referred to in Sec. 10(1)** · **- Acquired till date of registration, if benefit u/s 11/12 not claimed during that period** · **- Transferred in accordance with third proviso to Sec. 115TD(2)** · **Less: Liability in respect of above assets**.
##### Drill-in: td_paid (:1130) — repeater "challans", grand "Total": **Name of Bank & Branch | BSR Code | Date of deposit | Challan No. | Challan Amount (totalled)**.
Validation: warn if td=Yes and FMV blank.

### Part: Foreign Assets & Incomes (SHEET id `fa`, tag "FA", itr6.html:475-488)

#### Particular: "Having Foreign assets and Income or Signing authority in Foreign a/c?^" — yn, binds `fa`, default No. All 9 drills **Conditional: fa=Yes**. Notes on sheet: *"^Enter all items held (including any beneficial interest) at any time during the calendar year 2025."* and *"Note: If the ZIP code is not available, enter 'XXXXXX'."* Feeds JSON `AssetOutsideIndiaFlg` YES/NO; rail FA pill. Validation: warn if Yes with no entries.
Shared block `OFFERED` = group *"Income offered in this return"*: **Taxable Income (n) · Schedule of ITR (FA_SCHED) · Item No. of sch.** — appears where noted. All FA tables are master-detail on the shared `fa` detail popup; none are exported to JSON.

#### Particular: "Foreign Depository / Custodial accounts" → fa_dep (itr6.html:1136) — grand "Total peak balance"; summary **Country Name | Institution | Account Number | Peak Balance**; detail: "Country" (Country Name (COUNTRIES)) · "Institution details" (Name · Address · Zip code) · "Account" (Account Type (FA_ACCT) · Account Number · Ownership (FA_OWN) · A/c opening date) · "Balance & income" (Peak Balance during the year (Rs.) · Closing balance (Rs.) · Gross Income received · Nature of Income (FA_INCTYPE)).
#### Particular: "Investments in Foreign Equity / Debts" → fa_eq (:1146) — grand "Total closing value"; summary **Country Name | Entity | Closing value | Gross Income**; detail: "Country" · "Details of Entity" (Name · Address · Zip code · Nature (ENT_NATURE)) · "Value of Investment (Rs.)" (Date of acquiring interest · Initial value · Peak value · Closing value) · "Income & proceeds" (Gross Income received · Proceeds from Sale/Redemption).
#### Particular: "Surrender value of Foreign Insurance / Annuity Contract" → fa_ins (:1156) — grand "Total surrender value"; summary **Country Name | Institution | Date of contract | Surrender value**; detail: "Country" · "Institution details" · "Contract" (Date of contract · Surrender value of contract · Gross Income received).
#### Particular: "Financial Interest in any Entity" → fa_fin (:1164) — grand "Total investment"; summary **Country Name | Name of the Entity | Total Investment | Income accrued**; detail: "Country" (Country Name · ZIP code) · "Entity" (Nature of Entity (ENT_NATURE) · Name of the Entity · Address of the Entity · Ownership (FA_OWN) · Date since held) · "Investment & income" (Total Investment (Rs.) · Income accrued · Nature of Income) · OFFERED.
#### Particular: "Immovable Property" → fa_imm (:1175) — grand "Total investment"; summary **Country Name | Property address | Total Investment | Income**; detail: "Country" (+ZIP) · "Property" (Property address · Ownership · Acquisition date · Total Investment (Rs.)) · "Income" (Income · Nature of Income) · OFFERED.
#### Particular: "Other Capital Assets" → fa_cap (:1184) — grand "Total investment"; summary **Country Name | Nature of asset | Total Investment | Income**; detail: "Country" (+ZIP) · "Asset" (Nature of asset (text) · Ownership · Acquisition date · Total Investment (Rs.)) · "Income" · OFFERED.
#### Particular: "Account in which Assessee is signing authority (not included above)" → fa_sign (:1193) — grand "Total peak balance"; summary **Institution | Country Name | Account Number | Peak Balance**; detail: "Institution details" (Name · Address · Country Name · Zip code) · "Account" (Account holder name · Account Number · Peak Balance (Rs.) · Income accrued (If liable to tax)) · OFFERED.
#### Particular: "Trusts in which Assessee is a Trustee / Beneficiary / Settlor" → fa_trusts (:1203) — grand "Total income derived"; summary **Country Name | Name of the trust | Position held since | Income derived**; detail: "Country" (+ZIP) · "Trust" (Name · Address) · "Trustees" (Name · Address) · "Settlor" (Name · Address) · "Beneficiaries" (Name · Address) · "Position & income" (Position held since (date) · Income derived (If liable to tax)) · OFFERED.
#### Particular: "Other income not included above or in sch. BP of ITR" → fa_othinc (:1217) — grand "Total income derived"; summary **Country Name | Person | Income derived | Taxable Income**; detail: "Country" (+ZIP) · "Person from whom income is derived" (Name · Address) · "Income" (Income derived · Nature of Income) · OFFERED.

### Part: Receipt and Payment A/c of Company under Liquidation (SHEET id `ol`, tag "Part A - OL", itr6.html:490-512)

#### Particular: "Whether the Company is under liquidation?" — yn, binds `ol`, default No; all rows below **Conditional: ol=Yes**.
Opening balance: **Cash in hand** (`ol_ob_cash`) · **Bank balance** (`ol_ob_bank`). Receipts: **Interest** · **Dividend** · **Sale of Assets** [⋯ → ol_sale, generic Particulars|Amount repeater, grand "Total"] · **Realisation of dues/debtors** · **Others** [⋯ → ol_roth — TWO Particulars|Amount repeaters titled *"Revenue Receipts"* and *"Capital Receipts"*] · ⚙ **Total** (`it_ol_rtot` = opening + receipts). Payments: **Repayment of Secured loan** · **Repayment of Unsecured loan** · **Repayment to Creditors** · **Commission** · **Others** [⋯ → ol_poth, Particulars|Amount repeater]. Closing balance: **Cash in hand** · **Bank balance** · ⚙ **Total** (`it_ol_ptot` = payments + closing). Not exported to JSON.

### Part: Financial statements are drawn as per Ind AS ? (SHEET id `bs`, header Yes/No flag `indas`, itr6.html:514-571)

Header carries a Yes/No tab pair bound to `S.v.indas` (default No). Discrepancy note: **the Ind AS flag drives nothing** — same B/S rows render either way and the flag is not exported (2025-26 backup had a full separate Ind AS Division-II B/S + Ind AS Mfg/Trading/P&L).

Centered headings **"ITR B/S"** → **"Liabilities"**:
- Share capital: **Authorised Capital** (`bs_auth` — Discrepancy: entered but excluded from Total Liabilities by design) · **Fully Paid Up Capital** (`bs_paid`) · **Other items^^** [⋯ → bs_scoth: rows **Share application money · Subscribed but not fully paid · Money received against share warrants**]
- Reserve and surplus: **General Reserve** (`bs_genres`) · **Other Reserves** [⋯ → bs_othres: fixed rows **Revaluation Reserve · Capital Reserve · Debenture Redemption Reserve · Capital Redemption Reserve · Securities Premium Reserve · Share options o/s** + open repeater "Other Reserves" (Particulars|Amount)] · **Profit & Loss A/c** (green `ovr`, source `it_pl_bal` — auto from P&L "Balance carried to B/S", type to override)
- Long term liabilities: **Long Term Rupee loans  - from Banks** · **- from others** · **Other Long-term borrowings** [⋯ → bs_ltborr: **Rupee Bonds / debentures · Foreign currency Bonds / Debentures · Foreign currency Term Loans · Deferred payment liabilities · Deposits from related parties · Other Deposits · Loans & advances from related parties · Other loans & advances · Finance lease obligations**] · **Long term Trade Payables** · **Other Long term Liabilities** · **Long-term Provision for Employee Benefits** · **Other Long-term provisions** · **Deferred tax liability**
- Current liabilities: **Demand Loan from Banks** · **Other Short term borrowings** [⋯ → bs_stborr: header "Loans repayable on demand from:" → **NBFCs · Other Financial Institutions · Others** (indented) + **Deposits from related parties · Loans & advances from related parties · Other Loans & advances · Other deposits**] · **Trade Creditors** [⋯ → bs_tcred: **Trade Creditors o/s for more than 1 year · Others**] · **Other current liabilities** [⋯ → bs_ocl: **Current maturities of long-term debt · Current maturities of finance lease · Interest accrued but not due on borrowings · Interest accrued and due on borrowings · Income received in advance · Unpaid dividends · Application money refund due with interest · Unpaid matured deposits with interest · Unpaid matured debentures with interest · Other payables**] · **Provision for employee benefit** · **Provision for Income-tax** · **Other short term provisions** [⋯ → bs_ostp: **Proposed Dividend · Dividend Tax · Others**]
- ⚙ **"Total  Liabilities"** (`it_bs_totliab`, :2287).

**"Assets"**:
- Fixed assets: **Net Block of Fixed Assets** [⋯ → bs_nbfa, calc: header "Details of Fixed Assets"; **Tangible Assets** → Gross Block · Less: Depreciation · Impairment losses; **Intangible Assets** → Gross Block · Less: Amortization · Impairment losses; net = tgb−tdep−timp+igb−iamo−iimp] · **Intangible assets under development** · **Capital work-in-progress**
- **Non-current investments** [⋯ → bs_ncinv: **Property · Equity - listed · - unlisted · Preference shares · Govt or trust securities · Debenture or bonds · Mutual funds · Partnership firms · Other long term investments**] · **Deferred tax assets (Net)** · **Long-term loans & advances^^** [⋯ → bs_ltla: **Capital advances · Security deposits · Loans/advances to related parties · Other Loans/advances**] · **Long term Trade Receivables^^** · **Other non-current assets^^**
- Current assets: **Current investments** [⋯ → bs_cinv: **Equity  - listed · - unlisted · Preference shares · Govt or trust securities · Debentures or bonds · Mutual funds · Partnership firms · Other investments**] · Inventories: **Raw materials** (feeds green Mfg closing stock) · **Finished goods** (feeds green Trading closing stock) · **Stock-in-trade** · **Others** [⋯ → bs_invoth: **Work-in-progress · Stores and spares · Loose tools · Others**] · **Trade Debtors** [⋯ → bs_tdeb: **Trade Debtors o/s for more than 6 months · Others**] · Cash / Cash equivalents: **Balances with Banks · Cheques, drafts in hand · Cash in hand · Others** · **Short-term loans & advances^^** [⋯ → bs_stla: **Loans/advances to related parties · Others**] · **Other current assets** [⋯ → bs_oca: Particulars|Amount repeater]
- ⚙ **"Total Assets"** (`it_bs_totassets`, :2295). B/S tally enforced by validate() when Mfg/Trading/P&L flag = Yes; rail pill shows Tallied/Diff.
- **"^^Additional Data"** (red) → **"Others"** [⋯ → bs_addl (no grand): headers/rows verbatim — "Out of Long-term Loans & advances:" → **- not for the purpose of business** (input) · **- for the purpose of business** (⚙ = bs_ltla total − not-for-business); "Out of Short-term loans/advances:" → same pair; "Out of Long term Trade Receivables:" → **- Secured, considered good · - Unsecured, considered good · - Doubtful** · **Total Long term Trade Receivables** (⚙ sum); "Amount given to beneficial owner of shares - 2(22)(e) out of:" → **- Long-term Loans & advances · - Other non-current Assets · - Short-term loans & advances**; **Out of the Share application money, pending for more than 1 year**].
JSON export: only `PARTA_BS.TotalLiabilities` / `TotalAssets` (see Discrepancies).

### Part: Manufacturing, Trading and P&L A/c (SHEET id `pl`, header Yes/No flag `mtpl` default Yes, itr6.html:573-659)

#### Particular: "ITR Manufacturing A/c" — yn `mfgac` (default No); Mfg rows visible only when **mtpl=Yes AND mfgac=Yes** (`condOn` :1926).
Mfg rows: Opening Stock → **Raw material** · **Work-in-progress**; **Purchases (net of returns / duty / tax)**; Expenses → **Direct Wages** · **Direct Expenses** [⋯ → mfg_direxp: fixed **Carriage inward · Power and fuel** + repeater "Others"] · **Factory Expenses** [⋯ → mfg_factexp: **Indirect Wages · Rent and rates · Insurance · Power and fuel · Depreciation on machinery** + repeater "General expenses"]; Less: Closing stock → **Raw material** (green ovr ← B/S Raw materials) · **Work-in-progress**; ⚙ **"Cost of Production"** (`it_mfg_cop`).

**"ITR Trading A/c"** (mtpl=Yes): Incomes → Sales / Gross receipts of Business (net of returns): **Sale of products/goods** · **Sale of services (excluding Professional receipts)** · **Other operating revenues** [⋯ → tr_othrev repeater "Other Operating Revenues": Particulars|Amount] · **Gross receipts from Profession** · **Duties, taxes and cess on sales** [⋯ → tr_duties: **Central GST (CGST) · State GST (SGST) · Integrated GST (IGST) · Union Territory GST (UTGST) · Service tax · Union Excise duties · VAT/Sales tax · Other duty, tax and cess**] · **Closing Stock - Finished goods** (green ovr ← B/S Finished goods) · ⚙ **Total** (`it_tr_totinc`); Expenses → **Opening Stock - Finished goods** · **Purchases (net of returns / duty / tax)** · **Direct Expenses** [⋯ → tr_direxp: **Carriage inward · Power and fuel** + "Others"] · **Taxes on Inputs / Purchases** [⋯ → tr_taxinp: **CGST · SGST · IGST · UTGST · Custom duty · Countervailing duty · Special additional duty · Union excise duty · Service tax · VAT/Sales tax · Others**] · ⚙ **Cost of Production  (as per Manufacturing A/c)** · ⚙ **"Gross Profit"** (`it_tr_gp`) · **Intraday Trading Income** [⋯ → tr_intraday: **Net income** (contributes) + spacer + **Turnover (For item 12a of Part A-Trading Account)**] · **Futures & Options Trading Income** [⋯ → tr_fno: **Net Income** + **Turnover (For item 12c of Part A-Trading Account)**].

**"ITR P&L A/c"** (mtpl=Yes): ⚙ **Gross profit (as per Trading A/c)** (= GP + intraday + F&O) · **Other Income** [⋯ → pl_othinc: **Agriculture income · Commission · Dividend · Interest income · Liability written back · Profit from currency fluctuation u/s 43AA · Profit on conversion of Stock into Capital asset u/s 28(via) · Profit on sale of - fixed assets · - investments having STT · - other investments · Rent · Incomes not considered as part of turnover** + repeater "Others"]. Expenses (27 plain inputs, verbatim): **Advertisement · Audit fee · Bad debts* · Club expenses · Commission ^ · Conference · Consumption of stores and spares · Conveyance · Donation · Entertainment · Festival celebration · Freight outward · Gift · Guest House expenses · Hospitality · Hotel, boarding and lodging · Insurance** [⋯ → pl_ins: **Medical Insurance · Life Insurance · Keyman's Insurance · Other Insurance**] **· Power and fuel · Professional / Consultancy / Technical fees ^ · Provisions** [⋯ → pl_prov: **Provision for bad debts · Other Provisions**] **· Rents · Repairs - Building · Repairs - Machinery · Royalty ^ · Salaries and other benefits ^** [⋯ → pl_sal: header "Compensation to employees" — **Salaries and wages · Bonus · Medical expenses reimbursement · Leave encashment · Leave travel benefits · Superannuation fund contribution (approved) · Provident fund contribution (recognised) · Gratuity fund contribution (recognised) · Any other fund contribution · Any other benefit**] **· Sales promotion (excluding Advertisement) · Scholarship · Staff welfare · Taxes and rates paid** [⋯ → pl_taxrates: header "Rates and taxes paid or payable" — **CGST · SGST · IGST · UTGST · Union excise duty · Service tax · VAT/Sales tax · Cess · Other rate, tax, duty or cess incl. STT and CTT**] **· Telephone · Travelling ^ · Other expenses** [⋯ → pl_othexp repeater "Other Expenses": Particulars|Amount].
⚙ **"Profit before interest, depreciation and taxes (PBIT)"** · **Less: Interest ^** · **Depreciation** (`pl_dep`, feeds Schedule BP add-back) · ⚙ **"Profit before Taxes (PBT)"** (`it_pl_pbt` → Schedule BP opening green cell) · **Less: Provision for - Current tax** · **- Deferred Tax** · ⚙ **"Profit after taxes (PAT)"** (rail pill) · **Add: Balance B/F from previous year** · Less:  Appropriations → **Transfer to Reserves** · **Other appropriations** [⋯ → pl_othapp: **Dividend Tax · Proposed / Interim dividend · CSR activities · Others**] · ⚙ **"Balance carried to B/S"** (`it_pl_bal` → green B/S "Profit & Loss A/c").
Additional Data (red): **"^ Foreign payments, included in above"** [⋯ → pl_fpay: header "Amount paid outside India or paid in India to Non-resident / Foreign Co.:" → **Salary and other benefits · Interest · Commission · Royalty · Professional / Consultancy / Technical fees** (indented) · **Foreign travelling expenses**] · **"*Analysis of Bad debts"** [⋯ → pl_baddebt: repeater *"Rs. 1 lakh or more, where PAN is available"* (**Name | PAN | Amount** totalled) + master-detail *"Rs. 1 lakh or more, where PAN is not available"* (summary **Name | Amount | City | State**; detail "Debtor" (Name · Amount) + "Address" (**Door No. · Building · Road · Area · City · State · PIN / ZIP code · Country**))].
Discrepancy note: Mfg/Trading/P&L detail is **not exported** — JSON carries only computed BP figures.

---

## Screen: IT Computation (`data-scr="comp"`) — 6 parts

ITR-6-specific computation engine (this form's own additions; not the shared Computation Sheet): company rate pick 25/30% by ₹400-crore turnover test; concessional regimes 115BA 25% / 115BAA 22% / 115BAB 15% (CO_REGIME); surcharge 7%/12% domestic vs 2%/5% foreign at ₹1cr/₹10cr with marginal relief, flat 10% under 115BAA/BAB; H&EC 4%; **MAT u/s 115JB @ 15%** of book profit + surcharge + cess, skipped under 115BAA/BAB, payable = max(normal, MAT), MAT credit u/s 115JAA capped at (normal − MAT); 234A/234B (1%/month-or-part engines off due-date 31 Oct/30 Nov 2026 and 1 Apr 2026), 234C instalment table, 234F ₹5,000/₹1,000; 115TD at MMR 0.34944; TPSA 18%+12%+4% (all in `compute()`/`computeComp()` :2232-2441).

### Part: Profits and gains of Business or Profession (SHEET id `bp`, tag "Schedule BP", itr6.html:664-709)

| Particular (verbatim) | Type | Binds/id | Drill-in |
|---|---|---|---|
| Profit before tax as per Profit & Loss A/c | ovr (green) | `bp_pbt` ← `it_pl_pbt` | — (help: *"Flows from the ITR P&L A/c (item 53). Type here only to override."*) |
| *Less: Income included above but considered separately* | sub | | |
| Net profit from speculative business included above | ovr | `bp_specpl` ← `it_tr_intraday` | — |
| Net profit from specified business u/s 35AD included above | in | `bp_35adpl` | — |
| Income credited to P&L considered under other heads / chargeable at special rates | dnum | `it_bp_inccred` | **bp_inccred** (:1618): **House property · Capital gains · Other sources — dividend · Other sources — other than dividend · Chargeable u/s 115BBF — royalty from a patent · Chargeable u/s 115BBG — transfer of carbon credits · Chargeable u/s 115BBH — virtual digital assets, net of cost of acquisition** |
| Income credited to P&L which is exempt | dnum | `it_bp_incexempt` | **bp_incexempt** (:1629): **Share of income from a firm · Share of income from an AOP / BOI** + repeater "Any other exempt income" |
| Profit u/s 44B / 44BB / 44BBA / 44BBB / 44D / 44DA / Chapter XII-G | in | `bp_44x` | — |
| Balance | figt | `it_bp_balance` | — |
| Add: Expenses debited to P&L relating to other heads / exempt income | dnum | `it_bp_expdeb` | **bp_expdeb** (:1635): **House property · Capital gains · Other sources · Relating to income chargeable u/s 115BBF · …115BBG · …115BBH · Relating to exempt income · Disallowed u/s 14A (item 16 of Part A-OI)** |
| Adjusted Profit / Loss | figt | `it_bp_adjusted` | — |
| Add: Depreciation & amortisation debited to P&L (Companies Act) | ovr | `bp_depco` ← `pl_dep` | — |
| Less: Depreciation allowable u/s 32 | dnum | `it_bp_depit` | **bp_depit** (:1647) "Summary of depreciation on assets (Schedule DEP)": Plant and machinery → **Block entitled to depreciation @ 15% / @ 30% / @ 40% / @ 45%**; Building (not including land) → **@ 5% / @ 10% / @ 40%**; Other blocks → **Furniture and fittings @ 10% · Intangible assets @ 25% · Ships @ 20%**; + **Depreciation allowable u/s 32(1)(i) — straight line, Appendix IA** |
| Profit after adjustment for depreciation | figt | `it_bp_afterdep` | — |
| *Add: Amounts debited to P&L, to the extent disallowable* | sub | | |
| Disallowance u/s 36 | dnum | `it_oi_36` | **oi_36** (:1547, Part A-OI item 6 verbatim, 18 rows a–r): **Premium for insurance against risk of damage or destruction of stocks or stores [36(1)(i)] · Premium for insurance on the health of employees [36(1)(ib)] · Bonus or commission to an employee, otherwise payable as profits or dividend [36(1)(ii)] · Interest paid in respect of borrowed capital [36(1)(iii)] · Discount on a zero-coupon bond [36(1)(iiia)] · Contributions to a recognised provident fund [36(1)(iv)] · Contributions to an approved superannuation fund [36(1)(iv)] · Contribution to a pension scheme referred to in section 80CCD [36(1)(iva)] · Contributions to an approved gratuity fund [36(1)(v)] · Contributions to any other fund · Employees' contribution to PF / superannuation / ESI not credited to the employee's account by the due date [36(1)(va)] · Bad and doubtful debts [36(1)(vii)] · Provision for bad and doubtful debts [36(1)(viia)] · Amount transferred to any special reserve [36(1)(viii)] · Expenditure on promoting family planning amongst employees [36(1)(ix)] · Securities transaction tax, where the income is not included in business income [36(1)(xv)] · Marked to market loss or other expected loss as computed under the ICDS notified u/s 145(2) [36(1)(xviii)] · Any other disallowance** |
| Disallowance u/s 37 | dnum | `it_oi_37` | **oi_37** (:1569, 10 rows): **Expenditure of capital nature [37(1)] · Expenditure of personal nature [37(1)] · Expenditure laid out wholly and exclusively NOT for the purpose of business or profession [37(1)] · Expenditure on advertisement in a souvenir, brochure, tract or pamphlet published by a political party [37(2B)] · Expenditure by way of penalty or fine for violation of any law for the time being in force · Any other penalty or fine · Expenditure incurred for any purpose which is an offence or which is prohibited by law · Expenditure incurred on corporate social responsibility (CSR) · Amount of any liability of a contingent nature · Any other amount not allowable under section 37** |
| Disallowance u/s 40 | dnum | `it_oi_40` | **oi_40** (:1583, 9 rows): **40(a)(i) — non-compliance with Chapter XVII-B on payments to a non-resident · 40(a)(ia) — non-compliance with Chapter XVII-B on payments to a resident · 40(a)(ib) — non-compliance with Chapter VIII of the Finance Act, 2016 (equalisation levy) · 40(a)(iii) — non-compliance with Chapter XVII-B on salary payable outside India · Tax or rate levied or assessed on the basis of profits [40(a)(ii)] · Wealth tax [40(a)(iia)] · Royalty, licence fee or service fee levied on a State Government undertaking [40(a)(iib)] · Interest, salary, bonus, commission or remuneration to a partner or member [40(b) / 40(ba)] · Any other disallowance** |
| Disallowance u/s 40A | dnum | `it_oi_40a` | **oi_40a** (:1596, 5 rows): **Amounts paid to persons specified in section 40A(2)(b) · Amount paid otherwise than by account payee cheque / draft / electronic clearing system [40A(3)] · Provision for payment of gratuity [40A(7)] · Sum paid as an employer to set up or contribute to any fund, trust, company, AOP, BOI or society [40A(9)] · Any other disallowance** |
| Disallowance u/s 43B | dnum | `it_oi_43b` | **oi_43b** (:1605, 9 rows incl. da): **Any sum in the nature of tax, duty, cess or fee under any law · Contribution to any provident, superannuation or gratuity fund or any other fund for employee welfare · Bonus or commission payable to an employee for services rendered · Interest on any loan or borrowing from a public financial institution / State financial corporation / State industrial investment corporation · Interest on any loan or borrowing from a notified class of non-banking financial company · Interest on any loan or borrowing from a scheduled bank or a co-operative bank · Any sum payable towards leave encashment · Any sum payable to the Indian Railways for the use of railway assets · Any sum payable to a micro or small enterprise beyond the time limit in s.15 of the MSMED Act, 2006 [43B(h)]** |
| Interest disallowable u/s 23 of the MSMED Act, 2006 | in | `bp_msmeint` | — |
| Deemed income u/s 41 | in | `bp_41` | — |
| Deemed income u/s 32AC / 33AB / 33ABA / 35ABA / 35ABB / 40A(3A) / 33AC / 72A / 80HHD / 80-IA | dnum | `it_bp_deemed` | **bp_deemed** (:1666): rows **32AC · 33AB · 33ABA · 35ABA · 35ABB · 35AC · 40A(3A) · 33AC · 72A · 80HHD · 80-IA** (note: `35AC` row exists in the popup though absent from the sheet label) |
| Deemed income u/s 43CA | in | `bp_43ca` | — |
| Any other item of addition u/s 28 to 44DB | in | `bp_othadd` | — |
| Any other income not included in P&L / any other expense not allowable | in | `bp_othinc` | — |
| Increase in profit on ICDS adjustment & s.145A valuation | in | `bp_icdsinc` | — |
| Total additions | figt | `it_bp_totadd` | — |
| *Less: Deductions allowable* | sub | | |
| Deduction u/s 32(1)(iii) | in | `bp_32iii` | — |
| Deduction u/s 32AC | in | `bp_32ac` | — |
| Deduction u/s 35 / 35CCC / 35CCD in excess of the amount debited to P&L | dnum | `it_bp_35esr` | **bp_35esr** (:1672) repeater "Schedule ESR" (note: *"Deduction under 35(1)(ii), 35(1)(iia), 35(1)(iii), 35(2AA), 35(2AB), 35CCC and 35CCD is not available to a company that has opted for 115BA, 115BAA or 115BAB."*): **Section (ESR_SEC) | Amount debited to P&L | Amount of deduction allowable | Excess over the amount debited (totalled)** |
| Amount disallowed u/s 40 in an earlier year, allowable this year | in | `bp_40now` | — |
| Amount disallowed u/s 43B in an earlier year, allowable this year | in | `bp_43bnow` | — |
| Any other amount allowable as deduction | in | `bp_othded` | — |
| Decrease in profit on ICDS adjustment & s.145A valuation | in | `bp_icdsdec` | — |
| Total deductions | figt | `it_bp_totded` | — |
| Income from business other than speculative and specified business | figt | `it_bp_other` | — |
| Add: Profits deemed to be income u/s 44AE / 44B / 44BB / 44BBA / 44BBB / 44D / 44DA / XII-G | dnum | `it_bp_presump` | **bp_presump** (:1679; note *"44AD and 44ADA are not offered: s.44AD is confined to a resident individual, HUF or firm other than an LLP, and s.44ADA to a resident individual or firm other than an LLP."*): **44AE — plying, hiring or leasing goods carriages · 44B — shipping business of a non-resident · 44BB — services for the extraction of mineral oil · 44BBA — operation of aircraft by a non-resident · 44BBB — civil construction in a turnkey power project · 44BBC — cruise shipping business of a non-resident · 44D — royalty / fees for technical services of a foreign company · 44DA — royalty / FTS of a non-resident with a PE · Chapter XII-G — tonnage tax · Eligible business of selling raw diamonds (rule 10TIA) · First Schedule of the Income-tax Act (other than 115B)** |
| Net profit from business other than speculative and specified business | figt | `it_bp_netother` | — |
| Income from speculative business | dnum | `it_bp_spec` | **bp_spec** (:1695, calc np+add−ded): **Net profit or loss from speculative business as per P&L · Additions in accordance with sections 28 to 44DB · Deductions in accordance with sections 28 to 44DB** |
| Income from specified business u/s 35AD | dnum | `it_bp_35ad` | **bp_35ad** (:1702, calc np+add−ded−d35ad): rows as bp_spec + **Deduction in accordance with section 35AD(1)** |
| Income chargeable under 'Profits and gains of business or profession' | figt | `it_bp_income` | — (speculation/35AD losses floored at 0 — "goes to Schedule CFL", :2337) |

Sheet note: *"A company cannot compute business income u/s 44AD or 44ADA — those are confined to a resident individual, HUF or firm other than an LLP. 44AE is available and sits above."*
Feeds: `it_bp_income` → Part B-TI "Profits and gains"; whole ladder exported to JSON `CorpScheduleBP`.

### Part: Income from House Property (SHEET id `hp`, tag "Schedule HP", itr6.html:711-719)

#### Particular: "Properties let out / deemed let out" [⋯ → opens Drill-in: hp_prop]
##### Drill-in: hp_prop (itr6.html:1711) — master-detail, unit "properties", grand "Income from house property"
Note: *"Furnishing the tenant's PAN is mandatory where tax is deducted u/s 194-IB; the TAN where tax is deducted u/s 194-I."*
Summary **Address | Type | Gross rent | Interest u/s 24(b)**; detail groups: "Property" (Address · Town / City · State (STATES) · PIN code · Country (COUNTRIES) · Type (HP_TYPE)) · "Ownership" (Owner of property (HP_OWNER) · Assessee's percentage share (dec, default 100 in compute)) · "Tenant" (Name of tenant · PAN / Aadhaar of tenant · PAN / TAN of tenant (if TDS credit claimed)) · "Annual value" (Gross rent received / receivable / lettable value · Less: Rent which cannot be realised · Less: Tax paid to local authorities) · "Deductions u/s 24" (Interest payable on borrowed capital · Arrears / unrealised rent received during the year).
⚙ ladder: **Annual value less taxes paid to local authorities** → **Less: 30% of annual value u/s 24(a)** → **Less: Interest payable on borrowed capital u/s 24(b)** → **Add: Arrears / unrealised rent received, less 30%** → **"Income chargeable under 'Income from house property'"** (`it_hp_income`, per-property share applied, :2340-2349).
Sheet note: *"The self-occupied option and the ₹2,00,000 interest cap are not offered: s.23(2) turns on the owner's own residence, and CBDT removed the self-occupied dropdown from ITR-6."*

### Part: Capital Gains (SHEET id `cg`, tag "Schedule CG", itr6.html:721-735)

All seven gain rows are `dnum` sharing one break-up shape `CGSEC()` (:825): input rows **Full value of consideration** · header "Deductions u/s 48" → **Cost of acquisition · Cost of improvement · Expenditure wholly and exclusively in connection with the transfer** (indented) · **Less: Deduction u/s 54D / 54EC / 54G / 54GA**; ⚙ grand = fvc−coa−coi−exp−ded.
Short-term: **"STCG u/s 111A (STT paid) — transfer before 23/07/2024 @ 15%"** (cg_st111a_o) · **"…on or after 23/07/2024 @ 20%"** (cg_st111a_n) · **"STCG chargeable at applicable rate"** (cg_stapp) · input **"Deemed STCG on sale of depreciable assets u/s 50 (Schedule DCG)"** (`cg_st50`) · ⚙ **"Total Short-term Capital Gain"**. Long-term: **"LTCG u/s 112A (STT paid) — transfer before 23/07/2024 @ 10%"** · **"…on or after 23/07/2024 @ 12.5%"** · **"LTCG u/s 112 with indexation @ 20% (transfer before 23/07/2024)"** · **"LTCG u/s 112 without indexation @ 12.5% (transfer on or after 23/07/2024)"** · ⚙ **"Total Long-term Capital Gain"** · ⚙ **"Income chargeable under 'Capital Gains'"**. Discrepancy note: the split gains are NOT auto-taxed at their special rates — tax at special rates comes only from what the user enters in Schedule SI (`ti_si`).

### Part: Income from other sources (SHEET id `os`, tag "Schedule OS", itr6.html:737-749)

| Particular | Type | Drill-in rows (verbatim) |
|---|---|---|
| Dividends, gross | dnum → **os_div** (:1735) | **Dividend income other than the two below · Dividend income u/s 2(22)(e) · Dividend income u/s 2(22)(f) — buy-back proceeds** |
| Interest, gross | dnum → **os_int** (:1740) | **From savings bank · From deposits with a bank / post office / co-operative society · On an income-tax refund · In the nature of pass through income · Others** |
| Rental income from machinery, plant, buildings etc., gross | in `os_rent` | — |
| Income of the nature referred to in s.56(2)(x) | dnum → **os_56x** (:1747) | **Aggregate value of a sum of money received without consideration · Immovable property received without consideration — stamp duty value · Immovable property received for inadequate consideration — stamp duty value in excess of the consideration · Any other property received without consideration — fair market value · Any other property received for inadequate consideration — FMV in excess of the consideration** |
| Any other income chargeable at normal rate | dnum → **os_oth** (:1754) | Particulars \| Amount repeater |
| Income chargeable at special rates (115BB, 115BBE, 115BBF, 115BBG, 115A...) | dnum → **os_spl** (:1760) | repeater: **Section (SI_SEC, wide) \| Rate (%) \| Income (totalled)** |
| Less: Deductions u/s 57 | dnum → **os_57** (:1755) | **Expenses / deductions other than those below · Depreciation (only against rental income from machinery, plant or buildings) · Interest expenditure on dividend u/s 57(1), capped at 20% of the dividend included in total income** |
| Add: Amounts not deductible u/s 58 | in `os_58` | — |
| Add: Profits chargeable to tax u/s 59 | in `os_59` | — |
| Income chargeable under 'Income from other sources' | figt `it_os_income` | — |

Sheet note: *"Family pension, minor child's income, clubbing u/s 60-64 and s.89A retirement accounts are individual-only and are not offered."*

### Part: Total Income (SHEET id `ti`, tag "Part B - TI", itr6.html:751-767)

⚙ head-wise: **Income from house property · Profits and gains of business or profession · Capital gains · Income from other sources · Total of head-wise income**. Then:
- **"Less: Current year loss set off (Schedule CYLA)"** [⋯ → ti_cyla (:1765): **House property loss set off · Business loss (other than speculation or specified business) set off · Other sources loss set off**]
- **"Less: Brought forward loss set off (Schedule BFLA)"** [⋯ → ti_bfla (:1771): **Brought forward house property loss · Brought forward business loss · Brought forward speculation loss · Brought forward specified business loss · Brought forward short-term capital loss · Brought forward long-term capital loss · Brought forward unabsorbed depreciation (Schedule UD) · Brought forward unabsorbed allowance u/s 35(4)**] — Discrepancy note: free-amount entries; no per-head/per-year set-off matrix or ordering rules (the 2025-26 backup had the full CYLA+BFLA matrix).
- ⚙ **"Gross Total Income"**
- **"Less: Deductions under Chapter VI-A"** [⋯ → ti_via (:1782); note *"Only the sections a company can claim are listed. 80C, 80CCC, 80CCD, 80CCH, 80D, 80DD, 80DDB, 80E, 80GG, 80TTA, 80TTB and 80U are confined to an individual or HUF. Under 115BAA and 115BAB only 80JJAA, 80M and 80LA(1A) survive."* Section "Part B — deduction in respect of certain payments": **80G — donations to certain funds and charitable institutions · 80GGA — donations for scientific research or rural development · 80GGB — contribution by an Indian company to a political party · 80GGC — contribution to a political party**; section "Part C — deduction in respect of certain incomes": **80-IA — infrastructure development · 80-IAB — development of a Special Economic Zone · 80-IAC — eligible start-up · 80-IB — certain industrial undertakings · 80-IBA — housing projects · 80-IE — undertakings in the North-Eastern States · 80JJA — collecting and processing bio-degradable waste · 80JJAA — additional employee cost · 80LA(1) — offshore banking unit · 80LA(1A) — unit of an International Financial Services Centre · 80M — inter-corporate dividends · 80PA — income of a producer company**]
- **"Less: Deduction u/s 10AA"** [⋯ → ti_10aa (:1804) repeater "Units located in a Special Economic Zone": **Undertaking | AY in which the unit begins to manufacture | Amount of deduction (totalled)**]
- ⚙ **"Total Income"** (floored at 0)
- **"Income chargeable at special rates (Schedule SI)"** [⋯ → ti_si (:1808) repeater "Schedule SI": **Section / description (SI_SEC, wide) | Rate (%) | Income (totalled) | Tax thereon**] — the *Tax thereon* column is user-entered and becomes `it_tti_special`.
- ⚙ **"Income chargeable at normal rates"** (= Total − SI income)
- **"Losses to be carried forward (Schedule CFL)"** [⋯ → ti_cfl (:1813) master-detail "Schedule CFL", unit "years": summary **Assessment Year | Date of filing | Total loss**; detail "Year" (Assessment Year · Date of filing) + "Losses carried forward" (**House property loss · Business loss other than speculation / specified · Speculation loss · Specified business loss · Short-term capital loss · Long-term capital loss · Total**) — Total is typed, not auto-summed]
- **"Income fully exempt (Schedule EI)"** [⋯ → ti_ei (:1820): **Interest income · Net agricultural income · Income not chargeable to tax as per a DTAA · Pass through income not chargeable to tax · Any other exempt income**]

### Part: Computation of tax liability (SHEET id `tti`, tag "Part B - TTI", itr6.html:769-809)

| Particular | Type | Binds/id | Notes |
|---|---|---|---|
| Tax rate option | sel **CO_REGIME** | `regime` | **required**. Help: *"115BA / 115BAA / 115BAB require Form 10-IB / 10-IC / 10-ID to have been filed. MAT u/s 115JB does not apply under 115BAA or 115BAB."* |
| Turnover / gross receipts of PY 2023-24 exceeds ₹400 crore? | yn | `to400` | required unless regime is 115BA/BAA/BAB. Help: *"Decides the normal rate for a domestic company: 25% at or below ₹400 crore, otherwise 30%."* |
| Applicable rate of tax | fig | `it_tti_rate` | 25 / 22 / 15 / (to400? 30 : 25) % — UI-verified: 115BAA → "22%", Normal+Yes → "30%" |
| Tax at normal rates / Tax at special rates / Tax payable on total income | fig/figt | `it_tti_normal/special/ontotinc` | special = Σ user "Tax thereon" in Schedule SI |
| Less: Marginal relief on surcharge / Surcharge on tax payable / Health & Education Cess @ 4% | fig | `it_tti_marginal/surcharge/cess` | surcharge 7/12% dom, 2/5% foreign, 10% flat concessional |
| Gross tax liability | figt | `it_tti_gross` | |
| Relief u/s 90 / 90A — treaty country | dnum → **tti_rel90** (:1830) | `it_tti_rel90` | repeater "Schedule TR — treaty country": **Country (COUNTRIES) \| Taxpayer identification number \| Tax paid outside India \| Tax payable on such income in India \| Relief claimed (totalled) \| Section (REL_SEC)** |
| Relief u/s 91 — non-treaty country | dnum → **tti_rel91** (:1835) | `it_tti_rel91` | same minus Section column |
| Net tax liability (normal provisions) | figt | `it_tti_net` | |
| Book profit u/s 115JB | drill → **mat_bp** (:1841) | `st_mat_bp` | **naif: regime=115BAA - 22% \| 115BAB - 15%** (pinked + click-locked; UI-verified). Note: *"115JB does not apply to a company that has opted for 115BAA or 115BAB, nor to income from a life insurance business u/s 115B."* Break-up "Schedule MAT": **Profit after tax as shown in the Profit & Loss A/c**; "Additions (if debited to P&L)" → **Income-tax paid or payable, and the provision therefor · Amounts carried to any reserve · Provisions for unascertained liabilities · Provisions for losses of subsidiary companies · Dividends paid or proposed · Expenditure relating to income exempt u/s 10 (other than 10(38)), 11 or 12 · Depreciation debited to P&L · Deferred tax and the provision therefor · Amount standing in the revaluation reserve on the retirement or disposal of the asset · Others**; "Deductions (if credited to P&L)" → **Amounts withdrawn from any reserve or provision · Income exempt u/s 10 (other than 10(38)), 11 or 12 · Depreciation debited to P&L, excluding depreciation on the revaluation of assets · Amount withdrawn from the revaluation reserve, to the extent it does not exceed depreciation on revaluation · Brought forward loss or unabsorbed depreciation, whichever is less, as per books · Profit of a sick industrial company · Others** |
| Book profit u/s 115JB (⚙) / MAT u/s 115JB @ 15% of book profit, plus surcharge and cess / Tax payable (higher of normal provisions and 115JB) | fig/figt | `it_mat_bookprofit/tax/payable` | |
| Less: MAT credit set off u/s 115JAA | dnum → **mat_credit** (:1865) | `it_mat_credit` | repeater "Schedule MATC", unit "years": **Assessment Year \| MAT credit brought forward \| MAT credit set off this year (totalled) \| Balance carried forward**; set-off capped at (normal − MAT) |
| MAT credit carried forward u/s 115JAA | fig | `it_mat_cf` | Σ cf column + current-year excess |
| Filing dates (drives 234A / 234B / 234C / 234F) | drill → **int_dates** (:1870) | | fields: **Due date for filing the return u/s 139(1)** (DUE_DATE, **required**) · **Date of filing the return** (date, **required**) · **Whether the return is filed on or before the due date?** (YN — Discrepancy: stored but ignored; lateness computed from the two dates). Note: *"234A runs at 1% per month from the day after the due date to the date of filing, on the tax unpaid at the due date. 234F is ₹5,000, or ₹1,000 where total income does not exceed ₹5,00,000."* |
| Interest u/s 234A — late filing / Interest u/s 234B — advance tax shortfall | fig | `it_int_234a/b` | |
| Interest u/s 234C — deferment of advance tax | dnum → **int_234c** (:1876) | `it_int_234c` | break-up, cols **Shortfall \| Interest (⚙)**; rows **Up to 15 June — 15% · Up to 15 September — 45% · Up to 15 December — 75% · Up to 15 March — 100%** (3/3/3/1 months @1%). Note: *"Enter the shortfall for each instalment. 15% by 15 June, 45% by 15 September, 75% by 15 December, 100% by 15 March."* |
| Late filing fee u/s 234F / Total interest and fee / Aggregate tax, interest and fee liability | fig/figt | `it_int_234f/total`, `it_tti_aggregate` | |
| Advance tax | dnum → **tp_adv** (:1885) | `it_tp_adv` | CHALLAN repeater "Details of payments": **BSR Code \| Date of deposit \| Challan serial number \| Amount (totalled)** |
| TDS | dnum → **tp_tds** (:1887) | `it_tp_tds` | two repeaters — *"TDS other than salary (Schedule TDS2)"*: **TAN of the deductor \| Name of the deductor \| Gross amount \| Head of income (TDS_HEAD) \| Tax deducted \| TDS credit claimed (totalled)**; *"TDS on which no TAN is available — 26QB / 26QC / 26QD (Schedule TDS3)"*: **PAN / Aadhaar of the deductor \| Name of the deductor \| Gross amount \| Tax deducted \| TDS credit claimed (totalled)** |
| TCS | dnum → **tp_tcs** (:1896) | `it_tp_tcs` | repeater "Schedule TCS": **TAN of the collector \| Name of the collector \| Tax collected \| TCS credit claimed (totalled)** |
| Self-assessment tax | dnum → **tp_sat** (:1886) | `it_tp_sat` | CHALLAN repeater (same shape as advance tax) |
| Total taxes paid / Balance tax payable / Refund due | figt | `it_tp_total`, `it_tti_balance`, `it_tti_refund` | → JSON `TaxPaid`, `BalTaxPayable`, `RefundDue` |

---

## Screen: Validate & Export (`data-scr="val"`, pane at itr6.html:275-281)

Buttons: **"Run validation"** (`btnValidate`) · **"Download JSON"** (`btnExport`, disabled until 0 errors; UI-verified: 19 errors on a blank sheet, export disabled). Summary line "Not run yet." → "{n} error(s), {m} thing(s) to check. …"; each row `Error|Check|Passed` + message + link "go to ITR Info / IT Computation".

`VRULES` (itr6.html:2618-2645) — required fields (all errors): Name of the company (max 75) · PAN (regex `AAAAA0000A`) · Status · Residential Status · Date of Incorporation (DD/MM/YYYY) · Assessee e-Mail ID (email regex) · Assessee Status · Assessee unlisted? · Verifier Name (75) / PAN / Capacity / Place of signing (50) · Section under which filed · Return Type · Liable for audit u/s 44AB? · Startup recognition no. (when dpiit=Yes) · IMB certificate no. (when dpiit+imb=Yes) · MSME registration no. (when msme=Yes) · Tax-audit auditor's name / membership no. / UDIN / date of report (when aud44ab=Yes) · Tax rate option · Turnover > ₹400 crore? (unless 115BA*) · Filing due date · Date of filing.
Structural checks (:2661-2692): ≥1 bank account, IFSC format, one refund tick; ≥1 nature-of-business, sub-sector required; B/S must tally when mtpl=Yes; warns — FA flag Yes with no entries · 115TD Yes with blank FMV · MAT book profit under 115BAA/BAB · VI-A 80G/80-IA/80-IAB/80-IAC under 115BAA/BAB · PBT override drifted from P&L · SI income without tax computed.

**JSON export** (`buildJSON()` :2720-2799): envelope `ITR.ITR6` with `CreationInfo` (SWCreatedBy `SW20000001`) / `Form_ITR6` (AssessmentYear "2026") / `PartA_GEN1` (PersonalInfo + FilingStatus incl. SectionOpted, TurnoverExceeds400Cr, DPIIT, MSME) / `PartA_GEN2` (AuditInfo + NatureOfBusiness[]) / `PARTA_BS` (two totals only) / `CorpScheduleBP` (full ladder) / `ScheduleHP` / `ScheduleCG` / `ScheduleOS` (totals only) / `PartB_TI` / `PartB_TTI` (ComputationOfTaxLiability + MATDetails + TaxPaid + Refund incl. `NetTaxPyblOn115TDInc` + BankAccountDtls + AssetOutsideIndiaFlg) / `Verification`. Download name `{PAN}_ITR6_AY2026-27.json`.

---

## AY DIFF — 2026-27 (itr6.html) vs 2025-26 (itr6-ay2526-backup.html)

The 2025-26 file is **not** a variant of the same form — it is the previous generation of the tool ("design system carried over from the ITR-1 Sahaj UI", `registerSheet`-based, 13,645 lines, **71 registered schedule tabs**, top bar "Assessment Year 2025-26", validate categories A/B/D, `emitJSON()` at :301 with `SWCreatedBy:'SW10001111'`, filename `{PAN}_AY2025-26_ITR6.json`; no `data-scr`, no `SHEET/SPEC`, no `buildJSON` global — its export path is `emitJSON`). The 2026-27 file is a ground-up compact rewrite on the Winman-style sheet+popup design. Consequences:
- **Schedules present in 2025-26 backup but with no 2026-27 counterpart (or only a summary line):** ② APPLICABLE SCHEDULES wizard · PART A GENERAL 139(8A) ITR-U block · PART A-BS Ind AS (Schedule III Division II) + Ind AS Manufacturing/Trading/P&L · PART A-QD Quantitative Details · Schedule DPM / DOA / DEP / DCG depreciation grids (2026-27 keeps only the bp_depit summary + `cg_st50` input) · Schedule 112A and 115AD(1)(b)(iii)-proviso scrip-wise tables · Schedule VDA · Schedule UD · full CYLA+BFLA matrix · Schedule ICDS · donation schedules 80G / 80GGA / RA / 80GGC detail (donee-wise) · 80-IA / 80-IB / 80-IC-80-IE / 80-IAC / 80M / 80LA undertaking-wise schedules (2026-27 keeps single VI-A amounts) · Schedule BBS (115QA buy-back) · Schedule FSI · SUMMARY Return-at-a-glance dashboard.
- **Kept in both (restructured):** General/personal info, nature of business, Manufacturing/Trading/P&L, OI disallowances, OL liquidation account, HP, BP, CG, OS, CFL, SI, IF, EI, PTI, MAT/MATC, TPSA, 115TD, TR, FA, SH, AL, GST, FD, Part B-TI/TTI, IT/TDS-2/TDS-3/TCS, Verification.
- **New/changed in 2026-27:** dual-date CG splits at 23/07/2024 (111A 15→20%, 112 20→12.5%, 112A 10→12.5%) baked into row labels and SI_SEC; 44BBC (cruise shipping) presumptive row; 43B(h) MSME row; FA reference year "calendar year 2025"; DUE_DATE/234x dates moved to 2026; LEI drill; MSME recognition question; Form-2/DPIIT declaration chain.

---

## Discrepancy notes (recorded, not fixed)

1. **Export is a thin projection**: `buildJSON()` emits only headline totals for B/S (2 numbers), HP/CG/OS (1-3 numbers) and omits entirely: Schedule AL details, FA tables, SH-1 shareholders, mgmt/ownership, holding/subsidiary, demerger, regco, PTI rows, GST turnover, FD, TPSA, unincorp (IF), LEI, OL account, Mfg/Trading/P&L line items, HP property rows, CG break-ups, CYLA/BFLA/CFL/EI/VI-A/10AA/SI row detail, TR rows, MAT schedule rows, 234C rows, challan/TDS/TCS row detail, repasse, other audits, bizstart, 115TD detail (except net), td_date, Ind AS flag, dpiit sub-chain beyond reg-no, form2 fields, producer flag. Matches the known "filing-readiness gap" (JSON zeroes/omits schedules).
2. **Ind AS header flag (`indas`) is inert** — toggling it changes nothing rendered or exported.
3. **Unused catalogs**: STATUSES, HOLDKIND, REGULATOR, FPAY_HEAD, REGIMES (sheet uses CO_REGIME — 115BAE is therefore *not* selectable), TDS_HEAD *is* used (tp_tds), CAP_KIND used (unincorp). Unused CSS class `reqmark-unused`.
4. **PTI auto-fill promise not implemented**: pti note says exempt incomes flow to the exempt-income table; `ti_ei` is independent.
5. **unincorp note references an "Income from partnership firm" table of the Computation window that does not exist** in this build.
6. **`int_dates.mat139` ("Whether the return is filed on or before the due date?") is collected but ignored** — 234A/234F lateness is derived from the two date fields.
7. **Schedule SI "Tax thereon" is user-typed** and becomes the entire special-rates tax — the seven CG split rows do not auto-generate SI entries or special-rate tax.
8. **bp_deemed popup contains a `35AC` row** not present in the sheet row's label (u/s 32AC/33AB/33ABA/35ABA/35ABB/40A(3A)/33AC/72A/80HHD/80-IA).
9. **`bs_auth` (Authorised Capital) is excluded from Total Liabilities** (correct for the ITR form, but it is the only entered B/S figure that feeds no total).
10. **CFL "Total" per year is typed, not auto-summed** from the six loss fields.
11. **hp_prop tenant TAN label** reads "PAN / TAN of tenant (if TDS credit claimed)" while the note says TAN u/s 194-I — label/note mismatch.
12. UI walk: all 3 tabs, 13 section heads, 123 subform nodes, dpiit conditional reveal, mgmt master-detail (`+ Add entry` → "Management & Ownership details  ·  entry 1"), 115BAA pink-out of MAT drill (`pointer-events:none`), live GP/PAT/BP/TI flow (₹10,00,000 sale → PAT/BP/TI 10,00,000; rate 22%/30%), 19-error blank validation, buildJSON envelope — all confirmed against source; **no render-vs-model mismatches found beyond the items above**.

## PROOF — re-walk tally

Sheet rows: 360 across 13 parts (sub 39 · note 5 · ctr 5 · drill 31 · dnum 89 · in 100 · txt 3 · date 3 · sel 3 · yn 11 · ovr 6 · fig 27 · figt 38). Drill-in openers 31+89 = **120 = SPEC popup count** — every popup documented above (info 18 · al 10 · td 2 · fa 9 · ol 3 · bs 15 · mfg/tr/pl 14 · oi/bp 13 · hp 1 · cg 7 · os 6 · ti 7 · tti/mat/int/tp 10... grouped per section headings). Editable fields: sheet 126 + clientbar 5 + popup `f` 49 + break-up cells 398 + repeater cols 169 + master-detail fields 250 = **997**; computed sheet cells 65 + popup ⚙ cells (tpsa 6, 234C 4, bs_addl 3, grand bars).
