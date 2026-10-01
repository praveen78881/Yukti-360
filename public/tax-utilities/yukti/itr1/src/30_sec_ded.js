/* =====================================================================
   ITR-1 · Section "ded" — Chapter VI-A deductions  (screen order 60,
   compute order 50).  The heaviest section: it owns the entered block, the
   allowed/capped block, AND every old-regime detail schedule (the prior
   builder collected these but never exported them — here they are emitted
   and they feed the allowed figure).

   OWNS, on export:
     ITR1_IncomeDeductions.UsrDeductUndChapVIA   (entered — 20 sections)
        + PensionContribution80CCC[]  (80CCC: TypeofIdentifier/Name/Amount)
        + PRANDtls[]                  (80CCD(1)/(1B) PRAN numbers)
        + NameOfSpecDisease80DDB      (80DDB disease enum)
        + Form10BAAckNum              (80GG Form 10BA)
        + TotalChapVIADeductions
     ITR1_IncomeDeductions.DeductUndChapVIA      (allowed/capped — 20 sections)
        + TotalChapVIADeductions
     Old-regime detail schedules (emitted only when OptOutNewTaxRegime=='Y'):
        Schedule80C, Schedule80D, Schedule80DD, Schedule80U,
        Schedule80E, Schedule80EE, Schedule80EEA, Schedule80EEB,
        Schedule80G, Schedule80GGA, Schedule80GGC

   Caps enforced EXACTLY (books/ITR-1/caps.md §3-§4):
     80C+80CCC+80CCD(1) group  1,50,000 (proportional trim)
     80CCD(1)  10% of salary   ·  80CCD(1B)  50,000
     80CCD(2)  14% (CGOV/SGOV) / 10% (other) of salary   [survives new regime]
     80CCH(2)  no fixed cap                               [survives new regime]
     80D  age-based least-of over the four insurer sub-blocks (25k/50k)
     80DD 75,000 (40-80%) / 1,25,000 (severe ≥80%)
     80DDB 40,000 / 1,00,000 (senior patient)
     80U  75,000 / 1,25,000 (severe)
     80E full · 80EE 50,000 · 80EEA 1,50,000 · 80EEB 1,50,000
     80G eligible per bucket (100/50 %, with/without the 10%-of-adjusted-GTI limit)
     80GG 60,000 · 80GGA full (cash >2,000 barred) · 80GGC full (cash barred)
     80TTA 10,000 (savings interest, non-senior)
     80TTB 50,000 (deposit interest, resident senior)
   NEW regime: only 80CCD(2)+80CCH(2) stand; everything else 0 and the detail
   schedules are neither rendered nor exported.

   Publishes S.C.ded.total (the allowed Chapter-VI-A total, capped at income).
   Reads S.C.ret.regime, S.C.who.senior, S.C.sal.netSalary, S.C.os.{sav,dep},
   S.C.sal.income / S.C.hp.income / S.C.os.income (adjusted-GTI base for 80G).
   Every read guarded; nothing throws.
   ===================================================================== */

/* ---- state (seed only what is absent) ------------------------------ */
S.ded = S.ded || {};
(function(){ const d=S.ded;
  if(!Array.isArray(d.c80c))  d.c80c=[];      /* Schedule80C {kind,amt,idno} */
  if(!Array.isArray(d.pen))   d.pen=[];       /* PensionContribution80CCC {type,name,amt} */
  if(!Array.isArray(d.pran))  d.pran=[];      /* PRANDtls {pran} */
  if(d.ccd1===undefined)  d.ccd1="";          /* 80CCD(1) own */
  if(d.ccd1b===undefined) d.ccd1b="";         /* 80CCD(1B) */
  if(d.ccd2===undefined)  d.ccd2="";          /* 80CCD(2) employer */
  if(d.cch===undefined)   d.cch="";           /* 80CCH(2) Agniveer */
  d.d80 = d.d80 || {selfSr:"N", parSr:"P"};   /* 80D flat amounts + flags */
  /* 80D per-insurer detail rows {name,policy,amt} for the four sub-blocks
     (Sch80DInsDtls[]): self/family, self/family senior, parents, parents senior */
  if(!Array.isArray(d.d80.insSelf))   d.d80.insSelf=[];
  if(!Array.isArray(d.d80.insSelfSr)) d.d80.insSelfSr=[];
  if(!Array.isArray(d.d80.insPar))    d.d80.insPar=[];
  if(!Array.isArray(d.d80.insParSr))  d.d80.insParSr=[];
  d.dd  = d.dd  || {};                         /* 80DD */
  d.u   = d.u   || {};                         /* 80U */
  d.ddb = d.ddb || {};                         /* 80DDB */
  if(!Array.isArray(d.e80))  d.e80=[];        /* 80E loans */
  if(!Array.isArray(d.ee80)) d.ee80=[];       /* 80EE loans */
  if(!Array.isArray(d.eea80))d.eea80=[];      /* 80EEA loans */
  if(!Array.isArray(d.eeb80))d.eeb80=[];      /* 80EEB loans */
  if(d.eeaStamp===undefined) d.eeaStamp="";   /* 80EEA PropStmpDtyVal */
  if(!Array.isArray(d.g100)) d.g100=[];       /* 80G Don100Percent */
  if(!Array.isArray(d.g50))  d.g50=[];        /* 80G Don50PercentNoApprReqd */
  if(!Array.isArray(d.g100q))d.g100q=[];      /* 80G Don100PercentApprReqd */
  if(!Array.isArray(d.g50q)) d.g50q=[];       /* 80G Don50PercentApprReqd (ArnNbr) */
  d.gg  = d.gg  || {};                          /* 80GG amount + Form10BAAckNum */
  if(!Array.isArray(d.gga))  d.gga=[];        /* 80GGA */
  if(!Array.isArray(d.ggc))  d.ggc=[];        /* 80GGC */
  if(d.tta===undefined) d.tta="";             /* 80TTA */
  if(d.ttb===undefined) d.ttb="";             /* 80TTB */
})();

/* ---- enums (verbatim from books/ITR-1/enums.json) ------------------ */
const DED_STATE = [
  ["01","ANDAMAN AND NICOBAR ISLANDS"],["02","ANDHRA PRADESH"],["03","ARUNACHAL PRADESH"],
  ["04","ASSAM"],["05","BIHAR"],["06","CHANDIGARH"],["07","DADRA AND NAGAR HAVELI"],
  ["08","DAMAN AND DIU"],["09","DELHI"],["10","GOA"],["11","GUJARAT"],["12","HARYANA"],
  ["13","HIMACHAL PRADESH"],["14","JAMMU AND KASHMIR"],["15","KARNATAKA"],["16","KERALA"],
  ["17","LAKSHADWEEP"],["18","MADHYA PRADESH"],["19","MAHARASHTRA"],["20","MANIPUR"],
  ["21","MEGHALAYA"],["22","MIZORAM"],["23","NAGALAND"],["24","ORISSA"],["25","PONDICHERRY"],
  ["26","PUNJAB"],["27","RAJASTHAN"],["28","SIKKIM"],["29","TAMILNADU"],["30","TRIPURA"],
  ["31","UTTAR PRADESH"],["32","WEST BENGAL"],["33","CHHATTISGARH"],["34","UTTARAKHAND"],
  ["35","JHARKHAND"],["36","TELANGANA"],["37","LADAKH"],["99","Foreign / Other"]];
const DED_ST_SET = new Set(DED_STATE.map(x=>x[0]));
const DED_NATDIS = [["1","Disability 40% or more but < 80%"],["2","Severe disability 80% or more"]];
const DED_TYPDIS = [["1","(i) autism, cerebral palsy, or multiple disabilities"],["2","(ii) others"]];
const DED_DEPTYPE = [["1","Spouse"],["2","Son"],["3","Daughter"],["4","Father"],
  ["5","Mother"],["6","Brother"],["7","Sister"],["8","Member of HUF"]];
const DED_DISEASE = [["a","Dementia"],["b","Dystonia Musculorum Deformans"],
  ["c","Motor Neuron Disease"],["d","Ataxia"],["e","Chorea"],["f","Hemiballismus"],
  ["g","Aphasia"],["h","Parkinsons Disease"],["i","Malignant Cancers"],["j","Full Blown AIDS"],
  ["k","Chronic Renal failure"],["l","Hematological disorders"],["m","Hemophilia"],["n","Thalassaemia"]];
/* Section80DDBUsrType — SELECT80DDB / DataBase!L3:L5 (patient category) */
const DED_80DDB_USR = [["1","Self or Dependent"],
  ["2","Self or Dependent — Senior Citizen (60 or above)"]];
const DED_SELFSR = [["N","No"],["Y","Yes — self / family includes a senior citizen"],
  ["S","Not claiming for self / family"]];
const DED_PARSR = [["P","Not claiming for parents"],["N","No"],
  ["Y","Yes — a parent is a senior citizen"]];
