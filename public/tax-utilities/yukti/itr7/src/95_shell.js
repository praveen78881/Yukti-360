/* =====================================================================
   YUKTI SHELL — shared by every form. Do not edit per form.
   A form supplies: FORM (id, name, AY), the code tables it needs, S (its
   state), compute(), engChecks(), SECS (its sections), buildReturn(),
   importReturn(), runRules(), auditRules(). Everything else is here.
   ===================================================================== */
const FORM=window.FORM||{id:"ITR-X",name:"ITR-X",ay:"2026-27",sw:"SW10000001"};
const $=id=>document.getElementById(id);
const dmy=iso=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||""));return m?m[3]+"/"+m[2]+"/"+m[1]:"";};
document.addEventListener("DOMContentLoaded",()=>{if($("frm"))$("frm").textContent=FORM.name;if($("ay"))$("ay").textContent="A.Y. "+FORM.ay;});
/* the due date is per form: FORM.due as "YYYY-MM-DD" (ITR-3 differs from ITR-2; audit cases differ again). Take it from the utility's finalDuedate formula and the rules document. */
const DUE=FORM.due?new Date(FORM.due+"T00:00:00"):new Date(2026,6,31), YREND=new Date(2026,2,31), DF="DD/MM/YYYY";
/* ---- helpers ---- */
const N=v=>{const n=parseFloat(String(v==null?"":v).replace(/[^0-9.\-]/g,""));return isFinite(n)?n:0;};
const R=n=>Math.round(N(n));
const F=n=>{n=R(n);return n===0?"—":(n<0?"("+Math.abs(n).toLocaleString("en-IN")+")":n.toLocaleString("en-IN"));};
const RS=n=>{n=R(n);return (n<0?"−₹":"₹")+Math.abs(n).toLocaleString("en-IN");};
const CR=n=>{n=Math.abs(R(n));
  if(n>=10000000)return "₹"+(n/10000000).toFixed(2)+" cr";
  if(n>=100000)return "₹"+(n/100000).toFixed(2)+" L";
  return "₹"+n.toLocaleString("en-IN");};
const st0=v=>String(v==null?"":v).trim();
const TRASH='<svg viewBox="0 0 16 16" width="14" height="14" style="vertical-align:-2px" '+
  'fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2.5 4h11M6 4V2.6'+
  'c0-.3.2-.6.6-.6h2.8c.4 0 .6.3.6.6V4M4 4l.6 9c0 .5.4.9.9.9h5c.5 0 .9-.4.9-.9L12 4"/>'+
  '<path d="M6.5 7v4M9.5 7v4"/></svg>';
function get(p){let o=S;for(const k of p.split("."))o=(o||{})[k];return o;}
function set(p,v){const a=p.split(".");let o=S;
  for(let i=0;i<a.length-1;i++){if(o[a[i]]==null)o[a[i]]={};o=o[a[i]];}
  o[a[a.length-1]]=v;}
function D(s){const m=/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(st0(s));
  if(!m)return null;const d=new Date(+m[3],+m[2]-1,+m[1]);
  return (d.getFullYear()==+m[3]&&d.getMonth()==+m[2]-1&&d.getDate()==+m[1])?d:null;}
function DISP(d){if(!d)return "—";
  const M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return String(d.getDate()).padStart(2,"0")+"-"+M[d.getMonth()]+"-"+d.getFullYear();}
function ISO(s){const d=D(s);return d?d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")
  +"-"+String(d.getDate()).padStart(2,"0"):undefined;}
function MPART(a,b){if(!a||!b||b<=a)return 0;
  let m=(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth());
  if(b.getDate()>a.getDate())m++;return Math.max(1,m);}
function HOLD(a,b){const x=D(a),y=D(b);if(!x||!y)return null;return (y-x)/(1000*60*60*24*30.4375);}
function FYof(s){const d=D(s);if(!d)return null;
  const y=d.getMonth()>=3?d.getFullYear():d.getFullYear()-1;
  return y+"-"+String((y+1)%100).padStart(2,"0");}
