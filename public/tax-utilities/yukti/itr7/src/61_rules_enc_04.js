/* =====================================================================
   ITR-7 · A.Y. 2026-27 — Category-A validation rules, batch enc_04 (Phase 6).
   Serial range A159–A208 (all ENFORCED per books/ITR-7/rule_census.md). Blocks:
     · Schedule VC  — anonymous-donations 115BBC arithmetic + corpus splits and
                      the exemption-section gate (A159, A164–A168).
     · Schedule IE-1..IV — total-receipts ≥ Schedule-VC contributions, the
                      exemption-section gate per regime, objective (EDU/MED) and
                      the receipt / government-grant thresholds (A160–A163,
                      A170–A178).
     · Schedule HP  — the 1a→1j House-property ladder, share/co-owner and the
                      24(b) interest checks (A179–A195).
     · Schedule CG  — the balance / expenses-u/s-48 / grand-total identities of
                      Short- and Long-term capital gains (A196–A208).
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this return is
   lawful" assertion — is FALSE. Every read is guarded (RG / (X||{}) / N()) and
   each schedule-scoped block enters only under `if(<block present>)` so it stays
   silent when the schedule is absent (e.g. the lawful u/s-11 trust in
   tests/ITR-7/state.js, which carries VC but no IE/HP/CG). Keys and enum codes
   were taken from sources/ITR-7/ITR-7_2026_Main_V0_1_schema.json and the built
   sections 70_sec_vc.js / 70_sec_ie.js / 70_sec_hp.js / 70_sec_cg.js; the
   arithmetic mirrors those engines exactly (R = Math.round; balances that the
   engine floors at nil are compared with the same Math.max(0,·) so a lawful
   floored figure never false-fires).

   The rules.json line-wrap offsets each serial's text by ~one physical line
   (rule n = tail of entry n + head of entry n+1); the assertions below are
   encoded to the RE-JOINED semantic rule, not the raw fragment.

   Serials in A159–A208 NOT encoded here, and why:
     A169 — re-filed OFFLINE-IMPOSSIBLE. "Corpus fund in Schedule VC = corpus
            fund received during the year in Schedule J" does NOT hold on the
            lawful reference return (VC corpus 20,00,000 vs Schedule J
            TotReceivedCorpus 0 — corpus there is carried as opening balance);
            a blocking equality would false-fire the lawful client. The VC↔J
            corpus linkage is reconciled via Schedule R / the portal, not a
            direct VC = J-received equality on the built return.
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0   = v=>v!=null&&String(v).trim()!=="";
  const inL  = (v,arr)=>arr.indexOf(v)>=0;
  const sumF = (arr,f)=>(arr||[]).reduce((s,r)=>s+(r?N(f(r)):0),0);

  /* ---- Part A-General: status / sub-status / exemption section ---- */
  const G1  = RG(I,"PartA_GEN1",{})||{};
  const OI  = RG(G1,"OrgFirmInfo",{})||{};
  const exsec = String(OI.SecExemptionClaimed==null?"":OI.SecExemptionClaimed);
  const ownPAN = String(RG(G1,"OrgFirmInfo.PAN","")||"").toUpperCase();

  /* exemption-code sets (schema enum SecExemptionClaimed) */
  const ANON_EX = ["11","23CIV","23CV","23CVI","23CVIA","23CIIIAD","23CIIIAE"];
  const IE1_EX  = ["21","2135I","23AAA","23B","23D","23DA","23EC","23ED","23EE",
                   "29A","46A","46B","47","23FB"];
  const IE2_EX  = ["23A","24"];
  const IE3_EX  = ["23CIIIAB","23CIIIAC"];
  const IE4_EX  = ["23CIIIAD","23CIIIAE"];

  /* ===================================================================
     Schedule VC — Voluntary contributions (A159, A164–A168)
     =================================================================== */
  const VC = RG(I,"ScheduleVC",null);
  const vcC = VC ? N(RG(VC,"TotalContribution",0)) : 0;
  const vcE = VC ? N(RG(VC,"AnonymousDonations.AnonymousDonationsOthr115BBC",0)) : 0;
  if(VC){
    const L  = RG(VC,"Local",{})||{};
    const Fo = RG(VC,"Foreign",{})||{};
    const AN = RG(VC,"AnonymousDonations",{})||{};
    const Di   = N(AN.AggregateAnonymousDonations);   /* Di  */
    const Dii  = N(AN.TotalDonationsReceived);         /* Dii */
    const Diii = N(AN.AnonymousDonations115BBC);       /* Diii */
    const Ecol = N(AN.AnonymousDonationsOthr115BBC);   /* E   */

    /* A159 — Diii = Di − Dii (chargeable @30%; floored at nil, per §115BBC). */
    A(159, Diii===Math.max(0,Di-Dii),
      "Schedule VC: anonymous donations chargeable u/s 115BBC (Diii) must equal Di − Dii (not below nil).");
    /* A164 — anonymous donations filled ⇒ exemption is 11 / 10(23C)(iv/v/vi/via) / (iiiad)/(iiiae). */
    A(164, N(Di)<=0 || inL(exsec,ANON_EX),
      "Schedule VC: anonymous donations u/s 115BBC can be reported only when exemption is claimed u/s 11 or 10(23C)(iv)/(v)/(vi)/(via)/(iiiad)/(iiiae).");
    /* A165 — A(i) domestic corpus = Aia + Aib. */
    A(165, N(L.CorpusFundDonation)===N(L.CorpusFundDonationUS80G2b)+N(L.CorpusFundDonationOther80G2b),
      "Schedule VC: domestic corpus donation A(i) must equal the sum of Aia + Aib.");
    /* A166 — B(i) foreign corpus = Bia + Bib. */
    A(166, N(Fo.CorpusFundDonation)===N(Fo.CorpusFundDonationUS80G2b)+N(Fo.CorpusFundDonationOther80G2b),
      "Schedule VC: foreign corpus contribution B(i) must equal the sum of Bia + Bib.");
    /* A167 — D(ii) = higher of 5% of (C + Di) or ₹1,00,000. */
    A(167, Dii===Math.max(R(0.05*(vcC+Di)),100000),
      "Schedule VC: D(ii) must equal 5% of total donations (C + Di) or ₹1,00,000, whichever is higher.");
    /* A168 — E = Di − Diii. */
    A(168, Ecol===Di-Diii,
      "Schedule VC: anonymous donations other than those at Diii (Sl. No. E) must equal Di − Diii.");
  }

  /* ===================================================================
     Schedule IE-1 .. IE-4 (A160–A163, A170–A178)
     =================================================================== */
  const IE1 = RG(I,"ScheduleIE_I",null);
  const IE2 = RG(I,"ScheduleIE_II",null);
  const IE3 = RG(I,"ScheduleIE_III",null);
  const IE4 = RG(I,"ScheduleIE_IV",null);
  const ie3Rows = IE3 ? (RG(IE3,"ScheduleIEIIIDtls",[])||[]) : [];
  const ie4Rows = IE4 ? (RG(IE4,"ScheduleIEIVDtls",[])||[]) : [];

  if(IE1){
    /* A160 — IE-1 Sl.1 total receipts ≥ Schedule VC total contributions (C). */
    A(160, N(IE1.TotRcptVoluntaryContr)>=vcC,
      "Schedule IE-1: total receipts including voluntary contributions (Sl. 1) cannot be less than the total contributions at Sl. C of Schedule VC.");
    /* A170 — IE-1 fillable only by the listed blanket-exemption regimes. */
    A(170, inL(exsec,IE1_EX),
      "Schedule IE-1 may be filled only by persons claiming exemption under 10(21)/(21 r.w.s.35), 10(23AAA), 10(23B), 10(23D), 10(23DA), 10(23EC), 10(23ED), 10(23EE), 10(29A), 10(46A), 10(46B), 10(47) or 10(23FB).");
  }
  if(IE2){
    /* A161 — IE-2 Sl.A1 total receipts ≥ Schedule VC total contributions (C). */
    A(161, N(IE2.TotRcptVoluntaryContr)>=vcC,
      "Schedule IE-2: total receipts including voluntary contributions (Sl. A1) cannot be less than the total contributions at Sl. C of Schedule VC.");
    /* A171 — IE-2 fillable only for exemption u/s 10(23A) or 10(24). */
    A(171, inL(exsec,IE2_EX),
      "Schedule IE-2 may be filled only by persons claiming exemption under Section 10(23A) or Section 10(24).");
  }
  if(IE3){
    /* A162 — IE-3 Sl.3 total receipts (Σ institutions) ≥ Schedule VC C. */
    A(162, sumF(ie3Rows,r=>r.TotRcptVoluntaryContr)>=vcC,
      "Schedule IE-3: total receipts including voluntary contributions (Sl. 3) cannot be less than the total contributions at Sl. C of Schedule VC.");
    /* A172 — IE-3 fillable only for exemption u/s 10(23C)(iiiab) or (iiiac). */
    A(172, inL(exsec,IE3_EX),
      "Schedule IE-3 may be filled only by persons claiming exemption under Section 10(23C)(iiiab) or 10(23C)(iiiac).");
    /* A177 — IE-3 government grants must exceed 50% of total receipts (else file another form). */
    A(177, ie3Rows.every(r=>!r || N(r.TotRcptVoluntaryContr)<=0 ||
        N(r.GovtGrants) > 0.5*N(r.TotRcptVoluntaryContr)),
      "Schedule IE-3: where government grants (Sl. 4) are ≤ 50% of total receipts (Sl. 3), the taxpayer must file a form other than ITR-7.");
  }
  if(IE4){
    /* A163 — IE-4 Sl.3 gross annual receipts ≥ Schedule VC C + E. */
    A(163, N(IE4.SumGrossAnnualReceipts)>=vcC+vcE,
      "Schedule IE-4: gross annual receipts (Sl. 3) cannot be less than the sum of the total contributions at Sl. C + E of Schedule VC.");
    /* A173 — IE-4 fillable only for exemption u/s 10(23C)(iiiad) or (iiiae). */
    A(173, inL(exsec,IE4_EX),
      "Schedule IE-4 may be filled only by persons claiming exemption under Section 10(23C)(iiiad) or 10(23C)(iiiae).");
    /* A176 — IE-4 gross annual receipts > ₹5 crore ⇒ file another form. */
    A(176, N(IE4.SumGrossAnnualReceipts)<=50000000,
      "Schedule IE-4: where the sum of gross annual receipts exceeds ₹5 crore, the taxpayer must file a form other than ITR-7.");
    /* A178 — IE-4 sum of gross annual receipts = Σ column-3 gross annual receipts. */
    A(178, N(IE4.SumGrossAnnualReceipts)===sumF(ie4Rows,r=>r.GrossAnnualReceipts),
      "Schedule IE-4: the sum of gross annual receipts must equal the total of column 3 (gross annual receipts) across the institutions.");
  }
  /* A174 — 10(23C)(iiiab)[IE-3] / (iiiad)[IE-4] ⇒ objective must be Education. */
  A(174,
    (exsec!=="23CIIIAB" || !IE3 || ie3Rows.every(r=>!r||r.ObjectiveOfInstitution==="EDU")) &&
    (exsec!=="23CIIIAD" || !IE4 || ie4Rows.every(r=>!r||r.ObjectiveOfInstitution==="EDU")),
    "Schedule IE-3/IE-4: when exemption is claimed u/s 10(23C)(iiiab) or 10(23C)(iiiad), the objective of the institution must be selected as 'Education'.");
  /* A175 — 10(23C)(iiiac)[IE-3] / (iiiae)[IE-4] ⇒ objective must be Medical. */
  A(175,
    (exsec!=="23CIIIAC" || !IE3 || ie3Rows.every(r=>!r||r.ObjectiveOfInstitution==="MED")) &&
    (exsec!=="23CIIIAE" || !IE4 || ie4Rows.every(r=>!r||r.ObjectiveOfInstitution==="MED")),
    "Schedule IE-3/IE-4: when exemption is claimed u/s 10(23C)(iiiac) or 10(23C)(iiiae), the objective of the institution must be selected as 'Medical'.");

  /* ===================================================================
     Schedule HP — House property (A179–A195)
     =================================================================== */
  const HP = RG(I,"ScheduleHP",null);
  if(HP){
    const props = RG(HP,"PropertyDetails",[])||[];
    const hpTotal = N(RG(HP,"TotalIncomeChargeableUnHP",0));
    const hpPti   = N(RG(HP,"PassThroghIncome",0));           /* item 2 */
    let sum1j = 0;
    props.forEach((p,i)=>{
      p = p||{};
      const rd = RG(p,"Rentdetails",{})||{};
      const a = N(rd.AnnualLetableValue);      /* 1a */
      const b = N(rd.RentNotRealized);         /* 1b */
      const c = N(rd.LocalTaxes);              /* 1c */
      const d = N(rd.TotalUnrealizedAndTax);   /* 1d */
      const e = N(rd.BalanceALV);              /* 1e */
      const f = N(rd.ThirtyPercentOfBalance);  /* 1f */
      const g = N(rd.IntOnBorwCap);            /* 1g */
      const hh= N(rd.TotalDeduct);             /* 1h */
      const ar= N(rd.ArrearsUnrealizedRentRcvd);/* 1i */
      const jj= N(rd.IncomeOfHP);              /* 1j */
      sum1j += jj;
      const s24  = RG(rd,"Section24B",null);
      const loans= s24 ? (RG(s24,"Section24BDtls",[])||[]) : [];
      const coFlg= String(p.PropCoOwnedFlg||"");
      const share= N(p.AssessePercentShareProp);
      const coRows = RG(p,"CoOwners",[])||[];

      /* A179 — 1d total = 1b + 1c. */
      A(179, d===b+c,
        "Schedule HP: the total of unrealized rent and taxes (1d) must equal 1b + 1c.");
      /* A180 — 1e annual value = 1a − 1d (floored at nil). */
      A(180, e===Math.max(0,a-d),
        "Schedule HP: the balance annual value (1e) must equal 1a − 1d.");
      /* A181 — standard deduction (1f) = 30% of the annual value (1e). */
      A(181, f===Math.max(0,R(0.30*e)),
        "Schedule HP: the standard deduction (1f) must equal 30% of the annual value (1e).");
      /* A182 — 1h total = 1f + 1g. */
      A(182, hh===f+g,
        "Schedule HP: the total deduction (1h) must equal 1f + 1g.");
      /* A183 — 1j income = 1e − 1h + 1i. */
      A(183, jj===e-hh+ar,
        "Schedule HP: income from house property (1j) must equal 1e − 1h + 1i.");
      /* A185 — gross rent / lettable value (1a) is nil ⇒ no municipal tax (1c). */
      A(185, a>0 || c===0,
        "Schedule HP: municipal tax cannot be claimed when the gross rent / annual lettable value (1a) is zero or null.");
      /* A186 — let-out / deemed let-out ⇒ gross rent (1a) cannot be nil. */
      A(186, !(p.ifLetOut==="Y"||p.ifLetOut==="D") || a>0,
        "Schedule HP: when the property is let out or deemed let out, the gross rent / annual lettable value (1a) cannot be zero or null.");
      /* A187 — first three characters of the tenant PAN/TAN must be alphabets
         (the CBDT TAN area-code master itself is resolved at the portal). */
      (RG(p,"TenantDetails",[])||[]).forEach(t=>{
        const v=String((t&&t.PANTANofTenant)||"");
        A(187, v==="" || /^[A-Za-z]{3}/.test(v),
          "Schedule HP: the first three characters of the tenant TAN must be valid alphabet codes.");
      });
      /* A188 — co-owned ⇒ assessee share + Σ co-owner shares = 100%. */
      A(188, coFlg!=="YES" || (share + sumF(coRows,x=>x.PercentShareProperty))===100,
        "Schedule HP: for a co-owned property the assessee's share plus all co-owners' shares must total 100%.");
      /* A189 — co-owned with zero assessee share ⇒ interest u/s 24(b) (1g) must be nil. */
      A(189, !(coFlg==="YES" && share===0) || g===0,
        "Schedule HP: when the assessee's share of a co-owned property is zero, interest on borrowed capital (1g) cannot exceed zero.");
      /* A190 — a co-owner's PAN cannot equal the assessee's own PAN. */
      A(190, coFlg!=="YES" || !ownPAN || coRows.every(x=>!x || String(x.PAN_CoOwner||"").toUpperCase()!==ownPAN),
        "Schedule HP: a co-owner's PAN cannot be the same as the assessee's own PAN.");
      /* A191 / A193 — interest u/s 24(b) claimed ⇒ Table 24(b) loan details furnished. */
      A(191, g<=0 || loans.length>0,
        "Schedule HP: details of the loan in Table 24(b) must be provided to claim interest on borrowed capital u/s 24(b).");
      A(193, g<=0 || loans.length>0,
        "Schedule HP: the details of interest on borrowed capital u/s 24(b) are mandatory to claim the deduction.");
      /* A192 — Σ row-wise interest u/s 24(b) = Total interest u/s 24(b). */
      A(192, !s24 || sumF(loans,l=>l.InterestUs24B)===N(s24.TotalInterestUs24B),
        "Schedule HP: the sum of the individual rows of interest on borrowed capital u/s 24(b) must equal the total interest u/s 24(b) in Table 24(b).");
      /* A194 — not co-owned ⇒ assessee share = 100%. */
      A(194, coFlg==="YES" || share===100,
        "Schedule HP: when the property is not co-owned, the assessee's share must be 100%.");
      /* A195 — rent that cannot be realized (1b) ≤ gross rent (1a). */
      A(195, b<=a,
        "Schedule HP: the amount of rent which cannot be realized cannot be more than the gross rent received/receivable/lettable value.");
    });
    /* A184 — item 3 head total = Σ 1j across properties + item 2 (pass-through). */
    A(184, hpTotal===R(sum1j+hpPti),
      "Schedule HP: income under the head 'Income from house property' (item 3) must equal Σ(1j) across all properties + item 2.");
  }

  /* ===================================================================
     Schedule CG — Capital gains (A196–A208)
     =================================================================== */
  const CG = RG(I,"ScheduleCG",null);
  if(CG){
    const ST = RG(CG,"ShortTermCapGain",{})||{};
    const LT = RG(CG,"LongTermCapGain",{})||{};
    const stLand = RG(ST,"SaleofLandBuild.SaleofLandBuildDtls",[])||[];
    const ltLand = RG(LT,"SaleofLandBuild.SaleofLandBuildDtls",[])||[];
    const stMF   = RG(ST,"EquityMFonSTT",[])||[];

    /* A196 — A1c balance (per land/building row) = aiii − biv (aiii = 50C value). */
    stLand.forEach(r=>{ r=r||{};
      A(196, N(r.Balance)===N(r.FullConsideration50C)-N(r.TotalDedn),
        "Schedule CG: STCG on land/building — the balance A1c must equal (aiii − biv).");
    });
    /* A197 — A2c slump-sale balance = 2aiii − 2b (full value − net worth). */
    {
      const s2 = RG(ST,"SlumpSaleInStcg",{})||{};
      A(197, N(s2.CapgainonAssets)===N(s2.FullConsideration)-N(s2.NetWorthOfDivision),
        "Schedule CG: STCG slump sale — the balance A2c must equal (2aiii − 2b).");
    }
    /* A208 — A3biv total (per land/building row) = bi + bii + biii.
       (Sl. A3 of STCG land/building; b = cost + improvement + expenditure.) */
    stLand.forEach(r=>{ r=r||{};
      A(208, N(r.TotalDedn)===N(r.AquisitCost)+N(r.ImproveCost)+N(r.ExpOnTrans),
        "Schedule CG: STCG — total deductions u/s 48 (A3 biv) must equal the sum of bi + bii + biii.");
    });

    /* --- A201–A207 · expenses u/s 48 (biv) cannot be claimed when the full
       value of consideration is not offered to tax (i.e. is nil). --- */
    const expMsg = "Schedule CG: expenses u/s 48 cannot be claimed when the full value of consideration is not offered to tax.";
    /* A201 — A1 land/building STCG (aiii = 50C value). */
    stLand.forEach(r=>{ r=r||{};
      A(201, N(r.FullConsideration50C)>0 || N(r.TotalDedn)===0, expMsg);
    });
    /* A202 — A3 EquityMFonSTT (a = full consideration). */
    stMF.forEach(m=>{ const dt=RG(m||{},"EquityMFonSTTDtls",{})||{};
      A(202, N(dt.FullConsideration)>0 || N(RG(dt,"DeductSec48.TotalDedn",0))===0, expMsg);
    });
    /* A203 — A5 NRI securities u/s 115AD (aiii = total consideration). */
    {
      const a5 = RG(ST,"NRISecur115AD",{})||{};
      A(203, N(a5.FullConsideration)>0 || N(RG(a5,"DeductSec48.TotalDedn",0))===0, expMsg);
    }
    /* A204 — A6 sale of other assets (aiii = total consideration). */
    {
      const a6 = RG(ST,"SaleOnOtherAssets",{})||{};
      A(204, N(a6.FullConsideration)>0 || N(RG(a6,"DeductSec48.TotalDedn",0))===0, expMsg);
    }
    /* A205 — B1 land/building LTCG (aiii = 50C value). */
    ltLand.forEach(r=>{ r=r||{};
      A(205, N(r.FullConsideration50C)>0 || N(r.TotalDedn)===0, expMsg);
    });
    /* A206 — B3 proviso 112 applicable (a = full consideration). */
    {
      const b3 = RG(LT,"Proviso112Applicable.Proviso112Applicabledtls",{})||{};
      A(206, N(b3.FullConsideration)>0 || N(RG(b3,"DeductSec48.TotalDedn",0))===0, expMsg);
    }
    /* A207 — B8 sale of assets where B1–B7 do not apply (aiii = total consideration). */
    {
      const b8 = RG(LT,"SaleofAssetNADtls.SaleofAssetNA",{})||{};
      A(207, N(b8.FullConsideration)>0 || N(RG(b8,"DeductSec48.TotalDedn",0))===0, expMsg);
    }

    /* A198 — A10 Total STCG = A1e+A2c+A3e+A4a+A4b+A5e+A6g+A7+A8−A9a+A(A). */
    {
      const a1e = sumF(stLand,r=>r.CapgainonAssets);
      const a2c = N(RG(ST,"SlumpSaleInStcg.CapgainonAssets",0));
      const a3e = sumF(stMF,m=>RG(m||{},"EquityMFonSTTDtls.CapgainonAssets",0));
      const a4a = N(RG(ST,"NRITransacSec48Dtl.NRItaxSTTPaid",0));
      const a4b = N(RG(ST,"NRITransacSec48Dtl.NRItaxSTTNotPaid",0));
      const a5e = N(RG(ST,"NRISecur115AD.CapgainonAssets",0));
      const a6g = N(RG(ST,"SaleOnOtherAssets.CapgainonAssets",0));
      const a7  = N(ST.TotalAmtDeemedStcg);
      const a8  = N(ST.PassThrIncNatureSTCG);
      const a9a = N(ST.TotalAmtNotTaxUsDTAAStcg);
      const aA  = N(RG(ST,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares",0));
      A(198, N(ST.TotalSTCG)===R(a1e+a2c+a3e+a4a+a4b+a5e+a6g+a7+a8-a9a+aA),
        "Schedule CG: A10 (Total Short-term Capital Gain) must equal A1e+A2c+A3e+A4a+A4b+A5e+A6g+A7+A8−A9a+A(A).");
    }
    /* A199 — B12 Total LTCG = B1g+B2e+B3c+B4+B5+B6c+B7+B8e+B9+B10−B11a+B(AA). */
    {
      const b1g = N(RG(LT,"SaleofLandBuild.TotalLTCGImmblPrprty",0));
      const b2e = N(RG(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg.CapgainonAssets",0));
      const b3c = N(RG(LT,"Proviso112Applicable.Proviso112Applicabledtls.BalanceCG",0));
      const b4  = N(RG(LT,"SaleOfEquityShareUs112A.SaleOfEquityShareUs112AAmt",0));
      const b5  = N(RG(LT,"NRIProvisoSec48.BalanceCG",0));
      const b6c = sumF(RG(LT,"NRIOnSec112and115.NRIOnSec112and115Dtls",[])||[],r=>r.BalanceCG);
      const b7  = N(RG(LT,"NRISaleOfEquityShareUs112A.NRISaleOfEquityShareUs112AAmt",0));
      const b8e = N(RG(LT,"SaleofAssetNADtls.SaleofAssetNA.CapgainonAssets",0));
      const b9  = N(LT.TotalAmtDeemedLtcg);
      const b10 = N(LT.PassThrIncNatureLTCG);
      const b11a= N(LT.TotalAmtNotTaxUsDTAALtcg);
      const bAA = N(RG(LT,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares",0));
      A(199, N(LT.TotalLTCG)===R(b1g+b2e+b3c+b4+b5+b6c+b7+b8e+b9+b10-b11a+bAA),
        "Schedule CG: B12 (Total Long-term Capital Gain) must equal B1g+B2e+B3c+B4+B5+B6c+B7+B8e+B9+B10−B11a+B(AA).");
    }
    /* A200 — C1 = Σ (8ii..8vii) of Table E (post-set-off current-year gains). */
    {
      const CY = RG(CG,"CurrYrLosses",{})||{};
      const c1 = N(RG(CY,"InStcg20Per.CurrYrCapGain",0))
               + N(RG(CY,"InStcg30Per.CurrYrCapGain",0))
               + N(RG(CY,"InStcgAppRate.CurrYrCapGain",0))
               + N(RG(CY,"InStcgDTAARate.CurrYrCapGain",0))
               + N(RG(CY,"InLtcg12_5Per.CurrYrCapGain",0))
               + N(RG(CY,"InLtcgDTAARate.CurrYrCapGain",0));
      A(200, N(CG.SumOfCGIncm)===R(c1),
        "Schedule CG: C1 must equal the sum of the current-year capital-gain amounts (8ii..8vii) of Table E after set-off.");
    }
  }
});
