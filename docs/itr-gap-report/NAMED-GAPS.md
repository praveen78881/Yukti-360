# ITR JSON gap report — named particulars

Measured on 2026-08-07 by executing each tool's REAL JSON builder and comparing the output against that exact form-year's official ITD schema. Counts are recursive required nodes (leaf paths, including array-item fields).

| Form | A.Y. | Required | Emitted | Missing | Coverage |
|---|---|--:|--:|--:|--:|
| ITR-1 | 2025-26 | 405 | 405 | 0 | 100% |
| ITR-2 | 2025-26 | 1642 | 1010 | 632 | 62% |
| ITR-3 | 2025-26 | 1361 | 1013 | 348 | 74% |
| ITR-4 | 2025-26 | 391 | 352 | 39 | 90% |
| ITR-5 | 2025-26 | 2438 | 1690 | 748 | 69% |
| ITR-6 | 2025-26 | 3128 | 717 | 2411 | 23% |
| ITR-1 | 2026-27 | 392 | 320 | 72 | 82% |
| ITR-2 | 2026-27 | 1378 | 1041 | 337 | 76% |
| ITR-3 | 2026-27 | 2379 | 1659 | 720 | 70% |
| ITR-4 | 2026-27 | 374 | 350 | 24 | 94% |
| ITR-5 | 2026-27 | 515 | 396 | 119 | 77% |
| ITR-7 | 2026-27 | 1431 | 686 | 745 | 48% |

---

## ITR-1 — A.Y. 2025-26

**Schema:** ITR-1_2025_Main_V1.2.json  
**Required 405 · emitted 405 · missing 0** · verdict: gaps-remain

Structurally the ITR-1 AY2025-26 builder is now complete: I extracted 405 required dot-paths (122 of them unconditionally mandatory) from ITR-1_2025_Main_V1.2.json, executed the real buildItr1Json()/augmentItr1() from public/tax-utilities/itr1-2025-26.html under stubs, and every single one of the 405 is emitted — 0 missing, which flatly contradicts the 2026-08-05 gap map's "~27% present / zero Schedule* nodes". But presence is not producibility: validating the emitted file against the official schema with ajv gives 123 hard errors even for the simplest real case (salary + bank interest + 80C + one bank account, no donations, no loans, no ITR-U). Worse, a CA cannot even reach that point — DeductionUs16 is hardcoded to 0 and IncomeFromSal is set to gross salary, so GrossTotIncome ignores the standard deduction and the tool's own Category-A rule Sl.No 24 fires and blocks the Export JSON button for essentially every salaried return. The remaining 123 rejections come from four repeatable causes: blank "skeleton" rows stuffed into every optional schedule (80G alone contributes 28 errors, the loan schedules 29, TDS/TCS/challans 14) which violate minLength/enum/pattern; six AY2026-27 keys leaking into a schema that sets additionalProperties:false; string-vs-integer type mistakes on PinCode, MobileNo, CountryCodeMobile, SrlNoOfChaln and UseForRefund; and PartA_139_8A/PartB-ATI plus a hardcoded ItrFilingDueDate of 2025-09-15 (schema pins 2025-07-31) emitted unconditionally. Almost none of this needs new data entry — the UI already captures nearly everything, including the ITR-U fields the map lists as missing; the fixes are emitter-side gating, omission of empty schedules, type coercion, and wiring it_sal_std/it_sal_proftax/it_sal_income into the salary ladder, plus adding a real JSON-Schema pre-check to validateItr1() so the tool stops certifying files the portal will reject.

### Named missing / defective particulars

1. ITR1_IncomeDeductions.DeductionUs16 / IncomeFromSal / GrossTotIncome — hardcoded DeductionUs16:0 and IncomeFromSal=GrossSalary. The calculator DOES expose it_sal_std, it_sal_proftax, it_sal_income; the emitter ignores them. GTI is overstated by the standard deduction, so the tool's OWN Category-A rule 24 fires and the Export JSON button REFUSES to export a plain salaried return. UI captures the data; the emitter never reads it. Highest-priority blocker.

2. ITR1_IncomeDeductions.TotalIncomeChargeableUnHP + PersonalInfo.SecondaryAdd + PersonalInfo.AlternateAddress + FilingStatus.AsseseeRepFlg + UsrDeductUndChapVIA.PensionContribution80CCC + Verification.Date — six keys emitted that do NOT exist in the AY2025-26 schema (which is additionalProperties:false). Each is an unconditional portal reject. These are 2026-27 schema keys leaking into the 2025-26 builder.

3. PartA_139_8A (ITR-U) — emitted UNCONDITIONALLY whenever AY=2025 (augmentItr1 line 2147), even for an ordinary 139(1) return. Blank AcknowledgementNo fails pattern [0-9]{15}, LaidOutIn_139_8A fails Y|N, UpdatedReturnDuringPeriod and ReasonsForUpdatingIncome fail their enums, UnabsorbedDepreciation is emitted as a number where the schema wants a string. UI (itru_* fields) captures the data; the emitter must gate the whole block on section 139(8A).

4. PartB-ATI — same unconditional emission; ScheduleIT1/IT2 skeleton challan rows fail BSRCode [0-9]{3}[0-9A-Z]{4} and DateDep patterns, and SrlNoOfChaln is emitted as a string where the schema demands an integer. Not applicable to a normal return at all.

5. Schedule80G (28 violations, the single largest block) — _rowsOr() injects one blank DoneeWithPan skeleton row into all four buckets even when the CA claimed no donations. Blank DoneeWithPanName/AddrDetail/City fail minLength 1, DoneePAN fails the PAN pattern, StateCode fails the 01-37 enum, and PinCode is emitted as a string where the schema wants an integer. UI captures donor rows but has no Pin-code column and stores State as free text.

6. Schedule80E / 80EE / 80EEA / 80EEB / ScheduleUs24B (29 violations) — same skeleton-row problem via _loanRows(). Blank LoanTknFrom fails enum B|I, BankOrInstnName and LoanAccNoOfBankOrInstnRefNo fail minLength/patterns, DateofLoan fails the date pattern, VehicleRegNo fails minLength. Also 80E's grid still has no Loan-taken-from / Total-loan / Closing-balance columns (genuine missing UI).

7. TDSonSalaries / TDSonOthThanSals / ScheduleTCS / ScheduleTDS3Dtls / TaxPayments (14 violations) — blank skeleton rows fail the TAN city-prefix pattern, deductor-name minLength, TDSSection enum, DeductedYr/CollectedYr enums, BSRCode pattern. TaxPayments.SrlNoOfChaln is a string where the schema requires an integer. UI grids exist and are wired; the fault is emitting a placeholder row when the grid is empty.

8. PersonalInfo.Address — PinCode, CountryCodeMobile and MobileNo are all emitted as strings; the AY2025-26 schema types them as integer. UI captures all three. Pure type-coercion defect, fails on every single return.

9. FilingStatus.ItrFilingDueDate — hardcoded '2025-09-15' (line 2386) but the schema pins the value to the literal pattern '2025-07-31'. Always rejected. No UI involvement.

10. ScheduleEA10_13A (HRA u/s 10(13A)) — emitted with every field hardcoded 0 and Placeofwork:'' (fails enum 1|2). The HRA exemption is already computed in the calculator's monthly-salary table (mon_hra_*), and AllwncExemptUs10 / ExemptIncAgriOthUs10 are likewise frozen at a blank skeleton row whose SalNatureDesc/NatureDesc fail their section-code enums. Data exists in the UI; nothing is wired.

### Additional findings not in the old gap map

1. Standard-deduction bug blocks export entirely: DeductionUs16 hardcoded 0 and IncomeFromSal = gross salary, so GrossTotIncome ignores the 50k/75k standard deduction and professional tax. The tool's own rule Sl.No 24 then fails and showValidationPopup() refuses the export. Verified by running the real builder + validateItr1 on a 12,00,000 salary / 24,000 interest / 1,50,000 80C case: 1 Category-A error, export blocked. The gap map does not mention DeductionUs16, IncomeFromSal or it_sal_std at all.

2. The gap map is STALE for this form-year. It states 'builds zero itemized Schedule* nodes' and 'AY2025-26 ~27% req-present', and cites emitter lines 1909/1853. The current itr1-2025-26.html has augmentItr1() at line 2024 emitting every Schedule*, and buildItr1Json() at 2342 / chapVIA() at 2005. Measured coverage is 405/405 required nodes present, not 27%. Nearly all of the map's section-C wiring work has since been done.

3. The _rowsOr()/_loanRows() 'emit one blank skeleton row so the leaf path exists' strategy is itself the dominant defect and is nowhere in the map. It converts 'node absent' into 'node present but schema-invalid' — blank rows violate minLength, enum and pattern constraints in Schedule80G/80GGA/80GGC/80E/80EE/80EEA/80EEB/ScheduleUs24B/TDS*/TCS/TaxPayments. Empty optional schedules must be OMITTED, not stubbed.

4. Six additionalProperties violations from 2026-27 schema keys emitted into the 2025-26 file: TotalIncomeChargeableUnHP, SecondaryAdd, AlternateAddress, AsseseeRepFlg, PensionContribution80CCC, Verification.Date. The map lists SecondaryAdd only, and as a value-format fix ('must be enum Y|N') rather than a key that must be dropped for AY2025-26.

5. JSON type mismatches not in the map: Address.PinCode / CountryCodeMobile / MobileNo emitted as strings (schema: integer); Refund...UseForRefund emitted as a boolean (schema: string enum "true"/"false"); TaxPayments and PartB-ATI SrlNoOfChaln emitted as strings (schema: integer); PartA_139_8A.RetrntoRedCarriedFL.UnabsorbedDepreciation emitted as a number (schema: string).

6. FilingStatus.ItrFilingDueDate hardcoded to '2025-09-15' against a schema pattern that pins it to '2025-07-31'. Not in the map.

7. PartA_139_8A and PartB-ATI are emitted unconditionally for AY2025-26 rather than only under section 139(8A). The map treats these as a missing-UI item ('D'), but the UI inputs (itru_prevfiled, itru_origack, itru_origdate, itru_period, itru_laidout, itru_unabsdep, itru_addlpct) already exist — the real defect is the missing conditional gate.

8. The tool has no schema validator. validateItr1() (line 2291) runs 39 CBDT arithmetic/limit rules only — no minLength, enum, pattern, type or additionalProperties checks — so it reports 'No blocking errors' and hands the CA a file the portal will reject. Adding a schema pre-check is a prerequisite for trusting the export.

9. Positive correction to the map: chapVIA() no longer reads the non-existent it_80_c/it_80_ccc/... cells. All 19 source cells it now uses (it_80_ccccd, d80d_total, d80e_total, d80ee_ded, d80eea_ded, d80eeb_ded, d80g_total, d80gg_ded, d80gga_ded, d80ggc_ded, d80u_ded, d80tta_ded, d80ttb_ded, it_80_cch, ...) were verified to exist in calculator.html. That map item is closed.

---

## ITR-2 — A.Y. 2025-26

**Schema:** ITR-2_2025_Main_V1.2 (1).json  
**Required 1642 · emitted 1010 · missing 632** · verdict: gaps-remain

Measured against the official ITR-2 AY2025-26 V1.2 schema, the tool at D:/Downloads/CA_studio/CA_studio/public/tax-utilities/itr2-2025-26.html now produces 1,010 of 1,642 required nodes (~62%); 632 remain unproducible. The good news: all 224 nodes in the root-required subtree (CreationInfo, Form_ITR2, PartA_GEN1, ScheduleCYLA, ScheduleBFLA, PartB-TI, PartB_TTI, Verification) are emitted, so the skeleton of a return exists — but the file is still not uploadable, because the always-written ScheduleCGFor23 skeleton omits ~35 required AY25-26 BE/AE (pre/post 23-Jul-2024) fields and because hard-coded values violate the schema (AssetOutIndiaFlag 'Y'/'N' vs the YES/NO enum, a stray SecondaryAdd key, the wrong AssesseeRep field set, ScheduleESOP2021_Type, and string PinCode/MobileNo where integers are required). The biggest functional holes for a real client are ScheduleS (salary detail — 38 nodes, never emitted even though the per-employer salary grid already holds every field, and completely absent from the 2026-08-05 gap map), ScheduleOS nature-wise/quarterly detail (105), the NRI/54-exemption half of ScheduleCGFor23 (189), SchedulePTI (70), ScheduleCFL beyond house-property losses (32), and the entire taxes-paid detail (ScheduleIT/TCS/TDS3 = 15 nodes, plus TDS1/TDS2 which only populate if an AIS file is imported) even though the advance-tax challan and TDS/TCS grids already capture all of it. Practically: a CA can today export a schema-shaped ITR-2 that the portal will reject, and for salary, foreign-tax-relief, pass-through, NRI, Portuguese-Civil-Code, AMT-credit or updated-return (139(8A)) cases the required schedules simply are not written at all. Verdict: gaps-remain — a large, well-defined block of them is emitter wiring over data the UI already captures (ScheduleS, IT/TCS/TDS3, FSI/TR1, PTI, CFL amounts, FA foreign-bank), which is where the next fix pass should start.

### Named missing / defective particulars

1. ScheduleS (38 req) — NEVER emitted. The calculator already stores full per-employer detail (salaryData: employer name/TAN/address/state/pin/nature of employment, 17(1)/17(2)/17(3), s.10 exemptions, HRA monthly rent, professional tax). Pure emitter gap; every salaried ITR-2 is incomplete.

