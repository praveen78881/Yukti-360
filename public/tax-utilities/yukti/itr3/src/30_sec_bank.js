/* =====================================================================
   ITR-3 · Section "bank" — Bank and verification
   Screen ref: Verification · compute order 95 (last section).
   Owns schema blocks:
     · Verification         (Declaration + Capacity + Place + Date)
     · TaxReturnPreparer    (optional single block)
   and renders/exports the refund bank accounts that hang off the tax
   block PartB_TTI.Refund.BankAccountDtls — the tax section (order 90)
   deliberately leaves the account list to this screen (its own note:
   "Bank-account details for the refund … are entered under Bank and
   verification"), and no other builder writes AddtnlBankDetails, so this
   section fills BankDtlsFlag + AddtnlBankDetails to keep the return valid.

   Built ONLY from books/ITR-3/Verification.md (rows 4–9, r8/r10 hidden or
   note-only, not built), books/ITR-3/REGIME.md, and books/ITR-3/enums.json
   (Verification.Capacity, AccountType). Nothing on this screen is an income
   head and nothing closes on the regime — Verification/TRP/bank details are
   the same under both regimes — so S.C.bank.income = 0 and there is no
   isNew() closure (cell(0)/note) to build here.  Rules encoded from the
   book: rules.json #45 (representative→Part A flag), #40 (rep PAN = uploader
   PAN), #60/#3275 (verification PAN ≠ donee PAN in 80G/80GGA).
   ===================================================================== */

/* ---- account-type codes (schema enum AccountType; clean labels) ------ */
const ACCT_B=[["SB","Savings account"],["CA","Current account"],
  ["CC","Cash credit account"],["OD","Overdraft account"],
  ["NRO","Non-resident (ordinary) account"],
  ["CGAS","Capital Gains Accounts Scheme"],["OTH","Other"]];
/* Capacity codes — from enums.json Verification.Capacity (I6 dropdown) */
const VCAP=[["S","Self"],["R","Representative assessee"],
  ["K","Karta of a Hindu undivided family"],["A","Authorised signatory"]];

/* ---- state (seed only what is absent; never clobber shell/import) ----- */
const _verToday=()=>{const d=new Date();
  return String(d.getDate()).padStart(2,"0")+"/"+
         String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();};
S.bank = S.bank || [];              /* refund accounts → Refund.BankAccountDtls */
S.fbank = S.fbank || [];            /* foreign refund accounts → Refund.BankAccountDtls.ForeignBankDetails (non-resident, no Indian account) */
S.ver  = S.ver  || {};
if(S.ver.cap===undefined)   S.ver.cap="S";     /* Verification.Capacity (I6, default Self) */
if(S.ver.name===undefined)  S.ver.name="";     /* Declaration.AssesseeVerName (C4) */
if(S.ver.father===undefined)S.ver.father="";   /* Declaration.FatherName (I4) */
if(S.ver.pan===undefined)   S.ver.pan="";      /* Declaration.AssesseeVerPAN (C7/G7) */
if(S.ver.place===undefined) S.ver.place="";    /* Verification.Place (H9) */
if(S.ver.date===undefined)  S.ver.date=_verToday();  /* Verification.Date (J9/L9), DD/MM/YYYY on screen */
if(S.ver.nacc===undefined)  S.ver.nacc="";     /* number of accounts held at any time (guidance) */
S.trp  = S.trp  || {};              /* TaxReturnPreparer (optional block) */
SEED.bank = SEED.bank || {type:"SB"};
SEED.fbank = SEED.fbank || {};

/* ---- engine — this head carries NO income; roll-up contribution = 0 --- */
function engBank(){
  const B={income:0};                                  /* Bank/Verification add nothing to GTI */
  /* count accounts that are complete enough to export (IFSC + name + a/c no) */
  const valid=(S.bank||[]).filter(b=>IFSC_RE.test(st0(b.ifsc).toUpperCase())&&st0(b.acno)&&st0(b.bank));
  B.nAcc   = valid.length;
  B.hasRefund = (S.bank||[]).some(b=>b.refund==="Y");
  B.trpOn  = !!(st0((S.trp||{}).name)||st0((S.trp||{}).id));
  S.C.bank = B;
}

