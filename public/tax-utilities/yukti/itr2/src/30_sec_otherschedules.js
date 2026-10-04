/* ---- PTI (book 04) — nets, and where each lands ---- */
const PTI_HEADS=[["hp","i · House property"],["st111a","ii a(i) · Short term under 111A"],["stOth","ii a(ii) · Short term, others"],
 ["lt112a","ii b(i) · Long term under 112A"],["ltOth","ii b(ii) · Long term, other than 112A"],["osDiv","iii a · Dividend"],["osOth","iii b · Others"],
 ["ex23fbb","iv a · Exempt under 10(23FBB)"],["exB","iv b · Exempt under section (specify)"],["exC","iv c · Exempt under section (specify)"]];
function engPTI(){
  const out={};PTI_HEADS.forEach(([k])=>out[k]={inc:0,loss:0,net:0,tds:0});
  (S.pti2||[]).forEach(b=>{PTI_HEADS.forEach(([k])=>{const r=(b.rows||{})[k]||{};const inc=N(r.inc),loss=N(r.loss);
    out[k].inc+=inc;out[k].loss+=loss;out[k].net+=inc-loss;out[k].tds+=N(r.tds);});});
  Object.keys(out).forEach(k=>Object.keys(out[k]).forEach(f=>out[k][f]=R(out[k][f])));
  return {h:out,exempt:R(out.ex23fbb.net+out.exB.net+out.exC.net),blocks:(S.pti2||[]).length};
}
/* ---- ESOP (book 04) — tax falling due this year ---- */
const ESOP_YEARS=["2021-22","2022-23","2023-24","2024-25","2025-26"];
function engESOP(){
  const E=S.esop||{};let due=0;const rows=ESOP_YEARS.map(y=>{const r=(E.yrs||{})[y]||{};const bf=N(r.bf);
    const sold=(r.sales||[]).reduce((a,s)=>a+N(s.amt),0);
    let payable=0;if(r.ceased==="Y"||r.exp48==="Y")payable=bf;else payable=Math.min(bf,sold);
    due+=payable;return {y,bf:R(bf),sold:R(sold),sec:r.sec||"NS",ceased:r.ceased||"N",exp48:r.exp48||"N",payable:R(payable),cf:R(Math.max(0,bf-payable))};});
  return {rows,due:R(due),soldTotal:R(rows.reduce((a,r)=>a+r.sold,0))};
}
/* ---- 5A (book 04) ---- */
function eng5A(){const F=S.sch5a2||{};const heads=["hp","cg","os"].map(h=>{const r=(F.h||{})[h]||{};
  return {h,inc:R(N(r.inc)),spouse:R(N(r.spouse)),tds:R(N(r.tds)),tdsSp:R(N(r.tdsSp))};});
  const tot={inc:0,spouse:0,tds:0,tdsSp:0};heads.forEach(x=>{tot.inc+=x.inc;tot.spouse+=x.spouse;tot.tds+=x.tds;tot.tdsSp+=x.tdsSp;});return {heads,tot};}
