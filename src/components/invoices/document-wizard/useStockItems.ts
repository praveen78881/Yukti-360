/* Bridges the Inventory → Items master into the purchase/sales item pickers.
   The "Item / service" field offers the created master items; picking one fills
   the line's HSN/SAC, unit, GST rate and taxability from the master, so the
   same item is entered the same way on every invoice. Typing a new name still
   works — the master is a convenience, not a constraint. */

import { useMemo } from 'react';
import { listStockItems, UQC_UNITS, type StockItem } from '@/lib/inventory/itemMaster';
import { UQC_OPTIONS, type LineItem } from '@/lib/accounting/gstInvoices';
import type { PurchaseFields } from './useDocumentState';

const NAME_TO_UQC = new Map(UQC_UNITS.filter((u) => u.code).map((u) => [u.name.toLowerCase(), u.code]));

/** Master unit name (e.g. "Square Metres") → invoice UQC code the dropdown holds. */
function uqcCode(unitName: string): string {
  const code = NAME_TO_UQC.get((unitName || '').toLowerCase());
  return code && UQC_OPTIONS.includes(code) ? code : 'NOS';
}

/** Map the master's GST applicability + taxability onto the sales line's supply nature. */
function supplyNature(m: StockItem): LineItem['supply_nature'] {
  if (m.gstApplicability !== 'Applicable') return 'NON_GST';
  switch (m.taxabilityType) {
    case 'Exempt': return 'EXEMPT';
    case 'Nil Rated': return 'NIL_RATED';
    case 'Non-Taxable': return 'NON_GST';
    default: return 'TAXABLE'; // Taxable / Zero Rated / unset
  }
}

export interface StockItemOptions {
  items: StockItem[];
  names: string[];
  /** lower-cased name → item, for exact-match lookup on pick. */
  byName: Map<string, StockItem>;
}

export function useStockItems(companyId: string | undefined): StockItemOptions {
  return useMemo(() => {
    const items = companyId ? listStockItems(companyId) : [];
    return {
      items,
      names: items.map((i) => i.name),
      byName: new Map(items.map((i) => [i.name.toLowerCase(), i])),
    };
  }, [companyId]);
}

/** Line-item updates to apply when a master item is chosen in a SALES row. */
export function salesUpdatesFromMaster(m: StockItem): Partial<LineItem> {
  return {
    description: m.name,
    hsn: m.hsnCode || '',
    uqc: uqcCode(m.units),
    gst_rate: m.gstRate,
    supply_nature: supplyNature(m),
  };
}

/** Field updates to apply when a master item is chosen in a PURCHASE row. */
export function purchaseUpdatesFromMaster(m: StockItem): Partial<Pick<PurchaseFields, 'itemDescription' | 'itemHsn' | 'gstRate'>> {
  return {
    itemDescription: m.name,
    itemHsn: m.hsnCode || '',
    gstRate: String(m.gstRate),
  };
}
