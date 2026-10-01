/* =====================================================================
   ITR-5 · Section "tax" (screen 17, compute order 60 — LAST).
   Books: books/ITR-5/PARTB_TI_TTI.md  (the Part B-TI aggregation and the
          Part B-TTI tax ladder), books/ITR-5/Tax_N.md  (THE AUTHORITATIVE
          LIVE tax engine — 4% cess, replicated here). books/ITR-5/Tax.md
          is the LEGACY 3%-cess sheet and is NOT replicated (its cess is
          stale — cess here is 4%).
   Schema blocks exported/imported: PartB-TI, PartB_TTI (incl. the refund
          bank accounts AddtnlBankDetails[] and foreign ForeignBankDetails[]).

   This is the Part B roll-up for an ENTITY return (firm / LLP / local
   authority / co-op society / AOP / BOI / AJP / business trust / investment
   fund).  It reads every head via the S.C.<head> convention (guarded), the
   loss set-off (S.C.loss), Chapter VI-A + 10AA (S.C.ded), special-rate
   income/tax (S.C.si), AMT + 115JD credit (S.C.amt), foreign-tax relief
   (S.C.fa.dtaa / .notDtaa — read LIVE, never a dead field), taxes paid and
   the challans (S.C.paid), and the net agricultural income (S.C.ei.netAgri).
   It computes Total Income, then tax by assessee sub-status (Tax(N) method:
   firm/LA flat 30%, co-op 10/20/30% or 115BAD 22% / 115BAE 15%+22%, AOP/BOI
   slab or 115BAC + MMR + member-share cases, AJP slab, business trust /
   investment fund 30%), surcharge (12%/15% base, >₹1cr trigger, 25% on
   115BBE, 15% cap on 111A/112/112A, marginal relief), HEALTH-AND-EDUCATION
   CESS AT 4%, AMT-vs-normal higher-of, §115JD credit, §90/90A + §91 relief,
   §234A/B/C interest + §234F fee, taxes paid, payable / refund, and the
   refund bank accounts + foreign-asset flag.
   It SETS the footer contract S.C.{gti, ti, tax, int}.
   Rule 2: every formula is ITR-5's own (Tax(N) / Part B-TI TTI), never
   ported from another form; cross-reads are guarded ((S.C.x||{}).y||0).
   ===================================================================== */

/* ---- state (my namespace S.tax) ---- */
S.tax = S.tax || {};
if(!Array.isArray(S.tax.banks))  S.tax.banks=[];   /* Refund.BankAccountDtls.AddtnlBankDetails[] */
if(!Array.isArray(S.tax.fbanks)) S.tax.fbanks=[];  /* Refund.BankAccountDtls.ForeignBankDetails[] */
if(S.tax.bankFlag==null) S.tax.bankFlag="Y";       /* Refund.BankAccountDtls.BankDtlsFlag (Y/N) */
if(S.tax.faFlag==null)   S.tax.faFlag="";          /* AssetOutsideIndiaFlg override (YES/NO) — else driven by S.C.fa.hasFA */
SEED["tax.banks"]  = SEED["tax.banks"]  || {refund:"Y"};
SEED["tax.fbanks"] = SEED["tax.fbanks"] || {};

/* Type of account dropdown (K112:K117, sheet9.TypeofAccount_list) → schema AccountType enum */
const TAX_ACCTYPE=[["SB","Savings Account"],["CA","Current Account"],["CC","Cash Credit Account"],
  ["OD","Over draft account"],["NRO","Non Resident Account"],["CGAS","Capital Gains Accounts Scheme"],["OTH","Other"]];

/* the utility's advance-tax instalment cutoffs (Tax(N) §234C): 15 Jun · 15 Sep · 15 Dec · 15 Mar;
   the 16-31 Mar window is the fifth slot */
const TAX_Q_CUT=[new Date(2025,5,15),new Date(2025,8,15),new Date(2025,11,15),new Date(2026,2,15)];

/* ---- assessee classification (Tax(N) groups: MainStatus[0] × SubStatus[0]) ----
   S.pi.status carries the schema StatusOrCompanyType code (1=Firm, 2=Local
   Authority, 14=AOP/BOI, 9=AJP); the utility's MainStatus first char is
   1/2/3/4 respectively. */
function taxStatus(){
  const st=st0(S.pi.status)||"1";
  const sub=st0(S.pi.substatus);
  const subC=sub?sub.charAt(0):"";
  const mainGrp = st==="1"?1 : st==="2"?2 : st==="14"?3 : st==="9"?4 : 1;
  const busTrust = (S.fs.busTrust==="Y") || (mainGrp===3 && subC==="4");
  const invFund  = (S.fs.invFund==="Y")  || (mainGrp===3 && subC==="5");
  const isCoop   = mainGrp===3 && (subC==="1"||subC==="3");
  const coop115BAD = isCoop && (S.fs.newTaxRegime==="Y");
  const coop115BAE = isCoop && (S.fs.baeYes==="Y"||S.fs.baeNo==="Y");

  /* ---- §167B AOP/BOI member analysis (Tax(N) member cases O36:O40, C19/C27) ----
     For an "Any other AOP/BOI" (sub-status 7 — the utility's GrpsB.4 member-case
     group; co-op 1/3, society 2, business trust 4, investment fund 5 and trust 6
     are handled by their own branches), the tax is not the ordinary slab when
     s.167B bites. The utility reads Question B/C/D of PART A-GENERAL(2) and Table E,
     captured by gen.js into S.pm:
       · B  PartnerForeignCompFlg          → S.pm.bForeign  ("YES" = a member is a foreign company)
       · C  PercentageOfShareForeignComp   → S.pm.cPct      (that foreign company's % share; Tax(N) R2)
       · D  TotIncFrmMemberOfAop           → S.pm.dExceeds  ("Y" = some member's total income, excl. the AOP share, exceeds the basic exemption)
       · Table E SharePercentage           → S.pm.members[].share (Tax(N) T2 = SUM(share) >= 99.9 ⇒ determinate)
     s.167B triggers (→ maximum marginal rate) when ANY of:
       (2)(i)  a member's income exceeds the basic exemption (D = Yes),  OR
       (1)     the members' shares are indeterminate/unknown (share sum < 99.9%), OR
       (2)(ii) a member is a foreign company (B = Yes) — then that member's share is
               split out at the foreign-company rate (Tax(N) case 3, C27). */
  const PM=(typeof S.pm==="object"&&S.pm)?S.pm:{};
  const mem167=Array.isArray(PM.members)?PM.members:[];
  const shareSum=mem167.reduce((s,m)=>s+N(m&&m.share),0);
  const memForeign=st0(PM.bForeign).toUpperCase()==="YES";                       /* B — Tax(N) Q2 */
  const foreignPct=Math.max(0,Math.min(100,N(PM.cPct)));                         /* C — Tax(N) R2 */
  const memExceeds=st0(PM.dExceeds).toUpperCase()==="Y";                         /* D — Tax(N) S2 */
  const sharesIndet=mem167.length>0 && shareSum<99.9;                            /* !T2 — 167B(1) */
  const mmr167B=memForeign||memExceeds||sharesIndet;                             /* s.167B condition met */
  const foreignSplit=memForeign && foreignPct>0;                                 /* Tax(N) case 3 (C27) */

  /* the taxing "kind" of the total income */
  let kind;
  if(mainGrp===1||mainGrp===2)      kind="flat30";                 /* firm / LLP / local authority — flat 30% (C7) */
  else if(mainGrp===3){
    if(busTrust||invFund)           kind="flat30";                 /* business trust / investment fund — flat 30% (C46) */
    else if(isCoop)                 kind=coop115BAE?"coop_bae":(coop115BAD?"coop_bad":"coop");
    else if(subC==="6")             kind="mmr";                    /* trust other than ITR-7 → maximum marginal rate 30% (C19) */
    else if(subC==="7")             kind = mmr167B?(foreignSplit?"mmr_fsplit":"mmr"):"slab"; /* any other AOP/BOI — §167B: MMR / foreign-split, else slab (C19/C27 vs C14:C18) */
    else                            kind="slab";                   /* society (2) → ordinary AOP slab (C14:C18) */
  } else                            kind = subC==="2"?"flat30":"slab"; /* AJP: estate-of-insolvent 30%, else slab (C34:C45) */
  return {st,sub,subC,mainGrp,kind,busTrust,invFund,isCoop,coop115BAD,coop115BAE,
    mmr167B,foreignSplit,foreignPct,memForeign,memExceeds,sharesIndet};
}

