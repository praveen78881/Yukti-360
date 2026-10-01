/* =====================================================================
   ITR-3 · AY 2026-27 — Phase 2 shell instantiation (STUB).
   Every section is present with its title and a placeholder body.
   Real fields, engines and rules arrive in Phase 4.
   ===================================================================== */
/* FORM.due = 2026-07-31 is the non-audit 139(1) due date for ITR-3.
   TODO Phase 4: the audit-case and 92CE (transfer-pricing, 30-Nov) due
   dates come from the utility's finalDuedate formula and the rules
   document — that is interest/engine work, not this stub. */
window.FORM={id:"ITR-3",name:"ITR-3",ay:"2026-27",sw:"SW10000001",due:"2026-07-31"};

/* ---- code tables the shell's commit() may read (kept minimal) ----
   The shell resolves a PIN prefix to a state code and an IFSC prefix to a
   bank name when those fields are edited. No such fields exist in the stub,
   but defining the tables keeps the globals defined. Real tables: Phase 4. */
const PIN2ST={};   /* PIN first-two-digits -> state code */
const BANK={};     /* IFSC first-four-chars -> bank name */
