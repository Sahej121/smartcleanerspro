'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import Link from 'next/link';

export default function CustomersClient({ initialCustomers, pagination }) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [showModal, setShowModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [error, setError] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch) params.set('search', debouncedSearch);
    else params.delete('search');
    // Reset to page 1 on new search
    params.delete('page');

    router.push(`/customers?${params.toString()}`, { scroll: false });
  }, [debouncedSearch]);

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
      router.refresh(); // Refresh RSC data
    } else {
      setError(result.error || t('failed_register_customer'));
    }
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    router.push(`/customers?${params.toString()}`, { scroll: false });
  };

  const getTier = (points) => {
    if (points > 1000) return { name: t('gold'), color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    if (points > 500) return { name: t('silver'), color: 'bg-slate-500/10 text-theme-text border-slate-500/20' };
    return { name: t('new_tier'), color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
  };

  const getAvatarStyle = (index) => {
    const avatars = [
      'bg-indigo-500/20 text-indigo-400',
      'bg-emerald-500/20 text-emerald-400',
      'bg-blue-500/20 text-blue-400',
      'bg-purple-500/20 text-purple-400',
      'bg-rose-500/20 text-rose-400',
      'bg-amber-500/20 text-amber-400',
    ];
    return avatars[index % avatars.length];
  };

  return (
    <div className="min-h-screen bg-background text-theme-text p-4 lg:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-surface/40 border border-theme-border p-8 rounded-[3rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

          <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
             <div className="w-16 h-16 rounded-3xl bg-slate-800 border-2 border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0">
               <span className="material-symbols-outlined text-3xl">groups</span>
             </div>
             <div>
                <div className="flex items-center gap-3 mb-1">
                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">{t('clientele')}</span>
                </div>
                <h1 className="text-4xl font-black text-theme-text tracking-tighter">{t('customer_registry')}</h1>
                <p className="text-theme-text-muted font-medium text-sm mt-1">{t('customer_registry_desc')}</p>
             </div>
          </div>
          
          <div className="flex gap-3 relative z-10 w-full md:w-auto">
             <div className="bg-background px-6 py-4 rounded-3xl border border-theme-border text-center flex-1 md:flex-none">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">{t('total_users')}</p>
                <p className="text-2xl font-black text-theme-text leading-none">
                  {pagination.total || initialCustomers.length || '—'}
                </p>
             </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-md group">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-theme-text-muted group-focus-within:text-emerald-500 transition-colors">search</span>
            <input
              className="w-full bg-surface border border-theme-border rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold text-theme-text placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all shadow-sm"
              placeholder={t('search_customers_placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
            <button className="flex items-center gap-2 px-6 py-4 bg-surface border border-theme-border rounded-[1.5rem] text-sm font-bold text-theme-text shadow-sm hover:bg-slate-800 hover:text-theme-text transition-all whitespace-nowrap">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              Segment
            </button>
            <button className="flex items-center gap-2 px-6 py-4 bg-surface border border-theme-border rounded-[1.5rem] text-sm font-bold text-theme-text shadow-sm hover:bg-slate-800 hover:text-theme-text transition-all whitespace-nowrap">
              <span className="material-symbols-outlined text-[18px]">sort</span>
              Sort
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-4 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-500 text-theme-text font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add Client
            </button>
          </div>
        </div>

        {/* Customer Registry Grid */}
        <div className="min-h-[400px]">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {initialCustomers.map((c, i) => {
              const tier = getTier(c.loyalty_points);
              const avatarStyle = getAvatarStyle(i);
              
              return (
                <div key={c.id} className="bg-surface rounded-[2.5rem] p-6 border border-theme-border hover:border-slate-700 transition-all duration-300 flex flex-col items-center text-center animate-scale-in group" style={{ animationDelay: (i * 50) + 'ms' }}>
                  {/* Avatar & Badge */}
                  <div className="relative mb-6 mt-4">
                    <div className={`w-24 h-24 rounded-[1.75rem] ${avatarStyle} flex items-center justify-center text-3xl font-black shadow-inner overflow-hidden group-hover:scale-105 transition-transform`}>
                       {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-black tracking-[0.2em] border backdrop-blur-md whitespace-nowrap z-10 ${tier.color}`}>
                       {tier.name}
                    </div>
                  </div>

                  {/* Info */}
                  <h3 className="text-xl font-black text-theme-text mb-1 tracking-tight">{c.name}</h3>
                  <p className="text-[10px] uppercase tracking-widest text-theme-text-muted mb-6 truncate max-w-full">
                    {c.email || `${c.name.split(' ')[0].toLowerCase()}@atelier.io`}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 w-full mb-6">
                    <div className="bg-background rounded-2xl py-3 border border-theme-border/50 text-center">
                       <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest mb-1">{t('orders')}</p>
                       <p className="text-lg font-black text-theme-text">{c.order_count || 0}</p>
                    </div>
                    <div className="bg-background rounded-2xl py-3 border border-theme-border/50 text-center">
                       <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest mb-1">{t('points')}</p>
                       <p className="text-lg font-black text-emerald-400">{c.loyalty_points || 0}</p>
                    </div>
                  </div>

                  {/* Action */}
                  <Link href={c.id ? `/customers/${c.id}` : '#'} className="w-full py-4 mt-auto bg-slate-800/50 hover:bg-emerald-500/10 text-theme-text hover:text-emerald-400 border border-slate-700/50 hover:border-emerald-500/30 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all block">
                    View Profile
                  </Link>
                </div>
              );
            })}

            {/* Register New Client Stub */}
            <button 
              onClick={() => setShowModal(true)}
              className="rounded-[2.5rem] p-6 border-2 border-dashed border-theme-border bg-surface/30 hover:bg-slate-800/50 transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[340px]"
            >
              <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-emerald-500 bg-emerald-500/10 mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">person_add</span>
              </div>
              <h3 className="text-sm font-black text-theme-text mb-2 uppercase tracking-widest">{t('register_new_client_stub')}</h3>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{t('grow_atelier_base')}</p>
            </button>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12 pb-8">
              <button 
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-theme-border text-theme-text disabled:opacity-30 hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="flex items-center gap-2">
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const p = i + 1;
                  // Only show 5 pages around current
                  if (Math.abs(p - pagination.page) > 2 && p !== 1 && p !== pagination.totalPages) {
                    if (p === 2 || p === pagination.totalPages - 1) return <span key={p} className="text-slate-600 px-2">...</span>;
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${p === pagination.page ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-surface border border-theme-border text-slate-400 hover:text-theme-text hover:bg-slate-800'}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button 
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-theme-border text-theme-text disabled:opacity-30 hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* High-Fidelity Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-surface rounded-[3rem] w-[95%] sm:w-full max-w-2xl border border-theme-border shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-scale-in overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-8 md:p-10 border-b border-theme-border/50 relative shrink-0">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                     <span className="material-symbols-outlined text-3xl">person_add</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-theme-text tracking-tighter">{t('identity_registration')}</h2>
                    <p className="text-[10px] text-emerald-500 font-black mt-2 uppercase tracking-[0.3em]">{t('new_atelier_profile')}</p>
                  </div>
               </div>
               <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-theme-text flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">close</span>
               </button>
            </div>
            
            <div className="p-8 md:p-10 space-y-8 overflow-y-auto no-scrollbar shrink">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-[0.2em] ml-4">{t('client_full_identity')}</label>
                  <input 
                    autoFocus
                    className="w-full bg-background border border-theme-border rounded-[1.5rem] py-5 px-6 text-sm font-bold text-theme-text focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-700 transition-colors" 
                    value={newCustomer.name} 
                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} 
                    placeholder="Christian Dior" 
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-[0.2em] ml-4">{t('telecommunication')}</label>
                  <input 
                    className="w-full bg-background border border-theme-border rounded-[1.5rem] py-5 px-6 text-sm font-bold text-theme-text focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-700 transition-colors" 
                    value={newCustomer.phone} 
                    onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} 
                    placeholder="+91" 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-[0.2em] ml-4">{t('digital_identity')}</label>
                  <input 
                    className="w-full bg-background border border-theme-border rounded-[1.5rem] py-5 px-6 text-sm font-bold text-theme-text focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-700 transition-colors" 
                    value={newCustomer.email} 
                    onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} 
                    placeholder="dior@atelier.io" 
                  />
                </div>

                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-[0.2em] ml-4">{t('residential_reference')}</label>
                  <input 
                    className="w-full bg-background border border-theme-border rounded-[1.5rem] py-5 px-6 text-sm font-bold text-theme-text focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-700 transition-colors" 
                    value={newCustomer.address} 
                    onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} 
                    placeholder="Bungalow #..." 
                  />
                </div>
              </div>
            </div>

            <div className="p-8 md:p-10 bg-background/50 border-t border-theme-border/50 flex gap-4 shrink-0 mt-auto">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-[1] py-5 bg-surface border border-theme-border rounded-[1.5rem] font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all"
              >
                Discard
              </button>
              <button 
                onClick={handleCreate} 
                disabled={!newCustomer.name}
                className="flex-[2] py-5 bg-emerald-600 border border-emerald-500 text-theme-text rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50 disabled:hover:bg-emerald-600"
              >
                Launch Profile
              </button>
            </div>

          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-scale-in { animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}} />
    </div>
  );
}
