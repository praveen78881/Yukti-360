
/* ==================================================================
   10 · SAVE, OPEN, EXPORT
   ================================================================== */
function download(n,t){const b=new Blob([t],{type:"application/json"}),a=document.createElement("a");
  a.href=URL.createObjectURL(b);a.download=n;document.body.appendChild(a);a.click();
  a.remove();URL.revokeObjectURL(a.href);}
function saveFile(){const o={};Object.keys(S).forEach(k=>{if(k!=="C")o[k]=S[k];});
  o.meta={app:"yukti",form:"ITR-2",ay:"2026-27",ver:1,saved:new Date().toISOString()};
  download((S.pi.pan||"ITR2")+"_AY2026-27.yukti.json",JSON.stringify(o,null,1));}
$("b_save").addEventListener("click",saveFile);
function deepFind(o,keys,d){d=d||0;if(!o||typeof o!=="object"||d>9)return undefined;
  for(const k of keys)if(o[k]!==undefined&&o[k]!==null&&o[k]!=="")return o[k];
  for(const k in o){const r=deepFind(o[k],keys,d+1);if(r!==undefined)return r;}return undefined;}
/* ==================================================================
   importReturn — read a department-format ITR-2 JSON back into every
   Yukti field. The inverse of buildITR2. Computed blocks (CYLA, BFLA,
   SI, AMT, Part B) are not read; they are recomputed.
   ================================================================== */
