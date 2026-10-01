/* ==================================================================
   TAXES PAID — TDS 1/2/3, TCS, IT (book 01)
   ================================================================== */
const TDS_HEADS=[["HP","House property"],["CG","Capital gains"],["OS","Other sources"],["EI","Exempt income"],["NA","Not applicable"]];
const TDS_HEAD_OF={"4IA":"CG","4-IA":"HP","4-IB":"HP","4IB":"HP","4IC":"CG","94K":"OS","96D":"OS","193":"OS","194":"OS","94A":"OS","94B":"OS","94BA":"OS","4BB":"OS","4DA":"OS","4EE":"OS","4LB":"OS","4LD":"OS","LBA1":"OS","LBA2":"OS","LBA3":"OS","LBB":"OS","94S":"CG","94N":"OS","94O":"OS","94Q":"OS","94C":"OS","94H":"OS","94J-A":"OS","94J-B":"OS","94M":"OS","195":"OS","94R":"OS","94P":"OS","4LA":"CG"};
function engTaxesPaid(){
  const own=r=>N(r.claimOwn),t1=(S.tds1||[]).reduce((a,r)=>a+N(r.tds),0);
  const t2=(S.tds2||[]).reduce((a,r)=>a+own(r),0),t3=(S.tds3||[]).reduce((a,r)=>a+own(r),0);
  const tcs=(S.tcs||[]).reduce((a,r)=>a+N(r.claimOwn),0);
  const isSAT=c=>{const d=D(c.dt);return d?d>YREND:false;};
  const adv=(S.it||[]).filter(c=>!isSAT(c)).reduce((a,c)=>a+N(c.amt),0);
  const sat=(S.it||[]).filter(c=>isSAT(c)).reduce((a,c)=>a+N(c.amt),0);
  /* row arithmetic for TDS 2/3 and TCS: deducted = claimed + carried */
  const rowChk=(rows,k)=>rows.map(r=>{const avail=N(r.bf)+N(r.dedOwn)+N(r.dedOthTds);const claimed=N(r.claimOwn)+N(r.claimOthTds);
    r._avail=avail;r._claimed=claimed;r._cf=Math.max(0,avail-claimed);r._over=claimed>avail;return r;});
  rowChk(S.tds2||[],"tds2");rowChk(S.tds3||[],"tds3");
  (S.tcs||[]).forEach(r=>{const avail=N(r.bf)+N(r.collOwn)+N(r.collOth);const claimed=N(r.claimOwn)+N(r.claimOth);r._avail=avail;r._claimed=claimed;r._cf=Math.max(0,avail-claimed);r._over=claimed>avail;});
  return {t1:R(t1),t2:R(t2),t3:R(t3),tds:R(t1+t2+t3),tcs:R(tcs),adv:R(adv),sat:R(sat),paid:R(adv+t1+t2+t3+tcs+sat),isSAT};
}
/* ---------------- 9 · Taxes paid — book 01 ---------------------------- */
function secPaid(){
  const P=S.C.paid;let h="";
  h+=formNote("Check every figure against <b>Form 26AS</b> and the annual information statement. Wherever possible the head of income is pre-filled from the section — please verify.");
  h+='<div class="cgband">TDS 1 · 20B — Tax deducted at source from salary, as per Form 16</div>';
  h+=grid("tds1",[{k:"tan",h:"TAN of the employer",t:"txt",w:"130px",max:10,req:1},{k:"name",h:"Name of employer",t:"txt",w:"auto",req:1},
    {k:"inc",h:"Income chargeable under salaries",t:"num",w:"180px",req:1},{k:"tds",h:"Total tax deducted",t:"num",w:"140px",req:1}],
    S.tds1||[],{min:"900px",empty:"No salary TDS.",add:"Add an employer",foot:[{l:1,v:"Total — to 15b of Part B-TTI",span:3},{v:P.t1}]});
  const tdsCols=(buyer)=>[{k:"who",h:"TDS credit relating to",t:"sel",w:"120px",req:1,opts:[["S","Self"],["O","Other person"]]},
    {k:"othPan",h:"PAN of other person",t:"txt",w:"120px",max:10},{k:"othAadh",h:"Aadhaar of other person",t:"txt",w:"130px",max:12},
    buyer?{k:"pan",h:"PAN of the buyer / tenant",t:"txt",w:"130px",max:10,req:1}:{k:"tan",h:"TAN of the deductor",t:"txt",w:"120px",max:10,req:1},
    ...(buyer?[{k:"aadh",h:"Aadhaar of buyer / tenant",t:"txt",w:"130px",max:12}]:[]),
    {k:"sec",h:"Section",t:"sel",w:"110px",req:1,opts:TDSSEC.map(x=>[x[0],x[0]])},
    {k:"bf",h:"Unclaimed TDS b/f",t:"num",w:"110px"},{k:"yr",h:"FY of that b/f deduction",t:"sel",w:"100px",opts:DEDYR.map(y=>[y,y])},
    {k:"dedOwn",h:"Deducted in own hands",t:"num",w:"120px"},{k:"dedOthInc",h:"Deducted in other's hands — income",t:"num",w:"120px"},{k:"dedOthTds",h:"— TDS",t:"num",w:"100px"},
    {k:"claimOwn",h:"Claimed in own hands",t:"num",w:"120px",req:1},{k:"claimOthInc",h:"Claimed in other's hands — income",t:"num",w:"120px"},{k:"claimOthTds",h:"— TDS",t:"num",w:"100px"},
    {k:"claimOthPan",h:"— PAN",t:"txt",w:"110px",max:10},{k:"claimOthAadh",h:"— Aadhaar",t:"txt",w:"120px",max:12},
    {k:"gross",h:"Gross receipt offered",t:"num",w:"120px"},{k:"head",h:"Head of income",t:"sel",w:"120px",opts:buyer?TDS_HEADS.slice(0,4):TDS_HEADS},
    {k:"cf",h:"TDS credit carried forward",t:"calc",w:"120px",f:r=>r._cf||0}];
  h+='<div class="cgband">TDS 2 · 20C(1) — Tax deducted on income other than salary, as per Form 16A / 16D</div>';
  h+=note("Deducted = claimed + carried forward. The credit may be claimed only where the corresponding income is offered this year under the head named. Credit in another person's hands is the spouse under section 5A or any other person under rule 37BA(2).");
  h+=grid("tds2",tdsCols(false),S.tds2||[],{min:"2600px",empty:"No other TDS.",add:"Add a deduction",foot:[{l:1,v:"Claimed in own hands — to 15b",span:11},{v:P.t2},{v:""},{v:""},{v:""},{v:""},{v:""},{v:""},{v:""}]});
  (S.tds2||[]).forEach((r,i)=>{if(r._over)h+=note("TDS 2 row "+(i+1)+": claimed "+RS(r._claimed)+" exceeds the "+RS(r._avail)+" deducted and brought forward.","stop");});
  h+='<div class="cgband">TDS 3 · 20C — Tax deducted under 194IA, 194IB, 194M, 194S, as per Form 16B / 16C / 16D / 16E</div>';
  h+=grid("tds3",tdsCols(true),S.tds3||[],{min:"2700px",empty:"Nothing under these sections.",add:"Add a deduction",foot:[{l:1,v:"Claimed in own hands — to 15b",span:12},{v:P.t3},{v:""},{v:""},{v:""},{v:""},{v:""},{v:""},{v:""}]});
  (S.tds3||[]).forEach((r,i)=>{if(r._over)h+=note("TDS 3 row "+(i+1)+": claimed exceeds the deducted and brought forward.","stop");});
  h+='<div class="cgband">TCS · D — Tax collected at source, as per Form 27D</div>';
  h+=grid("tcs",[{k:"who",h:"TCS credit relating to",t:"sel",w:"120px",req:1,opts:[["1","Self"],["2","Other person"]]},
    {k:"tan",h:"TAN of the collector",t:"txt",w:"120px",max:10,req:1},{k:"othPan",h:"PAN of other person",t:"txt",w:"120px",max:10},
    {k:"bf",h:"Unclaimed TCS b/f",t:"num",w:"110px"},{k:"yr",h:"FY of that b/f collection",t:"sel",w:"100px",opts:DEDYR.map(y=>[y,y])},
    {k:"collOwn",h:"Collected in own hands",t:"num",w:"120px"},{k:"collOth",h:"Collected in other's hands",t:"num",w:"120px"},
    {k:"claimOwn",h:"Claimed in own hands",t:"num",w:"120px",req:1},{k:"claimOth",h:"Claimed in other's hands — TCS",t:"num",w:"120px"},{k:"claimOthPan",h:"— PAN",t:"txt",w:"110px",max:10},
    {k:"cf",h:"Carried forward",t:"calc",w:"110px",f:r=>r._cf||0}],S.tcs||[],{min:"1500px",empty:"Nothing collected.",add:"Add a collection",
    foot:[{l:1,v:"Claimed in own hands — to 15c",span:7},{v:P.tcs},{v:""},{v:""},{v:""}]});
  h+='<div class="cgband">IT · 17A — Advance tax and self-assessment tax</div>';
  h+=note("A challan dated on or before 31 March 2026 is advance tax; after it, self-assessment tax. The date also places each advance challan in its 234C instalment.");
  h+=grid("it",[{k:"bsr",h:"BSR code",t:"txt",w:"130px",max:7,req:1},{k:"dt",h:"Date of deposit",t:"date",w:"150px",req:1},
    {k:"sn",h:"Serial number of challan",t:"txt",w:"170px",max:5,req:1},{k:"amt",h:"Amount",t:"num",w:"150px",req:1},
    {k:"kind",h:"Treated as",t:"calc",w:"130px",f:r=>0}],S.it||[],{min:"820px",empty:"No challan.",add:"Add a challan",
    foot:[{l:1,v:"Advance "+F(P.adv)+" · self-assessment "+F(P.sat),span:3},{v:P.adv+P.sat},{v:""}]});
  h+=row("15a · Advance tax",cell(P.adv));h+=row("15b · TDS — TDS 1 col 5 + TDS 2 col 9 + TDS 3 col 9",cell(P.tds));
  h+=row("15c · TCS — col 7(i)",cell(P.tcs));h+=row("15d · Self-assessment tax",cell(P.sat));
  h+=row("15e · Total taxes paid",cell(P.paid),{cls:"grand"});
  return h;
}
