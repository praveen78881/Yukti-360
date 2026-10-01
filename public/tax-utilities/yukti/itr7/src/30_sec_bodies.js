/* =====================================================================
   ITR-7 · Section "bodies" — special-body disclosures:
     · Schedule PP — Political Party (section 13A / 29A / 29C)
     · Schedule ET — Electoral Trust (section 13B / rule 17CA)
     · Schedule SH — Shareholding of an unlisted company
   Books: books/ITR-7/{Schedule_PP.md, Schedule_ET.md, Schedule_SH.md}
   Schema blocks (top-level properties of ITR7):
     SchedulePP  (single-instance scalars + optional AuditDetailsSchPP obj)
     ScheduleET  (scalars + required object VoluntaryContributionDtls, 8 leaves)
     ScheduleSH  (ShrhldngUnlistedCompany: three unlimited arrays)

   MOSTLY DISCLOSURE. The section adds nothing to GTI and consumes no
   upstream S.C.* value. It computes only the few derived rows the utility
   shows read-only:
     · PP  TotVCReceived = b + d   (upto-20000 band + above-20000 band)
     · ET  iii = i + ii; vi = iv + v(capped); vii = ii when iv >= 95% of iii;
            viii = iii - vi; and the 5%/Rs.5,00,000 admin-spend cap on v.
   The hidden PP Income & Expenditure statement (rows 35-56) is populated by
   the I&E computation elsewhere and is NOT part of the filed SchedulePP leaf
   set (book §1), so it is not built here.

   Unlike ITR-6, ITR-7 Schedule SH carries ONLY ShrhldngUnlistedCompany —
   there is no start-up SH-2 object on this form (Schedule_SH.md §1/App 4).

   Enum CODES are the schema's, taken from books/ITR-7/enums.json (the Yes/No
   gates file as "Y"/"N"; the election-commission list as numeric codes
   "1".."33"; residential status RES/NRI/NOR; share types differ per table;
   cessation mode TS/RR). No ITR-6 code list is ported.

   Publishes S.C.bodies.* (nothing else writes it). Consumes no S.C.*.
   ===================================================================== */

/* ---- dropdown value lists (books' appendices, codes = enums.json) ---- */
const BOD_YN=[["Y","Yes"],["N","No"]];                 /* filed as Y/N codes */
/* Schedule PP · Election Commission list — codes 1..33 (enums.json) */
const BOD_ECI=[
  ["1","Andhra Pradesh State Election Commission"],["2","Arunachal Pradesh State Election Commission"],
  ["3","Assam State Election Commission"],["4","Bihar State Election Commission"],
  ["5","Chhattisgarh State Election Commission"],["6","Delhi State Election Commission"],
  ["7","Goa State Election Commission"],["8","Gujarat State Election Commission"],
  ["9","Haryana State Election Commission"],["10","Himachal Pradesh State Election Commission"],
  ["11","Jammu and Kashmir State Election Commission"],["12","Jharkhand State Election Commission"],
  ["13","Karnataka State Election Commission"],["14","Kerala State Election Commission"],
  ["15","Madhya Pradesh State Election Commission"],["16","Maharashtra State Election Commission"],
  ["17","Manipur State Election Commission"],["18","Meghalaya State Election Commission"],
  ["19","Mizoram State Election Commission"],["20","Nagaland State Election Commission"],
  ["21","Odisha State Election Commission"],["22","Punjab State Election Commission"],
  ["23","Puducherry State Election Commission"],["24","Rajasthan State Election Commission"],
  ["25","Sikkim State Election Commission"],["26","Tamil Nadu State Election Commission"],
  ["27","Telangana State Election Commission"],["28","Tripura State Election Commission"],
  ["29","Uttar Pradesh State Election Commission"],["30","Uttarakhand State Election Commission"],
  ["31","West Bengal State Election Commission"],
  ["32","Common Election Commission for the UTs of Andaman and Nicobar Islands, Lakshadweep, Dadra & Nagar Haveli and Daman & Diu"],
  ["33","Election Commission of India"]];
/* Schedule SH enums (differ per table — seed each from its own list) */
const BOD_RES=[["RES","Resident"],["NRI","Non Resident"],["NOR","Resident but not Ordinarily resident"]];
const BOD_ST_A=[["ES","Equity Shares"],["PS","Preference Shares"],["RS","Rights Shares"],["SS","Sweat Equity Shares"],["BS","Bonus Shares"]];             /* Part A */
const BOD_ST_B=[["ES","Equity Shares"],["PS","Preference Shares"],["RS","Rights Shares"],["SS","Sweat Equity Shares"],["OT","Others"]];                    /* Part B */
const BOD_ST_C=[["ES","Equity Shares"],["PS","Preference Shares"],["SS","Sweat equity"],["BS","Bonus Shares"]];                                            /* Part C */
const BOD_MODE=[["TS","Transfer/Sale"],["RR","Relinquishment of rights"]];

