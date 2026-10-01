/* ---- hp — House property (IncomeDeductions.PropertyDetails) ----------- */
function secHP(){
  const hp=S.C.hp||{}, calc=hp.calc||[]; const nw=isNew(); let h="";
  h+=note("Up to two house properties. In ITR-4 there is no Schedule HP — this feeds "+
    "IncomeDeductions.PropertyDetails[] and B3 'Income chargeable under House Property'.");
  (S.ic.hp||[]).forEach((p,i)=>{
    const c=calc[i]||{}; const self=(p.let==="S");
    let inner="";
    inner+=row("Address",inp("ic.hp."+i+".addr",{max:50}),{req:1});
    inner+=row("Town / City",inp("ic.hp."+i+".city",{max:50}),{req:1});
    inner+=row("State",sel("ic.hp."+i+".state",STATE_CODES),{req:1});
    inner+=row("PIN Code",inp("ic.hp."+i+".pin",{n:1,max:6}),{});
    inner+=row("Owner of the property",sel("ic.hp."+i+".owner",PROP_OWNER),{req:1});
    if(p.owner==="OT") inner+=row("If others, specify",inp("ic.hp."+i+".ownerOth",{max:50}),{ind:1});
    inner+=row("Type of house property",sel("ic.hp."+i+".let",IF_LETOUT),{req:1});
    inner+=row("Is the property co-owned?",sel("ic.hp."+i+".co",COOWN,{blank:false}),{});
    inner+=row("Your percentage of share (%)",inp("ic.hp."+i+".share",{n:1,ph:"100"}),{});
    if(p.co==="YES")
      inner+=grid("ic.hp."+i+".coown",[
        {k:"name",h:"Name of co-owner",t:"txt",w:"220px",req:1,max:125},
        {k:"pan",h:"PAN",t:"txt",w:"120px",max:10},
        {k:"aadhaar",h:"Aadhaar",t:"txt",w:"140px",max:12},
        {k:"share",h:"Share (%)",t:"num",w:"110px"}],
        p.coown||[],{min:"640px",empty:"No co-owner.",add:"Add a co-owner"});
    if(p.let==="L")
      inner+=grid("ic.hp."+i+".tenant",[
        {k:"name",h:"Name of tenant",t:"txt",w:"220px",req:1,max:125},
        {k:"pan",h:"PAN",t:"txt",w:"120px",max:10},
        {k:"aadhaar",h:"Aadhaar",t:"txt",w:"140px",max:12},
        {k:"pantan",h:"PAN/TAN (if TDS u/s 194-IB)",t:"txt",w:"180px"}],
        p.tenant||[],{min:"760px",empty:"No tenant.",add:"Add a tenant"});
    inner+=sub("Rent & annual value");
    if(self){
      inner+=note("Self-occupied — annual value is nil u/s 23(2); tax to local authorities is not allowed.");
    } else {
      inner+=row("(a) Gross rent received / receivable / lettable value",inp("ic.hp."+i+".gross",{n:1}),{ref:"a"});
      inner+=row("(b) Rent which cannot be realised",inp("ic.hp."+i+".notReal",{n:1}),{ref:"b"});
      inner+=row("(c) Tax paid to local authorities",inp("ic.hp."+i+".localTax",{n:1}),{ref:"c"});
      inner+=row("(d) Total (b + c)",cell(c.d),{ref:"d"});
      inner+=row("(e) Annual value (a − d)",cell(c.e),{ref:"e"});
      inner+=row("(f) Annual value of the property owned (share% × e)",cell(c.f),{ref:"f"});
      inner+=row("(g) 30% of annual value",cell(c.g),{ref:"g"});
    }
    inner+=sub("Interest on borrowed capital u/s 24(b)");
    if(nw && self){
      inner+=note("New regime — interest u/s 24(b) on a self-occupied house is not allowed (set to 0).","warn");
    } else {
      inner+=grid("ic.hp."+i+".loans",[
        {k:"from",h:"Loan taken from",t:"sel",w:"150px",req:1,opts:LOAN_FROM},
        {k:"name",h:"Bank / Institution / Person",t:"txt",w:"200px",req:1},
        {k:"accno",h:"Loan A/c No.",t:"txt",w:"140px",req:1},
        {k:"date",h:"Date of sanction",t:"date",w:"140px",req:1},
        {k:"total",h:"Total loan amount",t:"num",w:"140px",req:1},
        {k:"outst",h:"Outstanding",t:"num",w:"130px",req:1},
        {k:"intr",h:"Interest u/s 24(b)",t:"num",w:"140px",req:1}],
        p.loans||[],{min:"1080px",empty:"No loan.",add:"Add a loan"});
      inner+=row("(h) Interest payable on borrowed capital",cell(c.intr),{ref:"h",
        hint:(self||p.let==="D")?"capped at ₹2,00,000 (not let out)":""});
    }
    inner+=row("(i) Total deduction (g + h)",cell(c.totDed),{ref:"i"});
    inner+=row("(j) Arrears / unrealised rent received (less 30%)",inp("ic.hp."+i+".arrears",{n:1}),{ref:"j"});
    inner+=row("(k) Income of this house property (f − i + j)",cell(c.k),{ref:"k"});
    h+=blk("ichp"+i,"Property "+(i+1),(p.let?(IF_LETOUT.find(x=>x[0]===p.let)||["",""])[1]:"—"),inner,"ic.hp."+i);
  });
  if((S.ic.hp||[]).length<2)
    h+='<button class="add" data-add="ic.hp">Add a house property</button>';
  else h+=note("Maximum two house properties in ITR-4.");
  h+=row("B3 Income chargeable under the head 'House Property'",cell(hp.income),{ref:"H145",
    hint:nw?"new regime: HP loss not set off (floored at 0)":"aggregate loss floored at −₹2,00,000"});
  return h;
}

function chkHP(){
  const out=[];
  if((S.ic.hp||[]).length>2) out.push({lvl:"err",t:"Too many house properties",m:"ITR-4 allows at most two house properties.",sec:"hp"});
  (S.ic.hp||[]).forEach((p,i)=>{
    if(p.let==="S"&&N(p.localTax)>0) out.push({lvl:"warn",t:"Local tax on self-occupied",m:"Property "+(i+1)+": tax paid to local authorities is not allowed for a self-occupied house.",sec:"hp"});
    if(p.co==="YES"&&!(p.coown||[]).length) out.push({lvl:"err",t:"Co-owner table empty",m:"Property "+(i+1)+": you marked it co-owned — list each co-owner.",sec:"hp"});
    let intr=0;(p.loans||[]).forEach(l=>intr+=N(l.intr));
    if((p.let==="S"||p.let==="D")&&intr>200000) out.push({lvl:"warn",t:"24(b) interest capped",m:"Property "+(i+1)+": interest on a not-let-out house is capped at ₹2,00,000.",sec:"hp"});
  });
  return out;
}
reg({id:"hp", t:"House property", ref:"HP", f:secHP,
  s:()=>{const v=(S.C.hp||{}).income;return R(v)?RS(v):"";}, chk:chkHP, order:22});