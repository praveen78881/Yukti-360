/**
 * Full-detail annual GSTR-1 export.
 *
 * Pulls every filed document of every month in a financial year and writes ONE
 * SHEET PER MONTH, each listing every document with its party, GSTIN, document
 * number/date, place of supply, rate and the full tax split — plus an "Annual
 * Summary" sheet at the front.
 *
 * This is document-level detail (from the per-section GSTR-1 endpoints), not the
 * section totals — so the workbook carries names, doc numbers and every figure.
 */

import { fetchGstr1MonthDetail, ALL_GSTR1_SECTIONS, type FiledSection, type FiledRow } from './gstr1FiledDetail';
import { fyPeriods } from './gstr1Portal';
import { isOnOrAfterRegistration } from './period';

interface MonthTotals { taxable: number; igst: number; cgst: number; sgst: number; cess: number; val: number }
interface GrandTotals { docs: number; taxable: number; igst: number; cgst: number; sgst: number; cess: number; val: number }

export interface AnnualExportProgress {
  done: number;
  total: number;
  label: string;
}

/** One flat spreadsheet line — every column a CA expects to see. */
function toSheetRow(section: FiledSection, r: FiledRow): Record<string, string | number> {
  return {
    Section: section.label,
    'Party / GSTIN': r.party ?? '',
    'Doc No': r.doc ?? '',
    'Doc Date': r.date ?? '',
    Type: r.type ?? '',
    'Place of Supply': r.pos ?? '',
    'Rate %': r.rate ?? '',
    'Taxable Value': r.taxable ?? 0,
    IGST: r.igst ?? 0,
    CGST: r.cgst ?? 0,
    SGST: r.sgst ?? 0,
    Cess: r.cess ?? 0,
    'Invoice Value': r.value ?? 0,
    // HSN-summary rows
    HSN: r.hsn ?? '',
    Description: r.desc ?? '',
    UQC: r.uqc ?? '',
    Qty: r.qty ?? '',
    // amendment rows
    'Original Doc No': r.odoc ?? '',
    'Original Doc Date': r.odate ?? '',
    // NIL-rated row buckets
    'Nil Rated': r.nilAmt ?? '',
    Exempted: r.exptAmt ?? '',
    'Non-GST': r.ngsupAmt ?? '',
    // document-issued series
    'Series From': r.from ?? '',
    'Series To': r.to ?? '',
    'Total Docs': r.totnum ?? '',
    Cancelled: r.cancel ?? '',
    Net: r.net ?? '',
  };
}

/**
 * Fetch a whole FY of filed GSTR-1 documents and save an .xlsx.
 * Requires a live taxpayer session (portal read, ~13 calls per month).
 */
export async function exportGstr1YearDetailExcel(opts: {
  gstin: string;
  companyName?: string;
  fyStartYear: number;
  sessionToken: string;
  /** Skip months before the GSTIN existed. */
  registrationDate?: string | null;
  onProgress?: (p: AnnualExportProgress) => void;
}): Promise<{ ok: boolean; months: number; rows: number; error?: string }> {
  const { gstin, companyName, fyStartYear, sessionToken, onProgress } = opts;
  const XLSX = await import('xlsx');
  // Months before the GSTIN was registered have no return — skip them entirely.
  const months = fyPeriods(fyStartYear)
    .filter((m) => isOnOrAfterRegistration(m.period, opts.registrationDate));
  const fyLabel = `${fyStartYear}-${String((fyStartYear + 1) % 100).padStart(2, '0')}`;

  const wb = XLSX.utils.book_new();
  const summary: Record<string, string | number>[] = [];
  let totalRows = 0;
  let monthsWithData = 0;

  for (const [i, m] of months.entries()) {
    onProgress?.({ done: i, total: months.length, label: m.label });
    let sections: FiledSection[] = [];
    try {
      sections = await fetchGstr1MonthDetail(m.year, m.month, sessionToken, ALL_GSTR1_SECTIONS, 'gstr1');
    } catch {
      summary.push({ Month: m.label, Sections: 0, Documents: 0, Taxable: 0, IGST: 0, CGST: 0, SGST: 0, Cess: 0, 'Invoice Value': 0, Status: 'Could not read' });
      continue;
    }

    const rows = sections.flatMap((s) => s.rows.map((r) => toSheetRow(s, r)));
    const tot = rows.reduce<MonthTotals>(
      (a, r) => ({
        taxable: a.taxable + (Number(r['Taxable Value']) || 0),
        igst: a.igst + (Number(r.IGST) || 0),
        cgst: a.cgst + (Number(r.CGST) || 0),
        sgst: a.sgst + (Number(r.SGST) || 0),
        cess: a.cess + (Number(r.Cess) || 0),
        val: a.val + (Number(r['Invoice Value']) || 0),
      }),
      { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0, val: 0 },
    );

    summary.push({
      Month: m.label,
      Sections: sections.length,
      Documents: rows.length,
      Taxable: tot.taxable,
      IGST: tot.igst,
      CGST: tot.cgst,
      SGST: tot.sgst,
      Cess: tot.cess,
      'Invoice Value': tot.val,
      Status: rows.length ? 'Filed — data' : 'Nil / no data',
    });

    totalRows += rows.length;
    if (rows.length) monthsWithData++;

    // One sheet per month — always added, so an empty month is visible too.
    const head = [[`${companyName ?? ''}  ·  GSTIN ${gstin}`], [`GSTR-1 — ${m.label} (FY ${fyLabel})`], []];
    const ws = XLSX.utils.aoa_to_sheet(head);
    if (rows.length) XLSX.utils.sheet_add_json(ws, rows, { origin: -1 });
    else XLSX.utils.sheet_add_aoa(ws, [['No documents filed for this month.']], { origin: -1 });
    XLSX.utils.book_append_sheet(wb, ws, m.label.slice(0, 31));
  }

  onProgress?.({ done: months.length, total: months.length, label: '' });

  // Annual summary goes first.
  const grand = summary.reduce<GrandTotals>(
    (a, r) => ({
      docs: a.docs + (Number(r.Documents) || 0),
      taxable: a.taxable + (Number(r.Taxable) || 0),
      igst: a.igst + (Number(r.IGST) || 0),
      cgst: a.cgst + (Number(r.CGST) || 0),
      sgst: a.sgst + (Number(r.SGST) || 0),
      cess: a.cess + (Number(r.Cess) || 0),
      val: a.val + (Number(r['Invoice Value']) || 0),
    }),
    { docs: 0, taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0, val: 0 },
  );
  summary.push({
    Month: 'TOTAL', Sections: '', Documents: grand.docs, Taxable: grand.taxable,
    IGST: grand.igst, CGST: grand.cgst, SGST: grand.sgst, Cess: grand.cess,
    'Invoice Value': grand.val, Status: '',
  });

  const sHead = [
    [companyName ?? ''],
    [`GSTIN: ${gstin}`],
    [`GSTR-1 — Annual detail, FY ${fyLabel}`],
    [`Generated: ${new Date().toLocaleString('en-IN')}`],
    [],
  ];
  const sws = XLSX.utils.aoa_to_sheet(sHead);
  XLSX.utils.sheet_add_json(sws, summary, { origin: -1 });
  // Put the summary at the front of the workbook.
  wb.SheetNames.unshift('Annual Summary');
  wb.Sheets['Annual Summary'] = sws;

  XLSX.writeFile(wb, `GSTR1_${gstin}_FY${fyLabel}_detail.xlsx`);
  return { ok: true, months: monthsWithData, rows: totalRows };
}
