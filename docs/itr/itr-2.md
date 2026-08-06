# ITR-2 — Capital Gains / Multiple Properties / Foreign Assets (no business income)

> Applicable: individuals/HUF with capital gains, multiple house properties, foreign assets — **no** business/profession income. File: `public/tax-utilities/itr2.html` (A.Y. 2026-27, ~2.5 MB, 12,504 lines) + `itr2-2025-26.html`. Lines below are into `itr2.html`.

## Layout
Three tabs (`:310`): **Info** (`data-tab="info"`), **Computation** (`data-tab="comp"`, iframe `#calcFrame` `:413`, sheet `#sheet-itcomp` `:2415`), **Summary**. Reuses "the proven ITR-1 machinery; ITR-2-specific schema in buildItr2Json/validateItr2" (`:1733`). Business/Profession head exists in markup but `display:none` (`:2434`) — ITR-2 disallows business income.

## 1. Info Sheet (`pane-info`, `:320-408`)
**Basic (`:335`):** `sf-assessee`, `sf-verifier`, `sf-bank`, `sf-residential`. **Filing (`:340`):** `f_section` (139(1)/(4)/(5)/(9)/142(1)), `f_rettype`, `sf-repassessee`. **Income (`:355`):** `sf-pti` (PTI), `sf-spi` (income of other persons). **Other (`:359`):** `partner`, `unlisted`→`sf-unlisted`, `director`→`sf-directorship`, `sf-esop`, `sf-otherforms`.
- **Foreign Assets (Sch FA `:369`):** `f_hasFA` → 9 `sf-fa_*` (held during calendar 2025).
- **Assets/Liabilities (Sch AL `:388`):** `f_hasAL` (if TI > ₹1 cr) → `al_immovable/cash` + drill `sf-al_bank/shares/insurance/loans/jewellery/paintings/vehicles/liab` → `al_total`.
Assessee master `sf-assessee` (`:462`): same `asr_*` set as ITR-1/3 (identity/address/contact/aadhaar/44aa). Bank (`sf-bank` `:546`, +Add). Residential (`sf-residential` `:560`): `res_a`(182d)/`res_citizen`/`res_b`(60+365d).

## 2. Income heads (calculator `:2415-2562`)
- **Salaries** (`g-sal` `:2416`): +Add Employer → `it_sal_total/std/proftax/income`.
- **House Property** (`g-hp` `:2426`): +Add Property (multiple) → `it_hp_income`; SOP ₹2 L cap.
- **Capital Gains** (`g-cg` `:2494`): LTCG-1 (`sf-ltcg`), **LTCG 112A** (`sf-ltcg112a`), LTCG auto, STCG-1 (`sf-stcg`), auto-classify (`sf-auto-cg`).
- **Other Sources** (`g-os` `:2503`): interest/dividends/DTAA/family pension/gifts 56(2)(x)/special/KVP/minor/NSC/other-person/rental/89A/58-59/winnings/other + BF loss.

## 3. Drill-in Schedules (**+Add** noted)
Schedule **S** (salary, +employer), **HP** (+property), **CG**: LTCG-1, **112A** (`sf-ltcg112a` `:2944` — Qty/Date/Sale/expenses/net/cost/pre-01.02.18?/FMV 55(2)(ac)/cost deductible/LTCG/ISIN; ₹1.25 L exempt, 12.5%; +Add), STT-paid combined 111A+112A (`:3011`, +§54F), STCG-1/other (`:3055`, incl. 94(7)/(8) loss ignore), **CFL** capital losses Sec 74 (`sf-loss-cfl` `:3119`, +Add). Schedule **OS** (winnings 115BB/115BBJ 30%, special 10/20/60% `:3393`). Schedule **VIA** (80CCH/D/DD/DDB/E/C-CCC-CCD bundle/other → `it_80_total`). Schedule **EI** (`:4927`, 3 blocks: salary 10(...), investment PPF/EPF/dividend, other 10(2A)/86/agri/DTAA → `ei_grandTotal`). Schedule **FA** (+Add each), **AL** (+Add), **SPI** (+Add), **PTI** (+Add), **ESOP/Unlisted/Directorship** (+Add). **AMT** `sf-amt` (115JC/JD, old regime, 18.5%). *No discrete Schedule FSI/TR — foreign relief via `sf-rel90` (90/91) + DTAA in EI/OS.*

