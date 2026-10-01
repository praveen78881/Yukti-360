/* =====================================================================
   ITR-7 · AY 2026-27 — Phase 2 base scaffold (STUB).
   ITR-7 is the return for TRUSTS, INSTITUTIONS and other bodies filing
   under sections 139(4A)–(4F) (charitable/religious trusts, research
   associations, news agencies, universities/colleges, political parties,
   electoral trusts, business trusts, investment funds). Every section is
   present with its title and a placeholder body; real fields, engines,
   exports and rules arrive in Phase 4. Modelled on forms/ITR-3/src/00_form.js
   and forms/ITR-6/src/00_form.js.
   ===================================================================== */
/* FORM.due = 2026-10-31 is the audit-liable body's 139(1) due date.
   The ordinary ITR-7 filer — a trust/institution claiming exemption under
   section 11 or 10(23C) — is required to get its accounts audited (section
   12A(1)(b) / tenth proviso to 10(23C)) and furnish Form 10B/10BB, so its
   due date under section 139(1) is 31 October 2026 (same audit-case date
   the utility carries as Taxcalc_AuditcaseDate44AB).
   The utility's finalDuedate logic carries two other cases:
     - a non-audit body (e.g. a political party u/s 13A whose accounts are
       not audited, no business income) → 31 July 2026 (the 31/07/2026
       literal in the VBA);
     - a body required to furnish a report u/s 92E (transfer pricing —
       Taxcalc_AuditcaseDate92E) → 30 November 2026.
   ITR-3's / ITR-6's stubs encode only the single audit-case date and leave
   the case selection as a TODO; ITR-7 does the same.
   TODO Phase 4/6: choose 2026-07-31 / 2026-10-31 / 2026-11-30 from the
   audit-liability and 92E flags per the finalDuedate formula — that is
   filing-status/interest engine work, not this stub. */
window.FORM={id:"ITR-7",name:"ITR-7",ay:"2026-27",sw:"SW10000001",due:"2026-10-31"};

/* ---- code tables the shell's commit() may read (kept minimal) ----
   The shell resolves a PIN prefix to a state code and an IFSC prefix to a
   bank name when those fields are edited. No such fields exist in the stub,
   but defining the tables keeps the globals defined. Real tables: Phase 4. */
const PIN2ST={};   /* PIN first-two-digits -> state code */
const BANK={};     /* IFSC first-four-chars -> bank name */
