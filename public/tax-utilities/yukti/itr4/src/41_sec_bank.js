/* account-type codes (schema enum AccountType) */
const ACCT_P4=[["SB","Savings account"],["CA","Current account"],
  ["CC","Cash credit account"],["OD","Overdraft account"],
  ["NRO","Non-resident (ordinary) account"],["OTH","Other"]];
/* Capacity codes — Verification.Capacity enum S/R/K/P (ITR-4: P = Partner) */
const VCAP_P4=[["S","Self"],["R","Representative assessee"],
  ["K","Karta of a Hindu undivided family"],["P","Partner of a firm"]];

/* =====================================================================
   BANK — engine (order 95, last): balance/refund from liability & paid,
   plus the TaxPaid feeds. Sets S.C.int for the footer band.
   ===================================================================== */
function engBank(){
  const B={income:0};                               /* no income head here */
  const P=S.C.paid||{};
  const liab=R((S.C.tax||{}).liability||0);          /* D12 = TotTaxPlusIntrstPay */
  const paidTot=R(P.total||0);                       /* D17 = TotalTaxesPaid */
  /* I9 = ROUND(MAX(0, D12 − D17), −1); I10 = ROUND(MAX(0, D17 − D12), −1) */
  const bal=Math.max(0,liab-paidTot), ref=Math.max(0,paidTot-liab);
  B.bal=Math.round(bal/10)*10;
  B.refund=Math.round(ref/10)*10;
  B.liab=liab; B.paidTot=paidTot;
  /* the four D13–D17 feeds mirror S.C.paid for the TaxPaid export */
  B.adv=R(P.adv||0); B.sat=R(P.sat||0); B.tds=R(P.tds||0); B.tcs=R(P.tcs||0);
  /* bank-account bookkeeping */
  const valid=(S.bank||[]).filter(b=>IFSC_RE.test(st0(b.ifsc).toUpperCase())&&st0(b.acno)&&st0(b.bank));
  B.nAcc=valid.length;
  B.hasRefund=(S.bank||[]).some(b=>b.refund==="Y");
  B.trpOn=!!(st0((S.trp||{}).name)||st0((S.trp||{}).id));
  S.C.bank=B;
  /* footer contract — balance payable / refund (this section owns it, runs last) */
  S.C.int=Object.assign({},S.C.int||{},{balance:B.bal,refund:B.refund,net:liab-paidTot});
}