function age(){const d=D(S.pi.dob);if(!d)return 0;
  let a=YREND.getFullYear()-d.getFullYear();const m=YREND.getMonth()-d.getMonth();
  if(m<0||(m===0&&YREND.getDate()<d.getDate()))a--;return a;}
const isNew=()=>S.fs.optout!=="Yes";
const senior=()=>age()>=60, superSr=()=>age()>=80;
/* qtrOf is defined with the interest engine, on the utility's cutoffs */
const PAN_RE=/^[A-Z]{5}[0-9]{4}[A-Z]$/, VPAN=/^[A-Z]{3}[PH][A-Z][0-9]{4}[A-Z]$/;
const TAN_RE=/^[A-Z]{4}[0-9]{5}[A-Z]$/, IFSC_RE=/^[A-Z]{4}0[A-Z0-9]{6}$/;
const MAIL=/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/, BSR=/^[0-9]{3}[0-9A-Z]{4}$/;
const AADH=/^[0-9]{12}$/;
const note=(t,k)=>'<div class="note'+(k?" "+k:"")+'">'+t+'</div>';
const sub=t=>'<div class="r sub"><div class="l">'+esc(t)+'</div><div class="ref"></div><div class="v"></div></div>';
const formNote=t=>note("<b>Form required.</b> "+t,"form");
const cell=(n,c)=>'<span class="c'+(R(n)===0?" zero":"")+(R(n)<0?" neg":"")+(c?" "+c:"")+'">'+F(n)+'</span>';
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const nz=v=>(v==null||v===0||v==="")?"":v;

/* ---- renderers ---- */
function row(label,right,o){o=o||{};
  return '<div class="r'+(o.cls?" "+o.cls:"")+'">'+
   '<div class="l'+(o.req?" req":"")+'">'+(o.ind?'<span class="i1">':'')+label+(o.ind?'</span>':'')+
     (o.hint?'<span class="hint">'+esc(o.hint)+'</span>':'')+'</div>'+
   '<div class="ref">'+esc(o.ref||"")+'</div>'+
   (o.v2!==undefined?'<div class="v2">'+o.v2+'</div>':'')+
   '<div class="v">'+(right||"")+'</div></div>';}
function inp(p,o){o=o||{};const v=get(p);
  return '<input class="f'+(o.n?" n":"")+'" data-p="'+p+'" value="'+
    esc(v==null?"":(o.n?(N(v)?N(v):""):v))+'"'+(o.ph?' placeholder="'+esc(o.ph)+'"':'')+
    (o.max?' maxlength="'+o.max+'"':'')+(o.dis?" disabled":"")+'>';}
function dte(p){return inp(p,{ph:DF,max:10})+'<span class="dt">'+DF+'</span>';}
function sel(p,opts,o){o=o||{};const v=get(p);
  return '<select class="f" data-p="'+p+'"'+(o.style?' style="'+o.style+'"':'')+'>'+
    (o.blank!==false?'<option value="">(Select)</option>':'')+
    opts.map(x=>{const a=Array.isArray(x)?x[0]:x,b=Array.isArray(x)?x[1]:x;
      return '<option value="'+esc(a)+'"'+(String(v==null?"":v)===String(a)?" selected":"")+
        '>'+esc(b)+'</option>';}).join("")+'</select>';}
