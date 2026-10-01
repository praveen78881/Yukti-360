
function compute(){
  if(!S.cg)S.cg=JSON.parse(JSON.stringify(CG_STATE_DEFAULT));
  if(!S.os2)S.os2=JSON.parse(JSON.stringify(OS_STATE_DEFAULT));
  ["tds1","tds2","tds3","tcs","it","spi","pti2","fsi2","bank","alw"].forEach(k=>{if(!Array.isArray(S[k]))S[k]=[];});
  ["ei2","amtc","esop","sch5a2","al2","tr2","tax","loss","hp","sal","via"].forEach(k=>{if(!S[k]||typeof S[k]!=="object")S[k]={};});
  if(!S.fa2)S.fa2={};
  S.C.pti=engPTI();S.C.ptiExempt=S.C.pti.exempt;
  S.C.sal=engSal();S.C.hp=engHP();S.C.cg=engCG();S.C.os=engOS();
  S.C.loss=engLoss();engTableF();
  /* gross total income: BFLA xiii + special-rate other-sources income (2f is already in the DTAA row) + virtual digital assets */
  S.C.gti=R(S.C.loss.gti+(S.C.os.special-(S.C.os.sp?S.C.os.sp.dtaa:0))+S.C.cg.vda.cg);
  S.C.ei2=engEI();S.C.eiAgri=S.C.ei2.netAgri;S.C.ei=S.C.ei2.total;
  /* VI-A capped at GTI less special-rate income (Part B-TI line 11) */
  S.C.si={rows:[],totInc:0,totTax:0,bbeTax:0,cgDivTax:0,tax112A:0,tax115AD:0};
  const splPre=R(S.C.os.special+Math.max(0,S.C.cg.after.st20||0)+Math.max(0,S.C.cg.after.st30||0)+Math.max(0,S.C.cg.after.stDTAA||0)+Math.max(0,S.C.cg.after.lt125||0)+Math.max(0,S.C.cg.after.ltDTAA||0)+S.C.cg.vda.cg);
  S.C.via=engVIA(Math.max(0,S.C.gti-splPre));
  S.C.ti=Math.max(0,Math.round((S.C.gti-S.C.via.allowed)/10)*10);
  S.C.si=engSI();
  S.C.tax=engTax();S.C.amt=engAMT();S.C.amtc=engAMTC();
  S.C.paid=engTaxesPaid();S.C.fsi=engFSI();S.C.trDTAA=S.C.fsi.dtaaRel;S.C.trNoDTAA=S.C.fsi.noDtaaRel;
  S.C.esop=engESOP();S.C.esopDue=S.C.esop.due;S.C.s5a=eng5A();S.C.al2=engAL();
  S.C.int=engInt();S.C.checks=engChecks();
}




/* ==================================================================
   7 · THE SIXTEEN SECTIONS
   ================================================================== */
