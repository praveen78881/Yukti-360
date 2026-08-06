# ITR-5 — COMPLETE STRUCTURE MAP

Route(s): `/tax-utilities/itr5.html` (self-contained static tool; loaded in the in-app iframe workspace) · Entry component: `src/app/company/[id]/income-tax/page.tsx:74-78` — `STATUTORY_ITR` maps `partnership → 'itr5'` (:75), `llp → 'itr5'` (:76), `aop_boi → 'itr5'` (:77), `cooperative → 'itr5'` (:78); iframe src resolved at `page.tsx:47` (`/tax-utilities/itr5.html`); rendered by `StatutoryItrView` (`page.tsx:693`) → `ItrYearForms` (`page.tsx:710`, iframe workspace at `page.tsx:249`, dispatch at `page.tsx:740-742`) · AYs covered: **2026-27 only** (no 2025-26 file ships).

**Builder/validator globals** (this tool differs from ITR-1..4 — there is **no `validateItr5`**):
- `buildITR()` — itr5.html:2422 (returns `{ ITR: { ITR5: … } }`, overlaid on `SKEL`, the official-schema skeleton "ITR-5 AY 2026-27, Ver1.0" at itr5.html:2389)
- `exportJSON()` — itr5.html:2631 (wired to `#exportBtn` at :2660; runs `computeAll()` → `preflight()`; on failure lists blockers, on success offers `{PAN}_2026_ITR5.json` download + preview)
- `preflight()` — itr5.html:2610 (13 hard checks; replaces a validateItrN)
- `computeAll()` — itr5.html:2259; tax engine constants at :1898-1924 (flat 30% firm rate, 12% surcharge > ₹1 crore with marginal relief, 4% cess)
- Popup registry `const P` — itr5.html:944-1342 (97 popups; kinds: `fields`, `br`, `brfree`, `repeat`, `multirepeat`, `md`, `netturn`, `tpsa`, `partpl`, `s40b`, `cg`, `dep`, `icds`, `p44ad`, `p44ada`, `amt`, `taxspecial`, `i234`); popup DOM generated at :1400-1668.

Panes use `data-pane` tabs (itr5.html:162-167): `p-info` "ITR Info", `p-bs` "ITR B/S", `p-pl` "ITR P&L", `p-comp` "Computation".

**UI-walk**: verified via Playwright (msedge channel) against `http://localhost:7777/tax-utilities/itr5.html` — 4 tabs switch; 98 drill triggers resolve to 97 popups (`sf-c-amt` is shared by two rows); 12 level-2 `-detail` popups open from md summary "Edit ✎"; conditionals fire as documented; live totals confirmed (44AD ₹10L digital + ₹5L cash → profit 1,00,000; tax @30% 30,000; cess 1,200; 40(b) slab-1 floor 3,00,000); export pre-flight blocks with the documented messages when identity is blank.

**Value-cell conventions**: yellow bordered `input.iv` = manual entry; blue `.cv` = ⚙ computed (read-only); `.st` chip = "Not entered" → "Entered"/"N units" status; `.yn-tabs` = Yes/No toggle; right column `.schtag` = schedule tag (Schedule / FA / PTI / GST / TPSA / SH-1 / B/S / P&L / HP / BP / CG / OS / EI / DPM / CFL / VIA / AMT / FSI/TR / TDS / IT). Every popup header has button "✓ Done"; Escape closes the topmost popup. Numeric inputs are free-text, comma-tolerant (`N()` strips commas); no field is HTML-`required` — the only hard gate is `preflight()` at export.

---

## Screen: Global chrome (top bar · client bar · rail) (source: itr5.html:153-181, 865-876)

### Particular: Top bar
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds |
|---|---|---|---|---|---|---|---|---|---|---|
| "Winman — ITR-5 data entry" | static title | — | — | — | — | — | — | — | — | — |
| (subline) | static text | — | — | — | "ITR Information" | — | — | changes to active tab label on tab click (itr5.html:1800) | `#subline` | — |
| "Partnership Firm" | pill (static) | — | — | — | — | — | — | — | — | — |
| "A.Y. 2026-2027" | pill (static) | — | — | — | — | — | — | — | — | — |
| "Go to next →" | button | — | — | — | — | — | — | — | `#nextBtn` (:1803) | cycles the 4 tabs |
| "Export JSON" | button (green) | — | — | — | — | — | — | — | `#exportBtn` (:2660) | `exportJSON()` → pre-flight → `sf-export` popup |

### Particular: Client bar (always visible above panes)
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds |
|---|---|---|---|---|---|---|---|---|---|---|
| Name | text | — | — | — | blank | Yes (preflight) | non-blank | — | `cl_name` → `S.cl.name` | JSON `OrgFirmInfo.AssesseeName.SurNameOrOrgName`; rail "Assessee" chip |
| PAN | text | — | — | — | blank | Yes (preflight) | `^[A-Z]{5}[0-9]{4}[A-Z]$` | — | `cl_pan` → `S.cl.pan` | JSON `OrgFirmInfo.PAN`; export filename `{PAN}_2026_ITR5.json` |
| Status | select | Firm · AOP · BOI · LLP · Local Authority · Co-operative Society · Primary Agricultural Credit Society · Artificial Juridical Person | — | — | Firm | — | — | — | `cl_status` → `S.cl.status` | JSON `StatusOrCompanyType` via `STATUS_CODE` (:2408 — Firm→"1", LLP→"14", AOP/BOI→"2", rest→"9"); rail right chip "{Status} · A.Y. 2026-27" |
| Residential Status | select | Resident · Non-Resident | — | — | Resident | — | — | — | `cl_res` → `S.cl.res` | JSON `FilingStatus.ResidentialStatus` ("RES"/"NRI") |
| Date of formation | text | — | DD/MM/YYYY | — | blank | Yes (preflight) | DD/MM/YYYY | — | `cl_dof` → `S.cl.dof` | JSON `DateOFFormOrIncorp` (ISO) |

### Particular: Rail (sticky footer, itr5.html:865-876)
Chips (verbatim labels): "Assessee —" (`r_assessee`), "Bank a/cs 0" (`r_bank`), "Partners 0" (`r_partners`), "Total Liabilities" (`r_lia_l`/`r_lia`), "Total Assets" (`r_ass_l`/`r_ass`), "Diff" (`r_diff` — green when 0, red otherwise), "PAT" (`r_pat`), "Total Income" (`r_ti`), "Balance tax" (`r_bal` — red if payable, green parenthesised if refund), right chip `r_regime` "Firm · A.Y. 2026-27" (status-driven).
Conditional: when "Books not maintained" is ticked the labels flip to "Creditors" and "Debtors + Stock + Cash", Diff shows "n/a", PAT shows Profit-particulars net (itr5.html:2357-2364).
Discrepancy note: the top-bar pill stays "Partnership Firm" even after the Status select is changed (only the rail chip updates).

---

## Screen: ITR Info (`data-pane="p-info"`, itr5.html:186-377)

Sheet note (verbatim): "(For firm, AOP, BOI, LLP, Local Authority, Co-operative Society, PDT and Artificial Juridical Person)"

Group head: **"ITR Information"** [tag "Schedule"] — collapsible (− / + toggle on click, itr5.html:1792-1793).

### Sub-head "Basic info."

