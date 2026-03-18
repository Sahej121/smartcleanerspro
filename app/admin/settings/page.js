'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useBranding } from '@/lib/BrandingContext';

export default function SettingsPage() {
  const { lang, changeLang, t, LANGUAGES } = useLanguage();
  const { systemName, systemLogo, updateBranding } = useBranding();
  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState('');
  
  // Settings state
  const [settings, setSettings] = useState({
    storeName: 'CleanFlow',
    storePhone: '+91-9876543210',
    storeAddress: '123 Main Street',
    storeCity: 'New Delhi',
    currency: '₹',
    taxRate: '18',
    theme: 'light',
  });

  useEffect(() => {
    // Load saved settings if any
    const saved = localStorage.getItem('cleanflow_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    
    // Theme preference
    const savedTheme = localStorage.getItem('cleanflow_theme');
    if (savedTheme) setSettings(s => ({...s, theme: savedTheme}));
  }, []);

  const handleSave = () => {
    localStorage.setItem('cleanflow_settings', JSON.stringify(settings));
    if (settings.theme === 'dark' || settings.theme === 'light') {
      localStorage.setItem('cleanflow_theme', settings.theme);
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
      }
    }
    
    setMessage(t('settings_saved'));
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div id="settings-page">
      <div className="page-header">
        <div>
          <h1>{t('settings')}</h1>
          <p>{t('customize_appearance')}</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          {t('save_settings')}
        </button>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', background: 'var(--primary-50)', color: 'var(--primary-700)', borderRadius: 'var(--radius-md)', fontWeight: 500, marginBottom: '20px' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        {/* Settings Sidebar */}
        <div className="card" style={{ width: '240px', padding: '12px 0' }}>
          <button 
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
            style={{ width: '100%', padding: '12px 20px', textAlign: 'left', background: activeTab === 'general' ? 'var(--primary-50)' : 'transparent', color: activeTab === 'general' ? 'var(--primary-700)' : 'var(--text-secondary)', borderLeft: activeTab === 'general' ? '3px solid var(--primary-600)' : '3px solid transparent', fontWeight: activeTab === 'general' ? 600 : 500 }}
          >
            {t('general')}
          </button>
          <button 
            className={`settings-tab ${activeTab === 'language' ? 'active' : ''}`}
            onClick={() => setActiveTab('language')}
            style={{ width: '100%', padding: '12px 20px', textAlign: 'left', background: activeTab === 'language' ? 'var(--primary-50)' : 'transparent', color: activeTab === 'language' ? 'var(--primary-700)' : 'var(--text-secondary)', borderLeft: activeTab === 'language' ? '3px solid var(--primary-600)' : '3px solid transparent', fontWeight: activeTab === 'language' ? 600 : 500 }}
          >
            {t('language')}
          </button>
          <button 
            className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
            style={{ width: '100%', padding: '12px 20px', textAlign: 'left', background: activeTab === 'appearance' ? 'var(--primary-50)' : 'transparent', color: activeTab === 'appearance' ? 'var(--primary-700)' : 'var(--text-secondary)', borderLeft: activeTab === 'appearance' ? '3px solid var(--primary-600)' : '3px solid transparent', fontWeight: activeTab === 'appearance' ? 600 : 500 }}
          >
            {t('appearance')}
          </button>
        </div>

        {/* Settings Content */}
        <div className="card" style={{ flex: 1, minHeight: '400px' }}>
          {activeTab === 'general' && (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>{t('general')}</h2>
              <p className="text-muted" style={{ marginBottom: '24px' }}>{t('configure_store')}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">{t('store_name')}</label>
                  <input className="form-input" value={settings.storeName} onChange={e => setSettings({...settings, storeName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('store_phone')}</label>
                  <input className="form-input" value={settings.storePhone} onChange={e => setSettings({...settings, storePhone: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{t('store_address')}</label>
                  <input className="form-input" value={settings.storeAddress} onChange={e => setSettings({...settings, storeAddress: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('store_city')}</label>
                  <input className="form-input" value={settings.storeCity} onChange={e => setSettings({...settings, storeCity: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / span 1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">{t('currency')}</label>
                    <input className="form-input" value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">{t('tax_rate')}</label>
                    <input className="form-input" value={settings.taxRate} type="number" onChange={e => setSettings({...settings, taxRate: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>{t('language')}</h2>
              <p className="text-muted" style={{ marginBottom: '24px' }}>{t('choose_language')}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => changeLang(l.code)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
                      background: lang === l.code ? 'var(--primary-50)' : 'transparent',
                      border: lang === l.code ? '2px solid var(--primary-500)' : '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: lang === l.code ? 600 : 500, color: lang === l.code ? 'var(--primary-700)' : 'inherit' }}>
                        {l.name}
                      </div>
                      <div className="text-sm text-muted" style={{ textTransform: 'uppercase' }}>{l.code}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>{t('appearance')}</h2>
              <p className="text-muted" style={{ marginBottom: '24px' }}>{t('customize_appearance')}</p>
              
              <div className="form-group" style={{ maxWidth: '300px' }}>
                <label className="form-label">{t('theme')}</label>
                <select 
                  className="form-select" 
                  value={settings.theme} 
                  onChange={e => {
                    const newTheme = e.target.value;
                    setSettings({...settings, theme: newTheme});
                    if (newTheme === 'dark') {
                      document.documentElement.classList.add('dark-theme');
                    } else {
                      document.documentElement.classList.remove('dark-theme');
                    }
                  }}
                >
                  <option value="light">{t('light')}</option>
                  <option value="dark">{t('dark')}</option>
                  <option value="system">{t('system_theme')}</option>
                </select>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '24px', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>System Branding</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '600px' }}>
                  <div className="form-group">
                    <label className="form-label">System Name</label>
                    <input 
                      className="form-input" 
                      value={systemName} 
                      onChange={e => updateBranding(e.target.value, systemLogo)} 
                      placeholder="e.g. My Dry Cleaners"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">System Logo Icon</label>
                    <input 
                      className="form-input" 
                      value={systemLogo} 
                      onChange={e => updateBranding(systemName, e.target.value)} 
                      placeholder="e.g. 🏢 or C"
                      maxLength={2}
                    />
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
