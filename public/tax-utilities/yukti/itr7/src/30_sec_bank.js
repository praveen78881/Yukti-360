/* =====================================================================
   ITR-7 · Section "bank" — Bank, refund and verification
   Screen ref: Verification (the declaration) + the bank/refund block that
   the utility paints at the foot of the "PART-B-TI & TTI" sheet
   (rows 282-300, PartB_TTI.Refund.BankAccountDtls).
   Compute order 95 (last section); screen order 190 (last on screen).

   Built ONLY from books/ITR-7/Verification.md (the Verification block) and
   books/ITR-7/PART_B_TI_TTI.md Part 5 (the bank/refund block), plus
   enums.json (Capacity, AccountType, the flags, the 250-country list),
   section_map.json ["Verification" -> "bank"] and skeleton.json.

   Owns / writes on export:
     · Verification.Date          (top level, YYYY-MM-DD)
     · Verification.Place         (top level, max 50)
     · Verification.Declaration.{AssesseeVerName, FatherName, AssesseeVerPAN,
       Capacity}  — the four nested required leaves.
     · PartB_TTI.Refund.BankAccountDtls.BankDtlsFlag (Y/N)
     · PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails[]
         {IFSCCode, BankName, BankAccountNo, AccountType, UseForRefund}
     · PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails[]
         {SWIFTCode, BankName, CountryCode, IBAN}
     · PartB_TTI.AssetOutsideIndiaFlg (YES/NO)

   SEAM with the tax section (compute order 90): the tax section OWNS and
   exports PartB_TTI.Refund.RefundDue and the whole tax-computation subtree
   (ComputationOfTaxLiability, TaxPaid, Refund.RefundDue,
   Refund.NetTaxPyblOn115TDInc). This section NEVER writes RefundDue — it
   only renders the refund figure read-only (from S.C.int.refund) for
   context, and fills the bank block + BankDtlsFlag + AssetOutsideIndiaFlg.
   No other builder writes AddtnlBankDetails / ForeignBankDetails /
   BankDtlsFlag / AssetOutsideIndiaFlg / the Verification block.

   ITR-7 specifics (differ from the ITR-6 company form):
     · AccountType INCLUDES "Savings Account" (SB) — trust/institution form.
     · Capacity list is the trust/institution one — Managing Director,
       Director, Principal Officer, Chief Executive Officer, Representative
       Assessee, Others (codes MD/DR/PO/CE/RE/OT).
     · Verification.Date and Verification.Place sit at the TOP LEVEL of the
       block; only Name / FatherName / PAN / Capacity are under Declaration.
   Rules carried from the books: A386 (IFSC format, general), A62/A63
   (Representative Assessee -> rep name/email/contact + Secondary Address in
   Part A-General become mandatory), A54 (verification mode at submission),
   A638 (AssetOutsideIndiaFlg = Yes -> Schedule FA mandatory).
   ===================================================================== */

/* ---- account-type codes (schema AccountType; trust form INCLUDES SB) ---- */
const ACCT7=[["SB","Savings Account"],["CA","Current Account"],
  ["CC","Cash Credit Account"],["OD","Over draft account"],
  ["NRO","Non Resident Account"],["CGAS","Capital Gains Accounts Scheme"],
  ["OTH","Other"]];
/* Capacity codes — enums.json Verification.Declaration.Capacity (C6) */
const VCAP7=[["MD","Managing Director"],["DR","Director"],
  ["PO","Principal Officer"],["CE","Chief Executive Officer"],
  ["RE","Representative Assessee"],["OT","Others"]];
/* Yes/No flags */
const BFLAG7=[["Y","Yes"],["N","No"]];
const ASSETOUT7=[["YES","Yes"],["NO","No"]];
/* Country of location for a foreign bank account — enums.json
   PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails[].CountryCode
   (code -> name, the department's own 250-value list, verbatim). */