const BOD_ADMIN_MAX=500000;   /* ET admin-spend ceiling (Rs 5,00,000) */

/* ---- Schedule SH tables — {path(state==render key), sk(schema key), label, cols} ---- */
/* column meta: {k(=schema key),h,t,opts,req,max}; t in txt|sel|date|num|pan */
const bT=(k,h,req,max)=>({k,h,t:"txt",req:req?1:0,max:max||125});
const bP=(k,h,req)=>({k,h,t:"pan",req:req?1:0,max:10});
const bDt=(k,h,req)=>({k,h,t:"date",req:req?1:0,max:10});
const bN=(k,h,req)=>({k,h,t:"num",req:req?1:0});
const bS=(k,h,opts,req)=>({k,h,t:"sel",opts,req:req?1:0});
const BOD_SH={
  a:{path:"bodies.sh.a", sk:"DtlsSHEndPreviousYearUC",
     label:"A — Shareholding at the end of the previous year", cols:[
     bT("ShareholderName","Name of the shareholder",1,125),
     bS("ResidentialStatus","Residential status in India",BOD_RES,1),
     bS("ShareType","Type of share",BOD_ST_A,1),
     bP("PAN","PAN",1),
     bDt("AcquisitionDate","Date of acquisition",1),
     bN("NumberOfSharesHeld","Number of shares held",1),
     bN("FaceValuePerShare","Face value per share",1),
     bN("IssuePricePerShare","Issue Price per share",1),
     bN("AmountReceived","Amount received",1)]},
  b:{path:"bodies.sh.b", sk:"DtlsEquityShareEndPrvYr",
     label:"B — Equity share application money pending allotment at the end of the previous year", cols:[
     bT("ApplicantName","Name of the applicant",1,125),
     bS("ResidentialStatus","Residential status in India",BOD_RES,1),
     bS("ShareType","Type of share",BOD_ST_B,1),
     bT("ShareTypeOthers","Description (if type = Others)",0,125),
     bP("PAN","PAN",1),
     bDt("ApplicationDate","Date of application",1),
     bN("NumberOfSharesApplied","Number of shares applied for",1),
     bN("ApplicationMoneyReceived","Application money received",1),
     bN("FaceValuePerShare","Face value per share",1),
     bN("ProposedIssuePrice","Proposed issue price",1)]},
  c:{path:"bodies.sh.c", sk:"SHDtlsAnyTimePrevYearUC",
     label:"C — Shareholders during the year who are not shareholders at the end of the previous year", cols:[
     bT("ShareholderName","Name of the shareholder",1,125),
     bS("ResidentialStatus","Residential status in India",BOD_RES,1),
     bS("ShareType","Type of share",BOD_ST_C,1),
     bP("PAN","PAN",1),
     bN("NumberOfSharesHeld","Number of shares held",1),
     bN("FaceValuePerShare","Face value per share",1),
     bN("IssuePricePerShare","Issue Price per share",1),
     bN("AmountReceived","Amount received",1),
     bDt("AcquisitionDate","Date of acquisition",1),
     bDt("CeaseShareholderDate","Date on which cease to be shareholder",1),
     bS("CessationMode","Mode of cessation",BOD_MODE,1),
     bP("NewShareholderPAN","In case of transfer, PAN of the shareholder",0)]}
};
const BOD_SH_KEYS=["a","b","c"];

/* ---- state init (idempotent; never throws on empty state) ---------- */
function bodiesInit(){
  S.bodies=S.bodies||{};
  S.bodies.pp=S.bodies.pp||{on:""};
  S.bodies.et=S.bodies.et||{on:""};
  S.bodies.sh=S.bodies.sh||{on:""};
  BOD_SH_KEYS.forEach(k=>{ if(!Array.isArray(get(BOD_SH[k].path))) set(BOD_SH[k].path,[]); });
}

/* ---- row coercion (state row <-> schema row) ---------------------- */
function bodRowOut(r,cols){
  r=r||{}; const o={}; let any=false;
  cols.forEach(c=>{ const raw=r[c.k], s=st0(raw); let v;
    if(c.t==="num")       v=(s==="")?undefined:n0(raw);
    else if(c.t==="date") v=ISO(raw);
    else if(c.t==="pan")  v=s?s.toUpperCase():undefined;
    else                  v=(s==="")?undefined:s.slice(0,c.max||125);
    if(v!==undefined){ o[c.k]=v; any=true; }});
  return any?o:null;
}
function bodRowIn(sr,cols){
  sr=sr||{}; const o={};
  cols.forEach(c=>{ const v=sr[c.k];
    if(v===undefined||v===null||v==="") return;
    o[c.k]=(c.t==="date")?dmy(v):v; });
  return o;
}