/* basic exemption (getExemption): only AOP/BOI/AJP on the slab get one; firm/LA/co-op get nil */
function taxExemptionLimit(TS){
  if(TS.kind==="slab") return isNew()?400000:250000;               /* 115BAC 4L / old 2.5L (W4) */
  return 0;
}
/* the slab bands for the slab-based statuses (AOP/BOI & AJP) */
function taxSlabBands(){
  const SLAB_NEW=[[400000,0],[800000,5],[1200000,10],[1600000,15],[2000000,20],[2400000,25],[Infinity,30]]; /* 115BAC C18 */
  const SLAB_OLD=[[250000,0],[500000,5],[1000000,20],[Infinity,30]];                                        /* AOP/BOI old C14:C17 */
  return isNew()?SLAB_NEW:SLAB_OLD;
}
function slabWalk(inc,bands){let t=0,l=0;for(const b of bands){const u=b[0],r=b[1];if(inc>l)t+=(Math.min(inc,u)-l)*r/100;l=u;if(inc<=u)break;}return R(t);}
/* co-operative-society old-regime slab: 10% ≤10k / 20%+1000 ≤20k / 30%+3000 >20k (C10:C12) */
function coopSlab(inc){const b=[[10000,10],[20000,20],[Infinity,30]];return slabWalk(inc,b);}
/* tax on an income at the assessee's rate (special-case co-op/flat/mmr; slab otherwise).
   mfg = manufacturing business income (only used for §115BAE). */
function taxOnRate(inc,TS,mfg){
  inc=Math.max(0,R(inc));
  if(inc<=0)return 0;
  switch(TS.kind){
    case "flat30": case "mmr":   return R(inc*0.30);              /* MMR base = 30% (§167B / Tax(N) C19); surcharge + 4% cess added by the ladder */
    case "mmr_fsplit":{                                            /* §167B(2)(ii) foreign-company member — Tax(N) case 3 (C27) */
      const p=Math.max(0,Math.min(100,R(TS.foreignPct||0)));      /* R2 = PercentageOfShareForeignComp */
      return R(inc*(p/100)*0.35)+R(inc*((100-p)/100)*0.30);}      /* 35% on the foreign share, 30% (MMR) on the balance */
    case "coop":                 return coopSlab(inc);
    case "coop_bad":             return R(inc*0.22);                       /* §115BAD 22% */
    case "coop_bae":{const m=Math.max(0,Math.min(R(mfg||0),inc));         /* §115BAE 15% mfg + 22% other */
                     return R(m*0.15)+R((inc-m)*0.22);}
    default:                     return slabWalk(inc,taxSlabBands());      /* AOP/BOI & AJP slab */
  }
}

/* graduated surcharge rate at a given total income, by assessee (Tax(N) M2:M8 / C120) */
function surchargeRate(ti,TS){
  ti=Math.max(0,R(ti));
  if(TS.mainGrp===1||TS.mainGrp===2)                      /* firm / LLP / local authority — 12% only above ₹1 cr */
    return ti>10000000?12:0;
  if(TS.isCoop){
    if(TS.coop115BAD||TS.coop115BAE) return ti>0?10:0;    /* §115BAD/BAE co-op — flat 10% */
    return ti>100000000?12 : ti>10000000?7 : 0;           /* co-op — 7% (₹1-10cr), 12% (>₹10cr) */
  }
  /* AOP/BOI (non-coop, incl. business trust/investment fund) & AJP — graduated ladder */
  let r = ti>50000000?37 : ti>20000000?25 : ti>10000000?15 : ti>5000000?10 : 0;
  if(isNew()&&r>25) r=25;                                 /* §115BAC caps the 37% band at 25% (M4/M8) */
  return r;
}

