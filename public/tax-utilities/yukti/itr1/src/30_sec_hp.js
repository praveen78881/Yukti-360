/* =====================================================================
   ITR-1 · Section "hp" — Income from house property
   Screen ref: HP sheet (Sheet19), PropertyDetails[] + the head total.
   Compute order 40, screen order 40.

   Built from books/ITR-1/schema_tree.md §7.3 (PropertyDetails[] +
   TotalIncomeChargeableUnHP), caps.md §5 (self-occupied 24(b) ceiling
   ₹2,00,000, the ₹2,00,000 HP-loss set-off ceiling, 30% standard
   deduction) and §1 (self-occupied 24(b) disallowed under the new
   regime), enums.json (PropertyOwner, ifLetOut, PropCoOwnedFlg,
   LoanTknFrom, StateCode) and the prev engine engProp()/engHP() in
   forms/ITR-1/Yukti_ITR1_prev.html — with the caps.md fixes applied.

   Owns / writes on export (no other builder writes these leaves):
     ITR1_IncomeDeductions.PropertyDetails[] (address, owner, co-owners,
       tenants, Rentdetails incl. Section24B loan table) and
     ITR1_IncomeDeductions.TotalIncomeChargeableUnHP

   Publishes S.C.hp.{total, loss, ...}: total is the SIGNED head income
   after the ₹2,00,000 loss cap (MAX(-200000, netHP)); loss is its
   magnitude when negative. The GTI consumer applies the new-regime floor.

   caps.md fixes over the prev builder:
     · self-occupied 24(b) interest capped at ₹2,00,000 (per property);
     · the ₹2,00,000 HP-LOSS set-off ceiling — enforce MAX(-200000, netHP)
       (the prev builder MISSED this);
     · new regime: self-occupied 24(b) interest disallowed.
   Reads S.C.ret.regime for the regime.
   ===================================================================== */

const _HP_OWNER=[["SE","Self"],["MI","Minor"],["SP","Spouse"],["OT","Others"]];
const _HP_TYPE=[["S","Self occupied"],["L","Let out"],["D","Deemed let out"]];
const _HP_LOAN=[["B","Bank"],["I","Institution / other than a bank"]];
const _HP_YN=[["N","No"],["Y","Yes"]];
const _HP_STATE=[["01","Andaman and Nicobar Islands"],["02","Andhra Pradesh"],
 ["03","Arunachal Pradesh"],["04","Assam"],["05","Bihar"],["06","Chandigarh"],
 ["07","Dadra and Nagar Haveli"],["08","Daman and Diu"],["09","Delhi"],["10","Goa"],
 ["11","Gujarat"],["12","Haryana"],["13","Himachal Pradesh"],["14","Jammu and Kashmir"],
 ["15","Karnataka"],["16","Kerala"],["17","Lakshadweep"],["18","Madhya Pradesh"],
 ["19","Maharashtra"],["20","Manipur"],["21","Meghalaya"],["22","Mizoram"],["23","Nagaland"],
 ["24","Orissa"],["25","Pondicherry"],["26","Punjab"],["27","Rajasthan"],["28","Sikkim"],
 ["29","Tamil Nadu"],["30","Tripura"],["31","Uttar Pradesh"],["32","West Bengal"],
 ["33","Chhattisgarh"],["34","Uttarakhand"],["35","Jharkhand"],["36","Telangana"],
 ["37","Ladakh"],["99","Foreign / other"]];
const _HP_STATECODES=_HP_STATE.map(s=>s[0]);

function _hpIsOld(){
  const r=RG(S,"C.ret.regime","");
  if(r==="old"||r==="Old"||r==="OLD"||r==="Y"||r==="y"||r===2||r==="2")return true;
  if(r==="new"||r==="New"||r==="NEW"||r==="N"||r==="n"||r===1||r==="1")return false;
  if(typeof isNew==="function"){try{return !isNew();}catch(e){}}
  return false;                                   /* AY2026-27 default = new */
}
function _hpIsNew(){return !_hpIsOld();}

