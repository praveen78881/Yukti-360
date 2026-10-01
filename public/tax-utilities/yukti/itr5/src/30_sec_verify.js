/* =====================================================================
   ITR-5 · Section "verify" — Verification / declaration
   Book: books/ITR-5/VERIFICATION.md · Sheet tab: VERIFICATION
   section_map: {"VERIFICATION":{verify:[Verification]}}
   Schema block: Verification → Declaration (single object, required).

   The verification is a single-record declaration block — not a table and
   not repeating. Six declaration fields the signer fills (name, father's
   name, PAN, capacity, place) plus the system-generated date. There are no
   hidden rows on this sheet (sheet_state = visible; rows 2-11 all visible),
   so nothing hidden is built. The stray literal [N11]=01/12/2026 is not a
   declaration input and is not built.

   GTI CONTRIBUTION: none. Verification carries no income head
   (S.C.verify.income = 0) and closes nothing under any regime.

   Date is NOT a typed input: [L9] = CONCATENATE(...DAY(TODAY())...) — the
   current system date, displayed dd/mm/yyyy and exported YYYY-MM-DD
   (schema requirement; VBA formats sheet9.Date as yyyy-mm-dd). engVerify()
   recomputes it from the system date on every compute pass.

   CROSS-SHEET (from the book):
   - A13: the verification PAN must match a PAN entered in Partners/Members/
     Trust information (Part A-General(2), S.pm.members[].pan) — enforced here
     as a guarded check (warns only when member PANs are present).
   - A5/A6: capacity = "Representative assessee" (RA) sets the Part A-General
     representative-assessee flag (S.fs.rep = "Y"); rep details must be filled.
   ===================================================================== */

/* ---- code table — [H6] Capacity (enums.json Verification.Declaration.Capacity,
   verbatim: 12 values, display label → two-letter XML enum code). ---- */
const VER_CAP=[["MP","Managing Partner"],["DP","Designated partner"],["PA","Partner"],
  ["PO","Principal Officer"],["ME","Member"],["LQ","Liquidator"],
  ["RP","Resolution professional"],["TR","Trustee"],["EX","Executor"],
  ["RA","Representative assessee"],["AS","Authorised Signatory"],["OA","Official Assigne"]];
const VER_CAPMAP=(()=>{const m={};VER_CAP.forEach(p=>m[p[0]]=p[1]);return m;})();

const VER_PAN=/^[A-Z]{5}[0-9]{4}[A-Z]$/;          /* AAAAA9999A */
const VER_MINDATE="01/04/2023";                    /* VBA: date must not be < 01/04/2023 */

/* ---- state (seed only absent keys; never clobber the shell's `ver` object) ---- */
S.ver = S.ver || {};
if(S.ver.name===undefined)     S.ver.name="";      /* Declaration.AssesseeVerName [H4] */
if(S.ver.father===undefined)   S.ver.father="";    /* Declaration.FatherName      [L4] */
if(S.ver.pan===undefined)      S.ver.pan="";       /* Declaration.AssesseeVerPAN  [H7] */
if(S.ver.capacity===undefined) S.ver.capacity="";  /* Declaration.Capacity        [H6] */
if(S.ver.place===undefined)    S.ver.place="";     /* Declaration.Place           [H9] */
/* S.ver.date is system-generated (see engVerify) — not seeded as an input. */

/* =====================================================================
   ENGINE — engVerify(): system date; no income; RA → rep flag (A5/A6).
   ===================================================================== */
function engVerify(){
  S.ver = S.ver || {};
  const C = S.C.verify = { income:0 };            /* contributes nothing to GTI */

  /* [L9] = system date. Display dd/mm/yyyy (sheet), export YYYY-MM-DD (schema). */
  const d=new Date(), p2=n=>(n<10?"0":"")+n;
  const dd=p2(d.getDate()), mm=p2(d.getMonth()+1), yy=d.getFullYear();
  C.dateDisp = dd+"/"+mm+"/"+yy;                   /* dd/mm/yyyy — screen */
  C.dateISO  = yy+"-"+mm+"-"+dd;                   /* yyyy-mm-dd — export */
  S.ver.date = C.dateDisp;                         /* keep state's date in sync */

  /* capacity code + label */
  C.capacity = st0(S.ver.capacity);
  C.capacityLabel = VER_CAPMAP[C.capacity] || "";

  /* A5/A6 — Representative assessee capacity sets the Part A-General rep flag
     (derive to "Y" only; never clears a flag the gen screen owns). */
  if(C.capacity==="RA"){ S.fs = S.fs || {}; if(S.fs.rep!=="Y") S.fs.rep="Y"; }
}

