'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import AgentLogin from '@/components/agent/AgentLogin';
import PhotoCapture from '@/components/logistics/PhotoCapture';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function AgentPickupPage() {
  const { user, login } = useUser();
  const router = useRouter();
  const { t } = useLanguage();

  // Workflow state: 'customer' -> 'photos' -> 'review' -> 'success'
  const [step, setStep] = useState('customer');
  const [loading, setLoading] = useState(false);
  
  // Data state
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [recognizedItems, setRecognizedItems] = useState([]);
  const [orderComplete, setOrderComplete] = useState(null);

  useEffect(() => {
    if (user && step === 'customer') {
      fetchCustomers();
    }
  }, [user, step]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data || []);
    } catch (e) {
      console.error('Failed to fetch customers');
    }
  };

  const handleLoginSuccess = (userData) => {
    // Note: login() from UserContext might need to be called or just rely on the cookie set by API
    window.location.reload(); // Simplest way to refresh all contexts
  };

  const handleAddPhoto = (base64) => {
    setPhotos([...photos, base64]);
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const processWithAI = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: photos, store_id: user.store_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Processing failed');
      
      setRecognizedItems(data.items);
      setStep('review');
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async () => {
    setLoading(true);
    try {
      // Calculate total
      const subtotal = recognizedItems.reduce((s, i) => s + (i.price * i.quantity), 0);
      const tax = Math.round(subtotal * 0.18);
      const total = subtotal + tax;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          items: recognizedItems,
          totalAmount: total,
          discountAmount: 0,
          payments: [], // Usually collected later for pickups
          schedule: {
            pickupDate: new Date().toISOString().split('T')[0],
            pickupTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
            deliveryDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 48h
            deliveryTime: '17:00'
          },
          source: 'agent_app'
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setOrderComplete(data);
      setStep('success');
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <AgentLogin onLoginSuccess={handleLoginSuccess} />;
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white px-6 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-xl">delivery_dining</span>
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Pickup Pro</h2>
            <p className="text-[10px] font-bold text-slate-400">Agent: {user.name}</p>
          </div>
        </div>
        <button 
          onClick={() => {
            if (confirm('Cancel pickup?')) router.push('/');
          }}
          className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      <main className="p-6 max-w-lg mx-auto">
        {/* Step Indicator */}
        {step !== 'success' && (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar py-2">
            {[
              { id: 'customer', icon: 'person', label: 'Customer' },
              { id: 'photos', icon: 'photo_camera', label: 'Photos' },
              { id: 'review', icon: 'fact_check', label: 'Review' }
            ].map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 shrink-0">
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 transition-all ${
                  step === s.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400'
                }`}>
                  <span className="material-symbols-outlined text-sm">{s.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                </div>
                {i < 2 && <div className="w-4 h-[2px] bg-slate-200"></div>}
              </div>
            ))}
          </div>
        )}

        {/* Workflow Steps */}
        {step === 'customer' && (
          <div className="animate-fade-in">
            <h3 className="text-2xl font-black text-slate-800 mb-6">Select Customer</h3>
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
              <input 
                className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold shadow-sm focus:ring-2 focus:ring-slate-900/10 transition-all"
                placeholder="Search name or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="space-y-3">
              {filteredCustomers.slice(0, 5).map(c => (
                <button 
                  key={c.id}
                  onClick={() => { setSelectedCustomer(c); setStep('photos'); }}
                  className="w-full bg-white p-4 rounded-2xl flex items-center justify-between hover:bg-slate-100 transition-all border border-transparent active:scale-[0.98] shadow-sm"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center font-black">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{c.name}</p>
                      <p className="text-xs font-bold text-slate-400">{c.phone}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                </button>
              ))}
              {searchQuery && filteredCustomers.length === 0 && (
                <p className="text-center text-slate-400 py-10 font-bold">No customers found</p>
              )}
            </div>
          </div>
        )}

        {step === 'photos' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Capture Items</h3>
                <p className="text-xs font-bold text-slate-400">Customer: {selectedCustomer?.name}</p>
              </div>
              <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {photos.length} Photos
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {photos.map((p, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden relative shadow-md group">
                  <img src={p} className="w-full h-full object-cover" alt="Garment" />
                  <button 
                    onClick={() => removePhoto(i)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
              
              <div className="aspect-square bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-all cursor-pointer">
                <PhotoCapture 
                  onCapture={handleAddPhoto}
                  trigger={
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Add Photo</span>
                    </div>
                  }
                />
              </div>
            </div>

            <button 
              disabled={photos.length === 0 || loading}
              onClick={processWithAI}
              className="w-full py-5 premium-gradient text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/10 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined">psychology</span>
                  <span>Analyze with Gemini AI</span>
                </>
              )}
            </button>
          </div>
        )}

        {step === 'review' && (
          <div className="animate-fade-in">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Review Items</h3>
            <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">Detected by AI Vision</p>

            <div className="space-y-4 mb-10">
              {recognizedItems.map((item, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group animate-scale-in" style={{animationDelay: `${i * 0.1}s`}}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center font-black relative">
                      <span className="material-symbols-outlined">dry_cleaning</span>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{item.garment_type}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.service_type}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{width: `${item.confidence * 100}%`}}></div>
                        </div>
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                          {Math.round(item.confidence * 100)}% Match
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">₹{item.price}</p>
                    <p className="text-[10px] font-bold text-slate-400">Qty: 1</p>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => setStep('photos')}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-xs hover:border-slate-300 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add More Items
              </button>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 mb-8 border border-slate-100">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>₹{recognizedItems.reduce((s, i) => s + (i.price * i.quantity), 0)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>Service Tax (18%)</span>
                  <span>₹{Math.round(recognizedItems.reduce((s, i) => s + (i.price * i.quantity), 0) * 0.18)}</span>
                </div>
                <div className="h-[1px] bg-slate-100 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">Grand Total</span>
                  <span className="text-2xl font-black text-slate-900">
                    ₹{Math.round(recognizedItems.reduce((s, i) => s + (i.price * i.quantity), 0) * 1.18)}
                  </span>
                </div>
              </div>

              <button 
                disabled={loading}
                onClick={handleSubmitOrder}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Confirm Order & Pickup</span>
                    <span className="material-symbols-outlined">send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && orderComplete && (
          <div className="animate-fade-in-up text-center py-10">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner relative">
              <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <div className="absolute -inset-2 rounded-[3rem] border border-emerald-100 animate-ping opacity-20"></div>
            </div>
            
            <h3 className="text-3xl font-black text-slate-800 mb-2">Order Confirmed!</h3>
            <p className="text-slate-500 font-medium mb-10">
              Receipt <span className="font-bold text-slate-900">#{orderComplete.order_number}</span> created successfully.
            </p>

            <div className="grid gap-3">
              <button 
                onClick={() => {
                  const msg = `Hello ${selectedCustomer.name}, your pickup for Order #${orderComplete.order_number} is confirmed. Total: ₹${orderComplete.total_amount}. View status here: ${window.location.origin}/track/${orderComplete.id}`;
                  window.open(`https://wa.me/${selectedCustomer.phone}?text=${encodeURIComponent(msg)}`);
                }}
                className="w-full py-5 bg-[#25D366] text-white rounded-2xl font-black text-sm shadow-xl shadow-green-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">share</span>
                Send to WhatsApp
              </button>
              
              <button 
                onClick={() => {
                  setStep('customer');
                  setPhotos([]);
                  setRecognizedItems([]);
                  setSelectedCustomer(null);
                  setOrderComplete(null);
                }}
                className="w-full py-5 bg-white text-slate-800 border-2 border-slate-100 rounded-2xl font-black text-sm active:scale-95 transition-all"
              >
                Start New Pickup
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav Hint */}
      {step !== 'success' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex justify-center z-20">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
            CleanFlow Agent Pickup System v1.0
          </p>
        </div>
      )}
    </div>
  );
}
