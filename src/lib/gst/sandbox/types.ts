// Shared types for the Sandbox GST download feature (GSTR-2A / 2B).

export type GstReturnType = 'GSTR2A' | 'GSTR2B';

/** One flattened invoice/note line, normalised across 2A and 2B sections. */
export interface GstInvoiceRow {
  section: string;        // B2B, B2BA, CDNR, CDN, ISD, IMPG, IMPGSEZ, TCS, TDS…
  supplierGstin: string;  // ctin (blank for IMPG bill-of-entry rows)
  supplierName: string;   // trade/legal name if present
  docNo: string;          // invoice / note / bill-of-entry number
  docDate: string;        // as returned (dd-mm-yyyy)
  docType: string;        // R / SEZWP / note type, etc.
  pos: string;            // place of supply (state code/name)
  reverseCharge: string;  // Y / N
  invoiceValue: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  itcAvailable?: string;  // 2B only — Y / N
  itcReason?: string;     // 2B only — reason ITC is unavailable
}

/** GSTR-2B ITC summary (itcsumm) headline numbers, when present. */
export interface ItcSummary {
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  total: number;
}

/** What we persist per (company, type, period) in entity_data. */
export interface GstDownloadRecord {
  type: GstReturnType;
  period: string;         // MMYYYY
  gstin: string;
  rows: GstInvoiceRow[];
  itcSummary: ItcSummary | null;
  noData: boolean;        // true when the portal returned an empty period
  raw: unknown;           // untouched API JSON (source of truth / re-parse)
  fetchedAt: string;      // ISO timestamp of the download
}
