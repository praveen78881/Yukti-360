/* =====================================================================
   ENGINE HELPERS — tax on the slabs (Finance Act 2025; see NOTE above)
   ===================================================================== */
function icAge(){                                  /* age at 31-Mar-2026 (shell YREND) */
  return (typeof age==="function")?age():0;
}
function icBrackets(brks,ti){                        /* progressive tax over [lo,hi,rate] triples */
  let t=0,prev=0;
  for(const b of brks){ const lim=b[0], rate=b[1];
    const seg=Math.max(0, Math.min(ti,lim)-prev);
    t+=seg*rate; prev=Math.max(prev,lim); }
  return R(t);
}
/* NEW regime 115BAC(1A), AY 2026-27 — individual & HUF, no age benefit */
function icTaxNew(ti){
  return icBrackets([[400000,0],[800000,0.05],[1200000,0.10],[1600000,0.15],
    [2000000,0.20],[2400000,0.25],[Infinity,0.30]], ti);
}
/* OLD regime — individual (age slab) / HUF (uses <60 basic exemption) */
function icTaxOld(ti){
  const a=icAge(); const status=S.pi.status||"I";
  let basic=250000;
  if(status==="I"){ if(a>=80)basic=500000; else if(a>=60)basic=300000; }
  return icBrackets([[basic,0],[500000,0.05],[1000000,0.20],[Infinity,0.30]], ti);
}

/* =====================================================================
   ENGINE — engInc(): all income heads → S.C.inc / S.C.hp (order 20)
   ===================================================================== */
