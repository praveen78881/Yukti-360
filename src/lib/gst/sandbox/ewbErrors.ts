// NIC E-Way Bill API error codes (subset of the commonly-hit ones). On a
// business error the API returns status "0" and error.errorCodes = "604,213,".
// Full list: docs annexure e-way-bill-error-codes, or the live Get Error List API.

export const EWB_ERROR_CODES: Record<string, string> = {
  '100': 'Invalid JSON',
  '101': 'Invalid username',
  '102': 'Invalid password',
  '105': 'Invalid token',
  '106': 'Token expired — reconnect the EWB session',
  '108': 'Invalid login credentials',
  '111': 'GSTIN is not registered to this GSP',
  '201': 'Invalid supply type',
  '202': 'Invalid sub-supply type',
  '204': 'Invalid document type',
  '205': 'Document number is mandatory',
  '206': 'Invalid or blank document date',
  '210': 'Invalid or blank supplier PIN code',
  '211': 'Invalid or blank supplier state code',
  '212': 'Invalid consignee GSTIN',
  '213': 'Invalid consignee address',
  '214': 'Invalid consignee PIN code',
  '215': 'Invalid consignee state code',
  '216': 'Invalid HSN code',
  '217': 'Invalid UQC (unit) code',
  '218': 'Invalid tax rate for intra-state transaction',
  '219': 'Invalid tax rate for inter-state transaction',
  '220': 'Invalid transport mode',
  '221': 'Invalid vehicle number format',
  '222': 'Invalid transporter ID',
  '230': 'Invalid or blank transport distance',
  '600': 'Invalid category',
  '601': 'Invalid date format',
  '604': 'An e-Way Bill already exists for this document number — you cannot generate again on the same document number',
  '607': 'Dispatch-from GSTIN is mandatory',
  '608': 'Ship-to GSTIN is mandatory',
  '609': 'Invalid ship-to GSTIN',
};

/** Turn "604,213," into a readable, de-duplicated message. */
export function describeEwbError(codes?: string | null): string {
  if (!codes) return 'The e-Way Bill portal rejected the request.';
  const parts = String(codes)
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  if (!parts.length) return 'The e-Way Bill portal rejected the request.';
  return parts.map((c) => `${c}: ${EWB_ERROR_CODES[c] || 'Unknown error'}`).join(' · ');
}
