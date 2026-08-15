/**
 * Bank Statement CSV/Excel Parser
 *
 * Reads any Indian bank's downloaded statement (CSV / XLS / XLSX), auto-detects
 * the header row and columns, extracts payee from narration (UPI/NEFT/IMPS/
 * RTGS/ATM/POS/CHQ) and detects payment mode.
 *
 * Banks lay out the amount in three different ways, and all three are supported:
 *   1. TWO COLUMNS   — separate Withdrawal/Deposit (HDFC, ICICI, SBI, Yes)
 *   2. AMOUNT + TYPE — one Amount column plus a Dr/Cr indicator (Axis, Kotak, PNB)
 *   3. SIGNED AMOUNT — one Amount column, debits negative (many exports/aggregators)
 *
 * Column matching is TOKEN-based, not substring-based: naive `includes()` made
 * "Description" match the credit alias "cr" and a combined "DR/CR" column match
 * both debit and credit, which silently zeroed every row.
 */

import * as XLSX from 'xlsx';
import type { BankTransaction, ImportBatch, PaymentMode } from './types';

/** One spreadsheet cell as read: text, a number, or a real date cell. */
type Cell = string | number | Date;

// ── Column detection ──────────────────────────────────────────────────────────

/** Header text → comparable tokens. "Withdrawal Amt.(INR)" → ["withdrawal","amt","inr"] */
function tokenize(header: string): string[] {
  return String(header ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/**
 * An alias matches when EVERY one of its words appears as a whole token in the
 * header. Multi-word aliases therefore score higher than single-word ones, and
 * "cr" no longer matches "description".
 */
function aliasScore(tokens: string[], alias: string): number {
  const words = alias.split(' ');
  if (!words.every((w) => tokens.includes(w))) return 0;
  return words.length * 10 + (tokens.length === words.length ? 5 : 0);
}

interface ColSpec {
  /** Aliases, best-first. Whole-token match only. */
  aliases: string[];
  /** Header tokens that disqualify a column outright. */
  reject?: string[];
}

const DATE_COL: ColSpec = {
  aliases: ['transaction date', 'txn date', 'tran date', 'posting date', 'post date', 'book date', 'date', 'value date', 'value dt', 'dt'],
  reject: ['due'],
};
const NARRATION_COL: ColSpec = {
  aliases: ['transaction remarks', 'tran remarks', 'transaction details', 'transaction description', 'narration', 'particulars', 'description', 'remarks', 'details', 'transaction', 'narrative'],
};
const DEBIT_COL: ColSpec = {
  aliases: ['withdrawal amount', 'withdrawal amt', 'debit amount', 'debit amt', 'dr amount', 'dr amt', 'withdrawals', 'withdrawal', 'debit', 'paid out', 'payments', 'payment', 'dr'],
  reject: ['cr', 'credit', 'deposit'],   // never bind a combined "Dr/Cr" column here
};
const CREDIT_COL: ColSpec = {
  aliases: ['deposit amount', 'deposit amt', 'credit amount', 'credit amt', 'cr amount', 'cr amt', 'deposits', 'deposit', 'credit', 'paid in', 'receipts', 'receipt', 'cr'],
  reject: ['dr', 'debit', 'withdrawal'],
};
const AMOUNT_COL: ColSpec = {
  aliases: ['transaction amount', 'amount inr', 'amount rs', 'amount', 'amt', 'value'],
  reject: ['balance', 'dr', 'cr', 'debit', 'credit', 'withdrawal', 'deposit'],
};
/** The Dr/Cr indicator that accompanies a single Amount column. */
const TYPE_COL: ColSpec = {
  aliases: ['dr cr', 'cr dr', 'drcr', 'debit credit', 'transaction type', 'txn type', 'type', 'indicator', 'ind'],
};
const BALANCE_COL: ColSpec = {
  aliases: ['closing balance', 'running balance', 'available balance', 'balance amount', 'balance', 'bal'],
};
const REF_COL: ColSpec = {
  aliases: ['chq ref number', 'cheque ref no', 'reference number', 'reference no', 'ref no', 'cheque number', 'cheque no', 'chq no', 'chqno', 'instrument id', 'utr', 'reference', 'ref'],
};

/**
 * Best-scoring column for a spec, excluding columns already taken by another
 * field. Returns -1 when nothing matches.
 */
function findCol(headers: string[], spec: ColSpec, taken: Set<number> = new Set()): number {
  let bestIdx = -1;
  let bestScore = 0;
  headers.forEach((h, i) => {
    if (taken.has(i)) return;
    const tokens = tokenize(h);
    if (!tokens.length) return;
    if (spec.reject?.some((r) => tokens.includes(r))) return;
    for (const alias of spec.aliases) {
      const s = aliasScore(tokens, alias);
      if (s > bestScore) { bestScore = s; bestIdx = i; }
    }
  });
  return bestIdx;
}

// ── Value parsing ─────────────────────────────────────────────────────────────

/**
 * Amount as written by a bank. Keeps the SIGN (needed for signed-amount
 * statements) and understands "1,234.50", "(1,234.50)", "1,234.50 Dr",
 * "Rs. 1,234.50", "1.234,50" (rare EU-style exports) and "-".
 */
function parseSignedAmount(val: Cell | null | undefined): number {
  if (val == null || val === '') return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (val instanceof Date) return 0;

  let s = String(val).trim();
  if (!s || s === '-' || s === '.' || /^n\.?a\.?$/i.test(s)) return 0;

  let sign = 1;
  if (/^\(.*\)$/.test(s)) { sign = -1; s = s.slice(1, -1); }        // (1,234.50)
  if (/\bdr\b|\bdebit\b/i.test(s)) sign = -1;                        // 1,234.50 Dr
  else if (/\bcr\b|\bcredit\b/i.test(s)) sign = 1;

  s = s.replace(/[₹$]|rs\.?|inr/gi, '').replace(/\b(dr|cr|debit|credit)\b/gi, '').trim();

  // "1.234,50" — comma as decimal separator (no dot after the last comma).
  if (/^-?\d{1,3}(\.\d{3})+,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/,/g, '');

  if (s.startsWith('-')) { sign = -sign; s = s.slice(1); }
  if (s.startsWith('+')) s = s.slice(1);
  s = s.replace(/\s/g, '');

  const n = parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  return Math.round(sign * n * 100) / 100;
}

/** Magnitude only — for the two-column layout, where the column decides the side. */
function parseAmount(val: Cell | null | undefined): number {
  return Math.abs(parseSignedAmount(val));
}

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', sept: '09', oct: '10', nov: '11', dec: '12',
};

/** Excel stores dates as a serial day count from 1899-12-30. */
function fromExcelSerial(n: number): string | null {
  if (!Number.isFinite(n) || n < 20000 || n > 60000) return null;   // ~1954..2064
  // Floor, not round: the fractional part is the time of day, which must not
  // push an afternoon timestamp on to the next date.
  const ms = Math.floor(n) * 86400000 + Date.UTC(1899, 11, 30);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function iso(y: string, m: string, d: string): string | null {
  const mn = parseInt(m, 10);
  const dn = parseInt(d, 10);
  if (mn < 1 || mn > 12 || dn < 1 || dn > 31) return null;
  return `${y}-${String(mn).padStart(2, '0')}-${String(dn).padStart(2, '0')}`;
}

/**
 * Bank date → YYYY-MM-DD. Indian statements are DAY-FIRST, so ambiguous
 * dd/mm/yyyy is never read as US mm/dd. A bare `new Date(...)` fallback is
 * deliberately NOT used for that reason.
 */
function parseDate(val: string | number | Date | null | undefined): string | null {
  if (val == null || val === '') return null;

  // Real spreadsheet date cell (XLSX serial + format) — unambiguous.
  // Round to the nearest LOCAL midnight: SheetJS reconstructs these from a
  // floating-point serial and lands a millisecond short (23:59:59.999 of the
  // previous day), so reading the day directly reports the date one day early.
  if (val instanceof Date) {
    const t = val.getTime();
    if (Number.isNaN(t)) return null;
    const localMs = t - val.getTimezoneOffset() * 60000;      // local wall time as pseudo-UTC
    const d = new Date(Math.round(localMs / 86400000) * 86400000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  }

  if (typeof val === 'number') return fromExcelSerial(val);

  const raw = String(val).trim();
  if (!raw) return null;
  // Drop a trailing time component: "05/04/2024 18:32:11", "05-04-2024T00:00"
  const s = raw.split(/[ T]/)[0].trim();

  // YYYY-MM-DD / YYYY/MM/DD
  let m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
  if (m) return iso(m[1], m[2], m[3]);

  // DD-MM-YYYY / DD/MM/YYYY / DD.MM.YYYY
  m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  if (m) return iso(m[3], m[2], m[1]);

  // DD-Mon-YYYY / DD Mon YYYY  (15-Jan-2024, 15 Jan 2024)
  m = raw.match(/^(\d{1,2})[-\/. ]([A-Za-z]{3,9})[-\/. ](\d{4})/);
  if (m) { const mm = MONTHS[m[2].slice(0, 4).toLowerCase()] ?? MONTHS[m[2].slice(0, 3).toLowerCase()]; if (mm) return iso(m[3], mm, m[1]); }

  // Mon DD, YYYY  (Apr 01, 2024)
  m = raw.match(/^([A-Za-z]{3,9})[-\/. ](\d{1,2}),?[-\/. ](\d{4})/);
  if (m) { const mm = MONTHS[m[1].slice(0, 4).toLowerCase()] ?? MONTHS[m[1].slice(0, 3).toLowerCase()]; if (mm) return iso(m[3], mm, m[2]); }

  // DD-Mon-YY (15-Jan-24)
  m = raw.match(/^(\d{1,2})[-\/. ]([A-Za-z]{3,9})[-\/. ](\d{2})(?!\d)/);
  if (m) {
    const mm = MONTHS[m[2].slice(0, 4).toLowerCase()] ?? MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mm) return iso(parseInt(m[3], 10) > 50 ? `19${m[3]}` : `20${m[3]}`, mm, m[1]);
  }

  // DD/MM/YY
  m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2})$/);
  if (m) return iso(parseInt(m[3], 10) > 50 ? `19${m[3]}` : `20${m[3]}`, m[2], m[1]);

  // YYYYMMDD (compact)
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return iso(m[1], m[2], m[3]);

  // A bare number in a text cell is an Excel serial that lost its formatting.
  if (/^\d+(\.\d+)?$/.test(s)) return fromExcelSerial(parseFloat(s));

  return null;
}