function grid(key,cols,rows,o){o=o||{};rows=Array.isArray(rows)?rows:[];
  let h='<div class="full"><table class="gt"'+(o.min?' style="min-width:'+o.min+'"':'')+'><thead><tr>';
  cols.forEach(c=>h+='<th'+(c.t==="txt"||c.t==="sel"||c.t==="date"?' class="l':' class="')+
    (c.req?" req":"")+'"'+(c.w?' style="width:'+c.w+'"':'')+'>'+esc(c.h)+
    (c.t==="date"?' <span style="font-weight:400;color:var(--ink-3)">'+DF+'</span>':'')+'</th>');
  h+='<th class="x"></th></tr></thead><tbody>';
  if(!rows.length)h+='<tr><td class="emp" colspan="'+(cols.length+1)+'">'+esc(o.empty||"Nothing entered.")+'</td></tr>';
  rows.forEach((r,i)=>{h+='<tr>';
    cols.forEach(c=>{const p=key+"."+i+"."+c.k;
      if(c.t==="calc")h+='<td class="num">'+cell(c.f?c.f(r,i):r[c.k])+'</td>';
      else if(c.t==="sel")h+='<td class="l">'+sel(p,c.opts,{style:"width:100%"})+'</td>';
      else if(c.t==="chk")h+='<td style="text-align:center"><input type="checkbox" data-chk="'+p+'"'+(r[c.k]==="Y"?" checked":"")+'></td>';
      else if(c.t==="num")h+='<td>'+inp(p,{n:1})+'</td>';
      else if(c.t==="date")h+='<td>'+inp(p,{ph:DF,max:10})+'</td>';
      else h+='<td>'+inp(p,{ph:c.ph,max:c.max})+'</td>';});
    h+='<td class="x"><button data-del="'+key+"."+i+'" title="Remove">'+TRASH+'</button></td></tr>';});
  h+='</tbody>';
  if(o.foot){h+='<tfoot><tr>';
    o.foot.forEach(f=>h+='<td'+(f.l?' class="l"':'')+(f.span?' colspan="'+f.span+'"':'')+'>'+(f.l?esc(f.v):F(f.v))+'</td>');
    h+='<td></td></tr></tfoot>';}
  return h+'</table></div><button class="add" data-add="'+key+'">'+esc(o.add||"Add a row")+'</button>';}
function card(id,title,status,inner){const on=!!S.open["c_"+id];
  return '<div class="card'+(on?" on":"")+'"><button class="ch" data-card="'+id+'">'+
    '<span class="sw"></span><span class="t">'+esc(title)+'</span>'+
    '<span class="st">'+(on?status:"Not claimed")+'</span></button>'+
    '<div class="cb">'+(on?inner:"")+'</div></div>';}
function blk(id,title,status,inner,delPath){const on=S.open["b_"+id]!==false;
  return '<div class="blk'+(on?" on":"")+'"><div class="bh">'+
    '<button class="bhx" data-blk="'+id+'"><span class="cv2">'+(on?"−":"+")+'</span>'+
    '<span class="t">'+esc(title)+'</span><span class="s">'+esc(status)+'</span></button>'+
    (delPath?'<button class="blkdel" data-del="'+delPath+'" title="Remove">'+TRASH+'</button>':'')+
    '</div><div class="bb">'+(on?inner:"")+'</div></div>';}
function fold(id,ref,title,status,inner,opts){
  opts=opts||{};const on=opts.def?S.open[id]!==false:!!S.open[id];
  return '<div class="sub2'+(on?" on":"")+'"><button class="s2h" data-sub2="'+id+'">'+
    '<span class="cv3">'+(on?"−":"+")+'</span><span class="s2ref">'+esc(ref)+'</span>'+
    '<span class="s2t">'+esc(title)+'</span><span class="s2v">'+status+'</span></button>'+
    '<div class="s2b'+(on?" open":"")+'">'+(on?inner:"")+'</div></div>';}

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


/* ==================================================================
   9 · EVENTS
   ================================================================== */