/* =====================================================================
   RENDERER — secVerify(): the declaration face (six fields + note).
   ===================================================================== */
function secVerify(){
  const V = S.ver||{}, C = S.C.verify||{};
  let h = "";
  h += note('<b>Verification.</b> I solemnly declare that to the best of my knowledge and belief, the information given in the return and the schedules thereto is correct and complete and is in accordance with the provisions of the Income-tax Act, 1961.');

  h += row("I, (full name in block letters)", inp("ver.name",{max:125}),
           {req:1, ref:"Declaration.AssesseeVerName · [H4]"});
  h += row("Son / Daughter of", inp("ver.father",{max:125}),
           {req:1, ref:"Declaration.FatherName · [L4]"});
  h += row("…making this return in my capacity as", sel("ver.capacity",VER_CAP),
           {req:1, ref:"Declaration.Capacity · [H6]",
            hint:"choosing “Representative assessee” sets the representative-assessee flag in Part A-General (A5/A6)"});
  h += row("I am holding Permanent Account Number", inp("ver.pan",{max:10}),
           {req:1, ref:"Declaration.AssesseeVerPAN · [H7]",
            hint:"PAN of the signer (AAAAA9999A); must match a PAN in Partners/Members/Trust information (A13)"});
  h += row("Place", inp("ver.place",{max:50}),
           {req:1, ref:"Declaration.Place · [H9]"});
  /* Date is the system date — a computed, untypeable cell (green). */
  h += row("Date (system date)", '<span class="c">'+esc(C.dateDisp||"")+'</span>',
           {req:1, ref:"Declaration.Date · [L9]",
            hint:"auto-generated system date; exported as YYYY-MM-DD"});

  if(C.capacity==="RA")
    h += note("Capacity is “Representative assessee” — the return is treated as filed by a representative assessee (Part A-General rep flag set to “Yes”). Fill the representative-assessee name and details in Part A-General (A5/A6).","warn");

  h += note("Notes: 1. Submission date is the system date of the e-Filing portal, shown on the Acknowledgement / ITR-V. 2. Verification date is the date of e-Verification or of receipt of ITR-V at CPC, Bengaluru.");
  return h;
}

/* =====================================================================
   EXPORT — expVerify(j): write the Verification → Declaration object.
   ===================================================================== */
function expVerify(j){
  const V = S.ver||{}, C = S.C.verify||{};
  const d = {};
  put(d,"AssesseeVerName", sv(V.name) ? sv(V.name).slice(0,125) : undefined);
  put(d,"FatherName",      sv(V.father) ? sv(V.father).slice(0,125) : undefined);
  put(d,"AssesseeVerPAN",  sv(V.pan) ? sv(V.pan).toUpperCase() : undefined);
  put(d,"Capacity",        sv(V.capacity));
  put(d,"Place",           sv(V.place) ? sv(V.place).slice(0,50) : undefined);
  put(d,"Date",            sv(C.dateISO));         /* system date, YYYY-MM-DD */
  j.Verification = { Declaration: d };
}

/* =====================================================================
   IMPORT — impVerify(I5): inverse of expVerify. Returns labels read.
   ===================================================================== */
function impVerify(I5){
  const read = [];
  const D0 = I5 && I5.Verification && I5.Verification.Declaration;
  if(!D0) return read;
  S.ver = S.ver || {};
  S.ver.name     = D0.AssesseeVerName || "";
  S.ver.father   = D0.FatherName || "";
  S.ver.pan      = D0.AssesseeVerPAN || "";
  S.ver.capacity = D0.Capacity || "";
  S.ver.place    = D0.Place || "";
  /* Date is always the system date; keep the imported value for display only
     (engVerify recomputes it to today on the next compute). */
  if(D0.Date) S.ver.date = dmy(D0.Date) || D0.Date;
  read.push("Verification");
  return read;
}

