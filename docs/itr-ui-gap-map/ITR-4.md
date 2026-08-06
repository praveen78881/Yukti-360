# ITR-4 — UI GAP MAP (path to 100% schema-complete offline export)
Coverage now: AY2026-27 ~28% · AY2025-26 ~26%. Target 100%.

> Basis: `docs/itr-schema-conformance/real/` trees + diffs + `conformance-ITR4-REAL.md`; structure `docs/itr-structure/ITR-4.md`; emitter `buildItr4Json` (`public/tax-utilities/itr4.html:1855-1916`, byte-identical in `itr4-2025-26.html`). "Coverage now" = (required − reqMISS)/required (28.5% / 26.3%). Everything below is scoped to **REQUIRED (R)** schema leaves only; optional leaves are noted where a required sibling drags them in.
>
> The exporter today is an **identity + tax-computation core**: `CreationInfo`, `Form_ITR4`, `PersonalInfo` (identity), `Verification`, `TaxComputation`, `TaxPaid`, the income-head **aggregates** in `IncomeDeductions`, and the VI-A **summary numbers** are emitted. Every **detail schedule** is dropped — including **ScheduleBP, the schedule that defines ITR-4**, whose inputs already exist in the UI.
>
> reqMISS classified (AY2026-27, 241 required-missing leaves): **A=15 · B=8 · C=23 · D=195**. (`ReturnFileSec`, `Rebate87A`, `EducationCess`, 234-interest and `IncomeFromBusinessProf` are *present-but-wrong-value*, not in reqMISS — counted inside A/B as correctness fixes.) AY2025-26 adds 40 ITR-U/24B/89A required leaves (all D) → 261 reqMISS.

---

## A. Mis-key / shape fixes — our path → schema path | schedule | #req

These are already (or nearly) emitted but under a wrong key/shape/value; a portal upload rejects or mis-credits. Cheapest wins.

| # | Our path (emitter today) | Schema path (target) | Schedule | #req | Notes |
|---|---|---|---|---|---|
| A1 | `TDSonOthThanSals.TDSonOthThanSal[]` with `{EmployerOrDeductorOrCollectDetl:{TAN}, AmtForTaxDeduct, TotTDSOnAmtPaid}` (itr4.html:1914) | `TDSonOthThanSals.TDSonOthThanSalDtls[].{TANOfDeductor, TDSSection(enum 92A…194), TDSClaimed, TDSCreditCarriedFwd}` + `TotalTDSonOthThanSals` | TDSonOthThanSals | 5 | Wrong array name **and** wrong field names → schema-invalid. Concept present from AIS; re-map: `TAN→TANOfDeductor`, `TotTDSOnAmtPaid→TDSClaimed`, add `TDSSection` (AIS section, default 194), `TDSCreditCarriedFwd:0`, compute `TotalTDSonOthThanSals=Σ TDSClaimed`. |
| A2 | `TDSonSalaries.TDSonSalary[].{EmployerOrDeductorOrCollectDetl.TAN/Name, IncChrgSal, TotalTDSSal}` (itr4.html:1913) — shape already correct | add `TDSonSalaries.TotalTDSonSalaries` (=Σ TotalTDSSal) | TDSonSalaries | 5 | 4 per-row leaves are **false-MISS** (emitted when AIS is imported; empty probe only). Only the **total node** is truly unbuilt → add it. Also make emission not depend solely on AIS (accept manual rows). |
| A3 | `Refund.…AddtnlBankDetails[].{IFSCCode, BankName, BankAccountNo, AccountType}` (itr4.html:1879) — no `UseForRefund` | add `AddtnlBankDetails[].UseForRefund` (enum true/false) | Refund | 1 | 4 sibling leaves **false-MISS** (present once a bank row is fed; probe array empty). `UseForRefund` truly dropped though the **"For refund?" checkbox is captured** (`data.bank[i].refund`) → map `UseForRefund:!!b.refund`; ensure ≥1 true when refund due. |
| A4 | `FilingStatus.ReturnFileSec:11` **hardcoded** (itr4.html:1891) | `ReturnFileSec` from `f_section` select → enum(11\|12\|13\|14\|16\|17) | FilingStatus | 0* | *Present-but-wrong-value (not reqMISS). Map `139(1)→11, 139(4)→12, 139(5)→13, 142(1)→14, 139(9)→17`. UI select already exists. |
| A5 | `PersonalInfo.Address.StateCode:'99'` default, `CountryCode:'91'` string (itr4.html:1884) | `StateCode` enum(01…38), `CountryCode` enum | PersonalInfo | 0* | *Value-fix rides on D1 (address capture). `'99'` is not a valid StateCode enum → upload fail once any address is present. |
| A6 | `ScheduleBP.NatOfBus44AD/ADA/AE[].Code*` — UI catalog codes `09027 / 16019 / 20016` (itr4.html:114-117) | `CodeAD` enum(01001-01006…), `CodeADA` enum(14001…), `CodeAE` enum(08001\|11002…) | ScheduleBP | 0* | *Value-remap that rides on C1. **Current UI business-code list does not match the ScheduleBP enum lists** — the nature-of-business `<select>` options must be re-sourced from the schema code lists (or a lookup map added) before export, else every presumptive return fails validation. |