/* ---- helpers -------------------------------------------------------- */
const bodYN=v=>st0(v)==="Y"?"Y":"N";                   /* default No */
const bodCount=()=>BOD_SH_KEYS.reduce((a,k)=>a+(get(BOD_SH[k].path)||[]).length,0);

/* ---- engine — no GTI contribution; publishes derived rows only ----- */
function engBodies(){
  bodiesInit();
  const B=S.bodies, C={income:0};
  C.ppOn=bodYN((B.pp||{}).on); C.etOn=bodYN((B.et||{}).on); C.shOn=bodYN((B.sh||{}).on);
  /* PP: TotVCReceived = b (<=20000) + d (>20000) */
  const p=B.pp||{};
  C.pp={ totVC: n0(N(p.vcUpto20000)+N(p.vcMore20000)) };
  /* ET: the read-only arithmetic and the 5%/Rs.5,00,000 admin cap */
  const e=B.et||{};
  const opBal=N(e.opBal), vcYr=N(e.vcYr), amtDist=N(e.amtDist), amtAdmin=N(e.amtAdmin);
  const totAfter=opBal+vcYr;
  const adminCap=Math.min(vcYr*0.05, BOD_ADMIN_MAX);
  const adminPermitted=Math.min(amtAdmin, adminCap);
  const total=amtDist+adminPermitted;
  const exe13B=(totAfter>0 && amtDist>=0.95*totAfter)?vcYr:0;   /* eligible u/s 13B (row ii) when >=95% distributed */
  C.et={ totAfter:n0(totAfter), adminCap:n0(adminCap), adminPermitted:n0(adminPermitted),
         total:n0(total), exe13B:n0(exe13B), closeBal:n0(totAfter-total),
         adminOver: amtAdmin>adminCap+0.5 };
  C.rows=bodCount();
  S.C.bodies=C;
}

/* ---- renderer ------------------------------------------------------- */
function bodGcols(cols){
  return cols.map(c=>{
    const t=c.t==="date"?"date":(c.t==="sel"?"sel":(c.t==="num"?"num":"txt"));
    const g={h:c.h,k:c.k,t:t};
    if(c.opts)g.opts=c.opts; if(c.req)g.req=1; if(c.max)g.max=c.max;
    return g;});
}
function bodGrid(def){
  return grid(def.path,bodGcols(def.cols),get(def.path)||[],
    {min:(def.cols.length*150+90)+"px", empty:"No rows yet — click Add a row.", add:"Add a row"});
}

