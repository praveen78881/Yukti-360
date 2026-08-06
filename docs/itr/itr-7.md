# ITR-7 — Trusts / Societies / Section-8 / Institutions

> Applicable: persons filing u/s 139(4A)–(4D) — charitable/religious trusts, institutions, political parties, research bodies. File: `public/tax-utilities/itr7.html` (A.Y. 2026-27 only, ~737 KB, 12,357 lines). Lines below are into that file.

## Layout
Scroll-to-section tabs (**not** `data-tab`) at `:148`: **ITR Info** (`sec-itrinfo`), **ITR B/S** (`sec-bs`), **Form 10B** (`sec-10b`), **Form 10BB** (`sec-10bb`), **Computation** (iframe `#compFrame` `:439`, whose doc lives in `<script id="calcdoc">` `:441-10623`). One state object `S` (`newSheet()` `:10831`); fields carry `data-k`/`data-b`; drill-ins keyed `data-sf` defined in `SF={}` (`:10923+`). Client bar (`:160`): `cl_name`, `cl_pan`, `cl_dof` (date of formation), `cl_res`.

## 1. Info Sheet (`sec-itrinfo`, `:171-220`)
**Basic (`:175`):** `sf-assessee`, `sf-verifier`, `sf-bank`(+). **Trust info (`:180`):** `q.vcf` (VC fund?), `sf-trustees` (trustees + beneficial owners + 13(3)(b) substantial contributors + relatives), **`sf-reg`** (registrations/approvals — `REG_SECS` `:10712`: 12A/12AA/12AB, 10(23C)(iv/v/vi/via), 10(46), 80G(5), 35(1)(ii)/(iia)/(iii), 13A/13B, …), `sf-proj` (projects), `sf-s1310` (13(10) auto-derived), `sf-otherinfo` (GPU? change in objects? first return?). **Filing (`:188`):** `sec` — **139(4A)/(4B)/(4C)/(4D)**, `ret` (Original/Revised/Modified), `sf-rep`. **Income info (`:193`):** `sf-accum` (accumulation 11(2)→Sch I/IA), `sf-deemed` (deemed application Expln.1 to 11(1)→Sch D/DA), `sf-pti`. **Audit (`:198`):** `sf-audit`. **Business (`:201`):** `sf-nob`, `sf-odb` (Sch OA). **Funds & Investments (`:206`):** `sf-corpus` (J(A1)/R), `sf-lb` (loans J(A2)), `sf-cinv` (corpus invested 11(5) J(B)), `sf-subst` (13(3) concern J(C)), `sf-othinv` (J(D)), `sf-vckind` (contributions in kind J(E)). **Other (`:214`):** `q.partner`, `q.unl`, `sf-lei`.

## 2. Income / Application entry
- **115TD accreted income** (`sec-115td` `:224`): `td.fmv/liab/net`, `sf-fmv`, additional tax at MMR, interest 115TE, `sf-taxpaid` challans.
- **Foreign Assets** (`sec-fa` `:242`, Sch FA): `fa.on` + 9 `sf-fa_*`.
- **Income details** (`sec-inc` `:260`): **Donations Domestic (Sch VC)** — anonymous `vc.anon`, corpus `vc.c80g`(80G(2)(b) renovation)+`vc.coth`, other-than-corpus `vc.gov/csr/spec/oth`; **Foreign Contribution** `fc.*`; **Income other than donation (Sch AI)** — `ai.main/inc/rent/comm/div/int/cons` + `sf-othinc`, agri `ai.agri`.
- **Application of income** (`sec-app` `:302`, Sch A, Revenue/Capital two-column): **A. Expenditure** (`sf-noncorp` 85%-application, charitable heads `ap.rel/poor/edu/yoga/med/env/mon/gpu` each Revenue/Capital, `ap.asset` 11(1A), `sf-othexp`); **B. Not allowed** (`sf-bdon`, outside-India `ap.appr/nappr` per 11(1)(c), other-than-objects `ap.obj`); **C. Sources of Fund** (`ap.ci` income of PY vs earlier accumulation `ap.acc`/deemed `ap.deem`/15% `ap.p15`/corpus `ap.corp`/borrowed `ap.bor`); **D. Net (A−B−Cii)** → **amount allowed as application** `alw_r/alw_c`.
- Business income (if any) entered on the Computation iframe (BP head, presumptive/P&L ladder `:619`).

## 3. Drill-in Schedules (`SF` map `:10923-11557`, **+Add** noted)
Info/master: `sf-bank`(+), `sf-trustees`(+ trustees/benef/substc/relatives), `sf-reg`(+ regIT/regOth), `sf-proj`(+), `sf-pti`(+), `sf-audit`(+), `sf-nob`(+), `sf-corpus` (J(A1)/R, 6-purpose grid + invested-back/taxed +), `sf-lb`(+ loans/repay), `sf-cinv`(+), `sf-subst`(+), `sf-othinv`(+), `sf-vckind`(+), `sf-lei`, `sf-fmv`, `sf-taxpaid`(+), 9× `sf-fa_*`(+). **Accumulation** `sf-accum` (Sch I/IA — 6-FY grid: accumulated/applied/credited/invested 11(5)/not-utilised/deemed 11(3) + earlier-years-taxed grid). **Deemed application** `sf-deemed` (Sch D/DA — 7-FY grid + 11(1B)). Two-list Revenue+Capital popups `sf-othexp/bothers/othsrc`(+). **Form 10B/10BB** (`sec-10b` `:383`, `sec-10bb` `:401`): annexure + schedule lists built from catalogs `B10A/B10S/BBA/BBS` (`:11497`) — full clause set (SP-a…SP-h specified-person violations, 269SS/ST/T, 40(a)(ia)/40A(3), 115BBI) via ~45 generic `sf-g-*` tables.

