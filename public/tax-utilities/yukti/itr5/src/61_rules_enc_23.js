/* =====================================================================
   ITR-5 · AY 2026-27 — Category-A validation rules, encoding batch 23.
   The 23 census-found MISSING Schedule-SI cross-schedule consistency
   rules (books/ITR-5/rules.json serials 698,699,700,704,707,709,710,
   713,714,715,716,717-728). Each is a Schedule-SI (SplCodeRateTax)
   reconciliation against Schedule OS / Schedule BFLA / Schedule CG whose
   BOTH operands are exported leaves.
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) FIRES when cond (the "lawful" assertion) is FALSE.
   Schema keys verified against the owning section exp() functions:
     70_sec_si.js  (ScheduleSI.SplCodeRateTax[].{SecCode,SplRateInc})
     70_sec_os.js  (ScheduleOS.IncOthThanOwnRaceHorse.*)
     70_sec_loss.js(ScheduleBFLA.<head>.IncBFLA.IncOfCurYrAfterSetOffBFLosses)
     70_sec_cg.js  (ScheduleCG.ShortTermCapGain / LongTermCapGain.*)
   Reads are guarded (RG / arr); nothing throws; every block is a no-op
   when its driving schedule is absent. Equalities use REQ (±1); the CG
   sub-item checks are upper bounds (<= leaf+1, post-BFLA SI ≤ pre-BFLA CG).
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const arr=v=>Array.isArray(v)?v:[];
  const st0=v=>String(v==null?"":v).trim();

  /* ---- Schedule SI: sum of SplRateInc per SecCode (identity code space) --- */
  const siByCode={};
  arr(RG(I,"ScheduleSI.SplCodeRateTax",[])).forEach(function(r){
    if(!r)return; const c=st0(r.SecCode); if(!c)return;
    siByCode[c]=(siByCode[c]||0)+N(r.SplRateInc);
  });
  const siInc=c=>N(siByCode[st0(c)]);
  const siSum=codes=>codes.reduce((a,c)=>a+siInc(c),0);

  /* ===================================================================
     698 / 699 / 700 / 715 / 716 — Schedule SI vs Schedule OS special-rate
     amounts (2c / 2d / 2a-115BB) net of the per-code DTAA reduction (2e).
     SI income for a code = OS SourceAmount(code) − Σ DTAA(same code), with
     the DTAA row "counting" gated on residency + per-row TRC exactly as the
     OS batch (enc_10): a resident counts every 2e row; a non-resident counts
     only rows whose TaxRescertifiedFlag begins with "Y".
     =================================================================== */
  if(I.ScheduleOS){
    const io=RG(I,"ScheduleOS.IncOthThanOwnRaceHorse",{})||{};
    /* residency gate — mirror of forms/ITR-5/src/61_rules_enc_10.js */
    const res=String(RG(I,"PartA_GEN1.FilingStatus.ResidentialStatus","RES"));
    const nri=res.slice(0,3).toUpperCase()!=="RES";
    const counts=r=>!nri||st0(r&&r.TaxRescertifiedFlag).charAt(0).toUpperCase()==="Y";
    /* per-code DTAA (2e), keyed by ItemNoincl (the OS source code) */
    const dtaaByItem={};
    arr(RG(io,"IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS",[])).forEach(function(r){
      if(!r||!counts(r))return; const k=st0(r.ItemNoincl);
      dtaaByItem[k]=(dtaaByItem[k]||0)+N(r.DTAAamt);
    });
    const dtaa=c=>N(dtaaByItem[st0(c)]);
    /* aggregate an OS special-rate dropdown by its section code */
    const aggBy=rowsKey=>{const m={};
      arr(RG(io,rowsKey,[])).forEach(function(r){if(!r)return;const c=st0(r.SourceDescription);
        if(!c)return; m[c]=(m[c]||0)+N(r.SourceAmount);});
      return m;};
    /* 2c — OthersGrossDtls[] : SI(code) = 2c(code) − DTAA(code)  (698, 716) */
    const os2c=aggBy("OthersGrossDtls");
    Object.keys(os2c).forEach(function(c){
      const want=Math.max(0,os2c[c]-dtaa(c));
      A(698,REQ(siInc(c),want),"Schedule SI: the income offered against section code "+c+" must equal the amount offered at Sl.No.2c of Schedule OS for that code, net of the corresponding DTAA amount (2e).");
      A(716,REQ(siInc(c),want),"Schedule SI: the special-rate income against section code "+c+" must equal the amount offered at the corresponding dropdown of Sl.No.2c of Schedule OS, after reducing the DTAA income referred to in 2e for that section.");
    });
    /* 2d — PTIOthersGrossDtls[] : SI(code) = 2d(code) − DTAA(code)  (699, 715) */
    const os2d=aggBy("PTIOthersGrossDtls");
    Object.keys(os2d).forEach(function(c){
      const want=Math.max(0,os2d[c]-dtaa(c));
      A(699,REQ(siInc(c),want),"Schedule SI: the income offered against section code "+c+" must equal the pass-through amount offered at Sl.No.2d of Schedule OS for that code, net of the corresponding DTAA amount (2e).");
      A(715,REQ(siInc(c),want),"Schedule SI: the special-rate income against section code "+c+" must equal the amount offered at the corresponding dropdown of Sl.No.2d of Schedule OS, after reducing the DTAA income referred to in 2e for that section.");
    });
    /* 2a(i) — 115BB winnings : SI code 5BB = LtryPzzlChrgblUs115BB (no DTAA)  (700) */
    A(700,REQ(siInc("5BB"),Math.max(0,N(io.LtryPzzlChrgblUs115BB))),"Schedule SI: the income offered under section 115BB must equal the winnings from lotteries/puzzles etc. (Sl.No.2a-115BB) of Schedule OS.");
  }

  /* ===================================================================
     704 / 707 / 709 / 710 / 713 / 714 — Schedule SI rate-head income equals
     the Schedule BFLA col-5 leaf (.IncBFLA.IncOfCurYrAfterSetOffBFLosses)
     for the same rate head. The SI engine constructs each of these figures
     equal to the BFLA col-5 leaf, so this is an exact equality (REQ ±1).
     Note: the schema block for LTCG @12.5% is LTCG12_5Per (not "LTCG12Per").
     =================================================================== */
  if(I.ScheduleBFLA){
    const bfla=k=>N(RG(I,"ScheduleBFLA."+k+".IncBFLA.IncOfCurYrAfterSetOffBFLosses"));
    /* 704 — other-source income at DTAA rate == 5(xiv) IncOSDTAA */
    A(704,REQ(siInc("DTAAOS"),bfla("IncOSDTAA")),"Schedule SI: the income from other sources chargeable at special rates as per DTAA must equal Sl.No.5(xiv) of Schedule BFLA.");
    /* 707 — 115AD STCG (FII, STT-not-paid) + PTI STCG@30 == 5(vii) STCG30Per */
    A(707,REQ(siInc("5ADii")+siInc("PTI_STCG30P"),bfla("STCG30Per")),"Schedule SI: the sum of income u/s 115AD (STCG for FIIs) and pass-through STCG chargeable @30% must equal Sl.No.5(vii) of Schedule BFLA.");
    /* 709 — STCG at DTAA rate == 5(ix) STCGDTAARate */
    A(709,REQ(siInc("DTAASTCG"),bfla("STCGDTAARate")),"Schedule SI: the short-term capital gains chargeable at special rates as per DTAA must equal Sl.No.5(ix) of Schedule BFLA.");
    /* 710 — LTCG at DTAA rate == 5(xi) LTCGDTAARate */
    A(710,REQ(siInc("DTAALTCG"),bfla("LTCGDTAARate")),"Schedule SI: the long-term capital gains chargeable at special rates as per DTAA must equal Sl.No.5(xi) of Schedule BFLA.");
    /* 713 — 111A + 115AD(1)(ii)-Proviso + PTI STCG@20 == 5(vi) STCG20Per */
    A(713,REQ(siInc("1")+siInc("5AD1biip")+siInc("PTI_STCG20P"),bfla("STCG20Per")),"Schedule SI: the sum of income u/s 111A, u/s 115AD(1)(ii)-Proviso and pass-through STCG chargeable @20% must equal Sl.No.5(vi) of Schedule BFLA.");
    /* 714 — LTCG @12.5% roster == 5(xb) LTCG12_5Per */
    const LTCG125=["21","22","21ciii","2A","5AB1b","5AC1c","5ADiii","5ADiiiP","PTI_LTCG12_5P112A","PTI_LTCG12_5P"];
    A(714,REQ(siSum(LTCG125),bfla("LTCG12_5Per")),"Schedule SI: the sum of the long-term capital gains chargeable @12.5% must equal Sl.No.5(xb) of Schedule BFLA.");
  }

  /* ===================================================================
     717–728 — Schedule SI section-code income cannot exceed the matching
     Schedule CG sub-item leaf. Schedule SI carries post-BFLA (and, for a
     non-resident, post-DTAA) income, while these CG leaves are the pre-BFLA
     gross figures, so "SI ≤ CG leaf" is an upper bound that never false-fires
     (SI ≤ leaf + 1). Verified CG keys (70_sec_cg.js):
       A3ie/A3iie EquityMFonSTT[] filtered by MFSectionCode ("1A"/"5AD1biip"),
                  leaf EquityMFonSTTDtls.CapgainonAssets;
       A4a NRITransacSec48Dtl.NRItaxSTTPaid; A5e NRISecur115AD.CapgainonAssets;
       A8a/A8b PassThrIncNatureSTCG20Per/30Per;
       B3c Proviso112Applicable.Proviso112Applicabledtls.BalanceCG;
       B4 SaleOfEquityShareUs112A.CapgainonAssets;
       B6ic/iic/iiic/ivc NRIOnSec112and115Dtls[] by SectionCode
                  ("21ciii"/"5AB1b"/"5AC1c"/"5ADiii"), leaf BalanceCG;
       B7 NRISaleOfEquityShareUs112A.CapgainonAssets.
     =================================================================== */
  if(I.ScheduleCG){
    const ST="ScheduleCG.ShortTermCapGain.", LT="ScheduleCG.LongTermCapGain.";
    const a3=arr(RG(I,ST+"EquityMFonSTT",[]));
    const a3c=code=>a3.filter(r=>r&&st0(r.MFSectionCode)===code)
      .reduce((a,r)=>a+N(RG(r,"EquityMFonSTTDtls.CapgainonAssets")),0);
    const b6=arr(RG(I,LT+"NRIOnSec112and115.NRIOnSec112and115Dtls",[]));
    const b6c=code=>b6.filter(r=>r&&st0(r.SectionCode)===code).reduce((a,r)=>a+N(r.BalanceCG),0);
    const A3ie =a3c("1A"), A3iie=a3c("5AD1biip");
    const A4a  =N(RG(I,ST+"NRITransacSec48Dtl.NRItaxSTTPaid"));
    const A5e  =N(RG(I,ST+"NRISecur115AD.CapgainonAssets"));
    const A8a  =N(RG(I,ST+"PassThrIncNatureSTCG20Per"));
    const A8b  =N(RG(I,ST+"PassThrIncNatureSTCG30Per"));
    const B3c  =N(RG(I,LT+"Proviso112Applicable.Proviso112Applicabledtls.BalanceCG"));
    const B4   =N(RG(I,LT+"SaleOfEquityShareUs112A.CapgainonAssets"));
    const B7   =N(RG(I,LT+"NRISaleOfEquityShareUs112A.CapgainonAssets"));
    /* 717 — 111A STCG (STT paid) ≤ A3ie + A4a */
    A(717,siInc("1")<=A3ie+A4a+1,"Schedule SI: the income u/s 111A cannot be more than the income offered in Schedule CG at Sl.No.A3ie or A4a.");
    /* 718 — 115AD(1)(b)(ii)-Proviso STCG ≤ A3iie */
    A(718,siInc("5AD1biip")<=A3iie+1,"Schedule SI: the income u/s 115AD(1)(b)(ii)-Proviso cannot be more than the income offered in Schedule CG at Sl.No.A3iie.");
    /* 719 — 112(1) LTCG ≤ B3c */
    A(719,siInc("21")<=B3c+1,"Schedule SI: the income u/s 112(1) cannot be more than the income offered in Schedule CG at Sl.No.B3c.");
    /* 720 — 112(1)(c)(iii) LTCG (NR unlisted) ≤ B6ic */
    A(720,siInc("21ciii")<=b6c("21ciii")+1,"Schedule SI: the income u/s 112(1)(c)(iii) cannot be more than the income offered in Schedule CG at Sl.No.B6ic.");
    /* 721 — 112A LTCG (STT paid) ≤ B4 */
    A(721,siInc("2A")<=B4+1,"Schedule SI: the income u/s 112A cannot be more than the income offered in Schedule CG at Sl.No.B4 (or Col.14 of Schedule 112A).");
    /* 722 — 115AB(1)(b) LTCG ≤ B6iic */
    A(722,siInc("5AB1b")<=b6c("5AB1b")+1,"Schedule SI: the income u/s 115AB(1)(b) cannot be more than the income offered in Schedule CG at Sl.No.B6iic.");
    /* 723 — 115AC(1)(c) LTCG ≤ B6iiic */
    A(723,siInc("5AC1c")<=b6c("5AC1c")+1,"Schedule SI: the income u/s 115AC(1)(c) cannot be more than the income offered in Schedule CG at Sl.No.B6iiic.");
    /* 724 — 115AD(1)(b)(ii) STCG (FII) ≤ A5e */
    A(724,siInc("5ADii")<=A5e+1,"Schedule SI: the income u/s 115AD(1)(b)(ii) cannot be more than the income offered in Schedule CG at Sl.No.A5e.");
    /* 725 — 115AD(1)(b)(iii) LTCG (FII) ≤ B6ivc */
    A(725,siInc("5ADiii")<=b6c("5ADiii")+1,"Schedule SI: the income u/s 115AD(1)(b)(iii) cannot be more than the income offered in Schedule CG at Sl.No.B6ivc.");
    /* 726 — 115AD(1)(b)(iii)-Proviso LTCG (NR, STT paid) ≤ B7 */
    A(726,siInc("5ADiiiP")<=B7+1,"Schedule SI: the income u/s 115AD(1)(b)(iii)-Proviso cannot be more than the income offered in Schedule CG at Sl.No.B7.");
    /* 727 — PTI STCG @20% ≤ A8a */
    A(727,siInc("PTI_STCG20P")<=A8a+1,"Schedule SI: the pass-through STCG chargeable @20% cannot be more than the income offered in Schedule CG at Sl.No.A8a.");
    /* 728 — PTI STCG @30% ≤ A8b */
    A(728,siInc("PTI_STCG30P")<=A8b+1,"Schedule SI: the pass-through STCG chargeable @30% cannot be more than the income offered in Schedule CG at Sl.No.A8b.");
  }
});