function commit(t){
  const p=t.dataset.p;if(!p)return false;
  let v=t.value;
  if(/\.(pan|tan|ifsc|bsr|swid|isin)$/.test(p)||/\.(pan|tan|ifsc|bsr)$/.test(p.replace(/\.\d+\./g,".")))
    v=String(v).toUpperCase();
  set(p,v);
  if(p==="pi.pin"&&/^\d{6}$/.test(v)){const c=PIN2ST[v.slice(0,2)];if(c&&!S.pi.state)S.pi.state=c;}
  if(/\.ifsc$/.test(p)&&v.length>=4){const b=BANK[v.slice(0,4)];
    if(b){const m=p.match(/^(.+)\.ifsc$/);if(!get(m[1]+".bank"))set(m[1]+".bank",b);}}
  if(p==="cg.on")return "full";
  if(/^cg\.land\.\d+\.(lt|s45_5a)$/.test(p)||/^cg\.(editE|editF)$/.test(p)||/^os2\.(on|editQ|rent|e\.fap|d\.(ord|e22))$/.test(p)||/^d80\.(selfSr|parSr)$/.test(p)||/^via\.c80(ddb|gg|qqb|rrb)$/.test(p)||/^loss\.(editC|editB)$/.test(p)||/^(al2\.hasImm|tr2\.refundFlag|esop\.yrs\.[0-9-]+\.sec|ei2\.others\.\d+\.cat|ei2\.agri)/.test(p))return "full";
  if(p==="hp.on"){if(!S.hp.props)S.hp.props=[];if(v&&!S.hp.props.length)S.hp.props=[{type:"S",co:"NO",country:"91",owner:"SE",loans:[],coowners:[],tenants:[]}];return "full";}
  if(/^(fs\.optout|fs\.sec|pi\.status|pi\.res|pi\.dir|pi\.unl|pi\.partner|pi\.fpi|pi\.rep|pi\.country|pi\.addr2same|pi\.rescond|decl\.flag|decl\.dep_f|decl\.trv_f|decl\.ele_f|decl\.c4_f)$/.test(p))return "full";
  if(/^hp\.props\.\d+\.(type|co|owner|country)$/.test(p))return "full";
  return true;
}
/* ---- events ---- */
document.addEventListener("input",e=>{const t=e.target;
  if(!t.matches||!t.matches("input,select")||t.type==="checkbox")return;
  const r=commit(t);
  if(r==="full"){paint(true);return;}
  if(r){const id=t.dataset.p,pos=t.selectionStart;compute();band();
    clearTimeout(window._rp);
    window._rp=setTimeout(()=>{const y=$("wrap").scrollTop;paint(true);
      const el=document.querySelector('[data-p="'+CSS.escape(id)+'"]');
      if(el){el.focus();try{el.setSelectionRange(pos,pos);}catch(x){}}
      $("wrap").scrollTop=y;},430);}});
document.addEventListener("change",e=>{const t=e.target;
  if(t.matches&&t.matches("select")){if(commit(t)!==false)paint(true);return;}
  if(t.type==="checkbox"&&t.dataset.chk){set(t.dataset.chk,t.checked?"Y":"");paint(true);}});
