/* =====================================================================
   ITR-1 · Section "tax" — Tax computation (ITR1_TaxComputation)
   Screen order 90; compute order (corder) 90 — runs BEFORE "paid"
   (corder 92) so the net tax liability is on S.C.tax.* when the paid
   section computes interest, and AFTER the income/deduction sections
   (sal/hp/os corder 30/40/44, ded corder 50) so their published head
   incomes and the allowed Chapter-VI-A total are already on S.C.*.

   OWNS / writes on export — the whole ITR1_TaxComputation block:
     TotalTaxPayable, Rebate87A, TaxPayableOnRebate, EducationCess,
     GrossTaxLiability, Section89, NetTaxLiability,
     IntrstPay.{IntrstPayUs234A, IntrstPayUs234B, IntrstPayUs234C,
       LateFilingFee234F, FeeFurnish234I}, TotalIntrstPay, TotTaxPlusIntrstPay.
   The interest / fee figures themselves are COMPUTED by the "paid"
   section (caps.md §8-9 senior/threshold/carve-out fixes) and published
   on S.C.paid.*; this block's export reads them from there, so there is a
   single writer per block (paid never writes ITR1_TaxComputation).

   Reads on compute:
     S.C.sal.income, S.C.hp.income, S.C.os.income  — head incomes (GTI)
     S.C.ded.total                                 — allowed Chapter-VI-A
     S.C.who.senior / S.C.who.superSenior          — basic-exemption slab
     S.C.ret.regime                                — new / old regime
     S.C.os.ltcg112a (best-effort)                 — 112A gain for the
                                                     OLD-regime 87A test
   Publishes S.C.tax.{ti, grossTax, rebate, cess, grossTaxLiability,
     netTaxLiability} plus footer aliases (gross, net, regime, gti) and
     the marginal-relief / taxPayableOnRebate detail the screen shows.
     Also sets the footer scalars S.C.gti and S.C.ti.

   Tax ladder mirrors the prior builder's slab/engTax (which matches the
   utility) — NEW 0/5/10/15/20/25/30% at 4/8/12/16/20/24L cumulative bases;
   OLD 2.5/5/10L with senior (3L) / super-senior (5L) basic exemption in the
   OLD regime only (new regime forces age 55 → no age benefit). §87A uses
   the LIVE AO177 rule (caps.md §6, fix D10/D11): NEW total income ≤ ₹12L →
   min(tax, ₹60,000) with marginal relief tax − (TI − ₹12L) just above ₹12L;
   OLD total income ≤ ₹5L → min(tax, ₹12,500). 4% health-&-education cess; NO
   surcharge (ITR-1); total income rounded to the nearest ₹10 (§288B).
   112A ≤ ₹1.25L is handled in "os"; §89 relief needs Form 10E.
   ===================================================================== */

/* ---- the slabs (unique names; do not shadow any shell global) ------- */
const TX_SLAB_NEW=[[400000,0],[800000,5],[1200000,10],[1600000,15],
                   [2000000,20],[2400000,25],[Infinity,30]];
const TX_SLAB_OLD=[[250000,0],[500000,5],[1000000,20],[Infinity,30]];
const TX_SLAB_SR =[[300000,0],[500000,5],[1000000,20],[Infinity,30]];   /* senior 60-79, OLD only */
const TX_SLAB_SSR=[[500000,0],[1000000,20],[Infinity,30]];              /* super-senior >=80, OLD only */

/* slab tax on `inc` over the cumulative bands */
function _txSlab(inc,b){let t=0,l=0;
  for(const x of b){const u=x[0],r=x[1];
    if(inc>l)t+=(Math.min(inc,u)-l)*r/100; l=u; if(inc<=u)break;}
  return R(t);}

/* ---- cross-section readers (guarded; nothing throws) ---------------- */
/* new regime?  reads S.C.ret.regime ("new"/"old"), tolerating a boolean
   or the raw opt-out flag; new is the AY2026-27 default */
function _txRegNew(){
  const r=S.C.ret||{};
  if(r.regime==="new")return true;
  if(r.regime==="old")return false;
  if(typeof r.isNew==="boolean")return r.isNew;
  if(typeof r.new==="boolean")return r.new;
  const opt=((S.ret||{}).optout!=null?(S.ret||{}).optout:(S.fs||{}).optout);
  if(opt==="Yes"||opt==="Y")return false;
  return true;
}
/* senior (age 60-79) and super-senior (>=80) — actual age, from who */
function _txSenior(){const w=S.C.who||{};
  if(typeof w.senior==="boolean")return w.senior;
  if(w.senior==="Y")return true;
  return (typeof senior==="function")?senior():false;}
