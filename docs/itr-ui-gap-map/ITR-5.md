# ITR-5 — UI GAP MAP (path to 100% schema-complete offline export)
Coverage now: AY2026-27 ~23% · AY2025-26 ~20% (proxy). Target 100%.

> **Scope.** Blueprint to make 100% of REQUIRED ITD-schema leaves for ITR-5 (firms / LLP / AOP-BOI / co-op / AJP) producible → valid complete JSON → offline export → direct ITD upload. Each not-yet-fillable required node is mapped to WHERE in the UI it must be produced or wired.
>
> **AY note (read first).** Only **one** ITR-5 file ships and it is a native **AY 2026-27** build (`Form_ITR5.AssessmentYear="2026"`, `SchemaVer=Ver1.0`). The **AY 2025-26 row throughout this document is a STRUCTURAL PROXY** — the same emitter scored against the 2025 tree, not a real 2025 build. Every 2025 count is indicative only; a genuine 2025-26 filing would additionally need the two updated-return schedules the 2026 schema dropped (**PartB-ATI** 19 req, **PartA_139_8A** 12 req) and the pre-Finance-Act-2024 capital-gains rate buckets (`ShortTerm15Per`/`LongTerm10Per`/`LongTerm20Per`) — our build emits the 2026 buckets, which are **structurally wrong** against the 2025 schema.
>
> **Baseline.** `buildITR()` (itr5.html:2422) is a *skeleton + identity* emitter: ~430 leaves written, only **41 non-zero** (Form / CreationInfo / GEN1 / Verification identity + a handful of BP/TI/TTI leaves). PARTA_BS, PARTA_PL, CorpScheduleBP, PartB-TI, PartB_TTI ship as **all-zero skeletons**. Every income-head / loss / deduction / tax-credit schedule is **unwritten**. The **Partners/Members roster (PartA_GEN2.PartnerOrMemberInfo / PrevYrMemPart)** is fully keyed in the UI's Partners grid but dropped — a firm return is **invalid** without it.
>
> **Classification legend.** **A** = mis-key / shape (we emit it, wrong key/enum/shape) · **B** = compute-and-export (calc-derived total, no new user input — engine already computes the value, just needs serialisation) · **C** = captured-but-not-exported (a real UI drill-in/grid/pane already collects it; `buildITR` never serialises it) · **D** = missing UI (no surface collects it — needs new PARENT pane + drill-in + fields).
> **USER-INPUT nodes = C + D. COMPUTE-ONLY nodes = A (re-map) + B.**

---

## A. Mis-key / shape fixes — our path → schema path | schedule | #req

These are already emitted (or defaulted) but under a wrong key, wrong enum value, or wrong shape; the portal validator will reject them. Fix in `buildITR`/mapping tables — **no new UI**.

| # | our path (buildITR) | schema path | schedule | issue / fix | #req |
|---|---|---|---|---|---|
| A1 | `O.Address.StateCode = a.statecode \|\| "99"` (:2450) | `PartA_GEN1.OrgFirmInfo.Address.StateCode` | PartA_GEN1 | emits `"99"`/`"01"` fallback; schema enum is `01..06`-style state list — no UI state select exists → also needs a field (see D). Re-map to valid StateCode. | 1 |
| A2 | `O.Address.CountryCode = "91"` (:2451) | `…Address.CountryCode` | PartA_GEN1 | hard-codes `"91"`; schema enum is `93\|1001\|355\|213\|684\|376…` (India = `93`, not `91`). Re-map. | 1 |
| A3 | `SEC_CODE` lacks 139(8A)/139(9)/153A/153C/119(2)(b) (:2420) | `FilingStatus.ReturnFileSec.IncomeTaxSec` (enum `11\|12\|13\|14\|16\|17`) | PartA_GEN1 | those 5 UI options silently emit code `11`. Add codes (17 = 139(8A) etc.). | 1 |
| A4 | `TP.TaxesPaid.TCS = 0` (:2577) while TCS grid folded into `C.tds` (:2212) | `PartB_TTI.TaxPaid.TaxesPaid.TCS` + `ScheduleTCS` | PartB_TTI / TCS | TCS "claimed" is mis-routed into TDS total and TCS zeroed. Split TCS out (also feeds ScheduleTCS in C). | 1 |
| A5 | `B.DepreciationAllowUs32_1_i = 0` hard-coded (:2501) | `CorpScheduleBP…DepreciationAllowUs32_1_i` | CorpScheduleBP | always 0; the `sf-c-depit` block grid distinguishes additions <180d — split the allowance instead of dumping all into `_1_ii`. | 1 |
| A6 | `O.Address.ResidenceNo/LocalityOrArea = "NA"` (:2447-2448) | `…Address.ResidenceNo`, `.LocalityOrArea` | PartA_GEN1 | defaulted `"NA"` because **no UI field binds `a.flat`/`a.area`** — preflight (:2619,2621) then blocks export. Shape-valid but placeholder; needs real fields (see D1) — export is **unreachable today**. | 2 |