/* ---- state seed (never clobber shell / import) --------------------- */
S.hp=S.hp||{};
S.hp.props=S.hp.props||[];

/* ---- one property -------------------------------------------------- */
function _hpProp(p){
  p=p||{};
  const isNewR=_hpIsNew();
  const type=["S","L","D"].indexOf(st0(p.type))>=0?st0(p.type):"S";
  const self=type==="S";
  const sh=Math.min(100, Math.max(0, N(p.share)||100))/100;
  const alv=self?0:R(N(p.rent)*sh);
  const rentNotReal=self?0:R(N(p.rentNotReal)*sh);
  const taxes=self?0:R(N(p.taxes)*sh);
  const unrealAndTax=rentNotReal+taxes;
  const balanceALV=Math.max(0, alv-unrealAndTax);
  const annualOwned=balanceALV;                       /* owner's share of NAV */
  const std=annualOwned>0?R(0.30*annualOwned):0;      /* 30% standard deduction */
  /* 24(b) interest — from the loan table (Section24BDtls), else a single field */
  const loans=Array.isArray(p.loans)?p.loans:[];
  let rawInt=loans.length?R(loans.reduce((a,l)=>a+N(l.int),0)*sh):R(N(p.interest)*sh);
  let interest=rawInt, cut=0;
  if(self){
    if(isNewR){cut=interest;interest=0;}              /* new regime: self-occ 24(b) disallowed */
    else if(interest>200000){cut=interest-200000;interest=200000;} /* self-occ ceiling 2L */
  }
  const arrears=R(N(p.arrears)*0.70*sh);              /* arrears/unrealised rent, less 30% */
  const totalDeduct=std+interest;
  const income=R(annualOwned-totalDeduct+arrears);
  return {type,self,sh,alv,rentNotReal,taxes,unrealAndTax,balanceALV,annualOwned,
    std,rawInt,interest,cut,arrears,totalDeduct,income};
}

/* ---- engine -------------------------------------------------------- */
function engHP(){
  S.C=S.C||{};
  const isNewR=_hpIsNew();
  const props=(S.hp&&S.hp.props)||[];
  const rows=props.map(p=>{const r=_hpProp(p);p._=r;return r;});
  const net=R(rows.reduce((a,r)=>a+r.income,0));       /* signed sum across properties */
  const capped=Math.max(-200000, net);                 /* ₹2,00,000 HP-loss set-off ceiling */
  const loss=capped<0?-capped:0;
  /* income = alias the ded income-cap / 80G adjusted-GTI base reads (S.C.hp.income);
     the new-regime floor on a loss is applied by the GTI consumer (tax), so the
     signed head income (capped) is published here as both total and income. */
  S.C.hp={rows, net, total:capped, income:capped, loss, isNew:isNewR, count:props.length};
  return S.C.hp;
}

