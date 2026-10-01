/* ---- inc — Income (salary + presumptive business + other sources + 112A/D20) ---- */
function secInc(){
  const inc=S.C.inc||{}, D=inc.detail||{}; const nw=isNew(); let h="";

  /* B1 salary */
  const salOff=(S.pi.empcat==="NA");
  h+=fold("ic_sal","B1","Salary","",(salOff?
      note("Nature of Employment is 'Not Applicable' — the salary schedule is greyed off."):(
      row("(a) Salary as per section 17(1)",inp("ic.sal.s17_1",{n:1}),{ref:"H112"})+
      row("(b) Value of perquisites u/s 17(2)",inp("ic.sal.s17_2",{n:1}),{ref:"H113"})+
      row("(c) Profit in lieu of salary u/s 17(3)",inp("ic.sal.s17_3",{n:1}),{ref:"H114"})+
      row("(i) Gross Salary (a+b+c)",cell(D.gross),{ref:"H111"})+
      row("(ii) Less: Allowances exempt u/s 10",cell(D.exempt),{ref:"H121",
        hint:nw?"HRA/LTC/10(14) close in the new regime":""})+
      grid("ic.sal.alw",[
        {k:"nat",h:"Nature of exempt allowance",t:"sel",w:"420px",req:1,opts:ALW_NAT},
        {k:"amt",h:"Amount",t:"num",w:"150px",req:1}],
        S.ic.sal.alw||[],{min:"620px",empty:"No exempt allowance.",add:"Add an allowance"})+
      row("(iii) Net Salary (i − ii)",cell(D.netSal),{ref:"H130"})+
      row("(iv) Deductions u/s 16 (iva+ivb+ivc)",cell(D.ded16),{ref:"H131"})+
      row("(a) Standard Deduction u/s 16(ia)",cell(D.stdDed),{ref:"H132",ind:1,hint:"max ₹75,000"})+
      (nw?row("(b) Entertainment allowance u/s 16(ii)",cell(0),{ref:"H133",ind:1,hint:"closed in the new regime"})
         :row("(b) Entertainment allowance u/s 16(ii)",inp("ic.sal.ent",{n:1}),{ref:"H133",ind:1,hint:"max ₹5,000"}))+
      (nw?row("(c) Professional tax u/s 16(iii)",cell(0),{ref:"H134",ind:1,hint:"closed in the new regime"})
         :row("(c) Professional tax u/s 16(iii)",inp("ic.sal.ptax",{n:1}),{ref:"H134",ind:1,hint:"max ₹5,000"}))+
      row("(v) Income chargeable under 'Salaries' (iii − iv)",cell(D.incSal),{ref:"H135"})
    )),{def:1});

  /* B1 presumptive business/profession — Schedule BP */
  h+=fold("ic_bp","BP","Presumptive business / profession (44AD / 44ADA / 44AE)",
    (R(D.e8)?RS(D.e8):""),(
    /* 44AD */
    sub("Section 44AD — business")+
    grid("ic.bp.nad",[
      {k:"name",h:"Name of business",t:"txt",w:"260px",req:1,max:75},
      {k:"code",h:"Business code",t:"txt",w:"110px",req:1,max:8,ph:"e.g. 09028"},
      {k:"desc",h:"Description",t:"txt",w:"260px",max:75}],
      S.ic.bp.nad||[],{min:"680px",empty:"No 44AD business.",add:"Add a 44AD business"})+
    row("E1(a) Turnover via bank / digital modes",inp("ic.bp.ad.bank",{n:1}),{ref:"E1a"})+
    row("E1(b) Receipts in cash",inp("ic.bp.ad.cash",{n:1}),{ref:"E1b"})+
    row("E1(c) Any other mode",inp("ic.bp.ad.other",{n:1}),{ref:"E1c"})+
    row("E1 Gross Turnover / Gross Receipts",cell(D.e1),{ref:"E1",hint:"cap ₹2 cr (₹3 cr if cash ≤ 5%)"})+
    row("E2(a) 6% of E1(a) or amount claimed",inp("ic.bp.ad.claim6",{n:1}),{ref:"E2a",v2:cell(D.e2a)})+
    row("E2(b) 8% of (E1b+E1c) or amount claimed",inp("ic.bp.ad.claim8",{n:1}),{ref:"E2b",v2:cell(D.e2b)})+
    row("E2(c) Presumptive income u/s 44AD (a+b)",cell(D.e2c),{ref:"E2c"})+
    /* 44ADA */
    sub("Section 44ADA — profession")+
    grid("ic.bp.nada",[
      {k:"name",h:"Name of business / profession",t:"txt",w:"260px",req:1,max:75},
      {k:"code",h:"Profession code",t:"txt",w:"110px",req:1,max:8,ph:"e.g. 16003"},
      {k:"desc",h:"Description",t:"txt",w:"260px",max:75}],
      S.ic.bp.nada||[],{min:"680px",empty:"No 44ADA profession.",add:"Add a 44ADA profession"})+
    row("E3(a) Receipts via bank / digital modes",inp("ic.bp.ada.bank",{n:1}),{ref:"E3a"})+
    row("E3(b) Receipts in cash",inp("ic.bp.ada.cash",{n:1}),{ref:"E3b"})+
    row("E3(c) Any other mode",inp("ic.bp.ada.other",{n:1}),{ref:"E3c"})+
    row("E3 Gross Receipts",cell(D.e3),{ref:"E3",hint:"cap ₹50 L (₹75 L if cash ≤ 5%)"})+
    row("E4 Presumptive income u/s 44ADA (50% of E3 or claimed)",inp("ic.bp.ada.claim",{n:1}),{ref:"E4",v2:cell(D.e4)})+
    /* 44AE */
    sub("Section 44AE — goods carriages")+
    grid("ic.bp.nae",[
      {k:"name",h:"Name of business",t:"txt",w:"260px",req:1,max:75},
      {k:"code",h:"Business code",t:"sel",w:"200px",req:1,opts:NOB44AE},
      {k:"desc",h:"Description",t:"txt",w:"220px",max:75}],
      S.ic.bp.nae||[],{min:"720px",empty:"No 44AE business.",add:"Add a 44AE business"})+
    grid("ic.bp.gcv",[
      {k:"reg",h:"Registration No.",t:"txt",w:"140px",req:1,max:11},
      {k:"flag",h:"Owned/Leased/Hired",t:"sel",w:"150px",req:1,opts:OWN_LEASE},
      {k:"tonnage",h:"Tonnage (MT)",t:"num",w:"110px",req:1},
      {k:"months",h:"Months held",t:"num",w:"110px",req:1},
      {k:"pi",h:"Presumptive income",t:"num",w:"150px",req:1}],
      S.ic.bp.gcv||[],{min:"720px",empty:"No goods carriage (max 10).",add:"Add a vehicle"})+
    (( (S.ic.bp.gcv||[]).length)?note("Per-vehicle presumptive income ≥ max(₹1,000/MT/month, ₹7,500/month); "+
      "months 1–12; registration numbers must be unique."):"")+
    (S.pi.status==="F"?row("E6 Salary & interest paid to partners (firms only)",inp("ic.bp.ae.salint",{n:1}),{ref:"E6"}):"")+
    row("E5 Presumptive income from goods carriages",cell(D.e5),{ref:"E5"})+
    row("E7 Presumptive income u/s 44AE (E5 − E6)",cell(D.e7),{ref:"E7"})+
    row("E8 Income chargeable under Business or Profession (E2c+E4+E7)",cell(D.e8),{ref:"E8 → B1"})+
    /* GST turnover reported */
    sub("Turnover / gross receipt reported for GST")+
    grid("ic.bp.gstn",[
      {k:"gstin",h:"GSTIN No.",t:"txt",w:"200px",req:1,max:20},
      {k:"amt",h:"Annual value of outward supplies per GST return",t:"num",w:"260px",req:1}],
      S.ic.bp.gstn||[],{min:"520px",empty:"No GSTIN reported.",add:"Add a GSTIN"})+
    /* Financial particulars E11–E25 */
    sub("Financial particulars of the business (as on 31-Mar-2026)")+
    row("E15 Sundry creditors",inp("ic.bp.fin.creditors",{n:1}),{req:1})+
    row("E19 Inventories",inp("ic.bp.fin.inventories",{n:1}),{req:1})+
    row("E20 Sundry debtors",inp("ic.bp.fin.debtors",{n:1}),{req:1})+
    row("E21 Balance with banks",inp("ic.bp.fin.bank",{n:1}),{req:1})+
    row("E22 Cash-in-hand",inp("ic.bp.fin.cash",{n:1}),{req:1})+
    note("E15, E19, E20, E21, E22 are mandatory; other financial-particulars lines if available.")
  ),{});

  /* B4 other sources */
  h+=fold("ic_os","B4","Income from other sources",(R(D.incOS)?RS(D.incOS):""),(
    grid("ic.os.rows",[
      {k:"nat",h:"Nature of income",t:"sel",w:"340px",req:1,opts:(S.pi.status==="I"?OS_NAT:OS_NAT.filter(x=>x[0]!=="FAP"))},
      {k:"amt",h:"Amount (non-dividend)",t:"num",w:"160px"}],
      S.ic.os.rows||[],{min:"560px",empty:"No other-source income.",add:"Add an income"})+
    ((S.ic.os.rows||[]).some(r=>r.nat==="DIV")?
      (sub("Dividend — quarter split (for rows marked Dividend)")+
       note("Enter the dividend across the five statutory periods; each dividend row's amount is the sum of its quarters."))
      :"")+
    (S.ic.os.rows||[]).map((r,i)=> r.nat==="DIV"?(
       row("Dividend row "+(i+1)+" — up to 15/06/2025",inp("ic.os.rows."+i+".q1",{n:1}),{ind:1,ref:"H164"})+
       row("16/06–15/09/2025",inp("ic.os.rows."+i+".q2",{n:1}),{ind:1,ref:"H165"})+
       row("16/09–15/12/2025",inp("ic.os.rows."+i+".q3",{n:1}),{ind:1,ref:"H166"})+
       row("16/12/2025–15/03/2026",inp("ic.os.rows."+i+".q4",{n:1}),{ind:1,ref:"H167"})+
       row("16/03–31/03/2026",inp("ic.os.rows."+i+".q5",{n:1}),{ind:1,ref:"H168"})
    ):"").join("")+
    (nw?row("Less: Deduction u/s 57(iia) (family pension)",cell(0),{ref:"F170",hint:"closed in the new regime"})
       :row("Less: Deduction u/s 57(iia) (family pension only)",inp("ic.os.fp57",{n:1}),{ref:"F170",
         hint:"≤ lower of 1/3 of family pension or ₹15,000"}))+
    row("B4 Income from other sources",cell(D.incOS),{ref:"F146"})
  ),{});

  /* D20(a) LTCG 112A not chargeable (block LTCG112A — owned here, feeds GTI incl 112A) */
  h+=fold("ic_ltcg","D20(a)","LTCG u/s 112A not chargeable to tax",(R(D.long112a)?RS(D.long112a):""),(
    row("(i) Total sale consideration",inp("ic.ltcg.sale",{n:1}),{ref:"D20a(i)"})+
    row("(ii) Total cost of acquisition",inp("ic.ltcg.cost",{n:1}),{ref:"D20a(ii)"})+
    row("(iii) Long-term capital gains as per sec 112A",cell(D.long112a),{ref:"D20a(iii)",
      hint:"reported only up to ₹1,25,000; above that it is 0"})
  ),{});

  /* D20 exempt income for reporting (block TaxExmpIntIncDtls — owned here) */
  let exTot=0; (S.ic.exmp||[]).forEach(r=>exTot+=N(r.amt));
  h+=fold("ic_exmp","D20","Exempt income (for reporting only)",(R(exTot)?RS(exTot):""),(
    note("For reporting only, not taxed. Agricultural income above ₹5,000 forces ITR-3/5.")+
    grid("ic.exmp",[
      {k:"cat",h:"Category",t:"sel",w:"320px",req:1,opts:EXMP_CAT},
      {k:"sub",h:"Sub-category",t:"txt",w:"140px",max:20,ph:"e.g. 10(1)"},
      {k:"desc",h:"Description",t:"txt",w:"200px",max:125},
      {k:"amt",h:"Amount",t:"num",w:"140px",req:1}],
      S.ic.exmp||[],{min:"820px",empty:"No exempt income.",add:"Add an exempt income"})+
    row("Total exempt income",cell(exTot),{ref:"D20 total"})
  ),{});
  return h;
}

