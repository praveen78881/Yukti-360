# ITR-7 — REAL Schema Conformance (ITD JSON-Schema)

**Form:** ITR-7 (trust / society / section-8) · emitter `buildITR7Json()` @ `public/tax-utilities/itr7.html:12027`
**AYs compared:** 2026-27 and 2025-26.
**Schema version:** emitter self-declares `Form_ITR7.SchemaVer = "Ver1.0"`, `AssessmentYear "2026"`. Trees resolved from the real ITD JSON-Schemas for each AY.

> ⚠ **AY-MISMATCH.** Our tool ships **one AY-2026-27 build only** (`ITR-7.md:5` — "no 2025-26 file ships"). The AY-2025-26 comparison therefore uses the same 2026 emitter as a **structural proxy** — treat the 2025 column as "how our current builder would fare against last year's schema shape," not a real 2025 tool.

## 1. Headline

| AY | schema leaves | required | reqPRESENT (OK+ZERO) | reqMISS | **% required PRESENT** |
|---|---|---|---|---|---|
| 2026-27 | 1697 | 1255 | 176 | 1079 | **14.0 %** |
| 2025-26 | 1917 | 1442 | 176 | 1266 | **12.2 %** |

Presence is essentially frozen at **176 required leaves** across both AYs — the emitter writes the same narrow slice (188 total leaf-paths, 29 non-zero) regardless of schema year; the newer/older schema only changes the denominator. The emitter is a **thin donations + balance-sheet + verification exporter**; the entire trust income-computation, application, corpus, accumulation, capital-gains, and TDS machinery is absent from the JSON even though much of it is fully captured in the UI.

## 2. Per-schedule capacity (from diff per-schedule stats)

`present = OK+ZERO`. Status: ✓ mostly present · ◑ partial · ✗ absent.

| Schedule | AY26 req | AY26 present | AY26 reqMISS | AY25 req | AY25 present | AY25 reqMISS | Status |
|---|---|---|---|---|---|---|---|
| CreationInfo | 6 | 6 | 0 | 6 | 6 | 0 | ✓ |
| Form_ITR7 | 5 | 5 | 0 | 5 | 5 | 0 | ✓ |
| Verification | 6 | 6 | 0 | 6 | 6 | 0 | ✓ |
| ScheduleVC (donations) | 19 | 19 | 0 | 19 | 19 | 0 | ✓ |
| PartB_TI | 45 | 47 | 0 | 48 | 47 | 3 | ✓ |
| PARTA_BS | 34 | 36 | 2 | 34 | 36 | 2 | ✓ |
| ScheduleAI | 13 | 11 | 2 | 13 | 11 | 2 | ✓ |
| PartB_TTI | 41 | 32 | 9 | 41 | 32 | 9 | ✓ (9 miss = bank arrays, see §4) |
| PartA_GEN1 | 48 | 23 | 30 | 43 | 23 | 25 | ◑ |
| PartA_GEN2 | 33 | 2 | 31 | 33 | 2 | 31 | ✗ |
| PartB_TI2 | 47 | 0 | 47 | 50 | 0 | 50 | ✗ |
| PartB_TI3 | 42 | 0 | 42 | 45 | 0 | 45 | ✗ |
| CorpScheduleBP | 72 | 0 | 72 | 72 | 0 | 72 | ✗ |
| ScheduleA (application) | 15 | 0 | 15 | 15 | 0 | 15 | ✗ |
| ITRScheduleJ (corpus/loans) | 48 | 0 | 48 | 48 | 0 | 48 | ✗ |
| ITRScheduleI (accum 11(2)) | 28 | 0 | 28 | 28 | 0 | 28 | ✗ |
| ITRScheduleD (deemed appl.) | 16 | 0 | 16 | 16 | 0 | 16 | ✗ |
| ITRScheduleDA / IA / R | 8 | 0 | 8 | 8 | 0 | 8 | ✗ |
| Schedule115BBI | 7 | 0 | 7 | 7 | 0 | 7 | ✗ |
| Schedule115TD (accreted) | 5 | 0 | 5 | 5 | 0 | 5 | ✗ |
| ScheduleCG (cap. gains) | 254 | 0 | 254 | 402 | 0 | 402 | ✗ |
| ScheduleOS | 96 | 0 | 96 | 96 | 0 | 96 | ✗ |
| ScheduleHP | 31 | 0 | 31 | 31 | 0 | 31 | ✗ |
| ScheduleCYLA | 26 | 0 | 26 | 32 | 0 | 32 | ✗ |
| ScheduleFA (foreign assets) | 110 | 0 | 110 | 110 | 0 | 110 | ✗ |
| ScheduleFSI / TR1 | 33 | 0 | 33 | 33 | 0 | 33 | ✗ |
| SchedulePTI | 47 | 0 | 47 | 47 | 0 | 47 | ✗ |
| ScheduleSH | 29 | 0 | 29 | 29 | 0 | 29 | ✗ |
| ScheduleET / ScheduleSI | 19 | 0 | 19 | 19 | 0 | 19 | ✗ |
| ScheduleIE_I…IV | 27 | 0 | 27 | 27 | 0 | 27 | ✗ |
| ScheduleIT / TDS2 / TDS3 / TCS | 22 | 0 | 22 | 22 | 0 | 22 | ✗ |
| ScheduleOA | 6 | 0 | 6 | 6 | 0 | 6 | ✗ |
| SchedulePP (AY26) / ScheduleVDA | 17 | 0 | 17 | 8 | 0 | 8 | ✗ |
| **AY25-only:** PartA_139_8A | — | — | — | 10 | 0 | 10 | ✗ |
| **AY25-only:** PartB-ATI | — | — | — | 19 | 0 | 19 | ✗ |
| **AY25-only:** ScheduleLA | — | — | — | 9 | 0 | 9 | ✗ |