/* ---- the engine: rolls up Part B and sets the whole S.C tax contract ---- */
function engTax(){
  const TS=taxStatus();

  /* ===== Part B-TI — head-wise income (each floored, book L4-L32) ===== */
  const HP=(S.C.hp||{}), BP=(S.C.bp||{}), CG=(S.C.cg||{}), OS=(S.C.os||{});
  const item1=Math.max(0,R(HP.income||0));                                       /* 1  = MAX(0,HP) (L4) */

  /* 2 — PGBP: 2i non-spec (A37), 2ii speculative, 2iii specified, 2iv special-rate 115BBF/G/H (J6-J9) */
  const bpA=(BP.a||{}), bpE=(BP.e||{});
  const b2i =Math.max(0,R(bpA.A37!=null?bpA.A37:(BP.noSpec!=null?BP.noSpec:BP.income||0)));
  const b2ii=Math.max(0,R(bpE.specRemain!=null?bpE.specRemain:(BP.spec||0)));
  const b2iii=Math.max(0,R(bpE.specifiedRemain!=null?bpE.specifiedRemain:(BP.specified||0)));
  const b2iv=Math.max(0,R(n0(BP.a3d)+n0(BP.a3e)+n0(BP.a3f)));                    /* 2iv (J9) = 115BBF+115BBG+115BBH of Sch BP (S.C.bp.a3d/e/f) */
  const b2v=Math.max(0,b2i+b2ii+b2iii+b2iv);                                     /* 2v (L10) — nil if the sum is a loss */

  /* 3 — capital gains from the CG E-table after set-off (J14-J24) */
  const cga=CG.after||{};
  const st20=Math.max(0,R(cga.st20||0)), st30=Math.max(0,R(cga.st30||0)), stApp=Math.max(0,R(cga.stApp||0)), stDTAA=Math.max(0,R(cga.stDTAA||0));
  const lt125=Math.max(0,R(cga.lt125||0)), ltDTAA=Math.max(0,R(cga.ltDTAA||0));
  const totST=st20+st30+stApp+stDTAA;   /* 3av (J18) = SUM(J14:J17), after current-year set-off (Sch CG Table E) */
  const totLT=lt125+ltDTAA;             /* 3biii (J24) = SUM(J21:J23), after current-year set-off (Sch CG Table E) */
  const cg3c=Math.max(0,totST+totLT);                                            /* 3c (L25) */
  const cgC2=R(CG.C2!=null?CG.C2:((CG.vda||{}).cg||0));                          /* 3d = VDA 115BBH (L26) */
  const cg3e=Math.max(0,cg3c+cgC2);                                             /* 3e (L27) */

  /* 4 — other sources: 4a normal, 4b special, 4c race horses; 4d = MAX(0,Σ) (J29-L32) */
  const os4a=Math.max(0,R(OS.posNormal!=null?OS.posNormal:(OS.netNormal!=null?OS.netNormal:(OS.normal||0))));
  const os4b=R(OS.special||0);
  const os4c=Math.max(0,R(OS.raceHorse!=null?OS.raceHorse:((OS.horse||{}).bal||0)));
  const os4d=Math.max(0,os4a+os4b+os4c);

  /* 5 — total head-wise income (1 + 2v + 3e + 4d) (L33) */
  const totalTI=R(item1+b2v+cg3e+os4d);

  /* ===== loss set-off (S.C.loss, guarded, LIVE): CYLA current-year (6), BFLA brought-forward (8) ===== */
  const L=(S.C.loss||{});
  /* 6 — current-year losses set off = Schedule CYLA total (2xvi + 3xvi + 4xvi).
     The loss engine publishes the ready scalar L.cylaTotal (= totHPset + totBusset
     + totOSset); fall back to the components. This is the figure rule A832's sibling
     A788 checks against Schedule CYLA. */
  const cyla=R(L.cylaTotal!=null?L.cylaTotal:
    ((L.totHPset||0)+(L.totBusset||0)+(L.totOSset||0)));                         /* 6 CurrentYearLoss (L34) */
  const balAfterCYLA=Math.max(0,totalTI-cyla);                                   /* 7 (L35) */
  /* 8 — brought-forward losses set off = Schedule BFLA (2xv + 3xv + 4xv), i.e. the
     brought-forward-loss total PLUS the unabsorbed-depreciation and 35(4) pools.
     The loss engine publishes the ready scalar L.bflaTotal (= totBFset + totDep +
     tot35); the components L.totBFset/L.totDep/L.tot35 are the fallback. (The old
     code read the non-existent L.totUnabsDep/L.tot35_4, dropping the depreciation
     and 35(4) columns so item 8 understated by the depreciation set-off — A797.) */
  const bfla=R(L.bflaTotal!=null?L.bflaTotal:
    ((L.totBFset||0)+(L.totDep||0)+(L.tot35||0)));                               /* 8 BroughtFwdLossesSetoff (L36) */
  /* 9 Gross total income = item 7 − item 8, nil if negative (the CBDT identity
     A798). This is derived from the head-wise ladder (item 5 = 1+2v+3e+4d) so it
     INCLUDES the special-rate incomes that sit outside the CYLA/BFLA loss chain
     (115BBH VDA, 115BB winnings, 111A/112/112A etc.). The loss engine's scalar
     L.gti is the BFLA col-5 total, which EXCLUDES those special incomes, so it must
     NOT be used here (that understated GTI — A798). */
  const gti=Math.max(0,R(balAfterCYLA-bfla));

  /* 10 — special-rate income under 111A/112/112A etc. included in GTI (S.C.si) (L38) */
  const SI=(S.C.si||{});
  const splInc=R(SI.totInc!=null?SI.totInc:(SI.TotSplRateInc||0));

  /* ===== Chapter VI-A + 10AA (S.C.ded, guarded) ===== */
  const DED=(S.C.ded||{});
  const viaPartB=Math.max(0,R(DED.partB!=null?DED.partB:(DED.TotPartBchapterVIA||0)));   /* 11a (J40) */
  const viaPartC=Math.max(0,R(DED.partC!=null?DED.partC:(DED.TotPartCchapterVIA||0)));   /* 11b (J41) */
  const viaCap=Math.max(0,gti-splInc);                                          /* capped at (9 − 10) */
  const viaTot=Math.max(0,Math.min(viaPartB+viaPartC,viaCap));                  /* 11c (L42) */
  const us10AA=Math.max(0,Math.min(R(DED.ded10AA!=null?DED.ded10AA:(DED.us10AA||0)),Math.max(0,gti-splInc-viaTot))); /* 12 (L43) — ded publishes ded10AA */

  /* 13 — total income = round-to-ten of MAX(0, GTI − 11c − 12) (L47) */
  const ti=Math.max(0,Math.round((gti-viaTot-us10AA)/10)*10);

  /* 14 — special-rate income in the total income (SI col i) (L48) */
  const splIncInTI=Math.min(splInc,ti);
  /* 15 — net agricultural income for rate, only when > ₹5,000 (S.C.ei.netAgri) (L49) */
  const agriRaw=R((S.C.ei||{}).netAgri||0);
  const agri=agriRaw>5000?agriRaw:0;

  /* ===== tax on total income (Part B-TTI 2), by assessee sub-status ===== */
  const normalInc=Math.max(0,ti-splIncInTI);
  const exempt=taxExemptionLimit(TS);
  const mfgInc=R((BP.a||{}).A37!=null?(BP.a||{}).A37:(BP.income||0));            /* manufacturing base for §115BAE */
  const aggFlag=(TS.kind==="slab") && normalInc>exempt && agri>5000;            /* partial integration applies (L50) */
  const normalTax=taxOnRate(aggFlag?normalInc+agri:normalInc,TS,mfgInc);        /* 2a (J59) */
  const agriRebate=aggFlag?taxOnRate(exempt+agri,TS,mfgInc):0;                  /* 2c (C96 / J61) */
  const splTax=R(SI.totTax!=null?SI.totTax:(SI.TotSplRateIncTax||0));           /* 2b (J60) */
  const taxOn=Math.max(0,normalTax+splTax-agriRebate);                          /* 2d (L62) */

  /* 2e — surcharge: 25% flat on 115BBE, graduated on the rest, 15% cap on 111A/112/112A, marginal relief */
  const bbeTax=R(SI.bbeTax||0), cgDivTax=R(SI.cgDivTax||0);                      /* 115BBE tax; 111A/112/112A tax (guarded) */
  const scr=surchargeRate(ti,TS), capRate=Math.min(scr,15);
  const surI=R(bbeTax*0.25);                                                    /* 2e-i (J65/J69) — statutory 25% on 115BBE */
  let surIIraw=R(Math.max(0,taxOn-bbeTax-cgDivTax)*scr/100 + cgDivTax*capRate/100); /* 2e-ii/iii before marginal relief */
  /* marginal relief — compare against each surcharge threshold applicable to this assessee */
  const thresholds = (TS.mainGrp===1||TS.mainGrp===2)?[10000000]
    : TS.isCoop?[10000000,100000000]
    : [5000000,10000000,20000000,50000000];
  const taxSurAt=(tiTest)=>{
    const nInc=Math.max(0,tiTest-Math.min(splInc,tiTest));
    const nTax=taxOnRate(aggFlag?nInc+agri:nInc,TS,mfgInc);
    const aReb=aggFlag?taxOnRate(exempt+agri,TS,mfgInc):0;
    const tOn=Math.max(0,nTax+splTax-aReb);
    const sc=surchargeRate(tiTest,TS), cap=Math.min(sc,15);
    const s2=R(Math.max(0,tOn-bbeTax-cgDivTax)*sc/100 + cgDivTax*cap/100);
    return {tOn, sur:R(bbeTax*0.25+s2)};
  };
  let mr=0;
  thresholds.forEach(th=>{ if(ti>th){
    const cut=taxSurAt(th);
    const relief=Math.max(0,(taxOn+surI+surIIraw)-(cut.tOn+cut.sur)-(ti-th));
    if(relief>mr)mr=relief;
  }});
  const surII=Math.max(0,surIIraw-mr);                                          /* 2e-ii/iii after marginal relief */
  const sur=R(surI+surII);                                                      /* 2eiv (L72) */
  const noCess=R(SI.noCess||0);                                                 /* special incomes on which cess is not levied (AE25) */
  const cess=R(Math.max(0,taxOn-noCess+sur)*0.04);                             /* 2f — HEALTH & EDUCATION CESS AT 4% (AR113) */
  const grossTaxLiability=R(taxOn+sur+cess);                                    /* 2g (L74) */

  /* ===== AMT (S.C.amt, guarded) — 115JC on deemed total income; higher-of vs normal ===== */
  const AM=(S.C.amt||{});
  const amt115JC=R(AM.amt!=null?AM.amt:(AM.TaxPayableUnderSec115JC||0));         /* 1a (L54) */
  const amtSur  =R(AM.sur!=null?AM.sur:0);                                       /* 1b (L55) */
  const amtCess =AM.cess!=null?R(AM.cess):R((amt115JC+amtSur)*0.04);            /* 1c — 4% (L56) */
  const amtTotal=R(AM.total!=null?AM.total:(amt115JC+amtSur+amtCess));           /* 1d TotalTax_DI (L57) */
  const amtAdjusted=R(AM.adjusted!=null?AM.adjusted:(AM.AdjustedUnderSec115JC||0)); /* deemed TI → Part B-TI 18 */
  const amtApplies=amtTotal>0;

  /* 3 — gross tax payable = higher of 1d and 2g (L75) */
  const grossTaxPayable=Math.max(grossTaxLiability,amtTotal);
  /* 4 — §115JD credit, only when 2g > 1d (L76), and never in the new regime
     (A696). amt publishes the available pool as S.C.amt.creditAvail (Σ B3); the
     credit set off is capped at item 3 = MAX(0, 2i − 1d) = grossTaxLiability −
     amtTotal, mirroring amtcTable() so this item and Schedule AMTC agree. */
  const _amtcConc=(function(){var _r=(S.C&&S.C.regime)||{};return (_r.anyConc!=null)?!!_r.anyConc:isNew();})();  /* A820/A696: the 115JD credit cannot be set off under ANY concessional regime (115BAC/115BAD/115BAE), not just 115BAC */
  const credit=(!_amtcConc&&grossTaxLiability>amtTotal)
    ?Math.min(R(AM.creditAvail!=null?AM.creditAvail:0),Math.max(0,grossTaxLiability-amtTotal)):0;
  const afterCredit=Math.max(0,grossTaxPayable-credit);                         /* 5 (L77) */

  /* 6 — tax relief §90/90A (6a) and §91 (6b), read LIVE from the FA engine (never a dead field) */
  const FA=(S.C.fa||{});
  const rel90=R(FA.dtaa||0);                                                    /* 6a Section 90/90A — TR (J79) */
  const rel91=R(FA.notDtaa||0);                                                 /* 6b Section 91 — TR (J80) */
  const relief=R(rel90+rel91);                                                  /* 6c (L81) */
  const net=Math.max(0,R(afterCredit-relief));                                  /* 7 net tax liability (L82) */

  /* ===== taxes paid (S.C.paid, guarded) ===== */
  const P=(S.C.paid||{});
  const adv=R(P.adv||0), tds=R(P.tds||0), tcs=R(P.tcs||0), sat=R(P.sat||0);
  const paidTot=R(P.paid!=null?P.paid:(adv+tds+tcs+sat));

  /* ===== interest & fee (Tax(N) §234A/B/C, §234F, §234-I) ===== */
  const dueDate=(S.fs.duedate?new Date(S.fs.duedate+"T00:00:00"):null)||D(dmy(S.fs.duedate))||DUE;
  const filed=D(S.fs.filed);
  const late=!!(filed&&filed>dueDate);
  const challans=Array.isArray(P.challans)?P.challans:[];
  const isSAT=c=>!!c.sat;
  const satIn=(a,b)=>challans.filter(c=>isSAT(c)&&D(c.dt)&&D(c.dt)>=a&&D(c.dt)<=b).reduce((s,c)=>s+N(c.amt),0);

  /* 234A: net less advance/TDS/TCS/SAT-by-due, 1%/month, principal floored to 100 */
  const matchedSAT=satIn(new Date(2026,3,1),dueDate);
  let p234a=Math.max(0,net-adv-tds-tcs-matchedSAT); if(p234a>100)p234a=Math.floor(p234a/100)*100;
  const m234a=late?MPART(dueDate,filed):0;
  const i234a=R(p234a*0.01*m234a);

  /* 234F late fee (₹1,000 if TI ≤ ₹5L, else ₹5,000); 234-I revised-return fee (139(5)) */
  const f234f=late?(ti<=500000?1000:5000):0;
  const f234i=(+S.fs.sec===17)?Math.min(5000,R(N(S.tax.f234i))):0;

  /* 234C: quarterly shortfall on the 15/45/75/100% ladder (12/36 safe-harbour Q1/Q2), 1%/month */
  const gate234c = net>=10000;
  const upto=d=>challans.filter(c=>!isSAT(c)&&D(c.dt)&&D(c.dt)<=d).reduce((a,c)=>a+N(c.amt),0);
  const paidIn5=challans.filter(c=>!isSAT(c)&&D(c.dt)&&D(c.dt)>TAX_Q_CUT[3]&&D(c.dt)<=YREND).reduce((a,c)=>a+N(c.amt),0);
  const amtCase=amtApplies&&amtTotal>grossTaxLiability;
  /* s.234C "tax due on the returned income" = tax chargeable less TDS/TCS, s.89/90/91 relief and the
     s.115JAA/115JD credit. `net` (item 7) is already MAX(normal,AMT) less credit less relief, so the
     base is net - TDS - TCS — the same basis as 234B below. Subtracting relief/credit again here
     double-counted them and understated the 234C shortfall. */
  const assessed234c=Math.max(0,net-tds-tcs);
  const QDEF=[[0.15,0.12,3],[0.45,0.36,3],[0.75,null,3],[1,null,1]];
  const qs=QDEF.map((q,k)=>{const pc=q[0],safe=q[1],mo=q[2];
    const need=Math.floor(assessed234c*pc/100)*100, got=upto(TAX_Q_CUT[k]);
    let sh=(safe!==null&&got>=Math.floor(assessed234c*safe/100)*100)?0:Math.floor(Math.max(0,need-got)/100)*100;
    if(!gate234c)sh=0;
    return {need,got:R(got),short:sh,mo,int:R(sh*0.01*mo)};});
  const q5base=amtCase?0:Math.max(0,assessed234c-Math.floor(assessed234c*1)); /* fifth slot: income arising 16-31 Mar (nil in the safe default) */
  const q5short=gate234c?Math.floor(Math.max(0,q5base-paidIn5)/100)*100:0;
  qs.push({need:R(q5base),got:R(paidIn5),short:q5short,mo:1,int:R(q5short*0.01)});
  const i234c=R(qs.reduce((a,q)=>a+q.int,0));

  /* 234B: 1%/month Apr→date-of-determination on the assessed-tax shortfall, principal floored to 100 */
  const assessedB=net-tds-tcs; let i234b=0, p234b=0, m234b=0;
  if(net>=10000 && assessedB>=10000 && adv<0.9*assessedB){
    p234b=Math.floor(Math.max(0,net-adv-tds-tcs)/100)*100;
    const end=filed||new Date();
    m234b=Math.min(24,MPART(new Date(2026,3,1),end)||1);
    i234b=R(p234b*0.01*m234b);
  }

  const intTotal=R(i234a+i234b+i234c+f234f+f234i);                              /* 8e (L89) */
  /* 9 — aggregate tax and interest liability = 7 + 8e (book L90 = ROUND(...,0), ₹1). */
  const aggregate=R(net+intTotal);                                           /* 9 (L90) — 7 + 8e, ₹1 */
  /* 11/12 — amount payable / refund. The utility rounds these to the nearest ₹10
     (§288B): L97 = ROUND(MAX(0, 9 − 10e), −1), L98 = ROUND(MAX(0, 10e − 9), −1).
     Reproduce that exactly for replica fidelity; rules A832/A833 (enc_20) compare
     against the same ₹10-rounded difference, so they hold with no residue. */
  const r10=x=>Math.round(R(x)/10)*10;
  const bal=aggregate-paidTot;
  const balance=r10(Math.max(0,bal));                                        /* 11 (L97) — ROUND(MAX(0, 9 − 10e), −1) */
  const refund=r10(Math.max(0,-bal));                                        /* 12 (L98) — ROUND(MAX(0, 10e − 9), −1) */

  /* ===== the refund bank accounts + the foreign-asset flag ===== */
  const hasFA=!!FA.hasFA;
  const faFlag=(hasFA||S.tax.faFlag==="YES")?"YES":"NO";                        /* AssetOutsideIndiaFlg (data-driven) */

  /* ===== publish the S.C contract ===== */
  S.C.gti=R(gti);
  S.C.ti=R(ti);
  S.C.tax={status:TS, regime:isNew()?"New":"Old", kind:TS.kind,
    item1,b2i,b2ii,b2iii,b2iv,b2v,st20,st30,stApp,stDTAA,totST,lt125,ltDTAA,totLT,cg3c,cgC2,cg3e,
    os4a,os4b,os4c,os4d,totalTI:R(totalTI),cyla,balAfterCYLA:R(balAfterCYLA),bfla,splInc,
    viaPartB,viaPartC,viaTot,us10AA,splIncInTI:R(splIncInTI),agri:R(agri),aggFlag,
    normalInc:R(normalInc),normalTax,agriRebate:R(agriRebate),splTax,taxOn:R(taxOn),
    scr,capRate,surI,surII:R(surII),mr:R(mr),sur:R(sur),bbeTax,cgDivTax,noCess,cess,
    gross:R(grossTaxLiability),grossPayable:R(grossTaxPayable),rebate:0,
    amtApplies,amtAdjusted:R(amtAdjusted)};
  S.C.amtOut={applies:amtApplies,amt:amt115JC,sur:amtSur,cess:amtCess,total:amtTotal,adjusted:R(amtAdjusted),credit:R(credit)};
  S.C.int={late,filed,dueDate,grossPayable:R(grossTaxPayable),credit:R(credit),afterCredit:R(afterCredit),
    rel90,rel91,relief,net,
    matchedSAT:R(matchedSAT),p234a:R(p234a),m234a,i234a,
    assessedB:R(assessedB),p234b:R(p234b),m234b,i234b,
    qs,i234c,amtCase,f234f,f234i:R(f234i),total:intTotal,aggregate,
    adv,tds,tcs,sat,paid:paidTot,balance,refund,hasFA,faFlag};
}

