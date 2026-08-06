# GSTR-1 — Add-Entry Particulars (section-wise)

Reference of every field captured when **adding a new manual entry** in each GSTR-1 section of CA_studio, as wired today. Auto rows (pulled from the invoice register / books) carry the same data; this lists what the **"+ Add"** form asks for.

> Legend: **(auto)** = value is auto-calculated from rate × taxable (editable). **(toggle)** = on/off switch. Money fields are ₹.

---

## Table 4 — B2B (Supplies to Registered Persons)
Section key: `b2b` · Add label: **+ Add B2B entry**

| # | Particular | Notes |
|---|------------|-------|
| 1 | GSTIN of Recipient | 15-char GSTIN |
| 2 | Invoice No. | |
| 3 | Invoice Date | |
| 4 | Invoice Value (₹) | gross invoice value |
| 5 | Place of Supply | state |
| 6 | Invoice Type | Regular / SEZ-with-payment / SEZ-without-payment / Deemed Export |
| 7 | Rate (%) | GST slab |
| 8 | Taxable Value (₹) | |
| 9 | IGST (₹) | (auto) — inter-state |
| 10 | CGST (₹) | (auto) — intra-state |
| 11 | SGST/UTGST (₹) | (auto) — intra-state |
| 12 | Reverse Charge (RCM) | (toggle) |

## Table 9A — B2BA (Amended B2B) — *own section*
Section key: `b2ba` · Add label: **+ Click here to add an amendment**

All B2B fields above **plus** the original reference:
| # | Particular | Notes |
|---|------------|-------|
| A1 | **Original Invoice No.** (being amended) | from a previously filed period |
| A2 | **Original Invoice Date** (previous period) | |

Then: Amended Invoice No., Amended Invoice Date, GSTIN, Invoice Value, Place of Supply, Invoice Type, Rate, Taxable Value, IGST, CGST, SGST.

---

## Table 5 — B2CL (Inter-state to Unregistered, > ₹1,00,000)
Section key: `b2cl` · Add label: **+ Add B2CL entry**

| # | Particular | Notes |
|---|------------|-------|
| 1 | Invoice No. | |
| 2 | Invoice Date | |
| 3 | Invoice Value (₹) | |
| 4 | Place of Supply | inter-state only (≠ your state) |
| 5 | Rate (%) | |
| 6 | Taxable Value (₹) | warns if below ₹1L → belongs in B2CS |
| 7 | IGST (₹) | (auto) — always IGST, no CGST/SGST |

## Table 9A — B2CLA (Amended B2CL) — *own section*
Section key: `b2cla` · Add label: **+ Click here to add an amendment**

B2CL fields **plus**: **Original Invoice No.**, **Original Invoice Date** (previous period).

---

## Table 7 — B2CS (Other supplies to Unregistered)
Section key: `b2cs` · Add label: **+ Add B2CS entry** · rate-wise aggregate (no invoice no.)

| # | Particular | Notes |
|---|------------|-------|
| 1 | Supply Type | INTRA (→ CGST+SGST) / INTER (→ IGST) |
| 2 | Place of Supply | |
| 3 | Rate (%) | |
| 4 | Taxable Value (₹) | |
| 5 | IGST (₹) | (auto) if INTER |
| 6 | CGST (₹) + SGST/UTGST (₹) | (auto) if INTRA |
| 7 | Cess (₹) | |

*B2CSA (amended, Table 10) has no manual form — populated from portal import.*

---

## Table 6A — EXP (Exports)
Section key: `exp` · Add label: **+ Add export entry**

| # | Particular | Notes |
|---|------------|-------|
| 1 | Export Type | WPAY (with payment) / WOPAY (without payment) |
| 2 | Invoice No. | |
| 3 | Invoice Date | |
| 4 | Invoice Value (₹) | |
| 5 | Shipping Bill No. | |
| 6 | Shipping Bill Date | |
| 7 | Port Code | e.g. INBOM4 |
| 8 | Rate (%) | |
| 9 | Taxable Value (₹) | |
| 10 | IGST (₹) | |

*EXPA (amended, Table 9A) has no manual form — populated from portal import.*

---

