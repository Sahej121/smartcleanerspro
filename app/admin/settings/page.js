'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useBranding } from '@/lib/BrandingContext';
import { TIERS, hasFeature, PRICING_MARKETS } from '@/lib/tier-config';
import { formatCurrency, detectCountry } from '@/lib/currency-utils';

export default function SettingsPage() {
  const { lang, changeLang, t, LANGUAGES } = useLanguage();
  const router = useRouter();
  const { systemName, systemLogo, updateBranding } = useBranding();
  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [stores, setStores] = useState([]);
  const [currentTier, setCurrentTier] = useState('software_only');
  const [storeCount, setStoreCount] = useState(0);
  const [showAddStore, setShowAddStore] = useState(false);
  const [newStore, setNewStore] = useState({ 
    store_name: '', 
    city: '', 
    country: detectCountry(), // Auto-detect country
    manager_name: '', 
    manager_email: '' 
  });
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeError, setStoreError] = useState('');
  const [pinDetailsModal, setPinDetailsModal] = useState(null);
  const [confirmPinResetModal, setConfirmPinResetModal] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [showAdminUpgradeModal, setShowAdminUpgradeModal] = useState(null);
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState('');

  const [settings, setSettings] = useState({
    storeName: 'DrycleanersFlow',
    storePhone: '+91-9876543210',
    storeAddress: '123 Main Street',
    storeCity: 'New Delhi',
    currency: '£',
    taxRate: '18',
  });

  useEffect(() => {
    const saved = localStorage.getItem('cleanflow_settings');
    if (saved) setSettings(JSON.parse(saved));
    // Get user role
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' }).then(r => r.json()).then(d => {
      if (d.user) {
        setCurrentUser(d.user);
        setUserRole(d.user.role);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (userRole === 'owner' || userRole === 'manager') {
      fetchStores();
    }
  }, [userRole]);

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores');
      if (res.ok) {
        const data = await res.json();
        setStores(data);
        setStoreCount(data.length);
        if (data.length > 0) {
          const s = data[0];
          setCurrentTier(s.subscription_tier || 'software_only');
          // Sync settings state with the actual store data from DB
          setSettings(prev => ({
            ...prev,
            storeName: s.store_name || prev.storeName,
            storePhone: s.phone || prev.storePhone,
            storeAddress: s.address || prev.storeAddress,
            storeCity: s.city || prev.storeCity
          }));
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    localStorage.setItem('cleanflow_settings', JSON.stringify(settings));
    
    // Update the database for the primary store if we are authorized and stores exist
    if (stores.length > 0) {
      try {
        const res = await fetch(`/api/stores/${stores[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_name: settings.storeName,
            city: settings.storeCity,
            address: settings.storeAddress,
            phone: settings.storePhone
          })
        });
        
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update store in DB');
        }
        
        fetchStores();
        // Sync the branding (sidebar title) with the new store name immediately
        updateBranding(settings.storeName, systemLogo);
        setMessage(t('settings_saved') || 'Settings saved successfully');
      } catch (e) {
        console.error('Failed to update store in DB', e);
        setMessage(e.message || 'Error saving settings to database');
      }
    } else {
      setMessage(t('settings_saved') || 'Settings saved successfully');
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const handleAddStore = async () => {
    setStoreLoading(true);
    setStoreError('');
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStore),
      });
      const data = await res.json();
      if (!res.ok) {
        setStoreError(data.error || 'Failed to create store');
      } else {
        setShowAddStore(false);
        setNewStore({ 
          store_name: '', 
          city: '', 
          country: detectCountry(),
          manager_name: '', 
          manager_email: '' 
        });
        
        // If a manager was provisioned, show the credentials modal
        if (data.manager) {
          setPinDetailsModal({
            storeName: data.store_name,
            managerName: data.manager.name,
            managerEmail: data.manager.email,
            newPin: data.manager.tempPin
          });
        }
        
        setMessage(`Store "${data.store_name}" created and automatically assigned to your account.`);
        setTimeout(() => setMessage(''), 4000);
        fetchStores();
      }
    } catch (e) {
      setStoreError('Network error');
    }
    setStoreLoading(false);
  };

  const handleTierChange = async (storeId, tier, isPaymentConfirmed = false) => {
    try {
      const res = await fetch(`/api/stores/${storeId}/tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, payment_confirmed: isPaymentConfirmed }),
      });
      if (res.ok) {
        setMessage(`Tier updated to ${TIERS[tier]?.label || tier}!`);
        setTimeout(() => setMessage(''), 3000);
        fetchStores();
        setShowPaymentModal(null);
        setShowAdminUpgradeModal(null);
      } else {
        const err = await res.json();
        setMessage(err.error || 'Failed to change tier');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (e) {
      console.error('Failed to change tier', e);
      setMessage('Network error while changing tier.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

   const handleResetManagerPin = async (store) => {
    setConfirmPinResetModal(null); // Close confirm modal
    
    try {
      const res = await fetch(`/api/stores/${store.id}/reset-pin`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        setPinDetailsModal({
          storeName: store.store_name,
          managerName: data.manager_name,
          managerEmail: data.manager_email,
          newPin: data.new_pin
        });
      } else {
        setMessage(data.error || 'Failed to reset manager PIN');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (e) {
      console.error('Failed to reset manager PIN', e);
    }
  };



  const tierConfig = TIERS[currentTier] || TIERS.software_only;
  const canAdd = tierConfig.maxStores === -1 || storeCount < tierConfig.maxStores;

  const getMarketForCountry = (country = '') => {
    const normalized = country.trim().toLowerCase();
    if (['india', 'in'].includes(normalized)) return 'india';
    if (['united arab emirates', 'uae', 'ae', 'saudi arabia', 'sa', 'qatar', 'qa', 'kuwait', 'kw', 'oman', 'om', 'bahrain', 'bh'].includes(normalized)) return 'uae';
    if (['united states', 'usa', 'us'].includes(normalized)) return 'us';
    if (['mexico', 'mx', 'brazil', 'br', 'argentina', 'ar', 'colombia', 'co', 'chile', 'cl', 'peru', 'pe', 'panama', 'pa', 'uruguay', 'uy'].includes(normalized)) return 'latam';
    if (['united kingdom', 'uk', 'gb', 'germany', 'de', 'france', 'fr', 'italy', 'it', 'spain', 'es', 'netherlands', 'nl', 'sweden', 'se', 'norway', 'no', 'switzerland', 'ch'].includes(normalized)) return 'europe';
    return 'us';
  };

  const proceedWithUpgrade = () => {
    if (!showAdminUpgradeModal || !selectedUpgradeTier) return;
    const selectedMarket = showAdminUpgradeModal.market || 'us';
    const market = PRICING_MARKETS[selectedMarket] || PRICING_MARKETS.us;
    const tier = TIERS[selectedUpgradeTier];

    if (currentUser?.id === 1) {
      handleTierChange(showAdminUpgradeModal.storeId, selectedUpgradeTier, true);
      return;
    }

    if (selectedUpgradeTier === 'enterprise') {
      setShowAdminUpgradeModal(null);
      setSelectedUpgradeTier('');
      router.push('/contact');
      return;
    }

    const basePrice = parseFloat((market.prices[selectedUpgradeTier] || '0').toString().replace(/,/g, ''));
    setShowAdminUpgradeModal(null);
    setSelectedUpgradeTier('');
    router.push(`/checkout?tier=${selectedUpgradeTier}&market=${selectedMarket}&planName=${encodeURIComponent(tier.label)}&price=${basePrice}`);
  };

  const getStoreLimitLabel = (maxStores) => (maxStores === -1 ? 'Unlimited stores' : `Up to ${maxStores} store${maxStores > 1 ? 's' : ''}`);
  const openUpgradePage = (store) => {
    const market = getMarketForCountry(store.country);
    const params = new URLSearchParams({
      storeId: String(store.id),
      storeName: store.store_name || 'Store',
      currentTier: store.subscription_tier || 'software_only',
      market,
    });
    router.push(`/admin/settings/upgrade?${params.toString()}`);
  };

  const tabs = [
    { id: 'general', label: t('general') || 'General', icon: 'settings' },
    { id: 'language', label: t('language') || 'Language', icon: 'language' },
    ...(hasFeature(currentTier, 'whiteLabel') ? [
      { id: 'appearance', label: t('appearance') || 'Appearance', icon: 'palette' },
    ] : []),
    ...(userRole === 'owner' ? [
      { id: 'stores', label: t('stores') || 'Stores', icon: 'store' },
    ] : []),
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-fade-in-up">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-theme-text mb-2 font-headline">{t('settings') || 'Settings'}</h1>
          <p className="text-theme-text-variant font-medium text-lg">{t('customize_appearance') || 'Customize the look and feel of your atelier dashboard.'}</p>
        </div>
        {activeTab === 'general' && (
          <button 
            onClick={handleSave}
            className="px-6 py-3 primary-gradient text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-900/10 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {t('save_settings') || 'Save Settings'}
          </button>
        )}
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-6 py-4 rounded-2xl font-bold flex items-center gap-3 animate-fade-in-up shadow-sm">
          <span className="material-symbols-outlined text-emerald-600">check_circle</span>
          {message}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 items-start animate-fade-in-up stagger-1">
        {/* Settings Sidebar Tabs */}
        <div className="w-full md:w-64 bg-theme-surface rounded-3xl p-3 border border-theme-border shadow-sm shrink-0">
          <div className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-theme-text-muted hover:bg-theme-surface-container hover:text-theme-text'
                }`}
              >
                <span className={`material-symbols-outlined ${activeTab === tab.id ? 'text-emerald-600' : 'text-theme-text-muted'}`}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-theme-surface rounded-[2rem] p-10 border border-theme-border shadow-sm min-h-[500px]">
          {activeTab === 'general' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-theme-text font-headline mb-1">{t('general') || 'General'}</h2>
                <p className="text-sm font-medium text-theme-text-muted">{t('configure_store') || 'Configure your primary store details and operational formats.'}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 max-w-2xl">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-widest pl-1 font-label">{t('store_name') || 'Store Name'}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted text-lg">storefront</span>
                    <input 
                      className="w-full bg-theme-surface-container border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-theme-surface placeholder:text-theme-text-muted/50 transition-all outline-none text-theme-text" 
                      value={settings.storeName} 
                      onChange={e => setSettings({...settings, storeName: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-widest pl-1 font-label">{t('store_phone') || 'Store Phone'}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted text-lg">call</span>
                    <input 
                      className="w-full bg-theme-surface-container border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-theme-surface placeholder:text-theme-text-muted/50 transition-all outline-none text-theme-text" 
                      value={settings.storePhone} 
                      onChange={e => setSettings({...settings, storePhone: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-widest pl-1 font-label">{t('store_address') || 'Store Address'}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted text-lg">location_on</span>
                    <input 
                      className="w-full bg-theme-surface-container border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-theme-surface placeholder:text-theme-text-muted/50 transition-all outline-none text-theme-text" 
                      value={settings.storeAddress} 
                      onChange={e => setSettings({...settings, storeAddress: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-widest pl-1 font-label">{t('store_city') || 'Store City'}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted text-lg">location_city</span>
                    <input 
                      className="w-full bg-theme-surface-container border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-theme-surface placeholder:text-theme-text-muted/50 transition-all outline-none text-theme-text" 
                      value={settings.storeCity} 
                      onChange={e => setSettings({...settings, storeCity: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-widest pl-1 font-label">{t('currency') || 'Currency'}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted text-lg">payments</span>
                      <input 
                        className="w-full bg-theme-surface-container border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-theme-surface placeholder:text-theme-text-muted/50 transition-all outline-none text-theme-text" 
                        value={settings.currency} 
                        onChange={e => setSettings({...settings, currency: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-widest pl-1 font-label">{t('tax_rate') || 'Tax Rate (%)'}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted text-lg">percent</span>
                      <input 
                        className="w-full bg-theme-surface-container border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-theme-surface placeholder:text-theme-text-muted/50 transition-all outline-none text-theme-text" 
                        type="number" 
                        value={settings.taxRate} 
                        onChange={e => setSettings({...settings, taxRate: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-theme-text font-headline mb-1">{t('language') || 'Localization'}</h2>
                <p className="text-sm font-medium text-theme-text-muted">{t('choose_language') || 'Choose the primary language for your dashboard interface.'}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {LANGUAGES?.map(l => (
                  <button
                    key={l.code}
                    onClick={() => changeLang(l.code)}
                    className={`flex items-center gap-4 p-5 rounded-3xl border transition-all text-left ${
                      lang === l.code 
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-4 ring-emerald-500/10' 
                        : 'border-theme-border bg-theme-surface hover:bg-theme-surface-container hover:border-theme-text-muted/30'
                    }`}
                  >
                    <div className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black uppercase tracking-widest text-xs transition-colors ${
                      lang === l.code ? 'bg-emerald-200 text-emerald-800' : 'bg-theme-border text-theme-text-muted'
                    }`}>
                      {l.code}
                    </div>
                    <div>
                      <div className={`font-bold transition-colors ${lang === l.code ? 'text-emerald-900' : 'text-theme-text'}`}>
                        {l.name}
                      </div>
                      <div className="text-[10px] text-theme-text-muted font-bold uppercase tracking-widest mt-0.5">Primary UI</div>
                    </div>
                  </button>
                ))}
                {!LANGUAGES && (
                   <p className="text-sm text-theme-text-muted col-span-3">Language context not loaded.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-theme-text font-headline mb-1">{t('appearance') || 'Appearance'}</h2>
                <p className="text-sm font-medium text-theme-text-muted">{t('appearance_desc')}</p>
              </div>

              <div className="space-y-6 max-w-2xl">
                <div className="bg-surface-container-low p-6 rounded-3xl border border-slate-50 flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-20 h-20 bg-emerald-600 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-emerald-900/20 text-4xl font-black shrink-0">
                    {systemLogo || '🏢'}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-theme-text text-lg">{systemName || 'DrycleanersFlow Atelier'}</h3>
                    <p className="text-xs font-medium text-theme-text-muted">{t('active_branding_desc')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-widest pl-1 font-label">{t('system_title')}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted text-lg">text_fields</span>
                      <input 
                        className="w-full bg-theme-surface-container border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-theme-surface placeholder:text-theme-text-muted/50 transition-all outline-none text-theme-text" 
                        value={systemName} 
                        onChange={e => updateBranding(e.target.value, systemLogo)} 
                        placeholder="e.g. DrycleanersFlow Pristine"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-widest pl-1 font-label">{t('system_icon')}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted text-lg">emoji_emotions</span>
                      <input 
                        className="w-full bg-theme-surface-container border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-theme-surface placeholder:text-theme-text-muted/50 transition-all outline-none text-theme-text" 
                        value={systemLogo} 
                        onChange={e => updateBranding(systemName, e.target.value)} 
                        placeholder="e.g. 🍃"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== STORES TAB ===== */}
          {activeTab === 'stores' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-theme-text font-headline mb-1">{t('store_management')}</h2>
                  <p className="text-sm font-medium text-theme-text-muted">{t('store_management_desc')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    currentTier === 'hardware_bundle' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    <span className="material-symbols-outlined text-xs mr-1 align-middle">{TIERS[currentTier]?.icon}</span>
                    {TIERS[currentTier]?.label} Plan
                  </span>
                  <button
                    onClick={() => canAdd ? setShowAddStore(true) : null}
                    disabled={!canAdd}
                    className={`px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${
                      canAdd
                        ? 'primary-gradient text-white shadow-lg shadow-emerald-900/10 active:scale-95'
                        : 'bg-theme-border text-theme-text-muted cursor-not-allowed'
                    }`}
                    title={!canAdd ? `Your ${TIERS[currentTier]?.label} plan allows up to ${TIERS[currentTier]?.maxStores} store(s).` : ''}
                  >
                    <span className="material-symbols-outlined text-lg">add_business</span>
                    Add Store
                  </button>
                </div>
              </div>

              {!canAdd && (
                <div className="bg-amber-50 border border-amber-100 text-amber-800 px-6 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-sm">
                  <span className="material-symbols-outlined text-amber-600">lock</span>
                  {t('plan_limit_msg').replace('{tier}', tierConfig.label).replace('{max}', tierConfig.maxStores)} 
                  {stores[0] && (
                    <button 
                      onClick={() => openUpgradePage(stores[0])}
                      className="underline ml-1 text-amber-900 hover:text-amber-700"
                    >
                      Upgrade →
                    </button>
                  )}
                </div>
              )}

              {/* Add Store Modal */}
              {showAddStore && (
                <div className="bg-theme-surface-container border border-theme-border rounded-3xl p-8 space-y-6 animate-fade-in">
                  <h3 className="text-lg font-black text-theme-text font-headline">{t('register_new_store')}</h3>
                  {storeError && (
                    <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {storeError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'store_name', label: 'Store Name', icon: 'storefront', ph: 'e.g. DrycleanersFlow South Delhi' },
                      { key: 'city', label: 'City', icon: 'location_city', ph: 'e.g. New Delhi' },
                      { key: 'manager_name', label: 'Manager Name', icon: 'person', ph: 'e.g. John Doe' },
                      { key: 'manager_email', label: 'Manager Email', icon: 'mail', ph: 'e.g. manager@store.com' },
                    ].map(f => (
                      <div key={f.key} className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-widest pl-1">{f.label}</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-text-muted text-lg">{f.icon}</span>
                          <input
                            className="w-full bg-theme-surface border border-theme-border rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-emerald-300 placeholder:text-theme-text-muted/50 transition-all outline-none text-theme-text"
                            placeholder={f.ph}
                            value={newStore[f.key]}
                            onChange={e => setNewStore({ ...newStore, [f.key]: e.target.value })}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-widest pl-1">{t('country_region')}</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-text-muted text-lg">public</span>
                        <select 
                          className="w-full bg-theme-surface border border-theme-border rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-emerald-300 transition-all outline-none appearance-none text-theme-text"
                          value={newStore.country}
                          onChange={(e) => setNewStore({ ...newStore, country: e.target.value })}
                        >
                          <option value="India">India</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="United States">United States</option>
                          <option value="Germany">Germany</option>
                          <option value="France">France</option>
                          <option value="Australia">Australia</option>
                          <option value="New Zealand">New Zealand</option>
                          <option value="Canada">Canada</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleAddStore}
                      disabled={storeLoading || !newStore.store_name || !newStore.city}
                      className="px-6 py-3 primary-gradient text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-900/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {storeLoading ? t('creating') : t('create_store_btn')}
                    </button>
                    <button onClick={() => { setShowAddStore(false); setStoreError(''); }} className="px-6 py-3 bg-theme-border text-theme-text-muted rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Store List */}
              <div className="space-y-4">
                {stores.map((store, i) => {
                  const tierInfo = TIERS[store.subscription_tier] || TIERS.software_only;
                  const badgeStyles = tierInfo.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                                      tierInfo.color === 'purple' ? 'bg-purple-50 text-purple-700 border-purple-200/60' :
                                      'bg-blue-50 text-blue-700 border-blue-200/60';
                  
                  return (
                  <div key={store.id || store.owner_id || i} className={`group relative p-6 rounded-3xl border transition-all duration-300 hover:shadow-2xl hover:shadow-theme-text/5 hover:-translate-y-1 ${store.status === 'suspended' ? 'bg-red-50/20 border-red-200 grayscale-[0.3]' : 'bg-theme-surface border-theme-border hover:border-emerald-200 hover:bg-emerald-50/30'}`}>
                    {store.status === 'suspended' && (
                       <div className="absolute top-0 right-8 -translate-y-1/2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-red-600/20 flex items-center gap-2">
                         <span className="material-symbols-outlined text-[14px]">warning</span>
                         Suspended by Plan
                       </div>
                    )}
                    {i === 0 && store.status !== 'suspended' && <div className="absolute top-0 right-8 -translate-y-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-emerald-600/20">{t('primary_store')}</div>}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-sm shrink-0 transition-transform group-hover:scale-105 ${
                          i === 0 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-900/20' : 'bg-theme-surface-container text-theme-text-muted border border-theme-border'
                        }`}>
                          <span className="material-symbols-outlined text-2xl">{tierInfo.icon || 'store'}</span>
                        </div>
                        <div className="pt-0.5">
                          <h3 className="font-black text-theme-text text-xl mb-1.5">{store.store_name}</h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-theme-text-muted flex items-center gap-1 bg-theme-surface-container px-2.5 py-1 rounded-lg border border-theme-border">
                              <span className="material-symbols-outlined text-[14px]">location_on</span>
                              {store.city || 'N/A'}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                              store.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              store.status === 'suspended' ? 'bg-red-50 text-red-700 border-red-100' :
                              'bg-theme-surface-container text-theme-text-muted border-theme-border'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
                              {store.status}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-sm ${badgeStyles}`}>
                               {tierInfo.label} Plan
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 border-theme-border pt-4 md:pt-0">
                        <div className="text-left md:text-right">
                        <div className="text-2xl font-black text-theme-text tracking-tight">{formatCurrency(parseFloat(store.total_revenue) || 0, store.country)}</div>
                          <div className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest mt-0.5">{store.order_count || 0} {t('orders')}</div>
                        </div>
                         <div className="flex items-center gap-2">
                           {i === 0 && (
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 openUpgradePage(store);
                               }}
                               className="relative overflow-hidden group/btn flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                               title="Upgrade Node Tier"
                             >
                               <div className="absolute inset-0 w-full h-full bg-theme-surface/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500 ease-out"></div>
                               <span className="material-symbols-outlined text-[16px]">upgrade</span>
                               Upgrade
                             </button>
                           )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmPinResetModal(store); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-theme-surface hover:bg-theme-surface-container text-theme-text-muted rounded-xl text-xs font-bold border border-theme-border shadow-sm active:scale-95 transition-all"
                            title="Reset Manager PIN"
                          >
                            <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                            Reset PIN
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )})}
                {stores.length === 0 && (
                  <div className="text-center py-16 text-theme-text-muted">
                    <span className="material-symbols-outlined text-5xl mb-3 block">store</span>
                    <p className="font-bold">No stores found. Create your first store above.</p>
                  </div>
                )}
              </div>
            </div>
          )}



           {/* PIN Details Modal */}
           {pinDetailsModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-theme-surface rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-fade-in scale-100">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl">vpn_key</span>
                  </div>
                  <h2 className="text-2xl font-black text-theme-text font-headline">{t('manager_pin_regenerated')}</h2>
                  <p className="text-sm font-medium text-theme-text-muted">{t('new_pin_issued_desc').replace('{store}', pinDetailsModal.storeName)}</p>
                  
                  <div className="bg-theme-surface-container p-6 rounded-3xl text-left space-y-3 border border-theme-border">
                    <div>
                      <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-widest block mb-1">Manager</label>
                      <div className="font-bold text-theme-text">{pinDetailsModal.managerName}</div>
                      <div className="text-xs text-theme-text-muted font-medium">{pinDetailsModal.managerEmail}</div>
                    </div>
                    <div className="pt-3 border-t border-theme-border/60">
                      <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-widest block mb-1">{t('new_access_pin')}</label>
                      <div className="text-4xl font-black text-emerald-600 tracking-[12px] py-2">{pinDetailsModal.newPin}</div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`Manager: ${pinDetailsModal.managerName}\nStore: ${pinDetailsModal.storeName}\nNew PIN: ${pinDetailsModal.newPin}`);
                        setMessage('Credentials copied to clipboard!');
                        setTimeout(() => setMessage(''), 2000);
                      }}
                      className="w-full py-4 bg-theme-border hover:bg-slate-200 text-theme-text rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">content_copy</span>
                      Copy Credentials
                    </button>
                    <button 
                      onClick={() => setPinDetailsModal(null)}
                      className="w-full py-4 primary-gradient text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/10 active:scale-95 transition-all"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
           )}

           {/* Confirmation Modal for PIN Reset */}
           {confirmPinResetModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-theme-surface rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-fade-in scale-100">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl">lock_reset</span>
                  </div>
                  <h2 className="text-2xl font-black text-theme-text font-headline">{t('regenerate_pin_title')}</h2>
                  <p className="text-sm font-medium text-theme-text-muted px-2">
                    {t('regenerate_pin_desc').replace('{store}', confirmPinResetModal.store_name)} 
                    <br/><br/>
                    The current PIN will stop working immediately, and the manager will need the new credentials to access the dashboard.
                  </p>
                  
                  <div className="pt-6 grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setConfirmPinResetModal(null)}
                      className="py-4 bg-theme-border hover:bg-slate-200 text-theme-text rounded-2xl font-black text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleResetManagerPin(confirmPinResetModal)}
                      className="py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-red-900/10 active:scale-95 transition-all"
                    >
                      Yes, Regenerate
                    </button>
                  </div>
                </div>
              </div>
            </div>
           )}

           {/* Mock Payment Modal */}
           {showPaymentModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-theme-surface rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-fade-in scale-100">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl">credit_card</span>
                  </div>
                  <h2 className="text-2xl font-black text-theme-text font-headline">{t('secure_checkout')}</h2>
                  <p className="text-sm font-medium text-theme-text-muted px-2">
                    {t('upgrading_to').replace('{tier}', showPaymentModal.tierLabel)}
                    <br/>
                    Total: <strong className="text-emerald-600">{showPaymentModal.price}</strong>
                  </p>
                  
                  <div className="bg-theme-surface-container p-4 rounded-2xl border border-theme-border text-left mt-4">
                    <label className="text-[10px] font-black uppercase text-theme-text-muted tracking-widest block mb-1">{t('card_number')}</label>
                    <input disabled value="**** **** **** 4242" className="w-full bg-theme-border border-none rounded-xl py-2 px-3 text-sm font-bold text-theme-text-muted" />
                  </div>

                  <div className="pt-6 grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setShowPaymentModal(null)}
                      className="py-4 bg-theme-border hover:bg-slate-200 text-theme-text rounded-2xl font-black text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleTierChange(showPaymentModal.storeId, showPaymentModal.tier, true)}
                      className="py-4 primary-gradient text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">lock</span>
                      Pay & Upgrade
                    </button>
                  </div>
                </div>
              </div>
            </div>
           )}

           {/* Admin Upgrade Modal */}
           {showAdminUpgradeModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-theme-surface rounded-[2.5rem] w-full max-w-xl p-8 shadow-2xl animate-fade-in scale-100 border border-theme-border">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-2">
                    <span className="material-symbols-outlined text-4xl">admin_panel_settings</span>
                  </div>
                  <h2 className="text-3xl font-black text-theme-text font-headline tracking-tight">{t('manage_node_tier')}</h2>
                  <p className="text-sm font-medium text-theme-text-muted px-2 -mt-1">
                    {currentUser?.id === 1 ? `Superadmin override for store` : `Select the new tier for store`} <strong>{showAdminUpgradeModal.storeName}</strong>.
                  </p>
                  <div className="mx-auto max-w-sm rounded-2xl border border-theme-border bg-theme-surface-container px-4 py-3 text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted">Current plan</p>
                    <p className="text-sm font-black text-theme-text mt-1">{TIERS[showAdminUpgradeModal.currentTier]?.label || 'Software Only'}</p>
                  </div>

                  <div className="pt-3 space-y-3 text-left">
                    {Object.entries(TIERS).map(([key, tier]) => {
                      const selectedMarket = showAdminUpgradeModal.market || 'us';
                      const market = PRICING_MARKETS[selectedMarket] || PRICING_MARKETS.us;
                      const marketPrice = key === 'enterprise' ? 'Contact Sales' : `${market.currency}${market.prices[key] || '-'}/month`;
                      const isCurrent = showAdminUpgradeModal.currentTier === key;
                      const isSelected = selectedUpgradeTier === key;
                      const isRecommended = showAdminUpgradeModal.currentTier === 'software_only' && key === 'hardware_bundle';
                      return (
                      <button
                        key={key}
                        onClick={() => setSelectedUpgradeTier(key)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                            : 'border-theme-border bg-theme-surface hover:border-theme-text-muted/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className={`material-symbols-outlined mt-0.5 ${isSelected ? 'text-emerald-500' : 'text-theme-text-muted'}`}>{tier.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-theme-text block">{tier.label}</span>
                                {isRecommended && (
                                  <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Recommended</span>
                                )}
                              </div>
                              <span className="text-xs font-medium text-theme-text-muted">{marketPrice}</span>
                            </div>
                          </div>
                          {isCurrent ? (
                            <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Active</span>
                          ) : isSelected ? (
                            <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Selected</span>
                          ) : (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">Select</span>
                          )}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-theme-border bg-theme-surface-container px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-muted">Stores</p>
                            <p className="text-xs font-bold text-theme-text mt-1">{getStoreLimitLabel(tier.maxStores)}</p>
                          </div>
                          <div className="rounded-xl border border-theme-border bg-theme-surface-container px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-muted">Support</p>
                            <p className="text-xs font-bold text-theme-text mt-1">{tier.support || 'Standard support'}</p>
                          </div>
                        </div>
                      </button>
                    )})}
                  </div>
                  
                  <div className="pt-4">
                    <button
                      onClick={proceedWithUpgrade}
                      disabled={!selectedUpgradeTier || selectedUpgradeTier === showAdminUpgradeModal.currentTier}
                      className="w-full py-4 primary-gradient text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                    >
                      {selectedUpgradeTier === 'enterprise'
                        ? 'Continue to Contact Sales'
                        : currentUser?.id === 1
                          ? 'Apply Tier Change'
                          : 'Continue to Secure Checkout'}
                    </button>
                    <button 
                      onClick={() => {
                        setShowAdminUpgradeModal(null);
                        setSelectedUpgradeTier('');
                      }}
                      className="w-full py-4 bg-theme-border hover:bg-slate-200 text-theme-text rounded-2xl font-black text-sm transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
           )}

        </div>
      </div>
    </div>
  );
}