const DED_IDTYPE = [["PRAN","PRAN"],["OTHPRAN","Other than PRAN"]];
const DED_LOANFROM = [["B","Bank"],["I","Institution / other than a bank"]];
const DED_GGA_CLAUSE = [["80GGA2a","80GGA(2)(a)"],["80GGA2aa","80GGA(2)(aa)"],
  ["80GGA2b","80GGA(2)(b)"],["80GGA2bb","80GGA(2)(bb)"],["80GGA2c","80GGA(2)(c)"],
  ["80GGA2cc","80GGA(2)(cc)"],["80GGA2d","80GGA(2)(d)"],["80GGA2e","80GGA(2)(e)"]];
const DED_80C_KIND = [["LIC","Life insurance premium"],["PPF","Public provident fund"],
  ["EPF","Employees' provident fund"],["NSC","National savings certificate"],
  ["ELSS","Equity-linked savings scheme"],["ULIP","Unit-linked insurance plan"],
  ["TUIT","Tuition fees"],["HOUS","Housing-loan principal repayment"],
  ["SSY","Sukanya Samriddhi"],["FD5","5-year term deposit"],["OTH","Other 80C item"]];

/* ---- cross-section reads (guarded) --------------------------------- */
function ded_regOld(){
  const r = RG(S.C,"ret.regime",null);
  if(r==null||r==="") return (typeof isNew==="function") ? !isNew() : ((S.fs||{}).optout==="Yes");
  const s = String(r).toLowerCase();
  return s==="old"||s==="y"||s==="yes"||s==="2";
}
function ded_senior(){
  /* 80TTB is for a resident senior citizen aged 60 or above — this MUST
     include super-seniors (>=80), so gate on who.seniorAny (age>=60), not
     who.senior (which is 60-79 only, dropping the super-senior). */
  const w = RG(S.C,"who.seniorAny",null);
  if(w!=null) return !!w;
  const w2 = RG(S.C,"who.senior",null);
  if(w2!=null) return !!w2;
  return (typeof senior==="function") ? senior() : false;
}
function ded_netSal(){ return N(RG(S.C,"sal.netSalary",0)); }
function ded_govt(){ const e=st0(RG(S,"pi.empcat","")); return e==="CGOV"||e==="SGOV"; }

/* ---- small builders ------------------------------------------------ */
function ded_loanInt(arr){ return (arr||[]).reduce((a,r)=>a+n0(r.int),0); }
/* a donation row's eligible base before the 100/50 % factor: the "other mode"
   amount always counts; cash counts only up to ₹2,000 (cash > 2,000 barred) */
function ded_gBase(r){ const cash=n0(r.cash); return n0(r.other)+(cash<=2000?cash:0); }

/* ---- 80D age-based eligible (caps.md §4) --------------------------- */
function ded_80D(){
  const d = S.ded.d80||{};
  const block = (flag, prem, prev, med, skipCode) => {
    if(flag===skipCode) return 0;
    const sr  = flag==="Y";
    const cap = sr?50000:25000;
    const base = n0(prem) + (sr?n0(med):0) + Math.min(n0(prev),5000);
    return Math.min(base, cap);
  };
  const self = block(d.selfSr||"N",
      (d.selfSr==="Y"?d.hiSelfSr:d.hiSelf),
      (d.selfSr==="Y"?d.phcSelfSr:d.phcSelf),
      d.medSelfSr, "S");
  const par  = block(d.parSr||"P",
      (d.parSr==="Y"?d.hiParSr:d.hiPar),
      (d.parSr==="Y"?d.phcParSr:d.phcPar),
      d.medParSr, "P");
  return { self:R(self), par:R(par), total:R(self+par) };
}

/* ---- 80G eligible with the qualifying limit ------------------------ */
function ded_80G(adjGTI){
  const A=S.ded.g100||[], B=S.ded.g50||[], C=S.ded.g100q||[], Dq=S.ded.g50q||[];
  const sumBase = arr => (arr||[]).reduce((a,r)=>a+ded_gBase(r),0);
  const baseA=sumBase(A), baseB=sumBase(B), baseC=sumBase(C), baseD=sumBase(Dq);
  const eligA=baseA;                 /* 100% no limit */
  const eligB=R(0.5*baseB);          /* 50% no limit */
  /* qualifying-limit buckets: 10% of adjusted GTI, C then D, proportional */
  const qLimit = Math.max(0, R(0.10*adjGTI));
  const qTotal = baseC + baseD;
  let eligC=0, eligD=0, scale=1;
  if(qTotal>0){
    const allowedQ = Math.min(qTotal, qLimit);
    scale = allowedQ/qTotal;
    eligC = R(baseC*scale);          /* 100% of the scaled portion */
    eligD = R(0.5*baseD*scale);      /*  50% of the scaled portion */
  }
  return { baseA,baseB,baseC,baseD, eligA,eligB,eligC,eligD, scale, qLimit,
    total:R(eligA+eligB+eligC+eligD) };
}

/* ---- the engine ---------------------------------------------------- */
function engDed(){
  const D = S.ded, old = ded_regOld(), sr = ded_senior(), net = ded_netSal();
  const C = S.C.ded = { old, ent:{}, alw:{}, why:{}, total:0 };

  /* ===== entered amounts (from the schedules / direct inputs) ===== */
  const ent = {};
  ent.Section80C   = (D.c80c||[]).reduce((a,r)=>a+n0(r.amt),0);
  ent.Section80CCC = (D.pen ||[]).reduce((a,r)=>a+n0(r.amt),0);
  ent.Section80CCDEmployeeOrSE = n0(D.ccd1);
  ent.Section80CCD1B           = n0(D.ccd1b);
  ent.Section80CCDEmployer     = n0(D.ccd2);
  ent.AnyOthSec80CCH           = n0(D.cch);
  const d80 = ded_80D();
  ent.Section80D = R(d80.self+d80.par);
  ent.Section80DD  = st0((D.dd||{}).nature) ? ((D.dd.nature==="2")?125000:75000) : 0;
  ent.Section80U   = st0((D.u ||{}).nature) ? ((D.u.nature ==="2")?125000:75000) : 0;
  ent.Section80DDB = n0((D.ddb||{}).amt);
  ent.Section80E   = ded_loanInt(D.e80);
  ent.Section80EE  = ded_loanInt(D.ee80);
  ent.Section80EEA = ded_loanInt(D.eea80);
  ent.Section80EEB = ded_loanInt(D.eeb80);
  const gAll = ded_80G(0);   /* base donations, before the qualifying limit */
  ent.Section80G   = R(gAll.baseA + gAll.baseB + gAll.baseC + gAll.baseD);
  ent.Section80GG  = n0((D.gg||{}).amt);
  ent.Section80GGA = (D.gga||[]).reduce((a,r)=>a+ded_gBase(r),0);
  ent.Section80GGC = (D.ggc||[]).reduce((a,r)=>a+n0(r.other),0);   /* political: cash barred */
  ent.Section80TTA = n0(D.tta);
  ent.Section80TTB = n0(D.ttb);

  /* ===== allowed amounts (caps) ===== */
  const alw = {}, why = {};
  const set = (k,v,reason)=>{ alw[k]=R(Math.max(0,v)); if(reason) why[k]=reason; };

  /* the two that survive the new regime */
  const govtPct = ded_govt()?0.14:0.10;
  set("Section80CCDEmployer", Math.min(ent.Section80CCDEmployer, R(govtPct*net)),
    ent.Section80CCDEmployer>R(govtPct*net)?"limited to "+(ded_govt()?"14":"10")+"% of salary":"");
  set("AnyOthSec80CCH", ent.AnyOthSec80CCH);

  if(!old){
    /* new regime — everything else is disallowed and zero */
    ["Section80C","Section80CCC","Section80CCDEmployeeOrSE","Section80CCD1B",
     "Section80D","Section80DD","Section80DDB","Section80E","Section80EE","Section80EEA",
     "Section80EEB","Section80G","Section80GG","Section80GGA","Section80GGC","Section80U",
     "Section80TTA","Section80TTB"].forEach(k=>{
      alw[k]=0; if(ent[k]) why[k]="closed by section 115BAC";
    });
  } else {
    /* 80C-group with the ₹1.5L aggregate ceiling (and 80CCD(1) 10%-of-salary) */
    let c1  = Math.min(ent.Section80CCDEmployeeOrSE, R(0.10*net));
    if(ent.Section80CCDEmployeeOrSE>R(0.10*net)) why.Section80CCDEmployeeOrSE="limited to 10% of salary";
    let c80c=ent.Section80C, cccc=ent.Section80CCC;
    let grp = c80c+cccc+c1;
    if(grp>150000){
      const f=150000/grp;
      c80c=R(c80c*f); cccc=R(cccc*f); c1=150000-c80c-cccc;
      why.Section80C="80C, 80CCC and 80CCD(1) together stop at ₹1,50,000";
    }
    set("Section80C",c80c,why.Section80C);
    set("Section80CCC",cccc);
    set("Section80CCDEmployeeOrSE",c1,why.Section80CCDEmployeeOrSE);

    set("Section80CCD1B", Math.min(ent.Section80CCD1B,50000),
      ent.Section80CCD1B>50000?"capped at ₹50,000":"");
    set("Section80D", d80.total);
    set("Section80DD", ent.Section80DD);
    set("Section80DDB", Math.min(ent.Section80DDB, ((D.ddb||{}).usrType==="2")?100000:40000),
      ent.Section80DDB>(((D.ddb||{}).usrType==="2")?100000:40000)?"capped at "+RS(((D.ddb||{}).usrType==="2")?100000:40000):"");
    set("Section80U", ent.Section80U);
    set("Section80E", ent.Section80E);
    set("Section80EE", Math.min(ent.Section80EE,50000), ent.Section80EE>50000?"capped at ₹50,000":"");
    set("Section80EEA",Math.min(ent.Section80EEA,150000),ent.Section80EEA>150000?"capped at ₹1,50,000":"");
    set("Section80EEB",Math.min(ent.Section80EEB,150000),ent.Section80EEB>150000?"capped at ₹1,50,000":"");
    set("Section80GG", Math.min(ent.Section80GG,60000), ent.Section80GG>60000?"capped at ₹60,000":"");
    set("Section80GGA", ent.Section80GGA);
    set("Section80GGC", ent.Section80GGC);

    /* 80TTA / 80TTB — mutually exclusive by age, limited to the interest earned */
    const sav=N(RG(S.C,"os.sav",0)), dep=N(RG(S.C,"os.dep",0));
    if(sr){
      set("Section80TTA",0, ent.Section80TTA?"a senior citizen claims 80TTB":"");
      set("Section80TTB", Math.min(ent.Section80TTB, 50000, sav+dep),
        ent.Section80TTB>Math.min(50000,sav+dep)?"limited to ₹50,000 / the deposit interest":"");
    } else {
      set("Section80TTB",0, ent.Section80TTB?"80TTB is for a resident senior citizen":"");
      set("Section80TTA", Math.min(ent.Section80TTA, 10000, sav),
        ent.Section80TTA>Math.min(10000,sav)?"limited to ₹10,000 / the savings interest":"");
    }

    /* 80G — the qualifying limit needs an adjusted-GTI base net of the other
       Chapter-VI-A deductions computed above */
    const incBase = Math.max(0,
       N(RG(S.C,"sal.income", Math.max(0,net-(old?50000:75000)))) +
       N(RG(S.C,"hp.income",0)) + N(RG(S.C,"os.income",0)));
    let sub80=0; Object.keys(alw).forEach(k=>{ if(k!=="Section80G") sub80+=alw[k]; });
    const adjGTI = Math.max(0, incBase - sub80);
    const g = ded_80G(adjGTI);
    C.g = g;
    set("Section80G", g.total);
  }

  /* totals */
  let total=0; Object.keys(alw).forEach(k=>total+=alw[k]);
  /* the allowed total cannot exceed the income it is set against */
  const incBase = Math.max(0,
     N(RG(S.C,"sal.income", Math.max(0,net-(old?50000:75000)))) +
     N(RG(S.C,"hp.income",0)) + N(RG(S.C,"os.income",0)));
  const capped = Math.min(total, incBase);

  C.ent=ent; C.alw=alw; C.why=why; C.d80=d80;
  C.entTotal=R(total===0?0:Object.keys(ent).reduce((a,k)=>a+n0(ent[k]),0));
  C.total=R(capped);          /* published: allowed Chapter-VI-A total */
  C.allowedRaw=R(total);
  C.clipped=total>incBase;
}