/* ---- BANK — renderer ----------------------------------------------- */
function secBank(){
  const B=S.C.bank||{}; let h="";

  /* D13–D19 — computed taxes-paid summary, balance / refund */
  h+=sub("Taxes paid and balance");
  h+=note("All of D13–D19 are computed — pulled from Schedule IT, TDS and TCS and from the tax computation. Amount payable and refund are mutually exclusive; both round to the nearest ₹10.");
  h+=row("D13 · Total advance tax paid (Schedule IT)",cell(B.adv),{ref:"D13"});
  h+=row("D14 · Total self-assessment tax paid (Schedule IT)",cell(B.sat),{ref:"D14"});
  h+=row("D15 · Total TDS claimed (TDS1 + TDS2(i) + TDS2(ii))",cell(B.tds),{ref:"D15"});
  h+=row("D16 · Total TCS collected (Schedule TCS)",cell(B.tcs),{ref:"D16"});
  h+=row("D17 · Total taxes paid",cell(B.paidTot),{ref:"D17",cls:"grand"});
  h+=row("Aggregate tax and interest liability (D12)",cell(B.liab),{ref:"D12"});
  h+=row("D18 · Amount payable (D12 − D17, if D12 > D17)",cell(B.bal),{ref:"D18"});
  h+=row("D19 · Refund (D17 − D12, if D17 > D12)",cell(B.refund),{ref:"D19"});

  /* D21 — refund bank accounts (Refund.BankAccountDtls) */
  h+=sub("Bank accounts");
  h+=note("Report every account held in India at any time during the year, except a dormant one. Tick the one the refund should be credited to — at least one account must be selected.");
  h+=grid("bank",[{k:"ifsc",h:"IFS code",t:"txt",w:"140px",max:11,req:1},
    {k:"bank",h:"Name of the bank",t:"txt",w:"auto",max:125,req:1},
    {k:"acno",h:"Account number",t:"txt",w:"200px",max:20,req:1},
    {k:"type",h:"Type",t:"sel",w:"200px",req:1,opts:ACCT_P4},
    {k:"refund",h:"For the refund",t:"chk",w:"120px"}],
    S.bank,{min:"980px",empty:"No account given — a refund cannot be credited.",add:"Add an account"});
  h+=note("Type the IFS code and the name of the bank fills itself.");

  /* D20 / D20(a) — reported elsewhere (owned by the Income section) */
  h+=note("Exempt income for reporting only (D20) and long-term capital gains u/s 112A not chargeable up to ₹1,25,000 (D20a) are entered under <b>Income</b>.");

  /* Verification */
  h+=sub("Verification");
  h+=note("<b>I,</b> the person named below, <b>solemnly declare</b> that to the best of my knowledge and belief the information given in this return is correct and complete and is in accordance with the provisions of the Income-tax Act, 1961, and that I am competent to make this return and verify it.");
  h+=row("I, (full name in block letters)",inp("ver.name",{max:125}),{req:1,ref:"C41"});
  h+=row("son / daughter of",inp("ver.father",{max:125}),{req:1,ref:"H41"});
  h+=row("making this return in my capacity as",sel("ver.cap",VCAP_P4,{blank:false}),{req:1,ref:"I43"});
  h+=row("holding permanent account number (PAN)",inp("ver.pan",{max:10}),{req:1,ref:"C44"});
  h+=row("Place",inp("ver.place",{max:50}),{req:1,ref:"C45"});
  h+=note("The e-Filing portal stamps the return with its own system date at submission; no date is entered here.");

  /* Tax return preparer (optional block) */
  h+=card("trp","Prepared by a tax return preparer (TRP)",
    (st0((S.trp||{}).name)?st0(S.trp.name):""),
    row("Identification number of the TRP (10 digit)",inp("trp.id",{max:10}),{req:1})+
    row("Name of the TRP",inp("trp.name",{max:125}),{req:1})+
    row("Amount to be paid to / reimbursed for the TRP",inp("trp.reimb",{n:1}),{hint:"leave blank if none"})+
    formNote("Give the TRP's identification number and name; the reimbursement is optional."));

  /* department validation rules panel + export controls */
  h+=rulesPanel();
  h+=sub("Export");
  const errs=(S.C.checks||[]).filter(c=>c.lvl==="err").length;
  h+= errs
    ? note("<b>"+errs+" thing"+(errs>1?"s":"")+" still to fix.</b> Each sits against its own section.","stop")
    : note("Every check passes. The JSON is validated against the schema skeleton before it is written. Import it into the government utility to seal and upload.","form");
  h+='<div style="padding:8px 14px;display:flex;gap:10px">'+
     '<button class="add" id="b_json2" style="height:32px;padding:0 18px;margin:0'+
     (errs?";opacity:.45":"")+'"'+(errs?" disabled":"")+'>Export the return as JSON</button>'+
     '<button class="add" id="b_save2" style="height:32px;padding:0 18px;margin:0">Save the working file</button></div>';
  return h;
}

/* =====================================================================
   BANK — export (TaxPaid, Refund, Verification, TaxReturnPreparer)
   ===================================================================== */