/* ---------------- 14 · Other schedules — 5A, PTI, ESOP — book 04 ------ */
function secOther(){
  const PT=S.C.pti,ES=S.C.esop,FA5=S.C.s5a;let h="";
  /* 5A */
  h+=card("sch5a","Schedule 5A — Apportionment of income between spouses governed by the Portuguese Civil Code",(S.pi.s5a==="Yes"?RS(FA5.tot.spouse):""),
    (S.pi.s5a!=="Yes"?note("Opens when 'governed by the Portuguese Civil Code' is Yes in Assessee Information."):
    (row("Name of the spouse",inp("sch5a2.name"),{req:1})+row("PAN of the spouse",inp("sch5a2.pan",{max:10}),{req:1})+row("Aadhaar of the spouse",inp("sch5a2.aadhaar",{max:12}))+
     '<div class="full"><table class="gt" style="min-width:900px"><thead><tr><th class="l">Head of income (i)</th><th style="width:170px">Receipts under the head (ii)</th><th style="width:170px">Apportioned to the spouse (iii)</th><th style="width:150px">TDS on (ii) (iv)</th><th style="width:170px">TDS apportioned to spouse (v)</th></tr></thead><tbody>'+
     [["hp","House property"],["cg","Capital gains"],["os","Other sources"]].map(([k,l])=>'<tr><td class="l">'+l+'</td><td>'+inp("sch5a2.h."+k+".inc",{n:1})+'</td><td>'+inp("sch5a2.h."+k+".spouse",{n:1})+'</td><td>'+inp("sch5a2.h."+k+".tds",{n:1})+'</td><td>'+inp("sch5a2.h."+k+".tdsSp",{n:1})+'</td></tr>').join("")+
     '</tbody><tfoot><tr><td class="l">Total</td><td>'+F(FA5.tot.inc)+'</td><td>'+F(FA5.tot.spouse)+'</td><td>'+F(FA5.tot.tds)+'</td><td>'+F(FA5.tot.tdsSp)+'</td></tr></tfoot></table></div>'+
     note("Column (ii) is the whole receipt; (iii) the spouse's half. Your own schedules carry the other half. The TDS in (v) goes to the spouse — enter it in your TDS tables as credit relating to the other person."))));
  /* PTI */
  let pt="";
  (S.pti2||[]).forEach((b,i)=>{const p="pti2."+i+".";
    let x=row("Investment entity covered by",sel(p+"kind",[["A","A — 115UA, business trust (REIT, InvIT)"],["B","B — 115UB, investment fund (AIF)"],["C","C — 115U, venture capital"]]),{req:1})+row("Name of the business trust or investment fund",inp(p+"name"),{req:1})+row("PAN",inp(p+"pan",{max:10}),{req:1});
    x+='<div class="full"><table class="gt" style="min-width:960px"><thead><tr><th class="l">Head of income (6)</th><th style="width:140px">Current year income (7)</th><th style="width:170px">Share of current year loss distributed (8)</th><th style="width:140px">Net 9 = 7 − 8</th><th style="width:130px">TDS (10)</th></tr></thead><tbody>';
    PTI_HEADS.forEach(([k,l])=>{const r=((b.rows||{})[k])||{};x+='<tr><td class="l">'+l+'</td><td>'+inp(p+"rows."+k+".inc",{n:1})+'</td><td>'+inp(p+"rows."+k+".loss",{n:1})+'</td><td class="num">'+cell(N(r.inc)-N(r.loss))+'</td><td>'+inp(p+"rows."+k+".tds",{n:1})+'</td></tr>';});
    x+='</tbody></table></div>';
    pt+=blk("pti"+i,"Trust or fund "+(i+1)+(st0(b.name)?" — "+st0(b.name):""),"",x,"pti2."+i);});
  pt+='<button class="add" data-addpti="1">Add a trust or fund</button>';
  pt+=note("Each net lands in its destination: house property to HP item 2; the four capital-gain rows to CG A8 and B11; dividend and others to Schedule OS; exempt rows to EI line 5. The TDS to Schedule TDS 2 with the head set accordingly.");
  h+=card("pti","Schedule PTI — Pass-through income from a business trust or investment fund, sections 115UA, 115UB",(PT.blocks?PT.blocks+" block"+(PT.blocks>1?"s":""):""),pt);
  /* ESOP */
  let es=row("PAN of the employer, being an eligible start-up",inp("esop.pan",{max:10}),{req:1})+row("DPIIT registration number of the employer",inp("esop.dpiit"),{req:1});
  es+='<div class="full"><table class="gt" style="min-width:1200px"><thead><tr><th class="l" style="width:90px">Assessment year</th><th style="width:130px">Tax deferred brought forward (3)</th><th class="l" style="width:130px">Securities sold? (4i)</th><th style="width:120px">Sale table total (4ii)</th><th class="l" style="width:110px">Ceased employee? (5)</th><th class="l" style="width:110px">Date of ceasing</th><th class="l" style="width:110px">48 months expired? (6)</th><th style="width:130px">Tax payable this year (7)</th><th style="width:130px">Balance carried forward (8)</th></tr></thead><tbody>';
  ES.rows.forEach(r=>{const p="esop.yrs."+r.y+".";es+='<tr><td class="l">'+r.y+'</td><td>'+inp(p+"bf",{n:1})+'</td><td class="l">'+sel(p+"sec",[["NS","Not sold"],["PS","Partly sold"],["FS","Fully sold"]],{blank:false,style:"width:100%"})+'</td><td class="num">'+cell(r.sold)+'</td><td class="l">'+sel(p+"ceased",[["N","No"],["Y","Yes"]],{blank:false,style:"width:100%"})+'</td><td>'+inp(p+"ceasedDt",{ph:DF,max:10})+'</td><td class="l">'+sel(p+"exp48",[["N","No"],["Y","Yes"]],{blank:false,style:"width:100%"})+'</td><td class="num">'+cell(r.payable)+'</td><td class="num">'+cell(r.cf)+'</td></tr>';});
  es+='<tr><td class="l">2026-27</td><td class="num">—</td><td colspan="6"></td><td>'+inp("esop.deferNow",{n:1})+'</td></tr></tbody><tfoot><tr><td class="l" colspan="7">Tax deferred from earlier years payable this year → 8c of Part B-TTI</td><td>'+F(ES.due)+'</td><td></td></tr></tfoot></table></div>';
  ESOP_YEARS.forEach(y=>{const r=((S.esop||{}).yrs||{})[y]||{};if(r.sec&&r.sec!=="NS")es+=sub("Sales in "+y)+grid("esop.yrs."+y+".sales",[{k:"dt",h:"Date of sale",t:"date",w:"140px",req:1},{k:"amt",h:"Tax attributed to the sale",t:"num",w:"170px",req:1}],r.sales||[],{min:"400px",empty:"No sale.",add:"Add a sale"});});
  es+=note("Tax falls due in the year of the earliest event — a sale (to the extent sold), leaving the employer (all), or 48 months from the end of the assessment year of allotment (all).");
  h+=card("esop","Schedule ESOP — Tax deferred on ESOPs of an eligible start-up, section 17(2)(vi)",(ES.due?RS(ES.due)+" due":""),es);
  return h;
}
