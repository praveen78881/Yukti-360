/* =====================================================================
   ITR-7 · Section "tax" (order 170, corder 90) — Part B roll-up for the
   TRUST / INSTITUTION return.  It is the LAST substantive compute: it reads
   every upstream head and schedule via S.C.<id>.* and paints the four
   Part B blocks.

   Books: books/ITR-7/PART_B_TI_TTI.md (blocks PartB_TI, PartB_TI2,
          PartB_TI3, PartB_TTI) — the trust/institution Part B.
   Schema blocks OWNED here (section_map.json → section "tax"):
          PartB_TI, PartB_TI2, PartB_TI3, PartB_TTI (the whole object,
          including the Refund bank-account block and AssetOutsideIndiaFlg,
          which section_map maps to `tax`, NOT to the `bank`/Verification
          section — the `bank` section owns only the Verification block and
          merely READS the refund figure this engine publishes as
          S.C.tax.refundDue).

   ITR-7 computes Part B-TI ONCE PER EXEMPTION REGIME and paints three
   parallel sub-statements; only the one matching the filing status is
   filed (the others are computed but inert):
     · Part-B1 (PartB_TI)  — ss.11/12 or 10(23C)(iv)/(v)/(vi)/(via)
     · Part-B2 (PartB_TI2) — s.13A/13B or 10(21)…10(47)
     · Part-B3 (PartB_TI3) — income at maximum marginal rate under the 22nd
                             proviso to 10(23C) or s.13(10)
   The live regime is picked from S.C.who (exemptionSection / returnSection /
   prov1310).  Part B-TTI (the tax ladder) is common to whichever regime is
   filed.

   Consumes (all guarded, all defaulting so nothing throws):
     who   S.C.who.{exemptionSection,returnSection,prov1310,isPoliticalParty,
                    resident,domestic,claim9090A91}
     hp    S.C.hp.{partBTI,total}                       (item 10i / 7i)
     bp    S.C.bp.{d,income}                            (item 10ii / 7ii — D48)
     cg    S.C.cg.{after.{st20,st30,stApp,stDTAA,lt125,ltDTAA},C2,income}
     os    S.C.os.{chargeable,special}                 (item 10iv / 7iv)
     vc    S.C.vc.{anon115BBC,totalVC,corpus,corpus80G2b,aggregateIncome,
                   domesticVC,foreignVC}
     fa    S.C.fa.{relief,relief90,relief91}           (Part B-TTI 5a/5b)
     paid  S.C.paid.{adv,tds,tcs,sat,paid,challans}    (Part B-TTI 9a-9e)
     app   S.C.app.*   — STUB (Schedule A/I/IA application & exemption feed)
     ie    S.C.ie.*    — Schedule IE (application, for Part-B2/receipts)
     si    S.C.si.*    — STUB (Schedule SI special rates, 115BBI, 115TD 12)
     cyla  S.C.cyla.*  — STUB (current-year loss set-off, item 12)

   Publishes the footer + seam contract:
     S.C.gti, S.C.ti (wiring footer), S.C.int (wiring footer), and
     S.C.tax = { gti, ti, tax, netTax, refundDue, regime, ... } — the
     `bank` section reads S.C.tax.refundDue.

   Rule 2 (CLAUDE.md): every figure/formula is ITR-7's own; codes are the
   book's own (ITR-7 spellings). Every cross-read is guarded.
   ===================================================================== */

/* ---- my own typed input: the date of filing (drives 234A/B/C interest).
   The bank-account block, the BankDtlsFlag, AssetOutsideIndiaFlg and the
   Verification block are OWNED by the `bank` section (it reads the refund
   figure this engine publishes as S.C.int.refund / S.C.tax.refundDue). ---- */
S.tax = S.tax || {};

/* ---- guarded computed reader (S.C.<path>, default 0) ---- */
function taxC(path,d){ return RG(S.C,path,d===undefined?0:d); }

/* ---- the trust / AOP normal-rate (old-regime) slab ladder ----
   AY 2026-27: nil up to ₹2,50,000, 5% to ₹5,00,000, 20% to ₹10,00,000,
   30% above.  Used for the "tax at normal rates" line and for the
   agricultural-income rebate (partial integration). */
function taxSlab(ti){ ti=Math.max(0,R(ti));
  if(ti<=250000) return 0;
  if(ti<=500000) return R((ti-250000)*0.05);
  if(ti<=1000000) return R(12500+(ti-500000)*0.20);
  return R(112500+(ti-1000000)*0.30); }

const TAX_MMR=0.30;              /* maximum marginal rate — base component (2(29C)) */

/* ---- regime resolver (which Part B-TI sub-statement is filed) ---- */
function taxRegime(W){
  if(W.prov1310) return "B3";                          /* A26 Yes → income at MMR (22nd proviso / 13(10)) */
  const ex=st0(W.exemptionSection);
  const B1=["11","23CIV","23CV","23CVI","23CVIA"];      /* ss.11/12 or 10(23C)(iv)-(via) */
  if(B1.indexOf(ex)>=0) return "B1";
  if(ex) return "B2";                                  /* 13A/13B or any 10(21)…10(47) clause */
  if(st0(W.returnSection)==="139-4B") return "B2";     /* political party, no exsec keyed yet */
  return "B1";                                         /* default: a 139(4A) charitable trust */
}

/* advance-tax instalment cut-offs (Schedule IT deposit dates) */
const TAX_QCUT=[new Date(2025,5,15),new Date(2025,8,15),new Date(2025,11,15),new Date(2026,2,15)];

/* =====================================================================
   ENGINE — the whole Part B roll-up + the footer/seam contract
   ===================================================================== */
