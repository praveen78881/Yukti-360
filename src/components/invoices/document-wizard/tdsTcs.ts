/* TDS / TCS reference data for the entry screens' "for reference" panel.
   UI-ONLY: nothing here is saved or posted, and it never changes a bill total.
   Rates are the defaults for FY 2025-26 (AY 2026-27) offered as editable
   suggestions — the user always sees and can change the rate. */

export interface WithholdingSection {
  code: string;      // unique option id
  section: string;   // statutory section shown to the user
  label: string;
  rate: number;      // default % (editable in the UI)
  omitted?: boolean; // listed for reference but no longer in force
}

/** Common TDS sections (Chapter XVII-B). */
export const TDS_SECTIONS: WithholdingSection[] = [
  { code: '194C-I', section: '194C', label: 'Contractor — individual / HUF', rate: 1 },
  { code: '194C-O', section: '194C', label: 'Contractor — others', rate: 2 },
  { code: '194J-A', section: '194J(a)', label: 'Technical services, call centre, film royalty', rate: 2 },
  { code: '194J-B', section: '194J(b)', label: 'Professional services, royalty, director fees', rate: 10 },
  { code: '194H', section: '194H', label: 'Commission / brokerage', rate: 2 },
  { code: '194I-A', section: '194I(a)', label: 'Rent — plant, machinery, equipment', rate: 2 },
  { code: '194I-B', section: '194I(b)', label: 'Rent — land, building, furniture', rate: 10 },
  { code: '194Q', section: '194Q', label: 'Purchase of goods above ₹50 lakh', rate: 0.1 },
  { code: '194A', section: '194A', label: 'Interest other than on securities', rate: 10 },
  { code: '194O', section: '194O', label: 'E-commerce operator payment', rate: 0.1 },
  { code: '194T', section: '194T', label: 'Partner salary, remuneration, interest (firms)', rate: 10 },
  { code: '194D', section: '194D', label: 'Insurance commission (non-company)', rate: 2 },
  { code: '194M', section: '194M', label: 'Contract / professional fees by individual or HUF', rate: 2 },
  { code: '194IA', section: '194-IA', label: 'Transfer of immovable property', rate: 1 },
  { code: '195', section: '195', label: 'Payment to a non-resident (rate per Act / DTAA)', rate: 20 },
];

/** TCS sections (s. 206C) with their sub-types. */
export const TCS_SECTIONS: WithholdingSection[] = [
  { code: '206C1-LIQ', section: '206C(1)', label: 'Alcoholic liquor for human consumption', rate: 1 },
  { code: '206C1-TEN', section: '206C(1)', label: 'Tendu leaves', rate: 5 },
  { code: '206C1-TIM', section: '206C(1)', label: 'Timber (forest lease or any other mode)', rate: 2.5 },
  { code: '206C1-FOR', section: '206C(1)', label: 'Other forest produce', rate: 2.5 },
  { code: '206C1-SCR', section: '206C(1)', label: 'Scrap', rate: 1 },
  { code: '206C1-MIN', section: '206C(1)', label: 'Minerals — coal, lignite, iron ore', rate: 1 },
  { code: '206C1C-PRK', section: '206C(1C)', label: 'Parking lot (lease / licence)', rate: 2 },
  { code: '206C1C-TOL', section: '206C(1C)', label: 'Toll plaza (lease / licence)', rate: 2 },
  { code: '206C1C-MQ', section: '206C(1C)', label: 'Mining & quarrying (lease / licence)', rate: 2 },
  { code: '206C1F-MV', section: '206C(1F)', label: 'Motor vehicle above ₹10 lakh', rate: 1 },
  { code: '206C1F-LUX', section: '206C(1F)', label: 'Notified luxury goods above ₹10 lakh', rate: 1 },
  { code: '206C1G-LRS', section: '206C(1G)', label: 'LRS remittance above ₹10 lakh', rate: 20 },
  { code: '206C1G-EDU', section: '206C(1G)', label: 'LRS for education / medical above ₹10 lakh', rate: 5 },
  { code: '206C1G-TOUR', section: '206C(1G)', label: 'Overseas tour package (5% to ₹10 lakh, 20% above)', rate: 5 },
  { code: '206C1H', section: '206C(1H)', label: 'Sale of goods above ₹50 lakh — omitted w.e.f. 01-04-2025', rate: 0.1, omitted: true },
];

/** PAN is characters 3–12 of a GSTIN. */
export function panFromGstin(gstin: string | undefined): string {
  const g = (gstin || '').trim().toUpperCase();
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]/.test(g) ? g.slice(2, 12) : '';
}
