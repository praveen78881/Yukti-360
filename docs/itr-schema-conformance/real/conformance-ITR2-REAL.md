# ITR-2 — Real-Schema Conformance (ITD JSON-Schema)

**Form:** ITR-2 (Individuals/HUFs, no business income)
**AYs:** 2026-27 and 2025-26
**Emitters:** `public/tax-utilities/itr2.html` (2026-27) · `public/tax-utilities/itr2-2025-26.html` (2025-26); both use `buildItr2Json` (itr2.html:2069-2178). The two files are line-aligned (pure substitutions).
**Schema version emitted:** `Form_ITR2.SchemaVer` = **Ver1.1** (2026-27) / **Ver1.0** (2025-26). `FormVer` Ver1.0 both.
**Inputs:** `trees/tree-ITR2-{ay}.txt`, `emitted/itr2*.txt`, `diff/diff-ITR2-{ay}.txt`, `docs/itr-structure/ITR-2.md`.

## 1. Headline

| AY | Schema leaves | Required leaves | Required PRESENT (OK+ZERO) | reqMISS | **% required present** |
|---|---|---|---|---|---|
| **2026-27** | 1592 | 1182 | 140 (reqOK 34 + reqZERO 106) | 1042 | **11.8 %** |
| **2025-26** | 1832 | 1411 | 157 (reqOK 33 + reqZERO 124) | 1254 | **11.1 %** |

