'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import Script from 'next/script';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import CustomerSection from './components/CustomerSection';
import ServiceCatalog from './components/ServiceCatalog';
import OrderCart from './components/OrderCart';
import ScheduleSection from './components/ScheduleSection';
import PaymentSection from './components/PaymentSection';
import CustomItemModal from './components/modals/CustomItemModal';
import ItemEditModal from './components/modals/ItemEditModal';
import DuplicateWarningModal from './components/modals/DuplicateWarningModal';
import AddCategoryModal from './components/modals/AddCategoryModal';
import BottomSheet from '@/components/common/BottomSheet';
import FloatingCartPill from './components/FloatingCartPill';

// Hooks
import { useOrderLogic } from './hooks/useOrderLogic';
import { useBackgroundSync } from './hooks/useBackgroundSync';
import { useOrderSubmission } from './hooks/useOrderSubmission';

const fetcher = (url) => fetch(url).then((res) => res.json());

function getGarmentIcon(type) {
  const t = (type || '').toLowerCase();
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

  // Logic Hooks
  const orderLogic = useOrderLogic();
  const {
    cart, setCart, addToCart, removeFromCart, updateQuantity, updateItemPrice,
    subtotal, applicableVolDiscount, volDiscountInfo, setVolDiscountInfo,
    tax, couponData, setCouponData, couponDiscount, redeemedPoints, setRedeemedPoints,
    total, couponCode, setCouponCode
  } = orderLogic;

  const { syncing, offlineCount, syncOrders } = useBackgroundSync();

  const [schedule, setSchedule] = useState({
    pickupDate: '', pickupTime: '09:00', deliveryDate: '', deliveryTime: '17:00'
  });
  const [payAtPickup, setPayAtPickup] = useState(false);
  const [payments, setPayments] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const submission = useOrderSubmission(
    selectedCustomer, cart, total, applicableVolDiscount, 
    couponDiscount, redeemedPoints, couponData, schedule, 
    payAtPickup, payments, editId
  );

  const { submitting, orderComplete, setOrderComplete, duplicateWarning, setDuplicateWarning, handleSubmitOrder } = submission;

  // Local View State
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInlineCreating, setIsInlineCreating] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [activeCategory, setActiveCategory] = useState('All');
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(2);
  const [itemEditIndex, setItemEditIndex] = useState(null);
  const [showItemEditModal, setShowItemEditModal] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [addCategoryLoading, setAddCategoryLoading] = useState(false);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);

  // Data Fetching
  const { data: bootstrapData } = useSWR('/api/orders/bootstrap', fetcher, {
    revalidateOnFocus: false,
    fallbackData: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('pos_bootstrap_cache') || 'null') : null
  });

  useEffect(() => {
    if (bootstrapData) {
      localStorage.setItem('pos_bootstrap_cache', JSON.stringify(bootstrapData));
      if (bootstrapData.discounts?.length > 0) setVolDiscountInfo(bootstrapData.discounts[0]);
    }
  }, [bootstrapData, setVolDiscountInfo]);

  const pricing = useMemo(() => bootstrapData?.pricing || [], [bootstrapData]);
  const garmentTypes = useMemo(() => ['All', ...new Set(pricing.map(p => p.garment_type))], [pricing]);

  // Search Logic
  const searchCache = useRef(new Map());
  useEffect(() => {
    if (!searchQuery) { setCustomers([]); return; }
    if (searchCache.current.has(searchQuery)) { setCustomers(searchCache.current.get(searchQuery)); return; }
    const timer = setTimeout(() => {
      fetch(`/api/customers?search=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json())
        .then(data => {
          const results = Array.isArray(data) ? data : [];
          setCustomers(results);
          if (searchCache.current.size > 50) searchCache.current.delete(searchCache.current.keys().next().value);
          searchCache.current.set(searchQuery, results);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handlers
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, subtotal: subtotal })
    });
    const data = await res.json();
    if (res.ok) setCouponData(data);
    else { alert(data.error); setCouponData(null); }
  };

  const handleCreateCustomer = async () => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer),
    });
    const result = await res.json();
    if (!res.ok) return setInlineError(result.error || 'Failed to create customer');
    setCustomers([result, ...customers]);
    setInlineError('');
    setSelectedCustomer(result);
    setIsInlineCreating(false);
    setIsCustomerSearchOpen(false);
    setCurrentStep(2);
    setNewCustomer({ name: '', phone: '', email: '', address: '' });
  };

  const handleAddCategory = async (newCategory) => {
    setAddCategoryLoading(true);
    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCategory, price: parseFloat(newCategory.price) }),
      });
      if (res.ok) { setActiveCategory(newCategory.garment_type); setShowAddCategoryModal(false); }
      else { const err = await res.json(); alert(err.error || 'Failed to add category'); }
    } catch (e) { alert('Network error: ' + e.message); }
    setAddCategoryLoading(false);
  };

  const steps = [
    { icon: 'person', label: t('customer_sidebar'), step: 1 },
    { icon: 'dry_cleaning', label: t('service_type_label'), step: 2 },
    { icon: 'schedule', label: t('schedule'), step: 3 },
    { icon: 'payments', label: t('payment'), step: 4 },
  ];

  if (orderComplete) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8">
        <div className="relative mb-6">
          <div className={`w-24 h-24 rounded-full bg-theme-surface-container flex items-center justify-center shadow-xl breathe-glow ${orderComplete.payment_pending ? 'text-amber-500 shadow-amber-100' : 'text-emerald-500 shadow-emerald-100'}`}>
            <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>{orderComplete.payment_pending ? 'pending' : 'verified'}</span>
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
    <div className="flex flex-col h-screen overflow-hidden bg-theme-surface-container/10">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      {/* Header */}
      <div className="flex items-center justify-center pt-4 lg:pt-8 pb-4 shrink-0 px-2 animate-fade-in-up">
        <div className="flex items-center w-full max-w-3xl bg-theme-surface/50 backdrop-blur-md p-2 lg:p-4 rounded-[2rem] border border-theme-border/40 shadow-sm relative">
          {offlineCount > 0 && (
            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.12em] flex items-center gap-2 shadow-lg transition-all border ${syncing ? 'bg-amber-500 text-white border-amber-400 animate-pulse' : 'bg-emerald-500 text-white border-emerald-400'}`} onClick={syncOrders}>
              <span className="material-symbols-outlined text-[13px]">{syncing ? 'sync' : 'cloud_upload'}</span>
              {syncing ? 'Syncing...' : `${offlineCount} Offline Order${offlineCount > 1 ? 's' : ''}`}
            </div>
          )}
          {steps.map((s, i) => (
            <div key={s.step} className="contents">
              <div className="flex flex-col items-center gap-1.5 lg:gap-2 px-2 flex-1 cursor-pointer" onClick={() => setCurrentStep(s.step)}>
                <div className={`w-9 h-9 lg:w-12 lg:h-12 rounded-[1rem] flex items-center justify-center transition-all duration-500 ${s.step <= currentStep ? 'primary-gradient text-white shadow-lg scale-110' : 'bg-theme-surface-container/60 text-theme-text-muted/20'}`}>
                  <span className="material-symbols-outlined text-lg lg:text-xl">{s.icon}</span>
                </div>
                <span className={`text-[7px] lg:text-[9px] font-black uppercase tracking-[0.1em] transition-colors ${s.step <= currentStep ? 'text-theme-text' : 'text-theme-text-muted/30'}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className="flex-1 px-1 lg:px-3 mb-4 lg:mb-5"><div className={`h-[2px] w-full rounded-full transition-colors duration-700 ${s.step < currentStep ? 'bg-emerald-500' : 'bg-theme-surface-container/40'}`}></div></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 px-4 pb-4 max-w-[1600px] mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full min-h-0">
            {currentStep === 1 && (
              <div className="lg:hidden h-full">
                <CustomerSection 
                  selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer} isCustomerSearchOpen={isCustomerSearchOpen} setIsCustomerSearchOpen={setIsCustomerSearchOpen}
                  searchQuery={searchQuery} setSearchQuery={setSearchQuery} filteredCustomers={customers} isInlineCreating={isInlineCreating} setIsInlineCreating={setIsInlineCreating}
                  inlineError={inlineError} setInlineError={setInlineError} newCustomer={newCustomer} setNewCustomer={setNewCustomer} handleCreateCustomer={handleCreateCustomer}
                  setCurrentStep={setCurrentStep} t={t}
                />
                {selectedCustomer && <div className="mt-8 flex justify-center animate-fade-in"><button onClick={() => setCurrentStep(2)} className="px-12 py-4 primary-gradient text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 flex items-center gap-2 uppercase tracking-widest">Items <span className="material-symbols-outlined">arrow_forward</span></button></div>}
              </div>
            )}

            {currentStep <= 2 && (
              <div className="hidden lg:grid lg:grid-cols-12 gap-6 h-full min-h-0">
                <ServiceCatalog 
                  garmentTypes={garmentTypes} activeCategory={activeCategory} setActiveCategory={setActiveCategory} getCategoryIcon={(c) => c === t('all_label') ? 'grid_view' : 'dry_cleaning'}
                  getGarmentIcon={getGarmentIcon} pricing={pricing} addToCart={addToCart} setShowAddCategoryModal={setShowAddCategoryModal}
                  handleAddCustomGarment={() => setIsCustomModalOpen(true)} t={t}
                />
                <div className="lg:col-span-4 flex flex-col min-h-0 animate-fade-in-up">
                  <OrderCart 
                    cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} updateItemPrice={updateItemPrice} getGarmentIcon={getGarmentIcon} 
                    subtotal={subtotal} applicableVolDiscount={applicableVolDiscount} volDiscountInfo={volDiscountInfo} tax={tax} couponData={couponData} couponDiscount={couponDiscount}
                    redeemedPoints={redeemedPoints} total={total} couponCode={couponCode} setCouponCode={setCouponCode} handleApplyCoupon={handleApplyCoupon} setCurrentStep={setCurrentStep}
                    setItemEditIndex={setItemEditIndex} setShowItemEditModal={setShowItemEditModal} selectedCustomer={selectedCustomer} t={t}
                    customerHeader={
                      <CustomerSection 
                        selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer} isCustomerSearchOpen={isCustomerSearchOpen} setIsCustomerSearchOpen={setIsCustomerSearchOpen}
                        searchQuery={searchQuery} setSearchQuery={setSearchQuery} filteredCustomers={customers} isInlineCreating={isInlineCreating} setIsInlineCreating={setIsInlineCreating}
                        inlineError={inlineError} setInlineError={setInlineError} newCustomer={newCustomer} setNewCustomer={setNewCustomer} handleCreateCustomer={handleCreateCustomer}
                        setCurrentStep={setCurrentStep} t={t}
                      />
                    }
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="lg:hidden h-full flex flex-col min-h-0">
                <ServiceCatalog 
                  garmentTypes={garmentTypes} activeCategory={activeCategory} setActiveCategory={setActiveCategory} getCategoryIcon={(c) => c === t('all_label') ? 'grid_view' : 'dry_cleaning'}
                  getGarmentIcon={getGarmentIcon} pricing={pricing} addToCart={addToCart} setShowAddCategoryModal={setShowAddCategoryModal}
                  handleAddCustomGarment={() => setIsCustomModalOpen(true)} t={t}
                />
              </div>
            )}

            {currentStep === 3 && <div className="h-full overflow-y-auto no-scrollbar"><ScheduleSection schedule={schedule} setSchedule={setSchedule} setCurrentStep={setCurrentStep} t={t} /></div>}
            {currentStep === 4 && <div className="h-full overflow-y-auto no-scrollbar"><PaymentSection total={total} payments={payments} setPayments={setPayments} payAtPickup={payAtPickup} setPayAtPickup={setPayAtPickup} selectedCustomer={selectedCustomer} redeemedPoints={redeemedPoints} setRedeemedPoints={setRedeemedPoints} submitting={submitting} handleSubmitOrder={handleSubmitOrder} setCurrentStep={setCurrentStep} t={t} /></div>}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modals */}
      <CustomItemModal isOpen={isCustomModalOpen} onClose={() => setIsCustomModalOpen(false)} onAdd={addToCart} t={t} />
      <ItemEditModal isOpen={showItemEditModal} onClose={() => setShowItemEditModal(false)} onSave={(data) => { const nc = [...cart]; nc[itemEditIndex] = { ...nc[itemEditIndex], ...data }; setCart(nc); setShowItemEditModal(false); }} data={cart[itemEditIndex]} t={t} />
      <DuplicateWarningModal isOpen={!!duplicateWarning} onConfirm={handleSubmitOrder} onCancel={() => setDuplicateWarning(null)} data={duplicateWarning} t={t} />
      <AddCategoryModal isOpen={showAddCategoryModal} onClose={() => setShowAddCategoryModal(false)} onAdd={handleAddCategory} loading={addCategoryLoading} t={t} />

      <FloatingCartPill itemCount={cart.length} total={total} onTap={() => setIsCartSheetOpen(true)} />
      <BottomSheet isOpen={isCartSheetOpen} onClose={() => setIsCartSheetOpen(false)} title="Your Cart" snapPoint="full">
        <div className="p-2 h-full pb-20">
          <OrderCart 
            cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} updateItemPrice={updateItemPrice} getGarmentIcon={getGarmentIcon}
            subtotal={subtotal} applicableVolDiscount={applicableVolDiscount} volDiscountInfo={volDiscountInfo} tax={tax} couponData={couponData} couponDiscount={couponDiscount}
            redeemedPoints={redeemedPoints} total={total} couponCode={couponCode} setCouponCode={setCouponCode} handleApplyCoupon={handleApplyCoupon}
            setCurrentStep={(s) => { setCurrentStep(s); setIsCartSheetOpen(false); }} setItemEditIndex={setItemEditIndex} setShowItemEditModal={setShowItemEditModal}
            selectedCustomer={selectedCustomer} t={t} isMobileSheet={true}
            customerHeader={<CustomerSection selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer} isCustomerSearchOpen={isCustomerSearchOpen} setIsCustomerSearchOpen={setIsCustomerSearchOpen} searchQuery={searchQuery} setSearchQuery={setSearchQuery} filteredCustomers={customers} isInlineCreating={isInlineCreating} setIsInlineCreating={setIsInlineCreating} inlineError={inlineError} setInlineError={setInlineError} newCustomer={newCustomer} setNewCustomer={setNewCustomer} handleCreateCustomer={handleCreateCustomer} setCurrentStep={setCurrentStep} t={t} />}
          />
        </div>
      </BottomSheet>

      {submitting && !duplicateWarning && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-theme-surface/80 backdrop-blur-md animate-fade-in text-center">
          <div className="relative mb-8"><div className="w-20 h-20 rounded-full border-4 border-theme-border border-t-emerald-500 animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><span className="material-symbols-outlined text-emerald-500 animate-pulse">lock</span></div></div>
          <p className="text-sm font-black text-theme-text uppercase tracking-widest animate-pulse">Processing Transaction</p>
        </div>
      )}
    </div>
  );
}
