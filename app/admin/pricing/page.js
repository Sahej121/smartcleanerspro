'use client';
import { useState, useEffect } from 'react';

export default function PricingPage() {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ garment_type: '', service_type: 'Dry Cleaning', price: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/pricing').then(r => r.json()).then(d => { setPricing(d); setLoading(false); });
  }, []);

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditValue(item.price.toString());
  };

  const saveEdit = async (id, updatedData = null) => {
    const price = updatedData ? parseFloat(updatedData.price) : parseFloat(editValue);
    if (isNaN(price) || price < 0) return;

    try {
      const body = updatedData ? { id, ...updatedData, price } : { id, price };
      const res = await fetch('/api/pricing', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Idempotency-Key': crypto.randomUUID()
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to update price');

      setPricing(pricing.map(p => p.id === id ? { ...p, ...body } : p));
      setEditingId(null);
      setMessage('Pricing updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      alert('Failed to update pricing. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this pricing entry?')) return;
    
    try {
      const res = await fetch(`/api/pricing?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      setPricing(pricing.filter(p => p.id !== id));
      setMessage('Pricing entry deleted');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      alert('Failed to delete pricing entry.');
    }
  };
  
  const handleAdd = async () => {
    const price = parseFloat(newItem.price);
    if (!newItem.garment_type || !newItem.service_type || isNaN(price)) return;
    
    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Idempotency-Key': crypto.randomUUID()
        },
        body: JSON.stringify({ ...newItem, price }),
      });
      
      if (res.ok) {
        const added = await res.json();
        setPricing([...pricing, added]);
        setShowAddModal(false);
        setNewItem({ garment_type: '', service_type: 'Dry Cleaning', price: '' });
        setMessage('New pricing tier configured');
        setTimeout(() => setMessage(''), 3000);
      } else {
        alert('Failed to add price.');
      }
    } catch (error) {
      alert('Network error. Failed to add price.');
    }
  };

  // Group by garment type
  const grouped = {};
  pricing.forEach(p => {
    if (!grouped[p.garment_type]) grouped[p.garment_type] = [];
    grouped[p.garment_type].push(p);
  });

  return (
    <div className="min-h-screen bg-background text-theme-text p-4 lg:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-fade-in-up">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-surface border border-theme-border p-8 rounded-[3rem] relative overflow-hidden group shadow-2xl shadow-theme-shadow/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

          <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
             <div className="w-16 h-16 rounded-[1.5rem] bg-background border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.1)] group-hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] transition-all shrink-0">
               <span className="material-symbols-outlined text-3xl">currency_rupee</span>
             </div>
             <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">Administration</span>
                </div>
                <h1 className="text-4xl font-black text-theme-text tracking-tighter">Pricing Matrix</h1>
                <p className="text-theme-text-muted font-medium text-sm mt-1">Configure price schedules for all garment and service combinations.</p>
             </div>
          </div>
          
          <div className="flex gap-4 relative z-10 w-full md:w-auto">
             <button 
               onClick={() => setShowAddModal(true)}
               className="w-full md:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-theme-text rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2"
             >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                New Target Pricing
             </button>
          </div>
        </div>

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-fade-in shadow-sm w-fit">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
             <div className="w-12 h-12 rounded-full border-4 border-theme-border border-t-amber-500 animate-spin"></div>
             <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest animate-pulse">Syncing Database...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([garment, items], idx) => (
              <div key={garment} className="bg-surface rounded-[2.5rem] border border-theme-border p-8 shadow-sm group hover:border-slate-700 transition-colors animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-theme-border/50">
                  <span className="text-[10px] font-black bg-background text-theme-text-muted border border-theme-border px-3 py-1.5 rounded-[1rem] uppercase tracking-[0.2em] group-hover:text-amber-500 group-hover:border-amber-500/30 transition-colors">
                    Garment Code
                  </span>
                  <h2 className="text-xl font-black text-theme-text">{garment}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map(item => (
                    <div key={item.id} className={`p-5 rounded-[1.5rem] border transition-all ${
                      editingId === item.id ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-background border-theme-border hover:border-amber-500/30 group/item'
                    }`}>
                      <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">sell</span>
                        {item.service_type}
                      </div>

                      {editingId === item.id ? (
                        <div className="space-y-4 animate-scale-in">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-theme-text-muted px-1">Garment Name</label>
                            <input
                              className="w-full bg-surface border border-theme-border rounded-xl py-2 px-3 text-sm font-bold text-theme-text focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                              value={item.garment_type}
                              onChange={e => {
                                setPricing(pricing.map(p => p.id === item.id ? { ...p, garment_type: e.target.value } : p));
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-theme-text-muted px-1">Service Type</label>
                            <select
                              className="w-full bg-surface border border-theme-border rounded-xl py-2 px-3 text-sm font-bold text-theme-text focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                              value={item.service_type}
                              onChange={e => {
                                setPricing(pricing.map(p => p.id === item.id ? { ...p, service_type: e.target.value } : p));
                              }}
                            >
                              {['Dry Cleaning', 'Washing', 'Ironing', 'Stain Removal', 'Express Service', 'Polishing'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-theme-text-muted px-1">Price (₹)</label>
                            <div className="flex items-center gap-2">
                              <input
                                className="w-full bg-surface border border-theme-border rounded-xl py-2 px-3 text-sm font-black text-theme-text focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && saveEdit(item.id, item)}
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-900/10" onClick={() => saveEdit(item.id, item)}>
                              Save changes
                            </button>
                            <button className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest" onClick={() => {
                              setEditingId(null);
                              // Refresh pricing to discard unsaved name/service changes
                              fetch('/api/pricing').then(r => r.json()).then(d => setPricing(d));
                            }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div className="text-2xl font-black text-theme-text group-hover/item:text-amber-400 transition-colors tracking-tighter">
                            <span className="text-sm font-bold text-theme-text-muted mr-1">₹</span>{item.price}
                          </div>
                          <div className="flex gap-2">
                            <button 
                              className="bg-surface border border-theme-border text-slate-400 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/20 transition-all opacity-0 group-hover/item:opacity-100" 
                              onClick={() => startEdit(item)} 
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                            </button>
                            <button 
                              className="bg-surface border border-theme-border text-slate-400 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all opacity-0 group-hover/item:opacity-100" 
                              onClick={() => handleDelete(item.id)} 
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {pricing.length === 0 && !loading && (
               <div className="bg-surface border border-theme-border border-dashed rounded-[3rem] p-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-background rounded-3xl flex items-center justify-center text-slate-600 mb-4">
                    <span className="material-symbols-outlined text-3xl">money_off</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Pricing Configured</p>
               </div>
            )}
          </div>
        )}
        
        {/* Modal Setup */}
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-surface rounded-[3rem] w-[95%] max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-theme-border animate-scale-in flex flex-col max-h-[90vh]">
              
              <div className="p-8 md:p-10 border-b border-theme-border/50 relative shrink-0">
                 <h2 className="text-2xl font-black text-theme-text tracking-tighter mb-1 relative z-10 flex items-center gap-3">
                   <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">sell</span>
                   New Pricing Rules
                 </h2>
                 <p className="text-[10px] text-theme-text-muted font-black uppercase tracking-widest">Register pricing definitions to the master database</p>
                 <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-theme-text rounded-full flex items-center justify-center transition-all">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                 </button>
              </div>
              
              <div className="p-8 md:p-10 space-y-6 overflow-y-auto no-scrollbar shrink">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted ml-4 block border-b border-theme-border/50 pb-2 mb-2 w-max pr-8">Garment Code Identity</label>
                  <input 
                    className="w-full bg-background border border-theme-border rounded-[1.5rem] py-4 px-6 text-sm font-bold text-theme-text focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-slate-700" 
                    value={newItem.garment_type} 
                    onChange={e => setNewItem({ ...newItem, garment_type: e.target.value })} 
                    placeholder="e.g. Silk Saree, Tuxedo"
                    list="garment-options"
                  />
                  <datalist id="garment-options">
                    {[...new Set(pricing.map(p => p.garment_type))].map(g => <option key={g} value={g} />)}
                  </datalist>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted ml-4 block border-b border-theme-border/50 pb-2 mb-2 w-max pr-4">Service Protocol</label>
                    <select 
                      className="w-full bg-background border border-theme-border rounded-[1.5rem] py-4 px-6 text-sm font-bold text-theme-text focus:outline-none focus:border-amber-500/50 transition-all" 
                      value={newItem.service_type} 
                      onChange={e => setNewItem({ ...newItem, service_type: e.target.value })}
                    >
                      {['Dry Cleaning', 'Washing', 'Ironing', 'Stain Removal', 'Express Service', 'Polishing'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted ml-4 block border-b border-theme-border/50 pb-2 mb-2 w-max pr-8">Target Price</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-theme-text-muted font-black">₹</span>
                      <input 
                        className="w-full bg-background border border-theme-border rounded-[1.5rem] py-4 pl-10 pr-6 text-sm font-bold text-theme-text focus:outline-none focus:border-amber-500/50 transition-all" 
                        type="number"
                        value={newItem.price} 
                        onChange={e => setNewItem({ ...newItem, price: e.target.value })} 
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-8 md:p-10 shrink-0 bg-background/50 border-t border-theme-border/50 flex gap-4 mt-auto">
                 <button className="flex-[1] py-4 bg-surface border border-theme-border text-slate-400 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all" onClick={() => setShowAddModal(false)}>Discard</button>
                 <button 
                   className="flex-[2] py-4 bg-emerald-600 border border-emerald-500 hover:bg-emerald-500 text-theme-text rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 transition-all disabled:opacity-50" 
                   onClick={handleAdd} 
                   disabled={!newItem.garment_type || !newItem.price}
                 >
                   Inject Ruleset
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