const COUNTRY7=[
  ["93","AFGHANISTAN"],["1001","ALAND ISLANDS"],["355","ALBANIA"],["213","ALGERIA"],
  ["684","AMERICAN SAMOA"],["376","ANDORRA"],["244","ANGOLA"],["1264","ANGUILLA"],
  ["1010","ANTARCTICA"],["1268","ANTIGUA AND BARBUDA"],["54","ARGENTINA"],["374","ARMENIA"],
  ["297","ARUBA"],["61","AUSTRALIA"],["43","AUSTRIA"],["994","AZERBAIJAN"],
  ["1242","BAHAMAS"],["973","BAHRAIN"],["880","BANGLADESH"],["1246","BARBADOS"],
  ["375","BELARUS"],["32","BELGIUM"],["501","BELIZE"],["229","BENIN"],
  ["1441","BERMUDA"],["975","BHUTAN"],["591","BOLIVIA (PLURINATIONAL STATE OF)"],["1002","BONAIRE, SINT EUSTATIUS AND SABA"],
  ["387","BOSNIA AND HERZEGOVINA"],["267","BOTSWANA"],["1003","BOUVET ISLAND"],["55","ALBANIA"],
  ["1014","BRITISH INDIAN OCEAN TERRITORY"],["673","BRUNEI DARUSSALAM"],["359","BULGARIA"],["226","BURKINA FASO"],
  ["257","BURUNDI"],["238","CABO VERDE"],["855","CAMBODIA"],["237","CAMEROON"],
  ["1","ALAND ISLANDS"],["1345","CAYMAN ISLANDS"],["236","CENTRAL AFRICAN REPUBLIC"],["235","CHAD"],
  ["56","CHILE"],["86","CHINA"],["9","BENIN"],["672","COCOS (KEELING) ISLANDS"],
  ["57","BURUNDI"],["270","COMOROS"],["242","BAHAMAS"],["243","CONGO (DEMOCRATIC REPUBLIC OF THE)"],
  ["682","COOK ISLANDS"],["506","COSTA RICA"],["225","C TE D'IVOIRE"],["385","CROATIA"],
  ["53","CUBA"],["1015","CURA AO"],["357","CYPRUS"],["420","CZECHIA"],
  ["45","CAYMAN ISLANDS"],["253","DJIBOUTI"],["1767","DOMINICA"],["1809","DOMINICAN REPUBLIC"],
  ["593","ECUADOR"],["20","CZECHIA"],["503","EL SALVADOR"],["240","EQUATORIAL GUINEA"],
  ["291","ERITREA"],["372","ESTONIA"],["251","ETHIOPIA"],["500","FALKLAND ISLANDS (MALVINAS)"],
  ["298","FAROE ISLANDS"],["679","FIJI"],["358","FINLAND"],["33","FRANCE"],
  ["594","FRENCH GUIANA"],["689","FRENCH POLYNESIA"],["1004","FRENCH SOUTHERN TERRITORIES"],["241","GABON"],
  ["220","GAMBIA"],["995","GEORGIA"],["49","GERMANY"],["233","GHANA"],
  ["350","GIBRALTAR"],["30","GREECE"],["299","GREENLAND"],["1473","GRENADA"],
  ["590","GUADELOUPE"],["1671","GUAM"],["502","GUATEMALA"],["1481","GUERNSEY"],
  ["224","GUINEA"],["245","GUINEA-BISSAU"],["592","GUYANA"],["509","HAITI"],
  ["1005","HEARD ISLAND AND MCDONALD ISLANDS"],["6","ANDORRA"],["504","HONDURAS"],["852","HONG KONG"],
  ["36","CENTRAL AFRICAN REPUBLIC"],["354","ICELAND"],["91","BOLIVIA (PLURINATIONAL STATE OF)"],["62","INDONESIA"],
  ["98","FAROE ISLANDS"],["964","IRAQ"],["353","IRELAND"],["1624","ISLE OF MAN"],
  ["972","ISRAEL"],["5","ALBANIA"],["1876","JAMAICA"],["81","GUERNSEY"],
  ["1534","JERSEY"],["962","JORDAN"],["7","ARUBA"],["254","KENYA"],
  ["686","KIRIBATI"],["850","KOREA(DEMOCRATIC PEOPLE'S REPUBLIC OF)"],["82","COOK ISLANDS"],["965","KUWAIT"],
  ["996","KYRGYZSTAN"],["856","LAO PEOPLE'S DEMOCRATIC REPUBLIC"],["371","LATVIA"],["961","LEBANON"],
  ["266","LESOTHO"],["231","LIBERIA"],["218","LIBYA"],["423","LIECHTENSTEIN"],
  ["370","LITHUANIA"],["352","LUXEMBOURG"],["853","MACAO"],["389","MACEDONIA(THE FORMER YUGOSLAV REPUBLIC OF)"],
  ["261","MADAGASCAR"],["265","MALAWI"],["60","MALAYSIA"],["960","MALDIVES"],
  ["223","MALI"],["356","MALTA"],["692","MARSHALL ISLANDS"],["596","MARTINIQUE"],
  ["222","MAURITANIA"],["230","MAURITIUS"],["269","MAYOTTE"],["52","HONG KONG"],
  ["691","MICRONESIA (FEDERATED STATES OF)"],["373","MOLDOVA (REPUBLIC OF)"],["377","MONACO"],["976","MONGOLIA"],
  ["382","MONTENEGRO"],["1664","MONTSERRAT"],["212","MOROCCO"],["258","MOZAMBIQUE"],
  ["95","GEORGIA"],["264","ANGUILLA"],["674","NAURU"],["977","NEPAL"],
  ["31","LIBERIA"],["687","NEW CALEDONIA"],["64","ANGUILLA"],["505","NICARAGUA"],
  ["227","NIGER"],["234","NIGERIA"],["683","NIUE"],["15","CURA AO"],
  ["1670","NORTHERN MARIANA ISLANDS"],["47","NORWAY"],["968","OMAN"],["92","GUYANA"],
  ["680","PALAU"],["970","PALESTINE, STATE OF"],["507","PANAMA"],["675","PAPUA NEW GUINEA"],
  ["595","PARAGUAY"],["51","ETHIOPIA"],["63","PHILIPPINES"],["1011","PITCAIRN"],
  ["48","POLAND"],["14","BRITISH INDIAN OCEAN TERRITORY"],["1787","PUERTO RICO"],["974","QATAR"],
  ["262","R UNION"],["40","EQUATORIAL GUINEA"],["8","ANTIGUA AND BARBUDA"],["250","RWANDA"],
  ["1006","SAINT BARTH LEMY"],["290","SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA"],["1869","SAINT KITTS AND NEVIS"],["1758","SAINT LUCIA"],
  ["1007","SAINT MARTIN (FRENCH PART)"],["508","SAINT PIERRE AND MIQUELON"],["1784","SAINT VINCENT AND THE GRENADINES"],["685","SAMOA"],
  ["378","SAN MARINO"],["239","SAO TOME AND PRINCIPE"],["966","SAUDI ARABIA"],["221","SENEGAL"],
  ["381","SERBIA"],["248","SEYCHELLES"],["232","SIERRA LEONE"],["65","KUWAIT"],
  ["1721","SINT MAARTEN (DUTCH PART)"],["421","SLOVAKIA"],["386","SLOVENIA"],["677","SOLOMON ISLANDS"],
  ["252","SOMALIA"],["28","SOUTH AFRICA"],["1008","SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS"],["211","SOUTH SUDAN"],
  ["35","CHAD"],["94","AZERBAIJAN"],["249","SUDAN"],["597","SURINAME"],
  ["1012","SVALBARD AND JAN MAYEN"],["268","ANTIGUA AND BARBUDA"],["46","BARBADOS"],["41","BERMUDA"],
  ["963","SYRIAN ARAB REPUBLIC"],["886","TAIWAN, PROVINCE OF CHINA[A]"],["992","TAJIKISTAN"],["255","TANZANIA, UNITED REPUBLIC OF"],
  ["66","LESOTHO"],["670","NORTHERN MARIANA ISLANDS"],["228","TOGO"],["690","TOKELAU"],
  ["676","TONGA"],["1868","TRINIDAD AND TOBAGO"],["216","TUNISIA"],["90","GUADELOUPE"],
  ["993","TURKMENISTAN"],["1649","TURKS AND CAICOS ISLANDS"],["688","TUVALU"],["256","UGANDA"],
  ["380","UKRAINE"],["971","UNITED ARAB EMIRATES"],["44","ANGOLA"],["2","BAHAMAS"],
  ["1009","UNITED STATES MINOR OUTLYING ISLANDS"],["598","URUGUAY"],["998","UZBEKISTAN"],["678","VANUATU"],
  ["58","FINLAND"],["84","AMERICAN SAMOA"],["1284","VIRGIN ISLANDS (BRITISH)"],["1340","VIRGIN ISLANDS (U.S.)"],
  ["681","WALLIS AND FUTUNA"],["1013","WESTERN SAHARA"],["967","YEMEN"],["260","ZAMBIA"],
  ["263","ZIMBABWE"],["9999","OTHERS"]];

