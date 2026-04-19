'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import Link from 'next/link';
import { useUser } from '@/lib/UserContext';
import { useRouter } from 'next/navigation';

export default function InductionPage() {
  const { t } = useLanguage();
  const { role, loading: authLoading } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [inductionData, setInductionData] = useState({ bag_id: '', items: [] });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/induction');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch induction queue', err);
    } finally {
      setLoading(false);
    }
  };

  const openInduction = (order) => {
    setSelectedOrder(order);
    setInductionData({
      bag_id: order.bag_id || '',
      items: order.items.map(item => ({
        id: item.id,
        tag_id: item.tag_id?.startsWith('WA-') ? '' : (item.tag_id || ''), // Clear placeholder tags
        price: item.price || 0,
        garment_type: item.garment_type,
        service_type: item.service_type,
        image_url: item.image_url
      }))
    });
  };

  const handleItemChange = (itemId, field, value) => {
    setInductionData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === itemId ? { ...item, [field]: value } : item)
    }));
  };

  const saveInduction = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/induction', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.order_id,
          bag_id: inductionData.bag_id,
          items: inductionData.items
        })
      });

      if (res.ok) {
        setSelectedOrder(null);
        fetchQueue();
      } else {
        const err = await res.json();
        alert(err.error || t('failed_save_induction'));
      }
    } catch (err) {
      console.error('Save error:', err);
      alert(t('error_saving'));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">{t('loading_induction_queue')}</p>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end gap-6">
        <div className="flex items-center gap-4">
          <Link href="/operations" className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors shrink-0 mb-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-4xl font-black text-on-surface uppercase tracking-tight font-headline">{t('front_desk_induction')}</h1>
            <p className="text-on-surface-variant font-medium">{t('induction_desc')}</p>
          </div>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
          <span className="material-symbols-outlined text-lg animate-pulse">pending_actions</span>
          <span className="text-sm font-black uppercase tracking-widest">{orders.length} {t('orders_pending')}</span>
        </div>
      </div>

      {/* Grid of Open Tickets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order, idx) => (
          <div 
            key={order.order_id} 
            onClick={() => openInduction(order)}
            className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
               <div>
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-xl">{order.order_number}</span>
                 <h3 className="text-xl font-black text-on-surface mt-2 leading-tight">{order.customer_name || t('walk_in')}</h3>
                 <p className="text-xs font-bold text-slate-400 mt-1">{order.items.length} garments • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
               </div>
               <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">chevron_right</span>
               </div>
            </div>

            <div className="flex gap-2 overflow-hidden mb-6">
               {order.items.slice(0, 4).map((item, i) => (
                 <div key={item.id} className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border border-white shadow-sm flex-shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt="garment" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <span className="material-symbols-outlined text-base">image</span>
                      </div>
                    )}
                 </div>
               ))}
               {order.items.length > 4 && (
                 <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 text-xs font-black border border-slate-100">
                    +{order.items.length - 4}
                 </div>
               )}
            </div>

            <button className="w-full py-3 rounded-2xl bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest group-hover:bg-emerald-600 group-hover:text-white transition-all">
               Start Induction
            </button>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-100">
             <span className="material-symbols-outlined text-6xl mb-4">check_circle</span>
             <p className="text-lg font-black uppercase tracking-widest">{t('queue_is_clear')}</p>
          </div>
        )}
      </div>

      {/* Induction Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-surface rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-3xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-900/10">
                    <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-on-surface">{t('inducting_order')} {selectedOrder.order_number}</h2>
                    <p className="text-sm font-bold text-slate-500">{selectedOrder.customer_name} • {selectedOrder.customer_phone}</p>
                  </div>
               </div>
               <button 
                onClick={() => setSelectedOrder(null)}
                className="w-12 h-12 rounded-2xl hover:bg-slate-200/50 flex items-center justify-center text-slate-400 transition-colors"
               >
                 <span className="material-symbols-outlined">close</span>
               </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-slate-50/30">
               
               {/* Global Bag ID */}
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-on-surface mb-1">{t('assign_bag_id')}</h3>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{t('assign_bag_desc')}</p>
                  </div>
                  <div className="w-full md:w-64 relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">shopping_bag</span>
                    <input 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm font-black focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-300"
                      placeholder={t('scan_bag_qr')}
                      value={inductionData.bag_id}
                      onChange={(e) => setInductionData(prev => ({ ...prev, bag_id: e.target.value }))}
                    />
                  </div>
               </div>

               {/* Items Grid */}
               <div className="grid grid-cols-1 gap-4">
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] pl-4 mb-2">{t('tagging_pricing')}</h3>
                  {inductionData.items.map((item, i) => (
                    <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 flex flex-col md:flex-row gap-8 items-center group hover:border-emerald-200 transition-colors">
                       <div className="w-32 h-32 rounded-3xl bg-slate-100 overflow-hidden border border-slate-100 flex-shrink-0">
                          {item.image_url ? (
                            <img src={item.image_url} alt="garment" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <span className="material-symbols-outlined text-4xl">inventory_2</span>
                            </div>
                          )}
                       </div>

                       <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{t('garment_service')}</label>
                            <h4 className="text-lg font-black text-on-surface leading-tight">{item.garment_type}</h4>
                            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-1">{item.service_type}</p>
                          </div>

                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('unit_price_inr')}</label>
                             <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">₹</span>
                                <input 
                                  type="number"
                                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-10 pr-4 text-sm font-black focus:bg-white transition-all outline-none"
                                  value={item.price}
                                  onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                                />
                             </div>
                          </div>

                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('plastic_card_qr')}</label>
                             <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">credit_card</span>
                                <input 
                                  className={`w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-10 pr-4 text-sm font-black focus:bg-white transition-all outline-none ${!item.tag_id ? 'border-amber-200 animate-pulse bg-amber-50/30' : 'border-emerald-100 bg-emerald-50/10'}`}
                                  placeholder={t('scan_card_now')}
                                  value={item.tag_id}
                                  onChange={(e) => handleItemChange(item.id, 'tag_id', e.target.value)}
                                />
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-100 bg-white flex justify-between items-center">
               <div className="hidden md:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('total_estimated_amount')}</p>
                  <p className="text-2xl font-black text-on-surface">₹{inductionData.items.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0).toLocaleString()}</p>
               </div>
               <div className="flex gap-4 w-full md:w-auto">
                 <button 
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 md:flex-none px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                 >
                   Cancel
                 </button>
                 <button 
                  onClick={saveInduction}
                  disabled={saving || !inductionData.bag_id || inductionData.items.some(i => !i.tag_id || i.price <= 0)}
                  className="flex-1 md:flex-none px-12 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:-translate-y-1 transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95 flex items-center justify-center gap-3"
                 >
                   {saving ? (
                     <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                   ) : (
                     <>
                        <span className="material-symbols-outlined text-[18px]">fact_check</span>
                        Complete Induction
                     </>
                   )}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
