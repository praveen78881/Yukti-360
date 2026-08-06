# ITR-3 — Real-Schema Conformance Report

**Form:** ITR-3 · **AYs:** 2026-27 and 2025-26
**Schema versions (from `Form_ITR3.SchemaVer`):** AY2026-27 = `Ver1.1` (AssessmentYear `2026`) · AY2025-26 = `Ver1.0` (AssessmentYear `2025`)
**Tools:** `public/tax-utilities/itr3.html` (2026-27) and `public/tax-utilities/itr3-2025-26.html` (2025-26), builder `buildItr3Json` in both (line-for-line identical except AY constants).
**Field catalog:** `docs/itr-structure/ITR-3.md`

> Metric definitions used here: **PRESENCE/capacity** = leaf emitted at all (OK or ZERO). **ZERO** = emitted but empty (probe fed no data — *not* a defect). **MISS** = never emitted = true structural gap. **reqMISS** = a required leaf never emitted = **filing blocker**. Headline = % of REQUIRED leaves PRESENT = `(required − reqMISS) / required`.

## 1. Headline

| AY | schema leaves | required | reqOK | reqZERO | **reqPRESENT** | reqMISS | **% required present** |
|----|--------------:|---------:|------:|--------:|---------------:|--------:|-----------------------:|
| **2026-27** | 2798 | 2034 | 41 | 395 | **436** | 1598 | **21.4 %** |
| **2025-26** | 3042 | 2269 | 40 | 414 | **454** | 1815 | **20.0 %** |

Both AYs sit at ~1 in 5 required leaves present. The tool is, in practice, a **business P&L + Schedule-BP + tax-computation calculator** that emits a schema-complete *zero skeleton* for the Balance Sheet, P&L, BP, CYLA/BFLA and Part B-TI/TTI, but **does not populate any income-head detail schedule, any Chapter-VI-A deduction schedule, capital gains, or the tax-credit (TDS/TCS/IT) schedules.** Of 67–69 required schedules, **55 (2026-27) / 57 (2025-26) are entirely absent.**

## 2. Per-schedule capacity

Status: ✓ = all required present (reqMISS 0) · ◑ = partial · ✗ = required content entirely absent.
`present = OK + ZERO`. (AY2025-26 figures in parentheses where they differ.)