function _txSuper(){const w=S.C.who||{};
  if(typeof w.superSenior==="boolean")return w.superSenior;
  if(w.superSenior==="Y")return true;
  return (typeof superSr==="function")?superSr():false;}
/* the 112A long-term gain that "os" carries free of tax (≤ ₹1.25L, on
   S.C.os.ltcg) — the utility adds it back only for the OLD-regime 87A test */
function _txLtcg(){const o=S.C.os||{};
  const v=o.ltcg!=null?o.ltcg:(o.ltcg112a!=null?o.ltcg112a:
    (o.carried112A!=null?o.carried112A:(o.longCap112A!=null?o.longCap112A:0)));
  return N(v);}

/* ---- engine ---------------------------------------------------------- */
function engTax(){
  const regNew=_txRegNew(), sr=_txSenior(), ssr=_txSuper();
  /* GTI = salary + house property + other sources.  A house-property loss
     cannot be set against other heads under the new regime (115BAC), so the
     HP figure is floored at 0 there; the OLD regime allows the loss (already
     capped to the ₹2,00,000 set-off ceiling inside the hp section). */
  const salC=S.C.sal||{}, hpC=S.C.hp||{};
  const salInc=N(salC.incomeFromSal!=null?salC.incomeFromSal:salC.income);  /* head-salary income */
  const hpRaw =N(hpC.total!=null?hpC.total:hpC.income);                     /* signed HP income (2L-capped) */
  const osInc =N((S.C.os ||{}).income);
  const hp=regNew?Math.max(0,hpRaw):hpRaw;
  const gti=R(salInc+hp+osInc);
  const dedTot=N((S.C.ded||{}).total);                 /* allowed Chapter-VI-A */
  const ltcg=_txLtcg();
  /* Total income, rounded to the nearest ₹10 (§288B).  tiLT adds the 112A
     gain — used only for the OLD-regime 87A threshold, as the utility does. */
  const ti  =Math.max(0,Math.round((gti      -dedTot)/10)*10);
  const tiLT=Math.max(0,Math.round((gti+ltcg -dedTot)/10)*10);

  const bands=regNew?TX_SLAB_NEW:(ssr?TX_SLAB_SSR:sr?TX_SLAB_SR:TX_SLAB_OLD);
  const grossTax=_txSlab(ti,bands);

  /* §87A — the LIVE AO177 rule (not the stale 7L/25k back-up cell) */
  let rebate=0,marginal=0;
  if(regNew){
    if(ti<=1200000) rebate=Math.min(grossTax,60000);
    else if(grossTax>ti-1200000){ marginal=grossTax-(ti-1200000); rebate=marginal; }
  } else if(tiLT<=500000){
    rebate=Math.min(grossTax,12500);
  }
  const after=Math.max(0,grossTax-rebate);             /* TaxPayableOnRebate */
  const cess=R(after*0.04);                            /* 4% cess; NO surcharge */
  const grossTaxLiability=R(after+cess);
  const s89=N((S.tax||{}).s89);                        /* relief u/s 89 (Form 10E) */
  const netTaxLiability=Math.max(0,R(grossTaxLiability-s89));

  S.C.tax={
    ti, tiLT, gti, ltcg:R(ltcg),
    grossTax:R(grossTax), gross:R(grossTax),          /* gross = footer alias */
    rebate:R(rebate), marginal:R(marginal),
    after:R(after), taxPayableOnRebate:R(after),
    cess, grossTaxLiability,
    section89:R(s89), s89:R(s89),
    netTaxLiability, net:netTaxLiability,
    regime:regNew?"New":"Old", senior:sr, superSenior:ssr, bands};
  /* footer contract the shell band() reads */
  S.C.gti=gti; S.C.ti=ti;
}

