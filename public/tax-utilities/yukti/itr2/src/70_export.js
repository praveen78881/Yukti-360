const deep=o=>JSON.parse(JSON.stringify(o));
function put(o,p,v){if(v===undefined||v===null||v==="")return;
  const a=p.split(".");let t=o;for(let i=0;i<a.length-1;i++){if(t[a[i]]==null)t[a[i]]={};t=t[a[i]];}
  t[a[a.length-1]]=v;}
const n0=x=>Math.max(0,R(x)),sg=x=>R(x),sv=v=>{v=st0(v);return v||undefined;};
function buildITR2(){
  compute();
  const A=S.C.sal,P=S.C.hp,CG=S.C.cg,O=S.C.os,V=S.C.via,L=S.C.loss,T=S.C.tax,I=S.C.int,AM=S.C.amt;
  const j=deep(SKEL),today=new Date().toISOString().slice(0,10);
  put(j,"CreationInfo.SWVersionNo",SW_VERSION);
  put(j,"CreationInfo.SWCreatedBy",SW_CREATED);
  put(j,"CreationInfo.JSONCreatedBy",SW_CREATED);
  put(j,"CreationInfo.JSONCreationDate",today);
  put(j,"CreationInfo.IntermediaryCity",(sv(S.ver.place)||"Delhi").slice(0,25));
  put(j,"CreationInfo.Digest","-");

  const PI=j.PartA_GEN1.PersonalInfo;
  if(S.pi.status==="I"){put(PI,"AssesseeName.FirstName",sv(S.pi.first));
    put(PI,"AssesseeName.MiddleName",sv(S.pi.mid));}
  put(PI,"AssesseeName.SurNameOrOrgName",sv(S.pi.last));
  put(PI,"PAN",sv(st0(S.pi.pan).toUpperCase()));
  put(PI,"Status",S.pi.status);
  if(S.pi.status==="I"&&AADH.test(st0(S.pi.aadhaar)))put(PI,"AadhaarCardNo",st0(S.pi.aadhaar));
  put(PI,"Address.ResidenceNo",(sv(S.pi.addr1)||"NA").slice(0,50));
  put(PI,"Address.LocalityOrArea",(sv(S.pi.locality)||"NA").slice(0,50));
  put(PI,"Address.CityOrTownOrDistrict",(sv(S.pi.city)||"NA").slice(0,50));
  put(PI,"Address.StateCode",STATE[st0(S.pi.state)]?st0(S.pi.state):"19");
  put(PI,"Address.CountryCode","91");
  if(/^[1-9]\d{5}$/.test(st0(S.pi.pin)))put(PI,"Address.PinCode",parseInt(S.pi.pin,10));
  put(PI,"Address.CountryCodeMobile",91);
  if(/^[1-9]\d{9}$/.test(st0(S.pi.mobile)))put(PI,"Address.MobileNo",parseInt(S.pi.mobile,10));
  put(PI,"Address.EmailAddress",sv(S.pi.email));
  if(sv(S.pi.email2))put(PI,"Address.EmailAddressSec",sv(S.pi.email2));
  if(/^[1-9]\d{9}$/.test(st0(S.pi.mobile2))){put(PI,"Address.CountryCodeMobileNoSec",91);put(PI,"Address.MobileNoSec",parseInt(S.pi.mobile2,10));}
  if(sv(S.pi.premises))put(PI,"Address.ResidenceName",sv(S.pi.premises).slice(0,50));
  if(sv(S.pi.road))put(PI,"Address.RoadOrStreet",sv(S.pi.road).slice(0,50));
  put(PI,"DOB",ISO(S.pi.dob));
  put(PI,"SecondaryAdd",S.pi.addr2same==="No"?"Y":"N");
  if(S.pi.addr2same==="No")put(PI,"AlternateAddress",{ResidenceNo:(sv(S.pi.addr1b)||"NA").slice(0,50),
    ResidenceName:sv(S.pi.premisesb),RoadOrStreet:sv(S.pi.roadb),
    LocalityOrArea:(sv(S.pi.localityb)||"NA").slice(0,50),CityOrTownOrDistrict:(sv(S.pi.cityb)||"NA").slice(0,50),
    StateCode:STATE[st0(S.pi.stateb)]?st0(S.pi.stateb):"19",CountryCode:"91",
    PinCode:/^[1-9]\d{5}$/.test(st0(S.pi.pinb))?parseInt(S.pi.pinb,10):undefined});
  else put(PI,"AlternateAddress",{ResidenceNo:(sv(S.pi.addr1)||"NA").slice(0,50),
    ResidenceName:sv(S.pi.premises),RoadOrStreet:sv(S.pi.road),
    LocalityOrArea:(sv(S.pi.locality)||"NA").slice(0,50),CityOrTownOrDistrict:(sv(S.pi.city)||"NA").slice(0,50),
    StateCode:STATE[st0(S.pi.state)]?st0(S.pi.state):"19",CountryCode:"91",
    PinCode:/^[1-9]\d{5}$/.test(st0(S.pi.pin))?parseInt(S.pi.pin,10):undefined});
  const FS=j.PartA_GEN1.FilingStatus;
  put(FS,"ReturnFileSec",parseInt(S.fs.sec,10)||11);
  put(FS,"OptOutNewTaxRegime",isNew()?"N":"Y");
  put(FS,"ResidentialStatus",S.pi.res);
  if(S.pi.status!=="H"&&st0(S.pi.rescond))put(FS,"ConditionsResStatus",st0(S.pi.rescond));
  if(S.pi.res!=="RES"){
    const jr=(S.pi.juris||[]).filter(x=>st0(x.tin));
    if(jr.length)put(FS,"JurisdictionResPrevYr",{JurisdictionResPrevYrDtls:jr.map(x=>({
      JurisdictionResidence:st0(x.country)||"9999",TIN:st0(x.tin).slice(0,20)}))});
    if(st0(S.pi.days1)!=="")put(FS,"TotalPrStayIndiaPrevYr",n0(S.pi.days1));
    if(st0(S.pi.days4)!=="")put(FS,"TotalPrStayIndia4PrecYr",n0(S.pi.days4));
  }
  if(S.pi.res==="RES"&&S.pi.s115h==="Yes")put(FS,"BenefitUs115HFlg","Y");
  put(FS,"PortugeseCC5A",S.pi.s5a==="Yes"?"Y":"N");
  put(FS,"FiiFpiFlag",S.pi.fpi==="Yes"?"Y":"N");
  if(S.pi.fpi==="Yes"&&sv(S.pi.sebi))put(FS,"SebiRegnNo",sv(S.pi.sebi));
  put(FS,"AsseseeRepFlg",S.pi.rep==="Yes"?"Y":"N");
  if(S.pi.rep==="Yes")put(FS,"AssesseeRep",{RepName:(sv(S.pi.rep_name)||"NA").slice(0,75),
    RepEmailID:sv(S.pi.rep_email),CountryCodeRepMobileNo:91,
    RepMobileNo:parseInt(st0(S.pi.rep_mobile)||"9999999999",10)});
  put(FS,"CompDirectorPrvYrFlg",S.pi.dir==="Yes"?"Y":"N");
  if(S.pi.dir==="Yes"){const dc=(S.pi.dirco||[]).filter(c=>st0(c.name));
    if(dc.length)put(FS,"CompDirectorPrvYr",{CompDirectorPrvYrDtls:dc.map(c=>({
      NameOfCompany:st0(c.name).slice(0,125),CompanyType:c.type==="F"?"F":"D",
      PAN:PAN_RE.test(st0(c.pan).toUpperCase())?st0(c.pan).toUpperCase():undefined,
      SharesTypes:c.listed==="U"?"U":"L",DIN:sv(c.din)}))});}
  put(FS,"HeldUnlistedEqShrPrYrFlg",S.pi.unl==="Yes"?"Y":"N");
  if(S.pi.unl==="Yes"){const uc=(S.pi.unlco||[]).filter(c=>st0(c.name));
    if(uc.length)put(FS,"HeldUnlistedEqShrPrYr",{HeldUnlistedEqShrPrYrDtls:uc.map(c=>{
      const r={NameOfCompany:st0(c.name).slice(0,125),CompanyType:c.type==="F"?"F":"D",
        PAN:PAN_RE.test(st0(c.pan).toUpperCase())?st0(c.pan).toUpperCase():undefined,
        OpngBalNumberOfShares:n0(c.open),OpngBalCostOfAcquisition:N(c.opencost),
        ClsngBalNumberOfShares:n0(c.close),ClsngBalCostOfAcquisition:N(c.closecost)};
      if(N(c.acq)){r.ShrAcqDurYrNumberOfShares=n0(c.acq);if(ISO(c.acqdt))r.DateOfSubscrPurchase=ISO(c.acqdt);
        if(N(c.fv))r.FaceValuePerShare=N(c.fv);if(N(c.ip))r.IssuePricePerShare=n0(c.ip);if(N(c.pp))r.PurchasePricePerShare=N(c.pp);}
      if(N(c.sold)){r.ShrTrnfNumberOfShares=n0(c.sold);r.ShrTrnfSaleConsideration=N(c.soldcons);}
      return r;})});}
  if(sv(S.pi.lei))put(FS,"LEIDtls",{LEINumber:sv(S.pi.lei).slice(0,20),ValidUptoDate:ISO(S.pi.lei_dt)});
  put(FS,"SeventhProvisio139",(S.decl&&S.decl.flag==="Yes")?"Y":"N");
  if(S.decl&&S.decl.flag==="Yes"){
    put(FS,"DepAmtAggAmtExcd1CrPrYrFlg",S.decl.dep_f==="Yes"?"Y":"N");
    if(S.decl.dep_f==="Yes")put(FS,"AmtSeventhProvisio139i",n0(S.decl.dep));
    put(FS,"IncrExpAggAmt2LkTrvFrgnCntryFlg",S.decl.trv_f==="Yes"?"Y":"N");
    if(S.decl.trv_f==="Yes")put(FS,"AmtSeventhProvisio139ii",n0(S.decl.trv));
    put(FS,"IncrExpAggAmt1LkElctrctyPrYrFlg",S.decl.ele_f==="Yes"?"Y":"N");
    if(S.decl.ele_f==="Yes")put(FS,"AmtSeventhProvisio139iii",n0(S.decl.ele));
    put(FS,"clauseiv7provisio139i",S.decl.c4_f==="Yes"?"Y":"N");
    if(S.decl.c4_f==="Yes"){const c4=(S.decl.c4||[]).filter(x=>N(x.amt));
      if(c4.length)put(FS,"clauseiv7provisio139iDtls",c4.map(x=>({clauseiv7provisio139iNature:(x.nature==="2"?"2":"1"),
        clauseiv7provisio139iAmount:n0(x.amt)})));}
  }
  if([13,14,16,18,20].indexOf(+S.fs.sec)>=0){if(sv(S.fs.notice))put(FS,"NoticeNo",sv(S.fs.notice).slice(0,23));
    if(ISO(S.fs.noticedate))put(FS,"NoticeDate",ISO(S.fs.noticedate));}
  if([17,18,19].indexOf(+S.fs.sec)>=0){if(/^\d{15}$/.test(st0(S.fs.receipt)))put(FS,"ReceiptNo",st0(S.fs.receipt));
    if(ISO(S.fs.origdate))put(FS,"OrigRetFiledDate",ISO(S.fs.origdate));}
  put(FS,"ItrFilingDueDate","2026-07-31");

  /* ---- Schedule S — the full per-employer schedule --------------- */
  if(A.income||A.gross){
    const sch={Salaries:(S.sal.emp||[]).filter(e=>e._gross).map(e=>({
      NameOfEmployer:(sv(e.name)||"NA").slice(0,100),
      NatureOfEmployment:EMPCAT.some(c=>c[0]===e.empcat)?e.empcat:"OTH",
      TANofEmployer: TAN_RE.test(st0(e.tan).toUpperCase())?st0(e.tan).toUpperCase():undefined,
      AddressDetail:{AddrDetail:(sv(e.city)||"NA").slice(0,50),
        CityOrTownOrDistrict:(sv(e.city)||"NA").slice(0,50),
        StateCode:STATE[st0(e.state)]?st0(e.state):"19",
        PinCode:/^[1-9]\d{5}$/.test(st0(e.pin))?parseInt(e.pin,10):undefined},
      Salarys:(()=>{
        const sy={GrossSalary:n0(e._gross),Salary:n0(e.s17_1),ValueOfPerquisites:n0(e.s17_2),
          ProfitsinLieuOfSalary:n0(e.s17_3),IncomeNotified89A:n0(e._d),
          IncomeNotifiedOther89A:n0(e._e),IncomeNotifiedPrYr89A:n0(e._f)};
        const nat=(arr,valid)=>{const rows=(arr||[]).filter(r=>N(r.amt));if(!rows.length)return undefined;
          return {OthersIncDtls:rows.map(r=>{const q={NatureDesc:valid.some(x=>x[0]===r.code)?r.code:"OTH",OthAmount:n0(r.amt)};if(q.NatureDesc==="OTH")q.OthNatOfInc=(sv(r.desc)||"Others").slice(0,50);return q;})};};
        const n1=nat(e.n17_1,S17_1),n2=nat(e.n17_2,S17_2),n3=nat(e.n17_3,S17_3);
        if(n1)sy.NatureOfSalary=n1;if(n2)sy.NatureOfPerquisites=n2;if(n3)sy.NatureOfProfitInLieuOfSalary=n3;
        const cc=NOTIFIED89.filter(c=>N(e["n89a_"+c[0]])).map(c=>({
          NOT89ACountrycode:c[0],NOT89AAmount:n0(e["n89a_"+c[0]])}));
        if(cc.length)sy.IncomeNotified89AType=cc;
        return sy;})()})),
      TotalGrossSalary:n0(A.gross),
      AllwncExtentExemptUs10:n0(A.exempt),
      NetSalary:n0(A.net),
      DeductionUS16:n0(A.d16),
      DeductionUnderSection16ia:n0(A.d16ia),
      EntertainmntalwncUs16ii:n0(A.ent),
      ProfessionalTaxUs16iii:n0(A.pt),
      TotIncUnderHeadSalaries:n0(A.income)};
    if(A.rel89a)sch.Increliefus89A=n0(A.rel89a);
    const al=S.alw.filter(a=>a._ok&&N(a.amt));
    if(al.length)sch.AllwncExemptUs10={
      AllwncExemptUs10Dtls:al.map(a=>({SalNatureDesc:a.sec,SalOthAmount:n0(a.amt)})),
      TotalAllwncExemptUs10:n0(A.exempt)};
    j.ScheduleS=sch;
  }

  /* ---- Schedule CG — the six parts, onto the real schema ---------- */
  if(CG.on&&(CG.total||CG.A.total||CG.B.total||CG.C2||(S.cg.land||[]).length)){
    const C=S.cg,A=CG.A,B=CG.B;
    const buyers=(p)=>{const bs=(p.buyers||[]).filter(x=>st0(x.name));if(!bs.length)return undefined;
      return {TrnsfImmblPrprtyDtls:bs.map(x=>({NameOfBuyer:st0(x.name).slice(0,125),
        PANofBuyer:PAN_RE.test(st0(x.pan).toUpperCase())?st0(x.pan).toUpperCase():undefined,
        AaadhaarOfBuyer:AADH.test(st0(x.aadhaar))?st0(x.aadhaar):undefined,
        PercentageShare:N(x.share)||100,Amount:n0(x.amt),AddressOfProperty:(sv(p.paddr)||"NA").slice(0,50),
        StateCode:STATE[st0(p.pstate)]?st0(p.pstate):"19",CountryCode:"91",
        PinCode:/^[1-9]\d{5}$/.test(st0(p.ppin))?parseInt(p.ppin,10):undefined}))};};
    const stLand=CG.land.st.map(p=>{const r=p._;return {DateofPurchase:ISO(p.buy),DateofSale:ISO(p.sale),
      FullConsideration:n0(p.cons),PropertyValuation:n0(p.sdv),FullConsideration50C:n0(r.value),
      AquisitCost:n0(p.cost),ImproveCost:n0(r.impNo),ExpOnTrans:n0(p.exp),TotalDedn:n0(r.biv),
      Balance:sg(r.c),DeductionUs54B:n0((p.ded||{}).s54B),STCGonImmvblPrprty:sg(r.e),TrnsfImmblPrprty:buyers(p)};});
    const ltLand=CG.land.lt.map(p=>{const r=p._;const imps=(p.improve||[]).filter(x=>N(x.amt));
      const ex=[];[["s54","54"],["s54B","54B"],["s54EC","54EC"],["s54EE","54EE"],["s54F","54F"],["s54GB","54GB"]]
        .forEach(([k,c])=>{if(N((p.ded||{})[k]))ex.push({ExemptionSecCode:c,ExemptionAmount:n0(p.ded[k])});});
      const o={FullConsideration:n0(p.cons),DateofPurchase:ISO(p.buy),DateofSale:ISO(p.sale),
        PropertyValuation:n0(p.sdv),FullConsideration50C:n0(r.value),AquisitCost:n0(p.cost),
        AquisitCostIndex:n0(r.costIdx),
        CostOfImprovements:{CostOfImprovementsDtls:(r.impRows||[]).map((x,k)=>({slno:k+1,ImproveDate:st0(x.yr)||"2020-21",
          ImproveCost:n0(x.amt),CostOfImpIndex:n0(x.idx)})),
          TotalImprovecost:n0(r.impNo),TotalindexImprovecost:n0(r.impIdx)},
        ExpOnTrans:n0(p.exp),TotalDedn:n0(r.biv),TotalDednForEiB:n0(r.biva),Balance:sg(r.c),BalanceForEiB:sg(r.ca),
        ExemptionOrDednUs54:Object.assign({ExemptionGrandTotal:n0(r.dedTot)},ex.length?{ExemptionOrDednUs54Dtls:ex}:{}),
        LTCGonImmvblPrprty:sg(r.e),LTCGonImmvblPrprtyBE:sg(r.ea),
        TaxSec1121aiiB:n0(r.taxA),TaxSec1121a:n0(r.taxB),ExcessAmtSec1121a:n0(r.excess),TrnsfImmblPrprty:buyers(p)};
      if(p.s45_5a==="Yes"){o.ChargeableUs45_5A="Y";if(ISO(p.ccDate))o.DateOfCompletionCert=ISO(p.ccDate);}
      return o;});
    const agg=(o,r,opts)=>{o=o||{};opts=opts||{};const d={AquisitCost:n0(o.cost),ImproveCost:n0(o.improve),
      ExpOnTrans:n0(o.exp),TotalDedn:n0(r.biv)};
      const b={FullConsideration:n0(r.cons),DeductSec48:d,BalanceCG:sg(r.c),CapgainonAssets:sg(r.gain)};
      if(opts.unq){b.FullValueConsdRecvUnqshr=n0(o.unqCons);b.FairMrktValueUnqshr=n0(o.unqFmv);
        b.FullValueConsdSec50CA=n0(o._c50ca||Math.max(N(o.unqCons),N(o.unqFmv)));b.FullValueConsdOthUnqshr=n0(o.othCons);}
      if(opts.loss94)b.LossSec94of7Or94of8=n0(o.loss94);
      if(opts.ded54F)b.DeductionUs54F=n0(r.ded||0);
      return b;};
    const slump=(o,r,lt)=>{o=o||{};const b={FMV11UAEii:n0(o.fmv2),FMV11UAEiii:n0(o.fmv3),FullConsideration:n0(r.value),
      NetWorthOfDivision:n0(o.networth),CapgainonAssets:sg(r.gain)};
      if(lt){b.BalanceCG=sg(r.c);b.ExemptionOrDednUs54={ExemptionGrandTotal:n0(r.ded)};}return b;};
    /* ---- Part A ---- */
    const ST={};
    if(stLand.length)ST.SaleofLandBuild={SaleofLandBuildDtls:stLand};
    const eq=[];
    if(N((C.a3i||{}).cons))eq.push({MFSectionCode:"1A",EquityMFonSTTDtls:agg(C.a3i,A.a3i,{loss94:1})});
    if(CG.nri&&N((C.a3ii||{}).cons))eq.push({MFSectionCode:"5AD1biip",EquityMFonSTTDtls:agg(C.a3ii,A.a3ii,{loss94:1})});
    if(eq.length)ST.EquityMFonSTT=eq;
    ST.NRITransacSec48Dtl={NRItaxSTTPaid:n0(N((C.a4||{}).ai)+N((C.a4||{}).aii)),NRItaxSTTNotPaid:n0((C.a4||{}).b)};
    ST.NRISecur115AD=agg(C.a5,CG.nri?A.a5:{cons:0,biv:0,c:0,gain:0},{unq:1,loss94:1});
    ST.SaleOnOtherAssets=agg(C.a6,A.a6,{unq:1,loss94:1,dcg:1,ded:1});
    ST.TotalAmtDeemedStcg=n0(A.a7.gain);
    const dm=(C.a7&&C.a7.deem||[]).filter(x=>N(x.unused));
    if(dm.length)ST.UnutilizedCg={UnutilizedCgPrvYrDtls:dm.map(x=>({PrvYrInWhichAsstTrnsfrd:["2023-24","2024-25"].indexOf(x.py)>=0?x.py:"2024-25",
      SectionClmd:"54B",YrInWhichAssetAcq:["2023","2024","2025"].indexOf(st0(x.acqyr).slice(0,4))>=0?st0(x.acqyr).slice(0,4):"2025",AmtUtilized:n0(x.used),AmtUnutilized:n0(x.unused)}))};
    if(N((C.a7||{}).other))ST.AmtDeemedStcg=n0(C.a7.other);
    ST.PassThrIncNatureSTCG=n0(A.a8.gain);
    if(N((C.a8||{}).r20))ST.PassThrIncNatureSTCG20Per=n0(C.a8.r20);
    if(N((C.a8||{}).r30))ST.PassThrIncNatureSTCG30Per=n0(C.a8.r30);
    if(N((C.a8||{}).rApp))ST.PassThrIncNatureSTCGAppRate=n0(C.a8.rApp);
    ST.TotalAmtNotTaxUsDTAAStcg=n0(A.a9.notTax);ST.TotalAmtTaxUsDTAAStcg=n0(A.a9.special);
    const bb=(C.aA||[]).filter(x=>N(x.amt));
    if(bb.length)ST.CapitalLossBuyBackShares={TotalCapitalLossBuyBackShares:-n0(A.aA.loss),
      CapitalLossBuyBackSharesDtls:bb.map(x=>({Rate:x.rate||"STL20",Amount:-n0(x.amt)}))};
    ST.TotalSTCG=sg(A.total);
    /* ---- Part B ---- */
    const LT={};
    if(ltLand.length)LT.SaleofLandBuild={SaleofLandBuildDtls:ltLand,TotalLTCGImmblPrprty:sg(B.b1),TotalExcessTax:n0(B.b1excess)};
    const p112=[];const pv=(o,r)=>{o=o||{};return {FullConsideration:n0(r.cons),DeductSec48:{AquisitCost:n0(o.cost),ImproveCost:n0(o.improve),ExpOnTrans:n0(o.exp),TotalDedn:n0(r.biv)},BalanceCG:sg(r.c),DeductionUs54F:n0(r.ded||0),CapgainonAssets:sg(r.gain)};};
    if(N((C.b3i||{}).cons)||N((C.b3ii||{}).cons)){const m={cons:N((C.b3i||{}).cons)+N((C.b3ii||{}).cons),cost:N((C.b3i||{}).cost)+N((C.b3ii||{}).cost),improve:N((C.b3i||{}).improve)+N((C.b3ii||{}).improve),exp:N((C.b3i||{}).exp)+N((C.b3ii||{}).exp)};
      const mr={cons:m.cons,biv:B.b3i.biv+B.b3ii.biv,c:B.b3i.c+B.b3ii.c,ded:(B.b3i.ded||0)+(B.b3ii.ded||0),gain:B.b3i.gain+B.b3ii.gain};p112.push({Proviso112SectionCode:"22",Proviso112Applicabledtls:pv(m,mr)});}
    if(N((C.b3iii||{}).cons))p112.push({Proviso112SectionCode:"5ACA1b",Proviso112Applicabledtls:pv(C.b3iii,B.b3iii)});
    if(p112.length)LT.Proviso112Applicable=p112;
    LT.SaleOfEquityShareUs112A={BalanceCG:sg(CG.s112a.bal),DeductionUs54F:n0((C.b4||{}).s54F),CapgainonAssets:sg(B.b4.gain)};
    LT.NRISaleOfEquityShareUs112A={BalanceCG:0,DeductionUs54F:0,CapgainonAssets:0};
    LT.NRISaleofForeignAsset={SaleonSpecAsset:n0(CG.nri?N((C.b8||{}).a):0),DednSpecAssetus115:n0(CG.nri?N((C.b8||{}).b):0),
      BalonSpeciAsset:sg(CG.nri?B.b8.gain:0)};
    LT.SaleofAssetNADtls={SaleofAssetNA:agg(C.b9,B.b9,{unq:1,ded54F:1,ded:1})};
    LT.TotalAmtDeemedLtcg=n0(B.b10.gain);
    const dml=(C.b10&&C.b10.deem||[]).filter(x=>N(x.unused));
    if(dml.length)LT.UnutilizedCg={UnutilizedCgPrvYrDtls:dml.map(x=>({PrvYrInWhichAsstTrnsfrd:["2023-24","2024-25"].indexOf(x.py)>=0?x.py:"2024-25",
      SectionClmd:x.sec||"54",YrInWhichAssetAcq:["2023","2024","2025"].indexOf(st0(x.acqyr).slice(0,4))>=0?st0(x.acqyr).slice(0,4):"2025",AmtUtilized:n0(x.used),AmtUnutilized:n0(x.unused)}))};
    if(N((C.b10||{}).other))LT.AmtDeemedLtcg=n0(C.b10.other);
    LT.PassThrIncNatureLTCG=n0(B.b11.gain);
    if(N((C.b11||{}).r125a))LT.PassThrIncNatureLTCGUs112A12_5Per=n0(C.b11.r125a);
    if(N((C.b11||{}).r125o))LT.PassThrIncNatureLTCG12_5Per=n0(C.b11.r125o);
    LT.TotalAmtNotTaxUsDTAALtcg=n0(B.b12.notTax);LT.TotalAmtTaxUsDTAALtcg=n0(B.b12.special);
    const bbl=(C.bA||[]).filter(x=>N(x.amt));
    if(bbl.length)LT.CapitalLossBuyBackShares={TotalCapitalLossBuyBackShares:-n0(B.bA.loss)};
    LT.TotalLTCG=sg(B.total);
    j.ScheduleCGFor23={ShortTermCapGainFor23:ST,LongTermCapGain23:LT,SumOfCGIncm:n0(CG.C1),
      IncmFromVDATrnsf:n0(CG.C2),TotScheduleCGFor23:n0(CG.C3)};
    /* ---- Part D — the sheet's exact columns per section ---- */
    const DED={};let dedTot=0;
    const KEY={"54":"DeducClaimDtlsUs54","54B":"DeducClaimDtlsUs54B","54EC":"DeducClaimDtlsUs54EC","54F":"DeducClaimDtlsUs54F","115F":"DeducClaimDtlsUs115F"};
    Object.keys(CG.dedD).forEach(sec=>{const key=KEY[sec];if(!key)return;
      CG.dedD[sec].forEach((r,k)=>{const d=((C.dedD||{})[sec]||[])[k]||{};
        const row={DateofTransfer:ISO(d.transfer)||"2025-04-01",AmtDeducted:n0(r.amt)};
        if(sec==="54EC"||sec==="115F"){row.AmtInvested=n0(d.cost);if(ISO(d.purchase))row.DateofInvestment=ISO(d.purchase);}
        else{if(sec==="54B")row.CostofNewAgriLand=n0(d.cost);else row.CostofNewResHouse=n0(d.cost);
          if(ISO(d.purchase))row.DateofPurchase=ISO(d.purchase);
          if(N(d.dep)){row.AmtDeposited=n0(d.dep);if(ISO(d.depdt))row.DepositDate=ISO(d.depdt);
            if(sv(d.acno))row.AccountNo=sv(d.acno).slice(0,20);
            if(IFSC_RE.test(st0(d.ifsc).toUpperCase()))row.IFSC=st0(d.ifsc).toUpperCase();}}
        (DED[key]=DED[key]||[]).push(row);dedTot+=r.amt;});});
    if(dedTot){DED.TotDeductClaim=n0(dedTot);j.ScheduleCGFor23.DeducClaimInfo=DED;}
    /* ---- Part E — the set-off matrix, on the schema's six slots ---- */
    const SL=[["st20","InStcg20Per","StclSetoff20Per"],["st30","InStcg30Per","StclSetoff30Per"],
      ["stApp","InStcgAppRate","StclSetoffAppRate"],["stDTAA","InStcgDTAARate","StclSetoffDTAARate"],
      ["lt125","InLtcg12_5Per","LtclSetOff12_5Per"],["ltDTAA","InLtcgDTAARate","LtclSetOffDTAARate"]];
    const E={InLossSetOff:{},TotLossSetOff:{},LossRemainSetOff:{}};
    SL.forEach(x=>{E.InLossSetOff[x[2]]=n0(CG.loss[x[0]]);E.TotLossSetOff[x[2]]=n0(CG.used[x[0]]);
      E.LossRemainSetOff[x[2]]=n0(CG.loss[x[0]]-CG.used[x[0]]);});
    SL.forEach(x=>{const node={CurrYearIncome:n0(CG.gain[x[0]])};
      SL.forEach(l=>{if(l[0]===x[0])return;
        if(x[0].startsWith("lt")||!l[0].startsWith("lt"))node[l[2]]=n0((CG.matrix[x[0]]||{})[l[0]]||0);});
      node.CurrYrCapGain=n0(CG.after[x[0]]);E[x[1]]=node;});
    j.ScheduleCGFor23.CurrYrLosses=E;
    /* ---- Part F — the quarters, edited or auto ---- */
    const QK=["Upto15Of6","Upto15Of9","Up16Of9To15Of12","Up16Of12To15Of3","Up16Of3To31Of3"];
    const FN={st20:"ShortTermUnder20Per",st30:"ShortTermUnder30Per",stApp:"ShortTermUnderAppRate",
      stDTAA:"ShortTermUnderDTAARate",lt125:"LongTermUnder12_5Per",ltDTAA:"LongTermUnderDTAARate"};
    const AF={};SL.forEach(x=>{const dr={};QK.forEach((q,i)=>dr[q]=n0(CG.F[x[0]][i]));AF[FN[x[0]]]={DateRange:dr};});
    if(CG.C2){const vq=[0,0,0,0,0];(C.vda||[]).forEach(r=>{if(r._&&r._.inc)vq[r._.q]+=r._.inc;});
      const dr={};QK.forEach((q,i)=>dr[q]=n0(vq[i]));AF.VDATrnsfGainsUnder30Per={DateRange:dr};}
    j.ScheduleCGFor23.AccruOrRecOfCG=AF;
  }

  /* ---- Schedule HP — one item per property, the book's keys ------- */
  if(S.hp&&S.hp.on&&(S.hp.props||[]).length){
    const items=(S.hp.props||[]).map((p,i)=>{const r=p._||engProp(p);
      const it={HPSNo:i+1,
        AddressDetailWithZipCode:{AddrDetail:(sv(p.addr)||"NA").slice(0,50),CityOrTownOrDistrict:(sv(p.city)||"NA").slice(0,50),
          StateCode:(p.country||"91")==="91"?(STATE[st0(p.state)]?st0(p.state):"19"):"99",CountryCode:st0(p.country)||"91"},
        PropertyOwner:p.owner||"SE",PropCoOwnedFlg:p.co==="YES"?"YES":"NO",AsseseeShareProperty:r.share,
        ifLetOut:p.type||"S",
        Rentdetails:{AnnualLetableValue:n0(r.a),TotalUnrealizedAndTax:n0(r.d),BalanceALV:n0(r.e),AnnualOfPropOwned:n0(r.f),
          ThirtyPercentOfBalance:n0(r.g),TotalDeduct:n0(r.i),IncomeOfHP:sg(r.k)}};
      if((p.country||"91")==="91"){if(/^[1-9]\d{5}$/.test(st0(p.pin)))it.AddressDetailWithZipCode.PinCode=parseInt(p.pin,10);}
      else if(sv(p.zip))it.AddressDetailWithZipCode.ZipCode=sv(p.zip).slice(0,8);
      if(p.owner==="OT"&&sv(p.ownerOther))it.PropertyOwnerOther=sv(p.ownerOther).slice(0,50);
      const co=(p.coowners||[]).filter(x=>st0(x.name));
      if(co.length)it.CoOwners=co.map((x,k)=>{const c={CoOwnersSNo:k+1,NameCoOwner:st0(x.name).slice(0,125)};
        if(PAN_RE.test(st0(x.pan).toUpperCase()))c.PAN_CoOwner=st0(x.pan).toUpperCase();
        if(AADH.test(st0(x.aadhaar)))c.Aadhaar_CoOwner=st0(x.aadhaar);if(N(x.share))c.PercentShareProperty=N(x.share);return c;});
      const tn=(p.tenants||[]).filter(x=>st0(x.name));
      if(tn.length)it.TenantDetails=tn.map((x,k)=>{const t={TenantSNo:k+1,NameofTenant:st0(x.name).slice(0,125)};
        if(PAN_RE.test(st0(x.pan).toUpperCase()))t.PANofTenant=st0(x.pan).toUpperCase();
        if(AADH.test(st0(x.aadhaar)))t.AadhaarofTenant=st0(x.aadhaar);if(sv(x.pantan))t.PANTANofTenant=st0(x.pantan).toUpperCase().slice(0,10);return t;});
      if(r.b)it.Rentdetails.RentNotRealized=n0(r.b);if(r.c)it.Rentdetails.LocalTaxes=n0(r.c);
      const soNew=isNew()&&(p.type||"S")==="S";   /* self-occupied under new regime: no 24(b) interest allowed */
      if(r.h&&!soNew)it.Rentdetails.IntOnBorwCap=n0(r.h);
      const ln=soNew?[]:(p.loans||[]).filter(l=>N(l.interest));
      if(ln.length)it.Rentdetails.Section24B={TotalInterestUs24B:n0(r.hRaw),Section24BDtls:ln.map(l=>({
        LoanTknFrom:l.from==="I"?"I":"B",BankOrInstnName:(sv(l.name)||"NA").slice(0,125),
        LoanAccNoOfBankOrInstnRefNo:(sv(l.acno)||"NA").slice(0,25),DateofLoan:ISO(l.dt)||"2025-04-01",
        TotalLoanAmt:n0(l.amt),LoanOutstndngAmt:n0(l.os),InterestUs24B:n0(l.interest)}))};
      if(r.jRecd)it.Rentdetails.ArrearsUnrealizedRentRcvd=n0(r.j);
      return it;});
    j.ScheduleHP={PropertyDetails:items,TotalIncomeChargeableUnHP:sg(P.income)};
    if(P.pti)j.ScheduleHP.PassThroghIncome=sg(P.pti);
  }

  /* ---- Schedule OS — the book's working, onto the real schema ----- */
  if(O.on){
    const X=S.os2,IO={};
    IO.GrossIncChrgblTaxAtAppRate=n0(O.one);
    IO.DividendGross=n0(O.a.tot);
    if(O.a.ord)IO.DividendOthThan22e=n0(O.a.ord);if(O.a.e22)IO.Dividend22e=n0(O.a.e22);if(O.a.f22)IO.Dividend22f=n0(O.a.f22);
    IO.InterestGross=n0(O.b.tot);IO.IntrstFrmSavingBank=n0(O.b.sav);IO.IntrstFrmTermDeposit=n0(O.b.dep);
    IO.IntrstFrmIncmTaxRefund=n0(O.b.refund);IO.NatofPassThrghIncome=n0(O.b.pti);
    if(O.b.pf11a)IO.IntrstSec10XIFirstProviso=n0(O.b.pf11a);if(O.b.pf11b)IO.IntrstSec10XISecondProviso=n0(O.b.pf11b);
    if(O.b.pf12a)IO.IntrstSec10XIIFirstProviso=n0(O.b.pf12a);if(O.b.pf12b)IO.IntrstSec10XIISecondProviso=n0(O.b.pf12b);
    IO.IntrstFrmOthers=n0(O.b.others);
    IO.RentFromMachPlantBldgs=n0(O.c);
    IO.Tot562x=n0(O.d.tot);IO.Aggrtvaluewithoutcons562x=n0(O.d.money);IO.Immovpropwithoutcons562x=n0(O.d.immWithout);
    IO.Immovpropinadeqcons562x=n0(O.d.immInadeq);IO.Anyotherpropwithoutcons562x=n0(O.d.othWithout);IO.Anyotherpropinadeqcons562x=n0(O.d.othInadeq);
    IO.FamilyPension=n0(O.e.fap);
    IO.IncomeNotified89AOS=n0(O.e.n89a);
    const cc=[["US","n89a_US"],["UK","n89a_UK"],["CA","n89a_CA"]].filter(x=>N(X.e[x[1]])).map(x=>({NOT89ACountrycode:x[0],NOT89AAmount:n0(X.e[x[1]])}));
    if(cc.length)IO.IncomeNotified89ATypeOS=cc;
    if(O.e.oth89a)IO.IncomeNotifiedOther89AOS=n0(O.e.oth89a);if(O.e.prev89a)IO.IncomeNotifiedPrYr89AOS=n0(O.e.prev89a);
    if(O.e.s562xii)IO.SumRecdPrYrBusTRU562xii=n0(O.e.s562xii);if(O.e.s562xiii)IO.SumRecdPrYrLifIns562xiii=n0(O.e.s562xiii);
    IO.AnyOtherIncome=n0(O.e.tot);
    const fr=(X.eOther||[]).filter(r=>N(r.amt)&&st0(r.nature));
    if(fr.length)IO.OthersInc={OthersIncDtls:fr.map(r=>({OthNatOfInc:st0(r.nature).slice(0,50),OthAmount:n0(r.amt)}))};
    IO.IncChargeableSpecialRates=n0(O.two);
    IO.LtryPzzlChrgblUs115BB=n0(O.sp.lottery);if(O.sp.online)IO.IncChrgblUs115BBJ=n0(O.sp.online);
    IO.IncChrgblUs115BBE=n0(O.sp.bbeTot);IO.CashCreditsUs68=n0(O.sp.bbe.s68);IO.UnExplndInvstmntsUs69=n0(O.sp.bbe.s69);
    IO.UnExplndMoneyUs69A=n0(O.sp.bbe.s69A);IO.UnDsclsdInvstmntsUs69B=n0(O.sp.bbe.s69B);IO.UnExplndExpndtrUs69C=n0(O.sp.bbe.s69C);
    IO.AmtBrwdRepaidOnHundiUs69D=n0(O.sp.bbe.s69D);
    const pf=(X.pf111||[]).filter(r=>N(r.incben)||N(r.taxben));
    IO.TaxAccumulatedBalRecPF={TotalIncomeBenefit:n0(O.sp.pf111inc),TotalTaxBenefit:n0(O.sp.pf111tax)};
    if(pf.length)IO.TaxAccumulatedBalRecPF.TaxAccmltdBalRecPFDtls=pf.map(r=>({AssessmentYear:st0(r.ay)||"2025-26",IncomeBenefit:n0(r.incben),TaxBenefit:n0(r.taxben)}));
    IO.OthersGross=n0(O.sp.spl);
    const sd=(X.spl||[]).filter(r=>N(r.amt));if(sd.length)IO.OthersGrossDtls=sd.map(r=>({SourceDescription:r.code||"5A1ai",SourceAmount:n0(r.amt)}));
    IO.PassThrIncOSChrgblSplRate=n0(O.sp.pti);
    const pt=(X.pti||[]).filter(r=>N(r.amt));if(pt.length)IO.PTIOthersGrossDtls=pt.map(r=>({SourceDescription:"PTI_"+(r.code||"5A1ai"),SourceAmount:n0(r.amt)}));
    const dt=(X.dtaa||[]).filter(r=>N(r.amt));
    if(dt.length)IO.IncChargblSplRateOS={TotalAmtTaxUsDTAASchOs:n0(O.sp.dtaa),NRIOsDTAA:{NRIDTAADtlsSchOS:dt.map(r=>{
      const t=/^nil$/i.test(st0(r.treaty))?0:N(r.treaty);
      return {DTAAamt:n0(r.amt),NatureOfIncome:r.nature||"1ai",ItemNoincl:r.itemno||"56i",CountryName:(sv(r.country)||"NA").slice(0,50),
        CountryCodeExcludingIndia:st0(r.code)||"1",DTAAarticle:(sv(r.article)||"NA").slice(0,25),RateAsPerTreaty:t,
        TaxRescertifiedFlag:r.trc==="N"?"N":"Y",RateAsPerITAct:N(r.itrate),ApplicableRate:Math.min(t,N(r.itrate))};})}};
    IO.Deductions={Expenses:n0(O.ded.exp),DeductionUs57iia:n0(O.ded.iia),Depreciation:n0(O.ded.dep),TotDeductions:n0(O.ded.tot)};
    if(O.ded.intClaimed){IO.Deductions.UsrIntExp57=n0(O.ded.intClaimed);IO.Deductions.IntExp57=n0(O.ded.intElig);}
    if(O.s58)IO.AmtNotDeductibleUs58=n0(O.s58);if(O.s59)IO.ProfitChargTaxUs59=n0(O.s59);if(O.rel89a)IO.Increliefus89AOS=n0(O.rel89a);
    IO.BalanceNoRaceHorse=sg(O.six);
    const SO={IncOthThanOwnRaceHorse:IO,TotOthSrcNoRaceHorse:n0(O.seven),IncChargeable:n0(O.nine)};
    if(O.horse.on)SO.IncFromOwnHorse={Receipts:n0(O.horse.rec),DeductSec57:n0(O.horse.ded57),AmtNotDeductibleUs58:n0(O.horse.s58),
      ProfitChargTaxUs59:n0(O.horse.s59),BalanceOwnRaceHorse:sg(O.horse.bal)};
    const QK=["Upto15Of6","Upto15Of9","Up16Of9To15Of12","Up16Of12To15Of3","Up16Of3To31Of3"];
    OS_Q.forEach(([k,l,key,req])=>{const q=O.Q[k];const has=q.some(v=>v);
      if(req||has){const dr={};QK.forEach((qq,i)=>dr[qq]=n0(q[i]));SO[key]={DateRange:dr};}});
    j.ScheduleOS=SO;
  }

  /* ---- Schedule VI-A and the sub-schedules, onto the real keys --- */
  {
    const MAP={c80c:"Section80C",c80ccc:"Section80CCC",c80ccd1:"Section80CCDEmployeeOrSE",c80ccd1b:"Section80CCD1B",
      c80ccd2:"Section80CCDEmployer",c80d:"Section80D",c80dd:"Section80DD",c80ddb:"Section80DDB",c80e:"Section80E",
      c80ee:"Section80EE",c80eea:"Section80EEA",c80eeb:"Section80EEB",c80g:"Section80G",c80gg:"Section80GG",
      c80gga:"Section80GGA",c80ggc:"Section80GGC",c80u:"Section80U",c80qqb:"Section80QQB",c80rrb:"Section80RRB",
      c80tta:"Section80TTA",c80ttb:"Section80TTB",c80cch:"AnyOthSec80CCH"};
    const usr={},ded={};
    Object.keys(MAP).forEach(k=>{const f=MAP[k];const claimed=V.fed&&V.fed[k]!==undefined?V.fed[k]:N(S.via[k]);
      if(claimed)usr[f]=n0(claimed);if(V.out[k])ded[f]=n0(V.out[k]);});
    ded.Section80D=n0(V.out.c80d);ded.Section80G=n0(V.out.c80g);ded.Section80GGA=n0(V.out.c80gga);
    usr.TotalChapVIADeductions=n0(V.total);
    {let sum=Object.keys(MAP).reduce((a,k)=>a+n0(V.out[k]),0);let cap=n0(V.allowed);
      if(sum>cap){let over=sum-cap;["c80cch","c80ttb","c80tta","c80rrb","c80qqb","c80u","c80ggc","c80gga","c80gg","c80g","c80eeb","c80eea","c80ee","c80e","c80ddb","c80dd","c80d","c80ccd2","c80ccd1b","c80ccd1","c80ccc","c80c"].forEach(k=>{if(over<=0)return;const f=MAP[k];const cut=Math.min(over,n0(ded[f]||0));if(cut){ded[f]=n0(ded[f])-cut;over-=cut;}});sum=cap;}
      ded.TotalChapVIADeductions=n0(sum);}
    const pc=(S.pen80ccc||[]).filter(r=>N(r.amt));
    if(pc.length)usr.PensionContribution80CCC=pc.map(r=>({TypeofIdentifier:r.type==="NPS"?"PRAN":"OTHPRAN",NameofIdentifier:(sv(r.id)||"NA").slice(0,50),Amount:n0(r.amt)}));
    if(/^\d{12}$/.test(st0(S.via.pran)))usr.PRANDtls=[{PRANNum:st0(S.via.pran)}];
    if(N(S.via.c80ddb)){usr.Section80DDBUsrType=S.via.ddb_type==="2"?"2":"1";if(st0(S.via.ddb_disease))usr.NameOfSpecDisease80DDB=st0(S.via.ddb_disease);}
    if(N(S.via.c80gg)&&/^\d{15}$/.test(st0(S.via.ack10ba)))usr.Form10BAAckNum=st0(S.via.ack10ba);
    if(N(S.via.c80qqb)&&/^\d{15}$/.test(st0(S.via.ack10ccd)))usr.Form10CCDAckNum=st0(S.via.ack10ccd);
    if(N(S.via.c80rrb)&&/^\d{15}$/.test(st0(S.via.ack10cce)))usr.Form10CCEAckNum=st0(S.via.ack10cce);
    j.ScheduleVIA={UsrDeductUndChapVIA:usr,DeductUndChapVIA:ded};
    /* 80C */
    const c80=(S.c80c||[]).filter(r=>N(r.amt));
    if(c80.length)j.Schedule80C={Schedule80CDtls:c80.map(r=>({Amount:n0(r.amt),IdentificationNo:(sv(r.id)||"NA").slice(0,50)})),TotalAmt:n0(c80.reduce((a,r)=>a+N(r.amt),0))};
    /* 80D */
    const D8=S.C.d80,d=S.d80||{};
    if(D8.eligible||d.selfSr==="Y"||(d.selfIns||[]).length||(d.parIns||[]).length||(d.selfSrIns||[]).length||(d.parSrIns||[]).length){
      const insArr=k=>(d[k]||[]).filter(r=>N(r.amt)).map(r=>({InsurerName:(sv(r.insurer)||"NA").slice(0,125),PolicyNo:(sv(r.policy)||"NA").slice(0,50),HealthInsAmt:n0(r.amt)}));
      const blk={SelfAndFamily:n0(D8.selfSr?0:D8.selfTot),SelfAndFamilySeniorCitizen:n0(D8.selfSr?D8.selfTot:0),
        Parents:n0(D8.parSr?0:D8.parTot),ParentsSeniorCitizen:n0(D8.parSr?D8.parTot:0),EligibleAmountOfDedn:n0(D8.eligible)};
      if(d.selfSr!=="N/A")blk.SeniorCitizenFlag=D8.selfSr?"Y":"N";
      if(d.parSr!=="N/A")blk.ParentsSeniorCitizenFlag=D8.parSr?"Y":"N";
      if(D8.aHI){blk.HealthInsPremSlfFam=n0(D8.aHI);const a=insArr("selfIns");if(a.length)blk.Sec80DSelfFamHIDtls={Sch80DInsDtls:a,TotalPayments:n0(D8.aHI)};}
      if(D8.aPHCu)blk.PrevHlthChckUpSlfFam=n0(D8.aPHCu);
      if(D8.bHI){blk.HlthInsPremSlfFamSrCtzn=n0(D8.bHI);const a=insArr("selfSrIns");if(a.length)blk.Sec80DSelfFamSrCtznHIDtls={Sch80DInsDtls:a,TotalPayments:n0(D8.bHI)};}
      if(D8.bPHCu)blk.PrevHlthChckUpSlfFamSrCtzn=n0(D8.bPHCu);if(D8.bMed)blk.MedicalExpSlfFamSrCtzn=n0(D8.bMed);
      if(D8.cHI){blk.HlthInsPremParents=n0(D8.cHI);const a=insArr("parIns");if(a.length)blk.Sec80DParentsHIDtls={Sch80DInsDtls:a,TotalPayments:n0(D8.cHI)};}
      if(D8.cPHCu)blk.PrevHlthChckUpParents=n0(D8.cPHCu);
      if(D8.dHI){blk.HlthInsPremParentsSrCtzn=n0(D8.dHI);const a=insArr("parSrIns");if(a.length)blk.Sec80DParentsSrCtznHIDtls={Sch80DInsDtls:a,TotalPayments:n0(D8.dHI)};}
      if(D8.dPHCu)blk.PrevHlthChckUpParentsSrCtzn=n0(D8.dPHCu);if(D8.dMed)blk.MedicalExpParentsSrCtzn=n0(D8.dMed);
      j.Schedule80D={Sec80DSelfFamSrCtznHealth:blk};
    }
    /* 80DD */
    if(N((S.dd80||{}).amt)){const x=S.dd80;j.Schedule80DD={NatureOfDisability:x.nature==="2"?"2":"1",TypeOfDisability:x.type==="2"?"2":"1",
      DeductionAmount:n0(V.out.c80dd),DependentType:st0(x.dep)||"1"};
      if(PAN_RE.test(st0(x.pan).toUpperCase()))j.Schedule80DD.DependentPan=st0(x.pan).toUpperCase();
      if(AADH.test(st0(x.aadhaar)))j.Schedule80DD.DependentAadhaar=st0(x.aadhaar);
      if(ISO(x.f10dt))j.Schedule80DD.Form10IAFilingDate=ISO(x.f10dt);if(/^\d{15}$/.test(st0(x.f10ack)))j.Schedule80DD.Form10IAAckNum=st0(x.f10ack);
      if(sv(x.udid))j.Schedule80DD.UDIDNum=sv(x.udid).slice(0,18);}
    /* 80U */
    if(N(S.via.c80u)){const x=S.u80||{};j.Schedule80U={NatureOfDisability:x.nature==="SelfSevere"?"2":"1",TypeOfDisability:x.type==="2"?"2":"1",DeductionAmount:n0(V.out.c80u)};
      if(ISO(x.dt))j.Schedule80U.Form10IAFilingDate=ISO(x.dt);if(/^\d{15}$/.test(st0(x.ack)))j.Schedule80U.Form10IAAckNum=st0(x.ack);if(sv(x.udid))j.Schedule80U.UDIDNum=sv(x.udid).slice(0,18);}
    /* 80E group */
    const loans=(arr,intKey)=>(arr||[]).filter(r=>N(r.interest)).map(r=>{const o={LoanTknFrom:r.from==="I"?"I":"B",BankOrInstnName:(sv(r.name)||"NA").slice(0,125),
      LoanAccNoOfBankOrInstnRefNo:(sv(r.acno)||"NA").slice(0,20),DateofLoan:ISO(r.dt)||"2025-04-01",TotalLoanAmt:n0(r.amt),LoanOutstndngAmt:n0(r.os)};
      if(intKey==="Interest80EEB")o.VehicleRegNo=(sv(r.reg)||"NA").slice(0,11);o[intKey]=n0(r.interest);return o;});
    const e=S.e80||{};
    [["e","Schedule80E","Schedule80EDtls","Interest80E","TotalInterest80E"],["ee","Schedule80EE","Schedule80EEDtls","Interest80EE","TotalInterest80EE"],
     ["eea","Schedule80EEA","Schedule80EEADtls","Interest80EEA","TotalInterest80EEA"],["eeb","Schedule80EEB","Schedule80EEBDtls","Interest80EEB","TotalInterest80EEB"]]
     .forEach(([k,blk,dk,ik,tk])=>{const L=loans(e[k],ik);if(L.length){const o={};if(k==="eea")o.PropStmpDtyVal=n0(e.eeaSdv);o[dk]=L;o[tk]=n0(L.reduce((a,r)=>a+r[ik],0));j[blk]=o;}});
    /* 80G — the four buckets, each with its own totals */
    const g=(S.g80||[]).filter(r=>N(r.amt));
    if(g.length){const BK={A:["Don100Percent","TotDon100PercentCash","TotDon100PercentOtherMode","TotDon100Percent","TotEligibleDon100Percent"],
        B:["Don50PercentNoApprReqd","TotDon50PercentNoApprReqdCash","TotDon50PercentNoApprReqdOtherMode","TotDon50PercentNoApprReqd","TotEligibleDon50Percent"],
        C:["Don100PercentApprReqd","TotDon100PercentApprReqdCash","TotDon100PercentApprReqdOtherMode","TotDon100PercentApprReqd","TotEligibleDon100PercentApprReqd"],
        D:["Don50PercentApprReqd","TotDon50PercentApprReqdCash","TotDon50PercentApprReqdOtherMode","TotDon50PercentApprReqd","TotEligibleDon50PercentApprReqd"]};
      const out={};let TC=0,TO=0,TT=0,TE=0;
      ["A","B","C","D"].forEach(b=>{const rows=g.filter(r=>(r.bucket||"A")===b);if(!rows.length)return;
        let c=0,ot=0,t=0,e=0;const dt=rows.map(r=>{const cash=n0(r.cash),oth=n0(r.other),amt=n0(r.amt);const el=cash>2000?oth:amt;c+=cash;ot+=oth;t+=amt;e+=el;
          const o={DoneeWithPanName:(sv(r.name)||"NA").slice(0,125),AddressDetail:{AddrDetail:(sv(r.addr)||"NA").slice(0,50),CityOrTownOrDistrict:(sv(r.city)||"NA").slice(0,50),
            StateCode:STATE[st0(r.state)]?st0(r.state):"19",PinCode:/^[1-9]\d{5}$/.test(st0(r.pin))?parseInt(r.pin,10):110001},
            DoneePAN:PAN_RE.test(st0(r.pan).toUpperCase())?st0(r.pan).toUpperCase():"AAAAA0000A",DonationAmtCash:cash,DonationAmtOtherMode:oth,DonationAmt:amt,EligibleDonationAmt:n0(el)};
          if(sv(r.arn))o.ArnNbr=sv(r.arn).slice(0,25);if(oth>0){o.TransactionRefNum=(sv(r.ref)||"NA").slice(0,50);if(IFSC_RE.test(st0(r.ifsc).toUpperCase()))o.IFSCCode=st0(r.ifsc).toUpperCase();}return o;});
        const K=BK[b];out[K[0]]={DoneeWithPan:dt,[K[1]]:n0(c),[K[2]]:n0(ot),[K[3]]:n0(t),[K[4]]:n0(e)};TC+=c;TO+=ot;TT+=t;TE+=e;});
      out.TotalDonationsUs80GCash=n0(TC);out.TotalDonationsUs80GOtherMode=n0(TO);out.TotalDonationsUs80G=n0(TT);out.TotalEligibleDonationsUs80G=n0(TE);
      j.Schedule80G=out;}
    /* 80GGA */
    const ga=(S.gga||[]).filter(r=>N(r.amt));
    if(ga.length){let tc=0,to=0,tt=0,te=0;const rows=ga.map(r=>{const cash=r.mode==="CASH"?n0(r.amt):0,oth=r.mode==="CASH"?0:n0(r.amt);const el=cash>10000?0:n0(r.amt);tc+=cash;to+=oth;tt+=n0(r.amt);te+=el;
      return {RelevantClauseUndrDedClaimed:r.clause||"80GGA2a",NameOfDonee:(sv(r.name)||"NA").slice(0,125),AddressDetail:{AddrDetail:(sv(r.addr)||"NA").slice(0,50),
        CityOrTownOrDistrict:(sv(r.city)||"NA").slice(0,50),StateCode:STATE[st0(r.state)]?st0(r.state):"19",PinCode:/^[1-9]\d{5}$/.test(st0(r.pin))?parseInt(r.pin,10):110001},
        DoneePAN:PAN_RE.test(st0(r.pan).toUpperCase())?st0(r.pan).toUpperCase():"AAAAA0000A",DonationAmtCash:cash,DonationAmtOtherMode:oth,DonationAmt:n0(r.amt),EligibleDonationAmt:n0(el)};});
      j.Schedule80GGA={DonationDtlsSciRsrchRuralDev:rows,TotalDonationAmtCash80GGA:n0(tc),TotalDonationAmtOtherMode80GGA:n0(to),TotalDonationsUs80GGA:n0(tt),TotalEligibleDonationAmt80GGA:n0(te)};}
    /* 80GGC */
    const gc=(S.ggc||[]).filter(r=>N(r.amt));
    if(gc.length){let tc=0,to=0,tt=0,te=0;const rows=gc.map(r=>{const cash=r.mode==="CASH"?n0(r.amt):0,oth=r.mode==="CASH"?0:n0(r.amt);tc+=cash;to+=oth;tt+=n0(r.amt);te+=oth;
      const o={DonationDate:ISO(r.dt)||"2025-04-01",DonationAmtCash:cash,DonationAmtOtherMode:oth,DonationAmt:n0(r.amt),EligibleDonationAmt:n0(oth)};
      if(sv(r.ref))o.TransactionRefNum=sv(r.ref).slice(0,50);if(IFSC_RE.test(st0(r.ifsc).toUpperCase()))o.IFSCCode=st0(r.ifsc).toUpperCase();
      if(sv(r.name))o.PoliticalPartyName=sv(r.name).slice(0,125);if(PAN_RE.test(st0(r.pan).toUpperCase()))o.PoliticalPartyPAN=st0(r.pan).toUpperCase();return o;});
      j.Schedule80GGC={Schedule80GGCDetails:rows,TotalDonationAmtCash80GGC:n0(tc),TotalDonationAmtOtherMode80GGC:n0(to),TotalDonationsUs80GGC:n0(tt),TotalEligibleDonationAmt80GGC:n0(te)};}
  }
  /* ---- Schedule 112A, 115AD proviso, VDA — their own blocks -------- */
  const scripBlock=(rows,suffix,dk)=>{const R_=(rows||[]).filter(r=>N(r.qty)&&N(r.price));if(!R_.length)return null;
    let sale=0,costNI=0,costA=0,before=0,fmv=0,exp=0,ded=0,bal=0;
    const dt=R_.map(r=>{const x=r._||{};sale+=x.sale;costNI+=x.cost;costA+=N(r.cost);before+=x.grand;fmv+=x.fmvTot;exp+=N(r.exp);ded+=x.ded;bal+=x.bal;
      const be=r.pre18==="BE";
      const o={ShareOnOrBefore:be?"BE":"AE",ISINCode:/^IN[0-9A-Z]{10}$/.test(st0(r.isin).toUpperCase())?st0(r.isin).toUpperCase():"INNOTREQUIRD",
        ShareUnitName:(sv(r.name)||"CONSOLIDATED").slice(0,125),NumSharesUnits:be?N(r.qty):0,SalePricePerShareUnit:be?N(r.price):0,TotSaleValue:n0(x.sale),
        CostAcqWithoutIndx:n0(x.cost),AcquisitionCost:N(r.cost),LTCGBeforelowerB1B2:be?n0(x.grand):0,ExpExclCnctTransfer:N(r.exp),TotalDeductions:n0(x.ded),Balance:sg(x.bal)};
      o.FairMktValuePerShareunit=be?N(r.fmv18):0;o.TotFairMktValueCapAst=be?n0(x.fmvTot):0;return o;});
    const o={};o[dk]=dt;o["SaleValue"+suffix]=n0(sale);o["CostAcqWithoutIndx"+suffix]=n0(costNI);o["AcquisitionCost"+suffix]=n0(costA);
    o["LTCGBeforelowerB1B2"+suffix]=n0(before);o["FairMktValueCapAst"+suffix]=n0(fmv);o["ExpExclCnctTransfer"+suffix]=n0(exp);
    o["Deductions"+suffix]=n0(ded);o["Balance"+suffix]=sg(bal);o["TotalBalance"+suffix]=sg(bal);return o;};
  const b112=scripBlock(S.cg.s112a,"112A","Schedule112ADtls");if(b112)j.Schedule112A=b112;
  const b115=scripBlock(S.cg.s115ad,"115AD","Schedule115ADDtls");if(b115)j.Schedule115AD=b115;
  const vr=(S.cg.vda||[]).filter(r=>ISO(r.buy)&&ISO(r.sale));
  if(vr.length)j.ScheduleVDA={ScheduleVDADtls:vr.map(r=>({DateofAcquisition:ISO(r.buy),DateofTransfer:ISO(r.sale),HeadUndIncTaxed:"CG",
    AcquisitionCost:n0(r.cost),ConsidReceived:n0(r.cons),IncomeFromVDA:n0(r._?r._.inc:0)})),TotIncCapGain:n0(CG.C2)};

  /* ====== the eight books — export onto the real keys ====== */
  {
    const P=S.C.paid,SI=S.C.si,AM=S.C.amt,AC=S.C.amtc,E2=S.C.ei2,PT=S.C.pti,FS=S.C.fsi,ES=S.C.esop,A5=S.C.s5a,AL=S.C.al2;
    const ded=(r,k)=>{const o={TAN:st0(r.tan).toUpperCase(),EmployerOrDeductorOrCollecterName:(sv(r.name)||"NA").slice(0,125)};return o;};
    /* TDS 1 */
    const t1=(S.tds1||[]).filter(r=>N(r.tds)&&TAN_RE.test(st0(r.tan).toUpperCase()));
    j.ScheduleTDS1={TotalTDSonSalaries:n0(P.t1)};if(t1.length)j.ScheduleTDS1.TDSonSalary=t1.map(r=>({EmployerOrDeductorOrCollectDetl:ded(r),IncChrgSal:n0(r.inc),TotalTDSSal:n0(r.tds)}));
    /* TDS 2 / 3 */
    const tdsRow=(r,buyer)=>{const o={TDSCreditName:r.who==="O"?"O":"S"};
      if(r.who==="O"){if(PAN_RE.test(st0(r.othPan).toUpperCase()))o.PANofOtherPerson=st0(r.othPan).toUpperCase();if(AADH.test(st0(r.othAadh)))o.AadhaarOfOtherPerson=st0(r.othAadh);}
      if(buyer){o.PANOfBuyerTenant=PAN_RE.test(st0(r.pan).toUpperCase())?st0(r.pan).toUpperCase():"AAAAA0000A";if(AADH.test(st0(r.aadh)))o.AadhaarOfBuyerTenant=st0(r.aadh);}
      else o.TANOfDeductor=st0(r.tan).toUpperCase();
      o.TDSSection=TDSSEC.some(x=>x[0]===r.sec)?r.sec:"94A";if(N(r.bf)&&DEDYR.indexOf(st0(r.yr))>=0){o.DeductedYr=parseInt(r.yr,10);o.BroughtFwdTDSAmt=n0(r.bf);}
      const c={TaxClaimedOwnHands:n0(r.claimOwn)};if(N(r.dedOwn))c.TaxDeductedOwnHands=n0(r.dedOwn);if(N(r.dedOthInc))c.TaxDeductedIncome=n0(r.dedOthInc);if(N(r.dedOthTds))c.TaxDeductedTDS=n0(r.dedOthTds);
      if(N(r.claimOthInc))c.TaxClaimedIncome=n0(r.claimOthInc);if(N(r.claimOthTds))c.TaxClaimedTDS=n0(r.claimOthTds);
      if(PAN_RE.test(st0(r.claimOthPan).toUpperCase()))c.TaxClaimedSpouseOthPrsnPAN=st0(r.claimOthPan).toUpperCase();if(AADH.test(st0(r.claimOthAadh)))c.SpouseOthPrsnAadhaar=st0(r.claimOthAadh);
      o.TaxDeductCreditDtls=c;if(N(r.gross))o.GrossAmount=n0(r.gross);const hd=st0(r.head)||TDS_HEAD_OF[r.sec]||(buyer?"OS":"NA");o.HeadOfIncome=hd;o.AmtCarriedFwd=n0(r._cf||0);return o;};
    const t2=(S.tds2||[]).filter(r=>N(r.claimOwn)||N(r.dedOwn)).filter(r=>TAN_RE.test(st0(r.tan).toUpperCase()));
    j.ScheduleTDS2={TotalTDSonOthThanSals:n0(P.t2)};if(t2.length)j.ScheduleTDS2.TDSOthThanSalaryDtls=t2.map(r=>tdsRow(r,false));
    const t3=(S.tds3||[]).filter(r=>N(r.claimOwn)||N(r.dedOwn));
    j.ScheduleTDS3={TotalTDS3OnOthThanSal:n0(P.t3)};if(t3.length)j.ScheduleTDS3.TDS3onOthThanSalDtls=t3.map(r=>tdsRow(r,true));
    /* TCS */
    const tc=(S.tcs||[]).filter(r=>N(r.claimOwn)||N(r.collOwn)).filter(r=>st0(r.tan));
    j.ScheduleTCS={TotalSchTCS:n0(P.tcs)};if(tc.length)j.ScheduleTCS.TCS=tc.map(r=>{const o={TCSCreditOwner:r.who==="2"?"2":"1",EmployerOrDeductorOrCollectTAN:st0(r.tan).toUpperCase().slice(0,10)};
      if(r.who==="2"&&PAN_RE.test(st0(r.othPan).toUpperCase()))o.PANOfSpouseOrOthrPrsn=st0(r.othPan).toUpperCase();if(N(r.bf)&&DEDYR.indexOf(st0(r.yr))>=0){o.DeductedYr=parseInt(r.yr,10);o.BroughtFwdTDSAmt=n0(r.bf);}
      o.TCSCurrFYDtls={TCSAmtCollOwnHand:n0(r.collOwn),TCSAmtCollSpouseOrOthrHand:n0(r.collOth)};const cl={TCSAmtCollOwnHand:n0(r.claimOwn),TCSAmtCollSpouseOrOthrHand:n0(r.claimOth)};
      if(PAN_RE.test(st0(r.claimOthPan).toUpperCase()))cl.PANOfSpouseOrOthrPrsn=st0(r.claimOthPan).toUpperCase();o.TCSClaimedThisYearDtls=cl;o.AmtCarriedFwd=n0(r._cf||0);return o;});
    /* IT */
    const ch=(S.it||[]).filter(c=>N(c.amt)&&BSR.test(st0(c.bsr).toUpperCase())&&ISO(c.dt)&&/^\d{1,5}$/.test(st0(c.sn)));
    j.ScheduleIT={TotalTaxPayments:n0(P.adv+P.sat)};if(ch.length)j.ScheduleIT.TaxPayment=ch.map(c=>({BSRCode:st0(c.bsr).toUpperCase(),DateDep:ISO(c.dt),SrlNoOfChaln:parseInt(c.sn,10),Amt:n0(c.amt)}));
    /* SPI */
    const sp=(S.spi||[]).filter(r=>st0(r.name)&&N(r.amt));
    if(sp.length)j.ScheduleSPI={SpecifiedPerson:sp.map(r=>{const o={SpecifiedPersonName:st0(r.name).slice(0,125),ReltnShip:(sv(r.rel)||"NA").slice(0,50),AmtIncluded:n0(r.amt),HeadIncIncluded:st0(r.head)||"OS"};
      if(PAN_RE.test(st0(r.pan).toUpperCase()))o.PANofSpecPerson=st0(r.pan).toUpperCase();if(AADH.test(st0(r.aadhaar)))o.AaadhaarOfSpecPerson=st0(r.aadhaar);return o;})};
    /* SI */
    if(SI.rows.length)j.ScheduleSI={SplCodeRateTax:SI.rows.map(r=>({SecCode:r.code,SplRatePercent:r.rate,SplRateInc:n0(r.inc),SplRateIncTax:n0(r.tax)})),TotSplRateInc:n0(SI.rows.reduce((a,r)=>a+n0(r.inc),0)),TotSplRateIncTax:n0(SI.totTax),EditAutopoulatedDetail:"N"};
    /* AMT / AMTC */
    if(AM.applies){j.ScheduleAMT={TotalIncItemPartBTI:n0(S.C.ti),DeductionClaimUndrAnySec:n0(AM.partC),AdjustedUnderSec115JC:n0(AM.adjusted),TaxPayableUnderSec115JC:n0(AM.amt)};}
    if(AC.used||AC.curr||AC.gross){const rows=AC.rows.filter(x=>x.gross||x.setoff);
      j.ScheduleAMTC={TaxSection115JC:n0(AC.tax115JC),TaxOthProvisions:n0(AC.taxOther),AmtTaxCreditAvailable:n0(AC.avail),
        CurrAssYr:"2026-27",CurrYrAmtCreditFwd:n0(AC.curr),CurrYrCreditCarryFwd:n0(AC.curr),TotAMTGross:n0(AC.gross),TotSetOffEys:n0(AC.setoff),TotBalBF:n0(AC.bf),
        TotAmtCreditUtilisedCY:n0(AC.used),TotBalAMTCreditCF:n0(AC.cfTotal),TaxSection115JD:n0(AC.used),AmtLiabilityAvailable:n0(AC.cfTotal)};
      if(rows.length)j.ScheduleAMTC.ScheduleAMTCDtls=rows.map(x=>({AssYr:x.y,Gross:n0(x.gross),AmtCreditSetOfEy:n0(x.setoff),AmtCreditBalBroughtFwd:n0(x.bf),AmtCreditUtilized:n0(x.used),BalAmtCreditCarryFwd:n0(x.cf)}));}
    /* EI */
    if(E2.total||(S.ei2&&S.ei2.on)){const X=S.ei2||{};const o={NetAgriIncOrOthrIncRule7:n0(E2.netAgri),Others:n0(E2.others),IncNotChrgblToTax:n0(E2.dtaa),TotalExemptInc:n0(E2.total)};
      if(E2.interest)o.InterestInc=n0(E2.interest);if(N(X.agriGross)){o.GrossAgriRecpt=n0(X.agriGross);o.ExpIncAgri=n0(X.agriExp);o.UnabAgriLossPrev8=n0(X.agriUnab);}
      const land=(X.land||[]).filter(r=>st0(r.district));if(E2.landReq&&land.length)o.ExcNetAgriInc={ExcNetAgriIncDtls:land.map(r=>({NameOfDistrict:st0(r.district).slice(0,125),PinCode:parseInt(st0(r.pin)||"110001",10),MeasurementOfLand:N(r.acres),AgriLandOwnedFlag:r.owned==="H"?"H":"O",AgriLandIrrigatedFlag:r.irr==="RF"?"RF":"IRG"}))};
      const oth=(X.others||[]).filter(r=>N(r.amt));if(oth.length)o.OthersInc={OthersIncDtls:oth.map(r=>{const q={OthAmount:n0(r.amt)};if(st0(r.cat))q.Category=r.cat;if(st0(r.sub))q.SubCategory=r.sub;
        if(sv(r.desc)&&["Incmexmptcircular","Incmexmptnotification","Receiptnotincme"].indexOf(r.sub)>=0)q.Description=sv(r.desc).slice(0,125);return q;})};
      const dt=(X.dtaa||[]).filter(r=>N(r.amt));if(dt.length)o.IncNotChrgblAsPerDTAA={IncNotChrgblAsPerDTAADtls:dt.map(r=>({AmountOfIncome:n0(r.amt),NatureOfIncome:(sv(r.nature)||"NA").slice(0,75),CountryName:(sv(r.country)||"NA").slice(0,55),CountryCodeExcludingIndia:st0(r.code)||"1",ArticleOfDTAA:(sv(r.article)||"NA").slice(0,16),HeadOfIncome:st0(r.head)||"OS",TRCFlag:r.trc==="N"?"N":"Y"}))};
      if(E2.pti)o.PassThrIncNotChrgblTax=n0(E2.pti);j.ScheduleEI=o;}
    /* PTI */
    const pb=(S.pti2||[]).filter(b=>st0(b.name));
    if(pb.length){const leaf=(b,k,withLoss)=>{const r=((b.rows||{})[k])||{};const o={AmountOfInc:n0(r.inc),NetIncomeLoss:sg(N(r.inc)-N(r.loss)),TDSAmount:n0(r.tds)};if(withLoss)o.CurrYrLossShareByInvstFund=n0(r.loss);return o;};
      j.SchedulePTI={SchedulePTIDtls:pb.map(b=>{const st=leaf(b,"st111a",1),so=leaf(b,"stOth",1),lt=leaf(b,"lt112a",1),lo=leaf(b,"ltOth",1);
        const sum=(a,c)=>({AmountOfInc:a.AmountOfInc+c.AmountOfInc,CurrYrLossShareByInvstFund:a.CurrYrLossShareByInvstFund+c.CurrYrLossShareByInvstFund,NetIncomeLoss:a.NetIncomeLoss+c.NetIncomeLoss,TDSAmount:a.TDSAmount+c.TDSAmount});
        const ex23=leaf(b,"ex23fbb",0),exB=leaf(b,"exB",0),exC=leaf(b,"exC",0);
        return {InvstmntCvrdUs115UA115UB:b.kind||"A",BusinessName:st0(b.name).slice(0,125),BusinessPAN:PAN_RE.test(st0(b.pan).toUpperCase())?st0(b.pan).toUpperCase():"AAAAA0000A",
          IncFromHP:leaf(b,"hp",1),CapitalGainsPTI:{ShortTermCG:sum(st,so),STCG_Sec111A:st,STCG_Others:so,LongTermCG:sum(lt,lo),LTCG_Sec112A:lt,LTCG_Others:lo},
          IncClmdPTI:{TotalSec23FBB:{AmountOfInc:ex23.AmountOfInc+exB.AmountOfInc+exC.AmountOfInc,NetIncomeLoss:ex23.NetIncomeLoss+exB.NetIncomeLoss+exC.NetIncomeLoss,TDSAmount:ex23.TDSAmount+exB.TDSAmount+exC.TDSAmount},Sec23FBB:ex23},
          IncOthSrc:{AmountOfInc:leaf(b,"osDiv",0).AmountOfInc+leaf(b,"osOth",0).AmountOfInc,NetIncomeLoss:leaf(b,"osDiv",0).NetIncomeLoss+leaf(b,"osOth",0).NetIncomeLoss,TDSAmount:leaf(b,"osDiv",0).TDSAmount+leaf(b,"osOth",0).TDSAmount},
          OS_Dividend:leaf(b,"osDiv",0),OS_Others:leaf(b,"osOth",0)};})};}
    /* FSI / TR */
    const fb=(FS.blocks||[]).filter(b=>st0(b.code));
    if(fb.length&&S.pi.res!=="NRI"){const hd=(h)=>{const o={IncFrmOutsideInd:n0(h.inc),TaxPaidOutsideInd:n0(h.paid),TaxPayableinInd:n0(h.payable),TaxReliefinInd:n0(h.relief)};if(h.article)o.DTAAReliefUs90or90A=h.article.slice(0,16);return o;};
      j.ScheduleFSI={ScheduleFSIDtls:fb.map(b=>({CountryName:(sv(b.name)||"NA").slice(0,55),CountryCodeExcludingIndia:st0(b.code),TaxIdentificationNo:(sv(b.tin)||"NA").slice(0,75),
        IncFromSal:hd(b._.heads.sal),IncFromHP:hd(b._.heads.hp),IncCapGain:hd(b._.heads.cg),IncOthSrc:hd(b._.heads.os),TotalCountryWise:{IncFrmOutsideInd:n0(b._.tot.inc),TaxPaidOutsideInd:n0(b._.tot.paid),TaxPayableinInd:n0(b._.tot.payable),TaxReliefinInd:n0(b._.tot.relief)}}))};
      const trr={ScheduleTR:FS.tr.map(r=>({CountryName:(sv(r.name)||"NA").slice(0,55),CountryCodeExcludingIndia:st0(r.code),TaxIdentificationNo:(sv(r.tin)||"NA").slice(0,75),TaxPaidOutsideIndia:n0(r.paid),TaxReliefOutsideIndia:n0(r.relief),ReliefClaimedUsSection:r.sec})),
        TotalTaxPaidOutsideIndia:n0(FS.paidTot),TotalTaxReliefOutsideIndia:n0(FS.reliefTot),TaxReliefOutsideIndiaDTAA:n0(FS.dtaaRel),TaxReliefOutsideIndiaNotDTAA:n0(FS.noDtaaRel),TaxPaidOutsideIndFlg:(S.tr2||{}).refundFlag==="YES"?"YES":"NO"};
      if((S.tr2||{}).refundFlag==="YES"){trr.AmtTaxRefunded=n0(S.tr2.refundAmt);if(sv(S.tr2.refundAY))trr.AssmtYrTaxRelief=sv(S.tr2.refundAY).slice(0,7);}j.ScheduleTR1=trr;}
    /* FA */
    if(S.pi.res==="RES"){const F=S.fa2||{},fa={};const cc=r=>({CountryName:(sv(r.country)||"NA").slice(0,55),CountryCodeExcludingIndia:st0(r.code)||"1"});
      const g=(arr,fn)=>(arr||[]).filter(r=>st0(r.code)).map(fn);
      let a=g(F.bank,r=>Object.assign(cc(r),{Bankname:(sv(r.inst)||"NA").slice(0,125),AddressOfBank:(sv(r.addr)||"NA").slice(0,200),ZipCode:(sv(r.zip)||"NA").slice(0,8),ForeignAccountNumber:(sv(r.acno)||"NA").slice(0,34),OwnerStatus:r.status||"OWNER",AccOpenDate:ISO(r.opened)||"2025-01-01",PeakBalanceDuringYear:n0(r.peak),ClosingBalance:n0(r.close),IntrstAccured:n0(r.interest)}));if(a.length)fa.DetailsForiegnBank=a;
      a=g(F.cust,r=>Object.assign(cc(r),{FinancialInstName:(sv(r.inst)||"NA").slice(0,125),FinancialInstAddress:(sv(r.addr)||"NA").slice(0,200),ZipCode:(sv(r.zip)||"NA").slice(0,8),AccountNumber:(sv(r.acno)||"NA").slice(0,34),Status:r.status||"OWNER",AccOpenDate:ISO(r.opened)||"2025-01-01",PeakBalanceDuringPeriod:n0(r.peak),ClosingBalance:n0(r.close),GrossAmtPaidCredited:n0(r.gross),NatureOfAmount:r.nature||"N"}));if(a.length)fa.DtlsForeignCustodialAcc=a;
      a=g(F.equity,r=>Object.assign(cc(r),{NameOfEntity:(sv(r.entity)||"NA").slice(0,125),AddressOfEntity:(sv(r.addr)||"NA").slice(0,200),ZipCode:(sv(r.zip)||"NA").slice(0,8),NatureOfEntity:(sv(r.nature)||"NA").slice(0,34),InterestAcquiringDate:ISO(r.acq)||"2025-01-01",InitialValOfInvstmnt:n0(r.initial),PeakBalanceDuringPeriod:n0(r.peak),ClosingBalance:n0(r.close),TotGrossAmtPaidCredited:n0(r.paid),TotGrossProceeds:n0(r.proceeds)}));if(a.length)fa.DtlsForeignEquityDebtInterest=a;
      a=g(F.insur,r=>Object.assign(cc(r),{FinancialInstName:(sv(r.inst)||"NA").slice(0,125),FinancialInstAddress:(sv(r.addr)||"NA").slice(0,200),ZipCode:(sv(r.zip)||"NA").slice(0,8),ContractDate:ISO(r.dt)||"2025-01-01",CashValOrSurrenderVal:n0(r.cashval),TotGrossAmtPaidCredited:n0(r.paid)}));if(a.length)fa.DtlsForeignCashValueInsurance=a;
      const off=r=>({IncTaxAmt:n0(r.offAmt),IncTaxSch:st0(r.offSch)||"NI",IncTaxSchNo:(sv(r.offItem)||"NA").slice(0,50)});
      a=g(F.fin,r=>Object.assign(cc(r),{ZipCode:(sv(r.zip)||"NA").slice(0,8),NatureOfEntity:sv(r.nature),NameOfEntity:(sv(r.entity)||"NA").slice(0,125),AddressOfEntity:(sv(r.addr)||"NA").slice(0,200),NatureOfInt:r.interest||"DIRECT",DateHeld:ISO(r.since)||"2025-01-01",TotalInvestment:n0(r.cost),IncFromInt:n0(r.inc),NatureOfInc:(sv(r.incNature)||"NA").slice(0,100)},off(r)));if(a.length)fa.DetailsFinancialInterest=a;
      a=g(F.imm,r=>Object.assign(cc(r),{ZipCode:(sv(r.zip)||"NA").slice(0,8),AddressOfProperty:sv(r.addr),Ownership:r.own||"DIRECT",DateOfAcq:ISO(r.acq)||"2025-01-01",TotalInvestment:n0(r.cost),IncDrvProperty:n0(r.inc),NatureOfInc:(sv(r.incNature)||"NA").slice(0,100)},off(r)));if(a.length)fa.DetailsImmovableProperty=a;
      a=g(F.oth,r=>Object.assign(cc(r),{ZipCode:(sv(r.zip)||"NA").slice(0,8),NatureOfAsset:(sv(r.nature)||"NA").slice(0,100),Ownership:r.own||"DIRECT",DateOfAcq:ISO(r.acq)||"2025-01-01",TotalInvestment:n0(r.cost),IncDrvAsset:n0(r.inc),NatureOfInc:(sv(r.incNature)||"NA").slice(0,100)},off(r)));if(a.length)fa.DetailsOthAssets=a;
      a=g(F.sign,r=>{const o=Object.assign({NameOfInstitution:(sv(r.inst)||"NA").slice(0,125),AddressOfInstitution:(sv(r.addr)||"NA").slice(0,200)},cc(r),{ZipCode:(sv(r.zip)||"NA").slice(0,8),NameMentionedInAccnt:(sv(r.holder)||"NA").slice(0,125),InstitutionAccountNumber:(sv(r.acno)||"NA").slice(0,34),PeakBalanceOrInvestment:n0(r.peak),IncAccuredTaxFlag:r.taxable==="Y"?"Y":"N"});
        if(r.taxable==="Y"){o.IncAccuredInAcc=n0(r.inc);o.IncOfferedAmt=n0(r.offAmt);o.IncOfferedSch=st0(r.offSch)||"NI";o.IncOfferedSchNo=(sv(r.offItem)||"NA").slice(0,50);}return o;});if(a.length)fa.DetailsOfAccntsHvngSigningAuth=a;
      a=g(F.trust,r=>{const o=Object.assign(cc(r),{ZipCode:(sv(r.zip)||"NA").slice(0,8),NameOfTrust:(sv(r.trust)||"NA").slice(0,125),AddressOfTrust:(sv(r.trustAddr)||"NA").slice(0,200),NameOfOtherTrustees:(sv(r.trustees)||"NA").slice(0,125),AddressOfOtherTrustees:(sv(r.trusteesAddr)||"NA").slice(0,200),NameOfSettlor:(sv(r.settlor)||"NA").slice(0,125),AddressOfSettlor:(sv(r.settlorAddr)||"NA").slice(0,200),NameOfBeneficiaries:(sv(r.benef)||"NA").slice(0,125),AddressOfBeneficiaries:(sv(r.benefAddr)||"NA").slice(0,200),DateHeld:ISO(r.since)||"2025-01-01",IncDrvTaxFlag:r.taxable==="Y"?"Y":"N"});
        if(r.taxable==="Y"){o.IncDrvFromTrust=n0(r.inc);o.IncOfferedAmt=n0(r.offAmt);o.IncOfferedSch=st0(r.offSch)||"NI";o.IncOfferedSchNo=(sv(r.offItem)||"NA").slice(0,50);}return o;});if(a.length)fa.DetailsOfTrustOutIndiaTrustee=a;
      if(Object.keys(fa).length)j.ScheduleFA=fa;}
    /* 5A */
    if(S.pi.s5a==="Yes"){const hd=x=>({IncRecvdUndHead:n0(x.inc),AmtApprndOfSpouse:n0(x.spouse),AmtTDSDeducted:n0(x.tds),TDSApprndOfSpouse:n0(x.tdsSp)});const X=S.sch5a2||{};
      const o={NameOfSpouse:(sv(X.name)||"NA").slice(0,125),PANOfSpouse:PAN_RE.test(st0(X.pan).toUpperCase())?st0(X.pan).toUpperCase():"AAAPA0000A",HPHeadIncome:hd(A5.heads[0]),CapGainHeadIncome:hd(A5.heads[1]),OtherSourcesHeadIncome:hd(A5.heads[2]),TotalHeadIncome:hd(A5.tot)};
      if(AADH.test(st0(X.aadhaar)))o.AadhaarOfSpouse=st0(X.aadhaar);j.Schedule5A2014=o;}
    /* ESOP */
    if(st0((S.esop||{}).pan)||ES.due||ES.soldTotal){const X=S.esop||{};const o={PanofStartUp:PAN_RE.test(st0(X.pan).toUpperCase())?st0(X.pan).toUpperCase():"AAAAA0000A",DPIITRegNo:(sv(X.dpiit)||"NA").slice(0,50),TotalTaxAttributedAmt:n0(ES.soldTotal)};
      const KEY={"2021-22":"2122","2022-23":"2223","2023-24":"2324","2024-25":"2425","2025-26":"2526"},TK={"2021-22":"21","2022-23":"22","2023-24":"23","2024-25":"24","2025-26":"25"};
      ES.rows.forEach(r=>{const y=((X.yrs||{})[r.y])||{};if(!r.bf&&!r.sold)return;const ev={SecurityType:r.sec};const sl=(y.sales||[]).filter(s=>N(s.amt)&&ISO(s.dt));
        if(sl.length)ev.ScheduleESOPEventDtlsType=sl.map(s=>({Date:ISO(s.dt),TaxAttributedAmt:n0(s.amt)}));ev.CeasedEmployee=r.ceased;if(r.ceased==="Y"&&ISO(y.ceasedDt))ev.DateOfCeasing=ISO(y.ceasedDt);
        const blk={AssessmentYear:r.y,TaxDeferredBFEarlierAY:n0(r.bf),ScheduleESOPEventDtls:ev,TaxPayableCurrentAY:n0(r.payable),BalanceTaxCF:n0(r.cf)};blk["TotalTaxAttributedAmt"+TK[r.y]]=n0(r.sold);o["ScheduleESOP"+KEY[r.y]+"_Type"]=blk;});
      if(N(X.deferNow))o.ScheduleESOP2627_Type={AssessmentYear:"2026-27",BalanceTaxCF:n0(X.deferNow)};j.ScheduleESOP=o;}
    /* AL */
    if(AL.required||AL.imm||AL.mov||AL.liab){const X=S.al2||{};const o={MovableAsset:{DepositsInBank:n0(X.bank),SharesAndSecurities:n0(X.shares),InsurancePolicies:n0(X.insur),LoansAndAdvancesGiven:n0(X.loans),CashInHand:n0(X.cash),JewelleryBullionEtc:n0(X.jewel),ArchCollDrawPaintSulpArt:n0(X.art),VehiclYachtsBoatsAircrafts:n0(X.vehicle)},LiabilityInRelatAssets:n0(X.liab)};
      const im=(X.imm||[]).filter(r=>N(r.amt));if(X.hasImm==="Y"&&im.length)o.ImmovableDetails=im.map(r=>{const ad={ResidenceNo:(sv(r.flat)||"NA").slice(0,50),LocalityOrArea:(sv(r.locality)||"NA").slice(0,50),CityOrTownOrDistrict:(sv(r.city)||"NA").slice(0,50),StateCode:(st0(r.country)||"91")==="91"?(STATE[st0(r.state)]?st0(r.state):"19"):"99",CountryCode:st0(r.country)||"91"};
        if(sv(r.premises))ad.ResidenceName=sv(r.premises).slice(0,50);if(sv(r.road))ad.RoadOrStreet=sv(r.road).slice(0,50);if(/^[1-9]\d{5}$/.test(st0(r.pin)))ad.PinCode=parseInt(r.pin,10);else if(sv(r.zip))ad.ZipCode=sv(r.zip).slice(0,8);
        return {Description:(sv(r.desc)||"NA").slice(0,25),AddressAL:ad,Amount:n0(r.amt)};});j.ScheduleAL=o;}
  }

  /* ---- Part B-TI (real paths) ------------------------------------ */



  const LI=L.inc,LB=L.afterB;const spl4b=R(O.special-(O.sp?O.sp.dtaaNotTax:0));
  put(j,"PartB-TI.Salaries",n0(A.income));
  put(j,"PartB-TI.IncomeFromHP",n0(Math.max(0,P.income)));
  const st=["st20","st30","stApp","stDTAA"].map(k=>n0(LI[k])),lt=["lt125","ltDTAA"].map(k=>n0(LI[k]));
  put(j,"PartB-TI.CapGain.ShortTerm.ShortTerm20Per",st[0]);put(j,"PartB-TI.CapGain.ShortTerm.ShortTerm30Per",st[1]);
  put(j,"PartB-TI.CapGain.ShortTerm.ShortTermAppRate",st[2]);put(j,"PartB-TI.CapGain.ShortTerm.ShortTermSplRateDTAA",st[3]);
  put(j,"PartB-TI.CapGain.ShortTerm.TotalShortTerm",st.reduce((a,v)=>a+v,0));
  put(j,"PartB-TI.CapGain.LongTerm.LongTerm12_5Per",lt[0]);put(j,"PartB-TI.CapGain.LongTerm.LongTermSplRateDTAA",lt[1]);
  put(j,"PartB-TI.CapGain.LongTerm.TotalLongTerm",lt.reduce((a,v)=>a+v,0));
  const cgTot=st.reduce((a,v)=>a+v,0)+lt.reduce((a,v)=>a+v,0);
  put(j,"PartB-TI.CapGain.ShortTermLongTermTotal",cgTot);
  put(j,"PartB-TI.CapGain.CapGains30Per115BBH",n0(CG.vda.cg));
  put(j,"PartB-TI.CapGain.TotalCapGains",cgTot+n0(CG.vda.cg));
  put(j,"PartB-TI.IncFromOS.OtherSrcThanOwnRaceHorse",n0(Math.max(0,O.six||0)));
  put(j,"PartB-TI.IncFromOS.IncChargblSplRate",spl4b);
  put(j,"PartB-TI.IncFromOS.FromOwnRaceHorse",n0(Math.max(0,O.horse.bal)));
  put(j,"PartB-TI.IncFromOS.TotIncFromOS",n0(Math.max(0,O.six||0))+spl4b+n0(Math.max(0,O.horse.bal)));
  /* 5 = the heads before any set-off; 6 = current-year losses set off (CYLA); 7 = 5 − 6; 8 = brought forward set off; 9 = 7 − 8 */
  const heads=n0(A.income)+n0(Math.max(0,P.income))+["st20","st30","stApp","stDTAA","lt125","ltDTAA"].reduce((a,k)=>a+n0(LI[k]),0)+n0(CG.vda.cg)
    +n0(Math.max(0,O.six||0))+spl4b+n0(Math.max(0,O.horse.bal));
  const cyl=n0(L.totHPset+L.totOSset),bfl=n0(L.totBFset);
  put(j,"PartB-TI.TotalTI",heads);
  put(j,"PartB-TI.CurrentYearLoss",cyl);
  put(j,"PartB-TI.BalanceAfterSetoffLosses",Math.max(0,heads-cyl));
  put(j,"PartB-TI.BroughtFwdLossesSetoff",bfl);
  put(j,"PartB-TI.GrossTotalIncome",Math.max(0,heads-cyl-bfl));
  put(j,"PartB-TI.IncChargeTaxSplRate111A112",n0(S.C.si.totInc));
  put(j,"PartB-TI.DeductionsUnderScheduleVIA",n0(V.allowed));
  put(j,"PartB-TI.TotalIncome",n0(S.C.ti));
  put(j,"PartB-TI.IncChargeableTaxSplRates",n0(S.C.si.totInc));
  put(j,"PartB-TI.NetAgricultureIncomeOrOtherIncomeForRate",n0(T.agri));
  put(j,"PartB-TI.AggregateIncome",n0(T.aggFlag?(S.C.ti-S.C.si.totInc+T.agri):0));
  put(j,"PartB-TI.LossesOfCurrentYearCarriedFwd",n0(L.cf.total));
  put(j,"PartB-TI.DeemedIncomeUs115JC",n0(AM.applies?AM.adjusted:0));

  /* ---- ScheduleCYLA / BFLA / CFL — every live row, the schema's keys ---- */
  {
    const CY={},BF={};
    LOSS_ROWS.forEach(r=>{const [k,,key,f]=r;
      const c={IncOfCurYrUnderThatHead:n0(L.inc[k]),IncOfCurYrAfterSetOff:n0(L.afterC[k])};
      if(f.hp)c.HPlossCurYrSetoff=n0(L.setHP[k]);if(f.os)c.OthSrcLossNoRaceHorseSetoff=n0(L.setOS[k]);
      const required=["STCG20Per","STCG30Per","STCGAppRate","STCGDTAARate","LTCG12_5Per","LTCGDTAARate"].indexOf(key)>=0;
      if(required||L.inc[k]||L.setHP[k]||L.setOS[k])CY[key]={IncCYLA:c};
      const b={IncOfCurYrUndHeadFromCYLA:n0(L.afterC[k]),IncOfCurYrAfterSetOffBFLosses:n0(L.afterB[k])};
      if(f.bf)b.BFlossPrevYrUndSameHeadSetoff=n0(L.setBF[k]);
      if(required||key==="Salary"||L.afterC[k]||L.setBF[k])BF[key]={IncBFLA:b};});
    CY.TotalCurYr={TotHPlossCurYr:n0(L.hpTotal),TotOthSrcLossNoRaceHorse:n0(L.osLoss)};
    CY.TotalLossSetOff={TotHPlossCurYrSetoff:n0(L.totHPset),TotOthSrcLossNoRaceHorseSetoff:n0(L.totOSset)};
    CY.LossRemAftSetOff={BalHPlossCurYrAftSetoff:n0(L.hpRemain),BalOthSrcLossNoRaceHorseAftSetoff:n0(L.osRemain)};
    CY.EditAutopoulatedDetail=S.loss.editC?"Y":"N";
    j.ScheduleCYLA=CY;
    BF.TotalBFLossSetOff={TotBFLossSetoff:n0(L.totBFset)};
    BF.IncomeOfCurrYrAftCYLABFLA=n0(L.gti);
    BF.EditAutopoulatedDetail=S.loss.editB?"Y":"N";
    j.ScheduleBFLA=BF;
    /* CFL — only when something is brought forward or carried */
    const anyCFL=CFL_YEARS.some(([y])=>{const r=(S.loss.cfl||{})[y]||{};return N(r.hp)||N(r.st)||N(r.lt)||N(r.horse);})||L.cf.total>0;
    if(anyCFL){const C={};
      CFL_YEARS.forEach(([y,key,horseOK])=>{const r=(S.loss.cfl||{})[y]||{};
        if(!(N(r.hp)||N(r.st)||N(r.lt)||(horseOK&&N(r.horse))))return;
        const d={DateOfFiling:ISO(r.dt)||"2025-07-31",TotalHPPTILossCF:n0(r.hp),TotalSTCGPTILossCF:n0(r.st),TotalLTCGPTILossCF:n0(r.lt)};
        if(horseOK&&N(r.horse))d.OthSrcLossRaceHorseCF=n0(r.horse);
        C[key]={CarryFwdLossDetail:d};});
      const sum=(o)=>{const d={TotalHPPTILossCF:n0(o.hp),TotalSTCGPTILossCF:n0(o.st),TotalLTCGPTILossCF:n0(o.lt)};if(o.horse)d.OthSrcLossRaceHorseCF=n0(o.horse);return {LossSummaryDetail:d};};
      C.TotalOfBFLossesEarlierYrs=sum(L.bf);C.AdjTotBFLossInBFLA=sum(L.usedBF);C.CurrentAYloss=sum(L.curr);C.TotalLossCFSummary=sum(L.cf);
      j.ScheduleCFL=C;}
  }

  /* ---- Part B-TTI (real paths) ----------------------------------- */
  put(j,"PartB_TTI.TaxPayDeemedTotIncUs115JC",n0(AM.applies?AM.amt:0));
  put(j,"PartB_TTI.Surcharge",n0(AM.applies?AM.sur:0));put(j,"PartB_TTI.HealthEduCess",n0(AM.applies?AM.cess:0));put(j,"PartB_TTI.TotalTaxPayablDeemedTotInc",n0(AM.applies?AM.total:0));
  const CTL=j.PartB_TTI.ComputationOfTaxLiability;
  put(CTL,"TaxPayableOnTI.TaxAtNormalRatesOnAggrInc",n0(T.normalTax));
  put(CTL,"TaxPayableOnTI.TaxAtSpecialRates",n0(T.splTax));
  put(CTL,"TaxPayableOnTI.RebateOnAgriInc",n0(T.agriRebate));
  put(CTL,"TaxPayableOnTI.TaxPayableOnTotInc",n0(T.taxOn));
  put(CTL,"Rebate87A",n0(T.rebate));
  put(CTL,"TaxPayableOnRebate",n0(Math.max(0,T.taxOn-T.rebate)));
  put(CTL,"Surcharge25ofSI",n0(T.surI));
  put(CTL,"SurchargeOnAboveCrore",n0(T.surII));
  put(CTL,"Surcharge25ofSIBeforeMarginal",n0(T.surI));
  put(CTL,"SurchargeOnAboveCroreBeforeMarginal",n0(T.surII+T.mr));
  put(CTL,"TotalSurcharge",n0(T.sur));
  put(CTL,"EducationCess",n0(T.cess));
  put(CTL,"GrossTaxLiability",n0(T.gross));
  put(CTL,"GrossTaxPayable",n0(T.gross));
  put(CTL,"CreditUS115JD",n0(I.credit));
  put(CTL,"TaxPayAfterCreditUs115JD",n0(I.afterCredit));
  put(CTL,"GrossTaxPayable",n0(I.grossPayable));
  put(CTL,"GrossTaxPay",{TaxInc17:n0(I.grossPayable-I.esopDef),TaxDeferred17:n0(I.esopDef),TaxDeferredPayableCY:n0(I.esopDue)});
  const relief=I.relief;
  if(relief){put(CTL,"TaxRelief.Section89",n0(S.tax.s89));
    put(CTL,"TaxRelief.Section90",n0(I.rel90));put(CTL,"TaxRelief.Section91",n0(I.rel91));put(CTL,"TaxRelief.TotTaxRelief",n0(relief));}
  put(CTL,"NetTaxLiability",n0(I.net));
  put(CTL,"IntrstPay.IntrstPayUs234A",n0(I.i234a));
  put(CTL,"IntrstPay.IntrstPayUs234B",n0(I.i234b));
  put(CTL,"IntrstPay.IntrstPayUs234C",n0(I.i234c));
  put(CTL,"IntrstPay.LateFilingFee234F",Math.min(5000,n0(I.f234f)));
  if(I.f234i)put(CTL,"IntrstPay.FeeFurnish234I",Math.min(99999,n0(I.f234i)));
  put(CTL,"IntrstPay.TotalIntrstPay",n0(I.total));
  put(CTL,"AggregateTaxInterestLiability",n0(I.aggregate));
  put(j,"PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax",n0(I.adv));
  put(j,"PartB_TTI.TaxPaid.TaxesPaid.TDS",n0(I.tds));
  put(j,"PartB_TTI.TaxPaid.TaxesPaid.TCS",n0(I.tcs));
  put(j,"PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax",n0(I.sat));
  put(j,"PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid",n0(I.paid));
  put(j,"PartB_TTI.TaxPaid.BalTaxPayable",n0(I.balance));
  put(j,"PartB_TTI.Refund.RefundDue",n0(I.refund));
  const bk=S.bank.filter(b=>IFSC_RE.test(st0(b.ifsc).toUpperCase())&&st0(b.acno)&&st0(b.bank));
  put(j,"PartB_TTI.Refund.BankAccountDtls.BankDtlsFlag",bk.length?"Y":"N");
  if(bk.length)j.PartB_TTI.Refund.BankAccountDtls.AddtnlBankDetails=bk.map(b=>({
    IFSCCode:st0(b.ifsc).toUpperCase(),BankName:st0(b.bank).slice(0,125),
    BankAccountNo:st0(b.acno).slice(0,20),
    AccountType:ACCT.some(a=>a[0]===b.type)?b.type:"SB",
    UseForRefund:b.refund==="Y"?"true":"false"}));
  put(j,"PartB_TTI.AssetOutIndiaFlag",(S.pi.res==="RES"&&Object.keys(S.fa2||{}).some(k=>(S.fa2[k]||[]).length))?"YES":"NO");

  put(j,"Verification.Declaration.AssesseeVerName",sv(S.ver.name));
  if(S.trp&&st0(S.trp.name)&&st0(S.trp.id))j.TaxReturnPreparer={IdentificationNoOfTRP:st0(S.trp.id).slice(0,10),NameOfTRP:st0(S.trp.name).slice(0,125),ReImbFrmGov:n0(S.trp.reimb)};
  put(j,"Verification.Declaration.FatherName",sv(S.ver.father));
  put(j,"Verification.Declaration.AssesseeVerPAN",sv(st0(S.ver.pan).toUpperCase()));
  put(j,"Verification.Capacity",S.ver.cap||"S");
  put(j,"Verification.Place",(sv(S.ver.place)||"NA").slice(0,50));
  return {ITR:{ITR2:j}};
}
function auditShape(b){const miss=[],bad=[];
  (function w(req,got,path){Object.keys(req).forEach(k=>{const p=path?path+"."+k:k;
    if(!(k in got)||got[k]===undefined){miss.push(p);return;}
    const r=req[k],g=got[k];
    if(r!==null&&typeof r==="object"&&!Array.isArray(r)){
      if(typeof g!=="object"||Array.isArray(g))bad.push(p+" should be an object");else w(r,g,p);
    } else if(typeof r==="number"){if(typeof g!=="number"||!isFinite(g)||g%1!==0)bad.push(p+" should be a whole number");
    } else if(typeof r==="string"){if(typeof g!=="string"||!g)bad.push(p+" should be text");}});
  })(SKEL,b.ITR.ITR2,"");return {miss,bad};}
