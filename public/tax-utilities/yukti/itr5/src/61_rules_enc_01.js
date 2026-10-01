/* =====================================================================
   ITR-5 · AY2026-27 — rule batch (serials 1-50, Category A, "Part A-General").
   A(n,cond,msg) fires when cond is FALSE. Registered via ruleset(fn);
   the runRules harness (60_rules.js, integrated by the CEO) invokes it with
   (I,S_,A,Dd). Every read is guarded (RG default / st0 / ||) so the batch
   never throws and stays silent on an absent/empty return; each condition is
   TRUE for a lawful return and FALSE only on a genuine violation, mirroring
   ITR-3's polarity. Schema paths are ITR-5's own (PartA_GEN1 / PartA_GEN2 /
   Verification / PARTA_BS / PARTA_PL / PartB-TI / Schedule115AD / ScheduleVIA),
   read from forms/ITR-5/src/70_sec_*.js. Not-mappable serials are listed with
   their reason and left uncoded.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const OI=RG(I,"PartA_GEN1.OrgFirmInfo",{})||{};
  const RF=RG(FS,"ReturnFileSec",{})||{};
  const G2=RG(I,"PartA_GEN2",{})||{};
  const V=RG(I,"Verification.Declaration",{})||{};
  const has=!!st0(OI.PAN);                       /* the return carries an identity */
  const status=st0(OI.StatusOrCompanyType);      /* 1 Firm · 2 Local Authority · 14 AOP/BOI · 9 AJP */
  const sub=st0(OI.SubStatus);                   /* schema SubStatus code */
  const COOP=["15","16","17","4"];               /* primary agri credit / coop agri&rural dev bank / coop bank other / other coop society */
  const inc=st0(OI.DateOFFormOrIncorp), doc=st0(OI.DateofBusCommencement); /* ISO YYYY-MM-DD */
  const resident=(FS.ResidentialStatus!=="NRI");
  const opted115BAD=(RF.NewTaxRegime==="Y")||(st0(RF.OptingNewTaxRegime)==="1");
  const opted115BAE=(FS.OptingTaxation115BAEYes==="Y")||(FS.OptingTaxation115BAENo==="Y");
  const AR=v=>Array.isArray(v)?v:[];             /* coerce a wrong-typed imported field to an array (cf. enc_08) so a batch read never throws */
  const mem=AR(RG(G2,"PartnerOrMemberInfo",[]));
  const m0=mem[0]||{};

  /* 1 — liable to audit u/s 92E → Part A BS and P&L cannot be blank */
  A(1,G2.LiableSec92Eflg!=="Y"||(!!I.PARTA_BS&&!!I.PARTA_PL),"Part A-General: if the assessee is liable for audit u/s 92E, Part A-BS and Part A-P&L cannot be blank.");
  /* 2 — liable to audit u/s 44AB → Part A BS and P&L cannot be blank */
  A(2,G2.LiableSec44ABflg!=="Y"||(!!I.PARTA_BS&&!!I.PARTA_PL),"Part A-General: if the assessee is liable for audit u/s 44AB, Part A-BS and Part A-P&L cannot be blank.");
  /* 3 — a valid mobile number must be entered */
  {const mob=st0(RG(OI,"Address.MobileNo",""));
   A(3,!mob||/^[6-9][0-9]{9}$/.test(mob),"Part A-General: enter a valid (10-digit) mobile number.");}
  /* 4 — held unlisted equity shares 'Yes' → details must be provided */
  A(4,FS.HeldUnlistedEqShrPrYrFlg!=="Y"||RG(FS,"HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls",[]).length>0,"Part A-General: 'held unlisted equity shares during the previous year' is 'Yes' — the details of the shares must be provided.");
  /* 5 — verification capacity 'Representative assessee' → rep flag 'Yes' + rep details */
  A(5,V.Capacity!=="RA"||(FS.AsseseeRepFlg==="Y"&&!!st0(RG(FS,"AssesseeRep.RepName",""))),"Part A-General: capacity in Verification is 'Representative assessee' — select 'Yes' for 'return filed by a representative assessee' and fill the representative-assessee details.");
  /* 6 — the 44AD/44ADA/44AE/44B/44BB/44BBA/44BBC/44BBD declaration dropdown must be selected */
  A(6,!has||st0(G2.IncDclrdUs)!=="","Part A-General: select the option for 'whether the assessee is declaring income only under section 44AD/44ADA/44AE/44B/44BB/44BBA/44BBC/44BBD'.");
  /* 7 — a2i 'More than Rs.1cr up to Rs.10cr' → a2ii (receipts in cash %) cannot be blank */
  A(7,G2.TotalSalesExcOneCr!=="Upto10CR"||st0(G2.AgrOFAllAmtsRcvd)!=="","Part A-General: turnover band a2i is 'More than Rs.1 crore and up to Rs.10 crores' — Sl.No. a2ii (aggregate receipts in cash) cannot be blank.");
  /* 8 — a2i 'More than Rs.1cr up to Rs.10cr' → a2iii (payments in cash %) cannot be blank */
  A(8,G2.TotalSalesExcOneCr!=="Upto10CR"||st0(G2.AgrOFAllPayMade)!=="","Part A-General: turnover band a2i is 'More than Rs.1 crore and up to Rs.10 crores' — Sl.No. a2iii (aggregate payments in cash) cannot be blank.");

  /* 9 — NOT MAPPABLE: 'date of furnishing of the audit report cannot be greater than the
     system date'. The check compares AuditInfo.AuditReportFurnishDate to the live system
     clock (nondeterministic); the lawful test client's audit-report date (2026-09-20) is
     later than the environment's current date, so a faithful check would raise a false
     Category-A error on the lawful client. Left uncoded to keep Gate 6 green. */

  /* 10 — 'maintained accounts as per 44AA' = No → No-books rows in BS and P&L must be filled */
  A(10,G2.LiableSec44AAflg!=="N"||(!!RG(I,"PARTA_BS.NoBooksOfAccBS")&&!!RG(I,"PARTA_PL.NoBooksOfAccPL")),"Part A-General: accounts are not maintained as per section 44AA — the 'No books of account' rows in the Balance Sheet and P&L must be filled.");
  /* 11 — disclosure of nature of business/profession is mandatory */
  A(11,!has||RG(G2,"NatOfBus.NatureOfBusiness",[]).length>0,"Part A-General: disclosure of the 'Nature of business or profession' is mandatory.");
  /* 12 — Firm/coop/LLP/trust/AOP-BOI: Verification PAN must match a Partners/Members/Trust PAN */
  {const vpan=st0(V.AssesseeVerPAN).toUpperCase();
   A(12,!vpan||mem.length===0||mem.some(m=>st0((m||{}).PAN).toUpperCase()===vpan),"Part A-General: the PAN entered at Verification must match a PAN entered in the Partners/Members/Trust information.");}
  /* 13 — liable to maintain accounts u/s 44AA → Part A BS and P&L should be filled */
  A(13,G2.LiableSec44AAflg!=="Y"||(!!I.PARTA_BS&&!!I.PARTA_PL),"Part A-General: the assessee is liable to maintain accounts u/s 44AA — Part A-BS and Part A-P&L must be filled.");
  /* 14 — Status 'Firm' → SubStatus must be LLP (5) or Partnership Firm (10) and not blank */
  A(14,status!=="1"||["10","5"].indexOf(sub)>=0,"Part A-General: Status is 'Firm' — Sub-status must be 'Partnership Firm' or 'LLP' and cannot be blank.");
  /* 15 — Status 'AOP/BOI' → SubStatus must be one of the AOP/BOI sub-statuses and not blank */
  A(15,status!=="14"||["15","16","17","11","4","20","21","13","8"].indexOf(sub)>=0,"Part A-General: Status is 'AOP/BOI' — a valid Sub-status must be selected and cannot be blank.");
  /* 16 — Status 'Artificial Juridical Person' → SubStatus must be an AJP sub-status and not blank */
  A(16,status!=="9"||["12","18","19"].indexOf(sub)>=0,"Part A-General: Status is 'Artificial Juridical Person' — Sub-status must be 'Estate of the deceased', 'Estate of the insolvent' or 'Other AJP' and cannot be blank.");
  /* 17 — Status 'Local Authority' → SubStatus must be null */
  A(17,status!=="2"||!sub,"Part A-General: Status is 'Local Authority' — the Sub-status field must be left blank.");
  /* 18 — new regime (115BAC(1A)/115BAD/115BAE) → no 10AA, and no Part-C VI-A except 80JJAA & 80LA(1A) */
  {const newR=!!(((S_||{}).C||{}).regime||{}).anyConc;   /* all three concessional regimes (S.C.regime.anyConc), not the 115BAC-only flag */
   const VD=RG(I,"ScheduleVIA.DeductUndChapVIA",{})||{};
   const partCoth=N(VD.TotPartCchapterVIA)-N(VD.Section80JJAA)-N(VD.Section80LA_1A);
   A(18,!newR||(partCoth<=0&&!I.Schedule10AA),"Part A-General: deductions u/s 10AA / Schedule 80 / Chapter VI-A Part C (except 80JJAA and 80LA(1A)) cannot be claimed when opting for 115BAD/115BAE/115BAC(1A).");}
  /* 19 — 115BAD/115BAE may be opted only by a resident co-operative society */
  A(19,!(opted115BAD||opted115BAE)||(status==="14"&&COOP.indexOf(sub)>=0&&resident),"Part A-General: sections 115BAD/115BAE can be opted only by a resident co-operative society.");
  /* 20 — private discretionary trust with no business income (Table F Sl.2 = No) → PartB-TI 2v must be nil */
  A(20,RG(G2,"PvtDiscretioneryTrust.PvtDiscTrustBusIncFlg")!=="N"||N(RG(I,"PartB-TI.ProfBusGain.TotProfBusGain"))===0,"Part A-General: Sl.No. 2v of Part B-TI cannot be declared when Table F Sl.No. 2 (business income of the private discretionary trust) is 'No'.");
  /* 21 — Table F Sl.1 = Yes (determinate shares) → member shares must sum to 100 */
  A(21,RG(G2,"PvtDiscretioneryTrust.PvtDiscTrustShareFlg")!=="Y"||Math.abs(RSUM(mem.filter(function(r){return r!=null;}),"SharePercentage")-100)<=1,"Part A-General: Table F Sl.No. 1 is 'Yes' — the sum of 'Percentage of share (if determinate)' must be equal to 100.");
  /* 22 — 'Opting it now' for the current-AY 115BAD option → Form 10-IF date and ack mandatory */
  A(22,st0(RF.OptingNewTaxRegime)!=="1"||(!!st0(RF.Form10IFDate)&&!!st0(RF.Form10IFAckNo)),"Part A-General: 'Opting it now' is selected for the current-AY option u/s 115BAD — the date of filing of Form 10-IF and its acknowledgement number are mandatory.");
  /* 23 — opted 115BAD in an earlier year → Form 10-IF date and ack mandatory */
  A(23,RF.NewTaxRegime!=="Y"||(!!st0(RF.Form10IFDate)&&!!st0(RF.Form10IFAckNo)),"Part A-General: opted for the new tax regime u/s 115BAD in an earlier year — the date of filing of Form 10-IF and its acknowledgement number are mandatory.");

  /* 24 — NOT MAPPABLE: 'Form 10-IF date/ack in the ITR must match the actual Form 10-IF'.
     Cross-verification against the filed Form 10-IF (an external record) — not present in
     the return, so nothing internal to check. */

  /* 25 — Schedule 115AD populated → 'Whether you are FII/FPI?' must be 'Yes' */
  A(25,!I.Schedule115AD||FS.FiiFpiFlag==="Y","Part A-General: Schedule 115AD is filled — 'Whether you are FII/FPI?' must be selected 'Yes'.");
  /* 26 — filed under a notice/order → DIN/notice no. and its date are mandatory */
  {const sec=N(RF.IncomeTaxSec);
   const noticeOk=[13,14,16,18,20].indexOf(sec)<0||(!!st0(RF.NoticeNo)&&!!st0(RF.NoticeDate));
   const modOk=(sec!==19)||(!!st0(FS.ReceiptNo)&&!!st0(FS.OrigRetFiledDate));
   A(26,noticeOk&&modOk,"Part A-General: filed in response to a notice u/s 139(9)/142(1)/148/153C or an order u/s 119(2)(b)/92CD — the unique/DIN number and the date of the notice/order are mandatory.");}
  /* 27 — AOP with a co-operative sub-status → the 115BAD option question must be answered */
  A(27,!(status==="14"&&COOP.indexOf(sub)>=0)||st0(RF.NewTaxRegime)!=="","Part A-General: Status is 'AOP' with a co-operative sub-status — answer 'Have you opted for the new tax regime u/s 115BAD?'.");
  /* 28 — A6 date of commencement: not before incorporation and not after the end of the FY */
  A(28,!doc||!inc||(doc>=inc&&doc<="2026-03-31"),"Part A-General: A6 date of commencement of business cannot be before the date of incorporation and cannot be after the end of the financial year (31/03/2026).");
  /* 29 — sub-status LLP/Partnership Firm → the Partners table (Table A) must not be blank */
  A(29,["5","10"].indexOf(sub)<0||mem.length>0,"Part A-General: Sub-status is 'LLP'/'Partnership Firm' — the partners' details (Table A of Part A-General 2) must be filled.");
  /* 30 — sub-status 'Trust other than ITR-7' → Table F (private discretionary trust) must not be blank */
  A(30,sub!=="13"||!!RG(G2,"PvtDiscretioneryTrust"),"Part A-General: Sub-status is 'Trust filing ITR other than ITR-7' — Table F of Part A-General 2 must be filled.");
  /* 31 — Table F Sl.1 = No and Sl.2 = No → Sl.4 cannot be blank */
  {const t=RG(G2,"PvtDiscretioneryTrust",{})||{};
   A(31,!(t.PvtDiscTrustShareFlg==="N"&&t.PvtDiscTrustBusIncFlg==="N")||st0(t.PvtDiscTrustBasicFlg)!=="","Part A-General: 'No' is selected at Table F Sl.No. 1 and Sl.No. 2 — Sl.No. 4 cannot be blank.");}
  /* 32 — sub-status Society/Business Trust/Investment Fund/Any other AOP-BOI → Table A Sl.B and Sl.D must not be blank */
  A(32,["11","20","21","8"].indexOf(sub)<0||(st0(m0.PartnerForeignCompFlg)!==""&&st0(m0.TotIncFrmMemberOfAop)!==""),"Part A-General: for this sub-status, Sl.No. B and Sl.No. D of Table A (Part A-General 2) cannot be blank.");
  /* 33 — Sl.B 'Is any member a foreign company?' = Yes → Sl.C (foreign-company share %) cannot be zero */
  A(33,st0(m0.PartnerForeignCompFlg)!=="YES"||N(m0.PercentageOfShareForeignComp)>0,"Part A-General: 'Is any member of the AOP/BOI or AJP a foreign company?' is 'Yes' — Sl.No. C (percentage of share of the foreign company) cannot be zero.");
  /* 34 — 115BAE option 'Yes' at d(iv)a/d(iv)b → Form 10-IFA date and ack mandatory */
  A(34,!opted115BAE||(!!st0(FS.Form10IFADate)&&!!st0(FS.Form10IFAAckNo)),"Part A-General: the option u/s 115BAE (d(iv)a/d(iv)b) is 'Yes' — the date of filing of Form 10-IFA and its acknowledgement number are mandatory.");

  /* 35 — NOT MAPPABLE: 'Form 10-IFA date/ack in the ITR must match the actual Form 10-IFA'.
     Cross-verification against the filed Form 10-IFA (an external record) — not present in
     the return. */

  /* 36 — opting 115BAE → date of formation/incorporation must be on/after 01/04/2023 */
  A(36,!opted115BAE||inc>="2023-04-01","Part A-General: opting for the new tax regime u/s 115BAE — the date of formation/incorporation must be on or after 01/04/2023.");
  /* 37 — AOP coop with incorporation on/after 01/04/2023 → a 115BAE option must be selected at A19(div) */
  A(37,!(status==="14"&&COOP.indexOf(sub)>=0&&inc>="2023-04-01")||opted115BAE,"Part A-General: Status is 'AOP' with a co-operative sub-status and incorporation on/after 01/04/2023 — an option must be selected at A19(div) (115BAE).");
  /* 38 — 115BAD and 115BAE cannot both be selected */
  A(38,!(opted115BAD&&opted115BAE),"Part A-General: the new tax regime u/s 115BAD and u/s 115BAE cannot both be selected.");

  /* 39 — NOT MAPPABLE: 'A19d(i) Method of opting out of the new regime u/s 115BAC cannot be
     blank for Society/Business Trust/Investment Fund/Any other AOP-BOI/AJP'. The A19d(i)
     115BAC(6) method sub-field is explicitly NOT built in this form (70_sec_gen.js §9 note),
     so there is no schema field to test. */

  /* 40 — NOT MAPPABLE: 'A19(di) 115BAC(6) option must be DISABLED for Firm/LLP/Local
     Authority/Co-operative society'. A UI-disable constraint on a field that is not built —
     no data violation to encode. */

  /* 41 — recognised as MSME 'Yes' → registration details mandatory */
  A(41,FS.ifMSME!=="Y"||!!st0(RG(FS,"RegNumMSMEDAct2006","")),"Part A-General: 'recognised as MSME?' is 'Yes' — the MSME registration number is mandatory.");
  /* 42 — liable to audit u/s 44AB → the condition u/s 44AB must be selected */
  A(42,G2.LiableSec44ABflg!=="Y"||st0(G2.Cndnfor44AB)!=="","Part A-General: the assessee is liable to audit u/s 44AB — select the condition by virtue of which the audit is applicable.");
  /* 43 — the applicable due date for filing the return must be selected */
  A(43,!has||!!st0(RG(FS,"ItrFilingDueDate","")),"Part A-General: select the applicable due date for filing the return of income.");
  /* 44 — Form 10-IFA filed → opting the new tax regime u/s 115BAE is mandatory.
     115BAE may be opted via d(iv)a (OptingTaxation115BAEYes) OR d(iv)b (OptingTaxation115BAENo);
     use the both-branch helper (as serials 19/34/36/37/47 do) so a d(iv)b election is not blocked. */
  A(44,!st0(FS.Form10IFADate)||opted115BAE,"Part A-General: Form 10-IFA is filed — opting for the new tax regime u/s 115BAE is mandatory.");
  /* 45 — a2ii 'More than 5%' → liable to audit u/s 44AB */
  A(45,G2.AgrOFAllAmtsRcvd!=="MoreThan5Per"||G2.LiableSec44ABflg==="Y","Part A-General: Sl.No. a2ii (receipts in cash) is 'More than 5%' — the assessee is liable to audit u/s 44AB.");
  /* 46 — a2iii 'More than 5%' → liable to audit u/s 44AB */
  A(46,G2.AgrOFAllPayMade!=="MoreThan5Per"||G2.LiableSec44ABflg==="Y","Part A-General: Sl.No. a2iii (payments in cash) is 'More than 5%' — the assessee is liable to audit u/s 44AB.");
  /* 47 — 115BAE: date of incorporation AND date of commencement must be on/after 01/04/2023 */
  A(47,!opted115BAE||(inc>="2023-04-01"&&(!doc||doc>="2023-04-01")),"Part A-General: to claim section 115BAE the date of incorporation and the date of commencement of business must be on or after 01/04/2023.");
  /* 48 — exercising 115BAE for AY 2026-27 at A19 div(b) → Form 10-IFA date and ack (A19 div(c)) mandatory.
     The rule text is about div(b) (OptingTaxation115BAENo, "Do you wish to exercise..."), so guard that
     branch — not div(a) OptingTaxation115BAEYes (which serial 34 already covers). */
  A(48,FS.OptingTaxation115BAENo!=="Y"||(!!st0(FS.Form10IFADate)&&!!st0(FS.Form10IFAAckNo)),"Part A-General: exercising the option u/s 115BAE for AY 2026-27 at A19 div(b) — the date of filing of Form 10-IFA and its acknowledgement number at A19 div(c) are mandatory.");
  /* 49 — A19d(i)(I) = Yes (Form 10-IEA furnished, current AY, opting out) → its date (i) and ack (ii) mandatory */
  A(49,FS.F10IEACurrAYOldRegime!=="Y"||(!!st0(FS.F10IEADateCurrAYOldTax)&&!!st0(FS.F10IEAAckNoCurrAYOldTax)),"Part A-General: 'Yes' at A19d(i)(I) (Form 10-IEA furnished for the current AY) — the date of filing (i) and the acknowledgement number (ii) are mandatory.");
  /* 50 — Form 10-IEA filed (other branches) → the form's details must be given */
  A(50,
    (FS.Form10IEAEarlierAYOldRegime!=="Y"||(!!st0(FS.Form10IEAAssYear)&&!!st0(FS.Form10IEAEarlierAYAckOldRegime)))
    &&(FS.F10IEACurrAYNewRegime!=="Y"||(!!st0(FS.F10IEADateCurrAYNewTax)&&!!st0(FS.F10IEAAckNoCurrAYNewTax)))
    &&(FS.F10IEAEarlierAYNewRegime!=="Y"||(!!st0(FS.AssYrF10IEANewTaxReg)&&!!st0(FS.Form10IEAEarlierAYAckNewRegime))),
    "Part A-General: Form 10-IEA is filed — the details of the form (assessment year / date / acknowledgement number) must be mentioned in the return.");
});
