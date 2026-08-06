import { chromium } from 'playwright';
const EDGE='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const URL='http://localhost:7777/tax-utilities/itr4-2025-26.html';
const b=await chromium.launch({executablePath:EDGE, headless:true});
const p=await b.newPage();
const perrs=[];
p.on('pageerror',e=>perrs.push('PAGEERROR: '+e.message));
await p.goto(URL,{waitUntil:'networkidle'});
async function openAddClose(sf,addBtn){
  await p.click(`[data-sf="${sf}"]`);
  await p.click('#'+addBtn);
  await p.click(`#${sf} [data-close]`);
}
await openAddClose('sf-via-hub','addrep_d80cBtn');
await openAddClose('sf-hp','addrep_hp24bBtn');
await openAddClose('sf-taxpaid','addrep_itBtn');
const uiCheck=await p.evaluate(()=>({d80c:data.rep.d80c.length,hp24b:data.rep.hp24b.length,it:data.rep.it.length}));
const res=await p.evaluate(()=>{
  data.rep.d80c=[{Amount:'150000',IdentificationNo:'LIC1'}];
  data.rep.d80dself=[{InsurerName:'Star',PolicyNo:'P1',HealthInsAmt:'20000'}]; data.d80dflags.self='N';
  data.rep.d80e=[{LoanTknFrom:'B',BankOrInstnName:'SBI',LoanAccNoOfBankOrInstnRefNo:'A1',DateofLoan:'01/04/2022',TotalLoanAmt:'500000',LoanOutstndngAmt:'300000',Interest:'25000'}];
  data.rep.g100=[{DoneeWithPanName:'PM CARES',DoneePAN:'AAAAA0000A',AddrDetail:'Delhi',CityOrTownOrDistrict:'Delhi',StateCode:'09',PinCode:'110001',DonationAmtCash:'0',DonationAmtOtherMode:'10000'}];
  data.rep.d80ggc=[{DonationDate:'01/05/2024',DonationAmtCash:'0',DonationAmtOtherMode:'15000',PartyName:'Party A',PartyPAN:'CCCCC2222C'}];
  data.d80dd={nature:'1',type:'1',amount:'75000',deptype:'2'}; data.d80u={nature:'2',type:'2',amount:'125000'};
  data.hp={addr:'12 MG Rd',city:'Bengaluru',alv:'360000',rentnotreal:'0',localtax:'12000',arrears:'0'};
  data.rep.hp24b=[{LoanTknFrom:'B',BankOrInstnName:'HDFC',LoanAccNoOfBankOrInstnRefNo:'H1',DateofLoan:'01/06/2019',TotalLoanAmt:'2000000',LoanOutstndngAmt:'1500000',InterestUs24B:'180000'}];
  data.rep.it=[{BSRCode:'1234567',DateDep:'15/03/2025',SrlNoOfChaln:'55',Amt:'40000'}];
  data.rep.tcs=[{TAN:'BLRT01234A',CollectorName:'Dealer',Amtfrom26AS:'5000',TotalTCS:'5000',AmtTCSClaimedThisYear:'5000'}];
  data.rep.tds3=[{PANofTenant:'GGGGG6666G',TDSSection:'194IB',TDSClaimed:'12000',TDSCreditCarriedFwd:'0'}];
  const t=buildItr4Json().ITR.ITR4;
  return {AY:t.Form_ITR4.AssessmentYear,C:t.Schedule80C&&t.Schedule80C.TotalAmt,D:t.Schedule80D&&t.Schedule80D.Sec80DSelfFamSrCtznHealth.EligibleAmountOfDedn,DD:!!t.Schedule80DD,U:!!t.Schedule80U,E:t.Schedule80E&&t.Schedule80E.TotalInterest80E,G:t.Schedule80G&&t.Schedule80G.TotalEligibleDonationsUs80G,GGC:t.Schedule80GGC&&t.Schedule80GGC.TotalDonationsUs80GGC,Us24B:t.ScheduleUs24B&&t.ScheduleUs24B.TotalInterestUs24B,AnnualValue:t.IncomeDeductions.AnnualValue,HP30:t.IncomeDeductions.AnnualValue30Percent,PropAbsent:t.IncomeDeductions.PropertyDetails===undefined,IT:t.ScheduleIT&&t.ScheduleIT.TotalTaxPayments,TCS:t.ScheduleTCS&&t.ScheduleTCS.TotalSchTCS,TDS3sec:t.ScheduleTDS3Dtls&&t.ScheduleTDS3Dtls.TDS3Details[0].TDSSection,BP:!!t.ScheduleBP};
});
console.log('PAGEERRORS:',perrs.length); perrs.forEach(e=>console.log(e));
console.log('UI_add_clicks:',JSON.stringify(uiCheck));
console.log(JSON.stringify(res,null,1));
await b.close();
