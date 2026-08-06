# ITR-5 — Firms / LLP / AOP / BOI / Co-operative

> Applicable: Firms, LLPs, AOP/BOI, Local Authority, Co-operative Society, Primary Agricultural Credit Society, Artificial Juridical Person. File: `public/tax-utilities/itr5.html` (A.Y. 2026-27 only, ~201 KB, 2,667 lines). Line numbers below are into that file.

## Layout — differs from ITR-1..4
Uses **`data-pane`** (not `data-tab`): 4 panes (`:162`) — **`p-info`** (ITR Info), **`p-bs`** (Balance Sheet), **`p-pl`** (Manufacturing/Trading/P&L), **`p-comp`** (Computation). A persistent **client bar** (`cl_*`, `:169`) and a bottom **rail** summary (`:865`). Engine: `computeAll`/`computeComp` (`:1966-2380`). Every drill-in is declared in a **popup registry array `P`** (`:944-1342`), indexed by `PBY` — kinds: `fields`, `br` (fixed breakup), `brfree` (addable breakup), `repeat`, `multirepeat`, `md` (master-detail), plus computed specials (`cg`, `dep`, `icds`, `p44ad`, `p44ada`, `amt`, `taxspecial`, `i234`, `s40b`, `partpl`, `tpsa`, `netturn`).

## 1. Info Sheet (`p-info`, `:186-377`)
**Client bar (`:169`):** `cl_name`, `cl_pan`, `cl_status` (Firm/AOP/BOI/LLP/Local Authority/Co-op/PACS/AJP), `cl_res` (Resident/NR), `cl_dof` (date of formation).
**Basic info (`:192`):** `st_assessee`, `st_verifier`, `st_bank`, `st_partners` (Partners/Members), `dpiit` (Startup?), `msme` (MSME?).
**Filing info (`:218`):** `if_sec` (139(1)/(4)/(5)/(8A)/(9)/142(1)/148/153A/153C/119(2)(b)), `if_rtype` (Original/Revised/Updated/Defective), `st_rep` (Representative Assessee).
**Income/Audit/Business (`:237-269`):** `it_pti` (115U/UA/UB), `aud44ab` (liable to 44AB audit), `st_otheraudit`, `st_nob` (Nature of Business), `it_gst` (GSTR turnover), `if_startdate`, `it_92ce` (92CE secondary adjustment).
**Other (`:271`):** `othfirm` (partner in other firm)→`st_othfirm`, `unl` (unlisted shares)→`st_unlisted`, `st_lei` (LEI if refund ≥ ₹50 Cr).
**Foreign Assets (`g-fa`, `:294`):** master `fa` + 9 drill rows (depository, equity/debt, insurance, financial interest, immovable, other capital assets, signing authority, trusts, other income).
**Books-not-maintained (`g-bnm`, `:342`):** `bnm` → financial particulars (`fp_sc/sit/sd/cash`) + profit particulars (`pp_gr/gp/exp` → `it_pp_np`).

