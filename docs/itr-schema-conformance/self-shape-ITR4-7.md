# ITR-4 / 5 / 6 / 7 — Self-shape analysis (no official schema)

**Scope / method.** Read-only analysis of what our emitters produce for ITR-4, ITR-5,
ITR-6, ITR-7. No code was changed.

## The gating fact: there is no ITD schema for these four forms in our doc set

Both OpenAPI bundles were scanned for the request-body schema node
`schema.properties.ITR.properties.ITR{n}`:

| Node | `openapi.json` | `docs/sandbox-it-docs/.../it/compliance/openapi.json` |
|------|:---:|:---:|
| ITR1 | 4 | 4 |
| ITR2 | 2 | 2 |
| ITR3 | 4 | 4 |
| **ITR4** | **0** | **0** |
| **ITR5** | **0** | **0** |
| **ITR6** | **0** | **0** |
| **ITR7** | **0** | **0** |

Only ITR-1/2/3 have a Sandbox request-body schema. **ITR-4/5/6/7 have none in either
bundle.** Consequence: **conformance cannot be proven here.** We can only describe *our own*
emitted shape. Closing the loop (field names, required-flags, enums, cardinality, tie-out
rules, schema/form version strings) requires the real ITD JSON schema for AY 2026-27.

Emitters live in the standalone tools:
`public/tax-utilities/itr4.html` (`buildItr4Json`, ~L1855),
`itr5.html` (`buildITR`, L2422 over the `SKEL` literal at L2389),
`itr6.html` (`buildJSON`, L2720),
`itr7.html` (`buildITR7Json`, L12027). Catalogs cross-referenced: `docs/itr-structure/ITR-{4..7}.md`.

---

## ITR-4 (Sugam) — `{ITR:{ITR4:{…}}}`

**9 top-level nodes:** `CreationInfo`, `Form_ITR4`, `PersonalInfo`, `FilingStatus`,
`IncomeDeductions`, `TaxComputation`, `TaxPaid`, `Refund`, `Verification`. Flat Sugam
shape — no named Schedules; the three presumptive sections collapse into a single
`IncomeDeductions.IncomeFromBusinessProf` scalar.

**No-emitter-path particulars (per ITR-4.md):** Schedule FA (all nine foreign-asset
disclosures) is captured in the UI but never exported ("Schedule FA data stays local").

**Biggest risk:** `IncomeFromBusinessProf` is read from the DOM span `it_bp_income`
(`buildItr4Json` L1864: `biz=R(calcVal('it_bp_income'))`), but **that span is never
written.** `computeBP()` (L6272) computes the presumptive total and returns it as a local
`bpRes.total` into the tax computation, and the per-section spans `it_bp_44ad_pr` /
`_44ada_pr` / `_44ae` are populated (L6008/6040/6188) — but nothing ever writes the
aggregate back to `it_bp_income` (only readers exist, L1540/L1864). So the exported
business income is **always 0** even though tax was computed on it: the JSON's income and
its tax liability disagree — the defining defect of this form's export.

## ITR-5 (firms/AOP/BOI/LLP) — `{ITR:{ITR5:{…}}}`

**10 top-level nodes** (the `SKEL` literal returned by `buildITR`): `CreationInfo`,
`Form_ITR5`, `PartA_GEN1`, `PartA_GEN2`, `PARTA_BS`, `PARTA_PL`, `CorpScheduleBP`,
`PartB-TI`, `PartB_TTI`, `Verification`.

**No-emitter-path:** `buildITR` actively fills only identity/filing-status, `PartB-TI`,
`PartB_TTI`, and the required leaves of `CorpScheduleBP.BusinessIncOthThanSpec`. It touches
`PARTA_BS` only via the optional `NoBooksOfAccBS` branch (books-not-maintained). **`PARTA_PL`
is never assigned** and most of `PARTA_BS` / `CorpScheduleBP` ships at the skeleton's zeros.

**Biggest risk:** for any firm **maintaining books**, the full Balance-Sheet (`PARTA_BS`
FundSrc/FundApply) and the entire Profit-&-Loss (`PARTA_PL`) are exported as **all-zero
skeletons** — the P&L is never populated at all. A real filing would fail Schedule-BP
tie-outs / BS-does-not-balance validation at the portal.

## ITR-6 (companies) — `{ITR:{ITR6:{…}}}`

**12 top-level nodes:** `CreationInfo`, `Form_ITR6`, `PartA_GEN1`, `PartA_GEN2`,
`PARTA_BS`, `CorpScheduleBP`, `ScheduleHP`, `ScheduleCG`, `ScheduleOS`, `PartB_TI`,
`PartB_TTI` (incl. `MATDetails`, `TaxPaid`, `Refund`), `Verification`.

**No-emitter-path:** the UI is far richer than the export — the catalog (`ITR-6.md`)
documents a config-driven sheet of **13 statute-order parts / 360 rows / 120 drill-in
popups**, but `buildJSON` emits only the collapsed nodes above.

**Biggest risk (least-complete emitter of the four):** `PARTA_BS` is reduced to two scalars
— `TotalLiabilities` and `TotalAssets` (L2745) — with no FundSrc/FundApply detail; there is
**no `PARTA_PL` node at all**, `ScheduleCG` is three totals, and there are no
CYLA/BFLA/CFL/VIA-detail/depreciation schedules. A company return that the ITD schema
expects to carry a full balance sheet, P&L and depreciation schedules would be rejected
outright.

## ITR-7 (trusts/institutions) — `{ITR:{ITR7:{…}}}`

**10 top-level nodes:** `CreationInfo`, `Form_ITR7`, `PartA_GEN1`, `PartA_GEN2`,
`PARTA_BS`, `ScheduleVC`, `ScheduleAI`, `PartB_TI`, `PartB_TTI`, `Verification`. The
charitable flow (`ScheduleVC` voluntary contributions, `ScheduleAI` other income, and the
`PartB_TI` application/accumulation computation) is genuinely built from inputs.

**No-emitter-path:** the `Computation` tab is a separate iframe that is **inert at runtime**
(`ITR-7.md`: "comp frame inert"), so promised auto-fills into the computation cannot
happen; Form 10B/10BB tabs and Schedule FA detail (only an `AssetOutsideIndiaFlg` flag is
emitted) have no export path.

**Biggest risk:** the entire tax side is **hard-coded to 0**. `PartB_TTI`
(`ComputationOfTaxLiability`, all surcharge/cess/relief, `TaxPaid`, `Refund.RefundDue`) is
emitted with literal `0`s (L12245-12260), and `PartB_TI`'s HP/CG/BP/OS members are likewise
`0` (L12227-12242). Because the Computation view never runs, **every ITR-7 export declares
zero tax liability and zero taxes paid** regardless of the trust's actual position.

---

**Bottom line.** Without an official ITR-4/5/6/7 schema, none of the above can be validated
as conformant — only described. To close the loop we need the ITD AY 2026-27 JSON schema
for each form (field names, required/enum constraints, cardinality, schema/form version
strings, and inter-schedule tie-out rules).
