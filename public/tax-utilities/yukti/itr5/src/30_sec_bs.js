/* =====================================================================
   70_sec_bs.js — Balance Sheet · Part A-BS (ITR-5, A.Y. 2026-27)
   Section id "bs", screen position 2, compute order 6. Built ONLY from
   books/ITR-5/BALANCE_SHEET.md and the schema block PARTA_BS (skeleton
   in 10_state.js). ITR-3's 70_sec_bpa.js was studied for SHAPE only;
   every fact, key and formula here is from ITR-5's own book.

   Schema block: PARTA_BS  (root keys FundSrc + FundApply are the required
   regular-books statement; NoBooksOfAccBS is the alternate, not required,
   emitted only when the No-account case carries data).

   ONE file per section (engine + screen + export + import + checks + reg).
   S.bs mirrors PARTA_BS exactly: typed inputs, and engBs writes computed
   totals back onto the same S.bs paths, so S.bs is the single source of
   truth for the renderer's cell()s and for expBs.

   Book facts honoured:
   - All totals computed, green, untypeable (§11.2).
   - Net Block = MAX(Gross − Depreciation, 0), floored at 0 (r42).
   - Five signed fields may be negative (§11.3): PartnerOrMemberCap (1a),
     TotPartnerOrMemberFund (1c), TotFundSrc (5-src), NetCurrAsset (3e),
     TotFundApply (5-apply). Every other field is >= 0.
   - Balancing rule (n=81): Sources of funds (5) must equal Application
     of funds (5).
   - 139(9) trap (§6): both Source-5 and No-account-C zero while Schedule
     BP income > Rs 1.2 lakh -> defective-return warning (cross-schedule).
   - r115 "Provision for Wealth Tax" is HIDDEN and has no schema key —
     NOT built (§10). Provisions carries only ITProvision,
     ELSuperAnnGratProvision, OthProvision, TotProvisions.
   - No dropdowns on this sheet (§7).
   ===================================================================== */

/* ---- state: S.bs mirrors PARTA_BS (seed every container the renderer's
   get() paths and the engine's set() paths walk into) ---- */
S.bs = S.bs || {
  FundSrc:{
    PartnerOrMemberFund:{ ResrNSurp:{} },
    LoanFunds:{ SecrLoan:{ RupeeLoan:{} }, UnsecrLoan:{ RupeeLoan:{} } },
    Advances:{}
  },
  FundApply:{
    FixedAsset:{},
    Investments:{ LongTermInv:{ EquityInstruments:{} }, ShortTermInv:{ EquityInstruments:{} } },
    CurrAssetLoanAdv:{
      CurrAsset:{ Inventories:{}, SundryDebtorDtls:{}, CashOrBankBal:{} },
      LoanAdv:{ LoanAdvIncluded:{} },
      CurrLiabilitiesProv:{ CurrLiabilities:{ SundryCreditorDtls:{} }, Provisions:{} }
    },
    MiscAdjust:{}
  },
  NoBooksOfAccBS:{}
};

/* ================================================================
   eng — every formula tagged with its BALANCE_SHEET cell reference.
   G reads a bs.* figure; St writes a computed total back (rounded int).
   ================================================================ */