## 4. Computation Sheet (iframe `calcdoc`, `:441-10623`)
Heads (HP, Business/Profession, CG, OS) then **`it_1113` "Taxable Income u/s 11 to 13"** (`:705`, drill `sf-1113`). The `sf-1113` popup: aggregate income − application (rev/cap/loan) − corpus donations − 11(2) accumulation − 15% accumulation `x1113_acc15` − 15% of non-corpus donations `x1113_nc15` → income after application; **Additions**: corpus not invested per 11(5), 40(a)(ia)/40A(3), 11(1B)/11(3)/Expln.3B/12(2)/13(1)(c)/13(1)(d), **115BBI**, **115BBC** → `x1113_total` (`compute1113()` `:3558`). Then Ch VI-A → **`it_totalIncome`** → **`it_taxOnTI`** → relief 90/91 → AMT 115JC/JD → prepaid → interest 234A/B/C+F → **`it_balancePayable`**.
**Tax = AOP rates** (`:3545`): normal income via AOP slab; **115BBI @30%** + **115BBC @30%** taxed separately (`:3586`); surcharge 10/15/25/37% (New cap 25%) + 115BBE +25%; **cess 4%**. Parent→iframe bridge (`:10629`) feeds the 85%/15% application maths.

## 5. JSON mapping (`buildITR7Json` `:12027`)
Shape **`{ ITR: { ITR7: {…} } }`**. `Form_ITR7` (`:12081`): AssessmentYear `2026`, **SchemaVer `Ver1.0`**, FormVer `Ver1.0`. `CreationInfo.SWCreatedBy` `SW10000000`. Blocks emitted: `PartA_GEN1.OrgFirmInfo` (name/PAN/address/`DateOFFormOrIncorp`/`StatusOrCompanyType:'5'`/`ReturnFurnishedSec`←MAP_RETSEC[sec] e.g. `139-4A`/`SecExemptionClaimed:'11'`), `FilingStatus` (`ReturnFileSec`←MAP_RETTYPE, residential, flags), `PartA_GEN2`, **`PARTA_BS`** (OwnFund/Corpus80G/borrowings/application — schema spellings preserved incl. "Investements","Proviosions"), **`ScheduleVC`** (Local/Foreign/AnonymousDonations 115BBC), **`ScheduleAI`**, **`PartB_TI`** (VcCorpusSec11/AggregateIncomeUs1112/IncToBeApplied/TIDeductions/TIAdditions/TotalTI/DonationsUs115BBC), `PartB_TTI`, `Verification` (`AssesseeVerPAN` must be individual). Export `exportJson()` (`:12327`) blocks on any severity-E error; filename `{PAN}_ITR7_AY2026-27.json`.

## 6. Validation (`validateITR7` `:11941`)
Returns `{sev:'E'|'W',…}`; **E blocks export**. ERRORS: name (≤125), PAN, date of formation, filing section (in MAP_RETSEC), return type, residential status, full address (flat/area/town/state/PIN/mobile/email), verifier name+father+**PAN individual (4th char 'P')**+capacity+place+date, ≥1 bank with valid IFSC, **≥1 account ticked for refund**, partner/unlisted answered. WARNINGS: B/S doesn't tally; no registration/approval entered (trust claiming 11/12 normally needs 12A/12AB or 10(23C)). Click-to-navigate to the offending subform.

## 7. Add options
`bank, trustees, benef, substc, relatives, regIT, regOth, proj, pti, auditOth, nob, corp_inv, corp_tax, loans, loan_rep, cinv, subst, othinv, vckind, challan, 9×fa_*, oca`, the two-list `*_r/_c` bases, `othinc`, all 10B/10BB obs/foot, ~45 generic `sf-g-*` tables. Fixed-row grids: accum/deem/corpus/fmv/ownf.

## 8. Gaps / TODO (as-is)
1. **JSON tax block is stubbed** — `buildITR7Json` hardwires all of `PartB_TTI.ComputationOfTaxLiability`, `TaxPaid`, `Refund.RefundDue`, and `PartB_TI.CapGain/ProfBusGain/IncFromOS` to **0** (`:12228`). The live tax/surcharge/cess/234-interest computed in the iframe is **never written back** — an exported return would carry income/application/BS/VC/AI but **zero tax liability and zero taxes paid**.
2. **Taxable-income u/s 11-13 divergence** — `it_1113`/`x1113_total` (115BBI/115BBC/13(1)(c)/(d) additions) computed in iframe, but `PartB_TI.totalTI` uses a simpler `agg−ded+anon` formula (`:12057`); the two can diverge.
3. **Schedule J/I/D/DA/Corpus/PTI/FA/115TD/LA not emitted** — rich drill-in data captured in `S` but not serialized (builder covers only VC, AI, PartA_BS, PartB_TI/TTI, Verification).
4. **115TD not exported** (`NetTaxPyblOn115TDInc:0`).
5. **Forms 10B/10BB are UI-only** — no 10B/10BB JSON generator here.
6. Enum lossiness (`MAP_ACCTTYPE` collapses to SB/CC/OD, "Other"→SB); `SecExemptionClaimed:'11'` & `StatusOrCompanyType:'5'` hardcoded regardless of 139(4A)-(4D) clause.
7. Validation is entry-level only — no Sch A tally, no 85%/15% consistency, no 115TD math.

Net: complete data-entry + live computation front-end, but **JSON export is partial** (identity/address/BS/VC/AI/high-level PartB_TI + zeroed tax scaffolding) — not yet a full ITD-uploadable ITR-7 for tax, CG and the J/I/D schedule family.