> % required present = (required − reqMISS) / required, per the metric definition. (The diff's own "%required-fillable 2.9%/2.3%" is the stricter reqOK-only figure.)

The emitter is a **thin summary emitter**: it fills identity (PartA_GEN1 PersonalInfo/FilingStatus), the aggregate income/tax rollups (PartB-TI, PartB_TTI, plus all-zero ScheduleCYLA/ScheduleBFLA), bank refund rows, and Verification. **Every detail schedule (capital gains, house property, other sources, all Chapter VI-A sub-schedules, FA, AL, TDS/TCS/IT, PTI/SPI) is entirely absent from the export** — even where the UI/calculator captures the data.

## 2. Per-schedule capacity (AY 2026-27)

present = OK + ZERO. Status: ✓ mostly present · ◑ partial · ✗ absent.

| Schedule | req | present | reqMISS | status |
|---|---|---|---|---|
| CreationInfo | 6 | 6 | 0 | ✓ |
| Form_ITR2 | 5 | 5 | 0 | ✓ |
| PartA_GEN1 | 43 | 27 | 23 | ◑ |
| PartB-TI | 30 | 30 | 0 | ✓ (all ZERO) |
| PartB_TTI | 48 | 35 | 13 | ◑ |
| Verification | 4 | 6 | 0 | ✓ |
| ScheduleCYLA | 28 | 18 | 10 | ◑ |
| ScheduleBFLA | 32 | 22 | 10 | ◑ |
| Schedule112A | 21 | 0 | 21 | ✗ |
| Schedule115AD | 21 | 0 | 21 | ✗ |
| Schedule5A2014 | 18 | 0 | 18 | ✗ |
| Schedule80C | 3 | 0 | 3 | ✗ |
| Schedule80D | 21 | 0 | 21 | ✗ |
| Schedule80DD | 4 | 0 | 4 | ✗ |
| Schedule80E | 8 | 0 | 8 | ✗ |
| Schedule80EE | 8 | 0 | 8 | ✗ |
| Schedule80EEA | 9 | 0 | 9 | ✗ |
| Schedule80EEB | 9 | 0 | 9 | ✗ |
| Schedule80G | 60 | 0 | 60 | ✗ |
| Schedule80GGA | 15 | 0 | 15 | ✗ |
| Schedule80GGC | 9 | 0 | 9 | ✗ |
| Schedule80U | 3 | 0 | 3 | ✗ |
| ScheduleAL | 16 | 0 | 16 | ✗ |
| ScheduleAMT | 4 | 0 | 4 | ✗ |
| ScheduleAMTC | 17 | 0 | 17 | ✗ |
| ScheduleCFL | 32 | 0 | 32 | ✗ |
| **ScheduleCGFor23** | **258** | **0** | **258** | ✗ |
| ScheduleEI | 17 | 0 | 17 | ✗ |
| ScheduleESOP | 9 | 0 | 9 | ✗ |
| ScheduleFA | 108 | 0 | 108 | ✗ |
| ScheduleFSI | 23 | 0 | 23 | ✗ |
| ScheduleHP | 29 | 0 | 29 | ✗ |
| ScheduleIT | 5 | 0 | 5 | ✗ |
| ScheduleOS | 113 | 0 | 113 | ✗ |
| SchedulePTI | 54 | 0 | 54 | ✗ |
| ScheduleS | 36 | 0 | 36 | ✗ |
| ScheduleSI | 6 | 0 | 6 | ✗ |
| ScheduleSPI | 4 | 0 | 4 | ✗ |
| ScheduleTCS | 3 | 0 | 3 | ✗ |
| ScheduleTDS1 | 5 | 0 | 5 | ✗ |
| ScheduleTDS2 | 6 | 0 | 6 | ✗ |
| ScheduleTDS3 | 6 | 0 | 6 | ✗ |
| ScheduleTR1 | 9 | 0 | 9 | ✗ |
| ScheduleVDA | 7 | 0 | 7 | ✗ |
| ScheduleVIA | 7 | 0 | 7 | ✗ |
| TaxReturnPreparer | 3 | 0 | 3 | ✗ |

**~38 required schedules are entirely absent (✗)** in 2026-27; 4 are partial (◑); 6 are ✓. AY 2025-26 is identical in shape plus two extra all-absent schedules — **PartA_139_8A (12 req)** and **PartB-ATI (20 req)** — the ITR-U / updated-return sections (see §5).

## 3. Ranked filing-blockers (most material first)

Legend: **[CBE]** = captured in the UI/calculator but dropped by the emitter (highest-value — data exists, just not wired to export). **[ABS]** = concept truly absent from our software.

1. **ScheduleCGFor23 — Capital Gains (258 reqMISS / 2026; 441 / 2025).** The single biggest blocker and the whole reason a taxpayer picks ITR-2. **[CBE, partial]** The calculator has full CG drill-ins — LTCG-1, scrip-wise **112A grid** (qty/ISIN/FMV/54F), STCG-1, and an auto-classification table (itr2.html:2494-2501, 2923-3004) — but `buildItr2Json` only sums them into the aggregate `PartB-TI.CapGain` cells. Not one scrip-wise / section-wise node reaches `ScheduleCGFor23`, `Schedule112A`, or `Schedule115AD`. Rejected on upload for any real CG case.
2. **ScheduleOS — Other Sources (113).** **[CBE, partial]** Interest/dividend/winnings amounts flow to the PartB-TI aggregate only; the schedule's per-nature detail, DTAA and special-rate rows are never emitted.
3. **ScheduleFA — Foreign Assets (108).** **[CBE]** All 9 FA drill-ins are captured in `data` but hard-coded `AssetOutIndiaFlag:'N'` (ITR-2.md Discrepancy 3). A resident with foreign assets *must* file ITR-2 — total data loss.
4. **Chapter VI-A detail — 80C/80D/80G/80GGA/80GGC/80DD/80E/80EE/80EEA/80EEB/80U/ScheduleVIA (≈220 combined).** **[ABS/partial]** The calculator produces one aggregate `it_80_total` → `DeductionsUnderScheduleVIA`; no sub-schedule (donee PANs, insurer/policy rows, loan details, disability type) is captured or emitted.
5. **ScheduleHP — House Property (29).** **[CBE, partial]** HP income flows to PartB-TI aggregate; per-property address/co-owner/interest detail dropped.
6. **ScheduleTDS1/TDS2/TDS3, ScheduleIT, ScheduleTCS (25).** **[CBE, conditional]** Prepaid-tax totals go into `PartB_TTI.TaxPaid`, and TDSonSalaries/TDSonOthThanSals emit **only when an AIS file was imported**; challan-wise IT and TCS rows never emit.
7. **PartA_GEN1 identity gaps (23 reqMISS).** **[CBE]** `AssesseeRep` (rep drill-in), `CompDirectorPrvYr` (directorship), `HeldUnlistedEqShrPrYr` (unlisted-shares drill-in), and `Address.Phone` are captured in the UI but suppressed by fixed flags (`AsseseeRepFlg:'N'`, `HeldUnlistedEqShrPrYrFlg:'N'`). These are mandatory-if-applicable identity nodes.
8. **PartB_TTI tax-detail (13 reqMISS).** **[ABS]** ITR-2's calculator omits `window.__taxBreakup`, so surcharge/cess/relief/`TaxDeferred17` and the additional-bank / foreign-bank refund arrays are hard-zeroed (Discrepancy 2).
9. **ScheduleCFL / ScheduleBFLA / ScheduleCYLA loss set-off (32 + 10 + 10).** **[ABS/partial]** CYLA/BFLA emit as all-zero skeletons; CFL (year-wise brought-forward losses, DateOfFiling) is entirely absent.
10. **ScheduleAL — Assets & Liabilities (16).** **[CBE]** All 8 AL drill-ins captured; `AssetOutIndiaFlag`-style suppression means nothing exports. Mandatory when total income > ₹1 cr.
11. **Schedule5A2014 (18), ScheduleSPI/PTI (58), ScheduleAMT/AMTC (21), ScheduleESOP (9), ScheduleEI/SI/FSI/TR1/VDA.** **[CBE for SPI/PTI/ESOP; ABS for the rest]** — captured-in-UI-but-dropped where a drill-in exists, otherwise not modelled.

**Net:** the largest *captured-but-not-exported* losses are ScheduleCGFor23 (incl. Schedule112A), ScheduleFA, ScheduleAL, ScheduleOS, ScheduleHP, PTI/SPI, and the PartA_GEN1 identity blocks — data the UI already holds but the emitter discards.

## 4. False-MISS corrections

Spot-checked 10 required-MISSING leaves against `buildItr2Json`:

- ✅ **4 false-MISS found** — `PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[].{IFSCCode, BankName, BankAccountNo, AccountType}`. The builder **does** emit these (itr2.html:2106 `bankRows`, wired at :2165). They were classified MISS only because the probe fed an empty `data.bank` array, so the array-item leaves never materialised. **Reclassify as ⚠ semantic-partial (capability present).** Same in both AYs. Note the sibling `AddtnlBankDetails[].UseForRefund` is a **genuine** MISS — `bankRows` omits the refund flag.
- Confirmed genuine MISS (not naming deltas): `Address.Phone.STDcode/PhoneNo` (addr object at :2100 has no Phone), `FilingStatus.AssesseeRep.*`, `CompDirectorPrvYr.*`, `HeldUnlistedEqShrPrYr.*` (all suppressed by fixed flags — captured-but-not-exported), `Schedule80D.*`, `Schedule112A.*`, `ScheduleAL.MovableAsset.*`, `ScheduleCGFor23.*`, `Schedule80C.TotalAmt` — none emitted under any alias.

**False-MISS count: 4 per AY** (the four AddtnlBankDetails leaves). No path-naming aliasing was found elsewhere — our emitted paths that do exist match the schema names exactly.

## 5. AY delta 2025-26 → 2026-27 (schema changes affecting us)

- **ITR-U sections exist only in 2025-26:** `PartA_139_8A` (17 leaves / 12 req) and `PartB-ATI` (34 / 20 req) — updated-return u/s 139(8A). Absent from the 2026-27 schema. We emit neither, but they only apply to updated returns, which the tool does not target, so no *new* practical blocker.
- **Split-rate year inflation (2025-26):** the post-23-07-2024 rate split doubles many CG blocks — `ScheduleCGFor23` 510 vs 317 leaves (`EquityMFonSTTDtls_BE`/`_AE` before/after cut-off), and Schedule112A/115AD gain `Balance112ABE/AAE` & `Balance115ADBE/ADAE` (23 req vs 21). CYLA/BFLA/PartB-TI carry extra `STCG15Per`/`LTCG10Per`/`LTCG20Per` buckets (ITR-2.md AY-diff §3). 2026-27 drops the 15/10/20 buckets.
- **SchemaVer** Ver1.0 → **Ver1.1**; `AssessmentYear` 2025→2026; `ItrFilingDueDate` 2025-09-15 → 2026-07-31; export filename year.
- **Net effect on us:** nil functional change — the CG/112A/115AD detail is 0-present in *both* AYs, so the split-rate complexity merely enlarges the 2025-26 gap (1254 vs 1042 reqMISS). Our headline is marginally worse in 2025-26 (11.1 % vs 11.8 %) purely because the schema is larger.