/** Does this cell say "debit"? Used with the AMOUNT + TYPE layout. */
function isDebitIndicator(val: unknown): boolean | null {
  const t = String(val ?? '').trim().toLowerCase();
  if (!t) return null;
  if (/^(d|dr|dr\.|debit|withdrawal|w|wdl|paid out|out)$/.test(t)) return true;
  if (/^(c|cr|cr\.|credit|deposit|dep|paid in|in)$/.test(t)) return false;
  if (/\bdebit\b|\bwithdraw/.test(t)) return true;
  if (/\bcredit\b|\bdeposit\b/.test(t)) return false;
  return null;
}

// ── Payee extraction ──────────────────────────────────────────────────────────

/**
 * The party name inside a transfer narration, given its `/`- or `-`-separated
 * segments. Banks order these differently (UPI/DR/<utr>/<name>/<bank>, but also
 * IMPS/P2A/<ref>/<name>), so pick the first segment that reads like a NAME —
 * skipping the scheme tag, numeric references, and short codes like P2A.
 */
function pickNameSegment(segments: string[]): string {
  const codes = /^(cr|dr|p2a|p2p|p2m|n|ib|mb|ft|rev|inb|ach|neft|imps|rtgs|upi)$/i;

  // A real party name is letters and spaces. Preferring those skips the UTR /
  // IFSC token that banks put right after the scheme tag (NEFT/N0412345/NAME),
  // which a positional read would have returned as the payee.
  for (const raw of segments) {
    const s = raw.trim();
    if (s.length < 3 || codes.test(s)) continue;
    if (/^[A-Za-z][A-Za-z .&'()-]*$/.test(s) && /[A-Za-z]{3}/.test(s)) return s;
  }

  for (const raw of segments) {
    const s = raw.trim();
    if (!s) continue;
    if (/^\d+$/.test(s)) continue;              // pure reference number
    if (codes.test(s)) continue;                // scheme / channel tag
    if (s.length < 3) continue;                 // stray initials
    if (/^[A-Z]{4}\d{6,}$/i.test(s)) continue;  // IFSC-like / UTR-like token
    if (/@/.test(s) && segments.some((o) => o !== raw && !/@/.test(o) && !/^\d+$/.test(o) && o.trim().length >= 3)) continue; // VPA when a name exists
    return s;
  }
  return segments.find((s) => s.trim())?.trim() ?? '';
}

function extractPayee(narration: string): { payee: string; mode: PaymentMode; refNo: string } {
  const n = narration.trim();
  let refNo = '';

  /** Split after the scheme tag and choose the name-looking segment. */
  const fromScheme = (scheme: RegExp, mode: PaymentMode): { payee: string; mode: PaymentMode; refNo: string } | null => {
    const m = n.match(scheme);
    if (!m) return null;
    const rest = n.slice(m.index! + m[0].length);
    const segs = rest.split(/[\/\-|]/);
    const utr = n.match(/\b(\d{9,})\b/);
    return { payee: pickNameSegment(segs) || 'Unknown', mode, refNo: utr ? utr[1] : '' };
  };

  // UPI/CR/409812345678/PayeeName/BANK  ·  UPI-PayeeName-vpa@bank-ref
  const upi = fromScheme(/\bUPI[-\/]/i, 'UPI');
  if (upi) return upi;

  const neft = fromScheme(/\bNEFT[-\/]/i, 'NEFT');
  if (neft) return neft;

  const imps = fromScheme(/\bIMPS[-\/]/i, 'IMPS');
  if (imps) return imps;

  const rtgs = fromScheme(/\bRTGS[-\/]/i, 'RTGS');
  if (rtgs) return rtgs;

  // ATM
  if (/ATM/i.test(n)) {
    const atmMatch = n.match(/ATM[-\/].*?(\w+\s+ATM|\w+\s+BRANCH)/i);
    return { payee: atmMatch ? atmMatch[1].trim() : 'ATM Withdrawal', mode: 'ATM', refNo: '' };
  }

  // POS
  const pos = n.match(/POS\s+\d+\s+(.+?)(?:\s+\d|$)/i);
  if (pos) return { payee: pos[1].trim(), mode: 'POS', refNo: '' };

  // Cheque
  const chq = n.match(/(?:CHQ|CHEQUE)\s*(?:NO)?\.?\s*(\d+)/i);
  if (chq) return { payee: `Cheque #${chq[1]}`, mode: 'CHQ', refNo: chq[1] };

  // CASH
  if (/\bCASH\b/i.test(n)) return { payee: n.slice(0, 40).trim(), mode: 'CASH', refNo: '' };

  // Fallback
  return { payee: n.slice(0, 40).trim() || 'Unknown', mode: 'OTHER', refNo: '' };
}

// ── Header row location ───────────────────────────────────────────────────────

/**
 * Bank downloads carry a preamble (account no., address, statement period) that
 * can run to 25+ lines, so the header is found by SCORING every early row rather
 * than taking the first row that looks vaguely right.
 */
function locateHeaderRow(rows: Cell[][]): { idx: number; headers: string[] } {
  let bestIdx = -1;
  let bestScore = 0;
  const limit = Math.min(40, rows.length);

  for (let i = 0; i < limit; i++) {
    const row = (rows[i] ?? []).map((c) => String(c ?? ''));
    if (row.filter((c) => c.trim()).length < 2) continue;

    let score = 0;
    if (findCol(row, DATE_COL) >= 0) score += 3;
    if (findCol(row, NARRATION_COL) >= 0) score += 3;
    if (findCol(row, DEBIT_COL) >= 0) score += 2;
    if (findCol(row, CREDIT_COL) >= 0) score += 2;
    if (findCol(row, AMOUNT_COL) >= 0) score += 2;
    if (findCol(row, BALANCE_COL) >= 0) score += 1;
    // A header row is text; a data row usually carries a parseable amount.
    if (row.some((c) => /^-?[\d,]+\.\d{2}$/.test(c.trim()))) score -= 4;

    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }

  if (bestIdx < 0 || bestScore < 4) return { idx: -1, headers: [] };
  return { idx: bestIdx, headers: (rows[bestIdx] ?? []).map((c) => String(c ?? '')) };
}

// ── Delimited-text reading ────────────────────────────────────────────────────

/**
 * CSVs are read HERE rather than by SheetJS, because SheetJS coerces date-like
 * text using a US month-first assumption: it turns "05/04/2024" (5 April on an
 * Indian statement) into 4 May, and reformats "18-Apr-2024" to "4/18/24" which
 * then fails to parse at all. Keeping every cell as raw text lets the day-first
 * parser above decide, which is the correct reading for Indian banks.
 */
function sniffDelimiter(sample: string): string {
  const candidates = [',', '\t', ';', '|'];
  let best = ',';
  let bestScore = -1;
  const lines = sample.split(/\r?\n/).filter((l) => l.trim()).slice(0, 20);
  for (const d of candidates) {
    // A real delimiter yields a consistent, >1 field count across lines.
    const counts = lines.map((l) => l.split(d).length);
    const max = Math.max(0, ...counts);
    if (max < 2) continue;
    const modal = counts.filter((c) => c === max).length;
    const score = max * 2 + modal;
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

/** RFC4180-style reader: honours quoted fields, embedded delimiters and newlines. */
function readDelimitedText(text: string, delim: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === delim) { row.push(field); field = ''; continue; }
    if (ch === '\r') continue;
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.map((r) => r.map((c) => c.trim()));
}

/** True when the bytes look like delimited text rather than a binary workbook. */
function looksLikeText(bytes: Uint8Array, fileName: string): boolean {
  if (/\.(csv|txt|tsv)$/i.test(fileName)) return true;
  // XLSX is a zip ("PK"), legacy XLS starts with the OLE2 magic (0xD0CF11E0).
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return false;
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf) return false;
  // Reject if there are NUL bytes in the first block — that means binary.
  const n = Math.min(bytes.length, 4096);
  for (let i = 0; i < n; i++) if (bytes[i] === 0) return false;
  return true;
}

/** Pick the sheet that actually holds the statement (largest usable grid). */
function pickSheet(wb: XLSX.WorkBook): Cell[][] {
  let best: Cell[][] = [];
  let bestScore = -1;
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    // raw:true keeps real date cells as Date objects (cellDates on read) and
    // amounts as numbers — no reformatting, so nothing has to be re-parsed out
    // of a locale-specific string.
    const rows = XLSX.utils.sheet_to_json<Cell[]>(ws, { header: 1, defval: '', raw: true, blankrows: false }) as Cell[][];
    const found = locateHeaderRow(rows);
    const score = (found.idx >= 0 ? 1000 : 0) + rows.length;
    if (score > bestScore) { bestScore = score; best = rows; }
  }
  return best;
}

// ── Main parser ───────────────────────────────────────────────────────────────

export async function parseBankStatement(
  file: File,
  companyId: string,
  bankAccount: string,
): Promise<{ batch: ImportBatch; transactions: BankTransaction[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  let rows: Cell[][];
  if (looksLikeText(bytes, file.name)) {
    // Read delimited text ourselves — see readDelimitedText for why SheetJS is
    // not used here (it mis-reads Indian dd/mm dates as US mm/dd).
    const text = new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, '');
    rows = readDelimitedText(text, sniffDelimiter(text.slice(0, 8000)));
  } else {
    const wb = XLSX.read(bytes, { type: 'array', cellDates: true, raw: true });
    rows = pickSheet(wb);
  }
  if (!rows.length) throw new Error('The file appears to be empty — no rows could be read.');

  const { idx: headerRowIdx, headers } = locateHeaderRow(rows);
  if (headerRowIdx < 0) {
    const preview = rows.slice(0, 5).map((r) => r.filter(Boolean).join(' | ')).filter(Boolean).slice(0, 3);
    throw new Error(
      'Could not find the header row in this statement. The file needs a row with a Date column, a Narration/Description column, and either Debit+Credit columns or an Amount column.'
      + (preview.length ? `\n\nFirst rows seen:\n${preview.join('\n')}` : ''),
    );
  }

  // Claim columns in order of confidence so one column is never used twice.
  const taken = new Set<number>();
  const claim = (i: number) => { if (i >= 0) taken.add(i); return i; };

  const dateCol = claim(findCol(headers, DATE_COL, taken));
  const narCol = claim(findCol(headers, NARRATION_COL, taken));
  const balCol = claim(findCol(headers, BALANCE_COL, taken));
  const drCol = claim(findCol(headers, DEBIT_COL, taken));
  const crCol = claim(findCol(headers, CREDIT_COL, taken));
  const amtCol = drCol >= 0 && crCol >= 0 ? -1 : claim(findCol(headers, AMOUNT_COL, taken));
  const typeCol = amtCol >= 0 ? claim(findCol(headers, TYPE_COL, taken)) : -1;
  const refCol = claim(findCol(headers, REF_COL, taken));

  type Layout = 'DR_CR' | 'AMOUNT_TYPE' | 'SIGNED';
  let layout: Layout;
  if (drCol >= 0 && crCol >= 0) layout = 'DR_CR';
  else if (amtCol >= 0 && typeCol >= 0) layout = 'AMOUNT_TYPE';
  else if (amtCol >= 0) layout = 'SIGNED';
  else if (drCol >= 0 || crCol >= 0) layout = 'DR_CR';           // one-sided statement
  else {
    throw new Error(
      `Could not detect the amount columns. Found headers: ${headers.filter(Boolean).join(', ')}.\n`
      + 'The statement needs either Debit + Credit columns, or an Amount column (with a Dr/Cr column, or with debits as negative numbers).',
    );
  }

  if (dateCol < 0) {
    throw new Error(`Could not detect the date column. Found headers: ${headers.filter(Boolean).join(', ')}.`);
  }

  const batchId = crypto.randomUUID();
  const transactions: BankTransaction[] = [];
  const dataRows = rows.slice(headerRowIdx + 1);

  // Diagnostics for the "parsed nothing" message — silent skips are why an
  // import used to fail with no explanation.
  let skippedNoDate = 0;
  let skippedNoAmount = 0;

  for (const row of dataRows) {
    if (!row || row.every((c) => String(c ?? '').trim() === '')) continue;

    const dateStr = parseDate(row[dateCol]);
    if (!dateStr) { skippedNoDate++; continue; }

    let drAmt = 0;
    let crAmt = 0;
    if (layout === 'DR_CR') {
      drAmt = drCol >= 0 ? parseAmount(row[drCol]) : 0;
      crAmt = crCol >= 0 ? parseAmount(row[crCol]) : 0;
    } else {
      const signed = parseSignedAmount(row[amtCol]);
      const mag = Math.abs(signed);
      let debit: boolean;
      if (layout === 'AMOUNT_TYPE') {
        const ind = isDebitIndicator(row[typeCol]);
        // Indicator missing on the row — fall back to the sign of the amount.
        debit = ind ?? signed < 0;
      } else {
        debit = signed < 0;
      }
      if (debit) drAmt = mag; else crAmt = mag;
    }

    if (drAmt === 0 && crAmt === 0) { skippedNoAmount++; continue; }

    const narration = narCol >= 0 ? String(row[narCol] ?? '').trim() : '';
    const balance = balCol >= 0 ? parseAmount(row[balCol]) : 0;
    const refFromCol = refCol >= 0 ? String(row[refCol] ?? '').trim() : '';
    const { payee, mode, refNo } = extractPayee(narration);

    transactions.push({
      id: crypto.randomUUID(),
      company_id: companyId,
      import_batch: batchId,
      date: dateStr,
      narration_raw: narration,
      narration_clean: narration,
      payee,
      payment_mode: mode,
      debit: drAmt,
      credit: crAmt,
      balance,
      ref_no: refFromCol || refNo,
      journalized_id: null,
      journalized_at: null,
    });
  }

  if (transactions.length === 0) {
    const why = skippedNoDate > skippedNoAmount
      ? `${skippedNoDate} row(s) had a date we could not read in column "${headers[dateCol]}".`
      : `${skippedNoAmount} row(s) had no amount.`;
    throw new Error(
      `No transactions could be read from this file. ${why}\n`
      + `Detected layout: ${layout}. Columns — date: "${headers[dateCol] ?? '—'}", `
      + `narration: "${headers[narCol] ?? '—'}", `
      + (layout === 'DR_CR'
        ? `debit: "${headers[drCol] ?? '—'}", credit: "${headers[crCol] ?? '—'}".`
        : `amount: "${headers[amtCol] ?? '—'}", type: "${headers[typeCol] ?? '—'}".`),
    );
  }

  const batch: ImportBatch = {
    id: batchId,
    company_id: companyId,
    bank_account: bankAccount,
    file_name: file.name,
    imported_at: new Date().toISOString(),
    row_count: transactions.length,
  };

  return { batch, transactions };
}