function auditRules(b){const j=b.ITR.ITR2,out=[];
  const g=(p,d)=>{let o=j;for(const k of p.split(".")){if(Array.isArray(o))o=o[+k];
    else if(o&&k in o)o=o[k];else return d===undefined?0:d;}return o==null?(d===undefined?0:d):o;};
  const R_=(w,l,r,t)=>{if(Math.abs(l-r)>(t||1))out.push(w+" (out by "+F(l-r)+")");};
  R_("total income is not gross total income less Chapter VI-A",g("PartB-TI.TotalIncome"),
    Math.max(0,Math.round((g("PartB-TI.GrossTotalIncome")-g("PartB-TI.DeductionsUnderScheduleVIA"))/10)*10),10);
  const C="PartB_TTI.ComputationOfTaxLiability.";
  R_("tax on total income does not add up (2a + 2b − 2c)",g(C+"TaxPayableOnTI.TaxPayableOnTotInc"),
    Math.max(0,g(C+"TaxPayableOnTI.TaxAtNormalRatesOnAggrInc")+g(C+"TaxPayableOnTI.TaxAtSpecialRates")-g(C+"TaxPayableOnTI.RebateOnAgriInc")));
  R_("gross tax liability does not add up (4 + 5iv + 6)",g(C+"GrossTaxLiability"),
    Math.max(0,g(C+"TaxPayableOnTI.TaxPayableOnTotInc")-g(C+"Rebate87A"))
    +g(C+"TotalSurcharge")+g(C+"EducationCess"),2);
  R_("the interest and fee do not add up",g(C+"IntrstPay.TotalIntrstPay"),
    g(C+"IntrstPay.IntrstPayUs234A")+g(C+"IntrstPay.IntrstPayUs234B")+g(C+"IntrstPay.IntrstPayUs234C")+g(C+"IntrstPay.LateFilingFee234F")+g(C+"IntrstPay.FeeFurnish234I"));
  R_("the aggregate does not add up",g(C+"AggregateTaxInterestLiability"),
    g(C+"NetTaxLiability")+g(C+"IntrstPay.TotalIntrstPay"));
  R_("the taxes paid do not add up",g("PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid"),
    g("PartB_TTI.TaxPaid.TaxesPaid.AdvanceTax")+g("PartB_TTI.TaxPaid.TaxesPaid.TDS")
    +g("PartB_TTI.TaxPaid.TaxesPaid.TCS")+g("PartB_TTI.TaxPaid.TaxesPaid.SelfAssessmentTax"));
  R_("the balance payable does not follow",g("PartB_TTI.TaxPaid.BalTaxPayable"),
    Math.max(0,g(C+"AggregateTaxInterestLiability")-g("PartB_TTI.TaxPaid.TaxesPaid.TotalTaxesPaid")));
  return out;}