## 2. Income entry — the B/S and P&L panes
**Balance Sheet (`p-bs`, `:380`, master `bsen`):** Liabilities `l_*` (partners' capital, reserves, secured/unsecured loans, deferred tax, advances, trade creditors, provisions → `it_totlia`); Assets `a_*` (fixed assets gross/dep/CWIP, long/short-term investments, loans & advances, inventories RM/FG/WIP, trade debtors, cash, misc → `it_totass`).
**Manufacturing/Trading/P&L (`p-pl`, `:498`, master `mtpen`):** Manufacturing A/c (`m_*` → `it_m_cogp`), Trading A/c (`t_*` incl. intraday/F&O → `it_t_gp`), P&L A/c (`it_p_gp` + `it_p_oi` less ~35 expense lines `e_*` incl. **`e_remun` remuneration to partners** and **`e_int_part` interest to partners** → `it_pbit`→`it_pbt`→`it_pat`→`it_balbs`).
**Partner apportionment:** interest & remuneration to partners are **added back** in Computation (`sf-c-partpl`, `:1188`) and the **s.40(b) allowable ceiling** deducted (`sf-c-40b`, `:1191`); per-partner master (share %, remuneration, interest rate) in `sf-partners` (`:961`). *Note: 40(b) is aggregate — there is no automatic per-partner profit-share allocation table.*

## 3. Drill-in Schedules (registry `P`, `:944-1342`)
~90 subforms. Highlights (**+Add** = addable):
- **Info/master:** `sf-bank`(+), `sf-partners`(+ md), `sf-pti`(+), `sf-otheraudit`(+), `sf-nob`(+ 4 tables), `sf-gst`(+), `sf-92ce`(+), `sf-othfirm`(+), `sf-unlisted`(+ md), 9× `sf-fa_*`(+ md).
- **B/S breakups:** `sf-othres`, `sf-tradecr`, `sf-othcl`, `sf-othprov`, `sf-lti`, `sf-deploans`(+), `sf-sti`, `sf-invoth`, `sf-tradedr`, `sf-othca`(+), `sf-addl`.
- **P&L breakups:** `sf-m_dirx`, `sf-m_foh`, `sf-t_oor`(+), `sf-t_duties`, `sf-t_dirx`, `sf-t_taxin`, `sf-t_intra`/`sf-t_fno` (netturn), `sf-p_oi`, `sf-e_ins`, `sf-e_prov`, `sf-e_sal`, `sf-e_taxes`, `sf-e_oth`(+), `sf-fgnpay`, `sf-baddebt`(+).
- **Computation:** `sf-c-hp`(+ md), BP add-backs (`sf-c-36/37/40/40a/43b/deemed/icds/notcredit/othheads(+)/otheradd(+)`), BP deductions (`sf-c-35to35e/exempt/sep/othded(+)`), `sf-c-depit`(+ dep), presumptive (`sf-c-44ad`, `sf-c-44ada`, `sf-c-44ae`(+), `sf-c-35ad`(+), `sf-c-spec`), **Capital Gains** (`sf-c-stcg111a`, `sf-c-stcgoth`, `sf-c-ltcg112a`, `sf-c-ltcg112` — all cg, +add transaction & 54-series), **Other Sources** (`sf-c-os-int(+)/div(+)/rent/win(+)/bbe/vda(+)/oth(+)`), losses `sf-c-bfl`(+), Chapter VI-A `sf-c-80` (80G/GGA/GGC/IA-IE/JJA/JJAA/LA/P/PA), `sf-c-agri`, `sf-c-ei` (Schedule EI), tax `sf-c-amt` (115JC), `sf-c-taxspecial`, `sf-c-rel90`(+ FTC), `sf-c-tds`(+ TDS+TCS), `sf-c-adv`(+), `sf-c-sat`(+), `sf-c-234`.

## 4. Computation Sheet (`p-comp`, `:651-861`; engine `computeComp` `:1966`)
Statement of Total Income → `it_c_*` cells: **HP** (GAV→NAV→SD 30%→24(b)→25A arrears→`it_c_hp`, share-% apportioned; firm has no SOP), **BP** (`it_c_npbt`→add-backs→`it_c_bp_adj`→less IT depreciation→book profit→less 40(b)→+presumptive/speculation→`it_c_bp`), **CG** (STCG 111A 20%, LTCG 112A 12.5% over ₹1.25L, 112 12.5%→`it_c_cg`), **OS** (incl. winnings 115BB 30%, 115BBE 60%, VDA 115BBH 30%→`it_c_os`). Then **`it_c_gti`** → less BF losses → less Ch VI-A (capped) → **`it_c_ti`** → rounded u/s 288A. Tax (constants `:1903`: **FIRM_RATE 0.30, CESS 0.04, surcharge 12% over ₹1 cr with marginal relief**): `it_c_tax_normal` + `it_c_tax_special` → surcharge (+25% on 115BBE) → **cess 4%** → `it_c_tax_total`; **AMT 115JC** (18.5% on ATI if > ₹20L, with 115JD credit); prepaid (rel 90/90A/91, TDS, advance, SAT), interest 234A/B/C + 234F → **`it_c_balance`** (payable/refund).

## 5. JSON mapping (`buildITR` `:2422-2607`)
Shape **`{ ITR: { ITR5: J } }`** where `J = clone(SKEL)` — the full official skeleton (`:2389`) with blocks `CreationInfo`, `Form_ITR5`, `PartA_GEN1` (OrgFirmInfo + FilingStatus), `PartA_GEN2`, `PARTA_BS`, `PARTA_PL`, `CorpScheduleBP`, `PartB-TI`, `PartB_TTI`, `Verification`.
- `Form_ITR5` (`:2434`): FormName `ITR-5`, AssessmentYear `2026`, **SchemaVer `Ver1.0`**, FormVer `Ver1.0`. `CreationInfo.SWCreatedBy` `SW10000000`.
- Key maps: `cl_name`→`OrgFirmInfo.AssesseeName.SurNameOrOrgName`; `cl_pan`→`OrgFirmInfo.PAN`; `cl_dof`→`DateOFFormOrIncorp`; `cl_status`→`StatusOrCompanyType` (Firm=1, LLP=14, AOP/BOI=2, else 9); `if_sec`→`FilingStatus.ReturnFileSec.IncomeTaxSec`; flags→`ForeignExchangeFlag`/`StartUpDPIITFlag`/`ifMSME`/`PartnerInFirmFlg`/`HeldUnlistedEqShrPrYrFlg`; `aud44ab`→due date + `PartA_GEN2.LiableSec44ABflg`; books-not-maintained→`PARTA_BS.NoBooksOfAccBS.*`; BP→`CorpScheduleBP.BusinessIncOthThanSpec.*`; heads/GTI/TI→`PartB-TI.*`; tax/surcharge/cess/AMT/relief/interest→`PartB_TTI.ComputationOfTaxLiability.*`; prepaid→`PartB_TTI.TaxPaid.*`; refund→`Refund` + bank `AddtnlBankDetails[]`; verifier→`Verification.Declaration.*` (Capacity via `CAP_CODE`). Filename `{PAN}_2026_ITR5.json`.

## 6. Validation (`preflight` `:2610-2628`)
Blocking checks (export refused + red "portal will reject" panel if any fail): firm PAN `^[A-Z]{5}[0-9]{4}[A-Z]$`; name non-blank; `cl_dof` DD/MM/YYYY; assessee email has `@`, mobile ≥10 digits, area/district/flat non-blank; verifier name + father's name non-blank; **verifier PAN `^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$` (4th char `P` = individual)**; `if_sec` selected. Inline warnings (non-blocking): 44AD turnover > ₹2cr/₹3cr, 44ADA receipts > ₹75 L. No B/S tie-out enforcement (only rail Diff colour).

## 7. Add options
All `repeat`, `multirepeat`, `md`, `brfree` subforms are addable (dispatch `:1773`); `cg` (add transaction + 54-series), `dep` (add block), `tpsa` (add deposit). Fixed-label `br` tables are not addable.

## 8. Completeness / gaps
**Substantially complete working-paper utility** (4-pane entry, ~90 subforms, live A.Y. 2026-27 firm tax engine: flat 30% + 12% surcharge w/ marginal relief + 4% cess, AMT 115JC, special rates 111A/112/112A/115BB/115BBE/115BBH, s.40(b) ceiling, 44AD/ADA/AE, 234A/B/C+F, preflight, real `{ITR:{ITR5}}` JSON). **But it is a computation/preview + preflight tool, not a 1:1 full return builder.** Honest gaps:
1. **JSON is a curated subset** — the SKEL pre-fills every *required* leaf, but most captured detail isn't round-tripped: no per-transaction CG JSON; OS/HP/VI-A/TDS/FA/Partners are aggregated/omitted; `PARTA_PL`/`PARTA_BS` line-items largely left at skeleton `0` — only headline totals overlaid.
2. **`SEC_CODE` incomplete** — maps only 139(1)/(4)/(5)/142(1)/148; other options fall back to default.
3. **No per-partner profit-allocation to JSON**, no 115BAD/115BAE (co-op concessional regimes) despite co-ops in scope.
4. **No persistence/import** — in-memory only (`S`), lost on reload (unlike ITR-1..4 which autosave to `entity_data` via the shell).
5. **Verifier PAN forced individual** — a non-individual verifier would be wrongly blocked.
6. **CG cost/indexation & 112A grandfathering (FMV 31.01.2018) not modelled**; 234C manual override only.
7. No `summary` pane (only the rail).

Net: strong for computation + preview + preflight; the emitted JSON needs expansion before it's a portal-complete ITR-5 upload beyond a simple firm return.