**Fully-absent required schedules:** ~35 (AY26) / ~37 (AY25), plus PartA_GEN1 partial.

## 3. Ranked filing-blockers (most-material first)

1. **PartB_TI2 + PartB_TI3 — income computation u/s 11-13 & exemptions u/s 10 (89 req leaves, AY26).** The ITR-7-specific tax-base computation (exemptions 10(21)–10(47), income-not-forming-part, corpus-standing-credit disallowances, additions u/s 12/13/115BBI). **Truly absent** — emitter writes only a flat `PartB_TI` slice; the s.11(3)/13 computation chain has no builder code. The portal cannot compute tax without it. *Largest raw structural gap.*
2. **ScheduleA — Application of income (15 req).** The defining schedule of a charitable-trust return. **Captured-but-not-exported:** the full Application screen (`sec-app`, Revenue/Capital A/B/C blocks, `ap.*`, `noncorp`, `othexp_*`) is built in the UI, but the emitter exports only a gross `PartB_TI.AmtForCharitableUs111` — Schedule A itself (the Revenue/Capital/Total breakdown the portal requires) is dropped entirely.
3. **ITRScheduleJ + ScheduleI + ScheduleD (92 req).** Corpus fund (J A1/A2), 11(5) investments, accumulation u/s 11(2), deemed application. **Captured-but-not-exported:** the UI captures corpus (`sf-corpus`, `corpus[]`), loans (`sf-lb`), accumulation (`sf-accum`, `accum[]`) and deemed application (`sf-deemed`, `deem[]`) in rich fixed-row grids — the emitter feeds only aggregate totals into `PartB_TI.TIDeductions` and writes **nothing** to any ITRScheduleJ/I/D node.
4. **PartA_GEN2 — audit + author/founder/substantial-contributor identity (31 req).** **Captured-but-not-exported:** UI captures audits (`sf-audit`, `auditIT[]`), trustees/authors (`sf-trustees`, `trustees[]`, `substc[]`) but the emitter emits only two flags (`LiableSec44ABflg`, `LiableAnyOthThnINTActflg`); every `AuditDetails[]`, `AuthorFounderDtls5percent[]`, `ContributionUs13_3bDtls[]` row is absent.
5. **PartA_GEN1 registration/approval + projects (30 req, ◑).** **Captured-but-not-exported:** registrations (`sf-reg`, `regIT[]`/`regOth[]`) and projects (`sf-proj`, `proj[]`) are captured but only `ProjectOrInstDtlsFlg` is emitted — `RegApprUnderITADtls[]` (12A/12AB/10(23C) approval numbers) is absent; a trust claiming s.11 exemption cannot file without it.
6. **Schedule115TD — accreted income (5 req).** **Captured-but-not-exported:** the entire `sec-115td` screen (`td.*`, `fmv[]`, `challan[]`) is built but the emitter exports only `NetTaxPyblOn115TDInc:0`.
7. **Income-head schedules truly absent:** ScheduleCG (254/402), ScheduleOS (96), ScheduleHP (31), ScheduleFA (110), CorpScheduleBP (72), SchedulePTI (47) — no UI capture and no emitter output; only relevant if the trust has those incomes.