function secBodies(){
  bodiesInit(); const B=S.bodies, Cb=(S.C.bodies||{});
  let h="";
  h+=note("<b>Special-body disclosures.</b> Schedule PP (a political party under s.13A), Schedule ET "+
    "(an electoral trust under s.13B / rule 17CA) and Schedule SH (an unlisted company's shareholders). "+
    "Fill only the schedule for the body you are. Nothing here is added to total income. Dates are "+DF+".");

  /* ===================== Schedule PP ===================== */
  h+=sub("Schedule PP · Political Party (section 13A)");
  h+=row("Are you a political party filing Schedule PP?",sel("bodies.pp.on",BOD_YN),
    {req:1,ref:"[Sch PP]"});
  if(bodYN((B.pp||{}).on)==="Y"){
    const p=B.pp||{};
    h+=row("Whether registered under section 29A of the Representation of the People Act, 1951",
      sel("bodies.pp.reg",BOD_YN,{blank:false}),{req:1,ref:"1A / E4"});
    if(bodYN(p.reg)==="Y"){
      h+=row("Registration number",inp("bodies.pp.regNum",{max:25}),{ind:1,ref:"a / E5"});
      h+=row("Date of registration",dte("bodies.pp.regDate"),{ind:1,ref:"b / E6"});
    }
    h+=row("Whether recognized by the Election Commission of India",
      sel("bodies.pp.eci",BOD_YN,{blank:false}),{req:1,ref:"1B / E7"});
    if(bodYN(p.eci)==="Y")
      h+=row("Date of recognition",dte("bodies.pp.eciDate"),{ind:1,ref:"a / E8"});
    h+=row("Whether books of account were maintained?",
      sel("bodies.pp.books",BOD_YN,{blank:false}),{req:1,ref:"E9",hint:"section 13A(a)"});
    h+=row("Whether the accounts have been audited?",
      sel("bodies.pp.audited",BOD_YN,{blank:false}),{req:1,ref:"E12",hint:"section 13A(c)"});
    if(bodYN(p.audited)==="Y"){
      h+=note("Auditor particulars (audit report):");
      h+=row("Date of furnishing of the audit report",dte("bodies.pp.audDateFurnish"),{ind:1,ref:"a / F14"});
      h+=row("Name of the auditor signing the audit report",inp("bodies.pp.audName",{max:125}),{ind:1,ref:"b / F15"});
      h+=row("Membership No. of the auditor",inp("bodies.pp.audMemNo",{max:6}),{ind:1,ref:"c / F16",hint:"six digits"});
      h+=row("Name of the auditor (proprietorship / firm)",inp("bodies.pp.audFrmName",{max:125}),{ind:1,ref:"d / F17"});
      h+=row("Proprietorship / firm registration No.",inp("bodies.pp.audFrmRegNo",{max:8}),{ind:1,ref:"e / F18",hint:"eight characters"});
      h+=row("PAN of the auditor (proprietorship / firm)",inp("bodies.pp.audFrmPAN",{max:10}),{ind:1,ref:"f / F19"});
      h+=row("Aadhaar Number of the Auditor (proprietorship)",inp("bodies.pp.audFrmAadhaar",{max:12}),{ind:1,ref:"F20",hint:"twelve digits"});
      h+=row("Date of audit report",dte("bodies.pp.audDate"),{ind:1,ref:"g / F21"});
    }
    h+=row("Whether the report under sub-section (3) of section 29C of the RP Act, 1951 was furnished",
      sel("bodies.pp.report29",BOD_YN,{blank:false}),{req:1,ref:"E22"});
    if(bodYN(p.report29)==="Y"){
      h+=row("Date of submission of the report",dte("bodies.pp.subDate"),{ind:1,ref:"4a / F23"});
      h+=row("Election Commission to whom the report has been submitted",
        sel("bodies.pp.eciList",BOD_ECI),{ind:1,ref:"4b / F24"});
    }
    h+=row("Whether any voluntary contribution from any person in excess of twenty thousand rupees was received",
      sel("bodies.pp.vc",BOD_YN,{blank:false}),{req:1,ref:"5a / E25",hint:"section 13A(b)"});
    h+=row("If yes, whether record of each voluntary contribution (other than by electoral bond) was maintained",
      sel("bodies.pp.vcElecBond",BOD_YN,{blank:false}),{req:1,ref:"5b / E26"});
    h+=row("Whether any donation exceeding two thousand rupees was received otherwise than by account-payee "+
      "cheque / draft / bank / electoral bond",sel("bodies.pp.donExc",BOD_YN,{blank:false}),
      {req:1,ref:"E27",hint:"section 13A(d)"});
    h+=note("Aggregate value of voluntary contributions (rupees):");
    h+=row("Aggregate value of all voluntary contributions received upto Rs. 20,000",
      inp("bodies.pp.vcUpto20000",{n:1}),{ind:1,ref:"b / F30"});
    h+=row("Aggregate value of all voluntary contributions received upto Rs. 2,000 in cash",
      inp("bodies.pp.vc2000Cash",{n:1}),{ind:1,ref:"ci / F31"});
    h+=row("Aggregate value of all voluntary contributions received upto Rs. 2,000 other than in cash",
      inp("bodies.pp.vc2000Other",{n:1}),{ind:1,ref:"cii / F32"});
    h+=row("Aggregate value of all voluntary contributions received more than Rs. 20,000",
      inp("bodies.pp.vcMore20000",{n:1}),{ind:1,ref:"d / F33"});
    h+=row("Total voluntary contributions received during the F.Y. (b + d)",
      cell((Cb.pp||{}).totVC),{ref:"a / F29",hint:"computed"});
  } else if(bodYN((B.pp||{}).on)==="N"){
    h+=note("Not a political party — Schedule PP will not be exported.");
  }

  /* ===================== Schedule ET ===================== */
  h+=sub("Schedule ET · Electoral Trust (section 13B / rule 17CA)");
  h+=row("Are you an electoral trust filing Schedule ET?",sel("bodies.et.on",BOD_YN),
    {req:1,ref:"[Sch ET]"});
  if(bodYN((B.et||{}).on)==="Y"){
    const et=B.et||{}, ce=(Cb.et||{});
    h+=row("Whether books of account were maintained?",sel("bodies.et.books",BOD_YN,{blank:false}),
      {req:1,ref:"E4"});
    h+=row("Whether record of each voluntary contribution (with name, address and PAN of the contributor) was maintained?",
      sel("bodies.et.vc",BOD_YN,{blank:false}),{req:1,ref:"E5"});
    h+=row("Whether record of each eligible political party to whom the distributable contributions were distributed was maintained?",
      sel("bodies.et.records",BOD_YN,{blank:false}),{req:1,ref:"E6"});
    h+=row("Whether the accounts have been audited as per rule 17CA(12)?",
      sel("bodies.et.audited",BOD_YN,{blank:false}),{req:1,ref:"E7"});
    if(bodYN(et.audited)==="Y")
      h+=row("Date of audit report in Form No. 10BC",dte("bodies.et.audDate"),{ind:1,ref:"E8"});
    h+=row("Whether the report as per rule 17CA(14) was furnished to the Commissioner / Director of Income-tax?",
      sel("bodies.et.report17CA",BOD_YN,{blank:false}),{req:1,ref:"E9"});
    h+=note("Details of voluntary contributions received and amounts distributed during the year (rupees):");
    h+=row("i · Opening balance as on 1st April",inp("bodies.et.opBal",{n:1}),{ind:1,ref:"i / F11"});
    h+=row("ii · Voluntary contribution received during the year",inp("bodies.et.vcYr",{n:1}),{ind:1,ref:"ii / F12"});
    h+=row("iii · Total (i + ii)",cell(ce.totAfter),{ind:1,ref:"iii / F13",hint:"computed"});
    h+=row("iv · Amount distributed to political parties",inp("bodies.et.amtDist",{n:1}),{ind:1,ref:"iv / F14"});
    h+=row("v · Amount spent on administrative and management functions",inp("bodies.et.amtAdmin",{n:1}),
      {ind:1,ref:"v / F15",hint:"restricted to 5% of (ii), max Rs. 5,00,000"});
    if(ce.adminOver)
      h+=note("The administrative spend entered exceeds the permitted ceiling of "+
        RS(ce.adminCap)+" (5% of contributions received, capped at "+RS(BOD_ADMIN_MAX)+
        "); only "+RS(ce.adminPermitted)+" will be carried to item vi.","warn");
    h+=row("vi · Total (iv + v)",cell(ce.total),{ind:1,ref:"vi / F16",hint:"computed (v capped)"});
    h+=row("vii · Total amount eligible for exemption under section 13B",cell(ce.exe13B),
      {ind:1,ref:"vii / F17",hint:"= (ii) when iv >= 95% of (iii)"});
    h+=row("viii · Closing balance as on 31st March (iii - vi)",cell(ce.closeBal),{ind:1,ref:"viii / F18",hint:"computed"});
    h+=note("The amount eligible for exemption under section 13B ties to the exemption claimed on total income in Part B-TI.");
  } else if(bodYN((B.et||{}).on)==="N"){
    h+=note("Not an electoral trust — Schedule ET will not be exported.");
  }

  /* ===================== Schedule SH ===================== */
  h+=sub("Schedule SH · Shareholding of an unlisted company");
  h+=row("Are you an unlisted company furnishing the details of its shareholders?",
    sel("bodies.sh.on",BOD_YN),{req:1,ref:"[Sch SH · D4]"});
  if(bodYN((B.sh||{}).on)==="Y"){
    h+=note("ITR-7 Schedule SH carries only the unlisted-company tables (there is no start-up SH-2 object on this form). "+
      "All amounts are in rupees; the share-type list differs per table.");
    BOD_SH_KEYS.forEach(k=>{ h+=sub(BOD_SH[k].label); h+=bodGrid(BOD_SH[k]); });
  } else if(bodYN((B.sh||{}).on)==="N"){
    h+=note("Not an unlisted company for Schedule SH — nothing will be exported.");
  }
  return h;
}

