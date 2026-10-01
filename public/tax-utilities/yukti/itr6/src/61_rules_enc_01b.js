/* =====================================================================
   Batch enc_01b (Phase 6 fan-out): the 8 ENFORCED Category-A serials the
   first block deferred — cross-schedule / derivation-heavy. Registered as
   a SECOND disjoint ruleset(fn); runRules() runs it with (I,S_,A,Dd) too.
   Same discipline as the first block: A(n,cond,msg) blocks when cond (the
   "return is lawful" assertion) is FALSE; every read guarded (RG/N/(X||{}))
   so nothing throws; zero-skeleton / empty return stays silent. Keys from
   sources/ITR-6 schema, books/ITR-6/{BALANCE_SHEET,OS,IF}.md and the built
   sections 70_sec_{who,gen,os,other,accounts}. Encoded from each rule's own
   text (constitution rule 6).

   Serial-vs-text note (honest): rules.json A54 literally reads
   "2Ciii = 2C(i+ii)", but the first block already encodes 2Ciii
   (TradeReceivables) as A53 and 2Eiii (short-term loans) as A55, so the two
   genuinely-uncovered current-asset sub-totals are 2Aviii (current
   investments, 7-way) and 2Dv (cash & cash equivalents, 4-way). Both this
   assignment and the first block's own deferral note (lines 21-22) designate
   A52 = 2Aviii and A54 = 2Dv; encoding A54 as 2Ciii would only duplicate A53,
   so A54 is encoded as the 2Dv cash foot to fill the real gap.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" */

  /* ---- Part A General reads (same blocks the first batch uses) ---- */
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const G2=RG(I,"PartA_GEN2For6",{})||{};
  const due=String(FS.ItrFilingDueDate==null?"":FS.ItrFilingDueDate);
  const a2i=G2.TotalSalesExcOneCr, a2ii=G2.AgrOFAllAmtsRcvd, a2iii=G2.AgrOFAllPayMade;
  /* "audit details in Part A Gen present" — any statutory audit flagged. */
  const auditDetails = G2.LiableSec92Eflg==="Y" || G2.LiableSec44ABflg==="Y" || G2.AccountAuditFlag==="Y";
  /* Schedule IF (interest in / partner of a firm) actually filled. */
  const ifFilled = !!I.ScheduleIF && (RG(I,"ScheduleIF.PartnerFirmDetails",[])||[]).length>0;

  /* A29 — a2i = "More than ₹1cr up to ₹10cr" and either a2ii or a2iii shows
     cash in excess of 5% ("No" to the ≤5% test) ⇒ liable to audit u/s 44AB. */
  A(29, !(a2i==="Upto10CR" && (a2ii==="MoreThan5Per" || a2iii==="MoreThan5Per")) || G2.LiableSec44ABflg==="Y",
    "Part A General: with a2i 'More than ₹1 crore and up to ₹10 crores' and either a2ii or a2iii showing cash over 5%, you are liable to audit u/s 44AB — set the 44AB flag to Yes.");

  /* A33 — due date 30-Nov selected ⇒ Schedule IF must be filled OR audit
     details must be present in Part A General. */
  A(33, due!=="2026-11-30" || ifFilled || auditDetails,
    "Part A General: when the due date 30th November is selected, Schedule IF or the audit details in Part A General must be filled.");

  /* A34 — audit details u/s 92E present ⇒ the due date cannot be 31-Oct
     (the 92E/TP case carries the 30-Nov due date). */
  A(34, G2.LiableSec92Eflg!=="Y" || due!=="2026-10-31",
    "Part A General: audit u/s 92E is filled but the due date is 31st October or extended — the 92E case carries the 30th November due date.");

  /* A36 — a2i = "More than ₹1cr up to ₹10cr" and a2ii (receipts in cash)
     "More than 5%" ⇒ liable to audit u/s 44AB. */
  A(36, !(a2i==="Upto10CR" && a2ii==="MoreThan5Per") || G2.LiableSec44ABflg==="Y",
    "Part A General: with a2i 'More than ₹1 crore and up to ₹10 crores' and a2ii (receipts in cash) 'More than 5%', you are liable to audit u/s 44AB — set the 44AB flag to Yes.");

  /* A37 — a2i = "More than ₹1cr up to ₹10cr" and a2iii (payments in cash)
     "More than 5%" ⇒ liable to audit u/s 44AB. */
  A(37, !(a2i==="Upto10CR" && a2iii==="MoreThan5Per") || G2.LiableSec44ABflg==="Y",
    "Part A General: with a2i 'More than ₹1 crore and up to ₹10 crores' and a2iii (payments in cash) 'More than 5%', you are liable to audit u/s 44AB — set the 44AB flag to Yes.");

  /* A39 — any income offered under section 115AD(1)(i) in Schedule OS ⇒
     "Whether you are FII/FPI?" must be Yes. */
  const OSi=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};
  const AD1I=["5AD1i","5AD1iP","5AD1iDiv"];                 /* 115AD(1)(i) source/DTAA codes */
  const AD1IP=["PTI_5AD1i","PTI_5AD1iP","PTI_5AD1iDiv"];    /* pass-through variants */
  const hasCode=(rows,f,codes)=>(rows||[]).some(r=>r&&codes.indexOf(String(r[f]))>=0);
  const os115ADi =
      hasCode(OSi.OthersGrossDtls,"SourceDescription",AD1I) ||
      hasCode(OSi.PTIOthersGrossDtls,"SourceDescription",AD1IP) ||
      hasCode(RG(OSi,"IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS",[]),"SecITAct",AD1I.concat(AD1IP)) ||
      N(OSi.DividendIncUs115AD1iDiv)>0;
  A(39, !os115ADi || FS.FiiFpiFlag==="Y",
    "Part A General: 'Whether you are FII / FPI?' must be Yes to offer income under section 115AD(1)(i) in Schedule OS.");

  /* =====================================================================
     Part A — BALANCE SHEET (regular, PARTA_BSFor6FrmAY13): the two
     current-asset sub-totals the first batch deferred. REQ(a,b) is
     |a−b| ≤ 1; a zero-skeleton foots 0==0 so an empty return never fires.
     Keys/formulae from books/ITR-6/BALANCE_SHEET.md.
     ===================================================================== */
  const CA=RG(I,"PARTA_BSFor6FrmAY13.Assets.CurrentAssets",{})||{};

  /* A52 — 2Aviii Total current investments = 2A(ic + ii + iii + iv + v + vi + vii). */
  const CI=RG(CA,"CurrInvstmnts",{})||{};
  A(52, REQ(CI.TotCurrInvstmnts, N(RG(CI,"EquityInstruments.Total"))+N(CI.PreferenceShares)
      +N(CI.GovtOrTrustSecurities)+N(CI.DebenturesOrBonds)+N(CI.MutualFunds)
      +N(CI.InvstmntInPrtnrShipFirm)+N(CI.OtherInvstmnts)),
    "Part A-BS: 2Aviii (total current investments) must equal 2A(ic + ii + iii + iv + v + vi + vii).");

  /* A54 — 2Dv Total cash and cash equivalents = 2D(i + ii + iii + iv). */
  const CE=RG(CA,"CashNCashEquivalents",{})||{};
  A(54, REQ(CE.TotCashNCashEquivalents, N(CE.BalWithBanks)+N(CE.ChequesDrafts)
      +N(CE.CashInHand)+N(CE.Others)),
    "Part A-BS: 2Dv (total cash and cash equivalents) must equal 2D(i + ii + iii + iv).");
});