const dmy=iso=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||""));return m?m[3]+"/"+m[2]+"/"+m[1]:"";};
const g_=(o,p)=>{try{return p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);}catch(e){return undefined;}};
const nz=v=>(v==null||v===0||v==="")?"":v;
function importReturn(I){
  const got=[];
  /* ---- Part A General ---- */
  const PI=I.PartA_GEN1&&I.PartA_GEN1.PersonalInfo,FS=I.PartA_GEN1&&I.PartA_GEN1.FilingStatus;
  if(PI){const n=PI.AssesseeName||{},a=PI.Address||{},b=PI.AlternateAddress||{};
    Object.assign(S.pi,{status:PI.Status||"I",first:n.FirstName||"",mid:n.MiddleName||"",last:n.SurNameOrOrgName||"",pan:PI.PAN||"",
      aadhaar:PI.AadhaarCardNo||"",aadhenrol:PI.AadhaarEnrolmentId||"",dob:dmy(PI.DOB),passport:PI.PassportNo||"",
      addr1:a.ResidenceNo||"",premises:a.ResidenceName||"",road:a.RoadOrStreet||"",locality:a.LocalityOrArea||"",city:a.CityOrTownOrDistrict||"",
      country:a.CountryCode||"91",state:a.StateCode||"",pin:nz(a.PinCode)+"",zip:a.ZipCode||"",email:a.EmailAddress||"",email2:a.EmailAddressSec||"",
      mobile:nz(a.MobileNo)+"",mobile2:nz(a.MobileNoSec)+"",std:a.STDcode||"",phone:nz(a.PhoneNo)+"",
      addr2same:PI.SecondaryAdd==="Y"?"No":"Yes",addr1b:b.ResidenceNo||"",premisesb:b.ResidenceName||"",roadb:b.RoadOrStreet||"",localityb:b.LocalityOrArea||"",cityb:b.CityOrTownOrDistrict||"",stateb:b.StateCode||"",pinb:nz(b.PinCode)+""});
    got.push("personal information");}
  if(FS){Object.assign(S.pi,{res:FS.ResidentialStatus||"RES",rescond:FS.ConditionsResStatus||"",
      juris:(g_(FS,"JurisdictionResPrevYr.JurisdictionResPrevYrDtls")||[]).map(x=>({country:x.JurisdictionResidence,tin:x.TIN})),
      days1:nz(FS.TotalPrStayIndiaPrevYr),days4:nz(FS.TotalPrStayIndia4PrecYr),s115h:FS.BenefitUs115HFlg==="Y"?"Yes":"No",
      s5a:FS.PortugeseCC5A==="Y"?"Yes":"No",fpi:FS.FiiFpiFlag==="Y"?"Yes":"No",sebi:FS.SebiRegnNo||"",
      rep:FS.AsseseeRepFlg==="Y"?"Yes":"No",rep_name:g_(FS,"AssesseeRep.RepName")||"",rep_email:g_(FS,"AssesseeRep.RepEmailID")||"",rep_mobile:nz(g_(FS,"AssesseeRep.RepMobileNo"))+"",
      dir:FS.CompDirectorPrvYrFlg==="Y"?"Yes":"No",dirco:(g_(FS,"CompDirectorPrvYr.CompDirectorPrvYrDtls")||[]).map(c=>({name:c.NameOfCompany,type:c.CompanyType,pan:c.PAN||"",listed:c.SharesTypes,din:c.DIN||""})),
      unl:FS.HeldUnlistedEqShrPrYrFlg==="Y"?"Yes":"No",unlco:(g_(FS,"HeldUnlistedEqShrPrYr.HeldUnlistedEqShrPrYrDtls")||[]).map(c=>({name:c.NameOfCompany,type:c.CompanyType,pan:c.PAN||"",open:c.OpngBalNumberOfShares,opencost:c.OpngBalCostOfAcquisition,acq:nz(c.ShrAcqDurYrNumberOfShares),acqdt:dmy(c.DateOfSubscrPurchase),fv:nz(c.FaceValuePerShare),ip:nz(c.IssuePricePerShare),pp:nz(c.PurchasePricePerShare),sold:nz(c.ShrTrnfNumberOfShares),soldcons:nz(c.ShrTrnfSaleConsideration),close:c.ClsngBalNumberOfShares,closecost:c.ClsngBalCostOfAcquisition})),
      lei:g_(FS,"LEIDtls.LEINumber")||"",lei_dt:dmy(g_(FS,"LEIDtls.ValidUptoDate"))});
    S.fs={optout:FS.OptOutNewTaxRegime==="Y"?"Yes":"No",sec:FS.ReturnFileSec||11,filed:S.fs.filed||"",notice:FS.NoticeNo||"",noticedate:dmy(FS.NoticeDate),receipt:FS.ReceiptNo||"",origdate:dmy(FS.OrigRetFiledDate)};
    S.decl={flag:FS.SeventhProvisio139==="Y"?"Yes":"No",dep_f:FS.DepAmtAggAmtExcd1CrPrYrFlg==="Y"?"Yes":"No",dep:nz(FS.AmtSeventhProvisio139i),trv_f:FS.IncrExpAggAmt2LkTrvFrgnCntryFlg==="Y"?"Yes":"No",trv:nz(FS.AmtSeventhProvisio139ii),
      ele_f:FS.IncrExpAggAmt1LkElctrctyPrYrFlg==="Y"?"Yes":"No",ele:nz(FS.AmtSeventhProvisio139iii),c4_f:FS.clauseiv7provisio139i==="Y"?"Yes":"No",c4:(FS.clauseiv7provisio139iDtls||[]).map(x=>({nature:x.clauseiv7provisio139iNature,amt:x.clauseiv7provisio139iAmount}))};
    got.push("filing status");}
  /* ---- Schedule S ---- */
  if(I.ScheduleS){const sc=I.ScheduleS;
    S.sal={emp:(sc.Salaries||[]).map(e=>{const sy=e.Salarys||{};const o={name:e.NameOfEmployer,empcat:e.NatureOfEmployment||"OTH",tan:e.TANofEmployer||"",city:g_(e,"AddressDetail.CityOrTownOrDistrict")||"",state:g_(e,"AddressDetail.StateCode")||"",pin:nz(g_(e,"AddressDetail.PinCode"))+"",
        s17_1:nz(sy.Salary),s17_2:nz(sy.ValueOfPerquisites),s17_3:nz(sy.ProfitsinLieuOfSalary),oth89a:nz(sy.IncomeNotifiedOther89A),prev89a:nz(sy.IncomeNotifiedPrYr89A)};
      (sy.IncomeNotified89AType||[]).forEach(c=>o["n89a_"+c.NOT89ACountrycode]=c.NOT89AAmount);
      const back=n=>(g_(n,"OthersIncDtls")||[]).map(r=>({code:r.NatureDesc,desc:r.OthNatOfInc||"",amt:r.OthAmount}));
      o.n17_1=back(sy.NatureOfSalary);o.n17_2=back(sy.NatureOfPerquisites);o.n17_3=back(sy.NatureOfProfitInLieuOfSalary);return o;}),s16ii:nz(sc.EntertainmntalwncUs16ii),s16iii:nz(sc.ProfessionalTaxUs16iii)};
    S.alw=(g_(sc,"AllwncExemptUs10.AllwncExemptUs10Dtls")||[]).map(a=>({sec:a.SalNatureDesc,amt:a.SalOthAmount}));got.push("salary");}
  /* ---- Schedule HP ---- */
  if(I.ScheduleHP){const hp=I.ScheduleHP;
    S.hp={on:"1",pti:nz(hp.PassThroghIncome),props:(hp.PropertyDetails||[]).map(p=>{const ad=p.AddressDetailWithZipCode||{},rd=p.Rentdetails||{};
      return {addr:ad.AddrDetail||"",city:ad.CityOrTownOrDistrict||"",country:ad.CountryCode||"91",state:ad.StateCode||"",pin:nz(ad.PinCode)+"",zip:ad.ZipCode||"",
        owner:p.PropertyOwner||"SE",ownerOther:p.PropertyOwnerOther||"",co:p.PropCoOwnedFlg==="YES"?"YES":"NO",share:p.AsseseeShareProperty,
        coowners:(p.CoOwners||[]).map(c=>({name:c.NameCoOwner,pan:c.PAN_CoOwner||"",aadhaar:c.Aadhaar_CoOwner||"",share:nz(c.PercentShareProperty)})),
        type:p.ifLetOut||"S",tenants:(p.TenantDetails||[]).map(t=>({name:t.NameofTenant,pan:t.PANofTenant||"",aadhaar:t.AadhaarofTenant||"",pantan:t.PANTANofTenant||""})),
        rent:nz(rd.AnnualLetableValue),unreal:nz(rd.RentNotRealized),taxes:nz(rd.LocalTaxes),arrears:rd.ArrearsUnrealizedRentRcvd?Math.round(rd.ArrearsUnrealizedRentRcvd/0.7):"",
        loans:(g_(rd,"Section24B.Section24BDtls")||[]).map(l=>({from:l.LoanTknFrom,name:l.BankOrInstnName,acno:l.LoanAccNoOfBankOrInstnRefNo,dt:dmy(l.DateofLoan),amt:l.TotalLoanAmt,os:l.LoanOutstndngAmt,interest:l.InterestUs24B}))};})};
    got.push("house property");}
  /* ---- Schedule CG ---- */
  if(I.ScheduleCGFor23){const cg=I.ScheduleCGFor23,ST=cg.ShortTermCapGainFor23||{},LT=cg.LongTermCapGain23||{};
    const C=JSON.parse(JSON.stringify(CG_STATE_DEFAULT));C.on="1";
    const landOf=(d,isLT)=>{const b=g_(d,"TrnsfImmblPrprty.TrnsfImmblPrprtyDtls")||[];const first=b[0]||{};const ded={};
      (g_(d,"ExemptionOrDednUs54.ExemptionOrDednUs54Dtls")||[]).forEach(x=>ded["s"+x.ExemptionSecCode]=x.ExemptionAmount);if(d.DeductionUs54B)ded.s54B=d.DeductionUs54B;
      return {buy:dmy(d.DateofPurchase),sale:dmy(d.DateofSale),lt:isLT?"Long":"Short",cons:d.FullConsideration,sdv:nz(d.PropertyValuation),cost:d.AquisitCost,exp:nz(d.ExpOnTrans),
        improve:(g_(d,"CostOfImprovements.CostOfImprovementsDtls")||[]).map(x=>({amt:x.ImproveCost,yr:x.ImproveDate})),ded,
        buyers:b.map(x=>({name:x.NameOfBuyer,pan:x.PANofBuyer||"",aadhaar:x.AaadhaarOfBuyer||"",share:x.PercentageShare,amt:x.Amount})),
        paddr:first.AddressOfProperty||"",pstate:first.StateCode||"",ppin:nz(first.PinCode)+"",s45_5a:d.ChargeableUs45_5A==="Y"?"Yes":"No",ccDate:dmy(d.DateOfCompletionCert)};};
    C.land=(g_(ST,"SaleofLandBuild.SaleofLandBuildDtls")||[]).map(d=>landOf(d,false)).concat((g_(LT,"SaleofLandBuild.SaleofLandBuildDtls")||[]).map(d=>landOf(d,true)));
    const aggOf=(b)=>b?{cons:nz(b.FullConsideration),unqCons:nz(b.FullValueConsdRecvUnqshr),unqFmv:nz(b.FairMrktValueUnqshr),othCons:nz(b.FullValueConsdOthUnqshr),cost:nz(g_(b,"DeductSec48.AquisitCost")),improve:nz(g_(b,"DeductSec48.ImproveCost")),exp:nz(g_(b,"DeductSec48.ExpOnTrans")),loss94:nz(b.LossSec94of7Or94of8),ded:{s54F:nz(b.DeductionUs54F)}}:{};
    (ST.EquityMFonSTT||[]).forEach(e=>{const a=aggOf(e.EquityMFonSTTDtls);if(e.MFSectionCode==="1A")C.a3i=a;else C.a3ii=a;});
    if(ST.SaleOnOtherAssets)C.a6=aggOf(ST.SaleOnOtherAssets);
    if(ST.SlumpSaleInStcg)C.a2={fmv2:nz(ST.SlumpSaleInStcg.FMV11UAEii),fmv3:nz(ST.SlumpSaleInStcg.FMV11UAEiii),networth:nz(ST.SlumpSaleInStcg.NetWorthOfDivision)};
    C.a7={deem:(g_(ST,"UnutilizedCg.UnutilizedCgPrvYrDtls")||[]).map(x=>({py:x.PrvYrInWhichAsstTrnsfrd,acqyr:x.YrInWhichAssetAcq,used:x.AmtUtilized,unused:x.AmtUnutilized})),other:nz(ST.AmtDeemedStcg)};
    C.a8={r20:nz(ST.PassThrIncNatureSTCG20Per),r30:nz(ST.PassThrIncNatureSTCG30Per),rApp:nz(ST.PassThrIncNatureSTCGAppRate)};
    C.aA=(g_(ST,"CapitalLossBuyBackShares.CapitalLossBuyBackSharesDtls")||[]).map(x=>({rate:x.Rate,amt:Math.abs(x.Amount)}));
    if(LT.SlumpSaleInLtcgDtls)C.b2={fmv2:nz(g_(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg.FMV11UAEii")),fmv3:nz(g_(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg.FMV11UAEiii")),networth:nz(g_(LT,"SlumpSaleInLtcgDtls.SlumpSaleInLtcg.NetWorthOfDivision"))};
    (LT.Proviso112Applicable||[]).forEach(e=>{const d=e.Proviso112Applicabledtls||{};const a={cons:nz(d.FullConsideration),cost:nz(g_(d,"DeductSec48.AquisitCost")),improve:nz(g_(d,"DeductSec48.ImproveCost")),exp:nz(g_(d,"DeductSec48.ExpOnTrans")),ded:{s54F:nz(d.DeductionUs54F)}};if(e.Proviso112SectionCode==="5ACA1b")C.b3iii=a;else C.b3ii=a;});
    C.b4={s54F:nz(g_(LT,"SaleOfEquityShareUs112A.DeductionUs54F"))};
    if(g_(LT,"SaleofAssetNADtls.SaleofAssetNA"))C.b9=aggOf(LT.SaleofAssetNADtls.SaleofAssetNA);
    C.b10={deem:(g_(LT,"UnutilizedCg.UnutilizedCgPrvYrDtls")||[]).map(x=>({py:x.PrvYrInWhichAsstTrnsfrd,sec:x.SectionClmd,acqyr:x.YrInWhichAssetAcq,used:x.AmtUtilized,unused:x.AmtUnutilized})),other:nz(LT.AmtDeemedLtcg)};
    C.b11={r125a:nz(LT.PassThrIncNatureLTCGUs112A12_5Per),r125o:nz(LT.PassThrIncNatureLTCG12_5Per)};
    if(g_(LT,"CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares"))C.bA=[{amt:Math.abs(LT.CapitalLossBuyBackShares.TotalCapitalLossBuyBackShares)}];
    const DD=cg.DeducClaimInfo||{};C.dedD={};
    [["54","DeducClaimDtlsUs54"],["54B","DeducClaimDtlsUs54B"],["54EC","DeducClaimDtlsUs54EC"],["54F","DeducClaimDtlsUs54F"],["115F","DeducClaimDtlsUs115F"]].forEach(([sec,k])=>{if(DD[k]&&DD[k].length)C.dedD[sec]=DD[k].map(r=>({transfer:dmy(r.DateofTransfer),cost:nz(r.CostofNewResHouse||r.CostofNewAgriLand||r.AmtInvested),purchase:dmy(r.DateofPurchase||r.DateofInvestment),dep:nz(r.AmtDeposited),depdt:dmy(r.DepositDate),acno:r.AccountNo||"",ifsc:r.IFSC||""}));});
    /* B9's one deduction slot is labelled 54F; Part D says which sections it really was — reconcile */
    {const partD={};Object.keys(C.dedD).forEach(sec=>partD[sec]=(C.dedD[sec]||[]).reduce((a,r)=>a+N(r.cost>0&&r.cost<9e15?0:0),0));
      [["54","DeducClaimDtlsUs54"],["54B","DeducClaimDtlsUs54B"],["54EC","DeducClaimDtlsUs54EC"],["54F","DeducClaimDtlsUs54F"],["115F","DeducClaimDtlsUs115F"]].forEach(([sec,k])=>{partD[sec]=(DD[k]||[]).reduce((a,r)=>a+N(r.AmtDeducted),0);});
      C.land.forEach(p=>Object.keys(p.ded||{}).forEach(k=>{const sec=k.slice(1);partD[sec]=Math.max(0,(partD[sec]||0)-N(p.ded[k]));}));
      let slot=N((C.b9.ded||{}).s54F);if(slot)C.b9.ded={s54F:slot};}
    if(I.Schedule112A)C.s112a=(I.Schedule112A.Schedule112ADtls||[]).map(r=>({isin:r.ISINCode==="INNOTREQUIRD"?"":r.ISINCode,name:r.ShareUnitName,pre18:r.ShareOnOrBefore,qty:r.NumSharesUnits||1,price:r.NumSharesUnits?r.SalePricePerShareUnit:r.TotSaleValue,cost:r.AcquisitionCost,fmv18:nz(r.FairMktValuePerShareunit),exp:nz(r.ExpExclCnctTransfer)}));
    if(I.Schedule115AD)C.s115ad=(I.Schedule115AD.Schedule115ADDtls||[]).map(r=>({isin:r.ISINCode==="INNOTREQUIRD"?"":r.ISINCode,name:r.ShareUnitName,pre18:r.ShareOnOrBefore,qty:r.NumSharesUnits,price:r.SalePricePerShareUnit,cost:r.AcquisitionCost,fmv18:nz(r.FairMktValuePerShareunit),exp:nz(r.ExpExclCnctTransfer)}));
    if(I.ScheduleVDA)C.vda=(I.ScheduleVDA.ScheduleVDADtls||[]).map(r=>({buy:dmy(r.DateofAcquisition),sale:dmy(r.DateofTransfer),cost:r.AcquisitionCost,cons:r.ConsidReceived}));
    S.cg=C;got.push("capital gains");}
  /* ---- Schedule OS ---- */
  if(I.ScheduleOS){const IO=I.ScheduleOS.IncOthThanOwnRaceHorse||{},H=I.ScheduleOS.IncFromOwnHorse;const O=JSON.parse(JSON.stringify(OS_STATE_DEFAULT));O.on="1";
    O.d={ord:nz(IO.DividendOthThan22e),e22:nz(IO.Dividend22e),f22:nz(IO.Dividend22f)};
    O.i={sav:nz(IO.IntrstFrmSavingBank),dep:nz(IO.IntrstFrmTermDeposit),refund:nz(IO.IntrstFrmIncmTaxRefund),pti:nz(IO.NatofPassThrghIncome),pf11a:nz(IO.IntrstSec10XIFirstProviso),pf11b:nz(IO.IntrstSec10XISecondProviso),pf12a:nz(IO.IntrstSec10XIIFirstProviso),pf12b:nz(IO.IntrstSec10XIISecondProviso),others:nz(IO.IntrstFrmOthers)};
    O.rent=nz(IO.RentFromMachPlantBldgs);O.g={money:nz(IO.Aggrtvaluewithoutcons562x),immWithout:nz(IO.Immovpropwithoutcons562x),immInadeq:nz(IO.Immovpropinadeqcons562x),othWithout:nz(IO.Anyotherpropwithoutcons562x),othInadeq:nz(IO.Anyotherpropinadeqcons562x)};
    O.e={fap:nz(IO.FamilyPension),oth89a:nz(IO.IncomeNotifiedOther89AOS),prev89a:nz(IO.IncomeNotifiedPrYr89AOS),s562xii:nz(IO.SumRecdPrYrBusTRU562xii),s562xiii:nz(IO.SumRecdPrYrLifIns562xiii)};
    (IO.IncomeNotified89ATypeOS||[]).forEach(c=>O.e["n89a_"+c.NOT89ACountrycode]=c.NOT89AAmount);
    O.eOther=(g_(IO,"OthersInc.OthersIncDtls")||[]).map(r=>({nature:r.OthNatOfInc,amt:r.OthAmount}));
    O.sp={lottery:nz(IO.LtryPzzlChrgblUs115BB),online:nz(IO.IncChrgblUs115BBJ),s68:nz(IO.CashCreditsUs68),s69:nz(IO.UnExplndInvstmntsUs69),s69A:nz(IO.UnExplndMoneyUs69A),s69B:nz(IO.UnDsclsdInvstmntsUs69B),s69C:nz(IO.UnExplndExpndtrUs69C),s69D:nz(IO.AmtBrwdRepaidOnHundiUs69D)};
    O.pf111=(g_(IO,"TaxAccumulatedBalRecPF.TaxAccmltdBalRecPFDtls")||[]).map(r=>({ay:r.AssessmentYear,incben:r.IncomeBenefit,taxben:r.TaxBenefit}));
    O.spl=(IO.OthersGrossDtls||[]).map(r=>({code:r.SourceDescription,amt:r.SourceAmount}));O.pti=(IO.PTIOthersGrossDtls||[]).map(r=>({code:String(r.SourceDescription).replace(/^PTI_/,""),amt:r.SourceAmount}));
    O.dtaa=(g_(IO,"IncChargblSplRateOS.NRIOsDTAA.NRIDTAADtlsSchOS")||[]).map(r=>({amt:r.DTAAamt,nature:r.NatureOfIncome,itemno:r.ItemNoincl,country:r.CountryName,code:r.CountryCodeExcludingIndia,article:r.DTAAarticle,treaty:r.RateAsPerTreaty===0?"NIL":r.RateAsPerTreaty,trc:r.TaxRescertifiedFlag,itrate:r.RateAsPerITAct}));
    const D=IO.Deductions||{};O.ded={exp:nz(D.Expenses),dep:nz(D.Depreciation),intClaimed:nz(D.UsrIntExp57)};O.s58=nz(IO.AmtNotDeductibleUs58);O.s59=nz(IO.ProfitChargTaxUs59);O.rel89a=nz(IO.Increliefus89AOS);
    O.horse=H?{on:true,rec:nz(H.Receipts),ded57:nz(H.DeductSec57),s58:nz(H.AmtNotDeductibleUs58),s59:nz(H.ProfitChargTaxUs59)}:{on:false};
    const QK=["Upto15Of6","Upto15Of9","Up16Of9To15Of12","Up16Of12To15Of3","Up16Of3To31Of3"];O.Q={};let anyQ=false;
    OS_Q.forEach(([k,l,key])=>{const dr=g_(I.ScheduleOS,key+".DateRange");if(dr){const arr=QK.map(q=>nz(dr[q]));if(arr.some(v=>v!=="")){O.Q[k]=arr;anyQ=true;}}});O.editQ=anyQ?"1":"";
    S.os2=O;got.push("other sources");}
  /* ---- CFL ---- */
  if(I.ScheduleCFL){S.loss={cfl:{},editC:"",editB:""};CFL_YEARS.forEach(([y,key])=>{const d=g_(I.ScheduleCFL,key+".CarryFwdLossDetail");if(d)S.loss.cfl[y]={dt:dmy(d.DateOfFiling),hp:nz(d.TotalHPPTILossCF),st:nz(d.TotalSTCGPTILossCF),lt:nz(d.TotalLTCGPTILossCF),horse:nz(d.OthSrcLossRaceHorseCF)};});got.push("losses carried forward");}
  /* ---- VI-A and the sub-schedules ---- */
  if(I.ScheduleVIA){const U=I.ScheduleVIA.UsrDeductUndChapVIA||{};const MAP={Section80C:"c80c",Section80CCC:"c80ccc",Section80CCDEmployeeOrSE:"c80ccd1",Section80CCD1B:"c80ccd1b",Section80CCDEmployer:"c80ccd2",Section80DD:"c80dd",Section80DDB:"c80ddb",Section80GG:"c80gg",Section80U:"c80u",Section80QQB:"c80qqb",Section80RRB:"c80rrb",Section80TTA:"c80tta",Section80TTB:"c80ttb",AnyOthSec80CCH:"c80cch"};
    S.via={};Object.keys(MAP).forEach(k=>{if(U[k])S.via[MAP[k]]=U[k];});
    S.via.pran=g_(U,"PRANDtls.0.PRANNum")||"";S.via.ddb_type=U.Section80DDBUsrType||"1";S.via.ddb_disease=U.NameOfSpecDisease80DDB||"";S.via.ack10ba=U.Form10BAAckNum||"";S.via.ack10ccd=U.Form10CCDAckNum||"";S.via.ack10cce=U.Form10CCEAckNum||"";
    S.pen80ccc=(U.PensionContribution80CCC||[]).map(r=>({type:r.TypeofIdentifier==="PRAN"?"NPS":"OTH",id:r.NameofIdentifier,amt:r.Amount}));got.push("deductions");}
  if(I.Schedule80C)S.c80c=(I.Schedule80C.Schedule80CDtls||[]).map(r=>({amt:r.Amount,id:r.IdentificationNo}));
  if(I.Schedule80D){const b=I.Schedule80D.Sec80DSelfFamSrCtznHealth||{};const ins=k=>(g_(b,k+".Sch80DInsDtls")||[]).map(r=>({insurer:r.InsurerName,policy:r.PolicyNo,amt:r.HealthInsAmt}));
    S.d80={selfSr:b.SeniorCitizenFlag===undefined?"N/A":b.SeniorCitizenFlag,parSr:b.ParentsSeniorCitizenFlag===undefined?"N/A":b.ParentsSeniorCitizenFlag,selfIns:ins("Sec80DSelfFamHIDtls"),selfPHC:nz(b.PrevHlthChckUpSlfFam),selfSrIns:ins("Sec80DSelfFamSrCtznHIDtls"),selfSrPHC:nz(b.PrevHlthChckUpSlfFamSrCtzn),selfSrMed:nz(b.MedicalExpSlfFamSrCtzn),parIns:ins("Sec80DParentsHIDtls"),parPHC:nz(b.PrevHlthChckUpParents),parSrIns:ins("Sec80DParentsSrCtznHIDtls"),parSrPHC:nz(b.PrevHlthChckUpParentsSrCtzn),parSrMed:nz(b.MedicalExpParentsSrCtzn)};}
  if(I.Schedule80DD){const x=I.Schedule80DD;S.dd80={nature:x.NatureOfDisability,type:x.TypeOfDisability,amt:x.DeductionAmount,dep:x.DependentType,pan:x.DependentPan||"",aadhaar:x.DependentAadhaar||"",f10dt:dmy(x.Form10IAFilingDate),f10ack:x.Form10IAAckNum||"",udid:x.UDIDNum||""};}
  if(I.Schedule80U){const x=I.Schedule80U;S.u80={nature:x.NatureOfDisability==="2"?"SelfSevere":"Self",type:x.TypeOfDisability,dt:dmy(x.Form10IAFilingDate),ack:x.Form10IAAckNum||"",udid:x.UDIDNum||""};S.via.c80u=x.DeductionAmount;}
  {const ln=(blk,dk,ik)=>(g_(I,blk+"."+dk)||[]).map(r=>({from:r.LoanTknFrom,name:r.BankOrInstnName,acno:r.LoanAccNoOfBankOrInstnRefNo,dt:dmy(r.DateofLoan),amt:r.TotalLoanAmt,os:r.LoanOutstndngAmt,reg:r.VehicleRegNo||"",interest:r[ik]}));
    S.e80={e:ln("Schedule80E","Schedule80EDtls","Interest80E"),ee:ln("Schedule80EE","Schedule80EEDtls","Interest80EE"),eea:ln("Schedule80EEA","Schedule80EEADtls","Interest80EEA"),eeb:ln("Schedule80EEB","Schedule80EEBDtls","Interest80EEB"),eeaSdv:nz(g_(I,"Schedule80EEA.PropStmpDtyVal"))};}
  if(I.Schedule80G){const G=I.Schedule80G;S.g80=[];[["A","Don100Percent"],["B","Don50PercentNoApprReqd"],["C","Don100PercentApprReqd"],["D","Don50PercentApprReqd"]].forEach(([b,k])=>{(g_(G,k+".DoneeWithPan")||[]).forEach(r=>{const a=r.AddressDetail||{};S.g80.push({bucket:b,name:r.DoneeWithPanName,addr:a.AddrDetail,city:a.CityOrTownOrDistrict,state:a.StateCode,pin:nz(a.PinCode)+"",pan:r.DoneePAN,arn:r.ArnNbr||"",cash:nz(r.DonationAmtCash),other:nz(r.DonationAmtOtherMode),ref:r.TransactionRefNum||"",ifsc:r.IFSCCode||"",amt:r.DonationAmt});});});}
  if(I.Schedule80GGA)S.gga=(I.Schedule80GGA.DonationDtlsSciRsrchRuralDev||[]).map(r=>{const a=r.AddressDetail||{};return {clause:r.RelevantClauseUndrDedClaimed,name:r.NameOfDonee,addr:a.AddrDetail,city:a.CityOrTownOrDistrict,state:a.StateCode,pin:nz(a.PinCode)+"",pan:r.DoneePAN,mode:r.DonationAmtCash?"CASH":"OTH",amt:r.DonationAmt};});
  if(I.Schedule80GGC)S.ggc=(I.Schedule80GGC.Schedule80GGCDetails||[]).map(r=>({dt:dmy(r.DonationDate),name:r.PoliticalPartyName||"",pan:r.PoliticalPartyPAN||"",mode:r.DonationAmtCash?"CASH":"OTH",ref:r.TransactionRefNum||"",ifsc:r.IFSCCode||"",amt:r.DonationAmt}));
  if(I.ScheduleAMTC){S.amtc={};(I.ScheduleAMTC.ScheduleAMTCDtls||[]).forEach(r=>S.amtc[r.AssYr]={gross:r.Gross,setoff:r.AmtCreditSetOfEy});}
  if(I.ScheduleSPI)S.spi=(I.ScheduleSPI.SpecifiedPerson||[]).map(r=>({name:r.SpecifiedPersonName,pan:r.PANofSpecPerson||"",aadhaar:r.AaadhaarOfSpecPerson||"",rel:r.ReltnShip,amt:r.AmtIncluded,head:r.HeadIncIncluded}));
  if(I.ScheduleEI){const E=I.ScheduleEI;S.ei2={interest:nz(E.InterestInc),agriGross:nz(E.GrossAgriRecpt),agriExp:nz(E.ExpIncAgri),agriUnab:nz(E.UnabAgriLossPrev8),
      land:(g_(E,"ExcNetAgriInc.ExcNetAgriIncDtls")||[]).map(r=>({district:r.NameOfDistrict,pin:nz(r.PinCode)+"",acres:r.MeasurementOfLand,owned:r.AgriLandOwnedFlag,irr:r.AgriLandIrrigatedFlag})),
      others:(g_(E,"OthersInc.OthersIncDtls")||[]).map(r=>({cat:r.Category||"OTH",sub:r.SubCategory||"",desc:r.Description||"",amt:r.OthAmount})),
      dtaa:(g_(E,"IncNotChrgblAsPerDTAA.IncNotChrgblAsPerDTAADtls")||[]).map(r=>({amt:r.AmountOfIncome,nature:r.NatureOfIncome,country:r.CountryName,code:r.CountryCodeExcludingIndia,article:r.ArticleOfDTAA,head:r.HeadOfIncome,trc:r.TRCFlag}))};got.push("exempt income");}
  if(I.SchedulePTI){const leaf=(o)=>o?{inc:nz(o.AmountOfInc),loss:nz(o.CurrYrLossShareByInvstFund),tds:nz(o.TDSAmount)}:{};
    S.pti2=(I.SchedulePTI.SchedulePTIDtls||[]).map(b=>{const c=b.CapitalGainsPTI||{},x=b.IncClmdPTI||{};return {kind:b.InvstmntCvrdUs115UA115UB,name:b.BusinessName,pan:b.BusinessPAN,rows:{hp:leaf(b.IncFromHP),st111a:leaf(c.STCG_Sec111A),stOth:leaf(c.STCG_Others),lt112a:leaf(c.LTCG_Sec112A),ltOth:leaf(c.LTCG_Others),osDiv:leaf(b.OS_Dividend),osOth:leaf(b.OS_Others),ex23fbb:leaf(x.Sec23FBB)}};});}
  if(I.ScheduleFSI){const trSec={};(g_(I,"ScheduleTR1.ScheduleTR")||[]).forEach(r=>trSec[r.CountryCodeExcludingIndia]=r.ReliefClaimedUsSection);
    S.fsi2=(I.ScheduleFSI.ScheduleFSIDtls||[]).map(b=>{const hd=o=>o?{inc:nz(o.IncFrmOutsideInd),paid:nz(o.TaxPaidOutsideInd),article:o.DTAAReliefUs90or90A||""}:{};return {code:b.CountryCodeExcludingIndia,name:b.CountryName,tin:b.TaxIdentificationNo,sec:trSec[b.CountryCodeExcludingIndia]||"90",h:{sal:hd(b.IncFromSal),hp:hd(b.IncFromHP),cg:hd(b.IncCapGain),os:hd(b.IncOthSrc)}};});
    const T=I.ScheduleTR1||{};S.tr2={refundFlag:T.TaxPaidOutsideIndFlg||"NO",refundAmt:nz(T.AmtTaxRefunded),refundAY:T.AssmtYrTaxRelief||""};got.push("foreign income");}
  if(I.ScheduleFA){const F=I.ScheduleFA;const cc=r=>({code:r.CountryCodeExcludingIndia,country:r.CountryName,zip:r.ZipCode||""});const off=r=>({offAmt:nz(r.IncTaxAmt!==undefined?r.IncTaxAmt:r.IncOfferedAmt),offSch:r.IncTaxSch||r.IncOfferedSch||"NI",offItem:r.IncTaxSchNo||r.IncOfferedSchNo||""});
    S.fa2={bank:(F.DetailsForiegnBank||[]).map(r=>Object.assign(cc(r),{inst:r.Bankname,addr:r.AddressOfBank,acno:r.ForeignAccountNumber,status:r.OwnerStatus,opened:dmy(r.AccOpenDate),peak:r.PeakBalanceDuringYear,close:r.ClosingBalance,interest:r.IntrstAccured})),
      cust:(F.DtlsForeignCustodialAcc||[]).map(r=>Object.assign(cc(r),{inst:r.FinancialInstName,addr:r.FinancialInstAddress,acno:r.AccountNumber,status:r.Status,opened:dmy(r.AccOpenDate),peak:r.PeakBalanceDuringPeriod,close:r.ClosingBalance,gross:r.GrossAmtPaidCredited,nature:r.NatureOfAmount})),
      equity:(F.DtlsForeignEquityDebtInterest||[]).map(r=>Object.assign(cc(r),{entity:r.NameOfEntity,addr:r.AddressOfEntity,nature:r.NatureOfEntity,acq:dmy(r.InterestAcquiringDate),initial:r.InitialValOfInvstmnt,peak:r.PeakBalanceDuringPeriod,close:r.ClosingBalance,paid:r.TotGrossAmtPaidCredited,proceeds:r.TotGrossProceeds})),
      insur:(F.DtlsForeignCashValueInsurance||[]).map(r=>Object.assign(cc(r),{inst:r.FinancialInstName,addr:r.FinancialInstAddress,dt:dmy(r.ContractDate),cashval:r.CashValOrSurrenderVal,paid:r.TotGrossAmtPaidCredited})),
      fin:(F.DetailsFinancialInterest||[]).map(r=>Object.assign(cc(r),{nature:r.NatureOfEntity||"",entity:r.NameOfEntity,addr:r.AddressOfEntity,interest:r.NatureOfInt,since:dmy(r.DateHeld),cost:r.TotalInvestment,inc:r.IncFromInt,incNature:r.NatureOfInc},off(r))),
      imm:(F.DetailsImmovableProperty||[]).map(r=>Object.assign(cc(r),{addr:r.AddressOfProperty||"",own:r.Ownership,acq:dmy(r.DateOfAcq),cost:r.TotalInvestment,inc:r.IncDrvProperty,incNature:r.NatureOfInc},off(r))),
      oth:(F.DetailsOthAssets||[]).map(r=>Object.assign(cc(r),{nature:r.NatureOfAsset,own:r.Ownership,acq:dmy(r.DateOfAcq),cost:r.TotalInvestment,inc:r.IncDrvAsset,incNature:r.NatureOfInc},off(r))),
      sign:(F.DetailsOfAccntsHvngSigningAuth||[]).map(r=>Object.assign(cc(r),{inst:r.NameOfInstitution,addr:r.AddressOfInstitution,holder:r.NameMentionedInAccnt,acno:r.InstitutionAccountNumber,peak:r.PeakBalanceOrInvestment,taxable:r.IncAccuredTaxFlag,inc:nz(r.IncAccuredInAcc)},off(r))),
      trust:(F.DetailsOfTrustOutIndiaTrustee||[]).map(r=>Object.assign(cc(r),{trust:r.NameOfTrust,trustAddr:r.AddressOfTrust,trustees:r.NameOfOtherTrustees,trusteesAddr:r.AddressOfOtherTrustees,settlor:r.NameOfSettlor,settlorAddr:r.AddressOfSettlor,benef:r.NameOfBeneficiaries,benefAddr:r.AddressOfBeneficiaries,since:dmy(r.DateHeld),taxable:r.IncDrvTaxFlag,inc:nz(r.IncDrvFromTrust)},off(r))),
      othInc:[]};got.push("foreign assets");}
  if(I.Schedule5A2014){const A=I.Schedule5A2014;const hd=o=>o?{inc:nz(o.IncRecvdUndHead),spouse:nz(o.AmtApprndOfSpouse),tds:nz(o.AmtTDSDeducted),tdsSp:nz(o.TDSApprndOfSpouse)}:{};S.sch5a2={name:A.NameOfSpouse,pan:A.PANOfSpouse,aadhaar:A.AadhaarOfSpouse||"",h:{hp:hd(A.HPHeadIncome),cg:hd(A.CapGainHeadIncome),os:hd(A.OtherSourcesHeadIncome)}};}
  if(I.ScheduleAL){const A=I.ScheduleAL,M=A.MovableAsset||{};S.al2={hasImm:(A.ImmovableDetails||[]).length?"Y":"N",imm:(A.ImmovableDetails||[]).map(r=>{const a=r.AddressAL||{};return {desc:r.Description,flat:a.ResidenceNo,premises:a.ResidenceName||"",road:a.RoadOrStreet||"",locality:a.LocalityOrArea,city:a.CityOrTownOrDistrict,state:a.StateCode,country:a.CountryCode,pin:nz(a.PinCode)+"",zip:a.ZipCode||"",amt:r.Amount};}),
      jewel:nz(M.JewelleryBullionEtc),art:nz(M.ArchCollDrawPaintSulpArt),vehicle:nz(M.VehiclYachtsBoatsAircrafts),bank:nz(M.DepositsInBank),shares:nz(M.SharesAndSecurities),insur:nz(M.InsurancePolicies),loans:nz(M.LoansAndAdvancesGiven),cash:nz(M.CashInHand),liab:nz(A.LiabilityInRelatAssets)};got.push("assets and liabilities");}
  if(I.ScheduleESOP){const E=I.ScheduleESOP;S.esop={pan:E.PanofStartUp,dpiit:E.DPIITRegNo,deferNow:nz(g_(E,"ScheduleESOP2627_Type.BalanceTaxCF")),yrs:{}};
    [["2021-22","2122"],["2022-23","2223"],["2023-24","2324"],["2024-25","2425"],["2025-26","2526"]].forEach(([y,k])=>{const b=E["ScheduleESOP"+k+"_Type"];if(!b)return;const ev=b.ScheduleESOPEventDtls||{};S.esop.yrs[y]={bf:nz(b.TaxDeferredBFEarlierAY),sec:ev.SecurityType||"NS",ceased:ev.CeasedEmployee||"N",ceasedDt:dmy(ev.DateOfCeasing),exp48:"N",sales:(ev.ScheduleESOPEventDtlsType||[]).map(s=>({dt:dmy(s.Date),amt:s.TaxAttributedAmt}))};});}
  /* ---- taxes paid ---- */
  if(I.ScheduleTDS1)S.tds1=(I.ScheduleTDS1.TDSonSalary||[]).map(r=>({tan:g_(r,"EmployerOrDeductorOrCollectDetl.TAN"),name:g_(r,"EmployerOrDeductorOrCollectDetl.EmployerOrDeductorOrCollecterName"),inc:r.IncChrgSal,tds:r.TotalTDSSal}));
  const tdsBack=(r,buyer)=>{const c=r.TaxDeductCreditDtls||{};return {who:r.TDSCreditName,othPan:r.PANofOtherPerson||"",othAadh:r.AadhaarOfOtherPerson||"",tan:r.TANOfDeductor||"",pan:r.PANOfBuyerTenant||"",aadh:r.AadhaarOfBuyerTenant||"",sec:r.TDSSection,yr:nz(r.DeductedYr)+"",bf:nz(r.BroughtFwdTDSAmt),dedOwn:nz(c.TaxDeductedOwnHands),dedOthInc:nz(c.TaxDeductedIncome),dedOthTds:nz(c.TaxDeductedTDS),claimOwn:nz(c.TaxClaimedOwnHands),claimOthInc:nz(c.TaxClaimedIncome),claimOthTds:nz(c.TaxClaimedTDS),claimOthPan:c.TaxClaimedSpouseOthPrsnPAN||"",claimOthAadh:c.SpouseOthPrsnAadhaar||"",gross:nz(r.GrossAmount),head:r.HeadOfIncome||""};};
  if(I.ScheduleTDS2)S.tds2=(I.ScheduleTDS2.TDSOthThanSalaryDtls||[]).map(r=>tdsBack(r,false));
  if(I.ScheduleTDS3)S.tds3=(I.ScheduleTDS3.TDS3onOthThanSalDtls||[]).map(r=>tdsBack(r,true));
  if(I.ScheduleTCS)S.tcs=(I.ScheduleTCS.TCS||[]).map(r=>({who:r.TCSCreditOwner,tan:r.EmployerOrDeductorOrCollectTAN,othPan:r.PANOfSpouseOrOthrPrsn||"",yr:nz(r.DeductedYr)+"",bf:nz(r.BroughtFwdTDSAmt),collOwn:nz(g_(r,"TCSCurrFYDtls.TCSAmtCollOwnHand")),collOth:nz(g_(r,"TCSCurrFYDtls.TCSAmtCollSpouseOrOthrHand")),claimOwn:nz(g_(r,"TCSClaimedThisYearDtls.TCSAmtCollOwnHand")),claimOth:nz(g_(r,"TCSClaimedThisYearDtls.TCSAmtCollSpouseOrOthrHand")),claimOthPan:g_(r,"TCSClaimedThisYearDtls.PANOfSpouseOrOthrPrsn")||""}));
  if(I.ScheduleIT)S.it=(I.ScheduleIT.TaxPayment||[]).map(c=>({bsr:c.BSRCode,dt:dmy(c.DateDep),sn:String(c.SrlNoOfChaln),amt:c.Amt}));
  if(I.ScheduleTDS1||I.ScheduleTDS2||I.ScheduleIT)got.push("taxes paid");
  /* ---- Part B-TTI inputs, bank, verification, TRP ---- */
  const CTL=g_(I,"PartB_TTI.ComputationOfTaxLiability")||{};S.tax={s89:nz(g_(CTL,"TaxRelief.Section89")),f234i:nz(g_(CTL,"IntrstPay.FeeFurnish234I"))};
  const bk=g_(I,"PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails")||[];if(bk.length){S.bank=bk.map(b=>({ifsc:b.IFSCCode,bank:b.BankName,acno:b.BankAccountNo,type:b.AccountType,refund:b.UseForRefund==="true"?"Y":"N"}));got.push("bank accounts");}
  const V=I.Verification||{};S.ver={cap:V.Capacity||"S",name:g_(V,"Declaration.AssesseeVerName")||"",father:g_(V,"Declaration.FatherName")||"",pan:g_(V,"Declaration.AssesseeVerPAN")||"",place:V.Place||"",swid:g_(I,"CreationInfo.SWCreatedBy")||"",nacc:bk.length||""};
  if(I.TaxReturnPreparer)S.trp={id:I.TaxReturnPreparer.IdentificationNoOfTRP,name:I.TaxReturnPreparer.NameOfTRP,reimb:nz(I.TaxReturnPreparer.ReImbFrmGov)};
  return got;
}

