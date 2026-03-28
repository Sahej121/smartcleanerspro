'use client';

import { useState, useEffect } from 'react';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [receiveQty, setReceiveQty] = useState('');
  const [auditQty, setAuditQty] = useState('');

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setInventory(data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleReceiveStock = async () => {
    if (!selectedItem || !receiveQty) return;
    try {
      await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedItem.id, quantity: parseFloat(receiveQty), action: 'receive' }),
      });
      setShowReceiveModal(false);
      setSelectedItem(null);
      setReceiveQty('');
      fetchInventory();
    } catch (error) {
      console.error('Failed to receive stock:', error);
    }
  };

  const handleAuditStock = async () => {
    if (!selectedItem || !auditQty) return;
    try {
      await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedItem.id, quantity: parseFloat(auditQty) }),
      });
      setShowAuditModal(false);
      setSelectedItem(null);
      setAuditQty('');
      fetchInventory();
    } catch (error) {
      console.error('Failed to audit stock:', error);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Optimal') return 'bg-emerald-100 text-emerald-800';
    if (status === 'Low Stock') return 'bg-amber-100 text-amber-800';
    if (status === 'Medium') return 'bg-blue-100 text-blue-800';
    return 'bg-slate-100 text-slate-800';
  };

  const getCategoryIcon = () => 'inventory_2';

  const filteredInventory = inventory.filter(item =>
    item.item_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Compute hero stats from real data
  const totalValue = inventory.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
  const lowStockCount = inventory.filter(i => i.status === 'Low Stock').length;
  const totalItems = inventory.length;

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto min-h-screen">
      {/* Page Header */}
      <div className="flex justify-between items-end animate-fade-in-up">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">Inventory Control</h1>
          <p className="text-on-surface-variant font-medium text-lg">Manage your atelier's resources and material stock levels.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 rounded-2xl border border-slate-200 bg-white font-bold text-sm text-on-surface hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">download</span>
            Export Audit
          </button>
          <button
            onClick={() => { setSelectedItem(null); setShowReceiveModal(true); }}
            className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-900/10 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Receive Stock
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between group animate-fade-in-up stagger-1">
          <div className="flex justify-between items-start mb-4">
             <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined">account_balance_wallet</span>
             </div>
             <span className="text-xs font-bold text-slate-400">Total Items</span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-on-surface font-headline">{totalItems}</h2>
            <p className="text-[10px] text-slate-500 font-bold mt-1 tracking-widest uppercase">Tracked in inventory</p>
          </div>
        </div>

        <div className={`rounded-3xl p-6 border shadow-sm flex flex-col justify-between group animate-fade-in-up stagger-2 ${lowStockCount > 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <div className="flex justify-between items-start mb-4">
             <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                <span className="material-symbols-outlined">{lowStockCount > 0 ? 'warning' : 'check_circle'}</span>
             </div>
             <span className={`text-xs font-bold uppercase tracking-widest ${lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>Alerts</span>
          </div>
          <div>
            <h2 className={`text-3xl font-black font-headline ${lowStockCount > 0 ? 'text-amber-900' : 'text-emerald-900'}`}>{lowStockCount} Items</h2>
            <p className={`text-[10px] font-bold mt-1 tracking-widest uppercase ${lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {lowStockCount > 0 ? 'Require reorder' : 'All stocked'}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between group animate-fade-in-up stagger-3">
          <div className="flex justify-between items-start mb-4">
             <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <span className="material-symbols-outlined">local_shipping</span>
             </div>
             <span className="text-xs font-bold text-slate-400">Stock Health</span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-on-surface font-headline">{totalItems > 0 ? Math.round(((totalItems - lowStockCount) / totalItems) * 100) : 100}%</h2>
            <p className="text-[10px] text-slate-500 font-bold mt-1 tracking-widest uppercase">Items at optimal levels</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between group animate-fade-in-up stagger-4">
          <div className="flex justify-between items-start mb-4">
             <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <span className="material-symbols-outlined">straighten</span>
             </div>
             <span className="text-xs font-bold text-slate-400">Total Stock</span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-on-surface font-headline">{totalValue.toLocaleString()}</h2>
            <p className="text-[10px] text-slate-500 font-bold mt-1 tracking-widest uppercase">Units across all items</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between animate-fade-in-up stagger-4 mt-4">
        <div className="relative w-full max-w-md group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 hover:border-slate-300 transition-all outline-none shadow-sm"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm overflow-x-auto border border-slate-100 animate-fade-in-up stagger-5">
        <div className="min-w-[700px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-widest font-black text-slate-400">
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4">Est. Run Out</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 hidden md:table-cell">Reorder Level</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <div className="w-8 h-8 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin mx-auto mb-4"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Stock Data</p>
                  </td>
                </tr>
              ) : filteredInventory.length > 0 ? (
                filteredInventory.map((item, idx) => {
                  const reorderLevel = parseFloat(item.reorder_level) || 10;
                  const qty = parseFloat(item.quantity) || 0;
                  const maxStock = Math.max(reorderLevel * 4, qty);
                  const percent = Math.min(100, (qty / maxStock) * 100);
                  const isLow = qty <= reorderLevel;

                  return (
                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors row-enter" style={{ animationDelay: `${idx * 40}ms` }}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                              <span className="material-symbols-outlined text-xl">{getCategoryIcon()}</span>
                           </div>
                           <div>
                             <p className="text-sm font-bold text-on-surface group-hover:text-emerald-700 transition-colors">{item.item_name}</p>
                             <p className="text-[11px] text-slate-500 font-medium">ID-{item.id} • {item.unit}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 w-1/4 min-w-[200px]">
                        <div className="flex justify-between items-end mb-1">
                          <span className="text-xs font-bold text-on-surface">{qty.toLocaleString()} <span className="text-slate-400 font-medium">{item.unit}</span></span>
                          <span className="text-[10px] font-bold text-slate-400">{percent.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {item.runway_days ? (
                          <div>
                            <p className="text-xs font-bold text-on-surface">
                              {new Date(Date.now() + item.runway_days * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-tighter">~{item.runway_days} days left</p>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 italic">Calculating...</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 hidden md:table-cell">
                        <span className="text-xs font-semibold text-slate-600">{reorderLevel} {item.unit}</span>
                      </td>
                      <td className="px-6 py-5 text-right flex justify-end gap-2">
                        <button
                          onClick={() => { setSelectedItem(item); setAuditQty(item.quantity); setShowAuditModal(true); }}
                          title="Audit Current Stock"
                          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors inline-flex items-center justify-center underline decoration-dotted"
                        >
                           <span className="material-symbols-outlined text-[20px]">equalizer</span>
                        </button>
                        <button
                          onClick={() => { setSelectedItem(item); setReceiveQty(''); setShowReceiveModal(true); }}
                          title="Add Received Stock"
                          className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors inline-flex items-center justify-center"
                        >
                           <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">inventory</span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Items Found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Stock Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-[2rem] w-full sm:w-[95%] max-w-md shadow-2xl border border-outline-variant/20 overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <span className="material-symbols-outlined">equalizer</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-on-surface text-lg">Inventory Audit</h3>
                  <p className="text-xs font-medium text-slate-500">
                    Update current absolute stock for {selectedItem?.item_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200/50 text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Why audit?
                </p>
                <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                  Enter the actual amount currently on the shelf. The system will use this to calculate your daily burn rate and predict your run-out date.
                </p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Actual Quantity Remaining</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  autoFocus
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-300"
                  placeholder={selectedItem ? `Currently ${selectedItem.quantity} ${selectedItem.unit}` : ''}
                  value={auditQty}
                  onChange={e => setAuditQty(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 mt-2 italic font-medium px-1">Note: This will set the total stock count to exactly this value.</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAuditStock}
                disabled={!selectedItem || auditQty === ''}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 shadow-md hover:bg-indigo-900 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                Record Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Stock Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-[2rem] w-full sm:w-[95%] max-w-md shadow-2xl border border-outline-variant/20 overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined">add_shopping_cart</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-on-surface text-lg">Receive Stock</h3>
                  <p className="text-xs font-medium text-slate-500">
                    {selectedItem ? selectedItem.item_name : 'Select an item below'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200/50 text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {!selectedItem && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Select Item</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    onChange={e => setSelectedItem(inventory.find(i => i.id === parseInt(e.target.value)))}
                  >
                    <option value="">Choose an item...</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>{item.item_name} ({item.quantity} {item.unit})</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Quantity to Add</label>
                <input
                  type="number"
                  min="1"
                  autoFocus
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-300"
                  placeholder="e.g. 50"
                  value={receiveQty}
                  onChange={e => setReceiveQty(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => setShowReceiveModal(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReceiveStock}
                disabled={!selectedItem || !receiveQty}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white primary-gradient shadow-md shadow-primary/20 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                Confirm Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