**A totals:** reqMISS moved = **15** (TDSonOthThanSals 5 + TDSonSalaries 5 + Refund 1 + 4 Refund/salary false-MISS realised on data) · plus 3 present-but-wrong-value correctness fixes (A4-A6).

---

## B. Compute-and-export — schema nodes | source | #req

Values we can already derive from live calc cells / captured drill-ins; no new user input — just compute + emit. USER-INPUT: none (all COMPUTE-ONLY).

| # | Schema node(s) | Source (existing) | Schedule | #req |
|---|---|---|---|---|
| B1 | `IncomeDeductions.IncomeFromBusinessProf` **(fix)** | Discrepancy #1: `it_bp_income` is never written → exports 0 though TI is right. Compute = Σ(44AD+44ADA+44AE presumptive profits) from `it_bp_44ad_pr / it_bp_44ada_pr / sf44ae_total` and emit. | IncomeDeductions | 0* (present-zero) |
| B2 | `ScheduleBP.PersumptiveInc44AD.{GrsTotalTrnOver, TotPersumptiveInc44AD}` | Σ turnover / Σ profit of 44AD business cards (`ad44_to_i`, `ad44_pr_i` → `it_bp_44ad_to/pr`) | ScheduleBP | 2 |
| B3 | `ScheduleBP.PersumptiveInc44ADA.{GrsReceipt, TotPersumptiveInc44ADA}` | Σ gross / Σ profit of 44ADA cards (`ada44_gr_i`, `ada44_pr_i` → `it_bp_44ada_to/pr`) | ScheduleBP | 2 |
| B4 | `ScheduleBP.GoodsDtlsUs44AE[].PresumptiveIncome`; `PersumptiveInc44AE.{TotPersumInc44AE, TotalPersumptiveInc, IncChargeableUnderBus}` | Per-vehicle income already computed in 44AE grid (`Income` col = HGV 1000×t×m / 7500×m); `sf44ae_total` is the sum | ScheduleBP | 4 |
| B5 | `ScheduleBP.TotalTurnoverGrsRcptGSTIN` *(optional; sibling of C4)* | Σ `data.gstr[].outward` (`gstr_total`) | ScheduleBP | 0 |
| B6 | `TaxComputation.{Rebate87A, EducationCess, IntrstPay.IntrstPayUs234A/234B/234C, LateFilingFee234F}` **(un-hardcode)** | Discrepancy #5: hardcoded 0 though calc computes 87A rebate, 4% cess and 234A/B/C/F. Read the calc cells instead of literals. | TaxComputation | 0* (present-zero) |
| B7 | Schedule-level totals of every D-schedule (`Total…`) | Σ of the rows added by the new drill-ins in D (e.g. `Schedule80G.TotalDonationsUs80G`, `Schedule80E.TotalInterest80E`, `ScheduleIT.TotalTaxPayments`, `Schedule80D.…EligibleAmountOfDedn`) | (each D schedule) | counted under D |

