/* =====================================================================
   ITR-1 · Section "bank" — Refund bank account & Verification
   Screen order 95; compute order (corder) 95 — the last section.

   Built ONLY from books/ITR-1:
     · schema_tree.md §11 Refund (lines 37499-37606) and §12 Verification
       (lines 35155-35182)
     · enums.json  AccountType (SB/CA/CC/OD/NRO/OTH, AY26-27 codes) and
       Verification_Capacity (S/R)
     · sections.md §S10
     · skeleton.json (Refund.BankAccountDtls.AddtnlBankDetails=[] and the
       Verification block pre-seeded)

   Owns / writes on export (nobody else writes these leaves):
     · Refund.BankAccountDtls.AddtnlBankDetails[]
         { IFSCCode, BankName, BankAccountNo, AccountType, UseForRefund }
     · Verification.Declaration.{ AssesseeVerName, FatherName, AssesseeVerPAN }
     · Verification.Capacity   (enum S/R — at the Verification level, NOT under
       Declaration; matches the utility's Verification() Mid(...,1,1))
     · Verification.Place

   SEAM with the taxes-paid section (compute order 92): that section OWNS and
   exports Refund.RefundDue (IncD.RefundDue). This section NEVER writes
   RefundDue — it only renders the refund figure read-only (from S.C.paid.refund)
   for context, and fills the bank block + the Verification declaration.

   ITR-1 notes (differ from the ITR-7 reference this mirrors):
     · Refund is a TOP-LEVEL block (Refund.*), not PartB_TTI.Refund.
     · ITR-1 has NO BankDtlsFlag, NO ForeignBankDetails, NO AssetOutsideIndiaFlg.
     · AccountType list EXCLUDES CGAS (Capital Gains scheme) — six codes only.
     · Capacity is Self / Representative assessee (S/R).
     · The utility emits NO Verification.Date leaf for ITR-1 (the e-Filing
       portal stamps the signing date). The date-of-signing field is shown for
       the assessee's convenience but is NOT part of the ITR-1 JSON.
   ===================================================================== */

/* ---- account-type codes — enums.json AccountType (six codes; no CGAS) --- */
const ACCT1=[
  ["SB","Savings Account"],["CA","Current Account"],
  ["CC","Cash Credit Account"],["OD","Over draft account"],
  ["NRO","Non Resident Account"],["OTH","Other"]];
/* ---- capacity codes — enums.json Verification_Capacity (S/R) ----------- */
const VCAP1=[["S","Self"],["R","Representative assessee"]];
/* Yes/No for the "do you hold an account in India" convenience prompt */
const BFLAG1=[["Y","Yes"],["N","No"]];

/* today as DD/MM/YYYY (screen convenience only; not exported for ITR-1) */
const _verToday1=()=>{const d=new Date();
  return String(d.getDate()).padStart(2,"0")+"/"+
         String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();};

/* the refund figure computed by the taxes-paid section (display only) */
function _refundFig1(){const P=S.C.paid||{},T=S.C.tax||{};
  const v=[P.refund,P.refundDue,P.RefundDue,T.refund,T.refundDue].find(x=>x!=null);
  return v==null?0:v;}

/* ---- state (seed only when absent — never clobber shell/import) -------- */
S.bank = S.bank || [];             /* India accounts -> AddtnlBankDetails[] */
S.trp  = S.trp  || {};             /* TaxReturnPreparer (optional; only if a TRP prepared it) */
S.ver  = S.ver  || {};
if(S.ver.cap===undefined)     S.ver.cap="S";             /* Verification.Capacity */
if(S.ver.name===undefined)    S.ver.name="";             /* Declaration.AssesseeVerName */
if(S.ver.father===undefined)  S.ver.father="";           /* Declaration.FatherName */
if(S.ver.pan===undefined)     S.ver.pan="";              /* Declaration.AssesseeVerPAN */
if(S.ver.place===undefined)   S.ver.place="";            /* Verification.Place */
if(S.ver.date===undefined)    S.ver.date=_verToday1();   /* signing date — screen only */
if(S.ver.hasbank===undefined) S.ver.hasbank="Y";         /* convenience prompt only */
if(S.ver.nacc===undefined)    S.ver.nacc="";             /* guidance only, not exported */

