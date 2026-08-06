# ITR-5 — Real ITD Schema Conformance

**Form:** ITR-5 (firms / LLP / AOP / BOI / co-operative / AJP)
**Emitter:** `public/tax-utilities/itr5.html` → `buildITR()` (returns `{ITR:{ITR5:…}}` overlaid on `SKEL`, the official "ITR-5 AY 2026-27 Ver1.0" skeleton). There is **no `validateItr5`** — the only export gate is `preflight()` (13 identity/verifier checks).
**AYs compared:** 2026-27 (native build) and 2025-26.
**⚠ AY-mismatch:** only one ITR-5 file ships and it is an **AY 2026-27** build (`Form_ITR5.AssessmentYear="2026"`, `SchemaVer=Ver1.0`). It is scored against the **2025-26** schema as a *structural proxy only* — treat the 2025 column as indicative, not a filing verdict.

## Headline

| AY | schema leaves | required | reqPresent (OK+ZERO) | reqMISS | **% required present** | reqOK (non-zero) |
|---|---|---|---|---|---|---|
| **2026-27** | 2566 | 1869 | 427 | 1442 | **22.8 %** | 41 |
| **2025-26** (proxy) | 2790 | 2083 | 425 | 1658 | **20.4 %** | 41 |

Presence = leaf emitted at all (OK or ZERO). The tool emits ~430 leaf-paths total; only **41 carry a non-zero value** — essentially the identity block (Form/CreationInfo/GEN1/Verification) plus a fully **zero-filled** skeleton for PARTA_BS, PARTA_PL, CorpScheduleBP, PartB-TI and PartB_TTI. Every other schedule is structurally **absent** (never written by `buildITR`). This is a *skeleton-and-identity* emitter, not a full-return builder.

---

## Per-schedule capacity (AY 2026-27)

"present" = leaves emitted (OK+ZERO = total − MISS). Status: ✓ mostly present · ◑ partial · ✗ absent.

| Schedule | required | present | reqMISS | status |
|---|---|---|---|---|
| Form_ITR5 | 5 | 5 | 0 | ✓ |
| CreationInfo | 6 | 6 | 0 | ✓ |
| Verification | 6 | 6 | 0 | ✓ |
| PartB-TI | 36 | 37 | 0 | ✓ (all zero) |
| CorpScheduleBP | 114 | 105 | 9 | ✓ (all zero) |
| PARTA_BS | 98 | 94 | 4 | ◑ (zero skeleton) |
| PARTA_PL | 137 | 113 | 24 | ◑ (zero skeleton) |
| PartB_TTI | 41 | 36 | 9 | ◑ (zero skeleton) |
| PartA_GEN1 | 43 | 25 | 18 | ◑ |
| PartA_GEN2 | 31 | 5 | 26 | ✗ mostly |
| PARTA_OI | 95 | 0 | 95 | ✗ |
| PARTA_QD | 21 | 0 | 21 | ✗ |
| ManufacturingAccount | 6 | 0 | 6 | ✗ |
| TradingAccount | 11 | 0 | 11 | ✗ |
| ScheduleCG | 261 | 0 | 261 | ✗ |
| ScheduleOS | 102 | 0 | 102 | ✗ |
| ScheduleHP | 31 | 0 | 31 | ✗ |
| ScheduleBFLA | 67 | 0 | 67 | ✗ |
| ScheduleCYLA | 35 | 0 | 35 | ✗ |
| ScheduleCFL | 31 | 0 | 31 | ✗ |
| ITRScheduleUD | 18 | 0 | 18 | ✗ |
| ScheduleDPM | 59 | 0 | 59 | ✗ |
| ScheduleDOA | 98 | 0 | 98 | ✗ |
| ScheduleDEP | 10 | 0 | 10 | ✗ |
| ScheduleDCG | 10 | 0 | 10 | ✗ |
| ScheduleVIA | 6 | 0 | 6 | ✗ |
| Schedule80G | 60 | 0 | 60 | ✗ |
| Schedule80GGA | 9 | 0 | 9 | ✗ |
| Schedule80GGC | 9 | 0 | 9 | ✗ |
| Schedule80IAC | 5 | 0 | 5 | ✗ |
| Schedule80P | 2 | 0 | 2 | ✗ |
| Schedule80RA | 8 | 0 | 8 | ✗ |
| Schedule80_IA/_IB/_IC | 6/12/19 | 0 | 6/12/19 | ✗ |
| Schedule10AA | 3 | 0 | 3 | ✗ |
| Schedule112A | 17 | 0 | 17 | ✗ |
| Schedule115AD | 17 | 0 | 17 | ✗ |
| ScheduleAMT | 9 | 0 | 9 | ✗ |
| ScheduleAMTC | 19 | 0 | 19 | ✗ |
| ScheduleSI | 6 | 0 | 6 | ✗ |
| ScheduleIT | 5 | 0 | 5 | ✗ |
| ScheduleTDS2 | 6 | 0 | 6 | ✗ |
| ScheduleTDS3 | 6 | 0 | 6 | ✗ |
| ScheduleTCS | 5 | 0 | 5 | ✗ |
| ScheduleFA | 108 | 0 | 108 | ✗ |
| ScheduleFSI | 23 | 0 | 23 | ✗ |
| ScheduleTR1 | 9 | 0 | 9 | ✗ |
| SchedulePTI | 54 | 0 | 54 | ✗ |
| ScheduleEI | 11 | 0 | 11 | ✗ |
| ScheduleESR | 30 | 0 | 30 | ✗ |
| ScheduleIF | 10 | 0 | 10 | ✗ |
| ScheduleGST | 2 | 0 | 2 | ✗ |
| ScheduleVDA | 8 | 0 | 8 | ✗ |
| ScheduleTPSA | 13 | 0 | 13 | ✗ |
| Schedule115TD / ScheduleICDS / Schedule80LA | 0 | 0 | 0 | ✗ (no req) |

