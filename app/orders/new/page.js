'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import Script from 'next/script';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerSection from './components/CustomerSection';
import ServiceCatalog from './components/ServiceCatalog';
import OrderCart from './components/OrderCart';
import ScheduleSection from './components/ScheduleSection';
import PaymentSection from './components/PaymentSection';
import CustomItemModal from './components/modals/CustomItemModal';
import ItemEditModal from './components/modals/ItemEditModal';
import DuplicateWarningModal from './components/modals/DuplicateWarningModal';
import AddCategoryModal from './components/modals/AddCategoryModal';
import { useOrderLogic } from './hooks/useOrderLogic';
import { useBackgroundSync } from './hooks/useBackgroundSync';
import { offlineStore } from './utils/offlineStore';

const fetcher = (url) => fetch(url).then((res) => res.json());

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

export default function NewOrder() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const {
    cart, setCart, addToCart, removeFromCart, updateQuantity, updateItemPrice,
    subtotal, applicableVolDiscount, volDiscountInfo, setVolDiscountInfo,
    tax, couponData, setCouponData, couponDiscount, redeemedPoints, setRedeemedPoints,
    total, couponCode, setCouponCode
  } = useOrderLogic();

  const { syncing, offlineCount, syncOrders } = useBackgroundSync();

  // Advanced Caching with SWR
  const { data: bootstrapData, error: bootstrapError } = useSWR('/api/orders/bootstrap', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
    fallbackData: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('pos_bootstrap_cache') || 'null') : null
  });

  useEffect(() => {
    if (bootstrapData) {
      localStorage.setItem('pos_bootstrap_cache', JSON.stringify(bootstrapData));
      if (bootstrapData.discounts?.length > 0) {
        setVolDiscountInfo(bootstrapData.discounts[0]);
      }
    }
  }, [bootstrapData, setVolDiscountInfo]);

  const pricing = useMemo(() => bootstrapData?.pricing || [], [bootstrapData]);

  // Category icons mapping
  const CATEGORY_ICONS = useMemo(() => ({
    [t('all_label')]: 'grid_view',
    [t('dry_clean_label')]: 'dry_cleaning',
    [t('laundry_label')]: 'local_laundry_service',
    [t('pressing_label')]: 'iron',
    [t('delicates_label')]: 'flare',
    [t('household_label')]: 'checkroom',
  }), [t]);

  const getCategoryIcon = (cat) => CATEGORY_ICONS[cat] || 'dry_cleaning';

  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
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

  const [itemEditIndex, setItemEditIndex] = useState(null);
  const [showItemEditModal, setShowItemEditModal] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [addCategoryLoading, setAddCategoryLoading] = useState(false);

  // Keyboard Shortcuts (Phase 2)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+F or Cmd+F for search (only if not already in an input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        if (document.activeElement.tagName !== 'INPUT') {
          e.preventDefault();
          setIsCustomerSearchOpen(true);
          const searchInput = document.querySelector('input[placeholder*="Search"]');
          if (searchInput) searchInput.focus();
        }
      }
      // Ctrl+S or Cmd+S to save/submit
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentStep === 4) handleSubmitOrder();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  useEffect(() => {
    if (editId) {
      fetch(`/api/orders/${editId}`)
        .then(r => r.json())
        .then(data => {
          if (data.error) return alert(data.error);
          setSelectedCustomer({ id: data.customer_id, name: data.customer_name, phone: data.customer_phone, loyalty_points: data.loyalty_points });
          setCart(data.items.map(i => ({ ...i, price: parseFloat(i.price) })));
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
  }, [editId, setCart]);

  // Client-side search cache (LRU pattern)
  const searchCache = useRef(new Map());

  // Debounced Customer Search
  useEffect(() => {
    if (!searchQuery) {
      setCustomers([]);
      return;
    }

    if (searchCache.current.has(searchQuery)) {
      setCustomers(searchCache.current.get(searchQuery));
      return;
    }

    const timer = setTimeout(() => {
      fetch(`/api/customers?search=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json())
        .then(data => {
          const results = Array.isArray(data) ? data : [];
          setCustomers(results);
          if (searchCache.current.size > 50) {
            const firstKey = searchCache.current.keys().next().value;
            searchCache.current.delete(firstKey);
          }
          searchCache.current.set(searchQuery, results);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const garmentTypes = useMemo(() => ['All', ...new Set(pricing.map(p => p.garment_type))], [pricing]);

  const handleAddCategory = async (newCategory) => {
    const price = parseFloat(newCategory.price);
    setAddCategoryLoading(true);
    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garment_type: newCategory.garment_type, service_type: newCategory.service_type, price }),
      });
      if (res.ok) {
        // Mutation with SWR would be cleaner here, but for now we manually update
        const added = await res.json();
        setActiveCategory(newCategory.garment_type);
        setShowAddCategoryModal(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add category');
      }
    } catch (e) {
      alert('Network error: ' + e.message);
    }
    setAddCategoryLoading(false);
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

  const handlePayOnline = async (orderId) => {
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate payment');
      if (data.provider === 'none') return { success: true };

      if (data.provider === 'razorpay') {
        return new Promise((resolve) => {
          const options = {
            key: data.key,
            amount: data.amount,
            currency: data.currency,
            name: data.order_details.name,
            description: data.order_details.description,
            order_id: data.order_id,
            handler: async function (response) {
              try {
                const verifyRes = await fetch('/api/verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    internal_order_id: orderId,
                  }),
                });
                const verifyData = await verifyRes.json();
                resolve({ success: verifyRes.ok && verifyData.success });
              } catch (err) {
                console.error('Payment verification failed:', err);
                resolve({ success: false, error: err.message });
              }
            },
            modal: { ondismiss: () => resolve({ success: false, dismissed: true }) },
            prefill: { name: selectedCustomer?.name || '', contact: selectedCustomer?.phone || '' },
            theme: { color: '#10b981' },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        });
      }
      return { success: false, error: 'Unsupported payment provider' };
    } catch (error) {
      alert('Payment initialization failed: ' + error.message);
      return { success: false, error: error.message };
    }
  };

  const handleSubmitOrder = async (force = false) => {
    if (!selectedCustomer) return alert('Select a customer');

    if (schedule.pickupDate && schedule.deliveryDate) {
      const pDate = new Date(`${schedule.pickupDate}T${schedule.pickupTime || '00:00'}`);
      const dDate = new Date(`${schedule.deliveryDate}T${schedule.deliveryTime || '00:00'}`);
      if (pDate > dDate) return alert('Pickup date/time cannot be later than delivery date/time.');
    }

    const orderPayload = {
      customer_id: selectedCustomer.id,
      items: cart,
      totalAmount: total,
      discountAmount: applicableVolDiscount + couponDiscount + redeemedPoints,
      payments: payAtPickup ? [] : payments,
      redeemedPoints: redeemedPoints,
      coupon_id: couponData?.id,
      schedule: schedule,
      force: force
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const offlineId = await offlineStore.saveOfflineOrder(orderPayload);
      alert(`System Offline. Order saved locally (ID: ${offlineId}) and will sync automatically when back online.`);
      setOrderComplete({ id: offlineId, order_number: 'OFFLINE', payment_pending: true });
      return;
    }

    setSubmitting(true);
    setDuplicateWarning(null);
    try {
      const url = editId ? `/api/orders/${editId}` : '/api/orders';
      const method = editId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
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
      } else if (order.requires_online_payment) {
        const paymentResult = await handlePayOnline(order.id);
        setOrderComplete(paymentResult?.success ? order : { ...order, payment_pending: true });
      } else {
        setOrderComplete(order);
      }
    } catch (e) {
      alert('Order failed: ' + e.message);
    }
    setSubmitting(false);
  };

  const steps = [
    { icon: 'person', label: t('customer_sidebar'), step: 1 },
    { icon: 'dry_cleaning', label: t('service_type_label'), step: 2 },
    { icon: 'schedule', label: t('schedule'), step: 3 },
    { icon: 'payments', label: t('payment'), step: 4 },
  ];

  if (orderComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8"
      >
        <div className="relative mb-6">
          <div className={`w-24 h-24 rounded-full bg-theme-surface-container flex items-center justify-center shadow-xl breathe-glow ${
            orderComplete.payment_pending ? 'text-amber-500 shadow-amber-100' : 'text-emerald-500 shadow-emerald-100'
          }`}>
            <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {orderComplete.payment_pending ? 'pending' : 'verified'}
            </span>
          </div>
        </div>
        <h1 className="text-4xl font-black text-theme-text mb-2 font-headline">{t('order_placed')}</h1>
        <p className="text-xl text-theme-text-muted mb-10 font-medium">Receipt <span className={orderComplete.payment_pending ? 'text-amber-600 font-bold' : 'text-primary font-bold'}>#{orderComplete.order_number}</span> {orderComplete.payment_pending ? 'created with pending payment.' : 'has been generated.'}</p>
        <div className="flex gap-4">
          <button onClick={() => { setOrderComplete(null); setCart([]); setSelectedCustomer(null); setPayments([]); setCurrentStep(2); }} className="px-10 py-4 premium-gradient text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">New Transaction</button>
          <button onClick={() => router.push(`/orders/${orderComplete.id}`)} className="px-10 py-4 ghost-border bg-theme-surface text-theme-text rounded-2xl font-bold text-sm hover:bg-theme-surface-container transition-all">Track Order</button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:overflow-y-auto">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="flex items-center justify-center animate-fade-in-up py-2 shrink-0" style={{height: '80px'}}>
        <div className="flex items-center w-full max-w-2xl bg-theme-surface/50 backdrop-blur-sm p-4 rounded-[2rem] border border-theme-border/40 shadow-sm relative">
          {offlineCount > 0 && (
            <div 
              className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all border ${
                syncing ? 'bg-amber-500 text-white border-amber-400 animate-pulse' : 'bg-emerald-500 text-white border-emerald-400'
              }`}
              onClick={syncOrders}
            >
              <span className="material-symbols-outlined text-[12px]">{syncing ? 'sync' : 'cloud_upload'}</span>
              {syncing ? 'Syncing...' : `${offlineCount} Offline Order${offlineCount > 1 ? 's' : ''}`}
            </div>
          )}
          {steps.map((s, i) => (
            <div key={s.step} className="contents">
              <div 
                className="flex flex-col items-center gap-2 group relative cursor-pointer"
                onClick={() => setCurrentStep(s.step)}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative z-10 ${s.step <= currentStep ? 'primary-gradient text-white shadow-lg scale-110' : 'bg-theme-surface-container text-theme-text-muted/30'}`}>
                  <span className="material-symbols-outlined text-xl">{s.icon}</span>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${s.step <= currentStep ? 'text-theme-text' : 'text-theme-text-muted/40'}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className="flex-1 px-4 mb-6"><div className={`h-[2px] w-full rounded-full ${s.step < currentStep ? 'bg-emerald-500' : 'bg-theme-surface-container'}`}></div></div>}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-y-auto"
        >
          {currentStep <= 2 && (
            <div className="grid lg:grid-cols-12 gap-4 h-full">
              <ServiceCatalog 
                garmentTypes={garmentTypes} activeCategory={activeCategory} setActiveCategory={setActiveCategory}
                getCategoryIcon={getCategoryIcon} getGarmentIcon={getGarmentIcon} pricing={pricing}
                addToCart={addToCart} setShowAddCategoryModal={setShowAddCategoryModal}
                handleAddCustomGarment={() => setIsCustomModalOpen(true)} t={t}
              />
              <OrderCart 
                cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} updateItemPrice={updateItemPrice}
                getGarmentIcon={getGarmentIcon} subtotal={subtotal} applicableVolDiscount={applicableVolDiscount}
                volDiscountInfo={volDiscountInfo} tax={tax} couponData={couponData} couponDiscount={couponDiscount}
                redeemedPoints={redeemedPoints} total={total} couponCode={couponCode} setCouponCode={setCouponCode}
                handleApplyCoupon={handleApplyCoupon} setCurrentStep={setCurrentStep} setItemEditIndex={setItemEditIndex}
                setShowItemEditModal={setShowItemEditModal} selectedCustomer={selectedCustomer} t={t}
                customerHeader={
                  <CustomerSection 
                    selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer}
                    isCustomerSearchOpen={isCustomerSearchOpen} setIsCustomerSearchOpen={setIsCustomerSearchOpen}
                    searchQuery={searchQuery} setSearchQuery={setSearchQuery} filteredCustomers={customers}
                    isInlineCreating={isInlineCreating} setIsInlineCreating={setIsInlineCreating}
                    inlineError={inlineError} setInlineError={setInlineError} newCustomer={newCustomer}
                    setNewCustomer={setNewCustomer} handleCreateCustomer={handleCreateCustomer}
                    setCurrentStep={setCurrentStep} t={t}
                  />
                }
              />
            </div>
          )}

          {currentStep === 3 && <ScheduleSection schedule={schedule} setSchedule={setSchedule} setCurrentStep={setCurrentStep} t={t} />}
          {currentStep === 4 && <PaymentSection total={total} payments={payments} setPayments={setPayments} payAtPickup={payAtPickup} setPayAtPickup={setPayAtPickup} selectedCustomer={selectedCustomer} redeemedPoints={redeemedPoints} setRedeemedPoints={setRedeemedPoints} submitting={submitting} handleSubmitOrder={handleSubmitOrder} setCurrentStep={setCurrentStep} t={t} />}
        </motion.div>
      </AnimatePresence>

      <CustomItemModal isOpen={isCustomModalOpen} onClose={() => setIsCustomModalOpen(false)} onAdd={addToCart} t={t} />
      <ItemEditModal 
        isOpen={showItemEditModal} onClose={() => setShowItemEditModal(false)} 
        onSave={(data) => {
          const newCart = [...cart];
          newCart[itemEditIndex] = { ...newCart[itemEditIndex], ...data };
          setCart(newCart);
          setShowItemEditModal(false);
        }}
        data={cart[itemEditIndex]} t={t} 
      />
      <DuplicateWarningModal isOpen={!!duplicateWarning} onConfirm={handleSubmitOrder} onCancel={() => setDuplicateWarning(null)} data={duplicateWarning} t={t} />
      <AddCategoryModal isOpen={showAddCategoryModal} onClose={() => setShowAddCategoryModal(false)} onAdd={handleAddCategory} loading={addCategoryLoading} t={t} />

      {submitting && !duplicateWarning && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-theme-surface/80 backdrop-blur-md animate-fade-in">
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-full border-4 border-theme-border border-t-emerald-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center"><span className="material-symbols-outlined text-emerald-500 animate-pulse">lock</span></div>
          </div>
          <p className="text-sm font-black text-theme-text uppercase tracking-widest animate-pulse">Processing Transaction</p>
        </div>
      )}

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[50] bg-theme-surface/90 backdrop-blur-xl border-t border-theme-border p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
          <div className="flex flex-col"><span className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest">Total Amount</span><span className="text-xl font-black text-theme-text font-headline">₹{total}</span></div>
          {currentStep === 2 && <button disabled={cart.length === 0} onClick={() => setCurrentStep(3)} className="flex-1 max-w-[200px] py-4 primary-gradient text-white rounded-2xl font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2">Next Step <span className="material-symbols-outlined text-sm">arrow_forward</span></button>}
          {currentStep === 3 && <button onClick={() => setCurrentStep(4)} className="flex-1 max-w-[200px] py-4 primary-gradient text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2">Payment <span className="material-symbols-outlined text-sm">payments</span></button>}
          {currentStep === 4 && <button disabled={submitting} onClick={() => handleSubmitOrder()} className="flex-1 max-w-[200px] py-4 primary-gradient text-white rounded-2xl font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2">{submitting ? 'Processing...' : 'Complete'} <span className="material-symbols-outlined text-sm">check_circle</span></button>}
        </div>
      </div>
    </div>
  );
}

