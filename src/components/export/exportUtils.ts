import { formatIndianCurrency } from '@/lib/utils/currencyFormat';

export interface ExportColumn {
  header: string;
  key: string;
  align?: 'left' | 'right' | 'center';
}

/** Statement header details prepended to CSV / Excel exports. */
export interface ExportMeta {
  companyName: string;
  title: string;
  dateRange: string;
  entityType?: string;
}

/** Blank cells print as a plain dash — never an empty hole. */
const dash = (val: unknown): unknown => (val == null || val === '' ? '-' : val);

/** Compact official mark, bottom-right of every PDF page: "CA Studio" over the
 *  download date-time. Two tiny lines tucked into the bottom margin. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addCaStudioMark(doc: any) {
  const now = new Date();
  const stamp = `${now.toLocaleDateString('en-IN')} · ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    doc.text('Yukti 360', w - 8, h - 7, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(150, 150, 150);
    doc.text(stamp, w - 8, h - 4, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }
}

export async function exportToPDF(
  title: string,
  companyName: string,
  entityType: string,
  dateRange: string,
  columns: ExportColumn[],
  data: Record<string, any>[],
  options?: {
    orientation?: 'portrait' | 'landscape';
    includeSignatureBlock?: boolean;
    footerText?: string;
  }
) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF(options?.orientation || 'portrait');

  // The built-in Helvetica has no ₹ glyph (it printed as rubbish), so the
  // symbol reads "Rs" in the PDF: "Rs 1,00,000.00", "(Rs)" in the headings.
  const pdfText = (s: string) => s.replace(/₹\s*(?=\d)/g, 'Rs ').replace(/₹/g, 'Rs');

  // HEADER — clean professional type: company, entity, statement, as-on date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(pdfText(companyName), 14, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Entity: ${entityType}`, 14, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(pdfText(title), 14, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(pdfText(dateRange), 14, 38);

  // TABLE - CRITICAL: JE-XXXX codes are NEVER included
  autoTable(doc, {
    startY: 42,
    head: [columns.map(c => pdfText(c.header))],
    body: data.map(row => columns.map(c => {
      const val = row[c.key];
      if (typeof val === 'number') return pdfText(formatIndianCurrency(val));
      return (val == null || val === '') ? '-' : pdfText(String(val));
    })),
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2 },
    headStyles: {
      fillColor: [249, 250, 251],
      textColor: [17, 24, 39],
      fontStyle: 'bold',
    },
    columnStyles: Object.fromEntries(
      columns.map((c, i) => [i, { halign: (c.align || 'left') as 'left' | 'right' | 'center' }])
    ),
  });

  // FOOTER — page numbers left, CA Studio mark bottom-right
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
  }
  addCaStudioMark(doc);

  // SIGNATURE BLOCK
  if (options?.includeSignatureBlock) {
    const lastPage = doc.getNumberOfPages();
    doc.setPage(lastPage);
    const y = doc.internal.pageSize.height - 30;
    doc.setFontSize(9);
    doc.text('Director', 20, y);
    doc.text('Director', doc.internal.pageSize.width / 2 - 15, y);
    doc.text('Chartered Accountant', doc.internal.pageSize.width - 60, y);
  }

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

export async function exportToExcel(
  title: string,
  columns: ExportColumn[],
  data: Record<string, any>[],
  sheetName?: string,
  meta?: ExportMeta,
) {
  const XLSX = await import('xlsx');

  const aoa: unknown[][] = [];
  if (meta) {
    aoa.push([meta.companyName]);
    if (meta.entityType) aoa.push([`Entity: ${meta.entityType}`]);
    aoa.push([meta.title]);
    aoa.push([meta.dateRange]);
    aoa.push([]);
  }
  aoa.push(columns.map(c => c.header));
  data.forEach(row => aoa.push(columns.map(c => dash(row[c.key]))));

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Sheet1');
  XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}.xlsx`);
}

export function exportToCSV(
  columns: ExportColumn[],
  data: Record<string, any>[],
  filename: string,
  meta?: ExportMeta,
) {
  // RFC 4180: quote fields containing commas, quotes, or line breaks; double embedded quotes.
  const esc = (val: unknown): string => {
    if (val == null) return '';
    const s = String(val);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const metaLines = meta
    ? [esc(meta.companyName), meta.entityType ? esc(`Entity: ${meta.entityType}`) : null, esc(meta.title), esc(meta.dateRange), '']
        .filter((l): l is string => l !== null)
        .join('\n') + '\n'
    : '';
  const headers = columns.map(c => esc(c.header)).join(',');
  const rows = data.map(row =>
    columns.map(c => esc(dash(row[c.key]))).join(',')
  ).join('\n');
  const csv = '\uFEFF' + metaLines + headers + '\n' + rows; // BOM for Excel UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Image-based PDF export for complex layouts (e.g. Cash Book T-format)
export async function exportElementAsImagePDF(options: {
  element: HTMLElement | null;
  title: string;
  orientation?: 'portrait' | 'landscape';
}) {
  const { element, title, orientation } = options;
  if (!element) return;

  // Ensure the element is in the viewport so html2canvas captures the rendered content.
  element.scrollIntoView({ block: 'start', inline: 'nearest' });
  await new Promise(resolve => setTimeout(resolve, 150));

  // html2canvas-pro: fork with modern CSS color support (oklch/lab/color()) —
  // the original html2canvas crashes on Tailwind v4's oklch colors.
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas-pro'),
  ]);

  // Mark the root so onclone can find it in the cloned document.
  element.setAttribute('data-export-root', '1');
  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      // In the printed statement, editable cells must look like print: replace
      // every input/select with its plain value — or a simple "-" when blank.
      // No boxes, borders or decoration survive into the PDF.
      onclone: (clonedDoc: Document) => {
        try {
          const root = clonedDoc.querySelector('[data-export-root="1"]');
          if (!root) return;
          root.querySelectorAll('input, select').forEach((el) => {
            try {
              const raw = el.tagName === 'SELECT'
                ? ((el as HTMLSelectElement).selectedOptions?.[0]?.text ?? '')
                : ((el as HTMLInputElement).value ?? '');
              const span = clonedDoc.createElement('span');
              span.textContent = raw && raw.trim() !== '' ? raw : '-';
              span.style.cssText =
                'display:block;width:100%;text-align:right;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;' +
                'font-size:13px;color:#374151;background:transparent;border:none;padding:2px 0;';
              el.replaceWith(span);
            } catch { /* leave this control as-is rather than break the export */ }
          });
        } catch { /* never let print-cleanup kill the export */ }
      },
    });
  } finally {
    element.removeAttribute('data-export-root');
  }

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF(orientation || 'landscape');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 10;
  const imgWidth = pageWidth - margin * 2;

  // Convert canvas pixels to PDF units using a constant scale factor.
  // This lets us slice the canvas into exact "page chunks" and avoids row cutting artifacts.
  const scale = imgWidth / canvas.width; // PDFUnits per canvas pixel
  const usableHeight = pageHeight - margin * 2; // PDFUnits
  const pageHeightPx = Math.max(1, Math.floor(usableHeight / scale)); // canvas px per PDF page

  let yPx = 0;
  let page = 0;
  while (yPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - yPx);

    // Create a sliced canvas and render just that portion.
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeightPx;
    const ctx = sliceCanvas.getContext('2d');
    if (!ctx) break;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      yPx,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx,
    );

    const sliceData = sliceCanvas.toDataURL('image/png');

    if (page > 0) pdf.addPage();
    const sliceHeightPdf = sliceHeightPx * scale;
    pdf.addImage(sliceData, 'PNG', margin, margin, imgWidth, sliceHeightPdf);

    yPx += sliceHeightPx;
    page += 1;
  }

  addCaStudioMark(pdf);
  pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
}