/* When the new regime is in force, section 115BAC bars every Chapter VI-A
   deduction except 80CCD(2)/80CCH, and the sub-schedules (80C, 80D, 80DD, 80U,
   80E/EE/EEA/EEB, 80G, 80GGA, 80GGC, RA) plus AMT/AMTC must NOT appear in the
   return. The government utility hides those sheets; here we clear them on a
   snapshot for the export only, then restore, so nothing the user typed is lost. */
function stripNewRegimeDeductions(){
  const snap={};
  ["via","c80c","pen80ccc","pen80ccd1","pen80ccd1b","g80","gga","ggc","ra","d80","u80","dd80","e80","amt","amtc"].forEach(k=>snap[k]=S[k]);
  S.via={c80ccd2:S.via.c80ccd2,c80cch:S.via.c80cch};
  S.c80c=[];S.pen80ccc=[];S.pen80ccd1=[];S.pen80ccd1b=[];
  S.g80=[];S.gga=[];S.ggc=[];S.ra=[];
  S.d80={};S.u80={};S.dd80={};S.e80={};S.amt={};S.amtc={};
  return snap;
}
async function exportJSON(){
  const snap=isNew()?stripNewRegimeDeductions():null;
  const restore=()=>{if(snap){Object.assign(S,snap);compute();}};
  compute();
  const errs=S.C.checks.filter(c=>c.lvl==="err");
  if(errs.length){restore();alert(errs.length+" thing"+(errs.length>1?"s":"")+" still to fix:\n\n"+
    errs.slice(0,8).map(e=>"· "+e.t+" — "+e.m).join("\n")+
    (errs.length>8?"\n\n…and "+(errs.length-8)+" more.":""));return;}
  const b=buildITR2(),a=auditShape(b);
  if(a.miss.length||a.bad.length){restore();alert("The return did not come out in the shape the schema requires:\n\n"+
    a.miss.slice(0,6).map(x=>"missing "+x).concat(a.bad.slice(0,6)).join("\n"));return;}
  const r=auditRules(b);
  if(r.length){restore();alert("The return does not agree with itself:\n\n"+r.slice(0,8).join("\n"));return;}
  /* the department's own validation rules — Category A stops the upload, D is a warning */
  let rr=[];try{rr=runRules(b.ITR.ITR2,S);}catch(e){console.error("rules",e);}
  const rA=rr.filter(x=>x.cat==="A"),rD=rr.filter(x=>x.cat==="D");S.C.rules=rr;
  if(rA.length){restore();alert("The portal would reject this return — "+rA.length+" Category A rule"+(rA.length>1?"s":"")+" fail"+(rA.length>1?"":"s")+":\n\n"+
    rA.slice(0,10).map(x=>"A"+x.n+" · "+x.msg).join("\n")+(rA.length>10?"\n\n…and "+(rA.length-10)+" more. The full list is under Bank and verification.":""));paint(true);return;}
  if(rD.length)alert("Exported. "+rD.length+" Category D notice"+(rD.length>1?"s":"")+" to act on after upload:\n\n"+rD.map(x=>"D"+x.n+" · "+x.msg).join("\n"));
  /* sign exactly as the utility does: compact JSON with Digest "-", HMAC it,
     substitute, write compact (the portal recomputes over the uploaded bytes) */
  b.ITR.ITR2.CreationInfo.Digest="-";
  const forHash=JSON.stringify(b);
  let digest;
  try{ digest=await computeDigest(forHash); }
  catch(e){ restore();alert("Could not compute the signing digest in this browser.\n\n"+
    "Use a modern browser (Chrome/Edge/Firefox); the Web Crypto API is required.\n\n"+e); return; }
  b.ITR.ITR2.CreationInfo.Digest=digest;
  download((S.pi.pan||"ITR2")+"_ITR2_AY2026-27.json",JSON.stringify(b));
  restore();}
