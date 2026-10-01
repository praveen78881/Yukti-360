/* ==================================================================
   HOUSE PROPERTY — the book: one block per property, unlimited,
   the 24(b) loan table inside each block, share applied at f
   ================================================================== */
const HP_OWNER=[["SE","Self"],["MI","Minor"],["SP","Spouse"],["OT","Others"]];
const HP_TYPE=[["S","Self occupied"],["L","Let out"],["D","Deemed let out"]];
const HP_LOANFROM=[["B","Bank"],["I","Other than bank"]];
function engProp(p){
  const self=p.type==="S";
  const share=Math.min(100,Math.max(0,p.co==="YES"?N(p.share):100));
  const a=self?0:N(p.rent);
  const b=self?0:N(p.unreal);
  const c=self?0:N(p.taxes);
  const d=R(b+c);
  const e=self?0:Math.max(0,R(a-d));          /* nil if self-occupied — 23(2) */
  const f=R(e*share/100);                     /* the share bites here */
  const g=R(f*0.30);
  /* h — the sum of the 24(b) table, capped at 2 lakh if not let out */
  const loans=(p.loans||[]).filter(l=>N(l.interest));
  const hRaw=R(loans.reduce((s,l)=>s+N(l.interest),0));
  let h=hRaw,cut=0,barred=false;
  if(self){
    if(isNew()){cut=hRaw;h=0;barred=true;}
    else if(hRaw>200000){cut=hRaw-200000;h=200000;}
  }
  const i=R(g+h);
  const jRecd=N(p.arrears);
  const j=R(jRecd*0.70);
  const k=R(f-i+j);
  return {self,share,a:R(a),b:R(b),c:R(c),d,e,f,g,hRaw,h,cut,barred,i,jRecd:R(jRecd),j,k,
    loans:loans.length,coShare:(p.coowners||[]).reduce((s,x)=>s+N(x.share),0)};
}
function engHP(){
  const H=S.hp;
  if(!H||!H.on)return {on:false,rows:[],sum1k:0,pti:0,income:0,cut:0,selfCount:0};
  const rows=(H.props||[]).map((p,i)=>{const r=engProp(p);p._=r;p._i=i;return r;});
  const sum1k=R(rows.reduce((s,r)=>s+r.k,0));
  const pti=R(S.C.pti?S.C.pti.h.hp.net:N(H.pti));
  const income=R(sum1k+pti);
  return {on:true,rows,sum1k,pti,income,cut:R(rows.reduce((s,r)=>s+r.cut,0)),
    selfCount:(H.props||[]).filter(p=>p.type==="S").length};
}