/* ---- renderer ---- */
function secTax(){
  const T=S.C.tax||{},I=S.C.int||{},AM=S.C.amtOut||{};
  const r=(n,l,v,o)=>row(l,cell(v),Object.assign({ref:n},o||{}));
  let h="";

  /* ===== Part B-TI ===== */
  h+=note("Part B is the roll-up. Every white figure here is picked up from another schedule — only the refund bank accounts, the two flags below and (for a revised return) the 234-I fee are keyed.");
  h+=sub("Part B-TI — Computation of total income");
  h+=r("1","Income from house property — 3 of Schedule HP (nil if loss)",T.item1||0);
  h+=sub("2 · Profits and gains from business or profession");
  h+=r("2i","Business other than speculative and specified — A37 of Schedule BP",T.b2i||0,{ind:1});
  h+=r("2ii","Speculative business — 3(ii) of Table E of BP (nil if loss)",T.b2ii||0,{ind:1});
  h+=r("2iii","Specified business — 3(iii) of Table E of BP (nil if loss)",T.b2iii||0,{ind:1});
  h+=r("2iv","Income at special rate — 3d, 3e, 3f of Schedule BP",T.b2iv||0,{ind:1});
  h+=r("2v","Total (2i + 2ii + 2iii + 2iv) — nil if loss",T.b2v||0,{cls:"tot"});
  h+=sub("3 · Capital gains");
  h+=r("3ai","Short term at 20% — 8ii of item E of CG",T.st20||0,{ind:1});
  h+=r("3aii","Short term at 30% — 8iii",T.st30||0,{ind:1});
  h+=r("3aiii","Short term at applicable rate — 8iv",T.stApp||0,{ind:1});
  h+=r("3aiv","STCG at DTAA rates — 8v",T.stDTAA||0,{ind:1});
  h+=r("3av","Total short term",T.totST||0,{cls:"tot"});
  h+=r("3bi","Long term at 12.5% — 8vi",T.lt125||0,{ind:1});
  h+=r("3bii","LTCG at DTAA rates — 8vii",T.ltDTAA||0,{ind:1});
  h+=r("3biii","Total long term (nil if loss)",T.totLT||0,{cls:"tot"});
  h+=r("3c","Sum of short-term and long-term (3av + 3biii, nil if loss)",T.cg3c||0);
  h+=r("3d","Capital gains at 30% u/s 115BBH — C2 of Schedule CG",T.cgC2||0);
  h+=r("3e","Total capital gains (3c + 3d)",T.cg3e||0,{cls:"tot"});
  h+=sub("4 · Income from other sources");
  h+=r("4a","Net income at normal rates — 6 of Schedule OS (nil if loss)",T.os4a||0,{ind:1});
  h+=r("4b","Income at special rate — 2 of Schedule OS",T.os4b||0,{ind:1});
  h+=r("4c","Owning & maintaining race horses — 8e of OS (nil if loss)",T.os4c||0,{ind:1});
  h+=r("4d","Total (4a + 4b + 4c)",T.os4d||0,{cls:"tot"});
  h+=r("5","Total of head-wise income (1 + 2v + 3e + 4d)",T.totalTI||0,{cls:"tot"});
  h+=r("6","Losses of the current year set off against 5 — Schedule CYLA",T.cyla||0);
  h+=r("7","Balance after set-off of current-year losses (5 − 6)",T.balAfterCYLA||0);
  h+=r("8","Brought-forward losses set off against 7 — Schedule BFLA",T.bfla||0);
  h+=r("9","Gross total income (7 − 8)",S.C.gti||0,{cls:"grand"});
  h+=r("10","Income at special rate under 111A/112/112A etc. included in 9",T.splInc||0);
  h+=r("11a","Part-B of Chapter VI-A",T.viaPartB||0,{ind:1});
  h+=r("11b","Part-C of Chapter VI-A",T.viaPartC||0,{ind:1});
  h+=r("11c","Total Chapter VI-A — limited to (9 − 10)",T.viaTot||0,{cls:"tot"});
  h+=r("12","Deduction u/s 10AA — total of Schedule 10AA",T.us10AA||0);
  h+=r("13","Total income (9 − 11c − 12)",S.C.ti||0,{cls:"grand",hint:"rounded to the nearest ten"});
  h+=r("14","Income in 13 at special rates — total of (i) of Schedule SI",T.splIncInTI||0);
  h+=r("15","Net agricultural income / other income for rate — 2v of Schedule EI",T.agri||0,{hint:"counted only if above ₹5,000"});
  h+=r("16","Aggregate income (13 − 14 + 15)",T.aggFlag?((S.C.ti||0)-(T.splIncInTI||0)+(T.agri||0)):0);
  h+=r("17","Losses of the current year carried forward — Schedule CFL",R(((S.C.loss||{}).cf||{}).total||(S.C.loss||{}).cfTotal||0));
  h+=r("18","Deemed total income under section 115JC — 3 of Schedule AMT",T.amtApplies?T.amtAdjusted:0);

  /* ===== Part B-TTI ===== */
  h+=sub("Part B-TTI — Computation of tax liability on total income");
  h+=sub("1 · Tax payable on deemed total income (Schedule AMT)");
  if(AM.applies){
    h+=r("1a","Tax under 115JC — 4 of Schedule AMT (18.5%, 9% for IFSC units)",AM.amt,{ind:1});
    h+=r("1b","Surcharge on 1a (if applicable)",AM.sur,{ind:1});
    h+=r("1c","Health & education cess at 4% on (1a + 1b)",AM.cess,{ind:1});
    h+=r("1d","Total tax on deemed total income (1a + 1b + 1c)",AM.total,{cls:"tot"});
  } else h+=note("Section 115JC / AMT does not arise — no adjusted-income liability is higher than the normal tax.");
  h+=sub("2 · Tax payable on total income");
  h+=r("2a","Tax at normal rates on 16 of Part B-TI",T.normalTax||0,{ind:1,hint:taxKindLabel(T.kind)});
  h+=r("2b","Tax at special rates — total of (ii) of Schedule SI",T.splTax||0,{ind:1});
  if(T.aggFlag)h+=r("2c","Rebate on agricultural income",-(T.agriRebate||0),{ind:1});
  h+=r("2d","Tax payable on total income (2a + 2b − 2c)",T.taxOn||0,{cls:"tot"});
  h+=sub("2e · Surcharge");
  h+=r("2ei","25% of 12(ii) of Schedule SI (section 115BBE)",T.surI||0,{ind:1});
  h+=r("2eii","10% / 15% as applicable on the special-rate income (capped at "+(T.capRate||0)+"%)",R((T.cgDivTax||0)*(T.capRate||0)/100),{ind:1});
  h+=r("2eiii","Surcharge at "+(T.scr||0)+"% on the balance income",R((T.surII||0)+(T.mr||0)-(T.cgDivTax||0)*(T.capRate||0)/100),{ind:1});
  if(T.mr)h+=r("—","Less: marginal relief",-(T.mr||0),{ind:1});
  h+=r("2eiv","Total surcharge",T.sur||0,{cls:"tot"});
  h+=r("2f","Health & education cess at 4% on (2d + 2eiv)",T.cess||0);
  h+=r("2g","Gross tax liability (2d + 2eiv + 2f)",T.gross||0,{cls:"tot"});
  h+=r("3","Gross tax payable — higher of 1d and 2g",I.grossPayable||0,{cls:"tot"});
  h+=r("4","Credit under 115JD of tax paid in earlier years (only if 2g > 1d)",-(I.credit||0));
  h+=r("5","Tax payable after credit (3 − 4)",I.afterCredit||0,{cls:"tot"});
  h+=sub("6 · Tax relief");
  h+=r("6a","Section 90 / 90A — 2 of Schedule TR",I.rel90||0,{ind:1});
  h+=r("6b","Section 91 — 3 of Schedule TR",I.rel91||0,{ind:1});
  h+=r("6c","Total (6a + 6b)",I.relief||0,{cls:"tot"});
  h+=r("7","Net tax liability (5 − 6c) — nil if negative",I.net||0,{cls:"grand"});
  h+=sub("8 · Interest and fee payable");
  h+=row("Date of filing the return",dte("fs.filed"),{req:1,hint:"due "+DISP(I.dueDate||DUE)});
  h+=r("8a","Interest for default in furnishing the return — 234A",I.i234a||0,{ind:1,hint:I.m234a?I.m234a+" month"+(I.m234a>1?"s":"")+" on "+RS(I.p234a||0):""});
  h+=r("8b","Interest for default in payment of advance tax — 234B",I.i234b||0,{ind:1,hint:I.m234b?I.m234b+" month"+(I.m234b>1?"s":"")+" on "+RS(I.p234b||0):""});
  h+=r("8c","Interest for deferment of advance tax — 234C",I.i234c||0,{ind:1,hint:I.amtCase?"on the alternate minimum tax":""});
  h+=r("8d","Fee for default in furnishing the return — 234F",I.f234f||0,{ind:1});
  h+=row("8da · Fee for furnishing a revised return — 234-I",(+S.fs.sec===17)?inp("tax.f234i",{n:1}):cell(0),{ref:"8da",ind:1});
  h+=r("8e","Total interest and fee (8a+8b+8c+8d+8da)",I.total||0,{cls:"tot"});
  h+=r("9","Aggregate liability (7 + 8e)",I.aggregate||0,{cls:"grand"});
  h+=sub("10 · Taxes paid");
  h+=r("10a","Advance tax",I.adv||0,{ind:1});
  h+=r("10b","TDS",I.tds||0,{ind:1});
  h+=r("10c","TCS",I.tcs||0,{ind:1});
  h+=r("10d","Self-assessment tax",I.sat||0,{ind:1});
  h+=r("10e","Total taxes paid (10a+10b+10c+10d)",I.paid||0,{cls:"tot"});
  h+=r("11","Amount payable — if 9 exceeds 10e, rounded to ten",I.balance||0,{cls:I.balance?"grand":"tot"});
  h+=r("12","Refund — if 10e exceeds 9, rounded to ten",I.refund||0,{cls:I.refund?"grand":"tot"});

  /* ===== refund bank accounts ===== */
  h+=sub("Bank accounts and refund");
  h+=row("Do you have a bank account in India?",sel("tax.bankFlag",GEN_YN,{blank:false}),{req:1,ref:"L104 · BankDtlsFlag",
    hint:"a non-resident with no Indian account may instead give one foreign account below"});
  h+=note("Report every bank account held in India at any time during the previous year (excluding dormant accounts). Tick at least one account for the refund credit.");
  h+=grid("tax.banks",[
    {k:"ifsc",h:"IFS code",t:"txt",w:"130px",max:11,req:1},
    {k:"name",h:"Name of the bank",t:"txt",w:"auto",req:1},
    {k:"acno",h:"Account number",t:"txt",w:"170px",req:1},
    {k:"type",h:"Type of account",t:"sel",w:"180px",req:1,opts:TAX_ACCTYPE},
    {k:"refund",h:"For refund",t:"chk",w:"90px"}],
    S.tax.banks,{min:"820px",empty:"No bank account entered.",add:"Add a bank account"});
  h+=row("Details of a foreign bank account (non-residents with no Indian account may give one)","",{ref:"row 120-122"});
  h+=grid("tax.fbanks",[
    {k:"swift",h:"SWIFT code",t:"txt",w:"150px",req:1},
    {k:"name",h:"Name of the bank",t:"txt",w:"auto",req:1},
    {k:"country",h:"Country of location",t:"sel",w:"220px",req:1,opts:GEN_COUNTRY},
    {k:"iban",h:"IBAN",t:"txt",w:"200px",req:1}],
    S.tax.fbanks,{min:"720px",empty:"No foreign bank account entered.",add:"Add a foreign bank account"});
  h+=row("Do you, at any time during the previous year, hold any asset located outside India / have signing authority in any foreign account / have income from any source outside India?",
    (I.hasFA?cell(0).replace(F(0),"YES"):sel("tax.faFlag",[["YES","Yes"],["NO","No"]])),
    {req:1,ref:"L126 · AssetOutsideIndiaFlg",
     hint:I.hasFA?"forced to YES — Schedule FA has rows; Schedule FA is mandatory":"if Yes, Schedule FA is mandatory"});

  return h;
}
function taxKindLabel(k){return {flat30:"flat 30%",mmr:"maximum marginal rate 30% (§167B)",
  mmr_fsplit:"§167B foreign-member split — 35% + MMR 30%",coop:"co-op slab 10/20/30%",
  coop_bad:"§115BAD 22%",coop_bae:"§115BAE 15% + 22%",slab:"slab rates"}[k]||"";}

