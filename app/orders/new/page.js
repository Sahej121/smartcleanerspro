'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import PhotoCapture from '@/components/logistics/PhotoCapture';
import Script from 'next/script';
import { AnimatedTotal } from '@/components/common/AnimatedStats';
import CustomerSection from './components/CustomerSection';
import ServiceCatalog from './components/ServiceCatalog';
import OrderCart from './components/OrderCart';
import ScheduleSection from './components/ScheduleSection';
import PaymentSection from './components/PaymentSection';

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
  
  // Category icons mapping
  const CATEGORY_ICONS = {
    [t('all_label')]: 'grid_view',
    [t('dry_clean_label')]: 'dry_cleaning',
    [t('laundry_label')]: 'local_laundry_service',
    [t('pressing_label')]: 'iron',
    [t('delicates_label')]: 'flare',
    [t('household_label')]: 'checkroom',
  };

  const getCategoryIcon = (cat) => {
    return CATEGORY_ICONS[cat] || 'dry_cleaning';
  };
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
  const [itemEditData, setItemEditData] = useState({ tag_id: '', bag_id: '', notes: '', fabric_hint: '', stain_analysis: null });
  const [showStainCapture, setShowStainCapture] = useState(false);
  const [stainAnalyzing, setStainAnalyzing] = useState(false);
  const [stainError, setStainError] = useState('');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', price: '' });
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ garment_type: '', service_type: 'Dry Cleaning', price: '' });
  const [addCategoryLoading, setAddCategoryLoading] = useState(false);

  const addToCart = (item) => {
    // Each garment is a unique physical item for tracking
    setCart([...cart, { ...item, quantity: 1, tag_id: '', bag_id: '', notes: '' }]);
  };

  const handleAddCustomGarment = () => {
    setCustomItem({ name: '', price: '' });
    setIsCustomModalOpen(true);
  };

  const handleAddCategory = async () => {
    const price = parseFloat(newCategory.price);
    if (!newCategory.garment_type || !newCategory.service_type || isNaN(price) || price <= 0) return;
    setAddCategoryLoading(true);
    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garment_type: newCategory.garment_type, service_type: newCategory.service_type, price }),
      });
      if (res.ok) {
        const added = await res.json();
        setPricing(prev => [...prev, added]);
        setActiveCategory(newCategory.garment_type);
        setShowAddCategoryModal(false);
        setNewCategory({ garment_type: '', service_type: 'Dry Cleaning', price: '' });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add category');
      }
    } catch (e) {
      alert('Network error: ' + e.message);
    }
    setAddCategoryLoading(false);
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

  const handlePayOnline = async (orderId, orderData) => {
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      // Handle Zero-Amount or Discounted orders (provider: 'none')
      if (data.provider === 'none') {
        return { success: true };
      }

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
              // Called after successful payment on Razorpay side
              await fetch('/api/webhooks/razorpay', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-razorpay-signature': response.razorpay_signature,
                },
                body: JSON.stringify({
                  event: 'payment.captured',
                  payload: {
                    payment: {
                      entity: {
                        id: response.razorpay_payment_id,
                        amount: data.amount,
                        notes: { order_id: orderId },
                      },
                    },
                  },
                }),
              });
              resolve({ success: true });
            },
            modal: {
              ondismiss: function () {
                // User closed the popup — order stays pending
                resolve({ success: false, dismissed: true });
              },
            },
            prefill: {
              name: selectedCustomer?.name || '',
              contact: selectedCustomer?.phone || '',
            },
            theme: {
              color: '#10b981',
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (resp) {
            console.error('Razorpay Payment Failed:', resp.error);
            resolve({ success: false, error: resp.error.description });
          });
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
      } else if (order.requires_online_payment) {
        // Trigger Razorpay checkout before showing success
        const paymentResult = await handlePayOnline(order.id, order);
        if (paymentResult?.success) {
          setOrderComplete(order);
        } else {
          // Payment dismissed or failed — still show order but note pending payment
          setOrderComplete({ ...order, payment_pending: true });
        }
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
          <div className={`w-24 h-24 rounded-full bg-theme-surface-container flex items-center justify-center shadow-xl breathe-glow ${
            orderComplete.payment_pending ? 'text-amber-500 shadow-amber-100' : 'text-emerald-500 shadow-emerald-100'
          }`}>
            <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {orderComplete.payment_pending ? 'pending' : 'verified'}
            </span>
          </div>
        </div>
        <h1 className="text-4xl font-black text-theme-text mb-2 font-headline">{t('order_placed')}</h1>
        {orderComplete.payment_pending ? (
          <p className="text-xl text-amber-600 mb-10 font-medium">Receipt <span className="font-bold">#{orderComplete.order_number}</span> created. <br/><span className="text-base text-theme-text-muted">Online payment is still pending. You can collect it from the order detail page.</span></p>
        ) : (
          <p className="text-xl text-theme-text-muted mb-10 font-medium">Receipt <span className="text-primary font-bold">#{orderComplete.order_number}</span> has been generated.</p>
        )}
        <div className="flex gap-4">
          <button 
            onClick={() => { setOrderComplete(null); setCart([]); setSelectedCustomer(null); setPayments([]); setCurrentStep(2); }}
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
    { icon: 'person', label: t('customer_sidebar'), step: 1 },
    { icon: 'dry_cleaning', label: t('service_type_label'), step: 2 },
    { icon: 'schedule', label: t('schedule'), step: 3 },
    { icon: 'payments', label: t('payment'), step: 4 },
  ];

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] lg:min-h-0">
      {/* Razorpay Checkout Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
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
          <ServiceCatalog 
            garmentTypes={garmentTypes}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            getCategoryIcon={getCategoryIcon}
            getGarmentIcon={getGarmentIcon}
            pricing={pricing}
            addToCart={addToCart}
            setShowAddCategoryModal={setShowAddCategoryModal}
            handleAddCustomGarment={handleAddCustomGarment}
            t={t}
          />

          <OrderCart 
            cart={cart}
            removeFromCart={removeFromCart}
            updateItemPrice={updateItemPrice}
            getGarmentIcon={getGarmentIcon}
            subtotal={subtotal}
            applicableVolDiscount={applicableVolDiscount}
            volDiscountInfo={volDiscountInfo}
            tax={tax}
            couponData={couponData}
            couponDiscount={couponDiscount}
            redeemedPoints={redeemedPoints}
            total={total}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            handleApplyCoupon={handleApplyCoupon}
            setCurrentStep={setCurrentStep}
            setItemEditIndex={setItemEditIndex}
            setItemEditData={setItemEditData}
            setStainError={setStainError}
            setShowItemEditModal={setShowItemEditModal}
            selectedCustomer={selectedCustomer}
            t={t}
            // Customer Section is nested here in the design
            customerHeader={
              <CustomerSection 
                selectedCustomer={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer}
                isCustomerSearchOpen={isCustomerSearchOpen}
                setIsCustomerSearchOpen={setIsCustomerSearchOpen}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredCustomers={filteredCustomers}
                isInlineCreating={isInlineCreating}
                setIsInlineCreating={setIsInlineCreating}
                inlineError={inlineError}
                setInlineError={setInlineError}
                newCustomer={newCustomer}
                setNewCustomer={setNewCustomer}
                handleCreateCustomer={handleCreateCustomer}
                setCurrentStep={setCurrentStep}
                t={t}
              />
            }
          />
        </div>
      )}

      {/* Schedule Step */}
      {currentStep === 3 && (
        <ScheduleSection 
          schedule={schedule}
          setSchedule={setSchedule}
          setCurrentStep={setCurrentStep}
          t={t}
        />
      )}

      {/* Payment Step */}
      {currentStep === 4 && (
        <PaymentSection 
          total={total}
          payments={payments}
          setPayments={setPayments}
          payAtPickup={payAtPickup}
          setPayAtPickup={setPayAtPickup}
          selectedCustomer={selectedCustomer}
          redeemedPoints={redeemedPoints}
          setRedeemedPoints={setRedeemedPoints}
          totalRaw={totalRaw}
          submitting={submitting}
          handleSubmitOrder={handleSubmitOrder}
          setCurrentStep={setCurrentStep}
          t={t}
        />
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
              <div>
                <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest block mb-1">Fabric Hint (Optional)</label>
                <input
                  type="text"
                  className="w-full bg-theme-surface-container border border-transparent rounded-xl p-3 text-sm font-bold focus:bg-theme-surface focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                  value={itemEditData.fabric_hint}
                  onChange={e => setItemEditData({ ...itemEditData, fabric_hint: e.target.value })}
                  placeholder="e.g. silk, wool, cotton"
                />
              </div>
              <div className="bg-theme-surface-container rounded-xl p-3 border border-theme-border">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-theme-text">ML Stain Scan</p>
                    <p className="text-[10px] text-theme-text-muted">Using mock stub now. Real model endpoint later.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setStainError(''); setShowStainCapture(true); }}
                    disabled={stainAnalyzing}
                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {stainAnalyzing ? 'Analyzing...' : 'Scan Stain'}
                  </button>
                </div>
                {stainError && (
                  <p className="mt-2 text-[10px] font-bold text-red-600">{stainError}</p>
                )}
                {itemEditData.stain_analysis?.stains?.[0] && (
                  <div className="mt-3 p-2 rounded-lg bg-theme-surface border border-theme-border">
                    <p className="text-[10px] font-black text-theme-text uppercase tracking-widest">
                      Detected: {itemEditData.stain_analysis.stains[0].label}
                    </p>
                    <p className="text-[10px] text-theme-text-muted">
                      Confidence: {Math.round((itemEditData.stain_analysis.stains[0].confidence || 0) * 100)}% • Model: {itemEditData.stain_analysis.model_version}
                    </p>
                    {itemEditData.stain_analysis.recommendations?.[0] && (
                      <p className="text-[10px] text-emerald-700 font-bold mt-1">
                        Recommended: {itemEditData.stain_analysis.recommendations[0].chemical} ({itemEditData.stain_analysis.recommendations[0].method})
                      </p>
                    )}
                  </div>
                )}
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
      {showStainCapture && (
        <PhotoCapture
          title="Stain Scanner"
          helperText="Take a clear photo of the stain area"
          confirmLabel="Analyze Stain"
          onCancel={() => setShowStainCapture(false)}
          onCapture={async (imageBase64) => {
            setShowStainCapture(false);
            setStainError('');
            setStainAnalyzing(true);
            try {
              const currentItem = cart[itemEditIndex] || {};
              const res = await fetch('/api/stain-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  image_base64: imageBase64,
                  garment_type: currentItem.garment_type || '',
                  fabric_hint: itemEditData.fabric_hint || '',
                }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Stain analysis failed');
              setItemEditData(prev => ({ ...prev, stain_analysis: data }));
            } catch (err) {
              setStainError(err.message || 'Could not analyze stain image');
            } finally {
              setStainAnalyzing(false);
            }
          }}
        />
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-on-surface/30 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-theme-surface rounded-[2.5rem] shadow-2xl border border-theme-border p-8 w-full max-w-md animate-scale-in">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">category</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-black font-headline text-theme-text">New Category</h2>
                <p className="text-xs font-medium text-theme-text-muted">Add a new garment type to your pricing</p>
              </div>
              <button onClick={() => setShowAddCategoryModal(false)} className="w-10 h-10 rounded-full hover:bg-theme-surface-container flex items-center justify-center text-theme-text-muted transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-5 mb-8">
              <div>
                <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest pl-2 mb-2 block">Garment Type *</label>
                <input
                  autoFocus
                  className="w-full bg-theme-surface-container border border-transparent rounded-2xl py-4 px-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all placeholder:text-theme-text-muted/50 outline-none"
                  placeholder="e.g. Silk Saree, Leather Jacket, Wedding Gown"
                  value={newCategory.garment_type}
                  onChange={e => setNewCategory({ ...newCategory, garment_type: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest pl-2 mb-2 block">Service Type</label>
                  <select
                    className="w-full bg-theme-surface-container border border-transparent rounded-2xl py-4 px-5 text-sm font-bold shadow-inner focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                    value={newCategory.service_type}
                    onChange={e => setNewCategory({ ...newCategory, service_type: e.target.value })}
                  >
                    {['Dry Cleaning', 'Washing', 'Ironing', 'Stain Removal', 'Express Service', 'Polishing', 'Wash & Fold (Per Kg)', 'Premium Dry Clean Bundle'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest pl-2 mb-2 block">Price (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-theme-text-muted font-black text-sm">₹</span>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-theme-surface-container border border-transparent rounded-2xl py-4 pl-10 pr-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all placeholder:text-theme-text-muted/50 outline-none font-headline text-lg"
                      placeholder="0"
                      value={newCategory.price}
                      onChange={e => setNewCategory({ ...newCategory, price: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                disabled={!newCategory.garment_type || !newCategory.price || addCategoryLoading}
                onClick={handleAddCategory}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-amber-900/10 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addCategoryLoading ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> Saving...</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">add_circle</span> Add to Pricing Matrix</>
                )}
              </button>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="w-full py-4 bg-theme-surface-container text-theme-text-muted rounded-2xl font-bold text-sm hover:bg-theme-surface-container/80 transition-colors"
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