/* ---- export --------------------------------------------------------- */
function expBodies(j){
  bodiesInit(); const B=S.bodies||{}, Cb=(S.C.bodies||{});

  /* ----- Schedule PP ----- */
  if(bodYN((B.pp||{}).on)==="Y"){
    const p=B.pp||{}, pp={};
    /* required Y/N leaves (default No so all are present) */
    pp.RegisterUS29A=bodYN(p.reg);
    pp.RecognizedByECI=bodYN(p.eci);
    pp.BooksOfAccMaintained=bodYN(p.books);
    pp.AccountsAudited=bodYN(p.audited);
    pp.ReportUs29=bodYN(p.report29);
    pp.VoluntaryContribution=bodYN(p.vc);
    pp.VoluntaryContributionElecBond=bodYN(p.vcElecBond);
    pp.DonExceElectoralBond=bodYN(p.donExc);
    /* required integer (must be present even at 0) */
    pp.TotVCReceived=n0((Cb.pp||{}).totVC);
    /* optional registration / recognition particulars */
    if(bodYN(p.reg)==="Y"){
      pf(pp,"RegisterNum",st0(p.regNum).slice(0,25)||undefined);
      pf(pp,"DateRegisterUS29A",ISO(p.regDate));
    }
    if(bodYN(p.eci)==="Y") pf(pp,"DateOfRecognition",ISO(p.eciDate));
    /* optional auditor particulars (only when audited) */
    if(bodYN(p.audited)==="Y"){
      const au={};
      pf(au,"DateOfAudit",ISO(p.audDateFurnish));
      pf(au,"AuditorName",st0(p.audName).slice(0,125)||undefined);
      pf(au,"AuditorMemNo",st0(p.audMemNo).slice(0,6)||undefined);
      pf(au,"AudFrmName",st0(p.audFrmName).slice(0,125)||undefined);
      pf(au,"AudFrmRegNo",st0(p.audFrmRegNo).slice(0,8)||undefined);
      pf(au,"AudFrmPAN",st0(p.audFrmPAN).toUpperCase()||undefined);
      pf(au,"AudFrmAadhaar",st0(p.audFrmAadhaar).slice(0,12)||undefined);
      pf(au,"AuditDate",ISO(p.audDate));
      if(Object.keys(au).length) pp.AuditDetailsSchPP=au;
    }
    /* optional section-29C report particulars */
    if(bodYN(p.report29)==="Y"){
      pf(pp,"SubmissionDate",ISO(p.subDate));
      pf(pp,"Electioncommissionlist",BOD_ECI.some(x=>x[0]===st0(p.eciList))?st0(p.eciList):undefined);
    }
    /* optional aggregate bands */
    pf(pp,"AggregateVCUpto20000",n0(p.vcUpto20000)||undefined);
    pf(pp,"AggregateVC2000Cash",n0(p.vc2000Cash)||undefined);
    pf(pp,"AggregateVC2000OtherThanCash",n0(p.vc2000Other)||undefined);
    pf(pp,"AggregateVCMoreThan20000",n0(p.vcMore20000)||undefined);
    j.SchedulePP=pp;
  }

  /* ----- Schedule ET ----- */
  if(bodYN((B.et||{}).on)==="Y"){
    const e=B.et||{}, ce=(Cb.et||{}), et={};
    et.BooksOfAccMaintained=bodYN(e.books);
    et.VoluntaryContribution=bodYN(e.vc);
    et.RecordsMaintainedWithPAN=bodYN(e.records);
    et.AccountsAudited=bodYN(e.audited);
    et.ReportAsPerRule17CA=bodYN(e.report17CA);
    if(bodYN(e.audited)==="Y") pf(et,"AuditReportDate",ISO(e.audDate));
    /* VoluntaryContributionDtls — required object, all 8 integer leaves present */
    et.VoluntaryContributionDtls={
      OpeningBalance:n0(e.opBal),
      VoluntaryContributionDuringYr:n0(e.vcYr),
      TotalAfterVoluntaryContribution:n0(ce.totAfter),
      AmtDistToPoliticalParties:n0(e.amtDist),
      AmtSpentOnManagingAffairs:n0(ce.adminPermitted),
      Total:n0(ce.total),
      TotAmtExeUndSec13B:n0(ce.exe13B),
      ClosingBalance:n0(ce.closeBal)
    };
    j.ScheduleET=et;
  }

  /* ----- Schedule SH ----- */
  const uc={};
  BOD_SH_KEYS.forEach(k=>{ const def=BOD_SH[k];
    const rows=(get(def.path)||[]).map(r=>bodRowOut(r,def.cols)).filter(Boolean);
    if(rows.length) uc[def.sk]=rows; });
  if(Object.keys(uc).length) j.ScheduleSH={ShrhldngUnlistedCompany:uc};
}