| Schedule | required | present | reqMISS | status |
|----------|---------:|--------:|--------:|:------:|
| CreationInfo | 6 | 6 | 0 | ✓ |
| Form_ITR3 | 5 | 5 | 0 | ✓ |
| PartA_GEN1 | 46 (39) | 28 (27) | 25 (19) | ◑ |
| PartA_GEN2 | 8 | 5 | 3 | ◑ |
| PARTA_BS | 64 | 64 | 0 | ✓ (zero skeleton) |
| PARTA_PL | 132 | 106 | 26 | ◑ |
| PARTA_OI | 92 (91) | 0 | 92 (91) | ✗ |
| PARTA_QD | 21 | 0 | 21 | ✗ |
| ManufacturingAccount | 6 | 0 | 6 | ✗ |
| TradingAccount | 11 | 0 | 11 | ✗ |
| ITR3ScheduleBP | 116 (114) | 107 (105) | 9 | ◑ |
| ITR3ScheduleUD | 16 | 0 | 16 | ✗ |
| Schedule10AA | 3 | 0 | 3 | ✗ |
| ScheduleS (Salary) | 34 | 0 | 34 | ✗ |
| ScheduleHP (House Prop) | 29 | 0 | 29 | ✗ |
| ScheduleCGFor23 (Cap Gains) | 294 (483) | 0 | 294 (483) | ✗ |
| Schedule112A / 115AD | 20+20 (24+24) | 0 | 40 (48) | ✗ |
| ScheduleOS (Other Sources) | 112 | 0 | 112 | ✗ |
| ScheduleDPM/DOA/DEP/DCG (depr) | 59/98/10/10 | 0 | 177 | ✗ |
| ScheduleCYLA | 37 (43) | 21 (27) | 16 | ◑ |
| ScheduleBFLA | 58 (70) | 30 (42) | 28 | ◑ |
| ScheduleCFL | 44 (43) | 0 | 44 (43) | ✗ |
| ScheduleVIA (Ch VI-A hdr) | 11 (8) | 0 | 11 (8) | ✗ |
| Schedule80C/80D/80DD/80E/80EE/80EEA/80EEB | 3/18/4/8/8/9/9 | 0 | 59 | ✗ |
| Schedule80G/80GGA/80GGC/80RA/80U | 60/15/11/12/3 | 0 | 101 (99) | ✗ |
| Schedule80_IA/IB/IC | 4/10/19 | 0 | 33 | ✗ |
| ScheduleAMT / AMTC | 9/18 | 0 | 27 | ✗ |
| ScheduleSI / EI | 6/12 (6/15) | 0 | 18 (21) | ✗ |
| Schedule5A2014 | 22 | 0 | 22 | ✗ |
| SchedulePTI | 56 | 0 | 56 | ✗ |
| ScheduleSPI | 4 | 0 | 4 | ✗ |
| ScheduleFA (Foreign Assets) | 108 | 0 | 108 | ✗ |
| ScheduleFSI / TR1 | 27/9 | 0 | 36 | ✗ |
| ScheduleAL | 25 | 0 | 25 | ✗ |
| ScheduleESOP / ESR / VDA | 13/30/8 (11/30/8) | 0 | 51 (49) | ✗ |
| ScheduleIF | 7 | 0 | 7 | ✗ |
| ScheduleTPSA | 13 | 0 | 13 | ✗ |
| ScheduleIT (adv/SA tax) | 5 | 0 | 5 | ✗ |
| ScheduleTDS1 / TDS2 / TDS3 | 5/6/6 | 0 | 17 | ✗ (see §4 — mis-keyed) |
| ScheduleTCS | 4 | 0 | 4 | ✗ |
| TaxReturnPreparer | 2 | 0 | 2 | ✗ |
| PartB-TI | 35 (38) | 35 (38) | 0 | ✓ (zero skeleton) |
| PartB_TTI | 43 | 34 | 13 | ◑ |
| PartB-ATI (2025-26 only) | — (20) | 0 | 20 | ✗ |
| PartA_139_8A (2025-26 only) | — (12) | 0 | 12 | ✗ |
| Verification | 6 | 6 | 0 | ✓ |
| ScheduleGST / ScheduleICDS | 0 req | 0 | 0 | n/a (no required leaves) |

## 3. Ranked filing-blockers (most material first)

These are required schedules/sections entirely or mostly missing. "Captured-but-not-exported" = the UI *collects* the data but `buildItr3Json` drops it (confirmed by field catalog §Discrepancy notes, line 378 "dead data" and line 369).