/* ---- renderer ------------------------------------------------------- */
function secBank(){
  let h="";

  /* --- refund bank accounts (Refund.BankAccountDtls) --- */
  h+=sub("Bank accounts");
  h+=row("Number of accounts held at any time during the year",inp("ver.nacc",{n:1}),
    {hint:"dormant accounts excluded"});
  h+=note("Every account held at any time in the year must be reported, except a dormant one. "+
    "Tick the one the refund should be credited to.");
  h+=grid("bank",[{k:"ifsc",h:"IFS code",t:"txt",w:"140px",max:11,req:1},
    {k:"bank",h:"Name of the bank",t:"txt",w:"auto",max:125,req:1},
    {k:"acno",h:"Account number",t:"txt",w:"200px",max:20,req:1},
    {k:"type",h:"Type",t:"sel",w:"200px",req:1,opts:ACCT_B},
    {k:"refund",h:"For the refund",t:"chk",w:"120px"}],
    S.bank,{min:"980px",empty:"No account given — a refund cannot be credited.",add:"Add an account"});
  h+=note("Type the IFS code and the name of the bank fills itself.");

  /* --- foreign refund bank (non-resident with no account in India) — Refund.BankAccountDtls.ForeignBankDetails --- */
  if((S.fs||{}).resStatus!=="RES"){
    h+=note("A non-resident claiming a refund who does not hold a bank account in India may give a foreign account.","warn");
    h+=grid("fbank",[{k:"swift",h:"SWIFT code",t:"txt",w:"160px",max:11,req:1},
      {k:"bank",h:"Name of the bank",t:"txt",w:"auto",max:125,req:1},
      {k:"country",h:"Country code",t:"txt",w:"140px",max:6,req:1},
      {k:"iban",h:"IBAN",t:"txt",w:"260px",max:34,req:1}],
      S.fbank,{min:"820px",empty:"No foreign account.",add:"Add a foreign account"});
  }

  /* --- Verification (Verification.md rows 4–9) --- */
  h+=sub("Verification");
  h+=note("<b>I,</b> the person named below, <b>solemnly declare</b> that to the best of my knowledge "+
    "and belief the information given in this return and the schedules is correct and complete, and that "+
    "I am competent to make this return and verify it.");                       /* r5/r6 tail — declaration text, no input */
  h+=row("I, (full name in block letters)",inp("ver.name",{max:125}),{req:1,ref:"C4"});
  h+=row("son / daughter of",inp("ver.father",{max:125}),{req:1,ref:"I4"});
  h+=row("making this return in my capacity as",sel("ver.cap",VCAP,{blank:false}),{req:1,ref:"I6"});
  h+=row("holding permanent account number (PAN)",inp("ver.pan",{max:10}),{req:1,ref:"C7"});
  h+=row("Place",inp("ver.place",{max:50}),{req:1,ref:"H9"});
  h+=row("Date",dte("ver.date"),{req:1,ref:"J9",hint:"signing date; exported as YYYY-MM-DD"});
  h+=note("The e-Filing portal stamps the submission with its own system date; this is the date of signing.");

  /* --- Tax return preparer (TaxReturnPreparer, optional block) --- */
  h+=card("trp","Prepared by a tax return preparer (TRP)",
    (st0((S.trp||{}).name)?st0(S.trp.name):""),
    row("Identification number of the TRP",inp("trp.id",{max:10}),{req:1})+
    row("Name of the TRP",inp("trp.name",{max:125}),{req:1})+
    row("Amount reimbursed from the Government, if any",inp("trp.reimb",{n:1}),{hint:"leave blank if none"})+
    formNote("Give the TRP's identification number and name; the reimbursement is optional."));

  /* --- the department's validation rules (shell panel) --- */
  h+=rulesPanel();

  /* --- export / save --- */
  h+=sub("Export");
  const errs=S.C.checks.filter(c=>c.lvl==="err").length;
  h+= errs
    ? note("<b>"+errs+" thing"+(errs>1?"s":"")+" still to fix.</b> Each sits against its own section.","stop")
    : note("Every check passes. The JSON is validated against the schema skeleton before it is written. "+
      "Import it into the government utility to seal and upload.","form");
  h+='<div style="padding:8px 14px;display:flex;gap:10px">'+
     '<button class="add" id="b_json2" style="height:32px;padding:0 18px;margin:0'+
     (errs?";opacity:.45":"")+'"'+(errs?" disabled":"")+'>Export the return as JSON</button>'+
     '<button class="add" id="b_save2" style="height:32px;padding:0 18px;margin:0">Save the working file</button></div>';
  return h;
}