**A total ≈ 7 nodes** (mostly re-map; A6 straddles into D). AY2025 adds the CG rate-bucket re-key (`ShortTerm20Per`→`ShortTerm15Per` etc., 3 nodes) if a 2025 build is ever cut.

---

## B. Compute-and-export — schema nodes | source | #req

Engine already derives these (values live in the `C.*` compute object / `computeAll()` at itr5.html:2259+); they currently reach the JSON only as the **zero skeleton** or not at all. No user input — wire the computed value into the (already-present) leaf, or add the sub-total leaf. **COMPUTE-ONLY.**

| schedule | schema nodes (source `C.*`) | source | #req |
|---|---|---|---|
| **PartB-TI** | full head roll-up (`IncomeFromHP`←`C.hp`, `ProfBusGain`←`C.bp`, `CapGain.*`←`C.cg/stcg/ltcg`, `IncFromOS`←`C.os`, `TotalTI`/`GTI`←`C.gti`, VIA `PartCchapterVIA`←`C.ded80`, `TotalIncome`←`C.ti`, agri, `CurrentYearLoss`, `BalanceAfterSetoff`, `LossesOfCurrentYearCarriedFwd`) | computeAll (already partly wired :2513-2540; fill remaining zero leaves) | 36 |
| **PartB_TTI** | tax-liability chain (`TaxAtNormalRates`←`C.normalTax`, special, surcharge/marginal, cess, `GrossTaxLiability`, `CreditUS115JD`, relief, `NetTaxLiability`, 234A/B/C+234F, `AggregateTaxInterestLiability`, `TaxesPaid.*`, `BalTaxPayable`/`RefundDue`) | already wired :2542-2581; complete the 9 reqMISS totals | 41 (9 miss) |
| **CorpScheduleBP** | the full add-back → book-profit → deemed-profit derivation (`ProfBfrTaxPL`←`C.pbt`, disallowances ←`brTot()`, `DepreciationAllowITAct32`←`C.depit`, deemed profits 44AD/ADA/AE, `IncChrgUnHdProftGain`←`C.bp`, set-off) | computeAll BP block; wire remaining 9 miss + real (non-zero) values | 114 (9 miss) |
| **ScheduleCYLA** | current-year inter-head loss set-off matrix | derived from head incomes + `C.specLoss` | 35 |
| **ScheduleBFLA** | brought-forward-loss set-off matrix (post-CYLA) | derived from `sf-c-bfl` grid (C) + head incomes | 67 |
| **ScheduleDEP** | depreciation summary roll-up (DPM+DOA totals) | from `sf-c-depit` block grid (C) | 10 |
| **ScheduleDCG** | capital gains on sale of depreciable assets | from block-grid sale rows | 10 |
| **ScheduleSI** | special-rate income & tax summary | `taxspecial` popup (fully computed) | 6 |
| **ScheduleAMT** | 115JC adjusted-total-income & AMT | `sf-c-amt` (computed; small inputs → C) | 9 |
| **ScheduleAMTC** | 115JD credit set-off/generation/carry-fwd | `sf-c-amt` credit block (computed + `cr_bf` input→C) | 19 |

**B total ≈ 347 nodes** (dominated by the five zero-skeleton blocks BP/TI/TTI + the loss-set-off matrices). These convert quickly — the arithmetic exists; only serialisation is missing.

---

## C. Captured-but-not-exported — schema schedule | EXISTING drill-in/pane (verbatim) | binds | #req

The data IS collected by a real UI surface today; `buildITR` never serialises it. **Highest value — the input work is already done; needs a mapper.** **USER-INPUT.**