/* ---- renderer ------------------------------------------------------ */
function secHP(){
  const H=S.C.hp||engHP();
  const isNewR=H.isNew;
  let h="";
  h+=note("A house you occupy yourself has a nil annual value, so only the interest on borrowed "+
    "capital counts. A let-out or deemed let-out property is taxed on its rent less the tax paid "+
    "to local authorities, a thirty per cent standard deduction and the interest.");

  (S.hp.props||[]).forEach((p,i)=>{
    const r=p._||_hpProp(p);
    const co=st0(p.co)==="Y"||st0(p.co)==="YES";
    const label=(_HP_TYPE.find(t=>t[0]===r.type)||["","—"])[1];
    const status=st0(p.addr1)?(label+" · "+(r.income<0?"loss "+RS(-r.income):RS(r.income))):"not filled";
    let b="";
    b+=sub("The property");
    b+=row("Type of house property",sel("hp.props."+i+".type",_HP_TYPE,{blank:false}),{req:1});
    b+=row("Owner of the property",sel("hp.props."+i+".owner",_HP_OWNER),{req:1});
    if(st0(p.owner)==="OT")
      b+=row("Describe the owner",inp("hp.props."+i+".ownerOther",{max:100}),{ind:1,req:1});
    b+=row("Flat, door or block number",inp("hp.props."+i+".addr1"),{req:1});
    b+=row("Town, city or district",inp("hp.props."+i+".city"),{req:1});
    b+=row("State",sel("hp.props."+i+".state",_HP_STATE));
    b+=row("PIN code",inp("hp.props."+i+".pin",{max:6}));
    b+=row("Is the property co-owned?",sel("hp.props."+i+".co",_HP_YN,{blank:false}),{req:1});
    if(co){
      b+=row("Share of the assessee, per cent",inp("hp.props."+i+".share",{n:1}),{req:1});
      b+=grid("hp.props."+i+".coowners",
        [{k:"name",h:"Name of the co-owner",t:"txt",w:"auto",req:1},
         {k:"pan",h:"PAN",t:"txt",w:"130px",max:10},
         {k:"aadhaar",h:"Aadhaar",t:"txt",w:"150px",max:12},
         {k:"share",h:"Share, per cent",t:"num",w:"120px",req:1}],
        p.coowners||[],{min:"720px",empty:"No co-owner listed.",add:"Add a co-owner"});
    }
    if(r.type!=="S"){
      b+=grid("hp.props."+i+".tenants",
        [{k:"name",h:"Name of the tenant",t:"txt",w:"auto",req:1},
         {k:"pan",h:"PAN of the tenant",t:"txt",w:"130px",max:10},
         {k:"tan",h:"PAN/TAN of the tenant",t:"txt",w:"140px",max:10}],
        p.tenants||[],{min:"680px",empty:"No tenant listed.",add:"Add a tenant"});
      b+=sub("Rent");
      b+=row("Annual lettable value, or rent received or receivable",
        inp("hp.props."+i+".rent",{n:1}),{req:1,ref:"1a"});
      b+=row("Rent that could not be realised",inp("hp.props."+i+".rentNotReal",{n:1}),{ref:"1b"});
      b+=row("Tax paid to local authorities",inp("hp.props."+i+".taxes",{n:1}),{ref:"1c"});
      b+=row("Balance annual value",cell(r.balanceALV),{cls:"tot",ref:"1d"});
      b+=row("Thirty per cent of the annual value",cell(r.std),{ref:"1e"});
    } else {
      b+=note("The annual value of a self-occupied house is nil, so only the interest counts.");
    }

    /* 24(b) — the loan table (Section24BDtls) */
    b+=sub("Interest on borrowed capital — section 24(b)");
    b+=grid("hp.props."+i+".loans",
      [{k:"type",h:"Loan from",t:"sel",w:"200px",req:1,opts:_HP_LOAN},
       {k:"lender",h:"Name of the bank or institution",t:"txt",w:"auto",req:1},
       {k:"acno",h:"Loan account / reference number",t:"txt",w:"180px"},
       {k:"dt",h:"Date the loan was taken",t:"date",w:"150px"},
       {k:"amt",h:"Total loan",t:"num",w:"130px"},
       {k:"os",h:"Outstanding on 31-03-2026",t:"num",w:"160px"},
       {k:"int",h:"Interest for the year",t:"num",w:"150px",req:1}],
      p.loans||[],{min:"1340px",empty:"No loan listed.",add:"Add a loan"});
    b+=row("Interest allowed under section 24(b)",cell(r.interest),
      {ref:"1f",hint:r.self?(isNewR?"closed under the new regime":"up to ₹2,00,000 for a self-occupied house")
                       :"no ceiling on a let-out property"});
    if(r.cut>0)b+=row(r.self&&isNewR?"Set aside under the new regime":"Above the ceiling",
      cell(-r.cut),{ind:1});
    b+=row("Arrears or unrealised rent received in the year",inp("hp.props."+i+".arrears",{n:1}),{ref:"1g"});
    if(r.arrears)b+=row("Taxable after thirty per cent",cell(r.arrears),{ind:1});
    b+=row("Income from house property "+(i+1),cell(r.income),{cls:"grand",ref:"1h"});
    h+=blk("p"+i,"Property "+(i+1)+(st0(p.addr1)?" — "+st0(p.addr1):""),status,b,"hp.props."+i);
  });

  if((S.hp.props||[]).length<2)
    h+='<button class="add" data-add="hp.props">Add a property</button>';

  h+=sub("Across all properties");
  h+=row("Net income from house property",cell(H.net),
    {ref:"B",hint:H.net<0?"a loss before the set-off ceiling":""});
  if(H.net<-200000)
    h+=row("Loss set off against other heads",cell(-200000),
      {ind:1,hint:"the set-off of a house-property loss is capped at ₹2,00,000"});
  h+=row("Income chargeable under the head house property",cell(H.total),{cls:"grand",ref:"B2"});
  if(isNewR && H.total<0)
    h+=note("Under the new regime a house-property loss cannot be set off against other income; it is "+
      "dropped when the gross total income is worked out.");
  return h;
}