/* ---- renderer -------------------------------------------------------- */
function secTax(){
  const T=S.C.tax||{}, I=S.C.paid||S.C.int||{}; let h="";
  h+=row("Regime",'<span class="c">'+esc(T.regime||"")+'</span>',
    {hint:T.regime==="Old"?(T.superSenior?"a very senior citizen — the first ₹5,00,000 is free"
      :T.senior?"a senior citizen — the first ₹3,00,000 is free":"the first ₹2,50,000 is free")
      :"the new regime slabs start at ₹4,00,000"});
  h+=row("Gross total income",cell(T.gti),{ref:"B4"});
  if(T.ltcg)h+=row("Long-term gain under section 112A (added for the rebate test only)",
    cell(T.ltcg),{ref:"C3(a)",hint:"exempt up to ₹1,25,000 — reported in the exempt-income screen"});
  h+=row("Less: deductions under Chapter VI-A",cell(-N((S.C.ded||{}).total)),{ref:"C1"});
  h+=row("Total income",cell(T.ti),{cls:"tot",ref:"C2",hint:"rounded to the nearest ₹10"});

  h+=sub("The slabs");
  h+='<div class="full"><table class="gt" style="min-width:660px"><thead><tr>'+
     '<th class="l">Slab</th><th style="width:80px">Rate</th>'+
     '<th style="width:160px">Income in it</th><th style="width:160px">Tax</th>'+
     '</tr></thead><tbody>';
  let last=0;
  (T.bands||[]).forEach(x=>{const u=x[0],r=x[1];
    const inSlab=Math.max(0,Math.min(T.ti||0,u)-last);
    const lbl=u===Infinity?"Above "+RS(last):(last===0?"Up to "+RS(u):RS(last+1)+" to "+RS(u));
    if(inSlab||r===0)
      h+='<tr><td class="l">'+esc(lbl)+'</td><td class="num" style="color:var(--ink-3)">'+r+
         '%</td><td class="num">'+cell(inSlab)+'</td><td class="num">'+cell(inSlab*r/100)+'</td></tr>';
    last=u;});
  h+='</tbody><tfoot><tr><td class="l" colspan="3">Tax payable on total income</td><td>'+
     F(T.grossTax)+'</td></tr></tfoot></table></div>';

  h+=row("Tax payable on total income",cell(T.grossTax),{ref:"D1"});
  h+=row("Rebate under section 87A",cell(-T.rebate),{ref:"D2",
    hint:T.marginal?"marginal relief — the tax is held to the income above "+
      RS(T.regime==="New"?1200000:500000)
      :"where total income is not more than "+RS(T.regime==="New"?1200000:500000)});
  h+=row("Tax payable after the rebate",cell(T.taxPayableOnRebate),{cls:"tot",ref:"D3"});
  h+=row("Health and education cess at four per cent",cell(T.cess),{ref:"D4"});
  h+=row("Total tax and cess",cell(T.grossTaxLiability),{cls:"tot",ref:"D5"});
  h+=row("Relief under section 89",inp("tax.s89",{n:1}),{ref:"D6"});
  if(N((S.tax||{}).s89)){
    h+=formNote("Relief under section 89 needs <b>Form 10E</b> filed before the return.");
    h+=row("Acknowledgement number of Form 10E",inp("tax.e10ack",{max:15}),{req:1,ind:1});
  }
  h+=row("Net tax liability",cell(T.netTaxLiability),{cls:"tot",ref:"D-net"});

  /* interest / fee summary — computed by the paid section (read-only here) */
  h+=sub("Interest, fee and the balance");
  h+=row("Due date of filing",'<span class="c">'+DISP(DUE)+'</span>');
  {const fd=D((S.C.ret||{}).filedDate)||D((S.ret||{}).filed);
   h+=row("Date of filing",'<span class="c">'+(fd?DISP(fd):"—")+'</span>',
     {hint:"entered on the Return and regime screen; drives 234A and the 234F fee"});}
  h+=row("Interest under section 234A",cell(I.i234a),{ref:"D7",hint:"late filing"});
  h+=row("Interest under section 234B",cell(I.i234b),{ref:"D8",hint:"short payment of advance tax"});
  h+=row("Interest under section 234C",cell(I.i234c),{ref:"D9",hint:"deferment of instalments"});
  h+=row("Fee for filing late (234F)",cell(I.f234f),{ref:"D10",
    hint:"₹1,000 where total income is not more than ₹5,00,000, otherwise ₹5,000"});
  if(I.f234i)h+=row("Fee for furnishing (234-I)",cell(I.f234i),{ref:"D10a"});
  h+=row("Total interest and fee",cell(I.totalIntrstPay),{cls:"tot"});
  h+=row("Total tax, fee and interest",cell(I.aggregate),{cls:"grand",ref:"D11"});
  h+=note("Tax deducted, collected, advance tax and self-assessment tax, and the "+
    "balance or refund, are on the <b>Taxes paid</b> screen.");
  return h;
}