/* helper: a genuinely-filled bank row (valid IFSC + account no + bank name) */
function _bkValid1(b){b=b||{};
  return IFSC_RE.test(st0(b.ifsc).toUpperCase())&&!!st0(b.acno)&&!!st0(b.bank);}

/* ---- engine — carries no income; publishes the account count ---------- */
function engBank(){
  const valid=(S.bank||[]).filter(_bkValid1);
  S.C.bank={
    income:0,                                 /* Bank/Verification add nothing to GTI */
    nAcc:valid.length,
    hasRefund:(S.bank||[]).some(b=>(b||{}).refund==="Y")};
}

/* ---- renderer --------------------------------------------------------- */
function secBank(){
  let h="";
  const V=S.ver||{};

  /* --- bank accounts (AddtnlBankDetails[]) --- */
  h+=sub("Bank account for the refund");
  h+=row("Do you hold a bank account in India?",sel("ver.hasbank",BFLAG1,{blank:false}),{req:1});
  h+=row("Number of accounts held at any time during the year",inp("ver.nacc",{n:1}),
    {hint:"dormant accounts excluded"});
  h+=note("Every account held at any time in the year must be reported, except a dormant one. "+
    "Tick at least one account so the refund can be credited to it.");

  h+=grid("bank",[
    {k:"ifsc",h:"IFS code of the bank",t:"txt",w:"150px",max:11,req:1},
    {k:"bank",h:"Name of the bank",t:"txt",w:"auto",max:125,req:1},
    {k:"acno",h:"Account number",t:"txt",w:"200px",max:30,req:1},
    {k:"type",h:"Type of account",t:"sel",w:"210px",req:1,opts:ACCT1},
    {k:"refund",h:"For the refund",t:"chk",w:"120px"}],
    S.bank,{min:"1000px",empty:"No account given — a refund cannot be credited.",add:"Add an account"});
  h+=note("The IFS code is eleven characters: four letters, then a zero, then six letters or digits.");

  /* --- refund figure (owned by the taxes-paid section; read-only here) --- */
  h+=row("Refund due (computed on the taxes-paid screen)",cell(_refundFig1()),
    {ref:"Refund.RefundDue",hint:"credited to the ticked account above"});

  /* --- Verification (Verification block) --- */
  h+=sub("Verification");
  h+=note("<b>I,</b> the person named below, <b>solemnly declare</b> that to the best of my knowledge "+
    "and belief the information given in this return is correct and complete and is in accordance with "+
    "the provisions of the Income-tax Act, 1961, and that I am competent to make this return and verify it.");
  h+=row("I, (full name in block letters)",inp("ver.name",{max:125}),{req:1,ref:"AssesseeVerName"});
  h+=row("Son / daughter of",inp("ver.father",{max:125}),{req:1,ref:"FatherName"});
  h+=row("PAN of the person verifying",inp("ver.pan",{max:10}),
    {req:1,ref:"AssesseeVerPAN",hint:"an individual PAN — the fourth letter must be P"});
  h+=row("Making this return in my capacity as",sel("ver.cap",VCAP1,{blank:false}),{req:1,ref:"Capacity"});
  h+=row("Place",inp("ver.place",{max:50}),{req:1,ref:"Place"});
  h+=row("Date of signing",dte("ver.date"),
    {hint:"ITR-1's JSON carries no signing-date field — the e-Filing portal stamps it"});
  if(V.cap==="R")
    h+=note("Capacity is <b>Representative assessee</b>: the representative's details and the "+
      "Secondary Address in Personal Information must be completed.","warn");

  /* --- Tax return preparer (TaxReturnPreparer — optional, only if a TRP prepared it) --- */
  h+=sub("Tax return preparer");
  h+=note("Fill this only if a Tax Return Preparer prepared the return. Leave it blank otherwise "+
    "— the TaxReturnPreparer block is then omitted.");
  h+=row("Identification number of the TRP",inp("trp.id",{max:20}),
    {ref:"TaxReturnPreparer.IdentificationNoOfTRP"});
  h+=row("Name of the TRP",inp("trp.name",{max:125}),{ref:"TaxReturnPreparer.NameOfTRP"});
  h+=row("Amount to be reimbursed by the Government to the TRP",inp("trp.reimb",{n:1}),
    {ref:"TaxReturnPreparer.ReImbFrmGov"});

  return h;
}