function engBs(){
  const G=p=>N(get("bs."+p)), St=(p,v)=>set("bs."+p,R(v));

  /* ----- Part A · Sources of funds (FundSrc) ----- */
  /* 1bvi Total reserves & surplus  L13 = SUM(J8:J12) */
  const resr = G("FundSrc.PartnerOrMemberFund.ResrNSurp.RevResr")
             + G("FundSrc.PartnerOrMemberFund.ResrNSurp.CapResr")
             + G("FundSrc.PartnerOrMemberFund.ResrNSurp.StatResr")
             + G("FundSrc.PartnerOrMemberFund.ResrNSurp.OthResr")
             + G("FundSrc.PartnerOrMemberFund.ResrNSurp.CreditBalOfPLAccount");
  St("FundSrc.PartnerOrMemberFund.ResrNSurp.TotResrNSurp", resr);
  /* 1c Total partners'/members' fund  L14 = TotResrNSurp + PartnerOrMemberCap (signed) */
  const partnerFund = G("FundSrc.PartnerOrMemberFund.PartnerOrMemberCap") + resr;
  St("FundSrc.PartnerOrMemberFund.TotPartnerOrMemberFund", partnerFund);
  /* 2aiiC secured rupee loans  J21 = SUM(J19:J20) */
  const secRupee = G("FundSrc.LoanFunds.SecrLoan.RupeeLoan.FrmBank")
                 + G("FundSrc.LoanFunds.SecrLoan.RupeeLoan.FrmOthrs");
  St("FundSrc.LoanFunds.SecrLoan.RupeeLoan.TotRupeeLoan", secRupee);
  /* 2aiii total secured loans  L22 = ForeignCurrLoan + TotRupeeLoan */
  const secLoan = G("FundSrc.LoanFunds.SecrLoan.ForeignCurrLoan") + secRupee;
  St("FundSrc.LoanFunds.SecrLoan.TotSecrLoan", secLoan);
  /* 2biiD unsecured rupee loans  J29 = SUM(J26:J28) */
  const unsecRupee = G("FundSrc.LoanFunds.UnsecrLoan.RupeeLoan.FrmBank")
                   + G("FundSrc.LoanFunds.UnsecrLoan.RupeeLoan.FrmPersonSpcfdUs40A2b")
                   + G("FundSrc.LoanFunds.UnsecrLoan.RupeeLoan.FrmOthrs");
  St("FundSrc.LoanFunds.UnsecrLoan.RupeeLoan.TotRupeeLoan", unsecRupee);
  /* 2biii total unsecured loans  L30 = TotRupeeLoan + ForeignCurrencyLoans */
  const unsecLoan = unsecRupee + G("FundSrc.LoanFunds.UnsecrLoan.ForeignCurrencyLoans");
  St("FundSrc.LoanFunds.UnsecrLoan.TotUnSecrLoan", unsecLoan);
  /* 2c total loan funds  L31 = TotUnSecrLoan + TotSecrLoan */
  const loanFund = secLoan + unsecLoan;
  St("FundSrc.LoanFunds.TotLoanFund", loanFund);
  /* 4iii total advances  L36 = SUM(J34:J35) */
  const adv = G("FundSrc.Advances.FrmPersonSpcfdUs40A2b") + G("FundSrc.Advances.FrmOthers");
  St("FundSrc.Advances.TotalAdvances", adv);
  /* 5 sources of funds  L37 = DeferredTax + TotLoanFund + TotPartnerOrMemberFund + TotalAdvances (signed) */
  const fundSrc = G("FundSrc.DeferredTax") + loanFund + partnerFund + adv;
  St("FundSrc.TotFundSrc", fundSrc);

  /* ----- Part B · Application of funds (FundApply) ----- */
  /* 1c Net Block  J42 = MAX(GrossBlock − Depreciation, 0) — floored at 0 */
  const netBlock = Math.max(0, G("FundApply.FixedAsset.GrossBlock") - G("FundApply.FixedAsset.Depreciation"));
  St("FundApply.FixedAsset.NetBlock", netBlock);
  /* 1e total fixed assets  L44 = NetBlock + CapWrkProg */
  const fixed = netBlock + G("FundApply.FixedAsset.CapWrkProg");
  St("FundApply.FixedAsset.TotFixedAsset", fixed);
  /* 2aiiC long-term equity total  J51 = ListedEquities + UnListedEquities */
  const ltEq = G("FundApply.Investments.LongTermInv.EquityInstruments.ListedEquities")
             + G("FundApply.Investments.LongTermInv.EquityInstruments.UnListedEquities");
  St("FundApply.Investments.LongTermInv.EquityInstruments.Total", ltEq);
  /* 2aviii total long-term investments  L57 = SUM(J52:J56) + Total(equity) + InvInProperty */
  const ltInv = G("FundApply.Investments.LongTermInv.PreferenceShares")
              + G("FundApply.Investments.LongTermInv.GovtOrTrustSecurities")
              + G("FundApply.Investments.LongTermInv.DebenturesOrBonds")
              + G("FundApply.Investments.LongTermInv.MutualFunds")
              + G("FundApply.Investments.LongTermInv.Others")
              + ltEq
              + G("FundApply.Investments.LongTermInv.InvInProperty");
  St("FundApply.Investments.LongTermInv.TotLongTermInv", ltInv);
  /* 2biC short-term equity total  J62 = UnListedEquities + ListedEquities */
  const stEq = G("FundApply.Investments.ShortTermInv.EquityInstruments.UnListedEquities")
             + G("FundApply.Investments.ShortTermInv.EquityInstruments.ListedEquities");
  St("FundApply.Investments.ShortTermInv.EquityInstruments.Total", stEq);
  /* 2bvii total short-term investments  L68 = SUM(J63:J67) + Total(equity) */
  const stInv = G("FundApply.Investments.ShortTermInv.PreferenceShares")
              + G("FundApply.Investments.ShortTermInv.GovtOrTrustSecurities")
              + G("FundApply.Investments.ShortTermInv.DebenturesOrBonds")
              + G("FundApply.Investments.ShortTermInv.MutualFunds")
              + G("FundApply.Investments.ShortTermInv.Others")
              + stEq;
  St("FundApply.Investments.ShortTermInv.TotShortTermInv", stInv);
  /* 2c total investments  L69 = L68 + L57 */
  const inv = stInv + ltInv;
  St("FundApply.Investments.TotInvestments", inv);
  /* 3aiH total inventories  L80 = SUM(J73:J79) */
  const invn = G("FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.RawMatl")
             + G("FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.WorkInProgress")
             + G("FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.FinOrTradGood")
             + G("FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.StkInTrade")
             + G("FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.StoresConsumables")
             + G("FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.LooseTools")
             + G("FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.Others");
  St("FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.TotInventries", invn);
  /* 3aiiC total sundry debtors  L84 = SUM(J82:J83) */
  const debtors = G("FundApply.CurrAssetLoanAdv.CurrAsset.SundryDebtorDtls.OutstandindMorethanOneYr")
                + G("FundApply.CurrAssetLoanAdv.CurrAsset.SundryDebtorDtls.Others");
  St("FundApply.CurrAssetLoanAdv.CurrAsset.SundryDebtorDtls.TotalSundryDebtors", debtors);
  /* 3aiiiD total cash & bank  L89 = CashinHand + BankBal + Others */
  const cashBank = G("FundApply.CurrAssetLoanAdv.CurrAsset.CashOrBankBal.CashinHand")
                 + G("FundApply.CurrAssetLoanAdv.CurrAsset.CashOrBankBal.BankBal")
                 + G("FundApply.CurrAssetLoanAdv.CurrAsset.CashOrBankBal.Others");
  St("FundApply.CurrAssetLoanAdv.CurrAsset.CashOrBankBal.TotCashOrBankBal", cashBank);
  /* 3av total current assets  L91 = TotCashOrBankBal + TotalSundryDebtors + TotInventries + OthCurrAsset */
  const currAsset = cashBank + debtors + invn + G("FundApply.CurrAssetLoanAdv.CurrAsset.OthCurrAsset");
  St("FundApply.CurrAssetLoanAdv.CurrAsset.TotCurrAsset", currAsset);
  /* 3biv total loans & advances  L96 = SUM(J93:J95) */
  const loanAdv = G("FundApply.CurrAssetLoanAdv.LoanAdv.AdvRecoverable")
                + G("FundApply.CurrAssetLoanAdv.LoanAdv.Deposits")
                + G("FundApply.CurrAssetLoanAdv.LoanAdv.BalWithRevAuth");
  St("FundApply.CurrAssetLoanAdv.LoanAdv.TotLoanAdv", loanAdv);
  /* 3c total current assets, loans & advances  L100 = TotLoanAdv + TotCurrAsset */
  const currAll = loanAdv + currAsset;
  St("FundApply.CurrAssetLoanAdv.TotCurrAssetLoanAdv", currAll);
  /* 3diA3 total sundry creditors  J106 = SUM(J104:J105) */
  const creditors = G("FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.SundryCreditorDtls.OutstandindMorethanOneYr")
                  + G("FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.SundryCreditorDtls.Others");
  St("FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.SundryCreditorDtls.TotalSundryCreditors", creditors);
  /* 3diG total current liabilities  L112 = SUM(J106:J111) */
  const currLiab = creditors
                 + G("FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.LiabForLeasedAsset")
                 + G("FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.AccrIntonLeasedAsset")
                 + G("FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.AccrIntNotDue")
                 + G("FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.IncRecvdInAdv")
                 + G("FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.OtherPayables");
  St("FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.TotCurrLiabilities", currLiab);
  /* 3diiD total provisions  L118 = SUM(J114:J117) — skips HIDDEN r115 wealth tax */
  const prov = G("FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.ITProvision")
             + G("FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.ELSuperAnnGratProvision")
             + G("FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.OthProvision");
  St("FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.TotProvisions", prov);
  /* 3diii total current liabilities & provisions  L119 = TotProvisions + TotCurrLiabilities */
  const currLiabProv = prov + currLiab;
  St("FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.TotCurrLiabilitiesProvision", currLiabProv);
  /* 3e net current assets  L120 = TotCurrAssetLoanAdv − TotCurrLiabilitiesProvision (signed) */
  const netCurr = currAll - currLiabProv;
  St("FundApply.CurrAssetLoanAdv.NetCurrAsset", netCurr);
  /* 4d total misc adjustments  L124 = SUM(J121:J123) */
  const miscAdj = G("FundApply.MiscAdjust.MiscExpndr")
                + G("FundApply.MiscAdjust.DefTaxAsset")
                + G("FundApply.MiscAdjust.AccumultedLosses");
  St("FundApply.MiscAdjust.TotMiscAdjust", miscAdj);
  /* 5 application of funds  L125 = TotMiscAdjust + NetCurrAsset + TotInvestments + TotFixedAsset (signed) */
  const fundApply = miscAdj + netCurr + inv + fixed;
  St("FundApply.TotFundApply", fundApply);

  /* ----- compute cache: footer/summary + checks read this ----- */
  const hasReg = _bsHas(S.bs.FundSrc) || _bsHas(S.bs.FundApply);
  const hasNoBks = _bsHas(S.bs.NoBooksOfAccBS);
  S.C.bs = {
    fundSrc:R(fundSrc), fundApply:R(fundApply),
    mismatch: R(fundSrc)!==R(fundApply),
    hasReg:hasReg, hasNoBks:hasNoBks
  };
}