function expBank(j){
  const B=S.C.bank||{};

  /* TaxPaid — every leaf present even at zero */
  put(j,"TaxPaid.TaxesPaid.AdvanceTax",n0(B.adv));
  put(j,"TaxPaid.TaxesPaid.TDS",n0(B.tds));
  put(j,"TaxPaid.TaxesPaid.TCS",n0(B.tcs));
  put(j,"TaxPaid.TaxesPaid.SelfAssessmentTax",n0(B.sat));
  put(j,"TaxPaid.TaxesPaid.TotalTaxesPaid",n0(B.paidTot));
  put(j,"TaxPaid.BalTaxPayable",n0(B.bal));
  /* put() drops zero, so guarantee the required integer leaves exist */
  if(j.TaxPaid==null)j.TaxPaid={};
  if(j.TaxPaid.TaxesPaid==null)j.TaxPaid.TaxesPaid={};
  const TP=j.TaxPaid.TaxesPaid;
  ["AdvanceTax","TDS","TCS","SelfAssessmentTax","TotalTaxesPaid"].forEach(k=>{if(TP[k]==null)TP[k]=0;});
  if(j.TaxPaid.BalTaxPayable==null)j.TaxPaid.BalTaxPayable=0;

  /* Refund — RefundDue required; BankAccountDtls required object */
  if(j.Refund==null)j.Refund={};
  j.Refund.RefundDue=n0(B.refund);
  if(j.Refund.BankAccountDtls==null)j.Refund.BankAccountDtls={};
  const bk=(S.bank||[]).filter(b=>IFSC_RE.test(st0(b.ifsc).toUpperCase())&&st0(b.acno)&&st0(b.bank));
  if(bk.length)j.Refund.BankAccountDtls.AddtnlBankDetails=bk.map(b=>({
    IFSCCode:st0(b.ifsc).toUpperCase(),
    BankName:st0(b.bank).slice(0,125),
    BankAccountNo:st0(b.acno).slice(0,20),
    AccountType:ACCT_P4.some(a=>a[0]===b.type)?b.type:"SB",
    UseForRefund:b.refund==="Y"?"true":"false"}));

  /* Verification — required keys always present (no Date leaf in the schema) */
  put(j,"Verification.Declaration.AssesseeVerName",(sv(S.ver.name)||"NA").slice(0,125));
  put(j,"Verification.Declaration.FatherName",(sv(S.ver.father)||"NA").slice(0,125));
  put(j,"Verification.Declaration.AssesseeVerPAN",(sv(st0(S.ver.pan).toUpperCase())||"NA"));
  put(j,"Verification.Capacity",VCAP_P4.some(c=>c[0]===S.ver.cap)?S.ver.cap:"S");
  put(j,"Verification.Place",(sv(S.ver.place)||"NA").slice(0,50));

  /* TaxReturnPreparer — only when id + name given */
  const tp=S.trp||{};
  if(st0(tp.id)&&st0(tp.name)){
    const o={IdentificationNoOfTRP:st0(tp.id).slice(0,10),NameOfTRP:st0(tp.name).slice(0,125)};
    if(N(tp.reimb)>0)o.ReImbFrmGov=n0(tp.reimb);
    j.TaxReturnPreparer=o;
  }
}

/* ---- BANK — import (inverse) --------------------------------------- */
function impBank(I4){
  const read=[]; const g=(o,p)=>p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);
  const bk=g(I4,"Refund.BankAccountDtls.AddtnlBankDetails")||[];
  if(Array.isArray(bk)&&bk.length){
    S.bank=bk.map(b=>({ifsc:b.IFSCCode||"",bank:b.BankName||"",acno:b.BankAccountNo||"",
      type:ACCT_P4.some(a=>a[0]===b.AccountType)?b.AccountType:"SB",
      refund:b.UseForRefund==="true"?"Y":"N"}));
    read.push("bank accounts");
  }
  const V=I4.Verification;
  if(V){
    S.ver=S.ver||{};
    S.ver.name  =g(V,"Declaration.AssesseeVerName")||"";
    S.ver.father=g(V,"Declaration.FatherName")||"";
    S.ver.pan   =g(V,"Declaration.AssesseeVerPAN")||"";
    S.ver.cap   =VCAP_P4.some(c=>c[0]===V.Capacity)?V.Capacity:"S";
    S.ver.place =V.Place||"";
    read.push("verification");
  }
  if(I4.TaxReturnPreparer){
    S.trp={id:I4.TaxReturnPreparer.IdentificationNoOfTRP||"",
           name:I4.TaxReturnPreparer.NameOfTRP||"",
           reimb:nz(I4.TaxReturnPreparer.ReImbFrmGov)};
    read.push("tax return preparer");
  }
  return read;
}

