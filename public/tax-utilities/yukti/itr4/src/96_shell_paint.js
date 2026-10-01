/* ---- paint, band, index ---- */
function checksFor(id){
  const c=(S.C.checks||[]).filter(x=>x.sec===id);
  if(!c.length)return "";
  return '<div class="cks">'+c.map(x=>'<div class="ck '+x.lvl+'"><b>'+esc(x.t)+
    '</b><span>'+esc(x.m)+'</span></div>').join("")+'</div>';
}
function paint(keep){
  clearTimeout(window._rp);window._rp=null;compute();
  const y=keep?$("wrap").scrollTop:0;
  $("sheet").innerHTML=SECS.map(s=>{const on=S.open[s.id]!==false;
    let v="";try{v=s.s()||"";}catch(e){}
    const bad=(S.C.checks||[]).filter(c=>c.lvl==="err"&&c.sec===s.id).length;
    return '<section id="sec-'+s.id+'"><button class="bar" data-sec="'+s.id+'">'+
      '<span class="cv">'+(on?"−":"+")+'</span><span class="t">'+esc(s.t)+'</span>'+
      '<span class="r">'+esc(s.ref)+'</span>'+
      '<span class="v">'+(bad?bad+" to fix":esc(v))+'</span></button>'+
      '<div class="body'+(on?" open":"")+'">'+(on?checksFor(s.id)+s.f():"")+'</div></section>';
  }).join("");
  $("nav").innerHTML=SECS.map(s=>{let v="";try{v=s.s()||"";}catch(e){}
    const bad=(S.C.checks||[]).filter(c=>c.lvl==="err"&&c.sec===s.id).length;
    return '<button class="nv" data-go="'+s.id+'"><span class="t">'+esc(s.t)+'</span>'+
      '<span class="s '+(bad?"bad":/[₹]/.test(v)?"done":"")+'">'+(bad?bad+" to fix":esc(v))+
      '</span></button>';}).join("");
  band();$("wrap").scrollTop=y;spy();
}
function band(){
  /* the footer strip reads a small contract: S.C.gti, S.C.ti, S.C.tax.{gross,regime,rebate}, S.C.int.{refund,balance}, S.C.amt.applies */
  const T=S.C.tax||{},I=S.C.int||{},AM=S.C.amt||{};
  $("s_gti").textContent=CR(S.C.gti||0);$("s_ti").textContent=CR(S.C.ti||0);
  $("s_tax").textContent=CR(T.gross||0);
  const w=$("s_bw");
  if(I.refund>0){$("s_bl").textContent="Refund due";$("s_b").textContent=CR(I.refund);w.className="m ref";}
  else{$("s_bl").textContent="Balance payable";$("s_b").textContent=CR(I.balance);w.className="m pay";}
  const c=S.C.checks||[],e=c.filter(x=>x.lvl==="err"),n=c.filter(x=>x.lvl==="warn").length;
  let s='<b>'+(T.regime||(typeof isNew==="function"&&isNew()?"New":"Old"))+'</b> regime';
  if(T.rebate)s+='  ·  rebate <b>'+CR(T.rebate)+'</b>';
  if(AM.applies)s+='  ·  AMT applies';
  s+='<br>'+(e.length?'<a data-go="'+e[0].sec+'"><b>'+e.length+' to fix</b></a>'
    :(n?n+' to look at':'<b style="color:#A8E6C9">Ready to export</b>'));
  $("s_st").innerHTML=s;
}
function spy(){const y=$("wrap").scrollTop+90;let cur=SECS[0].id;
  SECS.forEach(s=>{const el=$("sec-"+s.id);if(el&&el.offsetTop<=y)cur=s.id;});
  document.querySelectorAll(".nv").forEach(b=>b.classList.toggle("on",b.dataset.go===cur));}
function goTo(id){S.open[id]=true;paint(true);const el=$("sec-"+id);
  if(el)$("wrap").scrollTo({top:el.offsetTop-8,behavior:"smooth"});}

