# COMPUTATION SHEET — SHARED ENGINE MAP

Base source: `public/tax-utilities/itr3.html` (the `<script type="text/plain" id="calc-html">` block, lines **2737–12994**, rendered into `<iframe id="calcFrame">`; the outer ITR-Info emitter reads it via `calcVal(id)` / `calcWin()` at itr3.html:2232–2234, injection at 2237–2248, summary pull `refreshSummary()` at 2262).

All itr3.html line numbers below are absolute file lines (the calc-html block is one file-embedded document).

## Engine functions (file:line, itr3.html unless noted)

| Function | Line | Role |
|---|---|---|
| `computeAll()` (calc engine) | 12836 | Master recompute — heads → GTI → set-off → VIA → TI → tax → surcharge → cess → relief → AMT → 234 → balance |
| `computeAll()` (outer Info sheet) | 1952 | ITR-Info B/S–P&L totals only (NOT the tax engine) |
| `slabNew(ti)` | 5978 | New-regime slabs AY 2026-27 |
| `slabOld(ti,age)` | 5979 | Old-regime slabs (age-based basic exemption) |
| `baseTaxOnly(ti,isNew,age)` | 12820 | `return isNew?slabNew(ti):slabOld(ti,age);` |
| `baseTaxWithAgri(slabBase,agriIncome,isNew,age)` | 10874 | Agricultural partial integration (old regime only) |
| `rebate87A(isNew,ti,tax)` | 12816 | Rebate incl. new-regime marginal relief |
| `surchargeRate(ti,isNew)` | 9227 | 10/15/25/37(25 new) % slabs |
| `surchargeWithCgCap(ti,slabTax,specialTax,isNew)` | 9234 | Surcharge with 15% cap on CG-special tax + marginal relief |
| `surcharge(ti,tax,isNew)` (legacy fallback) | 12821 | Plain surcharge + marginal relief |
| `computeSalary(isNew)` | 6457 | Salary head incl. 16(ia)/16(iii) |
| `computeHp(isNew)` | 6626 | House property incl. SOP ₹2L cap |
| `computeBP()` | 7025 | Business/Profession (normal/speculation/specified split) |
| `computeCGTaxFull()` | 9253 | Unified CG buckets, 112A ₹1.25L exemption, special-rate tax, Sec 74 B/F set-off |
| `computeOS(isNew)` | 9838 | Other sources (slab + special split, 115BB/BBJ 30%) |
| `computeOsPart2()` | (via 9888) | Special-rate OS incl. 115BBE 60% + 25% BBE surcharge (`const bbeSurcharge = r0(bbeTax * 25 / 100);` line 10005) |
| `computeAgri()` | 10644 | Net agri income for aggregation |
| `compute80CBundle(isNew)` | 11001 | 80C/CCC/CCD with 80CCE ₹1.5L cap, CCD(1B) ₹50K, CCD(2) uncapped |
| `compute80CCH/80D/80DD/80DDB/80E/80Other` | 12106/11457/11506/11520/11550/11693 | Individual VIA sections |
| `computeRel89All(isNew,age)` | 11242 | 4 variants of Sec 89 relief (arrears = tax-difference; commute/comp/gratuity = average-rate method, lines 11196–11241) |
| `computeRel90()` | 11302 | FTC u/s 90/90A/91: `Math.max(0, totalClaimed - refunded)` |
| `computeAMT(isNew,ti,normalTax)` | 12365 | AMT 115JC 18.5% + credit 115JD (old regime only, ATI > ₹20L) |
| `compute234InterestAndFee(taxAfterRelief,ti,tdsTcs,advTax,satInterest)` | 12170 | 234A/B/C + 234F with manual overrides |
| `computeFilingStatus()` / `getFilingDueDate(audit44AB,tp)` | 11998 / 11990 | Due dates 31-Jul-2026 / 31-Oct-2026 (audit) / 30-Nov-2026 (TP) |
| `computeTdsTcs()` / `computeAdvTax()` / `computeSat()` | 10761 / 10581 / 10609 | Prepaid taxes (SAT split into tax + interest portions) |
| `computeScheduleEI()` / `computeLossCFL()` | 12536 / 12701 | Exempt-income and loss-carry-forward dashboards |
| helpers `num` / `r0` | 5972 / 5973 | `const r0=n=>Math.round(n||0);` |

ITR-1 only: engine additionally exposes `window.__taxBreakup = { rebate87A:_reb87A, taxBeforeSurcharge:taxBeforeSC, surcharge:sc, cess:cess, taxOnTI:taxOnTI, relief89, relief90, reliefTotal, taxAfterRelief, amt, amtCreditUsed, taxForLiability, intFeeTotal, tdsTcs, advTax, sat, satInterest, prepaid, balance }` (itr1.html, in-calc, read by the emitter at itr1.html:1926 via `calcWin().__taxBreakup`).

