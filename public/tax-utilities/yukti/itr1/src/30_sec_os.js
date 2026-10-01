/* =====================================================================
   ITR-1 · Section "os" — Income from Other Sources  (screen order 50,
   compute order 44).  Owns, on export:

     ITR1_IncomeDeductions.OthersInc.OthersIncDtlsOthSrc[]
        · OthSrcNatureDesc  (enum OthersInc_OthSrcNatureDesc)
        · OthSrcOthNatOfInc (free text, 'any other')
        · OthSrcOthAmount   (int)
        · DividendInc.DateRange.{Upto15Of6, Upto15Of9, Up16Of9To15Of12,
          Up16Of12To15Of3, Up16Of3To31Of3}   (the DIV row's 234C break-up)
     ITR1_IncomeDeductions.IncomeOthSrc        (computed head total)
     ITR1_IncomeDeductions.DeductionUs57iia     (family-pension std ded 57(iia))
     LTCG112A.{TotSaleCnsdrn, TotCstAcqisn, LongCap112A}  (exempt LTCG u/s 112A,
        carried only up to ₹1,25,000; excess ⇒ the return must move to ITR-2)

   Publishes on S.C.os (book contract):
     income       — head "Income from other sources" (≥0)  → GTI
     dividendQtr  — the five 234C period figures (schema keys) → interest engine
     sav / dep    — savings- and deposit-interest, read by the ded section for
                    the 80TTA / 80TTB ceilings
     ltcg / ltcgOver / ltcgSale / ltcgCost / ltcgGain — the 112A disclosure
   Reads S.C.ret.regime (the family-pension 57(iia) ceiling is 25,000 new /
   15,000 old).  Every read is guarded; nothing throws.

   Model note: the dividend total is one OthersInc row (nature DIV); its
   quarter-by-quarter split (for 234C) is captured once, in S.osx, and attached
   to the first DIV row on export.  The ₹1.25L 112A gain sits in S.ltcg.
   ===================================================================== */

/* ---- state (seed only what is absent) ------------------------------ */
S.os   = Array.isArray(S.os) ? S.os : [];   /* OthersIncDtlsOthSrc[] rows {sec,amt,desc} */
S.osx  = S.osx  || {};                        /* dividend quarters q1..q5 (DIV DateRange) */
S.ltcg = S.ltcg || {};                        /* LTCG112A {sale, cost} */

/* ---- OthSrcNatureDesc — enums.json OthersInc_OthSrcNatureDesc (verbatim) --- */
const OS_NAT = [
  ["SAV","Interest from a savings account"],
  ["IFD","Interest from a deposit — bank, post office or co-operative society"],
  ["TAX","Interest on an income-tax refund"],
  ["OII","Any other interest income"],
  ["FAP","Family pension"],
  ["DIV","Dividend income"],
  ["10(11)(iP)","Provident-fund interest taxable — first proviso to 10(11)"],
  ["10(11)(iiP)","Provident-fund interest taxable — second proviso to 10(11)"],
  ["10(12)(iP)","Provident-fund interest taxable — first proviso to 10(12)"],
  ["10(12)(iiP)","Provident-fund interest taxable — second proviso to 10(12)"],
  ["OTH","Any other income"]];
const OS_NAT_SET = new Set(OS_NAT.map(x=>x[0]));

/* the five 234C dividend periods (enums.json DividendQuarters_DateRange) */
const OS_QTR = [
  ["q1","Upto15Of6","Up to 15 June 2025"],
  ["q2","Upto15Of9","16 June to 15 September 2025"],
  ["q3","Up16Of9To15Of12","16 September to 15 December 2025"],
  ["q4","Up16Of12To15Of3","16 December 2025 to 15 March 2026"],
  ["q5","Up16Of3To31Of3","16 March to 31 March 2026"]];

/* regime — read S.C.ret.regime, fall back to the shell's own flag */
function os_regOld(){
  const r = RG(S.C,"ret.regime",null);
  if(r==null||r==="") return (typeof isNew==="function") ? !isNew() : ((S.fs||{}).optout==="Yes");
  const s = String(r).toLowerCase();
  return s==="old"||s==="y"||s==="yes"||s==="2";
}

