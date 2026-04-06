'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function CustomerDetail({ params }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [mergeSearch, setMergeSearch] = useState('');
  const [mergeResults, setMergeResults] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCustomer = () => {
    fetch(`/api/customers/${id}`)
      .then(r => r.json())
      .then(data => { 
        setCustomer(data); 
        setEditForm({
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          notes: data.notes || ''
        });
        setLoading(false); 
      });
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  useEffect(() => {
    if (mergeSearch.length > 2) {
      fetch(`/api/customers?search=${mergeSearch}`)
        .then(r => r.json())
        .then(data => setMergeResults(data.filter(c => c.id !== parseInt(id))));
    } else {
      setMergeResults([]);
    }
  }, [mergeSearch, id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchCustomer();
      } else {
        const err = await res.json();
        alert(err.error || 'Identity update failed');
      }
    } catch (err) {
      alert('Internal sync error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMerge = async (targetId) => {
    if (!confirm('This will permanently consolidate all records. This action cannot be undone. Proceed?')) return;
    try {
      const res = await fetch('/api/customers/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: id, target_id: targetId })
      });
      if (res.ok) {
        window.location.href = `/customers/${targetId}`;
      } else {
        const err = await res.json();
        alert(err.error || 'Consolidation failed');
      }
    } catch (err) {
      alert('Network transmission error');
    }
  };

  const handleDelete = async () => {
    if (!confirm('DANGER: This record will be permanently purged. Continue?')) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) window.location.href = '/customers';
    } catch (err) { alert('Purge command failed'); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 bg-background font-sans">
      <div className="w-12 h-12 rounded-full border-4 border-theme-border border-t-emerald-500 animate-spin mb-4"></div>
      <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest text-center animate-pulse">Loading Client Data</p>
    </div>
  );
  
  if (!customer) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 bg-background font-sans">
      <div className="w-16 h-16 bg-surface border border-theme-border rounded-full flex items-center justify-center mb-4 text-theme-text-muted">
        <span className="material-symbols-outlined text-4xl">no_accounts</span>
      </div>
      <h3 className="text-xl font-bold text-theme-text tracking-tighter">Client Profile Not Found</h3>
    </div>
  );

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="min-h-screen bg-background text-theme-text p-4 lg:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-fade-in-up">
        
        {/* Header Profile Section */}
        <div className="bg-surface border border-theme-border rounded-[3rem] p-8 md:p-10 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/2 group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
          
          <Link href="/customers" className="inline-flex items-center gap-2 text-[10px] font-black text-theme-text-muted hover:text-emerald-500 transition-colors uppercase tracking-[0.2em] mb-6 relative z-10 w-fit p-2 -ml-2 rounded-xl hover:bg-slate-800">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Client Registry
          </Link>
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center relative z-10">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-slate-800 text-emerald-500 border border-emerald-500/20 flex items-center justify-center text-4xl md:text-5xl font-black shadow-inner shrink-0 group-hover:-translate-y-1 transition-transform">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 space-y-3">
               <div className="flex flex-col md:flex-row md:items-center gap-4">
                 <h1 className="text-4xl md:text-5xl font-black text-theme-text tracking-tighter">{customer.name}</h1>
                 {(customer.loyalty_points > 500) && (
                   <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border border-amber-500/20 w-max shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                     <span className="material-symbols-outlined text-[14px]">kid_star</span>
                     Gold Tier
                   </span>
                 )}
               </div>
               <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-slate-400 text-sm font-medium">
                 <div className="flex items-center gap-2 bg-background w-fit px-3 py-1.5 rounded-xl border border-theme-border/50">
                   <span className="material-symbols-outlined text-theme-text-muted text-[18px]">phone_iphone</span>
                   <span>{customer.phone || 'No phone'}</span>
                 </div>
                 {customer.email && (
                   <div className="flex items-center gap-2 bg-background w-fit px-3 py-1.5 rounded-xl border border-theme-border/50">
                     <span className="material-symbols-outlined text-theme-text-muted text-[18px]">mail</span>
                     <span>{customer.email}</span>
                   </div>
                 )}
               </div>
            </div>
            
            <div className="flex flex-wrap gap-3 shrink-0">
               <button 
                 onClick={() => setShowEditModal(true)}
                 className="px-6 py-4 bg-background border border-theme-border text-theme-text rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 hover:text-theme-text transition-all flex items-center gap-2"
               >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Edit Profile
               </button>
               <button 
                 onClick={() => setShowMergeModal(true)}
                 className="px-6 py-4 bg-background border border-amber-500/20 text-amber-500 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-amber-500/10 transition-all flex items-center gap-2"
               >
                  <span className="material-symbols-outlined text-[16px]">merge</span>
                  Consolidate
               </button>
               <button 
                 onClick={handleDelete}
                 className="w-12 h-12 flex items-center justify-center bg-background border border-red-500/20 text-red-500 rounded-[1.5rem] hover:bg-red-500/10 transition-all"
               >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
               </button>
               <Link href="/orders/new" className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-theme-text rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center gap-2 ml-2">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  New Order
               </Link>
            </div>
          </div>
        </div>
  
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface rounded-[2rem] p-6 border border-theme-border flex flex-col justify-between group hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
               <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <span className="material-symbols-outlined text-2xl">receipt_long</span>
               </div>
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted">History</span>
            </div>
            <div>
              <h2 className="text-3xl font-black text-theme-text tracking-tighter">{customer.order_count || 0}</h2>
              <p className="text-[10px] text-theme-text-muted font-bold mt-1 uppercase tracking-widest">Total Orders</p>
            </div>
          </div>
  
          <div className="bg-emerald-500/5 rounded-[2rem] p-6 border border-emerald-500/20 flex flex-col justify-between group relative overflow-hidden transition-colors">
            <div className="absolute right-0 bottom-0 text-emerald-500/5 translate-x-1/4 translate-y-1/4 pointer-events-none group-hover:scale-110 transition-transform">
               <span className="material-symbols-outlined text-9xl">payments</span>
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
               <div className="w-12 h-12 rounded-[1.25rem] bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
               </div>
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">LTV</span>
            </div>
            <div className="relative z-10">
               <span className="text-emerald-500 font-black mr-1">₹</span>
               <span className="text-4xl font-black text-theme-text tracking-tighter">{(customer.total_spent || 0).toLocaleString('en-IN')}</span>
              <p className="text-[10px] text-emerald-500 border border-emerald-500/20 bg-emerald-500/10 w-max px-2 py-0.5 rounded mt-2 font-bold uppercase tracking-widest">Lifetime Value</p>
            </div>
          </div>
  
          <div className="bg-surface rounded-[2rem] p-6 border border-theme-border flex flex-col justify-between group hover:border-amber-500/20 transition-colors">
            <div className="flex justify-between items-start mb-4">
               <div className="w-12 h-12 rounded-[1.25rem] bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
               </div>
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted group-hover:text-amber-500 transition-colors">Rewards</span>
            </div>
            <div>
              <h2 className="text-3xl font-black text-amber-400 tracking-tighter drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">{customer.loyalty_points || 0}</h2>
              <p className="text-[10px] text-theme-text-muted group-hover:text-amber-500/70 font-bold mt-1 uppercase tracking-widest transition-colors">Loyalty Points</p>
            </div>
          </div>
  
          <div className="bg-surface rounded-[2rem] p-6 border border-theme-border flex flex-col justify-between group hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
               <div className="w-12 h-12 rounded-[1.25rem] bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700">
                  <span className="material-symbols-outlined text-2xl">calendar_month</span>
               </div>
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted">Tenure</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-theme-text tracking-tighter leading-tight pr-4">{formatDate(customer.created_at)}</h2>
              <p className="text-[10px] text-theme-text-muted font-bold mt-1 uppercase tracking-widest">Customer Since</p>
            </div>
          </div>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start animate-fade-in-up">
          
          {/* Left Column: Details & Notes */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-surface rounded-[2.5rem] p-8 border border-theme-border group hover:border-slate-700 transition-colors">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                Primary Address
              </h3>
              <p className="text-sm font-bold text-theme-text leading-relaxed group-hover:text-theme-text transition-colors p-4 bg-background rounded-2xl border border-theme-border/50">
                {customer.address || "No address verified"}
              </p>
            </div>
  
            <div className="bg-surface rounded-[2.5rem] p-8 border border-theme-border group hover:border-slate-700 transition-colors">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">sticky_note_2</span>
                Internal Notes
              </h3>
              <div className="p-4 bg-background rounded-2xl border-l-2 border-theme-border group-hover:border-emerald-500 transition-colors">
                 <p className="text-sm font-medium text-slate-400 leading-relaxed italic">
                   {customer.notes ? `"${customer.notes}"` : "No internal field notes recorded."}
                 </p>
              </div>
            </div>
          </div>
  
          {/* Right Column: Order History */}
          <div className="md:col-span-2">
            <div className="bg-surface rounded-[2.5rem] border border-theme-border overflow-hidden h-full flex flex-col">
              <div className="px-8 py-6 border-b border-theme-border flex justify-between items-center bg-surface/50 shrink-0">
                <h3 className="text-lg font-black text-theme-text tracking-tighter flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">history</span>
                  Transaction History
                </h3>
              </div>
              
              <div className="overflow-x-auto overflow-y-auto no-scrollbar flex-1">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-theme-border text-[9px] uppercase tracking-[0.2em] font-black text-theme-text-muted bg-background/30">
                      <th className="py-4 px-8">Order ID</th>
                      <th className="py-4 px-6 text-center">Items</th>
                      <th className="py-4 px-6 text-right">Total</th>
                      <th className="py-4 px-8 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {(!customer.orders || customer.orders.length === 0) ? (
                      <tr>
                        <td colSpan="4" className="py-20 text-center text-theme-text-muted">
                          <span className="material-symbols-outlined text-5xl mb-4 text-slate-700">receipt_long</span>
                          <p className="text-[10px] font-black uppercase tracking-widest">No previous transactions</p>
                        </td>
                      </tr>
                    ) : (
                      customer.orders.map(o => (
                        <tr key={o.id} className="group hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/orders/${o.id}`}>
                          <td className="py-5 px-8">
                            <p className="text-sm font-black text-emerald-500 group-hover:text-emerald-400 transition-colors">{o.order_number}</p>
                            <p className="text-[10px] font-bold text-theme-text-muted mt-1">{formatDate(o.created_at)}</p>
                          </td>
                          <td className="py-5 px-6 text-center">
                            <span className="text-[10px] font-black text-theme-text bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">{o.item_count}</span>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <span className="text-sm font-black text-theme-text">₹{o.total_amount?.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="py-5 px-8 text-center">
                             <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${
                               o.status === 'delivered' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                               o.status === 'ready' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                               o.status === 'processing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                               'bg-amber-500/10 text-amber-500 border-amber-500/20'
                             }`}>
                               {o.status}
                             </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
  
        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-surface rounded-[3rem] w-[95%] max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-theme-border animate-scale-in flex flex-col max-h-[90vh]">
              <div className="p-8 md:p-10 border-b border-theme-border/50 relative shrink-0">
                 <h2 className="text-2xl font-black text-theme-text tracking-tighter mb-1">Refine Profile</h2>
                 <p className="text-[10px] text-theme-text-muted font-black uppercase tracking-widest">Update identity records for {customer.name}</p>
                 <button onClick={() => setShowEditModal(false)} className="absolute top-8 right-8 w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-theme-text rounded-full flex items-center justify-center transition-all">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                 </button>
              </div>
              
              <div className="p-8 md:p-10 overflow-y-auto no-scrollbar shrink">
                <form id="editForm" onSubmit={handleUpdate} className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted ml-4">Name</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-background border border-theme-border rounded-[1.5rem] py-4 px-6 text-sm font-bold text-theme-text focus:border-emerald-500/50 transition-all outline-none" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted ml-4">Phone</label>
                      <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-background border border-theme-border rounded-[1.5rem] py-4 px-6 text-sm font-bold text-theme-text focus:border-emerald-500/50 transition-all outline-none" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted ml-4">Email</label>
                      <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-background border border-theme-border rounded-[1.5rem] py-4 px-6 text-sm font-bold text-theme-text focus:border-emerald-500/50 transition-all outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted ml-4">Address</label>
                    <input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full bg-background border border-theme-border rounded-[1.5rem] py-4 px-6 text-sm font-bold text-theme-text focus:border-emerald-500/50 transition-all outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted ml-4">Notes</label>
                    <textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="w-full bg-background border border-theme-border rounded-[1.5rem] py-4 px-6 text-sm font-bold text-theme-text focus:border-emerald-500/50 transition-all outline-none h-24 no-scrollbar resize-none" />
                  </div>
                </form>
              </div>

              <div className="p-8 md:p-10 shrink-0 bg-background/50 border-t border-theme-border/50 flex gap-4 mt-auto">
                 <button type="button" onClick={() => setShowEditModal(false)} className="flex-[1] py-4 bg-surface border border-theme-border text-slate-400 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Discard</button>
                 <button form="editForm" type="submit" disabled={isSaving} className="flex-[2] py-4 bg-emerald-600 border border-emerald-500 text-theme-text rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 transition-all disabled:opacity-50">
                    {isSaving ? 'Syncing...' : 'Synchronize'}
                 </button>
              </div>
            </div>
          </div>
        )}
  
        {/* Merge Modal */}
        {showMergeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
            <div className="bg-surface rounded-[3rem] w-[95%] max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-theme-border animate-scale-in flex flex-col max-h-[90vh]">
              <div className="p-8 md:p-10 border-b border-theme-border/50 relative shrink-0">
                 <h2 className="text-2xl font-black text-amber-500 tracking-tighter mb-1">Consolidate Records</h2>
                 <p className="text-[10px] text-theme-text-muted font-black uppercase tracking-widest">Merge {customer.name} into another profile</p>
                 <button onClick={() => setShowMergeModal(false)} className="absolute top-8 right-8 w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-theme-text rounded-full flex items-center justify-center transition-all">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                 </button>
              </div>
              
              <div className="p-8 md:p-10 overflow-y-auto no-scrollbar shrink">
                 <div className="relative mb-6">
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-theme-text-muted text-[18px]">search</span>
                    <input 
                      type="text" 
                      placeholder="Search master record by name or phone..." 
                      className="w-full bg-background border border-theme-border rounded-[1.5rem] py-4 pl-12 pr-6 text-sm font-bold text-theme-text focus:outline-none focus:border-amber-500/50 transition-all"
                      value={mergeSearch}
                      onChange={e => setMergeSearch(e.target.value)}
                    />
                 </div>
                 
                 <div className="max-h-60 overflow-y-auto space-y-3 no-scrollbar">
                    {mergeResults.map(c => (
                      <div key={c.id} className="p-4 bg-background border border-theme-border rounded-2xl flex justify-between items-center hover:border-amber-500/30 group transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-[1rem] bg-slate-800 text-slate-400 flex items-center justify-center font-black text-lg group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors">{c.name.charAt(0)}</div>
                            <div>
                               <p className="text-sm font-black text-theme-text">{c.name}</p>
                               <p className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest">{c.phone}</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => handleMerge(c.id)}
                           className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-theme-text rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-[0_0_15px_rgba(217,119,6,0.2)]"
                         >Select</button>
                      </div>
                    ))}
                    {mergeSearch.length > 2 && mergeResults.length === 0 && (
                      <div className="py-8 text-center bg-background border border-theme-border border-dashed rounded-2xl">
                         <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest">No matching records found</p>
                      </div>
                    )}
                 </div>
              </div>
              
              <div className="p-8 md:p-10 shrink-0 bg-background/50 border-t border-theme-border/50 flex mt-auto">
                 <button onClick={() => setShowMergeModal(false)} className="w-full py-5 bg-surface border border-theme-border text-slate-400 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Abort Consolidation</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .animate-scale-in { animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}} />
    </div>
  );
}
