/* =====================================================================
   ITR-7 · Section "vc" — Voluntary Contributions & Aggregate Income
   Books: books/ITR-7/Schedule_VC.md (block ScheduleVC)
          books/ITR-7/Schedule_AI.md (block ScheduleAI)
   Screen order 20 · Compute order (corder) 25 — the receipts side of a
   trust/institution return: it feeds the application/accumulation (Sch A/
   ER/EC), the special-rate 115BBC computation (Sch SI / Part B-TI) and the
   exemption schedules, all of which compute after VC. Structural template:
   forms/ITR-6/src/70_sec_os.js (array/total idioms; put/pf, grid, fold).

   TWO complementary schedules, both mandatory for a trust:
   ---------------------------------------------------------------------
   Schedule VC — Voluntary Contributions (Donations Received). Domestic (A)
   split corpus (Ai = Aia 80G(2)(b) + Aib other) vs other-than-corpus (Aii,
   breakdown iia–iid → total iie); domestic VC Aiii = Ai + Aiie. Foreign (B):
   corpus (Bi = Bia + Bib), other-than-corpus (Bii), foreign contribution
   Biii = Bi + Bii, plus a free-text purpose line (Biv). Total contributions
   C = Aiii + Biii. Anonymous donations chargeable u/s 115BBC (block D): Di
   aggregate, Dii the statutory floor = max(5% of (C+Di), 1,00,000), Diii the
   amount chargeable @30% = MAX(0, Di − Dii); E = anonymous donations other
   than Diii = Di − Diii (the within-floor part, taxed under the ordinary
   11/10(23C) regime). Voluntary contributions are recorded ONLY here — never
   in Schedule AI.

   Schedule AI — Aggregate of income derived during the previous year
   EXCLUDING voluntary contributions: eight category lines (1 main-object
   receipts, 2 incidental-object receipts, 3 rent, 4 commission, 5 dividend,
   6 interest, 7 agriculture, 8 net consideration on transfer of capital
   asset), a "9 any other income" sub-table (OthersInc.OthersIncDtls[]) plus
   9a pass-through income (→ its total row 20), and the aggregate row 23
   TotalofAggregateIncomes = 1+2+3+4+5+6+8+9 (line 7 agriculture excluded per
   the utility's own formula; 9 = the row-20 other-income total incl. PTI).

   CROSS-SECTION ROLLS published on S.C.vc (consumed by app / si / tax):
     domesticVC / foreignVC / totalVC   — Aiii / Biii / C (total contributions)
     corpus / corpus80G2b               — corpus donation total & its 80G(2)(b) part
     anonAgg / anonFloor                — Di / Dii
     anon115BBC                         — Diii chargeable u/s 115BBC @30% (→ SI / Part B-TI)
     anonOther                          — E (within-floor anonymous donation)
     aiOthersTotal / aggregateIncome    — Sch AI row 20 / row 23 (income base → ER/EC/BTI)
     grossReceipts                      — totalVC + aggregateIncome (whole receipts side)
   Nothing else writes S.C.vc.
   ===================================================================== */

/* ---- state (flat keys; arrays hold {nat,amt}) -------------------- */
S.vc = S.vc || {
  /* Schedule VC · A — Domestic contribution */
  corpus80G2b:"",   /* Aia — corpus for renovation/repair of 80G(2)(b) places */
  corpusOther:"",   /* Aib — corpus other than above */
  grantsGovt:"",    /* iia — Grants from Government */
  grantsCSR:"",     /* iib — Grants from companies under CSR */
  otherGrants:"",   /* iic — Other specific grants */
  otherDon:"",      /* iid — Other donations */
  /* Schedule VC · B — Foreign contribution */
  fCorpus80G2b:"",  /* Bia */
  fCorpusOther:"",  /* Bib */
  fOther:"",        /* Bii — foreign other-than-corpus */
  fPurpose:"",      /* Biv — free-text purpose (FCRA) */
  /* Schedule VC · D — Anonymous donations 115BBC */
  anonAgg:"",       /* Di — aggregate anonymous donations received */
  /* Schedule AI — aggregate of income (excluding voluntary contributions) */
  recMain:"", recIncid:"", rent:"", comm:"", div:"", interest:"",
  agri:"", netConsid:"", pti:"",
  aiOthers:[]       /* {nat,amt} — OthersInc.OthersIncDtls[] */
};

