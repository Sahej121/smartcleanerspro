'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/UserContext';

function AnimatedTotal({ value, prefix = '₹' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = display;
    const startTime = performance.now();
    
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / 600, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (value - start) * eased);
      setDisplay(current);
      if (progress < 1) ref.current = requestAnimationFrame(step);
    }
    
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);
  
  return <>{prefix}{display.toLocaleString('en-IN')}</>;
}

// Icon mapping for garment types
function getGarmentIcon(type) {
  const t = type.toLowerCase();
  if (t.includes('shirt')) return 'checkroom';
  if (t.includes('suit')) return 'person_pin_circle';
  if (t.includes('dress') || t.includes('gown')) return 'styler';
  if (t.includes('trouser') || t.includes('pant')) return 'apparel';
  if (t.includes('scarf') || t.includes('silk')) return 'texture';
  if (t.includes('coat') || t.includes('jacket')) return 'backpack';
  if (t.includes('blanket') || t.includes('curtain')) return 'bed';
  if (t.includes('saree') || t.includes('sari')) return 'styler';
  if (t.includes('package') || t.includes('bundle')) return 'work';
  return 'dry_cleaning';
}

// Category icons
const CATEGORY_ICONS = {
  'All': 'grid_view',
  'Dry Clean': 'dry_cleaning',
  'Laundry': 'local_laundry_service',
  'Pressing': 'iron',
  'Delicates': 'flare',
  'Household': 'checkroom',
};

function getCategoryIcon(cat) {
  return CATEGORY_ICONS[cat] || 'dry_cleaning';
}

