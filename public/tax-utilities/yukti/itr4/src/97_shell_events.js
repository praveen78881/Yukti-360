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
  if(I&&(I.PartA_GEN1||I.PersonalInfo)){
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