document.addEventListener("click",e=>{const t=e.target;
  const g=t.closest&&t.closest("[data-go]");if(g){goTo(g.dataset.go);return;}
  const s=t.closest&&t.closest("[data-sec]");
  if(s){const id=s.dataset.sec;S.open[id]=S.open[id]===false;paint(true);return;}
  const c=t.closest&&t.closest("[data-card]");
  if(c){const k="c_"+c.dataset.card;S.open[k]=!S.open[k];
    const own={horse:"os2.horse"}[c.dataset.card];
    if(own)set(own+".on",!!S.open[k]);paint(true);return;}
  const b=t.closest&&t.closest("[data-blk]");
  if(b){const k="b_"+b.dataset.blk;S.open[k]=S.open[k]===false;paint(true);return;}
  const ch=t.closest&&t.closest("[data-cghead]");
  if(ch){const k=ch.dataset.cghead;S.open[k]=S.open[k]===false;paint(true);return;}
  const s2=t.closest&&t.closest("[data-sub2]");
  if(s2){const k=s2.dataset.sub2;S.open[k]=!S.open[k];paint(true);return;}
  const al=t.closest&&t.closest("[data-addland]");
  if(al){S.cg.land.push({buy:"",sale:"",lt:al.dataset.addland,ded:{},buyers:[],improve:[]});paint(true);return;}
  if(t.closest&&t.closest("[data-addprop]")){if(!S.hp.props)S.hp.props=[];S.hp.props.push({type:"S",co:"NO",country:"91",owner:"SE",loans:[],coowners:[],tenants:[]});paint(true);return;}
  if(t.closest&&t.closest("[data-addfsi]")){S.fsi2.push({sec:"90",h:{}});paint(true);return;}
  if(t.closest&&t.closest("[data-addpti]")){S.pti2.push({kind:"A",rows:{}});paint(true);return;}
  if(t.closest&&t.closest("[data-addemp]")){if(!S.sal.emp)S.sal.emp=[];S.sal.emp.push({empcat:"OTH"});paint(true);return;}
  const ad=t.closest&&t.closest("[data-add]");
  if(ad){const SEED={alw:{sec:"10(13A)"},os:{sec:"SAV"},tds2:{sec:"194A",yr:"2025"},
      tds3:{yr:"2025"},tcs:{yr:"2025"},bank:{type:"SB"},g80:{bucket:"A"},ei:{cat:"AGRI"},
      "cg.s112a":{pre18:"AE"},"cg.vda":{},"cg.a7.deem":{py:"2024-25",sec:"54B"},"cg.b10.deem":{py:"2024-25",sec:"54"},"cg.a9":{trc:"Y"},"cg.b12":{trc:"Y"},"cg.a3trades":{},"cg.s115ad":{pre18:"AE"},"os2.eOther":{},"os2.pf111":{ay:"2025-26"},"os2.spl":{code:"5A1ai"},"os2.pti":{code:"5A1ai"},"os2.dtaa":{nature:"1ai",itemno:"56i",trc:"Y"},"spi":{head:"OS"},"n17_1":{code:"1"},"n17_2":{code:"1"},"n17_3":{code:"1"},"ei2.others":{cat:"OTH"},"ei2.land":{owned:"O",irr:"IRG"},"ei2.dtaa":{trc:"Y",head:"OS"},"tds2":{who:"S",sec:"94A"},"tds3":{who:"S",sec:"4IA"},"tcs":{who:"1"},"fa2.bank":{status:"OWNER"},"fa2.cust":{status:"OWNER",nature:"I"},"fa2.equity":{},"fa2.insur":{},"fa2.fin":{interest:"DIRECT",offSch:"NI"},"fa2.imm":{own:"DIRECT",offSch:"NI"},"fa2.oth":{own:"DIRECT",offSch:"NI"},"fa2.sign":{taxable:"N",offSch:"NI"},"fa2.trust":{taxable:"N",offSch:"NI"},"fa2.othInc":{taxable:"N",offSch:"NI"},"al2.imm":{country:"91"},"gga":{clause:"80GGA2a",mode:"OTH"},"ggc":{mode:"OTH"},"ra":{},"c80c":{},"pen80ccc":{type:"LIC"},"pen80ccd1":{type:"NPS"},"pen80ccd1b":{type:"NPS"},"d80.selfIns":{},"d80.selfSrIns":{},"d80.parIns":{},"d80.parSrIns":{},"e80.e":{from:"B"},"e80.ee":{from:"B"},"e80.eea":{from:"B"},"e80.eeb":{from:"B"},"cg.aA":{rate:"STL20"},"cg.bA":{rate:"LTL125"},"loss.cfl":{},
      "fsi.rows":{sec:"90"},"tr.rows":{sec:"90"},"fa.bank":{},"fa.equity":{},"fa.immovable":{},
      "pti.rows":{head:"CG"},"esop.rows":{},"pi.dirco":{type:"D",listed:"L"},"pi.unlco":{type:"D"},"pi.juris":{},"pi.firms":{},"decl.c4":{nature:"1"}};
    const k=ad.dataset.add;let seed=Object.assign({},SEED[k]||{});
    if(/\.loans$/.test(k))seed={from:"B"};
    const suf=k.split(".").pop();if(SEED[suf]&&!SEED[k])seed=Object.assign({},SEED[suf]);
    const arr=get(k);
    if(Array.isArray(arr))arr.push(seed);else set(k,[seed]);paint(true);return;}
  const dl=t.closest&&t.closest("[data-del]");
  if(dl){const m=dl.dataset.del.match(/^(.+)\.(\d+)$/);const arr=get(m[1]);
    if(Array.isArray(arr))arr.splice(+m[2],1);paint(true);return;}
  if(t.id==="b_json2"){exportJSON();return;}
  if(t.id==="b_save2"){saveFile();return;}});
