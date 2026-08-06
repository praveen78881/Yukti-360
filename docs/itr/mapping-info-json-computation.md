# ITR Neuron Wiring — Info ↔ Computation ↔ JSON, and the Validation Rulebook

> The cross-cutting map for all 7 forms: how an **Info-Sheet particular** becomes a **Computation number** and then an **ITD JSON key**, the common key paths, the AIS bridge, the per-form validation rules, and — most important for actual filing — the **filing-readiness matrix** of what each form's JSON currently emits vs omits. Read the per-form `itr-N.md` for field-level detail; this file is the connective tissue.

---

## 1. The universal neuron chain

```
Info Sheet field  ──read by──►  Computation Sheet cell  ──written by buildItrNJson()──►  ITD JSON key
   (e.g. sal_gross)                (it_sal_income)                                        (IncomeFromSal)
        │                               │                                                     │
        └── snapshotted to entity_data ─┘                                          validated by validateItrN()
            (shell autosave, per client×AY×form)                                   before export/upload
```

Every form is a same-origin iframe; the React shell (`income-tax/page.tsx`) only snapshots/restores field values and supplies AIS. **Computation, JSON generation and validation all run inside the HTML tool** (see `00-architecture.md`).

---

## 2. JSON envelope — common across all forms

Every builder emits **`{ ITR: { ITR<N>: { … } } }`** with a `CreationInfo` + `Form_ITR<N>` header, then form-specific blocks, then `Verification`.

| Form | Builder fn | Top blocks | SchemaVer | FormVer | AY | Filename |
|---|---|---|---|---|---|---|
| ITR-1 | `buildItr1Json` | PersonalInfo · FilingStatus · ITR1_IncomeDeductions · ITR1_TaxComputation · TaxPaid · Refund · Verification | **Ver1.1** | Ver1.0 | 2026 | `{PAN}_2026-27_ITR1.json` |
| ITR-2 | `buildItr2Json` | PartA_GEN1 · PartB-TI · PartB_TTI · ScheduleCYLA/BFLA · Verification | **Ver1.1** | Ver1.0 | 2026 | `{PAN}_2026-27_ITR2.json` |
| ITR-3 | `buildItr3Json` | PartA_GEN1/2 · PARTA_BS · PARTA_PL · ITR3ScheduleBP · CYLA/BFLA · PartB-TI · PartB_TTI · Verification | **Ver1.1** | Ver1.0 | 2026 | `{PAN}_2026-27_ITR3.json` |
| ITR-4 | `buildItr4Json` | PersonalInfo · FilingStatus · IncomeDeductions · TaxComputation · TaxPaid · Refund · Verification | **Ver1.1** | Ver1.0 | 2026 | `{PAN}_2026-27_ITR4.json` |
| ITR-5 | `buildITR` (SKEL clone) | PartA_GEN1 · PartA_GEN2 · PARTA_BS · PARTA_PL · CorpScheduleBP · PartB-TI · PartB_TTI · Verification | **Ver1.0** | Ver1.0 | 2026 | `{PAN}_2026_ITR5.json` |
| ITR-6 | `buildJSON` | PartA_GEN1/2 · PARTA_BS · CorpScheduleBP · ScheduleHP/CG/OS · PartB_TI · PartB_TTI(+MATDetails) · Verification | **Ver1.0** | Ver1.0 | 2026 | `{PAN}_ITR6_AY2026-27.json` |
| ITR-7 | `buildITR7Json` | PartA_GEN1.OrgFirmInfo · FilingStatus · PARTA_BS · ScheduleVC · ScheduleAI · PartB_TI · PartB_TTI · Verification | **Ver1.0** | Ver1.0 | 2026 | `{PAN}_ITR7_AY2026-27.json` |

`CreationInfo` everywhere carries placeholder software creds — `SWCreatedBy/JSONCreatedBy` = `SW20000000` (ITR-1..4) or `SW10000000` (ITR-5/6/7), `Digest:'-'`. **These are not real registered-utility credentials** (a filing concern, §6).

---

## 3. Common field → JSON key paths (the identity/tax spine)

These map the same way across forms (individual forms use `PersonalInfo`; ITR-5/6/7 use `OrgFirmInfo`):