1. **ScheduleCGFor23 — Capital Gains (294 req 2026 / 483 req 2025, entirely absent).** No CG computation is emitted; Schedule112A (20/24) and Schedule115AD (20/24) are also fully absent, and PartB-TI CapGain buckets are emitted only as zeros. **Truly absent** — the tool has no capital-gains input surface. Largest single block of missing required leaves and a hard blocker for any assessee with CG.
2. **ScheduleS / ScheduleHP / ScheduleOS — the non-business income heads (34 + 29 + 112 = 175 req, entirely absent).** Salary, House-Property and Other-Sources detail schedules are never emitted; only the rolled-up totals ride through Part B-TI as zeros. **Truly absent** (no per-head input in the ITR-3 tool). Blocker for any return with salary/HP/OS income.
3. **PARTA_OI — Other Information (92/91 req, entirely absent) + PARTA_QD (21) + Manufacturing/Trading Account (6+11).** The 44AB-audit disclosures (method of accounting, ICDS effect, §36/37/40/40A/43B disallowances, excise/GST outstanding) are mandatory for audited ITR-3 filers and are **truly absent**. High-severity for the audited-business use case this form targets.
4. **Chapter-VI-A deductions — ScheduleVIA + 80C/80D/80DD/80E/80EE/80EEA/80EEB/80G/80GGA/80GGC/80RA/80U/80-IA/IB/IC (~360 req across both AYs, entirely absent).** No deduction detail is emitted and `PartB-TI.DeductionsUndSchVIADtl` is zero. **Truly absent.** Blocker wherever any deduction is claimed.
5. **Depreciation block — ScheduleDPM/DOA/DEP/DCG (177 req, entirely absent)** and **ScheduleUD unabsorbed depreciation (16), ScheduleCFL carry-forward loss (44/43).** Core to a business return; **truly absent.**
6. **Tax-credit schedules — ScheduleTDS1/TDS2/TDS3 (17), ScheduleIT (5), ScheduleTCS (4), entirely absent as schema paths.** TDS *is* captured and emitted but under **non-schema keys** (see §4) — **captured-but-mis-exported**; TCS and advance/self-assessment challan detail (ScheduleIT) are **truly absent**. Without these the return claims no prepaid-tax credit and will mis-compute the refund.
7. **Identity/status residue in PartA_GEN1 (25/19 reqMISS) & PartA_GEN2 (3).** Landline `Phone.STDcode/PhoneNo`, `AlternateAddress`, `AssesseeRep`, `PartnerInFirm[]`, `CompDirectorPrvYr[]`, `HeldUnlistedEqShrPrYr[]`, `clauseiv7provisio139i[]`, `NatureOfBusiness[].Code`, and 92E-audit ack/date. Field catalog line 378 confirms **Directorship, Unlisted-shares, Partner-in-firm, Nature-of-Business are captured in state but never emitted** (FilingStatus flags stay `'N'`) → **captured-but-not-exported.** Directly declarable and the cheapest blockers to close.
8. **Foreign / high-value disclosure — ScheduleFA (108), ScheduleAL (25), SchedulePTI (56), ScheduleESOP/ESR/VDA/IF/TPSA/5A2014/FSI/TR1.** ScheduleFA, AL, PTI, ESOP, TPSA are all **captured in the UI** (catalog screens: Foreign assets, AL checkbox, PTI drill, ESOP drill, 92CE/TPSA drill) but **not exported** (line 378) → **captured-but-not-exported.** VDA, 5A2014 (Portuguese-code spouse split), FSI/TR1 are **truly absent.**
9. **PARTA_PL detail rows (26 reqMISS)** and **ITR3ScheduleBP (9 reqMISS: speculative/specified-business set-off + §35AD).** BS/PL figures typed on the ITR-B/S and ITR-P&L tabs are **NOT mapped** into export — both emit a zero skeleton (catalog line 369) → **captured-but-not-exported for the array-detail rows** (NatOfBus44AD/ADA/AE, presumptive 44AD/ADA/AE, OtherExpenses[], BadDebt[]); business income rides only via `NoBooksOfAccPL.NetProfit = it_bp_income`.
10. **PartB_TTI (13 reqMISS):** §89A tax-deferred ESOP (`GrossTaxPay.TaxInc17/TaxDeferred17/TaxDeferredPayableCY`), `TaxRelief.TotTaxRelief`, and `AddtnlBankDetails[]/ForeignBankDetails[]` children. Bank detail is **partially false-MISS** (see §4). Rebate87A/Surcharge/Cess emit as 0 (catalog line 374 — embedded calc lacks `__taxBreakup`).
11. **PartB-ATI + PartA_139_8A (2025-26 only, 20 + 12 req, entirely absent).** The updated-return (§139(8A)) block is unsupported. Truly absent — but only affects updated returns.