### Particular: "Assessee info."   [click ⋯ → opens: sf-assessee]
Status chip `st_assessee` "Not entered" → "Entered" when any of email/landline/district/oldname/secmobile/secemail filled (:2286).
#### Drill-in: Assessee info. (kind `fields`, obj `assessee`; source: itr5.html:947-951)
Note (verbatim): "^Auto-filled from 'Permanent Info' table. To change the settings, go to 'Tools' menu -> Settings -> ITR/e-filing -> Auto-fill Secondary Address & Contact details from 'Permanent Info'."
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds |
|---|---|---|---|---|---|---|---|---|---|---|
| STD code | text | — | — | — | blank | No | — | — | `S.assessee.std` | — |
| Landline No. | text | — | — | — | blank | No | — | — | `S.assessee.landline` | status chip |
| Country code (for Assessee's Mobile No.) | text | — | — | — | "91" (seeded, :914) | No | — | — | `S.assessee.ccode` | JSON `Address.CountryCodeMobile` |
| e-Mail ID (Assessee) | text | — | — | — | blank | Yes (preflight: must contain "@") | contains "@" | — | `S.assessee.email` | JSON `Address.EmailAddress` |
| District | text | — | — | — | blank | Yes (preflight "District / City") | non-blank | — | `S.assessee.district` | JSON `Address.CityOrTownOrDistrict`, `CreationInfo.IntermediaryCity` |
| Secondary address same as primary address? | select | (blank) · Yes · No | — | — | "Yes" (seeded, :914) | No | — | — | `S.assessee.secaddr` | — |
| *(group "Secondary Contact details^")* Mobile No. | text | — | — | — | blank | Yes (preflight: ≥10 digits) | digits ≥ 10 | — | `S.assessee.secmobile` | JSON `Address.MobileNo` |
| *(group "Secondary Contact details^")* e-Mail ID | text | — | — | — | blank | No | — | — | `S.assessee.secemail` | status chip |
| Liable to maintain accounts as per Sec.44AA? | select | (blank) · Yes · No | — | — | blank | No | — | — | `S.assessee.s44aa` | JSON `PartA_GEN2.LiableSec44AAflg` |
| Old name (in case of change) | text (wide) | — | — | — | blank | No | — | — | `S.assessee.oldname` | status chip |
Discrepancy note: `preflight()` (:2619-2621) also demands "Address: Area / Locality is blank — Assessee info." (`a.area`) and "Address: Flat / Door No. is blank — Assessee info." (`a.flat`/`a.residence`) — **no UI field anywhere binds `area`, `flat` or `residence`**, so export can never pass pre-flight through the UI (buildITR would default them to "NA", but preflight blocks first). UI-walk confirmed both messages appear in the export blocker list.

### Particular: "Verifier info."   [click ⋯ → opens: sf-verifier]
Status chip `st_verifier` "Entered" when name or pan filled.
#### Drill-in: Verifier info. (kind `fields`, obj `verifier`; source: itr5.html:953-955)
Note (verbatim): "Details of 'Verifier' entered here, should match with the 'Key Person Details' under 'My Profile' of Income tax website."
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds |
|---|---|---|---|---|---|---|---|---|---|---|
| Name | text (wide) | — | — | — | blank | Yes (preflight) | non-blank | — | `S.verifier.name` | JSON `Verification.Declaration.AssesseeVerName` |
| PAN | text | — | — | — | blank | Yes (preflight) | `^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$` — "Verifier PAN must be an individual PAN (4th character 'P')" | — | `S.verifier.pan` | `AssesseeVerPAN` |
| Capacity | select | (blank) · Partner · Managing Partner · Designated Partner · Member · Principal Officer · Karta · Authorised Signatory · Trustee · CEO · Other | — | — | blank | No | — | — | `S.verifier.cap` | `Capacity` via `CAP_CODE` (:2414 — PA/MP/DP/ME/PO; Karta/Authorised Signatory/Trustee/Other→"PA", CEO→"PO") |
| Father's name | text (wide) | — | — | — | blank | Yes (preflight) | non-blank | — | `S.verifier.fname` | `FatherName` |
| Place of signing | text | — | — | — | blank | Yes (preflight) | non-blank | — | `S.verifier.place` | `Place` |

### Particular: "Bank Accounts"   [click ⋯ → opens: sf-bank]
#### Drill-in: Bank Accounts (kind `repeat`; source: itr5.html:957-959)
Note (verbatim): "If multiple accounts are ticked, refund will be credited to one of the validated account. For the procedure to validate the account in IT e-filing portal, press 'F1' key."
Grids: section "Bank Accounts (All)" — headers (verbatim): Bank Name | Account Number | IFS Code | Type of Account | For refund? — Type of Account options: (blank) · Savings · Current · Cash Credit · Overdraft · Other; "For refund?" is a checkbox. Add-button: "+ Add row"; per-row remove "✕". No totals bar.
Feeds: rows with both IFSC and Account Number → JSON `PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails` (AccountType map SB/CA/CC/OD, Other→CA; `UseForRefund` "true"/"false"; `BankDtlsFlag` Y/N) (:2584-2595); rail "Bank a/cs" count; status `st_bank` "N accounts".

### Particular: "Partners/Members details"   [click ⋯ → opens: sf-partners]
#### Drill-in: Partners/Members details (kind `md` master-detail; source: itr5.html:961-965; detail popup `sf-partners-detail`)
Note (verbatim): "^ Enter only if changes exist during the Previous Year. In case of new firm, 'Date of Formation' need not be entered in 'Admitted on' column."
Grids: summary — headers: Name | % of share | PAN + per-row "Edit ✎" and "✕"; add-button "+ Add entry". Detail popup (level-2) fields:
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds |
|---|---|---|---|---|---|---|---|---|---|---|
| Name | text (wide) | — | — | — | blank | No | — | — | row `.name` | summary col |
| Remuneration in Rs. | amount | — | — | — | blank | No | — | — | row `.remun` | — |
| % of share (if determinate) | amount | — | — | — | blank | No | — | — | row `.pct` | summary col |
| Admitted on ^ | date | — | DD/MM/YYYY | — | blank | No | — | — | row `.admitted` | — |
| Retired on ^ | date | — | DD/MM/YYYY | — | blank | No | — | — | row `.retired` | — |
| Interest rate on capital | amount | — | — | — | blank | No | — | — | row `.rate` | — |
| PAN | text | — | — | — | blank | No | — | — | row `.pan` | summary col |
| Aadhaar No. | text | — | — | — | blank | No | — | — | row `.aadhaar` | — |
| *(group "Address")* Address | text (wide) | — | — | — | blank | No | — | — | row `.addr` | — |
| City | text | — | — | — | blank | No | — | — | row `.city` | — |
| State | text | — | — | — | blank | No | — | — | row `.state` | — |
| PIN / ZIP code | text | — | — | — | blank | No | — | — | row `.pin` | — |
| Country | select | COUNTRIES (29: (blank) · Australia · Bangladesh · Canada · China · France · Germany · Hong Kong · Indonesia · Ireland · Japan · Kuwait · Malaysia · Mauritius · Nepal · Netherlands · Oman · Qatar · Russia · Saudi Arabia · Singapore · South Africa · Sri Lanka · Switzerland · Thailand · United Arab Emirates · United Kingdom · United States of America · Other) | — | — | blank | No | — | — | row `.country` | — |
| Status | select | (blank) · Individual · HUF · Firm · Company · AOP/BOI · LLP · Trust · Local Authority · Artificial Juridical Person | — | — | blank | No | — | — | row `.status` | — |
Feeds: rail "Partners" count; status `st_partners` "N partners". Discrepancy note: partner rows are **not emitted into the export JSON** (no mapping in `buildITR`).

### Particular: "Whether recognised as Startup by DPIIT?"
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds |
|---|---|---|---|---|---|---|---|---|---|---|
| Whether recognised as Startup by DPIIT? | Y/N toggle | Yes · No | — | — | unset | No | — | — | `S.flags.dpiit` | JSON `FilingStatus.StartUpDPIITFlag` |

### Particular: "Recognised as MSME as per MSMED Act, 2006?"
| Recognised as MSME as per MSMED Act, 2006? | Y/N toggle | Yes · No | — | — | unset | No | — | — | `S.flags.msme` | JSON `FilingStatus.ifMSME` |
|---|---|---|---|---|---|---|---|---|---|---|

### Sub-head "ITR filing info."

### Particular: "Section under which return is filed"
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds |
|---|---|---|---|---|---|---|---|---|---|---|
| Section under which return is filed | select (with "?" badge) | (blank) · 139(1) · 139(4) · 139(5) · 139(8A) · 139(9) · 142(1) · 148 · 153A · 153C · 119(2)(b) | — | — | blank | Yes (preflight: "Section under which the return is filed is not selected — ITR filing info.") | non-blank | — | `if_sec` → `S.itf.sec` | JSON `ReturnFileSec.IncomeTaxSec` via `SEC_CODE` (:2420 — 139(1)→11, 139(4)→12, 139(5)→13, 142(1)→14, 148→16) |
Discrepancy note: 139(8A), 139(9), 153A, 153C and 119(2)(b) have no `SEC_CODE` entry — selecting them silently emits code 11 (the 139(1) code).

### Particular: "Return Type"
| Return Type | select | (blank) · Original · Revised · Updated · Defective | — | — | blank | No | — | — | `if_rtype` → `S.itf.rtype` | — |
|---|---|---|---|---|---|---|---|---|---|---|
Discrepancy note: Return Type is captured but never emitted into the JSON.

### Particular: "Representative Assessee, if any"   [click ⋯ → opens: sf-rep]
#### Drill-in: Representative Assessee, if any (kind `fields`, obj `rep`; source: itr5.html:968-969)
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds |
|---|---|---|---|---|---|---|---|---|---|---|
| Name | text (wide) | — | — | — | blank | No | — | — | `S.rep.name` | JSON `FilingStatus.AsseseeRepFlg` ("Y" when non-blank); status `st_rep` |
| e-Mail ID | text | — | — | — | blank | No | — | — | `S.rep.email` | status chip |
| Contact No. | text | — | — | — | blank | No | — | — | `S.rep.contact` | status chip |
| Country code (for Contact No.) | text | — | — | — | "91" (seeded, :914) | No | — | — | `S.rep.ccode` | — |

### Sub-head "Income related info."

### Particular: "Pass Through Income u/s 115U/ 115UA/ 115UB"   [click ⋯ → opens: sf-pti] · sheet ⚙ cell `it_pti` · tag PTI
#### Drill-in: Pass Through Income u/s 115U/ 115UA/ 115UB (kind `repeat`; source: itr5.html:972-976)
Note (verbatim): "Exempt incomes disclosed in this table will be auto-filled in 'Incomes fully exempt' table of Computation window."
Grids: section "Pass Through Income from Venture Capital u/s 115U, Business Trust u/s 115UA and Investment Fund u/s 115UB" — headers: Name of Trust / Fund | Income | TDS | PAN | Head of income | Investment Entity. "Head of income" options: (blank) · House Property · Business or Profession · Capital Gains · Other Sources · Income claimed exempt. "Investment Entity" options: (blank) · Venture Capital Company / Fund u/s 115U · Business Trust u/s 115UA · Investment Fund u/s 115UB. Add: "+ Add row". Totals: gbar "Total" = Σ Income → sheet `it_pti`.
Discrepancy note: the promised auto-fill into "Incomes fully exempt" does **not** exist in code — `sf-c-ei` rows are entirely manual. PTI rows are not emitted in the JSON.

### Sub-head "Audit related details"

### Particular: "Liable for audit u/s 44AB?"
| Liable for audit u/s 44AB? | checkbox (with "?" badge) | — | — | — | unticked | No | — | — | `S.flags.aud44ab` | JSON `PartA_GEN2.LiableSec44ABflg`; `ItrFilingDueDate` = 2026-10-31 if ticked else 2026-07-31 (:2470) |
|---|---|---|---|---|---|---|---|---|---|---|

### Particular: "Other Audits (excluding u/s 44AB of Income Tax Act)"   [click ⋯ → opens: sf-otheraudit]
#### Drill-in: Other Audits (kind `multirepeat`, 2 tables; source: itr5.html:979-985)
Grids: table 1 "Audits under Income Tax Act" — headers: Section | Date of furnishing Report | Acknowledgement number | Whether furnished? — Section options: (blank) · 10AA · 115JC · 44DA · 50B · 80-IA · 80-IAB · 80-IB · 80-IE · 80JJAA · 80LA · 92E; Whether furnished?: (blank) · Yes · No. Table 2 "Audits under other Acts" — headers: Act | Date of furnishing Report | Section | Whether furnished? — Act options: (blank) · Banking Regulation Act, 1949 · Central Excise Act, 1944 · Central GST Act, 2017 · Central Sales Tax Act, 1956 · Charitable and Religious Trusts Act, 1920 · Electricity Act, 2003 · Employees Provident Fund and Miscellaneous Provisions Act, 1952 · Foreign Exchange Management Act, 1999 · Government Superannuation Fund Act, 1956 · Indian Trusts Act, 1882 · Integrated GST Act, 2017 · Other: · Payment of Gratuity Act, 1972 · SEBI Act, 1992 · Securities Contract (Regulation) Act, 1956 · State GST Act, 2017 · Union Territories GST Act, 2017. Each table has its own "+ Add row". Status `st_otheraudit` "N audits". Not in JSON.

### Sub-head "Business related info."

### Particular: "Nature of Business / Profession"   [click ⋯ → opens: sf-nob]
#### Drill-in: Nature of Business / Profession (kind `multirepeat`, 4 tables; source: itr5.html:988-994)
Grids: 4 identical tables — sections (verbatim): "Taxable u/s 44AD", "Taxable u/s 44ADA", "Taxable u/s 44AE", "Other than Taxable u/s 44AD, 44ADA, 44AE" — headers: Sector | Sub-sector | Code | Trade name | Description, if any. Sector options (22): (blank) · Agriculture, Animal Husbandry, Forestry · Computer Related Services · Construction · Culture & Sport · Education Services · Electricity, Gas & Water · Extra Territorial Organisations/Bodies · Financial Services · Fish Farming · Health Care · Hotels, Restaurants, Hospitality · Manufacturing · Mining & Quarrying · Other Services · Post & Telecom · Profession · R&D · Real Estate & Renting · Renting of Machinery · Social & Community Work · Transport & Logistics · Wholesale / Retail Trade. "+ Add row" per table. Status `st_nob` "N activities". Not in JSON.

### Particular: "Turnover/Gross Receipts reported in GSTR"   [click ⋯ → opens: sf-gst] · sheet ⚙ cell `it_gst` · tag GST
#### Drill-in: Turnover/Gross Receipts reported in GSTR (kind `repeat`; source: itr5.html:996-998)
Grids: headers: GSTIN | Outward supplies as per GST return. Add: "+ Add row". Totals: gbar "Total" = Σ turnover → sheet `it_gst`. Not in JSON.

### Particular: "Business or Profession start date"
| Business or Profession start date | text (with "?" badge) | — | DD/MM/YYYY | — | blank | No | — | — | `if_startdate` → `S.itf.startdate` | — (not in JSON) |
|---|---|---|---|---|---|---|---|---|---|---|

### Particular: "Tax paid u/s 92CE"   [click ⋯ → opens: sf-92ce] · sheet ⚙ cell `it_92ce` · tag TPSA
#### Drill-in: Tax paid u/s 92CE (kind `tpsa`; source: itr5.html:1000, DOM :1463-1479, compute :2277-2281)
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds |
|---|---|---|---|---|---|---|---|---|---|---|
| Amount on which option u/s 92CE(2A) is exercised | amount | — | — | — | blank | No | — | — | `S.br["sf-92ce"].amount` | drives all ⚙ below; JSON `LiableSec92Eflg` = "Y" when > 0 |
| Additional Income tax @ 18% | ⚙ `ce_addl` | — | — | — | 0 | — | = amount × 18% | — | — | Total (A) |
| Surcharge @ 12% | ⚙ `ce_sur` | — | — | — | 0 | — | = addl × 12% | — | — | Total (A) |
| Cess @ 4% | ⚙ `ce_cess` | — | — | — | 0 | — | = (addl+sur) × 4% | — | — | Total (A) |
| Total Tax payable (A) | ⚙ `ce_a` | — | — | — | 0 | — | addl+sur+cess | — | — | Net |
| Tax paid (B) | ⚙ `ce_b` | — | — | — | 0 | — | = Σ deposit-row Amount | — | — | sheet `it_92ce` (shows B) |
| Net Tax payable (A - B) | ⚙ `ce_net` | — | — | — | 0 | — | A − B | — | — | — |
Grids: section "Details of tax deposit:" — headers: Name of the Bank & Branch | BSR Code | Date of deposit | Challan no. | Amount. Add: "+ Add row".

### Sub-head "Other info."

### Particular: "Partner in any other Firm during the PY?"
| Partner in any other Firm during the PY? | Y/N toggle | Yes · No | — | — | unset | No | — | Y reveals row "Details of other Firms" (`#row-othfirm-drill`, :1859; UI-verified none→flex) | `S.flags.othfirm` | JSON `FilingStatus.PartnerInFirmFlg` |
|---|---|---|---|---|---|---|---|---|---|---|

### Particular: "Details of other Firms" (conditional, indented)   [click ⋯ → opens: sf-othfirm]
Visible only when the toggle above = Yes.
#### Drill-in: Partner in other Firms (kind `repeat`; source: itr5.html:1003-1004)
Grids: section "Details of other Firms" — headers: Name of the Firm | PAN | % of share. "+ Add row". Status `st_othfirm` "N firms". Not in JSON.

### Particular: "Held Unlisted Shares in the PY?"
| Held Unlisted Shares in the PY? | Y/N toggle | Yes · No | — | — | unset | No | — | Y reveals row "Unlisted Equity Shares" (`#row-unlisted`, :1858; UI-verified) | `S.flags.unl` | JSON `HeldUnlistedEqShrPrYrFlg` |
|---|---|---|---|---|---|---|---|---|---|---|

### Particular: "Unlisted Equity Shares" (conditional, indented) · tag SH-1   [click ⋯ → opens: sf-unlisted]
#### Drill-in: Unlisted Equity Shares (kind `md`; source: itr5.html:1006-1012; detail popup `sf-unlisted-detail`)
Grids: summary — headers: Name of Company | PAN | Closing shares + "Edit ✎"/"✕"; add "+ Add entry". Detail groups/fields (all default blank, optional, no validation):
- "Company": Name of Company (text wide) · PAN (text)
- "Opening balance": No. of shares (amount) · Cost of acquisition (amount)
- "Shares acquired during the year": No. of shares (amount) · Date of subscription / purchase (date DD/MM/YYYY) · Face value per share (amount) · Issue price per share (amount) · Purchase price per share (amount)
- "Shares transferred during the year": No. of shares (amount) · Sale consideration (amount)
- "Closing balance": No. of shares (amount) · Cost of acquisition (amount)
Status `st_unlisted` "N companies". Not in JSON.

### Particular: "Legal Entity Identifier (LEI) details (if refund = > Rs. 50 Cr)"   [click ⋯ → opens: sf-lei]
#### Drill-in: Legal Entity Identifier (LEI) details (kind `fields`, obj `lei`; source: itr5.html:1014-1016)
Note (verbatim): "Applicable where the refund claimed is Rs. 50 Crore or more."
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds |
|---|---|---|---|---|---|---|---|---|---|---|
| LEI number (20 characters) | text (wide) | — | — | — | blank | No | — | — | `S.lei.lei` | status `st_lei` |
| Valid up to | date | — | DD/MM/YYYY | — | blank | No | — | — | `S.lei.valid` | — (not in JSON) |

---

Group head: **"Foreign Assets & Incomes"** [tag FA] (itr5.html:295-339)

### Particular: "Having Foreign assets and Income or Signing authority in Foreign a/c?^"
| (label above) | checkbox | — | — | footnotes below | unticked | No | — | Master gate: when unticked the 9 FA rows are inert — status chips turn pink `.na`, drill "⋯" gets `pointer-events:none` + opacity .35; ticking enables them (:1885-1891, UI-verified) | `S.flags.fa` | JSON `FilingStatus.ForeignExchangeFlag` |
|---|---|---|---|---|---|---|---|---|---|---|
Footnotes (verbatim): "^Enter all items held (including any beneficial interest) at any time during the calendar year 2025." · "Note: If the ZIP code is not available, enter 'XXXXXX'."
Discrepancy note: none of the nine FA detail tables below is emitted into the JSON — only the flag is.

All nine FA particulars are kind `md` (summary grid + "+ Add entry" + level-2 detail popup + "Edit ✎"/"✕"; status chip "N entries/accounts/…"). Shared option lists: COUNTRIES (29, listed under Partners above); "Income offered in this return" group (where present) is always: Taxable Income (amount) · Schedule of ITR (select: (blank) · Schedule BP · Schedule HP · Schedule CG · Schedule OS · Schedule EI) · Item No. of sch. (text).

### Particular: "Foreign Depository / Custodial accounts"   [click ⋯ → opens: sf-fa_dep]
#### Drill-in: Foreign Depository / Custodial accounts (source: itr5.html:1019-1022)
Summary headers: Country Name | Institution | Peak Balance. Detail groups:
- "Institution details": Country Name (sel COUNTRIES) · Country code (text) · Name (wide) · Address (wide) · Zip code (text)
- "Account": Account Type (sel: (blank) · Depository · Custodial) · Account Number (text) · Ownership (sel: (blank) · Owner · Beneficial owner · Beneficiary) · A/c opening date (date) · Peak Balance during the year (Rs.) (amount) · Closing balance (Rs.) (amount) · Gross Income received (amount) · Nature of Income (text)

### Particular: "Investments in Foreign Equity / Debts"   [click ⋯ → opens: sf-fa_eq]
#### Drill-in: Investments in Foreign Equity / Debts (source: itr5.html:1024-1027)
Summary: Country Name | Entity | Peak value. Groups:
- "Details of Entity": Country Name · Country code · Name (wide) · Address (wide) · Zip code · Nature (text)
- "Value of Investment (Rs.)": Date of acquiring interest (date) · Initial value · Peak value · Closing value · Gross Income received · Proceeds from Sale/Redemption (all amounts)

### Particular: "Surrender value of Foreign Insurance / Annuity Contract"   [click ⋯ → opens: sf-fa_ins]
#### Drill-in: Surrender value of Foreign Insurance / Annuity Contract (source: itr5.html:1029-1032)
Summary: Country Name | Institution | Surrender value. Groups:
- "Institution details": Country Name · Country code · Name (wide) · Address (wide) · Zip code
- "Contract": Date of contract (date) · Surrender value of contract (amount) · Gross Income received (amount)

### Particular: "Financial Interest in any Entity"   [click ⋯ → opens: sf-fa_fin]
#### Drill-in: Financial Interest in any Entity (source: itr5.html:1034-1038)
Summary: Country Name | Name of the Entity | Total Investment. Groups:
- "Entity": Country Name · ZIP code · Nature of Entity (text) · Name of the Entity (wide) · Address of the Entity (wide) · Ownership (sel: (blank) · Direct · Beneficial owner · Beneficiary)
- "Investment & income": Date since held (date) · Total Investment (Rs.) (amount) · Income accrued (amount) · Nature of Income (text)
- "Income offered in this return" (standard trio)

### Particular: "Immovable Property"   [click ⋯ → opens: sf-fa_imm]
#### Drill-in: Immovable Property (source: itr5.html:1040-1044)
Summary: Country Name | Property address | Total Investment. Groups:
- "Property": Country Name · ZIP code · Property address (wide) · Ownership (Direct/Beneficial owner/Beneficiary) · Acquisition date (date)
- "Investment & income": Total Investment (Rs.) · Income · Nature of Income
- "Income offered in this return" (standard trio)

### Particular: "Other Capital Assets"   [click ⋯ → opens: sf-fa_oca]
#### Drill-in: Other Capital Assets (source: itr5.html:1046-1050)
Summary: Country Name | Nature of asset | Total Investment. Groups:
- "Asset": Country Name · ZIP code · Nature of asset (wide) · Ownership · Acquisition date
- "Investment & income": Total Investment (Rs.) · Income · Nature of Income
- "Income offered in this return" (standard trio)

### Particular: "Account in which Assessee is signing authority (not included above)"   [click ⋯ → opens: sf-fa_sig]
#### Drill-in: Account in which Assessee is signing authority (source: itr5.html:1052-1056)
Summary: Name | Account Number | Peak Balance. Groups:
- "Institution details": Name (wide) · Address (wide) · Country Name · Zip code
- "Account": Account holder name (wide) · Account Number · Peak Balance (Rs.) (amount) · Income accrued (If liable to tax) (amount)
- "Income offered in this return" (standard trio)

### Particular: "Trusts in which Assessee is a Trustee / Beneficiary / Settlor"   [click ⋯ → opens: sf-fa_trusts]
#### Drill-in: Trusts in which Assessee is a Trustee / Beneficiary / Settlor (source: itr5.html:1058-1065)
Summary: Country Name | Trust | Position. Groups:
- "Trust": Country Name · ZIP code · Name (wide) · Address (wide)
- "Trustees": Name (wide) · Address (wide)
- "Settlor": Name (wide) · Address (wide)
- "Beneficiaries": Name (wide) · Address (wide)
- "Position & income": Position (sel: (blank) · Trustee · Beneficiary · Settlor) · Position held since (date) · Income derived (If liable to tax) (amount)
- "Income offered in this return" (standard trio)

### Particular: "Other income not included above or in sch. BP of ITR"   [click ⋯ → opens: sf-fa_oth]
#### Drill-in: Other income not included above (source: itr5.html:1067-1071)
Summary: Country Name | Person from whom derived | Income derived. Groups:
- "Person from whom income is derived": Country Name · ZIP code · Name (wide) · Address (wide)
- "Income": Income derived (amount) · Nature of Income (text)
- "Income offered in this return" (standard trio)

---

Group head: **"Books not maintained cases"** (itr5.html:342-376)

### Particular: "Having Books not maintained cases of Business/profession?"
| (label above) | checkbox | — | — | — | unticked | No | — | **Master switch** (:1861-1884, UI-verified): ticked → shows the minimum "Financial particulars" block (`#bnm-on`), hides the "Books are maintained…" row, force-clears + disables the `bsen`/`mtpen` head checkboxes, greys and disables the "ITR B/S" and "ITR P&L" tabs (opacity .4, pointer-events none), and bounces the user to the first tab if stranded; unticked reverses everything | `S.flags.bnm` | switches `C.pbt` source; JSON emits `PARTA_BS.NoBooksOfAccBS` only when ticked (:2481-2493) |
|---|---|---|---|---|---|---|---|---|---|---|

### Particular: Sub-head "Financial particulars of the Business / Profession" [tag B/S] (visible when bnm ticked)
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds |
|---|---|---|---|---|---|---|---|---|---|---|
| Sundry creditors | amount | — | — | — | blank | No | — | bnm=ticked | `S.fp.fp_sc` | JSON `NoBooksOfAccBS.TotSundryCrdAmt`; rail "Creditors" |
| Stock- in-trade | amount | — | — | — | blank | No | — | bnm=ticked | `S.fp.fp_sit` | `TotStkInTradAmt`; rail |
| Sundry debtors | amount | — | — | — | blank | No | — | bnm=ticked | `S.fp.fp_sd` | `TotSundryDbtAmt`; rail |
| Cash balance | amount | — | — | — | blank | No | — | bnm=ticked | `S.fp.fp_cash` | `CashBalAmt`; rail |

### Particular: "Profit particulars" [tag P&L]
| Profit particulars | checkbox | — | — | — | unticked | No | — | ticked reveals the 4 rows below (`#row-pp1..4`, :1892; UI-verified) | `S.flags.ppart` | — |
|---|---|---|---|---|---|---|---|---|---|---|
| Gross receipts | amount | — | — | — | blank | No | — | ppart | `S.fp.pp_gr` | — (informational; **not** used in Net profit calc — discrepancy note) |
| Gross profit | amount | — | — | — | blank | No | — | ppart | `S.fp.pp_gp` | Net profit; when bnm: `C.pbt` |
| Expenses | amount | — | — | — | blank | No | — | ppart | `S.fp.pp_exp` | Net profit; when bnm: `C.pbt` |
| Net profit | ⚙ `it_pp_np` | — | — | — | 0 | — | = Gross profit − Expenses (:2299) | ppart | — | when bnm: becomes computation "Net Profit before tax" (`C.pbt`, :2349); rail PAT |

### Particular: "Books are maintained — full Balance Sheet and Manufacturing/Trading/P&L A/c apply." (static info row, visible when bnm unticked)

---

## Screen: ITR B/S (`data-pane="p-bs"`, itr5.html:380-495)

Head "ITR B/S" with enable checkbox (`data-fld="bsen"`, default checked; auto-cleared and disabled while "Books not maintained" is ticked). Unchecking collapses the group (`#g-bs.closed`, :1894).
All rows are amount inputs (`data-b` keys) unless marked ⚙. None is required; no validation; all default blank; all feed `it_totlia`/`it_totass` (:2302-2318) and the rail. Discrepancy note: **none of the full-B/S figures is overlaid onto the JSON `PARTA_BS` skeleton** — the schema block ships with its zero defaults; only `NoBooksOfAccBS` (books-not-maintained path) is populated.

### Particular: center head "Liabilities"
| Label | Binds | Drill-in |
|---|---|---|
| Partners' / Members' capital | `l_cap` | — |
| *(sub "Reserve and surplus")* General Reserve | `l_genres` | — |
| Other Reserves | ⚙ `it_l_othres` | [click ⋯ → opens: sf-othres] |
| Profit & Loss A/c (Cr) | `l_placr` | — |
| *(sub "Secured loans")* Rupee Loans - Banks | `l_sec_rup` | — |
| Foreign Currency Loans | `l_sec_fc` | — |
| Others | `l_sec_oth` | — |
| *(sub "Unsecured loans (including deposits)")* Rupee Loans - Banks | `l_uns_rup` | — |
| Foreign Currency Loans | `l_uns_fc` | — |
| Others^^ | `l_uns_oth` | — |
| Deferred tax liability | `l_dtl` | — |
| Advances^^ | `l_adv` | — |
| *(sub "Current liabilities")* Trade Creditors | `l_cl_tc` (input; overwritten by breakup total) | [click ⋯ → opens: sf-tradecr] |
| Other current liabilities | ⚙ `it_l_cl_ocl` | [click ⋯ → opens: sf-othcl] |
| Provision for Income-tax | `l_cl_pit` | — |
| Other Provisions | `l_cl_oprov` (input; overwritten by breakup total) | [click ⋯ → opens: sf-othprov] |
| **Total Liabilities** | ⚙ `it_totlia` | — |

#### Drill-in: Other Reserves (kind `br`; source: itr5.html:1074-1075)
Fixed-label amount table (headers: (blank) | Amount) — rows (verbatim, bind key): Revaluation Reserve `reval` · Capital Reserve `cap` · Statutory Reserve `stat` · Other Reserves `oth`. gbar "Total" → sheet ⚙ `it_l_othres`.
#### Drill-in: Trade Creditors (kind `br`, `tgt` writes INTO sheet input `l_cl_tc`; source: itr5.html:1077-1078)
Rows: Trade Creditors - MSME `msme` · Others `oth`. gbar "Total"; on recompute the total is pushed into the sheet's Trade Creditors input (only when non-zero — a breakup reduced back to zero does not clear the sheet figure; :2268-2274).
#### Drill-in: Other current liabilities (kind `br`; source: itr5.html:1080-1081)
Rows: Leased Assets Liabilities `leased` · Interest accrued but not due on borrowings `intnotdue` · Interest accrued and due on borrowings `intdue` · Income received in advance `adv` · Other payables `payables`. Total → `it_l_cl_ocl`.
#### Drill-in: Other Provisions (kind `br`, tgt `l_cl_oprov`; source: itr5.html:1083-1084)
Rows: Provision for Leave encashment / Superannuation / Gratuity `leave` · Others `oth`. Total pushed into sheet input (same non-zero guard).

### Particular: center head "Assets"
| Label | Binds | Drill-in |
|---|---|---|
| *(sub "Fixed assets")* Gross block | `a_fa_gb` | — |
| Less: Depreciation | `a_fa_dep` | — |
| Capital work-in-progress | `a_fa_cwip` | — |
| Long term investments | ⚙ `it_a_lti` | [click ⋯ → opens: sf-lti] |
| Deferred tax assets (Net) | `a_dta` | — |
| *(sub "Loans & advances^^")* Advances | `a_la_adv` | — |
| Deposits and loans | `a_la_dep` (input; overwritten by breakup total) | [click ⋯ → opens: sf-deploans] |
| Balance with Revenue Authorities | `a_la_bra` | — |
| *(sub "Current assets")* Short Term investments | ⚙ `it_a_sti` | [click ⋯ → opens: sf-sti] |
| Inventories (heading row, no field) | — | — |
| Raw materials | `a_ca_inv_rm` | — |
| Finished goods | `a_ca_inv_fg` | — |
| Stock-in-trade | `a_ca_inv_sit` | — |
| Others | ⚙ `it_a_ca_inv_oth` | [click ⋯ → opens: sf-invoth] |
| Trade Debtors | `a_ca_td` (input; overwritten by breakup total) | [click ⋯ → opens: sf-tradedr] |
| Cash / Cash equivalents (heading row, no field) | — | — |
| Balances with Banks | `a_ca_cash_bwb` | — |
| Cash in hand | `a_ca_cash_cih` | — |
| Others | `a_ca_cash_oth` | — |
| Other current assets | ⚙ `it_a_ca_oca` | [click ⋯ → opens: sf-othca] |
| Miscellaneous expenditure | `a_misc` | — |
| Profit and loss A/c (Dr) | `a_pladr` | — |
| **Total Assets** | ⚙ `it_totass` | — |
| *(sub, red: "^^Additional Data")* Others | ⚙ `it_addl_oth` | [click ⋯ → opens: sf-addl] |

#### Drill-in: Long term investments (kind `br`; source: itr5.html:1086-1087)
Rows: Property `prop` · Equity - listed `eqlisted` · - unlisted `equnlisted` · Preference shares `pref` · Govt or trust securities `govt` · Debenture or bonds `deb` · Mutual funds `mf` · Other long term investments `oth`. Total → `it_a_lti`.
#### Drill-in: Deposits and loans (kind `brfree`, tgt `a_la_dep`; source: itr5.html:1089-1090)
Free-row table, section "Particulars" — headers: (blank) | Amount; each row = description (text) + Amount; "+ Add row", per-row "✕". gbar "Total" pushed into sheet input `a_la_dep` (non-zero guard).
#### Drill-in: Short Term investments (kind `br`; source: itr5.html:1092-1093)
Rows: Equity - listed `eqlisted` · - unlisted `equnlisted` · Preference shares `pref` · Govt or trust securities `govt` · Debentures or bonds `deb` · Mutual funds `mf` · Other investments `oth`. Total → `it_a_sti`.
#### Drill-in: Others (inventories) (kind `br`; source: itr5.html:1095-1096)
Rows: Work-in-progress `wip` · Stores and spares `stores` · Loose tools `loose` · Others `oth`. Total → `it_a_ca_inv_oth`.
#### Drill-in: Trade Debtors (kind `br`, tgt `a_ca_td`; source: itr5.html:1098-1099)
Rows: Trade Debtors o/s for more than 1 year `gt1yr` · Others `oth`. Total pushed into sheet input.
#### Drill-in: Other current assets (kind `brfree`; source: itr5.html:1101-1102)
Free rows (description + Amount), "+ Add row". Total → `it_a_ca_oca`.
#### Drill-in: Others (Additional Data) (kind `br`; source: itr5.html:1104-1106)
Table "Particulars": Unsecured Rupee Loans from persons u/s 40A(2)(b) `unsec40a` · Advances from persons u/s 40A(2)(b) (Liability) `adv40a`; table "Asset items" (bold rows): Out of Loans & advances - not for the purpose of business `notbiz`. Total → `it_addl_oth`.

Buttons: group-head collapse toggles; every breakup "✓ Done". Totals: `it_totlia` (:2303), `it_totass` (:2311); rail Diff = Assets − Liabilities.
---

## Screen: ITR P&L (`data-pane="p-pl"`, itr5.html:498-648)

Head "Manufacturing, Trading and P&L A/c" with enable checkbox (`data-fld="mtpen"`, default checked; auto-cleared + disabled while "Books not maintained" is ticked; unchecking collapses `#g-mtp`).
All rows are amount inputs (`data-b` keys) unless marked ⚙; defaults blank; none required; no per-field validation. Discrepancy note: like the B/S, the detailed P&L figures are **not overlaid onto the JSON `PARTA_PL` block** (skeleton zeros remain); only `C.pbt` and a few `CorpScheduleBP` leaves reach the export.

### Particular: "ITR Manufacturing A/c" (bold blue row with checkbox)
| ITR Manufacturing A/c | checkbox | — | — | — | unticked | No | — | ticked reveals `#mfgblk` (:1893; UI-verified none→block); also switches "Cost of Production (as per Manufacturing A/c)" from 0 to COGP (:2324) | `S.flags.mfgen` | Trading A/c expenses |
|---|---|---|---|---|---|---|---|---|---|---|

Conditional block `#mfgblk` (visible when ticked):
Sub-head "Debits to Manufacturing A/c"
| Label | Binds | Drill-in |
|---|---|---|
| Opening Stock - Raw material | `m_os_rm` | — |
| Opening Stock - Work in progress | `m_os_wip` | — |
| Purchases (net of returns / duty / tax) | `m_pur` | — |
| Direct wages | `m_wages` | — |
| Direct expenses | ⚙ `it_m_dirx` | [click ⋯ → opens: sf-m_dirx] |
| Factory Overheads | ⚙ `it_m_foh` | [click ⋯ → opens: sf-m_foh] |
Sub-head "Credits to Manufacturing A/c"
| Closing Stock - Raw material | `m_cs_rm` | — |
| Closing Stock - Work in progress | `m_cs_wip` | — |
| **Cost of Goods Produced - transferred to Trading A/c** | ⚙ `it_m_cogp` (= debits − closing stocks, :2321-2323) | — |

#### Drill-in: Direct expenses (kind `br`; source: itr5.html:1109-1110)
Section "Direct Expenses" — rows: Carriage inward `carriage` · Power and fuel `power` · Others `oth`. Total → `it_m_dirx`.
#### Drill-in: Factory Overheads (kind `br`; source: itr5.html:1111-1112)
Section "Factory Overheads" — rows: Indirect wages `indwages` · Factory rent and rates `factoryrent` · Factory Insurance `factoryins` · Factory power and fuel `factorypower` · Factory general expenses `factorygen` · Others `oth`. Total → `it_m_foh`.

### Particular: center head "ITR Trading A/c"
Sub-head "Incomes"
| Label | Binds | Drill-in |
|---|---|---|
| Sales / Gross receipts of Business (net of returns) (heading row, no field) | — | — |
| Sale of products/goods | `t_sale_goods` | — |
| Sale of services (excluding Professional receipts) | `t_sale_serv` | — |
| Other operating revenues | ⚙ `it_t_oor` | [click ⋯ → opens: sf-t_oor] |
| Gross receipts from Profession | `t_prof` | — |
| Duties, taxes and cess on sales | ⚙ `it_t_duties` | [click ⋯ → opens: sf-t_duties] |
| Closing Stock - Finished goods | `t_cs_fg` | — |
| **Total** | ⚙ `it_t_totinc` (:2327-2328) | — |
Sub-head "Expenses"
| Opening Stock - Finished goods | `t_os_fg` | — |
| Purchases (net of returns / duty / tax) | `t_pur` | — |
| Direct Expenses | ⚙ `it_t_dirx` | [click ⋯ → opens: sf-t_dirx] |
| Taxes on Inputs / Purchases | ⚙ `it_t_taxin` | [click ⋯ → opens: sf-t_taxin] |
| Cost of Production (as per Manufacturing A/c) | ⚙ `it_t_cop` (= COGP if Manufacturing enabled else 0) | — |
| **Gross Profit** | ⚙ `it_t_gp` (= Total incomes − expenses, :2329-2330) | — |
| Intraday Trading Income | ⚙ `it_t_intra` (shows Net income) | [click ⋯ → opens: sf-t_intra] |
| Futures & Options Trading Income | ⚙ `it_t_fno` (shows Net income) | [click ⋯ → opens: sf-t_fno] |

#### Drill-in: Other operating revenues (kind `brfree`; source: itr5.html:1115-1116)
Free rows (description + Amount), section "Other Operating Revenues", "+ Add row". Total → `it_t_oor`.
#### Drill-in: Duties, taxes and cess on sales (kind `br`; source: itr5.html:1118-1119)
Section "Duties, taxes and cess" — rows: Central GST (CGST) `cgst` · State GST (SGST) `sgst` · Integrated GST (IGST) `igst` · Union Territory GST (UTGST) `utgst` · Service tax `st` · Union Excise duties `excise` · VAT/Sales tax `vat` · Other duty, tax and cess `oth`. Total → `it_t_duties`.
#### Drill-in: Direct Expenses (Trading) (kind `br`; source: itr5.html:1121-1122)
Section "Direct Expenses" — rows: Carriage inward `carriage` · Power and fuel `power` · Others `oth`. Total → `it_t_dirx`.
#### Drill-in: Taxes on Inputs / Purchases (kind `br`; source: itr5.html:1124-1125)
Section "Input Taxes on Purchases" — rows: Central GST (CGST) `cgst` · State GST (SGST) `sgst` · Integrated GST (IGST) `igst` · Union Territory GST (UTGST) `utgst` · Custom duty `custom` · Countervailing duty `cvd` · Special additional duty `sad` · Union excise duty `excise` · Service tax `st` · VAT/Sales tax `vat` · Others `oth`. Total → `it_t_taxin`.
#### Drill-in: Intraday Trading Income (kind `netturn`; source: itr5.html:1127, DOM :1454-1461)
Two fixed inputs: "Net income" (`S.br["sf-t_intra"].net` — the figure that reaches PBIT) · "Turnover (For item 12a of Part A-Trading Account)" (`.turn`, disclosure only). No total bar.
#### Drill-in: Futures & Options Trading Income (kind `netturn`; source: itr5.html:1128)
Same two inputs; turnover label (verbatim): "Turnover (For item 12c of Part A-Trading Account)".

### Particular: center head "ITR P&L A/c"
Sub-head "Incomes"
| Label | Binds | Drill-in |
|---|---|---|
| Gross profit (as per Trading A/c) | ⚙ `it_p_gp` | — |
| Other Income | ⚙ `it_p_oi` | [click ⋯ → opens: sf-p_oi] |
Sub-head "Expenses" (34 rows, all amount inputs unless a drill total)
| Advertisement | `e_adv` | — |
| Audit fee | `e_audit` | — |
| Bad debts* | `e_baddebt` | — |
| Club expenses | `e_club` | — |
| Commission ^ | `e_comm` | — |
| Conference | `e_conf` | — |
| Consumption of stores and spares | `e_stores` | — |
| Conveyance | `e_conv` | — |
| Donation | `e_don` | — |
| Entertainment | `e_ent` | — |
| Festival celebration | `e_fest` | — |
| Freight outward | `e_freight` | — |
| Gift | `e_gift` | — |
| Guest House expenses | `e_guest` | — |
| Hospitality | `e_hosp` | — |
| Hotel, boarding and lodging | `e_hotel` | — |
| Insurance | ⚙ `it_e_ins` | [click ⋯ → opens: sf-e_ins] |
| Power and fuel | `e_power` | — |
| Professional / Consultancy / Technical fees ^ | `e_prof` | — |
| Provisions | ⚙ `it_e_prov` | [click ⋯ → opens: sf-e_prov] |
| Rents | `e_rents` | — |
| Repairs - Building | `e_rep_b` | — |
| Repairs - Machinery | `e_rep_m` | — |
| Royalty ^ | `e_roy` | — |
| Remuneration / Salary to Partners | `e_remun` | — |
| Salaries and other benefits ^ | ⚙ `it_e_sal` | [click ⋯ → opens: sf-e_sal] |
| Sales promotion (excluding Advertisement) | `e_salespr` | — |
| Scholarship | `e_schol` | — |
| Staff welfare | `e_staff` | — |
| Taxes and rates paid | ⚙ `it_e_taxes` | [click ⋯ → opens: sf-e_taxes] |
| Telephone | `e_tel` | — |
| Travelling ^ | `e_travel` | — |
| Other expenses | ⚙ `it_e_oth` | [click ⋯ → opens: sf-e_oth] |
Totals & appropriations
| **Profit before interest, depreciation and taxes (PBIT)** | ⚙ `it_pbit` (= GP + Other Income + Intraday + F&O − Σ all 34 expense rows incl. breakup totals, :2336-2341) | — |
| Less: Interest to Partners ^ | `e_int_part` | — |
| Interest to others ^ | `e_int_oth` | — |
| Depreciation | `e_dep` | — |
| **Profit before Taxes (PBT)** | ⚙ `it_pbt` (= PBIT − interest to partners − interest to others − depreciation, :2342) | — |
| Less: Provision for - Current tax | `e_prov_cur` | — |
| - Deferred Tax | `e_prov_def` | — |
| **Profit after taxes (PAT)** | ⚙ `it_pat` (:2343) | — |
| Add: Balance B/F from previous year | `e_bal_bf` | — |
| Less: Transfer to Reserves | `e_transres` | — |
| **Balance carried to B/S** | ⚙ `it_balbs` (:2344) | — |
Sub-head (red) "Additional Data"
| ^ Foreign payments, included in above | ⚙ `it_fgnpay` | [click ⋯ → opens: sf-fgnpay] |
| *Analysis of Bad debts | ⚙ `it_baddebt` | [click ⋯ → opens: sf-baddebt] |

#### Drill-in: Other Income (kind `br`; source: itr5.html:1131-1132)
Section "Other Income" — rows: Agriculture income `agri` · Commission `comm` · Dividend `div` · Interest income `int` · Liability written back `liab` · Profit from currency fluctuation u/s 43AA `curr` · Profit on conversion of Stock into Capital asset u/s 28(via) `conv` · Profit on sale of - fixed assets `fahdr` · - investments having STT `stt` · - other investments `othinv` · Rent `rent` · Incomes not considered as part of turnover `notturn` · Others `oth`. Total → `it_p_oi`.
#### Drill-in: Insurance (kind `br`; source: itr5.html:1134-1135)
Section "Insurance" — rows: Medical Insurance `med` · Life Insurance `life` · Keyman's Insurance `keyman` · Other Insurance `oth`. Total → `it_e_ins`.
#### Drill-in: Provisions (kind `br`; source: itr5.html:1137-1138)
Section "Provisions" — rows: Provision for bad debts `baddebt` · Other Provisions `oth`. Total → `it_e_prov`.
#### Drill-in: Salaries and other benefits ^ (kind `br`; source: itr5.html:1140-1141)
Section "Compensation to employees" — rows: Salaries and wages `salwages` · Bonus `bonus` · Medical expenses reimbursement `med` · Leave encashment `leaveenc` · Leave travel benefits `ltb` · Superannuation fund contribution (approved) `super` · Provident fund contribution (recognised) `pf` · Gratuity fund contribution (recognised) `gratuity` · Any other fund contribution `othfund` · Any other benefit `othben`. Total → `it_e_sal`.
#### Drill-in: Taxes and rates paid (kind `br`; source: itr5.html:1143-1144)
Section "Rates and taxes paid or payable" — rows: Central GST (CGST) `cgst` · State GST (SGST) `sgst` · Integrated GST (IGST) `igst` · Union Territory GST (UTGST) `utgst` · Union excise duty `excise` · Service tax `st` · VAT/Sales tax `vat` · Cess `cess` · Other rate, tax, duty or cess incl. STT and CTT `oth`. Total → `it_e_taxes`.
#### Drill-in: Other expenses (kind `brfree`; source: itr5.html:1146-1147)
Free rows (description + Amount), section "Other Expenses", "+ Add row". Total → `it_e_oth`.
#### Drill-in: ^ Foreign payments, included in above (kind `br`; source: itr5.html:1149-1152)
Section "Amount paid outside India or paid in India to Non-resident / Foreign Co.:" — rows: Salary and other benefits `sal` · Interest to Partners `intpart` · Interest to others `intoth` · Commission `comm` · Royalty `roy` · Professional / Consultancy / Technical fees `prof`; second (unnamed) section — row: Foreign travelling expenses `travel`. Total → `it_fgnpay`. Disclosure only (marks the ^-tagged expense rows).
#### Drill-in: *Analysis of Bad debts (kind `multirepeat`, 2 tables; source: itr5.html:1154-1160)
Table "Rs. 1 lakh or more, where PAN is available" — headers: Name | PAN | Amount. Table "Rs. 1 lakh or more, where PAN is not available" — headers: Name | Amount | Door No. | Building | Road | Area | City | State | PIN / ZIP code | Country (sel COUNTRIES). Each "+ Add row". gbar "Total" = Σ Amount of both tables → `it_baddebt`. Disclosure (marks the * on Bad debts).

Buttons: "✓ Done" per popup; group collapse. Conditional fields: `#mfgblk` on `mfgen`; whole pane disabled when "Books not maintained". Feeds: `C.pbt` → Computation "Net Profit before tax as per P & L A/c"; `e_dep` → "Depreciation debited to P & L A/c"; `e_remun`/`e_int_part` → partner add-back and 40(b) working; JSON `CorpScheduleBP.BusinessIncOthThanSpec.ProfBfrTaxPL` and `DepreciationDebPLCosAct`.

---

## Screen: Computation (`data-pane="p-comp"`, itr5.html:651-862)

Sheet note (verbatim): "Statement of Total Income — Firm / LLP / AOP / BOI · A.Y. 2026-27"
(The shared Computation Sheet is documented separately — below is the ITR-5 pane structure and the ITR-5-specific pieces only. Every value cell in this pane is ⚙ computed except where an input is noted.)

Group head: **"Income from House Property"** [HP]

### Particular: "Property-1:"   [click ⋯ → opens: sf-c-hp]
#### Drill-in: Income from House Property (kind `md`; source: itr5.html:1165-1171; detail popup `sf-c-hp-detail`)
Note (verbatim): "Gross annual value and municipal taxes are entered including the co-owners' shares; the assessee's share is then applied. A firm cannot have a self-occupied property, so the annual value is computed on the let-out basis and interest u/s 24(b) is not capped."
Summary headers: Property | Share % | Income / (Loss) ("Income / (Loss)" auto-computed per row). "+ Add entry" / "Edit ✎" / "✕". Detail groups:
| Label | Type | Options | Placeholder | Helper | Default | Required | Validation | Conditional | Binds | Feeds |
|---|---|---|---|---|---|---|---|---|---|---|
| *(group "Property")* Address of the property | text (wide) | — | — | — | blank | No | — | — | row `.addr` | summary |
| Type | select | (blank) · Let out · Deemed let out | — | — | blank | No | — | — | row `.type` | — |
| Share (%) | amount | — | — | — | blank (treated as 100 when empty, :1971) | No | — | — | row `.share` | share factor |
| Co-owners, if any | text (wide) | — | — | — | blank | No | — | — | row `.coowner` | — |
| PAN of co-owners | text (wide) | — | — | — | blank | No | — | — | row `.coownerpan` | — |
| *(group "Gross annual value (including co-owners' shares)")* Annual rent received / receivable | amount | — | — | — | blank | No | — | — | row `.rent` | GAV |
| Municipal valuation | amount | — | — | — | blank | No | — | — | row `.munval` | GAV |
| Fair rent | amount | — | — | — | blank | No | — | — | row `.fairrent` | GAV |
| Standard rent | amount | — | — | — | blank | No | — | — | row `.standard` | **nothing** (see discrepancy) |
| Vacancy allowance | amount | — | — | — | blank | No | — | — | row `.vacancy` | GAV (−) |
| Unrealised rent | amount | — | — | — | blank | No | — | — | row `.unrealised` | GAV (−) |
| *(group "Deductions (including co-owners' shares)")* Municipal taxes paid | amount | — | — | — | blank | No | — | — | row `.muntax` | NAV (−) |
| *(group "Assessee's share")* Interest on borrowings u/s 24(b): Assessee's share | amount | — | — | — | blank | No | — | — | row `.interest` | HP income (−) |
| Arrears / unrealised rent received u/s 25A (Assessee's share) | amount | — | — | — | blank | No | — | — | row `.arrears` | HP income (+70%) |
Discrepancy note: the engine computes GAV = max(Annual rent, Municipal valuation, Fair rent) − Vacancy − Unrealised (:1973) — the "Standard rent" input is captured but **never used** in the formula.

### Particular: computed HP rows (sheet)
"Gross annual value (including co-owners' shares)" ⚙ `it_c_hp_gav` · "Less: Municipal taxes (including co-owners' shares)" ⚙ `it_c_hp_muntax` · "Net annual value" ⚙ `it_c_hp_nav` (NAV × share) · "Less: Standard deduction u/s 24(a)" ⚙ `it_c_hp_sd` (30% of positive NAV-share) · "Interest on borrowings u/s 24(b): Assessee's share" ⚙ `it_c_hp_int` · "Add: Arrears / Unrealised rent received (Assessee's share)" ⚙ `it_c_hp_arrears` (70% of entered arrears).

### Particular: "Pass through income" [PTI]   [click ⋯ → opens: sf-c-hp-pti]
#### Drill-in: Pass through income — House Property (kind `repeat`; source: itr5.html:1194-1196)
Grids: section "Pass through income u/s 115UA / 115UB" — headers: Name of the Business Trust / Investment Fund | PAN | Income | TDS. "+ Add row". Total = Σ Income → `it_c_hp_pti`, added into HP income.

### Particular: "Income chargeable under 'House Property'" ⚙ `it_c_hp` [HP] → JSON `PartB-TI.IncomeFromHP`.

---

Group head: **"Profits and gains of Business or Profession"** [BP]

### Particular: "Net Profit before tax as per P & L A/c" ⚙ `it_c_npbt` [P&L] — = `C.pbt` from the ITR P&L tab; when "Books not maintained" it is the Profit-particulars net (Gross profit − Expenses) instead (:2349).

### Sub-head "Add: Inadmissible expenses & income not included"

### Particular: "Depreciation debited to P & L A/c" ⚙ `it_c_depbook` — mirrors `e_dep`.

### Particular: "Interest and Remuneration to partners debited to P&L"   [click ⋯ → opens: sf-c-partpl]  *(ITR-5-specific)*
#### Drill-in: Interest and Remuneration to partners debited to P&L (kind `partpl`, fully computed; source: itr5.html:1188, DOM :1482-1491)
Notes (verbatim): "These amounts are added back to the profit here. The amount allowable u/s 40(b) is then deducted after book profit is struck." · "Both figures are picked up from the ITR P&L tab — Remuneration / Salary to Partners and Less: Interest to Partners."
Section "Debited to the Profit & Loss A/c" — ⚙ rows: Remuneration / salary to partners `pp_remun` (= `e_remun`) · Interest to partners `pp_int` (= `e_int_part`) · Total added back `pp_total` → `it_c_partpl`. No inputs.

### Particular: "36 disallowance"   [click ⋯ → opens: sf-c-36]
#### Drill-in: 36 disallowance (kind `br`; source: itr5.html:1174-1176)
Section "Amounts debited to P & L A/c, disallowable u/s 36" — rows: 36(1)(ib) — Insurance premium on health of employees `ins` · 36(1)(ii) — Bonus / commission to employees `bonus` · 36(1)(iii) — Interest on borrowed capital `int` · 36(1)(iv)/(v) — Contribution to recognised PF / gratuity fund `pfemp` · 36(1)(va) — Employees' contribution not paid within due date `pfdelay` · 36(1)(vii) — Bad debts written off `baddebt` · Other 36 disallowances `oth`. Total → `it_c_36`; JSON `AmtDebPLDisallowUs36`.

### Particular: "37 disallowance"   [click ⋯ → opens: sf-c-37]
#### Drill-in: 37 disallowance (kind `br`; source: itr5.html:1178-1180)
Rows: Capital expenditure `capital` · Personal expenditure `personal` · Advertisement in souvenir of a political party `adv` · Penalty / fine for violation of any law `penalty` · Expenditure for any purpose which is an offence `offence` · CSR expenditure u/s 135 of Companies Act `csr` · Other 37 disallowances `oth`. Total → `it_c_37`; JSON `AmtDebPLDisallowUs37`.

### Particular: "40 disallowance"   [click ⋯ → opens: sf-c-40]
#### Drill-in: 40 disallowance (kind `br`; source: itr5.html:1182-1185)
Note (verbatim): "Remuneration and interest to partners are dealt with separately: they are added back above and the amount allowable u/s 40(b) is deducted after book profit."
Rows: 40(a)(i) — Payment outside India without TDS `a_i` · 40(a)(ia) — Payment to resident without TDS (30%) `a_ia` · 40(a)(ib) — Equalisation levy not deducted / paid `a_ib` · 40(a)(ic) — Fringe benefit tax `a_ic` · 40(a)(ii) — Income tax paid `a_ii` · 40(a)(iib) — Royalty / fee levied by State Govt `a_iib` · 40(a)(iii) — Salary payable outside India without TDS `a_iii` · 40(a)(v) — Tax paid by employer on non-monetary perquisite `a_v` · 40(ba) — Interest / remuneration to a member of an AOP / BOI `ba`. Total → `it_c_40`; JSON `AmtDebPLDisallowUs40`.

### Particular: "40A disallowance"   [click ⋯ → opens: sf-c-40a]
#### Drill-in: 40A disallowance (kind `br`; source: itr5.html:1215-1217)
Rows: 40A(2)(b) — Excessive payment to specified persons `a2b` · 40A(3) — Cash payment exceeding ₹10,000 `a3` · 40A(3A) — Cash payment for an earlier year's liability `a3a` · 40A(7) — Provision for gratuity `a7` · 40A(9) — Contribution to non-statutory fund `a9` · Other 40A disallowances `oth`. Total → `it_c_40a`; JSON `AmtDebPLDisallowUs40A`.

### Particular: "43B disallowance"   [click ⋯ → opens: sf-c-43b]
#### Drill-in: 43B disallowance (kind `br`; source: itr5.html:1219-1221)
Section "Amounts not paid on or before the due date u/s 43B" — rows: Any tax, duty, cess or fee `tax` · Employer's contribution to PF / superannuation / gratuity `pf` · Bonus or commission to employees `bonus` · Interest on loan from a bank / financial institution `intbank` · Interest on loan from an NBFC `intnbfc` · Leave encashment `leave` · Payment to Indian Railways `railway` · 43B(h) — Payment to a Micro or Small Enterprise beyond the MSMED time limit `msme` · Others `oth`. Total → `it_c_43b`; JSON `AmtDebPLDisallowUs43B`.

### Particular: "Deemed income u/s 41 / 33AB / 33ABA / 33AC"   [click ⋯ → opens: sf-c-deemed]
#### Drill-in: Deemed Incomes (kind `br`; source: itr5.html:1223-1225)
Rows: 41 — Remission / cessation of a trading liability `s41` · 33AB(8) — Tea / coffee / rubber development account `s3313` · 33ABA(8) — Site restoration fund `s33abas` · 33AC — Reserve for shipping business `s33ac` · 35A(2) — Sale of patent rights `s35a` · 35ABB(3) — Telecom licence `s35abb` · 72A — Amalgamation / demerger `s72a` · 80HHD(4) / 80-IA(7A) `s80hhd` · Other deemed income `oth`. Total → `it_c_deemed`; JSON `DeemIncUs41`.

### Particular: "Effect of deviation from ICDS / u/s 145A"   [click ⋯ → opens: sf-c-icds]
#### Drill-in: Effect of deviation from ICDS / u/s 145A (kind `icds`; source: itr5.html:1227, DOM :1550-1566)
Note (verbatim): "Enter the increase or decrease in profit arising from each ICDS. The net effect is added to the business profit."
Grids: headers: (blank) | Increase in profit | Decrease in profit — 10 rows (verbatim): ICDS I — Accounting Policies · ICDS II — Valuation of Inventories · ICDS III — Construction Contracts · ICDS IV — Revenue Recognition · ICDS V — Tangible Fixed Assets · ICDS VI — Changes in Foreign Exchange Rates · ICDS VII — Government Grants · ICDS VIII — Securities · ICDS IX — Borrowing Costs · ICDS X — Provisions, Contingent Liabilities and Contingent Assets (binds `S.br["sf-c-icds"].{i..x}_inc/_dec`). gbar "Net effect (increase − decrease)" → `it_c_icds`.

### Particular: "Expenses / losses considered under other heads"   [click ⋯ → opens: sf-c-othheads]
#### Drill-in: Expenses / Losses considered under other heads (kind `brfree`; source: itr5.html:1229-1230)
Free rows, section "Particulars". Total → `it_c_othheads`.

### Particular: "Income not credited to P & L A/c"   [click ⋯ → opens: sf-c-notcredit]
#### Drill-in: Income not credited to P & L A/c (kind `br`; source: itr5.html:1232-1234)
Rows: Duty drawback / DEPB / DFRC `duty` · Profit on sale of assets `profitsale` · Cash compensatory support `cashcomp` · Subsidy / grant / incentive `subsidy` · Any other income not credited `oth`. Total → `it_c_notcredit`.

### Particular: "Other additions"   [click ⋯ → opens: sf-c-otheradd]
#### Drill-in: Other additions (kind `brfree`; source: itr5.html:1236-1237) — free rows "Particulars". Total → `it_c_otheradd`.

### Sub-head "Less: Deductible expenditure & income to be excluded"

### Particular: "35 to 35E, 33AB, 33ABA deductions"   [click ⋯ → opens: sf-c-35to35e]
#### Drill-in: 35 to 35E, 33AB, 33ABA deductions (kind `br`; source: itr5.html:1241-1243)
Section "Deductions allowable" — rows: 35(1)(i) — Revenue expenditure on scientific research `s35_1_i` · 35(1)(ii) — Contribution to an approved research association `s35_1_ii` · 35(1)(iia) — Contribution to an approved company `s35_1_iia` · 35(1)(iii) — Contribution for social science / statistical research `s35_1_iii` · 35(1)(iv) — Capital expenditure on scientific research `s35_1_iv` · 35(2AA) — Contribution to a National Laboratory / IIT `s35_2AA` · 35ABB — Telecom licence fee `s35abb` · 35AD — Deduction for a specified business `s35ad` · 35CCA / 35CCC / 35CCD `s35cc` · 35D — Preliminary expenses `s35d` · 35DD — Amalgamation / demerger expenses `s35dd` · 35DDA — VRS expenditure `s35dda` · 35E — Prospecting for minerals `s35e` · 33AB — Tea / coffee / rubber development account `s33ab` · 33ABA — Site restoration fund `s33aba`. Total → `it_c_35to35e`.

### Particular: "Exempt income credited to P & L A/c" [EI]   [click ⋯ → opens: sf-c-exempt]
#### Drill-in: Exempt income credited to P & L A/c (kind `br`; source: itr5.html:1245-1247)
Rows: Share of profit from a firm / AOP / BOI u/s 10(2A) `share` · Agricultural income u/s 10(1) `agri` · Exempt dividend `div` · Exempt long-term capital gain `ltcg` · Any other exempt income `oth`. Total → `it_c_exempt`.

### Particular: "Incomes considered separately (HP / CG / OS)"   [click ⋯ → opens: sf-c-sep]
#### Drill-in: Incomes considered separately (kind `br`; source: itr5.html:1249-1252)
Note (verbatim): "Income credited to the P & L A/c but chargeable under House Property, Capital Gains or Other Sources. It is removed here and taken under its own head."
Rows: Rental income chargeable under House Property `hp` · Capital gains `cg` · Interest income `int` · Dividend income `div` · Rent from plant & machinery `rent` · Winnings from lotteries / games `win` · Any other income considered separately `oth`. Total → `it_c_sep`.

### Particular: "Other deductions"   [click ⋯ → opens: sf-c-othded]
#### Drill-in: Other deductions (kind `brfree`; source: itr5.html:1254-1255) — free rows "Particulars". Total → `it_c_othded`.

### Particular: "Adjusted Profit of Business-1" ⚙ `it_c_bp_adj` — = NPBT + all Adds − all Less (:2013).

### Particular: "Less: Depreciation as per IT Act" [DPM]   [click ⋯ → opens: sf-c-depit]
#### Drill-in: Depreciation as per IT Act (kind `dep`; source: itr5.html:1239, DOM :1538-1547, compute :1948-1964)
Note (verbatim): "Depreciation is computed block-wise. An asset put to use for less than 180 days in the year gets half the normal rate."
Grids: section "Block of assets" — headers: Block | Rate % | Opening WDV | Additions (≥180 days) | Additions (<180 days) | Sale / transfer | Depreciation | Closing WDV. Block options (12): (blank) · Building — 5% · Building — 10% · Building — 40% · Furniture & Fittings — 10% · Plant & Machinery — 15% · Plant & Machinery — 30% · Plant & Machinery — 40% · Plant & Machinery — 45% · Computers & Software — 40% · Motor vehicles — 15% · Motor vehicles — 30% · Intangible assets — 25%. Add: "+ Add block". Row behaviour: "Depreciation" and "Closing WDV" cells are recomputed and **overwritten by the engine** on every recompute (full rate on opening + ≥180-day additions − sales; half rate on <180-day additions; block extinguished → 0). gbar "Total depreciation allowable" → `it_c_depit`; JSON `DepreciationAllowUs32_1_ii` / `TotDeprAllowITAct`.

### Particular: "Book profit" ⚙ `it_c_bookprofit` — = Adjusted Profit − IT depreciation − allowable partner interest (:2025).  *(ITR-5-specific)*

### Particular: "Less: Remuneration and Interest to partners"   [click ⋯ → opens: sf-c-40b]  *(ITR-5-specific)*
#### Drill-in: Remuneration and Interest to partners — allowable u/s 40(b) (kind `s40b`; source: itr5.html:1191, DOM :1494-1516, compute :2019-2043)
Note (verbatim): "Section 40(b)(v): remuneration to working partners is allowable up to 90% of the first ₹6,00,000 of book profit (minimum ₹3,00,000), and 60% of the balance. Interest to partners is allowable up to 12% per annum. Anything above the ceiling, or paid to a non-working partner, or not authorised by the deed, is not allowable."
Section "Interest to partners":
| Label | Type | Binds | Validation / formula |
|---|---|---|---|
| Interest debited to P & L A/c | ⚙ `b40_int_debited` | — | = `e_int_part` |
| Interest allowable @ 12% p.a. as per the deed | amount input | `S.br["sf-c-40b"].int_allow` | capped at interest debited |
| Interest allowable u/s 40(b) | ⚙ `b40_int_final` | — | min(entered, debited) |
| Interest disallowed | ⚙ `b40_int_dis` | — | debited − allowable |
Section "Remuneration to working partners":
| Book profit (after allowable interest to partners) | ⚙ `b40_bp` | — | — |
| 90% of the first ₹6,00,000 of book profit, or ₹3,00,000 whichever is higher | ⚙ `b40_slab1` | — | floor ₹3,00,000 (UI-verified shows 3,00,000 at zero book profit) |
| 60% of the balance book profit | ⚙ `b40_slab2` | — | — |
| Maximum allowable u/s 40(b)(v) | ⚙ `b40_ceiling` | — | slab1 + slab2 |
| Remuneration debited to P & L A/c | ⚙ `b40_rem_debited` | — | = `e_remun` |
| Remuneration authorised by the deed (enter if lower) | amount input | `.rem_deed` | capped at debited |
| Less: Remuneration to non-working partners | amount input | `.rem_nonwork` | — |
| Remuneration allowable u/s 40(b) | ⚙ `b40_rem_final` | — | min(working-partner remuneration, ceiling) |
| Remuneration disallowed | ⚙ `b40_rem_dis` | — | — |
gbar "Total remuneration and interest allowable u/s 40(b)" `gb_c_40b` → sheet `it_c_40b`.

### Particular: "Balance profit" ⚙ `it_c_balprofit` — = Book profit − allowable remuneration (:2045).

### Sub-head "Presumptive & special business"

### Particular: "Presumptive profits u/s 44AD"   [click ⋯ → opens: sf-c-44ad]
#### Drill-in: Presumptive profits u/s 44AD (kind `p44ad`; source: itr5.html:1258, DOM :1569-1583, compute :2049-2061)
Note (verbatim): "Presumptive profit is 8% of turnover, or 6% of turnover received through a bank / electronic mode. A higher figure may be declared. The limit is ₹2 crore, or ₹3 crore where cash receipts do not exceed 5% of turnover."
Section "Business: Presumptive profits u/s 44AD":
| Label | Type | Binds | Formula |
|---|---|---|---|
| Turnover received through a bank / electronic mode | amount input | `.to_digital` | — |
| Presumptive profit @ 6% | ⚙ `ad_p6` | — | digital × 6% |
| Turnover received in cash / other mode | amount input | `.to_cash` | — |
| Presumptive profit @ 8% | ⚙ `ad_p8` | — | cash × 8% |
| Total turnover | ⚙ `ad_to` | — | — |
| Presumptive profit | ⚙ `ad_pres` | — | p6 + p8 |
| Profit declared (if higher) | amount input | `.declared` | — |
| Profit chargeable u/s 44AD | ⚙ `ad_final` | — | max(presumptive, declared) → sheet `it_c_44ad` |
Conditional: red warning strip `#ad_warn` appears when total turnover exceeds the limit (₹3 crore when cash ≤ 5% of turnover, else ₹2 crore) — text: "Turnover of {n} exceeds the section 44AD limit of {n}. Presumptive taxation is not available." (UI-verified: 10L digital + 5L cash → chargeable 1,00,000, no warning.) Also drives JSON `PartA_GEN2.IncDclrdUs`.

### Particular: "Presumptive profits u/s 44ADA"   [click ⋯ → opens: sf-c-44ada]
#### Drill-in: Presumptive profits u/s 44ADA (kind `p44ada`; source: itr5.html:1259, DOM :1586-1596, compute :2063-2073)
Note (verbatim): "Presumptive profit is 50% of gross receipts. A higher figure may be declared. The limit is ₹50 lakh, or ₹75 lakh where cash receipts do not exceed 5% of gross receipts."
Rows: Gross receipts (input `.receipts`) · Presumptive profit @ 50% ⚙ `ada_pres` · Profit declared (if higher) (input `.declared`) · Profit chargeable u/s 44ADA ⚙ `ada_final` → sheet `it_c_44ada`. Warning `#ada_warn` when receipts > ₹75,00,000: "Gross receipts of {n} exceed the section 44ADA limit of {n}. Presumptive taxation is not available."
Discrepancy note: the note text states the ₹50L/₹75L split but the code warns only above ₹75L regardless of cash share (:2069).

### Particular: "Transport business u/s 44AE"   [click ⋯ → opens: sf-c-44ae]
#### Drill-in: Transport business u/s 44AE (kind `repeat`; source: itr5.html:1260-1263, compute :2076-2082)
Note (verbatim): "Presumptive income: ₹1,000 per ton of gross vehicle weight per month for a heavy goods vehicle (>12MT), otherwise ₹7,500 per month. Part of a month is taken as a full month."
Grids: section "Goods carriages owned during the year" — headers: Registration No. | Owned / Leased / Hired | Tonnage (MT) | Months held | Presumptive income | Actual income declared. "Owned / Leased / Hired" options: (blank) · Owned · Leased · Hired. "+ Add row". Row behaviour: "Presumptive income" is auto-computed and overwritten by the engine (>12MT → 1000 × tonnage × months, else 7500 × months); per-row chargeable = max(presumptive, actual). Total → `it_c_44ae`.

### Particular: "35AD — Specified business profits"   [click ⋯ → opens: sf-c-35ad]
#### Drill-in: 35AD — Specified business profits (kind `brfree`; source: itr5.html:1264-1265) — free rows, section "Specified business". Total → `it_c_35ad`; also feeds the AMT ATI add-back.

### Particular: "Speculation business profit / (loss)"   [click ⋯ → opens: sf-c-spec]
#### Drill-in: Speculation business (kind `br`; source: itr5.html:1266-1269)
Note (verbatim): "Speculation profit / (loss) is kept separate: a speculation loss can be set off only against speculation profit."
Rows: Turnover `turnover` (**excluded from the total** — `skiptot`) · Profit / (Loss) — enter a loss as a negative figure `profit`. Sheet `it_c_spec` shows the profit figure; only a positive figure is added to BP — a loss is held out (`C.specLoss`) and never netted (:2088-2091).

### Particular: "Income chargeable under 'Business or Profession'" ⚙ `it_c_bp` [BP] — = Balance profit + 44AD + 44ADA + 44AE + 35AD + positive speculation (:2091) → JSON `ProfBusGain.ProfGainNoSpecBus`/`TotProfBusGain`, `CorpScheduleBP.IncChrgUnHdProftGain`.

---

Group head: **"Capital Gains"** [CG] — four particulars, all kind `cg` with identical structure:

### Particular: "Short Term Capital Gains u/s 111A (STT paid) — 20%"   [click ⋯ → opens: sf-c-stcg111a]
### Particular: "Short Term Capital Gains — at normal rate"   [click ⋯ → opens: sf-c-stcgoth]
### Particular: "Long Term Capital Gains u/s 112A (equity/units) — 12.5% over ₹1.25 lakh"   [click ⋯ → opens: sf-c-ltcg112a]
### Particular: "Long Term Capital Gains u/s 112 — 12.5%"   [click ⋯ → opens: sf-c-ltcg112]
#### Drill-in: Capital-gains popups (kind `cg`; registry itr5.html:1272-1279, DOM :1519-1535, compute :1940-1946, :2094-2112)
Per-popup notes (verbatim): sf-c-stcg111a "Equity shares / units of an equity-oriented fund on which STT is paid. Taxed at 20% for transfers on or after 23 July 2024." · sf-c-stcgoth "Short-term gains other than u/s 111A. Taxed at the firm's normal rate of 30%." · sf-c-ltcg112a "Equity shares / units on which STT is paid. Taxed at 12.5% on the gain exceeding ₹1,25,000. Indexation is not available." · sf-c-ltcg112 "Other long-term assets. Taxed at 12.5% without indexation for transfers on or after 23 July 2024."
Grids: section "Transactions" — headers: Asset | Date of acquisition | Date of transfer | Full value of consideration | Cost of acquisition | Cost of improvement | Transfer expenses. Asset options (11): (blank) · Land · Building · Land & Building · Equity shares · Preference shares · Units of an equity-oriented fund · Debentures / Bonds · Units of a debt fund · Jewellery · Goodwill · Other capital asset. Add: "+ Add transaction". gbar "Gross capital gain" (112A popup: "Gross LTCG u/s 112A" plus extra gbar "Less: Exemption — first ₹1,25,000"). Second grid: section "Deduction u/s 54 series" — headers: Section | Particulars | Amount; add-button "+ Add". Final gbar "Net capital gain chargeable" (112A: "Net LTCG u/s 112A chargeable") → sheet cells `it_c_stcg111a` / `it_c_stcgoth` / `it_c_ltcg112a` / `it_c_ltcg112`.
Note: the ₹1,25,000 112A exemption is applied at the **tax** stage (special-rate base), not to the income shown under the head (:2105-2107, :2144).

### Particular: "Income chargeable under 'Capital Gains'" ⚙ `it_c_cg` [CG] → JSON `CapGain.*` (ShortTerm20Per = 111A, ShortTermAppRate = other STCG, LongTerm12_5Per = 112A + 112, CapGains30Per115BBH = VDA income).

---

Group head: **"Income from Other Sources"** [OS]

### Particular: "Interest income"   [click ⋯ → opens: sf-c-os-int]
#### Drill-in: Interest income (kind `repeat`; source: itr5.html:1282-1284)
Headers: Name of the payer | TAN of the payer | Nature | Amount | TDS deducted. Nature options: (blank) · Interest from savings bank a/c · Interest from deposits (bank / post office / co-op) · Interest from income-tax refund · Interest on securities / bonds · Interest from others. "+ Add row". Total = Σ Amount → `it_c_os_int`.

### Particular: "Dividends"   [click ⋯ → opens: sf-c-os-div]
#### Drill-in: Dividends (kind `repeat`; source: itr5.html:1285-1287)
Headers: Name of the company / fund | Date of receipt | Amount | TDS deducted. Total → `it_c_os_div`.

### Particular: "Rental income — land, building, plant & machinery"   [click ⋯ → opens: sf-c-os-rent]
#### Drill-in: Rental income (kind `br`; source: itr5.html:1288-1290)
Section "Rental income chargeable under Other Sources" — rows: Gross rent received / receivable `rent` · Less: Repairs and insurance `repairs` (−) · Less: Depreciation `dep` (−) · Less: Other expenses u/s 57 `oth` (−). The "Less:" rows subtract (`neg`). Total → `it_c_os_rent`.

### Particular: "Winnings — lotteries, games, betting (115BB) — 30%"   [click ⋯ → opens: sf-c-os-win]
#### Drill-in: Winnings (kind `repeat`; source: itr5.html:1291-1294)
Note (verbatim): "No deduction or expenditure is allowed against winnings, and no loss can be set off against them."
Headers: Name of the payer | Nature | Amount | TDS deducted. Nature options: (blank) · Lottery · Crossword puzzle · Horse race · Card game / gambling · Online game u/s 115BBJ · Betting of any form · Other. Total → `it_c_os_win`.

### Particular: "Unexplained income u/s 68/69/69A-D (115BBE) — 60%"   [click ⋯ → opens: sf-c-os-bbe]
#### Drill-in: Unexplained income u/s 68 / 69 / 69A-D (kind `br`; source: itr5.html:1295-1298)
Note (verbatim): "Taxed u/s 115BBE at 60% plus a 25% surcharge on that tax and 4% cess (effective 78%). No deduction, expenditure or set-off is allowed."
Rows: 68 — Cash credits `s68` · 69 — Unexplained investments `s69` · 69A — Unexplained money, bullion, jewellery `s69a` · 69B — Investments not fully disclosed `s69b` · 69C — Unexplained expenditure `s69c` · 69D — Amount borrowed / repaid on a hundi `s69d`. Total → `it_c_os_bbe`.

### Particular: "Income from Virtual Digital Assets (115BBH) — 30%"   [click ⋯ → opens: sf-c-os-vda]
#### Drill-in: Income from Virtual Digital Assets u/s 115BBH (kind `repeat`; source: itr5.html:1299-1302, compute :2120-2123)
Note (verbatim): "Taxed at a flat 30%. Only the cost of acquisition is deductible, and a loss from one VDA cannot be set off against income from another."
Headers: Virtual Digital Asset | Date of acquisition | Date of transfer | Consideration | Cost of acquisition | Income. Row behaviour: "Income" is auto-computed (Consideration − Cost) and overwritten by the engine; a per-row loss is floored at 0 in the total. Total → `it_c_os_vda`; JSON `CapGains30Per115BBH`.

### Particular: "Other income"   [click ⋯ → opens: sf-c-os-oth]
#### Drill-in: Other income (kind `brfree`; source: itr5.html:1303-1304) — free rows "Particulars". Total → `it_c_os_oth`.

### Particular: "Income chargeable under 'Other Sources'" ⚙ `it_c_os` [OS] → JSON `IncFromOS` (OtherSrcThanOwnRaceHorse = int+div+rent+other; IncChargblSplRate = winnings+115BBE+VDA).

---

Group head: **"Total Income"**

### Particular: "Gross Total Income" ⚙ `it_c_gti` — = HP + BP + CG + OS (:2131) → JSON `TotalTI` / `GrossTotalIncome`.

### Particular: "Less: Brought forward losses set off" [CFL]   [click ⋯ → opens: sf-c-bfl]
#### Drill-in: Brought forward losses set off (kind `repeat`; source: itr5.html:1307-1310)
Note (verbatim): "A business loss may be carried forward for 8 assessment years; unabsorbed depreciation may be carried forward indefinitely. A speculation loss can be set off only against speculation profit."
Headers: Assessment Year | Type of loss | Brought forward | Set off this year | Carried forward. Type of loss options: (blank) · Business loss (other than speculation) · Speculation loss · Unabsorbed depreciation · Loss from House Property · Short term capital loss · Long term capital loss · Loss from specified business u/s 35AD · Loss from Other Sources. Total = Σ "Set off this year" → `it_c_bfl`; JSON `BroughtFwdLossesSetoff`.

### Particular: "Less: Deductions under Chapter VI-A" [VIA]   [click ⋯ → opens: sf-c-80]
#### Drill-in: Deductions under Chapter VI-A (kind `br`; source: itr5.html:1312-1315)
Note (verbatim): "Only the deductions available to a firm / LLP / AOP / BOI are listed. Deductions such as 80C, 80D and 80TTB are available only to an individual or HUF and do not apply here."
Section "Deductions allowable to a firm" — rows: 80G — Donations to certain funds and charitable institutions `s80g` · 80GGA — Donations for scientific research or rural development `s80gga` · 80GGC — Contribution to a political party `s80ggc` · 80-IA — Infrastructure undertakings `s80ia` · 80-IAB — SEZ development `s80iab` · 80-IAC — Eligible start-up `s80iac` · 80-IB — Specified industrial undertakings `s80ib` · 80-IC — Certain special category States `s80ic` · 80-ID — Hotels and convention centres `s80id` · 80-IE — North-Eastern States `s80ie` · 80JJA — Business of collecting and processing bio-degradable waste `s80jja` · 80JJAA — Employment of new employees `s80jjaa` · 80LA — Offshore banking units / IFSC `s80la` · 80P — Co-operative societies `s80p` · 80PA — Producer companies `s80pa`. Validation: capped at GTI − BFL (:2133). Total → `it_c_80`; JSON `PartCchapterVIA` / `TotDeductUndSchVIA`; feeds AMT ATI (all rows except 80P).

### Particular: "Total Income" ⚙ `it_c_ti` · "Total Income (rounded off u/s 288A)" ⚙ `it_c_ti_r` (nearest ₹10, :1906) → JSON `TotalIncome` / `AggregateIncome`; rail "Total Income".

### Particular: "Agricultural Income" [EI]   [click ⋯ → opens: sf-c-agri]
#### Drill-in: Agricultural Income (kind `br`; source: itr5.html:1199-1202)
Note (verbatim): "Agricultural income is exempt u/s 10(1). A firm is taxed at a flat rate, so there is no partial-integration of agricultural income with the slab — it is a disclosure only."
Rows: Gross agricultural receipts `gross` · Less: Expenditure incurred `expend` (−) · Less: Unabsorbed agricultural loss of earlier years `loss` (−). Total → `it_c_agri`; JSON `NetAgricultureIncomeOrOtherIncomeForRate` (with `RebateOnAgriInc` forced 0).

---

Group head: **"Tax on Total Income"** — *ITR-5-specific engine: flat 30% (no slabs, no 87A rebate, no 115BAC choice); surcharge 12% where TI > ₹1 crore with marginal relief; 115BBE bears its own 25% surcharge always; cess 4% (itr5.html:1898-1924)*

### Particular: "Tax at normal rate — 30%" ⚙ `it_c_tax_normal` (dynamic suffix `#lbl_c_rate` "— firm / LLP / AOP / BOI").

### Particular: "Tax at special rates (111A / 112 / 112A / 115BB / 115BBE / 115BBH)"   [click ⋯ → opens: sf-c-taxspecial]
#### Drill-in: Tax at special rates (kind `taxspecial`, fully computed; source: itr5.html:1319, DOM :1625-1640)
Note (verbatim): "Income taxed at a rate other than the firm's normal rate of 30%. The balance of the total income is taxed at the normal rate."
Grids: headers: (blank) | Income | Rate | Tax — ⚙ rows (verbatim, fixed rates): STCG u/s 111A (STT paid) 20% · LTCG u/s 112A over ₹1,25,000 12.5% · LTCG u/s 112 12.5% · Winnings u/s 115BB 30% · Unexplained income u/s 115BBE 60% · Virtual Digital Assets u/s 115BBH 30% · **Total income taxed at special rates** · **Balance taxed at the normal rate** 30%. No inputs. → sheet `it_c_tax_special`; JSON `TaxAtSpecialRates`, `IncChargeTaxSplRate111A112`.

### Particular: "Tax on Total Income" ⚙ `it_c_tax_ti` · "Add: Surcharge" ⚙ `it_c_sur` (dynamic label `#lbl_c_sur`: "@ 12% (total income over ₹1 crore)" / "— 25% on 115BBE tax" / "— not applicable") · "Less: Marginal relief" ⚙ `it_c_mrelief` · "Add: Health & Education Cess @ 4%" ⚙ `it_c_cess` · "Tax, Surcharge and Cess payable" ⚙ `it_c_tax_total`.

### Sub-head "Alternate Minimum Tax u/s 115JC"  *(ITR-5-specific)*

### Particular: "Adjusted Total Income for AMT" [AMT]   [click ⋯ → opens: sf-c-amt]
### Particular: "Less: AMT credit set off u/s 115JD"   [click ⋯ → opens: sf-c-amt]  *(same popup — shared drill, 2 triggers, UI-verified)*
#### Drill-in: Alternate Minimum Tax u/s 115JC (kind `amt`; source: itr5.html:1317, DOM :1599-1622, compute :2180-2208)
Note (verbatim): "AMT applies where the firm claims a deduction under Chapter VI-A (other than 80P), 80-IA to 80RRB, or 35AD. It does not apply where the adjusted total income does not exceed ₹20 lakh."
Section "Adjusted Total Income u/s 115JC" — ⚙ rows: Total Income as computed `amt_ti` · Add: Deductions claimed u/s 80-IA to 80RRB (except 80P) `amt_80` · Add: Deduction claimed u/s 35AD (net of depreciation allowable) `amt_35ad` · **input** "Add: Deduction claimed u/s 10AA" (`S.br["sf-c-amt"].s10aa`) · Adjusted Total Income `amt_ati` · AMT @ 18.5% of Adjusted Total Income `amt_base` · Add: Surcharge `amt_sur` · Add: Cess @ 4% `amt_cess` · AMT payable `amt_total` · Normal tax payable `amt_normal` · Tax payable (higher of the two) `amt_higher`.
Section "AMT credit u/s 115JD" — **input** "AMT credit brought forward" (`.cr_bf`) · ⚙ Credit set off this year `amt_cr_setoff` · Credit generated this year `amt_cr_gen` · Credit carried forward `amt_cr_cf`.
Conditional: AMT computed only when ATI > ₹20,00,000 AND (VI-A-except-80P or 35AD or 10AA claimed) (:2184). Sheet cells: `it_c_amt_ati`, `it_c_amt_tax` ("AMT @ 18.5% (+ surcharge & cess)"), `it_c_amt_credit`, "Tax payable (higher of normal tax and AMT)" ⚙ `it_c_tax_after_amt`. JSON `TaxPayableOnDeemedTI.*`, `CreditUS115JD`, `DeemedTotIncSec115JC`.

### Sub-head "Relief, prepaid taxes and interest"

### Particular: "Less: Relief u/s 90 / 90A / 91" [FSI/TR]   [click ⋯ → opens: sf-c-rel90]
#### Drill-in: Relief u/s 90 / 90A / 91 (kind `repeat`; source: itr5.html:1321-1323)
Section "Foreign tax credit" — headers: Country | Country code | Taxpayer Identification No. | Income from outside India | Tax paid outside India | Relief claimed under | Relief claimed. "Relief claimed under" options: (blank) · 90 · 90A · 91. Total = Σ "Relief claimed" → `it_c_rel90`; JSON `TaxRelief.Section90`/`TotTaxRelief`.

### Particular: "Less: TDS / TCS" [TDS]   [click ⋯ → opens: sf-c-tds]
#### Drill-in: TDS / TCS (kind `multirepeat`, 2 tables; source: itr5.html:1325-1331)
Table "TDS — Tax deducted at source" — headers: TAN of the deductor | Name of the deductor | Gross amount | Tax deducted | Tax claimed this year. Table "TCS — Tax collected at source" — headers: TAN of the collector | Name of the collector | Gross amount | Tax collected | Tax claimed this year. Each "+ Add row". Total = Σ "Tax claimed this year" over both tables → `it_c_tds`.
Discrepancy note: TCS "claimed" amounts are folded into the single `C.tds` figure (JSON `TaxesPaid.TDS`) while `TaxesPaid.TCS` is hard-coded 0 (:2212, :2577).

### Particular: "Less: Advance Tax" [IT]   [click ⋯ → opens: sf-c-adv]
#### Drill-in: Advance Tax (kind `repeat`; source: itr5.html:1333-1335)
Section "Advance tax paid" — headers: BSR Code | Date of deposit | Challan serial no. | Amount. Total → `it_c_adv`; JSON `TaxesPaid.AdvanceTax`.

### Particular: "Less: Self-Assessment Tax paid" [IT]   [click ⋯ → opens: sf-c-sat]
#### Drill-in: Self-Assessment Tax paid (kind `repeat`; source: itr5.html:1337-1339)
Section "Self-assessment tax paid" — same 4 headers. Total → `it_c_sat`; JSON `TaxesPaid.SelfAssessmentTax`.

### Particular: "Add: Interest u/s 234A / 234B / 234C + Fee u/s 234F"   [click ⋯ → opens: sf-c-234]
#### Drill-in: Interest u/s 234A / 234B / 234C and Fee u/s 234F (kind `i234`; source: itr5.html:1341, DOM :1643-1660, compute :2217-2229)
Note (verbatim): "234A: 1% per month on unpaid tax from the due date to the date of filing. 234B: 1% per month where advance tax paid is less than 90% of the assessed tax. 234F: ₹5,000, or ₹1,000 where total income does not exceed ₹5 lakh."
Section "Filing details": inputs "Due date of filing" (`.duedate`, DD/MM/YYYY) · "Actual / expected date of filing" (`.filedate`) · ⚙ "Months of delay" `i234_months` (part month = full month).
Section "Interest and fee": ⚙ "Assessed tax (tax payable less TDS/TCS and relief)" `i234_assessed` · ⚙ "Interest u/s 234A" `i234_a` · ⚙ "Interest u/s 234B" `i234_b` · input "Interest u/s 234C — enter if computed separately" (`.c_override`) · ⚙ "Late filing fee u/s 234F" `i234_f` (₹5,000, or ₹1,000 when TI ≤ ₹5,00,000; 0 when no delay) · ⚙ "Total interest and fee" `i234_total` → sheet `it_c_int_total`; JSON `IntrstPay.*`.

### Particular: "Balance Tax Payable / (Refund)" ⚙ `it_c_balance` — = tax after AMT − relief − TDS − advance − SAT + interest (:2231); rail "Balance tax"; JSON `BalTaxPayable` / `Refund.RefundDue`.

### Sub-head "Disclosures"

### Particular: "Incomes fully exempt" [EI]   [click ⋯ → opens: sf-c-ei]
#### Drill-in: Incomes fully exempt (Schedule EI) (kind `br`; source: itr5.html:1205-1207)
Section "Exempt income" — rows: Agricultural income `agri` · Share of profit from a firm / AOP / BOI u/s 10(2A) `share` · Exempt dividend `div` · Exempt interest `int` · Exempt long-term capital gain `ltcg` · Pass through income claimed exempt `pti` · Any other exempt income `oth`. Total → `it_c_ei`. (See the sf-pti auto-fill discrepancy above — this table is manual.)

### Particular: "Footnotes / Pending issues"   [click ⋯ → opens: sf-c-notes]
#### Drill-in: Footnotes / Pending issues (kind `brfree`, no total target; source: itr5.html:1210-1211) — free rows (description + Amount), section "Footnotes", "+ Add row". Status `st_c_notes`.

### Particular: "List of documents"   [click ⋯ → opens: sf-c-docs]
#### Drill-in: List of documents (kind `brfree`, no total target; source: itr5.html:1212-1213) — free rows, section "Documents". Status `st_c_docs`.

### Particular: "Prepared by" / "Approved by"
| Prepared by | text | — | — | — | blank | No | — | — | `cmp_preparedby` | — (not in state `S`, not exported) |
|---|---|---|---|---|---|---|---|---|---|---|
| Approved by | text | — | — | — | blank | No | — | — | `cmp_approvedby` | — (not in state `S`, not exported) |

---

## Popup: Export JSON (`sf-export`, itr5.html:1664-1667, 2631-2660)

Opened by top-bar "Export JSON". Title (verbatim): "Export JSON — ITR-5, A.Y. 2026-27". Two states:
- **Blocked** — red note "The portal will reject the file until these are fixed:" + one row per `preflight()` failure (13 possible, verbatim): PAN of the firm is missing or malformed (AAAAA9999A) — client bar · Name of the assessee is blank — client bar · Date of formation is missing or not DD/MM/YYYY — client bar · e-Mail ID is missing — Assessee info. · Mobile no. is missing — Assessee info. (Secondary Contact details) · Address: Area / Locality is blank — Assessee info. · Address: District / City is blank — Assessee info. · Address: Flat / Door No. is blank — Assessee info. · Verifier name is blank — Verifier info. · Verifier father's name is blank — Verifier info. · Verifier PAN must be an individual PAN (4th character 'P') — Verifier info. · Place of signing is blank — Verifier info. · Section under which the return is filed is not selected — ITR filing info.
- **Ready** — green note "Ready. Every field required by the ITR-5 schema (AY 2026-27, Ver1.0) is present.", section "Download" with link "⬇ {PAN}_2026_ITR5.json", section "Preview" (first 4000 chars).
Discrepancy note: `exportJSON()` reads `document.getElementById("exp-panel")` which does not exist (unused variable — harmless). And per the Assessee discrepancy above, the Ready state is unreachable from the UI (no Area/Flat inputs exist).

## ITR-5-specific computation additions (vs the shared Computation Sheet)

- Partner add-back (`sf-c-partpl`) + section 40(b) allowable-ceiling working (`sf-c-40b`): interest cap 12% p.a., remuneration ceiling 90% of first ₹6,00,000 (floor ₹3,00,000) + 60% of balance; Book profit → Balance profit chain.
- Flat firm rate 30% — no slabs, no basic exemption, no 87A rebate, no 115BAC regime (engine comment :1898-1902).
- Surcharge 12% where TI > ₹1 crore, with marginal relief; 115BBE 25% surcharge applies regardless of income level; cess 4%.
- AMT u/s 115JC @ 18.5% (ATI = TI + VI-A-except-80P + 35AD + 10AA; ₹20 lakh threshold) + 115JD credit set-off/generation/carry-forward.
- TPSA — Tax paid u/s 92CE (18% + 12% surcharge + 4% cess working with deposit challans).
- Speculation segregation (loss never netted against normal BP); VDA per-row loss floor; agricultural income disclosure-only (no partial integration).
- Comp lines fed by this tool's fields: `it_c_hp`, `it_c_bp` (via `it_c_npbt` → `it_c_bp_adj` → `it_c_bookprofit` → `it_c_balprofit`), `it_c_cg`, `it_c_os`, `it_c_gti`, `it_c_ti`/`it_c_ti_r`, `it_c_tax_normal`/`it_c_tax_special`/`it_c_tax_total`, `it_c_tax_after_amt`, `it_c_balance`.

## Consolidated discrepancy list

1. Pre-flight demands "Area / Locality" and "Flat / Door No." (`a.area`, `a.flat`/`a.residence`) — no UI field binds them; export can never pass through the UI (itr5.html:2619/2621 vs registry :947-951).
2. Full B/S and P&L figures are not overlaid onto JSON `PARTA_BS`/`PARTA_PL` (schema-skeleton zeros remain); only `NoBooksOfAccBS` + a few `CorpScheduleBP` leaves are populated.
3. Captured but never exported: Partners/Members details, PTI (115U/UA/UB), Other Audits, Nature of Business, GSTR turnover, Business start date, Return Type, other-firm details, Unlisted Equity Shares, all 9 FA tables, LEI, Prepared/Approved by.
4. `SEC_CODE` lacks 139(8A)/139(9)/153A/153C/119(2)(b) — those selections silently emit IncomeTaxSec 11 (:2420).
5. sf-pti note promises auto-fill into "Incomes fully exempt" — no such code path exists.
6. HP "Standard rent" input is unused in the GAV formula (:1973).
7. TCS claimed is folded into the TDS total; JSON `TaxesPaid.TCS` hard-coded 0.
8. `exportJSON()` references non-existent `#exp-panel` (unused; harmless).
9. `sf-c-amt` popup is shared by two sheet rows (ATI and AMT-credit) — 98 triggers vs 97 popups.
10. Top-bar pill stays "Partnership Firm" when Status is changed (rail chip does update).
11. Profit particulars "Gross receipts" (`pp_gr`) plays no part in the Net-profit calc (informational).
12. Breakups that write into sheet inputs (Trade Creditors, Trade Debtors, Other Provisions, Deposits and loans) only push when the total is non-zero — reducing a breakup back to zero does not clear the sheet figure (:2268-2274).
13. 44ADA warning triggers only above ₹75 lakh regardless of the cash-receipts share the note describes (:2069).

## Proof of coverage (re-walk)

All 97 registry popups documented: sf-assessee, sf-verifier, sf-bank, sf-partners, sf-rep, sf-pti, sf-otheraudit, sf-nob, sf-gst, sf-92ce, sf-othfirm, sf-unlisted, sf-lei, sf-fa_dep, sf-fa_eq, sf-fa_ins, sf-fa_fin, sf-fa_imm, sf-fa_oca, sf-fa_sig, sf-fa_trusts, sf-fa_oth, sf-othres, sf-tradecr, sf-othcl, sf-othprov, sf-lti, sf-deploans, sf-sti, sf-invoth, sf-tradedr, sf-othca, sf-addl, sf-m_dirx, sf-m_foh, sf-t_oor, sf-t_duties, sf-t_dirx, sf-t_taxin, sf-t_intra, sf-t_fno, sf-p_oi, sf-e_ins, sf-e_prov, sf-e_sal, sf-e_taxes, sf-e_oth, sf-fgnpay, sf-baddebt, sf-c-hp, sf-c-hp-pti, sf-c-partpl, sf-c-36, sf-c-37, sf-c-40, sf-c-40a, sf-c-43b, sf-c-deemed, sf-c-icds, sf-c-othheads, sf-c-notcredit, sf-c-otheradd, sf-c-35to35e, sf-c-exempt, sf-c-sep, sf-c-othded, sf-c-depit, sf-c-40b, sf-c-44ad, sf-c-44ada, sf-c-44ae, sf-c-35ad, sf-c-spec, sf-c-stcg111a, sf-c-stcgoth, sf-c-ltcg112a, sf-c-ltcg112, sf-c-os-int, sf-c-os-div, sf-c-os-rent, sf-c-os-win, sf-c-os-bbe, sf-c-os-vda, sf-c-os-oth, sf-c-bfl, sf-c-80, sf-c-agri, sf-c-taxspecial, sf-c-amt, sf-c-rel90, sf-c-tds, sf-c-adv, sf-c-sat, sf-c-234, sf-c-ei, sf-c-notes, sf-c-docs — plus 12 auto-generated `-detail` level-2 popups (partners, unlisted, 9× FA, c-hp) and the `sf-export` popup. Every sheet row of all four panes (235 `.itr` rows) is accounted for above; UI-walk confirmed tab switching, drill opening, all conditional reveals, live totals and the export pre-flight.