/* ---- export — writes ONLY the bank block + the Verification declaration - */
function expBank(j){
  const V=S.ver||{};

  /* India accounts -> AddtnlBankDetails[] (only complete rows) */
  const bk=(S.bank||[]).filter(_bkValid1);
  if(bk.length){
    if(!j.Refund) j.Refund={};
    if(!j.Refund.BankAccountDtls) j.Refund.BankAccountDtls={};
    j.Refund.BankAccountDtls.AddtnlBankDetails=bk.map(b=>({
      IFSCCode:st0(b.ifsc).toUpperCase(),
      BankName:st0(b.bank).slice(0,125),
      BankAccountNo:st0(b.acno).slice(0,30),
      AccountType:ACCT1.some(a=>a[0]===b.type)?b.type:"SB",
      UseForRefund:b.refund==="Y"?"true":"false"}));
  }
  /* NOTE: Refund.RefundDue is owned and written by the taxes-paid section. */

  /* Verification — all leaves required; always present (NA fallback). */
  put(j,"Verification.Declaration.AssesseeVerName",(sv(V.name)||"NA").slice(0,125));
  put(j,"Verification.Declaration.FatherName",(sv(V.father)||"NA").slice(0,125));
  put(j,"Verification.Declaration.AssesseeVerPAN",(sv(st0(V.pan).toUpperCase())||"AAAPA0000A"));
  put(j,"Verification.Capacity",V.cap==="R"?"R":"S");
  put(j,"Verification.Place",(sv(V.place)||"NA").slice(0,50));

  /* TaxReturnPreparer — conditional block; emitted ONLY when a TRP identification
     number is present (schema §13). Absent here (self-filed) -> block omitted (NA). */
  const T=S.trp||{};
  if(sv(T.id)){
    put(j,"TaxReturnPreparer.IdentificationNoOfTRP",sv(T.id).slice(0,20));
    put(j,"TaxReturnPreparer.NameOfTRP",(sv(T.name)||"NA").slice(0,125));
    put(j,"TaxReturnPreparer.ReImbFrmGov",n0(T.reimb));
  }
}

/* ---- import (inverse) — seeds S.bank / S.ver from a return ------------- */
function impBank(I){
  const read=[]; const g=(o,p)=>p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);
  const bk=g(I,"Refund.BankAccountDtls.AddtnlBankDetails");
  if(Array.isArray(bk)&&bk.length){
    S.bank=bk.map(b=>({
      ifsc:b.IFSCCode||"",bank:b.BankName||"",acno:b.BankAccountNo||"",
      type:ACCT1.some(a=>a[0]===b.AccountType)?b.AccountType:"SB",
      refund:b.UseForRefund==="true"?"Y":"N"}));
    read.push("bank accounts ("+S.bank.length+")");
  }
  const Vb=I&&I.Verification;
  if(Vb){
    S.ver=S.ver||{};
    if(Vb.Place)S.ver.place=Vb.Place;
    S.ver.cap=VCAP1.some(c=>c[0]===Vb.Capacity)?Vb.Capacity:(S.ver.cap||"S");
    const D=Vb.Declaration||{};
    S.ver.name  = D.AssesseeVerName||S.ver.name||"";
    S.ver.father= D.FatherName||S.ver.father||"";
    S.ver.pan   = D.AssesseeVerPAN||S.ver.pan||"";
    read.push("verification");
  }
  const T=I&&I.TaxReturnPreparer;
  if(T){
    S.trp=S.trp||{};
    if(T.IdentificationNoOfTRP!=null)S.trp.id=T.IdentificationNoOfTRP;
    if(T.NameOfTRP!=null)S.trp.name=T.NameOfTRP;
    if(T.ReImbFrmGov!=null)S.trp.reimb=T.ReImbFrmGov;
    read.push("tax return preparer");
  }
  return read;
}