export default function NewOrder() {
  const router = useRouter();
  const { user } = useUser();
  const [customers, setCustomers] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isInlineCreating, setIsInlineCreating] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(2); // 1=Customer, 2=Service, 3=Schedule, 4=Payment
  const [schedule, setSchedule] = useState({
    pickupDate: '', pickupTime: '09:00', deliveryDate: '', deliveryTime: '17:00'
  });
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [payments, setPayments] = useState([]);
  const [payAtPickup, setPayAtPickup] = useState(false);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [volDiscountInfo, setVolDiscountInfo] = useState({ min_quantity: 0, discount_percent: 0 });
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(data => Array.isArray(data) ? setCustomers(data) : setCustomers([]));
    fetch('/api/pricing')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) {
          setPricing([]);
          return;
        }
        const hasPackages = data.some(p => p.garment_type === 'Full Package');
        if (!hasPackages) {
          data.unshift(
            { id: 'pkg-1', garment_type: 'Full Package', service_type: 'Wash & Fold (Per Kg)', price: 150 },
            { id: 'pkg-2', garment_type: 'Full Package', service_type: 'Premium Dry Clean Bundle', price: 999 }
          );
        }
        setPricing(data);
      });

    fetch('/api/pricing/volume-discounts')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (data.length > 0) setVolDiscountInfo(data[0]); 
      }).catch(() => {});

    if (editId) {
      fetch(`/api/orders/${editId}`)
        .then(r => r.json())
        .then(data => {
          if (data.error) return alert(data.error);
          setSelectedCustomer({ id: data.customer_id, name: data.customer_name, phone: data.customer_phone, loyalty_points: data.loyalty_points });
          setCart(data.items.map(i => ({ ...i, price: parseFloat(i.price) })));
          setPaymentMethod(data.payment_method);
          if (data.pickup_date) {
            const d = new Date(data.pickup_date);
            setSchedule(prev => ({ ...prev, pickupDate: d.toISOString().split('T')[0], pickupTime: d.toTimeString().split(' ')[0].substring(0,5) }));
          }
          if (data.delivery_date) {
            const d = new Date(data.delivery_date);
            setSchedule(prev => ({ ...prev, deliveryDate: d.toISOString().split('T')[0], deliveryTime: d.toTimeString().split(' ')[0].substring(0,5) }));
          }
        });
    }
  }, [editId]);

  const garmentTypes = ['All', ...new Set(Array.isArray(pricing) ? pricing.map(p => p.garment_type) : [])];
  
  const [itemEditIndex, setItemEditIndex] = useState(null);
  const [showItemEditModal, setShowItemEditModal] = useState(false);
  const [itemEditData, setItemEditData] = useState({ tag_id: '', bag_id: '', notes: '' });
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', price: '' });

  const addToCart = (item) => {
    // Each garment is a unique physical item for tracking
    setCart([...cart, { ...item, quantity: 1, tag_id: '', bag_id: '', notes: '' }]);
  };

  const handleAddCustomGarment = () => {
    setCustomItem({ name: '', price: '' });
    setIsCustomModalOpen(true);
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const updateQuantity = (index, qty) => {
    if (qty < 1) return removeFromCart(index);
    const newCart = [...cart];
    newCart[index] = { ...newCart[index], quantity: qty };
    setCart(newCart);
  };

  const updateItemPrice = (index, price) => {
    const newCart = [...cart];
    newCart[index] = { ...newCart[index], price: parseFloat(price) || 0 };
    setCart(newCart);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, subtotal: subtotal })
    });
    const data = await res.json();
    if (res.ok) {
      setCouponData(data);
    } else {
      alert(data.error);
      setCouponData(null);
    }
  };

  const subtotal = cart.reduce((s, c) => s + c.price * (c.quantity || 1), 0);
  
  const totalItemCount = cart.reduce((s, c) => s + (c.quantity || 1), 0);
  const applicableVolDiscount = (volDiscountInfo.min_quantity > 0 && totalItemCount >= volDiscountInfo.min_quantity) 
    ? Math.round(subtotal * (volDiscountInfo.discount_percent / 100)) 
    : 0;
    
  const couponDiscount = couponData ? couponData.discountAmount : 0;
  
  const tax = Math.round((subtotal - applicableVolDiscount - couponDiscount) * 0.18);
  const totalRaw = subtotal + tax;
  const total = Math.max(0, totalRaw - redeemedPoints - applicableVolDiscount - couponDiscount);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const handleCreateCustomer = async () => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer),
    });
    const result = await res.json();
    if (!res.ok) {
      return setInlineError(result.error || 'Failed to create customer');
    }
    setCustomers([result, ...customers]);
    setInlineError('');
    setSelectedCustomer(result);
    setIsInlineCreating(false);
    setIsCustomerSearchOpen(false);
    setCurrentStep(2);
    setNewCustomer({ name: '', phone: '', email: '', address: '' });
  };

  const handleSubmitOrder = async (force = false) => {
    if (!selectedCustomer) return alert('Select a customer');

    if (schedule.pickupDate && schedule.deliveryDate) {
      const pDate = new Date(`${schedule.pickupDate}T${schedule.pickupTime || '00:00'}`);
      const dDate = new Date(`${schedule.deliveryDate}T${schedule.deliveryTime || '00:00'}`);
      if (pDate > dDate) {
        return alert('Pickup date/time cannot be later than delivery date/time.');
      }
    }

    setSubmitting(true);
    setDuplicateWarning(null);
    try {
      const url = editId ? `/api/orders/${editId}` : '/api/orders';
      const method = editId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          items: cart,
          totalAmount: total,
          discountAmount: applicableVolDiscount + couponDiscount + redeemedPoints,
          payments: payAtPickup ? [] : payments,
          redeemedPoints: redeemedPoints,
          coupon_id: couponData?.id,
          schedule: schedule,
          force: force
        }),
      });
      
      if (res.status === 409 && !editId) {
        const data = await res.json();
        setDuplicateWarning(data);
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit');
      }
      
      const order = await res.json();
      if (editId) {
        router.push(`/orders/${editId}`);
      } else {
        setOrderComplete(order);
      }
    } catch (e) {
      alert('Order failed: ' + e.message);
    }
    setSubmitting(false);
  };

  if (orderComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 animate-fade-in-up" style={{ animationDuration: '0.6s' }}>
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-theme-surface-container text-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-100 breathe-glow">
            <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
        </div>
        <h1 className="text-4xl font-black text-theme-text mb-2 font-headline">Order Placed</h1>
        <p className="text-xl text-theme-text-muted mb-10 font-medium">Receipt <span className="text-primary font-bold">#{orderComplete.order_number}</span> has been generated.</p>
        <div className="flex gap-4">
          <button 
            onClick={() => { setOrderComplete(null); setCart([]); setSelectedCustomer(null); setCurrentStep(2); }}
            className="px-10 py-4 premium-gradient text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/10 active:scale-95 transition-all"
          >
            New Transaction
          </button>
          <button 
            onClick={() => router.push(`/orders/${orderComplete.id}`)}
            className="px-10 py-4 ghost-border bg-theme-surface text-theme-text rounded-2xl font-bold text-sm hover:bg-theme-surface-container hover:shadow-md transition-all"
          >
            Track Order
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { icon: 'person', label: 'Customer', step: 1 },
    { icon: 'dry_cleaning', label: 'Service', step: 2 },
    { icon: 'schedule', label: 'Schedule', step: 3 },
    { icon: 'payments', label: 'Payment', step: 4 },
  ];

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] lg:min-h-0">
      {/* Progress Stepper */}
      <div className="flex items-center justify-center animate-fade-in-up">
        <div className="flex items-center w-full max-w-2xl">
          {steps.map((s, i) => (
            <div key={s.step} className="contents">
              <div className="flex flex-col items-center gap-2 group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  s.step <= currentStep 
                    ? 'primary-gradient text-white ring-4 ring-emerald-50 shadow-lg shadow-emerald-200/30' 
                    : 'bg-theme-surface-container text-theme-text-muted/70'
                }`}>
                  <span className="material-symbols-outlined text-lg">{s.icon}</span>
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  s.step <= currentStep ? 'text-theme-text' : 'text-theme-text-muted/70'
                }`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-[2px] mx-2 mb-6 transition-colors duration-300 ${
                  s.step < currentStep ? 'bg-emerald-300' : 'bg-theme-surface-container'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* POS 3-Column Layout */}
      {currentStep <= 2 && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch overflow-y-auto lg:overflow-hidden pb-20 lg:pb-0">
          {/* Column 1: Service Categories (Horizontal on mobile) */}
        <div className="lg:col-span-2 flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto no-scrollbar animate-fade-in-up stagger-1 pb-2 shrink-0">
          <h3 className="hidden lg:block text-xs font-black uppercase tracking-widest text-theme-text-muted/70 mb-2 px-1">Categories</h3>
          {garmentTypes.map((cat, i) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex shrink-0 lg:shrink flex-row lg:flex-col items-center justify-center p-3 lg:p-4 rounded-2xl transition-all duration-300 group gap-2 lg:gap-0 ${
                activeCategory === cat
                  ? 'bg-theme-surface shadow-sm border border-theme-border ring-2 ring-emerald-500/10'
                  : 'bg-theme-surface shadow-sm border border-theme-border hover:bg-theme-surface-container'
              }`}
            >
              <div className={`w-8 h-8 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center lg:mb-3 transition-all ${
                activeCategory === cat
                  ? 'bg-theme-surface-container text-emerald-600'
                  : 'bg-theme-surface-container text-theme-text-muted/70 group-hover:bg-theme-surface-container group-hover:text-emerald-600'
              }`}>
                <span className="material-symbols-outlined text-xl lg:text-3xl">{getCategoryIcon(cat)}</span>
              </div>
              <span className={`text-xs lg:text-sm whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'font-bold text-theme-text'
                  : 'font-semibold text-theme-text-muted'
              }`}>{cat}</span>
            </button>
          ))}
        </div>

        {/* Column 2: Garment Grid */}
        <div className="lg:col-span-6 flex flex-col overflow-hidden min-h-[400px] lg:min-h-0">
          <div className="flex items-center justify-between mb-4 px-1 animate-fade-in-up stagger-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-theme-text-muted/70">Select Garments</h3>
            <div className="flex gap-2">
              <button onClick={handleAddCustomGarment} className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase hover:bg-emerald-700 transition">+ Custom Item</button>
              <button className="px-3 py-1 rounded-full bg-emerald-100 text-theme-text text-[10px] font-bold uppercase">Popular</button>
              <button className="px-3 py-1 rounded-full bg-theme-surface-container text-theme-text-muted text-[10px] font-bold uppercase">A-Z</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-4">
              {pricing
                .filter(p => activeCategory === 'All' || p.garment_type === activeCategory)
                .map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => addToCart(item)}
                    className="bg-theme-surface p-4 rounded-2xl border border-theme-border/50 shadow-sm hover:ring-2 hover:ring-emerald-500/20 transition-all cursor-pointer group relative overflow-hidden animate-fade-in-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Price Badge - Top Right */}
                    <div className="absolute top-0 right-0 p-2">
                      <span className="bg-theme-surface-container text-theme-text text-[10px] font-bold px-2 py-0.5 rounded-full">₹{item.price}</span>
                    </div>
                    {/* Icon Area */}
                    <div className="w-full aspect-square bg-theme-surface-container rounded-xl mb-3 flex items-center justify-center text-theme-text-muted/70 group-hover:bg-theme-surface-container group-hover:text-emerald-500 transition-colors">
                      <span className="material-symbols-outlined text-5xl">{getGarmentIcon(item.garment_type)}</span>
                    </div>
                    {/* Text */}
                    <h4 className="font-bold text-theme-text text-center text-sm">{item.garment_type}</h4>
                    <p className="text-[10px] text-theme-text-muted/70 text-center">{item.service_type}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Column 3: Order Summary/Cart */}
        <div className="lg:col-span-4 flex flex-col overflow-hidden min-h-[500px] lg:min-h-0 animate-fade-in-up stagger-3">
          <div className="bg-theme-surface rounded-[2rem] border border-theme-border/50 shadow-xl shadow-emerald-900/5 flex flex-col overflow-hidden h-full">
            {/* Summary Header */}
            <div className="p-6 border-b border-theme-border bg-theme-surface-container/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold text-theme-text">Order Summary</h3>
                <span className="text-[10px] font-black bg-emerald-100 text-theme-text px-2 py-1 rounded-lg">
                  #{Math.random().toString(36).substring(2, 6).toUpperCase()}
                </span>
              </div>

              {/* Customer Selection */}
              {!selectedCustomer ? (
                <div 
                  onClick={() => setIsCustomerSearchOpen(true)}
                  className="flex items-center gap-3 p-3 bg-theme-surface rounded-xl border border-theme-border/50 cursor-pointer hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-theme-surface-container text-theme-text flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">person_add</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold">Assign Customer</p>
                    <p className="text-[10px] text-theme-text-muted">Search name or phone</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-theme-surface rounded-xl border border-theme-border/50 animate-slide-in-right" style={{ animationDuration: '0.3s' }}>
                  <div className="w-10 h-10 rounded-lg primary-gradient flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold">{selectedCustomer.name}</p>
                    <p className="text-[10px] text-theme-text-muted">Premium Member • {selectedCustomer.loyalty_points || 0} pts</p>
                  </div>
                  <button 
                    onClick={() => setSelectedCustomer(null)}
                    className="text-emerald-600 hover:bg-theme-surface-container p-1 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                </div>
              )}

              {/* Customer Search Overlay */}
              {isCustomerSearchOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-on-surface/20 backdrop-blur-sm">
                  <div className="bg-theme-surface rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(11,28,48,0.2)] border border-theme-border p-6 w-full max-w-md animate-scale-in" style={{ animationDuration: '0.25s' }}>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="material-symbols-outlined text-theme-text-muted/70">search</span>
                      <input 
                        autoFocus
                        className="flex-1 bg-theme-surface-container border-none rounded-xl py-3 px-4 text-sm font-bold placeholder:text-theme-text-muted/70 outline-none"
                        placeholder="Start typing..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                      <button onClick={() => setIsCustomerSearchOpen(false)} className="p-2 hover:bg-theme-surface-container rounded-full transition-colors">
                        <span className="material-symbols-outlined text-theme-text-muted/70 text-sm">close</span>
                      </button>
                    </div>
                    
                    <div className="max-h-72 overflow-y-auto space-y-2 no-scrollbar">
                      {!isInlineCreating ? (
                        filteredCustomers.length > 0 ? (
                          filteredCustomers.map((c, i) => (
                            <div 
                              key={c.id} 
                              onClick={() => { setSelectedCustomer(c); setIsCustomerSearchOpen(false); setCurrentStep(2); }}
                              className="p-4 rounded-2xl hover:bg-theme-surface-container cursor-pointer flex justify-between items-center transition-all group animate-fade-in-up"
                              style={{ animationDelay: `${i * 40}ms` }}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center font-bold text-theme-text text-xs shadow-inner">
                                  {c.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-theme-text">{c.name}</p>
                                  <p className="text-[10px] text-theme-text-muted/70 font-bold">{c.phone}</p>
                                </div>
                              </div>
                              <span className="material-symbols-outlined text-primary text-sm opacity-0 group-hover:opacity-100 transition-all">chevron_right</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 animate-fade-in-up">
                            <div className="w-12 h-12 bg-theme-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                              <span className="material-symbols-outlined text-theme-text-muted/70">no_accounts</span>
                            </div>
                            <p className="text-[10px] text-theme-text-muted/70 uppercase font-black mb-4 tracking-widest">No client matches</p>
                            <button 
                              onClick={() => setIsInlineCreating(true)}
                              className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-900/10 active:scale-95 transition-all"
                            >
                              Quick Add Client
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="py-2 animate-slide-in-right shrink-0" style={{ animationDuration: '0.2s' }}>
                          <p className="text-xs font-black uppercase tracking-widest text-theme-text mb-4 px-1">Quick Registration</p>
                          {inlineError && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-[10px] font-bold mb-4 animate-shake">
                              {inlineError}
                            </div>
                          )}
                          <div className="space-y-3">
                            <input 
                              autoFocus
                              className="w-full bg-theme-surface-container border border-transparent rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-theme-surface placeholder:text-theme-text-muted/70 transition-all outline-none" 
                              placeholder="Full Name" 
                              value={newCustomer.name} 
                              onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} 
                            />
                            <input 
                              className="w-full bg-theme-surface-container border border-transparent rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-theme-surface placeholder:text-theme-text-muted/70 transition-all outline-none" 
                              placeholder="Phone Number" 
                              value={newCustomer.phone} 
                              onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} 
                            />
                            <input 
                              className="w-full bg-theme-surface-container border border-transparent rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-theme-surface placeholder:text-theme-text-muted/70 transition-all outline-none" 
                              placeholder="Address (Optional)" 
                              value={newCustomer.address} 
                              onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} 
                            />
                            <div className="flex gap-3 pt-2">
                              <button onClick={() => setIsInlineCreating(false)} className="flex-1 py-3 text-xs font-bold text-theme-text-muted/70 hover:text-theme-text hover:bg-theme-surface-container rounded-xl transition-all">Cancel</button>
                              <button onClick={handleCreateCustomer} disabled={!newCustomer.name || !newCustomer.phone} className="flex-1 py-3 primary-gradient text-white rounded-xl text-xs font-black shadow-md disabled:opacity-50 active:scale-95 transition-all">Save & Assign</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Add Button underneath list if showing results */}
                    {!isInlineCreating && filteredCustomers.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-theme-border animate-fade-in-up">
                        <button onClick={() => setIsInlineCreating(true)} className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-theme-text w-full justify-center p-3 rounded-xl hover:bg-theme-surface-container transition-colors">
                          <span className="material-symbols-outlined text-[18px]">add_circle</span>
                          Create New Client
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                  <span className="material-symbols-outlined text-6xl mb-4 animate-float">shopping_bag</span>
                  <p className="text-xs font-black uppercase tracking-widest text-center leading-relaxed">Cart is waiting<br/>for orders</p>
                </div>
              ) : (
                cart.map((item, i) => (
                  <div key={i} className="flex flex-col gap-2 p-3 bg-theme-surface rounded-2xl border border-theme-border animate-slide-in-right" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-lg bg-theme-surface-container flex items-center justify-center text-theme-text">
                        <span className="material-symbols-outlined text-lg">{getGarmentIcon(item.garment_type)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h5 className="text-xs font-bold text-theme-text">{item.garment_type}</h5>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-theme-text-muted/70">₹</span>
                            <input 
                              type="number" 
                              className="w-16 bg-theme-surface-container border-none rounded p-1 text-xs font-bold text-right outline-none focus:ring-1 focus:ring-emerald-500/20"
                              value={item.price}
                              onChange={(e) => updateItemPrice(i, e.target.value)}
                            />
                          </div>
                        </div>
                        <p className="text-[9px] text-theme-text-muted/70 font-bold uppercase tracking-wider">{item.service_type}</p>
                      </div>
                      <button onClick={() => removeFromCart(i)} className="text-theme-text-muted/70 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-theme-border mt-1">
                       <div className="flex gap-2">
                          {item.tag_id ? (
                            <span className="px-2 py-0.5 bg-theme-surface-container text-emerald-600 rounded text-[8px] font-black uppercase tracking-tight italic">Tag: {item.tag_id}</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-theme-surface-container text-theme-text-muted/70 rounded text-[8px] font-bold uppercase tracking-tight">No Tag</span>
                          )}
                          {item.bag_id && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black uppercase tracking-tight italic">Bag: {item.bag_id}</span>
                          )}
                       </div>
                       <button 
                         onClick={() => {
                           setItemEditIndex(i);
                           setItemEditData({ tag_id: item.tag_id || '', bag_id: item.bag_id || '', notes: item.notes || '' });
                           setShowItemEditModal(true);
                         }}
                         className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:text-theme-text"
                       >
                         <span className="material-symbols-outlined text-[12px]">edit_note</span>
                         Track
                       </button>
                    </div>
                    {item.notes && (
                      <p className="text-[8px] text-amber-600 font-medium italic truncate px-1">Note: {item.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Summary Totals */}
            <div className="p-6 bg-theme-surface-container/50 border-t border-theme-border">
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs font-medium text-theme-text-muted">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {applicableVolDiscount > 0 && (
                  <div className="flex justify-between text-xs font-medium text-blue-600 animate-fade-in">
                    <span>Volume Discount ({volDiscountInfo.discount_percent}%)</span>
                    <span>-₹{applicableVolDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-medium text-theme-text-muted">
                  <span>Tax (18%)</span>
                  <span>₹{tax.toLocaleString('en-IN')}</span>
                </div>
                {couponData && (
                  <div className="flex justify-between text-xs font-medium text-purple-600 animate-fade-in">
                    <span>Promo: {couponData.code}</span>
                    <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {selectedCustomer && (
                  <div className="flex justify-between text-xs font-medium text-emerald-600">
                    <span>Member Advantage</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-theme-surface-container px-1.5 rounded">Applied</span>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <input 
                    type="text" 
                    placeholder="PROMO CODE" 
                    className="flex-1 bg-theme-surface border border-theme-border rounded-xl px-3 py-2 text-[10px] font-black tracking-widest outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-theme-text text-background rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Apply
                  </button>
                </div>
                <div className="pt-4 border-t border-theme-border flex justify-between items-end">
                  <span className="text-sm font-black uppercase tracking-widest text-theme-text">Total</span>
                  <span className="text-2xl font-black text-theme-text">
                    <AnimatedTotal value={total} />
                  </span>
                </div>
              </div>
              <button 
                disabled={cart.length === 0 || !selectedCustomer}
                onClick={() => setCurrentStep(3)}
                className="w-full primary-gradient text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/20 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                <span>Proceed to Schedule</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Schedule Step */}
      {currentStep === 3 && (
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in-up">
          <div className="w-full max-w-2xl bg-theme-surface rounded-[2rem] p-8 shadow-xl border border-theme-border/50 card-hover">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-theme-surface-container text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">schedule</span>
              </div>
              <div>
                <h2 className="text-2xl font-black font-headline text-theme-text">Scheduling Details</h2>
                <p className="text-sm font-medium text-theme-text-muted">When should we pick up and deliver?</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-5 rounded-2xl border border-theme-border bg-theme-surface-container/50">
                <h3 className="text-xs font-black uppercase tracking-widest text-theme-text-muted/70 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">local_shipping</span> Pickup Window
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-theme-text-muted mb-1 block uppercase">Date</label>
                    <input type="date" className="w-full bg-theme-surface border border-theme-border rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" value={schedule.pickupDate} onChange={e => setSchedule({...schedule, pickupDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-theme-text-muted mb-1 block uppercase">Time</label>
                    <input type="time" className="w-full bg-theme-surface border border-theme-border rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" value={schedule.pickupTime} onChange={e => setSchedule({...schedule, pickupTime: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-theme-border bg-theme-surface-container/50">
                <h3 className="text-xs font-black uppercase tracking-widest text-theme-text-muted/70 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">how_to_reg</span> Delivery Window
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-theme-text-muted mb-1 block uppercase">Date</label>
                    <input type="date" className="w-full bg-theme-surface border border-theme-border rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" value={schedule.deliveryDate} onChange={e => setSchedule({...schedule, deliveryDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-theme-text-muted mb-1 block uppercase">Time</label>
                    <input type="time" className="w-full bg-theme-surface border border-theme-border rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" value={schedule.deliveryTime} onChange={e => setSchedule({...schedule, deliveryTime: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Message */}
            {schedule.pickupDate && schedule.deliveryDate && new Date(`${schedule.pickupDate}T${schedule.pickupTime || '00:00'}`) > new Date(`${schedule.deliveryDate}T${schedule.deliveryTime || '00:00'}`) && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                <span className="material-symbols-outlined text-xl">error</span>
                <span className="text-sm font-bold">Delivery window cannot be earlier than the pickup window.</span>
              </div>
            )}

            <div className="flex gap-4 mt-8 pt-6 border-t border-theme-border">
              <button onClick={() => setCurrentStep(2)} className="px-8 py-4 rounded-2xl bg-theme-surface border border-theme-border font-bold text-theme-text-muted hover:bg-theme-surface-container transition-colors">Back</button>
              <button 
                onClick={() => setCurrentStep(4)} 
                disabled={
                  !schedule.pickupDate || 
                  !schedule.deliveryDate || 
                  new Date(`${schedule.pickupDate}T${schedule.pickupTime || '00:00'}`) > new Date(`${schedule.deliveryDate}T${schedule.deliveryTime || '00:00'}`)
                }
                className="flex-1 px-8 py-4 rounded-2xl primary-gradient text-white font-black shadow-lg shadow-emerald-900/10 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                Proceed to Payment <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Step */}
      {currentStep === 4 && (
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in-up">
          <div className="w-full max-w-2xl bg-theme-surface rounded-[2rem] p-8 shadow-xl border border-theme-border/50 card-hover overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-theme-surface-container text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">payments</span>
                </div>
                <h2 className="text-2xl font-black font-headline text-theme-text">Payment Settlement</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-theme-text-muted/70 uppercase tracking-widest">Balance Due</p>
                <div className="text-3xl font-black text-theme-text font-headline">
                  ₹{(total - payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0)).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            {/* Pay at Pickup Toggle */}
            <label className="flex items-center justify-between p-4 bg-theme-surface-container rounded-2xl cursor-pointer mb-6 group hover:bg-theme-surface-container transition-colors">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-theme-text-muted/70 group-hover:text-emerald-600">directions_run</span>
                <span className="text-sm font-bold text-theme-text">Pay at Collection</span>
              </div>
              <input 
                type="checkbox" 
                className="w-5 h-5 accent-emerald-600"
                checked={payAtPickup}
                onChange={(e) => {
                  setPayAtPickup(e.target.checked);
                  if (e.target.checked) setPayments([]);
                }}
              />
            </label>

            {selectedCustomer?.loyalty_points > 0 && (
              <div className="mb-6 p-5 bg-amber-50 rounded-2xl border border-amber-100 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-600">stars</span>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-900">Loyalty Rewards</span>
                  </div>
                  <span className="text-xs font-bold text-amber-700">{selectedCustomer.loyalty_points} Points Available</span>
                </div>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="0" 
                    max={Math.min(selectedCustomer.loyalty_points, totalRaw)}
                    value={redeemedPoints}
                    onChange={(e) => setRedeemedPoints(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                  <div className="w-20 text-right">
                    <span className="text-sm font-black text-amber-900">₹{redeemedPoints}</span>
                  </div>
                </div>
                <p className="text-[10px] font-medium text-amber-600 mt-2 italic">1 point = ₹1 discount. Points will be deducted upon confirmation.</p>
              </div>
            )}

            {!payAtPickup && (
              <div className="space-y-6">
                {/* Active Payments */}
                {payments.map((p, idx) => (
                  <div key={idx} className="p-5 rounded-2xl border-2 border-emerald-500 bg-theme-surface-container/30 animate-scale-in">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600 text-lg">
                          {p.method === 'cash' ? 'payments' : p.method === 'card' ? 'credit_card' : 'qr_code_scanner'}
                        </span>
                        <span className="text-xs font-black uppercase tracking-widest text-theme-text">{p.method}</span>
                      </div>
                      <button onClick={() => setPayments(payments.filter((_, i) => i !== idx))} className="text-theme-text-muted/70 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black uppercase text-theme-text-muted/70 tracking-wider block mb-1">Amount to Charge</label>
                        <input 
                          type="number" 
                          className="w-full bg-theme-surface border border-theme-border rounded-xl p-3 text-sm font-black text-theme-text outline-none"
                          value={p.amount}
                          onChange={(e) => {
                            const newPayments = [...payments];
                            newPayments[idx].amount = e.target.value;
                            setPayments(newPayments);
                          }}
                        />
                      </div>
                      {p.method === 'cash' && (
                        <div>
                          <label className="text-[9px] font-black uppercase text-theme-text-muted/70 tracking-wider block mb-1">Tendered</label>
                          <input 
                            type="number" 
                            className="w-full bg-theme-surface border border-theme-border rounded-xl p-3 text-sm font-black text-theme-text outline-none"
                            placeholder="Enter amount..."
                            value={p.tendered || ''}
                            onChange={(e) => {
                              const newPayments = [...payments];
                              newPayments[idx].tendered = e.target.value;
                              setPayments(newPayments);
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {p.method === 'cash' && p.tendered > p.amount && (
                      <div className="mt-4 pt-4 border-t border-theme-border flex justify-between items-center">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Return Change</span>
                        <span className="text-lg font-black text-theme-text">₹{(p.tendered - p.amount).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Payment Method */}
                <div className="grid grid-cols-3 gap-3">
                  {['cash', 'card', 'online'].map(m => (
                    <button 
                      key={m}
                      disabled={payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0) >= total}
                      onClick={() => {
                        const remaining = total - payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
                        setPayments([...payments, { method: m, amount: remaining > 0 ? remaining : 0 }]);
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-theme-border bg-theme-surface hover:border-theme-border hover:bg-theme-surface-container transition-all group disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined text-theme-text-muted/70 group-hover:text-emerald-600">
                        {m === 'cash' ? 'payments' : m === 'card' ? 'credit_card' : 'qr_code_scanner'}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-theme-text-muted/70 group-hover:text-theme-text">{m}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-8 mt-8 border-t border-theme-border">
              <button 
                onClick={() => setCurrentStep(3)} 
                disabled={submitting}
                className="px-8 py-4 rounded-2xl bg-theme-surface border border-theme-border font-bold text-theme-text-muted hover:bg-theme-surface-container transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button 
                onClick={() => handleSubmitOrder()} 
                disabled={submitting || (!payAtPickup && payments.length === 0)} 
                className="flex-1 px-8 py-4 rounded-2xl primary-gradient text-white font-black shadow-xl shadow-emerald-900/10 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">verified_user</span>
                    {payAtPickup ? 'Create Order (Pending)' : 'Finalize & Post Payment'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 backdrop-blur-md animate-fade-in">
          <div className="bg-theme-surface rounded-[2.5rem] p-8 max-w-sm w-full mx-4 shadow-2xl border border-amber-100 animate-scale-in">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <h3 className="text-xl font-black text-center text-theme-text mb-2">Duplicate Detected</h3>
            <p className="text-sm text-center text-theme-text-muted mb-8 px-2">
              An order for this customer was created less than 5 minutes ago. Are you sure you want to create another one?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleSubmitOrder(true)}
                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-amber-200 active:scale-95 transition-all"
              >
                Yes, Create Anyway
              </button>
              <button 
                onClick={() => setDuplicateWarning(null)}
                className="w-full py-4 bg-theme-surface-container text-theme-text-muted rounded-2xl font-bold text-sm hover:bg-slate-200 active:scale-95 transition-all"
              >
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Page Loading Overlay during Submission */}
      {submitting && !duplicateWarning && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-theme-surface/80 backdrop-blur-md animate-fade-in">
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-full border-4 border-theme-border border-t-emerald-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-500 animate-pulse">lock</span>
            </div>
          </div>
          <p className="text-sm font-black text-theme-text uppercase tracking-widest animate-pulse">Processing Transaction</p>
          <p className="text-[10px] text-theme-text-muted/70 mt-2">Securing data & finalizing items...</p>
        </div>
      )}
      {/* Custom Garment Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-on-surface/20 backdrop-blur-sm p-4">
          <div className="bg-theme-surface rounded-[2.5rem] shadow-2xl border border-theme-border/50 p-8 w-full max-w-md animate-scale-in">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-theme-surface-container text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">add_shopping_cart</span>
              </div>
              <div>
                <h2 className="text-xl font-black font-headline text-theme-text">Custom Garment</h2>
                <p className="text-xs font-medium text-theme-text-muted uppercase tracking-widest">Manual Item Entry</p>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              <div>
                <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest pl-2 mb-2 block">Item Description</label>
                <input 
                  autoFocus
                  className="w-full bg-theme-surface-container border-none rounded-2xl py-4 px-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-theme-text-muted/70"
                  placeholder="e.g. Designer Silk Jacket"
                  value={customItem.name} 
                  onChange={e => setCustomItem({ ...customItem, name: e.target.value })} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest pl-2 mb-2 block">Service Price (₹)</label>
                <input 
                  type="number"
                  className="w-full bg-theme-surface-container border-none rounded-2xl py-4 px-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-theme-text-muted/70 font-headline text-xl"
                  placeholder="0.00"
                  value={customItem.price} 
                  onChange={e => setCustomItem({ ...customItem, price: e.target.value })} 
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                disabled={!customItem.name || !customItem.price}
                onClick={() => {
                  addToCart({ 
                    garment_type: customItem.name, 
                    service_type: 'Custom Service', 
                    price: parseFloat(customItem.price) || 0 
                  });
                  setIsCustomModalOpen(false);
                }}
                className="w-full py-4 primary-gradient text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/10 active:scale-95 transition-all disabled:opacity-50"
              >
                Add to Cart
              </button>
              <button 
                onClick={() => setIsCustomModalOpen(false)}
                className="w-full py-4 bg-theme-surface-container text-theme-text-muted/70 rounded-2xl font-bold text-sm hover:bg-theme-surface-container transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Item Edit Modal */}
      {showItemEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 backdrop-blur-md animate-fade-in">
          <div className="bg-theme-surface rounded-[2.5rem] p-8 max-w-sm w-full mx-4 shadow-2xl border border-theme-border animate-scale-in">
            <h3 className="text-xl font-black text-theme-text mb-6">Item Intake Details</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest block mb-1">Tag ID (Scanner)</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full bg-theme-surface-container border border-transparent rounded-xl p-3 text-sm font-bold focus:bg-theme-surface focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                  value={itemEditData.tag_id}
                  onChange={e => setItemEditData({...itemEditData, tag_id: e.target.value})}
                  placeholder="Scan or type tag..."
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest block mb-1">Bag Reference</label>
                <input 
                  type="text" 
                  className="w-full bg-theme-surface-container border border-transparent rounded-xl p-3 text-sm font-bold focus:bg-theme-surface focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                  value={itemEditData.bag_id}
                  onChange={e => setItemEditData({...itemEditData, bag_id: e.target.value})}
                  placeholder="e.g. B-01"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest block mb-1">Special Instructions</label>
                <textarea 
                  className="w-full bg-theme-surface-container border border-transparent rounded-xl p-3 text-sm font-bold focus:bg-theme-surface focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all h-20"
                  value={itemEditData.notes}
                  onChange={e => setItemEditData({...itemEditData, notes: e.target.value})}
                  placeholder="Stains, delicate fabric, etc."
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  const newCart = [...cart];
                  newCart[itemEditIndex] = { ...newCart[itemEditIndex], ...itemEditData };
                  setCart(newCart);
                  setShowItemEditModal(false);
                }}
                className="w-full py-4 primary-gradient text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/10 active:scale-95 transition-all"
              >
                Apply Tracking
              </button>
              <button 
                onClick={() => setShowItemEditModal(false)}
                className="w-full py-4 bg-theme-surface-container text-theme-text-muted rounded-2xl font-bold text-sm hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