Live check (Playwright vs http://localhost:7777/tax-utilities/itr3.html): setting `it_b1_npbt = 25,00,000` → `it_totalIncome` 25,00,000; `it_taxOnTI` 3,43,200 (= slabNew ₹3,30,000 + 4% cess ₹13,200 ✓); `it_int_234b` 34,320 (1%×10 months); `it_int_234c` 17,331; `it_balancePayable` 3,94,851. Sheet at runtime: 113 `.itr` rows (106 static + 7 dynamic from 1 employer block + 1 property block).

---

## Line items (display order)

Legend: **⚙** = computed read-only cell (`.cv` span); **✎** = directly editable input on the sheet; **⋯** = value fed by a drill-in sub-form (drill forms themselves are out of scope here). Labels are VERBATIM on-screen text. Static rows in itr3 calc sheet (`#sheet-itcomp`, lines 2907–3054): **106**.

### 1. Income from Salaries (group `g-sal`, lines 2908–2916)

Dynamic per-employer rows (`emp-blocks`, rendered by `renderEmployers()`): Salary breakup / Monthly salary / Form-16 / 89A rows per employer, each ⚙ from its drill (`computeBreakup/computeMonthly/computeForm16/compute89a`, summed at 6459–6465).

| # | Line (verbatim) | Cell id | Formula as implemented | Edit | Regime | AY diff |
|---|---|---|---|---|---|---|
| 1 | Total salary | `it_sal_total` | `const totalSal=tPen+tBreak+tMon+tF16+tA89;` (6466) | ⚙ | exempt-allowance coloring changes via `refreshExemptColors(isNew)` | — |
| 2 | Standard deduction u/s 16(ia) | `it_sal_std` | `const stdCap=isNew?75000:50000; const std=totalSal>0?Math.min(stdCap,totalSal):0;` (6468–6469) | ⚙ | New ₹75,000 / Old ₹50,000 | same in 2025-26 file |
| 3 | Tax on employment u/s 16(iii) | `it_sal_proftax` | `tPT+=num(emp.proftax)` (⋯ sf-proftax) | ⋯ | — | — |
| 4 | Income chargeable under the head 'Salaries' | `it_sal_income` | `const income=Math.max(totalSal-std-tPT,0);` (6472) | ⚙ | — | — |

### 2. Income from House Property (`g-hp`, 2918–2924)

Dynamic per-property rows (let-out: Gross annual value / Less: Municipal taxes ✎ / Net annual value / Less: Standard deduction u/s 24(a) `sd=navShare>0?navShare*0.30:0` analog / Interest on borrowings u/s 24(b) / Add: Arrears / Add: Pass-through income ✎; SOP: Interest on borrowed capital only; + "Income / Loss from Property-N"), computed in `computeHpProperty` (6597).

| # | Line | Cell id | Formula | Edit | Regime | AY diff |
|---|---|---|---|---|---|---|
| 5 | Income chargeable under the head 'House Property' | `it_hp_income` | `computeHp`: sum of properties; SOP interest capped: `const cap=200000; if(totalSopInt>cap){excess=totalSopInt-cap; total+=excess;}` (6633–6638). In `computeAll`: `const hpForGTI = isNew ? Math.max(0, hpIncome) : Math.max(hpIncome, -200000);` (12859) | ⚙ | New: no HP loss inter-head set-off at all (loss → CF); Old: loss capped at −₹2,00,000 (Sec 71(3A)) | — |
| 6 | Note: SOP interest capped at ₹2,00,000 (excess `it_hp_sop_excess` not allowed) | `it_hp_sop_cap_row` | shown only when `excess>0` (6639–6643) | ⚙ (conditional) | — | — |

### 3. Profits and gains of Business or Profession (`g-bp`, 2926–2984) — 45 rows

| # | Line | Cell id | Formula | Edit |
|---|---|---|---|---|
| 7 | Business: Presumptive profits u/s 44AD (Turnover/Profit cols) | `it_bp_44ad_to` / `it_bp_44ad_pr` | ⋯ sf-44ad totals | ⋯ |
| 8 | Profession: u/s 44ADA - Presumptive profits | `it_bp_44ada_to` / `it_bp_44ada_pr` | ⋯ sf-44ada | ⋯ |
| 9 | 35AD - Specified business profits: | `it_bp_35ad` | ⋯ sf-35ad; isolated u/s 73A: `const bpSpecified = Math.max(0, bpRes.specified); const bpSpecifiedLossCF = Math.max(0, -bpRes.specified);` (12869–12870) | ⋯ |
| 10 | Commission / Agency Business without books: | `it_bp_comm` | ⋯ sf-comm | ⋯ |
| 11 | Futures & Options - without books of a/c: | `it_bp_fno` | ⋯ sf-fno | ⋯ |
| 12 | Income from partnership firm: | `it_bp_firm` | ⋯ sf-firm | ⋯ |
| 13 | Non-specified Profession without books of a/c: | `it_bp_nonspec` | ⋯ sf-nonspec | ⋯ |
| 14 | Transport business - U/s 44AE | `it_bp_44ae` | ⋯ sf-44ae | ⋯ |
| 15 | Speculation business profits: | `it_bp_spec` | ⋯ sf-spec; isolated u/s 73: `const bpSpec = Math.max(0, bpRes.speculation);` (12865) | ⋯ |
| 16 | Net Profit Before Tax as per P & L a/c (Business-1) | `it_b1_npbt` | master input | ✎ |
| 17–27 | Add: Inadmissible… — Depreciation debited to P & L a/c: ✎ `it_b1_dep`; 36 disallowance `it_b1_36`; 37 disallowance `it_b1_37`; 40 disallowance `it_b1_40`; 40A disallowance `it_b1_40a`; 43B disallowance `it_b1_43b`; Deemed Incomes `it_b1_deemed`; Effect of deviation from ICDS and Valuation method u/s 145A `it_b1_icds`; Expenses / Losses considered under other heads `it_b1_othheads`; Income not credited to P & L A/c `it_b1_notcredited`; Other additions `it_b1_otheradd` | | each ⋯ (dep is ✎) | ⋯/✎ |
| 28–32 | Less: Deductible… — 35 to 35E, 33AB, 33ABA deductions `it_b1_35to35e`; Exempt income included in net profit `it_b1_exempt`; Income tax refund: ✎ `it_b1_itrefund`; Incomes considered separately `it_b1_sep`; Other deductions `it_b1_othded` | | ⋯/✎ | |
| 33 | Adjusted Profit of Business-1 | `it_b1_adjusted` | npbt + additions − deductions (computeBP) | ⚙ |
| 34–49 | Profession-1 mirror: Net Income Before Tax as per P & L a/c ✎ `it_p1_nibt`; Depreciation debited ✎ `it_p1_dep`; 36/37/40/40A/43B disallowance; Deemed income u/s 41; ICDS/145A; other heads; not credited; Other additions; 35 to 35E…; Income tax refund ✎; Other deductions; Adjusted Income of Profession-1 `it_p1_adjusted` | | | ⋯/✎/⚙ |
| 50 | Less: Depreciation as per IT Act | `it_p1_depit` | ⋯ sf-depit (IT-Act depreciation schedule) | ⋯ |
| 51 | Income chargeable under 'Business or Profession' | `it_bp_income` | `computeBP().total`; in GTI normal-business loss offsets any head EXCEPT salary: `const nonSalaryPositive = Math.max(0, hpForGTI) + bpSpec + bpSpecified + cgForGTI + os; const setOff = Math.min(businessLossMag, nonSalaryPositive); bpNormalForGTI = -setOff;` (12879–12882) | ⚙ |

### 4. Capital Gains (`g-cg`, 2986–2993)

| # | Line | Cell id | Formula (computeCGTaxFull, 9253–9351) | Edit |
|---|---|---|---|---|
| 52 | LTCG-1: | `it_cg_ltcg1` | `setTxt('it_cg_ltcg1', p3a_ltcgTotal)` — per-entry `cgComputeEntry` (8473) | ⋯ |
| 53 | Long Term Capital Gain u/s 112A | `it_cg_112a` | `compute112A()` (8901); aggregated: `const aggregate112A = p3a_ltcg112a + Math.max(0, r112a.netLTCG) + Math.max(0, auto.sharesLtcgNet); const exempt112A = Math.min(125000, Math.max(0, aggregate112A)); const tax112A_post = r0(bucketsAfter.ltcg112aTaxable * 12.5/100);` | ⋯ |
| 54 | Long-term Capital gain from Auto-classification table | `it_cg_ltauto` | `computeAutoCG()` (9111) | ⚙ |
| 55 | STCG-1: | `it_cg_stcg1` | `p3a_stcgTotal`; 111A bucket `const taxStcg111A = r0(bucketsAfter.stcg111A * 20/100);` VDA `* 30/100`; LTCG-flat `* 12.5/100`; ltcg10 `* 10/100` | ⋯ |
| 56 | Auto-classification of STCG / LTCG | `it_cg_auto` | ⋯ sf-auto-cg | ⋯ |

Sec 74 B/F capital-loss set-off applied via `applyCgBfl(bucketsAfter)` (STCL vs any CG, LTCL vs LTCG only; VDA excluded per 115BBH, 9353–9357); result reduces TI: `const tiRaw=Math.max(0,gti-ded-bflSetOff);`.

### 5. Income from other sources (`g-os`, 2995–3013) — 16 rows

| # | Line | Cell id | Formula (computeOS, 9838) | Edit |
|---|---|---|---|---|
| 57 | Interest income | `it_os_interest` | `const intTaxable = Math.max(0, intGross - intExpSB - intExpOther);` | ⋯ |
| 58 | Dividends | `it_os_dividend` | `divNormal + divBuyback + div22e + divMfOth` (all slab) | ⋯ |
| 59 | DTAA income (only for Non-residents) | `it_os_dtaa` | ⋯ (in Part2; lower of IT-Act vs DTAA rate) | ⋯ |
| 60 | Family pension | `it_os_familypension` | `const fpStdDed = fpAmt > 0 ? Math.min(Math.round(fpAmt/3), isNew ? 25000 : 15000) : 0;` (9867) — regime-dependent | ⋯ |
| 61 | Gifts taxable u/s 56(2)(x) | `it_os_gifts` | ⋯ Money + Immovable + 9 movable categories | ⋯ |
| 62 | Income taxable at special rates | `it_os_special` | `OS_SPECIAL_SECTIONS` (9933): 111 (user-entered tax), 115ACA(1)(a) 10%, 115BBF 10%, 115BBG 10%, 115E(a) 20%, s68/69/69A/69B/69C/69D 60% (115BBE) | ⋯ |
| 63 | KVP Interest | `it_os_kvp` | ⋯ | ⋯ |
| 64 | Minor child's income: | `it_os_minor` | ⋯ (₹1,500 exemption u/s 10(32)) | ⋯ |
| 65 | NSC Interest | `it_os_nsc` | ⋯ (VIII/IX; reinvested-for-80C hint) | ⋯ |
| 66 | Other person's income | `it_os_otherperson` | ⋯ (Sec 64, no exemption) | ⋯ |
| 67 | Rental income: from land, building, plant & machinery, etc. | `it_os_rental1` | ⋯ | ⋯ |
| 68 | Section 89A - Income from retirement benefit a/c | `it_os_89a` | ⋯ | ⋯ |
| 69 | Taxable income u/s 58, 59 & 56(2)(ix), (xii), (xiii) | `it_os_58_59` | ⋯ | ⋯ |
| 70 | Winnings: Lotteries, Games, Betting | `it_os_winnings` | `const winTotal = win115BB + win115BBJ; const winTax = r0(winTotal * 30 / 100);` — 30% flat, NO rebate, NO 15% surcharge cap | ⋯ |
| 71 | Other: | `it_os_other` | direct input | ✎ |
| 72 | Brought forward losses set off | `it_os_bfloss` | `setTxt('it_os_bfloss', bflResult.totalApplied)` (9310) | ⋯ |

### 6. Deductions under Chapter VI-A (`g-80`, 3015–3025) — 8 rows

| # | Line | Cell id | Formula | Regime |
|---|---|---|---|---|
| 73 | 80CCH: Contribution to Agniveer Corpus Fund | `it_80_cch` | `compute80CCH()` (12106) | available both regimes |
| 74 | 80D: Health Insurance Premium | `it_80_d` | `compute80D()` | old only (zeroed in new via section computes) |
| 75 | 80DD: Medical treatment of Handicapped | `it_80_dd` | `compute80DD()` | old only |
| 76 | 80DDB: Medical treatment of specified diseases | `it_80_ddb` | `compute80DDB()` | old only |
| 77 | 80E: Interest on education loan repaid | `it_80_e` | `compute80E()` | old only |
| 78 | Investment u/s 80C, CCC, CCD | `it_80_ccccd` | `compute80CBundle(isNew)`: `const s80cceFinal = Math.min(s80cceRaw, 150000);` 80CCD(1B) `Math.min(...,50000)`, 80CCD(2) no cap; New regime: `total = s80ccd2;` only (11052–11055) | New: only 80CCD(2) |
| 79 | Other Chapter VI-A deductions (80G/80GG/80TTA/80TTB/80U…) | `it_80_other` | `compute80Other(isNew, age, gti)` — `if(isNew){ ... setTxt('it_80_other', 0); return 0; }` (11695–11699); 80U 75000/125000; 80G 10%-of-AGTI qualifying limit | New: 0 |
| 80 | Total Chapter VI-A deductions | `it_80_total` | sum of cells `['it_80_cch','it_80_d','it_80_dd','it_80_ddb','it_80_e','it_80_ccccd','it_80_other']` (12905–12908) | ⚙ |

### 7. Total income → tax → balance (3027–3053) — 26 rows

| # | Line | Cell id | Formula as implemented | Edit | Regime | AY diff |
|---|---|---|---|---|---|---|
| 81 | Total Income | `it_totalIncome` | `const tiRaw=Math.max(0,gti-ded-bflSetOff); const ti=Math.round(tiRaw/10)*10;` (12912–12913) — 288A rounding to nearest ₹10. GTI: `const gti = salaryIncome + hpForGTI + bpNormalForGTI + bpSpec + bpSpecified + cgForGTI + os;` (12894). No 288B rounding of tax appears in computeAll. | ⚙ | — | — |
| 82 | Agricultural Income: | `it_agri` | `computeAgri()`: `const net = Math.max(0, gross - exp - bfTotal);` | ⋯ | old-regime aggregation only | — |
| 83 | Tax rate - computed u/s 115BAC by default | `it_regime` | `<select>` New (115BAC) / Old regime; `isNewRegime()` (6036) | ✎ | THE toggle | — |
| 84 | Tax on total income | `it_taxOnTI` | `const slabBase = Math.max(0, ti - totalSpecialIncome);` → `slabTax = baseTaxWithAgri(slabBase, agriNet, isNew, currentAge)` → `slabTax = Math.max(0, slabTax - rebate87A(isNew, ti, slabTax));` → `const taxBeforeSC = slabTax + cgRes.specialTax + osRes.osSpecialTax;` → `sc = surchargeWithCgCap(ti, slabTax + osRes.osSpecialTax, cgRes.specialTax, isNew); sc += (osRes.bbeSurcharge || 0);` → `const cess = r0((taxBeforeSC + sc) * 0.04); const taxOnTI = taxBeforeSC + sc + cess;` then overwritten with `taxAfterRelief` (12921–12944) | ⚙ | slabs, 87A, surcharge top-rate all regime-dependent | slabNew + 87A differ (see AY section) |
| 85 | Relief u/s 89 - Arrears of Salary / Family pension | `it_rel89_arrears` | tax-difference method: per-AY receipt-basis tax minus accrual-basis tax, `const relief = Math.max(0, receiptSum - accSum);` manual `override > 0 ? override : relief` (11185–11193) | ⋯ | uses current slabs as proxy | — |
| 86 | Relief u/s 89 - Commutation of Pension | `it_rel89_commute` | average-rate method: `const relief = Math.max(0, taxCurr - taxAvg);` where `taxCurr=Math.round(currRate*lumpSum)`, avg of past-3-AY rates ×1.04 cess (11200–11222) | ⋯ | — | — |
| 87 | Relief u/s 89 - Compensation on Termination | `it_rel89_comp` | same average-rate method | ⋯ | — | — |
| 88 | Relief u/s 89 - Gratuity | `it_rel89_gratuity` | same average-rate method | ⋯ | — | — |
| 89 | Relief u/s 90 to 91 | `it_rel90` | `computeRel90()`: `const net = Math.max(0, totalClaimed - refunded);` | ⋯ | — | — |
| 90 | AMT u/s 115JC (old regime only) | `it_amt_115jc` | `computeAMT`: new regime → 0; else `const ati = Math.max(0, ti + addbackC + addback_10aa + addback_35ad + addback_other); if(ati > 2000000){ amtBase = r0(ati * 0.185); sc_rate` per ATI slabs (10/15/25/37) `; cess = r0((amtBase + sc) * 0.04); amt = amtBase + sc + cess; }` (12399–12422) | ⋯ | old only | — |
| 91 | Less: AMT Credit u/s 115JD set off | `it_amt_credit` | `credit_used = Math.min(credit_bf, normalTax - amt);` (12436) | ⋯ | old only | — |
| 92 | Tax payable (after AMT comparison) | `it_taxPayable_amt` | `if(amt > normalTax){ taxForLiability = amt; credit_generated = amt - normalTax; }` else credit set-off (12431–12439) | ⚙ | — | — |
| 93 | TDS / TCS: | `it_tdstcs` | `computeTdsTcs()` (Form 16 / 16A / 16B-E / TCS + B/F tables) | ⋯ | — | — |
| 94 | Advance Tax | `it_advtax` | `computeAdvTax()` (challan rows; quarter-dated for 234C) | ⋯ | — | — |
| 95 | Self-assessment tax paid | `it_sat` | `computeSat()` → `{taxTotal, intTotal}` (interest portion offsets 234 totals) | ⋯ | — | — |
| 96 | Filing Details (Section, dates, audit) | `it_filing_status` | `computeFilingStatus()`; due date `getFilingDueDate`: TP → 30-Nov-2026, 44AB audit → 31-Oct-2026, else 31-Jul-2026 (11990–11995); `monthsLate = Math.ceil(daysLate / 30)` | ⋯ | — | 2025-26 file: due-date text 2025-09-15 |
| 97 | Interest u/s 234A — Late filing | `it_int_234a` | `const unpaidTax234A = Math.max(0, taxAfterRelief - tdsTcs - advTax); const int234A_auto = r0(unpaidTax234A * 0.01 * monthsForA);` manual override wins (12178–12233) | ⋯ (override) | — | — |
| 98 | Interest u/s 234B — Advance Tax shortfall | `it_int_234b` | `if(advTax < threshold90){ shortfall234B = assessedTax - advTax; ... monthsForB = Math.max(1, monthsBetween(startOfAY, endDate)); int234B_auto = r0(shortfall234B * 0.01 * monthsForB); }` with `startOfAY = new Date(2026, 3, 1)`, default end 31-Dec-2026 (12185–12196) | ⋯ | — | 2025-26 file uses the same `new Date(2026, 3, 1)` |
| 99 | Interest u/s 234C — Quarterly Adv Tax deferment | `it_int_234c` | cumulative 15/45/75/100% of assessed tax at 15-Jun/15-Sep/15-Dec-2025, 15-Mar-2026; `intQ1..Q3 = r0(qShort * 0.03)` (1%×3m), `intQ4 = r0(q4Short * 0.01)` (12198–12221) | ⋯ | — | same quarter dates in both AY files |
| 100 | Late filing fee u/s 234F | `it_fee_234f` | `if(fc.isLate){ if(ti > 500000) fee234F_auto = 5000; else if(ti > 250000) fee234F_auto = 1000; }` (12224–12229) | ⋯ (override) | — | — |
| 101 | Total Interest + Fee (234A+B+C+F) | `it_int_total` | `const total = int234A + int234B + int234C + fee234F;` net of SAT interest: `Math.max(0, total - (satInterest || 0))` | ⚙ | — | — |
| 102 | Balance tax payable | `it_balancePayable` | `const prepaid = tdsTcsTotal + advTaxTotal + satRes.taxTotal + satInterest; const totalLiability = taxForLiability + intFeeTotal; const balance = totalLiability - prepaid;` (12960–12963); rail flips label to "Refund Due" when negative | ⚙ | — | — |
| 103 | Incomes fully exempt | `it_exempt` | `computeScheduleEI()` | ⋯ | — | — |
| 104 | Loss Carry-Forward (Schedule CFL) | `it_loss_cfl_total` | `computeLossCFL()` consuming `bpData.lossCFL.cy = {hpLoss, businessLoss, speculationLoss, specifiedLoss}` (12887–12892) | ⋯ | — | — |
| 105 | Footnotes / Pending issues — Prepared by | `it_preparedby` | free text | ✎ | — | — |
| 106 | List of documents — Approved by | `it_approvedby` | free text | ✎ | — | — |

---

## Per-ITR applicability matrix

ITR-1/2/4 embed a **byte-near-identical copy** of the ITR-3 calc-html (10,256 lines each; itr1 = 10,268 with the `__taxBreakup` addition). Their ONLY differences vs ITR-3 are `style="display:none"` on rows and the ITR-1 breakup export — the engine JS is otherwise identical. ITR-7 carries the same sheet + engine **inline** (no iframe). ITR-5 and ITR-6 have their own engines.

✓ = present/visible · (hidden) = row exists in calc-html but `display:none` · – = absent · v: = variant

| Computation line | ITR-1 | ITR-2 | ITR-3 | ITR-4 | ITR-5 | ITR-6 | ITR-7 |
|---|---|---|---|---|---|---|---|
| Salary head (4 rows) | ✓ | ✓ | ✓ | ✓ | – | – | – |
| House Property head | ✓ | ✓ | ✓ | ✓ | v: `it_c_hp_*` (GAV→NAV→24(a) 30%→24(b)→arrears) | v: `it_hp_*` (no SOP option, no ₹2L cap — see note) | ✓ |
| Business/Profession group | (hidden)¹ | (hidden)¹ | ✓ | v: presumptive only² | v: `it_c_*` P&L-adjust + `it_c_40b` partner remuneration/interest, Book profit, Balance profit | v: spec-driven Schedule BP incl. 44AE/44B/44BB… (no 44AD/44ADA — company) | ✓ |
| CG rows LTCG-1/ltauto/STCG-1/auto | (hidden)³ | ✓ | ✓ | (hidden)³ | v: 111A 20% / STCG-normal / 112A 12.5% over ₹1.25L / 112 12.5% | v: split pre/post 23-07-2024: 111A 15%→20%, 112A 10%→12.5%, 112 20% indexed→12.5% | ✓ |
| LTCG u/s 112A row | ✓ | ✓ | ✓ | ✓ | ✓ (`it_c_ltcg112a`) | ✓ (both-era rows) | ✓ |
| Other Sources 16 rows | ✓ | ✓ | ✓ | ✓ | v: 8 rows (int/div/rent/115BB/115BBE/115BBH VDA/other) | v: 10 rows (div/int/rent/56(2)(x)/other/special/57/58/59/total); family-pension & clubbing "individual-only, not offered" | ✓ + "Taxable Income u/s 11 to 13" (`it_1113`) |
| Chapter VI-A rows (8) | ✓ | ✓ | ✓ | ✓ | v: single `it_c_80` drill (80G→80PA list) | v: `it_ti_via` + `it_ti_10aa` | ✓ |
| Total Income (288A ₹10 rounding) | ✓ | ✓ | ✓ | ✓ | v: separate row "Total Income (rounded off u/s 288A)" `it_c_ti_r` | ✓ (`it_ti_total`) | ✓ |
| Agricultural Income row | ✓ | ✓ | ✓ | ✓ | ✓ (`it_c_agri`) | – | ✓ |
| Regime selector (New/Old) | ✓ | ✓ | ✓ | ✓ | – (firm: flat 30%) | v: Normal/115BA 25%/115BAA 22%/115BAB 15% + 25%-vs-30% by ₹400cr turnover | (hidden, locked Old) |
| Tax on total income | ✓ | ✓ | ✓ | ✓ | v: `it_c_tax_normal` (`FIRM_RATE=0.30`) + `it_c_tax_special` + `it_c_tax_ti` | v: `it_tti_normal/special/ontotinc` | ✓ (drill sf-taxti) |
| 87A rebate (inside taxOnTI) | ✓ | ✓ | ✓ | ✓ | – ("no basic exemption, no rebate u/s 87A") | – | present in engine (Old ≤₹5L path) |
| Surcharge + marginal relief + CG 15% cap | ✓ | ✓ | ✓ | ✓ | v: 12% > ₹1cr (`SUR_THR=10000000, SUR_RATE=0.12`), `firmSurcharge` marginal relief, + 25% BBE surcharge; explicit rows `it_c_sur`/`it_c_mrelief` | v: dom. 7%>₹1cr/12%>₹10cr, foreign 2%/5%, conc. flat 10%; rows `it_tti_surcharge`/`it_tti_marginal` | ✓ (AOP slabs) |
| 115BBE 60% + 25% surcharge | ✓ | ✓ | ✓ | ✓ | ✓ (own row `it_c_os_bbe`) | ✓ (in `os_spl`) | ✓ |
| Health & Education Cess 4% | ✓ | ✓ | ✓ | ✓ | ✓ (`it_c_cess` row) | ✓ (`it_tti_cess` row) | ✓ |
| Relief 89 rows (4) | ✓ | ✓ | ✓ | ✓ | – | – | – |
| Relief u/s 90 to 91 | ✓ | ✓ | ✓ | ✓ | ✓ (`it_c_rel90`) | v: split `it_tti_rel90` (90/90A) + `it_tti_rel91` (91) | ✓ |
| AMT u/s 115JC + 115JD credit | ✓⁴ | ✓⁴ | ✓ | ✓⁴ | ✓ rows `it_c_amt_ati/tax/credit`; applies if `amtAti>2000000 && (amt80>0 || s35ad>0 || s10aa>0)`; 80P excluded | v: MAT 115JB @15% of book profit (`it_mat_bookprofit/tax/payable`), credit u/s 115JAA (`it_mat_credit/cf`); nil under 115BAA/BAB | ✓ |
| Tax payable (after AMT comparison) | ✓ | ✓ | ✓ | ✓ | ✓ `it_c_tax_after_amt` | ✓ `it_mat_payable` | ✓ |
| TDS/TCS · Advance Tax · SAT rows | ✓ | ✓ | ✓ | ✓ | ✓ (`it_c_tds/adv/sat`) | ✓ (`it_tp_adv/tds/tcs/sat/total`) | ✓ |
| Filing Details row | ✓ | ✓ | ✓ | ✓ | (inside sf-c-234) | v: drill "Filing dates" | ✓ |
| 234A / 234B / 234C / 234F rows | ✓ | ✓ | ✓ | ✓ | v: single row `it_c_int_total`; 234C manual override only; `fee234f=months>0?(tiR<=500000?1000:5000):0` | ✓ four rows; bases floored to ₹100: `Math.floor(unpaid/100)*100 * 0.01 * monthsPart(dd,fd)`; 234B gated `assessed>10000` | ✓ |
| Balance tax payable | ✓ | ✓ | ✓ | ✓ | ✓ `it_c_balance` | v: separate `it_tti_balance` and `it_tti_refund` rows | ✓ |
| Incomes fully exempt / Loss CFL rows | ✓ | ✓ | ✓ | ✓ | ✓ EI (`it_c_ei`) | ✓ (`it_ti_ei` / `it_ti_cfl`) | ✓ |
| Prepared by / Approved by | ✓ | ✓ | ✓ | ✓ | ✓ (`cmp_preparedby/approvedby`) | – | ✓ |
| `window.__taxBreakup` export | ✓ (only) | – | – | – | – | – | – |

Footnotes:
1. ITR-1/ITR-2: whole `g-bp` group `style="display:none"` (engine still computes 0).
2. ITR-4: rows 35AD / Commission / F&O / partnership firm / Non-specified profession / Speculation hidden; 44AD/44ADA/44AE and Business-1/Profession-1 P&L-adjust blocks visible.
3. ITR-1/ITR-4: LTCG-1, LT-auto, STCG-1, Auto-classification hidden; "Long Term Capital Gain u/s 112A" row remains visible.
4. AMT rows physically present in the shared sheet of ITR-1/2/4 (engine identical); engine gates it to old regime + ATI > ₹20L.
5. ITR-5 extra sheet rows outside the shared list: Book profit (`it_c_bookprofit`), Less: Remuneration and Interest to partners (`it_c_40b`), Balance profit (`it_c_balprofit`), VDA 115BBH row, `it_92ce` (92CE secondary-adjustment tax: `ceAddl=ceAmt*0.18, ceSur=ceAddl*0.12, ceCess=(ceAddl+ceSur)*0.04`, also present in itr3 outer sheet line 2035).
6. ITR-6 is entirely spec-driven (row objects `{t:"fig",id:"it_..."}` itr6.html:751–809); Part B-TI adds CYLA/BFLA set-off rows (`it_ti_cyla`, `it_ti_bfla`) not present in the shared sheet.
7. ITR-7: Salary group and Relief-89 rows removed; adds `it_1113` "Taxable Income u/s 11 to 13" (`setTxt('it_1113', total)` itr7.html:3577); 115BBI / 115BBC anonymous donations taxed at 30% via the taxti drill; trust charged at AOP rates, regime locked Old.

## Regime toggle behavior (`it_regime`, engine `isNewRegime()`)

- **Slabs**: New → `slabNew` `[[0,400000,0],[400000,800000,.05],[800000,1200000,.1],[1200000,1600000,.15],[1600000,2000000,.2],[2000000,2400000,.25],[2400000,∞,.3]]`; Old → `slabOld` basic exemption `b=250000; if(age>=80)b=500000; else if(age>=60)b=300000;` then 5%/20%/30% at 5L/10L.
- **87A**: New — `if(ti<=1200000)return Math.min(tax,60000); return Math.max(0,tax-(ti-1200000));` (marginal-relief taper); Old — `if(ti<=500000) return Math.min(tax,12500);`. Applied to slab tax only, never special-rate tax (12927–12928).
- **Surcharge top rate**: `if(ti > 50000000) return isNew ? 25 : 37;` (9228); 15% cap on CG-special tax both regimes.
- **Std deduction 16(ia)**: 75,000 (New) / 50,000 (Old). **Family-pension deduction**: 25,000 (New) / 15,000 (Old).
- **HP loss**: New — no inter-head set-off (`hpForGTI = Math.max(0, hpIncome)`), loss to CFL; Old — capped −₹2L.
- **Chapter VI-A**: New keeps only 80CCD(2) (+80CCH row); `compute80Other` returns 0 outright in New.
- **Agri aggregation**: `if(isNew) return baseTaxOnly(...)` — partial integration only in Old when agri > ₹5,000 and slabBase > basic exemption: `Math.max(0, t1 - t2)` with `t1 = baseTaxOnly(slabBase + agriIncome…)`, `t2 = baseTaxOnly(basicEx + agriIncome…)`.
- **AMT 115JC**: skipped entirely in New (`thresholdStatus: 'New regime — AMT not applicable'`).
- **Exempt-allowance shading**: `refreshExemptColors(isNew)` recolors salary-allowance cells `exempt-ok`/`exempt-na`.
- ITR-5 (firm): no toggle — flat 30%. ITR-6: company options Normal/115BA/115BAA/115BAB. ITR-7: selector hidden, hard-set `Old`.

## AY 2025-26 vs 2026-27 differences (consolidated)

Source: diff of `itr3-2025-26.html` vs `itr3.html` (same deltas verified in itr1/2/4 pairs).

| Item | AY 2025-26 file | AY 2026-27 file |
|---|---|---|
| `slabNew` | `[[0,300000,0],[300000,700000,.05],[700000,1000000,.1],[1000000,1200000,.15],[1200000,1500000,.2],[1500000,∞,.3]]` | `[[0,400000,0],[400000,800000,.05],[800000,1200000,.1],[1200000,1600000,.15],[1600000,2000000,.2],[2000000,2400000,.25],[2400000,∞,.3]]` |
| 87A (new regime) | `if(ti<=700000)return Math.min(tax,25000); return Math.max(0,tax-(ti-700000));` | `if(ti<=1200000)return Math.min(tax,60000); return Math.max(0,tax-(ti-1200000));` |
| 87A (old) / `slabOld` / std deduction 75K/50K / FP 25K/15K | identical | identical |
| CG rates (112A 12.5% over ₹1.25L, 112-flat 12.5%, 111A 20%, VDA 30%, ltcg10 10%) | identical (no pre-23/07/2024 split in itr1–4 engines) | identical |
| Filing due date shown / JSON `ItrFilingDueDate` | `2025-09-15` | `2026-07-31` (getFilingDueDate: 31-Jul/31-Oct/30-Nov-2026) |
| JSON header | `AssessmentYear:'2025', SchemaVer:'Ver1.0'` + `OptOutNewTaxRegime_Method` | `AssessmentYear:'2026', SchemaVer:'Ver1.1'` (method key dropped) |
| CYLA/BFLA JSON buckets | includes `STCG15Per`,`LTCG10Per`,`LTCG20Per` keys | those keys removed (`ShortTerm15Per`/`LongTerm10Per`/`LongTerm20Per` dropped from CG JSON too) |
| 234B/C internal dates | same literals as 2026-27 file (`new Date(2026,3,1)`, quarters 2025-06-15…2026-03-15) | `startOfAY = new Date(2026, 3, 1)`; quarters 15-Jun/Sep/Dec-2025, 15-Mar-2026 |
| BFL 8-year window comments | "Current AY 2025-26" | "Current AY 2026-27" (same `BFL_AY_OPTIONS` 2018-19…2025-26) |
| Pre/post 23-07-2024 LTCG/STCG split | absent in itr1–5/7 engines | **ITR-6 only**: explicit dual rows — STCG 111A 15% (before) / 20% (on-after), LTCG 112A 10% / 12.5%, LTCG 112 20% indexed / 12.5% unindexed |

## Proof — line coverage

Static `.itr` rows in itr3 calc-html `#sheet-itcomp` (awk count between `id="sheet-itcomp"` and `class="rail"`): **106**. Documented above: sections 1–7 = 4 + 2 + 45 + 5 + 16 + 8 + 26 = **106** ✓ (runtime shows 113 = 106 static + 7 dynamic rows from the default 1 employer block + 1 self-occupied property block; dynamic per-employer/per-property row templates are described in their section headers).