/* ---- export -------------------------------------------------------- */
function expHP(j){
  const H=S.C.hp||engHP();
  const ID=j.ITR1_IncomeDeductions;
  const props=(S.hp&&S.hp.props)||[];
  if(props.length){
    ID.PropertyDetails=props.slice(0,2).map((p,i)=>{
      const r=p._||_hpProp(p);
      const co=st0(p.co)==="Y"||st0(p.co)==="YES";
      const addr={AddrDetail:(sv(p.addr1)||"NA").slice(0,200),
        CityOrTownOrDistrict:(sv(p.city)||"NA").slice(0,50),
        StateCode:_HP_STATECODES.indexOf(st0(p.state))>=0?st0(p.state):"19",
        CountryCode:"91"};
      if(/^[1-9]\d{5}$/.test(st0(p.pin)))addr.PinCode=parseInt(p.pin,10);
      const owner=_HP_OWNER.some(o=>o[0]===st0(p.owner))?st0(p.owner):"SE";
      const node={
        HPSNo:i+1,
        AddressDetailWithZipCode:addr,
        PropertyOwner:owner,
        PropCoOwnedFlg:co?"YES":"NO",
        AsseseeShareProperty:co?(N(p.share)||100):100,
        ifLetOut:r.type,
        Rentdetails:{
          AnnualLetableValue:n0(r.alv),
          RentNotRealized:n0(r.rentNotReal),
          LocalTaxes:n0(r.taxes),
          TotalUnrealizedAndTax:n0(r.unrealAndTax),
          BalanceALV:n0(r.balanceALV),
          AnnualOfPropOwned:n0(r.annualOwned),
          ThirtyPercentOfBalance:n0(r.std),
          IntOnBorwCap:n0(r.interest),
          TotalDeduct:n0(r.totalDeduct),
          ArrearsUnrealizedRentRcvd:n0(r.arrears),
          IncomeOfHP:sg(r.income)}
      };
      if(owner==="OT" && sv(p.ownerOther))node.PropertyOwnerOther=sv(p.ownerOther).slice(0,100);
      if(co){
        const cos=(p.coowners||[]).filter(c=>sv(c.name));
        if(cos.length)node.CoOwners=cos.map((c,ci)=>{
          const o={CoOwnersSNo:ci+1, NameCoOwner:(sv(c.name)||"NA").slice(0,75),
            PercentShareProperty:N(c.share)};
          if(sv(c.pan))o.PAN_CoOwner=st0(c.pan).toUpperCase().slice(0,10);
          if(/^[0-9]{12}$/.test(st0(c.aadhaar)))o.Aadhaar_CoOwner=st0(c.aadhaar);
          return o;});
      }
      if(r.type!=="S"){
        const tn=(p.tenants||[]).filter(t=>sv(t.name));
        if(tn.length)node.TenantDetails=tn.map((t,ti)=>{
          const o={TenantSNo:ti+1, NameofTenant:(sv(t.name)||"NA").slice(0,75)};
          if(sv(t.pan))o.PANofTenant=st0(t.pan).toUpperCase().slice(0,10);
          if(sv(t.tan))o.PANTANofTenant=st0(t.tan).toUpperCase().slice(0,10);
          return o;});
      }
      /* Section24B loan table. When 24(b) interest is fully disallowed
         (self-occupied under the new regime) the allowed interest r.interest
         is 0 and IntOnBorwCap is emitted as 0 above — so the 24B interest
         leaves must be 0 too, or rule A253 (self-occ 24(b) barred in the new
         regime) fires on TotalInterestUs24B. The old-regime self-occupied
         ceiling is applied in IntOnBorwCap only; the loan table keeps the
         actual interest. */
      const intDisallowed = r.self && _hpIsNew();  /* new regime, self-occupied */
      const loans=(p.loans||[]).filter(l=>sv(l.lender)||N(l.int)||N(l.amt));
      if(loans.length){
        node.Rentdetails.Section24B={
          Section24BDtls:loans.map(l=>{
            const o={LoanTknFrom:_HP_LOAN.some(x=>x[0]===st0(l.type))?st0(l.type):"B",
              BankOrInstnName:(sv(l.lender)||"NA").slice(0,75),
              InterestUs24B:intDisallowed?0:n0(l.int)};
            if(sv(l.acno))o.LoanAccNoOfBankOrInstnRefNo=st0(l.acno).slice(0,30);
            if(ISO(l.dt))o.DateofLoan=ISO(l.dt);
            if(N(l.amt))o.TotalLoanAmt=n0(l.amt);
            if(N(l.os))o.LoanOutstndngAmt=n0(l.os);
            return o;}),
          TotalInterestUs24B:intDisallowed?0:n0(r.rawInt)};
      }
      return node;
    });
  }
  /* head total — signed after the ₹2,00,000 cap; new regime drops a loss */
  const isNewR=_hpIsNew();
  put(ID,"TotalIncomeChargeableUnHP", sg(isNewR?Math.max(0,H.total):H.total));
}