/* ---- BANK — checks (regime-neutral) -------------------------------- */
function chkBank(){
  const out=[]; engBank();

  /* bank accounts — at least one, one flagged for refund */
  if(!(S.bank||[]).length)
    out.push({lvl:"err",t:"Bank account",m:"At least one bank account is needed for the refund.",sec:"bank"});
  else if(!S.bank.some(b=>b.refund==="Y"))
    out.push({lvl:"err",t:"Refund account",m:"Tick one account to receive the refund.",sec:"bank"});
  (S.bank||[]).forEach((b,i)=>{
    if(st0(b.ifsc)&&!IFSC_RE.test(st0(b.ifsc).toUpperCase()))
      out.push({lvl:"err",t:"Bank row "+(i+1),m:"The IFSC is four letters, a zero, then six characters.",sec:"bank"});
    if(st0(b.ifsc)&&!st0(b.bank))
      out.push({lvl:"err",t:"Bank row "+(i+1),m:"The name of the bank is required.",sec:"bank"});
    if(st0(b.ifsc)&&!st0(b.acno))
      out.push({lvl:"err",t:"Bank row "+(i+1),m:"The account number is required.",sec:"bank"});
  });

  /* verification (C41/H41/C44/I43/C45) */
  if(!st0(S.ver.name))
    out.push({lvl:"err",t:"Verification",m:"The full name of the person verifying the return is required.",sec:"bank"});
  if(!st0(S.ver.father))
    out.push({lvl:"err",t:"Father's name",m:"The schema makes the father's name compulsory.",sec:"bank"});
  if(!PAN_RE.test(st0(S.ver.pan).toUpperCase()))
    out.push({lvl:"err",t:"Verifier's PAN",m:"A valid ten-character PAN of the person verifying is required.",sec:"bank"});
  else if(PAN_RE.test(st0((S.pi||{}).pan).toUpperCase())&&S.ver.cap!=="R"&&
          st0(S.ver.pan).toUpperCase()!==st0(S.pi.pan).toUpperCase())
    out.push({lvl:"warn",t:"Verifier's PAN",m:"The verification PAN differs from the assessee's PAN in Part A - General; for self-filing they should match.",sec:"bank"});
  if(!VCAP_P4.some(c=>c[0]===S.ver.cap))
    out.push({lvl:"err",t:"Capacity",m:"Select the capacity in which the return is made (Self / Representative / Karta / Partner).",sec:"bank"});
  if(!st0(S.ver.place))
    out.push({lvl:"err",t:"Place",m:"The place of signing is required in the verification.",sec:"bank"});

  /* representative capacity requires the Part A representative flag */
  if(S.ver.cap==="R" && ((S.fs||{}).rep)!=="Y")
    out.push({lvl:"warn",t:"Representative assessee",m:"Capacity is Representative — 'filed by a representative assessee' in Part A - General should be Yes with the representative's details.",sec:"bank"});

  /* TRP — validate only when the optional block is in use */
  const tp=S.trp||{};
  if(st0(tp.id)||st0(tp.name)||N(tp.reimb)){
    if(!st0(tp.id))out.push({lvl:"err",t:"Tax return preparer",m:"The TRP's identification number is required when the TRP block is filled.",sec:"bank"});
    if(!st0(tp.name))out.push({lvl:"err",t:"Tax return preparer",m:"The TRP's name is required when the TRP block is filled.",sec:"bank"});
    if(N(tp.reimb)<0)out.push({lvl:"err",t:"Tax return preparer",m:"The amount reimbursed cannot be negative.",sec:"bank"});
  }

  if(!out.length)
    out.push({lvl:"ok",t:"Bank and verification",m:"Verified by "+st0(S.ver.name)+" in the capacity of "+
      ((VCAP_P4.find(c=>c[0]===S.ver.cap)||["","Self"])[1])+"; every check passes.",sec:"bank"});
  return out;
}

reg({id:"bank", t:"Bank and verification", ref:"Taxes Paid and Verification", f:secBank,
  s:()=>{const B=S.C.bank||{},n=B.nAcc||0;
    return (n?n+" account"+(n>1?"s":""):"")+(st0(S.ver.name)?(n?" · ":"")+"verified":"");},
  eng:engBank, exp:expBank, imp:impBank, chk:chkBank, order:95});