**AY 2025-26 (proxy) deltas:** same absence profile plus two schedules the 2026 schema dropped — **PartB-ATI** (updated-return computation, 19 reqMISS) and **PartA_139_8A** (updated-return particulars, 12 reqMISS) — both entirely absent from our build. ScheduleCG is larger in the 2025 tree (415 reqMISS vs 261). PartB-TI shows 3 reqMISS in 2025 (see §4).

---

## 3. Ranked filing-blockers (most material first)

Every item below is a **required** schedule that is entirely or mostly MISS. "Captured-but-not-exported" = the data IS collected in the itr5.html UI but `buildITR` never serialises it — these are the highest-value fixes (the input work is already done).

1. **PartA_GEN2 — Partner/Member roster + audit particulars** (~26 reqMISS 2026 / 29 2025). `PartnerOrMemberInfo[]` (name/PAN/share%/remuneration/interest/address), `AuditInfo`, `AuditDetails[]`, `AuditReportDetails[]`, `PrevYrMemPart`. **Captured-but-not-exported** — the UI has a full Partners/Members master-detail grid (`sf-partners`) and an Other-Audits grid, but the catalog and code confirm partner rows have *no mapping in buildITR*. A firm/LLP return is **invalid without its partner list** → top blocker despite the data being keyed in.

2. **PARTA_OI — Other Information (tax-audit disallowances, s.145 method, 43B, 40/40A)** (95 reqMISS). **Truly absent** as a schedule — `buildITR` writes no `PARTA_OI` node at all. Partial mitigation: the s.36/37/40/40A/43B disallowance *breakups* (`sf-c-36…`) are captured and routed **into CorpScheduleBP** (`AmtDebPLDisallowUs36…`), so the underlying figures exist but the OI schedule itself is never emitted.

3. **ScheduleCG — Capital Gains** (261 reqMISS 2026 / 415 2025 — the single largest node block). **Partially captured-but-not-exported:** the UI has CG entry (`cg` popup kind) and CG totals reach `PartB-TI.CapGain.*` (present as ZERO), but the entire ScheduleCG detail (STCG/LTCG sub-heads, 111A/112A/115AD, indexation, set-off matrix) is never serialised.

4. **ScheduleOS — Income from Other Sources** (102 reqMISS). Absent; only the OS aggregate reaches `PartB-TI.IncFromOS`. Sub-schedules 112A/115AD (34 reqMISS) similarly absent.

5. **PARTA_PL / PARTA_BS — full financial statements.** Present only as the **zero-filled skeleton**. The itr5.html "ITR B/S" and "ITR P&L" tabs collect the complete balance sheet and P&L (dozens of `data-b` fields, breakup popups), but the catalog confirms **none of those figures is overlaid onto the JSON** — only the *books-not-maintained* path (`NoBooksOfAccBS`, 4 fields) is written. **Captured-but-not-exported**, and material for any audited firm.

