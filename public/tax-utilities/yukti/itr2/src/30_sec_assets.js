/* ---- AL (book 07) ---- */
function engAL(){const A=S.al2||{};const mov=["jewel","art","vehicle","bank","shares","insur","loans","cash"].reduce((a,k)=>a+N(A[k]),0);
  const imm=R((A.imm||[]).reduce((a,r)=>a+N(r.amt),0));return {imm,mov:R(mov),liab:R(N(A.liab)),required:S.C.ti>10000000};}
/* ---------------- 13 · Assets and liabilities — book 07 ---------------- */
function secAL(){
  const A=S.C.al2,X=S.al2||{};let h="";
  h+=note((A.required?"<b>Total income exceeds ₹1 crore — Schedule AL is mandatory.</b> ":"Schedule AL is required only where total income exceeds ₹1 crore. ")+"Everything at cost, in rupees.",A.required?"stop":"");
  h+='<div class="cgband">A · Immovable assets</div>';
  h+=row("Do you own any immovable asset?",sel("al2.hasImm",[["N","No"],["Y","Yes"]],{blank:false}));
  if(X.hasImm==="Y")h+=grid("al2.imm",[{k:"desc",h:"Description",t:"txt",w:"140px",max:25,req:1},{k:"flat",h:"Flat / door / block",t:"txt",w:"140px",req:1},{k:"premises",h:"Premises / building / village",t:"txt",w:"140px"},{k:"road",h:"Road / street / post office",t:"txt",w:"140px"},
    {k:"locality",h:"Area / locality",t:"txt",w:"130px",req:1},{k:"city",h:"Town / city / district",t:"txt",w:"130px",req:1},{k:"state",h:"State",t:"sel",w:"140px",req:1,opts:Object.keys(STATE).map(k=>[k,STATE[k]])},
    {k:"country",h:"Country",t:"sel",w:"130px",req:1,opts:CC_ALL},{k:"pin",h:"PIN",t:"txt",w:"80px",max:6},{k:"zip",h:"ZIP",t:"txt",w:"80px",max:8},{k:"amt",h:"Amount — cost",t:"num",w:"130px",req:1}],X.imm||[],{min:"1700px",empty:"None.",add:"Add a property",foot:[{l:1,v:"Total",span:10},{v:A.imm}]});
  h+='<div class="cgband">B · Movable assets</div>';
  [["jewel","(i) Jewellery, bullion etc."],["art","(ii) Archaeological collections, drawings, paintings, sculpture or any work of art"],["vehicle","(iii) Vehicles, yachts, boats and aircraft"],
   ["bank","(iv)(a) Financial asset — bank, including all deposits"],["shares","(iv)(b) Shares and securities"],["insur","(iv)(c) Insurance policies"],["loans","(iv)(d) Loans and advances given"],["cash","(iv)(e) Cash in hand"]]
   .forEach(([k,l])=>h+=row(l,inp("al2."+k,{n:1})));
  h+=row("Total movable assets",cell(A.mov),{cls:"tot"});
  h+='<div class="cgband">C · Liabilities in relation to the assets at A + B</div>';
  h+=row("Liabilities",inp("al2.liab",{n:1}),{req:A.required});
  return h;
}
