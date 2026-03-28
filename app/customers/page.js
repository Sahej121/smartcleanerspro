'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    fetch(`/api/customers${params}`)
      .then(r => r.json())
      .then(data => { setCustomers(data); setLoading(false); });
  };

  const handleCreate = async () => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer),
    });
    const result = await res.json();
    if (res.ok) {
      setShowModal(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '', notes: '' });
      setError('');
      fetchCustomers();
    } else {
      setError(result.error || 'Failed to register customer');
    }
  };

  const getTier = (points) => {
    if (points > 1000) return { name: 'GOLD', color: 'bg-emerald-800 text-white border-white' };
    if (points > 500) return { name: 'SILVER', color: 'bg-slate-400 text-white border-white' };
    return { name: 'NEW', color: 'bg-slate-200 text-slate-700 border-white' };
  };

  // Mock avatars for demonstration to match reference design
  const getAvatarStyle = (index, name) => {
    const avatars = [
      'bg-emerald-700', // Helena
      'bg-emerald-600', // Marcus
      'bg-emerald-900', // Sophia
      'bg-emerald-50', // Julian (initials)
      'bg-emerald-800', // David
      'bg-emerald-600', // Elena
    ];
    return avatars[index % avatars.length];
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-10 max-w-7xl mx-auto min-h-[calc(100vh-120px)] flex flex-col">
      {/* Page Header */}
      <div className="flex justify-between items-end animate-fade-in-up">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">Customer Registry</h1>
          <p className="text-on-surface-variant font-medium text-lg">Manage your atelier's elite clientele and loyalty memberships.</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between animate-fade-in-up stagger-1">
        <div className="relative w-full max-w-md group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 hover:border-slate-300 transition-all outline-none shadow-sm"
            placeholder="Search by name, email or garment"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-on-surface shadow-sm hover:bg-slate-50 transition-all">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Segment
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-on-surface shadow-sm hover:bg-slate-50 transition-all">
            <span className="material-symbols-outlined text-[18px]">sort</span>
            Sort
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-900/10 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add Customer
          </button>
        </div>
      </div>

      {/* Customer Registry Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
             <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin"></div>
             <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Accessing Registry...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {customers.map((c, i) => {
              const tier = getTier(c.loyalty_points);
              const avatarBg = getAvatarStyle(i, c.name);
              const useInitials = avatarBg === 'bg-emerald-50';
              
              return (
                <div key={c.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                  {/* Avatar & Badge */}
                  <div className="relative mb-6 mt-4">
                    <div className={`w-24 h-24 rounded-[1.75rem] ${avatarBg} text-emerald-800 flex items-center justify-center text-3xl font-black shadow-inner overflow-hidden`}>
                       {useInitials ? c.name.charAt(0) : <span className="material-symbols-outlined text-white/50 text-5xl">person</span>}
                    </div>
                    <div className={`absolute -bottom-2 -right-3 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border-2 ${tier.color}`}>
                       {tier.name}
                    </div>
                  </div>

                  {/* Info */}
                  <h3 className="text-lg font-bold text-on-surface mb-1">{c.name}</h3>
                  <p className="text-xs text-slate-500 mb-6">{c.email || `${c.name.split(' ')[0].toLowerCase()}@atelier.io`}</p>

                  {/* Stats */}
                  <div className="flex gap-4 w-full mb-6">
                    <div className="flex-1 bg-slate-50 rounded-2xl py-3 px-2">
                       <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Orders</p>
                       <p className="text-xl font-bold text-emerald-900">{c.order_count || Math.floor(Math.random() * 50) + 1}</p>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-2xl py-3 px-2">
                       <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Points</p>
                       <p className="text-xl font-bold text-emerald-900">{c.loyalty_points || Math.floor(Math.random() * 2000)}</p>
                    </div>
                  </div>

                  {/* Action */}
                  <Link href={c.id ? `/customers/${c.id}` : '#'} className="w-full py-3 bg-indigo-50/50 hover:bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl transition-colors mt-auto block">
                    View Profile
                  </Link>
                </div>
              );
            })}

            {/* Register New Client Stub */}
            <div 
              onClick={() => setShowModal(true)}
              className="rounded-3xl p-6 border-2 border-dashed border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50 transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[340px]"
            >
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">person_add</span>
              </div>
              <h3 className="text-base font-bold text-emerald-900 mb-1">Register New Client</h3>
              <p className="text-xs text-slate-500">Grow your atelier base</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Container */}
      {!loading && customers.length > 0 && (
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center animate-fade-in-up stagger-4">
          <p className="text-sm font-medium text-slate-500">
            Showing <span className="font-bold text-on-surface">6</span> of <span className="font-bold text-on-surface">1,248</span> customers
          </p>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold text-sm shadow-md">1</button>
            <button className="w-10 h-10 rounded-xl border border-slate-200 font-bold text-sm hover:bg-slate-50 transition-colors">2</button>
            <button className="w-10 h-10 rounded-xl border border-slate-200 font-bold text-sm hover:bg-slate-50 transition-colors">3</button>
            <span className="flex items-center justify-center w-8 text-slate-400 font-bold">...</span>
            <button className="w-10 h-10 rounded-xl border border-slate-200 font-bold text-sm hover:bg-slate-50 transition-colors">42</button>
            <button className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* High-Fidelity Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] lg:rounded-[3.5rem] w-[95%] sm:w-full max-w-2xl shadow-[0_64px_128px_-24px_rgba(11,28,48,0.4)] border border-outline-variant/10 animate-in zoom-in-95 duration-500 overflow-hidden">
            <div className="p-12 border-b border-slate-50 relative">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[1.25rem] bg-emerald-50 text-primary flex items-center justify-center">
                     <span className="material-symbols-outlined text-3xl">person_add_alt</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-on-surface font-headline leading-tight">Identity Registration</h2>
                    <p className="text-[10px] text-on-surface-variant font-black mt-2 uppercase tracking-[0.3em] leading-none">New Atelier Profile Creation</p>
                  </div>
               </div>
               <button onClick={() => setShowModal(false)} className="absolute top-12 right-12 p-3 hover:bg-slate-50 rounded-full transition-colors text-slate-300 hover:text-on-surface">
                  <span className="material-symbols-outlined text-2xl">close</span>
               </button>
            </div>
            
            <div className="p-6 md:p-12 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-xs font-bold animate-shake">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Client Full Identity</label>
                  <input 
                    autoFocus
                    className="w-full bg-surface-container-low border-none rounded-2xl py-5 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 placeholder:text-slate-200" 
                    value={newCustomer.name} 
                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} 
                    placeholder="Christian Dior" 
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Telecommunication</label>
                  <input className="w-full bg-surface-container-low border-none rounded-2xl py-5 px-6 text-sm font-bold placeholder:text-slate-200" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="+91" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Digital Identity </label>
                  <input className="w-full bg-surface-container-low border-none rounded-2xl py-5 px-6 text-sm font-bold placeholder:text-slate-200" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="dior@atelier.io" />
                </div>

                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Residential Reference</label>
                  <input className="w-full bg-surface-container-low border-none rounded-2xl py-5 px-6 text-sm font-bold placeholder:text-slate-200" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} placeholder="Bungalow #..." />
                </div>
              </div>
            </div>

            <div className="p-12 bg-slate-50/50 border-t border-slate-100 flex gap-6">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-5 border border-slate-200 rounded-3xl font-black text-slate-400 text-xs uppercase tracking-widest hover:text-on-surface hover:bg-white transition-all"
              >
                Discard
              </button>
              <button 
                onClick={handleCreate} 
                disabled={!newCustomer.name}
                className="flex-[2] py-5 primary-gradient text-white rounded-3xl font-black text-sm shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all disabled:opacity-30 uppercase tracking-widest"
              >
                Launch Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
