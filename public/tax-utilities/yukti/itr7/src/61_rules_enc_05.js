/* =====================================================================
   ITR-7 · A.Y. 2026-27 — Category-A validation rules, batch enc_05 (Phase 6).
   Serial range A209–A258 — Schedule CG (Capital Gains). Every serial in this
   range is ENFORCED-target per books/ITR-7/rule_census.md (all "ScheduleCG.*");
   none is NA/OFFLINE, so all 50 are encoded here as A(n,cond,msg) — cond the
   "this return is lawful" assertion (TRUE on a lawful return, FALSE on the
   violation). Registered via ruleset(fn); runRules() invokes with (I,S_,A,Dd).

   I = the built ITR7 object; the schema paths, the per-head arithmetic
   (aiii/50CA/biv/c/e, the Table-E "gain of current year"/set-off/remaining and
   the Part-D deduction totals) and the sign/flooring conventions were taken from
   sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json (block ScheduleCG), the built
   export forms/ITR-7/src/70_sec_cg.js (expCg / engCg) and books/ITR-7/
   Schedule_CG.md (§2–§7 + Appendix 3 leaf paths / Appendix 4 sheet rows).

   Two notes on the source rule text (books/ITR-7/rules.json):
   - The text is line-wrapped: each serial carries the tail of n−1 + head of n.
     The assertions are encoded to the RE-JOINED semantic rule (e.g. A225's
     "…only if 1c>1d" is completed by A226's head "If B(1c−1d) is negative then
     B1e=0"; A236/A237 span the E(i3)/E(i4) NR-vs-resident compositions).
   - A222 ("A8 = A8a + A8c") and the E-table "gain of current year" rules appear
     TWICE in the sheet's THREE Table-E copies (two hidden). They are encoded
     ONCE against the single live schema key, and matched to the engine's own
     realised formula so a lawful (engine-built) return is silent while a tampered
     figure fires. A8 is summed over all three live rate slots (row 154 header
     "A8a+A8b+A8c") — the raw fragment drops A8b, which would false-fire whenever
     the 30% slot is non-nil.

   Everything is guarded (RG / N / (X||{})); nothing throws. The whole batch is
   scoped under `if(CG)` so it is silent when Schedule CG is absent (the lawful
   resident charitable-trust client carries no capital gains).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const CG = RG(I,"ScheduleCG",null);
  if(!CG || typeof CG!=="object") return;                 /* schedule-scoped: silent when absent */

  const arr = a => Array.isArray(a)?a:[];
  const eq  = (a,b)=>Math.abs(N(a)-N(b))<=1;              /* integer schema; ±₹1 rounding slack */
  const rn  = (o,p)=>N(RG(o||{},p,0));                    /* guarded nested number */
  const ro  = (o,p)=>RG(o||{},p,{})||{};                  /* guarded nested object */
  const flr = (bal,ded)=>N(bal)-Math.min(N(ded),Math.max(0,N(bal))); /* e = c − min(ded,max(0,c)) */

  const ST = ro(CG,"ShortTermCapGain");
  const LT = ro(CG,"LongTermCapGain");

  /* buy-back capital loss @ a given rate slot (schema Amount is stored negative) */
  const bbST = code => arr(RG(ST,"CapitalLossBuyBackShares.CapitalLossBuyBackSharesDtls",[]))
    .reduce((a,x)=>a+(String((x||{}).Rate)===code?N((x||{}).Amount):0),0);

  /* ---- A3 · equity/MF STT (EquityMFonSTT[] — one element per 111A / 115AD(1)(b)(ii)) ---- */
  const mf = arr(RG(ST,"EquityMFonSTT",[]));
  /* A209 — A3c Balance = A3a − A3biv (per element). */
  A(209, mf.every(el=>{const d=ro(el,"EquityMFonSTTDtls");
      return eq(rn(d,"BalanceCG"), rn(d,"FullConsideration")-rn(d,"DeductSec48.TotalDedn"));}),
    "Schedule CG: A3c (Balance) must equal A3a (full value of consideration) minus A3biv (total deductions u/s 48).");
  /* A210 — A3e = A3c + A3d (BalanceCG + loss ignored u/s 94(7)/94(8)). */
  A(210, mf.every(el=>{const d=ro(el,"EquityMFonSTTDtls");
      return eq(rn(d,"CapgainonAssets"), rn(d,"BalanceCG")+rn(d,"LossSec94of7Or94of8"));}),
    "Schedule CG: A3e (STCG) must equal A3c (balance) plus A3d (loss to be ignored u/s 94(7)/94(8)).");

  /* ---- A5 · FII securities u/s 115AD (NRISecur115AD) ---- */
  const a5=ro(ST,"NRISecur115AD");
  /* A211 — A5(a)(ic) = higher of A5(a)(ia) or A5(a)(ib). */
  A(211, eq(rn(a5,"FullValueConsdSec50CA"), Math.max(rn(a5,"FullValueConsdRecvUnqshr"),rn(a5,"FairMrktValueUnqshr"))),
    "Schedule CG: A5(a)(ic) full value u/s 50CA must be the higher of A5(a)(ia) (consideration on unquoted shares) or A5(a)(ib) (fair market value).");
  /* A212 — A5(aiii) = A5(a)(ic) + A5(aii). */
  A(212, eq(rn(a5,"FullConsideration"), rn(a5,"FullValueConsdSec50CA")+rn(a5,"FullValueConsdOthUnqshr")),
    "Schedule CG: A5(aiii) total consideration must equal A5(a)(ic) plus A5(aii) (consideration for assets other than unquoted shares).");
  /* A213 — A5 biv = A5(bi+bii+biii). */
  A(213, eq(rn(a5,"DeductSec48.TotalDedn"), rn(a5,"DeductSec48.AquisitCost")+rn(a5,"DeductSec48.ImproveCost")+rn(a5,"DeductSec48.ExpOnTrans")),
    "Schedule CG: A5 biv (total deductions u/s 48) must equal the sum of A5 bi + bii + biii.");
  /* A214 — A5c = A5(aiii − biv). */
  A(214, eq(rn(a5,"BalanceCG"), rn(a5,"FullConsideration")-rn(a5,"DeductSec48.TotalDedn")),
    "Schedule CG: A5c (balance) must equal A5(aiii) minus A5(biv).");
  /* A215 — A5e = A5c + A5d. */
  A(215, eq(rn(a5,"CapgainonAssets"), rn(a5,"BalanceCG")+rn(a5,"LossSec94of7Or94of8")),
    "Schedule CG: A5e (STCG on FII securities) must equal A5c plus A5d (loss ignored u/s 94(7)/94(8)).");

  /* ---- A6 · sale of assets other than A1–A5 (SaleOnOtherAssets) ---- */
  const a6=ro(ST,"SaleOnOtherAssets");
  /* A216 — A6(a)(ic) = higher of A6(a)(ia) or A6(a)(ib). */
  A(216, eq(rn(a6,"FullValueConsdSec50CA"), Math.max(rn(a6,"FullValueConsdRecvUnqshr"),rn(a6,"FairMrktValueUnqshr"))),
    "Schedule CG: A6(a)(ic) full value u/s 50CA must be the higher of A6(a)(ia) or A6(a)(ib).");
  /* A217 — A6(aiii) = A6(a)(ic) + A6(aii). */
  A(217, eq(rn(a6,"FullConsideration"), rn(a6,"FullValueConsdSec50CA")+rn(a6,"FullValueConsdOthUnqshr")),
    "Schedule CG: A6(aiii) total consideration must equal A6(a)(ic) plus A6(aii).");
  /* A218 — A6 biv = A6(bi+bii+biii). */
  A(218, eq(rn(a6,"DeductSec48.TotalDedn"), rn(a6,"DeductSec48.AquisitCost")+rn(a6,"DeductSec48.ImproveCost")+rn(a6,"DeductSec48.ExpOnTrans")),
    "Schedule CG: A6 biv (total deductions u/s 48) must equal the sum of A6 bi + bii + biii.");
  /* A219 — A6c = A6(aiii − biv). */
  A(219, eq(rn(a6,"BalanceCG"), rn(a6,"FullConsideration")-rn(a6,"DeductSec48.TotalDedn")),
    "Schedule CG: A6c (balance) must equal A6(aiii) minus A6(biv).");
  /* A220 — A6g = 6c + 6d + 6e − 6f (balance + loss94 + deemed-depreciable STCG − deduction). */
  A(220, eq(rn(a6,"CapgainonAssets"),
      rn(a6,"BalanceCG")+rn(a6,"LossSec94of7Or94of8")+rn(a6,"DeemedSTCGDeprAsset")-rn(a6,"ExemptionOrDednUs54.ExemptionGrandTotal")),
    "Schedule CG: A6g (STCG on other assets) must equal 6c + 6d + 6e − 6f (balance + loss u/s 94 + deemed STCG on depreciable assets − deduction u/s 54).");

  /* A221 — A7 = Σ(a: unutilised CGAS X) + b (amount deemed STCG other than 'a'). */
  A(221, eq(rn(ST,"TotalAmtDeemedStcg"),
      arr(RG(ST,"UnutilizedCg.UnutilizedCgPrvYrDtls",[])).reduce((a,x)=>a+N((x||{}).AmtUnutilized),0)+rn(ST,"AmtDeemedStcg")),
    "Schedule CG: A7 (amount deemed to be STCG) must equal the sum of the unutilised-CGAS amounts (aXi+aXii+aXiii) plus A7b.");

  /* A222 — A8 = A8a + A8b + A8c (the three live pass-through rate slots; sheet row 154). */
  A(222, eq(rn(ST,"PassThrIncNatureSTCG"),
      rn(ST,"PassThrIncNatureSTCG20Per")+rn(ST,"PassThrIncNatureSTCG30Per")+rn(ST,"PassThrIncNatureSTCGAppRate")),
    "Schedule CG: A8 (pass-through STCG) must equal the sum of A8a (@20%) + A8b (@30%) + A8c (@applicable rate).");

  /* ---- B1 · land or building, long-term (SaleofLandBuildDtls[] — improve is nested) ---- */
  const ltLand = arr(RG(LT,"SaleofLandBuild.SaleofLandBuildDtls",[]));
  /* A223 — B1 biv = B1(bi + bii + biii). */
  A(223, ltLand.every(p=>eq(rn(p,"TotalDedn"), rn(p,"AquisitCost")+rn(p,"CostOfImprovements.ImproveCost")+rn(p,"ExpOnTrans"))),
    "Schedule CG: B1 biv (total deductions u/s 48) must equal the sum of B1 bi (cost) + bii (improvement) + biii (expenditure on transfer).");
  /* A224 — B1c = B1(aiii − biv). */
  A(224, ltLand.every(p=>eq(rn(p,"Balance"), rn(p,"FullConsideration50C")-rn(p,"TotalDedn"))),
    "Schedule CG: B1c (balance) must equal B1(aiii) (full value u/s 50C) minus B1(biv).");
  /* A225/A226(head) — B1e = B(1c − 1d), only if 1c > 1d; if B(1c−1d) is negative, B1e = 0 (deduction floored at the balance). */
  A(225, ltLand.every(p=>eq(rn(p,"CapgainonAssets"), flr(rn(p,"Balance"), rn(p,"ExemptionOrDednUs54.ExemptionGrandTotal")))),
    "Schedule CG: B1e (LTCG on immovable property) must equal B1c minus B1d, and the deduction cannot make it negative (floored at zero).");

  /* ---- B2 · slump sale, long-term (SlumpSaleInLtcgDtls.SlumpSaleInLtcg) ---- */
  const b2=ro(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg");
  /* A226 — B2e = B(2c − 2d) (balance − deduction u/s 54EC), floored at the balance. */
  A(226, eq(rn(b2,"CapgainonAssets"), flr(rn(b2,"SlumpBalance"), rn(b2,"DeductionUnderSec54"))),
    "Schedule CG: B2e (LTCG from slump sale) must equal B2c (balance) minus B2d (deduction u/s 54EC).");
  /* A227 — B2c = B(2aiii − 2b) (full value − net worth). */
  A(227, eq(rn(b2,"SlumpBalance"), rn(b2,"FullConsideration")-rn(b2,"NetWorthOfDivision")),
    "Schedule CG: B2c (balance) must equal B2(aiii) (full value of consideration) minus B2b (net worth of the undertaking/division).");

  /* ---- B3 · listed securities / ZCB u/s 112(1) (Proviso112Applicable) ---- */
  const b3=ro(LT,"Proviso112Applicable.Proviso112Applicabledtls");
  /* A228 — B3 biv = B3(bi + bii + biii). */
  A(228, eq(rn(b3,"DeductSec48.TotalDedn"), rn(b3,"DeductSec48.AquisitCost")+rn(b3,"DeductSec48.ImproveCost")+rn(b3,"DeductSec48.ExpOnTrans")),
    "Schedule CG: B3 biv (total deductions u/s 48) must equal the sum of B3 bi + bii + biii.");
  /* A229 — B3c = B(3a − biv). */
  A(229, eq(rn(b3,"BalanceCG"), rn(b3,"FullConsideration")-rn(b3,"DeductSec48.TotalDedn")),
    "Schedule CG: B3c (LTCG on listed securities/ZCB) must equal B3a (full value) minus B3(biv).");

  /* ---- B6 · non-resident heads 112(1)(c)/115AB/115AC/115AD (NRIOnSec112and115Dtls[]) ---- */
  const b6 = arr(RG(LT,"NRIOnSec112and115.NRIOnSec112and115Dtls",[]));
  /* A230 — B6(a)(ic) = higher of B6(a)(ia) or B6(a)(ib). */
  A(230, b6.every(r=>eq(rn(r,"FullValueConsdSec50CA"), Math.max(rn(r,"FullValueConsdRecvUnqshr"),rn(r,"FairMrktValueUnqshr")))),
    "Schedule CG: B6(a)(ic) full value u/s 50CA must be the higher of B6(a)(ia) or B6(a)(ib).");
  /* A231 — B6(aiii) = B6(a)(ic + ii). */
  A(231, b6.every(r=>eq(rn(r,"FullConsideration"), rn(r,"FullValueConsdSec50CA")+rn(r,"FullValueConsdOthUnqshr"))),
    "Schedule CG: B6(aiii) total consideration must equal B6(a)(ic) plus B6(aii).");
  /* A232 — B6 biv = B6(bi + bii + biii). */
  A(232, b6.every(r=>eq(rn(r,"DeductSec48.TotalDedn"), rn(r,"DeductSec48.AquisitCost")+rn(r,"DeductSec48.ImproveCost")+rn(r,"DeductSec48.ExpOnTrans"))),
    "Schedule CG: B6 biv (total deductions u/s 48) must equal the sum of B6 bi + bii + biii.");
  /* A233 — B6c = B(6aiii − biv). */
  A(233, b6.every(r=>eq(rn(r,"BalanceCG"), rn(r,"FullConsideration")-rn(r,"DeductSec48.TotalDedn"))),
    "Schedule CG: B6c (LTCG for non-resident) must equal B6(aiii) minus B6(biv).");

  /* ---- Table E · current-year loss set-off (CurrYrLosses) ---- */
  const CE   = ro(CG,"CurrYrLosses");
  const COLS = ["StclSetoff20Per","StclSetoff30Per","StclSetoffAppRate","StclSetoffDTAARate","LtclSetOff12_5Per","LtclSetOffDTAARate"];
  const ROWS = ["InStcg20Per","InStcg30Per","InStcgAppRate","InStcgDTAARate","InLtcg12_5Per","InLtcgDTAARate"];
  const rowSetoff = node => COLS.reduce((a,c)=>a+N((node||{})[c]),0);  /* Σ of the set-off columns present in a gain row */

  /* A234 — E viii (total loss set off) per column = Σ over rows ii..vii of that column. */
  A(234, COLS.every(c=>eq(rn(CE,"TotLossSetOff."+c), ROWS.reduce((a,rw)=>a+rn(CE,rw+"."+c),0))),
    "Schedule CG (Table E): row viii (total loss set off) in each column must equal the sum of that column over rows ii to vii.");
  /* A235 — E ix (loss remaining) per column = (i − viii), only if i > viii (else zero). */
  A(235, COLS.every(c=>eq(rn(CE,"LossRemainSetOff."+c), Math.max(0, rn(CE,"InLossSetOff."+c)-rn(CE,"TotLossSetOff."+c)))),
    "Schedule CG (Table E): row ix (loss remaining after set off) in each column must equal row i minus row viii (not below zero).");

  /* E "gain of current year" (column 1) composition per rate bucket.
     Matched to engCg's Table-E slots so a lawful engine-built return is silent:
       30%  = A5e + A8@30 + buy-back@30                       (floored at 0)
       app  = A1e + A2c + A4b + A6g + A7 + A8@app + buy-back@app (floored at 0)
       DTAA = A9b (STCG chargeable at special DTAA rate)      (floored at 0)
     A236/A239 (E i3 / E ii) → 30%; A237/A240 (E i4 / E iv) → applicable rate;
     A238/A241 (E i5 / E v) → DTAA. Each pair is the same live schema key across
     the sheet's two Table-E copies. */
  const A1e  = ltLandSTsum();
  function ltLandSTsum(){return arr(RG(ST,"SaleofLandBuild.SaleofLandBuildDtls",[])).reduce((a,p)=>a+N((p||{}).CapgainonAssets),0);}
  const comp30  = rn(a5,"CapgainonAssets") + rn(ST,"PassThrIncNatureSTCG30Per") + bbST("STL30");
  const compApp = A1e + rn(ST,"SlumpSaleInStcg.CapgainonAssets") + rn(ST,"NRITransacSec48Dtl.NRItaxSTTNotPaid")
                + rn(a6,"CapgainonAssets") + rn(ST,"TotalAmtDeemedStcg") + rn(ST,"PassThrIncNatureSTCGAppRate") + bbST("STLAR");
  const a9b     = rn(ST,"TotalAmtTaxUsDTAAStcg");
  /* A236 — E(i3): STCG-@30% gain of current year. */
  A(236, eq(rn(CE,"InStcg30Per.CurrYearIncome"), Math.max(0,comp30)),
    "Schedule CG (Table E): the current-year STCG taxable @30% must equal A5e + A8b + buy-back loss @30%, reduced by any amount taken to a special/DTAA rate.");
  /* A237 — E(i4): STCG-@applicable-rate gain of current year. */
  A(237, eq(rn(CE,"InStcgAppRate.CurrYearIncome"), Math.max(0,compApp)),
    "Schedule CG (Table E): the current-year STCG taxable at applicable rate must equal A1e + A2c + A4b + A6g + A7 + A8c + buy-back loss @applicable rate.");
  /* A238 — E(i5): STCG-@DTAA-rate gain of current year = A9b. */
  A(238, eq(rn(CE,"InStcgDTAARate.CurrYearIncome"), Math.max(0,a9b)),
    "Schedule CG (Table E): the current-year STCG taxable at DTAA rates must equal A9b (STCG claimed chargeable at special rates under a DTAA).");
  /* A239 — E(ii): same STCG-@30% bucket, second Table-E copy. */
  A(239, eq(rn(CE,"InStcg30Per.CurrYearIncome"), Math.max(0,comp30)),
    "Schedule CG (Table E): the current-year STCG taxable @30% must equal A5e + A8b + buy-back loss @30%, reduced by any amount taken to a special/DTAA rate.");
  /* A240 — E(iv): same STCG-@applicable-rate bucket, second Table-E copy. */
  A(240, eq(rn(CE,"InStcgAppRate.CurrYearIncome"), Math.max(0,compApp)),
    "Schedule CG (Table E): the current-year STCG taxable at applicable rate must equal A1e + A2c + A4b + A6g + A7 + A8c + buy-back loss @applicable rate.");
  /* A241 — E(v): same STCG-@DTAA-rate bucket = A9b, second Table-E copy. */
  A(241, eq(rn(CE,"InStcgDTAARate.CurrYearIncome"), Math.max(0,a9b)),
    "Schedule CG (Table E): the current-year STCG taxable at DTAA rates must equal A9b.");

  /* A242 — deductions claimed under each section in the STCG/LTCG heads must match Table D.
     Total of the head deductions (ExemptionGrandTotal on A1/A6/B1/B8 + B2 54EC) vs Table D total. */
  const headDed =
      arr(RG(ST,"SaleofLandBuild.SaleofLandBuildDtls",[])).reduce((a,p)=>a+rn(p,"ExemptionOrDednUs54.ExemptionGrandTotal"),0)
    + rn(a6,"ExemptionOrDednUs54.ExemptionGrandTotal")
    + arr(RG(LT,"SaleofLandBuild.SaleofLandBuildDtls",[])).reduce((a,p)=>a+rn(p,"ExemptionOrDednUs54.ExemptionGrandTotal"),0)
    + rn(b2,"DeductionUnderSec54")
    + rn(LT,"SaleofAssetNADtls.SaleofAssetNA.ExemptionOrDednUs54.ExemptionGrandTotal");
  A(242, eq(headDed, rn(CG,"DeducClaimInfo.TotDeductClaim")),
    "Schedule CG: the deductions claimed under the respective sections in the STCG/LTCG heads must match the total in Table D (DeducClaimInfo).");

  /* A243 — E column 8 (current-year gain remaining) = col(1 − 2 − 3 − 4 − 5 − 6 − 7), per gain row. */
  A(243, ROWS.every(rw=>{const node=ro(CE,rw);
      return eq(N(node.CurrYrCapGain), Math.max(0, N(node.CurrYearIncome)-rowSetoff(node)));}),
    "Schedule CG (Table E): for each gain row, column 8 (gain remaining after set off) must equal column 1 (gain of current year) less the loss set-off in columns 2 to 7.");

  /* A244 — B11 col 10 (applicable rate) = lower of col 6 (treaty) or col 9 (I.T. Act). */
  A(244, arr(RG(LT,"NRICgDTAA.NRIDTAADtls",[])).every(r=>{r=r||{};
      if(r.RateAsPerTreaty==null||r.RateAsPerITAct==null)return true;
      return eq(r.ApplicableRate, Math.min(N(r.RateAsPerTreaty),N(r.RateAsPerITAct)));}),
    "Schedule CG: B11 column 10 (applicable rate) must be the lower of column 6 (rate as per treaty) or column 9 (rate as per I.T. Act).");
  /* A245 — A9 col 10 (applicable rate) = lower of col 6 (treaty) or col 9 (I.T. Act). */
  A(245, arr(RG(ST,"NRICgDTAA.NRIDTAADtls",[])).every(r=>{r=r||{};
      if(r.RateAsPerTreaty==null||r.RateAsPerITAct==null)return true;
      return eq(r.ApplicableRate, Math.min(N(r.RateAsPerTreaty),N(r.RateAsPerITAct)));}),
    "Schedule CG: A9 column 10 (applicable rate) must be the lower of column 6 (rate as per treaty) or column 9 (rate as per I.T. Act).");

  /* ---- B8 · sale of assets where B1–B7 not applicable (SaleofAssetNADtls.SaleofAssetNA) ---- */
  const b8=ro(LT,"SaleofAssetNADtls.SaleofAssetNA");
  /* A246 — expenses u/s 48 (B8 biv) cannot be claimed if the full value of consideration (B8 aiii) is not offered to tax. */
  A(246, rn(b8,"FullConsideration")>0 || rn(b8,"DeductSec48.TotalDedn")<=0,
    "Schedule CG: expenses u/s 48 (B8 b(iv)) cannot be claimed when the full value of consideration (B8 aiii) is nil / not offered to tax.");
  /* A247 — B8(a)(ic) = higher of B8(a)(ia) or B8(a)(ib). */
  A(247, eq(rn(b8,"FullValueConsdSec50CA"), Math.max(rn(b8,"FullValueConsdRecvUnqshr"),rn(b8,"FairMrktValueUnqshr"))),
    "Schedule CG: B8(a)(ic) full value u/s 50CA must be the higher of B8(a)(ia) or B8(a)(ib).");
  /* A248 — B8 aiii = B8(a)(ic + ii). */
  A(248, eq(rn(b8,"FullConsideration"), rn(b8,"FullValueConsdSec50CA")+rn(b8,"FullValueConsdOthUnqshr")),
    "Schedule CG: B8(aiii) total consideration must equal B8(a)(ic) plus B8(aii).");
  /* A249 — B8 biv = B8(bi + bii + biii). */
  A(249, eq(rn(b8,"DeductSec48.TotalDedn"), rn(b8,"DeductSec48.AquisitCost")+rn(b8,"DeductSec48.ImproveCost")+rn(b8,"DeductSec48.ExpOnTrans")),
    "Schedule CG: B8 biv (total deductions u/s 48) must equal the sum of B8 bi + bii + biii.");
  /* A250 — B8c = B(8aiii − biv). */
  A(250, eq(rn(b8,"BalanceCG"), rn(b8,"FullConsideration")-rn(b8,"DeductSec48.TotalDedn")),
    "Schedule CG: B8c (balance) must equal B8(aiii) minus B8(biv).");
  /* A251 — B8e = B(8c − 8d), only if 8c > 8d (deduction floored at the balance). */
  A(251, eq(rn(b8,"CapgainonAssets"), flr(rn(b8,"BalanceCG"), rn(b8,"ExemptionOrDednUs54.ExemptionGrandTotal"))),
    "Schedule CG: B8e (LTCG on other assets) must equal B8c minus B8d, with the deduction not exceeding the balance.");

  /* A252 — B9 = B9(a: unutilised CGAS X) + b (amount deemed LTCG other than 'a'). */
  A(252, eq(rn(LT,"TotalAmtDeemedLtcg"),
      arr(RG(LT,"UnutilizedCg.UnutilizedCgPrvYrDtls",[])).reduce((a,x)=>a+N((x||{}).AmtUnutilized),0)+rn(LT,"AmtDeemedLtcg")),
    "Schedule CG: B9 (amount deemed to be LTCG) must equal the sum of the unutilised-CGAS amounts (aXi+aXii+aXiii) plus B9b.");
  /* A253 — B10 = B10(a1) + B10(a2) (pass-through LTCG @12.5% u/s 112A and other). */
  A(253, eq(rn(LT,"PassThrIncNatureLTCG"), rn(LT,"PassThrIncNatureLTCGUs112A12_5Per")+rn(LT,"PassThrIncNatureLTCG12_5Per")),
    "Schedule CG: B10 (pass-through LTCG) must equal B10(a1) (@12.5% u/s 112A) plus B10(a2) (@12.5% other than u/s 112A).");
  /* A254 — D1e = D(1a + 1b + 1c + 1d): Table-D total = Σ over the 54D/54EC/54G/54GA claim tables. */
  A(254, eq(rn(CG,"DeducClaimInfo.TotDeductClaim"),
      ["DeducClaimDtlsUs54D","DeducClaimDtlsUs54EC","DeducClaimDtlsUs54G","DeducClaimDtlsUs54GA"]
        .reduce((a,k)=>a+arr(RG(CG,"DeducClaimInfo."+k,[])).reduce((b,r)=>b+N((r||{}).AmtDeducted),0),0)),
    "Schedule CG: Table D total deduction claimed (D1e) must equal the sum of the section totals D1a (54D) + D1b (54EC) + D1c (54G) + D1d (54GA).");

  /* A255 — E(i7): LTCG-@DTAA-rate gain of current year = B11b. */
  A(255, eq(rn(CE,"InLtcgDTAARate.CurrYearIncome"), Math.max(0, rn(LT,"TotalAmtTaxUsDTAALtcg"))),
    "Schedule CG (Table E): the current-year LTCG taxable at DTAA rates must equal B11b (LTCG claimed chargeable at special rates under a DTAA).");
  /* A256 — E(ii): same LTCG-@DTAA-rate bucket = B11b, second Table-E copy. */
  A(256, eq(rn(CE,"InLtcgDTAARate.CurrYearIncome"), Math.max(0, rn(LT,"TotalAmtTaxUsDTAALtcg"))),
    "Schedule CG (Table E): the current-year LTCG taxable at DTAA rates must equal B11b.");

  /* A257 — A1(aiii): full value u/s 50C = if A1(aii) ≤ 1.10 × A1(ai) then A1(ai) else A1(aii). */
  A(257, arr(RG(ST,"SaleofLandBuild.SaleofLandBuildDtls",[])).every(p=>{
      const ai=rn(p,"FullConsideration"), aii=rn(p,"PropertyValuation");
      return eq(rn(p,"FullConsideration50C"), (aii>ai*1.10)?aii:ai);}),
    "Schedule CG: A1(aiii) full value u/s 50C must be A1(ai) when the stamp value A1(aii) does not exceed 1.10 × A1(ai), otherwise A1(aii).");
  /* A258 — B1(aiii): full value u/s 50C = if B1(aii) ≤ 1.10 × B1(ai) then B1(ai) else B1(aii). */
  A(258, ltLand.every(p=>{
      const ai=rn(p,"FullConsideration"), aii=rn(p,"PropertyValuation");
      return eq(rn(p,"FullConsideration50C"), (aii>ai*1.10)?aii:ai);}),
    "Schedule CG: B1(aiii) full value u/s 50C must be B1(ai) when the stamp value B1(aii) does not exceed 1.10 × B1(ai), otherwise B1(aii).");
});