function rulesPanel(){let rr=[];try{const b=buildITR2();rr=runRules(b.ITR.ITR2,S);}catch(e){return note("The department's rules could not be run yet — "+(e.message||e),"warn");}
  const rA=rr.filter(x=>x.cat==="A"),rD=rr.filter(x=>x.cat==="D");
  let h=sub("The department's validation rules — ITR-2, AY 2026-27, version 1.0");
  h+=note((rA.length?"<b>"+rA.length+" Category A rule"+(rA.length>1?"s":"")+" fail</b> — the portal would reject the upload.":"<b>Every Category A rule passes.</b> The portal would accept the upload.")+
    (rD.length?" "+rD.length+" Category D notice"+(rD.length>1?"s":"")+" — the return uploads but a form or claim needs to follow.":""),rA.length?"stop":"");
  if(rA.length||rD.length){h+='<div class="full"><table class="gt" style="min-width:800px"><thead><tr><th class="l" style="width:70px">Rule</th><th class="l" style="width:90px">Category</th><th class="l">What the portal checks</th></tr></thead><tbody>';
    rA.concat(rD).forEach(x=>h+='<tr><td class="l">'+x.cat+x.n+'</td><td class="l">'+(x.cat==="A"?"A — rejected":"D — notice")+'</td><td class="l">'+esc(x.msg)+'</td></tr>');h+='</tbody></table></div>';}
  return h;}