/* ================================================================
   screen — secBs. Every live row rendered; heads are sub(); computed
   totals via cell(); the five signed fields flagged "may be negative".
   ================================================================ */
function _bsHas(o){
  if(o==null) return false;
  if(typeof o==="number") return R(o)!==0;
  if(typeof o==="string") return st0(o)!=="";
  if(typeof o==="object") return Object.keys(o).some(k=>_bsHas(o[k]));
  return false;
}
function secBs(){
  /* re-seed containers defensively (an imported file may miss a branch) */
  _bsFillMissing(S.bs, _bsSeed());
  const V=p=>N(get("bs."+p));
  const ri=(l,pth,ref,o)=>{o=o||{};return row(l,inp("bs."+pth,{n:1}),{ref:ref,ind:o.ind,hint:o.hint,req:o.req});};
  const rc=(l,pth,ref,o)=>{o=o||{};return row(l,cell(V(pth)),{ref:ref,ind:o.ind,cls:"tot",hint:o.hint});};
  const NEG="may be negative";

  let h="";
  h+=formNote("Part A — Balance Sheet as on 31 March 2026 (or the date of dissolution). "+
    "Fill items <b>A</b> (Sources of funds) and <b>B</b> (Application of funds) where regular "+
    "books of account are maintained; otherwise fill item <b>C</b> (No-account case). Sources of "+
    "funds must equal application of funds. All totals are computed. Every figure is a positive "+
    "rupee amount except the five signed lines flagged below.");

  /* ---------- A · Sources of funds ---------- */
  let a="";
  a+=ri("Partners' / members' capital","FundSrc.PartnerOrMemberFund.PartnerOrMemberCap","1a",{hint:NEG});
  a+=sub("1b — Reserves and surplus");
  a+=ri("Revaluation reserve","FundSrc.PartnerOrMemberFund.ResrNSurp.RevResr","1bi",{ind:1});
  a+=ri("Capital reserve","FundSrc.PartnerOrMemberFund.ResrNSurp.CapResr","1bii",{ind:1});
  a+=ri("Statutory reserve","FundSrc.PartnerOrMemberFund.ResrNSurp.StatResr","1biii",{ind:1});
  a+=ri("Any other reserve","FundSrc.PartnerOrMemberFund.ResrNSurp.OthResr","1biv",{ind:1});
  a+=ri("Credit balance of profit and loss account","FundSrc.PartnerOrMemberFund.ResrNSurp.CreditBalOfPLAccount","1bv",{ind:1});
  a+=rc("Total reserves and surplus (bi + bii + biii + biv + bv)","FundSrc.PartnerOrMemberFund.ResrNSurp.TotResrNSurp","1bvi");
  a+=rc("Total partners' / members' fund (a + bvi)","FundSrc.PartnerOrMemberFund.TotPartnerOrMemberFund","1c",{hint:NEG});
  a+=sub("2a — Secured loans");
  a+=ri("Foreign currency loans","FundSrc.LoanFunds.SecrLoan.ForeignCurrLoan","2ai",{ind:1});
  a+=ri("Rupee loans — from banks","FundSrc.LoanFunds.SecrLoan.RupeeLoan.FrmBank","2aiiA",{ind:1});
  a+=ri("Rupee loans — from others","FundSrc.LoanFunds.SecrLoan.RupeeLoan.FrmOthrs","2aiiB",{ind:1});
  a+=rc("Total rupee loans (iiA + iiB)","FundSrc.LoanFunds.SecrLoan.RupeeLoan.TotRupeeLoan","2aiiC");
  a+=rc("Total secured loans (ai + iiC)","FundSrc.LoanFunds.SecrLoan.TotSecrLoan","2aiii");
  a+=sub("2b — Unsecured loans (including deposits)");
  a+=ri("Foreign currency loans","FundSrc.LoanFunds.UnsecrLoan.ForeignCurrencyLoans","2bi",{ind:1});
  a+=ri("Rupee loans — from banks","FundSrc.LoanFunds.UnsecrLoan.RupeeLoan.FrmBank","2biiA",{ind:1});
  a+=ri("Rupee loans — from persons specified in section 40A(2)(b)","FundSrc.LoanFunds.UnsecrLoan.RupeeLoan.FrmPersonSpcfdUs40A2b","2biiB",{ind:1});
  a+=ri("Rupee loans — from others","FundSrc.LoanFunds.UnsecrLoan.RupeeLoan.FrmOthrs","2biiC",{ind:1});
  a+=rc("Total rupee loans (iiA + iiB + iiC)","FundSrc.LoanFunds.UnsecrLoan.RupeeLoan.TotRupeeLoan","2biiD");
  a+=rc("Total unsecured loans (bi + iiD)","FundSrc.LoanFunds.UnsecrLoan.TotUnSecrLoan","2biii");
  a+=rc("Total loan funds (aiii + biii)","FundSrc.LoanFunds.TotLoanFund","2c");
  a+=ri("3 — Deferred tax liability","FundSrc.DeferredTax","3");
  a+=sub("4 — Advances");
  a+=ri("From persons specified in section 40A(2)(b)","FundSrc.Advances.FrmPersonSpcfdUs40A2b","4i",{ind:1});
  a+=ri("From others","FundSrc.Advances.FrmOthers","4ii",{ind:1});
  a+=rc("Total advances (i + ii)","FundSrc.Advances.TotalAdvances","4iii");
  a+=rc("Sources of funds (1c + 2c + 3 + 4iii)","FundSrc.TotFundSrc","5",{hint:NEG});
  h+=fold("bs_src","A","Sources of funds",
    S.C.bs&&S.C.bs.hasReg?RS(V("FundSrc.TotFundSrc")):"regular books",a,{def:true});

  /* ---------- B · Application of funds ---------- */
  let b="";
  b+=sub("1 — Fixed assets");
  b+=ri("Gross: Block","FundApply.FixedAsset.GrossBlock","1a",{ind:1,hint:"Gross Block will include value of land"});
  b+=ri("Depreciation","FundApply.FixedAsset.Depreciation","1b",{ind:1});
  b+=rc("Net Block (a − b, floored at 0)","FundApply.FixedAsset.NetBlock","1c");
  b+=ri("Capital work-in-progress","FundApply.FixedAsset.CapWrkProg","1d",{ind:1});
  b+=rc("Total (1c + 1d)","FundApply.FixedAsset.TotFixedAsset","1e");
  b+=sub("2a — Long-term investments");
  b+=ri("Investment in property","FundApply.Investments.LongTermInv.InvInProperty","2ai",{ind:1});
  b+=sub("2aii — Equity instruments");
  b+=ri("Listed equities","FundApply.Investments.LongTermInv.EquityInstruments.ListedEquities","2aiiA",{ind:1});
  b+=ri("Unlisted equities","FundApply.Investments.LongTermInv.EquityInstruments.UnListedEquities","2aiiB",{ind:1});
  b+=rc("Total (A + B)","FundApply.Investments.LongTermInv.EquityInstruments.Total","2aiiC");
  b+=ri("Preference shares","FundApply.Investments.LongTermInv.PreferenceShares","2aiii",{ind:1});
  b+=ri("Government or trust securities","FundApply.Investments.LongTermInv.GovtOrTrustSecurities","2aiv",{ind:1});
  b+=ri("Debenture or bonds","FundApply.Investments.LongTermInv.DebenturesOrBonds","2av",{ind:1});
  b+=ri("Mutual funds","FundApply.Investments.LongTermInv.MutualFunds","2avi",{ind:1});
  b+=ri("Others","FundApply.Investments.LongTermInv.Others","2avii",{ind:1});
  b+=rc("Total long-term investments (i + iiC + iii + iv + v + vi + vii)","FundApply.Investments.LongTermInv.TotLongTermInv","2aviii");
  b+=sub("2b — Short-term investments");
  b+=sub("2bi — Equity instruments");
  b+=ri("Listed equities","FundApply.Investments.ShortTermInv.EquityInstruments.ListedEquities","2biA",{ind:1});
  b+=ri("Unlisted equities","FundApply.Investments.ShortTermInv.EquityInstruments.UnListedEquities","2biB",{ind:1});
  b+=rc("Total (A + B)","FundApply.Investments.ShortTermInv.EquityInstruments.Total","2biC");
  b+=ri("Preference shares","FundApply.Investments.ShortTermInv.PreferenceShares","2bii",{ind:1});
  b+=ri("Government or trust securities","FundApply.Investments.ShortTermInv.GovtOrTrustSecurities","2biii",{ind:1});
  b+=ri("Debenture or bonds","FundApply.Investments.ShortTermInv.DebenturesOrBonds","2biv",{ind:1});
  b+=ri("Mutual funds","FundApply.Investments.ShortTermInv.MutualFunds","2bv",{ind:1});
  b+=ri("Others","FundApply.Investments.ShortTermInv.Others","2bvi",{ind:1});
  b+=rc("Total short-term investments (iC + ii + iii + iv + v + vi)","FundApply.Investments.ShortTermInv.TotShortTermInv","2bvii");
  b+=rc("Total investments (aviii + bvii)","FundApply.Investments.TotInvestments","2c");
  b+=sub("3a — Current assets");
  b+=sub("3ai — Inventories");
  b+=ri("Raw materials","FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.RawMatl","3aiA",{ind:1});
  b+=ri("Work in progress","FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.WorkInProgress","3aiB",{ind:1});
  b+=ri("Finished goods","FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.FinOrTradGood","3aiC",{ind:1});
  b+=ri("Stock-in-trade (goods acquired for trading)","FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.StkInTrade","3aiD",{ind:1});
  b+=ri("Stores/consumables including packing material","FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.StoresConsumables","3aiE",{ind:1});
  b+=ri("Loose tools","FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.LooseTools","3aiF",{ind:1});
  b+=ri("Others","FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.Others","3aiG",{ind:1});
  b+=rc("Total (iA to iG)","FundApply.CurrAssetLoanAdv.CurrAsset.Inventories.TotInventries","3aiH");
  b+=sub("3aii — Sundry debtors");
  b+=ri("Outstanding for more than one year","FundApply.CurrAssetLoanAdv.CurrAsset.SundryDebtorDtls.OutstandindMorethanOneYr","3aiiA",{ind:1});
  b+=ri("Others","FundApply.CurrAssetLoanAdv.CurrAsset.SundryDebtorDtls.Others","3aiiB",{ind:1});
  b+=rc("Total sundry debtors (A + B)","FundApply.CurrAssetLoanAdv.CurrAsset.SundryDebtorDtls.TotalSundryDebtors","3aiiC");
  b+=sub("3aiii — Cash and bank balances");
  b+=ri("Balance with banks","FundApply.CurrAssetLoanAdv.CurrAsset.CashOrBankBal.BankBal","3aiiiA",{ind:1});
  b+=ri("Cash-in-hand","FundApply.CurrAssetLoanAdv.CurrAsset.CashOrBankBal.CashinHand","3aiiiB",{ind:1});
  b+=ri("Others","FundApply.CurrAssetLoanAdv.CurrAsset.CashOrBankBal.Others","3aiiiC",{ind:1});
  b+=rc("Total cash and cash equivalents (iiiA + iiiB + iiiC)","FundApply.CurrAssetLoanAdv.CurrAsset.CashOrBankBal.TotCashOrBankBal","3aiiiD");
  b+=ri("Other current assets","FundApply.CurrAssetLoanAdv.CurrAsset.OthCurrAsset","3aiv");
  b+=rc("Total current assets (iH + iiC + iiiD + aiv)","FundApply.CurrAssetLoanAdv.CurrAsset.TotCurrAsset","3av");
  b+=sub("3b — Loans and advances");
  b+=ri("Advances recoverable in cash or in kind or for value to be received","FundApply.CurrAssetLoanAdv.LoanAdv.AdvRecoverable","3bi",{ind:1});
  b+=ri("Deposits, loans and advances to corporates and others","FundApply.CurrAssetLoanAdv.LoanAdv.Deposits","3bii",{ind:1});
  b+=ri("Balance with Revenue Authorities","FundApply.CurrAssetLoanAdv.LoanAdv.BalWithRevAuth","3biii",{ind:1});
  b+=rc("Total (bi + bii + biii)","FundApply.CurrAssetLoanAdv.LoanAdv.TotLoanAdv","3biv");
  b+=sub("3bv — Of the loans and advances in biv, the amount that is");
  b+=ri("for the purpose of business or profession","FundApply.CurrAssetLoanAdv.LoanAdv.LoanAdvIncluded.PurposeOFBusOrProf","3bv·a",{ind:1});
  b+=ri("not for the purpose of business or profession","FundApply.CurrAssetLoanAdv.LoanAdv.LoanAdvIncluded.NotForPurposeOFBusOrProf","3bv·b",{ind:1});
  b+=rc("Total current assets, loans and advances (av + biv)","FundApply.CurrAssetLoanAdv.TotCurrAssetLoanAdv","3c");
  b+=sub("3d — Current liabilities and provisions");
  b+=sub("3di — Current liabilities");
  b+=sub("3diA — Sundry creditors");
  b+=ri("Outstanding for more than one year","FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.SundryCreditorDtls.OutstandindMorethanOneYr","3diA1",{ind:1});
  b+=ri("Others","FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.SundryCreditorDtls.Others","3diA2",{ind:1});
  b+=rc("Total sundry creditors (1 + 2)","FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.SundryCreditorDtls.TotalSundryCreditors","3diA3");
  b+=ri("Liability for leased assets","FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.LiabForLeasedAsset","3diB",{ind:1});
  b+=ri("Interest accrued and due on borrowings","FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.AccrIntonLeasedAsset","3diC",{ind:1});
  b+=ri("Interest accrued but not due on borrowings","FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.AccrIntNotDue","3diD",{ind:1});
  b+=ri("Income received in advance","FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.IncRecvdInAdv","3diE",{ind:1});
  b+=ri("Other payables","FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.OtherPayables","3diF",{ind:1});
  b+=rc("Total current liabilities (A3 + iB + iC + iD + iE + iF)","FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.CurrLiabilities.TotCurrLiabilities","3diG");
  b+=sub("3dii — Provisions");
  b+=ri("Provision for income tax","FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.ITProvision","3diiA",{ind:1});
  b+=ri("Provision for leave encashment / superannuation / gratuity","FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.ELSuperAnnGratProvision","3diiB",{ind:1});
  b+=ri("Other provisions","FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.OthProvision","3diiC",{ind:1});
  b+=rc("Total provisions (iiA + iiB + iiC)","FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.Provisions.TotProvisions","3diiD");
  b+=rc("Total current liabilities and provisions (iG + iiD)","FundApply.CurrAssetLoanAdv.CurrLiabilitiesProv.TotCurrLiabilitiesProvision","3diii");
  b+=rc("Net current assets (3c − 3diii)","FundApply.CurrAssetLoanAdv.NetCurrAsset","3e",{hint:NEG});
  b+=ri("4a — Miscellaneous expenditure not written off or adjusted","FundApply.MiscAdjust.MiscExpndr","4a");
  b+=ri("4b — Deferred tax asset","FundApply.MiscAdjust.DefTaxAsset","4b");
  b+=ri("4c — Debit balance in profit and loss account / accumulated balance","FundApply.MiscAdjust.AccumultedLosses","4c");
  b+=rc("Total (4a + 4b + 4c)","FundApply.MiscAdjust.TotMiscAdjust","4d");
  b+=rc("Total, application of funds (1e + 2c + 3e + 4d)","FundApply.TotFundApply","5",{hint:NEG});
  if(S.C.bs && S.C.bs.hasReg && S.C.bs.mismatch)
    b+=note("<b>Sources of funds must equal application of funds.</b> Sources "+
      RS(V("FundSrc.TotFundSrc"))+" vs application "+RS(V("FundApply.TotFundApply"))+".","stop");
  h+=fold("bs_apply","B","Application of funds",
    S.C.bs&&S.C.bs.hasReg?RS(V("FundApply.TotFundApply")):"regular books",b,{def:true});

  /* ---------- C · No-account case ---------- */
  let c="";
  c+=note("Fill this only where regular books of account of the business or profession are "+
    "<b>not</b> maintained. Furnish the figures as on 31 March 2026.");
  c+=ri("Amount of total sundry debtors","NoBooksOfAccBS.TotSundryDbtAmt","C1");
  c+=ri("Amount of total sundry creditors","NoBooksOfAccBS.TotSundryCrdAmt","C2");
  c+=ri("Amount of total stock-in-trade","NoBooksOfAccBS.TotStkInTradAmt","C3");
  c+=ri("Amount of the cash balance","NoBooksOfAccBS.CashBalAmt","C4");
  h+=fold("bs_nobks","C","No-account case (books not maintained)",
    S.C.bs&&S.C.bs.hasNoBks?"filled":"if no books",c,{def:false});

  return h;
}