/* =====================================================================
   CHECKS — chkVerify(): the sheet's own rules as live messages.
   ===================================================================== */
function chkVerify(){
  const out = [], V = S.ver||{}, C = S.C.verify||{};
  const name=st0(V.name), father=st0(V.father), pan=st0(V.pan).toUpperCase(),
        cap=st0(V.capacity), place=st0(V.place);

  if(!name)   out.push({lvl:"err",t:"Verification · name",m:"The full name of the signer (in block letters) is mandatory.",sec:"verify"});
  if(!father) out.push({lvl:"err",t:"Verification · father's name",m:"The father's name of the signer is mandatory.",sec:"verify"});

  if(!pan)                    out.push({lvl:"err",t:"Verification · PAN",m:"The PAN of the signer is mandatory.",sec:"verify"});
  else if(!VER_PAN.test(pan)) out.push({lvl:"err",t:"Verification · PAN",m:"The verification PAN must be a valid PAN (AAAAA9999A — five letters, four digits, one letter).",sec:"verify"});

  if(!cap)                                out.push({lvl:"err",t:"Verification · capacity",m:"Select the capacity in which the return is signed.",sec:"verify"});
  else if(!VER_CAPMAP[cap])               out.push({lvl:"err",t:"Verification · capacity",m:"The selected capacity is not a valid value.",sec:"verify"});

  if(!place)  out.push({lvl:"err",t:"Verification · place",m:"The place of signing is mandatory.",sec:"verify"});

  /* Date — computed system date; must be present and not before 01/04/2023 (VBA). */
  if(!C.dateDisp) out.push({lvl:"err",t:"Verification · date",m:"The verification date (system date) is mandatory.",sec:"verify"});
  else {
    const dv=D(C.dateDisp), dmin=D(VER_MINDATE);
    if(dv && dmin && dv<dmin)
      out.push({lvl:"err",t:"Verification · date",m:"The verification date must not be before 01/04/2023.",sec:"verify"});
  }

  /* A13 — verification PAN must match a Partners/Members/Trust PAN. Guarded:
     warns only when member PANs are present, so an unbuilt/empty gen never
     false-errors. */
  if(pan && VER_PAN.test(pan)){
    const mpans=((S.pm||{}).members||[]).map(m=>st0((m||{}).pan).toUpperCase()).filter(Boolean);
    if(mpans.length && mpans.indexOf(pan)<0)
      out.push({lvl:"warn",t:"Verification · PAN cross-check",m:"The verification PAN ("+pan+") does not match any PAN entered in Partners/Members/Trust information (A13).",sec:"verify"});
  }

  /* A5/A6 — Representative assessee capacity requires the rep flag + rep details. */
  if(cap==="RA"){
    if(st0((S.fs||{}).rep)!=="Y")
      out.push({lvl:"err",t:"Verification · representative assessee",m:"Capacity is “Representative assessee”, so “Yes” must be selected for “whether the return is filed by a representative assessee” in Part A-General (A5/A6).",sec:"verify"});
    if(!st0((S.fs||{}).repName))
      out.push({lvl:"err",t:"Verification · representative assessee",m:"Capacity is “Representative assessee” — the representative-assessee details in Part A-General are mandatory.",sec:"verify"});
  }

  if(!out.length) out.push({lvl:"ok",t:"Verification",m:name+" — "+(C.capacityLabel||cap)+" · "+(C.dateDisp||""),sec:"verify"});
  return out;
}

/* ---- register (last section; screen & compute order 62) ---------------- */
reg({id:"verify", t:"Verification", ref:"Verification",
     f:secVerify,
     s:()=>{const V=S.ver||{},C=S.C.verify||{};const bits=[];
       if(st0(V.name))bits.push(st0(V.name));
       if(C.capacityLabel)bits.push(C.capacityLabel);
       return bits.join(" · ");},
     eng:engVerify, exp:expVerify, imp:impVerify, chk:chkVerify,
     order:62, corder:62});