/* ---- export — the whole ITR1_TaxComputation block ------------------- */
function expTax(j){
  const T=S.C.tax||{}, I=S.C.paid||S.C.int||{};
  const i234a=n0(I.i234a), i234b=n0(I.i234b), i234c=n0(I.i234c);
  const f234f=Math.min(5000,n0(I.f234f)), f234i=Math.min(5000,n0(I.f234i));
  const totInt=n0(I.totalIntrstPay!=null?I.totalIntrstPay:(i234a+i234b+i234c+f234f+f234i));
  const net=n0(T.netTaxLiability);
  /* Income-summary roll-up leaves in ITR1_IncomeDeductions — the tax section is
     the sole writer of these three (sal/hp/os write the head incomes, ded writes
     the VI-A leaves; nobody else touches the GTI/TI summary). Without this the
     schema skeleton (10_state) leaves them at 0, which false-fires the GTI rules
     (A18/A20/A21/A22) and the 80D GTI-restriction (A137). Mirrors the footer
     scalars S.C.gti / S.C.ti that gate-7 figures against. */
  const IDb=j.ITR1_IncomeDeductions=j.ITR1_IncomeDeductions||{};
  put(IDb,"GrossTotIncome",n0(T.gti));                       /* salary + HP + OS head incomes */
  put(IDb,"GrossTotIncomeIncLTCG112A",n0(N(T.gti)+N(T.ltcg)));/* + LTCG u/s 112A (<=1.25L) */
  put(IDb,"TotalIncome",n0(T.ti));                           /* GTI - allowed Chapter-VIA, rounded to Rs.10 */

  const TC=j.ITR1_TaxComputation=j.ITR1_TaxComputation||{};
  put(TC,"TotalTaxPayable",n0(T.grossTax));
  put(TC,"Rebate87A",n0(T.rebate));
  put(TC,"TaxPayableOnRebate",n0(T.taxPayableOnRebate));
  put(TC,"EducationCess",n0(T.cess));
  put(TC,"GrossTaxLiability",n0(T.grossTaxLiability));
  put(TC,"Section89",n0(T.section89));
  put(TC,"NetTaxLiability",net);
  put(TC,"IntrstPay.IntrstPayUs234A",i234a);
  put(TC,"IntrstPay.IntrstPayUs234B",i234b);
  put(TC,"IntrstPay.IntrstPayUs234C",i234c);
  put(TC,"IntrstPay.LateFilingFee234F",f234f);
  put(TC,"IntrstPay.FeeFurnish234I",f234i);
  put(TC,"TotalIntrstPay",totInt);
  put(TC,"TotTaxPlusIntrstPay",n0(net+totInt));
  /* the required whole-number leaves are kept even at 0 */
  ["TotalTaxPayable","Rebate87A","TaxPayableOnRebate","EducationCess",
   "GrossTaxLiability","Section89","NetTaxLiability","TotalIntrstPay",
   "TotTaxPlusIntrstPay"].forEach(k=>{if(TC[k]==null)TC[k]=0;});
  TC.IntrstPay=TC.IntrstPay||{};
  ["IntrstPayUs234A","IntrstPayUs234B","IntrstPayUs234C","LateFilingFee234F",
   "FeeFurnish234I"].forEach(k=>{if(TC.IntrstPay[k]==null)TC.IntrstPay[k]=0;});
}

/* ---- import (inverse; the return carries only Section89 of these) --- */
function impTax(I){
  const read=[]; const g=(o,p)=>p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);
  const s89=g(I,"ITR1_TaxComputation.Section89");
  if(s89!=null){S.tax=S.tax||{};S.tax.s89=N(s89);read.push("section 89 relief");}
  return read;
}

/* ---- section-local sanity (not the CBDT rule engine) --------------- */
function chkTax(){
  const out=[]; const T=S.C.tax||{};
  if(N((S.tax||{}).s89)&&!/^\d{15}$/.test(st0((S.tax||{}).e10ack)))
    out.push({lvl:"err",t:"Form 10E",m:"Relief under section 89 needs the fifteen-digit acknowledgement of Form 10E.",sec:"tax"});
  if(T.marginal>0)
    out.push({lvl:"ok",t:"Marginal relief under section 87A",
      m:"Total income is just over ₹12,00,000, so the tax is held to the amount by which it exceeds that figure — relief of "+RS(T.marginal)+".",sec:"tax"});
  else if(T.rebate>0)
    out.push({lvl:"ok",t:"Rebate under section 87A",m:RS(T.rebate)+" of tax falls away.",sec:"tax"});
  if(N(T.ti)>5000000)
    out.push({lvl:"err",t:"ITR-1 cannot be used",
      m:"Total income is "+RS(T.ti)+". Sahaj stops at ₹50,00,000 — the return has to go on ITR-2.",sec:"tax"});
  if(!out.length)
    out.push({lvl:"ok",t:"Tax computation",m:T.regime+" regime · tax "+RS(T.netTaxLiability)+" after the rebate and cess.",sec:"tax"});
  return out;
}

/* ---- register (overrides the boot stub) ---------------------------- */
reg({id:"tax", t:"Tax computation", ref:"ITR1_TaxComputation · 112A", f:secTax,
  s:()=>{const T=S.C.tax||{}; return T.grossTaxLiability?("Tax "+CR(T.netTaxLiability)):"Slabs, rebate, cess";},
  eng:engTax, exp:expTax, imp:impTax, chk:chkTax, order:90, corder:90});