/* ---- renderer ------------------------------------------------------ */
function secDed(){
  const C = S.C.ded||{}, alw=C.alw||{}, why=C.why||{}, old=C.old, D=S.ded;
  let h = "";

  if(!old){
    h += note("<b>Under section 115BAC only two Chapter-VI-A deductions survive</b> — the "+
      "employer's contribution under 80CCD(2) and the Agniveer Corpus Fund under 80CCH(2). "+
      "The rest are closed in the new regime; switch to the old regime to claim them.","stop");
    h += row("80CCD(2) — employer's contribution to a pension scheme", inp("ded.ccd2",{n:1}),
      {ref:"5e", v2:cell(alw.Section80CCDEmployer), hint:"14% of salary (Government) / 10% (other)"});
    h += row("80CCH(2) — Agniveer Corpus Fund", inp("ded.cch",{n:1}),
      {ref:"5w", v2:cell(alw.AnyOthSec80CCH)});
    h += row("Total Chapter VI-A deductions allowed", cell(C.total), {cls:"grand", ref:"C1"});
    return h;
  }

  /* --- headline table (entered vs allowed) --- */
  h += '<div class="r sub"><div class="l">Section</div><div class="ref"></div>'+
       '<div class="v2 hd2">You claim</div><div class="v hd2">Allowed</div></div>';

  /* 80C group */
  h += row("80C — total of the items listed below", cell(alw.Section80C),
    {ref:"5a", v2:cell((C.ent||{}).Section80C), hint:why.Section80C||"group ceiling ₹1,50,000"});
  h += fold("d_80c","","80C — items claimed (life insurance, PF, tuition, housing principal …)",
    (C.ent&&C.ent.Section80C?RS(C.ent.Section80C):""),
    grid("ded.c80c",[
      {k:"kind",h:"Item",t:"sel",w:"230px",opts:DED_80C_KIND},
      {k:"idno",h:"Identifier / policy / account number",t:"txt",w:"auto"},
      {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],
      D.c80c,{min:"720px",empty:"No 80C item listed.",add:"Add an 80C item",
        foot:[{l:1,v:"Total 80C",span:2},{v:(C.ent||{}).Section80C||0}]}) +
    note("The group of 80C, 80CCC and 80CCD(1) together is capped at ₹1,50,000."));

  /* 80CCC */
  h += row("80CCC — pension fund", cell(alw.Section80CCC), {ref:"5b", v2:cell((C.ent||{}).Section80CCC)});
  h += fold("d_80ccc","","80CCC — pension-fund contribution (PRAN / other)",
    (C.ent&&C.ent.Section80CCC?RS(C.ent.Section80CCC):""),
    grid("ded.pen",[
      {k:"type",h:"Type of identifier",t:"sel",w:"180px",opts:DED_IDTYPE,req:1},
      {k:"name",h:"Name of the identifier",t:"txt",w:"auto",req:1},
      {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],
      D.pen,{min:"680px",empty:"No 80CCC contribution.",add:"Add a contribution",
        foot:[{l:1,v:"Total 80CCC",span:2},{v:(C.ent||{}).Section80CCC||0}]}));

  /* 80CCD(1) / (1B) / (2) */
  h += row("80CCD(1) — own contribution to a pension scheme", inp("ded.ccd1",{n:1}),
    {ref:"5c", v2:cell(alw.Section80CCDEmployeeOrSE), hint:why.Section80CCDEmployeeOrSE||"within the ₹1.5L group; 10% of salary"});
  h += row("80CCD(1B) — further NPS contribution", inp("ded.ccd1b",{n:1}),
    {ref:"5d", v2:cell(alw.Section80CCD1B), hint:"ceiling ₹50,000"});
  h += row("80CCD(2) — employer's contribution", inp("ded.ccd2",{n:1}),
    {ref:"5e", v2:cell(alw.Section80CCDEmployer), hint:"14% of salary (Government) / 10% (other)"});
  if(N(D.ccd1)||N(D.ccd1b))
    h += fold("d_pran","","PRAN — for the NPS contributions claimed", "",
      grid("ded.pran",[{k:"pran",h:"PRAN number",t:"txt",w:"auto",req:1}],
        D.pran,{min:"420px",empty:"No PRAN given.",add:"Add a PRAN"}));

  /* 80D */
  h += row("80D — health insurance and preventive check-up", cell(alw.Section80D),
    {ref:"5g", v2:cell((C.ent||{}).Section80D)});
  h += fold("d_80d","","80D — health insurance, self / family and parents",
    (C.ent&&C.ent.Section80D?RS(alw.Section80D):""),
    row("Is the person or a family member (other than a parent) a senior citizen?",
      sel("ded.d80.selfSr",DED_SELFSR,{blank:false}),{req:1})+
    sub("Self and family")+
    row("Health insurance premium (non-senior)",inp("ded.d80.hiSelf",{n:1}),{ind:1})+
    sub("Insurer-wise detail (name, policy number and amount) — sl. 1a(i)")+
    ded_80DinsGrid("ded.d80.insSelf",D.d80.insSelf)+
    row("Preventive health check-up (non-senior)",inp("ded.d80.phcSelf",{n:1}),{ind:1,hint:"within ₹5,000"})+
    row("Health insurance premium (senior)",inp("ded.d80.hiSelfSr",{n:1}),{ind:1})+
    sub("Insurer-wise detail (name, policy number and amount) — sl. 1b(i)")+
    ded_80DinsGrid("ded.d80.insSelfSr",D.d80.insSelfSr)+
    row("Preventive health check-up (senior)",inp("ded.d80.phcSelfSr",{n:1}),{ind:1,hint:"within ₹5,000"})+
    row("Medical expenditure — senior, where no health insurance",inp("ded.d80.medSelfSr",{n:1}),{ind:1})+
    row("Is any one of the parents a senior citizen?",sel("ded.d80.parSr",DED_PARSR,{blank:false}),{req:1})+
    sub("Parents")+
    row("Health insurance premium (non-senior)",inp("ded.d80.hiPar",{n:1}),{ind:1})+
    sub("Insurer-wise detail (name, policy number and amount) — sl. 2a(i)")+
    ded_80DinsGrid("ded.d80.insPar",D.d80.insPar)+
    row("Preventive health check-up (non-senior)",inp("ded.d80.phcPar",{n:1}),{ind:1,hint:"within ₹5,000"})+
    row("Health insurance premium (senior)",inp("ded.d80.hiParSr",{n:1}),{ind:1})+
    sub("Insurer-wise detail (name, policy number and amount) — sl. 2b(i)")+
    ded_80DinsGrid("ded.d80.insParSr",D.d80.insParSr)+
    row("Preventive health check-up (senior)",inp("ded.d80.phcParSr",{n:1}),{ind:1,hint:"within ₹5,000"})+
    row("Medical expenditure — senior, where no health insurance",inp("ded.d80.medParSr",{n:1}),{ind:1})+
    row("80D eligible — computed",cell(alw.Section80D),{cls:"tot"})+
    note("Where a health-insurance premium is claimed, list each insurer with the policy number and the "+
      "amount — the name of the insurer and the policy number are mandatory for each row.","warn")+
    note("The ceiling is ₹25,000 for self and family, ₹50,000 where a senior citizen is covered, "+
      "and the same again for parents. Preventive health check-up sits inside those ceilings."));

  /* 80DD */
  h += row("80DD — maintenance of a dependant with a disability", cell(alw.Section80DD),
    {ref:"5h", v2:cell((C.ent||{}).Section80DD)});
  h += fold("d_80dd","","80DD — dependant with a disability",
    (C.ent&&C.ent.Section80DD?RS(alw.Section80DD):""),
    row("Nature of the disability",sel("ded.dd.nature",DED_NATDIS),{req:1,hint:"75,000 (40-80%) / 1,25,000 (severe)"})+
    row("Type of the disability",sel("ded.dd.type",DED_TYPDIS),{req:1})+
    row("Type of dependant",sel("ded.dd.depType",DED_DEPTYPE),{req:1})+
    row("PAN of the dependant",inp("ded.dd.pan",{max:10}))+
    row("Aadhaar of the dependant",inp("ded.dd.aadhaar",{max:12}))+
    row("Acknowledgement number of Form 10-IA",inp("ded.dd.form10ia",{max:15}),{req:1})+
    row("UDID number",inp("ded.dd.udid",{max:20}))+
    formNote("<b>Form 10-IA</b> has to be filed before the return."));

  /* 80DDB */
  h += row("80DDB — treatment of a specified disease", inp("ded.ddb.amt",{n:1}),
    {ref:"5i", v2:cell(alw.Section80DDB), hint:why.Section80DDB||"40,000 / 1,00,000 (senior patient)"});
  if(N((D.ddb||{}).amt))
    h += fold("d_80ddb","","80DDB — specified disease","",
      row("Name of the specified disease",sel("ded.ddb.disease",DED_DISEASE),{req:1})+
      row("Patient category",sel("ded.ddb.usrType",DED_80DDB_USR),
        {req:1,ref:"Section80DDBUsrType",hint:"a senior-citizen patient raises the ceiling to ₹1,00,000"})+
      formNote("A prescription from a specialist under rule 11DD has to be kept on record."));

  /* 80E / 80EE / 80EEA / 80EEB */
  h += row("80E — interest on an education loan", cell(alw.Section80E),
    {ref:"5j", v2:cell((C.ent||{}).Section80E), hint:"full interest, no ceiling"});
  h += fold("d_80e","","80E — education-loan interest",
    (C.ent&&C.ent.Section80E?RS(C.ent.Section80E):""), ded_loanGrid("ded.e80",D.e80));
  h += row("80EE — housing-loan interest (first-time buyer)", cell(alw.Section80EE),
    {ref:"5k", v2:cell((C.ent||{}).Section80EE), hint:why.Section80EE||"ceiling ₹50,000"});
  h += fold("d_80ee","","80EE — housing-loan interest",
    (C.ent&&C.ent.Section80EE?RS(C.ent.Section80EE):""), ded_loanGrid("ded.ee80",D.ee80));
  h += row("80EEA — interest on a loan for affordable housing", cell(alw.Section80EEA),
    {ref:"5l", v2:cell((C.ent||{}).Section80EEA), hint:why.Section80EEA||"ceiling ₹1,50,000"});
  h += fold("d_80eea","","80EEA — affordable-housing loan interest",
    (C.ent&&C.ent.Section80EEA?RS(C.ent.Section80EEA):""),
    row("Stamp-duty value of the property",inp("ded.eeaStamp",{n:1}),{hint:"must be ₹45 lakh or less"})+
    ded_loanGrid("ded.eea80",D.eea80));
  h += row("80EEB — interest on a loan to buy an electric vehicle", cell(alw.Section80EEB),
    {ref:"5m", v2:cell((C.ent||{}).Section80EEB), hint:why.Section80EEB||"ceiling ₹1,50,000"});
  h += fold("d_80eeb","","80EEB — electric-vehicle loan interest",
    (C.ent&&C.ent.Section80EEB?RS(C.ent.Section80EEB):""), ded_loanGrid("ded.eeb80",D.eeb80,true));

  /* 80G */
  h += row("80G — donations", cell(alw.Section80G), {ref:"5n", v2:cell((C.ent||{}).Section80G),
    hint:"eligible amount after the 100/50% factor and the 10%-of-income limit"});
  h += fold("d_80g","","80G — donations, donee by donee",
    (C.ent&&C.ent.Section80G?RS(alw.Section80G):""),
    note("Where any row is filled, every field in that row is mandatory. A donation in cash above "+
      "₹2,000 gives no deduction — enter it under 'other mode'.","warn")+
    ded_gGrid("100% deduction, no qualifying limit","ded.g100",D.g100,false)+
    ded_gGrid("50% deduction, no qualifying limit","ded.g50",D.g50,false)+
    ded_gGrid("100% deduction, subject to the qualifying limit","ded.g100q",D.g100q,false)+
    ded_gGrid("50% deduction, subject to the qualifying limit","ded.g50q",D.g50q,true));

  /* 80GG */
  h += row("80GG — rent paid where no HRA is received", inp("ded.gg.amt",{n:1}),
    {ref:"5o", v2:cell(alw.Section80GG), hint:why.Section80GG||"ceiling ₹60,000 (least-of rule)"});
  if(N((D.gg||{}).amt))
    h += fold("d_80gg","","80GG — Form 10BA","",
      formNote("A claim under 80GG needs <b>Form 10BA</b>. Enter its acknowledgement number.")+
      row("Acknowledgement number of Form 10BA",inp("ded.gg.ack",{max:15}),{req:1,hint:"fifteen digits"}));

  /* 80GGA */
  h += row("80GGA — scientific research or rural development", cell(alw.Section80GGA),
    {ref:"5p", v2:cell((C.ent||{}).Section80GGA)});
  h += fold("d_80gga","","80GGA — donations for scientific research / rural development",
    (C.ent&&C.ent.Section80GGA?RS(C.ent.Section80GGA):""),
    grid("ded.gga",[
      {k:"clause",h:"Clause",t:"sel",w:"150px",opts:DED_GGA_CLAUSE,req:1},
      {k:"name",h:"Name of the donee",t:"txt",w:"auto",req:1},
      {k:"addr",h:"Address",t:"txt",w:"auto"},
      {k:"city",h:"City / town",t:"txt",w:"120px"},
      {k:"state",h:"State",t:"sel",w:"140px",opts:DED_STATE},
      {k:"pin",h:"PIN",t:"txt",w:"90px",max:6},
      {k:"pan",h:"PAN of the donee",t:"txt",w:"120px",max:10,req:1},
      {k:"cash",h:"In cash",t:"num",w:"110px"},
      {k:"other",h:"Other mode",t:"num",w:"110px"}],
      D.gga,{min:"1180px",empty:"No 80GGA donation.",add:"Add a donee"})+
    note("A donation in cash above ₹2,000 gives no deduction.","warn"));

  /* 80GGC */
  h += row("80GGC — contribution to a political party / electoral trust", cell(alw.Section80GGC),
    {ref:"5q", v2:cell((C.ent||{}).Section80GGC)});
  h += fold("d_80ggc","","80GGC — political-party contribution",
    (C.ent&&C.ent.Section80GGC?RS(C.ent.Section80GGC):""),
    grid("ded.ggc",[
      {k:"name",h:"Name of the party / electoral trust",t:"txt",w:"auto",req:1},
      {k:"pan",h:"PAN",t:"txt",w:"120px",max:10,req:1},
      {k:"dt",h:"Date of contribution",t:"date",w:"130px",req:1},
      {k:"cash",h:"In cash (barred)",t:"num",w:"110px"},
      {k:"other",h:"Other mode",t:"num",w:"110px",req:1},
      {k:"ifsc",h:"IFSC",t:"txt",w:"120px",max:11},
      {k:"ref",h:"Transaction reference",t:"txt",w:"160px"}],
      D.ggc,{min:"1120px",empty:"No 80GGC contribution.",add:"Add a contribution"})+
    note("A contribution in cash gives no deduction at all.","warn"));

  /* 80U */
  h += row("80U — the person has a disability", cell(alw.Section80U),
    {ref:"5v", v2:cell((C.ent||{}).Section80U)});
  h += fold("d_80u","","80U — self with a disability",
    (C.ent&&C.ent.Section80U?RS(alw.Section80U):""),
    row("Nature of the disability",sel("ded.u.nature",DED_NATDIS),{req:1,hint:"75,000 (40-80%) / 1,25,000 (severe)"})+
    row("Type of the disability",sel("ded.u.type",DED_TYPDIS),{req:1})+
    row("Acknowledgement number of Form 10-IA",inp("ded.u.form10ia",{max:15}),{req:1})+
    row("UDID number",inp("ded.u.udid",{max:20}))+
    formNote("<b>Form 10-IA</b> has to be filed before the return."));

  /* 80TTA / 80TTB */
  h += row("80TTA — interest on a savings account", inp("ded.tta",{n:1}),
    {ref:"5t", v2:cell(alw.Section80TTA), hint:why.Section80TTA||"ceiling ₹10,000, non-senior"});
  h += row("80TTB — interest on deposits (resident senior citizen)", inp("ded.ttb",{n:1}),
    {ref:"5u", v2:cell(alw.Section80TTB), hint:why.Section80TTB||"ceiling ₹50,000"});

  /* 80CCH */
  h += row("80CCH(2) — Agniveer Corpus Fund", inp("ded.cch",{n:1}),
    {ref:"5w", v2:cell(alw.AnyOthSec80CCH)});

  h += row("Total Chapter VI-A deductions allowed", cell(C.total), {cls:"grand", ref:"C1"});
  if(C.clipped) h += note("The deductions have been limited to the income they are set against.","warn");
  return h;
}

/* a shared 80D per-insurer detail grid (Sch80DInsDtls[]): name / policy / amount */
function ded_80DinsGrid(key,rows){
  return grid(key,[
    {k:"name",h:"Name of the insurer",t:"txt",w:"auto",req:1},
    {k:"policy",h:"Policy number",t:"txt",w:"200px",req:1},
    {k:"amt",h:"Amount",t:"num",w:"140px",req:1}],
    rows,{min:"680px",empty:"No insurer / policy listed.",add:"Add an insurer / policy",
      foot:[{l:1,v:"Total payments",span:2},{v:(rows||[]).reduce((a,r)=>a+n0(r.amt),0)}]});
}
/* a shared loan-table grid (80E/80EE/80EEA/80EEB); vehReg adds the reg number */
function ded_loanGrid(key,rows,vehReg){
  const cols=[
    {k:"from",h:"Lender",t:"sel",w:"120px",opts:DED_LOANFROM,req:1},
    {k:"name",h:"Name of the lender",t:"txt",w:"auto",req:1},
    {k:"acno",h:"Loan account / reference number",t:"txt",w:"200px",req:1},
    {k:"dt",h:"Date of loan",t:"date",w:"130px"},
    {k:"amt",h:"Loan amount",t:"num",w:"130px"},
    {k:"out",h:"Outstanding",t:"num",w:"130px"},
    {k:"int",h:"Interest paid",t:"num",w:"130px",req:1}];
  if(vehReg) cols.splice(3,0,{k:"vehreg",h:"Vehicle registration",t:"txt",w:"150px"});
  return grid(key,cols,rows,{min:(vehReg?"1080px":"1000px"),
    empty:"No loan listed.",add:"Add a loan",
    foot:[{l:1,v:"Total interest",span:(vehReg?6:5)},{v:ded_loanInt(rows)}]});
}
/* a shared 80G bucket grid */
function ded_gGrid(title,key,rows,arn){
  const cols=[
    {k:"name",h:"Name of the donee",t:"txt",w:"auto",req:1},
    {k:"pan",h:"PAN of the donee",t:"txt",w:"120px",max:10,req:1},
    {k:"addr",h:"Address",t:"txt",w:"auto"},
    {k:"city",h:"City / town",t:"txt",w:"120px"},
    {k:"state",h:"State",t:"sel",w:"140px",opts:DED_STATE},
    {k:"pin",h:"PIN",t:"txt",w:"80px",max:6},
    {k:"cash",h:"In cash",t:"num",w:"100px"},
    {k:"other",h:"Other mode",t:"num",w:"100px"},
    {k:"ref",h:"Transaction ref.",t:"txt",w:"140px"},
    {k:"ifsc",h:"IFSC",t:"txt",w:"110px",max:11}];
  if(arn) cols.push({k:"arn",h:"ARN (donation certificate)",t:"txt",w:"150px"});
  return sub(title)+grid(key,cols,rows,{min:(arn?"1500px":"1360px"),
    empty:"No donation in this bucket.",add:"Add a donee"});
}

/* ---- export -------------------------------------------------------- */
const DED_KEYS = ["Section80C","Section80CCC","Section80CCDEmployeeOrSE","Section80CCD1B",
  "Section80CCDEmployer","Section80D","Section80DD","Section80DDB","Section80E","Section80EE",
  "Section80EEA","Section80EEB","Section80G","Section80GG","Section80GGA","Section80GGC",
  "Section80U","Section80TTA","Section80TTB","AnyOthSec80CCH"];

function expDed(j){
  const C=S.C.ded||{}, ent=C.ent||{}, alw=C.alw||{}, old=C.old, D=S.ded;
  const base = "ITR1_IncomeDeductions.";

  /* --- UsrDeductUndChapVIA (entered) + DeductUndChapVIA (allowed) --- */
  DED_KEYS.forEach(k=>{
    /* under the new regime only the two survivors carry an entered amount */
    const survives = (k==="Section80CCDEmployer"||k==="AnyOthSec80CCH");
    const eVal = (old||survives) ? n0(ent[k]) : 0;
    put(j, base+"UsrDeductUndChapVIA."+k, eVal);
    put(j, base+"DeductUndChapVIA."+k, n0(alw[k]));
  });
  let entTot=0, alwTot=0;
  DED_KEYS.forEach(k=>{
    const survives=(k==="Section80CCDEmployer"||k==="AnyOthSec80CCH");
    entTot += (old||survives)?n0(ent[k]):0; alwTot += n0(alw[k]);
  });
  put(j, base+"UsrDeductUndChapVIA.TotalChapVIADeductions", entTot);
  put(j, base+"DeductUndChapVIA.TotalChapVIADeductions", n0(C.total));

  /* --- nested leaves under UsrDeductUndChapVIA --- */
  if(old){
    const pen=(D.pen||[]).filter(r=>N(r.amt)).map(r=>({
      TypeofIdentifier: (r.type==="OTHPRAN")?"OTHPRAN":"PRAN",
      NameofIdentifier: (sv(r.name)||"NA"),
      Amount: n0(r.amt) }));
    if(pen.length) put(j, base+"UsrDeductUndChapVIA.PensionContribution80CCC", pen);
    const pran=(D.pran||[]).filter(r=>sv(r.pran)).map(r=>({PRANNum:sv(r.pran)}));
    if(pran.length) put(j, base+"UsrDeductUndChapVIA.PRANDtls", pran);
    if(N((D.ddb||{}).amt) && DED_DISEASE.some(x=>x[0]===(D.ddb||{}).disease))
      put(j, base+"UsrDeductUndChapVIA.NameOfSpecDisease80DDB", (D.ddb||{}).disease);
    if(N((D.ddb||{}).amt) && DED_80DDB_USR.some(x=>x[0]===(D.ddb||{}).usrType))
      put(j, base+"UsrDeductUndChapVIA.Section80DDBUsrType", (D.ddb||{}).usrType);
    if(N((D.gg||{}).amt) && sv((D.gg||{}).ack))
      put(j, base+"UsrDeductUndChapVIA.Form10BAAckNum", sv((D.gg||{}).ack));
  }

  /* --- old-regime detail schedules (only when OLD regime) --- */
  if(!old) return;

  /* Schedule80C */
  const c80c=(D.c80c||[]).filter(r=>N(r.amt)).map(r=>{
    const o={Amount:n0(r.amt)}; const id=sv(r.idno); if(id)o.IdentificationNo=id.slice(0,30); return o;});
  if(c80c.length) j.Schedule80C={ Schedule80CDtls:c80c,
    TotalAmt:n0((D.c80c||[]).reduce((a,r)=>a+n0(r.amt),0)) };

  /* Schedule80D */
  if(n0(alw.Section80D) || ded_80Dtouched()){
    const d=D.d80||{};
    const selfSr=(d.selfSr==="Y"||d.selfSr==="N"||d.selfSr==="S")?d.selfSr:"N";
    const parSr =(d.parSr==="Y"||d.parSr==="N"||d.parSr==="P")?d.parSr:"P";
    const b={
      SeniorCitizenFlag: selfSr,
      SelfAndFamily: n0(d.hiSelf)+Math.min(n0(d.phcSelf),5000),
      HealthInsPremSlfFam: n0(d.hiSelf),
      PrevHlthChckUpSlfFam: n0(d.phcSelf),
      SelfAndFamilySeniorCitizen: n0(d.hiSelfSr)+Math.min(n0(d.phcSelfSr),5000)+n0(d.medSelfSr),
      HlthInsPremSlfFamSrCtzn: n0(d.hiSelfSr),
      PrevHlthChckUpSlfFamSrCtzn: n0(d.phcSelfSr),
      MedicalExpSlfFamSrCtzn: n0(d.medSelfSr),
      ParentsSeniorCitizenFlag: parSr,
      Parents: n0(d.hiPar)+Math.min(n0(d.phcPar),5000),
      HlthInsPremParents: n0(d.hiPar),
      PrevHlthChckUpParents: n0(d.phcPar),
      ParentsSeniorCitizen: n0(d.hiParSr)+Math.min(n0(d.phcParSr),5000)+n0(d.medParSr),
      HlthInsPremParentsSrCtzn: n0(d.hiParSr),
      PrevHlthChckUpParentsSrCtzn: n0(d.phcParSr),
      MedicalExpParentsSrCtzn: n0(d.medParSr),
      EligibleAmountOfDedn: n0(alw.Section80D) };
    /* per-insurer detail sub-blocks (Sch80DInsDtls[] + TotalPayments) — one per
       health-insurance-premium slot; emitted only when at least one row is filled */
    const insBlock=rows=>{
      const rr=(rows||[]).filter(r=>sv(r.name)||sv(r.policy)||N(r.amt));
      if(!rr.length) return null;
      /* emit the insurer name / policy number VERBATIM (no "NA" placeholder):
         a blank must survive so rule A256-A259 can catch a premium claimed
         without the mandatory insurer name and policy number. */
      return { Sch80DInsDtls: rr.map(r=>({
                 InsurerName:(sv(r.name)||"").slice(0,75),
                 PolicyNo:(sv(r.policy)||"").slice(0,50),
                 HealthInsAmt:n0(r.amt) })),
               TotalPayments: n0(rr.reduce((a,r)=>a+n0(r.amt),0)) };
    };
    const ib1=insBlock(d.insSelf),   ib2=insBlock(d.insSelfSr),
          ib3=insBlock(d.insPar),    ib4=insBlock(d.insParSr);
    if(ib1) b.Sec80DSelfFamHIDtls=ib1;
    if(ib2) b.Sec80DSelfFamSrCtznHIDtls=ib2;
    if(ib3) b.Sec80DParentsHIDtls=ib3;
    if(ib4) b.Sec80DParentsSrCtznHIDtls=ib4;
    j.Schedule80D={ Sec80DSelfFamSrCtznHealth:b };
  }

  /* Schedule80DD */
  if(n0(alw.Section80DD)){
    const d=D.dd||{}, o={ DeductionAmount:n0(alw.Section80DD) };
    if(d.nature==="1"||d.nature==="2") o.NatureOfDisability=d.nature;
    if(d.type==="1"||d.type==="2")     o.TypeOfDisability=d.type;
    if(DED_DEPTYPE.some(x=>x[0]===d.depType)) o.DependentType=d.depType;
    if(sv(d.pan))     o.DependentPan=sv(d.pan).toUpperCase().slice(0,10);
    if(sv(d.aadhaar)) o.DependentAadhaar=sv(d.aadhaar).slice(0,12);
    if(sv(d.form10ia))o.Form10IAAckNum=sv(d.form10ia).slice(0,15);
    if(sv(d.udid))    o.UDIDNum=sv(d.udid).slice(0,20);
    j.Schedule80DD=o;
  }

  /* Schedule80U */
  if(n0(alw.Section80U)){
    const u=D.u||{}, o={ DeductionAmount:n0(alw.Section80U) };
    if(u.nature==="1"||u.nature==="2") o.NatureOfDisability=u.nature;
    if(u.type==="1"||u.type==="2")     o.TypeOfDisability=u.type;
    if(sv(u.form10ia)) o.Form10IAAckNum=sv(u.form10ia).slice(0,15);
    if(sv(u.udid))     o.UDIDNum=sv(u.udid).slice(0,20);
    j.Schedule80U=o;
  }

  /* Schedule80E / 80EE / 80EEA / 80EEB */
  const loanBlock=(rows,dtlsKey,intKey,totKey,extra)=>{
    const rr=(rows||[]).filter(r=>N(r.int)||sv(r.name));
    if(!rr.length) return null;
    const o={}; o[dtlsKey]=rr.map(r=>{
      const x={ LoanTknFrom:(r.from==="I")?"I":"B",
        BankOrInstnName:(sv(r.name)||"NA").slice(0,75),
        LoanAccNoOfBankOrInstnRefNo:(sv(r.acno)||"NA").slice(0,30) };
      if(ISO(r.dt)) x.DateofLoan=ISO(r.dt);
      x.TotalLoanAmt=n0(r.amt); x.LoanOutstndngAmt=n0(r.out);
      x[intKey]=n0(r.int);
      if(extra) extra(x,r);
      return x; });
    o[totKey]=n0(ded_loanInt(rr));
    return o;
  };
  const e=loanBlock(D.e80,"Schedule80EDtls","Interest80E","TotalInterest80E");
  if(e) j.Schedule80E=e;
  const ee=loanBlock(D.ee80,"Schedule80EEDtls","Interest80EE","TotalInterest80EE");
  if(ee) j.Schedule80EE=ee;
  const eea=loanBlock(D.eea80,"Schedule80EEADtls","Interest80EEA","TotalInterest80EEA");
  if(eea){ if(N(D.eeaStamp)) eea.PropStmpDtyVal=n0(D.eeaStamp); j.Schedule80EEA=eea; }
  const eeb=loanBlock(D.eeb80,"Schedule80EEBDtls","Interest80EEB","TotalInterest80EEB",
    (x,r)=>{ if(sv(r.vehreg)) x.VehicleRegNo=sv(r.vehreg).slice(0,20); });
  if(eeb) j.Schedule80EEB=eeb;

  /* Schedule80G — four buckets */
  const g=S.C.ded.g||ded_80G(0);
  const buckets=[
    ["Don100Percent",           D.g100, 1.00, false, 1],
    ["Don50PercentNoApprReqd",  D.g50,  0.50, false, 1],
    ["Don100PercentApprReqd",   D.g100q,1.00, false, g.scale],
    ["Don50PercentApprReqd",    D.g50q, 0.50, true,  g.scale]];
  let anyG=false; const sched={};
  let sTotCash=0,sTotOth=0,sTot=0,sTotElig=0;
  buckets.forEach(([bk,rows,factor,arn,scale])=>{
    const rr=(rows||[]).filter(r=>N(r.cash)||N(r.other)||sv(r.name));
    let bCash=0,bOth=0,bTot=0,bElig=0;
    const dwp=rr.map(r=>{
      const cash=n0(r.cash), oth=n0(r.other), tot=cash+oth;
      const eligBase=ded_gBase(r);
      const elig=R(factor*eligBase*(scale||1));
      bCash+=cash; bOth+=oth; bTot+=tot; bElig+=elig;
      const ad={};
      if(sv(r.addr)) ad.AddrDetail=sv(r.addr).slice(0,100);
      if(sv(r.city)) ad.CityOrTownOrDistrict=sv(r.city).slice(0,50);
      if(DED_ST_SET.has(st0(r.state))) ad.StateCode=st0(r.state);
      if(/^[1-9]\d{5}$/.test(st0(r.pin))) ad.PinCode=parseInt(r.pin,10);
      const o={ DoneeWithPanName:(sv(r.name)||"NA").slice(0,75),
        DoneePAN:(sv(r.pan)||"").toUpperCase().slice(0,10),
        DonationAmtCash:cash, DonationAmtOtherMode:oth,
        DonationAmt:tot, EligibleDonationAmt:elig };
      if(Object.keys(ad).length) o.AddressDetail=ad;
      if(sv(r.ref))  o.TransactionRefNum=sv(r.ref).slice(0,50);
      if(sv(r.ifsc)) o.IFSCCode=sv(r.ifsc).toUpperCase().slice(0,11);
      if(arn && sv(r.arn)) o.ArnNbr=sv(r.arn).slice(0,30);
      return o;
    });
    if(dwp.length){
      anyG=true;
      const blk={ DoneeWithPan:dwp };
      blk["TotDon"+bk+"Cash"]=R(bCash); blk["TotDon"+bk+"OtherMode"]=R(bOth);
      blk["TotDon"+bk]=R(bTot); blk["TotEligibleDon"+bk]=R(bElig);
      sched[bk]=blk;
      sTotCash+=bCash; sTotOth+=bOth; sTot+=bTot; sTotElig+=bElig;
    }
  });
  if(anyG){
    sched.TotalDonationsUs80GCash=R(sTotCash);
    sched.TotalDonationsUs80GOtherMode=R(sTotOth);
    sched.TotalDonationsUs80G=R(sTot);
    sched.TotalEligibleDonationsUs80G=R(sTotElig);
    j.Schedule80G=sched;
  }

  /* Schedule80GGA */
  const gga=(D.gga||[]).filter(r=>N(r.cash)||N(r.other)||sv(r.name));
  if(gga.length){
    let tCash=0,tOth=0,tTot=0,tElig=0;
    const rows=gga.map(r=>{
      const cash=n0(r.cash),oth=n0(r.other),tot=cash+oth,elig=ded_gBase(r);
      tCash+=cash;tOth+=oth;tTot+=tot;tElig+=elig;
      const o={ DonationAmtCash:cash, DonationAmtOtherMode:oth, DonationAmt:tot,
        EligibleDonationAmt:R(elig) };
      if(DED_GGA_CLAUSE.some(x=>x[0]===st0(r.clause))) o.RelevantClauseUndrDedClaimed=st0(r.clause);
      if(sv(r.name)) o.NameOfDonee=sv(r.name).slice(0,75);
      const ad={};
      if(sv(r.addr)) ad.AddrDetail=sv(r.addr).slice(0,100);
      if(sv(r.city)) ad.CityOrTownOrDistrict=sv(r.city).slice(0,50);
      if(DED_ST_SET.has(st0(r.state))) ad.StateCode=st0(r.state);
      if(/^[1-9]\d{5}$/.test(st0(r.pin))) ad.PinCode=parseInt(r.pin,10);
      if(Object.keys(ad).length) o.AddressDetail=ad;
      if(sv(r.pan)) o.DoneePAN=sv(r.pan).toUpperCase().slice(0,10);
      return o;
    });
    j.Schedule80GGA={ DonationDtlsSciRsrchRuralDev:rows,
      TotalDonationAmtCash80GGA:R(tCash), TotalDonationAmtOtherMode80GGA:R(tOth),
      TotalDonationsUs80GGA:R(tTot), TotalEligibleDonationAmt80GGA:R(tElig) };
  }

  /* Schedule80GGC — political party (cash barred) */
  const ggc=(D.ggc||[]).filter(r=>N(r.cash)||N(r.other)||sv(r.name));
  if(ggc.length){
    let tCash=0,tOth=0,tTot=0,tElig=0;
    const rows=ggc.map(r=>{
      const cash=n0(r.cash),oth=n0(r.other),tot=cash+oth;
      tCash+=cash;tOth+=oth;tTot+=tot;tElig+=oth;   /* cash gives no deduction */
      const o={ DonationAmtCash:cash, DonationAmtOtherMode:oth, DonationAmt:tot,
        EligibleDonationAmt:R(oth) };
      if(ISO(r.dt)) o.DonationDate=ISO(r.dt);
      if(sv(r.ifsc)) o.IFSCCode=sv(r.ifsc).toUpperCase().slice(0,11);
      if(sv(r.ref))  o.TransactionRefNum=sv(r.ref).slice(0,50);
      if(sv(r.name)) o.PoliticalPartyName=sv(r.name).slice(0,75);
      if(sv(r.pan))  o.PoliticalPartyPAN=sv(r.pan).toUpperCase().slice(0,10);
      return o;
    });
    j.Schedule80GGC={ Schedule80GGCDetails:rows,
      TotalDonationAmtCash80GGC:R(tCash), TotalDonationAmtOtherMode80GGC:R(tOth),
      TotalDonationsUs80GGC:R(tTot), TotalEligibleDonationAmt80GGC:R(tElig) };
  }
}
/* whether any 80D field is touched (so the schedule is emitted with the flags) */
function ded_80Dtouched(){
  const d=S.ded.d80||{};
  return N(d.hiSelf)||N(d.phcSelf)||N(d.hiSelfSr)||N(d.phcSelfSr)||N(d.medSelfSr)||
         N(d.hiPar)||N(d.phcPar)||N(d.hiParSr)||N(d.phcParSr)||N(d.medParSr);
}

/* ---- import (inverse) --------------------------------------------- */
function impDed(I){
  const read=[]; const ID=I&&I.ITR1_IncomeDeductions; if(!ID) return read;
  const usr=ID.UsrDeductUndChapVIA||{};
  const D=S.ded;
  if(N(usr.Section80CCDEmployeeOrSE)) D.ccd1=String(usr.Section80CCDEmployeeOrSE);
  if(N(usr.Section80CCD1B))  D.ccd1b=String(usr.Section80CCD1B);
  if(N(usr.Section80CCDEmployer)) D.ccd2=String(usr.Section80CCDEmployer);
  if(N(usr.AnyOthSec80CCH))  D.cch=String(usr.AnyOthSec80CCH);
  if(N(usr.Section80GG))     (D.gg=D.gg||{}).amt=String(usr.Section80GG);
  if(N(usr.Section80TTA))    D.tta=String(usr.Section80TTA);
  if(N(usr.Section80TTB))    D.ttb=String(usr.Section80TTB);
  if(N(usr.Section80DDB))    (D.ddb=D.ddb||{}).amt=String(usr.Section80DDB);
  if(usr.NameOfSpecDisease80DDB) (D.ddb=D.ddb||{}).disease=usr.NameOfSpecDisease80DDB;
  if(usr.Section80DDBUsrType!=null) (D.ddb=D.ddb||{}).usrType=String(usr.Section80DDBUsrType);
  if(usr.Form10BAAckNum)     (D.gg=D.gg||{}).ack=usr.Form10BAAckNum;
  if(Array.isArray(usr.PensionContribution80CCC))
    D.pen=usr.PensionContribution80CCC.map(r=>({type:r.TypeofIdentifier||"PRAN",
      name:r.NameofIdentifier||"", amt:r.Amount!=null?String(r.Amount):""}));
  if(Array.isArray(usr.PRANDtls))
    D.pran=usr.PRANDtls.map(r=>({pran:r.PRANNum||""}));

  const g=(o,p)=>RG(o,p,null);
  const c=g(I,"Schedule80C.Schedule80CDtls");
  if(Array.isArray(c)) { D.c80c=c.map(r=>({amt:r.Amount!=null?String(r.Amount):"",idno:r.IdentificationNo||""})); read.push("80C"); }
  const dd=I&&I.Schedule80DD;
  if(dd){ D.dd={nature:dd.NatureOfDisability||"",type:dd.TypeOfDisability||"",depType:dd.DependentType||"",
    pan:dd.DependentPan||"",aadhaar:dd.DependentAadhaar||"",form10ia:dd.Form10IAAckNum||"",udid:dd.UDIDNum||""}; read.push("80DD"); }
  const u=I&&I.Schedule80U;
  if(u){ D.u={nature:u.NatureOfDisability||"",type:u.TypeOfDisability||"",form10ia:u.Form10IAAckNum||"",udid:u.UDIDNum||""}; read.push("80U"); }
  const d8=g(I,"Schedule80D.Sec80DSelfFamSrCtznHealth");
  if(d8){ D.d80={selfSr:d8.SeniorCitizenFlag||"N",parSr:d8.ParentsSeniorCitizenFlag||"P",
    hiSelf:String(d8.HealthInsPremSlfFam||""),phcSelf:String(d8.PrevHlthChckUpSlfFam||""),
    hiSelfSr:String(d8.HlthInsPremSlfFamSrCtzn||""),phcSelfSr:String(d8.PrevHlthChckUpSlfFamSrCtzn||""),
    medSelfSr:String(d8.MedicalExpSlfFamSrCtzn||""),hiPar:String(d8.HlthInsPremParents||""),
    phcPar:String(d8.PrevHlthChckUpParents||""),hiParSr:String(d8.HlthInsPremParentsSrCtzn||""),
    phcParSr:String(d8.PrevHlthChckUpParentsSrCtzn||""),medParSr:String(d8.MedicalExpParentsSrCtzn||"")};
    /* per-insurer detail sub-blocks (round-trip) */
    const insIn=blk=>(RG(d8,blk+".Sch80DInsDtls",[])||[]).map(r=>({
      name:r.InsurerName||"",policy:r.PolicyNo||"",amt:r.HealthInsAmt!=null?String(r.HealthInsAmt):""}));
    D.d80.insSelf=insIn("Sec80DSelfFamHIDtls");
    D.d80.insSelfSr=insIn("Sec80DSelfFamSrCtznHIDtls");
    D.d80.insPar=insIn("Sec80DParentsHIDtls");
    D.d80.insParSr=insIn("Sec80DParentsSrCtznHIDtls");
    read.push("80D"); }
  const loanIn=(sch,dtls,intK)=>{const a=g(I,sch+"."+dtls);
    if(!Array.isArray(a))return null;
    return a.map(r=>({from:r.LoanTknFrom||"B",name:r.BankOrInstnName||"",acno:r.LoanAccNoOfBankOrInstnRefNo||"",
      dt:dmy(r.DateofLoan)||"",amt:r.TotalLoanAmt!=null?String(r.TotalLoanAmt):"",
      out:r.LoanOutstndngAmt!=null?String(r.LoanOutstndngAmt):"",int:r[intK]!=null?String(r[intK]):"",
      vehreg:r.VehicleRegNo||""}));};
  const e=loanIn("Schedule80E","Schedule80EDtls","Interest80E"); if(e){D.e80=e;read.push("80E");}
  const ee=loanIn("Schedule80EE","Schedule80EEDtls","Interest80EE"); if(ee){D.ee80=ee;read.push("80EE");}
  const eea=loanIn("Schedule80EEA","Schedule80EEADtls","Interest80EEA");
  if(eea){D.eea80=eea; const st=g(I,"Schedule80EEA.PropStmpDtyVal"); if(st!=null)D.eeaStamp=String(st); read.push("80EEA");}
  const eeb=loanIn("Schedule80EEB","Schedule80EEBDtls","Interest80EEB"); if(eeb){D.eeb80=eeb;read.push("80EEB");}

  const gRow=r=>({name:r.DoneeWithPanName||"",pan:r.DoneePAN||"",
    addr:(r.AddressDetail||{}).AddrDetail||"",city:(r.AddressDetail||{}).CityOrTownOrDistrict||"",
    state:(r.AddressDetail||{}).StateCode||"",pin:(r.AddressDetail||{}).PinCode!=null?String((r.AddressDetail||{}).PinCode):"",
    cash:r.DonationAmtCash!=null?String(r.DonationAmtCash):"",other:r.DonationAmtOtherMode!=null?String(r.DonationAmtOtherMode):"",
    ref:r.TransactionRefNum||"",ifsc:r.IFSCCode||"",arn:r.ArnNbr||""});
  const gb=(bk,dest)=>{const a=g(I,"Schedule80G."+bk+".DoneeWithPan"); if(Array.isArray(a)){D[dest]=a.map(gRow);return true;}return false;};
  if(gb("Don100Percent","g100")|gb("Don50PercentNoApprReqd","g50")|
     gb("Don100PercentApprReqd","g100q")|gb("Don50PercentApprReqd","g50q")) read.push("80G");
  const gga=g(I,"Schedule80GGA.DonationDtlsSciRsrchRuralDev");
  if(Array.isArray(gga)){D.gga=gga.map(r=>({clause:r.RelevantClauseUndrDedClaimed||"",name:r.NameOfDonee||"",
    addr:(r.AddressDetail||{}).AddrDetail||"",city:(r.AddressDetail||{}).CityOrTownOrDistrict||"",
    state:(r.AddressDetail||{}).StateCode||"",pin:(r.AddressDetail||{}).PinCode!=null?String((r.AddressDetail||{}).PinCode):"",
    pan:r.DoneePAN||"",cash:r.DonationAmtCash!=null?String(r.DonationAmtCash):"",
    other:r.DonationAmtOtherMode!=null?String(r.DonationAmtOtherMode):""}));read.push("80GGA");}
  const ggc=g(I,"Schedule80GGC.Schedule80GGCDetails");
  if(Array.isArray(ggc)){D.ggc=ggc.map(r=>({name:r.PoliticalPartyName||"",pan:r.PoliticalPartyPAN||"",
    dt:dmy(r.DonationDate)||"",cash:r.DonationAmtCash!=null?String(r.DonationAmtCash):"",
    other:r.DonationAmtOtherMode!=null?String(r.DonationAmtOtherMode):"",ifsc:r.IFSCCode||"",ref:r.TransactionRefNum||""}));read.push("80GGC");}
  if(read.length) read.unshift("Chapter VI-A");
  return read;
}

/* ---- checks (section-local) --------------------------------------- */
function chkDed(){
  const out=[]; engDed(); const C=S.C.ded||{}, ent=C.ent||{}, alw=C.alw||{}, old=C.old, D=S.ded;
  if(!old){
    const lost=DED_KEYS.filter(k=>k!=="Section80CCDEmployer"&&k!=="AnyOthSec80CCH"&&N(ent[k]));
    if(lost.length)
      out.push({lvl:"warn",t:"New regime",m:"Under section 115BAC only 80CCD(2) and 80CCH(2) are allowed; the other amounts entered are not deducted.",sec:"ded"});
  } else {
    /* 80G — every field of a filled donee row is mandatory */
    [["g100",D.g100],["g50",D.g50],["g100q",D.g100q],["g50q",D.g50q]].forEach(([nm,rows])=>{
      (rows||[]).forEach((r,i)=>{
        if(!(N(r.cash)||N(r.other)||sv(r.name)||sv(r.pan))) return;
        if(!sv(r.name)) out.push({lvl:"err",t:"80G row",m:"The name of the donee is required.",sec:"ded"});
        if(!PAN_RE.test(st0(r.pan).toUpperCase())) out.push({lvl:"err",t:"80G row",m:"A valid PAN of the donee is required.",sec:"ded"});
        if(N(r.cash)>2000) out.push({lvl:"warn",t:"80G cash",m:"A cash donation above ₹2,000 gives no deduction — the cash of "+RS(r.cash)+" is disallowed.",sec:"ded"});
      });
    });
    (D.ggc||[]).forEach(r=>{ if(N(r.cash)) out.push({lvl:"warn",t:"80GGC cash",m:"A political-party contribution in cash gives no deduction.",sec:"ded"}); });
    (D.gga||[]).forEach(r=>{ if(N(r.cash)>2000) out.push({lvl:"warn",t:"80GGA cash",m:"An 80GGA cash donation above ₹2,000 gives no deduction.",sec:"ded"}); });
    if(N((D.gg||{}).amt) && !sv((D.gg||{}).ack))
      out.push({lvl:"err",t:"80GG",m:"A claim under 80GG needs the acknowledgement number of Form 10BA.",sec:"ded"});
    if(N((D.ddb||{}).amt) && !DED_DISEASE.some(x=>x[0]===(D.ddb||{}).disease))
      out.push({lvl:"err",t:"80DDB",m:"Pick the specified disease for the 80DDB claim.",sec:"ded"});
    if(ent.Section80DD && !st0((D.dd||{}).form10ia))
      out.push({lvl:"warn",t:"80DD",m:"Form 10-IA acknowledgement number is needed for the 80DD claim.",sec:"ded"});
    if(ent.Section80U && !st0((D.u||{}).form10ia))
      out.push({lvl:"warn",t:"80U",m:"Form 10-IA acknowledgement number is needed for the 80U claim.",sec:"ded"});
    if(alw.Section80TTB && !ded_senior())
      out.push({lvl:"warn",t:"80TTB",m:"80TTB is for a resident senior citizen.",sec:"ded"});
  }
  if(C.clipped)
    out.push({lvl:"warn",t:"Chapter VI-A",m:"The deductions have been limited to the income they are set against.",sec:"ded"});
  if(!out.length && C.total)
    out.push({lvl:"ok",t:"Chapter VI-A",m:"Deductions allowed "+RS(C.total)+".",sec:"ded"});
  return out;
}

/* ---- register ------------------------------------------------------ */
reg({id:"ded", t:"Chapter VI-A deductions", ref:"Part C", f:secDed,
  s:()=>{const C=S.C.ded||{}; return C.total?RS(C.total)+(C.old?"":" (new)"):"";},
  eng:engDed, exp:expDed, imp:impDed, chk:chkDed, order:60, corder:50});
