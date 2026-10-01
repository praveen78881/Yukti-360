/* ---- tax — Part B → GTI → VI-A → TI → tax → 87A → cess → 234 → liability ---- */
function secTax(){
  const t=S.C.taxc||{}; const nw=isNew(); let h="";
  h+=sub("Part B — Gross Total Income");
  h+=row("B1 Salary",cell((S.C.inc||{}).salary),{ref:"H135"});
  h+=row("B1 Business & Profession (presumptive E8)",cell((S.C.inc||{}).bp),{ref:"F110"});
  h+=row("B3 House Property",cell((S.C.hp||{}).income),{ref:"H145"});
  h+=row("B4 Other Sources",cell((S.C.inc||{}).os),{ref:"F146"});
  h+=row("D20(a)(iii) LTCG u/s 112A (not chargeable)",cell((S.C.inc||{}).ltcg112a),{ref:"D20a"});
  h+=row("B5 Gross Total Income",cell(t.gti),{ref:"F172"});
  h+=row("Gross Total Income incl. LTCG 112A",cell(t.gtiInc),{ref:"GrossTotIncomeIncLTCG112A"});

  h+=sub("Part C — Chapter VI-A deductions");
  h+=row("C19 Total Chapter VI-A deductions (from Deductions screen)",cell(t.via),{ref:"C19",
    hint:nw?"most deductions close in the new regime":"read from the ded builder (S.C.ded.total)"});
  h+=row("C20 Total Income (B5 − C19)",cell(t.ti),{ref:"F224",hint:"Sugam ceiling ~₹50 lakh"});

  h+=sub("Part D — Tax computation");
  h+=row("D1 Tax payable on Total Income",cell(t.d1),{ref:"F226",
    hint:(S.pi.status==="F")?"firm — flat 30%":(nw?"new regime slabs 115BAC(1A)":"old regime slabs")});
  h+=row("D2 Rebate u/s 87A",cell(t.d2),{ref:"F227",
    hint:nw?"up to ₹60,000 for total income up to ₹12L":"₹12,500 for total income up to ₹5L"});
  h+=row("D3 Tax payable after rebate (D1 − D2)",cell(t.d3),{ref:"F228"});
  h+=row("D4 Health & Education Cess @ 4%",cell(t.d4),{ref:"F230"});
  h+=row("D5 Total Tax & Cess (D3 + D4)",cell(t.d5),{ref:"F231"});
  h+=row("D6 Relief u/s 89 (submit Form 10E)",inp("ic.d.relief89",{n:1}),{ref:"F232"});
  h+=row("D7 Balance Tax after Relief (D5 − D6)",cell(t.d7),{ref:"F234"});
  h+=row("D8 Interest u/s 234A",inp("ic.d.int234a",{n:1}),{ref:"F235"});
  h+=row("D9 Interest u/s 234B",inp("ic.d.int234b",{n:1}),{ref:"F236"});
  h+=row("D10 Interest u/s 234C",inp("ic.d.int234c",{n:1}),{ref:"F237"});
  h+=row("D11 Fee u/s 234F",inp("ic.d.fee234f",{n:1}),{ref:"F238",hint:"max ₹5,000"});
  h+=row("D11a Fee u/s 234-I (revised return)",inp("ic.d.fee234i",{n:1}),{ref:"F240",hint:"max ₹5,000"});
  h+=row("D12 Total Tax, Fee & Interest",cell(t.d12),{ref:"F241"});
  h+=note("Taxes paid, balance payable and refund are computed on the Taxes-paid and "+
    "Bank screens; the balance/refund figure appears in the footer strip.");
  return h;
}

function chkTax(){
  const out=[], t=S.C.taxc||{};
  if(N(t.ti)>5125000) out.push({lvl:"err",t:"Total income above the Sugam ceiling",m:"Total income exceeds ₹51,25,000 — ITR-4 (Sugam) cannot be used; file ITR-3.",sec:"tax"});
  if(S.pi.status!=="I" && N(t.d2)>0) out.push({lvl:"warn",t:"87A rebate not available",m:"Rebate u/s 87A is available only to a Resident Individual (rules #250/#255).",sec:"tax"});
  if(N(t.fee234f)>5000) out.push({lvl:"warn",t:"Fee 234F over cap",m:"Late-filing fee u/s 234F is capped at ₹5,000.",sec:"tax"});
  if(!out.length) out.push({lvl:"ok",t:"Tax computation",m:(isNew()?"New":"Old")+" regime · total income "+RS(t.ti||0)+" · tax & cess "+RS(t.d5||0)+".",sec:"tax"});
  return out;
}

reg({id:"tax", t:"Part B — tax computation", ref:"Income Details (Part D)", f:secTax,
  s:()=>{const t=S.C.taxc||{};return R(t.d12)?RS(t.d12):"";},
  eng:engTax, chk:chkTax, order:80});
