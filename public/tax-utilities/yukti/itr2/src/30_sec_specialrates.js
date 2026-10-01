/* ==================================================================
   SCHEDULE SI — the special-rate table with the exemption walk (book 02)
   ================================================================== */
const SI_RATE={"1":0,"1A":20,"21":12.5,"22":12.5,"21ciii":12.5,"2A":12.5,"5A1ai":20,"5A1aA":10,"5A1aii":20,"5A1aiia":5,"5A1aiiaa":5,"5A1aiiaaP":4,"5A1aiiaa2P":9,"5A1aiiab":5,"5A1aiiac":5,"5A1aiii":20,"5A1bA":20,"5AC1ab":10,"5AC1abD":10,"5AC1c":10,"5ACA1a":10,"5ACA1b":10,"5AD1i":20,"5AD1iDiv":20,"5AD1iP":5,"5ADii":30,"5AD1biip":20,"5ADiii":12.5,"5ADiiiP":12.5,"5BB":30,"5BBJ":30,"5BBA":20,"5BBE":60,"5BBF":10,"5BBG":10,"5BBH":30,"5Ea":20,"5Eb":10,"DTAASTCG":0,"DTAALTCG":0,"DTAAOS":0,"PTI_STCG20P":20,"PTI_STCG30P":30,"PTI_LTCG12_5P112A":12.5,"PTI_LTCG12_5P":12.5};
/* the order the utility applies a resident's unexhausted exemption (book 02 §the rule) */
const SI_EXEMPT_ORDER=["21","22","1A","PTI_STCG20P","2A","PTI_LTCG12_5P112A","PTI_LTCG12_5P"];
function exemptionLimit(){
  if(isNew())return 400000;
  if(S.pi.status==="I"&&S.pi.res!=="NRI"){if(superSr())return 500000;if(senior())return 300000;}
  return 250000;
}
function engSI(){
  const cg=S.C.cg,os=S.C.os,rows=[],add=(code,amt,rateOv)=>{amt=R(amt);if(!amt)return;
    const r=rows.find(x=>x.code===code);if(r){r.inc+=amt;return;}rows.push({code,inc:amt,rate:rateOv!==undefined?rateOv:(SI_RATE[code]||0)});};
  if(!S.os2||!S.os2.on){}else{
    if(os.sp.pf111inc){const rt=os.sp.pf111tax/os.sp.pf111inc*100;const snap=[1,4,5,9,10,12.5,15,20,25,30,50,60].reduce((a,b)=>Math.abs(b-rt)<Math.abs(a-rt)?b:a,10);add("1",os.sp.pf111inc,snap);}
    add("5BB",os.sp.lottery);add("5BBJ",os.sp.online);add("5BBE",os.sp.bbeTot);
    (S.os2.spl||[]).forEach(r=>add(r.code,N(r.amt)));(S.os2.pti||[]).forEach(r=>add("PTI_"+r.code,N(r.amt),SI_RATE[r.code]||0));
    (S.os2.dtaa||[]).forEach(r=>{const t=/^nil$/i.test(st0(r.treaty))?0:N(r.treaty);if(t>0)add("DTAAOS",N(r.amt),Math.min(t,N(r.itrate)));});}
  if(cg.on){const A=cg.A,B=cg.B,C8=S.cg.a8||{},C11=S.cg.b11||{};
    const bb=code=>(S.cg.aA||[]).filter(x=>(x.rate||"STL20")===code).reduce((a,x)=>a+N(x.amt),0);
    /* short-term at 20 % — A2e (+A3a) less the buy-back loss at 20 %; the pass-through part on its own row */
    add("1A",A.a3i.gain+(cg.nri?0:A.a3ii.gain)+A.a4.stt-bb("STL20"));if(cg.nri)add("5AD1biip",A.a3ii.gain);add("PTI_STCG20P",N(C8.r20));
    add("5ADii",A.a5.gain-bb("STL30"));add("PTI_STCG30P",N(C8.r30));
    /* long-term at 12.5 % — 112A on its own row, the FII proviso on its own, pass-through on its own, everything else on 21 */
    add("2A",Math.max(0,B.b4.gain));if(cg.nri)add("5ADiiiP",Math.max(0,B.b7.gain));
    add("21",B.b1+B.b3i.gain+B.b3ii.gain+B.b3iii.gain+B.b5.gain+B.b6i.gain+B.b6ii.gain+B.b6iii.gain+B.b6iv.gain+(cg.nri?0:B.b7.gain)+B.b8.gain+B.b9.gain+B.b10.gain-B.bA.loss);
    add("PTI_LTCG12_5P112A",N(C11.r125a));add("PTI_LTCG12_5P",N(C11.r125o));
    add("5BBH",cg.C2);
    /* scale every slot to the income after brought-forward losses — 3(iii) to 3(viii) of BFLA */
    const LB=(S.C.loss&&S.C.loss.afterB)||{};
    const SLOT={st20:["1A","5AD1biip","PTI_STCG20P"],st30:["5ADii","PTI_STCG30P"],lt125:["2A","5ADiiiP","21","PTI_LTCG12_5P112A","PTI_LTCG12_5P"]};
    Object.keys(SLOT).forEach(sl=>{const rs=rows.filter(r=>SLOT[sl].indexOf(r.code)>=0);
      /* a loss on one head nets against the gains on the others within the slot — SI carries no negative row */
      let neg=rs.filter(r=>r.inc<0).reduce((a,r)=>a+r.inc,0);rs.forEach(r=>{if(r.inc<0)r.inc=0;});
      const pos=rs.filter(r=>r.inc>0);const psum=pos.reduce((a,r)=>a+r.inc,0);
      if(neg<0&&psum>0){const f=Math.max(0,psum+neg)/psum;pos.forEach(r=>r.inc=R(r.inc*f));}
      const sum=rs.reduce((a,r)=>a+r.inc,0);const target=Math.max(0,LB[sl]||0);
      if(sum>0&&Math.abs(sum-target)>0){const f=target/sum;let acc=0;const live=rs.filter(r=>r.inc>0);live.forEach((r,i)=>{r.inc=i<live.length-1?R(r.inc*f):R(target-acc);acc+=r.inc;});}
      for(let i=rows.length-1;i>=0;i--)if(SLOT[sl].indexOf(rows[i].code)>=0&&rows[i].inc<=0)rows.splice(i,1);});
    if(LB.stDTAA>0)add("DTAASTCG",LB.stDTAA,10);if(LB.ltDTAA>0)add("DTAALTCG",LB.ltDTAA,10);}
  /* the 1,25,000 under 112A — own, then PTI, then 115AD proviso */
  let ex=125000;const share=code=>{const r=rows.find(x=>x.code===code);if(!r)return 0;const t=Math.min(ex,r.inc);r.exempt=(r.exempt||0)+t;ex-=t;return t;};
  share("2A");share("PTI_LTCG12_5P112A");share("5ADiiiP");
  /* the basic-exemption walk — a resident individual/HUF whose normal income falls short */
  let short=0;
  if(S.pi.res!=="NRI"){const normal=Math.max(0,S.C.ti-rows.reduce((a,r)=>a+r.inc,0));short=Math.max(0,exemptionLimit()-normal);}
  SI_EXEMPT_ORDER.forEach(code=>{if(short<=0)return;const r=rows.find(x=>x.code===code);if(!r)return;
    const base=r.inc-(r.exempt||0);const t=Math.min(short,Math.max(0,base));r.exempt=(r.exempt||0)+t;short-=t;});
  for(let i=rows.length-1;i>=0;i--)if(!(rows[i].rate>0))rows.splice(i,1);
  rows.forEach(r=>{r.taxable=Math.max(0,r.inc-(r.exempt||0));r.tax=R(r.taxable*r.rate/100);r.label=(SICODE.find(x=>x[0]===r.code)||[r.code,r.code])[1];});
  const totInc=R(rows.reduce((a,r)=>a+r.inc,0)),totTax=R(rows.reduce((a,r)=>a+r.tax,0));
  const bbeTax=R((rows.find(x=>x.code==="5BBE")||{tax:0}).tax);
  const cgDivTax=R(rows.filter(x=>["1A","21","22","21ciii","2A","5AC1c","5ACA1b","5ADii","5AD1biip","5ADiii","5ADiiiP","5Eb","DTAASTCG","DTAALTCG","PTI_STCG20P","PTI_STCG30P","PTI_LTCG12_5P112A","PTI_LTCG12_5P","5A1ai","5A1aA","5AC1abD","5ACA1a","5AD1iDiv"].indexOf(x.code)>=0).reduce((a,r)=>a+r.tax,0));
  const tax112A=R((rows.find(x=>x.code==="2A")||{tax:0}).tax),tax115AD=R((rows.find(x=>x.code==="5ADiiiP")||{tax:0}).tax);
  return {rows,totInc,totTax,bbeTax,cgDivTax,tax112A,tax115AD};
}
/* ---------------- 11 · SPI and SI — book 02 --------------------------- */
function secSI(){
  const SI=S.C.si;let h="";
  h+='<div class="cgband">Schedule SPI — Income of specified persons (spouse, minor child etc.) includable in the income of the assessee, section 64</div>';
  h+=note("A disclosure. The amount is entered in the head named in the last column — Schedule S, HP, CG, OS or EI — and this schedule says who it came from.");
  h+=grid("spi",[{k:"name",h:"Name of person",t:"txt",w:"auto",req:1},{k:"pan",h:"PAN (optional)",t:"txt",w:"120px",max:10},{k:"aadhaar",h:"Aadhaar (optional)",t:"txt",w:"130px",max:12},
    {k:"rel",h:"Relationship",t:"txt",w:"150px",req:1},{k:"amt",h:"Amount",t:"num",w:"130px",req:1},
    {k:"head",h:"Head of income in which included",t:"sel",w:"170px",req:1,opts:[["SA","Salary"],["HP","House property"],["CG","Capital gains"],["OS","Other sources"],["EI","Exempt income"]]}],
    S.spi||[],{min:"1000px",empty:"No specified person.",add:"Add a person"});
  h+='<div class="cgband">Schedule SI — Income chargeable to tax at special rates</div>';
  h+=note("Computed from the schedules. For a resident whose normal-rate income falls short of the basic exemption, the shortfall is set against capital gains — highest rate first — before the special rate applies. The ₹1,25,000 under 112A goes first to your own gain, then to pass-through, then to the FII proviso.");
  if(!SI.rows.length)return h+note("No income at a special rate yet.");
  h+='<div class="full"><table class="gt" style="min-width:1000px"><thead><tr><th class="l" style="width:34px">Sl.</th><th class="l" style="width:90px">Section</th><th class="l">Nature</th><th style="width:70px">Rate %</th><th style="width:130px">Income (i)</th><th style="width:150px">After adjusting for the minimum chargeable</th><th style="width:130px">Tax thereon (ii)</th></tr></thead><tbody>';
  SI.rows.forEach((r,i)=>{h+='<tr><td class="l">'+(i+1)+'</td><td class="l">'+esc(r.code)+'</td><td class="l" style="font-size:12px">'+esc(r.label.slice(0,95))+'</td><td class="num">'+r.rate+'</td><td class="num">'+cell(r.inc)+'</td><td class="num">'+cell(r.taxable)+(r.exempt?'<span class="dt">less '+F(r.exempt)+'</span>':'')+'</td><td class="num">'+cell(r.tax)+'</td></tr>';});
  h+='</tbody><tfoot><tr><td class="l" colspan="4">Total</td><td>'+F(SI.totInc)+'</td><td></td><td>'+F(SI.totTax)+'</td></tr></tfoot></table></div>';
  return h;
}