## 4. False-MISS corrections (semantic naming deltas)

Spot-checked 12 "REQUIRED MISSING" leaves against `buildItr3Json`. **5 leaves reclassified** from MISS to semantic-partial (⚠):

- **`PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[].IFSCCode / BankName / BankAccountNo / AccountType` (4 leaves, both AYs) → ⚠ false-MISS.** The builder *does* emit these (`itr3.html:2595`, `bankRows = (data.bank||[]).filter(...).map(b => ({IFSCCode, BankName, BankAccountNo, AccountType}))`). They show as reqMISS only because the probe fed no bank rows, so `AddtnlBankDetails[]` emitted empty (ZERO). **Capacity present.** (Caveat: sibling `UseForRefund` and the whole `ForeignBankDetails[]` block are genuinely not emitted; `AccountType` is exported as the raw UI string e.g. "Savings" rather than the schema code "SB" — catalog line 373.)
- **`ScheduleTDS1.TDSonSalary[]` and `ScheduleTDS2.TDSOthThanSalaryDtls[]` → ⚠ naming-delta / mis-keyed.** TDS *is* captured from AIS and emitted (`itr3.html:2666-2667`) but under **legacy top-level keys `ITR3.TDSonSalaries` / `ITR3.TDSonOthThanSals`**, which do **not exist** in the Ver1.0/Ver1.1 schema (schema requires `ScheduleTDS1` / `ScheduleTDS2`). The concept + data are present, so this is not a true structural gap — but as emitted it is **non-conformant and would be rejected**. Child names also differ (`TotTDSOnAmtPaid` vs schema `TotalTDSonSalaries`, missing the schedule-level total). Highest-value correction: a key/child rename, not new capture.

**False-MISS found: 5 leaves** (4 bank-detail = clean capacity; 1 TDS block = mis-keyed defect). The other 7 spot-checks (PARTA_OI.*, BP.BusSetoffCurrYr.SpeculativeInc.*, PartB_TTI.GrossTaxPay.TaxInc17, TaxRelief.TotTaxRelief, PartA_GEN1.Address.Phone.STDcode, Schedule112A.*, NatOfBus[].Code / ScheduleS·HP·OS) confirmed as **true MISS** — no emission under any alias. The exact-path diff is otherwise clean.

## 5. AY delta (2025-26 → 2026-27) that affects us

- **Two required-only sections dropped in 2026-27:** `PartA_139_8A` (updated-return, 12 req) and `PartB-ATI` (additional-tax-on-updated-income, 20 req) exist only in the 2025-26 schema. We emit neither in either year, so dropping them slightly *raises* our 2026-27 headline (fewer required leaves to miss).
- **Capital-gains schema shrank:** `ScheduleCGFor23` fell from 483 → 294 required leaves, and Schedule112A/115AD from 24 → 20 each, as the 2026-27 regime collapses to a single 12.5 % LTCG bucket and drops `ShortTerm15Per` / `LongTerm10Per` / `LongTerm20Per` (catalog line 360-361). We emit CG in neither year, so this only reduces the absolute miss count.
- **CYLA/BFLA rate buckets:** 2025-26 carries extra `STCG15Per` / `LTCG10Per` / `LTCG20Per` keys (hence 2025-26 CYLA req 43 vs 37, BFLA 70 vs 58). Our pass-through skeleton covers the surviving buckets identically; reqMISS is unchanged at 16/28.
- **FilingStatus:** 2025-26 adds `OptOutNewTaxRegime_Method`; `ItrFilingDueDate` differs (`2025-09-15` → `2026-07-31`). Handled by builder AY constants.
- **Net effect:** the capability *gap* is structurally identical across both years — the same 55–57 schedules are absent. The 1.4-pt headline difference (21.4 % vs 20.0 %) is driven almost entirely by 2026-27 having fewer required leaves (CG shrink + no 139(8A)/ATI), not by any change in what we emit.