| schema schedule | EXISTING UI surface (verbatim catalog name) | binds (verbatim) | #req |
|---|---|---|---|
| **PartA_GEN2 — Partner/Member roster** ⚠ TOP BLOCKER | "Partners/Members details" master-detail (`sf-partners` + `sf-partners-detail`) | row `.name/.pan/.pct/.remun/.rate/.admitted/.retired/.aadhaar/.addr/.city/.state/.pin/.country/.status` | ~18 (`PartnerOrMemberInfo[]`) |
| PartA_GEN2 — `PrevYrMemPart` | same Partners detail (Admitted on ^ / Retired on ^) | `.admitted`, `.retired`, `.name`, `.pan`, `.pct`, `.remun` | 6 |
| PartA_GEN2 — `AuditReportDetails[]`/`AuditDetails[]` | "Other Audits (excluding u/s 44AB)" (`sf-otheraudit`, 2 tables) | Section / Date / Ack no. / Whether furnished / Act | ~8 |
| PartA_GEN2 — `NatOfBus.NatureOfBusiness[]` | "Nature of Business / Profession" (`sf-nob`, 4 tables) | Sector / Sub-sector / Code / Trade name / Description | 1+ |
| **PARTA_BS** — full balance sheet | "ITR B/S" pane (`data-pane="p-bs"`) + 10 breakup popups | `l_cap`, `l_genres`, `l_sec_*`, `l_uns_*`, `l_cl_*`, `a_fa_*`, `a_la_*`, `a_ca_*`, `it_totlia`, `it_totass` (+ breakup rows) | 98 (4 miss) |
| **PARTA_PL** — full P&L | "ITR P&L" pane (`data-pane="p-pl"`) + P&L A/c breakups | `e_*` (34 expense rows), `it_p_oi`, `it_e_ins/sal/prov/taxes/oth`, `it_pbit/pbt/pat`, `it_balbs` | 137 (24 miss) |
| **ManufacturingAccount** | ITR P&L → "ITR Manufacturing A/c" block (`#mfgblk`) | `m_os_*`, `m_pur`, `m_wages`, `it_m_dirx/foh/cogp`, `m_cs_*` | 6 |
| **TradingAccount** | ITR P&L → "ITR Trading A/c" head | `t_sale_goods/serv`, `t_prof`, `it_t_oor/duties/dirx/taxin/cop/gp`, `t_cs_fg`, intraday/F&O | 11 |
| **ScheduleHP** | Computation → "Property-1:" (`sf-c-hp` + `-detail`) + HP-PTI | row `.addr/.type/.share/.rent/.munval/.fairrent/.muntax/.interest/.arrears`; `sf-c-hp-pti` | 31 |
| **ScheduleCG** (transaction level) | 4 CG popups `sf-c-stcg111a/stcgoth/ltcg112a/ltcg112` (kind `cg`) | Asset / dates / consideration / cost / improvement / transfer-exp + 54-series grid | 261 (partial — see D for 112A/115AD scrip-wise & set-off matrix) |
| **ScheduleOS** | 7 OS popups (`sf-c-os-int/div/rent/win/bbe/vda/oth`) | payer / TAN / nature / amount / TDS per grid | 102 |
| **ScheduleVDA** | "Income from Virtual Digital Assets (115BBH)" (`sf-c-os-vda`) | VDA / acq date / transfer date / consideration / cost / income | 8 |
| **ScheduleCFL** | "Brought forward losses set off" (`sf-c-bfl`) | AY / Type of loss / Brought forward / Set off / Carried forward | 31 |
| **ITRScheduleUD** (unabsorbed dep) | same `sf-c-bfl` (Type = "Unabsorbed depreciation") | AY / bfwd / setoff / cf | 18 |
| **ScheduleDPM** (plant & machinery) | "Depreciation as per IT Act" block grid (`sf-c-depit`, kind `dep`) | Block / Rate% / Opening WDV / Additions ≥180/<180 / Sale / Dep / Closing | 59 |
| **ScheduleDOA** (other assets) | same `sf-c-depit` (Building/Furniture/Intangible blocks) | as above | 98 |
| **ScheduleVIA** | "Deductions under Chapter VI-A" (`sf-c-80`, kind `br`) | `s80g/s80gga/s80ggc/s80ia…s80pa` (lump per section) | 6 |
| **ScheduleIT** | "Advance Tax" (`sf-c-adv`) + "Self-Assessment Tax" (`sf-c-sat`) | BSR Code / Date / Challan no. / Amount | 5 |
| **ScheduleTDS2 / TDS3** | "TDS / TCS" (`sf-c-tds`, table 1) | TAN / Name / Gross / Tax deducted / claimed this year | 6 / 6 |
| **ScheduleTCS** | "TDS / TCS" (`sf-c-tds`, table 2) | TAN / Name / Gross / Tax collected / claimed | 5 |
| **ScheduleFA** (all 9 tables) | "Foreign Assets & Incomes" group — `sf-fa_dep/eq/ins/fin/imm/oca/sig/trusts/oth` (kind `md`) | country/institution/account/peak/closing/income per table | 108 |
| **ScheduleFSI** | "Relief u/s 90/90A/91" (`sf-c-rel90`) | Country / code / TIN / Income outside India / Tax paid / relief | 23 |
| **ScheduleTR1** | same `sf-c-rel90` (relief-claimed-under 90/90A/91) | Relief claimed under / Relief claimed | 9 |
| **SchedulePTI** | "Pass Through Income u/s 115U/UA/UB" (`sf-pti`) + `sf-c-hp-pti` | Trust/Fund / Income / TDS / PAN / Head / Investment Entity | 54 |
| **ScheduleEI** | "Incomes fully exempt" (`sf-c-ei`) + "Agricultural Income" (`sf-c-agri`) | `agri/share/div/int/ltcg/pti/oth` | 11 |
| **ScheduleIF** (partner-in-firms) | "Details of other Firms" (`sf-othfirm`) | Name of Firm / PAN / % of share | 10 |
| **ScheduleGST** | "Turnover/Gross Receipts reported in GSTR" (`sf-gst`) | GSTIN / Outward supplies | 2 |
| **ScheduleTPSA** | "Tax paid u/s 92CE" (`sf-92ce`, kind `tpsa`) | amount / addl-tax / surcharge / cess / deposit challans | 13 |
| **PartA_GEN1** detail sub-nodes | `sf-rep` (AssesseeRep), `sf-othfirm` (PartnerInFirmDtls), `sf-unlisted` (HeldUnlistedEqShr[]), `sf-lei` (LEIDtls), `sf-assessee` std/landline (Phone) | rep.*, othfirm rows, unlisted `.name/.pan/.opening/.closing`, lei.*, `.std/.landline` | ~15 |