/* =====================================================================
   EXPORT — expInc(j): write ALL owned blocks. put() skips empties; SKEL
   keeps the required leaves present at 0.
   ===================================================================== */
function expInc(j){
  const inc=S.C.inc||{}, D=inc.detail||{}, hp=S.C.hp||{}, calc=hp.calc||[], t=S.C.taxc||{};
  /* build a plain object, keeping only non-empty leaves */
  const ob=o=>{const r={};for(const k in o){const v=o[k];if(v!==undefined&&v!==null&&v!=="")r[k]=v;}return r;};

  /* ---- PersonalInfo ---- */
  put(j,"PersonalInfo.AssesseeName.FirstName",sv(S.pi.first));
  put(j,"PersonalInfo.AssesseeName.MiddleName",sv(S.pi.mid));
  put(j,"PersonalInfo.AssesseeName.SurNameOrOrgName",sv(S.pi.last));
  put(j,"PersonalInfo.PAN",sv(S.pi.pan));
  put(j,"PersonalInfo.Address.ResidenceNo",sv(S.pi.resNo));
  put(j,"PersonalInfo.Address.ResidenceName",sv(S.pi.resName));
  put(j,"PersonalInfo.Address.RoadOrStreet",sv(S.pi.road));
  put(j,"PersonalInfo.Address.LocalityOrArea",sv(S.pi.locality));
  put(j,"PersonalInfo.Address.CityOrTownOrDistrict",sv(S.pi.city));
  put(j,"PersonalInfo.Address.StateCode",sv(S.pi.state));
  put(j,"PersonalInfo.Address.CountryCode",sv(S.pi.country||"91"));
  if(N(S.pi.pin)) put(j,"PersonalInfo.Address.PinCode",R(N(S.pi.pin)));
  put(j,"PersonalInfo.Address.ZipCode",sv(S.pi.zip));
  if(N(S.pi.std))    put(j,"PersonalInfo.Address.Phone.STDcode",R(N(S.pi.std)));
  put(j,"PersonalInfo.Address.Phone.PhoneNo",sv(S.pi.phone));
  put(j,"PersonalInfo.Address.CountryCodeMobile",R(N(S.pi.mobcc)||91));
  if(N(S.pi.mobile)) put(j,"PersonalInfo.Address.MobileNo",R(N(S.pi.mobile)));
  put(j,"PersonalInfo.Address.EmailAddress",sv(S.pi.email));
  put(j,"PersonalInfo.Address.EmailAddressSec",sv(S.pi.emailSec));
  put(j,"PersonalInfo.SecondaryAdd",sv(S.pi.secAdd||"Y"));
  if(S.pi.secAdd==="N"){
    put(j,"PersonalInfo.AlternateAddress.ResidenceNo",sv(S.pi.altRes));
    put(j,"PersonalInfo.AlternateAddress.LocalityOrArea",sv(S.pi.altLoc));
    put(j,"PersonalInfo.AlternateAddress.CityOrTownOrDistrict",sv(S.pi.altCity));
    put(j,"PersonalInfo.AlternateAddress.StateCode",sv(S.pi.altState));
  }
  put(j,"PersonalInfo.DOB",ISO(S.pi.dob));
  put(j,"PersonalInfo.EmployerCategory",sv(S.pi.empcat||"OTH"));
  put(j,"PersonalInfo.Status",sv(S.pi.status||"I"));
  put(j,"PersonalInfo.AadhaarCardNo",sv(S.pi.aadhaar));

  /* ---- FilingStatus ---- */
  put(j,"FilingStatus.ReturnFileSec",R(N(S.fs.sec)||11));
  put(j,"FilingStatus.Form10IEAEarlierAYOldRegime",sv(S.fs.f10ieaEarlier||"NA"));
  if(S.fs.f10ieaEarlier==="Y"){
    put(j,"FilingStatus.Form10IEAAssYear",sv(S.fs.f10ieaAY));
    if(N(S.fs.f10ieaAck)) put(j,"FilingStatus.Form10IEAEarlierAYAckOldRegime",R(N(S.fs.f10ieaAck)));
  }
  if(S.fs.optout==="Yes"){
    put(j,"FilingStatus.F10IEACurrAYOldRegime","Y");
    put(j,"FilingStatus.F10IEADateCurrAYOldTax",ISO(S.fs.f10ieaDateCur));
    if(N(S.fs.f10ieaAckCur)) put(j,"FilingStatus.F10IEAAckNoCurrAYOldTax",R(N(S.fs.f10ieaAckCur)));
  }
  put(j,"FilingStatus.SeventhProvisio139",sv(S.fs.seventh));
  if(S.fs.seventh==="Y"){
    put(j,"FilingStatus.DepAmtAggAmtExcd1CrPrYrFlg",sv(S.fs.dep1cr));
    if(N(S.fs.dep1crAmt)) put(j,"FilingStatus.AmtSeventhProvisio139i",R(N(S.fs.dep1crAmt)));
    put(j,"FilingStatus.IncrExpAggAmt2LkTrvFrgnCntryFlg",sv(S.fs.trv2l));
    if(N(S.fs.trv2lAmt)) put(j,"FilingStatus.AmtSeventhProvisio139ii",R(N(S.fs.trv2lAmt)));
    put(j,"FilingStatus.IncrExpAggAmt1LkElctrctyPrYrFlg",sv(S.fs.ele1l));
    if(N(S.fs.ele1lAmt)) put(j,"FilingStatus.AmtSeventhProvisio139iii",R(N(S.fs.ele1lAmt)));
    put(j,"FilingStatus.clauseiv7provisio139i",sv(S.fs.clz));
    const cl=(S.fs.clause7||[]).filter(r=>st0(r.nat)||N(r.amt))
      .map(r=>({clauseiv7provisio139iNature:st0(r.nat),clauseiv7provisio139iAmount:R(N(r.amt))}));
    if(cl.length) put(j,"FilingStatus.clauseiv7provisio139iDtls",cl);
  }
  if([13,14,16,18,20].indexOf(+S.fs.sec)>=0){
    put(j,"FilingStatus.NoticeNo",sv(S.fs.noticeNo));
    put(j,"FilingStatus.NoticeDateUnderSec",ISO(S.fs.noticeDate));
  }
  if(+S.fs.sec===17){
    put(j,"FilingStatus.ReceiptNo",sv(S.fs.receipt));
    put(j,"FilingStatus.OrigRetFiledDate",ISO(S.fs.origDate));
  }
  put(j,"FilingStatus.AsseseeRepFlg",sv(S.fs.rep||"N"));
  if(S.fs.rep==="Y"){
    put(j,"FilingStatus.AssesseeRep.RepName",sv(S.fs.repName));
    put(j,"FilingStatus.AssesseeRep.RepEmailID",sv(S.fs.repEmail));
    put(j,"FilingStatus.AssesseeRep.CountryCodeRepMobileNo",91);
    if(N(S.fs.repMobile)) put(j,"FilingStatus.AssesseeRep.RepMobileNo",R(N(S.fs.repMobile)));
  }
  put(j,"FilingStatus.ItrFilingDueDate",sv(S.fs.duedate||"2026-08-31"));

  /* ---- IncomeDeductions ---- */
  put(j,"IncomeDeductions.IncomeFromBusinessProf",n0(D.e8));
  put(j,"IncomeDeductions.GrossSalary",n0(D.gross));
  if(N(D.gross)){
    if(N(IC.sal.s17_1)) put(j,"IncomeDeductions.Salary",n0(N(IC.sal.s17_1)));
    if(N(IC.sal.s17_2)) put(j,"IncomeDeductions.PerquisitesValue",n0(N(IC.sal.s17_2)));
    if(N(IC.sal.s17_3)) put(j,"IncomeDeductions.ProfitsInSalary",n0(N(IC.sal.s17_3)));
  }
  let exTotAll=0;
  const alwArr=(IC.sal.alw||[]).filter(r=>st0(r.nat)).map(r=>{
    const nat=st0(r.nat); const amt=(isNew()&&ALW_CLOSED_NEW[nat])?0:R(N(r.amt)); exTotAll+=amt;
    return {SalNatureDesc:nat,SalOthAmount:amt}; });
  if(alwArr.length){
    put(j,"IncomeDeductions.AllwncExemptUs10.AllwncExemptUs10Dtls",alwArr);
    put(j,"IncomeDeductions.AllwncExemptUs10.TotalAllwncExemptUs10",n0(exTotAll));
  }
  put(j,"IncomeDeductions.NetSalary",n0(D.netSal));
  put(j,"IncomeDeductions.DeductionUs16",n0(D.ded16));
  if(N(D.stdDed)) put(j,"IncomeDeductions.DeductionUs16ia",n0(D.stdDed));
  if(N(D.ent))    put(j,"IncomeDeductions.EntertainmntalwncUs16ii",n0(D.ent));
  if(N(D.ptax))   put(j,"IncomeDeductions.ProfessionalTaxUs16iii",n0(D.ptax));
  put(j,"IncomeDeductions.IncomeFromSal",n0(D.incSal));

  /* PropertyDetails[] — native array */
  const props=(IC.hp||[]).map((p,i)=>{
    const c=calc[i]||{};
    const el={};
    el.HPSNo=i+1;
    el.AddressDetailWithZipCode=ob({AddrDetail:sv(p.addr),CityOrTownOrDistrict:sv(p.city),
      StateCode:sv(p.state),CountryCode:sv(p.country||"91"),PinCode:N(p.pin)?R(N(p.pin)):undefined});
    if(sv(p.owner)) el.PropertyOwner=sv(p.owner);
    if(p.owner==="OT"&&sv(p.ownerOth)) el.PropertyOwnerOther=sv(p.ownerOth);
    el.PropCoOwnedFlg=sv(p.co||"NO");
    if(p.share!==""&&p.share!=null) el.AsseseeShareProperty=N(p.share);
    const co=(p.coown||[]).filter(o=>st0(o.name)).map((o,k)=>ob({CoOwnersSNo:k+1,NameCoOwner:sv(o.name),
      PAN_CoOwner:sv(o.pan),Aadhaar_CoOwner:sv(o.aadhaar),PercentShareProperty:(o.share!==""&&o.share!=null)?N(o.share):undefined}));
    if(co.length) el.CoOwners=co;
    if(sv(p.let)) el.ifLetOut=sv(p.let);
    const tn=(p.tenant||[]).filter(x=>st0(x.name)).map((x,k)=>ob({TenantSNo:k+1,NameofTenant:sv(x.name),
      PANofTenant:sv(x.pan),AadhaarofTenant:sv(x.aadhaar),PANTANofTenant:sv(x.pantan)}));
    if(tn.length) el.TenantDetails=tn;
    const loans=(p.loans||[]).filter(l=>st0(l.name)||N(l.intr)).map(l=>ob({LoanTknFrom:sv(l.from),
      BankOrInstnName:sv(l.name),LoanAccNoOfBankOrInstnRefNo:sv(l.accno),DateofLoan:ISO(l.date),
      TotalLoanAmt:R(N(l.total)),LoanOutstndngAmt:R(N(l.outst)),InterestUs24B:R(N(l.intr))}));
    const rd=ob({AnnualLetableValue:n0(c.a),RentNotRealized:N(c.b)?n0(c.b):undefined,
      LocalTaxes:N(c.c)?n0(c.c):undefined,TotalUnrealizedAndTax:n0(c.d),BalanceALV:n0(c.e),
      AnnualOfPropOwned:n0(c.f),ThirtyPercentOfBalance:n0(c.g),IntOnBorwCap:n0(c.intr),
      TotalDeduct:n0(c.totDed),ArrearsUnrealizedRentRcvd:N(c.j)?n0(c.j):undefined,IncomeOfHP:sg(c.k)});
    rd.Section24B=ob({TotalInterestUs24B:n0(c.intr)});
    if(loans.length) rd.Section24B.Section24BDtls=loans;
    el.Rentdetails=rd;
    return el;
  });
  if(props.length) put(j,"IncomeDeductions.PropertyDetails",props);
  put(j,"IncomeDeductions.TotalIncomeChargeableUnHP",sg(hp.income));

  /* OthersInc (other sources) — native array */
  put(j,"IncomeDeductions.IncomeOthSrc",n0(D.incOS));
  const osArr=(IC.os.rows||[]).filter(r=>st0(r.nat)).map(r=>{
    const nat=st0(r.nat);
    const amt=(nat==="DIV")?(N(r.q1)+N(r.q2)+N(r.q3)+N(r.q4)+N(r.q5)):N(r.amt);
    const el=ob({OthSrcNatureDesc:nat,OthSrcOthNatOfInc:(nat==="OTH")?sv(r.desc):undefined,OthSrcOthAmount:R(amt)});
    el.DividendInc={DateRange:{Upto15Of6:nat==="DIV"?R(N(r.q1)):0,Upto15Of9:nat==="DIV"?R(N(r.q2)):0,
      Up16Of9To15Of12:nat==="DIV"?R(N(r.q3)):0,Up16Of12To15Of3:nat==="DIV"?R(N(r.q4)):0,
      Up16Of3To31Of3:nat==="DIV"?R(N(r.q5)):0}};
    return el; });
  if(osArr.length) put(j,"IncomeDeductions.OthersInc.OthersIncDtlsOthSrc",osArr);
  if(!isNew() && N(D.ded57)) put(j,"IncomeDeductions.DeductionUs57iia",n0(D.ded57));

  put(j,"IncomeDeductions.GrossTotIncome",sg(t.gti));
  put(j,"IncomeDeductions.GrossTotIncomeIncLTCG112A",sg(t.gtiInc));
  /* Chapter VI-A per-line values: the `ded` builder hands over two ready-made,
     schema-keyed objects — usr (user-claimed) and cap (allowed, post-cap/regime)
     — each already carrying its own TotalChapVIADeductions. Drop every line in,
     so the summary blocks match their sub-schedules (rules A290/A293/A248/A18). */
  const dUsr=(S.C.ded||{}).usr||{}, dCap=(S.C.ded||{}).cap||{};
  const putVIA=(base,o)=>Object.keys(o).forEach(f=>{const v=o[f];
    put(j,base+"."+f, (typeof v==="number")?n0(v):v);});   /* amounts n0; qualifiers (PRANDtls[], disease, type) as-is */
  putVIA("IncomeDeductions.UsrDeductUndChapVIA",dUsr);
  putVIA("IncomeDeductions.DeductUndChapVIA",dCap);
  put(j,"IncomeDeductions.TotalIncome",sg(t.ti));

  /* ---- ScheduleBP ---- */
  const anyBP = R(D.e1)||R(D.e3)||R(D.e5)||R(D.e8)||(IC.bp.nad||[]).length||(IC.bp.nada||[]).length||(IC.bp.nae||[]).length;
  if(anyBP){
    const nad=(IC.bp.nad||[]).filter(r=>st0(r.name)).map(r=>ob({NameOfBusiness:sv(r.name),CodeAD:sv(r.code),Description:sv(r.desc)}));
    if(nad.length) put(j,"ScheduleBP.NatOfBus44AD",nad);
    if(R(D.e1)||R(D.e2c)) put(j,"ScheduleBP.PersumptiveInc44AD",ob({
      GrsTotalTrnOver:n0(D.e1),GrsTrnOverBank:N(D.e1a)?n0(D.e1a):undefined,
      GrsTotalTrnOverInCash:N(D.e1b)?n0(D.e1b):undefined,GrsTrnOverAnyOthMode:N(D.e1c)?n0(D.e1c):undefined,
      PersumptiveInc44AD6Per:N(D.e2a)?n0(D.e2a):undefined,PersumptiveInc44AD8Per:N(D.e2b)?n0(D.e2b):undefined,
      TotPersumptiveInc44AD:n0(D.e2c)}));
    const nada=(IC.bp.nada||[]).filter(r=>st0(r.name)).map(r=>ob({NameOfBusiness:sv(r.name),CodeADA:sv(r.code),Description:sv(r.desc)}));
    if(nada.length) put(j,"ScheduleBP.NatOfBus44ADA",nada);
    if(R(D.e3)||R(D.e4)) put(j,"ScheduleBP.PersumptiveInc44ADA",ob({
      GrsReceipt:n0(D.e3),GrsTrnOverBank44ADA:N(D.e3a)?n0(D.e3a):undefined,
      GrsTotalTrnOverInCash44ADA:N(D.e3b)?n0(D.e3b):undefined,GrsTrnOverAnyOthMode44ADA:N(D.e3c)?n0(D.e3c):undefined,
      TotPersumptiveInc44ADA:n0(D.e4)}));
    const nae=(IC.bp.nae||[]).filter(r=>st0(r.name)).map(r=>ob({NameOfBusiness:sv(r.name),CodeAE:sv(r.code),Description:sv(r.desc)}));
    if(nae.length) put(j,"ScheduleBP.NatOfBus44AE",nae);
    const gcv=(IC.bp.gcv||[]).filter(v=>st0(v.reg)).map(v=>ob({RegNumberGoodsCarriage:sv(v.reg),
      OwnedLeasedHiredFlag:sv(v.flag),TonnageCapacity:R(N(v.tonnage)),HoldingPeriod:R(N(v.months)),PresumptiveIncome:R(N(v.pi))}));
    if(gcv.length) put(j,"ScheduleBP.GoodsDtlsUs44AE",gcv);
    if(R(D.e5)||R(D.e7)||R(D.e8)) put(j,"ScheduleBP.PersumptiveInc44AE",ob({
      TotPersumInc44AE:n0(D.e5),SalInterestByFirm:N(D.e6)?n0(D.e6):undefined,
      TotalPersumptiveInc:n0(D.e7),IncChargeableUnderBus:n0(D.e8)}));
    let gstTot=0;
    const gst=(IC.bp.gstn||[]).filter(r=>st0(r.gstin)).map(r=>{gstTot+=N(r.amt);return ob({GSTINNo:sv(r.gstin),AmtTurnGrossRcptGSTIN:R(N(r.amt))});});
    if(gst.length){ put(j,"ScheduleBP.TurnoverGrsRcptForGSTIN",gst); put(j,"ScheduleBP.TotalTurnoverGrsRcptGSTIN",R(gstTot)); }
    const f=IC.bp.fin||{};
    const capL=N(f.owncap)+N(f.secured)+N(f.unsecured)+N(f.advances)+N(f.creditors)+N(f.othliab);
    const asst=N(f.fixed)+N(f.invest)+N(f.inventories)+N(f.debtors)+N(f.bank)+N(f.cash)+N(f.loans)+N(f.otherassets);
    const fin=ob({SundryCreditors:N(f.creditors)?R(N(f.creditors)):undefined,Inventories:N(f.inventories)?R(N(f.inventories)):undefined,
      SundryDebtors:N(f.debtors)?R(N(f.debtors)):undefined,BalWithBanks:N(f.bank)?R(N(f.bank)):undefined,
      CashInHand:N(f.cash)?R(N(f.cash)):undefined,TotCapLiabilities:capL?R(capL):undefined,TotalAssets:asst?R(asst):undefined});
    if(Object.keys(fin).length) put(j,"ScheduleBP.FinanclPartclrOfBusiness",fin);
  }

  /* ---- TaxComputation (Part D) ---- */
  put(j,"TaxComputation.TotalTaxPayable",n0(t.d1));
  put(j,"TaxComputation.Rebate87A",n0(t.d2));
  put(j,"TaxComputation.TaxPayableOnRebate",n0(t.d3));
  put(j,"TaxComputation.EducationCess",n0(t.d4));
  put(j,"TaxComputation.GrossTaxLiability",n0(t.d5));
  if(N(t.d6)) put(j,"TaxComputation.Section89",n0(t.d6));
  put(j,"TaxComputation.NetTaxLiability",n0(t.d7));
  put(j,"TaxComputation.IntrstPay.IntrstPayUs234A",n0(t.i234a));
  put(j,"TaxComputation.IntrstPay.IntrstPayUs234B",n0(t.i234b));
  put(j,"TaxComputation.IntrstPay.IntrstPayUs234C",n0(t.i234c));
  put(j,"TaxComputation.IntrstPay.LateFilingFee234F",n0(t.fee234f));
  if(N(t.fee234i)) put(j,"TaxComputation.IntrstPay.FeeFurnish234I",n0(t.fee234i));
  put(j,"TaxComputation.TotTaxPlusIntrstPay",n0(t.d12));

  /* ---- LTCG112A (D20a) ---- */
  put(j,"LTCG112A.TotSaleCnsdrn",n0(N(IC.ltcg.sale)));
  put(j,"LTCG112A.TotCstAcqisn",n0(N(IC.ltcg.cost)));
  put(j,"LTCG112A.LongCap112A",n0(D.long112a));

  /* ---- TaxExmpIntIncDtls (D20 exempt income) ---- */
  let exemptTot=0;
  const exArr=(IC.exmp||[]).filter(r=>N(r.amt)||st0(r.cat)).map(r=>{exemptTot+=N(r.amt);
    return ob({Category:sv(r.cat),SubCategory:sv(r.sub),Description:sv(r.desc),OthAmount:R(N(r.amt))});});
  if(exArr.length){
    put(j,"TaxExmpIntIncDtls.OthersInc.OthersIncDtls",exArr);
    put(j,"TaxExmpIntIncDtls.OthersInc.OthersTotalTaxExe",R(exemptTot));
  }
}