/* default row for the shell's generic add-row handler */
SEED["vc.aiOthers"] = SEED["vc.aiOthers"] || {};

/* ---- engine ------------------------------------------------------ */
function engVc(){
  S.vc = S.vc || {};
  const O = S.vc;
  const C = S.C.vc = {};

  /* ===== Schedule VC · A — Domestic ===== */
  const aia = R(O.corpus80G2b), aib = R(O.corpusOther);
  const ai  = aia + aib;                                  /* Ai  Local.CorpusFundDonation */
  const iia = R(O.grantsGovt), iib = R(O.grantsCSR), iic = R(O.otherGrants), iid = R(O.otherDon);
  const iie = iia + iib + iic + iid;                      /* Aiie Local.TotalOtherThanCorpusFund */
  const aiii = ai + iie;                                  /* Aiii Local.VoluntaryContribution */

  /* ===== Schedule VC · B — Foreign ===== */
  const bia = R(O.fCorpus80G2b), bib = R(O.fCorpusOther);
  const bi  = bia + bib;                                  /* Bi  Foreign.CorpusFundDonation */
  const bii = R(O.fOther);                                /* Bii Foreign.OtherThanCorpusFund */
  const biii = bi + bii;                                  /* Biii Foreign.ForeignContribution */

  /* ===== C — Total contributions ===== */
  const cTot = aiii + biii;                               /* C  TotalContribution */

  /* ===== D — Anonymous donations chargeable u/s 115BBC ===== */
  const di   = R(O.anonAgg);                              /* Di  AggregateAnonymousDonations */
  const dii  = Math.max(R(0.05*(cTot+di)), 100000);      /* Dii 5% of (C+Di) or 1,00,000, higher */
  const diii = Math.max(0, di - dii);                    /* Diii chargeable @30% (floored at nil) */
  const e    = di - diii;                                 /* E  anonymous other than Diii (= min(Di,Dii)) */

  /* ===== Schedule AI — aggregate income excluding voluntary contributions ===== */
  const recMain=R(O.recMain), recIncid=R(O.recIncid), rent=R(O.rent), comm=R(O.comm),
        div=R(O.div), interest=R(O.interest), agri=R(O.agri), netConsid=R(O.netConsid);
  const pti = R(O.pti);                                   /* 9a PassThroughIncome */
  const othersSum = (O.aiOthers||[]).reduce((s,r)=>s+R(r.amt),0);
  const aiOthersTotal = othersSum + pti;                  /* row 20 TotalofOtherIncomes */
  /* row 23 Total(1+2+3+4+5+6+8+9) — line 7 agriculture excluded per utility formula */
  const aggregateIncome = recMain + recIncid + rent + comm + div + interest + netConsid + aiOthersTotal;

  /* ---- working exposed for the renderer ---- */
  C.ai={aia,aib,tot:ai}; C.iie={iia,iib,iic,iid,tot:iie}; C.aiii=aiii;
  C.bi={bia,bib,tot:bi}; C.bii=bii; C.biii=biii;
  C.cTot=cTot;
  C.di=di; C.dii=dii; C.diii=diii; C.e=e;
  C.ai_lines={recMain,recIncid,rent,comm,div,interest,agri,netConsid,pti,othersSum};
  C.aiOthersTotal=aiOthersTotal; C.aggregateIncome=aggregateIncome;

  /* ---- cross-section rolls (app / si / tax) ---- */
  C.domesticVC   = R(aiii);
  C.foreignVC    = R(biii);
  C.totalVC      = R(cTot);                 /* total voluntary contributions (C) */
  C.corpus       = R(ai + bi);              /* corpus donation total (domestic + foreign) */
  C.corpus80G2b  = R(aia + bia);            /* corpus for 80G(2)(b) renovation/repair places */
  C.anonAgg      = R(di);
  C.anonFloor    = R(dii);
  C.anon115BBC   = R(diii);                 /* chargeable u/s 115BBC @30% → Schedule SI / Part B-TI */
  C.anonOther    = R(e);
  C.aiOthersTotal   = R(aiOthersTotal);
  C.aggregateIncome = R(aggregateIncome);   /* Sch AI row 23 — income base → ER/EC / Part B-TI */
  C.grossReceipts   = R(cTot + aggregateIncome);
}

