/* ==================================================================
   5 · CHECKS
   ================================================================== */
function engChecks(){
  const o=[],add=(l,t,m,s)=>o.push({lvl:l,t,m,sec:s});
  const T=S.C.tax,I=S.C.int,V=S.C.via,CG=S.C.cg;
  if(!st0(S.pi.first)&&S.pi.status==="I")add("err","First name","Not entered yet.","who");
  if(!st0(S.pi.last))add("err",S.pi.status==="I"?"Last name":"Name","Not entered yet.","who");
  if(!PAN_RE.test(st0(S.pi.pan).toUpperCase()))
    add("err","PAN","Ten characters — five letters, four digits, one letter.","who");
  else{const c4=st0(S.pi.pan).toUpperCase()[3];
    if(S.pi.status==="I"&&c4!=="P")add("err","PAN","For an individual the fourth character is P.","who");
    if(S.pi.status==="H"&&c4!=="H")add("err","PAN","For a Hindu undivided family the fourth character is H.","who");}
  if(S.pi.status==="I"&&!D(S.pi.dob))add("err","Date of birth","Enter it as "+DF+".","who");
  if(!STATE[st0(S.pi.state)])add("err","State","Pick it from the list.","who");
  if(!/^[1-9]\d{5}$/.test(st0(S.pi.pin))&&S.pi.res!=="NRI")add("err","PIN code","Six digits.","who");
  if(!/^[1-9]\d{9}$/.test(st0(S.pi.mobile)))add("err","Mobile number","Ten digits.","who");
  if(!MAIL.test(st0(S.pi.email)))add("err","Email","Not a valid address.","who");
  /* Part A General — the book's rules */
  if(S.pi.status!=="H"){
    const rc=RESCOND.find(c=>c[0]===S.pi.rescond);
    if(!rc)add("err","Residential-status condition","Pick the condition that makes the person "+
      (RESIDENTIAL.find(r=>r[0]===S.pi.res)||["",""])[1].toLowerCase()+".","who");
    else if(rc[2]!==S.pi.res)add("err","Residential-status condition",
      "Condition "+rc[0]+" does not agree with the status chosen. Change one of them.","who");
  }
  if(S.pi.res!=="RES"){
    if(!(S.pi.juris||[]).some(j=>st0(j.tin)))add("err","Jurisdiction of residence",
      "A non-resident has to list every jurisdiction of residence with its taxpayer identification number.","who");
    if(S.pi.status!=="H"&&!st0(S.pi.days1))add("err","Days in India","The period of stay in India this year is required.","who");
  }
  if(S.pi.fpi==="Yes"&&!st0(S.pi.sebi))add("err","SEBI registration","Required for a foreign portfolio investor.","who");
  if(S.pi.rep==="Yes"){
    if(!st0(S.pi.rep_name)||!MAIL.test(st0(S.pi.rep_email))||!/^[1-9]\d{9}$/.test(st0(S.pi.rep_mobile)))
      add("err","Representative assessee","Name, a valid email and a ten-digit mobile are required.","who");
    if(!PAN_RE.test(st0(S.pi.rep_pan).toUpperCase()))add("err","Representative's PAN","Required.","who");
  }
  if(S.pi.dir==="Yes")(S.pi.dirco||[]).forEach((c,n)=>{
    if(!st0(c.name))add("err","Directorship "+(n+1),"The name of the company is required.","who");
    if(c.type==="D"&&!PAN_RE.test(st0(c.pan).toUpperCase()))add("err","Directorship "+(n+1),"PAN is required for a domestic company.","who");});
  if(S.pi.unl==="Yes")(S.pi.unlco||[]).forEach((c,n)=>{
    if(!st0(c.name))add("err","Unlisted holding "+(n+1),"The name of the company is required.","who");
    const exp=N(c.open)+N(c.acq)-N(c.sold);
    if(st0(c.close)!==""&&Math.abs(exp-N(c.close))>0)add("err","Unlisted holding "+(n+1),
      "Closing shares should be opening + acquired − transferred = "+exp+".","who");});
  if(st0(S.pi.lei)&&!D(S.pi.lei_dt))add("err","LEI validity","The valid-upto date is required with an LEI.","who");
  if([13,14,16,18,20].indexOf(+S.fs.sec)>=0&&(!st0(S.fs.notice)||!D(S.fs.noticedate)))
    add("err","Notice particulars","The document identification number and its date are required.","ret");
  if([17,18,19].indexOf(+S.fs.sec)>=0&&(!/^\d{15}$/.test(st0(S.fs.receipt))||!D(S.fs.origdate)))
    add("err","Original return","A revised, defective or modified return needs the fifteen-digit receipt and the date of the original.","ret");
  if(!D(S.fs.filed))add("warn","Date of filing",
    "Until this is entered, interest under 234A and the fee under 234F cannot be worked out.","ret");
  if(isNew()){
    const lost=VIA.filter(d=>VIA_NEW.indexOf(d[0])<0&&N(S.via[d[0]])).map(d=>d[1]);
    if(lost.length)add("warn","Deductions the new regime closes",
      "Amounts sit against "+lost.slice(0,8).join(", ")+(lost.length>8?" and others":"")+
      ". Section 115BAC leaves only 80CCD(2) and 80CCH(2). The comparison in "+
      "Return and regime uses them.","ded");
    const al=S.alw.filter(a=>!a._ok&&N(a.amt));
    if(al.length)add("warn","Allowances the new regime does not exempt",
      al.map(a=>a.sec).join(", ")+" cannot be claimed under section 115BAC.","sal");
  }
  /* capital gains — the book's rules */
  if(CG.on){
    (S.cg.land||[]).forEach((p,n)=>{const r=p._||engLand(p);const lbl="Property "+(n+1);
      if(!N(p.cons)&&!N(p.cost))return;
      if(!D(p.buy))add("err",lbl,"The date of purchase is required, as "+DF+".","cg");
      if(!D(p.sale))add("err",lbl,"The date of sale is required, as "+DF+".","cg");
      if(D(p.sale)&&(D(p.sale)>YREND||D(p.sale)<new Date(2025,3,1)))
        add("err",lbl,"The sale must fall in the year ended 31 March 2026.","cg");
      if(D(p.buy)&&D(p.sale)&&D(p.buy)>D(p.sale))add("err",lbl,"It cannot have been sold before it was bought.","cg");
      if(r.isLT&&p.s45_5a==="Yes"&&!D(p.ccDate))add("err",lbl,"Section 45(5A) needs the date of the completion certificate.","cg");
      const d=p.ded||{};
      if(N(d.s54EC)>5000000)add("err",lbl,"A deduction under section 54EC is capped at ₹50,00,000.","cg");
      if(r.dedTot>Math.max(0,r.c))add("err",lbl,"The exemptions claimed exceed the gain on this property.","cg");
      if(!(p.buyers||[]).some(b=>st0(b.name)))add("warn",lbl,"No buyer is listed. PAN or Aadhaar of the buyer is mandatory where TDS was deducted under 194-IA.","cg");
      if(!st0(p.paddr)||!STATE[st0(p.pstate)])add("err",lbl,"The address and state of the property are required.","cg");
      if(r.safe)add("ok",lbl,"The stamp value is within 1.10 times the price, so section 50C leaves it alone.","cg");
      if(r.isLT&&r.canIndex&&r.excess>0)add("ok",lbl,"Second proviso to 112(1)(a): "+RS(r.excess)+
        " of tax is ignored because the 20% indexed rate is lower.","cg");});
    (S.cg.s112a||[]).forEach((r,n)=>{
      if(r.pre18!=="BE"&&N(r.fmv18))add("err","Scrip "+(n+1),"A 31 January 2018 value cannot be given for a share bought after that date.","cg");
      if(r.pre18==="BE"&&!N(r.fmv18))add("err","Scrip "+(n+1),"The share was held on 31 January 2018, so its value that day is required.","cg");});
    if(CG.exempt112a>0)add("ok","Relief under section 112A","The tax on the first "+RS(CG.exempt112a)+" of long-term gain on listed equity is nil.","cg");
    /* Part D — every section claimed must have its particulars */
    Object.keys(CG.dedD).forEach(sec=>{CG.dedD[sec].forEach((r,k)=>{
      const d=((S.cg.dedD||{})[sec]||[])[k]||{};
      if(!D(d.transfer)||!N(d.cost)||!D(d.purchase))add("err","Part D — section "+sec+", item "+(k+1),
        "The date of transfer, the cost or amount invested, and the date of purchase or investment are required.","cg");
      if(N(d.dep)&&(!D(d.depdt)||!st0(d.acno)||!IFSC_RE.test(st0(d.ifsc).toUpperCase())))
        add("err","Part D — section "+sec+", item "+(k+1),"A deposit in the Capital Gains Account Scheme needs its date, account number and IFSC.","cg");});});
    const unset=Object.keys(CG.loss).filter(k=>CG.loss[k]>CG.used[k]&&
      Object.keys(CG.gain).some(g=>g!==k&&CG.gain[g]>CG.absorbed[g]&&!(k.startsWith("lt")&&!g.startsWith("lt"))));
    if(unset.length)add("warn","Capital loss not fully set off","A loss has been left standing while a gain it could have covered is still taxed.","cg");
  }
  /* ---- the department's validation rules that a return must pass before upload ---- */
  {const filedD=D(S.fs.filed);
    if(!isNew()&&filedD&&filedD>(D(S.fs.dueExt)||DUE))add("err","Regime","The old regime cannot be opted after the due date under section 139(1). Filing after "+DISP(D(S.fs.dueExt)||DUE)+" means the new regime — rule A21.","ret");
    if(!isNew()&&filedD&&filedD<=(D(S.fs.dueExt)||DUE)&&new Date()>(D(S.fs.dueExt)||DUE))
      add("warn","Regime — actual upload date","Your filing date "+DISP(filedD)+" is on time, but that due date has already passed. The portal dates the return to when it is actually uploaded, so an old-regime return uploaded now will be rejected on the date (rule A21). Either the return must genuinely be filed on time, or switch to the new regime.","ret");
    if(S.pi.s5a==="Yes"){const A5=S.C.s5a;if(!(A5.tot.inc||A5.tot.spouse))add("err","Schedule 5A","Governed by the Portuguese Civil Code is Yes, so Schedule 5A must carry the apportionment — rule A6.","other");}
    if(S.pi.s5a!=="Yes"&&S.sch5a2&&st0(S.sch5a2.name))add("warn","Schedule 5A","Filled, but the Portuguese Civil Code answer is No — the schedule will not be written (rule A14).","other");
    (S.sal.emp||[]).forEach((e,i)=>{if(N(e.s17_1)&&!(e.n17_1||[]).length)add("err","Employer "+(i+1)+" — 17(1)","The nature-wise breakup of salary is required; its sum is 1a (rule A32).","sal");
      if(N(e.s17_2)&&!(e.n17_2||[]).length)add("err","Employer "+(i+1)+" — 17(2)","The nature-wise breakup of perquisites is required (rule A33).","sal");
      if(N(e.s17_3)&&!(e.n17_3||[]).length)add("err","Employer "+(i+1)+" — 17(3)","The nature-wise breakup of profit in lieu of salary is required (rule A34).","sal");
      ["n17_1","n17_2","n17_3"].forEach(k=>(e[k]||[]).forEach((r,n)=>{if(N(r.amt)&&r.code==="OTH"&&!st0(r.desc))add("err","Employer "+(i+1)+" — "+k.replace("n","").replace("_","(")+")","Row "+(n+1)+" is 'Others' — specify the nature.","sal");}));});
    if(N(S.sal.s16ii)&&!S.C.sal.anyGovt)add("err","Entertainment allowance 16(ii)","Allowed only to a Central or State Government employee (rule A35). Remove it.","sal");
    if(!isNew()){const sal10=Math.round(S.C.sal.basicDA*0.10),sal14=Math.round(S.C.sal.basicDA*0.14);
      if(N(S.via.c80ccd2)>(S.C.sal.anyGovt?sal14:sal10))add("err","80CCD(2)","Cannot exceed "+(S.C.sal.anyGovt?"14%":"10%")+" of salary (basic + DA) = "+RS(S.C.sal.anyGovt?sal14:sal10)+" (rule A345).","ded");
      const c1=(S.pen80ccd1||[]).length?(S.pen80ccd1||[]).reduce((a,r)=>a+N(r.amt),0):N(S.via.c80ccd1);
      if(c1>Math.max(sal10,S.C.sal.basicDA?0:Math.round(S.C.gti*0.20)))add("err","80CCD(1)","Limited to 10% of salary (basic + DA) = "+RS(sal10)+", or 20% of gross total income where there is no salary (rule A348).","ded");
      if((c1||N(S.via.c80ccd1b)||(S.pen80ccd1b||[]).length)&&!/^\d{12}$/.test(st0(S.via.pran)))add("err","PRAN","Required to claim 80CCD(1) or 80CCD(1B) (rule A645).","ded");
      const ee=(S.e80.ee||[]).reduce((a,r)=>a+N(r.interest),0),eea=(S.e80.eea||[]).reduce((a,r)=>a+N(r.interest),0);
      if(ee&&eea)add("err","80EE and 80EEA","80EEA cannot be claimed when 80EE is claimed (rule A620–622). Keep one.","ded");
      (S.e80.ee||[]).forEach((r,n)=>{if(!N(r.interest))return;const dt=D(r.dt);
        if(N(r.amt)>3500000)add("err","80EE loan "+(n+1),"80EE is for a loan of ₹35 lakh or less on a house of ₹50 lakh or less.","ded");
        if(dt&&(dt<new Date(2016,3,1)||dt>new Date(2017,2,31)))add("err","80EE loan "+(n+1),"80EE is for a loan sanctioned between 1 April 2016 and 31 March 2017.","ded");});
      (S.e80.eea||[]).forEach((r,n)=>{if(!N(r.interest))return;const dt=D(r.dt);
        if(N(S.e80.eeaSdv)>4500000)add("err","80EEA","The stamp-duty value of the house must not exceed ₹45 lakh.","ded");
        if(dt&&(dt<new Date(2019,3,1)||dt>new Date(2022,2,31)))add("err","80EEA loan "+(n+1),"80EEA is for a loan sanctioned between 1 April 2019 and 31 March 2022.","ded");});
      const hpLoans=[];(S.hp.props||[]).forEach(p=>(p.loans||[]).forEach(l=>hpLoans.push(st0(l.name).toLowerCase()+"|"+st0(l.acno).toLowerCase())));
      [["ee","80EE"],["eea","80EEA"]].forEach(([k,l])=>(S.e80[k]||[]).forEach((r,n)=>{if(N(r.interest)&&hpLoans.indexOf(st0(r.name).toLowerCase()+"|"+st0(r.acno).toLowerCase())<0)
        add("err",l+" loan "+(n+1),"The loan must also appear in a section 24(b) table of Schedule HP with the same lender and account number (rule A621/A622).","ded");}));
      if(S.C.d80.aPHC+S.C.d80.bPHC+S.C.d80.cPHC+S.C.d80.dPHC>5000)add("warn","80D check-up","Preventive health check-up is limited to ₹5,000 in all; the excess is ignored (rule A293).","ded");}
    (S.tds2||[]).concat(S.tds3||[]).forEach((r,n)=>{if(N(r.bf)&&(N(r.dedOwn)||N(r.dedOthTds)))add("err","TDS row "+(n+1),"Unclaimed TDS brought forward and the current year's TDS go in separate rows (rule A462).","paid");
      if(r._over)add("err","TDS row "+(n+1),"Claimed "+RS(r._claimed)+" exceeds brought forward plus deducted "+RS(r._avail)+".","paid");});
    (S.tcs||[]).forEach((r,n)=>{if(N(r.bf)&&(N(r.collOwn)||N(r.collOth)))add("err","TCS row "+(n+1),"Unclaimed TCS brought forward and the current year's TCS go in separate rows.","paid");});
    (S.g80||[]).forEach((r,n)=>{if(N(r.other)&&(!st0(r.ref)||!IFSC_RE.test(st0(r.ifsc).toUpperCase())))add("err","80G donee "+(n+1),"A donation by other than cash needs the transaction reference and the bank's IFSC.","ded");});
    (S.ei2&&S.ei2.others||[]).forEach((r,n)=>{if(st0(r.desc)&&["Incmexmptcircular","Incmexmptnotification","Receiptnotincme"].indexOf(r.sub)<0)add("warn","Exempt income row "+(n+1),"A description is taken only for 'exempt per CBDT circular / notification' or 'receipts not in the nature of income'; it will not be written.","ei");});
    if(S.os2&&S.os2.on&&S.os2.editQ){const O=S.C.os;const got=(O.Q.div1ai||[]).reduce((a,v)=>a+v,0);
      if(got>O.divHi+1||got<O.divLo-1)add("err","OS item 10 — dividend","The quarterly dividend ("+RS(got)+") must be between "+RS(O.divLo)+" (1a(i) − DTAA − full 57(i) interest) and "+RS(O.divHi)+" (1a(i) − DTAA). Set the quarters to the figure the portal expects (rule A214).","os");}
  }
  /* house property — the book's rules */
  if(S.hp&&S.hp.on){const P=S.C.hp;
    (S.hp.props||[]).forEach((p,n)=>{const r=p._||engProp(p);const lbl="Property "+(n+1);
      if(!st0(p.addr)||!st0(p.city))add("err",lbl,"The address and town or city are required.","hp");
      if((p.country||"91")==="91"&&!STATE[st0(p.state)])add("err",lbl,"Pick the state.","hp");
      if((p.country||"91")==="91"&&!/^[1-9]\d{5}$/.test(st0(p.pin)))add("err",lbl,"A six-digit PIN code is required.","hp");
      if(!p.owner)add("err",lbl,"Say who owns the property.","hp");
      if(p.owner==="OT"&&!st0(p.ownerOther))add("err",lbl,"Owner is Others — specify.","hp");
      if(p.co==="YES"){if(!(N(p.share)>0))add("err",lbl,"Your percentage share is required on a co-owned property.","hp");
        if(!(p.coowners||[]).some(x=>st0(x.name)))add("err",lbl,"List the other co-owners.","hp");
        if(Math.abs((N(p.share)||0)+r.coShare-100)>0.01)add("warn",lbl,"The shares add to "+((N(p.share)||0)+r.coShare)+"%, not 100%.","hp");}
      if(p.type!=="S"&&!N(p.rent))add("err",lbl,"Gross rent or lettable value is required on a let-out or deemed let-out property.","hp");
      (p.loans||[]).forEach((l,m)=>{if(!N(l.interest)&&!N(l.amt))return;
        if(!l.from||!st0(l.name)||!st0(l.acno)||!D(l.dt)||!N(l.amt)||st0(l.os)===""||!N(l.interest))
          add("err",lbl+", loan "+(m+1),"Every column of a section 24(b) loan row is required — lender, name, account, sanction date "+DF+", loan, outstanding, interest.","hp");
        if(N(l.os)>N(l.amt))add("warn",lbl+", loan "+(m+1),"The outstanding exceeds the loan taken.","hp");});
      (p.coowners||[]).forEach((x,m)=>{if(st0(x.pan)&&!PAN_RE.test(st0(x.pan).toUpperCase()))add("err",lbl+", co-owner "+(m+1),"The PAN is not in the right form.","hp");});
      (p.tenants||[]).forEach((x,m)=>{if(st0(x.pan)&&!PAN_RE.test(st0(x.pan).toUpperCase()))add("err",lbl+", tenant "+(m+1),"The PAN is not in the right form.","hp");});
      if(r.cut&&!isNew())add("warn",lbl,RS(r.cut)+" of interest is above the ₹2,00,000 the sheet allows on a self-occupied house.","hp");
      if(r.barred)add("warn",lbl,"Interest of "+RS(r.cut)+" on a self-occupied house gives nothing under the new regime.","hp");});
    if(P.selfCount>2)add("err","Self-occupied properties","Section 23(4) allows two. The rest are deemed let out — change their type.","hp");
    if(P.income<0)add("ok","Loss under house property",RS(-P.income)+(isNew()?" — not set against other heads under the new regime.":" goes to 2(i) of Schedule CYLA; up to ₹2,00,000 is set against other heads this year, the rest carries forward."),"hp");
  }
  /* other sources — the book's rules */
  if(S.os2&&S.os2.on){const O=S.C.os,X=S.os2;
    if(N((X.ded||{}).intClaimed)>O.ded.intElig&&(O.a.ord+O.a.e22)>0)
      add("warn","Interest expenditure under 57(i)","Claimed "+RS(N(X.ded.intClaimed))+"; only "+RS(O.ded.intElig)+
        " is eligible — twenty per cent of the dividend at 1a(i) and 1a(ii).","os");
    if(N((X.ded||{}).intClaimed)&&!(O.a.ord+O.a.e22))
      add("err","Interest expenditure under 57(i)","Available only if dividend is offered at 1a(i) or 1a(ii).","os");
    if(N((X.ded||{}).dep)&&!O.c)add("err","Depreciation under 57","Available only if rent from machinery, plant or buildings is offered at 1c.","os");
    if(O.six<0)add("ok","Loss under other sources",RS(-O.six)+" goes to 3(i) of Schedule CYLA to be set against other heads.","os");
    if(O.horse.on&&O.horse.bal<0)add("ok","Race-horse loss",RS(-O.horse.bal)+" goes to 6(xi) of Schedule CFL — it can be set only against race-horse income, for four years.","os");
    if(O.sp.bbeTot)add("warn","Section 115BBE","Unexplained income of "+RS(O.sp.bbeTot)+" is taxed at sixty per cent plus a twenty-five per cent surcharge, with no deduction or set-off.","os");
    (X.dtaa||[]).forEach((r,n)=>{if(!N(r.amt))return;
      if(!st0(r.nature)||!st0(r.itemno)||!st0(r.country)||!st0(r.code)||!st0(r.article)||st0(r.treaty)===""||st0(r.itrate)==="")
        add("err","DTAA claim "+(n+1),"Every column is required — the item of this schedule, the section of the Act, country, article, both rates.","os");});
    (X.pf111||[]).forEach((r,n)=>{if((N(r.incben)||N(r.taxben))&&!st0(r.ay))add("err","Accumulated PF "+(n+1),"The assessment year is required.","os");});
    (X.eOther||[]).forEach((r,n)=>{if(N(r.amt)&&!st0(r.nature))add("err","Other income "+(n+1),"Specify the nature.","os");});
    /* the 2(22)(f) dividend unlocks the buy-back loss in Schedule CG */
    const bbLoss=(S.cg&&((S.cg.aA||[]).some(x=>N(x.amt))||(S.cg.bA||[]).some(x=>N(x.amt))));
    if(bbLoss&&!O.a.f22)add("err","Buy-back loss in Schedule CG","A capital loss on buy-back can be claimed only if the dividend under 2(22)(f) is offered at 1a(iii) of Schedule OS.","cg");
    if(X.editQ)OS_Q.forEach(([k,l])=>{const tot=O.Q[k].reduce((a,v)=>a+v,0),src=O.auto[k]||0;
      if(src&&Math.abs(tot-src)>1)add("err","Quarterly split — "+l.split(" —")[0],"The five quarters add to "+RS(tot)+" but the figure is "+RS(src)+".","os");});
  }
  if(V.clipped)add("warn","Deductions cut back",
    "The claim of "+RS(V.total)+" is more than gross total income, so it stands at "+RS(V.allowed)+".","ded");
  Object.keys(V.why).forEach(k=>{if(!V.why[k])return;const d=VIA.find(x=>x[0]===k);
    add("warn","Section "+d[2].split(" —")[0],"The amount entered has been "+V.why[k]+".","ded");});
  if(S.C.amt.applies)add("warn","Alternate minimum tax applies",
    "Adjusted total income tax of "+RS(S.C.amt.amt)+" exceeds normal tax. A credit of "+
    RS(S.C.amt.credit)+" arises under section 115JD.","tax");
  if(T.marginal>0)add("ok","Marginal relief under section 87A",
    "Total income is just over ₹12,00,000, so the tax is held to the excess. Relief "+RS(T.marginal)+".","tax");
  else if(T.rebate>0)add("ok","Rebate under section 87A",RS(T.rebate)+" of tax falls away.","tax");
  if(T.scr>0&&T.scrCap<T.scr)add("ok","Surcharge on capital gains capped",
    "The surcharge on the capital-gains and dividend portion is held to 15 per cent, "+
    "though the rest bears "+T.scr+" per cent.","tax");
  if(I.late)add("warn","Return filed late","Due "+DISP(DUE)+", filed "+DISP(I.filed)+
    ". Interest under 234A of "+RS(I.i234a)+" and a fee of "+RS(I.f234f)+" follow.","tax");
  if(I.i234b>0)add("warn","Advance tax short",
    "Advance tax is below ninety per cent of the assessed tax, so 234B of "+RS(I.i234b)+" runs.","tax");
  if(I.i234c>0)add("warn","Instalments missed",
    "Interest under 234C of "+RS(I.i234c)+" arises on the quarterly shortfall.","tax");
  if(S.C.loss.cf.total>0)add("ok","Carried forward to next year",RS(S.C.loss.cf.total)+" of losses.","loss");
  CFL_YEARS.forEach(([y])=>{const r=(S.loss.cfl||{})[y]||{};if((N(r.hp)||N(r.st)||N(r.lt)||N(r.horse))&&!D(r.dt))
    add("err","Schedule CFL — "+y,"The date of filing of that year's return is required, as "+DF+". A loss carries only if the return was filed in time.","loss");});
  (S.C.loss.val||[]).forEach(m=>add("err","Schedule BFLA",m,"loss"));
  /* foreign */
  S.tds1.forEach((r,n)=>{if(N(r.tds)&&!TAN_RE.test(st0(r.tan).toUpperCase()))
    add("err","Employer "+(n+1),"The TAN is four letters, five digits and a letter.","paid");});
  S.tds2.forEach((r,n)=>{if(!N(r.claim))return;
    if(!TAN_RE.test(st0(r.tan).toUpperCase()))
      add("err","TDS row "+(n+1),"The TAN is four letters, five digits and a letter.","paid");
    if(N(r.claim)>N(r.tds)&&N(r.tds))
      add("err","TDS row "+(n+1),"The credit claimed is more than the tax deducted.","paid");});
  S.it.forEach((c,n)=>{if(!N(c.amt))return;
    if(!BSR.test(st0(c.bsr).toUpperCase()))
      add("err","Challan "+(n+1),"The BSR code is seven characters.","paid");
    if(!D(c.dt))add("err","Challan "+(n+1),"The date of deposit is required, as "+DF+".","paid");});
  if(!S.bank.length)add("err","Bank account","At least one is needed for the refund.","bank");
  else if(!S.bank.some(b=>b.refund==="Y"))add("err","Refund account","Tick one to receive the refund.","bank");
  S.bank.forEach((b,n)=>{
    if(b.ifsc&&!IFSC_RE.test(st0(b.ifsc).toUpperCase()))
      add("err","Bank row "+(n+1),"The IFSC is four letters, a zero, then six characters.","bank");
    if(!st0(b.bank))add("err","Bank row "+(n+1),"The name of the bank is required.","bank");
    if(!st0(b.acno))add("err","Bank row "+(n+1),"The account number is required.","bank");});
  if(!st0(S.ver.name))add("err","Verification","The name of the person verifying is required.","bank");
  if(!VPAN.test(st0(S.ver.pan).toUpperCase()))
    add("err","Verifier's PAN","An individual or HUF PAN.","bank");
  if(!st0(S.ver.father))add("err","Father's name","The schema makes this compulsory.","bank");
  if(!st0(S.ver.place))add("err","Place","Required in the verification.","bank");
  if(S.ver.swid&&!/^SW[0-9]{8}$/.test(st0(S.ver.swid).toUpperCase()))
    add("err","Software registration","SW followed by exactly eight digits.","bank");
  if(!o.length)add("ok","Nothing outstanding","Every check passes. The return is ready to export.","bank");
  return o;
}
/* ==================================================================
   The department's validation rules (ITR-2, AY 2026-27, v1.0), run on the
   return JSON before it leaves. Category A stops the export; D warns.
   Each rule carries its serial in the official document.
   ================================================================== */