/* ---- export --------------------------------------------------------- */
function expBank(j){
  /* refund accounts → PartB_TTI.Refund.BankAccountDtls (flag present even with none) */
  const bk=(S.bank||[]).filter(b=>IFSC_RE.test(st0(b.ifsc).toUpperCase())&&st0(b.acno)&&st0(b.bank));
  put(j,"PartB_TTI.Refund.BankAccountDtls.BankDtlsFlag",bk.length?"Y":"N");
  if(bk.length){
    if(j.PartB_TTI==null)j.PartB_TTI={};
    if(j.PartB_TTI.Refund==null)j.PartB_TTI.Refund={};
    if(j.PartB_TTI.Refund.BankAccountDtls==null)j.PartB_TTI.Refund.BankAccountDtls={};
    j.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails=bk.map(b=>({
      IFSCCode:st0(b.ifsc).toUpperCase(),
      BankName:st0(b.bank).slice(0,125),
      BankAccountNo:st0(b.acno).slice(0,20),
      AccountType:ACCT_B.some(a=>a[0]===b.type)?b.type:"SB",
      UseForRefund:b.refund==="Y"?"true":"false"}));
  }
  /* foreign refund accounts (non-resident) → Refund.BankAccountDtls.ForeignBankDetails */
  const fb=(S.fbank||[]).filter(b=>st0(b.swift)&&st0(b.bank)&&st0(b.iban));
  if(fb.length){
    if(j.PartB_TTI==null)j.PartB_TTI={};
    if(j.PartB_TTI.Refund==null)j.PartB_TTI.Refund={};
    if(j.PartB_TTI.Refund.BankAccountDtls==null)j.PartB_TTI.Refund.BankAccountDtls={};
    j.PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails=fb.map(b=>({
      SWIFTCode:st0(b.swift).slice(0,11),
      BankName:st0(b.bank).slice(0,125),
      CountryCode:st0(b.country).slice(0,6),
      IBAN:st0(b.iban).slice(0,34)}));
  }

  /* Verification — required keys always present */
  put(j,"Verification.Declaration.AssesseeVerName",(sv(S.ver.name)||"NA").slice(0,125));
  put(j,"Verification.Declaration.FatherName",(sv(S.ver.father)||"NA").slice(0,125));
  put(j,"Verification.Declaration.AssesseeVerPAN",(sv(st0(S.ver.pan).toUpperCase())||"NA"));
  put(j,"Verification.Capacity",VCAP.some(c=>c[0]===S.ver.cap)?S.ver.cap:"S");   /* I6 → S/R/K/A */
  put(j,"Verification.Place",(sv(S.ver.place)||"NA").slice(0,50));
  put(j,"Verification.Date",ISO(S.ver.date)||ISO(_verToday()));                  /* DD/MM/YYYY → YYYY-MM-DD */

  /* TaxReturnPreparer — only when the optional block carries id + name */
  const tp=S.trp||{};
  if(st0(tp.id)&&st0(tp.name)){
    const o={IdentificationNoOfTRP:st0(tp.id).slice(0,10),NameOfTRP:st0(tp.name).slice(0,125)};
    if(N(tp.reimb)>0)o.ReImbFrmGov=n0(tp.reimb);                                 /* optional, min 0 */
    j.TaxReturnPreparer=o;
  }
}