function importFile(txt){let j;try{j=JSON.parse(txt);}catch(e){alert("That file is not readable JSON.");return;}
  resetState();   /* clear any prior return fully, so nothing from a previous file lingers */
  if(j&&j.meta&&j.meta.app==="yukti"&&j.meta.form==="ITR-2"){
    Object.keys(j).forEach(k=>{if(k!=="C"&&k!=="meta")S[k]=j[k];});
    if(!S.cg||S.cg.tx)S.cg=JSON.parse(JSON.stringify(CG_STATE_DEFAULT));
    if(!S.os2)S.os2=JSON.parse(JSON.stringify(OS_STATE_DEFAULT));
    S.open={};paint();alert("Working file loaded — every field is back as it was saved.");return;}
  const I=j&&j.ITR&&j.ITR.ITR2;
  if(I&&I.PartA_GEN1){
    const got=importReturn(I);S.open={};paint();
    alert("Return JSON read back into the form: "+got.join(", ")+".\n\nComputed schedules — CYLA, BFLA, SI, AMT, Part B — are recomputed from these. Check the date of filing, which the return does not carry.");return;}
  const got=[];const pan=deepFind(j,["PAN","pan"]);
  if(pan&&PAN_RE.test(String(pan).toUpperCase())){S.pi.pan=String(pan).toUpperCase();got.push("PAN");}
  const nm=deepFind(j,["AssesseeName"]);
  if(nm&&typeof nm==="object"){S.pi.first=nm.FirstName||S.pi.first;S.pi.mid=nm.MiddleName||S.pi.mid;S.pi.last=nm.SurNameOrOrgName||S.pi.last;got.push("name");}
  const ad=deepFind(j,["Address"]);
  if(ad&&typeof ad==="object"){S.pi.addr1=ad.ResidenceNo||S.pi.addr1;S.pi.locality=ad.LocalityOrArea||S.pi.locality;S.pi.city=ad.CityOrTownOrDistrict||S.pi.city;
    S.pi.state=ad.StateCode||S.pi.state;S.pi.pin=ad.PinCode!=null?String(ad.PinCode):S.pi.pin;S.pi.mobile=ad.MobileNo!=null?String(ad.MobileNo):S.pi.mobile;S.pi.email=ad.EmailAddress||S.pi.email;got.push("address");}
  const aa=deepFind(j,["AadhaarCardNo"]);if(aa&&AADH.test(String(aa))){S.pi.aadhaar=String(aa);got.push("Aadhaar");}
  const dob=deepFind(j,["DOB"]);if(dob){S.pi.dob=dmy(dob)||S.pi.dob;got.push("date of birth");}
  const bk=deepFind(j,["AddtnlBankDetails"]);
  if(Array.isArray(bk)&&bk.length){S.bank=bk.map(b=>({ifsc:b.IFSCCode||"",bank:b.BankName||"",acno:b.BankAccountNo||"",type:b.AccountType||"SB",refund:b.UseForRefund==="true"?"Y":"N"}));got.push("bank accounts");}
  paint();alert(got.length?("Imported from the prefill: "+got.join(", ")+"."):"Nothing recognisable was found. If it is the portal prefill, check the assessment year.");}
$("filepick").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=()=>importFile(String(r.result));r.readAsText(f);});
$("b_open").addEventListener("click",()=>$("filepick").click());