/* ---- renderer ---------------------------------------------------- */
function secVc(){
  const O = S.vc||{}, C = S.C.vc||{};
  let h = "";

  /* ===== Schedule VC — Voluntary Contributions ===== */
  {
    let b = note("Voluntary Contributions (Donations Received) — to be mandatorily filled in by all persons filing ITR-7. A contribution given with a specific direction that it shall form part of the corpus is a corpus donation; anonymous donations (donor identity not recorded) are captured separately at block D. Do NOT record these receipts in Schedule AI.");

    /* A — Domestic */
    b += sub("A · Domestic Contribution (other than anonymous donations taxable u/s 115BBC)");
    b += row("Ai · Corpus donation (Aia + Aib)", cell((C.ai||{}).tot), {ref:"Ai", cls:"tot"});
    b += row("Corpus representing donations received for renovation/repair of places notified u/s 80G(2)(b)", inp("vc.corpus80G2b",{n:1}), {ind:1, ref:"Aia"});
    b += row("Corpus other than above", inp("vc.corpusOther",{n:1}), {ind:1, ref:"Aib"});
    b += sub("ii · Other than corpus donation");
    b += row("Grants received from Government", inp("vc.grantsGovt",{n:1}), {ind:1, ref:"Aiia"});
    b += row("Grants received from companies under Corporate Social Responsibility", inp("vc.grantsCSR",{n:1}), {ind:1, ref:"Aiib"});
    b += row("Other specific grants", inp("vc.otherGrants",{n:1}), {ind:1, ref:"Aiic"});
    b += row("Other donations", inp("vc.otherDon",{n:1}), {ind:1, ref:"Aiid"});
    b += row("iie · Total other than corpus (iia + iib + iic + iid)", cell((C.iie||{}).tot), {ref:"Aiie", cls:"tot"});
    b += row("Aiii · Voluntary contribution — Domestic (Ai + Aiie)", cell(C.aiii), {ref:"Aiii", cls:"tot"});

    /* B — Foreign */
    b += sub("B · Foreign contribution (other than anonymous donations taxable u/s 115BBC)");
    b += row("Bi · Corpus donation (Bia + Bib)", cell((C.bi||{}).tot), {ref:"Bi", cls:"tot"});
    b += row("Corpus representing donations received for renovation/repair of places notified u/s 80G(2)(b)", inp("vc.fCorpus80G2b",{n:1}), {ind:1, ref:"Bia"});
    b += row("Corpus other than above", inp("vc.fCorpusOther",{n:1}), {ind:1, ref:"Bib"});
    b += row("Bii · Other than corpus donation", inp("vc.fOther",{n:1}), {ref:"Bii"});
    b += row("Biii · Foreign contribution (Bi + Bii)", cell(C.biii), {ref:"Biii", cls:"tot"});
    b += row("Biv · Specify the purpose for which foreign contribution has been received", inp("vc.fPurpose",{max:500}), {ref:"Biv",
      hint:"free text — FCRA linkage"});

    /* C — Total */
    b += row("C · Total Contributions (Aiii + Biii)", cell(C.totalVC), {ref:"C", cls:"tot"});

    /* D — Anonymous donations 115BBC */
    b += sub("D · Anonymous donations, chargeable u/s 115BBC");
    b += note("Applicable to an assessee claiming exemption u/s 11 or 10(23C)(iv)/(v)/(vi)/(via)/(iiiad)/(iiiae); to be filled only by trusts other than those covered u/s 115BBC(2). An anonymous donation is one where the identity (name and address) of the donor is not recorded.");
    b += row("Di · Aggregate of such anonymous donations received", inp("vc.anonAgg",{n:1}), {ref:"Di"});
    b += row("Dii · 5% of total donations received at (C + Di) or 1,00,000, whichever is higher", cell(C.dii), {ref:"Dii", cls:"tot"});
    b += row("Diii · Anonymous donations chargeable u/s 115BBC @ 30% (Di − Dii)", cell(C.diii), {ref:"Diii", cls:"tot"});
    b += row("E · Anonymous donations other than those included at Diii (Di − Diii)", cell(C.anonOther), {ref:"E", cls:"tot"});

    h += fold("vc_vc","VC","Schedule VC — Voluntary Contributions (Donations Received)", RS(C.totalVC||0), b, {def:true});
  }

  /* ===== Schedule AI — Aggregate of income derived (excluding VC) ===== */
  {
    const L = C.ai_lines||{};
    let b = note("Aggregate of income derived during the previous year EXCLUDING voluntary contributions — to be filled by assessees claiming exemption u/s 11 and 12 or u/s 10(23C)(iv)/(v)/(vi)/(via). This is the operating-receipts base carried to the application/accumulation and exemption schedules; the donations themselves stay in Schedule VC.");
    b += row("1 · Receipts from main objects", inp("vc.recMain",{n:1}), {ref:"1"});
    b += row("2 · Receipts from incidental objects", inp("vc.recIncid",{n:1}), {ref:"2"});
    b += row("3 · Rent", inp("vc.rent",{n:1}), {ref:"3"});
    b += row("4 · Commission", inp("vc.comm",{n:1}), {ref:"4"});
    b += row("5 · Dividend income", inp("vc.div",{n:1}), {ref:"5"});
    b += row("6 · Interest income", inp("vc.interest",{n:1}), {ref:"6"});
    b += row("7 · Agriculture income", inp("vc.agri",{n:1}), {ref:"7",
      hint:"disclosed here but excluded from the aggregate total (row 23 = 1+2+3+4+5+6+8+9)"});
    b += row("8 · Net consideration on transfer of capital asset", inp("vc.netConsid",{n:1}), {ref:"8"});
    b += sub("9 · Any other income (specify nature and amount)");
    b += grid("vc.aiOthers",[
      {k:"nat",h:"Nature of the income",t:"txt",max:125,req:1},
      {k:"amt",h:"Amount",t:"num",w:"160px",req:1}
    ], O.aiOthers||[], {empty:"No other-income rows.", add:"Add an income row",
       foot:[{l:1,v:"Σ other income"},{v:(L.othersSum||0)}]});
    b += row("9a · Pass through income (Fill Schedule PTI)", inp("vc.pti",{n:1}), {ref:"9a"});
    b += row("Total · Other income (9 rows + 9a)", cell(C.aiOthersTotal), {ref:"20", cls:"tot"});
    b += row("Aggregate of income (1+2+3+4+5+6+8+9)", cell(C.aggregateIncome), {ref:"23", cls:"tot"});
    h += fold("vc_ai","AI","Schedule AI — Aggregate of income derived (excluding voluntary contributions)", RS(C.aggregateIncome||0), b);
  }

  return h;
}