/* ---- export ---- */
function expTax(j){
  const T=S.C.tax||{},I=S.C.int||{},AM=S.C.amtOut||{},L=S.C.loss||{};

  /* ---- Part B-TI ---- */
  put(j,"PartB-TI.IncomeFromHP",n0(T.item1));
  put(j,"PartB-TI.ProfBusGain.ProfGainNoSpecBus",n0(T.b2i));
  put(j,"PartB-TI.ProfBusGain.ProfGainSpecBus",n0(T.b2ii));
  put(j,"PartB-TI.ProfBusGain.ProfGainSpecifiedBus",n0(T.b2iii));
  put(j,"PartB-TI.ProfBusGain.IncChrgblTaxSplRate",n0(T.b2iv));
  put(j,"PartB-TI.ProfBusGain.TotProfBusGain",n0(T.b2v));
  put(j,"PartB-TI.CapGain.ShortTerm.ShortTerm20Per",n0(T.st20));
  put(j,"PartB-TI.CapGain.ShortTerm.ShortTerm30Per",n0(T.st30));
  put(j,"PartB-TI.CapGain.ShortTerm.ShortTermAppRate",n0(T.stApp));
  put(j,"PartB-TI.CapGain.ShortTerm.ShortTermSplRateDTAA",n0(T.stDTAA));
  put(j,"PartB-TI.CapGain.ShortTerm.TotalShortTerm",n0(T.totST));
  put(j,"PartB-TI.CapGain.LongTerm.LongTerm12_5Per",n0(T.lt125));
  put(j,"PartB-TI.CapGain.LongTerm.LongTermSplRateDTAA",n0(T.ltDTAA));
  put(j,"PartB-TI.CapGain.LongTerm.TotalLongTerm",n0(T.totLT));
  put(j,"PartB-TI.CapGain.ShortTermLongTermTotal",n0(T.cg3c));
  put(j,"PartB-TI.CapGain.CapGains30Per115BBH",n0(T.cgC2));
  put(j,"PartB-TI.CapGain.TotalCapGains",n0(T.cg3e));
  put(j,"PartB-TI.IncFromOS.OtherSrcThanOwnRaceHorse",n0(T.os4a));
  put(j,"PartB-TI.IncFromOS.IncChargblSplRate",n0(T.os4b));
  put(j,"PartB-TI.IncFromOS.FromOwnRaceHorse",n0(T.os4c));
  put(j,"PartB-TI.IncFromOS.TotIncFromOS",n0(T.os4d));
  put(j,"PartB-TI.TotalTI",n0(T.totalTI));
  put(j,"PartB-TI.CurrentYearLoss",n0(T.cyla));
  put(j,"PartB-TI.BalanceAfterSetoffLosses",n0(T.balAfterCYLA));
  put(j,"PartB-TI.BroughtFwdLossesSetoff",n0(T.bfla));
  put(j,"PartB-TI.GrossTotalIncome",n0(S.C.gti));
  put(j,"PartB-TI.IncChargeTaxSplRate111A112",n0(T.splInc));
  put(j,"PartB-TI.DeductionsUndSchVIADtl.PartBchapterVIA",n0(T.viaPartB));
  put(j,"PartB-TI.DeductionsUndSchVIADtl.PartCchapterVIA",n0(T.viaPartC));
  put(j,"PartB-TI.DeductionsUndSchVIADtl.TotDeductUndSchVIA",n0(T.viaTot));
  put(j,"PartB-TI.DeductionsUnder10Aor10AA",n0(T.us10AA));
  put(j,"PartB-TI.TotalIncome",n0(S.C.ti));
  put(j,"PartB-TI.IncChargeableTaxSplRates",n0(T.splIncInTI));
  put(j,"PartB-TI.NetAgricultureIncomeOrOtherIncomeForRate",n0(T.agri));
  put(j,"PartB-TI.AggregateIncome",n0(T.aggFlag?((S.C.ti||0)-(T.splIncInTI||0)+(T.agri||0)):0));
  put(j,"PartB-TI.LossesOfCurrentYearCarriedFwd",n0((L.cf&&L.cf.total)||L.cfTotal||0));
  if(T.amtApplies)put(j,"PartB-TI.DeemedTotIncSec115JC",n0(T.amtAdjusted));

  /* ---- Part B-TTI ---- */
  const CTL=j.PartB_TTI.ComputationOfTaxLiability;
  put(CTL,"TaxPayableOnDeemedTI.TaxDeemedTISec115JC",n0(AM.applies?AM.amt:0));
  put(CTL,"TaxPayableOnDeemedTI.Surcharge",n0(AM.applies?AM.sur:0));
  put(CTL,"TaxPayableOnDeemedTI.EducationCess",n0(AM.applies?AM.cess:0));
  put(CTL,"TaxPayableOnDeemedTI.TotalTax",n0(AM.applies?AM.total:0));
  put(CTL,"TaxPayableOnTI.TaxAtNormalRates",n0(T.normalTax));
  put(CTL,"TaxPayableOnTI.TaxAtSpecialRates",n0(T.splTax));
  put(CTL,"TaxPayableOnTI.RebateOnAgriInc",n0(T.agriRebate));
  put(CTL,"TaxPayableOnTI.TaxPayableOnTotInc",n0(T.taxOn));
  put(CTL,"TaxPayableOnTI.Surcharge25ofSI",n0(T.surI));
  put(CTL,"TaxPayableOnTI.Surcharge25ofSIBeforeMarginal",n0(T.surI));
  put(CTL,"TaxPayableOnTI.SurchargeOnTaxPayable",n0(T.surII));
  put(CTL,"TaxPayableOnTI.SurchargeOnTaxPayableBeforeMarginal",n0(T.surII+T.mr));
  put(CTL,"TaxPayableOnTI.TotalSurcharge",n0(T.sur));
  put(CTL,"TaxPayableOnTI.EducationCess",n0(T.cess));
  put(CTL,"TaxPayableOnTI.GrossTaxLiability",n0(T.gross));
  put(CTL,"GrossTaxPayable",n0(I.grossPayable));
  put(CTL,"CreditUS115JD",n0(I.credit));
  put(CTL,"TaxPaidUnderCredit",n0(I.afterCredit));
  put(CTL,"TaxRelief.Section90",n0(I.rel90));
  put(CTL,"TaxRelief.Section91",n0(I.rel91));
  put(CTL,"TaxRelief.TotTaxRelief",n0(I.relief));
  put(CTL,"NetTaxLiability",n0(I.net));
  put(CTL,"IntrstPay.IntrstPayUs234A",n0(I.i234a));
  put(CTL,"IntrstPay.IntrstPayUs234B",n0(I.i234b));
  put(CTL,"IntrstPay.IntrstPayUs234C",n0(I.i234c));
  put(CTL,"IntrstPay.LateFilingFee234F",Math.min(5000,n0(I.f234f)));
  if(I.f234i)put(CTL,"IntrstPay.FeeFurnish234I",Math.min(5000,n0(I.f234i)));
  put(CTL,"IntrstPay.TotalIntrstPay",n0(I.total));
  put(CTL,"AggregateTaxInterestLiability",n0(I.aggregate));

  /* ---- taxes paid, payable / refund ---- */
  if(I.adv)put(j,"PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax",n0(I.adv));
  if(I.tds)put(j,"PartB_TTI.TaxPaid.TaxesPaid.TDS",n0(I.tds));
  if(I.tcs)put(j,"PartB_TTI.TaxPaid.TaxesPaid.TCS",n0(I.tcs));
  if(I.sat)put(j,"PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax",n0(I.sat));
  put(j,"PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid",n0(I.paid));
  put(j,"PartB_TTI.TaxPaid.BalTaxPayable",n0(I.balance));
  put(j,"PartB_TTI.Refund.RefundDue",n0(I.refund));

  /* ---- 115TD carry-across (Part B-TTI Sr.13/14/15) — only when Schedule 115TD is present ---- */
  const td115=(S.C.other||{}).td||{};
  if(td115.on){
    const net12=n0(td115.net12), refund=n0(I.refund);
    put(j,"PartB_TTI.TaxPaid.NetTaxPayable115TD",net12);                    /* 13 L101 = Sch115TD Sr.12 NetPaybleRefble (rule 762) */
    put(j,"PartB_TTI.TaxPaid.TaxPayable115TD",Math.max(0,net12-refund));    /* 14 L102 = MAX(0, 13 - 12) (rule 816) */
    put(j,"PartB_TTI.TaxPaid.NetRefundAdjust",Math.max(0,refund-net12));    /* 15 L103 = MAX(0, 12 - 13) (rule 839) */
  }

  /* ---- refund bank accounts + the foreign-asset flag ---- */
  put(j,"PartB_TTI.Refund.BankAccountDtls.BankDtlsFlag",(S.tax.bankFlag==="N")?"N":"Y");
  const banks=(S.tax.banks||[]).filter(x=>st0(x.ifsc)||st0(x.name)||st0(x.acno)).map(x=>({
    IFSCCode:st0(x.ifsc).toUpperCase(),BankName:st0(x.name),
    BankAccountNo:st0(x.acno),AccountType:st0(x.type)||"SB",UseForRefund:(x.refund==="Y")?"true":"false"}));
  if(banks.length)j.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails=banks;
  const fbanks=(S.tax.fbanks||[]).filter(x=>st0(x.swift)||st0(x.name)||st0(x.iban)).map(x=>({
    SWIFTCode:st0(x.swift).toUpperCase(),BankName:st0(x.name),
    CountryCode:st0(x.country),IBAN:st0(x.iban)}));
  if(fbanks.length)j.PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails=fbanks;
  put(j,"PartB_TTI.AssetOutsideIndiaFlg",I.faFlag||"NO");
}

