/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, batch enc_08 (Phase 6).
   Serials 351-400 from books/ITR-5/rules.json — Schedule CG (Part A STCG,
   Part B LTCG, Table D deductions, Table E set-off matrix, Table F quarter
   accrual) and its BFLA reconciliation.

   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires when cond (the "valid" assertion) is FALSE. Every
   read is guarded (RG / (X||{}) / AR); nothing throws. Every cond is TRUE
   when the data is absent or the head is not built, so the batch no-ops on
   an empty return and never fires on a lawful one (verified against
   tests/ITR-5/state.js).

   Item labels vs schema: the rules document uses the utility's expanded CG
   numbering (A2c, A3ib(v), A5(a)(ic), B1biv, Eviii, …); the ITR-5 build
   collapses these into the ScheduleCG schema keys studied in
   forms/ITR-5/src/70_sec_cg.js (export) and 70_sec_loss.js (BFLA). The
   arithmetic is encoded against those keys. Sources: ITR-5 only.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const CG=RG(I,"ScheduleCG",null);
  if(!CG||typeof CG!=="object")return;                 /* guard: CG head not filed → nothing to check */
  const ST=RG(CG,"ShortTermCapGain",{})||{};
  const LT=RG(CG,"LongTermCapGain",{})||{};
  const AR=x=>Array.isArray(x)?x:[];
  /* the section-48 five-line total (bi+bii+biii+biv = bv); biia (with-indexation)
     is N/A for a firm/AOP/BOI, so bv is the four-term non-indexed sum. */
  const sec48Sum=o=>{o=o||{};return N(o.Reduction48iii)+N(o.AquisitCost)+N(o.ImproveCost)+N(o.ExpOnTrans);};
  /* e-line = IF(balance<0, balance, MAX(0, balance − exemption)) — the utility's own formula */
  const eLine=(bal,ex)=>N(bal)<0?N(bal):Math.max(0,N(bal)-N(ex));

  /* ================= PART A — SHORT-TERM CAPITAL GAINS ================= */

  /* 351 — A2c (STCG from slump sale) = 2aiii − 2b */
  const slST=RG(ST,"SlumpSaleInStcg",null);
  if(slST&&typeof slST==="object")
    A(351,REQ(slST.CapgainonAssets,N(slST.FullConsideration)-N(slST.NetWorthOfDivision)),"Schedule CG: A2c (STCG from slump sale) must equal 2aiii − 2b.");

  /* 352-354 — A3 equity/MF-on-STT sub-heads (EquityMFonSTT[], max 2) */
  AR(RG(ST,"EquityMFonSTT",[])).forEach(function(row,i){if(!row)return;
    const d=RG(row,"EquityMFonSTTDtls",{})||{},d48=RG(d,"DeductSec48",{})||{},L="Schedule CG A3 sub-head "+(i+1)+": ";
    A(352,REQ(d48.TotalDedn,sec48Sum(d48)),L+"the section-48 total bv (A3ibv) must equal bi + bii + biii + biv.");
    A(353,REQ(d.BalanceCG,N(d.FullConsideration)-N(d48.TotalDedn)),L+"balance A3i(c) must equal full consideration − total deductions u/s 48.");
    A(354,REQ(d.CapgainonAssets,N(d.BalanceCG)+N(d.LossSec94of7Or94of8)),L+"A3ie must equal 3ic + 3id (loss disallowed u/s 94(7)/94(8)).");
  });

  /* 355-359 — A5 non-resident FII securities u/s 115AD (NRISecur115AD) */
  const a5=RG(ST,"NRISecur115AD",null);
  if(a5&&typeof a5==="object"){const d48=RG(a5,"DeductSec48",{})||{};
    A(355,REQ(a5.FullValueConsdSec50CA,Math.max(N(a5.FullValueConsdRecvUnqshr),N(a5.FairMrktValueUnqshr))),"Schedule CG: A5(a)(ic) full value u/s 50CA must be the higher of a(ia) unquoted consideration or a(ib) FMV.");
    A(356,REQ(a5.FullConsideration,N(a5.FullValueConsdSec50CA)+N(a5.FullValueConsdOthUnqshr)),"Schedule CG: A5(aiii) total consideration must equal a(ic) + a(ii).");
    A(357,REQ(d48.TotalDedn,sec48Sum(d48)),"Schedule CG: A5(bv) total deductions u/s 48 must equal bi + bii + biii + biv.");
    A(358,REQ(a5.BalanceCG,N(a5.FullConsideration)-N(d48.TotalDedn)),"Schedule CG: A5c balance must equal aiii − bv.");
    A(359,REQ(a5.CapgainonAssets,N(a5.BalanceCG)+N(a5.LossSec94of7Or94of8)),"Schedule CG: A5e must equal 5c + 5d.");
  }

  /* 360-363 — A6 other assets (SaleOnOtherAssets); A6g/A6e are out of this slice */
  const a6=RG(ST,"SaleOnOtherAssets",null);
  if(a6&&typeof a6==="object"){const d48=RG(a6,"DeductSec48",{})||{};
    A(360,REQ(a6.FullValueConsdSec50CA,Math.max(N(a6.FullValueConsdRecvUnqshr),N(a6.FairMrktValueUnqshr))),"Schedule CG: A6(a)(ic) full value u/s 50CA must be the higher of a(ia) or a(ib).");
    A(361,REQ(a6.FullConsideration,N(a6.FullValueConsdSec50CA)+N(a6.FullValueConsdOthUnqshr)),"Schedule CG: A6aiii total consideration must equal a(ic) + a(ii).");
    A(362,REQ(d48.TotalDedn,sec48Sum(d48)),"Schedule CG: A6(bv) total deductions u/s 48 must equal bi + bii + biii + biv.");
    A(363,REQ(a6.BalanceCG,N(a6.FullConsideration)-N(d48.TotalDedn)),"Schedule CG: A6c balance must equal aiii − bv.");
  }

  /* 364 — A7 amount deemed to be STCG = Σ(unutilized prev-yr) + 7b + 7c */
  A(364,REQ(RG(ST,"TotalAmtDeemedStcg"),RSUM(AR(RG(ST,"UnutilizedCg.UnutilizedCgPrvYrDtls",[])),"AmtUnutilized")+N(RG(ST,"AmtDeemedStcg"))+N(RG(ST,"AmtDeemedStcg45iv"))),"Schedule CG: A7 (amount deemed to be STCG) must equal ΣaXi..aXiii + 7b + 7c.");

  /* 365 — A8 pass-through STCG = A8a(@20%) + A8b(@30%) + A8c(applicable) */
  A(365,REQ(RG(ST,"PassThrIncNatureSTCG"),N(RG(ST,"PassThrIncNatureSTCG20Per"))+N(RG(ST,"PassThrIncNatureSTCG30Per"))+N(RG(ST,"PassThrIncNatureSTCGAppRate"))),"Schedule CG: A8 (pass-through STCG) must equal A8a + A8b + A8c.");

  /* ================= PART B — LONG-TERM CAPITAL GAINS ================= */

  /* 366-368 — B1 land/building (per property). biia (with-indexation) folds into
     bv because indexation is N/A for a firm/AOP/BOI (AquisitCostIndex = AquisitCost). */
  AR(RG(LT,"SaleofLandBuild.SaleofLandBuildDtls",[])).forEach(function(d,i){if(!d)return;const L="Schedule CG B1 property "+(i+1)+": ";
    A(366,REQ(d.TotalDedn,sec48Sum(d)),L+"total deductions u/s 48 (B1biv) must equal bi + bii + biii + biv.");
    A(367,REQ(d.Balance,N(d.FullConsideration50C)-N(d.TotalDedn)),L+"balance B1c must equal aiii − biv.");
    A(368,REQ(d.CapgainonAssets,eLine(d.Balance,RG(d,"ExemptionOrDednUs54.ExemptionGrandTotal"))),L+"B1e must equal 1c − 1d.");
  });

  /* 369-370 — B2 slump sale LTCG (SlumpSaleInLtcgDtls.SlumpSaleInLtcg) */
  const slLT=RG(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg",null);
  if(slLT&&typeof slLT==="object"){
    A(370,REQ(slLT.SlumpBalance,N(slLT.FullConsideration)-N(slLT.NetWorthOfDivision)),"Schedule CG: B2c balance must equal 2aiii − 2b.");
    A(369,REQ(slLT.CapgainonAssets,eLine(slLT.SlumpBalance,slLT.DeductionUnderSec54)),"Schedule CG: B2e must equal 2c − 2d.");
  }

  /* 371-372 — B3 listed securities / ZCB u/s 112(1) (Proviso112Applicable) */
  const b3=RG(LT,"Proviso112Applicable.Proviso112Applicabledtls",null);
  if(b3&&typeof b3==="object"){const d48=RG(b3,"DeductSec48",{})||{};
    A(371,REQ(d48.TotalDedn,sec48Sum(d48)),"Schedule CG: B3(bv) total deductions u/s 48 must equal bi + bii + biii + biv.");
    A(372,REQ(b3.BalanceCG,N(b3.FullConsideration)-N(d48.TotalDedn)),"Schedule CG: B3c balance must equal 3a − bv.");
  }

  /* 373 — B4 LTCG u/s 112A = total of column 14 of Schedule 112A.
     No `if(I.Schedule112A)` guard: a return that reports B4 (LTCG u/s 112A) while
     OMITTING Schedule 112A must fail. RG defaults an absent Schedule 112A total to
     0, so B4 must then be 0; a lawful return that carries Schedule 112A keeps
     B4 == col 14 total and stays silent. */
  A(373,REQ(RG(LT,"SaleOfEquityShareUs112A.CapgainonAssets"),RG(I,"Schedule112A.Balance112A")),"Schedule CG: B4 (LTCG u/s 112A) must equal the total of column 14 of Schedule 112A.");

  /* 374-377 — B6 non-resident u/s 112(1)(c)/115AB/115AC/115AD (per sub-block).
     377 is the book's duplicate of 376 (both assert the section-48 total). */
  AR(RG(LT,"NRIOnSec112and115.NRIOnSec112and115Dtls",[])).forEach(function(d,i){if(!d)return;const d48=RG(d,"DeductSec48",{})||{},L="Schedule CG B6 sub-block "+(i+1)+": ";
    A(374,REQ(d.FullValueConsdSec50CA,Math.max(N(d.FullValueConsdRecvUnqshr),N(d.FairMrktValueUnqshr))),L+"a(ic) full value u/s 50CA must be the higher of a(ia) or a(ib).");
    A(375,REQ(d.FullConsideration,N(d.FullValueConsdSec50CA)+N(d.FullValueConsdOthUnqshr)),L+"a(iii) total consideration must equal a(ic) + a(ii).");
    A(376,REQ(d48.TotalDedn,sec48Sum(d48)),L+"bv total deductions u/s 48 must equal bi + bii + biii + biv.");
    A(377,REQ(d48.TotalDedn,sec48Sum(d48)),L+"the section-48 total must equal bi + bii + biii + biv.");
  });

  /* 378 — B7 FII/FPI equity u/s 115AD(1)(b)(iii) proviso = total of col 14 of Sch 115AD.
     No `if(I.Schedule115AD)` guard: a return that reports B7 while OMITTING Schedule
     115AD must fail. RG defaults an absent Schedule 115AD total to 0, so B7 must then
     be 0; a lawful return that carries Schedule 115AD keeps B7 == col 14 total and
     stays silent. */
  A(378,REQ(RG(LT,"NRISaleOfEquityShareUs112A.CapgainonAssets"),RG(I,"Schedule115AD.Balance115AD")),"Schedule CG: B7 (LTCG for FII u/s 115AD(1)(b)(iii) proviso) must equal the total of column 14 of Schedule 115AD.");

  /* 379-383 — B8 assets where B1-B7 not applicable (SaleofAssetNADtls.SaleofAssetNA) */
  const b8=RG(LT,"SaleofAssetNADtls.SaleofAssetNA",null);
  if(b8&&typeof b8==="object"){const d48=RG(b8,"DeductSec48",{})||{};
    A(379,REQ(b8.FullValueConsdSec50CA,Math.max(N(b8.FullValueConsdRecvUnqshr),N(b8.FairMrktValueUnqshr))),"Schedule CG: B8(a)(ic) full value u/s 50CA must be the higher of a(ia) or a(ib).");
    A(380,REQ(b8.FullConsideration,N(b8.FullValueConsdSec50CA)+N(b8.FullValueConsdOthUnqshr)),"Schedule CG: B8 aiii total consideration must equal a(ic) + a(ii).");
    A(381,REQ(d48.TotalDedn,sec48Sum(d48)),"Schedule CG: B8 bv total deductions u/s 48 must equal bi + bii + biii + biv.");
    A(382,REQ(b8.BalanceCG,N(b8.FullConsideration)-N(d48.TotalDedn)),"Schedule CG: B8c balance must equal aiii − bv.");
    A(383,REQ(b8.CapgainonAssets,eLine(b8.BalanceCG,RG(b8,"ExemptionOrDednUs54.ExemptionGrandTotal"))),"Schedule CG: B8e must equal 8c − 8d.");
  }

  /* 384 — B9 amount deemed to be LTCG = Σ(unutilized prev-yr) + b + c */
  A(384,REQ(RG(LT,"TotalAmtDeemedLtcg"),RSUM(AR(RG(LT,"UnutilizedCg.UnutilizedCgPrvYrDtls",[])),"AmtUnutilized")+N(RG(LT,"AmtDeemedLtcg"))+N(RG(LT,"AmtDeemedLtcg45iv"))),"Schedule CG: B9 (amount deemed to be LTCG) must equal ΣaXi..aXiii + b + c.");

  /* 385 — B10 pass-through LTCG = B10a1(@12.5% u/s 112A) + B10a2(@12.5% other) */
  A(385,REQ(RG(LT,"PassThrIncNatureLTCG"),N(RG(LT,"PassThrIncNatureLTCGUs112A12_5Per"))+N(RG(LT,"PassThrIncNatureLTCG12_5Per"))),"Schedule CG: B10 (pass-through LTCG) must equal B10a1 + B10a2.");

  /* ================= TABLE D — DEDUCTION PARTICULARS ================= */
  const DED=RG(CG,"DeducClaimInfo",{})||{};
  const dSum=k=>RSUM(AR(RG(DED,k,[])),"AmtDeducted");

  /* 386 — D1e = Σ amounts deducted u/s 54D + 54EC + 54G + 54GA (Table D) */
  A(386,REQ(DED.TotDeductClaim,dSum("DeducClaimDtlsUs54D")+dSum("DeducClaimDtlsUs54EC")+dSum("DeducClaimDtlsUs54G")+dSum("DeducClaimDtlsUs54GA")),"Schedule CG: D1e must equal the sum of the amounts deducted u/s 54D + 54EC + 54G + 54GA in Table D.");

  /* 397 — deductions claimed u/s 54D/54EC/54G/54GA in the STCG/LTCG heads must
     match the amount disclosed in the respective section of Table D */
  const claim={"54D":0,"54EC":0,"54G":0,"54GA":0};
  const addEx=arr=>{AR(arr).forEach(e=>{if(e&&claim[e.ExemptionSecCode]!==undefined)claim[e.ExemptionSecCode]+=N(e.ExemptionAmount);});};
  AR(RG(ST,"SaleofLandBuild.SaleofLandBuildDtls",[])).forEach(d=>addEx(RG(d,"ExemptionOrDednUs54.ExemptionOrDednUs54Dtls",[])));
  AR(RG(LT,"SaleofLandBuild.SaleofLandBuildDtls",[])).forEach(d=>addEx(RG(d,"ExemptionOrDednUs54.ExemptionOrDednUs54Dtls",[])));
  addEx(RG(ST,"SaleOnOtherAssets.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls",[]));
  addEx(RG(LT,"SaleofAssetNADtls.SaleofAssetNA.ExemptionOrDednUs54.ExemptionOrDednUs54Dtls",[]));
  claim["54EC"]+=N(RG(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg.DeductionUnderSec54"));
  [["54D","DeducClaimDtlsUs54D"],["54EC","DeducClaimDtlsUs54EC"],["54G","DeducClaimDtlsUs54G"],["54GA","DeducClaimDtlsUs54GA"]].forEach(function(x){
    A(397,REQ(claim[x[0]],dSum(x[1])),"Schedule CG: the deduction claimed u/s "+x[0]+" in the STCG/LTCG heads must match the amount in the "+x[0]+" section of Table D.");
  });

  /* ================= TABLE E — SET-OFF OF CURRENT-YEAR LOSSES ================= */
  const CYL=RG(CG,"CurrYrLosses",{})||{};
  const EROWS=["InStcg20Per","InStcg30Per","InStcgAppRate","InStcgDTAARate","InLtcg12_5Per","InLtcgDTAARate"];
  const SOKEYS=["StclSetoff20Per","StclSetoff30Per","StclSetoffAppRate","StclSetoffDTAARate","LtclSetOff12_5Per","LtclSetOffDTAARate"];

  /* 387/388 — no `if(CYL.TotLossSetOff&&CYL.InLossSetOff&&CYL.LossRemainSetOff)` guard:
     a return whose set-off matrix carries loss set-offs in rows ii..vii while OMITTING
     the Eviii (TotLossSetOff) / Eix (LossRemainSetOff) totals must fail. RG defaults
     every absent node to 0, so a return with no set-offs at all keeps colSum == 0 and
     stays silent, and a lawful return that reconciles keeps Eviii == Σ rows and
     Eix == Ei − Eviii and stays silent. */
  SOKEYS.forEach(function(sk){
    const colSum=EROWS.reduce((a,e)=>a+N(RG(CYL,e+"."+sk)),0);
    /* 387 — Eviii (total loss set off, this rate) = Σ of rows ii..vii */
    A(387,REQ(RG(CYL,"TotLossSetOff."+sk),colSum),"Schedule CG Table E: total loss set off ("+sk+") must equal the sum of the set-offs in rows ii to vii.");
    /* 388 — Eix (loss remaining) = Ei (loss to be set off) − Eviii (total loss set off) */
    A(388,REQ(RG(CYL,"LossRemainSetOff."+sk),N(RG(CYL,"InLossSetOff."+sk))-N(RG(CYL,"TotLossSetOff."+sk))),"Schedule CG Table E: loss remaining ("+sk+") must equal the loss to be set off (row i) − the total loss set off (row viii).");
  });

  /* 398 — E8 (remaining gain, col 8) = col 1 (income) − cols 2..7 (losses set off) */
  EROWS.forEach(function(ek){const node=RG(CYL,ek,null);if(!node||typeof node!=="object")return;
    const so=SOKEYS.reduce((a,sk)=>a+N(node[sk]),0);
    A(398,REQ(node.CurrYrCapGain,Math.max(0,N(node.CurrYearIncome)-so)),"Schedule CG Table E: remaining gain (E8, col 8) for "+ek+" must equal current-year income (col 1) − the losses set off (cols 2–7).");
  });

  /* 391 & 395 — Ei5 / Ev (STCG at special DTAA rate) = A9b.
     No `if(CYL.InStcgDTAARate)` guard: a return that discloses STCG chargeable at a
     special DTAA rate at A9b (A ShortTermCapGain.TotalAmtTaxUsDTAAStcg) while OMITTING
     the Table-E DTAA row (InStcgDTAARate) must fail. RG defaults the absent Table-E
     income to 0, so it must then equal a zero A9b; a lawful return that carries the
     DTAA row keeps Ei5 / Ev == A9b and stays silent. */
  A(391,REQ(RG(CYL,"InStcgDTAARate.CurrYearIncome"),N(RG(ST,"TotalAmtTaxUsDTAAStcg"))),"Schedule CG Table E: STCG at special DTAA rate (Ei5) must equal A9b (STCG chargeable at special rates as per DTAA).");
  A(395,REQ(RG(CYL,"InStcgDTAARate.CurrYearIncome"),N(RG(ST,"TotalAmtTaxUsDTAAStcg"))),"Schedule CG Table E: STCG at special DTAA rate (Ev) must equal A9b.");
  /* 392 & 396 — Ei7 / Evii (LTCG at special DTAA rate) = B11b.
     No `if(CYL.InLtcgDTAARate)` guard: a return that discloses LTCG chargeable at a
     special DTAA rate at B11b (LongTermCapGain.TotalAmtTaxUsDTAALtcg) while OMITTING
     the Table-E DTAA row (InLtcgDTAARate) must fail. RG defaults the absent Table-E
     income to 0; a lawful return that carries the DTAA row keeps Ei7 / Evii == B11b
     and stays silent. */
  A(392,REQ(RG(CYL,"InLtcgDTAARate.CurrYearIncome"),N(RG(LT,"TotalAmtTaxUsDTAALtcg"))),"Schedule CG Table E: LTCG at special DTAA rate (Ei7) must equal B11b (LTCG chargeable at special rates as per DTAA).");
  A(396,REQ(RG(CYL,"InLtcgDTAARate.CurrYearIncome"),N(RG(LT,"TotalAmtTaxUsDTAALtcg"))),"Schedule CG Table E: LTCG at special DTAA rate (Evii) must equal B11b.");

  /* 389, 390, 393, 394 — /* not mappable: the rule text (Ei3/Ei4/Eiii/Eiv = the
     30%- and applicable-rate bucket income "as reduced by the amount of STCG
     chargeable or not chargeable to tax at special rates in A9a & A9b included
     therein") is truncated across serial boundaries in rules.json and omits
     contributing heads (A3ie/A3iie). More decisively, the ITR-5 build does not
     represent that "reduced by A9a & A9b" reconciliation as a checkable leaf: the
     utility routes DTAA gains into their own stDTAA/ltDTAA Table-E buckets rather
     than netting them from the 30%/applicable-rate income rows, so any faithful
     encoding of the literal formula would fire on the engine's own lawful output.
     Left un-encoded rather than introduce a false positive. */

  /* ================= TABLE F — ACCRUAL/RECEIPT (vs Schedule BFLA) ================= */
  /* 399/400 — no `if(AF&&I.ScheduleBFLA)` guard: a return that omits EITHER side of
     the cross-check — the Table-F quarter break-up (AccruOrRecOfCG) or Schedule BFLA —
     must fail. RG(AF,..) with AF absent (null) safely returns the default, so qsum is
     0 when Table F is absent, and RG(I,"ScheduleBFLA..") is 0 when BFLA is absent; a
     return with neither STCG head stays silent, and a lawful return that carries both
     keeps the quarter break-up == item 5vii/5viii of BFLA and stays silent. */
  const AF=RG(CG,"AccruOrRecOfCG",null);
  const QK=["Upto15Of6","Upto15Of9","Up16Of9To15Of12","Up16Of12To15Of3","Up16Of3To31Of3"];
  const qsum=k=>{const dr=RG(AF,k+".DateRange",{})||{};return QK.reduce((a,q)=>a+N(dr[q]),0);};
  /* 399 — Table F Sl.2 (STCG @30%) quarter break-up = item 5vii of Schedule BFLA */
  A(399,REQ(qsum("ShortTermUnder30Per"),RG(I,"ScheduleBFLA.STCG30Per.IncBFLA.IncOfCurYrAfterSetOffBFLosses")),"Schedule CG Table F Sl.2: the quarter-wise break-up of STCG @30% must equal item 5vii (STCG @30%) of Schedule BFLA.");
  /* 400 — Table F Sl.3 (STCG applicable rate) quarter break-up = item 5viii of Schedule BFLA */
  A(400,REQ(qsum("ShortTermUnderAppRate"),RG(I,"ScheduleBFLA.STCGAppRate.IncBFLA.IncOfCurYrAfterSetOffBFLosses")),"Schedule CG Table F Sl.3: the quarter-wise break-up of STCG at applicable rates must equal item 5viii (STCG applicable rate) of Schedule BFLA.");
});