/* ================================================================
   export — write PARTA_BS onto j. FundSrc + FundApply are required and
   merged over the zero skeleton; NoBooksOfAccBS is added only when it
   carries data (book §11.8).
   ================================================================ */
function _bsVal(v){return R(N(v));}          /* every PARTA_BS leaf is an integer */
function _bsNode(o){                          /* coerce an object subtree to integers */
  const out={};
  for(const k in o){const v=o[k];
    if(v&&typeof v==="object"&&!Array.isArray(v)){const s=_bsNode(v);if(Object.keys(s).length)out[k]=s;}
    else if(typeof v!=="object"){out[k]=_bsVal(v);}}
  return out;
}
function _bsAssign(t,s){                       /* merge coerced values over SKEL defaults */
  for(const k in s){
    if(s[k]&&typeof s[k]==="object"&&!Array.isArray(s[k])){
      if(typeof t[k]!=="object"||!t[k]||Array.isArray(t[k]))t[k]={};
      _bsAssign(t[k],s[k]);
    } else t[k]=s[k];
  }
}
function expBs(j){
  const B=S.bs;
  _bsAssign(j.PARTA_BS, _bsNode({FundSrc:B.FundSrc, FundApply:B.FundApply}));
  if(_bsHas(B.NoBooksOfAccBS)) j.PARTA_BS.NoBooksOfAccBS=_bsNode(B.NoBooksOfAccBS);
}

