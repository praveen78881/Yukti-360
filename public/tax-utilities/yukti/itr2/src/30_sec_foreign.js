/* ---- FSI and TR (book 06) ---- */
function engFSI(){
  const T=S.C.tax,ti=S.C.ti||1;const avg=T?T.gross/Math.max(1,ti):0;
  const blocks=(S.fsi2||[]).map(b=>{const heads={};let tot={inc:0,paid:0,payable:0,relief:0};
    ["sal","hp","cg","os"].forEach(h=>{const r=(b.h||{})[h]||{};const inc=N(r.inc),paid=N(r.paid);
      const payable=R(inc*avg);const relief=Math.min(paid,payable);heads[h]={inc:R(inc),paid:R(paid),payable,relief:R(relief),article:st0(r.article)};
      tot.inc+=inc;tot.paid+=paid;tot.payable+=payable;tot.relief+=relief;});
    Object.keys(tot).forEach(k=>tot[k]=R(tot[k]));b._={heads,tot};return b;});
  const tr=blocks.map(b=>({code:b.code,name:b.name,tin:b.tin,paid:b._.tot.paid,relief:b._.tot.relief,sec:b.sec||"90"}));
  const dtaaRel=R(tr.filter(r=>r.sec!=="91").reduce((a,r)=>a+r.relief,0)),noDtaaRel=R(tr.filter(r=>r.sec==="91").reduce((a,r)=>a+r.relief,0));
  return {blocks,tr,paidTot:R(tr.reduce((a,r)=>a+r.paid,0)),reliefTot:R(dtaaRel+noDtaaRel),dtaaRel,noDtaaRel,avg};
}
/* ---------------- 12 · Foreign — FSI · TR · FA — book 06 --------------- */
function secFA(){
  const FS=S.C.fsi;let h="";
  if(S.pi.res==="NRI")h+=note("Schedules FSI and TR are for a resident. Schedule FA is not applicable to a non-resident.","warn");
  h+='<div class="cgband">Schedule FSI — Details of income from outside India and tax relief (resident only)</div>';
  h+=note("One block per country. Column (b) is income already in the return under that head; (d) is the Indian tax on it at the average rate; (e), the relief, is the lower of (c) and (d).");
  (S.fsi2||[]).forEach((b,i)=>{const p="fsi2."+i+".",r=b._||{heads:{},tot:{}};
    let x=row("Country code",sel(p+"code",CC_ALL.filter(c=>c[0]!=="91"),{}),{req:1})+row("Country name",inp(p+"name"),{req:1})+row("Taxpayer identification number",inp(p+"tin"),{req:1});
    x+='<div class="full"><table class="gt" style="min-width:1000px"><thead><tr><th class="l" style="width:34px">Sl.</th><th class="l" style="width:140px">Head (a)</th><th style="width:150px">Income from outside India (b)</th><th style="width:140px">Tax paid outside India (c)</th><th style="width:150px">Tax payable in India (d)</th><th style="width:130px">Relief (e) = lower of c, d</th><th class="l" style="width:130px">DTAA article (f)</th></tr></thead><tbody>';
    [["sal","i","Salary"],["hp","ii","House property"],["cg","iii","Capital gains"],["os","iv","Other sources"]].forEach(([k,sl,l])=>{const hh=r.heads[k]||{};
      x+='<tr><td class="l">'+sl+'</td><td class="l">'+l+'</td><td>'+inp(p+"h."+k+".inc",{n:1})+'</td><td>'+inp(p+"h."+k+".paid",{n:1})+'</td><td class="num">'+cell(hh.payable||0)+'</td><td class="num">'+cell(hh.relief||0)+'</td><td>'+inp(p+"h."+k+".article",{max:16})+'</td></tr>';});
    x+='</tbody><tfoot><tr><td class="l" colspan="2">Total</td><td>'+F(r.tot.inc||0)+'</td><td>'+F(r.tot.paid||0)+'</td><td>'+F(r.tot.payable||0)+'</td><td>'+F(r.tot.relief||0)+'</td><td></td></tr></tfoot></table></div>';
    x+=row("Relief claimed under section",sel(p+"sec",[["90","90"],["90A","90A"],["91","91"]],{blank:false}),{req:1,hint:"90 / 90A with a treaty, 91 without"});
    h+=blk("fsi"+i,"Country "+(i+1)+(st0(b.name)?" — "+st0(b.name):""),(r.tot.relief?"relief "+RS(r.tot.relief):"not filled"),x,"fsi2."+i);});
  h+='<button class="add" data-addfsi="1">Add a country</button>';
  h+='<div class="cgband">Schedule TR — Summary of tax relief claimed for taxes paid outside India</div>';
  h+='<div class="full"><table class="gt" style="min-width:900px"><thead><tr><th class="l">Country code (a)</th><th class="l">TIN (b)</th><th style="width:170px">Total taxes paid outside India (c)</th><th style="width:170px">Total tax relief available (d)</th><th class="l" style="width:120px">Under section (e)</th></tr></thead><tbody>';
  if(!FS.tr.length)h+='<tr><td class="emp" colspan="5">Generated from Schedule FSI.</td></tr>';
  FS.tr.forEach(r=>{h+='<tr><td class="l">'+esc(r.code||"")+' '+esc(r.name||"")+'</td><td class="l">'+esc(r.tin||"")+'</td><td class="num">'+cell(r.paid)+'</td><td class="num">'+cell(r.relief)+'</td><td class="l">'+esc(r.sec)+'</td></tr>';});
  h+='</tbody><tfoot><tr><td class="l" colspan="2">Total</td><td>'+F(FS.paidTot)+'</td><td>'+F(FS.reliefTot)+'</td><td></td></tr></tfoot></table></div>';
  h+=row("Total tax relief available where a DTAA applies — sections 90 and 90A → 11b of Part B-TTI",cell(FS.dtaaRel),{cls:"tot"});
  h+=row("Total tax relief available where no DTAA applies — section 91 → 11c of Part B-TTI",cell(FS.noDtaaRel),{cls:"tot"});
  h+=row("Whether any tax paid outside India, on which relief was allowed in India, has been refunded or credited during the year?",sel("tr2.refundFlag",[["NO","No"],["YES","Yes"]],{blank:false}));
  if((S.tr2||{}).refundFlag==="YES"){h+=row("a · Amount of tax refunded",inp("tr2.refundAmt",{n:1}),{ind:1});h+=row("b · Assessment year in which relief was allowed in India",inp("tr2.refundAY",{ph:"2024-25"}),{ind:1});}
  /* ---- FA ---- */
  h+='<div class="cgband">Schedule FA — Details of foreign assets and income from any source outside India</div>';
  if(S.pi.res!=="RES")h+=note("Not applicable — Schedule FA is for a resident and ordinarily resident.","warn");
  else{h+=note("Held at any time during the <b>calendar year ending 31 December 2025</b>, including any beneficial interest. Values in rupees. Every table asks where in this return the income was offered — FA does not add income; it points to it.");
    const ST=[["OWNER","Owner"],["BENEFICIAL_OWNER","Beneficial owner"],["BENIFICIARY","Beneficiary"]],OW=[["DIRECT","Direct"],["BENEFICIAL_OWNER","Beneficial owner"],["BENIFICIARY","Beneficiary"]];
    const SCH=[["SA","Salary"],["HP","House property"],["CG","Capital gains"],["OS","Other sources"],["EI","Exempt income"],["NI","Not in this return"]];
    const cc={k:"code",h:"Country code",t:"sel",w:"120px",req:1,opts:CC_ALL.filter(c=>c[0]!=="91")},cn={k:"country",h:"Country name",t:"txt",w:"120px",req:1};
    const off=[{k:"offAmt",h:"Income offered — amount",t:"num",w:"110px"},{k:"offSch",h:"Schedule",t:"sel",w:"110px",opts:SCH},{k:"offItem",h:"Item no.",t:"txt",w:"80px",max:50}];
    h+=fold("faA1","A1","Foreign depository accounts",(S.fa2.bank||[]).length+" rows",grid("fa2.bank",[cc,cn,{k:"inst",h:"Financial institution",t:"txt",w:"auto",req:1},{k:"addr",h:"Address",t:"txt",w:"auto",req:1},{k:"zip",h:"ZIP",t:"txt",w:"80px",max:8,req:1},
      {k:"acno",h:"Account number",t:"txt",w:"130px",max:34,req:1},{k:"status",h:"Status",t:"sel",w:"130px",req:1,opts:ST},{k:"opened",h:"Opened on",t:"date",w:"120px",req:1},{k:"peak",h:"Peak balance",t:"num",w:"120px",req:1},{k:"close",h:"Closing balance",t:"num",w:"120px",req:1},{k:"interest",h:"Gross interest",t:"num",w:"110px",req:1}],S.fa2.bank||[],{min:"1700px",empty:"None.",add:"Add an account"}));
    h+=fold("faA2","A2","Foreign custodial accounts",(S.fa2.cust||[]).length+" rows",grid("fa2.cust",[cc,cn,{k:"inst",h:"Financial institution",t:"txt",w:"auto",req:1},{k:"addr",h:"Address",t:"txt",w:"auto",req:1},{k:"zip",h:"ZIP",t:"txt",w:"80px",max:8,req:1},
      {k:"acno",h:"Account number",t:"txt",w:"130px",max:34,req:1},{k:"status",h:"Status",t:"sel",w:"130px",req:1,opts:ST},{k:"opened",h:"Opened on",t:"date",w:"120px",req:1},{k:"peak",h:"Peak balance",t:"num",w:"120px",req:1},{k:"close",h:"Closing balance",t:"num",w:"120px",req:1},
      {k:"gross",h:"Gross amount paid / credited",t:"num",w:"130px",req:1},{k:"nature",h:"Nature",t:"sel",w:"110px",req:1,opts:FA_NAT}],S.fa2.cust||[],{min:"1900px",empty:"None.",add:"Add an account"}));
    h+=fold("faA3","A3","Foreign equity and debt interest",(S.fa2.equity||[]).length+" rows",grid("fa2.equity",[cc,cn,{k:"entity",h:"Name of entity",t:"txt",w:"auto",req:1},{k:"addr",h:"Address",t:"txt",w:"auto",req:1},{k:"zip",h:"ZIP",t:"txt",w:"80px",max:8,req:1},
      {k:"nature",h:"Nature of entity",t:"txt",w:"130px",max:34,req:1},{k:"acq",h:"Date of acquiring",t:"date",w:"120px",req:1},{k:"initial",h:"Initial value",t:"num",w:"110px",req:1},{k:"peak",h:"Peak value",t:"num",w:"110px",req:1},{k:"close",h:"Closing value",t:"num",w:"110px",req:1},{k:"paid",h:"Gross paid / credited",t:"num",w:"120px",req:1},{k:"proceeds",h:"Gross proceeds on sale",t:"num",w:"130px",req:1}],S.fa2.equity||[],{min:"1900px",empty:"None.",add:"Add a holding"}));
    h+=fold("faA4","A4","Foreign cash-value insurance or annuity contract",(S.fa2.insur||[]).length+" rows",grid("fa2.insur",[cc,cn,{k:"inst",h:"Financial institution",t:"txt",w:"auto",req:1},{k:"addr",h:"Address",t:"txt",w:"auto",req:1},{k:"zip",h:"ZIP",t:"txt",w:"80px",max:8,req:1},
      {k:"dt",h:"Date of contract",t:"date",w:"120px",req:1},{k:"cashval",h:"Cash or surrender value",t:"num",w:"140px",req:1},{k:"paid",h:"Gross paid / credited",t:"num",w:"130px",req:1}],S.fa2.insur||[],{min:"1300px",empty:"None.",add:"Add a contract"}));
    h+=fold("faB","B","Financial interest in any entity",(S.fa2.fin||[]).length+" rows",grid("fa2.fin",[cc,cn,{k:"zip",h:"ZIP",t:"txt",w:"80px",max:8,req:1},{k:"nature",h:"Nature of entity",t:"txt",w:"130px"},{k:"entity",h:"Name of entity",t:"txt",w:"auto",req:1},{k:"addr",h:"Address",t:"txt",w:"auto",req:1},
      {k:"interest",h:"Nature of interest",t:"sel",w:"140px",req:1,opts:OW},{k:"since",h:"Date since held",t:"date",w:"120px",req:1},{k:"cost",h:"Total investment at cost",t:"num",w:"130px",req:1},{k:"inc",h:"Income accrued",t:"num",w:"110px",req:1},{k:"incNature",h:"Nature of income",t:"txt",w:"120px",req:1},...off],S.fa2.fin||[],{min:"2000px",empty:"None.",add:"Add an interest"}));
    h+=fold("faC","C","Immovable property",(S.fa2.imm||[]).length+" rows",grid("fa2.imm",[cc,cn,{k:"zip",h:"ZIP",t:"txt",w:"80px",max:8,req:1},{k:"addr",h:"Address of the property",t:"txt",w:"auto"},{k:"own",h:"Ownership",t:"sel",w:"140px",req:1,opts:OW},{k:"acq",h:"Date of acquisition",t:"date",w:"120px",req:1},
      {k:"cost",h:"Total investment at cost",t:"num",w:"130px",req:1},{k:"inc",h:"Income derived",t:"num",w:"110px",req:1},{k:"incNature",h:"Nature of income",t:"txt",w:"120px",req:1},...off],S.fa2.imm||[],{min:"1700px",empty:"None.",add:"Add a property"}));
    h+=fold("faD","D","Any other capital asset",(S.fa2.oth||[]).length+" rows",grid("fa2.oth",[cc,cn,{k:"zip",h:"ZIP",t:"txt",w:"80px",max:8,req:1},{k:"nature",h:"Nature of asset",t:"txt",w:"140px",req:1},{k:"own",h:"Ownership",t:"sel",w:"140px",req:1,opts:OW},{k:"acq",h:"Date of acquisition",t:"date",w:"120px",req:1},
      {k:"cost",h:"Total investment at cost",t:"num",w:"130px",req:1},{k:"inc",h:"Income derived",t:"num",w:"110px",req:1},{k:"incNature",h:"Nature of income",t:"txt",w:"120px",req:1},...off],S.fa2.oth||[],{min:"1700px",empty:"None.",add:"Add an asset"}));
    h+=fold("faE","E","Accounts in which you have signing authority, not in A to D",(S.fa2.sign||[]).length+" rows",grid("fa2.sign",[{k:"inst",h:"Name of institution",t:"txt",w:"auto",req:1},{k:"addr",h:"Address",t:"txt",w:"auto",req:1},cc,cn,{k:"zip",h:"ZIP",t:"txt",w:"80px",max:8,req:1},
      {k:"holder",h:"Name of the account holder",t:"txt",w:"150px",req:1},{k:"acno",h:"Account number",t:"txt",w:"130px",max:34,req:1},{k:"peak",h:"Peak balance / investment",t:"num",w:"130px",req:1},{k:"taxable",h:"Income taxable in your hands?",t:"sel",w:"110px",req:1,opts:[["N","No"],["Y","Yes"]]},{k:"inc",h:"If yes, income accrued",t:"num",w:"120px"},...off],S.fa2.sign||[],{min:"1900px",empty:"None.",add:"Add an account"}));
    h+=fold("faF","F","Trusts created under the laws of a country outside India — trustee, beneficiary or settlor",(S.fa2.trust||[]).length+" rows",grid("fa2.trust",[cc,cn,{k:"zip",h:"ZIP",t:"txt",w:"80px",max:8,req:1},{k:"trust",h:"Name of the trust",t:"txt",w:"auto",req:1},{k:"trustAddr",h:"Address of the trust",t:"txt",w:"auto",req:1},
      {k:"trustees",h:"Name of other trustees",t:"txt",w:"140px",req:1},{k:"trusteesAddr",h:"Address of trustees",t:"txt",w:"140px",req:1},{k:"settlor",h:"Name of settlor",t:"txt",w:"130px",req:1},{k:"settlorAddr",h:"Address of settlor",t:"txt",w:"130px",req:1},{k:"benef",h:"Name of beneficiaries",t:"txt",w:"140px",req:1},{k:"benefAddr",h:"Address of beneficiaries",t:"txt",w:"140px",req:1},
      {k:"since",h:"Date since position held",t:"date",w:"120px",req:1},{k:"taxable",h:"Income taxable in your hands?",t:"sel",w:"110px",req:1,opts:[["N","No"],["Y","Yes"]]},{k:"inc",h:"If yes, income derived",t:"num",w:"120px"},...off],S.fa2.trust||[],{min:"2600px",empty:"None.",add:"Add a trust"}));
    h+=fold("faG","G","Any other income derived from any source outside India, not in A to F",(S.fa2.othInc||[]).length+" rows",grid("fa2.othInc",[cc,cn,{k:"zip",h:"ZIP",t:"txt",w:"80px",max:8,req:1},{k:"from",h:"Name of the person from whom derived",t:"txt",w:"auto",req:1},{k:"fromAddr",h:"Address",t:"txt",w:"auto",req:1},
      {k:"inc",h:"Income derived",t:"num",w:"120px",req:1},{k:"nature",h:"Nature of income",t:"txt",w:"130px",req:1},{k:"taxable",h:"Taxable in your hands?",t:"sel",w:"110px",req:1,opts:[["N","No"],["Y","Yes"]]},...off],S.fa2.othInc||[],{min:"1600px",empty:"None.",add:"Add a row"}));}
  return h;
}