/* ---- import (inverse) ---------------------------------------------- */
function impHP(I){
  const read=[]; const ID=I&&I.ITR1_IncomeDeductions;
  const pd=ID&&ID.PropertyDetails;
  if(Array.isArray(pd)&&pd.length){
    S.hp=S.hp||{};
    S.hp.props=pd.map(d=>{
      const a=(d.AddressDetailWithZipCode)||{};
      const rd=(d.Rentdetails)||{};
      const co=d.PropCoOwnedFlg==="YES";
      const p={
        type:["S","L","D"].indexOf(d.ifLetOut)>=0?d.ifLetOut:"S",
        owner:_HP_OWNER.some(o=>o[0]===d.PropertyOwner)?d.PropertyOwner:"SE",
        ownerOther:d.PropertyOwnerOther||"",
        addr1:a.AddrDetail||"", city:a.CityOrTownOrDistrict||"",
        state:a.StateCode||"", pin:a.PinCode!=null?String(a.PinCode):"",
        co:co?"Y":"N", share:d.AsseseeShareProperty!=null?d.AsseseeShareProperty:100,
        rent:rd.AnnualLetableValue, rentNotReal:rd.RentNotRealized, taxes:rd.LocalTaxes,
        arrears:rd.ArrearsUnrealizedRentRcvd,
        coowners:[], tenants:[], loans:[]};
      const cos=d.CoOwners||[];
      if(Array.isArray(cos))p.coowners=cos.map(c=>({name:c.NameCoOwner||"",pan:c.PAN_CoOwner||"",
        aadhaar:c.Aadhaar_CoOwner||"",share:c.PercentShareProperty}));
      const tn=d.TenantDetails||[];
      if(Array.isArray(tn))p.tenants=tn.map(t=>({name:t.NameofTenant||"",pan:t.PANofTenant||"",
        tan:t.PANTANofTenant||""}));
      const s24=rd.Section24B&&rd.Section24B.Section24BDtls;
      if(Array.isArray(s24))p.loans=s24.map(l=>({type:l.LoanTknFrom||"B",lender:l.BankOrInstnName||"",
        acno:l.LoanAccNoOfBankOrInstnRefNo||"",dt:dmy(l.DateofLoan)||"",amt:l.TotalLoanAmt,
        os:l.LoanOutstndngAmt,int:l.InterestUs24B}));
      /* self-occupied interest with no loan row -> keep as single field */
      if(!p.loans.length && rd.IntOnBorwCap!=null)p.interest=rd.IntOnBorwCap;
      return p;});
    read.push("house property");
  }
  return read;
}