/* ---- import (inverse) ---- */
function impTax(I5){
  const read=[];
  const g=(o,p)=>{let x=o;for(const k of p.split(".")){if(x==null)return undefined;x=x[k];}return x;};
  const CTL=g(I5,"PartB_TTI.ComputationOfTaxLiability")||{};
  const f234i=g(CTL,"IntrstPay.FeeFurnish234I");
  if(f234i!=null){S.tax.f234i=nz(f234i);read.push("234-I fee (Part B-TTI)");}
  if(I5&&I5["PartB-TI"])read.push("Part B-TI (computed on import)");
  const RF=g(I5,"PartB_TTI.Refund.BankAccountDtls")||{};
  if(RF.BankDtlsFlag!=null)S.tax.bankFlag=(RF.BankDtlsFlag==="N")?"N":"Y";
  if(Array.isArray(RF.AddtnlBankDetails)){
    S.tax.banks=RF.AddtnlBankDetails.map(x=>({ifsc:x.IFSCCode,name:x.BankName,acno:x.BankAccountNo,
      type:x.AccountType,refund:(String(x.UseForRefund)==="true"||x.UseForRefund===true)?"Y":"N"}));
    read.push("refund bank accounts");
  }
  if(Array.isArray(RF.ForeignBankDetails)){
    S.tax.fbanks=RF.ForeignBankDetails.map(x=>({swift:x.SWIFTCode,name:x.BankName,country:x.CountryCode,iban:x.IBAN}));
    read.push("foreign bank account");
  }
  const fa=g(I5,"PartB_TTI.AssetOutsideIndiaFlg");
  if(fa!=null)S.tax.faFlag=st0(fa)||"";
  return read;
}