**B totals:** **8** reqMISS (ScheduleBP compute leaves B2-B4) directly, plus B1/B6 present-but-zero correctness fixes. B7 totals are counted inside their D schedules.

---

## C. Captured-but-not-exported — schema schedule | EXISTING drill-in (verbatim) | binds | #req

Data already collected in the UI/`data.*` model; the emitter silently drops it. Wire-up only — **no new screens**. USER-INPUT unless marked COMPUTE.

| # | Schema schedule / nodes | EXISTING drill-in (verbatim) | binds | #req |
|---|---|---|---|---|
| C1 | `ScheduleBP.NatOfBus44AD/44ADA/44AE[].{NameOfBusiness, Code*, Description}` | **"Nature of Business / Profession"** → `sf-nature` (itr4.html:673); grid *Sector \| Sub-sector \| Code \| Trade name \| Description* grouped `Taxable u/s 44AD/44ADA/44AE` | `data.nature[i].{sec, code, trade, subsector, desc}` → `NameOfBusiness=trade`, `Code*=code` (remap per A6), `Description=desc` | 6 |
| C2 | `ScheduleBP.GoodsDtlsUs44AE[].{RegNumberGoodsCarriage, OwnedLeasedHiredFlag, TonnageCapacity, HoldingPeriod}` | **"Transport business — U/s 44AE"** → `sf-44ae` (itr4.html:2388); grid *Description \| No. of months \| Weight (Tonnes) \| Vehicle type \| Income \| Registration No. \| Ownership* | `data`/`ae44_reg/own/wt/mon_i` → `RegNumberGoodsCarriage=reg`, `OwnedLeasedHiredFlag=own` (Owned→OWN/Leased→LEASE/Hired→HIRED), `TonnageCapacity=wt`, `HoldingPeriod=mon` | 4 |
| C3 | `ScheduleBP.TurnoverGrsRcptForGSTIN[].{GSTINNo, AmtTurnGrossRcptGSTIN}` | **"Turnover / Gross Receipts reported in GSTR"** → `sf-gstr` (itr4.html:658); grid *GSTIN \| Outward supplies as per GST return* | `gstr_i_gstin/outward` → `GSTINNo`, `AmtTurnGrossRcptGSTIN` | 2 |
| C4 | `ScheduleBP.FinanclPartclrOfBusiness.*` (SundryCreditors, Inventories, SundryDebtors, BalWithBanks, CashInHand + optional cap/liab/asset) *(optional in schema, UI-mandatory)* | **"Financial particulars of the Business"** grid (itr4.html:439-472), `data-fp` inputs | `data.fp[key]` → 1:1 to `FinanclPartclrOfBusiness` fields | 0 (opt) |
| C5 | `FilingStatus.AsseseeRepFlg` + `AssesseeRep.{RepName, RepEmailID, CountryCodeRepMobileNo, RepMobileNo}` (2026) / `{RepName, RepCapacity, RepAddress, RepPAN}` (2025) | **"Representative Assessee, if any"** → `sf-repassessee` (itr4.html:568) | `data.repassessee.{name,email,contact,cc,pan}` → set `AsseseeRepFlg:'Y'` when name present (fix hardcode); emit `AssesseeRep.*` | 4 |
| C6 | `TaxReturnPreparer.{IdentificationNoOfTRP, NameOfTRP, ReImbFrmGov}` | **"Other Forms filed"** → `sf-otherforms`, "Tax Return Preparer (TRP) info." section (itr4.html:606) | `ofr_trp_id → IdentificationNoOfTRP`, `ofr_trp_name → NameOfTRP`, `ofr_trp_amt → ReImbFrmGov` | 2 |
| C7 | `LTCG112A.{TotSaleCnsdrn, TotCstAcqisn, LongCap112A}` | **"Long Term Capital Gain u/s 112A"** → `sf-ltcg112a` (itr4.html:2683); today only the net `it_cg_112a` cell is folded into `GrossTotIncomeIncLTCG112A` | 112A drill-in sale-consideration / cost / gain cells → the 3 leaves (COMPUTE from that drill-in) | 3 |
| C8 | `TaxExmpIntIncDtls.OthersInc.OthersIncDtls[].{NatureDesc(2025), OthAmount}` + `OthersTotalTaxExe` | **"Incomes fully exempt"** → `sf-schedule-ei` (itr4.html:2297, `it_exempt`) | exempt-income rows → itemised leaves + total (COMPUTE) | 2 (2026) / 3 (2025) |