/* ================================================================
   import — read PARTA_BS back into S.bs, then re-establish every
   container the renderer and engine walk into.
   ================================================================ */
function _bsSeed(){return {
  FundSrc:{ PartnerOrMemberFund:{ ResrNSurp:{} },
    LoanFunds:{ SecrLoan:{ RupeeLoan:{} }, UnsecrLoan:{ RupeeLoan:{} } }, Advances:{} },
  FundApply:{ FixedAsset:{},
    Investments:{ LongTermInv:{ EquityInstruments:{} }, ShortTermInv:{ EquityInstruments:{} } },
    CurrAssetLoanAdv:{ CurrAsset:{ Inventories:{}, SundryDebtorDtls:{}, CashOrBankBal:{} },
      LoanAdv:{ LoanAdvIncluded:{} },
      CurrLiabilitiesProv:{ CurrLiabilities:{ SundryCreditorDtls:{} }, Provisions:{} } },
    MiscAdjust:{} },
  NoBooksOfAccBS:{}
};}
function _bsFillMissing(dst,def){
  for(const k in def){
    if(dst[k]===undefined||dst[k]===null){dst[k]=deep(def[k]);}
    else if(def[k]&&typeof def[k]==="object"&&!Array.isArray(def[k])&&typeof dst[k]==="object"&&!Array.isArray(dst[k]))
      _bsFillMissing(dst[k],def[k]);
  }
}
function impBs(I5){
  const got=[];
  if(I5&&I5.PARTA_BS){S.bs=deep(I5.PARTA_BS);got.push("Balance Sheet");}
  _bsFillMissing(S.bs, _bsSeed());
  return got;
}