2. ScheduleCGFor23 (189 of 508 req missing) — the AY25-26 V1.2 BE/AE (pre/post 23-Jul-2024) sub-fields are missing even in the always-written zero skeleton (TotalLTCGImmblPrprtyBE/AE, BalanceCGTransferBE/AE, DeductionUs54FBE/AE, Proviso112Applicabledtls_BE, EquityMFonSTTDtls_BE, NRItaxSTTPaidTransferBE/AE). Also absent: SaleofBondsDebntr, NRIOnSec112and115, Proviso112Applicable_115ACA, NRICgDTAA, CapitalLossBuyBackSharesDtls, UnutilizedCg, and the DeducClaimDtls 54/54B/54EC/54F/115F grids. UI has LTCG-1/STCG-1/112A/auto-CG but no NRI or exemption-claim grids.

3. ScheduleOS (105 of 135 req missing) — quarterly DateRange blocks for DividendIncUs115A1ai/115AC/115ACA/115AD1i/115BBDA/115BBDAaiii/DividendDTAA, NOT89A, IncChargblSplRateOS, Tot562x (gifts), s.68/69/69A/69B/69C unexplained income, RentFromMachPlantBldgs, TaxAccumulatedBalRecPF. UI captures only interest/dividend/family pension/winnings.

4. SchedulePTI (70 req) — schedule never emitted at all, although an sf-pti drill-in exists in the UI (captured, not exported).

5. ScheduleCFL (32 of 46 req missing) — only the house-property bucket is wired; no STCG/LTCG loss carry-forward, no DateOfFiling per year, no CurrentAYloss or AdjTotBFLossInBFLA summary blocks. The calculator's CFL/loss grids already hold the amounts.

6. ScheduleFSI (28) + ScheduleTR1 (9) — never emitted, although the 'Relief u/s 90/90A/91 — Foreign Tax Credit' drill-in with the Form 67 column toggle already collects country-wise tax-paid/relief data.

7. Taxes-paid detail: ScheduleIT (5) + ScheduleTDS3 (7) + ScheduleTCS (3) — never emitted. UI DOES capture all of it (sf-advtax BSR/date/challan-no grid, sf-sat, sf-tdstcs sections for Form 16A, unclaimed 16A B/F, Form 16 salary TDS, TCS, TCS B/F, Form 16B/C/D/E). Worse, ScheduleTDS1/TDS2 populate ONLY from an imported AIS/26AS file — the manual grids are never read, and TCS is hard-coded 0 in PartB_TTI.

8. Schedule115AD (23 req) — never emitted, no UI (NRI/FII securities income and BE/AE balances).

9. Schedule5A2014 (22 req) — never emitted, no UI (Portuguese Civil Code spouse apportionment).

10. ITR-U + AMT cluster: PartA_139_8A (12) + PartB-ATI (20) + ScheduleAMTC (17) + ScheduleAMT (4) — never emitted, no UI. Plus smaller holes: ScheduleFA.DetailsForiegnBank (11, the one FA block of ten with no wiring), ScheduleEI agri-land + DTAA detail (13), ScheduleHP CoOwners/TenantDetails (4), PartB_TTI GrossTaxPay ESOP-deferral (3) and Refund.ForeignBankDetails (4), PartA_GEN1 AssesseeRep/jurisdiction/7th-proviso detail (7).

### Additional findings not in the old gap map

1. ScheduleS is missing from the gap map entirely — it appears nowhere in ITR-2.md's per-schedule coverage table nor in any A/B/C/D action list, yet it is 38 required nodes, is never emitted, and is 100% capturable today from the existing per-employer salary grid. This is the largest single un-tracked gap for AY2025-26.

2. Even a bare, zero-capital-gain ITR-2 export is schema-INVALID today: the always-written ScheduleCGFor23 skeleton omits ~35 required AY25-26 V1.2 BE/AE (pre/post 23-Jul-2024) fields. The map counts CG nodes but never flags that the emitted skeleton itself fails validation, so 'partial export' is not actually uploadable.

3. Hard violations inside nodes the tool DOES emit (additionalProperties:false / enum): PartB_TTI.AssetOutIndiaFlag emits 'Y'/'N' but the enum is ['YES','NO']; PersonalInfo.SecondaryAdd is not a schema property; AssesseeRep emits RepEmailID/CountryCodeRepMobileNo/RepMobileNo while 2025-26 requires RepCapacity/RepAddress/RepPAN; ScheduleESOP emits ScheduleESOP2021_Type (dropped in 25-26, which needs 2425/2526) and omits TotalTaxAttributedAmt; Schedule80G DoneeWithPan carries TransactionRefNum/IFSCCode; Schedule80GGC carries PoliticalPartyName/PoliticalPartyPAN; ScheduleVIA.UsrDeductUndChapVIA carries PensionContribution80CCC; ScheduleCGFor23 TrnsfImmblPrprtyDtls carries PAN; SaleofAssetNA carries LossSec94of7Or94of8.

4. Type errors the map does not record: Address.PinCode, Address.MobileNo, Address.CountryCodeMobile, Address.Phone.STDcode and ScheduleAL ImmovableDetails[].AddressAL.PinCode are emitted as strings where the schema demands integers.

5. ScheduleTDS2.TDSSection is emitted as the raw AIS section string ('194A') but the schema enum expects ITD short codes ('94A'), so even the AIS-fed happy path fails validation.

6. The map classifies ScheduleIT / ScheduleTCS / ScheduleTDS3 as 'D — missing UI'. That is wrong for this build: sf-advtax, sf-sat and sf-tdstcs already collect BSR code, deposit date, challan serial no., TCS rows, TCS B/F rows and Form 16B/C/D/E rows. These are class C (captured, not exported), which makes them far cheaper wins than the map implies.

7. Similarly ScheduleFSI/ScheduleTR1 are marked 'D' but the Relief u/s 90/90A/91 drill-in with the Form 67 toggle already captures the country-wise data — also class C.

8. ScheduleTDS1/TDS2 are gated entirely on window.__aisData; if the CA types TDS into the sf-tdstcs grids and does not import an AIS/26AS file, the export contains no TDS schedule at all while PartB_TTI still claims the credit. The map records the TDS1/TDS2 issue as a rename only, not as a data-source regression.

9. The gap map's headline 'Coverage now AY2025-26 ~11%' is materially stale. Measured against the real emitter output, coverage is ~62% (1010/1642) — Schedule112A, VDA, CGFor23, SI, 80C/80D/80DD/80U/80E/80EE/80EEA/80EEB/80G/80GGA/80GGC, VIA, SPI, ESOP, AL, FA, OS, EI, HP, CFL and the TDS1/TDS2 rename have all been implemented since the map was written on 2026-08-05.

---

## ITR-3 — A.Y. 2025-26

**Schema:** ITR-3_2025_Main_V1.3 (1).json  
**Required 1361 · emitted 1013 · missing 348** · verdict: gaps-remain

Measured against the official AY2025-26 schema, the tool's structural coverage is much better than the gap map suggests, but no ITR-3 it produces today would be accepted. The full recursive required tree across all 71 ITR-3 schedules is 1,361 nodes; the emitter (buildItr3Json at D:\Downloads\CA_studio\CA_studio\public\tax-utilities\itr3-2025-26.html lines 3085-3830) reaches at most 1,013 of them, and the 576-node strictly-mandatory chain is fully producible ONLY if the CA fills the B/S and P&L tab — leave those blank and the emitter deletes PARTA_BS and PARTA_PL outright, dropping 208 mandatory nodes even though the schema demands both. I executed the real builder headlessly (Playwright) with a fully populated client, books, bank and business-nature dataset and validated the output with ajv against the schema: 29 hard, data-independent violations remain, so the pass rate is zero. The most damaging are ScheduleCGFor23, which is emitted on every single return yet can never validate because `CurrYrLosses` is not produced anywhere in the codebase; a batch of AY2026-27-only keys (SecondaryAdd, OptOutNewTaxRegime, IncFrmBusOrProf, §44BBD) copied verbatim into the 2025 file where additionalProperties:false rejects them; a hardcoded Form Description 12 characters over the 75-char cap; and PinCode/MobileNo emitted as strings where the schema wants integers. Beyond those bugs, ScheduleESR, Schedule115AD, Schedule10AA, Schedule80-IA/IB/IC, Schedule5A2014, ScheduleICDS, PartA_139_8A and PartB-ATI have no input surface at all, so scientific-research claims, FII gains, SEZ and undertaking-wise deductions, ICDS adjustments and updated returns u/s 139(8A) are simply out of reach.

### Named missing / defective particulars

1. ScheduleCGFor23 — 171 of 279 required nodes never emitted; `CurrYrLosses` appears NOWHERE in the emitter, and the schedule is emitted on EVERY return (IncmFromVDATrnsf is always set, even at 0), so this schedule alone makes 100% of outputs schema-invalid. UI captures only calc-iframe head totals plus small 112A/VDA grids — no scrip-level detail, no current-year CG loss table, no AccruOrRecOfCG quarterly split.

2. ScheduleESR (§35 scientific research) — 51 required nodes, 0 emitted. No UI surface anywhere in the tool.

3. Schedule5A2014 (Portuguese Civil Code apportionment) — 27 required nodes, 0 emitted. No UI; the enabling flag PortugeseCC5A is not emitted either.

4. Schedule80_IC / 80_IB / 80_IA (undertaking-wise deductions) — 32 required nodes, 0 emitted. UI captures only the aggregate rupee figures (d80ia_total / d80ib_total / d80ie_total), so ScheduleVIA can claim the deduction while its mandatory backing schedule cannot be produced.

5. Schedule115AD (FII/FPI capital gains) — 11 required nodes, 0 emitted. No UI; FiiFpiFlag is hardcoded 'N'.

6. PartB-ATI (10 req) + PartA_139_8A (7 req) — updated returns u/s 139(8A) are entirely unproducible. No UI.

7. Schedule10AA (SEZ deduction, undertaking-wise) — 7 required nodes, 0 emitted. No UI.

8. ScheduleOS — 9 of 65 required nodes missing (IncFrmLottery, DividendIncUs115BBDA/aiii, DividendIncUs115A1ai). UI lumps all winnings into one cell (it_os_winnings) and all dividend into another, so the rate-wise split cannot be recovered.

9. ScheduleICDS — never emitted at all, though ICDS adjustments are mandatory for any ITR-3 with books. No UI.

10. ScheduleIF / PartnerInFirm (7 req, 2 missing) and TaxReturnPreparer (2 req) — UI captures only a Y/N 'Partner in a firm?' toggle; no firm name/PAN/share grid.

### Additional findings not in the old gap map

1. AY-2026 fields leaking into the AY-2025 file. The gap map states the two tools are 'identical bar AY constants' — that is itself the bug. FilingStatus.OptOutNewTaxRegime, FilingStatus.IncFrmBusOrProf, PersonalInfo.SecondaryAdd, ITR3ScheduleBP.BusinessIncOthThanSpec.ProfitLossInclRefrdSec.ProfitLossUs44BBD and .DeemedProfitBusUs.Section44BBD do NOT exist in the AY2025-26 schema, which sets additionalProperties:false — each is a hard rejection. (§44BBD is an AY2026-27 insertion.)

2. Form_ITR3.Description is hardcoded to an 87-character string; the AY2025-26 schema caps it at maxLength 75. Every single JSON the tool emits fails on this one line (itr3-2025-26.html:3207).

3. FilingStatus.ItrFilingDueDate is hardcoded '2025-09-15', which is not in the AY2025-26 enum ['2025-07-31','2025-10-31','2025-11-30'].

4. Type mismatches: Address.PinCode, Address.MobileNo and Address.CountryCodeMobile are emitted as JSON strings; the AY2025-26 schema types all three as integer (with patterns). Rejected on every return.

5. PartB_TTI.AssetOutIndiaFlag is emitted as 'Y'/'N'; the AY2025-26 enum is ['YES','NO'].

6. TradingAccount.OpeningStock is a non-existent key — AY2025-26 uses OpngStckOfFinishedStcks. The map's C8 flags Trading rows as unwired but not this outright rejection.

7. ScheduleDOA DepreciationDetail carries `Total` and `AdjustmentSec115BAC`, which exist only on the DPM detail shape. Rejected in all six DOA blocks (Building Rate5/10/40, FurnitureFittings Rate10, IntangibleAssets Rate25, Ships Rate20) — 12 errors.

8. PARTA_BS.FundApply.FixedAsset.NetBlock is computed as gross minus depreciation with no floor, but the schema sets minimum 0. Any client whose accumulated depreciation exceeds gross block produces an invalid file.

9. PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[].UseForRefund is still not emitted (map item A5 remains open) — a hard `required` failure on the bank row.

10. The gap map is materially STALE for this file. Since 2026-08-05 the emitter has grown from ~105 lines to 746 (itr3-2025-26.html:3085-3830) and map items A1/A2/A3 (ScheduleTDS1/TDS2/TDS3), A4 (AccountType enum coding), and C1/C2/C4/C6/C7/C8 (Directorship, Unlisted shares, Representative Assessee, Nature of Business, P&L rows, Trading + Manufacturing accounts) are now wired. The map's headline '~20% / 454 of 2269' understates current coverage; the real blocker has shifted from absent nodes to hard schema violations.

---

## ITR-4 — A.Y. 2025-26

**Schema:** ITR-4_2025_Main_V1.3_0.json  
**Required 391 · emitted 352 · missing 39** · verdict: gaps-remain