$("wrap").addEventListener("scroll",()=>{clearTimeout(window._sp);window._sp=setTimeout(spy,60);});
$("wrap").addEventListener("scroll",()=>{clearTimeout(window._sp);window._sp=setTimeout(spy,60);});
/* ---- save / open ---- */
function download(n,t){const b=new Blob([t],{type:"application/json"}),a=document.createElement("a");
  a.href=URL.createObjectURL(b);a.download=n;document.body.appendChild(a);a.click();
  a.remove();URL.revokeObjectURL(a.href);}
function saveFile(){const o={};Object.keys(S).forEach(k=>{if(k!=="C")o[k]=S[k];});
  o.meta={app:"yukti",form:FORM.id,ay:"2026-27",ver:1,saved:new Date().toISOString()};
  download((S.pi.pan||FORM.id)+"_AY"+FORM.ay+".yukti.json",JSON.stringify(o,null,1));}
$("b_save").addEventListener("click",saveFile);
function deepFind(o,keys,d){d=d||0;if(!o||typeof o!=="object"||d>9)return undefined;
  for(const k of keys)if(o[k]!==undefined&&o[k]!==null&&o[k]!=="")return o[k];
  for(const k in o){const r=deepFind(o[k],keys,d+1);if(r!==undefined)return r;}return undefined;}
/* importReturn(I) is supplied by the form — the inverse of buildReturn */
function importFile(txt){let j;try{j=JSON.parse(txt);}catch(e){alert("That file is not readable JSON.");return;}
  if(j&&j.meta&&j.meta.app==="yukti"&&j.meta.form===FORM.id){
    Object.keys(j).forEach(k=>{if(k!=="C"&&k!=="meta")S[k]=j[k];});
    if(typeof afterOpen==="function")afterOpen();   /* the form may repair old working files here */
    S.open={};paint();alert("Working file loaded — every field is back as it was saved.");return;}
  const I=j&&j.ITR&&(j.ITR[FORM.id.replace("-","")]||Object.values(j.ITR)[0]);
  if(I&&I.PartA_GEN1){
    const got=importReturn(I);S.open={};paint();
    alert("Return JSON read back into the form: "+got.join(", ")+".\n\nComputed schedules — CYLA, BFLA, SI, AMT, Part B — are recomputed from these. Check the date of filing, which the return does not carry.");return;}
  const got=[];const pan=deepFind(j,["PAN","pan"]);
  if(pan&&PAN_RE.test(String(pan).toUpperCase())){S.pi.pan=String(pan).toUpperCase();got.push("PAN");}
  const nm=deepFind(j,["AssesseeName"]);
  if(nm&&typeof nm==="object"){S.pi.first=nm.FirstName||S.pi.first;S.pi.mid=nm.MiddleName||S.pi.mid;S.pi.last=nm.SurNameOrOrgName||S.pi.last;got.push("name");}
  const ad=deepFind(j,["Address"]);
  if(ad&&typeof ad==="object"){S.pi.addr1=ad.ResidenceNo||S.pi.addr1;S.pi.locality=ad.LocalityOrArea||S.pi.locality;S.pi.city=ad.CityOrTownOrDistrict||S.pi.city;
    S.pi.state=ad.StateCode||S.pi.state;S.pi.pin=ad.PinCode!=null?String(ad.PinCode):S.pi.pin;S.pi.mobile=ad.MobileNo!=null?String(ad.MobileNo):S.pi.mobile;S.pi.email=ad.EmailAddress||S.pi.email;got.push("address");}
  const aa=deepFind(j,["AadhaarCardNo"]);if(aa&&AADH.test(String(aa))){S.pi.aadhaar=String(aa);got.push("Aadhaar");}
  const dob=deepFind(j,["DOB"]);if(dob){S.pi.dob=dmy(dob)||S.pi.dob;got.push("date of birth");}
  const bk=deepFind(j,["AddtnlBankDetails"]);
  if(Array.isArray(bk)&&bk.length){S.bank=bk.map(b=>({ifsc:b.IFSCCode||"",bank:b.BankName||"",acno:b.BankAccountNo||"",type:b.AccountType||"SB",refund:b.UseForRefund==="true"?"Y":"N"}));got.push("bank accounts");}
  paint();alert(got.length?("Imported from the prefill: "+got.join(", ")+"."):"Nothing recognisable was found. If it is the portal prefill, check the assessment year.");}
