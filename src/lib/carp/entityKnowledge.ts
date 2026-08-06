// ============================================================================
// Entity-wise domain knowledge for the CARP AI ("Aleza").
//
// buildEntityKnowledge(entityType) returns an India-specific knowledge block
// tailored to the current entity — the statutory profile (ITR form, tax rate,
// audit form/threshold, statement format), the equity/capital structure, and
// the integration model that lets one data entry inform every other module
// (accounting → GST → ITR → TDS/TCS → audit). It is appended to the CARP system
// prompt so the assistant reasons with the right rules for THIS entity.
//
// Rates/thresholds are common defaults; the Finance Act changes them yearly, so
// the AI is instructed to cite the section and confirm the current-year figure
// rather than treat any percentage here as immutable.
// ============================================================================

import { getEntityConfig } from '@/lib/entityConfig';

type EntityFamily = 'individual' | 'firm' | 'company' | 'npo' | 'aggregate';

const FAMILY_BY_TYPE: Record<string, EntityFamily> = {
  individual: 'individual',
  sole_proprietorship: 'individual',
  huf: 'individual',
  partnership: 'firm',
  llp: 'firm',
  opc: 'company',
  pvt_ltd: 'company',
  public_ltd: 'company',
  section8: 'company',
  trust: 'npo',
  society: 'npo',
  aop_boi: 'aggregate',
  cooperative: 'aggregate',
};

// ── Per-family statutory + accounting profile ────────────────────────────────