6. **Loss set-off / carry-forward chain** — ScheduleBFLA (67/82), ScheduleCYLA (35/41), ScheduleCFL (31/30), ITRScheduleUD (18). All **truly absent**; only the single `BroughtFwdLossesSetoff` aggregate reaches PartB-TI. Loss returns cannot be validly filed.

7. **Chapter VI-A & profit-linked deductions** — ScheduleVIA (6), Schedule80G (60), 80GGA/80GGC/80IAC/80-IA/IB/IC/80P/80RA/10AA. Absent; only a lumped `DeductionsUndSchVIADtl.PartCchapterVIA` total is emitted.

8. **Tax-credit schedules** — ScheduleIT (5), ScheduleTDS2 (6), ScheduleTDS3 (6), ScheduleTCS (5). Absent; only lumped `TaxPaid.TaxesPaid.{AdvanceTax,TDS,TCS,SelfAssessmentTax}` totals reach PartB_TTI, so **challan-/deductor-level credit detail is unrecoverable** — refunds/credits will fail portal cross-validation.

9. **Depreciation** — ScheduleDPM (59), ScheduleDOA (98), ScheduleDEP (10), ScheduleDCG (10). Absent; a single `DepreciationAllowITAct32` figure is pushed into CorpScheduleBP.

10. **ScheduleFA — Foreign Assets** (108 reqMISS). **Captured-but-not-exported** — nine full FA detail tables exist in the UI, but only the `ForeignExchangeFlag` boolean is emitted.

---

## 4. False-MISS corrections (semantic naming deltas)

Spot-checked ~12 "REQUIRED MISSING" leaves against `buildITR` (grep in itr5.html). Matches are clean — the emitter was written to schema names, so most MISS are genuine structural absences. **Two false-MISS concepts found (≈8 leaves):**

- **⚠ `PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[]` (5 leaves — IFSCCode/BankName/BankAccountNo/AccountType/UseForRefund).** Marked reqMISS in both AYs, but `buildITR:2588` **does** emit this array (with SB/CA/CC/OD account-type mapping) whenever a bank row has IFSC + account no. The probe seeded no bank rows, so the empty array produced no child paths → false-MISS. **Capability present; not a real gap.** (Sibling `ForeignBankDetails[]` — 4 leaves — is a *true* MISS: never emitted.)
- **⚠ PartB-TI capital-gains rate buckets (3 leaves, 2025 only): `ShortTerm15Per`, `LongTerm10Per`, `LongTerm20Per`.** The 2026 tool emits the *post-Jul-2024* buckets instead — `ShortTerm20Per`, `ShortTermAppRate`, `LongTerm12_5Per` (`buildITR:2518-2522`). So the CG-summary concept **is** emitted, just under the new rate-bucket names the 2025 schema doesn't have. Semantic/AY naming delta, not a missing capability.

**False-MISS found: 2 concepts / 5 leaves (AY2026), 8 leaves (AY2025).** All remaining sampled MISS (PARTA_OI, TradingAccount, ManufacturingAccount, ScheduleCG/OS/HP/BFLA/VIA/80G, PartnerOrMemberInfo, NatureOfBusiness) confirmed **genuinely absent** from `buildITR`.

---

## 5. AY delta (2025-26 → 2026-27) affecting us

- **Two schedules removed in 2026:** `PartB-ATI` and `PartA_139_8A` (both updated-return u/s 139(8A) machinery). Our build emits neither in either year, so this reduces the 2026 required-leaf denominator (2083 → 1869) and is why the 2026 headline (22.8 %) edges above 2025 (20.4 %) despite identical real capability.
- **Capital-gains rate re-buckilng (Finance Act 2024):** 2025 schema keeps `ShortTerm15Per / LongTerm10Per / LongTerm20Per`; 2026 schema (and our tool) use `ShortTerm20Per / LongTerm12_5Per / ShortTermAppRate`. Because the tool is a 2026 build, its CG buckets are **structurally wrong against the 2025 schema** — a filing risk if this build were ever used for an AY2025-26 return.
- **ScheduleCG expanded** in the 2025 tree (486 leaves / 415 req) vs 2026 (320 / 261) — but since we emit zero CG detail in both, the practical impact is nil.
- **Schedule112A/115AD** gained `Balance…BE/AE/TotalBalance` grandfathering leaves in 2025 (26 vs 22) — also moot (schedule absent).

Net: the AY gap does **not** change the conclusion — real ITR-5 capability is ~1/5 of required leaves in both years, dominated by wholly-unserialised income-head, loss, deduction and tax-credit schedules, plus captured-but-dropped partner/financial/FA data.