The ITR-4 AY2025-26 schema (ITR-4_2025_Main_V1.3_0.json) carries 391 recursively-required nodes; buildItr4Json in public/tax-utilities/itr4-2025-26.html now produces 352 of them correctly, so the tool is far ahead of the 2026-08-05 gap map, which still claims ~241 required-missing leaves and describes an emitter that predates the current ScheduleBP/80-series/ITR-U build. The verdict is still gaps-remain, and for a reason the map never looked for: the schema sets additionalProperties:false on 68 of its 73 definitions, and the emitter unconditionally writes 12 keys that do not exist in the 2025 ITR-4 schema (PersonalInfo.AlternateAddress and .SecondaryAdd, FilingStatus.Form10IEAEarlierAYOldRegime, IncomeDeductions.TotalIncomeChargeableUnHP, TaxComputation.Surcharge, Refund.BankAccountDtls.BankDtlsFlag, Verification.Date, three AssesseeRep 2026-only keys, and two Schedule80GGC party keys) — so today every single JSON this tool produces would be rejected on upload, regardless of the data entered. On top of that, four unconditionally-required IncomeDeductions leaves (AnnualValue, AnnualValue30Percent, TotalIncomeOfHP, IncomeNotified89A) are emitted only inside optional if-blocks, ItrFilingDueDate is hardcoded to 2025-09-15 against a schema pattern of exactly '2025-07-31', UseForRefund is a boolean where the schema demands the strings "true"/"false", and Phone.PhoneNo is an integer where a string is required. Genuinely unbuilt (no UI, no emitter) are ScheduleEA10_13A / HRA exemption (8 required leaves), IncomeDeductions.AllwncExemptUs10 (3), and the itemised IncomeDeductions.OthersInc with quarter-wise dividend and 89A DateRange breakups (14) — so a CA with a salaried-plus-presumptive client claiming HRA, or one needing the quarterly dividend split for 234C, cannot file from this tool at all. The good news: ScheduleBP (the schedule that defines ITR-4), all four 80G buckets, 80C/D/DD/U/E/EE/EEA/EEB, ScheduleUs24B, ScheduleIT/TCS/TDS3, LTCG112A, the full 17-key Chapter VI-A block and the ITR-U PartA_139_8A/PartB-ATI pair are all present and structurally correct; the remaining work is roughly one afternoon of key-name, enum and unconditional-emission fixes plus one new HRA drill-in, and a schema-conformance pass added to validateItr4, which today checks only CBDT business rules.

### Named missing / defective particulars

1. ScheduleEA10_13A (HRA exemption u/s 10(13A)) — all 8 required leaves (Placeofwork, ActlHRARecv, ActlRentPaid, DtlsSalUsSec171, BasicSalary, ActlRentPaid10Per, Sal40Or50Per, EligbleExmpAllwncUs13A). Zero UI capture anywhere in the tool.

2. IncomeDeductions.OthersInc.OthersIncDtlsOthSrc[] — 14 required leaves incl. quarter-wise DividendInc.DateRange and NOT89AInc.DateRange. UI captures only one aggregate cell it_os_dividend; no quarter split possible, so 234C on dividends cannot be substantiated.

3. IncomeDeductions.AllwncExemptUs10 — 3 required leaves (SalNatureDesc, SalOthAmount, TotalAllwncExemptUs10). No UI screen; salaried old-regime exempt allowances cannot be itemised.

4. IncomeDeductions.AnnualValue / AnnualValue30Percent / TotalIncomeOfHP — schema-REQUIRED unconditionally, but the emitter only writes them inside the house-property if-block. Any return with no HP data omits three mandatory integers. Data is derivable (defaults 0) — pure emitter bug.

5. IncomeDeductions.IncomeNotified89A — schema-REQUIRED unconditionally; emitted only when bpData.os.s89A has a non-zero value. Missing on virtually every ordinary return.

6. FilingStatus.ItrFilingDueDate — emitted but hardcoded '2025-09-15'; the AY2025 schema pattern is the literal '2025-07-31'. Every export fails this pattern. Value is a constant, no UI needed.

7. PartA_139_8A.AssessmentYear (pattern '2025', emitter sends '2025-26') and LaidOutIn_139_8A (pattern Y|N, emitter defaults 'A'). Breaks every ITR-U (139(8A)) filing; UI does capture the underlying flags.

8. FilingStatus.AssesseeRep.RepCapacity — enum L|M|G|O, emitter hardcodes 'Self'. UI has a representative-assessee drill-in but no capacity dropdown.

9. Refund.BankAccountDtls.AddtnlBankDetails[].UseForRefund — enum is the STRINGS "true"/"false"; emitter writes a JS boolean. Checkbox is captured; only the serialisation is wrong.

10. PersonalInfo.Address.Phone.PhoneNo — schema type string (pattern [0-9]{1,12}); emitter writes integer 0 when the landline is blank. Also MobileNo/EmailAddress/PinCode fall back to 0/'' which violate their required patterns.

### Additional findings not in the old gap map

1. additionalProperties:false is set on 68 of 73 schema definitions (and on ITR4 itself), yet buildItr4Json emits 12 keys that do not exist anywhere in the ITR-4 2025 schema — PersonalInfo.AlternateAddress, PersonalInfo.SecondaryAdd, FilingStatus.Form10IEAEarlierAYOldRegime, IncomeDeductions.TotalIncomeChargeableUnHP, TaxComputation.Surcharge, Refund.BankAccountDtls.BankDtlsFlag, Verification.Date, AssesseeRep.RepEmailID/CountryCodeRepMobileNo/RepMobileNo, Schedule80GGCDetails[].PoliticalPartyName/PoliticalPartyPAN. Each one alone rejects the whole upload. The gap map never checks for illegal keys — it only counts missing ones.

2. The gap map's own D1 remediation tells the developer to emit PersonalInfo.AlternateAddress.{ResidenceNo,LocalityOrArea,CityOrTownOrDistrict,StateCode}. For ITR-4 AY2025-26 PersonalInfo has no AlternateAddress property at all (only AssesseeName, PAN, Address, DOB, EmployerCategory, Status, AadhaarCardNo) — following the map's advice actively creates a validation failure.

3. IncomeDeductions.AnnualValue, AnnualValue30Percent, TotalIncomeOfHP and IncomeNotified89A are unconditionally REQUIRED at IncomeDeductions level. The map treats house-property and 89A as conditional detail schedules (D2/D10) and therefore never flags that omitting them breaks a plain business-only Sugam return.

4. FilingStatus.ItrFilingDueDate has a fixed-literal pattern of '2025-07-31' for AY2025-26. The emitter's '2025-09-15' (the extended due date) is a hard pattern failure. Not in the map.

5. TaxExmpIntIncDtls.OthersInc.OthersIncDtls[].NatureDesc is a closed enum (AGRI, 10(10BC), 10(10D), 10(11), 10(12), 10(12C), 10(13), 10(16), 10(17), 10(17A), 10(18), DMDP, 10(19), 10(26), 10(26AAA), OTH). The emitter hardcodes 'Others', which is not a member. The map's C8 item says 'wire the leaves' but never states the enum.

6. validateItr4() is purely a CBDT business-rule engine (turnover ceilings, 6%/8% floors, 87A, arithmetic ties). It performs no schema conformance check whatsoever — no pattern, no enum, no additionalProperties gate — so none of the above defects are surfaced to the CA before download.

7. AssesseeRep in the AY2025 schema allows only RepName, RepCapacity, RepAddress, RepPAN, RepAadhaar. The emitter deliberately writes a '2025 shape superset' that mixes in the 2026-only email/mobile keys — the map's C5 row lists both shapes but does not warn that mixing them is fatal under additionalProperties:false.

8. FilingStatus.clauseiv7provisio139iDtls[] (clauseiv7provisio139iNature/Amount) and PartA_139_8A.RetrntoRedCarriedFL.UDYear.UnabsorbedDepreciationYearDtls[].UnabsorbedDepreciationYear have no UI and no emitter code at all; neither appears in the ITR-4 gap map.

---

## ITR-5 — A.Y. 2025-26

**Schema:** ITR-5_2025_Main_V1.2.json  
**Required 2438 · emitted 1690 · missing 748** · verdict: gaps-remain

Measured against the official ITR-5 AY 2025-26 schema (2,438 recursively-required nodes), the tool at D:/Downloads/CA_studio/CA_studio/public/tax-utilities/itr5.html emits roughly 1,690 and misses about 748 — but the headline problem is simpler than any count: itr5.html is a hard-wired AY 2026-27 product. Form_ITR5.AssessmentYear is literally "2026" while the 2025 schema pins the pattern "2025", the filing-due-dates and CurrAssYr fields are 2026 constants, the screen says "A.Y. 2026-27", and there is no year selector — so a CA cannot produce an AY 2025-26 ITR-5 JSON from this software at all, no matter what data they key in. Even ignoring the year, three defects reject the file outright: Schedule CG has no emitter whatsoever despite the UI capturing full transaction-level capital-gains data that already flows into Part B-TI; the Other Sources quarterly break-up blocks (lottery + seven dividend DateRange blocks) are built and then explicitly deleted in the final gating code; and Schedules CYLA/BFLA ship with only 3 of the 9 schema-required rate heads because the three pre-July-2024 buckets (15%/10%/20%) were never built for 2025 and three more are deleted. Beyond that, the two AY-2025-only updated-return schedules (Part B-ATI, Part A 139(8A)) and Schedules ICDS, TDS3, 80LA and 115TD are absent end-to-end, and 44AB audit particulars, HP loan/tenant/co-owner detail, presumptive 44AD/ADA/AE business codes and PTI capital-gains sub-heads have no capture surface. The good news the 2026-08-05 gap map misses: the emitter has been built out far beyond what that document describes (~69% node coverage, not 20%), so the remaining work for a 2025-26 build is a year-parameterised emitter, a Schedule CG serialiser, and removal of the three self-inflicted "delete required node" blocks — not a ground-up build.

### Named missing / defective particulars

1. ScheduleCG (483 required nodes) — NO emitter exists anywhere in itr5.html (grep count 0). The UI DOES capture the data: 4 transaction-level CG drill-ins (sf-c-stcg111a, sf-c-stcgoth, sf-c-ltcg112a, sf-c-ltcg112) plus scrip-wise sf-112a / sf-115ad grids, and computeAll feeds PartB-TI.CapGain with real numbers — so the return claims capital gains it cannot substantiate. Captured-but-dropped, the single biggest gap.

2. ScheduleOS quarterly blocks (72) — the schema REQUIRES IncFrmLottery + DividendIncUs115BBDA / 115BBDAaiii / 115A1ai / 115AC / 115AD1iDiv / 115AD1IBd / DividendDTAA (each with a 5-bucket DateRange). itr5.html:3868 explicitly `delete`s all 8 in the final gating block. Self-inflicted hard reject whenever any Other-Sources income exists. No quarterly capture surface in the UI.

3. ScheduleBFLA (42) and ScheduleCYLA (24) — the 2025 schema requires all 9 rate heads (STCG15Per, STCG20Per, STCG30Per, STCGAppRate, STCGDTAARate, LTCG10Per, LTCG12_5Per, LTCG20Per, LTCGDTAARate). The tool never builds the three pre-Finance-Act-2024 heads (STCG15Per/LTCG10Per/LTCG20Per) and then deletes STCG30Per/STCGDTAARate/LTCGDTAARate at :3885. 6 of 9 required heads absent on EVERY export. Fully computable — no UI needed.

4. PartB-ATI (19) — updated-return computation u/s 139(8A). Absent from the emitter and from the UI entirely (grep 0). Present in the 2025 schema, dropped in 2026 — a genuine AY-2025-26-only requirement the tool never had.

5. PARTA_PL presumptive blocks (17) — NatOfBus44AD / NatOfBus44ADA / NatOfBus44AE (business code + name) and GoodsDtlsUs44AE (registration no., tonnage, ownership flag, holding period, presumptive income). The skeleton ships PersumptiveInc44AD/44ADA amounts, so once a presumptive figure is entered these required siblings are missing. No UI captures vehicle/business-code detail.

6. SchedulePTI (14) — CapitalGainsPTI sub-heads (STCG_Sec111A, STCG_Others, LTCG_Sec112A, LTCG_Others, ShortTermCG), OS_Dividend / OS_Others, and the whole IncClmdPTI exempt-section block (Sec23FBB, SecB/SecC section codes). UI (sf-pti) captures head as free text and one amount only.

7. ScheduleHP (13) — Section24B loan-detail rows (lender, loan a/c no., date, total/outstanding amount, interest), TenantDetails (name, PAN, S.No.) and CoOwners. No UI fields exist; the emitter also hard-codes PropCoOwnedFlg:"NO" and ifLetOut:"Y" for every property.

8. PartA_139_8A (12) — updated-return particulars (PAN, name, AY, previously-filed flag, LaidOutIn_139_8A, ITRFormUpdatingInc, UpdatedReturnDuringPeriod). Absent from emitter and UI; 2025-only schedule.

9. ScheduleEI (10) — ExcNetAgriInc land details (district, measurement, owned/irrigated flags), IncNotChrgblAsPerDTAA rows, and OthersInc nature/dividend detail. sf-c-ei captures lump amounts only; the emitter writes just InterestInc / Others / TotalExemptInc.

