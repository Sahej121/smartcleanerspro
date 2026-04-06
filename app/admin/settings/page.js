'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useBranding } from '@/lib/BrandingContext';
import { TIERS } from '@/lib/tier-config';

export default function SettingsPage() {
  const { lang, changeLang, t, LANGUAGES } = useLanguage();
  const { systemName, systemLogo, updateBranding } = useBranding();
  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState('');
  const [userRole, setUserRole] = useState('');
  const [stores, setStores] = useState([]);
  const [currentTier, setCurrentTier] = useState('starter');
  const [storeCount, setStoreCount] = useState(0);
  const [showAddStore, setShowAddStore] = useState(false);
  const [newStore, setNewStore] = useState({ store_name: '', city: '', admin_name: '', admin_email: '', admin_phone: '' });
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeError, setStoreError] = useState('');

  const [settings, setSettings] = useState({
    storeName: 'CleanFlow',
    storePhone: '+91-9876543210',
    storeAddress: '123 Main Street',
    storeCity: 'New Delhi',
    currency: '₹',
    taxRate: '18',
  });

  useEffect(() => {
    const saved = localStorage.getItem('cleanflow_settings');
    if (saved) setSettings(JSON.parse(saved));
    // Get user role
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.role) setUserRole(d.role);
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
        if (data.length > 0) setCurrentTier(data[0].subscription_tier || 'starter');
      }
    } catch (e) { console.error(e); }
  };

  const handleSave = () => {
    localStorage.setItem('cleanflow_settings', JSON.stringify(settings));
    setMessage(t('settings_saved') || 'Settings saved successfully');
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
        setNewStore({ store_name: '', city: '', admin_name: '', admin_email: '', admin_phone: '' });
        setMessage(`Store "${data.store_name}" created! Temp password: ${data.tempPassword}`);
        setTimeout(() => setMessage(''), 8000);
        fetchStores();
      }
    } catch (e) {
      setStoreError('Network error');
    }
    setStoreLoading(false);
  };

  const handleTierChange = async (storeId, tier) => {
    try {
      const res = await fetch(`/api/stores/${storeId}/tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      if (res.ok) {
        setMessage(`Tier updated to ${TIERS[tier].label}!`);
        setTimeout(() => setMessage(''), 3000);
        fetchStores();
      }
    } catch (e) { console.error(e); }
  };

  const tierConfig = TIERS[currentTier] || TIERS.starter;
  const canAdd = tierConfig.maxStores === -1 || storeCount < tierConfig.maxStores;

  const tabs = [
    { id: 'general', label: t('general') || 'General', icon: 'settings' },
    { id: 'language', label: t('language') || 'Language', icon: 'language' },
    { id: 'appearance', label: t('appearance') || 'Appearance', icon: 'palette' },
    ...(userRole === 'owner' ? [
      { id: 'stores', label: t('stores') || 'Stores', icon: 'store' },
      { id: 'subscription', label: t('subscription') || 'Subscription', icon: 'workspace_premium' },
    ] : []),
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-fade-in-up">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">{t('settings') || 'Settings'}</h1>
          <p className="text-on-surface-variant font-medium text-lg">{t('customize_appearance') || 'Customize the look and feel of your atelier dashboard.'}</p>
        </div>
        {activeTab === 'general' && (
          <button 
            onClick={handleSave}
            className="px-6 py-3 primary-gradient text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-900/10 active:scale-95 transition-all shimmer-btn flex items-center gap-2"
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
        <div className="w-full md:w-64 bg-white rounded-3xl p-3 border border-slate-100 shadow-sm shrink-0">
          <div className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <span className={`material-symbols-outlined ${activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-[2rem] p-10 border border-slate-100 shadow-sm min-h-[500px]">
          {activeTab === 'general' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-on-surface font-headline mb-1">{t('general') || 'General'}</h2>
                <p className="text-sm font-medium text-slate-500">{t('configure_store') || 'Configure your primary store details and operational formats.'}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 max-w-2xl">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 font-label">{t('store_name') || 'Store Name'}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">storefront</span>
                    <input 
                      className="w-full bg-slate-50 border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-white placeholder:text-slate-300 transition-all outline-none text-on-surface" 
                      value={settings.storeName} 
                      onChange={e => setSettings({...settings, storeName: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 font-label">{t('store_phone') || 'Store Phone'}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">call</span>
                    <input 
                      className="w-full bg-slate-50 border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-white placeholder:text-slate-300 transition-all outline-none text-on-surface" 
                      value={settings.storePhone} 
                      onChange={e => setSettings({...settings, storePhone: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 font-label">{t('store_address') || 'Store Address'}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">location_on</span>
                    <input 
                      className="w-full bg-slate-50 border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-white placeholder:text-slate-300 transition-all outline-none text-on-surface" 
                      value={settings.storeAddress} 
                      onChange={e => setSettings({...settings, storeAddress: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 font-label">{t('store_city') || 'Store City'}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">location_city</span>
                    <input 
                      className="w-full bg-slate-50 border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-white placeholder:text-slate-300 transition-all outline-none text-on-surface" 
                      value={settings.storeCity} 
                      onChange={e => setSettings({...settings, storeCity: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 font-label">{t('currency') || 'Currency'}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">payments</span>
                      <input 
                        className="w-full bg-slate-50 border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-white placeholder:text-slate-300 transition-all outline-none text-on-surface" 
                        value={settings.currency} 
                        onChange={e => setSettings({...settings, currency: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 font-label">{t('tax_rate') || 'Tax Rate (%)'}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">percent</span>
                      <input 
                        className="w-full bg-slate-50 border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-white placeholder:text-slate-300 transition-all outline-none text-on-surface" 
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
                <h2 className="text-2xl font-black text-on-surface font-headline mb-1">{t('language') || 'Localization'}</h2>
                <p className="text-sm font-medium text-slate-500">{t('choose_language') || 'Choose the primary language for your dashboard interface.'}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {LANGUAGES?.map(l => (
                  <button
                    key={l.code}
                    onClick={() => changeLang(l.code)}
                    className={`flex items-center gap-4 p-5 rounded-3xl border transition-all text-left ${
                      lang === l.code 
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-4 ring-emerald-500/10' 
                        : 'border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black uppercase tracking-widest text-xs transition-colors ${
                      lang === l.code ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {l.code}
                    </div>
                    <div>
                      <div className={`font-bold transition-colors ${lang === l.code ? 'text-emerald-900' : 'text-on-surface'}`}>
                        {l.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Primary UI</div>
                    </div>
                  </button>
                ))}
                {!LANGUAGES && (
                   <p className="text-sm text-slate-500 col-span-3">Language context not loaded.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-on-surface font-headline mb-1">{t('appearance') || 'Appearance'}</h2>
                <p className="text-sm font-medium text-slate-500">Manage your system's visual identity and branding guidelines.</p>
              </div>

              <div className="space-y-6 max-w-2xl">
                <div className="bg-surface-container-low p-6 rounded-3xl border border-slate-50 flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-20 h-20 bg-emerald-600 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-emerald-900/20 text-4xl font-black shrink-0">
                    {systemLogo || '🏢'}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-on-surface text-lg">{systemName || 'CleanFlow Atelier'}</h3>
                    <p className="text-xs font-medium text-slate-400">Current active branding. These elements appear on the sidebar and customer receipts.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 font-label">System Title</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">text_fields</span>
                      <input 
                        className="w-full bg-slate-50 border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-white placeholder:text-slate-300 transition-all outline-none text-on-surface" 
                        value={systemName} 
                        onChange={e => updateBranding(e.target.value, systemLogo)} 
                        placeholder="e.g. CleanFlow Pristine"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 font-label">System Icon (Emoji/Char)</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">emoji_emotions</span>
                      <input 
                        className="w-full bg-slate-50 border border-transparent rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-white placeholder:text-slate-300 transition-all outline-none text-on-surface" 
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
                  <h2 className="text-2xl font-black text-on-surface font-headline mb-1">Store Management</h2>
                  <p className="text-sm font-medium text-slate-500">Manage all your stores across locations.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    currentTier === 'pro' ? 'bg-emerald-100 text-emerald-700' :
                    currentTier === 'growth' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    <span className="material-symbols-outlined text-xs mr-1 align-middle">{TIERS[currentTier]?.icon}</span>
                    {TIERS[currentTier]?.label} Plan
                  </span>
                  <button
                    onClick={() => canAdd ? setShowAddStore(true) : null}
                    disabled={!canAdd}
                    className={`px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${
                      canAdd
                        ? 'primary-gradient text-white shadow-lg shadow-emerald-900/10 active:scale-95 shimmer-btn'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
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
                  Your {TIERS[currentTier]?.label} plan supports up to {TIERS[currentTier]?.maxStores} store(s). 
                  <button onClick={() => setActiveTab('subscription')} className="underline ml-1 text-amber-900 hover:text-amber-700">Upgrade →</button>
                </div>
              )}

              {/* Add Store Modal */}
              {showAddStore && (
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-6 animate-fade-in">
                  <h3 className="text-lg font-black text-on-surface font-headline">Register New Store</h3>
                  {storeError && (
                    <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {storeError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'store_name', label: 'Store Name', icon: 'storefront', ph: 'e.g. CleanFlow South Delhi' },
                      { key: 'city', label: 'City', icon: 'location_city', ph: 'e.g. New Delhi' },
                      { key: 'admin_name', label: 'Manager Name', icon: 'person', ph: 'e.g. Rahul Kumar' },
                      { key: 'admin_email', label: 'Manager Email', icon: 'email', ph: 'e.g. rahul@cleanflow.com' },
                      { key: 'admin_phone', label: 'Manager Phone', icon: 'call', ph: 'e.g. +91-9876543210' },
                    ].map(f => (
                      <div key={f.key} className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">{f.label}</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">{f.icon}</span>
                          <input
                            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-emerald-300 placeholder:text-slate-300 transition-all outline-none text-on-surface"
                            placeholder={f.ph}
                            value={newStore[f.key]}
                            onChange={e => setNewStore({ ...newStore, [f.key]: e.target.value })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleAddStore}
                      disabled={storeLoading || !newStore.store_name || !newStore.city || !newStore.admin_name || !newStore.admin_email}
                      className="px-6 py-3 primary-gradient text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-900/10 active:scale-95 transition-all shimmer-btn disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {storeLoading ? 'Creating...' : 'Create Store'}
                    </button>
                    <button onClick={() => { setShowAddStore(false); setStoreError(''); }} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Store List */}
              <div className="space-y-4">
                {stores.map((store, i) => (
                  <div key={store.id} className={`p-6 rounded-3xl border transition-all hover:shadow-md ${i === 0 ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-white'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-sm ${
                          i === 0 ? 'bg-emerald-600 text-white shadow-emerald-900/20' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <span className="material-symbols-outlined text-2xl">store</span>
                        </div>
                        <div>
                          <h3 className="font-black text-on-surface text-lg">{store.store_name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">location_on</span>
                              {store.city || 'N/A'}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              store.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                              store.status === 'suspended' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-500'
                            }`}>{store.status}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-800 text-white shadow-sm">
                              {TIERS[store.subscription_tier]?.label || 'Starter'} Plan
                            </span>
                            {i === 0 && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Primary</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-on-surface">₹{(parseFloat(store.total_revenue) || 0).toLocaleString('en-IN')}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{store.order_count || 0} Orders</div>
                      </div>
                    </div>
                  </div>
                ))}
                {stores.length === 0 && (
                  <div className="text-center py-16 text-slate-400">
                    <span className="material-symbols-outlined text-5xl mb-3 block">store</span>
                    <p className="font-bold">No stores found. Create your first store above.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== SUBSCRIPTION TAB ===== */}
          {activeTab === 'subscription' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-on-surface font-headline mb-1">Subscription Plans</h2>
                <p className="text-sm font-medium text-slate-500">Choose the plan that fits your business. Upgrade anytime.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(TIERS).map(([key, tier]) => {
                  const isCurrentTier = currentTier === key;
                  const colorMap = {
                    slate: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-600', ring: 'ring-slate-300', btn: 'bg-slate-600 hover:bg-slate-700' },
                    blue: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-600', ring: 'ring-blue-300', btn: 'bg-blue-600 hover:bg-blue-700' },
                    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-600', ring: 'ring-emerald-300', btn: 'primary-gradient' },
                  };
                  const c = colorMap[tier.color] || colorMap.slate;

                  return (
                    <div key={key} className={`rounded-3xl border-2 p-8 transition-all relative ${
                      isCurrentTier ? `${c.bg} ${c.border} ring-4 ${c.ring}/20 shadow-lg` : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}>
                      {isCurrentTier && (
                        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${c.badge} text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md`}>
                          Current Plan
                        </div>
                      )}
                      {key === 'pro' && !isCurrentTier && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                          Most Popular
                        </div>
                      )}
                      <div className="text-center mb-6 pt-2">
                        <span className="material-symbols-outlined text-4xl mb-2 block" style={{ color: isCurrentTier ? undefined : '#94a3b8' }}>{tier.icon}</span>
                        <h3 className="text-xl font-black text-on-surface">{tier.label}</h3>
                        <div className="text-3xl font-black text-on-surface mt-2">{tier.price}</div>
                      </div>
                      <ul className="space-y-3 mb-8">
                        {tier.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-slate-600">
                            <span className="material-symbols-outlined text-emerald-500 text-lg mt-0.5 shrink-0">check_circle</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      {isCurrentTier ? (
                        <button className="w-full py-3 rounded-2xl font-black text-sm bg-slate-100 text-slate-400 cursor-default">
                          Active
                        </button>
                      ) : (
                        <button
                          onClick={() => stores[0] && handleTierChange(stores[0].id, key)}
                          className={`w-full py-3 rounded-2xl font-black text-sm text-white shadow-lg active:scale-95 transition-all ${c.btn}`}
                        >
                          {Object.keys(TIERS).indexOf(key) > Object.keys(TIERS).indexOf(currentTier) ? 'Upgrade' : 'Switch'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