**C totals:** **23** reqMISS wired without a single new screen (ScheduleBP user-input 12 + AssesseeRep 4 + TRP 2 + LTCG112A 3 + TaxExmp 2). ScheduleBP alone (C1-C3 + B2-B4) clears **18 of its 20** reqMISS — the single highest-value action in the form.
> Also captured-but-no-required-schema-node (out of scope, do not export): PTI (`sf-pti`), Schedule FA (9 `sf-fa_*`), ESOP (`sf-esop`), Unlisted shares, Directorship — ITR-4 Sugam has **no** required schema home for these.

---

## D. MISSING UI — per schedule: collects | PARENT screen | NEW/EXTENDED drill-in | key fields (label \| type \| grid-cols) | #req | priority

No capture exists. Each row is a new (or extended) drill-in. USER-INPUT unless a field is marked ⚙COMPUTE. Priority: **P1** filing-blocking & common · **P2** common-conditional · **P3** rare.

### D1 — PersonalInfo address & phone — #req 6 · P1
- collects: primary residence + STD/phone + secondary address (schema-required even when "same as primary")
- PARENT: **ITR Information → "Assessee info."** (`sf-assessee`, itr4.html:532) — **EXTEND** existing drill-in
- key fields: Flat/Door/Building `text` · Road/Street `text` · Locality/Area `text` · City/Town/District `text` · **State** `select`(StateCode enum 01-38) · PIN `int(6)` · STD code `int` · Phone No. `int` · (secondary address block, gated by existing "Secondary address same as primary?") — non-grid form
- binds → `PersonalInfo.Address.{ResidenceNo, RoadOrStreet, LocalityOrArea, CityOrTownOrDistrict, StateCode, PinCode, Phone.STDcode, Phone.PhoneNo}` + `AlternateAddress.{ResidenceNo, LocalityOrArea, CityOrTownOrDistrict, StateCode}` (fixes A5, discrepancy #4)

### D2 — House Property detail — #req 28 (2026 `PropertyDetails[]`) / 8 (2025 `ScheduleUs24B`) · P1
- collects: per-let-out/self-occupied property — address, owner/co-owners, tenants, ALV, local taxes, 30% deduction, Section-24B loan-interest rows
- PARENT: **Computation → House Property** block (shared calc) → surface a **NEW** `sf-hp-property` summary grid + level-2 `buildGroupedDetail` on the ITR Information tab
- key fields (grid-cols): **Property** *Address \| City \| State(sel) \| PIN \| Owner(SE/MI/SP/OT) \| Co-owned?(Y/N)*; **Co-owners[]** *S.No⚙ \| Name \| PAN \| % share*; **Let-out?** *(L/D/S)*; **Tenants[]** *S.No⚙ \| Name \| PAN*; **Rent** *ALV \| RentNotRealized \| LocalTaxes \| 30%⚙ \| IntOnBorwCap*; **Section24B[]** *LoanTknFrom(B/I) \| Bank/Instn \| Loan A/c No \| DateofLoan \| TotalLoanAmt \| LoanOutstndngAmt \| InterestUs24B*
- binds → `IncomeDeductions.PropertyDetails[]…` (2026) incl. nested `Rentdetails.Section24B.Section24BDtls[]` + `TotalInterestUs24B`⚙ · **2025**: same loan rows collapse to standalone `ScheduleUs24B.ScheduleUs24BDtls[]` + `TotalInterestUs24B`⚙
- AY-specific: 2026 uses full inline `PropertyDetails[]`; 2025 uses `ScheduleUs24B` (loan-interest only) + flat `AnnualValue/AnnualValue30Percent/TotalIncomeOfHP` leaves.

### D3 — Chapter VI-A deduction detail schedules — #req 130 (2026) · P1 (80C/80D/80G) / P2 (rest)
Single **NEW parent hub** "Chapter VI-A — deduction details" (ITR Information sub-group), one drill-in per section. PARENT screen for all: **Computation VI-A drill-ins** already collect the *amount*; these add the mandated *itemisation*.

| Sub-schedule | NEW drill-in | key fields (grid-cols) | #req |
|---|---|---|---|
| Schedule80C | `sf-80c` | *Amount \| Identification No.* + `TotalAmt`⚙ | 3 |
| Schedule80D | `sf-80d` | per bucket (Self/Fam, Self/Fam SrCtzn, Parents, Parents SrCtzn): SrCtzn flag · `Sch80DInsDtls[]` *Insurer \| Policy No \| HealthInsAmt* · TotalPayments⚙ · prev-health-checkup · medical-exp · `EligibleAmountOfDedn`⚙ | 17 |
| Schedule80DD | `sf-80dd` | NatureOfDisability(1/2) · TypeOfDisability(1/2) · DeductionAmount · DependentType(1-6) · [Pan/Aadhaar/Form10IA/UDID] | 4 |
| Schedule80U | `sf-80u` | NatureOfDisability · TypeOfDisability · DeductionAmount | 3 |
| Schedule80E | `sf-80e` | `Schedule80EDtls[]` *LoanTknFrom(B/I) \| Bank/Instn \| Loan A/c No \| DateofLoan \| TotalLoanAmt \| LoanOutstndngAmt \| Interest80E* + Total⚙ | 8 |
| Schedule80EE | `sf-80ee` | same loan-row shape → `Interest80EE` + Total⚙ | 8 |
| Schedule80EEA | `sf-80eea` | `PropStmpDtyVal` + loan rows → `Interest80EEA` + Total⚙ | 9 |
| Schedule80EEB | `sf-80eeb` | loan rows + `VehicleRegNo` → `Interest80EEB` + Total⚙ | 9 |
| Schedule80G | `sf-80g` | 4 donee buckets (100% / 50%-no-appr / 100%-appr / 50%-appr), each `DoneeWithPan[]` *Name \| PAN \| ArnNbr \| AddrDetail \| City \| State(sel) \| PIN \| DonationAmtCash \| DonationAmtOtherMode \| DonationAmt \| EligibleDonationAmt⚙* + per-bucket & grand totals⚙ | 52 |
| Schedule80GGC | `sf-80ggc` | `Schedule80GGCDetails[]` *DonationDate \| AmtCash \| AmtOtherMode \| DonationAmt \| EligibleAmt⚙ \| PartyName \| PartyPAN* + totals⚙ | 9 |
| UsrDeductUndChapVIA.PensionContribution80CCC[] | extend VI-A | *TypeofIdentifier(PRAN/OTHPRAN) \| NameofIdentifier \| Amount* | 3 |

### D4 — ScheduleEA10_13A (HRA exemption u/s 10(13A)) — #req 8 · P2
- collects: HRA exemption working
- PARENT: **Computation → Salary → exempt allowances** → NEW `sf-ea-hra`
- key fields: Placeofwork(1=metro/2=non) · ActlHRARecv · ActlRentPaid · DtlsSalUsSec171(basic+DA) · BasicSalary · ActlRentPaid10Per⚙ · Sal40Or50Per⚙ · EligbleExmpAllwncUs13A⚙ — non-grid
- binds → `ScheduleEA10_13A.*`

### D5 — AllwncExemptUs10 (salary exempt allowances) — #req 3 · P2
- PARENT: **Computation → Salary** → NEW `sf-allwnc-us10`
- key fields (grid): *SalNatureDesc(enum 10(5)/10(6)/10(7)/10(10)/10(10A)/10(10AA)) \| SalOthAmount* + `TotalAllwncExemptUs10`⚙
- binds → `IncomeDeductions.AllwncExemptUs10.*`

### D6 — Other-source itemisation + quarterly dividend — #req 7 · P2
- PARENT: **Computation → Other Sources** (`it_os_*`, `sf-os-dividends` exists) → **EXTEND** to itemise
- key fields (grid): *OthSrcNatureDesc(SAV/IFD/TAX/FAP/DIV…) \| OthSrcOthAmount*; nested `DividendInc.DateRange` 5 quarter buckets *Upto15Of6 \| Upto15Of9 \| Up16Of9To15Of12 \| Up16Of12To15Of3 \| Up16Of3To31Of3* (drives 234C)
- binds → `IncomeDeductions.OthersInc.OthersIncDtlsOthSrc[]`

### D7 — Taxes-paid detail: ScheduleIT / ScheduleTCS / ScheduleTDS3Dtls — #req 16 · P1
- collects: self-assessment/advance-tax challans; TCS credits; TDS-on-rent/property (Form 26QC/26QB)
- PARENT: **Tax Summary & Filing** (extend "AIS Import Preview" flow) → 3 NEW drill-ins
- key fields:
  - `sf-scheduleit` → `TaxPayment[]` *BSRCode \| DateDep \| SrlNoOfChaln \| Amt* + `TotalTaxPayments`⚙ — #req 5
  - `sf-scheduletcs` → `TCS[]` *TAN \| CollectorName \| Amtfrom26AS \| TotalTCS \| AmtTCSClaimedThisYear* + `TotalSchTCS`⚙ — #req 6 (feed `TaxPaid.TaxesPaid.TCS`, today hardcoded 0)
  - `sf-scheduletds3` → `TDS3Details[]` *PANofTenant \| TDSSection \| TDSClaimed \| TDSCreditCarriedFwd* + `TotalTDS3Details`⚙ — #req 5
- binds → `ScheduleIT.* / ScheduleTCS.* / ScheduleTDS3Dtls.*`

### D8 — FilingStatus.clauseiv7provisio139iDtls[] (seventh-proviso 139(1) high-value txns) — #req 2 · P3
- PARENT: **ITR Information → ITR filing info** → NEW small `sf-7provisio`
- key fields (grid): *clauseiv7provisio139iNature(1-4) \| clauseiv7provisio139iAmount*
- binds → `FilingStatus.clauseiv7provisio139iDtls[]`

### D9 — (AY2025-26 ONLY) ITR-U machinery: PartA_139_8A + PartB-ATI — #req 32 · P2 (only if ITR-U filed)
- collects: updated-return u/s 139(8A) — original-return ack, reasons for updating, 140B recomputation + challans
- PARENT: NEW top-level tab/section "Updated Return (139(8A))", gated by `f_section`
- key fields:
  - `sf-parta1398a` → PAN · Name · AssessmentYear · PreviouslyFiledForThisAY · `Applicable_139_8A.{AcknowledgementNo, OrigRetFiledDate}` · LaidOutIn_139_8A · ITRFormUpdatingInc(ITR4) · `UpdatingInc.ReasonsForUpdatingIncDtls[].ReasonsForUpdatingIncome(1-6)` · UpdatedReturnDuringPeriod(1-4) · `RetrntoRedCarriedFL.UnabsorbedDepreciation` + UD-year rows — #req 12
  - `sf-partb-ati` → UpdatedTotInc · AmtPayable · FeeIncUS234F · AggrLiabilityRefund/NoRefund · AddtnlIncTax⚙ · NetPayable⚙ · TaxUS140B⚙ · TaxDue10_11 · ReleifUS89 · nested `ScheduleIT1/IT2.…ITTaxPayments[]` *BSRCode \| DateDep \| SrlNoOfChaln \| Amt* + totals⚙ — #req 20
- **REMOVED in AY2026-27** (schema drops both; their 32 required leaves vanish, mechanically lifting 2026 coverage).

### D10 — (AY2025-26 ONLY) Retirement-foreign-account 89A — #req ~8 · P3
- PARENT: **Computation → Other Sources / Salary** → extend
- key fields: `IncomeNotified89A` · `IncomeNotified89AType[].{NOT89ACountrycode(US/UK/CA), NOT89AAmount}` · per-OS-row `NOT89A[]` + `NOT89AInc.DateRange` 5 quarters
- binds → `IncomeDeductions.IncomeNotified89A*` + `OthersIncDtlsOthSrc[].NOT89A*`
- **Not surfaced the same way in 2026-27** (folded differently) — implement per-AY.

### D11 — (AY2025-26 ONLY) FilingStatus.OptOutNewTaxRegime_Form10IEA_AY24_25 — #req 1 · P2
- PARENT: **"Other Forms filed"** (`sf-otherforms`) → add select (Y/N/NA)
- binds → `FilingStatus.OptOutNewTaxRegime_Form10IEA_AY24_25` (2026 renames the whole rep/10-IEA block — see A/C notes)

**D totals:** AY2026-27 **195** reqMISS across ~16 new/extended drill-ins. AY2025-26 **+40** (ITR-U 32 + 24B −20 offset by shape + 89A 8 + optout 1) but note 2025 replaces `PropertyDetails[]` (28) with `ScheduleUs24B` (8), so its house-property D-load is smaller.

---

## E. Per-required-schedule checklist — schedule · #req · coverage · action · target

| Schedule | #req 2026 / 2025 | coverage now | action | target |
|---|---|---|---|---|
| CreationInfo | 6 / 6 | ✓100% | — | keep |
| Form_ITR4 | 5 / 5 | ✓100% | — | keep |
| Verification | 5 / 5 | ✓100% | — | keep |
| TaxComputation | 11 / 11 | ✓ present (ZERO) | **B6** un-hardcode 87A/cess/234 | 100% |
| TaxPaid | 6 / 6 | ✓ present (ZERO) | feed TCS from D7 | 100% |
| PersonalInfo | 20 / 15 | ◑ identity only | **D1** address+phone; **A5** state map | 100% |
| FilingStatus | 10 / 10 | ◑ 4/10 | **C5** AssesseeRep · **A4** ReturnFileSec · **D8** clauseiv7 · **D11**(2025) | 100% |
| Refund | 6 / 6 | ◑ (false-MISS) | **A3** UseForRefund + feed a bank row | 100% |
| IncomeDeductions | 85 / 66 | ◑ aggregates only | **D2** HP · **D3** 80CCC · **D5** AllwncUs10 · **D6** OthSrc · **B1** BizProf fix · **D10**(2025) 89A | 100% |
| **ScheduleBP** | **20 / 20** | **✗ 0%** | **C1-C3 wire + B2-B4 compute + A6 code-remap** | **100% — DO FIRST** |
| ScheduleIT | 5 / 5 | ✗ | **D7** challan drill-in | 100% |
| ScheduleTCS | 6 / 6 | ✗ | **D7** | 100% |
| ScheduleTDS3Dtls | 5 / 5 | ✗ | **D7** | 100% |
| TDSonSalaries | 5 / 5 | ✗ (false-MISS) | **A2** add total + accept manual | 100% |
| TDSonOthThanSals | 5 / 5 | ✗ shape-delta | **A1** reshape → …Dtls | 100% |
| Schedule80C | 3 / 3 | ✗ | **D3** `sf-80c` | 100% |
| Schedule80D | 17 / 17 | ✗ | **D3** `sf-80d` | 100% |
| Schedule80DD | 4 / 4 | ✗ | **D3** `sf-80dd` | 100% |
| Schedule80E | 8 / 8 | ✗ | **D3** `sf-80e` | 100% |
| Schedule80EE | 8 / 8 | ✗ | **D3** `sf-80ee` | 100% |
| Schedule80EEA | 9 / 9 | ✗ | **D3** `sf-80eea` | 100% |
| Schedule80EEB | 9 / 9 | ✗ | **D3** `sf-80eeb` | 100% |
| Schedule80G | 52 / 52 | ✗ | **D3** `sf-80g` (4 buckets) | 100% |
| Schedule80GGC | 9 / 9 | ✗ | **D3** `sf-80ggc` | 100% |
| Schedule80U | 3 / 3 | ✗ | **D3** `sf-80u` | 100% |
| ScheduleEA10_13A | 8 / 8 | ✗ | **D4** `sf-ea-hra` | 100% |
| LTCG112A | 3 / 3 | ✗ (calc has it) | **C7** emit 3 leaves from `sf-ltcg112a` | 100% |
| TaxExmpIntIncDtls | 2 / 3 | ✗ (calc has it) | **C8** emit from `sf-schedule-ei` | 100% |
| TaxReturnPreparer | 2 / 2 | ✗ (captured) | **C6** emit from `sf-otherforms` | 100% |
| ScheduleUs24B *(2025)* | — / 8 | ✗ | **D2** (2025 arm) | 100% |
| PartA_139_8A *(2025)* | — / 12 | ✗ | **D9** | 100% (2025) |
| PartB-ATI *(2025)* | — / 20 | ✗ | **D9** | 100% (2025) |

---

## F. Path-to-100 summary

**Counts per action (AY2026-27 reqMISS = 241):**
- **A — mis-key/shape:** 15 reqMISS (+3 present-but-wrong-value correctness) · 0 new screens
- **B — compute-and-export:** 8 reqMISS (+2 correctness: B1, B6) · 0 new screens
- **C — captured-but-not-exported:** 23 reqMISS · 0 new screens (wire `data.nature`, `data.gstr`, 44AE grid, `repassessee`, `ofr_trp_*`, `sf-ltcg112a`, `sf-schedule-ei`)
- **D — missing UI:** 195 reqMISS · **~16 NEW/extended drill-ins** (AY2025-26: +40 reqMISS, +2 ITR-U drill-ins)

**# NEW drill-ins:** **~16** for AY2026-27 (D2 house-property, D3 ×10 VI-A sections, D4 HRA, D5 AllwncUs10, D7 ×3 taxes-paid, D8 7-proviso; D1/D6 are extensions) — **+2** for AY2025-26 (D9 PartA_139_8A, PartB-ATI). Chapter-VI-A can share one hub host.

**Ordered build list (identity → ScheduleBP → VIA → taxes-paid/TDS → bank):**
1. **ScheduleBP** (C1-C3 wire + B2-B4 compute + **A6 code-remap** + B1 `it_bp_income` fix) — clears 18/20 reqMISS of the schedule that *defines* ITR-4; all inputs already captured. **Highest value, lowest cost.**
2. **Identity completion** — D1 address+phone (+A4 ReturnFileSec, A5 state map, C5 AssesseeRep, C6 TRP) → closes PersonalInfo + FilingStatus.
3. **Bank/Refund** — A3 UseForRefund (1-line map of an existing checkbox).
4. **TDS/taxes-paid** — A1 TDSonOthThanSals reshape · A2 TDSonSalaries total · D7 ScheduleIT/TCS/TDS3 · B6 un-hardcode 234/cess/87A → substantiates all prepaid-tax claims.
5. **Chapter VI-A detail (D3)** — start 80C/80D/80G (P1, 72 req), then 80E/EE/EEA/EEB/GGC/DD/U (P2).
6. **House Property (D2)** — PropertyDetails (2026) / ScheduleUs24B (2025).
7. **Salary/OS itemisation** — D4 HRA, D5 AllwncUs10, D6 OthSrc+dividend, C7 LTCG112A, C8 exempt-income.
8. **Rare/AY-specific** — D8 7-proviso; **AY2025-26 only:** D9 ITR-U (PartA_139_8A + PartB-ATI), D10 89A, D11 10-IEA opt-out.

**AY flags:** ITR-U (`PartA_139_8A`, `PartB-ATI`), `ScheduleUs24B`, `OptOutNewTaxRegime_Form10IEA_AY24_25`, and 89A blocks are **AY2025-26 only**; AY2026-27 replaces house-property with inline `PropertyDetails[]` and renames the rep/10-IEA block (`AssesseeRep.{RepEmailID, CountryCodeRepMobileNo, RepMobileNo}` vs 2025 `{RepCapacity, RepAddress, RepPAN}`). Build ScheduleBP/VIA/taxes-paid once (shared); branch only house-property, ITR-U, 89A and the rep-field shape by AY.