10. PartA_GEN2 audit blocks (9) — AuditDetails (AuditFlag, AuditedSection), AuditInfo (auditor name, membership no., firm PAN, audit date), AuditReportDetails (act, section, other-Act flag). LiableSec44ABflg is set to "Y" but no 44AB audit particulars are emitted; the UI's "Other Audits" grid (sf-otheraudit) exists but is never serialised. Also missing: ScheduleTDS3 (7, 26QB/26QC TDS — no UI, no emitter), Schedule112A/115AD Balance..AE / Balance..BE / TotalBalance.. (3 each), ScheduleICDS (1, TotalNetAmtDetl), Schedule80LA and Schedule115TD (absent entirely), PartB-TI.CapGain.ShortTerm15Per / LongTerm10Per / LongTerm20Per (3).

### Additional findings not in the old gap map

1. BLOCKING, not in the map's detail: Form_ITR5.AssessmentYear is hard-coded "2026" (itr5.html:2606) but the 2025 schema pins pattern "2025" — every export fails validation at the first node. Same hard-coding in ItrFilingDueDate ("2026-10-31"/"2026-07-31"), ITRScheduleUD.CurrAssYr and ScheduleAMTC.CurrAssYr ("2026-27"), and the UI itself is labelled "A.Y. 2026-27" in the Computation pane and status bar. There is NO assessment-year selector anywhere in the tool, so a CA has no way to produce an AY 2025-26 file at all.

2. ScheduleOS: the emitter CONSTRUCTS the 8 schema-required quarterly DateRange blocks in SKEL2 and then deletes them in the final-gating block (itr5.html:3866-3870) with the comment 'never overlaid, so drop them regardless'. The gap map classes ScheduleOS as plain 'C — captured-but-not-exported'; it does not record that the required blocks are actively removed, which converts an optional-looking gap into a guaranteed schema reject.

3. ScheduleCYLA/BFLA: same pattern — STCG30Per, STCGDTAARate and LTCGDTAARate are deleted at :3885. Combined with the three never-built 2025 rate heads, 6 of 9 schema-required heads are absent on every single export. The map lists CYLA/BFLA only as 'B — compute-wire', understating this as a live defect.

4. Schedule112A / Schedule115AD: the scrip-wise builder emits 8 of the 11 required totals; Balance112AAE, Balance112ABE, TotalBalance112A (and the 115AD equivalents) are never produced, so the moment the sf-112a / sf-115ad grids are used the schedule fails validation. The map's D6 item does not mention these totals.

5. ScheduleICDS is entirely absent from the emitter AND from the gap map's per-schedule checklist (Section E) — the 2025 schema requires TotalNetAmtDetl, and CorpScheduleBP already carries IncProfDecLossAccICDSAdj, so the ICDS adjustment is claimed without the supporting schedule.

6. Schedule80LA (IFSC/offshore-banking units) and Schedule115TD (accreted income) have no emitter and are missing from the gap map's checklist entirely.

7. ScheduleSI: only TotSplRateInc / TotSplRateIncTax are emitted; the SplCodeRateTax rate-wise rows (SecCode, SplRatePercent, SplRateInc, SplRateIncTax) are never produced. Schema-optional, but the ITD cross-validation against PartB-TI.IncChargeableTaxSplRates will flag it.

8. ScheduleFA mis-map: the UI table sf-fa_dep is titled 'Foreign Depository / Custodial accounts' but the emitter routes it only to DtlsForeignCustodialAcc (Table A2). DetailsForiegnBank (Table A1, foreign depository/bank accounts) is never emitted — the most commonly used FA table.

9. The gap map is materially STALE for this form. It is dated 2026-08-05, cites buildITR at line 2422 and describes a 'skeleton + identity emitter, ~41 non-zero leaves, ~23% coverage'. The shipped file has buildITR at line 2589 with the full Action A/B/C/D wiring already in place (partners roster, PARTA_OI, PARTA_QD, 80G/GGA/GGC/IA/IB/IC/IAC/RA, 10AA, ESR, all 9 FA tables, HP, CFL, UD, DPM/DOA/DEP/DCG, PTI, EI, IF, GST, TPSA, IT, TDS2/TCS, 112A/115AD, full B/S, P&L, Manufacturing and Trading accounts). Measured coverage is ~69% of required nodes, not 20-23%.

10. Hard-coded values that will not survive scrutiny even where a node IS emitted: every ScheduleTDS2 row is written with TDSCreditName:'S' and TDSSection:'194' regardless of the actual section; ScheduleFSI/TR1 write CountryCodeExcludingIndia:'1001' for every country; ScheduleHP writes CityOrTownOrDistrict:'NA' and CountryCode:'93' for every property; ScheduleIF writes ProfitShareAmt:0 and FirmCapBalOn31Mar:0. These pass the schema but are factually wrong on the return.

---

## ITR-6 — A.Y. 2025-26

**Schema:** ITR-6_2025_Main_V1.3.json  
**Required 3128 · emitted 717 · missing 2411** · verdict: gaps-remain

No — a CA cannot produce a valid ITR-6 for AY 2025-26 with this software today, and the first obstacle is not a missing schedule but the wrong year: the only ITR-6 tool shipped (public/tax-utilities/itr6.html) is an AY 2026-27 build that hardcodes AssessmentYear "2026" and names its download AY2026-27, so the AY 2025-26 schema (which pins that field to "2025") rejects the file at the very first property. There is no itr6-2025-26.html counterpart, unlike ITR-1 through ITR-4. Measured against ITR-6_2025_Main_V1.3.json's 3,128-node recursive required tree (2,696 leaves, matching the repo's own 2,691-leaf tree), the emitter produces 717 nodes and misses 2,411; 31 whole schedules covering 1,254 required nodes never appear anywhere in the 3,307-line file — including all four Ind AS accounts, the entire block-wise depreciation set (DPM/DOA/DEP/DCG), Part A-OI, Part A-QD, CYLA/BFLA/CFL, Schedules 80G/80GGA/80GGC/80-IA/IB/IC/IAC/RA, ESR, FSI, BBS, UD, 112A/115AD/VDA, ICDS, and Part A 139(8A)+Part B-ATI (so no updated return). A large slice of that is emitter-only work — the UI already collects CYLA/BFLA/CFL head-wise, the 36/37/40/40A/43B disallowances behind Part A-OI, and rate-wise capital gains with per-transaction detail, and buildJSON simply throws it away (ScheduleCG ships as three totals against 475 required nodes) — but depreciation blocks, Ind AS accounts, quantitative details, donee-wise 80G and scrip-wise 112A/115AD have no data-entry surface at all. Beyond the coverage gap there are five outright schema violations that would reject an otherwise-complete file: ScheduleGST uses invented node names under additionalProperties:false, foreign companies get ResidentialStatus "NR" (enum is RES/NRI) and StatusOrCompanyType "F" (enum is 6/7), ScheduleVIA omits the required UsrDeductUndChapVIA branch, and the required Verification FatherName drops out when blank.

### Named missing / defective particulars

1. ScheduleCG — 470 of 475 required nodes missing. UI DOES capture 7 rate-wise CG buckets with per-transaction detail (CGSEC drill-ins at itr6.html:1726-1732); buildJSON collapses all of it to TotalSTCG/TotalLTCG/SumOfCGIncm. Quarterly AccruOrRecOfCG (needed for 234C) and CurrYrLosses are captured nowhere.

2. PARTA_BSIndAS + PARTA_PLIndAS + ManufacturingAccountIndAS + TradingAccountIndAS — 374 nodes, all absent from the file (grep count 0). No UI at all, yet the tool still emits FilingStatus.FinancialStmtFlag='Y' for Ind AS companies, so an Ind AS filer gets a flag with no accounts behind it.

3. ScheduleDPM / ScheduleDOA / ScheduleDEP / ScheduleDCG — 191 nodes, block-wise depreciation entirely absent. UI captures only a single lump-sum 'Depreciation allowable u/s 32' drill-in (bp_depit, :1647). Not producible.

4. ScheduleCFL + ScheduleCYLA + ScheduleBFLA — 213 nodes, all absent. UI DOES capture head-wise CYLA/BFLA and year-wise CFL (ti_cyla :1765, ti_bfla :1771, ti_cfl :1813); the emitter writes only the three PartB-TI totals. Pure emitter gap.

5. PARTA_OI (Other Information) — all 94 nodes absent. UI DOES capture the 36/37/40/40A/43B disallowance detail (oi_36..oi_43b, :1547-1617); only the totals are pushed into CorpScheduleBP. Pure emitter gap.

6. ScheduleOS — 107 of 122 missing. UI captures gross dividend/interest/56(2)(x)/57 drills, but the 115A/DTAA rate buckets and the mandatory quarterly DateRange break-ups are neither captured nor emitted.

7. CorpScheduleBP — 99 of 138 missing: the whole BusSetoffCurrYr set-off matrix, IncmForeignCompRule10TIA and ProfGainUs115B branches. Not captured in UI.

8. Schedule80G / 80GGA / 80GGC (89 nodes) and Schedule80-IA / 80-IB / 80-IC / 80IAC / 80RA (71 nodes) — all absent. UI captures only a lump-sum rupee amount per section in the ti_via drill (:1782); donee-wise and undertaking-wise detail cannot be entered.

9. PARTA_BSFor6FrmAY13 — 99 of 187 missing. Emitted, but only at rollup level: inventory split (WIP/stores/loose tools), current-investment split (listed/unlisted/MF/govt securities), ST loans & advances detail are not captured.

10. Schedule112A + Schedule115AD + ScheduleVDA (49), ScheduleESR (51), ScheduleFSI (28), PARTA_QD (23), ScheduleBBS (21), ITRScheduleUD (18), PartA_139_8A + PartB-ATI (31, so no ITR-U/updated return at all), ScheduleICDS (1) — every one absent from the file, with no UI.

### Additional findings not in the old gap map

1. BLOCKER the map does not state as a 2025-26 finding: itr6.html hardcodes Form_ITR6.AssessmentYear='2026' (line 2743) and downloads as '<PAN>_ITR6_AY2026-27.json' (line 3255). The AY 2025-26 schema pins AssessmentYear to pattern '2025', so every export is rejected at the first field. Unlike ITR-1..ITR-4 there is NO itr6-2025-26.html variant in public/tax-utilities — there is simply no AY 2025-26 ITR-6 tool.

2. ScheduleGST emits invalid node names GSTNNo + AnnualValueGSTR (lines 3054-3055). Schema wants ScheduleGST.TurnoverGrsRcptForGSTIN[] { GSTINNo, AmtTurnGrossRcptGSTIN } and sets additionalProperties:false — so any company with a GSTIN row produces a hard schema rejection, not merely a missing node.

3. ResidentialStatus emits 'NR' for foreign companies (line 2765); schema enum is ['RES','NRI']. Hard reject for every foreign-company filer.

4. StatusOrCompanyType emits 'F' for foreign companies (line 2761); schema enum is ['6','7'] (public/private company). Hard reject for every foreign-company filer.

5. ScheduleVIA.UsrDeductUndChapVIA is schema-required alongside DeductUndChapVIA; the emitter writes only the computed branch, never the user branch.

6. Verification.Declaration.FatherName is schema-required but emitted as p('verifier.father')||undefined (line 3247), so it silently vanishes whenever the field is blank.

7. PartA_GEN1.FilingStatus.AsseseeRepFlg is set to 'Y' from the repasse drill, but the AssesseeRep object (RepName/RepPAN/RepAddress/RepCapacity) is never emitted — a self-contradicting payload.