const RG=(o,p,d)=>{try{const v=p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);return v==null?(d===undefined?0:d):v;}catch(e){return d===undefined?0:d;}};
const RSUM=(arr,f)=>(arr||[]).reduce((a,r)=>a+(typeof f==="function"?N(f(r)):N(r[f])),0);
const REQ=(a,b,tol)=>Math.abs(N(a)-N(b))<=(tol||1);
const RDR=o=>o&&o.DateRange?Object.values(o.DateRange).reduce((a,v)=>a+N(v),0):0;
function runRules(I,S_){
  const out=[];const A=(n,cond,msg)=>{if(!cond)out.push({cat:"A",n,msg});};const Dd=(n,cond,msg)=>{if(!cond)out.push({cat:"D",n,msg});};
  const PI=I.PartA_GEN1.PersonalInfo,FS=I.PartA_GEN1.FilingStatus,newR=FS.OptOutNewTaxRegime!=="Y",res=FS.ResidentialStatus,huf=PI.Status==="H",ind=PI.Status==="I";
  const ti=I["PartB-TI"],tti=I.PartB_TTI,CTL=tti.ComputationOfTaxLiability,late=!!(S_.C.int&&S_.C.int.late);
  /* ---------- Part A General ---------- */
  A(1,/^[1-9]\d{9}$/.test(String(RG(PI,"Address.MobileNo",""))),"Enter a valid ten-digit mobile number.");
  A(5,FS.HeldUnlistedEqShrPrYrFlg!=="Y"||RG(FS,"HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls",[]).length,"Unlisted shares held is Yes — the details must be filled.");
  A(6,FS.PortugeseCC5A!=="Y"||!!I.Schedule5A2014,"Portuguese Civil Code is Yes — Schedule 5A is mandatory.");
  A(14,FS.PortugeseCC5A==="Y"||!I.Schedule5A2014,"Portuguese Civil Code is No — Schedule 5A must not be filed.");
  A(7,FS.AsseseeRepFlg!=="Y"||(RG(FS,"AssesseeRep.RepName","")&&RG(FS,"AssesseeRep.RepMobileNo",0)),"Representative assessee is Yes — the representative's details are required.");
  A(9,FS.SeventhProvisio139!=="Y"||["DepAmtAggAmtExcd1CrPrYrFlg","IncrExpAggAmt2LkTrvFrgnCntryFlg","IncrExpAggAmt1LkElctrctyPrYrFlg","clauseiv7provisio139i"].some(k=>FS[k]==="Y"),"Seventh proviso is Yes — pick at least one condition.");
  A(10,FS.CompDirectorPrvYrFlg!=="Y"||RG(FS,"CompDirectorPrvYr.CompDirectorPrvYrDtls",[]).length,"Director is Yes — the company details must be filled.");
  A(13,FS.clauseiv7provisio139i!=="Y"||(FS.clauseiv7provisio139iDtls||[]).every(x=>N(x.clauseiv7provisio139iAmount)>0),"Clause (iv) of the seventh proviso — the amount for each condition is required.");
  A(15,!I.Schedule115AD||FS.FiiFpiFlag==="Y","Schedule 115AD(1)(b)(iii) proviso needs 'Are you an FPI?' = Yes.");
  A(16,[13,14,16,18,20].indexOf(+FS.ReturnFileSec)<0||(FS.NoticeNo&&FS.NoticeDate),"Filed in response to a notice — the DIN and date of the notice are mandatory.");
  A(20,FS.FiiFpiFlag!=="Y"||res==="NRI","A resident or RNOR cannot be an FII/FPI.");
  A(21,newR||!late,"The old regime cannot be opted after the due date under section 139(1).");
  A(652,PI.DOB<"2026-04-01","The date of birth must be before 1 April 2026.");
  A(747,FS.AsseseeRepFlg!=="Y"||(RG(FS,"AssesseeRep.RepEmailID","")!==RG(PI,"Address.EmailAddress","")&&String(RG(FS,"AssesseeRep.RepMobileNo",""))!==String(RG(PI,"Address.MobileNo",""))),"The representative's email and mobile must differ from the assessee's.");
  /* ---------- Schedule S ---------- */
  if(I.ScheduleS){const sc=I.ScheduleS,emps=sc.Salaries||[];
    emps.forEach((e,i)=>{const sy=e.Salarys||{};const L="Employer "+(i+1)+": ";
      A(22,REQ(sy.GrossSalary,N(sy.Salary)+N(sy.ValueOfPerquisites)+N(sy.ProfitsinLieuOfSalary)+N(sy.IncomeNotified89A)+N(sy.IncomeNotifiedOther89A)+N(sy.IncomeNotifiedPrYr89A)),L+"gross salary must equal 1a + 1b + 1c + 1d + 1e + 1f.");
      const brk=k=>RSUM(RG(sy,k+".OthersIncDtls",[]),"OthAmount");
      A(32,!N(sy.Salary)||REQ(brk("NatureOfSalary"),sy.Salary),L+"the 17(1) breakup must add to 1a.");
      A(33,!N(sy.ValueOfPerquisites)||REQ(brk("NatureOfPerquisites"),sy.ValueOfPerquisites),L+"the 17(2) breakup must add to 1b.");
      A(34,!N(sy.ProfitsinLieuOfSalary)||REQ(brk("NatureOfProfitInLieuOfSalary"),sy.ProfitsinLieuOfSalary),L+"the 17(3) breakup must add to 1c.");
      A(61,REQ(sy.IncomeNotified89A,RSUM(sy.IncomeNotified89AType||[],"NOT89AAmount")),L+"1d must equal the sum of the 89A country rows.");
      const cc=(sy.IncomeNotified89AType||[]).map(x=>x.NOT89ACountrycode);A(65,new Set(cc).size===cc.length,L+"a 89A country cannot be chosen twice.");
      [["NatureOfPerquisites",63],["NatureOfProfitInLieuOfSalary",64]].forEach(([k,n])=>{const cds=RG(sy,k+".OthersIncDtls",[]).map(x=>x.NatureDesc).filter(c=>c!=="OTH");A(n,new Set(cds).size===cds.length,L+"a nature under "+(n===63?"17(2)":"17(3)")+" is entered more than once.");});});
    const s1=RSUM(emps,e=>RG(e,"Salarys.GrossSalary"));A(23,REQ(sc.TotalGrossSalary,s1),"Total gross salary must be the sum over employers.");
    A(24,REQ(sc.AllwncExtentExemptUs10,RSUM(RG(sc,"AllwncExemptUs10.AllwncExemptUs10Dtls",[]),"SalOthAmount")),"Sl. 3 exempt allowances must equal the sum of the dropdown rows.");
    A(25,REQ(sc.NetSalary,N(sc.TotalGrossSalary)-N(sc.AllwncExtentExemptUs10)-N(sc.Increliefus89A)),"Net salary must be 2 − 3 − 3a.");
    A(26,REQ(sc.DeductionUS16,N(sc.DeductionUnderSection16ia)+N(sc.EntertainmntalwncUs16ii)+N(sc.ProfessionalTaxUs16iii)),"Deductions under 16 must be 5a + 5b + 5c.");
    A(27,REQ(sc.TotIncUnderHeadSalaries,Math.max(0,N(sc.NetSalary)-N(sc.DeductionUS16))),"Income under salaries must be 4 − 5.");
    const govt=emps.some(e=>e.NatureOfEmployment==="CG"||e.NatureOfEmployment==="SG");
    A(35,!N(sc.EntertainmntalwncUs16ii)||govt,"Entertainment allowance 16(ii) is for government employees only.");
    A(37,N(sc.ProfessionalTaxUs16iii)<=5000,"Professional tax under 16(iii) is limited to ₹5,000.");
    A(newR?596:40,N(sc.DeductionUnderSection16ia)<=Math.min(newR?75000:50000,N(sc.NetSalary)),"Standard deduction cannot exceed the lower of "+(newR?"₹75,000":"₹50,000")+" and net salary.");
    A(57,!newR||!N(sc.EntertainmntalwncUs16ii),"New regime — 16(ii) cannot be claimed.");A(58,!newR||!N(sc.ProfessionalTaxUs16iii),"New regime — 16(iii) cannot be claimed.");
    A(59,!huf||!N(sc.Increliefus89A),"An HUF cannot claim 89A relief.");
    const d1=RSUM(emps,e=>RG(e,"Salarys.IncomeNotified89A"));A(60,N(sc.Increliefus89A)<=d1,"89A relief cannot exceed the income at 1d.");
    const al=RG(sc,"AllwncExemptUs10.AllwncExemptUs10Dtls",[]);const secs=al.map(a=>a.SalNatureDesc);A(51,new Set(secs).size===secs.length,"The same exempt allowance cannot be selected twice.");
    const natSum=(code)=>RSUM(emps,e=>RSUM(RG(e,"Salarys.NatureOfSalary.OthersIncDtls",[]).filter(x=>x.NatureDesc===code),"OthAmount"));
    const basicDA=natSum("1")+natSum("2"),hra=natSum("4"),lta=natSum("5"),leave=natSum("16"),grat=natSum("13"),comm=natSum("12");
    const ex=code=>RSUM(al.filter(a=>a.SalNatureDesc===code),"SalOthAmount");
    A(29,newR||ex("10(13A)")<=Math.max(hra,basicDA*0.5)+1,"HRA exempt under 10(13A) cannot exceed the HRA received or 50% of basic + DA.");
    A(41,ex("10(5)")<=lta+1,"10(5) leave travel cannot exceed the leave travel allowance in 17(1).");
    A(44,ex("10(10A)")<=comm+1,"10(10A) commuted pension cannot exceed commuted pension in 17(1).");
    A(45,ex("10(10AA)")<=leave+1,"10(10AA) leave encashment cannot exceed leave encashment in 17(1).");
    A(46,ex("10(10C)")<=500000,"10(10C) voluntary retirement is limited to ₹5,00,000.");A(66,ex("10(10B)(ii)")<=500000,"10(10B)(ii) retrenchment compensation is limited to ₹5,00,000.");
    A(47,[ex("10(10B)(i)"),ex("10(10B)(ii)"),ex("10(10C)")].filter(v=>v>0).length<=1,"Only one of 10(10B)(i), 10(10B)(ii), 10(10C) may be claimed.");
    A(48,ex("10(10CC)")<=RSUM(emps,e=>RG(e,"Salarys.ValueOfPerquisites"))+1,"10(10CC) cannot exceed the value of perquisites.");
    A(53,govt||ex("10(10AA)")<=2500000,"10(10AA) is limited to ₹25 lakh for a non-government employer.");
    A(28,ex("10(10)")<=(govt?9e15:2000000)+1,"10(10) gratuity is limited to ₹20 lakh for a non-government employer.");
    A(38,emps.filter(e=>RG(e,"Salarys.NatureOfSalary.OthersIncDtls",[]).some(x=>x.NatureDesc==="13"&&N(x.OthAmount))).length<=1,"Gratuity cannot be shown against more than one employer.");
    A(39,emps.filter(e=>RG(e,"Salarys.NatureOfSalary.OthersIncDtls",[]).some(x=>x.NatureDesc==="12"&&N(x.OthAmount))).length<=1,"Commuted pension cannot be shown against more than one employer.");
    A(56,ex("10(14)(ii)")<=38400||true,"");
    /* --- batch 1: previously-unenforced §10 exempt-allowance caps --- */
    const gross1abc=RSUM(emps,e=>N(RG(e,"Salarys.Salary"))+N(RG(e,"Salarys.ValueOfPerquisites"))+N(RG(e,"Salarys.ProfitsinLieuOfSalary")));
    const otherAllow=natSum("7")+natSum("OTH"),exTotal=RSUM(al,"SalOthAmount");
    A(31,exTotal-ex("10(13A)")<=gross1abc-hra+1,"Total exempt allowances other than HRA cannot exceed 1a+1b+1c reduced by HRA.");
    A(42,ex("10(6)")<=gross1abc+1,"10(6) remuneration of an embassy official cannot exceed gross salary (1a+1b+1c).");
    A(43,ex("10(7)")<=gross1abc+1,"10(7) allowances paid by the Government outside India cannot exceed gross salary (1a+1b+1c).");
    A(49,ex("10(14)(i)")<=otherAllow+1,"10(14)(i) cannot exceed Other Allowance plus Others in section 17(1).");
    A(50,ex("10(14)(ii)")<=otherAllow+1,"10(14)(ii) cannot exceed Other Allowance plus Others in section 17(1).");
    /* --- batch 2 --- */
    const govtPen=emps.some(e=>["CG","SG","PE","PESG"].indexOf(e.NatureOfEmployment)>=0);
    A(55,newR||(ex("10(14)(i)(115BAC)")+ex("10(14)(ii)(115BAC)"))===0,"Under the old regime the 115BAC-specific 10(14) allowances cannot be claimed.");
    A(62,!govtPen||(ex("10(10B)(i)")+ex("10(10B)(ii)"))===0,"10(10B) cannot be claimed by a Central/State Government employee or pensioner.");
    A(36,newR||!N(sc.EntertainmntalwncUs16ii)||N(sc.EntertainmntalwncUs16ii)<=Math.min(5000,Math.floor(natSum("1")/5)),"16(ii) is limited to the lower of ₹5,000 and a fifth of basic salary.");
  }
  /* ---------- Schedule HP ---------- */
  if(I.ScheduleHP){const props=I.ScheduleHP.PropertyDetails||[];
    props.forEach((p,i)=>{const rd=p.Rentdetails||{},L="Property "+(i+1)+": ";const co=p.PropCoOwnedFlg==="YES";
      A(67,REQ(rd.ThirtyPercentOfBalance,Math.round(N(rd.AnnualOfPropOwned)*0.3)),L+"standard deduction must be 30% of the annual value owned.");
      A(68,!co||REQ(N(p.AsseseeShareProperty)+RSUM(p.CoOwners||[],"PercentShareProperty"),100,0.01),L+"your share plus the co-owners' shares must be 100%.");
      A(69,REQ(rd.AnnualOfPropOwned,Math.round(N(rd.BalanceALV)*N(p.AsseseeShareProperty)/100)),L+"annual value owned must be your share × the annual value.");
      A(70,N(p.AsseseeShareProperty)>0||!N(rd.IntOnBorwCap),L+"no interest can be claimed with a nil share.");
      A(71,N(rd.AnnualLetableValue)>0||!N(rd.LocalTaxes),L+"municipal tax needs a gross rent or lettable value.");
      A(72,newR||p.ifLetOut!=="S"||N(rd.IntOnBorwCap)<=200000,L+"interest on a self-occupied house is limited to ₹2,00,000 under the old regime.");
      A(74,p.ifLetOut==="S"||N(rd.AnnualLetableValue)>0,L+"a let-out or deemed let-out property needs a gross rent or lettable value.");
      A(75,REQ(rd.BalanceALV,Math.max(0,N(rd.AnnualLetableValue)-N(rd.TotalUnrealizedAndTax))),L+"1e must be 1a − 1d.");
      A(76,REQ(rd.TotalUnrealizedAndTax,N(rd.RentNotRealized)+N(rd.LocalTaxes)),L+"1d must be 1b + 1c.");
      A(77,REQ(rd.TotalDeduct,N(rd.ThirtyPercentOfBalance)+N(rd.IntOnBorwCap)),L+"1i must be 1g + 1h.");
      A(78,REQ(rd.IncomeOfHP,N(rd.AnnualOfPropOwned)-N(rd.TotalDeduct)+N(rd.ArrearsUnrealizedRentRcvd)),L+"1k must be 1f − 1i + 1j.");
      A(81,newR===false?true:(p.ifLetOut!=="S"||(!N(rd.IntOnBorwCap)&&!N(RG(rd,"Section24B.TotalInterestUs24B")))),L+"new regime — no interest on a self-occupied house.");
      A(82,!(p.CoOwners||[]).some(c=>c.PAN_CoOwner&&c.PAN_CoOwner===PI.PAN),L+"a co-owner's PAN cannot be your own.");
      A(549,!co||(p.CoOwners||[]).every(c=>c.NameCoOwner&&N(c.PercentShareProperty)>0),L+"each co-owner needs a name and share.");
      A(607,!N(rd.IntOnBorwCap)||N(rd.IntOnBorwCap)<=N(RG(rd,"Section24B.TotalInterestUs24B"))+1,L+"interest claimed cannot exceed the 24(b) table's total.");
      A(608,!rd.Section24B||REQ(RG(rd,"Section24B.TotalInterestUs24B"),RSUM(RG(rd,"Section24B.Section24BDtls",[]),"InterestUs24B")),L+"the 24(b) total must equal its rows.");
      A(610,!N(rd.IntOnBorwCap)||RG(rd,"Section24B.Section24BDtls",[]).length>0,L+"interest under 24(b) needs the loan table.");
      A(751,!co||N(p.AsseseeShareProperty)<100,L+"co-owned — your share must be less than 100%.");A(753,co||N(p.AsseseeShareProperty)===100,L+"not co-owned — your share must be 100%.");
      A(757,N(rd.RentNotRealized)<=N(rd.AnnualLetableValue),L+"unrealised rent cannot exceed the gross rent.");});
    A(73,REQ(I.ScheduleHP.TotalIncomeChargeableUnHP,RSUM(props,p=>RG(p,"Rentdetails.IncomeOfHP"))+N(I.ScheduleHP.PassThroghIncome)),"Item 3 of HP must equal Σ1k + 2.");
    A(80,props.filter(p=>p.ifLetOut==="S").length<=2,"No more than two properties can be self-occupied.");
    A(79,!I.SchedulePTI||REQ(I.ScheduleHP.PassThroghIncome,RSUM(I.SchedulePTI.SchedulePTIDtls||[],b=>RG(b,"IncFromHP.NetIncomeLoss"))),"HP item 2 must equal the house-property pass-through in Schedule PTI.");
  }
  /* ---------- Schedule 112A / 115AD ---------- */
  [["Schedule112A","Schedule112ADtls","112A",84],["Schedule115AD","Schedule115ADDtls","115AD",91]].forEach(([blk,dk,suf,base])=>{const b=I[blk];if(!b)return;
    (b[dk]||[]).forEach((r,i)=>{const L="Schedule "+(suf==="112A"?"112A":"115AD(1)(iii) proviso")+" row "+(i+1)+": ";const be=r.ShareOnOrBefore==="BE";
      if(be){A(base,REQ(r.TotSaleValue,N(r.NumSharesUnits)*N(r.SalePricePerShareUnit)),L+"column 6 must be 4 × 5.");
        A(base+3,REQ(r.TotFairMktValueCapAst,N(r.NumSharesUnits)*N(r.FairMktValuePerShareunit)),L+"column 11 must be 4 × 10.");
        A(base+2,REQ(r.LTCGBeforelowerB1B2,Math.min(N(r.TotSaleValue),N(r.TotFairMktValueCapAst))),L+"column 9 must be the lower of 6 and 11.");
        A(base+1,REQ(r.CostAcqWithoutIndx,Math.max(N(r.AcquisitionCost),N(r.LTCGBeforelowerB1B2))),L+"column 7 must be the higher of 8 and 9.");}
      else A(suf==="112A"?173:174,!N(r.NumSharesUnits)&&!N(r.SalePricePerShareUnit)&&!N(r.FairMktValuePerShareunit)&&!N(r.TotFairMktValueCapAst),L+"acquired after 31 January 2018 — columns 4, 5, 10, 11 must be nil.");
      A(base+4,REQ(r.TotalDeductions,N(r.CostAcqWithoutIndx)+N(r.ExpExclCnctTransfer)),L+"column 13 must be 7 + 12.");
      A(base+5,REQ(r.Balance,N(r.TotSaleValue)-N(r.TotalDeductions)),L+"column 14 must be 6 − 13.");});
    A(base+6,REQ(b["TotalBalance"+suf],RSUM(b[dk],"Balance"))&&REQ(b["SaleValue"+suf],RSUM(b[dk],"TotSaleValue")),"Schedule "+suf+" totals must equal the sum of the rows.");});
  A(177,!(I.Schedule112A&&I.Schedule115AD),"Fill either Schedule 112A or Schedule 115AD(1)(b)(iii) proviso, not both.");
  /* ---------- Schedule CG ---------- */
  if(I.ScheduleCGFor23){const cg=I.ScheduleCGFor23,ST=cg.ShortTermCapGainFor23||{},LT=cg.LongTermCapGain23||{},E=cg.CurrYrLosses||{},F=cg.AccruOrRecOfCG||{},D_=cg.DeducClaimInfo||{};
    const stLand=RG(ST,"SaleofLandBuild.SaleofLandBuildDtls",[]),ltLand=RG(LT,"SaleofLandBuild.SaleofLandBuildDtls",[]);
    stLand.forEach((d,i)=>{const L="A1 property "+(i+1)+": ";
      A(175,REQ(d.FullConsideration50C,N(d.PropertyValuation)>N(d.FullConsideration)*1.10?N(d.PropertyValuation):N(d.FullConsideration)),L+"A1aiii must be the stamp value only where it exceeds 1.10 × consideration (section 50C).");
      A(109,REQ(d.TotalDedn,N(d.AquisitCost)+N(d.ImproveCost)+N(d.ExpOnTrans)),L+"A1biv must be bi + bii + biii.");A(110,REQ(d.Balance,N(d.FullConsideration50C)-N(d.TotalDedn)),L+"A1c must be aiii − biv.");
      A(111,REQ(d.STCGonImmvblPrprty,N(d.Balance)-N(d.DeductionUs54B)),L+"A1e must be 1c − 1d.");A(101,N(d.FullConsideration50C)>0||!N(d.ExpOnTrans),L+"no expenses without consideration.");
      A(750,d.DateofSale<="2026-03-31",L+"the date of sale cannot be after 31 March 2026.");A(185,!(d.DateofPurchase&&d.DateofSale)||(new Date(d.DateofSale)-new Date(d.DateofPurchase))/86400000<=732,L+"held over 24 months — this is long-term, not short-term.");});
    ltLand.forEach((d,i)=>{const L="B1 property "+(i+1)+": ";const ci=d.CostOfImprovements||{};
      A(176,REQ(d.FullConsideration50C,N(d.PropertyValuation)>N(d.FullConsideration)*1.10?N(d.PropertyValuation):N(d.FullConsideration)),L+"B1aiii must follow section 50C.");
      A(128,REQ(d.TotalDedn,N(d.AquisitCost)+N(ci.TotalImprovecost)+N(d.ExpOnTrans)),L+"B1biv must be bi + Σbii + biii.");A(129,REQ(d.Balance,N(d.FullConsideration50C)-N(d.TotalDedn)),L+"B1c must be aiii − biv.");
      A(130,REQ(d.LTCGonImmvblPrprty,N(d.Balance)-N(RG(d,"ExemptionOrDednUs54.ExemptionGrandTotal"))),L+"B1e must be 1c − 1d.");
      A(594,REQ(ci.TotalImprovecost,RSUM(ci.CostOfImprovementsDtls||[],"ImproveCost")),L+"the improvement total must equal its rows.");A(595,REQ(ci.TotalindexImprovecost,RSUM(ci.CostOfImprovementsDtls||[],"CostOfImpIndex")),L+"the indexed improvement total must equal its rows.");
      A(186,(ci.CostOfImprovementsDtls||[]).every(x=>x.ImproveDate),L+"the year of every improvement is required.");
      A(182,!N(d.FullConsideration50C)||d.DateofSale,L+"the date of sale is mandatory.");A(183,!N(d.FullConsideration50C)||d.DateofPurchase,L+"the date of purchase is mandatory.");
      A(184,!(d.DateofPurchase&&d.DateofSale)||(new Date(d.DateofSale)-new Date(d.DateofPurchase))/86400000>730,L+"held under 24 months — this is short-term, not long-term.");
      A(570,res==="RES"||!N(d.AquisitCostIndex),L+"a non-resident gets no indexation — the indexed cost must be zero.");
      A(569,d.DateofPurchase<"2024-07-23"||!N(d.ExcessAmtSec1121a),L+"the second-proviso benefit applies only to a purchase before 23 July 2024.");
      A(750,d.DateofSale<="2026-03-31",L+"the date of sale cannot be after 31 March 2026.");});
    (ST.EquityMFonSTT||[]).forEach(x=>{const d=x.EquityMFonSTTDtls||{},s48=d.DeductSec48||{};A(112,REQ(s48.TotalDedn,N(s48.AquisitCost)+N(s48.ImproveCost)+N(s48.ExpOnTrans)),"A2biv must be bi + bii + biii.");A(113,REQ(d.BalanceCG,N(d.FullConsideration)-N(s48.TotalDedn)),"A2c must be 2a − biv.");A(114,REQ(d.CapgainonAssets,N(d.BalanceCG)+N(d.LossSec94of7Or94of8)),"A2e must be 2c + 2d.");A(102,N(d.FullConsideration)>0||!N(s48.ExpOnTrans),"A2: no expenses without consideration.");});
    {const d=ST.SaleOnOtherAssets||{},s48=d.DeductSec48||{};if(N(d.FullConsideration)){A(120,REQ(d.FullValueConsdSec50CA,Math.max(N(d.FullValueConsdRecvUnqshr),N(d.FairMrktValueUnqshr))),"A5(a)(ic) must be the higher of ia and ib.");A(121,REQ(d.FullConsideration,N(d.FullValueConsdSec50CA)+N(d.FullValueConsdOthUnqshr)),"A5aiii must be ic + aii.");A(122,REQ(s48.TotalDedn,N(s48.AquisitCost)+N(s48.ImproveCost)+N(s48.ExpOnTrans)),"A5biv must be bi + bii + biii.");A(123,REQ(d.BalanceCG,N(d.FullConsideration)-N(s48.TotalDedn)),"A5c must be aiii − biv.");}
      A(104,N(d.FullConsideration)>0||!N(s48.ExpOnTrans),"A5: no expenses without consideration.");}
    A(126,REQ(ST.PassThrIncNatureSTCG,N(ST.PassThrIncNatureSTCG20Per)+N(ST.PassThrIncNatureSTCG30Per)+N(ST.PassThrIncNatureSTCGAppRate)),"A7 must be A7a + A7b + A7c.");
    A(125,REQ(ST.TotalAmtDeemedStcg,RSUM(RG(ST,"UnutilizedCg.UnutilizedCgPrvYrDtls",[]),"AmtUnutilized")+N(ST.AmtDeemedStcg)),"A6 must be aXi + b.");
    const bbST=ST.CapitalLossBuyBackShares;if(bbST)A(589,REQ(bbST.TotalCapitalLossBuyBackShares,RSUM(bbST.CapitalLossBuyBackSharesDtls||[],"Amount")),"A(A) must equal the sum of its rate rows.");
    A(600,!(bbST||LT.CapitalLossBuyBackShares)||N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.Dividend22f"))>0,"A buy-back loss needs the 2(22)(f) dividend at 1a(iii) of Schedule OS.");
    (LT.Proviso112Applicable||[]).forEach(x=>{const d=x.Proviso112Applicabledtls||{},s48=d.DeductSec48||{};A(131,REQ(s48.TotalDedn,N(s48.AquisitCost)+N(s48.ImproveCost)+N(s48.ExpOnTrans)),"B2biv must be bi + bii + biii.");A(132,REQ(d.BalanceCG,N(d.FullConsideration)-N(s48.TotalDedn)),"B2c must be 2a − biv.");A(133,REQ(d.CapgainonAssets,N(d.BalanceCG)-N(d.DeductionUs54F)),"B2e must be 2c − 2d.");A(106,N(d.FullConsideration)>0||!N(s48.ExpOnTrans),"B2: no expenses without consideration.");});
    {const d=LT.SaleOfEquityShareUs112A||{};A(134,!I.Schedule112A||REQ(d.BalanceCG,I.Schedule112A.TotalBalance112A),"B3a must equal column 14 of Schedule 112A.");A(135,REQ(d.CapgainonAssets,N(d.BalanceCG)-N(d.DeductionUs54F)),"B3c must be 3a − 3b.");}
    {const d=RG(LT,"SaleofAssetNADtls.SaleofAssetNA",{}),s48=d.DeductSec48||{};if(N(d.FullConsideration)){A(145,REQ(d.FullValueConsdSec50CA,Math.max(N(d.FullValueConsdRecvUnqshr),N(d.FairMrktValueUnqshr))),"B9(a)(ic) must be the higher of ia and ib.");A(146,REQ(d.FullConsideration,N(d.FullValueConsdSec50CA)+N(d.FullValueConsdOthUnqshr)),"B9aiii must be ic + aii.");A(147,REQ(s48.TotalDedn,N(s48.AquisitCost)+N(s48.ImproveCost)+N(s48.ExpOnTrans)),"B9biv must be bi + bii + biii.");A(148,REQ(d.BalanceCG,N(d.FullConsideration)-N(s48.TotalDedn)),"B9c must be aiii − biv.");A(149,REQ(d.CapgainonAssets,N(d.BalanceCG)-N(d.DeductionUs54F)),"B9e must be c − d.");}
      A(108,N(d.FullConsideration)>0||!N(s48.ExpOnTrans),"B9: no expenses without consideration.");}
    A(150,REQ(LT.TotalAmtDeemedLtcg,RSUM(RG(LT,"UnutilizedCg.UnutilizedCgPrvYrDtls",[]),"AmtUnutilized")+N(LT.AmtDeemedLtcg)),"B10 must be aXi + aXii + b.");
    A(151,REQ(LT.PassThrIncNatureLTCG,N(LT.PassThrIncNatureLTCGUs112A12_5Per)+N(LT.PassThrIncNatureLTCG12_5Per)),"B11 must be B11a1 + B11a2.");
    /* the totals A and B, and C */
    const a2e=RSUM(ST.EquityMFonSTT||[],x=>RG(x,"EquityMFonSTTDtls.CapgainonAssets")),a3=N(RG(ST,"NRITransacSec48Dtl.NRItaxSTTPaid"))+N(RG(ST,"NRITransacSec48Dtl.NRItaxSTTNotPaid")),a4=N(RG(ST,"NRISecur115AD.CapgainonAssets")),a5=N(RG(ST,"SaleOnOtherAssets.CapgainonAssets"));
    A(98,REQ(ST.TotalSTCG,RSUM(stLand,"STCGonImmvblPrprty")+a2e+a3+a4+a5+N(ST.TotalAmtDeemedStcg)+N(ST.PassThrIncNatureSTCG)-N(ST.TotalAmtNotTaxUsDTAAStcg)+N(RG(ST,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"))),"Total STCG must equal the individual heads.");
    const b2=RSUM(LT.Proviso112Applicable||[],x=>RG(x,"Proviso112Applicabledtls.CapgainonAssets")),b3=N(RG(LT,"SaleOfEquityShareUs112A.CapgainonAssets")),b8=N(RG(LT,"NRISaleofForeignAsset.BalonSpeciAsset")),b9=N(RG(LT,"SaleofAssetNADtls.SaleofAssetNA.CapgainonAssets")),bnri=RSUM(RG(LT,"NRIOnSec112and115.NRIOnSec112and115Dtls",[]),x=>RG(x,"NRIOnSec112and115Details.CapgainonAssets"))+N(RG(LT,"NRIProvisoSec48.BalanceCG"))+N(RG(LT,"NRISaleOfEquityShareUs112A.CapgainonAssets"));
    A(99,REQ(LT.TotalLTCG,RSUM(ltLand,"LTCGonImmvblPrprty")+b2+b3+bnri+b8+b9+N(LT.TotalAmtDeemedLtcg)+N(LT.PassThrIncNatureLTCG)-N(LT.TotalAmtNotTaxUsDTAALtcg)+N(RG(LT,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"))),"Total LTCG must equal the individual heads.");
    A(584,!ltLand.length||REQ(RG(LT,"SaleofLandBuild.TotalLTCGImmblPrprty"),RSUM(ltLand,"LTCGonImmvblPrprty")),"B1g must be the sum over properties.");
    A(178,REQ(cg.TotScheduleCGFor23,N(cg.SumOfCGIncm)+N(cg.IncmFromVDATrnsf)),"C3 must be C1 + C2.");A(179,!I.ScheduleVDA||REQ(cg.IncmFromVDATrnsf,I.ScheduleVDA.TotIncCapGain),"C2 must equal Schedule VDA.");
    A(100,REQ(cg.SumOfCGIncm,N(RG(cg,"ShortTermCapGainFor23.TotalSTCG"))+N(RG(cg,"LongTermCapGain23.TotalLTCG"))),"C1 must equal A9 (STCG total) + B12 (LTCG total).");
    /* Table E: composition, caps, arithmetic */
    const loss=E.InLossSetOff||{},used=E.TotLossSetOff||{},rem=E.LossRemainSetOff||{};const bb=code=>RSUM(RG(ST,"CapitalLossBuyBackShares.CapitalLossBuyBackSharesDtls",[]).filter(x=>x.Rate===code),"Amount");
    const netE=k=>N(RG(E,k+".CurrYearIncome"));const gainOrLoss=(k,lk)=>netE(k)-N(loss[lk]);
    A(574,REQ(gainOrLoss("InStcg20Per","StclSetoff20Per"),a2e+N(RG(ST,"NRITransacSec48Dtl.NRItaxSTTPaid"))+N(ST.PassThrIncNatureSTCG20Per)+bb("STL20")),"E 20% must be A2e + A3a + A7a + A(A) at 20%.");
    A(163,REQ(gainOrLoss("InStcg30Per","StclSetoff30Per"),a4+N(ST.PassThrIncNatureSTCG30Per)+bb("STL30")),"E 30% must be A4e + A7b + A(A) at 30%.");
    A(164,REQ(gainOrLoss("InStcgAppRate","StclSetoffAppRate"),RSUM(stLand,"STCGonImmvblPrprty")+N(RG(ST,"NRITransacSec48Dtl.NRItaxSTTNotPaid"))+a5+N(ST.TotalAmtDeemedStcg)+N(ST.PassThrIncNatureSTCGAppRate)+bb("STLAR")),"E applicable must be A1e + A3b + A5e + A6 + A7c + A(A).");
    A(165,REQ(gainOrLoss("InStcgDTAARate","StclSetoffDTAARate"),ST.TotalAmtTaxUsDTAAStcg),"E DTAA must be A8b.");A(166,REQ(gainOrLoss("InLtcgDTAARate","LtclSetOffDTAARate"),LT.TotalAmtTaxUsDTAALtcg),"E LT DTAA must be B12b.");
    const SLK=[["InStcg20Per","StclSetoff20Per"],["InStcg30Per","StclSetoff30Per"],["InStcgAppRate","StclSetoffAppRate"],["InStcgDTAARate","StclSetoffDTAARate"],["InLtcg12_5Per","LtclSetOff12_5Per"],["InLtcgDTAARate","LtclSetOffDTAARate"]];
    SLK.forEach(([gk,lk],i)=>{const node=E[gk]||{};const setoffs=SLK.filter(x=>x[1]!==lk).reduce((a,[,l2])=>a+N(node[l2]),0);
      A(551+i,setoffs<=N(node.CurrYearIncome)+1,"Table E: set-off against "+gk.replace("In","")+" exceeds the income available.");
      A(563,REQ(node.CurrYrCapGain,N(node.CurrYearIncome)-setoffs),"Table E: column 8 of "+gk.replace("In","")+" must be 1 − the set-offs.");
      const usedCol=SLK.reduce((a,[g2])=>a+N(RG(E,g2+"."+lk)),0);A(557+i,usedCol<=N(loss[lk])+1,"Table E: loss set off under "+lk+" exceeds the loss available.");
      A(157,REQ(used[lk],usedCol),"Table E row viii must be the column's sum for "+lk+".");A(564,REQ(rem[lk],N(loss[lk])-N(used[lk])),"Table E row ix must be i − viii for "+lk+".");});
    /* Table F = BFLA */
    if(I.ScheduleBFLA){const bf=I.ScheduleBFLA,af=k=>N(RG(bf,k+".IncBFLA.IncOfCurYrAfterSetOffBFLosses"));const seniorRes=res!=="NRI"&&ind&&S_.C.tax&&S_.C.tax.age>=60;
      if(!seniorRes){A(577,REQ(RDR(F.ShortTermUnder20Per),af("STCG20Per")),"Table F 20% must equal BFLA 3(iii).");A(169,REQ(RDR(F.ShortTermUnder30Per),af("STCG30Per")),"Table F 30% must equal BFLA 3(iv).");
        A(170,REQ(RDR(F.ShortTermUnderAppRate),af("STCGAppRate")),"Table F applicable must equal BFLA 3(v).");A(171,REQ(RDR(F.ShortTermUnderDTAARate),af("STCGDTAARate")),"Table F ST DTAA must equal BFLA 3(vi).");
        A(578,REQ(RDR(F.LongTermUnder12_5Per),af("LTCG12_5Per")),"Table F 12.5% must equal BFLA 3(vii).");A(172,REQ(RDR(F.LongTermUnderDTAARate),af("LTCGDTAARate")),"Table F LT DTAA must equal BFLA 3(viii).");
        A(181,!I.ScheduleVDA||REQ(RDR(F.VDATrnsfGainsUnder30Per),cg.IncmFromVDATrnsf),"Table F sl. 7 must equal C2.");}}
    /* Part D */
    const dedRows=[];["DeducClaimDtlsUs54","DeducClaimDtlsUs54B","DeducClaimDtlsUs54EC","DeducClaimDtlsUs54F","DeducClaimDtlsUs115F"].forEach(k=>(D_[k]||[]).forEach(r=>dedRows.push([k,r])));
    A(156,!D_.TotDeductClaim||REQ(D_.TotDeductClaim,dedRows.reduce((a,[,r])=>a+N(r.AmtDeducted),0)),"Part D total must equal its rows.");
    A(591,dedRows.filter(([k])=>k==="DeducClaimDtlsUs54EC").reduce((a,[,r])=>a+N(r.AmtInvested),0)<=5000000,"Section 54EC investment is limited to ₹50 lakh.");
    /* rule 167 — per section: deductions in the gain blocks must equal Part D, section by section */
    const landExBy=sec=>RSUM(ltLand,d=>(RG(d,"ExemptionOrDednUs54.ExemptionOrDednUs54Dtls",[])||[]).filter(x=>x.ExemptionSecCode===sec).reduce((a,x)=>a+N(x.ExemptionAmount),0));
    const paBy={"54":landExBy("54"),
      "54B":landExBy("54B")+RSUM(stLand,"DeductionUs54B"),
      "54EC":landExBy("54EC"),
      "54F":landExBy("54F")+N(RG(LT,"SaleOfEquityShareUs112A.DeductionUs54F"))+N(RG(LT,"SaleofAssetNADtls.SaleofAssetNA.DeductionUs54F"))+RSUM(LT.Proviso112Applicable||[],x=>RG(x,"Proviso112Applicabledtls.DeductionUs54F")),
      "115F":N(RG(LT,"NRISaleofForeignAsset.DednSpecAssetus115"))};
    const tdKey={"54":"DeducClaimDtlsUs54","54B":"DeducClaimDtlsUs54B","54EC":"DeducClaimDtlsUs54EC","54F":"DeducClaimDtlsUs54F","115F":"DeducClaimDtlsUs115F"};
    ["54","54B","54EC","54F","115F"].forEach(sec=>{const td=(D_[tdKey[sec]]||[]).reduce((a,r)=>a+N(r.AmtDeducted),0);
      A(167,REQ(paBy[sec],td),"Section "+sec+": deductions claimed in the gain blocks ("+paBy[sec]+") must equal Part D ("+td+").");});}
  /* ---------- Schedule VDA ---------- */
  if(I.ScheduleVDA){const rows=I.ScheduleVDA.ScheduleVDADtls||[];rows.forEach((r,i)=>{A(188,REQ(r.IncomeFromVDA,Math.max(0,N(r.ConsidReceived)-N(r.AcquisitionCost))),"VDA row "+(i+1)+": column 7 must be 6 − 5.");A(749,r.DateofTransfer<="2026-03-31"&&r.DateofAcquisition<="2026-03-31","VDA row "+(i+1)+": dates cannot be after 31 March 2026.");});
    A(189,REQ(I.ScheduleVDA.TotIncCapGain,RSUM(rows.filter(r=>r.HeadUndIncTaxed==="CG"&&N(r.IncomeFromVDA)>0),"IncomeFromVDA")),"VDA total must equal the positive capital-gain rows.");}
  /* ---------- Schedule OS ---------- */
  if(I.ScheduleOS){const so=I.ScheduleOS,io=so.IncOthThanOwnRaceHorse||{},dd=io.Deductions||{},H=so.IncFromOwnHorse;
    A(218,REQ(io.DividendGross,N(io.DividendOthThan22e)+N(io.Dividend22e)+N(io.Dividend22f)),"OS 1a must be 1ai + 1aii + 1aiii.");
    A(210,REQ(io.InterestGross,["IntrstFrmSavingBank","IntrstFrmTermDeposit","IntrstFrmIncmTaxRefund","NatofPassThrghIncome","IntrstSec10XIFirstProviso","IntrstSec10XISecondProviso","IntrstSec10XIIFirstProviso","IntrstSec10XIISecondProviso","IntrstFrmOthers"].reduce((a,k)=>a+N(io[k]),0)),"OS 1b must be the sum of bi to bix.");
    A(197,REQ(io.Tot562x,N(io.Aggrtvaluewithoutcons562x)+N(io.Immovpropwithoutcons562x)+N(io.Immovpropinadeqcons562x)+N(io.Anyotherpropwithoutcons562x)+N(io.Anyotherpropinadeqcons562x)),"OS 1d must be di + dii + diii + div + dv.");
    A(227,REQ(io.IncomeNotified89AOS,RSUM(io.IncomeNotified89ATypeOS||[],"NOT89AAmount")),"OS 89A notified-country income must equal its country rows.");
    const cc=(io.IncomeNotified89ATypeOS||[]).map(x=>x.NOT89ACountrycode);A(232,new Set(cc).size===cc.length,"OS: a 89A country cannot be chosen twice.");
    const oneE=N(io.FamilyPension)+N(io.IncomeNotified89AOS)+N(io.IncomeNotifiedOther89AOS)+N(io.IncomeNotifiedPrYr89AOS)+N(io.SumRecdPrYrBusTRU562xii)+N(io.SumRecdPrYrLifIns562xiii)+RSUM(RG(io,"OthersInc.OthersIncDtls",[]),"OthAmount");
    A(190,REQ(io.GrossIncChrgblTaxAtAppRate,N(io.DividendGross)+N(io.InterestGross)+N(io.RentFromMachPlantBldgs)+N(io.Tot562x)+N(io.AnyOtherIncome)),"OS 1 must be 1a + 1b + 1c + 1d + 1e.");
    A(191,REQ(dd.TotDeductions,N(dd.Expenses)+N(dd.DeductionUs57iia)+N(dd.Depreciation)+N(dd.IntExp57)),"OS 3 must be 3ai + 3aii + 3b + 3c(i).");
    A(192,N(io.RentFromMachPlantBldgs)>0||!N(dd.Depreciation),"OS 3b depreciation needs rent at 1c.");
    A(209,N(io.FamilyPension)>0||!N(dd.DeductionUs57iia),"OS 57(iia) needs family pension at 1e.");
    A(215,newR||N(dd.DeductionUs57iia)<=Math.min(Math.round(N(io.FamilyPension)/3),15000)+1,"OS 57(iia) is the lower of a third of family pension and ₹15,000 (old regime).");
    A(216,N(dd.IntExp57)<=Math.round((N(io.DividendOthThan22e)+N(io.Dividend22e))*0.20)+1,"OS 3c(i) interest cannot exceed 20% of the dividend at 1a(i) + 1a(ii).");
    A(217,!N(dd.Expenses)||(N(io.InterestGross)+N(io.RentFromMachPlantBldgs)+N(io.Tot562x)+oneE-N(io.FamilyPension))>0,"OS 3a(i) expenses need income at 1b, 1c, 1d or 1e (other than family pension).");
    const bbe=["CashCreditsUs68","UnExplndInvstmntsUs69","UnExplndMoneyUs69A","UnDsclsdInvstmntsUs69B","UnExplndExpndtrUs69C","AmtBrwdRepaidOnHundiUs69D"].reduce((a,k)=>a+N(io[k]),0);
    A(370,REQ(io.IncChrgblUs115BBE,bbe),"OS 2b must be the sum of its six lines.");
    A(211,REQ(RG(io,"TaxAccumulatedBalRecPF.TotalIncomeBenefit"),RSUM(RG(io,"TaxAccumulatedBalRecPF.TaxAccmltdBalRecPFDtls",[]),"IncomeBenefit")),"OS 2c income benefit must equal its rows.");
    A(212,REQ(RG(io,"TaxAccumulatedBalRecPF.TotalTaxBenefit"),RSUM(RG(io,"TaxAccumulatedBalRecPF.TaxAccmltdBalRecPFDtls",[]),"TaxBenefit")),"OS 2c tax benefit must equal its rows.");
    A(196,REQ(io.PassThrIncOSChrgblSplRate,RSUM(io.PTIOthersGrossDtls||[],"SourceAmount")),"OS 2e must be the sum of its rows.");
    A(198,res==="RES"||!(io.OthersGrossDtls||[]).some(x=>x.SourceDescription==="5BBF"&&N(x.SourceAmount)),"A non-resident cannot show income under 115BBF.");
    const dtaaRows=RG(io,"IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS",[]);const dtaaBy=n=>RSUM(dtaaRows.filter(r=>r.NatureOfIncome===n),"DTAAamt");
    A(199,dtaaBy("1ai")<=N(io.DividendOthThan22e),"OS 2f: DTAA rows for 1ai cannot exceed 1ai.");A(200,dtaaBy("1b")<=N(io.InterestGross),"OS 2f: DTAA rows for 1b cannot exceed 1b.");A(201,dtaaBy("1c")<=N(io.RentFromMachPlantBldgs),"OS 2f: DTAA rows for 1c cannot exceed 1c.");
    A(202,dtaaBy("1d")<=N(io.Tot562x),"OS 2f: DTAA rows for 1d cannot exceed 1d.");A(203,dtaaBy("2ai")<=N(io.LtryPzzlChrgblUs115BB),"OS 2f: DTAA rows for 2ai cannot exceed 2ai.");A(229,dtaaBy("2aii")<=N(io.IncChrgblUs115BBJ),"OS 2f: DTAA rows for 2aii cannot exceed 2aii.");
    A(204,dtaaBy("2d")<=N(io.OthersGross),"OS 2f: DTAA rows for 2d cannot exceed 2d.");A(205,dtaaBy("2e")<=N(io.PassThrIncOSChrgblSplRate),"OS 2f: DTAA rows for 2e cannot exceed 2e.");
    dtaaRows.forEach((r,i)=>{A(207,r.TaxRescertifiedFlag!=="Y"||REQ(r.ApplicableRate,Math.min(N(r.RateAsPerTreaty),N(r.RateAsPerITAct)),0.01),"OS 2f row "+(i+1)+": with a TRC the applicable rate is the lower of the treaty and the Act.");});
    const dtaaNotTax=RSUM(dtaaRows.filter(r=>!N(r.RateAsPerTreaty)),"DTAAamt");
    A(208,REQ(io.IncChargeableSpecialRates,N(io.LtryPzzlChrgblUs115BB)+N(io.IncChrgblUs115BBJ)+N(io.IncChrgblUs115BBE)+N(RG(io,"TaxAccumulatedBalRecPF.TotalIncomeBenefit"))+N(io.OthersGross)+N(io.PassThrIncOSChrgblSplRate)+N(RG(io,"IncChargblSplRateOS.TotalAmtTaxUsDTAASchOs"))),"OS 2 must be 2a + 2b + 2c + 2d + 2e + 2f.");
    A(206,REQ(io.BalanceNoRaceHorse,N(io.GrossIncChrgblTaxAtAppRate)-dtaaNotTax-N(dd.TotDeductions)+N(io.AmtNotDeductibleUs58)+N(io.ProfitChargTaxUs59)-N(io.Increliefus89AOS)),"OS 6 must be 1 − 3 + 4 + 5 − 5a less the DTAA part of 1.");
    A(193,REQ(so.TotOthSrcNoRaceHorse,N(io.IncChargeableSpecialRates)+Math.max(0,N(io.BalanceNoRaceHorse))),"OS 7 must be 2 + 6 (6 as nil if negative).");
    if(H)A(194,REQ(H.BalanceOwnRaceHorse,N(H.Receipts)-N(H.DeductSec57)+N(H.AmtNotDeductibleUs58)+N(H.ProfitChargTaxUs59)),"OS 8e must be 8a − 8b + 8c + 8d.");
    A(195,REQ(so.IncChargeable,N(so.TotOthSrcNoRaceHorse)+Math.max(0,N(RG(H,"BalanceOwnRaceHorse")))),"OS 9 must be 7 + 8e (8e as nil if negative).");
    A(224,N(io.Increliefus89AOS)<=N(io.IncomeNotified89AOS),"OS 5a relief cannot exceed the 89A income at 1e.");A(226,!N(io.Increliefus89AOS)||N(io.IncomeNotified89AOS)>0,"OS 5a needs 89A income at 1e.");
    A(233,!(io.OthersGrossDtls||[]).some(x=>/BBC/.test(x.SourceDescription)),"115BBC is not applicable on ITR-2.");
    /* item 10 */
    A(213,REQ(RDR(so.IncFrmLottery),N(io.LtryPzzlChrgblUs115BB)-dtaaBy("2ai")),"OS 10: the lottery quarters must equal 2a(i) less its DTAA part.");
    A(230,!so.IncFrmOnGames||REQ(RDR(so.IncFrmOnGames),N(io.IncChrgblUs115BBJ)-dtaaBy("2aii")),"OS 10: the online-games quarters must equal 2a(ii).");
    const _hi214=N(io.DividendOthThan22e)-dtaaBy("1ai"),_lo214=_hi214-N(dd.IntExp57),_q214=RDR(so.DividendIncUs115BBDA);
    A(214,_q214<=_hi214+1&&_q214>=_lo214-1,"OS 10: the dividend quarters ("+_q214+") must be between 1a(i) − DTAA − 57(i) interest ("+_lo214+") and 1a(i) − DTAA ("+_hi214+").");
    A(588,REQ(RDR(so.DividendIncUs115BBDAaiii),N(io.Dividend22f)-dtaaBy("1aiii")),"OS 10: the 1a(iii) quarters must equal 1a(iii) less its DTAA part.");
    A(225,REQ(RDR(so.NOT89A),Math.max(0,N(io.IncomeNotified89AOS)-N(io.Increliefus89AOS))),"OS 10: the 89A quarters must equal the 89A income after relief.");
    const codeSum=codes=>RSUM((io.OthersGrossDtls||[]).filter(x=>codes.indexOf(x.SourceDescription)>=0),"SourceAmount")+RSUM((io.PTIOthersGrossDtls||[]).filter(x=>codes.indexOf(String(x.SourceDescription).replace(/^PTI_/,""))>=0),"SourceAmount");
    A(220,REQ(RDR(so.DividendIncUs115A1ai),codeSum(["5A1ai"])),"OS 10: 115A(1)(a)(i) dividend must equal its 2d/2e rows.");A(231,!so.DividendIncUs115A1aA||REQ(RDR(so.DividendIncUs115A1aA),codeSum(["5A1aA"])),"OS 10: 115A(1)(a)(A) dividend must equal its 2d/2e rows.");
    A(221,REQ(RDR(so.DividendIncUs115AC),codeSum(["5AC1abD"])),"OS 10: 115AC dividend must equal its 2d/2e rows.");A(222,REQ(RDR(so.DividendIncUs115ACA),codeSum(["5ACA1a"])),"OS 10: 115ACA dividend must equal its 2d/2e rows.");
    A(223,REQ(RDR(so.DividendIncUs115AD1i),codeSum(["5AD1iDiv"])),"OS 10: 115AD(1)(i) dividend must equal its 2d/2e rows.");A(219,REQ(RDR(so.DividendDTAA),dtaaBy("1ai")+dtaaBy("1aiii")),"OS 10: DTAA dividend quarters must equal the dividend rows of 2f.");}
  /* ---------- CYLA / BFLA / CFL ---------- */
  if(I.ScheduleCYLA&&I.ScheduleBFLA){const cy=I.ScheduleCYLA,bf=I.ScheduleBFLA,cg=I.ScheduleCGFor23,E=cg&&cg.CurrYrLosses||{};
    const inc=k=>N(RG(cy,k+".IncCYLA.IncOfCurYrUnderThatHead")),hpS=k=>N(RG(cy,k+".IncCYLA.HPlossCurYrSetoff")),osS=k=>N(RG(cy,k+".IncCYLA.OthSrcLossNoRaceHorseSetoff")),aft=k=>N(RG(cy,k+".IncCYLA.IncOfCurYrAfterSetOff"));
    const ROWS=["Salary","HP","STCG20Per","STCG30Per","STCGAppRate","STCGDTAARate","LTCG12_5Per","LTCGDTAARate","OthSrcExclRaceHorse","OthSrcRaceHorse","IncOSDTAA"];
    ROWS.forEach(k=>{if(!cy[k])return;A(256,REQ(aft(k),inc(k)-hpS(k)-osS(k)),"CYLA "+k+": column 4 must be 1 − 2 − 3.");A(268,hpS(k)+osS(k)<=inc(k)+1,"CYLA "+k+": set-off exceeds the income.");});
    A(252,REQ(RG(cy,"TotalLossSetOff.TotHPlossCurYrSetoff"),ROWS.reduce((a,k)=>a+hpS(k),0)),"CYLA 2xiii must be the column's sum.");A(253,REQ(RG(cy,"TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff"),ROWS.reduce((a,k)=>a+osS(k),0)),"CYLA 3xiii must be the column's sum.");
    A(254,newR||REQ(RG(cy,"LossRemAftSetOff.BalHPlossCurYrAftSetoff"),Math.max(0,N(RG(cy,"TotalCurYr.TotHPlossCurYr"))-N(RG(cy,"TotalLossSetOff.TotHPlossCurYrSetoff"))),9e15),"");
    A(255,REQ(RG(cy,"LossRemAftSetOff.BalOthSrcLossNoRaceHorseAftSetoff"),N(RG(cy,"TotalCurYr.TotOthSrcLossNoRaceHorse"))-N(RG(cy,"TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff"))),"CYLA 3xiv must be 3i − 3xiii.");
    A(266,N(RG(cy,"TotalLossSetOff.TotHPlossCurYrSetoff"))<=N(RG(cy,"TotalCurYr.TotHPlossCurYr"))+1&&N(RG(cy,"TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff"))<=N(RG(cy,"TotalCurYr.TotOthSrcLossNoRaceHorse"))+1,"CYLA: total set off cannot exceed the loss to be set off.");
    A(249,newR||N(RG(cy,"TotalLossSetOff.TotHPlossCurYrSetoff"))<=200000,"CYLA 2xiii house-property loss set off cannot exceed ₹2,00,000.");
    A(264,!newR||!N(RG(cy,"TotalLossSetOff.TotHPlossCurYrSetoff")),"New regime — no house-property loss may be set off in CYLA.");A(265,!newR||!N(RG(cy,"LossRemAftSetOff.BalHPlossCurYrAftSetoff")),"New regime — CYLA 2xiv must be nil.");
    if(I.ScheduleHP)A(250,REQ(RG(cy,"TotalCurYr.TotHPlossCurYr"),Math.max(0,-N(I.ScheduleHP.TotalIncomeChargeableUnHP))),"CYLA house-property loss must equal Schedule HP.");
    if(I.ScheduleOS)A(251,REQ(RG(cy,"TotalCurYr.TotOthSrcLossNoRaceHorse"),Math.max(0,-N(RG(I.ScheduleOS,"IncOthThanOwnRaceHorse.BalanceNoRaceHorse")))),"CYLA other-sources loss must equal Schedule OS item 6.");
    if(I.ScheduleS)A(262,REQ(inc("Salary"),I.ScheduleS.TotIncUnderHeadSalaries),"CYLA salary must equal Schedule S item 6.");
    if(cg){const e8=k=>N(RG(E,k+".CurrYrCapGain"));A(567,REQ(inc("STCG20Per"),e8("InStcg20Per")),"CYLA STCG 20% must equal E 8ii.");A(257,REQ(inc("STCG30Per"),e8("InStcg30Per")),"CYLA STCG 30% must equal E 8iii.");A(258,REQ(inc("STCGAppRate"),e8("InStcgAppRate")),"CYLA STCG applicable must equal E 8iv.");A(259,REQ(inc("STCGDTAARate"),e8("InStcgDTAARate")),"CYLA STCG DTAA must equal E 8v.");A(568,REQ(inc("LTCG12_5Per"),e8("InLtcg12_5Per")),"CYLA LTCG 12.5% must equal E 8vi.");A(263,REQ(inc("LTCGDTAARate"),e8("InLtcgDTAARate")),"CYLA LTCG DTAA must equal E 8vii.");}
    if(I.ScheduleOS){A(260,REQ(inc("OthSrcExclRaceHorse"),Math.max(0,N(RG(I.ScheduleOS,"IncOthThanOwnRaceHorse.BalanceNoRaceHorse")))),"CYLA other sources must equal OS item 6.");A(261,REQ(inc("OthSrcRaceHorse"),Math.max(0,N(RG(I.ScheduleOS,"IncFromOwnHorse.BalanceOwnRaceHorse")))),"CYLA race horses must equal OS 8e.");}
    const b1=k=>N(RG(bf,k+".IncBFLA.IncOfCurYrUndHeadFromCYLA")),b2=k=>N(RG(bf,k+".IncBFLA.BFlossPrevYrUndSameHeadSetoff")),b3=k=>N(RG(bf,k+".IncBFLA.IncOfCurYrAfterSetOffBFLosses"));
    [["Salary",239],["HP",240],["STCG20Per",579],["STCG30Per",241],["STCGAppRate",242],["STCGDTAARate",243],["LTCG12_5Per",580],["LTCGDTAARate",244],["OthSrcExclRaceHorse",245],["OthSrcRaceHorse",246],["IncOSDTAA",587]].forEach(([k,n])=>{if(!bf[k])return;
      A(n,REQ(b1(k),aft(k)),"BFLA "+k+" column 1 must equal CYLA column 4.");A(238,REQ(b3(k),b1(k)-b2(k)),"BFLA "+k+": column 3 must be 1 − 2.");A(269,b2(k)<=b1(k)+1,"BFLA "+k+": set-off exceeds the income.");});
    A(236,REQ(RG(bf,"TotalBFLossSetOff.TotBFLossSetoff"),ROWS.reduce((a,k)=>a+b2(k),0)),"BFLA 2xii must be the column's sum.");A(237,REQ(bf.IncomeOfCurrYrAftCYLABFLA,ROWS.reduce((a,k)=>a+b3(k),0)),"BFLA 3xiii must be the column's sum.");
    if(I.ScheduleCFL){const cf=I.ScheduleCFL,S1=k=>RG(cf,"TotalOfBFLossesEarlierYrs.LossSummaryDetail."+k),Sx=k=>RG(cf,"AdjTotBFLossInBFLA.LossSummaryDetail."+k),Scur=k=>RG(cf,"CurrentAYloss.LossSummaryDetail."+k),Scf=k=>RG(cf,"TotalLossCFSummary.LossSummaryDetail."+k);
      const yrs=Object.keys(cf).filter(k=>k.startsWith("LossCF")).map(k=>cf[k].CarryFwdLossDetail);
      A(275,REQ(S1("TotalHPPTILossCF"),RSUM(yrs,"TotalHPPTILossCF"))&&REQ(S1("TotalSTCGPTILossCF"),RSUM(yrs,"TotalSTCGPTILossCF"))&&REQ(S1("TotalLTCGPTILossCF"),RSUM(yrs,"TotalLTCGPTILossCF")),"CFL totals must equal the years.");
      A(235,REQ(b2("HP"),Sx("TotalHPPTILossCF")),"BFLA 2ii must equal CFL's HP adjustment.");A(234,REQ(b2("OthSrcRaceHorse"),Sx("OthSrcLossRaceHorseCF")),"BFLA 2x must equal CFL's race-horse adjustment.");
      A(247,REQ(["STCG20Per","STCG30Per","STCGAppRate","STCGDTAARate","LTCG12_5Per","LTCGDTAARate"].reduce((a,k)=>a+b2(k),0),N(Sx("TotalSTCGPTILossCF"))+N(Sx("TotalLTCGPTILossCF"))),"BFLA capital set-off must equal CFL's STCL + LTCL adjustment.");
      A(274,REQ(Scur("TotalHPPTILossCF"),RG(cy,"LossRemAftSetOff.BalHPlossCurYrAftSetoff")),"CFL current HP loss must equal CYLA 2xiv.");
      if(cg){A(272,REQ(Scur("TotalSTCGPTILossCF"),["StclSetoff20Per","StclSetoff30Per","StclSetoffAppRate","StclSetoffDTAARate"].reduce((a,k)=>a+N(RG(E,"LossRemainSetOff."+k)),0)),"CFL current STCL must equal Table E's short-term losses remaining.");A(273,REQ(Scur("TotalLTCGPTILossCF"),N(RG(E,"LossRemainSetOff.LtclSetOff12_5Per"))+N(RG(E,"LossRemainSetOff.LtclSetOffDTAARate"))),"CFL current LTCL must equal Table E's long-term losses remaining.");}
      ["TotalHPPTILossCF","TotalSTCGPTILossCF","TotalLTCGPTILossCF","OthSrcLossRaceHorseCF"].forEach(k=>A(748,N(Scf(k))<=Math.max(0,N(S1(k))-N(Sx(k))+N(Scur(k)))+1,"CFL xii for "+k+" cannot exceed ix − x + xi."));
      A(486,REQ(ti.LossesOfCurrentYearCarriedFwd,N(Scf("TotalHPPTILossCF"))+N(Scf("TotalSTCGPTILossCF"))+N(Scf("TotalLTCGPTILossCF"))+N(Scf("OthSrcLossRaceHorseCF"))),"B-TI 16 must equal CFL's total carried forward.");
      Dd(26,+FS.ReturnFileSec!==12||!(N(Scur("TotalSTCGPTILossCF"))+N(Scur("TotalLTCGPTILossCF"))),"A belated return under 139(4) cannot carry forward current-year capital losses.");}}
  /* ---------- Deductions: VI-A and the sub-schedules ---------- */
  if(I.ScheduleVIA){const U=I.ScheduleVIA.UsrDeductUndChapVIA||{},Dn=I.ScheduleVIA.DeductUndChapVIA||{};
    const OLDONLY=["Section80C","Section80CCC","Section80CCDEmployeeOrSE","Section80CCD1B","Section80D","Section80DD","Section80DDB","Section80E","Section80EE","Section80EEA","Section80EEB","Section80G","Section80GG","Section80GGA","Section80GGC","Section80QQB","Section80RRB","Section80TTA","Section80TTB","Section80U"];
    A(342,!newR||OLDONLY.every(k=>!N(Dn[k])),"New regime — only 80CCD(2) and 80CCH may be claimed.");A(350,!newR||!N(Dn.AnyOthSec80CCH)||false,"");
    A(330,N(Dn.TotalChapVIADeductions)<=N(ti.GrossTotalIncome),"Chapter VI-A cannot exceed gross total income.");
    A(509,REQ(ti.DeductionsUnderScheduleVIA,Math.min(N(Dn.TotalChapVIADeductions),Math.max(0,N(ti.GrossTotalIncome)-N(ti.IncChargeTaxSplRate111A112)))),"B-TI 11 must be the lower of VI-A total and 9 − 10.");
    A(332,REQ(Dn.TotalChapVIADeductions,Object.keys(Dn).filter(k=>k!=="TotalChapVIADeductions").reduce((a,k)=>a+N(Dn[k]),0)),"VI-A total must equal its lines.");
    Object.keys(Dn).forEach(k=>{if(k!=="TotalChapVIADeductions")A(666,N(Dn[k])<=N(U[k]||0)+1,"VI-A "+k+": the eligible amount cannot exceed the amount claimed.");});
    A(346,N(Dn.Section80C)+N(Dn.Section80CCC)+N(Dn.Section80CCDEmployeeOrSE)<=150000,"80C + 80CCC + 80CCD(1) cannot exceed ₹1,50,000.");
    [["Section80CCDEmployeeOrSE",317],["Section80CCD1B",318],["Section80CCDEmployer",319],["Section80E",320],["Section80EE",321],["Section80U",324],["Section80EEA",325],["Section80EEB",326]].forEach(([k,n])=>A(n,!huf||!N(Dn[k]),"An HUF cannot claim "+k.replace("Section","")+"."));
    [["Section80DD",327],["Section80DDB",328],["Section80U",329],["Section80TTB",349]].forEach(([k,n])=>A(n,res==="RES"||!N(Dn[k]),"A non-resident cannot claim "+k.replace("Section","")+"."));
    A(333,(res==="RES"&&ind)||!N(Dn.Section80QQB),"80QQB is for a resident individual.");A(335,(res==="RES"&&ind)||!N(Dn.Section80RRB),"80RRB is for a resident individual.");
    A(340,!late||!N(Dn.Section80QQB),"80QQB cannot be claimed in a return filed after the due date.");A(341,!late||!N(Dn.Section80RRB),"80RRB cannot be claimed in a return filed after the due date.");
    if(I.ScheduleOS)A(337,N(Dn.Section80QQB)+N(Dn.Section80RRB)<=N(RG(I.ScheduleOS,"IncOthThanOwnRaceHorse.AnyOtherIncome"))+N(RG(I.ScheduleOS,"IncOthThanOwnRaceHorse.OthersGross")),"80QQB + 80RRB cannot exceed the royalty income offered in Schedule OS.");
    const senior=S_.C.tax&&S_.C.tax.age>=60&&res!=="NRI";A(322,newR||!senior||!N(Dn.Section80TTA),"A resident senior citizen claims 80TTB, not 80TTA.");A(323,newR||senior||!N(Dn.Section80TTB),"80TTB is for a resident senior citizen.");
    if(I.ScheduleOS){const io=I.ScheduleOS.IncOthThanOwnRaceHorse;A(343,N(Dn.Section80TTA)<=N(io.IntrstFrmSavingBank)+1,"80TTA cannot exceed savings-bank interest.");A(344,N(Dn.Section80TTB)<=N(io.IntrstFrmSavingBank)+N(io.IntrstFrmTermDeposit)+1,"80TTB cannot exceed savings and deposit interest.");}
    A(645,!(N(Dn.Section80CCDEmployeeOrSE)||N(Dn.Section80CCD1B))||(U.PRANDtls||[]).length,"PRAN is required for 80CCD(1) or 80CCD(1B).");A(756,!(U.PRANDtls||[]).length||N(Dn.Section80CCDEmployeeOrSE)||N(Dn.Section80CCD1B),"A PRAN is given but nothing is claimed under 80CCD(1) or (1B).");
    A(758,!N(U.Section80CCC)||(U.PensionContribution80CCC||[]).length,"80CCC needs at least one identifier row.");A(693,!N(U.Section80CCC)||REQ(U.Section80CCC,RSUM(U.PensionContribution80CCC||[],"Amount")),"80CCC identifier rows must add to the amount claimed.");
    A(646,!N(Dn.Section80GG)||U.Form10BAAckNum,"80GG needs the Form 10BA acknowledgement.");A(647,!N(Dn.Section80DDB)||U.NameOfSpecDisease80DDB,"80DDB needs the specified disease.");
    A(648,!N(Dn.Section80QQB)||U.Form10CCDAckNum,"80QQB needs the Form 10CCD acknowledgement.");A(649,!N(Dn.Section80RRB)||U.Form10CCEAckNum,"80RRB needs the Form 10CCE acknowledgement.");
    A(52,!N(Dn.Section80GG)||!RSUM(RG(I,"ScheduleS.AllwncExemptUs10.AllwncExemptUs10Dtls",[]).filter(a=>a.SalNatureDesc==="10(13A)"),"SalOthAmount")||N(Dn.Section80GG)<=55000,"With HRA under 10(13A), 80GG is limited to ₹55,000.");
    if(I.ScheduleS){const emps=I.ScheduleS.Salaries||[];const basicDA=RSUM(emps,e=>RSUM(RG(e,"Salarys.NatureOfSalary.OthersIncDtls",[]).filter(x=>x.NatureDesc==="1"||x.NatureDesc==="2"),"OthAmount"));const govt=emps.some(e=>e.NatureOfEmployment==="CG"||e.NatureOfEmployment==="SG");
      A(newR?598:(govt?339:345),N(Dn.Section80CCDEmployer)<=Math.round(basicDA*(govt||newR?0.14:0.10))+1,"80CCD(2) is limited to "+(govt||newR?"14%":"10%")+" of basic + DA.");
      A(348,N(Dn.Section80CCDEmployeeOrSE)<=Math.round(basicDA?basicDA*0.10:N(ti.GrossTotalIncome)*0.20)+1,"80CCD(1) is limited to 10% of salary, or 20% of GTI without salary.");
      A(338,!N(Dn.Section80CCDEmployer)||emps.some(e=>!/PE$/.test(e.NatureOfEmployment)),"80CCD(2) cannot be claimed where every employer is a pensioner category.");
      A(347,N(Dn.AnyOthSec80CCH)<=Math.round(basicDA*0.60)+1,"80CCH is limited to 60% of salary.");}
    /* the sub-schedules */
    A(302,!N(Dn.Section80D)||!!I.Schedule80D,"80D is claimed — Schedule 80D must be filled.");A(303,!I.Schedule80D||REQ(Dn.Section80D,RG(I,"Schedule80D.Sec80DSelfFamSrCtznHealth.EligibleAmountOfDedn")),"80D in VI-A must equal the eligible amount in Schedule 80D.");
    A(304,!newR||!I.Schedule80D,"New regime — Schedule 80D must not be filed.");A(289,!newR||!I.Schedule80G,"New regime — Schedule 80G must be blank.");A(315,!newR||!I.Schedule80GGA,"New regime — Schedule 80GGA must be blank.");
    A(314,!N(Dn.Section80GGA)||!!I.Schedule80GGA,"80GGA is claimed — Schedule 80GGA must be filled.");A(331,!I.Schedule80GGA||REQ(U.Section80GGA,I.Schedule80GGA.TotalEligibleDonationAmt80GGA),"80GGA in VI-A must equal Schedule 80GGA.");
    A(288,!I.Schedule80G||N(Dn.Section80G)<=N(I.Schedule80G.TotalEligibleDonationsUs80G)+1,"80G cannot exceed the eligible donations in Schedule 80G.");
    A(643,!N(U.Section80C)||!I.Schedule80C||REQ(U.Section80C,I.Schedule80C.TotalAmt),"80C in VI-A must equal Schedule 80C.");A(642,!N(U.Section80C)||!!I.Schedule80C,"80C needs its items in Schedule 80C.");
    [["Section80E","Schedule80E","TotalInterest80E",631,623],["Section80EE","Schedule80EE","TotalInterest80EE",632,624],["Section80EEA","Schedule80EEA","TotalInterest80EEA",633,626],["Section80EEB","Schedule80EEB","TotalInterest80EEB",634,629]].forEach(([k,blk,tk,n,n2])=>{A(n2,!N(U[k])||!!I[blk],k.replace("Section","")+" needs its loan details.");A(n,!I[blk]||REQ(U[k],I[blk][tk]),k.replace("Section","")+" in VI-A must equal its schedule's total.");});
    A(759,!(N(Dn.Section80EE)&&N(Dn.Section80EEA)),"80EE and 80EEA cannot both be claimed.");
    A(362,!N(Dn.Section80U)||(I.Schedule80U&&REQ(I.Schedule80U.DeductionAmount,Dn.Section80U)),"80U needs Schedule 80U with the same amount.");A(364,!N(Dn.Section80DD)||(I.Schedule80DD&&REQ(I.Schedule80DD.DeductionAmount,Dn.Section80DD)),"80DD needs Schedule 80DD with the same amount.");
    if(I.Schedule80U&&!newR){const u=I.Schedule80U;A(u.NatureOfDisability==="2"?361:358,N(u.DeductionAmount)<=(u.NatureOfDisability==="2"?125000:75000),"80U is ₹75,000, or ₹1,25,000 for a severe disability.");}
    if(I.Schedule80DD&&!newR){const u=I.Schedule80DD;A(u.NatureOfDisability==="2"?360:359,N(u.DeductionAmount)<=(u.NatureOfDisability==="2"?125000:75000),"80DD is ₹75,000, or ₹1,25,000 for a severe disability.");A(548,!huf||u.DependentType==="8","An HUF's 80DD dependant must be a member of the HUF.");}
    A(640,!huf||!(I.Schedule80E||I.Schedule80EE||I.Schedule80EEA||I.Schedule80EEB),"An HUF cannot file the 80E family of schedules.");
    A(641,!newR||!(I.Schedule80C||I.Schedule80E||I.Schedule80EE||I.Schedule80EEA||I.Schedule80EEB||I.Schedule80D||I.Schedule80DD||I.Schedule80U||I.Schedule80GGC),"New regime — the deduction sub-schedules must not be filed.");}
  if(I.Schedule80D){const d=I.Schedule80D.Sec80DSelfFamSrCtznHealth||{};const sum=(...k)=>k.reduce((a,x)=>a+N(d[x]),0);
    A(292,!d.SelfAndFamily||REQ(d.SelfAndFamily,Math.min(25000,sum("HealthInsPremSlfFam","PrevHlthChckUpSlfFam"))),"80D 1a must be i + ii (within ₹25,000).");A(291,N(d.SelfAndFamily)<=25000,"80D 1a is limited to ₹25,000.");
    A(295,!d.SelfAndFamilySeniorCitizen||REQ(d.SelfAndFamilySeniorCitizen,Math.min(50000,sum("HlthInsPremSlfFamSrCtzn","PrevHlthChckUpSlfFamSrCtzn","MedicalExpSlfFamSrCtzn"))),"80D 1b must be i + ii + iii (within ₹50,000).");A(294,N(d.SelfAndFamilySeniorCitizen)<=50000,"80D 1b is limited to ₹50,000.");
    A(297,!d.Parents||REQ(d.Parents,Math.min(25000,sum("HlthInsPremParents","PrevHlthChckUpParents"))),"80D 2a must be i + ii (within ₹25,000).");A(296,N(d.Parents)<=25000,"80D 2a is limited to ₹25,000.");
    A(299,!d.ParentsSeniorCitizen||REQ(d.ParentsSeniorCitizen,Math.min(50000,sum("HlthInsPremParentsSrCtzn","PrevHlthChckUpParentsSrCtzn","MedicalExpParentsSrCtzn"))),"80D 2b must be i + ii + iii (within ₹50,000).");A(298,N(d.ParentsSeniorCitizen)<=50000,"80D 2b is limited to ₹50,000.");
    A(293,sum("PrevHlthChckUpSlfFam","PrevHlthChckUpSlfFamSrCtzn","PrevHlthChckUpParents","PrevHlthChckUpParentsSrCtzn")<=5000,"80D preventive check-up is limited to ₹5,000 in all.");
    A(301,REQ(d.EligibleAmountOfDedn,sum("SelfAndFamily","SelfAndFamilySeniorCitizen","Parents","ParentsSeniorCitizen")),"80D 3 must be 1a + 1b + 2a + 2b.");A(300,N(d.EligibleAmountOfDedn)<=100000,"80D is limited to ₹1,00,000.");
    A(592,!huf||!N(d.Parents)&&!N(d.ParentsSeniorCitizen),"An HUF has no parents block in 80D.");
    [["HealthInsPremSlfFam","Sec80DSelfFamHIDtls",611,615],["HlthInsPremSlfFamSrCtzn","Sec80DSelfFamSrCtznHIDtls",612,616],["HlthInsPremParents","Sec80DParentsHIDtls",613,617],["HlthInsPremParentsSrCtzn","Sec80DParentsSrCtznHIDtls",614,618]].forEach(([amt,dk,n1,n2])=>{if(!N(d[amt]))return;const rows=RG(d,dk+".Sch80DInsDtls",[]);A(n1,rows.length&&rows.every(r=>r.InsurerName&&r.PolicyNo),"80D "+amt+": insurer and policy number are required.");A(n2,REQ(d[amt],RSUM(rows,"HealthInsAmt")),"80D "+amt+": the policy rows must add to the premium.");});}
  if(I.Schedule80G){const G=I.Schedule80G;let all=[];[["Don100Percent",279,283,687],["Don50PercentNoApprReqd",280,284,688],["Don100PercentApprReqd",281,285,689],["Don50PercentApprReqd",282,286,690]].forEach(([k,nCash,nTot,nDet])=>{const b=G[k];if(!b)return;const rows=b.DoneeWithPan||[];all=all.concat(rows);
      rows.forEach(r=>{A(nTot,REQ(r.DonationAmt,N(r.DonationAmtCash)+N(r.DonationAmtOtherMode)),"80G "+k+": total must be cash + other mode.");A(nCash,N(r.DonationAmtCash)<=2000||N(r.EligibleDonationAmt)<=N(r.DonationAmtOtherMode),"80G "+k+": cash above ₹2,000 earns no deduction.");A(nDet,!N(r.DonationAmtOtherMode)||(r.TransactionRefNum&&r.IFSCCode),"80G "+k+": an other-mode donation needs the transaction reference and IFSC.");A(696,r.DoneePAN&&r.DoneePAN!=="AAAAA0000A","80G "+k+": the donee's PAN is mandatory.");A(277,r.DoneePAN!==PI.PAN,"80G: the donee's PAN cannot be your own.");});});
    A(287,REQ(G.TotalDonationsUs80G,RSUM(all,"DonationAmt")),"80G (E) must be A + B + C + D.");const pans=all.map(r=>r.DoneePAN);A(290,new Set(pans).size===pans.length,"80G: the same donee PAN cannot appear in two blocks.");}
  if(I.Schedule80GGA){const rows=I.Schedule80GGA.DonationDtlsSciRsrchRuralDev||[];rows.forEach(r=>{A(311,REQ(r.DonationAmt,N(r.DonationAmtCash)+N(r.DonationAmtOtherMode)),"80GGA: total must be cash + other mode.");A(316,N(r.DonationAmtCash)<=2000||N(r.EligibleDonationAmt)<=N(r.DonationAmtOtherMode),"80GGA: cash above ₹2,000 earns no deduction.");A(313,r.DoneePAN!==PI.PAN,"80GGA: the donee's PAN cannot be your own.");});A(312,REQ(I.Schedule80GGA.TotalDonationsUs80GGA,RSUM(rows,"DonationAmt")),"80GGA total must equal its rows.");}
  if(I.Schedule80GGC){const rows=I.Schedule80GGC.Schedule80GGCDetails||[];rows.forEach(r=>{A(353,REQ(r.DonationAmt,N(r.DonationAmtCash)+N(r.DonationAmtOtherMode)),"80GGC: total must be cash + other mode.");A(352,N(r.EligibleDonationAmt)<=N(r.DonationAmtOtherMode),"80GGC: only the other-mode part is eligible.");A(356,!N(r.DonationAmt)||r.DonationDate,"80GGC: the date is required.");A(547,!r.DonationDate||(r.DonationDate>="2025-04-01"&&r.DonationDate<="2026-03-31"),"80GGC: the contribution must fall in FY 2025-26.");A(357,!N(r.DonationAmtOtherMode)||(r.TransactionRefNum||r.IFSCCode),"80GGC: an other-mode contribution needs its details.");A(697,r.PoliticalPartyName&&r.PoliticalPartyPAN,"80GGC: the party's name and PAN are required.");});
    A(355,REQ(I.Schedule80GGC.TotalDonationsUs80GGC,RSUM(rows,"DonationAmt")),"80GGC totals must equal the rows.");}
  [["Schedule80E","Schedule80EDtls","Interest80E","TotalInterest80E",635],["Schedule80EE","Schedule80EEDtls","Interest80EE","TotalInterest80EE",636],["Schedule80EEA","Schedule80EEADtls","Interest80EEA","TotalInterest80EEA",637],["Schedule80EEB","Schedule80EEBDtls","Interest80EEB","TotalInterest80EEB",638]].forEach(([blk,dk,ik,tk,n])=>{if(!I[blk])return;A(n,REQ(I[blk][tk],RSUM(I[blk][dk]||[],ik)),blk+": the total must equal its rows.");});
  if(I.Schedule80EE){(I.Schedule80EE.Schedule80EEDtls||[]).forEach(r=>{A(625,N(r.TotalLoanAmt)<=3500000,"80EE: the loan cannot exceed ₹35 lakh.");A(639,r.DateofLoan>="2016-04-01"&&r.DateofLoan<="2017-03-31","80EE: the loan must be sanctioned in FY 2016-17.");});}
  if(I.Schedule80EEA){A(627,N(I.Schedule80EEA.PropStmpDtyVal)<=4500000,"80EEA: the stamp-duty value cannot exceed ₹45 lakh.");(I.Schedule80EEA.Schedule80EEADtls||[]).forEach(r=>A(628,r.DateofLoan>="2019-04-01"&&r.DateofLoan<="2022-03-31","80EEA: the loan must be sanctioned between 1 April 2019 and 31 March 2022."));}
  if(I.Schedule80EEB)(I.Schedule80EEB.Schedule80EEBDtls||[]).forEach(r=>A(630,r.DateofLoan>="2019-04-01"&&r.DateofLoan<="2023-03-31","80EEB: the loan must be sanctioned between 1 April 2019 and 31 March 2023."));
  if(I.ScheduleHP&&(I.Schedule80EE||I.Schedule80EEA)){const hp=[];(I.ScheduleHP.PropertyDetails||[]).forEach(p=>RG(p,"Rentdetails.Section24B.Section24BDtls",[]).forEach(l=>hp.push(l.BankOrInstnName+"|"+l.LoanAccNoOfBankOrInstnRefNo)));
    (RG(I,"Schedule80EE.Schedule80EEDtls",[])).forEach(r=>A(621,hp.indexOf(r.BankOrInstnName+"|"+r.LoanAccNoOfBankOrInstnRefNo)>=0,"80EE: the loan must also appear in a 24(b) table of Schedule HP."));
    (RG(I,"Schedule80EEA.Schedule80EEADtls",[])).forEach(r=>A(622,hp.indexOf(r.BankOrInstnName+"|"+r.LoanAccNoOfBankOrInstnRefNo)>=0,"80EEA: the loan must also appear in a 24(b) table of Schedule HP."));}
  /* ---------- Schedule SI ---------- */
  if(I.ScheduleSI){const si=I.ScheduleSI,rows=si.SplCodeRateTax||[];const byCode=c=>RSUM(rows.filter(r=>r.SecCode===c),"SplRateInc");
    A(376,REQ(si.TotSplRateInc,RSUM(rows,"SplRateInc")),"SI total (i) must equal its rows.");A(377,REQ(si.TotSplRateIncTax,RSUM(rows,"SplRateIncTax")),"SI total (ii) must equal its rows.");
    rows.forEach(r=>{A(373,!N(r.SplRateInc)||N(r.SplRateIncTax)>=0,"SI: tax cannot be null where income is positive.");});
    if(I.ScheduleOS){const io=I.ScheduleOS.IncOthThanOwnRaceHorse;A(369,REQ(byCode("5BB"),N(io.LtryPzzlChrgblUs115BB)-RSUM(RG(io,"IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS",[]).filter(x=>x.NatureOfIncome==="2ai"),"DTAAamt")),"SI 115BB must equal OS 2a(i) less its DTAA part.");
      A(418,REQ(byCode("5BBJ"),N(io.IncChrgblUs115BBJ)),"SI 115BBJ must equal OS 2a(ii).");A(370,REQ(byCode("5BBE"),N(io.IncChrgblUs115BBE)),"SI 115BBE must equal OS 2b.");A(366,REQ(byCode("1"),N(RG(io,"TaxAccumulatedBalRecPF.TotalIncomeBenefit"))),"SI row 1 must equal OS 2c.");
      (io.OthersGrossDtls||[]).forEach(x=>A(412,REQ(byCode(x.SourceDescription),RSUM((io.OthersGrossDtls||[]).filter(y=>y.SourceDescription===x.SourceDescription),"SourceAmount")),"SI: "+x.SourceDescription+" must equal the same nature in OS 2d."));
      (io.PTIOthersGrossDtls||[]).forEach(x=>A(413,REQ(byCode(x.SourceDescription),RSUM((io.PTIOthersGrossDtls||[]).filter(y=>y.SourceDescription===x.SourceDescription),"SourceAmount")),"SI: "+x.SourceDescription+" must equal the same nature in OS 2e."));}
    if(I.ScheduleBFLA){const bf=I.ScheduleBFLA,af=k=>N(RG(bf,k+".IncBFLA.IncOfCurYrAfterSetOffBFLosses"));
      A(581,REQ(byCode("1A")+byCode("5AD1biip")+byCode("PTI_STCG20P"),af("STCG20Per")),"SI 111A + 115AD proviso + PTI 20% must equal BFLA 3(iii).");
      A(375,REQ(byCode("5ADii")+byCode("PTI_STCG30P"),af("STCG30Per")),"SI 115AD + PTI 30% must equal BFLA 3(iv).");
      A(585,REQ(["22","21ciii","5AC1c","5ACA1b","5Eb","21","2A","5ADiiiP","5ADiii","PTI_LTCG12_5P112A","PTI_LTCG12_5P"].reduce((a,c)=>a+byCode(c),0),af("LTCG12_5Per")),"SI long-term 12.5% rows must equal BFLA 3(vii).");
      A(371,REQ(byCode("DTAAOS"),af("IncOSDTAA")),"SI DTAA other-sources must equal BFLA 3(xi).");}
    A(374,REQ(ti.IncChargeTaxSplRate111A112,si.TotSplRateInc),"B-TI 10 must equal SI's total income.");}
  else A(368,!N(RG(CTL,"TaxPayableOnTI.TaxAtSpecialRates")),"No special-rate income — no tax at special rates.");
  /* ---------- AMT / AMTC ---------- */
  if(I.ScheduleAMT){const am=I.ScheduleAMT;A(430,!newR,"New regime — Schedule AMT must be blank.");A(419,REQ(am.TotalIncItemPartBTI,ti.TotalIncome),"AMT 1 must equal B-TI 12.");A(420,REQ(am.AdjustedUnderSec115JC,N(am.TotalIncItemPartBTI)+N(am.DeductionClaimUndrAnySec)),"AMT 3 must be 1 + 2a.");
    A(421,REQ(am.DeductionClaimUndrAnySec,N(RG(I,"ScheduleVIA.DeductUndChapVIA.Section80QQB"))+N(RG(I,"ScheduleVIA.DeductUndChapVIA.Section80RRB"))),"AMT 2a must equal 80QQB + 80RRB as allowed.");
    A(428,REQ(am.TaxPayableUnderSec115JC,N(am.AdjustedUnderSec115JC)>2000000?Math.round(N(am.AdjustedUnderSec115JC)*0.185):0),"AMT 4 must be 18.5% of 3 where 3 exceeds ₹20 lakh.");A(517,REQ(tti.TaxPayDeemedTotIncUs115JC,am.TaxPayableUnderSec115JC),"B-TTI 1a must equal AMT 4.");}
  A(543,!newR||!N(tti.TotalTaxPayablDeemedTotInc),"New regime — B-TTI 1a to 1d must be nil.");
  A(522,newR||REQ(tti.TotalTaxPayablDeemedTotInc,N(tti.TaxPayDeemedTotIncUs115JC)+N(tti.Surcharge)+N(tti.HealthEduCess)),"B-TTI 1d must be 1a + 1b + 1c.");
  if(I.ScheduleAMTC){const ac=I.ScheduleAMTC;A(422,REQ(ac.TaxSection115JC,tti.TotalTaxPayablDeemedTotInc),"AMTC 1 must equal B-TTI 1d.");A(423,newR||REQ(ac.TaxOthProvisions,CTL.GrossTaxLiability),"AMTC 2 must equal B-TTI 7.");
    A(424,REQ(ac.AmtTaxCreditAvailable,Math.max(0,N(ac.TaxOthProvisions)-N(ac.TaxSection115JC))),"AMTC 3 must be 2 − 1, nil if 2 ≤ 1.");A(431,!newR||!(N(ac.TotAmtCreditUtilisedCY)||N(ac.TotBalAMTCreditCF)),"New regime — AMTC columns C and D must be nil.");
    A(426,REQ(ac.TaxSection115JD,ac.TotAmtCreditUtilisedCY),"AMTC 5 must equal the total of column C.");A(427,REQ(ac.AmtLiabilityAvailable,ac.TotBalAMTCreditCF),"AMTC 6 must equal the total of column D.");
    (ac.ScheduleAMTCDtls||[]).forEach(r=>A(429,REQ(r.BalAmtCreditCarryFwd,N(r.AmtCreditBalBroughtFwd)-N(r.AmtCreditUtilized)),"AMTC "+r.AssYr+": column D must be B3 − C."));A(518,REQ(CTL.CreditUS115JD,ac.TaxSection115JD),"B-TTI 9 must equal AMTC 5.");}
  /* ---------- EI ---------- */
  if(I.ScheduleEI){const e=I.ScheduleEI;A(436,REQ(e.NetAgriIncOrOthrIncRule7,Math.max(0,N(e.GrossAgriRecpt)-N(e.ExpIncAgri)-N(e.UnabAgriLossPrev8))),"EI net agricultural income must be receipts − expenditure − unabsorbed loss.");
    A(445,N(e.NetAgriIncOrOthrIncRule7)<=500000||RG(e,"ExcNetAgriInc.ExcNetAgriIncDtls",[]).length,"EI: net agricultural income over ₹5 lakh needs the land details.");
    A(433,REQ(e.Others,RSUM(RG(e,"OthersInc.OthersIncDtls",[]),"OthAmount")),"EI other exempt income must equal its rows.");A(434,REQ(e.IncNotChrgblToTax,RSUM(RG(e,"IncNotChrgblAsPerDTAA.IncNotChrgblAsPerDTAADtls",[]),"AmountOfIncome")),"EI DTAA total must equal its rows.");
    A(435,REQ(e.TotalExemptInc,N(e.InterestInc)+N(e.NetAgriIncOrOthrIncRule7)+N(e.Others)+N(e.IncNotChrgblToTax)+N(e.PassThrIncNotChrgblTax)),"EI 6 must be 1 + 2 + 3 + 4 + 5.");
    const subs=RG(e,"OthersInc.OthersIncDtls",[]).map(r=>r.SubCategory).filter(s=>s&&s!=="OTH");A(698,new Set(subs).size===subs.length,"EI: an exempt-income sub-category cannot be selected twice.");
    if(I.SchedulePTI)A(432,REQ(e.PassThrIncNotChrgblTax,RSUM(I.SchedulePTI.SchedulePTIDtls||[],b=>RG(b,"IncClmdPTI.TotalSec23FBB.NetIncomeLoss"))),"EI 5 must equal the exempt income in Schedule PTI.");
    A(508,REQ(ti.NetAgricultureIncomeOrOtherIncomeForRate,e.NetAgriIncOrOthrIncRule7),"B-TI 14 must equal EI 2.");}
  /* ---------- PTI ---------- */
  (RG(I,"SchedulePTI.SchedulePTIDtls",[])).forEach((b,i)=>{const L="PTI block "+(i+1)+": ";const c=b.CapitalGainsPTI||{},x=b.IncClmdPTI||{};
    [b.IncFromHP,c.STCG_Sec111A,c.STCG_Others,c.LTCG_Sec112A,c.LTCG_Others].forEach(o=>{if(o)A(437,REQ(o.NetIncomeLoss,N(o.AmountOfInc)-N(o.CurrYrLossShareByInvstFund)),L+"column 9 must be 7 − 8.");});
    A(438,REQ(RG(c,"ShortTermCG.AmountOfInc"),N(RG(c,"STCG_Sec111A.AmountOfInc"))+N(RG(c,"STCG_Others.AmountOfInc"))),L+"iia must be ai + aii.");A(439,REQ(RG(c,"LongTermCG.AmountOfInc"),N(RG(c,"LTCG_Sec112A.AmountOfInc"))+N(RG(c,"LTCG_Others.AmountOfInc"))),L+"iib must be bi + bii.");
    A(440,REQ(RG(b,"IncOthSrc.AmountOfInc"),N(RG(b,"OS_Dividend.AmountOfInc"))+N(RG(b,"OS_Others.AmountOfInc"))),L+"iii must be a + b.");A(441,N(RG(x,"TotalSec23FBB.AmountOfInc"))>=N(RG(x,"Sec23FBB.AmountOfInc")),L+"iv must be a + b + c.");});
  /* ---------- FSI / TR / 5A / AL ---------- */
  if(I.ScheduleFSI){A(443,res!=="NRI","Schedule FSI is not for a non-resident.");(I.ScheduleFSI.ScheduleFSIDtls||[]).forEach((b,i)=>{const L="FSI country "+(i+1)+": ";["IncFromSal","IncFromHP","IncCapGain","IncOthSrc"].forEach(k=>{const h=b[k]||{};A(442,REQ(h.TaxReliefinInd,Math.min(N(h.TaxPaidOutsideInd),N(h.TaxPayableinInd))),L+"relief must be the lower of foreign tax and Indian tax.");});
      A(444,REQ(RG(b,"TotalCountryWise.IncFrmOutsideInd"),["IncFromSal","IncFromHP","IncCapGain","IncOthSrc"].reduce((a,k)=>a+N(RG(b,k+".IncFrmOutsideInd")),0)),L+"the total must equal the four heads.");
      if(I.ScheduleS)A(446,N(RG(b,"IncFromSal.IncFrmOutsideInd"))<=N(I.ScheduleS.TotalGrossSalary)+1,L+"foreign salary cannot exceed the gross salary in Schedule S.");
      if(I.ScheduleHP)A(447,N(RG(b,"IncFromHP.IncFrmOutsideInd"))<=Math.max(0,N(I.ScheduleHP.TotalIncomeChargeableUnHP))+1,L+"foreign house-property income cannot exceed Schedule HP.");
      if(I.ScheduleCGFor23)A(448,N(RG(b,"IncCapGain.IncFrmOutsideInd"))<=Math.max(0,N(I.ScheduleCGFor23.TotScheduleCGFor23))+1,L+"foreign capital gains cannot exceed Schedule CG.");});}
  if(I.ScheduleTR1){const tr=I.ScheduleTR1;A(453,res!=="NRI","Schedule TR is not for a non-resident.");A(454,REQ(tr.TotalTaxPaidOutsideIndia,RSUM(tr.ScheduleTR||[],"TaxPaidOutsideIndia")),"TR: total tax paid must equal its rows.");A(455,REQ(tr.TotalTaxReliefOutsideIndia,RSUM(tr.ScheduleTR||[],"TaxReliefOutsideIndia")),"TR: total relief must equal its rows.");
    A(451,REQ(tr.TaxReliefOutsideIndiaDTAA,RSUM((tr.ScheduleTR||[]).filter(r=>r.ReliefClaimedUsSection!=="91"),"TaxReliefOutsideIndia")),"TR 2 must be the 90/90A rows.");A(452,REQ(tr.TaxReliefOutsideIndiaNotDTAA,RSUM((tr.ScheduleTR||[]).filter(r=>r.ReliefClaimedUsSection==="91"),"TaxReliefOutsideIndia")),"TR 3 must be the 91 rows.");
    A(526,REQ(RG(CTL,"TaxRelief.Section90"),tr.TaxReliefOutsideIndiaDTAA),"B-TTI 11b must equal TR 2.");A(527,REQ(RG(CTL,"TaxRelief.Section91"),tr.TaxReliefOutsideIndiaNotDTAA),"B-TTI 11c must equal TR 3.");
    if(I.ScheduleFSI){A(454,REQ(tr.TotalTaxPaidOutsideIndia,RSUM(I.ScheduleFSI.ScheduleFSIDtls||[],b=>RG(b,"TotalCountryWise.TaxPaidOutsideInd"))),"TR total tax paid must equal FSI column (c).");}
    Dd(3,!(N(tr.TaxReliefOutsideIndiaDTAA)+N(tr.TaxReliefOutsideIndiaNotDTAA))||true,"");if(N(tr.TaxReliefOutsideIndiaDTAA)+N(tr.TaxReliefOutsideIndiaNotDTAA))out.push({cat:"D",n:3,msg:"Relief under 90/91 is claimed — Form 67 must be filed."});}
  if(I.Schedule5A2014){const f=I.Schedule5A2014;A(449,f.PANOfSpouse&&f.PANOfSpouse!=="AAAPA0000A","5A: the spouse's PAN is required.");["IncRecvdUndHead","AmtApprndOfSpouse","AmtTDSDeducted","TDSApprndOfSpouse"].forEach(k=>A(450,REQ(RG(f,"TotalHeadIncome."+k),N(RG(f,"HPHeadIncome."+k))+N(RG(f,"CapGainHeadIncome."+k))+N(RG(f,"OtherSourcesHeadIncome."+k))),"5A: the total row must equal 1 + 2 + 3 for "+k+"."));}
  A(456,N(ti.TotalIncome)<=10000000||!!I.ScheduleAL,"Total income exceeds ₹1 crore — Schedule AL is mandatory.");
  A(746,tti.AssetOutIndiaFlag!=="YES"||!!I.ScheduleFA,"Foreign assets is Yes in B-TTI — Schedule FA must be filled.");
  /* ---------- Taxes paid ---------- */
  if(I.ScheduleTDS1){A(468,!huf||!(I.ScheduleTDS1.TDSonSalary||[]).length,"An HUF cannot have TDS on salary.");(I.ScheduleTDS1.TDSonSalary||[]).forEach(r=>{A(471,N(r.TotalTDSSal)<=N(r.IncChrgSal),"TDS 1: tax deducted cannot exceed the salary income.");A(472,!!I.ScheduleS,"TDS on salary needs Schedule S.");});}
  [["ScheduleTDS2","TDSOthThanSalaryDtls",466,479],["ScheduleTDS3","TDS3onOthThanSalDtls",467,479]].forEach(([blk,dk,nClaim,nCF])=>{(RG(I,blk+"."+dk,[])).forEach((r,i)=>{const c=r.TaxDeductCreditDtls||{},L=blk.replace("Schedule","")+" row "+(i+1)+": ";
    const avail=N(r.BroughtFwdTDSAmt)+N(c.TaxDeductedOwnHands)+N(c.TaxDeductedTDS),claimed=N(c.TaxClaimedOwnHands)+N(c.TaxClaimedTDS);
    A(nClaim,claimed<=avail+1,L+"TDS claimed cannot exceed brought forward plus deducted.");A(nCF,REQ(r.AmtCarriedFwd,Math.max(0,avail-claimed)),L+"carried forward must be 6 + 7 + 8 − 9 − 10.");
    A(462,!(N(r.BroughtFwdTDSAmt)&&(N(c.TaxDeductedOwnHands)||N(c.TaxDeductedTDS))),L+"brought-forward and current-year TDS go in separate rows.");
    A(469,r.TDSCreditName!=="O"||r.PANofOtherPerson||r.AadhaarOfOtherPerson,L+"credit relating to another person needs that person's PAN or Aadhaar.");
    A(blk==="ScheduleTDS2"?464:465,!N(c.TaxClaimedOwnHands)||(N(r.GrossAmount)>0&&r.HeadOfIncome),L+"TDS claimed needs the gross amount and head of income.");
    A(463,!N(c.TaxClaimedOwnHands)||N(c.TaxClaimedOwnHands)<=N(r.GrossAmount)+1,L+"TDS claimed cannot exceed the gross income disclosed.");
    A(650,!/^92[ABC]$/.test(r.TDSSection),L+"section 192 belongs in TDS 1, not here.");});
    if(I[blk])A(461,REQ(I[blk][blk==="ScheduleTDS2"?"TotalTDSonOthThanSals":"TotalTDS3OnOthThanSal"],RSUM(RG(I,blk+"."+dk,[]),r=>RG(r,"TaxDeductCreditDtls.TaxClaimedOwnHands"))),blk+": the total must equal the claimed-in-own-hands column.");});
  if(I.ScheduleTCS){(I.ScheduleTCS.TCS||[]).forEach((r,i)=>{const L="TCS row "+(i+1)+": ";const avail=N(r.BroughtFwdTDSAmt)+N(RG(r,"TCSCurrFYDtls.TCSAmtCollOwnHand"))+N(RG(r,"TCSCurrFYDtls.TCSAmtCollSpouseOrOthrHand")),claimed=N(RG(r,"TCSClaimedThisYearDtls.TCSAmtCollOwnHand"))+N(RG(r,"TCSClaimedThisYearDtls.TCSAmtCollSpouseOrOthrHand"));
    A(474,claimed<=avail+1,L+"TCS claimed cannot exceed brought forward plus collected.");A(478,REQ(r.AmtCarriedFwd,Math.max(0,avail-claimed)),L+"carried forward must be 5 + 6 − 7.");A(473,!(N(r.BroughtFwdTDSAmt)&&(N(RG(r,"TCSCurrFYDtls.TCSAmtCollOwnHand"))||N(RG(r,"TCSCurrFYDtls.TCSAmtCollSpouseOrOthrHand")))),L+"brought-forward and current-year TCS go in separate rows.");
    A(475,r.TCSCreditOwner!=="2"||r.PANOfSpouseOrOthrPrsn,L+"credit relating to another person needs that person's PAN.");A(477,!!r.EmployerOrDeductorOrCollectTAN,L+"the collector's TAN is required.");});
    A(461,REQ(I.ScheduleTCS.TotalSchTCS,RSUM(I.ScheduleTCS.TCS||[],r=>RG(r,"TCSClaimedThisYearDtls.TCSAmtCollOwnHand"))),"TCS total must equal the claimed-in-own-hands column.");A(460,REQ(RG(tti,"TaxPaid.TaxesPaid.TCS"),I.ScheduleTCS.TotalSchTCS),"B-TTI 15c must equal Schedule TCS.");}
  if(I.ScheduleIT){A(459,REQ(I.ScheduleIT.TotalTaxPayments,RSUM(I.ScheduleIT.TaxPayment||[],"Amt")),"IT total must equal its challans.");
    A(521,REQ(RG(tti,"TaxPaid.TaxesPaid.AdvanceTax"),RSUM((I.ScheduleIT.TaxPayment||[]).filter(c=>c.DateDep<="2026-03-31"),"Amt")),"B-TTI 15a must equal the challans dated up to 31 March 2026.");
    A(520,REQ(RG(tti,"TaxPaid.TaxesPaid.SelfAssessmentTax"),RSUM((I.ScheduleIT.TaxPayment||[]).filter(c=>c.DateDep>"2026-03-31"),"Amt")),"B-TTI 15d must equal the challans dated after 31 March 2026.");}
  A(493,REQ(RG(tti,"TaxPaid.TaxesPaid.TDS"),N(RG(I,"ScheduleTDS1.TotalTDSonSalaries"))+N(RG(I,"ScheduleTDS2.TotalTDSonOthThanSals"))+N(RG(I,"ScheduleTDS3.TotalTDS3OnOthThanSal"))),"B-TTI 15b must equal the three TDS totals.");
  /* ---------- ESOP ---------- */
  if(I.ScheduleESOP){A(546,!huf,"An HUF cannot have Schedule ESOP.");Object.keys(I.ScheduleESOP).filter(k=>k.endsWith("_Type")&&k!=="ScheduleESOP2627_Type").forEach(k=>{const b=I.ScheduleESOP[k],ev=b.ScheduleESOPEventDtls||{};
      A(480,REQ(b.BalanceTaxCF,N(b.TaxDeferredBFEarlierAY)-N(b.TaxPayableCurrentAY)),"ESOP "+b.AssessmentYear+": column 8 must be 3 − 7.");A(482,!(ev.SecurityType==="NS"&&ev.CeasedEmployee!=="Y")||!N(b.TaxPayableCurrentAY),"ESOP "+b.AssessmentYear+": not sold and not ceased — column 7 must be nil.");A(483,ev.CeasedEmployee!=="Y"||REQ(b.TaxPayableCurrentAY,b.TaxDeferredBFEarlierAY),"ESOP "+b.AssessmentYear+": ceased — the whole deferred tax falls due.");});
    const gp=CTL.GrossTaxPay||{};A(481,REQ(RG(I,"ScheduleESOP.ScheduleESOP2627_Type.BalanceTaxCF"),gp.TaxDeferred17),"ESOP sl. 8 for 2026-27 must equal B-TTI 8b.");A(545,REQ(gp.TaxDeferredPayableCY,Object.keys(I.ScheduleESOP).filter(k=>k.endsWith("_Type")).reduce((a,k)=>a+N(I.ScheduleESOP[k].TaxPayableCurrentAY),0)),"B-TTI 8c must equal ESOP column 7.");}
  /* ---------- Part B-TI / B-TTI ---------- */
  {const c=ti.CapGain||{},st=c.ShortTerm||{},lt=c.LongTerm||{};
    A(488,REQ(st.TotalShortTerm,N(st.ShortTerm20Per)+N(st.ShortTerm30Per)+N(st.ShortTermAppRate)+N(st.ShortTermSplRateDTAA)),"B-TI 3av must equal the short-term slots.");A(489,REQ(lt.TotalLongTerm,N(lt.LongTerm12_5Per)+N(lt.LongTermSplRateDTAA)),"B-TI 3biii must equal the long-term slots.");
    A(490,REQ(c.ShortTermLongTermTotal,N(st.TotalShortTerm)+N(lt.TotalLongTerm)),"B-TI 3c must be 3av + 3biii.");A(515,REQ(c.TotalCapGains,N(c.ShortTermLongTermTotal)+N(c.CapGains30Per115BBH)),"B-TI 3e must be 3c + 3d.");
    if(I.ScheduleCGFor23)A(514,REQ(c.CapGains30Per115BBH,I.ScheduleCGFor23.IncmFromVDATrnsf),"B-TI 3d must equal CG C2.");
    const o=ti.IncFromOS||{};A(491,REQ(o.TotIncFromOS,N(o.OtherSrcThanOwnRaceHorse)+N(o.IncChargblSplRate)+N(o.FromOwnRaceHorse)),"B-TI 4d must be 4a + 4b + 4c.");
    A(492,REQ(ti.TotalTI,N(ti.Salaries)+N(ti.IncomeFromHP)+N(c.TotalCapGains)+N(o.TotIncFromOS)),"B-TI 5 must equal the four heads.");
    if(I.ScheduleS)A(494,REQ(ti.Salaries,I.ScheduleS.TotIncUnderHeadSalaries),"B-TI 1 must equal Schedule S.");if(I.ScheduleHP)A(495,REQ(ti.IncomeFromHP,Math.max(0,N(I.ScheduleHP.TotalIncomeChargeableUnHP))),"B-TI 2 must equal Schedule HP (nil if loss).");
    if(I.ScheduleCGFor23){const E=I.ScheduleCGFor23.CurrYrLosses||{},e8=k=>N(RG(E,k+".CurrYrCapGain"));A(565,REQ(st.ShortTerm20Per,e8("InStcg20Per")),"B-TI 3ai must equal Table E 8ii.");A(496,REQ(st.ShortTerm30Per,e8("InStcg30Per")),"B-TI 3aii must equal Table E 8iii.");A(497,REQ(st.ShortTermAppRate,e8("InStcgAppRate")),"B-TI 3aiii must equal Table E 8iv.");A(498,REQ(st.ShortTermSplRateDTAA,e8("InStcgDTAARate")),"B-TI 3aiv must equal Table E 8v.");A(566,REQ(lt.LongTerm12_5Per,e8("InLtcg12_5Per")),"B-TI 3bi must equal Table E 8vi.");A(499,REQ(lt.LongTermSplRateDTAA,e8("InLtcgDTAARate")),"B-TI 3bii must equal Table E 8vii.");}
    if(I.ScheduleOS){const io=I.ScheduleOS.IncOthThanOwnRaceHorse;A(500,REQ(o.OtherSrcThanOwnRaceHorse,Math.max(0,N(io.BalanceNoRaceHorse))),"B-TI 4a must equal OS 6.");A(502,REQ(o.FromOwnRaceHorse,Math.max(0,N(RG(I.ScheduleOS,"IncFromOwnHorse.BalanceOwnRaceHorse")))),"B-TI 4c must equal OS 8e.");}
    if(I.ScheduleCYLA)A(503,REQ(ti.CurrentYearLoss,N(RG(I.ScheduleCYLA,"TotalLossSetOff.TotHPlossCurYrSetoff"))+N(RG(I.ScheduleCYLA,"TotalLossSetOff.TotOthSrcLossNoRaceHorseSetoff"))),"B-TI 6 must equal CYLA's total set-off.");
    if(I.ScheduleBFLA)A(504,REQ(ti.BroughtFwdLossesSetoff,RG(I.ScheduleBFLA,"TotalBFLossSetOff.TotBFLossSetoff")),"B-TI 8 must equal BFLA 2xii.");
    A(510,REQ(ti.BalanceAfterSetoffLosses,N(ti.TotalTI)-N(ti.CurrentYearLoss)),"B-TI 7 must be 5 − 6.");A(505,REQ(ti.GrossTotalIncome,N(ti.TotalTI)-N(ti.CurrentYearLoss)-N(ti.BroughtFwdLossesSetoff)),"B-TI 9 must be 5 − 6 − 8.");
    A(506,REQ(ti.TotalIncome,Math.round(Math.max(0,N(ti.GrossTotalIncome)-N(ti.DeductionsUnderScheduleVIA))/10)*10,10),"B-TI 12 must be 9 − 11, rounded to ten.");A(507,!N(ti.DeductionsUnderScheduleVIA)||!!I.ScheduleVIA,"Deductions in B-TI need Schedule VI-A.");
    A(512,!N(ti.AggregateIncome)||REQ(ti.AggregateIncome,N(ti.TotalIncome)-N(ti.IncChargeableTaxSplRates)+N(ti.NetAgricultureIncomeOrOtherIncomeForRate)),"B-TI 15 must be 12 − 13 + 14.");
    if(I.ScheduleAMT)A(511,REQ(ti.DeemedIncomeUs115JC,I.ScheduleAMT.AdjustedUnderSec115JC),"B-TI 17 must equal AMT 3.");
    /* B-TTI */
    const T=CTL.TaxPayableOnTI||{};A(523,REQ(T.TaxPayableOnTotInc,Math.max(0,N(T.TaxAtNormalRatesOnAggrInc)+N(T.TaxAtSpecialRates)-N(T.RebateOnAgriInc))),"B-TTI 2d must be 2a + 2b − 2c.");
    A(524,REQ(CTL.TaxPayableOnRebate,Math.max(0,N(T.TaxPayableOnTotInc)-N(CTL.Rebate87A))),"B-TTI 4 must be 2d − 3.");A(525,REQ(CTL.GrossTaxLiability,N(CTL.TaxPayableOnRebate)+N(CTL.TotalSurcharge)+N(CTL.EducationCess)),"B-TTI 7 must be 4 + 5 + 6.");
    A(539,REQ(CTL.GrossTaxPayable,Math.max(N(CTL.GrossTaxLiability),N(tti.TotalTaxPayablDeemedTotInc))),"B-TTI 8 must be the higher of 1d and 7.");
    const gp=CTL.GrossTaxPay||{};A(544,REQ(N(gp.TaxInc17)+N(gp.TaxDeferred17),CTL.GrossTaxPayable),"B-TTI 8a + 8b must equal 8.");A(540,REQ(CTL.TaxPayAfterCreditUs115JD,Math.max(0,N(gp.TaxInc17)+N(gp.TaxDeferredPayableCY)-N(CTL.CreditUS115JD))),"B-TTI 10 must be 8a + 8c − 9.");
    const rl=CTL.TaxRelief||{};A(528,REQ(rl.TotTaxRelief,N(rl.Section89)+N(rl.Section90)+N(rl.Section91)),"B-TTI 11d must be 11a + 11b + 11c.");A(541,REQ(CTL.NetTaxLiability,Math.max(0,N(CTL.TaxPayAfterCreditUs115JD)-N(rl.TotTaxRelief))),"B-TTI 12 must be 10 − 11d.");
    A(516,!huf||!N(rl.Section89),"An HUF cannot claim relief under 89.");A(542,!N(rl.Section89)||N(ti.Salaries)>0,"Relief under 89 needs salary income.");
    const ip=CTL.IntrstPay||{};A(529,REQ(ip.TotalIntrstPay,N(ip.IntrstPayUs234A)+N(ip.IntrstPayUs234B)+N(ip.IntrstPayUs234C)+N(ip.LateFilingFee234F)+N(ip.FeeFurnish234I)),"B-TTI 13e must be 13a + 13b + 13c + 13d + 13da.");
    A(530,REQ(CTL.AggregateTaxInterestLiability,N(CTL.NetTaxLiability)+N(ip.TotalIntrstPay)),"B-TTI 14 must be 12 + 13e.");
    const tp=RG(tti,"TaxPaid.TaxesPaid",{});A(531,REQ(tp.TotalTaxesPaid,N(tp.AdvanceTax)+N(tp.TDS)+N(tp.TCS)+N(tp.SelfAssessmentTax)),"B-TTI 15e must be 15a + 15b + 15c + 15d.");
    const bal=N(CTL.AggregateTaxInterestLiability)-N(tp.TotalTaxesPaid);A(537,REQ(RG(tti,"TaxPaid.BalTaxPayable"),Math.round(Math.max(0,bal)/10)*10,10),"B-TTI 16 must be 14 − 15e.");A(536,REQ(RG(tti,"Refund.RefundDue"),Math.round(Math.max(0,-bal)/10)*10,10),"B-TTI 17 must be 15e − 14.");
    A(533,res==="RES"||!N(CTL.Rebate87A),"A non-resident cannot claim 87A.");A(534,!huf||!N(CTL.Rebate87A),"An HUF cannot claim 87A.");A(485,newR||N(CTL.Rebate87A)<=12500,"Old regime — 87A is limited to ₹12,500.");A(535,newR||N(ti.TotalIncome)<=500000||!N(CTL.Rebate87A),"Old regime — no 87A above ₹5 lakh.");
    A(487,N(ti.GrossTotalIncome)>0||!N(CTL.GrossTaxLiability),"No tax where gross total income is nil.");
    A(694,+FS.ReturnFileSec!==17||!late||N(ip.FeeFurnish234I)===(N(ti.TotalIncome)<=500000?1000:5000)||!N(ip.FeeFurnish234I),"234-I fee for a revised return after 31 December is ₹1,000 (income up to ₹5 lakh) or ₹5,000.");
    if(N(tti.TotalTaxPayablDeemedTotInc)>N(CTL.GrossTaxLiability))out.push({cat:"D",n:1,msg:"AMT exceeds normal tax — Form 29C is mandatory."});if(N(rl.Section89))out.push({cat:"D",n:5,msg:"Relief under 89 — Form 10E must be filed."});if(N(RG(I,"ScheduleVIA.DeductUndChapVIA.Section80GG")))out.push({cat:"D",n:6,msg:"80GG — Form 10BA must be filed."});
    if((RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.OthersGrossDtls",[])).some(x=>x.SourceDescription==="5BBF"))out.push({cat:"D",n:4,msg:"Income under 115BBF — Form 3CFA must be furnished in time."});
    if(N(RG(I,"ScheduleS.Increliefus89A"))||N(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.Increliefus89AOS")))out.push({cat:"D",n:19,msg:"89A relief — Form 10EE must be filed."});
    if(N(RG(tti,"Refund.RefundDue"))>500000000&&!RG(FS,"LEIDtls.LEINumber",""))out.push({cat:"D",n:20,msg:"Refund over ₹50 crore — the LEI is mandatory."});
    if((RG(I,"ScheduleTDS2.TDSOthThanSalaryDtls",[]).concat(RG(I,"ScheduleTDS3.TDS3onOthThanSalDtls",[]))).some(r=>/^(94Q|94C|94R|94M)$/.test(r.TDSSection)))out.push({cat:"D",n:12,msg:"TDS under 194Q/194C/194R/194M points to business income — ITR-2 may not be the right form."});
    if(res==="RES"&&(RG(I,"ScheduleOS.IncOthThanOwnRaceHorse.IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS",[]).length||N(RG(I,"ScheduleCGFor23.ShortTermCapGainFor23.TotalAmtTaxUsDTAAStcg"))))out.push({cat:"D",n:8,msg:"A resident's DTAA-rate claim may not be allowed."});}

  return out;
}