| Concept | Info field | JSON key (individual / statutory) |
|---|---|---|
| Name | `cl_name`/`asr_name` | `PersonalInfo.AssesseeName.*` / `OrgFirmInfo.AssesseeName.SurNameOrOrgName` |
| PAN | `cl_pan`/`asr_pan` | `PersonalInfo.PAN` / `OrgFirmInfo.PAN` |
| DOB / Date of formation | `cl_dob`/`cl_dof` | `PersonalInfo.DOB` / `OrgFirmInfo.DateOFFormOrIncorp` |
| Status | `cl_status` | `PersonalInfo.Status` (I/H) / `OrgFirmInfo.StatusOrCompanyType` (coded) |
| Address | `asr_flat/road/area/city/state/pin` | `…Address.{ResidenceNo,RoadOrStreet,LocalityOrArea,CityOrTownOrDistrict,StateCode,PinCode,MobileNo,EmailAddress}` |
| Regime | `it_regime` / `f_regime` | `FilingStatus.OptOutNewTaxRegime` (N=new / Y=old) |
| Return section | `f_section`/`sec` | `FilingStatus.ReturnFileSec.IncomeTaxSec` |
| **Total income** | `it_totalIncome` | `…IncomeDeductions.TotalIncome` / `PartB-TI.TotalIncome` |
| **Tax on TI** | `it_taxOnTI` | `…TaxComputation`/`PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.*` |
| Prepaid taxes | `it_tdstcs/advtax/sat` | `TaxPaid.TaxesPaid.{TDS,TCS,AdvanceTax,SelfAssessmentTax,TotalTaxesPaid}` |
| Balance / refund | `it_balancePayable` | `TaxPaid.BalTaxPayable` / `Refund.RefundDue` |
| Bank (refund) | `sf-bank` rows | `Refund.BankAccountDtls.AddtnlBankDetails[].{IFSCCode,BankName,BankAccountNo,AccountType}` |
| Verifier | `vfr_name/pan/father` | `Verification.Declaration.{AssesseeVerName,FatherName,AssesseeVerPAN}`, `Capacity` |

**Computation → head-income JSON** (individual forms): `it_sal_income`→`IncomeFromSal`/`Salaries`; `it_hp_income`→`TotalIncomeChargeableUnHP`/`IncomeFromHP`; `it_bp_income`→`IncomeFromBusinessProf`/`ProfBusGain`; CG cells→`CapGain.ShortTerm/LongTerm.*`; OS sum→`IncomeOthSrc`/`IncFromOS`; `chapVIA()` → `DeductUndChapVIA.Section80*`.

---

## 4. AIS bridge (books → form → JSON TDS)

`src/lib/accounting/aisExport.ts` builds a **sectioned CSV** from the FY journal → the CS loads it via each form's **Import AIS** button → the form's importer keys on section headings + Information Code:

| Books signal | AIS section / code | Flows to |
|---|---|---|
| "TDS Receivable" debit lines | Part-B TDS/TCS · `TDS-192/194A/194C/194H/194I/194J/194Q` | form TDS schedule → JSON `TDSonSalaries`/`TDSonOthThanSals` |
| Advance-tax / self-assessment-tax debits | Part-B Payment of Taxes · `PMT-ADV`/`PMT-SAT` | `TaxPaid.TaxesPaid.AdvanceTax` |
| Interest / dividend credits without TDS | Part-B SFT · `SFT-016`/`SFT-018` | Other Sources |

Consequence: in ITR-1..4, **advance-tax and TDS reach the JSON only when AIS is imported** (manual `sf-advtax`/`sf-sat`/TDS rows are not serialized) — see §6.

---

## 5. Validation rulebook (per form, as-is)

All forms validate on export and block on errors. Common spine: **PAN regex `^[A-Z]{5}\d{4}[A-Z]$`**, name required, DOB/DOF format, refund-needs-bank(+IFSC), "open computation once".