/* =====================================================================
   IMPORT — impInc(I4): inverse. Returns short labels of what was read.
   ===================================================================== */
function impInc(I4){
  const read=[]; if(!I4) return read;
  const P=I4.PersonalInfo, FSt=I4.FilingStatus, ID=I4.IncomeDeductions,
        TC=I4.TaxComputation, BP=I4.ScheduleBP, LT=I4.LTCG112A, EX=I4.TaxExmpIntIncDtls;
  if(P){
    const nm=P.AssesseeName||{}; S.pi.first=nm.FirstName||""; S.pi.mid=nm.MiddleName||""; S.pi.last=nm.SurNameOrOrgName||"";
    S.pi.pan=P.PAN||S.pi.pan;
    const a=P.Address||{}; S.pi.resNo=a.ResidenceNo||""; S.pi.resName=a.ResidenceName||""; S.pi.road=a.RoadOrStreet||"";
    S.pi.locality=a.LocalityOrArea||""; S.pi.city=a.CityOrTownOrDistrict||""; S.pi.state=a.StateCode||"";
    S.pi.country=a.CountryCode||"91"; S.pi.pin=a.PinCode!=null?String(a.PinCode):""; S.pi.zip=a.ZipCode||"";
    if(a.Phone){ S.pi.std=a.Phone.STDcode!=null?String(a.Phone.STDcode):""; S.pi.phone=a.Phone.PhoneNo||""; }
    S.pi.mobcc=a.CountryCodeMobile!=null?String(a.CountryCodeMobile):"91";
    S.pi.mobile=a.MobileNo!=null?String(a.MobileNo):""; S.pi.email=a.EmailAddress||""; S.pi.emailSec=a.EmailAddressSec||"";
    S.pi.secAdd=P.SecondaryAdd||"Y";
    const alt=P.AlternateAddress||{}; S.pi.altRes=alt.ResidenceNo||""; S.pi.altLoc=alt.LocalityOrArea||"";
    S.pi.altCity=alt.CityOrTownOrDistrict||""; S.pi.altState=alt.StateCode||"";
    S.pi.dob=dmy(P.DOB)||S.pi.dob; S.pi.empcat=P.EmployerCategory||"OTH"; S.pi.status=P.Status||"I"; S.pi.aadhaar=P.AadhaarCardNo||"";
    read.push("personal info");
  }
  if(FSt){
    S.fs.sec=FSt.ReturnFileSec!=null?FSt.ReturnFileSec:11;
    S.fs.f10ieaEarlier=FSt.Form10IEAEarlierAYOldRegime||"NA";
    S.fs.f10ieaAY=FSt.Form10IEAAssYear||""; S.fs.f10ieaAck=FSt.Form10IEAEarlierAYAckOldRegime||"";
    S.fs.optout=(FSt.F10IEACurrAYOldRegime==="Y")?"Yes":"No";
    S.fs.f10ieaDateCur=dmy(FSt.F10IEADateCurrAYOldTax)||""; S.fs.f10ieaAckCur=FSt.F10IEAAckNoCurrAYOldTax||"";
    S.fs.seventh=FSt.SeventhProvisio139||"N";
    S.fs.dep1cr=FSt.DepAmtAggAmtExcd1CrPrYrFlg||""; S.fs.dep1crAmt=FSt.AmtSeventhProvisio139i||"";
    S.fs.trv2l=FSt.IncrExpAggAmt2LkTrvFrgnCntryFlg||""; S.fs.trv2lAmt=FSt.AmtSeventhProvisio139ii||"";
    S.fs.ele1l=FSt.IncrExpAggAmt1LkElctrctyPrYrFlg||""; S.fs.ele1lAmt=FSt.AmtSeventhProvisio139iii||"";
    S.fs.clz=FSt.clauseiv7provisio139i||"";
    S.fs.clause7=(FSt.clauseiv7provisio139iDtls||[]).map(r=>({nat:r.clauseiv7provisio139iNature||"",amt:r.clauseiv7provisio139iAmount||""}));
    S.fs.noticeNo=FSt.NoticeNo||""; S.fs.noticeDate=dmy(FSt.NoticeDateUnderSec)||"";
    S.fs.receipt=FSt.ReceiptNo||""; S.fs.origDate=dmy(FSt.OrigRetFiledDate)||"";
    S.fs.rep=FSt.AsseseeRepFlg||"N";
    const rp=FSt.AssesseeRep||{}; S.fs.repName=rp.RepName||""; S.fs.repEmail=rp.RepEmailID||""; S.fs.repMobile=rp.RepMobileNo!=null?String(rp.RepMobileNo):"";
    S.fs.duedate=FSt.ItrFilingDueDate||"2026-08-31";
    read.push("filing status & regime");
  }
  if(ID){
    S.ic.sal.s17_1=ID.Salary||""; S.ic.sal.s17_2=ID.PerquisitesValue||""; S.ic.sal.s17_3=ID.ProfitsInSalary||"";
    S.ic.sal.ent=ID.EntertainmntalwncUs16ii||""; S.ic.sal.ptax=ID.ProfessionalTaxUs16iii||"";
    const alw=(ID.AllwncExemptUs10||{}).AllwncExemptUs10Dtls||[];
    S.ic.sal.alw=alw.map(r=>({nat:r.SalNatureDesc||"",amt:r.SalOthAmount||""}));
    S.ic.hp=(ID.PropertyDetails||[]).map(p=>{
      const rd=p.Rentdetails||{}, ad=p.AddressDetailWithZipCode||{}, s24=(rd.Section24B||{}).Section24BDtls||[];
      return { addr:ad.AddrDetail||"", city:ad.CityOrTownOrDistrict||"", state:ad.StateCode||"",
        country:ad.CountryCode||"91", pin:ad.PinCode!=null?String(ad.PinCode):"",
        owner:p.PropertyOwner||"", ownerOth:p.PropertyOwnerOther||"", co:p.PropCoOwnedFlg||"NO",
        share:p.AsseseeShareProperty!=null?p.AsseseeShareProperty:"", let:p.ifLetOut||"",
        coown:(p.CoOwners||[]).map(o=>({name:o.NameCoOwner||"",pan:o.PAN_CoOwner||"",aadhaar:o.Aadhaar_CoOwner||"",share:o.PercentShareProperty!=null?o.PercentShareProperty:""})),
        tenant:(p.TenantDetails||[]).map(tn=>({name:tn.NameofTenant||"",pan:tn.PANofTenant||"",aadhaar:tn.AadhaarofTenant||"",pantan:tn.PANTANofTenant||""})),
        gross:rd.AnnualLetableValue||"", notReal:rd.RentNotRealized||"", localTax:rd.LocalTaxes||"",
        arrears:rd.ArrearsUnrealizedRentRcvd||"",
        loans:s24.map(l=>({from:l.LoanTknFrom||"",name:l.BankOrInstnName||"",accno:l.LoanAccNoOfBankOrInstnRefNo||"",
          date:dmy(l.DateofLoan)||"",total:l.TotalLoanAmt||"",outst:l.LoanOutstndngAmt||"",intr:l.InterestUs24B||""})) };
    });
    const os=(ID.OthersInc||{}).OthersIncDtlsOthSrc||[];
    S.ic.os.rows=os.map(r=>{ const dr=(r.DividendInc||{}).DateRange||{};
      return { nat:r.OthSrcNatureDesc||"", desc:r.OthSrcOthNatOfInc||"", amt:r.OthSrcOthAmount||"",
        q1:dr.Upto15Of6||"",q2:dr.Upto15Of9||"",q3:dr.Up16Of9To15Of12||"",q4:dr.Up16Of12To15Of3||"",q5:dr.Up16Of3To31Of3||"" }; });
    S.ic.os.fp57=ID.DeductionUs57iia||"";
    read.push("income & deductions");
  }
  if(BP){
    S.ic.bp.nad=(BP.NatOfBus44AD||[]).map(r=>({name:r.NameOfBusiness||"",code:r.CodeAD||"",desc:r.Description||""}));
    const ad=BP.PersumptiveInc44AD||{}; S.ic.bp.ad={bank:ad.GrsTrnOverBank||"",cash:ad.GrsTotalTrnOverInCash||"",other:ad.GrsTrnOverAnyOthMode||"",claim6:ad.PersumptiveInc44AD6Per||"",claim8:ad.PersumptiveInc44AD8Per||""};
    S.ic.bp.nada=(BP.NatOfBus44ADA||[]).map(r=>({name:r.NameOfBusiness||"",code:r.CodeADA||"",desc:r.Description||""}));
    const ada=BP.PersumptiveInc44ADA||{}; S.ic.bp.ada={bank:ada.GrsTrnOverBank44ADA||"",cash:ada.GrsTotalTrnOverInCash44ADA||"",other:ada.GrsTrnOverAnyOthMode44ADA||"",claim:ada.TotPersumptiveInc44ADA||""};
    S.ic.bp.nae=(BP.NatOfBus44AE||[]).map(r=>({name:r.NameOfBusiness||"",code:r.CodeAE||"",desc:r.Description||""}));
    S.ic.bp.gcv=(BP.GoodsDtlsUs44AE||[]).map(v=>({reg:v.RegNumberGoodsCarriage||"",flag:v.OwnedLeasedHiredFlag||"",tonnage:v.TonnageCapacity||"",months:v.HoldingPeriod||"",pi:v.PresumptiveIncome||""}));
    S.ic.bp.ae={salint:(BP.PersumptiveInc44AE||{}).SalInterestByFirm||""};
    S.ic.bp.gstn=(BP.TurnoverGrsRcptForGSTIN||[]).map(r=>({gstin:r.GSTINNo||"",amt:r.AmtTurnGrossRcptGSTIN||""}));
    const f=BP.FinanclPartclrOfBusiness||{}; S.ic.bp.fin={creditors:f.SundryCreditors||"",inventories:f.Inventories||"",debtors:f.SundryDebtors||"",bank:f.BalWithBanks||"",cash:f.CashInHand||""};
    read.push("presumptive business (BP)");
  }
  if(TC){
    S.ic.d.relief89=TC.Section89||""; const ip=TC.IntrstPay||{};
    S.ic.d.int234a=ip.IntrstPayUs234A||""; S.ic.d.int234b=ip.IntrstPayUs234B||""; S.ic.d.int234c=ip.IntrstPayUs234C||"";
    S.ic.d.fee234f=ip.LateFilingFee234F||""; S.ic.d.fee234i=ip.FeeFurnish234I||"";
    read.push("tax computation");
  }
  if(LT){ S.ic.ltcg={sale:LT.TotSaleCnsdrn||"",cost:LT.TotCstAcqisn||""}; read.push("LTCG 112A"); }
  if(EX){ S.ic.exmp=((EX.OthersInc||{}).OthersIncDtls||[]).map(r=>({cat:r.Category||"",sub:r.SubCategory||"",desc:r.Description||"",amt:r.OthAmount||""})); read.push("exempt income"); }
  return read;
}