**C total ≈ 1,150 nodes** — the single largest bucket. Wiring these (mapper functions in `buildITR`) is the fastest route to the bulk of coverage.

---

## D. MISSING UI — per schedule: collects | PARENT pane | NEW/EXTENDED drill-in | key fields | #req | priority

No surface collects these; each needs a new PARENT pane row + drill-in. **USER-INPUT.**

### D1. Firm registered-office address fields — **HIGH** (blocks export today)
- **collects:** Flat/Door No., Area/Locality, State (enum), PIN, STD/Phone.
- **PARENT pane:** ITR Info → extend existing "Assessee info." (`sf-assessee`).
- **NEW fields (extend `sf-assessee`):** `Flat / Door No.` (text→`a.flat`) · `Area / Locality` (text→`a.area`) · `State` (select enum 01..06→`a.statecode`) · `PIN` (text→`a.pin`).
- **why:** preflight (:2619/2621) demands `a.area`+`a.flat`; **no field binds them → export is currently unreachable**. Fixing A1/A6 + this is the #0 gate.
- **#req:** 4 · **priority: P0.**

### D2. **PARTA_OI — Other Information** — **HIGH**
- **collects:** s.145 method of accounting + change, ICDS 145A valuation adjustments, 43B(a..g) amounts, 40/40A/40A(3) particulars, amounts deemed income, quantitative disallowance particulars.
- **PARENT pane:** new tab **"Part A-OI"** (peer of B/S, P&L) OR Computation group "Other Information".
- **NEW drill-in `sf-oi`** (kind `multirepeat`/`fields`): method-of-accounting (select cash/mercantile) · deviation flag · 145A columns (increase/decrease) · 43B a–h rows · 40A(3)/40A(7)/40A(9) · amounts credited. Partial reuse: disallowance figures already in `sf-c-36/37/40/40a/43b` (route those in too).
- **#req:** 95 · **priority: P1.**

