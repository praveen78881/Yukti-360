# Yukti ITR builds — A.Y. 2026-27

Seven ITR forms, each split from a single-file bundle into editable modules.
**Edit the module you need — never reconstruct the bundle.**

```
yukti/<form>/
  index.html        thin loader: <link> to styles.css + ordered <script src> tags
  styles.css        all CSS for the form
  src/
    00_form.js      window.FORM (id/name/ay/sw/due) + code tables (PIN2ST, BANK)
    08_registry.js  _SECREG, SCREEN_ORDER, reg(), pf(), rule-batch registry
    10_state.js     S (working state), SEED, SKEL (+ placeholder section stubs)
    60_rules.js     rule engine entry
    61_rules_*.js   CBDT rule batches (Category A/B/D)
    30_sec_<id>.js  ONE FILE PER SECTION — its sec/eng/exp/imp/chk + its reg()
    90_wiring.js    compute / buildReturn / importReturn / export / DOM wiring
    95_shell.js     "YUKTI SHELL — shared by every form" (helpers + paint bootstrap)
    99_rail_toggle.js  ADDON (ours, not vendor) — collapsible SECTIONS rail
    _loadorder.json the exact script order index.html emits
```

## Addons

Files in `.itr-build/addons/*.js` are **ours**, not part of the vendor bundle.
`split.mjs` copies them into every form's `src/` and loads them **last**, so they
decorate the built form without touching a single split module. They sit outside
the manifests, so they never affect the zero-loss proof — delete one and the form
is exactly as it shipped.

Edit an addon once in `.itr-build/addons/` and re-run `split.mjs` for all seven.

| Addon | What it does |
|---|---|
| `99_rail_toggle.js` | Collapsible SECTIONS rail: ☰ button in the header, or Ctrl/Cmd+B. Works by flipping `--rail` to `0` — the same variable `.rail{width}` and `.wrap{left}` already key off — and remembers the choice per form in `localStorage`. |

## Where do I change X?

| I want to change… | Open |
|---|---|
| a field, its label, validation or computation in section `sal` | `src/30_sec_sal.js` |
| which sections appear and in what order | `src/08_registry.js` (`SCREEN_ORDER`) |
| the JSON skeleton / default state | `src/10_state.js` |
| a CBDT validation rule | the matching `src/61_rules_*.js` |
| the due date, software id, PIN→state or IFSC→bank tables | `src/00_form.js` |
| export/import orchestration | `src/90_wiring.js` |
| shared renderers (`N`, `row`, `inp`, `grid`, `paint`) | `src/95_shell.js` |
| styling | `styles.css` |

## Rules that will silently break a form

1. **Script order in `index.html` is load-bearing.** It reproduces the original
   bundle's execution order. Do not alphabetise or "tidy" it.
2. **`95_shell.js` must stay last** (ITR-1/3/5/6/7). Sections call its helpers at
   runtime even though they are declared after — that only works if it loads last.
3. **ITR-2 pins `70_export.js`, `80_io.js`, `90_wiring.js` last.** Its `SECS`
   array holds `f:secWho` as a load-time value, and function declarations no
   longer hoist across files once split.
4. **Never unwrap an IIFE.** ITR-7 (`cg`, `pti`, `si`, `vda`) and ITR-5/6 (`cg`)
   wrap sections in `(function(){…})()`. Several inner `calcRow` functions with
   different signatures coexist only because of that scope.
5. **Double registration is intentional.** `10_state.js` (or `90_wiring.js` in
   ITR-5) registers placeholder stubs that real sections override — the wiring
   takes the *last* registration per id. Keep both.

## Provenance and re-verification

Built mechanically from `ITR ORIGINAL/Yukti_ITR<N> Final.html` by
`.itr-build/split.mjs` using per-form line-range manifests. No code was retyped.

```bash
node .itr-build/split.mjs   .itr-build/manifests/itr6.json   # re-split
node .itr-build/verify.mjs  .itr-build/manifests/itr6.json   # prove zero loss
node .itr-build/runtime-check.mjs itr6                       # prove same behaviour
```

`verify.mjs` checks: verbatim slices · total line coverage · byte-identical
reassembly · `node --check` on every module · inventory counts.
`runtime-check.mjs` loads original and split side by side and compares live
state (sections, rule batches, SKEL, fields, tables, rendered output).

The host shell lives at `src/app/company/[id]/income-tax/`; entity→form routing
is in its `lib/itrForms.ts`.