function engInc(){
  const A={income:0};

  /* ---- Salary (Income_Details B1 salary rows H111–H135) ---- */
  const s1=N(IC.sal.s17_1), s2=N(IC.sal.s17_2), s3=N(IC.sal.s17_3);
  const gross=s1+s2+s3;                                             /* H111 (i)=ia+ib+ic */
  let exempt=0;
  (IC.sal.alw||[]).forEach(r=>{
    const nat=st0(r.nat), amt=N(r.amt);
    if(isNew() && ALW_CLOSED_NEW[nat]) return;                      /* rules #920/#990/#1000 — closed in new */
    exempt+=amt;
  });
  const netSal=Math.max(0, gross-exempt);                          /* H130 (iii) Net Salary = i − ii  [#320] */
  const stdDed = gross>0 ? Math.min(isNew()?75000:50000, netSal) : 0;/* H132 16(ia) std ded — 75000 new regime, 50000 old (rule A143) */
  const ent = isNew()?0:Math.min(5000, N(IC.sal.ent));            /* H133 16(ii) — old regime only, max 5000 */
  const ptax= isNew()?0:Math.min(5000, N(IC.sal.ptax));          /* H134 16(iii) — old regime only, max 5000 */
  const ded16=stdDed+ent+ptax;                                    /* H131 (iv) = iva+ivb+ivc  [#325] */
  const incSal=Math.max(0, netSal-ded16);                         /* H135 (v) = iii − iv  [#330] */

  /* ---- Presumptive business/profession — Schedule BP → E8 (B1) ---- */
  const ad=IC.bp.ad||{};
  const e1a=N(ad.bank), e1b=N(ad.cash), e1c=N(ad.other);
  const e1=e1a+e1b+e1c;                                            /* [I19] E1 = a+b+c */
  const p6=R(0.06*e1a);                                            /* E2a 6% of E1a */
  const p8=R(0.08*(e1b+e1c));                                     /* E2b 8% of (E1b+E1c) */
  const e2a=Math.max(p6, N(ad.claim6));                            /* or amount claimed, whichever higher */
  const e2b=Math.max(p8, N(ad.claim8));
  const e2c=(e1>0)?(e2a+e2b):0;                                    /* [I26] E2c = a+b */

  const ada=IC.bp.ada||{};
  const e3a=N(ada.bank), e3b=N(ada.cash), e3c=N(ada.other);
  const e3=e3a+e3b+e3c;                                            /* [I37] E3 = a+b+c */
  const e4=(e3>0)?Math.max(R(0.50*e3), N(ada.claim)):0;           /* E4 = 50% of E3 or claimed, higher */

  let e5=0;                                                        /* [I65] E5 = Σ per-vehicle presumptive */
  (IC.bp.gcv||[]).forEach(v=>{ e5+=N(v.pi); });
  const e6=(S.pi.status==="F")?N(IC.bp.ae.salint):0;              /* E6 salary/interest to partners — firms only */
  const e7=Math.max(0, e5-e6);                                    /* [I71] E7 = max(0, E5 − E6) */
  const e8=Math.max(0, e2c+e4+e7);                               /* [I72] E8 = E2c + E4 + E7 = IncomeFromBusinessProf */

  /* ---- House property (HP.md; PropertyDetails[]) ---- */
  let hpHead=0; const hpCalc=[];
  (IC.hp||[]).forEach(p=>{
    const self=(p.let==="S");
    const a=self?0:N(p.gross);                                     /* a gross rent (nil if self-occupied) */
    const b=N(p.notReal);                                          /* b rent not realised */
    const c=self?0:N(p.localTax);                                  /* c local taxes — not allowed for self-occ [#305] */
    const d=b+c;                                                   /* d = b + c  [I28] */
    const e=Math.max(a-d,0);                                       /* e annual value = max(a−d,0)  [K29] */
    const share=(p.share===""||p.share==null)?100:N(p.share);
    const f=self?0:Math.max(0,R(share/100*e));                     /* f = share% × e  [K30] */
    const g=R(0.30*f);                                             /* g 30% of f  [I31] */
    let intr=0; (p.loans||[]).forEach(l=>{ intr+=N(l.intr); });    /* Σ Section24B InterestUs24B  [K41] */
    if(self||p.let==="D"){ intr=Math.min(intr,200000); }          /* not let out → cap 2 lakh (H73) */
    if(isNew() && self){ intr=0; }                                 /* new regime: self-occupied 24(b) closes */
    const totDed=g+intr;                                           /* i = g + h  [K42] */
    const j=N(p.arrears);                                          /* j arrears/unrealised less 30% */
    const k=f-totDed+j;                                            /* k = f − i + j  [K44] (may be negative) */
    hpHead+=k;
    hpCalc.push({a,b,c,d,e,f,g,intr,totDed,j,k,share});
  });
  /* [K87] head = max(-200000, Σk); new regime disallows HP loss set-off → floor 0 */
  hpHead = isNew() ? Math.max(0, hpHead) : Math.max(-200000, hpHead);

  /* ---- Other sources (B4) ---- */
  let osGross=0; const osCalc=[]; let famPension=0; let savInt=0; let depInt=0;
  (IC.os.rows||[]).forEach(r=>{
    let amt;
    if(r.nat==="DIV"){ amt=N(r.q1)+N(r.q2)+N(r.q3)+N(r.q4)+N(r.q5); }  /* dividend quarter split H163–H168 */
    else { amt=N(r.amt); }
    if(r.nat==="FAP") famPension+=amt;
    if(r.nat==="SAV") savInt+=amt;                                    /* savings-bank interest → 80TTA cap */
    if(r.nat==="IFD") depInt+=amt;                                    /* deposit interest → 80TTB cap */
    osGross+=amt; osCalc.push({amt});
  });
  /* F170 57(iia) family-pension deduction: old regime only; ≤ lower of 1/3 FP or 15,000 [#475/#480] */
  let ded57=0;
  if(!isNew() && famPension>0){ ded57=Math.min(N(IC.os.fp57), Math.round(famPension/3), 15000); if(ded57<0)ded57=0; }
  const incOS=Math.max(0, osGross-ded57);                          /* IncomeOthSrc */

  /* ---- LTCG u/s 112A not chargeable (D20a) — capped at 1,25,000 [I21] ---- */
  const ltSale=N(IC.ltcg.sale), ltCost=N(IC.ltcg.cost);
  const ltGain=Math.max(0, ltSale-ltCost);
  const long112a=(ltGain>125000)?0:ltGain;                          /* > 1.25L ⇒ report 0 (schema max 125000) */

  /* ---- roll into S.C ---- */
  A.salary=incSal; A.bp=e8; A.os=incOS; A.income=incSal+e8+incOS;
  A.ltcg112a=long112a;
  A.detail={ gross, exempt, netSal, stdDed, ent, ptax, ded16, incSal,
             e1,e1a,e1b,e1c,e2a,e2b,e2c, e3,e3a,e3b,e3c,e4, e5,e6,e7,e8,
             osGross, famPension, ded57, incOS, ltSale,ltCost,ltGain,long112a };
  S.C.inc=A;
  S.C.hp={ income:hpHead, calc:hpCalc };
  /* bases the Chapter VI-A engine (70_sec_ded.js) reads to clamp its caps:
     80CCD(2) → basicDA (the 17(1) salary, the closest proxy this form captures
     for basic+DA); 80TTA → savings-bank interest; 80TTB → deposit interest. */
  S.C.sal={ basicDA:s1 };
  S.C.os={ sav:savInt, dep:depInt };
}