/* ---- import (inverse; round-trip is identity) ---------------------- */
function impBodies(I){
  bodiesInit(); const read=[];
  if(!I) return read;

  const PP=I.SchedulePP;
  if(PP){
    const p=S.bodies.pp; p.on="Y";
    p.reg=PP.RegisterUS29A||""; p.regNum=PP.RegisterNum||"";
    if(PP.DateRegisterUS29A)p.regDate=dmy(PP.DateRegisterUS29A)||"";
    p.eci=PP.RecognizedByECI||"";
    if(PP.DateOfRecognition)p.eciDate=dmy(PP.DateOfRecognition)||"";
    p.books=PP.BooksOfAccMaintained||""; p.audited=PP.AccountsAudited||"";
    const au=PP.AuditDetailsSchPP||{};
    if(au.DateOfAudit)p.audDateFurnish=dmy(au.DateOfAudit)||"";
    p.audName=au.AuditorName||""; p.audMemNo=au.AuditorMemNo||"";
    p.audFrmName=au.AudFrmName||""; p.audFrmRegNo=au.AudFrmRegNo||"";
    p.audFrmPAN=au.AudFrmPAN||""; p.audFrmAadhaar=au.AudFrmAadhaar||"";
    if(au.AuditDate)p.audDate=dmy(au.AuditDate)||"";
    p.report29=PP.ReportUs29||"";
    if(PP.SubmissionDate)p.subDate=dmy(PP.SubmissionDate)||"";
    p.eciList=PP.Electioncommissionlist||"";
    p.vc=PP.VoluntaryContribution||""; p.vcElecBond=PP.VoluntaryContributionElecBond||"";
    p.donExc=PP.DonExceElectoralBond||"";
    p.vcUpto20000=PP.AggregateVCUpto20000!=null?PP.AggregateVCUpto20000:"";
    p.vc2000Cash=PP.AggregateVC2000Cash!=null?PP.AggregateVC2000Cash:"";
    p.vc2000Other=PP.AggregateVC2000OtherThanCash!=null?PP.AggregateVC2000OtherThanCash:"";
    p.vcMore20000=PP.AggregateVCMoreThan20000!=null?PP.AggregateVCMoreThan20000:"";
    read.push("Schedule PP (political party)");
  }

  const ET=I.ScheduleET;
  if(ET){
    const e=S.bodies.et; e.on="Y";
    e.books=ET.BooksOfAccMaintained||""; e.vc=ET.VoluntaryContribution||"";
    e.records=ET.RecordsMaintainedWithPAN||""; e.audited=ET.AccountsAudited||"";
    if(ET.AuditReportDate)e.audDate=dmy(ET.AuditReportDate)||"";
    e.report17CA=ET.ReportAsPerRule17CA||"";
    const d=ET.VoluntaryContributionDtls||{};
    e.opBal=d.OpeningBalance!=null?d.OpeningBalance:"";
    e.vcYr=d.VoluntaryContributionDuringYr!=null?d.VoluntaryContributionDuringYr:"";
    e.amtDist=d.AmtDistToPoliticalParties!=null?d.AmtDistToPoliticalParties:"";
    e.amtAdmin=d.AmtSpentOnManagingAffairs!=null?d.AmtSpentOnManagingAffairs:"";
    read.push("Schedule ET (electoral trust)");
  }

  const SH=I.ScheduleSH&&I.ScheduleSH.ShrhldngUnlistedCompany;
  if(SH){
    S.bodies.sh.on="Y";
    BOD_SH_KEYS.forEach(k=>{ const def=BOD_SH[k];
      if(Array.isArray(SH[def.sk])) set(def.path,SH[def.sk].map(r=>bodRowIn(r,def.cols))); });
    read.push("Schedule SH (unlisted company shareholding)");
  }
  return read;
}

