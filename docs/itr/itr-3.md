# ITR-3 — Business / Profession with regular books

> Applicable: individuals/HUF with income from business or profession (regular books — P&L, Balance Sheet). In this app offered to **sole proprietors** (with ITR-4) and **HUF**. File: `public/tax-utilities/itr3.html` (A.Y. 2026-27, ~2.6 MB, 12,996 lines) + `itr3-2025-26.html`. Lines below are into `itr3.html`.

## Layout
Five tabs (`:303`): **info**, **bs** (Balance Sheet), **pl** (Manufacturing/Trading/P&L), **comp** (Computation — iframe `#calcFrame` `:578`, sheet markup `:2893+`), **summary**. Info/BS/PL are data-entry panes; the Computation content is injected into the iframe.

## 1. Info Sheet (`info`, `:318-424`)
**Basic (`:327`):** `sf-assessee`, `sf-verifier`, `sf-bank`, `sf-residential`. **Filing (`:334`):** `f_section` (139(1)/(4)/(5)/(9)/142(1)), `f_rettype`, `sf-repassessee`. **Income (`:349`):** `sf-pti` (PTI), `sf-spi` (SPI). **Audit (`:354`):** **`audit44ab`** (liable to 44AB?) → `sf-44ab` (report date `ab_date`, ack, closing-stock valuation, duties outstanding by tax head → `ab_duties_total`); `sf-otheraudits` (11 IT-Act sections + 13 other Acts). **Business (`:362`):** `sf-nature` (NIC), `sf-gstr` (GSTR turnover), `f_bizstart`, `sf-92ce` (92CE, computes 18%+12%+4%). **Other (`:371`):** `partner`, `unlisted`→`sf-unlisted`, `director`→`sf-directorship`, `sf-esop`, `sf-otherforms` (Form 10-IEA / TRP).
- Full-width toggles (`:385`): **`f_hasFA`**→9 `sf-fa_*`; **`f_hasAL`** (TI>₹1cr)→Schedule AL (`al_immovable/bank/shares/insurance/loans/cash/jewellery/paintings/vehicles/firm` + break-ups); **`f_noBooks`**→`nb_creditors/stock/debtors/cash`.
Assessee master `sf-assessee` (`:630`): `asr_*` identity/address/contact/aadhaar + **`asr_44aa`**. Bank (+Add).

## 2. Business/Profession entry
- **Balance Sheet** (`bs` tab `:428`, `data-bs="*"`): Liabilities (`bs_capital`, reserves, secured/unsecured loans, deferred tax, advances, current liabilities, provisions → `bs_total_liab`), Assets (fixed/investments/inventories/debtors/cash/loans → `bs_total_assets`). Toggle `bs_enable`; balance shown in rail `r_bs`.
- **Manufacturing/Trading/P&L** (`pl` tab `:488`, `data-pl="*"`): Mfg A/c (`pl_mfg_*` → `pl_mfg_cop`), Trading A/c (`pl_trd_*` incl. intraday/F&O → `pl_trd_gp`), P&L A/c (`pl_pl_gp` + other income less ~30 `pl_exp_*` lines → `pl_pbit`→`pl_pbt`→`pl_pat`→`pl_balance_bs`). Toggle `pl_enable`.
- **Schedule BP adjustments** (computation `g-bp` `:2926`): **Business-1** block (`it_b1_npbt` NP → add-backs 36/37/40/40A/43B/deemed 41/ICDS/other-heads/not-credited/other, less 35-35E/exempt/IT-refund/separate/other → `it_b1_adjusted`) and **Profession-1** block (`it_p1_*` mirror → `it_p1_adjusted`, less IT-Act depreciation `it_p1_depit`) → **`it_bp_income`**.
- **Presumptive/special** (`:2929`): 44AD (`sf-44ad`), 44ADA (`sf-44ada`), 35AD, commission, F&O, firm share, non-spec, 44AE (vehicle table), speculation.
- **Depreciation** (`sf-depit` `:3381`): block-wise IT-Act (opening WDV + additions ≤/> 03-Oct-2025 half-rate rule), additional 20%, personal-use disallowance, manual override → `sfdepit_total`.