/* ---- checks (from the book's rules) ---- */
function chkTax(){
  const o=[],add=(l,t,m)=>o.push({lvl:l,t,m,sec:"tax"});
  const T=S.C.tax||{},I=S.C.int||{},AM=S.C.amtOut||{};

  /* AMT higher-of */
  if(AM.applies)
    add("ok","Alternate minimum tax applies","Tax under 115JC "+RS(AM.total)+" exceeds the normal tax "+RS(T.gross||0)+" — the higher figure is charged; "+RS(I.credit||0)+" of §115JD credit set off.");

  /* surcharge & cess */
  if((T.scr||0)>0)
    add("ok","Surcharge applies","Total income exceeds the threshold — surcharge at "+(T.scr||0)+"% ("+RS(T.sur||0)+")"+(T.mr?" after marginal relief of "+RS(T.mr):"")+".");
  if((T.gross||0)>0 && (T.cess||0)===0)
    add("warn","Cess is nil","Health & education cess computed at 4% is nil — check the tax base.");

  /* refund bank account */
  if(S.tax.bankFlag!=="N"){
    const banks=(S.tax.banks||[]).filter(x=>st0(x.ifsc)||st0(x.name)||st0(x.acno));
    if((I.refund||0)>0 && !banks.some(x=>x.refund==="Y"))
      add("err","No account nominated for the refund","A refund of "+RS(I.refund)+" is due but no bank account is ticked for the refund credit.");
    banks.forEach((x,i)=>{ if(st0(x.ifsc)&&!IFSC_RE.test(st0(x.ifsc).toUpperCase()))
      add("err","Bank account "+(i+1),"The IFS code is not a valid eleven-character code.");});
  }

  /* foreign-asset flag ↔ Schedule FA */
  if(I.hasFA)
    add("ok","Schedule FA is mandatory","A foreign asset / interest is held — the foreign-asset flag is set to Yes and Schedule FA must be filed.");

  /* balance / refund summary */
  if((I.balance||0)>0)add("ok","Balance payable",RS(I.balance)+" is payable, including "+RS(I.total)+" of interest and fee.");
  else if((I.refund||0)>0)add("ok","Refund due",RS(I.refund)+" will be credited to the nominated bank account.");
  if(I.late&&((I.i234a||0)+(I.f234f||0))>0)
    add("warn","Filed after the due date","Interest and fee of "+RS(I.total)+" arise because the return is filed after "+DISP(I.dueDate||DUE)+".");

  return o;
}

/* ---- register (compute order 60 — LAST, after paid=58, amt=54, si=52, ded=50, loss=46) ---- */
reg({id:"tax", t:"Part B — total income and tax", ref:"Part B-TI · Part B-TTI",
  f:secTax, s:()=>(S.C.tax&&S.C.tax.gross)?("Tax "+CR((S.C.int&&S.C.int.net)||0)):"Part B-TI and Part B-TTI",
  eng:engTax, exp:expTax, imp:impTax, chk:chkTax, order:60, corder:60});