function familyKnowledge(family: EntityFamily): string {
  switch (family) {
    case 'individual':
      return `INDIVIDUAL / PROPRIETARY / HUF PROFILE
- Financial statements: TRADITIONAL format (T-form Balance Sheet + P&L). No Companies Act Schedule III.
- Equity/capital: a single "Proprietor's Capital" (sole prop / individual) or "Karta's Capital" (HUF) account. Drawings reduce capital. There is NO share capital and NO partners' capital.
- Income tax: taxed at INDIVIDUAL SLAB rates (old regime with deductions vs new regime u/s 115BAC — the CA chooses). Business/profession income is computed and added to the person's other heads (salary, house property, capital gains, other sources).
- Presumptive schemes: Sec 44AD (small business, 6%/8% of turnover), Sec 44ADA (professionals, 50% of gross receipts), Sec 44AE (goods carriage). If opted, detailed books/audit may not be required.
- Tax audit u/s 44AB: business turnover > ₹1 crore (₹10 crore if cash receipts & payments ≤ 5%), or professional gross receipts > ₹50 lakh. Audit report Form 3CB + 3CD.
- Common ITR: ITR-4 (presumptive), ITR-3 (regular business/profession), ITR-2 (no business income), ITR-1 (simple salaried).`;

    case 'firm':
      return `PARTNERSHIP FIRM / LLP PROFILE
- Financial statements: TRADITIONAL format. No Companies Act Schedule III.
- Equity/capital: one "Partners' Capital" (and optional Current) account PER PARTNER; a Profit & Loss Appropriation Account distributes profit as interest on capital, partner remuneration/salary, and residual profit share. NO share capital.
- Partner remuneration & interest limits — Sec 40(b): interest on capital deductible up to 12% p.a.; working-partner remuneration deductible up to the 40(b) slab (on book profit). Excess is disallowed.
- Income tax: firm/LLP taxed at a FLAT 30% + surcharge + cess. Partner's share of firm profit is EXEMPT in the partner's hands u/s 10(2A) (avoid double taxation); interest/remuneration received by a partner IS taxable as their business income.
- LLP: no Alternate Minimum Tax relief nuances aside, AMT u/s 115JC can apply. LLP files Form 8 (Statement of Account & Solvency) and Form 11 (Annual Return) with the MCA; a firm does not.
- Tax audit u/s 44AB thresholds as for business (₹1 cr / ₹10 cr cash-limited). LLP statutory audit if turnover > ₹40 lakh or contribution > ₹25 lakh.
- ITR-5.`;

    case 'company':
      return `COMPANY (Pvt Ltd / Public Ltd / OPC / Section 8) PROFILE
- Financial statements: COMPANIES ACT 2013 SCHEDULE III is MANDATORY (Balance Sheet + Statement of P&L in the prescribed format, with notes). Ind AS or Indian GAAP as applicable.
- Equity: "Share Capital" (authorised/issued/subscribed/paid-up) + "Reserves & Surplus" (securities premium, general reserve, retained earnings/surplus). NO partners'/proprietor's capital.
- Statutory audit under the Companies Act is MANDATORY regardless of turnover; auditor appointed u/s 139, report u/s 143. Tax audit u/s 44AB additionally if turnover crosses the threshold (Form 3CA + 3CD, since accounts are already audited under another law).
- Income tax: domestic company rates — 25% if turnover ≤ ₹400 cr (else 30%); concessional 22% u/s 115BAA (no incentives) or 15% u/s 115BAB (new manufacturing). MAT u/s 115JB at 15% of book profit (not applicable if 115BAA/115BAB opted). Surcharge + 4% cess apply.
- ROC compliance: AOC-4 (financials, within 30 days of AGM), MGT-7/MGT-7A (annual return, 60 days), ADT-1 (auditor, 15 days), DIR-3 KYC, DPT-3, MSME-1, board meetings (Sec 173, min 4/yr), AGM (Sec 96, by 30 Sep). OPC has relaxations (no AGM; MGT-7A).
- Section 8 (non-profit company): same Schedule III + audit, but charitable object; also 12A/80G registration for tax exemption like a trust.
- ITR-6 (ITR-7 if Section 8 claims exemption u/s 11).`;

    case 'npo':
      return `TRUST / SOCIETY (NON-PROFIT) PROFILE
- Financial statements: INCOME & EXPENDITURE Account + RECEIPTS & PAYMENTS Account + Balance Sheet (fund-based). Not a trading P&L; surplus/deficit, not profit.
- Funds: Corpus Fund, General Fund, earmarked/restricted funds; "Fund Accounts", not capital or share capital.
- Registration: 12A/12AB (income exemption u/s 11–13) and 80G (donor deduction). FCRA registration if foreign contributions are received (FCRA register + FC-4).
- 85% application rule: at least 85% of income must be applied to charitable purposes in the year; shortfall can be accumulated u/s 11(2) (Form 10) or deemed applied (Form 9A).
- Audit: Form 10B (or 10BB) where total income before exemption exceeds the basic exemption limit; audit report filed before the ITR due date.
- ITR-7.`;

    case 'aggregate':
      return `AOP / BOI / COOPERATIVE SOCIETY PROFILE
- Financial statements: TRADITIONAL format (Income & Expenditure or P&L as relevant), not Schedule III.
- AOP/BOI income tax: taxed at slab or maximum marginal rate depending on whether members' shares are determinate and whether any member is taxed at MMR. Members' share treatment per Sec 67A / 86.
- Cooperative society: special slab (10%/20%/30% bands) or concessional 22% u/s 115BAD / 15% u/s 115BAE (new manufacturing co-ops); AMT u/s 115JC may apply. Deduction u/s 80P for eligible cooperative activities.
- Audit as applicable under the governing Act and Sec 44AB.
- ITR-5.`;
  }
}

// ── Shared India tax/compliance cheat-sheets (all entities) ───────────────────