/* ---- state (seed only what is absent; never clobber shell/import) ----- */
const _verToday7=()=>{const d=new Date();
  return String(d.getDate()).padStart(2,"0")+"/"+
         String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();};
S.bank  = S.bank  || [];          /* India accounts -> Refund.BankAccountDtls.AddtnlBankDetails */
S.fbank = S.fbank || [];          /* foreign account (non-resident option) -> ForeignBankDetails */
S.ver   = S.ver   || {};
if(S.ver.cap===undefined)      S.ver.cap="MD";        /* Declaration.Capacity (C6, default Managing Director) */
if(S.ver.name===undefined)     S.ver.name="";         /* Declaration.AssesseeVerName (C4) */
if(S.ver.father===undefined)   S.ver.father="";       /* Declaration.FatherName (G4) */
if(S.ver.pan===undefined)      S.ver.pan="";          /* Declaration.AssesseeVerPAN (C7) */
if(S.ver.place===undefined)    S.ver.place="";        /* Verification.Place (G9, top level) */
if(S.ver.date===undefined)     S.ver.date=_verToday7();/* Verification.Date (C9, top level), DD/MM/YYYY on screen */
if(S.ver.nacc===undefined)     S.ver.nacc="";         /* count of accounts held (guidance only, not exported) */
if(S.ver.bankFlag===undefined) S.ver.bankFlag="Y";    /* BankDtlsFlag (Part B-TTI row 282) */
if(S.ver.assetOut===undefined) S.ver.assetOut="NO";   /* AssetOutsideIndiaFlg (Part B-TTI row 300) */

