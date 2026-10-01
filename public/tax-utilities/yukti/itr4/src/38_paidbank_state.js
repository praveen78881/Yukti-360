/* =====================================================================
   ITR-4 · A.Y. 2026-27 — builder "paidbank" — two screen sections:
     · paid  (order 60) — "Taxes paid" — the TDS/TCS/IT sheet
     · bank  (order 95) — "Bank and verification" — the closing sheet
   Books: books/ITR-4/TDS.md, TCS.md, IT.md, Taxes_Paid_and_Verification.md.
   Structure/refs: books/ITR-4/structure.md.

   Schema blocks OWNED (export/import) by this builder — no other section
   writes these keys:
     paid:  TDSonSalaries, TDSonOthThanSals, ScheduleTDS3Dtls,
            ScheduleTCS, ScheduleIT
     bank:  TaxPaid, Refund, Verification, TaxReturnPreparer

   NOT owned here (rendered/exported by inccore): TaxComputation,
   IncomeDeductions, TaxExmpIntIncDtls (D20 exempt income) and
   LTCG112A (D20a). The bank screen only points to those; it does not
   write their keys — one section owns each block (CLAUDE.md rule 11).

   REGIME: there is no books/ITR-4/REGIME.md; taxes paid / bank /
   verification are regime-neutral (as in the ITR-3 precedent) — no item
   in either screen closes or opens on the new-vs-old regime, so there is
   no isNew() closure (cell(0)/note) to build here and both regime paths
   render and compute identically.

   Compute contract (dispatch):
     · engPaid (order 60) sets S.C.paid.total = advance + TDS + TCS + SAT,
       which inccore's tax roll-up (order 80) reads.
     · engBank (order 95, last) reads (S.C.tax||{}).liability to compute
       the balance payable / refund and sets S.C.int.{balance,refund}
       for the footer band.
   Neither head adds to Gross Total Income: S.C.paid.income = 0 and
   S.C.bank.income = 0 (taxes paid are credits; bank/verification carry
   no income), so the tax section's Σ S.C.<head>.income is unaffected.
   ===================================================================== */

/* ---- state (namespaces S.paid / S.bank / S.ver / S.trp) ------------- */
S.paid = S.paid || { tds1:[], tds2:[], tds3:[], tcs:[], it:[] };
S.bank = S.bank || [];              /* refund accounts → Refund.BankAccountDtls */
S.ver  = S.ver  || {};
if(S.ver.cap===undefined)   S.ver.cap="S";     /* Verification.Capacity (I43) */
if(S.ver.name===undefined)  S.ver.name="";     /* Declaration.AssesseeVerName (C41) */
if(S.ver.father===undefined)S.ver.father="";   /* Declaration.FatherName (H41) */
if(S.ver.pan===undefined)   S.ver.pan="";      /* Declaration.AssesseeVerPAN (C44) */
if(S.ver.place===undefined) S.ver.place="";    /* Verification.Place (C45) */
S.trp  = S.trp  || {};              /* TaxReturnPreparer (optional block) */

/* default grid rows (contract; the shell add-handler also seeds by suffix) */
SEED["paid.tds2"] = SEED["paid.tds2"] || { sec:"94A" };
SEED["paid.tds3"] = SEED["paid.tds3"] || { sec:"94A" };
SEED["paid.tcs"]  = SEED["paid.tcs"]  || {};
SEED.bank         = SEED.bank         || { type:"SB" };