/* ---- export ------------------------------------------------------ */
function expVc(j){
  const O = S.vc||{}, C = S.C.vc||{};

  /* ---------- Schedule VC ---------- */
  const hasVc = R(O.corpus80G2b)||R(O.corpusOther)||R(O.grantsGovt)||R(O.grantsCSR)||
    R(O.otherGrants)||R(O.otherDon)||R(O.fCorpus80G2b)||R(O.fCorpusOther)||R(O.fOther)||
    st0(O.fPurpose)||R(O.anonAgg);
  if(hasVc){
    const ai=C.ai||{}, iie=C.iie||{}, bi=C.bi||{};
    /* Local (block A) — all leaves required */
    put(j,"ScheduleVC.Local.CorpusFundDonation",        sg(ai.tot));
    put(j,"ScheduleVC.Local.CorpusFundDonationUS80G2b", sg(ai.aia));
    put(j,"ScheduleVC.Local.CorpusFundDonationOther80G2b", sg(ai.aib));
    put(j,"ScheduleVC.Local.GrantsReceivedFormGovt",    sg(iie.iia));
    put(j,"ScheduleVC.Local.GrantsReceivedFromCompanie",sg(iie.iib));
    put(j,"ScheduleVC.Local.OtherSpecificGrants",       sg(iie.iic));
    put(j,"ScheduleVC.Local.OtherDonation",             sg(iie.iid));
    put(j,"ScheduleVC.Local.TotalOtherThanCorpusFund",  sg(iie.tot));
    put(j,"ScheduleVC.Local.VoluntaryContribution",     sg(C.aiii));
    /* Foreign (block B) */
    put(j,"ScheduleVC.Foreign.CorpusFundDonation",        sg(bi.tot));
    put(j,"ScheduleVC.Foreign.CorpusFundDonationUS80G2b", sg(bi.bia));
    put(j,"ScheduleVC.Foreign.CorpusFundDonationOther80G2b", sg(bi.bib));
    put(j,"ScheduleVC.Foreign.OtherThanCorpusFund",       sg(C.bii));
    put(j,"ScheduleVC.Foreign.ForeignContribution",       sg(C.biii));
    if(st0(O.fPurpose)) put(j,"ScheduleVC.Foreign.PurposeOfContribution", st0(O.fPurpose).slice(0,500));
    /* C — Total contributions */
    put(j,"ScheduleVC.TotalContribution", sg(C.totalVC));
    /* D/E — Anonymous donations 115BBC */
    put(j,"ScheduleVC.AnonymousDonations.AggregateAnonymousDonations", sg(C.di));
    put(j,"ScheduleVC.AnonymousDonations.TotalDonationsReceived",      sg(C.dii));
    put(j,"ScheduleVC.AnonymousDonations.AnonymousDonations115BBC",    sg(C.diii));
    put(j,"ScheduleVC.AnonymousDonations.AnonymousDonationsOthr115BBC",sg(C.e));
  }

  /* ---------- Schedule AI ---------- */
  const others = (O.aiOthers||[]).filter(r=>st0(r.nat)||R(r.amt));
  const hasAi = R(O.recMain)||R(O.recIncid)||R(O.rent)||R(O.comm)||R(O.div)||R(O.interest)||
    R(O.agri)||R(O.netConsid)||R(O.pti)||others.length;
  if(hasAi){
    const L = C.ai_lines||{};
    put(j,"ScheduleAI.RecptMainObj",           sg(L.recMain));
    put(j,"ScheduleAI.RecptsIncidentalObj",    sg(L.recIncid));
    put(j,"ScheduleAI.Rent",                   sg(L.rent));
    put(j,"ScheduleAI.Commission",             sg(L.comm));
    put(j,"ScheduleAI.DividendIncome",         sg(L.div));
    put(j,"ScheduleAI.InterestIncome",         sg(L.interest));
    put(j,"ScheduleAI.AgricultureIncome",      sg(L.agri));
    put(j,"ScheduleAI.NetConsdrnTrnsfrCapAsst",sg(L.netConsid));
    put(j,"ScheduleAI.PassThroughIncome",      sg(L.pti));
    put(j,"ScheduleAI.TotalofOtherIncomes",    sg(C.aiOthersTotal));
    put(j,"ScheduleAI.TotalofAggregateIncomes",sg(C.aggregateIncome));
    /* 9 — any other income sub-table (array element leaves via pf) */
    if(others.length){
      j.ScheduleAI.OthersInc = { OthersIncDtls: others.map(r=>{
        const o = {};
        pf(o,"OthNatOfInc",(sv(r.nat)||"NA").slice(0,125));
        pf(o,"OthAmount",  sg(R(r.amt)));
        return o;
      }) };
    }
  }
}