| Form | Fn | Hard ERRORS (block export) | Notable WARNINGS |
|---|---|---|---|
| ITR-1 | `validateItr1` | PAN; Name; **TI > ₹50 L → use ITR-2**; **LTCG 112A > ₹1.25 L → use ITR-2** | DOB fmt; refund-no-bank; calc-not-opened |
| ITR-2 | `validateItr2` | PAN; Name | DOB; refund-no-bank; calc-not-opened (no ceiling — intentional) |
| ITR-3 | `validateItr3` | PAN; Name | DOB; **biz>0 → set 44AB audit flags**; refund-no-bank; calc-not-opened |
| ITR-4 | `validateItr4` | PAN; Name; **TI > ₹50 L → ITR-3**; **LTCG 112A > ₹1.25 L → ITR-2/3**; **non-presumptive income > 0 → ITR-3** | DOB; refund-no-bank; calc-not-opened |
| ITR-5 | `preflight` | firm PAN; name; DOF; email/mobile/address; verifier name+father+**PAN 4th char 'P'**; section selected | (inline) 44AD >₹2/3cr, 44ADA >₹75L |
| ITR-6 | `validate` | 26 field rules (PAN/name/status/DOI/email/verifier/section/audit+auditor/DPIIT/MSME/turnover>₹400cr) + BS assets=liabilities | 115BAA/BAB→MAT n/a; VI-A under concessional regime; SI-without-tax |
| ITR-7 | `validateITR7` | name≤125; PAN; DOF; section (139(4A)-(4D)); return type; residential; full address; verifier (**PAN individual**); ≥1 bank + IFSC + **1 ticked for refund**; partner/unlisted answered | BS doesn't tally; no 12A/12AB/10(23C) registration |

**Shell-level gate:** none — the shell (`income-tax/page.tsx`) does not validate; each HTML tool's own validator is the gate. (Contrast GSTR-1, which has the app-side `validateGstr1` + `verify_*` harnesses.)

---

## 6. ⚠ Filing-readiness matrix — the cross-cutting gap (read this for the CS-firm goal)

**A single pattern repeats in every form's `buildItrNJson()`:** the JSON carries **identity + head-wise income totals**, but the **tax decomposition and per-schedule detail are hard-zeroed or omitted.** For "actual filing with JSON that validates on the portal," this is the decisive limitation.

| What | ITR-1 | ITR-2 | ITR-3 | ITR-4 | ITR-5 | ITR-6 | ITR-7 |
|---|---|---|---|---|---|---|---|
| Identity / address / bank | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Head-wise income totals | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Surcharge / cess / rebate 87A separated in JSON** | ❌ 0 | ❌ 0 | ❌ 0 | ❌ 0 | partial | partial | ❌ 0 |
| **234A/B/C + 234F interest in JSON** | ❌ 0 | ❌ 0 | ❌ 0 | ✅ | ✅ | ✅ | ❌ 0 |
| **Per-schedule detail serialized** (CG rows, B/S, P&L, VIA, FA, AL, OS…) | ❌ | ❌ | ❌ | ❌ | subset | ❌ (totals) | ❌ |
| **Taxes paid** (advance/SAT/TDS) | AIS-only | AIS-only | AIS-only | AIS-only | ✅ | popup-only | ❌ 0 |
| `ReturnFileSec` respects `f_section` | ❌ (=11) | ❌ | ❌ | ❌ | partial | ✅ | ✅ |
| Real software creds / Digest | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Filing-complete JSON today | ⚠ simple cases | ⚠ | ⚠ | ⚠ simple cases | ⚠ simple firm | ❌ pending | ❌ (zero tax) |

**Plain-language takeaway:**
- All 7 forms are strong **data-entry + on-screen computation** tools (correct A.Y. 2026-27 slabs, regimes, surcharge/cess, 87A, special rates, AMT, presumptive, s.40(b)).
- But the **exported JSON is a rolled-up projection**: it reliably carries who-the-assessee-is and the income totals, and (for ITR-4/5/6) interest; it does **not** yet carry the full tax breakup, the granular schedules, or (for ITR-1/2/3/7) the taxes-paid/interest unless AIS is imported. ITR-7's JSON currently exports **zero tax liability**. ITR-6's JSON is totals-only and is the least complete.
- **For portal-valid filing** the priority work is, per form: (1) write the computed surcharge/cess/rebate/relief/interest back into `PartB_TTI`/`TaxComputation`; (2) serialize the captured schedules into their ITD nodes; (3) drive `ReturnFileSec`/due-date from the UI section; (4) supply real software credentials/digest (or file via the portal offline-utility path). ITR-6 additionally needs the backup's ~60 granular schedules ported forward (`itr-6.md` §3).

---

## 7. Where to look
- Per-form field/schedule/line detail → `itr-1.md` … `itr-7.md`.
- Shell/router/persistence/AIS → `00-architecture.md`.
- Index → `README.md`.
