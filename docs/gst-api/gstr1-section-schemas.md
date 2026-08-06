# GSTR-1 Section Save-Schemas (field + required reference, verified)

> Fields + required-status quoted from `docs/sandbox-gst-api/schemas/.../gstr-1/documents/*.json`.
> Money = number. `*` after a field = present in the request schema; **bold** = in the `required` list.
> Items marked CONFIRM were not fully resolvable and must be checked against the live API reference before relying on them.

## B2B (`b2b.json`) — Table 4
`{ ctin, inv:[{ inum, idt, val, pos, rchrg, inv_typ(R/SEWP/SEWOP/DE/CBW), diff_percent*, itms:[{ num, itm_det:{ rt, txval, iamt/camt/samt/csamt } }] }] }`

## B2CL (`b2cl.json`) — Table 5
`{ pos, inv:[{ inum, idt, val, itms:[{ num, itm_det:{ rt, txval, iamt } }] }] }` · etin* only when via ECO (CONFIRM)

## B2CS (`b2cs.json`) — Table 7 · **required: rt, sply_ty, txval, typ, chksum**
`{ sply_ty(INTER/INTRA), typ(E/OE), etin*(15, when typ=E), pos, rt, txval, iamt/camt/samt/csamt, diff_percent* }`

## EXP (`exp.json`) — Table 6A
`{ exp_typ(WPAY/WOPAY), inv:[{ inum, idt, val, sbnum, sbdt, sbpcode, itms:[{ txval, rt, iamt }] }] }` · WOPAY ⇒ IGST=0 (CONFIRM)

## CDNR (`cdnr.json`) — Table 9B · note **required: cflag, itms, val, nt_num, updby, nt_dt, flag, chksum, ntty**
`{ ctin, nt:[{ nt_num, nt_dt, ntty(C/R/D), val, pos, inv_typ(R/DE/SEWP/SEWOP/CBW), rchrg(Y/N), p_gst(Y/N), diff_percent, opd, itms:[{ num, itm_det:{ rt, txval, iamt/camt/samt/csamt } }] }] }`
(cflag/flag/chksum/updby = system-set.)

## CDNUR (`cdnur.json`) — Table 9B · **required: itms, val, nt_num, chksum, nt_dt, ntty, typ, flag**
`{ typ(EXPWP/EXPWOP/B2CL), ntty(C/R/D), nt_num, nt_dt, val, pos, inv_typ, p_gst(Y/N), diff_percent, itms:[{ num, itm_det:{ rt, txval, iamt, csamt } }] }`

## NIL (`nil.json`) — Table 8
`{ nil:{ inv:[{ sply_ty(INTRB2B/INTRB2C/INTRAB2B/INTRAB2C), nil_amt, expt_amt, ngsup_amt }] } }`

## AT (`at.json`) / TXPD (URL `txp`) — Tables 11A / 11B
`{ pos, sply_ty(INTER/INTRA), itms:[{ rt, ad_amt, iamt/camt/samt/csamt }] }`

## HSN (`get_hsn.json`) — Table 12 · **split hsn_b2b / hsn_b2c**; row `anyOf` incl. `{ hsn_sc, txval, rt, qty, num, uqc }`
`hsn:{ hsn_b2b:[…], hsn_b2c:[…] }`, each row `{ num(int), hsn_sc(2–8 digits), desc, uqc, qty, txval, rt, iamt/camt/samt/csamt }` · **`val` not emitted per save schema** (CONFIRM — our GET schema lists it; save omits)

## DOC (`doc_issue.json`) — Table 13
`{ doc_issue:{ doc_det:[{ doc_num(1–12), docs:[{ num, from, to, totnum, cancel, net_issue }] }] } }`

## Amendments (import-only today)
B2BA/B2CLA/EXPA: invoice amends carry `oinum`/`oidt`. B2CSA/ATA/TXPDA: `omon` (original month). CDNRA/CDNURA: `ont_num`/`ont_dt` (underscored). TXPD URL=`txp`, TXPDA URL=`txpa`, DOC_ISSUE URL=`doc-issue`.

## File-summary `sec_sum` codes (`file/file.json` seclist)
AT, ATA, B2B, B2BA, B2CL, B2CLA, B2CS, B2CSA, CDNR, CDNRA, CDNUR, CDNURA, EXP, EXPA, HSN, HSN_B2B, HSN_B2C, NIL, TXPD, TXPDA, DOC_ISSUE, ECOM(+A), SUPECOM(+A), TTL_LIAB (+ `_4A/_4B/_6C/_SEZWOP/_SEZWP` sub-codes).
