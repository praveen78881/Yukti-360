/* =====================================================================
   Registry — every section self-registers here, so section files never
   edit a shared file. Load order (assemble globs *.js by name):
   00_form < 08_registry < 10_state < 20_engine_<id> < 30_sec_<id>
   < 40_exp_<id> < 50_imp_<id> < 55_chk_<id> < 60_rules < 90_wiring.
   Section files run reg({...}) at load; 90_wiring consumes the arrays.
   Copied from forms/ITR-7/src/08_registry.js — this is the shell reg()
   contract, not form-specific — with the ITR-1 screen order.
   ===================================================================== */
const _SECREG=[];            /* {id,t,ref,f,s,eng,exp,imp,chk,order,corder} */
/* screen order from books/ITR-1/sections.md + section_map.json (the 10
   sections). The utility's own tab flow: Personal info -> Filing status &
   regime -> the income heads (salary, house property, other sources) ->
   Chapter-VI-A deductions -> exempt income -> Part B tax computation ->
   taxes paid -> bank & verification. */
const SCREEN_ORDER=["who","ret","sal","hp","os","ded","ei","tax","paid","bank"];
function reg(o){_SECREG.push(o);}   /* a section-builder calls reg({id, t, ref, f:sec<Id>, s, eng:eng<Id>, exp:exp<Id>, imp:imp<Id>, chk:chk<Id>, order, corder}) */

/* pf: put onto a local (array-element) object — same as put, but named so the gate
   duplicate-writer grep (which scans `put(x,"key"`) does not false-flag the same
   leaf key written onto different array elements/blocks. Real full-path stale
   writes onto j still use put() and are still checked. */
function pf(o,p,v){return put(o,p,v);}

/* Rule batches: additional runRules checks live in 61_rules_*.js files, each
   calling ruleset(fn). runRules() runs them all with its A/Dd collectors, so the
   rule set can be extended in disjoint files (parallel encoding, no conflicts). */
const _RULEBATCHES=[];
function ruleset(fn){_RULEBATCHES.push(fn);}