$("filepick").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=()=>importFile(String(r.result));r.readAsText(f);});
$("b_open").addEventListener("click",()=>$("filepick").click());
$("b_open").addEventListener("click",()=>$("filepick").click());
/* ---- rule helpers ---- */
const RG=(o,p,d)=>{try{const v=p.split(".").reduce((t,k)=>t==null?undefined:t[k],o);return v==null?(d===undefined?0:d):v;}catch(e){return d===undefined?0:d;}};
const RSUM=(arr,f)=>(arr||[]).reduce((a,r)=>a+(typeof f==="function"?N(f(r)):N(r[f])),0);
const REQ=(a,b,tol)=>Math.abs(N(a)-N(b))<=(tol||1);
const RDR=o=>o&&o.DateRange?Object.values(o.DateRange).reduce((a,v)=>a+N(v),0):0;
/* ---- export gate ---- */
const deep=o=>JSON.parse(JSON.stringify(o));
function put(o,p,v){if(v===undefined||v===null||v==="")return;
  const a=p.split(".");let t=o;for(let i=0;i<a.length-1;i++){if(t[a[i]]==null)t[a[i]]={};t=t[a[i]];}
  t[a[a.length-1]]=v;}
const n0=x=>Math.max(0,R(x)),sg=x=>R(x),sv=v=>{v=st0(v);return v||undefined;};
function auditShape(b){const miss=[],bad=[];
  (function w(req,got,path){Object.keys(req).forEach(k=>{const p=path?path+"."+k:k;
    if(!(k in got)||got[k]===undefined){miss.push(p);return;}
    const r=req[k],g=got[k];
    if(r!==null&&typeof r==="object"&&!Array.isArray(r)){
      if(typeof g!=="object"||Array.isArray(g))bad.push(p+" should be an object");else w(r,g,p);
    } else if(typeof r==="number"){if(typeof g!=="number"||!isFinite(g)||g%1!==0)bad.push(p+" should be a whole number");
    } else if(typeof r==="string"){if(typeof g!=="string"||!g)bad.push(p+" should be text");}});
  })(SKEL,Object.values(b.ITR)[0],"");return {miss,bad};}