### D3. **PARTA_QD — Quantitative Details** — **MEDIUM**
- **collects:** trading/manufacturing quantitative particulars (opening/closing qty, purchases, consumption, yield) for principal items.
- **PARENT pane:** ITR P&L (new "Quantitative details" block) or Part A-OI tab.
- **NEW drill-in `sf-qd`** (kind `multirepeat`): Item name · Unit · Opening stock · Purchase · Qty consumed · Sales · Closing stock · Shortage/excess (trading vs manufacturing tables).
- **#req:** 21 · **priority: P2.**

### D4. **Profit-linked deduction schedules** — **MEDIUM** (VIA lumps them today)
- **collects:** undertaking-wise detail behind the `sf-c-80` lump amounts.
- **PARENT pane:** Computation → drill from each VIA row (extend `sf-c-80`).
- **NEW drill-ins:**
  - **Schedule80G** `sf-80g` (kind `multirepeat`, 4 donee tables 100%/50% with/without qualifying limit): Donee name · Address · City · State · PIN · PAN · Donation cash/other/total · Eligible amount — **60 req**.
  - **Schedule80GGA** `sf-80gga`: Relevant clause · Name · PAN · Address · Amount · mode — **9 req**.
  - **Schedule80GGC** `sf-80ggc`: Date · Amount · mode · IFSC/transaction-id — **9 req**.
  - **Schedule80-IA/-IB/-IC/-IE/-IAC** `sf-80ia…`: undertaking name · nature · profit · deduction % · amount — **6/12/19/…/5 req**.
  - **Schedule80RA / 80P** unit detail — **8 / 2 req** (80P amount already in `sf-c-80` → partial C).
  - **Schedule10AA** `sf-10aa`: SEZ unit · date of commencement · export turnover · total turnover · deduction — **3 req** (amount only exists in `sf-c-amt`).
- **#req:** ~133 · **priority: P2 (P1 for 80G — most-claimed).**

### D5. **ScheduleESR (scientific research)** — **LOW/MEDIUM**
- **collects:** expenditure-wise 35(1)/(2AA)/35CCC detail behind `sf-c-35to35e` lump amounts.
- **NEW drill-in `sf-esr`** (extend `sf-c-35to35e`): institution name · PAN · amount paid · deduction claimed per sub-section.
- **#req:** 30 · **priority: P3.**

### D6. **Schedule112A / 115AD scrip-wise** — **MEDIUM** (extends captured CG)
- **collects:** per-scrip grandfathering columns (ISIN, share/unit name, acq cost, FMV 31/1/2018, sale, LTCG); 115AD = FII-specific STCG/LTCG buckets.
- **PARENT pane:** Computation CG group — extend `sf-c-ltcg112a` (add scrip columns) + new `sf-115ad`.
- **NEW/EXTENDED fields:** ISIN · Name · No. of shares/units · Sale price/unit · FVOC · Cost of acq · FMV per share 31.1.18 · Expenditure · LTCG.
- **#req:** 17 (112A) + 17 (115AD) · **priority: P2.**

### D7. **ScheduleCG set-off/pass-through matrix + sub-heads** — **MEDIUM** (extends captured CG)
- The transaction grids (C) capture per-asset gain, but the ScheduleCG **set-off matrix**, deemed-CG rows, 54-series aggregation, and accrual/quarterly-split (Item F: date-wise CG for 234C) are not surfaced.
- **NEW fields:** quarterly CG split (Item F, 5 date buckets) in each `cg` popup; set-off is computable (B).
- **#req:** counted within ScheduleCG 261 (≈40 need new UI, rest C/B) · **priority: P2.**

**D total ≈ 313 nodes** (95 OI + 21 QD + ~133 profit-linked + 30 ESR + 34 112A/115AD + ~40 CG-extension). **New drill-ins to author: ~14** (`sf-oi`, `sf-qd`, `sf-80g`, `sf-80gga`, `sf-80ggc`, `sf-80ia`, `sf-80ib`, `sf-80ic`, `sf-80ie`, `sf-80iac`, `sf-80ra`, `sf-10aa`, `sf-esr`, `sf-115ad`) + 3 field-extensions (`sf-assessee`, `sf-c-ltcg112a`, `cg` quarterly split).

---

## E. Per-required-schedule checklist — schedule · #req · coverage · action · target

