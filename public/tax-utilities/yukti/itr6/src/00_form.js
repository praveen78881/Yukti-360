/* =====================================================================
   ITR-6 · AY 2026-27 — Phase 4 base scaffold (STUB).
   The company return. Every section is present with its title and a
   placeholder body; real fields, engines, exports and rules arrive as
   the 18 section-builders land. Modelled on forms/ITR-3/src/00_form.js.
   ===================================================================== */
/* FORM.due = 2026-10-31 is the audit-liable company's 139(1) due date.
   ITR-6 is filed by a company; a company whose accounts are required to
   be audited (and every company filing ITR-6 in the ordinary course)
   has a 31 October due date under section 139(1). The utility's
   finalDuedate formula carries a second case: where the assessee is
   required to furnish a report under section 92E (international /
   specified-domestic transfer pricing — sheet1.LiableSec92Eflg /
   AuditDateSec92E in the VBA), the due date is 30 November 2026.
   ITR-3's stub encodes only the single (non-TP audit) date and leaves
   the case logic as a TODO, so ITR-6 does the same.
   TODO Phase 4/6: when LiableSec92Eflg = "Y", set due = 2026-11-30 from
   the finalDuedate formula — that is filing-status/interest engine work,
   not this stub. */
window.FORM={id:"ITR-6",name:"ITR-6",ay:"2026-27",sw:"SW10000001",due:"2026-10-31"};

/* ---- code tables the shell's commit() may read (kept minimal) ----
   The shell resolves a PIN prefix to a state code and an IFSC prefix to a
   bank name when those fields are edited. No such fields exist in the stub,
   but defining the tables keeps the globals defined. Real tables: Phase 4. */
const PIN2ST={};   /* PIN first-two-digits -> state code */
const BANK={};     /* IFSC first-four-chars -> bank name */