/* auditRules(b) is supplied by the form */
const HASH_KEY="HZX4oKH11zARYIb2",HASH_ITER=1988;   /* ITR-7 signing — same key/iterations as the offline utility (getHashKey/getHashIteration, verified) */
async function computeDigest(compactJson){
  const enc=new TextEncoder();
  const key=await crypto.subtle.importKey("raw",enc.encode(HASH_KEY),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  let bytes=new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(compactJson)));
  for(let i=0;i<HASH_ITER;i++)bytes=new Uint8Array(await crypto.subtle.sign("HMAC",key,bytes));
  let bin="";for(const b of bytes)bin+=String.fromCharCode(b);
  return btoa(bin);
}
async function exportJSON(){compute();
  const errs=S.C.checks.filter(c=>c.lvl==="err");
  if(errs.length){alert(errs.length+" thing"+(errs.length>1?"s":"")+" still to fix:\n\n"+
    errs.slice(0,8).map(e=>"· "+e.t+" — "+e.m).join("\n")+
    (errs.length>8?"\n\n…and "+(errs.length-8)+" more.":""));return;}
  const b=buildReturn(),a=auditShape(b);
  if(a.miss.length||a.bad.length){alert("The return did not come out in the shape the schema requires:\n\n"+
    a.miss.slice(0,6).map(x=>"missing "+x).concat(a.bad.slice(0,6)).join("\n"));return;}
  const r=auditRules(b);
  if(r.length){alert("The return does not agree with itself:\n\n"+r.slice(0,8).join("\n"));return;}
  /* the department's own validation rules — Category A stops the upload, D is a warning */
  let rr=[];try{rr=runRules(Object.values(b.ITR)[0],S);}catch(e){console.error("rules",e);}
  const rA=rr.filter(x=>x.cat==="A"),rD=rr.filter(x=>x.cat==="D");S.C.rules=rr;
  if(rA.length){alert("The portal would reject this return — "+rA.length+" Category A rule"+(rA.length>1?"s":"")+" fail"+(rA.length>1?"":"s")+":\n\n"+
    rA.slice(0,10).map(x=>"A"+x.n+" · "+x.msg).join("\n")+(rA.length>10?"\n\n…and "+(rA.length-10)+" more. The full list is under Bank and verification.":""));paint(true);return;}
  if(rD.length)alert("Exported. "+rD.length+" Category D notice"+(rD.length>1?"s":"")+" to act on after upload:\n\n"+rD.map(x=>"D"+x.n+" · "+x.msg).join("\n"));
  b.ITR.ITR7.CreationInfo.Digest="-";                 /* sign exactly as the utility: compact JSON with Digest "-", HMAC it, substitute, write compact */
  const digest=await computeDigest(JSON.stringify(b));
  b.ITR.ITR7.CreationInfo.Digest=digest;
  download((S.pi.pan||FORM.id)+"_"+FORM.id.replace("-","")+"_AY"+FORM.ay+".json",JSON.stringify(b));}
function rulesPanel(){let rr=[];try{const b=buildReturn();rr=runRules(Object.values(b.ITR)[0],S);}catch(e){return note("The department's rules could not be run yet — "+(e.message||e),"warn");}
  const rA=rr.filter(x=>x.cat==="A"),rD=rr.filter(x=>x.cat==="D");
  let h=sub("The department's validation rules — "+FORM.name+", AY "+FORM.ay+"");
  h+=note((rA.length?"<b>"+rA.length+" Category A rule"+(rA.length>1?"s":"")+" fail</b> — the portal would reject the upload.":"<b>Every Category A rule passes.</b> The portal would accept the upload.")+
    (rD.length?" "+rD.length+" Category D notice"+(rD.length>1?"s":"")+" — the return uploads but a form or claim needs to follow.":""),rA.length?"stop":"");
  if(rA.length||rD.length){h+='<div class="full"><table class="gt" style="min-width:800px"><thead><tr><th class="l" style="width:70px">Rule</th><th class="l" style="width:90px">Category</th><th class="l">What the portal checks</th></tr></thead><tbody>';
    rA.concat(rD).forEach(x=>h+='<tr><td class="l">'+x.cat+x.n+'</td><td class="l">'+(x.cat==="A"?"A — rejected":"D — notice")+'</td><td class="l">'+esc(x.msg)+'</td></tr>');h+='</tbody></table></div>';}
  return h;}
$("b_json").addEventListener("click",exportJSON);
paint();