## Table 9B — CDNR (Credit/Debit Notes, Registered)
Section key: `cdnr` · Add label: **+ Add note**

| # | Particular | Notes |
|---|------------|-------|
| 1 | GSTIN of Recipient | |
| 2 | Note No. | |
| 3 | Note Date | |
| 4 | Note Type | Credit / Debit |
| 5 | Note Value (₹) | |
| 6 | Rate (%) | |
| 7 | Taxable Value (₹) | |
| 8 | IGST (₹) | |
| 9 | CGST (₹) | |
| 10 | SGST (₹) | |

*CDNRA (amended, Table 9C) has no manual form — populated from portal import.*

---

## Table 9B — CDNUR (Credit/Debit Notes, Unregistered)
Section key: `cdnur` · Add label: **+ Add note**

| # | Particular | Notes |
|---|------------|-------|
| 1 | UR Type | B2CL / EXPWP / EXPWOP |
| 2 | Note Type | Credit / Debit |
| 3 | Note No. | |
| 4 | Note Date | |
| 5 | Place of Supply | |
| 6 | Note Value (₹) | |
| 7 | Rate (%) | |
| 8 | Taxable Value (₹) | |
| 9 | IGST (₹) | |

*CDNURA (amended, Table 9C) has no manual form — populated from portal import.*

---

## Table 8 — NIL (Nil-rated / Exempt / Non-GST)
Section key: `nil` · **no "+ Add"** — 4 fixed supply-type rows, edited inline

Rows: Inter-state to registered, Inter-state to unregistered, Intra-state to registered, Intra-state to unregistered.
Editable per row: **Nil Rated (₹)**, **Exempt (₹)**, **Non-GST (₹)**.

---

## Table 11A — AT (Tax Liability on Advances Received)
Section key: `at` · Add label: **+ Add advance**

| # | Particular | Notes |
|---|------------|-------|
| 1 | Place of Supply | |
| 2 | Supply Type | INTRA / INTER |
| 3 | Tax Rate (%) | |
| 4 | Gross Advance Received (₹) | |
| 5 | IGST (₹) | (auto) if INTER |
| 6 | CGST (₹) + SGST/UTGST (₹) | (auto) if INTRA |

## Table 11B — TXPD (Advance Adjusted)
Section key: `txpd` · Add label: **+ Add adjustment** · same fields as AT, but field 4 is **Advance Being Adjusted (₹)**.

---

## Table 12 — HSN (HSN-wise Summary)
Section key: `hsn` · Add label: **+ Add HSN entry**

| # | Particular | Notes |
|---|------------|-------|
| 1 | HSN/SAC Code | |
| 2 | Description | |
| 3 | Unit (UQC) | NOS, KGS, etc. |
| 4 | Quantity | |
| 5 | Total Value (₹) | |
| 6 | Taxable Value (₹) | |
| 7 | IGST (₹) | |
| 8 | CGST (₹) | |
| 9 | SGST (₹) | |
| 10 | Cess (₹) | |

---

## Table 13 — DOC (Documents Issued)
Section key: `doc` · **no "+ Add"** — 6 fixed document classes, auto-computed from the invoice register, editable inline

Classes: Tax Invoice, Credit Note, Debit Note, Receipt Voucher, Delivery Challan, Payment Voucher.
Editable per class: **Serial No. From**, **Serial No. To**, **Total Count**, **Cancelled**. **Net Issued** = Total − Cancelled (auto).

---

### Amendment sections at a glance
| Amendment | Table | Manual add form? | Extra fields vs regular |
|-----------|-------|------------------|--------------------------|
| B2BA | 9A | **Yes** | Original Invoice No. + Date |
| B2CLA | 9A | **Yes** | Original Invoice No. + Date |
| B2CSA | 10 | No (import only) | Original Month |
| EXPA | 9A | No (import only) | Original Invoice No. + Date |
| CDNRA | 9C | No (import only) | Original Note No. + Date |
| CDNURA | 9C | No (import only) | Original Note No. + Date |

*Amendment sections are now their **own** drill-in sections (opened from the Overview); the parent section (e.g. B2B) shows only its regular entries.*
