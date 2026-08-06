import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'msedge' });
const TOOLS = ['itr3','itr3-2025-26'];
for (const t of TOOLS) {
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:7777/tax-utilities/${t}.html`, { waitUntil: 'load', timeout: 45000 });
  await p.waitForTimeout(800);
  const res = await p.evaluate(() => {
    const out = {};
    try {
      const cw = (typeof calcWin==='function') ? calcWin() : null;
      const bp = cw && cw.bpData;
      if (bp && bp.relief && bp.relief.rel90) {
        bp.relief.rel90.rows = [
          { country:'USA', income:500000, taxOutside:75000, taxIndia:100000, reliefClaimed:75000, tin:'US123', headOfIncome:'Capital Gains', sectionRelief:'90' },
          { country:'UAE', income:200000, taxOutside:0, taxIndia:40000, reliefClaimed:0, tin:'AE99', headOfIncome:'Other Sources', sectionRelief:'91' }
        ];
        bp.relief.rel90.refundAmount = 5000; bp.relief.rel90.refundAY = '2024-25';
        out.seededFSI = true;
      }
      if (bp && bp.deductions) {
        const d = bp.deductions;
        d.s80d = { lumpsum:false,
          sel_ot:{co:'HDFC Ergo',pol:'POL111',prem:'22000',yrs:'',med:'',chk:'4000'},
          sel_sc:{co:'',pol:'',prem:'',yrs:'',med:'',chk:''},
          par_ot:{co:'',pol:'',prem:'',yrs:'',med:'',chk:''},
          par_sc:{co:'Star Health',pol:'POL222',prem:'48000',yrs:'',med:'6000',chk:'5000'} };
        d.s80dd = { name:'Ravi', relation:'Son', severe:true, type:'Autism', udid:'UDID123' };
        d.s80e = { loans:[{bank:'SBI',acctNo:'EDU1',student:'Self',sanctionDate:'01/07/2019',firstRepayAY:'2022-23',interest:'55000'}] };
        d.s80c = { rows:[{category:'LIC',accNo:'LIC999',amount:'120000',date:'01/03/2026'},{category:'PPF',accNo:'PPF111',amount:'30000',date:''}] };
        d.s80other = d.s80other || {};
        Object.assign(d.s80other, { u_severe:false, u_type:'Low vision', u_udid:'UDIDU9',
          ee:[{from:'Bank',bank:'SBI',acctNo:'AC1',sanctionDate:'01/05/2016',totalLoan:'3000000',closingBal:'2500000',interest:'45000'}],
          eea:[{from:'NBFC',bank:'LIC HFL',acctNo:'AC2',sanctionDate:'01/06/2020',totalLoan:'4000000',closingBal:'3500000',interest:'120000',stampDuty:'4400000'}],
          eeb:[{from:'Bank',bank:'ICICI',acctNo:'AC3',sanctionDate:'01/07/2021',totalLoan:'800000',closingBal:'600000',interest:'40000',vehicleRegNo:'KA01AB1234'}] });
        out.seededDed = true;
      }
    } catch(e){ out.seedErr = e.message; }
    let j; try { j = window.buildItr3Json(); } catch(e){ return { ...out, buildErr:e.message }; }
    const r3 = (j&&j.ITR&&j.ITR.ITR3)||{};
    const has = k => !!r3[k];
    return { ...out, ok:!!r3.Form_ITR3||Object.keys(r3).length>0,
      FSI:has('ScheduleFSI'), TR1:has('ScheduleTR1'),
      s80D:has('Schedule80D'), s80DD:has('Schedule80DD'), s80U:has('Schedule80U'),
      s80EE:has('Schedule80EE'), s80EEA:has('Schedule80EEA'), s80EEB:has('Schedule80EEB'),
      s80E:has('Schedule80E'), s80C:has('Schedule80C'),
      e80tot: r3.Schedule80E?.TotalInterest80E, c80tot: r3.Schedule80C?.TotalAmt, c80rows: r3.Schedule80C?.Schedule80CDtls?.length,
      d80elig: r3.Schedule80D?.Sec80DSelfFamSrCtznHealth?.EligibleAmountOfDedn,
      d80srflag: r3.Schedule80D?.Sec80DSelfFamSrCtznHealth?.SeniorCitizenFlag,
      d80dd_ded: r3.Schedule80DD?.DeductionAmount, d80dd_dep: r3.Schedule80DD?.DependentType,
      eeaStamp: r3.Schedule80EEA?.PropStmpDtyVal, eebVeh: r3.Schedule80EEB?.Schedule80EEBDtls?.[0]?.VehicleRegNo,
      fsiCnt: r3.ScheduleFSI?.ScheduleFSIDtls?.length, trCnt: r3.ScheduleTR1?.ScheduleTR?.length };
  });
  console.log('==', t, 'pageErrors=' + errs.length, '==');
  console.log(JSON.stringify(res, null, 1));
  if (errs.length) console.log('  ERRS:', errs.slice(0,3).join(' | '));
  await p.close();
}
await b.close();
