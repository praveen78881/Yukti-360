/* compute() — Phase 2 stub. Zero the whole S.C contract the shell's footer
   (#s_gti #s_ti #s_tax #s_b) and band() read, so it paints without throwing.
   Real income/tax/interest engines: Phase 4. */

/* Phase 4 bootstrap: placeholder registrations for all 18 screen sections so the
   form always boots with its full structure. Real section-builders call reg()
   later with the same id; 90_wiring resolves each id to the LAST registration,
   so a real section overrides its placeholder. */
[
 ["who","Assessee Information","Part A - General"],
 ["ret","Return and regime","Part A - General"],
 ["bpa","Business — Part A accounts","BS · P&L · Trading · Mfg · OI · QD · GST"],
 ["bp","Business — BP & depreciation","BP · DPM/DOA · DEP/DCG · ESR · UD · ICDS"],
 ["sal","Salary","Schedule S"],
 ["hp","House property","Schedule HP"],
 ["cg","Capital gains","Schedule CG · 112A · 115AD · VDA"],
 ["os","Other sources","Schedule OS"],
 ["ded","Deductions","Chapter VI-A"],
 ["loss","Losses — set-off and carry-forward","CYLA · BFLA · CFL"],
 ["paid","Taxes paid","TDS · TCS · IT"],
 ["ei","Exempt income","Schedule EI"],
 ["si","Specified persons, special rates & firms","SPI · SI · IF"],
 ["fa","Foreign income and assets","FSI · TR · FA"],
 ["al","Assets and liabilities","Schedule AL"],
 ["other","Other schedules","Sch 5A · PTI · ESOP"],
 ["tax","Part B — total income and tax","Part B-TI · TTI · AMT · AMTC · TPSA"],
 ["bank","Bank and verification","Verification"],
].forEach(([id,t,ref])=>reg({id,t,ref,f:()=>note("<b>"+esc(t)+"</b> — being built (Phase 4)."),s:()=>""}));