/* ---------------- 6 · House property — the book ---------------------- */
function hpBlock(p,i,ordinal){
  const r=p._||engProp(p),pre="hp.props."+i+".",id="hp"+i;
  const on=S.open["b_"+id]!==false;
  const typeLbl=(HP_TYPE.find(t=>t[0]===p.type)||["","—"])[1];
  const status=(st0(p.addr)?typeLbl+" · ":"")+(r.k<0?"loss "+RS(-r.k):RS(r.k));
  let b="";
  b+=sub("The property");
  b+=row("Address of property",inp(pre+"addr"),{req:1});
  b+=row("Town or city",inp(pre+"city"),{req:1});
  b+=row("Country",sel(pre+"country",COUNTRIES,{blank:false}),{req:1});
  if((p.country||"91")==="91"){
    b+=row("State",sel(pre+"state",Object.keys(STATE).map(k=>[k,STATE[k]])),{req:1});
    b+=row("PIN code",inp(pre+"pin",{max:6}),{req:1});
  } else {
    b+=row("State",sel(pre+"state",[["99","Outside India"]],{blank:false}),{req:1});
    b+=row("Zip code",inp(pre+"zip",{max:10}),{req:1});
  }
  b+=sub("Ownership");
  b+=row("Owner of the property",sel(pre+"owner",HP_OWNER),{req:1});
  if(p.owner==="OT")b+=row("Please specify",inp(pre+"ownerOther"),{req:1,ind:1});
  b+=row("Is the property co-owned?",sel(pre+"co",[["NO","No"],["YES","Yes"]],{blank:false}),{req:1});
  b+=row("Your percentage share in the property",p.co==="YES"?inp(pre+"share",{n:1}):cell(100),{req:1,
    hint:p.co==="YES"?"the other co-owners below should bring the total to 100":"not co-owned — 100 per cent"});
  if(p.co==="YES"){
    b+=grid(pre.slice(0,-1)+".coowners",[{k:"name",h:"Name of other co-owner",t:"txt",w:"auto",req:1},
      {k:"pan",h:"PAN",t:"txt",w:"120px",max:10},{k:"aadhaar",h:"Aadhaar",t:"txt",w:"130px",max:12},
      {k:"share",h:"Share in the property %",t:"num",w:"140px"}],
      p.coowners||[],{min:"760px",empty:"No co-owner listed.",add:"Add a co-owner",
      foot:[{l:1,v:"Shares — yours "+(N(p.share)||0)+"% + theirs "+r.coShare+"%",span:3},{v:(N(p.share)||0)+r.coShare}]});
    if(Math.abs((N(p.share)||0)+r.coShare-100)>0.01)b+=note("The shares add to "+((N(p.share)||0)+r.coShare)+"%, not 100%.","warn");
  }
  b+=sub("Type of house property");
  b+=row("Type",sel(pre+"type",HP_TYPE,{blank:false}),{req:1});
  if(p.type!=="S"){
    b+=grid(pre.slice(0,-1)+".tenants",[{k:"name",h:"Name of tenant",t:"txt",w:"auto",req:1},
      {k:"pan",h:"PAN of tenant",t:"txt",w:"120px",max:10},{k:"aadhaar",h:"Aadhaar of tenant",t:"txt",w:"130px",max:12},
      {k:"pantan",h:"PAN / TAN of tenant — if TDS credit is claimed",t:"txt",w:"200px",max:10}],
      p.tenants||[],{min:"860px",empty:"No tenant listed.",add:"Add a tenant"});
  }
  b+=sub("The working");
  if(r.self){
    b+=note("Self-occupied — the annual value is nil under section 23(2), so only the interest counts."+
      (isNew()?" Under the new regime section 115BAC(2) disallows even that.":" Under the old regime it is allowed up to ₹2,00,000."));
    b+=row("a · Gross rent received or receivable, or lettable value",cell(0),{ref:"1a"});
    b+=row("e · Annual value — nil, self-occupied",cell(0),{ref:"1e"});
    b+=row("f · Annual value of the property owned",cell(0),{ref:"1f"});
    b+=row("g · 30% of 1f",cell(0),{ref:"1g"});
  } else {
    b+=row("a · Gross rent received or receivable, or lettable value",inp(pre+"rent",{n:1}),{req:1,ref:"1a",hint:"in full — the share is applied at f"});
    b+=row("b · The amount of rent which cannot be realised",inp(pre+"unreal",{n:1}),{ref:"1b"});
    b+=row("c · Tax paid to local authorities",inp(pre+"taxes",{n:1}),{ref:"1c"});
    b+=row("d · Total (1b + 1c)",cell(r.d),{ref:"1d",cls:"tot"});
    b+=row("e · Annual value (1a − 1d)",cell(r.e),{ref:"1e",cls:"tot"});
    b+=row("f · Annual value of the property owned — your share × 1e",cell(r.f),{ref:"1f",cls:"tot",
      hint:r.share<100?r.share+" per cent of "+RS(r.e):""});
    b+=row("g · 30% of 1f",cell(r.g),{ref:"1g"});
  }
  b+=sub("h · Interest payable on borrowed capital — section 24(b)");
  b+=note("One row per loan. Every column is required on a row that is filled. The interest sums into h."+
    (r.self?" On a self-occupied house the sheet says it cannot exceed ₹2,00,000.":""));
  b+=grid(pre.slice(0,-1)+".loans",[
    {k:"from",h:"Loan taken from",t:"sel",w:"150px",req:1,opts:HP_LOANFROM},
    {k:"name",h:"Name of the bank, institution or person",t:"txt",w:"auto",req:1},
    {k:"acno",h:"Loan account number",t:"txt",w:"170px",req:1},
    {k:"dt",h:"Date of sanction",t:"date",w:"130px",req:1},
    {k:"amt",h:"Total amount of the loan",t:"num",w:"140px",req:1},
    {k:"os",h:"Outstanding on 31-03-2026",t:"num",w:"150px",req:1},
    {k:"interest",h:"Interest under 24(b)",t:"num",w:"140px",req:1}],
    p.loans||[],{min:"1300px",empty:"No loan.",add:"Add a loan",
    foot:[{l:1,v:"Total interest on borrowed capital under section 24(b)",span:6},{v:r.hRaw}]});
  b+=row("h · Interest payable on borrowed capital",cell(r.h),{ref:"1h",cls:"tot",
    hint:r.barred?"disallowed under the new regime — "+RS(r.cut)+" set aside":
      (r.cut?"capped at ₹2,00,000 — "+RS(r.cut)+" above the ceiling":"")});
  b+=row("i · Total (1g + 1h)",cell(r.i),{ref:"1i",cls:"tot"});
  b+=row("j · Arrears or unrealised rent received during the year",inp(pre+"arrears",{n:1}),{ref:"1j",hint:"the amount received; 70% is taken"});
  b+=row("j · Less 30%",cell(r.j),{ref:"1j",ind:1});
  b+=row("k · Income from house property "+ordinal+" (1f − 1i + 1j)",cell(r.k),{ref:"1k",cls:"grand"});
  return '<div class="blk'+(on?" on":"")+'"><div class="bh">'+
    '<button class="bhx" data-blk="'+id+'"><span class="cv2">'+(on?"−":"+")+'</span>'+
    '<span class="t">Property '+ordinal+(st0(p.addr)?" — "+st0(p.addr):"")+'</span>'+
    '<span class="s">'+esc(status)+'</span></button>'+
    '<button class="blkdel" data-del="hp.props.'+i+'" title="Remove">'+TRASH+'</button>'+
    '</div><div class="bb">'+(on?b:"")+'</div></div>';
}
function secHP(){
  const P=S.C.hp;let h="";
  h+=row("Is there income or a loss from house property?",sel("hp.on",[["","No"],["1","Yes"]],{blank:false}),{req:1});
  if(!S.hp.on)return h;
  h+=note("One block per property, as many as there are. The section 24(b) loan table sits inside each "+
    "block and sums into its interest. Rent and taxes are entered in full; a co-owner's share is applied "+
    "once, at f.");
  if(isNew())h+=note("Under the new regime interest on a self-occupied house gives nothing, and a loss "+
    "under this head cannot be set against any other income.","warn");
  if(P.selfCount>2)h+=note("Section 23(4) allows two self-occupied properties. The third and any further "+
    "are treated as <b>deemed let out</b> — change their type.","stop");
  (S.hp.props||[]).forEach((p,i)=>h+=hpBlock(p,i,i+1));
  h+='<button class="add" data-addprop="1">Add a property</button>';
  h+='<div class="cgband">Across all properties</div>';
  h+=row("Σ1k · Income from all properties",cell(P.sum1k),{cls:"tot"});
  h+=row("2 · Pass-through income or loss under this head — from Schedule PTI",cell(P.pti),{ref:"2",hint:"the house-property row of every block in Schedule PTI"});
  h+=row("3 · Income under the head Income from house property (Σ1k + 2)",cell(P.income),{ref:"3",cls:"grand",
    hint:P.income<0?(isNew()?"a loss — not set against other heads under the new regime":"a loss — to 2(i) of Schedule CYLA, set against other heads up to ₹2,00,000"):""});
  return h;
}
