/* ---- EI (book 05) ---- */
function engEI(){
  const E=S.ei2||{};const gross=N(E.agriGross),exp=N(E.agriExp),unab=N(E.agriUnab);
  const netAgri=Math.max(0,R(gross-exp-unab));
  const others=R((E.others||[]).reduce((a,r)=>a+N(r.amt),0));
  const dtaa=R((E.dtaa||[]).reduce((a,r)=>a+N(r.amt),0));
  const pti=S.C.ptiExempt||0;
  return {interest:R(N(E.interest)),netAgri,landReq:netAgri>500000,others,dtaa,pti:R(pti),total:R(N(E.interest)+netAgri+others+dtaa+pti)};
}
/* ---------------- 10 · Exempt income — book 05 ------------------------ */
function secEI(){
  const E=S.C.ei2,X=S.ei2||{};let h="";
  h+=note("Income not to be included in total income or not chargeable to tax. Nothing here is taxed — but net agricultural income counts for the rate, and the pass-through line reconciles to Schedule PTI.");
  h+=row("1 · Interest income",inp("ei2.interest",{n:1}),{ref:"1"});
  h+='<div class="cgband">2 · Agricultural income</div>';
  h+=row("i · Gross agricultural receipts — other than income to be excluded under rule 7A, 7B or 8",inp("ei2.agriGross",{n:1}),{ref:"2i"});
  h+=row("ii · Expenditure incurred on agriculture",inp("ei2.agriExp",{n:1}),{ref:"2ii"});
  h+=row("iii · Unabsorbed agricultural loss of the previous eight assessment years",inp("ei2.agriUnab",{n:1}),{ref:"2iii"});
  h+=row("iv · Net agricultural income for the year (i − ii − iii) — nil if loss",cell(E.netAgri),{ref:"2iv",cls:"tot",hint:E.netAgri>5000?"counts for the rate in Part B-TI line 14":""});
  if(E.landReq){h+=note("Net agricultural income exceeds ₹5 lakh — the land particulars are required.","warn");
    h+=grid("ei2.land",[{k:"district",h:"Name of district",t:"txt",w:"auto",req:1},{k:"pin",h:"PIN code",t:"txt",w:"90px",max:6,req:1},
      {k:"acres",h:"Measurement in acres",t:"num",w:"130px",req:1},{k:"owned",h:"Owned or leased",t:"sel",w:"130px",req:1,opts:[["O","Owned"],["H","Held on lease"]]},
      {k:"irr",h:"Irrigated or rain-fed",t:"sel",w:"130px",req:1,opts:[["IRG","Irrigated"],["RF","Rain-fed"]]}],X.land||[],{min:"760px",empty:"No parcel listed.",add:"Add a parcel"});}
  h+='<div class="cgband">3 · Other exempt income, including exempt income of a minor child</div>';
  const subsFor=cat=>EISUB.filter(x=>({AGRI:/^10\(30\)|^10\(31\)|^10\(37\)$/,GOVC:/10\(10BB\)|10\(10BC\)|10\(17A\)|10\(12AB\)/,ISI:/10\(15\)|10\(23FBB\)|10\(23FD\)|10\(35|10\(23FBC\)|10\(33\)|10\(4B\)|10\(4C\)|10\(4E\)|10\(36\)|10\(37A\)/,
    SSRA:/10\(12C\)|10\(18\)|10\(19\)|DMD/,SRSC:/10\(32\)|10\(43\)/,SRST:/10\(19A\)|10\(26|10\(26AAA\)/,SRPC:/10\(10D\)|10\(11\)|10\(12\)|10\(11A\)|10\(12A\)|10\(12B\)|10\(13\)/,OTH:/./,OTHN:/10\(4\)|10\(15\)\(iv\)|10\(4D\)|10\(6/}[cat]||/./).test(x[0]));
  h+='<div class="full"><table class="gt" style="min-width:1000px"><thead><tr><th class="l" style="width:220px">Category</th><th class="l" style="width:300px">Sub-category</th><th class="l">Description</th><th style="width:140px">Amount</th><th class="x"></th></tr></thead><tbody>';
  if(!(X.others||[]).length)h+='<tr><td class="emp" colspan="5">No other exempt income.</td></tr>';
  (X.others||[]).forEach((r,i)=>{const p="ei2.others."+i+".";
    h+='<tr><td class="l">'+sel(p+"cat",EICAT,{style:"width:100%"})+'</td><td class="l">'+sel(p+"sub",subsFor(r.cat||"OTH").map(x=>[x[0],x[1].slice(0,60)]),{style:"width:100%"})+'</td>'+
       '<td>'+inp(p+"desc",{max:125})+'</td><td>'+inp(p+"amt",{n:1})+'</td><td class="x"><button data-del="ei2.others.'+i+'">'+TRASH+'</button></td></tr>';});
  h+='</tbody><tfoot><tr><td class="l" colspan="3">Total other exempt income</td><td>'+F(E.others)+'</td><td></td></tr></tfoot></table></div><button class="add" data-add="ei2.others">Add a row</button>';
  if(S.pi.res!=="RES"){h+='<div class="cgband">4 · Income claimed as not chargeable to tax under a DTAA — non-residents</div>';
    h+=grid("ei2.dtaa",[{k:"amt",h:"Amount of income",t:"num",w:"120px",req:1},{k:"nature",h:"Nature of income",t:"txt",w:"auto",req:1},
      {k:"country",h:"Country name",t:"txt",w:"140px",req:1},{k:"code",h:"Country code",t:"sel",w:"130px",req:1,opts:CC_ALL.filter(c=>c[0]!=="91")},
      {k:"article",h:"Article of DTAA",t:"txt",w:"100px",max:16,req:1},{k:"head",h:"Head of income",t:"sel",w:"110px",req:1,opts:[["SA","Salary"],["HP","House property"],["CG","Capital gains"],["OS","Other sources"]]},
      {k:"trc",h:"TRC obtained?",t:"sel",w:"90px",req:1,opts:[["Y","Yes"],["N","No"]]}],X.dtaa||[],{min:"1150px",empty:"No DTAA claim.",add:"Add a claim",
      foot:[{l:1,v:"Total income from DTAA claimed as not chargeable",span:6},{v:E.dtaa}]});}
  h+=row("5 · Pass-through income claimed as not chargeable to tax — from Schedule PTI",cell(E.pti),{ref:"5"});
  h+=row("6 · Total (1 + 2 + 3 + 4 + 5)",cell(E.total),{ref:"6",cls:"grand"});
  return h;
}