/* ================================================================
   checks — the sheet's own rules as live messages (from the book).
   ================================================================ */
function chkBs(){
  const out=[], V=p=>N(get("bs."+p)), C=S.C.bs||{};

  /* n=81 (cat A): Sources of funds (5) must equal Application of funds (5). */
  if(C.hasReg && C.mismatch)
    out.push({lvl:"err",t:"Balance sheet does not balance",
      m:"Sources of funds ("+RS(C.fundSrc)+") must equal total application of funds ("+
        RS(C.fundApply)+") — Part A-BS rule (rules.json n=81).",sec:"bs"});

  /* §11.3 — every field is >= 0 except the five signed lines. Flag a
     non-signed input that has gone negative. */
  const SIGNED={
    "FundSrc.PartnerOrMemberFund.PartnerOrMemberCap":1,
    "FundSrc.PartnerOrMemberFund.TotPartnerOrMemberFund":1,
    "FundSrc.TotFundSrc":1,
    "FundApply.CurrAssetLoanAdv.NetCurrAsset":1,
    "FundApply.TotFundApply":1
  };
  const scan=(o,path)=>{
    for(const k in o){const v=o[k], p=path?path+"."+k:k;
      if(v&&typeof v==="object") scan(v,p);
      else if(typeof v!=="object" && !SIGNED[p] && R(N(v))<0)
        out.push({lvl:"err",t:"Negative figure not allowed",
          m:"Item "+p.split(".").pop()+" is "+RS(v)+"; only capital (1a/1c), sources (5), net current assets (3e) and application (5) may be negative.",sec:"bs"});
    }
  };
  scan({FundSrc:S.bs.FundSrc, FundApply:S.bs.FundApply, NoBooksOfAccBS:S.bs.NoBooksOfAccBS}, "");

  /* §6 — 139(9) defect trap: both Source-5 and No-account C are zero while
     Schedule BP income (Sl.No D) exceeds Rs 1.2 lakh. Cross-schedule; read
     the BP head from the bp section's compute cache when it is present. */
  const bpInc = (S.C && S.C.bp && (S.C.bp.income!=null)) ? N(S.C.bp.income) : 0;
  const noBksTot = V("NoBooksOfAccBS.TotSundryDbtAmt")+V("NoBooksOfAccBS.TotSundryCrdAmt")
                 + V("NoBooksOfAccBS.TotStkInTradAmt")+V("NoBooksOfAccBS.CashBalAmt");
  if(R(C.fundSrc||0)===0 && R(noBksTot)===0 && bpInc>120000)
    out.push({lvl:"warn",t:"Balance sheet may be required",
      m:"Business income exceeds Rs 1.2 lakh but neither the regular-books Balance Sheet (Sources of funds) nor the No-account case is filled — the return may be treated as defective u/s 139(9).",sec:"bs"});

  return out;
}

/* ================================================================ */
reg({id:"bs", t:"Balance sheet", ref:"Part A - BS",
  f:secBs,
  s:()=>{const C=S.C.bs||{};
    if(C.hasReg) return RS(C.fundSrc||0)+(C.mismatch?" — does not balance":"");
    if(C.hasNoBks) return "no books";
    return "";},
  eng:engBs, exp:expBs, imp:impBs, chk:chkBs, order:6});