/* ---- import (inverse) ---------------------------------------------- */
function impBank(I3){
  const read=[]; const g=(o,p)=>p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);
  const bk=g(I3,"PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails")||[];
  if(Array.isArray(bk)&&bk.length){
    S.bank=bk.map(b=>({ifsc:b.IFSCCode||"",bank:b.BankName||"",acno:b.BankAccountNo||"",
      type:ACCT_B.some(a=>a[0]===b.AccountType)?b.AccountType:"SB",
      refund:b.UseForRefund==="true"?"Y":"N"}));
    read.push("bank accounts");
  }
  const fb=g(I3,"PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails")||[];
  if(Array.isArray(fb)&&fb.length){
    S.fbank=fb.map(b=>({swift:b.SWIFTCode||"",bank:b.BankName||"",country:b.CountryCode||"",iban:b.IBAN||""}));
    read.push("foreign bank accounts");
  }
  const V=I3.Verification;
  if(V){
    S.ver=S.ver||{};
    S.ver.name  = g(V,"Declaration.AssesseeVerName")||"";
    S.ver.father= g(V,"Declaration.FatherName")||"";
    S.ver.pan   = g(V,"Declaration.AssesseeVerPAN")||"";
    S.ver.cap   = VCAP.some(c=>c[0]===V.Capacity)?V.Capacity:"S";
    S.ver.place = V.Place||"";
    if(V.Date)S.ver.date=dmy(V.Date)||S.ver.date;                                /* YYYY-MM-DD → DD/MM/YYYY */
    read.push("verification");
  }
  if(I3.TaxReturnPreparer){
    S.trp={id:I3.TaxReturnPreparer.IdentificationNoOfTRP||"",
           name:I3.TaxReturnPreparer.NameOfTRP||"",
           reimb:nz(I3.TaxReturnPreparer.ReImbFrmGov)};
    read.push("tax return preparer");
  }
  return read;
}