8. ScheduleFA is missing DetailsForiegnBank entirely (Table A2 foreign bank accounts — the UI's fa_dep covers custodial accounts only), and drops the IncTaxSch / IncTaxSchNo / IncTaxAmt 'income offered in this return' columns on four FA tables.

9. ScheduleAL and ScheduleSH emit only the *UnlistedCompany* branches; the DPIIT start-up branches (AsstLiabilitiesStartUps, ShrhldngStartUps — 121 nodes combined) are absent even though the tool emits StartUpDPIITFlag='Y'.

10. ScheduleTR1 omits TotalTaxOutsideIndia and the per-row CountryName.

11. The gap map's headline P0 remedy — 'adopt the backup emitJSON at public/tax-utilities/itr6-ay2526-backup.html' — is no longer actionable: that file has been deleted from the shipping tree. Only a paths dump survives at docs/itr-schema-conformance/real/emitted/itr6-ay2526-backup.txt.

12. Conversely, the map's Class-A rename table is now STALE: the current buildJSON already emits 'PartB-TI' with the hyphen, PARTA_BSFor6FrmAY13, nested ScheduleCG/ScheduleOS, and object-shaped CorpScheduleBP.SpecBusinessInc / IncSpecifiedBusiness. Those ~11 fixes are done; the map's ~2% coverage figure understates the current build (measured 717/3128 = 23%).

---

## ITR-1 — A.Y. 2026-27

**Schema:** ITR-1_2026_Main_V1.1 (2).json  
**Required 392 · emitted 320 · missing 72** · verdict: gaps-remain

Measured directly: I extracted 392 recursive required dot-paths from the official ITR-1 AY2026-27 schema, then executed the real emitter (buildItr1Json + augmentItr1 + chapVIA, lifted verbatim out of public/tax-utilities/itr1.html) against stubbed UI data and validated the actual output object. Structural coverage is now complete - all 392 required nodes are present, so the 2026-08-05 gap map's claim that the emitter builds zero Schedule* nodes is out of date. But the JSON is still rejected: with realistically filled data, 67-72 required nodes carry values the schema refuses, plus two keys (ExemptIncAgriOthUs10Dtls[].NatureDesc and Verification.Date) that are illegal under additionalProperties:false. Roughly two-thirds of that comes from one pattern - _rowsOr() stuffs a blank skeleton row into every schedule the taxpayer did not use, so even a plain salary-only ITR-1 fails on empty enums; the rest are hard-coded wrong constants (SchemaVer 'Ver1.1' where the schema demands 'Ver1.0', PropCoOwnedFlg 'N' where the enum is YES/NO, UseForRefund as a boolean, MobileNo/PinCode/SrlNoOfChaln as strings where integers are required) and genuine UI gaps (no Pin column in the 80G donee grid, free-text State/TDS-section/FY/loan-source/disability fields where the schema wants codes, no HRA 10(13A) surface, no co-owner or tenant capture, no EmployerCategory field). Separately, and more serious for a CA than schema validity, the emitter hard-codes DeductionUs16 to 0 and exports IncomeFromSal as GROSS salary, so GrossTotIncome is overstated by the Rs 75,000/50,000 standard deduction plus professional tax and no longer reconciles to the TotalIncome it exports. Bottom line: a CA cannot produce a portal-acceptable ITR-1 2026-27 JSON from this tool today - the remaining work is emitter hygiene (suppress empty schedules, fix constants and types, fix the salary ladder) plus about six small UI additions, not new schedules.

### Named missing / defective particulars

1. _rowsOr placeholder-row pollution (~45 of the 72): every unused schedule (Schedule80G's 4 buckets, 80GGA, 80GGC, 80E/EE/EEA/EEB, PensionContribution80CCC, clauseiv7provisio139iDtls, AllwncExemptUs10Dtls, OthersIncDtlsOthSrc, TenantDetails, TDSonOthThanSal, ScheduleTDS3Dtls, ScheduleTCS, TaxPayments) gets one blank skeleton row that fails enum/pattern/minLength. Not a UI gap - the emitter must omit empty schedules. Makes even a plain salary-only return invalid.

2. Form_ITR1.SchemaVer emitted 'Ver1.1' but the AY2026-27 schema pattern is 'Ver1.0' - hard-coded, rejects EVERY export. No UI involved.

3. ITR1_IncomeDeductions.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls[] - emitter still writes the AY2025 key 'NatureDesc'; the 2026 schema replaced it with Category/SubCategory/Description enums and sets additionalProperties:false, so the key is illegal. UI captures nothing (0 hits for SubCategory).

4. Verification.Date - emitted but not a schema property; Verification has additionalProperties:false, so the object is rejected. Always fires.

5. PersonalInfo.Address.MobileNo / CountryCodeMobile / PinCode - emitted as strings, schema types are integer. UI captures the data; wrong cast in the emitter.

6. Refund.BankAccountDtls.AddtnlBankDetails[].UseForRefund - emitted as JS boolean; schema enum is the STRINGS 'true'/'false'. UI has the 'For refund?' checkbox.

7. ITR1_IncomeDeductions.PropertyDetails[] - PropCoOwnedFlg hard-coded 'N' (enum is YES/NO); CoOwners[].NameCoOwner and TenantDetails[].NameofTenant hard-coded blanks. No UI for co-owners or tenants at all. Block is emitted unconditionally, even for salary-only cases.

8. Schedule80G donee rows - AddressDetail.PinCode required but the 80G grid has NO Pin column (80GGA does), and State is a free-text box where the schema needs the 2-digit StateCode enum (01-37/99). Genuine missing UI.

9. TDS/TCS code enums - TDSonOthThanSals/ScheduleTDS3Dtls/ScheduleTCS require TDSSection from a code list ('94A') and DeductedYr/CollectedYr as a 4-digit year enum; the UI is free text with placeholders '194A' and '2025-26'. Also the brought-forward grids (form16ABF, tcsBF, form16BCDEBF) are captured in the UI but never read by the emitter.

10. ScheduleEA10_13A (HRA exemption u/s 10(13A)) - emitted as an all-zero stub with Placeofwork:'' (enum 1=Metro/2=Non-metro), unconditionally. No UI surface exists; HRA sits only in the salary monthly table.

### Additional findings not in the old gap map

1. The 2026-08-05 gap map is STALE for this form-year. Its headline ('emitter writes 0 Schedule* nodes', '~29% req-present', '251 required MISSING') no longer holds: augmentItr1() now emits every Schedule* node and my execution-based check finds 392/392 required nodes structurally PRESENT, 0 absent. The ITR-1 gap has moved from presence to validity - the map does not describe the current failure mode.

2. SchemaVer hard-coded 'Ver1.1' violates the 2026 schema's own pattern 'Ver1.0' - a single-character defect that rejects 100% of exports. Not in the map.

3. Verification.Date is an illegal extra key under additionalProperties:false - not in the map.

4. AY2026-27 restructured ExemptIncAgriOthUs10 to Category/SubCategory/Description; the emitter still writes the 2025-era NatureDesc, producing an illegal key rather than the map's assumed '~2 node C wiring' item.

5. The _rowsOr(rows, skeleton) idiom injects a blank placeholder row into ~15 schedules the taxpayer never used. This alone makes a straightforward salaried ITR-1 invalid and is the single largest source of rejections. Entirely absent from the map.

6. Type-class defects the map does not cover: MobileNo/CountryCodeMobile/PinCode emitted as strings vs schema integer; TaxPayments.SrlNoOfChaln string vs integer; UseForRefund boolean vs string enum (the map listed UseForRefund as simply 'dropped by every form' - it is now emitted, but with the wrong JSON type).

7. Salary arithmetic defect: buildItr1Json sets DeductionUs16:0 and IncomeFromSal = it_sal_total (GROSS salary), while the calculator's own it_sal_income = it_sal_total - it_sal_std - it_sal_proftax. GrossTotIncome is therefore overstated by the standard deduction (Rs 75,000 new / Rs 50,000 old) plus professional tax, so GrossTotIncome - TotalChapVIADeductions no longer equals the exported TotalIncome. CBDT rule-validation will reject; if accepted, the return misstates income. Not flagged in the map.

8. TDS/TCS brought-forward grids (form16ABF, tcsBF, form16BCDEBF) are fully captured in the TDS-TCS drill-in but the emitter reads only salaryTds/form16A/tcs/form16BCDE - prior-year TDS claimed this year is silently lost.

9. PropCoOwnedFlg is hard-coded 'N' against an enum of YES/NO - the map noted the missing co-owner UI but not that the flag value itself is invalid.

10. PersonalInfo.EmployerCategory has no UI field anywhere; it is always the hard-coded fallback 'OTH', which is wrong for CGOV/SGOV/PSU employees.

11. Items the map lists as open that are now FIXED and should be retired: LTCG112A.TotLTCG112A -> LongCap112A (done), FilingStatus.ReturnFileSec sourced from f_section (done), AsseseeRepFlg + AssesseeRep block (done), PersonalInfo.SecondaryAdd='N' (done), and the chapVIA() 'non-existent calc cell' claim - all the cell IDs it now reads (it_80_ccccd, d80d_total, it_80_dd, d80e_total, d80g_total, ...) do exist in the calculator DOM.

---

## ITR-2 — A.Y. 2026-27

**Schema:** ITR-2_2026_Main_V1.1 (1).json  
**Required 1378 · emitted 1041 · missing 337** · verdict: gaps-remain

Ground truth walk of ITR-2_2026_Main_V1.1 yields 1378 required nodes; buildItr2Json (D:/Downloads/CA_studio/CA_studio/public/tax-utilities/itr2.html lines 2193-2754, AY 2026-27, SchemaVer Ver1.1) produces 1041 of them and misses 337 (~76% complete) — far better than the 2026-08-05 gap map's claim of ~12%, but still not filable. Twelve top-level nodes are absent outright: ScheduleS, ScheduleIT, ScheduleTCS, ScheduleTDS3, SchedulePTI, ScheduleFSI, ScheduleTR1, Schedule5A2014, Schedule115AD, ScheduleAMT, ScheduleAMTC and TaxReturnPreparer — and for four of those (ScheduleS salary breakup, ScheduleIT advance-tax/SAT challans, ScheduleTCS, ScheduleTDS3 26QB/26QC) the UI already holds every field, so they are wiring gaps rather than data gaps. Worse than the absences: three schedules the tool DOES emit are schema-invalid as built — ScheduleOS omits 39 hard-required keys (so any return with plain bank interest is rejected), ScheduleCFL omits the required DateOfFiling in every year bucket, and ScheduleESOP omits TotalTaxAttributedAmt; ScheduleHP also sets PropCoOwnedFlg='YES' while never emitting CoOwners. Structural hardcodes cap what is filable at all: ResidentialStatus is pinned to 'RES' (no NRI/RNOR despite a UI selector), ReturnFileSec to 11 (no belated/revised return), and section 54/54B/54EC/54F exemption claims are pinned to zero with no drill-in. Bottom line for a CA: a resident individual with salary, one house property, listed-equity capital gains and Chapter VI-A deductions still cannot export a portal-acceptable ITR-2 JSON today — the salary schedule, the tax-payment challans and a conformant Other-Sources block are the three items that must land first.

### Named missing / defective particulars

1. SchedulePTI (70 req) — WHOLLY ABSENT from emitter. UI DOES capture it: the 'Pass Through Income u/s 115U/115UA/115UB' drill-in exists at itr2.html:352/664 (sf-pti). Pure emitter wiring gap.

2. ScheduleOS (46 req) — schedule IS emitted but is NOT schema-conformant. ScheduleOS.required demands IncFrmLottery, DividendIncUs115BBDA/115BBDAaiii/115A1ai/115AC/115ACA/115AD1i, DividendDTAA, NOT89A; IncOthThanOwnRaceHorse.required demands 31 keys including NatofPassThrghIncome, RentFromMachPlantBldgs, Tot562x + the five 56(2)(x) cells, AnyOtherIncome, IncChrgblUs115BBE, CashCreditsUs68, UnExplnd*Us69/69A/69B/69C, AmtBrwdRepaidOnHundiUs69D, OthersGross, PassThrIncOSChrgblSplRate, IncomeNotified89AOS, TaxAccumulatedBalRecPF. None are emitted -> any return with ordinary bank interest produces an OS block the portal will reject. Most cells are plain zeros; UI has the interest/dividend/family-pension/winnings drill-ins already.

3. ScheduleS (38 req) — WHOLLY ABSENT (zero occurrences of 'ScheduleS' in itr2.html), yet PartB-TI.Salaries is emitted from the calculator. UI captures the data in full: salaryData (itr2.html:6145) holds employer name/TAN/address, 17(1)/17(2)/17(3), exempt-allowance grid, 16(ia)/(ii)/(iii), 89A. Highest-value single miss for a salaried ITR-2 filer.

4. ScheduleCGFor23 (28 of 302 req) — skeleton is otherwise complete, but DeducClaimInfo.DeducClaimDtlsUs54/54B/54EC/54F/115F (exemption claims), UnutilizedCg.UnutilizedCgPrvYrDtls (CGAS), NRICgDTAA.NRIDTAADtls and CapitalLossBuyBackSharesDtls[].Rate are never built — DeducClaimInfo.TotDeductClaim is hardcoded 0, so a 54/54F/54EC exemption CANNOT be claimed. UI has no 54-exemption drill-in.

5. ScheduleFSI (28 req) — WHOLLY ABSENT, no UI drill-in. Blocks any resident with foreign-source income; also inconsistent because PartB_TTI.TaxRelief.Section90 IS emitted from the calculator.

6. Schedule5A2014 (22 req) — WHOLLY ABSENT, no UI. Portuguese-Civil-Code apportionment (Goa/Daman) not filable.

7. Schedule115AD (21 req) — WHOLLY ABSENT, no UI grid. NRI/FII securities LTCG not filable; compounded by ResidentialStatus being hardcoded 'RES'.

8. ScheduleAMTC (17 req) + ScheduleAMT (4 req) — both WHOLLY ABSENT, no UI, although PartB_TTI already emits TaxPayDeemedTotIncUs115JC and CreditUS115JD that reference them.

9. ScheduleTR1 (9 req) — WHOLLY ABSENT, no UI. Country-wise tax paid outside India / 90-90A-91 relief cannot be substantiated.

10. ScheduleIT (5) + ScheduleTCS (3) + ScheduleTDS3 (7) — all three WHOLLY ABSENT, but the UI ALREADY CAPTURES every field: bpData.advTax.rows / bpData.sat.rows carry bankName+bsr+dateDeposit+challanSlNo+amount (itr2.html:10610-10695) and bpData.tdsTcs.tcs / .form16BCDE carry the TCS and 26QB/26QC/194M/194S credits (itr2.html:10613-10637). Pure emitter gap, not a UI gap.

### Additional findings not in the old gap map

1. ScheduleOS is now emitted but SCHEMA-INVALID — the gap map lists OS only as a ~6-node compute item and never flags that emitting a partial OS block is worse than omitting it. 8 ScheduleOS-level required keys and 31 IncOthThanOwnRaceHorse required keys are absent; IncFrmLottery is unconditionally required yet emitted only when winnings>0. Every ITR-2 with bank interest fails validation today.

2. ScheduleCFL.CarryFwdLossDetail.DateOfFiling is a required key and is never emitted (the emitter builds only TotalHPPTILossCF/TotalSTCGPTILossCF/TotalLTCGPTILossCF for each of the 8 year buckets) — so ScheduleCFL is invalid whenever a brought-forward loss exists. Additionally CFL carries HP losses only; TotalSTCGPTILossCF/TotalLTCGPTILossCF are hardcoded 0 even though the CG engine holds capital losses. Map does not mention DateOfFiling.

3. ScheduleHP self-inflicts a rule failure: the emitter sets PropCoOwnedFlg:'YES' whenever share<100 but never emits CoOwners[] (CoOwnersSNo/NameCoOwner), and never emits TenantDetails for let-out property. Map does not flag this contradiction.

4. ScheduleESOP is emitted but omits the required TotalTaxAttributedAmt (and PartB_TTI.ComputationOfTaxLiability.GrossTaxPay.TaxInc17/TaxDeferred17/TaxDeferredPayableCY), so the ESOP block as emitted is invalid.

5. ResidentialStatus is hardcoded 'RES' at itr2.html:2274 even though the UI offers Resident / RNOR / Non-Resident (asr_resstatus, itr2.html:475). NRI and RNOR returns are simply not producible, and PartA_GEN1.FilingStatus.JurisdictionResPrevYr.JurisdictionResPrevYrDtls[].{JurisdictionResidence,TIN} is never emitted. The tool's own validator at itr2.html:2098 tests FS.ResidentialStatus==='NRI', a branch that can never fire.

6. ReturnFileSec is hardcoded 11 and ItrFilingDueDate hardcoded '2026-07-31', with SeventhProvisio139 hardcoded 'N' and Verification.Capacity hardcoded 'S' — belated 139(4), revised 139(5) and representative-capacity returns cannot be produced. The map lists the flags but not the filing-section consequence.

7. ScheduleTDS1/TDS2 populate ONLY from an imported AIS file (window.__aisData). The manual TDS register the CA keys into the computation sheet (bpData.tdsTcs.salaryTds / .form16A, itr2.html:10796+) is never exported — a CA who types TDS by hand gets a return claiming prepaid tax in PartB_TTI with no supporting TDS schedule.

8. ScheduleIT / ScheduleTCS / ScheduleTDS3 are classified 'D — Missing UI' in the gap map. That is wrong for AY 2026-27: the challan and TCS/26QB grids already exist in the computation sheet with every schema field. They are C-class (captured, not exported).

9. ScheduleEI emits the net agricultural figure but never ExcNetAgriInc.ExcNetAgriIncDtls (NameOfDistrict/MeasurementOfLand/AgriLandOwnedFlag/AgriLandIrrigatedFlag) nor IncNotChrgblAsPerDTAADtls — CBDT requires the land details once net agri income exceeds Rs 5 lakh.

10. ScheduleFA omits DetailsForiegnBank entirely (6 required nodes) — FA_COLS defines only 9 drill-ins (depository/equity/insurance/interest/immovable/othercap/signing/trusts/otherincome) and has no foreign-bank-account table. The map counts ScheduleFA as a single 108-node C item and misses this one genuinely-D sub-table.

11. The gap map's headline number is badly stale: it states AY2026-27 coverage ~12% and that the emitter produces 'only CreationInfo, Form_ITR2, PartA_GEN1, CYLA, BFLA, PartB-TI, PartB_TTI, Verification'. Measured today the emitter builds 34 of the 46 top-level nodes and 1041 of 1378 required nodes (~76%) — CG/112A/VDA/SI/OS/EI/HP/CFL/FA/AL/SPI/ESOP and the whole 80-series are all now wired. Re-baseline the map before using it to plan.

---

## ITR-3 — A.Y. 2026-27

**Schema:** ITR-3_2026_Main_V1.1 (1).json  
**Required 2379 · emitted 1659 · missing 720** · verdict: gaps-remain

Ground truth: D:/Downloads/CA_studio/actual itr forms schema/ITR-3_2026_Main_V1.1 (1).json yields 2379 required dot-paths; the emitter is buildItr3Json at D:/Downloads/CA_studio/CA_studio/public/tax-utilities/itr3.html lines 3196-3921, which now constructs 1659 of them (~70%) and leaves 720 unproducible — a far better position than the 2026-08-05 gap map's 21%, because the tool was rebuilt on 2026-08-06, but still not filing-ready. The blunt answer for a CA: no — today's export is rejected outright by the AY2026-27 schema for every taxpayer, because FilingStatus emits the retired key OptOutNewTaxRegime instead of OptOldRegimeCurrAY plus the Form 10-IEA fields, and because PARTA_BS / PARTA_PL are deleted from the JSON whenever no balance-sheet or P&L data was keyed, even though both are unconditionally required members of ITR3; two further additionalProperties:false violations (Total / AdjustmentSec115BAC pushed into every ScheduleDOA block, and PercentageShareProperty / PANofCoOwner in ScheduleHP CoOwners) break any return with depreciation or a co-owned property. Beyond those four wire-level defects, the biggest substantive holes are capital gains (213 of 346 required leaves, including the entire CurrYrLosses set-off block and all NRI/slump-sale/proviso-112 sub-schedules), the §35 research schedule ESR, seven of ten ScheduleFA foreign-asset blocks, ScheduleOS quarterly dividend / online-gaming / race-horse rows, per-AY ScheduleCFL rows, and the profit-linked deduction schedules 80-IA/IB/IC/RA, 10AA, 115AD, 5A2014, IF, SPI, TPSA and ICDS, which have no emitter code at all. A notable near-miss worth fixing first: the tool already has working 44AD / 44ADA / 44AE drill-ins, yet not one rupee of presumptive income reaches PARTA_PL.PersumptiveInc44AD/ADA or ITR3ScheduleBP.DeemedProfitBusUs — so the single most common ITR-3 profile (small business or professional on presumptive basis) currently exports an all-zero business head.

### Named missing / defective particulars

1. ScheduleCGFor23 — 213/346 required leaves absent, incl. the whole CurrYrLosses intra-head CG set-off block (62 leaves), NRISecur115AD, NRIOnSec112and115, SlumpSaleInStcg/LtcgDtls, Proviso112Applicable, SaleofAssetNADtls, CapitalLossBuyBackShares, UnutilizedCg. UI (data.cg) captures only land/building, 112A scrips, other assets, VDA, 54-deductions and the quarterly accrual grid — the rest has no input surface.

2. ScheduleESR (§35 scientific-research expenditure) — 51/51 missing; the string 'ScheduleESR' does not occur anywhere in itr3.html. No UI capture at all.

3. ScheduleFA — 73/108 missing. Only DtlsForeignCustodialAcc, DtlsForeignEquityDebtInterest and DetailsImmovableProperty are emitted; DetailsForiegnBank, DetailsFinancialInterest, DetailsOfAccntsHvngSigningAuth, DetailsOfTrustOutIndiaTrustee, DetailsOthAssets, DtlsForeignCashValueInsurance and DetailsOfOthSourcesIncOutsideIndia are dropped even though the 9 FA drill-ins already capture them (captured-not-exported).

4. ScheduleOS — 72/133 missing: IncFrmOnGames (115BBJ online gaming), IncFromOwnHorse (race-horse), NOT89A (§89A retirement accounts), DividendDTAA and all quarterly dividend blocks 115A1aA/115AC/115ACA/115AD1i/115BBDA. UI captures the headline OS fields only.

5. SchedulePTI — 54/72 missing. Rows carry a single head; CapitalGainsPTI ShortTerm/LongTerm split, IncClmdPTI, OS_Dividend and OS_Others are never built. UI drill captures head + amount + TDS only.

6. Schedule80_IC (28), Schedule80_IB (13), Schedule80_IA (5), Schedule80RA (13) — all four schedules absent. UI captures only the aggregate rupee deduction in the 'Other Chapter VI-A' drill (d80ia_total / d80ib_total / d80ie_total), so the amount rides ScheduleVIA but no undertaking-wise schedule exists.

7. Schedule5A2014 (27) plus PartA_GEN1.FilingStatus.PortugeseCC5A — absent; no UI for Portuguese Civil Code spouse apportionment.

8. Schedule115AD (20) — absent; no UI. NR/FII scrip-wise LTCG has no path at all.

9. ScheduleCFL — 32/66 missing: every per-AY row (LossCFFromPrevYrToAY … LossCFFromPrev9thYearFromAY, LossCFCurrentAssmntYear2021-2026) is absent; only 4 summary triplets are emitted. The lossCFL UI stores per-head aggregates, not per-AY rows.

10. PARTA_PL presumptive block (26 leaves: NatOfBus44AD/44ADA/44AE, PersumptiveInc44AD/44ADA, GoodsDtlsUs44AE, OtherExpensesDtls, BadDebtDtls rows) plus ITR3ScheduleBP.DeemedProfitBusUs.Section44AD/44ADA/44AE left at zero — although the tool has complete 44AD / 44ADA / 44AE drill-ins (sf-44ad, sf-44ada). Presumptive income never reaches the JSON: grep for '44ad' inside buildItr3Json returns zero hits.

### Additional findings not in the old gap map

1. HARD BLOCKER, not in the map: buildItr3Json emits PartA_GEN1.FilingStatus.OptOutNewTaxRegime, which does NOT exist in the AY2026-27 FilingStatus definition (additionalProperties:false). The 2026-27 schema replaced it with OptOldRegimeCurrAY plus the Form 10-IEA block (F10IEACurrAYNewRegime, F10IEADateCurrAYNewTax, F10IEAAckNoCurrAYNewTax, F10IEACurrAYOldRegime, Form10IEAEarlierAYAck*). Every JSON the tool produces today is rejected on this one key, and no 10-IEA acknowledgement can be carried.

2. HARD BLOCKER, contradicts the map: itr3.html deletes PARTA_PL when data.pl is empty ('else { delete j.ITR.ITR3.PARTA_PL; }') and PARTA_BS when data.bs is empty ('if(!_hasBS) delete j.ITR.ITR3.PARTA_BS;'). Both are UNCONDITIONALLY required members of ITR3 in the 2026-27 schema, so the commonest ITR-3 case (44AD/44ADA, no books) emits an invalid return. The map records PARTA_BS as '✓ zero skeleton'.

3. ScheduleDOA illegal keys: the shared detail() helper always emits Total and AdjustmentSec115BAC, but ScheduleDOA Building.Rate5/Rate10/Rate40, FurnitureFittings.Rate10, IntangibleAssets.Rate25 and Ships.Rate20 DepreciationDetail definitions are additionalProperties:false and allow neither. Any return with IT-Act depreciation is rejected.

4. ScheduleHP co-owner mis-keys: emitter writes CoOwners[].PercentageShareProperty and PANofCoOwner; the 2026-27 CoOwners definition (additionalProperties:false) allows only CoOwnersSNo, NameCoOwner, PAN_CoOwner, Aadhaar_CoOwner, PercentShareProperty. Any co-owned property is rejected.

5. ScheduleESOP year coverage is stale: the emitter's map only covers 2021-22 … 2024-25, but the 2026-27 schema defines six blocks including ScheduleESOP2526_Type and ScheduleESOP2627_Type. Deferrals for the two most recent years cannot be reported.

6. ScheduleAMTC year-wise credit rows (ScheduleAMTCDtls[]: AssYr, AmtCreditBalBroughtFwd, AmtCreditSetOfEy, AmtCreditUtilized, BalAmtCreditCarryFwd) are missing although the schedule totals are now emitted — the map treats AMTC as wholly unbuilt (B8) and so never flags the residual row gap.

7. ScheduleAL.InterestHeldInaAsset (NameOfFirm / PanOfFirm / AssesseInvestment / AddressAL) and InterstAOPFlag are missing, and data.alFirm — which is clearly the firm/AOP-interest capture — is mis-routed by the emitter into ScheduleAL.ImmovableDetails instead.

8. ScheduleS.Section10_13A (HRA exemption: Placeofwork, ActlHRARecv, ActlRentPaid, ActlRentPaid10Per, Sal40Or50Per, DtlsSalUsSec171, EligbleExmpAllwncUs13A) and the NatureOfSalary / NatureOfPerquisites / NatureOfProfitInLieuOfSalary OthersIncDtls sub-grids are absent, though the calculator carries a full 26-item perquisite list (SAL_PERQ).

9. TradingAccount.DutyTaxPay.ExciseCustomsVAT.* and TradingAccount.OtherIncDtls[], PARTA_PL.CreditsToPL.OthIncome.OtherIncDtls[] and DebitsToPL.OtherExpensesDtls[]/BadDebtDtls rows remain unmapped even though the ITR P&L tab and the generic breakup drills capture them.

10. The gap map itself is materially stale for this form-year: docs/itr-ui-gap-map/ITR-3.md (2026-08-05) states AY2026-27 coverage ~21% (436/2034), but itr3.html was rewritten 2026-08-06 00:47 and now emits ~67% (1659/2379). Schedules the map marks '✗' — S, HP, OS, CGFor23, 112A, VDA, DPM, DOA, DEP, DCG, UD, PARTA_OI, PARTA_QD, AL, FA, PTI, EI, CFL, AMT, AMTC, SI, FSI, TR1, VIA, 80C/D/DD/E/EE/EEA/EEB/G/GGA/GGC/U, TDS1-3, IT, TCS, GST, ESOP — are now wholly or largely emitted. Its A1/A2/A3 TDS mis-key findings are already fixed.

---

## ITR-4 — A.Y. 2026-27

**Schema:** ITR-4_2026_Main_V1.1 (1).json  
**Required 374 · emitted 350 · missing 24** · verdict: gaps-remain

Structurally, the ITR-4 tool for AY 2026-27 is now nearly complete: of 374 required nodes in ITR-4_2026_Main_V1.1, an executed run of the real buildItr4Json (itr4.html:2177) with fully-populated inputs produces 350 and misses only 24 — all nine mandatory top-level blocks (CreationInfo, Form_ITR4, PersonalInfo, FilingStatus, IncomeDeductions, TaxComputation, TaxPaid, Refund, Verification) plus ScheduleBP, all ten Chapter VI-A proof schedules, PropertyDetails[], ScheduleIT/TCS/TDS3 and LTCG112A are emitted. The 24 genuine holes are four data areas with no UI at all: ScheduleEA10_13A (HRA exemption u/s 10(13A), 8 leaves), the other-sources itemisation with quarter-wise dividend split that drives 234C (8 leaves), AllwncExemptUs10 (3) and PensionContribution80CCC (3), plus the clause-(iv) 7th-proviso rows (2). The verdict is still gaps-remain, however, for a harder reason: I validated a plain vanilla return (salary + 44AD + one bank account) against the schema and it fails on SEVEN counts — SchemaVer 'Ver1.1' vs required 'Ver1.0', ItrFilingDueDate '2026-07-31' vs the pinned '2026-08-31', SecondaryAdd '' against enum Y/N, Phone.PhoneNo emitted as a number where a string is required, UseForRefund emitted as a boolean instead of the string "true"/"false", and three properties that simply do not exist in the schema (TaxComputation.Surcharge, Refund.BankAccountDtls.BankDtlsFlag, Verification.Date) inside blocks declared additionalProperties:false. On top of that, DeductionUs16 is hardcoded to 0 while IncomeFromSal carries gross salary, so GrossTotIncome minus Chapter VI-A does not reconcile to TotalIncome by up to Rs 75,000. Bottom line for a CA: no ITR-4 JSON this tool produces today will upload — the fixes are about a dozen one-line key/type/value corrections plus four missing screens, not a rebuild, and the 2026-08-05 gap map (241 missing, ~28% coverage) is now badly out of date.

### Named missing / defective particulars

1. ScheduleEA10_13A (8 required leaves: Placeofwork, ActlHRARecv, ActlRentPaid, DtlsSalUsSec171, BasicSalary, ActlRentPaid10Per, Sal40Or50Per, EligbleExmpAllwncUs13A) — HRA exemption u/s 10(13A). UI captures NOTHING: the only 'HRA' string in itr4.html is a note inside the 80GG drill-in. Blocks any old-regime salaried presumptive client claiming HRA.

2. IncomeDeductions.OthersInc.OthersIncDtlsOthSrc[] + nested DividendInc.DateRange (8 leaves: OthSrcNatureDesc, OthSrcOthAmount, DateRange.Upto15Of6/Upto15Of9/Up16Of9To15Of12/Up16Of12To15Of3/Up16Of3To31Of3) — UI captures only aggregates (it_os_interest/dividend/familypension/other/winnings) and emits a single IncomeOthSrc number. No nature-wise rows and no quarter-wise dividend split, which the portal needs to compute 234C relief.

3. IncomeDeductions.AllwncExemptUs10 (3 leaves: AllwncExemptUs10Dtls[].SalNatureDesc, .SalOthAmount, TotalAllwncExemptUs10) — salary allowances exempt u/s 10. No UI capture at all (grep 'AllwncExemptUs10' = 0 hits).

4. IncomeDeductions.UsrDeductUndChapVIA.PensionContribution80CCC[] (3 leaves: TypeofIdentifier, NameofIdentifier, Amount) — UI captures only the 80CCC rupee amount (it_80_ccc); no PRAN/identifier grid.

5. FilingStatus.clauseiv7provisio139iDtls[] (2 leaves: clauseiv7provisio139iNature, clauseiv7provisio139iAmount) — clause (iv) of the 7th proviso to s.139(1). Emitter hardcodes SeventhProvisio139:'N'; no UI capture.

6. PRESENT-BUT-INVALID — Form_ITR4.SchemaVer emitted as 'Ver1.1' while the schema pattern is 'Ver1.0'. Hardcoded; no UI involvement. Rejects EVERY export.

7. PRESENT-BUT-INVALID — FilingStatus.ItrFilingDueDate hardcoded '2026-07-31' but the AY2026-27 schema pins the pattern to '2026-08-31'. Rejects EVERY export.

8. PRESENT-BUT-INVALID — PersonalInfo.SecondaryAdd emitted as '' against enum ['Y','N']; and Address.Phone.PhoneNo emitted as a number where the schema declares string. Both hardcoded in the emitter; the UI does capture the landline. Rejects EVERY export.

9. PRESENT-BUT-INVALID — three properties that do not exist in the ITR-4 2026 schema are emitted into blocks declared additionalProperties:false: TaxComputation.Surcharge, Refund.BankAccountDtls.BankDtlsFlag, Verification.Date (plus FilingStatus.AssesseeRep.RepPAN and TaxExmpIntIncDtls...OthersIncDtls[].NatureDesc on the conditional paths). Data is captured; the keys are simply wrong. Rejects EVERY export.

10. WRONG VALUE — IncomeDeductions.DeductionUs16 hardcoded 0 and IncomeFromSal set to GROSS salary (it_sal_total), while TotalIncome comes from it_totalIncome which is net of the s.16(ia) standard deduction and s.16(iii) professional tax. UI captures both (it_sal_std, it_sal_proftax) but the emitter ignores them, so GrossTotIncome − ChapVIA ≠ TotalIncome by up to Rs 75,000 — a hard portal cross-validation failure.

### Additional findings not in the old gap map

1. Form_ITR4.SchemaVer hardcoded 'Ver1.1' but the 2026 schema pattern is literally 'Ver1.0' — the gap map never checked emitted values against string patterns.

2. FilingStatus.ItrFilingDueDate hardcoded '2026-07-31'; the AY2026-27 schema pins it to '2026-08-31' (due date moved). Not in the map.

3. Three ILLEGAL EXTRA PROPERTIES under additionalProperties:false blocks — TaxComputation.Surcharge, Refund.BankAccountDtls.BankDtlsFlag, Verification.Date. The gap map only counted missing leaves and never scanned for extras, so this whole failure class is absent from it.

4. Two further illegal extras on conditional paths: FilingStatus.AssesseeRep.RepPAN (RepPAN is a 2025-only field; 2026 AssesseeRep allows only RepName/RepEmailID/CountryCodeRepMobileNo/RepMobileNo) and TaxExmpIntIncDtls.OthersInc.OthersIncDtls[].NatureDesc (2026 wants Category/SubCategory/Description).

5. Refund...AddtnlBankDetails[].UseForRefund emitted as a JS boolean; the schema enum is the STRING pair ['true','false']. The map asked for this field to be added but did not specify the string type, and the implementation got it wrong.

6. PersonalInfo.SecondaryAdd emitted as '' — enum is ['Y','N']. Map item D1 covered addresses but not this flag's value.

7. PersonalInfo.Address.Phone.PhoneNo emitted as integer; the 2026 schema declares PhoneNo as type string (STDcode stays integer). Map item D1 assumed both were ints.

8. FilingStatus.ReturnFileSec emitted as the STRING '11' whenever the f_section select is present (only the fallback path emits the number 11). Schema enum is numeric [11,12,13,14,16,17,18,20]. The map's fix A4 introduced this string/number bug.

9. Standard deduction u/s 16 is never exported (DeductionUs16 hardcoded 0, IncomeFromSal = gross salary) so GrossTotIncome and TotalIncome are internally inconsistent. The map treated the IncomeDeductions aggregates as already correct.

10. The tax ladder is collapsed: TotalTaxPayable = TaxPayableOnRebate = GrossTaxLiability = NetTaxLiability = it_taxOnTI (which is already post-rebate/surcharge/cess/relief), while Rebate87A and EducationCess are also emitted separately — a double-count the portal will recompute against.

11. TaxPaid.TaxesPaid.TDS is derived by subtraction (tax − balance − advance − self-assessment) rather than summed from TDSonSalaries/TDSonOthThanSals/ScheduleTDS3Dtls, so TotalTaxesPaid will not tie to the credit schedules.

12. PinCode is emitted as N(pin)||0 in PropertyDetails[].AddressDetailWithZipCode and in all four Schedule80G donee buckets; the schema sets minimum 100000, so a blank PIN produces 0 and fails validation instead of being omitted.

13. ScheduleBP.GoodsDtlsUs44AE[].PresumptiveIncome has a schema minimum of 7500 but is emitted as R(v._inc||0) with no floor/guard.

14. OVERALL: the ITR-4 gap map (2026-08-05) records 241 required-missing leaves / ~28% coverage. That is now badly STALE — the emitter has been rewritten (buildItr4Json now at itr4.html:2177, 234 lines, not the 1855-1916 range the map cites) and items A1-A6, B1-B7, C1-C8, D1, D2, D3 and D7 are all implemented. Actual required-missing is 24, i.e. ~94% structural coverage.

---

## ITR-5 — A.Y. 2026-27

**Schema:** ITR-5_2026_Main_V1.0 (1).json  
**Required 515 · emitted 396 · missing 119** · verdict: gaps-remain

Measured against the official ITR-5 AY 2026-27 schema, the recursive all-ancestors-required tree has 515 nodes. Every one of those 515 key paths is structurally present in the tool's three JSON skeletons (SKEL / OI_SKEL / SKEL2), so the export never fails a bare "property missing" check on the happy path — but only 396 of them are ever touched by emitter logic; the remaining 119 ship as frozen zeros or placeholder strings, concentrated in CorpScheduleBP (92), PARTA_PL (16) and PartB-TI (11). So the honest answer is no: a CA cannot today produce a complete, correct ITR-5 2026-27 JSON for a general firm. The three material blockers are (1) Schedule CG is entirely absent from buildITR even though the UI captures all four capital-gains transaction grids and already pushes those figures into PartB-TI — any firm with capital gains exports an unbalanced return; (2) the CorpScheduleBP add-back ladder is broken end-to-end, with presumptive 44AD/44ADA/44AE income, exempt income credited to P&L, and every intermediate total left at zero while the opening and closing figures are real; and (3) buildITR conditionally `delete`s schema-required blocks — FundSrc/FundApply and CreditsToPL/DebitsToPL under "books not maintained", NoBooksOfAccPL under "books maintained" — so one required child of PARTA_PL is dropped on every single export. Beyond that, ScheduleICDS, ScheduleTDS3 (194N), Schedule80LA and Schedule115TD have no UI and no emitter, and several newly-wired schedules ship hardcoded enums (ScheduleHP always let-out and self-owned, ScheduleTDS2 always section 194, ScheduleIF partner share amount always 0) that are shape-valid but wrong for most clients. Note that the 2026-08-05 gap map badly understates the current build (it was written before the emitter was expanded from ~430 leaves to 53 of 58 schedules, and its two headline P0 blockers — unbound address fields and the dropped partner roster — are both already closed), so it should be re-baselined before it is used for planning.

### Named missing / defective particulars

1. ScheduleCG — the whole schedule is absent from buildITR (0 references in itr5.html). Schema requires 8 sub-blocks (ShortTermCapGain, LongTermCapGain, DeducClaimInfo, CurrYrLosses, AccruOrRecOfCG, IncChargeableHeadCapGain, SumOfCGIncm, IncmFromVDATrnsf). UI DOES capture the data (4 CG drill-ins sf-c-stcg111a / stcgoth / ltcg112a / ltcg112) and the figures already flow into PartB-TI.CapGain and Schedule112A — so the return declares CG income with no Schedule CG behind it. Hard blocker for any firm with capital gains.

2. CorpScheduleBP — 92 of its 117 hard-required leaves are never written and ship as the frozen zero skeleton: ProfitLossInclRefrdSec.*, DeemedProfitBusUs.Section44AD/44ADA/44AE, IncCredPL.FirmShareInc/AOPBOISharInc/OthExempInc, ExpDebToPLOthHeadDtls.*, TotExpDebPL, TotAfterAddToPLDeprOthSpecInc, TotDeductionAmts, PLAftAdjDedBusOthThanSpec, Rule 7/7A/7B1/8 rows, SpecBusinessInc.*, IncSpecifiedBusiness.*. The BP add-back ladder therefore does not internally reconcile (ProfBfrTaxPL and NetPLAftAdjBusOthThanSpec are real but every intermediate total is 0). Most of the source data IS captured (sf-c-36/37/40/40a/43b, sf-c-ei, sf-c-44ad/ada/ae).

3. PARTA_PL.PersumptiveInc44AD (GrsTrnOverOrReceipt, TotPersumptiveInc44AD), PersumptiveInc44ADA.GrsReceipt and TotalPrsumptvIncUs44E — all schema-required, all left at 0. UI fully captures 44AD/44ADA/44AE (drill-ins sf-c-44ad, sf-c-44ada, sf-c-44ae with turnover cash/digital split and per-vehicle tonnage) and even uses them to set PartA_GEN2.IncDclrdUs, but the numbers never reach PARTA_PL or CorpScheduleBP.

4. PARTA_BS.FundSrc and PARTA_BS.FundApply — schema-required, but buildITR (itr5.html:~2650) `delete`s both whenever 'books not maintained' is ticked, and the real BS overlay at :3645 only runs under if(!S.flags.bnm). A no-books firm therefore exports a PARTA_BS with only NoBooksOfAccBS and two required blocks missing.

5. PARTA_PL.CreditsToPL and PARTA_PL.DebitsToPL — same conditional delete in no-books mode; and conversely NoBooksOfAccPL (also in PARTA_PL.required) is deleted in books mode. Either branch drops at least one required child of PARTA_PL.

6. PARTA_PL.NoBooksOfAccPL profession-side and mode-split leaves (GrsRcptAccPayeeOrBankMode, GrsRcptOtherMode, GrossReceiptPrf, GrsRcptAccPayeeOrBankModePrf, GrsRcptOtherModePrf, GrossProfitPrf, ExpensesPrf, NetProfitPrf) plus TurnverFrmSpecActivity / NetIncomeFrmSpecActivity — required, never written; the no-books pane only collects one gross-receipt / GP / expense set, so there is no UI to split business vs profession or bank vs cash mode.

7. PartB-TI.DeductionsUnder10Aor10AA, CurrentYearLoss, LossesOfCurrentYearCarriedFwd and DeductionsUndSchVIADtl.PartBchapterVIA — required, left at 0 although Schedule10AA IS emitted and the CYLA/CFL engines compute the loss figures. The 10AA cross-check (Schedule 10AA present but PartB-TI 10AA deduction = 0) will fail at the portal.

8. PartB-TI.ProfBusGain.ProfGainSpecBus / ProfGainSpecifiedBus / IncChrgblTaxSplRate and CapGain.ShortTerm30Per / ShortTermSplRateDTAA / LongTermSplRateDTAA and IncFromOS.FromOwnRaceHorse — required leaves with no capture surface anywhere in the UI (no speculative-business, no specified-business 35AD, no DTAA-rate CG, no race-horse pane).

9. Schedules with neither UI nor emitter: ScheduleICDS (required TotalNetAmtDetl; mandatory for books-maintained 44AA cases and feeds CorpScheduleBP.IncProfDecLossAccICDSAdj, which is also 0), ScheduleTDS3 (194N — the sf-c-tds grid has only a TDS and a TCS table, no 194N split), Schedule80LA (IFSC units), Schedule115TD (accreted income). 5 of the schema's 58 top-level schedules are unreachable; the other 53 are emitted.

10. Hardcoded enum/flag literals in the newly-wired schedules: ScheduleHP forces PropertyOwner 'SE', PropCoOwnedFlg 'NO', ifLetOut 'Y', CityOrTownOrDistrict 'NA' (self-occupied / co-owned property cannot be filed correctly); ScheduleTDS2 forces TDSSection '194' and TDSCreditName 'S'; ScheduleFSI/TR1 force CountryCodeExcludingIndia '1001'; ScheduleIF forces IsLiableToAudit 'N', ProfitShareAmt 0 and TotalFirmCapBalOn31Mar 0 (the sf-othfirm grid only captures firm name / PAN / share %). Shape-valid but factually wrong for most clients.

### Additional findings not in the old gap map

1. The gap map (docs/itr-ui-gap-map/ITR-5.md, 2026-08-05 00:55) is STALE — it describes buildITR at itr5.html:2422 as a ~430-leaf 'skeleton + identity' emitter with 41 non-zero leaves and ~23% coverage. The shipped file (itr5.html, modified 2026-08-05 11:29) has buildITR at :2589 and now genuinely emits 53 of 58 schedules with real values: PARTA_BS, PARTA_PL, ManufacturingAccount, TradingAccount, PARTA_OI, PARTA_QD, HP, OS, VDA, DPM/DOA/DEP/DCG, CFL, ITRScheduleUD, FA, FSI/TR1, PTI, EI, IF, GST, TPSA, IT, TDS2, TCS, 80G, 80GGA, 80GGC, 80RA, 80_IA/IB/IC, 80P, 80IAC, 10AA, ESR, 112A, 115AD, AMT/AMTC, SI, VIA, CYLA, BFLA. Any planning off that map's percentages will be wrong for this form-year.

2. Map P0 blocker 'Bind Assessee area/flat — export is currently unreachable, preflight never passes' is CLOSED: the Assessee info drill-in (itr5.html:999) now has flat / premise / area / district / statecode / pin fields.

3. Map TOP BLOCKER 'Partner/Member roster captured but dropped — firm invalid' is CLOSED: PartA_GEN2.PartnerOrMemberInfo, PrevYrMemPart, NatOfBus, FilingStatus.AssesseeRep and HeldUnlistedEqShrPrYr are all emitted now.

4. NEW and not in the map: the conditional `delete` of schema-required blocks. buildITR drops PARTA_BS.FundSrc, PARTA_BS.FundApply, PARTA_PL.CreditsToPL and PARTA_PL.DebitsToPL in no-books mode, and drops PARTA_PL.NoBooksOfAccPL in books mode. All five are in the schema's required arrays, so EVERY export violates PARTA_PL.required on one branch or the other. This defect was created by the post-map rewrite.

5. NEW: the PARTA_PL presumptive block (PersumptiveInc44AD / PersumptiveInc44ADA / TotalPrsumptvIncUs44E) and CorpScheduleBP.DeemedProfitBusUs.Section44AD/ADA/AE are dead zeros despite full 44AD/44ADA/44AE capture. The map counts PARTA_PL as '137 req / 24 miss' but never identifies the presumptive block or the dead DeemedProfitBusUs path.

6. NEW: ScheduleICDS, Schedule115TD and Schedule80LA have neither a UI surface nor emitter code — none of the three appears in the map's D (missing-UI) list.

7. The map classifies ScheduleTDS3 as class C ('captured, needs a mapper'). It is not captured: the sf-c-tds grid has only a TDS table and a TCS table with no 194N column, and the string 'TDS3' does not occur anywhere in itr5.html.

8. NEW A-class (wrong enum / hardcoded literal) family created by the post-map wiring: ScheduleHP PropertyOwner 'SE' / ifLetOut 'Y' / PropCoOwnedFlg 'NO', ScheduleTDS2 TDSSection '194' + TDSCreditName 'S', ScheduleFSI+TR1 CountryCodeExcludingIndia '1001', ScheduleIF IsLiableToAudit 'N'. The map's section A lists only 6 such items, all in PartA_GEN1.

9. Positive counter-finding: the tool now carries its own 41-rule background validation engine (validateITR5, itr5.html:3951) that hard-blocks download on 35 Category-A failures — the map does not mention it, and its self-declared honest coverage note confirms ~350 further ITD rules are unvalidatable because the tool does not emit the nodes they reference.

---

## ITR-7 — A.Y. 2026-27

**Schema:** ITR-7_2026_Main_V0.1 (1).json  
**Required 1431 · emitted 686 · missing 745** · verdict: gaps-remain

Measured against the official 2026 schema (1,431 required nodes reachable through properties/required/$ref/items), the ITR-7 tool at D:/Downloads/CA_studio/CA_studio/public/tax-utilities/itr7.html emits 686 of them (48%) and misses 745, so a CA cannot today produce a complete ITR-7 AY 2026-27 JSON for anything beyond the simplest 139(4A) trust. What works well and was hand-verified: PartA_GEN1/GEN2, PARTA_BS, ScheduleVC, ScheduleAI, ScheduleA, ITRScheduleJ/I/D/DA/IA/R, ScheduleOA, ScheduleFA (9 of 10 grids), Schedule115TD, ScheduleIT/TDS2/TDS3/TCS, PartB_TI/TI2/TI3 skeletons, PartB_TTI and Verification are all schema-shaped and populated from real inputs. What fails: every income-head schedule — ScheduleCG (300 nodes), ScheduleOS (113), CorpScheduleBP (80), ScheduleCYLA (39), ScheduleHP (34) — is absent, and PartB_TI/TI2/TI3 hardcode those heads to zero, even though PartB_TTI now pulls genuine tax figures from the (recently repaired) computation iframe; the resulting file declares tax payable on zero income and will be rejected on cross-validation. Whole filer categories are unfilable: Schedule ET (electoral trusts), Schedule PP (political parties, 139(4B)) and Schedule IE-I/II/III/IV (10(21)/10(23C)(iiiab)-(iiiae)/10(46) institutions) have no UI and no emitter at all, as do Schedule SH, FSI, TR1, SI, VDA and Schedule 115BBI. The single highest-leverage fix is not new UI but widening the compute-frame bridge payload window.itr7.out (itr7.html:10593), which today returns only 24 tax scalars while the Computation tab already holds the CG/OS/BP/VDA/set-off data the emitter needs.

### Named missing / defective particulars

1. ScheduleCG — 300 required nodes, schedule entirely absent from buildITR7Json(). UI DOES capture the data (LTCG/STCG/112A/VDA/set-off drill-ins live inside the Computation iframe template, itr7.html:1104-1400), but the bridge payload window.itr7.out (itr7.html:10593) publishes only the tax breakup, never head or schedule detail.

2. ScheduleOS — 113 nodes, absent. Compute tab has 'Income taxable at special rates' (sf-os-special) and 'Rental income — Land, Building, P&M' surfaces; nothing is read back into the JSON.

3. CorpScheduleBP — 80 nodes, absent. Business/Profession sub-forms exist in the compute template (itr7.html:754+); no emitter mapping.

4. ScheduleCYLA — 39 nodes, absent. Current-year set-off engine and Schedule CFL dashboard exist in the compute tab; not exported.

5. ScheduleHP — 34 nodes, absent. Only an aggregate HP figure is computed; there is NO property-wise capture (address, co-owners, tenant PAN, let-out flag), so this is a UI gap as well as an emitter gap.

6. ScheduleSH — 29 nodes, absent. No UI anywhere (shareholding of unlisted company).

7. ScheduleFSI (28) + ScheduleTR1 (10) — absent. No UI for country-wise foreign income / tax paid outside India; only a single s.90 relief number reaches PartB_TTI.TaxRelief.Section90.

8. ScheduleIE_I/II/III/IV (3+4+10+11 = 28 nodes) — absent, no UI. These are mandatory for 139(4C) filers under 10(21), 10(23C)(iiiab)-(iiiae) and 10(46), so those trusts cannot be filed at all.

9. ScheduleET (14) + SchedulePP (9) — absent, no UI. Electoral trusts and political parties (139(4B)/Rule 17CA) are wholly unsupported filer categories.

10. SchedulePTI CapitalGainsPTI/IncFromHP/OS_Dividend/OS_Others/IncClmdPTI (20) + Schedule115BBI (7) + ScheduleVDA (9) + ScheduleSI (6) + PartA_GEN1 PartnerInFirmDtls & HeldUnlistedEqShrPrYrDtls (7) + PartA_GEN2 PartnerOrMemberInfo & AggAnnualRecptsofInst (4) + ScheduleFA.DetailsForiegnBank (6) — partial schedules: the parent block is emitted but these required children are not, and in most cases the UI has only a Yes/No flag with no detail grid.

### Additional findings not in the old gap map

1. The gap map's headline 'Prerequisite #0 — inert Computation iframe (escaped <\/script> at itr7.html:10619)' is now FIXED: __ensureComp() at itr7.html:10689 does doc.write(...replace(/<\\/script>/g,'<\/script>')), so the compute engine runs and PartB_TTI carries real tax. The map is stale on its single biggest stated blocker.

2. NEW, worse consequence of that fix: PartB_TTI now exports real tax (normalTax/specialTax/surcharge/cess/234ABC) while PartB_TI, PartB_TI2 and PartB_TI3 still hardcode IncomeFromHP:0, CapGain.*:0, ProfBusGain:0, IncFromOS:0, IncChargeableTaxSplRates:0. The JSON is now internally inconsistent (tax payable on zero declared income heads) — a portal cross-validation reject, not merely a 'value fix'.

3. The real remaining structural blocker is the NARROWNESS OF THE BRIDGE PAYLOAD, which the map never names: window.itr7.out (itr7.html:10593-10604) publishes only 24 tax scalars. Even though ScheduleCG/OS/BP/HP/CYLA/VDA/SI data is fully entered in the Computation tab, no channel exists to return it to buildITR7Json(). Closing Class C/D requires widening this object, not new UI.

4. Class C is largely DONE since the map was written (map: 188 leaf-paths, 10 tree keys, ~14% coverage; measured now: 27 tree keys, 686/1431 = 48%). ScheduleA, ITRScheduleJ/I/D/DA/IA/R, ScheduleOA, ScheduleFA (9 of 10 grids), SchedulePTI, Schedule115TD, ScheduleIT, ScheduleTDS2/TDS3/TCS and PartB_TI2/TI3 are now emitted. Any planning off the map's 1079-reqMISS figure is ~334 nodes pessimistic.

5. Flag/detail inconsistency the map does not flag: PartA_GEN1 emits PartnerInFirmFlg and HeldUnlistedEqShrPrYrFlg but never the corresponding PartnerInFirmDtls / HeldUnlistedEqShrPrYrDtls arrays. Answering 'Yes' to either question in the UI produces a JSON that fails the schema deterministically. Same shape of defect for PartA_GEN2.LiableSec44ABflg-adjacent PartnerOrMemberInfo.

6. ScheduleFA is 94% closed, not 0% as the map states — only the legacy DetailsForiegnBank grid (6 nodes) is missing; all nine modern grids (custodial, equity/debt, insurance, financial interest, immovable, other assets, signing authority, trusts, other income) emit correctly.

7. PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails (SWIFTCode, IBAN, CountryCode) is not emitted, so a non-resident trust claiming a refund to a foreign account cannot be filed.

---