function chkInc(){
  const out=[], D=(S.C.inc||{}).detail||{};
  /* 44AD turnover / audit thresholds (BP.md [O26]) */
  if(N(D.e1)>0){
    const cashPct=N(D.e1)?(N(D.e1b)/N(D.e1)*100):0;
    const cap=cashPct>5?20000000:30000000;
    if(N(D.e1)>cap) out.push({lvl:"warn",t:"44AD turnover exceeds cap",m:"Gross turnover exceeds the ₹"+(cap/10000000)+" crore presumptive cap"+(cashPct>5?" (cash > 5%)":"")+".",sec:"inc"});
  }
  if(N(D.e3)>7500000) out.push({lvl:"warn",t:"44ADA receipts exceed cap",m:"Gross receipts u/s 44ADA exceed the ₹75 lakh cap.",sec:"inc"});
  if((S.ic.bp.gcv||[]).length>10) out.push({lvl:"err",t:"Too many goods carriages",m:"Schedule 44AE allows at most 10 goods-carriage rows.",sec:"inc"});
  (S.ic.bp.gcv||[]).forEach((v,i)=>{ const m=N(v.months); if(v.months!==""&&(m<1||m>12)) out.push({lvl:"err",t:"Vehicle months out of range",m:"Vehicle "+(i+1)+": months owned/leased/hired must be 1–12.",sec:"inc"}); });
  /* new-regime closed exempt allowances carrying value */
  if(isNew()) (S.ic.sal.alw||[]).forEach(r=>{ if(ALW_CLOSED_NEW[st0(r.nat)]&&N(r.amt)>0)
    out.push({lvl:"warn",t:"Exempt allowance closed in new regime",m:st0(r.nat)+" is not exempt under the new regime and is treated as 0.",sec:"inc"}); });
  if(N(D.ltGain)>125000) out.push({lvl:"warn",t:"LTCG 112A above ₹1.25L",m:"LTCG u/s 112A exceeds ₹1,25,000; it is reported as 0 here and this return may not be eligible for ITR-4.",sec:"inc"});
  return out;
}
reg({id:"inc", t:"Income", ref:"Income Details (Part B)", f:secInc,
  s:()=>{const A=S.C.inc||{};const v=N(A.salary)+N(A.bp)+N(A.os);return v?RS(v):"";},
  eng:engInc, exp:expInc, imp:impInc, chk:chkInc, order:20});