/* ---- checks — the section's own screen validations -------------------- */
function chkBank(){
  const out=[]; engBank();
  const V=S.ver||{};
  const noBank=V.hasbank==="N";

  /* --- bank accounts --- */
  if(!(S.bank||[]).length){
    out.push({lvl:noBank?"warn":"err",t:"Bank account",
      m:"At least one bank account in India is needed for the refund to be credited.",sec:"bank"});
  } else {
    if(!S.bank.some(b=>b.refund==="Y"))
      out.push({lvl:"err",t:"Refund account",m:"Tick at least one account to receive the refund.",sec:"bank"});
    (S.bank||[]).forEach((b,i)=>{
      b=b||{};const n=i+1;
      const started=st0(b.ifsc)||st0(b.acno)||st0(b.bank);
      if(!started) return;
      if(!IFSC_RE.test(st0(b.ifsc).toUpperCase()))
        out.push({lvl:"err",t:"Bank row "+n,m:"The IFS code is four letters, a zero, then six letters or digits.",sec:"bank"});
      if(!st0(b.bank))out.push({lvl:"err",t:"Bank row "+n,m:"The name of the bank is required.",sec:"bank"});
      if(!st0(b.acno))out.push({lvl:"err",t:"Bank row "+n,m:"The account number is required.",sec:"bank"});
      if(!ACCT1.some(a=>a[0]===b.type))out.push({lvl:"err",t:"Bank row "+n,m:"Select the type of account.",sec:"bank"});
    });
  }

  /* --- verification --- */
  if(!st0(V.name))
    out.push({lvl:"err",t:"Verification",m:"The full name of the person verifying the return is required.",sec:"bank"});
  if(!st0(V.father))
    out.push({lvl:"err",t:"Father's name",m:"The schema makes the father's name compulsory.",sec:"bank"});
  const pan=st0(V.pan).toUpperCase();
  if(!PAN_RE.test(pan))
    out.push({lvl:"err",t:"Verifier's PAN",m:"A valid ten-character PAN of the person verifying is required.",sec:"bank"});
  else if(pan.charAt(3)!=="P")
    out.push({lvl:"warn",t:"Verifier's PAN",m:"The fourth letter of an individual's PAN should be P.",sec:"bank"});
  if(!VCAP1.some(c=>c[0]===V.cap))
    out.push({lvl:"err",t:"Capacity",m:"Select the capacity in which the return is made.",sec:"bank"});
  if(!st0(V.place))
    out.push({lvl:"err",t:"Place",m:"The place of signing is required in the verification.",sec:"bank"});

  if(!out.length){
    const n=(S.C.bank||{}).nAcc||0;
    out.push({lvl:"ok",t:"Bank and verification",
      m:"Verified by "+st0(V.name)+" as "+((VCAP1.find(c=>c[0]===V.cap)||["","Self"])[1])+
        "; "+n+" account"+(n===1?"":"s")+" reported; every check passes.",sec:"bank"});
  }
  return out;
}

/* ---- register (overrides the boot stub) ------------------------------- */
reg({id:"bank", t:"Bank & verification", ref:"Refund + Verification", f:secBank,
  s:()=>{const n=((S.C.bank||{}).nAcc)||0;
    return (n?n+" account"+(n>1?"s":""):"")+(st0((S.ver||{}).name)?(n?" · ":"")+"verified":"");},
  eng:engBank, exp:expBank, imp:impBank, chk:chkBank, order:95, corder:95});