/* ---- checks (section-local sanity, not the CBDT rule engine) ------- */
function chkHP(){
  const out=[]; const H=engHP();
  if((H.count||0)>2)
    out.push({lvl:"err",t:"House property",m:"ITR-1 allows at most two house properties.",sec:"hp"});
  (S.hp.props||[]).forEach((p,i)=>{
    const r=p._||_hpProp(p);
    const has=st0(p.addr1)||N(p.rent)||(p.loans||[]).some(l=>N(l.int))||N(p.interest);
    if(!has)return;
    if(!st0(p.addr1))
      out.push({lvl:"err",t:"Property "+(i+1),m:"The address of the property is required.",sec:"hp"});
    if(st0(p.co)==="Y" || st0(p.co)==="YES"){
      const sum=(p.coowners||[]).reduce((a,c)=>a+N(c.share),0)+(N(p.share)||0);
      if((p.coowners||[]).length && Math.abs(sum-100)>0.5)
        out.push({lvl:"warn",t:"Property "+(i+1)+" co-owners",m:"The assessee's share and the co-owners' shares should add up to 100 per cent.",sec:"hp"});
    }
    if(r.self && !H.isNew && r.rawInt>200000)
      out.push({lvl:"warn",t:"Property "+(i+1)+" interest",m:"Interest on a self-occupied house is capped at ₹2,00,000; the excess has been dropped.",sec:"hp"});
    if(r.self && H.isNew && r.rawInt>0)
      out.push({lvl:"warn",t:"Property "+(i+1)+" interest",m:"Interest on a self-occupied house is not deductible under the new regime.",sec:"hp"});
    if(r.type!=="S" && !(p.loans||[]).length && N(p.interest))
      out.push({lvl:"ok",t:"Property "+(i+1),m:"Interest is carried without a loan-table entry; add the loan details for completeness.",sec:"hp"});
  });
  if(H.net<-200000)
    out.push({lvl:"warn",t:"House-property loss",m:"The house-property loss is "+RS(-H.net)+
      "; only ₹2,00,000 can be set off against other heads this year.",sec:"hp"});
  if(!out.length && H.count)
    out.push({lvl:"ok",t:"House property",m:"Income chargeable under house property is "+
      (H.total<0?"a loss of "+RS(-H.total):RS(H.total))+".",sec:"hp"});
  return out;
}

/* ---- register (overrides the boot stub) ---------------------------- */
reg({id:"hp", t:"House property", ref:"Schedule HP", f:secHP, s:()=>{
    const H=S.C.hp||{}; if(!H.count)return "";
    return H.total<0?"loss "+RS(-H.total):RS(H.total);},
  eng:engHP, exp:expHP, imp:impHP, chk:chkHP, order:40, corder:40});