/* ---- engine — this section carries NO income; roll-up contribution = 0 --- */
function engBank(){
  const B={income:0};                                 /* Bank/Verification add nothing to GTI */
  const valid=(S.bank||[]).filter(b=>IFSC_RE.test(st0(b.ifsc).toUpperCase())&&st0(b.acno)&&st0(b.bank));
  B.nAcc     = valid.length;
  B.hasRefund= (S.bank||[]).some(b=>b.refund==="Y");
  B.bankFlag = (S.ver||{}).bankFlag==="N"?"N":"Y";
  B.assetOut = (S.ver||{}).assetOut==="YES"?"YES":"NO";
  S.C.bank   = B;
}

/* ---- renderer ------------------------------------------------------- */
function secBank(){
  let h="";
  const V=S.ver||{};

  /* --- do you hold a bank account in India (BankDtlsFlag, row 282) --- */
  h+=sub("Bank accounts");
  h+=row("Do you have a bank account in India?",sel("ver.bankFlag",BFLAG7,{blank:false}),
    {req:1,ref:"row 282"});
  h+=row("Number of accounts held at any time during the year",inp("ver.nacc",{n:1}),
    {hint:"dormant accounts excluded"});
  h+=note("All bank accounts held at any time in the year must be reported, except a dormant one. "+
    "Tick at least one account for the refund to be credited to it. A non-resident claiming a refund "+
    "with no bank account in India may instead furnish one foreign account below.");

  /* --- India accounts (AddtnlBankDetails[], live table at rows 288-293) --- */
  if(V.bankFlag!=="N"){
    h+=grid("bank",[{k:"ifsc",h:"IFS code of the bank",t:"txt",w:"150px",max:11,req:1},
      {k:"bank",h:"Name of the bank",t:"txt",w:"auto",max:125,req:1},
      {k:"acno",h:"Account number",t:"txt",w:"200px",max:20,req:1},
      {k:"type",h:"Type of account",t:"sel",w:"220px",req:1,opts:ACCT7},
      {k:"refund",h:"Select for refund credit",t:"chk",w:"140px"}],
      S.bank,{min:"1020px",empty:"No account given — a refund cannot be credited.",add:"Add an account"});
    h+=note("The IFS code is eleven characters: four letters, then a zero, then six letters or digits (rule A386).");
  } else {
    h+=note("You have answered that there is no bank account in India. A non-resident may instead give a foreign account below.","warn");
  }

  /* --- foreign account (non-residents' option, rows 295-297) --- */
  h+=note("A non-resident may, at its option, furnish the details of one foreign bank account for the refund.");
  h+=grid("fbank",[{k:"swift",h:"SWIFT code",t:"txt",w:"180px",max:30,req:1},
    {k:"bank",h:"Name of the bank",t:"txt",w:"auto",max:125,req:1},
    {k:"country",h:"Country of location",t:"sel",w:"260px",req:1,opts:COUNTRY7},
    {k:"iban",h:"IBAN",t:"txt",w:"280px",max:40,req:1}],
    S.fbank,{min:"980px",empty:"No foreign account.",add:"Add a foreign account"});

  /* --- the refund figure (computed by the tax section, shown read-only) --- */
  h+=row("Refund due (computed on the Part B-TTI / tax screen)",cell((S.C.int||{}).refund),
    {ref:"item 11",hint:"credited to the ticked account above"});

  /* --- foreign-asset question (AssetOutsideIndiaFlg, row 300) --- */
  h+=row("Do you at any time during the previous year hold, as beneficial owner, beneficiary or "+
    "otherwise, any asset (including financial interest in any entity) located outside India, "+
    "or have signing authority in any account located outside India, or have income from any "+
    "source outside India?",sel("ver.assetOut",ASSETOUT7,{blank:false}),{req:1,ref:"row 300"});
  h+=note("Yes makes Schedule FA mandatory (rule A638).");

  /* --- Verification (Verification sheet rows 4-9) --- */
  h+=sub("Verification");
  h+=note("<b>I,</b> the person named below, <b>solemnly declare</b> that to the best of my knowledge "+
    "and belief the information given in this return and the schedules thereto is correct and complete "+
    "and is in accordance with the provisions of the Income-tax Act, 1961; and that I am making this "+
    "return in my capacity and am also competent to make this return and verify it.");
  h+=row("I, (full name in block letters)",inp("ver.name",{max:125}),{req:1,ref:"C4"});
  h+=row("son / daughter of",inp("ver.father",{max:125}),{req:1,ref:"G4"});
  h+=row("making this return in my capacity as",sel("ver.cap",VCAP7,{blank:false}),{req:1,ref:"C6"});
  h+=row("I am holding permanent account number (PAN)",inp("ver.pan",{max:10}),{req:1,ref:"C7"});
  h+=row("Place",inp("ver.place",{max:50}),{req:1,ref:"G9"});
  h+=row("Date",dte("ver.date"),{req:1,ref:"C9",hint:"date of signing; exported as YYYY-MM-DD"});
  h+=note("The submission date is the e-Filing portal's own system date; this is the date of signing. "+
    "The return must be verified in the mode prescribed under Rule 12 / 12AC at submission (rule A54).");
  if(V.cap==="RE")
    h+=note("Capacity is <b>Representative Assessee</b>: the name, email and contact number of the "+
      "representative assessee, and the Secondary Address in Part A-General, become mandatory (rules A62 / A63).","warn");

  return h;
}

