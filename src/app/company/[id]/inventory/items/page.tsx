import { useMemo, useState } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { PageHeader } from '@/components/layout/PageHeader';
import { isValidHsnSac } from '@/lib/gst/hsnLookup';
import { listStockItems, deleteStockItem, type StockItem } from '@/lib/inventory/itemMaster';
import { StockItemModal } from './StockItemModal';

/* Items — the stock item master. Each item is created/altered through the
   "Stock Item Creation" form (Tally-aligned fields). Items persist in the
   offline DB and feed the item picker used elsewhere. */

export default function InventoryItemsPage() {
  const { company, companyId, loading } = useCompany();
  const [query, setQuery] = useState('');
  const [tick, setTick] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);

  const allItems = useMemo(
    () => (companyId ? listStockItems(companyId) : []),
    [companyId, tick],
  );

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((it) =>
      it.name.toLowerCase().includes(q) ||
      it.alias.toLowerCase().includes(q) ||
      (it.hsnCode || '').toLowerCase().includes(q));
  }, [allItems, query]);

  if (loading || !company || !companyId) {
    return <div className="flex items-center justify-center py-16"><div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (it: StockItem) => { setEditing(it); setModalOpen(true); };
  const remove = (it: StockItem) => {
    if (!window.confirm(`Delete item "${it.name}"?`)) return;
    deleteStockItem(companyId, it.id);
    setTick((t) => t + 1);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Items" description="Stock item master — create and maintain your items">
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search item or HSN…"
            aria-label="Search items"
            className="h-8 w-52 rounded-lg border border-gray-300 px-3 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1 h-8 px-3 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create Item
          </button>
        </div>
      </PageHeader>

      {/* ── Summary ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Items</p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums text-gray-900">{allItems.length}</p>
        </div>
      </div>

      {/* ── Item master table ── */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
          <h3 className="text-sm font-bold text-gray-800">Items</h3>
          <span className="text-[11px] text-gray-400">{items.length} shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Name</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Units</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">HSN / SAC</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">GST %</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Supply</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-xs text-gray-400">
                    {query ? 'No items match your search.' : 'No items yet. Click “Create Item” to add your first stock item.'}
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-2.5 text-[11px] font-medium text-gray-800 cursor-pointer" onClick={() => openEdit(it)}>
                      {it.name}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-gray-600">{it.units}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-gray-500">
                      {it.hsnCode || '—'}
                      {it.hsnCode && !isValidHsnSac(it.hsnCode) && (
                        <span className="status-bad ml-1.5 !px-1.5 !text-[9px]" title="HSN / SAC must be 4, 6 or 8 digits">Invalid</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[11px] text-gray-700">{it.gstApplicability === 'Applicable' ? `${it.gstRate}%` : '—'}</td>
                    <td className="px-4 py-2.5 text-[11px] text-gray-600">{it.typeOfSupply}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => remove(it)} className="text-[11px] font-semibold text-red-500 hover:text-red-700" title="Delete item">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <StockItemModal
          companyId={companyId}
          item={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); setTick((t) => t + 1); }}
        />
      )}
    </div>
  );
}
