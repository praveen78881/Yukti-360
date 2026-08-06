/**
 * GST live health check — runs the full Sandbox flow and logs every request and
 * response, so you can confirm the pipe end-to-end before testing with a real
 * GSTIN. TEST environment only; touches no real filings.
 *
 *   node scripts/gst-live-check.mjs [searchGstin]
 *
 * Steps: authenticate → public GSTIN search → e-Way Bill auth → e-Way Bill
 * generate (test payload). Each step prints the request it sent and the response
 * it got, plus a PASS/FAIL line. Uses the same server core the app uses.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getConfigFromEnv, handleAction } from '../netlify/functions/_shared/sandboxCore.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── load .env ──
const env = {};
try {
  for (const line of readFileSync(path.resolve(__dirname, '../.env'), 'utf8').split(/\r?\n/)) {
    if (line.trimStart().startsWith('#')) continue;
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2];
  }
} catch { console.error('Could not read .env'); process.exit(1); }

const cfg = getConfigFromEnv(env);

// EWB test account (bound to GSTIN 29AAACQ3770E000) — from Sandbox docs.
const EWB_TEST = { gstin: '29AAACQ3770E000', username: 'ACME_IND_API_QCK', password: 'QnVzaW5lc3NfQVBJX1FDSw' };
const SEARCH_GSTIN = process.argv[2] || '33ABKCS2033B1ZW';
const EWB_ERR = { '604': 'e-Way Bill already exists for this document number (canned test response)', '212': 'Invalid consignee GSTIN', '106': 'Token expired' };

const line = (s = '') => console.log(s);
const j = (o, n = 600) => { const s = JSON.stringify(o); return s.length > n ? s.slice(0, n) + '…' : s; };
let pass = 0, fail = 0;
const mark = (ok, msg) => { if (ok) { pass++; console.log('   \x1b[32m✔ PASS\x1b[0m ' + msg); } else { fail++; console.log('   \x1b[31m✘ FAIL\x1b[0m ' + msg); } };

line('══════════════════════════════════════════════════════');
line(' GST LIVE HEALTH CHECK');
line('══════════════════════════════════════════════════════');
line(` host      : ${cfg.host}`);
line(` api key   : ${cfg.apiKey ? cfg.apiKey.slice(0, 9) + '…' : '(MISSING)'}`);
line(` api secret: ${cfg.apiSecret ? 'set' : '(MISSING)'}`);
line(` debug log : ${cfg.debug ? 'on' : 'off'}`);

const run = async () => {
  // 1) Authenticate
  line('\n[1] STATUS / AUTHENTICATE');
  line('    → request: { action: "status" }');
  try {
    const r = await handleAction('status', {}, cfg);
    line('    ← response: ' + j(r.data));
    mark(r.status === 200 && r.data?.authenticated, 'Sandbox JWT issued (keys + host valid)');
  } catch (e) { mark(false, e.message); line('    (stopping — auth is required for everything else)'); return summary(); }

  // 2) Public GSTIN search
  line(`\n[2] GSTIN SEARCH  (${SEARCH_GSTIN})`);
  line(`    → request: { action: "gstinSearch", gstin: "${SEARCH_GSTIN}" }`);
  try {
    const r = await handleAction('gstinSearch', { gstin: SEARCH_GSTIN }, cfg);
    const d = r.data?.data?.data || r.data?.data;
    line('    ← response: ' + j(r.data, 500));
    mark(r.status === 200 && (d?.lgnm || d?.tradeNam), `Found: ${d?.tradeNam || d?.lgnm || '—'} · status ${d?.sts || '?'}`);
  } catch (e) { mark(false, e.message); }

  // 3) E-Way Bill auth
  line('\n[3] E-WAY BILL AUTH  (test account 29AAACQ3770E000)');
  line(`    → request: { action: "ewbAuth", username: "${EWB_TEST.username}", gstin: "${EWB_TEST.gstin}" }`);
  let ewbToken;
  try {
    const r = await handleAction('ewbAuth', EWB_TEST, cfg);
    ewbToken = r.data?.ewbToken;
    line('    ← response: ' + j({ code: r.data?.code, ewbToken: ewbToken ? ewbToken.slice(0, 18) + '…' : null, expiry: r.data?.expiry }));
    mark(r.status === 200 && !!ewbToken, ewbToken ? 'EWB session token issued' : 'no token');
  } catch (e) { mark(false, e.message); }

  // 4) E-Way Bill generate
  if (ewbToken) {
    line('\n[4] E-WAY BILL GENERATE  (test payload)');
    const bill = {
      supplyType: 'O', subSupplyType: '1', subSupplyDesc: '', docType: 'INV',
      docNo: 'CHK' + Math.floor(Math.random() * 9e5 + 1e5), docDate: '25/07/2026',
      fromGstin: '29AAACQ3770E000', fromTrdName: 'ACME', fromAddr1: 'MG Road', fromAddr2: '', fromPlace: 'Bengaluru',
      fromPincode: 560001, actFromStateCode: 29, fromStateCode: 29,
      toGstin: '33ABKCS2033B1ZW', toTrdName: 'ALTON', toAddr1: 'Anna Salai', toAddr2: '', toPlace: 'Chennai',
      toPincode: 600001, actToStateCode: 33, toStateCode: 33,
      transactionType: 1, otherValue: 0, totalValue: 10000, cgstValue: 0, sgstValue: 0, igstValue: 1800,
      cessValue: 0, cessNonAdvolValue: 0, totInvValue: 11800,
      transporterId: '', transporterName: '', transDocNo: '', transDocDate: '',
      transMode: '1', transDistance: '100', vehicleNo: 'KA01AB1234', vehicleType: 'R',
      itemList: [{ productName: 'Test', productDesc: 'Test', hsnCode: 1001, quantity: 1, qtyUnit: 'NOS', cgstRate: 0, sgstRate: 0, igstRate: 18, cessRate: 0, cessNonadvol: 0, taxableAmount: 10000 }],
    };
    line('    → request bill: ' + j(bill, 400));
    try {
      const r = await handleAction('ewbGenerate', { ewbToken, bill }, cfg);
      const d = r.data?.data ?? r.data;
      line('    ← response: ' + j(r.data, 400));
      const ewbNo = d?.ewayBillNo || d?.ewbNo;
      if (ewbNo) {
        mark(true, `EWB generated: ${ewbNo} (valid upto ${d.validUpto})`);
      } else {
        const codes = String(d?.error?.errorCodes || '').split(',').filter(Boolean);
        const explained = codes.map((c) => `${c} = ${EWB_ERR[c] || 'see error annexure'}`).join('; ');
        // On the TEST endpoint 604 is EXPECTED (mocked) — the request was accepted & validated.
        mark(codes.includes('604') || !!ewbNo, `endpoint reachable & payload accepted — ${explained || 'error'}`);
        if (codes.includes('604')) line('    note: 604 on the test endpoint is expected (mocked). Real EWB numbers require production creds.');
      }
    } catch (e) { mark(false, e.message); }
  }

  summary();
};

function summary() {
  line('\n══════════════════════════════════════════════════════');
  line(` RESULT: ${pass} passed, ${fail} failed`);
  line(fail === 0
    ? ' \x1b[32mAll systems go.\x1b[0m The pipe works end-to-end — ready for a real GSTIN in production.'
    : ' \x1b[31mSomething failed above — see the response logs.\x1b[0m');
  line('══════════════════════════════════════════════════════');
}

run();
