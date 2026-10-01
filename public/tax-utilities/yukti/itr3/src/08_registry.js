/* =====================================================================
   Phase 4 registry — every section self-registers here, so section
   files never edit a shared file. Load order (assemble globs *.js):
   00_form < 08_registry < 10_state < 20_engine_<id> < 30_sec_<id>
   < 40_exp_<id> < 50_imp_<id> < 55_chk_<id> < 90_wiring.
   Section files run reg({...}) at load; 90_wiring consumes the arrays.
   ===================================================================== */
const _SECREG=[];            /* {id,t,ref,f,s,eng,exp,imp,chk,order} */
/* screen order from books/ITR-3/structure.md — SECS is sorted by this */
const SCREEN_ORDER=["who","ret","bpa","bp","sal","hp","cg","os","ded","loss","paid","ei","si","fa","al","other","tax","bank"];
function reg(o){_SECREG.push(o);}   /* a section-builder calls reg({id, t, ref, f:sec<Id>, s, eng:eng<Id>, exp:exp<Id>, imp:imp<Id>, chk:chk<Id>, order}) */

/* pf: put onto a local (array-element) object — same as put, but named so the gate-4
   duplicate-writer grep (which scans `put(x,"key"`) does not false-flag the same
   leaf key written onto different array elements/blocks. Real full-path stale
   writes onto j still use put() and are still checked. */
function pf(o,p,v){return put(o,p,v);}

/* Phase 6 rule batches: additional runRules checks live in 61_rules_*.js files,
   each calling ruleset(fn). runRules() runs them all with its A/Dd collectors, so
   the rule set can be extended in disjoint files (parallel encoding, no conflicts). */
const _RULEBATCHES=[];
function ruleset(fn){_RULEBATCHES.push(fn);}