/* ---- export --------------------------------------------------------- */
function expBank(j){
  const V=S.ver||{};
  /* the flag as the user answered it (row 282) */
  const flag=V.bankFlag==="N"?"N":"Y";
  put(j,"PartB_TTI.Refund.BankAccountDtls.BankDtlsFlag",flag);

  /* India accounts -> AddtnlBankDetails[] (only complete rows) */
  const bk=(S.bank||[]).filter(b=>IFSC_RE.test(st0(b.ifsc).toUpperCase())&&st0(b.acno)&&st0(b.bank));
  if(bk.length){
    j.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails=bk.map(b=>({
      IFSCCode:st0(b.ifsc).toUpperCase(),
      BankName:st0(b.bank).slice(0,125),
      BankAccountNo:st0(b.acno).slice(0,20),
      AccountType:ACCT7.some(a=>a[0]===b.type)?b.type:"SB",
      UseForRefund:b.refund==="Y"?"true":"false"}));
  }

  /* foreign account -> ForeignBankDetails[] (non-resident option) */
  const fb=(S.fbank||[]).filter(b=>st0(b.swift)&&st0(b.bank)&&st0(b.iban)&&st0(b.country));
  if(fb.length){
    j.PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails=fb.map(b=>({
      SWIFTCode:st0(b.swift).slice(0,30),
      BankName:st0(b.bank).slice(0,125),
      CountryCode:COUNTRY7.some(c=>c[0]===st0(b.country))?st0(b.country):st0(b.country).slice(0,6),
      IBAN:st0(b.iban).slice(0,40)}));
  }

  /* foreign-asset flag (row 300) */
  put(j,"PartB_TTI.AssetOutsideIndiaFlg",V.assetOut==="YES"?"YES":"NO");

  /* Verification — Date and Place at the TOP LEVEL; the rest under Declaration.
     All six leaves required, always present. */
  put(j,"Verification.Date",ISO(V.date)||ISO(_verToday7()));
  put(j,"Verification.Place",(sv(V.place)||"NA").slice(0,50));
  put(j,"Verification.Declaration.AssesseeVerName",(sv(V.name)||"NA").slice(0,125));
  put(j,"Verification.Declaration.FatherName",(sv(V.father)||"NA").slice(0,125));
  put(j,"Verification.Declaration.AssesseeVerPAN",(sv(st0(V.pan).toUpperCase())||"NA"));
  put(j,"Verification.Declaration.Capacity",VCAP7.some(c=>c[0]===V.cap)?V.cap:"MD");
  /* RefundDue / NetTaxPyblOn115TDInc and the tax-computation subtree are
     computed and exported by the tax section (compute order 90) — not here. */
}