Coverage: ✓ done · B = compute-wire · C = capture-wire · D = new UI · mix. #req = AY2026 required (AY2025 proxy noted where materially different).

| schedule | #req (2026 / 2025 proxy) | coverage now | action | target |
|---|---|---|---|---|
| Form_ITR5 / CreationInfo / Verification | 5 / 6 / 6 | ✓ non-zero | none | 100% ✓ |
| PartA_GEN1 | 43 / 43 | ◑ identity ok; detail dropped | A1-A3, A6 + C (rep/othfirm/unlisted/lei/phone) + D1 | 100% |
| **PartA_GEN2** | 31 / 34 | ✗ mostly (5 present) | **C (partners/audit/nob/prevyr) — TOP** + D (92E audit) | 100% |
| PARTA_BS | 98 (4 miss) / 98 | ◑ zero skeleton | C (B/S pane) + B (totals) | 100% |
| PARTA_PL | 137 (24 miss) / 137 | ◑ zero skeleton | C (P&L pane) + B (totals) | 100% |
| ManufacturingAccount / TradingAccount | 6 / 11 | ✗ | C (P&L tab blocks) | 100% |
| PARTA_OI | 95 / 95 | ✗ | **D2** (+ reuse disallowance popups) | 100% |
| PARTA_QD | 21 / 21 | ✗ | D3 | 100% |
| CorpScheduleBP | 114 (9 miss) / 114 | ◑ zero skeleton | B (BP engine) + A5 | 100% |
| PartB-TI | 36 / 36 (3 miss 2025) | ◑ zero | B | 100% |
| PartB_TTI | 41 (9 miss) / 41 | ◑ zero | B + A4 | 100% |
| ScheduleHP | 31 / 31 | ✗ | C (`sf-c-hp`) | 100% |
| ScheduleCG | 261 / 415 | ✗ | C (txn grids) + B (set-off) + D6/D7 | 100% |
| Schedule112A / 115AD | 17 / 17 · 17 / 17 | ✗ | D6 | 100% |
| ScheduleOS | 102 / 102 | ✗ | C (7 OS popups) | 100% |
| ScheduleVDA | 8 / 8 | ✗ | C (`sf-c-os-vda`) | 100% |
| ScheduleCYLA / BFLA | 35 / 67 | ✗ | B (matrices from heads + `sf-c-bfl`) | 100% |
| ScheduleCFL / ITRScheduleUD | 31 / 18 | ✗ | C (`sf-c-bfl`) | 100% |
| ScheduleDPM / DOA | 59 / 98 | ✗ | C (`sf-c-depit` block grid) | 100% |
| ScheduleDEP / DCG | 10 / 10 | ✗ | B (dep roll-up) | 100% |
| ScheduleVIA | 6 / 6 | ✗ | C (`sf-c-80`) | 100% |
| Schedule80G / 80GGA / 80GGC | 60 / 9 / 9 | ✗ | D4 | 100% |
| Schedule80-IA/IB/IC/IE/IAC/RA/P | 6/12/19/…/5/8/2 | ✗ | D4 (80P amt partial C) | 100% |
| Schedule10AA | 3 / 3 | ✗ | D4 (amt in `sf-c-amt`) | 100% |
| ScheduleESR | 30 / 30 | ✗ | D5 | 100% |
| ScheduleAMT / AMTC | 9 / 19 | ✗ | B (+ `sf-c-amt` inputs C) | 100% |
| ScheduleSI | 6 / 6 | ✗ | B (`taxspecial`) | 100% |
| ScheduleIT | 5 / 5 | ✗ | C (`sf-c-adv`/`sf-c-sat`) | 100% |
| ScheduleTDS2 / TDS3 / TCS | 6 / 6 / 5 | ✗ | C (`sf-c-tds`) + A4 | 100% |
| ScheduleFA | 108 / 108 | ✗ | C (9 FA tables) | 100% |
| ScheduleFSI / TR1 | 23 / 9 | ✗ | C (`sf-c-rel90`) | 100% |
| SchedulePTI | 54 / 54 | ✗ | C (`sf-pti`) | 100% |
| ScheduleEI | 11 / 11 | ✗ | C (`sf-c-ei`/`sf-c-agri`) | 100% |
| ScheduleIF | 10 / 10 | ✗ | C (`sf-othfirm`) | 100% |
| ScheduleGST | 2 / 2 | ✗ | C (`sf-gst`) | 100% |
| ScheduleTPSA | 13 / 13 | ✗ | C (`sf-92ce`) | 100% |
| **PartB-ATI** (2025 only) | — / 19 | ✗ absent | D (updated-return computation) — only if 2025 build cut | 2025 only |
| **PartA_139_8A** (2025 only) | — / 12 | ✗ absent | D (updated-return particulars) | 2025 only |