/* ---- checks (section-local sanity; not the CBDT rule engine) ------- */
function chkBodies(){
  bodiesInit(); const out=[], B=S.bodies, Cb=(S.C.bodies||{});

  /* --- Schedule PP --- */
  if(bodYN((B.pp||{}).on)==="Y"){
    const p=B.pp||{};
    if(bodYN(p.reg)!=="Y")
      out.push({lvl:"warn",t:"Schedule PP",m:"A political party must be registered under section 29A of the RP Act, 1951 to claim the section 13A exemption.",sec:"bodies"});
    if(bodYN(p.reg)==="Y"&&!st0(p.regNum))
      out.push({lvl:"warn",t:"Schedule PP",m:"Registration u/s 29A is Yes — please give the registration number.",sec:"bodies"});
    if(bodYN(p.audited)==="Y"){
      if(st0(p.audMemNo)&&!/^[0-9]{6}$/.test(st0(p.audMemNo)))
        out.push({lvl:"err",t:"Schedule PP",m:"Membership No. of the auditor must be six digits.",sec:"bodies"});
      if(st0(p.audFrmRegNo)&&!/^[a-zA-Z0-9]{8}$/.test(st0(p.audFrmRegNo)))
        out.push({lvl:"err",t:"Schedule PP",m:"Firm registration No. must be eight characters.",sec:"bodies"});
      if(st0(p.audFrmPAN)&&!PAN_RE.test(st0(p.audFrmPAN).toUpperCase()))
        out.push({lvl:"err",t:"Schedule PP",m:"PAN of the auditor is not a valid PAN.",sec:"bodies"});
      if(st0(p.audFrmAadhaar)&&!AADH.test(st0(p.audFrmAadhaar)))
        out.push({lvl:"warn",t:"Schedule PP",m:"Aadhaar of the auditor should be a 12-digit number.",sec:"bodies"});
    }
    ["regDate","eciDate","audDateFurnish","audDate","subDate"].forEach(kk=>{
      if(st0(p[kk])&&!ISO(p[kk]))
        out.push({lvl:"err",t:"Schedule PP",m:"A date is not a valid "+DF+" date.",sec:"bodies"});
    });
    if(bodYN(p.report29)==="Y"&&!st0(p.eciList))
      out.push({lvl:"warn",t:"Schedule PP",m:"Report u/s 29C furnished = Yes — please select the Election Commission to whom it was submitted.",sec:"bodies"});
    if(bodYN(p.donExc)==="Y")
      out.push({lvl:"warn",t:"Schedule PP",m:"A donation over Rs.2,000 received otherwise than by account-payee instrument / electoral bond breaches section 13A(d).",sec:"bodies"});
  }

  /* --- Schedule ET --- */
  if(bodYN((B.et||{}).on)==="Y"){
    const e=B.et||{}, ce=(Cb.et||{});
    if(st0(e.audDate)&&!ISO(e.audDate))
      out.push({lvl:"err",t:"Schedule ET",m:"Date of the Form 10BC audit report is not a valid "+DF+" date.",sec:"bodies"});
    if(ce.adminOver)
      out.push({lvl:"warn",t:"Schedule ET",m:"Administrative spend exceeds the ceiling (5% of contributions, max "+RS(BOD_ADMIN_MAX)+"); it is capped to "+RS(ce.adminPermitted)+" on export.",sec:"bodies"});
    if(N(ce.totAfter)>0 && N(e.amtDist)<0.95*N(ce.totAfter))
      out.push({lvl:"warn",t:"Schedule ET",m:"Less than 95% of the total contributions (opening + received) was distributed to political parties, so no amount is eligible for exemption under section 13B.",sec:"bodies"});
    if(N(ce.total)>N(ce.totAfter))
      out.push({lvl:"warn",t:"Schedule ET",m:"Amounts applied (distributed + admin) exceed the total available; the closing balance is shown as nil.",sec:"bodies"});
  }

  /* --- Schedule SH --- */
  if(bodYN((B.sh||{}).on)==="Y"){
    BOD_SH_KEYS.forEach(k=>{ const def=BOD_SH[k], arr=get(def.path)||[];
      arr.forEach((r,i)=>{ r=r||{};
        if(!def.cols.some(c=>st0(r[c.k])!=="")) return;         /* skip wholly blank */
        const miss=[];
        def.cols.forEach(c=>{ if(c.req&&st0(r[c.k])==="") miss.push(c.h); });
        if(miss.length)
          out.push({lvl:"err",t:"Schedule SH · "+def.sk,m:"Row "+(i+1)+": please fill "+miss.join(", ")+".",sec:"bodies"});
        def.cols.forEach(c=>{ const v=st0(r[c.k]); if(!v)return;
          if(c.t==="pan"&&!PAN_RE.test(v.toUpperCase()))
            out.push({lvl:"err",t:"Schedule SH · "+def.sk,m:"Row "+(i+1)+": "+c.h+" is not a valid PAN.",sec:"bodies"});
          if(c.t==="date"&&!ISO(v))
            out.push({lvl:"err",t:"Schedule SH · "+def.sk,m:"Row "+(i+1)+": "+c.h+" must be a valid "+DF+" date.",sec:"bodies"});
        });
      });
    });
    if(bodCount()===0)
      out.push({lvl:"warn",t:"Schedule SH",m:"Marked as an unlisted company but no shareholder row is entered.",sec:"bodies"});
  }

  if(!out.length && (bodYN((B.pp||{}).on)==="Y"||bodYN((B.et||{}).on)==="Y"||bodYN((B.sh||{}).on)==="Y"))
    out.push({lvl:"ok",t:"Special-body disclosures",m:"Every check passes.",sec:"bodies"});
  return out;
}

/* ---- register (overrides the boot stub for id "bodies") ------------ */
reg({id:"bodies", t:"Political party, electoral trust & shareholding", ref:"Schedule PP · ET · SH",
  f:secBodies,
  s:()=>{ const C=S.C.bodies||{}; const parts=[];
    if(C.ppOn==="Y")parts.push("PP");
    if(C.etOn==="Y")parts.push("ET"+(C.et&&C.et.exe13B?" "+CR(C.et.exe13B):""));
    if(C.shOn==="Y"&&C.rows)parts.push(C.rows+" SH row"+(C.rows>1?"s":""));
    return parts.join(" · "); },
  eng:engBodies, exp:expBodies, imp:impBodies, chk:chkBodies, order:140, corder:30});
