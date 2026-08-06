export interface B2BItem {
  num: number;
  itm_det: {
    rt: number;
    txval: number;
    iamt?: number;
    camt?: number;
    samt?: number;
    csamt?: number;
  };
}

export interface B2BInvoice {
  id: string;
  ctin: string;
  inv_typ: 'R' | 'SEWP' | 'SEWOP' | 'DE' | 'CBW';
  inum: string;
  idt: string; // DD-MM-YYYY
  val: number;
  pos: string;
  rchrg: 'Y' | 'N';
  diff_percent?: number;   // applicable % of tax rate (differential)
  itms: B2BItem[];
  isAmended?: boolean;
  origInvNum?: string;
  origInvDt?: string;
}

export interface B2CLInvoice {
  id: string;
  inum: string;
  idt: string; // DD-MM-YYYY
  val: number;
  pos: string;
  itms: B2BItem[];
  isAmended?: boolean;
  origInvNum?: string;
  origInvDt?: string;
}

export interface B2CSSummary {
  id: string;
  sply_ty: 'INTRA' | 'INTER';
  typ?: 'OE' | 'E';      // GSTN required: OE = ordinary, E = via e-commerce operator. Gen defaults 'OE'.
  etin?: string;         // e-com operator GSTIN — required when typ === 'E'
  pos: string;
  rt: number;
  txval: number;
  iamt?: number;
  camt?: number;
  samt?: number;
  csamt?: number;
  diff_percent?: number;
  isAmended?: boolean;
  omon?: string;         // B2CSA: original month (MMYYYY) being amended
}

export interface EXPInvoice {
  id: string;
  exp_typ: 'WPAY' | 'WOPAY';
  inum: string;
  idt: string;
  val: number;
  sbnum?: string;
  sbdt?: string;
  sbpcode?: string;
  itms: Array<{ txval: number; rt: number; iamt?: number; csamt?: number }>;
  isAmended?: boolean;
  origInvNum?: string;   // EXPA: oinum — original invoice being amended
  origInvDt?: string;    // EXPA: oidt
}

export interface CDNRNote {
  id: string;
  ctin: string;
  ntty: 'C' | 'D';
  nt: Array<{
    ntnum: string;
    ntdt: string; // DD-MM-YYYY
    val: number;
    pos?: string;                                         // Place of Supply
    inv_typ?: 'R' | 'DE' | 'SEWP' | 'SEWOP' | 'CBW';      // note supply type
    rchrg?: 'Y' | 'N';                                    // reverse charge
    p_gst?: 'Y' | 'N';                                    // pre-GST-regime note
    ont_num?: string;                                     // CDNRA: original note number being amended
    ont_dt?: string;                                      // CDNRA: original note date
    itms: B2BItem[];
  }>;
  isAmended?: boolean;
}

export interface CDNURNote {
  id: string;
  ntty: 'C' | 'D';
  typ: 'B2CL' | 'EXPWP' | 'EXPWOP';
  ntnum: string;
  ntdt: string;
  val: number;
  pos: string;
  inv_typ?: 'R' | 'DE' | 'SEWP' | 'SEWOP' | 'CBW';        // note supply type
  p_gst?: 'Y' | 'N';                                      // pre-GST-regime note
  ont_num?: string;                                       // CDNURA: original note number being amended
  ont_dt?: string;                                        // CDNURA: original note date
  itms: B2BItem[];
  isAmended?: boolean;
}

export interface NilSummary {
  id: string;
  sply_ty: 'INTRB2B' | 'INTRB2C' | 'INTRAB2B' | 'INTRAB2C';
  nil_amt: number;
  expt_amt: number;
  ngsup_amt: number;
}

export interface ATAdvance {
  id: string;
  pos: string;
  sply_ty: 'INTRA' | 'INTER';
  itms: Array<{ rt: number; ad_amt: number; iamt?: number; camt?: number; samt?: number; csamt?: number }>;
}

export interface TXPDAdjustment {
  id: string;
  pos: string;
  sply_ty: 'INTRA' | 'INTER';
  itms: Array<{ rt: number; ad_amt: number; iamt?: number; camt?: number; samt?: number; csamt?: number }>;
}