## 3. Drill-in Schedules (**+Add** noted)
BP disallowance drills (Business-1 `sf-b1-*` `:3167`, Profession-1 `sf-p1-*` `:3281`): 36/37/40/**40A** (+40A(3)/40A(3A) cash tables)/43B/**Deemed** (41, 33AB, 43CA property table +Add)/**ICDS** (+stock table)/other-heads(+)/not-credited/35-35E/exempt/separate/other. **Capital Gains** (`:3414`): `sf-ltcg`(+), `sf-stcg`(+), **`sf-ltcg112a`**(+ grandfathering, +54F), auto-classify shares/MF/VDA (+), `sf-bfl` STCL Sec 74 (+). **Other Sources** (`:3687`): interest/dividends/DTAA/family pension/gifts/special/KVP/minor/NSC/other-person/rental/89A/58-59/winnings/other. **Salary** (`:5847`): employer/breakup/monthly/Form16/89A/proftax (+employer). **House Property** (`:5911`, +property, SOP ₹2 L cap). **Chapter VI-A** (`:4438`): 80C-CCC-CCD (₹1.5 L cap +50k 1B + employer 2), 80CCH, 80D/DD/DDB/E, Other (80U/G/GGA/GGC/GG/TTA/TTB/EE/EEA/EEB/IA/IB/IE); new-regime note: only 80CCD(2)+CCH+JJAA. Plus Advance Tax/SAT/Agri/TDS-TCS/Filing/Interest-234/AMT/EI/CFL/Relief-89(Form10E)/Relief-90(Form67).

## 4. Computation Sheet (iframe `#sheet-itcomp` `:2907-3054`)
Salary → HP → **BP** (`it_bp_income`) → CG (LTCG-1/112A/auto, STCG-1/auto) → OS → Chapter VI-A → **`it_totalIncome`** → `it_agri` → **`it_regime`** (New 115BAC default/Old) → **`it_taxOnTI`** → relief 89/90-91 → AMT 115JC/JD → prepaid TDS/adv/SAT → interest 234A/B/C + 234F → **`it_balancePayable`** → exempt/CFL. Special rates: winnings 115BB/115BBJ 30%; 115BBE 60%+25% surcharge; AMT 18.5%×ATI. Summary tab mirror (`:582`) + rail (`:613`: `r_bs`, `r_pl`, `rail_ti`, `rail_bal`).

## 5. JSON mapping (`buildItr3Json` `:2566`)
Shape **`{ ITR: { ITR3: {…} } }`**; filename `{PAN}_2026-27_ITR3.json`. `Form_ITR3` (`:2622`): AssessmentYear `2026`, **SchemaVer `Ver1.1`**, FormVer `Ver1.0`. Top blocks: `PartA_GEN1/GEN2`, `PARTA_BS`, `PARTA_PL`, `ITR3ScheduleBP`, `ScheduleCYLA`, `ScheduleBFLA`, `PartB-TI`, `PartB_TTI`, `Verification`. Maps: `cl_*`→`PersonalInfo.*`; regime→`FilingStatus.OptOutNewTaxRegime`; fixed `IncFrmBusOrProf:'Y'`, `ReturnFileSec:11`; audit→`PartA_GEN2.AuditInfo.*`; biz→`PARTA_PL.NoBooksOfAccPL.*` + `ITR3ScheduleBP.BusinessIncOthThanSpec.*`; heads→`PartB-TI.*`; ded→`DeductionsUndSchVIADtl`; ti→`TotalIncome`; tax→`PartB_TTI.ComputationOfTaxLiability.TaxPayableOnTI.*`; prepaid→`TaxPaid.TaxesPaid.*`; refund→`Refund` + bank; verifier→`Verification.Declaration.*`; AIS TDS→`TDSonSalaries`/`TDSonOthThanSals`.

## 6. Validation (`validateItr3` `:2539`)
ERRORS: PAN (`:2544`), Name (`:2545`). WARNINGS: DOB format; **biz income > 0 → "review B/S & P&L; set audit flags if 44AB"** (`:2549`); refund-no-bank; computation-not-opened. **No income ceiling** (ITR-3 has none). Export gated on zero errors.

## 7. Add options
Info: bank/SPI/GSTR/CE-deposit/ESOP-sold/director/unlisted/nature/PTI/9 FA/AL break-ups. Calc: employer/property; 44AD/ADA/35AD/comm/F&O/firm/non-spec/44AE; disallowance cash/43CA/ICDS/other-heads (+ Profession mirrors); CG LTCG/STCG/112A/auto/CFL; OS rows.

## 8. Gaps / TODO (as-is) — most significant of the individual forms
1. **B/S & P&L detail not exported** — granular `data-bs`/`data-pl` feed only on-screen totals; JSON emits **zero skeletons** for `PARTA_BS`/`PARTA_PL` with only aggregate `biz` overlaid into `NoBooksOfAccPL`. A "with books" filer's accounts don't reach the ITD JSON (`:2602`).
2. **Schedule BP simplified** — `ITR3ScheduleBP` gets 3 fields = `biz`; the entire 36/37/40/40A/43B/ICDS/deemed/depreciation machinery is captured in UI but **not serialized** (`:2606`).
3. **CYLA/BFLA assume no losses** (`:2613`) — CFL set-off computed in UI (`it_loss_cfl_total`) not reflected into `ScheduleCYLA/BFLA`.
4. **No JSON serialization for FA/AL/SPI/PTI/92CE/ESOP/GSTR/Nature/Directorship/Unlisted/DPM-DOA depreciation/EI/OS/HP/CG detail** — only aggregate PartB-TI + AIS TDS.
5. **Surcharge/cess/rebate always 0 in JSON** (`:2651`) though computed; net `tax` only. AMT/relief 89/90 ignored (`CreditUS115JD:0`).
6. `ReturnFileSec:11` + `ItrFilingDueDate:'2026-07-31'` hard-coded, ignore `f_section`. Verification `Capacity:'S'` fixed; `Digest:'-'`.
7. Two `cl_*` field sets (header + hidden iframe clientbar) — ensure the builder reads the populated one.