/* ---- engine -------------------------------------------------------- */
function engOs(){
  const C = S.C.os = { income:0 };
  const rows = Array.isArray(S.os) ? S.os : [];
  let gross=0, sav=0, dep=0, fap=0, div=0, hasDiv=false;
  rows.forEach(r=>{
    const a = N(r.amt), sec = st0(r.sec);
    if(!OS_NAT_SET.has(sec)) return;
    if(sec==="DIV") hasDiv=true;
    if(!a) return;
    gross += a;
    if(sec==="SAV") sav += a;
    else if(sec==="IFD") dep += a;
    else if(sec==="FAP") fap += a;
    else if(sec==="DIV") div += a;
  });

  /* 57(iia) — a third of the family pension, capped 25,000 new / 15,000 old */
  const d57 = Math.min(R(fap/3), os_regOld()?15000:25000);
  const income = Math.max(0, gross - d57);

  /* dividend quarterly break-up (for 234C) — schema-keyed */
  const qx = S.osx || {};
  const dividendQtr = {};
  OS_QTR.forEach(q=>{ dividendQtr[q[1]] = n0(qx[q[0]]); });
  const divQtrTotal = OS_QTR.reduce((a,q)=>a+dividendQtr[q[1]],0);

  /* LTCG u/s 112A — ITR-1 carries it only up to ₹1,25,000 */
  const L = S.ltcg || {};
  const sale = n0(L.sale), cost = n0(L.cost);
  const gain = Math.max(0, sale-cost);
  const over = gain > 125000;
  const carried = over ? 0 : gain;

  Object.assign(C,{
    gross:R(gross), sav:R(sav), dep:R(dep), fap:R(fap), div:R(div),
    d57:R(d57), income:R(income), hasDiv,
    dividendQtr, divQtrTotal:R(divQtrTotal),
    ltcgSale:R(sale), ltcgCost:R(cost), ltcgGain:R(gain), ltcg:R(carried), ltcgOver:over
  });
}