/* ---- import (inverse) ---------------------------------------------- */
function impBank(I){
  const read=[]; const g=(o,p)=>p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);
  const flag=g(I,"PartB_TTI.Refund.BankAccountDtls.BankDtlsFlag");
  if(flag==="Y"||flag==="N"){S.ver=S.ver||{};S.ver.bankFlag=flag;}
  const bk=g(I,"PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails")||[];
  if(Array.isArray(bk)&&bk.length){
    S.bank=bk.map(b=>({ifsc:b.IFSCCode||"",bank:b.BankName||"",acno:b.BankAccountNo||"",
      type:ACCT7.some(a=>a[0]===b.AccountType)?b.AccountType:"SB",
      refund:b.UseForRefund==="true"?"Y":"N"}));
    read.push("bank accounts");
  }
  const fb=g(I,"PartB_TTI.Refund.BankAccountDtls.ForeignBankDetails")||[];
  if(Array.isArray(fb)&&fb.length){
    S.fbank=fb.map(b=>({swift:b.SWIFTCode||"",bank:b.BankName||"",
      country:b.CountryCode||"",iban:b.IBAN||""}));
    read.push("foreign bank accounts");
  }
  const ao=g(I,"PartB_TTI.AssetOutsideIndiaFlg");
  if(ao==="YES"||ao==="NO"){S.ver=S.ver||{};S.ver.assetOut=ao;read.push("foreign-asset flag");}
  const Vb=I&&I.Verification;
  if(Vb){
    S.ver=S.ver||{};
    if(Vb.Place)S.ver.place=Vb.Place;
    if(Vb.Date)S.ver.date=dmy(Vb.Date)||S.ver.date;
    const D=Vb.Declaration||{};
    S.ver.name  = D.AssesseeVerName||S.ver.name||"";
    S.ver.father= D.FatherName||S.ver.father||"";
    S.ver.pan   = D.AssesseeVerPAN||S.ver.pan||"";
    S.ver.cap   = VCAP7.some(c=>c[0]===D.Capacity)?D.Capacity:(S.ver.cap||"MD");
    read.push("verification");
  }
  return read;
}

