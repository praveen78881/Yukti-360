/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, encoding batch 18.
   Serials 745–781 (books/ITR-5/rules.json), covering Schedule PTI (745–749),
   Schedule TPSA (750–756), Schedule 115TD (757–763), Schedule FSI (764–770),
   Schedule TR (771–776), Schedule FA (777–778), Schedule GST (779–780) and
   Part B-TI item 2 (781).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) FIRES when cond (the "lawful" assertion) is FALSE.
   Reads are guarded (RG / arr / ||{}); nothing throws; every block guards to
   a no-op when the schedule is absent. Schema keys come from
   forms/ITR-5/src/70_sec_other.js (expOther: SchedulePTI / ScheduleTPSA /
   Schedule115TD / ScheduleGST), 70_sec_foreign.js (expForeign: ScheduleFSI /
   ScheduleTR1 / ScheduleFA), 70_sec_gen.js (ResidentialStatus) and
   70_sec_tax.js (PartB-TI.ProfBusGain), cross-checked against the books and
   each schedule's compute engine.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const arr=v=>Array.isArray(v)?v:[];
  const isISO=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||""));
  /* system-date proxy for offline validation (challan cannot be future-dated) */
  const TD=new Date();
  const TODAY=TD.getFullYear()+"-"+String(TD.getMonth()+1).padStart(2,"0")+"-"+String(TD.getDate()).padStart(2,"0");
  /* residential status gate: "RES" | "NRI" — Mid(1,2)="NR" ⇒ non-resident */
  const res=String(RG(I,"PartA_GEN1.FilingStatus.ResidentialStatus","RES"));
  const nri=res.slice(0,2).toUpperCase()==="NR";

  /* ===================================================================
     SCHEDULE PTI  (745–749)  — I.SchedulePTI.SchedulePTIDtls[]
     Columns: 7 AmountOfInc · 8 CurrYrLossShareByInvstFund (HP & CG only) ·
     9 NetIncomeLoss · 10 TDSAmount.  Sub-blocks:
       IncFromHP (i) · CapitalGainsPTI.{ShortTermCG(iia)=STCG_Sec111A(ai)+
       STCG_Others(aii); LongTermCG(iib)=LTCG_Sec112A(bi)+LTCG_Others(bii)} ·
       {IncOthSrc(iii)=OS_Dividend(a)+OS_Others(b)} ·
       IncClmdPTI.{TotalSec23FBB(iv)=Sec23FBB(a)+SecB(b)+SecC(c)}.
     =================================================================== */
  if(I.SchedulePTI){
    /* 745: Col.9 (net) = Col.7 (amount) − Col.8 (loss share) on every line */
    const net9=(blk,lbl)=>{ if(!blk||typeof blk!=="object")return;
      A(745,REQ(N(blk.NetIncomeLoss),N(blk.AmountOfInc)-N(blk.CurrYrLossShareByInvstFund)),
        "Schedule PTI"+lbl+"Col.9 (net income/loss) must equal Col.7 (amount of income) − Col.8 (current-year loss share of the investment fund)."); };
    /* 746/747: a 4-column CG subtotal must equal the sum of its two leaf lines */
    const sub4=(agg,parts,S,lbl)=>{ const g=agg||{};
      A(S,REQ(N(g.AmountOfInc),RSUM(parts,"AmountOfInc"))&&
          REQ(N(g.CurrYrLossShareByInvstFund),RSUM(parts,"CurrYrLossShareByInvstFund"))&&
          REQ(N(g.NetIncomeLoss),RSUM(parts,"NetIncomeLoss"))&&
          REQ(N(g.TDSAmount),RSUM(parts,"TDSAmount")),lbl); };
    /* 748/749: a 3-column subtotal (no loss column) = sum of its leaf lines */
    const sub3=(agg,parts,S,lbl)=>{ const g=agg||{};
      A(S,REQ(N(g.AmountOfInc),RSUM(parts,"AmountOfInc"))&&
          REQ(N(g.NetIncomeLoss),RSUM(parts,"NetIncomeLoss"))&&
          REQ(N(g.TDSAmount),RSUM(parts,"TDSAmount")),lbl); };

    arr(RG(I,"SchedulePTI.SchedulePTIDtls",[])).forEach(function(b,i){b=b||{};
      const L=" (block "+(i+1)+"): ";
      const cg=b.CapitalGainsPTI||{}, x=b.IncClmdPTI||{};
      /* 745 — over every sub-block carrying the three money columns */
      net9(b.IncFromHP,L+"[i House property] ");
      net9(cg.ShortTermCG,L+"[iia Short-term CG] "); net9(cg.STCG_Sec111A,L+"[iia(i) 111A] "); net9(cg.STCG_Others,L+"[iia(ii) Others] ");
      net9(cg.LongTermCG,L+"[iib Long-term CG] "); net9(cg.LTCG_Sec112A,L+"[iib(i) 112A] "); net9(cg.LTCG_Others,L+"[iib(ii) Others] ");
      net9(b.IncOthSrc,L+"[iii Other sources] "); net9(b.OS_Dividend,L+"[iii(a) Dividend] "); net9(b.OS_Others,L+"[iii(b) Others] ");
      net9(x.TotalSec23FBB,L+"[iv Income claimed exempt] "); net9(x.Sec23FBB,L+"[iv(a) 10(23FBB)] ");
      /* 746: iia Short-term = ai + aii */
      sub4(cg.ShortTermCG,[cg.STCG_Sec111A,cg.STCG_Others].filter(Boolean),746,
        "Schedule PTI"+L+"item iia (Short-term capital gains) must equal the sum of ai (u/s 111A) and aii (others).");
      /* 747: iib Long-term = bi + bii */
      sub4(cg.LongTermCG,[cg.LTCG_Sec112A,cg.LTCG_Others].filter(Boolean),747,
        "Schedule PTI"+L+"item iib (Long-term capital gains) must equal the sum of bi (u/s 112A) and bii (others).");
      /* 748: iii Other sources = a + b */
      sub3(b.IncOthSrc,[b.OS_Dividend,b.OS_Others].filter(Boolean),748,
        "Schedule PTI"+L+"item iii (Income from other sources) must equal the sum of a (dividend) and b (others).");
      /* 749: iv Income claimed exempt = a + b + c */
      const exParts=[x.Sec23FBB,RG(x,"SecBIncExmptDtl.SecBCIncExmptDtl",null),RG(x,"SecCIncExmptDtl.SecBCIncExmptDtl",null)].filter(Boolean);
      sub3(x.TotalSec23FBB,exParts,749,
        "Schedule PTI"+L+"item iv (Income claimed to be exempt) must equal the sum of a + b + c.");
    });
  }

  /* ===================================================================
     SCHEDULE TPSA  (750–756)  — I.ScheduleTPSA
     1 AmtPrimaryAdjUs92CE_2A · 2a AdditionalIncTax18PercAbove ·
     2b Surcharge12Perc · 2c HealthEducationCess · 2d TotalAdditionalTax ·
     3 TaxesPaid · 4 NetTaxPayable · DtlsTaxesPaid[].{Amount,DateDep}.
     =================================================================== */
  if(I.ScheduleTPSA){const T=I.ScheduleTPSA;
    const adj=N(T.AmtPrimaryAdjUs92CE_2A), tax18=N(T.AdditionalIncTax18PercAbove),
          sur=N(T.Surcharge12Perc), cess=N(T.HealthEducationCess), tot=N(T.TotalAdditionalTax),
          paid=N(T.TaxesPaid);
    /* 750: 2a additional income-tax = 18% of the primary adjustment (Sl.1) */
    A(750,REQ(tax18,0.18*adj),"Schedule TPSA: the additional income-tax at Sl.2a must be 18% of the amount of primary adjustment at Sl.1.");
    /* 751: 2b surcharge = 12% of the additional income-tax */
    A(751,REQ(sur,0.12*tax18),"Schedule TPSA: the surcharge at Sl.2b must be 12% of the additional income-tax payable at Sl.2a.");
    /* 752: 2c health & education cess = 4% of (2a + 2b) */
    A(752,REQ(cess,0.04*(tax18+sur)),"Schedule TPSA: the health & education cess at Sl.2c must be 4% of (additional income-tax payable + surcharge).");
    /* 753: 2d = 2a + 2b + 2c */
    A(753,REQ(tot,tax18+sur+cess),"Schedule TPSA: the total at Sl.2d must equal the sum of 2a + 2b + 2c.");
    /* 754: 3 (taxes paid) = sum of the amounts deposited by challan */
    A(754,REQ(paid,RSUM(arr(RG(T,"DtlsTaxesPaid",[])),"Amount")),"Schedule TPSA: the tax deposited at Sl.3 must equal the sum of the challan amounts entered.");
    /* 755: 4 net tax payable = 2d − 3 (nil if negative) */
    A(755,REQ(N(T.NetTaxPayable),Math.max(0,tot-paid)),"Schedule TPSA: the net tax payable at Sl.4 must equal Sl.2d − Sl.3.");
    /* 756: a challan deposit date cannot be after the system date */
    arr(RG(T,"DtlsTaxesPaid",[])).forEach(function(c,i){c=c||{};
      A(756,!isISO(c.DateDep)||String(c.DateDep)<=TODAY,"Schedule TPSA challan "+(i+1)+": the date on which tax was deposited cannot be after the current (system) date.");
    });
  }

  /* ===================================================================
     SCHEDULE 115TD  (757–763)  — I.Schedule115TD
     1 FMVTotTrustInst · 2 LessTotLiaTrustInst · 3 NetValAsst ·
     4i FMVAsstAcqrdRfrdSec101 · 4ii FMVAsstAcqPeriodFromDateCrtn ·
     4iii FMVAsstTrnfsrdSec115TD2 · 4iv FMVTotal · 5 LiabilityRespectofAsset4Above ·
     6 AccretedIncomeSection115TD · 7 AddIncPay115TDMarginalRate ·
     8 InterestPayable115TE · 9 SpecifiedDateUs115TD · 10 AddIncIntstPayb ·
     11 TaxIntstPaid · 12 NetPaybleRefble.
     =================================================================== */
  if(I.Schedule115TD){const D5=I.Schedule115TD;
    const netVal=N(D5.NetValAsst), fmvTot=N(D5.FMVTotal), assetLiab=N(D5.LiabilityRespectofAsset4Above),
          accreted=N(D5.AccretedIncomeSection115TD), tot10=N(D5.AddIncIntstPayb), paid11=N(D5.TaxIntstPaid);
    /* 757: 3 net value of assets = 1 − 2 (nil if negative) */
    A(757,REQ(netVal,Math.max(0,N(D5.FMVTotTrustInst)-N(D5.LessTotLiaTrustInst))),"Schedule 115TD: the net value of assets at Sl.3 must equal Sl.1 − Sl.2.");
    /* 758: 4iv total = 4i + 4ii + 4iii */
    A(758,REQ(fmvTot,Math.max(0,N(D5.FMVAsstAcqrdRfrdSec101)+N(D5.FMVAsstAcqPeriodFromDateCrtn)+N(D5.FMVAsstTrnfsrdSec115TD2))),"Schedule 115TD: the total at Sl.4(iv) must equal the sum of 4i + 4ii + 4iii.");
    /* 759: 6 accreted income = 3 − (4iv − 5) (nil if negative) */
    A(759,REQ(accreted,Math.max(0,netVal-(fmvTot-assetLiab))),"Schedule 115TD: the accreted income at Sl.6 must equal Sl.3 − (Sl.4 − Sl.5).");
    /* 760: 12 net payable/refundable = 10 − 11 (rounded up to nearest 10, nil if negative) */
    const d=tot10-paid11, exp12=d>0?Math.ceil(d/10)*10:0;
    A(760,REQ(N(D5.NetPaybleRefble),exp12),"Schedule 115TD: the net payable/refundable at Sl.12 must equal Sl.10 − Sl.11.");
    /* 761: accreted income declared ⇒ the specified date u/s 115TD (Sl.9) is mandatory */
    A(761,accreted<=0||String(RG(D5,"SpecifiedDateUs115TD","")||"")!=="","Schedule 115TD: accreted income u/s 115TD is entered but the specified date u/s 115TD at Sl.9 is blank.");
    /* 763: accreted income declared ⇒ tax on it must be computed (Sl.7 > 0) */
    A(763,accreted<=0||N(D5.AddIncPay115TDMarginalRate)>0,"Schedule 115TD: accreted income is entered in the return but the additional income-tax at maximum marginal rate (Sl.7) is not computed on the same.");
  }

  /* ===================================================================
     SCHEDULE FSI  (764–770)  — I.ScheduleFSI.ScheduleFSIDtls[]  (resident only)
     Per country: IncFromHP / IncFromBusiness / IncCapGain / IncOthSrc, each
     {IncFrmOutsideInd(b), TaxPaidOutsideInd(c), TaxPayableinInd(d),
      TaxReliefinInd(e)}, plus TotalCountryWise (=SUM of the four heads).
     =================================================================== */
  if(I.ScheduleFSI){
    const fsi=arr(RG(I,"ScheduleFSI.ScheduleFSIDtls",[]));
    /* 765: FSI is available only to residents */
    A(765,!nri||fsi.length===0,"Schedule FSI is not applicable to a non-resident, but foreign-income rows are present.");
    fsi.forEach(function(cr,i){cr=cr||{};
      const cc=String(cr.CountryCodeExcludingIndia||cr.CountryName||("#"+(i+1)));
      const heads=[["IncFromHP","House property"],["IncFromBusiness","Business/Profession"],["IncCapGain","Capital gains"],["IncOthSrc","Other sources"]];
      /* 764: per head, tax relief (e) = lower of tax paid outside India (c) and tax payable in India (d) */
      heads.forEach(function(h){const o=cr[h[0]]||{};
        A(764,REQ(N(o.TaxReliefinInd),Math.min(N(o.TaxPaidOutsideInd),N(o.TaxPayableinInd))),"Schedule FSI (country "+cc+", "+h[1]+"): the tax relief available (Col.e) must be the lower of the tax paid outside India (Col.c) and the tax payable on such income in India (Col.d).");
      });
      /* 766: Total row (b,c,d,e) = sum of the four head rows (i+ii+iii+iv) */
      const sumCol=k=>heads.reduce((a,h)=>a+N((cr[h[0]]||{})[k]),0);
      const t=cr.TotalCountryWise||{};
      A(766,REQ(N(t.IncFrmOutsideInd),sumCol("IncFrmOutsideInd"))&&
            REQ(N(t.TaxPaidOutsideInd),sumCol("TaxPaidOutsideInd"))&&
            REQ(N(t.TaxPayableinInd),sumCol("TaxPayableinInd"))&&
            REQ(N(t.TaxReliefinInd),sumCol("TaxReliefinInd")),
        "Schedule FSI (country "+cc+"): the Total row must equal the sum of Sl.(i+ii+iii+iv) for columns b, c, d and e.");
    });
  }

  /* ===================================================================
     SCHEDULE TR  (771–776)  — I.ScheduleTR1  (resident only)
     ScheduleTR[]: CountryCodeExcludingIndia · TaxPaidOutsideIndia(1c) ·
       TaxReliefOutsideIndia(1d) · ReliefClaimedUsSection(1e: 90/90A/91).
     TotalTaxReliefOutsideIndia · TaxReliefOutsideIndiaDTAA(2) ·
     TaxReliefOutsideIndiaNotDTAA(3).
     =================================================================== */
  if(I.ScheduleTR1){const TR=I.ScheduleTR1;
    const rows=arr(RG(TR,"ScheduleTR",[]));
    const sec=r=>String((r&&r.ReliefClaimedUsSection)||"");
    /* 771: Sl.2 (relief where DTAA applies) = Σ Col.1d where section is 90 / 90A */
    A(771,REQ(N(TR.TaxReliefOutsideIndiaDTAA),rows.filter(r=>sec(r)==="90"||sec(r)==="90A").reduce((a,r)=>a+N(r.TaxReliefOutsideIndia),0)),"Schedule TR: the total tax relief at Sl.2 (country where DTAA applies) must equal the total of Col.1(d) where the section at Col.1(e) is 90 or 90A.");
    /* 772: Sl.3 (relief where DTAA does not apply) = Σ Col.1d where section is 91 */
    A(772,REQ(N(TR.TaxReliefOutsideIndiaNotDTAA),rows.filter(r=>sec(r)==="91").reduce((a,r)=>a+N(r.TaxReliefOutsideIndia),0)),"Schedule TR: the total tax relief at Sl.3 (country where DTAA does not apply) must equal the total of Col.1(d) where the section at Col.1(e) is 91.");
    /* 773: Sl.2 + Sl.3 = total of Col.1d */
    A(773,REQ(N(TR.TaxReliefOutsideIndiaDTAA)+N(TR.TaxReliefOutsideIndiaNotDTAA),RSUM(rows,"TaxReliefOutsideIndia")),"Schedule TR: Sl.2 + Sl.3 must equal the total of Col.1(d) (tax relief available).");
    /* 774: TR is available only to residents */
    A(774,!nri||rows.length===0,"Schedule TR is not applicable to a non-resident, but tax-relief rows are present.");
    /* 775/776: country-wise, TR Col.c/Col.d must tie to Schedule FSI Col.c/Col.e totals */
    const fsi=arr(RG(I,"ScheduleFSI.ScheduleFSIDtls",[]));
    if(I.ScheduleFSI){
      rows.forEach(function(r,i){r=r||{};
        const cc=String(r.CountryCodeExcludingIndia||"");
        if(!cc)return;
        const f=fsi.find(x=>x&&String(x.CountryCodeExcludingIndia||"")===cc);
        if(!f)return;   /* no matching FSI country → no-op */
        const ft=f.TotalCountryWise||{};
        /* 775: TR Col.c (taxes paid outside India) = FSI Total Col.c for that country */
        A(775,REQ(N(r.TaxPaidOutsideIndia),N(ft.TaxPaidOutsideInd)),"Schedule TR (country "+cc+"): the total taxes paid outside India (Col.c) must equal the total of Col.c of Schedule FSI for that country.");
        /* 776: TR Col.d (tax relief available) = FSI Total Col.e for that country */
        A(776,REQ(N(r.TaxReliefOutsideIndia),N(ft.TaxReliefinInd)),"Schedule TR (country "+cc+"): the total tax relief available (Col.d) must equal the total of Col.e of Schedule FSI for that country.");
      });
    }
  }

  /* ===================================================================
     SCHEDULE GST  (779–780)  — I.ScheduleGST.TurnoverGrsRcptForGSTIN[]
     Row: GSTINNo · AmtTurnGrossRcptGSTIN.
     =================================================================== */
  if(I.ScheduleGST){
    arr(RG(I,"ScheduleGST.TurnoverGrsRcptForGSTIN",[])).forEach(function(r,i){r=r||{};
      const g=String(r.GSTINNo||"");
      /* 780: an outward-supplies turnover is entered ⇒ the GSTIN is mandatory */
      A(780,N(r.AmtTurnGrossRcptGSTIN)<=0||(g!==""&&g!=="NA"),"Schedule GST (row "+(i+1)+"): the annual value of outward supplies is filled, so the GSTIN No. is mandatory.");
    });
  }

  /* ===================================================================
     PART B-TI item 2  (781)  — I["PartB-TI"].ProfBusGain
     2i ProfGainNoSpecBus · 2ii ProfGainSpecBus · 2iii ProfGainSpecifiedBus ·
     2iv IncChrgblTaxSplRate · 2v TotProfBusGain (=MAX(0, 2i+2ii+2iii+2iv)).
     =================================================================== */
  if(I["PartB-TI"]){
    const P=RG(I,"PartB-TI.ProfBusGain",{})||{};
    A(781,REQ(N(P.TotProfBusGain),Math.max(0,N(P.ProfGainNoSpecBus)+N(P.ProfGainSpecBus)+N(P.ProfGainSpecifiedBus)+N(P.IncChrgblTaxSplRate))),"Part B-TI: the total at item 2v must equal the sum of 2i + 2ii + 2iii + 2iv (nil if the sum is a loss).");
  }

  /* ---- NOT MAPPABLE (reported, not encoded) ------------------------
     762 — "Part B-TTI Sr.12 (Net tax payable on 115TD income incl. interest
           u/s 115TE) should match Sr.12 of Schedule 115TD." The PartB_TTI
           schema does carry TaxPaid.NetTaxPayable115TD, but the owning
           exporter (70_sec_tax.js) never populates it — it writes no 115TD
           leaf under PartB_TTI. A cross-check would read 0 on the PartB_TTI
           side and false-fire on every lawful 115TD return of this build.
     767 — "FSI house-property income should be the minimum amount of income
           shown in Sl.1k+3 under the head house property." Garbled directional
           fragment ("minimum amount income shown"); requires reconstructing a
           cross-schedule head total from ScheduleHP; would false-fire.
     768 — "FSI business income should be the minimum income shown in (Sl.D of
           Trading Account + positive Sl.14 of P&L)." Same: garbled fragment,
           cross-schedule (TradingAccount + PARTA_PL) aggregation not reliably
           reconstructable offline; would false-fire.
     769 — "FSI capital-gains income cannot be less than income under the head
           capital gains." Directionality is reversed/garbled (foreign income
           is a subset, cannot exceed the head total) and it needs the whole
           ScheduleCG head figure; not a clean offline assertion.
     770 — "FSI other-sources income cannot be less than income under the head
           other sources." Same reversed/garbled fragment; cross-schedule head
           total; would false-fire.
     777 — Schedule FA: "must be filled if Sl.17 of Part B-TTI is Yes." Foreign-
           asset disclosure driven by the PartB-TTI residency question — a
           portal/AIS-style holding determination; the FA-present test spans ten
           optional arrays. Left to the portal per batch guidance.
     778 — Schedule FA: "complete details of foreign assets should be provided."
           No checkable assertion (completeness of foreign-asset disclosure is
           an AIS/portal check); no single schema field to test.
     779 — Schedule GST: "if GSTIN is filled the outward-supplies turnover is
           mandatory." After export the turnover is a numeric that defaults to
           0, so a blank turnover is indistinguishable from a genuine nil
           turnover — the presence check cannot be verified offline and would
           false-fire on a lawful nil-turnover GSTIN. (The complementary rule
           780, turnover ⇒ GSTIN, IS encoded, since a blank GSTIN survives as a
           detectable "NA"/empty placeholder.)
     ------------------------------------------------------------------ */
});
