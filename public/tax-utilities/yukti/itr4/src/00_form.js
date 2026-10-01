/* =====================================================================
   ITR-4 (Sugam) · AY 2026-27 — Phase 2 shell instantiation (STUB).
   Every section is present with its title and a placeholder body.
   Real fields, engines and rules arrive in Phase 4.
   ===================================================================== */
/* FORM.due = 2026-08-31 is ITR-4's ItrFilingDueDate per the schema
   (books/ITR-4/skeleton.json → FilingStatus.ItrFilingDueDate). Real
   audit / case variants come from the utility's finalDuedate formula
   in Phase 4 — that is interest/engine work, not this stub. */
window.FORM={id:"ITR-4",name:"ITR-4 (Sugam)",ay:"2026-27",sw:"SW10000001",due:"2026-08-31"};

/* ---- code tables the shell's commit() may read (kept minimal) ----
   The shell resolves a PIN prefix to a state code and an IFSC prefix to a
   bank name when those fields are edited. No such fields exist in the stub,
   but defining the tables keeps the globals defined. Real tables: Phase 4. */
const PIN2ST={};   /* PIN first-two-digits -> state code */
const BANK={};     /* IFSC first-four-chars -> bank name */