/* ---- checks (the section's own screen validations; not the dept rules) --- */
function chkBank(){
  const out=[]; engBank();
  const V=S.ver||{};
  const flagN=V.bankFlag==="N";

  /* --- India accounts --- */
  if(!flagN){
    if(!(S.bank||[]).length)
      out.push({lvl:"err",t:"Bank account",m:"At least one bank account in India is needed for the refund.",sec:"bank"});
    else if(!S.bank.some(b=>b.refund==="Y"))
      out.push({lvl:"err",t:"Refund account",m:"Tick at least one account to receive the refund.",sec:"bank"});
    (S.bank||[]).forEach((b,i)=>{
      if(st0(b.ifsc)&&!IFSC_RE.test(st0(b.ifsc).toUpperCase()))
        out.push({lvl:"err",t:"Bank row "+(i+1),m:"The IFS code is four letters, a zero, then six letters or digits (rule A386).",sec:"bank"});
      if(!st0(b.ifsc))out.push({lvl:"err",t:"Bank row "+(i+1),m:"The IFS code is required.",sec:"bank"});
      if(!st0(b.bank))out.push({lvl:"err",t:"Bank row "+(i+1),m:"The name of the bank is required.",sec:"bank"});
      if(!st0(b.acno))out.push({lvl:"err",t:"Bank row "+(i+1),m:"The account number is required.",sec:"bank"});
      if(!ACCT7.some(a=>a[0]===b.type))out.push({lvl:"err",t:"Bank row "+(i+1),m:"Select the type of account.",sec:"bank"});
    });
  } else if((S.bank||[]).some(b=>st0(b.ifsc)||st0(b.acno)||st0(b.bank))){
    out.push({lvl:"warn",t:"Bank account",m:"You answered that there is no bank account in India, but account rows are filled — they will not be exported.",sec:"bank"});
  }

  /* --- foreign accounts (validate any row that is started) --- */
  (S.fbank||[]).forEach((b,i)=>{
    if(!(st0(b.swift)||st0(b.bank)||st0(b.country)||st0(b.iban)))return;
    if(!st0(b.swift))out.push({lvl:"err",t:"Foreign account "+(i+1),m:"The SWIFT code is required.",sec:"bank"});
    if(!st0(b.bank)) out.push({lvl:"err",t:"Foreign account "+(i+1),m:"The name of the bank is required.",sec:"bank"});
    if(!COUNTRY7.some(c=>c[0]===st0(b.country)))out.push({lvl:"err",t:"Foreign account "+(i+1),m:"Select the country of location.",sec:"bank"});
    if(!st0(b.iban)) out.push({lvl:"err",t:"Foreign account "+(i+1),m:"The IBAN is required.",sec:"bank"});
  });

  /* --- foreign-asset flag vs Schedule FA (rule A638) --- */
  if(V.assetOut==="YES" && !((S.C.fa||{}).hasFA))
    out.push({lvl:"warn",t:"Schedule FA (A638)",m:"You answered that an asset is held outside India, so Schedule FA must be filled.",sec:"bank"});
  if(V.assetOut!=="YES" && ((S.C.fa||{}).hasFA))
    out.push({lvl:"warn",t:"Foreign-asset flag",m:"Schedule FA has entries but the foreign-asset question is answered No — reconcile the two.",sec:"bank"});

  /* --- verification (C4/G4/C6/C7/G9/C9) --- */
  if(!st0(V.name))
    out.push({lvl:"err",t:"Verification",m:"The full name of the person verifying the return is required.",sec:"bank"});
  if(!st0(V.father))
    out.push({lvl:"err",t:"Father's name",m:"The schema makes the father's name compulsory.",sec:"bank"});
  if(!PAN_RE.test(st0(V.pan).toUpperCase()))
    out.push({lvl:"err",t:"Verifier's PAN",m:"A valid ten-character PAN of the person verifying is required.",sec:"bank"});
  if(!VCAP7.some(c=>c[0]===V.cap))
    out.push({lvl:"err",t:"Capacity",m:"Select the capacity in which the return is made.",sec:"bank"});
  if(!st0(V.place))
    out.push({lvl:"err",t:"Place",m:"The place of signing is required in the verification.",sec:"bank"});
  if(!ISO(V.date))
    out.push({lvl:"err",t:"Date",m:"The date of signing is required, as "+DF+".",sec:"bank"});

  /* --- Representative-assessee rule from the book (A62 / A63) --- */
  if(V.cap==="RE"){
    if(((S.who||{}).repFlg)!=="Y")
      out.push({lvl:"warn",t:"Representative Assessee (A62 / A63)",m:"Capacity is Representative Assessee, so the representative's name, email and contact number, and the Secondary Address in Part A-General, must be given.",sec:"bank"});
  }

  if(!out.length)
    out.push({lvl:"ok",t:"Bank and verification",m:"Verified by "+st0(V.name)+" as "+
      ((VCAP7.find(c=>c[0]===V.cap)||["","Managing Director"])[1])+"; every check passes.",sec:"bank"});
  return out;
}

/* ---- register (overrides the boot stub) ---------------------------- */
reg({id:"bank", t:"Bank & verification", ref:"Verification", f:secBank,
  s:()=>{const n=((S.C.bank||{}).nAcc)||0;
    return (n?n+" account"+(n>1?"s":""):"")+(st0((S.ver||{}).name)?(n?" · ":"")+"verified":"");},
  eng:engBank, exp:expBank, imp:impBank, chk:chkBank, order:190, corder:95});
