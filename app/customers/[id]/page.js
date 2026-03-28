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
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
      <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin mb-4"></div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Client Data</p>
    </div>
  );
  
  if (!customer) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
        <span className="material-symbols-outlined text-4xl">no_accounts</span>
      </div>
      <h3 className="text-xl font-bold text-on-surface">Client Profile Not Found</h3>
    </div>
  );

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 min-h-screen">
      
      {/* Header Profile Section */}
      <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-slate-100 shadow-xl shadow-emerald-900/5 relative overflow-hidden animate-fade-in-up">
        {/* ... existing decorative elements ... */}
        
        <Link href="/customers" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest mb-6 relative z-10">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Client Registry
        </Link>
        
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 flex items-center justify-center text-4xl md:text-5xl font-black shadow-inner border border-emerald-100/50 shrink-0">
            {customer.name.charAt(0)}
          </div>
          
          <div className="flex-1 space-y-3">
             <div className="flex flex-col md:flex-row md:items-center gap-4">
               <h1 className="text-4xl md:text-5xl font-black text-on-surface font-headline tracking-tighter">{customer.name}</h1>
               {(customer.loyalty_points > 500) && (
                 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-black uppercase tracking-widest border border-amber-200 w-max">
                   <span className="material-symbols-outlined text-[14px]">kid_star</span>
                   Gold Tier
                 </span>
               )}
             </div>
             <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-slate-500">
               <div className="flex items-center gap-2">
                 <span className="material-symbols-outlined text-slate-400">phone_iphone</span>
                 <span className="font-bold">{customer.phone}</span>
               </div>
               {customer.email && (
                 <div className="flex items-center gap-2">
                   <span className="material-symbols-outlined text-slate-400">mail</span>
                   <span className="font-bold">{customer.email}</span>
                 </div>
               )}
             </div>
          </div>
          
          <div className="flex flex-wrap gap-3 shrink-0">
             <button 
               onClick={() => setShowEditModal(true)}
               className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
             >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit Profile
             </button>
             <button 
               onClick={() => setShowMergeModal(true)}
               className="px-6 py-3 bg-white border border-amber-200 text-amber-700 rounded-2xl font-bold text-sm hover:bg-amber-50 transition-all flex items-center gap-2 shadow-sm"
             >
                <span className="material-symbols-outlined text-[18px]">merge</span>
                Consolidate
             </button>
             <button 
               onClick={handleDelete}
               className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all"
             >
                <span className="material-symbols-outlined">delete</span>
             </button>
             <Link href="/orders/new" className="px-6 py-3 primary-gradient text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-900/10 active:scale-95 transition-all shimmer-btn flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                New Order
             </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up stagger-1">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
             <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">receipt_long</span>
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">History</span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-on-surface font-headline">{customer.order_count || 0}</h2>
            <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Total Orders</p>
          </div>
        </div>

        <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute right-0 bottom-0 text-emerald-500/10 translate-x-1/4 translate-y-1/4">
             <span className="material-symbols-outlined text-9xl">payments</span>
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
             <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">LTV</span>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-emerald-900 font-headline tracking-tighter">₹{(customer.total_spent || 0).toLocaleString('en-IN')}</h2>
            <p className="text-xs text-emerald-700 font-bold mt-1 uppercase tracking-widest">Total Spent</p>
          </div>
        </div>

        <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 shadow-sm flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
             <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Rewards</span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-amber-900 font-headline">{customer.loyalty_points || 0}</h2>
            <p className="text-xs text-amber-700 font-bold mt-1 uppercase tracking-widest">Loyalty Points</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
             <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">calendar_month</span>
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tenure</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-on-surface font-headline leading-tight pr-4">{formatDate(customer.created_at)}</h2>
            <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Customer Since</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-4 animate-fade-in-up stagger-2">
        
        {/* Left Column: Details & Notes */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm group">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              Primary Address
            </h3>
            <p className="text-sm font-medium text-slate-700 leading-relaxed group-hover:text-emerald-800 transition-colors">
              {customer.address || "No address verified"}
            </p>
          </div>

          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm group">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">sticky_note_2</span>
              Internal Notes
            </h3>
            <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-l-2 border-emerald-200 pl-4 py-1 group-hover:border-emerald-500 transition-colors">
              {customer.notes ? `"${customer.notes}"` : "No internal field notes recorded."}
            </p>
          </div>
        </div>

        {/* Right Column: Order History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black font-headline text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">history</span>
                Transaction History
              </h3>
            </div>
            
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-widest font-black text-slate-400 bg-white">
                    <th className="py-4 px-8 font-black">Order ID</th>
                    <th className="py-4 px-6 text-center">Items</th>
                    <th className="py-4 px-6 text-right">Total</th>
                    <th className="py-4 px-8 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(!customer.orders || customer.orders.length === 0) ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2 block text-slate-300">receipt_long</span>
                        <p className="text-xs font-bold uppercase tracking-widest">No previous transactions</p>
                      </td>
                    </tr>
                  ) : (
                    customer.orders.map(o => (
                      <tr key={o.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer relative" onClick={() => window.location.href = `/orders/${o.id}`}>
                        <td className="py-5 px-8">
                          <p className="text-sm font-black text-emerald-700 group-hover:text-emerald-800 transition-colors">{o.order_number}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{formatDate(o.created_at)}</p>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">{o.item_count}</span>
                        </td>
                        <td className="py-5 px-6 text-right">
                          <span className="text-sm font-bold text-on-surface">₹{o.total_amount?.toLocaleString('en-IN')}</span>
                        </td>
                        <td className="py-5 px-8 text-center">
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                             o.status === 'delivered' ? 'bg-slate-100 text-slate-500' :
                             o.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                             o.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                             'bg-amber-100 text-amber-700'
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 md:p-10 shadow-2xl relative animate-fade-in-up">
            <h2 className="text-3xl font-black font-headline uppercase italic leading-none mb-2">Refine Profile</h2>
            <p className="text-slate-500 font-medium italic mb-8">Update identity records for {customer.name}</p>
            
            <form onSubmit={handleUpdate} className="space-y-6">
               <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Name</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Phone</label>
                      <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Email</label>
                      <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Address</label>
                    <input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Notes</label>
                    <textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none h-24 no-scrollbar" />
                  </div>
               </div>
               
               <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                  <button type="submit" disabled={isSaving} className="flex-[2] py-4 premium-gradient text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all shimmer-btn">
                     {isSaving ? 'Syncing...' : 'Synchronize Identity'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 md:p-10 shadow-2xl relative animate-fade-in-up">
            <h2 className="text-3xl font-black font-headline uppercase italic leading-none mb-2 text-amber-600">Consolidate Records</h2>
            <p className="text-slate-500 font-medium italic mb-8">Merge {customer.name} into another primary profile.</p>
            
            <div className="space-y-6">
               <div className="relative">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                  <input 
                    type="text" 
                    placeholder="Search master record by name or phone..." 
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-black focus:ring-4 focus:ring-amber-500/10 transition-all outline-none"
                    value={mergeSearch}
                    onChange={e => setMergeSearch(e.target.value)}
                  />
               </div>
               
               <div className="max-h-60 overflow-y-auto space-y-2 no-scrollbar">
                  {mergeResults.map(c => (
                    <div key={c.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center hover:bg-amber-50 transition-colors border border-transparent hover:border-amber-200">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-xs text-amber-700 border border-amber-100 shadow-sm">{c.name.charAt(0)}</div>
                          <div>
                             <p className="text-sm font-black text-on-surface">{c.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.phone}</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => handleMerge(c.id)}
                         className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                       >Merge Here</button>
                    </div>
                  ))}
                  {mergeSearch.length > 2 && mergeResults.length === 0 && (
                    <p className="text-center py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">No matching records found</p>
                  )}
               </div>
               
               <button onClick={() => setShowMergeModal(false)} className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Abort Consolidation</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
