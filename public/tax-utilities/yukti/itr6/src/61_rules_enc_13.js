/* =====================================================================
   ITR-6 · AY 2026-27 — Category-A validation rules, batch enc_13 (Phase 6).
   Serial range A607–A658 — Schedule 80LA, Schedule SI, Schedule EI.
   Registered via ruleset(fn); runRules() invokes it with (I,S_,A,Dd).
   A(n,cond,msg) fires (pushes a Category-A block) when cond — the "this
   return is lawful" assertion — is FALSE. Every read is guarded (RG / N /
   (X||{})); nothing throws. Keys are the built-return ITR6 schema paths
   (I = Object.values(buildReturn().ITR)[0]); verified against
   sources/ITR-6/ITR-6_2026_Main_V1_0_schema.json and the built sections
   (70_sec_ded / 70_sec_si / 70_sec_os / 70_sec_bp / 70_sec_cg /
   70_sec_loss / 70_sec_ei). Encoded from each rule's own text
   (constitution rule 6).

   Note on the Schedule-SI cross-schedule "should match … after reducing
   DTAA income, if any" / "should not be more than" rules (A612-A645): the
   SI head income is auto-populated as (source income − DTAA reduction), so
   on a lawful return SI[head] ≤ the gross figure in the feeding schedule.
   These are therefore encoded as the safe upper-bound  SI[head] ≤ source
   (with a ±1 tolerance): silent on every lawful return, fires only when
   the SI head OVER-states the feeding schedule. Pure arithmetic totals
   (A620/A621) and same-schedule identities use REQ (|a−b| ≤ 1).

   Serials in A607-A658 NOT encoded here, and why:
     A652, A653 — NA (census): "ensure Form 10-II / 10-IG/10-IK is filed"
            — a separate form, portal/advisory, nothing to check offline.
     A630, A631 — Schedule OS Sl.No. 2d / 2c reconciliation: an aggregate
            over an open-ended set of PTI / other-special SI heads whose
            exact 2c-vs-2d partition (and per-head DTAA/TRC note) is not a
            single schema leaf; left ENFORCED-target rather than risk a
            false positive by guessing the head partition.
     A646 — Schedule EI Sl.5 = "exempt income in Schedule PTI": Schedule
            PTI carries no single exempt-income total leaf; the sum spans
            IncClmdPTI sub-objects of ambiguous composition. Left
            ENFORCED-target rather than fake an equality (would false-fire).
   (Fields for A630/A631/A646 exist in the schema, so they are NOT
   OFFLINE-IMPOSSIBLE — they remain ENFORCED-target to be finished with a
   verified aggregation.)
   ===================================================================== */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  const S0=v=>v!=null&&String(v).trim()!=="";           /* "present / non-blank" */
  const arr=v=>Array.isArray(v)?v:[];

  /* =====================================================================
     Schedule 80LA — deduction for an Offshore Banking Unit / IFSC unit,
     and its two Schedule VI-A lines (Sl.No. 2d). Keys: Schedule80LADtls[]
     {SubSecDedClmd, IncmTypeUnt, AmtDedCurAY}; ScheduleVIA.*.Section80LA /
     Section80LA_1A. (books/ITR-6/80LA.md §5.)
     ===================================================================== */
  const la80=arr(RG(I,"Schedule80LA.Schedule80LADtls",[]));
  /* per-sub-section deduction subtotals (the "Sl.No.8" figures of A608/A610) */
  let sub80LA1=0, sub80LA1A=0;
  la80.forEach(function(r){ if(!r) return;
    if(r.SubSecDedClmd==="80LA(1)")  sub80LA1 += N(r.AmtDedCurAY);
    if(r.SubSecDedClmd==="80LA(1A)") sub80LA1A += N(r.AmtDedCurAY);
  });
  const via80LA1  = N(RG(I,"ScheduleVIA.UsrDeductUndChapVIA.Section80LA",0));
  const via80LA1A = N(RG(I,"ScheduleVIA.UsrDeductUndChapVIA.Section80LA_1A",0));

  if(I.Schedule80LA){
    /* A607 — type of income of the unit must be consistent with the
       sub-section: 80LA(1) is a banking unit (Offshore-banking / s.6(1) of
       the Banking Regulation Act, 1949); 80LA(1A) is an IFSC unit (IFSC
       income / transfer of a leased asset). */
    const INC1  =["OffshoreBnkng","Sec10Of1949"];
    const INC1A =["IFSCSplEcoZone","TnfrAsst1949"];
    la80.forEach(function(r,i){ if(!r) return;
      const sub=r.SubSecDedClmd, inc=r.IncmTypeUnt;
      const ok = !S0(inc) ||
        (sub==="80LA(1)"  ? INC1.indexOf(inc)>=0 :
         sub==="80LA(1A)" ? INC1A.indexOf(inc)>=0 : true);
      A(607, ok,
        "Schedule 80LA: row "+(i+1)+" — the type of income of the unit must match the sub-section under which the deduction is claimed (80LA(1) = offshore-banking unit; 80LA(1A) = IFSC unit).");
    });
  }

  /* A608 — 80-LA(1) value in Schedule VI-A (Sl.No.2d) cannot exceed the
     80LA(1) deduction in Schedule 80LA. */
  A(608, via80LA1 <= sub80LA1 + 1,
    "Schedule 80LA: the section 80-LA(1) deduction claimed in Schedule VI-A cannot be higher than the 80LA(1) amount in Schedule 80LA.");

  /* A609 — 80LA(1) claimed in VI-A but Schedule 80LA not filled. */
  A(609, !(via80LA1>0) || la80.length>0,
    "Schedule 80LA: section 80LA(1) deduction is claimed in Schedule VI-A but Schedule 80LA has not been filled.");

  /* A610 — 80-LA(1A) value in VI-A cannot exceed the 80LA(1A) amount here. */
  A(610, via80LA1A <= sub80LA1A + 1,
    "Schedule 80LA: the section 80-LA(1A) deduction claimed in Schedule VI-A cannot be higher than the 80LA(1A) amount in Schedule 80LA.");

  /* A611 — 80LA(1A) claimed in VI-A but Schedule 80LA not filled. */
  A(611, !(via80LA1A>0) || la80.length>0,
    "Schedule 80LA: section 80LA(1A) deduction is claimed in Schedule VI-A but Schedule 80LA has not been filled.");

  /* =====================================================================
     Schedule SI — income chargeable at special rates. SplCodeRateTax[] is
     keyed by the schema SecCode; SI[code] = SplRateInc (column i),
     SplRateIncTax (column ii). Totals TotSplRateInc / TotSplRateIncTax.
     ===================================================================== */
  if(I.ScheduleSI){
    const siRows=arr(RG(I,"ScheduleSI.SplCodeRateTax",[]));
    const siInc=function(code){ let t=0; siRows.forEach(function(r){ if(r&&r.SecCode===code) t+=N(r.SplRateInc); }); return t; };

    /* --- feeding-schedule source figures (guarded; default 0) --- */
    const OS_115BB  = N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.LtryPzzlChrgblUs115BB",0));
    const OS_115BBE = N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChrgblUs115BBE",0));
    const OS_115BBJ = N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChrgblUs115BBJ",0));
    const OS_2eDTAA = N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChargblSplRateOS.TotalAmtTaxUsDTAASchOs",0));
    const BP_115BBF = N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.UnderSec115BBF",0));
    const BP_115BBG = N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.IncRecCredPLOthHeadDtls.UnderSec115BBG",0));
    const BP_115BBH = N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.PLUs44sChapXIIGOthrUs115B",0));
    const CG_A9spl  = N(RG(I,"ScheduleCG.ShortTermCapGain.TotalAmtTaxUsDTAAStcg",0));
    const CG_B11spl = N(RG(I,"ScheduleCG.LongTermCapGain.TotalAmtTaxUsDTAALtcg",0));
    const CG_A4a    = N(RG(I,"ScheduleCG.ShortTermCapGain.NRITransacSec48Dtl.NRItaxSTTPaid",0));
    const CG_A5e    = N(RG(I,"ScheduleCG.ShortTermCapGain.NRISecur115AD.CapgainonAssets",0));
    const CG_B3c    = N(RG(I,"ScheduleCG.LongTermCapGain.Proviso112Applicable.Proviso112Applicabledtls.BalanceCG",0));
    const CG_B4     = N(RG(I,"ScheduleCG.LongTermCapGain.SaleOfEquityShareUs112A.CapgainonAssets",0));
    const CG_B7     = N(RG(I,"ScheduleCG.LongTermCapGain.NRISaleOfEquityShareUs112A.CapgainonAssets",0));
    const CG_A8a    = N(RG(I,"ScheduleCG.ShortTermCapGain.PassThrIncNatureSTCG20Per",0));
    const CG_A8b    = N(RG(I,"ScheduleCG.ShortTermCapGain.PassThrIncNatureSTCG30Per",0));
    const CG_B10a1  = N(RG(I,"ScheduleCG.LongTermCapGain.PassThrIncNatureLTCGUs112A12_5Per",0));
    const CG_B10a2  = N(RG(I,"ScheduleCG.LongTermCapGain.PassThrIncNatureLTCG12_5Per",0));
    /* CG A3ie / A3iie — EquityMFonSTT[] keyed by MFSectionCode */
    const emf=arr(RG(I,"ScheduleCG.ShortTermCapGain.EquityMFonSTT",[]));
    const CG_emf=function(code){ let v=0; emf.forEach(function(r){ if(r&&r.MFSectionCode===code) v+=N(RG(r,"EquityMFonSTTDtls.CapgainonAssets",0)); }); return v; };
    /* CG B6ic/iic/iiic/ivc — NRIOnSec112and115Dtls[] keyed by SectionCode */
    const nriSec=arr(RG(I,"ScheduleCG.LongTermCapGain.NRIOnSec112and115.NRIOnSec112and115Dtls",[]));
    const CG_nri=function(code){ let v=0; nriSec.forEach(function(r){ if(r&&r.SectionCode===code) v+=N(r.BalanceCG); }); return v; };
    /* Schedule BFLA — balance income of the head after set-off */
    const BFLA=function(head){ return N(RG(I,"ScheduleBFLA."+head+".IncBFLA.IncOfCurYrAfterSetOffBFLosses",0)); };
    const LE=function(si,src){ return N(si) <= N(src) + 1; };  /* safe upper bound */

    /* --- A612, A613, A616, A624/A627 : SI ≤ the OS feeding head (only when
       Schedule OS is present, so an absent source never false-fires). --- */
    if(I.ScheduleOS){
      A(612, LE(siInc("5BB"),  OS_115BB),
        "Schedule SI: 115BB (winnings from lotteries/puzzles/races/games) cannot exceed the corresponding income at Sl.No. 2a(i) of Schedule OS (net of DTAA).");
      A(613, LE(siInc("5BBE"), OS_115BBE),
        "Schedule SI: 115BBE (income u/s 68/69/69A/69B/69C/69D) cannot exceed the corresponding income at Sl.No. 2b of Schedule OS.");
      A(616, LE(siInc("DTAAOS"), OS_2eDTAA),
        "Schedule SI: income from other sources chargeable at special rates as per DTAA cannot exceed the corresponding income at Sl.No. 2e of Schedule OS.");
      A(624, LE(siInc("5BBJ"), OS_115BBJ),
        "Schedule SI: 115BBJ (winnings from online games) cannot exceed the corresponding income at Sl.No. 2a(ii) of Schedule OS (net of DTAA).");
      A(627, LE(siInc("5BBJ"), OS_115BBJ),
        "Schedule SI: 115BBJ (winnings from online games) cannot exceed the corresponding income at Sl.No. 2a(ii) of Schedule OS (net of DTAA).");
    }

    /* --- A614, A615, A623 : SI ≤ the Schedule-BP feeding head. --- */
    if(I.CorpScheduleBP){
      A(614, LE(siInc("5BBG_BP"), BP_115BBG),
        "Schedule SI: 115BBG (transfer of carbon credits — business/profession) cannot exceed the income at Sl.No. 3e of Schedule BP.");
      A(615, LE(siInc("5BBF_BP"), BP_115BBF),
        "Schedule SI: 115BBF (income from patent — business/profession) cannot exceed the income at Sl.No. 3d of Schedule BP.");
      A(623, LE(siInc("5BBH_BP"), BP_115BBH),
        "Schedule SI: 115BBH (income from transfer of virtual digital assets — business/profession) cannot exceed the income at Sl.No. 3f of Schedule BP.");
    }

    /* --- A617 : tax (col ii) = rate × income (col i), for every head EXCEPT
       the treaty-rate DTAA heads and the three ₹1,25,000-s.112A-exemption
       heads (2A / PTI-112A / 115AD(1)(b)(iii)-proviso), whose tax column is
       reduced below rate × income. --- */
    const A617_SKIP=["DTAASTCG","DTAALTCG","DTAAOS","2A","PTI_LTCG12_5P112A","5ADiiiP"];
    siRows.forEach(function(r){ if(!r||A617_SKIP.indexOf(r.SecCode)>=0) return;
      A(617, REQ(r.SplRateIncTax, Math.round(N(r.SplRateInc)*N(r.SplRatePercent)/100)),
        "Schedule SI: for head "+(r.SecCode||"?")+" the tax (column ii) must equal the special-rate percentage applied to the income (column i).");
    });

    /* --- A618 : tax (col ii) cannot be null when income (col i) > 0. --- */
    siRows.forEach(function(r){ if(!r) return;
      A(618, !(N(r.SplRateInc)>0) || (r.SplRateIncTax!=null && String(r.SplRateIncTax).trim()!==""),
        "Schedule SI: the tax computed (column ii) cannot be blank when the special-rate income (column i) is greater than zero.");
    });

    /* --- A619, A622, A628, A629 : SI head(s) ≤ the matching balance income
       after set-off in Schedule BFLA (only when Schedule BFLA is present). --- */
    if(I.ScheduleBFLA){
      /* A619 — 115AD STCG for FII (STT not paid) @30% + PTI-STCG @30% ≤ BFLA 5(vii). */
      A(619, LE(siInc("5ADii")+siInc("PTI_STCG30P"), BFLA("STCG30Per")),
        "Schedule SI: the sum of 115AD STCG for FIIs (STT not paid) and pass-through STCG chargeable @30% cannot exceed the balance income after set-off at Sl.No. 5(vii) of Schedule BFLA.");
      /* A622 — 115B life-insurance income ≤ BFLA 5(iii). */
      A(622, LE(siInc("5B"), BFLA("ProfGainUs115B")),
        "Schedule SI: 115B (income from life insurance business) cannot exceed the balance income after set-off at Sl.No. 5(iii) of Schedule BFLA.");
      /* A628 — 111A + 115AD(1)(b)(ii)-proviso + PTI-STCG @20% ≤ BFLA 5(vi). */
      A(628, LE(siInc("1A")+siInc("5AD1biip")+siInc("PTI_STCG20P"), BFLA("STCG20Per")),
        "Schedule SI: the sum of 111A / 115AD(1)(b)(ii)-proviso STCG and pass-through STCG chargeable @20% cannot exceed the balance income after set-off at Sl.No. 5(vi) of Schedule BFLA.");
      /* A629 — all LTCG heads chargeable @12.5% ≤ BFLA 5(x). */
      const ltcg125 = siInc("21ciii")+siInc("5AB1b")+siInc("5AC1c")+siInc("21")+siInc("22")
                    + siInc("2A")+siInc("5ADiii")+siInc("5ADiiiP")
                    + siInc("PTI_LTCG12_5P112A")+siInc("PTI_LTCG12_5P");
      A(629, LE(ltcg125, BFLA("LTCG12_5Per")),
        "Schedule SI: the sum of the long-term capital gains chargeable @12.5% cannot exceed the balance income after set-off at Sl.No. 5(x) of Schedule BFLA.");
    }

    /* --- A620 : total of income (col i) = sum of the head rows. --- */
    let totInc=0; siRows.forEach(function(r){ if(r) totInc+=N(r.SplRateInc); });
    A(620, REQ(RG(I,"ScheduleSI.TotSplRateInc",0), totInc),
      "Schedule SI: the total income (i) must equal the sum of the individual special-rate line items.");

    /* --- A621 : total tax (col ii) = sum of the head-row taxes. --- */
    let totTax=0; siRows.forEach(function(r){ if(r) totTax+=N(r.SplRateIncTax); });
    A(621, REQ(RG(I,"ScheduleSI.TotSplRateIncTax",0), totTax),
      "Schedule SI: the total tax on special incomes (ii) must equal the sum of the tax on the individual line items.");

    /* --- A625/A626, A632-A645 : each SI capital-gain head ≤ the corresponding
       Schedule-CG head (net of DTAA); only when Schedule CG is present. --- */
    if(I.ScheduleCG){
    /* A625/A626 — STCG-/LTCG-DTAA heads ≤ the CG special-rate DTAA totals
       (Sl.No. A9 / B11 of Schedule CG). */
    A(625, LE(siInc("DTAASTCG"), CG_A9spl),
      "Schedule SI: short-term capital gains chargeable at special rates as per DTAA cannot exceed the corresponding income at Sl.No. A9 of Schedule CG.");
    A(626, LE(siInc("DTAALTCG"), CG_B11spl),
      "Schedule SI: long-term capital gains chargeable at special rates as per DTAA cannot exceed the corresponding income at Sl.No. B11 of Schedule CG.");
    A(632, LE(siInc("1A"), CG_emf("1A")+CG_A4a),
      "Schedule SI: 111A STCG (equity/equity-oriented fund, STT paid) cannot exceed the income at Sl.No. A3ie or A4a of Schedule CG (net of DTAA).");
    A(633, LE(siInc("5AD1biip"), CG_emf("5AD1biip")),
      "Schedule SI: 115AD(1)(b)(ii)-proviso STCG referred to in 111A (by an FII) cannot exceed the income at Sl.No. A3iie of Schedule CG (net of DTAA).");
    A(634, LE(siInc("22"), CG_B3c),
      "Schedule SI: 112(1) LTCG on listed securities/units cannot exceed the income at Sl.No. B3c of Schedule CG (net of DTAA).");
    A(635, LE(siInc("21ciii"), CG_nri("21ciii")),
      "Schedule SI: 112(1)(c)(iii) LTCG for a non-resident on unlisted securities cannot exceed the income at Sl.No. B6ic of Schedule CG (net of DTAA).");
    A(636, LE(siInc("2A"), CG_B4),
      "Schedule SI: 112A LTCG (equity shares/units on which STT is paid) cannot exceed the income at Sl.No. B4 of Schedule CG (net of DTAA).");
    A(637, LE(siInc("5AB1b"), CG_nri("5AB1b")),
      "Schedule SI: 115AB(1)(b) LTCG on units purchased in foreign currency by an off-shore fund cannot exceed the income at Sl.No. B6iic of Schedule CG (net of DTAA).");
    A(638, LE(siInc("5AC1c"), CG_nri("5AC1c")),
      "Schedule SI: 115AC(1)(c) LTCG on bonds/GDR purchased in foreign currency (non-resident) cannot exceed the income at Sl.No. B6iiic of Schedule CG (net of DTAA).");
    A(639, LE(siInc("5ADii"), CG_A5e),
      "Schedule SI: 115AD(1)(b)(ii) STCG (other than 111A) by an FII cannot exceed the income at Sl.No. A5e of Schedule CG (net of DTAA).");
    A(640, LE(siInc("5ADiii"), CG_nri("5ADiii")),
      "Schedule SI: 115AD(1)(b)(iii) LTCG (other than 112A) by an FII cannot exceed the income at Sl.No. B6ivc of Schedule CG (net of DTAA).");
    A(641, LE(siInc("5ADiiiP"), CG_B7),
      "Schedule SI: 115AD(1)(b)(iii)-proviso LTCG on equity/units u/s 112A cannot exceed the income at Sl.No. B7 of Schedule CG (net of DTAA).");
    A(642, LE(siInc("PTI_STCG20P"), CG_A8a),
      "Schedule SI: pass-through STCG chargeable @20% cannot exceed the income at Sl.No. A8a of Schedule CG (net of DTAA).");
    A(643, LE(siInc("PTI_STCG30P"), CG_A8b),
      "Schedule SI: pass-through STCG chargeable @30% cannot exceed the income at Sl.No. A8b of Schedule CG (net of DTAA).");
    A(644, LE(siInc("PTI_LTCG12_5P112A"), CG_B10a1),
      "Schedule SI: pass-through LTCG chargeable @12.5% u/s 112A cannot exceed the income at Sl.No. B10a1 of Schedule CG (net of DTAA).");
    A(645, LE(siInc("PTI_LTCG12_5P"), CG_B10a2),
      "Schedule SI: pass-through LTCG chargeable @12.5% (other than u/s 112A) cannot exceed the income at Sl.No. B10a2 of Schedule CG (net of DTAA).");
    }
  }

  /* =====================================================================
     Schedule EI — exempt income. Sl.1 InterestInc; Sl.2 agriculture
     (2i GrossAgriRecpt − 2ii ExpIncAgri − 2iii UnabAgriLossPrev8 + 2iv
     NetAgriIncRelateToRule7 = 2v NetAgriIncOrOthrIncRule7); Sl.3 Others
     (Σ OthersIncDtls[].OthAmount); Sl.4 IncChrgblAsPerDTAA (Σ
     IncNotChrgblAsPerDTAADtls[].AmountOfIncome); Sl.5 PassThrIncNotChrgblTax;
     Sl.6 TotalExemptInc. (70_sec_ei.js.)
     ===================================================================== */
  if(I.ScheduleEI){
    const interest = N(RG(I,"ScheduleEI.InterestInc",0));
    const grossAgri= N(RG(I,"ScheduleEI.GrossAgriRecpt",0));
    const expAgri  = N(RG(I,"ScheduleEI.ExpIncAgri",0));
    const unabAgri = N(RG(I,"ScheduleEI.UnabAgriLossPrev8",0));
    const agri2iv  = N(RG(I,"ScheduleEI.NetAgriIncRelateToRule7",0));
    const net2v    = N(RG(I,"ScheduleEI.NetAgriIncOrOthrIncRule7",0));
    const others3  = N(RG(I,"ScheduleEI.Others",0));
    const dtaa4    = N(RG(I,"ScheduleEI.IncChrgblAsPerDTAA",0));
    const passThr5 = N(RG(I,"ScheduleEI.PassThrIncNotChrgblTax",0));
    const total6   = N(RG(I,"ScheduleEI.TotalExemptInc",0));
    const otherRows= arr(RG(I,"ScheduleEI.OthersInc.OthersIncDtls",[]));
    const dtaaRows = arr(RG(I,"ScheduleEI.IncNotChrgblAsPerDTAA.IncNotChrgblAsPerDTAADtls",[]));
    const landRows = arr(RG(I,"ScheduleEI.ExcNetAgriInc.ExcNetAgriIncDtls",[]));
    const bpAgri   = N(RG(I,"CorpScheduleBP.BusinessIncOthThanSpec.BalIncDeemedFrmAgri",0));

    /* A647 — Sl.6 = Sl.1 + Sl.2v + Sl.3 + Sl.4 + Sl.5. */
    A(647, REQ(total6, Math.max(0, interest + net2v + others3 + dtaa4 + passThr5)),
      "Schedule EI: the total exempt income (Sl.6) must equal the sum of Sl.1 + Sl.2v + Sl.3 + Sl.4 + Sl.5.");

    /* A648 — Sl.2v = 2i − 2ii − 2iii + 2iv. */
    A(648, REQ(net2v, Math.max(0, grossAgri - expAgri - unabAgri + agri2iv)),
      "Schedule EI: net agricultural income (Sl.2v) must equal 2i − 2ii − 2iii + 2iv.");

    /* A649 — Sl.2iv (agricultural income under Rule 7/7A/7B(1)/7B(1A)/8) =
       balance income deemed from agriculture at Sl.No. 40 of Schedule BP. */
    A(649, REQ(agri2iv, Math.max(0, bpAgri)),
      "Schedule EI: the agricultural income portion under Rule 7/7A/7B(1)/7B(1A)/8 (Sl.2iv) must equal the balance income deemed from agriculture in Schedule BP.");

    /* A650 — Sl.3 total = sum of the individual other-exempt amounts. */
    let othSum=0; otherRows.forEach(function(r){ if(r) othSum+=N(r.OthAmount); });
    A(650, REQ(others3, Math.max(0, othSum)),
      "Schedule EI: the total of other exempt income (Sl.3) must equal the sum of the amounts entered in the individual rows.");

    /* A651 — Sl.4 total = sum of the DTAA 'Amount of Income' entries. */
    let dtaaSum=0; dtaaRows.forEach(function(r){ if(r) dtaaSum+=N(r.AmountOfIncome); });
    A(651, REQ(dtaa4, Math.max(0, dtaaSum)),
      "Schedule EI: total income not chargeable to tax as per DTAA (Sl.4) must equal the total of the amounts of income entered.");

    /* A654 — net agricultural income (Sl.2v) > ₹5,00,000 ⇒ the land details
       (district+pincode, measurement, owned/leased, irrigated/rain-fed) are
       mandatory for every row and at least one row is required. */
    A(654, !(net2v>500000) ||
        (landRows.length>0 && landRows.every(function(r){ r=r||{};
          return S0(r.NameOfDistrict) && S0(r.PinCode) && (r.MeasurementOfLand!=null && String(r.MeasurementOfLand).trim()!=="")
              && S0(r.AgriLandOwnedFlag) && S0(r.AgriLandIrrigatedFlag); })),
      "Schedule EI: when net agricultural income for the year (Sl.2v) exceeds ₹5,00,000, the district name and pin code, land measurement, owned/leased status and irrigated/rain-fed status are mandatory for each parcel of agricultural land.");

    /* A655 — a sub-category dropdown at Sl.3 cannot be selected more than once. */
    const subSeen={}; let dupSub=false;
    otherRows.forEach(function(r){ const sc=r&&r.SubCategory; if(S0(sc)){ if(subSeen[sc]) dupSub=true; subSeen[sc]=1; } });
    A(655, !dupSub,
      "Schedule EI: a sub-category at Sl.No. 3 cannot be selected more than once.");

    /* A656 — exempt income u/s 10(4)(i), 10(4E), 10(4F), 10(4G), 10(6BB),
       10(8A), 10(15A) cannot be reported by a resident. */
    const isResident = RG(I,"PartA_GEN1.FilingStatus.ResidentialStatus","")==="RES"
                    || RG(I,"PartA_GEN1.OrgFirmInfo.DomesticCompFlg","")==="Y";
    const RES_BARRED=["10(4)(i)","10(4E)","10(4F)","10(4G)","10(6BB)","10(8A)","10(15A)"];
    otherRows.forEach(function(r){ if(!r) return;
      A(656, !(isResident && RES_BARRED.indexOf(r.SubCategory)>=0),
        "Schedule EI: exempt income u/s 10(4)(i), 10(4E), 10(4F), 10(4G), 10(6BB), 10(8A) and 10(15A) cannot be reported by a resident.");
    });

    /* A657 — exempt income u/s 10(4C), 10(6A), 10(6B), 10(6C), 10(6D),
       10(15B), 10(48), 10(48A), 10(48B) cannot be reported by a domestic
       company. */
    const isDomestic = RG(I,"PartA_GEN1.OrgFirmInfo.DomesticCompFlg","")==="Y";
    const DOM_BARRED=["10(4C)","10(6A)","10(6B)","10(6C)","10(6D)","10(15B)","10(48)","10(48A)","10(48B)"];
    otherRows.forEach(function(r){ if(!r) return;
      A(657, !(isDomestic && DOM_BARRED.indexOf(r.SubCategory)>=0),
        "Schedule EI: exempt income u/s 10(4C), 10(6A), 10(6B), 10(6C), 10(6D), 10(15B), 10(48), 10(48A) and 10(48B) cannot be reported by a domestic company.");
    });

    /* A658 — a description is mandatory where the amount is more than 0 and
       the sub-category is 'Income exempt as per CBDT Circular', 'Income
       exempt as per CBDT Notification' or 'Receipts not in the nature of
       income'. */
    const DESC_REQ=["Incmexmptcircular","Incmexmptnotification","Receiptnotincme"];
    otherRows.forEach(function(r){ if(!r) return;
      A(658, !(N(r.OthAmount)>0 && DESC_REQ.indexOf(r.SubCategory)>=0 && !S0(r.Description)),
        "Schedule EI: a description is mandatory where the amount is more than 0 and the sub-category is 'Income exempt as per CBDT Circular', 'Income exempt as per CBDT Notification' or 'Receipts not in the nature of income'.");
    });
  }
});