/* ---- checks (regime-aware; no regime closures on this screen) ------- */
function chkBank(){
  const out=[]; engBank();

  /* --- bank accounts --- */
  if(!(S.bank||[]).length)
    out.push({lvl:"err",t:"Bank account",m:"At least one account is needed for the refund.",sec:"bank"});
  else if(!S.bank.some(b=>b.refund==="Y"))
    out.push({lvl:"err",t:"Refund account",m:"Tick one account to receive the refund.",sec:"bank"});
  (S.bank||[]).forEach((b,i)=>{
    if(st0(b.ifsc)&&!IFSC_RE.test(st0(b.ifsc).toUpperCase()))
      out.push({lvl:"err",t:"Bank row "+(i+1),m:"The IFSC is four letters, a zero, then six characters.",sec:"bank"});
    if(!st0(b.bank))out.push({lvl:"err",t:"Bank row "+(i+1),m:"The name of the bank is required.",sec:"bank"});
    if(!st0(b.acno))out.push({lvl:"err",t:"Bank row "+(i+1),m:"The account number is required.",sec:"bank"});
  });

  /* --- verification (C4/I4/C7/I6/H9/J9) --- */
  if(!st0(S.ver.name))
    out.push({lvl:"err",t:"Verification",m:"The full name of the person verifying the return is required.",sec:"bank"});
  if(!st0(S.ver.father))
    out.push({lvl:"err",t:"Father's name",m:"The schema makes the father's name compulsory.",sec:"bank"});
  if(!PAN_RE.test(st0(S.ver.pan).toUpperCase()))
    out.push({lvl:"err",t:"Verifier's PAN",m:"A valid ten-character PAN of the person verifying is required.",sec:"bank"});
  else if(!VPAN.test(st0(S.ver.pan).toUpperCase()))
    out.push({lvl:"warn",t:"Verifier's PAN",m:"An ITR-3 is verified by an individual or HUF — expected the fourth PAN character to be P or H.",sec:"bank"});
  if(!VCAP.some(c=>c[0]===S.ver.cap))
    out.push({lvl:"err",t:"Capacity",m:"Select the capacity in which the return is made (Self / Representative / Karta / Authorised signatory).",sec:"bank"});
  if(!st0(S.ver.place))
    out.push({lvl:"err",t:"Place",m:"The place of signing is required in the verification.",sec:"bank"});
  if(!ISO(S.ver.date))
    out.push({lvl:"err",t:"Date",m:"The date of signing is required, as "+DF+".",sec:"bank"});

  /* --- representative rules from the book --- */
  if(S.ver.cap==="R"){
    /* rules.json #45 — Representative capacity requires the Part A representative flag = Yes */
    if(((S.fs||{}).rep)!=="Y")
      out.push({lvl:"err",t:"Representative assessee",m:"Capacity is Representative, so 'Whether this return is being filed by a representative assessee?' in Part A - General must be Yes, with the representative's details.",sec:"bank"});
    /* rules.json #40 — verification PAN must be the PAN of the person uploading (informational) */
    out.push({lvl:"warn",t:"Representative PAN",m:"The PAN quoted in the verification must be the same as the PAN of the person uploading the return.",sec:"bank"});
  } else {
    /* self-filing: the verifier's PAN is normally the assessee's own PAN */
    if(PAN_RE.test(st0(S.ver.pan).toUpperCase())&&PAN_RE.test(st0((S.pi||{}).pan).toUpperCase())&&
       st0(S.ver.pan).toUpperCase()!==st0(S.pi.pan).toUpperCase())
      out.push({lvl:"warn",t:"Verifier's PAN",m:"The verification PAN differs from the assessee's PAN in Part A - General; for self-filing they should match.",sec:"bank"});
  }

  /* rules.json #60 / #3275 — verification PAN cannot equal a donee PAN in Schedule 80G / 80GGA */
  const doneePans=[]
    .concat((S.g80||[]).map(r=>r&&r.pan))
    .concat((S.gga||[]).map(r=>r&&r.pan))
    .filter(p=>PAN_RE.test(st0(p).toUpperCase())).map(p=>st0(p).toUpperCase());
  if(PAN_RE.test(st0(S.ver.pan).toUpperCase())&&doneePans.indexOf(st0(S.ver.pan).toUpperCase())>=0)
    out.push({lvl:"err",t:"Verifier's PAN",m:"The verification PAN cannot be the same as a donee PAN reported under Schedule 80G / 80GGA.",sec:"bank"});

  /* --- TRP (only validate when the optional block is in use) --- */
  const tp=S.trp||{};
  if(st0(tp.id)||st0(tp.name)||N(tp.reimb)){
    if(!st0(tp.id))out.push({lvl:"err",t:"Tax return preparer",m:"The TRP's identification number is required when the TRP block is filled.",sec:"bank"});
    if(!st0(tp.name))out.push({lvl:"err",t:"Tax return preparer",m:"The TRP's name is required when the TRP block is filled.",sec:"bank"});
    if(N(tp.reimb)<0)out.push({lvl:"err",t:"Tax return preparer",m:"The amount reimbursed from the Government cannot be negative.",sec:"bank"});
  }

  if(!out.length)
    out.push({lvl:"ok",t:"Bank and verification",m:"Verified by "+st0(S.ver.name)+" in the capacity of "+
      ((VCAP.find(c=>c[0]===S.ver.cap)||["","Self"])[1])+"; every check passes.",sec:"bank"});
  return out;
}

/* ---- register ------------------------------------------------------- */
reg({id:"bank", t:"Bank and verification", ref:"Verification", f:secBank,
  s:()=>{const n=((S.C.bank||{}).nAcc)||0;
    return (n?n+" account"+(n>1?"s":""):"")+(st0(S.ver.name)?(n?" · ":"")+"verified":"");},
  eng:engBank, exp:expBank, imp:impBank, chk:chkBank, order:95});