/* ---- import ------------------------------------------------------ */
function impVc(I){
  const read = [];
  if(!I) return read;
  S.vc = S.vc || {};
  const O = S.vc;

  const VC = I.ScheduleVC;
  if(VC){
    const L = VC.Local||{}, Fo = VC.Foreign||{}, AN = VC.AnonymousDonations||{};
    O.corpus80G2b = nz(L.CorpusFundDonationUS80G2b);
    O.corpusOther = nz(L.CorpusFundDonationOther80G2b);
    O.grantsGovt  = nz(L.GrantsReceivedFormGovt);
    O.grantsCSR   = nz(L.GrantsReceivedFromCompanie);
    O.otherGrants = nz(L.OtherSpecificGrants);
    O.otherDon    = nz(L.OtherDonation);
    O.fCorpus80G2b= nz(Fo.CorpusFundDonationUS80G2b);
    O.fCorpusOther= nz(Fo.CorpusFundDonationOther80G2b);
    O.fOther      = nz(Fo.OtherThanCorpusFund);
    O.fPurpose    = Fo.PurposeOfContribution||"";
    O.anonAgg     = nz(AN.AggregateAnonymousDonations);
    read.push("Schedule VC");
  }

  const AI = I.ScheduleAI;
  if(AI){
    O.recMain  = nz(AI.RecptMainObj);
    O.recIncid = nz(AI.RecptsIncidentalObj);
    O.rent     = nz(AI.Rent);
    O.comm     = nz(AI.Commission);
    O.div      = nz(AI.DividendIncome);
    O.interest = nz(AI.InterestIncome);
    O.agri     = nz(AI.AgricultureIncome);
    O.netConsid= nz(AI.NetConsdrnTrnsfrCapAsst);
    O.pti      = nz(AI.PassThroughIncome);
    O.aiOthers = (((AI.OthersInc||{}).OthersIncDtls)||[]).map(r=>({
      nat:r.OthNatOfInc||"", amt:nz(r.OthAmount)}));
    read.push("Schedule AI");
  }
  return read;
}