---

## F. Path-to-100 summary — counts per action, # NEW drill-ins, ordered build list

**Counts per action (AY2026-27; AY2025-26 proxy ≈ same profile + 31 updated-return req + 3 CG-rebucket re-keys):**

| action | approx #req nodes | nature |
|---|---|---|
| **A** mis-key / shape | ~7 | COMPUTE-ONLY (re-map + 2 straddle D1) |
| **B** compute-and-export | ~347 | COMPUTE-ONLY (BP/TI/TTI/CYLA/BFLA/DEP/DCG/SI/AMT/AMTC) |
| **C** captured-but-not-exported | ~1,150 | USER-INPUT (mapper only — surfaces exist) |
| **D** missing UI | ~313 | USER-INPUT (new surfaces) |
| identity (done) | ~52 | ✓ |
| **TOTAL required (2026)** | **1,869** | target 100% |

- **# NEW drill-ins to author: ~14** (`sf-oi`, `sf-qd`, `sf-80g`, `sf-80gga`, `sf-80ggc`, `sf-80ia`, `sf-80ib`, `sf-80ic`, `sf-80ie`, `sf-80iac`, `sf-80ra`, `sf-10aa`, `sf-esr`, `sf-115ad`) + **3 field-extensions** (`sf-assessee` address, `sf-c-ltcg112a` scrip cols, `cg` quarterly split). Everything else is **serialiser wiring**, not UI.
- **Effort shape:** ~78% of the gap (C+B ≈ 1,497 nodes) needs **no new UI** — it is mapper/compute wiring against surfaces and an engine that already exist. Only ~17% (D ≈ 313) is genuinely new UI.

**Ordered build list (identity+partners → BS/PL/BP wiring → income heads/CG/OS → VIA/loss set-off → AMT/tax-credit → taxes-paid → FA/AL):**
1. **P0 identity gate:** D1 address fields + A1/A2/A6 (StateCode/CountryCode/ResidenceNo) + A3 (SEC_CODE) → **makes export reachable at all**.
2. **P0 Partners roster:** C-wire `PartnerOrMemberInfo[]` + `PrevYrMemPart` from `sf-partners` (+ audit `sf-otheraudit`, `sf-nob`) → **firm return becomes valid**.
3. **BS/PL/BP wiring:** C-overlay PARTA_BS + PARTA_PL + Manufacturing/Trading from B/S & P&L panes; B-wire CorpScheduleBP derivation + A5.
4. **Income heads:** C-wire ScheduleHP (`sf-c-hp`), ScheduleOS (7 popups), ScheduleCG txn grids + ScheduleVDA; then D6/D7 (112A/115AD scrip + CG quarterly split).
5. **VIA + loss set-off:** C-wire ScheduleVIA (`sf-c-80`), ScheduleCFL/UD (`sf-c-bfl`); B-wire ScheduleCYLA/BFLA matrices; D4 profit-linked (80G first).
6. **AMT + tax-credit:** B-wire ScheduleAMT/AMTC/SI; A4 TCS split.
7. **Taxes paid:** C-wire ScheduleIT (`sf-c-adv`/`sat`), ScheduleTDS2/3/TCS (`sf-c-tds`), then B PartB_TTI totals.
8. **FA / disclosures / AL:** C-wire ScheduleFA (9 tables), FSI/TR1 (`sf-c-rel90`), PTI (`sf-pti`), EI, IF, GST, TPSA.
9. **Remaining new UI:** D2 PARTA_OI, D3 PARTA_QD, D5 ESR.
10. **PARTA_BS/PL zero-total leaves + PartB-TI/TTI/BP finalisation** (B) once feeders live; re-run preflight (extend it to gate the new required blocks).

**Note on preflight:** it currently checks only 13 identity/verifier items. As B/C/D land, preflight must be extended (or a real `validateItr5` added) so the "Ready" state reflects genuine schema-completeness, not just identity.
