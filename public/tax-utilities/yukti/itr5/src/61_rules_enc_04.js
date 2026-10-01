/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, batch enc_04 (Phase 6).
   Serials 151-200 of books/ITR-5/rules.json (Category A).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires when cond (the "valid" assertion) is FALSE.
   Every read is guarded (RG / (X||{})); nothing throws. Every cond is
   TRUE when the block/data is absent or the rule is not applicable, so
   the batch is a no-op on an empty return and never fires on lawful data.
   Paths from forms/ITR-5/src/70_sec_pl.js (PARTA_PL / TradingAccount),
   70_sec_oi.js (PARTA_OI), 70_sec_hp.js (ScheduleHP), 70_sec_gen.js
   (PartA_GEN1/GEN2), 70_sec_bp.js (ScheduleICDS).
   NOTE ITR-5 P&L numbering differs from ITR-3: 62=44AD, 63=44ADA,
   64=44AE, 65=no-account, 66=speculative, 67=non-resident.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};

  /* general-info reads for the status/audit conditions */
  const OF=RG(I,"PartA_GEN1.OrgFirmInfo",{})||{};
  const FS=RG(I,"PartA_GEN1.FilingStatus",{})||{};
  const resFirm=OF.StatusOrCompanyType==="1"&&OF.SubStatus==="10"&&FS.ResidentialStatus==="RES"; /* resident partnership firm */
  const aud44AB=RG(I,"PartA_GEN2.LiableSec44ABflg","")==="Y";

  /* 44AA(1) professions + general commission agent (09005) — 44AD barred codes.
     Same barred set as the ITR-3 encoding (books' 44AD business-code table). */
  const BAR44AD=["09005","14001","14002","14003","14004","14006","14008","16001","16002","16003","16004","16005","16007","16008","16009","16013","16018","16020","16021",
    "18001","18002","18003","18004","18005","18010","18011","18012","18013","18014","18015","18016","18017","18018","18019","18020","20010","20011","20012"];

  /* ================================================================
     PART A — P&L ACCOUNT  (serials 151-179)
     ================================================================ */
  if(I.PARTA_PL){
    const pl=I.PARTA_PL;
    const AD=RG(pl,"PersumptiveInc44AD",{})||{};
    const ADA=RG(pl,"PersumptiveInc44ADA",{})||{};
    const NB=RG(pl,"NoBooksOfAccPL",{})||{};
    const BD=RG(pl,"DebitsToPL.DebitPlAcnt.BadDebtDtls",{})||{};

    /* 151 — presumptive income u/s 44AD / 44ADA only by a resident partnership firm */
    A(151,!(N(AD.TotPersumptiveInc44AD)||N(ADA.TotPersumptiveInc44ADA))||resFirm,
      "Part A-P&L: presumptive business income u/s 44AD / 44ADA can be claimed only by a resident partnership firm.");

    /* 152 — 44AD not applicable to general commission agents / 44AA(1) professions */
    A(152,!(RG(pl,"NatOfBus44AD",[])||[]).some(r=>BAR44AD.indexOf(String((r||{}).CodeAD||""))>=0),
      "Part A-P&L: section 44AD is not applicable to general commission agents (code 09005) or professions referred in section 44AA(1) — remove that code from the 44AD business table.");

    /* 153 — 65(i)d (business net profit) = 65(i)b − 65(i)c (nil if negative) */
    A(153,REQ(NB.NetProfit,Math.max(0,N(NB.GrossProfit)-N(NB.Expenses))),
      "Part A-P&L: no-account business net profit (65(i)d) must equal gross profit (65(i)b) minus expenses (65(i)c).");
    /* 154 — 65(ii)d (profession net profit) = 65(ii)b − 65(ii)c (nil if negative) */
    A(154,REQ(NB.NetProfitPrf,Math.max(0,N(NB.GrossProfitPrf)-N(NB.ExpensesPrf))),
      "Part A-P&L: no-account profession net profit (65(ii)d) must equal gross profit (65(ii)b) minus expenses (65(ii)c).");
    /* 155 — 65(i)b cannot be more than 65(i)a */
    A(155,N(NB.GrossProfit)<=N(NB.GrossReceipt)+1,
      "Part A-P&L: no-account business gross profit (65(i)b) cannot be more than gross receipts (65(i)a).");
    /* 156 — 65(ii)b cannot be more than 65(ii)a */
    A(156,N(NB.GrossProfitPrf)<=N(NB.GrossReceiptPrf)+1,
      "Part A-P&L: no-account profession gross profit (65(ii)b) cannot be more than gross receipts (65(ii)a).");
    /* 157 — 65(i)a gross receipts = 65(i)a(i) + 65(i)a(ii) */
    A(157,REQ(NB.GrossReceipt,N(NB.GrsRcptAccPayeeOrBankMode)+N(NB.GrsRcptOtherMode)),
      "Part A-P&L: no-account business gross receipts (65(i)a) must equal 65(i)a(i) + 65(i)a(ii).");
    /* 158 — 65(ii)a gross receipts = 65(ii)a1 + 65(ii)a2 */
    A(158,REQ(NB.GrossReceiptPrf,N(NB.GrsRcptAccPayeeOrBankModePrf)+N(NB.GrsRcptOtherModePrf)),
      "Part A-P&L: no-account profession gross receipts (65(ii)a) must equal 65(ii)a1 + 65(ii)a2.");
    /* 159 — 65 total profit = 65(i)d + 65(ii)d */
    A(159,REQ(NB.TotBusinessProfession,N(NB.NetProfit)+N(NB.NetProfitPrf)),
      "Part A-P&L: no-account total profit (65) must equal 65(i)d + 65(ii)d.");
    /* 160 — 66iv net speculative income = 66ii − 66iii */
    A(160,REQ(pl.NetIncomeFrmSpecActivity,N(pl.GrossProfit)-N(pl.Expenditure)),
      "Part A-P&L: net income from speculative activity (66iv) must equal gross profit (66ii) minus expenditure (66iii).");

    /* 161 — 64iii (salary/remuneration to partners) can be > 0 only if 64ii (44AE presumptive income) > 0 */
    A(161,N(pl.SalRemrtnToPartnerFirm)<=0||N(pl.TotalPrsumptvIncGCUs44E)>0,
      "Part A-P&L: salary/remuneration to partners at 64(iii) cannot be greater than zero unless presumptive income u/s 44AE at 64(ii) is greater than zero.");

    /* 162 — PAN or Aadhaar mandatory in 48(i) for every bad-debt row that carries an amount */
    A(162,(RG(BD,"BadDebtAmtDtls",[])||[]).every(r=>!N((r||{}).Amount)||st0((r||{}).PAN)!==""||st0((r||{}).Aadhaar)!==""),
      "Part A-P&L: PAN or Aadhaar is mandatory at 48(i) for each bad-debt row whose amount is filled.");

    /* 163 — registration numbers in the 44AE (64) goods-carriage table must be unique */
    (function(){const regs=(RG(pl,"GoodsDtlsUs44AE",[])||[]).map(r=>st0((r||{}).RegNumberGoodsCarriage).toUpperCase()).filter(x=>x!=="");
      A(163,regs.length===new Set(regs).size,
        "Part A-P&L: the registration number of each goods carriage in the 44AE table (64) must be unique.");})();

    /* 164 — business sales > Rs.10 cr or profession receipts > Rs.50 lakh -> liable to audit u/s 44AB.
       (from the Trading Account: 4A(iv) business sales, 4B profession receipts.) */
    if(I.TradingAccount){const trd=I.TradingAccount;
      A(164,!(N(trd.SalesGrossReceiptsTotal)>100000000||N(trd.GrossRcptFromProfession)>5000000)||aud44AB,
        "Part A-P&L: business sales/gross receipts exceed Rs.10 crore or profession gross receipts exceed Rs.50 lakh — 'liable for audit u/s 44AB' must be Yes.");
    }

    /* 165 — 46 + 64iii must equal Col 9 (point E) + Col 6 (point A) remuneration of Part A General-2 */
    if(I.PartA_GEN2){
      const eRem=RSUM(RG(I,"PartA_GEN2.PartnerOrMemberInfo",[])||[],"RemunerationPaid");           /* point E, Col 9 */
      const aRem=RSUM(RG(I,"PartA_GEN2.PrevYrMemPart.PrevYrMemPartDtls",[])||[],"RemunerationpaidAmt"); /* point A, Col 6 (retiring) */
      A(165,REQ(N(RG(pl,"DebitsToPL.DebitPlAcnt.SalRemuneration"))+N(pl.SalRemrtnToPartnerFirm),eRem+aRem),
        "Part A-P&L: 46 + 64(iii) (salary/remuneration to partners) must equal the remuneration in Part A General-2 (point E Col 9 + point A Col 6 retiring partner).");
    }

    /* 166 — bad-debt breakup consistent with the total: 48iv = 48i + 48ii + 48iii */
    A(166,REQ(BD.BadDebt,N(BD.BadDebtAmtDtlsTotal)+N(BD.OthersPANNotAvlblDtlTotal)+N(BD.OthersAmtLt1Lakh)),
      "Part A-P&L: total bad debt (48iv) must equal 48i + 48ii + 48iii.");

    /* 167 — 63i gross receipts u/s 44ADA = 63ia + 63ib + 63ic */
    A(167,REQ(ADA.GrsReceipt,N(ADA.GrsTrnOverBank44ADA)+N(ADA.GrsTotalTrnOverInCash44ADA)+N(ADA.GrsTrnOverAnyOthMode44ADA)),
      "Part A-P&L: gross receipts u/s 44ADA (63i) must equal 63ia + 63ib + 63ic.");

    /* 168 — 44ADA receipts > Rs.50 lakh with cash+other-mode > 5% of total -> audit u/s 44AB mandatory */
    (function(){const gr=N(ADA.GrsReceipt),other=N(ADA.GrsTotalTrnOverInCash44ADA)+N(ADA.GrsTrnOverAnyOthMode44ADA);
      A(168,!(gr>5000000&&other>0.05*gr)||aud44AB,
        "Part A-P&L: gross receipts u/s 44ADA exceed Rs.50 lakh and cash + other-mode receipts exceed 5% of total — tax audit u/s 44AB is mandatory.");})();
    /* 169 — 44AD receipts > Rs.2 cr with cash+other-mode > 5% of total -> audit u/s 44AB mandatory */
    (function(){const gr=N(AD.GrsTrnOverOrReceipt),other=N(AD.GrsTotalTrnOverInCash)+N(AD.GrsTrnOverAnyOthMode);
      A(169,!(gr>20000000&&other>0.05*gr)||aud44AB,
        "Part A-P&L: gross receipts u/s 44AD exceed Rs.2 crore and cash + other-mode receipts exceed 5% of total — tax audit u/s 44AB is mandatory.");})();
    /* 170 — 44ADA receipts > Rs.75 lakh -> audit u/s 44AB mandatory */
    A(170,!(N(ADA.GrsReceipt)>7500000)||aud44AB,
      "Part A-P&L: gross receipts u/s 44ADA exceed Rs.75 lakh — tax audit u/s 44AB is mandatory.");
    /* 171 — 44AD receipts > Rs.3 cr -> audit u/s 44AB mandatory */
    A(171,!(N(AD.GrsTrnOverOrReceipt)>30000000)||aud44AB,
      "Part A-P&L: gross receipts u/s 44AD exceed Rs.3 crore — tax audit u/s 44AB is mandatory.");

    /* 172 — 48(i) and 48(ii) must equal the sum of the amount column of their detail tables */
    A(172,REQ(BD.BadDebtAmtDtlsTotal,RSUM(RG(BD,"BadDebtAmtDtls",[])||[],"Amount"))
        &&REQ(BD.OthersPANNotAvlblDtlTotal,RSUM(RG(BD,"OthersPANNotAvlblDtl",[])||[],"Amount")),
      "Part A-P&L: bad debts 48(i) and 48(ii) must each equal the sum of the amount column of their detail tables.");

    /* 173 / 175 / 176 / 177 / 178 — non-resident (67) minimum net-profit percentages by section */
    (function(){const rows=RG(pl,"NonResidentPLDetails",[])||[];
      const floorPct=(sec,pct)=>rows.filter(r=>(r||{}).Section===sec).every(r=>N(r.NetProfit)>=Math.floor(pct*N(r.GrossReceipt))-1);
      A(173,floorPct("44BBD",0.25),"Part A-P&L: under section 44BBD the net profit (67ii) cannot be less than 25% of gross receipts/turnover (67i).");
      A(175,floorPct("44B",0.075),"Part A-P&L: under section 44B the net profit (67ii) cannot be less than 7.5% of gross receipts/turnover (67i).");
      A(176,floorPct("44BB",0.10),"Part A-P&L: under section 44BB the net profit (67ii) cannot be less than 10% of gross receipts/turnover (67i).");
      A(177,floorPct("44BBA",0.05),"Part A-P&L: under section 44BBA the net profit (67ii) cannot be less than 5% of gross receipts/turnover (67i).");
      A(178,floorPct("44BBC",0.20),"Part A-P&L: under section 44BBC the net profit (67ii) cannot be less than 20% of gross receipts/turnover (67i).");
      /* 174 — 67(ii) net profit cannot be more than 67(i) turnover (each row and the total) */
      A(174,rows.every(r=>N((r||{}).NetProfit)<=N((r||{}).GrossReceipt)+1)
          &&N(RG(pl,"NonResidentPL.NetProfit"))<=N(RG(pl,"NonResidentPL.GrossReceipt"))+1,
        "Part A-P&L: net profit at 67(ii) cannot be more than the gross receipts/turnover at 67(i).");
    })();

    /* 179 — bad debtors without PAN/Aadhaar and amount > Rs.1 lakh need name and address */
    A(179,(RG(BD,"OthersPANNotAvlblDtl",[])||[]).every(r=>{r=r||{};
        return !(N(r.Amount)>100000)||(st0(r.Name)!==""&&st0(r.AreaLocality)!==""&&st0(r.TownCityDistrict)!==""&&st0(r.StateCode)!=="");}),
      "Part A-P&L: name and address are mandatory for a bad debtor with no PAN/Aadhaar where the amount exceeds Rs.1 lakh (48ii).");
  }

  /* ================================================================
     PART A — OI  (serials 180-191)
     ================================================================ */
  if(I.PARTA_OI){
    const oi=I.PARTA_OI;
    const SUMK=(base,keys)=>keys.reduce((a,k)=>a+N(RG(oi,base+"."+k)),0);
    const OI5  =["Section28Items","ProformaCreditsDue","PrevYrEscalClaim","OthItemInc","CapReceipt"];                                   /* 5a..5e */
    const OI36 =["StkInsurPrem","EmpHealthInsurPrem","EmpBonusCommSum","IntOnBorrCap","ZeroCoupBondDisc","RecogPFContribAmt","AppSuperAnnFundAmt","PensionSchemeSec80CCD","AppGratFundAmt","OthFundAmt","EmpContributionCredits","BadDebtDoubtAmt","BadDebtDoubtProvn","SpecResrvTranfr","FamPlanPromoExp","SecuritiesPaidAmt","MrktLossOthExpLossICDS","ExpGovtApprovedSugarPrice","AnyOthDisallowance"]; /* 6a..6s */
    const OI37 =["CapitalNatureExp","PersonalExp","BusOrProfessnExp","PoliticPartyExp","LawVoilatPenalExp","OthPenalFineExp","OffenceExp","ContigentLiability","OthAmtNotAllowUs37"]; /* 7a..7i */
    const OI40 =["NonCompChapXVIIBAmt","NonComp40aiiChapXVIIBAmt","NonComp40aibChapXVIIBAmt","NonComp40aiiiChapXVIIBAmt","TaxAmtOnProfits","WTAmt","RolyatyOrServiceFee","IntSalBonPartner","AnyOthDisallowance"]; /* 8Aa..8Ai */
    const OI40A=["AmtPaidUs40A2b","AmtGT20kCash","ProvPmtGrat","ContToSetupTrust","AnyOthDisallowance"];                                /* 9a,9b,9c,9d,9f — 9e has no schema leaf */
    const OI43B=["TaxDutyCesAmt","ContToEmpPFSFGF","EmpBonusComm","IntPayaleToFI","SumPayaleLoanBrToFinComp","IntPayaleToFISchBank","LeaveEncashPayable","RailwayAsstsPyble","MSEPayable"]; /* 10a..10h / 11a..11h */
    const OI12 =["UnionExciseDuty","ServiceTax","VATorSaleTax","CentralGoodServiceTax","StateGoodServiceTax","IntegratedGoodServiceTax","UnionTerrGoodServiceTax","OthDutyTaxCess"]; /* 12a..12h */

    /* 180 — OI 3a = Schedule ICDS column XI(3) (total increase in profit).
       3a is a read-only cell the engine feeds from Schedule ICDS across a
       cross-section seam; checked only when 3a is itself populated, so the
       rule flags a wrong entered value without firing where the seam has not
       yet fed the cell (an engine-seam gap, not a lawful-data violation). */
    if(I.ScheduleICDS&&N(oi.ProfDeviatDueAcctMeth))
      A(180,REQ(oi.ProfDeviatDueAcctMeth,RG(I,"ScheduleICDS.TotalNetAmtDetl.IncreaseInProfit")),
      "Part A-OI: 3a (increase in profit from ICDS deviation) must equal Schedule ICDS column XI(3).");
    /* 181 — OI 3b = Schedule ICDS column XI(4) (total decrease in profit); same seam guard as 180 */
    if(I.ScheduleICDS&&N(oi.DecProOrIncLossUs145_2))
      A(181,REQ(oi.DecProOrIncLossUs145_2,RG(I,"ScheduleICDS.TotalNetAmtDetl.DecreaseInProfit")),
      "Part A-OI: 3b (decrease in profit from ICDS deviation) must equal Schedule ICDS column XI(4).");

    /* 182 — 5f = 5a + 5b + 5c + 5d + 5e */
    A(182,REQ(RG(oi,"NoCredToPLAmt.TotNoCredToPLAmt"),SUMK("NoCredToPLAmt",OI5)),
      "Part A-OI: 5f must equal the sum of 5a to 5e.");
    /* 183 — 6t = 6a to 6s */
    A(183,REQ(RG(oi,"AmtDisallUs36.TotAmtDisallUs36"),SUMK("AmtDisallUs36",OI36)),
      "Part A-OI: 6t must equal the sum of 6a to 6s.");
    /* 184 — 7j = 7a to 7i */
    A(184,REQ(RG(oi,"AmtDisallUs37.TotAmtDisallUs37"),SUMK("AmtDisallUs37",OI37)),
      "Part A-OI: 7j must equal the sum of 7a to 7i.");
    /* 185 — 8A.j = 8A.a to 8A.i */
    A(185,REQ(RG(oi,"AmtDisallUs40.TotAmtDisallUs40"),SUMK("AmtDisallUs40",OI40)),
      "Part A-OI: 8A.j must equal the sum of 8A.a to 8A.i.");
    /* 186 — 9g = 9a to 9f (9e is not fileable — no schema leaf; the checkable sum is 9a+9b+9c+9d+9f) */
    A(186,REQ(RG(oi,"AmtDisallUs40A.TotAmtDisallUs40A"),SUMK("AmtDisallUs40A",OI40A)),
      "Part A-OI: 9g must equal the sum of 9a to 9f."); /* not mappable: 9e (40A(13)) has no schema leaf — excluded from the sum */
    /* 187 — 10 total = 10a to 10h */
    A(187,REQ(RG(oi,"AmtDisallUs43BPyNowAll.AmtUs43B.TotAmtUs43b"),SUMK("AmtDisallUs43BPyNowAll.AmtUs43B",OI43B)),
      "Part A-OI: 10 total must equal the sum of 10a to 10h.");
    /* 188 — 11 total = 11a to 11h */
    A(188,REQ(RG(oi,"AmtDisall43B.AmtUs43B.TotAmtUs43b"),SUMK("AmtDisall43B.AmtUs43B",OI43B)),
      "Part A-OI: 11 total must equal the sum of 11a to 11h.");
    /* 189 — 12i = 12a to 12h */
    A(189,REQ(RG(oi,"AmtExciseCustomsVATOutstanding.ExciseCustomsVAT.TotExciseCustomsVAT"),SUMK("AmtExciseCustomsVATOutstanding.ExciseCustomsVAT",OI12)),
      "Part A-OI: 12i (total outstanding) must equal the sum of 12a to 12h.");

    /* 190 — item 17 (option u/s 92CE(2A)) = Yes -> Schedule TPSA must be filled */
    A(190,oi.ScheduleTPSAFlg!=="Yes"||!!I.ScheduleTPSA,
      "Part A-OI: option u/s 92CE(2A) at item 17 is Yes — Schedule TPSA must be filled.");

    /* 191 — 13 (deemed profits u/s 33AB / 33ABA / 33AC) = 13a + 13b + 13c */
    A(191,REQ(oi.DeemedProfUs33ABs,N(oi.DeemedProfUs33AB)+N(oi.DeemedProfUs33ABA)+N(oi.DeemedProfUs33AC)),
      "Part A-OI: 13 (amounts deemed profits u/s 33AB / 33ABA / 33AC) must equal 13a + 13b + 13c.");
  }

  /* ================================================================
     SCHEDULE HP  (serials 192-200) — per property in PropertyDetails
     ================================================================ */
  if(I.ScheduleHP){
    const props=RG(I,"ScheduleHP.PropertyDetails",[])||[];
    props.forEach(function(p,i){p=p||{};const rd=RG(p,"Rentdetails",{})||{};const L="Schedule HP property "+(i+1)+": ";
      const coowned=p.PropCoOwnedFlg==="YES";
      const own=N(p.AssessePercentShareProp);
      const coShare=RSUM(RG(p,"CoOwners",[])||[],"PercentShareProperty");

      /* 192 — 1g = 30% of 1f */
      A(192,REQ(rd.ThirtyPercentOfBalance,Math.max(0,Math.round(0.30*N(rd.AnnualOfPropOwned)))),
        L+"the 30% standard deduction (1g) must equal 30% of the annual value of the property owned (1f).");
      /* 193 — co-owned: own share + co-owners' share = 100% */
      A(193,!coowned||REQ(own+coShare,100),
        L+"for a co-owned property the assessee's share plus the co-owners' shares must equal 100%.");
      /* 194 — co-owned: 1f = own% x 1e (annual value) */
      A(194,!coowned||REQ(rd.AnnualOfPropOwned,Math.max(0,Math.round((own/100)*N(rd.BalanceALV)))),
        L+"for a co-owned property the annual value of the property owned (1f) must equal the assessee's percentage share of the annual value (1e).");
      /* 195 — no interest on borrowed capital when the co-owned share is zero */
      A(195,!(coowned&&own===0)||N(rd.IntOnBorwCap)===0,
        L+"interest on borrowed capital cannot be claimed when the assessee's share of the co-owned property is zero.");
      /* 196 — no municipal tax when gross rent/lettable value is zero */
      A(196,N(rd.AnnualLetableValue)>0||N(rd.LocalTaxes)===0,
        L+"municipal (local) tax cannot be claimed when the gross rent received/receivable/lettable value (1a) is zero.");
      /* 198 — let-out / deemed let-out property must have a non-zero gross rent/lettable value */
      A(198,(p.ifLetOut!=="Y"&&p.ifLetOut!=="D")||N(rd.AnnualLetableValue)>0,
        L+"a let-out or deemed let-out property cannot have a zero gross rent received/receivable/lettable value (1a).");
      /* 199 — 1e (annual value) = 1a − 1d (nil if negative) */
      A(199,REQ(rd.BalanceALV,Math.max(0,N(rd.AnnualLetableValue)-N(rd.TotalUnrealizedAndTax))),
        L+"the annual value (1e) must equal 1a minus 1d.");
      /* 200 — 1d = 1b + 1c */
      A(200,REQ(rd.TotalUnrealizedAndTax,N(rd.RentNotRealized)+N(rd.LocalTaxes)),
        L+"the total of unrealised rent and local taxes (1d) must equal 1b + 1c.");
    });

    /* 197 — total income of house property = Σ (1k of each property) + pass-through income */
    A(197,REQ(RG(I,"ScheduleHP.TotalIncomeChargeableUnHP"),
        RSUM(props,p=>RG(p,"Rentdetails.IncomeOfHP"))+N(RG(I,"ScheduleHP.PassThroghIncome"))),
      "Schedule HP: the total income from house property must equal the sum of the individual property values (1k) plus pass-through income.");
  }
});
