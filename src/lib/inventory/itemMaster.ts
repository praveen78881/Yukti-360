/* Stock item master — the created items for a company, persisted in the offline
   DB (entity_data · module "inventory" · section "items"). Mirrors the fields of
   Tally's "Stock Item Creation" screen so items carry their units, HSN/SAC and
   GST particulars, type of supply and opening balance. The Inventory screen's
   live, register-derived stock is separate; this is the user-maintained master. */

import { getEntityData, upsertEntityData } from '@/lib/offlineDb';

const MODULE = 'inventory';
const SECTION = 'items';

export type GstApplicability = 'Applicable' | 'Not Applicable';
export type DetailsSource = 'As per Company/Stock Group' | 'Specify Details Here';
export type TaxabilityType = '' | 'Taxable' | 'Non-Taxable' | 'Nil Rated' | 'Zero Rated' | 'Exempt';
export type TypeOfSupply = 'Goods' | 'Services';

/** GST type / taxability of the supply. */
export const TAXABILITY_TYPES: Exclude<TaxabilityType, ''>[] = [
  'Taxable', 'Non-Taxable', 'Nil Rated', 'Zero Rated', 'Exempt',
];

/** The GST rate slabs (incl. the special low rates), in %. */
export const GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28, 40];

/** Units of measurement — the GST Unit Quantity Codes (UQC), in CA language.
 *  `name` is the CA-referred word; `code` is the statutory UQC used on returns. */
export interface UnitOfMeasure { code: string; name: string }
export const UQC_UNITS: UnitOfMeasure[] = [
  { code: '',    name: 'Not Applicable' },
  { code: 'NOS', name: 'Numbers' },
  { code: 'PCS', name: 'Pieces' },
  { code: 'UNT', name: 'Units' },
  { code: 'SET', name: 'Sets' },
  { code: 'PRS', name: 'Pairs' },
  { code: 'DOZ', name: 'Dozens' },
  { code: 'BOX', name: 'Box' },
  { code: 'CTN', name: 'Cartons' },
  { code: 'PAC', name: 'Packs' },
  { code: 'BAG', name: 'Bags' },
  { code: 'BAL', name: 'Bales' },
  { code: 'BDL', name: 'Bundles' },
  { code: 'BUN', name: 'Bunches' },
  { code: 'BKL', name: 'Buckles' },
  { code: 'BTL', name: 'Bottles' },
  { code: 'CAN', name: 'Cans' },
  { code: 'DRM', name: 'Drums' },
  { code: 'ROL', name: 'Rolls' },
  { code: 'TUB', name: 'Tubes' },
  { code: 'TBS', name: 'Tablets' },
  { code: 'KGS', name: 'Kilograms' },
  { code: 'GMS', name: 'Grammes' },
  { code: 'QTL', name: 'Quintal' },
  { code: 'TON', name: 'Tonnes' },
  { code: 'MTS', name: 'Metric Ton' },
  { code: 'LTR', name: 'Litres' },
  { code: 'MLT', name: 'Millilitres' },
  { code: 'KLR', name: 'Kilolitre' },
  { code: 'MTR', name: 'Metres' },
  { code: 'CMS', name: 'Centimetres' },
  { code: 'KME', name: 'Kilometre' },
  { code: 'YDS', name: 'Yards' },
  { code: 'SQM', name: 'Square Metres' },
  { code: 'SQF', name: 'Square Feet' },
  { code: 'SQY', name: 'Square Yards' },
  { code: 'CBM', name: 'Cubic Metres' },
  { code: 'CCM', name: 'Cubic Centimetres' },
  { code: 'GRS', name: 'Gross' },
  { code: 'GGR', name: 'Great Gross' },
  { code: 'GYD', name: 'Gross Yards' },
  { code: 'TGM', name: 'Ten Gross' },
  { code: 'THD', name: 'Thousands' },
  { code: 'BOU', name: 'Billion of Units' },
  { code: 'UGS', name: 'US Gallons' },
  { code: 'OTH', name: 'Others' },
];

export interface StockItem {
  id: string;
  /** Name and alias */
  name: string;
  alias: string;
  /** Stock group it sits under (Tally: "Under"), default Primary */
  under: string;
  /** Unit of measure (Tally: "Units"), default Not Applicable */
  units: string;

  /* ── Statutory Details ── */
  gstApplicability: GstApplicability;
  /* HSN/SAC & Related Details */
  hsnDetails: DetailsSource;
  hsnSourceOfDetails: string;
  hsnCode: string;
  hsnDescription: string;
  /* GST Rate & Related Details */
  gstRateDetails: DetailsSource;
  gstRateSourceOfDetails: string;
  taxabilityType: TaxabilityType;
  gstRate: number;
  /* Type of supply + duty */
  typeOfSupply: TypeOfSupply;
  rateOfDuty: string;

  /* ── Opening Balance ── */
  openingQty: number;
  openingRate: number;
  openingValue: number;

  created_at: string;
  updated_at: string;
}

/** A blank item carrying the same defaults Tally shows on a new Stock Item. */
export function emptyStockItem(): StockItem {
  const now = new Date().toISOString();
  return {
    id: '',
    name: '',
    alias: '',
    under: 'Primary',
    units: 'Not Applicable',
    gstApplicability: 'Applicable',
    hsnDetails: 'As per Company/Stock Group',
    hsnSourceOfDetails: 'Not Available',
    hsnCode: '',
    hsnDescription: '',
    gstRateDetails: 'As per Company/Stock Group',
    gstRateSourceOfDetails: 'Not Available',
    taxabilityType: '',
    gstRate: 0,
    typeOfSupply: 'Goods',
    rateOfDuty: '',
    openingQty: 0,
    openingRate: 0,
    openingValue: 0,
    created_at: now,
    updated_at: now,
  };
}

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `item_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function listStockItems(companyId: string): StockItem[] {
  const rec = getEntityData(companyId, MODULE, SECTION);
  const data = rec?.data as { items?: StockItem[] } | undefined;
  const items = Array.isArray(data?.items) ? data!.items! : [];
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

/** Create or update an item (by id). Returns the saved item. */
export function saveStockItem(companyId: string, item: StockItem): StockItem {
  const items = listStockItems(companyId);
  const now = new Date().toISOString();
  let saved: StockItem;
  if (item.id) {
    saved = { ...item, updated_at: now };
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) items[idx] = saved;
    else items.push(saved);
  } else {
    saved = { ...item, id: genId(), created_at: now, updated_at: now };
    items.push(saved);
  }
  upsertEntityData(companyId, MODULE, SECTION, { items });
  return saved;
}

export function deleteStockItem(companyId: string, id: string): void {
  const items = listStockItems(companyId).filter((i) => i.id !== id);
  upsertEntityData(companyId, MODULE, SECTION, { items });
}