function engTax(){
  const W=(S.C.who||{});
  const regime=taxRegime(W);

  /* ===== the income-not-forming-part heads (common to all regimes) ===== */
  const HP=(S.C.hp||{}), BP=(S.C.bp||{}), CG=(S.C.cg||{}), OS=(S.C.os||{});
  const after=(CG.after||{});

  const hp   = Math.max(0, R(HP.partBTI!=null?HP.partBTI:Math.max(0,N(HP.total))));   /* HP 3, nil if loss */
  const bp   = Math.max(0, R(BP.d!=null?BP.d:N(BP.income)));                           /* BP D48, nil if loss */
  /* capital-gain rate buckets, post set-off (Schedule CG item E) */
  const st20 =Math.max(0,R(after.st20)),  st30 =Math.max(0,R(after.st30));
  const stApp=Math.max(0,R(after.stApp)), stDTAA=Math.max(0,R(after.stDTAA));
  const lt125=Math.max(0,R(after.lt125)), ltDTAA=Math.max(0,R(after.ltDTAA));
  const totST=R(st20+st30+stApp+stDTAA);              /* Av */
  const totLT=R(lt125+ltDTAA);                        /* Biii */
  const cgSTLT=R(totST+totLT);                        /* C */
  const cg115BBH=Math.max(0,R(CG.C2));                /* D — 115BBH @30% (VDA CG) */
  const totCG=R(cgSTLT+cg115BBH);                     /* E */
  const os   = Math.max(0, R(OS.chargeable!=null?OS.chargeable:N(OS.income)));         /* OS 9, nil if loss */

  const headsTot=R(hp+bp+totCG+os);                   /* Σ heads not forming part of application */

  /* ===== upstream schedules that are still Phase-4 stubs (guarded 0) ===== */
  const cyla   =Math.max(0,R(taxC("cyla.total",taxC("cyla.cyTotal",0))));  /* item 12 — CYLA 2xiv/3xiv/4xiv */
  const splInc =Math.max(0,R(taxC("si.totInc",0)));   /* Schedule SI col (i) — income at special rates */
  const splTax =Math.max(0,R(taxC("si.totTax",0)));   /* Schedule SI col (ii) — tax at special rates */
  const bbeInc =Math.max(0,R(taxC("si.inc115BBE",0)));
  const bbeTax =Math.max(0,R(taxC("si.tax115BBE",0)));
  const spec115BBI=Math.max(0,R(taxC("si.spec115BBI",taxC("si.inc115BBI",0)))); /* 115BBI specified income */
  const netAgri=Math.max(0,R(taxC("si.agri",taxC("app.netAgri",0))));  /* net agricultural income for rate */
  const net115TD=Math.max(0,R(taxC("si.net115TD",0)));/* Schedule 115TD Sl.12 → Part B-TTI item 12 */

  /* anonymous donations @30% u/s 115BBC (Schedule VC Diii) */
  const anon115BBC=Math.max(0,R(taxC("vc.anon115BBC",0)));

  /* application / exemption feed (Schedule A/I/IA — `app` section, STUB → 0) */
  const A=k=>Math.max(0,R(taxC("app."+k,0)));
  const vcCorpus115BBC=Math.max(0,R(taxC("vc.vcOtherCorpus",A("vcCorpus115BBC")))); /* Part-B1 item1 */
  const corpus80G=Math.max(0,R(taxC("vc.corpus80G2b",0)));
  const corpusOther=Math.max(0,R((taxC("vc.corpus",0))-corpus80G));
  const grossExempt=A("grossIncomeAfterExemption");   /* Part-B1 item9 (post-application) */

  /* ===== the live regime's total income and its rate split ===== */
  let ti,normalRateInc,mmrInc,grossB2Pre=0;
  if(regime==="B3"){
    /* Part-B3 — income at MMR (22nd proviso to 10(23C) / s.13(10); exemption
       denied). The WHOLE income (Schedule VC non-corpus + Schedule AI) flows
       through the app B3 ladder (Sl.6 SumTotal); only the Diii anonymous
       donation is carved out and charged u/s 115BBC @30%, the rest at MMR. */
    const sumTot=Math.max(0,R(A("b3SumTotal")));
    const inc=Math.max(0, sumTot + headsTot - cyla);
    ti=inc;
    mmrInc=Math.max(0, inc - splInc - anon115BBC - spec115BBI);
    normalRateInc=0;
  } else if(regime==="B2"){
    /* Part-B2 — s.13A/13B or 10(21)…10(47). Gross income (Sl.8) = voluntary
       contributions (Sch VC C) + heads not forming part − 13A/13B exemption
       + the 11(3) r.w. 10(21) add-back, less CY loss. The 10(21)…10(47) /
       10(23C)(iiiab)…(iiiae) statement exemptions (Sch IE, Sl.1/2) are a
       disclosure and do NOT enter the taxable base. */
    const vcTot=R(taxC("vc.totalVC",0));
    const ex13A=A("exempt13A"), ex13B=A("exempt13B"), inc11_3=A("incChargeable11_3");
    grossB2Pre=Math.max(0, vcTot + headsTot - ex13A - ex13B + inc11_3);
    ti=Math.max(0, grossB2Pre - cyla);
    mmrInc=Math.max(0,R(A("incMMR")));                 /* item 14 — income at MMR (nil unless a condition fails) */
    normalRateInc=Math.max(0, ti - splInc - anon115BBC - spec115BBI - mmrInc);
  } else {
    /* Part-B1 — ss.11/12 or 10(23C)(iv)-(via). Gross income after exemption
       (app stub) + heads, less CY loss; aggregate at normal rates is
       13 − 14 − 15 − 16. */
    const gross=Math.max(0, grossExempt + headsTot);
    ti=Math.max(0, gross - cyla);
    mmrInc=0;
    normalRateInc=Math.max(0, ti - splInc - anon115BBC - spec115BBI);
  }
  const gti=(regime==="B2")?grossB2Pre:ti;             /* B2: Sl.8 gross income (pre-loss); else GTI */
  ti=Math.max(0, Math.round(ti/10)*10);                /* §288A — round total income to the nearest ten */

  /* ===== Part B-TTI 1 — tax payable on total income ===== */
  const tax1a=R(taxSlab(normalRateInc + netAgri));     /* 1a — normal (AOP slab) with agri aggregation */
  const rebateAgri=netAgri>0 ? R(taxSlab(netAgri + 250000)) : 0;   /* 1f — agri rebate (partial integration) */
  const tax1b=splTax;                                  /* 1b — special rates (Schedule SI col ii) */
  const tax1c=R(anon115BBC*0.30);                      /* 1c — 30% on anonymous donations 115BBC */
  const tax1d=R(spec115BBI*0.30);                      /* 1d — 30% on 115BBI specified income */
  const tax1e=R(mmrInc*TAX_MMR);                       /* 1e — maximum marginal rate */
  const tax1g=Math.max(0, R(tax1a+tax1b+tax1c+tax1d+tax1e-rebateAgri)); /* 1g — tax payable on total income */

  /* ===== 2 — surcharge (AOP/trust ladder + 25% flat on 115BBE) =====
     Part-B3 charges the whole income at the maximum marginal rate, so its
     surcharge is the flat MMR component (12% → 30%×1.12×1.04 = 34.944%),
     NOT the income-slab ladder, and no marginal relief applies. */
  const surRate = (regime==="B3") ? 0.12 :
    (ti>50000000?0.37: ti>20000000?0.25: ti>10000000?0.15: ti>5000000?0.10:0);
  const sur25SI = R(Math.max(0,bbeTax)*0.25);          /* 2i — 25% of 115BBE tax (never marginal-relieved) */
  const restTax = Math.max(0, tax1g - bbeTax);
  let surOnRest = R(restTax*surRate);                  /* 2ii — ladder surcharge on the rest */
  /* marginal relief at the ladder threshold (on the surcharged rest) */
  if(surRate>0 && regime!=="B3"){
    const th = ti>50000000?50000000: ti>20000000?20000000: ti>10000000?10000000:5000000;
    const lower = ti>50000000?0.25: ti>20000000?0.15: ti>10000000?0.10:0;
    const mr = Math.max(0, (restTax+surOnRest) - (restTax + restTax*lower) - (ti-th));
    surOnRest = Math.max(0, R(surOnRest - mr));
  }
  const totalSur=R(sur25SI+surOnRest);                 /* 2iii */
  const cess=R((tax1g+totalSur)*0.04);                 /* 3 — health & education cess @4% */
  const grossTax=R(tax1g+totalSur+cess);               /* 4 — gross tax liability */

  /* ===== 5 — tax relief (Schedule TR): 90/90A + 91 ===== */
  const FA=(S.C.fa||{});
  const rel90=Math.max(0,R(FA.relief90!=null?FA.relief90:N(FA.dtaa)));
  const rel91=Math.max(0,R(FA.relief91!=null?FA.relief91:N(FA.notDtaa)));
  const relief=Math.max(0, R(FA.relief!=null?FA.relief:(rel90+rel91)));
  const netTax=Math.max(0, R(grossTax - relief));      /* 6 — net tax liability */

  /* ===== taxes paid (Part B-TTI 9a-9e) ===== */
  const P=(S.C.paid||{});
  const adv=R(P.adv||0), tds=R(P.tds||0), tcs=R(P.tcs||0), sat=R(P.sat||0);
  const paidTot=R(P.paid!=null?P.paid:(adv+tds+tcs+sat));

  /* ===== 7 — interest & fee (234A/B/C, 234F, 234-I) ===== */
  const dueDate = DUE;                                 /* FORM.due — the audit-case 139(1) date */
  const filed = D(S.tax.filed);
  const late = !!(filed && filed>dueDate);
  const challans = Array.isArray(P.challans)?P.challans:[];
  const upto=d=>challans.filter(c=>!c.sat && D(c.dt) && D(c.dt)<=d).reduce((a,c)=>a+N(c.amt),0);

  /* 234A — 1%/month on the shortfall (net − adv − tds − tcs), principal floored to 100 */
  let p234a=Math.max(0, netTax-adv-tds-tcs); if(p234a>100)p234a=Math.floor(p234a/100)*100;
  const m234a=late?MPART(dueDate,filed):0;
  const i234a=(netTax>0)?R(p234a*0.01*m234a):0;        /* A636 — nil if tax on total income is 0 */

  /* 234B — assessed = net − (tds+tcs); if advance < 90%, 1%/month Apr→filing */
  let i234b=0; const assessed=netTax-tds-tcs;
  if(netTax>0 && assessed>=10000 && adv<0.9*assessed){
    const principal=Math.floor(Math.max(0, netTax-adv-tds-tcs)/100)*100;
    const months=Math.min(30, MPART(new Date(2026,3,1), filed||new Date())||1);
    i234b=R(principal*0.01*months);
  }

  /* 234C — four instalment buckets on cumulative advance tax paid */
  const base234c=netTax;
  const gate234c=(netTax>0 && base234c>=10000);
  const QDEF=[[0.15,0.12,3],[0.45,0.36,3],[0.75,null,3],[1,null,1]];
  const qs=QDEF.map((q,k)=>{const pc=q[0],safe=q[1],mo=q[2];
    const b=Math.max(0, base234c - tds - tcs - relief);
    const need=R(b*pc), got=R(upto(TAX_QCUT[k]));
    let sh=(safe!==null && got>=Math.floor(b*safe/100)*100)?0:Math.floor(Math.max(0,need-got)/100)*100;
    if(!gate234c)sh=0;
    return {need:need, got:got, short:sh, mo:mo, int:R(sh*0.01*mo)};});
  const i234c=R(qs.reduce((a,q)=>a+q.int,0));

  /* 234F — late-filing fee (A637): ₹5,000, or ₹1,000 if total income ≤ ₹5 lakh */
  const f234f=late?(ti<=500000?1000:5000):0;
  /* 234-I — revised-return fee (A639/A640): filed after 31-12-2026 u/s 139(5) */
  const revised=(+S.fs.sec===17)||/revis|139\s*\(?5/i.test(st0(S.fs.retType||S.fs.sec));
  const f234i=(revised && filed && filed>new Date(2026,11,31))?(ti<=500000?1000:5000):0;

  const intTotal=R(i234a+i234b+i234c+f234f+f234i);     /* 7e */
  const aggregate=R(netTax+intTotal);                  /* 8 — aggregate liability */
  const bal=aggregate-paidTot;
  const balance=Math.round(Math.max(0,bal)/10)*10;     /* 10 — amount payable */
  let refund=Math.round(Math.max(0,-bal)/10)*10;       /* 11 — refund */
  /* 12 — net tax payable on 115TD accreted income (Schedule 115TD Sl.12) is a
     SELF-CONTAINED charge with its own challans (Part B-TTI item 11 /
     NetTaxPyblOn115TDInc). It does NOT net against the income-tax refund, which
     stands on its own; the 115TD net payable is surfaced separately. */
  const refundDue=refund;

  /* ===== publish the footer + seam contract ===== */
  S.C.gti=R(gti);
  S.C.ti =R(ti);
  S.C.tax={
    regime:regime,
    gti:R(gti), ti:R(ti), tax:grossTax, netTax:netTax, refundDue:refundDue,
    /* Part B-TI common heads */
    hp:hp, bp:bp, st20:st20, st30:st30, stApp:stApp, stDTAA:stDTAA,
    totST:totST, lt125:lt125, ltDTAA:ltDTAA, totLT:totLT,
    cgSTLT:cgSTLT, cg115BBH:cg115BBH, totCG:totCG, os:os, headsTot:headsTot,
    vcCorpus115BBC:vcCorpus115BBC, corpus80G:corpus80G, corpusOther:corpusOther,
    grossExempt:grossExempt, cyla:cyla,
    splInc:splInc, anon115BBC:anon115BBC, spec115BBI:spec115BBI, netAgri:netAgri,
    normalRateInc:normalRateInc, mmrInc:mmrInc,
    /* Part B-TTI ladder */
    tax1a:tax1a, tax1b:tax1b, tax1c:tax1c, tax1d:tax1d, tax1e:tax1e,
    rebateAgri:rebateAgri, tax1g:tax1g,
    surRate:surRate, sur25SI:sur25SI, surOnRest:surOnRest, totalSur:totalSur,
    cess:cess, grossTax:grossTax, gross:grossTax,
    rel90:rel90, rel91:rel91, relief:relief, net115TD:net115TD, rebate:0 };
  S.C.int={
    dueDate:dueDate, filed:filed, late:late,
    rel90:rel90, rel91:rel91, relief:relief, net:netTax,
    adv:adv, tds:tds, tcs:tcs, sat:sat, paid:paidTot,
    p234a:R(p234a), m234a:m234a, i234a:i234a, i234b:i234b, qs:qs, i234c:i234c,
    f234f:f234f, f234i:f234i, total:intTotal, aggregate:aggregate,
    balance:balance, refund:refundDue, refundGross:refund, net115TD:net115TD };
}

/* =====================================================================
   SCREEN — the four Part B blocks as result rows, plus the keyed filing
   date. The bank-account block and the foreign-asset flag live under the
   Bank & verification section.
   ===================================================================== */
function secTax(){
  const T=(S.C.tax||{}), I=(S.C.int||{});
  const REGLBL={B1:"Part-B1 · ss.11/12 or 10(23C)(iv)-(via)",
    B2:"Part-B2 · s.13A/13B or 10(21)…10(47)",
    B3:"Part-B3 · income at maximum marginal rate (22nd proviso / s.13(10))"};
  const r=(n,l,v,o)=>row(l,cell(v),Object.assign({ref:n},o||{}));
  let h="";

  h+=note("<b>Part B — total income &amp; tax.</b> ITR-7 computes Part B-TI once <b>per exemption "+
    "regime</b>; only the sub-statement matching your filing status is filed. This roll-up reads every "+
    "income head and schedule; the only keyed figures here are the <b>date of filing</b>, the "+
    "<b>bank-account</b> details for any refund, and the <b>foreign-asset</b> declaration. Regime in "+
    "force: <b>"+esc(REGLBL[T.regime]||"Part-B1")+"</b>.");

  /* ===== Part B-TI (the live regime) ===== */
  h+=sub("Part B-TI — Computation of total income ("+esc((T.regime||"B1").replace("B","Part-B"))+")");
  if(T.regime==="B3"){
    h+=note("The trust's income is chargeable at the <b>maximum marginal rate</b> under the twenty-second "+
      "proviso to section 10(23C) or section 13(10) (Part A-General A26 = Yes).");
  } else {
    h+=r("1","Voluntary contributions &amp; anonymous donations taxable u/s 115BBC (other than corpus)",T.vcCorpus115BBC||0);
    h+=r("2A","Corpus — donations for renovation/repair of places notified u/s 80G(2)(b)",T.corpus80G||0,{ind:1});
    h+=r("2B","Corpus other than above",T.corpusOther||0,{ind:1});
    h+=r("9","Gross income after exemption u/s 11 / 10(23C) (from Schedule A / I)",T.grossExempt||0,{cls:"tot",hint:"fed by the Application & accumulation section"});
  }
  h+=sub("Income not forming part of the application heads");
  h+=r("10i","Income from house property — 3 of Schedule HP (nil if loss)",T.hp||0);
  h+=r("10ii","Profits &amp; gains of business or profession — D48 of Schedule BP (nil if loss)",T.bp||0);
  h+=sub("10iii · Capital gains");
  h+=r("Ai","Short-term chargeable @ 20% — 8ii of item E of Schedule CG",T.st20||0,{ind:1});
  h+=r("Aii","Short-term chargeable @ 30% — 8iii",T.st30||0,{ind:1});
  h+=r("Aiii","Short-term at applicable rate — 8iv",T.stApp||0,{ind:1});
  h+=r("Aiv","Short-term at special rates as per DTAA — 8v",T.stDTAA||0,{ind:1});
  h+=r("Av","Total short-term (Ai+Aii+Aiii+Aiv)",T.totST||0,{cls:"tot"});
  h+=r("Bi","Long-term chargeable @ 12.5% — 8vi",T.lt125||0,{ind:1});
  h+=r("Bii","Long-term at special rates as per DTAA — 8vii",T.ltDTAA||0,{ind:1});
  h+=r("Biii","Total long-term (Bi+Bii)",T.totLT||0,{cls:"tot"});
  h+=r("C","Sum of short-term / long-term capital gains (Av+Biii)",T.cgSTLT||0);
  h+=r("D","Capital gain chargeable @ 30% u/s 115BBH — C2 of Schedule CG",T.cg115BBH||0);
  h+=r("E","Total capital gains (C+D)",T.totCG||0,{cls:"tot"});
  h+=r("10iv","Income from other sources — 9 of Schedule OS",T.os||0);
  h+=r("10v","Total (10i+10ii+10iiiE+10iv)",T.headsTot||0,{cls:"tot"});
  h+=r("12","Current-year losses to be set off — Schedule CYLA",T.cyla||0,{hint:"fed by the current-year-loss section"});
  h+=r("13","Total income",S.C.ti||0,{cls:"grand",hint:"rounded to the nearest ten"});
  h+=r("14","Income chargeable at special rates — col (i) of Schedule SI",T.splInc||0);
  h+=r("15","Anonymous donations taxed u/s 115BBC @ 30% — Diii of Schedule VC",T.anon115BBC||0);
  h+=r("16","Specified income chargeable u/s 115BBI @ 30% — Sl.7 of Schedule 115BBI",T.spec115BBI||0);
  if(T.regime==="B2") h+=r("14MMR","Income chargeable at maximum marginal rate",T.mmrInc||0);
  h+=r("17","Aggregate income to be taxed at normal rates",T.normalRateInc||0,{cls:"tot"});

  /* ===== Part B-TTI ===== */
  h+=sub("Part B-TTI — Computation of tax liability");
  h+=sub("1 · Tax payable on total income");
  h+=r("1a","Tax at normal rates (AOP slab) on the aggregate at normal rates",T.tax1a||0,{ind:1});
  h+=r("1b","Tax at special rates — col (ii) of Schedule SI",T.tax1b||0,{ind:1});
  h+=r("1c","Tax on anonymous donations u/s 115BBC @ 30%",T.tax1c||0,{ind:1});
  h+=r("1d","Tax on income chargeable u/s 115BBI @ 30%",T.tax1d||0,{ind:1});
  h+=r("1e","Tax at maximum marginal rate",T.tax1e||0,{ind:1});
  h+=r("1f","Rebate on agricultural income",-(T.rebateAgri||0),{ind:1});
  h+=r("1g","Tax payable on total income (1a+1b+1c+1d+1e−1f)",T.tax1g||0,{cls:"tot"});
  h+=sub("2 · Surcharge");
  h+=r("2i","25% of tax on income chargeable u/s 115BBE (never marginal-relieved)",T.sur25SI||0,{ind:1});
  h+=r("2ii","Surcharge on the balance, after marginal relief",T.surOnRest||0,{ind:1,hint:T.surRate?R(T.surRate*100)+"%":"nil"});
  h+=r("2iii","Total surcharge (2i+2ii)",T.totalSur||0,{cls:"tot"});
  h+=r("3","Health &amp; education cess @ 4% on (1g+2iii)",T.cess||0);
  h+=r("4","Gross tax liability (1g+2iii+3)",T.grossTax||0,{cls:"grand"});
  h+=sub("5 · Tax relief (Schedule TR)");
  h+=r("5a","Section 90/90A — 2 of Schedule TR",I.rel90||0,{ind:1});
  h+=r("5b","Section 91 — 3 of Schedule TR",I.rel91||0,{ind:1});
  h+=r("5c","Total (5a+5b)",I.relief||0,{cls:"tot"});
  h+=r("6","Net tax liability (4−5c)",I.net||0,{cls:"grand"});
  h+=sub("7 · Interest &amp; fee payable");
  h+=row("Date of filing the return",dte("tax.filed"),{ref:"—",hint:"due "+DISP(I.dueDate||DUE)});
  h+=r("7a","Interest for default in furnishing the return — 234A",I.i234a||0,{ind:1,hint:I.m234a?(I.m234a+" month"+(I.m234a>1?"s":"")):""});
  h+=r("7b","Interest for default in payment of advance tax — 234B",I.i234b||0,{ind:1});
  h+=r("7c","Interest for deferment of advance tax — 234C",I.i234c||0,{ind:1});
  h+=r("7d","Fee for default in furnishing the return — 234F",I.f234f||0,{ind:1});
  h+=r("7da","Fee for furnishing a revised return — 234-I",I.f234i||0,{ind:1});
  h+=r("7e","Total interest &amp; fee (7a+7b+7c+7d+7da)",I.total||0,{cls:"tot"});
  h+=r("8","Aggregate liability (6+7e)",I.aggregate||0,{cls:"grand"});
  h+=sub("9 · Taxes paid");
  h+=r("9a","Advance tax — Schedule IT",I.adv||0,{ind:1});
  h+=r("9b","TDS — Schedule TDS 1 &amp; 2",I.tds||0,{ind:1});
  h+=r("9c","TCS — Schedule TCS",I.tcs||0,{ind:1});
  h+=r("9d","Self-assessment tax — Schedule IT",I.sat||0,{ind:1});
  h+=r("9e","Total taxes paid (9a+9b+9c+9d)",I.paid||0,{cls:"tot"});
  h+=r("10","Amount payable — if 8 exceeds 9e",I.balance||0,{cls:I.balance?"grand":"tot"});
  h+=r("11","Refund — if 9e exceeds 8",I.refund||0,{cls:I.refund?"grand":"tot"});
  if(T.net115TD) h+=r("12","Net tax payable on 115TD income including interest u/s 115TE — Schedule 115TD",T.net115TD||0);

  h+=note("The bank-account details for any refund, the foreign-asset declaration and the verification block are entered under <b>Bank &amp; verification</b>.");
  return h;
}

/* =====================================================================
   EXPORT — the live Part B-TI regime block + the whole Part B-TTI block
   (including the Refund bank-account details and the foreign-asset flag,
   which section_map assigns to this section).
   ===================================================================== */
function expTax(j){
  const T=(S.C.tax||{}), I=(S.C.int||{});

  /* ---- the live Part B-TI regime ---- */
  if(T.regime==="B2")      expTaxB2(j,T);
  else if(T.regime==="B3") expTaxB3(j,T);
  else                     expTaxB1(j,T);

  /* ---- Part B-TTI (common) ---- */
  const B="PartB_TTI.ComputationOfTaxLiability.";
  put(j,B+"TaxPayableOnTI.TaxAtNormalRates",sg(T.tax1a));
  put(j,B+"TaxPayableOnTI.TaxAtSpecialRates",sg(T.tax1b));
  put(j,B+"TaxPayableOnTI.DonationUs115BC",sg(T.tax1c));
  put(j,B+"TaxPayableOnTI.TaxIncChargUs115BBI",sg(T.tax1d));
  put(j,B+"TaxPayableOnTI.TaxAtMarginalRate",sg(T.tax1e));
  put(j,B+"TaxPayableOnTI.RebateOnAgricultureInc",sg(T.rebateAgri));
  put(j,B+"TaxPayableOnTI.TaxPayableOnTotInc",sg(T.tax1g));
  put(j,B+"Surcharge25ofSI",sg(T.sur25SI));
  put(j,B+"SurchargeOnTaxPayable",sg(T.surOnRest));
  put(j,B+"TotalSurcharge",sg(T.totalSur));
  put(j,B+"EducationCess",sg(T.cess));
  put(j,B+"GrossTaxLiability",sg(T.grossTax));
  put(j,B+"TaxRelief.Section90",sg(I.rel90));
  put(j,B+"TaxRelief.Section91",sg(I.rel91));
  put(j,B+"TaxRelief.TotTaxRelief",sg(I.relief));
  put(j,B+"NetTaxLiability",sg(I.net));
  put(j,B+"IntrstPay.IntrstPayUs234A",sg(I.i234a));
  put(j,B+"IntrstPay.IntrstPayUs234B",sg(I.i234b));
  put(j,B+"IntrstPay.IntrstPayUs234C",sg(I.i234c));
  put(j,B+"IntrstPay.LateFilingFee234F",Math.min(5000,sg(I.f234f)));
  if(I.f234i) put(j,B+"IntrstPay.FeeFurnish234I",sg(I.f234i));
  put(j,B+"IntrstPay.TotalIntrstPay",sg(I.total));
  put(j,B+"AggregateTaxInterestLiability",sg(I.aggregate));

  const TP="PartB_TTI.TaxPaid.";
  put(j,TP+"TaxesPaid.AdvanceTax",sg(I.adv));
  put(j,TP+"TaxesPaid.TDS",sg(I.tds));
  put(j,TP+"TaxesPaid.TCS",sg(I.tcs));
  put(j,TP+"TaxesPaid.SelfAssessmentTax",sg(I.sat));
  put(j,TP+"TaxesPaid.TotalTaxesPaid",sg(I.paid));
  put(j,TP+"BalTaxPayable",sg(I.balance));

  /* Refund figures owned here; the BankAccountDtls block, the BankDtlsFlag
     and AssetOutsideIndiaFlg are exported by the `bank` section. */
  put(j,"PartB_TTI.Refund.RefundDue",sg(I.refund));
  put(j,"PartB_TTI.Refund.NetTaxPyblOn115TDInc",sg(T.net115TD));
}

/* ---- Part-B1 (PartB_TI) ---- */
function expTaxB1(j,T){
  const B="PartB_TI.";
  put(j,B+"VcCorpusSec11",sg(T.vcCorpus115BBC));
  put(j,B+"VoluntaryContributions.TotIncFromVC",sg(taxC("vc.totalVC",0)));
  put(j,B+"VoluntaryContributions.CorpusDonationUS80G",sg(T.corpus80G));
  put(j,B+"VoluntaryContributions.CorpusOtherThan80G",sg(T.corpusOther));
  put(j,B+"AggregateIncomeUs1112",sg(taxC("app.aggregate1112",0)));
  put(j,B+"AmtForCharitableUs111",sg(taxC("app.amtCharitable111",0)));
  put(j,B+"IncToBeApplied",sg(taxC("app.incToApply",0)));
  const D=B+"TIDeductions.";
  /* Form 9A / Form 10 declarations (optional; written only when furnished, so a
     standard-accumulation return stays byte-identical). Entered under the
     Application & accumulation section, published as S.C.app.f9a../f10.. keys. */
  const f9aNum=sg(taxC("app.f9aNum",0));      if(f9aNum)  put(j,B+"AmtForCharitableUs111Number",f9aNum);
  const f9aDate=ISO(taxC("app.f9aDate",""));  if(f9aDate) put(j,B+"AmtForCharitableUs111Date",f9aDate);
  const f9aEx=st0(taxC("app.f9aExercised","")); if(f9aEx)  put(j,D+"ExercisedBfDueDateFlag",f9aEx);
  const f9aFur=ISO(taxC("app.f9aFurnish",""));  if(f9aFur) put(j,D+"DateOfFurnishing",f9aFur);
  const f10=st0(taxC("app.f10Furnished",""));   if(f10)    put(j,D+"IsForm10Furnished",f10);
  const f10Date=ISO(taxC("app.f10Date",""));    if(f10Date)put(j,D+"DateOfFurnishingForm10",f10Date);
  put(j,D+"AmtAppliedtForCharitablePurpose",sg(taxC("app.applied",0)));
  put(j,D+"AmtAppForCharitablePurposeRepayment",sg(taxC("app.loanRepay",0)));
  put(j,D+"AmtAppliedSpecifiedMode",sg(taxC("app.appliedSpecMode",0)));
  put(j,D+"AmtDeemedForCharitable",sg(taxC("app.deemedApplied",0)));
  put(j,D+"AmtAccumulatedForCharitable",sg(taxC("app.accumulated11_2",0)));
  put(j,D+"AmtFulfilledUs11_2",sg(taxC("app.setApart11_2",0)));
  put(j,D+"TotalDeductions",sg(taxC("app.totalDeductions",0)));
  const AD=B+"TIAdditions.";
  put(j,AD+"IncChargeableUs115BBI",sg(T.spec115BBI));
  put(j,AD+"ExemptionUs11_13Dtl.AnonymousDonationVC",sg(taxC("app.anonNoExempt",0)));
  put(j,AD+"IncChargeableUs12_2",sg(taxC("app.incUs12_2",0)));
  put(j,AD+"AmtDsllwblUs111RWS40AIA",sg(taxC("app.disallow40aia",0)));
  put(j,AD+"AmtDsllwblUs111RWS40A3",sg(taxC("app.disallow40A3",0)));
  put(j,AD+"IncExp3BUS80G",sg(taxC("app.incExp3B",0)));
  put(j,AD+"IncExp1BUS80G",sg(taxC("app.incExp1B",0)));
  put(j,AD+"AnyOthrIncome",sg(taxC("app.anyOtherInc",0)));
  put(j,AD+"TotalAdditions",sg(taxC("app.totalAdditions",0)));
  put(j,B+"IncChargeableUs11_4",sg(taxC("app.incUs11_4",0)));
  put(j,B+"IncomeFromHP",sg(T.hp));
  put(j,B+"ProfBusGain.ProfGainNoSpecBus",sg(T.bp));
  expTaxCG(j,B+"CapGain.",T);
  put(j,B+"IncFromOS.TotIncFromOS",sg(T.os));
  put(j,B+"TotIncNotPart7And11Abv",sg(T.headsTot));
  put(j,B+"GrossIncome",sg(T.grossExempt));
  put(j,B+"CurrentYearLoss",sg(T.cyla));
  put(j,B+"TotalIncome",sg(S.C.ti));
  put(j,B+"TotalTI",sg(T.headsTot));
  put(j,B+"IncChargeableTaxSplRates",sg(T.splInc));
  put(j,B+"DonationsUs115BBC",sg(T.anon115BBC));
  put(j,B+"IncChargUs115BBIIncld13",sg(T.spec115BBI));
  put(j,B+"AggIncothSpecInc115BBI",sg(T.normalRateInc));
}

/* ---- Part-B2 (PartB_TI2) ---- */
function expTaxB2(j,T){
  const B="PartB_TI2.";
  const ex=k=>sg(taxC("app."+k,0));
  put(j,B+"TotExemptionUs10_21to29",ex("totExempt1021to29"));
  put(j,B+"ExemptionUs1021",ex("exempt1021"));
  put(j,B+"ExemptionUs10_23A",ex("exempt1023A"));
  put(j,B+"ExemptionUs10_23AAA",ex("exempt1023AAA"));
  put(j,B+"ExemptionUs10_23B",ex("exempt1023B"));
  put(j,B+"ExemptionUs10_23EC",ex("exempt1023EC"));
  put(j,B+"ExemptionUs10_23ED",ex("exempt1023ED"));
  put(j,B+"ExemptionUs10_23EE",ex("exempt1023EE"));
  put(j,B+"ExemptionUs10_29A",ex("exempt1029A"));
  put(j,B+"TotExemptionUs10_23Cto10_47",ex("totExempt1023Cto1047"));
  put(j,B+"ExemptionUs10_23Ciiiab",ex("exempt1023Ciiiab"));
  put(j,B+"ExemptionUs10_23Ciiiac",ex("exempt1023Ciiiac"));
  put(j,B+"ExemptionUs10_23Ciiiad",ex("exempt1023Ciiiad"));
  put(j,B+"ExemptionUs10_23Ciiiae",ex("exempt1023Ciiiae"));
  put(j,B+"ExemptionUs10_23DA",ex("exempt1023DA"));
  put(j,B+"ExemptionUs10_23FB",ex("exempt1023FB"));
  put(j,B+"ExemptionUs10_24",ex("exempt1024"));
  put(j,B+"ExemptionUs10_46",ex("exempt1046"));
  put(j,B+"ExemptionUs10_46A",ex("exempt1046A"));
  put(j,B+"ExemptionUs10_46B",ex("exempt1046B"));
  put(j,B+"ExemptionUs10_47",ex("exempt1047"));
  put(j,B+"IncomeChargeable11_3",ex("incChargeable11_3"));
  put(j,B+"ExemptionUs13_A",ex("exempt13A"));
  put(j,B+"ExemptionUs13_B",ex("exempt13B"));
  put(j,B+"VoluntaryContributions",sg(taxC("vc.totalVC",0)));
  put(j,B+"IncomeFromHP",sg(T.hp));
  put(j,B+"ProfBusGain.ProfGainNoSpecBus",sg(T.bp));
  expTaxCG(j,B+"CapGain.",T);
  put(j,B+"IncFromOS.TotIncFromOS",sg(T.os));
  put(j,B+"TotIncNotPart7And11Abv",sg(T.headsTot));
  put(j,B+"GrossIncome",sg(T.gti));
  put(j,B+"CurrentYearLoss",sg(T.cyla));
  put(j,B+"GrossTotalIncome",sg(S.C.ti));
  put(j,B+"IncChargeableTaxSplRates",sg(T.splInc));
  put(j,B+"NetAgricultureIncomeOrOtherIncomeForRate",sg(T.netAgri));
  put(j,B+"AggregateIncome",sg(T.normalRateInc));
  put(j,B+"IncChrgbleMaxMarginalRates",sg(T.mmrInc));
}

/* ---- Part-B3 (PartB_TI3) ---- */
function expTaxB3(j,T){
  const B="PartB_TI3.ComputationIncChargeable.";
  const ap=k=>sg(taxC("app."+k,0));
  put(j,B+"TotIncPrevYr",ap("b3TotInc"));
  put(j,B+"TotExpIncur",ap("b3TotExp"));
  put(j,B+"ExpDisallowed.ExpCorpusStandingCredit",ap("b3ExpCorpus"));
  put(j,B+"ExpDisallowed.ExpLoanBorrow",ap("b3ExpLoan"));
  put(j,B+"ExpDisallowed.DeprRespAsset",ap("b3Depr"));
  put(j,B+"ExpDisallowed.ExpFormContri",ap("b3ExpContri"));
  put(j,B+"ExpDisallowed.CapExp",ap("b3CapExp"));
  put(j,B+"ExpDisallowed.AmtDisallSubClauseiaSec40",ap("b3Disall40aia"));
  put(j,B+"ExpDisallowed.AmtDisallSubSec3Sec40A",ap("b3Disall40A3"));
  put(j,B+"ExpDisallowed.AmtDisallSubSec3ASec40A",ap("b3Disall40A3A"));
  put(j,B+"ExpDisallowed.AnyOthDisall",ap("b3OthDisall"));
  put(j,B+"ExpDisallowed.TotExpDisall",ap("b3TotDisall"));
  put(j,B+"Additions.IncChargSec115BBI",sg(T.spec115BBI));
  put(j,B+"Additions.IncExemptNotAvail",ap("b3AnonNoExempt"));
  put(j,B+"Additions.IncChargSec122",ap("b3IncUs12_2"));
  put(j,B+"Additions.IncExpl3B",ap("b3IncExp3B"));
  put(j,B+"Additions.IncExpl1B",ap("b3IncExp1B"));
  put(j,B+"Additions.AnyOthrIncome",ap("b3AnyOtherInc"));
  put(j,B+"Additions.TotAdditions",ap("b3TotAdditions"));
  put(j,B+"IncChargSec114",ap("b3IncUs11_4"));
  put(j,B+"SumTotal",ap("b3SumTotal"));
  put(j,B+"IncNotForming.IncFromHP",sg(T.hp));
  put(j,B+"IncNotForming.ProfitGainsBP",sg(T.bp));
  expTaxCG(j,B+"IncNotForming.CapGain.",T);
  put(j,B+"IncNotForming.IncOS",sg(T.os));
  put(j,B+"IncNotForming.Total",sg(T.headsTot));
  put(j,B+"LossCurYrToBeSetOff",sg(T.cyla));
  put(j,B+"TotalInc",sg(S.C.ti));
  put(j,B+"IncIncludedChargRateSpec",sg(T.splInc));
  put(j,B+"AnonymousDonation",sg(T.anon115BBC));
  put(j,B+"IncChargSec115BBI",sg(T.spec115BBI));
  put(j,B+"IncChagrgSec13",sg(T.mmrInc));
}

/* ---- the capital-gain sub-table, shared by all three regimes ---- */
function expTaxCG(j,B,T){
  put(j,B+"ShortTerm.ShortTerm20Per",sg(T.st20));
  put(j,B+"ShortTerm.ShortTerm30Per",sg(T.st30));
  put(j,B+"ShortTerm.ShortTermAppRate",sg(T.stApp));
  put(j,B+"ShortTerm.ShortTermSplRateDTAA",sg(T.stDTAA));
  put(j,B+"ShortTerm.TotalShortTerm",sg(T.totST));
  put(j,B+"LongTerm.LongTerm12_5Per",sg(T.lt125));
  put(j,B+"LongTerm.LongTermSplRateDTAA",sg(T.ltDTAA));
  put(j,B+"LongTerm.TotalLongTerm",sg(T.totLT));
  put(j,B+"ShortTermLongTermTotal",sg(T.cgSTLT));
  put(j,B+"CapGains30Per115BBH",sg(T.cg115BBH));
  put(j,B+"TotalCapGains",sg(T.totCG));
}

/* =====================================================================
   IMPORT — Part B-TI/TTI are computed on import (they recompute via
   compute()); only the keyed inputs (filing date, bank block, flags) are
   read back into state so the round-trip is faithful.
   ===================================================================== */
function impTax(I7){
  const read=[];
  if(!I7) return read;
  /* Part B-TI/TTI are all computed figures — they recompute via compute()
     on import; only the identity round-trip is recorded here. The keyed
     date of filing the return is not carried in the schema. */
  if(RG(I7,"PartB_TTI",null)) read.push("Part B-TTI (computed on import)");
  if(RG(I7,"PartB_TI",null)) read.push("Part B-TI");
  if(RG(I7,"PartB_TI2",null)) read.push("Part B-TI2");
  if(RG(I7,"PartB_TI3",null)) read.push("Part B-TI3");
  return read;
}

/* =====================================================================
   CHECKS — the section's own screen validations (Phase 6 is the CBDT engine)
   ===================================================================== */
function chkTax(){
  const o=[], add=(l,t,m)=>o.push({lvl:l,t:t,m:m,sec:"tax"});
  const T=(S.C.tax||{}), I=(S.C.int||{});

  if(st0(S.tax.filed) && !D(S.tax.filed))
    add("err","Date of filing","The date of filing is not a valid date (use "+DF+").");
  if(I.late)
    add("warn","Filed after the due date","Interest and fee of "+RS(I.total||0)+" arise because the return is filed after "+DISP(I.dueDate||DUE)+".");

  if((I.balance||0)>0) add("ok","Balance payable",RS(I.balance)+" is payable, including "+RS(I.total||0)+" of interest and fee.");
  else if((I.refund||0)>0) add("ok","Refund due",RS(I.refund)+" — credited to the bank account nominated under Bank & verification.");

  return o;
}

/* ---- register (overrides the boot stub) ---- */
reg({id:"tax", t:"Part B — total income & tax", ref:"Part B-TI · TTI",
  f:secTax,
  s:function(){ const T=(S.C.tax||{}); return T.grossTax!=null?("Tax "+CR(T.netTax||0)):"Part B-TI · TTI"; },
  eng:engTax, exp:expTax, imp:impTax, chk:chkTax, order:170, corder:90});