/* ---- checks (section-local sanity, not the Phase-6 rule engine) --- */
function chkVc(){
  const out = [], O = S.vc||{}, C = S.C.vc||{};

  /* corpus for 80G(2)(b) renovation is a subset of corpus — informational */
  if(C.corpus80G2b>0)
    out.push({lvl:"ok", t:"Corpus u/s 80G(2)(b)", m:"Corpus of "+RS(C.corpus80G2b)+" is earmarked for renovation/repair of places notified u/s 80G(2)(b); it is taxable as income if applied otherwise (11th proviso to 10(23C) / Explanation 3A to s.11).", sec:"vc"});

  /* anonymous donations 115BBC */
  if(R(C.di)>0){
    if(R(C.diii)>0)
      out.push({lvl:"ok", t:"Anonymous donations u/s 115BBC", m:"Of the "+RS(C.di)+" anonymous donations, "+RS(C.diii)+" exceeds the floor of "+RS(C.dii)+" and is chargeable u/s 115BBC @30% (Diii); "+RS(C.anonOther)+" (E) falls within the floor and is taxed under the ordinary exemption regime.", sec:"vc"});
    else
      out.push({lvl:"ok", t:"Anonymous donations u/s 115BBC", m:"The "+RS(C.di)+" anonymous donations are within the 115BBC floor of "+RS(C.dii)+"; nothing is chargeable @30% (Diii is nil) and the whole amount (E) is taxed under the ordinary exemption regime.", sec:"vc"});
  }

  /* a foreign contribution should state its purpose (FCRA) */
  if(R(C.foreignVC)>0 && !st0(O.fPurpose))
    out.push({lvl:"warn", t:"Foreign contribution · purpose", m:"A foreign contribution of "+RS(C.foreignVC)+" is reported but the purpose (Biv) for which it was received is blank; state it for FCRA compliance.", sec:"vc"});

  /* any-other-income rows must carry a nature and an amount */
  (O.aiOthers||[]).forEach((r,i)=>{
    if(R(r.amt)>0 && !st0(r.nat))
      out.push({lvl:"err", t:"Schedule AI · other income row "+(i+1), m:"An amount of "+RS(R(r.amt))+" is entered without stating the nature of the income.", sec:"vc"});
  });

  return out;
}

/* ---- register ---------------------------------------------------- */
reg({id:"vc", t:"Voluntary contributions & income", ref:"Schedule VC · AI",
     f:secVc, s:()=>{const C=S.C.vc||{}; return C.totalVC!=null?RS(C.totalVC):"";},
     eng:engVc, exp:expVc, imp:impVc, chk:chkVc, order:20, corder:25});