/* ---- renderer ------------------------------------------------------ */
function secOs(){
  const C = S.C.os || {};
  let h = "";

  h += note("Interest, dividend, family pension and any other income that is not salary or house property. "+
    "Interest from a savings account and from deposits is read across to the 80TTA / 80TTB ceilings.");

  h += grid("os",[
      {k:"sec",h:"Nature of income",t:"sel",w:"430px",req:1,opts:OS_NAT},
      {k:"desc",h:"Description (where 'any other' is chosen)",t:"txt",w:"auto",max:80},
      {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],
    S.os,{min:"860px",empty:"No other income.",add:"Add a source",
      foot:[{l:1,v:"Total of the sources above",span:2},{v:C.gross}]});

  if(C.fap)
    h += row("Deduction under section 57(iia) on the family pension", cell(C.d57),
      {ref:"B3", hint:"a third of the family pension, capped at "+RS(os_regOld()?15000:25000)});

  /* dividend, quarter by quarter (only meaningful when a DIV row exists) */
  {
    let b = note("The quarter-by-quarter dividend is what interest under section 234C is worked out on. "+
      "It should add up to the dividend entered above.");
    OS_QTR.forEach(q=> b += row(q[2], inp("osx."+q[0],{n:1}), {ind:1}) );
    b += row("Dividend, quarterly total", cell(C.divQtrTotal), {cls:"tot"});
    h += fold("os_div","", "Dividend — quarterly break-up (section 234C)",
      (C.div?RS(C.div):""), b, {def:!!C.hasDiv});
  }

  /* LTCG u/s 112A (₹1.25L exempt disclosure) */
  {
    let b = note("Long-term capital gain on listed equity shares or equity mutual funds under section 112A. "+
      "ITR-1 can carry this only where the gain is <b>₹1,25,000 or less</b> (fully exempt). "+
      "A gain above ₹1,25,000 is taxable and must be filed on ITR-2.");
    b += row("Total sale consideration", inp("ltcg.sale",{n:1}), {ref:"D1"});
    b += row("Total cost of acquisition", inp("ltcg.cost",{n:1}), {ref:"D1"});
    b += row("Long-term capital gain u/s 112A", cell(C.ltcgGain), {cls:"tot"});
    b += row("Amount carried on this return (≤ ₹1,25,000, exempt)", cell(C.ltcg), {cls:"tot"});
    if(C.ltcgOver)
      b += note("This gain of "+RS(C.ltcgGain)+" is above ₹1,25,000 — ITR-1 cannot carry it. File ITR-2.","stop");
    h += fold("os_112a","D1","Exempt long-term capital gain u/s 112A",
      (C.ltcgGain?RS(C.ltcgGain):""), b, {def:!!(C.ltcgGain)});
  }

  h += row("Income from other sources", cell(C.income), {cls:"grand", ref:"B3"});
  return h;
}

/* ---- export -------------------------------------------------------- */
function expOs(j){
  const C = S.C.os || {};
  const rows = Array.isArray(S.os) ? S.os : [];

  const dq = C.dividendQtr || {};
  let divDone = false;
  const dtl = rows.filter(r=>OS_NAT_SET.has(st0(r.sec)) && N(r.amt)).map(r=>{
    const sec = st0(r.sec);
    const o = { OthSrcNatureDesc:sec, OthSrcOthAmount:n0(r.amt) };
    const d = sv(r.desc);
    if(d && (sec==="OTH"||sec==="OII")) o.OthSrcOthNatOfInc = d.slice(0,80);
    if(sec==="DIV" && !divDone){
      divDone = true;
      o.DividendInc = { DateRange:{
        Upto15Of6:       n0(dq.Upto15Of6),
        Upto15Of9:       n0(dq.Upto15Of9),
        Up16Of9To15Of12: n0(dq.Up16Of9To15Of12),
        Up16Of12To15Of3: n0(dq.Up16Of12To15Of3),
        Up16Of3To31Of3:  n0(dq.Up16Of3To31Of3) } };
    }
    return o;
  });
  if(dtl.length) put(j,"ITR1_IncomeDeductions.OthersInc",{OthersIncDtlsOthSrc:dtl});

  /* required head leaves — present even at 0 */
  put(j,"ITR1_IncomeDeductions.IncomeOthSrc",   n0(C.income));
  put(j,"ITR1_IncomeDeductions.DeductionUs57iia", n0(C.d57));

  /* LTCG112A — the VBA builder function is LTCG112A_New() (schema_tree.md line
     32444); the emitted JSON block key is LTCG112A. Always present (skeleton seeds
     it at 0); overwrite the three leaves. */
  put(j,"LTCG112A.TotSaleCnsdrn", n0(C.ltcgSale));
  put(j,"LTCG112A.TotCstAcqisn",  n0(C.ltcgCost));
  put(j,"LTCG112A.LongCap112A",   n0(C.ltcg));
}

/* ---- import (inverse) --------------------------------------------- */
function impOs(I){
  const read = [];
  const oi = RG(I,"ITR1_IncomeDeductions.OthersInc.OthersIncDtlsOthSrc",null);
  if(Array.isArray(oi) && oi.length){
    S.os = oi.map(r=>({
      sec: r.OthSrcNatureDesc||"",
      amt: r.OthSrcOthAmount!=null?String(r.OthSrcOthAmount):"",
      desc: r.OthSrcOthNatOfInc||"" }));
    const dv = oi.find(r=>r.OthSrcNatureDesc==="DIV" && r.DividendInc && r.DividendInc.DateRange);
    if(dv){
      const d = dv.DividendInc.DateRange;
      S.osx = {
        q1: d.Upto15Of6!=null?String(d.Upto15Of6):"",
        q2: d.Upto15Of9!=null?String(d.Upto15Of9):"",
        q3: d.Up16Of9To15Of12!=null?String(d.Up16Of9To15Of12):"",
        q4: d.Up16Of12To15Of3!=null?String(d.Up16Of12To15Of3):"",
        q5: d.Up16Of3To31Of3!=null?String(d.Up16Of3To31Of3):"" };
    }
    read.push("other sources");
  }
  const L = I && I.LTCG112A;
  if(L && (N(L.TotSaleCnsdrn)||N(L.TotCstAcqisn)||N(L.LongCap112A))){
    S.ltcg = { sale:String(L.TotSaleCnsdrn||""), cost:String(L.TotCstAcqisn||"") };
    read.push("LTCG u/s 112A");
  }
  return read;
}

/* ---- checks (section-local) --------------------------------------- */
function chkOs(){
  const out = []; engOs(); const C = S.C.os || {};
  (S.os||[]).forEach((r,i)=>{
    const started = st0(r.sec) || N(r.amt) || st0(r.desc);
    if(!started) return;
    if(!OS_NAT_SET.has(st0(r.sec)))
      out.push({lvl:"err",t:"Other source row "+(i+1),m:"Pick the nature of the income.",sec:"os"});
    if(!N(r.amt))
      out.push({lvl:"err",t:"Other source row "+(i+1),m:"Enter the amount of income.",sec:"os"});
    if(st0(r.sec)==="OTH" && !sv(r.desc))
      out.push({lvl:"warn",t:"Other source row "+(i+1),m:"Describe the 'any other' income.",sec:"os"});
  });
  if(C.hasDiv && (C.divQtrTotal||C.div) && C.divQtrTotal!==C.div)
    out.push({lvl:"warn",t:"Dividend quarters",m:"The quarter-by-quarter dividend ("+RS(C.divQtrTotal)+
      ") does not add up to the dividend entered ("+RS(C.div)+"); section 234C is worked out on the quarters.",sec:"os"});
  if(C.ltcgOver)
    out.push({lvl:"err",t:"LTCG u/s 112A",m:"The long-term capital gain u/s 112A of "+RS(C.ltcgGain)+
      " is above ₹1,25,000. ITR-1 cannot carry it — file ITR-2.",sec:"os"});
  if(!out.length && (C.income||C.ltcg))
    out.push({lvl:"ok",t:"Other sources",m:"Income from other sources "+RS(C.income)+
      (C.ltcg?"; exempt 112A gain "+RS(C.ltcg):"")+".",sec:"os"});
  return out;
}

/* ---- register ------------------------------------------------------ */
reg({id:"os", t:"Income from other sources", ref:"B3", f:secOs,
  s:()=>{const C=S.C.os||{}; const parts=[];
    if(C.income) parts.push(RS(C.income));
    if(C.ltcg)   parts.push("112A "+RS(C.ltcg));
    return parts.join(" · ");},
  eng:engOs, exp:expOs, imp:impOs, chk:chkOs, order:50, corder:44});