const SHARED_CHEATSHEET = `INTEGRATED DOMAIN KNOWLEDGE (India) — cite the section; confirm the current-year rate before asserting a percentage.

GST
- Intra-state supply → CGST + SGST (split equally); inter-state → IGST. Place of supply drives this.
- Common rates: 0% (exempt/nil), 5%, 12%, 18%, 28% (+ cess on demerit goods). Composition scheme for small taxpayers.
- Reverse charge (RCM) u/s 9(3)/9(4): recipient pays GST (e.g. GTA, legal, import of services). Post RCM liability AND the corresponding ITC.
- Blocked ITC u/s 17(5): motor vehicles (with exceptions), personal consumption, works contract for immovable property, etc. — no input credit.
- Returns: GSTR-1 (outward supplies, 11th of next month), GSTR-3B (summary + payment, 20th), GSTR-9/9C (annual, 31 Dec of next FY).

TDS (deductor's obligation; deposit by 7th of next month, Q4 salary by 30 Apr; returns 24Q salary / 26Q resident / 27Q non-resident, quarterly)
- 192 salary (average slab rate), 194A interest, 194C contractor (1% ind/HUF, 2% others), 194H commission/brokerage, 194I rent (2% plant & machinery, 10% land/building), 194J professional/technical (10%, or 2% for technical/call-centre), 194Q purchase of goods > ₹50 lakh (0.1%), 195 payments to non-residents. Lower/nil deduction via Form 13; PAN not furnished → higher rate u/s 206AA.

TCS (collector's obligation)
- 206C(1) scrap/timber/minerals etc.; 206C(1H) sale of goods > ₹50 lakh (0.1%); 206C(1G) foreign remittance/overseas tour. Interplay: 194Q (buyer) vs 206C(1H) (seller) — buyer's TDS takes precedence.

DEPRECIATION
- Companies Act 2013 Schedule II: useful-life based; choose SLM or WDV. Residual value typically 5%.
- Income Tax Act Sec 32: BLOCK-OF-ASSETS, WDV method only. Typical blocks — Building 10%, Furniture 10%, Plant & Machinery 15%, Motor vehicles 15%, Computers & software 40%. Half-year rule: asset used < 180 days in year of purchase gets half depreciation.
- Keep the two depreciation figures separate: books (Schedule II) vs tax (Sec 32); the difference drives Deferred Tax (AS 22 / Ind AS 12).`;

const INTEGRATION_MODEL = `ONE ENTRY, KNOWN EVERYWHERE — THE INTEGRATION PROMISE
This software is a single integrated book of record. When the CA enters a transaction ONCE (a journal entry, an invoice, a bank line), it must inform every dependent module — you should reason and act across them, not treat pages as silos:
- A sales/purchase entry with GST → flows to the GST registers, GSTR-1 / GSTR-3B / ITC, the debtor/creditor ledgers, and the Trading/P&L.
- A payment/expense with TDS (tds_section/tds_rate on the line) → flows to the TDS register and the party ledger; a receipt/sale with TCS → the TCS register.
- All journal entries → Trial Balance → Trading/P&L → Balance Sheet → Cash Flow → Ratios, computed LIVE (no manual closing entries; net profit is carried to Capital/Reserves automatically).
- Book profit → feeds Taxable Income (after Schedule III/tax adjustments) → the ITR working for this entity's ITR form.
- The same data underpins the audit checklists (44AB / CARO / Form 10B) and the compliance calendar.
When asked to "fill" a downstream page, prefer to DERIVE it from the underlying entries/data already captured, rather than asking the CA to re-enter it. Read the source, compute, write the target, verify.`;

/**
 * Build the entity-specific knowledge block appended to the CARP system prompt.
 */
export function buildEntityKnowledge(entityType: string): string {
  let label = entityType;
  let itrForm = '';
  let taxAuditForm = '';
  let plFormat = '';
  let bsFormat = '';
  try {
    const cfg = getEntityConfig(entityType);
    label = cfg.label;
    itrForm = cfg.itrForm;
    taxAuditForm = cfg.taxAuditForm;
    plFormat = cfg.nav.profitLossFormat;
    bsFormat = cfg.nav.balanceSheetFormat;
  } catch {
    /* unknown entity — fall back to generic knowledge */
  }

  const family = FAMILY_BY_TYPE[entityType] ?? 'individual';

  const essentials = [
    `Entity type: ${label}`,
    itrForm ? `Income-tax return form: ${itrForm}` : '',
    taxAuditForm ? `Tax-audit report form: ${taxAuditForm}` : '',
    plFormat ? `P&L format: ${plFormat === 'schedule_iii' ? 'Companies Act Schedule III' : 'Traditional'}` : '',
    bsFormat ? `Balance Sheet format: ${bsFormat === 'schedule_iii' ? 'Companies Act Schedule III' : 'Traditional'}` : '',
  ].filter(Boolean).join('\n- ');

  return `
═══════════════════════════════════════════
ENTITY-WISE KNOWLEDGE — REASON WITH THE RULES FOR THIS ENTITY
═══════════════════════════════════════════
- ${essentials}

${familyKnowledge(family)}

${INTEGRATION_MODEL}

${SHARED_CHEATSHEET}`;
}