// Advance amendments (Table 11(II)) — an AT/TXPD row amended for a prior month.
// Identical shape to AT/TXPD plus `omon` (the original MMYYYY being amended).
export interface ATAAmendment {
  id: string;
  omon: string;          // original month (MMYYYY) being amended
  pos: string;
  sply_ty: 'INTRA' | 'INTER';
  itms: Array<{ rt: number; ad_amt: number; iamt?: number; camt?: number; samt?: number; csamt?: number }>;
}

export interface TXPDAAmendment {
  id: string;
  omon: string;          // original month (MMYYYY) being amended
  pos: string;
  sply_ty: 'INTRA' | 'INTER';
  itms: Array<{ rt: number; ad_amt: number; iamt?: number; camt?: number; samt?: number; csamt?: number }>;
}

export interface HSNSummary {
  id: string;
  num: number;
  hsn_sc: string;
  desc: string;
  user_desc?: string;   // free-text description the CA enters (GSTN `user_desc`)
  uqc: string;
  qty: number;
  val: number;
  txval: number;
  rt?: number;                    // tax rate — GSTN HSN schema is rate-wise (required per row)
  supplyClass?: 'B2B' | 'B2C';    // routes the row into hsn_b2b vs hsn_b2c (defaults B2C)
  iamt: number;
  camt: number;
  samt: number;
  csamt: number;
}

export interface DocIssueDoc {
  id: string;
  doc_num: number;
  docs: Array<{
    num: number;
    from: string;
    to: string;
    totnum: number;
    cancel: number;
    net_issue: number;
  }>;
}

export interface GSTR1Filing {
  id: string;
  company_id: string;
  period: string; // MMYYYY
  gstin: string;
  status: 'draft' | 'validated' | 'filed';
  created_at: string;
  updated_at: string;
  // Regular sections (b2b/b2cl/b2cs = manual only; auto rows computed live from books)
  b2b: B2BInvoice[];
  b2cl: B2CLInvoice[];
  b2cs: B2CSSummary[];
  exp: EXPInvoice[];
  cdnr: CDNRNote[];
  cdnur: CDNURNote[];
  nil: NilSummary[];
  at: ATAdvance[];
  txpd: TXPDAdjustment[];
  hsn: HSNSummary[];
  doc_issue: DocIssueDoc[];
  // Amendment sections
  b2ba: B2BInvoice[];
  b2cla: B2CLInvoice[];
  b2csa: B2CSSummary[];
  expa: EXPInvoice[];
  cdnra: CDNRNote[];
  cdnura: CDNURNote[];
  ata?: ATAAmendment[];      // advance-received amendments (Table 11(II))
  txpda?: TXPDAAmendment[];  // advance-adjusted amendments
  // Table 14/15 — supplies through e-commerce operators.
  supeco?: { clttx: SupecoTx[]; paytx: SupecoTx[] };
  // RCM overrides: entry id → 'Y'|'N' (for toggling RCM on auto-populated rows)
  rcm_overrides: Record<string, 'Y' | 'N'>;
  // Return-level aggregate turnover — CA must enter actual values; do NOT file with an estimate.
  gt?: number;      // gross turnover of the previous financial year
  cur_gt?: number;  // turnover for April to the current return period
  // Post-filing record — set once GSTN returns an ARN. Its presence LOCKS the period
  // (fully read-only) and survives reload/navigation. Amendments go to future periods.
  filed?: {
    arn: string;
    filedAt: string;   // ISO timestamp
    bodyHash: string;  // content hash of the filed return
  };
}

// ── Table 14/15 — supplies through an e-commerce operator (supeco) ──
// clttx = supplies on which the ECO collects tax (u/s 52); paytx = supplies on
// which the ECO pays tax (u/s 9(5)). One row per operator GSTIN (etin).
export interface SupecoTx {
  id: string;
  etin: string;      // e-commerce operator GSTIN
  suppval: number;   // net value of supplies
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

export type Gstr1Section = 'b2b' | 'b2cl' | 'b2cs' | 'exp' | 'cdnr' | 'cdnur' | 'nil' | 'at' | 'txpd' | 'hsn' | 'doc_issue';
