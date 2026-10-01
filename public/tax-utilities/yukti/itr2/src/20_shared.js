/* ==================================================================
   3 · HELPERS
   ================================================================== */
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
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


/* ==================================================================
   6 · THE SIX RENDERERS (identical to ITR-1)
   ================================================================== */
function row(label,right,o){o=o||{};
  return '<div class="r'+(o.cls?" "+o.cls:"")+'">'+
   '<div class="l'+(o.req?" req":"")+'">'+(o.ind?'<span class="i1">':'')+label+(o.ind?'</span>':'')+
     (o.hint?'<span class="hint">'+esc(o.hint)+'</span>':'')+'</div>'+
   '<div class="ref">'+esc(o.ref||"")+'</div>'+
   (o.v2!==undefined?'<div class="v2">'+o.v2+'</div>':'')+
   '<div class="v">'+(right||"")+'</div></div>';}
const cell=(n,c)=>'<span class="c'+(R(n)===0?" zero":"")+(R(n)<0?" neg":"")+(c?" "+c:"")+'">'+F(n)+'</span>';
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
const sub=t=>'<div class="r sub"><div class="l">'+esc(t)+'</div><div class="ref"></div><div class="v"></div></div>';
const note=(t,k)=>'<div class="note'+(k?" "+k:"")+'">'+t+'</div>';
const formNote=t=>note("<b>Form required.</b> "+t,"form");
function grid(key,cols,rows,o){o=o||{};
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
/* a fold: collapsible sub-head with a status on the right */
function fold(id,ref,title,status,inner,opts){
  opts=opts||{};const on=opts.def?S.open[id]!==false:!!S.open[id];
  return '<div class="sub2'+(on?" on":"")+'"><button class="s2h" data-sub2="'+id+'">'+
    '<span class="cv3">'+(on?"−":"+")+'</span><span class="s2ref">'+esc(ref)+'</span>'+
    '<span class="s2t">'+esc(title)+'</span><span class="s2v">'+status+'</span></button>'+
    '<div class="s2b'+(on?" open":"")+'">'+(on?inner:"")+'</div></div>';
}