/* =====================================================================
   ENGINE — engTax(): Part D roll-up → footer contract (order 80)
   ===================================================================== */
function engTax(){
  const inc=S.C.inc||{}, hp=S.C.hp||{};
  const salary=N(inc.salary), bp=N(inc.bp), os=N(inc.os), hpinc=N(hp.income);
  const ltcg=N(inc.ltcg112a);

  const gti = salary+bp+os+hpinc;                                  /* B5 GrossTotIncome (without LTCG112A) */
  const gtiInc = gti+ltcg;                                         /* GrossTotIncomeIncLTCG112A */
  let via = (S.C.ded||{}).total||0;                                /* Chapter VI-A, regime-gated by `ded` */
  via = Math.max(0, Math.min(via, Math.max(0,gtiInc)));            /* VI-A cannot exceed GTI [#95] */
  const ti = Math.max(0, gtiInc-via);                             /* C20 TotalIncome = B5 − C19  [#230] */

  /* slab base excludes the non-chargeable LTCG112A part */
  const base=Math.max(0, ti-ltcg);
  const status=S.pi.status||"I", resident=(S.pi.res||"RES")==="RES";
  let d1;                                                          /* D1 tax on total income */
  if(status==="F"){ d1=R(0.30*base); }                            /* firm — flat 30% */
  else { d1 = isNew()?icTaxNew(base):icTaxOld(base); }

  /* D2 rebate 87A — resident individual only (rules #1135 new / #1145 old) */
  let d2=0;
  if(status==="I" && resident){
    if(isNew()){
      if(base<=1200000) d2=Math.min(d1,60000);
      else { const marg=d1-(base-1200000); if(marg>0) d2=Math.min(d1,marg); }  /* marginal rebate */
    } else {
      if(base<=500000) d2=Math.min(d1,12500);
    }
  }
  const d3=Math.max(0, d1-d2);                                     /* D3 tax after rebate = D1 − D2  [#260] */
  const d4=R(0.04*d3);                                            /* D4 cess @ 4% on D3 */
  const d5=d3+d4;                                                 /* D5 total tax & cess = D3 + D4  [#265] */
  const d6=N(IC.d.relief89);                                      /* D6 relief u/s 89 (input) */
  const d7=Math.max(0, d5-d6);                                    /* D7 balance tax after relief = D5 − D6  [#280] */
  const i234a=N(IC.d.int234a), i234b=N(IC.d.int234b), i234c=N(IC.d.int234c);
  const fee234f=Math.min(5000, N(IC.d.fee234f)), fee234i=Math.min(5000, N(IC.d.fee234i));
  const d12=d7+i234a+i234b+i234c+fee234f+fee234i;                 /* D12 total tax, fee & interest  [#270] */

  const paid=(S.C.paid||{}).total||0;                             /* taxes paid (by `paidbank`) */
  const balance=R(Math.max(0, d12-paid)/10)*10;                  /* D18 amount payable, round to ₹10  [I9] */
  const refund =R(Math.max(0, paid-d12)/10)*10;                  /* D19 refund, round to ₹10  [I10] */

  /* footer contract the shell's band()/#s_gti/#s_ti/#s_tax/#s_b read */
  S.C.gti=gtiInc;
  S.C.ti=ti;
  S.C.tax={ gross:d5, regime:isNew()?"New":"Old", rebate:d2, liability:d12 };
  S.C.int={ net:d7, balance:balance, refund:refund };
  S.C.taxc={ d1,d2,d3,d4,d5,d6,d7,i234a,i234b,i234c,fee234f,fee234i,d12,
             gti,gtiInc,via,ti,base,paid };
}