## 4. False-MISS corrections (semantic naming / probe-data deltas)

Spot-checked ~12 required-MISSING leaves against the emitter. **7 false-MISS found:**

- **`PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[].{IFSCCode,BankName,BankAccountNo,AccountType,UseForRefund}` (5 leaves)** — reclassify ⚠ **not a structural gap**. The emitter *does* map every one of these (`itr7.html:12266-12271`); they show MISS only because the probe fed **zero bank rows**, so the array emitted empty. Capacity exists — behaves like ZERO.
- **`PartB_TI2.*` mirror leaves** (`IncomeFromHP`, `VoluntaryContributions`, `GrossIncome`, `ProfBusGain.ProfGainNoSpecBus`, `CapGain.ShortTerm.*`, `IncFromOS.TotIncFromOS`) — reclassify ⚠ **semantic-partial**. The concepts *are* emitted, but under **`PartB_TI.*`** (the diff confirms `PartB_TI` reqMISS=0), not the schema's separate `PartB_TI2` block. Naming/placement delta: our builder collapses the two-part income statement into one `PartB_TI` node, so the `PartB_TI2` duplicates read as MISS.
- **`ScheduleAI.OthersInc.OthersIncDtls[].{OthNatOfInc,OthAmount}`** — ⚠ semantic-partial: itemised rows dropped but their **total is exported** as `ScheduleAI.TotalofOtherIncomes` (`itr7.html:12191`).

The remaining spot-checked MISSes (ScheduleJ/I/D, ScheduleA, PartA_GEN2 audit/author arrays, PartA_GEN1 RegApprUnderITADtls, Schedule115TD) are **genuine** — data is captured in the UI but truly not written by the emitter (the highest-value "captured-but-not-exported" class).

## 5. AY delta (2025-26 → 2026-27) affecting us

- **Schema shrank** 1917→1697 leaves (1442→1255 required). Three whole blocks present in 2025-26 are **gone in 2026-27**: `PartA_139_8A` (updated-return 139(8A), 10 req), `PartB-ATI` (additional-tax-on-updated-income, 19 req), `ScheduleLA` (political-party, 9 req). Our emitter writes none of these in either year, so their removal *reduces our required-MISS denominator* but changes no capability.
- **ScheduleCG** contracted 402→254 req leaves (removal of the 15 %/10 %/20 % legacy CG rate rows). Correspondingly `PartB_TI.CapGain` lost `ShortTerm15Per`/`LongTerm10Per`/`LongTerm20Per` — hence `PartB_TI` goes from 3 reqMISS (2025) to 0 (2026): the 2026 rate buckets (`ShortTerm20Per`, `LongTerm12_5Per`) are exactly the zeros our emitter already writes. This is the **only** place the AY change nudged our score.
- Net effect: our fixed 176-leaf footprint yields **14.0 % (2026)** vs **12.2 % (2025)** purely from the smaller 2026 denominator — no real capability change between years.