## 4. Computation Sheet (`:2535-2561`; engine `computeAll` `:12344`)
Heads → **`it_totalIncome`** (`:2535`) → `it_agri` → **`it_regime`** (New 115BAC/Old) → **`it_taxOnTI`** → relief 89 (arrears/commute/comp/gratuity) & 90/91 → AMT 115JC/JD → prepaid TDS/TCS/adv/SAT → interest 234A/B/C + 234F → **`it_balancePayable`** → exempt/loss C/F.
Engine: slab base separated from special-rate income; `slabNew` (0-4L nil,5-8L 5%,…>24L 30%), `slabOld` (2.5/3/5 L exemption); **rebate 87A** New ₹60k if TI≤₹12 L, Old ₹12.5k if TI≤₹5 L (not vs special-rate tax); **surcharge** 10/15/25/37% (New cap 25%) with CG/111A/VDA 15% cap + marginal relief + 115BBE +25%; **cess 4%**.

## 5. JSON mapping (`buildItr2Json` `:2069`)
Shape **`{ ITR: { ITR2: {…} } }`**. `Form_ITR2` (`:2131`): AssessmentYear `2026`, **SchemaVer `Ver1.1`**, FormVer `Ver1.0`. Maps: `cl_name/pan/dob/status`→`PartA_GEN1.PersonalInfo.*`; addr→`Address.*`; regime→`FilingStatus.OptOutNewTaxRegime`; `it_sal_total`→`PartB-TI.Salaries`; `it_hp_income`→`IncomeFromHP`; STCG→`CapGain.ShortTerm.ShortTermAppRate`; LTCG→`CapGain.LongTerm.LongTerm12_5Per`; OS→`IncFromOS.*`; gti→`GrossTotalIncome`; ded→`DeductionsUnderScheduleVIA`; ti→`TotalIncome`; tax→`PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.TaxPayableOnTotInc`; prepaid→`TaxPaid.TaxesPaid.*`; refund→`Refund.RefundDue` + bank; verifier→`Verification.Declaration.*`. Also builds `ScheduleCYLA` (`:2108`), `ScheduleBFLA` (`:2119`), conditional `TDSonSalaries`/`TDSonOthThanSals` from AIS.

## 6. Validation (`validateItr2` `:2044`)
ERRORS: PAN (`:2049`), Name (`:2050`). WARNINGS: DOB format (`:2051`), refund-no-bank (`:2056`), computation-not-opened (`:2057`). **No ₹50 L cap, no 112A cap** (intentional — `:2052`); business income disabled. Export gated on zero errors.

## 7. Add options
+Employer, +Property, bank/SPI/PTI/ESOP/unlisted/directorship, all FA & AL sub-tables, all CG tables + CFL, OS/VIA drill rows.

## 8. Gaps / TODO (as-is)
1. **No Schedule FSI / Schedule TR** in UI or JSON — foreign-tax relief collapsed into `sf-rel90`; DTAA only disclosed in EI/OS.
2. **JSON heavily simplified**: `Surcharge`, `HealthEduCess`, `TotalSurcharge`, `EducationCess`, `Rebate87A`, `TaxAtSpecialRates` all hard-`0` (`:2153`) though computed; `TaxPayableOnTotInc` = net tax only.
3. **No ScheduleCG/HP/S/OS/VIA/FA/AL/112A objects in JSON** — only aggregate `PartB-TI` + CYLA/BFLA; rich per-row schedule data not serialized (only AIS-derived TDS optionally).
4. `CreationInfo` placeholders `SW20000000`/`Digest:'-'`.
5. `ItrFilingDueDate:'2026-07-31'` + `ReturnFileSec:11` hard-coded, ignore `f_section`.
6. Prepaid split heuristic: whole prepaid booked as TDS if AIS not imported.
7. Minimal validation (only PAN/name hard errors; no CG bucket vs schedule reconciliation, no AL-threshold check).