const SECS=[
 {id:"who",t:"Who is filing",ref:"Part A",f:secWho,
  s:()=>st0(S.pi.pan)?st0(S.pi.pan).toUpperCase():"Name, PAN, status, residence, address"},
 {id:"ret",t:"Return and regime",ref:"Part A",f:secRet,
  s:()=>(isNew()?"New regime":"Old regime")+(D(S.fs.filed)?" · filed "+DISP(D(S.fs.filed)):"")},
 {id:"sal",t:"Salary",ref:"Schedule S",f:secSal,
  s:()=>S.C.sal.income?"Income "+CR(S.C.sal.income):"Gross salary, exempt allowances, section 16"},
 {id:"cg",t:"Capital gains",ref:"Schedule CG",f:secCG,
  s:()=>!S.cg.on?"None":(S.C.cg.total?CR(S.C.cg.total):(S.cg.land||[]).length+" property")},
 {id:"os",t:"Other sources",ref:"Schedule OS",f:secOS,
  s:()=>!(S.os2&&S.os2.on)?"None":(S.C.os.nine?CR(S.C.os.nine):"Dividend, interest, gifts, special rates")},
 {id:"hp",t:"House property",ref:"Schedule HP",f:secHP,
  s:()=>!S.hp.on?"None":(S.C.hp.income<0?"Loss "+CR(-S.C.hp.income):
       S.C.hp.income?"Income "+CR(S.C.hp.income):S.hp.props.length+" property")},
 {id:"ded",t:"Deductions",ref:"Chapter VI-A",f:secDed,
  s:()=>S.C.via.allowed?"Allowed "+CR(S.C.via.allowed):(isNew()?"Almost none under the new regime":"Chapter VI-A")},
 {id:"loss",t:"Losses — set-off and carry-forward",ref:"CYLA · CFL",f:secLoss,
  s:()=>S.C.loss.cf.total?"Carried "+CR(S.C.loss.cf.total):(S.C.loss.totHPset+S.C.loss.totOSset+S.C.loss.totBFset?"Set off "+CR(S.C.loss.totHPset+S.C.loss.totOSset+S.C.loss.totBFset):"CYLA · BFLA · CFL")},
 {id:"paid",t:"Taxes paid",ref:"TDS · TCS · IT",f:secPaid,
  s:()=>S.C.int.paid?"Paid "+CR(S.C.int.paid):"TDS, TCS, advance and self-assessment"},
 {id:"ei",t:"Exempt income",ref:"Schedule EI",f:secEI,
  s:()=>S.C.ei2.total?CR(S.C.ei2.total):"Agricultural, other exempt, DTAA"},
 {id:"si",t:"Specified persons and special rates",ref:"SPI · SI",f:secSI,
  s:()=>S.C.si.totInc?CR(S.C.si.totInc):"Clubbed income · special-rate table"},
 {id:"fa",t:"Foreign income and assets",ref:"FSI · TR · FA",f:secFA,
  s:()=>((S.fsi2||[]).length||Object.keys(S.fa2||{}).some(k=>(S.fa2[k]||[]).length))?"Declared":"None"},
 {id:"al",t:"Assets and liabilities",ref:"Schedule AL",f:secAL,
  s:()=>S.C.al2.required?"Required — income over ₹1 crore":(S.C.al2.mov||S.C.al2.imm?"Declared":"Not required")},
 {id:"other",t:"Other schedules",ref:"5A · PTI · ESOP",f:secOther,
  s:()=>(S.C.pti.blocks||S.C.esop.due||S.pi.s5a==="Yes")?"Declared":"Spouse apportionment, pass-through, ESOP"},
 {id:"tax",t:"Part B — total income and tax",ref:"Part B-TI · TTI",f:secTax,
  s:()=>S.C.tax.gross?"Tax "+CR(S.C.int.net):"Lines 1 to 17, both parts"},
 {id:"bank",t:"Bank and verification",ref:"Part B-TTI",f:secBank,
  s:()=>S.bank.length?S.bank.length+" account"+(S.bank.length>1?"s":""):"Bank, who signs, export"}
];
/* ==================================================================
   8 · RENDER
   ================================================================== */
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
  const T=S.C.tax,I=S.C.int;
  $("s_gti").textContent=CR(S.C.gti);$("s_ti").textContent=CR(S.C.ti);
  $("s_tax").textContent=CR(T.gross);
  const w=$("s_bw");
  if(I.refund>0){$("s_bl").textContent="Refund due";$("s_b").textContent=CR(I.refund);w.className="m ref";}
  else{$("s_bl").textContent="Balance payable";$("s_b").textContent=CR(I.balance);w.className="m pay";}
  const c=S.C.checks||[],e=c.filter(x=>x.lvl==="err"),n=c.filter(x=>x.lvl==="warn").length;
  let s='<b>'+T.regime+'</b> regime';
  if(T.rebate)s+='  ·  rebate <b>'+CR(T.rebate)+'</b>';
  if(S.C.amt.applies)s+='  ·  AMT applies';
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
  if(/^cg\.land\.\d+\.(lt|s45_5a)$/.test(p)||/^cg\.(editE|editF)$/.test(p)||/^os2\.(on|editQ|rent)$/.test(p)||/^d80\.(selfSr|parSr)$/.test(p)||/^loss\.(editC|editB)$/.test(p)||/^(al2\.hasImm|tr2\.refundFlag|esop\.yrs\.[0-9-]+\.sec|ei2\.others\.\d+\.cat)/.test(p))return "full";
  if(p==="hp.on"){if(!S.hp.props)S.hp.props=[];if(v&&!S.hp.props.length)S.hp.props=[{type:"S",co:"NO",country:"91",owner:"SE",loans:[],coowners:[],tenants:[]}];return "full";}
  if(/^(fs\.optout|fs\.sec|pi\.status|pi\.res|pi\.dir|pi\.unl|pi\.partner|pi\.fpi|pi\.rep|pi\.country|pi\.addr2same|pi\.rescond|decl\.flag|decl\.dep_f|decl\.trv_f|decl\.ele_f|decl\.c4_f)$/.test(p))return "full";
  if(/^hp\.props\.\d+\.(type|co|owner|country)$/.test(p))return "full";
  return true;
}
document.addEventListener("input",e=>{const t=e.target;
  if(!t.matches||!t.matches("input,select")||t.type==="checkbox")return;
  const r=commit(t);
  if(r==="full"){const id=t.dataset.p,pos=t.selectionStart,y=$("wrap").scrollTop;paint(true);
    if(id){const el=document.querySelector('[data-p="'+CSS.escape(id)+'"]');
      if(el){el.focus();if(pos!=null){try{el.setSelectionRange(pos,pos);}catch(x){}}}}
    $("wrap").scrollTop=y;return;}
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
$("b_json").addEventListener("click",exportJSON);
paint();
