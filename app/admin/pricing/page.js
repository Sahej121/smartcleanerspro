'use client';
import { useState, useEffect } from 'react';
import { useUser, ROLES } from '@/lib/UserContext';

export default function PricingPage() {
  const { user, role } = useUser();
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ garment_type: '', service_type: 'Dry Cleaning', price: '' });
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const isHeadOfSection = [ROLES.ADMIN, ROLES.OWNER, ROLES.SUPERADMIN].includes(role) || user?.role === 'superadmin';

  const stats = {
    totalGarments: [...new Set(pricing.map(p => p.garment_type))].length,
    totalRules: pricing.length,
    avgPrice: pricing.length ? (pricing.reduce((acc, curr) => acc + parseFloat(curr.price), 0) / pricing.length).toFixed(2) : 0
  };

  useEffect(() => {
    fetch('/api/pricing').then(r => r.json()).then(d => { setPricing(d); setLoading(false); });
  }, []);

  const getServiceColor = (service) => {
    switch (service) {
      case 'Dry Cleaning': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Washing': return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
      case 'Ironing': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Stain Removal': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'Express Service': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'Polishing': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const startEdit = (item) => {
    if (!isHeadOfSection) return;
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

  // Group and Sort
  const grouped = {};
  pricing
    .filter(p => p.garment_type.toLowerCase().includes(searchQuery.toLowerCase()) || p.service_type.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.garment_type.localeCompare(b.garment_type);
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return 0;
    })
    .forEach(p => {
      if (!grouped[p.garment_type]) grouped[p.garment_type] = [];
      grouped[p.garment_type].push(p);
    });

  return (
    <div className="min-h-screen bg-background text-theme-text p-4 lg:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-10 animate-fade-in-up">
        
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
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-emerald-400 to-cyan-400 tracking-tighter">Pricing Matrix</h1>
                <p className="text-theme-text-muted font-medium text-sm mt-1">Configure price schedules for all garment and service combinations.</p>
             </div>
          </div>
          
          <div className="flex gap-4 relative z-10 w-full md:w-auto">
             {isHeadOfSection && (
               <button 
                 onClick={() => setShowAddModal(true)}
                 className="w-full md:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-theme-text rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  New Target Pricing
               </button>
             )}
          </div>
        </div>

        {/* Quick Stats Dashboard */}
        {!loading && pricing.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="bg-surface/40 backdrop-blur-sm border border-theme-border p-5 rounded-[2rem] hover:border-amber-500/30 transition-all group">
              <div className="text-[9px] font-black uppercase text-theme-text-muted tracking-widest mb-2 flex items-center gap-2 group-hover:text-amber-500 transition-colors">
                <span className="material-symbols-outlined text-[14px]">checkroom</span>
                Unique Garments
              </div>
              <div className="text-2xl font-black text-theme-text">{stats.totalGarments}</div>
            </div>
            <div className="bg-surface/40 backdrop-blur-sm border border-theme-border p-5 rounded-[2rem] hover:border-blue-500/30 transition-all group">
              <div className="text-[9px] font-black uppercase text-theme-text-muted tracking-widest mb-2 flex items-center gap-2 group-hover:text-blue-500 transition-colors">
                <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                Total Rules
              </div>
              <div className="text-2xl font-black text-theme-text">{stats.totalRules}</div>
            </div>
            <div className="bg-surface/40 backdrop-blur-sm border border-theme-border p-5 rounded-[2rem] hover:border-emerald-500/30 transition-all group">
              <div className="text-[9px] font-black uppercase text-theme-text-muted tracking-widest mb-2 flex items-center gap-2 group-hover:text-emerald-500 transition-colors">
                <span className="material-symbols-outlined text-[14px]">payments</span>
                Avg Pricing
              </div>
              <div className="text-2xl font-black text-theme-text flex items-baseline gap-1">
                <span className="text-sm">₹</span>{stats.avgPrice}
              </div>
            </div>
            <div className="bg-surface/40 backdrop-blur-sm border border-theme-border p-5 rounded-[2rem] hover:border-purple-500/30 transition-all group">
              <div className="text-[9px] font-black uppercase text-theme-text-muted tracking-widest mb-2 flex items-center gap-2 group-hover:text-purple-500 transition-colors">
                <span className="material-symbols-outlined text-[14px]">update</span>
                Last Sync
              </div>
              <div className="text-2xl font-black text-theme-text">Live</div>
            </div>
          </div>
        )}

        {/* Search & Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <div className="relative flex-[3] group z-20">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors pointer-events-none">search</span>
            <input 
              type="text" 
              placeholder="Search garments or services..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface/80 backdrop-blur-md border border-theme-border rounded-[2rem] py-4 pl-14 pr-12 text-sm font-bold text-theme-text focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-theme-text transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
          <div className="relative flex-[1] z-20">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-surface/80 backdrop-blur-md border border-theme-border rounded-[2rem] py-4 pl-14 pr-6 text-sm font-bold text-theme-text focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="name">Sort by Name</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {Object.entries(grouped).map(([garment, items], idx) => (
              <div key={garment} className="bg-surface/60 backdrop-blur-xl rounded-[2.5rem] border border-theme-border p-6 shadow-xl shadow-theme-shadow/10 group hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300 animate-fade-in-up flex flex-col relative overflow-hidden" style={{ animationDelay: `${idx * 50}ms` }}>
                
                {/* Decorative Background Blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/10 transition-colors pointer-events-none"></div>

                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-theme-border/50 relative z-10">
                  <div className="w-12 h-12 bg-background border border-theme-border rounded-[1.2rem] flex items-center justify-center text-slate-400 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-colors shadow-inner">
                    <span className="material-symbols-outlined">checkroom</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-theme-text tracking-tight group-hover:text-amber-400 transition-colors">{garment}</h2>
                    <span className="text-[9px] font-black text-theme-text-muted uppercase tracking-[0.2em]">{items.length} {items.length === 1 ? 'Service' : 'Services'}</span>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col gap-3 relative z-10">
                  {items.map(item => (
                    <div key={item.id} className={`p-4 rounded-[1.5rem] border transition-all duration-300 ${
                      editingId === item.id ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'bg-background border-theme-border/60 hover:border-amber-500/40 group/item hover:shadow-md'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2.5 py-1 text-[8px] uppercase font-black tracking-widest border rounded-md ${getServiceColor(item.service_type)}`}>
                          {item.service_type}
                        </span>
                      </div>

                      {editingId === item.id ? (
                        <div className="space-y-4 animate-scale-in mt-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-wider text-theme-text-muted px-1">Garment Name</label>
                            <input
                              className="w-full bg-surface border border-theme-border rounded-xl py-2 px-3 text-sm font-bold text-theme-text focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all"
                              value={item.garment_type}
                              onChange={e => {
                                setPricing(pricing.map(p => p.id === item.id ? { ...p, garment_type: e.target.value } : p));
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-wider text-theme-text-muted px-1">Service Type</label>
                            <select
                              className="w-full bg-surface border border-theme-border rounded-xl py-2 px-3 text-sm font-bold text-theme-text focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all appearance-none"
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
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-wider text-theme-text-muted px-1">Target Price (₹)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted font-black text-xs">₹</span>
                              <input
                                className="w-full bg-surface border border-theme-border rounded-xl py-2 pl-7 pr-3 text-sm font-black text-theme-text focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && saveEdit(item.id, item)}
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2 border-t border-theme-border/50">
                            <button className="flex-[2] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-emerald-50 text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-emerald-900/20 active:scale-95 transition-all" onClick={() => saveEdit(item.id, item)}>
                              Save
                            </button>
                            <button className="flex-[1] px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-[0.15em] active:scale-95 transition-all" onClick={() => {
                              setEditingId(null);
                              // Refresh pricing to discard unsaved name/service changes
                              fetch('/api/pricing').then(r => r.json()).then(d => setPricing(d));
                            }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center mt-1">
                          <div className="text-2xl font-black text-theme-text group-hover/item:text-amber-500 transition-colors tracking-tighter flex items-baseline gap-1">
                            <span className="text-sm font-bold text-theme-text-muted">₹</span>
                            {item.price}
                          </div>
                          {isHeadOfSection && (
                            <div className="flex gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <button 
                                className="bg-surface/50 border border-theme-border text-slate-400 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 transition-all shadow-sm" 
                                onClick={() => startEdit(item)} 
                                title="Edit Pricing"
                              >
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                              </button>
                              <button 
                                className="bg-surface/50 border border-theme-border text-slate-400 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all shadow-sm" 
                                onClick={() => handleDelete(item.id)} 
                                title="Delete Rule"
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {Object.keys(grouped).length === 0 && !loading && pricing.length > 0 && (
               <div className="col-span-full bg-surface/30 backdrop-blur-sm border border-theme-border border-dashed rounded-[3rem] p-16 flex flex-col items-center justify-center text-center shadow-inner">
                  <div className="w-20 h-20 bg-background rounded-3xl flex items-center justify-center text-slate-600 mb-6 shadow-sm border border-theme-border/50">
                    <span className="material-symbols-outlined text-4xl opacity-50">search_off</span>
                  </div>
                  <h3 className="text-xl font-black text-theme-text mb-2 tracking-tight">No Results Found</h3>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 max-w-sm leading-relaxed">No garments or services match your search query '{searchQuery}'.</p>
               </div>
            )}

            {pricing.length === 0 && !loading && (
               <div className="col-span-full bg-surface/30 backdrop-blur-sm border border-theme-border border-dashed rounded-[3rem] p-16 flex flex-col items-center justify-center text-center shadow-inner">
                  <div className="w-20 h-20 bg-background rounded-3xl flex items-center justify-center text-slate-600 mb-6 shadow-sm border border-theme-border/50">
                    <span className="material-symbols-outlined text-4xl opacity-50">money_off</span>
                  </div>
                  <h3 className="text-xl font-black text-theme-text mb-2 tracking-tight">No Pricing Configured</h3>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 max-w-sm leading-relaxed">Add new pricing rules to define service costs for different garments.</p>
               </div>
            )}
          </div>
        )}
        
        {/* Premium Modal Setup */}
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="bg-surface/90 backdrop-blur-3xl rounded-[3rem] w-[95%] max-w-lg shadow-[0_0_150px_rgba(245,158,11,0.1)] border border-theme-border/60 animate-scale-in flex flex-col max-h-[90vh] relative overflow-hidden">
              
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-500 opacity-50"></div>

              <div className="p-8 md:p-10 border-b border-theme-border/50 relative shrink-0">
                 <h2 className="text-2xl font-black text-theme-text tracking-tighter mb-1 relative z-10 flex items-center gap-3">
                   <div className="bg-amber-500/10 text-amber-500 w-10 h-10 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-inner">
                     <span className="material-symbols-outlined text-[20px]">sell</span>
                   </div>
                   New Pricing Rules
                 </h2>
                 <p className="text-[10px] text-theme-text-muted font-black uppercase tracking-widest mt-2 ml-[3.25rem]">Register pricing definitions to the master database</p>
                 <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 w-10 h-10 bg-surface border border-theme-border hover:bg-theme-border/50 text-slate-400 hover:text-theme-text rounded-full flex items-center justify-center transition-all">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                 </button>
              </div>
              
              <div className="p-8 md:p-10 space-y-6 overflow-y-auto no-scrollbar shrink">
                <div className="space-y-3 group/input">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted ml-2 block w-max transition-colors group-focus-within/input:text-amber-500">Garment Code Identity</label>
                  <input 
                    className="w-full bg-background/50 border border-theme-border/60 rounded-[1.5rem] py-4 px-6 text-sm font-bold text-theme-text focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all placeholder:text-slate-600 shadow-inner" 
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
                  <div className="space-y-3 group/select">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted ml-2 block w-max transition-colors group-focus-within/select:text-amber-500">Service Protocol</label>
                    <select 
                      className="w-full bg-background/50 border border-theme-border/60 rounded-[1.5rem] py-4 px-6 text-sm font-bold text-theme-text focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-inner appearance-none" 
                      value={newItem.service_type} 
                      onChange={e => setNewItem({ ...newItem, service_type: e.target.value })}
                    >
                      {['Dry Cleaning', 'Washing', 'Ironing', 'Stain Removal', 'Express Service', 'Polishing'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3 group/price">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted ml-2 block w-max transition-colors group-focus-within/price:text-amber-500">Target Price</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-theme-text-muted font-black">₹</span>
                      <input 
                        className="w-full bg-background/50 border border-theme-border/60 rounded-[1.5rem] py-4 pl-10 pr-6 text-sm font-bold text-theme-text focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all shadow-inner" 
                        type="number"
                        value={newItem.price} 
                        onChange={e => setNewItem({ ...newItem, price: e.target.value })} 
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-8 md:p-10 shrink-0 bg-background/30 border-t border-theme-border/50 flex gap-4 mt-auto">
                 <button className="flex-[1] py-4 bg-surface/50 border border-theme-border text-slate-400 hover:text-theme-text rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-surface transition-all" onClick={() => setShowAddModal(false)}>Discard</button>
                 <button 
                   className="flex-[2] py-4 bg-emerald-600/90 backdrop-blur border border-emerald-500 hover:bg-emerald-500 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_25px_rgba(16,185,129,0.25)] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100" 
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
